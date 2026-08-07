// ============================================================================
// documento-historia-clinica — EL SEGUNDO PAPEL (S89-A · orden 10 ①)
//
// MISMO MOLDE que el carnet (orden 8 ⑤): token quemable de un solo uso →
// PDF compuesto server-side con pdf-lib → espec de B sobre papel de
// impresión (tinta #221E19 · magentaDark SOLO en el filete · B/N-safe: el
// color jamás porta información) → banda de emisor en TINTA en toda página →
// alcance declarado en el encabezado.
//
// ALCANCE v1 (decisión de esta pista, declarada y firmada por la mesa como
// «barata y tuya»): **el expediente clínico COMPLETO**, todas las consultas,
// más nueva arriba. El rango de fechas es v2 — un papel que todavía no sabe
// recortarse es honesto; uno que recorta sin decirlo, no.
//
// LA PUERTA NO SE ENSANCHA: `user_tiene_acceso_a_mascota` (en la RPC que
// emite el token) es la MISMA que gobierna el expediente en pantalla. Este
// papel imprime lo que esa persona ya podía leer.
//
// PROCEDENCIA: cada consulta declara quién la registró (el negocio y el
// profesional cuando existen) — misma ley que el carnet: un papel clínico
// que no dice de dónde viene el dato no certifica nada.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

const TINTA = rgb(0.133, 0.118, 0.098);
const TINTA_SUAVE = rgb(0.45, 0.42, 0.38);
const MAGENTA = rgb(0.557, 0.122, 0.408);
const HAIRLINE = rgb(0.82, 0.8, 0.77);
const PAPEL = rgb(0.98, 0.976, 0.969);

