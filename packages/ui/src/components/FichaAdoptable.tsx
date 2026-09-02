/**
 * FichaAdoptable — EL ORDEN DE LA FICHA, HECHO ESTRUCTURA (S112-B, B8).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **N19: EL ORDEN ES LEY. ACÁ NO HAY PROP PARA CAMBIARLO.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §4.1 «La ficha» dicta once bloques en un orden que no es estético: es el
 * orden en que una familia decide. **La pieza los monta ELLA**, y los
 * contenidos entran por slots CON NOMBRE — `semaforo`, `convivencia`,
 * `senales`— así que la pantalla decide QUÉ va en cada bloque y **no puede
 * decidir DÓNDE**. *Un array de secciones habría dejado el orden en manos
 * del consumidor, que es exactamente lo que N19 prohíbe.*
 *
 * ── POR QUÉ SLOTS Y NO DATOS ─────────────────────────────────────────────
 * Los tres bloques del medio ya son piezas de la casa con su contrato
 * propio (`SemaforoSanitario`, `Convivencia`, `SenalesAdoptable`).
 * Recibirlos como datos obligaría a re-declarar sus tres contratos acá y a
 * mantenerlos en dos lugares. **El slot con nombre da el orden sin
 * duplicar el contrato**, que es lo único que esta pieza tiene que aportar.
 *
 * ── ⚠️ LA GALERÍA ES SLOT, Y ES LA DECISIÓN QUE HAY QUE LEER ────────────
 * El carrusel de la casa **existe y no se puede reusar todavía**: vive
 * DENTRO de `FichaPrestador` (~150 líneas), enredado con clips,
 * `sobrePortada`, el degradado del nombre y los puntos. Sacarlo a una pieza
 * propia es lo que la letra manda —N17: *«una fuente, N consumidores; jamás
 * se duplican»*— **y no se hizo acá, con su razón:**
 *
 * 🔴 **su propiedad clave la cerró el OJO DEL FOUNDER en aparato** — *«no
 * tironea en Android»*, firma sobre el group `d139b9c0` / APK 1.0.3, y su
 * propio autor había declarado que NO PODÍA afirmarlo desde el repo. *Una
 * propiedad que se cerró mirando no se puede volver a cerrar leyendo.* Mover
 * ese código hoy reabre una verificación firmada que esta pista no puede
 * reproducir, sobre una superficie que ya está montada y gateada.
 *
 * ⇒ **Queda nombrado, no escondido:** la extracción de `CarruselDeFotos`
 * (fuente: `FichaPrestador.tsx` líneas ~270-440) es trabajo con dueño y
 * **necesita gate en aparato**, no un typecheck. Mientras tanto el slot
 * `galeria` recibe lo que la pantalla tenga. *Si C termina escribiendo un
 * segundo carrusel ahí, la deuda se cobró y hay que extraer.*
 *
 * ── N21 · DÓNDE VA CARTA Y DÓNDE NO ──────────────────────────────────────
 * Llevan carta los bloques que AGRUPAN y tienen rótulo: salud, convivencia,
 * historia, señales, publicador, bono. **No llevan** la galería (es la
 * pantalla), la identidad (es el encabezado), el CTA (es el pie) ni
 * «Reportar» (es una acción suelta al final).
 *
 * ── N22 · LAS TRES «i» ───────────────────────────────────────────────────
 * Publicador, bono y «Apadrinar» explican; no deciden. *Lo que se necesita
 * para decidir queda a la vista; lo que se necesita para entender va detrás
 * de una «i».* La «i» es interna a esta pieza y **no se exporta**: es un
 * candidato claro a pieza de la casa —N22 la declara estándar y hay al
 * menos tres montajes a mano en pantallas (`carrito.tsx`,
 * `checkout.tsx`)— pero promover un estándar de la casa es decisión de
 * mesa, no de la pieza que lo necesitó tercera.
 *
 * ── MEMORIAL: SE REUSA, NO SE DUPLICA ────────────────────────────────────
 * No hay `MemorialAdoptable` y no debe haberlo: la dignidad es del TEMA
 * (`<ThemeProvider memorial>` queda siempre encima y todas las piezas ya
 * responden). Lo que cambia en un adoptable fallecido es **qué se le
 * ofrece**, y eso ya es expresable: sin `cta`, sin `apadrinar`, sin `bono`.
 * *Escribir una segunda ficha sería duplicar en una pieza lo que el tema
 * hace en todas.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La ficha del adoptable en el cliente (C3), sobre `obtener_adoptable`.
 * **Entregada y no montada.**
 */
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota } from './AvatarMascota'
import { Boton } from './Boton'
import { Icono } from './Icono'
import { PantallaConPie } from './PantallaConPie'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

