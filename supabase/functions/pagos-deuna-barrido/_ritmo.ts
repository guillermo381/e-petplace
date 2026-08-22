// ═══════════════════════════════════════════════════════════════════════════
// S103-D · EL RITMO — espaciado y backoff contra el rate limit de DeUna
//
// 🔴 MEDIDO CONTRA QA (S103-D §2quater): **dos llamadas seguidas sin pausa
//    devuelven `429 · "Rate limit is exceeded. Try again in 1 seconds."`**
//    Con 1,8 s de espaciado, cero 429 en toda la corrida.
//
// 🔴🔴 LA REGLA DURA, Y ES LA RAZÓN DE QUE ESTE ARCHIVO EXISTA:
//    **UN 429 JAMÁS SE LEE COMO FALLO DEL PAGO Y JAMÁS TRANSICIONA NADA.**
//
//    Un 429 significa *«no pude preguntar»*, no *«el pago no existe»* ni *«el
//    pago falló»*. Confundirlos sería marcar como huérfano un cobro perfecto
//    porque el barrido consultó demasiado rápido — *y el barrido corre solo,
//    de noche, sin nadie mirando.*
//
//    Por eso `pedirConRitmo` **nunca devuelve un cuerpo interpretable cuando no
//    pudo preguntar**: devuelve `{ ok: false, motivo: 'rate_limit' | 'red' }`,
//    y el llamador no tiene forma de confundirlo con una respuesta.
// ═══════════════════════════════════════════════════════════════════════════

/** ≥ 1 s entre llamadas. El proveedor pide 1; se toma margen. */
export const ESPACIADO_MS = 1_200;
export const REINTENTOS_429 = 3;

export type Respuesta =
  | { ok: true; status: number; cuerpo: unknown }
  /* 🔴 `ok:false` NO trae cuerpo A PROPÓSITO. *Si trajera uno, alguien lo
     leería, y ahí es donde un 429 se convierte en un pago dado por perdido.* */
  | { ok: false; motivo: 'rate_limit' | 'red' | 'http'; status?: number; detalle: string };

/** Inyectables, para que el test no tarde segundos reales. */
export interface Deps {
  fetch: typeof fetch;
  dormir: (ms: number) => Promise<void>;
  ahora: () => number;
}

export const depsReales: Deps = {
  fetch: (...a) => fetch(...a),
  dormir: (ms) => new Promise((r) => setTimeout(r, ms)),
  ahora: () => Date.now(),
};

/** Lee «Try again in N seconds» del propio mensaje del proveedor.
 *  *Preferir su número al nuestro: él sabe cuánto falta y nosotros
 *  adivinaríamos.* */
export function esperaSugerida(cuerpo: string): number | null {
  const m = /try again in (\d+)\s*second/i.exec(cuerpo);
  return m ? Number(m[1]) * 1000 : null;
}

/**
 * Un pedido al API de DeUna, con espaciado y backoff.
 *
 * `estado` guarda el instante de la última llamada — **se comparte entre todas
 * las llamadas del barrido**, que es lo que hace que el espaciado sea real y
 * no por-llamada.
 */
export async function pedirConRitmo(
  url: string,
  init: RequestInit,
  estado: { ultima: number },
  deps: Deps = depsReales,
): Promise<Respuesta> {
  for (let intento = 0; intento <= REINTENTOS_429; intento++) {
    // ── ESPACIADO: nunca dos seguidas ──────────────────────────────────────
    const desde = deps.ahora() - estado.ultima;
    if (estado.ultima > 0 && desde < ESPACIADO_MS) {
      await deps.dormir(ESPACIADO_MS - desde);
    }

    let r: Response;
    let texto = '';
    try {
      r = await deps.fetch(url, init);
      texto = await r.text();
    } catch (e) {
      estado.ultima = deps.ahora();
      /* Red caída ≠ pago fallido. Mismo principio que el 429. */
      return { ok: false, motivo: 'red', detalle: String(e).slice(0, 200) };
    }
    estado.ultima = deps.ahora();

    if (r.status === 429) {
      /* 🔴 NO es un fallo del pago: es que preguntamos rápido. Se espera lo que
         el proveedor pide (o el espaciado, si no lo dice) y se reintenta. */
      if (intento < REINTENTOS_429) {
        const sugerida = esperaSugerida(texto);
        // Backoff creciente además de lo sugerido: si el primero no alcanzó,
        // repetir el mismo número tampoco va a alcanzar.
        await deps.dormir((sugerida ?? ESPACIADO_MS) * (intento + 1));
        continue;
      }
      return { ok: false, motivo: 'rate_limit',
               detalle: `429 tras ${REINTENTOS_429} reintentos: no pudimos preguntar` };
    }

    if (!r.ok) {
      return { ok: false, motivo: 'http', status: r.status,
               detalle: texto.slice(0, 200) };
    }

    let cuerpo: unknown = {};
    try { cuerpo = JSON.parse(texto); } catch { cuerpo = { crudo: texto.slice(0, 500) }; }
    return { ok: true, status: r.status, cuerpo };
  }
  // Inalcanzable, pero el tipo lo exige y un throw acá sería peor.
  return { ok: false, motivo: 'rate_limit', detalle: 'agotado' };
}
