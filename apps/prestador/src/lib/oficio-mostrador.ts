/**
 * ⭐ S86-C · LA REGLA DEL OFICIO EN EL MOSTRADOR (firma del founder).
 *
 * ═══ POR QUÉ ES UNA TABLA Y NO UN `if` ═══════════════════════════════
 * La orden fue explícita y su porqué es el que importa: *«construilo como
 * REGLA DEL OFICIO, no como if de pantalla — el día que entre grooming o
 * adiestramiento, la respuesta tiene que salir del oficio y no de un
 * condicional que alguien recuerde ampliar»*.
 * Con la tabla, sumar un oficio es **llenar una fila**, y el typecheck
 * OBLIGA a llenarla: `Record<OficioMostrador, ReglaOficio>` no compila
 * incompleto. Con un `if`, el oficio nuevo cae en el `else` — que es
 * exactamente la clase de defecto que esta sesión viene persiguiendo:
 * funciona, no rompe nada, y contesta mal.
 *
 * ═══ CUÁNDO SE COBRA — LA LETRA ══════════════════════════════════════
 * **Se cobra cuando la persona está ENFRENTE.**
 *  · En VETERINARIA está enfrente AL FINAL: deja a la mascota, espera, y
 *    se va cuando terminó.
 *  · En PASEO —y en todo oficio donde el servicio se presta y la persona
 *    se va— está enfrente AL PRINCIPIO.
 * Cobrar al final a quien ya se fue le exige volver; no cobrarle mientras
 * está ahí deja plata sin recoger con la persona enfrente.
 */

/** Los oficios que el mostrador puede atender. */
export type OficioMostrador = 'veterinaria' | 'paseo' | 'grooming' | 'adiestramiento';

export interface ReglaOficio {
  /** El momento en que la persona está enfrente (ver cabecera). */
  cobra: 'al-iniciar' | 'al-terminar';
  /**
   * ¿Este oficio tiene registrables CLÍNICOS (nota, vacunas, firma)?
   * Firmado: **lo clínico es de veterinaria y NO viaja**. Un walk-in de
   * paseo registra el servicio y quién lo atendió; nada más.
   */
  clinico: boolean;
}

export const REGLA_OFICIO: Record<OficioMostrador, ReglaOficio> = {
  veterinaria: { cobra: 'al-terminar', clinico: true },
  paseo: { cobra: 'al-iniciar', clinico: false },
  /* grooming y adiestramiento entran con su respuesta YA dada, no con un
     hueco: en los dos la persona deja a la mascota y se va — el mismo
     caso que el paseo, y por eso comparten momento de cobro.
     ⚠️ Si alguno resulta ser distinto en campo, se corrige ACÁ y cambia
     en todas las superficies a la vez. */
  grooming: { cobra: 'al-iniciar', clinico: false },
  adiestramiento: { cobra: 'al-iniciar', clinico: false },
};
