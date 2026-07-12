# MODELO_FINANCIERO.md — e-PetPlace

> Documento maestro del motor financiero del ecosistema e-PetPlace.
> Última actualización: 12 Jul 2026 v2.6 — Decisión T: el PAQUETE de salidas — un pago, N devengos FIFO a precio de origen, el no-show devenga, las vencidas son breakage DECLARADO; regla 7.15 + comisión visible desde `fee_configs`.
> Versiones anteriores:
>   - v2.5 (11 Jul 2026 — Decisión S: el PLAN de paseo cobra por período mensual, un pago, N devengos — variante (b) intacta).
>   - v2.4 (11 Jul 2026 — devengo de cita implementado variante (b), cuenta activa para cobrar/ofertarse, L-140/security_invoker).
>   - v2.3 (9 Mayo 2026 — wizard v2 implementado, datos_bancarios refactor a 7 keys, asignación de rol vía UPSERT en user_roles).
>   - v2.3 (9 Mayo 2026 — wizard v2 implementado, datos_bancarios extendido, MIG-L aplicada).
>   - v2.2 (8 Mayo 2026 — esquema oficial de datos_bancarios + CHECK constraint).
>   - v2.1 (8 Mayo 2026 — cleanup post-cierre: prestadores sin datos fiscales redundantes, multi-sede, donaciones con FK).
>   - v2.0 (8 Mayo 2026 — modelo multi-rol implementado, schema reorganizado).
>   - v1.0 (7 Mayo 2026 — modelo de un rol por cuenta).
> Autor: Guillermo + Claude (Anthropic).
> Estado: schema implementado y consolidado en Supabase. Wiring a flujos transaccionales pendiente.

---

## Cambio importante respecto a v2.5 (S56 — 12 Jul 2026)

La v2.6 firma la plata del PAQUETE DE SALIDAS (el bono anclado al prestador — su UX vive en `MODELO_PASEO.md` §6bis y su política en `POLITICAS_EPETPLACE.md` P16; acá vive el contrato del dinero):

1. **Decisión T — el paquete cobra UN pago al comprarse** (simulado y declarado hasta Kushki real). El pago JAMÁS toca el ledger (variante (b) intacta): cada salida devenga sola al cerrar, al **precio unitario efectivo** (total pagado ÷ N salidas) de su paquete de ORIGEN (FIFO).
2. **Dos cierres legales devengan:** `cierre_con_calidad` (Decisión R) y `cierre_no_show` (NUEVO — reserva confirmada no cumplida sin cancelación ≥2 h: el paseador devenga igual, su franja se bloqueó de verdad). No hay tercera vía.
3. **Salidas vencidas = breakage DECLARADO:** revenue de plataforma con `tipo_evento` propio, sin payout. El rollover (renovar antes del vencimiento) es transferencia de saldo, sin evento económico.
4. **Regla transversal de comisión visible:** toda superficie donde el prestador ponga precio muestra el NETO descontando la comisión vigente, LEÍDA de `fee_configs` — jamás hardcodeada.

Si trabajaste con la v2.5, tu código sigue válido. Lo nuevo: el paquete solo devenga por sus dos cierres (7.15), el vencimiento genera breakage vía `crear_evento_economico()`, y ningún neto mostrado al prestador se calcula con un fee hardcodeado.

---

## Cambio importante respecto a v2.4 (S55-B5 — 11 Jul 2026)

La v2.5 firma la plata del PLAN de paseo (la recurrencia — su UX y su política viven en `MODELO_PASEO.md` §6 y `POLITICAS_EPETPLACE.md` P14; acá vive el contrato del dinero):

1. **Decisión S — el plan cobra por PERÍODO MENSUAL.** UN pago al contratar y UN pago en cada renovación. Contratar 3 meses = 3 cobros mensuales — JAMÁS un cobro junto por adelantado de varios períodos.
2. **Un pago, N devengos — la variante (b) NO se toca.** El pago del período NO genera ningún evento económico: cada cita del plan devenga SOLA al cerrar con calidad, con el **precio unitario efectivo** (total del período ÷ N citas del período) como base del devengo. El descuento por volumen lo configura el prestador en el precio del plan.
3. **Renovación y reversas:** auto-renovación con aviso previo de 72 h y pausa de un toque. Un período NO renovado no deja nada que reversar — el devengo solo existe por cierre; lo pagado sin ejecutar se rige por P14 (crédito al período siguiente si renueva, reembolso proporcional si no).
4. **Simulado declarado:** mientras Kushki real no exista, el cobro del período es simulado y la superficie LO DICE — mismo contrato de estados que la cita suelta.

Si trabajaste con la v2.4, tu código sigue válido. Lo nuevo: el plan jamás cobra multi-período junto, y el devengo por cita usa el precio unitario efectivo del período.

---

## Cambio importante respecto a v2.3 (S54 — 11 Jul 2026)

La v2.4 captura la PRIMERA circulación real por el motor: el ciclo de cita del app móvil quedó cableado de punta a punta, con pago SIMULADO y declarado. Cuatro cambios:

1. **Devengo de cita IMPLEMENTADO — variante (b), founder+arquitecto S54.** El evento económico NO nace al pagar: nace en `cerrar_paseo_con_calidad` (el cierre con calidad ES la condición de liquidación, DM-S34.2/S40.1), SOLO si `evento_cita_servicio.estado_reserva = 'pagada'`. `fecha_devengo` = el cierre; `fecha_cobro_kushki` = el pago (guardado en `metadata.pagado_en` de la cita hasta que Kushki real traiga su columna/charge_id). `confirmar_cita_pagada` PRE-VALIDA el motor (cuenta activa + rol activo + fee resolvible) SIN escribir el ledger — un pago que el motor va a rechazar al cierre es un pago que promete mentira. Coherente con §2.2 ("cita completada y pagada") y §3 (tres timestamps).

2. **Regla de plata nueva (founder S54): rol activo NO basta para cobrar.** La pre-validación exige `cuentas_comerciales.estado = 'activa'` (error tipado `cuenta_no_activa`), y **ningún listado del producto oferta prestadores cuya cuenta no esté activa** (no se oferta quien no puede cobrar). Ver Decisión Q y regla 7.13.

3. **Pago simulado declarado (fase de pruebas):** los eventos nacen con `metadata.pago_simulado = true` y `monto_kushki_fee = 0` (no se inventa fee de Kushki). El sprint 3.1.B.3 queda EJECUTADO en esta modalidad; Kushki real pendiente con el mismo contrato de estados.

4. **Endurecimiento de seguridad (S54, L-140):** ver la nota en §4.5.

Si trabajaste con la v2.3, tu código sigue válido. Lo nuevo: jamás crear el evento de cita al pagar (nace al cerrar), y toda superficie que liste prestadores cobrables filtra por cuenta activa.

---

## Cambio importante respecto a v2.2 (refinamiento del 9 Mayo)

La v2.3 captura los cambios aplicados durante la implementación del wizard v2 en el portal-prestadores. Tres cambios principales:

1. **Refactor de `datos_bancarios` de 5 a 7 keys** (MIG-L): se agregaron `banco_codigo` y `titular_tipo_documento` para soportar dropdown de bancos del catálogo `cat_bancos` y máscara de validación del documento del titular.

2. **Asignación de rol vía UPSERT en wizard_crear_cuenta_y_rol**: la función SQL ahora hace UPSERT idempotente en `user_roles` con ON CONFLICT (user_id, role, country_code). Esto cierra el gap de que el wizard creaba cuenta + prestador pero NO asignaba rol al user, dejándolo sin acceso al portal.

3. **Multi-rol soportado en wizard**: un user con rol existente (ej: pet_parent) puede registrarse como prestador sin perder el rol previo. La activación es responsabilidad de admin después de validar documentación.

Si trabajaste con la v2.2, tu código sigue válido. Solo hay que respetar el nuevo esquema de datos_bancarios (7 keys en activa/suspendida).

---

## Cambio importante respecto a v2.1 (refinamiento del 8 Mayo)

La v2.1 dejó pendiente la documentación formal del esquema de `cuentas_comerciales.datos_bancarios`. Ese jsonb se estaba usando ad-hoc en tests, sin contrato oficial. El otro agente del portal-prestadores levantó la bandera al construir el wizard de registro.

La v2.2 cierra eso con tres cosas:

1. **Esquema oficial de `datos_bancarios` documentado** (sección 4.1).
2. **CHECK constraint `chk_datos_bancarios_validos` aplicado** en DB (MIG-K). Valida estructura mínima cuando la cuenta está en estado activa o suspendida. Permite jsonb parcial cuando está en pendiente_validacion (para que el wizard pueda guardar progreso).
3. **Hallazgo documentado de la interacción con `chk_estado_consistente`** preexistente. Define el flujo correcto del wizard: crear en `pendiente_validacion`, admin activa después con `UPDATE estado='activa', activado_en=now()` simultáneamente.

Si trabajaste con la v2.1, tu código sigue válido. Solo hay que respetar el flujo de activación.

---

## Cambio importante respecto a v2.0

La v2.0 dejó tres inconsistencias pequeñas que se cerraron el mismo día con MIG-I y MIG-J:

1. **`prestadores` tenía `ruc` y `razon_social`** que duplicaban datos de `cuentas_comerciales`. Removidas en MIG-I.A.
2. **`donaciones` tenía `refugio` como text suelto** en lugar de FK a `refugios`. Reemplazada por `refugio_id` FK en MIG-I.B.
3. **`prestadores` tenía `UNIQUE(user_id)`** que bloqueaba que un mismo humano gestionara múltiples sedes. Removido en MIG-J. Ahora un humano puede tener N prestadores (multi-sede). Guardrail: `UNIQUE(cuenta_comercial_id, nombre_comercial)`.

