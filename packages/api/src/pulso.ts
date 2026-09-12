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
/** Los primeros 30 s se loguea CADA petición, no sólo el agregado.
 *  *El defecto vive en el arranque: ahí hace falta el detalle, y después no.* */
const DETALLE_MS = 30_000;
const t0 = Date.now();
const enArranque = (): boolean => Date.now() - t0 < DETALLE_MS;

type Conteos = {
  red: number;
  /** Cuántas de las que salieron VOLVIERON (con respuesta, sea cual sea). */
  vueltas: number;
  /** Cuántas terminaron en error (techo incluido). */
  fallos: number;
  sesion: number;
  puente: number;
  /** Ruta → veces. Sin query: un filtro de PostgREST lleva datos adentro. */
  rutas: Map<string, number>;
  /** Operación del puente (`getItem`…) → veces. Nunca la clave. */
  ops: Map<string, number>;
};

function vacio(): Conteos {
  return { red: 0, vueltas: 0, fallos: 0, sesion: 0, puente: 0, rutas: new Map(), ops: new Map() };
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
    const { red, vueltas, fallos, sesion, puente } = c;
    /* Se imprime SIEMPRE, también en cero: *un brazo en cero es un dato, y el
       silencio de una sonda es indistinguible de una sonda que no corre.* */
    // eslint-disable-next-line no-console
    console.log(
      `[pulso] t=${tick * (VENTANA_MS / 1000)}s · salieron=${red} volvieron=${vueltas} ` +
        `fallaron=${fallos} · pendientes=${red - vueltas - fallos} · sesion=${sesion} puente=${puente}` +
        (red ? ` · rutas: ${top(c.rutas)}` : '') +
        (puente ? ` · ops: ${top(c.ops)}` : ''),
    );
    c = vacio();
  }, VENTANA_MS);
  /* No mantiene vivo al proceso si el runtime lo soporta (en RN es no-op). */
  (reloj as unknown as { unref?: () => void })?.unref?.();
}

/** La ruta sin query y sin host: **el query lleva datos adentro**. */
function rutaCorta(url: string): string {
  let ruta = url;
  const q = ruta.indexOf('?');
  if (q >= 0) ruta = ruta.slice(0, q);
  /* Sólo la cola de la ruta: el host es siempre el mismo y ocupa la línea. */
  const i = ruta.indexOf('/rest/v1/');
  const j = ruta.indexOf('/auth/v1/');
  const k = ruta.indexOf('/functions/v1/');
  const s = ruta.indexOf('/storage/v1/');
  const corte = [i, j, k, s].filter((x) => x >= 0)[0];
  return (corte === undefined ? ruta : ruta.slice(corte)).slice(0, 60);
}

/** ① Una petición SALIÓ. */
export function pulsoRed(url: string): void {
  arrancar();
  c.red++;
  sumar(c.rutas, rutaCorta(url));
  if (enArranque()) {
    // eslint-disable-next-line no-console
    console.log(`[pulso] → ${rutaCorta(url)}`);
  }
}

/**
 * ① La petición TERMINÓ. **Éste es el brazo que faltaba y el que decide.**
 *
 * 🔴 Contar sólo las que SALEN no distingue los dos síntomas que el founder
 *    describe distinto: *«no sale»* y *«sale y nunca vuelve»*. `pendientes` es
 *    la resta, y **una `pendientes` que sube y no baja es el defecto con
 *    nombre**: la consulta se fue y el resultado no llega jamás.
 */
export function pulsoRedFin(url: string, ok: boolean, ms: number): void {
  if (ok) c.vueltas++;
  else c.fallos++;
  if (enArranque()) {
    // eslint-disable-next-line no-console
    console.log(`[pulso] ← ${ok ? 'ok' : 'FALLO'} ${ms}ms ${rutaCorta(url)}`);
  }
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

/**
 * ③ **EL ARRANQUE DEL ACCESO A LA BASE — el instrumento que pidió el founder.**
 *
 * 🔴 Su tesis, y es la que reordena la ficha: *la app está VIVA —el contenido
 *    estático carga, el menú navega— y sólo falla lo que viene de la BASE.* Si
 *    en el arranque que aplica el OTA el cliente nace mal —sin URL, sin clave,
 *    o con la sesión todavía sin leer del almacenamiento— **toda consulta queda
 *    esperando sin error**, que es literalmente lo que se ve. Y el OOM de más
 *    tarde deja de ser la causa para ser la consecuencia de reintentar.
 *
 * 🔴 **NO IMPRIME NI LA CLAVE NI EL TOKEN.** De la URL sale sólo el host —que
 *    ya vive en el canon— y de la clave sólo su largo. *Un secreto enmascarado
 *    sigue estando en el transcript, y un transcript no se edita después.*
 */
export function pulsoInicio(url: string, largoClave: number): void {
  let host = '(vacía)';
  try { host = new URL(url).host; } catch { host = url ? '(ilegible)' : '(vacía)'; }
  // eslint-disable-next-line no-console
  console.log(`[pulso-init] host=${host} clave=${largoClave > 0 ? `${largoClave} chars` : 'AUSENTE'}`);
}

/** ③ El resultado de leer la sesión del almacenamiento, con su demora. */
export function pulsoSesionInicial(hay: boolean, ms: number, error: string | null): void {
  // eslint-disable-next-line no-console
  console.log(`[pulso-init] sesion=${hay ? 'sí' : 'NO'} en ${ms}ms${error ? ` · error=${error.slice(0, 80)}` : ''}`);
}

/** ③ El resultado de cargar los techos — el sospechoso de `D-1080`. */
export function pulsoTechos(ok: boolean, aplicados: number, ms: number): void {
  // eslint-disable-next-line no-console
  console.log(`[pulso-init] techos=${ok ? 'sí' : 'NO'} aplicados=${aplicados} en ${ms}ms`);
}
