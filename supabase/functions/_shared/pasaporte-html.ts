// ============================================================================
// pasaporte-html.ts — LA PÁGINA PÚBLICA DEL PASAPORTE (S113-B · 1.3 · B4)
//
// Vive al lado de `papel.ts` porque es su hermana: los dos son LA CARA de la
// casa fuera de la app. La diferencia es el lector — `papel.ts` imprime para
// quien ya nos conoce; esto lo abre **un desconocido, en la calle, con el
// animal en brazos**.
//
// ── 🔴 LAS REGLAS SALEN DE ESE LECTOR, NO DEL GUSTO ─────────────────────
// · **SIN LOGIN.** Quien encontró al animal no va a crearse una cuenta.
// · **SIN SCRIPTS OBLIGATORIOS.** Cero JS: si el teléfono ajeno tiene el JS
//   apagado, la red mala o un navegador viejo, la página se lee IGUAL. *Una
//   página de emergencia que depende de que algo cargue no es de emergencia.*
// · **UN SOLO PAPEL, VERTICAL**, que se lee en dos segundos.
// · **EL TELÉFONO ES TOCABLE** (`tel:`): el gesto que importa es llamar, y
//   pedirle a alguien que copie un número a mano es perder el llamado.
// · **< 60 kB**, con la tipografía y los colores EMBEBIDOS — sin pedir una
//   fuente a un CDN que puede no responder.
//
// ⚠️ **La foto es la única petición de red.** Se declara: sin ella la página
// se lee entera igual, y por eso el `alt` dice el nombre.
//
// ── LOS COLORES SON LOS DE LA CASA, MEDIDOS ─────────────────────────────
// Tinta #221E19 sobre papel #FAF9F7 (16,2:1) · el aviso de perdida en ocre
// #F0A92A con TINTA encima (8,98 — `R56`: sobre el ocre el blanco da 1,89 y
// por eso jamás se usa) · el verde de llamar #0A7268 con blanco (5,3).
// ============================================================================

export interface DatosPasaportePublico {
  nombre: string
  /** URL de la foto. **Ausente ⇒ la página se lee igual**: no hay hueco gris. */
  fotoUrl?: string | null
  especieYRaza: string
  sexoYEdad: string
  /** `null` si la familia lo apagó — y apagado NO VIAJA hasta acá. */
  chip?: string | null
  contacto?: { nombre: string; telefono: string; mensaje: string } | null
  /** Alergias y medicación, ya en frases cortas. */
  salud?: readonly string[] | null
  perdidaDesde?: string | null
  /** El pasaporte dejó de valer. */
  revocado?: boolean
  /** Todos los textos, en el idioma de quien lo emitió (Ley 3). */
  voz: VozPasaportePublico
}

export interface VozPasaportePublico {
  /** *«Thor está perdido»* — con el nombre adentro. */
  tituloPerdida: string
  /** *«Llamá a su familia»*. */
  llamar: string
  whatsapp: string
  rotuloChip: string
  rotuloSalud: string
  /** *«Pasaporte de e-PetPlace · si esta mascota está perdida, avisá a su familia»*. */
  pie: string
  /** *«Este pasaporte ya no está activo»*. */
  revocado: string
  /** Para el `alt` de la foto: *«Foto de Thor»*. */
  altFoto: string
}

const TINTA = '#221E19'
const TINTA_65 = '#6F6D6A'
const PAPEL = '#FAF9F7'
const OCRE = '#F0A92A'
const VERDE = '#0A7268'

/** Escapa lo que viene de la familia. **Los nombres de mascota y los mensajes
 *  los escribe gente**, y un `<` suelto rompe la página o abre un agujero. */
function esc(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Deja sólo lo que un `tel:` acepta. *Un teléfono con espacios y guiones se
 *  ve bien y no marca.* */
export function telHref(t: string): string {
  return t.replace(/[^\d+]/g, '')
}

/** El CSS, embebido y corto. **Sin `@import` ni fuentes remotas**: la página
 *  tiene que pintar con lo que el teléfono ya tiene. */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:${PAPEL};color:${TINTA};font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif;line-height:1.45;padding:20px;max-width:520px;margin:0 auto}
