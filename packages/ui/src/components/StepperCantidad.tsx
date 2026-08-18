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
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { Icono } from './Icono'
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

/** Los tres calibres. **No son «tres estilos»: son tres cajas.** Se elige por
 *  el ancho que hay, jamás por gusto — *una variante que se elige por gusto
 *  deja de ser una respuesta a una restricción.* */
export type TamanoStepper = 'normal' | 'compacto' | 'menudo'

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
}

function BotonPaso({
  signo,
  habilitado,
  color,
  onPress,
  etiqueta,
  tamano,
}: {
  signo: 'menos' | 'mas' | 'papelera'
  habilitado: boolean
  color: string
  onPress: () => void
  etiqueta: string
  tamano: TamanoStepper
}) {
  const lado = tamano === 'menudo' ? BOTON_MENUDO : tamano === 'compacto' ? BOTON_COMPACTO : BOTON
  const holgura = tamano === 'menudo' ? HOLGURA_MENUDA : tamano === 'compacto' ? HOLGURA_COMPACTA : 0
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
          backgroundColor: theme.bg.hundido,
          alignItems: 'center',
          justifyContent: 'center',
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

export function StepperCantidad({ valor, min, max, onCambio, etiqueta, registro = 'control', tamano = 'normal', onBorrar }: StepperCantidadProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const esMemorial = theme.mode === 'memorial'

  if (__DEV__ && min >= max) {
    console.warn(`StepperCantidad: min ${min} ≥ max ${max} — un rango sin recorrido no es un stepper.`)
  }

  const v = Math.min(Math.max(valor, min), max)
  const acento = esMemorial
    ? theme.accent.control // memorial: tinta (la marca no celebra ahí)
    : registro === 'oficio'
      ? theme.accent.primary
      : // F-OCRE: la acción de compra tiene su propio acento (ver la prop).
        registro === 'compra'
        ? theme.accent.cta
        : theme.accent.control

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
        gap: tamano === 'menudo' ? 0 : tamano === 'compacto' ? spacing[2] : spacing[3],
      }}
    >
      {/* En el mínimo, con `onBorrar`, el menos es PAPELERA y ejecuta el
          borrado; sin él, se apaga sereno como siempre. */}
      <BotonPaso
        signo={onBorrar !== undefined && v <= min ? 'papelera' : 'menos'}
        habilitado={v > min || onBorrar !== undefined}
        // en el límite se apaga SERENO (voz terciaria) — jamás error
        color={v > min || onBorrar !== undefined ? acento : theme.text.tertiary}
        onPress={() => (v <= min && onBorrar !== undefined ? onBorrar() : irA(v - 1))}
        etiqueta={onBorrar !== undefined && v <= min ? t('stepperCantidad.borrar') : t('stepperCantidad.menos')}
        tamano={tamano}
      />
      <Text
        style={{
          minWidth: tamano === 'menudo' ? NUMERO_MENUDO : tamano === 'compacto' ? spacing[7] : spacing[8],
          textAlign: 'center',
          // dato de máquina: mono tabular (Ley 3)
          fontFamily: typography.family.mono.regular,
          fontSize: tamano === 'menudo' ? typography.size.sm : typography.size.md,
          fontVariant: ['tabular-nums'],
          letterSpacing: typography.tracking.mono,
          color: theme.text.primary,
        }}
      >
        {v}
      </Text>
      <BotonPaso
        signo="mas"
        habilitado={v < max}
        color={v < max ? acento : theme.text.tertiary}
        onPress={() => irA(v + 1)}
        etiqueta={t('stepperCantidad.mas')}
        tamano={tamano}
      />
    </View>
  )
}
