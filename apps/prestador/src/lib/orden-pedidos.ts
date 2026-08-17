/**
 * EL ORDEN DEL TRABAJO DEL LOCAL — extraído de `ventana-pedidos.tsx` (S99-D).
 *
 * 🔴 **POR QUÉ VIVE ACÁ Y NO EN LA PIEZA:** el orden es **lógica de dominio,
 * no de vista** — y sobre todo, **es lo que hay que poder probar sin abrir
 * una pantalla.** El defecto que lo trajo (empates sin desempate) se
 * demuestra con dos objetos y un comparador; exigir un login y un navegador
 * para verlo es poner un muro entre el defecto y su prueba. *La pieza que
 * decide de quién es el turno merece un test que no dependa de una clave.*
 *
 * La pantalla es su ÚNICO consumidor y no cambió de comportamiento: esto es
 * una mudanza, no un rediseño.
 */
import type { ExtraPanelPedido, PedidoDelVendedor } from '@epetplace/api';

import { derivarEscalera } from '@/lib/escalera-pedido';


/**
 * ☠️ S99-D · `prioridad()` MURIÓ COMO ORDEN — y su razón queda tachada, no
 * borrada, porque no era mala: ordenaba por **estado**, o sea por «qué me
 * falta hacer con éste». La firma del founder en el Gate 1 pide otra cosa —
 * **FIFO por hora de confirmación del pago** — y las dos son legítimas:
 * *«¿qué toco ahora?»* no es *«¿de quién es el turno?»*. Gana la segunda
 * porque es la que el cliente puede reclamar.
 *
 * ── LAS CUATRO BANDAS (ratificación de mesa a C, 17-ago) ───────────────
 *  ① **sin compromiso PRESIDE** — no entra a este comparador: la ventana lo
 *    resuelve un escalón afuera, en su propia sección (`huerfanos`).
 *  ② **«se rompió» SEGUNDA**, con su razón: *lo urgente está por fallar,
 *    esto YA falló, y hay alguien que perdió su tarde esperando.*
 *  ③ **urgente** — 🔴 **HOY NO TIENE PRODUCTOR Y SE DECLARA:** el exprés no
 *    existe en el esquema (censo L5b ⑥, fuera del camino crítico por firma).
 *    La banda **no se inventa con un proxy**: queda escrita, vacía, y el día
 *    que el dato exista entra por un solo lugar. *Una banda que nadie puede
 *    llenar no se dibuja — y «banda vacía no se monta» ya es la regla.*
 *  ④ **los días** — el FIFO.
 *
 * 🔴 **LA SEÑAL DE «SE ROMPIÓ» ES LA MISMA QUE PINTA EL DESVÍO**
 * (`derivarEscalera(...).desvio === 'noLlego'`), y eso es deliberado: si la
 * banda mirara un campo y la insignia otro, **podrían discrepar** y la
 * ventana diría con la posición algo distinto de lo que dice con la
 * etiqueta. *Una sola lectura para el lugar y para el nombre.*
 *
 * ⚠️ **LA PROMESA ES TECHO, JAMÁS CLAVE DE ORDEN.** Si ordenara, esta
 * ventana estaría dibujando **la RUTA** — y la ruta es la otra cola: *FIFO
 * ordena el trabajo del LOCAL, la ruta ordena la SALIDA; el corte es el
 * despacho.* Por eso `promesa_desde` desapareció del comparador.
 */
export type Banda = 0 | 1 | 2;

export function banda(desvio: 'noLlego' | 'cancelado' | null | undefined): Banda {
  if (desvio === 'noLlego') return 0;
  /* ③ urgente iría acá (return 1) el día que el exprés exista. */
  return 2;
}

/**
 * El comparador del trabajo del local.
 *
 * ⚠️ **`?? null` en las dos marcas por L-247:** el lector ya las tipa, pero
 * *toda garantía que solo vive en el productor es una convención* — y con un
 * bundle viejo un `undefined` acá no rompería: **ordenaría mal en silencio**,
 * que es peor.
 *
 * 🔴 **SIN `pago_confirmado_en` NO SE ORDENA POR PROXY.** El que no tiene
 * pago confirmado **no está en la cola** (firma del founder) ⇒ va al final de
 * su banda. *Caer a `created_at` habría dado un orden creíble y falso: el
 * vendedor lo lee como justicia y prepara en el orden equivocado.*
 */
