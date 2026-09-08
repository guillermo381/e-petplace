/**
 * S114-C · LA PANTALLA DEL CASO — §3 de `DIRECCION_POSTVENTA`.
 *
 * TESIS (Ley 14): *arriba sé en qué paso estoy; abajo, la conversación.*
 *
 * FIRMA (Ley 15): **es la escalera del pedido y el chat de la adopción**, sin
 * una pieza nueva. §3 lo pide con esas palabras: *«no aprendo nada nuevo»*.
 * `SuperficieChat` trae el teclado que no tapa, la lista invertida anclada al
 * final y la barra pegada al teclado — **los tres requisitos de N16 vienen con
 * ella**, no se re-implementan acá.
 *
 * CHANEL (Ley 16): la cabecera **nunca dice el monto** (§3.2) — la plata se
 * habla en su carta. La pieza de B lo hace inexpresable: no tiene por dónde.
 *
 * ── LOS TRES ASIENTOS (§3.3) ────────────────────────────────────────────
 * Los míos a la derecha; el prestador y la casa a la izquierda, **cada uno con
 * su cara**. El color marca DE QUIÉN es, jamás importancia (N23).
 *
 * ── EL CONTRATO DE PUREZA DE `SuperficieChat`, y por qué el item es gordo ──
 * Las filas están memoizadas por item, así que **todo lo que la burbuja dibuja
 * viaja EN el item** — incluido el estado de envío y el reintento. Un
 * `renderMensaje` que cerrara sobre estado de la pantalla no repintaría cuando
 * ese estado cambie, y «cero filas redibujadas» sería un número pagado con
 * datos viejos en pantalla.
 *
 * ── §3.4 · «QUIERO HABLAR CON ALGUIEN» ──────────────────────────────────
 * Al pie, **siempre alcanzable, jamás en un menú**. Va en el encabezado fijo
 * y no en la lista: en la lista se iría con el scroll, y *nada de lo que hace
 * la máquina puede tapar esa puerta*.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  BarraEscribir,
  BurbujaMensaje,
  CabeceraCaso,
  CARA_EN_HILO,
  Encabezado,
  EscaleraCaso,
  EsqueletoGrupo,
  Esqueleto,
  EstadoVacio,
  EventoDelHilo,
  Icono,
  AsaModal,
  ModalDosAlturas,
  SuperficieChat,
  type AlturaModal,
  Texto,
  spacing,
  useTheme,
  type EtapaCaso as EtapaDeLaEscalera,
  type FinalCaso,
} from '@epetplace/ui';
import {
  enviarMensajeDeCaso,
  leerCaso,
  leerMensajesDeCaso,
  type AsientoCaso,
  type MensajeCaso,
} from '@epetplace/api';

import { fechaLargaHumana, horaCortaDeMensaje } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { useSinLeer } from '@/lib/postventa/useSinLeer';
import { traducirCaso, type CasoParaLaPantalla } from '@/lib/postventa/caso';
import { lineaDeEstadoParaFamilia, vocesDeLaEscalera, vozDeEtapa } from '@/lib/postventa/voz-de-etapa';
import { CartaDeDevolucion } from '@/components/postventa/CartaDeDevolucion';
import { PermisoWhatsApp } from '@/components/postventa/PermisoWhatsApp';
import { vozServicio } from '@/lib/voz-servicio';

type Fase<T> = T | 'cargando' | 'error' | 'noEsTuyo';

/**
 * La fila del hilo. **Lleva TODO lo que su burbuja dibuja** — ver el contrato
 * de pureza de la cabecera.
 */
type Fila = {
  clave: string;
  mensaje: MensajeCaso;
  /** Optimista: todavía viajando, o falló y se puede reintentar. */
  estado?: 'enviando' | 'no_se_envio';
  /** El texto original, para poder reintentarlo sin releer el hilo. */
  textoCrudo?: string;
};

/**
 * 🔴 EL MAPA DEL FINAL — **y acá se cobró la divergencia de vocabulario.**
 *
 * Tenía `t(`postventa.final_${caso.finalAlterno}`)`, e interpolar así **une
 * dos vocabularios distintos sin que nadie lo note**: `finalAlterno` viene en
 * el nombre de B (`resuelto_entre_ustedes`) y mis llaves estaban escritas con
 * el de A (`resuelto_entre_partes`). *El resultado no fue un error: fue la
 * LLAVE CRUDA en pantalla* — `postventa.final_resuelto_entre_ustedes`, leída
 * por una familia. **Ningún typecheck lo ve: la interpolación produce un
 * `string` y el cast lo deja pasar.**
 *
 * ⇒ `Record` completo sobre el tipo de B: un final nuevo no compila.
 */
