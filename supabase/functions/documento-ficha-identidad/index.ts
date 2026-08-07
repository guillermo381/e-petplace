// ============================================================================
// documento-ficha-identidad — EL QUINTO PAPEL (S90-A · orden 3)
//
// El más barato de los cinco y el de más uso real: hotel, guardería,
// mudanza, mascota perdida, primera visita a otra clínica. TODO EL DATO YA
// EXISTE — este papel no pide captura nueva: imprime el eje 1 del
// Bio-Expediente (identidad) con la honestidad de la casa.
//
// LAS DOS REGLAS QUE NO SE RELAJAN (orden 3):
//   · El microchip es visible al vet, no público. Este papel lo lleva
//     porque LA FAMILIA LO ENTREGA EN MANO — y el alcance se declara en el
//     encabezado.
//   · Un campo que no se conoce se dice «No registrado», jamás vacío ni
//     inventado. La ausencia honesta es dato; el hueco mudo es un papel
//     roto (L-139).
//
// «Mestizo» es categoría legítima, no inferior: se imprime como cualquier
// raza. «Vet de cabecera» no existe como concepto en el motor — lo que se
// imprime es un HECHO: la última atención veterinaria registrada, dicha
// como lo que es (declarado en el reporte de cierre).
//
// La CARA vive en `_shared/papel.ts` (espec de B + D-677 + D-681).
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { A4, MX, Papel, TINTA_65, fechaLarga } from '../_shared/papel.ts';

