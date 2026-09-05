/**
 * FILA DE CONFIRMACIÓN DE VACUNA — lo que la IA leyó, antes de que sea verdad.
 *
 * **La revisión es lo único que separa a la extracción de inventar datos
 * clínicos** (`L-139`: el modelo produce cosas verosímiles y falsas, y las
 * fechas de sticker de S48 son el caso vivo). Por eso esta pieza está armada
 * para que revisar sea barato y confirmar en bloque sea imposible.
 *
 * ── 🔴 LA CONFIANZA SE VE, Y «MEDIA» TAMBIÉN CUENTA ────────────────────
 * Confianza baja **o media** ⇒ borde de atención y *«Revisá esta»*. *«Media»
 * quiere decir que el modelo dudó, y una duda que no se muestra es una
 * afirmación.* El umbral vive en `pideRevision`, no acá.
 *
 * ── 🔴 CADA FILA PIDE SU TOQUE ─────────────────────────────────────────
 * No hay «confirmar todas». El pie sólo se enciende con todas tocadas, y
 * mientras tanto **dice cuántas faltan** — *un botón apagado sin razón a la
 * vista es el defecto; éste dibuja la suya.*
 *
 * ── 🔴 LO QUE LLEGÓ `null` SE MUESTRA VACÍO, JAMÁS SUGERIDO ────────────
 * Un valor propuesto en un campo que el modelo no leyó es exactamente cómo un
 * dato inventado entra al expediente firmado por el dueño: *él ve algo
 * plausible, no lo toca, y queda como si lo hubiera confirmado.*
 *
 * ── 🔴 UNA FILA SIN NOMBRE ES LA QUE MÁS PIDE MIRARSE ──────────────────
 * Si la IA no pudo leer **cuál** vacuna es, no hay nada que confirmar: *«Es
 * correcta» sobre una fila sin nombre es firmar un renglón en blanco.* Así que
 * la fila llega marcada, con el campo del nombre **vacío y editable**, y el
 * confirmar **apagado hasta que haya nombre** — con su razón a la vista, que
 * es la misma frase que explica por qué el campo está ahí.
 *
 * ⚠️ **Y el pie la cuenta como pendiente**, pase lo que pase: la regla no vive
 * en la pantalla sino en `revisada()`, así que **una fila sin nombre marcada
 * como tocada sigue contando pendiente.** *Si dependiera de que la pantalla se
 * acuerde, el día que se olvide se guarda una vacuna sin nombre y nadie se
 * entera.*
 *
 * ── 🔴 «ESTA NO ES» — LA SALIDA QUE HACE HONESTA A LA REVISIÓN ─────────
 * Editar corrige un dato; **descartar dice que la fila no debería existir**, y
 * son dos actos distintos. Sin la segunda, una revisión que sólo puede
 * confirmar o corregir **obliga a quedarse con lo que la IA se inventó** — y
 * ahí la pantalla deja de ser una revisión para ser un trámite con pasos.
 * *Una fila que la IA propone y que nadie puede rechazar no es una revisión*,
 * y por eso `onDescartar` **es obligatoria**: una casa que la omita no tiene
 * salida, y la omisión no daría ningún error.
 *
 * ── ⚠️ Y DESCARTAR **ES** REVISAR ──────────────────────────────────────
 * La cuenta vive en `resumenDeLaTanda`. *Si una descartada no contara como
 * revisada, el pie quedaría apagado para siempre y sin forma de encenderlo.*
 *
 * ── ⚠️ LO QUE ESTA PIEZA NO DIBUJA ─────────────────────────────────────
 * **Las filas del plan impreso.** En un carnet suele venir la tabla del plan
 * vacunal de la especie, y **esas filas NO son vacunas aplicadas**. Dibujarlas
 * acá las volvería registros con un toque. Si hay que mostrarlas, es otra
 * pieza —*«En el carnet también figuran…»*, en tinta y sin acción—.
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Campo } from './Campo'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { detalleVisible, resumenDeLaTanda, pideRevision, type ConfianzaIA, type FilaDeLaTanda } from './vacunas-estado'

/**
 * QUÉ PRUEBA LA APLICACIÓN — el vocabulario de la v2.1 del extractor.
 *
 * ── 🔴 NO ES UN RENOMBRE: ES OTRA PREGUNTA ─────────────────────────────
 * ☠️ Acá vivía `OrigenLectura = 'sticker' | 'sello' | 'aMano'`, que contestaba
 * **dónde está escrita la fecha**. Esto contesta **qué prueba que la vacuna se
 * aplicó**, y son cosas distintas con respuestas distintas:
 *
 * > Un carnet con el sticker del producto pegado y la fecha escrita a mano al
 * > lado. *¿De dónde salió el dato?* — a mano. *¿Qué prueba la aplicación?* —
 * > el sticker. **La misma fila, dos respuestas opuestas.**
 *
 * Por eso el vocabulario viejo no se podía leer igual dos veces: **dos manos
 * lo clasificaron 4 a 0** sobre las mismas filas. *Un vocabulario que dos
 * lectores cuidadosos contestan distinto no está midiendo el papel: está
 * midiendo quién lo lee.*
 *
 * `manuscrito` es **sin sticker y sin sello**; `impreso`, que no hay nada que
 * lo pruebe — y ése es un dato, no un hueco: *saber que una fila no tiene
 * respaldo vale exactamente igual que saber cuál tiene.*
 */
