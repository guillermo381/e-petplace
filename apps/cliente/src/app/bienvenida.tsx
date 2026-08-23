/**
 * Bienvenida — EL ACTO I DEL RITUAL DE ENTRADA (S104-C, coreografía founder
 * 23-ago; reparto: B provee los gestos, C compone).
 *
 * ── LA CEREMONIA (composición de C sobre los gestos de B) ────────────────
 * ① el isotipo RESPIRA una vez (`RespiroDeMarca` de B, 1.0→1.03→1.0) → ② la
 * SENDA se traza y queda (`PaseoDeHuellas` de B, diagonal desde
 * abajo-izquierda) → ③ el MANIFIESTO entra (`Entrada`, 300/120/translateY 15)
 * → ④ las ACCIONES al pie. **Nada bloquea el toque:** `PaseoDeHuellas` y
 * `MarcaDeAgua` son `pointerEvents="none"`, y `RespiroDeMarca`/`Entrada` no
 * capturan el toque de sus hijos — los botones responden aunque la ceremonia
 * corra. *Tocar una acción durante el gesto navega igual: la interacción
 * gana a la coreografía.*
 *
 * ── LO QUE MUERE (Ley 37) ────────────────────────────────────────────────
 * El wordmark `e.petplace` → **`e-PetPlace`** (firma founder: muere la
 * variante con punto, la única que el usuario veía como wordmark).
 *
 * ── LA CONTINUIDAD ENTRE PANTALLAS, declarada ────────────────────────────
 * «El isotipo viaja a la esquina del login» y «el paseo persiste» son
 * coreografía ENTRE rutas (shared-element). Hacerlo pixel-perfect exige un
 * layout compartido de las pantallas de entrada — y esas rutas viven sueltas
 * en `app/`, así que agruparlas toca la navegación (deep-links, el guard
 * raíz). **C no reestructura la navegación sin firma:** la continuidad se
 * monta PER-PANTALLA (el isotipo grande y centrado acá; chico en la esquina
 * en login/registro/recuperar; la senda en las cuatro, misma diagonal). La
 * transición nativa de expo-router hace el «se corre». El shared-element real
 * queda propuesto como refinamiento aparte.
 *
 * TESIS: "acá vive la vida de tu mascota — entrá." FIRMA: el isotipo que
 * respira y la senda que se traza — la marca en movimiento sereno. Memorial
 * N/A (pre-sesión); los gestos de B degradan solos.
 */

import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Entrada,
  Isotipo,
  MarcaDeAgua,
  PaseoDeHuellas,
  RespiroDeMarca,
  palette,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export default function Bienvenida() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg.base,
        paddingTop: insets.top + spacing[8],
        paddingBottom: insets.bottom + spacing[6],
        paddingHorizontal: spacing[5],
      }}
    >
      {/* EL TAPIZ — las dos capas de fondo, las dos pointerEvents none:
          el papel tapiz (isotipo tenue) y la senda que se traza. */}
      <MarcaDeAgua />
      <PaseoDeHuellas />

      {/* ① LA IDENTIDAD — el isotipo respira una vez (gesto de B), el
          wordmark lo rotula. El isotipo va FUERA de la contabilidad de
          dosis (Ley 4), UNO por pantalla. */}
      <View style={{ alignItems: 'center', gap: spacing[3] }}>
        <RespiroDeMarca>
          <Isotipo size={72} variant="gradiente" />
        </RespiroDeMarca>
        {/* el lockup — identidad de marca. ☠️ `e.petplace` MURIÓ: era la
            única variante con punto que el usuario veía, y decía otra cosa
            que las 95 del cuerpo (`e-PetPlace`). */}
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.lg,
            color: theme.text.primary,
          }}
        >
          e-PetPlace
        </Text>
      </View>

      {/* ③ EL MANIFIESTO — EL NORTE respira en el centro, entra escalonado
          (Entrada: 300 duración · 120 stagger · translateY 15). */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Entrada>
          <Text
            style={{
              fontFamily: typography.family.sans.light,
              fontSize: typography.size['3xl'],
              lineHeight: Math.round(typography.size['3xl'] * typography.leading.snug),
              letterSpacing: typography.tracking.tight,
              color: theme.text.primary,
            }}
          >
            {t('bienvenida.titular')}{' '}
            <Text style={{ color: palette.pink }}>{t('bienvenida.titularAcento')}</Text>
          </Text>
        </Entrada>
      </View>

      {/* ④ LAS ACCIONES al pie + los legales honestos. Entran después del
          manifiesto (orden 1 y 2). Tocar acá corta la ceremonia — la
          interacción no está bloqueada por ningún gesto. */}
      <View style={{ gap: spacing[2] }}>
        <Entrada orden={1}>
          <View style={{ gap: spacing[2] }}>
            <Boton variante="marca" etiqueta={t('bienvenida.crearCuenta')} bloque onPress={() => router.push('/registro')} />
            {/* `ghost`, no `sinCaja` (RITUAL §2.4): sobre esta pantalla la
                acción real es «Crear cuenta» en marca; «ya tengo cuenta» baja
                a enlace. */}
            <Boton variante="ghost" etiqueta={t('bienvenida.yaTengoCuenta')} bloque onPress={() => router.push('/login')} />
          </View>
        </Entrada>
        <Entrada orden={2}>
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.xs,
              lineHeight: Math.round(typography.size.xs * typography.leading.normal),
              color: theme.text.tertiary,
              textAlign: 'center',
              marginTop: spacing[2],
            }}
          >
            {t('bienvenida.legales')}
          </Text>
        </Entrada>
      </View>
    </View>
  );
}
