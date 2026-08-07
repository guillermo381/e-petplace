// ============================================================================
// documento-receta — EL TERCER PAPEL (S90-A · orden 1)
//
// UN PAPEL POR CONSULTA (decisión 4 firmada): el token viaja con `ref_id` =
// la cita de la consulta, y la RPC ya verificó que esa cita tiene medicación
// prescrita de esta mascota. El contenido clínico es un recorte del bloque
// MEDICACIÓN que la historia clínica ya imprime — lo que este papel agrega
// es LA IDENTIDAD DE QUIEN FIRMA (D-676: la matrícula es de la PERSONA).
//
// LAS CUATRO DECISIONES FIRMADAS (brief S90 ②):
//   1. «Firmar» v1 = nombre + matrícula IMPRESOS con procedencia declarada
//      («Prescrita por {profesional}, matrícula {n}, en {negocio}»). SIN
//      firma criptográfica y SIN imagen de firma: una firma escaneada en un
//      PDF descargable se recorta — eso es peor que ninguna firma.
//   2. Sin vigencia, DECLARADO en el papel (no se inventa). El folio llegó
//      con la orden 9 (fase 1): identifica la EMISIÓN, y el papel declara
//      que aún no hay verificación pública (la relaja la landing, fase 2).
//   3. La descarga el DUEÑO, con la misma puerta del expediente (la RPC).
//   4. Un papel por consulta, no por medicamento.
//
// EL FALLBACK DEL FIRMANTE: profesional sin matrícula cargada ⇒ el papel lo
// dice y el emisor cae al NEGOCIO — JAMÁS se inventa un firmante. Medido al
// construir: 0 de 16 empleados activos con matrícula ⇒ hoy el 100% de las
// recetas sale con fallback; el papel dice la verdad de un dato que falta
// (la captura en superficie es de la pista B).
//
// La CARA vive en `_shared/papel.ts` (espec de B + D-677 + D-681).
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

  // La puerta: validar y QUEMAR en el mismo acto (un solo uso)
  const { data: fila } = await supabase
    .from('documento_token')
    .update({ usado_en: new Date().toISOString() })
    .eq('id', token)
    .eq('tipo', 'receta')
    .is('usado_en', null)
    .gt('expira_en', new Date().toISOString())
    .select('mascota_id, ref_id, folio')
    .maybeSingle();
  if (!fila || !fila.ref_id) return new Response('token_invalido_o_vencido', { status: 410 });

  const { data: mascota } = await supabase
    .from('mascotas')
    .select('nombre, especie, sexo, fecha_nacimiento')
    .eq('id', fila.mascota_id)
    .single();
  if (!mascota) return new Response('mascota_no_encontrada', { status: 404 });

  // La medicación de ESTA consulta (la RPC ya garantizó que existe)
  const { data: meds } = await supabase
    .from('evento_medicacion_prescrita')
    .select(
      'nombre_medicamento, principio_activo, concentracion, forma_farmaceutica, ' +
        'dosis, frecuencia, duracion_dias, via_administracion, cantidad, ' +
        'indicaciones_especiales, orden, prestador_id, empleado_id, fecha_inicio, created_at',
    )
    .eq('cita_id', fila.ref_id)
    .eq('mascota_id', fila.mascota_id)
    .order('orden');
  if (!meds?.length) return new Response('receta_sin_medicacion', { status: 404 });

  // La consulta que la parió: fecha del HECHO + firmante + peso registrado
  const { data: hc } = await supabase
    .from('evento_historia_clinica_registrada')
    .select('prestador_id, empleado_id, veterinario_user_id, completado_en, peso_kg')
    .eq('cita_id', fila.ref_id)
    .eq('mascota_id', fila.mascota_id)
    .maybeSingle();

  // ── EL FIRMANTE (D-676: la matrícula es de la PERSONA) ────────────────────
  const prestadorId = hc?.prestador_id ?? meds[0].prestador_id ?? null;
  const { data: negocio } = prestadorId
    ? await supabase
        .from('prestadores')
        .select('nombre_comercial, direccion, telefono')
        .eq('id', prestadorId)
        .maybeSingle()
    : { data: null };

  let prof: { nombre: string | null; matricula: string | null } | null = null;
  const empleadoId = hc?.empleado_id ?? meds[0].empleado_id ?? null;
  if (empleadoId) {
    const { data: e } = await supabase
      .from('prestador_empleados')
      .select('nombre, matricula_profesional')
      .eq('id', empleadoId)
      .maybeSingle();
    if (e) prof = { nombre: e.nombre, matricula: e.matricula_profesional };
  }
  if (!prof && hc?.veterinario_user_id) {
    const { data: e } = await supabase
      .from('prestador_empleados')
      .select('nombre, matricula_profesional')
      .eq('user_id', hc.veterinario_user_id)
      .eq('prestador_id', prestadorId ?? '')
      .maybeSingle();
    if (e) prof = { nombre: e.nombre, matricula: e.matricula_profesional };
  }
  const matricula = prof?.matricula && prof.matricula.trim() !== '' ? prof.matricula.trim() : null;

  const fechaHecho = hc?.completado_en ?? meds[0].fecha_inicio ?? meds[0].created_at ?? null;

  // ── El papel ──────────────────────────────────────────────────────────────
  const papel = await Papel.crear();
  papel.cabecera('Receta', [
    'Documento emitido por e-PetPlace con la prescripción registrada por el profesional que atendió la consulta.',
    // Decisión 2 enmendada por la orden 9: el folio EXISTE (fase 1); la
    // vigencia sigue sin existir y se dice. La verificación pública espera
    // la landing (fase 2) y hasta entonces el papel lo declara.
    'Se emite sin vigencia: e-PetPlace no le fija plazo a esta receta.',
    'El folio identifica esta emisión; todavía no existe un mecanismo público de verificación en línea.',
    `Alcance: la medicación prescrita en la consulta del ${fechaLarga(fechaHecho)}.`,
  ], fila.folio);

  const nac = mascota.fecha_nacimiento
    ? fechaLarga(mascota.fecha_nacimiento + 'T00:00:00Z')
    : '—';
  papel.identidad(
    mascota.nombre ?? '—',
    [
      `${mascota.especie ?? '—'} · ${mascota.sexo ?? '—'} · nacimiento ${nac}`,
      hc?.peso_kg != null ? `peso ${hc.peso_kg} kg registrado en la consulta` : null,
    ].filter(Boolean).join(' · '),
  );

  // ── MEDICACIÓN — un papel por consulta, cada medicamento con su posología ─
  papel.rotulo('MEDICACIÓN PRESCRITA');
  papel.y -= 2;
  for (const m of meds) {
    papel.asegura(96);
    papel.texto(
      [m.nombre_medicamento, m.concentracion, m.forma_farmaceutica].filter(Boolean).join(' '),
      MX, 11, { font: papel.f.sansBold },
    );
    papel.y -= 14;
    // El dato exacto va en MONO (la voz de máquina de la casa)
    const posologia = [
      m.principio_activo,
      m.dosis,
      m.frecuencia,
      m.duracion_dias != null ? `por ${m.duracion_dias} días` : null,
      m.via_administracion,
      m.cantidad != null ? `cantidad ${m.cantidad}` : null,
    ].filter(Boolean).join(' · ');
    if (posologia) {
      papel.texto(posologia, MX, 9.5, { font: papel.f.mono });
      papel.y -= 14;
    }
    if (m.indicaciones_especiales) {
      papel.parrafo('', m.indicaciones_especiales, 9.5);
    }
    papel.hairline(papel.y + 4);
    papel.y -= 16;
  }

  // ── LA FIRMA (decisión 1) — o el fallback que dice la verdad ─────────────
  papel.asegura(120);
  papel.y -= 6;
  papel.rotulo('PRESCRIPCIÓN');
  if (prof?.nombre && matricula) {
    // La forma firmada: «Prescrita por {profesional}, matrícula {n}, en {negocio}»
    papel.texto(`Prescrita por ${prof.nombre}`, MX, 11, { font: papel.f.sansBold });
    papel.y -= 14;
    papel.texto(`matrícula ${matricula}`, MX, 9.5, { font: papel.f.mono });
    papel.y -= 13;
    if (negocio?.nombre_comercial) {
      papel.texto(
        `en ${negocio.nombre_comercial}${negocio.direccion ? ` · ${negocio.direccion}` : ''}${negocio.telefono ? ` · ${negocio.telefono}` : ''}`,
        MX, 9.5, { color: TINTA_65 },
      );
      papel.y -= 13;
    }
    papel.texto(
      'Sin firma manuscrita ni digital: la identidad del prescriptor se declara con su registro profesional.',
      MX, 8.5, { color: TINTA_65 },
    );
    papel.y -= 12;
  } else if (negocio?.nombre_comercial) {
    // EL FALLBACK: cae el negocio como emisor — JAMÁS se inventa un firmante.
    papel.texto(`Prescrita en ${negocio.nombre_comercial}`, MX, 11, { font: papel.f.sansBold });
    papel.y -= 14;
    papel.texto(
      [negocio.direccion, negocio.telefono].filter(Boolean).join(' · ') || '—',
      MX, 9.5, { color: TINTA_65 },
    );
    papel.y -= 13;
    papel.texto(
      prof?.nombre
        ? `El profesional que atendió (${prof.nombre}) no tiene matrícula registrada en e-PetPlace.`
        : 'El profesional prescriptor no tiene matrícula registrada en e-PetPlace.',
      MX, 8.5, { color: TINTA_65 },
    );
    papel.y -= 12;
  } else {
    papel.texto('Registrada en e-PetPlace', MX, 11, { font: papel.f.sansBold });
    papel.y -= 14;
    papel.texto(
      'La consulta de origen no tiene negocio ni profesional identificado.',
      MX, 8.5, { color: TINTA_65 },
    );
    papel.y -= 12;
  }

  // Pie con las DOS fechas (hecho + emisión) — y la declaración de nuevo
  papel.pie(
    `Emitido por e-PetPlace (hola@epetplace.com) · prescripción ${fechaLarga(fechaHecho)} · emisión ${fechaLarga(new Date().toISOString())} · folio ${fila.folio ?? '—'} · ${meds.length} medicamento(s) · sin vigencia`,
  );

  const bytes = await papel.bytes();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receta-${(mascota.nombre ?? 'mascota').toLowerCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
