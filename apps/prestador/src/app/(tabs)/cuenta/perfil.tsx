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
import { EspejoNegocio, RastroNegocio, SeccionDesplegable, SelectorPais } from '@/components/perfil-piezas';
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

/** E.164 sin '+' (regla 28) — la MISMA normalización que traía
 *  `cuenta/perfil`: la regla no cambia porque la pantalla se rediseñe. */
function normalizarTelefono(v: string): string {
  return v.trim().replace(/^\+/, '').replace(/[\s-]/g, '');
}

/** ③ "INCOMPLETA" con la regla que ya rige: una sección está incompleta
 *  cuando le falta el dato que la hace servir para algo. `donde` no
 *  entra: su dirección y su radio existen. Si NINGUNA está incompleta
 *  devuelve null — y entonces no se abre ninguna. */
function primeraIncompleta(descripcion: string, tel: string, wa: string): Seccion | null {
  if (descripcion.trim().length === 0) return 'portada';
  if (tel.trim().length === 0 || wa.trim().length === 0) return 'contacto';
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
        setTelNegocio(tel);
        setWhatsapp(wa);
        setEmailContacto(p.email_contacto ?? '');
        setSitioWeb(p.sitio_web ?? '');
        // ⑥ solo la PRIMERA vez que llegan datos — los focos siguientes
        // refrescan el contenido y NO tocan lo que el dedo dejó abierto.
        if (!yaAbrio.current) {
          yaAbrio.current = true;
          setAbierta(primeraIncompleta(desc, tel, wa));
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
  async function capturarLogo(camara: boolean) {
    setHojaLogo(false);
    const r = camara
      ? await capturarConCamara({ redimensionarA: 800, calidad: 0.8 })
      : await capturarDeGaleria({ calidad: 1 });
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
      estadoTelefono(telNegocio, paisTel)?.ok === false ? 'el teléfono' : null,
      estadoTelefono(whatsapp, paisWa)?.ok === false ? 'el WhatsApp' : null,
      estadoEmail(emailContacto)?.ok === false ? 'el correo' : null,
      estadoSitio(sitioWeb)?.ok === false ? 'el sitio web' : null,
    ].filter((x): x is string => x !== null);
    if (malos.length > 0) {
      setAbierta('contacto');
      mostrar({ texto: `Revisá ${malos.join(' y ')} antes de guardar.`, variante: 'error' });
      return;
    }
    setGuardando(true);
    const r = await actualizarPerfilPrestador({
      descripcion,
      telefono: normalizarTelefono(telNegocio),
      whatsapp: normalizarTelefono(whatsapp),
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
  const [rastroVisible, setRastroVisible] = useState(false);
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
      return { ok: true, voz: `Se guarda ${e164}. No verificamos el largo: ${pais.nombre} no declara su formato.` };
    }
    const ok = new RegExp(pais.formato).test(e164);
    if (ok) return { ok, voz: `se guarda ${e164}` };
    // El error DIRIGE (17.4): dice cuántos dígitos van y cuántos faltan,
    // derivado del formato REAL del país — jamás del de Ecuador.
    const rango = /\\d\{(\d+)(?:,(\d+))?\}/.exec(pais.formato);
    const min = rango?.[1];
    const max = rango?.[2];
    const cuantos = min === undefined ? 'los dígitos que le corresponden' : max === undefined ? `${min} dígitos` : `${min} o ${max} dígitos`;
    return { ok, voz: `Un número de ${pais.nombre} lleva ${cuantos} después de ${pais.pre}. Van ${crudo.length}.` };
  }

  /* ── ④ CORREO Y SITIO WEB — validación real (defecto del founder).
     El correo: forma mínima honesta (algo@algo.algo, sin espacios). No se
     valida "que exista" — eso solo lo prueba un envío, y prometerlo sería
     mentir. El sitio: se ACEPTA como lo escribe una persona —`satori.com`,
     `www.satori.com`— y la NORMALIZACIÓN pone el `https://` al guardar
     (adenda del founder). Pedirle el esquema al usuario es pedirle que
     hable como la máquina (17.2). */
  function estadoEmail(v: string): { ok: boolean; voz: string } | null {
    const t = v.trim();
    if (t.length === 0) return null;
    const ok = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(t);
    return { ok, voz: ok ? 'Las familias te escriben acá.' : 'Un correo lleva un @ y un punto después: hola@tunegocio.ec' };
  }
  /** Normaliza el sitio: sin esquema le pone `https://`. `www.` es
   *  legal con o sin él — no lo agregamos ni lo sacamos. */
  function normalizarSitio(v: string): string {
    const t = v.trim();
    if (t.length === 0) return '';
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  }
  function estadoSitio(v: string): { ok: boolean; voz: string } | null {
    const t = v.trim();
    if (t.length === 0) return null;
    const sinEsquema = t.replace(/^https?:\/\//i, '');
    // dominio con AL MENOS un punto y un TLD de 2+; el resto de la ruta
    // (que puede o no venir) no se valida: no es asunto nuestro.
    const ok = /^[^\s/?#.]+(\.[^\s/?#.]+)*\.[a-z]{2,}(\/\S*)?$/i.test(sinEsquema);
    return {
      ok,
      voz: ok ? `Se guarda ${normalizarSitio(t)}` : 'Escribí el dominio, como tunegocio.ec o www.tunegocio.ec',
    };
  }
  const vEmail = estadoEmail(emailContacto);
  const vSitio = estadoSitio(sitioWeb);
  const vTel = estadoTelefono(telNegocio, paisTel);
  const vWa = estadoTelefono(whatsapp, paisWa);

  /* ── los resúmenes: la densidad de herramienta ── */
  const hayTel = telNegocio.trim().length > 0;
  const hayWa = whatsapp.trim().length > 0;
  const resumenContacto =
    hayTel && hayWa ? 'Teléfono y WhatsApp' : hayTel ? 'Solo teléfono' : hayWa ? 'Solo WhatsApp' : 'Sin contacto';
  const resumenPortada = descripcion.trim().length > 0 ? 'Con descripción' : 'Sin descripción';

  /* ── el vacío honesto: UNA línea con la consecuencia ── */
  const vacio =
    hayTel && hayWa
      ? null
      : !hayTel && !hayWa
        ? 'Una familia que te encuentra hoy no tiene cómo escribirte.'
        : hayTel
          ? 'Las familias pueden llamarte. Te falta el WhatsApp.'
          : 'Una familia que te encuentra hoy no tiene cómo escribirte: no cargaste teléfono, correo ni sitio. Tu WhatsApp sí está.';

  const alternar = (s: Seccion) => setAbierta((a) => (a === s ? null : s));
  const prefijoDe = (iso: string) => PAISES.find((p) => p.iso === iso)?.pre ?? '';
  const isoDe = paisDe === 'whatsapp' ? paisWa : paisTel;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      {/* ② FIRMADO: el rastro. Vive FUERA del scroll — se pega al tope
          cuando el espejo se fue, y ya no se elige. */}
      {rastroVisible && prestador !== null && <RastroNegocio nombre={prestador.nombre_comercial} visible />}

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
            titulo="No pudimos cargar tu perfil"
            descripcion="Prueba de nuevo en un momento."
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
          scrollEventThrottle={16}
          onScroll={(e) => setRastroVisible(e.nativeEvent.contentOffset.y > 150)}
        >
          {/* EL ESPEJO — a sangre, arriba, y se va con el scroll */}
          <EspejoNegocio
            nombre={prestador?.nombre_comercial ?? ""}
            logoUrl={resolverUrlLogoNegocio(logoPath)}
            tipo="paseador · quito"
            visible
            vacio={vacio}
            /* Anti doble-disparo: mientras una imagen viaja, el tap NO
               abre otra Hoja — y lo DICE en vez de no hacer nada, que se
               leería como que el toque no registró (Ley 13). */
            onEditarLogo={() => {
              if (subiendoLogo) {
                mostrar({ variante: 'neutro', texto: 'Estamos subiendo tu logo…' });
                return;
              }
              setHojaLogo(true);
            }}
          />

          <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[4] }}>
            {/* ── LAS CUATRO SECCIONES, en el orden firmado ── */}
            <SeccionDesplegable
              icono="negocio"
              titulo="Tu portada"
              resumen={resumenPortada}
              abierta={abierta === 'portada'}
              onAlternar={() => alternar('portada')}
            >
              <Texto variante="apoyo">Lo primero que lee una familia. Dos o tres líneas alcanzan.</Texto>
              <Campo
                label="Descripción"
                placeholder="Paseos tranquilos por el norte de Quito, grupos chicos y reporte con fotos."
                value={descripcion}
                onChangeText={setDescripcion}
                multilinea={3}
              />
            </SeccionDesplegable>

            <Separador />

            <SeccionDesplegable
              titulo="Cómo te contactan"
              resumen={resumenContacto}
              abierta={abierta === 'contacto'}
              onAlternar={() => alternar('contacto')}
            >
              {/* SIN GLIFO, decisión declarada: el registry no tiene
                  contacto/telefono/correo/sitio (medido). Antes que
                  prestar uno que miente, ninguno — el glifo se pide con
                  su gate por ícono a 21px (§6b). */}
              <Texto variante="apoyo">
                Son datos del negocio y los ven las familias. Tu teléfono personal vive en Cuenta.
              </Texto>

              <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
                <SelectorPais
                  bandera={bandera(paisTel)}
                  prefijo={prefijoDe(paisTel)}
                  onPress={() => setPaisDe('telNegocio')}
                />
                <View style={{ flex: 1 }}>
                  <Campo
                    label="Teléfono del negocio"
                    placeholder="99 123 4567"
                    value={telNegocio}
                    onChangeText={setTelNegocio}
                    keyboardType="phone-pad"
                    ayuda={vTel?.ok === true ? vTel.voz : undefined}
                    error={vTel?.ok === false ? vTel.voz : undefined}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
                <SelectorPais
                  bandera={bandera(paisWa)}
                  prefijo={prefijoDe(paisWa)}
                  onPress={() => setPaisDe('whatsapp')}
                />
                <View style={{ flex: 1 }}>
                  <Campo
                    label="WhatsApp"
                    placeholder="99 900 0333"
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                    keyboardType="phone-pad"
                    ayuda={vWa?.ok === true ? vWa.voz : undefined}
                    error={vWa?.ok === false ? vWa.voz : undefined}
                  />
                </View>
              </View>

              <Campo
                label="Correo de contacto"
                placeholder="hola@paseosandres.ec"
                value={emailContacto}
                onChangeText={setEmailContacto}
                keyboardType="email-address"
                autoCapitalize="none"
                ayuda={vEmail?.ok === true ? vEmail.voz : undefined}
                error={vEmail?.ok === false ? vEmail.voz : undefined}
              />
              <Campo
                label="Sitio web"
                placeholder="paseosandres.ec"
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
              titulo="Dónde atendés"
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
              {prestador !== null && <SeccionSede sede={leerSede(prestador)} />}
            </SeccionDesplegable>

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
            <CeldaNavegacion
              icono="cuenta"
              titulo="Nombre y acceso"
              /* ⑤ EL DETALLE, CORREGIDO (S83-C33): decía "tu nombre, tu
                 teléfono y tu correo" mientras la sección de arriba dice
                 "tu teléfono personal vive en Cuenta". Dos frases que no
                 podían ser ciertas a la vez, y el teléfono se fue de allá
                 — el detalle ahora nombra lo que hay: nombre y correo. */
              detalle="Tu nombre y tu correo de ingreso. No los ven las familias."
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
      <Hoja visible={paisDe !== null} onCerrar={() => setPaisDe(null)} titulo="País del número">
        <View style={{ paddingBottom: spacing[2] }}>
          <Texto variante="apoyo">
            El indicativo es un dato aparte del número. Podés elegir cualquiera: operar en un país y tener la línea de
            otro es normal.
          </Texto>
        </View>
        <HojaScroll>
          {PAISES.map((p, i) => (
            <View key={p.iso}>
              {i > 0 ? <Separador /> : null}
              <Celda
                titulo={`${bandera(p.iso)}  ${p.nombre}`}
                subtitulo={p.formato === undefined ? 'no verificamos el largo' : undefined}
                metadataMono={p.pre}
                interactiva
                accessibilityRole="button"
                onPress={() => {
                  if (paisDe === 'whatsapp') setPaisWa(p.iso);
                  else setPaisTel(p.iso);
                  setPaisDe(null);
                }}
                fin={p.iso === isoDe ? <Texto variante="dato">elegido</Texto> : undefined}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>

      {/* ③ LA HOJA DEL LOGO — cámara y galería PARES (patrón
          SelectorAvatar); "Quitar" SOLO cuando hay logo: la puerta no
          ofrece lo que no existe (Ley 23). */}
      <Hoja visible={hojaLogo} onCerrar={() => setHojaLogo(false)} titulo="El logo de tu negocio" altura="contenido">
        <View style={{ paddingBottom: insets.bottom }}>
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('miCuenta.logoTomarFoto')}
            onPress={() => void capturarLogo(true)}
          />
          <Separador />
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={t('miCuenta.logoGaleria')}
            onPress={() => void capturarLogo(false)}
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
