/**
 * BurbujaPendientes — LA PUERTA ÚNICA A LO QUE TE ESPERA, donde llega el pulgar.
 *
 * **Firma del founder (S112):** *«(a) qué glifo y qué número muestra según lo
 * que haya (carrito · mensajes · ambos = total); (b) el abanico de dos
 * opciones hacia arriba, cada una con glifo y número, que sólo aparece cuando
 * hay dos clases. Con una sola clase, el toque va directo.»*
 *
 * ── 🔴 LA MEDICIÓN DE N25 QUE EL FOUNDER PIDIÓ ANTES DE CONSTRUIR ──────
 * El encargo venía con su freno: *«si «una puerta al carrito» lo prohíbe como
 * está escrito, no construyas»*. **Medido: NO lo prohíbe.** Y conviene dejar
 * por qué, porque tres de los cuatro puntos de N25 ya no dicen lo que decían.
 *
 * ① **N25 ② prohíbe DOS PUERTAS AL MISMO CUARTO** —*«dos lugares donde
 *    aprender lo mismo»*—. El abanico es **UNA puerta a DOS cuartos
 *    distintos**. El carrito sigue teniendo exactamente una.
 * ② **¿Y mensajes gana una segunda puerta?** Es la pregunta que de verdad
 *    decidía, y se midió: **mensajes no tiene puerta hoy** —`GlifoConContador`
 *    sólo cuenta filtros en despensa; no hay ninguna entrada global—. *No se
 *    duplica una puerta que no existe.*
 * ③ **N25 ③ («no necesita mecanismo nuevo: va como `pie` de
 *    `PantallaConPie`») está DEROGADO** por el propio founder en S100d·bis:
 *    la pieza es overlay puro con `position:'absolute'`. La letra de §1bis
 *    todavía dice lo viejo.
 * ④ **N25 ⚠️ («la flotante es de la VITRINA») quedó ENSANCHADO por N28**:
 *    *«mientras tenga productos debe estar visible en TODA la app»*.
 *
 * ⇒ *La ley que había que medir ya había sido enmendada dos veces por quien la
 * firmó, y sólo el objeto lo decía.* **Quien lea N25 en `DIRECCION_DISENO_S99`
 * y no lea esta pieza va a construir contra letra vencida.**
 *
 * ── ⚠️ LO QUE SÍ CAMBIA Y NO ES GRATIS — tres consecuencias declaradas ──
 * **① LA CONDICIÓN DE EXISTENCIA DE N28 SE ENSANCHA.** Era *«hay productos»*;
 * pasa a *«hay algo de alguna clase»*. Y N25 manda que la puerta del carrito
 * **se calle en `carrito` y `checkout`** — pero un mensaje pendiente ahí sigue
 * pendiente. ⇒ **el silencio es POR CLASE, no por pieza**, y lo decide el
 * shell sacando esa clase del arreglo. *La pieza no conoce rutas y no debe.*
 *
 * **② EL CARRITO PAGA UN TOQUE cuando hay mensajes.** Antes uno, ahora dos.
 * Es un costo real contra el espíritu de N25 —la puerta donde llega el
 * pulgar— y lo firma el founder al pedir el abanico. *Se declara para que no
 * se descubra como defecto.*
 *
 * **③ LA COLA DEL SCROLL DEJA DE SER DEL CARRITO.** `COLA_CARRITO_FLOTANTE`
 * la pagaban dos pantallas de despensa porque el disco sólo existía con
 * productos. Ahora puede existir **sólo con mensajes**, en pantallas que nunca
 * pagaron cola. ⇒ nace `COLA_BURBUJA_PENDIENTES` y el nombre viejo queda como
 * alias con su lápida: *una constante que se llama «carrito» y reserva
 * espacio para mensajes miente en el nombre, que es donde nadie la lee.*
 *
 * ── 🔴 EL ROJO, HECHO INEXPRESABLE Y NO EVITADO ────────────────────────
 * *«abanico con una sola clase»*. **No hay prop `abierto`.** El despliegue es
 * estado interno y sólo puede existir con dos clases: con una, el toque llama
 * directo a su `onAbrir` y el abanico no tiene forma de nacer.
 * ⇒ *el caso prohibido no se chequea en runtime: no se puede escribir.*
 *
 * **Y el filtro de `cuenta > 0` es parte del rojo, no cortesía:** con
 * `carrito: 3` y `mensajes: 0` quedan DOS entradas en el arreglo y UNA clase
 * real. Sin filtrar, ese caso abriría un abanico con una opción vacía.
 *
 * ── EL GLIFO Y EL NÚMERO ──────────────────────────────────────────────
 * **Una clase:** su glifo con el contador como insignia —la anatomía que la
 * casa ya tenía—. `carrito` → `carrito` · `mensajes` → `burbujas`, el mismo
 * dibujo que la escalera de adopción usa para *«en conversación»*: **dos
 * globos son una conversación en los dos lugares** (L-175: se ensancha, no se
 * copia).
 *
 * **Dos clases: EL NÚMERO ES EL CONTENIDO, sin glifo.** 🔴 *Es la única
 * decisión de esta pieza que tomé sin ojo del founder, y va con su razón y su
 * salida:* con dos destinos, **cualquier glifo miente sobre la mitad** —un
 * carrito sobre un disco que también lleva mensajes nombra uno de los dos— y
 * **el glifo genérico de «pendientes» NO EXISTE en el registry** (medido).
 * Inventarlo acá se saltaría §6b y su gate por ícono. *El total solo es
 * honesto, y de paso distingue los dos estados: **una clase se lee como un
 * objeto con su insignia; dos, como una cuenta que hay que abrir**.*
 * ⇒ **Si el founder quiere una marca ahí, es un glifo con su estudio §6b y su
 * gate — no un parche en esta pieza.**
 *
 * ── LA ANATOMÍA DEL ABANICO ───────────────────────────────────────────
 * **Cerrada, la pieza no ocupa NADA** (caja que abraza al disco, overlay
 * puro). **Abierta, toma la pantalla entera** — no por gusto: *es la única
 * forma de que un toque afuera la cierre.* El captador vive debajo de las
 * opciones y sólo existe mientras el abanico está abierto, así que **con el
 * abanico cerrado no hay nada que intercepte un toque** — ni la barra de tabs.
 *
 * **El movimiento: `micro` (150) y nada más** (N15 — donde hay urgencia el
 * movimiento se calla; acá no hay urgencia pero sí un menú, y un menú que
 * tarda se siente trabado). Sin resorte, sin escalonado: las dos opciones
 * entran juntas. `reduce-motion` lo respeta Reanimated solo, y **sin la
 * animación el abanico igual aparece** — el movimiento adorna, no produce.
 *
 * ── LO QUE NO HACE ────────────────────────────────────────────────────
 * No sabe de carrito ni de mensajes (recibe clases con su número y su voz), no
 * navega, **no decide en qué pantallas vive ni qué clase se calla en cuál**
 * —eso es del shell—, y no muestra plata.
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Icono, type IconoNombre } from './Icono'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { usePresionado } from './usePresionado'
import { clasesVivas } from './pendientes-vivos'

/** 56 — el disco. **No es N8 con holgura: es el tamaño de una puerta.** */
const DISCO = 56
/** El glifo adentro del disco. */
const GLIFO = 26
/** El glifo de cada opción del abanico: más chico, porque ahí lleva etiqueta. */
const GLIFO_OPCION = 20
/** El contador. 20 sostiene dos cifras; ver `TOPE`. */
const CONTADOR = 20
/** Arriba de esto el número deja de leerse y **la salida es decir «muchos»,
 *  jamás encoger la letra** — la misma ley que `GlifoConContador`. */
