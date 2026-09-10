# S115 · PISTA A — RELEVAMIENTO DE FACTURACIÓN

**Fecha:** 10-sep-2026 · **Pista:** A · **Rama:** `main`
**Punta al ABRIR:** `45029367` · **Punta al CERRAR:** `ffb15f4e`
⚠️ **`main` avanzó durante la sesión con tres commits que NO son de esta pista** (`fb07c553`, `2cf3bbc9`, `ffb15f4e` — barrido L-217 de S114). Verificado: tocaron `docs/` y un script, **cero archivos en `supabase/`, `packages/` o `apps/`** (`git diff --name-only 45029367..ffb15f4e -- supabase packages apps` → 0) ⇒ **nada de lo medido acá cambió bajo mis pies**. Mi único artefacto es este archivo, sin trackear.
**Proyecto medido:** `zyltipqscdsdsxnjclhp` · Postgres **17.6** · 333 tablas en `public`
**Mandato:** MEDIR, no construir. Cero migraciones, cero cambios de esquema, cero código. Único archivo creado: éste.

## Cómo se midió (y qué NO vale de acá)

- Todo número sale del **objeto**: catálogo de Postgres (`pg_class`, `pg_proc`, `pg_constraint`, `information_schema`), el listado de edges desplegadas por CLI, y el código de las edges en disco. **Ningún dato salió del canon.**
- Cada cero lleva su **control positivo** al lado. Un cero sin positivo es un instrumento sin calibrar.
- Los comandos van citados. Todos son de **lectura**.
- **Estado del árbol al abrir:** tres archivos modificados que **no son de esta pista** (`CLAUDE.md`, `docs/loop/S114-CIERRE.md`, `docs/loop/buzon/S114-A-PIDE-CIERRE-A-CADA-PISTA.md`). No se tocaron.

> **Tres errores propios de instrumento, declarados porque cambian cómo se leen los números de abajo.** ① `iva` sin delimitar pescó `act**iva**s`, `narrat**iva**s`, `destruct**iva**` y `act**iva**do_en` — la lección `\b` del canon, cobrada tres veces en una sesión; los barridos finales usan delimitadores. ② Pedí `pagos_intentos.created_at` y la columna es `creado_en`; `fee_configs_historial.accion` y es `operacion`; `familias` y es `familia`. ③ **El más caro:** medí el pct del snapshot en `fee_calculo_detalle->>'pct'` y devolvió `(sin pct)` **para las 61 filas** — el pct vive en `->'parametros_aplicados'->>'pct'`. *El cero era del instrumento, no del dato*, y publicado sin re-medir habría dicho «ningún evento declara comisión».

---

## 1 · LO FISCAL QUE YA EXISTE

### Las cuatro que la mesa nombró: NINGUNA existe

```sql
SELECT n, to_regclass('public.'||n) IS NOT NULL FROM (VALUES ('documentos_fiscales'),
  ('tax_profiles'),('fiscal_sequences'),('comprobantes_proveedor'),('fee_configs')) t(n);
```

| Tabla | ¿Existe? |
|---|---|
| `documentos_fiscales` | **NO** |
| `tax_profiles` | **NO** |
| `fiscal_sequences` | **NO** |
| `comprobantes_proveedor` | **NO** |
| `fee_configs` *(control positivo)* | **SÍ** — 10 filas |

### Pero existen DOS que el pedido no nombraba

**🔴 `facturas` — 37 columnas, con el vocabulario del SRI ya completo.**

`id · pedido_id · suscripcion_id · user_id · country_code · numero_factura · clave_acceso · tipo · ruc_emisor · razon_social_emisor · direccion_emisor · tipo_identificacion · identificacion · razon_social · direccion · email · subtotal_0 · subtotal_12 · subtotal_15 · iva_valor · total · descuento_total · items (jsonb) · estado · sri_fecha_autorizacion · sri_numero_autorizacion · sri_ambiente · sri_error · xml_url · pdf_url · fecha_emision · moneda · emitida_por_tercero · cuenta_comercial_id · archivo_url · created_at · updated_at`

**Vive, pero no es lo que su forma sugiere.** 6 filas (13-ago → 18-ago). Medidas una por una:

| numero_factura | total | subtotal_0/12/15 | iva_valor | items | clave_acceso | identificacion | email | archivo_url | por_tercero |
|---|---|---|---|---|---|---|---|---|---|
| `111` | 20.70 | 0 / 0 / 0 | 0.00 | `[]` | null | null | null | null | **true** |
| `A1234` | 29.00 | 0 / 0 / 0 | 0.00 | `[]` | null | null | null | null | **true** |
| `S97-001-000001` | 23.00 | 0 / 0 / 0 | 0.00 | `[]` | null | null | null | null | **true** |
| `CINTURON-S97-6f3e9d` | 20.70 | 0 / 0 / 0 | 0.00 | `[]` | null | null | null | null | **true** |
| `001-001-000000042` | 49.80 | 0 / 0 / 0 | 0.00 | `[]` | null | null | null | null | **true** |
| `SIEMBRA-001-001-000000001` | 28.21 | 0 / 0 / 0 | 0.00 | `[]` | `SIEMBRA-CLAVE-ACCESO` | null | null | null | **true** |

**Las 6 son fixtures** (los nombres lo dicen: `CINTURON-S97`, `SIEMBRA`, `111`, `A1234`). **Las 6 son `emitida_por_tercero = true`.** Los tres subtotales, el IVA y los `items` están en cero con `total > 0` — es decir: **la tabla tiene forma de comprobante fiscal y se está usando como PUNTERO a la factura de otro.** Ningún dato de identidad del receptor (`identificacion`, `razon_social`, `email`, `direccion`: 0 de 6).

**Un solo productor**, medido por cuerpo (no por nombre):

```sql
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND pg_get_functiondef(p.oid) ~* '\mfacturas\M';
```
→ **`registrar_factura_pedido(p_pedido_id, p_numero, p_clave_acceso, p_archivo_url, p_total, p_estado_sri)`** — único INSERT, cero UPDATE. Ejecutable por `authenticated`, **0 callers dentro de la base** ⇒ la llama la app.

**`cat_tasas_impuesto` — catálogo de tasas, 4 filas, todas activas y sin cierre de vigencia:**

| codigo | país | nombre | pct | vigencia_desde | vigencia_hasta |
|---|---|---|---|---|---|
| `EC_IVA_0` | EC | Tarifa 0 % Ecuador | 0.00 | 2024-04-01 | *(sin fin)* |
| `EC_IVA_15` | EC | IVA 15 % Ecuador | 15.00 | 2024-04-01 | *(sin fin)* |
| `CO_IVA_0` | CO | Excluido de IVA Colombia | 0.00 | 2024-01-01 | *(sin fin)* |
| `CO_IVA_19` | CO | IVA 19 % Colombia | 19.00 | 2024-01-01 | *(sin fin)* |

