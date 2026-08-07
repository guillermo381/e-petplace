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
import { Linking, Platform, Pressable, ScrollView, Share, StatusBar, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  Icono,
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
  type IconoNombre,
  type LineaDeVidaEstadoPie,
} from '@epetplace/ui';
import {
  leerTimelineMascota,
  obtenerEstadoHogar,
  obtenerPaseosConTrack,
  obtenerPerfilMascota,
  resolverUrlFoto,
  urlDocumento,
  type ItemTimeline,
  type TipoDocumento,
  type PaseoConTrack,
  type PerfilMascota,
  type SenalesHogarMascota,
} from '@epetplace/api';
import {
  calcularMomentoVital,
  calcularVitales,
  calcularVozHogar,
  distanciaTrackKm,
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

/** El eje del filtro de la historia DENTRO de la ficha: SOLO servicio
 *  (el tramo temporal vive en la pantalla completa — contrato de la
 *  lámina 02, contexto 2). */
type FiltroHistoria = 'todo' | 'salud' | 'paseos' | 'estetica' | 'adiestramiento';

/** r10-5 · el eje TEMPORAL de Vitales — el mismo que ya usa Su
 *  historia, con FiltroPills. NOTA DE API declarada: `calcularVitales`
 *  de packages/domain está CABLEADA A 7 DÍAS (corte7d/corte14d y una
 *  barra de 7 posiciones) y NO acepta ventana; ensancharla es
 *  packages/domain = territorio ajeno (76d). Se compone ACÁ con
 *  `distanciaTrackKm`, que domain SÍ exporta — cero duplicación de la
 *  fórmula, cero cambio en territorio de otro. */
type VentanaVitales = 'hoy' | 'semana' | 'mes';

/** @override-s82c — EL RÓTULO DE SECCIÓN con su CUENTA (patrón 6 de la
 *  lámina): mono uppercase + la cuenta a la derecha. Candidata a B. */
function RotuloSeccion({ titulo, cuenta }: { titulo: string; cuenta: string | null }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: spacing[5],
        marginBottom: spacing[3],
      }}
    >
      {/* r8 · ARBITRAJE DE FUENTE (A tenía razón en la sustancia): el
          rótulo NO va en mono-mayúsculas. Ley 3 pide el mono en
          MINÚSCULAS y solo para metadata de máquina; un rótulo de
          sección es interfaz → SANS (Texto seccion, el patrón vivo).
          La CUENTA sí es dato de máquina → mono minúsculas. */}
      <Texto variante="seccion">{titulo}</Texto>
      {cuenta !== null ? <Texto variante="dato">{cuenta}</Texto> : null}
    </View>
  );
}

/** @override-s82c — LA FILA DE IDENTIDAD sin caja por dato (lámina):
 *  rótulo mono a la IZQUIERDA con ancho fijo + valor a la derecha. Es
 *  la variante `sinCaja` apilada que la lámina propone para FilaDato —
 *  candidata a B (packages/ui no es territorio de esta pista). */
