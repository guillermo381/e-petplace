/**
 * LA PLACA — la máscara la manda el TIPO (N12.1 · receta L2 §4.4).
 *
 * POR QUÉ ES UN ARCHIVO Y NO TRES LÍNEAS EN LA PANTALLA: es la única
 * regla de esta ficha que se puede probar sin montar nada, y **el motor
 * NO la valida** — `registrar_vehiculo_repartidor` toma la placa como
 * texto. O sea que esta función ES la validación, no una comodidad de
 * la superficie. Vivir aparte la vuelve verificable.
 *
 * ── LAS DOS FORMAS (Ecuador) ──────────────────────────────────────────
 *   MOTO  → 2 letras + 3 números + 1 letra   (AB 123 C)
 *   CARRO → 3 letras + 3 ó 4 números          (ABC 1234)
 *
 * ⚠️ **LO QUE ESTA FUNCIÓN NO HACE, declarado para que nadie lo suponga:**
 * no verifica que la provincia de la primera letra exista, ni que la placa
 * esté vigente, ni que no sea de otro país. **Valida FORMA, no
 * existencia.** Una placa con forma correcta e inexistente pasa — y está
 * bien que pase: el vendedor tiene la moto delante y nosotros no.
 *
 * ── LA VOZ DEL ERROR DICE QUÉ Y CÓMO, CON EJEMPLO (N12.4) ─────────────
 * Este archivo NO trae la voz: devuelve un CÓDIGO y la pantalla lo lleva
 * a su diccionario. *La forma es compartida; la voz es de la casa.* Es el
 * mismo corte que `escalera-pedido.ts` (Ley 19.9).
 */

export type TipoVehiculo = 'moto' | 'carro';

/** `null` = la placa cumple. El código lo lleva la pantalla a su voz. */
export type FalloPlaca = 'vacia' | 'formato_moto' | 'formato_carro';

/** MOTO: 2 letras + 3 dígitos + 1 letra. */
const FORMA_MOTO = /^[A-Z]{2}\d{3}[A-Z]$/;
/** CARRO: 3 letras + 3 ó 4 dígitos. */
const FORMA_CARRO = /^[A-Z]{3}\d{3,4}$/;

/**
 * Normaliza lo TIPEADO a lo que se guarda: mayúsculas, sin espacios ni
 * guiones. La gente escribe «ab-123c» y «AB 123 C» para la misma placa;
 * guardar las dos formas haría que la misma moto no se encuentre.
 *
 * Se aplica AL VALIDAR y AL GUARDAR — nunca mientras se tipea: reescribir
 * el campo bajo los dedos mueve el cursor y hace perder la letra que se
 * está escribiendo.
 */
export function normalizarPlaca(bruta: string): string {
  return bruta.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Valida FORMA contra el tipo. Ver la advertencia de la cabecera. */
export function validarPlaca(bruta: string, tipo: TipoVehiculo): FalloPlaca | null {
  const placa = normalizarPlaca(bruta);
  if (placa.length === 0) return 'vacia';
  if (tipo === 'moto') return FORMA_MOTO.test(placa) ? null : 'formato_moto';
  return FORMA_CARRO.test(placa) ? null : 'formato_carro';
}

/**
 * El teclado del DOCUMENTO se deriva de su tipo (N12.2).
 *
 * El defecto que esto cura está medido en la receta §1: hoy el campo es
 * `number-pad` FIJO, y **un pasaporte lleva letras** ⇒ hoy no se puede
 * tipear un pasaporte. No es una preferencia de comodidad: es un dato que
 * la pantalla vuelve imposible de ingresar.
 */
export function tecladoDeDocumento(
  tipo: 'CEDULA' | 'RUC' | 'PASAPORTE' | null,
): 'number-pad' | 'default' {
  // Ante la duda (sin tipo elegido) gana `default`: acepta TODO. Un
  // teclado numérico por defecto bloquearía al pasaporte antes de que la
  // persona elija su tipo — la puerta cerrándose antes de preguntar.
  return tipo === 'PASAPORTE' || tipo === null ? 'default' : 'number-pad';
}