---

## Cambio importante respecto a v1 — recordatorio

La v1.0 modelaba `tipo_actor` como columna fija dentro de `cuentas_comerciales`. Es decir: si un humano vendía productos Y ofrecía servicios bajo el mismo RUC, eran dos cuentas comerciales distintas.

Esa decisión se reformuló el 8 Mayo. Ahora **una entidad fiscal (RUC/DNI + país) tiene UNA sola cuenta comercial**, con N roles activos en una tabla pivote (`cuenta_roles`). Una sola conciliación, un solo banco, una sola liquidación con desglose por rol.

---

## 1. Propósito y alcance

Este documento describe el motor financiero de e-PetPlace: cómo se devenga revenue, cómo se calculan fees, cómo se registran eventos económicos, cómo se generan liquidaciones, y cómo se manejan reembolsos.

**No es** documentación de UX, de producto, ni de operaciones. Es el contrato técnico-conceptual del backend financiero. Cualquier feature que toque plata debe leer este documento antes de modificar el código.

**Aplica a:**
- Marketplace de productos (sellers + futuros wearables propios).
- Portal de prestadores de servicios (clínicas, groomers, paseadores).
- Portal de refugios (donaciones + adopciones, posiblemente con costo de vacunas/esterilización).
- Portal de criaderos (suscripciones + publicaciones puntuales + boost).
- Suscripciones Prime de usuarios finales.
- Publicidad pagada (cuando se construya).
- Aseguradoras con devengo diferido (futuro).
- Ventas directas de e-PetPlace (wearables, delivery propio).

---

## 2. Modelo de negocio — premisas no negociables

### 2.1 Fee per transaction

La plataforma cobra cuando hay un evento económico que pasa por ella. El qué se cobra depende del rol del actor en cada transacción específica. Si no pasa por la plataforma, no cobra. Esa es la regla de oro.

### 2.2 Mapa de revenue

| Rol del actor | Qué cobra la plataforma | Cuándo |
|---|---|---|
| Seller de productos | Comisión % sobre venta (default 14% EC/CO) | Pedido pagado |
| Prestador de servicios | Comisión % sobre cita (default 15% EC/CO, parametrizable por mercado vía fee_configs) | Cita completada y pagada |
| Refugio | Solo comisión Kushki passthrough sobre donaciones | Donación recibida |
| Refugio (adopción con costo) | Comisión Kushki passthrough | Adopción con pago de vacunas/esterilización |
| Criadero (suscripción) | Fee mensual fijo | Pago recurrente |
| Criadero (publicación puntual) | Fee por publicación de cría | Compra del producto comercial |
| Criadero (boost) | Fee por destaque | Compra del producto comercial |
| Aseguradora (futuro) | % sobre prima, devengo diferido | Mensual durante vigencia |
| e-PetPlace directo | 100% (vendedor propio: wearables, delivery) | Pedido pagado |
| Suscripción Prime usuario | 100% (revenue puro plataforma) | Pago recurrente |
| Publicidad / boosts (futuro) | 100% por servicio comercial | Compra del slot |

### 2.3 White-label (modelo de marketplace de fachada)

- Los productos se venden con marca del fabricante real (Royal Canin, Doglover, etc.).
- La factura electrónica al cliente final la emite el seller original, no e-PetPlace.
- Excepción: línea propia de wearables y bolsas/uniformes de delivery (e-PetPlace SÍ es seller directo).
- Implicancia: cada producto tiene un seller asociado fiscalmente identificado.

### 2.4 Procesamiento de pagos

- Toda plata pasa por Kushki.
- **Fase 1 (actual):** Kushki básico. La plata entra a la cuenta master de e-PetPlace. La plataforma transfiere manualmente al actor vía liquidaciones.
- **Fase 2 (cuando Kushki firme contrato Marketplace):** Kushki hace split automático. Las liquidaciones se vuelven registros contables, no transferencias.
- El schema soporta ambas fases sin refactor.

### 2.5 Si no pasa por la plataforma, no se cobra

Decisión estratégica de Guillermo. La plataforma genera valor (Bio-Expediente, prestadores recurrentes, gamificación, marketing) que hace pegajoso el uso, pero no persigue cobros off-platform. Eventos fuera del sistema no se modelan.

### 2.6 Una entidad fiscal = una cuenta comercial multi-rol

Cualquier humano o empresa que participe en e-PetPlace bajo un mismo RUC/DNI + país tiene **una sola cuenta comercial**. Esa cuenta puede acumular N roles activos: vender productos, ofrecer servicios, gestionar un refugio, operar un criadero, todos a la vez.

Implicancias operativas:
- Un solo banco, una conciliación, una conversación con su contador.
- KYC y validación fiscal una vez por entidad.
- Cross-sell entre verticales trivial.
- Una sola liquidación consolidada por período, con desglose interno por rol.

Implicancia técnica: `tipo_actor` NO es columna en `cuentas_comerciales`. Vive en la tabla pivote `cuenta_roles` con N filas por cuenta.

**Coherencia entre las 4 tablas operativas:** todas las tablas operativas (`prestadores`, `seller_perfil`, `criaderos`, `refugios`) son consistentes en NO tener datos fiscales propios. RUC, razón social, datos bancarios viven SOLO en `cuentas_comerciales`. Cualquier query que necesite mostrar esos datos en contexto operativo lo hace via JOIN. NUNCA duplicar.

### 2.7 Multi-sede para prestadores

Un mismo dueño humano puede operar N sedes (clínicas, locales) bajo la misma cuenta comercial. Cada sede es una fila independiente en `prestadores`, con su propio nombre operativo, dirección, agenda, servicios y empleados.

Implicancia técnica: `prestadores.user_id` NO es UNIQUE (un humano = N filas en prestadores posibles). El guardrail es `UNIQUE(cuenta_comercial_id, nombre_comercial)`: una cuenta no puede tener dos sedes con el mismo nombre operativo.

Implicancia para liquidaciones: la liquidación es por `cuenta_comercial`, no por sede. Si Don Pepe tiene Quito y Guayaquil bajo la misma cuenta, recibe UNA sola liquidación consolidando lo cobrado en ambas sedes.

---

## 3. Conceptos contables que el modelo separa

Tres cosas distintas que se confunden en sistemas mal modelados:

- **Devengo:** el momento en que la plataforma se gana la comisión. Cita completada, pedido entregado, donación procesada, póliza vendida.
- **Cobro de Kushki:** el momento en que la plata entra a la cuenta master (o al subaccount con split).
- **Liquidación al actor:** el momento en que la plataforma transfiere al actor lo que le corresponde.

Tres timestamps distintos: `fecha_devengo`, `fecha_cobro_kushki`, `fecha_liquidacion`. Cada uno con su columna explícita en `eventos_economicos`.

### 3.1 Fórmula universal

```
GMV = Kushki_fee + Plataforma_fee + Payout
```

- `GMV` = monto bruto pagado por el cliente final (`monto_bruto`).
- `Kushki_fee` = lo que cobra la pasarela (`monto_kushki_fee`).
- `Plataforma_fee` = revenue para e-PetPlace (`monto_plataforma`).
- `Payout` = lo que recibe el actor (`monto_payout`, NULL si revenue puro plataforma).

Cualquier modelo de fee cabe en esta ecuación. Criaderos con fee fijo: `Plataforma_fee = constante`. Refugios con donaciones: `Plataforma_fee = 0`. Sellers con 14%: `Plataforma_fee = GMV × 0.14`.

### 3.2 Snapshot de fees al momento del devengo

Cuando se crea un evento, la regla de fee aplicada queda **fija** en el evento (`fee_config_id` + `fee_calculo_detalle`). Si después se cambia la regla, eventos viejos no se recalculan. Esto evita liquidaciones cuestionables y da auditoría completa.

El snapshot también guarda `tipo_actor_resuelto` — el rol específico bajo el cual se cobró el evento. Esto permite desglose por rol en liquidaciones consolidadas.

---

## 4. Schema implementado

### 4.1 Tablas core del motor financiero

#### `cuentas_comerciales`

Entidades fiscales que cobran. Independiente de `profiles` (login).

Campos clave:
- `id` (uuid PK)
- `owner_profile_id` → FK a profiles (puede ser dueño de N cuentas, una por país)
- `tipo_fiscal` enum: persona_natural | persona_natural_obligada | persona_juridica | entidad_sin_fines_lucro
- `identificacion_fiscal` (RUC/cédula/NIT, UNIQUE por país)
- `razon_social`, `nombre_comercial`
- `country_code`, `moneda`
- `modelo_comercial` enum: marketplace_fachada | reventa_pura | mixto
- `datos_bancarios` jsonb (esquema oficial documentado abajo)
- `kushki_subaccount_id` (NULL hasta fase 2 con Marketplace)
- `estado` enum: pendiente_validacion | activa | suspendida | cerrada
- `activado_en`, `suspendido_en`, `suspension_motivo`, `cerrado_en` (timestamps de transición)
- `saldo_arrastre` numeric (puede ser negativo si reembolsos > payouts)

##### Esquema oficial de `datos_bancarios` (jsonb)

**Decisión:** Opción A — estructura uniforme entre países. Si en el futuro se necesita variación por país, se hace en el frontend del wizard (validación específica por país) o se usa el campo `metadata` como escape hatch. NO se ramifica el schema.

```json
{
  "banco_codigo": "string (código del catálogo cat_bancos, ej. 'PICHINCHA')",
  "banco_nombre": "string (nombre legible, ej. 'Banco Pichincha')",
  "tipo_cuenta": "corriente | ahorros",
  "numero_cuenta": "string",
  "titular_nombre": "string (tal como figura en el banco)",
  "titular_tipo_documento": "string (CEDULA | RUC | PASAPORTE)",
  "titular_documento": "string (RUC/cédula/pasaporte del titular bancario)"
}
```

