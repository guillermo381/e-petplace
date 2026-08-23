/**
 * LA CAJA DEL CAMPO — la anatomía de N11, escrita UNA vez (S99-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ NACE, y no es prolijidad: **la anatomía de la caja estaba
 * escrita TRES VECES dentro de `packages/ui`** — `Campo`, `CampoCodigo`
 * y `CampoFecha` repetían el mismo `BORDE = 1.5`, el mismo
 * `theme.mode === 'light' ? bg.card : bg.elevated` y la misma
 * transición, byte por byte.
 *
 * Hoy coinciden **por copia**, que es la forma más frágil de coincidir.
 * Y N11 lo vuelve exigible con todas las letras: ***«dos estilos de
 * campo jamás conviven en la misma región de una pantalla»*** — aplicar
 * la ley a `Campo` y no a sus dos hermanas fabricaría exactamente los
 * dos estilos que la ley prohíbe. Es la misma enfermedad que R25 y R30
 * existen para cazar, un piso más adentro.
 *
 * Vive en un `.ts` sin componente —como `chevron.ts` y `usePresionado`—
 * porque **no es una pieza: es geometría compartida.**
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LO QUE N11 CAMBIÓ, Y LO QUE DEROGÓ ─────────────────────────────
 * **☠️ EL RELLENO COMO AFFORDANCE MUERE.** Hasta hoy `Campo` nacía con
 * `sinCaja = true` POR DEFAULT: borde **transparente** en reposo y
 * `bg.overlay` como única señal. Medido: el interior quedaba a
 * **1.07:1** contra el fondo en claro. *Un campo que se distingue de su
 * fondo por 1.07 no se distingue.*
 *
 * 🔴 **Y ESO ERA UNA DECISIÓN FIRMADA (S81), así que el choque se
 * DECLARA y no se resuelve callado** (precedente: el magenta S83, la
 * plata S83 y S88).
 *
 * ⚠️ **LA 19.8 NO MUERE — N11 ES LA 19.8 BIEN APLICADA** (precisión de A
 * al registrar esto para el acta, y vale escribirla acá porque «las dos
 * la leen al revés» se puede leer como que la ley quedó en disputa: no
 * quedó. Lo que muere es **la lectura** de S81, no la ley que citaba):
 *   · **S81:** *«A6 ALCANZA a Campo — el borde de reposo era caja, no
 *     affordance; la affordance la da el RELLENO»*.
 *   · **N11 (S99, firma del founder):** *«☠️ el relleno gris sólido
 *     muere… es la ley 19.8 aplicada al formulario: **se contornea lo
 *     que se fija** — un campo vacío todavía no existe, por eso no se
 *     rellena»*.
 * **Gana N11**: es más nueva, es firma del founder de esta sesión, y
 * trae su razón escrita. *Y el costo de la derogación resultó CERO: la
 * prop `sinCaja` tenía **cero consumidores** — todos los `sinCaja` del
 * árbol son de `Boton`, otra pieza y otra prop.*
 *
 * ── EL CONTORNO TIENE PISO, Y ES UN NÚMERO ─────────────────────────
 * `theme.border.campo` **≥3:1 contra `bg.base`** — token nuevo porque
 * ninguno de la casa llegaba (`default` 1.18/1.28, `presente`
 * 1.62/1.64: se diseñaron para SEPARAR, no para CONTENER). Su gate es
 * **R43** en `verify:diseno`: si alguien mueve el valor por debajo del
 * piso, sale rojo.
 *
 * ── EL FOCO GANA PRESENCIA, NO SOLO COLOR ──────────────────────────
 * N11 pide *«foco con presencia (borde en acento + elevación sutil)»*.
 * La elevación sale de `theme.elevacion.reposo` — **jamás una sombra a
 * mano** (Ley 20 / R4). Y el grosor sigue sin moverse: el estado cambia
 * color y sombra, nunca el borde, porque un borde que engorda **corre
 * el layout mientras alguien tipea**, que es la regla rectora de la
 * pieza desde S43.
 *
 * ═══════════════════════════════════════════════════════════════════
 * ⏪☠️ **N11′ — LA ETIQUETA SALE DE LA CAJA** (firma del founder,
 * 17-ago-2026). S99 la había metido adentro; **hoy vuelve AFUERA Y
 * ARRIBA, siempre visible y siempre del mismo tamaño.**
 *
 * **La razón, que es evidencia y no preferencia** —y por eso la ley se
 * reabrió—: *la etiqueta adentro tiene que encogerse para dejar entrar
 * el valor, y pierde legibilidad justo cuando el campo está lleno, que
 * es cuando la persona revisa antes de pagar.* Más dos costos que
 * ninguna medición de laboratorio muestra: **en español el rótulo pesa
 * el doble** («Instrucciones de entrega» encogida es nota al pie) y **el
 * autofill del sistema tapa el interior de la caja.**
 *
 * 🔴 **LO QUE N11 PROTEGÍA SIGUE ENTERO, y conviene leerlo antes de
 * tocar nada acá:** caja cerrada · contorno ≥3:1 · interior claro (**el
 * relleno gris sólido sigue muerto**) · foco con acento + elevación ·
 * radios N4. *N11′ mueve UN elemento de lugar; no reabre la derogación
 * del relleno.* Quien lea esto como permiso para volver al
 * `sinCaja = true` de S81 está leyendo otra cosa.
 *
 * **LOS DOS NÚMEROS QUE LA SOSTIENEN — y por qué son la ley y no un
 * detalle:** sacar la etiqueta afuera tiene UN riesgo real, que es que
 * se despegue de su campo y se lea como pie del campo de ARRIBA.
 *   · **`GAP_ETIQUETA` = 8** entre la etiqueta y SU caja.
 *   · **≥24 entre un campo y el siguiente**, que en esta casa **no hay
 *     que pedirle a nadie**: lo garantiza `PieDeCampo`, cuyo slot
 *     reservado mide **26.4** (14 × 1.6 + 4). *La proporción queda 8
 *     contra 26.4 — 3.3× — así que la etiqueta está inequívocamente más
 *     cerca de su caja que de la de arriba.*
 *
 * > **Y ahí está el punto que vale más que los números: la ley de N11′
 * > se cumple POR CONSTRUCCIÓN, no por disciplina del consumidor.** El
 * > único modo de romperla es `sinPie` sin `PieDeCampo` — que es
 * > exactamente lo que **R29** ya prohíbe desde S83. *La regla que hacía
 * > falta para esta enmienda ya estaba escrita para otra cosa.*
 *
 * **El 8 y no el 6:** el founder firmó *«6-8px»*. **8 es el único de los
 * dos que cumple N2** (*todo espaciado múltiplo de 8; el 4 solo para
 * pares íntimos icono-texto*). *Elegir 6 obligaría a tallar una
 * excepción en una ley firmada para ahorrar dos píxeles.*
 *
 * **LA CAJA VUELVE A 48**, derivada: línea de entrada (24) + `spacing[3]`
 * de aire arriba y abajo. **Y 48 no es un número nuevo: es el que
 * `CampoCodigo` conservó todo este tiempo** —con el label afuera— *«con
 * su razón escrita»*. ⇒ **la excepción de ayer es la norma de hoy.**
 * ═══════════════════════════════════════════════════════════════════
 */

