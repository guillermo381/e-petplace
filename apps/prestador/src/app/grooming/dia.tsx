// ─────────────────────────────────────────────────────────────────────
// LA VISTA DEL DÍA del groomer — /grooming/dia (S60-B1, §8 DESPUÉS,
// sobre la RPC existente obtener_resumen_dia_grooming). Dosis baja.
//
// TESIS: tu jornada de silla, contada con verdad — cuántas sesiones,
// cuánto trabajo real, y cuáles siguen sin su parte.
// FIRMA: el tiempo de TRABAJO (pausas descontadas por el motor) — el
// dato que ninguna libreta le da al groomer.
//
// Solo atenciones TERMINADAS del día (la letra de la RPC): lo vivo se
// atiende en el HOY; acá se mira lo hecho. Sin métricas en cero — el
// día sin sesiones habla una sola vez.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerMiPrestador,
  obtenerResumenDiaGrooming,
  type ResumenDiaGrooming,
} from '@epetplace/api';

import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; resumen: ResumenDiaGrooming };

function hoyLocal(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function hhmm(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DiaGrooming() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTraduccion();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setPantalla({ estado: 'cargando' });
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      setPantalla({ estado: 'error', mensaje: sesion.mensaje });
      return;
    }
    const prestador = await obtenerMiPrestador();
    if (!prestador.ok) {
      setPantalla({ estado: 'error', mensaje: prestador.mensaje });
      return;
    }
    const r = await obtenerResumenDiaGrooming({ prestador_id: prestador.data.id, fecha: hoyLocal() });
    if (!r.ok) {
      setPantalla({ estado: 'error', mensaje: r.mensaje });
      return;
    }
    setPantalla({ estado: 'listo', resumen: r.data });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar(true);
    }, [cargar]),
  );

  const resumen = pantalla.estado === 'listo' ? pantalla.resumen : null;

  const vozSecundaria = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.4,
    color: theme.text.secondary,
  } as const;
  const dato = {
    fontFamily: typography.family.mono.regular,
    fontSize: typography.size.sm,
    letterSpacing: typography.tracking.mono,
    color: theme.text.primary,
  } as const;

  function Fila({ rotulo, valor }: { rotulo: string; valor: string }) {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
        <Text style={vozSecundaria}>{rotulo}</Text>
        <Text style={dato}>{valor}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] }}>
        <Encabezado
          variante="navegacion"
          titulo={t('citaGrooming.diaTitulo')}
          atras
          onAtras={() => router.back()}
        />

        {pantalla.estado === 'cargando' && (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" alto={120} />
              <Esqueleto forma="bloque" alto={96} />
            </View>
          </EsqueletoGrupo>
        )}

        {pantalla.estado === 'error' && (
          <Tarjeta tinte="danger" relleno="amplio">
            <View style={{ gap: spacing[3] }}>
              <Text
                style={{
                  fontFamily: typography.family.sans.regular,
                  fontSize: typography.size.base,
                  lineHeight: typography.size.base * 1.4,
                  color: theme.status.dangerText,
                }}
              >
                {pantalla.mensaje}
              </Text>
              <View style={{ alignSelf: 'flex-start' }}>
                <Boton variante="secundario" tamaño="sm" etiqueta={t('agenda.reintentar')} onPress={() => void cargar()} />
              </View>
            </View>
          </Tarjeta>
        )}

        {resumen && resumen.total_atenciones === 0 && (
          <EstadoVacio registro="seccion" titulo={t('citaGrooming.diaVacio')} descripcion={t('agenda.vacioDetalle')} />
        )}

        {resumen && resumen.total_atenciones > 0 && (
          <>
            <Tarjeta relleno="amplio">
              <View style={{ gap: spacing[3] }}>
                <Fila rotulo={t('citaGrooming.diaSesiones')} valor={String(resumen.total_atenciones)} />
                <Fila rotulo={t('citaGrooming.diaCerradas')} valor={String(resumen.cerradas_con_calidad)} />
                {resumen.terminadas_sin_cerrar > 0 && (
                  <Fila rotulo={t('citaGrooming.diaPorCerrar')} valor={String(resumen.terminadas_sin_cerrar)} />
                )}
                <Fila
                  rotulo={t('citaGrooming.diaTiempo')}
                  valor={t('citaGrooming.minutosSufijo', { n: Math.round(resumen.tiempo_total_minutos) })}
                />
              </View>
            </Tarjeta>

            <Tarjeta relleno="ninguno">
              {resumen.atenciones.map((a, i) => {
                const citaId = a.cita_id;
                const comunes = {
                  titulo: t('citaGrooming.titulo'),
                  metadataMono: `${hhmm(a.terminada_en)} · ${t('citaGrooming.minutosSufijo', { n: Math.round(a.duracion_minutos) })}`,
                  fin: (
                    <Insignia
                      estado={a.estado === 'cerrada_con_calidad' ? 'alDia' : ('proximo' as const)}
                      etiqueta={
                        a.estado === 'cerrada_con_calidad'
                          ? t('agenda.estadoCerrado')
                          : t('agenda.estadoPorCerrar')
                      }
                      tamaño="sm"
                    />
                  ),
                } as const;
                return (
                  <View key={a.grooming_id}>
                    {i > 0 && <Separador />}
                    {citaId !== null ? (
                      <Celda
                        interactiva
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({ pathname: '/grooming/cita/[citaId]/cierre', params: { citaId } })
                        }
                        {...comunes}
                      />
                    ) : (
                      <Celda {...comunes} />
                    )}
                  </View>
                );
              })}
            </Tarjeta>
          </>
        )}
      </ScrollView>
    </View>
  );
}
