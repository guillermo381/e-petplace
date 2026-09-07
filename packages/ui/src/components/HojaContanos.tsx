/**
 * HOJA «CONTANOS» — la puerta del Bio-expediente familiar (S113-B · 2.1 · B1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **UNA SOLA HOJA, CUATRO ACCESOS.** Por eso es Hoja y no tarjeta.
 * ═══════════════════════════════════════════════════════════════════════════
 * ⏪ **Acá vivía `InvitacionBio`, que era tarjeta Y Hoja en la misma pieza.**
 * Se parte porque el encargo la abre desde cuatro lugares —el pie de la ficha
 * de raza, la pastilla del perfil, un chip en la Hoja de Nexo y las celdas
 * vacías de HOY— y *una pieza que trae su propio botón obliga a cada acceso a
 * montar el botón entero o a clonar la Hoja.* Hoy el acceso es
 * `BotonContanos` (o cualquier otro) y la Hoja es ésta: **un solo `visible`,
 * un solo contenido, cuatro puertas.**
 *
 * ── 🔴 LA CAJA LIBRE VA ARRIBA DE LAS CUATRO ────────────────────────────
 * *Las cuatro entradas son para quien ya sabe qué quiere contar; la caja es
 * para quien tiene algo en la cabeza y no sabe en cuál va* — y ésa es la
 * mayoría. Abajo se leería como «lo que sobra».
 *
 * ── 🔴 LA PROPUESTA DE NEXO LLEGA, NO SE ADIVINA ────────────────────────
 * La pieza entrega el texto y **no lo clasifica**: la clase la propone Nexo y
 * vuelve por `propuesta`. *Si la pieza adivinara la clase estaría diciendo que
 * ya sabe, y el sí de la familia dejaría de ser una decisión.* Y la propuesta
 * **exige sus dos salidas**: si sólo se pudiera aceptar, la única forma de
 * sacarla de la pantalla sería darle la razón.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3)** · **no sabe el nombre de la mascota** (el título
 * llega hecho) · **no navega**: llama y la pantalla decide.
 * **Y ninguna voz se trunca:** no hay un solo `numberOfLines` — *las líneas de
 * las entradas explican de qué se trata cada una, y una explicación cortada no
 * explica.*
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * *Pedirle a una familia que despidió a su mascota que cuente «lo que hizo
 * hoy» es la razón exacta por la que `MODELO_LOYALTY` §7.1 apaga el motor
 * entero en M6.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El perfil, la ficha de raza, la Hoja de Nexo y el HOY (C). **Entregada y no
 * montada** — medido: `git grep HojaContanos -- apps/` da cero.
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Boton } from './Boton'
import { Campo } from './Campo'
import { Hoja } from './Hoja'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { Chevron } from './chevron'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * Las cuatro cosas que una familia puede contar. **Cerrado a propósito:** una
 * quinta sin glifo ni lugar no compila, en vez de caer a un «otros» que nadie
 * sabría dónde guardar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ES EL VOCABULARIO DEL MOTOR, MIEMBRO POR MIEMBRO.**
 * ═══════════════════════════════════════════════════════════════════════════
 * `'rasgo'` y no `'personalidad'`: así lo llaman `clasificarHecho` y
 * `guardarHechoClasificado`. **Idéntico al `ClaseDeHecho` del contrato** ⇒ un
 * valor que viene del motor entra acá **sin un solo cast**, que es la
 * condición del encargo.
 *
 * ⚠️ **Y NO SE IMPORTA DE `@epetplace/api`, con su razón medida:** `packages/ui`
 * **no depende** de `packages/api` (verificado en su `package.json`), y hacerlo
 * invertiría la dirección de la casa — *el design system pasaría a depender de
 * la capa de datos, y una pieza de dibujo arrastraría los tipos generados de la
 * base.* Eso es una decisión de arquitectura y no la tomo yo de costado.
 *
 * ⇒ **La igualdad se sostiene con un GATE, no con disciplina:** su arnés lee
 * los dos archivos y compara los miembros; si alguno agrega o renombra uno,
 * sale rojo. *Dos listas que tienen que ser iguales y nadie compara son dos
 * listas que van a divergir.*
 *
 * ⚠️ **La VOZ no cambia:** en pantalla sigue diciendo «Rasgos de
 * personalidad» — la trae la pantalla (Ley 3). *El motor y la familia no
 * tienen por qué llamar a las cosas igual.*
 */
export type ClaseContanos = 'comportamiento' | 'rasgo' | 'medico' | 'recuerdo'

/** 🔴 **El glifo por clase lo decide la PIEZA** (Ley 12): si entrara por prop,
 *  dos pantallas podrían darle a «Comportamiento» dos íconos y la misma
 *  entrada se leería como dos cosas. Exhaustivo: una clase nueva sin glifo no
 *  compila. */
/* ⚠️ La CLASE se llama `rasgo` (vocabulario del motor) y el GLIFO se llama
   `personalidad` (nombre del registry). **Son dos namespaces distintos y no se
   tocan**: renombrar el glifo para que «haga juego» rompería a sus otros
   consumidores por una coincidencia de lectura. */
const GLIFO = {
  comportamiento: 'training',
  rasgo: 'personalidad',
  medico: 'caso',
  recuerdo: 'bitacora',
} satisfies Record<ClaseContanos, IconoNombre>

const GLIFO_TAMANO = 24

