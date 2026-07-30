/**
 * Mapa de fuentes de e-PetPlace v4 — DM Sans (única familia UI) +
 * JetBrains Mono (metadata). SIN Playfair (decisión B1).
 *
 * Uso en el root layout de cada app:
 *   const [fontsLoaded] = useFonts(epetplaceFonts)
 * Los nombres coinciden con typography.family (tokens/typography.ts).
 */

import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono'

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
} as const
