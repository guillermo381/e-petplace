/** S91-D · `/hogar/agregar` entra por el PRIMER paso. Siete llamadores vivos
 *  apuntan a esta ruta (Hogar ×2 y los cuatro oficios de Explorar): la
 *  entrada NO cambió de nombre a propósito.
 *
 *  🔴 **S116-C lote 6 · el paso se DERIVA de `PASOS`, no se teclea.** Decía
 *  `pasoFijo="datos"`; al invertir el orden, `PASOS[0]` pasó a ser `foto` y
 *  **esta puerta siguió abriendo en el paso 2**, con su barra marcando 2 de 3.
 *  *Lo cazó caminar el alta, no el typecheck: `'datos'` sigue siendo un `Paso`
 *  válido.* */
import { AltaMascota } from '@/components/alta/AltaMascota';
import { PRIMER_PASO } from '@/components/alta/tipos';

export default function AgregarInicio() {
  return <AltaMascota modo="adicional" pasoFijo={PRIMER_PASO} />;
}
