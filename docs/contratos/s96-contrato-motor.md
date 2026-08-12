# CONTRATO DEL MOTOR — S96 · pista A → pistas B, C y D

> **Estado: PUBLICADO (12-ago-2026). Desde este momento las firmas se
> CONGELAN: cambiarlas es elevación a la mesa, no un edit.**
>
> Qué es: el contrato de todo lo que la pista A construyó en S96 sobre el
> motor de la despensa — la máquina de estados con el repartidor, la entrega
> con evidencia, el destino por ítem, el cupo por recurso, el mostrador, la
> recurrencia y los cinco avisos. **La fuente de verdad de cada firma es la
> base viva** (`pg_get_functiondef`); este documento la transcribe para que
> nadie tenga que adivinarla. Juez: `scripts/s96/juez-s96.mjs` (39 verdes ·
> 1 rojo heredado de S95 declarado — las 2 jubiladas bloqueadas por vistas
> de otro frente).
>
> **La capa preferida para B/C/D es `@epetplace/api`** (los wrappers ya
> tipados de abajo). Las RPCs se documentan porque son el contrato de fondo.

---

## 0 · El recorrido, en una línea por escalón

```
cliente:    crear_pedido_despensa → iniciar_pago_pedido → [webhook] confirmar_pago_pedido
vendedor:   picking (mover) → empacar_pedido (lote+peso) → registrar_factura_pedido → despachar_pedido (ASIGNA repartidor)
repartidor: marcar_en_camino_a_destino → entregar_pedido (código+foto) | marcar_entrega_fallida
retiro:     …→ registrar_factura_pedido → entregar_pedido por el VENDEDOR (código, sin foto)
mostrador:  registrar_venta_mostrador (contra NADIE) → el cliente: reclamar_compra_mostrador
```

Los estados y transiciones son DATO (`cat_estados_pedido` ·
`cat_transiciones_pedido`). Nuevo estado: **`hacia_destino`** (narrativa
`en_camino`). Nuevo actor: **`repartidor`** — mueve SOLO por sus funciones
propias; `mover_estado_pedido` lo rechaza (`actor_repartidor_no_invocable`)
porque entregar exige evidencia y un RPC genérico no puede exigirla.
`esperando_courier` quedó APAGADO (courier = v2).

---

## 1 · Wrappers de `@epetplace/api` (la capa que consumen las pantallas)

### El vendedor (`despensa-vendedor.ts`) — pista B/C

| función | firma | notas |
|---|---|---|
| `listarPedidosDelVendedor(cuentaComercialId, limite?)` | → `PedidoDelVendedor[]` | sin cambios |
| `marcarPedidoEnPreparacion(pedidoId)` | → `{narrativa}` | escalón 1 (`picking`) |
| `empacarPedido(pedidoId, lotes, pesoRealKg?)` | → `{items_con_lote}` | escalón 2 — **exige lote por ítem** |
| **`despacharPedido(pedidoId, repartidorId)`** | → `{envio_id, codigo_verificacion, reintento}` | escalón 3 — **ASIGNA repartidor** (decisión ①). Reintento tras fallida: mismo envío, MISMO código. ☠️ `marcarPedidoDespachado` murió |
| **`entregarRetiroEnMostrador(pedidoId, codigo)`** | → `{eventos_expediente}` | escalón 4 del RETIRO (sin foto) |
| **`listarRepartidores(cuentaComercialId)`** | → `Repartidor[]` | |
| **`registrarRepartidor({cuenta_comercial_id, nombre, documento, telefono?, user_id?})`** | → `{repartidor_id, ya_existia}` | idempotente por documento |
| **`actualizarRepartidor({repartidor_id, activo?, nombre?, telefono?, user_id?})`** | → `{repartidor_id}` | |
| **`ajustarStockVendedor(skuId, cantidad, motivo)`** | → `{stock_disponible}` | motivo OBLIGATORIO (servidor) |
| **`definirRecursoReparto({cuenta_comercial_id, nombre, capacidad_por_dia, dias_operacion?, activo?})`** | → `{recurso_id}` | la capacidad es del RECURSO; upsert por nombre. `dias_operacion`: 0=Dom…6=Sáb (regla 32) |
| **`declararExcepcionRecurso({recurso_id, fecha, disponible, motivo?})`** | → ok | «el segundo repartidor no viene el domingo» |
| **`definirTurnoEntrega({cuenta_comercial_id, codigo, corte, entrega_desde, entrega_hasta, dia_offset?, orden?})`** | → `{turno_id}` | los cortes como dato; horas `'HH:MM'` |
| **`cupoRepartoDelDia(cuentaComercialId, fecha)`** | → `{capacidad, consumido, disponible}` | la cifra del techo de la lista Hoy (§2.1) |
| **`registrarVentaMostrador({cuenta_comercial_id, items})`** | → `{venta_id, codigo_reclamo, total, expira_en}` | items: `{sku_id, cantidad, lote?, fecha_vencimiento?}[]`. **Contra NADIE**; el código va en la factura (decisión ③); expira a 90 días |

