/**
 * Flujo carnet de vacunas (S47-B1.2 B) — acción del timeline, bajo la
 * mascota. Máquina de estados EN pantalla (el estado es foto + ítems
 * en memoria — no se reconstruye por URL, decisión arquitecto):
 *
 *   captura → leyendo → revisión → (guardar) → timeline
 *                ↘ error con voz y salida / sin vacunas (salida digna)
 *
 * B2 captura: capturaFoto compartida — cámara DIRECTO, galería
 *   secundaria en Hoja (patrón SelectorAvatar/EvidenciaFoto). Resize a
 *   1600px ANTES de todo uso: legibilidad del texto del carnet para el
 *   modelo, y el base64 queda lejos del tope de 5MB de la function.
 * B3 lectura: sube el carnet al bucket (carpeta del dueño → path para
 *   p_archivo_url) + extraerVacunasDeCarnet. Espera honesta, spinner
 *   solo pasado 150ms (Ley 13). Si la extracción falla o no trae
 *   vacunas, el objeto subido SE BORRA (DELETE por carpeta, S47-B0.2)
 *   — cada reintento re-sube; la foto local JAMÁS desaparece por error.
 * B4 revisión — LA red (D-307): el carnet preside (tap → VisorFoto);
 *   FichaVacuna por ítem (dudosa = SOLO fecha faltante, S48: el tipo
 *   null es honesto y NO bloquea — los carnets reales no lo rotulan);
 *   tap → Hoja de edición (Campo + CampoFecha, HojaScroll por L-132);
 *   nombre y fecha obligatorios, tipo opcional; "Esta no es" descarta.
 *   CTA con conteo vivo, deshabilitado con dudosas o N=0. item_invalido
 *   con índice → la ficha ofensora rechazada + scroll a ella, nada se
 *   pierde.
 * B5 sellado: Aviso de éxito y vuelta al Home (refetch en focus).
 */

import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EsperaDeMarca,
  Boton,
  Campo,
  CampoFecha,
  Encabezado,
  FichaVacuna,
  FilaConfirmacionVacuna,
  OrbeCoach,
  resumenDeLaTanda,
  PieConfirmacionVacunas,
  type CampoLeido,
  Hoja,
  HojaScroll,
  Tarjeta,
  VisorFoto,
  capturarConCamara,
  capturarDeGaleria,
  radius,
  spacing,
  typography,
  useAviso,
  useTheme,
  type CampoFechaValor,
  type FotoCapturada,
} from '@epetplace/ui';
import {
  extraerVacunasDeCarnet,
  obtenerSesion,
  registrarVacunasDeCarnet,
  type VacunaExtraida,
} from '@epetplace/api';

import { borrarFotoMascota, leerBase64, subirFotoMascota } from '@/lib/subir-avatar';
import { useTraduccion } from '@/i18n';
import { faltaParaConfirmar } from '@/lib/carnet/confirmable';

// 1600px: el texto del carnet tiene que seguir siendo legible para el
// modelo (800 de avatar lo destruye); a calidad 0.7 queda en ~300-500KB.
const LADO_CARNET = 1600;
const UMBRAL_SPINNER_MS = 150;
/** 🔴 **A LOS 8 s LA ESPERA CAMBIA DE VOZ** (S113-C · lote 1.0 · C2). La primera
 *  frase promete y explica; pasados ocho segundos ya no alcanza, porque el que
 *  espera empieza a dudar de si algo se colgó. La segunda **da la razón** —los
 *  carnets escritos a mano tardan más— que es lo único honesto que se puede
 *  decir: *no hay porcentaje, porque no lo sabemos, y un porcentaje inventado
 *  es peor que el silencio.* */
const UMBRAL_ESPERA_LARGA_MS = 8000;

interface ItemRevision {
  key: number;
  /** 🔴 `null` = **la IA no pudo leer cuál vacuna es** (adenda 4 de B). Antes
   *  era `string` y una lectura fallida entraba como cadena vacía, que se
   *  dibuja igual que un nombre corto: *un vacío que parece un dato es peor
   *  que un vacío que se declara.* */
  nombre: string | null;
  tipo_vacuna: string | null;
  fecha_aplicada: string | null;
  fecha_proxima: string | null;
  veterinario: string | null;
  lote: string | null;
  descartada: boolean;
  rechazada: boolean;
}

