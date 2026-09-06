/**
 * INVITACIÓN AL BIO-EXPEDIENTE — «¿Querés contarnos qué lo hace único?»
 * (S113-B · 1.2.2).
 *
 * Una tarjeta que invita, y una Hoja con las cuatro cosas que se pueden
 * contar. Vive **al cierre de `FichaRaza`** (por su slot `cierre`) **y también
 * sola**, en el perfil, cuando esa mascota no tiene ficha de raza: *la
 * invitación no depende de que exista una raza publicada — quien más tiene
 * para contar es justamente el dueño del mestizo del que no sabemos nada.*
 *
 * ── 🔴 EL TEXTO NO SE TRUNCA, Y POR ESO NO HAY `numberOfLines` ──────────
 * *«Thor está en su etapa adulta. Contanos lo que lo hace único: cuanto mejor
 * lo conozcamos, mejor lo acompañamos.»* — **son dos frases y la segunda es la
 * que invita.** Truncar deja la primera, que es un dato, y se come la razón
 * por la que valdría la pena contestar. Su caja crece; la que se adapta es la
 * tarjeta.
 *
 * ⚠️ La prop se llama `texto` y no `pregunta`: *el dictado no es una pregunta,
 * y un nombre que promete un signo de interrogación manda al próximo a
 * escribir uno.*
 *
 * ── 🔴 UNA ENTRADA SIN DESTINO NO SE DIBUJA ─────────────────────────────
 * Las cuatro entran por prop **con su `onPress` obligatorio**, y la pantalla
 * decide cuáles pasa. *Ofrecer «Temas médicos» y que no lleve a ningún lado
 * enseña a desconfiar de las otras tres.* No hay estado apagado: o está con su
 * destino, o no está.
 *
 * ── EL GLIFO LO DECIDE LA PIEZA (Ley 12) ────────────────────────────────
 * Si entrara por prop, dos pantallas podrían darle a «Comportamiento» dos
 * íconos distintos y la misma entrada se leería como dos cosas. La tabla es
 * **exhaustiva por clase**: una clase nueva sin glifo no compila.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3):** el título, la línea de cada entrada y la
 * pregunta de la tarjeta llegan redactados. **No sabe el nombre de la
 * mascota.** **No navega:** llama y la pantalla decide.
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * *Pedirle a una familia que acaba de despedirse que cuente «lo que hizo hoy»
 * es la razón exacta por la que `MODELO_LOYALTY` §7.1 apaga el motor entero
 * en M6.* El guard vive acá y no en la pantalla: si cada consumidor tuviera
 * que acordarse, alcanza con uno que se olvide.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El cierre de `FichaRaza` y el perfil de la mascota (C). **Entregada y no
 * montada.**
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Hoja } from './Hoja'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { Chevron } from './chevron'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** Las cuatro cosas que una familia puede contar de su mascota. **Cerrado a
 *  propósito:** una quinta sin glifo ni lugar no compila, en vez de caer a un
 *  «otros» que nadie sabría dónde guardar. */
export type ClaseInvitacion = 'comportamiento' | 'personalidad' | 'medico' | 'recuerdo'

/**
 * 🔴 **El glifo por clase, decidido acá.** Ver la cabecera.
 *
 * 🔴 **`personalidad` VA SIN GLIFO, Y NO ES UN OLVIDO.** Las otras tres lo
 * tienen propio —el adiestramiento ES el comportamiento, el caso clínico ES lo
 * médico, la bitácora ES «lo que hizo hoy»—; **para «cómo es» el registry no
 * tiene ninguno**, y lo midió el compilador: `huella`, que era mi candidato,
 * ni siquiera es un glifo (es la primitiva de marca).
 *
 * Prestar un vecino es lo que la casa prohíbe expresamente —*«un glifo con dos
 * significados es informar sin informar»*— y el más cercano del registry es el
 * ojo de mostrar/ocultar contraseña: *usarlo acá sería enseñar que ese ojo
 * significa dos cosas.*
 *
 * ⇒ La fila **reserva el ancho del glifo igual**, para que las cuatro queden
 * alineadas: *una lista donde tres tienen ícono y una arranca corrida se lee
 * como que a esa le falta algo, y lo que le falta es al registry.* Queda como
 * pedido de **§6b** (hoja de contacto, dos o tres variantes, gate POR ÍCONO).
 */
const GLIFO = {
  comportamiento: 'training',
  personalidad: null,
  medico: 'caso',
  recuerdo: 'bitacora',
} satisfies Record<ClaseInvitacion, IconoNombre | null>

