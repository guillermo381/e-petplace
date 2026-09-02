/**
 * FormularioPostulacion — LAS SEIS PREGUNTAS, Y NINGUNA MÁS (S112-B, B2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **UN FORMULARIO GENÉRICO NO PUEDE PROHIBIR UN CAMPO. ÉSTE SÍ, PORQUE
 *    LAS PREGUNTAS SON SUYAS.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `LETRA_ADOPCION` y §5.9 del loop mandan lo mismo desde dos lados: *el
 * esquema del formulario no admite nombres ni edades exactas de menores.* El
 * motor lo cierra con un `CHECK` que rebota cualquier clave fuera del
 * esquema (A7). **Esta pieza es la otra pared**, y por eso NO es un armador
 * de formularios: *un armador recibe los campos por prop, y un campo de
 * nombre entra por esa misma puerta sin que nada lo note.*
 *
 * ⇒ **Las seis preguntas están escritas acá.** Agregar una exige editar este
 * archivo, que es exactamente la fricción que se busca: el día que alguien
 * quiera preguntar el nombre de un chico, tiene que escribirlo donde este
 * comentario lo va a mirar.
 *
 * ── 🔴 EL ROJO: LO QUE NO SE PUEDE DIBUJAR ───────────────────────────────
 * 1. **Un campo de nombre de menor.** `respuestas={{…, nombre_menor: 'x'}}`
 *    no compila (`TS2353`, exceso de propiedad): `RespuestasPostulacion` no
 *    tiene dónde ponerlo, y no hay prop de «campos extra».
 * 2. **Una edad exacta.** Sólo hay contadores POR RANGO. No existe un campo
 *    de edad ni de fecha de nacimiento de un menor.
 * 3. **Un «Enviar» apagado y mudo.** `envio` es una unión discriminada: o
 *    trae `onEnviar` (encendido), o trae `razon` (apagado **con** su razón).
 *    `{ etiqueta }` a secas no compila. *Es `D-999` hecho tipo: en esta
 *    pantalla la razón no depende de que alguien se acuerde.*
 *
 * ⚠️ **Lo que el rojo 1 NO cubre (`L-459`):** que la pantalla escriba un
 * nombre DENTRO de un campo de texto libre (`otros_animales`, `motivo`).
 * Ningún tipo puede impedir eso — lo mira la purga de 90 días y la letra,
 * no el diseño. *Se dice para que nadie lea este contrato como una garantía
 * de privacidad; es una garantía de ESQUEMA.*
 *
 * ── LA LETRA QUE CUMPLE, con su número ───────────────────────────────────
 * · **N12 · un bloque por pregunta.** Seis bloques, en el orden de la letra.
 * · **N21 · superficie sólo donde hay GRUPO.** El bloque del hogar son
 *   CUATRO contadores que se leen juntos bajo un rótulo que los nombra ⇒ va
 *   en carta. **Los otros cinco NO**: son un control cada uno, y la ley dice
 *   literal *«una superficie por grupo, jamás una por elemento»* y *«ante la
 *   duda, quitá antes que agregar»*. Seis cartas serían la ley aplicada al
 *   revés.
 * · **N11 / N11′** — las etiquetas las ponen las piezas de campo de la casa
 *   (afuera y arriba, mismo tamaño siempre); el «por qué este animal» es
 *   campo de escritura multilínea.
 * · **N12.4** — hay slot de error POR PREGUNTA. La pieza no valida: no sabe
 *   contra qué. *Sin el slot, la pantalla no tendría dónde decir qué está
 *   mal, y la ley que exige decirlo sería inaplicable.*
 * · **N12.5** — los topes viven en la construcción: `horas_solo` llega a 24
 *   porque un día tiene 24 horas, y `adultos` arranca en 1 porque alguien
 *   vive ahí. **Nunca se escriben en pantalla.**
 * · **N25 / D-999** — un solo «Enviar», abajo, y dibuja su razón cuando está
 *   apagado.
 * · **Ley 3** — cero diccionario: las palabras son todas obligatorias.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La pantalla de postulación del cliente (C5), sobre
 * `crear_solicitud_adopcion`. **Entregada y no montada hasta que exista.**
 */
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { Boton } from './Boton'
import { Campo, EtiquetaDeCampo } from './Campo'
import { Casilla } from './Casilla'
import { SelectorOpcion } from './SelectorOpcion'
import { StepperCantidad } from './StepperCantidad'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

/**
 * EL ESQUEMA, espejo del que valida el motor (A7). **Cerrado**: sin índice
 * de firma, sin `[k: string]`, sin `extends`. Un objeto literal con una
 * clave de más es `TS2353` en la pantalla — que es el rojo 1.
 */
export type RespuestasPostulacion = {
  /** Cantidades POR RANGO. Jamás nombres, jamás edades exactas. */
  hogar: {
    adultos: number
    menores_0_5: number
    menores_6_12: number
    menores_13_17: number
  }
  /** Código del enum de vivienda. Las opciones las trae la pantalla. */
  vivienda: string
  otros_animales: string
  horas_solo: number
  experiencia: string
  /** «Por qué este animal» — el campo de escritura de N11. */
  motivo: string
}

