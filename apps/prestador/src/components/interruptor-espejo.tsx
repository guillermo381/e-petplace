/**
 * EL INTERRUPTOR DEL ESPEJO — `Administrar ⇄ Ver como cliente`
 * (receta B §2 · N17).
 *
 * ── 🔴 ES UN INTERRUPTOR DE MODO, NO UNA NAVEGACIÓN ──────────────────────
 * La razón no es de inventario y la receta la deja escrita: **si «Ver como
 * cliente» navega, el vendedor SALE de su trabajo y tiene que volver.** Un
 * interruptor conserva el lugar, el scroll y el producto que estaba
 * mirando — *y sin eso el espejo no se usa: se visita una vez.*
 *
 * Por eso es una PIEZA y no un `router.push`: la misma la monta el techo de
 * la vitrina y la monta la ficha. **Dos superficies, un solo control** — si
 * cada una armara el suyo, el día que cambie la voz cambiaría en una sola y
 * el vendedor leería dos nombres para el mismo modo.
 *
 * ── DÓNDE VIVE ──────────────────────────────────────────────────────────
 * **En el techo, FIJO** — no scrollea con el contenido. *Un interruptor que
 * se va con el scroll deja al vendedor sin saber en qué modo está justo
 * cuando más abajo llegó.* Esta pieza no se posiciona sola: la monta quien
 * tiene el techo, y ahí es donde se cumple lo de «fijo».
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * · **⛔ No dibuja marco de teléfono.** Es la vitrina de verdad, a tamaño
 *   real. *Un mockup dentro de la app dice «esto es una simulación», y N17
 *   pide lo contrario: que el vendedor no pueda NO saber cómo se ve.*
 * · **⛔ No cambia datos, solo lo que se muestra.**
 * · **⛔ No anima el viaje.** El cambio de modo NO es un desplazamiento
 *   direccional: *no fuiste a ningún lado — la misma cosa se mira de otra
 *   manera*. El fundido lo hace el CONTENIDO (quien lo monta), no el
 *   control.
 *
 * `proposito='vista'` a propósito: son dos vistas exclusivas de lo mismo, y
 * su semántica de accesibilidad (tablist/tab) es la verdadera. No es una
 * elección de producto.
 */

import { SelectorSegmentado } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** Los dos modos del espejo. Un tipo, para que nadie pase un string suelto. */
export type ModoEspejo = 'administrar' | 'cliente';

/** El modo se lee de la URL con esta puerta: **cualquier cosa que no sea
 *  `cliente` es `administrar`**. Un parámetro roto no puede dejar al
 *  vendedor en el modo donde NO están sus controles. */
export function modoDesdeParam(valor: string | string[] | undefined): ModoEspejo {
  return valor === 'cliente' ? 'cliente' : 'administrar';
}

export interface InterruptorEspejoProps {
  modo: ModoEspejo;
  onCambio: (modo: ModoEspejo) => void;
}

export function InterruptorEspejo({ modo, onCambio }: InterruptorEspejoProps) {
  const { t } = useTraduccion();
  return (
    <SelectorSegmentado
      segmentos={[
        { codigo: 'administrar', etiqueta: t('espejo.administrar') },
        { codigo: 'cliente', etiqueta: t('espejo.verComoCliente') },
      ]}
      activo={modo}
      onCambio={(c) => onCambio(c === 'cliente' ? 'cliente' : 'administrar')}
      etiqueta={t('espejo.etiquetaGrupo')}
      proposito="vista"
    />
  );
}
