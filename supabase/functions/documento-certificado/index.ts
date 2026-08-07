// ============================================================================
// documento-certificado — EL TERCER PAPEL (S90-D)
//
// MISMO MOLDE, probado dos veces (carnet S89 orden 8⑤ · historia clínica
// orden 10①): token quemable de un solo uso → PDF compuesto server-side con
// pdf-lib → espec de B sobre papel de impresión → banda de emisor en tinta →
// alcance declarado en el encabezado. No se inventa molde nuevo.
//
// ── LO ÚNICO QUE ESTE PAPEL HACE DISTINTO, y su porqué ──────────────────────
// Los otros dos imprimen EL EXPEDIENTE (todo lo que hay de esa mascota). Éste
// imprime UN ACTO: el token trae `referencia_id` y de ahí sale el certificado.
// Sin eso, el papel tendría que imprimir «el último», que miente en cuanto
// haya dos.
//
// ── LO QUE NO LEE, A PROPÓSITO ──────────────────────────────────────────────
// NO imprime vacunas. `MODELO_VETERINARIA` §13 lo dice desde S66: «un
// certificado de viaje no puede emitirse sobre una vacuna declarada por
// foto». El registro de vacunación con su procedencia fila por fila ES el
// carnet, y ése ya existe. Dos papeles, cada uno honesto sobre lo que sabe.
//
// La declaración NO se re-lee de ningún lado: viaja congelada en la fila. Un
// certificado que se reimprime tiene que decir LO QUE DIJO.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { componerCertificado, type Alcance } from './render.ts';

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

  // La puerta: validar y QUEMAR en el mismo acto. Un link reenviado a un
  // tercero ya no sirve — y en este papel importa el doble, porque lleva la
  // firma de una persona.
  const { data: fila } = await supabase
    .from('documento_token')
    .update({ usado_en: new Date().toISOString() })
    .eq('id', token)
    .eq('tipo', 'certificado_salud')
    .is('usado_en', null)
    .gt('expira_en', new Date().toISOString())
    .select('mascota_id, referencia_id')
    .maybeSingle();
  if (!fila) return new Response('token_invalido_o_vencido', { status: 410 });
  if (!fila.referencia_id) return new Response('token_sin_referencia', { status: 400 });

  // El `.eq('mascota_id')` no es redundante con el gate de la RPC: es el
  // cinturón del lado que compone. Si alguna vez un token quedara emitido
  // apuntando a un acto de otra mascota, acá muere.
  const { data: cert } = await supabase
    .from('certificado_salud')
    .select(
      'alcance, declaracion, fecha_examen, emitido_en, emisor_nombre, emisor_matricula, ' +
        'emisor_pais, negocio_nombre, negocio_direccion, negocio_telefono, estado_vida_al_emitir',
    )
    .eq('id', fila.referencia_id)
    .eq('mascota_id', fila.mascota_id)
    .maybeSingle();
  if (!cert) return new Response('certificado_no_encontrado', { status: 404 });

  const { data: mascota } = await supabase
    .from('mascotas')
    .select('nombre, especie, raza, sexo, fecha_nacimiento, microchip')
    .eq('id', fila.mascota_id)
    .single();
  if (!mascota) return new Response('mascota_no_encontrada', { status: 404 });

  const bytes = await componerCertificado({
    alcance: cert.alcance as Alcance,
    declaracion: cert.declaracion,
    fechaExamen: cert.fecha_examen,
    emitidoEn: cert.emitido_en,
    emisorNombre: cert.emisor_nombre,
    emisorMatricula: cert.emisor_matricula,
    emisorPais: cert.emisor_pais,
    negocioNombre: cert.negocio_nombre,
    negocioDireccion: cert.negocio_direccion,
    negocioTelefono: cert.negocio_telefono,
    mascotaNombre: mascota.nombre,
    mascotaEspecie: mascota.especie,
    mascotaRaza: mascota.raza,
    mascotaSexo: mascota.sexo,
    mascotaNacimiento: mascota.fecha_nacimiento,
    mascotaMicrochip: mascota.microchip,
    estadoVidaAlEmitir: cert.estado_vida_al_emitir as 'activa' | 'perdida' | 'fallecida',
  });

  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificado-${(mascota.nombre ?? 'mascota').toLowerCase()}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