export type EvidenciaAplicacion = 'sticker' | 'sello' | 'manuscrito' | 'impreso'

export interface CampoLeido {
  etiqueta: string
  /** `null` = **el modelo no lo leyó**. Se dibuja vacío y editable. */
  valor: string | null
}

export interface FilaConfirmacionVacunaProps {
  /** 🔴 `null` = **la IA no pudo leer cuál vacuna es.** No es un texto vacío
   *  que se pueda dibujar: es la fila que más pide mirarse. */
  nombre: string | null
  /** El rótulo del campo del nombre. Sólo se usa cuando hay que pedirlo. */
  etiquetaNombre: string
  /** 🔴 *«No pude leer cuál es; escribila vos»* — **dice la causa Y el acto**.
   *  Va bajo el campo, así que **es también la razón del confirmar apagado**:
   *  el botón no repite el porqué, lo tiene arriba. */
  vozSinNombre: string
  /** Lo que la persona teclea. La pantalla es la que guarda el valor. */
  onNombre?: (v: string) => void
  /** ⚠️ **El foco lo decide la LISTA, no la fila, y por eso el default es
   *  `false`.** Con dos filas sin nombre, `autoFocus` en las dos deja el foco
   *  en **la última** —la que se montó al final— y ahí es peor que no tener
   *  ninguno: la pantalla salta al fondo. *La fila no sabe si es la primera;
   *  la lista sí.* **La lista se lo pasa a la primera sin nombre.** */
  enfocar?: boolean
  campos: readonly CampoLeido[]
  confianza: ConfianzaIA
  /** 🔴 La voz de la evidencia, ya compuesta (Ley 3): *«lo prueba el sticker»*.
   *  **Ausente ⇒ no se dibuja NINGUNA línea** (19.9): *de un carnet donde no
   *  se distingue qué prueba la aplicación no sale una respuesta por defecto —
   *  sale ninguna.*
   *
   *  ⚠️ **El nombre `vozOrigen` es anterior al cambio de pregunta y SE QUEDA,
   *  por decisión y no por olvido.** `EvidenciaAplicacion` habría pedido un
   *  `vozEvidencia`, pero **renombrar una prop viva rompe a su consumidor**, y
   *  esa lección ya se pagó esta sesión: un cambio de contrato mío dejó `main`
   *  en rojo y lo curó otra pista. *La precisión de un nombre no vale un
   *  revert.* El día que la prop se toque por otra razón, viaja con eso.
   *
   *  ☠️ Al lado vivía `origen: OrigenLectura`, **obligatoria y jamás leída
   *  por la pieza**: ni se desestructuraba. *Un prop que el contrato exige y
   *  el dibujo ignora es una promesa* — el que lo pasa cree estar decidiendo
   *  algo. El dato es de la pantalla y ahí se queda; el tipo sigue exportado
   *  porque es el vocabulario de esta revisión. */
  vozOrigen?: string
  /** *«Revisá esta»* — la pantalla pone su i18n. */
  vozRevisar: string
  /** *«Es correcta»*. */
  vozConfirmar: string
  /** *«Esta no es»*. */
  vozDescartar: string
  /** Ya tocada por la persona. */
  tocada: boolean
  /** La persona dijo que esta vacuna no existe. */
  descartada?: boolean
  /** La línea que lo dice mientras está descartada: *«No se va a guardar»*.
   *  Sin ella la fila se apaga y no explica por qué. */
  vozDescartada?: string
  /** El camino de vuelta. **Si la pantalla saca la fila de la lista al
   *  descartarla, no hace falta** — pero si la deja a la vista, tiene que
   *  poder deshacerse: *un toque de más en una revisión no puede costar una
   *  vacuna del carnet.* */
  onDeshacer?: () => void
  vozDeshacer?: string
  onConfirmar: () => void
  onEditar: () => void
  onDescartar: () => void
}

