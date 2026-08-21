# S102-B · C1 — CENSO CONTABLE

> **Estatuto: CENSO, TODO LECTURA.** Proyecto `zyltipqscdsdsxnjclhp` · corrida **21-ago-2026**.
> Todo cuerpo de función se leyó con `pg_get_functiondef` (regla 40), jamás por el nombre.

---

## ⓪ · EL TITULAR

> ### **La cadena de la plata tiene cuatro eslabones y DOS de sus tres uniones están abiertas — y la que sí está cerrada solo lo está para servicios.**

```
   pago            devengo              liquidación           payout
 (S101, VIVO) ──✗── crear_evento_    ──✗── generar_        ──✗── (no existe)
                    economico              liquidacion
                    5 llamadores           0 llamadores
                    TODOS de servicio      REALES
```

**El único tramo que corre de punta a punta hoy es: cita cerrada con calidad →
evento económico.** Todo lo demás está construido y sin conectar.

---

## ① · EL LEDGER — 36 EVENTOS, Y LOS 36 SON LA MISMA FILA

`eventos_economicos`, agrupado por todo:

| origen | tipo_evento | stream | estado | n | bruto | plataforma | payout | liquidados |
|---|---|---|---|---|---|---|---|---|
| `cita` | `cita_pagada` | `transaccional` | `pendiente_liquidar` | **36** | 388.25 | 58.24 | 330.01 | **0** |

**Una sola fila de agrupamiento. Nada más.** Ventana de devengo: **13-jul → 9-ago-2026**.

**Los 36 tienen `fee_config_id`** — o sea que **todos resolvieron su fee** y el
15 % de servicios funciona (58.24 / 388.25 = 15,0 %).

### 🔴 CERO EVENTOS DE `pedido`, Y NO ES QUE NO HAYA PASADO NADA

| tabla | filas |
|---|---|
| `pedidos` | **65** |
| `pedido_items` | 67 |
| `pagos_intentos` | 41 |
| `pagos_eventos` | 38 |
| `webhook_events` | 60 |
| **eventos económicos de pedido** | **0** |

**Y el censo prueba que no es una omisión de datos sino de CAMINO:**

```
funciones del ciclo de pedido/despensa/entrega/envío/despacho:  35
  … que llaman a crear_evento_economico:                         0
```

> **No falta un cable: falta el enchufe.** *Las 35 funciones del circuito de
> despensa no tienen un solo punto de contacto con el motor contable.*

### Y LA SILLA TIENE EL NOMBRE PUESTO DESDE EL PRIMER DÍA

`tipo_evento_economico_enum` — **`pedido_pagado` es el PRIMER valor del enum**, y
tiene **cero filas**. Y en el cuerpo de `crear_evento_economico`:

```sql
v_tipo_actor_requerido := CASE p_origen_tipo
  WHEN 'pedido'  THEN 'seller_productos'::tipo_actor_enum
  WHEN 'cita'    THEN 'prestador_servicios'::tipo_actor_enum
  ...
```

⇒ **El motor contable fue diseñado para pedidos desde el principio.** El
vocabulario está, el mapeo está, el gate de rol está — **y el productor nunca
se escribió.**

**El gate de rol, además, HOY PASARÍA:** `cuenta_roles` tiene **5
`seller_productos` activos** (el censo de S95-F que decía «cero» está vencido —
S96 los creó). *No hay nada bloqueando el cableo salvo que nadie lo escribió.*

---

## ② · 🔴 EL HALLAZGO MÁS FINO DEL CENSO — **EL CEE IGNORA LA CLAVE `base`**

**`crear_evento_economico`, rama `porcentual`, literal:**

```sql
WHEN 'porcentual' THEN
  v_monto_plataforma := ROUND(
    v_base_calculo * (v_fee_resuelto.parametros->>'pct')::numeric / 100, 2);
```

y `v_base_calculo` sale de:

