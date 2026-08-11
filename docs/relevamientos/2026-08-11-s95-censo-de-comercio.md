# CENSO DEL SUBSISTEMA DE COMERCIO VIVO — S95-B (11 Ago 2026)

> **Qué es esto.** El terreno sobre el que se va a escribir el esqueleto de la
> despensa (`MODELO_DESPENSA` v2.0 §3.3). **B0.5 del arranque S95: crear una
> tabla al lado de una que ya existe es el peor resultado posible.**
>
> **SOLO LECTURA.** Cero DDL, cero migraciones, cero cambios de datos.
>
> **Regla R5 rige el documento entero: lo que no está medido no se afirma.**
> Todo número de acá salió de una consulta contra la base linkeada el
> 11-ago-2026, o de un grep sobre el árbol. Lo que no se pudo medir está
> declarado en §7.
>
> **⚠️ LÍMITE DE ALCANCE, declarado arriba porque cambia cómo se leen los
> greps:** este censo mira **el monorepo**. El portal admin vive en otro repo
> y las webs del legado comparten esta misma base. **«Cero consumidores en el
> monorepo» NO es «cero consumidores».**

---

## 1 · El subsistema — y la primera corrección: no son 16 tablas

El censo de S94-A dijo «16 tablas de comercio». **Medido de nuevo, ese número
está mal por los dos lados.**

**Dos de las 16 NO son de comercio** — entraron por coincidencia de nombre y
son del motor de servicios:

| Tabla | Qué es realmente | Filas |
|---|---|---|
| `cat_productos_oficio` | Catálogo de productos que **el prestador usa sobre la mascota durante el servicio**. Su propio comentario lo dice: *"NO es catalogo de retail/VTEX"* | 5 |
| `evento_grooming_productos_consumidos` | Insumos consumidos en una sesión de grooming (S27) | 0 |

**Y faltaban ocho**, que aparecieron siguiendo las FKs entrantes de `pedidos`:
`envios`, `envio_eventos`, `facturas`, `devoluciones`, `cupones`,
`cupon_usos`, `checkout_sesiones`, `tickets_soporte` — más `wishlist`,
`lista_espera` y `planes_nutricion` colgando de `productos`.

**La superficie real es de ~24 tablas**, y es un e-commerce completo de
legado, no un esqueleto.

### 1.1 Inventario con filas reales

| Tabla | Propósito aparente | Filas | Veredicto |
|---|---|---:|---|
| `pedidos` | Cabecera de pedido, con `items` en JSONB | **137** | **SE ENMIENDA** |
| `pedido_items` | Ítems normalizados por seller. Su comentario: *"reemplaza gradualmente el campo JSONB"* | 0 | **SIRVE TAL CUAL** |
| `productos` | Catálogo de retail | 0 | **SE ENMIENDA** |
| `seller_perfil` | Perfil del vendedor, 42 columnas | 0 | **SE ENMIENDA** |
| `seller_inventario` | Stock y precio por seller × producto | 0 | **SIRVE TAL CUAL** |
| `seller_comisiones` | Take rate por seller, con jerarquía producto > categoría > global | **2** | **SE ENMIENDA** (ver §4) |
| `seller_liquidaciones` | Liquidación por período | 3 | **SE ENMIENDA** |
| `liquidacion_pedidos` | Puente liquidación ↔ pedido | 0 | **SIRVE TAL CUAL** |
| `seller_documentos` | Cédula, RUC, cuenta bancaria | 0 | **SE JUBILA** |
| `seller_reglas_asignacion` | Motor de asignación multi-seller por país | 1 | **SE JUBILA** |
| `mensajes_admin_seller` | Mensajería interna | 1 | **SE JUBILA** |
| `pedidos_recurrentes` | Autoship con cron y token guardado | 0 | **SE JUBILA** |
| `resenas_productos` | Reseñas | 0 | **SE JUBILA** |
| `productos_comerciales` | Catálogo de lo que **la plataforma** le vende a sus actores | 0 | **SIRVE TAL CUAL** (no es despensa) |
| `envios` · `envio_eventos` | Despacho, tracking, costo | 5 · n/m | **SE ENMIENDA** |
| `facturas` | Facturación con IVA desglosado | 0 | **SE ENMIENDA** |
| `devoluciones` | Devoluciones con monto de reembolso | 5 | **SE ENMIENDA** |
| `cupones` · `cupon_usos` | Descuentos | 1 · 0 | **SE JUBILA** |
| `checkout_sesiones` | Sesión de checkout | 0 | **SE JUBILA** |
| `wishlist` · `lista_espera` · `planes_nutricion` | Colgados de `productos` | 0 · 0 · 0 | **SE JUBILA** |