### El mapa completo de columnas fiscales (57, barrido delimitado)

| Dónde | Qué lleva |
|---|---|
| `profiles` | `cedula · tipo_identificacion · identificacion_fiscal · razon_social_fiscal · direccion_fiscal · requiere_factura` |
| `cuentas_comerciales` | `tipo_fiscal (enum) · identificacion_fiscal · razon_social` |
| `cat_paises` | `nombre_id_fiscal (jsonb) · mascara_id_fiscal (jsonb) · tipos_fiscales_soportados (array)` |
| `country_config` | `invoice_system · iva_pct · requires_ruc` |
| `pedido_items` | `impuesto_codigo (FK) · impuesto_pct · impuesto_monto · subtotal` |
| `producto_variantes` | `impuesto_codigo (FK)` |
| `pedidos` | `subtotal · impuesto_total · envio_peso_facturable_kg` |
| `compras` | `subtotal · impuesto_total` |
| **7 × `*_desglose`** | `subtotal · impuesto · total` *(sólo totales)* |
| `liquidaciones` | `retenciones_fiscales (jsonb)` |
| `facturas` | *(las 37 de arriba)* |

---

## 2 · EL IVA HOY

### Dónde vive `EC_IVA_0`

En `cat_tasas_impuesto.codigo`. **Sólo dos tablas lo referencian por FK**, y las dos son de la despensa:

```sql
SELECT conrelid::regclass FROM pg_constraint
WHERE contype='f' AND confrelid='public.cat_tasas_impuesto'::regclass;
```
→ `producto_variantes.impuesto_codigo` · `pedido_items.impuesto_codigo`. **Nada de servicios referencia el catálogo de tasas.**

### Distribución medida

| Dónde | `EC_IVA_0` | `EC_IVA_15` |
|---|---|---|
| `producto_variantes.impuesto_codigo` | **499** | **39** |
| `pedido_items.impuesto_codigo` | **97** | **12** |
| `pedido_items.impuesto_pct` | 97 × `0.00` | 12 × `15.00` |

### 🔴 Los servicios no tienen dónde llevar impuesto — y es deliberado

**Cero columnas de impuesto** en `tipos_servicio`, `prestador_servicios`, `prestador_programas`, `bonos`, `suscripciones_servicio`, `guarderia_suscripciones`, `evento_cita_servicio`, `prestador_servicio_tallas`, `guarderia_planes`.
*Control positivo:* esas mismas tablas existen y sí tienen columnas de precio (`prestador_servicios` 5, `bonos` 3, `suscripciones_servicio` 3, `evento_cita_servicio` 1).

Y el motor lo declara por escrito. En `supabase/functions/pagos-cobro/index.ts` (dos lugares, líneas ~572 y ~592):

> `iva = 0; base = monto;`
> *«IVA 0 **DERIVADO, jamás tecleado**: los servicios no llevan IVA en el catálogo — mismo criterio y mismo lugar donde cambiarlo que sus hermanas.»*

Hay además **4 ramas que sí leen `impuesto` de un desglose** (líneas 497, 534, 548, 604) — pero como todos los desgloses de servicio tienen `impuesto = 0`, el resultado es el mismo.
El guard vive en **`supabase/functions/_shared/iva.ts`** (`verificarIva` / `LineaIva`), importado por **`pagos-cobro` y `pagos-cobro-recurrente`, sin reimplementar** — y su propia cabecera declara que **no decide** si el redondeo va por línea o sobre el total (pregunta al contador, abierta).

### El desglose congelado: sólo TOTALES, jamás por ítem

Los siete `*_desglose` tienen la misma forma — `subtotal · impuesto · total` (+ `moneda`, `fee_config_id`, `congelado_en`, y `envio` en compra/recurrencia). **No hay línea por ítem.** El único IVA por ítem del sistema vive en `pedido_items`.

| Desglose | filas | con `impuesto ≠ 0` | suma IVA |
|---|---|---|---|
| `bono_desglose` | 18 | **0** | 0 |
| `cita_desglose` | 67 | **0** | 0.00 |
| `programa_desglose` | 13 | **0** | 0.00 |
| `guarderia_suscripcion_desglose` | 5 | **0** | 0.00 |
| `recurrencia_desglose` | **0** | 0 | — |
| `suscripcion_desglose` | **0** | 0 | — |
| `compra_desglose` | 69 | **4** | **6.84** |
| *(control positivo)* `pedidos.impuesto_total` | 107 | **11** | **25.36** |

⚠️ **`recurrencia_desglose` y `suscripcion_desglose` están vacías** — el congelado de esos dos sujetos nunca se escribió.
⚠️ **11 pedidos con impuesto contra 4 líneas de `compra_desglose` con impuesto**: el desglose sólo cubre las compras que pasaron por el motor de pagos.

### Historial de cambios de tarifa: NO EXISTE

- `cat_tasas_impuesto_historial` → **no existe** *(control positivo: `fee_configs_historial` sí existe, 22 filas)*.
- **0 filas con `vigencia_hasta` no nula** — ninguna tasa se cerró nunca.
- Sólo **dos** códigos EC: `EC_IVA_15`, `EC_IVA_0`. **No hay `EC_IVA_12`** ⇒ el salto 12 %→15 % de 2024 **no está registrado**, y hoy **no se puede representar por código una factura de la era del 12 %**. El único fósil de esa era es la columna `facturas.subtotal_12`.
- **`country_config.iva_pct` guarda una SEGUNDA copia de la tarifa** (EC = 15.00) fuera del catálogo. Dos fuentes para el mismo número.
- **`country_config` EC: `invoice_system = 'sri'`, `requires_ruc = FALSE`.**

---

## 3 · EL PUNTO ÚNICO DE «PAGO APROBADO»

### 🟢 SÍ existe, y es `aplicar_evento_de_pago(p_evento_id uuid)`

**Los dos rieles convergen ahí**, medido leyendo los cuerpos:

- `aplicar_consulta_activa_deuna` → línea 158: `v_res := aplicar_evento_de_pago(v_ev);`
- `aplicar_consulta_activa_nuvei` → línea 272: `v_res := aplicar_evento_de_pago(v_ev);`

`aplicar_evento_de_pago` no es ejecutable por `authenticated` ni por `anon` (medido con `has_function_privilege`) — sólo se alcanza desde las edges con `service_role`.

**Su forma interna:** puerta (actuador vivo → `_evento_autenticado` → referencia por proveedor) → rama de reverso → `_pago_aprobado(v_src)` → **N ramas por sujeto**, cada una con su propio `UPDATE … SET estado='aprobado'`:

