/**
 * gen-correo-demos-v2.mjs — genera las TRES demos de la cara del correo v2
 * (S89-B orden 8) desde UN chasis único.
 *
 * POR QUÉ GENERADAS Y NO ESCRITAS A MANO: la tesis de la v2 es que los tres
 * correos se reconozcan como hermanos — «el chasis idéntico es lo que hace
 * que el correo se reconozca al abrirlo». Tres archivos escritos a mano
 * divergen al primer retoque (19.9: lo que se copia diverge). Acá el chasis
 * es UNO y lo que varía está declarado en `TIPOS`.
 *
 * El isotipo va como data-URI SOLO EN LA DEMO, para que el ojo vea el
 * resultado sin servidor. ⚠️ EN PRODUCCIÓN ES PNG HOSTED: los clientes de
 * correo NO renderizan SVG (Gmail/Outlook lo descartan) — el export a PNG
 * @2x y su URL estática son tarea de A.
 *
 * Correr: node scripts/gen-correo-demos-v2.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'

const ISOTIPO_B64 = readFileSync('packages/ui/assets/brand/isotipo-gradiente.svg').toString('base64')
const ISOTIPO_SRC = `data:image/svg+xml;base64,${ISOTIPO_B64}`

// ── tokens (palette.ts — fuente única) ───────────────────────────────
const T = {
  papel: '#FAF9F7',
  tapiz: '#FAF2F5', // cliente — pink 3%
  tapizOficio: '#F4F8F6', // prestador — teal 3% (el slot bg.base de su casa)
  tinta: '#221E19',
  tinta65: 'rgba(34,30,25,.65)',
  borde: 'rgba(34,30,25,.18)',
  bordeCaja: 'rgba(34,30,25,.35)',
  bordeCta: 'rgba(34,30,25,.45)',
  magentaDark: '#8E1F68',
  oro: '#FCBC1D',
  oroTexto: '#1D1A2E', // textLight0 — el par firmado 9.96
  tealDark: '#0A7268',
}
const SANS = "'DM Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

/** Lo que varía entre tipos — y NADA más (el chasis es uno). */
const TIPOS = {
  confirmada: {
    archivo: 's89-b-correo-v2-confirmada.html',
    rotulo: 'CITA CONFIRMADA — al DUEÑO (casa cliente) · c&aacute;lida: la mascota preside, CTA oro (par firmado 9.96)',
    titulo: 'Cita confirmada',
    casa: 'cliente',
    saludo: 'Hola, Ana.',
    frase: 'La cita de Luna qued&oacute; confirmada. Te esperamos.',
    heroe: 'Luna',
    heroeAbajo: 'Jueves 14 de agosto &middot; 10:30',
    detalle: 'Consulta general &middot; Cl&iacute;nica Veterinaria Andina',
    cta: 'Ver la cita',
    linkTexto: 'Ver la cita en e-PetPlace',
    cierre: 'Si necesitas moverla, puedes hacerlo desde la app hasta 24 horas antes.',
  },
  solicitada: {
    archivo: 's89-b-correo-v2-solicitada.html',
    rotulo: 'CITA SOLICITADA — al NEGOCIO (casa prestador) · expectante, cero celebraci&oacute;n · CTA tealDark (5.51)',
    titulo: 'Nueva solicitud de cita',
    casa: 'prestador',
    saludo: 'Hola, Andr&eacute;s.',
    frase: 'La familia Morales pidi&oacute; una cita. Est&aacute; esperando tu respuesta.',
    heroe: 'Luna',
    heroeAbajo: 'Jueves 14 de agosto &middot; 10:30',
    detalle: 'Consulta general &middot; solicitada hace 12 minutos',
    cta: 'Ver la solicitud',
    linkTexto: 'Ver la solicitud en e-PetPlace',
    cierre: 'La solicitud queda disponible por 24 horas; despu&eacute;s se libera el horario.',
  },
  recordatorio: {
    archivo: 's89-b-correo-v2-recordatorio.html',
    rotulo: 'RECORDATORIO — al DUEÑO · &uacute;til y serena: EL CU&Aacute;NDO preside, la celebraci&oacute;n se dosifica',
    titulo: 'Recordatorio de cita',
    casa: 'cliente',
    saludo: 'Hola, Ana.',
    frase: 'Te recordamos la cita de Luna.',
    heroe: 'Ma&ntilde;ana &middot; 10:30',
    heroeAbajo: 'Luna &middot; consulta general',
    detalle: 'Cl&iacute;nica Veterinaria Andina &middot; Av. de los Cipreses N40-12, Quito',
    cta: 'Ver la cita',
    linkTexto: 'Ver la cita en e-PetPlace',
    cierre: 'Si algo cambi&oacute;, avisa a la cl&iacute;nica desde la app.',
  },
}

