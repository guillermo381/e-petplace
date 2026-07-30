/**
 * PERFIL DE MASCOTA — pila de módulos, no monolito (S51-B2.3, sobre
 * DISEÑO_EXPERIENCIA §4): header de identidad (AvatarMascota + nombre
 * + momento vital EN VOZ — Ley 3: M1..M7 jamás visibles) y debajo la
 * pila:
 *   1. Su vida — LineaDeVida propia (paginada).
 *   2. Salud — el carnet vivo (vacunas reales de S47-48).
 *   3. VITALES (S53-B2c) — lo REAL de sus paseos (km/min/salidas de
 *      los tracks) + los índices EDUCATIVOS en despliegue progresivo
 *      (guijarros §4; honestos-vacíos, la Hoja educa y termina en una
 *      acción que alimenta el expediente). ═══ HUECO M-WEAR ═══ el día
 *      del collar, los índices se llenan — cero refactor (founder S50).
 *   4. Identidad — progresiva: SOLO lo cargado; lo que falta es una
 *      invitación digna, jamás un formulario ni datos fake.
 *
 * Módulo sin datos = EstadoVacio con voz (Ley 13: vacío confirmado).
 *
 * S82-C LAZO 4c (CLARIDAD): la absorción S71 que esta pantalla se había
 * perdido — `TituloModulo` local era byte-idéntico a `Texto seccion` y
 * MUERE (4 usos migrados); los `fin` de Celda, la invitación de
 * identidad y la línea educativa pasan a `Texto apoyo` (receta exacta).
 * NO SE TOCAN, declarado: la fila hero display de Vitales (matiz Ley 3
 * S53, FIRMADA — escala display fuera de la API de Texto) y el header
 * de identidad (composición S52-P4a). CHANEL: el componente local
 * muerto es la remoción de la pasada.
 */

import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaseoSocialHoja } from '@/components/paseo-social-hoja';
import { TallaPelajeHoja } from '@/components/talla-pelaje-hoja';
import Svg, { Path } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import {
  BarrasSemana,
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FilaDato,
  Guijarro,
  Hoja,
  Huella,
  Isotipo,
  PieRevelar,
  Separador,
  Tarjeta,
  Texto,
  radius,
  spacing,
  typography,
  usePresionado,
  useTheme,
  type LineaDeVidaEstadoPie,
} from '@epetplace/ui';
import {
  leerTimelineMascota,
  obtenerEstadoHogar,
  obtenerPaseosConTrack,
  obtenerPerfilMascota,
  resolverUrlFoto,
  type ItemTimeline,
  type PerfilMascota,
  type SenalesHogarMascota,
} from '@epetplace/api';
import {
  calcularMomentoVital,
  calcularVitales,
  calcularVozHogar,
  edadEnMeses,
  type MomentoVital,
  type VitalesPaseos,
} from '@epetplace/domain';
import { FAMILIA_DE_TIPO, vozHecho } from '@/lib/voz-hecho';
import { CantoCurva } from '@/components/canto-curva';
import { FiltroPills } from '@/components/filtro-pills';

/** @override-s82c — SERIF LOCAL hasta la pieza de B (candidata; el
 *  founder la ordenó para el perfil y la ELECCIÓN de fuente es de B):
 *  la serif del sistema por plataforma — cero fuente instalada, cero
 *  escala paralela (los tamaños siguen siendo de typography.size).
 *  CHOQUE DECLARADO al gate: DM Sans es la única UI firmada en v4. */
const SERIF_LOCAL = Platform.select({ ios: 'Georgia', default: 'serif' });

import { fechaCortaMono } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

type TraductorPerfil = ReturnType<typeof useTraduccion>['t'];


function vozMomento(momento: MomentoVital, t: TraductorPerfil): string | null {
  switch (momento) {
    case 'M1': return t('perfil.momentoM1');
    case 'M2': return t('perfil.momentoM2');
    case 'M3': return t('perfil.momentoM3');
    case 'M4': return t('perfil.momentoM4');
    case 'M5': return t('perfil.momentoM5');
    case 'M6': return null; // memorial: el tema habla, el chip calla
  }
}

/** r3 ítem ③ — la voz del MOMENTO para la tarjeta de voz (literal
 *  transcrito; diccionario CERRADO por momento — jamás desempeño ni
 *  progreso, MODELO_LOYALTY §3, guard R11). M6 (memorial) calla. */
function vozCardDe(momento: MomentoVital, nombre: string, t: TraductorPerfil): string | null {
  switch (momento) {
    case 'M1': return t('perfil.vozCardM1', { nombre });
    case 'M2': return t('perfil.vozCardM2', { nombre });
    case 'M3': return t('perfil.vozCardM3', { nombre });
    case 'M4': return t('perfil.vozCardM4', { nombre });
    case 'M5': return t('perfil.vozCardM5', { nombre });
    case 'M6': return null;
  }
}

/** El glifo ⓘ de la procedencia (trazo local 1.9 — precedente de los
 *  motivos de guijarro de esta misma pantalla; candidato al registry
 *  por su puerta si se repite). */
