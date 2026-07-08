/**
 * Onboarding · cierre (S45-B4) — la llamada atómica:
 * crearFamiliaConPrimeraMascota. Carga por Ley 13 (esqueleto estático
 * imitando el Home que viene); error con voz humana + reintento.
 * El nombre de la familia sale del nombre del dueño (user_metadata).
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
import { crearFamiliaConPrimeraMascota, obtenerSesion } from '@epetplace/api';

import { esPrecision, esSexo } from '@/lib/params';
import { subirAvatar } from '@/lib/subir-avatar';

export default function Cierre() {
  const router = useRouter();
  const { theme } = useTheme();
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
      const nombreDueno = sesion.ok && sesion.data !== null ? sesion.data.nombre : null;

      // Foto primero (S45-B4.1): sube a mascotas/{uid}/ y el vínculo entra
      // por la RPC. Si falla, se frena con error visible — jamás se pierde
      // la foto en silencio (regla 36).
      let fotoUrl: string | undefined;
      if (params.fotoUri && !sinFoto && sesion.ok && sesion.data !== null) {
        const subida = await subirAvatar({ uri: params.fotoUri, userId: sesion.data.user_id });
        if (!subida.ok) {
          corriendoRef.current = false;
          setErrorDeFoto(true);
          setError('La foto no se pudo subir. Podés probar de nuevo o seguir sin ella por ahora.');
          return;
        }
        fotoUrl = subida.fotoUrl;
      }

      const r = await crearFamiliaConPrimeraMascota({
        nombre_familia: nombreDueno !== null ? `Familia de ${nombreDueno}` : 'Mi familia',
        nombre_mascota: params.nombre ?? '',
        especie: params.especie ?? '',
        ...(params.fecha
          ? {
              fecha_nacimiento: params.fecha,
              ...(esPrecision(params.precision) ? { precision_fecha: params.precision } : null),
            }
          : null),
        ...(esSexo(params.sexo) ? { sexo: params.sexo } : null),
        ...(fotoUrl !== undefined ? { foto_url: fotoUrl } : null),
      });

      corriendoRef.current = false;
      if (!r.ok) {
        if (r.codigo === 'familia_ya_existe') {
          // Idempotencia de UX: si ya existe (doble tap, reintento), al Home.
          router.replace('/home');
          return;
        }
        setError(r.mensaje);
        return;
      }
      router.replace('/home');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  if (error !== undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
        <EstadoVacio
          titulo="No pudimos guardar todavía"
          descripcion={error}
          accion={
            <View style={{ gap: spacing[2] }}>
              <Boton
                etiqueta="Probar de nuevo"
                onPress={() => {
                  setError(undefined);
                  setErrorDeFoto(false);
                  setIntento((n) => n + 1);
                }}
              />
              {errorDeFoto ? (
                <Boton
                  variante="ghost"
                  etiqueta="Continuar sin foto"
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

  // Ley 13: esqueleto estático que imita el Home que viene (avatar + nombre + timeline)
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, padding: spacing[5], paddingTop: spacing[12] }}>
      <EsqueletoGrupo etiqueta="Guardando">
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
