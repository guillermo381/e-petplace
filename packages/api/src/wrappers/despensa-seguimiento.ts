// SEGUIR EL PEDIDO — la lista, el detalle y el envío
// (S95-E · Bloque 5 · MODELO_DESPENSA v2.0 §8).
//
// 🔴 LOS SIETE ESTADOS, Y SOLO LOS SIETE. El motor mueve 29 estados internos;
// la familia ve SIETE narrativas. El mapeo **no se escribe acá**: vive en
// `cat_estados_pedido.narrativa`, que es DATO, y estos lectores consumen
// `v_pedidos_narrativa`, que resuelve el JOIN y **no expone ni una columna de
// estado crudo** (medido: sus 15 columnas de salida, no el texto de su
// definición — el invariante 16 del juez salió rojo por la razón equivocada
// una vez y se corrigió el instrumento).
//
// Los cuatro internos que jamás salen y su porqué están escritos al pie de
// `_despensa-comun.ts`, al lado del mecanismo que los tapa. El más importante:
// **`revision_riesgo` no sale porque decirle a alguien que está bajo sospecha
// de fraude es maltrato.**

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';
// El punto del track es EL MISMO objeto que escribe el repartidor: se importa
// su tipo en vez de re-declararlo. Dos declaraciones de la misma forma son dos
// formas que un día divergen, y el día que divergen nadie se entera.
import type { PuntoTrackEnvio } from './despensa-repartidor';
import {
  falloDespensa,
  esObjDespensa,
  esNarrativa,
  type CodigoErrorDespensa,
  type NarrativaPedido,
} from './_despensa-comun';

