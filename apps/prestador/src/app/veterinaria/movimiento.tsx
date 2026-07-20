// EL MOVIMIENTO (S70-B2-v2, la ley firmada "HOY acciona, NEGOCIO gestiona"):
// el listado de presupuestos del NEGOCIO (D-440), la relectura global de "¿qué
// pasó con lo que armé?". Entra por el tab Negocio. v1 = lista simple sobre
// obtenerPresupuestosPrestador (sin mascotaId → todos los de la cuenta).
//
// TESIS: acá está TODO lo que el negocio coti­zó y en qué quedó.
// FIRMA: el estado por fila (la Insignia que dice el desenlace) — sin adorno.
// CHANEL: sin sub-header decorativo; el techo de navegación basta.

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  useTheme,
  type InsigniaEstado,
} from '@epetplace/ui';
import {
  obtenerMiCuentaComercial,
  obtenerPresupuestosPrestador,
  type EstadoPresupuesto,
  type PresupuestoPrestador,
} from '@epetplace/api';
import { fechaCortaMono, type IdiomaSoportado } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; lista: PresupuestoPrestador[] };

export default function Movimiento() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });

  const INSIGNIA: Record<EstadoPresupuesto, { estado: InsigniaEstado; etiqueta: string }> = {
    borrador: { estado: 'info', etiqueta: t('presupuesto.estadoBorrador') },
    enviado: { estado: 'proximo', etiqueta: t('presupuesto.estadoEnviado') },
    aprobado: { estado: 'alDia', etiqueta: t('presupuesto.estadoAprobado') },
    rechazado: { estado: 'atencion', etiqueta: t('presupuesto.estadoRechazado') },
    vencido: { estado: 'atencion', etiqueta: t('presupuesto.estadoVencido') },
  };

  const cargar = useCallback(async () => {
    setPantalla({ estado: 'cargando' });
    const cta = await obtenerMiCuentaComercial();
    if (!cta.ok || cta.data === null) {
      setPantalla({ estado: 'error' });
      return;
    }
    const r = await obtenerPresupuestosPrestador(cta.data.id);
    if (!r.ok) {
      setPantalla({ estado: 'error' });
      return;
    }
    setPantalla({ estado: 'listo', lista: r.data });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('movimiento.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[10], gap: spacing[4] }}>
        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo etiqueta={t('movimiento.titulo')}>
            <Tarjeta elevacion="reposo" relleno="ninguno">
              {[0, 1, 2].map((i) => (
                <View key={i}>
                  {i > 0 && <Separador />}
                  <View style={{ padding: spacing[3] }}>
                    <Esqueleto forma="bloque" alto={48} />
                  </View>
                </View>
              ))}
            </Tarjeta>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
          <EstadoVacio registro="seccion" titulo={t('movimiento.error')} descripcion={t('movimiento.errorDetalle')} />
        )}

        {pantalla.estado === 'listo' && pantalla.lista.length === 0 && (
          <EstadoVacio registro="seccion" titulo={t('movimiento.vacio')} descripcion={t('movimiento.vacioDetalle')} />
        )}

        {pantalla.estado === 'listo' && pantalla.lista.length > 0 && (
          <Tarjeta elevacion="reposo" relleno="ninguno">
            {pantalla.lista.map((p, i) => {
              const ins = INSIGNIA[p.estado];
              const items = p.items.map((it) => it.nombre).filter(Boolean).join(' · ');
              return (
                <View key={p.id}>
                  {i > 0 && <Separador />}
                  <Celda
                    // El procedimiento preside (voz humana); el monto y la
                    // fecha son dato de máquina — mono (regla de voz Ley 3 +
                    // vara founder "montos en mono").
                    titulo={items || t('movimiento.sinItems')}
                    metadataMono={`$${p.total.toFixed(2)} · ${fechaCortaMono(p.creadoEn, idioma as IdiomaSoportado)}`}
                    fin={<Insignia estado={ins.estado} etiqueta={ins.etiqueta} tamaño="sm" />}
                  />
                </View>
              );
            })}
          </Tarjeta>
        )}
      </ScrollView>
    </View>
  );
}