const TOPE = 99

/** 🔴 LA COLA QUE LA PANTALLA LE DEBE AL SCROLL — derivada, jamás tecleada.
 *
 *  El disco flota **encima** del contenido, así que el último ítem y cualquier
 *  CTA quedarían debajo si el scroll no reservara su cola.
 *
 *  ⚠️ **Y ahora la deben más pantallas que antes:** el disco ya no depende del
 *  carrito (ver ③ de la cabecera). *Una pantalla que sólo tiene mensajes
 *  también la paga.* */
export const COLA_BURBUJA_PENDIENTES = DISCO + spacing[5] + spacing[4]

/** Las clases que pueden estar pendientes. **Crece acá y rompe en el mapa de
 *  glifos**, que es `Record` completo a propósito: *un cuarto cuarto no puede
 *  entrar sin que alguien decida su dibujo.* */
export type ClasePendiente = 'carrito' | 'mensajes'

const GLIFO_DE: Record<ClasePendiente, IconoNombre> = {
  carrito: 'carrito',
  /* Los dos globos de la escalera de adopción. Se ensancha, no se copia. */
  mensajes: 'burbujas',
}

export interface Pendiente {
  clase: ClasePendiente
  /** **`0` ⇒ la clase no existe** y no cuenta para el abanico (ver el rojo). */
  cuenta: number
  onAbrir: () => void
  /** La voz de la casa, compuesta por la pantalla —*«Ver tu carrito, 3
   *  productos»*—. **Obligatoria:** es el nodo que se toca, y también la
   *  etiqueta de su opción en el abanico. */
  etiqueta: string
  /** Lo que se lee EN la opción del abanico —*«Carrito»*—. Corto: al lado va
   *  el número y arriba el resto de la casa. */
  titulo: string
}

export interface BurbujaPendientesProps {
  /** Lo que hay del otro lado. **Vacío o todo en cero ⇒ la pieza no se
   *  dibuja** (19.9: el nulo no se pinta, y no hay nada que abrir). */
  pendientes: readonly Pendiente[]
  /** La voz del disco **cuando hay dos clases** —*«Tenés 5 pendientes»*—.
   *  Con una sola clase manda la `etiqueta` de esa clase y ésta no se usa.
   *  Obligatoria porque la pieza no compone voz (Ley 3). */
  etiquetaAbanico: string
  /** Cuánto levantarlo desde el borde inferior, en dp. **Existe porque la
   *  pieza no sabe qué hay debajo**: montada en el shell, lo que hay debajo es
   *  la barra de tabs, y su alto lo mide el shell con un `onLayout`. */
  aireInferior?: number
}

