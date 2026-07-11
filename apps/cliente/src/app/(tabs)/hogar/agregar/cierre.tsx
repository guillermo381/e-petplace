/**
 * Alta de mascota adicional · cierre (S55-A A2) — la llamada atómica:
 * agregarMascotaAFamilia (la RPC deriva la familia del caller). Foto
 * primero (subirAvatar S45: resize, reintento, "Continuar sin foto");
 * éxito → replace al Hogar (la mascota nueva aparece en la Zona 1,
 * peldaño 0: voz "aún conociéndolo" + historia que empieza).
 */

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Boton,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { agregarMascotaAFamilia, obtenerSesion } from '@epetplace/api';

import { esPrecision, esSexo } from '@/lib/params';
import { subirAvatar } from '@/lib/subir-avatar';
import { useTraduccion } from '@/i18n';

export default function AgregarCierre() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const params = useLocalSearchParams<{
    nombre: string;
    especie: string;
    fecha?: string;
    precision?: string;
    sexo?: string;
    fotoUri?: string;
  }>();

  const [error, setError] = useState<string | undefined>(undefined);
  const [errorDeFoto, setErrorDeFoto] = useState(false);
  const [sinFoto, setSinFoto] = useState(false);
  const [intento, setIntento] = useState(0);
  const corriendoRef = useRef(false);

  useEffect(() => {
    if (corriendoRef.current) return;
    corriendoRef.current = true;
    void (async () => {
      const sesion = await obtenerSesion();

      // Foto primero (S45-B4.1): si falla, error visible — jamás se
      // pierde la foto en silencio (regla 36).
      let fotoPath: string | undefined;
      if (params.fotoUri && !sinFoto && sesion.ok && sesion.data !== null) {
        const subida = await subirAvatar({ uri: params.fotoUri, userId: sesion.data.user_id });
        if (!subida.ok) {
          corriendoRef.current = false;
          setErrorDeFoto(true);
          setError(t('agregarMascota.errorFoto'));
          return;
        }
        fotoPath = subida.path;
      }

      const r = await agregarMascotaAFamilia({
        nombre_mascota: params.nombre ?? '',
        especie: params.especie ?? '',
        ...(params.fecha
          ? {
              fecha_nacimiento: params.fecha,
              ...(esPrecision(params.precision) ? { precision_fecha: params.precision } : null),
            }
          : null),
        ...(esSexo(params.sexo) ? { sexo: params.sexo } : null),
        ...(fotoPath !== undefined ? { foto_url: fotoPath } : null),
      });

      corriendoRef.current = false;
      if (!r.ok) {
        if (r.codigo === 'sin_familia_activa') {
          // Sin familia no hay alta adicional: el raíz decide (onboarding).
          router.replace('/');
          return;
        }
        setError(r.mensaje);
        return;
      }
      router.replace('/hogar');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  if (error !== undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo={t('agregarMascota.errorTitulo')}
          descripcion={error}
          accion={
            <View style={{ gap: spacing[2] }}>
              <Boton
                etiqueta={t('agregarMascota.probarDeNuevo')}
                onPress={() => {
                  setError(undefined);
                  setErrorDeFoto(false);
                  setIntento((n) => n + 1);
                }}
              />
              {errorDeFoto ? (
                <Boton
                  variante="ghost"
                  etiqueta={t('agregarMascota.continuarSinFoto')}
                  onPress={() => {
                    setError(undefined);
                    setErrorDeFoto(false);
                    setSinFoto(true);
                    setIntento((n) => n + 1);
                  }}
                />
              ) : null}
            </View>
          }
        />
      </View>
    );
  }

  // Ley 13: esqueleto estático que imita el Hogar que viene
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: spacing[12] }}>
      <EsqueletoGrupo etiqueta={t('agregarMascota.guardando')}>
        <View style={{ alignItems: 'center', gap: spacing[3] }}>
          <Esqueleto forma="circulo" alto={96} />
          <Esqueleto forma="linea" ancho="40%" />
          <View style={{ height: spacing[6] }} />
          <Esqueleto forma="bloque" ancho="100%" alto={120} />
        </View>
      </EsqueletoGrupo>
    </View>
  );
}
