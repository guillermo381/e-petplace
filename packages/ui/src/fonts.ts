/**
 * Mapa de fuentes de e-PetPlace v4 — DM Sans (única familia UI) +
 * JetBrains Mono (metadata). SIN Playfair (decisión B1).
 *
 * Uso en el root layout de cada app:
 *   const [fontsLoaded] = useFonts(epetplaceFonts)
 * Los nombres coinciden con typography.family (tokens/typography.ts).
 */

/* ⚡ S94-PERF · SE IMPORTA POR PESO, JAMÁS DESDE LA RAÍZ DE LA FAMILIA.
 *
 * Este archivo siempre cargó SEIS fuentes. Pero el `export` de Android
 * empaquetaba **35 archivos .ttf** — 18 de DM Sans, 16 de JetBrains Mono y uno
 * ajeno: el índice de cada familia hace un `require` de todos sus pesos, así
 * que importar `{ DMSans_300Light } from '@expo-google-fonts/dm-sans'` arrastra
 * el Thin, el Black y todas las itálicas al grafo de assets. *El mapa decía
 * seis y el bundle llevaba treinta y cuatro de las dos familias* — y el
 * comentario de S82-B de acá abajo («un asset que nadie usa
 * igual pesa en el bundle») era exactamente correcto y aun así no alcanzaba,
 * porque el peso no entraba por el mapa: entraba por la forma del import.
 *
 * Medido con `expo export --platform android` y contado del `metadata.json`
 * del propio export — las CUATRO corridas, antes y después de cada app:
 *     .ttf empaquetados      35        →  7         (los 6 nuestros + MaterialSymbols)
 *     prestador, total       11,36 MB  →  8,99 MB   (−2,37 MB)
 *     cliente, total         10,60 MB  →  8,23 MB   (−2,37 MB)
 *
 * Los 0,93 MB que quedan son `MaterialSymbols_400Regular`, que **no lo pide
 * nadie de esta casa** —el registry de glifos es SVG— sino una dependencia.
 * Queda censado como deuda: sacarlo es cirugía sobre expo-router, no un import.
 *
 * Cero cambio visible: las mismas seis fuentes, con los mismos nombres. */
import { DMSans_300Light } from '@expo-google-fonts/dm-sans/300Light'
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular'
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium'
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold'
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular'
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium'

export const epetplaceFonts = {
  DMSans_300Light,
  DMSans_400Regular,
  // S82-B r15: la itálica que r9 había cargado SE RETIRA — el founder la
  // mató (estigma de texto generado por IA en su mercado). Se descarga
  // del mapa: un asset que nadie usa igual pesa en el bundle.
  DMSans_500Medium,
  DMSans_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,

  /* ═══════════════════════════════════════════════════════════════════
   * 🔴 **v5 · LAS CUATRO DEL REDISEÑO DEL CLIENTE (S116, letra §1.4).**
   *
   * **Vienen por `require` de `assets/fonts/`, no de npm**, y las dos
   * razones son de este repo:
   *   · la licencia **OFL vive AL LADO de los archivos** (`OFL-Baloo2.txt`
   *     y `OFL-PlusJakartaSans.txt`) — de npm la licencia viaja en el
   *     paquete y se pierde de vista;
   *   · **el peso se controla acá**. El comentario de arriba cuenta cómo
   *     el índice de una familia npm arrastró 35 `.ttf` al bundle: con
   *     los archivos en el repo, lo que pesa es exactamente lo que hay.
   *     Los cuatro juntos son **607648 bytes** (`cat assets/fonts/*.ttf | wc -c`;
 *     `du` dice 600K, que son bloques de disco y no el peso real).
   *
   * **Llegan por OTA, no piden build** — medido por B en el lote 0 con
   * tres `expo export`: una fuente cargada por `useFonts` entra al
   * manifest del update (7 → 8 `.ttf`); un `.ttf` suelto que nadie
   * requiere NO viaja (vuelve a 7). *El `require` es lo que la hace
   * existir.*
   *
   * ⚠️ **Las seis de arriba NO salen todavía**, y no es olvido: el
   * PRESTADOR consume DM Sans (64 ocurrencias en 26 archivos) y la letra
   * §5 dice que el prestador no cambia. Sale cuando ningún token la
   * nombre.
   * ═══════════════════════════════════════════════════════════════════ */
  Baloo2_800ExtraBold:        require('../assets/fonts/Baloo2_800ExtraBold.ttf'),
  PlusJakartaSans_400Regular: require('../assets/fonts/PlusJakartaSans_400Regular.ttf'),
  PlusJakartaSans_600SemiBold:require('../assets/fonts/PlusJakartaSans_600SemiBold.ttf'),
  PlusJakartaSans_700Bold:    require('../assets/fonts/PlusJakartaSans_700Bold.ttf'),
} as const
