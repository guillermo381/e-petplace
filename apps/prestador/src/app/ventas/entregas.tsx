/**
 * MIS ENTREGAS DE HOY — la lista del repartidor (S96-C · C-B4 ·
 * LETRA_RECORRIDO §9.1).
 *
 * BOCETO M1:
 *  · TESIS: «Lo que te toca llevar, en orden. Nada más.»
 *  · FIRMA: la AUSENCIA — sin catálogo, sin otros pedidos, sin monto,
 *    sin una palabra de la mascota (§9.2). La lista es corta porque el
 *    alcance es corto, y eso ES el diseño.
 *  · CHANEL: la fila no lleva monto ni ítems (no son del repartidor);
 *    el estado solo habla cuando algo salió mal.
 *  · ESTADOS: cargando · error · vacío honesto · listo.
 *
 * QUÉ VE: lo decide la RLS de `envios` (el brazo del asignado) — este
 * archivo no filtra por persona porque no puede saber más que el
 * servidor. Un no-repartidor ve el vacío honesto, no un error.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  useTheme,
  spacing,
} from '@epetplace/ui';
import { misEntregasAsignadas, type EntregaAsignada } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { horaCorta } from '@/lib/ventas-formato';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; entregas: EntregaAsignada[] };

export default function EntregasRepartidor() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await misEntregasAsignadas();
        if (!vigente) return;
        if (!r.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({ estado: 'listo', entregas: r.data });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('ventas.entregas.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={72} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.comunes.errorTitulo')}
            descripcion={t('ventas.comunes.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('ventas.comunes.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.entregas.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ventas.entregas.vacioTitulo')}
            descripcion={t('ventas.entregas.vacioDetalle')}
          />
        </View>
      )}

      {pantalla.estado === 'listo' && pantalla.entregas.length > 0 && (
        <ScrollView
          contentContainerStyle={{
            padding: spacing[4],
            paddingBottom: insets.bottom + spacing[8],
          }}
        >
          <Tarjeta relleno="ninguno">
            {pantalla.entregas.map((e, i) => (
              <View key={e.envio_id}>
                {i > 0 && <Separador />}
                <Celda
                  titulo={e.destino_direccion}
                  subtitulo={
                    e.estado === 'fallido'
                      ? t('ventas.desvios.noLlego')
                      : e.intentos_entrega > 1
                        ? t('ventas.entregas.intento', { n: e.intentos_entrega })
                        : (e.destino_referencia ?? undefined)
                  }
                  metadataMono={
                    e.promesa_desde !== null && e.promesa_hasta !== null
                      ? `${horaCorta(e.promesa_desde)}–${horaCorta(e.promesa_hasta)}`
                      : undefined
                  }
                  interactiva
                  accessibilityRole="button"
                  onPress={() => router.push(`/ventas/entrega/${e.envio_id}`)}
                />
              </View>
            ))}
          </Tarjeta>
        </ScrollView>
      )}
    </View>
  );
}