| Rama | Marca `aprobado` | Acto 2 |
|---|---|---|
| **cita** | UPDATE propio | — |
| **recurrente** (suscripción / recurrencia) | UPDATE propio | `renovar_plan_cobrado` · `crear_pedido_de_recurrencia_cobrada` |
| **guardería** (bono / programa / mensualidad) | UPDATE propio | puertas de guardería |
| **compra** | delega en `confirmar_pago_compra` | — |
| *sujeto no reconocido* | — | rebota `sujeto_no_aplicable` **nombrando el sujeto**, con `ok:false` |

⚠️ **El punto único es la FUNCIÓN, no una sentencia.** Hay 3 `UPDATE … estado='aprobado'` distintos adentro más la delegación a `confirmar_pago_compra`. Colgar la emisión de una factura de «la sentencia» exigiría tocar cuatro lugares.

**🟢 Pero ya hay un punto de salida único por rama:** las cuatro ramas emiten `registrar_intencion_notificacion('pago_confirmado', …)` con `p_clave_dedup => 'comprobante:'||<sujeto_id>`, y ese payload **ya lleva** `concepto`, `transaction_id`, `authorization_code`, `monto`, `moneda`, `subtotal`, `impuesto` y `envio` (los tres últimos sumados del desglose congelado). *Es el gancho natural.*

### No hay máquina de estados como dato para pagos

```sql
SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND relkind='r' AND relname ~* '(transicion|estado)';
```
→ existen `cat_estados_pedido`, `cat_transiciones_pedido`, `cat_estados_caso`, `cat_transiciones_caso`, `cat_guarderia_estados`, `cat_guarderia_transiciones`, `cat_estados_adopcion`… **y ninguna de pagos.** El vocabulario de pagos vive en un `CHECK`:

`iniciado · pendiente · aprobado · rechazado · expirado · reversado · reverso_fallido`

### Triggers sobre `pagos_intentos`: uno solo, y es de reverso

`trg_pagos_intentos_reverso_mueve_sujeto` → `_trg_reverso_mueve_sujeto` (AFTER UPDATE). **No hay trigger en la transición a `aprobado`.**

### Estados vivos y aprobados reales vs simulados

| proveedor | aprobados | con `transaction_id` | con `authorization_code` | monto | rango |
|---|---|---|---|---|---|
| **nuvei** | **89** | 89 | 89 | $3 473,82 | 20-ago → **10-sep** |
| **deuna** | **4** | 4 | 4 | $279,86 | 25-ago → 1-sep |
| `seed_gate` | 9 | 0 | 0 | $623,50 | 12–13 ago |
| `simulado` | 4 | 0 | 0 | $238,26 | 14–16 ago |
| `siembra` | 1 | 0 | 0 | $28,21 | 18-ago |

⇒ **93 por riel real (sandbox) · 14 fixtures ($890,57).** Otros estados: 15 rechazado nuvei · 13 pendiente deuna · 3 pendiente nuvei · 5 reversado nuvei · 1 rechazado deuna · 1 reversado deuna.

### Forma de `pagos_intentos` (40 columnas) — la parte que importa

**Ocho columnas de sujeto**: `pedido_id · compra_id · cita_id · recurrencia_id · suscripcion_servicio_id · bono_id · guarderia_suscripcion_id · programa_contratado_id`.
⚠️ El CHECK `chk_intento_un_solo_sujeto` exige exactamente **uno de SIETE** — **`compra_id` queda FUERA del XOR**.

### Qué guarda el comprobante de «qué se pagó»

**`_concepto_de_pago(p_sujeto uuid)`** — devuelve **un texto humano**, no una lista de ítems:
① cita → nombre del servicio · ② compra → el nombre del producto si es uno, `«N productos»` si son varios · ③ bono → `«Paquete de N estadías de guardería»` (unidad en la voz del oficio) · ④ mensualidad → `«Plan mensual de guardería»`…

⇒ **Para facturar no alcanza: una factura necesita líneas con base imponible y tarifa por línea, y hoy el comprobante tiene una descripción y tres agregados.**

---

## 4 · LA IDENTIDAD DEL CLIENTE

**182 profiles.** La identidad fiscal existe como columnas y está **prácticamente vacía**:

| Columna | Con dato | Default |
|---|---|---|
| `email` | **182** | — (NOT NULL) |
| `telefono` | 24 | — |
| `tipo_identificacion` | «182» | **`'cedula'`** ⇐ *es el default, no un dato* |
| `cedula` | **2** | — |
| `identificacion_fiscal` | **0** | — |
| `razon_social_fiscal` | **0** | — |
| `direccion_fiscal` | **0** | — |
| `requiere_factura` | **0** en `true` | `false` |

🔴 **`tipo_identificacion` dice `cedula` en las 182 filas porque es su `column_default`, no porque alguien lo haya declarado** — sólo 2 personas tienen cédula real. Es exactamente el patrón que la ley del founder sobre lo que no se sabe prohíbe: *un default cómodo que se lee como un hecho*.

**`familia` no guarda nada fiscal** — ausente del barrido de 57 columnas.

### Compra sin cuenta: SÍ existe, por mostrador

- `ventas_mostrador` **existe, 4 filas**: `id · cuenta_comercial_id · codigo_reclamo · total · moneda · expira_en · reclamada_por · reclamada_mascota_id · reclamada_en · registrada_por · country_code · created_at`. **No hay `user_id` al crearse** — la venta nace sin persona.
- `venta_mostrador_items` existe (12 columnas).
- `clientes_walkin` **NO existe**; `compras.user_id` **NO es nullable** ⇒ por la puerta de `compras` no hay invitado.
- 2 de 15 cuentas comerciales tienen `venta_mostrador_activa = true`.

---

## 5 · CUENTAS COMERCIALES

```sql
SELECT t.typname, string_agg(e.enumlabel,' | ' ORDER BY e.enumsortorder)
FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid ... ;
```

- **`modelo_comercial_enum` = `marketplace_fachada | reventa_pura | mixto`** → **🟢 `reventa_pura` EXISTE.**
- `tipo_fiscal_enum` = `persona_natural | persona_natural_obligada | persona_juridica | entidad_sin_fines_lucro`

| estado | modelo | tipo_fiscal | n | con `identificacion_fiscal` | con `razon_social` | mostrador |
|---|---|---|---|---|---|---|
| activa | `marketplace_fachada` | persona_natural | **7** | 7 | 7 | 1 |
| activa | `marketplace_fachada` | persona_juridica | **5** | 5 | 5 | 1 |
| pendiente_validacion | `marketplace_fachada` | persona_natural | 2 | 2 | 2 | 0 |
| pendiente_validacion | `marketplace_fachada` | persona_juridica | 1 | 1 | 1 | 0 |

