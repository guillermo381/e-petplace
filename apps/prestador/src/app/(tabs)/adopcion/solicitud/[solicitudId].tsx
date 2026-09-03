/**
 * EL HILO, LADO PUBLICADOR — responder, y decidir (S112-C, §5 y §9).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **LA ASIMETRÍA QUE ESTA PANTALLA TIENE QUE RESPETAR, y la midió D:**
 * *sólo el publicador ACEPTA; declinar pueden los dos.* Por eso «Aceptar» vive
 * acá y **no** en la app de la familia. *El motor lo rebota igual con
 * `rol_no_puede`, pero un botón que siempre falla es peor que uno que no está.*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔑 **`recibida → en_conversacion` NO ES UN BOTÓN.** Lo mueve el motor **en el
 * mismo acto** en que el publicador escribe su primer mensaje, y
 * `responderSolicitudAdopcion` devuelve el estado **ya movido**. No se replica
 * ni se ofrece como acción — *un estado que alguien tiene que acordarse de
 * mover es un estado que va a estar mal.*
 *
 * ── LA DOBLE CONFIRMACIÓN, Y POR QUÉ EN LAS DOS DECISIONES (P1) ─────────
 * `HojaConfirmacionDestructiva` con el **sujeto nombrado**. Declinar es
 * obviamente irreversible; **aceptar también lo es** —cierra el hilo para los
 * dos y el motor no admite volver— y además es la decisión que le cambia la
 * vida a un animal. *La confirmación no está por el riesgo técnico: está
 * porque del otro lado hay una familia esperando una respuesta que no se puede
 * deshacer.*
 *
 * ⚠️ **ACEPTAR NO COMPLETA LA ADOPCIÓN, y la pantalla no lo insinúa.** El acta,
 * la transferencia del expediente y el hito viven en otro arco
 * (`traspasarMascotaAFamilia`), y hoy **el acta no tiene texto cargado**. Por
 * eso el éxito dice *«aceptaste»* y nunca *«adoptado»*: prometer el final que
 * todavía no puede ocurrir es la clase de voz que `L-472` cobra.
 *
 * ── LO QUE NO SE DIBUJA, Y NO ES RECORTE ────────────────────────────────
 * · **No hay adjuntar imagen.** D lo midió en los tres lugares: sin columna,
 *   sin parámetro y sin bucket privado. **Y la trampa señalizada:**
 *   `adopcion-fotos` existe y es **público** — es la vidriera. *Colgar ahí los
 *   adjuntos de una conversación privada los deja a la vista de cualquiera.*
 * · **No se defiende la privacidad en el cliente.** La RLS ya lo hace, y D lo
 *   probó con un tercer usuario dando 0 en las cuatro puertas. *Filtrar acá
 *   sería una segunda ley que puede diverger de la primera.*
 * · **No hay teléfono ni email de la familia.** Nunca viajan en el hilo: *el
 *   canal existe para que no haga falta.*
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { armarHilo, leerEscalera, type FilaDelHilo } from '@epetplace/domain';
import { etiquetaDeDiaDeMensaje, horaCortaDeMensaje, obtenerIdiomaActual } from '@epetplace/i18n';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarraEscribir,
  EscaleraSolicitud,
  Boton,
  BurbujaMensaje,
  CabeceraHilo,
  Encabezado,
  EventoDelHilo,
  PastillaNuevoMensaje,
  SeparadorDia,
  SuperficieChat,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  Hoja,
  HojaConfirmacionDestructiva,
  MarcaDeAgua,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  resolverUrlGenericaEspecie,
  cerrarSolicitudAdopcion,
  obtenerSesion,
  obtenerSolicitudesDeMisPublicaciones,
  resolverUrlsFotos,
  responderSolicitudAdopcion,
  suscribirseAlHilo,
  type SolicitudRecibida,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Los borradores vivos, por hilo. Sólo en memoria. */
const BORRADORES = new Map<string, string>();