**Notas operativas v2.3:**
- `banco_codigo` se valida contra `cat_bancos.codigo` activos del país.
- `titular_tipo_documento` se valida contra `cat_tipos_documento_titular.codigo` del país. Cada tipo tiene `mascara_validacion` regex.
- `titular_documento` se valida contra la máscara del tipo elegido.
- `titular_documento` no necesariamente coincide con `identificacion_fiscal`. Caso real: persona jurídica donde el titular bancario es el representante legal con su cédula personal, no el RUC de la empresa.
- La validación de FORMATO específico por país (longitud del número de cuenta, código de banco real) va en el frontend del wizard según `country_code`.

##### CHECK constraints aplicados a `cuentas_comerciales`

Dos constraints encadenados que deben pasar ambos:

**1. `chk_datos_bancarios_validos`** (v2.2 — MIG-K, actualizado a 7 keys en v2.3 — MIG-L):

```sql
CHECK (
  (estado IN ('pendiente_validacion', 'cerrada')
   AND datos_bancarios IS NOT NULL)
  OR
  (estado IN ('activa', 'suspendida')
   AND datos_bancarios ? 'banco_codigo'
   AND datos_bancarios ? 'banco_nombre'
   AND datos_bancarios ? 'tipo_cuenta'
   AND datos_bancarios ? 'numero_cuenta'
   AND datos_bancarios ? 'titular_nombre'
   AND datos_bancarios ? 'titular_tipo_documento'
   AND datos_bancarios ? 'titular_documento'
   AND length(trim(datos_bancarios->>'banco_codigo')) > 0
   AND length(trim(datos_bancarios->>'banco_nombre')) > 0
   AND length(trim(datos_bancarios->>'numero_cuenta')) > 0
   AND length(trim(datos_bancarios->>'titular_nombre')) > 0
   AND length(trim(datos_bancarios->>'titular_documento')) > 0
   AND datos_bancarios->>'tipo_cuenta' IN ('corriente', 'ahorros'))
);
```

Reglas:
- Cuenta en `pendiente_validacion` o `cerrada`: `datos_bancarios` puede ser `{}` o parcial (no nulo).
- Cuenta en `activa` o `suspendida`: las 7 claves obligatorias deben estar con valores no vacíos. `tipo_cuenta` solo acepta `'corriente'` o `'ahorros'`.

**2. `chk_estado_consistente`** (preexistente desde v1):

```sql
CHECK (
  (estado = 'activa' AND activado_en IS NOT NULL) OR
  (estado = 'suspendida' AND suspendido_en IS NOT NULL) OR
  (estado = 'cerrada' AND cerrado_en IS NOT NULL) OR
  (estado = 'pendiente_validacion')
);
```

Reglas:
- Si `estado='activa'` → `activado_en` NOT NULL.
- Si `estado='suspendida'` → `suspendido_en` NOT NULL.
- Si `estado='cerrada'` → `cerrado_en` NOT NULL.
- Si `estado='pendiente_validacion'` → cualquier valor en los timestamps.

##### Flujo correcto del wizard (interacción de los 2 CHECKs)

NO se puede crear directamente una cuenta en `estado='activa'` desde un wizard. La activación requiere:

```sql
UPDATE cuentas_comerciales 
SET estado = 'activa', activado_en = now()
WHERE id = $1;
```

**Ambos campos en el mismo UPDATE.** Si esa transición no incluye `activado_en`, falla por `chk_estado_consistente`. Si los datos bancarios no están completos al momento de la transición, falla por `chk_datos_bancarios_validos`. Esa redundancia es deliberada: garantiza completitud al activar.

**Flujo correcto del wizard:**

1. INSERT inicial con `estado='pendiente_validacion'` y `datos_bancarios={}` o parcial.
2. Wizard guarda progreso vía UPDATE manteniendo `estado='pendiente_validacion'`.
3. Wizard cierra. La cuenta queda en pendiente_validacion.
4. Admin (no el wizard) revisa documentación y dispara la activación con UPDATE simultáneo de `estado` y `activado_en`. Si los datos están incompletos, el constraint la frena y admin sabe que debe pedir al usuario completar.

##### Tooltip recomendado para el wizard

Cuando el wizard pida los datos bancarios al usuario:

> "Esta es la cuenta donde vas a recibir tus liquidaciones. Si vendés productos, ofrecés servicios o tenés un refugio, todo se consolida acá — recibís una sola transferencia."

Este copy refuerza la decisión I (una entidad fiscal = una cuenta comercial multi-rol) explicándole al usuario por qué solo se le pide UNA cuenta bancaria aunque opere en varios verticales.

##### Reglas de uso de `cuentas_comerciales`

- Una persona puede tener N cuentas comerciales (multi-país, una por país).
- Sin la columna `tipo_actor` — el rol vive en `cuenta_roles`.
- Sin cuenta_comercial activa, no se le puede liquidar al actor.
- `prestadores`, `seller_perfil`, `refugios`, `criaderos` deben tener FK a `cuenta_comercial_id`.

#### `cuenta_roles`

Pivote: una `cuenta_comercial` puede tener N roles activos.

Campos clave:
- `id` (uuid PK)
- `cuenta_comercial_id` FK → cuentas_comerciales (CASCADE)
- `tipo_actor` enum (seller_productos, prestador_servicios, refugio, criadero, aseguradora, plataforma_directa, otro)
- `estado` enum: activo | suspendido | cerrado
- `activado_en`, `suspendido_en`, `suspension_motivo`, `cerrado_en`
- `metadata` jsonb (extensible)
- UNIQUE (cuenta_comercial_id, tipo_actor) — una cuenta no puede tener el mismo rol dos veces

#### `fee_configs`

Reglas de cálculo de fee. Por defecto (cuenta NULL + tipo_actor + país) o específicas (cuenta concreta).

#### `fee_configs_historial`

Auditoría automática de cambios en `fee_configs` vía trigger `audit_fee_configs()`.

#### `productos_comerciales`

Catálogo de items vendibles por la plataforma a sus actores.

#### `eventos_economicos`

**El libro mayor del marketplace.** Cada hecho económico que mueve plata o devenga revenue se registra acá.

Campos clave:
- `id`, `tipo_evento`, `revenue_stream`
- `cuenta_comercial_id` (NULL = revenue puro plataforma)
- `country_code`, `moneda`
- `monto_bruto`, `monto_kushki_fee`, `monto_plataforma`, `monto_payout`
- `fee_config_id`, `fee_calculo_detalle` jsonb (snapshot del cálculo, incluye `tipo_actor_resuelto`)
- `origen_tipo`, `origen_id` — polimórfico, validado por trigger
- `kushki_charge_id`
- `parent_evento_id`, `cohorte_periodo` — para devengos diferidos
- `evento_original_id`, `reversado_por_evento_id` — para reembolsos
- `fecha_devengo`, `fecha_cobro_kushki`
- `estado` enum: pendiente_liquidar | liquidado | reversado | en_disputa | no_aplica
- `liquidacion_id`
- `metadata` jsonb

#### `liquidaciones`

Consolidación de eventos pendientes de una cuenta+país+período. Una liquidación = una transferencia (o un registro contable cuando esté Kushki Marketplace).

Cuando un actor tiene multi-rol o multi-sede, esta consolidación incluye eventos de todos sus roles y sedes activos en el período. Una sola transferencia bancaria, comprobante con desglose interno por `tipo_actor_resuelto`.

#### `liquidacion_eventos`

Tabla puente. Un evento solo puede estar en una liquidación (UNIQUE constraint).

### 4.2 Tablas operativas de actores

Consistencia de las 4 tablas operativas:

| Tabla | Datos fiscales | Datos operativos | Vínculo a cuenta |
|---|---|---|---|
| `prestadores` | NO (viven en cuentas_comerciales) | nombre_comercial (sede), dirección, agenda, servicios | `cuenta_comercial_id` FK NOT NULL RESTRICT |
| `seller_perfil` | NO (viven en cuentas_comerciales) | catálogo, despacho, integración VTEX | `cuenta_comercial_id` FK NOT NULL RESTRICT |
| `criaderos` | NO (nunca tuvo) | razas, especies, certificaciones, plan | `cuenta_comercial_id` FK NOT NULL RESTRICT |
| `refugios` | NO (creado limpio) | capacidad, especies, registro, donaciones | `cuenta_comercial_id` FK NOT NULL RESTRICT |

#### `prestadores`

Una cuenta puede tener N prestadores (N sedes). Cada sede:
- Tiene su propio horario, dirección, servicios, empleados.
- Puede tener su propio `nombre_comercial` (distinto del nombre fiscal de la cuenta).
- Recibe citas independientemente.
- Las citas se asocian a `prestador_id` específico, que ya implica sede.

Constraints relevantes:
- `cuenta_comercial_id` FK NOT NULL → cuentas_comerciales (RESTRICT).
- `user_id` NOT UNIQUE (un humano = N filas posibles).
- `UNIQUE(cuenta_comercial_id, nombre_comercial)` — una cuenta no puede tener dos sedes con el mismo nombre.
- Sin columnas fiscales (RUC, razón social viven en cuentas_comerciales).

Liquidación consolida lo cobrado en TODAS las sedes (porque la liquidación es por `cuenta_comercial`, no por prestador).

#### `seller_perfil`

`cuenta_comercial_id` FK NOT NULL → cuentas_comerciales (RESTRICT). 

