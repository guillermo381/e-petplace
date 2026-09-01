/**
 * EL TOQUE DE LA PUSH — a dónde lleva (S111-C, ①).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **HASTA HOY LA PUSH NO ABRÍA NINGUNA PANTALLA, EN NINGUNA DE LAS DOS
 * APPS.** Medido con control: **cero** `addNotificationResponseReceivedListener`
 * · **cero** `useLastNotificationResponse` · **cero**
 * `getLastNotificationResponseAsync` en todo el repo.
 *
 * Y tiene la forma de `L-460`: **`despachar-push` ya manda el destino en el
 * `data` de FCM y nadie lo leía.** *Un dato aceptado e ignorado se lee como
 * cableado* — el aviso llegaba correcto, el usuario lo tocaba, y la app abría
 * donde estaba.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LOS TRES ESTADOS, y ninguno es opcional ─────────────────────────────
 * 1. **App ABIERTA** — el listener recibe el toque en vivo.
 * 2. **App EN FONDO** — el mismo listener; el proceso vivía.
 * 3. **App CERRADA** — 🔴 **el listener NO alcanza**: el toque ocurrió *antes*
 *    de que el proceso existiera. Por eso se consulta además
 *    `getLastNotificationResponseAsync()`, que devuelve el toque que ARRANCÓ la
 *    app. *Un listener solo anda en dos de los tres casos y se ve como si
 *    anduviera — el estado que falta es justo el de la push que despierta al
 *    teléfono.*
 *
 * ── 🔴 NO SE NAVEGA ANTES DE QUE HAYA A DÓNDE ───────────────────────────
 * Con la app cerrada el toque llega **antes** de que el router monte. Navegar
 * ahí se pierde en silencio. Por eso esta lib **no navega: RESUELVE un destino**
 * y se lo entrega a quien sepa cuándo se puede ir — el consumidor lo aplica
 * cuando el router y la sesión existen. *(La advertencia es de A y es la clase
 * de defecto que sólo aparece en aparato.)*
 *
 * ── EL DESTINO SALE DEL DATO ────────────────────────────────────────────
 * `data.ruta`, y **jamás de parsear el título**: un título es una frase para un
 * humano, y leerlo como dirección lo convierte en API sin que nadie lo firme.
 * **Sin `ruta`, no se navega y se dice en el log** — un dato ausente se declara,
 * no se adivina ni se cae al home a propósito.
 */

/** El módulo de avisos, con el contrato MÍNIMO que esta lib usa. Se declara
 *  acá en vez de importar los tipos del paquete: importarlos evaluaría su JS,
 *  que es lo que la sonda existe para no hacer (patrón `permiso-push.ts`). */
interface ModuloToque {
  addNotificationResponseReceivedListener: (cb: (r: unknown) => void) => {
    remove: () => void;
  };
  getLastNotificationResponseAsync: () => Promise<unknown>;
}

/** El nativo, o `null` si el binario no lo trae. Mismo patrón de sonda que
 *  `permiso-push.ts` — en Expo Go y en web devuelve `null` sin lanzar. */
function moduloToqueSiHayNativo(): ModuloToque | null {
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

  let modulo: Partial<ModuloToque> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('expo-notifications');
  } catch {
    return null;
  }
  if (
    modulo === null ||
    typeof modulo.addNotificationResponseReceivedListener !== 'function' ||
    typeof modulo.getLastNotificationResponseAsync !== 'function'
  ) {
    return null;
  }
  return modulo as ModuloToque;
}

/**
 * El destino que trae un toque, o `null`.
 *
 * Se estrecha **mirando la forma**, jamás afirmándola: la respuesta viene del
 * sistema operativo y su forma cambia entre plataformas. *Un `as` acá produciría
 * una ruta `undefined` con forma de string, y `router.push` recibiría basura.*
 */
export function rutaDelToque(respuesta: unknown): string | null {
  if (typeof respuesta !== 'object' || respuesta === null) return null;
  const r = respuesta as { notification?: unknown };
  if (typeof r.notification !== 'object' || r.notification === null) return null;
  const n = r.notification as { request?: unknown };
  if (typeof n.request !== 'object' || n.request === null) return null;
  const q = n.request as { content?: unknown };
  if (typeof q.content !== 'object' || q.content === null) return null;
  const c = q.content as { data?: unknown };
  if (typeof c.data !== 'object' || c.data === null) return null;
  const d = c.data as Record<string, unknown>;
  const ruta = d.ruta;
  /* Vacío = el tipo de aviso no tiene destino, y eso NO es un error: se trata
     igual que ausente y no se navega. *Un aviso sin pantalla propia es legal;
     inventarle una es lo que no.* */
  if (typeof ruta !== 'string' || ruta.length === 0) return null;
  /* Sólo rutas internas. Una `ruta` que llegara con `http://` o con `//` vendría
     de un payload que alguien pudo componer: **el sobre de una push no es una
     fuente confiable de navegación**, y abrir lo que traiga sería confiar en
     él. */
  if (!ruta.startsWith('/') || ruta.startsWith('//')) return null;
  return ruta;
}

export interface EscuchaDeToque {
  /** El toque que ARRANCÓ la app, si la abrió una push. `null` si no. */
  destinoInicial: () => Promise<string | null>;
  /** Toques mientras la app vive (abierta o en fondo). Devuelve el retiro. */
  alTocar: (cb: (ruta: string) => void) => () => void;
}

/**
 * La escucha, o `null` si el binario no trae el nativo.
 *
 * ⚠️ **Devolver `null` y no un objeto inerte es deliberado:** el consumidor
 * tiene que poder distinguir «no hay nativo» de «no hubo toque». *Un objeto que
 * siempre contesta `null` haría las dos cosas indistinguibles, y un binario sin
 * push se vería igual que un usuario que nunca tocó nada.*
 */
export function escuchaDeToque(): EscuchaDeToque | null {
  const modulo = moduloToqueSiHayNativo();
  if (modulo === null) return null;
  return {
    destinoInicial: async () => {
      try {
        return rutaDelToque(await modulo.getLastNotificationResponseAsync());
      } catch (e) {
        console.error(`[toque-de-push] arranque · ${String(e)}`);
        return null;
      }
    },
    alTocar: (cb) => {
      const sub = modulo.addNotificationResponseReceivedListener((r) => {
        const ruta = rutaDelToque(r);
        if (ruta === null) {
          /* Se DICE. Un aviso sin destino es legal; que no se sepa cuál pasó,
             no — este log es lo único que distingue «este tipo no tiene
             pantalla» de «el listener está roto». */
          console.warn('[toque-de-push] toque sin ruta en el data: no se navega');
          return;
        }
        cb(ruta);
      });
      return () => sub.remove();
    },
  };
}