import type { Theme } from '../themes'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'

/** SIEMPRE 1.5 — el estado cambia color, jamás grosor (regla rectora). */
export const BORDE_CAMPO = 1.5

/** N11′ · el aire entre la etiqueta y SU caja. Ver el porqué del 8 sobre
 *  el 6 en la cabecera (N2: múltiplo de 8, sin tallar excepción). */
export const GAP_ETIQUETA = spacing[2] // 8

/** N11′ · la línea de entrada: el alto del texto que se tipea. */
export const ALTO_LINEA_CAMPO = Math.round(
  typography.size.base * typography.leading.normal,
) // 24

/** N11′ · el alto de la caja, DERIVADO y no elegido: línea + aire arriba
 *  y abajo. Da **48**, que es el target táctil de N8 y el mismo número
 *  que `CampoCodigo` conservó siempre con su label afuera.
 *  ⚠️ Derivado a propósito: quien mueva la escala de N1 no tiene que
 *  acordarse de mover también este número (misma disciplina que el 62
 *  que este valor reemplaza). */
export const ALTO_CAJA_CAMPO = ALTO_LINEA_CAMPO + spacing[3] * 2 // 48

/** N11′ · el tamaño de la etiqueta. **`sm` (14) y no `xs` (11)**, y es
 *  la mitad de la enmienda que se pierde si solo se la muda de lugar:
 *  el rótulo de S99 medía 11 px porque tenía que caber DENTRO de la
 *  caja junto al valor. **Afuera ya no compite con nada**, y una
 *  etiqueta de 11 px afuera es exactamente la «nota al pie» que la firma
 *  nombra. `sm` es el registro SECUNDARIO de N1 (14/20), que es lo que
 *  una etiqueta es.
 *
 *  🔴 **Y no cambia nunca**: ni por foco, ni por contenido, ni por
 *  error. *Un rótulo que cambia de tamaño o de color según el estado
 *  deja de ser el nombre del campo y pasa a ser otro indicador más* —
 *  y el estado ya lo dicen el contorno y el pie. */
