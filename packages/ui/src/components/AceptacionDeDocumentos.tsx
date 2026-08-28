/**
 * AceptacionDeDocumentos — LEER Y ACEPTAR, con la lista como DATO (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NO ES UNA PIEZA NUEVA POR DOCUMENTO. ES LA MISMA PIEZA CON OTRA LISTA.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── EL CENSO QUE ORDENÓ ESTA PIEZA (protocolo 1c, pregunta 2) ────────────
 * **La casa YA tiene la forma**, y se midió antes de escribir una línea:
 * `apps/prestador/src/components/aceptacion-terminos.tsx` (S104-C, firma
 * founder) resuelve exactamente esto —N casillas **obligatorias** con enlace
 * al documento inmutable, y debajo, **visualmente separada**, una **opcional**
 * que *«arranca SIN marcar: es opt-in, y el «no» es un valor legítimo»*—.
 *
 * ⇒ **La forma no se reinventa: se toma entera.** Lo único que se cambia es lo
 * que la volvía irreusable: **sus documentos estaban cableados** al par del
 * prestador (`documentosVigentes('acceso_prestador')`). Acá **la lista entra
 * por prop**, que es lo que la convierte en la pieza de la casa en vez de la
 * pieza de un oficio.
 *
 * ── ⚠️ DEUDA DECLARADA, PARA QUE NO SE VUELVA CÓDIGO MUERTO INVISIBLE ────
 * **`D-645` rige sobre esta pieza: *una promoción NO es una migración*.**
 * Mientras `aceptacion-terminos.tsx` siga vivo en `apps/prestador`, hay **dos
 * implementaciones de la misma forma**, y la vieja no la señala nada. *Cuatro
 * cobros en un día, los cuatro cazados por el founder mirando y ninguno por un
 * guard.*
 *
 * 🔴 **La migración NO se hizo acá y no es un olvido: `apps/` no es territorio
 * de esta pista** (76(h) — B construye en `packages/ui`). Queda declarada como
 * trabajo con dueño: el consumidor del prestador pasa a montar esta pieza
 * pasándole su par de documentos, y **la local muere en el mismo acto**
 * (Ley 37). *Se declara en el código y en el parte, no en un comentario que
 * nadie lee: la deuda que no se nombra la re-descubre la próxima pista.*
 *
 * ── LAS DOS FAMILIAS, y por qué la separación es estructural ─────────────
 * · **`documentos`** — OBLIGATORIOS. La pantalla gatea su botón con todos
 *   marcados.
 * · **`opcionales`** — 🔴 **JAMÁS pre-marcados.** Es donde vive la casilla de
 *   redes, y la razón por la que no puede nacer marcada no es de diseño: **una
 *   aceptación pre-marcada no es una aceptación** — no hay acto, y sin acto no
 *   hay prueba (P23). *Marcar por el usuario y llamarlo consentimiento es
 *   exactamente el patrón que la ley de datos prohíbe.*
 *
 * La separación es `Separador` + orden, calcado del precedente: *«debajo,
 * VISUALMENTE SEPARADA y marcada OPCIONAL»*. **Un opcional mezclado entre
 * obligatorios se marca por inercia**, que es la forma barata de fabricar un
 * consentimiento que nadie dio.
 *
 * ── 🔴 ESTA PIEZA NO VALIDA NI REGISTRA ──────────────────────────────────
 * Precedente literal de `Casilla`: *«lo OBLIGATORIO / OPCIONAL lo decide la
 * PANTALLA: este control no valida»*. Acá **reporta el estado de cada casilla
 * y nada más**: la pantalla gatea el botón, y el registro con versión y URL lo
 * hace el motor (P23). *Una pieza de presentación que registrara un
 * consentimiento sería un motor escondido adentro de un formulario.*
 *
 * ⚠️ **Y las URLs no las inventa:** llegan resueltas por quien las tiene
 * (L-166 — el dato vivo se lee de su fuente al usarlo; la pantalla las saca de
 * la API sancionada, jamás de una constante).
 *
 * ── EL ENLACE ABRE SIN MARCAR, y es el detalle que importa ───────────────
 * El enlace vive **dentro** del label con su propio `onPress` — el responder
 * más interno—, así que **abrir el documento no marca la casilla**. *Si
 * abrirlo marcara, la prueba diría que alguien aceptó cuando lo único que hizo
 * fue ir a leer.* Los documentos quedan alcanzables **antes** del acto, que es
 * lo que el T&C §4.2 exige al pie de la letra.
 *
 * ── ESCALERA (§4b) · DOSIS · MOVIMIENTO ──────────────────────────────────
 * No muestra datos del expediente. `registro` modula el acento por app
 * ('control' cliente · 'oficio' prestador) — la dosis modula color, jamás
 * gramática. Sin animación (Ley 6).
 */