*Los veredictos de arriba son propuesta de este censo, no decisión. La mesa
los firma.*

### 1.2 RLS — activa en todas, y esa es la única defensa

**Las 16 tablas tienen `rowsecurity = true`. Ninguna tiene `FORCE`.**

**🔴 Y acá está el hallazgo de seguridad del censo:** medido sobre
`information_schema.role_table_grants`, **`anon` tiene
`SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` sobre TODAS
estas tablas** — igual que `authenticated`. *Es el patrón que S92 ya había
encontrado en el resto de la base: los grants son anchos y **la RLS es la
única puerta**.* No es novedad de arquitectura; es contexto obligatorio para
leer las policies que siguen.

**37 policies. 14 son `ALL`** — deuda por definición, aunque **13 de esas 14
gatean por `is_admin()` o por pertenencia**, que es el patrón de la casa:

| Tabla | Policy ALL | Predicado |
|---|---|---|
| `liquidacion_pedidos` · `mensajes_admin_seller` · `pedido_items` · `pedidos_recurrentes` · `productos` · `productos_comerciales` · `seller_comisiones` · `seller_inventario` · `seller_liquidaciones` · `seller_reglas_asignacion` | `*_admin` | `is_admin()` |
| `pedidos_recurrentes` | `recurrentes_owner` | `user_id = auth.uid()` |
| `seller_perfil` | `sp_own` | `user_id = auth.uid() OR is_admin()` |
| `seller_documentos` | `sd_own` | `seller_id IN (SELECT id FROM seller_perfil WHERE user_id = auth.uid()) OR is_admin()` |
| `seller_inventario` | `inventario_seller_own` | `seller_id = auth.uid()` |

**🔴 Las tres policies que hay que mirar antes de construir:**

**① `pedidos` acepta INSERT de cualquiera.** Dos policies de INSERT con rol
`{public}`:

```
"Guest pedidos insert"  CHECK: (user_id IS NULL)
"pedidos_insert"        CHECK: (auth.uid() = user_id) OR (user_id IS NULL AND guest_email IS NOT NULL)
```

Con el grant de INSERT a `anon`, **cualquiera con la anon key —que viaja en el
bundle— puede crear filas en `pedidos`** poniendo `user_id` en NULL. Hoy es
inofensivo porque nada lee esa tabla; **el día que la despensa la use, es una
puerta de escritura anónima sobre pedidos.**

**② `productos` es legible por el mundo:** `productos_public_read`,
`SELECT`, rol `{public}`, `USING (true)`. Con 0 filas no filtra nada hoy.
*Para una vitrina pública probablemente sea lo deseado — pero es una decisión
que hay que tomar, no un default que se hereda.*

**③ `pedidos_select_guest`** tiene `USING (false)` para `anon`: **es una
policy muerta** que no concede nada. No rompe; confunde.

### 1.3 Última escritura

`pedidos`: **1-feb-2026 → 2-may-2026**. `seller_comisiones`: 2-may-2026.
**Nada del subsistema se escribió después del 2 de mayo de 2026** — más de
tres meses de quietud.

### 1.4 🔴 Cero consumidores en el monorepo

Grep sobre `apps/`, `packages/` y `supabase/functions/`, excluyendo
`database.types.ts` (que es generado):

| Qué se buscó | Total | **Vivo** |
|---|---:|---:|
| `.from('<tabla de comercio>')` — 20 tablas | 0 | **0** |
| Columnas `vtex_*` | 36 | **0** |
| `take_rate_pct` / `comision_pct` | 12 | **0** |

**Todas las referencias están en los tipos generados.** Las dos únicas
menciones en código son **comentarios que aclaran que NO se usa** —
`como-te-ven.tsx:193` y `FichaPrestador.tsx:40`, ambos diciendo *"`seller_perfil`,
otra tabla y otro actor"*.

