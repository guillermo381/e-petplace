/**
 * PrecioText — LA VOZ DEL PRECIO, una sola para toda la casa (S100-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ NACE, con el censo que lo obliga: **el precio se escribía a
 * mano en 53 sitios** con la forma `` `$ ${x.toFixed(2)}` `` — y en la
 * vitrina se pintaba con **`metadataMono`**, que es el slot de la
 * METADATA de una fila (Ley 3: dato de máquina, mono, al costado).
 *
 * 🔴 **Y ese es el diagnóstico, que no es de tipografía sino de
 * JERARQUÍA: en una tarjeta de compra el precio no es metadata — es el
 * dato que decide.** Un número que decide una compra no puede estar
 * vestido igual que un identificador de pedido.
 *
 * ⚠️ **ESTO NO DEROGA LA LEY 3, y conviene decirlo porque se parece:**
 * lo que sale del mono es **el precio protagonista**. **El `$/kg` SE
 * QUEDA en mono** (`Texto variante="dato"`) porque es lo que la Ley 3
 * describe: **un CÁLCULO**, no un precio de lista. *Medido antes de
 * tocar: en toda la despensa del cliente había UN solo `variante="dato"`
 * y era justamente el `$/kg` — o sea que no había «mono regado» que
 * matar ahí; había un precio vestido de metadata.*
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LAS TRES DECISIONES DE FORMA ───────────────────────────────────
 *
 * ① **`$6.70` SIN ESPACIO** (firma del founder, 17-ago). Hoy la casa
 *    escribe `$ 6.70`. El símbolo y la cifra son **una sola palabra
 *    visual**: separarlos deja al `$` flotando como si fuera un ícono, y
 *    en una grilla de dos columnas ese espacio es la diferencia entre
 *    que el precio entre en la línea o no.
 *
 * ② **CIFRAS TABULARES**, siempre. En una grilla los precios se leen en
 *    COLUMNA aunque estén en tarjetas distintas, y con cifras de ancho
 *    variable el punto decimal baila de tarjeta en tarjeta. *Tabular no
 *    es un lujo tipográfico acá: es lo que deja comparar sin leer.*
 *
 * ③ **TIPOGRAFÍA DE LA CASA, jamás mono** (ver el diagnóstico arriba).
 *
 * ── EL FORMATEO VIVE ACÁ, Y ESO ES LA MITAD DEL VALOR ──────────────
 * La pieza recibe un **número**, no una cadena ya armada. *Si recibiera
 * el texto, los 53 `toFixed(2)` seguirían vivos y esto sería un envase
 * nuevo para el mismo problema.* El día que la moneda deje de ser USD
 * —o que haya que cambiar el separador decimal— se toca UN archivo.
 *
 * ⚠️ **Lo que esta pieza NO hace: convertir.** Recibe el número en la
 * moneda que va a mostrar. *Una pieza de presentación que además
 * convierte esconde una tasa de cambio adentro de un componente de UI,
 * y ahí nadie la va a buscar.*
 *
 * ── LA LEY DEL NULO (19.9) ─────────────────────────────────────────
 * Sin precio **no se dibuja nada**. `$0.00` es una mentira con formato
 * de dato: dice «esto es gratis» cuando lo que pasa es que no sabemos
 * cuánto vale. Quien tenga que decir «sin precio» lo dice con palabras,
 * no con un cero.
 */

import { Text, View } from 'react-native'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** Los tres registros, por el trabajo que hace el precio en la pantalla. */
export type PrecioRegistro =
  /** El de una tarjeta de grilla o una fila. El caso normal. */
  | 'vitrina'
  /** El protagonista de la ficha del producto — el que decide la compra. */
  | 'ficha'
  /** El de un renglón de resumen (subtotal, envío, impuesto). */
  | 'linea'

export interface PrecioTextProps {
  /** El monto, **en la moneda que se va a mostrar** (ver la cabecera:
   *  esta pieza no convierte). `null`/`undefined` = no se dibuja nada. */
  valor: number | null | undefined
  registro?: PrecioRegistro
  /** El precio por unidad de peso, **ya calculado y ya formateado por
   *  quien conoce la presentación** (ej. `'$4.72 / kg'`).
   *
   *  🔴 **Es el dato que decide una compra de alimento y casi nadie lo
   *  pone** (N19 ③). Va en **mono** —y no contradice la cabecera— porque
   *  es un CÁLCULO derivado, que es exactamente lo que la Ley 3 manda
   *  vestir de máquina. *El contraste entre los dos registros es lo que
   *  dice cuál es el precio y cuál la cuenta.*
   *
   *  Llega formateado y no como número porque su unidad **no es siempre
   *  el kilo** (hay unidades, litros, sobres): armarlo acá obligaría a
   *  esta pieza a conocer el catálogo. */
  porUnidad?: string
  /** Tacha el precio y lo apaga — para un valor que YA NO RIGE (un
   *  precio anterior al lado del vigente).
   *  ⚠️ **Jamás para urgencia ni para fabricar una rebaja**: la casa no
   *  hace precios de referencia inventados (`MODELO_DESPENSA`). */
  anterior?: boolean
}

