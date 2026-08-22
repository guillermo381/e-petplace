// ═══════════════════════════════════════════════════════════════════════════
// S103-D · EL MOTIVO DEL RECHAZO — leído de la forma REAL del error de DeUna
//
// 🔴 POR QUÉ EXISTE ESTE ARCHIVO: lo cazó el E2E contra el simulador, y era
//    defecto del código, no del instrumento. Con un `pointOfSale` equivocado la
//    puerta devolvía:
//
//        motivo: "[object Object]: sin transactionId: sin numericCode"
//
//    El error de DeUna viene **anidado** (`message.response.message`, a veces
//    array, a veces string) y un `String(...)` encima lo aplasta a
//    `[object Object]`.
//
//    *Es `L-316` en su forma más engañosa: el motivo no quedó null —quedó
//    RELLENO, y con cara de informativo—. Un motivo vacío hace que alguien vaya
//    a abrir el crudo; uno que dice `[object Object]` hace que se dé por leído.*
//
//    Lo que se perdía era literalmente la causa: `Hierarchy tree parent 1234
//    not found`, que es el mensaje que le dice al operador qué configurar.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Saca el texto útil de un cuerpo de error de DeUna.
 *
 * Las tres formas están **medidas contra QA** (S103-D §2bis):
 *   ① `{ statusCode, message: "Access denied…" }`                 → string plano
 *   ② `{ message: { response: { message: ["a", "b"] } } }`        → array
 *   ③ `{ message: { response: { message: "Entity does not exist…",
 *                               errors: [{ reason: "Hierarchy…" }] } } }`
 *
 * En ③ **el texto que importa está en `errors[].reason`**, no en `message`:
 * *«Entity does not exist in system» no le dice a nadie qué arreglar;
 * «Hierarchy tree parent 1234 not found» sí.*
 */
export function motivoDeError(cuerpo: unknown, status: number): string {
  const partes: string[] = [];

  const texto = (v: unknown): string => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v.map(texto).filter(Boolean).join(' · ');
    return '';   // 🔴 un objeto NO se estampa: eso es lo que producía [object Object]
  };

  const c = (cuerpo ?? {}) as Record<string, any>;
  const m = c.message;

  partes.push(texto(m));                       // ① string plano
  partes.push(texto(m?.response?.message));    // ② y ③
  partes.push(texto(c.response?.message));     // por si viene un nivel arriba

  // ③ Las razones concretas — lo más útil de todo el cuerpo.
  const errs = m?.response?.errors ?? c.errors ?? [];
  if (Array.isArray(errs)) {
    for (const e of errs) {
      partes.push(texto(e?.reason));
      // el detalle anidado del proveedor, cuando lo trae
      const d = e?.details;
      if (Array.isArray(d)) for (const x of d) partes.push(texto(x?.reason));
    }
  }

  const salida = partes
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    // Sin repetidos: `message` y `response.message` suelen decir lo mismo.
    .filter((s, i, a) => a.indexOf(s) === i)
    .join(': ')
    .slice(0, 400);

  /* 🔴 Último recurso con el status, JAMÁS vacío ni `[object Object]`
     (L-316). *Un rechazo sin motivo obliga a abrir el crudo, y nadie lo abre
     cuando hay una explicación plausible a mano.* */
  return salida || `http_${status}`;
}