type Fase =
  | { t: 'captura' }
  | { t: 'leyendo' }
  /** reintentable = reintentar el MISMO archivo tiene sentido (red);
   *  false = la salida es sacar otra foto (lectura local, tamaño, mime). */
  | { t: 'fallo_lectura'; mensaje: string; reintentable: boolean }
  | { t: 'sin_vacunas' }
  | { t: 'revision' };

// Voz por causa de subida (S47-B1.2, gate B3): "revisa tu conexión"
// RESERVADO a red_o_desconocido — regla 36. Las voces viven en el riel
// (S55-A3, D-315); acá queda el MAPA código→key + reintentable.
const VOZ_SUBIDA = {
  lectura_local:        { key: 'carnet.subidaLecturaLocal', reintentable: false },
  archivo_grande:       { key: 'carnet.subidaArchivoGrande', reintentable: false },
  mime_no_soportado:    { key: 'carnet.subidaMime', reintentable: false },
  rechazado_por_policy: { key: 'carnet.subidaPolicy', reintentable: false },
  red_o_desconocido:    { key: 'carnet.subidaRed', reintentable: true },
} as const;

// dudosa = SOLO fecha faltante (S48): tipo null se guarda tal cual.
/* La misma regla que decide si una fila se puede confirmar, para que la cuenta
   del texto y la del toque no puedan discrepar. */
const esDudosa = (i: ItemRevision) => faltaParaConfirmar(i) !== null;