/* 🔴 EL PESO BAJÓ DE 700 A 500 — RE-DERIVACIÓN DE S100b-B, y el motivo es
   una medición, no un gusto.

   G-06 del gate decía *«el precio es demasiado grande en toda la casa»*,
   con Laika como vara. **Medido con el harness sobre su vitrina web:**

   | | Laika | nosotros (antes) |
   |---|---|---|
   | ancho de tarjeta | 366 px | **164 dp** |
   | nombre | 14 px · peso 400 | 16 px · peso 400 |
   | precio | 20 px · **peso 500** | 20 px · **peso 700** |

   ⇒ **El cuerpo era el mismo (20). Lo que no era el mismo era el PESO** —y
   la caja, que mide menos de la mitad—. *Casi la misma tipografía en menos
   de la mitad de ancho, y el precio dos pesos más pesado.*

   **Por eso se mueve el peso y no el tamaño:** el precio tiene que seguir
   siendo el dato que decide (Baymard lo lista como atributo requerido, y
   achicarlo lo degradaría), pero **no tiene por qué gritar para mandar**.
   *Bajar el peso conserva la jerarquía y le devuelve el aire a la tarjeta;
   bajar el tamaño habría cambiado la jerarquía.*

   ⚠️ **Y una autocorrección que viaja con esto, para que nadie reconstruya
   el argumento viejo:** mi primera comparación daba *«el precio es 2.5×
   más grande»* y **estaba mal emparejada** — enfrentaba nuestra tarjeta de
   GRILLA contra la FILA de la app de Laika, dos familias de layout. En la
   misma familia **su ratio precio÷nombre es MAYOR que el nuestro** (1.429
   contra 1.25). *La conclusión sobrevivió; la razón que la sostenía, no.*

   **`ficha` sigue al mismo criterio POR COHERENCIA, no por medición
   propia:** a 28 px en `bold` el precio era el elemento más pesado de la
   ficha —más que el nombre del producto, que va en `light`—. Su gate es el
   ojo del founder, y se declara como derivado en vez de presentarse como
   medido. `linea` no se toca: ya era `regular`. */
const RECETA: Record<PrecioRegistro, { size: number; familia: string; leading: number }> = {
  // La escala sale de N1 por TOKEN, jamás tecleada: quien corra la
  // escala mueve los precios con ella.
  vitrina: { size: typography.size.md, familia: typography.family.sans.medium, leading: 26 },
  ficha: { size: typography.size.xl, familia: typography.family.sans.medium, leading: 34 },
  linea: { size: typography.size.base, familia: typography.family.sans.regular, leading: 24 },
}

/** El formateo, en UN lugar. Ver la cabecera: recibe número, no texto. */
export function formatearPrecio(valor: number): string {
  return `$${valor.toFixed(2)}`
}

export function PrecioText({
  valor,
  registro = 'vitrina',
  porUnidad,
  anterior = false,
}: PrecioTextProps) {
  const { theme } = useTheme()

  // 19.9 · el nulo no se dibuja (ver «la ley del nulo» en la cabecera).
  if (valor === null || valor === undefined) return null

  const receta = RECETA[registro]

  return (
    <View style={{ gap: spacing[0.5] }}>
      <Text
        style={{
          fontFamily: anterior ? typography.family.sans.regular : receta.familia,
          fontSize: anterior ? typography.size.sm : receta.size,
          lineHeight: anterior ? 20 : receta.leading,
          color: anterior ? theme.text.tertiary : theme.text.primary,
          textDecorationLine: anterior ? 'line-through' : 'none',
          // Ver decisión ② — en grilla los precios se leen en columna.
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatearPrecio(valor)}
      </Text>

      {porUnidad === undefined || anterior ? null : (
        <Text
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.sm,
            lineHeight: 20,
            color: theme.text.secondary,
            fontVariant: ['tabular-nums'],
          }}
        >
          {porUnidad}
        </Text>
      )}
    </View>
  )
}