**15 cuentas · 12 activas · las 15 en `marketplace_fachada`. `reventa_pura` tiene CERO filas.** El valor que el modelo fiscal necesita ya existe en el enum y nadie está en él.
**100 % tienen `identificacion_fiscal` y `razon_social`** — la identidad del emisor sí está cargada.

**Régimen tributario: NO existe ningún campo.** Barrido por `regimen|rimpe|contribuyente|obligado_contab|agente_retenc` sobre todas las columnas de `public` → **0 filas** *(control positivo: `cuentas_comerciales` devuelve sus 23 columnas por la misma vía).*

---

## 6 · LAS DOS LIQUIDACIONES → **hoy hay UNA, y está vacía**

| Tabla | ¿Existe? | Filas |
|---|---|---|
| `liquidaciones` | **SÍ** | **0** |
| `liquidacion_eventos` | **SÍ** | **0** |
| `seller_perfil` | **SÍ** | — |
| `seller_liquidaciones` | **NO** | — |
| `liquidacion_pedidos` | **NO** | — |
| `seller_comisiones` | **NO** | — |
| `seller_inventario` | **NO** | — |
| `eventos_economicos` *(control positivo)* | **SÍ** | **61** (última **8-sep**) |

**Firmas:**
- `generar_liquidacion(p_cuenta_comercial_id, p_country_code, p_periodo_inicio, p_periodo_fin, p_generado_por, p_aplicar_holdback_pct, p_dias_holdback) → uuid` *(DEFINER)*
- `admin_generar_liquidacion(p_cuenta_comercial_id, p_country_code, p_periodo_inicio, p_periodo_fin) → uuid` *(DEFINER)*

### 🔴 ¿Sigue viva la fila de `seller_comisiones` al 20 %? — **NO: la TABLA no existe.**

`D-748` está descrita en el canon como 🔴 viva («dos filas activas con `take_rate_pct = 20.00`»). **Su objeto desapareció.**

**Referencias en código** (`grep -rn --include='*.ts' --include='*.tsx' --include='*.sql' --include='*.mjs'`, excluyendo `supabase/migrations/`):

| Término | Referencias | Dónde |
|---|---|---|
| `seller_inventario` | 19 | `scripts/s95` (36 en total entre los cuatro) + `scripts/s96` (2) |
| `seller_comisiones` | 15 | ídem |
| `seller_liquidaciones` | 12 | ídem |
| `liquidacion_pedidos` | 10 | ídem |

**Todas viven en `scripts/s95` y `scripts/s96` — los propios censos y generadores de reversa que las jubilaron. CERO en `packages/`, CERO en `apps/`, CERO en `packages/api/src/database.types.ts`.**
*Rojo del método (control positivo del mismo grep):* `liquidaciones` → 98 en `packages+apps`, `eventos_economicos` → 37, `fee_configs` → 17, y `liquidacion_eventos` → 5 en los tipos generados. **El grep sí encuentra lo que existe.**
⇒ **No hay ningún camino de código vivo apuntando a tablas muertas.**

---

## 7 · LA FACTURA DEL VENDEDOR EN LA DESPENSA

**No vive en `pedidos`.** Las únicas columnas de `pedidos` que matchean `factur|clave|comprobante|archivo|documento` son `clave_idempotencia` y `envio_peso_facturable_kg` — **ninguna es fiscal.**

La factura es **una fila de `facturas` atada por `pedido_id`**, escrita por:

```
registrar_factura_pedido(p_pedido_id uuid, p_numero text, p_clave_acceso text,
                         p_archivo_url text, p_total numeric, p_estado_sri text)
```
DEFINER · **ejecutable por `authenticated`** · **0 callers dentro de la base** ⇒ la invoca el panel del vendedor.

### Cobertura medida

| Medición | Valor |
|---|---|
| Pedidos totales | **107** |
| Pedidos en `documentado` o `entregado` | **3** |
| Pedidos con fila en `facturas` | **6** *(los fixtures)* |
| **Facturas con `archivo_url`** | **🔴 0** |
| Facturas con `clave_acceso` | 1 *(`SIEMBRA-CLAVE-ACCESO`)* |

Estados vivos de `pedidos`: `esperando_pago · pago_capturado · liberado_preparacion · documentado · hacia_destino · en_reparto · entregado · cancelado_cliente · cancelado_vendedor · cancelado_sistema`.
⚠️ **No existe el estado `despachado`** que el canon nombra en la escalera de cuatro — el tercer escalón se llama **`documentado`**.

### El código de reclamo de mostrador

De `registrar_venta_mostrador(p_cuenta_comercial_id, p_items jsonb)`:

```sql
LOOP
  SELECT string_agg(substr(v_abc, 1 + floor(random()*length(v_abc))::int, 1), '')
    INTO v_codigo FROM generate_series(1, 8);
  EXIT WHEN NOT EXISTS (SELECT 1 FROM ventas_mostrador WHERE codigo_reclamo = v_codigo);
END LOOP;
INSERT INTO ventas_mostrador (..., codigo_reclamo, expira_en, registrada_por)
VALUES (..., v_codigo, now() + make_interval(days => v_dias), auth.uid());
```

**8 caracteres al azar sobre un alfabeto acotado, con bucle de unicidad contra la tabla, y vencimiento en días.** Lo reclama `reclamar_compra_mostrador(p_codigo text, p_mascota_id uuid)`.

---

## 8 · COMISIÓN

### Filas de `fee_configs` (10). Vigentes = `vigencia_hasta IS NULL`

| país | tipo_actor | origen | pct | base | vigencia | estado |
|---|---|---|---|---|---|---|
| **EC** | `seller_productos` | `pedido` | **10** | `total_con_impuesto` | 11-ago → *(abierta)* | **VIGENTE** |
| **EC** | `prestador_servicios` | `cita` | **10** | `subtotal` | 25-ago → *(abierta)* | **VIGENTE** |
| **EC** | `prestador_servicios` | `estadia` | **10** | `subtotal` | 25-ago → *(abierta)* | **VIGENTE** *(clon S114)* |
| **EC** | `refugio` | `donacion` | passthrough kushki 3,5 % + $0,30 | — | 2024-01-01 → *(abierta)* | **VIGENTE** |
| EC | `seller_productos` | `pedido` | 14 | *(sin base)* | → **11-ago** | cerrada |
| EC | `prestador_servicios` | `cita` | 15 | *(sin base)* | → 25-ago | cerrada |
| EC | `prestador_servicios` | `estadia` | 15 | *(sin base)* | → 25-ago | cerrada |
| CO | `seller_productos` | `pedido` | 14 | `null` | → 22-ago | cerrada, `activo=false` |
| CO | `prestador_servicios` | `cita` | 15 | — | → 25-ago | cerrada, `activo=false` |
| CO | `refugio` | `donacion` | passthrough | — | abierta | vigente |

