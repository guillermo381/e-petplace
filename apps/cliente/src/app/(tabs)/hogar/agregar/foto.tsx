/**
 * Alta de mascota adicional · paso foto (S55-A A2 → REESCRITO S82-A):
 * espejo del onboarding — la lámina 2026-07-29 es el acuerdo. Foto
 * ENTERA sin recorte nativo (HojaFotoMascota) + encuadre de la casa
 * (pinza + arrastre con clamp, previews en vivo); cx/cy/z viajan al
 * cierre por params y se declaran tras el alta.
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

export default function AgregarPasoFoto() {
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
  const encuadreRef = useRef<Encuadre>(ENCUADRE_DEFAULT);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('agregarMascota.tituloFoto', { nombre })}
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
          etiqueta={t('agregarMascota.continuar')}
          bloque
          onPress={() =>
            router.push({
              pathname: '/hogar/agregar/cierre',
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