/** El botón de la ficha: encendido, o apagado CON su razón (`D-999`). */
type CtaListo = { etiqueta: string; onPress: () => void; razon?: never }
type CtaApagado = { etiqueta: string; razon: string; onPress?: never }
export type CtaDeFicha = CtaListo | CtaApagado

/** Un dato que se explica: su texto a la vista, el porqué detrás de la «i». */
export type ConExplicacion = {
  /** Lo que se lee sin tocar nada. */
  texto: string
  /** Abre la Hoja con la explicación. La escribe la pantalla. */
  onExplicar: () => void
  /** accessibilityLabel del botón «i». */
  etiquetaExplicacion: string
}

export type FichaAdoptableProps = {
  /**
   * ① LA GALERÍA — 1:1, deslizable, arriba de todo. **Slot, y ver la nota
   * de la cabecera:** el carrusel de la casa todavía no es una pieza.
   */
  galeria?: ReactNode

  /** ② IDENTIDAD. `edad` ya redactada; `null` SE DICE con `voces.edadNoInformada`. */
  nombre: string
  edad?: string | null
  /** Especie · sexo · tamaño, ya redactados. La pieza los une con « · ». */
  detalles?: string[]

  /** ③ SALUD — `SemaforoSanitario`. Lo que falta va como INFORMACIÓN (ítem 11). */
  semaforo?: ReactNode
  /** ④ CONVIVENCIA — `Convivencia`, con su tercer estado del mismo peso. */
  convivencia?: ReactNode
  /** ⑤ LA HISTORIA DEL RESCATE, en voz humana. Texto, no slot: es prosa. */
  historia?: string
  /**
   * ⑥ SEÑALES — `SenalesAdoptable`. **La ubicación aproximada viaja acá**,
   * como señal `zona`: §4.1 la lista aparte pero la pieza ya la tiene, y
   * dos lugares para el mismo dato es cómo se contradicen.
   */
  senales?: ReactNode

  /** ⑦ QUIÉN PUBLICA — nombre y cara, con su línea de verificación y su «i». */
  publicador?: {
    nombre: string
    fotoUrl?: string | null
    verificacion: ConExplicacion
  }

  /** ⑧ EL BONO, si lo hay: monto y destino, con la «i» de que se paga afuera. */
  bono?: ConExplicacion

  /** ⑨ EL BOTÓN ÚNICO, en el pie, donde llega el pulgar (N25). */
  cta?: CtaDeFicha
  /** ⑩ «Apadrinar» — visible, con la «i» que dice «pronto». NO navega (N7). */
  apadrinar?: ConExplicacion
  /** ⑪ «Reportar esta publicación» — discreto, al final. */
  reportar?: { etiqueta: string; onPress: () => void }

  /** Rótulos de los bloques y la voz de la edad ausente. Obligatorios (Ley 3). */
  voces: {
    edadNoInformada: string
    salud: string
    convivencia: string
    historia: string
    senales: string
    publicador: string
    bono: string
  }
}

/**
 * LA «i» EN CÍRCULO (N22). Interna: ver la nota de la cabecera sobre por qué
 * no se exporta todavía.
 */
function BotonExplicar({ onExplicar, etiquetaExplicacion }: ConExplicacion) {
  const { theme } = useTheme()
  return (
    <Pressable
      onPress={onExplicar}
      accessibilityRole="button"
      accessibilityLabel={etiquetaExplicacion}
      /* El glifo mide 20; el target táctil llega a 44 por hitSlop, sin que
         el ícono crezca ni empuje la línea que lo contiene (N24). */
      hitSlop={12}
    >
      {/* `registro="aa"` y no `capa`: la «i» es andamiaje funcional —
          informa, no es un objeto del expediente— y `tinta` la baja al
          secundario para que explique sin competir con el dato. */}
      <Icono nombre="info" tamano={20} registro="aa" tinta={theme.text.secondary} />
    </Pressable>
  )
}

/** Un bloque con rótulo ⇒ va en carta (N21, criterio operativo). */
function Bloque({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <Tarjeta>
      <View style={{ gap: spacing[2] }}>
        <Texto variante="seccion">{rotulo}</Texto>
        {children}
      </View>
    </Tarjeta>
  )
}

