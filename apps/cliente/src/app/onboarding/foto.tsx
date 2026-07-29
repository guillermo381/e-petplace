/**
 * Onboarding · paso foto (S45-B4 → REESCRITO S82-A por la lámina
 * docs/laminas/2026-07-29-s82-foto-onboarding.html — EL ACUERDO):
 * la foto se elige ENTERA (sin recorte nativo 1:1 — HojaFotoMascota) y
 * el ENCUADRE es de la casa: pinza + arrastre con clamp, previews de
 * las superficies EN VIVO (EncuadreFoto). El encuadre viaja al cierre
 * por params (cx/cy/z) y se declara tras el alta (declararFotoMascota).
 *
 * "Por ahora no" sigue siendo primera clase: Continuar funciona sin
 * foto — la huella es cara válida (S45).
 */

import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Encabezado,
  Texto,
  spacing,
  useTheme,
  type FotoCapturada,
} from '@epetplace/ui';

import { EncuadreFoto } from '@/components/EncuadreFoto';
import { HojaFotoMascota } from '@/components/HojaFotoMascota';
import { ENCUADRE_DEFAULT, type Encuadre } from '@/components/foto-encuadre';
import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';

export default function PasoFoto() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    nombre: string;
    especie: string;
    fecha?: string;
    precision?: string;
    sexo?: string;
  }>();
  const nombre = params.nombre ?? t('onboarding.tuMascota');

  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  // El encuadre vigente NO re-renderiza la pantalla: vive en ref y las
  // previews viven en el UI thread (EncuadreFoto).
  const encuadreRef = useRef<Encuadre>(ENCUADRE_DEFAULT);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('onboarding.tituloFoto', { nombre })}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingTop: spacing[6], paddingBottom: insets.bottom + spacing[8], gap: spacing[5] }}>
        {foto === null ? (
          <View style={{ alignItems: 'center', gap: spacing[4], paddingTop: spacing[6] }}>
            <AvatarMascota
              nombre={nombre}
              especie={esEspecieUi(params.especie) ? params.especie : undefined}
              tamano="lg"
            />
            <Texto variante="apoyo" centrado>
              {t('fotoEncuadre.elegirDetalle')}
            </Texto>
            {permisoDenegado ? (
              <Texto variante="apoyo" color="danger" centrado>
                {t('fotoEncuadre.permisoCamara')}
              </Texto>
            ) : null}
            <Boton variante="secundario" bloque etiqueta={t('fotoEncuadre.elegirFoto')} onPress={() => setHojaAbierta(true)} />
          </View>
        ) : (
          <>
            <EncuadreFoto
              key={foto.uri}
              uri={foto.uri}
              dim={{ iw: foto.width, ih: foto.height }}
              inicial={ENCUADRE_DEFAULT}
              nombre={nombre}
              onCambio={(e) => {
                encuadreRef.current = e;
              }}
            />
            <Boton variante="ghost" bloque etiqueta={t('fotoEncuadre.cargarOtra')} onPress={() => setHojaAbierta(true)} />
          </>
        )}

        <Boton
          etiqueta={t('onboarding.continuar')}
          bloque
          onPress={() =>
            router.push({
              pathname: '/onboarding/cierre',
              params: {
                nombre: params.nombre ?? '',
                especie: params.especie ?? '',
                ...(params.fecha ? { fecha: params.fecha, precision: params.precision } : null),
                ...(params.sexo ? { sexo: params.sexo } : null),
                ...(foto !== null
                  ? {
                      fotoUri: foto.uri,
                      cx: String(encuadreRef.current.cx),
                      cy: String(encuadreRef.current.cy),
                      z: String(encuadreRef.current.z),
                    }
                  : null),
              },
            })
          }
        />
      </ScrollView>

      <HojaFotoMascota
        visible={hojaAbierta}
        titulo={t('fotoEncuadre.hojaTitulo')}
        onCerrar={() => setHojaAbierta(false)}
        onFoto={(f) => {
          setPermisoDenegado(false);
          encuadreRef.current = ENCUADRE_DEFAULT;
          setFoto(f);
        }}
        onPermisoDenegado={() => setPermisoDenegado(true)}
      />
    </View>
  );
}
