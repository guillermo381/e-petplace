// ============================================================================
// _shared/despacho.ts — EL GUARD DE LAS FUNCIONES QUE LLAMA EL CRON (D-713)
//
// La letra que este guard existe para cumplir, medida en S92-BIS:
// **`verify_jwt: true` NO protege una function de este tipo.** Valida que el
// JWT sea *válido*, y **la anon key ES un JWT válido** que además viaja en el
// bundle de las apps (L-714). Una function que procesa cola y devuelve 200 con
// la clave pública en la mano está abierta a internet.
// ⇒ el guard tiene que estar ADENTRO, y no puede ser una perilla del panel.
//
// El secreto lo comparten el cron y la function. El cron lo manda en
// `x-despacho-secret`; sin él, o con otro, la function rebota 401 y **no toca
// la cola**.
//
// ── POR QUÉ ESTE ARCHIVO EXISTE Y NO ES UNA CUARTA COPIA ────────────────────
// Los tres despachadores curados el 9-ago llevan este mismo cuerpo copiado.
// La cuarta function (`barrer-storage`) lo toma de acá en vez de clonarlo:
// **es el mismo patrón, en un solo lugar**. Los tres que ya están en verde NO
// se tocan — reescribir código verde para unificarlo es riesgo sin beneficio;
// migran cuando alguno se toque por otra razón.
// ============================================================================

/**
 * Devuelve `null` si la llamada está autorizada, o la respuesta de rechazo.
 *
 * **Sin secreto configurado devuelve 500, jamás pasa.** Un guard que se
 * desactiva solo cuando falta su configuración es peor que no tener guard:
 * falla abierto justo el día que alguien rota mal una variable (L-192).
 */
export function guardDespacho(req: Request): Response | null {
  const esperado = Deno.env.get('DESPACHO_SECRET');
  if (!esperado) {
    return Response.json({ error: 'despacho_sin_secreto_configurado' }, { status: 500 });
  }
  const dado = req.headers.get('x-despacho-secret');
  if (dado !== esperado) {
    return Response.json({ error: 'despacho_no_autorizado' }, { status: 401 });
  }
  return null;
}
