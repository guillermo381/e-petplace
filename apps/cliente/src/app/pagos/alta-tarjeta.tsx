/**
 * S101-B · EL ALTA DE TARJETA, EMBEBIDA.
 *
 * 🔴 POR QUÉ DEJÓ DE SER UN CUSTOM TAB (firma del founder, 19-ago):
 *    con `expo-web-browser` el retorno viajaba por `cliente://…` y **falló DOS
 *    veces en el teléfono del founder** — «página no encontrada» al volver, el
 *    esquema no resolvió. *Un mecanismo cuyo último tramo depende de que el
 *    sistema operativo resuelva un esquema es un mecanismo con una puerta que
 *    no controlamos.* Acá el retorno no sale de la app: la vista se cierra
 *    sola.
 *
 * 🔴 EL MENSAJE ES SEÑAL, JAMÁS HECHO. `postMessage` solo dice «terminé»;
 *    **el desenlace se relee del servidor**, siempre, en todos los caminos —
 *    incluido cuando la familia cierra la vista con el botón de atrás.
 *    *La página corre en el navegador de la persona: creerle el desenlace
 *    sería dejar que el cliente declare su propia tarjeta como guardada.*
 */

import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Encabezado, EsperaDeMarca, useTheme, useAviso } from '@epetplace/ui';
import { obtenerAltaTarjeta, type EstadoAlta } from '@epetplace/api';
import { obtenerIdiomaActual } from '@epetplace/i18n';

import { useTraduccion } from '@/i18n';

const BASE = process.env.EXPO_PUBLIC_PAGOS_ALTA_URL ?? '';

export default function AltaTarjeta() {
  const { alta } = useLocalSearchParams<{ alta: string }>();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  /** Un solo cierre: el mensaje y el botón de atrás compiten, y el segundo
   *  no debe volver a leer ni a navegar. */
  const cerrando = useRef(false);

  /**
   * 🔴 LA ÚNICA FUENTE. Se llama al terminar por CUALQUIER camino —mensaje de
   * la página o salida de la persona— y siempre pregunta al servidor.
   */
  async function cerrarLeyendoElServidor() {
    if (cerrando.current) return;
    cerrando.current = true;

    const r = await obtenerAltaTarjeta(String(alta));
    router.back();

    if (!r.ok) { mostrar({ texto: t('cuenta.altaNoAbrio'), variante: 'error' }); return; }

    const voz: Record<EstadoAlta, { texto: string; variante: 'exito' | 'error' | 'neutro' }> = {
      guardada: { texto: t('cuenta.altaGuardada'), variante: 'exito' },
      rechazada: { texto: t('cuenta.altaRechazada'), variante: 'error' },
      pendiente: { texto: t('cuenta.altaPendiente'), variante: 'neutro' },
      abandonada: { texto: t('cuenta.altaAbandonada'), variante: 'neutro' },
    };
    mostrar(voz[r.data.estado]);
  }

  useEffect(() => {
    if (!alta || !BASE) {
      mostrar({ texto: t('cuenta.altaNoAbrio'), variante: 'error' });
      router.back();
    }
  }, [alta]);

  if (!alta || !BASE) return null;

  /* 🔴 EL IDIOMA VIAJA POR LA URL (S101-D · firma del founder: el circuito de
     pago habla los DOS idiomas de la app).

     La página del alta es HTML plano servido aparte — **no puede importar el
     riel i18n**, así que el idioma tiene que LLEGARLE, y la única que sabe cuál
     eligió la familia es esta app.

     ⚠️ **Se manda `obtenerIdiomaActual()`, JAMÁS se deja que la página lo
     adivine con `navigator.language`:** dentro de un WebView eso reporta el
     locale del SISTEMA, no la preferencia elegida — y son cosas distintas
     (`D-316` existe porque el idioma se persiste como preferencia propia).
     *Si la página adivinara, contradiría a la app que la abrió, en la pantalla
     donde la familia entrega su tarjeta.* */
  const url =
    `${BASE}?alta=${encodeURIComponent(String(alta))}` +
    `&lang=${encodeURIComponent(obtenerIdiomaActual())}`;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('cuenta.gateAltaTarjeta')}
        atras
        onAtras={() => void cerrarLeyendoElServidor()}
      />

      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: url }}
          /* 🔴 El estado de carga lo monta el PROPIO WebView. La v1 dibujaba
             un velo `position:absolute` con `bottom:0`, y el gate de diseño lo
             leyó —con razón— como un pie fijo a mano. *No era un falso
             positivo que declarar: era un patrón que el componente ya
             resuelve.* */
          startInLoadingState
          renderLoading={() => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center',
                           backgroundColor: theme.bg.base }}>
              <EsperaDeMarca />
            </View>
          )}
          onMessage={(e) => {
            /* 🔴 Se lee SOLO para saber que terminó. Ni el desenlace que trae
               ni su forma deciden nada — abajo se relee el servidor. */
            try {
              const m = JSON.parse(e.nativeEvent.data) as { fuente?: string };
              if (m?.fuente !== 'epetplace-alta-tarjeta') return;
            } catch { return; }
            void cerrarLeyendoElServidor();
          }}
          /* La tokenización necesita JS y almacenamiento del SDK. */
          javaScriptEnabled
          domStorageEnabled
          /* 🔴 Nada de esta pantalla se guarda: es un formulario de tarjeta. */
          incognito
          cacheEnabled={false}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(req) => {
            /* Encierra la navegación al host de la página y a lo que el SDK
               necesita. *Un WebView que sigue cualquier link es un navegador
               sin barra de direcciones — y acá se tipea una tarjeta.* */
            const permitido = [BASE, 'https://cdn.paymentez.com',
              'https://ccapi-stg.paymentez.com', 'https://ccapi.paymentez.com',
              'https://pg-micros-stg.paymentez.com', 'https://pg-micros.paymentez.com',
              'https://code.jquery.com', 'https://s3.amazonaws.com'];
            return req.url === 'about:blank' || permitido.some((p) => req.url.startsWith(p));
          }}
          style={{ flex: 1, backgroundColor: theme.bg.base }}
        />
      </View>
    </SafeAreaView>
  );
}
