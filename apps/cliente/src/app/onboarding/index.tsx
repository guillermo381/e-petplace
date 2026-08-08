/** S91-D · La puerta del onboarding: `/onboarding` entra por el paso 1.
 *  Existe para que los dos llamadores del arranque (`app/index.tsx` y
 *  `registro.tsx`) no tengan que conocer el nombre del primer paso. */
import { AltaMascota } from '@/components/alta/AltaMascota';

export default function OnboardingInicio() {
  return <AltaMascota modo="primera" pasoFijo="especie" />;
}
