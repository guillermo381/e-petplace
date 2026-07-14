/**
 * GROOMING — EL QUIÉN (S60-A1): groomers reales que pueden la ventana
 * elegida, con el PRECIO y la DURACIÓN YA RESUELTOS server-side para
 * ESTA mascota (servicio × talla del perfil + extra si pelaje largo —
 * condición 2 del visto: el cliente pinta, jamás calcula). La mascota
 * llegó elegida del CUÁNDO; acá no hay selector ni pregunta social
 * (P19 es del paseo — el guard no viaja a grooming).
 *
 * EL DÓNDE (condición 4): grooming v1 es EN EL LOCAL — cada fila dice
 * la dirección de la sede del groomer, solo lectura y NULL-honesta
 * (sin dirección declarada no se inventa nada).
 *
 * CINTURÓN de §3: si talla o pelaje llegaran NULL (deep link, edición
 * cruzada), la TallaPelajeHoja salta ANTES de pedir precios — el rebote
 * server talla_no_declarada es red, no flujo.
 *
 * ESCALERA (§4b): peldaño 0 = nadie puede, vuelta barata al CUÁNDO ·
 * peldaño 1 = disponibles REALES con precio/duración de verdad
 * (snapshot al crear el hold) · peldaño 2 = la talla/pelaje del PERFIL
 * gobiernan el precio pintado.
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
  obtenerGroomersDisponibles,
  obtenerPerfilMascota,
  type GroomerDisponible,
  type PerfilMascota,
} from '@epetplace/api';
import { TallaPelajeHoja } from '@/components/talla-pelaje-hoja';
import { useTraduccion } from '@/i18n';

export default function GroomingDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{ fecha: string; hora: string; tipoServicio: string; mascotaId: string }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const tipoServicio = typeof params.tipoServicio === 'string' ? params.tipoServicio : '';
  const mascotaId = typeof params.mascotaId === 'string' ? params.mascotaId : '';

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  const [disponibles, setDisponibles] = useState<GroomerDisponible[] | 'cargando' | 'error'>('cargando');
  const [tallaHoja, setTallaHoja] = useState(false);
  const [creandoHold, setCreandoHold] = useState(false);

  const cargarGroomers = useCallback(() => {
    setDisponibles('cargando');
    void obtenerGroomersDisponibles({ fecha, hora, tipo_servicio: tipoServicio, mascota_id: mascotaId }).then((r) => {
      setDisponibles(r.ok ? r.data : 'error');
    });
  }, [fecha, hora, tipoServicio, mascotaId]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void obtenerPerfilMascota(mascotaId).then((r) => {
        if (!vigente) return;
        setPerfil(r.ok ? r.data : 'error');
        // el cinturón de §3: perfil incompleto → la Hoja ANTES de precios
        if (r.ok && (r.data.mascota.talla === null || r.data.mascota.pelaje === null)) {
          setTallaHoja(true);
          return;
        }
        cargarGroomers();
      });
      return () => {
        vigente = false;
      };
    }, [mascotaId, cargarGroomers]),
  );

  // El hold nace acá: invisible al prestador hasta que el pago confirme.
  // El precio/duración del snapshot los resuelve el SERVER por talla —
  // idénticos a los pintados (assert T5 de la migración los cruza).
  const crearHold = useCallback(
    async (g: GroomerDisponible) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: g.prestador_id,
        prestador_servicio_id: g.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha,
        hora,
      });
      setCreandoHold(false);
      if (!r.ok) {
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') cargarGroomers();
        return;
      }
      router.push({
        pathname: '/explorar/grooming/checkout',
        params: {
          citaId: r.data.cita_id,
          expiraEn: r.data.expira_en,
          precio: String(r.data.precio),
          prestadorNombre: g.prestador_nombre,
          servicioNombre: g.servicio_nombre,
          fecha: r.data.fecha,
          hora: r.data.hora,
          duracion: String(r.data.duracion_minutos),
          direccion: g.direccion ?? '',
          ciudad: g.ciudad ?? '',
        },
      });
    },
    [creandoHold, fecha, hora, mascotaId, cargarGroomers, mostrar],
  );

  const mascota = typeof perfil === 'object' ? perfil.mascota : null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('grooming.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[8], gap: spacing[3] }}>
        {/* la ventana elegida, en voz de máquina — la duración no viaja:
            es de cada groomer (servicio × talla) */}
        <Celda
          titulo={mascota !== null ? t('grooming.ventanaPara', { nombre: mascota.nombre }) : t('grooming.titulo')}
          metadataMono={`${fecha} · ${hora}`}
        />
        <Separador />

        {disponibles === 'cargando' || perfil === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : disponibles === 'error' || perfil === 'error' ? (
          <EstadoVacio
            titulo={t('grooming.errorTitulo')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargarGroomers} />}
          />
        ) : disponibles.length === 0 ? (
          // Peldaño 0 — nadie puede: vuelta barata al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="grooming" tamano={48} />}
            titulo={t('explorar.nadiePuede')}
            descripcion={t('explorar.nadiePuedeDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {disponibles.map((g, i) => (
              <View key={g.prestador_servicio_id}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={g.prestador_nombre}
                  subtitulo={
                    g.direccion !== null
                      ? [g.direccion, g.ciudad].filter(Boolean).join(' · ')
                      : t('grooming.enSuLocal')
                  }
                  metadataMono={`$${g.precio.toFixed(2)} · ${g.duracion_minutos} min`}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => void crearHold(g)}
                />
              </View>
            ))}
          </Tarjeta>
        )}

        {Array.isArray(disponibles) && disponibles.length > 0 ? (
          // el precio pintado ya es el de SU mascota — se dice sereno
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: Math.round(typography.size.sm * 1.4),
              color: theme.text.secondary,
            }}
          >
            {mascota !== null ? t('grooming.precioDeSuPerfil', { nombre: mascota.nombre }) : null}
          </Text>
        ) : null}
      </ScrollView>

      {/* §3 — el cinturón: declarar SIEMPRE continúa (recarga precios) */}
      <TallaPelajeHoja
        visible={tallaHoja}
        mascota={
          mascota !== null
            ? { id: mascota.id, nombre: mascota.nombre, talla: mascota.talla, pelaje: mascota.pelaje }
            : null
        }
        onCerrar={() => {
          setTallaHoja(false);
          // sin declarar no hay precio personal: vuelta honesta al CUÁNDO
          if (mascota !== null && (mascota.talla === null || mascota.pelaje === null)) router.back();
        }}
        onDeclarada={(talla, pelaje) => {
          setPerfil((prev) =>
            typeof prev === 'object' ? { ...prev, mascota: { ...prev.mascota, talla, pelaje } } : prev,
          );
          setTallaHoja(false);
          cargarGroomers();
        }}
      />
    </SafeAreaView>
  );
}
