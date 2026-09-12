/**
 * EL PULSO — sonda temporal de `D-1074`. **Cuenta actos, jamás valores.**
 *
 * 🔴 POR QUÉ EXISTE, y por qué tiene DOS brazos y no uno.
 *
 * El heap de Java crece ~1,6 MB/s con la app quieta en el Home y **el log de
 * anoche midió CERO resoluciones de DNS durante los 2 min 24 s de
 * crecimiento** (27 en total: 6 en el arranque, 4 en el instante del OOM).
 *
 * ⚠️ Eso mata la lectura fácil —«hay un bucle de consultas REST»— y de paso
 * corrige la mía: `Http2Reader.nextFrame` y `nativeGetString` aparecieron en
 * las pilas del OOM, **pero una pila en el momento de un OOM dice dónde estaba
 * el hilo cuando faltó memoria, no quién la consumió**. Son candidatas a
 * VÍCTIMA. Es el mismo error de lectura que esta ficha ya cobró dos veces.
 *
 * ⇒ Por eso hay dos brazos, y el segundo es el que importa:
 *
 *   ① **RED** — cuántas peticiones salen y a qué ruta. Si el bucle fuera de
 *      consultas, acá se ve. *Su valor real es poder DESCARTARLO en una
 *      corrida: un brazo en cero es una medición, no un silencio.*
 *
 *   ② **PUENTE** — cuántas veces se cruza al nativo de AsyncStorage y cuántas
 *      se pide la sesión, **aunque no salga una sola petición**. Un bucle que
 *      lee del almacenamiento y no sale a la red —porque la respuesta está en
 *      caché, o porque nunca llega a salir— **es el único que explica el cero
 *      de DNS**, y ningún instrumento de red lo puede ver.
 *
 * 🔴 QUÉ NO IMPRIME, y es deliberado: **ningún valor, ninguna clave, ningún
 *    parámetro**. La sesión de Supabase vive en ese puente y es una credencial;
 *    las rutas se imprimen **sin query string**, porque un filtro de PostgREST
 *    lleva datos adentro. Sólo salen conteos y rutas.
 *
 * Se retira cuando `D-1074` tenga su mecanismo con nombre.
 */

const VENTANA_MS = 10_000;

type Conteos = {
  red: number;
  sesion: number;
  puente: number;
  /** Ruta → veces. Sin query: un filtro de PostgREST lleva datos adentro. */
  rutas: Map<string, number>;
  /** Operación del puente (`getItem`…) → veces. Nunca la clave. */
  ops: Map<string, number>;
};

function vacio(): Conteos {
  return { red: 0, sesion: 0, puente: 0, rutas: new Map(), ops: new Map() };
}

let c = vacio();
let reloj: ReturnType<typeof setInterval> | null = null;
/** El tick anterior, para que el log diga si sube o se mantiene. */
let tick = 0;

function sumar(m: Map<string, number>, k: string): void {
  m.set(k, (m.get(k) ?? 0) + 1);
}

/** Los tres primeros de un mapa, por cantidad. Formato corto a propósito. */
function top(m: Map<string, number>, n = 3): string {
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k}×${v}`)
    .join(' ');
}

function arrancar(): void {
  if (reloj) return;
  reloj = setInterval(() => {
    tick++;
    const { red, sesion, puente } = c;
    /* Se imprime SIEMPRE, también en cero: *un brazo en cero es un dato, y el
       silencio de una sonda es indistinguible de una sonda que no corre.* */
    // eslint-disable-next-line no-console
    console.log(
      `[pulso] t=${tick * (VENTANA_MS / 1000)}s · red=${red} sesion=${sesion} puente=${puente}` +
        (red ? ` · rutas: ${top(c.rutas)}` : '') +
        (puente ? ` · ops: ${top(c.ops)}` : ''),
    );
    c = vacio();
  }, VENTANA_MS);
  /* No mantiene vivo al proceso si el runtime lo soporta (en RN es no-op). */
  (reloj as unknown as { unref?: () => void })?.unref?.();
}

/** ① Una petición salió. `url` se recorta a su ruta: el query lleva datos. */
export function pulsoRed(url: string): void {
  arrancar();
  c.red++;
  let ruta = url;
  const q = ruta.indexOf('?');
  if (q >= 0) ruta = ruta.slice(0, q);
  /* Sólo la cola de la ruta: el host es siempre el mismo y ocupa la línea. */
  const i = ruta.indexOf('/rest/v1/');
  const j = ruta.indexOf('/auth/v1/');
  const k = ruta.indexOf('/functions/v1/');
  const s = ruta.indexOf('/storage/v1/');
  const corte = [i, j, k, s].filter((x) => x >= 0)[0];
  sumar(c.rutas, (corte === undefined ? ruta : ruta.slice(corte)).slice(0, 60));
}

/** ② Alguien pidió la sesión — cruce al puente aunque no salga red. */
export function pulsoSesion(): void {
  arrancar();
  c.sesion++;
}

/** ② Un cruce al nativo de AsyncStorage. **La clave NO se registra.** */
export function pulsoPuente(operacion: string): void {
  arrancar();
  c.puente++;
  sumar(c.ops, operacion);
}
