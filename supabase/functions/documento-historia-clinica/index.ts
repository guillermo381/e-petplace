// ============================================================================
// documento-historia-clinica — EL SEGUNDO PAPEL (S89-A · orden 10 ①)
//
// MISMO MOLDE que el carnet: token quemable de un solo uso → PDF compuesto
// server-side. La CARA vive en `_shared/papel.ts` desde S90-A (pasada de
// diseño D-681 + marca de agua D-677).
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
import { MX, Papel, TINTA_65, fechaLarga } from '../_shared/papel.ts';

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
      'id, cita_id, prestador_id, empleado_id, veterinario_user_id, motivo_consulta, anamnesis, peso_kg, temperatura_c, ' +
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

  // ── ② EL MÉDICO TRATANTE (firma founder, orden 14 ②) ─────────────────────
  // Un papel clínico lo firma una PERSONA, no un negocio. Se resuelve por
  // empleado_id (la asignación) y, si falta, por veterinario_user_id (quien
  // dictó). Cuando no hay ninguno de los dos, el papel dice el NEGOCIO —
  // honesto: JAMÁS se inventa un firmante para un registro viejo.
  const empIds = [...new Set((consultas ?? []).map((c) => c.empleado_id).filter(Boolean))];
  const userIds = [...new Set((consultas ?? []).map((c) => c.veterinario_user_id).filter(Boolean))];
  const profPorEmpleado = new Map<string, { nombre: string | null; matricula: string | null }>();
  const profPorUser = new Map<string, { nombre: string | null; matricula: string | null }>();
  if (empIds.length || userIds.length) {
    const { data: emps } = await supabase
      .from('prestador_empleados')
      .select('id, user_id, nombre, matricula_profesional')
      .or(
        [
          empIds.length ? `id.in.(${empIds.join(',')})` : null,
          userIds.length ? `user_id.in.(${userIds.join(',')})` : null,
        ].filter(Boolean).join(','),
      );
    for (const e of emps ?? []) {
      const v = { nombre: e.nombre, matricula: e.matricula_profesional };
      profPorEmpleado.set(e.id, v);
      if (e.user_id) profPorUser.set(e.user_id, v);
    }
  }

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
  const papel = await Papel.crear();
  papel.cabecera('Historia clínica', [
    'Documento emitido por e-PetPlace — no reemplaza el registro de la clínica que atendió. Cada consulta declara quién la registró.',
    'Alcance: el expediente clínico completo registrado en e-PetPlace.',
  ]);

  const nac = mascota.fecha_nacimiento
    ? fechaLarga(mascota.fecha_nacimiento + 'T00:00:00Z')
    : '—';
  papel.identidad(
    mascota.nombre ?? '—',
    `${mascota.especie ?? '—'} · ${mascota.sexo ?? '—'} · nacimiento ${nac}`,
  );

  const lista = consultas ?? [];
  for (const c of lista) {
    papel.asegura(150);
    // Cabecera de la consulta: fecha en mono + emisor (la procedencia del papel)
    papel.texto(fechaLarga(c.completado_en), MX, 10.5, { font: papel.f.mono });
    const negocio = c.prestador_id ? (negocios.get(c.prestador_id) ?? null) : null;
    const prof =
      (c.empleado_id ? profPorEmpleado.get(c.empleado_id) : null) ??
      (c.veterinario_user_id ? profPorUser.get(c.veterinario_user_id) : null) ??
      null;
    // La firma del tratante: nombre + matrícula cuando existe. Sin persona
    // identificada, el papel dice el negocio — y lo dice como lo que es.
    const firma = prof?.nombre
      ? `Atendida por ${prof.nombre}${prof.matricula ? ` · matrícula ${prof.matricula}` : ''}${negocio ? ` en ${negocio}` : ''}`
      : negocio
        ? `Registrada por ${negocio}`
        : 'Registrada en e-PetPlace';
    papel.texto(firma, MX + 96, 8.5, { color: TINTA_65 });
    papel.y -= 18;

    papel.parrafo('MOTIVO', c.motivo_consulta, 11);
    papel.parrafo('ANAMNESIS', c.anamnesis);

    const vit = [
      c.peso_kg != null ? `peso ${c.peso_kg} kg` : null,
      c.temperatura_c != null ? `temp ${c.temperatura_c} °C` : null,
      c.frecuencia_cardiaca != null ? `FC ${c.frecuencia_cardiaca}` : null,
      c.frecuencia_respiratoria != null ? `FR ${c.frecuencia_respiratoria}` : null,
      c.condicion_corporal != null ? `CC ${c.condicion_corporal}` : null,
    ].filter(Boolean);
    // null honesto: si no se dictó, la fila no existe (L-139 — jamás un cero inventado)
    if (vit.length) papel.parrafo('VITALES', vit.join(' · '), 9.5);

    papel.parrafo('EXAMEN FÍSICO', c.examen_fisico);
    papel.parrafo(
      'DIAGNÓSTICO',
      [c.diagnostico_principal, c.cie_codigo ? `(CIE ${c.cie_codigo})` : null]
        .filter(Boolean)
        .join(' '),
      11,
    );
    const secundarios = Array.isArray(c.diagnosticos_secundarios)
      ? (c.diagnosticos_secundarios as string[]).join(' · ')
      : null;
    papel.parrafo('DIAGNÓSTICOS SECUNDARIOS', secundarios);
    papel.parrafo('TRATAMIENTO', c.tratamiento);

    const misMeds = (meds ?? []).filter((m) => m.cita_id === c.cita_id);
    if (misMeds.length) {
      papel.rotulo('MEDICACIÓN');
      for (const m of misMeds) {
        papel.asegura(80);
        papel.texto(
          [m.nombre_medicamento, m.concentracion, m.forma_farmaceutica].filter(Boolean).join(' '),
          MX, 10.5, { font: papel.f.sansBold },
        );
        papel.y -= 12;
        const pos = [
          m.principio_activo,
          m.dosis,
          m.frecuencia,
          m.duracion_dias != null ? `por ${m.duracion_dias} días` : null,
          m.via_administracion,
          m.cantidad != null ? `cantidad ${m.cantidad}` : null,
          m.indicaciones_especiales,
        ].filter(Boolean).join(' · ');
        if (pos) { papel.texto(pos, MX, 9.5, { color: TINTA_65 }); papel.y -= 13; }
      }
      papel.y -= 4;
    }

    const misExams = (exams ?? []).filter((e) => e.cita_id === c.cita_id);
    if (misExams.length) {
      papel.rotulo('EXÁMENES');
      for (const e of misExams) {
        papel.asegura(80);
        papel.texto(
          [e.tipo_examen, e.descripcion].filter(Boolean).join(' — '),
          MX, 10.5,
        );
        papel.y -= 12;
        const det = [e.urgencia, e.estado, e.resultado_texto].filter(Boolean).join(' · ');
        if (det) { papel.texto(det, MX, 9.5, { color: TINTA_65 }); papel.y -= 13; }
      }
      papel.y -= 4;
    }

    papel.parrafo('INDICACIONES A LA FAMILIA', c.indicaciones);
    const banderas = [
      c.requiere_hospitalizacion ? 'Requiere hospitalización' : null,
      c.requiere_cirugia ? 'Requiere cirugía' : null,
    ].filter(Boolean);
    if (banderas.length) papel.parrafo('', banderas.join(' · '), 10);

    papel.asegura(60);
    papel.hairline(papel.y + 6);
    papel.y -= 26;
  }
  if (lista.length === 0) {
    papel.texto('Sin consultas registradas todavía.', MX, 10.5, { color: TINTA_65 });
  }

  // Pie con las DOS fechas
  papel.pie(
    `Emitido por e-PetPlace (hola@epetplace.com) · emisión ${fechaLarga(new Date().toISOString())} · última consulta ${fechaLarga(lista[0]?.completado_en ?? null)} · ${lista.length} consulta(s)`,
  );

  const bytes = await papel.bytes();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="historia-clinica-${(mascota.nombre ?? 'mascota').toLowerCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
