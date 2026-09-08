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

import { useCallback, useEffect, useRef, useState } from 'react';
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
  ChipEntidad,
  Tarjeta,
  Texto,
  radius,
  spacing,
  typography,
  useAviso,
  usePresionado,
  useTheme,
  type IconoNombre,
  type LineaDeVidaEstadoPie,
  FichaRaza,
  FilaAcciones,
  TarjetaConociendolo,
  TarjetaHoy,
  TarjetaMetrica,
  FranjaSeguridad,
  BotonContanos,
  PastillaConociendolo,
  CeldasHoy,
  FiltrosLineaDeVida,
  type TipoLineaDeVida,
  PiezaMedicacionActiva,
  ordenarSeguridad,
  tendenciaPeso,
} from '@epetplace/ui';
import {
  leerTimelineMascota,
  obtenerEstadoHogar,
  obtenerPaseosConTrack,
  obtenerPerfilMascota,
  resolverUrlFoto,
  listarPapelesDeMascota,
  type ConsultaConReceta,
  type ItemTimeline,
  type TipoDocumentoExpediente,
  type PaseoConTrack,
  type PerfilMascota,
  type SenalesHogarMascota,
  obtenerHistoriaPeso,
  obtenerRazasDeEspecie,
  obtenerCensoDelAcuario,
  type CensoDelAcuario,
  obtenerSolicitudesPendientesDueno,
  obtenerPresupuestosFamilia,
  obtenerCitasActivasHogar,
  type PesoDeLaSerie,
  obtenerTableroMascota,
  obtenerHoyMascota,
  obtenerCitasDeMascota,
  obtenerCodigosMedicos,
  type TableroMascota,
  type TableroMemorial,
  type HoyDeMascota,
  obtenerContenidoDeRaza,
  type ContenidoDeRaza,
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
import { FAMILIA_DE_TIPO, capaDeHecho, vozHecho } from '@/lib/voz-hecho';
import { useFotosDeRecuerdos } from '@/lib/recuerdo/fotos';
import { PAPELES_DE_MASCOTA, componerPapeles } from '@/lib/papeles';
import { abrirReceta, resolverDescarga, type Descarga } from '@/lib/descarga-papel';
import { CantoCurva } from '@/components/canto-curva';
import { FilaDocumento } from '@/components/fila-documento';
import { vozEdad, vozNacimiento, vozOrigen } from '@/lib/voz-mascota';
import { contarPendientesDe } from '@/lib/pendientes';
import { itemsDeSeguridad } from '@/lib/perfil/seguridad';
import { coberturaDePlagas, medicacionDeLaCelda, proximaDesparasitacion } from '@/lib/perfil/hoy';
import { tipoDeLineaDeVida } from '@/lib/perfil/tipo-linea-vida';
import { tarjetasDelTablero } from '@/lib/perfil/tablero';

/** El orden de los nueve, que es el que B reparte en filas. */
const ORDEN_TIPOS: readonly TipoLineaDeVida[] = [
  'salud', 'vacunas', 'antiparasitario', 'peso',
  'paseos', 'estetica', 'adiestramiento', 'guarderia', 'recuerdos',
];
import { composicionDe } from '@/lib/composicion-sujeto';
import { HabitantesAcuarioHoja } from '@/components/habitantes-acuario-hoja';
import { caraDeMascota, urlDeRutaGaleria } from '@/lib/cara-mascota';
import { RegistrarPesoHoja } from '@/components/registrar-peso-hoja';
import { EditarRazaHoja } from '@/components/editar-raza-hoja';
import { RegistrarMedicacionHoja } from '@/components/registrar-medicacion-hoja';
import { HojaInvitacionBio, type ClaseBio } from '@/components/invitacion-bio-hojas';
import { HojaContanos, entradasContanos, useContanos } from '@/components/contanos';
import { useChipsRasgos } from '@/components/chips-rasgos';
import { HojaReceta } from '@/components/hoja-receta';
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
/**
 * EL CHEVRON DE ESTA PANTALLA — una copia, no dos.
 *
 * ⚠️ SE DIBUJA ACÁ Y ES UN HALLAZGO, no una preferencia: la tabla única del
 * trazo (`packages/ui/.../chevron.ts`) **no se exporta a las apps** a propósito
 * —«una pantalla que necesite un chevron usa la PIEZA que lo porta»— y las
 * piezas que lo portan son `CeldaNavegacion`, `PieRevelar` y `FilaCita`.
 * Ninguna sirve para una fila etiqueta-valor ni para una celda de dashboard.
 *
 * Este path ya vivía INLINE en esta pantalla (la fila de historia). Extraerlo
 * no agrega una copia: **junta la que había** y le da un nombre. Pero el hueco
 * de contrato queda declarado para B: hoy no hay vía legal de tener un chevron
 * fuera de esas tres piezas.
 */
function ChevronDerecha({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" aria-hidden>
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/**
 * `accion` = ESTA FILA HACE ALGO, y por eso lleva su flecha (E14: información
 * despliega · acción LLEVA). Las de solo lectura NO la llevan — si todas la
 * tuvieran, dejaría de señalar cuáles se pueden tocar, que es exactamente lo
 * que el founder no podía saber.
 */
function FilaIdentidad({ etiqueta, valor, mono, accion }: { etiqueta: string; valor: string; mono?: boolean; accion?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], minHeight: 44 }}>
      <View style={{ width: 112 }}>
        <Texto variante="apoyo" numberOfLines={1}>{etiqueta}</Texto>
      </View>
      <View style={{ flex: 1 }}>
        <Texto variante={mono === true ? 'dato' : 'cuerpo'} color="primary">{valor}</Texto>
      </View>
      {accion === true ? <ChevronDerecha color={theme.text.tertiary} /> : null}
    </View>
  );
}

import { fechaCortaMono } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
/* 🔴 LA DEFINICIÓN ÚNICA (firma founder 7-sep: **perdida NO es memorial**).
   Alias porque esta pantalla ya tiene su `esMemorial`, que es el OR del dato
   con el tema — dos cosas distintas y por eso dos nombres.
   ⏪ Las tres derivaciones que vivían acá decían `!== null && !== 'activa'` y
   metían a `perdida` adentro: al perfil de una mascota que la familia está
   BUSCANDO le apagaban el producto. */
import { esMemorial as mascotaEnMemorial } from '@/lib/memorial';

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

/* ☠️ `GlifoInfo` MURIÓ ACÁ Y SUBIÓ AL REGISTRY como `info` (S98-B).
 * Su propio JSDoc declaraba la condición —«candidato al registry por su
 * puerta si se repite»— y C la disparó al necesitarlo para la hora de
 * corte en `ventas/configuracion`. **El trazo del registry es ÉSTE**:
 * se copió la geometría medida, no se dibujó una segunda.
 *
 * ⚠️ Y AL MUDARLO SE MIDIÓ QUE YA ESTABA MUERTO: la función existía y
 * **ningún JSX la montaba** (una sola ocurrencia en el archivo: su propia
 * definición). El dibujo que fundó el precedente llevaba quién sabe
 * cuánto sin pintarse — lo destapó el guard R30 al comparar contra el
 * registry recién poblado. *Un glifo local que nadie monta no da síntoma:
 * lo encuentra el día que su gemelo nace.* (Ley 37.)
 */