⚠️ **Con el límite del encabezado:** esto mide el monorepo. **El portal admin
y las webs del legado no se midieron y comparten esta base.** Que el monorepo
no lo toque no prueba que nadie lo toque.

---

## 2 · Las columnas `vtex_*` — las ocho, todas vacías

| Columna | Tipo | Filas con valor |
|---|---|---:|
| `productos.vtex_product_id` | text (UNIQUE) | **0** |
| `productos.vtex_sku_id` | text | **0** |
| `productos.vtex_sincronizado_en` | timestamptz | **0** |
| `pedidos.vtex_order_id` | text | **0** de 137 |
| `seller_perfil.vtex_seller_id` | text (UNIQUE) | **0** |
| `seller_perfil.vtex_trade_policy_id` | text | **0** |
| `seller_perfil.vtex_app_key_ref` | text | **0** |
| `seller_perfil.vtex_estado_sync` | text (CHECK) | **0** |

*(`vtex_app_token_ref`, `vtex_ultima_sync`, `vtex_fulfillment_url` y
`vtex_sync_error` completan el juego; todas en `seller_perfil` y todas vacías.)*

**Cero valores, cero lecturas, cero escrituras.** La `Decisión J` del
financiero decía *"preparada en schema, sin compromiso operativo"* — **el dato
le da la razón: nunca se usaron.**

**Veredicto: SE JUBILAN.** Con dos notas: arrastran dos constraints
(`productos_vtex_product_id_key`, `seller_perfil_vtex_seller_id_key`, ambos
UNIQUE) y un índice (`idx_seller_perfil_vtex_sync`), y su borrado **no es
urgente** — no molestan a nadie. *Es limpieza, no deuda.*

---

## 3 · `producto_asignacion` — existe, y está vacío

Su fila en `cat_tipos_evento`, completa:

| Campo | Valor |
|---|---|
| `codigo` | `producto_asignacion` |
| `nombre` | «Producto asignado» |
| `descripcion` | «Producto entregado/asignado a la mascota (alimento, suplemento, etc)» |
| `eje_jtbd` | **`alimentacion`** |
| `es_mvp` | **true** |
| `es_clinico` | false |
| `activo` | true · `deprecado` false |
| `propaga_a_perfil` | **true** |
| `puede_ser_raiz` | true · `puede_ser_subevento` **false** |
| **`tabla_tipada`** | **`null`** |
| `visibilidad_default` | `{}` (vacío) |
| creado | 11-may-2026 |

**Cuántos eventos hay: CERO.** Para contexto, los tipos vivos son
`cita_servicio` 148 · `hito_narrativo` 52 · `vacuna_aplicada` 32 ·
`atencion_paseo_registrada` 29.

**No hay tabla tipada de detalle** (`tabla_tipada` es NULL y no existe ninguna
`evento_*producto*`). ⇒ **el esqueleto tiene que decidir si la crea o si el
detalle vive en `datos` jsonb.** No hay forma real que copiar: **sin filas, no
hay forma que medir.**

### 3.1 `procedencia` — tres valores, y mayormente NULL

```
CHECK (procedencia = ANY (ARRAY[
  'declarado_por_familia', 'verificado_por_prestador', 'declarado_por_prestador'
]))
```

**Es `text` NULLABLE con CHECK**, no enum. Y el reparto real:

| Valor | Eventos |
|---|---:|
| **NULL** | **199** |
| `declarado_por_familia` | 84 |
| `declarado_por_prestador` | 12 |
| `verificado_por_prestador` | **0** |

🔴 **Dos cosas que el esqueleto tiene que saber:** **la procedencia es
opcional y el 67 % de los eventos no la declara** — así que
`MODELO_DESPENSA` §7.2 («porta su procedencia de nacimiento») **exige
NOT NULL o un default, y hoy ninguno existe**. Y **`verificado_por_prestador`
sigue sin un solo productor**, tal como el canon venía diciendo.

Hay un trigger relacionado: `trg_eventos_procedencia_clinica`.

---

## 4 · D-748 — y aparece un TERCER número de comisión

Las dos filas de `seller_comisiones`, completas:

| seller_id | tipo | categoría | take_rate_pct | es_override | activo | country_code | creada |
|---|---|---|---:|---|---|---|---|
| `8960f828…ba297` | `global` | — | **20.00** | true | true | NULL | 2-may-2026 07:40:28 |
| `8960f828…ba297` | `categoria` | `Alimentos` | **20.00** | true | true | NULL | 2-may-2026 07:40:57 |

