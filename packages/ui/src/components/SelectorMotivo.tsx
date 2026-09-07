/**
 * SelectorMotivo — QUÉ PASÓ, EN UNA PANTALLA (S114-B, B3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Toco y me pregunta qué pasó, con una lista corta y en mi idioma… Elijo
 * uno.»* — `DIRECCION_POSTVENTA` §2. **Los motivos son del catálogo y se leen
 * en una pantalla, sin scroll interno.** Cada uno con su glifo y su frase en
 * tuteo.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 NO HAY «OTRO», Y NO ES UNA PALABRA: ES LA ÚLTIMA FILA ────────────
 * §2, literal: ***«Sin "Otro" al final de la lista: si ninguno encaja, el
 * último dice "Es otra cosa · contame" y abre el campo. "Otro" es un cajón
 * donde va a parar todo lo que no supimos nombrar; "contame" es una
 * invitación.»***
 *
 * **Acá esa fila NO llega por prop: la pone la pieza**, con su clave propia
 * (`MOTIVO_CONTAME`) y su glifo. *Un catálogo que trajera su propio
 * catch-all podría llamarlo como quisiera —y el día que alguien escriba
 * «Otro» nadie se entera—; poniéndola la pieza, la invitación es lo único
 * que puede haber al final.* Su guard es `R74`, probado en rojo antes de
 * cablearse.
 *
 * ── LEY 11 · EL CENSO, Y POR QUÉ NO ES `SelectorOpcion` ─────────────────
 * Relevado antes de crear (protocolo 1c, pregunta 2). El candidato obvio es
 * `SelectorOpcion` —tiene selección única, tiene `acento`, tiene un slot
 * `adorno`— y **se descarta por dos razones concretas, no por gusto**:
 *
 * · **Sus cuatro disposiciones son `fila | tira | grilla | columnas`:
 *   ninguna es una LISTA VERTICAL.** Un chip vive de una etiqueta corta, y
 *   estos motivos son frases enteras —*«Me cobraron una ausencia que no
 *   fue»*—. Cuatro frases en chips que envuelven son una pared, no una lista
 *   corta.
 * · **El glifo es OBLIGATORIO acá y en `SelectorOpcion` es un `adorno`
 *   opcional.** §2 dice *«cada uno con su glifo»*: si el glifo puede faltar,
 *   falta. Acá el tipo lo exige.
 *
 * **Y qué hereda igual:** la gramática de la Ley 22 — **TONAL** para la
 * selección entre pares (borde 1.5 en el acento + tinte + texto en el
 * acento), que es exactamente lo que `SelectorOpcion` hace con `acento` y lo
 * que la casa ya enseñó. *No se inventa una señal de elección nueva.*
 *
 * ── SIN SCROLL INTERNO, Y ES ESTRUCTURAL ────────────────────────────────
 * §2 lo pide con esas palabras. La pieza **no monta ningún contenedor
 * desplazable**: si un catálogo creciera hasta no entrar, el defecto se ve en
 * la pantalla —que es donde hay que verlo— en vez de esconderse adentro de
 * un scroll que nadie sabe que está. *Un scroll interno convierte «la lista
 * es larga» en un problema invisible.* `R74` lo mide.
 *
 * ── NADIE VIENE ELEGIDO ─────────────────────────────────────────────────
 * `elegido` es `string | null` **sin default**: el consumidor declara el
 * arranque, y el arranque correcto es `null`. *Preseleccionar un motivo es
 * ponerle a la familia una palabra en la boca antes de que hable.*
 *
 * ── LA FOTO NO VIVE ACÁ ─────────────────────────────────────────────────
 * §2 dice que si el motivo pide una foto, **se pide después y se puede
 * saltar**. Esta pieza elige el motivo y nada más: `pideFoto` viaja como dato
 * del catálogo para que la pantalla sepa qué paso sigue, y **no dibuja nada**
 * — *una lista que además pidiera la foto haría dos trabajos, y el segundo
 * tiene su propia pantalla con su «si no, seguimos igual».*
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15) ────────────────────────────────
 * Cero movimiento: la elección es reemplazo directo (Ley 6). El tinte y el
 * borde salen del tema, así que memorial degrada solo (su acento cae a
 * tinta).
 *
 * ── PUERTA ──────────────────────────────────────────────────────────────
 * El segundo paso de «algo salió distinto», app de la familia. **Entregada y
 * no montada.**
 */
