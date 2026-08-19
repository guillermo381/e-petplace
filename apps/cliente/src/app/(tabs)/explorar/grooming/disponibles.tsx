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
  obtenerGroomersDisponibles,
  obtenerPerfilMascota,
  type GroomerDisponible,
  type PerfilMascota,
  obtenerPerfilesPublicos,
  type PerfilPublico,
} from '@epetplace/api';
import { TallaPelajeHoja } from '@/components/talla-pelaje-hoja';
import { useTraduccion } from '@/i18n';
import { PreviewPrestador } from '@/components/preview-prestador';
import { useReservaGrooming } from '@/lib/reserva/grooming';

export default function GroomingDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ fecha: string; hora: string; tipoServicio: string; mascotaId: string; modalidad?: string }>();
  const fecha = typeof params.fecha === 'string' ? params.fecha : '';
  const hora = typeof params.hora === 'string' ? params.hora : '';
  const tipoServicio = typeof params.tipoServicio === 'string' ? params.tipoServicio : '';
  const mascotaId = typeof params.mascotaId === 'string' ? params.mascotaId : '';
  // S61-A6 (D-392): la modalidad viaja del QUÉ; ausente = local.
  const modalidad: 'local' | 'domicilio' = params.modalidad === 'domicilio' ? 'domicilio' : 'local';

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  const [disponibles, setDisponibles] = useState<GroomerDisponible[] | 'cargando' | 'error'>('cargando');
  const [tallaHoja, setTallaHoja] = useState(false);
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


  const cargarGroomers = useCallback(() => {
    setDisponibles('cargando');
    void obtenerGroomersDisponibles({ fecha, hora, tipo_servicio: tipoServicio, mascota_id: mascotaId, modalidad }).then((r) => {
      setDisponibles(r.ok ? r.data : 'error');
    });
  }, [fecha, hora, tipoServicio, mascotaId, modalidad]);

  /* ⚡ D-730 · EL FLUJO YA NO VIVE ACÁ — vive en `lib/reserva/grooming` y esta
     pantalla es UNO de sus dos consumidores; el otro es la ficha del prestador,
     que desde hoy reserva de verdad.
     ☠️ Y con eso murió el efecto que consumía `tomarPedido()`: ya no hay pedido
     que volver a buscar, porque ya no hay vuelta. */
  const { crearHold, creandoHold } = useReservaGrooming(
    { fecha, hora, mascotaId, tipoServicio, modalidad },
    cargarGroomers,
  );

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

  const mascota = typeof perfil === 'object' ? perfil.mascota : null;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('grooming.quienTitulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
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
                <PreviewPrestador
                    prestadorId={g.prestador_id}
                  ofertaId={g.prestador_servicio_id}
                    nombre={g.prestador_nombre}
                    oficio={t('hogar.railEstetica')}
                    contexto={g.direccion !== null
                      ? [g.direccion, g.ciudad].filter(Boolean).join(' · ')
                      : t('grooming.enSuLocal')}
                    precio={`$${g.precio.toFixed(2)} · ${g.duracion_minutos} min`}
                    perfil={perfiles[g.prestador_id]}
                    /* ⚡ D-730 · la ventana viaja con el tap, para que la ficha
                       pueda reservar en vez de pedirle a esta lista que lo haga. */
                    contextoReserva={{ oficio: 'grooming', fecha, hora, mascotaId, tipoServicio, modalidad }}
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