```sql
IF v_quien_absorbe = 'plataforma' AND p_descuento_aplicado > 0
  THEN v_base_calculo := p_monto_bruto + p_descuento_aplicado;
  ELSE v_base_calculo := p_monto_bruto;
END IF;
```

> ### **El motor lee `pct` y NUNCA lee `base`.**

**Por qué esto importa exactamente ahora, y no antes:** hasta S95 ninguna fila de
`fee_configs` tenía `base`. **S95 depositó la clave con todo el cuidado del
mundo** —la puso en la fila del 10 %, la hizo obligatoria con un CHECK, y
`resolver_comision_despensa` la devuelve— **y el actuador que iba a usarla no la
conoce.**

> **Es la variante grave de `L-318` que S101 nombró, textual:** ***«un actuador
> que recibe un sujeto que no conoce NO FALLA — LO IGNORA. No hubo error, ni
> log, ni síntoma: hubo silencio con cara de normalidad.»***
>
> **Acá el sujeto es una CLAVE en vez de un evento, y el silencio es el mismo.**

**Y la consecuencia es dinero, no prolijidad:** el día que alguien cablee el
pedido al ledger, **el 10 % se va a calcular sobre lo que el caller haya puesto
en `p_monto_bruto`** — subtotal, total, o total con IVA — **y el motor no tiene
forma de exigir cuál.** La letra dice *«10 % sobre el TOTAL CON IVA»*
(`MODELO_DESPENSA:114`) y **el único lugar donde eso está escrito como dato es
una clave que nadie lee.**

**Nota honesta sobre el 15 % de servicios:** ninguna fila de `cita` declara
`base`, así que **hoy la omisión no cambia ningún número existente**. *El defecto
es de lo que viene, no de lo que hay.*

---

## ③ · LAS DOS PUERTAS AL MISMO NÚMERO, Y LA QUE SABE ES LA QUE NADIE USA

| puerta | ¿devuelve `base`? | consumidores |
|---|---|---|
| `resolver_comision_despensa(country, fecha)` | **SÍ** (`'base', fc.parametros->>'base'`) | **0** |
| `_resolver_fee_aplicable(...)` → `crear_evento_economico` | devuelve `parametros` entero, **pero el CEE no mira `base`** | 5 (los cierres de servicio) |

**La puerta pública `resolver_fee_aplicable`** tiene además su gate D-348 en el
cuerpo (*un `authenticated` solo resuelve fees de SU cuenta o es admin*) — **bien
hecho y verificado en el literal.**

**Y su único consumidor en el repo es de servicios:** `packages/api/src/wrappers/fees.ts`
→ `obtenerComisionVigenteCita()`. **No existe el wrapper equivalente de despensa.**

---

## ④ · `fee_configs` — 7 FILAS, TODAS `activo=true`

| país | actor | origen | parámetros | vigencia |
|---|---|---|---|---|
| EC | refugio | donacion | `{kushki_pct 3.5, kushki_fijo 0.30}` | abierta |
| CO | refugio | donacion | idem | abierta |
| EC | prestador_servicios | cita | `{pct: 15}` | abierta |
| CO | prestador_servicios | cita | `{pct: 15}` | abierta |
| EC | seller_productos | pedido | `{pct: 14.00}` | **cerrada 2026-08-11** |
| **EC** | **seller_productos** | **pedido** | **`{pct: 10, base: total_con_impuesto}`** | **abierta** ✅ |
| 🔴 **CO** | seller_productos | pedido | `{pct: 14.00}` **sin base** | **ABIERTA** |

**El detalle completo de las tres tasas está en el relevamiento C0**; acá queda
lo contable: **el resolutor devuelve 10 para EC y 14 para CO**, y el CHECK
`chk_fee_pedido_declara_base` nació **`NOT VALID`** (`convalidated = false`), así
que **la única fila viva de `pedido` sin base es justo la que el CHECK no mira.**

**`fee_configs_historial` tiene 16 filas** y su trigger `audit_fee_configs()`
existe ⇒ **los cambios de tasa SÍ dejan rastro.** *Es la pieza del circuito que
está mejor cuidada.*