**La divergencia de base está declarada a propósito en la nota de la fila:** productos comisiona sobre `total_con_impuesto`, servicios sobre `subtotal` — *«comisionar sobre el impuesto es cobrarle al prestador un porcentaje de plata que es del Estado»*.

### La evidencia del paso 14 % → 10 % del 11-ago

`fee_configs_historial` (22 filas). El paso **NO aparece nunca como un cambio de pct en una fila** — son **dos filas**:

| día | operación | origen | pct antes | pct después |
|---|---|---|---|---|
| **2026-08-11** | **UPDATE** | pedido | 14.00 | 14.00 ⇐ *sólo se cerró la vigencia* |
| **2026-08-11** | **INSERT** | pedido | — | **10** |

(Los otros hitos: 07-may INSERTs a 14/18 · **20-may** UPDATE cita 18→**15** · 22-ago UPDATE pedido CO · **25-ago** cierre cita 15 + INSERT cita **10** · **08-sep** los dos INSERT de `estadia` 15 y 10.)

🔴 **Las 22 filas tienen `motivo` en NULL.** El historial registra el QUÉ y nunca el PORQUÉ.

### Snapshot en `eventos_economicos` (61 filas)

Ruta real del dato: `fee_calculo_detalle -> 'parametros_aplicados' ->> 'pct'`.

| pct | base | origen | eventos | comisión | rango |
|---|---|---|---|---|---|
| **15** | *(sin base)* | cita | **36** | $58,24 | 13-jul → 9-ago |
| **10** | `subtotal` | cita | **20** | $49,33 | 8-sep |
| **10** | `total_con_impuesto` | pedido | **3** | $27,22 | 8-sep |
| **10** | `subtotal` | estadia | **2** | $1,66 | 8-sep |

**🔴 CERO eventos con snapshot 14 %.** El 14 se cerró el 11-ago y el primer evento económico de `pedido` es del **8-sep** ⇒ **nunca se devengó nada al 14 %.**
**36 eventos al 15 % · 25 eventos al 10 %.**
El snapshot además congela `fee_config_id`, `tipo_actor_resuelto`, `absorbe_descuento`, `descuento_aplicado` y `precio_lista_referencia`.

---

## 9 · REEMBOLSOS

### Las funciones que devuelven plata

| Función | Qué hace |
|---|---|
| `aplicar_reembolso(p_evento_original_id, p_motivo, p_aplicado_por, p_monto_parcial_bruto)` | Reversa el **evento económico** (crea el inverso) |
| `caso_resolver(p_caso_id, p_alcance, p_monto, p_motivo)` | Postventa — **llama a `aplicar_reembolso`** |
| `caso_reconocer_y_resolver(...)` | Postventa — **no** llama a `aplicar_reembolso` |
| `registrar_reverso_nuvei(p_intento_id, p_reverso_id, p_status_detail, p_refund_amount, p_auth_code)` | Riel |
| `registrar_reverso_deuna(p_intento_id, p_reverso_id, p_monto, p_estado_info, p_crudo)` | Riel |
| `mover_sujeto_por_reverso(p_intento_id, p_motivo)` | Mueve el sujeto — **NO llama a `aplicar_reembolso`** |
| `_trg_reverso_mueve_sujeto` | Trigger AFTER UPDATE sobre `pagos_intentos` |
| `leer_opciones_devolucion(p_caso_id)` | Lector de postventa |
| `aplicar_saldo_a_compra(p_compra_id, p_monto_saldo)` | El pago mixto |

### 🔴 NO hay un punto único de «reembolso aprobado» — hay DOS puertas

Callers de `aplicar_reembolso` (medido por cuerpo):
```sql
SELECT proname FROM pg_proc ... WHERE pg_get_functiondef(oid) ~* '\maplicar_reembolso\M';
```
→ **`caso_resolver`** y **`_resolver_caso_clase1`. Las dos son de POSTVENTA.**

⇒ **El reverso del riel (nuvei/deuna) no toca el ledger**: `_trg_reverso_mueve_sujeto` → `mover_sujeto_por_reverso` mueve el sujeto, y ahí termina. La reversa económica sólo nace por postventa.

**Y en los datos de hoy eso es coherente, no un hueco:**

| Medición | Valor |
|---|---|
| `pagos_intentos` en `reversado` | **6** |
| `eventos_economicos` con `reversado_por_evento_id` | **0** |
| `eventos_economicos` con `evento_original_id` (inversos) | **4** |

Los 6 reversados (5 nuvei + 1 deuna, 25-ago → 1-sep, $264,10) tienen **cero eventos económicos en su sujeto** — se reversaron **antes del devengo**, que nace al cerrar. *No había nada que reversar.*

### El pago mixto: dónde vive cada parte

| Parte | Dónde |
|---|---|
| **Saldo** | `compras.saldo_aplicado` (monto) + `compras.saldo_reservado_hasta` (la reserva con vencimiento) |
| **Movimientos del saldo** | `saldo_hogar_movimientos` — `familia_id · monto · origen_tipo · origen_id · lote_id · clave_idempotencia · descripcion` |
| **Riel** | `pagos_intentos` (el intento por el resto) |

**Escritores de `saldo_hogar_movimientos`: exactamente dos** — `acreditar_saldo_hogar` y `consumir_saldo_hogar`.
`aplicar_saldo_a_compra` **no escribe el movimiento**: sólo marca la compra (medido — su cuerpo no nombra `saldo_hogar_movimientos`). Es ejecutable por `authenticated`.
**Vida del saldo:** 18 movimientos, 9 negativos, dos orígenes (`caso`, `compra`). 26 casos de postventa.
Vencimiento de la reserva: `liberar_reservas_saldo_vencidas()` por cron cada 15 min + `liberar_reserva_saldo_compra(p_compra_id)`.

---

## 10 · CANALES Y ARCHIVO

### El canal de correo: Resend, **sin adjuntos**

`supabase/functions/despachar-correo/index.ts:513` →
```ts
const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: remitenteDe(i.tipo), to: [email],
    subject: datos.titulo ?? '…', html: plantillaHtml(datos, i.tipo, idioma),
    text: plantillaTexto(datos) }),
});
```

**Medido en el código, no supuesto:** `attachment|adjunto` → **0 ocurrencias** en toda la edge.
*Control positivo del grep:* `html` → 5, `subject` → 1.
⇒ **El payload que armamos lleva sólo `from/to/subject/html/text`.** *(Lo que la API de Resend admita es otra pregunta: acá se midió nuestro código.)*

El resultado se escribe en `notificacion_entrega` con `estado='aceptada_transporte'` y `motivo='resend:<id>'`, o `fallida` con `resend_<status>`.