export function BurbujaPendientes({
  pendientes,
  etiquetaAbanico,
  aireInferior = 0,
}: BurbujaPendientesProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado()
  const [abierto, setAbierto] = useState(false)

  /* 🔴 EL FILTRO ES PARTE DEL ROJO (ver cabecera y `pendientes-vivos`): una
     clase en cero no es una clase, y sin esto `carrito:3 · mensajes:0`
     abriría un abanico de uno. Vive afuera para poder medirse sin React. */
  const vivos = clasesVivas(pendientes)
  if (vivos.length === 0) return null

  const total = vivos.reduce((n, p) => n + p.cuenta, 0)
  const unaSola = vivos.length === 1 ? vivos[0] : null

  const numero = (n: number) => (n > TOPE ? `${TOPE}+` : String(n))

  const disco = (
    <Pressable
      onPress={() => (unaSola !== null ? unaSola.onAbrir() : setAbierto((x) => !x))}
      {...handlers}
      accessibilityRole="button"
      accessibilityLabel={unaSola !== null ? unaSola.etiqueta : etiquetaAbanico}
      accessibilityState={unaSola !== null ? undefined : { expanded: abierto }}
      style={{
        width: DISCO,
        height: DISCO,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.accent.cta,
        // El oro NO se recorta contra papel (1.55 medido en S82-B).
        boxShadow: theme.elevacion.elevada,
      }}
    >
      {unaSola !== null ? (
        <>
          <Icono
            nombre={GLIFO_DE[unaSola.clase]}
            tamano={GLIFO}
            registro="tinta"
            tinta={theme.accent.ctaTexto}
          />
          {/* EL CONTADOR — tinta con el número en papel. Sale del disco lo
              justo para leerse como insignia y no como parte del glifo. */}
          <View
            style={{
              position: 'absolute',
              top: -spacing[1],
              right: -spacing[1],
              minWidth: CONTADOR,
              height: CONTADOR,
              paddingHorizontal: spacing[1],
              borderRadius: radius.full,
              backgroundColor: theme.text.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: typography.family.mono.regular, // dato de máquina (Ley 3)
                fontSize: typography.size.xs,
                fontVariant: ['tabular-nums'],
                letterSpacing: typography.tracking.mono,
                color: theme.bg.base,
              }}
            >
              {numero(unaSola.cuenta)}
            </Text>
          </View>
        </>
      ) : (
        /* DOS CLASES: el número ES el contenido, sin glifo (ver cabecera). */
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.lg,
            fontVariant: ['tabular-nums'],
            letterSpacing: typography.tracking.mono,
            color: theme.accent.ctaTexto,
          }}
        >
          {numero(total)}
        </Text>
      )}
    </Pressable>
  )

  /* CERRADA: caja que abraza al disco — la pieza no ocupa nada y no intercepta
     ningún toque. */
  if (unaSola !== null || !abierto) {
    return (
      <Animated.View
        entering={FadeIn.duration(motion.duration.estandar)}
        style={[
          { position: 'absolute', right: spacing[5], bottom: spacing[5] + aireInferior },
          estiloPresionado,
        ]}
      >
        {disco}
      </Animated.View>
    )
  }

  /* ABIERTA: toma la pantalla, porque es la única forma de que un toque afuera
     la cierre. El captador va DEBAJO de las opciones. */
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Pressable
        onPress={() => setAbierto(false)}
        accessibilityRole="button"
        accessibilityLabel={etiquetaAbanico}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        style={{
          position: 'absolute',
          right: spacing[5],
          bottom: spacing[5] + aireInferior,
          alignItems: 'flex-end',
          gap: spacing[3],
        }}
      >
        {vivos.map((p) => (
          <Animated.View key={p.clase} entering={FadeIn.duration(motion.duration.micro)}>
            <Pressable
              onPress={() => {
                setAbierto(false)
                p.onAbrir()
              }}
              accessibilityRole="button"
              accessibilityLabel={p.etiqueta}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[2],
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[3],
                borderRadius: radius.full,
                /* La superficie flotante de la casa — la receta es de `Hoja`,
                   copiada y no inventada. */
                backgroundColor: theme.mode === 'light' ? theme.bg.card : theme.bg.elevated,
                boxShadow: theme.elevacion.elevada,
              }}
            >
              <Icono
                nombre={GLIFO_DE[p.clase]}
                tamano={GLIFO_OPCION}
                registro="tinta"
                tinta={theme.text.primary}
              />
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  color: theme.text.primary,
                }}
              >
                {p.titulo}
              </Text>
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.sm,
                  fontVariant: ['tabular-nums'],
                  letterSpacing: typography.tracking.mono,
                  color: theme.text.secondary,
                }}
              >
                {numero(p.cuenta)}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
        {disco}
      </View>
    </View>
  )
}
