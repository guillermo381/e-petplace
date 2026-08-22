/**
 * StepperCantidad — ajuste de CANTIDAD ACOTADA (S58, Ley 11 + Ley 22;
 * componente 33 — primer consumidor: el cupo "a la vez" por franja del
 * arte del paseo, B1b).
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es un input de texto (LA REGLA DEL TECLADO, §15b: lo
 * que se ajusta no se digita), no es slider (el slider elige entre
 * PASOS con recorrido; el stepper suma/resta de a uno), no valida
 * reglas de negocio (min/max son del contrato de la pantalla; el
 * server es el juez). Presentacional puro.
 * EN LOS LÍMITES EL BOTÓN SE APAGA SERENO — voz terciaria, jamás
 * error: el tope es estado, no falla.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía: [−] valor [+] — el VALOR en mono tabular (dato de máquina,
 * Ley 3); los botones −/+ son superficies hundidas (bg.overlay,
 * rectángulo suave — Ley 21) con el glifo en el ACENTO POR REGISTRO
 * ('control' cliente · 'oficio' prestador; memorial degrada a tinta).
 * Target 44 por botón; pressed 0.99 (receta SM de Boton).
 *
 * A11y: adjustable con increment/decrement y el valor anunciado — el
 * lector y el gesto cuentan la misma historia.
 *
 * Escalera §4b: no muestra datos del expediente — control puro,
 * peldaños no aplican (declarado explícito).
 */

import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { Icono } from './Icono'
import { estiloDeCaja } from './caja-de-campo'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

const BOTON = 44 // target táctil directo

/* 🔴 LA VARIANTE COMPACTA — nace de un defecto MEDIDO, no de una necesidad
   estética (S100b-B).

   **G-01 del gate: «el `+` pone 1, aparece el `−`, y no hay camino a 2».**
   La lógica del stepper estaba SANA. La causa era geométrica:

       caja interna de la tarjeta de vitrina …… 138 dp
       este stepper (44·2 + 12·2 + 32) ………… 144 dp
                                              ───────
                                              FALTAN 6 dp

   …y la tarjeta lleva `overflow: 'hidden'`, así que **el `+` —el elemento
   más a la derecha— quedaba recortado fuera del layout.** Medido en el
   aparato: en la tarjeta el contenedor quedaba en **74 dp**, `Menos`
   presente y **`Más` AUSENTE DEL ÁRBOL**. En el carrito, donde la fila es
   ancha, la misma pieza da **144.0 dp con los dos botones**. *La app se
   provee a sí misma el experimento de control.*

   ── POR QUÉ NO SE ACHICA EL BLANCO TÁCTIL ──────────────────────────
   **N8 es ley firmada: blancos de 44, y ningún consumidor la re-decide.**
   Achicar el botón a 36 y quedarse ahí habría curado el recorte rompiendo
   una ley para tapar un síntoma.

   ⇒ **Lo que se achica es el PÍXEL, no el TARGET:** 36 visuales + `hitSlop`
   4 = **44 de blanco efectivo**. *No es una excepción a N8: es la forma en
   que N8 se cumple cuando el espacio no alcanza* — y el precedente ya vivía
   tres líneas más arriba en la casa, en el timbre `+` de `TarjetaProducto`
   (36 visuales + `hitSlop` 8 = 52).

   **El gap NO baja de 8 a propósito:** con `hitSlop` 4 por lado, dos
   botones separados 8 dp tienen sus áreas táctiles *tocándose y no
   solapadas*. Bajar el gap las solaparía y el toque se volvería ambiguo
   —un stepper que a veces resta cuando quisiste sumar es peor que uno
   apretado—. *El número no es «lo que entra»: es el mínimo que mantiene
   los dos targets separados.* */
const BOTON_COMPACTO = 36
const HOLGURA_COMPACTA = (BOTON - BOTON_COMPACTO) / 2 // 4 ⇒ 36 + 4·2 = 44