Columnas adicionales:
- `codigo_afiliado` text UNIQUE — código corto público útil con o sin VTEX.
- 8 columnas VTEX-específicas (todas nullable):
  - `vtex_seller_id` UNIQUE
  - `vtex_trade_policy_id`
  - `vtex_fulfillment_url`
  - `vtex_app_key_ref` (referencia a Vault, NO secreto en plano)
  - `vtex_app_token_ref` (referencia a Vault, NO secreto en plano)
  - `vtex_estado_sync` (CHECK: nunca | pendiente | sincronizado | error)
  - `vtex_ultima_sync`
  - `vtex_sync_error`

#### `criaderos`

`cuenta_comercial_id` FK NOT NULL → cuentas_comerciales (RESTRICT). Sin datos fiscales propios (nunca los tuvo). Estructura operativa: razas, especies, certificaciones, plan de suscripción.

#### `refugios`

Tabla creada el 8 Mayo. `cuenta_comercial_id` FK NOT NULL. Estructura coherente con prestadores/criaderos.

**Vinculación con adopciones y donaciones:**
- `mascotas_adopcion.refugio_id` (FK SET NULL).
- `solicitudes_adopcion.refugio_id` (FK SET NULL).
- `donaciones.refugio_id` (FK SET NULL).

#### `donaciones`

Tabla básica preexistente al motor financiero. Modificada en v2.1: la columna `refugio` (text suelto) fue reemplazada por `refugio_id` (FK SET NULL → refugios).

Cuando se construya el módulo de donaciones, debe disparar `crear_evento_economico` con `tipo_evento='donacion_recibida'`, `origen_tipo='donacion'`, `origen_id=donaciones.id`. El motor lo soporta hoy. La cuenta_comercial del refugio receptor debe tener rol `refugio` activo.

### 4.3 Funciones core

#### `resolver_fee_aplicable(...)` — STABLE

Recibe `tipo_actor` como parámetro y resuelve la regla aplicable según prioridad.

#### `crear_evento_economico(...)` — SECURITY DEFINER

Función motor. 18 parámetros. Lógica:

1. Recibe los parámetros del evento.
2. Deriva `tipo_actor_requerido` del `origen_tipo` mediante mapping:

| origen_tipo | tipo_actor requerido |
|---|---|
| pedido | seller_productos |
| cita | prestador_servicios |
| donacion | refugio |
| bono | prestador_servicios |
| estadia | prestador_servicios |
| suscripcion | sin validación (revenue puro plataforma) |
| producto_comercial | sin validación |
| ajuste_manual | sin validación |
| evento_diferido | hereda contexto del parent |

3. Si la cuenta tiene rol requerido: valida que esté en estado `activo` en `cuenta_roles`. Si no: error explícito.
4. Pasa el `tipo_actor` validado a `resolver_fee_aplicable`.
5. Calcula `monto_plataforma` según `tipo_calculo`.
6. Aplica decisión H (descuentos) si aplica.
7. Calcula `monto_payout = bruto - kushki_fee - plataforma`.
8. Snapshotea `fee_calculo_detalle` con `tipo_actor_resuelto`.
9. INSERT en `eventos_economicos` con `estado='pendiente_liquidar'`.

#### Devengo de cita — IMPLEMENTADO (S54, variante (b))

El primer `origen_tipo` con circulación real. El ciclo completo en DB
(migraciones S54, aplicadas y versionadas en el monorepo):

- **`crear_bloqueo_agenda`** crea el HOLD: la cita nace `estado='pendiente'`
  + `estado_reserva='pendiente_pago'` + `expira_en = now()+15min`, con
  SNAPSHOT del precio de la oferta (`cita.precio` — el checkout jamás
  re-resuelve). Invisible al prestador (verdad firme). Expiración
  PEREZOSA: toda lectura/escritura trata un hold vencido como
  inexistente; el cron `expirar-citas-pendientes` es higiene, no
  correctitud. Invariante del catálogo: `estado_reserva='pagada'` ⟺ la
  cita pasó por `confirmar_cita_pagada` (único escritor de ese valor;
  NULL = ciclo de pago no aplica, legacy/walk-in).
- **`confirmar_cita_pagada`** (el pago — hoy simulado): PRE-VALIDA el
  motor SIN insertar (cuenta existe, **`estado='activa'`** → error
  `cuenta_no_activa`, rol `prestador_servicios` activo en
  `cuenta_roles`, `resolver_fee_aplicable` devuelve config) y
  transiciona `pendiente→confirmada` + `pendiente_pago→pagada` en el
  MISMO UPDATE, guardando el timestamp del pago en
  `metadata.pagado_en` (hasta Kushki real).
- **`cerrar_paseo_con_calidad`** (y toda RPC de cierre futura de
  familias con cita): tras completar el turno, si
  `estado_reserva='pagada'` crea el evento económico vía
  `crear_evento_economico` con `tipo_evento='cita_pagada'`,
  `fecha_devengo = now()` (el cierre), `fecha_cobro_kushki =
  metadata.pagado_en` (el pago), `monto_kushki_fee = 0` +
  `metadata.pago_simulado = true` mientras el pago sea simulado, y
  guard anti-duplicado por (origen_tipo, origen_id, tipo_evento).
  Cita legacy (reserva NULL) → cero evento, cero error. Si el motor
  rebota, el cierre entero vuelve atrás — jamás atención cerrada sin
  su devengo ni ledger a medias.

#### `generar_liquidacion(...)` — SECURITY DEFINER

Consolida eventos pendientes de una cuenta + país + período. Anti-solapamiento integrado. Aplica saldo_arrastre.

#### `aplicar_reembolso(...)` — SECURITY DEFINER

Crea evento inverso con montos negativos. Soporta total y parcial.

#### `generar_eventos_diferidos(fecha_corte)` y `cancelar_eventos_diferidos_pendientes(...)`

Para devengos diferidos (seguros, futuro). Sin scheduler activo.

#### `validar_origen_evento()` — trigger validador polimórfico

#### `audit_fee_configs()` — trigger auditoría

### 4.4 Vistas helper

- `v_eventos_con_origen` — enriquece eventos con datos del origen polimórfico.
- `v_eventos_resumen_cuenta` — resumen por cuenta_comercial con `roles_activos` array.
- `v_revenue_plataforma_periodo` — revenue por mes/país/stream/tipo.
- `v_liquidaciones_pendientes_pago` — liquidaciones aprobadas no pagadas con `roles_activos` array.

### 4.5 RLS aplicado

Todas las tablas con RLS activo. Owner ve lo suyo, admin ve todo. Funciones del módulo con grants restrictivos (sin anon, sin PUBLIC).

`refugios` además tiene policy de lectura pública para refugios aprobados (catálogo).

**Nota de seguridad (S54):** las funciones core de escritura
(`crear_evento_economico`, `generar_liquidacion`, `aplicar_reembolso`)
quedaron **sin EXECUTE de `authenticated`** — invocables SOLO vía
puertas SECURITY DEFINER gateadas (hoy: el ciclo de cita) o
service_role. Las 4 vistas helper corren con **`security_invoker`**
(la RLS subyacente es la puerta: el owner ve lo suyo, admin todo) y sin
grants de anon. **L-140 rige toda función futura**: los default
privileges del proyecto ya no otorgan EXECUTE a anon ni a PUBLIC en el
CREATE; toda migración que cree una función declara su REVOKE/GRANT
explícito y la verificación incluye `pg_proc.proacl`.

### MIG-L — Refactor datos_bancarios + UPSERT user_roles + catálogos (9 Mayo 2026)

**Schema agregado:**
- Tablas catálogo: `cat_paises`, `cat_bancos`, `cat_tipos_documento_titular`.
- Columna `metadata jsonb NOT NULL DEFAULT '{}'` en `prestadores`.

**Constraints modificados:**
- `chk_datos_bancarios_validos` actualizado a 7 keys (de 5).
- UNIQUE(country_code, identificacion_fiscal) en cuentas_comerciales.

**Funciones SQL agregadas:**
- `get_paises_activos`, `get_pais_detalle`, `get_paises_para_telefono`.
- `get_bancos_activos_por_pais`, `get_tipos_documento_titular_por_pais`.
- `validar_identificacion_fiscal`, `verificar_identificacion_disponible`.
- `crear_cuenta_comercial_inicial`, `crear_prestador_inicial`.
- `wizard_crear_cuenta_y_rol` (refactorizada con UPSERT user_roles).
- `actualizar_datos_bancarios`, `actualizar_datos_fiscales_cuenta`.
- `insertar_documentos_batch`.

**Funciones TS agregadas:**
- Wrappers en src/lib/ (paises, bancos, cuentaComercial, wizardApi, documentos, etc.).

**Storage:**
- Bucket `prestador-documentos` con policy `prestador_archivos_propios`.

**Tono:**
- Migración voseo → tuteo neutro completa en SQL y TS.

**Estado de tablas al 9 Mayo 2026:**
- `cuentas_comerciales`: 1 fila (satorilatam, real).
- `prestadores`: 1 fila (satorilatam).
- `cat_paises`: 23 filas, 1 activa (EC).
- `cat_bancos`: 17 filas (Ecuador).
- `cat_tipos_documento_titular`: 3 filas (Ecuador).
- `user_roles WHERE role='prestador'`: 1 fila activa (satorilatam).
- DB con 122 auth.users (mantenidos sin tocar).

---

## 5. Decisiones de modelo cerradas (no re-debatir sin data nueva)

### Decisión A — Cuenta comercial es entidad fiscal independiente del profile
Una persona puede tener N cuentas comerciales (multi-país, una por país).

### Decisión B — Liquidación única por cuenta+país+período
Consolida todos los roles activos del actor, con desglose interno usando `tipo_actor_resuelto`. Una sola transferencia bancaria.

