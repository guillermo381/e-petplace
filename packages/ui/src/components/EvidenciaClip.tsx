/**
 * EvidenciaClip — GRABAR UN CLIP QUE SE PUEDE MANDAR (S111-B).
 *
 * El clip del DURANTE de la guardería: hasta el techo, con la guía de encuadre
 * a la vista, y un envío con todos los animales que correspondan.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **LA GUÍA NO DESAPARECE AL EMPEZAR A GRABAR.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Es la ley que ordena la pieza. `CRITERIO_LEGAL_GUARDERIA` §5 es **ley de
 * captura**, no ayuda contextual: animal en cuadro · sin personas · con
 * menores, descarte directo · y la media de estadía se toma **en las
 * instalaciones**. Un encuadre mal tomado no se corrige después — o el clip
 * existe mal, o no existe.
 *
 * La convención del video dice lo contrario: al apretar REC la interfaz se
 * limpia para «no molestar». **Acá eso sería exactamente el error**: el
 * segundo en que la guía importa es el segundo en que se está encuadrando, y
 * una instrucción que se lee antes y se esconde después es *texto de ayuda que
 * nadie lee* con un paso extra. **Se queda en `encuadre` y en `grabando`.**
 *
 * ── 🔴 LA PIEZA NO MONTA LA CÁMARA, Y NO ES PEREZA: ES MEDICIÓN ───────────
 * `vista` es un SLOT. Medido antes de decidir: **`packages/ui` no tiene
 * `expo-camera` ni en `dependencies` ni en `peerDependencies`, ninguna pieza de
 * la casa lo importa, y `apps/cliente` NO LO TIENE INSTALADO.** Un import duro
 * acá **rompería el bundle del cliente** — y por ser módulo nativo, ni siquiera
 * se arreglaría por OTA: exigiría una build.
 *
 * Además respeta el borde que la casa ya fijó en `ContadorClip`: *«la pieza NO
 * detiene la cámara: avisa. Quien graba es la pantalla»*. Acá igual: **la
 * pieza no graba, no comprime y no sube.** Orquesta el momento y dice a quién
 * llega.
 *
 * ── 🔴 EL TECHO ENTRA POR PROP, OBLIGATORIO Y SIN DEFAULT ─────────────────
 * `techoSeg` no tiene default **a propósito**. El número vive en la cola
 * (`CLIP_TECHO_S = 30`) y su propio módulo dice por qué: *«acá vive el número
 * para que no haya dos fuentes»*. Un `= 30` en esta pieza sería la segunda
 * fuente, y el día que la cola baje el techo **la pantalla seguiría dejando
 * grabar de más y el servidor rebotaría el clip ya grabado** — el peor momento
 * para enterarse. *Un default cómodo acá es una divergencia con fecha.*
 *
 * ── 🔴 EL ENVÍO ES UNO, CON N DESTINATARIOS ───────────────────────────────
 * Medido en la cola: `ItemMedia.mascotaIds: string[]`, con su nota — *«mínimo
 * 1 (firma ① del founder: la foto llega a CADA animal)»* — y `encolar` **lanza**
 * si viene vacío. La pieza no arma N envíos: junta los elegidos y entrega **un
 * solo array**.
 *
 * Y por eso `onPublicar` recibe una **tupla NO VACÍA**
 * (`readonly [string, ...string[]]`): *la puerta no ofrece lo que el motor va a
 * rechazar* (Ley 23). El consumidor no tiene que revalidar lo que el tipo ya
 * garantiza, y el `throw` de la cola pasa a ser el cinturón que nunca se
 * ejerce, no el que descubre el defecto.
 *
 * ── EL ESTADO MALO ES INEXPRESABLE (L-222), EN SUS DOS EJES ───────────────
 * ① `momento` es unión discriminada: **`grabando` lleva su `inicioTs`
 *    OBLIGATORIO** ⇒ «grabando sin cuándo empezó» no compila, y sin eso el
 *    contador no podría correr por diferencia contra el server.
 * ② `reglas` es una **tupla no vacía** ⇒ **«grabar sin guía» no compila.** No
 *    alcanza con que nadie pase `[]`: la ley de captura no puede depender de
 *    que el consumidor se acuerde.
 *
 * ── CERO TEXTO LEGAL ADENTRO, Y ES PROHIBICIÓN EXPLÍCITA ──────────────────
 * `encuadre.ts` lo deja escrito: *«el §0 del plan prohíbe redactar legales en
 * las pistas —placeholder incluido»*, y el contrato de A §④: *«ningún texto de
 * este bloque se redacta en pantalla como cláusula — la pantalla sólo guía el
 * encuadre»*. Por eso las reglas entran como **`{ clave, voz }`**: la clave es
 * el código de `encuadre.ts`, la voz la pone el diccionario y **la lee el
 * founder en su lote**. Esta pieza no sabe decir ninguna regla en ningún
 * idioma.
 *
 * ── CANTO DE CAPA, NO DE MARCA ────────────────────────────────────────────
 * `capa.cuidado` (guardería es CUIDADO — ley 10). Es canto de CAPA: *«tu
 * trabajo y de qué oficio»*, jamás el de MARCA (`CantoMarca`, rampa
 * turquesa→magenta), y la ley dice que **nunca van en la misma tarjeta**. 3 px
 * al ras, el ancho que la casa ya usa. Token puro: cero hex.
 *
 * Sin animación (Ley 6/13): nada pulsa, nada late. El contador corriendo ya
 * dice que está grabando — y `ContadorClip` ya decidió que **jamás va en rojo**.
 */
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Boton } from './Boton'
import { ChipEntidad } from './ChipEntidad'
import { ContadorClip } from './ContadorClip'
import { Texto } from './Texto'

