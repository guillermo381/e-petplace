// ═══════════════════════════════════════════════════════════════════════════
// EL TECHO DE TIEMPO DE LA RED — `D-1070`
//
// 🔴 POR QUÉ EXISTE, con el síntoma delante: `createClient` no pasaba `fetch`
//    propio, así que **una consulta que salía y no volvía no volvía nunca**. No
//    hay error, no hay `catch`: el `await` queda colgado y la pantalla se queda
//    en el esqueleto para siempre. El 11-sep-2026 el founder lo vio en todas
//    las pantallas a la vez, y el servidor estaba sano —medido: 10 consultas en
//    paralelo, las 10 en 200, 0,65 s en total—.
//
//    *No hace falta un OTA descargando para que pase: alcanza un ascensor, un
//    subte o un wifi de cafetería.* Con usuarios reales va a pasar, y sin techo
//    la app no puede ni decirlo.
//
// 🔴 EL TECHO NO ES UNO SOLO, y esa es la decisión: una lectura de pantalla se
//    puede rendir en segundos; una subida de 5 MB tardó 44 s medidos (`D-734`)
//    y abortarla sería peor que esperarla. Los cuatro valores son DATO en
//    `app_config` y los firmó el founder con su origen escrito.
// ═══════════════════════════════════════════════════════════════════════════

/** El prefijo del mensaje cuando el techo se cumple. Estable a propósito. */
export const SIN_RED = 'sin_red';

export type ClaseDeLlamada = 'lectura' | 'escritura' | 'auth' | 'refresco' | 'subida' | 'sin_techo';

/**
 * Los valores DE ARRANQUE.
 *
 * 🔴 Existen por un huevo-y-gallina que no se puede esquivar: para leer los
 *    techos de `app_config` hay que hacer una petición, y esa petición necesita
 *    un techo. *Un arranque sin número volvería a ser un `await` colgado, que
 *    es exactamente lo que esto viene a matar.* Son los mismos números que la
 *    base, y se reemplazan en cuanto la config llega.
 */
const ARRANQUE: Record<Exclude<ClaseDeLlamada, 'sin_techo'>, number> = {
  lectura: 8000, escritura: 20000, auth: 20000, refresco: 8000, subida: 120000,
};

let techos = { ...ARRANQUE };

/** La config manda en cuanto llega. Valores no positivos se IGNORAN. */
export function fijarTechosDeRed(v: Partial<typeof ARRANQUE>): void {
  for (const [k, ms] of Object.entries(v)) {
    if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
      techos[k as keyof typeof ARRANQUE] = ms;
    }
  }
}

export function techosVigentes(): Readonly<typeof ARRANQUE> {
  return { ...techos };
}

/**
 * A qué clase pertenece una llamada, DERIVADO de su URL y su método.
 *
 * 🔴 Se deriva porque el cliente de Supabase no dice qué está haciendo: el
 *    `fetch` recibe una URL y nada más. *Pedirle a cada wrapper que declare su
 *    clase sería tocar 384 sitios y confiar en que nadie se olvide.*
 *
 * 🔴 `/functions/v1/` QUEDA SIN TECHO, y es la decisión más importante de este
 *    archivo: por ahí pasa el cobro. Un timeout deja el intento en `pendiente`,
 *    y hoy eso **bloquea a ese sujeto** —`D-1069`: 16 llevan dos semanas—. El
 *    orden lo firmó el founder: la conciliación barre primero, el techo del
 *    pago entra después, y midiendo antes la llamada HTTP sola.
 */
export function claseDeLlamada(url: string, metodo: string): ClaseDeLlamada {
  if (url.includes('/functions/v1/')) return 'sin_techo';
  if (url.includes('/storage/v1/')) return 'subida';
  /* 🔴 EL REFRESCO TIENE SU PROPIA CLASE, Y SU TECHO ES MÁS CORTO QUE EL DEL
     LOGIN. Es contraintuitivo y por eso va escrito acá y no en una ficha: **el
     próximo que lea «20 s» lo va a leer como generoso.**

     Lo que sostiene la sesión NO es un intento largo: es el PRESUPUESTO DE
     REINTENTOS. `auth-js` reintenta el refresh con espera creciente
     (200·400·800 ms) pero corta cuando el total pasa de 30 s
     (`AUTO_REFRESH_TICK_DURATION_MS`, medido en el paquete). Un techo largo se
     come ese presupuesto en el primer intento:

       techo 20 s → 2 intentos en 40 s   ← lo que había
       techo  8 s → 4 intentos en 33 s
       techo  5 s → 5 intentos en 28 s

     Y rendirse cuesta caro: tras fallar entra un enfriamiento de 60 s
     (`REFRESH_FAILURE_COOLDOWN_MS`) ⇒ **~100 segundos con la sesión muerta**,
     y en ese hueco las DOS apps quedan mudas mientras el teléfono navega
     perfecto. *Ese fue el síntoma de cuatro de cinco publishes, y se leía como
     un problema de red* (`D-1074`).

     🔴 EL LOGIN SE QUEDA EN 20 s, a propósito: es del usuario, está mirando la
     pantalla, y puede esperar. El refresco es de la máquina y nadie lo mira —
     por eso el que tiene que fallar rápido y reintentar es él. */
  if (url.includes('/auth/v1/token') && url.includes('grant_type=refresh_token')) return 'refresco';
  if (url.includes('/auth/v1/')) return 'auth';
  const m = (metodo || 'GET').toUpperCase();
  /* Una RPC puede leer o escribir y desde afuera no se distingue. Se le da el
     techo de ESCRITURA: *rendirse temprano sobre algo que escribe es el error
     caro; esperar de más sobre una lectura sólo cuesta segundos.* */
  if (url.includes('/rest/v1/rpc/')) return 'escritura';
  return m === 'GET' || m === 'HEAD' ? 'lectura' : 'escritura';
}

