/**
 * Cuenta · Tu dirección (S56-A, D-339) — la puerta del hogar: donde el
 * paseador busca y devuelve a la mascota. UNA dirección principal por
 * user (índice parcial en DB); las citas de paseo llevan SNAPSHOT
 * congelado server-side — editar acá jamás toca citas ya creadas.
 * Escalera: no muestra datos del expediente (formulario puro).
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HojaContenido,
  Boton,
  Cabecera,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  spacing,
  typography,
  useTheme,
  EvitaTeclado,
} from '@epetplace/ui';
import { obtenerDireccionHogar, type DireccionHogar } from '@epetplace/api';

import { DireccionHogarForm } from '@/components/direccion-hogar-form';
import { useTraduccion } from '@/i18n';
import { useAltoDeCabecera } from '@/lib/alto-de-cabecera';

export default function DireccionCuenta() {
  const cabecera = useAltoDeCabecera('empujada');
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [direccion, setDireccion] = useState<DireccionHogar | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerDireccionHogar();
      if (!vigente) return;
      if (!r.ok) {
        setEstado('error');
        return;
      }
      setDireccion(r.data);
      setEstado('listo');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* ⭐ **LA ESTRUCTURA FIRMADA — S116-C lote 3b (precisión del founder).**
          *Migrar no es cambiar `Encabezado` por `Cabecera`.* El ciruela es el
          FONDO —`presentacion="fondo"`: sin radio inferior, sin sombra— y el
          contenido vive en una hoja de lienzo que lo tapa al scrollear. **La
          curva es de la HOJA y mira hacia ARRIBA**; la cabecera-tarjeta con las
          esquinas de abajo redondeadas muere en el cliente.
          ⚠️ **Los `ScrollView` verticales que había adentro se volvieron
          `View`**: la hoja ya scrollea, y dos scrolls verticales anidados
          dejan al de adentro sin alto propio. Su `contentContainerStyle` pasa
          a `style` — *el relleno era del contenido, no del scroll.* El
          `paddingBottom` con `insets.bottom` SE RETIRA: lo paga la hoja
          (`R53`). */}
      <HojaContenido
        arranque={cabecera.arranque}
        scroll={{ keyboardShouldPersistTaps: 'handled' }}
        fondo={
          <View onLayout={cabecera.alMedir}>
            <Cabecera
              variante="empujada" titulo={t('direccion.titulo')} onVolver={() => router.back()}  etiquetaVolver={t('comun.volver')}
              presentacion="fondo"
            />
          </View>
        }
      >

      {estado === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : estado === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.reintentar')}
                onPress={() => {
                  setEstado('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      ) : (
        // Cura S56 (orden founder): el campo enfocado SIEMPRE visible —
        // el teclado empuja el scroll, no lo tapa (Android e iOS).
        <EvitaTeclado>
          <View style={{ padding: spacing[5], gap: spacing[4] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                lineHeight: typography.size.base * 1.4,
                color: theme.text.secondary,
              }}
            >
              {t('direccion.voz')}
            </Text>
            <DireccionHogarForm inicial={direccion} onGuardada={() => router.back()} />
          </View>
        </EvitaTeclado>
      )}
      </HojaContenido>
    </View>
  );
}
