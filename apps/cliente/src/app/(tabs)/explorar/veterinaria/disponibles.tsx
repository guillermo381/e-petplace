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
  obtenerPerfilMascota,
  obtenerVeterinariosDisponibles,
  obtenerVitrinaNegocios,
  type PerfilMascota,
  type VeterinarioDisponible,
  obtenerPerfilesPublicos,
  type PerfilPublico,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { useReservaVeterinaria } from '@/lib/reserva/veterinaria';
import { HojaPersonasVet } from '@/components/reserva/hoja-personas-vet';
import { PreviewPrestador } from '@/components/preview-prestador';

export default function VeterinariaDisponibles() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
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

  // S78-A7 (LETRA_VITRINA): qué negocios exponen a sus personas. `null` =
  // no cargó o falló — la pantalla DEGRADA al camino de siempre (hold
  // directo), decisión declarada en el M1: la elección es ACCESORIA por
  // diseño (sin ella la reserva sigue entera); es el caso que D-542 exige
  // decidir uno por uno, y este queda decidido acá.
  const [vitrina, setVitrina] = useState<Record<string, boolean> | null>(null);
  const cargarVets = useCallback(() => {
    setDisponibles('cargando');
    void obtenerVeterinariosDisponibles({ fecha, hora, tipo_servicio: tipoServicio, mascota_id: mascotaId }).then((r) => {
      setDisponibles(r.ok ? r.data : 'error');
      if (r.ok && r.data.length > 0) {
        void obtenerVitrinaNegocios(r.data.map((v) => v.prestador_id)).then((rv) => {
          setVitrina(rv.ok ? rv.data : null);
        });
      }
    });
  }, [fecha, hora, tipoServicio, mascotaId]);

  /* ⚡ D-730 · EL FLUJO YA NO VIVE ACÁ — vive en `lib/reserva/veterinaria`, y su
     Hoja del selector en `components/reserva/hoja-personas-vet`. Esta pantalla
     es UNO de sus dos consumidores; el otro es la ficha del prestador, que
     desde hoy reserva de verdad — con su selector de persona incluido, que era
     lo que hacía imposible mudar esto sin extraerlo.
     ☠️ Y con eso murió el efecto que consumía `tomarPedido()`. */
  const {
    tocarNegocio,
    crearHold,
    creandoHold,
    abriendoSelector,
    hojaPersonas,
    cerrarHoja,
    personaElegida,
    elegirPersona,
    personaRebotada,
  } = useReservaVeterinaria(
    { fecha, hora, mascotaId, tipoServicio, esDomicilio, vitrina },
    cargarVets,
  );

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
                <PreviewPrestador
                    prestadorId={v.prestador_id}
                  ofertaId={v.prestador_servicio_id}
                    nombre={v.prestador_nombre}
                    oficio={t('hogar.railVet')}
                    contexto={esDomicilio
                      ? t('veterinaria.vaAlHogar')
                      : v.direccion !== null
                        ? [v.direccion, v.ciudad].filter(Boolean).join(' · ')
                        : t('veterinaria.enSuClinica')}
                    precio={`$${v.precio.toFixed(2)} · ${v.duracion_minutos} min`}
                    perfil={perfiles[v.prestador_id]}
                    /* ⚡ D-730 · la ventana viaja con el tap, para que la ficha reserve. */
                    contextoReserva={{ oficio: 'veterinaria', fecha, hora, mascotaId, tipoServicio }}
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

      <HojaPersonasVet
        estado={hojaPersonas}
        onCerrar={cerrarHoja}
        personaElegida={personaElegida}
        onElegir={elegirPersona}
        personaRebotada={personaRebotada}
        creandoHold={creandoHold}
        onConfirmar={(negocio, persona) => void crearHold(negocio, persona)}
      />
    </SafeAreaView>
  );
}
