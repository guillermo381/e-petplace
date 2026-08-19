/**
 * LA ESCALERA DEL PEDIDO — de la narrativa a los pasos (S96-D · D-B4 ·
 * `LETRA_RECORRIDO_DESPENSA_S96` §8.1).
 *
 * UNA función para los dos consumidores (la lista y el detalle): la
 * narrativa del catálogo (`v_pedidos_narrativa`, SIETE y solo siete) se
 * convierte en los `PasoEscalera` que `EscaleraEstados`/`TarjetaPedido`
 * de B dibujan. Las VOCES las pone la pantalla (Ley 3: el riel, jamás
 * esta lib) — acá solo se decide qué paso está hecho, cuál es el actual
 * y cuándo el camino se DESVIÓ.
 *
 * · La escalera feliz: confirmado → preparando → en camino → entregado.
 *   (Preparando tapa tres escalones internos del vendedor a propósito:
 *   picking/empacado/documentado son SU operación, no una noticia para
 *   la familia.)
 * · `no_llego` = DESVÍO con tono alerta (§9.3: el pedido vuelve y se
 *   reagenda) — los pasos hasta "en camino" quedan hechos.
 * · `cancelado` = SIN escalera (regla de existencia de TarjetaPedido:
 *   vacío es vacío) + desvío neutro: terminó sin drama, apagado no dice
 *   error.
 *
 * ── 🔴 S100-D · SON CUATRO NODOS, NO CINCO — `pagando` SALE ─────────────
 * Receta de B firmada (`2026-08-18-s99b-RECETA-SEGUIMIENTO-DE-NODOS` §1):
 * **una narrativa NO es automáticamente un escalón.** Tres de las siete no
 * son pasos de un camino — `no_llego` y `cancelado` son DESVÍO (banda que
 * sustituye), y `pagando` **es ANTES de que exista una promesa**.
 *
 * *Dibujar la escalera en `pagando` prometería un recorrido que todavía no
 * arrancó* — y esta lib lo hacía: `pagando` era su primer escalón, así que
 * un pedido cuyo pago aún no confirma mostraba cuatro peldaños por delante
 * como si el vendedor ya lo hubiera tomado. **Se cae el escalón, no se
 * renombra.**
 *
 * ⚠️ **Sin escalera, la fila queda muda sobre su estado** — y por eso la
 * pantalla cae a `narrativa_nombre` (voz del CATÁLOGO, dato y no `switch`)
 * cuando esta función no devuelve pasos. La regla Chanel de la lista
 * («no dice narrativa como texto suelto: la escalera la DIBUJA») supone
 * que la escalera dibuja; donde no dibuja, el texto no duplica nada — es
 * el único portador. Declarado acá para que no se lea como desvío de esa
 * regla.
 */

import type { DesvioEscalera, IconoNombre, PasoEscalera } from '@epetplace/ui';
import type { NarrativaPedido } from '@epetplace/api';

/** Las voces YA resueltas por el riel de la pantalla.
 *  `pagando` NO está: dejó de ser escalón (ver cabecera) y su voz la pone
 *  el catálogo (`narrativa_nombre`), no este mapa. */
export interface VocesEscalera {
  confirmado: string;
  preparando: string;
  enCamino: string;
  entregado: string;
  noLlego: string;
  noLlegoDetalle: string;
  cancelado: string;
}

const ESCALERA: { clave: NarrativaPedido; voz: keyof VocesEscalera }[] = [
  { clave: 'confirmado', voz: 'confirmado' },
  { clave: 'preparando', voz: 'preparando' },
  { clave: 'en_camino', voz: 'enCamino' },
  { clave: 'entregado', voz: 'entregado' },
];