/** LA CASA SE HEREDA ENTERA, no a medias (S89-B, atrape al generar): si el
 *  CTA cambia de casa, el TAPIZ del bloque también — el prestador tiene el
 *  suyo (`papelTapizOficio`, teal 3%, slot `bg.base` desde S83-B33/B34).
 *  Un correo al negocio con el tapiz rosa del cliente sería la casa
 *  equivocada en el correo correcto. Pares: tinta/tapiz cliente 15.05 ·
 *  tinta/tapizOficio 15.46 (los dos ~1.0 contra el papel: temperatura, no
 *  separación — el borde da la estructura en ambos). */
const casaDe = (casa) =>
  casa === 'cliente'
    ? { fill: T.oro, label: T.oroTexto, borde: T.bordeCta, tapiz: T.tapiz, link: T.magentaDark, linkDark: '#AE59FF', nota: 'oro + label textLight0 = 9.96 &middot; boundary por borde 4.04 &middot; tapiz del cliente (tinta 15.05) &middot; link magentaDark 7.84' }
    : { fill: T.tealDark, label: T.papel, borde: T.tealDark, tapiz: T.tapizOficio, link: T.tealDark, linkDark: '#28E8DA', nota: 'tealDark + papel = 5.51 &middot; el fill se separa solo (5.80) &middot; tapiz del oficio (tinta 15.46) &middot; link tealDark 5.51 (§15b.1: en el prestador el magenta vive SOLO en la marca)' }

