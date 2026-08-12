// LA MAQUINARIA DE ERRORES DE LA DESPENSA — compartida por los cuatro
// wrappers del frente (catálogo · pedido · vendedor · señales).
//
// DESVÍO DEL MOLDE, DECLARADO: el molde de la casa pone la lista de códigos
// dentro de cada archivo (ver `grooming-reserva.ts`). Acá los cuatro archivos
// envuelven **el mismo motor** — las diez funciones de la migración
// `20260812000000_s95_m13_motor.sql` —, así que una sola lista es más fiel al
// principio que la genera: *los códigos salen de los `RAISE` reales, no de la
// cabeza de quien escribe el wrapper*. Cuatro copias divergirían, y ese drift
// es exactamente el que S95-D cazó entre dos migraciones de la misma tanda.
// Precedente de archivo interno compartido con prefijo `_`:
// `_mascotas-elegibles.ts`, `_presupuesto-descripcion.ts`.

import type { ResultadoWrapper } from '../resultado';

// ── Los códigos, LEÍDOS de los cuerpos del motor ────────────────────────────
// Cada uno con el `RAISE` de donde sale. Si un código no está acá es porque
// no existe en el motor; si el motor gana uno nuevo, entra acá y no en un
// `catch` genérico.
export const CODIGOS_ERROR_DESPENSA = [
  // mover_estado_pedido · crear_pedido_despensa · entregar_pedido
  'auth_requerido',
  'pedido_no_existe',
  'estado_no_existe',
  // 🔴 El estado está MODELADO y APAGADO. No es un error del usuario: es la
  //    ley de S95-D hecha mecanismo. El mensaje lo dice sin culpar a nadie.
  'estado_inactivo',
  'transicion_no_permitida',
  'motivo_requerido',
  'no_es_tu_pedido',
  'no_sos_el_vendedor',
  'no_sos_admin',
  // crear_pedido_despensa
  'clave_idempotencia_requerida',
  'pedido_sin_items',
  'oferta_no_publicada',
  // reservar_stock_pedido
  'item_sin_sku',
  // El CHECK `stock_disponible >= 0` de `vendedor_skus` es el que rebota la
  // sobrerreserva — llega como violación de constraint, no como RAISE.
  'sin_stock',
  // empacar_pedido
  'lote_requerido',
  // entregar_pedido
  'sin_acceso_a_mascota',
  // registrar_senal_comercial
  'senal_no_existe',
  'senal_inactiva',
  // ── Los que NO son `RAISE`: `cotizar_envio_despensa` y
  //    `calcular_promesa_entrega` devuelven `{ok:false, error}` DENTRO del
  //    jsonb. El wrapper los levanta del payload y los tipa igual, porque
  //    para quien llama la diferencia entre "rebotó" y "respondió que no
  //    pudo" no existe: en los dos casos no hay envío que cobrar.
  'sin_regla_envio',
  'tipo_regla_sin_motor',
  'bodega_no_encontrada',
  // ── Del wrapper, no del motor. Ver `_despensa-catalogo` §exclusión.
  'exclusion_no_verificable',
  'mascota_sin_perfil',
] as const;

export type CodigoErrorDespensa = (typeof CODIGOS_ERROR_DESPENSA)[number];

export const MENSAJES_DESPENSA: Record<
  CodigoErrorDespensa | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  auth_requerido:               'Necesitás iniciar sesión para hacer esto.',
  pedido_no_existe:             'No encontramos ese pedido.',
  estado_no_existe:             'Ese estado de pedido no existe.',
  estado_inactivo:              'Ese paso todavía no está disponible.',
  transicion_no_permitida:      'El pedido no puede pasar a ese estado desde donde está.',
  motivo_requerido:             'Falta el motivo.',
  no_es_tu_pedido:              'Este pedido no es tuyo.',
  no_sos_el_vendedor:           'No sos el vendedor de este pedido.',
  no_sos_admin:                 'No tenés permiso para hacer esto.',
  clave_idempotencia_requerida: 'Falta la clave de la compra. Volvé a intentar.',
  pedido_sin_items:             'El pedido no tiene productos.',
  oferta_no_publicada:          'Uno de los productos ya no está disponible.',
  item_sin_sku:                 'Uno de los productos perdió su referencia de stock.',
  sin_stock:                    'No hay stock suficiente para uno de los productos.',
  lote_requerido:               'Falta registrar el lote de los productos.',
  sin_acceso_a_mascota:         'No tenés acceso a esa mascota.',
  senal_no_existe:              'Esa señal no existe.',
  senal_inactiva:               'Esa señal está apagada.',
  // 🔴 HONESTIDAD, NO EXCUSA: el vendedor no cargó su regla de envío. La app
  //    no inventa un costo ni dice "error"; dice que no se puede calcular.
  sin_regla_envio:              'Todavía no podemos calcular el envío para este vendedor.',
  tipo_regla_sin_motor:         'Todavía no podemos calcular el envío para este vendedor.',
  bodega_no_encontrada:         'No encontramos desde dónde sale este pedido.',
  exclusion_no_verificable:     'No pudimos revisar las alergias de tu mascota. Mejor no te mostramos nada.',
  mascota_sin_perfil:           'Todavía no sabemos lo suficiente de tu mascota.',
  datos_inconsistentes:         'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:            'Ocurrió un error inesperado. Probá de nuevo.',
};