export function FilaConfirmacionVacuna({
  nombre,
  etiquetaNombre,
  vozSinNombre,
  onNombre,
  enfocar = false,
  campos,
  confianza,
  vozOrigen,
  vozRevisar,
  vozConfirmar,
  vozDescartar,
  tocada,
  descartada = false,
  vozDescartada,
  onDeshacer,
  vozDeshacer,
  onConfirmar,
  onEditar,
  onDescartar,
}: FilaConfirmacionVacunaProps) {
  const { theme } = useTheme()
  /* 🔴 **SE FIJA AL MONTAR, y no se recalcula.** *Si mirara el valor de ahora,
     el campo desaparecería con la primera letra que la persona teclea* — y una
     fila que la IA no pudo leer no deja de serlo a mitad de la palabra: sigue
     siendo la fila que hay que mirar hasta que se guarde la tanda. */
  const hayNombre = (nombre ?? '').trim() !== ''
  const [pedirNombre] = useState(!hayNombre)
  /* Sin nombre no hay confianza que valga: **la duda es la fila entera.** */
  const revisar = pideRevision(confianza) || pedirNombre
  const conValor = detalleVisible(campos)
  const vacios = campos.filter((c) => c.valor == null || c.valor.trim() === '')

  /* 🔴 DESCARTADA: se apaga y **dice por qué**, con su camino de vuelta si la
     pantalla lo ofrece. No se dibujan ni los campos vacíos ni el confirmar —
     *ofrecer «Es correcta» sobre algo que la persona acaba de rechazar es
     pedirle que se contradiga.* Queda a la vista y no desaparece: **una fila
     que se esfuma no deja ver que el toque hizo algo.** */
  if (descartada) {
    return (
      <View
        style={{
          borderRadius: radius.md,
          padding: spacing[4],
          gap: spacing[2],
          backgroundColor: theme.bg.hundido,
        }}
      >
        {/* 🔴 Descartada SIN nombre: la tarjeta diría nada y la persona no
            sabría cuál descartó. **Dice la causa en su lugar** — que además
            es la identidad exacta de esa fila: la que no se pudo leer. */}
        <Texto variante="cuerpo" color="secondary" numberOfLines={1}>
          {hayNombre ? nombre : vozSinNombre}
        </Texto>
        {vozDescartada !== undefined ? <Texto variante="apoyo">{vozDescartada}</Texto> : null}
        {onDeshacer !== undefined && vozDeshacer !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={vozDeshacer}
            onPress={onDeshacer}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            {/* La única línea viva de una tarjeta apagada: en tinta plena
                contra un nombre en secundaria, es lo que se lee primero. */}
            <Texto variante="enfasis">{vozDeshacer}</Texto>
          </Pressable>
        ) : null}
      </View>
    )
  }

  return (
    <View
      style={{
        borderRadius: radius.md,
        padding: spacing[4],
        gap: spacing[3],
        backgroundColor: theme.bg.card,
        /* El borde de atención, **sólo cuando el modelo dudó.** */
        borderWidth: revisar ? 1.5 : 0,
        borderColor: revisar ? theme.status.warningText : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] }}>
        {/* 🔴 Sin nombre no se dibuja un hueco ni un «sin nombre»: se dibuja
            EL CAMPO, que es lo único que resuelve la fila. La cabecera queda
            con la marca sola, para que «Revisá esta» no pierda su lugar. */}
        {pedirNombre ? <View style={{ flex: 1 }} /> : <Texto variante="cuerpo">{nombre}</Texto>}
        {revisar ? <Texto variante="apoyo" color="warning">{vozRevisar}</Texto> : null}
      </View>

      {pedirNombre ? (
        <Campo
          label={etiquetaNombre}
          value={nombre ?? ''}
          onChangeText={onNombre}
          /* La causa Y el acto en la misma frase, y es también la razón que
             sostiene el confirmar apagado de abajo. */
          ayuda={vozSinNombre}
          autoFocus={enfocar}
        />
      ) : null}

      {/* Lo que el modelo SÍ leyó. */}
      {conValor.map((c) => (
        <View key={c.etiqueta} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
          <Texto variante="apoyo">{c.etiqueta}</Texto>
          <Texto variante="dato">{c.valor}</Texto>
        </View>
      ))}

      {/* 🔴 Lo que NO leyó: **vacío y editable, jamás con un valor puesto.** */}
      {vacios.map((c) => (
        <Pressable
          key={c.etiqueta}
          accessibilityRole="button"
          accessibilityLabel={c.etiqueta}
          onPress={onEditar}
          style={{
            minHeight: 44,
            justifyContent: 'center',
            paddingHorizontal: spacing[3],
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: theme.bg.border,
          }}
        >
          <Texto variante="apoyo">{c.etiqueta}</Texto>
        </Pressable>
      ))}

      {/* De dónde salió: un sello no vale lo mismo que un número a mano.
          🔴 **Sin procedencia no hay línea** — ninguna por defecto (19.9). */}
      {vozOrigen !== undefined ? <Texto variante="apoyo">{vozOrigen}</Texto> : null}

      {/* 🔴 **APAGADO HASTA QUE HAYA NOMBRE.** *«Es correcta» sobre una fila
          sin nombre es firmar un renglón en blanco.* Su razón no se repite
          acá: está arriba, bajo el campo que la pide — *el botón dice qué
          hace, y lo que falta lo dice el campo que falta.* */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={vozConfirmar}
        accessibilityState={{ selected: tocada, disabled: pedirNombre && !hayNombre }}
        disabled={pedirNombre && !hayNombre}
        onPress={onConfirmar}
        style={{
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          backgroundColor: pedirNombre && !hayNombre ? theme.bg.hundido : tocada ? theme.bg.hundido : theme.accent.cta,
        }}
      >
        <Texto variante="enfasis" color={pedirNombre && !hayNombre ? 'tertiary' : tocada ? 'secondary' : undefined}>
          {vozConfirmar}
        </Texto>
      </Pressable>

      {/* 🔴 «Esta no es»: **label, sin caja** (19.7 — un sólido por superficie,
          y acá el sólido es confirmar). *No va en rojo de peligro: no destruye
          nada guardado, saca de la lista algo que todavía no es verdad — y
          teñirla de alarma haría que la persona confirme por no asustarse,
          que es justo lo contrario de revisar.* */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={vozDescartar}
        onPress={onDescartar}
        style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Texto variante="apoyo">{vozDescartar}</Texto>
      </Pressable>
    </View>
  )
}

