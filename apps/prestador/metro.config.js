/**
 * Metro — configuración del PRESTADOR.
 *
 * 🔴 **ESTE ARCHIVO NO EXISTÍA.** El prestador corría con el metro por defecto
 * de Expo. Se declara porque cambia una premisa: **de acá en adelante, cada
 * subida de Expo SDK tiene que mirar este archivo** — *un default que se hereda
 * solo deja de heredarse cuando alguien escribe el archivo que lo reemplaza.*
 *
 * **Su único trabajo:** el alias de LiveKit en web (`D-940`). Nada más — *una
 * config de bundler que hace dos cosas es una config que nadie se anima a subir
 * de versión.*
 *
 * ⚠️ **Nace más chico que el del cliente A PROPÓSITO:** aquél además compila
 * SVG para los logos de franquicia de la puerta de pago, y el prestador no
 * tiene esa necesidad. *Copiar la config entera "por simetría" traería un
 * transformer que acá nadie usa.*
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/* ── 🔴 EL ALIAS DE WEB — `D-940` ──────────────────────────────────────────
   `@livekit/react-native` usa `requireNativeComponent`, **que no existe en
   web**, y LiveKit entra al bundle **por el árbol de rutas**: expo-router
   bundlea TODAS las rutas ⇒ la pantalla de videoconsulta rompía el bundle
   entero **aunque nadie la visitara**. Con eso caída quedó **la galería**,
   que es la herramienta con la que esta casa mira sus piezas.

   *Un `.web.tsx` al lado de la pantalla NO alcanza —está medido—: el problema
   no es qué pantalla se monta, es qué entra al bundle.* Por eso el corte va
   acá, en el resolver: en web el módulo nativo **nunca se pide**.

   ⚠️ **Sólo en web.** `platform === 'web'` es la única rama; iOS y Android
   resuelven el paquete real sin enterarse de que esto existe. */
const ALIAS_WEB = {
  '@livekit/react-native': require.resolve('./src/lib/livekit-web-stub.ts'),
  '@livekit/react-native-webrtc': require.resolve('./src/lib/livekit-web-stub.ts'),
};

const resolverPrevio = config.resolver.resolveRequest;
config.resolver.resolveRequest = (contexto, nombre, plataforma) => {
  if (plataforma === 'web' && nombre in ALIAS_WEB) {
    return { type: 'sourceFile', filePath: ALIAS_WEB[nombre] };
  }
  return (resolverPrevio ?? contexto.resolveRequest)(contexto, nombre, plataforma);
};

module.exports = config;