### El repartidor (`despensa-repartidor.ts`, NUEVO) — pista C/D

| función | firma | notas |
|---|---|---|
| `misEntregasAsignadas()` | → `EntregaAsignada[]` | la RLS entrega SOLO sus envíos asignados. `EntregaAsignada` trae dirección, punto, referencia, instrucciones, teléfono — **cero mascota, cero pedido**: el snapshot es todo lo que la puerta necesita |
| `marcarEnCaminoADestino(envioId)` | → ok | «voy hacia acá» — dispara el aviso |
| `subirFotoEntrega(envioId, bytes, contentType?)` | → `{path}` | bucket privado `entregas`, carpeta = envío |
| `entregarConEvidencia(pedidoId, codigo, fotoPath)` | → `{eventos_expediente}` | rebotes: `codigo_incorrecto` · `foto_requerida` |
| `marcarEntregaFallida(envioId, motivo)` | → `{intentos}` | «no había nadie» — motivo obligatorio; JAMÁS deposita |

### El cliente (`despensa-pedido.ts`) — pista C

| función | cambio |
|---|---|
| `crearPedidoDespensa(input)` | **`ItemDeCompra` gana `mascota_id?` / `donacion?`** (el destino, validado por FAMILIA al comprar — `mascota_sin_acceso` si no es suya) · **`DatosDeEntrega` gana `instrucciones?`, `lat?`, `lon?`** · input gana **`metodo_entrega?: 'despacho'\|'retiro'`**, **`fecha_programada?`** (yyyy-mm-dd futuro, rebote `sin_cupo_ese_dia`), **`servicio_envio?`** (`urgente` → `servicio_envio_inactivo`). **Fuera de cobertura el pedido NO nace** (antes nacía con flete 0) |
| **`calcularPromesaDespensa({cuenta_comercial_id, fecha_programada?, servicio_envio?})`** | → `{fecha, desde, hasta, turno, programada, saltos_por_cupo}`. ☠️ `calcularPromesaEntrega` (bodega) murió con su función |
| **`obtenerCodigoEntrega(pedidoId)`** | → `{codigo, estado_envio}` — lo que la familia dice en la puerta. `null` = todavía sin envío |
| **`atarItemAMascota(itemId, mascotaId)`** | la regla general de §4: sin destino → se ata después; si ya se entregó, el evento nace en el acto |
| **`reclamarCompraMostrador(codigo, mascotaId)`** | → `{venta_id, eventos_expediente}` — el reclamo de la factura |
| **`configurarRecurrencia({…, frecuencia_dias? XOR dia_del_mes?, aviso_dias?})`** | → `{recurrencia_id, proximo_pedido_fecha}` |
| **`alternarRecurrencia(recurrenciaId, activo)`** | el interruptor de un toque |