**El seller_id apunta a `profiles` y existe ahí (1 fila).** No existe en
`seller_perfil` — ni por `id` ni por `user_id`, y es coherente: **el FK de
`seller_comisiones.seller_id` va a `profiles`, no a `seller_perfil`.**

> **🔴 Y acá el censo encontró lo que nadie fue a buscar: hay TRES números de
> comisión vivos a la vez.**
>
> | Fuente | Valor | Estado |
> |---|---:|---|
> | `MODELO_DESPENSA` §1.2 (firmado) | **10 %** | letra |
> | `seller_comisiones` (2 filas activas) | **20 %** | dato vivo |
> | **`fee_configs`** — `tipo_actor='seller_productos'`, EC y CO, `activo=true`, vigente desde 1-ene-2026 | **14 %** | **dato vivo, y es el motor real** |
>
> **El 14 % es el más grave de los tres**, porque `fee_configs` es la tabla que
> el motor financiero **sí** consulta para los servicios (el 15 % del prestador
> sale de ahí). *`seller_comisiones` es una tabla del legado sin consumidores;
> `fee_configs` es infraestructura viva con un valor de seller cargado.*

**¿La comisión es parámetro o constante?** Medido: **es parámetro**, en dos
tablas distintas, y **ninguna constante en código** — el grep de
`take_rate_pct|comision_pct` da 12 hits, los 12 en tipos generados. *El riesgo
no es una constante escondida: es que hay dos tablas que dicen cosas
distintas y el esqueleto tiene que elegir cuál manda.*

---

## 5 · D-749 — los 137 pedidos NO son cabeceras huérfanas

> **🔴 CORRECCIÓN A MI PROPIO CENSO DE S94-A.** Ahí reporté *"137 cabeceras
> huérfanas con `pedido_items` en cero"* y concluí que eran pedidos sin ítems.
> **Era falso, y el error fue de instrumento:** medí `pedido_items`, que es la
> tabla **nueva** que —según su propio comentario— *"reemplaza gradualmente el
> campo JSONB `pedidos.items`"*. **Los ítems nunca estuvieron ahí: viven en el
> JSONB.**

Lo medido ahora:

| Métrica | Valor |
|---|---|
| Filas | **137** · 1-feb-2026 → 2-may-2026 |
| **Con ítems en `items` jsonb** | **135** (2 con `[]`, 0 con NULL) |
| Con `user_id` | 107 · con `guest_email` 47 |
| **Con `kushki_charge_id`** | **30** |
| **Con `pagado_en`** | **35** |
| Con `vtex_order_id` | **0** |

Por estado, con su plata:

| Estado | Pedidos | Suma de `total` |
|---|---:|---:|
| `confirmado` | 102 | 4 794,16 |
| `pagado` | 31 | 2 828,46 |
| `enviado` | 2 | 154,99 |
| `entregado` | 1 | 25,00 |
| `en_preparacion` | 1 | 39,98 |
| **Total** | **137** | **≈ 7 842** |

**FKs entrantes con filas reales:** `devoluciones` **5** · `envios` **5**.
(`cupon_usos`, `facturas`, `checkout_sesiones`, `resenas_productos`: 0.)

> **¿Borrables o hay que marcarlos?** El dato dice: **no son borrables sin
> decisión.** Hay **35 pedidos marcados como pagados y 30 con un cargo de
> Kushki asociado**, más 5 devoluciones y 5 envíos que los referencian con
> `ON DELETE RESTRICT` — *o sea que la base ya se niega a borrarlos y tiene
> razón*.
>
> *Un pedido con `pagado_en` y `kushki_charge_id` no es basura de prototipo:
> es un registro de que alguien cobró algo.* **Si son de prueba, hay que
> probarlo antes de borrar; si son reales, no se borran nunca.** Esa
> verificación no la puede hacer este censo — necesita saber si esos cargos
> existieron de verdad en Kushki, y eso es del founder.
>
> **Recomendación de este censo: MARCAR, no borrar** — el precedente de las 64
> sondas de S92 aplica exactamente.

---

## 6 · Lo que el esqueleto va a necesitar enganchar

### 6.1 `cuentas_comerciales` y los roles — **existe y sirve**

