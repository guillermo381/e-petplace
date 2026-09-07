/**
 * `estado_vida` DE UNA MASCOTA — el piso de memorial de la puerta (§1).
 *
 * Existe porque **el dato no viaja en los lectores de los objetos**:
 * `DetalleAtencion` y `EstadiaDeMiMascota` traen `mascota_id` y nada más, así
 * que sin esto cada pantalla tendría que pedir el perfil por su cuenta — y
 * alcanzaría con que una se olvide para dibujar la puerta sobre un memorial.
 * *La ley de la casa no puede depender de que tres pantallas se acuerden.*
 *
 * ⚠️ **CUESTA UN VIAJE Y SE DECLARA** (N16). Es uno, por montaje, y sólo en
 * las pantallas que no traían ya el perfil. **La cura de raíz es de A**:
 * `estado_vida` en el lector del objeto, pedido en
 * `docs/loop/S114-C-PEDIDO-A-A-EL-MOTOR-DEL-CASO.md`. El día que llegue, este
 * archivo se borra entero y las pantallas pasan a leerlo del detalle.
 *
 * `undefined` = todavía no se sabe ⇒ quien lo consuma **no dibuja la puerta**:
 * ante la duda, la app se calla. *Un default optimista acá es exactamente el
 * defecto que se vino a evitar.*
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { obtenerPerfilMascota } from '@epetplace/api';

export function useEstadoVida(mascotaId: string | null | undefined): string | null | undefined {
  const [estadoVida, setEstadoVida] = useState<string | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      if (typeof mascotaId !== 'string' || mascotaId.length === 0) return;
      let vigente = true;
      void (async () => {
        const r = await obtenerPerfilMascota(mascotaId);
        /* Si falla, queda `undefined` y la puerta no se dibuja. **Es la
           salida conservadora a propósito**: preferimos no ofrecer el reclamo
           que ofrecérselo a quien acaba de perder a su mascota. */
        if (!vigente || !r.ok) return;
        setEstadoVida(r.data.mascota.estado_vida);
      })();
      return () => {
        vigente = false;
      };
    }, [mascotaId]),
  );

  return estadoVida;
}
