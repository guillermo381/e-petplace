/**
 * `video-token` — EL EMISOR DEL TOKEN DE TELECONSULTA (S106-D, acto 3).
 *
 * Recibe un `cita_id`, autentica al que llama, **le pregunta a la DB si puede
 * entrar**, y sólo entonces emite un token de LiveKit de vida corta.
 *
 * ── LA REGLA QUE ORDENA TODO EL ARCHIVO ─────────────────────────────────────
 * 🔴 **Esta function NO decide nada.** El veredicto lo da
 * `puede_entrar_a_videollamada`, una RPC `DEFINER` que se apoya en los mismos
 * helpers que usa la RLS (`_user_es_familia_de_mascota`,
 * `empleado_tiene_capacidad_clinica`).
 *
 * *Lección de S103, aplicada: el veredicto de autenticación jamás vive en un
 * campo de log. Y su hermana, que es la que gobierna acá: **tampoco vive
 * repartido entre dos lugares que pueden divergir.** Si mañana nace un sexto
 * rol, se enmienda UNA función — no ésta y la RLS y este archivo.*
 *
 * ── EL TOKEN NO SE PERSISTE, Y ES DECISIÓN ──────────────────────────────────
 * 🔴 Existe en la base una tabla del legado, `cita_telemedicina_detalle`, con
 * columnas `token_prestador` y `token_cliente` (medida por A: 0 filas, ninguna
 * migración del monorepo la crea, ninguna función la nombra). **Este archivo
 * no la lee ni la escribe**, por cuatro razones medidas:
 *   ① un token es una credencial de vida corta — guardarlo lo desacopla de su
 *     ventana, y entonces la ventana deja de ser una defensa;
 *   ② su policy de SELECT alcanza a quien tenga acceso a la mascota ⇒ **el
 *     dueño podría leer el token del veterinario**;
 *   ③ su CHECK de `proveedor` sólo admite `{daily, whereby, zoom}` ⇒ **rebota
 *     `livekit`**;
 *   ④ trae `grabacion_url` y `grabacion_consentida`, y **la letra no menciona
 *     grabación en ninguna parte**.
 * *Conectarla "para completar la pieza" sería adoptar en silencio un modelo de
 * producto que nadie firmó.*
 *
 * ── SECRETOS ────────────────────────────────────────────────────────────────
 * `Deno.env.get()`, cargados con `supabase secrets set`. **El `vault` de
 * `L-408` NO aplica acá** (aceptado por la mesa): ese patrón resuelve el
 * secreto que `pg_cron` necesita para llamar una edge desde la DB. Una edge
 * llamada por la app lee su entorno.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { AccessToken } from 'npm:livekit-server-sdk@2.18.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON = Deno.env.get('SUPABASE_ANON_KEY');

const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL');
const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');

/** Vida del token. Corto a propósito: la ventana la manda la RPC, y un token
 *  que dura más que la consulta es un token que sobrevive a su razón. Si el
 *  cliente se cae y vuelve, pide otro — la RPC lo vuelve a autorizar. */
const TTL_SEGUNDOS = 15 * 60;

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Los rechazos de la RPC, mapeados a HTTP. Cada uno conserva SU código:
 *  colapsarlos en un 403 genérico manda a la familia a llamar a soporte
 *  cuando lo único que pasó es que llegó veinte minutos antes. */