const NO_REGISTRADO = 'No registrado en e-PetPlace';

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
    .eq('tipo', 'ficha_identidad')
    .is('usado_en', null)
    .gt('expira_en', new Date().toISOString())
    .select('mascota_id, folio')
    .maybeSingle();
  if (!fila) return new Response('token_invalido_o_vencido', { status: 410 });

  const { data: m } = await supabase
    .from('mascotas')
    .select(
      'nombre, especie, raza, sexo, fecha_nacimiento, fecha_nacimiento_precision, foto_url, microchip, familia_id',
    )
    .eq('id', fila.mascota_id)
    .single();
  if (!m) return new Response('mascota_no_encontrada', { status: 404 });

  // ── Los datos del expediente, cada uno de su fuente viva ──────────────────
  // Peso más reciente: la medición clínica manda; si no hay, el peso de la
  // última consulta. Sin ninguno: no registrado.
  const { data: pesos } = await supabase
    .from('evento_peso_medicion')
    .select('peso_kg, fecha_medicion')
    .eq('mascota_id', fila.mascota_id)
    .order('fecha_medicion', { ascending: false })
    .limit(1);
  let peso: { kg: number; fecha: string | null } | null = pesos?.length
    ? { kg: pesos[0].peso_kg, fecha: pesos[0].fecha_medicion }
    : null;
  if (!peso) {
    const { data: hcPeso } = await supabase
      .from('evento_historia_clinica_registrada')
      .select('peso_kg, completado_en')
      .eq('mascota_id', fila.mascota_id)
      .not('peso_kg', 'is', null)
      .order('completado_en', { ascending: false })
      .limit(1);
    if (hcPeso?.length) peso = { kg: hcPeso[0].peso_kg, fecha: hcPeso[0].completado_en };
  }

  // Estado reproductivo: solo lo que una intervención registrada diga.
  const { data: intervenciones } = await supabase
    .from('evento_intervencion_permanente')
    .select('tipo_intervencion, descripcion, fecha_realizada')
    .eq('mascota_id', fila.mascota_id);
  const esteril = (intervenciones ?? []).find((i) =>
    /esteril|castr/i.test(`${i.tipo_intervencion ?? ''} ${i.descripcion ?? ''}`),
  );

  // Microchip: el evento tipado manda; la columna directa de mascotas es el
  // respaldo del alta. Sin ninguno: no registrado.
  const { data: chips } = await supabase
    .from('evento_microchip_asignado')
    .select('microchip_id, fabricante, fecha_implante')
    .eq('mascota_id', fila.mascota_id)
    .order('fecha_implante', { ascending: false, nullsFirst: false })
    .limit(1);
  const chip = chips?.length
    ? chips[0]
    : m.microchip && m.microchip.trim() !== ''
      ? { microchip_id: m.microchip.trim(), fabricante: null, fecha_implante: null }
      : null;

  // Familia responsable: el nombre de la familia + el contacto del titular.
  const { data: familia } = m.familia_id
    ? await supabase.from('familia').select('nombre').eq('id', m.familia_id).maybeSingle()
    : { data: null };
  let titular: { nombre: string | null; telefono: string | null; codigo: string | null; email: string | null } | null = null;
  if (m.familia_id) {
    const { data: miembros } = await supabase
      .from('familia_miembro')
      .select('user_id, desde')
      .eq('familia_id', m.familia_id)
      .eq('rol', 'adulto_titular')
      .is('hasta', null)
      .order('desde', { ascending: true })
      .limit(1);
    if (miembros?.length) {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('nombre, telefono, telefono_codigo_pais, email')
        .eq('id', miembros[0].user_id)
        .maybeSingle();
      if (perfil) {
        titular = {
          nombre: perfil.nombre,
          telefono: perfil.telefono,
          codigo: perfil.telefono_codigo_pais,
          email: perfil.email,
        };
      }
    }
  }

  // Última atención veterinaria registrada (un hecho, no «vet de cabecera»)
  const { data: ultimaHc } = await supabase
    .from('evento_historia_clinica_registrada')
    .select('prestador_id, completado_en')
    .eq('mascota_id', fila.mascota_id)
    .order('completado_en', { ascending: false })
    .limit(1);
  let vet: { negocio: string; fecha: string | null } | null = null;
  if (ultimaHc?.length && ultimaHc[0].prestador_id) {
    const { data: pr } = await supabase
      .from('prestadores')
      .select('nombre_comercial, telefono')
      .eq('id', ultimaHc[0].prestador_id)
      .maybeSingle();
    if (pr?.nombre_comercial) {
      vet = {
        negocio: [pr.nombre_comercial, pr.telefono].filter(Boolean).join(' · '),
        fecha: ultimaHc[0].completado_en,
      };
    }
  }

  // La foto, del bucket privado (el papel viaja en mano — la foto es del papel)
  let foto: { bytes: Uint8Array; esPng: boolean } | null = null;
  if (m.foto_url) {
    const { data: blob } = await supabase.storage.from('mascotas').download(m.foto_url);
    if (blob) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (bytes.length > 8) {
        const esPng = bytes[0] === 0x89 && bytes[1] === 0x50;
        const esJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
        if (esPng || esJpg) foto = { bytes, esPng };
      }
    }
  }

  // ── El papel ──────────────────────────────────────────────────────────────
  const papel = await Papel.crear();
  papel.cabecera('Ficha de identidad', [
    'Documento emitido por e-PetPlace con los datos de identidad del expediente. Un dato que no se conoce se declara — no se inventa.',
    // La regla del microchip: el alcance SE DECLARA EN EL ENCABEZADO.
    'Incluye el número de microchip cuando está registrado: este papel se entrega en mano, y la familia decide a quién.',
    'El folio identifica esta emisión; todavía no existe un mecanismo público de verificación en línea.',
  ], fila.folio);

  // La foto va arriba a la derecha, junto a la identidad — pero se DIBUJA al
  // final (misma página, misma posición): así queda ENCIMA de las hairlines
  // de las primeras filas, con el borde limpio.
  let dibujarFoto: (() => void) | null = null;
  if (foto) {
    try {
      const img = foto.esPng ? await papel.pdf.embedPng(foto.bytes) : await papel.pdf.embedJpg(foto.bytes);
      const lado = 88;
      const esc = Math.min(lado / img.width, lado / img.height);
      const w = img.width * esc;
      const h = img.height * esc;
      const pagina = papel.page;
      const x = A4[0] - MX - w;
      const yFoto = papel.y - h + 14;
      dibujarFoto = () => pagina.drawImage(img, { x, y: yFoto, width: w, height: h });
    } catch (_e) {
      // una foto que no embebe no rompe el papel: la ficha sale sin foto
      foto = null;
    }
  }

  const nac = m.fecha_nacimiento
    ? `${fechaLarga(m.fecha_nacimiento + 'T00:00:00Z')}${m.fecha_nacimiento_precision === 'estimada' ? ' (estimada)' : ''}`
    : 'No conocida';
  papel.identidad(m.nombre ?? '—', `${m.especie ?? '—'}${m.raza ? ` · ${m.raza}` : ''}`);

  // ── Las filas de la ficha: rótulo + dato, separadas por hairline ─────────
  const filaAncho = 168;
  const filaDato = (rotulo: string, valor: string, mono = false) => {
    papel.asegura(96);
    papel.texto(rotulo.toUpperCase(), MX, 9, { font: papel.f.sansBold, color: TINTA_65 });
    papel.texto(valor, MX + filaAncho, 10.5, mono ? { font: papel.f.mono } : {});
    papel.y -= 12;
    papel.hairline(papel.y);
    papel.y -= 14;
  };

  filaDato('Especie', m.especie ?? NO_REGISTRADO);
  // «Mestizo» es categoría legítima, no inferior — se imprime tal cual.
  filaDato('Raza', m.raza ?? 'No registrada en e-PetPlace');
  filaDato('Sexo', m.sexo ?? NO_REGISTRADO);
  filaDato('Nacimiento', nac);
  // El dato «marcas distintivas» no existe en el expediente todavía: la
  // ausencia se dice con todas las letras (jamás un hueco mudo).
  filaDato('Marcas distintivas', 'No registradas en e-PetPlace');
  filaDato(
    'Peso más reciente',
    peso ? `${peso.kg} kg · ${fechaLarga(peso.fecha)}` : NO_REGISTRADO,
  );
  filaDato(
    'Estado reproductivo',
    esteril
      ? `Esterilización registrada${esteril.fecha_realizada ? ` · ${fechaLarga(esteril.fecha_realizada)}` : ''}`
      : NO_REGISTRADO,
  );
  filaDato(
    'Microchip',
    chip
      ? [chip.microchip_id, chip.fabricante, chip.fecha_implante ? `implantado ${fechaLarga(chip.fecha_implante)}` : null]
          .filter(Boolean)
          .join(' · ')
      : NO_REGISTRADO,
    chip != null, // el número exacto va en mono
  );

  papel.y -= 8;
  papel.rotulo('FAMILIA RESPONSABLE');
  if (familia?.nombre || titular) {
    if (familia?.nombre) {
      papel.texto(familia.nombre, MX, 10.5, { font: papel.f.sansBold });
      papel.y -= 13;
    }
    if (titular) {
      const tel = titular.telefono
        ? titular.telefono.startsWith('+')
          ? titular.telefono
          : [titular.codigo, titular.telefono].filter(Boolean).join(' ')
        : null;
      const contacto = [titular.nombre, tel, titular.email].filter(Boolean).join(' · ');
      papel.texto(contacto || NO_REGISTRADO, MX, 9.5, { color: TINTA_65 });
      papel.y -= 13;
    }
  } else {
    papel.texto(NO_REGISTRADO, MX, 10.5);
    papel.y -= 13;
  }

  papel.y -= 8;
  papel.rotulo('ATENCIÓN VETERINARIA');
  if (vet) {
    papel.texto(`Última atención registrada: ${vet.negocio}`, MX, 10.5);
    papel.y -= 13;
    papel.texto(fechaLarga(vet.fecha), MX, 9.5, { color: TINTA_65 });
    papel.y -= 13;
  } else {
    papel.texto('Sin atenciones veterinarias registradas en e-PetPlace.', MX, 10.5);
    papel.y -= 13;
  }

  // La foto, encima de todo lo que le pase por debajo
  if (dibujarFoto) dibujarFoto();

  // Pie con las DOS fechas: emisión + el último movimiento del expediente
  papel.pie(
    `Emitido por e-PetPlace (hola@epetplace.com) · folio ${fila.folio ?? '—'} · emisión ${fechaLarga(new Date().toISOString())} · los datos reflejan el expediente al momento de la emisión`,
  );

  const bytes = await papel.bytes();
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ficha-${(m.nombre ?? 'mascota').toLowerCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