function GlifoInfo({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Path
        d="M12 3.4a8.6 8.6 0 110 17.2 8.6 8.6 0 010-17.2Z"
        stroke={color} strokeWidth={1.9} fill="none"
      />
      <Path d="M12 11v5M12 7.7v.3" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function vozEdad(meses: number, t: TraductorPerfil): string {
  if (meses < 12) return meses === 1 ? t('perfil.edadUnMes') : t('perfil.edadMeses', { meses });
  const anios = Math.floor(meses / 12);
  return anios === 1 ? t('perfil.edadUnAnio') : t('perfil.edadAnios', { anios });
}

// Motivos en trazo de los guijarros (§4: el motivo va ENCIMA del tinte).
const trazoMotivo = (color: string) => ({
  stroke: color,
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

function MotivoCorazon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M12 19.4C8 16.2 5 13.3 5 10.2c0-2.3 1.9-4 4-4 1.2 0 2.3.5 3 1.5.7-1 1.8-1.5 3-1.5 2.1 0 4 1.7 4 4 0 3.1-3 6-7 9.2Z"
        {...trazoMotivo(color)}
      />
    </Svg>
  );
}

function MotivoLuna({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M14.8 4.6a7.6 7.6 0 1 0 4.6 12.9 8.8 8.8 0 0 1-4.6-12.9Z" {...trazoMotivo(color)} />
    </Svg>
  );
}

export default function PerfilDeMascota() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, idioma } = useTraduccion();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  // P19 (S59-A4): la respuesta de socialización es EDITABLE desde acá.
  const [socialHojaAbierta, setSocialHojaAbierta] = useState(false);
  // §3 grooming (S60): talla y pelaje — declarados una vez, EDITABLES
  // siempre desde acá (la otra mitad del patrón P19).
  const [tallaHojaAbierta, setTallaHojaAbierta] = useState(false);
  // Vitales (S53-B2c): paseos con track REAL → cálculo puro en domain.
  const [vitales, setVitales] = useState<VitalesPaseos | 'cargando' | 'error'>('cargando');
  const [indiceAbierto, setIndiceAbierto] = useState<'salud' | 'descanso' | null>(null);
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  // S82: el avatar es la puerta a editar la foto (encuadre de la casa).
  const presionAvatar = usePresionado(0.99);
  const [items, setItems] = useState<ItemTimeline[] | null | 'error'>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);
  // S82-C (imagen-acuerdo, ítem 1 + r3 ítem 4): la SEÑAL completa del
  // hogar para esta mascota — alimenta la pastilla del header Y las
  // celdas de CÓMO ESTÁ HOY (una sola verdad, un solo fetch).
  const [senal, setSenal] = useState<SenalesHogarMascota | null>(null);
  // r5: vacunas agrupadas-colapsadas + historia colapsada con filtros
  const [vacunasAbiertas, setVacunasAbiertas] = useState(false);
  const [historiaRevelada, setHistoriaRevelada] = useState(false);
  const [filtroHistoria, setFiltroHistoria] = useState<'todo' | 'semana' | 'mes' | 'salud' | 'paseos' | 'estetica' | 'adiestramiento'>('todo');

  const cargarPrimeraPagina = useCallback(async (id: string) => {
    const r = await leerTimelineMascota(id);
    if (!r.ok) {
      setItems('error');
      setEstadoPie('nada');
      return;
    }
    setItems(r.data.items);
    setCursor(r.data.siguiente_cursor);
    setEstadoPie(r.data.siguiente_cursor !== null ? 'mas' : 'nada');
  }, []);

  const cargarMas = useCallback(async () => {
    if (cargandoMasRef.current || typeof mascotaId !== 'string') return;
    if (cursor === null) {
      setEstadoPie('cargando');
      await cargarPrimeraPagina(mascotaId);
      return;
    }
    cargandoMasRef.current = true;
    setEstadoPie('cargando');
    const r = await leerTimelineMascota(mascotaId, { cursor });
    cargandoMasRef.current = false;
    if (!r.ok) {
      setEstadoPie('error');
      return;
    }
    setItems((prev) => [...(Array.isArray(prev) ? prev : []), ...r.data.items]);
    setCursor(r.data.siguiente_cursor);
    setEstadoPie(r.data.siguiente_cursor !== null ? 'mas' : 'nada');
  }, [cursor, mascotaId, cargarPrimeraPagina]);

  useFocusEffect(
    useCallback(() => {
      if (typeof mascotaId !== 'string') {
        router.replace('/hogar');
        return;
      }
      let vigente = true;
      void (async () => {
        const r = await obtenerPerfilMascota(mascotaId);
        if (!vigente) return;
        if (!r.ok) {
          setPerfil('error');
          return;
        }
        setPerfil(r.data);
        void obtenerPaseosConTrack(mascotaId).then((pv) => {
          if (vigente) setVitales(pv.ok ? calcularVitales(pv.data, new Date()) : 'error');
        });
        if (r.data.mascota.foto_url) {
          void resolverUrlFoto(r.data.mascota.foto_url).then((url) => {
            if (vigente) setFotoFirmada(url ?? undefined);
          });
        }
        void cargarPrimeraPagina(mascotaId);
        void obtenerEstadoHogar([mascotaId]).then((eh) => {
          if (!vigente || !eh.ok) return;
          setSenal(eh.data.senales.find((x) => x.mascota_id === mascotaId) ?? null);
        });
      })();
      return () => {
        vigente = false;
      };
    }, [mascotaId, router, cargarPrimeraPagina]),
  );

  if (perfil === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
            <View style={{ alignItems: 'center', gap: spacing[3] }}>
              <Esqueleto forma="circulo" alto={96} />
              <Esqueleto forma="linea" ancho="40%" />
              <View style={{ height: spacing[6] }} />
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
            </View>
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (perfil === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('perfil.error')}
            descripcion={t('hogar.errorHistoriaDetalle')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={() => setPerfil('cargando')} />}
          />
        </View>
      </View>
    );
  }

  const { mascota, vacunas, peso_clinico_kg, tiene_condicion_cronica, umbrales } = perfil;
  const hoy = new Date();
  const meses = mascota.fecha_nacimiento !== null ? edadEnMeses(mascota.fecha_nacimiento, hoy) : null;
  // r3: la voz del hogar (una sola verdad) — pastilla + celda de vacunas
  const vozEstadoHogar =
    senal !== null
      ? calcularVozHogar(
          {
            tieneEmergenciaActiva: senal.tiene_emergencia_activa,
            vacunasTotal: senal.vacunas_total,
            ultimaVacunaAplicada: senal.ultima_vacuna_aplicada,
            proximaVacuna: senal.proxima_vacuna,
            ultimaAtencionCerrada: senal.ultima_atencion_cerrada,
          },
          hoy,
        )
      : null;
  const pastilla = vozEstadoHogar?.voz ?? null;
  const momento =
    umbrales !== null
      ? calcularMomentoVital({
          edadMeses: meses,
          tieneCondicionCronica: tiene_condicion_cronica,
          esMemorial: mascota.estado_vida !== null && mascota.estado_vida !== 'activa',
          umbrales,
        })
      : null;
  const chipMomento = momento !== null ? vozMomento(momento, t) : null;

  // Identidad progresiva: SOLO lo cargado (L-139 — nada fake).
  const datosIdentidad: Array<{ etiqueta: string; valor: string; mono?: boolean }> = [];
  if (mascota.raza !== null && mascota.raza.length > 0) {
    datosIdentidad.push({ etiqueta: t('perfil.raza'), valor: mascota.raza });
  }
  if (mascota.sexo === 'macho' || mascota.sexo === 'hembra') {
    datosIdentidad.push({
      etiqueta: t('perfil.sexo'),
      valor: mascota.sexo === 'macho' ? t('perfil.sexoMacho') : t('perfil.sexoHembra'),
    });
  }
  if (mascota.fecha_nacimiento !== null) {
    datosIdentidad.push({ etiqueta: t('perfil.nacimiento'), valor: fechaCortaMono(mascota.fecha_nacimiento, idioma), mono: true });
  }
  if (peso_clinico_kg !== null) {
    datosIdentidad.push({ etiqueta: t('perfil.peso'), valor: `${peso_clinico_kg} kg`, mono: true });
  }
  if (mascota.microchip !== null && mascota.microchip.length > 0) {
    datosIdentidad.push({ etiqueta: t('perfil.microchip'), valor: mascota.microchip, mono: true });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {/* @override-s82c — r5 ítem 1: LA MARCA DE AGUA del fondo,
          escalada a SALIRSE por los cuatro lados al 4% ("una forma
          completa es una marca; cortada es papel — así la Ley 4 no
          muerde", letra founder). Fija, detrás de todo. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      >
        <View style={{ opacity: 0.04 }}>
          <Isotipo size={1000} variant="tinta" color={theme.text.primary} />
        </View>
      </View>
      <Encabezado variante="navegacion" titulo="" atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[8], gap: spacing[6] }}>
        {/* ── 1 · HEADER ALTO (imagen-acuerdo S82-C): editar · compartir ·
            foto grande CIRCULAR con anillo · pastilla al pie · nombre en
            serif · meta en mono. El atrás vive en el Encabezado de
            arriba. Los textos Editar/Compartir son PROVISIONALES hasta
            la imagen (sin glifos: el set no tiene lápiz ni compartir —
            cero genéricos, Ley 12). */}
        <View style={{ alignItems: 'center', gap: spacing[3] }}>
          <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'flex-end', gap: spacing[4] }}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/hogar/foto-mascota', params: { mascotaId: mascota.id, nombre: mascota.nombre } })
              }
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Texto variante="apoyo" color="primary">{t('perfil.editar')}</Texto>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void Share.share({ message: t('perfil.compartirMensaje', { nombre: mascota.nombre }) })}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Texto variante="apoyo" color="primary">{t('perfil.compartir')}</Texto>
            </Pressable>
          </View>
          {/* S82: tap en la foto → editar el encuadre (la puerta de A).
              Pressed por usePresionado (la receta única de la casa). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('fotoEncuadre.editarFotoA11y', { nombre: mascota.nombre })}
            onPress={() =>
              router.push({ pathname: '/hogar/foto-mascota', params: { mascotaId: mascota.id, nombre: mascota.nombre } })
            }
            {...presionAvatar.handlers}
          >
            <Animated.View style={presionAvatar.estiloPresionado}>
              {/* @override-s82c — FOTO CIRCULAR CON ANILLO (orden founder;
                  CHOQUE DECLARADO contra el squircle 32% FIRMADO S61-A10 —
                  lo resuelve el gate; por eso NO pasa por AvatarMascota:
                  a la primitiva firmada no se le talla una excepción
                  desde una pantalla). Anillo = aro de papel + elevación.
                  Sin foto: la Huella digna sobre el tinte de su capa. */}
              {/* r6-5: el diámetro sube 124→160 — el aire alrededor lo
                  justifica (gate founder). */}
              <View
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: radius.full,
                  backgroundColor: theme.bg.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: theme.elevacion.reposo,
                }}
              >
                {fotoFirmada !== undefined ? (
                  <Image
                    source={{ uri: fotoFirmada }}
                    style={{ width: 148, height: 148, borderRadius: radius.full }}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View
                    style={{
                      width: 148,
                      height: 148,
                      borderRadius: radius.full,
                      backgroundColor: 'capaBg' in theme ? theme.capaBg.identidad : theme.bg.overlay,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Svg width={64} height={64} viewBox="0 0 24 24">
                      <Huella color={theme.capa.identidad} escala={0.9} x={1.2} y={1.2} />
                    </Svg>
                  </View>
                )}
              </View>
              {/* la pastilla de estado MONTADA al pie de la foto — la
                  misma verdad que la ficha del Hogar; sin señal, calla */}
              {pastilla !== null ? (
                // r5-2: NADA de verde flúor — el registro AA (la familia
                // "terrosa": successText/warningText) sobre papel con
                // elevación; pares medidos del sistema en ambos temas.
                <View
                  style={{
                    position: 'absolute',
                    bottom: -spacing[1],
                    alignSelf: 'center',
                    borderRadius: radius.full,
                    backgroundColor: theme.bg.card,
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[1],
                    boxShadow: theme.elevacion.reposo,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.sm,
                      color:
                        pastilla === 'alDia'
                          ? theme.status.successText
                          : pastilla === 'pideAtencion'
                            ? theme.status.warningText
                            : theme.text.secondary,
                    }}
                  >
                    {pastilla === 'alDia'
                      ? t('perfil.pastillaAlDia')
                      : pastilla === 'pideAtencion'
                        ? t('perfil.pastillaAtencion')
                        : t('perfil.pastillaConociendo')}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          </Pressable>
          {/* @override-s82c — el nombre en SERIF (la pieza es de B;
              acá el hueco local, tamaño de la escala de la casa). */}
          <Text accessibilityRole="header" style={{ fontFamily: SERIF_LOCAL, fontSize: typography.size['2xl'], color: theme.text.primary }}>
            {mascota.nombre}
          </Text>
          {/* la meta en MONO (imagen-acuerdo — supersede la voz sans de
              S52-P4a en ESTA pantalla; el gate lo firma o lo devuelve) */}
          {chipMomento !== null || meses !== null ? (
            <Texto variante="dato">
              {[meses !== null ? vozEdad(meses, t) : null, chipMomento]
                .filter(Boolean)
                .join(' · ')
                .toLowerCase()}
            </Texto>
          ) : null}
        </View>

        {/* ── 2 · LOS HECHOS (imagen-acuerdo; MODELO_LOYALTY §3 y el
            criterio D2: HECHOS del expediente — jamás puntaje ni %
            completo). La celda CONSULTAS del pedido NO SE MONTA: el
            contrato del perfil no trae contador de consultas y contarlas
            desde una página del timeline subcontaría (L-139) — el pedido
            del contador viaja al escritor de api en el reporte. Ambos en
            cero = la tarjeta no existe (regla de existencia). El montaje
            sobre el borde del header espera LA IMAGEN (sin banda de
            color detrás, el solape no se deriva — freno declarado). */}
        {perfil.paseos_total > 0 || vacunas.length > 0 ? (
          <Tarjeta elevacion="elevada">
            <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
              <View style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}>
                <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['2xl'], fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                  {perfil.paseos_total}
                </Text>
                <Texto variante="apoyo">{t('perfil.hechosPaseos')}</Texto>
              </View>
              <View style={{ width: 1, backgroundColor: theme.border.default, marginVertical: spacing[1] }} />
              <View style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}>
                <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['2xl'], fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                  {vacunas.length}
                </Text>
                <Texto variante="apoyo">{t('perfil.hechosVacunas')}</Texto>
              </View>
            </View>
          </Tarjeta>
        ) : null}

        {/* ── 3 · LA TARJETA DE VOZ (r3, literal transcrito
            2026-07-29 — GATE EXIGIBLE: el founder confirma el literal;
            si la PNG llega y contradice, gana la PNG). La voz LEE EL
            MOMENTO VITAL — jamás desempeño ni progreso (MODELO_LOYALTY
            §3; guard R11 vigila el diccionario). Sin raza o sin edad NO
            SE MONTA — cero frase genérica (L-139). ROCE DECLARADO, no
            resuelto: la procedencia dice "raza y edad" (literal) pero el
            momento hoy se computa de ESPECIE (umbrales) + edad — la raza
            es condición de existencia, no insumo del cálculo; si eso
            miente, el gate ajusta la línea o el motor. */}
        {(() => {
          if (mascota.raza === null || meses === null || momento === null) return null;
          const cuerpoVoz = vozCardDe(momento, mascota.nombre, t);
          if (cuerpoVoz === null) return null;
          return (
            <CantoCurva color={theme.capa.comunidadAmplia}>
              <View style={{ padding: spacing[4], gap: spacing[3] }}>
                {/* @override-s82c — el cuerpo en la voz del producto
                    (serif local hasta la pieza de B) */}
                <Text
                  style={{
                    fontFamily: SERIF_LOCAL,
                    fontSize: typography.size.lg,
                    lineHeight: Math.round(typography.size.lg * 1.4),
                    color: theme.text.primary,
                  }}
                >
                  {cuerpoVoz}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}>
                  <GlifoInfo color={theme.text.tertiary} />
                  <Texto variante="apoyo">{t('perfil.vozProcedencia')}</Texto>
                </View>
              </View>
            </CantoCurva>
          );
        })()}

        {/* ── CÓMO ESTÁ HOY (r5: SOLO las celdas CON DATO — cuatro
            nulos en grilla no es honestidad, es una pantalla que dice
            "no sabemos nada"; lo sin dato colapsa en UNA línea honesta,
            L-139 sin dedicarle tarjetas a la ausencia). El peso migró a
            IDENTIDAD (r5 ítem 4). Canto por ESTADO — el choque
            estado-vs-categoría (Ley 10) sigue DECLARADO al gate. */}
        {(() => {
          type CeldaHoy = { key: string; rotulo: string; valor: string; detalle: string; estado: 'atencion' | 'alDia' };
          const hoyIso = new Intl.DateTimeFormat('en-CA').format(hoy);
          const pv = senal?.proxima_vacuna ?? null;
          const celdas: CeldaHoy[] = [];
          if (senal !== null && senal.vacunas_total > 0) {
            if (pv !== null && pv.fecha < hoyIso) {
              celdas.push({ key: 'vacunas', rotulo: t('perfil.hechosVacunas'), valor: t('perfil.hoyFaltaUna'), detalle: t('perfil.hoyRefuerzoVencido'), estado: 'atencion' });
            } else if (pv !== null) {
              celdas.push({ key: 'vacunas', rotulo: t('perfil.hechosVacunas'), valor: t('perfil.hoyAlDia'), detalle: t('perfil.hoyHasta', { fecha: fechaCortaMono(pv.fecha, idioma) }), estado: 'alDia' });
            }
            // sin fecha próxima el estado no se afirma (deuda E5): la
            // celda NO se monta — vive en la línea honesta de abajo.
          }
          const sinDato: string[] = [];
          if (!(senal !== null && senal.vacunas_total > 0 && pv !== null)) sinDato.push(t('perfil.hechosVacunas').toLowerCase());
          sinDato.push(t('perfil.hoyDesparasitacion').toLowerCase(), t('perfil.hoyAlergias').toLowerCase());
          const colorDe = (e: CeldaHoy['estado']) => (e === 'atencion' ? theme.status.warning : theme.status.success);
          return (
            <View style={{ gap: spacing[3] }}>
              <Texto variante="seccion">{t('perfil.hoyTitulo')}</Texto>
              {celdas.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
                  {celdas.map((c) => (
                    <View key={c.key} style={{ flexBasis: '47%', flexGrow: 1 }}>
                      <CantoCurva color={colorDe(c.estado)}>
                        <View style={{ padding: spacing[3], gap: spacing[1] }}>
                          <Texto variante="apoyo">{c.rotulo}</Texto>
                          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}>
                            {c.valor}
                          </Text>
                          <Texto variante="dato" numberOfLines={1}>{c.detalle}</Texto>
                        </View>
                      </CantoCurva>
                    </View>
                  ))}
                </View>
              ) : null}
              {sinDato.length > 0 ? (
                <Texto variante="apoyo">{t('perfil.hoySinRegistroLinea', { lista: sinDato.join(' · ') })}</Texto>
              ) : null}
            </View>
          );
        })()}

        {/* ── IDENTIDAD, ARRIBA Y CON DISEÑO (r5 ítem 4): los hechos de
            identidad en UNA tarjeta con grilla de pares — deja de leerse
            como formulario. Talla/pelaje y paseos-en-grupo siguen
            EDITABLES (P19, letra firmada) por tap en su par — sin
            contorno (A6). */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('perfil.identidad')}</Texto>
          <Tarjeta elevacion="reposo">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing[4] }}>
              {datosIdentidad.map((d) => (
                <View key={d.etiqueta} style={{ width: '50%', paddingRight: spacing[3] }}>
                  <FilaDato etiqueta={d.etiqueta} valor={d.valor} mono={d.mono === true} />
                </View>
              ))}
              {mascota.especie === 'perro' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSocialHojaAbierta(true)}
                  style={{ width: '50%', paddingRight: spacing[3], minHeight: 44 }}
                >
                  <FilaDato
                    etiqueta={t('paseoSocial.celdaTitulo')}
                    valor={
                      mascota.paseo_social_ok === null
                        ? t('paseoSocial.estadoSinResponder')
                        : mascota.paseo_social_ok
                          ? t('paseoSocial.estadoSi')
                          : t('paseoSocial.estadoNo')
                    }
                  />
                </Pressable>
              ) : null}
              {mascota.especie === 'perro' || mascota.especie === 'gato' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setTallaHojaAbierta(true)}
                  style={{ width: '50%', paddingRight: spacing[3], minHeight: 44 }}
                >
                  <FilaDato
                    etiqueta={t('grooming.tallaCeldaTitulo')}
                    valor={
                      mascota.talla === null || mascota.pelaje === null
                        ? t('grooming.tallaEstadoSinDeclarar')
                        : `${t(mascota.talla === 'S' ? 'grooming.tallaS' : mascota.talla === 'M' ? 'grooming.tallaM' : 'grooming.tallaL')}${mascota.pelaje === 'largo' ? ` · ${t('grooming.pelajeLargoCorto')}` : ''}`
                    }
                  />
                </Pressable>
              ) : null}
            </View>
          </Tarjeta>
          {/* la invitación digna: texto, jamás formulario muerto */}
          <Texto variante="apoyo">{t('perfil.identidadInvitacion')}</Texto>
        </View>

        {/* ── VITALES — r6-6: DEBAJO de identidad (orden founder); antes: conservada declarada (matarla
            tiraría la fila hero display FIRMADA S53 y el hueco M-WEAR
            sin orden explícita — el destino lo decide el gate).
            DECLARADO AL GATE, no resuelto: el "Índice de salud" de los
            guijarros es un PUNTAJE en potencia — MODELO_LOYALTY §3
            prohíbe nivel y % completo; hoy dice "se construye con su
            expediente" (sin número); si algún día muestra un número,
            cruzó la frontera. ──
            ═══ HUECO M-WEAR: el día que la mascota tenga collar
            conectado, los ÍNDICES de abajo se llenan y el dashboard
            se expande (actividad/descanso/tendencias) — revelación
            progresiva, cero refactor (DISEÑO_EXPERIENCIA §4). ═══ */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('perfil.vitales')}</Texto>

          {/* (a) LO REAL — los paseos de ESTA mascota, de sus tracks */}
          {vitales === 'cargando' ? (
            <EsqueletoGrupo>
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
            </EsqueletoGrupo>
          ) : vitales === 'error' || vitales.totalSalidas === 0 ? (
            // sin paseos: invitación serena — JAMÁS ceros (L-139)
            <EstadoVacio
              registro="seccion"
              titulo={t('perfil.bienestarVacio')}
              descripcion={t('perfil.bienestarVacioDetalle')}
            />
          ) : (
            <Tarjeta relleno="amplio">
              <View style={{ gap: spacing[4] }}>
                <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
                  {t('perfil.vitalesUltimos7')}
                </Text>
                {/* fila hero — MATIZ LEY 3 (S53): a escala display el
                    número viste DM Sans; el mono queda para metadata */}
                <View style={{ flexDirection: 'row', gap: spacing[6] }}>
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['3xl'] ?? 34, fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                      {vitales.km7d.toFixed(1)}
                      <Text style={{ fontSize: typography.size.md }}> km</Text>
                    </Text>
                    <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                      {t('perfil.vitalesKm')}
                    </Text>
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontFamily: typography.family.sans.light, fontSize: typography.size['3xl'] ?? 34, fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                      {vitales.min7d}
                      <Text style={{ fontSize: typography.size.md }}> min</Text>
                    </Text>
                    <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                      {t('perfil.vitalesMin')}
                    </Text>
                  </View>
                </View>
                {/* la tira de 7 días — SOLO datos reales: llenas las
                    salidas, base los días quietos (L-139 tal cual) */}
                <BarrasSemana
                  valores={vitales.kmPorDia}
                  capa="cuidado"
                  etiqueta={t('perfil.vitalesBarrasA11y', { n: vitales.kmPorDia.filter((v) => v > 0).length })}
                />
                {/* meta en mono chico — la voz de máquina en su escala */}
                <Text style={{ fontFamily: typography.family.mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                  {(vitales.salidas7d === 1
                    ? t('perfil.vitalesMetaUna', { fecha: vitales.ultimaSalida !== null ? fechaCortaMono(vitales.ultimaSalida, idioma) : '—' })
                    : t('perfil.vitalesMetaVarias', { n: vitales.salidas7d, fecha: vitales.ultimaSalida !== null ? fechaCortaMono(vitales.ultimaSalida, idioma) : '—' })
                  ).toLowerCase()}
                </Text>
                {vitales.caminoMasQueAnterior ? (
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                    {t('perfil.vitalesComparativa')}
                  </Text>
                ) : null}
              </View>
            </Tarjeta>
          )}

          {/* (b) LO EDUCATIVO — índices visibles, honestos-vacíos:
              guijarros (§4, PRIMER uso del lenguaje de ilustración;
              cada uno rotado distinto) + Hoja que educa al tap. */}
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <View style={{ flex: 1 }}>
              <Tarjeta interactiva onPress={() => setIndiceAbierto('salud')} accessibilityRole="button" etiqueta={t('perfil.indiceSalud')}>
                <View style={{ gap: spacing[2], alignItems: 'flex-start' }}>
                  <Guijarro capa="identidad" tamano={56} rotacion={9}>
                    <MotivoCorazon color={theme.text.primary} />
                  </Guijarro>
                  <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.primary }}>
                    {t('perfil.indiceSalud')}
                  </Text>
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
                    {t('perfil.indiceSeConstruye')}
                  </Text>
                </View>
              </Tarjeta>
            </View>
            <View style={{ flex: 1 }}>
              <Tarjeta interactiva onPress={() => setIndiceAbierto('descanso')} accessibilityRole="button" etiqueta={t('perfil.indiceDescanso')}>
                <View style={{ gap: spacing[2], alignItems: 'flex-start' }}>
                  <Guijarro capa="cuidado" tamano={56} rotacion={-16}>
                    <MotivoLuna color={theme.text.primary} />
                  </Guijarro>
                  <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.primary }}>
                    {t('perfil.indiceDescanso')}
                  </Text>
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
                    {t('perfil.indiceSeConstruye')}
                  </Text>
                </View>
              </Tarjeta>
            </View>
          </View>
        </View>

        {/* ── VACUNAS (r5 ítem 5 — se llama VACUNAS, no "Salud"):
            AGRUPADO Y COLAPSADO — el resumen visible, el despliegue
            hacia abajo (PieRevelar), y "Cargar carnet" DENTRO de la
            misma tarjeta como celda con diseño (jamás botón suelto). */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('perfil.vacunas')}</Texto>
          {vacunas.length === 0 ? (
            <EstadoVacio
              titulo={t('perfil.carnetVacio')}
              descripcion={t('perfil.carnetVacioDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('perfil.cargarCarnet')}
                  onPress={() => router.push({ pathname: '/carnet', params: { mascotaId: mascota.id, nombre: mascota.nombre } })}
                />
              }
            />
          ) : (
            <Tarjeta relleno="ninguno" elevacion="reposo">
              <View style={{ padding: spacing[4], gap: spacing[1] }}>
                <Texto variante="cuerpo">
                  {vacunas.length === 1 ? t('perfil.vacunasResumenUna') : t('perfil.vacunasResumen', { n: vacunas.length })}
                </Texto>
                {(() => {
                  const ultima = vacunas.reduce<string | null>(
                    (max, v) => (v.fecha_aplicada !== null && (max === null || v.fecha_aplicada > max) ? v.fecha_aplicada : max),
                    null,
                  );
                  return ultima !== null ? (
                    <Texto variante="dato">{t('perfil.hoyUltima', { fecha: fechaCortaMono(ultima, idioma) })}</Texto>
                  ) : null;
                })()}
              </View>
              {vacunasAbiertas
                ? vacunas.map((v, i) => (
                    <View key={`${v.nombre_vacuna}-${i}`}>
                      <Separador />
                      <Celda
                        titulo={v.nombre_vacuna}
                        subtitulo={v.tipo_vacuna ?? undefined}
                        metadataMono={v.fecha_aplicada !== null ? fechaCortaMono(v.fecha_aplicada, idioma) : undefined}
                      />
                    </View>
                  ))
                : null}
              <PieRevelar n={vacunas.length} revelado={vacunasAbiertas} onPress={() => setVacunasAbiertas((v) => !v)} />
              <Separador />
              <CeldaNavegacion
                icono="carnet"
                titulo={t('perfil.cargarCarnet')}
                onPress={() => router.push({ pathname: '/carnet', params: { mascotaId: mascota.id, nombre: mascota.nombre } })}
              />
            </Tarjeta>
          )}
        </View>

        {/* ── SU HISTORIA (r5 ítem 6): COLAPSADA (3 + PieRevelar) y con
            FILTROS — esta semana · este mes · por tipo con su glifo
            (FiltroPills, la misma anatomía del Hogar: sin caja en
            reposo, placa rellena en el elegido). La barra de tinta a la
            izquierda SE CONSERVA — el founder la firmó como correcta. */}
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('perfil.vida')}</Texto>
          {items === null ? (
            <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
              <View style={{ gap: spacing[2] }}>
                <Esqueleto forma="bloque" ancho="100%" alto={56} />
                <Esqueleto forma="bloque" ancho="100%" alto={56} />
                <Esqueleto forma="bloque" ancho="100%" alto={56} />
              </View>
            </EsqueletoGrupo>
          ) : items === 'error' ? (
            <EstadoVacio
              titulo={t('hogar.errorHistoria')}
              descripcion={t('hogar.errorHistoriaDetalle')}
              accion={
                <Boton
                  variante="secundario"
                  etiqueta={t('hogar.reintentar')}
                  onPress={() => {
                    setItems(null);
                    if (typeof mascotaId === 'string') void cargarPrimeraPagina(mascotaId);
                  }}
                />
              }
            />
          ) : items.length === 0 ? (
            <EstadoVacio titulo={t('hogar.historiaEmpieza')} descripcion={t('hogar.historiaEmpiezaDetalle')} />
          ) : (
            (() => {
              const hoyIso = new Intl.DateTimeFormat('en-CA').format(hoy);
              const hace = (dias: number) => {
                const d = new Date(hoy);
                d.setDate(d.getDate() - dias);
                return new Intl.DateTimeFormat('en-CA').format(d);
              };
              const filtrados = items.filter((it) => {
                if (filtroHistoria === 'todo') return true;
                if (filtroHistoria === 'semana') return it.fecha_evento.slice(0, 10) >= hace(7) && it.fecha_evento.slice(0, 10) <= hoyIso;
                if (filtroHistoria === 'mes') return it.fecha_evento.slice(0, 10) >= hace(30) && it.fecha_evento.slice(0, 10) <= hoyIso;
                return FAMILIA_DE_TIPO[it.tipo] === filtroHistoria;
              });
              const visibles = historiaRevelada ? filtrados : filtrados.slice(0, 3);
              return (
                <View style={{ gap: spacing[3], marginHorizontal: -spacing[5] }}>
                  <FiltroPills
                    activo={filtroHistoria}
                    onCambio={(c) => setFiltroHistoria(c)}
                    opciones={[
                      { codigo: 'todo', etiqueta: t('hogar.filtroTodo'), icono: 'huella', capa: null },
                      { codigo: 'semana', etiqueta: t('perfil.filtroSemana'), icono: null, capa: null },
                      { codigo: 'mes', etiqueta: t('perfil.filtroMes'), icono: null, capa: null },
                      { codigo: 'salud', etiqueta: t('hogar.filtroSalud'), icono: 'veterinaria', capa: 'identidad' },
                      { codigo: 'paseos', etiqueta: t('hogar.filtroPaseos'), icono: 'paseo', capa: 'cuidado' },
                      { codigo: 'estetica', etiqueta: t('hogar.filtroEstetica'), icono: 'grooming', capa: 'cuidado' },
                      { codigo: 'adiestramiento', etiqueta: t('hogar.filtroAdiestramiento'), icono: 'training', capa: 'cuidado' },
                    ]}
                  />
                  <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
                    {filtrados.length === 0 ? (
                      <EstadoVacio registro="seccion" titulo={t('hogar.filtroSinMomentos')} />
                    ) : (
                      <>
                        <Tarjeta relleno="ninguno" elevacion="reposo">
                          {visibles.map((it, i) => {
                            const familia = FAMILIA_DE_TIPO[it.tipo];
                            const color =
                              familia === 'salud' ? theme.capa.identidad : familia !== undefined ? theme.capa.cuidado : null;
                            const destino =
                              it.tipo === 'historia_clinica_registrada'
                                ? () => router.push({ pathname: '/parte/[eventoId]', params: { eventoId: it.evento_id, nombre: mascota.nombre } })
                                : it.atencion_id !== null
                                  ? () => router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: it.atencion_id as string } })
                                  : null;
                            const meta = [
                              it.titulo_fuente !== null ? it.titulo_fuente.toLowerCase() : null,
                              fechaCortaMono(it.fecha_evento.slice(0, 10), idioma),
                            ]
                              .filter((x): x is string => x !== null)
                              .join(' · ');
                            const fila = (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], minHeight: 44 }}>
                                {/* la barra de tinta — FIRMADA por el founder */}
                                <View style={{ width: 3, height: 24, borderRadius: radius.full, backgroundColor: color ?? theme.border.default }} />
                                <View style={{ flex: 1, minWidth: 0, gap: spacing[0.5] }}>
                                  <Texto variante="cuerpo" numberOfLines={1}>{vozHecho(it, t)}</Texto>
                                  <Texto variante="dato" numberOfLines={1}>{meta}</Texto>
                                </View>
                                {destino !== null ? (
                                  <Svg width={19} height={19} viewBox="0 0 24 24">
                                    <Path d="M9 5l7 7-7 7" stroke={theme.text.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                  </Svg>
                                ) : null}
                              </View>
                            );
                            return (
                              <View key={it.evento_id}>
                                {i > 0 ? <Separador /> : null}
                                {destino !== null ? (
                                  <Pressable accessibilityRole="button" onPress={destino}>
                                    {fila}
                                  </Pressable>
                                ) : (
                                  fila
                                )}
                              </View>
                            );
                          })}
                        </Tarjeta>
                        <PieRevelar
                          n={filtrados.length - 3}
                          revelado={historiaRevelada}
                          onPress={() => setHistoriaRevelada((v) => !v)}
                        />
                        {(historiaRevelada || filtrados.length <= 3) && estadoPie !== 'nada' ? (
                          estadoPie === 'cargando' ? (
                            <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
                              <Esqueleto forma="linea" ancho="40%" />
                            </EsqueletoGrupo>
                          ) : (
                            // cero botones contorneados (A6, orden r5): la
                            // paginación es label sin caja, target 44
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => void cargarMas()}
                              style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Texto variante="apoyo" color="primary">
                                {estadoPie === 'error' ? t('hogar.reintentar') : t('hogar.vidaCargarMas')}
                              </Texto>
                            </Pressable>
                          )
                        ) : null}
                      </>
                    )}
                  </View>
                </View>
              );
            })()
          )}
        </View>



        {/* ── AL FINAL DE TODO (r5 ítem 7): el CTA en DEGRADADO — el de
            la lámina (el founder declaró que negro también sirve; se
            elige el de la lámina). Boton marca = gradiente firma,
            contexto cerrado legal (CTA principal del dueño, Ley 4);
            memorial degrada solo a primario. */}
        <Boton
          variante="marca"
          bloque
          etiqueta={t('perfil.reservarServicio')}
          onPress={() => router.navigate('/explorar')}
        />

      </ScrollView>

      <PaseoSocialHoja
        visible={socialHojaAbierta}
        mascota={{ id: mascota.id, nombre: mascota.nombre }}
        onCerrar={() => setSocialHojaAbierta(false)}
        onRespondida={(ok) => {
          setSocialHojaAbierta(false);
          setPerfil((prev) =>
            typeof prev === 'object' ? { ...prev, mascota: { ...prev.mascota, paseo_social_ok: ok } } : prev,
          );
        }}
      />

      {/* §3 grooming (S60): la MISMA Hoja de la reserva — editable siempre */}
      <TallaPelajeHoja
        visible={tallaHojaAbierta}
        mascota={{ id: mascota.id, nombre: mascota.nombre, talla: mascota.talla, pelaje: mascota.pelaje }}
        onCerrar={() => setTallaHojaAbierta(false)}
        onDeclarada={(talla, pelaje) => {
          setTallaHojaAbierta(false);
          setPerfil((prev) =>
            typeof prev === 'object' ? { ...prev, mascota: { ...prev.mascota, talla, pelaje } } : prev,
          );
        }}
      />

      {/* Hoja EDUCATIVA de los índices (§6.4 educando): QUÉ es, DE QUÉ
          se alimenta, y UNA acción real que alimenta el expediente —
          la ley del ecosistema hablando. Apertura normal (la física de
          marca es del Coach; acá sobriedad). */}
      <Hoja
        visible={indiceAbierto !== null}
        onCerrar={() => setIndiceAbierto(null)}
        titulo={indiceAbierto === 'salud' ? t('perfil.indiceSalud') : t('perfil.indiceDescanso')}
        conCerrar
      >
        <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[2], gap: spacing[4] }}>
          <View style={{ alignItems: 'center' }}>
            <Guijarro capa={indiceAbierto === 'salud' ? 'identidad' : 'cuidado'} tamano={72} rotacion={indiceAbierto === 'salud' ? 9 : -16}>
              {indiceAbierto === 'salud' ? <MotivoCorazon color={theme.text.primary} /> : <MotivoLuna color={theme.text.primary} />}
            </Guijarro>
          </View>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * typography.leading.normal, color: theme.text.primary }}>
            {indiceAbierto === 'salud' ? t('perfil.eduSaludQue') : t('perfil.eduDescansoQue')}
          </Text>
          <Texto variante="apoyo">
            {indiceAbierto === 'salud' ? t('perfil.eduSaludDeQue') : t('perfil.eduDescansoDeQue')}
          </Texto>
          <Boton
            etiqueta={t('perfil.eduAccion')}
            bloque
            onPress={() => {
              setIndiceAbierto(null);
              router.push({ pathname: '/carnet', params: { mascotaId: mascota.id, nombre: mascota.nombre } });
            }}
          />
        </View>
      </Hoja>
    </View>
  );
}
