/** S91-D · La puerta del onboarding: `/onboarding` entra por el paso 1.
 *  Existe para que los tres llamadores del arranque (`app/index.tsx`,
 *  `registro.tsx` y `verificar-correo.tsx`) no tengan que conocer el nombre
 *  del primer paso.
 *
 *  ── S112-C · LA BIFURCACIÓN, CONSTRUIDA Y CON SU PUERTA CERRADA ─────────
 *  El founder pidió que acá se vea **una sola pregunta** con dos tarjetas
 *  (`BifurcacionDeEntrada`, con su porqué en la cabecera de la pieza). **La
 *  segunda respuesta exige crear la cuenta SIN mascota**, y ese productor
 *  todavía no existe — pedido a A como `crear_familia_sin_mascota`.
 *
 *  ⇒ Mientras la puerta esté cerrada, esta ruta hace **exactamente lo de
 *  siempre**: entra al alta. *Preguntar «¿tenés una mascota o querés adoptar?»
 *  y que la segunda opción no lleve a ningún lado es peor que no preguntar.*
 *
 *  ⚠️ **Y el gate es el MISMO de la vertical** (`ADOPCION_ALCANZABLE`), no uno
 *  propio: *dos interruptores para la misma puerta terminan en distinto
 *  estado, y el día que alguien encienda uno solo, la mitad de la vertical
 *  aparece sin la otra.*
 */
import { router, useLocalSearchParams } from 'expo-router';

import { AltaMascota } from '@/components/alta/AltaMascota';
import { BifurcacionDeEntrada } from '@/components/alta/BifurcacionDeEntrada';
import { ADOPCION_ALCANZABLE } from '@/lib/gate-adopcion';
import { destinoDeVuelta } from '@/lib/volver-a';
import { useTraduccion } from '@/i18n';

export default function OnboardingInicio() {
  const { t } = useTraduccion();
  /* 🔴 **A dónde vuelve quien vino de la vidriera.** No es «al home»: §4.1 dice
     *«vuelvo exactamente a donde estaba (la ficha de Luna, o la lista)»*. El
     destino cruzó registro y confirmación como dato porque los dos `replace`
     del camino borran la pila.
     ⚠️ **Se lee SIEMPRE, antes del gate**, aunque hoy la rama esté cerrada:
     leerlo dentro de la rama lo ataría al gate, y el día que el gate abra
     alguien tendría que acordarse de moverlo. */
  const volverA = destinoDeVuelta(useLocalSearchParams().volverA);

  if (!ADOPCION_ALCANZABLE) return <AltaMascota modo="primera" pasoFijo="especie" />;

  return (
    <BifurcacionDeEntrada
      titulo={t('bifurcacion.titulo')}
      tengoMascota={t('bifurcacion.tengoMascota')}
      tengoMascotaDetalle={t('bifurcacion.tengoMascotaDetalle')}
      tengoMascotaAccion={t('bifurcacion.tengoMascotaAccion')}
      quieroAdoptar={t('bifurcacion.quieroAdoptar')}
      quieroAdoptarDetalle={t('bifurcacion.quieroAdoptarDetalle')}
      quieroAdoptarAccion={t('bifurcacion.quieroAdoptarAccion')}
      onTengoMascota={() => router.push('/onboarding/especie')}
      /* «Si toco adoptar, no me pidas nada más: me llevás directo a ver los
         animales» — la cuenta sin mascota la crea el motor de A antes de
         navegar; hoy esta rama no se alcanza (ver la cabecera). */
      /* `replace` y no `push`: la pregunta del alta **no es un lugar al que se
         vuelve**. Y si vino con destino, vuelve ahí — a la lista si entró por
         la lista, a la ficha cuando la ficha exista. */
      onQuieroAdoptar={() => router.replace(volverA ?? '/adoptar')}
    />
  );
}