Los códigos de error nuevos viven tipados en `_despensa-comun.ts`
(`CODIGOS_ERROR_DESPENSA`) con su voz en `MENSAJES_DESPENSA`.

---

## 2 · Las RPCs del motor (contrato de fondo — todas DEFINER, `search_path`
##     fijo, sin `anon`; errores como `RAISE EXCEPTION 'codigo: detalle'`)

| RPC | firma | quién | errores propios |
|---|---|---|---|
| `despachar_pedido` | `(p_pedido_id uuid, p_repartidor_id uuid)` | vendedor/admin | `repartidor_invalido` · `retiro_no_se_despacha` · `pedido_sin_direccion` |
| `marcar_en_camino_a_destino` | `(p_envio_id uuid)` | repartidor asignado | `no_sos_el_repartidor_asignado` · `envio_no_existe` |
| `entregar_pedido` | `(p_pedido_id uuid, p_codigo text, p_foto_path text DEFAULT NULL)` | repartidor (despacho) · vendedor (retiro) | `codigo_incorrecto` · `foto_requerida` · `retiro_es_del_mostrador` |
| `marcar_entrega_fallida` | `(p_envio_id uuid, p_motivo text)` | repartidor/vendedor | `motivo_requerido` (del motor) |
| `registrar_repartidor` | `(p_cuenta_comercial_id uuid, p_nombre text, p_documento text, p_telefono text DEFAULT NULL, p_user_id uuid DEFAULT NULL)` | vendedor/admin | `documento_requerido` · `nombre_requerido` |
| `actualizar_repartidor` | `(p_repartidor_id uuid, p_activo bool, p_nombre text, p_telefono text, p_user_id uuid)` (todos DEFAULT NULL) | vendedor/admin | `repartidor_no_existe` |
| `crear_pedido_despensa` | `(p_cuenta_comercial_id uuid, p_items jsonb, p_entrega jsonb, p_clave_idempotencia text, p_bodega_id uuid, p_metodo_entrega text DEFAULT 'despacho', p_fecha_programada date, p_servicio_envio text DEFAULT 'estandar')` | cliente | `mascota_sin_acceso` · `destino_contradictorio` · `metodo_entrega_invalido` · `sin_cupo_ese_dia` · `sin_turnos_de_entrega` · `sin_capacidad_de_reparto` · `fuera_de_cobertura` |
| `calcular_promesa_despensa` | `(p_cuenta_comercial_id uuid, p_desde timestamptz DEFAULT now(), p_fecha_programada date, p_servicio text DEFAULT 'estandar')` | STABLE, authenticated | devuelve `{ok:false, error}` en el payload |
| `cupo_reparto_del_dia` | `(p_cuenta_comercial_id uuid, p_fecha date)` | STABLE, authenticated | — |
| `definir_recurso_reparto` | `(p_cuenta_comercial_id uuid, p_nombre text, p_capacidad_por_dia int, p_dias_operacion int[], p_activo bool DEFAULT true)` | vendedor/admin | `capacidad_invalida` |
| `declarar_excepcion_recurso` | `(p_recurso_id uuid, p_fecha date, p_disponible bool, p_motivo text)` | vendedor/admin | `recurso_no_existe` |
| `definir_turno_entrega` | `(p_cuenta_comercial_id uuid, p_codigo text, p_corte time, p_entrega_desde time, p_entrega_hasta time, p_dia_offset int DEFAULT 0, p_orden int DEFAULT 1, p_zona_horaria text DEFAULT 'America/Guayaquil')` | vendedor/admin | — |
| `atar_item_a_mascota` | `(p_item_id uuid, p_mascota_id uuid)` | dueño de la compra | `no_es_tu_compra` · `donacion_no_se_ata` · `item_ya_atado` |
| `registrar_venta_mostrador` | `(p_cuenta_comercial_id uuid, p_items jsonb)` | vendedor/admin | `venta_sin_items` · `sku_invalido` · `stock_insuficiente` |
| `reclamar_compra_mostrador` | `(p_codigo text, p_mascota_id uuid)` | cliente | `codigo_invalido` · `compra_ya_reclamada` · `codigo_expirado` · `mascota_sin_acceso` |
| `configurar_recurrencia` | `(p_cuenta_comercial_id uuid, p_items jsonb, p_entrega jsonb, p_frecuencia_dias int, p_dia_del_mes int, p_aviso_dias int DEFAULT 2, p_metodo_entrega text DEFAULT 'despacho')` | cliente | `cadencia_invalida` · `recurrencia_sin_items` |
| `alternar_recurrencia` | `(p_recurrencia_id uuid, p_activo bool)` | dueño | `no_es_tu_recurrencia` |
| `adjuntar_fotos_producto` | `(p_producto_id uuid, p_imagenes jsonb)` | admin / vendedor con SKU del producto | `imagenes_invalidas`. **Forma de `imagenes` (decide D-767): array de strings, la primera es la portada; `imagen_url` se materializa con ella** |
| `ajustar_stock_vendedor` | `(p_sku_id uuid, p_cantidad int, p_motivo text)` | vendedor/admin | `motivo_requerido` · `cantidad_invalida` (S95-G2, sin cambios) |