const VOZ_FINAL: Record<FinalCaso, 'postventa.final_resuelto_entre_partes' | 'postventa.final_retirado' | 'postventa.final_sin_lugar'> = {
  resuelto_entre_ustedes: 'postventa.final_resuelto_entre_partes',
  retirado: 'postventa.final_retirado',
  sin_lugar: 'postventa.final_sin_lugar',
};

const VOZ_ASIENTO: Record<AsientoCaso, 'postventa.asientoCasa' | 'postventa.asientoPrestador' | 'postventa.asientoFamilia'> = {
  casa: 'postventa.asientoCasa',
  prestador: 'postventa.asientoPrestador',
  familia: 'postventa.asientoFamilia',
};

export default function PantallaDelCaso() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { casoId } = useLocalSearchParams<{ casoId?: string }>();

  const [caso, setCaso] = useState<Fase<CasoParaLaPantalla>>('cargando');
  const [hilo, setHilo] = useState<Fila[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [escaleraAbierta, setEscaleraAbierta] = useState(true);
  const [borrador, setBorrador] = useState('');
  /* Las filas optimistas viven en una ref además del estado: al recargar el
     hilo desde el motor hay que conservarlas, y leerlas del estado adentro de
     un callback traería la copia del render viejo. */
  const optimistasRef = useRef<Fila[]>([]);

  /* ═══ §3 (enmienda firmada) · LA HOJA DEL CHAT ══════════════════════════
     *«Al entrar veo el seguimiento del caso, entero y sin nada encima; el chat
     vive abajo, en una hoja que subo cuando quiero hablar.»*

     Arranca CERRADA: lo primero que la familia ve es en qué quedó su caso, no
     una conversación. La escalera queda detrás y se ve o no según la altura. */
  const [altura, setAltura] = useState<AlturaModal>('cerrado');
  const { height: altoPantalla } = useWindowDimensions();

  /* 🔴 `altoTeclado` es lo ÚNICO que hay que pasarle a la hoja (R81), y es
     obligatorio: sin él el teclado empuja el panel entero. Ya le pasó al
     consumidor vivo y lo dejó escrito quien lo pagó. **El resto lo resuelve el
     contexto**: la hoja declara que el teclado está resuelto y `SuperficieChat`
     lo lee — no hay prop que olvidar (contrato de B, `47b20a4c`). */
  const [altoTeclado, setAltoTeclado] = useState(0);
  const insets = useSafeAreaInsets();

  /* ⏪ **ACÁ VIVÍA LA SUBIDA A `completo` CON EL TECLADO ABIERTO, y se fue a
     la pieza — decisión de B, con su propia `R81` como argumento.** Yo la había
     puesto acá razonando que era una decisión de ESTA pantalla; su corrección
     es mejor y usa mi propia frase: *«la hoja hace lo correcto y aun así la
     barra queda tapada; es aritmética, no defecto»* ⇒ **el consumidor no puede
     saber que su barra no entra; la hoja sí**, y le pasa a cualquiera que
     ponga un campo en `medio`.

     *Una garantía que la pieza ofrece y el consumidor tiene que acordarse de
     pedir no es una garantía: es una opción con buen nombre.* Hoy no hay nada
     que montar acá — la hoja sube su geometría sola y vuelve al cerrar. */
  useEffect(() => {
    const sube = Keyboard.addListener('keyboardDidShow', (e) => setAltoTeclado(e.endCoordinates.height));
    const baja = Keyboard.addListener('keyboardDidHide', () => setAltoTeclado(0));
    return () => {
      sube.remove();
      baja.remove();
    };
  }, []);

  const cargar = useCallback(async () => {
    if (typeof casoId !== 'string' || casoId.length === 0) return;
    const [c, m] = await Promise.all([leerCaso(casoId), leerMensajesDeCaso(casoId)]);

    if (!c.ok) {
      setCaso(c.codigo === 'no_es_tuyo' ? 'noEsTuyo' : 'error');
      return;
    }
    setCaso(traducirCaso(c.data));

    if (m.ok) {
      const delMotor: Fila[] = m.data.mensajes.map((x) => ({ clave: x.id, mensaje: x }));
      /* Las optimistas que el motor todavía no devuelve siguen arriba; las
         que ya volvieron se caen solas al coincidir el id. */
      /* 🔴 **ACÁ ESTABA LA DUPLICACIÓN QUE EL FOUNDER VIO** —«uno con check y
         otro con punto»— y era un guard que no podía funcionar nunca.

         ⏪ Decía: `idsDelMotor.has(f.clave)`. Pero la clave de una optimista es
         `local-<timestamp>` y la del motor es un UUID: **jamás coinciden**, así
         que el filtro devolvía SIEMPRE true y la optimista sobrevivía al lado
         de la fila real. *Un guard que compara dos cosas que por construcción
         no pueden ser iguales no filtra nada — y no falla: acumula.*

         La cura no es comparar mejor: es preguntar lo correcto. **Si el envío
         salió bien y el motor ya devolvió el hilo, toda optimista que estaba
         `enviando` YA ESTÁ ahí.** Sobreviven sólo las que fallaron, que son las
         que la familia puede reintentar y cuyo texto no se puede perder. */
      optimistasRef.current = optimistasRef.current.filter((f) => f.estado === 'no_se_envio');
      /* ⚠️ ASCENDENTE — viejo primero, el orden en que el motor entrega
         (`ORDER BY m.creado_en, m.id`, medido en la migración). Las optimistas
         son lo MÁS NUEVO y por eso van al final. La inversión para la lista
         ocurre en UN solo lugar, abajo. */
      setHilo([...delMotor, ...optimistasRef.current]);
      setCursor(m.data.cursor);
    }
  }, [casoId]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        if (vigente) await cargar();
      })();
      return () => {
        vigente = false;
      };
    }, [cargar]),
  );

  /**
   * 🔴 **Trae los SIGUIENTES, no los anteriores** — y el nombre lo dice porque
   * la prop de la pieza se llama así. Medido en el motor: el cursor filtra
   * `(creado_en, id) > cursor` (`20260911610000:428`), así que la primera
   * página son los 50 MÁS VIEJOS y cada página siguiente trae los más nuevos.
   * La lista invertida, en cambio, pide más cuando el dedo sube hacia lo viejo.
   *
   * ⚠️ **Van en direcciones opuestas, y hoy no se nota porque ningún caso llega
   * a 50 mensajes.** Es un defecto DORMIDO, y su modo de falla es feo: subir en
   * un hilo largo mostraría lo que vino DESPUÉS. Se reporta a A —paginar hacia
   * atrás no existe en el motor— y no se disfraza acá: agregar al final es lo
   * correcto para el arreglo ascendente, y lo que falta es del otro lado.
   */
  const cargarAnteriores = useCallback(async () => {
    if (typeof casoId !== 'string' || cursor === null) return;
    const m = await leerMensajesDeCaso(casoId, cursor);
    if (!m.ok) return;
    setHilo((prev) => [...prev, ...m.data.mensajes.map((x) => ({ clave: x.id, mensaje: x }))]);
    setCursor(m.data.cursor);
  }, [casoId, cursor]);

  const enviar = useCallback(
    async (texto: string) => {
      if (typeof casoId !== 'string') return;
      const claveLocal = `local-${Date.now()}`;
      const optimista: Fila = {
        clave: claveLocal,
        estado: 'enviando',
        textoCrudo: texto,
        mensaje: {
          id: claveLocal,
          autor: 'familia',
          tipo: 'mensaje',
          cuerpo: texto,
          creadoEn: new Date().toISOString(),
        },
      };
      /* 🔴 **AL FINAL, no al principio.** El estado `hilo` es ASCENDENTE
         (viejo→nuevo) desde que curé el orden; ponerlo primero lo dibujaba
         como el MÁS VIEJO — arriba de todo en la lista invertida. *El mismo
         arreglo dado vuelta dos veces: una en el orden y otra en el envío.* */
      optimistasRef.current = [...optimistasRef.current, optimista];
      setHilo((prev) => [...prev, optimista]);
      setBorrador('');

      const r = await enviarMensajeDeCaso(casoId, texto);
      if (r.ok) {
        await cargar();
        return;
      }
      /* «No se envió · Reintentar» — el texto NO se pierde: viaja en el item,
         que es de donde el reintento lo va a sacar. */
      const fallida: Fila = { ...optimista, estado: 'no_se_envio' };
      optimistasRef.current = optimistasRef.current.map((f) => (f.clave === claveLocal ? fallida : f));
      setHilo((prev) => prev.map((f) => (f.clave === claveLocal ? fallida : f)));
    },
    [casoId, cargar],
  );

  const renderFila = useCallback(
    (f: Fila) => {
      /* §3.3 · los hechos del trámite van CENTRADOS, como etiqueta. */
      if (f.mensaje.tipo === 'hecho') {
        return <EventoDelHilo etiqueta={f.mensaje.cuerpo} />;
      }

      const hora = horaCortaDeMensaje(f.mensaje.creadoEn, idioma);

      if (f.mensaje.autor === 'familia') {
        /* 🔴 LAS TRES RAMAS SON EXPLÍCITAS y no un spread condicional: la
           unión de B exige que `no_se_envio` traiga **su salida Y su palabra
           juntas** —*un fallo sin salida deja a la persona creyendo que mandó
           algo que no mandó*— y un spread no se lo puede probar al tipo. */
        if (f.estado === 'no_se_envio' && f.textoCrudo !== undefined) {
          const texto = f.textoCrudo;
          return (
            <BurbujaMensaje
              mio
              texto={f.mensaje.cuerpo}
              hora={hora}
              estado="no_se_envio"
              onReintentar={() => {
                void enviar(texto);
              }}
              vozReintentar={t('postventa.noSeEnvio')}
            />
          );
        }
        return (
          <BurbujaMensaje
            mio
            texto={f.mensaje.cuerpo}
            hora={hora}
            estado={f.estado === 'enviando' ? 'enviando' : 'enviado'}
          />
        );
      }

      /* §3.3 · los otros dos asientos, cada uno con su cara y su nombre. El
         color marca DE QUIÉN es, jamás importancia (N23). */
      return (
        <BurbujaMensaje
          mio={false}
          texto={f.mensaje.cuerpo}
          hora={hora}
          autor={t(VOZ_ASIENTO[f.mensaje.autor])}
          cara={
            <View
              style={{
                width: CARA_EN_HILO,
                height: CARA_EN_HILO,
                borderRadius: CARA_EN_HILO / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.bg.overlay,
              }}
            >
              <Icono nombre={f.mensaje.autor === 'casa' ? 'ayuda' : 'atender'} tamano={16} />
            </View>
          }
        />
      );
    },
    [enviar, idioma, t, theme.bg.overlay],
  );

  /* 🔴 EL ÚNICO `reverse`, y está acá para que sea el único — copiado del
     vecino ya gateado (`armarHilo`, `packages/domain/src/hiloAdopcion.ts:182`),
     que resolvió esto mismo con su razón escrita: *«agrupar sobre la lista ya
     invertida es donde nacen los grupos dados vuelta»*.

     Lo caminé y lo vi al revés: «Se resolvió…» arriba y «Recibimos tu caso»
     abajo. La causa no era el orden del motor —entrega ascendente, medido— era
     que `SuperficieChat` es INVERTIDA y yo le pasaba el arreglo tal cual. *El
     patrón estaba resuelto a dos archivos de distancia y escribí uno nuevo.*

     Los OBJETOS de fila son los mismos: invertir un arreglo no rompe la
     memoización por item que exige el contrato N16 de B. */
  const filas = useMemo(() => [...hilo].reverse(), [hilo]);

  /* Los AJENOS del hilo, para el número de la barra. `autor !== 'familia'` y
     no «los del prestador»: la casa también escribe, y un mensaje de
     e-PetPlace sin leer es tan sin leer como el otro. */
  const ajenos = useMemo(
    () => hilo.filter((f) => f.mensaje.autor !== 'familia').map((f) => ({ creadoEn: f.mensaje.creadoEn })),
    [hilo],
  );
  const { sinLeer, marcarLeido } = useSinLeer(typeof casoId === 'string' ? casoId : null, ajenos);

  /* Se marca leído al SUBIR la hoja, no al montar la pantalla: el founder
     entra a ver el seguimiento y puede irse sin abrir el chat — dar por leído
     lo que nadie miró es justo lo que el número existe para evitar. */
  useEffect(() => {
    if (altura !== 'cerrado') marcarLeido();
  }, [altura, marcarLeido]);

  if (caso === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('postventa.tituloCaso')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={64} />
            <Esqueleto alto={44} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (caso === 'error' || caso === 'noEsTuyo') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('postventa.tituloCaso')} atras onAtras={() => router.back()} />
        <EstadoVacio titulo={t(caso === 'noEsTuyo' ? 'postventa.casoNoEsTuyo' : 'postventa.casoNoSePudo')} />
      </View>
    );
  }


  /* §3.1 · la línea de abajo, ENTERA. **El plazo lo compone la pantalla**: A
     manda `plazoHasta` crudo a propósito, porque el formato de fecha es i18n. */
  /* 🔴 **LA LÍNEA DE ESTADO SALE DE LA FUENTE ÚNICA**, y el plazo es
     INEXPRESABLE desde acá: `lineaDeEstadoParaFamilia` no recibe `plazoHasta`
     y no puede recibirlo. Ver `voz-de-etapa.ts` para el porqué —lo escribí de
     dos maneras distintas en dos pantallas del mismo arco, y ningún gate lo
     vio—. *Dos lugares que coinciden hoy son dos lugares que pueden dejar de
     coincidir, y el que se desvíe no falla: dice otra cosa.* */
  const nombreEtapa = caso.etapaDeLaFila !== null ? vozDeEtapa(t, caso.etapaDeLaFila) : '';
  const vozEstado = lineaDeEstadoParaFamilia(t, caso.etapaDeLaFila) ?? ''

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('postventa.tituloCaso')} atras onAtras={() => router.back()} />
      {/* ═══ §3 · EL SEGUIMIENTO, ENTERO Y SIN NADA ENCIMA ═══════════════════
          ⏪ **Todo esto vivía adentro del `encabezado` de `SuperficieChat`**, o
          sea dentro de una lista invertida: el seguimiento scrolleaba con la
          conversación y quedaba por debajo de ella. *Al entrar, lo primero que
          la familia veía era un chat.*

          Ahora es el contenido de la pantalla y el chat vive en la hoja —
          enmienda firmada de §3: *«al entrar veo el seguimiento del caso,
          entero y sin nada encima; el chat vive abajo, en una hoja que subo
          cuando quiero hablar»*. */}
      {/* `flex: 1` para que el seguimiento tome la pantalla y la barra quede
          abajo: sin él, el ScrollView crece con su contenido y empuja la barra
          fuera de vista. **Lo vi caminando** — la barra asomaba cortada. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: spacing[6],
          gap: spacing[3],
        }}
      >
        <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3], gap: spacing[3] }}>
            <CabeceraCaso
              objeto={{
                /* La voz de familia del comprable, por el riel de la casa —
                   el motor manda el CÓDIGO (`paseo`) y pintarlo crudo es
                   exactamente lo que `vozServicio` existe para evitar. */
                nombre: vozServicio(t, caso.objeto.titulo) ?? t('postventa.objetoSinNombre'),
                /* Y la fecha por `fechaLargaHumana`, no por `toLocaleDateString`:
                   ése daba `9/7/2026` —formato de otra región— sobre una app
                   que ya tiene su riel de fechas. */
                fecha: caso.objeto.fecha !== null ? fechaLargaHumana(caso.objeto.fecha, idioma) : '',
              }}
              contraparte={{ nombre: t('postventa.asientoPrestador') }}
            />

            {/* §3.1 · la escalera. **No se dibuja cuando la etapa no vive en
                ella** —lo dice el catálogo del motor, no un `switch` acá. */}
            {caso.etapaDeLaFila !== null ? (
              <EscaleraCaso
                etapa={caso.etapaDeLaFila}
                {...(caso.finalDeLaFila !== null
                  ? {
                      /* §3.1 · el final REEMPLAZA la línea de abajo y la fila
                         queda congelada donde estaba. ⏪ Antes se dibujaba la
                         etiqueta sola, sin escalera, porque la etapa previa se
                         perdía en el motor. A entregó `etapaEnEscalera` y ahora
                         se cumple entero. */
                      final: {
                        tipo: caso.finalDeLaFila,
                        etiqueta: t(VOZ_FINAL[caso.finalDeLaFila]),
                      },
                    }
                  : null)}
                voces={vocesDeLaEscalera(t)}
                vozEstado={vozEstado}
                abierta={escaleraAbierta}
                onAlternar={() => setEscaleraAbierta((v) => !v)}
                etiquetaAlternar={t('postventa.escaleraAlternar')}
                acento="control"
              />
            ) : caso.finalDeLaFila !== null ? (
              /* Sin paso en la fila pero con final: se dice el final solo.
                 Hoy es inalcanzable —`etapaEnEscalera` siempre viene— y se
                 conserva porque el tipo lo admite. */
              <Texto variante="cuerpo">{t(VOZ_FINAL[caso.finalDeLaFila])}</Texto>
            ) : null}

            {/* §4 · LA CARTA DE LA PLATA — UNA a la vez (§3.3). */}
            {caso.accionPendiente === 'elegir_devolucion' && (
              <CartaDeDevolucion casoId={caso.casoId} onElegido={() => void cargar()} />
            )}

            {/* ⓶ EL PERMISO DE WHATSAPP — firma del founder: **una vez, en
                contexto, en el caso recién creado**. Va antes del pie porque
                pertenece a este caso; el pie es de la casa. Con el caso
                cerrado no se pregunta: no hay avisos que mandar. */}
            {!caso.cerrado && <PermisoWhatsApp casoId={caso.casoId} />}

            {/* §3.4 · siempre alcanzable, jamás en un menú. Va en el
                encabezado FIJO: en la lista se iría con el scroll. */}
            <Texto variante="apoyo">{t('postventa.hablarConAlguien')}</Texto>
        </View>
      </ScrollView>

      {/* LA BARRA que sube la hoja — `AsaModal sobre="superficie"`, la enmienda
          de B: sus tokens por defecto están medidos CONTRA VIDEO, y acá no hay
          video. **El rótulo dice QUÉ sube**; una barra sola nunca pudo decirlo.
          Y con mensajes sin ver, lo dice con su número. */}
      {/* `AsaModal` no se posiciona sola (es un `View` centrado), así que el
          borde inferior lo paga la pantalla — y con la hoja cerrada el panel
          mide 0, o sea que acá abajo no hay nada más. */}
      {altura === 'cerrado' ? (
        <View style={{ paddingBottom: insets.bottom + spacing[2] }}>
        <AsaModal
          etiqueta={sinLeer > 0 ? t('postventa.abrirHiloConCuenta', { n: sinLeer }) : t('postventa.abrirHilo')}
          onPress={() => setAltura('medio')}
          sobre="superficie"
        />
        </View>
      ) : null}

      <ModalDosAlturas
        altura={altura}
        onAltura={setAltura}
        altoPantalla={altoPantalla}
        etiquetaAsa={t('postventa.asaHilo')}
        /* 🔴 R81: obligatorio. Sin esto el teclado empuja el panel entero. */
        altoTeclado={altoTeclado}
        insetBottom={insets.bottom}
        /* El encabezado arrastra igual que el asa — la letra firmada lo pedía
           («por el asa o por cualquier parte de su encabezado») y el gesto
           vivía sólo sobre los 28 px del asa hasta que B lo construyó. */
        encabezado={
          <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
            <Texto variante="titulo">{t('postventa.asaHilo')}</Texto>
          </View>
        }
        hayCambiosSinGuardar={borrador.trim().length > 0}
        onPedirConfirmacion={() => setAltura('medio')}
      >
      <SuperficieChat<Fila>
        datosDelMasNuevoAlMasViejo={filas}
        claveDe={(f) => f.clave}
        renderMensaje={renderFila}
        onCargarAnteriores={() => void cargarAnteriores()}
        barra={
          caso.cerrado ? (
            /* §3.3 · la barra se REEMPLAZA por una línea en el mismo lugar.
               Sigo pudiendo leer todo. */
            <BarraEscribir enLectura={t('postventa.conversacionCerrada')} />
          ) : (
            <BarraEscribir
              valor={borrador}
              onCambio={(v) => {
                setBorrador(v);
                /* §3.1: «se colapsa sola cuando empiezo a escribir». Sólo al
                   empezar — colapsarla en cada tecla pelearía con quien la
                   abrió a propósito. */
                if (v.length > 0 && borrador.length === 0) setEscaleraAbierta(false);
              }}
              onEnviar={(texto) => {
                void enviar(texto);
              }}
              placeholder={t('postventa.escribirPlaceholder')}
              glifoEnviar={<Icono nombre="enviar" tamano={20} />}
              etiquetaEnviar={t('postventa.enviarMensaje')}
            />
          )
        }
      />
      </ModalDosAlturas>
    </View>
  );
}