const HTTP_POR_MOTIVO: Record<string, number> = {
  cita_inexistente: 404,
  ajeno_a_la_cita: 403,
  no_es_teleconsulta: 409,
  cita_no_pagada: 409,
  cita_cancelada: 409,
  /* Los dos de abajo salen del vocabulario REAL de `estado`, re-medido el
     26-ago contra el CHECK vivo: `no_realizable` lo creó S106-A para §5 de
     la letra, y `completada`/`no_show`/`rechazada` son actos ya ocurridos.
     *Una sala que sigue abierta después de que el veterinario cerró la
     consulta es una puerta sin dueño.* */
  cita_no_realizable: 409,
  cita_finalizada: 409,
  fuera_de_ventana: 425, // Too Early — es exactamente lo que pasó
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON) {
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    /* Se distingue del anterior a propósito: "falta Supabase" y "falta el
       proveedor de video" mandan a mirar lugares distintos. */
    return json({ ok: false, codigo: 'video_sin_configurar' }, 500);
  }

  // ── LA SESIÓN ES LA AUTORIZACIÓN — el uid jamás viene del cliente ─────────
  // Molde literal de `pagos-tarjetas`.
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return json({ ok: false, codigo: 'sin_sesion' }, 401);
  }

  const comoUsuario = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });

  const { data: u, error: eU } = await comoUsuario.auth.getUser();
  /* «No hay sesión» y «no se pudo verificar» son cosas distintas: tratarlas
     igual esconde una caída del proveedor de auth detrás de un 401 del
     usuario, y manda a la familia a revisar su contraseña por un problema
     nuestro. */
  if (eU) return json({ ok: false, codigo: 'sesion_no_verificable' }, 503);
  if (!u?.user) return json({ ok: false, codigo: 'sin_sesion' }, 401);
  const userId = u.user.id;

  // ── EL CUERPO ────────────────────────────────────────────────────────────
  let citaId: string | undefined;
  try {
    const body = await req.json();
    citaId = typeof body?.cita_id === 'string' ? body.cita_id.trim() : undefined;
  } catch {
    return json({ ok: false, codigo: 'cuerpo_invalido' }, 400);
  }
  if (!citaId) return json({ ok: false, codigo: 'cita_id_requerido' }, 400);

  // ── EL VEREDICTO — lo da la DB, no este archivo ──────────────────────────
  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const { data: veredicto, error: eV } = await db.rpc('puede_entrar_a_videollamada', {
    p_cita_id: citaId,
    p_user_id: userId,
  });

  if (eV) {
    /* No se disfraza de "no podés entrar": un fallo del servidor que se
       devuelve como denegación entrena a todos a leer un 403 como normal. */
    return json({ ok: false, codigo: 'veredicto_no_disponible' }, 503);
  }

  const v = veredicto as {
    puede?: boolean; rol?: string; sala?: string;
    identidad?: string; nombre?: string;
    motivo?: string; abre_en?: string;
  } | null;

  if (!v || v.puede !== true) {
    const motivo = v?.motivo ?? 'no_autorizado';
    return json(
      { ok: false, codigo: motivo, ...(v?.abre_en ? { abre_en: v.abre_en } : {}) },
      HTTP_POR_MOTIVO[motivo] ?? 403,
    );
  }

  // ── EL TOKEN ─────────────────────────────────────────────────────────────
  /* La sala la dice la RPC (es el id de la cita). No se acepta del cliente:
     un `room` que viene del body es un pase a la sala de cualquier otro. */
  const sala = v.sala ?? citaId;

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: v.identidad ?? userId,
    name: v.nombre ?? undefined,
    ttl: TTL_SEGUNDOS,
  });

  at.addGrant({
    room: sala,
    roomJoin: true,
    canPublish: true,     // sin esto no lo ven ni lo oyen
    canSubscribe: true,   // sin esto él no ve ni oye a nadie
    canPublishData: false,
    roomCreate: false,
    roomAdmin: false,
    /* 🔴 Explícito, no por omisión: `LETRA_TELEMEDICINA` no menciona grabación
       en ninguna parte. Un permiso de grabar que nadie decidió otorgar es la
       clase de cosa que aparece en una auditoría dos años después. */
    roomRecord: false,
  });

  const token = await at.toJwt();

  return json({
    ok: true,
    token,
    url: LIVEKIT_URL,
    sala,
    rol: v.rol,
    expira_en: new Date(Date.now() + TTL_SEGUNDOS * 1000).toISOString(),
  });
});
