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
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Celda,
  CeldaNavegacion,
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
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { actualizarPerfilPrestador, obtenerMiPrestador, resolverUrlLogoNegocio, type MiPrestador } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
// ③ S83-C33 — el pipeline del logo YA EXISTÍA ENTERO (S76-B1/D-505). Lo
// que faltaba era el cable.
import { quitarLogoNegocio, subirLogoNegocio } from '@/lib/subir-logo';
import { SeccionSede } from '@/components/seccion-sede';
import { leerSede } from '@/lib/sede';
import { ControlTelefono, EspejoNegocio, SeccionDesplegable } from '@/components/perfil-piezas';
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
type Pais = { iso: string; nombre: string; pre: string; formato?: string };
const PAISES: Pais[] = [
  { iso: 'AR', nombre: 'Argentina', pre: '+54', formato: '^\\+54\\d{10,11}$' },
  { iso: 'BO', nombre: 'Bolivia', pre: '+591' },
  { iso: 'BR', nombre: 'Brasil', pre: '+55' },
  { iso: 'CA', nombre: 'Canadá', pre: '+1', formato: '^\\+1\\d{10}$' },
  { iso: 'CL', nombre: 'Chile', pre: '+56', formato: '^\\+56\\d{9}$' },
  { iso: 'CO', nombre: 'Colombia', pre: '+57', formato: '^\\+57\\d{7,10}$' },
  { iso: 'CR', nombre: 'Costa Rica', pre: '+506' },
  { iso: 'CU', nombre: 'Cuba', pre: '+53' },
  { iso: 'DO', nombre: 'República Dominicana', pre: '+1' },
  { iso: 'EC', nombre: 'Ecuador', pre: '+593', formato: '^\\+593\\d{8,9}$' },
  { iso: 'ES', nombre: 'España', pre: '+34', formato: '^\\+34\\d{9}$' },
  { iso: 'GT', nombre: 'Guatemala', pre: '+502' },
  { iso: 'HN', nombre: 'Honduras', pre: '+504' },
  { iso: 'MX', nombre: 'México', pre: '+52', formato: '^\\+52\\d{10}$' },
  { iso: 'NI', nombre: 'Nicaragua', pre: '+505' },
  { iso: 'PA', nombre: 'Panamá', pre: '+507' },
  { iso: 'PE', nombre: 'Perú', pre: '+51', formato: '^\\+51\\d{7,9}$' },
  { iso: 'PR', nombre: 'Puerto Rico', pre: '+1' },
  { iso: 'PY', nombre: 'Paraguay', pre: '+595' },
  { iso: 'SV', nombre: 'El Salvador', pre: '+503' },
  { iso: 'US', nombre: 'Estados Unidos', pre: '+1', formato: '^\\+1\\d{10}$' },
  { iso: 'UY', nombre: 'Uruguay', pre: '+598' },
  { iso: 'VE', nombre: 'Venezuela', pre: '+58' },
];

/** El default del selector — el país donde opera la mayoría. NO es un
 *  techo: cualquiera de los 23 se elige (② arriba). */
const PAIS_DEFAULT = 'EC';

/** ① FIRMADA: la bandera sale del `codigo_iso2` — cada letra a su
 *  indicador regional. El toggle de C10 murió con el gate: el Android
 *  del founder las dibuja, y lo que quedaba por resolver era la
 *  alineación (curada en `SelectorPais`). */
const bandera = (iso: string): string =>
  String.fromCodePoint(...[...iso].map((c) => (c.codePointAt(0) ?? 0) + 127397));

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
function componerE164(valor: string, iso: string): string {
  const crudo = normalizarTelefono(valor);
  if (crudo.length === 0) return '';
  if (crudo.startsWith('+')) return crudo; // ya vino entero: no se toca
  const pais = PAISES.find((p) => p.iso === iso);
  return pais === undefined ? crudo : `${pais.pre}${crudo}`;
}

