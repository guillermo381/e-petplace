/**
 * verify-contrast.ts — Gate WCAG de los Design Tokens v4 (S43-B2).
 *
 * Valida TODO par (texto funcional, su fondo) de los tres temas:
 *   ≥ 4.5:1 texto · ≥ 3:1 para pares marcados `noTextual` (WCAG 1.4.11).
 * Fondos con alpha se compositan sobre su superficie real antes de medir.
 * Si un par falla, el script FALLA (exit 1) imprimiendo par y ratio.
 *
 * FUERA del gate (documentado):
 *   · text.tertiary — placeholder/decorativo, no texto funcional
 *   · bordes y gradientSubtle — no son fondos de texto
 *   · palette.amarillo — solo marca/logo, jamás porta texto
 *   · capa.* y accent.active (B2.1) — REGISTRO GRÁFICO (puntos, indicadores,
 *     subrayados): AA gobierna texto, no gráfica. El texto usa capaText.*
 *   · tab INACTIVO de BarraTabs (B3.7) — text.tertiary por espec firmada
 *     (convención de plataforma: el tab no seleccionado se atenúa; el icono
 *     duplica el canal y el activo sí gatea). Se imprime medición informativa.
 *   · anillo de CitaEnVivo (S44-B2.1) — hex puro de capa, registro gráfico
 *     REDUNDANTE: el canal semántico es el pill "● vivo", cuyo texto
 *     (capaText / bg.card) SÍ gatea arriba. Medición informativa.
 *
 * Correr: pnpm exec tsx scripts/verify-contrast.ts
 */


import { lightTheme, darkTheme, memorialTheme, getTheme, type Theme } from '../packages/ui/src/themes'
import { palette } from '../packages/ui/src/tokens/palette'

type RGBA = { r: number; g: number; b: number; a: number }

function parse(color: string): RGBA {
  if (color.startsWith('#')) {
    const h = color.slice(1)
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    }
  }
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/)
  if (!m) throw new Error(`Color no parseable: ${color}`)
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 }
}

/** Composita fg (con alpha) sobre bg opaco. */
function blend(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  }
}

