// ============================================================================
// documento-carnet — EL PRIMER PAPEL DEL PRODUCTO (S89-A · orden 8 ⑤)
//
// El carnet de vacunas, generado SERVER-SIDE de punta a punta. La CARA vive
// en la plantilla compartida `_shared/papel.ts` desde S90-A (pasada de
// diseño D-681 + marca de agua D-677 — el isotipo en tinta con opacidad,
// que JAMÁS porta información). B/N-safe: la PROCEDENCIA viaja fila por
// fila EN TEXTO — un carnet que miente certificación es daño real.
//
// LA PUERTA: token quemable de un solo uso (10 min), emitido por RPC
// autenticada con el gate de acceso a la mascota (migraciones 20260806260000
// + 20260807100000: el tipo valida contra cat_documentos_mascota). El JWT
// jamás viaja en la URL; esta función corre con --no-verify-jwt y EL TOKEN
// ES LA AUTORIZACIÓN — validado y quemado en el mismo acto.
//
// Lo que el papel exige (espec B §papeles): EMISOR + DOS FECHAS (emisión +
// último registro) + procedencia por fila + FOLIO de emisión (orden 9 fase
// 1 — el QR espera la landing, fase 2, y este papel SÍ lo va a llevar).
// Alcance v1 declarado EN EL PAPEL: es el carnet DE VACUNAS (la
// desparasitación no existe en el motor — D-476).
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { MX, Papel, TINTA_65, fechaLarga } from '../_shared/papel.ts';

const VOZ_PROCEDENCIA: Record<string, string> = {
  declarado_por_familia: 'Declarada por la familia',
  declarado_por_prestador: 'Registrada por el prestador',
  verificado_por_prestador: 'Verificada por el prestador',
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('t');
  if (!token || !/^[0-9a-f-]{36}$/.test(token)) {
    return new Response('token_invalido', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── LA PUERTA: validar y QUEMAR en el mismo acto (un solo uso) ────────────
  const { data: fila, error: errTok } = await supabase
    .from('documento_token')
    .update({ usado_en: new Date().toISOString() })
    .eq('id', token)
    .eq('tipo', 'carnet_vacunas')
    .is('usado_en', null)
    .gt('expira_en', new Date().toISOString())
    .select('mascota_id, folio')
    .maybeSingle();
  if (errTok || !fila) {
    // vencido, usado o inexistente: la misma respuesta (no se le cuenta a un
    // extraño cuál de las tres).
    return new Response('token_invalido_o_vencido', { status: 410 });
  }

  // ── Los datos, con su procedencia fila por fila ───────────────────────────
  const { data: mascota } = await supabase
    .from('mascotas')
    .select('nombre, especie, sexo, fecha_nacimiento')
    .eq('id', fila.mascota_id)
    .single();
  if (!mascota) return new Response('mascota_no_encontrada', { status: 404 });

  const { data: vacunas } = await supabase
    .from('evento_vacuna_aplicada')
    .select(
      'nombre_vacuna, fecha_aplicada, fecha_proxima, lote, veterinario_nombre_externo, prestador_id, evento_id',
    )
    .eq('mascota_id', fila.mascota_id)
    .order('fecha_aplicada', { ascending: false });

  const eventoIds = (vacunas ?? []).map((v) => v.evento_id).filter(Boolean);
  const procedencias = new Map<string, string>();
  if (eventoIds.length) {
    const { data: evs } = await supabase
      .from('eventos_mascota')
      .select('id, procedencia')
      .in('id', eventoIds);
    for (const e of evs ?? []) procedencias.set(e.id, e.procedencia);
  }
  const prestadorIds = [...new Set((vacunas ?? []).map((v) => v.prestador_id).filter(Boolean))];
  const negocios = new Map<string, string>();
  if (prestadorIds.length) {
    const { data: prs } = await supabase
      .from('prestadores')
      .select('id, nombre_comercial')
      .in('id', prestadorIds);
    for (const p of prs ?? []) negocios.set(p.id, p.nombre_comercial);
  }

  // ── El papel ──────────────────────────────────────────────────────────────
  const papel = await Papel.crear();
  papel.cabecera('Carnet de vacunas', [
    'Documento emitido por e-PetPlace — no es el carnet físico de una clínica. La procedencia de cada registro se declara fila por fila.',
    // ② El alcance v1, DECLARADO en el papel (firma founder): sin
    // desparasitaciones — el motor no las tiene (D-476). Decirlo es la
    // diferencia entre un papel incompleto y un papel que miente.
    'Alcance: vacunas. Este carnet no incluye desparasitaciones.',
    'El folio identifica esta emisión; todavía no existe un mecanismo público de verificación en línea.',
  ], fila.folio);

  const nac = mascota.fecha_nacimiento
    ? fechaLarga(mascota.fecha_nacimiento + 'T00:00:00Z')
    : '—';
  papel.identidad(
    mascota.nombre ?? '—',
    `${mascota.especie ?? '—'} · ${mascota.sexo ?? '—'} · nacimiento ${nac}`,
  );

  // Las filas — fecha · vacuna · quién · procedencia (EN TEXTO, no en color)
  const filas = vacunas ?? [];
  let ultima: string | null = null;
  const A4w = 595.28;
  for (const v of filas) {
    papel.asegura(110);
    const f = v.fecha_aplicada ? fechaLarga(v.fecha_aplicada) : '—';
    if (!ultima && v.fecha_aplicada) ultima = f;
    papel.texto(f, MX, 9.5, { font: papel.f.mono });
    papel.texto(v.nombre_vacuna ?? '—', MX + 84, 10.5, { font: papel.f.sansBold });
    if (v.fecha_proxima) {
      papel.texto(`próxima ${fechaLarga(v.fecha_proxima)}`, A4w - MX - 130, 8.5, {
        color: TINTA_65,
      });
    }
    papel.y -= 13;
    const quien = v.prestador_id
      ? (negocios.get(v.prestador_id) ?? 'prestador')
      : (v.veterinario_nombre_externo || null);
    const partes = [
      VOZ_PROCEDENCIA[procedencias.get(v.evento_id) ?? ''] ?? 'Procedencia sin registrar',
      quien ? `aplicada por ${quien}` : null,
      v.lote ? `lote ${v.lote}` : null,
    ].filter(Boolean);
    papel.texto(partes.join(' · '), MX + 84, 8.5, { color: TINTA_65 });
    papel.y -= 12;
    papel.hairline(papel.y + 4);
    papel.y -= 12;
  }
  if (filas.length === 0) {
    papel.texto('Sin vacunas registradas todavía.', MX, 10.5, { color: TINTA_65 });
    papel.y -= 20;
  }

  // Pie: emisor + LAS DOS FECHAS (emisión · último registro) + el folio.
  papel.pie(
    `Emitido por e-PetPlace (hola@epetplace.com) · folio ${fila.folio ?? '—'} · emisión ${fechaLarga(new Date().toISOString())} · último registro ${ultima ?? '—'} · ${filas.length} vacuna(s)`,
  );

  const bytes = await papel.bytes();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="carnet-${(mascota.nombre ?? 'mascota').toLowerCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
