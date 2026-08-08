/** S91-D · `/hogar/agregar` entra por el paso 1. Siete llamadores vivos
 *  apuntan a esta ruta (Hogar ×2 y los cuatro oficios de Explorar): la
 *  entrada NO cambió de nombre a propósito. */
import { AltaMascota } from '@/components/alta/AltaMascota';

export default function AgregarInicio() {
  return <AltaMascota modo="adicional" pasoFijo="especie" />;
}