/** El diccionario de este lado usa camelCase, y la etapa viene en snake: se
 *  mapea acá y no con un `replace` — *una transformación de texto acierta hoy y
 *  falla el día que una etapa lleve dos guiones bajos.* */
const ETAPA_CLAVE = {
  enviada: 'Enviada',
  en_conversacion: 'EnConversacion',
  aceptada: 'Aceptada',
  acta_firmada: 'ActaFirmada',
  una_vida_nueva: 'UnaVidaNueva',
} as const;

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'noEsTuya' }
  | { fase: 'listo'; hilo: SolicitudRecibida; miUid: string; cara: string | null; caraDeEspecie: string | null };

/**
 * LAS RESPUESTAS DEL FORMULARIO, LEÍDAS (S112-C · C6).
 *
 * 🔴 **Lee `Record<string, unknown>` y no un tipo cerrado, a propósito.** El
 * lector entrega el `jsonb` tal cual, y el esquema de la postulación **puede
 * ganar preguntas antes que esta pantalla**. Un tipo cerrado acá haría que una
 * respuesta nueva **desapareciera en silencio**: el refugio leería un
 * formulario incompleto sin señal de que falta algo.
 *
 * ⇒ Se dibuja **lo conocido con su rótulo** y, al final, **lo que no se conoce
 * con su clave cruda**. *Una clave fea a la vista es peor que fea: es honesta —
 * y le dice a quien la ve que hay una pregunta que esta pantalla todavía no
 * sabe presentar.*
 */
function PostulacionLeida({
  r,
  t,
}: {
  r: Record<string, unknown>;
  t: (k: never, o?: Record<string, string | number>) => string;
}) {
  const CONOCIDAS = ['hogar', 'vivienda', 'otros_animales', 'horas_solo', 'experiencia', 'motivo'];
  const hogar = (r.hogar ?? null) as Record<string, unknown> | null;
  const texto = (v: unknown): string | null =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
  const numero = (v: unknown): number | null => (typeof v === 'number' ? v : null);

  const filas: { rotulo: string; valor: string }[] = [];

  if (hogar !== null) {
    /* Los menores, **por rango y sumados**: es lo único que el esquema guarda y
       lo único que hace falta para saber si el hogar tiene chicos. */
    const partes: string[] = [];
    const ad = numero(hogar.adultos);
    if (ad !== null) partes.push(t('portalHilo.postAdultos' as never, { n: ad }));
    for (const [clave, k] of [
      ['menores_0_5', 'postMenores05'],
      ['menores_6_12', 'postMenores612'],
      ['menores_13_17', 'postMenores1317'],
    ] as const) {
      const n = numero(hogar[clave]);
      /* Los rangos en CERO no se dicen: «0 niños de 6 a 12» es una línea que
         hay que leer para descartar. */
      if (n !== null && n > 0) partes.push(t(k as never, { n }));
    }
    if (partes.length > 0) filas.push({ rotulo: t('portalHilo.postHogar' as never), valor: partes.join(' · ') });
  }

  const vivienda = texto(r.vivienda);
  if (vivienda !== null) {
    filas.push({
      rotulo: t('portalHilo.postVivienda' as never),
      valor: t(`portalHilo.vivienda_${vivienda}` as never),
    });
  }
  const horas = numero(r.horas_solo);
  if (horas !== null) {
    filas.push({ rotulo: t('portalHilo.postHorasSolo' as never), valor: t('portalHilo.postHoras' as never, { n: horas }) });
  }
  /* Las OPCIONALES sólo si tienen contenido: un rótulo con una raya dice «no
     contestó», y lo cierto es que no se le preguntó como obligatorio. */
  const otros = texto(r.otros_animales);
  if (otros !== null) filas.push({ rotulo: t('portalHilo.postOtrosAnimales' as never), valor: otros });
  const exp = texto(r.experiencia);
  if (exp !== null) filas.push({ rotulo: t('portalHilo.postExperiencia' as never), valor: exp });
  const motivo = texto(r.motivo);
  if (motivo !== null) filas.push({ rotulo: t('portalHilo.postMotivo' as never), valor: motivo });

  /* Lo que esta pantalla no conoce, con su clave cruda. Ver la cabecera. */
  const desconocidas = Object.keys(r).filter((k) => !CONOCIDAS.includes(k));

  return (
    <View style={{ gap: spacing[4] }}>
      {filas.map((f) => (
        <View key={f.rotulo} style={{ gap: spacing[1] }}>
          <Texto variante="seccion">{f.rotulo}</Texto>
          <Texto variante="cuerpo">{f.valor}</Texto>
        </View>
      ))}
      {desconocidas.map((k) => (
        <View key={k} style={{ gap: spacing[1] }}>
          <Texto variante="dato" color="tertiary">{k}</Texto>
          <Texto variante="cuerpo">{String(r[k])}</Texto>
        </View>
      ))}
    </View>
  );
}

