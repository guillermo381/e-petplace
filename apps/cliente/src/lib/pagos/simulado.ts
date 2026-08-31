/**
 * QUIÉN TODAVÍA SIMULA — UNA fuente, y la superficie deriva.
 *
 * ═══ 🔴 POR QUÉ ESTE ARCHIVO EXISTE (S109-C) ══════════════════════════════
 *
 * **Porque la disciplina no alcanzó, y la prueba fue propia.** Le puse
 * «(simulado)» al CTA del programa cuando era cierto, y **no lo saqué en el
 * commit en que cablée su cobro real, dos después** — doce horas más tarde, en
 * la sesión donde venía cazando exactamente esa clase. *Si el que está mirando
 * el defecto lo comete sobre su propio texto, lo que falta no es cuidado.*
 *
 * Es la lección 15 de la casa aplicada a sí misma: **lo que faltaba no era
 * disciplina, era un mecanismo.**
 *
 * ── LA FORMA ────────────────────────────────────────────────────────────
 * La banda («el pago es simulado») y el sufijo del CTA («(simulado)») **dejan
 * de escribirse a mano**: los dos derivan de ESTE mapa. Si el sujeto simula, se
 * pintan; si no, **no existen**.
 *
 * ⇒ **Retirarlos es imposible de olvidar porque nadie los retira.** Se apagan
 * solos cuando el sujeto pasa a `false`, y el que enchufa el cobro toca UNA
 * línea acá — la misma línea que apaga las dos superficies a la vez.
 *
 * ⚠️ **El mapa es EXHAUSTIVO por tipo**: agregar un sujeto de cobro obliga a
 * declarar si simula. *Un sujeto que no está en el mapa no puede existir, y por
 * eso no puede olvidarse.*
 */

/** Los sujetos que la familia puede pagar desde una superficie propia. */
export type SujetoSimulable =
  | 'cita'
  | 'compra_despensa'
  | 'bono_guarderia'
  | 'mensualidad_guarderia'
  | 'paquete_paseo'
  | 'plan_paseo'
  | 'programa_adiestramiento';

/**
 * 🔴 **`true` = todavía NO cobra de verdad.**
 *
 * Cada `false` se puso **en el mismo acto** en que su cobro se enchufó — que es
 * justamente lo que este archivo existe para forzar.
 */
const SIMULA: Record<SujetoSimulable, boolean> = {
  cita: false,                    // S101 — la primera que dejó de simular
  compra_despensa: false,         // S101
  bono_guarderia: false,          // S108
  mensualidad_guarderia: false,   // S108
  paquete_paseo: false,           // S109
  programa_adiestramiento: false, // S109
  /* 🔴 EL ÚNICO QUE QUEDA. Su sujeto no existe todavía en `SujetoDeCobro`
     (`suscripciones_servicio`), así que su checkout **contrata sin cobrar** y lo
     dice. **El día que A publique el sujeto, esta línea pasa a `false` y con
     ella desaparecen la banda y el sufijo, sin tocar ninguna pantalla.** */
  plan_paseo: true,
};

/** ¿Este sujeto todavía simula el cobro? */
export function simula(sujeto: SujetoSimulable): boolean {
  return SIMULA[sujeto];
}
