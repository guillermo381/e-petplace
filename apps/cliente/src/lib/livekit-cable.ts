/**
 * ☠️ **EL CABLE DE LIVEKIT — ANDAMIO DE PRUEBA, S106-C tanda 1.**
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ **MUERE ENTERO cuando la superficie real de teleconsulta exista.**   │
 * │ No es una pantalla del producto y nunca lo va a ser.                 │
 * │                                                                      │
 * │ **Condición de muerte, escrita para que no sobreviva:** el día que   │
 * │ la pantalla de videoconsulta consuma `video-token` (la edge de D) y  │
 * │ una sala REAL de cita, este archivo y `app/cable-livekit.tsx` se     │
 * │ borran en el mismo commit. *Un andamio sin condición de muerte       │
 * │ escrita es una pieza de producción que nadie se anima a tocar.*      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Aplica la spec de D **verbatim**:
 * `docs/relevamientos/2026-08-25-s106-d-SPEC-CABLE-C.md`
 * (rama `pista/s106-d` en `18c438cf`, blob `ba7eb5b6` — anclado porque a la
 * fecha **no está en `main`**).
 *
 * ── POR QUÉ `registerGlobals()` VIVE ACÁ Y NO EN EL RAÍZ ───────────────────
 * La spec §3 dice *«en el arranque de la app, una sola vez, antes de cualquier
 * uso»*. Este módulo **sólo lo importa la ruta dev-only**, así que corre antes
 * de todo uso de LiveKit y **una sola vez** (los módulos ES se evalúan una
 * vez), pero **sin poner un módulo nativo en el arranque de la app de una
 * familia** — que es el límite que puso la mesa («detrás de la ruta
 * dev-only»). *Un side-effect nativo en el raíz le pega a todos los usuarios,
 * y esta prueba no le tiene que pegar a ninguno.*
 * ⚠️ **Es la única decisión de ubicación que tomé; si la mesa la quiere en el
 * raíz, es mover tres líneas.** En tanda 2, con superficie real, el raíz es el
 * lugar correcto.
 *
 * ── EL `require` EN TRY/CATCH ES EL PRECEDENTE DE LA CASA (D-456) ──────────
 * `@livekit/react-native` es **módulo NATIVO**: no existe en Expo Go ni en
 * ningún binario horneado antes de esta build. Sin el guard, importar este
 * archivo **tira la app entera** en vez de degradar. Mismo patrón exacto que
 * `dictado-en-vivo.tsx` usó para el micrófono.
 */

/** La sala es FIJA por orden de la spec §4. **No la cambies.** Dos aparatos en
 *  salas distintas se ven exactamente igual que un cable roto: cada uno solo y
 *  sin error. */
export const SALA_CABLE = 'cable-quito';

/* ── LO QUE FALTA, Y NO SE INVENTA ────────────────────────────────────────
   Las tres variables de LiveKit **las da el founder** (spec §4). Están
   cargadas como secrets de Supabase para la edge de D — y ahí la CLI devuelve
   un **digest, no el valor**, así que desde acá no se pueden leer para firmar
   un token.

   🔴 **JAMÁS pegar acá `LIVEKIT_API_SECRET` ni ninguna key de cuenta.** Lo que
   va acá es **un token de prueba ya firmado**, que expira solo en 1 hora.

   Para generarlo (spec §4), con las tres variables en mano:

       cd supabase/functions/video-token
       LIVEKIT_API_KEY='…' LIVEKIT_API_SECRET='…' LIVEKIT_URL='wss://…' \
         node generar-token-prueba.mjs

   Imprime la URL y DOS tokens (`Dispositivo A` y `Dispositivo B`). Uno va en
   cada aparato: **el mismo token en los dos no prueba nada.** */
export const LIVEKIT_URL = '';
export const TOKEN_PRUEBA = '';

/** `true` cuando el andamio tiene con qué conectarse. Si es `false` la pantalla
 *  lo DICE — no dibuja un botón que no puede funcionar. */
export const cableConfigurado = LIVEKIT_URL.length > 0 && TOKEN_PRUEBA.length > 0;

type ModuloLiveKit = typeof import('@livekit/react-native');

let modulo: ModuloLiveKit | null = null;
let motivoFallo: string | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  modulo = require('@livekit/react-native') as ModuloLiveKit;
  modulo.registerGlobals();
} catch (e) {
  modulo = null;
  // El literal se GUARDA: la spec §6 pide el mensaje textual, no parafraseado.
  motivoFallo = String(e);
}

export const livekit = modulo;
export const livekitMotivoFallo = motivoFallo;
