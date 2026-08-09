/**
 * QUÉ MASCOTAS SE PUEDEN OFRECER — y la distinción que faltaba (S91-C).
 *
 * ── EL AGUJERO, MEDIDO ──────────────────────────────────────────────────
 * `mascotasElegibles(mascotas, especies)` trata `null` como **«todas las
 * especies»** — y está bien, porque hay categorías multi-especie de
 * nacimiento. El problema es que las pantallas ARRANCABAN en `null`:
 *
 *   const [especies, setEspecies] = useState<string[] | null>(null)
 *
 * ⇒ `null` significaba DOS COSAS a la vez: «esta categoría acepta todas» y
 * «todavía no llegó el catálogo». Mientras cargaba, el selector ofrecía
 * TODAS las mascotas — y por eso el founder vio un pájaro para pasear.
 *
 * **Y el modo de falla es peor que la carrera:** si la lectura del catálogo
 * FALLA, el estado se queda en `null` para siempre y el filtro queda
 * APAGADO EN SILENCIO. Nadie se entera nunca. Es L-192 en su forma exacta
 * —una verificación cuyo modo de falla es el silencio no es una
 * verificación— y por eso la cura no es «filtrar mejor»: es **partir el
 * null en dos**.
 *
 * La DB nunca estuvo en riesgo: el guard `mascota_no_elegible` rebota
 * igual. Lo que fallaba es la promesa de la PUERTA (Ley 23: la puerta no
 * ofrece lo que va a rechazar).
 *
 * ── LAS TRES FASES, Y POR QUÉ NINGUNA ES «OFRECER DE MÁS» ───────────────
 *  · `cargando` → todavía no se sabe. **No se ofrece nada**: mostrar de
 *    más y quitar después es peor que esperar.
 *  · `error`    → el catálogo no llegó. **Se dice** (Ley 13), jamás se
 *    degrada a «todas» — degradar acá es exactamente el bug que cura.
 *  · `listo`    → la lista, o `null` legítimo (multi-especie).
 */

import { useEffect, useState } from 'react';
import { mascotasElegibles, obtenerEspeciesElegibles, type EstadoVidaMascota } from '@epetplace/api';

export type FaseEspecies =
  | { fase: 'cargando' }
  | { fase: 'error' }
  /** `especies === null` = la categoría acepta TODAS, y es un dato, no una
   *  ausencia. Llega acá solo cuando el catálogo respondió. */
  | { fase: 'listo'; especies: string[] | null };

/** Lee las especies de una categoría con sus tres fases. La categoría es
 *  la del motor (`paseo` · `grooming` · `adiestramiento` · `veterinario`). */
export function useEspeciesElegibles(categoria: string): FaseEspecies {
  const [estado, setEstado] = useState<FaseEspecies>({ fase: 'cargando' });
  useEffect(() => {
    let vigente = true;
    setEstado({ fase: 'cargando' });
    void obtenerEspeciesElegibles(categoria).then((r) => {
      if (!vigente) return;
      // El fallo NO cae a «todas»: cae a `error`, que la pantalla dice.
      setEstado(r.ok ? { fase: 'listo', especies: r.data } : { fase: 'error' });
    });
    return () => {
      vigente = false;
    };
  }, [categoria]);
  return estado;
}

/**
 * Las mascotas OFRECIBLES según la fase. Devuelve lista vacía mientras no
 * se sabe — y la pantalla distingue ese vacío del vacío real mirando la
 * fase, jamás el largo: «no tenés mascotas elegibles» y «todavía no sé»
 * son dos frases distintas y una de las dos sería mentira.
 */
export function ofrecibles<
  M extends { especie: string; estado_vida: EstadoVidaMascota | null },
>(mascotas: M[], estado: FaseEspecies): M[] {
  if (estado.fase !== 'listo') return [];
  return mascotasElegibles(mascotas, estado.especies);
}
