/**
 * S114-C · NEGOCIOS · EL CASO — §5 de `DIRECCION_POSTVENTA`.
 *
 * TESIS (Ley 14): *la tensión se comunica con humanidad, no con un ticket.*
 *
 * FIRMA (Ley 15): **tres acciones y nada más** (§5). Responder va al hilo;
 * las otras dos mueven el caso. La lista está cerrada por la letra, así que
 * acá no hay un menú «…» ni una cuarta.
 *
 * CHANEL (Ley 16): **el reloj se ve y no es rojo** — `BannerPlazo` no acepta
 * `danger` ni reloj adentro. Y **cuando vence se le DICE**: *«e-PetPlace tomó
 * el caso»*, no se le oculta.
 *
 * 🔴 **SIN PUNTAJE** (§5): esta pantalla no cuenta nada sobre cómo le fue al
 * prestador en sus casos. *Un número sobre eso es una calificación.*
 *
 * ⚠️ **«Reconocer y resolver» abre las tres formas de la letra** —devolver
 * todo, una parte, o saldo—. Acá van las dos que el motor acepta hoy: el
 * saldo es del lado de la FAMILIA (ella elige destino, §4) y el prestador
 * elige el ALCANCE. *No es una simplificación mía: es que el destino no es
 * suyo.*
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  BannerPlazo,
  BarraEscribir,
  Boton,
  BurbujaMensaje,
  CARA_EN_HILO,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EventoDelHilo,
  Hoja,
  Icono,
  SuperficieChat,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  enviarMensajeDeCaso,
  leerCaso,
  leerMensajesDeCaso,
  pedirACasa,
  reconocerYResolver,
  type AsientoCaso,
  type CasoDetalle,
  type MensajeCaso,
} from '@epetplace/api';
import { horaCortaDeMensaje } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

type Fase<T> = T | 'cargando' | 'error';
type Fila = { clave: string; mensaje: MensajeCaso; estado?: 'enviando' | 'no_se_envio'; textoCrudo?: string };

const VOZ_ASIENTO: Record<AsientoCaso, 'postventa.asientoCasa' | 'postventa.asientoFamilia' | 'postventa.asientoYo'> = {
  casa: 'postventa.asientoCasa',
  familia: 'postventa.asientoFamilia',
  prestador: 'postventa.asientoYo',
};

export default function CasoDelPrestador() {
  const { theme } = useTheme();
  const { t, idioma } = useTraduccion();
  const aviso = useAviso();
  const { casoId } = useLocalSearchParams<{ casoId?: string }>();

  const [caso, setCaso] = useState<Fase<CasoDetalle>>('cargando');
  const [hilo, setHilo] = useState<Fila[]>([]);
  const [borrador, setBorrador] = useState('');
  const [hojaResolver, setHojaResolver] = useState(false);
  const [obrando, setObrando] = useState(false);
  const optimistasRef = useRef<Fila[]>([]);

  const cargar = useCallback(async () => {
    if (typeof casoId !== 'string' || casoId.length === 0) return;
    const [c, m] = await Promise.all([leerCaso(casoId), leerMensajesDeCaso(casoId)]);
    setCaso(c.ok ? c.data : 'error');
    if (m.ok) {
      const delMotor: Fila[] = m.data.mensajes.map((x) => ({ clave: x.id, mensaje: x }));
      const ids = new Set(delMotor.map((f) => f.clave));
      optimistasRef.current = optimistasRef.current.filter((f) => !ids.has(f.clave));
      setHilo([...optimistasRef.current, ...delMotor]);
    }
  }, [casoId]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const responder = useCallback(
    async (texto: string) => {
      if (typeof casoId !== 'string') return;
      const clave = `local-${Date.now()}`;
      const opt: Fila = {
        clave,
        estado: 'enviando',
        textoCrudo: texto,
        mensaje: { id: clave, autor: 'prestador', tipo: 'mensaje', cuerpo: texto, creadoEn: new Date().toISOString() },
      };
      optimistasRef.current = [opt, ...optimistasRef.current];
      setHilo((p) => [opt, ...p]);
      setBorrador('');
      const r = await enviarMensajeDeCaso(casoId, texto);
      if (r.ok) {
        await cargar();
        return;
      }
      const mal: Fila = { ...opt, estado: 'no_se_envio' };
      optimistasRef.current = optimistasRef.current.map((f) => (f.clave === clave ? mal : f));
      setHilo((p) => p.map((f) => (f.clave === clave ? mal : f)));
    },
    [casoId, cargar],
  );

  const resolver = useCallback(
    async (alcance: 'total' | 'parcial' | 'sin_devolucion') => {
      if (typeof casoId !== 'string') return;
      setObrando(true);
      const r = await reconocerYResolver(casoId, { alcance });
      setObrando(false);
      /* 🔴 **EL RESULTADO SE LEE, Y ANTES SE TIRABA.** ⏪ Acá decía
         `await reconocerYResolver(…)` a secas: cuando el motor rebotaba
         —y con `parcial` rebota SIEMPRE, porque le falta el monto— la Hoja se
         cerraba, la pantalla recargaba **y no pasaba nada**. *Un control que
         devuelve silencio no informa de un problema: informa de que la app
         está rota.* El founder lo caminó desde el prestador.
         El monto es la otra mitad y **es de A** (buzón
         `S114-C-para-A-el-parcial-no-puede-decir-cuanto`): sin el total del
         objeto no hay tope que poner, y una caja con tope que no sabe cuál es
         su tope es este mismo defecto con otra cara. */
      if (!r.ok) {
        aviso.mostrar({
          variante: 'error',
          texto:
            r.codigo === 'monto_requerido_en_parcial'
              ? t('postventa.parcialNecesitaMonto')
              : r.mensaje,
        });
        return;
      }
      setHojaResolver(false);
      await cargar();
    },
    [casoId, cargar, aviso, t],
  );

  const aLaCasa = useCallback(async () => {
    if (typeof casoId !== 'string') return;
    setObrando(true);
    await pedirACasa(casoId);
    setObrando(false);
    await cargar();
  }, [casoId, cargar]);

  const renderFila = useCallback(
    (f: Fila) => {
      if (f.mensaje.tipo === 'hecho') return <EventoDelHilo etiqueta={f.mensaje.cuerpo} />;
      const hora = horaCortaDeMensaje(f.mensaje.creadoEn, idioma);
      if (f.mensaje.autor === 'prestador') {
        if (f.estado === 'no_se_envio' && f.textoCrudo !== undefined) {
          const texto = f.textoCrudo;
          return (
            <BurbujaMensaje
              mio
              texto={f.mensaje.cuerpo}
              hora={hora}
              estado="no_se_envio"
              onReintentar={() => {
                void responder(texto);
              }}
              vozReintentar={t('postventa.noSeEnvio')}
            />
          );
        }
        return (
          <BurbujaMensaje mio texto={f.mensaje.cuerpo} hora={hora} estado={f.estado === 'enviando' ? 'enviando' : 'enviado'} />
        );
      }
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
              <Icono nombre={f.mensaje.autor === 'casa' ? 'ayuda' : 'familia'} tamano={16} />
            </View>
          }
        />
      );
    },
    [idioma, responder, t, theme.bg.overlay],
  );

  const filas = useMemo(() => hilo, [hilo]);

  if (caso === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('postventa.casoTitulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={56} />
            <Esqueleto alto={120} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }
  if (caso === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('postventa.casoTitulo')} atras onAtras={() => router.back()} />
        <EstadoVacio titulo={t('postventa.casosNoSePudo')} />
      </View>
    );
  }

  const cerrado = caso.cerrado;
  const plazo = caso.plazoHasta;
  const horas = plazo !== null ? Math.round((new Date(plazo).getTime() - Date.now()) / 3_600_000) : null;
  const conLaCasa = caso.etapa === 'con_casa';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('postventa.casoTitulo')} atras onAtras={() => router.back()} />
      <SuperficieChat<Fila>
        encabezado={
          <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3], gap: spacing[3] }}>
            {/* §5 · EL RELOJ SE VE Y NO ES ROJO. **Y cuando vence se le
                DICE** — no se le oculta que la casa tomó el caso. */}
            {/* 🔴 Con el caso CERRADO no se dice ningún plazo: la barra ya
                pasó a lectura y un «te quedan N horas para responder» encima
                promete una acción que la misma pantalla acaba de cerrar.
                *Lo vi en el aparato — los dos son correctos por separado.* */}
            {cerrado ? null : conLaCasa ? (
              <BannerPlazo voz={t('postventa.laCasaTomoElCaso')} />
            ) : horas !== null && horas > 0 ? (
              <BannerPlazo voz={t('postventa.teQuedan', { horas })} />
            ) : null}

            {!cerrado && (
              /* §5 · LAS TRES, y la lista está cerrada por la letra. */
              <View style={{ gap: spacing[2] }}>
                <Boton
                  etiqueta={t('postventa.reconocerYResolver')}
                  bloque
                  onPress={() => setHojaResolver(true)}
                />
                {!conLaCasa && (
                  <Boton
                    variante="secundario"
                    etiqueta={t('postventa.pedirALaCasa')}
                    bloque
                    cargando={obrando}
                    onPress={() => void aLaCasa()}
                  />
                )}
              </View>
            )}
          </View>
        }
        datosDelMasNuevoAlMasViejo={filas}
        claveDe={(f) => f.clave}
        renderMensaje={renderFila}
        barra={
          cerrado ? (
            <BarraEscribir enLectura={t('postventa.conversacionCerrada')} />
          ) : (
            <BarraEscribir
              valor={borrador}
              onCambio={setBorrador}
              onEnviar={(texto) => {
                void responder(texto);
              }}
              placeholder={t('postventa.escribirPlaceholder')}
              glifoEnviar={<Icono nombre="enviar" tamano={20} />}
              etiquetaEnviar={t('postventa.enviarMensaje')}
            />
          )
        }
      />

      {/* «Reconocer y resolver» — una decisión con consecuencias viste de
          Hoja, no de toque accidental (patrón de la casa). */}
      <Hoja visible={hojaResolver} onCerrar={() => setHojaResolver(false)} titulo={t('postventa.reconocerTitulo')}>
        <View style={{ gap: spacing[3] }}>
          <Texto variante="apoyo">{t('postventa.reconocerCuerpo')}</Texto>
          <Boton etiqueta={t('postventa.devolverTodo')} bloque cargando={obrando} onPress={() => void resolver('total')} />
          <Boton
            variante="secundario"
            etiqueta={t('postventa.devolverParte')}
            bloque
            cargando={obrando}
            onPress={() => void resolver('parcial')}
          />
        </View>
      </Hoja>
    </View>
  );
}
