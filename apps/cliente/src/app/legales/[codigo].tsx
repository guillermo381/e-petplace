/**
 * LECTURA Y ACEPTACIÓN DE UN DOCUMENTO — **una pantalla, tres documentos**.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **VOZ DEL FOUNDER, literal (ítem 11):** *«Es una pantalla de lectura: el texto
 * entero, en la letra de la casa, con scroll; abajo "Acepto y continúo",
 * apagado con razón hasta que llegué al final. Una sola vez en la vida de mi
 * cuenta. **No es un modal, no es un popup: es una pantalla con su título.**»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **ES UNA SOLA PIEZA Y NO DOS GEMELAS.** El founder dictó los ítems 11
 * (condiciones del adoptante) y 12 (términos del refugio) **con la misma forma
 * palabra por palabra**, y A entregó **un solo contrato parametrizado por
 * código** porque se lo pedí así. *Dos pantallas gemelas es cómo una queda
 * vieja: alguien cura el scroll en una y la otra sigue con el bug seis meses.*
 *
 * ⚠️ **HOY TIENE UN SOLO CONSUMIDOR** (`condiciones_adopcion`, desde el «Quiero
 * adoptar»). El segundo —`terminos_refugio` al primer ingreso del refugio— vive
 * en la app de negocios y **llega con el punto del portal**. Cuando llegue, lo
 * que se comparte es el COMPONENTE, no un copiar-pegar de esta ruta: se pide a
 * B su promoción a `packages/ui`. *Se declara acá para que el próximo no
 * duplique creyendo que es más rápido.*
 *
 * ── 🔴 LO QUE LA APP **NO** APORTA, Y ES LA PARTE PENSADA DEL CONTRATO ──
 * · **La VERSIÓN no viaja al aceptar.** `aceptarDocumentoAdopcion` toma sólo el
 *   `codigo`: la versión la resuelve el servidor de la fila vigente. *Si la
 *   pantalla la eligiera, el día que se publique la v2 seguiría aceptando la v1
 *   y todo compilaría* (`L-166`). Es el mismo viaje redondo que pedí para el
 *   acta.
 * · **El `sha256` tampoco se manda.** Lo lee el servidor del documento. *Si lo
 *   aportara el cliente, la evidencia diría lo que el cliente quiso decir.*
 * · ☠️ **`ipHash` YA NO EXISTE — y esta pantalla es la razón.** El contrato lo
 *   ofrecía como opcional y **no se mandó**: la app no tiene la IP, y fabricar
 *   un hash de algo que no conozco sería inventar evidencia legal. Al reportar
 *   esa negativa, A midió lo que había debajo y era mucho peor que un campo
 *   vacío: **`consentimientos.ip_hash` estaba en NULL en las 97 filas de la
 *   casa** — ni el alta ni la teleconsulta lo llenaron jamás. *Un campo que
 *   sólo puede llenar quien no lo conoce no se llena nunca, y su modo de falla
 *   es el peor: la fila existe, se ve completa, y el dato falta.* **Hoy la IP la
 *   lee el servidor del header y la guarda hasheada; si el header no llega,
 *   queda NULL y no se inventa.** La respuesta trae `ipCapturada` para que la
 *   pantalla no tenga que suponerlo.
 *   ⚠️ **No se muestra**: que la evidencia esté completa es asunto del registro
 *   probatorio, no algo que la persona que acepta tenga que evaluar.
 */

import { useCallback, useRef, useState } from 'react';
import { Platform, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  MarcaDeAgua,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  aceptarDocumentoAdopcion,
  obtenerDocumentoVigente,
  type DocumentoVigente,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Los códigos que ESTA pantalla acepta. `acta_adopcion` **queda afuera a
 *  propósito**: el motor rebota `documento_no_aceptable` porque **aceptar y
 *  firmar son dos actos distintos**. Dejarlo entrar acá haría una pantalla que
 *  se ve bien y falla al final. */
const ACEPTABLES = ['condiciones_adopcion', 'terminos_refugio'] as const;
type CodigoAceptable = (typeof ACEPTABLES)[number];

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'codigoInvalido' }
  | { fase: 'listo'; doc: DocumentoVigente };

/** Cuánto falta para el fondo para darlo por leído. Un umbral y no `=== 0`:
 *  el scroll de RN no siempre aterriza exacto en el final. */
const MARGEN_FONDO = 24;

