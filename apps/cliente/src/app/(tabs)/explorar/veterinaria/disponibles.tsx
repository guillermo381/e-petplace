/**
 * VETERINARIA — EL QUIÉN (S68-A2): vets reales que pueden la ventana
 * elegida, con el PRECIO y la DURACIÓN de SU oferta (server-side — el
 * cliente pinta, jamás calcula). La mascota llegó elegida del CUÁNDO.
 *
 * EL DÓNDE: cada fila dice la dirección de la clínica, solo lectura y
 * NULL-honesta. La urgencia a domicilio es SU PROPIO tipo — el motor la
 * porta como modalidad 'domicilio' y el checkout hereda D-339 VERBATIM.
 *
 * ESCALERA (§4b): peldaño 0 = nadie puede, vuelta barata al CUÁNDO ·
 * peldaño 1 = disponibles REALES con precio/duración de verdad (snapshot
 * al crear el hold) · peldaño 2 = el techo de especies del tipo gobierna
 * la elegibilidad (§1bis).
 */

import { useCallback, useState } from 'react';
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
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  crearBloqueoAgenda,
  obtenerPerfilMascota,
  obtenerVeterinariosDisponibles,
  type PerfilMascota,
  type VeterinarioDisponible,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { vozServicio } from '@/lib/voz-servicio';

export default function VeterinariaDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ fecha: string; hora: string; tipoServicio: string; mascotaId: string }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const tipoServicio = typeof params.tipoServicio === 'string' ? params.tipoServicio : '';
  const mascotaId = typeof params.mascotaId === 'string' ? params.mascotaId : '';
  // S68: la urgencia a domicilio viaja al checkout con su modalidad —
  // el motor ya la portó en el hold; el checkout hereda D-339.
  const esDomicilio = tipoServicio === 'urgencia_domicilio';

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  const [disponibles, setDisponibles] = useState<VeterinarioDisponible[] | 'cargando' | 'error'>('cargando');
  const [creandoHold, setCreandoHold] = useState(false);

  const cargarVets = useCallback(() => {
    setDisponibles('cargando');
    void obtenerVeterinariosDisponibles({ fecha, hora, tipo_servicio: tipoServicio, mascota_id: mascotaId }).then((r) => {
      setDisponibles(r.ok ? r.data : 'error');
    });
  }, [fecha, hora, tipoServicio, mascotaId]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerPerfilMascota(mascotaId).then((r) => {
        if (!vigente) return;
        setPerfil(r.ok ? r.data : 'error');
      });
      cargarVets();
      return () => {
        vigente = false;
      };
    }, [mascotaId, cargarVets]),
  );

  // El hold nace acá: invisible al prestador hasta que el pago confirme.
  const crearHold = useCallback(
    async (v: VeterinarioDisponible) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: v.prestador_id,
        prestador_servicio_id: v.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha,
        hora,
      });
      setCreandoHold(false);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') cargarVets();
        // urgencia que cruzó la medianoche: el CUÁNDO recalcula HOY
        if (r.codigo === 'urgencia_solo_hoy') router.back();
        return;
      }
      router.push({
        pathname: '/explorar/veterinaria/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: v.prestador_nombre,
          servicioNombre: vozServicio(t, tipoServicio, v.servicio_nombre) ?? v.servicio_nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(r.data.duracion_minutos),
          direccion: v.direccion ?? '',
          ciudad: v.ciudad ?? '',
          modalidad: esDomicilio ? 'domicilio' : 'local',
        },
      });
    },
    [creandoHold, fecha, hora, mascotaId, tipoServicio, esDomicilio, t, cargarVets, mostrar],
  );

  const mascota = typeof perfil === 'object' ? perfil.mascota : null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('veterinaria.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina — la duración no viaja:
            es de cada vet (su oferta) */}
        <Celda
          titulo={mascota !== null ? t('veterinaria.ventanaPara', { nombre: mascota.nombre }) : t('veterinaria.titulo')}
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
            titulo={t('veterinaria.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargarVets} />}
          />
        ) : disponibles.length === 0 ? (
          // Peldaño 0 — nadie puede: vuelta barata al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="veterinaria" tamano={48} />}
            titulo={t('explorar.nadiePuede')}
            descripcion={t('explorar.nadiePuedeDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {disponibles.map((v, i) => (
              <View key={v.prestador_servicio_id}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={v.prestador_nombre}
                  subtitulo={
                    esDomicilio
                      ? t('veterinaria.vaAlHogar')
                      : v.direccion !== null
                        ? [v.direccion, v.ciudad].filter(Boolean).join(' · ')
                        : t('veterinaria.enSuClinica')
                  }
                  metadataMono={`$${v.precio.toFixed(2)} · ${v.duracion_minutos} min`}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => void crearHold(v)}
                />
              </View>
            ))}
          </Tarjeta>
        )}

        {Array.isArray(disponibles) && disponibles.length > 0 ? (
          // el precio es el de cada vet para este servicio — se dice sereno
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * 1.4),
              color: theme.text.secondary,
            }}
          >
            {t('veterinaria.precioDeOferta')}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