export interface PieConfirmacionVacunasProps {
  /** 🔴 **EL ESTADO DE CADA FILA, no un arreglo de booleanos.**
   *
   *  ⏪ Recibía `tocadas: readonly boolean[]`, y con el descarte ese arreglo
   *  dejó de alcanzar: **una tanda entera descartada daba «cero por revisar»
   *  y encendía el botón para guardar NADA.** *No es un apagado sin razón: es
   *  un encendido que no hace nada, que es peor* — la persona toca «Guardar 5
   *  vacunas» y no se guarda ninguna.
   *
   *  La cura no fue sumar un número al lado —uno que viaja aparte se puede
   *  pasar mal—: **fue que el pie derive sus dos cuentas del mismo dato**, y
   *  ahí el estado equivocado no se puede expresar. */
  filas: readonly FilaDeLaTanda[]
  /** *«Guardar 5 vacunas»* — la pantalla la compone, **con el número que el
   *  pie le pasa** y no con uno propio (mismo trato que `vozFaltan`).
   *  🔴 *Si la pantalla contara por su lado, una tanda con tres descartadas
   *  diría «Guardar 5» sobre un botón que guarda 2 — y el número de un botón
   *  es una promesa.* Acá no hay dos cuentas que puedan discrepar. */
  vozGuardar: (n: number) => string
  /** 🔴 **LA RAZÓN DEL APAGADO, ya compuesta con su número**: *«faltan 2 por
   *  revisar»*. La pieza le pasa el número; la pantalla arma la frase. */
  vozFaltan: (n: number) => string
  /** La otra razón, la que nació con el descarte: *«no queda ninguna para
   *  guardar»*. **Sin ella, una tanda toda descartada apagaría el botón en
   *  silencio** — el mismo defecto por la puerta de al lado.
   *  ⚠️ Dice *«no queda»*, o sea que **hubo**: con la tanda vacía el pie no se
   *  dibuja y esta voz no se usa. */
  vozNinguna: string
  onGuardar: () => void
}