export default function HiloDelPublicador() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const aviso = useAviso();
  const params = useLocalSearchParams<{ solicitudId?: string }>();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  /* Borrador POR HILO, en memoria: sobrevive a la pantalla y no al cierre de
     la app — lo que §2.4 pide, sin escribir en disco un texto sin enviar. */
  const [borrador, setBorradorLocal] = useState(() => BORRADORES.get(params.solicitudId ?? '') ?? '');
  const setBorrador = useCallback(
    (v: string) => {
      setBorradorLocal(v);
      const k = params.solicitudId ?? '';
      if (v.length === 0) BORRADORES.delete(k);
      else BORRADORES.set(k, v);
    },
    [params.solicitudId],
  );
  const [escaleraAbierta, setEscaleraAbierta] = useState(true);
  const [viendoPostulacion, setViendoPostulacion] = useState(false);
  const [alFondo, setAlFondo] = useState(true);
  const [nuevosSinVer, setNuevosSinVer] = useState(0);
  const [enVuelo, setEnVuelo] = useState<
    { clientId: string; cuerpo: string; estado: 'enviando' | 'no_se_envio' }[]
  >([]);
  const idioma = obtenerIdiomaActual();

  /** C2 · el estado → la etapa, con la MISMA derivación que la familia. */
  const escalera = useMemo(
    () =>
      estado.fase === 'listo'
        ? leerEscalera(estado.hilo.estado, { huboMensajes: estado.hilo.mensajes.length > 0 })
        : { etapa: null as null, final: null as null },
    [estado],
  );

  const filas = useMemo(() => {
    if (estado.fase !== 'listo') return [];
    const ahora = new Date().toISOString();
    return armarHilo([
      ...estado.hilo.mensajes,
      ...enVuelo.map((x) => ({
        mensajeId: `local:${x.clientId}`,
        autorUserId: estado.miUid,
        cuerpo: x.cuerpo,
        automatica: false,
        creadoEn: ahora,
      })),
    ]);
  }, [estado, enVuelo]);

  const ajenosVistos = useRef(0);
  useEffect(() => {
    if (estado.fase !== 'listo') return;
    const ajenos = estado.hilo.mensajes.filter((m) => m.autorUserId !== estado.miUid).length;
    if (alFondo) {
      ajenosVistos.current = ajenos;
      setNuevosSinVer(0);
      return;
    }
    setNuevosSinVer(Math.max(0, ajenos - ajenosVistos.current));
  }, [estado, alFondo]);

  const renderFila = (f: FilaDelHilo) => {
    if (f.tipo === 'dia') {
      return (
        <SeparadorDia
          etiqueta={etiquetaDeDiaDeMensaje(f.fechaIso, idioma, {
            hoy: t('portalHilo.hoy'),
            ayer: t('portalHilo.ayer'),
          })}
        />
      );
    }
    if (f.tipo === 'evento') {
      return <EventoDelHilo etiqueta={f.evento.etiqueta} />;
    }
    if (estado.fase !== 'listo') return null;
    const m = f.mensaje;
    const mio = m.autorUserId === estado.miUid;
    const hora = horaCortaDeMensaje(m.creadoEn, idioma);
    const enV = m.mensajeId.startsWith('local:')
      ? enVuelo.find((x) => `local:${x.clientId}` === m.mensajeId)
      : undefined;
    if (!mio) {
      return (
        <BurbujaMensaje
          mio={false}
          texto={m.cuerpo}
          hora={hora}
          posicion={f.posicion}
          autor={f.abreGrupo ? (estado.hilo.solicitanteNombre ?? undefined) : undefined}
        />
      );
    }
    /* Dos ramas explícitas: la unión de B **exige** salida y palabra en el
       fallo, y pasarlas como `X | undefined` no compila. */
    if (enV?.estado === 'no_se_envio') {
      const cid = enV.clientId;
      return (
        <BurbujaMensaje
          mio
          texto={m.cuerpo}
          hora={hora}
          posicion={f.posicion}
          estado="no_se_envio"
          onReintentar={() => void reintentar(cid)}
          vozReintentar={t('portalHilo.noSeEnvio')}
        />
      );
    }
    return (
      <BurbujaMensaje
        mio
        texto={m.cuerpo}
        hora={hora}
        posicion={f.posicion}
        estado={enV === undefined ? 'enviado' : 'enviando'}
      />
    );
  };
  const [decidiendo, setDecidiendo] = useState<'aceptada' | 'declinada' | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    const id = params.solicitudId;
    if (typeof id !== 'string' || id.length === 0) return setEstado({ fase: 'error' });
    const [r, ses] = await Promise.all([obtenerSolicitudesDeMisPublicaciones(), obtenerSesion()]);
    if (!r.ok) return setEstado({ fase: 'error' });
    const hilo = r.data.find((s) => s.solicitudId === id) ?? null;
    /* **`noEsTuya` es distinto de `error`**, y por eso son dos fases: la RLS
       ya decidió que no lo ves, y decirle «no pudimos cargar» a alguien que
       **no tiene acceso** lo invita a reintentar para siempre (Ley 13). */
    if (hilo === null) return setEstado({ fase: 'noEsTuya' });
    const uid = ses.ok && ses.data !== null ? ses.data.user_id : '';
    /* ⭐ A4 · LA CARA SE FIRMA, y acá no se firmaba NADA: se pasaba
       `nombre` y punto, así que **hasta los animales CON foto salían con la
       huella**. `mascotas` es bucket privado ⇒ el path crudo no se pinta
       (`D-308`, el mismo precedente que curó la lista).

       ⚠️ **La mitad que falta tiene dueño y nombre:** sin foto no puedo caer
       a la cara de la casa porque `obtener_solicitudes_de_mis_publicaciones`
       **no devuelve `mascota_especie`** — el lector de la FAMILIA sí lo trae,
       el del publicador no. Pedido a A por nombre; hasta entonces el
       sin-foto sigue en huella y se declara en vez de disimularse. */
    const ruta = hilo.mascotaFotoUrl;
    const firmada =
      typeof ruta === 'string' && ruta.length > 0
        ? ((await resolverUrlsFotos([ruta])).get(ruta) ?? null)
        : null;
    /* ⭐ **A4 CERRADA.** La mitad que faltaba era `mascota_especie` en el lector
       del publicador; A la entregó en `20260908520000`. Sin ella el refugio
       veía la huella sobre el mismo animal que la familia veía con la cara de
       la casa — *la misma solicitud con dos caras según quién mira*. */
    const cara = firmada;
    setEstado({
      fase: 'listo',
      hilo,
      miUid: uid,
      cara,
      /* APARTE de la foto: la propia lleva encuadre de retrato, la ilustración
         va a sangre (contrato de B, `90bebbfd`). */
      caraDeEspecie: resolverUrlGenericaEspecie(hilo.mascotaEspecie),
    });
  }, [params.solicitudId]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        await cargar();
        if (!vigente) return;
      })();
      return () => {
        vigente = false;
      };
    }, [cargar]),
  );

  /* ═══ C4 · LOS NUEVOS LLEGAN SOLOS, y de este lado NUNCA hubo sondeo ═══════
     El hilo del refugio se quedó sin actualización automática mientras el de
     la familia sondeaba: **la misma conversación, con una punta que se enteraba
     y otra que no.** Ahora las dos escuchan el mismo canal.

     ⚠️ La desuscripción **no es higiene: es lo único que cierra el socket** (lo
     dice el wrapper), y por eso vive en el `return` de un efecto de FOCO. */
  useFocusEffect(
    useCallback(() => {
      const id = params.solicitudId;
      if (typeof id !== 'string' || id.length === 0) return;
      /* Se RECARGA en vez de empujar la burbuja: el motor pudo haber movido el
         estado en el mismo acto, y pintar sólo el mensaje dejaría la escalera
         diciendo «recibida» sobre un hilo que ya conversa. */
      return suscribirseAlHilo(id, () => void cargar());
    }, [params.solicitudId, cargar]),
  );

  const cerrado =
    estado.fase === 'listo' && (estado.hilo.estado === 'aceptada' || estado.hilo.estado === 'declinada');

  /* ⭐ **C5 · ENVÍO OPTIMISTA**, igual que del lado familia — y «igual» es el
     punto: es la misma conversación. El campo se vacía ANTES del viaje;
     vaciarlo al volver deja el texto a la vista con la burbuja ya abajo. */
  async function enviar(texto: string) {
    if (estado.fase !== 'listo') return;
    const cuerpo = texto.trim();
    if (cuerpo.length === 0) return;
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setEnVuelo((xs) => [...xs, { clientId, cuerpo, estado: 'enviando' }]);
    setBorrador('');
    const r = await responderSolicitudAdopcion({ solicitudId: estado.hilo.solicitudId, cuerpo });
    if (!r.ok) {
      setEnVuelo((xs) =>
        xs.map((x) => (x.clientId === clientId ? { ...x, estado: 'no_se_envio' as const } : x)),
      );
      return;
    }
    setEnVuelo((xs) => xs.filter((x) => x.clientId !== clientId));
    /* Se RE-LEE en vez de empujar la burbuja a mano: el motor pudo haber movido
       el estado a `en_conversacion` en el mismo acto, y pintar sólo el mensaje
       dejaría la escalera diciendo «recibida» sobre un hilo que ya conversa. */
    await cargar();
  }

  async function reintentar(clientId: string) {
    const fallido = enVuelo.find((x) => x.clientId === clientId);
    if (fallido === undefined || estado.fase !== 'listo') return;
    setEnVuelo((xs) =>
      xs.map((x) => (x.clientId === clientId ? { ...x, estado: 'enviando' as const } : x)),
    );
    const r = await responderSolicitudAdopcion({
      solicitudId: estado.hilo.solicitudId,
      cuerpo: fallido.cuerpo,
    });
    if (!r.ok) {
      setEnVuelo((xs) =>
        xs.map((x) => (x.clientId === clientId ? { ...x, estado: 'no_se_envio' as const } : x)),
      );
      return;
    }
    setEnVuelo((xs) => xs.filter((x) => x.clientId !== clientId));
    await cargar();
  }

  async function decidir(estadoFinal: 'aceptada' | 'declinada') {
    if (estado.fase !== 'listo' || trabajando) return;
    setTrabajando(true);
    const r = await cerrarSolicitudAdopcion({ solicitudId: estado.hilo.solicitudId, estadoFinal });
    setTrabajando(false);
    setDecidiendo(null);
    if (!r.ok) return aviso.mostrar({ variante: 'error', texto: r.mensaje });
    aviso.mostrar({
      variante: estadoFinal === 'aceptada' ? 'exito' : 'neutro',
      texto: estadoFinal === 'aceptada' ? t('portalHilo.aceptadaOk') : t('portalHilo.declinadaOk'),
    });
    await cargar();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('portalHilo.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/adopcion'))}
      />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={64} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'noEsTuya' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('portalHilo.noEsTuyaTitulo')}
            descripcion={t('portalHilo.noEsTuyaDetalle')}
          />
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('portalHilo.errorTitulo')}
            descripcion={t('portalHilo.errorDetalle')}
            accion={<Boton etiqueta={t('portalHilo.reintentar')} onPress={() => void cargar()} />}
          />
        </View>
      ) : (
        <SuperficieChat
          /* ═══ C1 · LA MISMA PIEZA QUE LA FAMILIA, Y ESE ES EL PUNTO ═══════
             Acá el rojo era más sutil que del otro lado y por eso más caro: la
             pantalla **sí** tenía `EvitaTeclado`, así que el campo no quedaba
             tapado — pero su `ScrollView` era plano, **sin anclar al final**, y
             el último mensaje podía quedar arriba del pliegue.

             ⇒ *Dos comportamientos distintos para la misma conversación*, y el
             de acá se veía «bien» lo suficiente como para que nadie lo
             reportara. **Montar la misma pieza es lo que los vuelve uno**; dos
             composiciones parecidas se separan en la primera cura que sólo toca
             a una. ── */
          encabezado={
            <View style={{ gap: spacing[3] }}>
              <CabeceraHilo
                animal={{
                  nombre: estado.hilo.mascotaNombre,
                  fotoUrl: estado.cara,
                  fotoDeEspecie: estado.caraDeEspecie ?? undefined,
                  onPress: () =>
                    router.push({
                      pathname: '/adoptables/[publicacionId]',
                      params: { publicacionId: estado.hilo.publicacionId },
                    }),
                }}
                /* 🔴 **CADA LADO VE AL OTRO.** Acá la contraparte es el
                   SOLICITANTE, no el refugio — es él. Y **no lleva `onPress`**:
                   §10.2 dice que la plataforma jamás asigna, aprueba ni puntúa
                   adoptantes, así que **no hay perfil de adoptante al que ir**.
                   *Un toque que llevara a «la ficha de la familia» construiría
                   justo lo que la letra prohíbe.* */
                contraparte={{
                  nombre: estado.hilo.solicitanteNombre ?? t('portalHilo.alguienSinNombre'),
                }}
                /* ═══ C6 · LAS ACCIONES VAN EN LA CABECERA ══════════════════
                   §2.1, literal: *«como refugio, en la cabecera tengo "Ver
                   postulación"… y el menú con Aceptar / Declinar… **Nada de eso
                   vive en la barra de escribir**»*.

                   🔑 Y la pieza de B **no tiene slot de acciones en la barra**,
                   a propósito: *no hay dónde ponerlo mal.* La letra se sostiene
                   en la forma del contrato, no en que yo me acuerde. */
                /* ⭐ **«VER POSTULACIÓN» ENTRA** (§2.1: *«las respuestas del
                   formulario, en su pantalla, no dentro del chat»*).

                   ⏪ Acá decía que no se podía, y era cierto: `SolicitudRecibida`
                   no traía `respuestas`. Llegó (A), y **verificado contra el
                   objeto antes de montarlo**: el lector las devuelve y las dos
                   solicitudes vivas tienen sus seis claves. *Se corrige la nota
                   en vez de borrarla — explica por qué este botón no existió.*

                   🔴 **Y va SIEMPRE, también con el hilo cerrado**: leer por qué
                   una familia postuló no deja de importar porque la solicitud
                   terminó — *un refugio que declinó y quiere releer qué le
                   escribieron no está haciendo nada indebido.* Lo que se recorta
                   con el cierre son las DECISIONES, no la lectura. */
                acciones={
                  <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                    <Boton
                      variante="ghost"
                      tamaño="sm"
                      etiqueta={t('portalHilo.verPostulacion')}
                      onPress={() => setViendoPostulacion(true)}
                    />
                    {cerrado ? null : (
                      <>
                        <Boton
                          variante="secundario"
                          tamaño="sm"
                          etiqueta={t('portalHilo.aceptar')}
                          onPress={() => setDecidiendo('aceptada')}
                        />
                        <Boton
                          variante="ghost"
                          tamaño="sm"
                          etiqueta={t('portalHilo.declinar')}
                          onPress={() => setDecidiendo('declinada')}
                        />
                      </>
                    )}
                  </View>
                }
              />

              {/* C2 · la escalera, con **LA VOZ DEL REFUGIO**. §1: *«misma
                  pieza en las dos apps, con las voces de cada asiento: la
                  familia lee "Estás en", el refugio lee "La solicitud está
                  en"»*. Misma derivación (`leerEscalera`), distinto acento y
                  distintas palabras — que es exactamente lo que «misma pieza,
                  dos asientos» significa. */}
              {escalera.etapa === null ? null : (
                <EscaleraSolicitud
                  etapa={escalera.etapa}
                  final={
                    escalera.final === null
                      ? undefined
                      : {
                          tipo: escalera.final,
                          etiqueta:
                            escalera.final === 'declinada'
                              ? t('portalHilo.estadoDeclinada')
                              : escalera.final === 'desistida'
                                ? t('portalHilo.estadoDesistida')
                                : t('portalHilo.estadoOtraFamilia'),
                        }
                  }
                  voces={{
                    enviada: t('portalHilo.etapaEnviada'),
                    en_conversacion: t('portalHilo.etapaEnConversacion'),
                    aceptada: t('portalHilo.etapaAceptada'),
                    acta_firmada: t('portalHilo.etapaActaFirmada'),
                    una_vida_nueva: t('portalHilo.etapaUnaVidaNueva'),
                  }}
                  vozEstado={t('portalHilo.laSolicitudEstaEn', {
                    etapa: t(`portalHilo.etapa${ETAPA_CLAVE[escalera.etapa]}` as 'portalHilo.etapaEnviada'),
                  })}
                  abierta={escaleraAbierta}
                  onAlternar={() => setEscaleraAbierta((v) => !v)}
                  etiquetaAlternar={t('portalHilo.escaleraAlternar')}
                  /* `oficio` y no `control`: es la casa del prestador. */
                  acento="oficio"
                />
              )}
            </View>
          }
          datosDelMasNuevoAlMasViejo={filas}
          claveDe={(f) => f.clave}
          renderMensaje={(f) => renderFila(f)}
          onAlFondoCambia={setAlFondo}
          sobrepuesto={
            !alFondo && nuevosSinVer > 0 ? (
              <PastillaNuevoMensaje
                etiqueta={t('portalHilo.nuevos', { n: nuevosSinVer })}
                onPress={() => {
                  setNuevosSinVer(0);
                  setAlFondo(true);
                }}
              />
            ) : null
          }
          barra={
            cerrado ? (
              estado.hilo.estado === 'no_concretada_fallecimiento' ? null : (
                <BarraEscribir enLectura={t('portalHilo.cerrado')} />
              )
            ) : (
              <BarraEscribir
                valor={borrador}
                onCambio={(v) => {
                  setBorrador(v);
                  if (v.length > 0 && borrador.length === 0) setEscaleraAbierta(false);
                }}
                onEnviar={(texto) => void enviar(texto)}
                placeholder={t('portalHilo.escribirlePlaceholder', {
                  quien: estado.hilo.solicitanteNombre ?? t('portalHilo.alguienSinNombre'),
                })}
                /* Misma deuda que del lado familia, misma salida: el registry no
                   tiene glifo de «enviar» y prestar uno cercano le enseñaría dos
                   significados. Va la palabra hasta que §6b dé el suyo. */
                glifoEnviar={<Texto variante="dato">{t('portalHilo.enviar')}</Texto>}
                etiquetaEnviar={t('portalHilo.enviar')}
              />
            )
          }
        />
      )}

      {/* ⭐ **EL HILO ES LA PUERTA DEL ACTA** — letra del founder: *«aceptada:

          el hilo me lleva al acta»*. El aviso «acta lista» apunta al hilo a

          propósito (decisión de D), así que **si el hilo no llevara, no llegaría

          nadie**. */}

      {estado.fase === 'listo' && estado.hilo.estado === 'aceptada' ? (

        <View style={{ padding: spacing[5] }}>

          <Boton

            variante="primario"

            bloque

            etiqueta={t('portalHilo.verActa')}

            onPress={() =>

              router.push({

                pathname: '/adopcion/acta/[solicitudId]',

                params: { solicitudId: estado.hilo.solicitudId },

              })

            }

          />

        </View>

      ) : null}


      {/* ═══ C6 · LA POSTULACIÓN, EN SU PANTALLA Y NO ADENTRO DEL CHAT ═════
          §2.1 lo dice así: *«las respuestas del formulario, **en su pantalla**,
          no dentro del chat»*. Volcarlas al hilo las mezclaría con la
          conversación y las volvería imposibles de releer: *lo que se lee una
          vez para decidir no vive en el mismo lugar que lo que se lee todos los
          días.*

          🔴 **Se dibuja lo que HAY, clave por clave, y nada más.** Las opcionales
          —`otros_animales`, `experiencia`— **se omiten si vienen vacías** en vez
          de mostrar un rótulo con una raya: *un campo vacío con su título dice
          «no contestó», y lo cierto es que no se le preguntó como obligatorio.*

          ⚠️ **Los menores van POR RANGO y jamás por nombre ni edad exacta**
          (§5.9). No es una convención de esta pantalla: **el motor rechaza
          `hogar.nombre_menor` y la tabla tiene un CHECK que lo hace
          inexpresable**. Acá sólo se muestra lo que ese esquema permitió
          guardar. */}
      <Hoja
        visible={viendoPostulacion}
        onCerrar={() => setViendoPostulacion(false)}
        titulo={t('portalHilo.postulacionTitulo')}
      >
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          {estado.fase !== 'listo' || estado.hilo.respuestas === null ? (
            /* `null` es legal y **no es un error**: una solicitud puede existir
               sin formulario. Se dice, en vez de dibujar una hoja vacía. */
            <Texto variante="cuerpo">{t('portalHilo.postulacionSinDatos')}</Texto>
          ) : (
            <PostulacionLeida r={estado.hilo.respuestas} t={t} />
          )}
        </View>
      </Hoja>

      {/* ── P1 · LA DOBLE CONFIRMACIÓN, con el SUJETO nombrado ── */}
      <HojaConfirmacionDestructiva
        visible={decidiendo === 'declinada'}
        onCerrar={() => setDecidiendo(null)}
        titulo={t('portalHilo.declinarTitulo')}
        sujeto={estado.fase === 'listo' ? estado.hilo.mascotaNombre : ''}
        etiquetaConfirmar={t('portalHilo.declinarConfirmar')}
        etiquetaCancelar={t('portalHilo.cancelar')}
        trabajando={trabajando}
        onConfirmar={() => void decidir('declinada')}
      >
        <Texto variante="cuerpo">{t('portalHilo.declinarCuerpo')}</Texto>
      </HojaConfirmacionDestructiva>

      {/* Aceptar NO es destructivo, así que **no usa la Hoja destructiva**: usa
          una Hoja común con su confirmación. *Vestir de rojo la mejor noticia
          del producto sería el color marcando gravedad y no clase (N23).* */}
      <Hoja
        visible={decidiendo === 'aceptada'}
        onCerrar={() => setDecidiendo(null)}
        titulo={t('portalHilo.aceptarTitulo')}
      >
        <View style={{ gap: spacing[3] }}>
          <Texto variante="titulo">
            {estado.fase === 'listo' ? estado.hilo.mascotaNombre : ''}
          </Texto>
          <Texto variante="cuerpo">{t('portalHilo.aceptarCuerpo')}</Texto>
          <Boton
            variante="primario"
            bloque
            etiqueta={t('portalHilo.aceptarConfirmar')}
            cargando={trabajando}
            onPress={() => void decidir('aceptada')}
          />
          <Boton variante="ghost" bloque etiqueta={t('portalHilo.cancelar')} onPress={() => setDecidiendo(null)} />
        </View>
      </Hoja>
    </View>
  );
}
