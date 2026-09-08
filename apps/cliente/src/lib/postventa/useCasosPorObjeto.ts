/**
 * LOS CASOS DE LA FAMILIA, INDEXADOS POR OBJETO — para una LISTA.
 *
 * 🔴 **Existe por N16 y no por comodidad.** `useCasoDelObjeto` pregunta por UN
 * objeto y sirve en un detalle; en una lista de citas serían **N viajes, uno
 * por fila** — el peaje de ~150 ms por petición que S94 midió y nombró, esta
 * vez multiplicado por el largo del historial.
 *
 * Acá es **UNA sola lectura** (`obtenerMisCasos`) y un mapa. *La familia tiene
 * pocos casos y muchas citas: se pide por el lado chico.*
 *
 * `undefined` = todavía no se sabe ⇒ quien lo consuma trata cada objeto como
 * «sin caso», que es la lectura conservadora: la puerta ofrece abrir uno y el
 * motor rebota con `caso_ya_abierto` llevando al que existe (`L-424`). *El
 * costo de equivocarse por acá es un rebote hablado; por el otro sería
 * esconderle a una familia el caso que ya abrió.*
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { obtenerMisCasos, type ObjetoPostventa } from '@epetplace/api';

export type CasoDeObjeto = { casoId: string; vozEstado: string; etapa: string };

export function useCasosPorObjeto(
  tipo: ObjetoPostventa,
): Map<string, CasoDeObjeto> | undefined {
  const [mapa, setMapa] = useState<Map<string, CasoDeObjeto> | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerMisCasos();
        /* Un fallo deja `undefined`: la lista se dibuja igual y cada fila
           ofrece abrir. **Ley 13 en su forma de lista** — el error de un dato
           accesorio no se lleva puesta la pantalla entera. */
        if (!vigente || !r.ok) return;
        const m = new Map<string, CasoDeObjeto>();
        for (const c of r.data) {
          if (c.objetoTipo !== tipo) continue;
          /* Si hubiera más de uno sobre el mismo objeto gana el PRIMERO, que
             viene primero por el orden del motor (abiertos arriba): llevar al
             abierto es más útil que llevar a uno cerrado. */
          if (!m.has(c.objetoId)) m.set(c.objetoId, { casoId: c.casoId, vozEstado: c.etapa, etapa: c.etapa });
        }
        setMapa(m);
      })();
      return () => {
        vigente = false;
      };
    }, [tipo]),
  );

  return mapa;
}