/* 🔴 EL MENUDO — nace de una FIRMA, no de una preferencia (S100d·bis).

   **Founder, punto 5 del segundo veredicto, verbatim:** *«no está en el mismo
   escalón, está uno más abajo ahora todo junto; **debemos hacerlo MÁS PEQUEÑO
   para que quede junto al peso**»*.

   ⏪ **Y contradice una cuenta mía que era correcta.** Yo demostré que **tres
   blancos de 44 son 132 dp y no entran junto a un precio en una caja de 140,3**
   — por eso el control se había mudado a su propio escalón. **El founder vio el
   resultado y eligió el otro lado del intercambio: control más chico, misma
   fila.** *Su decisión, declarada: la cuenta no estaba mal, estaba contestando
   la pregunta que yo elegí.*

   ── LA GEOMETRÍA, DERIVADA PARA QUE N8 SOBREVIVA IGUAL ──────────────
   **Lo que se achica es el PÍXEL, no el BLANCO** — la misma receta con la que
   nació el compacto, llevada a su límite:

       caja interna de la tarjeta ……………………… 140,3 dp
       precio ($18.50, medido en aparato) …… 61,9
       aire ……………………………………………………………………  8
                                              ───────
       queda para el control ………………………………  70,4 dp

       botón 26 + número 18 + botón 26 ……………  70,0  ✅ entra

   **Y los blancos siguen siendo de 44 SIN solaparse, que es lo que lo vuelve
   legal:** con `hitSlop` 9 cada botón mide 26 + 9·2 = **44**; el blanco del
   primero termina en 35,0 y el del segundo arranca en 35,4 ⇒ **se tocan y no
   se pisan.** *Un stepper que a veces resta cuando quisiste sumar es peor que
   uno apretado* — la misma frase que gobierna el gap del compacto.

   ⚠️ **EL LÍMITE MEDIDO, declarado y no escondido: esto entra con precios de
   hasta ~62 dp** (dos dígitos y centavos, que es todo el catálogo de hoy).
   **Con un precio de tres dígitos la fila queda justa** y el precio es el que
   cede. *Se dice acá porque el día que entre un producto de $150 nadie va a
   saber por qué se ve apretado.* */
const BOTON_MENUDO = 26
const HOLGURA_MENUDA = (BOTON - BOTON_MENUDO) / 2 // 9 ⇒ 26 + 9·2 = 44
/** El número, en la única medida que deja cerrar los 70,4. Dos cifras en mono
 *  a `size.sm` entran; el tope de la vitrina es 12. */
const NUMERO_MENUDO = 18

/* 🔴 EL ANCHO — la CUARTA iteración del control de la vitrina, y la primera
   que no elige entre tres cosas que el founder pidió juntas (S100d·bis).

   **Salió de MIRAR EL OBJETO QUE YA LO RESOLVÍA**, en el mismo teléfono,
   disponible desde el día uno. Medido en Laika:

       botón «Agregar» …………………… 130,8 × 28,8 dp   (ancho completo)
       control [🗑] N [+] ……………… 129,0 × 27,4 dp   (la MISMA caja)
       sus botones ……………………………  36,6 × 27,4

   ⇒ **el control NO comparte renglón con ningún dato: tiene el suyo, completo.**
   Y por eso puede tener botones grandes: *nada compite con él.*

   ── LO QUE ESTO DESTRABA, y son las tres a la vez ───────────────────
   ① el control no le quita el renglón a la presentación ni al precio;
   ② la tarjeta no cambia de alto **jamás** (la caja existe siempre);
   ③ **los 44 de blanco vuelven SIN `hitSlop` forzado** — con la caja entera
      (140,3 dp en nuestra tarjeta, **más que los 130,8 de Laika**) los tres
      targets entran holgados: 3 × 44 = 132 ≤ 140,3.

   *Las tres iteraciones anteriores fallaron por la misma razón y ninguna era
   un error de cálculo: **cada una eligió a quién sacarle el renglón.** Ésta no
   tiene que elegir porque no se lo pide a nadie.*

   **El reparto es `space-between`**: los botones a los bordes y el número al
   medio. Sin `gap` — el aire lo pone la caja, que es lo que sobra. */
/* ⏪ **ERA 44 — S100d·bis, firma del founder: *«más pequeño, al menos 20 %; se
   ve más grande que el precio»*.** La vara es suya y es la correcta: el
   `PrecioText` de vitrina corre a `size.md` con leading **26**, y un control de
   44 lo superaba **1,69×**. Con 34 queda en **1,31×** — presente sin gritar.

   **−22,7 %, y los 44 de blanco NO se pierden:** `hitSlop` 5 los repone exacto
   (34 + 5·2 = 44). *Lo que encoge es la tinta, no el blanco* — la misma receta
   con la que nacieron el compacto y el menudo, que acá es legítima porque el
   control tiene la caja entera y sus tres celdas quedan a 46 dp de distancia
   entre centros: **los blancos no se pisan.** */