function fechaLarga(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
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

  // La puerta: validar y QUEMAR en el mismo acto
  const { data: fila } = await supabase
    .from('documento_token')
    .update({ usado_en: new Date().toISOString() })
    .eq('id', token)
    .eq('tipo', 'historia_clinica')
    .is('usado_en', null)
    .gt('expira_en', new Date().toISOString())
    .select('mascota_id')
    .maybeSingle();
  if (!fila) return new Response('token_invalido_o_vencido', { status: 410 });

  const { data: mascota } = await supabase
    .from('mascotas')
    .select('nombre, especie, sexo, fecha_nacimiento')
    .eq('id', fila.mascota_id)
    .single();
  if (!mascota) return new Response('mascota_no_encontrada', { status: 404 });

  const { data: consultas } = await supabase
    .from('evento_historia_clinica_registrada')
    .select(
      'id, cita_id, prestador_id, motivo_consulta, anamnesis, peso_kg, temperatura_c, ' +
        'frecuencia_cardiaca, frecuencia_respiratoria, condicion_corporal, examen_fisico, ' +
        'diagnostico_principal, cie_codigo, diagnosticos_secundarios, tratamiento, indicaciones, ' +
        'requiere_hospitalizacion, requiere_cirugia, completado_en',
    )
    .eq('mascota_id', fila.mascota_id)
    .order('completado_en', { ascending: false });

  const citaIds = (consultas ?? []).map((c) => c.cita_id).filter(Boolean);
  const { data: meds } = citaIds.length
    ? await supabase
        .from('evento_medicacion_prescrita')
        .select(
          'cita_id, nombre_medicamento, principio_activo, concentracion, forma_farmaceutica, ' +
            'dosis, frecuencia, duracion_dias, via_administracion, cantidad, indicaciones_especiales, orden',
        )
        .in('cita_id', citaIds)
        .order('orden')
    : { data: [] };
  const { data: exams } = citaIds.length
    ? await supabase
        .from('evento_examen_diagnostico')
        .select('cita_id, tipo_examen, descripcion, urgencia, estado, resultado_texto, orden')
        .in('cita_id', citaIds)
        .order('orden')
    : { data: [] };

  const prestadorIds = [...new Set((consultas ?? []).map((c) => c.prestador_id).filter(Boolean))];
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
  const MX = 56;
  const BANDA = 34;
  let page: ReturnType<typeof pdf.addPage>;
  let y = 0;

  const banda = () => {
    page.drawRectangle({ x: 0, y: A4[1] - BANDA, width: A4[0], height: BANDA, color: TINTA });
    page.drawText('e-PetPlace', { x: MX, y: A4[1] - 22, size: 12, font: sansBold, color: PAPEL });
    page.drawText('DOCUMENTO EMITIDO', {
      x: A4[0] - MX - 118, y: A4[1] - 21, size: 8, font: sans, color: PAPEL,
    });
  };
  const nuevaPagina = () => {
    page = pdf.addPage(A4);
    banda();
    y = A4[1] - BANDA - 30;
  };
  const texto = (
    s: string,
    x: number,
    size: number,
    opts: { font?: typeof sans; color?: typeof TINTA } = {},
  ) => page.drawText(s, { x, y, size, font: opts.font ?? sans, color: opts.color ?? TINTA });
  const hairline = (yy: number) =>
    page.drawLine({ start: { x: MX, y: yy }, end: { x: A4[0] - MX, y: yy }, thickness: 0.7, color: HAIRLINE });
  /** Prosa clínica con corte por ancho — el papel no trunca lo que el vet dictó. */
  const parrafo = (etiqueta: string, valor: string | null, size = 9.5) => {
    if (!valor) return;
    if (y < 90) nuevaPagina();
    texto(etiqueta, MX, 8, { color: TINTA_SUAVE });
    y -= 12;
    const ancho = A4[0] - MX * 2;
    const palabras = valor.replace(/\s+/g, ' ').trim().split(' ');
    let linea = '';
    for (const p of palabras) {
      const prueba = linea ? `${linea} ${p}` : p;
      if (sans.widthOfTextAtSize(prueba, size) > ancho) {
        if (y < 80) nuevaPagina();
        texto(linea, MX, size);
        y -= size + 3;
        linea = p;
      } else linea = prueba;
    }
    if (linea) {
      if (y < 80) nuevaPagina();
      texto(linea, MX, size);
      y -= size + 3;
    }
    y -= 6;
  };

  nuevaPagina();
  page.drawLine({
    start: { x: MX, y: y + 14 }, end: { x: A4[0] - MX, y: y + 14 }, thickness: 2, color: MAGENTA,
  });
  texto('Historia clínica', MX, 24, { font: sansBold });
  y -= 16;
  texto(
    'Documento emitido por e-PetPlace — no reemplaza el registro de la clínica que atendió. Cada consulta declara quién la registró.',
    MX, 9, { color: TINTA_SUAVE },
  );
  y -= 13;
  texto(
    'Alcance: el expediente clínico completo registrado en e-PetPlace.',
    MX, 9, { color: TINTA_SUAVE },
  );
  y -= 26;

  const nac = mascota.fecha_nacimiento
    ? fechaLarga(mascota.fecha_nacimiento + 'T00:00:00Z')
    : '—';
  texto(mascota.nombre ?? '—', MX, 17, { font: sansBold });
  y -= 15;
  texto(`${mascota.especie ?? '—'} · ${mascota.sexo ?? '—'} · nacimiento ${nac}`, MX, 10, {
    color: TINTA_SUAVE,
  });
  y -= 22;
  hairline(y);
  y -= 26;

  const lista = consultas ?? [];
  for (const c of lista) {
    if (y < 150) nuevaPagina();
    // Cabecera de la consulta: fecha en mono + emisor (la procedencia del papel)
    texto(fechaLarga(c.completado_en), MX, 11, { font: mono });
    const quien = c.prestador_id ? (negocios.get(c.prestador_id) ?? 'prestador') : null;
    texto(quien ? `Registrada por ${quien}` : 'Registrada en e-PetPlace', MX + 96, 9, {
      color: TINTA_SUAVE,
    });
    y -= 18;

    parrafo('MOTIVO', c.motivo_consulta, 11);
    parrafo('ANAMNESIS', c.anamnesis);

    const vit = [
      c.peso_kg != null ? `peso ${c.peso_kg} kg` : null,
      c.temperatura_c != null ? `temp ${c.temperatura_c} °C` : null,
      c.frecuencia_cardiaca != null ? `FC ${c.frecuencia_cardiaca}` : null,
      c.frecuencia_respiratoria != null ? `FR ${c.frecuencia_respiratoria}` : null,
      c.condicion_corporal != null ? `CC ${c.condicion_corporal}` : null,
    ].filter(Boolean);
    // null honesto: si no se dictó, la fila no existe (L-139 — jamás un cero inventado)
    if (vit.length) parrafo('VITALES', vit.join(' · '));

    parrafo('EXAMEN FÍSICO', c.examen_fisico);
    parrafo(
      'DIAGNÓSTICO',
      [c.diagnostico_principal, c.cie_codigo ? `(CIE ${c.cie_codigo})` : null]
        .filter(Boolean)
        .join(' '),
      11,
    );
    const secundarios = Array.isArray(c.diagnosticos_secundarios)
      ? (c.diagnosticos_secundarios as string[]).join(' · ')
      : null;
    parrafo('DIAGNÓSTICOS SECUNDARIOS', secundarios);
    parrafo('TRATAMIENTO', c.tratamiento);

    const misMeds = (meds ?? []).filter((m) => m.cita_id === c.cita_id);
    if (misMeds.length) {
      if (y < 90) nuevaPagina();
      texto('MEDICACIÓN', MX, 8, { color: TINTA_SUAVE });
      y -= 13;
      for (const m of misMeds) {
        if (y < 80) nuevaPagina();
        texto(
          [m.nombre_medicamento, m.concentracion, m.forma_farmaceutica].filter(Boolean).join(' '),
          MX, 10, { font: sansBold },
        );
        y -= 12;
        const pos = [
          m.principio_activo,
          m.dosis,
          m.frecuencia,
          m.duracion_dias != null ? `por ${m.duracion_dias} días` : null,
          m.via_administracion,
          m.cantidad != null ? `cantidad ${m.cantidad}` : null,
          m.indicaciones_especiales,
        ].filter(Boolean).join(' · ');
        if (pos) { texto(pos, MX, 9, { color: TINTA_SUAVE }); y -= 13; }
      }
      y -= 4;
    }

    const misExams = (exams ?? []).filter((e) => e.cita_id === c.cita_id);
    if (misExams.length) {
      if (y < 90) nuevaPagina();
      texto('EXÁMENES', MX, 8, { color: TINTA_SUAVE });
      y -= 13;
      for (const e of misExams) {
        if (y < 80) nuevaPagina();
        texto(
          [e.tipo_examen, e.descripcion].filter(Boolean).join(' — '),
          MX, 10,
        );
        y -= 12;
        const det = [e.urgencia, e.estado, e.resultado_texto].filter(Boolean).join(' · ');
        if (det) { texto(det, MX, 9, { color: TINTA_SUAVE }); y -= 13; }
      }
      y -= 4;
    }

    parrafo('INDICACIONES A LA FAMILIA', c.indicaciones);
    const banderas = [
      c.requiere_hospitalizacion ? 'Requiere hospitalización' : null,
      c.requiere_cirugia ? 'Requiere cirugía' : null,
    ].filter(Boolean);
    if (banderas.length) parrafo('', banderas.join(' · '), 10);

    if (y < 60) nuevaPagina();
    hairline(y + 6);
    y -= 26;
  }
  if (lista.length === 0) {
    texto('Sin consultas registradas todavía.', MX, 11, { color: TINTA_SUAVE });
  }

  // Pie con las DOS fechas
  if (y < 90) nuevaPagina();
  y = 64;
  hairline(y + 14);
  texto(
    `Emitido por e-PetPlace (hola@epetplace.com) · emisión ${fechaLarga(new Date().toISOString())} · última consulta ${fechaLarga(lista[0]?.completado_en ?? null)} · ${lista.length} consulta(s)`,
    MX, 8.5, { color: TINTA_SUAVE },
  );

  const bytes = await pdf.save();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="historia-clinica-${(mascota.nombre ?? 'mascota').toLowerCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
