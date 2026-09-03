/**
 * EL HILO DE LA SOLICITUD — la conversación que no se pierde (S111-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«Después hablamos acá adentro. Veo en qué estado está:
 * recibida · en conversación · aceptada · declinada. **No es un chat perdido en
 * Instagram donde mi mensaje se hunde entre historias.**»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **TESIS (Ley 14):** *tu mensaje llegó, hay alguien del otro lado y esto tiene
 * un estado que podés ver.*
 *
 * **FIRMA (Ley 15):** el estado, dicho en voz humana arriba de todo. Es lo
 * único que la persona vino a saber; los mensajes son la evidencia.
 *
 * **CHANEL (Ley 16):** se quitó la fecha de cada mensaje. *En una conversación
 * de cuatro mensajes, el sello de hora en cada uno es ruido con formato de
 * dato* — la fecha que importa es la del hilo, y está en el estado.
 *
 * ── 🔴 LO QUE NO HACE, Y NO ES RECORTE ──────────────────────────────────
 * · **No deriva el silencio de los 5 días.** §5 dice que si el refugio no
 *   responde en cinco días, e-PetPlace avisa — **y ese reloj es del motor**
 *   (`obtener_solicitudes_en_silencio`). *Si lo recalculara acá con la fecha
 *   del hilo, el día que el motor cuente días hábiles y la pantalla cuente
 *   corridos, las dos dirían cosas distintas sobre el mismo hilo.* El aviso
 *   llega por su canal; acá se muestra el estado.
 * · **No ACEPTA — pero sí DESISTE, y la distinción es del motor.**
 *   ⏪ Acá decía *«no cierra ni acepta: `cerrarSolicitudAdopcion` es del
 *   PUBLICADOR»*, y era **media verdad escrita como verdad entera**. D lo midió
 *   contra el motor y la asimetría es otra: ***sólo el publicador ACEPTA;
 *   declinar pueden los dos*** (`S112-D-para-C-CONTRATO-DEL-HILO` §③).
 *   ⇒ «Aceptar» sigue sin dibujarse de este lado —§10.2: *la plataforma jamás
 *   asigna, aprueba ni puntúa adoptantes*, y el adoptante tampoco se acepta a
 *   sí mismo—, pero **«ya no quiero adoptar» es suyo y ahora está**.
 *   *Un comentario que describe de menos se lee igual que uno que describe de
 *   más: las dos veces el próximo lector cree que el caso no existe.*
 * · **No muestra al solicitante.** Es él: `MiSolicitud` trae `publicadorNombre`
 *   y no trae solicitante, **a propósito** — cada lado ve al otro.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarraEscribir,
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
  EstadoSolicitudAdopcion as EscaleraSolicitud,
  EstadoVacio,
  HojaConfirmacionDestructiva,
  Tarjeta,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { armarHilo, type FilaDelHilo } from '@epetplace/domain';
import {
  etiquetaDeDiaDeMensaje,
  horaCortaDeMensaje,
  obtenerIdiomaActual,
} from '@epetplace/i18n';
import {
  desistirSolicitudAdopcion,
  marcarHiloLeido,
  obtenerSesion,
  resolverUrlGenericaEspecie,
  obtenerMisSolicitudesAdopcion,
  responderSolicitudAdopcion,
  resolverUrlsFotos,
  type MiSolicitud,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Los borradores vivos, por hilo. **Sólo en memoria**: sobrevive a la
 *  pantalla y no al cierre de la app — que es lo que §2.4 pide («cuando vuelvo
 *  a ese hilo»), sin escribir en disco un texto que la persona no envió. */
const BORRADORES = new Map<string, string>();

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'noEsta' }
  | { fase: 'listo'; hilo: MiSolicitud; cara: string | null };