**Solo backend (revocadas de `authenticated`):** `confirmar_pago_pedido` ·
`encolar_fotos_entrega_vencidas` · `avisar_recurrencias_proximas` ·
`ejecutar_recurrencias_vencidas` (esqueleto: rebota `pasarela_no_afiliada`
y NO crea pedidos — D-778) · `_depositar_item_en_expediente` ·
`_es_repartidor_del_pedido` · `_mover_estado_pedido`.

---

## 3 · Las reglas que las pantallas NO pueden romper (y el juez vigila)

1. **El repartidor lee UNA tabla: `envios`.** Ni catálogo, ni pedidos, ni
   una palabra de la mascota. Cerrado en policies (juez 31).
2. **El vendedor JAMÁS ve el destino del ítem** (`pedido_item_destinos` es
   del dueño — juez 33) **ni elige la mascota del mostrador** (juez 34).
3. **El evento al expediente nace SOLO de entregar, reclamar o atar** —
   jamás de una fallida, jamás al pagar (juez 13). Procedencia:
   `declarado_por_familia`, siempre.
4. **La donación jamás deposita ni toca el loyalty** (juez 3 y 13; CHECK
   `chk_destino_excluyente`).
5. **Preparado y empacado NO notifican** (juez 38). Los cinco avisos:
   `pedido_confirmado` · `pedido_en_camino` · `pedido_hacia_destino` ·
   `pedido_entregado` · `pedido_entrega_fallida` — nacen de un trigger sobre
   `pedido_estados`; la pantalla no dispara ninguno.
6. **La foto de entrega**: bucket privado `entregas`, la ven vendedor +
   equipo (+ el asignado que la subió, declarado); **la familia NO está en
   la lista** (§9.4 literal); 90 días con mecanismo (cron
   `purgar-fotos-entrega` + cola de D-731).
7. **El código de la puerta jamás viaja en una notificación** (ley de la
   pantalla bloqueada). La familia lo lee con `obtenerCodigoEntrega`.

## 4 · Seeds vivos (vendedor de pruebas)

`Moto de pruebas` (capacidad 20/día, lun-sáb) + turnos `manana` (corte
12:00 → ventana 14:00-18:00 mismo día) y `tarde` (corte 23:59 → 09:00-13:00
del día siguiente). **Sin turnos o sin recursos confirmados, el pedido de
despacho NO nace** (`sin_turnos_de_entrega` / `sin_capacidad_de_reparto`) —
es L-139, no un accidente: el vendedor se configura solo (§2.1).