/** Una línea de texto con su «i» al costado. */
function LineaConExplicacion({ dato }: { dato: ConExplicacion }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      <View style={{ flex: 1 }}>
        <Texto variante="cuerpo">{dato.texto}</Texto>
      </View>
      <BotonExplicar {...dato} />
    </View>
  )
}

export function FichaAdoptable({
  galeria,
  nombre,
  edad,
  detalles,
  semaforo,
  convivencia,
  historia,
  senales,
  publicador,
  bono,
  cta,
  apadrinar,
  reportar,
  voces,
}: FichaAdoptableProps) {
  /* La edad ausente SE DICE, no se calla: una ficha sin edad y sin decirlo
     se lee como una ficha incompleta, y la edad estimada de un rescate es
     una estimación honesta, no un dato que falte (mismo criterio que
     `TarjetaAdoptable`). */
  const lineaIdentidad = [edad ?? voces.edadNoInformada, ...(detalles ?? [])]
    .filter((x) => x !== '')
    .join(' · ')

  return (
    <PantallaConPie
      pie={
        cta === undefined ? undefined : (
          <Boton
            etiqueta={cta.etiqueta}
            bloque
            deshabilitado={cta.onPress === undefined}
            razonDeshabilitado={cta.razon}
            onPress={cta.onPress}
          />
        )
      }
      contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[6] }}
    >
      {/* ① LA GALERÍA — a sangre, sin padding: la pantalla, no una carta. */}
      {galeria}

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[4] }}>
        {/* ② IDENTIDAD — el encabezado de la pantalla: sin carta (N21). El
            nombre manda por tamaño, jamás por color (N23). */}
        <View style={{ gap: spacing[1] }}>
          <Texto variante="titulo">{nombre}</Texto>
          {lineaIdentidad === '' ? null : (
            <Texto variante="cuerpo" color="secondary">
              {lineaIdentidad}
            </Texto>
          )}
          {/* «Apadrinar» junto a las fotos y la identidad (§4.1), con su «i»
              que dice «pronto». NO navega: un botón que promete una pantalla
              que no existe es peor que uno que dice que todavía no está. */}
          {apadrinar === undefined ? null : (
            <View style={{ marginTop: spacing[2] }}>
              <LineaConExplicacion dato={apadrinar} />
            </View>
          )}
        </View>

        {/* ③ ④ ⑤ ⑥ — el orden no es negociable: no hay prop que lo mueva. */}
        {semaforo === undefined ? null : <Bloque rotulo={voces.salud}>{semaforo}</Bloque>}
        {convivencia === undefined ? null : (
          <Bloque rotulo={voces.convivencia}>{convivencia}</Bloque>
        )}
        {historia === undefined ? null : (
          <Bloque rotulo={voces.historia}>
            <Texto variante="cuerpo">{historia}</Texto>
          </Bloque>
        )}
        {senales === undefined ? null : <Bloque rotulo={voces.senales}>{senales}</Bloque>}

        {/* ⑦ QUIÉN PUBLICA — cara y nombre: procedencia con identidad, que es
            lo que hace que una adopción no se lea como un clasificado. */}
        {publicador === undefined ? null : (
          <Bloque rotulo={voces.publicador}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <AvatarMascota
                nombre={publicador.nombre}
                fotoUrl={publicador.fotoUrl ?? undefined}
                tamano="sm"
              />
              <View style={{ flex: 1 }}>
                <Texto variante="enfasis" numberOfLines={1}>
                  {publicador.nombre}
                </Texto>
              </View>
            </View>
            <LineaConExplicacion dato={publicador.verificacion} />
          </Bloque>
        )}

        {/* ⑧ EL BONO — monto y destino a la vista; el «se paga al refugio
            fuera de la app» detrás de la «i». */}
        {bono === undefined ? null : (
          <Bloque rotulo={voces.bono}>
            <LineaConExplicacion dato={bono} />
          </Bloque>
        )}

        {/* ⑪ REPORTAR — discreto y al final, como pidió la letra: existe para
            quien lo necesita y no compite con nada. */}
        {reportar === undefined ? null : (
          <Pressable
            onPress={reportar.onPress}
            accessibilityRole="button"
            accessibilityLabel={reportar.etiqueta}
            style={{ paddingVertical: spacing[2] }}
          >
            <Texto variante="apoyo">{reportar.etiqueta}</Texto>
          </Pressable>
        )}
      </View>
    </PantallaConPie>
  )
}