/**
 * EL GLIFO DE CADA NODO — el slot `icono` de B, lleno.
 *
 * 🔴 **Se mapea por lo que DIBUJA, no por su nombre**, que es la regla que
 * el vendedor ya aplicó en su ventana: los cuatro glifos de B son **bolsa ·
 * caja · flecha · visto**, separados por EJE y no por contenido, porque
 * *a 12 px no sobrevive el detalle interior, sobrevive la ORIENTACIÓN*.
 * Acá los nombres de B y las narrativas de la familia coinciden uno a uno
 * —fueron dibujados para esta escalera— y aun así el mapa se escribe
 * explícito: **la coincidencia de nombres es un accidente cómodo, no un
 * contrato.**
 *
 * El slot es OPCIONAL por diseño de B y la escalera funciona entera sin él;
 * el ícono es lo que hace que cada etapa diga QUÉ ES **sin texto**, que es
 * la pregunta del ojo de la receta (§6.3).
 */
/* 🔴 S100d · PUNTO 23 DEL GATE — EL ÚLTIMO NODO PASA A SER LA UBICACIÓN.
 *
 * Firma del founder: *«Ya está el código y el pedido. Falta en la ESCALERA y
 * en SEGUIR EL PEDIDO el glifo de ubicación»*.
 *
 * **Y la referencia lo tiene medido, no interpretado.** En
 * `docs/diseno/referencias/referencia-rappi-seguimiento-escalera-y-rango.jpeg`
 * la escalera horizontal tiene CUATRO nodos y **el último es una casa**: los
 * tres primeros dicen QUÉ PASA CON EL PEDIDO (se tomó · se arma · va en
 * camino) y el cuarto dice **A DÓNDE LLEGA**. *El cuarto nodo no es otro
 * verbo: es el destino, y por eso es el único que cambia de familia.*
 *
 * ⏪ Acá decía `nodoEntregado` — *«el visto, el único que COMPLETA algo»*—, y
 * ese argumento **se cae al mirar cómo pinta la pieza**: la escalera ya dice
 * lo completado con el RELLENO del nodo (hecho · actual · pendiente). ⇒ el
 * visto estaba diciendo por dibujo lo que el color ya decía, y el glifo se
 * quedaba sin trabajo. *Un glifo que repite lo que el estado ya comunica es
 * un lugar desperdiciado, y acá el lugar tenía algo mejor que decir.*
 *
 * ⚠️ **QUÉ NO SE TOCA, y es a propósito:**
 *  · **el vendedor conserva su visto** (`apps/prestador/.../ventana-pedidos`
 *    mapea `entregado`/`retirado` a `nodoEntregado`). *Para la familia el
 *    último paso es SU casa; para el vendedor es una entrega que se completó
 *    — el mismo hecho visto desde dos lados, y el glifo dice el lado.*
 *  · **el sello de la celebración sigue siendo el visto**, y ahora deja de
 *    repetir a la escalera: el sello marca el ACTO que se cierra, el nodo
 *    marca el LUGAR. Su comentario quedó viejo con este cambio y se corrigió
 *    en su archivo, en vez de dejar una prosa que afirma lo contrario.
 *
 * 🔴 **LA DEPENDENCIA, DECLARADA:** `ubicacion` hoy lleva una **Huella
 * adentro** (`Icono.tsx:891`) y acá se dibuja a **12 px**. B ya firmó
 * quitársela por Ley 9 (punto 17: *«sin huella dentro»*). **Hasta que ese
 * commit llegue, este nodo se ve recargado** — se declara para que quien lo
 * mire antes no lo lea como un desvío nuevo. */
export const GLIFO_NODO: Record<string, IconoNombre> = {
  confirmado: 'nodoConfirmado', // la bolsa — el pedido tomado
  preparando: 'nodoPreparando', // la caja abierta — se está armando
  en_camino: 'nodoEnCamino', // la flecha — el movimiento
  entregado: 'ubicacion', // la gota — TU casa, que es donde termina el camino
};

