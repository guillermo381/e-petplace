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

// 1600px: el texto del carnet tiene que seguir siendo legible para el
// modelo (800 de avatar lo destruye); a calidad 0.7 queda en ~300-500KB.
const LADO_CARNET = 1600;
const UMBRAL_SPINNER_MS = 150;

interface ItemRevision {
  key: number;
  nombre: string;
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

// Voz por causa de subida (S47-B1.2, gate B3): "revisá tu conexión"
// RESERVADO a red_o_desconocido — regla 36.
const VOZ_SUBIDA: Record<string, { mensaje: string; reintentable: boolean }> = {
  lectura_local:        { mensaje: 'No pudimos leer la foto del teléfono. Probá sacarla de nuevo.', reintentable: false },
  archivo_grande:       { mensaje: 'La foto pesa demasiado. Probá sacarla de nuevo.', reintentable: false },
  mime_no_soportado:    { mensaje: 'Ese formato de imagen no está soportado. Probá con una foto nueva.', reintentable: false },
  rechazado_por_policy: { mensaje: 'No pudimos guardar la foto en tu espacio. Cerrá sesión, volvé a entrar y probá de nuevo.', reintentable: false },
  red_o_desconocido:    { mensaje: 'La foto no se pudo subir. Revisá tu conexión y probá de nuevo.', reintentable: true },
};

// Guía multi-página (S48-B7.3, D-313 pata a): el flujo es una-foto-por-
// pasada repetible y la UI lo CUENTA — sin esto, un carnet de varias
// páginas parece no caber. Regla 26.
const VOZ_CAPTURA = {
  multiPagina: '¿El carnet tiene varias páginas? Escanealas de a una — cada tanda se suma a su historia.',
  // S48-B8.3 (hallazgo founder: "se siente lento"): espera honesta con
  // expectativa real. PROHIBIDO progreso falso — no sabemos cuánto falta
  // y no mentimos (L-139 aplica a la UI también).
  espera: 'Estamos leyendo el carnet. Esto puede tardar un minuto — cada vacuna que encontremos se suma a su historia.',
};

// Voz de la revisión (regla 26). El texto del tipo baja la expectativa
// con voz humana — base aprobada por founder en el arranque de S48.
const VOZ_REVISION = {
  guia: 'Esto es lo que leímos. Tocá una vacuna para corregirla — la fecha es necesaria para guardar.',
  tipoOpcional: 'Si tu carnet no trae el tipo de vacuna, no pasa nada. Podés agregarlo después.',
};

// dudosa = SOLO fecha faltante (S48): tipo null se guarda tal cual.
const esDudosa = (i: ItemRevision) => !i.fecha_aplicada;

function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CarnetDeVacunas() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{ mascotaId?: string; nombre?: string }>();
  const mascotaId = params.mascotaId ?? '';
  const nombre = params.nombre ?? 'tu mascota';

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
        setFase({ t: 'fallo_lectura', mensaje: 'Tu sesión no está activa. Volvé a entrar e intentá de nuevo.', reintentable: false });
        return;
      }

      const subida = await subirFotoMascota({ uri: f.uri, userId: sesion.data.user_id, prefijo: 'carnet' });
      if (!subida.ok) {
        const voz = VOZ_SUBIDA[subida.codigo] ?? VOZ_SUBIDA.red_o_desconocido;
        setFase({ t: 'fallo_lectura', ...voz });
        return;
      }

      let base64: string;
      try {
        base64 = await leerBase64(f.uri);
      } catch (e) {
        console.error('[carnet] leerBase64 EXCEPCION=', e instanceof Error ? `${e.name}: ${e.message}` : String(e));
        await borrarFotoMascota(subida.path);
        setFase({ t: 'fallo_lectura', mensaje: 'No pudimos leer la foto del teléfono. Probá sacarla de nuevo.', reintentable: false });
        return;
      }

      const ext = await extraerVacunasDeCarnet({ imageBase64: base64, mediaType: 'image/jpeg' });
      if (!ext.ok) {
        // La extracción falló: el objeto subido no queda colgado (B3).
        await borrarFotoMascota(subida.path);
        setFase({ t: 'fallo_lectura', mensaje: ext.mensaje, reintentable: true });
        return;
      }
      if (ext.data.length === 0) {
        await borrarFotoMascota(subida.path);
        setFase({ t: 'sin_vacunas' });
        return;
      }

      setPathCarnet(subida.path);
      setItems(ext.data.map((v: VacunaExtraida, i: number) => ({
        key: i,
        nombre: v.nombre,
        tipo_vacuna: v.tipo_vacuna,
        fecha_aplicada: v.fecha_aplicada,
        fecha_proxima: v.fecha_proxima,
        veterinario: v.veterinario_nombre_externo,
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
    setBNombre(item.nombre);
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

  // ── B4/B5 · guardar ────────────────────────────────────────────────────────

  const activas = items.filter((i) => !i.descartada);
  const dudosas = activas.filter(esDudosa).length;
  const n = activas.length;

  async function guardar() {
    if (guardando || n === 0 || dudosas > 0) return;
    setGuardando(true);
    setErrorGuardar(null);
    const r = await registrarVacunasDeCarnet({
      mascota_id: mascotaId,
      vacunas: activas.map((i) => ({
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
      texto: `Guardamos ${r.data.insertadas} ${r.data.insertadas === 1 ? 'vacuna' : 'vacunas'} en la historia de ${nombre}`,
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
    <View style={{ flex: 1, backgroundColor: theme.bg.base, paddingTop: insets.top }}>
      <Encabezado variante="navegacion" titulo="Carnet de vacunas" atras onAtras={() => router.back()} />

      {/* B2 · captura */}
      {fase.t === 'captura' && (
        <View style={{ flex: 1, padding: spacing[5], gap: spacing[4], justifyContent: 'center' }}>
          <Text style={{ fontFamily: voz.titulo, fontSize: typography.size.xl, lineHeight: typography.size.xl * 1.25, color: theme.text.primary }}>
            Sacale una foto al carnet de {nombre} — nosotros leemos las vacunas
          </Text>
          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            Con buena luz y el carnet bien plano, mejor. Después vas a poder revisar y corregir todo antes de guardar.
          </Text>
          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {VOZ_CAPTURA.multiPagina}
          </Text>
          {permisoDenegado && (
            <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, color: theme.status.dangerText }}>
              Necesitamos permiso para usar la cámara. Podés habilitarlo en los ajustes del teléfono, o elegir una foto de la galería.
            </Text>
          )}
          <Boton variante="primario" bloque etiqueta="Sacarle una foto" onPress={() => void capturar('camara')} />
          <Boton variante="ghost" bloque etiqueta="Más opciones" onPress={() => setHojaGaleria(true)} />
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
            {VOZ_CAPTURA.espera}
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
            {fase.t === 'sin_vacunas'
              ? 'No encontramos vacunas legibles en esta foto. Podés probar con otra, o volver a intentarlo en otro momento.'
              : fase.mensaje}
          </Text>
          {fase.t === 'fallo_lectura' && fase.reintentable && foto && (
            <Boton variante="primario" bloque etiqueta="Probar de nuevo" onPress={() => void leerCarnet(foto)} />
          )}
          <Boton variante="secundario" bloque etiqueta="Sacar otra foto" onPress={() => { setFoto(null); setFase({ t: 'captura' }); }} />
          <Boton variante="ghost" bloque etiqueta="Volver" onPress={() => router.back()} />
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
            accessibilityLabel="Ver el carnet completo"
          >
            <Tarjeta relleno="ninguno">
              <Image source={{ uri: foto.uri }} contentFit="cover" transition={0} style={{ width: '100%', height: 180 }} />
            </Tarjeta>
          </Pressable>

          <Text style={{ fontFamily: voz.cuerpo, fontSize: typography.size.sm, lineHeight: typography.size.sm * 1.4, color: theme.text.secondary }}>
            {VOZ_REVISION.guia} {VOZ_REVISION.tipoOpcional}
          </Text>

          {activas.map((i) => (
            <View key={i.key} onLayout={(e) => posiciones.current.set(i.key, e.nativeEvent.layout.y)}>
              <FichaVacuna
                nombre={i.nombre}
                tipoVacuna={i.tipo_vacuna}
                fechaAplicada={i.fecha_aplicada}
                fechaProxima={i.fecha_proxima}
                veterinario={i.veterinario}
                lote={i.lote}
                rechazada={i.rechazada}
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
              {dudosas === 1 ? 'Hay 1 vacuna por completar' : `Hay ${dudosas} vacunas por completar`} antes de guardar.
            </Text>
          )}
          <Boton
            variante="primario"
            bloque
            etiqueta={n === 1 ? 'Guardar 1 vacuna' : `Guardar ${n} vacunas`}
            deshabilitado={n === 0 || dudosas > 0}
            cargando={guardando}
            onPress={() => void guardar()}
          />
        </ScrollView>
      )}

      {/* galería secundaria en Hoja (patrón SelectorAvatar) */}
      <Hoja visible={hojaGaleria} onCerrar={() => setHojaGaleria(false)} titulo="Otra forma de cargar el carnet" conCerrar>
        <View style={{ gap: spacing[3], padding: spacing[4] }}>
          <Boton variante="secundario" bloque etiqueta="Elegir de la galería" onPress={() => void capturar('galeria')} />
        </View>
      </Hoja>

      {/* Hoja de edición — Campo + CampoFecha (HojaScroll, L-132) */}
      <Hoja visible={editando !== null} onCerrar={() => setEditando(null)} titulo="Revisá esta vacuna" altura="completa" conCerrar>
        <HojaScroll contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
          <Campo label="Nombre de la vacuna" value={bNombre} onChangeText={setBNombre} />
          <Campo label="Tipo" value={bTipo} onChangeText={setBTipo} ayuda="Opcional. Ej: antirrábica, séxtuple, polivalente" />
          <CampoFecha
            label="Cuándo se aplicó"
            valor={bFecha}
            onChange={setBFecha}
            placeholder="Elegí la fecha"
            tituloHoja="Cuándo se aplicó"
            error={fechaFutura ? 'La fecha no puede ser futura.' : undefined}
          />
          <Boton
            variante="primario"
            bloque
            etiqueta="Guardar cambios"
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
          etiqueta={`Carnet de ${nombre}`}
        />
      )}
    </View>
  );
}
