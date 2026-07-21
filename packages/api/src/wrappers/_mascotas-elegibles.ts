// S73-A · frontera ÚNICA de ELEGIBILIDAD de mascota para reservar un servicio
// (letra del selector por elegibilidad, firmada en mesa S73 — corolario de la
// Ley 23: "la puerta no pregunta lo que ya sabe"; el N del selector es de
// MOTOR, no de pantalla).
//
// DOS filtros, EN ESTE ORDEN:
//  1. MOMENTO VITAL PRIMERO (patrón MODELO_LOYALTY §7.1 — apagado
//     ESTRUCTURAL, jamás un if de UI): elegible ⇔ estado_vida === 'activa'.
//     Memorial ('fallecida') NO es elegible para ningún servicio; 'perdida'
//     tampoco (doble precedente de la casa, regla 67: el mostrador vet ya
//     filtra .eq('estado_vida','activa') y la convención viva es
//     es_memorial = estado_vida !== 'activa'). null — fuera del CHECK,
//     angostado honesto — NO es elegible: la elegibilidad falla CERRADA.
//  2. Especie por servicio (§1bis, decisión founder S57: el paseo es solo
//     perros; cada servicio declara sus especies en
//     tipos_servicio.especies_elegibles). especiesElegibles === null = el
//     servicio no restringe especie — la VETERINARIA pasa todas POR DISEÑO
//     (multi-especie es decisión, no omisión).
//
// PURA a propósito (patrón _presupuesto-descripcion): opera sobre datos que
// el caller YA tiene — cero roundtrips nuevos. Las pantallas BORRAN su
// filtro artesanal (Ley 37) y jamás re-computan elegibilidad.

/** El CHECK vivo de mascotas.estado_vida (chk_mascotas_estado_vida). */
export type EstadoVidaMascota = 'activa' | 'perdida' | 'fallecida';

export function mascotasElegibles<
  M extends { especie: string; estado_vida: EstadoVidaMascota | null },
>(mascotas: M[], especiesElegibles: readonly string[] | null): M[] {
  return mascotas.filter(
    (m) =>
      m.estado_vida === 'activa' &&
      (especiesElegibles === null || especiesElegibles.includes(m.especie)),
  );
}
