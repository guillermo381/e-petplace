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
  Hoja,
  Icono,
  SelectorOpcion,
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
  obtenerPersonasQueAtienden,
  obtenerVeterinariosDisponibles,
  obtenerVitrinaNegocios,
  type PersonaQueAtiende,
  type PerfilMascota,
  type VeterinarioDisponible,
  obtenerPerfilesPublicos,
  type PerfilPublico,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { tomarPedido } from '@/lib/senal-reserva';
import { PreviewPrestador } from '@/components/preview-prestador';
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
  // La Hoja del selector: solo existe con 2+ personas OFERTABLES
  // (chip + jornada — el filtro vive abajo; N=1 colapsa, es diseño).
  const [hojaPersonas, setHojaPersonas] = useState<{
    negocio: VeterinarioDisponible;
    personas: PersonaQueAtiende[];
  } | null>(null);
  const [personaElegida, setPersonaElegida] = useState('cualquiera');
  const [personaRebotada, setPersonaRebotada] = useState(false);
  const [abriendoSelector, setAbriendoSelector] = useState<string | null>(null);

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

  // S91-C · EL PEDIDO QUE VUELVE DEL DETALLE. La barra fija de
  // `/prestador/[id]` no reserva: PIDE. Acá se toma UNA vez (la lectura
  // es destructiva) y se ejecuta EL MISMO camino del botón de la fila —
  // un solo flujo de reserva en toda la app.
  useFocusEffect(
    useCallback(() => {
      const pedida = tomarPedido();
      if (pedida === null || !Array.isArray(disponibles)) return;
      const oferta = disponibles.find((v) => v.prestador_servicio_id === pedida);
      // Si la oferta ya no está (se ocupó el slot mientras miraba), no se
      // reserva a ciegas: la lista habla sola en su próximo refresh.
      if (oferta !== undefined) void tocarNegocio(oferta);
    }, [disponibles]),
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

  // El hold nace acá: invisible al prestador hasta que el pago confirme.
  // S78-A7: si la familia ELIGIÓ persona, viaja al motor — que la FIJA o
  // rebota `persona_no_disponible` (jamás cae en otra en silencio).
  const crearHold = useCallback(
    async (v: VeterinarioDisponible, persona?: PersonaQueAtiende) => {
      if (creandoHold) return;
      setCreandoHold(true);
      const r = await crearBloqueoAgenda({
        prestador_id: v.prestador_id,
        prestador_servicio_id: v.prestador_servicio_id,
        mascota_id: mascotaId,
        fecha,
        hora,
        ...(persona !== undefined ? { empleado_id: persona.empleadoId } : null),
      });
      setCreandoHold(false);
      if (!r.ok) {
        // VARA 2 — `persona_no_disponible` tiene SU cara, jamás la de
        // slot_ocupado: son dos verdades ("no hay lugar" vs "quien
        // elegiste no puede, pero el negocio sí"). Vive DENTRO de la
        // Hoja, con sus dos caminos.
        if (r.codigo === 'persona_no_disponible') {
          setPersonaRebotada(true);
          return;
        }
        setHojaPersonas(null);
        mostrar({ texto: r.mensaje, variante: 'error' });
        if (r.codigo === 'slot_ocupado' || r.codigo === 'slot_en_pasado') cargarVets();
        // urgencia que cruzó la medianoche: el CUÁNDO recalcula HOY
        if (r.codigo === 'urgencia_solo_hoy') router.back();
        return;
      }
      setHojaPersonas(null);
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
          // §8 LETRA_TURNOS (la mitad "confirmación"): si eligió, se dice.
          ...(persona !== undefined ? { personaNombre: persona.nombre ?? t('veterinaria.integranteEquipo') } : null),
        },
      });
    },
    [creandoHold, fecha, hora, mascotaId, tipoServicio, esDomicilio, t, cargarVets, mostrar],
  );

  // S78-A7 — el tap de la fila: la Hoja SOLO si hay elección real.
  // "Ofertable" = chip + JORNADA (vara 1): `obtener_personas_que_atienden`
  // trae a propósito al que tiene chip sin jornada (dato del PRESTADOR,
  // D-540 visible) — la familia jamás lo ve: se filtra acá, y el conteo
  // del colapso N=1 corre sobre lo filtrado (Ley 23: no se ofrece a
  // alguien sin horarios).
  const tocarNegocio = useCallback(
    async (v: VeterinarioDisponible) => {
      if (creandoHold || abriendoSelector !== null) return;
      if (vitrina?.[v.prestador_id] !== true) {
        void crearHold(v);
        return;
      }
      setAbriendoSelector(v.prestador_servicio_id);
      const r = await obtenerPersonasQueAtienden(v.prestador_id, v.prestador_servicio_id);
      setAbriendoSelector(null);
      const ofertables = r.ok ? r.data.filter((per) => per.tieneJornada) : [];
      if (ofertables.length < 2) {
        // colapso N=1 (o fallo de lectura, degradación declarada en M1):
        // el camino de siempre — la puerta no pregunta lo que ya sabe.
        void crearHold(v);
        return;
      }
      setPersonaElegida('cualquiera');
      setPersonaRebotada(false);
      setHojaPersonas({ negocio: v, personas: ofertables });
    },
    [creandoHold, abriendoSelector, vitrina, crearHold],
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
                    etiquetaReservar={t('perfilPrestador.reservar')}
                  onReservar={() => void tocarNegocio(v)}
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

      {/* S78-A7 — LA HOJA DEL SELECTOR DE PERSONA (LETRA_VITRINA). Solo se
          monta con 2+ ofertables; "Cualquiera del equipo" viene
          PRESELECCIONADO — continuar sin tocar nada ES el camino de hoy
          (vara 3: el selector ofrece, no exige). */}
      <Hoja
        visible={hojaPersonas !== null}
        onCerrar={() => setHojaPersonas(null)}
        titulo={t('veterinaria.conQuienTitulo')}
        conCerrar
      >
        {hojaPersonas !== null ? (
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: Math.round(typography.size.sm * 1.4),
                color: theme.text.secondary,
              }}
            >
              {t('veterinaria.conQuienVoz', { negocio: hojaPersonas.negocio.prestador_nombre })}
            </Text>
            <SelectorOpcion
              etiqueta={t('veterinaria.conQuienTitulo')}
              etiquetaVisible={false}
              acento="control"
              disposicion="columnas"
              opciones={[
                { codigo: 'cualquiera', etiqueta: t('veterinaria.cualquieraEquipo') },
                ...hojaPersonas.personas.map((per) => ({
                  codigo: per.empleadoId,
                  // null honesto → etiqueta genérica, jamás un nombre inventado (L-139)
                  etiqueta: per.nombre ?? t('veterinaria.integranteEquipo'),
                })),
              ]}
              seleccionada={personaElegida}
              onSelect={(codigo) => {
                setPersonaElegida(codigo);
                setPersonaRebotada(false);
              }}
            />
            {personaRebotada ? (
              /* VARA 2 — la cara PROPIA del rebote, con sus DOS caminos:
                 soltar la elección (la reserva no se pierde) o volver al
                 CUÁNDO. Jamás la ropa de slot_ocupado. */
              <View style={{ gap: spacing[2] }}>
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.sm,
                    lineHeight: Math.round(typography.size.sm * 1.4),
                    color: theme.status.warningText,
                  }}
                >
                  {t('veterinaria.personaNoPudo')}
                </Text>
                <Boton
                  variante="primario"
                  bloque
                  etiqueta={t('veterinaria.dejarQueAsigne')}
                  cargando={creandoHold}
                  onPress={() => void crearHold(hojaPersonas.negocio)}
                />
                <Boton
                  variante="ghost"
                  bloque
                  etiqueta={t('explorar.probarOtroHorario')}
                  onPress={() => {
                    setHojaPersonas(null);
                    router.back();
                  }}
                />
              </View>
            ) : (
              <Boton
                variante="primario"
                bloque
                etiqueta={t('veterinaria.conQuienConfirmar')}
                cargando={creandoHold}
                onPress={() => {
                  const per = hojaPersonas.personas.find((x) => x.empleadoId === personaElegida);
                  void crearHold(hojaPersonas.negocio, per);
                }}
              />
            )}
          </View>
        ) : null}
      </Hoja>
    </SafeAreaView>
  );
}
