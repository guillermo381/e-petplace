/**
 * FILA DE DOCUMENTO — la anatomía firmada (S89-D orden 7, firma del
 * founder sobre capturas): **fila con el glifo del papel + su nombre +
 * el acto de descarga. ☠️ MURIÓ EL BOTÓN TAPIZ** (los dos `Boton bloque`
 * que S89-A dejó en el perfil: un botón a ancho completo por papel no
 * escala — con receta y certificados serían cuatro tapices apilados).
 *
 * DOS CONSUMIDORES (por eso es pieza y no inline): el perfil de la
 * mascota y Documentos del hogar. **Local al cliente** — la regla de las
 * piezas manda promover a `packages/ui` con el consumidor de OTRA casa,
 * y el prestador no tiene esta fila.
 *
 * ── S90-C · LA ENMIENDA DE FORMA DEL FOUNDER: LA FILA GANA SU «›» ──────
 *
 * **Y por eso esta pieza dejó de dibujar su propia anatomía: ahora
 * CONSUME `CeldaNavegacion`.** No es refactor de gusto — es la única
 * salida legal. El chevron de la casa vive en `chevron.ts`, que **no se
 * exporta a propósito** y lo dice en su cabecera: *«una pantalla que
 * necesite un chevron usa la PIEZA que lo porta, jamás el path suelto —
 * que es el defecto que este archivo cierra»*. Dibujarlo acá habría sido
 * la quinta copia del mismo trazo, que es exactamente lo que **L-175**
 * prohíbe.
 *
 * **`direccion="derecha"` y no `abajo`, por E14:** abrir un papel LLEVA
 * (se va del producto al PDF); no despliega nada en el lugar. La
 * dirección codifica una verdad del contenido (Ley 18).
 *
 * ☠️ **MUERE `iconoCta`** (Ley 37: el slot no lo consumía NADIE — medido,
 * cero callers). Nació como puente mientras no existía el glifo de
 * descarga, y **el glifo hoy EXISTE**: B depositó `descargar` en el
 * registry en S89. **Igual gana el chevron, y la razón es Chanel (Ley
 * 16): el founder pidió «›», y una fila con glifo de papel + glifo de
 * descarga + chevron son tres marcas para un solo acto.** Si el founder
 * prefiere el glifo, es cambiar `direccion` por el `iconoCta` — pero es
 * uno O el otro, jamás los dos.
 *
 * `registro="tinta"` conserva el tratamiento plano que el founder firmó
 * en S89 (el glifo del papel no compite con el nombre); `'capa'` habría
 * traído color de capa a una fila que nadie pidió recolorear.
 */

import { CeldaNavegacion, opacity } from '@epetplace/ui';
import type { IconoNombre } from '@epetplace/ui';
import { View } from 'react-native';

export function FilaDocumento({
  icono,
  nombre,
  apoyo,
  cargando,
  onPress,
}: {
  /** El glifo del PAPEL (el objeto), del catálogo derivado. */
  icono: IconoNombre;
  nombre: string;
  /** La voz del acto, bajo el nombre del papel. */
  apoyo: string;
  cargando: boolean;
  onPress: () => void;
}) {
  return (
    /* La descarga en vuelo: la fila se atenúa y deja de responder. El
       `pointerEvents` es lo que de verdad frena el segundo toque —
       apagar solo el `onPress` dejaría la fila reaccionando al pressed
       de `CeldaNavegacion` y diría que algo pasa cuando no pasa nada. */
    <View
      style={{ opacity: cargando ? opacity.disabled : 1 }}
      pointerEvents={cargando ? 'none' : 'auto'}
    >
      <CeldaNavegacion
        icono={icono}
        titulo={nombre}
        detalle={apoyo}
        registro="tinta"
        direccion="derecha"
        onPress={onPress}
      />
    </View>
  );
}
