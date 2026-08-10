/**
 * Cuenta · TU PERFIL — el perfil del NEGOCIO (S83-C30 ②). Reemplaza a la
 * pantalla vieja, que MURIÓ con esta (Ley 37): nació como ruta de
 * verificación `/perfil-v2`, pasó su gate con las cuatro firmas del
 * founder, y ahora es producción con datos reales.
 *
 * ═════ LAS CUATRO FIRMAS DEL FOUNDER EN DISPOSITIVO (S83-C13) ═════
 * ① LA BANDERA VA — emoji unicode desde `codigo_iso2`; su Android las
 *    dibuja. El defecto que reportó (no alineaba con el número) tenía
 *    causa de MÉTRICA y se curó en `SelectorPais`, no con un margen.
 * ② EL ESPEJO DEJA RASTRO — gate (a′) CERRADO: la fila compacta se pega
 *    al tope cuando el espejo se fue. Ya no se elige.
 * ③ AL ENTRAR SE ABRE LA PRIMERA INCOMPLETA — gate (d) CERRADO. Con la
 *    regla que ya rige: si TODO está completo, no se abre NINGUNA (la
 *    puerta no inventa trabajo que no hay — Ley 23).
 * ④ EL RÓTULO DE LO PERSONAL — gate (c) cerrado con "Tu cuenta" y
 *    ENMENDADO en C18 por la firma del tercer verbo: "Tu cuenta" pasó a
 *    ser el nombre de la TAB, así que la celda repetía a su contenedor.
 *    Hoy dice "Nombre y acceso" — provisional hasta el seccionado de
 *    Cuenta (S84).
 * Los cuatro rótulos de gate MURIERON con sus controles (Ley 37): ya no
 * se decide nada acá, y una pantalla que pregunta lo ya contestado
 * miente sobre su propio estado.
 *
 * ⑤ EL FOCUS (D-598) LLEGA POR TOKEN: `Campo` resuelve su borde de foco
 *    de `theme.accent.*`. Cuando B publique el sexto slot, esta pantalla
 *    NO cambia una línea — por eso no hay un solo color de foco acá.
 *
 * ① LA RUTA: molde de la galería (registrada, sin botón de tab). Su
 *    entrada vive al pie de Cuenta — `/gallery` del prestador es
 *    alcanzable solo por URL, y eso es L-161 exacta.
 * ② CABLEADA (S83-C30): `obtenerMiPrestador` + `actualizarPerfilPrestador`
 *    + `resolverUrlLogoNegocio` + `SeccionSede` — los MISMOS wrappers que
 *    usaba la pantalla vieja. CERO motor nuevo: lo que cambió es la
 *    composición, no el contrato.
 *
 * LO PERSONAL SE FUE a `cuenta/identidad` ("Nombre y acceso"): son otras
 * dos columnas de OTRA tabla (`profiles`) con otra audiencia —nadie— y
 * su propia escritura. Una pantalla que guardaba en dos tablas con un
 * solo botón eran dos pantallas (censo C16).
 *
 * ⚠️ VOZ — DEUDA DECLARADA: los textos siguen LITERALES, fuera del riel
 * i18n. Era correcto siendo herramienta de sesión; ahora que es
 * producción, su copy DEBE entrar al lote de strings con su gate (es/en).
 * No lo hago en el mismo commit que el cableado a propósito: mezclar el
 * lote de voz con el de datos vuelve ilegible el diff de los dos.
 */

import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  CeldaNavegacion,
  ClipSesion,
  EvitaTeclado,
  Hoja,
  HojaScroll,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  Separador,
  Texto,
  capturarConCamara,
  capturarDeGaleria,
  capturarVideoDeGaleria,
  radius,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  actualizarNombreComercial,
  actualizarPerfilPrestador,
  agregarFotoGaleria,
  borrarFotoGaleria,
  listarFotosGaleria,
  marcarComoPortada,
  obtenerMiPosicionEnPrestador,
  obtenerMiPrestador,
  obtenerPaisesDelMundo,
  reordenarFotosGaleria,
  resolverUrlLogoNegocio,
  type FotoGaleria,
  type MiPrestador,
  type PaisDelMundo,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { PAIS_DEFAULT, bandera, paisDe as buscarPais } from '@/lib/paises';
import { usePedirEspacio } from '@/lib/pedir-espacio';
// ③ S83-C33 — el pipeline del logo YA EXISTÍA ENTERO (S76-B1/D-505). Lo
// que faltaba era el cable.
import { quitarLogoNegocio, subirLogoNegocio } from '@/lib/subir-logo';
import { borrarBytesFotoGaleria, resolverUrlFotoGaleria, subirFotoGaleria } from '@/lib/subir-galeria';
import { quitarClipVitrina, subirClipVitrina } from '@/lib/subir-clip-vitrina';
import { SeccionSede } from '@/components/seccion-sede';
import { leerSede } from '@/lib/sede';
import { ControlTelefono, EspejoNegocio, SeccionDesplegable } from '@/components/perfil-piezas';
import { EscribaHistoria } from '@/components/escriba-historia';
import { GateAjeno } from '@/components/gate-ajeno';
import { useBarraEstadoClara } from '@/components/techo-oficio';

/* ─────────────────────────────────────────────────────────────────────
   ② S83-C33 — LOS 23 PAÍSES SE ELIGEN. EC es el DEFAULT, no el único.

   Letra del founder: *"lo normal es Ecuador, pero puede haber casos como
   yo"* — un prestador que opera en Ecuador con una línea colombiana. El
   `activo` de antes convertía ese caso real en imposible, así que MURIÓ
   (Ley 37): no queda una bandera booleana sin consumidor, queda el
   DEFAULT en el `useState` y nada más.

   `formato` sale de `formato_telefono` de `cat_paises`, MEDIDO contra el
   proyecto vivo: **9 de 23 lo declaran, 14 no.** Los nueve validan de
   verdad; los catorce se eligen y lo DICEN — *"el que no lo tenga
   declarado, no valida (no inventes uno)"*. Inventar una regex por país
   sería exactamente el dato inventado de L-180: números plausibles,
   typecheck verde, el significado mal.

   ⚠️ COLOMBIA VALIDA — es el caso del founder, y no queda exento.
   ───────────────────────────────────────────────────────────────────── */
/* ☠️ S84-C33 — LOS 23 SE MUDARON a `lib/paises.ts`. La pantalla de
   documentos necesitaba la MISMA lista, y copiarla habría dejado dos
   fuentes que se desincronizan al primer país nuevo (L-175). Acá queda
   el import; el porqué de cada campo viaja con la lista. */

/** El techo del bucket de clips (A, S84): 10 MB. Vive acá porque el
 *  rebote tiene que decirse ANTES del round-trip. */
const MAX_CLIP_BYTES = 10 * 1024 * 1024;




type Seccion = 'portada' | 'contacto' | 'donde';

/** **E.164 ENTERO, con su '+'** — regla 28 del CONTRATO **ENMENDADA el
 *  2-ago-2026** (firma founder + arquitecto).
 *
 *  LO QUE MURIÓ ACÁ: `.replace(/^\+/, '')`. Esta línea le quitaba el '+'
 *  al número **justo antes de guardarlo**, y era la tercera pata de una
 *  regla que vivía en tres cuerpos a la vez (la letra del CONTRATO, dos
 *  CHECK en la DB, y esta función). Los otros dos ya cambiaron.
 *
 *  POR QUÉ SE DEROGÓ — **por incompleta, no por equivocada**: "E.164 sin
 *  '+'" funciona si el país vive en otro lado, y en `prestadores` esa
 *  columna nunca se construyó. El número quedaba sin saber de dónde era.
 *  Palabra del founder: *un WhatsApp de otro país es normal, no
 *  excepcional.*
 *
 *  La ironía que vale registrar: **esta pantalla ya validaba CON '+'**
 *  (los `formato` de PAISES son `^\+593\d{8,9}$`). Validaba una cosa y
 *  guardaba otra; lo único que faltaba era dejar de tirarlo.
 *
 *  Lo que SÍ sigue: espacios y guiones se limpian — son del display. */
function normalizarTelefono(v: string): string {
  return v.trim().replace(/[\s-]/g, '');
}

/** COMPONE el E.164 que se guarda: el prefijo del país elegido + lo que
 *  el usuario tipeó. **No es una vuelta de tuerca: es lo que la pantalla
 *  YA le promete al usuario** — `estadoTelefono` calcula este mismo
 *  `${pais.pre}${crudo}` y su voz dice literalmente *"se guarda +593…"*.
 *  Lo que faltaba era que el guardado hiciera lo que la voz decía.
 *
 *  Vacío devuelve vacío: el campo es OPCIONAL y un prefijo suelto no es
 *  un teléfono (guardar "+593" sería inventar un número que nadie dio). */
function componerE164(paises: PaisDelMundo[], valor: string, iso: string): string {
  const crudo = normalizarTelefono(valor);
  if (crudo.length === 0) return '';
  if (crudo.startsWith('+')) return crudo; // ya vino entero: no se toca
  const pais = buscarPais(paises, iso);
  /* S85-C2 (D-633): `prefijo` es NULLABLE en el catálogo — la copia local
     lo tenía requerido y por eso nunca hubo que pensarlo. Un país sin
     prefijo declarado no puede componer un E.164, así que se devuelve lo
     crudo en vez de concatenar `null`. */
  return pais?.prefijo == null ? crudo : `${pais.prefijo}${crudo}`;
}

/** PARTE un E.164 para pintar el selector — **es LECTURA, no columna**: el
 *  país no se persiste por separado, se deriva al mostrar.
 *
 *  ── S84-A9 (a′) — AHORA TAMBIÉN PARTE VALORES LEGADOS SIN '+' ────────
 *  **Firma del founder (2-ago-2026), con la distinción que la habilita:**
 *  *P21 prohíbe DERIVAR el país del `country_code`; no prohíbe OFRECERLE
 *  al dueño lo que su propio número ya dice. Proponer no es deducir — la
 *  confirmación sigue siendo del dueño.*
 *
 *  **El caso que lo obligó, medido:** el WhatsApp de Satori valía
 *  `573208408790` (E.164 sin '+', regla 28 derogada). La versión anterior
 *  devolvía `null`, el campo quedaba con el indicativo ADENTRO y el
 *  selector caía en el default EC ⇒ elegir el país correcto (CO) componía
 *  **`+57573208408790`**, con el 57 DUPLICADO, y el Guardar rebotaba.
 *  **La salida "que el dueño confirme" se mordía la cola: no había forma
 *  de confirmar desde una pantalla que no dejaba guardar.**
 *
 *  `propuesto: true` marca que el país **se dedujo del número y no venía
 *  con su '+'** — la superficie puede señalarlo si quiere; el dato viaja
 *  para que la decisión de mostrarlo sea suya, no de esta función.
 *
 *  Prefijo MÁS LARGO primero (`+593` antes que `+59`/`+5`), el mismo
 *  criterio que `normalizar_telefono` ya usa en la DB (`ORDER BY
 *  length(...) DESC`) — se espeja, no se inventa.
 *
 *  ⚠️ EL BORDE QUE SOBREVIVE: **el prefijo NO determina el país** — `+1`
 *  es US, CA, PR y DO. Cuando el valor ya trae su '+', se elige el primero
 *  del catálogo y para pintar alcanza (el prefijo es correcto aunque el
 *  país no lo sea); nunca se escribe esa elección. Cuando NO lo trae —o
 *  sea cuando es una PROPUESTA— la vara sube: ver el guard adentro. */