import { Text, View } from 'react-native'

import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { Casilla } from './Casilla'
import { Separador } from './Separador'
import { Texto } from './Texto'

export type DocumentoAceptable = {
  /** Identidad estable — con ella la pantalla registra. Jamás se muestra. */
  clave: string
  /** El texto de la aceptación, en voz de la app. */
  texto: string
  /**
   * La palabra que abre el documento («Términos y Condiciones»). Va inline
   * dentro del texto, al final. Ausente = la casilla no ofrece enlace.
   */
  etiquetaEnlace?: string
  /**
   * Abre el documento. **No marca la casilla** — ver el encabezado.
   * Ausente = no hay enlace (aunque venga `etiquetaEnlace`).
   */
  onAbrir?: () => void
  /**
   * 🔴 **LA FRASE ENTERA PARA EL LECTOR DE PANTALLA** (S107, pedido de C sobre
   * una degradación REAL que su migración destapó).
   *
   * **El defecto:** `texto` y `etiquetaEnlace` son DOS mitades de una sola
   * frase — *«Acepto los»* + *«Términos y Condiciones»*—, porque el enlace
   * tiene que ser un nodo aparte para poder abrirse sin marcar la casilla.
   * Pasarle a `Casilla` sólo `texto` hacía que el lector anunciara
   * **«Acepto los»** y se detuviera. *En una casilla de consentimiento legal
   * eso no es una molestia de a11y: es una aceptación cuyo enunciado el
   * usuario nunca oyó completo* (P23 — la casilla existe para ser prueba).
   *
   * ⚠️ **Y el default se curó ADEMÁS de abrir esta prop**, que es la mitad que
   * importa: sin `etiquetaAccesible`, la pieza ahora compone
   * `texto + etiquetaEnlace` — o sea que **el caso roto dejó de ser el
   * default**. *Una prop opcional que hay que acordarse de llenar deja el
   * defecto vivo para quien no se acuerde; lo que lo cierra es que el camino
   * de menor esfuerzo ya sea el correcto.*
   *
   * ⇒ Esta prop queda para cuando la composición **no lee bien** (una frase
   * que no es la concatenación de sus dos mitades), no para arreglar el caso
   * normal.
   */
  etiquetaAccesible?: string
}

export type AceptacionDeDocumentosProps = {
  /** Los OBLIGATORIOS. La pantalla gatea su botón con todos marcados. */
  documentos: DocumentoAceptable[]
  /**
   * Los OPCIONALES, separados abajo. 🔴 **Jamás nacen marcados** — el estado
   * lo trae `marcadas`, y el arranque correcto es sin ninguno.
   */
  opcionales?: DocumentoAceptable[]
  /**
   * Qué está marcado, por `clave`. **Sin default**: el consumidor declara el
   * arranque, y el arranque de una aceptación es vacío.
   */
  marcadas: string[]
  onCambiar: (clave: string, marcada: boolean) => void
  /**
   * Rótulo que anuncia que lo de abajo es opcional, en voz de la app.
   * Ausente con `opcionales` presentes = se dibuja igual, pero **sin decir que
   * son opcionales**, que es peor que no tenerlos: por eso la pantalla debería
   * mandarlo siempre que mande opcionales.
   */
  rotuloOpcionales?: string
  /** Ley 22 por registro: 'control' (cliente, default) · 'oficio' (prestador). */
  registro?: 'control' | 'oficio'
}

