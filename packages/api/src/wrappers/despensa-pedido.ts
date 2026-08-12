// EL PEDIDO DE LA DESPENSA — cotización, compra y seguimiento
// (S95-E · Bloques 3, 4 y 5 · MODELO_DESPENSA v2.0 §5 y §8).
//
// 🔴 ESTE ARCHIVO NO CALCULA PLATA. Ni un subtotal, ni un impuesto, ni un
// flete. El motor calcula y este archivo transporta. *Un total calculado en
// dos lugares es un total que algún día va a discrepar, y el día que discrepa
// es en una factura.*
//
// DÓNDE SALEN LOS TOTALES DEL CARRITO, y es una decisión de diseño que
// conviene entender: **de `crear_pedido_despensa`**. Un pedido en estado
// `creado` no está pagado, no reserva stock y se puede cancelar — o sea, ES
// el carrito. Pedirle los totales al motor en vez de estimarlos acá tiene un
// efecto que S95 ya celebró al salir de VTEX: **el precio que se muestra ES el
// precio**, no una simulación que después diverge en el checkout.

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';
import {
  falloDespensa,
  falloDespensaCodigo,
  esObjDespensa,
  esNarrativa,
  type CodigoErrorDespensa,
  type NarrativaPedido,
} from './_despensa-comun';

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 3 · COTIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════

export interface CotizacionEnvio {
  costo: number;
  moneda: string;
  regla_id: string;
  /** 'plana' | 'gratis_sobre_umbral' — los otros cinco tipos están MODELADOS
   *  y APAGADOS en el catálogo; si alguno se enciende sin motor, el server
   *  devuelve `tipo_regla_sin_motor` y acá sale tipado. */
  tipo_regla: string;
  peso_fisico_kg: number;
  peso_volumetrico_kg: number;
  /** El MAYOR de los dos: una bolsa de 15 kg se cobra por peso; una cama de
   *  2 kg que ocupa una caja enorme se cobra por volumen. Lo decide el motor. */
  peso_facturable_kg: number;
  parametros_aplicados: unknown;
  /** false = la regla del vendedor no declara ciudades, así que esta
   *  cotización **no verificó cobertura**. Se dice, en vez de dejar creer
   *  que sí. */
  cobertura_declarada: boolean;
}

export interface InputCotizarEnvio {
  cuenta_comercial_id: string;
  /** 🔴 LO TRAE QUIEN LLAMA, y sale del motor — de `crearPedidoDespensa` o
   *  de un pedido ya creado. Este wrapper no lo suma. */
  subtotal: number;
  peso_fisico_kg?: number;
  peso_volumetrico_kg?: number;
  country_code?: string;
  /** 🔴 EL DESTINO. Sin esto, un vendedor que declara cobertura **no se puede
   *  cotizar**: el motor devuelve `destino_no_declarado` y la app no puede
   *  mostrar el envío. Este wrapper se escribió en S95-E, ANTES de que S95-G2
   *  le agregara la ciudad al motor, y la desincronización la destapó el E2E
   *  con catálogo real (S95-G4) — no una lectura del código. */
  ciudad_destino?: string;
}

/**
 * 🔴 EL ERROR `sin_regla_envio` SALE TIPADO Y EXPLÍCITO, JAMÁS COMO CRASH.
 *
 * El motor **rechaza cotizar** cuando el vendedor no cargó su regla, en vez de
 * inventar un costo — y esa decisión tiene que llegar legible hasta arriba.
 * Ojo con la forma: `cotizar_envio_despensa` **no lanza**, devuelve
 * `{ok:false, error}` dentro del jsonb. Un wrapper que solo mirara
 * `error !== null` de PostgREST daría esto por bueno y devolvería un costo
 * `undefined` que la pantalla pintaría como `$0`: **envío gratis por accidente,
 * pagado por el vendedor.** Por eso se lee el payload.
 */
export async function cotizarEnvioDespensa(
  input: InputCotizarEnvio,
): Promise<ResultadoWrapper<CotizacionEnvio, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('cotizar_envio_despensa', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_subtotal: input.subtotal,
    p_peso_fisico_kg: input.peso_fisico_kg ?? 0,
    p_peso_volumetrico_kg: input.peso_volumetrico_kg ?? 0,
    p_country_code: input.country_code ?? 'EC',
    p_ciudad_destino: input.ciudad_destino ?? undefined,
  });

  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data)) return falloDespensa('datos_inconsistentes');

  if (data.ok !== true) {
    // 🔴 LOS CUATRO CÓDIGOS DEL MOTOR, TIPADOS. Antes solo se reconocían dos y
    //    los otros caían en `error_desconocido` — **una familia en Guayaquil
    //    leía «error» en vez de «todavía no llegamos ahí»**, que es una
    //    respuesta que no ayuda a nadie y que además esconde que el producto
    //    existe y el problema es la dirección.
    const codigo = typeof data.error === 'string' ? data.error : 'error_desconocido';
    if (codigo === 'sin_regla_envio') return falloDespensaCodigo('sin_regla_envio');
    if (codigo === 'tipo_regla_sin_motor') return falloDespensaCodigo('tipo_regla_sin_motor');
    if (codigo === 'fuera_de_cobertura') return falloDespensaCodigo('fuera_de_cobertura');
    if (codigo === 'destino_no_declarado') return falloDespensaCodigo('destino_no_declarado');
    return falloDespensa(codigo);
  }

  if (typeof data.costo !== 'number' || typeof data.regla_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      costo: data.costo,
      moneda: typeof data.moneda === 'string' ? data.moneda : 'USD',
      regla_id: data.regla_id,
      tipo_regla: typeof data.tipo_regla === 'string' ? data.tipo_regla : '',
      peso_fisico_kg: typeof data.peso_fisico_kg === 'number' ? data.peso_fisico_kg : 0,
      peso_volumetrico_kg:
        typeof data.peso_volumetrico_kg === 'number' ? data.peso_volumetrico_kg : 0,
      peso_facturable_kg:
        typeof data.peso_facturable_kg === 'number' ? data.peso_facturable_kg : 0,
      parametros_aplicados: data.parametros_aplicados,
      cobertura_declarada: data.cobertura_declarada === true,
    },
  };
}