/** Las preguntas que pueden mostrar un error. El hogar entero cuenta como
 *  una: sus cuatro contadores viven bajo un rótulo y se corrigen juntos. */
export type PreguntaDelFormulario =
  | 'hogar'
  | 'vivienda'
  | 'otros_animales'
  | 'horas_solo'
  | 'experiencia'
  | 'motivo'

/**
 * EL BOTÓN, COMO UNIÓN DISCRIMINADA — el rojo 3.
 *
 * `Boton` acepta `razonDeshabilitado` como opcional, porque hay pantallas
 * donde apagar sin explicar todavía es lo que hay. **Acá no.** Ésta es la
 * pantalla donde la persona ya escribió seis respuestas: apagar el envío sin
 * decir qué falta es el peor lugar de todo el vertical para quedarse mudo.
 * El `?: never` en cada rama es lo que hace que las dos formas no se puedan
 * mezclar ni omitir.
 */
type EnvioListo = {
  etiqueta: string
  onEnviar: () => void
  cargando?: boolean
  razon?: never
}
type EnvioApagado = {
  etiqueta: string
  /** Qué falta, en una línea. `Boton` la dibuja debajo, atenuada. */
  razon: string
  onEnviar?: never
  cargando?: never
}
export type EnvioDeFormulario = EnvioListo | EnvioApagado

export type FormularioPostulacionProps = {
  respuestas: RespuestasPostulacion
  onCambio: (respuestas: RespuestasPostulacion) => void
  /** Las opciones del enum de vivienda, con su voz. Vienen del motor. */
  opcionesVivienda: { codigo: string; etiqueta: string }[]
  /**
   * El consentimiento del abogado. `texto` es el que A publica y C pasa —
   * **la pieza no trae ninguno y no tiene default**: `NO SE INVENTA TEXTO
   * LEGAL` es ley del loop, y la forma de cumplirla es no poder.
   */
  consentimiento: {
    texto: string
    /** Enlace inline al documento, si la pantalla lo ofrece. */
    enlace?: ReactNode
    marcado: boolean
    onCambio: (marcado: boolean) => void
  }
  envio: EnvioDeFormulario
  /** N12.4 — qué está mal y cómo se arregla. Lo redacta la pantalla. */
  errores?: Partial<Record<PreguntaDelFormulario, string>>
  /** Todas las palabras. Obligatorias (Ley 3). */
  voces: {
    hogar: {
      rotulo: string
      adultos: string
      menores_0_5: string
      menores_6_12: string
      menores_13_17: string
    }
    vivienda: string
    otrosAnimales: { rotulo: string; ayuda?: string }
    horasSolo: { rotulo: string; ayuda?: string }
    experiencia: { rotulo: string; ayuda?: string }
    motivo: { rotulo: string; ayuda?: string }
  }
}

/* Los topes, en la construcción y jamás en pantalla (N12.5). Salen de la
 * realidad, no de una preferencia: en una casa vive al menos un adulto —el
 * que postula— y un día tiene 24 horas. */
const MIN_ADULTOS = 1
const MAX_PERSONAS = 20
const MAX_HORAS_DIA = 24

/** Un contador del hogar: su etiqueta a la izquierda, el control a la
 *  derecha. Los cuatro comparten fila para que se comparen de un vistazo —
 *  que es la razón por la que van juntos en una carta. */
function FilaContador({
  etiqueta,
  valor,
  min,
  onCambio,
}: {
  etiqueta: string
  valor: number
  min: number
  onCambio: (v: number) => void
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing[3],
      }}
    >
      <View style={{ flex: 1 }}>
        <Texto variante="cuerpo">{etiqueta}</Texto>
      </View>
      <StepperCantidad
        valor={valor}
        min={min}
        max={MAX_PERSONAS}
        onCambio={onCambio}
        etiqueta={etiqueta}
        tamano="compacto"
        editable
      />
    </View>
  )
}

