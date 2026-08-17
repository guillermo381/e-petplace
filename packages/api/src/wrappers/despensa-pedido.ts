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
  /** El día (huso del vendedor) contra el que el pedido consume cupo. */
  fecha: string;
  desde: string;
  hasta: string;
  /** El turno que la decidió (`manana` / `tarde` — dato del vendedor). */
  turno: string;
  /** true = la eligió el cliente (fecha programada, §6.2 de la letra). */
  programada: boolean;
  /** Cuántos días se corrió por cupo lleno. "El excedente no rompe nada: se
   *  promete al turno siguiente" (LETRA_PANEL §7.3). */
  saltos_por_cupo: number;
}

/**
 * ☠️ S96: la promesa por BODEGA (`calcular_promesa_entrega`, hora de corte +
 * horas de tránsito) MURIÓ — describía un courier. La promesa nueva es por
 * TURNO y CUPO (LETRA_PANEL §7): pedido de la mañana → ventana de la tarde;
 * pedido de la tarde → mañana siguiente; y el día lleno corre al siguiente.
 */
export async function calcularPromesaDespensa(input: {
  cuenta_comercial_id: string;
  /** yyyy-mm-dd, día futuro. El cupo de ese día decide (§6.2). */
  fecha_programada?: string;
  servicio_envio?: string;
}): Promise<ResultadoWrapper<PromesaEntrega, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('calcular_promesa_despensa', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_fecha_programada: input.fecha_programada ?? undefined,
    p_servicio: input.servicio_envio ?? undefined,
  });

  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data)) return falloDespensa('datos_inconsistentes');
  if (data.ok !== true) {
    return falloDespensa(typeof data.error === 'string' ? data.error : 'error_desconocido');
  }
  if (typeof data.desde !== 'string' || typeof data.hasta !== 'string' || typeof data.fecha !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      fecha: data.fecha,
      desde: data.desde,
      hasta: data.hasta,
      turno: typeof data.turno === 'string' ? data.turno : '',
      programada: data.programada === true,
      saltos_por_cupo: typeof data.saltos_por_cupo === 'number' ? data.saltos_por_cupo : 0,
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
  /** EL DESTINO (S96 · LETRA_RECORRIDO §6.3): la mascota que lo consume, o
   *  donación — o ninguno (el alimento del ave no registrada se ata después
   *  con `atarItemAMascota`). El motor rebota la mascota ajena AL COMPRAR. */
  mascota_id?: string;
  donacion?: boolean;
}

