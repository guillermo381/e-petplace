#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIEMBRA · un servicio SIN CERRAR, accionable — S114-E (8-sep-2026)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **PARA QUÉ.** Que la línea del HOY del prestador —«Tienes N servicios sin
 * cerrar. Ciérralos para cobrarlos.»— tenga un sujeto **ACCIONABLE** durante el
 * recorrido del founder.
 *
 * ── 🔴 LA PREMISA DEL PEDIDO ERA FALSA, Y SE DECLARA ANTES QUE NADA ──────
 * El pedido decía *«hoy sale en cero legítimamente: el corte de F1 dejó el
 * backlog viejo fuera»*. **Medido por el camino real —la RPC desde la sesión de
 * `demo-prestador@epetplace.dev`—: la línea cuenta 62, de los cuales 6 son
 * accionables.** No sale en cero.
 *
 * **La causa: el corte NO vive en el lector.** `obtener_servicios_sin_cerrar()`
 * no consulta `app_config.f1_corte_cierre_ausente`; el corte lo aplica **sólo
 * el reloj** (`expirar_objetos_sin_cierre`, que hoy salta 109 por corte). ⇒ el
 * prestador ve el backlog entero, el reloj no lo mira nunca, y **la copy de los
 * vencidos le afirma una devolución que no ocurrió** (medido: de esas 56, cero
 * casos y cero eventos económicos). Va a A y a C por el buzón.
 *
 * ── ENTONCES, ¿POR QUÉ SEMBRAR IGUAL? POR LA VENTANA, NO POR EL CERO ────
 * Los 6 accionables **decaen**: a las 48 h de su fin pasan a `vencido`, y con
 * ellos la línea primaria deja de tener sujeto cobrable.
 *
 *   · 3 paseos del 7-sep (fin 10:30) → vencen el **9-sep 10:30** (mañana)
 *   · 1 paseo  del 7-sep (fin 18:00) → vence  el **9-sep 18:00**
 *   · 2 adiestr. del 8-sep (fin 11:00) → vencen el **10-sep 11:00**
 *
 * *Un sujeto que existe hoy y no existe pasado mañana no es un sujeto para un
 * recorrido cuya fecha no controlo.* Esta siembra agrega **uno que termina hoy
 * a las 18:00** y por lo tanto sigue accionable hasta el **10-sep 18:00**.
 *
 * ⚠️ **Y NO ES «UNO MÁS»: es el único que puedo fabricar por la puerta.** La
 * puerta de reserva no ofrece horas pasadas (Ley 23), así que un accionable
 * nuevo **sólo se puede hacer reservando algo que TERMINE dentro de un rato** —
 * de ahí el slot de las 17:30 de hoy, que es el primero que la puerta ofrece.
 *
 * ── 🔴 LA CONSECUENCIA A LAS 48 H, DICHA ANTES DE QUE PASE ──────────────
 * **El reloj YA está vivo:** `cron.job` 52 `expirar-objetos-sin-cierre`, cada
 * hora, `active=true`, con corridas `succeeded` — y **ya emitió 3 avisos
 * `servicio_sin_cerrar`** (8-sep 16:00 UTC = 11:00 Guayaquil).
 *
 * ⇒ **Esta cita va a recibir su aviso de 24 h el 9-sep ~18:00, y el 10-sep
 * ~18:00 el reloj la va a marcar `no_ejecutado` y a abrirle su caso de clase
 * 1.** *Eso es el comportamiento firmado de F1, no un defecto.* Se escribe acá
 * y en el buzón **para que si aparece un caso automático nadie lo lea como
 * falla del producto ni como residuo de esta siembra.*
 *
 * ── ⚠️ ESTO ES SIEMBRA, NO TRÁFICO ──────────────────────────────────────
 * **Marca:** `metadata->>'siembra' = 'S114-E'` en la cita (la tabla no tiene
 * columna de procedencia sintética; se usa el jsonb, que es dato y no prosa).
 * **Censo (el comando):**
 *
 *   select id, fecha, hora from evento_cita_servicio
 *    where metadata->>'siembra' = 'S114-E';
 *
 * **Ningún número que salga de esta fila es línea base.** Ningún dato de
 * servicio de esta base es real y producción es octubre.
 *
 * ── IDEMPOTENTE ─────────────────────────────────────────────────────────
 * Si ya hay una cita sembrada por este script todavía accionable, **no siembra
 * otra**: informa cuál es y hasta cuándo sirve. *Un sembrador que no se
 * pregunta si ya sembró no siembra: acumula.*
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { dbQuery } from '../lib-db.mjs';

