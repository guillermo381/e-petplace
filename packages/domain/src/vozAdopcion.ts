// La redacción de la vidriera de adopción — S112-A2.
//
// 🔴 POR QUÉ VIVE ACÁ Y NO EN LA RPC, y el pedido decía «razón redactada»:
// una frase en español adentro de una función de Postgres **es una pantalla en
// un solo idioma**. La casa ya lo cobró (`D-539`: `packages/api` no tenía capa
// de idioma y el voseo era el síntoma).
//
// El motor devuelve NÚMEROS (`espera_dias`, `fecha_nacimiento`); acá se decide
// QUÉ SE DICE, y el riel (`packages/i18n`) decide CÓMO se dice en cada idioma.
// La razón llega redactada a la pantalla — redactada **por el riel**, que es
// donde se puede traducir.
//
// Estas funciones NO devuelven texto: devuelven `{ clave, params }` para que la
// pantalla los pase por `t()`. *Devolver texto sería mover el problema un
// paquete más arriba, no resolverlo.*

/** Lo que la pantalla le pasa a `t(clave, params)`. */
export interface VozRedactada {
  clave: string;
  params: Record<string, number>;
}

/**
 * «Lleva 7 meses esperando» — la razón de un destacado.
 *
 * Se corta en la unidad más grande que sea verdad, y **no se redondea hacia
 * arriba**: un animal que lleva 29 días no «lleva un mes». *Inflar la espera
 * para que suene más urgente es exactamente lo que un refugio no necesita que
 * hagamos por él.*
 */
export function describirEspera(dias: number): VozRedactada {
  const d = Math.max(0, Math.floor(dias));
  if (d < 7) return { clave: 'espera.dias', params: { dias: d } };
  if (d < 60) return { clave: 'espera.semanas', params: { semanas: Math.floor(d / 7) } };
  if (d < 365) return { clave: 'espera.meses', params: { meses: Math.floor(d / 30) } };
  return { clave: 'espera.anios', params: { anios: Math.floor(d / 365) } };
}

/**
 * «2 años» · «7 meses» · «edad estimada» — la edad de la ficha.
 *
 * 🔴 `precision` manda sobre el número. Si la fecha es una estimación, la voz
 * lo dice: **la app no le miente a nadie sobre lo que sabe de un animal
 * rescatado**, y §4.1 lo pide con todas las letras («edad estimada dicha aunque
 * sea estimada»).
 *
 * Sin fecha devuelve `edad.desconocida`. **No se infiere**: un rescate sin
 * fecha de nacimiento es lo normal, no un dato faltante que haya que rellenar.
 */
export function describirEdad(
  fechaNacimientoIso: string | null,
  precision: string | null,
  hoy: Date = new Date(),
): VozRedactada {
  if (fechaNacimientoIso === null || fechaNacimientoIso === '') {
    return { clave: 'edad.desconocida', params: {} };
  }
  const nacida = new Date(`${fechaNacimientoIso}T00:00:00Z`);
  if (Number.isNaN(nacida.getTime())) return { clave: 'edad.desconocida', params: {} };

  const meses =
    (hoy.getUTCFullYear() - nacida.getUTCFullYear()) * 12 +
    (hoy.getUTCMonth() - nacida.getUTCMonth()) -
    (hoy.getUTCDate() < nacida.getUTCDate() ? 1 : 0);
  if (meses < 0) return { clave: 'edad.desconocida', params: {} };

  /* `exacta` es la única que autoriza a decir la edad sin adjetivo. Todo lo
     demás —`mes`, `anio`, `estimada`— es una aproximación y se dice. */
  const exacta = precision === 'exacta' || precision === 'dia';

  if (meses < 12) {
    return {
      clave: exacta ? 'edad.meses' : 'edad.mesesEstimada',
      params: { meses },
    };
  }
  return {
    clave: exacta ? 'edad.anios' : 'edad.aniosEstimada',
    params: { anios: Math.floor(meses / 12) },
  };
}
