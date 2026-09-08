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

import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
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
  SuperficieChat,
  Texto,
  spacing,
  useTheme,
  type EtapaCaso as EtapaDeLaEscalera,
} from '@epetplace/ui';
import {
  enviarMensajeDeCaso,
  leerCaso,
  leerMensajesDeCaso,
  type AsientoCaso,
  type MensajeCaso,
} from '@epetplace/api';

import { horaCortaDeMensaje } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';
import { darFormaAlCaso, type CasoLeido } from '@/lib/postventa/caso';
import { CartaDeDevolucion } from '@/components/postventa/CartaDeDevolucion';
import { PermisoWhatsApp } from '@/components/postventa/PermisoWhatsApp';

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

const VOZ_ASIENTO: Record<AsientoCaso, 'postventa.asientoCasa' | 'postventa.asientoPrestador' | 'postventa.asientoFamilia'> = {
  casa: 'postventa.asientoCasa',
  prestador: 'postventa.asientoPrestador',
  familia: 'postventa.asientoFamilia',
};

export default function PantallaDelCaso() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const { casoId } = useLocalSearchParams<{ casoId?: string }>();

  const [caso, setCaso] = useState<Fase<CasoLeido>>('cargando');
  const [hilo, setHilo] = useState<Fila[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [escaleraAbierta, setEscaleraAbierta] = useState(true);
  const [borrador, setBorrador] = useState('');
  /* Las filas optimistas viven en una ref además del estado: al recargar el
     hilo desde el motor hay que conservarlas, y leerlas del estado adentro de
     un callback traería la copia del render viejo. */
  const optimistasRef = useRef<Fila[]>([]);

  const cargar = useCallback(async () => {
    if (typeof casoId !== 'string' || casoId.length === 0) return;
    const [c, m] = await Promise.all([leerCaso(casoId), leerMensajesDeCaso(casoId)]);

    if (!c.ok) {
      setCaso(c.codigo === 'no_es_tuyo' ? 'noEsTuyo' : 'error');
      return;
    }
    const forma = darFormaAlCaso(c.data);
    setCaso(forma ?? 'error');

    if (m.ok) {
      const delMotor: Fila[] = m.data.mensajes.map((x) => ({ clave: x.id, mensaje: x }));
      /* Las optimistas que el motor todavía no devuelve siguen arriba; las
         que ya volvieron se caen solas al coincidir el id. */
      const idsDelMotor = new Set(delMotor.map((f) => f.clave));
      optimistasRef.current = optimistasRef.current.filter((f) => !idsDelMotor.has(f.clave));
      setHilo([...optimistasRef.current, ...delMotor]);
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
      optimistasRef.current = [optimista, ...optimistasRef.current];
      setHilo((prev) => [optimista, ...prev]);
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

  const filas = useMemo(() => hilo, [hilo]);

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

  const VOZ_ETAPA: Record<EtapaDeLaEscalera, string> = {
    recibido: t('postventa.etapaRecibido'),
    con_prestador: t('postventa.etapaConPrestador'),
    con_epetplace: t('postventa.etapaConCasa'),
    resuelto: t('postventa.etapaResuelto'),
    cerrado: t('postventa.etapaCerrado'),
  };

  /* §3.1 · la línea de abajo, ENTERA. **El plazo lo compone la pantalla**: A
     manda `plazoHasta` crudo a propósito, porque el formato de fecha es i18n. */
  const nombreEtapa = caso.etapa !== null ? VOZ_ETAPA[caso.etapa] : '';
  const vozEstado =
    caso.plazoHasta !== null
      ? t('postventa.estasEnConPlazo', {
          etapa: nombreEtapa,
          cuando: new Date(caso.plazoHasta).toLocaleString(),
        })
      : t('postventa.estasEn', { etapa: nombreEtapa });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('postventa.tituloCaso')} atras onAtras={() => router.back()} />
      <SuperficieChat<Fila>
        encabezado={
          <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3], gap: spacing[3] }}>
            <CabeceraCaso
              objeto={{
                nombre: caso.objeto.titulo ?? t('postventa.objetoSinNombre'),
                fecha: caso.objeto.fecha !== null ? new Date(caso.objeto.fecha).toLocaleDateString() : '',
              }}
              contraparte={{ nombre: t('postventa.asientoPrestador') }}
            />

            {/* §3.1 · la escalera. **No se dibuja cuando la etapa no vive en
                ella** —lo dice el catálogo del motor, no un `switch` acá. */}
            {caso.etapa !== null ? (
              <EscaleraCaso
                etapa={caso.etapa}
                voces={VOZ_ETAPA}
                vozEstado={vozEstado}
                abierta={escaleraAbierta}
                onAlternar={() => setEscaleraAbierta((v) => !v)}
                etiquetaAlternar={t('postventa.escaleraAlternar')}
                acento="control"
              />
            ) : caso.finalAlterno !== null ? (
              /* 🔴 FINAL ALTERNO SIN ESCALERA — degradación declarada, ver la
                  nota de `finalAlterno` en `lib/postventa/caso`. El motor pisa
                  `etapa` con el final y la etapa previa se pierde; dibujar la
                  fila exigiría inventar en qué paso quedó. **Se dice el final,
                  que es verdadero.** */
              <Texto variante="cuerpo">
                {t(`postventa.final_${caso.finalAlterno}` as 'postventa.final_retirado')}
              </Texto>
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
        }
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
    </View>
  );
}