const PRESTADOR_ID = 'de300000-0000-4000-8000-0000000000e5';   // demo-prestador@epetplace.dev
const OFERTA_PASEO_30 = 'de300000-0000-4000-8000-00000000a5e0'; // paseo · 30 min · $6
const FAMILIA = 'guillo381+8@gmail.com';
const MASCOTA = 'a3332037-c487-45c1-875f-83caf342f59e';         // Zeus (real, no fixture)

const env = Object.fromEntries(readFileSync('apps/cliente/.env.local', 'utf8')
  .split('\n').filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const cliente = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } });
const { error: eLogin } = await cliente.auth.signInWithPassword({
  email: FAMILIA,
  password: execFileSync('security',
    ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
    { encoding: 'utf8' }).trim(),
});
if (eLogin) { console.error(`🔴 login: ${eLogin.message}`); process.exit(2); }

// ══ ① ¿YA SEMBRÉ UNO QUE TODAVÍA SIRVA? ═══════════════════════════════════
const yaHay = dbQuery(`
  select c.id, c.fecha::text as fecha, c.hora::text as hora,
         (((((c.fecha::timestamp + c.hora) at time zone 'America/Guayaquil')
            + (coalesce(c.duracion_minutos,60)||' min')::interval
            + interval '48 hours') at time zone 'America/Guayaquil'))::text as vence
    from evento_cita_servicio c
   where c.metadata->>'siembra' = 'S114-E'
     and c.estado in ('confirmada','en_curso') and c.estado_reserva = 'pagada'
     and now() < ((c.fecha::timestamp + c.hora) at time zone 'America/Guayaquil')
                 + (coalesce(c.duracion_minutos,60)||' min')::interval + interval '48 hours'
   order by c.fecha desc limit 1`)[0];

