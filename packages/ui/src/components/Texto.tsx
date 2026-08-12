/**
 * Texto — la pieza de texto del sistema (S71-A1, componente 58).
 *
 * POR QUÉ NACE (deep research S71, Bloque 0): el design system tenía 57
 * exports y NINGUNO era texto. Consecuencia: `<Text>` de react-native con
 * `style` inline tokenizado era el único camino posible, y la receta se
 * repetía ~200 veces en el cliente (7 literales solo en `parte`). El
 * resultado no era hardcodeo — los tokens estaban bien puestos — sino algo
 * peor: **la jerarquía tipográfica se re-decidía a mano en cada pantalla**.
 * Ley 11 sobre la pieza más usada del monorepo.
 *
 * LA API ES DELIBERADAMENTE POBRE. Cuatro variantes, color semántico y
 * `numberOfLines`. Nada decorativo, y **sin prop `style`**: la escotilla de
 * estilo libre devolvería el gobierno de la jerarquía a la pantalla, que es
 * exactamente el problema que este componente existe para cerrar. Si una
 * superficie necesita algo que esta API no da, eso es una conversación de
 * mesa (Ley 11: propuesta + gate), jamás una prop nueva metida al pasar.
 *
 * EL LAYOUT ES DEL PADRE. `Texto` es una hoja: no lleva margin, flex ni
 * ancho. Para truncar, `numberOfLines`; para acomodar, la `View` que lo
 * contiene.
 *
 * Las variantes (Ley 3 — regla de voz):
 *   · titulo  → DM Sans 300 · 28px · lo humano a escala de voz.
 *   · seccion → DM Sans 500 · 18px · el rótulo de un bloque, con
 *               `accessibilityRole="header"` DE FÁBRICA.
 *   · cuerpo  → DM Sans 400 · 15px · la prosa por default. **D-482 PAGADA
 *               (S82-B, decisión FIRMADA S72-A):** nació en md/18 con 3
 *               consumidores; el censo de B halló 49 sitios en base/15
 *               que no la adoptaban porque el tamaño no coincidía — el
 *               censo corrige al diseñador (precedente VozSecundaria):
 *               la prosa real de la casa es base/15. Re-censado al pagar
 *               (L-141): 71 consumidores explícitos, cero `<Texto>` sin
 *               variante; los 68 post-S72 la adoptaron como "prosa por
 *               default", que es exactamente lo que la firma corrige.
 *               El sitio S72 más visible del cambio: el título de las
 *               tarjetas de Ponte al día (hogar) — señalado para la
 *               captura claro/oscuro del gate.
 *   · apoyo   → DM Sans 400 · 13px · secundario, subtítulos, ayudas.
 *   · dato    → JetBrains Mono 400 · 13px · metadata que generó una máquina
 *               (fechas, horas, IDs, códigos), con `tabular-nums` para que
 *               los dígitos no bailen (precedente Cronometro, S44).
 *   · voz     → DM Sans **300 light** · 18px · interlineado 1.75 · tinta
 *               secundaria. **LA VOZ DEL PRODUCTO** (S82-B r9; la itálica
 *               MURIÓ en r15 por decisión founder —estigma de texto
 *               generado por IA— y el registro se reconstruyó con peso,
 *               tamaño e interlineado). Lo que el producto piensa sobre la
 *               mascota, no lo que la interfaz explica. ADITIVA: no cambia
 *               ninguna pantalla hasta que alguien la use.
 *
 * CONGELADO S71-A2 con las cuatro enmiendas de mesa, todas MEDIDAS antes
 * de decidir (no dictadas):
 *
 *   (1) NACE `seccion`. Había **10 definiciones de `TituloBloque`**
 *       repartidas entre las dos apps — y las diez BYTE-IDÉNTICAS (medium
 *       + `size.md` + `text.primary` + `accessibilityRole="header"`), más
 *       3 `tituloSeccion` locales. Diez copias iguales no son diez
 *       decisiones: son una decisión que nadie tuvo dónde poner. El
 *       `accessibilityRole` viaja ADENTRO porque era lo primero que se
 *       perdía al re-teclear la receta.
 *
 *   (2) `apoyo` ABSORBE `VozSecundaria` — NO nace quinta variante. Las
 *       **4 copias de `VozSecundaria`** también son byte-idénticas entre
 *       sí, y difieren de `apoyo` en UNA cosa: traen
 *       `lineHeight: size.sm * leading.normal`. Cuatro implementaciones
 *       independientes que coinciden en el mismo valor son cuatro votos
 *       por el mismo interlineado, no un capricho local: `apoyo` lo
 *       adopta y las absorbe. La prosa chica sin `lineHeight` se
 *       apelmaza — el defecto estaba en la variante, no en los clones.
 *
 *   (3) `FilaDato` (componente 59) nace HERMANO, no prop de acá: es
 *       LAYOUT (etiqueta sobre valor) y compone `Texto`. Meterlo como
 *       variante habría hecho que este componente devuelva dos nodos —
 *       la puerta a que `Texto` se convierta en un mini-framework.
 *
 *   (4) `montoCorto` NO NACE (D-448). El formateo de plata es del RIEL,
 *       por idioma — igual que `fechaCortaMono`. Una variante tipográfica
 *       no arregla que haya 42 formateos con 2 divergentes; los
 *       escondería mejor.
 *
 * Los tres temas salen gratis: el color sale de `theme.text.*`.
 */

import { Text } from 'react-native'
import type { ReactNode } from 'react'

import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

export type TextoVariante = 'titulo' | 'seccion' | 'cuerpo' | 'apoyo' | 'dato' | 'datoMd' | 'voz'
/** S81 (pedido de C, los spreads dangerText de los cierres): entran los
 *  colores de STATUS — 'danger' y 'success' resuelven contra
 *  theme.status.*Text (los registros AA). El resto sigue en theme.text. */
