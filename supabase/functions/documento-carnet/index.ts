// ============================================================================
// documento-carnet — EL PRIMER PAPEL DEL PRODUCTO (S89-A · orden 8 ⑤)
//
// El carnet de vacunas, generado SERVER-SIDE de punta a punta. Espec de B
// (2026-08-06-s89b-ESPEC-cara-documentos.md) sobre papel de impresión:
// tinta #221E19 (16.56) · magentaDark #8E1F68 SOLO en el filete (8.25) ·
// el oro no rige (1.70) · B/N-safe: el color JAMÁS porta solo — la
// PROCEDENCIA viaja fila por fila EN TEXTO, como la espec manda y la orden
// no relaja: un carnet que miente certificación es daño real.
//
// DECISIÓN DE MOTOR, declarada: la espec decía «HTML→PDF server-side»; una
// Edge Function no corre Chromium, así que el PDF se COMPONE directo con
// pdf-lib (JS puro) siguiendo la misma espec — las demos HTML de B quedan
// como fuente de diseño, no como paso del pipeline.
//
// LA PUERTA: token quemable de un solo uso (10 min), emitido por RPC
// autenticada con el gate de acceso a la mascota (migración 20260806260000).
// El JWT jamás viaja en la URL; esta función corre con --no-verify-jwt y EL
// TOKEN ES LA AUTORIZACIÓN — validado y quemado en el mismo acto.
//
// Lo que el papel exige (espec B §papeles): EMISOR (e-PetPlace, con el
// negocio/veterinario POR FILA cuando existe) + DOS FECHAS (emisión + último
// registro) + procedencia por fila. FOLIO/QR: decisión de mesa pendiente —
// v1 sale sin folio, declarado. Alcance v1 declarado EN EL PAPEL: es el
// carnet DE VACUNAS (la desparasitación no existe en el motor — D-476,
// pregunta 6 de C a mesa).
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

const TINTA = rgb(0.133, 0.118, 0.098); // #221E19
const TINTA_SUAVE = rgb(0.45, 0.42, 0.38);
const MAGENTA = rgb(0.557, 0.122, 0.408); // #8E1F68 — SOLO el filete
const HAIRLINE = rgb(0.82, 0.8, 0.77);

const VOZ_PROCEDENCIA: Record<string, string> = {
  declarado_por_familia: 'Declarada por la familia',
  declarado_por_prestador: 'Registrada por el prestador',
  verificado_por_prestador: 'Verificada por el prestador',
};

function fechaLarga(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

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
    .select('mascota_id')
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
  const pdf = await PDFDocument.create();
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const A4: [number, number] = [595.28, 841.89];
  const MX = 56; // margen
  let page = pdf.addPage(A4);
  let y = A4[1] - 64;

  const texto = (
    s: string,
    x: number,
    size: number,
    opts: { font?: typeof sans; color?: typeof TINTA } = {},
  ) => {
    page.drawText(s, { x, y, size, font: opts.font ?? sans, color: opts.color ?? TINTA });
  };
  const hairline = (yy: number) =>
    page.drawLine({
      start: { x: MX, y: yy },
      end: { x: A4[0] - MX, y: yy },
      thickness: 0.7,
      color: HAIRLINE,
    });
  const nuevaPagina = () => {
    page = pdf.addPage(A4);
    y = A4[1] - 64;
  };

  // Cabecera: wordmark + EL FILETE magenta (el único color del papel)
  texto('e-PetPlace', MX, 15, { font: sansBold });
  y -= 10;
  page.drawLine({
    start: { x: MX, y },
    end: { x: A4[0] - MX, y },
    thickness: 2,
    color: MAGENTA,
  });
  y -= 34;
  texto('Carnet de vacunas', MX, 24, { font: sansBold });
  y -= 16;
  texto(
    'Este documento cubre las vacunas registradas en e-PetPlace. La procedencia de cada registro se declara fila por fila.',
    MX,
    9,
    { color: TINTA_SUAVE },
  );
  y -= 30;

  // Identidad de la mascota
  const nac = mascota.fecha_nacimiento
    ? fechaLarga(new Date(mascota.fecha_nacimiento + 'T00:00:00Z'))
    : '—';
  texto(mascota.nombre ?? '—', MX, 17, { font: sansBold });
  y -= 15;
  texto(
    `${mascota.especie ?? '—'} · ${mascota.sexo ?? '—'} · nacimiento ${nac}`,
    MX,
    10,
    { color: TINTA_SUAVE },
  );
  y -= 22;
  hairline(y);
  y -= 24;

  // Las filas — fecha · vacuna · quién · procedencia (EN TEXTO, no en color)
  const filas = vacunas ?? [];
  let ultima: string | null = null;
  for (const v of filas) {
    if (y < 110) nuevaPagina();
    const f = v.fecha_aplicada ? fechaLarga(new Date(v.fecha_aplicada)) : '—';
    if (!ultima && v.fecha_aplicada) ultima = f;
    texto(f, MX, 10, { font: mono });
    texto(v.nombre_vacuna ?? '—', MX + 84, 11, { font: sansBold });
    if (v.fecha_proxima) {
      texto(`próxima ${fechaLarga(new Date(v.fecha_proxima))}`, A4[0] - MX - 130, 9, {
        color: TINTA_SUAVE,
      });
    }
    y -= 13;
    const quien = v.prestador_id
      ? (negocios.get(v.prestador_id) ?? 'prestador')
      : (v.veterinario_nombre_externo || null);
    const partes = [
      VOZ_PROCEDENCIA[procedencias.get(v.evento_id) ?? ''] ?? 'Procedencia sin registrar',
      quien ? `aplicada por ${quien}` : null,
      v.lote ? `lote ${v.lote}` : null,
    ].filter(Boolean);
    texto(partes.join(' · '), MX + 84, 8.5, { color: TINTA_SUAVE });
    y -= 12;
    hairline(y + 4);
    y -= 12;
  }
  if (filas.length === 0) {
    texto('Sin vacunas registradas todavía.', MX, 11, { color: TINTA_SUAVE });
    y -= 20;
  }

  // Pie: emisor + LAS DOS FECHAS (emisión · último registro). Sin folio (mesa).
  if (y < 96) nuevaPagina();
  y = 64;
  hairline(y + 14);
  texto(
    `Emitido por e-PetPlace (hola@epetplace.com) · emisión ${fechaLarga(new Date())} · último registro ${ultima ?? '—'} · ${filas.length} vacuna(s)`,
    MX,
    8.5,
    { color: TINTA_SUAVE },
  );

  const bytes = await pdf.save();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="carnet-${(mascota.nombre ?? 'mascota').toLowerCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