if (yaHay) {
  console.log(`↻ ya hay una siembra vigente: ${yaHay.id}`);
  console.log(`   ${yaHay.fecha} ${yaHay.hora} · accionable hasta ${String(yaHay.vence).slice(0, 16)}`);
  console.log('   no siembro otra.');
} else {
  // ══ ② POR LA PUERTA: el primer inicio que la puerta OFREZCA hoy ══════════
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());
  const { data: inicios, error: eIni } = await cliente.rpc('obtener_inicios_paseo_disponibles',
    { p_fecha: hoy, p_duracion_minutos: 30 });
  if (eIni) { console.error(`🔴 la puerta rebotó: ${eIni.message}`); process.exit(2); }
  const hora = (Array.isArray(inicios) ? inicios : [])[0]?.hora;
  if (!hora) { console.error('🟠 la puerta no ofrece ningún inicio hoy — no se siembra a la fuerza.'); process.exit(2); }
  console.log(`── la puerta ofrece ${hora} para hoy ${hoy}; reservo ahí ──`);

  const { data: bloq, error: eBloq } = await cliente.rpc('crear_bloqueo_agenda', {
    p_prestador_id: PRESTADOR_ID, p_servicio_id: OFERTA_PASEO_30, p_mascota_id: MASCOTA,
    p_fecha: hoy, p_hora: hora, p_modalidad: null, p_empleado_id: null, p_acepta_teleconsulta: null,
  });
  if (eBloq || bloq?.ok === false) {
    console.error(`🔴 crear_bloqueo_agenda: ${eBloq?.message ?? JSON.stringify(bloq)}`); process.exit(2);
  }
  const citaId = bloq?.cita_id ?? bloq?.id ?? bloq;
  console.log(`   bloqueo creado: ${JSON.stringify(bloq)}`);

  /* 🔴 NO se paga con `confirmar_cita_pagada`: **está REVOCADA de `authenticated`**
     desde S101 (`D-855`), y el rebote es `permission denied for function` —
     medido acá, no leído. La puerta viva es **el motor de pagos**, que es
     además la puerta de verdad: la cita entra como cita, no disfrazada de nada.
     ⚠️ **Pagar NO crea evento económico** (variante (b): el devengo nace al
     CERRAR con calidad, y esta cita justamente no se cierra) ⇒ el único rastro
     es la fila de `pagos_intentos` y la cita en `pagada`. Se dice para que
     nadie busque un devengo que por diseño no existe. */
  const tarjeta = dbQuery(`
    select id from tarjetas_guardadas
     where user_id = (select id from auth.users where email = '${FAMILIA}')
       and estado = 'guardada' order by creada_en desc limit 1`)[0]?.id;
  if (!tarjeta) { console.error('🔴 la familia no tiene tarjeta guardada — no se fuerza el pago.'); process.exit(2); }

  const { data: pag, error: ePag } = await cliente.functions.invoke('pagos-cobro', {
    body: { cita_id: citaId, tarjeta_id: tarjeta },
  });
  if (ePag || pag?.ok === false) {
    console.error(`🔴 pagos-cobro: ${ePag?.message ?? JSON.stringify(pag)}`); process.exit(2);
  }
  console.log(`   el motor respondió: ${JSON.stringify(pag).slice(0, 200)}`);

  /* 🔴 `ok:true` NO ES EL HECHO — la propia respuesta se declara `"señal":
     "optimista"`. El acto 2 lo aplica el WEBHOOK, asíncrono. **Medido acá: la
     primera versión de este script chequeó el estado inmediatamente después del
     `invoke`, lo encontró `pendiente_pago` y abortó… sobre un pago que sí
     entró unos segundos más tarde.** *Un guard correcto que mide antes de
     tiempo produce un rojo verdadero sobre una premisa falsa.*
     Se sondea hasta 40 s, y si no llega **se dice que no llegó** — jamás se
     asume por el `ok`. */
  let est = null;
  for (let i = 0; i < 20; i += 1) {
    est = dbQuery(`select estado, estado_reserva from evento_cita_servicio where id = '${citaId}'`)[0];
    if (est?.estado_reserva === 'pagada') break;
    await new Promise((r) => { setTimeout(r, 2000); });
  }
  if (est?.estado_reserva !== 'pagada') {
    console.error(`🔴 el webhook no aplicó en 40 s: ${JSON.stringify(est)} — el lector NO la va a contar.`);
    console.error('   (el hold vence solo; no queda residuo en el universo del lector, que exige `pagada`)');
    process.exit(2);
  }
  console.log('   ✅ el webhook aplicó: la cita quedó pagada (verificado en la tabla, no por el `ok`)');

  /* La marca va DESPUÉS y por la única vía que hay: la cita no tiene columna de
     procedencia sintética. Se declara el atajo — una marca en jsonb es más
     débil que una columna, y más fuerte que una convención en prosa. */
  dbQuery(`update evento_cita_servicio
              set metadata = coalesce(metadata,'{}'::jsonb)
                             || jsonb_build_object('siembra','S114-E',
                                  'para','linea «servicios sin cerrar» del HOY del prestador')
            where id = '${citaId}'`);
  console.log(`   ✅ cita ${citaId} · pagada, confirmada y SIN CERRAR · marcada como siembra`);
}

// ══ ③ EL ESTADO QUE VA A VER EL FOUNDER, POR EL CAMINO REAL ═══════════════
const pres = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } });
await pres.auth.signInWithPassword({
  email: 'demo-prestador@epetplace.dev',
  password: execFileSync('security', ['find-generic-password', '-s', 'epetplace-cuenta-prueba', '-w'],
    { encoding: 'utf8' }).trim(),
});
const { data: linea } = await pres.rpc('obtener_servicios_sin_cerrar');
const items = linea?.items ?? [];
const acc = items.filter((i) => !i.vencido);
console.log(`\n── lo que la línea dice HOY, por el camino real ──`);
console.log(`   «Tienes ${linea?.cantidad} servicios sin cerrar. Ciérralos para cobrarlos.»`);
console.log(`   accionables (cobrables si los cierra): ${acc.length}`);
console.log(`   vencidos (la copy dice que la familia recibió devolución): ${items.length - acc.length}`);
for (const x of acc) console.log(`     · ${x.fecha}  ${String(x.servicio).padEnd(14)} ${x.mascota_nombre ?? '—'}`);