/** El pie de la tanda. **Se enciende sólo con todas revisadas y al menos una
 *  que guardar, y apagado DICE cuál de las dos razones lo apaga** — *un botón
 *  apagado sin razón a la vista es el defecto.* */
export function PieConfirmacionVacunas({ filas, vozGuardar, vozFaltan, vozNinguna, onGuardar }: PieConfirmacionVacunasProps) {
  const { theme } = useTheme()
  const { faltan, aGuardar, listo } = resumenDeLaTanda(filas)

  /* 🔴 **TANDA VACÍA ⇒ EL PIE NO SE DIBUJA**, y no es lo mismo que la tanda
     toda descartada.
     ⏪ Antes decía *«faltan 0 por revisar»* —una razón imposible de resolver—
     y con la primera cura pasó a decir *«no queda ninguna para guardar»*, que
     **es cierto sólo si hubo alguna**: con cero filas nunca hubo nada, y esa
     frase le hace creer a la persona que descartó algo.
     *Un pie que gobierna una tanda que no existe es un control sobre el
     vacío* (19.9, y el mismo criterio que `D-1025`). **Que la foto no haya
     traído vacunas es historia de la PANTALLA** —ahí va su estado vacío, con
     el camino para volver a intentar—, no de un botón apagado. */
  if (filas.length === 0) return null

  return (
    <View style={{ gap: spacing[2] }}>
      {/* La razón va ARRIBA del botón y no adentro: el botón dice qué hace,
          la línea dice por qué todavía no. **Y las dos razones son distintas:
          «faltan 2» se resuelve tocando; «no queda ninguna» no se resuelve
          tocando, y decir la primera cuando pasa la segunda manda a la
          persona a buscar una fila que ya revisó.** */}
      {listo ? null : <Texto variante="apoyo">{faltan > 0 ? vozFaltan(faltan) : vozNinguna}</Texto>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={vozGuardar(aGuardar)}
        accessibilityState={{ disabled: !listo }}
        disabled={!listo}
        onPress={onGuardar}
        style={{
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          backgroundColor: listo ? theme.accent.cta : theme.bg.hundido,
        }}
      >
        <Texto variante="enfasis" color={listo ? undefined : 'tertiary'}>
          {vozGuardar(aGuardar)}
        </Texto>
      </Pressable>
    </View>
  )
}