## 5 · El cargador (founder — decisión ②)

`node tools/carga-catalogo/cargar.mjs <archivo.csv|.json> --cuenta <uuid>
[--admin <email> --aplicar]` — CSV **o JSON**, fotos (`fotos`: paths/URLs,
la primera es la portada), stock inicial, TANDAS de 20 filas por viaje con
reintento fila-por-fila, idempotente, ensayo por defecto. Jamás escribe una
tabla directo.

---

## 6 · ADDENDUM 12-ago (firmas founder POSTERIORES al congelado — agregan, no cambian)

> Las firmas de arriba siguen congeladas e intactas. Esto es lo que la mesa
> firmó DESPUÉS de publicado el contrato, construido por la pista A el mismo
> día. Fuente de verdad: la base viva; letra: `MODELO_DESPENSA` v2.3 §4.3/§6/§7.3/§10.

### La composición (M11 · M14 · M17)

- **`productos.composicion_estado`** — CUATRO estados verbatim:
  `'verificada' | 'declarada_sin_verificar' | 'ausente' | 'no_aplica'`
  (= `ComposicionEstado` de `@epetplace/api` = `EstadoComposicion` de
  `@epetplace/ui`). **Callan solo `verificada` y `no_aplica`** — y son dos
  silencios distintos. Viaja en `ProductoDeVitrina`, `FichaProducto` y la
  recomendación. La verificación **caduca sola** si cambia composición,
  alérgenos o mercado (trigger).
- **`productos.composicion_mercado`** — de qué mercado es la ficha (`'EC'` ·
  `'global'` · `null`). **`verificada` exige país real** (la global no
  sostiene — CHECK + rebote hablado `verificada_exige_mercado`). En
  `FichaProducto.composicion_mercado`.
- RPC **`declarar_composicion_estado(p_producto_id, p_estado DEFAULT NULL, p_mercado DEFAULT NULL)`**
  — `verificada` SOLO admin; el resto admin o vendedor con SKU. Errores:
  `composicion_estado_invalido` · `solo_epetplace_verifica` ·
  `composicion_presente_no_puede_ser_ausente` · `verificada_exige_mercado` ·
  `mercado_invalido`.

### El vocabulario de alérgenos (M15 · M16)

- **`cat_alergenos`** (23 entradas, ampliar = INSERT) +
  **`cat_alergeno_relaciones`** (`es_un` = advertencia EXACTA · `puede_ser` =
  advertencia IMPRECISA). Trigger sobre `productos.alergenos`: valida contra
  el catálogo y NORMALIZA (minúsculas). Parejas prohibidas EN EL MODELO:
  pollo/pavo/pato jamás se agrupan · insectos aparte de moluscos_crustaceos.
- Wrapper **`expandirAlergenosAVigilar(alergenos)` → `AlergenoVigilado[]`**
  (`{declarado, origen, exacta}`): la advertencia de búsqueda/ficha cruza
  `declarado` contra `producto.alergenos` y arma la voz con `exacta` —
  **false = «podría ser {origen}», jamás «contiene»; el tono NO baja.**
- `recomendarParaMascota` excluye por el conjunto EXPANDIDO y su `criterio`
  gana `alergenos_vigilados: AlergenoVigilado[]`.

### El entendimiento de §5.4 (M13 · M18)

- **`registrarEntendimientoAlergia(productoId, mascotaId, alergenos[])`** →
  `{entendimiento_id}` — tabla append-only POR ESTRUCTURA (cero policies ni
  grants de escritura; la puerta es la función, gated por
  `_user_es_familia_de_mascota`). La pantalla decide cuándo re-preguntar;
  lectura de los propios por RLS.

### El vendedor de la oferta (M12) — desbloqueante del checkout

