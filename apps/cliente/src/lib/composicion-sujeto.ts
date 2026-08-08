/**
 * S91-D · LA COMPOSICIÓN POR SUJETO — UNA sola, para TODAS las superficies.
 *
 * ── POR QUÉ NACE, y es una reincidencia mía ─────────────────────────────────
 * P7 dice que el acuario ve la MISMA pantalla con lo que no le aplica AUSENTE.
 * Lo compuse en el perfil con una constante `monta` y lo di por cerrado — con
 * su assert por sección y todo. El founder lo volvió a encontrar **en el Hogar,
 * en «Ponte al día»**: le pedía cargar el carnet de vacunas de un acuario.
 *
 * La causa no fue un olvido: **la composición vivía DENTRO de una pantalla.**
 * Otra superficie que hable de la misma mascota no tiene cómo consultarla, así
 * que compone por su cuenta — y componer por su cuenta es no componer. Medido:
 * `hogar/index.tsx` tenía **cero** referencias a `sujeto`.
 *
 * **La lección, que es la que trasciende el caso:** «la composición se decide
 * ARRIBA» (§6) no significa *arriba de la pantalla*, significa **arriba de
 * TODAS las pantallas**. Una constante local es una composición con alcance de
 * archivo, y el defecto reaparece una superficie más allá — de a una, que es
 * como el founder la viene encontrando.
 *
 * ── LA LETRA QUE CODIFICA ───────────────────────────────────────────────────
 * Un acuario es un SISTEMA, no un individuo: no tiene cuerpo que pese, ni
 * vacunas, ni carnet, ni papeles de individuo. Tiene composición («quiénes
 * viven acá»), agua e historia. *El pez se mira; el sistema se cuida.*
 */

/** El sujeto tal como lo estampa el motor (`mascotas.sujeto`). */
export type SujetoMascota = 'individuo' | 'acuario';

export interface Composicion {
  /** El dashboard de estado (peso · vacunas · última atención). */
  comoEstaHoy: boolean;
  /** Los hechos del cuerpo en la ficha. */
  hechos: boolean;
  /** Vacunas: la sección, la alerta de vencimiento Y el «cargá su carnet».
   *  **Las tres, y ése es el punto**: apagar la sección y dejar viva su alerta
   *  es media composición — el dueño ve una cuenta que no puede resolver ni
   *  encontrar (lo que pasó dos veces). */
  vacunas: boolean;
  /** Vitales (la serie de peso y sus índices). */
  vitales: boolean;
  /** Los papeles. Los cuatro de hoy son de un INDIVIDUO: carnet, historia
   *  clínica, receta y ficha de identidad. Los del acuario esperan su letra
   *  (arco D-685). */
  documentos: boolean;
  /** «Quiénes viven acá» — el censo del sistema. Lo ÚNICO que el acuario tiene
   *  y el individuo no. */
  habitantes: boolean;
}

const INDIVIDUO: Composicion = {
  comoEstaHoy: true,
  hechos: true,
  vacunas: true,
  vitales: true,
  documentos: true,
  habitantes: false,
};

const ACUARIO: Composicion = {
  comoEstaHoy: false,
  hechos: false,
  vacunas: false,
  vitales: false,
  documentos: false,
  habitantes: true,
};

/**
 * Qué monta una superficie para este sujeto.
 *
 * ⚠️ El default es INDIVIDUO y es deliberado: un sujeto que este bundle no
 * conozca todavía se comporta como lo que la app siempre supo hacer, en vez de
 * quedarse sin nada. Un sujeto nuevo llega con el OTA que lo conoce (misma
 * regla que la degradación del hito).
 */
export function composicionDe(sujeto: SujetoMascota | string | null | undefined): Composicion {
  return sujeto === 'acuario' ? ACUARIO : INDIVIDUO;
}