### Decisión C — Fee config flexible
Soporta porcentual, fijo, escalonado, passthrough_kushki, personalizado.

### Decisión D — Donaciones passthrough manual en v1
Sin cambios.

### Decisión E — Criaderos modelo flexible
Suscripción + publicación + boost coexisten.

### Decisión F — Aseguradoras devengo diferido
Sin cambios.

### Decisión G — Multi-país = una cuenta por país
Una cuenta por país. Una cuenta puede tener N roles, todos en el mismo país.

### Decisión H — Cupones configurables
Default plataforma absorbe (comisión sobre precio lista).

### Decisión I — Una entidad fiscal = una cuenta comercial multi-rol
Cualquier humano o empresa con un mismo RUC/DNI + país tiene una sola cuenta comercial.

### Decisión J — Integración VTEX preparada en schema, sin compromiso operativo
`seller_perfil` tiene 8 columnas VTEX-específicas, todas nullable.

### Decisión K — Multi-sede para prestadores
Un humano puede gestionar N sedes operativas de su misma cuenta_comercial.

### Decisión L — Datos fiscales solo en `cuentas_comerciales`
Las 4 tablas operativas no contienen datos fiscales. Esos datos viven SOLO en `cuentas_comerciales`.

### Decisión M (NUEVA v2.2) — Esquema oficial de `datos_bancarios` (Opción A — uniforme)
El jsonb `datos_bancarios` tiene estructura uniforme entre países. En v2.3 extendido a 7 claves obligatorias (banco_codigo, banco_nombre, tipo_cuenta, numero_cuenta, titular_nombre, titular_tipo_documento, titular_documento). Validación de formato específico por país queda en frontend del wizard. CHECK constraint `chk_datos_bancarios_validos` valida estructura mínima cuando la cuenta está en `activa` o `suspendida`.

### Decisión N (NUEVA v2.3) — Catálogos de bancos por país (`cat_bancos`)
Los bancos válidos por país viven en tabla `cat_bancos` con FK a `cat_paises`. El wizard usa esta tabla para el dropdown del Paso 5. Decisión: cada país tiene su propio set de bancos manualmente curados. Para Ecuador v1: 17 bancos tier 1→4. Cuando se agregue Colombia, se popla cat_bancos con bancos colombianos.

Implicancia: el campo `banco_codigo` en `datos_bancarios` debe ser uno del catálogo activo del país. Validación en wizard frontend + validación en función SQL `actualizar_datos_bancarios`.

### Decisión O (NUEVA v2.3) — Tipos de documento del titular bancario por país (`cat_tipos_documento_titular`)
Los tipos de documento válidos para el titular bancario (que puede ser distinto del titular de la cuenta_comercial) viven en `cat_tipos_documento_titular` con FK a `cat_paises`. Cada tipo tiene `mascara_validacion` regex que se aplica en el frontend del wizard.

Para Ecuador v1: 3 tipos (CEDULA `^\d{10}$`, RUC `^\d{13}$`, PASAPORTE `^[A-Z0-9]{6,12}$`).

Implicancia: el campo `titular_tipo_documento` en `datos_bancarios` debe ser uno del catálogo activo del país.

### Decisión P (NUEVA v2.3) — Asignación de rol vía UPSERT idempotente en wizard
La función `wizard_crear_cuenta_y_rol` ahora hace UPSERT en `user_roles` con `ON CONFLICT (user_id, role, country_code) DO UPDATE SET is_active = true`. Esto:
- Asigna rol `prestador` automáticamente al completar wizard (resuelve gap arquitectural previo).
- Es idempotente: si el rol ya existe activo, no causa error.
- Reactiva: si el rol existe pero está inactivo, lo reactiva.

Esta decisión NO depende de admin (a diferencia de la activación de la cuenta_comercial que sí requiere validación admin). El user recién registrado puede entrar al portal-prestadores inmediatamente después del wizard, aunque verá `/onboarding-espera` hasta que admin active la cuenta.

### Decisión Q (NUEVA v2.4, founder S54) — Rol activo NO basta para cobrar: cuenta ACTIVA
Para cobrar por la plataforma no alcanza el rol activo en `cuenta_roles`: la cuenta comercial debe estar en `estado='activa'` (validación admin cumplida, §7.11). La pre-validación del pago rebota `cuenta_no_activa`, y **ningún listado del producto oferta prestadores cuya cuenta no esté activa** — ofertar a quien no puede cobrar es prometer un pago que va a rebotar. Implementación: `confirmar_cita_pagada` + `obtener_paseadores_disponibles` + `obtener_oferta_paseo` (server-side: la RLS de `cuentas_comerciales` es solo-owner y el filtro no puede vivir en el cliente).

### Decisión R (NUEVA v2.4) — Devengo de cita en variante (b)
El evento económico de una cita nace al CERRAR CON CALIDAD (condición de liquidación), no al pagar: `fecha_devengo` = cierre, `fecha_cobro_kushki` = pago. El pago pre-valida y registra (`estado_reserva='pagada'` + `metadata.pagado_en`); el cierre devenga. Detalle operativo en §4.3.

### Decisión S (NUEVA v2.5, founder S55) — El plan de paseo cobra por período mensual: un pago, N devengos
El PLAN (recurrencia de paseo, `MODELO_PASEO.md` §6) cobra **UN pago por PERÍODO MENSUAL**: al contratar y en cada renovación. Contratar 3 meses = 3 cobros mensuales, JAMÁS un cobro junto. El **descuento por volumen lo configura el prestador** (precio del plan vs. precio del bloque suelto). El **precio unitario efectivo** — total del período ÷ N citas del período — es la **base del devengo de cada cita**: la variante (b) queda INTACTA (un pago, N devengos; cada evento económico nace cita por cita al cerrar con calidad; el pago del período jamás toca el ledger). **Auto-renovación** con aviso previo de 72 h y pausa de un toque; un período no renovado no deja nada que reversar (el devengo solo existe por cierre); lo pagado sin ejecutar se rige por P14. Mientras Kushki real no exista, el cobro del período es **simulado y declarado** — mismo contrato de estados.

### Decisión T (NUEVA v2.6, founder S56) — El paquete de salidas: un pago, N devengos FIFO, no-show devenga, breakage declarado

- El paquete (`MODELO_PASEO.md` §6bis — bono anclado al prestador) cobra **UN pago al comprarse** (simulado y declarado hasta Kushki real — mismo contrato de estados que la cita suelta y el plan). El pago del paquete **JAMÁS toca el ledger** (variante (b) intacta).
- **Precio unitario efectivo del paquete** = total pagado ÷ N salidas. Es la base del devengo de cada salida.
- **Devengo por salida, dos cierres legales:**
  - `cierre_con_calidad` (el de siempre, Decisión R), o
  - `cierre_no_show` (NUEVO): reserva confirmada no cumplida por el dueño sin cancelación ≥2 h — devenga al paseador igual que un cierre normal (su franja se bloqueó de verdad). El evento nace al cierre, como siempre: no hay tercera vía.
- **FIFO con precio de origen:** con rollover, cada salida consumida devenga al precio unitario del paquete en que NACIÓ (las viejas primero). Implementación: decisión técnica de Code con doble check.
- **Salidas VENCIDAS (nunca reservadas, paquete no renovado):** **revenue de plataforma, DECLARADO** — breakage explícito, línea propia en el modelo (`tipo_evento` propio, sin payout). El paseador no cobra lo que nunca trabajó ni reservó; el dueño conoció la vigencia al comprar.
- **Rollover:** comprar un paquete nuevo antes del vencimiento suma el saldo anterior. No es reversa ni reembolso: es transferencia de saldo (movimiento interno del bono, sin evento económico).
- **Reembolsos/fallas del prestador:** P16 rige; el reembolso proporcional usa `aplicar_reembolso()` sobre lo COBRADO (patrón 7.14), jamás toca devengos inexistentes.

### Decisiones adicionales (sin cambios)
- White-label marketplace de fachada.
- Off-platform no se cobra.

---

## 6. Decisiones DOCUMENTADAS pero PENDIENTES de implementación activa

### 6.1 Retenciones fiscales por país (TODO)
Campo presente en `liquidaciones`. Motor de cálculo sin implementar. Sprint planificado: post soft launch.

### 6.2 Holdback / reserva por disputas (TODO)
Campos presentes. Lógica activa solo si parámetros explícitos > 0.

### 6.3 Saldos negativos del actor (parcialmente implementado)
Campo `saldo_arrastre` activo. Falta UI admin para visualización.

### 6.4 Auditoría de fee_configs (implementada y activa)
Trigger funcional. Tabla `fee_configs_historial` registrando.

### 6.5 Onboarding/registro UX (TODO — CRÍTICO)
Pendiente con prioridad alta: flujo UX de registro coordinado.

Flujo correcto (crítico que se respete):

**Para todos los wizards de actores (prestadores, seller, refugio, criadero):**

1. Pedir identificación fiscal y país AL INICIO.
2. Consultar si la entidad fiscal ya existe por (`identificacion_fiscal`, `country_code`):
   - Si existe: pre-llenar todos los datos comunes, NO pedir RUC ni razón social ni datos bancarios. Solo pedir info específica del rol nuevo. Agregar fila en `cuenta_roles` para el nuevo rol.
   - Si no existe: crear cuenta_comercial con `estado='pendiente_validacion'` y `datos_bancarios={}` o parcial. Pedir datos al usuario UNA SOLA VEZ. Agregar primera fila en `cuenta_roles`.
3. NO setear `estado='activa'` desde el wizard. Eso lo hace admin después de revisar documentación.

**Para portal-prestadores específicamente:**