function partirE164(
  paises: PaisDelMundo[],
  v: string,
): { iso: string; numero: string; propuesto: boolean } | null {
  const crudo = v.trim().replace(/[\s-]/g, '');
  if (crudo.length === 0) return null;
  const traeMas = crudo.startsWith('+');
  const digitos = traeMas ? crudo.slice(1) : crudo;

  /* S85-C2 (D-633): se descartan los que no declaran prefijo — sin él no
     hay nada contra qué partir. Antes era imposible: la copia local lo
     tenía requerido. */
  const candidatos = paises
    .filter((p): p is PaisDelMundo & { prefijo: string } => p.prefijo !== null)
    .filter((p) => digitos.startsWith(p.prefijo.slice(1)))
    .sort((a, b) => b.prefijo.length - a.prefijo.length);

  for (const pais of candidatos) {
    const numero = digitos.slice(pais.prefijo.length - 1);
    if (numero.length === 0) continue;
    /* ⚠️ EL GUARD QUE EVITA EL FALSO POSITIVO — y es la diferencia entre
       proponer y adivinar. Un número NACIONAL puede empezar por casualidad
       con los dígitos de un prefijo (`+1` es el caso obvio: cualquier
       número local que arranque en 1). Por eso, cuando el país DECLARA su
       formato, **la propuesta solo se ofrece si el E.164 resultante lo
       cumple**. Si no cumple, no se propone nada y el valor entra crudo —
       como antes de esta enmienda.
       Los 14 países sin `formato_telefono` declarado no se pueden
       verificar así; ahí la propuesta se ofrece igual y es MÁS DÉBIL. Se
       declara en vez de inventarles una regex (L-180: un valor sugerido
       derivado de un supuesto no declarado fabrica dato inventado). */
    if (!traeMas) {
      // ES UNA PROPUESTA ⇒ la vara es más alta: solo se propone un país que
      // DECLARA su formato y cuyo E.164 resultante lo CUMPLE.
      // Sin esto la función proponía cualquier cosa: medido, `1234567`
      // —un nacional que arranca en 1— salía propuesto como República
      // Dominicana, porque DO comparte el `+1` y NO declara formato, así
      // que no había nada que lo desmintiera. **Un país sin formato no se
      // propone**: inventarle una regex sería el dato inventado de L-180.
      if (pais.formato === null) continue;
      if (!new RegExp(pais.formato).test(`${pais.prefijo}${numero}`)) continue;
    }
    return { iso: pais.codigo, numero, propuesto: !traeMas };
  }
  return null;
}

/** ③ "INCOMPLETA" con la regla que ya rige: una sección está incompleta
 *  cuando le falta el dato que la hace servir para algo. `donde` no
 *  entra: su dirección y su radio existen. Si NINGUNA está incompleta
 *  devuelve null — y entonces no se abre ninguna. */
function primeraIncompleta(descripcion: string, contacto: string[]): Seccion | null {
  if (descripcion.trim().length === 0) return 'portada';
  /* ⑤ b5 S84-C3 — LOS CUATRO, y con el criterio corregido: antes exigía
     teléfono Y WhatsApp, así que un negocio con los cuatro campos menos
     el WhatsApp nacía con la sección abierta como si le faltara todo.
     La regla que ya rige es "incompleta = le falta el dato que la hace
     servir para algo", y para CONTACTO ese dato es **cualquiera de los
     cuatro**: con uno solo, una familia ya tiene por dónde. */
  if (contacto.length === 0) return 'contacto';
  return null;
}