function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CarnetDeVacunas() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{ mascotaId?: string; nombre?: string }>();
  const mascotaId = params.mascotaId ?? '';
  const nombre = params.nombre ?? t('alta.tuMascota');

  const [fase, setFase] = useState<Fase>({ t: 'captura' });
  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [pathCarnet, setPathCarnet] = useState<string | null>(null);
  const [items, setItems] = useState<ItemRevision[]>([]);
  const [hojaGaleria, setHojaGaleria] = useState(false);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [spinnerVisible, setSpinnerVisible] = useState(false);
  const [esperaLarga, setEsperaLarga] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  /** 🔴 **NINGUNA FILA SE GUARDA SIN SU TOQUE** (S113-C · 1.1 · C3). Antes se
   *  podía guardar la tanda entera sin mirar una sola: *un «guardar todo» sobre
   *  filas que nadie revisó convierte la revisión en un trámite, y la revisión
   *  es lo único que separa a la extracción de inventar datos clínicos.* Se
   *  guarda por `key` y no por índice: descartar una fila corre los índices y
   *  el toque terminaría puesto en otra. */
  const [tocadas, setTocadas] = useState<ReadonlySet<number>>(new Set());

  // Hoja de edición (borrador aparte: la ficha no edita inline)
  const [editando, setEditando] = useState<number | null>(null);
  const [bNombre, setBNombre] = useState('');
  const [bTipo, setBTipo] = useState('');
  const [bFecha, setBFecha] = useState<CampoFechaValor | undefined>(undefined);

  const scrollRef = useRef<ScrollView>(null);
  const posiciones = useRef(new Map<number, number>());
  const corriendo = useRef(false);

  // ── B2/B3 · capturar y leer ────────────────────────────────────────────────

  async function capturar(via: 'camara' | 'galeria') {
    setHojaGaleria(false);
    setPermisoDenegado(false);
    const capturarVia = via === 'camara' ? capturarConCamara : capturarDeGaleria;
    const r = await capturarVia({ redimensionarA: LADO_CARNET });
    if (r.tipo === 'permiso_denegado') {
      setPermisoDenegado(true);
      return;
    }
    if (r.tipo === 'cancelada') return;
    setFoto(r.foto);
    void leerCarnet(r.foto);
  }

  async function leerCarnet(f: FotoCapturada) {
    if (corriendo.current) return;
    corriendo.current = true;
    setFase({ t: 'leyendo' });
    setSpinnerVisible(false);
    setEsperaLarga(false);
    const timer = setTimeout(() => setSpinnerVisible(true), UMBRAL_SPINNER_MS);
    const timerLargo = setTimeout(() => setEsperaLarga(true), UMBRAL_ESPERA_LARGA_MS);

    try {
      const sesion = await obtenerSesion();
      if (!sesion.ok || sesion.data === null) {
        setFase({ t: 'fallo_lectura', mensaje: t('carnet.sesionInactiva'), reintentable: false });
        return;
      }

      const subida = await subirFotoMascota({ uri: f.uri, userId: sesion.data.user_id, prefijo: 'carnet' });
      if (!subida.ok) {
        const voz = subida.codigo in VOZ_SUBIDA ? VOZ_SUBIDA[subida.codigo as keyof typeof VOZ_SUBIDA] : VOZ_SUBIDA.red_o_desconocido;
        setFase({ t: 'fallo_lectura', mensaje: t(voz.key), reintentable: voz.reintentable });
        return;
      }

      let base64: string;
      try {
        base64 = await leerBase64(f.uri);
      } catch (e) {
        console.error('[carnet] leerBase64 EXCEPCION=', e instanceof Error ? `${e.name}: ${e.message}` : String(e));
        await borrarFotoMascota(subida.path);
        setFase({ t: 'fallo_lectura', mensaje: t('carnet.subidaLecturaLocal'), reintentable: false });
        return;
      }

      const ext = await extraerVacunasDeCarnet({ imageBase64: base64, mediaType: 'image/jpeg' });
      if (!ext.ok) {
        // La extracción falló: el objeto subido no queda colgado (B3).
        await borrarFotoMascota(subida.path);
        setFase({ t: 'fallo_lectura', mensaje: ext.mensaje, reintentable: true });
        return;
      }
      // S113-D-1.0: la lectura ahora trae DOS canastos. `plan_impreso` viaja
      // hasta acá y todavía NO tiene pantalla — es de C, y está declarado.
      if (ext.data.vacunas.length === 0) {
        await borrarFotoMascota(subida.path);
        setFase({ t: 'sin_vacunas' });
        return;
      }

      setPathCarnet(subida.path);
      setItems(ext.data.vacunas.map((v: VacunaExtraida, i: number) => ({
        key: i,
        nombre: v.nombre,
        tipo_vacuna: v.tipo_vacuna,
        fecha_aplicada: v.fecha_aplicada,
        fecha_proxima: v.fecha_proxima,
        veterinario: v.veterinario,
        lote: v.lote,
        descartada: false,
        rechazada: false,
      })));
      setFase({ t: 'revision' });
    } finally {
      clearTimeout(timer);
      clearTimeout(timerLargo);
      corriendo.current = false;
    }
  }

  // ── B4 · edición ───────────────────────────────────────────────────────────

  function abrirEdicion(key: number) {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    setBNombre(item.nombre ?? '');
    setBTipo(item.tipo_vacuna ?? '');
    setBFecha(item.fecha_aplicada ? { fecha: item.fecha_aplicada, precision: 'exacta' } : undefined);
    setEditando(key);
  }

  const fechaFutura = bFecha !== undefined && bFecha.fecha > hoyIso();
  // El tipo es OPCIONAL (S48): vacío = null honesto, editable después.
  const edicionValida = bNombre.trim().length > 0 && bFecha !== undefined && !fechaFutura;

  function confirmarEdicion() {
    if (editando === null || !edicionValida || bFecha === undefined) return;
    setItems((prev) => prev.map((i) => i.key === editando
      ? { ...i, nombre: bNombre.trim(), tipo_vacuna: bTipo.trim() || null, fecha_aplicada: bFecha.fecha, rechazada: false }
      : i,
    ));
    setEditando(null);
  }

  function descartar(key: number) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, descartada: true } : i)));
  }

  /** Los campos que la fila muestra. **`null` viaja como `null`**: la pieza lo
 *  dibuja vacío y editable, que es lo que un dato que el modelo no leyó tiene
 *  que parecer — nunca un guion ni un «—», que se leen como valor. */
function camposDe(
  i: { fecha_aplicada: string | null; fecha_proxima: string | null; tipo_vacuna: string | null; lote: string | null; veterinario: string | null },
  t: ReturnType<typeof useTraduccion>['t'],
): CampoLeido[] {
  return [
    { etiqueta: t('carnet.campoAplicada'), valor: i.fecha_aplicada },
    { etiqueta: t('carnet.campoProxima'), valor: i.fecha_proxima },
    { etiqueta: t('carnet.campoTipo'), valor: i.tipo_vacuna },
    { etiqueta: t('carnet.campoLote'), valor: i.lote },
    { etiqueta: t('carnet.campoVeterinario'), valor: i.veterinario },
  ];
}