function Linea({
  doc,
  marcada,
  onCambiar,
  registro,
}: {
  doc: DocumentoAceptable
  marcada: boolean
  onCambiar: (clave: string, marcada: boolean) => void
  registro: 'control' | 'oficio'
}) {
  const { theme } = useTheme()
  const hayEnlace = doc.etiquetaEnlace !== undefined && doc.onAbrir !== undefined

  return (
    <Casilla
      marcada={marcada}
      onCambio={(m) => onCambiar(doc.clave, m)}
      /* 🔴 LA FRASE ENTERA, no la primera mitad. Explícita si vino; si no,
         COMPUESTA — ver la nota de `etiquetaAccesible`.

         ⚠️ Esto NO contradice el literal de `Casilla` (*«el TEXTO de la
         aceptación, jamás el enlace»*): lo que esa regla prohíbe es que el
         label anuncie el enlace **como control** —el enlace sigue siendo un
         responder aparte, con su propio `onPress` y su propio rol—. Lo que
         acá viaja es **la frase que se acepta**, que casualmente termina con
         las mismas palabras. *Se lee el enunciado completo; no se ofrece un
         segundo botón.* */
      etiquetaAccesible={
        doc.etiquetaAccesible ?? [doc.texto, doc.etiquetaEnlace].filter(Boolean).join(' ')
      }
      registro={registro}
    >
      <Texto variante="cuerpo">
        {doc.texto}
        {hayEnlace ? (
          <>
            {' '}
            {/* `Text` anidado con su propio `onPress`: es el responder más
                interno, así que el toque sobre el enlace NO llega a la
                casilla. Se dibuja con tokens y el acento del registro — no
                con `Texto`, cuyo color es semántico y no de acento (R58). */}
            <Text
              onPress={doc.onAbrir}
              accessibilityRole="link"
              accessibilityLabel={doc.etiquetaEnlace}
              style={{
                color: registro === 'oficio' ? theme.accent.cta : theme.accent.control,
                fontFamily: typography.family.sans.medium,
                textDecorationLine: 'underline',
              }}
            >
              {doc.etiquetaEnlace}
            </Text>
          </>
        ) : null}
      </Texto>
    </Casilla>
  )
}

export function AceptacionDeDocumentos({
  documentos,
  opcionales,
  marcadas,
  onCambiar,
  rotuloOpcionales,
  registro = 'control',
}: AceptacionDeDocumentosProps) {
  /* REGLA DE EXISTENCIA: sin documentos no hay nada que aceptar. */
  if (documentos.length === 0) return null

  const set = new Set(marcadas)

  return (
    <View style={{ gap: spacing[3] }}>
      {documentos.map((d) => (
        <Linea
          key={d.clave}
          doc={d}
          marcada={set.has(d.clave)}
          onCambiar={onCambiar}
          registro={registro}
        />
      ))}

      {/* LA SEPARACIÓN ES ESTRUCTURAL (Ley 18): existe porque abajo hay otra
          familia. Sin opcionales no se dibuja — un divisor que no separa nada
          es la estructura decorativa que la Ley 18 corta. */}
      {opcionales === undefined || opcionales.length === 0 ? null : (
        <>
          <Separador />

          {rotuloOpcionales === undefined ? null : (
            <Texto variante="apoyo" color="tertiary">
              {rotuloOpcionales}
            </Texto>
          )}

          {opcionales.map((d) => (
            <Linea
              key={d.clave}
              doc={d}
              marcada={set.has(d.clave)}
              onCambiar={onCambiar}
              registro={registro}
            />
          ))}
        </>
      )}
    </View>
  )
}