export interface PedidoEnLista {
  pedido_id: string;
  numero_orden: string;
  total: number;
  moneda: string;
  metodo_entrega: string | null;
  /** UNA de las siete. Nunca un estado interno. */
  narrativa: NarrativaPedido;
  /** La voz de la familia, del catálogo — no de un `switch` en la pantalla. */
  narrativa_nombre: string;
  narrativa_orden: number;
  es_terminal: boolean;
  /** 🔴 LA PROMESA SE LEE DE LO GUARDADO, JAMÁS SE CALCULA ACÁ. Si el pedido
   *  no la tiene guardada, esto es `null` y la superficie dice que no hay
   *  fecha — L-139 prohíbe el dato verosímil-falso, y una fecha de entrega
   *  inventada es el verosímil-falso más caro que existe en comercio. */
  promesa_desde: string | null;
  promesa_hasta: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface LineaDePedido {
  item_id: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  impuesto_monto: number;
  /** El lote, si ya se empacó. Es lo que convierte un retiro de fabricante
   *  en un aviso a las familias correctas. */
  lote: string | null;
  fecha_vencimiento: string | null;
  /** EL DESTINO del ítem (§4, S96). `null` = sin atar — la pantalla ofrece
   *  «¿lo atás?» con `atarItemAMascota`, que es la regla general: la app
   *  jamás adivina de quién es una compra. `pedido_item_destinos` es del
   *  DUEÑO por RLS: si el que mira no es el dueño, esto viene `null` y no
   *  significa "sin atar" — significa "no es tu compra". */
  destino: { mascota_id: string | null; donacion: boolean } | null;
  /**
   * 🔴 SI ESTE ÍTEM YA SEDIMENTÓ EN EL EXPEDIENTE (S100 · H-07 de D).
   *
   * Derivado de la EXISTENCIA de fila en `evento_producto_asignacion` para
   * este `pedido_item_id` — no de una suposición sobre el producto. Hace
   * falta porque **el depósito NO ocurre para todo lo comprado**: está
   * gateado por `f.entra_al_expediente` (medido en
   * `_depositar_item_en_expediente`), o sea que **la FAMILIA del producto
   * decide** — el alimento entra, el juguete no (`BIO_EXPEDIENTE` E2bis).
   * Sin este dato, decir *«quedó en el expediente de Thor»* por cada ítem
   * con destino sería verosímil-falso (L-139).
   *
   * ⚠️ **`false` NO ES UNA AFIRMACIÓN, Y LA PANTALLA NO PUEDE TRATARLO COMO
   * TAL.** Tapa TRES causas distintas y no las distingue: ① la familia del
   * producto no entra al expediente (un juguete) · ② el ítem todavía no
   * tiene destino atado · ③ la fila existe pero **su mascota no es
   * legible por quien mira** (la RLS de `evento_producto_asignacion` es
   * `user_tiene_acceso_a_mascota`). *Un agregado sobre causas distintas no
   * mide ninguna.*
   * ⇒ **`true` habilita a decirlo; `false` habilita a CALLAR, jamás a decir
   * «no quedó en el expediente».** Es la misma disciplina que `destino`
   * declara dos campos más arriba.
   */
  sedimentado: boolean;
}

export interface SeguimientoEnvio {
  envio_id: string;
  /** Los nombres salen MEDIDOS de la tabla, no supuestos: `transportista` y
   *  `tracking_code` (la primera versión de este archivo decía
   *  `transportista_codigo` y `guia`, y el gate E2E lo cazó). */
  transportista: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  /** 🔴 QUIÉN PAGÓ EL ENVÍO, en la fila del envío. Es la contrapartida de
   *  `parametros.pagado_por` de la regla: «gratis» no es «nadie paga», y el
   *  día que e-PetPlace subsidie uno, la diferencia tiene que ser legible en
   *  la liquidación. */
  pagado_por: string | null;
  /**
   * 🔴 EL TRACK DEL REPARTO PARA LA FAMILIA (S100 · H-01 de D).
   *
   * No hizo falta motor ni policy: `envios.track_gps` ya existía y
   * `envios_select` **ya tiene el brazo del dueño** (`p.user_id = auth.uid()`)
   * — medido sobre `pg_policies`, no supuesto. Lo único que faltaba era que
   * este lector lo pidiera.
   *
   * ⚠️ **LA UNIDAD DE `t` CRUZA SIN CAMBIAR, Y ES DECISIÓN.** El escritor
   * (`registrarTrackEnvio`) guarda **epoch ms**, no ISO. Convertirlo acá
   * dejaría a los dos lados de la frontera hablando unidades distintas con
   * el mismo nombre — que es exactamente el defecto que el rename `ts`→`t`
   * del paseo dejó como lección: *un campo que cambia de forma al cruzar no
   * avisa, deja un filtro mudo.* Quien necesite ISO lo hace en un solo lugar
   * y lo declara: `new Date(p.t).toISOString()`.
   *
   * Orden: **ascendente por `t`** (es una trayectoria, se dibuja hacia
   * adelante). `null` = todavía no hay track — vacío honesto, jamás `[]`
   * disfrazado de "ya salió y no se movió" (L-139).
   */
  track: PuntoTrackEnvio[] | null;
  /**
   * ☠️ S100 · AQUÍ VIVÍA `eventos`, LEÍDO DE `envio_eventos` — UNA TABLA MUERTA.
   *
   * Medido (H-09 de D, verificado acá): `envio_eventos` tiene **0 filas** y
   * **CERO funciones que inserten en ella** en todas las migraciones. Tenía
   * policy y grants, o sea toda la apariencia de una capacidad.
   *
   * 🔴 POR QUÉ ERA PEOR QUE UN CAMPO VACÍO: una sección de hitos montada sobre
   * esto **no podía aparecer nunca, y el instrumento habría dado verde** —
   * porque una lista vacía es un estado legal y no se distingue de «todavía no
   * pasó nada». *Una tabla con policy y sin escritor no es una capacidad
   * pendiente: es una afirmación falsa con infraestructura.*
   *
   * Los hitos que SÍ se escriben viven en `envios` y son los tres de abajo.
   */