export interface DatosDeEntrega {
  nombre_receptor: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  sector?: string;
  referencias?: string;
  /** "Dejar en portería". Las lee el repartidor y deciden la entrega
   *  fallida — se piden AL COMPRAR, no en la puerta (§9.3). */
  instrucciones?: string;
  /** El punto del mapa, movible a mano (§7). */
  lat?: number;
  lon?: number;
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
  /** 'despacho' (default) o 'retiro' — el retiro entró a v1 (S96): mismo
   *  pedido, otro modo de entrega, código en el mostrador. */
  metodo_entrega?: 'despacho' | 'retiro';
  /** yyyy-mm-dd futuro. El cupo de ese día decide, o el motor rebota
   *  `sin_cupo_ese_dia` (§6.2). */
  fecha_programada?: string;
  /** 'estandar' (default). 'urgente' está modelado y APAGADO. */
  servicio_envio?: string;
}): Promise<ResultadoWrapper<PedidoCreado, CodigoErrorDespensa>> {
  const uid = await uidActual();
  if (uid === null) return falloDespensaCodigo('auth_requerido');
  if (input.items.length === 0) return falloDespensaCodigo('pedido_sin_items');

  const { data, error } = await getClient().rpc('crear_pedido_despensa', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    // 🔴 El prefijo por uid: ver `nuevaClaveIdempotencia`.
    p_clave_idempotencia: `${uid}:${input.clave_idempotencia}`,
    p_items: input.items.map((i) => ({
      oferta_id: i.oferta_id,
      cantidad: i.cantidad,
      mascota_id: i.mascota_id ?? null,
      donacion: i.donacion ?? false,
    })),
    p_entrega: {
      nombre_receptor: input.entrega.nombre_receptor,
      telefono: input.entrega.telefono,
      direccion: input.entrega.direccion,
      ciudad: input.entrega.ciudad,
      sector: input.entrega.sector ?? null,
      referencias: input.entrega.referencias ?? null,
      instrucciones: input.entrega.instrucciones ?? null,
      lat: input.entrega.lat ?? null,
      lon: input.entrega.lon ?? null,
    },
    p_bodega_id: input.bodega_id ?? undefined,
    p_metodo_entrega: input.metodo_entrega ?? undefined,
    p_fecha_programada: input.fecha_programada ?? undefined,
    p_servicio_envio: input.servicio_envio ?? undefined,
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

// ═══════════════════════════════════════════════════════════════════════════
// S100 · EL GATE DE LA PUERTA — la mala noticia se da ANTES de la caja (D-827)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POR QUÉ EXISTE, medido y no supuesto (censo L0 de S100):
 *
 * · `crear_pedido_despensa` **no valida stock** (medido sobre su fuente:
 *   ni `stock`, ni `hay_stock` aparecen en su cuerpo). El pedido se crea
 *   contento con un producto agotado.
 * · La primera vez que alguien se entera es en `iniciar_pago_pedido`, que
 *   rebota `sin_stock` — o sea **con el dedo sobre «Pagar»**.
 * · Y hoy **80 de 563 ofertas publicadas** están con `hay_stock = false`
 *   (14 % de la vitrina): el caso no es de borde, tiene sujetos reales.
 *
 * *Una familia que se entera en la caja de que no hay stock no recibe una
 * mala noticia: recibe un rechazo. La misma noticia en la puerta es
 * información, y le deja algo que hacer.*
 *
 * ── 🔴 EL LÍMITE DE ESTE LECTOR, DECLARADO EN VEZ DE DISIMULADO ─────────
 * `ofertas.hay_stock` es, literalmente, `stock_disponible > 0` (trigger
 * `_trg_oferta_deriva_hay_stock`). **Es un booleano que NO mira cantidad.**
 * ⇒ este lector caza «se agotó» y **NO caza «no alcanza para 5»**: quien
 * pide 5 de un producto con 1 sigue enterándose en la caja.
 * Cerrar ese caso exige el motor (el número vive en `vendedor_skus`, que
 * la familia no puede leer — y **no debe**: la firma de S99 dice booleano
 * y jamás el inventario ajeno). Va como pedido, no como parche acá.
 *
 * ── LO QUE NO JUZGA, A PROPÓSITO ───────────────────────────────────────
 * Devuelve `cuenta_comercial_id` como DATO y **no decide** qué hacer con
 * un carrito de dos vendedores (F5 es decisión de mesa, no de un wrapper).
 */
export type MotivoNoDisponible = 'ya_no_publicada' | 'agotado';

export interface EstadoOfertaCarrito {
  oferta_id: string;
  disponible: boolean;
  motivo: MotivoNoDisponible | null;
  /** El precio VIGENTE. El carrito guarda el que vio al agregar, y desde
   *  S99 el vendedor puede moverlo (`actualizarPrecioOferta`): si difiere,
   *  la pantalla lo dice ANTES de cobrar en vez de sorprender en el total. */
  precio_vigente: number | null;
  /** El dueño REAL de la oferta. Dato, no veredicto (ver arriba). */
  cuenta_comercial_id: string | null;
}

/**
 * Revalida el carrito contra la vitrina de AHORA, en UNA sola ola
 * (L-223 / N16.1: olas, jamás cadenas encadenadas).
 *
 * 🔴 LA PROPIEDAD QUE LO VUELVE CONFIABLE: **recorre los ids que ENTRAN,
 * no las filas que VUELVEN.** Una oferta borrada, despublicada o que la
 * RLS ya no deja ver **no vuelve en el `select`** — y si el lector
 * recorriera el resultado, ese ítem simplemente desaparecería del informe
 * y la pantalla lo daría por bueno. *Un ítem que falta se ve exactamente
 * igual que un ítem sano: es la clase de L-268, y acá se cierra por
 * construcción.*
 */
export async function revalidarCarritoDespensa(
  ofertaIds: string[],
): Promise<ResultadoWrapper<EstadoOfertaCarrito[], CodigoErrorDespensa>> {
  // Carrito vacío: cero viajes. No hay nada que revalidar y una petición
  // que no puede cambiar nada es peaje puro (~150 ms, L-223).
  if (ofertaIds.length === 0) return { ok: true, data: [] };

  // Un id repetido no se pide dos veces; el informe igual sale por id.
  const unicos = Array.from(new Set(ofertaIds));

  const { data, error } = await getClient()
    .from('ofertas')
    .select('id, estado, hay_stock, precio, cuenta_comercial_id')
    .in('id', unicos);

  if (error) return falloDespensa(error.message);

  const porId = new Map<string, Record<string, unknown>>();
  for (const fila of Array.isArray(data) ? data : []) {
    if (esObjDespensa(fila) && typeof fila.id === 'string') porId.set(fila.id, fila);
  }

  return {
    ok: true,
    // ⬇️ El recorrido es sobre `ofertaIds` — ver la nota de arriba.
    data: ofertaIds.map((id): EstadoOfertaCarrito => {
      const fila = porId.get(id);

      // No vino: borrada, despublicada fuera de nuestro alcance, o la RLS
      // ya no la muestra. En los tres casos la familia NO puede comprarla,
      // y decirlo es más honesto que omitir la fila.
      if (fila === undefined) {
        return {
          oferta_id: id,
          disponible: false,
          motivo: 'ya_no_publicada',
          precio_vigente: null,
          cuenta_comercial_id: null,
        };
      }

      const publicada = fila.estado === 'publicada';
      const conStock = fila.hay_stock === true;
      return {
        oferta_id: id,
        disponible: publicada && conStock,
        // El orden importa: si la bajaron de la vitrina, eso es lo que pasó
        // — «agotado» sobre una oferta despublicada sería una causa inventada.
        motivo: !publicada ? 'ya_no_publicada' : !conStock ? 'agotado' : null,
        precio_vigente: typeof fila.precio === 'number' ? fila.precio : null,
        cuenta_comercial_id:
          typeof fila.cuenta_comercial_id === 'string' ? fila.cuenta_comercial_id : null,
      };
    }),
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

// ═══════════════════════════════════════════════════════════════════════════
// S96 · EL CÓDIGO DE LA PUERTA, EL RECLAMO Y LA REGLA GENERAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * El código que la familia dice en la puerta (o muestra en el mostrador, si
 * el pedido es de retiro). Se lee del envío del PROPIO pedido — la RLS de
 * `envios` tiene el brazo del dueño. `null` = el pedido todavía no tiene
 * envío (no se despachó / no se pagó): vacío honesto, jamás un código
 * inventado (L-139).
 */
export async function obtenerCodigoEntrega(
  pedidoId: string,
): Promise<ResultadoWrapper<{ codigo: string | null; estado_envio: string | null }, CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('envios')
    .select('codigo_verificacion, estado')
    .eq('pedido_id', pedidoId)
    .maybeSingle();
  if (error) return falloDespensa(error.message);
  if (data === null) return { ok: true, data: { codigo: null, estado_envio: null } };
  if (!esObjDespensa(data)) return falloDespensa('datos_inconsistentes');
  return {
    ok: true,
    data: {
      codigo: typeof data.codigo_verificacion === 'string' ? data.codigo_verificacion : null,
      estado_envio: typeof data.estado === 'string' ? data.estado : null,
    },
  };
}

/**
 * LA REGLA GENERAL DE LA LETRA (§4): la app nunca adivina de quién es una
 * compra — ofrece atarla, y el dueño decide. Un ítem que quedó sin destino
 * (el alimento del ave que no estaba registrada) se ata acá; si el pedido ya
 * se entregó, el evento del expediente nace en el acto.
 */
export async function atarItemAMascota(
  itemId: string,
  mascotaId: string,
): Promise<ResultadoWrapper<{ evento_depositado: boolean }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('atar_item_a_mascota', {
    p_item_id: itemId,
    p_mascota_id: mascotaId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { evento_depositado: data.evento_depositado === true } };
}

/**
 * EL RECLAMO DE MOSTRADOR (§4): el cliente mete el código de la factura y la
 * compra se ata a él y a la mascota que ÉL elija — recién ahí nace el evento.
 * El vendedor jamás pudo elegirla: esa pantalla no existe.
 */
export async function reclamarCompraMostrador(
  codigo: string,
  mascotaId: string,
): Promise<ResultadoWrapper<{ venta_id: string; eventos_expediente: number }, CodigoErrorDespensa>> {
  if (codigo.trim().length === 0) return falloDespensaCodigo('codigo_invalido');
  const { data, error } = await getClient().rpc('reclamar_compra_mostrador', {
    p_codigo: codigo.trim(),
    p_mascota_id: mascotaId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.venta_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      venta_id: data.venta_id,
      eventos_expediente:
        typeof data.eventos_expediente === 'number' ? data.eventos_expediente : 0,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// S96 · LA COMPRA RECURRENTE — el interruptor (D-778: el primer cobro real
// espera a la pasarela; el motor lo dice con `pasarela_no_afiliada`)
// ═══════════════════════════════════════════════════════════════════════════

export async function configurarRecurrencia(input: {
  cuenta_comercial_id: string;
  items: ItemDeCompra[];
  entrega: DatosDeEntrega;
  /** Cada N días (7–90)… */
  frecuencia_dias?: number;
  /** …O un día fijo del mes (1–28). Exactamente uno de los dos. */
  dia_del_mes?: number;
  /** El aviso ANTES del cobro: 2 o 3 días (letra §6.1 ①). */
  aviso_dias?: 2 | 3;
  metodo_entrega?: 'despacho' | 'retiro';
}): Promise<
  ResultadoWrapper<{ recurrencia_id: string; proximo_pedido_fecha: string }, CodigoErrorDespensa>
> {
  if (input.items.length === 0) return falloDespensaCodigo('recurrencia_sin_items');
  const { data, error } = await getClient().rpc('configurar_recurrencia', {
    p_cuenta_comercial_id: input.cuenta_comercial_id,
    p_items: input.items.map((i) => ({
      oferta_id: i.oferta_id,
      cantidad: i.cantidad,
      mascota_id: i.mascota_id ?? null,
      donacion: i.donacion ?? false,
    })),
    p_entrega: {
      nombre_receptor: input.entrega.nombre_receptor,
      telefono: input.entrega.telefono,
      direccion: input.entrega.direccion,
      ciudad: input.entrega.ciudad,
      sector: input.entrega.sector ?? null,
      referencias: input.entrega.referencias ?? null,
      instrucciones: input.entrega.instrucciones ?? null,
      lat: input.entrega.lat ?? null,
      lon: input.entrega.lon ?? null,
    },
    p_frecuencia_dias: input.frecuencia_dias ?? undefined,
    p_dia_del_mes: input.dia_del_mes ?? undefined,
    p_aviso_dias: input.aviso_dias ?? undefined,
    p_metodo_entrega: input.metodo_entrega ?? undefined,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true || typeof data.recurrencia_id !== 'string') {
    return falloDespensa('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      recurrencia_id: data.recurrencia_id,
      proximo_pedido_fecha:
        typeof data.proximo_pedido_fecha === 'string' ? data.proximo_pedido_fecha : '',
    },
  };
}

/** ② de la letra: SE APAGA EN UN TOQUE, desde donde se prendió. Nunca por
 *  atención al cliente. */
export async function alternarRecurrencia(
  recurrenciaId: string,
  activo: boolean,
): Promise<ResultadoWrapper<{ activo: boolean }, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('alternar_recurrencia', {
    p_recurrencia_id: recurrenciaId,
    p_activo: activo,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  return { ok: true, data: { activo: data.activo === true } };
}