export interface EntradaContanos {
  clase: ClaseContanos
  /** *«Comportamiento»* — ya redactado. */
  titulo: string
  /** *«miedos, manías, cómo se lleva con otros»* — ya redactada. */
  detalle: string
  /** 🔴 **Obligatorio:** una entrada sin destino no es una entrada. */
  onPress: () => void
}

/**
 * 🔴 **LO QUE NEXO PROPONE, con sus DOS salidas.** Llega después de enviar la
 * caja libre. *Nunca se guarda solo* — el sí es de la familia.
 */
export interface PropuestaContanos {
  /** *«¿Lo guardo como rasgo de personalidad?»* — ya compuesta. */
  voz: string
  vozSi: string
  vozNo: string
  onGuardar: () => void
  onDescartar: () => void
}

export interface HojaContanosProps {
  visible: boolean
  onCerrar: () => void
  /** *«Contanos lo que hace único a Thor»* — con el nombre adentro. */
  titulo: string
  entradas: readonly EntradaContanos[]
  /** La caja libre. **Sin ella la Hoja sigue siendo válida** (cuatro entradas
   *  y nada más), pero se pierde la puerta de quien no sabe en cuál va. */
  libre?: {
    /** *«O contanos lo que quieras de Thor»* */
    etiqueta: string
    placeholder: string
    /** *«Contame»* */
    vozEnviar: string
    /** Se llama con el texto **saneado**: el recorte vive acá y no en cada
     *  pantalla — *si cada consumidor decidiera qué es «vacío», bastaría uno
     *  que no recorte para mandar un hecho de espacios.* */
    onLibre: (texto: string) => void
  }
  /** Lo que Nexo propone con lo que acaban de escribir. Mientras está, **la
   *  caja no se dibuja**: *pedir otra cosa antes de contestar la primera es
   *  perder las dos.* */
  propuesta?: PropuestaContanos
}

export function HojaContanos({
  visible,
  onCerrar,
  titulo,
  entradas,
  libre,
  propuesta,
}: HojaContanosProps) {
  const { theme } = useTheme()
  const [suelto, setSuelto] = useState('')

  /* ⛔ El Coach no existe en memorial, y esto es su puerta. */
  if (theme.mode === 'memorial') return null

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={titulo}>
      <View style={{ gap: spacing[5] }}>
        {/* 🔴 La propuesta REEMPLAZA a la caja mientras espera respuesta. */}
        {propuesta !== undefined ? (
          <View style={{ gap: spacing[3] }}>
            <Texto>{propuesta.voz}</Texto>
            {/* Las dos al mismo nivel: decir que no cuesta lo mismo que sí. */}
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <Boton tamaño="sm" etiqueta={propuesta.vozSi} onPress={propuesta.onGuardar} />
              <Boton
                variante="secundario"
                tamaño="sm"
                etiqueta={propuesta.vozNo}
                onPress={propuesta.onDescartar}
              />
            </View>
          </View>
        ) : libre !== undefined ? (
          <View style={{ gap: spacing[3] }}>
            <Campo
              label={libre.etiqueta}
              placeholder={libre.placeholder}
              value={suelto}
              onChangeText={setSuelto}
              multilinea={3}
            />
            {/* El acto aparece con la primera letra y no antes: *un botón
                apagado debajo de un campo vacío le explica a alguien lo que
                acaba de hacer* — misma doctrina que `BarraEscribir`. */}
            {suelto.trim().length > 0 ? (
              <View style={{ alignItems: 'flex-start' }}>
                <Boton
                  tamaño="sm"
                  etiqueta={libre.vozEnviar}
                  onPress={() => {
                    const limpio = suelto.trim()
                    if (limpio.length === 0) return
                    setSuelto('')
                    libre.onLibre(limpio)
                  }}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ gap: spacing[1] }}>
          {entradas.map((e) => (
            <FilaContanos
              key={e.clase}
              titulo={e.titulo}
              detalle={e.detalle}
              glifo={GLIFO[e.clase]}
              onPress={() => {
                /* Se cierra ANTES de llamar: la Hoja es el camino a otra
                   pantalla, y dejarla abierta encima del destino obliga a
                   cerrarla para ver a dónde se llegó. */
                onCerrar()
                e.onPress()
              }}
            />
          ))}
        </View>
      </View>
    </Hoja>
  )
}

/* Una entrada. Aparte para que el estrechamiento del glifo no dependa del
   `map`, y para que la fila tenga un solo lugar donde cambiar. */
function FilaContanos({
  titulo,
  detalle,
  glifo,
  onPress,
}: {
  titulo: string
  detalle: string
  glifo: IconoNombre
  onPress: () => void
}) {
  const { theme } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      /* El label junta las dos: quien no ve la pantalla necesita saber qué se
         guarda ahí, no sólo cómo se llama. */
      accessibilityLabel={`${titulo} · ${detalle}`}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] }}
    >
      {/* 🔴 `montaje="control"` VA SIEMPRE Y NO ES PROP DE NADIE: sin él, tres
          de los cuatro glifos dibujan su huella y el de personalidad no —es de
          control y no tiene—, y *tres filas con huella y una sin ella se leen
          como que la cuarta es de otra clase.* Lo midió el emulador. */}
      <Icono nombre={glifo} tamano={GLIFO_TAMANO} registro="capa" montaje="control" />
      <View style={{ flex: 1, gap: spacing[0.5] }}>
        <Texto>{titulo}</Texto>
        <Texto variante="apoyo">{detalle}</Texto>
      </View>
      <Chevron color={theme.text.tertiary} direccion="derecha" />
    </Pressable>
  )
}