20 columnas, entre ellas `moneda`, `country_code`, `tipo_fiscal`,
`identificacion_fiscal`, `datos_bancarios` jsonb, `kushki_subaccount_id`,
`estado`, `saldo_arrastre`.

**Los roles viven en `cuenta_roles`** (`cuenta_comercial_id` + `tipo_actor` +
`estado`). El enum:

```
tipo_actor_enum = seller_productos · prestador_servicios · refugio ·
                  criadero · aseguradora · plataforma_directa · otro
```

🔴 **`seller_productos` EXISTE como valor del enum** — la decisión de app
única de `MODELO_DESPENSA` §8 **no necesita tocar el enum**. Pero **hay 0
filas con ese rol**: las 6 filas de `cuenta_roles` son todas
`prestador_servicios`.

**`seller_perfil` existe** (0 filas, 42 columnas) y **ya tiene
`cuenta_comercial_id` NOT NULL con FK RESTRICT** a `cuentas_comerciales`. *El
enganche que §8 pide ya está construido y nunca se usó.*

⚠️ **Inconsistencia de modelo que el esqueleto tiene que resolver: `seller_id`
significa dos cosas distintas.** FK a `profiles` en `seller_comisiones`,
`seller_inventario`, `productos`, `pedido_items`, `seller_liquidaciones`,
`envios`; FK a `seller_perfil` en `seller_documentos`. **Las policies siguen
cada una a su FK, así que ninguna está rota — pero el nombre miente en la
mitad de los casos.**

### 6.2 `direcciones_guardadas` — **existe y sirve para entrega**

14 columnas: `user_id`, `country_code`, `alias`, `nombre_receptor`,
`telefono`, `direccion`, `ciudad`, `sector`, `referencias`, `lat`, `lon`,
`es_principal`. **2 filas.**

**Veredicto: SIRVE TAL CUAL** para dirección de entrega. Tiene todo lo que un
despacho necesita, incluido receptor y referencias. *Y hay precedente de cómo
usarla: D-339 hizo snapshot de la dirección **en la cita** en vez de referenciarla
— el pedido debería hacer lo mismo, porque una dirección editada después no
puede cambiar a dónde se entregó algo.*

### 6.3 El lado financiero — **existe, es rico, y hay que entrar por su puerta**

| Tabla | Qué |
|---|---|
| `eventos_economicos` | **27 columnas, 36 filas.** El ledger: `monto_bruto`, `monto_kushki_fee`, `monto_plataforma`, `monto_payout`, `fee_config_id`, `fee_calculo_detalle` jsonb, `origen_tipo`+`origen_id`, `fecha_devengo`, `fecha_cobro_kushki`, `reversado_por_evento_id` |
| `fee_configs` (+ `_historial`) | **6 seeds.** Incluye **`seller_productos` EC y CO al 14 %** con `tipo_origen='pedido'` |
| `liquidaciones` · `liquidacion_eventos` | Liquidación del motor de servicios |
| `seller_liquidaciones` · `liquidacion_pedidos` | Liquidación **paralela** del legado de comercio |

🔴 **Hay DOS sistemas de liquidación en la misma base.** El de servicios
(`liquidaciones` + `liquidacion_eventos` colgando de `eventos_economicos`) y
el del legado de comercio (`seller_liquidaciones` + `liquidacion_pedidos`
colgando de `pedidos`). **`MODELO_DESPENSA` §3.4 dice que el pedido no comparte
tabla con la cita — pero no dice nada de la liquidación**, y acá el esqueleto
tiene que elegir: **entrar por `eventos_economicos` (la puerta que el motor de
servicios ya usa, con `origen_tipo='pedido'` ya previsto en `fee_configs`) o
revivir la vía paralela.** *Este censo no lo decide, pero sí lo señala: la
primera opción es la que respeta «entrar por la misma puerta, no abrir otra».*

### 6.4 Pagos — **no existe nada, salvo columnas en `pedidos`**

No hay tabla de intento de pago, ni de transacción, ni de webhook. Lo único:

- **`pedidos`** tiene `kushki_token`, `kushki_charge_id`, `kushki_status`
  (CHECK: pending/approved/declined/failed/refunded), `kushki_response` jsonb,
  `pagado_en`.
