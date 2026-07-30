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
  DMSans_400Regular_Italic,
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
  // S82-B r9 — LA VOZ DEL PRODUCTO (orden founder punto 6): la itálica
  // REAL de DM Sans, del MISMO paquete ya instalado (`^0.4.1`): cero dep
  // nueva, cero módulo nativo ⇒ **cero L-134** (asset del bundle, viaja
  // por OTA). Ley 3 INTACTA: sigue siendo DM Sans, familia única de UI —
  // lo que nace es un REGISTRO, no una familia. El `fontStyle: 'italic'`
  // sintético quedaba descartado por inconsistente entre plataformas
  // (Android no lo sintetiza igual que iOS): la itálica se CARGA.
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} as const