Después de identificar/crear la cuenta_comercial y agregar rol `prestador_servicios`:
- Verificar si la cuenta ya tiene sedes registradas (`SELECT count(*) FROM prestadores WHERE cuenta_comercial_id = X`).
- Si es la primera sede: preguntar nombre operativo mostrando el nombre comercial de la cuenta como sugerencia ("¿el nombre de tu sede es 'Veterinaria Don Pepe'?"). Sí/No, completar si no.
- Si quiere agregar otra sede: pedir nombre operativo nuevo. La validación `UNIQUE(cuenta_comercial_id, nombre_comercial)` evita duplicados accidentales.

**Tooltip recomendado del wizard al pedir datos bancarios** (sección 4.1).

**Validación frontend recomendada por país** (no obligatoria en backend):
- Ecuador: numero_cuenta 10 dígitos, banco dropdown con bancos ecuatorianos, validar cédula (10) o RUC (13).
- Colombia: longitud variable según banco, dropdown con bancos colombianos, validar tipo de documento (CC, CE, NIT, PEP).

### 6.6 Cron de eventos diferidos (NO activo)
Función lista. Sin scheduler.

### 6.7 Migración a Kushki Marketplace (futuro)
Schema soporta `kushki_subaccount_id`. Hoy NULL.

---

## 7. Reglas de implementación obligatorias

### 7.1 Cómo se crea un evento económico
Solo vía `crear_evento_economico()`. NUNCA INSERT directo a `eventos_economicos`.

### 7.2 Cómo se genera una liquidación
Solo vía `generar_liquidacion()`.

### 7.3 Cómo se aplica un reembolso
Solo vía `aplicar_reembolso()`.

### 7.4 Cómo se cambia un fee
UPDATE permitido en `fee_configs` (con auditoría automática). Eventos viejos no se recalculan.

### 7.5 Cómo se crea una cuenta comercial
INSERT directo permitido. Empieza en `pendiente_validacion`. Admin valida y activa.

**Importante:** crear cuenta comercial NO crea automáticamente roles. Después del INSERT, hay que insertar al menos una fila en `cuenta_roles`.

### 7.6 Cómo se agrega un rol a una cuenta existente
INSERT directo en `cuenta_roles`. UNIQUE constraint impide duplicar roles.

### 7.7 Cómo se suspende un rol sin cerrar la cuenta
UPDATE en `cuenta_roles` con `estado='suspendido'`. La cuenta sigue activa, los otros roles también.

### 7.8 Cómo se borra algo
**No se borra.** Eventos, liquidaciones, cuentas comerciales, roles: nunca DELETE en producción. Usar estados.

### 7.9 Datos fiscales SOLO en `cuentas_comerciales`
Las tablas operativas NUNCA replican RUC, razón social, datos bancarios, identificación fiscal. JOIN cuando se necesite mostrar.

### 7.10 Multi-sede para prestadores
Un mismo `user_id` puede tener N filas en `prestadores`. Liquidación por `cuenta_comercial_id`, no por `user_id`.

### 7.11 Activación de cuenta comercial (NUEVO v2.2)
NO se puede crear directamente una cuenta en `estado='activa'` desde un wizard. La activación requiere UPDATE simultáneo de `estado` y `activado_en`:

```sql
UPDATE cuentas_comerciales 
SET estado = 'activa', activado_en = now()
WHERE id = $1;
```

Esto debe hacerlo admin después de validar documentación. Si los datos bancarios no están completos al momento de la transición, el constraint `chk_datos_bancarios_validos` la frena.

### 7.12 Esquema de `datos_bancarios` (NUEVO v2.2)
El jsonb `datos_bancarios` tiene estructura uniforme entre países (decisión M). Cualquier código que escriba ese campo debe respetar las 5 claves obligatorias (banco, tipo_cuenta, numero_cuenta, titular_nombre, titular_documento) cuando la cuenta esté en `activa` o `suspendida`. Estructura específica por país va en `metadata` opcional.

### 7.13 Cobrar y ofertarse exigen cuenta ACTIVA (NUEVO v2.4 — Decisión Q)
Toda puerta de pago pre-valida `cuentas_comerciales.estado='activa'` (error `cuenta_no_activa`) ADEMÁS del rol activo, y todo listado de prestadores cobrables filtra por cuenta activa, server-side. El devengo de cita sigue la variante (b): el evento nace al cerrar con calidad, jamás al pagar (Decisión R, §4.3).

### 7.14 El plan cobra por período; el devengo sigue siendo por cita (NUEVO v2.5 — Decisión S)
Ninguna implementación del plan cobra multi-período junto ni crea eventos económicos al cobrar el período. El cobro mensual del plan se registra como PAGO (estado/metadata, patrón de la cita suelta); cada cita del plan devenga sola al cerrar con calidad, con el precio unitario efectivo del período como `monto_bruto`. Saltos, fallas, créditos y reembolsos proporcionales se rigen por `POLITICAS_EPETPLACE.md` P14 — el reembolso proporcional usa `aplicar_reembolso()` sobre lo COBRADO, jamás toca devengos inexistentes.

### 7.15 El paquete paga al comprar, devenga al cerrar, y el no-show ES un cierre (NUEVO v2.6 — Decisión T)

Ninguna implementación del paquete crea eventos económicos al comprar, al reservar ni al cancelar en ventana. Solo los dos cierres devengan (`cierre_con_calidad` / `cierre_no_show`), cada uno con el precio unitario FIFO de origen como `monto_bruto`. El vencimiento genera el evento de breakage (plataforma, sin payout) al cierre del período — vía `crear_evento_economico()`, como todo.

**Comisión visible al configurar precio (regla transversal, founder S56):** toda superficie donde el prestador ponga precio muestra el NETO que recibirá descontando la comisión vigente — que se LEE de `fee_configs` (paseo F1: 15%), jamás se hardcodea. El día que el fee cambie, la pantalla dice la verdad sola.

---

## 8. Casos especiales — cómo el modelo los resuelve

### 8.1 Donación de $50 a refugio
- Evento: `tipo_evento='donacion_recibida'`, `revenue_stream='passthrough'`.
- Cuenta tiene rol `refugio` activo.
- `tipo_calculo='passthrough_kushki'`. Si Kushki es 3.5% + $0.30:
  - `monto_kushki_fee = 2.05`, `monto_plataforma = 0`, `monto_payout = 47.95`.

### 8.2 Cita con cupón de $20 financiado por plataforma
- Cliente paga $80 efectivos por cita de $100.
- Comisión 15% del prestador sobre $100 (precio lista) = $15.
- Plataforma absorbe $20 del cupón → revenue plataforma = 15 - 20 = -5.
- Payout al prestador = 100 - 15 = $85.

### 8.3 Criadero con suscripción $30/mes + boost de cría $5
Dos eventos económicos separados, ambos sin payout (revenue puro plataforma).

### 8.4 Seguro anual de $360 con comisión 15% (devengo diferido)
- Evento parent: `monto_bruto=360`, `monto_plataforma=0`, `metadata.devengo_diferido=true`.
- Cron mensual crea hijos: `monto_plataforma=4.50`, `cohorte_periodo='mes_N'`.
- Cancelación en mes 5: `cancelar_eventos_diferidos_pendientes()` reversa hijos pendientes.

### 8.5 Reembolso de pedido ya liquidado
- `aplicar_reembolso()` crea evento inverso con montos negativos.
- Original cambia a `estado='reversado'`.
- Inverso entra a próxima liquidación → se descuenta del payout siguiente.

### 8.6 Multi-empleado en clínica
- Cita la completa empleado X en una sede específica.
- Evento económico: `cuenta_comercial_id` = la del dueño.
- `metadata.empleado_id = X` para reportes internos.

### 8.7 Carrito mixto del cliente final

**Caso A — Dos sellers DISTINTOS:**
Distintos RUCs → dos eventos → dos liquidaciones → dos transferencias.

**Caso B — Productos Y servicios del MISMO actor:**
Mismo RUC → dos eventos (uno como `seller_productos`, otro como `prestador_servicios`) → **una sola liquidación consolidada** con desglose interno por rol.

### 8.8 Venta directa de e-PetPlace (wearables)
Cuenta_comercial interna con rol `plataforma_directa`. Revenue completo va a la plataforma. Payout interno = 0.

### 8.9 Persona natural pequeña vendiendo
Humano sin empresa con DNI como `identificacion_fiscal`. Crea cuenta_comercial `tipo_fiscal='persona_natural'`. Si después se constituye como SAS, crea NUEVA cuenta_comercial.

### 8.10 Pedido VTEX con múltiples sellers
VTEX webhook desglosa por vendor. e-PetPlace genera N eventos económicos. Liquidaciones separadas por cuenta_comercial.

### 8.11 Refugio que también opera como seller
ONG con RUC único, cuenta con rol `refugio` activo + agrega rol `seller_productos` para vender merchandising. Una liquidación mensual única consolidando todo.

### 8.12 Multi-sede para prestador
Don Pepe con sedes en Quito y Guayaquil bajo la misma cuenta_comercial: dos filas en `prestadores`, mismo `user_id`, mismo `cuenta_comercial_id`, distinto `nombre_comercial`. Una sola liquidación consolidada.

### 8.13 Wizard guarda progreso parcial de datos bancarios (NUEVO v2.2)
Usuario está completando el wizard de prestador. Llenó RUC y razón social pero todavía no tiene a mano los datos del banco.

Flujo:
1. Wizard hace INSERT en cuenta con `estado='pendiente_validacion'` y `datos_bancarios={}`.
2. Usuario sigue navegando, cierra el wizard.
3. Después vuelve, completa datos bancarios. Wizard hace UPDATE de `datos_bancarios` con todos los campos. La cuenta sigue en `pendiente_validacion`.
4. Admin revisa documentos. Cuando aprueba, ejecuta `UPDATE estado='activa', activado_en=now()`. Si los datos están completos, la transición pasa. Si no, falla y admin sabe que debe pedir completar.