---

## ⑤ · LA LIQUIDACIÓN — CONSTRUIDA Y JAMÁS CORRIDA

| medición | valor |
|---|---|
| `liquidaciones` | **0 filas** |
| `liquidacion_eventos` | **0 filas** |
| `v_liquidaciones_pendientes_pago` | **0 filas** |
| eventos en `pendiente_liquidar` | **36** |
| llamadores de `generar_liquidacion` | **0 REALES** |

**Los «2 llamadores» que devuelve un grep ingenuo son COMENTARIOS**, y se
verificó leyendo la línea:

```
_cuenta_es_vendedora    :  --    `generar_liquidacion` después no le puede pagar.
confirmar_cita_pagada   :  -- generar_liquidacion rechaza (§7.11).
```

> **Segundo motor sin puerta del mismo censo**, y éste está en el extremo
> opuesto de la cadena: **36 devengos esperan una liquidación que nadie llama.**

---

## ⑥ · EL SALDO — DECLARADO Y APAGADO, tal como la orden anticipaba

**No existe ningún objeto llamado `saldo`** (cero tablas, cero vistas, cero
funciones). Lo que existe son **tres columnas**:

| dónde | columna | estado medido |
|---|---|---|
| `cuentas_comerciales` | `saldo_arrastre` | **0 de 14 cuentas con valor ≠ 0** |
| `liquidaciones` | `saldo_arrastre_aplicado` | la tabla está vacía |
| `v_eventos_resumen_cuenta` | `saldo_arrastre` | derivada |

**Y una desambiguación que conviene dejar escrita:** `saldo_pagado` —que aparece
en `MODELO_NOTIFICACIONES` §3, `POLITICAS`, `MODELO_FINANCIERO` y
`DEFINICION_SOFTLAUNCH`— **NO es un saldo de dinero: es un TIPO DE AVISO**
(«saldo pagado que vence: paquetes, planes»), firmado por el founder el
4-ago-2026. *Buscar «el saldo» por ese nombre lleva al lugar equivocado.*

---

## ⑦ · LO QUE ESTÁ BIEN Y CONVIENE NO RE-AUDITAR

- **El 15 % de servicios corre correcto de punta a punta** — 36 eventos, todos
  con `fee_config_id`, aritmética exacta.
- **`fee_configs` tiene auditoría por trigger** con 16 filas de historial.
- **El gate de rol del CEE funciona** y hoy pasaría también para vendedores.
- **La frontera de lectura del ledger es por cuenta y está bien cerrada** — el
  detalle vive en el relevamiento transversal.
- **El resolutor de fee tiene su gate de pertenencia (D-348) escrito en el
  cuerpo**, no en la policy.

---

## ⑧ · LO QUE ESTE CENSO **NO** MIDIÓ

1. **No se corrió `generar_liquidacion`** ni siquiera en transacción con
   ROLLBACK. *Esta sesión es de lectura; ejecutar una función que escribe —
   aunque se revierta— no es leer.*
2. **No se midió la superficie**: si «Cobros» y «Liquidaciones» del prestador
   pintan bien los 36 pendientes es gate de dispositivo, no de censo.
3. **No se auditó `v_eventos_con_origen`** (la fuente del desglose), solo se
   registró que existe y que la consume `eventosEconomicos.ts`.

---

## ⑨ · LO QUE C1 LE DEVUELVE AL FRENO DE LA ORDEN

**El freno dice: *«nada se cablea al ledger antes de la firma del número único
(C0)»*. El censo agrega que ese freno, tal como está escrito, NO ALCANZA:**

> **Aunque el número se firme mañana, cablear el pedido al ledger HOY produciría
> un número silenciosamente mal basado**, porque el actuador no lee `base`.

**⇒ La condición de cableo son DOS, no una:** ① el número firmado (ya está) y
**② que `crear_evento_economico` HONRE `base`, o que el caller tenga prohibido
elegirla.** *Lo segundo es trabajo de motor y es de la pista A.*