- **`checkout_sesiones`** existe con `subtotal`/`total` — **0 filas**.
- `historial_pagos_prime` (de Prime, otro frente).

**Veredicto: hay que construirlo.** Y el patrón de columnas de `pedidos` es
**por proveedor** (`kushki_*`), lo que envejece mal si la pasarela cambia.

### 6.5 Impuestos — **hay más de lo esperado**

- **`country_config.iva_pct`** — numeric, por país. **La tasa ya es dato, no
  constante.**
- **`facturas`** con `subtotal_0`, `subtotal_12`, **`subtotal_15`**,
  `iva_valor`, `descuento_total`, `total`. *Los tres subtotales por tasa son
  la historia del IVA ecuatoriano (0 %, 12 %, 15 %) hecha columna.*
- `liquidaciones.retenciones_fiscales` jsonb.

**Veredicto: SE ENMIENDA.** La infraestructura fiscal existe; `facturas` tiene
0 filas y nunca se usó.

### 6.6 Logística — **🔴 la sospecha del mandato era incorrecta: SÍ existe**

| Tabla | Qué | Filas |
|---|---|---:|
| **`envios`** | 25 columnas: `transportista`, `tracking_code`, `tracking_url`, `estado`, origen y destino (ciudad, dirección, referencia), ventana de entrega, `recogido_en`, `entregado_en`, `intentos_entrega`, **`costo_envio`**, **`pagado_por`** | **5** |
| `envio_eventos` | Historial de estados del envío | n/m |
| `zonas_cobertura` | Cobertura de envío | n/m |
| `prestador_zonas` · `cat_zonas_trabajo_grooming` | **De servicios, no de comercio** | — |

**`envios.costo_envio` y `envios.pagado_por` son exactamente las dos columnas
que D-754 (el criterio de flete) necesita.** *El modelo de flete ya existe;
lo que falta es la política de precio, que es la llamada al vendedor.*

### 6.7 Idempotencia — **no existe patrón que copiar**

Búsqueda de columnas `idempot*`, `request_id`, `external_id`, `dedupe`:
**cero resultados en toda la base.**

**Veredicto: hay que inventarlo.** `MODELO_DESPENSA` §9.3 pide cola y backoff
desde el día uno; **no hay precedente en casa del que copiar la forma.**
*(Nota: existe dedupe en el motor de notificaciones —el canon lo menciona en
S69— pero no por columna con estos nombres; su forma exacta no se midió acá.)*

### 6.8 🔴 Loyalty — la verificación que la letra exige, MEDIDA

`MODELO_LOYALTY` §5 dice que la compra **no** debe alimentar el motor de
puntos. **Medido, no asumido:**

| Medición | Resultado |
|---|---|
| Tablas | `logros`, `logros_usuario`, `loyalty_b2b`, `puntos_usuario`, `transacciones_puntos` |
| Filas | `transacciones_puntos` **4** · `puntos_usuario` **1** |
| **Funciones que tocan `transacciones_puntos`** | **UNA: `otorgar_puntos`** (SECURITY DEFINER, VOLATILE) |
| **Funciones que llaman a `otorgar_puntos`** | **CERO** |
| **Triggers sobre `pedidos`** | **CERO** |
| Triggers sobre `pedido_items` | 1, y es `update_updated_at` |
| Triggers sobre `eventos_mascota` | 5, ninguno toca puntos |

> ✅ **NO existe hoy ningún trigger, función ni camino que conecte una compra o
> un pedido con el motor de puntos.** La letra se cumple **por ausencia de
> productor**, no por un guard que lo impida.
>
> 🔴 **Y esa distinción importa para el esqueleto:** lo que protege §5 hoy es
> que *nadie lo cableó*, no que *no se pueda cablear*. `otorgar_puntos` es
> DEFINER y —hallazgo heredado de **D-314**— **ejecutable por `anon`/PUBLIC sin
> gate**. **El esqueleto debe dejar la desconexión escrita como invariante
> verificable, no confiar en que siga sin llamarse.**

---

## 7 · Los patrones de la casa que el esqueleto debe imitar

**Nombres.** Tablas en **plural** (`pedidos`, `productos`, `eventos_mascota`),
salvo las de perfil/configuración en singular (`seller_perfil`,
`country_config`). FKs con sufijo **`_id`**, sin excepción medida. **Español**
en tablas, columnas y valores de CHECK. Catálogos con prefijo **`cat_`** —
**31 en la base**. Vistas con **`v_`**. Triggers `trg_*` sobre funciones
`_trg_*`.