export const TAMANO_ETIQUETA = typography.size.sm // 14

export interface EstadoCaja {
  /** Pinta `status.danger` y gana prioridad sobre el foco. */
  error?: boolean
  enfocado?: boolean
}

/** El color del contorno según estado. El reposo YA NO ES TRANSPARENTE
 *  (ver la derogación en la cabecera). */
export function colorDeContorno(theme: Theme, { error, enfocado }: EstadoCaja): string {
  if (error) return theme.status.danger
  if (enfocado) return theme.text.primary
  return theme.border.campo
}

/** El grosor del contorno. S104-B: el foco suma **1** sobre el reposo —
 *  el «+1pt» de la orden. Vive acá y no en la pieza porque el grosor es
 *  anatomía y las tres cajas la comparten. */
export function grosorDeContorno({ enfocado }: EstadoCaja): number {
  return enfocado ? BORDE_CAMPO + 1 : BORDE_CAMPO
}

/** El interior: **lo más claro de su región** (N11). En claro es blanco
 *  sobre el papel tapiz; en los temas oscuros, el paso de luminancia que
 *  cada tema ya tiene declarado para sus superficies. */
export function interiorDeCaja(theme: Theme): string {
  return theme.mode === 'light' ? theme.bg.card : theme.bg.overlay
}

/** El estilo COMPLETO de la caja — las tres piezas lo consumen entero,
 *  jamás por partes: una que tome el borde y se escriba el fondo vuelve
 *  a ser una cuarta copia con otro nombre. */
