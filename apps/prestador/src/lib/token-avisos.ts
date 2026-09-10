/**
 * ⭐ **EL TOKEN DEL APARATO, SINCRONIZADO EN CADA ARRANQUE** — `D-1056`.
 *
 * **PORT DECLARADO desde `apps/cliente/src/lib/token-avisos.ts`** — la misma
 * pieza al revés, como `permiso-push` y `toque-de-push` en su día. *Cada app
 * tiene su `invitacion-avisos` con su propia `sincronizarTokenSiHayPermiso`,
 * así que esto cuelga del suyo y no se importa cruzado.*
 *
 * Y acá el fantasma cuesta más: **un prestador cuyo aparato dejó de recibir no
 * se entera de que se le abrió un caso, y tiene 24 h para responder.**
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **`sincronizarTokenSiHayPermiso` YA DESCRIBÍA ESTO EN SU PROPIO JSDoc Y
 * NADIE LA LLAMABA ASÍ.** Su comentario dice, literal:
 *
 *   *«Se llama al conceder, **y también en cada arranque con permiso ya
 *   concedido**: el token del SO puede ROTAR y un token viejo es un aviso que
 *   no llega.»*
 *
 * Medido: sus únicos llamadores son **los dos caminos de conceder** dentro de
 * `invitacion-avisos.tsx`. La segunda mitad —la del arranque— **nunca se
 * cableó**. Es `L-318` (motor sin puerta) en su forma más silenciosa: *el
 * comentario describe el comportamiento correcto y el código no lo hace, así
 * que quien lo lee da por cableado lo que no está.*
 *
 * **Su modo de falla no tiene síntoma:** el token rota, el motor sigue
 * mandando al viejo, y **el aparato se vuelve fantasma sin que nadie se
 * entere** — ni la persona (que simplemente deja de recibir), ni el motor (que
 * despacha «bien» a una dirección muerta).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LOS TRES MOMENTOS, y ninguno sobra ──────────────────────────────────
 * 1. **El arranque.** Cubre la rotación que ocurrió con la app cerrada.
 * 2. **La rotación en vivo** (`addPushTokenListener`), para la app abierta.
 * 3. 🔴 **La vuelta del fondo** (`AppState`), y es el que menos se piensa:
 *    una app que vive días en segundo plano **no arranca**, así que el punto 1
 *    no corre nunca; y si el token rotó mientras estaba dormida, el listener
 *    del punto 2 tampoco lo vio. *Sin este tercero, el caso más común de un
 *    teléfono real —abrir la app que ya estaba abierta— no sincroniza.*
 *
 * ⚠️ **Y el reintento del punto 3 cubre otro hueco que no es de token:**
 * `registrarTokenDeAparato` necesita SESIÓN. En el arranque puede no haberla
 * todavía (la app monta antes del login) y falla en silencio dentro de su
 * `try`. *Sin un segundo intento, ese aparato queda sin token hasta el próximo
 * arranque frío.*
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { sincronizarTokenSiHayPermiso } from '@/components/invitacion-avisos';

/** El contrato MÍNIMO del listener de rotación. Se declara acá y no se
 *  importan los tipos del paquete: importarlos evaluaría su JS, que es lo que
 *  la sonda existe para no hacer (patrón `permiso-push.ts` / `toque-de-push.ts`). */
interface ModuloRotacion {
  addPushTokenListener: (cb: (t: unknown) => void) => { remove: () => void };
}

/** El nativo, o `null` si el binario no lo trae. Misma sonda que sus dos
 *  vecinos — en Expo Go y en web devuelve `null` **sin lanzar**. */
function moduloRotacionSiHayNativo(): ModuloRotacion | null {
  let sonda: unknown = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require('expo-modules-core') as {
      requireOptionalNativeModule?: (nombre: string) => unknown;
    };
    sonda = core.requireOptionalNativeModule?.('ExpoNotificationPermissionsModule') ?? null;
  } catch {
    sonda = null;
  }
  if (sonda === null) return null;

  let modulo: Partial<ModuloRotacion> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('expo-notifications');
  } catch {
    return null;
  }
  /* `addPushTokenListener` no está en el contrato `ModuloAvisos` de
     `permiso-push.ts`, que declara sólo los tres métodos que ESA lib usa. Se
     comprueba acá en vez de ensanchar aquel contrato: *un contrato mínimo que
     crece con cada consumidor deja de ser mínimo y vuelve a evaluar lo que la
     sonda evita.* */
  if (modulo === null || typeof modulo.addPushTokenListener !== 'function') return null;
  return modulo as ModuloRotacion;
}

/**
 * Cablea los tres momentos. **Se monta UNA vez, en el layout raíz.**
 *
 * No devuelve nada y no dibuja nada: *si el token está al día, la única señal
 * correcta es que no pasa nada.*
 */
export function useTokenDeAvisosAlDia(): void {
  useEffect(() => {
    /* ① el arranque */
    void sincronizarTokenSiHayPermiso();

    /* ② la rotación en vivo */
    const modulo = moduloRotacionSiHayNativo();
    const susc = modulo?.addPushTokenListener(() => {
      /* No se usa el token del evento: **se vuelve a preguntar por el camino
         normal**, que además re-verifica el permiso. *Registrar el token de un
         evento sin confirmar que el permiso sigue dado escribiría una
         dirección que el SO ya no atiende.* */
      void sincronizarTokenSiHayPermiso();
    });

    /* ③ la vuelta del fondo */
    const alCambiarEstado = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void sincronizarTokenSiHayPermiso();
    });

    return () => {
      susc?.remove();
      alCambiarEstado.remove();
    };
  }, []);
}