### El comprobante de pago: ya está resuelto

| tipo | `canal_forzado` | `ignora_techo` | activo |
|---|---|---|---|
| **`pago_confirmado`** | **`email`** | **true** | sí |
| `pago_reversado` | *(null)* | **true** | sí |
| `cierre_cuenta_confirmado` | `email` | true | sí |
| `codigo_firma_adopcion` | `email` | true | sí |
| `copia_datos_lista` | `email` | true | sí |
| `guarderia_renovacion_proxima` | `email` | false | sí |
| `plan_renovacion_proxima` | `email` | false | sí |

Viven en **`cat_notificacion_tipos`** (`canal_forzado`, `ignora_techo`).
⚠️ **`pago_reversado` ignora el techo pero NO fuerza canal** — un reverso puede no llegar por correo.

**Canales (`cat_notificacion_canales`), los cuatro con `transporte_vivo = true`:**
`in_app` (orden 1, **es_piso**) · `push` (2) · `email` (3, *«el canal de CONSTANCIA»*) · `whatsapp` (4, `exige_evidencia`).

### Buckets de Storage: 15 — 6 públicos, 9 privados

| Privados | límite | | Públicos | límite |
|---|---|---|---|---|
| `mascotas` | 5 MB | | `avatars` | 5 MB |
| `cita-archivos` | 10 MB | | `adopcion-fotos` | 5 MB |
| `prestador-documentos` | 5 MB | | `productos-fotos` | 5 MB |
| `grooming-archivos` | 10 MB | | `prestador-galeria` | 10 MB |
| `adiestramiento-clips` | 50 MB | | `especies-razas` | 256 KB |
| `entregas` | 5 MB | | `marca-publica` | 2 MB |
| `cuenta-documentos` | 5 MB | | | |
| `guarderia-media` | 50 MB | | | |
| **`papeles-familia`** *(7-sep)* | **20 MB** | | | |

**No existe ningún bucket fiscal.** `papeles-familia` (privado, 20 MB, el más nuevo) es el candidato más cercano por forma.

### Los crones: 35, todos activos — dos mecanismos

```sql
SELECT jobid, schedule, jobname, command, active FROM cron.job;
```

1. **Dentro de la base:** `SELECT public.<funcion>();` — 27 jobs (`expirar_citas_pendientes`, `cerrar_y_renovar_planes`, `expirar_bonos_sin_pago`, `liberar_reservas_saldo_vencidas`, `vencer_casos_sin_respuesta`, `generar_avisos_coach`…).
2. **A una edge por `pg_net`:** `SELECT net.http_post(url := 'https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/…')` — 8 jobs: `despachar-notificaciones-tick`, `despachar-push-tick`, `despachar-whatsapp-tick`, `despachar-invitacion-correo-tick`, `barrer-storage-tick`, `pagos-conciliar-mediodia` (17:00 UTC), `pagos-conciliar-antes-del-corte` (21:15 UTC), `pagos-deuna-barrido-tick` (08:00 UTC).

### Edges desplegadas: 42, todas ACTIVE

`npx supabase functions list` → **42 desplegadas / 42 ACTIVE**.
**En el repo y no desplegada: `chat-ayuda`** (coherente con su borrado en S92-bis; su `RESCATE.md` es la fuente rescatada).
🟢 **Desplegadas sin fuente en el repo: NINGUNA** — el agujero de `D-717` no se reabrió.

---

## 11 · SECRETOS Y RED

### Secretos de Edge — **31, sólo nombres**

Leídos parseando el JSON y **descartando el digest** (regla de la casa: el `sha256` de un valor de baja entropía es el valor).

```
ANTHROPIC_API_KEY · AVISOS_EMAIL · DESPACHO_SECRET · DEUNA_API_KEY · DEUNA_API_SECRET
DEUNA_POINT_OF_SALE · DEUNA_WEBHOOK_SECRET · FCM_SERVICE_ACCOUNT · GOOGLE_PLACES_API_KEY
INVITACION_CORREO_VIVO · LIVEKIT_API_KEY · LIVEKIT_API_SECRET · LIVEKIT_URL
META_PHONE_NUMBER_ID · META_WABA_ID · META_WHATSAPP_TOKEN
NUVEI_APP_CODE_CLIENT · NUVEI_APP_CODE_SERVER · NUVEI_APP_KEY_CLIENT · NUVEI_APP_KEY_SERVER
PAGOS_AMBIENTE · PAGOS_ORIGENES_PERMITIDOS · RESEND_API_KEY
SUPABASE_ANON_KEY · SUPABASE_DB_URL · SUPABASE_JWKS · SUPABASE_PUBLISHABLE_KEYS
SUPABASE_SECRET_KEYS · SUPABASE_SERVICE_ROLE_KEY · SUPABASE_URL · URL_APP_BASE
```

⚠️ **No están `META_APP_SECRET` ni `META_WEBHOOK_VERIFY_TOKEN`** — coincide con el pendiente del founder declarado en el canon de S114.
**No hay ningún secreto fiscal** (nada de firma electrónica, certificado `.p12`, clave de firmador ni credencial del SRI).

### Positivo: ninguno viaja en el bundle