**Append-only, cómo se hace realmente.** `eventos_economicos` tiene **solo dos
policies: `ALL` para admin (`is_admin()`) y `SELECT` para el dueño.** No hay
policy de INSERT ni UPDATE para `authenticated`. ⇒ **la inmutabilidad no la da
un trigger: la da la ausencia de policy de escritura**, y todo lo que escribe
entra por funciones `SECURITY DEFINER`. *Es la «puerta única» del canon vista
desde la RLS.* `eventos_mascota` sigue el mismo molde (INSERT y SELECT, sin
UPDATE ni DELETE) y agrega la corrección por evento nuevo.

**La forma canónica de una policy — dos ejemplos reales:**

```
-- eventos_mascota · INSERT (el más estricto de la casa)
WITH CHECK (
  user_tiene_acceso_a_mascota(mascota_id)
  AND (creado_por_user_id IS NULL OR creado_por_user_id = auth.uid())
  AND (prestador_id IS NULL OR user_puede_acceder_prestador(prestador_id))
  AND (empleado_id IS NULL OR EXISTS (SELECT 1 FROM prestador_empleados pe
        WHERE pe.id = eventos_mascota.empleado_id AND pe.user_id = auth.uid()
          AND pe.prestador_id = eventos_mascota.prestador_id AND pe.activo))
  AND (prestador_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM cat_tipos_evento cte
                      WHERE cte.codigo = eventos_mascota.tipo AND cte.es_clinico)
       OR user_puede_escribir_clinico(prestador_id, mascota_id))
)

-- prestador_documentos · ALL (el molde corto)
USING (user_gestiona_prestador(prestador_id))
WITH CHECK (user_gestiona_prestador(prestador_id))
```

**La lección de forma: el predicado se compone de HELPERS con nombre
(`user_tiene_acceso_a_mascota`, `user_gestiona_prestador`), no de subqueries
inline.** Es lo que D-700 vino a pagar y lo que el esqueleto debe nacer
cumpliendo.

**Moneda y monto.** **`numeric(10,2)`** es el estándar de la casa para precios
y totales; **`numeric(14,2)`** para los montos del ledger
(`eventos_economicos.monto_*`); `numeric(8,2)` en dos casos menores. **Hay
columna `moneda`** en `cuentas_comerciales`, `eventos_economicos`,
`liquidaciones` y `productos_comerciales` — **pero NO en `pedidos` ni en
`productos`.** *El esqueleto debe llevarla: `MODELO_DESPENSA` §1.4 fija
USD/Ecuador hoy, y una tabla de precios sin moneda es una decisión que se paga
el día que haya un segundo país.* ⚠️ Dos casos sin precisión declarada
(`evento_cita_servicio.precio`, `donaciones.monto`) — numeric sin límite; no
imitar.

**Catálogos `cat_*`.** El molde es `cat_tipos_evento`: `codigo` text como
clave semántica, `nombre` y `descripcion` para voz, banderas
(`activo`, `es_mvp`, `deprecado` + `deprecado_motivo`, `reemplazado_por`),
metadata de comportamiento (`propaga_a_perfil`, `puede_ser_raiz`) y
`tabla_tipada` apuntando al detalle. **Un catálogo de la casa sabe morir:
tiene `deprecado` y `reemplazado_por`.**

---

## 8 · Tabla de veredictos — una línea por objeto

