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
  // poner_pedido_primero (S99-L3): un pedido cerrado no se ordena en
  // ninguna cola — la ventana ni ofrece el comando (AUSENTE, Ley 23);
  // este rebote es el respaldo del motor, no una pantalla esperada.
  'pedido_terminal',
  // proponer_skus_vendedor_lote (S99-L5a): la carga determinista.
  'lote_invalido',
  'lote_demasiado_grande',
  // crear_pedido_despensa
  'clave_idempotencia_requerida',
  'pedido_sin_items',
  'oferta_no_publicada',
  // reservar_stock_pedido
  'item_sin_sku',
  // El CHECK `stock_disponible >= 0` de `vendedor_skus` es el que rebota la
  // sobrerreserva — llega como violación de constraint, no como RAISE.
  'sin_stock',
  // S99 · la banda de precio — los dos rebotes que la superficie TIENE que
  // poder decir: sin ellos el vendedor ve «algo salió mal» sobre una decisión
  // de producto que sí tiene explicación.
  'sin_referencia_de_precio',
  'fuera_de_banda',
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
  // S95-K: el cotizador conoce el destino desde S95-G2 y estos dos códigos son
  // suyos. Sin tiparlos, una familia en Guayaquil leía «error».
  'fuera_de_cobertura',
  'destino_no_declarado',
  // ── S96 · el repartidor y la entrega con evidencia (M1/M2) ────────────────
  'repartidor_invalido',
  'repartidor_no_existe',
  'no_sos_el_repartidor_asignado',
  'no_podes_operar_este_envio',
  'envio_no_existe',
  'codigo_incorrecto',
  'foto_requerida',
  'retiro_no_se_despacha',
  'retiro_es_del_mostrador',
  'pedido_sin_direccion',
  'nombre_requerido',
  'documento_requerido',
  'actor_repartidor_no_invocable',
  // ── S96 · el destino por ítem y el reclamo (M2/M6) ────────────────────────
  'mascota_sin_acceso',
  'destino_contradictorio',
  'no_es_tu_compra',
  'donacion_no_se_ata',
  'item_ya_atado',
  'item_no_existe',
  'codigo_invalido',
  'compra_ya_reclamada',
  'codigo_expirado',
  'venta_sin_items',
  'sku_invalido',
  'stock_insuficiente',
  // ── S96 · el cupo, los turnos y la fecha programada (M3) ──────────────────
  'metodo_entrega_invalido',
  'sin_turnos_de_entrega',
  'sin_cupo_ese_dia',
  'sin_capacidad_de_reparto',
  'fecha_programada_invalida',
  'servicio_envio_inactivo',
  'servicio_envio_desconocido',
  'capacidad_invalida',
  'recurso_no_existe',
  // ── S96 · la recurrencia (M7) ─────────────────────────────────────────────
  'cadencia_invalida',
  'recurrencia_sin_items',
  'recurrencia_no_existe',
  'no_es_tu_recurrencia',
  'pasarela_no_afiliada',
  // ── S96 · segunda tanda: composición (M11) y entendimiento (M13) ─────────
  'composicion_estado_invalido',
  'solo_epetplace_verifica',
  'composicion_presente_no_puede_ser_ausente',
  'no_podes_tocar_este_producto',
  'producto_no_existe',
  'alergenos_requeridos',
  // ── S96 · el track del reparto (M23) ─────────────────────────────────────
  'track_fuera_de_ventana',
  'puntos_invalidos',
  'track_excede_limite',
  // ── S98 · la IDENTIDAD del repartidor y su vehículo ───────────────────────
  // 🔴 EL CENSO SE CORRIÓ CONTRA EL OBJETO, NO CONTRA LA MEMORIA: se
  // extrajeron los `RAISE EXCEPTION` de las CINCO puertas vivas con
  // `pg_get_functiondef` y salieron **NUEVE** códigos sin tipar, no los tres
  // que se habían visto al chocar con ellos.
  //
  // > ***Y el más viejo no es de S98: `documento_en_uso` es de S97.*** Lleva
  // > una sesión entera devolviendo el genérico cada vez que alguien corrige
  // > el documento de un repartidor a uno que ya existe —justo el caso donde
  // > la persona necesita entender que hay OTRA ficha con ese número, porque
  // > si no lo entiende va a insistir.
  //
  // *Los códigos que se descubren chocando son los que el camino feliz pisa;
  //  los que faltan son los de los caminos que nadie recorrió todavía.*
  'documento_en_uso',
  'telefono_invalido',
  'whatsapp_invalido',
  'tipo_documento_invalido',
  'documento_no_coincide_con_tipo',
  'tipo_vehiculo_invalido',
  'placa_requerida',
  'vehiculo_tope_alcanzado',
  'vehiculo_no_existe',
  // ── S98 · el guard de obligatoriedad (paso ④ del tren) ───────────────────
  // 🔴 `foto_persona_requerida` NO reusa el `foto_requerida` que ya existe
  // arriba: ése es de la ENTREGA y su voz habla de la puerta del cliente.
  // *Un código con dos significados es peor que dos códigos — el primero que
  // se escribe gana la voz, y el segundo hereda una frase de otra cosa.*
  'foto_persona_requerida',
  'whatsapp_requerido',
] as const;

