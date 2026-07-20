/**
 * MASCOTAS v1 — las vidas que cuidás (S51-B3.3, DISEÑO_EXPERIENCIA
 * §14): historial de mascotas ATENDIDAS (derivado de atenciones
 * cerradas con calidad — relevamiento S51: cerrar la atención no
 * promueve la cita, el derivador honesto es la atención) con acceso
 * directo al detalle icónico. Sin mascotas atendidas: EstadoVacio "en
 * preparación, jamás fracasado" (§2.6 del alma). Dosis baja (test 7).
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AvatarMascota,
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  Tarjeta,
  spacing,
  useTheme,
  type AvatarMascotaEspecie,
} from '@epetplace/ui';
import { obtenerMascotasAtendidas, obtenerMiPrestador, resolverUrlsFotos, type MascotaAtendida } from '@epetplace/api';

import { fechaCortaMono } from '@epetplace/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; mascotas: MascotaAtendida[] };

function esEspecie(v: string | null): v is AvatarMascotaEspecie {
  return v !== null;
}


export default function Mascotas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [urlsFotos, setUrlsFotos] = useState<Map<string, string>>(new Map());

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const r = await obtenerMascotasAtendidas(prestador.data.id);
        if (!vigente) return;
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const paths = r.data.map((m) => m.foto_url).filter((p): p is string => typeof p === 'string' && p.length > 0);
        if (paths.length > 0) setUrlsFotos(await resolverUrlsFotos(paths));
        if (vigente) setPantalla({ estado: 'listo', mascotas: r.data });
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  return (
    // S59-B1 (safe area): el Encabezado ya absorbe y PINTA el inset superior
    // — el SafeAreaView top lo duplicaba (doble banda de papel arriba).
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}>
        <Encabezado variante="portada" saludo={t('mascotas.titulo')} />

        {pantalla.estado === 'cargando' && (
          <Tarjeta elevacion="plana">
            <EsqueletoGrupo>
              <View style={{ gap: spacing[4] }}>
                {[0, 1].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <Esqueleto forma="circulo" alto={40} />
                    <View style={{ flex: 1, gap: spacing[2] }}>
                      <Esqueleto forma="linea" ancho="50%" />
                      <Esqueleto forma="linea" ancho="30%" />
                    </View>
                  </View>
                ))}
              </View>
            </EsqueletoGrupo>
          </Tarjeta>
        )}

        {pantalla.estado === 'error' && (
          <EstadoVacio
            titulo={t('mascotas.error')}
            descripcion={t('mascotas.errorDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('agenda.reintentar')} onPress={() => setPantalla({ estado: 'cargando' })} />}
          />
        )}

        {pantalla.estado === 'listo' && pantalla.mascotas.length === 0 && (
          // §2.6: en preparación, jamás fracasado
          <EstadoVacio titulo={t('mascotas.vacio')} descripcion={t('mascotas.vacioDetalle')} />
        )}

        {pantalla.estado === 'listo' && pantalla.mascotas.length > 0 && (
          <Tarjeta elevacion="sm" relleno="ninguno">
            {pantalla.mascotas.map((m, i) => (
              <View key={m.mascota_id}>
                {i > 0 && <Separador indentacion={spacing[3] + 40 + spacing[3]} />}
                <Celda
                  interactiva
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/mascota/[mascotaId]', params: { mascotaId: m.mascota_id } })}
                  titulo={m.nombre}
                  subtitulo={m.atenciones_total === 1 ? t('mascotas.unaAtencion') : t('mascotas.atenciones', { n: m.atenciones_total })}
                  inicio={
                    <AvatarMascota
                      nombre={m.nombre}
                      fotoUrl={m.foto_url ? urlsFotos.get(m.foto_url) : undefined}
                      especie={esEspecie(m.especie) ? m.especie : undefined}
                      tamano="sm"
                    />
                  }
                  metadataMono={m.ultima_atencion !== null ? fechaCortaMono((m.ultima_atencion).slice(0, 10), idioma) : undefined}
                />
              </View>
            ))}
          </Tarjeta>
        )}
      </ScrollView>
    </View>
  );
}