/** El ancho que reserva la fila sin glifo. **Derivado del tamaño del ícono**,
 *  no tecleado: el día que el ícono cambie de talla, el hueco la sigue. */
const GLIFO_TAMANO = 24

export interface EntradaInvitacion {
  clase: ClaseInvitacion
  /** *«Comportamiento»* — ya redactado. */
  titulo: string
  /** *«miedos, manías, cómo se lleva con otros»* — una línea, ya redactada. */
  detalle: string
  /** 🔴 **Obligatorio.** Ver la cabecera: sin destino, la entrada no existe. */
  onPress: () => void
}

export interface InvitacionBioProps {
  /** *«Thor está en su etapa adulta. Contanos lo que lo hace único: cuanto
   *  mejor lo conozcamos, mejor lo acompañamos.»* — ya compuesto con el nombre
   *  y la etapa (Ley 3). **Se dibuja entero**, sin truncar. */
  texto: string
  /** Título de la Hoja: *«Contanos de Thor»*, ya compuesto. */
  tituloHoja: string
  /** Las que la pantalla tenga con destino. **Vacío ⇒ la tarjeta no se
   *  dibuja**: una invitación que abre una Hoja sin nada adentro es peor que
   *  no invitar. */
  entradas: readonly EntradaInvitacion[]
}

/* El glifo de una entrada, o su hueco. Componente aparte porque el
   estrechamiento de `GLIFO[clase]` no sobrevive dentro del JSX de un `map`:
   TypeScript no puede saber que el mismo índice da el mismo valor dos veces. */
function GlifoDeEntrada({ clase }: { clase: ClaseInvitacion }) {
  const g = GLIFO[clase]
  if (g === null) return <View style={{ width: GLIFO_TAMANO, height: GLIFO_TAMANO }} />
  return <Icono nombre={g} tamano={GLIFO_TAMANO} registro="capa" />
}

export function InvitacionBio({ texto, tituloHoja, entradas }: InvitacionBioProps) {
  const { theme } = useTheme()
  const [abierta, setAbierta] = useState(false)

  /* ⛔ En memorial no se invita a contar nada. Ver la cabecera.
     ⚠️ Va DESPUÉS del hook: salir antes cambiaría el orden entre renders. */
  if (theme.mode === 'memorial') return null
  if (entradas.length === 0) return null

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={texto}
        onPress={() => setAbierta(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          padding: spacing[4],
          borderRadius: radius.lg,
          backgroundColor: theme.bg.card,
          /* El borde es la afordancia. Sobre papel claro `bg.card` es blanco
             contra un fondo casi blanco: sin él la tarjeta se hunde y deja de
             leerse como algo que se toca — medido en el emulador con el chip
             del vacío de la búsqueda, que tenía el mismo defecto. */
          borderWidth: theme.border.width,
          borderColor: theme.border.subtle,
        }}
      >
        {/* 🔴 SIN `numberOfLines`. Ver la cabecera: son dos frases y la que
            invita es la segunda. El
            `flex: 1` la deja crecer hacia abajo en vez de empujar al chevron
            fuera de la tarjeta. */}
        <View style={{ flex: 1 }}>
          <Texto>{texto}</Texto>
        </View>
        <Chevron color={theme.text.tertiary} direccion="derecha" />
      </Pressable>

      <Hoja visible={abierta} onCerrar={() => setAbierta(false)} titulo={tituloHoja}>
        <View style={{ gap: spacing[1] }}>
          {entradas.map((e) => (
            <Pressable
              key={e.clase}
              accessibilityRole="button"
              /* El label junta título y línea: quien no ve la pantalla
                 necesita saber qué se guarda ahí, no sólo cómo se llama. */
              accessibilityLabel={`${e.titulo} · ${e.detalle}`}
              onPress={() => {
                /* Se cierra ANTES de llamar: la Hoja es el camino a otra
                   pantalla, y dejarla abierta encima del destino obliga a
                   cerrarla para ver a dónde se llegó. */
                setAbierta(false)
                e.onPress()
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[3],
                paddingVertical: spacing[3],
              }}
            >
              {/* 🔴 El hueco alineado cuando no hay glifo. Ver la cabecera. */}
              <GlifoDeEntrada clase={e.clase} />
              <View style={{ flex: 1, gap: spacing[0.5] }}>
                <Texto>{e.titulo}</Texto>
                <Texto variante="apoyo">{e.detalle}</Texto>
              </View>
              <Chevron color={theme.text.tertiary} direccion="derecha" />
            </Pressable>
          ))}
        </View>
      </Hoja>
    </>
  )
}