| Nombre buscado en `apps/` + `packages/` | Ocurrencias |
|---|---|
| `NUVEI_APP_KEY_SERVER` · `NUVEI_APP_CODE_SERVER` · `DEUNA_API_SECRET` · `DEUNA_WEBHOOK_SECRET` · `RESEND_API_KEY` · `ANTHROPIC_API_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `DESPACHO_SECRET` · `FCM_SERVICE_ACCOUNT` · `META_WHATSAPP_TOKEN` | **0 cada uno** |
| *Control positivo* `EXPO_PUBLIC_SUPABASE_URL` | **8** |
| *Control positivo* `EXPO_PUBLIC` | **16** |

**JWTs en el árbol versionado** (buscados por FORMA, `eyJ…\.eyJ…`, en `apps/**` y `packages/**`): **ninguno**.

### 🟡 Red hacia el SRI — MEDIDO SÓLO DESDE LOCAL, **no desde una edge**

```
curl -sS -o /dev/null -w "http=%{http_code} tls=%{ssl_verify_result} total=%{time_total}s size=%{size_download}"
```

| Endpoint | http | TLS | total | bytes |
|---|---|---|---|---|
| `celcer.sri.gob.ec/…/RecepcionComprobantesOffline?wsdl` | **200** | **0 (válido)** | 0,065 s | 4 118 |
| `celcer.sri.gob.ec/…/AutorizacionComprobantesOffline?wsdl` | **200** | **0 (válido)** | 0,066 s | 6 802 |
| *Control positivo* `ccapi-stg.paymentez.com` (Nuvei) | **200** | — | 0,434 s | — |
| *Control positivo* `api.resend.com` | **200** | — | 0,804 s | — |

🔴 **Esto NO responde la pregunta que se hizo.** Se midió desde mi máquina, y la red de una Edge Function (runtime Deno de Supabase) es otra. *Un instrumento que responde desde el lugar equivocado responde sobre otra cosa.*

**Por qué no se corrió la sonda desde edge:** exige crear `supabase/functions/<sonda>/index.ts` y desplegarla — y el mandato dice *«no se crea ni se modifica nada en la base ni en el repo salvo el archivo del relevamiento»*. Además, una sonda desplegada en un proyecto compartido durante una sesión de varias pistas deja residuo que contamina la medición ajena.

**Receta exacta para cuando la mesa la autorice** (2 minutos):
```ts
// supabase/functions/_sonda-sri/index.ts
Deno.serve(async () => {
  const t0 = Date.now();
  const wsdl = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
  const nuvei = 'https://ccapi-stg.paymentez.com/';           // control positivo
  const r = async (u: string) => { try { const x = await fetch(u, { signal: AbortSignal.timeout(15000) });
      return { u, status: x.status, bytes: (await x.text()).length }; }
    catch (e) { return { u, error: String(e) }; } };
  return Response.json({ sri: await r(wsdl), nuvei: await r(nuvei), ms: Date.now() - t0 });
});
```
→ `npx supabase functions deploy _sonda-sri` · invocar · **`npx supabase functions delete _sonda-sri`**.
El positivo de Nuvei va **en la misma corrida**: si el SRI falla y Nuvei también, el problema es la sonda.

---

## LO QUE EL OBJETO DICE DISTINTO AL CANON

**1 · `seller_comisiones` NO EXISTE — y la divergencia NO es la que yo iba a reportar.**
Medido: la tabla no existe (junto con `seller_liquidaciones`, `liquidacion_pedidos`, `seller_inventario`; sobrevive `seller_perfil`).
**Mi primera lectura fue que el canon la daba por viva. Es falsa y la corrijo antes de entregarla:** `DEUDAS_CANONICAS.md:15164` ya dice **☠️ `D-748` — PAGADA (S101-D, 21-ago-2026) por eliminación del objeto**, y hasta cita el `DROP TABLE public.seller_comisiones`. *La ficha estaba bien.*
**Lo que sí quedó viejo es el bloque de estado de `CLAUDE.md`**, que en su sección de S94-B la sigue narrando como 🔴 viva (*«un número vivo en una tabla de comisiones, al doble … Se corrige ANTES de D-745»*) sin marca de cierre.
⇒ **La divergencia real es entre la ficha y la narración del estado, no entre el canon y la base.** *Una ficha cerrada y un bloque de estado que la contradice mandan a dos pistas distintas a conclusiones opuestas, y la que lea el estado va a ir a cerrar algo que se cerró hace veinte días.*

**2 · `facturas` SÍ está fichada — pero su ficha mide algo que dejó de ser cierto.**
**Segunda corrección a mí mismo:** iba a reportar que el canon no la nombra. **Existe `D-416` — «Tabla `facturas` sin origen en migraciones: documentar o jubilar»** (origen S66, `MODELO_VETERINARIA` §16).
Su texto dice: *«la tabla existe en DB con shape SRI y **0 filas**, y no aparece en ninguna migración del repo»*.
🔴 **Hoy tiene 6 filas** (13→18 ago, todas fixtures de S97/siembra). **La ficha sigue diciendo cero.** Su disparo está declarado como *«sin disparo… su resolución natural acompaña a D-419 (SRI)»* ⇒ **D-419 es justamente lo que S115 abre, así que `D-416` se activa ahora y su medición hay que re-hacerla.**
*Lo que sí sigue siendo cierto de su ficha: la tabla no tiene origen en ninguna migración del repo — es drift heredado del portal legado.*

**2bis · 🔴 LA CONTRADICCIÓN QUE MÁS IMPORTA: `D-419` dice lo CONTRARIO del mandato de S115.**
`D-419` (🟠 **ALTA**, *«PRIORIDAD founder S66 — primera tanda post-apertura vet»*) declara, literal:
> *«Hasta entonces: **el vet factura por fuera bajo su RUC** (obligación legal que YA tiene); **e-PetPlace factura solo su comisión** (espejo white-label §2.3).»*
El mandato de S115 es **Satori factura TODO, en reventa con margen**. **Son dos modelos fiscales opuestos**: uno es agencia/marketplace (factura la comisión), el otro es reventa (factura el total y compra al prestador).
Y el objeto está del lado de `D-419`: **las 15 cuentas comerciales están en `marketplace_fachada`**, las 6 filas de `facturas` son `emitida_por_tercero = true`, y `registrar_factura_pedido` existe justamente para **registrar la factura de OTRO**.
⇒ *Todo el esqueleto vivo asume que factura el prestador.* **No es un detalle de implementación: cambia quién es el sujeto pasivo del IVA en cada operación, y por lo tanto qué se guarda, qué se emite y qué se declara.** Esta contradicción se resuelve en la mesa **antes** de la primera migración.

**2ter · 🔴 `MODELO_FISCAL.md` NO EXISTE EN EL REPO.**
El mandato dice que *«manda `MODELO_FISCAL.md` v0.3»*. Medido:
```
find . -iname "*fiscal*" -not -path "./node_modules/*" -not -path "./.git/*"
→ sólo supabase/migrations/20260803140000_s84_nombre_id_fiscal.sql
git log --all --diff-filter=A -- '*MODELO_FISCAL*'   → (vacío)
grep -rln "MODELO_FISCAL" docs supabase packages apps scripts CLAUDE.md → (vacío)
```
**No está en `docs/`, nunca entró a git, y ningún documento lo referencia.** Vive fuera del repo.
*Es exactamente el modo de falla que el canon ya pagó dos veces —las cuatro fichas de S96 sin depositar, la `L-169` nombrada durante una sesión entera sin existir—: **una letra que gobierna y no está depositada la reconstruye de memoria el que abra la próxima sesión.*** **Depositarlo es precondición, no trámite.**

**3 · El tercer escalón de la despensa se llama `documentado`, no `despachado`.**
`MODELO_DESPENSA` §8.6/§11.1 y el canon dicen *«preparado · empacado · despachado · entregado»*. El CHECK vivo dice `esperando_pago · pago_capturado · liberado_preparacion · **documentado** · hacia_destino · en_reparto · entregado`. **Son vocabularios distintos**, y un gate atado al nombre `despachado` mediría cero para siempre.

**4 · El comprobante SÍ tiene campo de impuesto.**
S105 registró *«el comprobante no tenía campo de impuesto — 0 de 27»*. Hoy `aplicar_evento_de_pago` emite `pago_confirmado` con `subtotal`, `impuesto` y `envio` sumados del desglose congelado. **Corregido y no anotado como corregido.**

**5 · `reventa_pura` ya existe en el enum — con cero filas.**
El modelo fiscal lo necesita y no hay que crearlo. Lo que falta es que alguna cuenta esté en él.

**6 · La tarifa de IVA vive en DOS lugares.**
`cat_tasas_impuesto` (catálogo con vigencia, sin historial) y `country_config.iva_pct` (un número suelto, EC = 15.00). El canon habla del catálogo; nadie declara la segunda copia.

**7 · `country_config` EC dice `requires_ruc = false`.**
No encontré letra firmada que lo decida ni en un sentido ni en otro.

**7bis · Fichas vivas que S115 hereda y que nadie citó en el mandato** (medidas en `DEUDAS_CANONICAS.md`):
- **`D-419`** — SRI desde el cobro. 🟠 ALTA, prioridad founder. **Es el objeto de esta sesión** y su letra contradice el mandato (§2bis).
- **`D-416`** — `facturas` sin origen en migraciones. Su disparo es *acompañar a D-419* ⇒ **se activa ahora**.
- **`D-773`** — 🟡 *el pedido empacado sin factura: falta el procedimiento humano.* Ya decide lo técnico (**el pedido no sale**, sin puerta de atrás) y **falta qué hace la persona después**. Muere con el capítulo de `POLITICAS` que pide `D-744`.
- **`D-071`** — Facturación con prorrateo.
- **`D-207`** — `tipoFiscalOpciones` EC-only en la superficie.
- **`D-798`** — ✅ cerrada: `registrar_factura_pedido` pisaba el default con un NULL explícito.

**8 · Los contadores del propio `CLAUDE.md` siguen vencidos.**
La fila de `packages/api` publica *«26 wrappers vivos (S46)»* con **122 archivos en disco**. Ya está declarado como deuda de contador en el canon; lo anoto porque **este relevamiento se cruzó con esa fila y la ignoró a propósito**, midiendo el objeto.

---

## PREGUNTAS QUE NO PUDE RESPONDER MIDIENDO

Ninguna de éstas tiene respuesta en el objeto. Las siete son de mesa, de contador o de una sonda que el mandato no autoriza.

**0 · 🔴 LA QUE BLOQUEA A TODAS LAS DEMÁS: ¿manda `D-419` (agencia: factura el prestador, e-PetPlace su comisión) o el mandato de S115 (reventa: Satori factura todo con margen)?**
No es una pregunta que el objeto pueda contestar — es una decisión. Pero **el objeto ya eligió una**: 15 de 15 cuentas en `marketplace_fachada`, las 6 facturas `emitida_por_tercero=true`, y la única función de factura existe para registrar la de otro. **Si manda reventa, no es una feature: es dar vuelta el sujeto pasivo de cada operación**, y con él la base de comisión (hoy 10 % sobre `subtotal` en servicios y sobre `total_con_impuesto` en productos, divergencia firmada a propósito bajo el supuesto de agencia).
*Contestarla después de la primera migración sale carísimo: 67 citas y 69 compras ya tienen desglose congelado escrito bajo el supuesto viejo.*

**1 · 🔴 ¿Los servicios deben llevar IVA?**
Medido: no lo llevan en ninguna parte —cero columnas, cero FK al catálogo, `iva = 0` hardcodeado en dos ramas de `pagos-cobro` con el comentario *«los servicios no llevan IVA en el catálogo»*—. **Lo que el objeto no puede decir es si eso es CORRECTO.** En Ecuador los servicios veterinarios y los de salud tienen tratamiento distinto del de guardería, paseo, grooming o adiestramiento. Si alguno es gravado, hoy **no hay dónde poner la tarifa ni el código**, y el guard de IVA lo daría por 0 sin rebotar. *Es la pregunta que más caro sale contestar tarde: 67 citas ya tienen desglose congelado con impuesto 0.*

**2 · 🔴 ¿Una Edge Function alcanza el SRI?**
Sin medir, por mandato. El positivo local es fuerte (200 con TLS válido en 65 ms) pero **es otra red**. Receta arriba.

**3 · ¿El redondeo del IVA va por línea o sobre el total?**
`_shared/iva.ts` declara en su cabecera que **tolera las dos formas a propósito**, esperando la respuesta del contador. Sigue abierta.

**4 · ¿Las 6 filas de `facturas` se purgan o se conservan?**
Las 6 son fixtures (`CINTURON-S97`, `SIEMBRA`, `111`, `A1234`) y las 6 dicen `emitida_por_tercero = true`. **No las toqué.** Si la tabla se reusa para emisión propia, conviven fixtures con documentos fiscales reales — y el precedente de la casa (las 64 sondas de S92, los 137 pedidos huérfanos de D-749) es **marcar, no borrar**. Decisión del founder.

**5 · ¿Qué cuenta comercial pasa a `reventa_pura`, y qué le pasa a las 12 activas en `marketplace_fachada`?**
El enum está listo; el movimiento es de mesa y toca la aritmética de comisión de cada una.

**6 · ¿`requires_ruc = false` en EC es decisión o herencia?**
No hay letra que lo respalde. Con 0 de 182 profiles con `identificacion_fiscal`, la respuesta cambia el alcance del alta.

**7 · ¿El reverso del riel debe reversar el ledger?**
Hoy no lo hace (dos puertas distintas), y con los datos de hoy **es coherente** porque los 6 reversados no habían devengado. Pero eso es un accidente del momento, no un invariante: **el día que se reverse un pago cuyo sujeto ya cerró, el ledger va a quedar con el devengo vivo.** No hay guard que lo impida. *Medí el número, no puedo medir la intención.*

---

## LO QUE ESTE RELEVAMIENTO NO MIRÓ

Declarado para que nadie lo lea como cubierto:

- **RLS y permisos** de `facturas`, `cat_tasas_impuesto` y `ventas_mostrador` — sé que `facturas` tiene `relrowsecurity = true`, pero **no leí sus policies**.
- **`cat_paises.mascara_id_fiscal` / `nombre_id_fiscal` / `tipos_fiscales_soportados`** — vi que existen, no leí su contenido.
- **`liquidaciones.retenciones_fiscales`** (jsonb) — la tabla está en cero filas, así que no hay forma de medir su forma real.
- **La superficie** (las apps): no medí qué pantalla muestra hoy la identidad fiscal ni el panel del vendedor.
- **Migraciones**: no las leí. Todo salió del estado vivo, que es lo que rige.

---

*Relevamiento de sólo lectura. Cero migraciones, cero DDL, cero escrituras. Único artefacto: este archivo. SQL de trabajo en el scratchpad de la sesión, fuera del repo.*
