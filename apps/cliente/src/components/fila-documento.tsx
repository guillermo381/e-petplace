/**
 * FILA DE DOCUMENTO — la anatomía firmada (S89-D orden 7, firma del
 * founder sobre capturas): **fila con el glifo del papel + su nombre +
 * el CTA de descarga. ☠️ MUERE EL BOTÓN TAPIZ** (los dos `Boton bloque`
 * que S89-A dejó en el perfil: un botón a ancho completo por papel no
 * escala — con receta y certificados serían cuatro tapices apilados).
 *
 * DOS CONSUMIDORES (por eso es pieza y no inline): el perfil de la
 * mascota y Documentos del hogar. **Local al cliente** — la regla de las
 * piezas manda promover a `packages/ui` con el consumidor de OTRA casa,
 * y el prestador no tiene esta fila.
 *
 * ✅ EL GLIFO DEL CTA — PEDIDO PAGADO EN EL DÍA (S89-B orden 9). Esta
 * fila nació con `iconoCta` cableado y en `null` porque `descargar` NO
 * existía, y prestarle `compartir` era la sustitución genérica que la
 * **Ley 12** prohíbe (el propio `Icono.tsx` registra tres frenos
 * idénticos: lápiz/compartir r7 · vacuna r10 · bitácora r34). B lo
 * dibujó como hermano de `compartir` —flecha invertida, bandeja
 * byte-idéntica— y hoy es el default.
 * **La voz de apoyo QUEDA** («Descargar PDF»): el glifo dice el acto a
 * quien mira, la voz a quien lee — y el gate por ícono a 21px sigue
 * siendo de B, no de esta fila.
 */

import { Icono, Texto, spacing, useTheme, usePresionado } from '@epetplace/ui';
import type { IconoNombre } from '@epetplace/ui';
import Animated from 'react-native-reanimated';
import { Pressable, View } from 'react-native';

export function FilaDocumento({
  icono,
  nombre,
  apoyo,
  cargando,
  iconoCta = 'descargar',
  onPress,
}: {
  /** El glifo del PAPEL (el objeto), del catálogo derivado. */
  icono: IconoNombre;
  nombre: string;
  /** La voz del acto — hoy sostiene el affordance que el glifo dará. */
  apoyo: string;
  cargando: boolean;
  /** El CTA de descarga. Default: el glifo `descargar` que B entregó
   *  (S89-B orden 9, pedido de esta lámina) — hermano exacto de
   *  `compartir` con la flecha INVERTIDA y la bandeja byte-idéntica. */
  iconoCta?: IconoNombre | null;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const presion = usePresionado();

  return (
    <Pressable
      {...presion.handlers}
      onPress={onPress}
      disabled={cargando}
      accessibilityRole="button"
      /* El acto entero en el label: el lector no depende del glifo que
         todavía no existe. */
      accessibilityLabel={`${nombre} · ${apoyo}`}
      accessibilityState={{ disabled: cargando }}
    >
      <Animated.View
        style={[
          presion.estiloPresionado,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[4],
            paddingVertical: spacing[4],
            paddingHorizontal: spacing[5],
            opacity: cargando ? 0.6 : 1,
          },
        ]}
      >
        <Icono nombre={icono} tamano={24} tinta={theme.text.secondary} />
        <View style={{ flex: 1 }}>
          <Texto variante="cuerpo">{nombre}</Texto>
          <Texto variante="dato" color="secondary">
            {apoyo}
          </Texto>
        </View>
        {iconoCta !== null ? (
          <Icono nombre={iconoCta} tamano={21} tinta={theme.accent.control} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
