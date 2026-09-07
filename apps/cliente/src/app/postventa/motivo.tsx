/**
 * S114-C · CONTAR QUÉ PASÓ — §2 de `DIRECCION_POSTVENTA`.
 *
 * TESIS (Ley 14): *elegís qué pasó en dos toques, y si querés, lo contás
 * con tus palabras.*
 *
 * FIRMA (Ley 15): **la lista entra en una pantalla y no tiene «Otro».** La
 * última fila invita a contar (`SelectorMotivo` la pone por su cuenta) y el
 * campo aparece SÓLO cuando se la toca — el resto del tiempo la pantalla es
 * una lista corta y nada más.
 *
 * CHANEL (Ley 16): cero explicación del mecanismo. La familia no lee
 * «clase 2», ni «catálogo», ni el código del motivo. Elige una frase.
 *
 * 🔴 **NADA SE CREA SIN EL SÍ** (§2). Si contó algo, la casa le devuelve lo
 * que entendió y espera su confirmación. El caso no nace antes.
 *
 * ── LOS DOS HUECOS DECLARADOS, y ninguno se disimula ──────────────────────
 *
 * 🔴 ① **EL MOTOR DEL CASO NO EXISTE.** `abrirCaso` no está construido
 *    (medido: cero `casos_postventa` en migraciones y cero wrapper en
 *    `packages/api`). El último toque cae en `crearElCaso()`, que **dice la
 *    verdad y no finge**. *No se escribió contra una firma inventada: si no
 *    coincide, el trabajo se rehace entero y además compila, que es la peor
 *    forma de estar mal.* Es UNA función y su contrato está servido en
 *    `docs/loop/S114-C-PEDIDO-A-A-EL-MOTOR-DEL-CASO.md`.
 *
 * 🔴 ② **EL DICTADO NO VIAJA POR OTA, y por eso no está.** §2 lo pide, y
 *    `expo-speech-recognition` está instalado **sólo en `apps/prestador`**
 *    (medido en los dos `package.json`): en la app de la familia es
 *    **módulo nativo nuevo ⇒ build, jamás update** (L-134). El precedente de
 *    la casa es `D-456`: el mic se preparó y se quedó apagado cinco sesiones
 *    hasta que otra cosa obligó un build — *jamás un build sólo por él*. El
 *    campo funciona tecleando desde hoy; el mic entra portando
 *    `apps/prestador/src/components/dictado-en-vivo.tsx`, que ya resuelve la
 *    ausencia del módulo sin romper el APK viejo (`require` en try/catch, el
 *    control no se dibuja — Ley 23).
 *
 * §11: cuando exista el intake de D, el «Entendí:» lo redacta el modelo y la
 * familia lo confirma. **Hoy le devolvemos SU propio texto**, que es
 * literalmente lo que entendimos — y es honesto: la casa no puede resumir
 * mejor que la familia hasta que tenga con qué.
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  SelectorMotivo,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import { obtenerMotivosDeObjeto, type MotivoPostventa, type ObjetoPostventa } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { motivosParaLaPantalla, pideContar } from '@/lib/postventa/motivos';

type Fase<T> = T | 'cargando' | 'error';

const OBJETOS: readonly ObjetoPostventa[] = ['cita', 'estadia', 'pedido'];

function esObjeto(v: unknown): v is ObjetoPostventa {
  return typeof v === 'string' && (OBJETOS as readonly string[]).includes(v);
}

export default function PostventaMotivo() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { objeto, objetoId } = useLocalSearchParams<{ objeto?: string; objetoId?: string }>();

  const [motivos, setMotivos] = useState<Fase<MotivoPostventa[]>>('cargando');
  const [elegido, setElegido] = useState<string | null>(null);
  const [relato, setRelato] = useState('');
  /* La confirmación es un PASO, no un modal: mientras está arriba, la lista
     no se puede tocar — «no, corregilo» vuelve con el texto intacto (§2). */
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        if (!esObjeto(objeto)) {
          if (vigente) setMotivos('error');
          return;
        }
        const r = await obtenerMotivosDeObjeto(objeto);
        if (!vigente) return;
        setMotivos(r.ok ? r.data : 'error');
      })();
      return () => {
        vigente = false;
      };
    }, [objeto]),
  );

  /* La partición vive en `lib/postventa/motivos`: saca la fila `otra_cosa`
     que la PIEZA ya pone por su cuenta —si no, la lista la dice dos veces— y
     usa su voz del catálogo como la de la última fila. */
  const preparados = useMemo(
    () =>
      typeof motivos === 'object'
        ? motivosParaLaPantalla(motivos, t('postventa.contame'))
        : null,
    [motivos, t],
  );

  const contando = pideContar(elegido);
  const motivoElegido = useMemo(
    () => (typeof motivos === 'object' ? motivos.find((m) => m.codigo === elegido) : undefined),
    [motivos, elegido],
  );

  const relatoLimpio = relato.trim();
  /* §2: contar es OPCIONAL salvo en la última fila, que existe justamente
     para contar. «Continuar» sin nada elegido no se ofrece (Ley 23: la
     puerta no ofrece lo que va a rechazar). */
  const puedeSeguir = elegido !== null && (!contando || relatoLimpio.length > 0);

  /* 🔴 EL SEGURO — ver ① de la cabecera. Cuando A entregue `abrirCaso`, esta
     función es su llamada y nada más de la pantalla se mueve. */
  const crearElCaso = useCallback(async () => {
    setEnviando(true);
    setRebote(t('postventa.motorNoDisponible'));
    setEnviando(false);
  }, [t]);

  if (motivos === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado
          variante="navegacion"
          titulo={t('postventa.tituloMotivo')}
          atras
          onAtras={() => router.back()}
        />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={44} />
            <Esqueleto alto={44} />
            <Esqueleto alto={44} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  /* Ley 13: el error jamás se disfraza de vacío. */
  if (motivos === 'error' || preparados === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado
          variante="navegacion"
          titulo={t('postventa.tituloMotivo')}
          atras
          onAtras={() => router.back()}
        />
        <EstadoVacio titulo={t('postventa.errorCatalogo')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
          variante="navegacion"
          titulo={t('postventa.tituloMotivo')}
          atras
          onAtras={() => router.back()}
        />
      <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: insets.bottom + spacing[6],
            gap: spacing[4],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {confirmando ? (
            /* ══ §2 · LA CONFIRMACIÓN — «Nada se crea sin mi sí» ═══════════ */
            <Tarjeta>
              <View style={{ gap: spacing[3] }}>
                <Texto variante="cuerpo">
                  {t('postventa.entendi', { resumen: relatoLimpio })}
                </Texto>
                {/* 🔴 EL REBOTE VIVE EN LAS DOS RAMAS, y esto lo encontró el
                    aparato y no el typecheck: estaba montado SÓLO en la rama
                    de la lista, así que **tocar «Sí, es eso» no hacía nada
                    visible** — el estado cambiaba y nadie lo veía. *Un toque
                    que no responde no se lee como un error: se lee como una
                    app rota* (Ley 13, el fallo dice que es fallo). */}
                {rebote !== null && (
                  <Texto variante="apoyo" color="danger">
                    {rebote}
                  </Texto>
                )}
                <Boton
                  etiqueta={t('postventa.esEso')}
                  bloque
                  onPress={() => void crearElCaso()}
                  cargando={enviando}
                />
                <Boton
                  etiqueta={t('postventa.corregilo')}
                  variante="secundario"
                  bloque
                  onPress={() => setConfirmando(false)}
                />
              </View>
            </Tarjeta>
          ) : (
            <>
              <SelectorMotivo
                motivos={preparados.lista}
                elegido={elegido}
                onElegir={(clave) => {
                  setElegido(clave);
                  setRebote(null);
                }}
                vozContame={preparados.vozContame}
              />

              {/* §2 · el campo con MIS palabras. Aparece al tocar la última
                  fila; en los demás motivos contar es opcional y por eso no
                  se ofrece un campo vacío que nadie pidió. */}
              {contando && (
                <Campo
                  label={t('postventa.tituloMotivo')}
                  etiquetaVisible={false}
                  placeholder={t('postventa.placeholderRelato')}
                  value={relato}
                  onChangeText={setRelato}
                  multilinea={5}
                />
              )}

              {/* §2 · la foto AYUDA y SE PUEDE SALTAR. La frase entera lo
                  dice para que nadie la lea como requisito. */}
              {motivoElegido?.pideFoto === true && (
                <Texto variante="apoyo">{t('postventa.fotoOpcional')}</Texto>
              )}

              {rebote !== null && (
                <Texto variante="apoyo" color="danger">
                  {rebote}
                </Texto>
              )}

              {puedeSeguir && (
                <Boton
                  etiqueta={t('postventa.continuar')}
                  bloque
                  onPress={() => {
                    /* Sin relato no hay nada que confirmar: el motivo del
                       catálogo YA es la respuesta. Con relato, la casa
                       devuelve lo que entendió antes de crear nada. */
                    if (relatoLimpio.length > 0) setConfirmando(true);
                    else void crearElCaso();
                  }}
                  cargando={enviando}
                />
              )}
            </>
          )}
        </ScrollView>
      </EvitaTeclado>
    </View>
  );
}
