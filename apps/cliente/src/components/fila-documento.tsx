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
 * ⚠️ EL GLIFO DEL CTA NO EXISTE Y NO SE SUSTITUYE — pedido a B (76b).
 * Medido en el registry (6-ago): no hay `descargar`. El vecino más
 * cercano, `compartir` («la flecha que SALE de la bandeja»), significa
 * OTRA COSA, y prestarlo es la sustitución genérica que la **Ley 12**
 * prohíbe — el propio `Icono.tsx` registra tres frenos idénticos
 * (lápiz/compartir en r7, vacuna en r10, bitácora en r34).
 * **Mientras tanto el acto lo dice la VOZ** (`documentos.descargar` bajo
 * el nombre del papel): affordance honesto, jamás un glifo que miente.
 * `iconoCta` ya está cableado: el día que B entregue el glifo, se monta
 * en UNA línea y la voz de apoyo queda o se retira en su gate.
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
  iconoCta = null,
  onPress,
}: {
  /** El glifo del PAPEL (el objeto), del catálogo derivado. */
  icono: IconoNombre;
  nombre: string;
  /** La voz del acto — hoy sostiene el affordance que el glifo dará. */
  apoyo: string;
  cargando: boolean;
  /** El CTA de descarga: null hasta que B entregue su glifo. */
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
