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

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  useTheme,
} from '@epetplace/ui';
import {
  obtenerAdiestradoresDisponibles,
  type OfertaAdiestrador,
  obtenerPerfilesPublicos,
  type PerfilPublico,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { PreviewPrestador } from '@/components/preview-prestador';
import { useReservaAdiestramiento } from '@/lib/reserva/adiestramiento';

export default function AdiestramientoDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
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
  /** S91-C · el enriquecimiento del preview, de `v_prestadores_publicos`
   *  (jamás la tabla). Carga SECUNDARIA: la fila se pinta con lo que el
   *  lector de disponibilidad ya trajo y se completa cuando llega — hacer
   *  esperar la disponibilidad por una foto sería D-531 otra vez. */
  const [perfiles, setPerfiles] = useState<Record<string, PerfilPublico>>({});

  // Los perfiles de los que SE ESTÁN OFRECIENDO — ni uno más.
  useEffect(() => {
    if (!Array.isArray(disponibles)) return;
    const ids = [...new Set(disponibles.map((x) => x.prestador_id))];
    if (ids.length === 0) return;
    let vigente = true;
    void obtenerPerfilesPublicos(ids).then((r) => {
      if (!vigente || !r.ok) return;
      setPerfiles(Object.fromEntries(r.data.map((p) => [p.id, p])));
    });
    return () => {
      vigente = false;
    };
  }, [disponibles]);


  const cargar = useCallback(() => {
    setDisponibles('cargando');
    void obtenerAdiestradoresDisponibles(fecha, hora, mascotaId).then((r) => {
      setDisponibles(r.ok ? r.data.filter((o) => o.comprable === comprable) : 'error');
    });
  }, [fecha, hora, mascotaId, comprable]);

  /* ⚡ D-730 · EL FLUJO YA NO VIVE ACÁ — vive en `lib/reserva/adiestramiento`
     y esta pantalla es UNO de sus dos consumidores; el otro es la ficha del
     prestador, que desde hoy **reserva de verdad** en vez de pedirle a esta
     lista que reserve por ella.
     ☠️ CON ESTO MURIÓ `tomarPedido()`: ya no hay pedido que volver a buscar,
     porque ya no hay vuelta. El efecto de foco que lo consumía se fue entero. */
  const { reservarSesion, elegirPrograma, creandoHold } = useReservaAdiestramiento(
    { fecha, hora, mascotaId, mascotaNombre },
    cargar,
  );

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

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('adiestramiento.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
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
                  <PreviewPrestador
                    prestadorId={o.prestador_id}
                  ofertaId={o.prestador_servicio_id}
                    nombre={o.prestador_nombre}
                    oficio={t('hogar.railAdiestramiento')}
                    contexto={o.direccion !== null
                        ? [o.direccion, o.ciudad].filter(Boolean).join(' · ')
                        : t('adiestramiento.lugarPorConfirmar')}
                    precio={`$${o.precio.toFixed(2)} · ${o.duracion_minutos} min`}
                    perfil={perfiles[o.prestador_id]}
                    /* ⚡ D-730 · la ventana viaja con el tap: sin esto la ficha
                       no puede reservar, porque no sabe CUÁNDO ni PARA QUIÉN. */
                    contextoReserva={{ oficio: 'adiestramiento', fecha, hora, mascotaId, mascotaNombre, comprable }}
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