const BOTON_ANCHO = 34
const HOLGURA_ANCHA = (BOTON - BOTON_ANCHO) / 2 // 5 ⇒ 34 + 5·2 = 44

/** EL ALTO DEL STEPPER COMPACTO — exportado para que quien RESERVE su lugar
 *  lo DERIVE en vez de teclear un número (N24, S100c-B).
 *
 *  Su consumidor es `TarjetaProducto`: reserva este alto SIEMPRE para que la
 *  tarjeta no crezca al agregar. *Si el stepper cambia de alto, la reserva lo
 *  sigue sola* — que es la diferencia entre derivar y emparejar a mano
 *  (L-284: un par que debe coincidir y sale de dos lugares es una bomba con
 *  temporizador). */
export const ALTO_STEPPER_COMPACTO = BOTON_COMPACTO
/** El alto del menudo, por el mismo motivo: quien lo aloje lo DERIVA. */
export const ALTO_STEPPER_MENUDO = BOTON_MENUDO
/** El alto del ancho — **la caja que `Mutacion` comparte entre las dos formas**
 *  de la tarjeta de vitrina. Se DERIVA acá para que el botón «Agregar» y el
 *  stepper no puedan discrepar: *dos números que deben coincidir saliendo de
 *  dos lugares es una bomba con temporizador* (L-284). */
export const ALTO_STEPPER_ANCHO = BOTON_ANCHO

/** Los tres calibres. **No son «tres estilos»: son tres cajas.** Se elige por
 *  el ancho que hay, jamás por gusto — *una variante que se elige por gusto
 *  deja de ser una respuesta a una restricción.* */
export type TamanoStepper = 'normal' | 'compacto' | 'menudo' | 'ancho'