export type CodigoErrorDespensa = (typeof CODIGOS_ERROR_DESPENSA)[number];

export const MENSAJES_DESPENSA: Record<
  CodigoErrorDespensa | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  auth_requerido:               'Necesitas iniciar sesión para hacer esto.',
  pedido_no_existe:             'No encontramos ese pedido.',
  estado_no_existe:             'Ese estado de pedido no existe.',
  estado_inactivo:              'Ese paso todavía no está disponible.',
  transicion_no_permitida:      'El pedido no puede pasar a ese estado desde donde está.',
  motivo_requerido:             'Falta el motivo.',
  no_es_tu_pedido:              'Este pedido no es tuyo.',
  no_sos_el_vendedor:           'No sos el vendedor de este pedido.',
  no_sos_admin:                 'No tienes permiso para hacer esto.',
  pedido_terminal:              'Este pedido ya está cerrado — no hay cola donde ordenarlo.',
  lote_invalido:                'El archivo no tiene filas que cargar.',
  lote_demasiado_grande:        'El archivo supera las 500 filas. Partilo y cargalo en tandas.',
  clave_idempotencia_requerida: 'Falta la clave de la compra. Vuelve a intentar.',
  pedido_sin_items:             'El pedido no tiene productos.',
  oferta_no_publicada:          'Uno de los productos ya no está disponible.',
  item_sin_sku:                 'Uno de los productos perdió su referencia de stock.',
  sin_stock:                    'No hay stock suficiente para uno de los productos.',
  // ⚠️ Estos dos mensajes son el FALLBACK: el motor manda el suyo CON LOS
  // NÚMEROS (la referencia y los dos extremos), y la pantalla muestra ése.
  // *Un rechazo que no dice la banda obliga a adivinar por tanteo.*
  sin_referencia_de_precio:     'Todavía no está cargado el precio de referencia: tu cambio quedó guardado para aprobación.',
  fuera_de_banda:               'Ese precio queda fuera del rango que puedes mover: quedó guardado para aprobación.',
  lote_requerido:               'Falta registrar el lote de los productos.',
  sin_acceso_a_mascota:         'No tienes acceso a esa mascota.',
  senal_no_existe:              'Esa señal no existe.',
  senal_inactiva:               'Esa señal está apagada.',
  // 🔴 HONESTIDAD, NO EXCUSA: el vendedor no cargó su regla de envío. La app
  //    no inventa un costo ni dice "error"; dice que no se puede calcular.
  sin_regla_envio:              'Todavía no podemos calcular el envío para este vendedor.',
  tipo_regla_sin_motor:         'Todavía no podemos calcular el envío para este vendedor.',
  bodega_no_encontrada:         'No encontramos desde dónde sale este pedido.',
  exclusion_no_verificable:     'No pudimos revisar las alergias de tu mascota. Mejor no te mostramos nada.',
  mascota_sin_perfil:           'Todavía no sabemos lo suficiente de tu mascota.',
  // 🔴 NO DICE «ERROR»: dice que el producto existe y que el problema es la
  //    dirección. Son dos noticias distintas y solo una es accionable.
  fuera_de_cobertura:           'Todavía no entregamos en esa ciudad.',
  destino_no_declarado:         'Necesitamos saber a dónde lo enviamos.',
  // S96 · repartidor y evidencia
  repartidor_invalido:          'Ese repartidor no es de tu equipo o está inactivo.',
  repartidor_no_existe:         'No encontramos ese repartidor.',
  no_sos_el_repartidor_asignado:'Este envío está asignado a otra persona.',
  no_podes_operar_este_envio:   'No tienes permiso sobre este envío.',
  envio_no_existe:              'Este pedido no tiene envío todavía.',
  codigo_incorrecto:            'El código no coincide. Pedile a la familia el código de su pedido.',
  foto_requerida:               'La entrega en puerta se cierra con su foto.',
  retiro_no_se_despacha:        'Este pedido es de retiro en tienda: se entrega en el mostrador.',
  retiro_es_del_mostrador:      'Un retiro lo entrega el vendedor en el local.',
  pedido_sin_direccion:         'El pedido no tiene dirección de entrega.',
  nombre_requerido:             'Falta el nombre.',
  documento_requerido:          'Falta el documento del repartidor.',
  actor_repartidor_no_invocable:'Ese movimiento va por las acciones del repartidor.',
  // S96 · destino y reclamo
  mascota_sin_acceso:           'Esa mascota no es de tu familia.',
  destino_contradictorio:       'Un producto no puede ser donación y de una mascota a la vez.',
  no_es_tu_compra:              'Esta compra no es tuya.',
  donacion_no_se_ata:           'Una donación no se asigna a una mascota.',
  item_ya_atado:                'Este producto ya tiene su mascota.',
  item_no_existe:               'No encontramos ese producto de la compra.',
  codigo_invalido:              'Ese código no corresponde a ninguna compra.',
  compra_ya_reclamada:          'Esta compra ya fue reclamada.',
  codigo_expirado:              'Ese código ya venció.',
  venta_sin_items:              'La venta no tiene productos.',
  sku_invalido:                 'Uno de los productos no es de tu catálogo.',
  stock_insuficiente:           'El inventario no alcanza. Ajustá el stock con su motivo.',
  // S96 · cupo, turnos y fecha
  metodo_entrega_invalido:      'Ese método de entrega no existe.',
  sin_turnos_de_entrega:        'Este vendedor todavía no declaró sus horarios de entrega.',
  sin_cupo_ese_dia:             'Ese día no hay capacidad de reparto. Elige otro.',
  sin_capacidad_de_reparto:     'Este vendedor no tiene reparto disponible por ahora.',
  fecha_programada_invalida:    'La fecha tiene que ser un día futuro.',
  servicio_envio_inactivo:      'Ese tipo de entrega todavía no está disponible.',
  servicio_envio_desconocido:   'Ese tipo de entrega no existe.',
  capacidad_invalida:           'La capacidad tiene que ser mayor a cero.',
  recurso_no_existe:            'No encontramos ese recurso de reparto.',
  // S96 · recurrencia
  cadencia_invalida:            'Elige una frecuencia o un día del mes, no los dos.',
  recurrencia_sin_items:        'La compra recurrente no tiene productos.',
  recurrencia_no_existe:        'No encontramos esa compra recurrente.',
  no_es_tu_recurrencia:         'Esa compra recurrente no es tuya.',
  pasarela_no_afiliada:         'El cobro automático se activa cuando esté el medio de pago.',
  composicion_estado_invalido:  'Ese estado de composición no existe.',
  solo_epetplace_verifica:      'Verificar una composición es trabajo del equipo de e-PetPlace.',
  composicion_presente_no_puede_ser_ausente: 'Este producto tiene composición declarada: no se puede marcar como sin composición.',
  no_podes_tocar_este_producto: 'Este producto no es de tu catálogo.',
  producto_no_existe:           'No encontramos ese producto.',
  alergenos_requeridos:         'Falta decir qué alérgenos se entendieron.',
  // S96 · track del reparto — el fuera-de-ventana NO es error del repartidor:
  // el flush llegó con el envío ya cerrado y se descarta a propósito.
  track_fuera_de_ventana:       'El recorrido solo se registra mientras vas hacia la casa.',
  puntos_invalidos:             'El recorrido llegó con datos inválidos.',
  track_excede_limite:          'El recorrido alcanzó su límite de puntos.',
  // ── S98 · la identidad del repartidor ────────────────────────────────────
  // Dice QUÉ pasó y QUÉ hacer. La del documento repetido nombra que hay OTRA
  // ficha, porque sin eso la persona corrige el número una y otra vez.
  documento_en_uso:             'Otro repartidor de tu equipo ya tiene ese documento.',
  telefono_invalido:            'El teléfono necesita su código de país.',
  whatsapp_invalido:            'El WhatsApp necesita su código de país.',
  tipo_documento_invalido:      'Ese tipo de documento no está disponible.',
  // No nombra el largo esperado a propósito: depende del tipo elegido, y una
  // voz que dijera «diez dígitos» mentiría para RUC y pasaporte.
  documento_no_coincide_con_tipo:'El número no coincide con el tipo de documento que elegiste.',
  tipo_vehiculo_invalido:       'El vehículo tiene que ser moto o carro.',
  placa_requerida:              'Falta la placa del vehículo.',
  vehiculo_tope_alcanzado:      'Cada repartidor puede tener hasta dos vehículos.',
  vehiculo_no_existe:           'Ese vehículo ya no está.',
  // Dicen POR QUÉ hace falta, no solo que falta: son dos campos que no se ven
  // obligatorios —la foto vive lejos del botón, el WhatsApp parece opcional
  // porque el teléfono de arriba lo es— y un «falta X» a secas manda a adivinar.
  foto_persona_requerida:       'Falta la foto de la persona: es obligatoria para registrarla.',
  whatsapp_requerido:           'Falta el WhatsApp: es por donde se le escribe cuando un pedido no llega.',
  datos_inconsistentes:         'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:            'Ocurrió un error inesperado. Prueba de nuevo.',
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
  // 🔴 D-827 EN SU PUERTA MÁS CARA (S99-A): el motor AHORA LO DICE. El trigger
  // del saldo rebota `stock_insuficiente: quedan N y el movimiento pide M`
  // ANTES de chocar contra el CHECK — así la última pantalla de una compra
  // puede decir «ya no queda» en vez de «algo salió mal».
  if (raw.startsWith('stock_insuficiente')) return 'sin_stock';
  if (raw.startsWith('reserva_insuficiente')) return 'sin_stock';
  // Y el CHECK queda de RED, no de camino: si algún día un escritor nuevo
  // saltea el trigger, el texto de constraint sigue teniendo traducción.
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