export interface PromesaEntrega {
  desde: string;
  hasta: string;
  /** false = la bodega no declaró hora de corte. El motor NO la inventa y la
   *  respuesta lo dice: la superficie puede ser honesta sobre su propia
   *  incertidumbre en vez de prometer un día que no sabe. */
  hora_corte_declarada: boolean;
  /** true = el pedido entró después del corte y sale al día siguiente. Causa
   *  número uno de promesas incumplidas en comercio. */
  paso_el_corte: boolean;
  horas_preparacion: number;
  horas_transito: number;
}

export async function calcularPromesaEntrega(
  bodegaId: string,
  horasTransito = 24,
): Promise<ResultadoWrapper<PromesaEntrega, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('calcular_promesa_entrega', {
    p_bodega_id: bodegaId,
    p_horas_transito: horasTransito,
  });

  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data)) return falloDespensa('datos_inconsistentes');
  if (data.ok !== true) {
    if (data.error === 'bodega_no_encontrada') return falloDespensaCodigo('bodega_no_encontrada');
    return falloDespensa(typeof data.error === 'string' ? data.error : 'error_desconocido');
  }
  if (typeof data.desde !== 'string' || typeof data.hasta !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      desde: data.desde,
      hasta: data.hasta,
      hora_corte_declarada: data.hora_corte_declarada === true,
      paso_el_corte: data.paso_el_corte === true,
      horas_preparacion: typeof data.horas_preparacion === 'number' ? data.horas_preparacion : 0,
      horas_transito: typeof data.horas_transito === 'number' ? data.horas_transito : 0,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 4 · COMPRAR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 🔴 LA CLAVE DE IDEMPOTENCIA — cómo se genera y por qué es ESTABLE.
 *
 * **Se llama UNA vez, al ABRIR el checkout, y la misma clave se pasa en cada
 * reintento.** Si se generara adentro del botón de pagar, cada toque traería
 * una clave nueva, `crear_pedido_despensa` no reconocería el reintento y
 * crearía un pedido por toque. *Ese defecto no se descubre en un test: se
 * descubre con un cliente real enojado del otro lado que pagó dos veces.*
 *
 * POR QUÉ NO SE DERIVA DEL CONTENIDO DEL CARRITO (un hash de los ítems):
 * porque dos compras legítimas idénticas —la misma bolsa de 15 kg dos veces
 * en la misma semana— colapsarían en una sola. La estabilidad tiene que venir
 * del INTENTO, no del contenido.
 *
 * POR QUÉ EL WRAPPER LA PREFIJA CON EL `uid` (ver `crearPedidoDespensa`):
 * 🔴 hallazgo del motor. `crear_pedido_despensa` busca la clave existente
 * **sin filtrar por dueño**: `SELECT id FROM pedidos WHERE clave_idempotencia
 * = p_clave`. Con una clave adivinable o repetida entre personas, quien la
 * mandara recibiría el `pedido_id` de OTRO. Prefijar con el uid vuelve la
 * colisión cruzada imposible desde esta capa; la cura de fondo es acotar la
 * búsqueda por `user_id` en el motor y queda declarada para su migración.
 */
export function nuevaClaveIdempotencia(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  // Sin `crypto.randomUUID` (Hermes viejo): dos fuentes de azar + reloj. Ya
  // va prefijada por uid, así que una colisión exigiría la MISMA persona, el
  // MISMO milisegundo y los MISMOS dos azares.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export interface ItemDeCompra {
  oferta_id: string;
  cantidad: number;
}

export interface DatosDeEntrega {
  nombre_receptor: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  sector?: string;
  referencias?: string;
}

export interface PedidoCreado {
  pedido_id: string;
  /** true = esta clave ya había creado este pedido. No es un error: es la
   *  idempotencia funcionando, y la pantalla debe seguir de largo al pago. */
  ya_existia: boolean;
  /** Los totales VIENEN DEL MOTOR. `null` cuando `ya_existia` (el motor
   *  devuelve solo el id) — nulo honesto: los relee `obtenerPedido`. */
  subtotal: number | null;
  impuesto: number | null;
  envio: number | null;
  total: number | null;
  /** El resultado crudo de la cotización, para que la pantalla pueda decir
   *  "no pudimos calcular el envío" con su motivo. */
  cotizacion_envio: unknown;
}

/**
 * Crea el pedido. **El pedido nace en `creado`: no está pagado y no reserva
 * stock** — es el carrito con precios reales del motor.
 */
export async function crearPedidoDespensa(input: {
  cuenta_comercial_id: string;
  items: ItemDeCompra[];
  entrega: DatosDeEntrega;
  /** El nonce de `nuevaClaveIdempotencia()`, creado al abrir el checkout. */
  clave_idempotencia: string;
  bodega_id?: string;
}): Promise<ResultadoWrapper<PedidoCreado, CodigoErrorDespensa>> {
  const uid = await uidActual();
  if (uid === null) return falloDespensaCodigo('auth_requerido');
  if (input.items.length === 0) return falloDespensaCodigo('pedido_sin_items');

  const { data, error } = await getClient().rpc('crear_pedido_despensa', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    // 🔴 El prefijo por uid: ver `nuevaClaveIdempotencia`.
    p_clave_idempotencia: `${uid}:${input.clave_idempotencia}`,
    p_items: input.items.map((i) => ({ oferta_id: i.oferta_id, cantidad: i.cantidad })),
    p_entrega: {
      nombre_receptor: input.entrega.nombre_receptor,
      telefono: input.entrega.telefono,
      direccion: input.entrega.direccion,
      ciudad: input.entrega.ciudad,
      sector: input.entrega.sector ?? null,
      referencias: input.entrega.referencias ?? null,
    },
    p_bodega_id: input.bodega_id ?? undefined,
  });

  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.pedido_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
  return {
    ok: true,
    data: {
      pedido_id: data.pedido_id,
      ya_existia: data.ya_existia === true,
      subtotal: num(data.subtotal),
      impuesto: num(data.impuesto),
      envio: num(data.envio),
      total: num(data.total),
      cotizacion_envio: data.cotizacion_envio ?? null,
    },
  };
}