/* ═══════════════════════════════════════════════════════════════════
 * 🔴 S104-B · EL FOCO PASA A TINTA PLENA +1 — ORDEN DEL FOUNDER, Y
 *    CHOCA CONTRA LETRA FIRMADA. SE DECLARA, NO SE RESUELVE ACÁ.
 *
 * ⏪ **Lo que regía hasta hoy:** el contorno enfocado tomaba
 * `accent.active` — magenta en el cliente, tealDark en el prestador —
 * por **Ley 5** (*«el campo enfocado ES el elemento activo de la
 * vista»*) y por el SEXTO SLOT de S83-B13, que resolvió `accent.active`
 * POR CASA justamente para que el foco hablara con el acento de cada
 * una. `CampoCodigo` cita esa ley palabra por palabra en su cabecera.
 *
 * **Lo que ordena S104-B:** *«el foco del campo: borde a tinta plena
 * +1pt, 150ms»*. ⇒ el foco deja de ser un acento y pasa a ser peso.
 *
 * ⚠️ **QUÉ SE PIERDE, dicho para que la mesa decida con el dato y no
 * con el gusto:** en el cliente el magenta del foco era **la única
 * aparición de `accent.active` en todo el arco de entrada** — con esto,
 * login/registro/recuperar quedan sin un solo píxel de acento de marca
 * salvo la marca de agua. En el prestador se pierde el teal del oficio
 * en el foco. **`N26` no se toca** (habla de ocre/magenta en CONTROLES
 * que accionan o seleccionan; un campo enfocado no es ninguno de los
 * dos), pero **Ley 5 sí queda enmendada de hecho**.
 *
 * ✅ **QUÉ MEJORA, y es medible:** tinta plena contra el interior
 * blanco da un contraste muy por encima del piso de 3:1 que N11 exige
 * para el contorno, en los tres temas y sin depender del acento — el
 * magenta en oscuro venía siendo el par más justo. Y el +1 hace que el
 * foco se lea **sin depender del color**, que es lo que un daltónico
 * necesita.
 *
 * 🔴 **EL COSTO QUE NADIE PIDIÓ Y HAY QUE ANOTAR:** subir el borde de
 * 1.5 a 2.5 achica el área interior 1 px por lado. El alto es fijo y el
 * contenido va centrado ⇒ **verticalmente no se mueve nada**; el texto
 * sí se corre **1 px horizontal** al enfocar. Es el único movimiento
 * que este cambio introduce, y se declara en vez de descubrirse en el
 * gate. **N11′ queda INTACTA: la etiqueta vive afuera y no se entera.**
 *
 * ⇒ **Rige la orden del founder. La enmienda de Ley 5 la firma la mesa,
 * no esta pieza.**
 * ═══════════════════════════════════════════════════════════════════ */
export function estiloDeCaja(theme: Theme, estado: EstadoCaja) {
  return {
    borderRadius: radius.md,
    borderWidth: grosorDeContorno(estado),
    borderColor: colorDeContorno(theme, estado),
    backgroundColor: interiorDeCaja(theme),
    /** La presencia del foco (N11). En reposo NO hay sombra: el contorno
     *  ya contiene, y sombrear todo campo llenaría de material una
     *  pantalla de formulario. */
    boxShadow: estado.enfocado && !estado.error ? theme.elevacion.reposo : undefined,
    /* S104-B — `fast` YA vale **150**, exactamente la duración que la orden
     * pide: no se tecleó un número nuevo ni se fundó una excepción.
     *
     * ⚠️ **SE ANIMA EL COLOR, NO EL GROSOR — y se declara en vez de
     * disimularse.** El intento de listar las dos (`'borderColor,
     * borderWidth'` y su forma de array) **rompió el typecheck del
     * prestador**: con el `as const` del objeto la lista se vuelve tupla
     * readonly y el estilo deja de ser asignable. **Lo cazó `tsc`, no el
     * ojo** — y el baseline del worktree primario probó que el rojo era
     * mío y no heredado.
     *
     * ⇒ El grosor **salta** de 1.5 a 2.5 y el color recorre sus 150 ms.
     * En pantalla el gesto se lee igual: el salto de `border.campo` a
     * tinta plena es el cambio dominante y 1 px aparece dentro de esa
     * transición. *Perseguir la animación del grosor habría costado sacar
     * el `as const` de una anatomía que TRES piezas consumen entera — el
     * precio no lo paga el efecto.*
     *
     * Sigue sin animarse nada más (Ley 6 · regla rectora: nada se mueve
     * mientras alguien tipea). */
    transitionProperty: 'borderColor',
    transitionDuration: motion.duration.fast,
  } as const
}