const plantilla = (t) => {
  const cta = casaDe(t.casa)
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>s89-b · demo v2 — ${t.titulo} (MUESTRA)</title>
<!--
  DEMO v2 (S89-B orden 8) — GENERADA por scripts/gen-correo-demos-v2.mjs.
  Espec: docs/relevamientos/2026-08-06-s89b-ESPEC-cara-del-correo-v2.md
  · Los TEXTOS son SLOT (la firma dice que los textos quedan): A cablea los
    suyos desde _voz_notificacion. Lo que el ojo juzga acá es DISEÑO.
  · El isotipo va como data-URI SOLO ACÁ; en producción es PNG hosted en
    dominio propio, sin query params (los clientes de correo no soportan SVG).
  · lang="es" es REQUISITO (acta S88-A: Gmail leyó «inglés» en el gate) —
    en producción sigue el idioma del destinatario.
-->
<style>
  body { margin:0; padding:32px 16px; background:#E8E6E3; }
  .rotulo { max-width:600px; margin:0 auto 10px; font:12px/17px Consolas,Menlo,monospace; color:#55524E; }
  @media (prefers-color-scheme: dark) {
    /* el par oscuro de la casa — solo lo honran los clientes que preguntan */
    .marco { background:#050508 !important; }
    .txt { color:#F0EEF8 !important; }
    .txt65 { color:rgba(240,238,248,.65) !important; }
    .caja { background:#12121A !important; border-color:rgba(240,238,248,.18) !important; }
    .hair { border-color:rgba(240,238,248,.18) !important; }
    .link { color:${cta.linkDark} !important; }
  }
</style>
</head>
<body>
<p class="rotulo">${t.rotulo}</p>

<!-- ═════════ LA PLANTILLA (esto es lo que viaja) ═════════ -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="marco" style="max-width:600px;margin:0 auto;background-color:${T.papel};border-radius:12px;">

  <!-- (a) CABECERA — marca y aire. El wordmark es TEXTO: si la imagen
       viene bloqueada, la cabecera sigue diciendo la casa (el fallback
       no se tira, se degrada a él). -->
  <tr><td style="padding:40px 32px 0 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:10px;vertical-align:middle;">
        <img src="${ISOTIPO_SRC}" width="46" height="32" alt="e-PetPlace" style="display:block;border:0;">
      </td>
      <td style="vertical-align:middle;">
        <span class="txt" style="font-family:${SANS};font-size:18px;font-weight:600;color:${T.tinta};">e-PetPlace</span>
      </td>
    </tr></table>
  </td></tr>
  <!-- el filete es MARCA, no función: magentaDark en las DOS casas.
       §15b.1 lo permite explícitamente («el magenta vive SOLO en la
       marca»); lo que SÍ hereda casa es el acento FUNCIONAL (CTA y
       links), abajo. -->
  <tr><td style="padding:16px 32px 0 32px;">
    <div style="border-top:2px solid ${T.magentaDark};font-size:0;line-height:0;">&nbsp;</div>
  </td></tr>

  <!-- (b) SALUDO + FRASE — SLOT de voz (A cablea el texto real) -->
  <tr><td style="padding:28px 32px 0 32px;">
    <p class="txt" style="margin:0 0 10px 0;font-family:${SANS};font-size:22px;font-weight:500;line-height:30px;color:${T.tinta};">${t.saludo}</p>
    <p class="txt" style="margin:0;font-family:${SANS};font-size:16px;line-height:24px;color:${T.tinta};">${t.frase}</p>
  </td></tr>

  <!-- (c) EL CORAZÓN — el bloque de detalle. Fondo = TEMPERATURA (tapiz,
       1.05 contra el papel: no separa y no tiene que hacerlo); borde =
       ESTRUCTURA. El contenido se lee sin la caja. -->
  <tr><td style="padding:22px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="caja" style="background-color:${cta.tapiz};border:1px solid ${T.bordeCaja};border-radius:12px;padding:28px;">
        <p class="txt" style="margin:0 0 6px 0;font-family:${SANS};font-size:26px;font-weight:600;line-height:32px;color:${T.tinta};">${t.heroe}</p>
        <p class="txt" style="margin:0 0 10px 0;font-family:${SANS};font-size:17px;font-weight:500;line-height:24px;color:${T.tinta};">${t.heroeAbajo}</p>
        <p class="txt65" style="margin:0;font-family:${SANS};font-size:14px;line-height:20px;color:${T.tinta65};">${t.detalle}</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- (d) CTA — la casa correcta en el correo correcto (${cta.nota}) -->
  <tr><td style="padding:24px 32px 0 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background-color:${cta.fill};border:1px solid ${cta.borde};border-radius:10px;">
        <a href="#" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:16px;font-weight:600;color:${cta.label};text-decoration:none;">${t.cta}</a>
      </td>
    </tr></table>
    <!-- redundancia de canal: si el fill muere en una inversión forzada,
         el link sobrevive (nada informativo viaja solo en color) -->
    <p style="margin:12px 0 0 0;font-family:${SANS};font-size:14px;line-height:20px;">
      <a class="link" href="#" style="color:${cta.link};text-decoration:underline;">${t.linkTexto}</a>
    </p>
  </td></tr>

  <!-- cierre -->
  <tr><td style="padding:20px 32px 0 32px;">
    <p class="txt" style="margin:0;font-family:${SANS};font-size:16px;line-height:24px;color:${T.tinta};">${t.cierre}</p>
  </td></tr>

  <!-- (e) PIE — marca chica, la casa firma sin volver a gritar -->
  <tr><td style="padding:32px 32px 28px 32px;">
    <div class="hair" style="border-top:1px solid ${T.borde};font-size:0;line-height:0;margin-bottom:14px;">&nbsp;</div>
    <p class="txt65" style="margin:0 0 6px 0;font-family:${SANS};font-size:13px;font-weight:600;line-height:20px;color:${T.tinta65};">e-PetPlace</p>
    <p class="txt65" style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${T.tinta65};">
      Este correo sali&oacute; de avisos@avisos.epetplace.com<br>
      Lo recibes porque existe una cuenta de e-PetPlace con tu direcci&oacute;n.
    </p>
  </td></tr>
</table>
<!-- ═════════ fin de la plantilla ═════════ -->

<p class="rotulo" style="margin-top:14px;">MUESTRA &middot; datos ficticios &middot; los TEXTOS son slot de A (la firma es 100% de dise&ntilde;o) &middot; isotipo data-URI solo en la demo: en producci&oacute;n PNG hosted sin tracking</p>
</body>
</html>
`
}

for (const t of Object.values(TIPOS)) {
  writeFileSync(`scripts/capturas/${t.archivo}`, plantilla(t))
  console.log(`✓ scripts/capturas/${t.archivo}`)
}