/** Normaliza por PREFIJO (L-115): el motor manda códigos con sufijo
 *  (`estado_inactivo: "devuelto" está modelado pero apagado…`). */
export function normalizarCodigoDespensa(
  raw: string,
): CodigoErrorDespensa | 'error_desconocido' {
  // Alias del vocabulario viejo de la casa — el motor de despensa dice
  // `auth_requerido`, el resto del monorepo dice `auth_required`.
  if (raw === 'auth_required') return 'auth_requerido';
  if (raw.startsWith('no_access_to_mascota')) return 'sin_acceso_a_mascota';
  // El CHECK del stock no es un RAISE nuestro: llega como texto de constraint.
  if (raw.includes('stock_disponible')) return 'sin_stock';
  for (const codigo of CODIGOS_ERROR_DESPENSA) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

export function falloDespensa<T>(
  mensajeOriginal: string,
): ResultadoWrapper<T, CodigoErrorDespensa> {
  const codigo = normalizarCodigoDespensa(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_DESPENSA[codigo] };
}

/** Fallo con código YA resuelto (para los `{ok:false,error}` del payload,
 *  que no pasan por normalización porque no traen sufijo). */
export function falloDespensaCodigo<T>(
  codigo: CodigoErrorDespensa,
): ResultadoWrapper<T, CodigoErrorDespensa> {
  return { ok: false, codigo, mensaje: MENSAJES_DESPENSA[codigo] };
}

export type ObjDespensa = Record<string, unknown>;

export function esObjDespensa(v: unknown): v is ObjDespensa {
  return typeof v === 'object' && v !== null;
}

// ── LAS SIETE NARRATIVAS · el mapeo interno → familia ────────────────────────
//
// 🔴 EL MOTOR MUEVE 29 ESTADOS INTERNOS. LA FAMILIA VE SIETE.
//
// El mapeo NO se escribe acá a mano: vive en `cat_estados_pedido.narrativa`,
// que es DATO, y los lectores del cliente leen `v_pedidos_narrativa`, que ya
// resuelve el JOIN y **no expone ni una sola columna de estado crudo**
// (verificado por el invariante 16 del juez, midiendo las columnas de salida
// de la vista y no su texto).
//
// Esta lista existe para dos cosas y ninguna es traducir: **tipar** lo que la
// vista puede devolver y **ordenar** en la UI. Si algún día alguien agrega una
// narrativa al catálogo sin tocar esto, el guard de shape lo caza.
export const NARRATIVAS_PEDIDO = [
  'pagando',
  'confirmado',
  'preparando',
  'en_camino',
  'entregado',
  'no_llego',
  'cancelado',
] as const;

export type NarrativaPedido = (typeof NARRATIVAS_PEDIDO)[number];

export function esNarrativa(v: unknown): v is NarrativaPedido {
  return typeof v === 'string' && (NARRATIVAS_PEDIDO as readonly string[]).includes(v);
}

// ── Los cuatro internos que NUNCA salen, y por qué ──────────────────────────
// No son una constante que el código use: son la razón escrita al lado del
// mecanismo que los tapa, para que nadie los "arregle" exponiéndolos.
//
//  · `autorizado_sin_captura` — plata retenida que todavía no es nuestra.
//  · `revision_riesgo`        — 🔴 decirle a alguien que está bajo sospecha
//                               de fraude es maltrato. Se ve "Pagando".
//  · `cancelado_sistema`      — el sistema no le explica su fontanería a nadie.
//  · `contracargo`            — es una disputa entre bancos, no una noticia
//                               que la familia pueda accionar.