/** PARTE un E.164 guardado para pintar el selector — **es LECTURA, no
 *  columna**: el país no se persiste por separado, se deriva al mostrar.
 *  Prefijo MÁS LARGO primero (`+593` antes que `+59`/`+5`), el mismo
 *  criterio que `normalizar_telefono` ya usa en la DB (`ORDER BY
 *  length(...) DESC`) — se espeja, no se inventa.
 *
 *  ⚠️ DOS BORDES DECLARADOS:
 *  · **El prefijo NO determina el país**: `+1` es US, CA, PR y DO. Se
 *    elige el primero del catálogo, y para pintar alcanza (el prefijo es
 *    correcto aunque el país no lo sea). Nunca se escribe esa elección.
 *  · **Un valor SIN '+' no se parte** — devuelve null y el número entra
 *    crudo al campo. Es el legado de la regla 28: ponerle un país sería
 *    inferirlo, y eso es justo lo que P21 prohíbe. */
function partirE164(v: string): { iso: string; numero: string } | null {
  if (!v.startsWith('+')) return null;
  const candidatos = PAISES.filter((p) => v.startsWith(p.pre)).sort((a, b) => b.pre.length - a.pre.length);
  const pais = candidatos[0];
  return pais === undefined ? null : { iso: pais.iso, numero: v.slice(pais.pre.length) };
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

  const [pantalla, setPantalla] = useState<'cargando' | 'listo' | 'error'>('cargando');
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
  const yaAbrio = useRef(false);

  /* ── EL CABLEADO (S83-C30 ②): los cuatro wrappers que ya existían y ya
     se usaban en la pantalla vieja. Cero motor nuevo. ── */
  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerMiPrestador();
        if (!vigente) return;
        if (!r.ok) {
          // Ley 13: el fallo dice fallo, jamás se disfraza de vacío.
          setPantalla('error');
          return;
        }
        const p = r.data;
        const desc = p.descripcion ?? '';
        const tel = p.telefono ?? '';
        // whatsapp es NOT NULL en DB (legacy): su "sin dato" es '' — relevado.
        const wa = p.whatsapp ?? '';
        setPrestador(p);
        setLogoPath(p.foto_url);
        setDescripcion(desc);
        /* S84-A1bis — LA PARTICIÓN AL CARGAR, que es lectura y no columna.
           El campo muestra el número SIN prefijo (el indicativo ya vive a
           su izquierda, firma de C): si volcáramos el E.164 entero, la
           línea diría "+593 +593987654321". Un valor legado sin '+' NO se
           parte y entra crudo — ponerle país sería inferirlo (P21). */
        const pTel = partirE164(tel);
        const pWa = partirE164(wa);
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

  async function guardar() {
    if (guardando) return;
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
      return;
    }
    setGuardando(true);
    const r = await actualizarPerfilPrestador({
      descripcion,
      // S84-A1bis: se guarda el E.164 ENTERO — el prefijo del país elegido
      // + lo tipeado. Es EXACTAMENTE lo que la voz de `estadoTelefono` le
      // viene prometiendo al usuario ("se guarda +593…").
      telefono: componerE164(telNegocio, paisTel),
      whatsapp: componerE164(whatsapp, paisWa),
      email_contacto: emailContacto.trim(),
      // ④ la normalización vive en el GUARDADO, no en el tipeo: mientras
      // escribís, el campo dice lo que va a guardar (`ayuda`) sin
      // reescribirte el texto bajo el cursor.
      sitio_web: normalizarSitio(sitioWeb),
    });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('miCuenta.perfilGuardado'), variante: 'exito' });
    router.back();
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
    const pais = PAISES.find((p) => p.iso === iso);
    if (pais === undefined) return null;
    const e164 = `${pais.pre}${crudo}`;
    if (pais.formato === undefined) {
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
    return { ok, voz: t('perfilNegocio.telLargoMal', { pais: pais.nombre, cuantos, pre: pais.pre, van: crudo.length }) };
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

  const alternar = (s: Seccion) => setAbierta((a) => (a === s ? null : s));
  const prefijoDe = (iso: string) => PAISES.find((p) => p.iso === iso)?.pre ?? '';
  const isoDe = paisDe === 'whatsapp' ? paisWa : paisTel;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      {/* ① S83-C34 — ACÁ VIVÍA EL RASTRO, y murió en su gate. La lápida
          con el porqué vive en `perfil-piezas` (donde estaba la pieza).
          Lo que queda es el espejo de abajo, dentro del scroll: nunca
          parpadeó porque nunca dependió de cruzar un umbral. */}

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
          />

          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
            {/* ── LAS CUATRO SECCIONES, en el orden firmado ── */}
            <SeccionDesplegable
              icono="negocio"
              titulo={t('perfilNegocio.portadaTitulo')}
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
            </SeccionDesplegable>

            <Separador />

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

            <Separador />

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
              {prestador !== null && <SeccionSede sede={leerSede(prestador)} />}
            </SeccionDesplegable>

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

            {/* EL CLIP — SU LUGAR, SIN SU MÓDULO.
                Tiene lugar PROPIO y no entra a la galería de fotos: es
                UNO y es de otra naturaleza (se reproduce, no se mira).
                Meterlo entre las fotos lo volvería "una más" y obligaría
                a explicar cuál de todas se reproduce.
                VACÍO HONESTO: no se dibuja un play que no reproduce
                (Ley 23) — `expo-video` es NATIVO y exige build.
                CRUZA CON D-617: no hay build EAS 1.0.3 y sin ella no se
                recluta, así que las dos viajan en el MISMO TREN
                (precedente D-456: el tren se aprovecha, no se arma para
                un solo pasajero). */}
            <View style={{ paddingVertical: spacing[4], gap: spacing[2] }}>
              <Texto variante="seccion">{t('perfilNegocio.clipTitulo')}</Texto>
              <Texto variante="apoyo">{t('perfilNegocio.clipVacio')}</Texto>
            </View>

            <Separador />

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
                onPress={() => router.push('/cuenta/como-te-ven')}
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
            {/* ⑤ S84-C3 — "SEGURIDAD", y su condición de muerte escrita.
                El rótulo anterior ("Nombre y acceso") describía el
                contenido de la pantalla; éste describe su LUGAR EN LA
                CASA — y esa es la diferencia que importa ahora que el
                Perfil pasa a ser LA VITRINA: todo lo demás de esta
                pantalla es lo que las familias ven, y esto es lo único
                que no lo es. El subtítulo nombra las tres cosas que hay
                adentro para que el rótulo no tenga que hacer dos
                trabajos (17.6).
                ☠️ MUERTE: esta celda **se retira de la vitrina** cuando
                exista `Cuenta → Seguridad` como sección propia (el
                seccionado de S84). No es una pantalla que muere: es una
                PUERTA prestada — lo personal está de paso acá porque su
                casa todavía no se construyó, y una vitrina que aloja lo
                que nadie ve es una contradicción con fecha. */}
            <CeldaNavegacion
              icono="cuenta"
              titulo={t('perfilNegocio.seguridadTitulo')}
              detalle={t('perfilNegocio.seguridadDetalle')}
              registro="aa"
              onPress={() => router.push('/cuenta/identidad')}
            />

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
          {PAISES.map((p, i) => (
            <View key={p.iso}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={`${bandera(p.iso)}  ${p.nombre}`}
                subtitulo={p.formato === undefined ? t('perfilNegocio.paisSinFormato') : undefined}
                metadataMono={p.pre}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  if (paisDe === 'whatsapp') setPaisWa(p.iso);
                  else setPaisTel(p.iso);
                  setPaisDe(null);
                }}
                fin={p.iso === isoDe ? <Texto variante="dato">{t('perfilNegocio.paisElegido')}</Texto> : undefined}
              />
            </View>
          ))}
        </HojaScroll>
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