export default function PerfilV2() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();
  useBarraEstadoClara();

  /* ⭐ S88-C · 'ajeno' (hallazgo del gate founder): la vitrina SE OFRECÍA
     al profesional y a recepción — el servidor rebota por TITULARIDAD
     (RLS + carpeta de storage, medido por A) y la pantalla prometía
     igual. Se resuelve ANTES de 'listo': cero parpadeo (el formulario no
     se monta hasta listo). La ley del lote de la vitrina: se esconde POR
     TITULARIDAD, no por rol — gatear por gestión dejaría pasar al admin
     y el servidor lo seguiría rebotando. */
  const [pantalla, setPantalla] = useState<'cargando' | 'listo' | 'error' | 'ajeno'>('cargando');
  /** S85-C2 (D-633): el catálogo VIVO. Llega con el mismo await que
   *  destraba la pantalla, así que para el primer render ya está. */
  const [paises, setPaises] = useState<PaisDelMundo[]>([]);
  const [prestador, setPrestador] = useState<MiPrestador | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [telNegocio, setTelNegocio] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [guardando, setGuardando] = useState(false);
  // ③ la Hoja del logo y su estado de subida
  const [hojaLogo, setHojaLogo] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  /* S84-C12 — LAS FOTOS. `fotos` viene YA ORDENADA del wrapper, así que
     el índice ES el orden y `[0]` ES la portada: no hay estado de
     portada aparte porque no hay dato de portada aparte. */
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [borradorAbierto, setBorradorAbierto] = useState(false);
  /* S84-C19 — EL CLIP. `clip_url` ya viaja en `MiPrestador`, así que el
     estado sale del MISMO fetch que todo lo demás: cero lectura nueva. */
  const [clipPath, setClipPath] = useState<string | null>(null);
  const [subiendoClip, setSubiendoClip] = useState(false);
  /* ⭐ S85-C4 — LA EDICIÓN DEL NOMBRE. Hoja y no campo inline: el nombre
     vive en el ESPEJO (el muro), y un input sobre el muro pelearía con la
     frontera D-535 —`Campo` resuelve su color de `theme.*` y el muro no
     está en la escala del tema—. La Hoja lo saca a superficie de tema,
     donde las piezas de la casa sí visten. */
  const [hojaNombre, setHojaNombre] = useState(false);
  const [nombreBorrador, setNombreBorrador] = useState('');
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [reboteNombre, setReboteNombre] = useState<string | null>(null);

  async function agregarClip() {
    if (subiendoClip) return;
    const cap = await capturarVideoDeGaleria();
    if (cap.tipo === 'cancelada') return;
    if (cap.tipo === 'permiso_denegado') {
      mostrar({ variante: 'error', texto: t('miCuenta.logoPermisoCamara') });
      return;
    }

    /* ① NO SE VALIDA DURACIÓN, y es regla de la mesa con su porqué:
       `duracionMs` puede ser null, y **null significa "no sé", no "dura
       poco"**. Rebotar por un dato ausente le negaría al prestador subir
       algo perfectamente válido por una limitación NUESTRA. Los ≤30 s se
       validan cuando exista el módulo (D-617).

       ② SÍ SE USA `bytes`, y se rebota ANTES de subir: es la diferencia
       entre un aviso y un error. Dejarlo fallar arriba le haría esperar
       la subida entera de un archivo que el bucket iba a rechazar.
       ⚠️ Y EL NULL SE HONRA EN LAS DOS DIRECCIONES: si no sé el tamaño,
       tampoco afirmo que entra — dejo subir y que el bucket decida, pero
       la voz del error LO DICE en vez de callarlo. Un rechazo del
       servidor sin explicación se lee como falla nuestra. */
    if (cap.video.bytes !== null && cap.video.bytes > MAX_CLIP_BYTES) {
      mostrar({ variante: 'error', texto: t('perfilNegocio.clipMuyGrande') });
      return;
    }
    const tamanoDesconocido = cap.video.bytes === null;

    setSubiendoClip(true);
    const r = await subirClipVitrina({ uri: cap.video.uri });
    setSubiendoClip(false);
    if (!r.ok) {
      mostrar({
        variante: 'error',
        texto:
          r.causa === 'formato_no_video'
            ? t('perfilNegocio.clipNoVideo')
            : r.causa === 'archivo_grande'
              ? // el rebote del bucket cuando NO pudimos medir antes: se
                // dice que no se pudo saber, en vez de un error mudo.
                tamanoDesconocido
                ? t('perfilNegocio.clipGrandeSinMedir')
                : t('perfilNegocio.clipMuyGrande')
              : t('miCuenta.logoErrorSubida'),
      });
      return;
    }
    setClipPath(r.path);
    mostrar({ variante: 'exito', texto: t('perfilNegocio.clipGuardado') });
  }

  async function quitarClip() {
    const r = await quitarClipVitrina();
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje ?? t('miCuenta.logoErrorSubida') });
      return;
    }
    setClipPath(null);
  }
  const [fotoTocada, setFotoTocada] = useState<number | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  async function recargarFotos(prestadorId: string) {
    const r = await listarFotosGaleria(prestadorId);
    if (r.ok) setFotos(r.data);
    // el fallo NO vacía la tira: una lista que se borra sola al fallar
    // una lectura le diría al prestador que perdió sus fotos.
  }

  async function agregarFoto() {
    if (subiendoFoto || prestador === null) return;
    /* ⚡ D-734 — LA FOTO DE LA VITRINA SE REDIMENSIONA. Esta llamada pedía
       `calidad` y **no pedía `redimensionarA`**, así que subía el original de la
       galería del teléfono: mediana medida **474 kB** y una de **5,9 MB**, en la
       pantalla más pública del producto.
       ── POR QUÉ 1600 Y NO LOS 800 DEL AVATAR ──────────────────────────────
       Porque acá la imagen se pinta **a sangre**: `FichaPrestador` usa
       `RELACION_PORTADA = 4/3` con el ancho del contenedor, o sea ~1290 px
       reales en un teléfono de 430 pt a DPR 3. Con 800 la portada quedaría
       blanda — *una foto liviana que se ve mal no es una cura, es una regresión
       con mejor número*. 1600 no es un número nuevo: es el que la casa ya usa
       para el carnet y los documentos, que también tienen que aguantar
       pantalla completa. La `calidad: 0.9` se conserva: es una vitrina. */
    const cap = await capturarDeGaleria({ calidad: 0.9, redimensionarA: 1600 });
    if (cap.tipo === 'cancelada') return;
    if (cap.tipo === 'permiso_denegado') {
      mostrar({ variante: 'error', texto: t('miCuenta.logoPermisoCamara') });
      return;
    }
    setSubiendoFoto(true);
    const sub = await subirFotoGaleria({ uri: cap.foto.uri });
    if (!sub.ok) {
      setSubiendoFoto(false);
      mostrar({
        variante: 'error',
        texto:
          sub.causa === 'red'
            ? t('miCuenta.logoErrorRed')
            : sub.causa === 'archivo_grande'
              ? t('perfilNegocio.fotoMuyGrande')
              : t('miCuenta.logoErrorSubida'),
      });
      return;
    }
    // PASO 2: la fila. Si falla, los bytes quedan huérfanos y se dice —
    // jamás se pinta una foto que la tabla no tiene.
    const fila = await agregarFotoGaleria(prestador.id, sub.path);
    setSubiendoFoto(false);
    if (!fila.ok) {
      mostrar({ variante: 'error', texto: fila.mensaje });
      return;
    }
    await recargarFotos(prestador.id);
  }

  async function accionSobreFoto(accion: 'portada' | 'adelante' | 'atras' | 'borrar') {
    if (fotoTocada === null || prestador === null) return;
    const foto = fotos[fotoTocada];
    const i = fotoTocada;
    setFotoTocada(null);
    if (foto === undefined) return;

    if (accion === 'portada') {
      const r = await marcarComoPortada(prestador.id, foto.id);
      if (!r.ok) mostrar({ variante: 'error', texto: r.mensaje });
    } else if (accion === 'adelante' || accion === 'atras') {
      /* MOVER, EN LAS DOS DIRECCIONES (S84-C13 ③).
         El argumento contra el ARRASTRE sigue en pie y no se reabre: el
         drag dentro de un ScrollView horizontal pelea con el gesto del
         propio scroll, y resolverlo bien es una pieza de gestos.
         Pero UN SOLO SENTIDO estaba mal, y el founder tenía razón:
         para retroceder una posición había que dar la vuelta entera —
         nueve toques para deshacer uno. Con las dos direcciones, mover
         cuesta lo mismo en los dos sentidos y deshacer es un toque.
         EN LOS EXTREMOS NO SE OFRECE LA IMPOSIBLE (Ley 23, ver la
         Hoja): la primera no va atrás, la última no va adelante. */
      const j = accion === 'atras' ? i - 1 : i + 1;
      const orden = fotos.map((f) => f.id);
      const tmp = orden[j] as string;
      orden[j] = orden[i] as string;
      orden[i] = tmp;
      const r = await reordenarFotosGaleria(prestador.id, orden);
      if (!r.ok) mostrar({ variante: 'error', texto: r.mensaje });
    } else {
      const r = await borrarFotoGaleria(prestador.id, foto.id);
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      // fila primero, bytes después (el orden lo fijó A y su porqué está
      // en el lib): un huérfano es feo e invisible; una fila sin archivo
      // se VE, porque la vitrina intenta pintarla.
      if (r.data.path !== null) await borrarBytesFotoGaleria(r.data.path);
    }
    await recargarFotos(prestador.id);
  }

  /* ⑥ S83-C33 — LA APERTURA SE CALCULA UNA VEZ, AL MONTAR.
     El comentario viejo decía "una vez, cuando llegan los datos" y era
     verdad respecto de CADA TECLA — pero no respecto de CADA FOCO: vivía
     dentro del `useFocusEffect`, que vuelve a correr al volver del
     selector de dirección o de la Hoja de país. Efecto: la sección que
     abriste a mano se cerraba sola y volvía la calculada.
     El `ref` es el candado: la apertura automática es un acto de
     BIENVENIDA (pasa una vez, al llegar), no una regla que se reimponga
     cada vez que la pantalla recupera el foco. Después de eso, quien
     manda es el dedo. */
  const [abierta, setAbierta] = useState<Seccion | null>(null);
  /* ⑤ S84-C34 — el scroll que trae a la vista las opciones de Places. */
  const espacio = usePedirEspacio();
  const yaAbrio = useRef(false);

  /* ── EL CABLEADO (S83-C30 ②): los cuatro wrappers que ya existían y ya
     se usaban en la pantalla vieja. Cero motor nuevo. ── */
  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        /* ── S85-C2 · D-633 — LA LISTA DE PAÍSES VIAJA ACÁ, y la elección
           de DÓNDE es la decisión entera del cableado.

           El pedido de A ofrecía tres salidas para el problema de que
           `partirE164` corre en render y la lista es async: (a) mostrar el
           número crudo mientras llega · (b) un Esqueleto en la fila del
           teléfono · (c) dejar la copia local como fallback.

           **Ninguna de las tres hace falta, y la razón es de esta pantalla
           en particular:** el formulario no se monta hasta
           `pantalla === 'listo'`. Cargando el catálogo en ESTE mismo await
           —antes del `setPantalla('listo')` de abajo— la lista **ya está
           cuando el primer render ocurre**. Cero destello, cero esqueleto
           nuevo, y la copia local muere entera (que es lo que (c) no
           lograba: su costo escrito era que la copia sobrevive y vuelve a
           ser la que nadie compara).

           ⚠️ Y EL FALLO DEL CATÁLOGO **SÍ TUMBA LA PANTALLA**, a
           propósito: sin países no se puede componer un E.164 ni nombrar
           un prefijo, así que el formulario de contacto guardaría mal o
           no guardaría. Es Ley 13 — antes de dibujar un teléfono que no
           sabe de dónde es, se dice que no se pudo cargar. */
        const [r, rPaises] = await Promise.all([obtenerMiPrestador(), obtenerPaisesDelMundo()]);
        if (!vigente) return;
        if (!r.ok || !rPaises.ok) {
          // Ley 13: el fallo dice fallo, jamás se disfraza de vacío.
          setPantalla('error');
          return;
        }
        /* ⭐ S88-C · EL GATE DE TITULARIDAD, mismo eje que el servidor.
           ⏪ (D-664, mismo día): acá vivió la danza S80-B3 de dos RPCs
           (titularId === miFila, con su coherencia a mano) — reemplazada
           por el lector del servidor: la titularidad es un HECHO de
           `prestadores.user_id`, dicho en UN viaje. El fallo NO abre y NO
           fabrica 'ajeno': cae en 'error', que reintenta (Ley 23). */
        const pos = await obtenerMiPosicionEnPrestador(r.data.id);
        if (!vigente) return;
        if (!pos.ok) {
          setPantalla('error');
          return;
        }
        if (!pos.data.esTitular) {
          setPantalla('ajeno');
          return;
        }
        setPaises(rPaises.data);
        const p = r.data;
        const desc = p.descripcion ?? '';
        const tel = p.telefono ?? '';
        // whatsapp es NOT NULL en DB (legacy): su "sin dato" es '' — relevado.
        const wa = p.whatsapp ?? '';
        setPrestador(p);
        setLogoPath(p.foto_url);
        setClipPath(p.clip_url);
        setDescripcion(desc);
        /* S84-A1bis — LA PARTICIÓN AL CARGAR, que es lectura y no columna.
           El campo muestra el número SIN prefijo (el indicativo ya vive a
           su izquierda, firma de C): si volcáramos el E.164 entero, la
           línea diría "+593 +593987654321". Un valor legado sin '+' NO se
           parte y entra crudo — ponerle país sería inferirlo (P21). */
        const pTel = partirE164(rPaises.data, tel);
        const pWa = partirE164(rPaises.data, wa);
        setTelNegocio(pTel ? pTel.numero : tel);
        setWhatsapp(pWa ? pWa.numero : wa);
        if (pTel) setPaisTel(pTel.iso);
        if (pWa) setPaisWa(pWa.iso);
        setEmailContacto(p.email_contacto ?? '');
        setSitioWeb(p.sitio_web ?? '');
        // ⑥ solo la PRIMERA vez que llegan datos — los focos siguientes
        // refrescan el contenido y NO tocan lo que el dedo dejó abierto.
        if (!yaAbrio.current) {
          yaAbrio.current = true;
          const hay = [tel, wa, p.email_contacto ?? '', p.sitio_web ?? ''].filter((v) => v.trim().length > 0);
          setAbierta(primeraIncompleta(desc, hay));
        }
        void recargarFotos(p.id);
        setPantalla('listo');
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  /* ③ S83-C33 — EL LOGO GANA SU CABLE (defecto del founder: "no tiene
     dónde guardarse"). El handler era `() => undefined` — compilaba,
     renderizaba y no hacía nada. Porté la composición y no porté el
     flujo: la clase exacta de defecto que ningún typecheck ve.

     Es el MISMO camino de la pantalla vieja (S76-B1), traído entero con
     su freno de mesa incluido, que es lo que NO se puede perder al
     copiar: **ALPHA PRESERVADO** — la GALERÍA no pasa por el resize,
     porque el flatten JPEG de un PNG transparente compone sobre NEGRO en
     Android (Bitmap.compress sobre ARGB) y produce el rectángulo
     caricaturesco que DIRECCION_ARTE §7 rechaza. `calidad 1` = el picker
     no re-encodea y `subir-logo` detecta el formato por los BYTES. La
     CÁMARA sí redimensiona: una foto es JPEG de nacimiento, no hay alpha
     que perder.

     Y EL LOGO NO ESPERA AL GUARDAR: subir la imagen ES el acto. */
  async function capturarLogo() {
    setHojaLogo(false);
    /* ⚡ D-734 · EL LOGO ES LA EXCEPCIÓN, Y NO ES UN OLVIDO — SE MIDIÓ.
       Sus hermanas de esta tanda (la galería, la evidencia) ganaron
       `redimensionarA`. Acá **no se puede usar la pieza compartida**: el resize
       de `capturaFoto` re-codifica a **JPEG** (`SaveFormat.JPEG`), y el logo es
       **PNG-only por orden del founder** — *«poder quitar el fondo»*, o sea la
       transparencia es el punto, y `subir-logo.ts` rechaza cualquier otra cosa
       con `formato_no_png`. Aplicar el resize acá haría dos daños de una:
       mataría el alpha y **la subida rebotaría su propio archivo**.
       ⇒ redimensionar un PNG con alpha necesita otra herramienta, no otra
       llamada. Queda censado como **D-740**, con su número medido: el bucket
       `avatars` tiene mediana 76 kB y mayor 327 kB — o sea que **hoy no
       aprieta**, y por eso es deuda y no urgencia. */
    const r = await capturarDeGaleria({ calidad: 1 });
    if (r.tipo === 'cancelada') return;
    if (r.tipo === 'permiso_denegado') {
      mostrar({ variante: 'error', texto: t('miCuenta.logoPermisoCamara') });
      return;
    }
    setSubiendoLogo(true);
    const sub = await subirLogoNegocio({ uri: r.foto.uri });
    setSubiendoLogo(false);
    if (!sub.ok) {
      // El error dice su CAUSA (17.4): "revisá tu conexión" queda
      // RESERVADO a la red, jamás como comodín.
      mostrar({
        variante: 'error',
        texto:
          sub.causa === 'red'
            ? t('miCuenta.logoErrorRed')
            : sub.causa === 'archivo_grande'
              ? t('miCuenta.logoErrorGrande')
              : // ④ el rebote de formato DIRIGE y dice el porqué (17.4):
                // sin el motivo, "elegí otro" se lee como capricho.
                sub.causa === 'formato_no_png'
                ? t('perfilNegocio.logoNoPng')
                : t('miCuenta.logoErrorSubida'),
      });
      return;
    }
    setLogoPath(sub.path);
    mostrar({ variante: 'exito', texto: t('miCuenta.logoGuardado') });
  }

  async function quitarLogo() {
    setHojaLogo(false);
    setSubiendoLogo(true);
    const r = await quitarLogoNegocio();
    setSubiendoLogo(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: t('miCuenta.logoErrorSubida') });
      return;
    }
    setLogoPath(null);
    mostrar({ variante: 'exito', texto: t('miCuenta.logoQuitado') });
  }

  async function guardar(opciones?: { volver?: boolean }): Promise<boolean> {
    const volver = opciones?.volver ?? true;
    if (guardando) return false;
    /* ④ Ley 23 — la puerta no ofrece lo que va a rechazar: si un dato está
       mal formado, el Guardar lo DICE y abre la sección donde vive, en vez
       de mandar basura al motor. Los tres se miran juntos para que el
       usuario no descubra el segundo error después de arreglar el primero. */
    const malos = [
      estadoTelefono(telNegocio, paisTel)?.ok === false ? t('perfilNegocio.campoTelefono') : null,
      estadoTelefono(whatsapp, paisWa)?.ok === false ? t('perfilNegocio.campoWhatsapp') : null,
      estadoEmail(emailContacto)?.ok === false ? t('perfilNegocio.campoCorreo') : null,
      estadoSitio(sitioWeb)?.ok === false ? t('perfilNegocio.campoSitio') : null,
    ].filter((x): x is string => x !== null);
    if (malos.length > 0) {
      setAbierta('contacto');
      mostrar({ texto: t('perfilNegocio.revisaAntesDeGuardar', { campos: malos.join(t('perfilNegocio.unionY')) }), variante: 'error' });
      return false;
    }
    setGuardando(true);
    const r = await actualizarPerfilPrestador({
      descripcion,
      // S84-A1bis: se guarda el E.164 ENTERO — el prefijo del país elegido
      // + lo tipeado. Es EXACTAMENTE lo que la voz de `estadoTelefono` le
      // viene prometiendo al usuario ("se guarda +593…").
      telefono: componerE164(paises, telNegocio, paisTel),
      whatsapp: componerE164(paises, whatsapp, paisWa),
      email_contacto: emailContacto.trim(),
      // ④ la normalización vive en el GUARDADO, no en el tipeo: mientras
      // escribís, el campo dice lo que va a guardar (`ayuda`) sin
      // reescribirte el texto bajo el cursor.
      sitio_web: normalizarSitio(sitioWeb),
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return false;
    }
    mostrar({ texto: t('miCuenta.perfilGuardado'), variante: 'exito' });
    // el Guardar de la pantalla vuelve; el de la Hoja del borrador NO —
    // su destino es el espejo, y volver primero seria un rebote visible.
    if (volver) router.back();
    return true;
  }
  /**
   * ⭐ S85-C4 — UN NOMBRE, DOS CASAS, UNA TRANSACCIÓN.
   *
   * Llama a `actualizarNombreComercial`, que adentro escribe
   * `prestadores` **Y** `cuentas_comerciales` en una sola transacción del
   * server. **La atomicidad es el punto y no un detalle:** dos UPDATE
   * desde acá pueden fallar por separado, y el resultado —la portada con
   * el nombre nuevo y el documento fiscal con el viejo— *no da error, no
   * rompe nada y nadie lo descubre*, porque cada pantalla lee su propia
   * columna y las dos se ven correctas.
   *
   * ⚠️ **Y POR ESO NO EXISTE NI VA A EXISTIR UN GEMELO DEL LADO FISCAL**
   * — la advertencia está escrita en el propio wrapper y la repito acá
   * porque es donde alguien tendría la tentación: si algún día aparece un
   * "editar nombre" en Datos comerciales, vuelve a existir el camino que
   * escribe UNA sola columna, y la divergencia que esta pieza vuelve
   * inexpresable pasa a ser expresable **por la puerta de al lado**. En
   * fiscal el nombre se EXHIBE; se edita acá.
   *
   * Los rebotes viajan TIPADOS (los seis códigos del wrapper) y se
   * muestran EN LA HOJA, no en un toast: son de permiso —quién puede
   * cambiar el nombre— y hay que poder releerlos.
   */
  async function guardarNombre() {
    if (guardandoNombre) return;
    setReboteNombre(null);
    setGuardandoNombre(true);
    const r = await actualizarNombreComercial(nombreBorrador);
    setGuardandoNombre(false);
    if (!r.ok) {
      setReboteNombre(r.mensaje);
      return;
    }
    /* El nombre que se pinta sale del SERVER, no del input: el wrapper
       trae `data.nombre` (trimeado adentro de la RPC) y su guard de shape
       ya rechazó cualquier otra forma. Hacer eco del texto tipeado
       pintaría como guardado algo que no sabemos que se guardó. */
    setPrestador((p) => (p === null ? p : { ...p, nombre_comercial: r.data.nombre }));
    setHojaNombre(false);
    mostrar({ variante: 'exito', texto: t('perfilNegocio.nombreGuardado') });
  }

  const [paisDe, setPaisDe] = useState<'telNegocio' | 'whatsapp' | null>(null);
  const [paisTel, setPaisTel] = useState(PAIS_DEFAULT);
  const [paisWa, setPaisWa] = useState(PAIS_DEFAULT);

  /* ── ② la validación EN VIVO, contra el formato del catálogo ──
     Los 14 países sin `formato_telefono` NO validan y lo dicen: la voz
     es honesta sobre POR QUÉ no valida, en vez de callarse (que se leería
     como "está bien") o de inventar una regla que el catálogo no tiene. */
  function estadoTelefono(valor: string, iso: string): { ok: boolean; voz: string } | null {
    const crudo = valor.replace(/[\s-]/g, '');
    if (crudo.length === 0) return null;
    const pais = buscarPais(paises, iso);
    // S85-C2: sin país o sin prefijo declarado no hay E.164 que prometer.
    if (pais?.prefijo == null) return null;
    const e164 = `${pais.prefijo}${crudo}`;
    if (pais.formato === null) {
      return { ok: true, voz: t('perfilNegocio.telSinFormato', { e164, pais: pais.nombre }) };
    }
    const ok = new RegExp(pais.formato).test(e164);
    if (ok) return { ok, voz: t('perfilNegocio.telSeGuarda', { e164 }) };
    // El error DIRIGE (17.4): dice cuántos dígitos van y cuántos faltan,
    // derivado del formato REAL del país — jamás del de Ecuador.
    const rango = /\\d\{(\d+)(?:,(\d+))?\}/.exec(pais.formato);
    const min = rango?.[1];
    const max = rango?.[2];
    const cuantos = min === undefined ? t('perfilNegocio.telDigitosSinDato') : max === undefined ? t('perfilNegocio.telDigitos', { min }) : t('perfilNegocio.telDigitosRango', { min, max });
    return { ok, voz: t('perfilNegocio.telLargoMal', { pais: pais.nombre, cuantos, pre: pais.prefijo, van: crudo.length }) };
  }

  /* ── ④ CORREO Y SITIO WEB — validación real (defecto del founder).
     El correo: forma mínima honesta (algo@algo.algo, sin espacios). No se
     valida "que exista" — eso solo lo prueba un envío, y prometerlo sería
     mentir. El sitio: se ACEPTA como lo escribe una persona —`satori.com`,
     `www.satori.com`— y la NORMALIZACIÓN pone el `https://` al guardar
     (adenda del founder). Pedirle el esquema al usuario es pedirle que
     hable como la máquina (17.2). */
  function estadoEmail(v: string): { ok: boolean; voz: string } | null {
    /* ⚠️ La local se llama `crudo` y NO `t`: el hook de traducción TAMBIÉN
       se llama `t`, y una local con ese nombre lo TAPA dentro de la
       función. Mientras el copy era literal el choque era invisible;
       migrarlo al riel lo destapó — y el typecheck lo cazó, que es
       exactamente para lo que sirve. */
    const crudo = v.trim();
    if (crudo.length === 0) return null;
    const ok = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(crudo);
    return { ok, voz: ok ? t('perfilNegocio.correoOk') : t('perfilNegocio.correoMal') };
  }
  /** Normaliza el sitio: sin esquema le pone `https://`. `www.` es
   *  legal con o sin él — no lo agregamos ni lo sacamos. */
  function normalizarSitio(v: string): string {
    const t = v.trim();
    if (t.length === 0) return '';
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  }
  function estadoSitio(v: string): { ok: boolean; voz: string } | null {
    const crudo = v.trim();
    if (crudo.length === 0) return null;
    const sinEsquema = crudo.replace(/^https?:\/\//i, '');
    // dominio con AL MENOS un punto y un TLD de 2+; el resto de la ruta
    // (que puede o no venir) no se valida: no es asunto nuestro.
    const ok = /^[^\s/?#.]+(\.[^\s/?#.]+)*\.[a-z]{2,}(\/\S*)?$/i.test(sinEsquema);
    return {
      ok,
      voz: ok ? t('perfilNegocio.sitioSeGuarda', { url: normalizarSitio(crudo) }) : t('perfilNegocio.sitioMal'),
    };
  }
  const vEmail = estadoEmail(emailContacto);
  const vSitio = estadoSitio(sitioWeb);
  const vTel = estadoTelefono(telNegocio, paisTel);
  const vWa = estadoTelefono(whatsapp, paisWa);

  /* ── ④ S84-C3 — EL RESUMEN Y EL VACÍO CUENTAN LOS CUATRO CAMPOS ──
     Antes miraban DOS (teléfono y WhatsApp) y hablaban de cuatro: con
     correo y sitio cargados la sección igual decía "Sin contacto", y la
     línea del vacío llegaba a contradecirse sola —"no tiene cómo
     escribirte… tu WhatsApp sí está"—, que es decir que no hay camino y
     nombrar el camino en la misma frase.

     EL RESUMEN NOMBRA LO QUE HAY, en orden fijo, y no cuenta ni enumera
     lo que falta: "Teléfono · Correo" dice más que "2 de 4" y mucho más
     que "faltan WhatsApp y sitio" — el resumen de una sección cerrada
     describe el ESTADO, no la tarea (§15b.3). El orden es fijo a
     propósito: si se ordenara por lo cargado, la misma sección cambiaría
     de forma al completarse y el ojo perdería su ancla. */
  const cargados = [
    { hay: telNegocio.trim().length > 0, voz: t('perfilNegocio.contactoTelefono') },
    { hay: whatsapp.trim().length > 0, voz: t('perfilNegocio.contactoWhatsapp') },
    { hay: emailContacto.trim().length > 0, voz: t('perfilNegocio.contactoCorreo') },
    { hay: sitioWeb.trim().length > 0, voz: t('perfilNegocio.contactoSitio') },
  ];
  const nombresCargados = cargados.filter((c) => c.hay).map((c) => c.voz);
  const resumenContacto =
    nombresCargados.length === 0 ? t('perfilNegocio.contactoNinguno') : nombresCargados.join(' · ');
  const resumenPortada =
    descripcion.trim().length > 0 ? t('perfilNegocio.portadaCon') : t('perfilNegocio.portadaSin');

  /* ── el vacío honesto: UNA línea, y solo cuando NO hay NINGUNO ──
     ⚠️ EL COPY NO PROMETE QUE LAS FAMILIAS YA LO VEN, y eso lo decidió
     la medición (D-601): `v_prestadores_publicos` expone 18 columnas y
     NINGUNA de las cuatro está entre ellas. Decir "así te encuentran"
     sería vender una vitrina que todavía no publica estos datos. La
     línea habla de lo que el dato ES —tu forma de contacto— y no de un
     efecto que hoy no ocurre. */
  const vacio = nombresCargados.length === 0 ? t('perfilNegocio.contactoVacio') : null;

  /* ── ① S84-C3 — LA VOZ DEL ESPEJO, con un FRENO declarado ──
     La orden pedía "tipo y ciudad desde MiPrestador". La ciudad entra;
     **el OFICIO no, y lo decide la fuente por encima de la directiva**:
     `prestadores.tipo` es el EJE MUERTO de D-487, cuya letra dice
     textual *"ninguna lógica nueva debe leerla"*. Pintarlo acá sería
     estrenar un lector nuevo sobre una columna que el canon ya condenó
     — y encima con riesgo real de mentir: sus dos valores vivos
     (`paseador` ×4, `clinica_veterinaria` ×3) NO se actualizan con los
     servicios que el negocio ofrece hoy, así que un paseador que agregó
     grooming seguiría anunciándose por su fila legacy.
     El oficio de verdad se compone de los SERVICIOS OFRECIDOS, que es
     otra lectura y otra decisión de producto (un negocio puede tener
     varios). **Hasta que tenga fuente viva, la mitad del oficio no se
     pinta** — que es exactamente la regla que la propia orden fijó para
     el dato faltante.
     ☠️ MUERTE: cuando exista el lector de oficios ofrecidos, esta voz
     pasa a `oficio · ciudad` sin tocar el espejo (ya acepta la línea
     compuesta). */
  const ciudad = (prestador?.ciudad ?? '').trim();
  const vozTipoCiudad = ciudad.length === 0 ? null : ciudad.charAt(0).toUpperCase() + ciudad.slice(1);

  /* ④ S84-C13 — EL BORRADOR, Y LA MEDICIÓN QUE CAMBIÓ EL DIAGNÓSTICO.
     La hipótesis era "lectura vieja en el espejo". **Medido: no lo es.**
     `como-te-ven` usa `useFocusEffect`, así que RELEE en cada foco, y
     las fotos PERSISTEN al subirlas (`agregarFotoGaleria` escribe en el
     acto). O sea: la portada ya se ve sin guardar nada, y no hay cache
     que invalidar.
     Lo que el founder no vio fue **su HISTORIA** —y los contactos—,
     porque ésos sí son borrador hasta el Guardar: viajan juntos en
     `actualizarPerfilPrestador`. El espejo estaba diciendo la verdad.
     ⇒ NO SE TOCA LA REGLA (el espejo muestra lo PERSISTIDO). Lo que
     faltaba es lo otro que la regla pide: **que ofrezca guardar**. Y se
     ofrece en la PUERTA, no adentro, porque el borrador vive acá — el
     espejo es otra pantalla y lee de la DB; enterarlo del borrador
     sería pasarle un estado que no le pertenece. */
  const hayBorrador =
    prestador !== null &&
    (descripcion !== (prestador.descripcion ?? '') ||
      emailContacto !== (prestador.email_contacto ?? '') ||
      sitioWeb !== (prestador.sitio_web ?? ''));

  const alternar = (s: Seccion) => setAbierta((a) => (a === s ? null : s));
  const prefijoDe = (iso: string) => buscarPais(paises, iso)?.prefijo ?? '';
  const isoDe = paisDe === 'whatsapp' ? paisWa : paisTel;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      {/* ① S83-C34 — ACÁ VIVÍA EL RASTRO, y murió en su gate. La lápida
          con el porqué vive en `perfil-piezas` (donde estaba la pieza).
          Lo que queda es el espejo de abajo, dentro del scroll: nunca
          parpadeó porque nunca dependió de cruzar un umbral. */}

      {/* ⭐ S88-C · el no-titular que llegó por deep link: la puerta HABLA
          (§3 de la lámina) — jamás rebote mudo ni vitrina que el servidor
          va a rechazar campo por campo. */}
      {pantalla === 'ajeno' && <GateAjeno />}

      {/* Ley 13: esqueleto ESTÁTICO al cargar · el fallo DICE que es fallo
          y ofrece reintentar · el contenido solo con datos confirmados. */}
      {pantalla === 'cargando' && (
        <View style={{ padding: spacing[5], paddingTop: insets.top + spacing[8] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={120} />
              <Esqueleto forma="linea" ancho="60%" />
              <Esqueleto forma="linea" ancho="80%" />
              <Esqueleto forma="linea" ancho="45%" />
            </View>
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('perfilNegocio.errorTitulo')}
            descripcion={t('perfilNegocio.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.reintentar')}
                onPress={() => setPantalla('cargando')}
              />
            }
          />
        </View>
      )}

      {pantalla === 'listo' && (
      <EvitaTeclado>
        <ScrollView
          ref={espacio.ref}
          onScroll={espacio.onScroll}
          scrollEventThrottle={espacio.scrollEventThrottle}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
          keyboardShouldPersistTaps="handled"
        >
          {/* EL ESPEJO — a sangre, arriba, y se va con el scroll.
              ① El `onScroll`/`scrollEventThrottle` murieron con el rastro:
              eran su único consumidor, y un listener de scroll que no
              alimenta nada es costo por turno de frame sin dueño. */}
          <EspejoNegocio
            nombre={prestador?.nombre_comercial ?? ''}
            logoUrl={resolverUrlLogoNegocio(logoPath)}
            tipo={vozTipoCiudad}
            vacio={vacio}
            etiquetaLogo={{ agregar: t('miCuenta.logoAgregar'), cambiar: t('miCuenta.logoCambiar') }}
            rotuloEspejo={t('perfilNegocio.espejoRotulo')}
            /* Anti doble-disparo: mientras una imagen viaja, el tap NO
               abre otra Hoja — y lo DICE en vez de no hacer nada, que se
               leería como que el toque no registró (Ley 13). */
            onEditarLogo={() => {
              if (subiendoLogo) {
                mostrar({ variante: 'neutro', texto: t('perfilNegocio.logoSubiendo') });
                return;
              }
              setHojaLogo(true);
            }}
            etiquetaNombre={t('perfilNegocio.nombreEditar')}
            onEditarNombre={() => {
              setNombreBorrador(prestador?.nombre_comercial ?? '');
              setReboteNombre(null);
              setHojaNombre(true);
            }}
          />

          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
            {/* ── LAS CUATRO SECCIONES, en el orden firmado ──
                ① S84-C29 — EL GRUPO SE SEPARA CON AIRE, NO CON LÍNEA.
                Al pasar cada sección a Tarjeta (ver `perfil-piezas`), los
                `Separador` que iban ENTRE secciones quedaron dibujando una
                frontera donde el borde de la tarjeta ya la dice: dos
                señales para el mismo trabajo. Es la pasada de remoción de
                la Ley 16 — y no es cosmética, porque una línea entre dos
                superficies elevadas se lee como que algo las une.
                Los `Separador` de ADENTRO de una sección no se tocan: ahí
                sí separan cosas distintas dentro de una misma caja. */}
            <View style={{ gap: spacing[3] }}>
            <SeccionDesplegable
              icono="negocio"
              titulo={t('perfilNegocio.espacioTitulo')}
              resumen={resumenPortada}
              abierta={abierta === 'portada'}
              onAlternar={() => alternar('portada')}
            >
              <Texto variante="apoyo">{t('perfilNegocio.portadaAyuda')}</Texto>
              <Campo
                label={t('perfilNegocio.descripcionLabel')}
                placeholder={t('perfilNegocio.descripcionEjemplo')}
                value={descripcion}
                onChangeText={setDescripcion}
                multilinea={3}
              />

              {/* EL ESCRIBA (§5) — junto a la historia, que es lo que
                  ayuda a escribir. LOS HECHOS son lo que el sistema YA
                  sabe, etiquetados: hoy solo van los DECLARADOS que esta
                  pantalla tiene en la mano (ciudad y radio). No se manda
                  nada como `verificado` porque nada de acá lo está — y
                  `verificado` la function lo CITA en vez de
                  parafrasearlo, así que etiquetarlo mal sería ponerle
                  comillas a algo que nadie verificó. */}
              {prestador !== null && (
                <EscribaHistoria
                  historiaActual={descripcion}
                  hechos={
                    /* ③ S84-C18 — EL RADIO SALIÓ, y el criterio es del
                       founder: es PARÁMETRO DE OPERACIÓN, no razón para
                       elegir. Una familia no decide por cuántos km
                       cubrís; decide por quién sos y dónde estás. Meterlo
                       en el material del escriba lo empujaba a escribir
                       logística en una historia.
                       QUEDA LA CIUDAD, y nada más de acá.
                       ⚠️ NADA VIAJA COMO `verificado` — la function lo
                       CITA en vez de parafrasearlo, así que etiquetar mal
                       sería ponerle comillas a algo que nadie verificó.
                       ☠️ Cuando A habilite credenciales verificadas,
                       entran ACÁ con su etiqueta propia. */
                    prestador.ciudad !== null && prestador.ciudad.length > 0
                      ? [{ etiqueta: 'declarado' as const, texto: `Atiende en ${prestador.ciudad}` }]
                      : []
                  }
                  onAceptar={setDescripcion}
                />
              )}
            {/* ═══ S84-C12 · LAS FOTOS ═══
                TIRA HORIZONTAL Y NO GRILLA: en un teléfono la grilla
                obliga a achicar cada foto hasta que ninguna se ve, y la
                vitrina es justamente el lugar donde la foto TIENE que
                verse. La tira deja una grande y sugiere que hay más con
                el corte del borde — el mismo recurso del rail del
                cliente.
                LA PORTADA VA PRIMERA Y MARCADA, y la marca no inventa un
                estado: **el orden ES la portada** (`[0]` de la lista
                ordenada). Dibuja el hecho que ya existe.
                ⚠️ LAS FLECHAS DE FLUVI NO VIAJAN: son idioma de mouse.
                Acá la foto se TOCA y ella ofrece lo que se le puede
                hacer — y "Hacer portada" NO aparece en la que ya lo es
                (Ley 23: la puerta no ofrece lo que va a rechazar). */}
            <View style={{ paddingVertical: spacing[4], gap: spacing[2] }}>
              <Texto variante="seccion">{t('perfilNegocio.fotosTitulo')}</Texto>
              <Texto variante="apoyo">{t('perfilNegocio.fotosAyuda')}</Texto>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing[3], paddingRight: spacing[5] }}
                style={{ marginHorizontal: -spacing[5], paddingHorizontal: spacing[5] }}
              >
                {fotos.map((f, i) => (
                  <Pressable
                    key={f.id}
                    onPress={() => setFotoTocada(i)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      i === 0 ? t('perfilNegocio.fotoPortadaA11y') : t('perfilNegocio.fotoA11y', { n: i + 1 })
                    }
                    style={{
                      width: 132,
                      height: 132,
                      borderRadius: radius.md,
                      backgroundColor: theme.bg.overlay,
                      overflow: 'hidden',
                    }}
                  >
                    <Image source={{ uri: resolverUrlFotoGaleria(f.url) }} style={{ width: '100%', height: '100%' }} />
                    {i === 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          left: spacing[2],
                          bottom: spacing[2],
                          paddingHorizontal: spacing[2],
                          paddingVertical: spacing[1],
                          borderRadius: radius.sm,
                          backgroundColor: theme.bg.base,
                        }}
                      >
                        <Texto variante="dato">{t('perfilNegocio.fotoPortadaMarca')}</Texto>
                      </View>
                    )}
                  </Pressable>
                ))}
                {/* el "agregar" vive AL FINAL DE LA TIRA y no como botón
                    aparte: agregar es la continuación de mirar, no otro
                    trabajo. */}
                <Pressable
                  onPress={() => void agregarFoto()}
                  accessibilityRole="button"
                  accessibilityLabel={t('perfilNegocio.fotoAgregar')}
                  style={{
                    width: 132,
                    height: 132,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderColor: theme.border.subtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[2],
                  }}
                >
                  <Texto variante="apoyo">
                    {subiendoFoto ? t('perfilNegocio.fotoSubiendo') : t('perfilNegocio.fotoAgregar')}
                  </Texto>
                </Pressable>
              </ScrollView>
            </View>

            <Separador />

            {/* EL CLIP — SU LUGAR, SIN SU MÓDULO.
                Tiene lugar PROPIO y no entra a la galería de fotos: es
                UNO y es de otra naturaleza (se reproduce, no se mira).
                Meterlo entre las fotos lo volvería "una más" y obligaría
                a explicar cuál de todas se reproduce.
                ⭐ S85-C21 — EL CLIP SE REPRODUCE ACÁ. **El tren llegó.**

                Lo que decía esta nota hasta hoy —*"no se dibuja un play
                que no reproduce (Ley 23); `expo-video` es NATIVO y exige
                build; cruza con D-617, viajan en el mismo tren"*— era
                CORRECTO cuando se escribió y quedó VIEJO sin que nada
                fallara: la build 1.0.3 existe, `expo-video ~57.0.1` viaja
                en las dos apps y en `packages/ui`, y `ClipSesion` ya
                tiene dos consumidores vivos en esta misma app.

                ☠️ SE REESCRIBE EN VEZ DE DEJARLA: **una abstención que
                sobrevive a su causa se lee como decisión vigente**, y hoy
                esta sesión lo pagó dos veces —una acá y otra en el taller,
                donde un comentario mío se volvió PREMISA de la cura de
                otra pista—. Un comentario viejo tiene más autoridad que el
                código, porque parece documentación.

                LO QUE COSTÓ NO SABERLO: el founder subió su clip, la app
                dijo que subió —y era verdad, `clip_url` guarda bien— y
                después no lo encontró en ningún lado. **No falló nada: la
                mitad que muestra nunca se había construido.**

                CERO PIEZA NUEVA: `ClipSesion` (34) pide SOLO `uri`, dibuja
                su propio reposo y monta el video al TAP. `duracionSegundos`
                y `descripcion` se OMITEN a propósito — son opcionales, y
                el clip de vitrina **no conoce su duración** (`subir-clip-
                vitrina.ts` declara que esta capa no puede medirla).
                Rellenarla sería el verosímil-falso de L-139.

                ✅ Y LA FICHA PÚBLICA YA LO MUESTRA (`como-te-ven`, C22):
                la nota que vivía acá decía que `FichaPrestador` pedía un
                `clipPoster` —una imagen fija que nada produce— y **duró
                un commit**: B lo curó (`e7e58df`, la prop es `clipUri`) y
                el espejo se cableó. *Se corrige en vez de dejarla: era
                verdad al escribirla y hoy nombra una prop que ya no
                existe.* Que haya envejecido tan rápido es el argumento,
                no la excepción. */}
            <View style={{ paddingVertical: spacing[4], gap: spacing[2] }}>
              <Texto variante="seccion">{t('perfilNegocio.clipTitulo')}</Texto>
              {/* ② S84-C30 — `Boton acento`, la variante que B construyó
                  (`da2f7e9`) sobre el pedido de C29.
                  EL FOUNDER TENÍA RAZÓN Y YO FIRMÉ MAL DOS VECES: en C34
                  puse subrayado (idioma web, fuera del diccionario) y la
                  corrección me llevó a `compacto`, que es peor por otro
                  motivo — **un botón con caja al lado de una foto compite
                  con la foto**, y la foto es lo que la vitrina viene a
                  mostrar. `acento` resuelve las dos: sin caja (no
                  compite) y en `accent.cta` con peso bold (se nota, que
                  es lo que 22c pedía y el subrayado no daba).
                  ⚠️ EL PESO ES LA JERARQUÍA, no el color: `acento` manda
                  y `ghost` recede — por eso "Quitar" NO se toca. Dos
                  comandos sin caja al lado sin diferencia de peso serían
                  dos primarios, y el destructivo ganaría la mitad de la
                  atención de la fila.
                  Cero prop de color: el slot lo resuelve por casa (verde
                  del oficio acá, oro en el cliente). R5 sigue intacta —
                  esta pantalla no nombra `accent.cta` en ningún lado.

                  S84-C19 — EL CONTROL, con la captura de B (`d943295`).
                  LA CADENA DE ARRIBA NO SE TOCÓ: se escribió en C17 para
                  servir antes y después del botón, y ésa era su prueba.
                  Que ahora exista el control y siga sirviendo es la
                  demostración de que el copy estaba bien escrito.
                  ☠️ ACÁ VIVÍA LA SEGUNDA COPIA DE LA ABSTENCIÓN, y es el
                  hallazgo que se lleva este commit: decía *"REPRODUCIR
                  SIGUE SIN EXISTIR (D-617) … el ▶ llega con la build — no
                  acá"* **tres líneas arriba del reproductor que C21 ya
                  había montado**.
                  C21 reescribió la justificación de la sección y NO VIO
                  que la misma decisión estaba argumentada DOS VECES en el
                  mismo bloque. ⇒ **una decisión escrita en dos lugares se
                  deroga en uno solo**, y la copia que sobrevive no parece
                  un resto: parece la regla. Es la #23 cobrando en el
                  archivo donde se la acababa de nombrar, el mismo día.
                  *Por eso la cura de un comentario viejo no es editarlo:
                  es buscar sus copias.* */}
              {clipPath === null ? (
                <View style={{ alignSelf: 'flex-start' }}>
                  <Boton
                    variante="acento"
                    etiqueta={t('perfilNegocio.clipAgregar')}
                    cargando={subiendoClip}
                    onPress={() => void agregarClip()}
                  />
                </View>
              ) : (
                <>
                  {/* EL CLIP MISMO, arriba de sus comandos: lo que el
                      prestador subió preside, y los botones lo sirven.
                      Al revés, "Cambiar/Quitar" pesarían más que la cosa
                      que cambian o quitan.
                      ☠️ Y MUERE `clipCargado` ("Ya tienes un clip"): era
                      la voz que SUPLÍA al clip cuando no se podía mostrar.
                      Con el clip en pantalla, decirlo además es contarle
                      lo que está viendo — Ley 37. */}
                  <ClipSesion uri={resolverUrlFotoGaleria(clipPath)} />
                  <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                    <Boton
                      variante="acento"
                      etiqueta={t('perfilNegocio.clipCambiar')}
                      cargando={subiendoClip}
                      onPress={() => void agregarClip()}
                    />
                    <Boton variante="ghost" etiqueta={t('perfilNegocio.clipQuitar')} onPress={() => void quitarClip()} />
                  </View>
                </>
              )}
              <Texto variante="apoyo">{t('perfilNegocio.clipVacio')}</Texto>
            </View>

            <Separador />

            </SeccionDesplegable>

            {/* ② S84-C6 — EL GLIFO LLEGÓ Y LA ASIMETRÍA TERMINÓ.
                La nota que vivía acá describía un hueco —"el registry no
                tiene contacto"— y ese hueco ya no existe: B lo construyó
                (`6db553e`) después de que se pidiera con su artefacto
                nombrado. **Se borra en vez de dejarla contando historia
                vieja**: un comentario que describe algo que ya no pasa
                miente con más autoridad que el código, porque parece
                documentación.
                ⚠️ EL DIBUJO LO FIRMA EL FOUNDER: B entregó DOS
                candidatos a 21px (`contacto` y `contactoOndas`) y la API
                es idéntica. Consumo el base; si firma el otro, es UNA
                palabra acá y nada más. */}
            <SeccionDesplegable
              icono="contacto"
              titulo={t('perfilNegocio.contactoTitulo')}
              resumen={resumenContacto}
              abierta={abierta === 'contacto'}
              onAlternar={() => alternar('contacto')}
            >
              {/* SIN GLIFO, decisión declarada: el registry no tiene
                  contacto/telefono/correo/sitio (medido). Antes que
                  prestar uno que miente, ninguno — el glifo se pide con
                  su gate por ícono a 21px (§6b). */}
              <Texto variante="apoyo">
                {t('perfilNegocio.contactoAyuda')}
              </Texto>

              {/* ③ S83-C34 — LA HIPÓTESIS DEL FOUNDER ERA LA CAUSA, y se
                  verifica leyendo la caja, no a ojo: la fila alinea por
                  `alignItems:'flex-end'` (por ABAJO), y `Campo` renderiza
                  su ayuda/error DENTRO de su propio alto. Con voz, el alto
                  del Campo crece hacia abajo ⇒ al alinear los pies, el pie
                  que manda es el del TEXTO DE AYUDA y la caja del input
                  sube — el selector queda calzado contra una línea que no
                  es la suya. Sin voz los dos coincidían, que es por qué el
                  defecto solo aparecía al escribir.

                  LA CURA ES DE PERTENENCIA, no de margen: la voz habla
                  del CONJUNTO indicativo+número (dice el E.164 completo,
                  que ninguna de las dos piezas tiene sola), así que vive
                  DEBAJO DEL CONJUNTO. La fila vuelve a tener dos hijos de
                  igual anatomía —label + caja— y sus pies coinciden solos.
                  Es la misma regla del glifo (Ley 12): lo que describe al
                  grupo no cuelga de uno de sus miembros. */}
              {/* ③ LOS DOS CONSUMIDORES de la pieza local: la anatomía
                  vive UNA vez y acá solo se dice qué dato lleva cada
                  una. El pie es del CONTROL y es uno por par. */}
              <ControlTelefono
                label={t('perfilNegocio.telefonoLabel')}
                placeholder={t('perfilNegocio.telefonoEjemplo')}
                valor={telNegocio}
                onCambio={setTelNegocio}
                bandera={bandera(paisTel)}
                prefijo={prefijoDe(paisTel)}
                onElegirPais={() => setPaisDe('telNegocio')}
                ayuda={vTel?.ok === true ? vTel.voz : undefined}
                error={vTel?.ok === false ? vTel.voz : undefined}
              />

              <ControlTelefono
                label={t('perfilNegocio.whatsappLabel')}
                placeholder={t('perfilNegocio.whatsappEjemplo')}
                valor={whatsapp}
                onCambio={setWhatsapp}
                bandera={bandera(paisWa)}
                prefijo={prefijoDe(paisWa)}
                onElegirPais={() => setPaisDe('whatsapp')}
                ayuda={vWa?.ok === true ? vWa.voz : undefined}
                error={vWa?.ok === false ? vWa.voz : undefined}
              />

              <Campo
                label={t('perfilNegocio.correoLabel')}
                placeholder={t('perfilNegocio.correoEjemplo')}
                value={emailContacto}
                onChangeText={setEmailContacto}
                keyboardType="email-address"
                autoCapitalize="none"
                ayuda={vEmail?.ok === true ? vEmail.voz : undefined}
                error={vEmail?.ok === false ? vEmail.voz : undefined}
              />
              <Campo
                label={t('perfilNegocio.sitioLabel')}
                placeholder={t('perfilNegocio.sitioEjemplo')}
                value={sitioWeb}
                onChangeText={setSitioWeb}
                autoCapitalize="none"
                keyboardType="url"
                ayuda={vSitio?.ok === true ? vSitio.voz : undefined}
                error={vSitio?.ok === false ? vSitio.voz : undefined}
              />
            </SeccionDesplegable>

            {/* S83-C30 ② — "Dónde atendés" deja de ser dato falso: consume
                `SeccionSede`, la MISMA pieza compartida que traía la
                pantalla vieja (Places + radio, con sus escrituras propias
                que NO cuelgan del Guardar de arriba — el gate (b) que el
                founder dejó abierto sigue abierto y ahora se ve con datos
                reales). El resumen de la cabecera sale del dato. */}
            <SeccionDesplegable
              icono="ubicacion"
              titulo={t('perfilNegocio.dondeTitulo')}
              resumen={
                prestador === null
                  ? ''
                  : [prestador.ciudad, prestador.radio_cobertura_km !== null ? `${prestador.radio_cobertura_km} km` : null]
                      .filter(Boolean)
                      .join(' · ') || 'Sin declarar'
              }
              abierta={abierta === 'donde'}
              onAlternar={() => alternar('donde')}
            >
              {/* ⑦ S84-C3 — LOS DOS GUARDAR, DICHOS. Medido el costo de
                  unificar y NO es barato (el número, en el reporte):
                  `SeccionSede` no tiene UNA escritura sino DOS
                  —`guardarSede({tipo:'direccion'})` con su botón y
                  `{tipo:'radio'}` que guarda SOLO al mover el control—,
                  y unificarlas exige subir cinco estados de un
                  componente de 246 líneas (incluidas las coordenadas que
                  trae Places) o ensanchar el wrapper, que es de A.
                  Peor: el Guardar de arriba pasaría a hacer DOS
                  escrituras que pueden fallar por separado — una
                  dirección guardada con un radio que no, sin forma de
                  decirlo en un solo aviso. **Entre dos guardados
                  honestos y uno que puede mentir a medias, gana la
                  honestidad** — y lo que se cura hoy es que el usuario
                  no tenga que descubrirlo: la sección DICE que se guarda
                  sola. Ley 17.4/23: la promesa se declara, no se
                  adivina. */}
              <Texto variante="apoyo">{t('perfilNegocio.sedeGuardaAparte')}</Texto>
              {/* ① S84-C24 — POR QUE FALTA EL MAPA, dicho DONDE SE CURA.
                  Medido: el negocio esta activo y en la vista, y el
                  lector si trae la zona — lo que falta es la SEDE. Sin
                  coordenadas, la zona derivada es null (3 de 6 de la
                  vista estan asi, y son exactamente los tres sin
                  coordenadas), y entonces la ficha no monta el mapa.
                  NO ES DEFECTO: la familia tampoco lo veria. Pero un
                  bloque que desaparece sin explicacion se lee como roto,
                  y en el ESPEJO duele mas porque el prestador va ahi
                  justamente a ver que le falta.
                  El aviso NO va en el espejo —seria una prop inventada en
                  la pieza de B— sino aca, pegado al control que lo
                  arregla: el mensaje vive junto a la cura, no junto al
                  hueco. */}
              {prestador !== null && prestador.lat === null && (
                <Texto variante="apoyo" color="danger">{t('perfilNegocio.zonaSinDireccion')}</Texto>
              )}
              {prestador !== null && (
                <SeccionSede sede={leerSede(prestador)} onPedirEspacio={espacio.pedirEspacio} />
              )}
            </SeccionDesplegable>
            </View>

            <Separador />

            {/* ═══ S84-C8bis · LA VITRINA, EN SU LUGAR ═══
                La orden original mandaba UI real sin cablear en ruta de
                verificación; la enmienda del founder (2-ago) reduce ese
                vehículo a dos casos —pieza indefinida, o riesgo sobre
                algo que ya funciona— y ninguno aplica acá. La vitrina se
                construye DONDE VA. Lo que sigue vigente es la otra
                cláusula: **no se cablea hasta la firma en dispositivo**.

                ⚠️ FRENO EJECUTADO — POR ESO NO ESTÁN LA PORTADA NI LAS
                FOTOS. La orden lo previó ("si algún bloque no se sostiene
                sin la tabla de A, dejá su hueco declarado y seguí"), y
                los dos bloques de imagen no se sostienen: no existe tabla
                de fotos del prestador (medido: cero tablas) y el pipeline
                sube UN archivo, sin orden ni borrado.
                Y acá el costo de ponerlos igual sería REAL, no teórico:
                la portada va A SANGRE ARRIBA, o sea que reemplazaría el
                muro del espejo que YA pasó su gate. Cambiar una
                composición firmada por una invitación vacía permanente
                deja la pantalla PEOR que hoy hasta que exista el motor —
                y "peor mientras tanto" no es un precio que se paga sin
                que el founder lo elija.
                ☠️ Los dos huecos mueren con la tabla de fotos (modelo
                medido en Fluvi: **portada = ORDEN MÍNIMO, sin columna de
                portada** — una sola verdad en vez de dos que se pueden
                contradecir). Es motor y es de A. ── */}

            {/* ═══ EL CONTRATO DEL ESPEJO — PEDIDO A B, escrito ACÁ ═══
                Vive en el código y no en el chat A PROPÓSITO: en S82 hubo
                cuatro bloqueos por acuerdos que vivían en la conversación
                y nadie podía citar. Esto es lo que voy a montar, y si B
                construye otra cosa el diff lo va a decir.

                LA PIEZA: `FichaPrestador` en packages/ui — la ficha
                pública, UNA, con DOS consumidores: el cliente (que hoy
                pinta prestadores con `Celda` genérica) y este espejo.
                Ése es el punto entero: **un solo dibujo, una sola
                verdad**. La copia a mano es lo que ya hizo mentir a esta
                pantalla dos veces.

                LOS DATOS QUE PUEDE PEDIR — medidos, no supuestos:
                · `v_prestadores_publicos` expone 18 columnas, y las que
                  sirven para una ficha son: `nombre_comercial`,
                  `descripcion`, `foto_url` (el LOGO), `ciudad`,
                  `sector`, `calificacion_promedio`, `total_resenas`,
                  `servicios` (jsonb).
                · `prestador_fotos` (A, S84): `id · prestador_id · url ·
                  orden · creado_en`. **La portada es MIN(orden)** — no
                  hay columna de portada y el UNIQUE hace inexpresable
                  "dos portadas".
                · ⚠️ NO expone NINGUNO de los cuatro datos de contacto
                  (D-601). La ficha no puede pintar teléfono, WhatsApp,
                  correo ni sitio: hoy no son públicos. Atado a D-173.
                · ⚠️ `tipo` NO se usa: eje muerto D-487.

                LO QUE ESTE ESPEJO NECESITA ADEMÁS, y es lo único que lo
                diferencia del consumidor cliente: poder rendirse con el
                prestador PROPIO —que puede estar incompleto— sin que la
                pieza se rompa. Un vacío en la ficha del cliente no
                existe (si no está completo, no se lista); acá SÍ, y es
                justamente lo que el prestador tiene que ver para saber
                qué le falta. La pieza necesita tolerar nulos y decirlos.

                CUANDO LLEGUE: el botón de abajo deja de avisar y hace
                `router.push` a una ruta a pantalla completa que monta la
                pieza. Es una línea acá y ~20 en la ruta nueva. ── */}

            {/* VER CÓMO TE VEN — la PUERTA, no un panel.
                ⚠️ NO PINTO UNA FICHA PROPIA, y el porqué está medido en
                esta misma pantalla: una copia a mano de la ficha es
                exactamente lo que hizo que el espejo mintiera DOS veces
                (el oficio inventado y la visibilidad clavada en "sí").
                La ficha la construye B como `FichaPrestador` en
                packages/ui y acá se MONTA — un solo dibujo, una sola
                verdad, y el día que cambie cambia en los dos lados.
                Hasta que su API llegue vive la puerta con su anticipo: el
                botón dice qué va a pasar y la nota dice que el directorio
                todavía se arma, que es la verdad medida (D-601 — la
                vista pública no expone los datos de contacto). */}
            <View style={{ paddingVertical: spacing[4], gap: spacing[2] }}>
              <Boton
                variante="secundario"
                bloque
                etiqueta={t('perfilNegocio.verComoTeVen')}
                /* S84-C11 — LA PUERTA YA ABRE. Era un aviso porque la
                   ficha no existía; B la construyó (`828b2ae`) y ahora
                   esto es lo que el contrato de arriba prometía: UNA
                   línea. La ruta monta la pieza y no dibuja nada. */
                onPress={() => (hayBorrador ? setBorradorAbierto(true) : router.push('/cuenta/como-te-ven'))}
              />
              <Texto variante="apoyo">{t('perfilNegocio.verComoTeVenNota')}</Texto>
            </View>

            <Separador />

            {/* ④ EL RÓTULO, ENMENDADO POR LA FIRMA DEL TERCER VERBO
                (S83-C18). El gate (c) había elegido "Tu cuenta" — y con
                CUENTA firmada como verbo, ése pasó a ser el nombre de la
                TAB: la celda repetía el rótulo de su propio contenedor y
                no decía nada de su contenido.
                **"Nombre y acceso"** dice lo que hay adentro, medido
                contra el contenido real (nombre · correo de ingreso ·
                cambiar clave · cambiar correo): uno es identidad y tres
                son acceso, así que el rótulo nombra los dos ejes y
                ninguno de más. Cumple 17.6 —el label rotula, el detalle
                demuestra— y deja de competir con la tab.
                ⚠️ PROVISIONAL DECLARADO: el definitivo se firma con el
                seccionado de Cuenta en S84, donde este bloque va a tener
                vecinos (plata, preferencias) y el rótulo se elige contra
                ellos, no solo. */}
            {/* ☠️ S85-C2 — LAS DOS CELDAS COMERCIALES MUERTAS, y con ellas
                las FILAS DESNUDAS #3 y #4 del censo (las únicas dos de esta
                pantalla que caían sobre el papel sin superficie).

                **La firma que las mata: Tu perfil es SOLO VITRINA.** Lo que
                queda acá es lo que la familia ve — Tu espacio · Cómo te
                contactan · Dónde atendés · Ver cómo te ven. La cuenta
                comercial y los datos fiscales no los ve nadie más que el
                equipo, así que no tienen nada que hacer en el espejo.

                ⚠️ Y ERAN DOS CELDAS AL MISMO DESTINO: `perfil:1318` y
                `perfil:1341` hacían las dos `router.push('/cuenta-comercial')`
                — el comentario de C34 decía "acá había DOS celdas y ahora
                hay una" y había dos. Su reemplazo es UNA puerta en la RAÍZ
                de Cuenta ("Tu negocio"), que es donde el prestador la
                busca: al lado de lo suyo, no adentro de su vitrina.

                LAS DOS PUERTAS GATEADAS NO SE TOCAN (medido en el censo y
                ratificado por el acta de C): `liquidaciones:210` se dibuja
                solo con `faltaCuentaActiva` y `sala-espera:213` solo antes
                de activarse. **Son contextos, no duplicados** — retirarlas
                dejaría a esos dos momentos sin camino. Ley 37 se aplica a
                lo que sale de la UI, y ellas no salen. ── */}

            <View style={{ paddingTop: spacing[5], gap: spacing[3] }}>
              <Boton
                etiqueta={t('miCuenta.guardar')}
                bloque
                cargando={guardando}
                onPress={() => void guardar()}
              />
            </View>
          </View>
        </ScrollView>
      </EvitaTeclado>
      )}

      {/* ⭐ S85-C4 — LA HOJA DEL NOMBRE DEL NEGOCIO.
          Un solo campo y un solo botón: es UN dato. El rebote vive ACÁ y
          no en un toast porque los seis códigos del wrapper son de
          PERMISO (titular · owner de la cuenta · cuenta inexistente) y
          esos hay que poder releerlos — un toast se va justo cuando el
          prestador está tratando de entender por qué no puede. */}
      <Hoja
        visible={hojaNombre}
        onCerrar={() => setHojaNombre(false)}
        titulo={t('perfilNegocio.nombreHojaTitulo')}
        altura="contenido"
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          {/* Dice DÓNDE se ve, que es lo que vuelve entendible el cambio:
              el mismo nombre viaja a la vitrina y al documento fiscal. */}
          <Texto variante="apoyo">{t('perfilNegocio.nombreAyuda')}</Texto>
          <Campo
            label={t('perfilNegocio.nombreLabel')}
            value={nombreBorrador}
            onChangeText={setNombreBorrador}
            autoCapitalize="words"
          />
          {reboteNombre !== null && (
            <Texto variante="apoyo" color="danger">
              {reboteNombre}
            </Texto>
          )}
          <Boton
            etiqueta={t('miCuenta.guardar')}
            bloque
            cargando={guardandoNombre}
            /* Ley 23: vacío no se ofrece. Las dos columnas son NOT NULL,
               así que vaciarlo no es una opción que exista — y el rebote
               del server lo diría igual, pero después del viaje. */
            deshabilitado={nombreBorrador.trim().length === 0}
            onPress={() => void guardarNombre()}
          />
        </View>
      </Hoja>

      {/* ── ② La Hoja del país: LAS 23 SE ELIGEN ──
          Murió el par tocable/apagado: ninguna fila está apagada, porque
          ninguna se va a rechazar. Lo que las distingue ahora es si
          VALIDAN, y eso se dice en el subtítulo de las que no — el dato
          honesto ocupa el lugar donde antes vivía el "todavía no". */}
      <Hoja visible={paisDe !== null} onCerrar={() => setPaisDe(null)} titulo={t('perfilNegocio.paisHojaTitulo')}>
        <View style={{ paddingBottom: spacing[2] }}>
          <Texto variante="apoyo">
            {t('perfilNegocio.paisHojaAyuda')}
          </Texto>
        </View>
        <HojaScroll>
          {paises.map((p, i) => (
            <View key={p.codigo}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={`${bandera(p.codigo)}  ${p.nombre}`}
                subtitulo={p.formato === null ? t('perfilNegocio.paisSinFormato') : undefined}
                metadataMono={p.prefijo ?? undefined}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  if (paisDe === 'whatsapp') setPaisWa(p.codigo);
                  else setPaisTel(p.codigo);
                  setPaisDe(null);
                }}
                fin={p.codigo === isoDe ? <Texto variante="dato">{t('perfilNegocio.paisElegido')}</Texto> : undefined}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* ═══ S84-C12 · LA HOJA DE LA FOTO ═══
          Reemplaza a las flechas de Fluvi, que son idioma de mouse. Las
          acciones son las mismas; lo que cambia es que en un teléfono se
          TOCA la cosa y ella ofrece lo que se le puede hacer.
          LO QUE NO SE OFRECE, POR EXTREMO (Ley 23 — la puerta no ofrece
          lo que va a rechazar): en la PRIMERA no van "hacer portada"
          —ya lo es— ni "atrás" —no hay atrás—; en la ÚLTIMA no va
          "adelante". Con una sola foto la Hoja queda con "Borrar" y
          nada más, que es exactamente lo único que se le puede hacer. */}
      <Hoja
        visible={fotoTocada !== null}
        onCerrar={() => setFotoTocada(null)}
        titulo={t('perfilNegocio.fotoHojaTitulo')}
        altura="contenido"
      >
        <View style={{ paddingBottom: insets.bottom }}>
          {fotoTocada !== null && fotoTocada !== 0 && (
            <>
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('perfilNegocio.fotoHacerPortada')}
                onPress={() => void accionSobreFoto('portada')}
              />
              <Separador />
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('perfilNegocio.fotoAtras')}
                onPress={() => void accionSobreFoto('atras')}
              />
              <Separador />
            </>
          )}
          {fotoTocada !== null && fotoTocada < fotos.length - 1 && (
            <>
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('perfilNegocio.fotoAdelante')}
                onPress={() => void accionSobreFoto('adelante')}
              />
              <Separador />
            </>
          )}
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('perfilNegocio.fotoBorrar')}
            onPress={() => void accionSobreFoto('borrar')}
          />
        </View>
      </Hoja>

      {/* ④ LA HOJA DEL BORRADOR — la puerta ofrece guardar.
          DOS CAMINOS Y NINGUNO MIENTE: "Guardar y ver" hace lo que dice,
          y "Ver lo guardado" también — nombra exactamente lo que el
          espejo va a mostrar, en vez de un "Ver igual" que dejaría al
          founder buscando un cambio que no está. */}
      <Hoja
        visible={borradorAbierto}
        onCerrar={() => setBorradorAbierto(false)}
        titulo={t('perfilNegocio.borradorTitulo')}
        altura="contenido"
      >
        <View style={{ paddingBottom: insets.bottom, gap: spacing[3] }}>
          <Texto variante="cuerpo">{t('perfilNegocio.borradorVoz')}</Texto>
          <Boton
            etiqueta={t('perfilNegocio.borradorGuardarYVer')}
            bloque
            cargando={guardando}
            onPress={() => {
              void (async () => {
                const ok = await guardar({ volver: false });
                if (!ok) return;
                setBorradorAbierto(false);
                router.push('/cuenta/como-te-ven');
              })();
            }}
          />
          <Boton
            variante="secundario"
            etiqueta={t('perfilNegocio.borradorVerIgual')}
            bloque
            onPress={() => {
              setBorradorAbierto(false);
              router.push('/cuenta/como-te-ven');
            }}
          />
        </View>
      </Hoja>

      {/* ③ LA HOJA DEL LOGO — cámara y galería PARES (patrón
          SelectorAvatar); "Quitar" SOLO cuando hay logo: la puerta no
          ofrece lo que no existe (Ley 23). */}
      <Hoja visible={hojaLogo} onCerrar={() => setHojaLogo(false)} titulo={t('perfilNegocio.logoHojaTitulo')} altura="contenido">
        <View style={{ paddingBottom: insets.bottom, gap: spacing[2] }}>
          {/* ④ ☠️ "TOMAR FOTO" MURIÓ, y es CONSECUENCIA del PNG, no una
              decisión aparte: la cámara entrega JPEG de nacimiento, así
              que esa puerta habría rebotado SIEMPRE. Ley 23 en su forma
              exacta — la puerta no ofrece lo que va a rechazar. Y el
              caso de uso tampoco existía: un logo es un archivo que te
              pasa tu diseñador, no algo que se fotografía. */}
          <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
            <Texto variante="apoyo">
              {t('perfilNegocio.logoHojaAyuda')}
            </Texto>
          </View>
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('miCuenta.logoGaleria')}
            onPress={() => void capturarLogo()}
          />
          {logoPath !== null && (
            <>
              <Separador />
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t('miCuenta.logoQuitar')}
                onPress={() => void quitarLogo()}
              />
            </>
          )}
        </View>
      </Hoja>
    </View>
  );
}