/** Reserva el stock. El motor es idempotente: si ya hay reserva vigente
 *  devuelve `ya_reservado` en vez de duplicar. */
export async function reservarStockPedido(
  pedidoId: string,
  minutosVigencia = 30,
): Promise<ResultadoWrapper<{ reservas: number; ya_reservado: boolean }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('reservar_stock_pedido', {
    p_pedido_id: pedidoId,
    p_minutos_vigencia: minutosVigencia,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return {
    ok: true,
    data: {
      reservas: typeof data.reservas === 'number' ? data.reservas : 0,
      ya_reservado: data.ya_reservado === true,
    },
  };
}

/**
 * 🔴 EL INTENTO DE PAGO, SIN NOMBRAR A NINGÚN PROVEEDOR.
 *
 * Esta función NO cobra y NO habla con ninguna pasarela: mueve el pedido a
 * `esperando_pago` y devuelve lo que la pantalla necesita para abrir el
 * formulario del proveedor que el backend haya elegido.
 *
 * **Ninguna credencial de pasarela toca el cliente.** La tokenización de la
 * tarjeta la hace el SDK del proveedor contra su propio dominio, y la captura
 * la confirma el backend por webhook llamando a `confirmar_pago_pedido` con
 * la clave de idempotencia del evento. Por eso `confirmarPagoPedido` **no se
 * exporta desde esta capa**: si viviera acá, cualquiera con la anon key
 * podría declarar un pedido pagado sin haber pagado. *El dominio es agnóstico
 * de quién cobra, y el cliente no es quien decide que se cobró.*
 */
export async function iniciarPagoPedido(
  pedidoId: string,
): Promise<ResultadoWrapper<{ estado: NarrativaPedido }, CodigoErrorDespensa>> {
  // 🔴 S95-K: pasa por `iniciar_pago_pedido`, que **reserva el stock Y mueve
  //    el estado en el mismo acto**. La versión anterior solo movía el estado,
  //    y eso dejaba abierto el agujero que la sonda de K midió: se capturaba el
  //    pago de un pedido sin stock reservado. *Primero se aparta la mercadería,
  //    después se pide la tarjeta.*
  const { data, error } = await getClient().rpc('iniciar_pago_pedido', {
    p_pedido_id: pedidoId,
    p_minutos_vigencia: 30,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  // El motor devuelve la NARRATIVA, no el estado interno — y si algún día
  // devolviera otra cosa, este guard lo caza en vez de dejar pasar un código
  // de fontanería hasta una pantalla.
  const n = data.narrativa;
  if (!esNarrativa(n)) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { estado: n } };
}

/** Cancela el pedido y libera la reserva de stock. */
export async function cancelarPedidoDespensa(
  pedidoId: string,
  motivo: string,
): Promise<ResultadoWrapper<{ ok: true }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('cancelar_pedido_despensa', {
    p_pedido_id: pedidoId,
    p_actor: 'cliente',
    p_motivo: motivo,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { ok: true } };
}