// ── B4/B5 · guardar ────────────────────────────────────────────────────────

  const activas = items.filter((i) => !i.descartada);
  const dudosas = activas.filter(esDudosa).length;
  const n = activas.length;
  /* 🔴 **UNA SOLA CUENTA, la del pie.** Acá había un `faltanPorTocar` propio
     sobre las activas, y el descarte lo dejó atrás: para la pieza **descartar
     ES revisar**, así que una tanda toda descartada le daba «cero por revisar»
     a ella y otra cosa a mí. *Dos piezas contando lo mismo por separado
     terminan discrepando el día que una de las dos aprenda algo* — y el
     guardado se decide con la misma función que dibuja el botón. */
  const tanda = items.map((i) => ({ tocada: tocadas.has(i.key), descartada: i.descartada }));
  /** La PRIMERA sin nombre entre las que siguen vivas: es la única que puede
   *  llevar el foco sin pelearse con otra. `null` si no hay ninguna. */
  /** La primera fila viva a la que le falta la fecha — el destino del texto
   *  de arriba y del botón apagado. */
  const primeraIncompleta = activas.find(esDudosa)?.key ?? null;
  const primeraSinNombre =
    activas.find((i) => i.nombre === null || i.nombre.trim() === '')?.key ?? null;

  async function guardar() {
    /* 🔴 **EL CINTURÓN VUELVE, Y CON LA MISMA REGLA QUE EL PIE.** En el 1.0.2
       saqué la cuenta de toques de acá porque `resumenDeLaTanda` no estaba
       exportada y replicarla habría dejado dos cuentas con distinto dueño.
       **Sí estaba** (`index.ts:1167`): yo medí eso contra `b-1.0` y repetí el
       pedido sin volver a medir contra el árbol que ya tenía `b-1.1`. *Un
       pedido propio también envejece, y el mío se copió dos partes seguidas.*
       Ahora el guard y el botón derivan del MISMO `listo`. */
    if (guardando) return;
    /* ④ 🔴 **NUNCA UN CORTE MUDO.** Acá había un `return` seco por `dudosas`, y
       ése es el segundo mitad del defecto que el founder vio: el pie encendido
       llamaba, la función cortaba y **la pantalla no decía nada**. *Un guard
       que no habla es indistinguible de una app colgada.* Con la cura de
       arriba este caso ya no debería alcanzarse —una fila sin fecha no puede
       quedar revisada— así que si esta razón aparece, es que algo más la
       produjo, y quiero verla. */
    if (dudosas > 0) {
      setErrorGuardar(dudosas === 1 ? t('carnet.porCompletarUna') : t('carnet.porCompletar', { n: dudosas }));
      return;
    }
    if (!resumenDeLaTanda(tanda).listo) {
      setErrorGuardar(t('carnet.faltanTocar', { n: resumenDeLaTanda(tanda).faltan }));
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    const r = await registrarVacunasDeCarnet({
      mascota_id: mascotaId,
      /* 🔴 **UNA FILA SIN NOMBRE NO VIAJA, y el filtro no debería quitar nunca
         nada.** La RPC pide `nombre: string`, y acá el compilador obligó a
         decidir qué pasa con el `null` de la adenda 4. Las tres salidas
         posibles eran: mandar `''` —inventar una vacuna sin nombre—, cortar el
         guardado entero por una fila, o esto: **la fila sin nombre no se puede
         confirmar** (la pieza lo impide y el pie exige todas revisadas), así
         que al llegar acá no puede quedar ninguna. El filtro es el cinturón de
         esa afirmación: *si algún día quita algo, es un defecto que quiero ver
         en el número, no un dato que se fue en silencio.* */
      vacunas: activas
        .filter((i): i is typeof i & { nombre: string } => i.nombre !== null && i.nombre.trim() !== '')
        .map((i) => ({
        nombre: i.nombre,
        tipo_vacuna: i.tipo_vacuna,
        fecha_aplicada: i.fecha_aplicada,
        fecha_proxima: i.fecha_proxima,
        veterinario_nombre_externo: i.veterinario,
        lote: i.lote,
      })),
      archivo_url: pathCarnet,
    });
    setGuardando(false);

    if (!r.ok) {
      if (r.codigo === 'item_invalido' && r.indice_item !== undefined) {
        // la ficha ofensora, en su lugar: rechazada + scroll a ella (B4)
        const ofensora = activas[r.indice_item - 1];
        if (ofensora) {
          setItems((prev) => prev.map((i) => (i.key === ofensora.key ? { ...i, rechazada: true } : i)));
          const y = posiciones.current.get(ofensora.key);
          if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing[4]), animated: true });
        }
      }
      setErrorGuardar(r.mensaje);
      return;
    }

    mostrar({
      texto:
        r.data.insertadas === 1
          ? t('carnet.exitoUna', { nombre })
          : t('carnet.exitoN', { n: r.data.insertadas, nombre }),
      variante: 'exito',
    });
    router.back();
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const voz = {
    titulo: typography.family.sans.light,
    cuerpo: typography.family.sans.regular,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('carnet.titulo')} atras onAtras={() => router.back()} />

      {/* B2 · captura */}
      {fase.t === 'captura' && (
        <View style={{ flex: 1, padding: spacing[5], gap: spacing[4], justifyContent: 'center' }}>
          <Text style={{ fontFamily: voz.titulo, fontSize: typography.size.xl, lineHeight: typography.size.xl * 1.25, color: theme.text.primary }}>
            {t('carnet.capturaTitulo', { nombre })}
          </Text>
          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            {t('carnet.capturaDetalle')}
          </Text>
          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {t('carnet.multiPagina')}
          </Text>
          {permisoDenegado && (
            <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, color: theme.status.dangerText }}>
              {t('carnet.permisoCamara')}
            </Text>
          )}
          <Boton variante="primario" bloque etiqueta={t('carnet.sacarFoto')} onPress={() => void capturar('camara')} />
          <Boton variante="ghost" bloque etiqueta={t('carnet.masOpciones')} onPress={() => setHojaGaleria(true)} />
        </View>
      )}

      {/* B3 · leyendo — espera honesta, spinner solo pasado 150ms (Ley 13) */}
      {fase.t === 'leyendo' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[5], gap: spacing[4] }}>
          {foto && (
            <Image source={{ uri: foto.uri }} contentFit="cover" transition={0} style={{ width: 160, height: 160, borderRadius: radius.lg }} />
          )}
          {/* S53-B2d: la espera de marca (§5.3) — la huella respirando
              reemplaza al spinner; la voz honesta de abajo se conserva
              VERBATIM. Mismo umbral de visibilidad (Ley 13). */}
          {/* ⭐ **EL ORBE DE NEXO EN LA ESPERA** (C2 del 1.0, que quedó pedido):
              la lectura del carnet es lo que más se parece a que el Coach esté
              trabajando, así que la espera lleva su cara y no una huella
              genérica. Mismo umbral (Ley 13). */}
          {spinnerVisible && <OrbeCoach tamano={36} encendido={1} />}
          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary, textAlign: 'center' }}>
            {esperaLarga ? t('carnet.esperaLarga') : t('carnet.espera')}
          </Text>
        </View>
      )}

      {/* B3 · fallos con voz y salida — la foto JAMÁS desaparece */}
      {(fase.t === 'fallo_lectura' || fase.t === 'sin_vacunas') && (
        <View style={{ flex: 1, padding: spacing[5], gap: spacing[4], justifyContent: 'center' }}>
          {foto && (
            <Image source={{ uri: foto.uri }} contentFit="cover" transition={0} style={{ width: 120, height: 120, borderRadius: radius.lg, alignSelf: 'center' }} />
          )}
          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.primary, textAlign: 'center' }}>
            {fase.t === 'sin_vacunas' ? t('carnet.sinVacunas') : fase.mensaje}
          </Text>
          {fase.t === 'fallo_lectura' && fase.reintentable && foto && (
            <Boton variante="primario" bloque etiqueta={t('carnet.probarDeNuevo')} onPress={() => void leerCarnet(foto)} />
          )}
          <Boton variante="secundario" bloque etiqueta={t('carnet.sacarOtraFoto')} onPress={() => { setFoto(null); setFase({ t: 'captura' }); }} />
          <Boton variante="ghost" bloque etiqueta={t('carnet.volver')} onPress={() => router.back()} />
        </View>
      )}

      {/* B4 · revisión — LA red */}
      {fase.t === 'revision' && foto && (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        >
          {/* el carnet PRESIDE — tap → VisorFoto */}
          <Pressable
            onPress={() => setVisorAbierto(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel={t('carnet.verCarnetCompleto')}
          >
            <Tarjeta relleno="ninguno">
              <Image source={{ uri: foto.uri }} contentFit="cover" transition={0} style={{ width: '100%', height: 180 }} />
            </Tarjeta>
          </Pressable>

          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {t('carnet.revisionGuia')} {t('carnet.tipoOpcional')}
          </Text>

          {activas.map((i) => (
            <View key={i.key} onLayout={(e) => posiciones.current.set(i.key, e.nativeEvent.layout.y)}>
              {/* ⭐ **LA CONFIRMACIÓN, FILA POR FILA** (C3), contra el contrato
                  de la adenda de B.

                  🔴 **`vozOrigen` NO SE PASA, y ésa es la decisión.** Antes le
                  mandaba «leído del carnet» porque `origen` era obligatoria y
                  había que poner algo; ahora la pieza dice que **ausente ⇒ no
                  dibuja ninguna línea de procedencia**. *De un carnet donde no
                  se distingue si fue sello o lapicera no sale una procedencia
                  por defecto: sale ninguna.* Cuando la extracción diga de dónde
                  salió cada fila, esta prop aparece con su dato.

                  🔴 `confianza: 'baja'` en TODAS sigue siendo un dato honesto y
                  no un relleno: la extracción no la devuelve, así que **no la
                  sabemos**, y la propia pieza dice que una duda que no se
                  muestra es una afirmación. Fail-closed hasta que A la mande.

                  ☠️ **Murió mi botón «Esta no es» de abajo**: la pieza ahora
                  trae descartar con su voz, y el retiro va en el MISMO acto que
                  el montaje — dos caminos al mismo descarte es el defecto que
                  `L-395` existe para evitar. */}
              <FilaConfirmacionVacuna
                nombre={i.nombre}
                campos={camposDe(i, t)}
                confianza="baja"
                vozRevisar={t('carnet.filaRevisar')}
                vozConfirmar={t('carnet.filaConfirmar')}
                vozDescartar={t('carnet.estaNoEs')}
                etiquetaNombre={t('carnet.campoNombre')}
                vozSinNombre={t('carnet.sinNombre')}
                onNombre={(v) =>
                  setItems((prev) => prev.map((x) => (x.key === i.key ? { ...x, nombre: v } : x)))
                }
                /* 🔴 **EL FOCO LO DECIDE LA LISTA, no la fila.** Con dos sin
                   nombre, `autoFocus` en las dos deja el foco en la ÚLTIMA
                   —la que se montó al final— y la pantalla salta al fondo. La
                   fila no sabe si es la primera; acá sí se sabe. */
                enfocar={i.key === primeraSinNombre}
                tocada={tocadas.has(i.key)}
                onConfirmar={() => {
                  /* 🔴 **UNA FILA INCOMPLETA NO PUEDE QUEDAR «REVISADA», y ese
                     era el defecto que el founder vio en su teléfono.** El pie
                     de B se enciende con todas revisadas —sólo mira `tocada` y
                     `descartada`— y `guardar()` cortaba aparte por `dudosas`,
                     **sin decir nada**: botón encendido que al tocarlo no hacía
                     nada. Dos cuentas otra vez, y esta vez la puse yo al montar
                     el pie.
                     Ahora hay UNA: si le falta la fecha, la fila **no se marca**
                     —así el pie queda apagado y con su razón a la vista— y se
                     abre su edición, que es donde se completa. *El toque no se
                     traga: lleva al lugar donde se resuelve.* */
                  const falta = faltaParaConfirmar(i);
                  if (falta !== null) {
                    mostrar({ texto: falta === 'nombre' ? t('carnet.sinNombre') : t('carnet.faltaFecha') });
                    abrirEdicion(i.key);
                    return;
                  }
                  setTocadas((prev) => {
                    const s = new Set(prev);
                    s.add(i.key);
                    return s;
                  });
                }}
                onEditar={() => abrirEdicion(i.key)}
                onDescartar={() => descartar(i.key)}
              />
            </View>
          ))}

          {errorGuardar !== null && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, color: theme.status.dangerText }}
            >
              {errorGuardar}
            </Text>
          )}
          {/* ③ **EL TEXTO LLEVA A LA PRIMERA INCOMPLETA.** Decía cuántas faltan
              y no ofrecía dónde: con cuatro filas y una pantalla larga, saber
              que faltan cuatro no acerca a ninguna. Ahora se toca y lleva —
              misma ley que la fila de ausencias del perfil: *la puerta tiene
              que estar donde está la carencia.* */}
          {dudosas > 0 && primeraIncompleta !== null && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={dudosas === 1 ? t('carnet.porCompletarUna') : t('carnet.porCompletar', { n: dudosas })}
              onPress={() => {
                const y = posiciones.current.get(primeraIncompleta);
                if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
                abrirEdicion(primeraIncompleta);
              }}
            >
              <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, color: theme.text.secondary, textDecorationLine: 'underline' }}>
                {dudosas === 1 ? t('carnet.porCompletarUna') : t('carnet.porCompletar', { n: dudosas })}
              </Text>
            </Pressable>
          )}
          {/* ⭐ **EL PIE DE LA TANDA, de B** (adenda 2). Reemplaza al `Boton`
              que yo componía con su propia cuenta: *dos piezas contando lo
              mismo por separado terminan discrepando el día que una de las dos
              aprenda algo* — y acá ya pasó, porque el descarte cambió qué
              significa «revisada» y mi cuenta no lo sabía.
              Se le pasan **TODAS** las filas, no las activas: el pie distingue
              «todas descartadas» de «no había ninguna», y con `activas` esas
              dos se verían iguales.
              Y **el número de «Guardar N» lo pone el pie, no la pantalla**: con
              tres descartadas mi cuenta habría prometido «Guardar 5» sobre un
              botón que guarda 2, y el número de un botón es una promesa. */}
          <PieConfirmacionVacunas
            filas={tanda}
            vozGuardar={(k) => (k === 1 ? t('carnet.guardarUna') : t('carnet.guardarN', { n: k }))}
            vozFaltan={(k) => (k === 1 ? t('carnet.faltaTocarUna') : t('carnet.faltanTocar', { n: k }))}
            vozNinguna={t('carnet.ningunaParaGuardar')}
            onGuardar={() => void guardar()}
          />
        </ScrollView>
      )}

      {/* galería secundaria en Hoja (patrón SelectorAvatar) */}
      <Hoja visible={hojaGaleria} onCerrar={() => setHojaGaleria(false)} titulo={t('carnet.hojaGaleriaTitulo')} conCerrar>
        <View style={{ gap: spacing[3], padding: spacing[4] }}>
          <Boton variante="secundario" bloque etiqueta={t('carnet.elegirGaleria')} onPress={() => void capturar('galeria')} />
        </View>
      </Hoja>

      {/* Hoja de edición — Campo + CampoFecha (HojaScroll, L-132) */}
      <Hoja visible={editando !== null} onCerrar={() => setEditando(null)} titulo={t('carnet.edicionTitulo')} altura="completa" conCerrar>
        <HojaScroll contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
          <Campo label={t('carnet.nombreVacunaLabel')} value={bNombre} onChangeText={setBNombre} />
          <Campo label={t('carnet.tipoLabel')} value={bTipo} onChangeText={setBTipo} ayuda={t('carnet.tipoAyuda')} />
          <CampoFecha
            label={t('carnet.fechaAplicoLabel')}
            valor={bFecha}
            onChange={setBFecha}
            placeholder={t('carnet.fechaPlaceholder')}
            tituloHoja={t('carnet.fechaAplicoLabel')}
            error={fechaFutura ? t('carnet.fechaFutura') : undefined}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta={t('carnet.guardarCambios')}
            deshabilitado={!edicionValida}
            onPress={confirmarEdicion}
          />
        </HojaScroll>
      </Hoja>

      {/* el carnet en grande */}
      {foto && (
        <VisorFoto
          visible={visorAbierto}
          onCerrar={() => setVisorAbierto(false)}
          fotos={[foto.uri]}
          etiqueta={t('carnet.carnetDe', { nombre })}
        />
      )}
    </View>
  );
}