Este flujo está soportado por el CHECK constraint `chk_datos_bancarios_validos` que solo exige completitud cuando el estado es activa o suspendida.

### 8.14 Wizard v2 con multi-rol existente (NUEVO v2.3)
Caso: usuario ya tiene rol pet_parent (registrado en otro portal del ecosistema) y quiere registrarse como prestador.

Flujo:
1. User entra a /registro del portal-prestadores.
2. Paso 1: intenta signup con su email existente. Supabase responde "user already registered".
3. Wizard muestra error con botón "Inicia sesión para continuar" → `/login?next=/registro`.
4. Login.tsx detecta `next=/registro` → bypassea verificación de rol prestador → redirige a /registro con sesión activa.
5. Paso 1 detecta sesión activa → muestra "Continuemos" → user avanza al wizard normalmente.
6. PasoFinal hace UPSERT en user_roles → user queda con AMBOS roles activos (pet_parent + prestador).

El user mantiene su rol pet_parent intacto. No se borra nada. Multi-rol soportado.

---

## 9. Diagrama de flujo de plata (Kushki básico)

```
Cliente final paga $100 vía Kushki
        │
        ▼
Kushki cobra fee → recibe $96.50 la cuenta master de e-PetPlace
        │
        ▼
Trigger / Webhook / Hook → llama crear_evento_economico()
  - Función deriva tipo_actor del origen_tipo
  - Valida rol activo en cuenta_roles
  - Resuelve fee aplicable
  - Snapshotea fee_calculo_detalle con tipo_actor_resuelto
  - INSERT en eventos_economicos con estado='pendiente_liquidar'
        │
        ▼
[Cada cierto período] Admin invoca generar_liquidacion()
  - Consolida TODOS los eventos pendientes de la cuenta+país+período
  - Crea cabecera + puente + UPDATE eventos a liquidado
        │
        ▼
Admin aprueba liquidación → estado='aprobado'
        │
        ▼
Admin transfiere ÚNICA al actor (consolidando todos los roles y sedes)
  - Sube comprobante
  - Marca estado='pagado', pagado_en=now()
        │
        ▼
Eventos auditables, conciliables, reportables — con desglose por rol
```

---

## 10. Setup actual de la DB (estado a 8 Mayo 2026 v2.2)

### Seeds activos en `fee_configs`
6 reglas default con `vigencia_desde = 2026-01-01`:
- EC + seller_productos + transaccional + pedido = 14% porcentual
- EC + prestador_servicios + transaccional + cita = 15% porcentual
- EC + refugio + passthrough + donacion = passthrough_kushki (3.5% + 0.30)
- (Mismas 3 para CO)

### Tablas vacías esperando datos reales
Todas las tablas operativas en 0 filas. fee_configs_historial preserva 12 entradas de auditoría histórica.

### CHECK constraints activos en cuentas_comerciales
- `chk_estado_consistente` (preexistente desde v1)
- `chk_datos_bancarios_validos` (nuevo v2.2)

---

## 11. Plan de implementación — sprints sin deuda

| Sprint | Alcance | Cierra cuando |
|---|---|---|
| 3.1.A | UI admin + wizards de portales para registro multi-rol y multi-sede con esquema oficial de datos_bancarios | Wizards detectan cuenta existente, agregan roles, gestionan sedes, guardan progreso parcial |
| 3.1.B.1 | Wiring de pedidos pagados → crear_evento_economico | Trigger en pedidos genera evento automático |
| 3.1.B.2 | Wiring de revenue puro plataforma | Triggers correspondientes activos |
| 3.1.B.3 | Wiring de citas pagadas — **✅ EJECUTADO (S54, variante (b))**: el flujo de cobro vive en el app móvil con pago SIMULADO declarado (`metadata.pago_simulado=true`, kushki_fee=0); el evento nace al cerrar con calidad. Kushki REAL pendiente sobre el mismo contrato de estados | ~~Cuando flujo de cobro de cita exista en app v2~~ Ejecutado 11 Jul 2026 |
| 3.1.B.4 | Wiring de donaciones a refugios | Cuando módulo de donaciones se construya |
| 3.1.C | UI admin de liquidaciones consolidadas con desglose por rol y sede | Liquidaciones muestran detalle correcto |
| 3.1.D | Portal-prestadores: vista de Liquidaciones con desglose | Prestador ve liquidaciones reales |
| 3.1.E.1 | Endpoints REST para integración VTEX | Endpoints documentados y testeados con mocks |
| 3.1.E.2 | Activación de integración con MediaLab | Tests conjuntos pasados, integración productiva |
| 3.1.F | Construcción del portal de refugios | Refugios pueden operar end-to-end |
| 3.1.G | Holdback + retenciones fiscales | Liquidaciones aprobadas calculan retención |
| 3.1.H | Migración a Kushki Marketplace | Cuando Kushki firme |

---

## 12. Lo que este documento NO resuelve

- Política operativa de saldos negativos persistentes.
- Mecanismo de notificaciones a actores sobre liquidaciones.
- Política de holdback por tipo_actor.
- Matriz fiscal completa EC y CO (depende de contador).
- Pricing exacto de productos comerciales.
- ~~UX del flujo de cobro de cita en app.~~ **Resuelta v1-SIMULADA (S54):** momento-primero (CUÁNDO→QUIÉN) + hold 15 min + checkout mono-ítem con pago simulado declarado y camino triste digno. Lo que sigue sin resolver acá es el cobro REAL (Kushki) sobre ese mismo flujo.
- Diseño de la integración VTEX con MediaLab (ver documento separado).
- UI de gestión de sedes en portal-prestadores.

---

## 13. Glosario

- **GMV** (Gross Merchandise Value): monto bruto pagado por clientes.
- **Take rate**: porcentaje que la plataforma cobra de comisión.
- **Devengo**: momento contable en que se gana el revenue.
- **Holdback**: % retenido temporalmente para cubrir disputas/reembolsos.
- **Clawback**: reversa de revenue ya devengado cuando se cancela una transacción.
- **Cohorte**: grupo de eventos del mismo período de devengo.
- **Subaccount Kushki**: cuenta secundaria en Kushki Marketplace para split automático.
- **Snapshot de fee**: captura del cálculo aplicado al momento del devengo, no recalculable.
- **Polimórfico**: relación tipo+id sin FK formal, validada por trigger.
- **Cuenta comercial multi-rol**: una `cuenta_comercial` con N roles activos en `cuenta_roles`.
- **tipo_actor_resuelto**: rol bajo el cual se cobró un evento específico, snapshotted en `fee_calculo_detalle`.
- **Liquidación consolidada**: liquidación única que agrupa eventos de múltiples roles y/o sedes del mismo actor.
- **Multi-sede**: un `user_id` puede tener N filas en `prestadores`, una por cada sede operativa.

---

## 14. Cómo modificar este documento

Este documento es el contrato técnico-conceptual del motor financiero. Cambiarlo implica:

1. Justificar el cambio en una sesión de diseño con notas escritas.
2. Validar contra el schema actual.
3. Aplicar cambios al schema con bloques chicos y verificación.
4. Actualizar este documento.
5. **Sincronizar manualmente a los 3 repos del ecosistema** (admin, prestadores, app v2).

**No se hacen cambios "rápidos" al schema financiero sin pasar por este documento.**

---

## 15. Cambios entre versiones

### v2.6 (12 Jul 2026 — S56, post v2.5)

**Decisiones nuevas:**
- Decisión T — el paquete de salidas (bono anclado, `MODELO_PASEO.md` §6bis): un pago al comprarse que jamás toca el ledger; precio unitario efectivo (total ÷ N salidas) como base del devengo; dos cierres legales (`cierre_con_calidad` / `cierre_no_show` — el no-show devenga porque la franja se bloqueó de verdad); FIFO con precio de origen en rollover; salidas vencidas = breakage declarado (revenue de plataforma, `tipo_evento` propio, sin payout); rollover = transferencia de saldo sin evento económico; P16 rige reembolsos/fallas vía `aplicar_reembolso()` sobre lo cobrado.

**Reglas nuevas (sección 7):**
- 7.15 — el paquete paga al comprar, devenga al cerrar, el no-show ES un cierre; el breakage nace vía `crear_evento_economico()`; y la regla transversal de **comisión visible**: todo neto mostrado al prestador se calcula con el fee LEÍDO de `fee_configs`, jamás hardcodeado.

**Documentos gemelos del paquete (firmados juntos, founder S56):**
- `MODELO_PASEO.md` v1.2 (§6.1 continuidad por día de semana; §6bis el paquete; §6ter escenarios de disponibilidad).
- `POLITICAS_EPETPLACE.md` v1.4 — P16 (reservas, no-show, rollover y vencimiento del paquete).

### v2.5 (11 Jul 2026 — S55-B5, post v2.4)

**Decisiones nuevas:**
- Decisión S — el plan de paseo cobra por período mensual: un pago al contratar y en cada renovación (jamás multi-período junto); descuento por volumen del prestador; precio unitario efectivo (total período ÷ N citas) = base del devengo; variante (b) intacta (un pago, N devengos, cada evento al cerrar con calidad); auto-renovación con aviso 72 h y pausa de un toque; período no renovado = nada que reversar; simulado declarado hasta Kushki real.

**Reglas nuevas (sección 7):**
- 7.14 — el plan cobra por período, el devengo sigue por cita; P14 rige créditos/reembolsos proporcionales sobre lo cobrado.