.aviso{background:${OCRE};color:${TINTA};border-radius:12px;padding:16px;margin-bottom:20px}
.aviso h1{font-size:22px;line-height:1.2}
.aviso a{display:block;margin-top:12px;background:${TINTA};color:${PAPEL};text-decoration:none;text-align:center;padding:14px;border-radius:999px;font-size:17px;font-weight:600}
.foto{width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px;background:#EDEBF5}
h2{font-size:28px;margin-top:16px}
.sub{color:${TINTA_65};font-size:16px}
.dato{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:${TINTA_65};margin-top:8px}
.bloque{margin-top:24px}
.bloque h3{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:${TINTA_65};margin-bottom:8px}
ul{list-style:none}
li{padding:6px 0;border-bottom:1px solid rgba(34,30,25,.12)}
.acciones{display:flex;gap:10px;margin-top:12px}
.acciones a{flex:1;text-align:center;padding:14px;border-radius:999px;text-decoration:none;font-weight:600;font-size:16px}
.llamar{background:${VERDE};color:#FFFFFF}
.wa{background:transparent;color:${TINTA};border:1px solid rgba(34,30,25,.25)}
footer{margin-top:32px;color:${TINTA_65};font-size:12px;text-align:center}
`.trim()

/**
 * La página entera, como texto.
 *
 * 🔴 **El estado revocado corta antes que todo lo demás**: no se dibuja media
 * página con los datos tachados. *Un pasaporte que ya no vale no muestra el
 * teléfono de nadie.*
 */
export function paginaPasaporte(d: DatosPasaportePublico): string {
  const v = d.voz
  const cabeza = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.nombre)}</title><style>${CSS}</style></head><body>`
  const pie = `<footer>${esc(v.pie)}</footer></body></html>`

  if (d.revocado === true) {
    return `${cabeza}<div class="bloque"><h2>${esc(v.revocado)}</h2></div>${pie}`
  }

  const partes: string[] = [cabeza]

  /* 🔴 EL AVISO PRIMERO, con el teléfono TOCABLE adentro: el que encontró al
     animal tiene que poder llamar sin leer nada más. */
  if (d.perdidaDesde != null && d.contacto != null) {
    partes.push(
      `<div class="aviso"><h1>${esc(v.tituloPerdida)}</h1><p>${esc(d.perdidaDesde)}</p>` +
        `<a href="tel:${telHref(d.contacto.telefono)}">${esc(v.llamar)} ${esc(d.contacto.telefono)}</a></div>`,
    )
  }

  /* La foto es la ÚNICA petición de red, y su ausencia no deja un hueco. */
  if (d.fotoUrl != null && d.fotoUrl !== '') {
    partes.push(`<img class="foto" src="${esc(d.fotoUrl)}" alt="${esc(v.altFoto)}">`)
  }

  partes.push(`<h2>${esc(d.nombre)}</h2>`)
  partes.push(`<p class="sub">${esc(d.especieYRaza)}</p>`)
  partes.push(`<p class="sub">${esc(d.sexoYEdad)}</p>`)
  if (d.chip != null && d.chip !== '') {
    partes.push(`<p class="dato">${esc(v.rotuloChip)} ${esc(d.chip)}</p>`)
  }

  if (d.contacto != null) {
    partes.push(
      `<div class="bloque"><h3>${esc(d.contacto.nombre)}</h3><p class="sub">${esc(d.contacto.mensaje)}</p>` +
        `<div class="acciones">` +
        `<a class="llamar" href="tel:${telHref(d.contacto.telefono)}">${esc(v.llamar)}</a>` +
        `<a class="wa" href="https://wa.me/${telHref(d.contacto.telefono).replace(/^\+/, '')}">${esc(v.whatsapp)}</a>` +
        `</div></div>`,
    )
  }

  /* Lista corta y con su rótulo: quien la lea puede estar por darle de comer. */
  if (d.salud != null && d.salud.length > 0) {
    partes.push(
      `<div class="bloque"><h3>${esc(v.rotuloSalud)}</h3><ul>${d.salud.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>`,
    )
  }

  partes.push(pie)
  return partes.join('')
}