export default function LecturaDeDocumento() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const aviso = useAviso();
  const params = useLocalSearchParams<{ codigo?: string; volverA?: string }>();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [llegoAlFinal, setLlegoAlFinal] = useState(false);
  const [aceptando, setAceptando] = useState(false);
  const yaMidio = useRef(false);

  const codigo = ACEPTABLES.includes(params.codigo as CodigoAceptable)
    ? (params.codigo as CodigoAceptable)
    : null;

  useFocusEffect(
    useCallback(() => {
      if (codigo === null) {
        setEstado({ fase: 'codigoInvalido' });
        return;
      }
      let vigente = true;
      void obtenerDocumentoVigente(codigo).then((r) => {
        if (!vigente) return;
        /* Un fallo NO se disfraza de documento vacío (Ley 13): *«no pudimos
           traer el texto» y «el texto está en blanco» mandan a la persona a
           cosas distintas*, y acá la segunda le haría aceptar la nada. */
        setEstado(r.ok ? { fase: 'listo', doc: r.data } : { fase: 'error' });
      });
      return () => {
        vigente = false;
      };
    }, [codigo]),
  );

  /**
   * ¿LLEGÓ AL FINAL?
   *
   * 🔴 **EL CASO QUE ROMPE ESTA PANTALLA SI NADIE LO PIENSA: un documento CORTO
   * que entra entero en la pantalla NO GENERA SCROLL**, así que `onScroll` no
   * dispara nunca y el botón queda apagado **para siempre**. *La persona ve el
   * texto completo delante de los ojos y un botón que le dice que lo lea.*
   *
   * Por eso se mide en `onLayout` del contenido: si el contenido **cabe**, está
   * leído. La condición real no es «scrolleó», es **«vio todo»** — y con un
   * texto corto las dos cosas se separan.
   *
   * ✅ **Y el caso corto es REAL, no hipotético** (medido por A sobre los textos
   * cargados): `terminos_refugio` tiene **12 324** caracteres —ahí scroll y
   * lectura coinciden— pero **`condiciones_adopcion` tiene 1 711**, que en una
   * pantalla grande entra sin scrollear. *El documento que esta pantalla sirve
   * hoy es justamente el que habría dejado el botón muerto.*
   */
  const alMedirContenido = useCallback((_w: number, h: number) => {
    yaMidio.current = true;
    setAlto((a) => ({ ...a, contenido: h }));
  }, []);
  const [alto, setAlto] = useState<{ visor: number; contenido: number }>({ visor: 0, contenido: 0 });

  const alScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - MARGEN_FONDO) {
      setLlegoAlFinal(true);
    }
  }, []);

  /* El documento que cabe entero se da por leído sin scrollear. */
  const cabeEntero = yaMidio.current && alto.visor > 0 && alto.contenido <= alto.visor;
  const puedeAceptar = llegoAlFinal || cabeEntero;

  async function aceptar() {
    if (estado.fase !== 'listo' || codigo === null || aceptando || !puedeAceptar) return;
    setAceptando(true);
    const r = await aceptarDocumentoAdopcion({
      codigo,
      /* `dispositivo` sí es dato DE LA APP y por eso lo aporta la app. `ipHash`
         NO: la app no conoce la IP, y un hash de algo que no conozco sería
         evidencia inventada. */
      dispositivo: `${Platform.OS} ${String(Platform.Version)}`,
    });
    setAceptando(false);
    if (!r.ok) {
      aviso.mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    /* `yaEstaba` no cambia el destino ni se celebra distinto: *aceptar algo que
       ya estaba aceptado no es un error ni un logro — es seguir.* */
    if (typeof params.volverA === 'string' && params.volverA.length > 0) {
      router.back();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/hogar');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      {/* «Una pantalla con su título» — el founder lo dijo por oposición al
          modal, así que el título va en el Encabezado y no adentro del scroll. */}
      <Encabezado
        variante="navegacion"
        titulo={estado.fase === 'listo' ? tituloDe(estado.doc.codigo, t) : t('legales.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/hogar'))}
      />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={18} />
            <Esqueleto alto={18} />
            <Esqueleto alto={200} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'codigoInvalido' ? (
        /* No es «error»: es que alguien llegó con un código que esta pantalla
           no acepta —`acta_adopcion`, por ejemplo—. Decirlo distinto importa:
           reintentar no lo va a arreglar. */
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('legales.codigoInvalidoTitulo')}
            descripcion={t('legales.codigoInvalidoDetalle')}
          />
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('legales.errorTitulo')}
            descripcion={t('legales.errorDetalle')}
            accion={
              <Boton
                etiqueta={t('legales.reintentar')}
                onPress={() => setEstado({ fase: 'cargando' })}
              />
            }
          />
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            onLayout={(e) => setAlto((a) => ({ ...a, visor: e.nativeEvent.layout.height }))}
            onContentSizeChange={alMedirContenido}
            onScroll={alScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ padding: spacing[5], gap: spacing[3] }}
          >
            {/* EL TEXTO ENTERO, EN LA LETRA DE LA CASA. `Texto variante="cuerpo"`
                y no un WebView: *el founder pidió la letra de la casa, y en un
                WebView el texto deja de tenerla y «llegué al final» deja de ser
                medible.* Por eso el contrato devuelve `contenido`, no una url. */}
            <Texto variante="cuerpo">{estado.doc.contenido}</Texto>
          </ScrollView>

          <View
            style={{
              padding: spacing[5],
              paddingBottom: insets.bottom + spacing[4],
              gap: spacing[2],
            }}
          >
            <Boton
              variante="primario"
              bloque
              etiqueta={t('legales.aceptar')}
              deshabilitado={!puedeAceptar}
              /* La razón se DIBUJA (D-999, cura de B): sin ella el botón sería
                 una pared muda justo donde la persona no sabe qué le falta. */
              razonDeshabilitado={t('legales.razonFaltaLeer')}
              cargando={aceptando}
              onPress={() => void aceptar()}
            />
          </View>
        </>
      )}
    </View>
  );
}

/** El título por documento. **No sale del servidor**: el contrato trae `codigo`
 *  y `contenido`, y el nombre con el que la casa llama a cada documento es voz
 *  de producto (Ley 3), no dato legal. */
function tituloDe(codigo: string, t: ReturnType<typeof useTraduccion>['t']): string {
  return codigo === 'terminos_refugio' ? t('legales.tituloRefugio') : t('legales.tituloCondiciones');
}