  /** Cuándo SALIÓ del local. Lo estampa el despacho. */
  salio_en: string | null;
  /** Cuándo el repartidor marcó «voy hacia allá» (`marcar_en_camino_a_destino`).
   *  🔴 Es también la ventana en la que el motor acepta puntos de track: fuera
   *  de ella rebota `track_fuera_de_ventana`. */
  hacia_destino_en: string | null;
  /**
   * Cuándo se entregó. Va aunque la mesa pidió solo los dos de arriba: **es el
   * último escalón de la misma escalera**, sale de la misma fila, en la misma
   * ola y con la misma RLS — pedirlo después habría costado otra ronda entre
   * pistas por una línea. Se declara para que se vea que fue decisión.
   */
  entregado_en: string | null;
  /**
   * 🔴 EL PUNTO AL QUE VA (S100 · H-11 de D). **Misma forma exacta que H-01**:
   * la columna ya existía, la familia ya podía leerla por el brazo del dueño
   * de `envios_select`, y **el lector simplemente no la pedía**.
   *
   * Sin esto **no hay mapa aunque haya track**: el encuadre se calcula entre
   * los dos extremos, y *una moto moviéndose sin el punto al que va no dice
   * «tu pedido se acerca» — dice «algo se mueve».*
   *
   * `null` = el envío no tiene destino cargado. **Medido: 2 de 4 lo tienen**
   * ⇒ vacío honesto, y **la pantalla no dibuja mapa sin destino** en vez de
   * encuadrar sobre un punto inventado (L-139).
   */
  destino_lat: number | null;
  destino_lon: number | null;
}

export interface DetallePedido {
  pedido: PedidoEnLista;
  items: LineaDePedido[];
  /** Congelados en la fila del pedido — snapshot, jamás FK viva (D-339). */
  entrega: {
    nombre_receptor: string | null;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
    sector: string | null;
    referencias: string | null;
    /** «Dejar en portería» — la instrucción que decide la entrega fallida
     *  (§9.3). Viaja al crear y VUELVE al leer (pedido D, 12-ago). */
    instrucciones: string | null;
  };
  subtotal: number;
  impuesto_total: number;
  costo_envio: number;
  descuento_monto: number;
  /** null = todavía no hay envío creado. Vacío honesto. */
  envio: SeguimientoEnvio | null;
}

function mapearPedido(f: unknown): PedidoEnLista | null {
  if (!esObjDespensa(f) || typeof f.pedido_id !== 'string') return null;
  if (!esNarrativa(f.narrativa)) return null;
  return {
    pedido_id: f.pedido_id,
    numero_orden: typeof f.numero_orden === 'string' ? f.numero_orden : '',
    total: typeof f.total === 'number' ? f.total : 0,
    moneda: typeof f.moneda === 'string' ? f.moneda : 'USD',
    metodo_entrega: typeof f.metodo_entrega === 'string' ? f.metodo_entrega : null,
    narrativa: f.narrativa,
    narrativa_nombre: typeof f.narrativa_nombre === 'string' ? f.narrativa_nombre : '',
    narrativa_orden: typeof f.narrativa_orden === 'number' ? f.narrativa_orden : 0,
    es_terminal: f.es_terminal === true,
    promesa_desde: typeof f.promesa_entrega_desde === 'string' ? f.promesa_entrega_desde : null,
    promesa_hasta: typeof f.promesa_entrega_hasta === 'string' ? f.promesa_entrega_hasta : null,
    creado_en: typeof f.created_at === 'string' ? f.created_at : '',
    actualizado_en: typeof f.updated_at === 'string' ? f.updated_at : '',
  };
}

/**
 * Mis pedidos. La RLS de `pedidos` (`user_id = auth.uid() OR
 * es_vendedor_de(...) OR is_admin()`) es la que decide qué se ve — este
 * wrapper no filtra por dueño, porque un filtro en el cliente sobre datos que
 * el server ya entregó no protege nada.
 */
export async function listarMisPedidos(
  limite = 30,
): Promise<ResultadoWrapper<PedidoEnLista[], CodigoErrorDespensa>> {
  const { data, error } = await getClient()
    .from('v_pedidos_narrativa')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) return falloDespensa(error.message);
  if (!Array.isArray(data)) return falloDespensa('datos_inconsistentes');
  const salida: PedidoEnLista[] = [];
  for (const f of data) {
    const p = mapearPedido(f);
    // 🔴 Una fila cuya narrativa no es una de las siete es un estado interno
    // filtrándose. No se ignora la fila (eso escondería la fuga): se rechaza
    // la respuesta entera y el juez tiene un invariante para lo mismo.
    if (p === null) return falloDespensa('datos_inconsistentes');
    salida.push(p);
  }
  return { ok: true, data: salida };
}