import { Pressable, View } from 'react-native'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'

/**
 * 🔴 LA CLAVE DE LA ÚLTIMA FILA — la pone la pieza, no el catálogo. Ver la
 * primera nota de la cabecera: es lo que hace inexpresable un «Otro».
 */
export const MOTIVO_CONTAME = '__contame__'

export type MotivoDelCaso = {
  /** La clave del catálogo del motor. Jamás se muestra. */
  clave: string
  /** La frase, en tuteo y en voz de la casa (Ley 3). */
  etiqueta: string
  /** 🔴 OBLIGATORIO: §2 dice «cada uno con su glifo». */
  glifo: IconoNombre
  /**
   * Si este motivo pide una foto. **La pieza no la pide** — viaja para que la
   * pantalla sepa qué paso sigue. Ver la cabecera.
   */
  pideFoto?: boolean
}

export type SelectorMotivoProps = {
  /**
   * El catálogo, corto y en orden. **Sin la última fila**: la pone la pieza.
   */
  motivos: MotivoDelCaso[]
  /** 🔴 SIN DEFAULT: el arranque correcto es `null`. Ver la cabecera. */
  elegido: string | null
  /** Emite `MOTIVO_CONTAME` cuando se toca la última fila. */
  onElegir: (clave: string) => void
  /** «Es otra cosa · contame» — la frase entera, ya redactada (§2). */
  vozContame: string
  /** `'control'` (familia) · `'oficio'` (negocio). Ley 22. */
  acento?: 'control' | 'oficio'
}

const GLIFO_CONTAME: IconoNombre = 'burbujas'

export function SelectorMotivo({
  motivos,
  elegido,
  onElegir,
  vozContame,
  acento = 'control',
}: SelectorMotivoProps) {
  const { theme } = useTheme()
  const color = acento === 'oficio' ? theme.accent.primary : theme.accent.control
  /* ⚠️ `controlBg` NO existe en memorial —lo verifiqué en los tres temas, no
     lo supuse— y por eso el brazo del cliente se lee con el mismo idioma que
     `SelectorOpcion` ya escribió para el mismo hueco: se pregunta si el slot
     está y se cae a una superficie serena que sí vive en los tres. *No se
     agrega un slot a memorial para que una pieza nueva no tenga que
     preguntar: memorial tiene menos acentos a propósito.* */
  const tinte =
    acento === 'oficio'
      ? theme.accent.primaryBg
      : 'controlBg' in theme.accent
        ? (theme.accent as { controlBg: string }).controlBg
        : theme.accent.brandBg

  /* La última fila es un motivo más EN LA FORMA y otra cosa EN EL SIGNIFICADO:
     se dibuja igual —misma altura, mismo glifo, misma señal de elección— para
     que no se lea como un escape de segunda. */
  const filas: MotivoDelCaso[] = [
    ...motivos,
    { clave: MOTIVO_CONTAME, etiqueta: vozContame, glifo: GLIFO_CONTAME },
  ]

  return (
    /* `radiogroup`: elegir uno de varios. Sin contenedor desplazable — ver la
       cabecera y `R74`. */
    <View accessibilityRole="radiogroup" style={{ gap: spacing[2] }}>
      {filas.map((motivo) => {
        const puesto = elegido === motivo.clave
        return (
          <Pressable
            key={motivo.clave}
            onPress={() => onElegir(motivo.clave)}
            accessibilityRole="radio"
            accessibilityState={{ selected: puesto }}
            accessibilityLabel={motivo.etiqueta}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
              minHeight: 44, // N8: el blanco táctil de la casa
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[3],
              borderRadius: radius.suave,
              // Ley 22 — TONAL para la selección entre pares. Apagado no dice
              // error: es contorno neutro, no un estado de falla.
              borderWidth: puesto ? 1.5 : theme.border.width,
              borderColor: puesto ? color : theme.border.default,
              backgroundColor: puesto ? tinte : 'transparent',
            }}
          >
            <Icono
              nombre={motivo.glifo}
              tamano={24}
              registro="tinta"
              tinta={puesto ? color : theme.text.secondary}
            />
            {/* El texto NO se tiñe con el acento: N23 — el color marca clase,
                y acá la clase la marca el conjunto (borde + tinte), no la
                frase. Teñir la frase elegida diría «ésta importa más». */}
            <View style={{ flex: 1 }}>
              <Texto variante="cuerpo">{motivo.etiqueta}</Texto>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}