/** S96-B — gana `warning`, por el MISMO motivo por el que ya tenía
 *  'danger' y 'success': el sistema tiene `status.warningText` como
 *  registro AA y `Texto` no podía decirlo, así que quien lo necesitaba
 *  tenía que salirse de la pieza. Su primer consumidor es la banda de
 *  desvío de `EscaleraEstados` (una entrega fallida no es un ERROR del
 *  sistema —vuelve y se reagenda—: 'danger' habría gritado de más). */
export type TextoColor = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning'

export type TextoProps = {
  children: ReactNode
  /** Default: 'cuerpo'. */
  variante?: TextoVariante
  /** Color semántico del sistema. Default: el de la variante. */
  color?: TextoColor
  /** Truncado. Passthrough a react-native. */
  numberOfLines?: number
  /** S81 (pedido de C — el k/N de la sesión de adiestramiento, mono
   *  centrado): centra el texto. Semántica de composición, no estilo
   *  libre. */
  centrado?: boolean
  /** S81 (pedido de mesa): el texto se puede seleccionar/copiar (ids,
   *  códigos, el pie de identidad). Passthrough a react-native. */
  seleccionable?: boolean
}

const RECETA: Record<
  TextoVariante,
  {
    fontFamily: string
    fontSize: number
    color: TextoColor
    tabular?: boolean
    /** Interlineado explícito — solo donde la prosa lo necesita (enmienda 2). */
    leading?: number
    /** Rótulo de bloque: el rol de a11y viaja con la variante (enmienda 1). */
    header?: boolean
  }
> = {
  titulo:  { fontFamily: typography.family.sans.light,   fontSize: typography.size.xl, color: 'primary'   },
  seccion: { fontFamily: typography.family.sans.medium,  fontSize: typography.size.md, color: 'primary',   header: true },
  cuerpo:  { fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: 'primary' }, // D-482: base/15

  apoyo:   { fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: 'secondary', leading: typography.size.sm * typography.leading.normal },
  dato:    { fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: 'secondary', tabular: true },
  // S81 (pedido de C — "el precio mono-primary" de coordinar y los
  // cierres): el dato PROMINENTE — mono a md en primary. Sigue siendo
  // voz de máquina (Ley 3); el traje crece con el protagonismo.
  datoMd:  { fontFamily: typography.family.mono.regular, fontSize: typography.size.md, color: 'primary', tabular: true },
  // S82-B r9 — LA VOZ DEL PRODUCTO (orden founder punto 6; el reencuadre
  // que retiró la serif). NO falta tipografía: faltaba REGISTRO. Hoy "lo
  // que el producto piensa" pide prestado `apoyo` — sans secundario 13px,
  // que ES el microcopy gris que la referencia critica. Cuatro mediciones
  // independientes lo pidieron (C ×3 en S82, B ×1 en r7).
  // La receta, dentro de DM Sans: ITÁLICA real (archivo propio) · md/18
  // (por encima del cuerpo 15: la voz no es nota al pie) · interlineado
  // de PROSA (normal 1.6 — respira, es la única variante con dos o tres
  // líneas por diseño) · tinta SECUNDARIA (piensa en voz baja: no compite
  // con el título ni desaparece como el apoyo).
  // Qué NO es: no rotula (eso es `seccion`), no da datos (eso es `dato`),
  // no es la prosa de la interfaz (eso es `cuerpo`). Su prueba: *si la
  // frase la podría haber dicho el producto sobre la mascota, es `voz`;
  // si describe un control, no lo es.*
  // S82-B r15 — LA ITÁLICA MURIÓ y el REGISTRO VIVE. Decisión founder: la
  // itálica está estigmatizada como marca de texto generado por IA en su
  // mercado. La voz se reconstruye con las tres palancas que quedan:
  //  · PESO 300 (light) — la voz humana de la casa (Ley 3: "voz humana =
  //    DM Sans 300"); el `cuerpo` es 400, así que ya no comparten trazo.
  //  · TAMAÑO md/18 — por encima del cuerpo (15): la voz no es nota al pie.
  //  · INTERLINEADO relaxed 1.75 (era normal 1.6) — el aire es lo que
  //    reemplaza a la inclinación: dice "esto se lee distinto" sin inclinar.
  // El color secundario se CONSERVA. Las tres juntas separan `voz` de
  // `cuerpo` (400/15/1.6) y de `apoyo` (400/13) sin una fuente nueva.
  voz:     { fontFamily: typography.family.sans.light, fontSize: typography.size.md, color: 'secondary', leading: typography.size.md * typography.leading.relaxed },
}

export function Texto({ children, variante = 'cuerpo', color, numberOfLines, centrado, seleccionable }: TextoProps) {
  const { theme } = useTheme()
  const receta = RECETA[variante]
  const c = color ?? receta.color
  const colorResuelto =
    c === 'danger'
      ? theme.status.dangerText
      : c === 'success'
        ? theme.status.successText
        : c === 'warning'
          ? theme.status.warningText
          : theme.text[c]

  return (
    <Text
      accessibilityRole={receta.header === true ? 'header' : undefined}
      numberOfLines={numberOfLines}
      selectable={seleccionable}
      style={{
        fontFamily: receta.fontFamily,
        fontSize: receta.fontSize,
        color: colorResuelto,
        ...(centrado ? { textAlign: 'center' as const } : null),
        ...(receta.leading !== undefined ? { lineHeight: receta.leading } : null),
        ...(receta.tabular ? { fontVariant: ['tabular-nums' as const] } : null),
      }}
    >
      {children}
    </Text>
  )
}