export async function obtenerDetallePedido(
  pedidoId: string,
): Promise<ResultadoWrapper<DetallePedido, CodigoErrorDespensa>> {
  const cliente = getClient();
  const [vista, cab, items, env] = await Promise.all([
    cliente.from('v_pedidos_narrativa').select('*').eq('pedido_id', pedidoId).maybeSingle(),
    cliente
      .from('pedidos')
      .select('subtotal, impuesto_total, costo_envio, descuento_monto, entrega_nombre_receptor, entrega_telefono, entrega_direccion, entrega_ciudad, entrega_sector, entrega_referencias, entrega_instrucciones')
      .eq('id', pedidoId)
      .maybeSingle(),
    cliente
      .from('pedido_items')
      // `evento_producto_asignacion` va EMBEBIDO, no en un viaje aparte: existe
      // la FK `evento_producto_asignacion_pedido_item_id_fkey`, así que viaja
      // en la MISMA ola (N16.1 / L-223 — el peaje por petición es ~150 ms y no
      // depende de cuánto traiga). Se pide solo el id: alcanza para saber que
      // la fila EXISTE, y nada del expediente ajeno baja al teléfono.
      .select('id, nombre_producto, cantidad, precio_unitario, subtotal, impuesto_monto, lote, fecha_vencimiento, pedido_item_destinos(mascota_id, es_donacion), evento_producto_asignacion(id)')
      .eq('pedido_id', pedidoId),
    cliente
      .from('envios')
      .select('id, transportista, tracking_code, tracking_url, pagado_por, track_gps, salio_en, hacia_destino_en, entregado_en, destino_lat, destino_lon')
      .eq('pedido_id', pedidoId)
      .maybeSingle(),
  ]);

  if (vista.error) return falloDespensa(vista.error.message);
  if (cab.error) return falloDespensa(cab.error.message);
  if (items.error) return falloDespensa(items.error.message);
  if (env.error) return falloDespensa(env.error.message);
  if (vista.data === null || cab.data === null) return falloDespensa('pedido_no_existe');

  const pedido = mapearPedido(vista.data);
  if (pedido === null) return falloDespensa('datos_inconsistentes');

  const lineas: LineaDePedido[] = [];
  for (const i of items.data ?? []) {
    if (!esObjDespensa(i) || typeof i.id !== 'string') return falloDespensa('datos_inconsistentes');
    lineas.push({
      item_id: i.id,
      nombre_producto: typeof i.nombre_producto === 'string' ? i.nombre_producto : '',
      cantidad: typeof i.cantidad === 'number' ? i.cantidad : 0,
      precio_unitario: typeof i.precio_unitario === 'number' ? i.precio_unitario : 0,
      subtotal: typeof i.subtotal === 'number' ? i.subtotal : 0,
      impuesto_monto: typeof i.impuesto_monto === 'number' ? i.impuesto_monto : 0,
      lote: typeof i.lote === 'string' ? i.lote : null,
      fecha_vencimiento: typeof i.fecha_vencimiento === 'string' ? i.fecha_vencimiento : null,
      // `pedido_item_destinos` es 1:1 (PK = pedido_item_id); PostgREST lo
      // entrega como objeto o null según la FK — se aceptan las dos formas.
      destino: (() => {
        const d = Array.isArray(i.pedido_item_destinos)
          ? i.pedido_item_destinos[0]
          : i.pedido_item_destinos;
        if (!esObjDespensa(d)) return null;
        return {
          mascota_id: typeof d.mascota_id === 'string' ? d.mascota_id : null,
          donacion: d.es_donacion === true,
        };
      })(),
      // Sedimentó ⟺ EXISTE la fila. PostgREST entrega el embed como arreglo
      // (1:N) o como objeto según la cardinalidad que infiera de la FK — se
      // aceptan las dos formas, igual que `pedido_item_destinos` arriba.
      // *No se lee ningún campo de la fila: la pregunta es si existe.*
      sedimentado: (() => {
        const a = i.evento_producto_asignacion;
        if (Array.isArray(a)) return a.length > 0;
        return esObjDespensa(a);
      })(),
    });
  }

  let envio: SeguimientoEnvio | null = null;
  if (esObjDespensa(env.data) && typeof env.data.id === 'string') {
    const hito = (v: unknown): string | null => (typeof v === 'string' ? v : null);
    envio = {
      envio_id: env.data.id,
      transportista: typeof env.data.transportista === 'string' ? env.data.transportista : null,
      tracking_code: typeof env.data.tracking_code === 'string' ? env.data.tracking_code : null,
      tracking_url: typeof env.data.tracking_url === 'string' ? env.data.tracking_url : null,
      pagado_por: typeof env.data.pagado_por === 'string' ? env.data.pagado_por : null,
      // El track: se valida punto por punto contra la forma que ESCRIBE el
      // repartidor (`{lat, lng, t}` — `lng`, no `lon`: leído de su escritor,
      // no de memoria). Un punto malformado se descarta; una trayectoria a la
      // que le falta un punto sigue siendo la trayectoria, y un `NaN` metido
      // en un mapa lo rompe entero.
      track: (() => {
        const crudo: unknown = env.data.track_gps;
        if (!Array.isArray(crudo) || crudo.length === 0) return null;
        const puntos: PuntoTrackEnvio[] = [];
        for (const p of crudo as unknown[]) {
          if (
            esObjDespensa(p) &&
            typeof p.lat === 'number' &&
            typeof p.lng === 'number' &&
            typeof p.t === 'number'
          ) {
            puntos.push({ lat: p.lat, lng: p.lng, t: p.t });
          }
        }
        puntos.sort((a, b) => a.t - b.t);
        return puntos.length > 0 ? puntos : null;
      })(),
      // Los tres hitos, tal como los estampó el motor. `null` = todavía no
      // ocurrió — vacío honesto, jamás una fecha inventada para llenar la
      // escalera (L-139).
      salio_en: hito(env.data.salio_en),
      hacia_destino_en: hito(env.data.hacia_destino_en),
      entregado_en: hito(env.data.entregado_en),
      // El destino: número o null. Un `0` es una coordenada válida, así que se
      // pregunta por el TIPO y no por la verdad del valor — `|| null` habría
      // convertido el meridiano de Greenwich en «sin destino».
      destino_lat: typeof env.data.destino_lat === 'number' ? env.data.destino_lat : null,
      destino_lon: typeof env.data.destino_lon === 'number' ? env.data.destino_lon : null,
    };
  }

  const c = cab.data;
  const n = (v: unknown): number => (typeof v === 'number' ? v : 0);
  const s = (v: unknown): string | null => (typeof v === 'string' ? v : null);
  return {
    ok: true,
    data: {
      pedido,
      items: lineas,
      entrega: {
        nombre_receptor: s(c.entrega_nombre_receptor),
        telefono: s(c.entrega_telefono),
        direccion: s(c.entrega_direccion),
        ciudad: s(c.entrega_ciudad),
        sector: s(c.entrega_sector),
        referencias: s(c.entrega_referencias),
        instrucciones: s(c.entrega_instrucciones),
      },
      // Transportados del motor, no sumados acá.
      subtotal: n(c.subtotal),
      impuesto_total: n(c.impuesto_total),
      costo_envio: n(c.costo_envio),
      descuento_monto: n(c.descuento_monto),
      envio,
    },
  };
}

