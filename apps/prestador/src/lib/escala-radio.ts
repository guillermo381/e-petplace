/**
 * LA ESCALA DEL RADIO DE COBERTURA — firmada de mesa (13-ago, S97):
 * 5 a 50 km en pasos de 5, default 15 km (índice 2), diez pasos.
 * El consumidor es el cuarto ③ de la configuración de la despensa
 * (`MODELO_DESPENSA` §8.6bis), sobre `SliderPrecio` con `registro="aa"`.
 *
 * ⚠️ EL CUARTO ③ TODAVÍA NO SE MONTA: el radio de la CUENTA COMERCIAL no
 * tiene esquema (pedido A-3; `radio_cobertura_km` hoy vive solo en
 * `prestadores`, y la configuración cuelga de la cuenta — firma de mesa).
 * Este módulo existe para que el montaje sea un drop-in cuando A entregue,
 * con la aritmética ya correcta y verificable.
 *
 * Lo que B midió y esta aritmética honra:
 *  · la base NO obliga múltiplos de 5 ⇒ `indiceDesdeKm` REDONDEA al paso
 *    más cercano y ACOTA al rango — jamás una división a secas;
 *  · la pieza solo emite índices legales ⇒ acá no hay validación de
 *    salida: `kmDesdeIndice` es un lookup acotado.
 */

/** Los diez pasos firmados, en km. */
export const ESCALA_RADIO_KM = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const;

/** 15 km — el default firmado (S79 lo firmó como default del prestador;
 *  la mesa lo conserva para la despensa). */
export const INDICE_RADIO_DEFAULT = 2;

/** Las etiquetas para `SliderPrecio.pasos`, en la voz del control. */
export const PASOS_RADIO = ESCALA_RADIO_KM.map((km) => `${km} km`);

/** km guardado → índice de la escala. Redondea al paso más cercano y
 *  acota al rango (guía de B: la base no obliga múltiplos de 5).
 *  null/no-finito → el default, que es lo que la letra manda ofrecer. */
export function indiceDesdeKm(km: number | null | undefined): number {
  if (km == null || !Number.isFinite(km)) return INDICE_RADIO_DEFAULT;
  const paso = 5;
  const indice = Math.round(km / paso) - 1;
  return Math.min(Math.max(indice, 0), ESCALA_RADIO_KM.length - 1);
}

/** índice legal → km. El índice viene de la pieza (solo emite legales);
 *  el clamp es cinturón, no camino. */
export function kmDesdeIndice(indice: number): number {
  const i = Math.min(Math.max(indice, 0), ESCALA_RADIO_KM.length - 1);
  return ESCALA_RADIO_KM[i];
}