/**
 * ¿LA ESCALERA NO DIBUJA NADA? Entonces el estado necesita OTRO portador.
 *
 * 🔴 **S100b-D · POR QUÉ ESTO ES UNA FUNCIÓN Y NO UN `if` EN CADA PANTALLA.**
 * El gate del founder devolvió *«cuatro de seis pedidos no dicen en qué estado
 * están»* (B, con aparato). **Medido contra la base, la causa no era la pieza:**
 * `pagando` sale sin pasos y sin desvío —decisión de S100, y sigue siendo la
 * correcta— pero la red de seguridad que yo escribí para ese caso
 * (*caer a `narrativa_nombre`*) **era INALCANZABLE POR CONSTRUCCIÓN**: iba
 * detrás del brazo de la promesa, y la promesa **nace con el pedido, antes del
 * pago**. Censo: **4 de 4 pedidos `pagando` tienen promesa y ninguno tiene pago
 * confirmado.** ⇒ la rama nunca corría, y el pedido no solo quedaba mudo:
 * **prometía una entrega sin tener el pago.**
 *
 * *Un comentario que describe una rama que el DATO vuelve inalcanzable es peor
 * que no tener la rama: dice que el caso está cubierto.*
 *
 * El predicado es **el mismo que `EscaleraEstados` usa adentro** para su regla
 * de existencia (`pasos.length === 0 && desvio === undefined`). Se escribe acá
 * UNA vez y lo consumen las dos superficies —la lista y el detalle—, porque la
 * lección que esta pista ya pagó tres veces en un día es que **el mismo
 * criterio en dos lugares diverge**, y la tercera vez fue adentro de mi propia
 * función.
 */
export function escaleraMuda(e: { pasos: unknown[]; desvio?: unknown }): boolean {
  return e.pasos.length === 0 && e.desvio === undefined;
}

/**
 * QUÉ DICE LA LÍNEA DE APOYO DE LA FILA — la DECISIÓN, sin una sola voz.
 *
 * Vive acá y no adentro de la pantalla **para que el guard pueda medir la
 * función real en vez de una réplica de ella**. *Un instrumento que
 * re-declara la regla que vigila mide su propio eco* — y el defecto que esta
 * función cura fue exactamente un orden de ramas, que es lo que ninguna
 * prueba de tipos ve.
 *
 * El ORDEN es la regla, y cada brazo tiene su razón:
 *  ① `nada` con desvío — la banda ya dice qué pasó; repetirlo sería decir dos
 *     veces lo mismo (Chanel). Y manda incluso sobre el retiro: *un retiro
 *     cancelado tampoco se retira.*
 *  ② `estado` sin escalera — **esta línea es el ÚNICO portador**, así que gana
 *     sobre todo lo que la siga. Iba último y el dato lo volvía inalcanzable.
 *  ③ `retiro` — no hay ventana que prometer: la familia va a buscarlo.
 *  ④ `promesa` — la ventana, que es lo accionable (quedarse en casa o no).
 *  ⑤ `nada` — la escalera dibuja y habla sola.
 */
export type PortadorDeEstado = 'nada' | 'estado' | 'retiro' | 'promesa';

export function portadorDeEstado(p: {
  narrativa: NarrativaPedido;
  /** `null` = el pedido no declara método. **No es retiro**: un dato ausente
   *  no se lee como una elección (lo cazó `tsc` — la columna es nullable y
   *  yo la había tipado `string`). */
  metodoEntrega: string | null;
  tienePromesa: boolean;
}): PortadorDeEstado {
  // Se recalcula acá adentro a propósito: si el portador se decidiera con una
  // escalera que le pasan de afuera, dos llamadores podrían mandarle escaleras
  // distintas para el mismo pedido. La narrativa es la ÚNICA entrada.
  const escalera = escaleraDePedido(p.narrativa, VOCES_MUDAS);
  if (escalera.desvio !== undefined) return 'nada';
  if (escaleraMuda(escalera)) return 'estado';
  if (p.metodoEntrega === 'retiro') return 'retiro';
  if (p.tienePromesa) return 'promesa';
  return 'nada';
}

/** La forma de la escalera no depende de las voces — solo de la narrativa —,
 *  así que el portador la calcula con voces vacías. Se nombra en vez de pasar
 *  un objeto literal para que quede dicho que **el vacío es deliberado y no un
 *  descuido**: si alguna vez una voz cambiara la FORMA, esto rompería y hay
 *  que enterarse. */
