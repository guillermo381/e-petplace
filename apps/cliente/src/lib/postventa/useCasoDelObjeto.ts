/**
 * ¿HAY UN CASO ABIERTO SOBRE ESTE OBJETO? (§1)
 *
 * ⏪ **Hasta que A entregó el motor, esta rama era inalcanzable** y lo declaré
 * como lo que era: *un verde por ausencia de sujeto — no podía haber casos
 * porque no existía con qué crearlos*. **Ahora puede haberlos**, así que la
 * puerta pregunta.
 *
 * Vive acá y no en cada pantalla porque son tres objetos y una sola pregunta.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { obtenerCasoDeObjeto, type EtapaCaso, type ObjetoPostventa } from '@epetplace/api';

export type CasoAbierto = { casoId: string; etapa: EtapaCaso; vozEstado: string } | null;

export function useCasoDelObjeto(
  objeto: ObjetoPostventa,
  objetoId: string | null,
): CasoAbierto | undefined {
  /* `undefined` = todavía no se sabe · `null` = se preguntó y no hay. **Son
     dos cosas distintas**: con `undefined` la puerta no dibuja el estado de
     «caso abierto» todavía; con `null` sabe que no lo hay. */
  const [caso, setCaso] = useState<CasoAbierto | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      if (objetoId === null || objetoId.length === 0) return;
      let vigente = true;
      void (async () => {
        const r = await obtenerCasoDeObjeto(objeto, objetoId);
        /* Si falla, queda `undefined` y la puerta sigue mostrando su estado
           normal. **Es la salida correcta**: no saber si hay caso no es razón
           para esconder la puerta — es razón para no afirmar que lo hay. */
        if (!vigente || !r.ok) return;
        setCaso(r.data);
      })();
      return () => {
        vigente = false;
      };
    }, [objeto, objetoId]),
  );

  return caso;
}