// S91 · P1 — la voz de la edad y del origen vive en `lib/voz-mascota`:
// dos pantallas que escriben la misma regla divergen (letra de mesa, 8-ago;
// precedente `voz-hecho.ts`). Acá solo se consume.

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
  const { mostrar } = useAviso();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  /** Sonda transversal de P0-C (D-726/D-728): cuántas veces esta pantalla
   *  vuelve a pedir TODO. El `ref` lleva la cuenta y el estado solo la pinta —
   *  contar en el estado lo metería en el ciclo que se quiere medir. */
  const vecesFocoRef = useRef(0);
  const [vecesFoco, setVecesFoco] = useState(0);
  // P19 (S59-A4): la respuesta de socialización es EDITABLE desde acá.
  const [socialHojaAbierta, setSocialHojaAbierta] = useState(false);
  // §3 grooming (S60): talla y pelaje — declarados una vez, EDITABLES
  // siempre desde acá (la otra mitad del patrón P19).
  const [tallaHojaAbierta, setTallaHojaAbierta] = useState(false);
  // S89 órdenes 8⑤/10① — los papeles del producto
  const [bajandoDoc, setBajandoDoc] = useState<TipoDocumentoExpediente | null>(null);
  /** S91-C: las consultas entre las que la familia elige su receta.
   *  `null` = la Hoja está cerrada. Acá la mascota es UNA (la de la
   *  ruta), así que el contexto no necesita llevar su id. */
  const [eligiendoReceta, setEligiendoReceta] = useState<ConsultaConReceta[] | null>(null);
  /** S89-D ①: la sección de papeles nace PLEGADA — el perfil es de la
   *  mascota; sus documentos se piden, no presiden. */
  const [docsAbiertos, setDocsAbiertos] = useState(false);
  /** ⭐ **A LA BÓVEDA** (fase 3 · C1). Antes era `irADocumentos`: scroll hasta
   *  el plegable y desplegarlo. **Documentos ganó pantalla propia**, así que el
   *  destino dejó de ser una posición y pasó a ser una ruta.
   *  ☠️ Con eso murieron el `scrollRef`, el `yDocumentosRef` y el `setTimeout`
   *  que esperaba al despliegue — *lo que sobrevive a su razón es basura que
   *  nadie se anima a tocar* (Ley 37). El `memorial` viaja para que la pantalla
   *  no ofrezca traer papeles a quien está en duelo. */
  const abrirDocumentos = useCallback(() => {
    if (mascotaId === undefined) return;
    router.push({
      pathname: '/hogar/mascota/documentos',
      params: {
        mascotaId,
        nombre: typeof perfil === 'object' ? perfil.mascota.nombre : '',
        /* 🔴 Se deriva del PERFIL y no de `esMemorial`, que se calcula más
           abajo: *un callback declarado antes que su dato no puede leerlo, y
           acá el compilador lo dice — en otros lados no.* Misma regla, misma
           fuente (`estado_vida`), sin el brazo del tema, que acá no aplica. */
        memorial:
          typeof perfil === 'object' && mascotaEnMemorial(perfil.mascota.estado_vida)
            ? '1'
            : '0',
      },
    });
  }, [mascotaId, perfil, router]);
  const [censo, setCenso] = useState<CensoDelAcuario | null>(null);
  const [habitantesHoja, setHabitantesHoja] = useState(false);
  // S90 (firma founder): la lista deriva del CATÁLOGO VIVO; arranca con el
  // respaldo de compilación (la misma foto al día del build).
  const [papeles, setPapeles] = useState(PAPELES_DE_MASCOTA);
  /** S91 · P2 — el disparador de la re-lectura de la serie de peso. */
  const [recargaPeso, setRecargaPeso] = useState(0);


  /** ⭐ **C10 — el contenido de la raza.** Se pide sólo si la mascota declara
   *  raza: sin raza no hay nada que preguntar. `null` = la raza no tiene ficha
   *  (hoy **todas**: `razas_contenido` tiene 0 filas, medido el 5-sep), y ahí
   *  no se dibuja nada. Un fallo deja `null` y la ficha simplemente no aparece
   *  — degradar a ausencia es correcto acá: *no saber de una raza no es un
   *  error que la familia tenga que atender*. */
  const [menuEdicion, setMenuEdicion] = useState(false);
  /** El tablero: **una ida** para las seis tarjetas. */
  const [tablero, setTablero] = useState<TableroMascota | TableroMemorial | null>(null);
  /** ⭐ **HOY: UNA cosa, ya elegida por el servidor.** La prioridad —aviso >
   *  cita 48 h > vacuna 7 d > antiparasitario vencido > tip— vive en el motor
   *  a propósito: *si la superficie recibiera las cinco y eligiera, cada
   *  superficie elegiría distinto* (nota de A, `cf976fa8`). */
  const [hoyMascota, setHoyMascota] = useState<HoyDeMascota | null>(null);
  /** ⭐ **LA PRÓXIMA CITA MÉDICA** (ojo del founder, 2.2.2 · ③). La tarjeta
   *  Citas vive en «Su salud» y mostraba un paseo: el motor trae *la próxima
   *  cita*, sin distinguir oficio. *Un paseo en la sección de salud responde
   *  otra pregunta.*
   *  🔴 Los códigos médicos se LEEN del catálogo (`obtenerCodigosMedicos`,
   *  15 hoy) — **no se copian**: el día que el motor agregue el decimosexto,
   *  una lista escrita acá diría que un acto clínico no lo es. */
  const [citaMedica, setCitaMedica] = useState<{ fecha: string; servicio: string } | null>(null);
  const [contenidoRaza, setContenidoRaza] = useState<ContenidoDeRaza | null>(null);
  useEffect(() => {
    if (typeof perfil !== 'object') return;
    const raza = perfil.mascota.raza;
    if (raza === null || raza === '') return;
    let vivo = true;
    /* ☠️ **ACÁ VIVÍAN DOS SALTOS Y SE FUERON ENTEROS.** Yo resolvía el
       nombre contra `cat_razas` para sacar el slug, porque `mascotas.raza` es
       texto libre y `razas_contenido` se indexa por código. **A se lo llevó al
       servidor** (`resolver_ficha_de_raza`): casa por nombre, por sinónimo, y
       cae a la ficha de la especie — *y el tercer paso ESCRIBE*, así que
       repartirlo entre cliente y servidor habría dejado la mitad sin registrar.
       **Un viaje, una verdad**, que es la misma ley que hoy mató a `esDudosa`
       en el carnet. Se le pasa lo que la familia tecleó y nada más. */
    void obtenerContenidoDeRaza(perfil.mascota.especie, raza).then((r) => {
      if (vivo && r.ok) setContenidoRaza(r.data);
    });
    return () => {
      vivo = false;
    };
  }, [perfil]);

  useEffect(() => {
    if (mascotaId === undefined) return;
    let vivo = true;
    void obtenerTableroMascota(mascotaId).then((r) => {
      /* Un fallo deja `null` y **las tarjetas no se montan**: media sección con
         datos y media sin es peor que ninguna — *la que falta se lee como «no
         tiene», no como «no cargó»*. */
      if (vivo && r.ok) setTablero(r.data);
    });
    /* Su fallo o su `null` dejan la tarjeta sin montar: **no hay «hoy vacío»**
       — una tarjeta que dice «nada por hoy» ocupa el lugar de la que sí
       tendría algo mañana. */
    void obtenerHoyMascota(mascotaId).then((r) => {
      if (vivo && r.ok) setHoyMascota(r.data.hoy);
    });
    void Promise.all([obtenerCitasDeMascota(mascotaId), obtenerCodigosMedicos()]).then(([rc, rm]) => {
      if (!vivo || !rc.ok || !rm.ok) return;
      const medicos = new Set(rm.data);
      /* `futuras` ya viene ordenada por el motor: la primera que sea médica es
         la próxima. Si no hay ninguna, la tarjeta dice «sin registro» — que es
         la verdad, y no el paseo del jueves. */
      const p = rc.data.futuras.find((c) => medicos.has(c.servicio));
      setCitaMedica(p === undefined ? null : { fecha: p.fecha, servicio: p.servicio });
    });
    return () => {
      vivo = false;
    };
  }, [mascotaId, recargaPeso]);

  useEffect(() => {
    let vivo = true;
    void listarPapelesDeMascota().then((r) => {
      if (vivo && r.ok) setPapeles(componerPapeles(r.data));
    });
    return () => {
      vivo = false;
    };
  }, []);

  /** S91 · P2 — la serie de peso. Se re-lee tras registrar (`recargaPeso`):
   *  el dato recién cargado tiene que verse sin salir y volver a entrar.
   *  Un fallo deja `pesos` en null y la celda muestra el snapshot sin fecha —
   *  degrada a lo de antes, no a una mentira. */
  useEffect(() => {
    if (mascotaId === undefined) return;
    let vivo = true;
    void obtenerHistoriaPeso(mascotaId).then((r) => {
      if (vivo && r.ok) setPesos(r.data);
    });
    return () => {
      vivo = false;
    };
  }, [mascotaId, recargaPeso]);
  const [fallaCarnet, setFallaCarnet] = useState<string | null>(null);
  /** UN camino para TODOS los papeles: el token lo emite el server con el
   *  mismo gate del expediente; acá solo se abre lo que devuelve.
   *
   *  S91-C: la decisión de CÓMO se baja cada papel vive en
   *  `lib/descarga-papel` — la comparte con Cuenta → Documentos del hogar,
   *  que baja los mismos papeles. Duplicarla acá dejaría media cura. */
  const ejecutarDescarga = async (d: Descarga) => {
    if (d.modo === 'abrir') await Linking.openURL(d.url);
    // Ley 13: el fallo DICE que es fallo. La AUSENCIA no: «todavía no hay
    // recetas» no es un error del que disculparse — va en voz neutra y
    // fuera de la línea roja de esta sección.
    else if (d.modo === 'falla') setFallaCarnet(d.mensaje);
    else if (d.modo === 'sinActos')
      mostrar({ texto: t('documentos.recetaSinConsultas'), variante: 'neutro' });
  };

  const bajarDocumento = async (tipo: TipoDocumentoExpediente) => {
    setFallaCarnet(null);
    setBajandoDoc(tipo);
    const d = await resolverDescarga(mascotaId, tipo);
    setBajandoDoc(null);
    if (d.modo === 'elegir') {
      setEligiendoReceta(d.consultas);
      return;
    }
    await ejecutarDescarga(d);
  };

  const elegirConsultaDeReceta = async (citaId: string) => {
    setEligiendoReceta(null);
    setFallaCarnet(null);
    setBajandoDoc('receta');
    const d = await abrirReceta(mascotaId, citaId);
    setBajandoDoc(null);
    await ejecutarDescarga(d);
  };
  // Vitales (S53-B2c): paseos con track REAL → cálculo puro en domain.
  const [vitales, setVitales] = useState<VitalesPaseos | 'cargando' | 'error'>('cargando');
  const [indiceAbierto, setIndiceAbierto] = useState<'salud' | 'descanso' | null>(null);
  const [fotoFirmada, setFotoFirmada] = useState<string | undefined>(undefined);
  // S82: el avatar es la puerta a editar la foto (encuadre de la casa).
  const presionAvatar = usePresionado(0.99);
  /* 🔴 **D-1021 · EL MODO MEMORIAL SE ENCIENDE POR LA MASCOTA EN FOCO, y hasta
     hoy no se encendía por nada.**

     ⏪ Acá decía sólo `theme.mode === 'memorial'`. **Medido: NADIE monta
     `<ThemeProvider memorial>` en ninguna de las dos apps** —el único provider
     vivo es el raíz, con `mode={light|dark}`— así que ese guard **era falso
     siempre**, y con él los cuatro que cuelgan de la misma condición
     (`hogar/index:769`, éste, `vacunas:271`, `celebracion-entrega:100`).
     *Cuatro guards escritos, cero encendidos: letra muerta que se leía como
     protección.*

     ⚠️ **Y el dato correcto YA VIVÍA en esta pantalla**, doce líneas más
     abajo, para calcular el momento vital: `mascota.estado_vida !== null &&
     !== 'activa'`. *No faltaba el dato: faltaba que decidiera algo.*

     ⇒ se deriva del PERFIL cargado. `theme.mode` se conserva en el OR porque
     la galería sí puede montar el sub-tema, y ahí el guard tiene que seguir
     valiendo. */
  const esMemorial =
    theme.mode === 'memorial' ||
    (typeof perfil === 'object' && mascotaEnMemorial(perfil.mascota.estado_vida));
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
  /* S113-A · las fotos de los recuerdos, firmadas POR LOTE (mismo hook que el
     Hogar: regla 37, el helper vive UNA vez). */
  const fotosRecuerdo = useFotosDeRecuerdos(items === null || items === 'error' ? [] : items);
  const [cursor, setCursor] = useState<string | null>(null);
  const [estadoPie, setEstadoPie] = useState<LineaDeVidaEstadoPie>('nada');
  const cargandoMasRef = useRef(false);
  // S82-C (imagen-acuerdo, ítem 1 + r3 ítem 4): la SEÑAL completa del
  // hogar para esta mascota — alimenta la pastilla del header Y las
  // celdas de CÓMO ESTÁ HOY (una sola verdad, un solo fetch).
  const [senal, setSenal] = useState<SenalesHogarMascota | null>(null);
  /** A8 — las fuentes de la cuenta de pendientes. Su DEFINICIÓN no vive acá:
   *  vive en `lib/pendientes.ts`, que es la pieza que el Hogar también monta. */
  const [solicitudes, setSolicitudes] = useState<{ mascotaId: string | null }[]>([]);
  const [presupuestos, setPresupuestos] = useState<{ mascotaId: string | null }[]>([]);
  const [porCoordinar, setPorCoordinar] = useState<{ mascotaId: string | null }[]>([]);
  // r5: vacunas agrupadas-colapsadas + historia colapsada con filtros
  const [historiaRevelada, setHistoriaRevelada] = useState(false);
  const [identidadAbierta, setIdentidadAbierta] = useState(false);
  const [vitalesAbiertos, setVitalesAbiertos] = useState(false);
  /** S91 · P2 — la SERIE de peso. El perfil mostraba el número del snapshot y
   *  no su fecha: «12 kg» sin cuándo no distingue una medición de hoy de una
   *  de hace dos años. */
  const [pesos, setPesos] = useState<PesoDeLaSerie[] | null>(null);
  const [pesoHoja, setPesoHoja] = useState(false);
  const [medicacionHoja, setMedicacionHoja] = useState(false);
  /** El estado de la Hoja, **uno solo para los cuatro accesos**. */
  /** ⭐ **C2 · CADA TARJETA ABRE SU DETALLE.** Cuatro destinos ya existían y se
   *  reusan; peso y medicación abren su Hoja. *Ninguna tarjeta es decorativa:
   *  si no llevara a ningún lado, el tablero sería un póster.* */
  const abrirDetalle = (id: string) => {
    if (mascotaId === undefined) return;
    const nom = typeof perfil === 'object' ? perfil.mascota.nombre : '';
    switch (id) {
      case 'vacunas':
        return router.push({ pathname: '/hogar/vacunas/[mascotaId]', params: { mascotaId } });
      case 'antiparasitario':
        return router.push({ pathname: '/antiparasitario', params: { mascotaId, nombre: nom } });
      case 'citas':
        return router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId } });
      case 'peso':
        return setPesoHoja(true);
      case 'medicacion':
        return setMedicacionHoja(true);
      default:
        /* Actividad todavía no tiene destino propio: **no se inventa uno**. La
           tarjeta se dibuja igual porque su dato informa; el día que exista su
           pantalla, entra por esta línea. */
        return;
    }
  };

  const contanos = useContanos(mascotaId ?? '', typeof perfil === 'object' ? perfil.mascota.nombre : '', () =>
    setRecargaPeso((n) => n + 1),
  );
  const [hojaBio, setHojaBio] = useState<ClaseBio | null>(null);
  const chips = useChipsRasgos(mascotaId ?? '', typeof perfil === 'object' ? perfil.mascota.nombre : '', () =>
    setRecargaPeso((n) => n + 1),
  );
  /* ☠️ `InvitacionBio` murió en S113-B · 2.1: era TARJETA Y HOJA en una pieza.
     Acá se parte igual que en la pieza — el botón abre, la Hoja contiene.
     ⚠️ CURA DE COMPILACIÓN de la pista A, del lado consumidor: mantiene las
     cuatro entradas y NADA MÁS. La caja libre y la propuesta de Nexo son de
     C en su 2.1 — no se inventan acá. */
  const [contanosAbierto, setContanosAbierto] = useState(false);
  const [razaHoja, setRazaHoja] = useState(false);
  /** P3: la raza recién guardada, para re-pintar sin re-cargar el perfil. */
  const [razaLocal, setRazaLocal] = useState<string | null | undefined>(undefined);
  /* 🔴 **DE UNO A VARIOS** (1.1 cierre · ②). Era `FiltroHistoria` con un solo
     activo y el vocabulario de OFICIOS; pasa a los NUEVE tipos de B, que se
     pueden combinar. **Vacío = todos**, que es la regla de la pieza: no hay un
     chip «Todo» que compita con los otros nueve. */
  const [tiposElegidos, setTiposElegidos] = useState<readonly TipoLineaDeVida[]>([]);
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
      /* 🔴 SONDA TRANSVERSAL (P0-C, 9-ago) — ¿ES SOLO EL PASEO O SON LAS 8?
       *
       * La traza del founder probó que `paseo/disponibles` **carga bien y se
       * reinicia sola**: abrir un `Modal` de RN provoca blur y `useFocusEffect`
       * vuelve a pedir todo. **Esta pantalla es la contraprueba elegida a
       * propósito**: el founder la probó y dijo que *«entra bien»*.
       *
       * Si acá también recarga, queda probado que **el ciclo existe y no se
       * nota porque carga rápido** — y eso es exactamente la lentitud general
       * que el founder reporta: *cargar todo dos o tres veces se siente lento,
       * no roto.* Si NO recarga, el defecto es del paseo y no hay ovillo.
       *
       * Cuenta VECES, no milisegundos: lo que se discute es cuántas. Se retira
       * con D-726, junto con el instrumento del paseo. */
      vecesFocoRef.current += 1;
      if (__DEV__) console.log(`[p0c-transversal] perfil de mascota · entra al efecto por VEZ ${vecesFocoRef.current}`);
      setVecesFoco(vecesFocoRef.current);

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
        } else {
          /**
           * 🔴 S91 · GATE — LA CARA DE LA GALERÍA SE QUEDA.
           *
           * Sin foto propia, el perfil quedaba SIN IMAGEN: la cara que había
           * ilustrado el alta —la de su raza, o la genérica de su especie— se
           * evaporaba al terminar el alta. El founder lo vio así y tenía
           * razón: es la misma mascota, y la casa ya sabía cómo se ve.
           *
           * El slug se resuelve por NOMBRE contra el catálogo porque
           * `mascotas` guarda la raza como TEXTO (letra S59: texto libre) y
           * no su slug. Si no matchea —una raza escrita a mano que el
           * catálogo no tiene— cae al genérico de la especie, que sigue
           * siendo verdad. **No se slugifica el texto tipeado**: acertaría a
           * veces y traería la cara de otra raza, que es peor que el genérico.
           *
           * Solo se consulta cuando NO hay foto: quien subió la suya no paga
           * este viaje (D-497).
           */
          const m = r.data.mascota;
          void (async () => {
            let slug: string | undefined;
            if (m.raza !== null && m.raza.length > 0) {
              const cat = await obtenerRazasDeEspecie(m.especie);
              if (cat.ok) {
                slug = cat.data.find(
                  (x) => x.nombre.toLowerCase() === (m.raza ?? '').toLowerCase(),
                )?.slug;
              }
            }
            if (!vigente) return;
            setFotoFirmada(caraDeMascota({ especie: m.especie, razaSlug: slug }));
          })();
        }
        void cargarPrimeraPagina(mascotaId);
        // «Quiénes viven acá» — el censo del sistema.
        void obtenerCensoDelAcuario(mascotaId).then((c) => {
          if (!vigente) return;
          setCenso(c.ok ? c.data : null);
        });
        void obtenerEstadoHogar([mascotaId]).then((eh) => {
          if (!vigente || !eh.ok) return;
          setSenal(eh.data.senales.find((x) => x.mascota_id === mascotaId) ?? null);
        });
        /**
         * A8 — LAS TRES FUENTES QUE ESTA PANTALLA NO TENÍA.
         *
         * `obtenerEstadoHogar` ya daba tres de las seis clases (vacuna · cita ·
         * carnet). Las otras tres son lectores propios, y **no se derivan de
         * nada que el perfil ya tenga**: sin ellas la cuenta del perfil sería
         * un subconjunto de la del Hogar, y dos números distintos para lo mismo
         * es exactamente lo que A8 viene a cerrar.
         *
         * ⚠️ COSTO DECLARADO: son **+3 viajes al abrir el perfil** (familia
         * D-497, el piso de performance). Los tres son family-wide y ya se
         * pagan al abrir el Hogar; acá se vuelven a pagar porque el perfil es
         * alcanzable por deep-link sin pasar por el Hogar. Si el piso aprieta,
         * la cura es un caché con invalidación en foco, no borrar la cuenta.
         *
         * Un fallo NO cuenta como cero (L-178): deja las listas vacías y el
         * conteo no promete que no haya nada — dice lo que pudo leer.
         */
        void obtenerSolicitudesPendientesDueno().then((s) => {
          if (!vigente || !s.ok) return;
          setSolicitudes(s.data.filter((x) => x.mascotaId === mascotaId));
        });
        void obtenerPresupuestosFamilia().then((pr) => {
          if (!vigente || !pr.ok) return;
          setPresupuestos(
            pr.data.filter((x) => x.estadoEfectivo === 'enviado' && x.mascotaId === mascotaId),
          );
        });
        void obtenerCitasActivasHogar([mascotaId]).then((rc) => {
          if (!vigente || !rc.ok) return;
          setPorCoordinar(
            rc.data
              .filter((c) => c.estado === 'por_coordinar')
              .map((c) => ({ mascotaId: c.mascota_id })),
          );
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

  /** ⭐ **EL PESO VIGENTE — UNA SOLA DERIVACIÓN** (S113-C · 1.2.1 · ④).
   *  🔴 Medido: identidad mostraba `peso_clinico_kg`, que es **el de la ficha
   *  clínica** y no se mueve cuando la familia pesa en casa. La celda de HOY ya
   *  usaba la serie (`pesos[0]`, ordenada `fecha_medicion desc` por el propio
   *  wrapper) y caía al clínico — o sea que **las dos superficies de la misma
   *  pantalla podían decir kilos distintos**, la de arriba el primero y la de
   *  abajo el último.
   *  *No es un bug de una de las dos: es que la regla vivía dos veces.* Se
   *  deriva acá una vez y la usan las dos. La FECHA viaja con el número: un
   *  peso sin cuándo no dice si es de hoy o de hace dos años. */
  /** La raza, ya estrechada: el guard de la ficha la exige y el callback la usa. */
  const razaVigente: string | null = mascota.raza;

  const pesoVigente: { kg: number; fecha: string | null; deClinica: boolean | null } | null =
    /* 🔴 **LA SERIE YA TRAE LOS DOS, y por eso `[0]` es la respuesta.** Medido
       en Thor: `evento_peso_medicion` guarda los del prestador y los de la
       familia en la misma tabla, ordenada por fecha —24 kg de la familia el
       4-sep, 11,4 de la clínica el 21-jul—. *No hay que comparar dos fuentes:
       hay que dejar de leer el snapshot.* Eso explica el «11,4 kg» que la
       identidad mostraba: era `peso_clinico_kg`, congelado en julio, mientras
       la familia ya lo había pesado en septiembre.
       El fallback al snapshot queda **para la mascota sin serie**: ahí es lo
       único que hay, y no sabemos quién lo pesó ⇒ `deClinica: null`, que se
       dibuja sin atribución en vez de inventarla. */
    pesos !== null && pesos.length > 0
      ? { kg: pesos[0].peso_kg, fecha: pesos[0].fecha, deClinica: pesos[0].de_prestador }
      : peso_clinico_kg !== null
        ? { kg: peso_clinico_kg, fecha: null, deClinica: null }
        : null;
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
  /** ⭐ **EL HERO Y EL TABLERO DICEN LO MISMO** (E, S113 · fase 3).
   *
   * 🔴 **Eran DOS CUENTAS sobre la misma pregunta.** El hero decía «Cuidado al
   * día» mientras el tablero, a un pantallazo, decía «Vacunas 0 de 5 · vencida
   * desde abr 2024». Las dos estaban bien **para su fuente**: `calcularVozHogar`
   * mira `senal.proxima_vacuna` y cae a «al día» por actividad reciente; el
   * tablero mira `obtener_plan_vacunal`, que **sí ve las vencidas**.
   *
   * *Dos superficies con distinta fuente no discrepan por un error de cálculo:
   * discrepan porque nadie decidió cuál manda.* Acá manda **el tablero**: es el
   * que cuenta el plan entero, y es el que la familia lee al lado.
   *
   * ⚠️ La voz de `senal` **no se retira**: sigue decidiendo `pideAtencion` por
   * emergencia y `conociendolo` por expediente ralo, que el tablero no sabe.
   * Lo único que se corrige es **el «al día» que el tablero desmiente**. */
  const pastilla: typeof vozEstadoHogar extends null ? null : 'alDia' | 'pideAtencion' | 'conociendolo' | null =
    vozEstadoHogar === null
      ? null
      : vozEstadoHogar.voz === 'alDia' &&
          tablero !== null &&
          tablero.memorial === false &&
          tablero.vacunas !== null &&
          tablero.vacunas.vencidas > 0
        ? 'pideAtencion'
        : vozEstadoHogar.voz;

  /**
   * A8 — LA CUENTA DE PENDIENTES, JUNTO A LA PASTILLA.
   *
   * Las dos conviven a la vista porque **son dos verdades distintas y ninguna
   * miente**: la pastilla habla del CUIDADO (vacunas · emergencias · atención,
   * vía `calcularVozHogar`) y esto cuenta LO QUE ESPERA. Thor puede estar al
   * día en su cuidado y tener un presupuesto sin responder — el founder leyó
   * «Al día» junto a un badge «1» y sonó a contradicción, y no lo era: la
   * pastilla no decía de QUÉ estaba al día.
   *
   * El número sale de `lib/pendientes.ts`, **la misma pieza que monta el
   * Hogar**: si esta pantalla lo re-implementara, las dos contarían distinto
   * el día que nazca una clase nueva (letra de mesa, adoptada antes de que
   * existiera este segundo consumidor).
   *
   * Memorial apaga, igual que en el Hogar y por la misma razón estructural.
   */
  /** ⚠️ SUBE ACÁ, arriba de todo lo que deriva de ella: la cuenta de
   *  pendientes y la razón de «Lo próximo» la consumen, y una composición
   *  declarada DESPUÉS de sus consumidores no compone nada. */
  const esAcuario = mascota.sujeto === 'acuario';
  /**
   * LA COMPOSICIÓN NO SE DECLARA ACÁ — se consulta. Vivía inline en esta
   * pantalla, y por eso el Hogar (que habla de la misma mascota) no podía
   * consultarla y componía por su cuenta: el acuario terminó pidiendo carnet
   * de vacunas en «Ponte al día». **Arriba de la pantalla no alcanza: tiene
   * que estar arriba de TODAS.** Ver `lib/composicion-sujeto.ts`.
   */
  const monta = composicionDe(mascota.sujeto);

  /* ⭐ **LO QUE VA EN LA FRANJA** (1.1 · C6). La decisión de qué entra y con
     qué nombre vive en `lib/perfil/seguridad.ts`, no acá: es criterio, no
     render. La pantalla pone las voces (Ley 3) y nada más. */
  const itemsSeguridad = itemsDeSeguridad(
    {
      alergiasDetalle: perfil.alergias_detalle,
      medicacion: perfil.medicacion_actual,
      condiciones: perfil.condiciones_cronicas,
      restricciones: perfil.restricciones,
    },
    {
      alergiaA: (a) => t('perfil.seguridadAlergiaA', { alergeno: a }),
      toma: (n, d) => (d !== null ? t('perfil.seguridadTomaConDosis', { nombre: n, dosis: d }) : t('perfil.seguridadToma', { nombre: n })),
      hasta: (f) => t('perfil.seguridadHasta', { fecha: fechaCortaMono(f.slice(0, 10), idioma) }),
      restriccion: (serv) => t('perfil.seguridadRestriccion', { servicio: serv }),
      laFamilia: t('perfil.seguridadLaFamilia'),
      unPrestador: t('perfil.seguridadUnPrestador'),
    },
  );
  /* El resumen es la primera línea de la franja cerrada: **las dos que más
     pesan**, no todas — si dijera las cinco, cerrada y abierta dirían lo mismo
     y abrirla no serviría de nada. */
  const resumenSeguridad = ordenarSeguridad(itemsSeguridad)
    .slice(0, 2)
    .map((i) => i.texto)
    .join(' · ');

  const pendientes = esMemorial
    ? 0
    : contarPendientesDe(mascota.id, {
        enMemoria: esMemorial,
        solicitudes,
        presupuestos,
        porCoordinar,
        /**
         * ⚠️ LA COMPOSICIÓN TIENE QUE LLEGAR HASTA ACÁ, y no llegaba.
         *
         * Lo destapó la captura del gate: el acuario decía «1 por resolver», y
         * ese 1 era **el carnet de vacunas** — la misma sección que P7 ya había
         * quitado de la pantalla. Quitar la SECCIÓN y dejar que su ausencia
         * siga contando como pendiente es media composición: el dueño de un
         * acuario ve una cuenta que no puede resolver ni encontrar.
         *
         * **La lección, que es la que vale:** una composición que solo apaga
         * secciones deja vivas las voces DERIVADAS de ellas. Las dos clases de
         * vacuna se apagan acá con la misma constante que apaga sus secciones,
         * en vez de con dos condiciones nuevas.
         */
        tieneAlertaDeVacuna:
          monta.vacunas &&
          vozEstadoHogar !== null &&
          vozEstadoHogar.voz === 'pideAtencion' &&
          vozEstadoHogar.causa !== 'emergencia',
        sinNingunaVacuna: monta.vacunas && senal !== null && senal.vacunas_total === 0,
      });
  const momento =
    umbrales !== null
      ? calcularMomentoVital({
          edadMeses: meses,
          tieneCondicionCronica: tiene_condicion_cronica,
          esMemorial: mascotaEnMemorial(mascota.estado_vida),
          umbrales,
        })
      : null;
  const chipMomento = momento !== null ? vozMomento(momento, t) : null;

  /** S91 · P1 — EL ORIGEN, leído con rojo honesto.
   *
   *  `IdentidadMascota` todavía NO trae `origen`: el lector del perfil no lo
   *  selecciona (medido: `perfilMascota.ts:114`). El pedido está con A. Se lee
   *  defensivamente para que **el día que A lo sirva la línea aparezca sola**,
   *  sin tocar esta pantalla — y mientras tanto no se pinta nada, que es la
   *  verdad de hoy.
   *
   *  ⚠️ EL CAST SE RETIRA CUANDO EL CAMPO ENTRE AL TIPO. Está acá con nombre y
   *  fecha para que no se vuelva permanente por costumbre. */
  /**
   * S91 · P7 — EL ACUARIO POR LA MISMA PANTALLA (firma de mesa).
   *
   * El sujeto es EL SISTEMA, no un individuo: no tiene sexo, ni raza, ni peso,
   * ni vacunas, ni paseos. Y la letra es precisa sobre CÓMO no los tiene:
   * **AUSENTES, no apagados ni explicados.** Nada de filas en gris ni de «no
   * aplica» — el silencio no se comenta en superficie. Una ficha que enumera
   * lo que su sujeto no puede tener le está pidiendo perdón al dueño por
   * haberle preguntado mal.
   *
   * Se decide por `sujeto` —que A ya sirve— y no por la especie: son
   * equivalentes hoy por construcción del motor, pero `sujeto` es LA columna
   * que declara qué clase de cosa es esta fila. El día que haya un terrario
   * que no sea 'pez', esta línea ya está bien.
   */

  const tipoAgua = mascota.tipo_agua;

  /** El origen en humano. `desconocido` no tiene voz y por eso no se pinta —
   *  es el default HONESTO de la columna, no una respuesta. */
  const lineaOrigen = vozOrigen(mascota.origen, t);

  // Identidad progresiva: SOLO lo cargado (L-139 — nada fake).
  const datosIdentidad: Array<{ etiqueta: string; valor: string; mono?: boolean; editable?: 'raza' }> = [];
  if (esAcuario) {
    // P7 · el acuario: su campo dos y cuándo se montó. Nada más — y lo que
    // falta no se nombra.
    if (tipoAgua !== null) {
      datosIdentidad.push({
        etiqueta: t('perfil.tipoAgua'),
        valor: tipoAgua === 'marino' ? t('perfil.aguaMarino') : t('perfil.aguaDulce'),
      });
    }
    // ⚠️ «MONTADO EL» ESPERA UN CAMPO EN EL LECTOR. `mascotas.fecha_montaje`
    // existe (date) y el alta ya la escribe por su parámetro propio, pero
    // `obtenerPerfilMascota` todavía no la selecciona — pedido a A, medido.
    // NO se pinta `fecha_nacimiento` con el rótulo «Montado el»: un acuario no
    // nace, y rotular una fecha con lo que no es sería peor que no mostrarla.
    // Hasta que llegue, la fila simplemente no existe — que es la letra de P7.
  } else {
    // P3: la raza SIEMPRE tiene fila, también vacía — la puerta de edición
    // tiene que estar donde está la ausencia (mismo criterio que el peso).
    const razaVista = razaLocal !== undefined ? razaLocal : mascota.raza;
    datosIdentidad.push({
      etiqueta: t('perfil.raza'),
      valor: razaVista !== null && razaVista.length > 0 ? razaVista : t('perfil.hoySinRegistroCorto'),
      editable: 'raza',
    });
    if (mascota.sexo === 'macho' || mascota.sexo === 'hembra') {
      datosIdentidad.push({
        etiqueta: t('perfil.sexo'),
        valor: mascota.sexo === 'macho' ? t('perfil.sexoMacho') : t('perfil.sexoHembra'),
      });
    }
    if (mascota.fecha_nacimiento !== null) {
      // P3 · la fila de nacimiento habla la MISMA voz de precisión que la
      // cabecera (P1): una fecha estimada pintada como `01 ene 2019` es la
      // peor versión del problema — el día y el mes los puso el motor para
      // poder ordenar y ahí se leen como si alguien los hubiera declarado.
      datosIdentidad.push({
        etiqueta: t('perfil.nacimiento'),
        valor: vozNacimiento(mascota.fecha_nacimiento, mascota.fecha_nacimiento_precision, t, (iso) =>
          fechaCortaMono(iso, idioma),
        ),
        mono: true,
      });
    }
    if (pesoVigente !== null) {
      datosIdentidad.push({
        etiqueta: t('perfil.peso'),
        /* La fecha va pegada al número, no en otra fila: *un peso sin cuándo
           no dice si es de hoy o de hace dos años*, y en identidad —donde se
           lee de un vistazo— esa duda no se resuelve mirando más abajo. */
        /* La fecha y **quién lo pesó** viajan con el número: *«24 kg» no dice
           si es de hoy o de hace dos años, y tampoco si lo midió una báscula de
           clínica o la de casa* — y esas dos cosas cambian cuánto se le cree. */
        /* ⚠️ **Los tres datos van en el MISMO valor y no en un pie**, porque la
           fila de identidad no tiene pie: agregárselo obligaba a tocar su
           render para las nueve filas. *Un cambio de forma para una sola fila
           no vale lo que cuesta en las otras ocho.* */
        valor: [
          `${pesoVigente.kg} kg`,
          pesoVigente.fecha !== null ? fechaCortaMono(pesoVigente.fecha, idioma) : null,
          pesoVigente.deClinica === null
            ? null
            : pesoVigente.deClinica
              ? t('perfil.pesoDeClinica')
              : t('perfil.pesoDeVos'),
        ]
          .filter((x) => x !== null)
          .join(' · '),

        mono: true,
      });
    }
    if (mascota.microchip !== null && mascota.microchip.length > 0) {
      datosIdentidad.push({ etiqueta: t('perfil.microchip'), valor: mascota.microchip, mono: true });
    }
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
                    borderRadius: radius.full,
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
                  style={{ width: 38, height: 38, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path d="m14 5-7 7 7 7" stroke={sobreMarca} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                  {/* 🔴 **EL LÁPIZ CUELGA DE `!esMemorial`, Y LO ENCONTRÉ
                      CORRIENDO LA DESPEDIDA DE VERDAD.** La Hoja del menú ya
                      estaba bajo el guard, pero **el botón que la abre no**:
                      en memorial se dibujaba y al tocarlo **no pasaba nada**.
                      *Un control que se ve, se toca y no hace nada es peor que
                      uno ausente: el ausente no promete.* Ningún gate lo veía
                      —`verify:pide-en-memorial` mide TEXTOS que piden algo, y
                      «Editar» no pide nada— así que sólo apareció al ejercer
                      el camino entero sobre una mascota real. */}
                  {!esMemorial ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('perfil.editar')}
                    /* ⭐ **C11 · el lápiz abre el MENÚ DE EDICIÓN**, que
                       antes no existía: iba derecho a la foto, y la raza se
                       editaba desde otro lado. Agrupar lo que ya había es lo
                       que le da casa a la despedida — *un acto grave no cuelga
                       de un botón suelto en una ficha que se abre todos los
                       días*. La foto sigue a un toque de distancia. */
                    onPress={() => setMenuEdicion(true)}
                    style={{ width: 38, height: 38, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {/* S86-B · del registry (D-645). Estaba dibujado a mano
                        ACÁ, en un archivo que ya importaba `Icono` — y le
                        faltaba el CORTE DEL BISEL que el registry declara
                        imprescindible: «sin él, a 21px la punta se lee como un
                        triángulo mudo». La copia no envejeció mal: nació
                        incompleta. */}
                    <Icono nombre="lapiz" tamano={20} tinta={sobreMarca} />
                  </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('perfil.compartir')}
                    onPress={() => void Share.share({ message: t('perfil.compartirMensaje', { nombre: mascota.nombre }) })}
                    style={{ width: 38, height: 38, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
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
                {/* En memorial el retrato se MIRA: deja de ser boton y pasa a
                    ser imagen con su nombre. No se apaga con `disabled` a
                    secas porque un boton deshabilitado sigue anunciandose como
                    boton —y sin razon visible seria el defecto que la casa
                    persigue—: acá no hay accion apagada, hay una foto. */}
                <Pressable
                  accessibilityRole={esMemorial ? 'image' : 'button'}
                  accessibilityLabel={esMemorial ? mascota.nombre : t('fotoEncuadre.editarFotoA11y', { nombre: mascota.nombre })}
                  disabled={esMemorial}
                  onPress={
                    esMemorial
                      ? undefined
                      : () =>
                          router.push({ pathname: '/hogar/foto-mascota', params: { mascotaId: mascota.id, nombre: mascota.nombre, especie: mascota.especie } })
                  }
                  {...presionAvatar.handlers}
                >
                  <Animated.View style={presionAvatar.estiloPresionado}>
                    <View
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: radius.full,
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
                        borderRadius: radius.full,
                        backgroundColor: theme.bg.card,
                        paddingHorizontal: spacing[3],
                        paddingVertical: spacing[1.5],
                        boxShadow: theme.elevacion.elevada,
                      }}
                    >
                      {pastilla === 'alDia' && !esMemorial ? (
                        <Svg width={14} height={14} viewBox="0 0 24 24">
                          <Path d="m5 12.6 4.6 4.6L19 7.8" stroke={theme.status.successText} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </Svg>
                      ) : null}
                      <Texto variante="dato" color={pastilla === 'pideAtencion' && !esMemorial ? 'danger' : 'primary'}>
                        {/* ⭐ **EN MEMORIAL EL CHIP NO EMPUJA** (E, S113 · fase 3).
                            Decía «Conociéndolo» sobre Sombra: *una invitación a
                            seguir conociendo a quien ya no está.* Y «Necesita
                            atención» sería peor.
                            🔴 El chip **no se borra**: dice lo que es. *Quitarlo
                            dejaría el retrato sin su línea y la composición
                            cambia; decir la verdad cuesta lo mismo.* */}
                        {esMemorial
                          ? t('perfil.pastillaEnMemoria')
                          : pastilla === 'alDia'
                          ? t('perfil.pastillaAlDia')
                          : pastilla === 'pideAtencion'
                            ? t('perfil.pastillaAtencion')
                            : t('perfil.pastillaConociendo')}
                      </Texto>
                      {/* A8 · LA SEGUNDA VERDAD, al lado y no en lugar de la
                          primera. Va en la MISMA pastilla a propósito: dos
                          píldoras separadas se leerían como dos estados en
                          competencia, y esto no compite — completa. El punto
                          separador es terciario para que el peso siga siendo
                          del estado de cuidado.
                          Cero pendientes = NADA, jamás «0 por revisar»: un cero
                          dicho es ruido, y la ausencia ya es la buena noticia
                          (la misma firma que «Ponte al día» desapareciendo). */}
                      {pendientes > 0 ? (
                        <>
                          <Texto variante="dato" color="tertiary">
                            ·
                          </Texto>
                          <Texto variante="dato" color="secondary">
                            {pendientes === 1
                              ? t('perfil.pastillaPendientesUno')
                              : t('perfil.pastillaPendientes', { n: pendientes })}
                          </Texto>
                        </>
                      ) : null}
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

              {/* S91 · P1 — EL ORIGEN EN HUMANO, bajo el nombre.
                  Va en SANS y no en la línea mono de abajo a propósito: esa
                  línea es METADATO (raza · edad · peso) y ésta es una FRASE.
                  Mezclarlas convertiría «Llegó de un criadero» en un dato más.
                  Ausente cuando nadie lo declaró — el silencio no se comenta. */}
              {lineaOrigen !== null ? (
                <Text
                  style={{
                    fontFamily: typography.family.sans.regular,
                    fontSize: typography.size.base,
                    textAlign: 'center',
                    color: sobreMarca,
                    opacity: esMemorial ? 1 : 0.9,
                    marginTop: spacing[1.5],
                  }}
                >
                  {lineaOrigen}
                </Text>
              ) : null}

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
                  esAcuario ? (tipoAgua === 'marino' ? t('perfil.aguaMarino') : tipoAgua === 'dulce' ? t('perfil.aguaDulce') : null) : mascota.raza,
                  esAcuario || meses === null
                    ? null
                    : meses !== null
                    ? /* ⭐ **EN MEMORIAL LA EDAD VA EN PASADO** (E, S113 · fase 3).
                         Decía «~11 años» en la pantalla de quien ya no está —
                         *el presente afirma que sigue teniendo esa edad, y eso
                         no es un detalle de estilo: es la pantalla hablando
                         como si nada hubiera pasado.* La cifra no cambia; lo
                         que cambia es el tiempo del verbo. */
                      esMemorial
                      ? t('perfil.edadTenia', {
                          edad: vozEdad(
                            meses,
                            mascota.fecha_nacimiento_precision,
                            mascota.fecha_nacimiento !== null
                              ? Number(mascota.fecha_nacimiento.slice(0, 4))
                              : null,
                            t,
                          ),
                        })
                      : vozEdad(
                        meses,
                        mascota.fecha_nacimiento_precision,
                        mascota.fecha_nacimiento !== null
                          ? Number(mascota.fecha_nacimiento.slice(0, 4))
                          : null,
                        t,
                      )
                      : null,
                  /* 🔴 **EL ENCABEZADO TAMBIÉN LEÍA EL SNAPSHOT.** Curé
                     identidad y dejé éste — y era el que estaba a la vista:
                     medido en Thor, el retrato decía «11,4 kg» (clínica,
                     21-jul) mientras identidad ya decía 24 (familia, 4-sep).
                     *Dos números de la misma mascota en la misma pantalla, y el
                     más viejo arriba de todo.* Ahora los dos salen de
                     `pesoVigente` — **una derivación, tres superficies**.
                     Acá va SOLO el número: el encabezado es una línea de
                     identidad de un vistazo, y la fecha y el «quién» viven en
                     su fila, donde hay lugar para leerlos. */
                  esAcuario || pesoVigente === null ? null : `${pesoVigente.kg} kg`,
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

        {/* ☠️ **EL BLOQUE «18 PASEOS · 8 VACUNAS» MURIÓ** (ojo del founder,
            2.2.2 · ⑩). Era el solape que montaba el borde bajo el hero, con dos
            números de la vida entera.

            🔴 **Lo mata el tablero, no el gusto.** «Su salud» dice las vacunas
            —y mejor: cuántas del plan están al día, no cuántas se pusieron
            alguna vez— y «Actividad» dice los paseos, con su semana. *Dos
            números que ya están dos pantallazos abajo, en su contexto, no
            informan arriba: compiten con lo que sí es de hoy.*

            ⚠️ Su `marginTop` negativo era lo que ataba el solape al degradado;
            al morir, el hero cierra contra las acciones. Ley 37: se retira
            entero, no se comenta. */}

        {/* ⭐ **LAS CUATRO ACCIONES, bajo el hero** (S113-C · 2.2 → 2.2.4).
            *Son lo que la familia viene a hacer, y hasta 2.2 estaban repartidas
            entre el fondo de la pantalla y tres secciones distintas.*

            ── QUÉ CAMBIÓ, Y POR QUÉ CADA COSA ─────────────────────────────
            ☠️ **Nexo salió** (orden del founder): *ya está flotante en toda la
            app, y acá ocupaba un lugar que no necesita.*
            ⭐ **Entró Documentos**, y su destino es `irADocumentos` — el
            plegable de «Identidad y papeles», con scroll y desplegado. **Con
            la bóveda de la fase 3 gana pantalla propia y esta línea cambia**;
            por eso el destino vive en una función y no acá.

            ── 🔴 EN MEMORIAL VAN DOS, Y ES FIRMA DEL FOUNDER ──────────────
            *De quien ya no está se siguen leyendo sus papeles y se sigue
            pudiendo guardar un recuerdo; Citas y Pasaporte no.* Las dos que
            salen son las que miran hacia adelante —agendar, encontrar a
            alguien que se perdió—; las dos que quedan miran lo que hubo.

            ⚠️ Antes acá no se dibujaba **ninguna**, con la razón «las cuatro
            piden o llevan a pedir». Era cierto de las cuatro de entonces: con
            Nexo adentro y sin Documentos, ninguna sobrevivía el filtro. *La
            regla no cambió: cambió el conjunto al que se le aplica.* */}
        <View style={{ marginTop: spacing[4], paddingHorizontal: spacing[5] }}>
          <FilaAcciones
            acciones={
              esMemorial
                ? [
                    {
                      etiqueta: t('perfil.documentos'),
                      glifo: 'documentos',
                      onPress: abrirDocumentos,
                    },
                    {
                      etiqueta: t('contanos.pastilla'),
                      glifo: 'pluma',
                      onPress: contanos.abrir,
                    },
                  ]
                : [
                    {
                      etiqueta: t('perfil.accionCitas'),
                      glifo: 'hoy',
                      onPress: () => router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: mascota.id } }),
                    },
                    {
                      etiqueta: t('pasaporte.entrada'),
                      glifo: 'carnet',
                      onPress: () => router.push({ pathname: '/hogar/mascota/pasaporte', params: { mascotaId: mascota.id } }),
                    },
                    {
                      etiqueta: t('perfil.documentos'),
                      glifo: 'documentos',
                      onPress: abrirDocumentos,
                    },
                    {
                      etiqueta: t('contanos.pastilla'),
                      glifo: 'pluma',
                      onPress: contanos.abrir,
                    },
                  ]
            }
          />
        </View>

        {/* ⭐ **LA FRANJA DE SEGURIDAD** (S113-C · 1.1 · C6) — lo que hay que
            saber ANTES de tocar a esta mascota, arriba de todo lo demás.
            🔴 **Sólo si hay algo**: la pieza devuelve `null` con la lista
            vacía, así que una mascota sin alergias, sin medicación y sin
            restricciones **no tiene franja** — *una franja de seguridad vacía
            enseña a ignorar la franja de seguridad, y el día que diga algo ya
            nadie la mira.*
            Va DESPUÉS de la identidad y ANTES del hoy: primero quién es,
            después qué cuidado necesita, y recién ahí cómo viene el día. */}
        {!esMemorial ? (
          <View style={{ marginTop: spacing[6], paddingHorizontal: spacing[5] }}>
            <FranjaSeguridad
              items={itemsSeguridad}
              resumen={resumenSeguridad}
              vozAbrir={t('perfil.seguridadVer', { n: itemsSeguridad.length })}
              vozCerrar={t('perfil.seguridadOcultar')}
            />
          </View>
        ) : null}

        {/* ⭐ **4 · HOY — UNA SOLA TARJETA** (S113-C · 2.2 · C1).
            Reemplaza a la grilla de cuatro celdas de «Cómo está hoy»: *no
            faltaban celdas, sobraba grilla.* El servidor manda UNA cosa ya
            elegida —aviso > cita 48 h > vacuna 7 d > antiparasitario vencido >
            tip— y la pantalla sólo la dice.

            🔴 **Sin novedad no hay tarjeta.** Una que dijera «nada por hoy»
            ocupa el lugar de la que sí va a tener algo mañana, y le enseña a la
            familia a no mirar acá.

            ⚠️ **En memorial no se monta**: las cinco ramas apuntan a algo por
            venir (`A3.9`, `LOYALTY §8`). */}
        {!esMemorial && hoyMascota !== null ? (
          <View style={{ marginTop: spacing[6], paddingHorizontal: spacing[5] }}>
            {(() => {
              const enDias = (n: number) =>
                n <= 0 ? t('perfil.hoyEsHoy') : n === 1 ? t('perfil.hoyEsManana') : t('perfil.hoyFaltanDias', { n });
              switch (hoyMascota.tipo) {
                case 'aviso': {
                  /* 🔴 **EL TEXTO REAL DEL AVISO, no su fecha.** Medido en
                     `avisos_coach`: los tres tipos vivos traen su contenido en
                     `detalle` — `descripcion_familia` en las 18 anticipaciones
                     («suelen tener problemas de cadera»), `servicio` en las 5
                     citas de mañana, `vacuna` en la que vence. *Una tarjeta que
                     dice «Algo para mirar · 04 sep» obliga a tocarla para saber
                     si vale la pena, y eso la vuelve ruido.*
                     El fallback es la fecha porque **es lo único que siempre
                     está**: un tipo nuevo no deja la tarjeta muda. */
                  const d = hoyMascota.detalle;
                  const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : null);
                  const texto =
                    str('descripcion_familia') ??
                    str('servicio') ??
                    str('vacuna') ??
                    str('nombre') ??
                    fechaCortaMono(hoyMascota.fecha, idioma);
                  return (
                    <TarjetaHoy
                      clase="anticipacion"
                      /* 🔴 EL TEMA EN EL TÍTULO (firma founder, 6-sep). «Algo para
                         mirar» servía para cualquier aviso; ahora dice «Su cadera,
                         con el tiempo». El tema lo manda el servidor: la pantalla
                         no lo sabe. Con fallback, porque un aviso viejo puede no
                         traerlo — y un título a medio componer es peor que uno
                         genérico.
                         El `detalle` es de C (2.2.1): su `texto` compuesto, que
                         gana a la fecha suelta que había acá. Los dos lados
                         aportaban y ninguno sobraba. */
                      titulo={hoyMascota.tema
                        ? t('perfil.hoyAviso', { tema: hoyMascota.tema.toLowerCase() })
                        : t('perfil.hoyAvisoSinTema')}
                      detalle={texto}
                      vozActo={t('perfil.hoyVerAviso')}
                      onActo={() =>
                        router.push({
                          pathname: '/nexo',
                          params: {
                            mascotaId: mascota.id,
                            nombre: mascota.nombre,
                            /* Llega a Nexo **con el tema puesto**: el aviso es
                               la pregunta, y hacérsela escribir de nuevo es
                               pedirle a la familia que repita lo que la
                               pantalla acaba de decirle. */
                            semilla: str('chequeo_sugerido') ?? texto,
                          },
                        })
                      }
                    />
                  );
                }
                case 'cita':
                  return (
                    <TarjetaHoy
                      clase="cita"
                      titulo={t('perfil.hoyCita', { servicio: hoyMascota.servicio, cuando: enDias(hoyMascota.faltan_dias) })}
                      detalle={`${hoyMascota.servicio} · ${enDias(hoyMascota.faltan_dias)}`}
                      vozActo={t('perfil.hoyVerCita')}
                      onActo={() => router.push({ pathname: '/citas/[mascotaId]', params: { mascotaId: mascota.id } })}
                    />
                  );
                case 'vacuna':
                  return (
                    <TarjetaHoy
                      clase="vence"
                      titulo={t('perfil.hoyVacuna', { vacuna: hoyMascota.vacuna })}
                      detalle={`${hoyMascota.vacuna} · ${enDias(hoyMascota.dias)}${hoyMascota.derivada ? ` · ${t('perfil.tableroEstimada')}` : ''}`}
                      vozActo={t('perfil.hoyVerVacuna')}
                      onActo={() => router.push({ pathname: '/hogar/vacunas/[mascotaId]', params: { mascotaId: mascota.id } })}
                    />
                  );
                case 'antiparasitario':
                  return (
                    <TarjetaHoy
                      clase="vence"
                      titulo={hoyMascota.tema
                        ? t('perfil.hoyAntiparasitario', { tema: hoyMascota.tema })
                        : t('perfil.hoyAntiparasitarioSinTema')}
                      detalle={enDias(hoyMascota.dias)}
                      vozActo={t('perfil.hoyVerAntiparasitario')}
                      onActo={() => router.push({ pathname: '/antiparasitario', params: { mascotaId: mascota.id, nombre: mascota.nombre } })}
                    />
                  );
                case 'tip':
                  return (
                    <TarjetaHoy
                      clase="anticipacion"
                      titulo={t('perfil.hoyTip', { tema: hoyMascota.nombre.toLowerCase() })}
                      detalle={hoyMascota.descripcion}
                      vozActo={t('perfil.hoyVerTip')}
                      onActo={contanos.abrir}
                    />
                  );
              }
            })()}
          </View>
        ) : null}

        {/* ⭐ **5 · SU SALUD — EL TABLERO** (S113-C · 2.2 · C1).
            Seis tarjetas en dos columnas, en el orden firmado. Reemplaza a la
            lectura de secciones apiladas: *no faltaban cosas, sobraba lista.*

            🔴 **SIN DATO NO HAY DIBUJO, Y NO HAY CERO.** Cada tarjeta dice «sin
            registro» cuando no hay nada, y su gráfico simplemente no se monta:
            *un sparkline chato no dice «no sé», dice «no cambió»* — y un anillo
            vacío se lee como «cero de algo», que es una afirmación que nadie
            midió.

            ⚠️ **En memorial no se monta**: el tablero proyecta (próxima dosis,
            próxima cita) y en la pantalla de quien ya no está no hay próxima
            (`LOYALTY §8`). La historia y la identidad siguen abajo. */}
        {!esMemorial && tablero !== null && tablero.memorial === false ? (
          <View style={{ marginTop: spacing[6], paddingHorizontal: spacing[5], gap: spacing[3] }}>
            <Texto variante="seccion">{t('perfil.suSalud')}</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
              {tarjetasDelTablero(tablero, {
                peso: t('perfil.peso'),
                vacunas: t('perfil.hechosVacunas'),
                antiparasitario: t('perfil.hoyDesparasitacion'),
                medicacion: t('perfil.hoyMedicacion'),
                citas: t('perfil.accionCitas'),
                actividad: t('perfil.tableroActividad'),
                medidoEl: (f) => t('perfil.tableroMedidoEl', { fecha: fechaCortaMono(f, idioma) }),
                delPlanAlDia: (n, total) => t('perfil.tableroDelPlanAlDia', { n, total }),
                vencidaHace: (f) => t('perfil.tableroVencidaHace', { fecha: fechaCortaMono(f, idioma) }),
                activas: (n) => t('perfil.tableroActivas', { n }),
                paseosSemana: (n) => t('perfil.tableroPaseosSemana', { n }),
                proxima: (f) => t('perfil.tableroProxima', { fecha: fechaCortaMono(f, idioma) }),
                kg: (n) => t('perfil.tableroKg', { n }),
                plagasAlDia: (n, total) => t('perfil.tableroPlagas', { n, total }),
                estimada: t('perfil.tableroEstimada'),
              }, citaMedica).map((tar) => (
                <TarjetaMetrica
                  key={tar.id}
                  rotulo={tar.rotulo}
                  valor={tar.valor}
                  vozSinDato={t('perfil.tableroSinRegistro')}
                  contexto={tar.contexto}
                  dibujo={tar.dibujo}
                  onPress={() => abrirDetalle(tar.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* ⭐ **6 · CONOCIÉNDOLO** (S113-C · 2.2 · C1) — la fracción del
            expediente, con el «contanos» y la ficha de la raza ADENTRO.

            🔴 **La fracción se cuenta de lo que la pantalla ya sabe**, casilla
            por casilla y no como un porcentaje del servidor: *un número que
            nadie puede reconstruir mirando la pantalla es un número que no se
            puede discutir.* Las seis son las que la familia puede completar.

            ⚠️ La fila «te faltan …» que vivía dentro de «Cómo está hoy» **se
            mudó acá**: era esto mismo dicho en prosa. *Nada se pierde.*

            ⛔ En memorial no se monta: pide (`A3.9`). */}
        {!esMemorial ? (() => {
          /* ⭐ **LAS CINCO DIMENSIONES DEL VÍNCULO** (S113-B · 2.2.3 → C 2.2.4).
             B cambió `fraccion: number` por **cinco booleanos** —*cero
             números, van a las almohadillas y a ningún otro lado*— y acá se
             mapea lo que la pantalla YA sabe.

             🔴 **`caracter` sale de la LÍNEA DE VIDA, no del perfil.** Medido:
             `obtenerPerfilMascota` no trae rasgos ni observaciones de
             comportamiento; lo que sí llega son sus eventos
             (`observacion_comportamiento`, 6 en Thor). *Poner `false` porque el
             lector no lo trae sería afirmar que no tiene carácter registrado
             cuando lo que pasa es que no lo estoy mirando.*
             ⚠️ Su límite, declarado: si la familia carga rasgos y el timeline
             todavía no los trajo, esta dimensión se ve apagada un momento. Se
             cierra el día que el perfil lea `cat_rasgos` — pedido a A. */
          const dimensiones = {
            identidad: mascota.raza !== null,
            salud: senal !== null && senal.vacunas_total > 0,
            cuerpo: pesoVigente !== null,
            /* `items` puede ser `'error'`: **un fallo de carga no es una
               ausencia de carácter**, así que se lee como «todavía no sé» —
               que en un booleano es `false`, y la almohadilla apagada dice
               justo eso: falta, no que no exista. */
            caracter:
              Array.isArray(items) &&
              items.some((it) => it.tipo === 'observacion_comportamiento' || it.tipo === 'bitacora_familia'),
            diaADia: perfil.desparasitaciones.length > 0 || perfil.medicacion_actual.length > 0,
          };
          const cuantas = Object.values(dimensiones).filter(Boolean).length;
          const total = Object.keys(dimensiones).length;
          return (
            <View style={{ marginTop: spacing[8], paddingHorizontal: spacing[5], gap: spacing[3] }}>
              <Texto variante="seccion">{t('perfil.conociendoloTitulo')}</Texto>
              {/* El estado completo llega cuando las CINCO están: la pieza
                  felicita en vez de pedir (ojo del founder, 2.2.2 · ⑤). */}
              {cuantas === total ? (
                <TarjetaConociendolo
                  dimensiones={dimensiones}
                  voz={t('perfil.conociendoloVoz', { n: cuantas, total, nombre: mascota.nombre })}
                  completo
                  vozFelicitacion={t('perfil.conociendoloCompleto', { nombre: mascota.nombre })}
                  masSobre={
                    <BotonContanos
                      etiqueta={t('perfil.conociendoloMas', { nombre: mascota.nombre })}
                      onPress={contanos.abrir}
                    />
                  }
                />
              ) : (
                <TarjetaConociendolo
                  dimensiones={dimensiones}
                  voz={t('perfil.conociendoloVoz', { n: cuantas, total, nombre: mascota.nombre })}
                  invitacion={
                    <BotonContanos
                      etiqueta={t('perfil.conociendoloInvita', { nombre: mascota.nombre })}
                      onPress={contanos.abrir}
                    />
                  }
                />
              )}

              {/* ⭐ **LA FICHA DE LA RAZA VA DEBAJO, NO ADENTRO** (2.2.1 · ②,
                  firma del founder). Vivía en un slot de `TarjetaConociendolo`;
                  B rehizo esa pieza con **dos estados y una sola invitación**, y
                  su tipo volvió inexpresable el slot: *el estado completo no
                  admite `raza`, y el incompleto pide exactamente una
                  invitación.* **Su diseño y la orden del founder dicen lo mismo
                  por dos caminos**, así que la ficha sale de la tarjeta y queda
                  debajo, con su pregunta. */}
                {/* 🔴 `razaVigente` y no `mascota.raza ?? ''`: **un `?? ''` en
                   una interpolación produce «¿Quieres conocer más sobre el ?»**
                   — es el defecto exacto que A me encontró en aparato, y
                   `verify:voz-sin-hueco` existe por eso. Acá el estrechamiento
                   del guard se pierde dentro del callback, así que se captura
                   ANTES en vez de taparlo con un default. */}
              {contenidoRaza !== null && razaVigente !== null ? (
                  <View style={{ marginTop: spacing[6], paddingHorizontal: spacing[5] }}>
                    {/* ⭐ **EL RÓTULO DICE EL ACTO** (firma del founder). Decía
                        sólo «Bulldog inglés» —el nombre de la raza, que ya está
                        en el encabezado— y la pregunta suelta de abajo era la
                        que invitaba. *Con la pregunta retirada, el título tiene
                        que decir qué pasa si se toca.* */}
                    <FichaRaza
                      nombre={t('perfil.razaMasSobre', { raza: razaVigente })}
                      revisado
                      historia={contenidoRaza.origen ?? ''}
                      caracteristicas={[
                        { etiqueta: t('perfil.razaTemperamento'), valor: contenidoRaza.temperamento ?? undefined },
                        { etiqueta: t('perfil.razaTalla'), valor: contenidoRaza.talla_adulta ?? undefined },
                        { etiqueta: t('perfil.razaVida'), valor: contenidoRaza.esperanza_vida ?? undefined },
                      ]}
                      /* La etapa ACTUAL sale del momento vital que la ficha YA calcula:
                         no se recalcula acá — *dos cuentas de lo mismo terminan
                         discrepando* (lo aprendí en el 1.1.2, con el botón del carnet).
                         🔴 **M4 no marca ninguna etapa, y es a propósito**: el motor lo
                         devuelve por CONDICIÓN CRÓNICA antes de mirar la edad
                         (`momentoVital.ts:34`), así que un senior con una condición sale
                         M4 — marcarlo «adulto» sería afirmar una edad que el dato no
                         dice. Sin etapa actual la ficha se lee entera, que es honesto. */
                      cuidados={[
                        { id: 'cachorro', etapa: t('perfil.razaCachorro'), texto: contenidoRaza.cuidados_por_etapa.cachorro ?? '', actual: momento === 'M1' || momento === 'M2' },
                        { id: 'adulto', etapa: t('perfil.razaAdulto'), texto: contenidoRaza.cuidados_por_etapa.adulto ?? '', actual: momento === 'M3' },
                        { id: 'senior', etapa: t('perfil.razaSenior'), texto: contenidoRaza.cuidados_por_etapa.senior ?? '', actual: momento === 'M5' },
                      ].filter((c) => c.texto.length > 0)}
                      vozRevision={t('perfil.razaRevision')}
                      vozAbrir={t('perfil.razaVer')}
                      vozCerrar={t('perfil.razaOcultar')}
                    />
                  {/* ☠️ **LA PREGUNTA SUELTA SE FUE** (firma del founder).
                      Acá cerraba la ficha con «¿Quieres conocer más sobre el
                      Bulldog inglés?» — *una segunda puerta al mismo lugar, a
                      dos centímetros del título que ya lo dice.* **Un solo
                      acceso**: el rótulo de la tarjeta, que ahora dice «Más
                      sobre el {raza}» y lleva su chevron.
                      ⚠️ Antes acá vivía un `BotonContanos` con esa pregunta, y
                      antes de él un segundo «cuéntanos». *La ficha tuvo tres
                      cierres distintos en tres tandas: el que queda es
                      ninguno.* */}
                </View>
              ) : null}
            </View>
          );
        })() : null}

        {/* ── ⑧ S91 · P5 — LA TARJETA DEL VÍNCULO. UNA, no dos.
            Narrativa + UN próximo paso con su ganancia visible
            (MODELO_LOYALTY §2). Y la letra que gobierna lo que NO puede
            ser: «jamás una checklist de tareas — la checklist es la
            chorificación del cuidado y el dark pattern que mata el alma
            del producto». Tampoco barra ni «perfil 40% completo».

            Por eso el progreso se dice en VOZ y el número que lo calcula
            NUNCA se muestra: existe para elegir la frase y muere ahí.

            ⚠️ P8 · EL MEMORIAL LA APAGA ENTERA, y es apagado ESTRUCTURAL:
            la tarjeta no se monta. No es un filtro ni una variante gris —
            invitar a reservar un servicio para quien ya no está es la
            clase de error que no se arregla pidiendo perdón. */}
        {!esMemorial ? (
          <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[8] }}>
            <Tarjeta elevacion="elevada">
              <View style={{ gap: spacing[3] }}>
                <Texto variante="apoyo">{t('perfil.pieRotulo')}</Texto>

                {/* LA NARRATIVA — cuánto conoce la casa a esta mascota, dicho
                    como se lo diría una persona. Los «capítulos» que cuentan
                    son hechos del expediente, no tareas de una lista. */}
                <Texto variante="cuerpo">
                  {(() => {
                    const capitulos = [
                      senal !== null && senal.vacunas_total > 0,
                      pesos !== null ? pesos.length > 0 : peso_clinico_kg !== null,
                      perfil.paseos_total > 0,
                      perfil.consultas_total > 0,
                      mascota.raza !== null && mascota.raza.length > 0,
                      mascota.fecha_nacimiento !== null,
                    ].filter(Boolean).length;
                    if (capitulos >= 5) return t('perfil.vinculoMucho', { nombre: mascota.nombre });
                    if (capitulos >= 3) return t('perfil.vinculoAlgo', { nombre: mascota.nombre });
                    return t('perfil.vinculoPoco', { nombre: mascota.nombre });
                  })()}
                </Texto>

                {/* EL PASO, con su ganancia. La razón sale del EXPEDIENTE. */}
                <Texto variante="apoyo">
                  {(() => {
                    const hoyIso2 = new Intl.DateTimeFormat('en-CA').format(hoy);
                    const pv2 = senal?.proxima_vacuna ?? null;
                    // MISMA composición, mismo motivo (ver la cuenta arriba):
                    // a un acuario no se le dice «todavía no hay vacunas
                    // cargadas». No es una vacuna que falta — es una categoría
                    // que no le aplica, y nombrarla le inventa una carencia.
                    if (monta.vacunas) {
                      if (pv2 !== null && pv2.fecha < hoyIso2) return t('perfil.pieRazonVacuna', { vacuna: pv2.nombre });
                      if (senal !== null && senal.vacunas_total === 0) return t('perfil.pieRazonSinCarnet', { nombre: mascota.nombre });
                    }
                    return t('perfil.pieRazonGeneral', { nombre: mascota.nombre });
                  })()}
                </Texto>

                {/* ⭐ **BAJA A FILA DISCRETA** (ojo del founder, 2.2.2 · ⑥).
                    Era un `Boton variante="marca" bloque` —**lo más pesado de la
                    pantalla**— tercero en una fila de tres invitaciones seguidas.
                    *No es lo que la familia vino a hacer acá: entró a ver cómo
                    está su animal.* No se saca —reservar sigue a un toque— pero
                    deja de competir con lo que la sección vino a decir. */}
                <CeldaNavegacion
                  titulo={t('perfil.reservarServicioDe', { nombre: mascota.nombre })}
                  registro="tinta"
                  onPress={() => router.navigate('/explorar')}
                />
              </View>
            </Tarjeta>
          </View>
        ) : null}

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
              /* ☠️ Acá vivía `FAMILIAS`, la tabla de los cinco chips por OFICIO.
                 Murió con el vocabulario nuevo: sus cinco códigos no existen en
                 `TipoLineaDeVida` y su único consumidor era `presentes`, que se
                 fue con ella. *Una tabla que ya no clasifica nada es una lista
                 esperando que alguien la vuelva a creer* (Ley 37). El canto de
                 la fila NO sale de acá y sigue vivo: lo da `FAMILIA_DE_TIPO`. */
              /* Los tipos que ESTA mascota tiene, en el orden de los nueve: la
                 puerta no ofrece lo que no tiene (Ley 23). */
              const presentesTipo = ORDEN_TIPOS.filter((tp) =>
                items.some((it) => tipoDeLineaDeVida(it.tipo) === tp),
              );
              const filtrados =
                tiposElegidos.length === 0
                  ? items
                  : items.filter((it) => {
                      const tp = tipoDeLineaDeVida(it.tipo);
                      return tp !== null && tiposElegidos.includes(tp);
                    });
              const visibles = historiaRevelada ? filtrados : filtrados.slice(0, 3);
              return (
                <>
                  <RotuloSeccion titulo={t('perfil.vida')} cuenta={String(items.length)} />

                  {/* P4 · LA PUERTA DE LA BITÁCORA — un toque visible junto a
                      Su historia. Hasta hoy la bitácora tenía UNA sola entrada
                      en toda la app y era `/hogar/adiestramiento`: desde el
                      perfil de la mascota no se llegaba (medido en el censo).
                      Contar algo de hoy es del expediente de ESA mascota, así
                      que su puerta vive donde vive su historia — y va con su
                      `mascotaId` para que la pantalla no tenga que adivinar de
                      quién se habla. */}
                  {/* S91-C (gate del founder) · EL AIRE QUE LA CAJA APORTABA
                      Y NADIE REPUSO. Medido, no estimado: lo que pisaba el
                      subtítulo NO era la sección siguiente — era LA PATA del
                      chip activo de `FiltroPills`, que por letra de B «MONTA
                      el canto» y sobresale hacia arriba (su propio
                      `paddingTop: 12` existe para no cortarse a sí misma).
                      Con `marginBottom: 12` la pata aterrizaba justo sobre
                      «Lo que ves en casa…». Sube a 20: separación real, y la
                      caja NO vuelve (A6 pide sin superficie, no sin aire). */}
                  {/* ✅ LA PUERTA RECUPERA SU SUPERFICIE (corrección de mesa).
                      Anduvo cuatro vueltas curándose al revés por una lectura
                      de «sin pared» que significaba lo contrario: el texto NO
                      va suelto sobre el fondo — lleva su tarjeta, como sus
                      vecinas de Su historia. Queda registrado porque el costo
                      no fue el código (una línea) sino LAS CUATRO VUELTAS: una
                      orden que se interpreta se verifica contra el OBJETO antes
                      de curar, y acá el objeto era la pantalla del founder.
                      Mismo `relleno`/`elevacion` que las filas vecinas: la
                      puerta pertenece a esa familia, no es una excepción. */}
                  {/* La puerta de la bitacora PIDE escribir, asi que en
                      memorial no se monta. Lo ya escrito sigue abajo y se lee:
                      lo que se apaga es el pedido, no la historia. */}
                  {!esMemorial ? (
                  <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[5] }}>
                    <Tarjeta relleno="ninguno" elevacion="reposo">
                      <CeldaNavegacion
                        icono="caso"
                        titulo={t('perfil.bitacoraEntrada', { nombre: mascota.nombre })}
                        detalle={t('perfil.bitacoraDetalle')}
                        onPress={() =>
                          router.push({
                            pathname: '/hogar/bitacora',
                            params: { mascotaId: mascota.id },
                          })
                        }
                      />
                    </Tarjeta>
                  </View>
                  ) : null}
                  {/* ⭐ **LOS CHIPS ENTRAN A LA TARJETA** (ojo del founder,
                      2.2.2 · ⑦). Vivían en un `View` hermano, con su propio
                      padding y su propio margen: *un filtro que flota sobre una
                      lista no se lee como el filtro DE esa lista — se lee como
                      otra cosa que quedó ahí.* Ahora comparten contenedor y el
                      padding es uno solo. */}
                  <View style={{ paddingHorizontal: spacing[5], gap: spacing[2.5], marginTop: spacing[3] }}>
                  {presentesTipo.length > 1 ? (
                    <View style={{ marginBottom: spacing[1] }}>
                      <FiltrosLineaDeVida
                        tipos={presentesTipo}
                        elegidos={tiposElegidos}
                        voz={(tp) => t(`perfil.lv_${tp}` as 'perfil.lv_salud')}
                        onAlternar={(tp) =>
                          setTiposElegidos((prev) =>
                            prev.includes(tp) ? prev.filter((x) => x !== tp) : [...prev, tp],
                          )
                        }
                      />
                    </View>
                  ) : null}
                    {filtrados.length === 0 ? (
                      <EstadoVacio registro="seccion" titulo={t('hogar.filtroSinMomentos')} />
                    ) : (
                      <>
                        {visibles.map((it) => {
                          const familia = FAMILIA_DE_TIPO[it.tipo];
                          // S91 (re-gate): EL CANTO SALE DEL EJE. Acá vivía un
                          // caso especial para `hito_narrativo` —cura de SITIO,
                          // escrita cuando el hito era el único que se veía sin
                          // canto—. La medición mostró que eran SIETE tipos, no
                          // uno: el hito fue el síntoma que asomó primero.
                          // `capaDeHecho` cura la causa y se lleva el parche
                          // puesto (Ley 37: lo que sobrevive a su razón es
                          // basura que nadie se anima a tocar).
                          const capa = capaDeHecho(it.eje_jtbd);
                          const color = capa === null ? null : theme.capa[capa];
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
                                {/* S113-A · el recuerdo habla con el texto de la
                                    familia; sin texto, la fila no inventa uno. */}
                                {vozHecho(it, t, mascota.nombre, idioma) !== '' ? (
                                  <Texto variante="cuerpo" numberOfLines={1}>{vozHecho(it, t, mascota.nombre, idioma)}</Texto>
                                ) : null}
                                {it.foto_path !== null && fotosRecuerdo.get(it.foto_path) !== undefined ? (
                                  <Image
                                    source={{ uri: fotosRecuerdo.get(it.foto_path) }}
                                    style={{ width: '100%', height: 140, borderRadius: radius.md }}
                                    contentFit="cover"
                                    transition={160}
                                  />
                                ) : null}
                                {it.titulo_fuente !== null ? (
                                  <Texto variante="dato" numberOfLines={1}>{it.titulo_fuente.toLowerCase()}</Texto>
                                ) : null}
                              </View>
                              {glifoFila !== null ? <Icono nombre={glifoFila} tamano={26} /> : null}
                              {destino !== null ? (
                                <ChevronDerecha color={theme.text.tertiary} />
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

        {/* ⭐ **8 · IDENTIDAD Y PAPELES** (S113-C · 2.2.1 · ①) — el pie
            recompuesto. Acá abajo vivían SEIS bloques sueltos uno tras otro,
            cada uno con su rótulo y su altura: vitales abierto, identidad,
            pasaporte, documentos, quiénes viven acá y alimento.

            🔴 **Un rótulo, y adentro una fila por cosa.** *Seis secciones
            seguidas al pie no se leen como seis cosas: se leen como que la
            pantalla no terminó nunca* — y la última, que es la que la familia
            sí busca (su alimento), quedaba a un scroll de distancia de todo lo
            demás.

            **Nada se saca y nada cambia de destino**: cada una conserva su
            despliegue o su ruta, y lo único nuevo es que ahora se sabe dónde
            están sin recorrer la pantalla entera. */}
        <View style={{ marginTop: spacing[8] }}>
          <RotuloSeccion titulo={t('perfil.identidadYPapeles')} cuenta={null} />
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
              <View style={{ marginTop: spacing[3] }}>
                {/* ⭐ **PLEGADO** (2.2.1 · ①). Era una sección abierta al pie con
                    su rótulo, sus pills y su gráfico. *Lo que se lee de vez en
                    cuando no ocupa media pantalla siempre* — y sobre todo: era
                    lo único suelto debajo de «Su historia», que es lo que este
                    punto vino a cerrar. Se abre entero, no se recorta. */}
                <View style={{ paddingHorizontal: spacing[5] }}>
                  <Tarjeta relleno="ninguno" elevacion="reposo">
                    <CeldaNavegacion
                      icono="paseo"
                      titulo={t('perfil.vitales')}
                      registro="tinta"
                      direccion={vitalesAbiertos ? 'arriba' : 'abajo'}
                      onPress={() => setVitalesAbiertos((v) => !v)}
                    />
                  </Tarjeta>
                </View>
                {!vitalesAbiertos ? null : (
                <>
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
                </>
                )}
              </View>
            );
          })()
        ) : null}

        {/* ── ④ IDENTIDAD sin caja por dato (lámina: "hoy son seis
            mini-tarjetas dentro de una tarjeta"): UNA superficie con
            hairlines, rótulo mono a la izquierda, valor a la derecha.
            A6: no se encierra en marco lo que ya está en un marco.
            Talla/pelaje y paseos-en-grupo siguen EDITABLES (P19).

            ⭐ **PLEGADA** (S113-C · 2.2 · C1). Baja al fondo y arranca
            cerrada: *son datos de consulta, no de vistazo* — quien entra al
            perfil viene a ver cómo está su animal hoy, y el número de
            microchip lo busca el día que lo necesita. **Nada se saca**: el
            mismo `PieRevelar` de la historia la abre entera.
            Talla/pelaje y paseos-en-grupo siguen EDITABLES. */}
        <View style={{ marginTop: spacing[3] }}>
          {/* La fila, igual que las otras cinco de la sección: **el rótulo
              propio murió** — con «Identidad y papeles» arriba, un segundo
              rótulo «Identidad» dice dos veces lo mismo con dos alturas. */}
          <View style={{ paddingHorizontal: spacing[5] }}>
            <Tarjeta relleno="ninguno" elevacion="reposo">
              <CeldaNavegacion
                icono="carnet"
                titulo={t('perfil.identidad')}
                registro="tinta"
                direccion={identidadAbierta ? 'arriba' : 'abajo'}
                onPress={() => setIdentidadAbierta((v) => !v)}
              />
            </Tarjeta>
          </View>
          {identidadAbierta ? (
            <>
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Tarjeta relleno="ninguno" elevacion="reposo">
                {datosIdentidad.map((d, i) => (
                  <View key={d.etiqueta}>
                    {i > 0 ? <Separador /> : null}
                    {/* P3: la fila de raza LLEVA a su edición. Las demás son
                        lectura — su productor vive en otro lado (el peso en P2,
                        el microchip en la consulta). */}
                    {d.editable === 'raza' ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${d.etiqueta}, ${d.valor}`}
                        onPress={() => setRazaHoja(true)}
                      >
                        <FilaIdentidad etiqueta={d.etiqueta} valor={d.valor} mono={d.mono === true} accion />
                      </Pressable>
                    ) : (
                      <FilaIdentidad etiqueta={d.etiqueta} valor={d.valor} mono={d.mono === true} />
                    )}
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
                        accion
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
                        accion
                      />
                    </Pressable>
                  </>
                ) : null}
              </Tarjeta>
            </View>
            </>
          ) : null}
        </View>

        {/* ⭐ **LA ENTRADA AL PASAPORTE** (S113-C · 1.3 · C1). Va en el
            bloque de IDENTIDAD porque **es identidad**: la chapita dice
            quién es y de quién es. *Ponerla entre las acciones de cuidado
            la habría dejado al lado de «registrar peso», que es otra
            conversación.*
            🔴 **No se dibuja en memorial**: `sePintaPasaporte` de B lo dice
            y la pantalla lo respeta desde acá — *un pasaporte es para
            encontrar a alguien que se perdió.* */}
        {/* ⭐ **UNA FILA MÁS DE LA SECCIÓN** (ojo del founder, 2.2.2 · ⑨).
            Era una `Celda` con título y subtítulo, y al lado de las demás filas
            plegables se leía como **un rótulo suelto**: más alta, con otra
            forma, sin la tarjeta que llevan sus vecinas. *Seis filas iguales y
            una distinta hacen que la distinta parezca de otra sección.*
            Navega en vez de plegarse porque su destino **es una pantalla**, y
            eso lo dice el chevron. */}
        {!esMemorial ? (
          <View style={{ marginTop: spacing[3], paddingHorizontal: spacing[5] }}>
            <Tarjeta relleno="ninguno" elevacion="reposo">
              <CeldaNavegacion
                icono="carnet"
                titulo={t('pasaporte.entrada')}
                detalle={t('pasaporte.entradaDetalle')}
                registro="tinta"
                onPress={() =>
                  router.push({ pathname: '/hogar/mascota/pasaporte', params: { mascotaId: mascota.id } })
                }
              />
            </Tarjeta>
          </View>
        ) : null}

        {/* ── S89 órdenes 8⑤/10① · LOS PAPELES DEL PRODUCTO ──────────────
            Los documentos viven JUNTOS: un solo lugar donde la familia sabe
            que están sus papeles. El botón del carnet salió de la sección
            Vacunas a propósito — ahí competía con "Ver el carnet completo"
            (Chanel: un gesto por sección).
            Cada papel se emite con un token de UN SOLO USO: el JWT jamás
            viaja en una URL, y un link reenviado ya no sirve. */}
        {/* S89-D orden 7 ① (firma del founder sobre capturas): la sección
            es DESPLEGABLE y sus papeles son FILAS con su glifo.
            ☠️ MURIERON los dos `Boton bloque` (el botón tapiz): no
            escalaban — con receta y certificados serían cuatro tapices
            apilados en el perfil. La lista sale del catálogo DERIVADO
            (`lib/papeles.ts`), jamás escrita acá. */}
        {/* S90-C · ENMIENDA DE FORMA DEL FOUNDER: TARJETA + CHEVRON.
            La sección DESPLIEGA, así que viste la anatomía de la casa
            para lo que despliega — `CeldaNavegacion` con `direccion`
            (E14: ⌄ revela · ⌃ pliega). Esa prop nació en S83-B12
            declarando su condición de muerte del clon: *«la anatomía
            local se retira y consume esta prop»*. Esto es esa muerte —
            muere el `Pressable` + `RotuloSeccion` que hacía de
            encabezado desplegable a mano.
            UNA sola Tarjeta, no dos (precedente medido en
            `perfil-piezas.tsx`, S89-D): `elevacion="reposo"` es una
            SOMBRA, y dos sombras pegadas dibujan un borde donde no hay
            frontera — el contenido de una sección es su encabezado
            desplegado, no otra cosa.
            CHANEL (Ley 16): se fue el CONTADOR de papeles. Cerrado no
            es accionable, y abierto repite lo que las filas ya dicen —
            era el elemento haciendo doble turno (Ley 17.6). */}
        {/* A9 (gate, 2ª pasada) — LA TARJETA SUELTA DE BITÁCORA SE RETIRA.
            Había DOS puertas a lo mismo —ésta, tras Vacunas, y «Cuéntanos algo
            de X» en Su historia— y dos puertas al mismo cuarto se leen como
            dos cuartos. Queda la de Su historia, que es donde la letra P4 la
            puso: lo que la familia observa es historia, no una sección aparte.
            Ley 37: acá no queda un hueco, queda nada. */}

        {/* ☠️ **EL PLEGABLE DE DOCUMENTOS MURIÓ — GANÓ PANTALLA PROPIA**
            (corrección del founder, S113 · fase 3 · C1).

            Acá vivían los cinco papeles de la casa desplegándose bajo una
            fila. *Un plegable tenía sitio para cinco y ninguna más* — y la
            bóveda va a recibir papeles traídos de otras clínicas, que crecen
            sin techo, se agrupan por tipo y necesitan decir de dónde vinieron.

            🔴 **EL CENSO, ANTES DE RETIRAR — nada perdió destino:**
            · los cinco papeles con su descarga → la pantalla, igual;
            · la Hoja de «¿de qué consulta?» de la receta → la pantalla, igual;
            · el estado de carga por fila → igual;
            · la voz del fallo y la neutra de «todavía no hay recetas» → igual,
              y la segunda sigue **fuera de la línea roja**: *una ausencia no es
              un error del que disculparse*;
            · el destino de la acción del perfil → deja de ser scroll+desplegar
              y pasa a ser la ruta.
            ☠️ Con él mueren `irADocumentos`, `docsAbiertos` y `yDocumentosRef`,
            que existían para llegar acá (Ley 37). */}

        {/* ── S96-D · LA PUERTA DE LA DESPENSA — la entrada PRINCIPAL del
            frente de productos es el expediente ("el alimento de Thor",
            jamás "Categoría: Alimentos" — LETRA_RECORRIDO §5.1 /
            MODELO_DESPENSA §5.1: el tab da alcance, el expediente da
            criterio). Misma familia que las otras puertas del perfil
            (bitácora · Documentos): Tarjeta reposo + CeldaNavegacion.
            No se monta en memorial/perdida: recomendarle alimento a una
            mascota que ya no está es lo que el apagado estructural de
            LOYALTY §7.1 existe para impedir. */}
        {mascota.estado_vida === 'activa' ? (
          <View style={{ marginTop: spacing[8], paddingHorizontal: spacing[5] }}>
            <Tarjeta relleno="ninguno" elevacion="reposo">
              <CeldaNavegacion
                icono="despensa"
                titulo={t('perfil.suAlimento', { nombre: mascota.nombre })}
                registro="tinta"
                onPress={() =>
                  router.push({ pathname: '/despensa', params: { mascotaId: mascota.id } })
                }
              />
            </Tarjeta>
          </View>
        ) : null}

        {/* 🔴 SONDA TRANSVERSAL DE P0-C (D-728) — se retira con D-726.
            Va al PIE y en voz de dato: no es contenido del expediente. Si este
            número sube al abrir una hoja, la pantalla recarga todo sin que se
            note — la lentitud general del founder, medida.
            ⚠️ **`D-1027` — BAJO `__DEV__`.** Se estaba dibujando en el binario
            que usa el founder, y el día que lo vio fue en la ficha de una
            mascota que murió: *un instrumento nuestro, con su jerga adentro,
            en el peor lugar posible.* La sonda sigue viva porque su medición
            sigue haciendo falta; lo que se corrige es a quién se la mostramos.
            No se retira acá: su retiro es de `D-726`, que tiene dueño. */}
        {__DEV__ ? (
        <Texto variante="dato">
          {`p0c · esta pantalla pidió todo ${vecesFoco} vez/veces`}
        </Texto>
        ) : null}
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

      {/* S91 · P2 — la puerta del peso. El motor existía completo desde
          S66/S70 (evento_peso_medicion + sus triggers); lo único que faltaba
          era esto. */}
      <RegistrarPesoHoja
        visible={pesoHoja}
        nombre={mascota.nombre}
        mascotaId={mascota.id}
        onCerrar={() => setPesoHoja(false)}
        onRegistrado={() => setRecargaPeso((n) => n + 1)}
      />

      {/* P3 · la MISMA pieza del paso 2 del alta (§6: se comparte, no se
          clona). No valida lo escrito: `mascotas.raza` es texto libre por la
          letra de S59 y la RPC la respeta. */}
      {/* ⭐ **EL MENÚ DE EDICIÓN** (S113-C · 1.2 · C11).
          Junta lo que ya existía disperso —la foto y la raza se editaban desde
          dos lados distintos— y con eso le da casa a la despedida: *un acto
          grave no cuelga de un botón suelto en una ficha que se abre todos los
          días*.

          🔴 **LA HOJA ENTERA CUELGA DE `!esMemorial`, no sólo su ítem grave.**
          El lápiz que la abre ya estaba bajo el guard (:1022), así que en
          memorial era **inalcanzable** — y aun así mi propio censo la marcó en
          rojo por «Cambiar la foto» y «Cambiar la raza». *Tiene razón: un texto
          inalcanzable hoy es alcanzable mañana, en cuanto alguien le abra otro
          camino, y nadie va a acordarse de este guard.* No se monta y punto. */}
      {!esMemorial ? (
        <Hoja visible={menuEdicion} onCerrar={() => setMenuEdicion(false)} titulo={t('perfil.menuTitulo')}>
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('perfil.menuFoto')}
            onPress={() => {
              setMenuEdicion(false);
              router.push({ pathname: '/hogar/foto-mascota', params: { mascotaId: mascota.id, nombre: mascota.nombre, especie: mascota.especie } });
            }}
          />
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('perfil.menuRaza')}
            onPress={() => {
              setMenuEdicion(false);
              setRazaHoja(true);
            }}
          />
          <Separador />
          {/* Sola, al final y después del separador. **Sin color de alarma**:
              el memorial es sereno, y pintar la despedida de rojo la trata como
              un borrado. No lo es: es el expediente que sigue, en otra clave. */}
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('perfil.menuDespedir', { nombre: mascota.nombre })}
            onPress={() => {
              setMenuEdicion(false);
              router.push({ pathname: '/hogar/mascota/despedida', params: { mascotaId: mascota.id, nombre: mascota.nombre } });
            }}
          />
        </Hoja>
      ) : null}

      {/* 🔴 **LA HOJA, UNA SOLA.** Los cuatro accesos la abren; ninguno la
          clona. Y la caja libre está ARRIBA de las cuatro entradas porque *es
          la forma más barata de contar algo: escribirlo* — las cuatro son para
          quien ya sabe dónde va. */}
      {/* 🔴 **NO SE MONTA EN MEMORIAL**, y lo cazó mi propio censo. La Hoja
          PIDE —«cuéntanos», «escríbelo como se te ocurra»— y en la pantalla de
          quien ya no está se lee, no se pide nada (`A3.9`). El botón que la
          abre ya cuelga del guard; la Hoja también, porque *un texto
          inalcanzable hoy es alcanzable mañana*. */}
      {!esMemorial ? (
      <HojaContanos
        visible={contanos.visible}
        onCerrar={contanos.cerrar}
        titulo={t('contanos.titulo', { nombre: mascota.nombre })}
        entradas={entradasContanos(t, (c) => {
          contanos.cerrar();
          /* ⭐ **RECUERDO ABRE LA PANTALLA QUE YA EXISTE** (firma del founder):
             `/recuerdo` toma foto Y texto. *Una caja de texto acá sería una
             segunda forma —peor— de hacer lo que la casa ya hace bien, y la
             foto es media parte de un recuerdo.* */
          if (c === 'recuerdo') {
            router.push({ pathname: '/recuerdo', params: { mascotaId: mascota.id, nombre: mascota.nombre } });
            return;
          }
          /* ⭐ **COMPORTAMIENTO Y RASGOS SON CHIPS** (2.2.1 · ④, firma del
             founder: *«Comportamiento no es una caja: son los chips»*). Los
             dos abren la MISMA Hoja: `cat_rasgos` los reparte en sus cuatro
             familias —miedos · manías · con otros animales · con niños— y el
             texto va debajo, acompañando. *Una caja libre delante de alguien
             que no sabe qué contar produce una caja vacía.* */
          if (c === 'comportamiento' || c === 'rasgo') {
            chips.abrir();
            return;
          }
          setHojaBio(c);
        })}
        libre={{
          etiqueta: t('contanos.libreEtiqueta', { nombre: mascota.nombre }),
          placeholder: t('contanos.librePlaceholder'),
          vozEnviar: t('contanos.libreEnviar'),
          onLibre: contanos.enviarLibre,
        }}
        propuesta={contanos.propuestaUi}
      />
      ) : null}

      {/* ⛔ Bajo el mismo guard que el resto del «cuéntanos»: pide. */}
      {!esMemorial ? chips.hoja : null}

      <HojaInvitacionBio
        clase={hojaBio}
        nombre={mascota.nombre}
        mascotaId={mascota.id}
        onCerrar={() => setHojaBio(null)}
        /* 🔴 **La línea de vida al volver.** Sin esto el aviso dice «anotado en
           la vida de Thor» y la vida de Thor sigue igual — *decir dónde quedó y
           que no se vea ahí es peor que no decirlo.* */
        onGuardado={() => setRecargaPeso((n) => n + 1)}
      />

      <RegistrarMedicacionHoja
        visible={medicacionHoja}
        nombre={mascota.nombre}
        mascotaId={mascota.id}
        onCerrar={() => setMedicacionHoja(false)}
        /* El perfil re-lee: una dosis que se anota y no aparece hasta salir y
           volver se lee como que no se guardó. */
        onRegistrado={() => setRecargaPeso((n) => n + 1)}
      />

      <EditarRazaHoja
        visible={razaHoja}
        mascotaId={mascota.id}
        nombre={mascota.nombre}
        especie={mascota.especie}
        razaActual={razaLocal !== undefined ? razaLocal : mascota.raza}
        onCerrar={() => setRazaHoja(false)}
        onGuardada={(raza) => setRazaLocal(raza)}
      />

      {/* «Quiénes viven acá» — la Hoja del censo. Se monta siempre que la
          sección exista: montarla condicionada al acuario DOS veces sería
          repetir la composición en dos lugares. */}
      {monta.habitantes ? (
        <HabitantesAcuarioHoja
          visible={habitantesHoja}
          mascotaId={mascota.id}
          nombre={mascota.nombre}
          actuales={censo?.habitantes ?? []}
          onCerrar={() => setHabitantesHoja(false)}
          onDeclarado={() => {
            // Se RE-LEE del motor en vez de creerle al borrador local: el
            // motor resuelve identidad, orden y total, y el cliente no.
            void obtenerCensoDelAcuario(mascota.id).then((c) => setCenso(c.ok ? c.data : null));
          }}
        />
      ) : null}

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
      {/* La Hoja educativa (peldaño 0) termina en «Cargar su carnet»: es una
          invitacion, y en memorial no se invita. Se apaga ENTERA y no solo su
          boton — asi el caso se vuelve inalcanzable en vez de quedar como una
          Hoja que se puede abrir y no lleva a ningun lado. */}
      {!esMemorial ? (
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
      ) : null}

      {/* S91-C · ¿DE QUÉ CONSULTA? — la receta se emite sobre UN acto y
          la familia elige cuál. Solo se monta con 2+ (con una se descarga
          sola; con ninguna habla la voz neutra). */}
      <HojaReceta
        consultas={eligiendoReceta}
        onElegir={(citaId) => void elegirConsultaDeReceta(citaId)}
        onCerrar={() => setEligiendoReceta(null)}
      />
    </View>
  );
}