/**
 * F3 · LA FICHA DEL REPARTIDOR PARA LA FAMILIA (S100 · H-02).
 *
 * Tres campos y nada más: **nombre · tipo de vehículo · placa**. La placa
 * manda, porque es lo que se verifica en la calle.
 *
 * 🔴 **LA FOTO NO SALE, Y NO ES UN OLVIDO.** `repartidores.foto_path` vive en
 * `cuenta-documentos`, **el bucket de los documentos de identidad**. La salida
 * correcta no es una policy fina sobre un bucket sensible: es que la foto de
 * perfil viva en SU propio bucket, con su carga y su consentimiento. Deuda
 * declarada por mesa, fuera de S100. ⇒ la ficha sale con **tres de cuatro y el
 * hueco se dice** (N13). *Uber sin foto sigue siendo Uber; sin placa, no.*
 *
 * Pasa por DEFINER porque `repartidores` y `repartidor_vehiculos` NO son
 * legibles por la familia —son datos de un tercero— y el gate vive en el
 * cuerpo, keyed por el ENVÍO (molde D-455: los ids son filtro, jamás permiso).
 *
 * ⚠️ **`hay_ficha:false` tapa DOS casos a propósito** —el envío no es tuyo, o
 * todavía no tiene repartidor— y **no los distingue**: separarlos le
 * confirmaría a un curioso que el envío existe.
 * ⚠️ Y el dato vivo, para que un vacío no se lea como falla: **6 repartidores,
 * 1 con vehículo cargado.**
 */
export interface FichaRepartidor {
  nombre: string | null;
  vehiculo_tipo: string | null;
  vehiculo_placa: string | null;
}

export async function obtenerFichaRepartidor(
  envioId: string,
): Promise<ResultadoWrapper<FichaRepartidor | null, CodigoErrorDespensa>> {
  const { data, error } = await getClient().rpc('obtener_ficha_repartidor', {
    p_envio_id: envioId,
  });
  if (error) return falloDespensa(error.message);
  if (!esObjDespensa(data) || data.ok !== true) return falloDespensa('datos_inconsistentes');
  // `null` = no hay ficha que mostrar. La pantalla no dibuja la tarjeta, en
  // vez de dibujarla con tres guiones.
  if (data.hay_ficha !== true) return { ok: true, data: null };
  const s = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
  return {
    ok: true,
    data: {
      nombre: s(data.nombre),
      vehiculo_tipo: s(data.vehiculo_tipo),
      vehiculo_placa: s(data.vehiculo_placa),
    },
  };
}