**Documentos gemelos del paquete (firmados juntos, S55-B5):**
- `MODELO_PASEO.md` v1.1 (UX del plan: chip "Hacerlo frecuente", Hoja L-D, hub "Mis paseos"; continuidad de paseador firmada).
- `POLITICAS_EPETPLACE.md` v1.3 — P14 (saltos, fallas, pausa y plata del plan).

### v2.4 (11 Jul 2026 — S54, post v2.3)

**Implementado (primera circulación real del motor):**
- Devengo de cita en **variante (b)** — el evento nace en `cerrar_paseo_con_calidad` si `estado_reserva='pagada'`; `fecha_devengo`=cierre, `fecha_cobro_kushki`=pago (`metadata.pagado_en` hasta Kushki real); `confirmar_cita_pagada` PRE-valida sin escribir el ledger. Nueva subsección en §4.3.
- Hold de agenda 15 min (esqueleto v2 formalizado: `estado` = ciclo de cita, `estado_reserva` = ciclo de pago con CHECK e invariante; expiración perezosa + cron de higiene).
- Sprint 3.1.B.3 EJECUTADO en modalidad simulada declarada (`metadata.pago_simulado=true`, `monto_kushki_fee=0`).

**Decisiones nuevas:**
- Decisión Q — rol activo NO basta: cobrar y ofertarse exigen cuenta ACTIVA (`cuenta_no_activa`; listados filtran server-side).
- Decisión R — devengo de cita en variante (b).

**Reglas nuevas (sección 7):**
- 7.13 — cuenta activa para cobrar/ofertarse.

**Seguridad (nota nueva en §4.5):**
- Funciones core de escritura sin EXECUTE de `authenticated` (solo puertas DEFINER gateadas / service_role); vistas helper con `security_invoker`; L-140 (default privileges sin anon/PUBLIC) rige toda función futura.

**Documentación:**
- §12: "UX del flujo de cobro de cita" pasa a resuelta-v1-simulada (queda el cobro REAL).

### v2.3 (9 Mayo 2026, post v2.2)

**Schema modificado:**
- `datos_bancarios` schema oficial pasa de 5 a 7 keys (agrega `banco_codigo`, `banco_nombre`, `titular_tipo_documento`).
- CHECK constraint `chk_datos_bancarios_validos` actualizado.
- `prestadores.metadata jsonb` agregada.

**Schema agregado:**
- 3 tablas catálogo: `cat_paises`, `cat_bancos`, `cat_tipos_documento_titular`.
- 14 funciones SQL del wizard.

**Funciones modificadas:**
- `wizard_crear_cuenta_y_rol`: ahora hace UPSERT idempotente en user_roles (cierra bug histórico).

**Decisiones nuevas:**
- Decisión N — Catálogos de bancos por país.
- Decisión O — Tipos de documento del titular bancario por país.
- Decisión P — Asignación de rol vía UPSERT idempotente en wizard.

**Casos nuevos:**
- 8.14 — Wizard v2 con multi-rol existente.

### v2.2 (8 Mayo 2026, post v2.1)

**Schema agregado:**
- CHECK constraint `chk_datos_bancarios_validos` en `cuentas_comerciales` (MIG-K).

**Decisiones nuevas:**
- Decisión M — Esquema oficial de `datos_bancarios` (Opción A uniforme).

**Casos nuevos:**
- 8.13 — Wizard guarda progreso parcial de datos bancarios.

**Reglas nuevas (sección 7):**
- 7.11 — Activación de cuenta comercial (interacción de los 2 CHECKs).
- 7.12 — Esquema de `datos_bancarios`.

**Documentación oficial nueva (sección 4.1):**
- Estructura oficial del jsonb `datos_bancarios`.
- Definición formal de los 2 CHECK constraints encadenados.
- Flujo correcto del wizard documentado.
- Tooltip recomendado.

### v2.1 (8 Mayo 2026, post v2.0)

**Schema removido:**
- `prestadores.ruc` y `prestadores.razon_social`.
- `prestadores_user_id_key` UNIQUE constraint.
- `donaciones.refugio` (text suelto).

**Schema agregado:**
- `donaciones.refugio_id` FK SET NULL → refugios.
- `prestadores` UNIQUE compuesto `(cuenta_comercial_id, nombre_comercial)`.
- `prestadores` índice no-unique en `user_id`.

**Decisiones nuevas:**
- Decisión K — Multi-sede para prestadores.
- Decisión L — Datos fiscales solo en `cuentas_comerciales`.

**Casos nuevos:**
- 8.12 — Multi-sede para prestador.

### v2.0 (8 Mayo 2026, respecto a v1)

**Schema removido:**
- Columna `tipo_actor` de `cuentas_comerciales`.
- Columnas `ruc`, `razon_social`, `cuenta_bancaria`, `banco`, `tipo_cuenta` de `seller_perfil`.

**Schema agregado:**
- Tabla `cuenta_roles` (pivote).
- Tabla `refugios`.
- Columna `cuenta_comercial_id` FK NOT NULL en las 4 tablas operativas.
- Columnas VTEX en `seller_perfil`.
- Campo `tipo_actor_resuelto` en `fee_calculo_detalle`.

**Funciones modificadas:**
- `crear_evento_economico`: lógica nueva (deriva tipo_actor del origen, valida rol activo).

**Vistas modificadas:**
- `v_eventos_resumen_cuenta` y `v_liquidaciones_pendientes_pago`: `roles_activos` array.

**Decisiones nuevas:**
- Decisión I, J, B reformulada.

**Casos nuevos:**
- 8.7 reformulado, 8.9, 8.11.

---

## 16. Apéndice — Aprendizajes de migración

Esta sección existe para que próximos agentes que hagan migraciones similares no repitan errores.

### Aprendizaje 1: Verificar schema completo antes de planificar migración

**Qué pasó (8 Mayo 2026 — MIG-D):** durante la migración v1→v2, se verificó schema parcial de `prestadores` (solo 4 columnas específicas). Nunca se vio la lista completa. Esto enmascaró las columnas `ruc` y `razon_social` que después generaron inconsistencia.

**Qué hacer próxima vez:** antes de migrar, ejecutar `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='X' ORDER BY ordinal_position` para CADA tabla afectada. No asumir, no preguntar columnas específicas. Ver todas.

### Aprendizaje 2: Verificar todas las FKs antes de truncar

**Qué pasó:** el primer intento de truncar `prestadores` falló con FK error porque no se mapearon todas las tablas dependientes (24 tablas, 12 con RESTRICT/NO ACTION).

**Qué hacer próxima vez:** mapear TODAS las FKs entrantes con query específica. Conocer cuáles son CASCADE, SET NULL, RESTRICT. Planificar orden de borrado en consecuencia.

### Aprendizaje 3: Buscar inconsistencias entre tablas similares

**Qué pasó:** al diseñar el cleanup del 8 Mayo, se borraron columnas fiscales de `seller_perfil` pero NO de `prestadores`, generando inconsistencia. Detectado después por otro agente revisando el portal-prestadores.

**Qué hacer próxima vez:** cuando se aplique una decisión de modelo a UNA tabla operativa, verificar que la decisión se aplica también a las tablas operativas hermanas. Coherencia entre las 4 es regla de oro.

### Aprendizaje 4: Validar contradicciones lógicas en el voto del usuario

**Qué pasó:** en la decisión sobre `prestadores.nombre_comercial`, el usuario inicialmente votó "mantenerlo" pero también votó implícitamente "no multi-sede en v1". Las dos cosas son contradictorias.

**Qué hacer próxima vez:** cuando una decisión de schema implica restricciones de modelo, hacerlas explícitas al usuario. Forzar coherencia desde el momento de la decisión.

### Aprendizaje 5: Buscar UNIQUE constraints que limitan flexibilidad antes de migrar

**Qué pasó:** `prestadores_user_id_key` (UNIQUE en user_id) era un constraint del schema viejo. Al modelar multi-rol y multi-sede, ese constraint se volvió bloqueante. Detectado tarde.

**Qué hacer próxima vez:** al cambiar modelo conceptual, listar todos los UNIQUE constraints de las tablas afectadas y cuestionar cada uno: "¿este UNIQUE sigue siendo válido en el modelo nuevo?".

### Aprendizaje 7: Confirmar el body de funciones SQL aunque el nombre sugiera comportamiento (NUEVO v2.3)

**Qué pasó (9 Mayo 2026):** la función `wizard_crear_cuenta_y_rol` se llamó así desde su creación pero NO insertaba en user_roles. Bug latente durante semanas. Detectado en runtime cuando un user post-wizard quedaba sin acceso al portal.

**Qué hacer próxima vez:** cuando una función SQL implique multiple operaciones según su nombre, verificar el body con `pg_get_functiondef(oid)` antes de confiar en él. No asumir.

### Aprendizaje 6: Listar TODOS los CHECK constraints preexistentes antes de tests (NUEVO v2.2)

**Qué pasó (8 Mayo 2026 — MIG-K):** al armar test positivo del nuevo CHECK `chk_datos_bancarios_validos`, el INSERT falló por OTRO constraint preexistente (`chk_estado_consistente`) que exigía `activado_en NOT NULL` cuando `estado='activa'`. No conocía ese constraint y mi test no lo respetaba.

**Qué hacer próxima vez:** antes de armar tests de cualquier constraint nuevo, ejecutar:
```sql
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.<tabla>'::regclass AND contype = 'c'
ORDER BY conname;
```
Y diseñar tests que respeten TODOS los constraints, no solo el nuevo. Esto también ayuda a documentar interacciones entre constraints (caso `chk_datos_bancarios_validos` + `chk_estado_consistente` que define el flujo del wizard).

---

*Documento maestro del motor financiero e-PetPlace. Mantener actualizado.*