export default function HiloSolicitud() {
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  /* ⭐ **C4 · BORRADOR POR HILO.** §2.4: *«si me voy sin enviar, lo que
     escribí sigue ahí cuando vuelvo a ese hilo»*. Vive en un módulo y no en el
     estado porque **el estado muere al desmontar la pantalla**, que es
     exactamente cuando hay que conservarlo. Y va por `solicitudId`: *un
     borrador global aparecería en la conversación equivocada, que es peor que
     perderlo.* */
  const [borrador, setBorradorLocal] = useState(() => BORRADORES.get(solicitudId) ?? '');
  const setBorrador = useCallback(
    (v: string) => {
      setBorradorLocal(v);
      if (v.length === 0) BORRADORES.delete(solicitudId);
      else BORRADORES.set(solicitudId, v);
    },
    [solicitudId],
  );
  const [enviando, setEnviando] = useState(false);
  const [intento, setIntento] = useState(0);
  /** P1: desistir es irreversible (`declinada` es terminal para los dos), así
   *  que pasa por doble confirmación con el sujeto nombrado. */
  const [desistiendo, setDesistiendo] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  /** Mi uid. **No hay campo «mío» en el contrato**: el lado de la burbuja se
   *  decide comparando `autorUserId` contra la sesión (contrato de D). */
  const [miUid, setMiUid] = useState('');
  const idioma = obtenerIdiomaActual();
  const [escaleraAbierta, setEscaleraAbierta] = useState(true);
  const [alFondo, setAlFondo] = useState(true);
  const [nuevosSinVer, setNuevosSinVer] = useState(0);
  /**
   * ⭐ **C5 · ENVÍO OPTIMISTA.** Los míos que todavía no confirmó el servidor.
   * §2.5: *«al enviar, el mensaje aparece al instante en la lista y el campo se
   * vacía; si falla, queda con "No se envió · Reintentar"»*.
   *
   * 🔴 **Viven APARTE de los del servidor y no se mezclan en el estado del
   * hilo**: cuando la recarga trae el mensaje ya confirmado, el optimista se
   * retira por su `clientId`. *Fusionarlos obligaría a adivinar cuál del
   * servidor corresponde a cuál mío —el motor no devuelve mi id— y el día que
   * dos mensajes tengan el mismo texto, uno se duplicaría en pantalla.*
   */
  const [enVuelo, setEnVuelo] = useState<
    { clientId: string; cuerpo: string; estado: 'enviando' | 'no_se_envio' }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        /* Las dos JUNTAS: el uid decide de qué lado va cada burbuja y no es
           precondición de la lista (`L-223` — lo que se paga es la CADENA). */
        const [r, ses] = await Promise.all([obtenerMisSolicitudesAdopcion(), obtenerSesion()]);
        if (vigente && ses.ok && ses.data !== null) setMiUid(ses.data.user_id);
        if (!vigente) return;
        /* Ley 13: el fallo JAMÁS se disfraza de «no existe». *Decirle que su
           solicitud no está cuando lo que falló fue la red es hacerle creer que
           se perdió.* */
        if (!r.ok) {
          setEstado({ fase: 'error' });
          return;
        }
        const hilo = r.data.find((s) => s.solicitudId === solicitudId) ?? null;
        if (hilo === null) {
          setEstado({ fase: 'noEsta' });
          return;
        }
        /* ⭐ **C4 · SE MARCA LEÍDO AL ABRIR** (§2.4). Se pide **una vez por
           carga** y no se espera: el contador de la lista es del servidor, así
           que si esto falla el número queda alto y se corrige la próxima —
           *bloquear el hilo por un contador sería cambiar lo importante por lo
           accesorio*.
           ⚠️ Va con `void` a propósito y NO dentro del `Promise.all`: **su
           resultado no lo dibuja nadie.** */
        void marcarHiloLeido(hilo.solicitudId);
        const caras =
          hilo.mascotaFotoUrl === null
            ? new Map<string, string>()
            : await resolverUrlsFotos([hilo.mascotaFotoUrl]);
        if (!vigente) return;
        const foto = hilo.mascotaFotoUrl === null ? null : (caras.get(hilo.mascotaFotoUrl) ?? null);
        setEstado({ fase: 'listo', hilo, cara: foto });
      })();
      return () => {
        vigente = false;
      };
    }, [solicitudId, intento]),
  );

  /* ⏪ **ACÁ VIVÍA UN MAPEO ESTADO→COLOR ESCRITO A MANO**, y su gemelo idéntico
     en `solicitudes.tsx`: *el mismo criterio de producto, en dos archivos, sin
     nada que los obligue a coincidir.* La pieza de B (`EstadoSolicitudAdopcion`)
     lo lleva ADENTRO y su cabecera nombra el modo de falla exacto: *«una
     pantalla que armara la escalera a mano podría marcar 'declinada' como hecho
     y compilaría perfecto»*. Se monta la pieza y el mapeo muere (Ley 37). */

  /* ═══ C4 · LOS NUEVOS LLEGAN SOLOS ══════════════════════════════════════

     🔴 **SONDEO DE 5 s, Y ESTÁ DECLARADO PORQUE LA LETRA LO PIDE ASÍ.** §2.4:
     *«realtime de la casa si existe para esta tabla; si no, sondeo cada 5 s con
     la pantalla en foco, **y se declara cuál**»*.

     **Medido contra la base:** la publicación `supabase_realtime` tiene **14
     tablas** —`bonos`, `estadias`, `notificaciones`, `pedidos`…— y
     **`adopcion_mensaje` NO está**. ⇒ sondeo.

     ⚠️ **Sólo en foco**, que es la mitad que evita el costo: `useFocusEffect`
     limpia el intervalo al salir. *Un sondeo que sigue corriendo con la
     pantalla cerrada es una petición cada cinco segundos por una conversación
     que nadie está mirando* — `L-223` con reloj. */
  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => setIntento((n) => n + 1), 5000);
      return () => clearInterval(id);
    }, []),
  );

  /**
   * ⭐ **C5 · ENVIAR, OPTIMISTA.** El mensaje se ve **antes** de que el servidor
   * conteste (§2.7), y si falla queda con su salida.
   *
   * 🔴 **El campo se vacía ANTES del viaje, no después.** Vaciarlo al volver
   * deja el texto a la vista mientras la burbuja ya existe abajo — *el mismo
   * mensaje dos veces en pantalla, y quien lo ve toca enviar de nuevo.*
   */
  const enviar = async (texto: string) => {
    const cuerpo = texto.trim();
    /* §2.5: *«un mensaje sólo de espacios no se envía»*. El `trim` no es
       cosmético: sin él se manda una burbuja vacía que el otro lado recibe. */
    if (cuerpo.length === 0 || estado.fase !== 'listo') return;
    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setEnVuelo((xs) => [...xs, { clientId, cuerpo, estado: 'enviando' }]);
    setBorrador('');
    const r = await responderSolicitudAdopcion({ solicitudId: estado.hilo.solicitudId, cuerpo });
    if (!r.ok) {
      /* **No se muestra un aviso Y se marca la burbuja: sólo la burbuja.** El
         aviso se va solo y deja un mensaje que parece enviado; la burbuja se
         queda con su salida al lado. *El estado y su reintento se leen
         juntos.* */
      setEnVuelo((xs) =>
        xs.map((x) => (x.clientId === clientId ? { ...x, estado: 'no_se_envio' as const } : x)),
      );
      return;
    }
    /* El optimista se retira y la recarga trae el confirmado. Se retira POR
       `clientId` y no por texto: dos mensajes iguales son legales. */
    setEnVuelo((xs) => xs.filter((x) => x.clientId !== clientId));
    setIntento((n) => n + 1);
  };

  const reintentar = async (clientId: string) => {
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
    setIntento((n) => n + 1);
  };

  /* ═══ C3 · EL HILO ARMADO ═════════════════════════════════════════════
     El agrupado, los separadores de día y el orden invertido viven en
     `armarHilo` (`packages/domain`): es derivación pura y **la misma en las dos
     superficies**. *Dos copias serían dos reglas de agrupado que divergen el
     día que alguien toque una.*

     Los optimistas se anexan como mensajes normales con mi `uid`, así que **el
     agrupado los agrupa igual**: si mando tres seguidos, se ven pegados antes
     de que el servidor conteste, como se verán después. */
  const filas = useMemo(() => {
    if (estado.fase !== 'listo') return [];
    const ahora = new Date().toISOString();
    return armarHilo([
      ...estado.hilo.mensajes,
      ...enVuelo.map((x) => ({
        mensajeId: `local:${x.clientId}`,
        autorUserId: miUid,
        cuerpo: x.cuerpo,
        automatica: false,
        creadoEn: ahora,
      })),
    ]);
  }, [estado, enVuelo, miUid]);

  /** Cuántos ajenos llegaron desde la última vez que estuve al fondo. */
  const ajenosVistos = useRef(0);
  useEffect(() => {
    if (estado.fase !== 'listo') return;
    const ajenos = estado.hilo.mensajes.filter((m) => m.autorUserId !== miUid).length;
    if (alFondo) {
      /* Al fondo, lo nuevo YA SE VE: la cuenta se pone al día en vez de
         acumular. *Una pastilla sobre un mensaje visible enseña a ignorarla.* */
      ajenosVistos.current = ajenos;
      setNuevosSinVer(0);
      return;
    }
    setNuevosSinVer(Math.max(0, ajenos - ajenosVistos.current));
  }, [estado, alFondo, miUid]);

  const renderFila = (f: FilaDelHilo) => {
    if (f.tipo === 'dia') {
      return (
        <SeparadorDia
          etiqueta={etiquetaDeDiaDeMensaje(f.fechaIso, idioma, {
            hoy: t('hiloAdopcion.hoy'),
            ayer: t('hiloAdopcion.ayer'),
          })}
        />
      );
    }
    if (f.tipo === 'evento') {
      /* §2.3: los hechos del trámite van **en el hilo, centrados, como una
         etiqueta**, y si piden algo mío llevan su carta debajo. *Así el chat
         cuenta la historia entera y no hay que buscar el siguiente paso en otro
         lado.* */
      return (
        <EventoDelHilo
          etiqueta={f.evento.etiqueta}
          accion={
            f.evento.pideAccion === true && estado.fase === 'listo' ? (
              <Boton
                variante="primario"
                tamaño="sm"
                etiqueta={t('hiloAdopcion.verActa')}
                onPress={() =>
                  router.push({
                    pathname: '/adoptar/acta/[solicitudId]',
                    params: { solicitudId: estado.hilo.solicitudId },
                  })
                }
              />
            ) : undefined
          }
        />
      );
    }
    const m = f.mensaje;
    const mio = m.autorUserId === miUid;
    const enVueloDeEste = m.mensajeId.startsWith('local:')
      ? enVuelo.find((x) => `local:${x.clientId}` === m.mensajeId)
      : undefined;
    /* La hora se pasa **SIEMPRE** aunque no se dibuje: la pieza la calla donde
       no va. *Si la pantalla eligiera cuándo pasarla, la regla «la hora va bajo
       el último del grupo» viviría en cada consumidor* (decisión de B). */
    const hora = horaCortaDeMensaje(m.creadoEn, idioma);
    if (!mio) {
      return (
        <BurbujaMensaje
          mio={false}
          texto={
            /* 🔴 La automática se DICE. *Un texto que el refugio no escribió a
               esta familia, presentado como si lo hubiera escrito, le hace creer
               que ya le contestaron* — y el reloj de los cinco días, que la
               ignora a propósito, seguiría corriendo sin que ella entienda por
               qué. ⚠️ Y **sí lleva autor**: A midió que la tabla rebota
               `mensaje_sin_autor`, así que la escribió una persona del refugio;
               `automatica` dice CÓMO se envió, no que no tenga dueño. */
            m.automatica ? `${t('hiloAdopcion.automatica')}\n${m.cuerpo}` : m.cuerpo
          }
          hora={hora}
          posicion={f.posicion}
          autor={f.abreGrupo ? (estado.fase === 'listo' ? (estado.hilo.publicadorNombre ?? undefined) : undefined) : undefined}
        />
      );
    }
    /* 🔴 **DOS RAMAS EXPLÍCITAS Y NO UN OBJETO CON TERNARIOS**, y el tipo de B
       me obligó: la rama `no_se_envio` **exige** `onReintentar` y
       `vozReintentar`, así que pasarlas como `X | undefined` no compila. *Su
       unión no admite «tal vez tiene salida»: un fallo sin salida deja a la
       persona creyendo que mandó algo que no mandó.* El typecheck lo dijo antes
       que cualquier gate. */
    if (enVueloDeEste?.estado === 'no_se_envio') {
      const clientId = enVueloDeEste.clientId;
      return (
        <BurbujaMensaje
          mio
          texto={m.cuerpo}
          hora={hora}
          posicion={f.posicion}
          estado="no_se_envio"
          onReintentar={() => void reintentar(clientId)}
          vozReintentar={t('hiloAdopcion.noSeEnvio')}
        />
      );
    }
    return (
      <BurbujaMensaje
        mio
        texto={m.cuerpo}
        hora={hora}
        posicion={f.posicion}
        estado={enVueloDeEste === undefined ? 'enviado' : 'enviando'}
      />
    );
  };


  /**
   * DESISTIR — «ya no quiero adoptar a Luna».
   *
   * 🔴 **No es un botón de cancelar: es una decisión terminal**, y el motor la
   * trata como tal (`declinada` cierra el hilo para los DOS lados). Por eso va
   * con doble confirmación (P1) y **no se ofrece sobre un hilo ya cerrado**
   * (Ley 23: la puerta no ofrece lo que va a rechazar — ahí el motor devuelve
   * `solicitud_terminal`).
   *
   * ⚠️ **Y se queda en la pantalla en vez de volver atrás.** Volver dejaría a la
   * persona en la lista sin ver qué pasó con lo que acaba de decidir; quedarse
   * le muestra el estado nuevo —«No siguió»— dicho por el mismo lugar donde
   * decidió. *La confirmación de un acto es el acto reflejado, no una pantalla
   * distinta.*
   */
  const desistir = async () => {
    if (estado.fase !== 'listo' || trabajando) return;
    setTrabajando(true);
    try {
      /* ⏪ Esto llamaba a `cerrarSolicitudAdopcion({estadoFinal:'declinada'})`,
         que era lo correcto contra el CHECK de entonces. **Hoy `desistida` es un
         estado propio** y tiene su verbo: *declinar es del publicador; desistir
         es de la familia, y reusar el mismo haría que el refugio viera «yo la
         decliné» sobre alguien que se fue solo.* */
      const r = await desistirSolicitudAdopcion(estado.hilo.solicitudId);
      if (!r.ok) {
        mostrar({ variante: 'error', texto: r.mensaje });
        return;
      }
      setDesistiendo(false);
      setIntento((n) => n + 1);
    } finally {
      setTrabajando(false);
    }
  };

  const cerrado = estado.fase === 'listo' && estado.hilo.cerradaEn !== null;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={estado.fase === 'listo' ? estado.hilo.mascotaNombre : t('hiloAdopcion.titulo')}
        atras
        onAtras={() => router.back()}
      />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={72} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('hiloAdopcion.errorTitulo')}
            descripcion={t('hiloAdopcion.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('hiloAdopcion.reintentar')}
                onPress={() => setIntento((n) => n + 1)}
              />
            }
          />
        </View>
      ) : estado.fase === 'noEsta' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('hiloAdopcion.noEstaTitulo')}
            descripcion={t('hiloAdopcion.noEstaDetalle')}
          />
        </View>
      ) : (
        <SuperficieChat
          /* ═══ C1 · EL TECLADO ═══════════════════════════════════════════
             🔴 **EL ROJO ERA ESTE ARCHIVO.** Medido antes de tocar: esta
             pantalla montaba un `ScrollView` y **cero manejo de teclado** —ni
             `EvitaTeclado`—, así que al enfocar el campo **el teclado lo
             tapaba**. Es el defecto que el founder ve.

             Y la mitad que no se veía: el hilo del refugio **sí** tenía
             `EvitaTeclado`, pero con un `ScrollView` plano sin anclar al final.
             *Dos comportamientos distintos para la misma conversación* — que es
             exactamente lo que «las dos apps con la misma calidad» viene a
             corregir, y por lo que esto es UNA pieza y no dos composiciones.

             La pieza resuelve el inset animado, la lista invertida anclada al
             final, la barra pegada al teclado, el cierre al deslizar y el borde
             inferior. Acá sólo se le dice QUÉ dibujar. ── */
          encabezado={
            <View style={{ gap: spacing[3] }}>
              <CabeceraHilo
                animal={{
                  nombre: estado.hilo.mascotaNombre,
                  fotoUrl: estado.cara,
                  fotoDeEspecie: resolverUrlGenericaEspecie(estado.hilo.mascotaEspecie),
                  onPress: () =>
                    router.push({
                      pathname: '/adoptar/[publicacionId]',
                      params: { publicacionId: estado.hilo.publicacionId },
                    }),
                }}
                contraparte={{
                  nombre: estado.hilo.publicadorNombre ?? t('hiloAdopcion.refugioSinNombre'),
                  /* 🔴 **§2.1 PIDE «toco el refugio y voy a su vitrina» Y HOY NO
                     SE PUEDE**, medido: `MiSolicitud` trae `publicadorNombre` y
                     **no trae la cuenta comercial**, que es el id con el que la
                     vitrina se resuelve (`obtenerPerfilesPublicosPorCuenta`).

                     No se pasa `onPress`, así que **la pieza no lo hace tocable**
                     y no promete un camino que no existe (Ley 23). Pedido a A:
                     `publicadorCuentaId` en el lector de la familia. */
                }}
              />

              {/* ═══ C2 · LA ESCALERA, COLAPSABLE ═════════════════════════
                  §1: *«arriba del hilo, colapsable… se colapsa sola cuando
                  empiezo a escribir»*.

                  🔑 **Colapsar es de la PANTALLA, no de la pieza**, y B lo dejó
                  dicho: `EstadoSolicitudAdopcion` no sabe que está arriba de un
                  hilo ni que alguien empezó a escribir. *Ese es un hecho del
                  campo de texto, que vive de este lado.*

                  🔴 **Y con el animal en memorial no se dibuja NADA** —ni fila
                  ni línea—, que es decisión tomada: *no se le dice dos veces la
                  misma noticia a alguien que acaba de perder al animal que
                  eligió.* */}
              {estado.hilo.estado === 'no_concretada_fallecimiento' ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('hiloAdopcion.escaleraAlternar')}
                  onPress={() => setEscaleraAbierta((v) => !v)}
                >
                  <EscaleraSolicitud
                    estado={estado.hilo.estado}
                    registro={escaleraAbierta ? 'completa' : 'compacta'}
                    voces={{
                      recibida: t('hiloAdopcion.estado_recibida'),
                      enConversacion: t('hiloAdopcion.estado_en_conversacion'),
                      aceptada: t('hiloAdopcion.estado_aceptada'),
                    }}
                    vozDeclinada={t('hiloAdopcion.estado_declinada')}
                    vozDesistida={t('hiloAdopcion.estado_desistida')}
                    vozNoConcretada={t('hiloAdopcion.estado_no_concretada', { nombre: estado.hilo.mascotaNombre })}
                    vozOtraFamilia={t('hiloAdopcion.estado_otra_familia', { nombre: estado.hilo.mascotaNombre })}
                  />
                </Pressable>
              )}
            </View>
          }
          datosDelMasNuevoAlMasViejo={filas}
          claveDe={(f) => f.clave}
          renderMensaje={(f) => renderFila(f)}
          onAlFondoCambia={setAlFondo}
          sobrepuesto={
            /* ═══ C4 · LA PASTILLA ═══════════════════════════════════════
                §2.4: *«si estoy leyendo arriba y llega uno, no me arrastran»*.
                Sólo cuando hay algo nuevo **y** no estoy al fondo: al fondo el
                mensaje ya se ve, y una pastilla sobre algo visible enseña a
                ignorarla. */
            !alFondo && nuevosSinVer > 0 ? (
              <PastillaNuevoMensaje
                etiqueta={t('hiloAdopcion.nuevos', { n: nuevosSinVer })}
                onPress={() => {
                  setNuevosSinVer(0);
                  setAlFondo(true);
                }}
              />
            ) : null
          }
          barra={
            cerrado ? (
              /* ═══ C5 · LA VARIANTE EN LECTURA ══════════════════════════
                  §2.6: la barra **se reemplaza por una línea en el mismo
                  lugar**, no desaparece. *Un campo que se va deja el hilo con
                  cara de roto; una línea que dice por qué lo deja cerrado.*

                  🔴 **Con el animal fallecido NO hay línea** (decisión tomada):
                  la escalera ya no se dibuja y ésta sería la misma noticia por
                  segunda vez, en lenguaje de formulario. */
              estado.hilo.estado === 'no_concretada_fallecimiento' ? null : (
                <BarraEscribir enLectura={t('hiloAdopcion.cerrado')} />
              )
            ) : (
              <BarraEscribir
                valor={borrador}
                onCambio={(v) => {
                  setBorrador(v);
                  /* §1: *«se colapsa sola cuando empiezo a escribir»*. Sólo al
                     empezar: colapsarla en cada tecla pelearía con quien la
                     abrió a propósito mientras escribe. */
                  if (v.length > 0 && borrador.length === 0) setEscaleraAbierta(false);
                }}
                onEnviar={(texto) => void enviar(texto)}
                placeholder={t('hiloAdopcion.escribirlePlaceholder', {
                  refugio: estado.hilo.publicadorNombre ?? t('hiloAdopcion.refugioSinNombre'),
                })}
                /* 🔴 **VA LA PALABRA, NO UN GLIFO, Y ES DELIBERADO.**
                   §2.5 pide *«el glifo de enviar»* y **el registry no lo
                   tiene**: 40 nombres y ninguno dice enviar (medido por B, y lo
                   verifiqué contra `IconoNombre` — tampoco hay `chevron`).

                   Los candidatos cercanos son `compartir` y `correo`, y los dos
                   **mienten**: compartir es mandar afuera, correo es email, y
                   esto no es ninguna de las dos. *Un glifo con dos significados
                   es informar sin informar* — la casa lo prohíbe, y prestarlo
                   acá le enseñaría a la familia que ese dibujo significa dos
                   cosas en dos pantallas.

                   **La palabra no miente**: dice exactamente lo que hace, se
                   atenúa y se enciende igual, y no ocupa un nombre del registry
                   que después habría que desalojar. ☠️ **Muere el día que §6b
                   dé su glifo** — es la misma deuda que B declaró, resuelta del
                   lado honesto mientras tanto. */
                glifoEnviar={<Texto variante="dato">{t('hiloAdopcion.enviar')}</Texto>}
                etiquetaEnviar={t('hiloAdopcion.enviar')}
              />
            )
          }
        />
      )}

      {/* ── P1 · LA DOBLE CONFIRMACIÓN, con el SUJETO nombrado ── */}
      <HojaConfirmacionDestructiva
        visible={desistiendo}
        onCerrar={() => setDesistiendo(false)}
        titulo={t('hiloAdopcion.desistirTitulo')}
        sujeto={estado.fase === 'listo' ? estado.hilo.mascotaNombre : ''}
        etiquetaConfirmar={t('hiloAdopcion.desistirConfirmar')}
        etiquetaCancelar={t('hiloAdopcion.cancelar')}
        trabajando={trabajando}
        onConfirmar={() => void desistir()}
      >
        <Texto variante="cuerpo">{t('hiloAdopcion.desistirCuerpo')}</Texto>
      </HojaConfirmacionDestructiva>
    </SafeAreaView>
  );
}