const VOCES_MUDAS: VocesEscalera = {
  confirmado: '',
  preparando: '',
  enCamino: '',
  entregado: '',
  noLlego: '',
  noLlegoDetalle: '',
  cancelado: '',
};

export function escaleraDePedido(
  narrativa: NarrativaPedido,
  voces: VocesEscalera,
  /** Dato de máquina para el paso ACTUAL (la ventana prometida, la hora)
   *  — voz de la pantalla, mono en la pieza. */
  detalleActual?: string,
): { pasos: PasoEscalera[]; desvio?: DesvioEscalera } {
  if (narrativa === 'cancelado') {
    return { pasos: [], desvio: { etiqueta: voces.cancelado, tono: 'neutro' } };
  }

  /* 🔴 ENMIENDA FIRMADA (founder, 19-ago-2026) — LA RAZÓN, QUE ES MEJOR QUE
     LA REGLA. La formulación vieja decía *«`pagando` dejó de ser escalón»*, y
     eso se leía como una decisión de dibujo: algo que existe y elegimos no
     mostrar. **La nueva dice POR QUÉ:**

     ▎ **`pagando` NO ES UN ESTADO DEL PEDIDO: ES UNA INTENCIÓN.** El relato
     ▎ arranca cuando el pedido está **confirmado / pagado**; antes de eso
     ▎ **el recorrido todavía no empezó.**

     ⇒ la letra de S100 **se RATIFICA** y gana su fundamento: *no es un
     escalón que decidimos no dibujar — es que no hay nada que contar todavía.*
     **Y por eso el pedido nuevo del founder no la contradice:** «estamos
     preparando tu pedido» es un hito del recorrido, y el recorrido **nace con
     el pago**.

     ⚠️ **LO QUE EL FOUNDER ESTÁ VIENDO HOY ES UN ARTEFACTO, NO UN DEFECTO.**
     Medido el 19-ago: **6 pedidos clavados en `pagando`** — se quedan ahí
     porque **nunca llegan a pagado: no hay pasarela** (D-764). *La pantalla
     está haciendo exactamente lo correcto sobre un pedido que nunca se
     compró.*

     🔴 **Y ESTO ES UNA NOTA PARA LA SESIÓN DE PAGOS, no para ésta: el día que
     Nuvei entre, esta pantalla CAMBIA DE COMPORTAMIENTO sin que nadie toque
     una línea** — ningún pedido se queda en `pagando` y la escalera aparece
     desde el primer hito. **Conviene mirarla ese día**: es de las pocas
     superficies que se estrenan solas. */
  // `pagando` es ANTES de que haya recorrido: sin escalera y sin banda.
  // No es un desvío —no se torció nada— y por eso no usa la banda, que
  // significa "el camino se interrumpió". La fila lo dice con la voz del
  // catálogo (ver cabecera).
  if (narrativa === 'pagando') return { pasos: [] };

  if (narrativa === 'no_llego') {
    // El camino llegó hasta la puerta y volvió: lo caminado queda hecho.
    // Son los TRES primeros (confirmado · preparando · en camino) — con
    // `pagando` fuera, el `slice(0, 4)` de antes se habría comido también
    // `entregado` y habría dicho que el pedido llegó.
    const pasos: PasoEscalera[] = ESCALERA.slice(0, 3).map((p) => ({
      clave: p.clave,
      etiqueta: voces[p.voz],
      estado: 'hecho',
    }));
    return {
      pasos,
      desvio: { etiqueta: voces.noLlego, detalle: voces.noLlegoDetalle, tono: 'alerta' },
    };
  }

  const idx = ESCALERA.findIndex((p) => p.clave === narrativa);
  const pasos: PasoEscalera[] = ESCALERA.map((p, i) => ({
    clave: p.clave,
    etiqueta: voces[p.voz],
    // `entregado` es terminal: el último paso queda HECHO, no "actual
    // para siempre".
    estado:
      i < idx || (narrativa === 'entregado' && i === idx)
        ? 'hecho'
        : i === idx
          ? 'actual'
          : 'pendiente',
    detalle: i === idx && detalleActual !== undefined ? detalleActual : undefined,
  }));
  return { pasos };
}
