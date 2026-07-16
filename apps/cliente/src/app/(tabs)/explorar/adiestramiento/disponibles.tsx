/**
 * ADIESTRAMIENTO — EL QUIÉN (S63-A Bloque 3, gemela del QUIÉN del
 * grooming S60-A1): adiestradores reales que pueden la ventana elegida,
 * con el comprable YA resuelto server-side (7.13: no llega quien no
 * puede cobrar). Dos ramas por la forma elegida en el QUÉ (§8):
 *  · SESIÓN — tap crea el HOLD del chasis compartido y va al checkout.
 *  · PROGRAMA — cada fila es UN programa declarado (nivel + N sesiones
 *    + precio propio, §4/§12.4); tap va al RESUMEN de compra (§12.2:
 *    el dueño entiende que compromete N fechas ANTES de pagar) — sin
 *    hold: la compra es atómica en contratar_programa.
 *
 * TESIS: "Estos adiestradores pueden de verdad — y el programa te dice
 * qué es antes de pedirte plata."
 * FIRMA: la fila del programa dice nivel y N sesiones ANTES del precio
 * (jerarquía del contenido sobre el número).
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  crearBloqueoAgenda,
  obtenerAdiestradoresDisponibles,
  type OfertaAdiestrador,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

export default function AdiestramientoDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{
    fecha: string;
    hora: string;
    comprable: string;
    mascotaId: string;
    mascotaNombre?: string;
  }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const comprable: 'sesion' | 'programa' = params.comprable === 'programa' ? 'programa' : 'sesion';
  const mascotaId = typeof params.mascotaId === 'string' ? params.mascotaId : '';
  const mascotaNombre = typeof params.mascotaNombre === 'string' ? params.mascotaNombre : '';

  const [disponibles, setDisponibles] = useState<OfertaAdiestrador[] | 'cargando' | 'error'>('cargando');
  const [creandoHold, setCreandoHold] = useState(false);

  const cargar = useCallback(() => {
    setDisponibles('cargando');
    void obtenerAdiestradoresDisponibles(fecha, hora, mascotaId).then((r) => {
      setDisponibles(r.ok ? r.data.filter((o) => o.comprable === comprable) : 'error');
    });
  }, [fecha, hora, mascotaId, comprable]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const vozNivel = (nivel: string | null): string | null => {
    switch (nivel) {
      case 'basico':
        return t('adiestramiento.nivelBasico');
      case 'medio':
        return t('adiestramiento.nivelMedio');
      case 'experto':
        return t('adiestramiento.nivelExperto');
      case 'especialidad':
        return t('adiestramiento.nivelEspecialidad');
      default:
        return null;
    }
  };

  // SESIÓN: el hold del chasis compartido (invisible al prestador hasta
  // que el pago confirme) → checkout compartido con la voz del oficio.
  const reservarSesion = useCallback(
    async (o: OfertaAdiestrador) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: o.prestador_id,
        prestador_servicio_id: o.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha,
        hora,
      });
      setCreandoHold(false);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') cargar();
        return;
      }
      router.push({
        pathname: '/explorar/adiestramiento/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: o.prestador_nombre,
          servicioNombre: vozServicio(t, o.tipo_servicio, o.nombre) ?? o.nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(r.data.duracion_minutos),
          direccion: o.direccion ?? '',
          ciudad: o.ciudad ?? '',
        },
      });
    },
    [creandoHold, fecha, hora, mascotaId, t, cargar, mostrar],
  );

  // PROGRAMA: sin hold — el resumen §12.2 primero, la compra atómica allá.
  const elegirPrograma = useCallback(
    (o: OfertaAdiestrador) => {
      if (o.programa_id === null || o.n_sesiones === null || o.vigencia_dias === null) return;
      router.push({
        pathname: '/explorar/adiestramiento/confirmar-programa',
        params: {
          prestadorId: o.prestador_id,
          servicioId: o.prestador_servicio_id,
          programaId: o.programa_id,
          mascotaId,
          mascotaNombre,
          fecha,
          hora,
          programaNombre: o.nombre,
          nivel: o.nivel ?? '',
          nSesiones: String(o.n_sesiones),
          vigenciaDias: String(o.vigencia_dias),
          precio: String(o.precio),
          duracion: String(o.duracion_minutos),
          prestadorNombre: o.prestador_nombre,
        },
      });
    },
    [fecha, hora, mascotaId, mascotaNombre],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adiestramiento.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina */}
        <Celda
          titulo={mascotaNombre.length > 0 ? t('adiestramiento.ventanaPara', { nombre: mascotaNombre }) : t('adiestramiento.titulo')}
          metadataMono={`${fecha} · ${hora}`}
        />
        <Separador />

        {disponibles === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : disponibles === 'error' ? (
          <EstadoVacio
            titulo={t('adiestramiento.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : disponibles.length === 0 ? (
          // Peldaño 0 — nadie puede: vuelta barata al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="training" tamano={48} />}
            titulo={t('explorar.nadiePuede')}
            descripcion={t('explorar.nadiePuedeDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {disponibles.map((o, i) => (
              <View key={`${o.prestador_servicio_id}-${o.programa_id ?? 'sesion'}`}>
                {i > 0 ? <Separador /> : null}
                {o.comprable === 'sesion' ? (
                  <Celda
                    titulo={o.prestador_nombre}
                    subtitulo={
                      o.direccion !== null
                        ? [o.direccion, o.ciudad].filter(Boolean).join(' · ')
                        : t('adiestramiento.lugarPorConfirmar')
                    }
                    metadataMono={`$${o.precio.toFixed(2)} · ${o.duracion_minutos} min`}
                    interactiva
                    accessibilityRole="button"
                    onPress={() => void reservarSesion(o)}
                  />
                ) : (
                  // FIRMA: el programa dice QUÉ es (nombre + nivel + N)
                  // antes del número — el contenido preside.
                  <Celda
                    titulo={o.nombre}
                    subtitulo={[
                      o.prestador_nombre,
                      vozNivel(o.nivel),
                      o.n_sesiones !== null ? t('adiestramiento.sesionesN', { n: String(o.n_sesiones) }) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    metadataMono={`$${o.precio.toFixed(2)} · ${o.duracion_minutos} min`}
                    interactiva
                    accessibilityRole="button"
                    onPress={() => elegirPrograma(o)}
                  />
                )}
              </View>
            ))}
          </Tarjeta>
        )}

        {Array.isArray(disponibles) && disponibles.length > 0 && comprable === 'programa' ? (
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * 1.4),
              color: theme.text.secondary,
            }}
          >
            {t('adiestramiento.comprableProgramaVoz')}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