export interface StepperCantidadProps {
  valor: number
  min: number
  max: number
  onCambio: (valor: number) => void
  /** accessibilityLabel del control (el label visible es de la pantalla). */
  etiqueta: string
  /**
   * Ley 22 por registro: 'control' (cliente, default) · 'oficio' (prestador)
   * · **'compra'** (F-OCRE).
   *
   * 🔴 **`'compra'` NACE CON F-OCRE** (firma del founder, 18-ago-2026): la
   * casa reconoce **DOS acentos con roles distintos** — *magenta = marca y
   * elección (leve) · ocre = acción de compra (fuerte)*. Un stepper que
   * ajusta **cuánto vas a comprar** pertenece a la segunda familia, así que
   * sus signos toman `accent.cta` —el mismo oro del CTA del cliente— y no
   * el magenta de la elección.
   *
   * ⚠️ **No es «el stepper de la despensa»: es el stepper cuando lo que
   * ajusta es una COMPRA.** El cupo por franja del arte del paseo sigue en
   * `'oficio'` y el acuario en `'control'` — *un registro que se elige por
   * pantalla en vez de por naturaleza deja de ser una clase y pasa a ser un
   * segundo estilo*, que es lo que N11 prohíbe para los campos y vale igual
   * acá.
   *
   * **Memorial degrada solo:** `accent.cta` en memorial es tinta por
   * `getTheme` (un memorial no celebra), sin que esta pieza lo sepa.
   */
  registro?: 'control' | 'oficio' | 'compra'
  /**
   * **'normal'** 144 · **'compacto'** 116 · **'menudo'** 70 — los tres con el
   * blanco de 44 intacto vía `hitSlop` (ver `BOTON_MENUDO`).
   *
   * Para contenedores angostos — hoy, la tarjeta de vitrina (ver la nota de
   * `BOTON_COMPACTO`). **116 dp en vez de 144**, con el blanco de 44
   * intacto vía `hitSlop`.
   *
   * ⚠️ **No es «el stepper chico»: es el mismo stepper en una caja que no
   * da para 144.** Si la caja da, se usa el normal — *una variante que se
   * elige por gusto deja de ser una respuesta a una restricción y pasa a
   * ser un segundo estilo, que es lo que N11 prohíbe para los campos y vale
   * igual acá.*
   */
  tamano?: TamanoStepper
  /**
   * 🔴 EL `−` SE VUELVE PAPELERA EN EL MÍNIMO — **y solo donde corresponde**
   * (G-08, S100b-B).
   *
   * **`[SPEC]` eBay, y el matiz es el que decide dónde va:** *«the delete
   * action is only to be used when the numeric stepper is pair or
   * associated with an item tile such as item list in cart»*.
   * ⇒ **En el CARRITO sí**: bajar de 1 hace desaparecer la fila, y la
   * papelera lo anuncia. **En la GRILLA no**: ahí bajar de 1 devuelve la
   * tarjeta a su `+`, el tile no desaparece, y una papelera prometería un
   * borrado que no ocurre.
   *
   * **Presente ⇒ en el mínimo el botón BORRA, no se apaga** (Baymard/NN-g:
   * un control deshabilitado en el límite deja al usuario sin salida
   * visible). **Ausente ⇒ conducta de siempre**: apagado sereno.
   *
   * ⚠️ **Sin confirmación, a propósito.** La acción es inmediata y **el
   * deshacer es de la pantalla**, que es la única que sabe qué se borró y
   * puede reponerlo. *Un diálogo de «¿estás seguro?» por quitar un
   * producto del carrito cobra a todos el error de unos pocos.*
   */
  onBorrar?: () => void
  /**
   * 🔴 **EL NÚMERO SE TIPEA** — hallazgo NUEVO del founder, que no estaba en
   * ninguno de los 31 puntos y sale de un cliente real: *«a veces compro barf
   * y pido 50 unidades; subir de a una en algunos productos es incómodo»*.
   *
   * **Va en las TRES superficies —vitrina, ficha y CARRITO— con un solo
   * mecanismo**, que por eso vive en la pieza y no en cada pantalla. *El
   * carrito es donde más se ajustan cantidades: es el momento en que se revisa
   * todo junto antes de pagar.*
   *
   * ── LAS TRES RESPUESTAS QUE UN CAMPO NUMÉRICO NECESITA, DECIDIDAS ──────
   * ① **el CERO tipeado hace lo mismo que la papelera.** *El cero es la
   *    papelera dicha con el teclado; que un mismo destino tenga dos caminos
   *    con efectos distintos es lo que vuelve impredecible un control.*
   * ② **salir del campo VACÍO devuelve el valor anterior.** *Un vacío no es
   *    una intención: es un formulario a medio escribir.* ⛔ Jamás se
   *    interpreta como cero — borrar y no haber terminado de escribir se ven
   *    igual en la pantalla y significan lo contrario.
   * ③ **hay tope, y no es de negocio: es de LEGIBILIDAD.** `max` sigue
   *    mandando; el de la vitrina sube a 99 (ver `TOPE_EN_VITRINA`). **El
   *    límite REAL es el stock, y no lo aplica esta pieza** — ver abajo.
   *
   * ── 🔴 EL AJUSTE AL STOCK NO PUEDE VIVIR ACÁ, Y ES UNA FIRMA QUE LO IMPIDE ──
   * El founder pidió: *«tenemos 12 y el usuario tipea 50 ⇒ el valor se ajusta
   * automático a 12 y sale un aviso de 3 segundos»*. **El ajuste es correcto y
   * esta pieza NO puede hacerlo: no sabe cuánto stock hay.**
   *
   * **Y no es un olvido: es la firma de S99** — *`hay_stock` es BOOLEANO y
   * jamás un número; la familia necesita «¿puedo comprar esto?», no el
   * inventario ajeno.* `TarjetaProducto` lo cumple por construcción.
   *
   * ⇒ **el reparto que respeta las dos cosas:** la pieza emite lo tipeado ·
   * **el motor ajusta** (`LEAST(pedido, disponible)`, que ya existe) · **la
   * pantalla muestra el aviso efímero** con `useAviso` —la pieza de la casa,
   * auto-cierre sin botón de cerrar— usando **la voz de insuficiente que A ya
   * escribió**. *Tres capas, cada una con lo que sabe.*
   */
  editable?: boolean
  /**
   * 🔴 **QUÉ SIGNIFICA LLEGAR A CERO ACÁ — declarado, jamás inferido.**
   *
   * **Las dos superficies difieren de verdad y el founder lo marcó:** en el
   * **carrito** el cero (y la papelera) **sacan el ítem de la lista**, y ahí el
   * acuse ya lo da `Salida`; en la **vitrina** el cero **devuelve la tarjeta a
   * su botón «Agregar»** y no desaparece nada.
   *
   * ⚠️ **Se pasa como propiedad y no se deduce de la ruta**: *una pieza que
   * adivina en qué pantalla está empieza a conocer la navegación de su
   * consumidor* — y el día que alguien la monte en una tercera superficie, la
   * deducción falla en silencio.
   *
   * ✅ **Y de acá sale por qué NO hay dos voces encimadas:** el aviso efímero
   * solo aparece cuando lo tipeado **supera el stock**, y el acuse de salida
   * solo cuando llega **a cero**. *No son dos avisos del mismo acto: son dos
   * actos que no pueden ocurrir juntos.*
   */
  salida?: 'quita-el-item' | 'vuelve-al-boton'
}