| Objeto | Veredicto | Motivo en una línea |
|---|---|---|
| `pedidos` | **SE ENMIENDA** | La forma sirve, pero tiene INSERT anónimo, `items` en JSONB y 137 filas con plata que no se pueden borrar |
| `pedido_items` | **SIRVE TAL CUAL** | Es la normalización que el legado dejó a medias; 0 filas, sin deuda |
| `productos` | **SE ENMIENDA** | Falta separar producto canónico de oferta (§3.3) y sacar las 3 columnas `vtex_*` |
| `seller_perfil` | **SE ENMIENDA** | Ya tiene `cuenta_comercial_id`; sobran 8 columnas `vtex_*` y 42 columnas es mucho para v1 |
| `seller_inventario` | **SIRVE TAL CUAL** | Stock por seller × producto con UNIQUE y CHECKs correctos |
| `seller_comisiones` | **SE ENMIENDA** | Dos filas al 20 % contra el 10 % firmado, y compite con `fee_configs` |
| `seller_liquidaciones` · `liquidacion_pedidos` | **SE ENMIENDA** | Vía paralela al ledger; decidir si se unifica con `eventos_economicos` |
| `envios` · `envio_eventos` | **SE ENMIENDA** | Tiene `costo_envio` y `pagado_por` — es la base de D-754 |
| `facturas` | **SE ENMIENDA** | Estructura fiscal EC correcta, 0 filas |
| `devoluciones` | **SE ENMIENDA** | 5 filas reales; v1 no automatiza pero la tabla existe |
| `productos_comerciales` | **SIRVE TAL CUAL** | Es de la plataforma, no de la despensa — no confundir |
| `direcciones_guardadas` | **SIRVE TAL CUAL** | Completa para entrega; usar por snapshot, no por referencia |
| `cuentas_comerciales` · `cuenta_roles` | **SIRVE TAL CUAL** | `seller_productos` ya está en el enum |
| `eventos_economicos` · `fee_configs` | **SIRVE TAL CUAL** | Es la puerta del dinero; `tipo_origen='pedido'` ya previsto |
| `producto_asignacion` (tipo) | **SE ENMIENDA** | Existe y está vacío; falta decidir tabla tipada y hacer NOT NULL la procedencia |
| Columnas `vtex_*` (8) | **SE JUBILAN** | Cero valores, cero lecturas, cero escrituras |
| `seller_documentos` | **SE JUBILA** | El arco de documentos del prestador ya resuelve esto mejor |
| `seller_reglas_asignacion` | **SE JUBILA** | Motor multi-seller; v1 tiene un vendedor |
| `pedidos_recurrentes` | **SE JUBILA** | Suscripción está fuera de v1 (§11.2) |
| `mensajes_admin_seller` | **SE JUBILA** | Mensajería propia; el motor de notificaciones ya existe |
| `resenas_productos` · `wishlist` · `lista_espera` · `planes_nutricion` | **SE JUBILAN** | Fuera del alcance v1, 0 filas |
| `cupones` · `cupon_usos` · `checkout_sesiones` | **SE JUBILAN** | Fuera del alcance v1 |
| `cat_productos_oficio` · `evento_grooming_productos_consumidos` | **NO SON DE COMERCIO** | Del motor de servicios; entraron por coincidencia de nombre |

---

## 9 · Las tres preguntas que este censo NO pudo contestar

**① ¿Los 137 pedidos son reales o de prueba?** Hay **35 con `pagado_en` y 30
con `kushki_charge_id`**. La base no sabe si esos cargos existieron de verdad
en Kushki — **hay que mirarlo en el panel del proveedor**, y eso es del
founder. *Sin esa respuesta, D-749 no se puede resolver en ninguna dirección:
borrar puede destruir un registro de cobro, y marcar puede estar
disfrazando basura.*

**② ¿Alguien fuera del monorepo consume estas tablas?** Este censo midió
`apps/`, `packages/` y `supabase/functions/`, y dio **cero**. Pero **el portal
admin vive en otro repo** y **las webs del legado comparten esta base** — el
canon dice que el admin opera sobre el MISMO proyecto Supabase. **No pude
medir esos repos.** *Y la pregunta importa: si el admin lee `pedidos`,
«se jubila» deja de ser gratis.*

**③ ¿Cuál de los tres números de comisión manda?** Encontré 10 % firmado,
20 % en `seller_comisiones` y **14 % en `fee_configs`**. Puedo decir cuál es
la tabla que el motor consulta para servicios (`fee_configs`), pero **no puedo
decir cuál se aplicaría a un pedido de la despensa, porque no existe todavía
el código que la consultaría.** Es decisión de la mesa, no medición.

---

## 10 · Lo que este censo NO hace

1. **No autoriza construir.** Es insumo del esqueleto, no el esqueleto.
2. **No borra ni marca nada.** D-748 y D-749 siguen abiertas con su dueño.
3. **No decide los veredictos.** La columna «veredicto» es propuesta medida;
   la firma es de la mesa.
4. **No mide el portal admin ni las webs del legado** (§9.②).