export function ordenDeTrabajo(
  a: PedidoDelVendedor,
  b: PedidoDelVendedor,
  extras: Record<string, ExtraPanelPedido>,
): number {
  const esc = (p: PedidoDelVendedor) => {
    const e = extras[p.pedido_id];
    return e ? derivarEscalera(e.estado, e.metodo_entrega) : null;
  };
  const ba = banda(esc(a)?.desvio);
  const bb = banda(esc(b)?.desvio);
  if (ba !== bb) return ba - bb;

  /* EL REORDEN DEL VENDEDOR MANDA DENTRO DE SU BANDA — y no cruza bandas:
     ordena, jamás re-promete. Entre varios movidos, el más reciente arriba
     (marca DESC), que es lo que la migración de A definió. */
  const ma = a.movido_al_frente_en ?? null;
  const mb = b.movido_al_frente_en ?? null;
  if (ma !== null && mb !== null) {
    if (ma !== mb) return ma < mb ? 1 : -1;
  } else if (ma !== null) return -1;
  else if (mb !== null) return 1;

  /* EL FIFO. Sin pago confirmado, al final: no está en la cola. */
  const pa = a.pago_confirmado_en ?? null;
  const pb = b.pago_confirmado_en ?? null;
  if (pa !== null && pb !== null) {
    if (pa !== pb) return pa < pb ? -1 : 1;
  } else if (pa !== null) return -1;
  else if (pb !== null) return 1;

  /* ═══════════════════════════════════════════════════════════════════════
     🔴 EL DESEMPATE POR CLAVE ÚNICA — y NO es un detalle de implementación.
     ═══════════════════════════════════════════════════════════════════════
     **En esta casa las marcas de tiempo NUNCA son únicas por construcción:**
     `now()` es CONSTANTE dentro de una transacción (L-122a), así que todo
     acto que escribe varias filas de una las empata al microsegundo. No es
     un artefacto de la siembra — A midió **88 empates sobre 325** en
     `eventos_mascota`, reales de meses, y el timeline del Bio-Expediente
     perdía **7 de 62 eventos (11 %)** de dos mascotas reales por esta causa.
     Medido acá: **«Tienda Pura» tiene 3 pedidos pagados en UN SOLO
     INSTANTE** (`01:03:53.341314+00`), y otra cuenta 5 en dos instantes.

     Sin esta línea el orden que el vendedor lee como *«de quién es el
     turno»* era **AZAR** — exactamente lo que el FIFO existe para impedir.

     ⚠️ **Y las dos ramas de arriba estaban ADEMÁS mal formadas:** con
     `ma === mb` devolvían `-1` en las DOS direcciones, y con `pa === pb`,
     `1` en las dos. *Un comparador que afirma «a antes que b» **y** «b antes
     que a» no es lento ni impreciso: deja el resultado de `sort` a merced
     del orden en que llegaron las filas.* Por eso el empate ahora **cae**,
     en vez de responder cualquier cosa.

     **POR QUÉ `numero_orden` Y NO `pedido_id`:** los dos son únicos y
     deterministas, pero el número **está impreso en la tarjeta**. Si el
     vendedor pregunta *«¿por qué éste primero?»*, la respuesta es
     **verificable por él, en su pantalla**. Un uuid ordena igual de bien y
     **no lo puede auditar quien lo lee**.

     **Y LO QUE ESTE DESEMPATE NO PRETENDE:** su sufijo es hex aleatorio, así
     que **no inventa una justicia que el dato no tiene** — con el mismo
     instante registrado no existe un «quién llegó primero». Lo que garantiza
     es que **la respuesta no cambie entre dos lecturas**, que es todo lo que
     se puede prometer honestamente. *Caer a `created_at` habría sido peor:
     medido, también empata al microsegundo por la misma causa.*

     Efecto colateral bueno: con la clave única puesta, **el determinismo
     deja de depender de la comparación de timestamps** — cualquier sutileza
     de colación puede a lo sumo dar un orden estable-equivocado, jamás uno
     que baile entre dos aperturas. */
  if (a.numero_orden !== b.numero_orden) return a.numero_orden < b.numero_orden ? -1 : 1;
  return 0;
}