/** Una regla de encuadre: su código, y la voz que le pone la casa. */
export type ReglaConVoz = { clave: string; voz: string }

/**
 * Un animal que puede recibir el clip.
 *
 * Tipo propio y NO el `OpcionDestino` de adopción, aunque hoy coincidan: son
 * dominios distintos y coinciden por accidente, no por diseño. *Compartirlo
 * ataría la forma de los destinos de una donación a la de los animales de una
 * estadía, y el día que uno gane un campo el otro lo recibiría sin pedirlo.*
 */
export type CandidatoClip = { id: string; nombre: string; fotoUrl?: string }

export type MomentoClip =
  | { fase: 'encuadre' }
  /** `inicioTs` OBLIGATORIO: el contador corre por diferencia. */
  | { fase: 'grabando'; inicioTs: number }
  | { fase: 'tomado' }

export type EvidenciaClipProps = {
  /** SLOT de la vista de cámara. La pieza NO la monta — ver el encabezado. */
  vista: ReactNode
  /** 🔴 Tupla NO VACÍA: grabar sin guía no compila. */
  reglas: readonly [ReglaConVoz, ...ReglaConVoz[]]
  /** 🔴 Sin default: la fuente del número es la cola, no esta pieza. */
  techoSeg: number
  momento: MomentoClip
  /** El obturador es UNO: la fase dice si arranca o corta. */
  onObturador: () => void
  onTecho: () => void
  /** Los animales de la estadía. */
  candidatos: CandidatoClip[]
  elegidos: readonly string[]
  onAlternar: (mascotaId: string) => void
  /** 🔴 Tupla NO VACÍA: un envío sin destinatarios no llega a nadie. */
  onPublicar: (mascotaIds: readonly [string, ...string[]]) => void
  voces: {
    guia: string
    grabar: string
    detener: string
    destinatarios: string
    publicar: string
  }
}

const CANTO = 3

export function EvidenciaClip({
  vista,
  reglas,
  techoSeg,
  momento,
  onObturador,
  onTecho,
  candidatos,
  elegidos,
  onAlternar,
  onPublicar,
  voces,
}: EvidenciaClipProps) {
  const { theme } = useTheme()

  const grabando = momento.fase === 'grabando'
  // 🔴 LA LEY: la guía vive en el encuadre Y mientras se graba. Ver encabezado.
  const guiaALaVista = momento.fase !== 'tomado'

  /* ── LA SEGUNDA CAPA: SIN GUÍA NO HAY OBTURADOR ──────────────────────────
     El tipo ya dice que `reglas` no puede venir vacía. Esto igual lo verifica,
     y no es redundancia: **un `as` en el borde defeatea cualquier tipo**, y el
     borde acá es real —`reglasSegunLugar()` devuelve `readonly ReglaEncuadre[]`
     (medido), así que el consumidor honesto tiene que estrechar, y el apurado
     castea—. Si eso pasa, **la pieza no ofrece grabar**: la ley de captura no
     puede quedar colgando de que nadie haya casteado.

     Es la forma de dos capas que la casa ya usa (L-424): el tipo, que no se
     puede saltear en el camino honesto, y la puerta, que sostiene la ley
     cuando alguien lo saltea igual. Y falla CERRADO: sin guía no se graba —
     jamás al revés. */
  const sinGuia = reglas.length === 0

  return (
    <View style={{ gap: spacing[4] }}>
      {vista}

      {guiaALaVista ? (
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          {/* Canto de CAPA (cuidado). Jamás junto a un canto de marca. */}
          <View
            style={{
              width: CANTO,
              borderRadius: radius.full,
              backgroundColor: theme.capa.cuidado,
            }}
          />
          <View style={{ flex: 1, gap: spacing[1] }}>
            <Texto variante="seccion">{voces.guia}</Texto>
            {reglas.map((r) => (
              <Texto key={r.clave} variante="apoyo">
                {r.voz}
              </Texto>
            ))}
          </View>
        </View>
      ) : null}

      {/* EL OBTURADOR, con su contador al lado sólo mientras corre. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <View style={{ flex: 1 }}>
          <Boton
            variante="primario"
            etiqueta={grabando ? voces.detener : voces.grabar}
            deshabilitado={sinGuia}
            onPress={onObturador}
          />
        </View>
        {momento.fase === 'grabando' ? (
          <ContadorClip
            inicioTs={momento.inicioTs}
            techoSeg={techoSeg}
            onTecho={onTecho}
          />
        ) : null}
      </View>

      {/* LOS DESTINATARIOS — sólo con el clip tomado: elegir a quién le llega
          algo que todavía no existe es pedir una decisión sin su objeto. */}
      {momento.fase === 'tomado' ? (
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{voces.destinatarios}</Texto>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {candidatos.map((c) => (
              <ChipEntidad
                key={c.id}
                nombre={c.nombre}
                fotoUrl={c.fotoUrl}
                sujeto="mascota"
                elegido={elegidos.includes(c.id)}
                onPress={() => onAlternar(c.id)}
              />
            ))}
          </View>

          <Boton
            variante="primario"
            etiqueta={voces.publicar}
            // Ley 23: la cola LANZA con cero destinatarios. La puerta no
            // ofrece lo que el motor va a rechazar.
            deshabilitado={elegidos.length === 0}
            onPress={() => {
              // El estrechamiento a tupla no vacía se hace UNA vez, acá, y por
              // eso el consumidor no revalida: el tipo se lo garantiza.
              const [primero, ...resto] = elegidos
              if (primero === undefined) return
              onPublicar([primero, ...resto])
            }}
          />
        </View>
      ) : null}
    </View>
  )
}