/**
 * El `fetch` de la casa.
 *
 * 🔴 CUANDO EL TECHO SE CUMPLE, LANZA — y el mensaje empieza con `sin_red:`,
 *    estable, para que cualquier normalizador pueda reconocerlo. *La mitad que
 *    importa no es abortar: es que la pantalla pueda decir que no cargó y
 *    ofrecer reintentar, en vez de quedarse esperando para siempre.*
 */
/**
 * 🔴 LA SEÑAL DE QUE LA SESIÓN NO ESTÁ VIVA — y nace ACÁ porque acá es donde
 *    el fallo se ve primero. `onAuthStateChange` avisa cuando la sesión
 *    CAMBIA; no avisa cuando el refresco **falla y sigue fallando**, que es el
 *    estado en el que la app pasa sus peores cien segundos.
 *
 * *Sin esto, un refresco caído y una consulta caída producen el mismo texto en
 * pantalla —«no cargó»— y eso costó cuatro vueltas buscando del lado
 * equivocado* (`D-1074`).
 */
let _refrescoFallidoEn: number | null = null;

/** Milisegundos desde el último refresco que no volvió, o `null` si el último anduvo. */
export function refrescoCaidoHace(): number | null {
  return _refrescoFallidoEn === null ? null : Date.now() - _refrescoFallidoEn;
}

/** Lo llama el cliente cuando `auth-js` avisa `TOKEN_REFRESHED`: la sesión revivió. */
export function marcarRefrescoSano(): void {
  _refrescoFallidoEn = null;
}

export function fetchConTecho(fetchBase: typeof fetch = fetch): typeof fetch {
  return async (entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof entrada === 'string' ? entrada
      : entrada instanceof URL ? entrada.toString()
      : (entrada as Request).url;
    const metodo = init?.method ?? (entrada as Request)?.method ?? 'GET';
    const clase = claseDeLlamada(url, metodo);

    if (clase === 'sin_techo') return fetchBase(entrada as RequestInfo, init);

    const ms = techos[clase];
    /* Se respeta una señal que ya venga: quien la mandó tiene su propia razón
       y pisarla convertiría su cancelación en un cuelgue. */
    const propia = new AbortController();
    const previa = init?.signal;
    if (previa) {
      if (previa.aborted) propia.abort(previa.reason);
      else previa.addEventListener('abort', () => propia.abort(previa.reason), { once: true });
    }
    const reloj = setTimeout(
      () => propia.abort(new Error(`${SIN_RED}: la consulta superó el techo de ${ms} ms`)),
      ms,
    );
    try {
      const r = await fetchBase(entrada as RequestInfo, { ...init, signal: propia.signal });
      if (clase === 'refresco' && r.ok) _refrescoFallidoEn = null;
      return r;
    } catch (e) {
      /* 🔴 El error del techo se distingue del de red real, y los dos se
         devuelven con el MISMO prefijo: desde la pantalla son la misma cosa
         —no cargó y se puede reintentar—, y darles códigos distintos obligaría
         a cada superficie a manejar dos casos con la misma respuesta. */
      /* Un refresco que no vuelve NO es una consulta más: es lo que sostiene
         todo lo demás, y se anota para que la superficie pueda decirlo. */
      if (clase === 'refresco') _refrescoFallidoEn = Date.now();
      const msg = String((e as Error)?.message ?? e);
      if (msg.startsWith(SIN_RED)) throw e;
      throw new Error(`${SIN_RED}: ${msg.slice(0, 160)}`);
    } finally {
      clearTimeout(reloj);
    }
  };
}

/** ¿Este fallo es de red? Lo pueden preguntar los wrappers y las pantallas. */
export function esSinRed(x: unknown): boolean {
  const s = typeof x === 'string' ? x : String((x as Error)?.message ?? x ?? '');
  return s.startsWith(SIN_RED) || s.includes(`${SIN_RED}:`);
}

/**
 * Trae los cuatro techos de `app_config` y los aplica.
 *
 * 🔴 Se llama UNA vez al arrancar la app, y su fallo NO es grave: los valores
 *    de arranque son los mismos que la base. *Lo único que se pierde si no se
 *    llama es poder moverlos sin publicar* — que es justamente por lo que son
 *    dato. Por eso no lanza: devuelve si pudo o no, y el que llama decide.
 */
export async function cargarTechosDeRed(
  leer: () => Promise<Array<{ clave: string; valor: string }> | null>,
): Promise<{ ok: boolean; aplicados: number }> {
  let filas: Array<{ clave: string; valor: string }> | null = null;
  try { filas = await leer(); } catch { return { ok: false, aplicados: 0 }; }
  if (!filas?.length) return { ok: false, aplicados: 0 };

  const mapa: Record<string, keyof ReturnType<typeof techosVigentes>> = {
    red_techo_lectura_ms: 'lectura', red_techo_escritura_ms: 'escritura',
    red_techo_auth_ms: 'auth', red_techo_refresco_ms: 'refresco',
    red_techo_subida_ms: 'subida',
  };
  const parche: Record<string, number> = {};
  let n = 0;
  for (const f of filas) {
    const clase = mapa[f.clave];
    const ms = Number(f.valor);
    if (clase && Number.isFinite(ms) && ms > 0) { parche[clase] = ms; n++; }
  }
  fijarTechosDeRed(parche);
  return { ok: n > 0, aplicados: n };
}