function FilaIdentidad({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], minHeight: 44 }}>
      <View style={{ width: 112 }}>
        <Texto variante="apoyo" numberOfLines={1}>{etiqueta}</Texto>
      </View>
      <View style={{ flex: 1 }}>
        <Texto variante={mono === true ? 'dato' : 'cuerpo'} color="primary">{valor}</Texto>
      </View>
    </View>
  );
}

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
  // S89 órdenes 8⑤/10① — los papeles del producto
  const [bajandoDoc, setBajandoDoc] = useState<TipoDocumento | null>(null);
  const [fallaCarnet, setFallaCarnet] = useState<string | null>(null);
  /** UN camino para los dos papeles: el token lo emite el server con el
   *  mismo gate del expediente; acá solo se abre lo que devuelve. */
  const bajarDocumento = async (tipo: TipoDocumento) => {
    setFallaCarnet(null);
    setBajandoDoc(tipo);
    const r = await urlDocumento(mascotaId, tipo);
    setBajandoDoc(null);
    if (r.ok) await Linking.openURL(r.data);
    else setFallaCarnet(r.mensaje);
  };
  // Vitales (S53-B2c): paseos con track REAL → cálculo puro en domain.
  const [vitales, setVitales] = useState<VitalesPaseos | 'cargando' | 'error'>('cargando');
  const [indiceAbierto, setIndiceAbierto] = useState<'salud' | 'descanso' | null>(null);
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  // S82: el avatar es la puerta a editar la foto (encuadre de la casa).
  const presionAvatar = usePresionado(0.99);
  const esMemorial = theme.mode === 'memorial';
  // r10-1: el techo pinta bajo la barra de estado → íconos CLAROS
  // mientras la pantalla tiene foco; al salir se restaura la voz del
  // tema (patrón BarraTabs/Hogar — packages/ui no conoce el foco).
  useFocusEffect(
    useCallback(() => {
      if (esMemorial) return;
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle(theme.mode === 'dark' ? 'light-content' : 'dark-content');
    }, [esMemorial, theme.mode]),
  );
  const [items, setItems] = useState<ItemTimeline[] | null | 'error'>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);
  // S82-C (imagen-acuerdo, ítem 1 + r3 ítem 4): la SEÑAL completa del
  // hogar para esta mascota — alimenta la pastilla del header Y las
  // celdas de CÓMO ESTÁ HOY (una sola verdad, un solo fetch).
  const [senal, setSenal] = useState<SenalesHogarMascota | null>(null);
  // r5: vacunas agrupadas-colapsadas + historia colapsada con filtros
  const [historiaRevelada, setHistoriaRevelada] = useState(false);
  const [filtroHistoria, setFiltroHistoria] = useState<FiltroHistoria>('todo');
  const [ventana, setVentana] = useState<VentanaVitales>('semana');
  // los paseos crudos: la ventana se computa acá (ver nota de API)
  const [paseosTrack, setPaseosTrack] = useState<PaseoConTrack[] | null>(null);

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
          if (!vigente) return;
          setVitales(pv.ok ? calcularVitales(pv.data, new Date()) : 'error');
          setPaseosTrack(pv.ok ? pv.data : null);
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
      {/* r10-1 · EL HUECO BLANCO: había DOS botones de atrás. CORRECCIÓN
          DE DIAGNÓSTICO (medida, no asumida): la banda NO era el header
          nativo — el Stack del hogar YA tiene headerShown:false desde
          S51; era MI PROPIO <Encabezado navegacion> que sobrevivió al
          reemplazo de r7 (empecé el corte en el ScrollView y quedó
          arriba). Muere acá: el degradado va A SANGRE hasta el borde
          superior y la safe area se paga con padding ADENTRO del techo
          (insets.top, ya cableado). Los Encabezado de los early-returns
          (cargando/error) SE CONSERVAN: esas ramas no tienen techo. */}
      {/* ═══ r7 · LA LÁMINA ficha-mascota.html ES EL ACUERDO ═══
          Leída como CRITERIO (§10): cero box-shadow/transición de CSS
          (sombras por elevacion.ts), el .js es DOM y su lógica se
          re-pensó. ⚠️ PARO DE COLOR EJECUTADO (regla del founder): 16
          de los 17 hexes de epetplace-lamina.css NO existen en
          palette.ts (solo #FF00AF coincide) — la lámina propone una
          paleta v7 entera (okL/atnL/nulL "terrosos", capas remapeadas,
          papel y tinta propios, gradiente de 4 stops). NADA de eso se
          porta: la composición viaja con NUESTROS tokens. */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ① TECHO RETRATO (lámina: "el retrato no es un retrato" —
            110px sobre fondo casi blanco es un avatar de lista, no el
            sujeto de la pantalla). Techo de MARCA + retrato circular
            con ARO + sello que MONTA el aro + nombre serif + meta mono.
            A4 (§9bis.2 FIRMADA): la luz de la esquina, único adorno. */}
        {(() => {
          const relleno = {
            paddingTop: insets.top + spacing[3],
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[12],
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            overflow: 'hidden' as const,
          };
          const sobreMarca = esMemorial ? theme.text.primary : theme.text.onGradient;
          const contenido = (
            <>
              {!esMemorial ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -96,
                    right: -70,
                    width: 262,
                    height: 262,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.07)',
                  }}
                />
              ) : null}
              {/* atrás · editar · compartir — la lámina cierra lápiz y
                  compartir como CONTROLES (trazo 1.9 SIN huella: no son
                  objetos del oficio, Ley 12). */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('perfil.volver')}
                  onPress={() => router.back()}
                  style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path d="m14 5-7 7 7 7" stroke={sobreMarca} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('perfil.editar')}
                    onPress={() =>
                      router.push({ pathname: '/hogar/foto-mascota', params: { mascotaId: mascota.id, nombre: mascota.nombre } })
                    }
                    style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {/* S86-B · del registry (D-645). Estaba dibujado a mano
                        ACÁ, en un archivo que ya importaba `Icono` — y le
                        faltaba el CORTE DEL BISEL que el registry declara
                        imprescindible: «sin él, a 21px la punta se lee como un
                        triángulo mudo». La copia no envejeció mal: nació
                        incompleta. */}
                    <Icono nombre="lapiz" tamano={20} tinta={sobreMarca} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('perfil.compartir')}
                    onPress={() => void Share.share({ message: t('perfil.compartirMensaje', { nombre: mascota.nombre }) })}
                    style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {/* S86-B · del registry (D-645). ⚠️ Y ES EL CASO QUE
                        MIDE EL LÍMITE DEL VIGILANTE: acá los TRES paths del
                        glifo viajaban CONCATENADOS en un solo `d=`, así que
                        R30 no podía verlo — sus tres paths sueltos quedan por
                        debajo del umbral de 18 chars que la regla usa para no
                        cazar chevrones por casualidad. Se curó el sitio en vez
                        de aflojar el umbral: bajarlo compra ruido, no cobertura. */}
                    <Icono nombre="compartir" tamano={20} tinta={sobreMarca} />
                  </Pressable>
                </View>
              </View>

              {/* EL RETRATO — 200 con aro. CHOQUE DECLARADO (la lámina lo
                  declara igual): el squircle 32% S61-A10 NO aplica — el
                  retrato de la ficha es circular, no un avatar suelto;
                  por eso no pasa por AvatarMascota. */}
              <View style={{ alignItems: 'center', marginTop: spacing[5] }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('fotoEncuadre.editarFotoA11y', { nombre: mascota.nombre })}
                  onPress={() =>
                    router.push({ pathname: '/hogar/foto-mascota', params: { mascotaId: mascota.id, nombre: mascota.nombre } })
                  }
                  {...presionAvatar.handlers}
                >
                  <Animated.View style={presionAvatar.estiloPresionado}>
                    <View
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: 999,
                        borderWidth: 8,
                        borderColor: esMemorial ? theme.bg.overlay : 'rgba(255,255,255,0.2)',
                        backgroundColor: theme.bg.overlay,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {fotoFirmada !== undefined ? (
                        <Image
                          source={{ uri: fotoFirmada }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          accessibilityIgnoresInvertColors
                        />
                      ) : (
                        <Svg width={84} height={84} viewBox="0 0 24 24">
                          <Huella color={theme.capa.identidad} escala={0.9} x={1.2} y={1.2} />
                        </Svg>
                      )}
                    </View>
                  </Animated.View>
                  {/* EL SELLO que MONTA el aro — el mismo gesto que la
                      tarjeta montando el borde, a otra escala. */}
                  {pastilla !== null ? (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: -spacing[2],
                        alignSelf: 'center',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing[1.5],
                        borderRadius: 999,
                        backgroundColor: theme.bg.card,
                        paddingHorizontal: spacing[3],
                        paddingVertical: spacing[1.5],
                        boxShadow: theme.elevacion.elevada,
                      }}
                    >
                      {pastilla === 'alDia' ? (
                        <Svg width={14} height={14} viewBox="0 0 24 24">
                          <Path d="m5 12.6 4.6 4.6L19 7.8" stroke={theme.status.successText} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </Svg>
                      ) : null}
                      <Texto variante="dato" color={pastilla === 'pideAtencion' ? 'danger' : 'primary'}>
                        {pastilla === 'alDia'
                          ? t('perfil.pastillaAlDia')
                          : pastilla === 'pideAtencion'
                            ? t('perfil.pastillaAtencion')
                            : t('perfil.pastillaConociendo')}
                      </Texto>
                    </View>
                  ) : null}
                </Pressable>
              </View>

              {/* @override-s82c — el nombre en SERIF (la pieza es de B) */}
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: SERIF_LOCAL,
                  fontSize: 44,
                  lineHeight: 48,
                  textAlign: 'center',
                  color: sobreMarca,
                  marginTop: spacing[6],
                }}
              >
                {mascota.nombre}
              </Text>
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.sm,
                  letterSpacing: typography.tracking.mono,
                  textAlign: 'center',
                  color: sobreMarca,
                  opacity: esMemorial ? 1 : 0.76,
                  marginTop: spacing[2],
                }}
              >
                {[
                  mascota.raza,
                  meses !== null ? vozEdad(meses, t) : null,
                  peso_clinico_kg !== null ? `${peso_clinico_kg} kg` : null,
                ]
                  .filter((x): x is string => x !== null && x !== '')
                  .join(' · ')
                  .toLowerCase()}
              </Text>
            </>
          );
          return esMemorial ? (
            <View style={[relleno, { backgroundColor: theme.bg.card }]}>{contenido}</View>
          ) : (
            <LinearGradient
              colors={[...theme.accent.gradient.colors] as [string, string, ...string[]]}
              locations={[...theme.accent.gradient.locations] as [number, number, ...number[]]}
              start={{ x: 0.13, y: 0 }}
              end={{ x: 0.87, y: 1 }}
              style={relleno}
            >
              {contenido}
            </LinearGradient>
          );
        })()}

        {/* ── ② LA TARJETA QUE MONTA EL BORDE (patrón 1 — el solape que
            r3 dejó declarado esperando la imagen). DOS hechos reales:
            "dos hechos reales valen más que tres con uno inventado". */}
        {perfil.paseos_total > 0 || vacunas.length > 0 ? (
          <View style={{ paddingHorizontal: spacing[5], marginTop: -spacing[8], zIndex: 2 }}>
            <Tarjeta elevacion="elevada">
              <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                <View style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}>
                  <Text style={{ fontFamily: typography.family.mono.medium, fontSize: typography.size.xl, fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                    {perfil.paseos_total}
                  </Text>
                  <Texto variante="apoyo">{t('perfil.hechosPaseos')}</Texto>
                </View>
                <View style={{ width: 1, backgroundColor: theme.border.default, marginVertical: spacing[1] }} />
                <View style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}>
                  <Text style={{ fontFamily: typography.family.mono.medium, fontSize: typography.size.xl, fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                    {vacunas.length}
                  </Text>
                  <Texto variante="apoyo">{t('perfil.hechosVacunas')}</Texto>
                </View>
              </View>
            </Tarjeta>
          </View>
        ) : null}

        {/* ── ③ CÓMO ESTÁ HOY — la grilla con lo que SÍ hay + UNA fila
            que agrupa la ausencia (el defecto que la lámina nombra:
            "cuatro tarjetas para la ausencia"). El rótulo lleva su
            CUENTA. "Cargar el carnet" vive ACÁ, en la fila de la falta
            — por eso muere el segundo CTA de Vacunas. */}
        {(() => {
          // r10-2 · LOS TRES CASOS de vacunas (la celda medía mal y la
          // pantalla se contradecía: decía "sin registro" con 8 vacunas
          // en el carnet abajo). La celda mide si sabemos el ESTADO:
          //   · sin NINGÚN registro   → no se monta; va a la ausencia
          //   · con registros, SIN fecha_proxima → "Sin fecha de
          //     refuerzo" en gris (no sabemos, y NO es que falten datos)
          //   · con fecha → al día / falta una
          type CeldaHoy = {
            key: string;
            rotulo: string;
            valor: string;
            detalle: string | null;
            estado: 'atencion' | 'alDia' | 'sinSaber';
          };
          const hoyIso = new Intl.DateTimeFormat('en-CA').format(hoy);
          const pv = senal?.proxima_vacuna ?? null;
          const celdas: CeldaHoy[] = [];
          const faltan: string[] = [];
          if (senal !== null && senal.vacunas_total > 0) {
            if (pv === null) {
              celdas.push({
                key: 'vac',
                rotulo: t('perfil.hechosVacunas'),
                valor: t('perfil.hoySinFechaRefuerzo'),
                detalle: t('perfil.hoyEnCarnet', { n: senal.vacunas_total }),
                estado: 'sinSaber',
              });
            } else {
              celdas.push(
                pv.fecha < hoyIso
                  ? { key: 'vac', rotulo: t('perfil.hechosVacunas'), valor: t('perfil.hoyFaltaUna'), detalle: t('perfil.hoyRefuerzoVencido'), estado: 'atencion' }
                  : { key: 'vac', rotulo: t('perfil.hechosVacunas'), valor: t('perfil.hoyAlDia'), detalle: t('perfil.hoyHasta', { fecha: fechaCortaMono(pv.fecha, idioma) }), estado: 'alDia' },
              );
            }
          } else {
            faltan.push(t('perfil.hechosVacunas').toLowerCase());
          }
          if (peso_clinico_kg !== null) {
            celdas.push({ key: 'peso', rotulo: t('perfil.peso'), valor: `${peso_clinico_kg} kg`, detalle: null, estado: 'alDia' });
          } else {
            faltan.push(t('perfil.peso').toLowerCase());
          }
          faltan.push(t('perfil.hoyDesparasitacion').toLowerCase(), t('perfil.hoyAlergias').toLowerCase());
          return (
            <View style={{ marginTop: spacing[8] }}>
              {/* r10-3: la fracción "1 de 4" MURIÓ — no nombraba lo que
                  contaba (el founder preguntó cuáles eran los otros
                  tres) y la fila de ausencia de abajo YA los nombra. */}
              <RotuloSeccion titulo={t('perfil.hoyTitulo')} cuenta={null} />
              {celdas.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2.5], paddingHorizontal: spacing[5] }}>
                  {celdas.map((c) => {
                    const cuerpo = (
                      <CantoCurva
                        color={
                          c.estado === 'atencion'
                            ? theme.status.warning
                            : c.estado === 'alDia'
                              ? theme.status.success
                              : theme.text.tertiary
                        }
                      >
                        <View style={{ padding: spacing[3], gap: spacing[1.5], minHeight: 44 }}>
                          <Texto variante="apoyo">{c.rotulo}</Texto>
                          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}>
                            {c.valor}
                          </Text>
                          {c.detalle !== null ? <Texto variante="dato" numberOfLines={1}>{c.detalle}</Texto> : null}
                        </View>
                      </CantoCurva>
                    );
                    return (
                      <View key={c.key} style={{ flexBasis: '47%', flexGrow: 1 }}>
                        {/* r8: la celda de VACUNAS navega al PLAN DE VACUNAS
                            que A construyó (contexto 1 de la misma lámina) —
                            estaba VIVA E INALCANZABLE: ninguna superficie la
                            enlazaba. La de peso no navega (no tiene destino
                            propio: su historia vive en el expediente). */}
                        {c.key === 'vac' ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${c.rotulo}, ${c.valor}`}
                            onPress={() =>
                              router.push({
                                pathname: '/hogar/vacunas/[mascotaId]',
                                params: { mascotaId: mascota.id, nombre: mascota.nombre },
                              })
                            }
                          >
                            {cuerpo}
                          </Pressable>
                        ) : (
                          cuerpo
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null}
              {faltan.length > 0 ? (
                <View style={{ paddingHorizontal: spacing[5], marginTop: celdas.length > 0 ? spacing[2.5] : 0 }}>
                  <CantoCurva color={theme.text.tertiary}>
                    <View style={{ padding: spacing[3], gap: spacing[2] }}>
                      <Texto variante="cuerpo">{t('perfil.hoySinRegistro')}</Texto>
                      <Texto variante="dato">{faltan.join(' · ')}</Texto>
                      <View style={{ alignSelf: 'flex-start', marginTop: spacing[1] }}>
                        {/* r10-4: NO va en negro. Es acción SECUNDARIA
                            dentro de una tarjeta → `sinCaja` de B (su
                            relleno tenue) — este es su consumidor real
                            en una pantalla que el founder SÍ mira. */}
                        <Boton
                          variante="sinCaja"
                          tamaño="sm"
                          etiqueta={t('perfil.cargarCarnet')}
                          onPress={() => router.push({ pathname: '/carnet', params: { mascotaId: mascota.id, nombre: mascota.nombre } })}
                        />
                      </View>
                    </View>
                  </CantoCurva>
                </View>
              ) : null}
              <Text
                style={{
                  fontFamily: SERIF_LOCAL,
                  fontStyle: 'italic',
                  fontSize: typography.size.md,
                  lineHeight: Math.round(typography.size.md * 1.5),
                  color: theme.text.secondary,
                  paddingHorizontal: spacing[5],
                  marginTop: spacing[4],
                }}
              >
                {t('perfil.vozExpediente')}
              </Text>
            </View>
          );
        })()}

        {/* ── ④ IDENTIDAD sin caja por dato (lámina: "hoy son seis
            mini-tarjetas dentro de una tarjeta"): UNA superficie con
            hairlines, rótulo mono a la izquierda, valor a la derecha.
            A6: no se encierra en marco lo que ya está en un marco.
            Talla/pelaje y paseos-en-grupo siguen EDITABLES (P19). */}
        <View style={{ marginTop: spacing[8] }}>
          <RotuloSeccion
            titulo={t('perfil.identidad')}
            cuenta={String(
              datosIdentidad.length +
                (mascota.especie === 'perro' ? 1 : 0) +
                (mascota.especie === 'perro' || mascota.especie === 'gato' ? 1 : 0),
            )}
          />
          <View style={{ paddingHorizontal: spacing[5] }}>
            <Tarjeta relleno="ninguno" elevacion="reposo">
              {datosIdentidad.map((d, i) => (
                <View key={d.etiqueta}>
                  {i > 0 ? <Separador /> : null}
                  <FilaIdentidad etiqueta={d.etiqueta} valor={d.valor} mono={d.mono === true} />
                </View>
              ))}
              {mascota.especie === 'perro' ? (
                <>
                  <Separador />
                  <Pressable accessibilityRole="button" onPress={() => setSocialHojaAbierta(true)}>
                    <FilaIdentidad
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
                </>
              ) : null}
              {mascota.especie === 'perro' || mascota.especie === 'gato' ? (
                <>
                  <Separador />
                  <Pressable accessibilityRole="button" onPress={() => setTallaHojaAbierta(true)}>
                    <FilaIdentidad
                      etiqueta={t('grooming.tallaCeldaTitulo')}
                      valor={
                        mascota.talla === null || mascota.pelaje === null
                          ? t('grooming.tallaEstadoSinDeclarar')
                          : `${t(mascota.talla === 'S' ? 'grooming.tallaS' : mascota.talla === 'M' ? 'grooming.tallaM' : 'grooming.tallaL')}${mascota.pelaje === 'largo' ? ` · ${t('grooming.pelajeLargoCorto')}` : ''}`
                      }
                    />
                  </Pressable>
                </>
              ) : null}
            </Tarjeta>
          </View>
        </View>

        {/* ── ⑤ VACUNAS — el resumen en UNA fila con el canto de SALUD y
            el pie que revela. "Cargar carnet" ya NO vive acá (se mudó a
            la fila de la ausencia): un solo gesto por sección. */}
        <View style={{ marginTop: spacing[8] }}>
          <RotuloSeccion titulo={t('perfil.vacunas')} cuenta={String(vacunas.length)} />
          <View style={{ paddingHorizontal: spacing[5] }}>
            {vacunas.length === 0 ? (
              <EstadoVacio
                registro="seccion"
                titulo={t('perfil.carnetVacio')}
                descripcion={t('perfil.carnetVacioDetalle')}
              />
            ) : (
              <>
                {/* r8 (la lámina lo pide y AHORA existe el destino): el
                    resumen NAVEGA al PLAN DE VACUNAS de A — "ver el
                    carnet completo". Muere el despliegue inline: la
                    lista de 8 vacunas competía con la pantalla
                    dedicada (Chanel — un solo gesto, una sola casa). */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('perfil.verCarnetCompleto')}
                  onPress={() =>
                    router.push({
                      pathname: '/hogar/vacunas/[mascotaId]',
                      params: { mascotaId: mascota.id, nombre: mascota.nombre },
                    })
                  }
                >
                  <CantoCurva color={theme.capa.identidad}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], minHeight: 58 }}>
                      <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
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
                      <Icono nombre="vacuna" tamano={26} />
                      {/* › NAVEGA (Ley 19.7: la dirección codifica la verdad) */}
                      <Svg width={19} height={19} viewBox="0 0 24 24">
                        <Path d="M9 5l7 7-7 7" stroke={theme.text.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </Svg>
                    </View>
                  </CantoCurva>
                </Pressable>

              </>
            )}
          </View>
        </View>

        {/* ── S89 órdenes 8⑤/10① · LOS PAPELES DEL PRODUCTO ──────────────
            Los documentos viven JUNTOS: un solo lugar donde la familia sabe
            que están sus papeles. El botón del carnet salió de la sección
            Vacunas a propósito — ahí competía con "Ver el carnet completo"
            (Chanel: un gesto por sección).
            Cada papel se emite con un token de UN SOLO USO: el JWT jamás
            viaja en una URL, y un link reenviado ya no sirve. */}
        <View style={{ marginTop: spacing[8] }}>
          <RotuloSeccion titulo={t('perfil.documentos')} cuenta={null} />
          <View style={{ paddingHorizontal: spacing[5] }}>
            <Boton
              etiqueta={t('perfil.descargarCarnet')}
              variante="sinCaja"
              bloque
              cargando={bajandoDoc === 'carnet_vacunas'}
              onPress={() => { void bajarDocumento('carnet_vacunas'); }}
            />
            <Boton
              etiqueta={t('perfil.descargarHistoria')}
              variante="sinCaja"
              bloque
              cargando={bajandoDoc === 'historia_clinica'}
              onPress={() => { void bajarDocumento('historia_clinica'); }}
            />
            {/* Ley 13: el fallo DICE que es fallo, jamás silencio */}
            {fallaCarnet !== null ? (
              <View style={{ paddingTop: spacing[2] }}>
                <Texto variante="dato" color="danger">{fallaCarnet}</Texto>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── ⑥ SU HISTORIA — dentro de la ficha lleva UN SOLO EJE: el de
            SERVICIO con su glifo (el tramo temporal vive en la pantalla
            completa — contrato del contexto 2). Filas con columna de
            fecha, título, prestador, glifo; el canto pinta la curva. */}
        <View style={{ marginTop: spacing[8] }}>
          {items === null ? (
            <>
              <RotuloSeccion titulo={t('perfil.vida')} cuenta={null} />
              <View style={{ paddingHorizontal: spacing[5] }}>
                <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
                  <View style={{ gap: spacing[2] }}>
                    <Esqueleto forma="bloque" ancho="100%" alto={58} />
                    <Esqueleto forma="bloque" ancho="100%" alto={58} />
                    <Esqueleto forma="bloque" ancho="100%" alto={58} />
                  </View>
                </EsqueletoGrupo>
              </View>
            </>
          ) : items === 'error' ? (
            <>
              <RotuloSeccion titulo={t('perfil.vida')} cuenta={null} />
              <View style={{ paddingHorizontal: spacing[5] }}>
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
              </View>
            </>
          ) : items.length === 0 ? (
            <>
              <RotuloSeccion titulo={t('perfil.vida')} cuenta={null} />
              <View style={{ paddingHorizontal: spacing[5] }}>
                <EstadoVacio titulo={t('hogar.historiaEmpieza')} descripcion={t('hogar.historiaEmpiezaDetalle')} />
              </View>
            </>
          ) : (
            (() => {
              // el chip de un servicio SOLO se dibuja si existe en el
              // expediente (la lámina: SV_PRES) — Ley 23: la puerta no
              // ofrece lo que no tiene.
              const FAMILIAS: { codigo: FiltroHistoria; etiqueta: string; icono: IconoNombre; capa: 'identidad' | 'cuidado' }[] = [
                { codigo: 'salud', etiqueta: t('hogar.filtroSalud'), icono: 'veterinaria', capa: 'identidad' },
                { codigo: 'paseos', etiqueta: t('hogar.filtroPaseos'), icono: 'paseo', capa: 'cuidado' },
                { codigo: 'estetica', etiqueta: t('hogar.filtroEstetica'), icono: 'grooming', capa: 'cuidado' },
                { codigo: 'adiestramiento', etiqueta: t('hogar.filtroAdiestramiento'), icono: 'training', capa: 'cuidado' },
              ];
              const presentes = FAMILIAS.filter((f) => items.some((it) => FAMILIA_DE_TIPO[it.tipo] === f.codigo));
              const filtrados = filtroHistoria === 'todo' ? items : items.filter((it) => FAMILIA_DE_TIPO[it.tipo] === filtroHistoria);
              const visibles = historiaRevelada ? filtrados : filtrados.slice(0, 3);
              return (
                <>
                  <RotuloSeccion titulo={t('perfil.vida')} cuenta={String(items.length)} />
                  {presentes.length > 1 ? (
                    <FiltroPills
                      activo={filtroHistoria}
                      onCambio={(c) => setFiltroHistoria(c)}
                      opciones={[
                        { codigo: 'todo' as FiltroHistoria, etiqueta: t('hogar.filtroTodo'), icono: 'huella' as const, capa: null },
                        ...presentes.map((f) => ({ codigo: f.codigo, etiqueta: f.etiqueta, icono: f.icono, capa: f.capa })),
                      ]}
                    />
                  ) : null}
                  <View style={{ paddingHorizontal: spacing[5], gap: spacing[2.5], marginTop: spacing[3] }}>
                    {filtrados.length === 0 ? (
                      <EstadoVacio registro="seccion" titulo={t('hogar.filtroSinMomentos')} />
                    ) : (
                      <>
                        {visibles.map((it) => {
                          const familia = FAMILIA_DE_TIPO[it.tipo];
                          const color =
                            familia === 'salud' ? theme.capa.identidad : familia !== undefined ? theme.capa.cuidado : null;
                          const glifoFila: IconoNombre | null =
                            familia === 'salud'
                              ? 'veterinaria'
                              : familia === 'paseos'
                                ? 'paseo'
                                : familia === 'estetica'
                                  ? 'grooming'
                                  : familia === 'adiestramiento'
                                    ? 'training'
                                    : null;
                          const destino =
                            it.tipo === 'historia_clinica_registrada'
                              ? () => router.push({ pathname: '/parte/[eventoId]', params: { eventoId: it.evento_id, nombre: mascota.nombre } })
                              : it.atencion_id !== null
                                ? () => router.push({ pathname: '/paseo/[atencionId]', params: { atencionId: it.atencion_id as string } })
                                : null;
                          const dia = it.fecha_evento.slice(8, 10);
                          const mes = fechaCortaMono(it.fecha_evento.slice(0, 10), idioma).split(' ')[1] ?? '';
                          const fila = (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], minHeight: 58 }}>
                              <View style={{ width: 38, alignItems: 'center' }}>
                                <Text style={{ fontFamily: typography.family.mono.medium, fontSize: typography.size.md, color: theme.text.primary }}>
                                  {dia}
                                </Text>
                                <Texto variante="dato">{mes}</Texto>
                              </View>
                              <View style={{ flex: 1, minWidth: 0, gap: spacing[0.5] }}>
                                <Texto variante="cuerpo" numberOfLines={1}>{vozHecho(it, t)}</Texto>
                                {it.titulo_fuente !== null ? (
                                  <Texto variante="dato" numberOfLines={1}>{it.titulo_fuente.toLowerCase()}</Texto>
                                ) : null}
                              </View>
                              {glifoFila !== null ? <Icono nombre={glifoFila} tamano={26} /> : null}
                              {destino !== null ? (
                                <Svg width={19} height={19} viewBox="0 0 24 24">
                                  <Path d="M9 5l7 7-7 7" stroke={theme.text.tertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </Svg>
                              ) : null}
                            </View>
                          );
                          return (
                            <CantoCurva key={it.evento_id} color={color}>
                              {destino !== null ? (
                                <Pressable accessibilityRole="button" onPress={destino}>
                                  {fila}
                                </Pressable>
                              ) : (
                                fila
                              )}
                            </CantoCurva>
                          );
                        })}
                        {filtrados.length > 3 ? (
                          <PieRevelar
                            n={filtrados.length - 3}
                            revelado={historiaRevelada}
                            onPress={() => setHistoriaRevelada((v) => !v)}
                          />
                        ) : null}
                        {(historiaRevelada || filtrados.length <= 3) && estadoPie !== 'nada' ? (
                          estadoPie === 'cargando' ? (
                            <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
                              <Esqueleto forma="linea" ancho="40%" />
                            </EsqueletoGrupo>
                          ) : (
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
                </>
              );
            })()
          )}
        </View>

        {/* ── ⑦ VITALES — SIN NINGÚN ÍNDICE. La lámina CIERRA el choque
            que r5 mandó al gate: los dos guijarros de "Índice de salud"
            y "Descanso y actividad" MUEREN (eran un puntaje en potencia,
            MODELO_LOYALTY §3); mientras no existan se dicen en UNA línea
            de mono, jamás en dos tarjetas. Km, min, salidas y una barra
            por día: hechos del expediente. */}
        {vitales !== 'cargando' && vitales !== 'error' && vitales.totalSalidas > 0 ? (
          (() => {
            // r10-5: la ventana se compone acá (ver nota de API arriba).
            const DIA = 24 * 60 * 60 * 1000;
            const dias = ventana === 'hoy' ? 1 : ventana === 'semana' ? 7 : 30;
            const corte = hoy.getTime() - dias * DIA;
            const enVentana = (paseosTrack ?? []).filter((p) => {
              const ts = new Date(p.fecha).getTime();
              return !Number.isNaN(ts) && ts >= corte;
            });
            const km = enVentana.reduce((s, p) => s + distanciaTrackKm(p.puntos), 0);
            const min = enVentana.reduce((s, p) => s + (p.duracionMin ?? 0), 0);
            const salidas = enVentana.length;
            return (
              <View style={{ marginTop: spacing[8] }}>
                <RotuloSeccion titulo={t('perfil.vitales')} cuenta={null} />
                <FiltroPills
                  activo={ventana}
                  onCambio={(v) => setVentana(v)}
                  opciones={[
                    { codigo: 'hoy' as VentanaVitales, etiqueta: t('perfil.ventanaHoy'), icono: null, capa: null },
                    { codigo: 'semana' as VentanaVitales, etiqueta: t('perfil.ventanaSemana'), icono: null, capa: null },
                    { codigo: 'mes' as VentanaVitales, etiqueta: t('perfil.ventanaMes'), icono: null, capa: null },
                  ]}
                />
                <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[3] }}>
                  {salidas === 0 ? (
                    // el nulo honesto de la ventana: no hay salidas en
                    // este tramo — se dice, no se pintan ceros (L-139)
                    <EstadoVacio registro="seccion" titulo={t('perfil.vitalesSinSalidas')} />
                  ) : (
                    <Tarjeta elevacion="reposo">
                      <View style={{ gap: spacing[3] }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[6] }}>
                          <View>
                            <Text style={{ fontFamily: typography.family.mono.medium, fontSize: typography.size['2xl'], fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                              {km.toFixed(1)}
                            </Text>
                            <Texto variante="apoyo">{t('perfil.vitalesKm')}</Texto>
                          </View>
                          <View>
                            <Text style={{ fontFamily: typography.family.mono.medium, fontSize: typography.size['2xl'], fontVariant: ['tabular-nums'], color: theme.text.primary }}>
                              {min}
                            </Text>
                            <Texto variante="apoyo">{t('perfil.vitalesMin')}</Texto>
                          </View>
                          {/* la barra es POR DÍA DE LA SEMANA: solo tiene
                              sentido en la ventana de 7 días. En hoy y mes
                              NO se dibuja — si un eje no parte los datos,
                              no se dibuja (ley de la lámina). */}
                          {ventana === 'semana' ? (
                            <View style={{ flex: 1 }}>
                              <BarrasSemana
                                valores={vitales.kmPorDia}
                                capa="cuidado"
                                etiqueta={t('perfil.vitalesBarrasA11y', { n: vitales.kmPorDia.filter((v) => v > 0).length })}
                              />
                            </View>
                          ) : null}
                        </View>
                        <Separador />
                        <Texto variante="dato">
                          {(salidas === 1
                            ? t('perfil.vitalesMetaUna', { fecha: vitales.ultimaSalida !== null ? fechaCortaMono(vitales.ultimaSalida, idioma) : '—' })
                            : t('perfil.vitalesMetaVarias', { n: salidas, fecha: vitales.ultimaSalida !== null ? fechaCortaMono(vitales.ultimaSalida, idioma) : '—' })
                          ).toLowerCase()}
                        </Texto>
                      </View>
                    </Tarjeta>
                  )}
                  {/* la comparativa es SEMANA contra semana: solo ahí */}
                  {ventana === 'semana' && vitales.caminoMasQueAnterior ? (
                    <Text
                      style={{
                        fontFamily: SERIF_LOCAL,
                        fontStyle: 'italic',
                        fontSize: typography.size.md,
                        lineHeight: Math.round(typography.size.md * 1.5),
                        color: theme.text.secondary,
                        marginTop: spacing[3],
                      }}
                    >
                      {t('perfil.vitalesComparativa')}
                    </Text>
                  ) : null}
                  <View style={{ marginTop: spacing[3] }}>
                    <Texto variante="dato">{t('perfil.indicesTodavia')}</Texto>
                  </View>
                </View>
              </View>
            );
          })()
        ) : null}

        {/* ── ⑧ EL PIE QUE DICE POR QUÉ (propuesta de la lámina: "un
            botón al final del scroll no es una invitación, es un
            botón"). Rótulo mono + una razón que sale del EXPEDIENTE +
            el CTA en degradado. La razón la calcula la PANTALLA. */}
        <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[8] }}>
          <Tarjeta elevacion="elevada">
            <View style={{ gap: spacing[3] }}>
              <Texto variante="apoyo">{t('perfil.pieRotulo')}</Texto>
              <Texto variante="apoyo">
                {(() => {
                  const hoyIso2 = new Intl.DateTimeFormat('en-CA').format(hoy);
                  const pv2 = senal?.proxima_vacuna ?? null;
                  if (pv2 !== null && pv2.fecha < hoyIso2) return t('perfil.pieRazonVacuna', { vacuna: pv2.nombre });
                  if (senal !== null && senal.vacunas_total === 0) return t('perfil.pieRazonSinCarnet', { nombre: mascota.nombre });
                  return t('perfil.pieRazonGeneral', { nombre: mascota.nombre });
                })()}
              </Texto>
              <Boton
                variante="marca"
                bloque
                etiqueta={t('perfil.reservarServicioDe', { nombre: mascota.nombre })}
                onPress={() => router.navigate('/explorar')}
              />
            </View>
          </Tarjeta>
        </View>

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