/** El lado del botón de paso. **Se extrae porque ahora lo consumen DOS:**
 *  el botón y la caja del número editable, que toma esta misma altura para
 *  quedar alineada con ellos **por construcción y no por coincidencia**.
 *  *Un segundo lugar que derivara el mismo número por su cuenta sería la
 *  copia que `caja-de-campo` existe para no repetir, un piso más abajo.* */
function ladoDelPaso(tamano: TamanoStepper) {
  return tamano === 'menudo' ? BOTON_MENUDO : tamano === 'compacto' ? BOTON_COMPACTO : BOTON_ANCHO
}

/** El ancho reservado al número — el mismo para el editable y el que solo
 *  muestra, **para que encender `editable` no corra el layout**. */
function anchoDelNumero(tamano: TamanoStepper) {
  return tamano === 'menudo' ? NUMERO_MENUDO : tamano === 'compacto' ? spacing[7] : spacing[8]
}

function BotonPaso({
  signo,
  habilitado,
  color,
  atenuado,
  onPress,
  etiqueta,
  tamano,
}: {
  signo: 'menos' | 'mas' | 'papelera'
  habilitado: boolean
  color: string
  /** Apagado SERENO sobre un soporte lleno: el color no cambia (sobre el
   *  bloque solo hay UNA tinta legible), lo que baja es la presencia. */
  atenuado: boolean
  onPress: () => void
  etiqueta: string
  tamano: TamanoStepper
}) {
  const lado = ladoDelPaso(tamano)
  const holgura =
    tamano === 'menudo'
      ? HOLGURA_MENUDA
      : tamano === 'compacto'
        ? HOLGURA_COMPACTA
        : tamano === 'ancho'
          ? HOLGURA_ANCHA
          : 0
  const { theme } = useTheme()
  const [presionado, setPresionado] = useState(false)
  return (
    <Pressable
      onPress={() => {
        if (habilitado) onPress()
      }}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !habilitado }}
      onPressIn={() => {
        if (habilitado) setPresionado(true)
      }}
      onPressOut={() => setPresionado(false)}
      // El blanco de 44 se conserva SIEMPRE: en compacto lo completa el
      // hitSlop, porque lo que se achica es el píxel y no el target (N8).
      hitSlop={holgura}
    >
      <Animated.View
        style={{
          width: lado,
          height: lado,
          borderRadius: radius.suave,
          // Dentro del bloque de `ancho` la superficie ya la pone el
          // contenedor: una caja adentro de otra rompería el bloque en tres.
          backgroundColor: tamano === 'ancho' ? 'transparent' : theme.bg.hundido,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: atenuado ? 0.4 : 1,
          transform: [{ scale: presionado ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        {signo === 'papelera' ? (
          <Icono nombre="papelera" tamano={tamano === 'menudo' ? 16 : 20} registro="tinta" tinta={color} />
        ) : (
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            {signo === 'mas' ? <Path d="M10 4v12" stroke={color} strokeWidth={2} strokeLinecap="round" /> : null}
            <Path d="M4 10h12" stroke={color} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        )}
      </Animated.View>
    </Pressable>
  )
}

export function StepperCantidad({
  valor,
  min,
  max,
  onCambio,
  etiqueta,
  registro = 'control',
  tamano = 'normal',
  onBorrar,
  editable = false,
  salida = 'vuelve-al-boton',
}: StepperCantidadProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const esMemorial = theme.mode === 'memorial'

  if (__DEV__ && min >= max) {
    console.warn(`StepperCantidad: min ${min} ≥ max ${max} — un rango sin recorrido no es un stepper.`)
  }

  const v = Math.min(Math.max(valor, min), max)
  /* 🔴 EL BORRADOR DEL CAMPO — vive mientras se escribe y muere al confirmar.
     `null` = nadie está escribiendo y manda `valor`. */
  const [borrador, setBorrador] = useState<string | null>(null)

  const acento = esMemorial
    ? theme.accent.control // memorial: tinta (la marca no celebra ahí)
    : registro === 'oficio'
      ? theme.accent.primary
      : // F-OCRE: la acción de compra tiene su propio acento (ver la prop).
        registro === 'compra'
        ? theme.accent.cta
        : theme.accent.control

  /* 🔴 LA TINTA DEL CONTROL — **UNA SOLA, PARA LAS TRES CELDAS** (S100d·bis,
     relevo de B).

     ── EL DEFECTO QUE CURA, MEDIDO EN APARATO SOBRE EL BUNDLE `01a01807` ──
     **Founder, verbatim:** *«me sale el uno, me deja tipearlo, PERO YA NO ME
     DEJA poner las opciones de aumentar y disminuir con los botones de al
     lado»*. **Los botones estaban en el árbol, con sus cajas enteras:**

         Quitar de la compra … x[ 33,4 ·  67,2]  33,8 × 33,8   presente
         Más ………………………………………… x[137,6 · 171,4]  33,8 × 33,8   presente

     **Y no existían para el ojo.** Barrido de 26 muestras por el centro del
     `+`, de `y=618` a `y=645`: **las 26 dieron `(252,188,29)`** — el ocre del
     bloque, sin una sola variación. *Los signos se pintaban **ocre sobre el
     bloque ocre**.*

         signo ocre sobre bloque ocre …… **1.00**
         signo tinta sobre bloque ocre …… **9.96**

     ── 🔴 POR QUÉ ES L-284 Y NO UN DESCUIDO ────────────────────────────
     **La intención estaba escrita, medida y firmada** cuatro comentarios más
     arriba: *«signos y número en `accent.ctaTexto` sobre `accent.cta` — 8.40 en
     claro»*. **El número la cumplía y los signos no**, porque el color salía de
     DOS lugares: el número lo derivaba de `tamano === 'ancho'` y los signos se
     quedaban con `acento` —que en `registro='compra'` **es** `accent.cta`, o
     sea el color del propio bloque—.

     ⇒ *dos valores que deben coincidir saliendo de dos lugares.* **La cura no
     es corregir el segundo: es que haya UNO.** Las tres celdas leen esta
     constante y **la divergencia deja de ser expresable**.

     ── Y LA LECCIÓN QUE SE LLEVA, que no es sobre colores ──────────────
     **Un control invisible y un control ausente son indistinguibles desde
     afuera.** El founder no reportó *«no se ven los botones»* sino *«no me
     deja»* — describió el EFECTO, que es todo lo que puede ver. *Por eso el
     árbol dio verde: medía la capa equivocada.* **Es la segunda vez en la misma
     pieza y en la misma vuelta que el árbol dice «está» sobre algo que el ojo
     no tiene** (la primera fue el pie opaco tapando el control). */
  const sobreBloqueLleno = tamano === 'ancho' && !esMemorial
  const tintaDelControl = sobreBloqueLleno ? theme.accent.ctaTexto : acento

  /* LAS TRES REGLAS DEL CAMPO, en un solo lugar (ver la prop `editable`):
     vacío ⇒ vuelve el anterior · cero ⇒ lo mismo que la papelera · resto ⇒
     se acota a `max` acá y **al stock lo acota el motor**. */
  const confirmar = () => {
    const crudo = borrador
    setBorrador(null)
    if (crudo === null || crudo.trim() === '') return // ② vacío: no es una intención
    const n = Number.parseInt(crudo, 10)
    if (Number.isNaN(n)) return
    if (n <= 0) {
      // ① el cero es la papelera dicha con el teclado
      if (onBorrar !== undefined) onBorrar()
      else irA(min)
      return
    }
    irA(n)
  }

  const irA = (destino: number) => {
    const d = Math.min(Math.max(destino, min), max)
    if (d !== v) onCambio(d)
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ min, max, now: v, text: String(v) }}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') irA(v + 1)
        if (e.nativeEvent.actionName === 'decrement') irA(v - 1)
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      /* El aire entre celdas es lo ÚLTIMO que se achica y lo primero que se
         mira: es lo que mantiene los blancos táctiles separados. En `menudo`
         llega a 0 y los blancos igual no se pisan — la cuenta está en
         `BOTON_MENUDO`. */
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        /* 🔴 EN `ancho` EL CONTROL ES **UN BLOQUE**, no tres cosas sueltas —
           S100d·bis, y salió de mi propio ojo sobre la captura del gate:
           *«dos cuadraditos lavanda con signos ocre contra un bloque ocre
           lleno; ocupan la misma caja pero no se ven como el mismo objeto
           cambiando de forma»*.

           **La geometría ya era correcta y la LECTURA no:** `Mutacion`
           garantiza que las dos formas compartan caja, pero **compartir caja
           no alcanza para leerse como una transformación si una es un bloque
           lleno y la otra son tres piezas flotando.**

           ⇒ el contenedor toma **el mismo relleno y el mismo radio que el
           botón** (`accent.cta`), y las tres celdas viven ADENTRO. *El botón
           no se convierte en tres cosas: se divide en tres.*

           **El par de contraste no es nuevo:** signos y número en
           `accent.ctaTexto` sobre `accent.cta` — 8.40 en claro, 9.96 en los
           dos temas, el mismo que ya usa el CTA. */
        ...(tamano === 'ancho'
          ? {
              width: '100%',
              justifyContent: 'space-between' as const,
              backgroundColor: esMemorial ? theme.bg.hundido : theme.accent.cta,
              borderRadius: radius.suave,
              overflow: 'hidden' as const,
            }
          : { gap: tamano === 'menudo' ? 0 : tamano === 'compacto' ? spacing[2] : spacing[3] }),
      }}
    >
      {/* En el mínimo, con `onBorrar`, el menos es PAPELERA y ejecuta el
          borrado; sin él, se apaga sereno como siempre. */}
      <BotonPaso
        signo={onBorrar !== undefined && v <= min ? 'papelera' : 'menos'}
        habilitado={v > min || onBorrar !== undefined}
        /* En el límite se apaga SERENO — jamás error. **Sobre el bloque lleno
           el apagado NO puede ser un color**: la única tinta legible ahí es
           `ctaTexto`, así que lo que baja es la presencia (ver `atenuado`). */
        color={
          v > min || onBorrar !== undefined
            ? tintaDelControl
            : sobreBloqueLleno
              ? tintaDelControl
              : theme.text.tertiary
        }
        atenuado={!(v > min || onBorrar !== undefined) && sobreBloqueLleno}
        onPress={() => (v <= min && onBorrar !== undefined ? onBorrar() : irA(v - 1))}
        /* La voz del destino dice QUÉ pasa, y por eso depende de `salida`:
           en el carrito el ítem se va de la lista; en la vitrina la tarjeta
           se queda y vuelve su botón. *Un lector de pantalla que anuncia
           «quitar del carrito» donde nada se quita miente sobre el efecto.* */
        etiqueta={
          onBorrar !== undefined && v <= min
            ? salida === 'quita-el-item'
              ? t('stepperCantidad.borrar')
              : t('stepperCantidad.quitarDeLaCompra')
            : t('stepperCantidad.menos')
        }
        tamano={tamano}
      />
      {editable ? (
        /* 🔴 EL NÚMERO ES UN CAMPO — ver la prop `editable`.
           **El estado de texto es LOCAL y solo mientras se escribe:** el valor
           que manda sigue siendo `valor`, así que un ajuste que venga de
           afuera —el motor recortando al stock— se refleja solo. *Si el campo
           fuera la fuente de verdad, el recorte del servidor no podría
           corregirlo y la persona vería 50 sobre un stock de 12.* */
        /* ── S103-B · LA SUPERFICIE DEL NÚMERO EDITABLE (firma del founder)
           *«un número suelto se lee como resultado, no como control»*. El
           defecto estaba en el código y no era una impresión: el `TextInput`
           y el `Text` de abajo compartían `minWidth`, `textAlign`, la mono
           tabular, el `letterSpacing` y el color condicional — **la única
           diferencia era un `padding: 0`.** El editable y el que solo
           muestra eran el mismo objeto.

           🔴 **NO NACE UNA PRIMITIVA: se monta la caja del campo que la casa
           ya tiene** (`caja-de-campo`, N11/N11′). Y no es economía — es que
           el número editable **ES un campo**, así que lleva la anatomía que
           lleva todo campo de la casa: contorno `border.campo` con piso
           ≥3:1 vigilado por R43, interior claro, y foco con acento +
           elevación. *Inventar una pastilla propia habría fabricado los dos
           estilos de campo que N11 prohíbe conviviendo.*

           **LOS DOS LÍMITES DEL FOUNDER SE CUMPLEN POR CONSTRUCCIÓN, no por
           cuidado:** el borde **jamás cambia de grosor** (`BORDE_CAMPO` es
           1.5 en todo estado — regla rectora de la pieza desde S43: *un
           borde que engorda corre el layout mientras alguien tipea*), y el
           alto sale **derivado** de `ladoDelPaso`, el mismo de los botones
           ⇒ los tres elementos quedan alineados sin números tecleados y
           **encender `editable` no mueve la fila: crece el borde y nada
           más.**

           El foco no necesita estado nuevo: `borrador` ya vive mientras se
           escribe y vuelve a `null` en `confirmar()`.

           ⚠️ **LO QUE QUEDA DECLARADO Y NO ADIVINADO — el bloque lleno.**
           Sobre `tamano="ancho"` (`sobreBloqueLleno`) la caja NO se monta:
           `interiorDeCaja` está definido contra `bg.base` y ahí pondría una
           caja blanca encima de un bloque de CTA. **El contrato del módulo
           no cubre esa superficie**, y tallarle una excepción sería
           inventar tokens para el único caso que la letra no alcanza. Es 1
           de los 3 montajes editables (`TarjetaProducto`, la vitrina) y va
           al gate del founder con el resto — *ahí el bloque entero ya se
           lee como control, que es justo la ambigüedad que esta firma vino
           a sacar, pero eso es un argumento y no una medición: lo digo como
           lo que es.* */
        (() => {
          const campo = (
            <TextInput
              value={borrador ?? String(v)}
              onChangeText={(t) => setBorrador(t.replace(/[^0-9]/g, ''))}
              onFocus={() => setBorrador(String(v))}
              onEndEditing={confirmar}
              onSubmitEditing={confirmar}
              keyboardType="number-pad"
              returnKeyType="done"
              selectTextOnFocus
              accessibilityLabel={etiqueta}
              style={{
                /* El ancho lo reserva SIEMPRE el campo, no la caja: un
                   `width: '100%'` contra un contenedor que se dimensiona por
                   su contenido es circular en Yoga y colapsa. La caja envuelve
                   y no mide. */
                minWidth: anchoDelNumero(tamano),
                textAlign: 'center',
                padding: 0,
                fontFamily: typography.family.mono.regular,
                fontSize: tamano === 'menudo' ? typography.size.sm : typography.size.md,
                fontVariant: ['tabular-nums'],
                letterSpacing: typography.tracking.mono,
                // MISMA fuente que los signos — ver `tintaDelControl`.
                color: sobreBloqueLleno ? tintaDelControl : theme.text.primary,
              }}
            />
          )
          if (sobreBloqueLleno) return campo
          return (
            <View
              style={{
                // El estilo se consume ENTERO, jamás por partes: una que
                // tome el borde y se escriba el fondo vuelve a ser otra
                // copia con otro nombre (regla del propio módulo).
                ...estiloDeCaja(theme, { enfocado: borrador !== null }),
                height: ladoDelPaso(tamano),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {campo}
            </View>
          )
        })()
      ) : (
        <Text
          style={{
            minWidth: anchoDelNumero(tamano),
            textAlign: 'center',
            // dato de máquina: mono tabular (Ley 3)
            fontFamily: typography.family.mono.regular,
            fontSize: tamano === 'menudo' ? typography.size.sm : typography.size.md,
            fontVariant: ['tabular-nums'],
            letterSpacing: typography.tracking.mono,
            // MISMA fuente que los signos — ver `tintaDelControl`.
            color: sobreBloqueLleno ? tintaDelControl : theme.text.primary,
          }}
        >
          {v}
        </Text>
      )}
      <BotonPaso
        signo="mas"
        habilitado={v < max}
        color={v < max ? tintaDelControl : sobreBloqueLleno ? tintaDelControl : theme.text.tertiary}
        atenuado={v >= max && sobreBloqueLleno}
        onPress={() => irA(v + 1)}
        etiqueta={t('stepperCantidad.mas')}
        tamano={tamano}
      />
    </View>
  )
}
