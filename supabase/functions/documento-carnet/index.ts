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
      'nombre_vacuna, fecha_aplicada, fecha_proxima, lote, veterinario_nombre_externo, prestador_id, evento_id, archivo_url',
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

  // ── EL ANEXO: la foto del carnet escaneado (gate impreso ②, firma founder:
  // ANEXA AL FINAL, en su propia página, con su rótulo). El porqué de la
  // ubicación es letra firmada (MODELO_VETERINARIA §13): la imagen es
  // EVIDENCIA DE PROCEDENCIA, no dato clínico verificado — pegada a las
  // filas validadas haría que TODO el papel parezca respaldado por el
  // original, y alguien va a llevarlo a una frontera.
  const archivos = [...new Set((vacunas ?? []).map((v) => v.archivo_url).filter(Boolean))] as string[];
  for (const ruta of archivos) {
    const { data: blob } = await supabase.storage.from('mascotas').download(ruta);
    if (!blob) continue; // un adjunto que no baja no rompe el papel: el anexo se omite
    const imgBytes = new Uint8Array(await blob.arrayBuffer());
    if (imgBytes.length < 8) continue;
    const esPng = imgBytes[0] === 0x89 && imgBytes[1] === 0x50;
    const esJpg = imgBytes[0] === 0xff && imgBytes[1] === 0xd8;
    if (!esPng && !esJpg) continue;
    try {
      const img = esPng ? await papel.pdf.embedPng(imgBytes) : await papel.pdf.embedJpg(imgBytes);
      papel.nuevaPagina();
      // El rótulo FIRMADO, verbatim — preside la página del anexo.
      papel.texto('ANEXO', MX, 9, { font: papel.f.sansBold, color: TINTA_65 });
      papel.y -= 15;
      papel.texto(
        'Documento aportado por la familia — no verificado por e-PetPlace',
        MX, 10.5, { font: papel.f.sansBold },
      );
      papel.y -= 16;
      papel.hairline(papel.y + 6);
      papel.y -= 10;
      const maxW = 595.28 - MX * 2;
      const maxH = papel.y - 60;
      const esc = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * esc;
      const h = img.height * esc;
      papel.page.drawImage(img, { x: (595.28 - w) / 2, y: papel.y - h, width: w, height: h });
    } catch (_e) {
      // una imagen que no embebe no rompe el papel
    }
  }

  const bytes = await papel.bytes();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="carnet-${(mascota.nombre ?? 'mascota').toLowerCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