- **`ofertas.cuenta_comercial_id` NOT NULL, DERIVADA por trigger del sku**
  (ningún escritor la estampa ni la puede errar). `ProductoDeVitrina` la trae
  como `cuenta_comercial_id: string` (no-null) y `VarianteDeProducto` como
  `cuenta_comercial_id: string | null` (+ `country_code: string | null` para
  el riel de moneda). Es el `p_cuenta_comercial_id` que exigen
  `crearPedidoDespensa` / `calcularPromesaDespensa` / `configurarRecurrencia`.

### La expiración de cabeceras (M19)

- **`expirar_pedidos_sin_pago()`** (solo backend, cron horario
  `expirar-pedidos-sin-pago`): `creado`/`esperando_pago` sin actividad por
  `app_config.pedido_sin_pago_expira_horas` (24) → `cancelado_sistema` POR LA
  MÁQUINA, liberando sus reservas por el ledger en el mismo acto. Nació la
  transición `creado → cancelado_sistema` (actor sistema) que NO EXISTÍA.
  **La guarda del cliente (beforeRemove de D) queda como cortesía: la
  garantía vive en el motor.**

### El detalle del pedido y el panel

- `DetallePedido`: cada línea gana **`destino: {mascota_id, donacion} | null`**
  (null = sin atar → ofrecer `atarItemAMascota`) y la entrega gana
  **`instrucciones`** (vuelve al leer, no solo viaja al crear).
- `SkuDelVendedor` gana **`producto_nombre` · `producto_marca` ·
  `presentacion` · `precio_publicado: number | null`** (null honesto = sin
  oferta publicada — la pantalla lo dice, no inventa precio).
- El aditivo de C (`despensa-panel-extra.ts`, 76(c)) queda **FIRMADO COMO
  ADITIVO** — revisado por contenido: lecturas bajo RLS medida, cero columnas
  de mascota. Precedente de la casa para contrato congelado.

### Reglas nuevas que las pantallas NO pueden romper

8. **Solo `verificada` y `no_aplica` callan sobre la composición** — las
   otras dos dicen su condición, en TODA superficie (juez 41).
9. **La advertencia se dispara por COMPOSICIÓN, jamás por nombre** — hay 10
   «hypoallergenic» con alérgeno común; el nombre no es una dieta de
   eliminación.
10. **La advertencia imprecisa SE DICE imprecisa y su tono NO baja**: si esa
    proteína ES pollo, le hace igual de mal (juez 47).
11. **Las RACIONES no se muestran en v1** — ni heredadas ni calculadas; manda
    la etiqueta del fabricante y el veterinario. El campo puede existir;
    ninguna superficie lo consume.

### La separación del catálogo canónico (M21 — firma founder 12-ago, tarde)

- **`proponer_producto_canonico(p_producto, p_variante)`** — SOLO e-PetPlace
  (`solo_epetplace_cura_el_catalogo`). Único escritor de `productos` +
  `producto_variantes`.
- **`proponer_sku_vendedor` se ANGOSTÓ a MAPEO** (misma firma): resuelve el
  canónico por coincidencia y rebota `producto_no_canonico` /
  `variante_no_canonica` si no existe. **Jamás escribe la ficha** (composición
  y alérgenos incluidos) **ni pisa stock**: el inicial entra por el ledger
  (`ingreso`/`carga_inicial`) y las diferencias van por
  `ajustar_stock_vendedor`. ☠️ D-780 muerta. Juez inv. 48 vigila.
- El cargador corre las DOS puertas en orden (canónico → mapeo → publicar →
  fotos → estado de composición).

### La siembra del gate (12-ago) — todo por las puertas reales, marcado

`supabase/dev/seed-gate-s96.sql`: 3 pedidos `liberado_preparacion`
(`created_by_sistema`) — despacho con mascota atada · despacho con 2 ítems
sin destino · retiro — + 1 repartidor activo («Repartidor de Pruebas») +
1 venta de mostrador con su código de reclamo. Limpieza posterior POR ID.
