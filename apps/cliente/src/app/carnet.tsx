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
  FilaConfirmacionVacuna,
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
import { faltaParaConfirmar } from '@/lib/carnet/confirmable';
import type { ConfianzaExtraccion } from '@epetplace/api';
import { useTraduccion } from '@/i18n';

// 1600px: el texto del carnet tiene que seguir siendo legible para el
// modelo (800 de avatar lo destruye); a calidad 0.7 queda en ~300-500KB.
const LADO_CARNET = 1600;
const UMBRAL_SPINNER_MS = 150;

interface ItemRevision {
  key: number;
  /** S113-D-2.4: nullable, por firma del founder. Hay renglones donde HAY una
   *  vacuna y su nombre no se lee; la fila llega igual para que la persona la
   *  complete. **Sin nombre no se guarda** — ver `esDudosa`. */
  nombre: string | null;
  tipo_vacuna: string | null;
  /** Puede venir PARCIAL: `YYYY-MM` o `--MM-DD`. Sin día completo no se
   *  guarda — la columna es `date`. Ver `esDudosa`. */
  fecha_aplicada: string | null;
  fecha_precision: 'dia' | 'mes' | 'sin_anio' | null;
  /** Lo que el carnet dice, tal cual. Se le MUESTRA a la persona al lado del
   *  campo: sin esto tiene que ir a buscar el papel para saber de dónde salió
   *  la fecha que le proponemos. */
  fecha_literal: string | null;
  /** 🔴 **TAL CUAL LA MANDA LA EDGE**, no achatada a booleano: `'fecha'` (el
   *  modelo completó algo) e `'incompleta'` (algo faltaba y se anuló) son
   *  causas distintas. Antes se guardaba como `dudosaPorFecha: v.dudosa !==
   *  null` y **la causa se perdía en la puerta** — la fila no podía decir por
   *  qué la frenaban. */
  dudosa: 'fecha' | 'incompleta' | null;
  /** De la edge. La fila la muestra: una lectura de confianza baja se revisa
   *  distinto que una alta, y esconderlo es decidir por la persona. */
  confianza: ConfianzaExtraccion;
  /** La persona la dio por buena. **Sin esto no se guarda ninguna**: revisar
   *  es un acto, no un default. */
  tocada: boolean;
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

/* ☠️ **`esDudosa` MURIÓ ACÁ** (reconciliación 1.2, orden de mesa). Recalculaba
   en la pantalla lo que la edge ya decide (`dudosa`) y lo mezclaba con el hecho
   de la columna `date`. Su contenido no se perdió: vive entero en
   `lib/carnet/confirmable.ts`, que **lee la marca del servidor** en vez de
   volver a deducirla. *Una regla, una pantalla* — y las razones de D (nombre
   nulo, fecha parcial) siguen rigiendo, que eran correctas: lo que sobraba era
   que vivieran en un tercer lugar.
   Se conserva el nombre local para que el resto de la pantalla no cambie. */
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
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

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
    const timer = setTimeout(() => setSpinnerVisible(true), UMBRAL_SPINNER_MS);

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
        fecha_precision: v.fecha_aplicada_precision,
        fecha_literal: v.fecha_literal,
        dudosa: v.dudosa,
        confianza: v.confianza,
        tocada: false,
        fecha_proxima: v.fecha_proxima,
        veterinario: v.veterinario,
        lote: v.lote,
        descartada: false,
        rechazada: false,
      })));
      setFase({ t: 'revision' });
    } finally {
      clearTimeout(timer);
      corriendo.current = false;
    }
  }

  // ── B4 · edición ───────────────────────────────────────────────────────────

  function abrirEdicion(key: number) {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    // Sin nombre, el campo abre VACÍO para que la persona lo escriba.
    setBNombre(item.nombre ?? '');
    setBTipo(item.tipo_vacuna ?? '');
    // Sólo se pre-llena si la fecha está COMPLETA. Con «FEB 2023» el selector
    // abre vacío: pre-llenarlo con un día elegido por nosotros sería meter por
    // la pantalla el mismo día inventado que sacamos de la extracción.
    setBFecha(
      item.fecha_aplicada && item.fecha_precision === 'dia'
        ? { fecha: item.fecha_aplicada, precision: 'exacta' }
        : undefined,
    );
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


/** Los campos que la fila muestra. 🔴 **Sólo los que se leyeron**: la pieza
 *  dibuja un campo vacío **como algo a completar**, así que mandar los cinco
 *  siempre daría, en una fila sin fecha, TRES pedidos de fecha —«Aplicada»
 *  vacía, «Próxima» vacía y el que la pieza pide por `incompleta`—. *Tres
 *  casillas para un dato no piden tres veces: hacen dudar de cuál es la buena.*
 *  El único campo exigido es la fecha aplicada, y ése lo pide la pieza. */
function camposDe(
  i: ItemRevision,
  t: ReturnType<typeof useTraduccion>['t'],
): { etiqueta: string; valor: string | null }[] {
  const todos = [
    { etiqueta: t('carnet.campoAplicada'), valor: i.fecha_aplicada },
    { etiqueta: t('carnet.campoProxima'), valor: i.fecha_proxima },
    { etiqueta: t('carnet.campoTipo'), valor: i.tipo_vacuna },
    { etiqueta: t('carnet.campoLote'), valor: i.lote },
    { etiqueta: t('carnet.campoVeterinario'), valor: i.veterinario },
  ];
  const tiene = (c: { valor: string | null }) => c.valor !== null && c.valor.trim() !== '';
  /* 🔴 **EL CAMPO QUE FALTA SE DEJA PASAR, Y SÓLO ÉSE.** Medido en pantalla con
     el carnet real: la pieza cuelga su aviso **del campo vacío** —lo dibuja con
     borde de atención y el texto debajo—, así que filtrar todos los vacíos
     dejaba la fila **muda**: el pie decía «faltan 3» y ninguna fila lo decía.
     *Mi filtro y la pieza se contradecían, y el resultado era el mismo síntoma
     del bloqueante del founder: una cuenta que nadie podía ver.*
     Pasa **uno**: la fecha aplicada cuando es lo que falta. Los otros cuatro
     vacíos siguen fuera — con los cinco, una fila sin fecha mostraba **tres
     casillas de fecha** y *tres casillas para un dato no piden tres veces:
     hacen dudar de cuál es la buena.* */
  const falta = faltaParaConfirmar(i) === 'fecha';
  return todos.filter((c) => tiene(c) || (falta && c.etiqueta === t('carnet.campoAplicada')));
}

// ── B4/B5 · guardar ────────────────────────────────────────────────────────

  const activas = items.filter((i) => !i.descartada);
  const dudosas = activas.filter(esDudosa).length;
  /** 🔴 **LAS QUE FALTAN TOCAR.** Con la pieza de B, confirmar es un ACTO: la
   *  fila trae «Es correcta» y hasta que alguien la toque, nadie la revisó.
   *  Sin esta cuenta `tocada` sería decorativo — *un botón que se dibuja y no
   *  cambia nada enseña a ignorarlo*. Se cuenta **sólo entre las completas**:
   *  pedirle a alguien que confirme una fila a la que le falta la fecha es
   *  pedirle que dé por buena una fila que no puede guardarse. */
  const sinTocar = activas.filter((i) => faltaParaConfirmar(i) === null && !i.tocada).length;
  const n = activas.length;

  /** El nombre que la persona escribe cuando la IA no lo leyó. **Al escribirlo
   *  la fila deja de estar incompleta sola**: no hay un segundo acto de
   *  «guardar el nombre» — *pedir dos toques para un dato que ya se tecleó es
   *  hacer trabajar dos veces por la misma cosa*. */
  function editarNombre(key: number, v: string) {
    setItems((xs) => xs.map((i) => (i.key === key ? { ...i, nombre: v } : i)));
  }

  /** 🔴 **CONFIRMAR NO PUEDE MARCAR UNA FILA QUE NO SE PUEDE GUARDAR.** Si le
   *  falta algo, el toque **no se traga**: no marca, y la fila ya dice qué
   *  falta con su voz al lado del campo. *Un acto que no hace nada y no explica
   *  es indistinguible de una app colgada* — es el defecto que el founder vio
   *  en su teléfono, y la cura fue que la cuenta sea una sola. */
  function confirmar(key: number) {
    setItems((xs) =>
      xs.map((i) => (i.key === key && faltaParaConfirmar(i) === null ? { ...i, tocada: true } : i)),
    );
  }

  /** La PRIMERA que falta, en el orden de la lista: es dónde va el foco. */
  const primeraIncompleta = activas.find((i) => faltaParaConfirmar(i) !== null)?.key ?? -1;

  async function guardar() {
    if (guardando || n === 0 || dudosas > 0 || sinTocar > 0) {
      /* Nunca un corte mudo: el pie ya dice la razón arriba del botón, y el
         botón está apagado — pero si algo llegara acá con el pie desincronizado,
         callarse sería el defecto del 1.1.2 otra vez. */
      return;
    }
    setGuardando(true);
    setErrorGuardar(null);
    // Cinturón: `guardar()` ya se niega con `dudosas > 0`, y una fila sin
    // nombre ES dudosa — así que acá no puede quedar ninguna. Se estrecha
    // igual, porque la columna es NOT NULL y **preferimos no llamar a guardar
    // antes que mandar un null que el servidor va a rebotar después de que la
    // persona apretó.**
    const conNombre = activas.filter(
      (i): i is ItemRevision & { nombre: string } =>
        typeof i.nombre === 'string' && i.nombre.length > 0 &&
        i.fecha_precision === 'dia' && i.dudosa === null,
    );
    if (conNombre.length !== activas.length) {
      setGuardando(false);
      return;
    }
    const r = await registrarVacunasDeCarnet({
      mascota_id: mascotaId,
      vacunas: conNombre.map((i) => ({
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
          {spinnerVisible && <EsperaDeMarca tamano={64} />}
          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary, textAlign: 'center' }}>
            {t('carnet.espera')}
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
              {/* ⭐ **LA PIEZA DE B, QUE ES LA QUE EL FOUNDER VALIDÓ.**
                  Reemplaza a `FichaVacuna` por orden de mesa. Lo que trae y
                  `FichaVacuna` no podía: **decir por qué una fila está
                  frenada, pegado al campo que falta**, y **pedir el nombre
                  cuando no se leyó** — que es exactamente la pregunta que D
                  dejó abierta acá («qué se le muestra a la familia cuando el
                  nombre no se lee es diseño tuyo»). */}
              <FilaConfirmacionVacuna
                nombre={i.nombre}
                etiquetaNombre={t('carnet.campoNombre')}
                vozSinNombre={t('carnet.sinNombre')}
                onNombre={(v) => editarNombre(i.key, v)}
                /* 🔴 **UNA SOLA CUENTA.** La misma función que decide si el pie
                   se enciende decide qué marca esta fila: si discreparan, el
                   botón volvería a mentir — que es el defecto que el founder
                   vio en su teléfono. */
                /* Sólo la FECHA viaja como `incompleta`: **el nombre lo
                   resuelve la pieza sola** por `nombre === null`, con su
                   `vozSinNombre`. Mandarlo por los dos caminos pondría dos
                   avisos sobre el mismo hueco. */
                incompleta={faltaParaConfirmar(i) === 'fecha' ? 'fecha' : undefined}
                vozIncompleta={faltaParaConfirmar(i) === 'fecha' ? t('carnet.faltaFecha') : undefined}
                /* El foco lo decide LA LISTA, no la fila: la primera que falte.
                   Que cada fila decidiera enfocarse daría N focos peleando. */
                enfocar={i.key === primeraIncompleta}
                campos={camposDe(i, t)}
                confianza={i.confianza}
                vozOrigen={i.fecha_literal !== null ? t('carnet.filaOrigen', { literal: i.fecha_literal }) : undefined}
                vozRevisar={t('carnet.filaRevisar')}
                vozConfirmar={t('carnet.filaConfirmar')}
                vozDescartar={t('carnet.estaNoEs')}
                tocada={i.tocada}
                onConfirmar={() => confirmar(i.key)}
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
          {dudosas > 0 && (
            <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {dudosas === 1 ? t('carnet.porCompletarUna') : t('carnet.porCompletar', { n: dudosas })}
            </Text>
          )}
          {/* 🔴 **DOS RAZONES DISTINTAS, DOS VOCES DISTINTAS** — y en orden:
              primero completar, después revisar. *«Faltan 3 por revisar» sobre
              una fila a la que le falta la fecha manda a hacer lo segundo antes
              que lo primero.* Sólo se dice cuando ya no falta completar nada. */}
          {dudosas === 0 && sinTocar > 0 && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, color: theme.text.secondary }}
            >
              {sinTocar === 1 ? t('carnet.faltaTocarUna') : t('carnet.faltanTocar', { n: sinTocar })}
            </Text>
          )}
          <Boton
            variante="primario"
            bloque
            etiqueta={n === 1 ? t('carnet.guardarUna') : t('carnet.guardarN', { n })}
            deshabilitado={n === 0 || dudosas > 0 || sinTocar > 0}
            cargando={guardando}
            onPress={() => void guardar()}
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