export function FormularioPostulacion({
  respuestas,
  onCambio,
  opcionesVivienda,
  consentimiento,
  envio,
  errores,
  voces,
}: FormularioPostulacionProps) {
  const hogar = respuestas.hogar
  const cambiarHogar = (parche: Partial<RespuestasPostulacion['hogar']>) =>
    onCambio({ ...respuestas, hogar: { ...hogar, ...parche } })

  return (
    // 24 px entre preguntas: el mismo aire que N11′ pide entre un campo y el
    // siguiente, para que ninguna etiqueta se lea como parte del bloque de
    // arriba.
    <View style={{ gap: spacing[6] }}>
      {/* ① EL HOGAR — el único bloque que es un GRUPO, y por eso el único
          que lleva carta (N21). Cuatro cantidades por RANGO: no hay dónde
          escribir un nombre ni una edad, y no es una omisión que se pueda
          corregir desde afuera. */}
      <Tarjeta>
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{voces.hogar.rotulo}</Texto>
          <FilaContador
            etiqueta={voces.hogar.adultos}
            valor={hogar.adultos}
            min={MIN_ADULTOS}
            onCambio={(adultos) => cambiarHogar({ adultos })}
          />
          <FilaContador
            etiqueta={voces.hogar.menores_0_5}
            valor={hogar.menores_0_5}
            min={0}
            onCambio={(menores_0_5) => cambiarHogar({ menores_0_5 })}
          />
          <FilaContador
            etiqueta={voces.hogar.menores_6_12}
            valor={hogar.menores_6_12}
            min={0}
            onCambio={(menores_6_12) => cambiarHogar({ menores_6_12 })}
          />
          <FilaContador
            etiqueta={voces.hogar.menores_13_17}
            valor={hogar.menores_13_17}
            min={0}
            onCambio={(menores_13_17) => cambiarHogar({ menores_13_17 })}
          />
          {errores?.hogar === undefined ? null : (
            <Texto variante="apoyo" color="danger">
              {errores.hogar}
            </Texto>
          )}
        </View>
      </Tarjeta>

      {/* ② LA VIVIENDA — enum del motor. Grilla: las etiquetas son frases
          cortas y envuelven; una tira las cortaría. */}
      <SelectorOpcion
        etiqueta={voces.vivienda}
        opciones={opcionesVivienda.map((o) => ({
          codigo: o.codigo,
          etiqueta: o.etiqueta,
        }))}
        seleccionada={respuestas.vivienda}
        onSelect={(vivienda) => onCambio({ ...respuestas, vivienda })}
        disposicion="grilla"
        acento="control"
      />

      {/* ③ OTROS ANIMALES — texto corto: «cuáles», no cuántos. */}
      <Campo
        label={voces.otrosAnimales.rotulo}
        ayuda={voces.otrosAnimales.ayuda}
        error={errores?.otros_animales}
        value={respuestas.otros_animales}
        onChangeText={(otros_animales) =>
          onCambio({ ...respuestas, otros_animales })
        }
      />

      {/* ④ HORAS SOLO — contador y no campo numérico: el tope es parte de la
          construcción, y un campo de texto acepta «48» y obliga a rebotarlo
          después (N12.5 al revés). Con `editable` se puede tipear igual. */}
      <View>
        <EtiquetaDeCampo>{voces.horasSolo.rotulo}</EtiquetaDeCampo>
        <View style={{ flexDirection: 'row' }}>
          <StepperCantidad
            valor={respuestas.horas_solo}
            min={0}
            max={MAX_HORAS_DIA}
            onCambio={(horas_solo) => onCambio({ ...respuestas, horas_solo })}
            etiqueta={voces.horasSolo.rotulo}
            editable
          />
        </View>
        {errores?.horas_solo === undefined ? null : (
          <Texto variante="apoyo" color="danger">
            {errores.horas_solo}
          </Texto>
        )}
      </View>

      {/* ⑤ EXPERIENCIA y ⑥ POR QUÉ ESTE ANIMAL — los dos de escritura (N11).
          El motivo con más alto: es la pregunta que el refugio va a leer
          entera, y una caja de una línea pide una respuesta de una línea. */}
      <Campo
        label={voces.experiencia.rotulo}
        ayuda={voces.experiencia.ayuda}
        error={errores?.experiencia}
        value={respuestas.experiencia}
        onChangeText={(experiencia) => onCambio({ ...respuestas, experiencia })}
        multilinea={3}
      />

      <Campo
        label={voces.motivo.rotulo}
        ayuda={voces.motivo.ayuda}
        error={errores?.motivo}
        value={respuestas.motivo}
        onChangeText={(motivo) => onCambio({ ...respuestas, motivo })}
        multilinea={4}
      />

      {/* ⑦ EL CONSENTIMIENTO — el texto es del abogado y entra por prop. */}
      <Casilla
        marcada={consentimiento.marcado}
        onCambio={consentimiento.onCambio}
        etiquetaAccesible={consentimiento.texto}
      >
        <Texto variante="cuerpo">
          {consentimiento.texto}
          {consentimiento.enlace}
        </Texto>
      </Casilla>

      {/* ⑧ UN SOLO ENVIAR, ABAJO (N25). Apagado dibuja su razón (D-999), y
          el tipo hace que no pueda estar apagado sin ella.

          🔴 **NO SE PASA `onRazon`, Y ES DELIBERADO.** `onRazon` es el
          TOQUE —a dónde te lleva la razón cuando hay algo que resolver en
          otra pantalla—; acá lo que falta se arregla ARRIBA, en el mismo
          formulario, así que no hay a dónde llevar. Desde S112-B la línea
          se dibuja con `razonDeshabilitado` sola: pasar un `onRazon` vacío
          para «cumplir» sería fabricar un toque que no lleva a ningún
          lado, que es justo lo que S111 se negó a hacer. */}
      <Boton
        etiqueta={envio.etiqueta}
        bloque
        deshabilitado={envio.onEnviar === undefined}
        cargando={envio.cargando}
        razonDeshabilitado={envio.razon}
        onPress={envio.onEnviar}
      />
    </View>
  )
}