function luminance({ r, g, b }: RGBA): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Contraste WCAG. El texto con alpha se composita sobre el fondo antes de medir. */
function contrast(fgStr: string, bgStr: string, surface?: string): number {
  let bg = parse(bgStr)
  if (bg.a < 1) {
    if (!surface) throw new Error(`Fondo con alpha sin superficie: ${bgStr}`)
    bg = blend(bg, parse(surface))
  }
  let fg = parse(fgStr)
  if (fg.a < 1) fg = blend(fg, bg)
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

type Pair = {
  nombre: string
  fg: string
  bg: string
  /** superficie real debajo cuando bg tiene alpha */
  surface?: string
  /** 🔴 S98: se llamaba `large` (texto ≥22px) y **jamás midió texto grande** —
   *  su ÚNICO uso previo era un spinner sobre scrim, con «3:1 gráfico»
   *  escrito al lado. El nombre describía un caso que no existía, que es
   *  exactamente el defecto que hizo invisible el par del avatar durante
   *  cuatro sesiones. Ahora dice su razón real: **WCAG 1.4.11, contraste
   *  NO TEXTUAL** — gráficas y componentes de interfaz, piso 3:1.
   *  Si algún día hace falta el 3:1 de TEXTO GRANDE (1.4.3), nace su propio
   *  flag con su propia razón: son dos reglas distintas que coinciden en el
   *  número, y un flag que las junta vuelve a mentir. */
  noTextual?: boolean
}

/** El interior del campo, tal como lo resuelve `caja-de-campo.ts` — se
 *  espeja acá en vez de importarse porque este script no monta React, y
 *  un espejo de UNA línea con su fuente nombrada es más barato que
 *  arrastrar el módulo. Si la fuente cambia, R43 sigue midiendo el borde
 *  y este par se corrige junto con ella. */
const INTERIOR_CAMPO = (t: Theme): string => (t.mode === 'light' ? t.bg.card : t.bg.overlay)

function paresDe(t: Theme, nombre: string): Pair[] {
  const p: Pair[] = []
  const add = (n: string, fg: string, bg: string, surface?: string, noTextual?: boolean) =>
    p.push({ nombre: `${nombre} · ${n}`, fg, bg, surface, noTextual })

  // Texto base sobre superficies
  for (const s of ['base', 'card', 'elevated', 'overlay'] as const) {
    add(`text.primary / bg.${s}`, t.text.primary, t.bg[s])
  }
  for (const s of ['base', 'card', 'elevated'] as const) {
    add(`text.secondary / bg.${s}`, t.text.secondary, t.bg[s])
  }
  // Narrativa cálida (bg.warm puede ser alpha → composita sobre card)
  add('text.warm / bg.warm', t.text.warm, t.bg.warm, t.bg.card)

  /** S99-B · N11 — EL CONTORNO DEL CAMPO, con su piso GRÁFICO (3:1).
   *
   *  Entra al gate porque **es el único elemento del formulario que dice
   *  «acá se escribe»**: desde N11 el relleno dejó de hacer ese trabajo
   *  (`sinCaja` derogada), así que si el contorno se afloja, el campo no
   *  queda feo — **queda invisible**.
   *
   *  Se mide contra `bg.base` y no contra el interior de la caja porque
   *  la ley dice «contra el fondo», y medir contra el interior daría
   *  números más cómodos. **`noTextual`: es un límite gráfico, no texto.**
   *  Su hermana mecánica es R43 en `verify:diseno`, que vigila el mismo
   *  piso del lado del token — dos guards, dos puertas. */
  add('border.campo / bg.base (N11 ≥3:1)', t.border.campo, t.bg.base, undefined, true)
  /** Y la etiqueta que N11 metió ADENTRO de la caja: su fondo ya no es la
   *  pantalla, es el interior del campo. El par cambió de vecino, así que
   *  se mide en su vecino nuevo. */
  add('text.secondary / interior del campo (etiqueta N11 adentro)', t.text.secondary, INTERIOR_CAMPO(t))

  // Acentos usados como texto (links, labels) sobre base y card
  add('accent.primary / bg.base', t.accent.primary, t.bg.base)
  add('accent.primary / bg.card', t.accent.primary, t.bg.card)
  add('accent.brand / bg.base', t.accent.brand, t.bg.base)
  add('accent.brand / bg.card', t.accent.brand, t.bg.card)
  add('accent.warm / bg.base', t.accent.warm, t.bg.base)
  add('accent.warm / bg.card', t.accent.warm, t.bg.card)

  // Capas como etiqueta de texto — B2.1: el registro de texto es capaText.
  // Memorial no tiene capaText (INTACTO de v3.1): ahí capa.* cumple ambos roles.
  const capaTexto = 'capaText' in t ? t.capaText : t.capa
  for (const c of ['identidad', 'cuidado', 'comunidad', 'comunidadAmplia'] as const) {
    add(`capaText.${c} / bg.base`, capaTexto[c], t.bg.base)
    add(`capaText.${c} / bg.card`, capaTexto[c], t.bg.card)
  }

  // Status: su texto sobre su fondo tinteado (compositado sobre card) y sobre card pelada
  for (const s of ['success', 'warning', 'danger', 'info'] as const) {
    add(`status.${s}Text / status.${s}Bg⊕card`, t.status[`${s}Text`], t.status[`${s}Bg`], t.bg.card)
    add(`status.${s}Text / bg.card`, t.status[`${s}Text`], t.bg.card)
  }

  // Tintes de Tarjeta (B3.2): el texto AA de cada capa sobre su tint compositado.
  // (warning/danger/success ya están cubiertos por los pares de status de arriba;
  // vida comparte tint con success.)
  add('capaText.identidad / Tarjeta vida (successBg⊕card)', capaTexto.identidad, t.status.successBg, t.bg.card)
  add('capaText.cuidado / Tarjeta cuidado (infoBg⊕card)', capaTexto.cuidado, t.status.infoBg, t.bg.card)
  add('capaText.comunidad / Tarjeta comunidad (brandBg⊕card)', capaTexto.comunidad, t.accent.brandBg, t.bg.card)

  // AvatarMascota (S44-B2.3): el fallback (hoy una HUELLA, ver la nota de
  // abajo) en el registro capaText sobre el tint capaBg de su capa,
  // compositado sobre card y sobre base (el avatar vive en ambas).
  // Memorial no tiene capaBg: su fallback es neutral (par de abajo).
  if ('capaBg' in t) {
    for (const c of ['identidad', 'cuidado', 'comunidad', 'comunidadAmplia'] as const) {
      // ✅ S98 · RECLASIFICADOS A PISO GRÁFICO — FIRMA DEL FOUNDER.
      //
      // El literal de la adjudicación: **el par del avatar se reclasifica a
      // mínimo gráfico (3:1) — es una HUELLA, no texto; la medición de 4.40
      // queda holgada; es RECLASIFICACIÓN, NO AFLOJAMIENTO.**
      //
      // 🔴 Y LA RAZÓN DE FONDO ES EL NOMBRE, no el número: estos pares se
      // llamaban «Avatar INICIALES» y no hay iniciales. Medido por B en
      // S98: `AvatarMascota.tsx` tiene CERO ocurrencias de la palabra —
      // su fallback es `HuellaGenerica`, un dibujo. El nombre viene de
      // S44-B2.3, cuando el fallback SÍ era texto, y sobrevivió al cambio
      // de contenido.
      //
      // > ***Mientras dijera «iniciales», el 4.5 parecía correcto.***
      // > El gate no medía de más por severidad: medía la regla equivocada
      // > porque la etiqueta decía otro contenido. **Cuatro sesiones de un
      // > mínimo mal aplicado, sostenido por una palabra.**
      //
      // ⚠️ POR QUÉ ESTO NO ES ABLANDAR EL TEST, y la distinción importa
      // porque desde afuera se ven igual: aflojar es **bajarle el listón a
      // la regla que corresponde** para que el número pase; reclasificar es
      // **aplicar la regla que siempre correspondió**. Acá el contenido no
      // cambió — cambió lo que sabíamos que era. La prueba de que no es
      // conveniencia: B lo encontró, midió que con 3:1 pasaba, y **NO lo
      // aplicó** («bajar el mínimo de un gate es decisión de mesa, no de la
      // pista que lo encontró»). La firma llegó después, por la mesa.
      add(`Avatar huella capaText.${c} / capaBg.${c}⊕card`, capaTexto[c], t.capaBg[c], t.bg.card, true)
      add(`Avatar huella capaText.${c} / capaBg.${c}⊕base`, capaTexto[c], t.capaBg[c], t.bg.base, true)
    }
  }
  // Fallback neutral del avatar (los 3 temas): text.secondary sobre bg.overlay.
  // (mismo rename que arriba: acá tampoco hay iniciales — es la huella
  // neutral de memorial y del avatar sin capa)
  // Misma reclasificación por la misma razón: también es la HUELLA, no texto.
  // ⚠️ OJO al tocarlo: el par inactivo de `SelectorSegmentado` declara abajo
  // que reusa ESTE par exacto — y ése SÍ es texto. Se mantiene el 4.5 acá
  // para no bajarle el piso a un texto por la puerta de atrás; el día que
  // ese reuso se corte, este par baja a 3:1 con los otros.
  add('Avatar huella text.secondary / bg.overlay⊕card', t.text.secondary, t.bg.overlay, t.bg.card)

  // SelectorEspecie (S45-B3.1): el nombre (text.primary) sobre el fondo de la
  // ficha seleccionada (capaBg.identidad compositado sobre base). El borde 1.5
  // hex puro es refuerzo gráfico exento como el anillo de CitaEnVivo: el canal
  // semántico es accessibilityState.checked + este tint, gateado acá.
  // Memorial no tinta (Ley 8): su ficha queda en pares text.primary/bg de arriba.
  if ('capaBg' in t) {
    add('SelectorEspecie nombre text.primary / capaBg.identidad⊕base', t.text.primary, t.capaBg.identidad, t.bg.base)
    add('SelectorEspecie nombre text.primary / capaBg.identidad⊕card', t.text.primary, t.capaBg.identidad, t.bg.card)
  }

  // SelectorSegmentado (S58, Ley 19.3/D-359): texto activo (text.primary)
  // sobre la superficie apoyada del segmento activo — claro: bg.card;
  // dark/memorial: border.default como relleno (paso de luminancia sobre el
  // riel, precedente del agarre de la Hoja), compositado sobre bg.overlay.
  // El texto INACTIVO (text.secondary / bg.overlay) ya está gateado por el
  // par del fallback de Avatar de arriba — mismo par exacto.
  const superficieSegmentoActivo = t.mode === 'light' ? t.bg.card : t.border.default
  add(
    'SelectorSegmentado activo text.primary / superficie activa⊕overlay',
    t.text.primary,
    superficieSegmentoActivo,
    t.bg.overlay,
  )

  // Campo (B3.3): mensaje de error sobre las superficies donde vive el form,
  // y los bordes de ESTADO como gráficos funcionales a 3:1 (WCAG 1.4.11 —
  // usan el flag `noTextual`).
  //
  // ⏪ S99-B · DOS CORRECCIONES DE ESTE BLOQUE, y las dos las destapó N11:
  //
  // ① SU PROPIA RAZÓN CADUCÓ. Decía: *«el borde default queda fuera del
  //    gate: el campo se identifica por su label siempre visible, no por
  //    el borde en reposo»*. Era cierto con la anatomía vieja — el label
  //    iba ARRIBA y afuera. **N11 lo metió adentro de la caja, así que hoy
  //    el contorno ES la identificación**, y por eso entra al gate (su par
  //    vive arriba, junto a los de texto). *Una exención sobrevive a la
  //    razón que la justificaba y sigue sonando sensata.*
  //
  // ② MEDÍA EL FONDO EQUIVOCADO EN OSCURO: `bg.elevated`, y el interior
  //    real del campo es `bg.overlay`. Misma clase que el par del avatar
  //    en S98 —el gate midiendo un token del que la pieza ya se había
  //    ido—. Ahora sale del MISMO espejo que el par de arriba.
  const bgCampo = INTERIOR_CAMPO(t)
  add('dangerText / bg.base (mensaje error Campo)', t.status.dangerText, t.bg.base)
  add('borde error Campo (danger gráfico 3:1) / bgCampo', t.status.danger, bgCampo, undefined, true)
  add(
    'borde focus Campo (accent.active gráfico 3:1) / bgCampo',
    'active' in t.accent ? t.accent.active : t.accent.primary,
    bgCampo,
    undefined,
    true,
  )

  // CTA "tinta" (dosis prestador): texto inverso sobre text.primary como fondo
  add('text.inverse / text.primary(CTA tinta)', t.text.inverse, t.text.primary)

  // accent.control (S58, firma founder — acento de controles del
  // cliente): en claro es magentaDark y porta contenido BLANCO (~8.2:1
  // por firma, verificado acá); en dark es violetText (gateado S44 —
  // cero pares nuevos por firma); en memorial es tinta (pares de
  // text.primary ya gateados). El tint de selección 'control' de
  // SelectorOpcion es capaBg.comunidad con text.primary encima.
  if (t.mode === 'light' && 'control' in t.accent) {
    add('accent.control (magentaDark) porta blanco', palette.white, t.accent.control)
  }
  // 🔴 S98-B (D-813) · ESTE PAR MEDÍA `capaBg.comunidad` Y ESO ERA VERDE
  // POR LA RAZÓN EQUIVOCADA. El tinte de la elección salió de la capa y
  // pasó a `accent.controlBg`, que resuelve por casa; medir la capa era
  // gatear un valor que la pieza ya no pinta.
  //
  // ⚠️ Y EL HUECO GRANDE QUEDA DECLARADO, no tapado: este archivo recorre
  // **solo LIGHT/DARK/MEMORIAL** (la línea del `for` de abajo) — las dos
  // casas de OFICIO nunca pasan por los pares de componente, así que el
  // tinte del PRESTADOR sigue sin medirse aquí. *Es la misma clase que el
  // defecto que esta línea cura: el instrumento cubría la casa donde los
  // tokens coinciden.* Barrer las dos casas enteras es tanda propia —
  // puede destapar pares ajenos— y va a la cola con este porqué escrito.
  if ('capaBg' in t) {
    const tinteEleccion = 'controlBg' in t.accent ? (t.accent as { controlBg: string }).controlBg : t.capaBg.comunidad
    add('SelectorOpcion control: text.primary / accent.controlBg⊕card', t.text.primary, tinteEleccion, t.bg.card)
    // El MISMO tinte lo pinta ahora la ficha ELEGIDA de SelectorEspecie
    // (D-813): antes su selección no tenía par propio — se medía el
    // relleno de REPOSO (`capaBg.identidad`, arriba) y nadie medía el de
    // la elección. Un estado sin par es un estado sin gate.
    add('SelectorEspecie ELEGIDA: text.primary / accent.controlBg⊕base', t.text.primary, tinteEleccion, t.bg.base)
  }

  // LEY 22 (S58) — TONAL: el TEXTO del acento sobre SU tinte, sobre la
  // superficie real del chip (card en claro, elevated en dark). Los
  // tres registros de SelectorOpcion: control · oficio · capa (moribundo).
  const superficieChip = t.mode === 'light' ? t.bg.card : t.bg.elevated
  if ('capaBg' in t && 'control' in t.accent) {
    // S98-B (D-813): el tonal de control mide su tinte NUEVO, por lo mismo
    // que el par de arriba — el borde y el relleno son la misma señal y
    // tienen que medirse contra la superficie que de verdad se pinta.
    add(
      'Ley22 tonal control: accent.control / accent.controlBg⊕chip',
      t.accent.control,
      'controlBg' in t.accent ? (t.accent as { controlBg: string }).controlBg : t.capaBg.comunidad,
      superficieChip,
    )
    add('Ley22 tonal oficio: accent.primary / accent.primaryBg⊕chip', t.accent.primary, t.accent.primaryBg, superficieChip)
    add('Ley22 tonal capa: capaText.identidad / capaBg.identidad⊕chip', capaTexto.identidad, t.capaBg.identidad, superficieChip)
  }

  // bg.tinta (S58, techo del prestador — constante en los 3 temas): el
  // texto papel sobre la tinta. El par tealDark/tinta pedido en S58 CAE
  // (~2.85:1) — medición informativa abajo, reportado ANTES de curar.
  add('texto papel (light0) / bg.tinta', palette.light0, t.bg.tinta)

  // §15b.2 S61 (re-firma founder B11/B12): EL MURO DEL OFICIO tealDark.
  // Reglas de la enmienda: sobre el muro el acento funcional es PAPEL
  // (el teal puro cae a 3.77 — PROHIBIDO ahí) · texto papel PLENO (la
  // opacidad .78 caía a 4.01) · el vidrio es OSCURO (el claro caía 4.15).
  add('muro oficio: texto papel / tealDark', palette.light0, palette.tealDark)
  add('muro oficio: papel / vidrio oscuro⊕muro', palette.light0, 'rgba(0,0,0,0.18)', palette.tealDark)
  add('muro oficio: toggle activo tealDark / papel', palette.tealDark, palette.light0)

  // S63 — enmienda Ley 21 FIRMADA: el CTA del prestador ancla a tealDark
  // en light Y dark (slot accent.cta, ThemeProvider cta="oficio").
  add('CTA oficio (light): papel / tealDark', palette.light0, palette.tealDark)
  add('CTA oficio (dark): textDark0 / tealDark', palette.textDark0, palette.tealDark)

  // S63 — D-407 PAGADA: tealDarkNoche, EL par oscuro del muro del oficio
  // (candidato a firmado; el gate visual del founder puede ajustar el hex).
  add('muro oficio NOCHE: texto papel / tealDarkNoche', palette.light0, palette.tealDarkNoche)
  add('muro oficio NOCHE: textDark0 / tealDarkNoche', palette.textDark0, palette.tealDarkNoche)
  add('muro oficio NOCHE: teal puro / tealDarkNoche', palette.teal, palette.tealDarkNoche, undefined, 3)

  // 🔴 S98-B (D-813) — LA ELECCIÓN DEL PRESTADOR, que hasta hoy NO SE
  // MEDÍA EN NINGUNA PARTE. Va como one-off por la misma razón que sus
  // vecinos de arriba: el bucle de pares de componente recorre solo
  // LIGHT/DARK/MEMORIAL y las casas de oficio quedan afuera.
  // *No se puede mover un token de casa y dejar sin gate justo la casa
  // donde cambió* — sería el mismo verde por la razón equivocada que esta
  // cura vino a sacar, un piso más arriba.
  // Los pares: el NOMBRE de la ficha y el BORDE, cada uno contra el tinte
  // compositado sobre la superficie real de su tema.
  add('elección oficio (light): textLight0 / tealAlpha16⊕papelTapizOficio', palette.textLight0, palette.tealAlpha16, palette.papelTapizOficio)
  add('elección oficio (light): borde tealDark / tealAlpha16⊕papelTapizOficio', palette.tealDark, palette.tealAlpha16, palette.papelTapizOficio, 3)
  add('elección oficio (dark): textDark0 / tealAlpha15⊕dark1', palette.textDark0, palette.tealAlpha15, palette.dark1)
  add('elección oficio (dark): borde teal / tealAlpha15⊕dark1', palette.teal, palette.tealAlpha15, palette.dark1, 3)

  // Gradiente firma v2 (B3.1c) — REGLA DE PEOR PUNTO: onGradient contra cada
  // stop con location ≤ 0.7 DEBE pasar 4.5. La COLA (location 1, teal) queda
  // EXENTA por geometría verificada — no es un agujero:
  //   (a) el stop central está en location ≥ .5 (violeta dominante), y
  //   (b) Boton marca garantiza paddingHorizontal ≥ 24 (spacing[6]),
  //   por lo que el texto jamás se apoya sobre la zona de la cola.
  // Condiciones (a)+(b) se verifican acá abajo; el resto es gate visual.
  if (t.accent.gradient.colors[0] !== 'transparent') {
    const g = t.accent.gradient
    if ((g.locations[1] ?? 0) < 0.5) {
      throw new Error(
        `Exención de cola inválida en ${nombre}: el stop central está en ${g.locations[1]} (< .5)`,
      )
    }
    g.colors.forEach((stop, i) => {
      const loc = g.locations[i]
      if (loc <= 0.7) {
        add(`text.onGradient / gradient.stop${i}@${loc}(${stop})`, t.text.onGradient, stop)
      } else {
        console.log(
          `  (exenta) ${nombre} · gradient.stop${i}@${loc}(${stop}) — cola fuera del área de texto (padding ≥ 24 en Boton marca)`,
        )
      }
    })
  }

  return p
}

const todos: Pair[] = [
  ...paresDe(lightTheme, 'LIGHT'),
  ...paresDe(darkTheme, 'DARK'),
  ...paresDe(memorialTheme, 'MEMORIAL'),
  /** 🔴 S98-B · LAS CASAS DE OFICIO ENTRAN AL BARRIDO — orden del founder:
   *  *«es la identidad visual del prestador y hoy no se mide»*.
   *
   *  El hueco era exactamente ése: este archivo recorría LIGHT, DARK y
   *  MEMORIAL, y el prestador aparecía solo en un puñado de one-offs
   *  escritos a mano (el muro, el CTA). **Todos los pares de COMPONENTE
   *  —chips, selectores, tarjetas, estados— se medían únicamente en la
   *  casa del cliente**, y el prestador heredaba el verde de una casa que
   *  no es la suya. *Es la misma clase que D-813: el instrumento cubría
   *  la casa donde los tokens coinciden.*
   *
   *  ⚠️ SE ENTRA POR `getTheme`, NO EXPORTANDO `lightOficio`. Las casas de
   *  oficio son internas a propósito y **`getTheme` es la puerta que usa
   *  la app**: midiendo por ahí, el gate mide lo que el usuario recibe y
   *  sigue a la resolución si algún día cambia. Exportar el objeto habría
   *  medido un tema que nadie monta. */
  ...paresDe(getTheme('light', 'oficio'), 'LIGHT·OFICIO'),
  ...paresDe(getTheme('dark', 'oficio'), 'DARK·OFICIO'),
  // EvidenciaFoto (S44-B2.5): sobre fotografía no hay par medible — el
  // scrim del token garantiza el piso. Se gatea el PEOR caso construible:
  // spinner/ícono blanco sobre scrim compositado sobre foto blanca (3:1
  // gráfico). Independiente del tema (scrim e blanco son de palette).
  {
    nombre: 'GLOBAL · EvidenciaFoto spinner/ícono blanco / scrim⊕foto blanca (peor caso)',
    fg: palette.white,
    bg: palette.scrim,
    surface: '#FFFFFF',
    noTextual: true,
  },
  /* LA BARRA DE TABS — SUS DOS SUPERFICIES (S99-B, gate 3 del founder).
   *
   * ⏪ Acá había dos pares `papel / techo tinta`. **Se caen con la pieza**:
   * la barra dejó de ser un techo oscuro y pasó a `bg.card` (blanco en
   * claro), y el activo dejó de vivir sobre la barra para vivir sobre el
   * DISCO. *Medir papel-sobre-tinta habría seguido dando verde midiendo
   * una anatomía que ya no existe* — el verde por la razón equivocada que
   * esta casa persigue.
   *
   * **Lo que se mide ahora, y por qué son estos pares:**
   * · el CONTENIDO del disco contra el disco — texto de 11 px ⇒ piso 4.5;
   * · el DISCO contra la barra — es el marcador de «dónde estoy», o sea
   *   GRÁFICA ⇒ piso 3. *Sin este segundo par, un disco del color de la
   *   barra pasaría el gate: su texto estaría perfecto y el marcador
   *   sería invisible.*
   *
   * Los cinco temas entran por `getTheme`, la misma puerta que la app —
   * incluidas las dos casas de oficio, que es donde el founder mira. */
  ...(
    [
      ['LIGHT', getTheme('light')],
      ['DARK', getTheme('dark')],
      ['MEMORIAL', getTheme('memorial')],
      ['LIGHT·OFICIO', getTheme('light', 'oficio')],
      ['DARK·OFICIO', getTheme('dark', 'oficio')],
    ] as const
  ).flatMap(([casa, t]) => [
    {
      nombre: `${casa} · BarraTabs contenido del disco / disco activo`,
      fg: t.accent.sobreActivoLleno,
      bg: t.accent.activoLleno,
    },
    {
      nombre: `${casa} · BarraTabs disco activo / barra (marcador, gráfica)`,
      fg: t.accent.activoLleno,
      bg: t.bg.card,
      noTextual: true,
    },
    {
      nombre: `${casa} · BarraTabs inactivo: secundario / barra`,
      fg: t.text.secondary,
      bg: t.bg.card,
    },
  ]),
  /* MARCA DE MAPA (S99-B · `DIRECCION_ARTE` §6ter) — los objetos del
   * mundo contra los TRES tonos que el mapa de la casa realmente pinta.
   *
   * 🔴 POR QUÉ ENTRAN ACÁ Y NO POR TEMA: **el mapa no tiene tema**
   * (medido: cero `customMapStyle` en la casa), así que estos pares son
   * globales — y son la mitad medible de *«el color pertenece al
   * terreno»*. La otra mitad (la saturación, banda 0.10–0.58) vive en el
   * token con su número: un gate de contraste no la puede ver.
   *
   * ⚠️ Los tonos son CONSTANTES DE REFERENCIA, no tokens: son muestras
   * del mundo, no colores nuestros. Por eso se escriben acá, con su
   * nombre, en vez de fingir que la casa los eligió. */
  ...(
    [
      ['asfalto', '#DAD7D2'],
      ['parque', '#BFDDB0'],
      ['agua', '#A9CCE8'],
    ] as const
  ).flatMap(([tono, hex]) =>
    (
      [
        ['moto (cajón)', palette.mapaMoto],
        // S99-B · el cuerpo un paso más claro: su piso es el AGUA (3.06),
        // y es lo que fija 0.48 como techo de luz — a 0.52 cae a 2.67.
        ['moto (cuerpo claro)', palette.mapaMotoClara],
        ['edificio cuerpo', palette.mapaEdificio],
        ['edificio techo', palette.mapaEdificioTecho],
      ] as const
    ).map(([obj, fg]) => ({
      nombre: `GLOBAL · marca de mapa: ${obj} / tile ${tono}`,
      fg,
      bg: hex,
      noTextual: true,
    })),
  ),
]

// Informativa (no gatea): tab inactivo de BarraTabs — decisión B3.7
for (const [n, t] of [['LIGHT', lightTheme], ['DARK', darkTheme], ['MEMORIAL', memorialTheme]] as const) {
  console.log(
    `  (info) ${n} · tab inactivo (text.tertiary / bg.base) → ${contrast(t.text.tertiary, t.bg.base).toFixed(2)}:1 — exento por espec`,
  )
}

// Informativa (no gatea): anillo de CitaEnVivo — S44-B2.1. Hex puro de capa
// (claro) / text.secondary (memorial) como refuerzo gráfico: el canal
// semántico AA es el pill, gateado arriba (capaText / bg.card).
for (const c of ['identidad', 'cuidado', 'comunidad', 'comunidadAmplia'] as const) {
  console.log(
    `  (info) LIGHT · anillo CitaEnVivo capa.${c} / bg.base → ${contrast(lightTheme.capa[c], lightTheme.bg.base).toFixed(2)}:1 — exento: el pill porta el canal AA`,
  )
}
console.log(
  `  (info) MEMORIAL · anillo CitaEnVivo (text.secondary / bg.base) → ${contrast(memorialTheme.text.secondary, memorialTheme.bg.base).toFixed(2)}:1 — exento: el pill porta el canal AA`,
)

// Informativa (no gatea): borde seleccionado de SelectorEspecie — S45-B3.1.
// Hex puro de capa identidad como refuerzo gráfico; el canal semántico es
// accessibilityState.checked + el tint capaBg (gateado arriba).
console.log(
  `  (info) LIGHT · borde SelectorEspecie capa.identidad / bg.base → ${contrast(lightTheme.capa.identidad, lightTheme.bg.base).toFixed(2)}:1 — exento: checked + tint portan el canal semántico`,
)
console.log(
  `  (info) MEMORIAL · borde SelectorEspecie (text.secondary / bg.base) → ${contrast(memorialTheme.text.secondary, memorialTheme.bg.base).toFixed(2)}:1 — exento: checked porta el canal semántico`,
)

// Informativa (no gatea — PAR CAÍDO REPORTADO S58, decisión founder
// pendiente): el pedido S58 pedía tealDark sobre bg.tinta; el AA de
// capa para superficies CLARAS no alcanza sobre la tinta. Sobre tinta
// el registro que pasa es el teal PURO (regla de dos registros: sobre
// superficie oscura el hex puro ES el registro AA, como en dark).
console.log(
  `  (info · PAR CAÍDO S58) tealDark / bg.tinta → ${contrast(palette.tealDark, lightTheme.bg.tinta).toFixed(2)}:1 (mín 4.5) — sobre tinta pasa teal puro: ${contrast(palette.teal, lightTheme.bg.tinta).toFixed(2)}:1`,
)

/* ☠️ S98 · MURIÓ LA EXENCIÓN DE `comunidadAmplia` — Y MURIÓ COMO B LA DISEÑÓ.
 *
 * B la escribió con condición de muerte adentro: contaba consumidores y
 * declaraba que **caería sola en cuanto alguien montara la capa**. Cayó por
 * el otro lado —la reclasificación a 3:1 hace que el par PASE con holgura
 * (4.40 contra 3)— así que ya no hay nada que eximir.
 *
 * > ***Las dos salidas que tenía escritas eran «alguien la monta» o «la mesa
 * > decide el piso». Se cumplió la segunda.*** Una exención con condición de
 * > muerte no es un permiso: es una medición que caduca — y ésta caducó en
 * > cuatro días.
 *
 * Se retira ENTERA (Ley 37) junto con su contador de consumidores: una
 * exención que ya no exime nada se lee como una excepción viva, y el próximo
 * que la encuentre va a creer que hay un par en rojo.
 *
 * Lo que su medición dejó y sigue siendo cierto: el oficio pisa `bg.base` y
 * nada más, por eso `⊕card` daba idéntico en las dos casas (4.63) y solo
 * `⊕base` divergía — `tapizDark` violáceo contra `tapizDarkOficio` verdoso.
 * No era un token mal elegido: era un violeta sobre un fondo que dejó de ser
 * violáceo. */

let fallos = 0
for (const par of todos) {
  const ratio = contrast(par.fg, par.bg, par.surface)
  const minimo = par.noTextual ? 3 : 4.5
  const ok = ratio >= minimo
  if (!ok) fallos++
  console.log(
    `${ok ? '  ✓' : '✗ FALLA'}  ${par.nombre}  →  ${ratio.toFixed(2)}:1  (mín ${minimo}:1)`,
  )
}

console.log(`\n${todos.length} pares verificados · ${fallos} fallo(s)`)
if (fallos > 0) {
  console.error('\nGATE WCAG: FALLÓ. Ajustar los tokens de los pares listados.')
  process.exit(1)
}
console.log('GATE WCAG: OK — los tres temas base + las DOS casas de oficio pasan.')
