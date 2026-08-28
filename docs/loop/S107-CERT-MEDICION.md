# S107-CERT · MEDICIÓN PRE-CERTIFICACIÓN (27-ago-2026)

**Contra qué se midió:** base de producción linkeada `zyltipqscdsdsxnjclhp` vía
`supabase db query --linked` · `cron.job` / `cron.job_run_details` / `pg_proc` de
esa misma base · `supabase functions list` · el árbol en `a330df00` (main).
**Reloj del servidor al medir: 2026-08-27 19:18 UTC = 14:18 Guayaquil.**
**Nada de acá viene de un reporte previo. Cero escrituras: solo SELECT.**

---

## ① LOS CASOS — «corre» = EJERCIDO contra el objeto

### 🟢 CORREN (7)

| # | caso | evidencia |
|---|---|---|
| 1 | **Tokenización / alta** | 10 tarjetas · 17 altas · última 26-ago 20:07 |
| 2 | **Cobro con token — COMPRA** | `38ad7816` $12,36 · `DF-2103629` · `IEW0zE` · 26-ago 00:43 |
| 3 | **Cobro con token — CITA** 🟢 *no está en el acta* | **11 aprobados HOY** 03:16→19:06 UTC, todos con DF + auth |
| 4 | **Reverso Nuvei** | `DF-2102135` · `oDWlzY` · $24,90 · 25-ago 15:05 |
| 5 | **Reverso DeUna** | $94,50 · rev `3d909788` · 25-ago 23:07 |
| 6 | **Sujeto movido por reverso (D-923), LOS DOS RIELES** | compras `8eb62f9e`/`9cfced78` → `cancelada` · pedidos `6cd18326`/`17992b0e` → `cancelado_sistema` |
| 7 | **Paso 9 — comprobante con DF + auth** | 36 `entregada`, última 27-ago 19:06 · la plantilla imprime `Transacción` y `Autorización` en mono (`despachar-correo:167-168`) |

### 🔴 NO CORREN / NO CONCLUYENTES (7)

| # | caso | número |
|---|---|---|
| 8 | Aviso `pago_reversado` | tipo `activo=true`, **0 intenciones** con DOS reversos ejercidos |
| 9 | `retomar_compra` | motor + wrapper, **0 consumidores en `apps/`** — sigue sin puerta |
| 10 | Brazo `pago_reversado` del lector de **cita** | 0 citas reversadas (los 2 reversos fueron de compra) |
| 11 | **uid estable** | `usuario_proveedor_uid` = **1 fila**; las **9** tarjetas de la cuenta llevan uid ≠ ese (= id de su alta), **incluidas las 2 creadas DESPUÉS** |
| 12 | Barrido DeUna | cron 21 `0 8 * * *` activo, **2 ticks `succeeded`** — y **7 intentos DeUna siguen `pendiente`** (5 de ayer/hoy) |
| 13 | Ventana 17:00 del reverso | sin reverso nuevo desde 25-ago |
| 14 | **H1 del acta** | los 3 (`bdaf4f57` $6 · `04512c6a` $10,75 · `dcf18373` $70,90) **siguen `pendiente`**; y `webhook_events` con `recibido` + `pago_id NULL` pasó de **7 → 16** |

---

## ② LIMPIEZA — ✅ **EJECUTADA Y VERIFICADA** (firma del founder, 27-ago)

**Estado final, leído del objeto después de borrar:** tarjetas totales **1**
(0 de `+8`, 1 de `+7`) · altas totales **1** (0 / 1) · `tarjeta_preferida_id`
de `+8` en **NULL** por la FK · **uid estable conservado** (`d5d42b92`) · los
**46** intentos de nuvei intactos.

**Cinturón con rojo producido antes:** el mismo guard corrido con `8` —el número
que traía el pedido— abortó con `GUARD: tarjetas=9 y se firmaron 8 — ABORTA, no
se borra nada`. *El guard discrimina; no es decorativo.*

**Reversa escrita ANTES** en `docs/relevamientos/S107-CERT-REVERSA-limpieza-tarjetas.sql`,
y **declara que NO PUEDE revertir**: el `token` es un handle del proveedor que no
podemos regenerar. La única reversa real es volver a guardar la tarjeta.

### Lo medido antes de borrar (el reporte que habilitó la firma)

Cuenta `guillo381+8@gmail.com` = `dd024680-3d1c-4465-b38b-dedab45da037`

- **9 tarjetas** (el pedido decía 8) — **5× visa `411111****1111` + 4× diners
  `364170****0808`** (el pedido decía 4+4)
- **16 altas**: 9 `guardada` · 6 `pendiente` vencidas (26-ago) · 1 `guardada`
  con `tarjeta_id` NULL (`79ecf8c4`)
- 1 fila en `usuario_proveedor_uid`
- **Hijos** (las 3 FKs a `tarjetas_guardadas`, todas `ON DELETE SET NULL`):
  `user_preferencias.tarjeta_preferida_id` → `d2573a70` (**1 fila**) ·
  `pedidos_recurrencias` → **0** · `altas_tarjeta.tarjeta_id` → las 9
- 🔴 **En la base hay 1 tarjeta y 1 alta de OTRA cuenta**: `guillo381+7@gmail.com`,
  tarjeta `929ca296`, 26-ago 20:07. **Fuera del alcance dado — no se toca.**

⚠️ Borrar las 9 deja `card/list` vacío para la demo. Si Erick tiene que ver dos
tarjetas bajo un uid, hay que re-crearlas **después** del borrado.

---

## ③ GUARD DEL IVA — 🔴 YA ESTÁ LEVANTADO, DESPLEGADO Y EJERCIDO

- `_shared/iva.ts` implementa el contrato entero (nominal del catálogo,
  tolerancia ±1 ¢/línea, los tres códigos). **Una sola pieza**, importada por
  `pagos-cobro:43` y `pagos-cobro-recurrente:70`.
- `pagos-cobro` **v23, desplegada 25-ago 23:22 UTC**.
- **Discriminador ya corrido, y es limpio:** el **mismo desglose** (10,75 + 1,61)
  fue **rechazado** 25-ago 16:34 y 16:35 con `iva_no_cero_sin_probar`, y
  **aprobado** 26-ago 00:43 con `DF-2103629`. Mismo input, veredicto opuesto,
  con el deploy en el medio.
- El `order` manda los tres **derivados del veredicto**, `tax_percentage` nominal.

### ✅ EL DISCRIMINADOR QUE FALTABA — **LLEGÓ, Y CIERRA** (27-ago)

Se declaró: `payload_crudo` guarda **solo la RESPUESTA**, y Nuvei **no
eco-devuelve** los tres campos ⇒ *«prueba de que ACEPTÓ, no de QUÉ mandamos»*.

**Erick pasó el registro de su lado de `DF-2103629`:**
`vat=1.61 · taxable_amount=10.75 · tax_percentage=15 · order.amount=12.36`,
**coincidiendo exactamente con el desglose congelado y con el veredicto de
`_shared/iva.ts`.** ⇒ **el guard queda verificado de punta a punta, sin
inferencia en ningún tramo.** Evidencia depositada en
`docs/relevamientos/S107-CERT-EVIDENCIA-NUVEI-DF-2103629.md`.

⚠️ **Sigue sin ejercerse:** el riel **recurrente** con IVA > 0, y la **tolerancia
de ±1 ¢ por línea** (este cobro tenía una sola línea gravada).

### 🔴 Y UN HUECO: EL CORREO NO IMPRIME EL IMPUESTO

La intención lleva el desglose —medido en el comprobante de `6ab24930`,
`estado=entregada`: `subtotal 10.75 · impuesto 1.61 · envio 0.00`— pero el tipo
`Datos` de `despachar-correo` **no declara** `subtotal`/`impuesto`/`envio` y
`bloqueCodigosPago` **no los empuja**.

El acta §① dice *«el comprobante dice el impuesto»*: **es cierto del DATO y
falso del ARTEFACTO.** Es motor-sin-puerta en la capa de plantilla — y el propio
archivo tiene el comentario que describe esa clase, tres líneas más arriba.

---

## ④ `main` COMPLETO — 🟢 VERDE

| medición | valor |
|---|---|
| archivos en `supabase/migrations/` | **472** |
| ledger `local` | **472** |
| ledger `remote` | **472** |
| solo local (archivo sin aplicar) | **0** |
| solo remoto (aplicado sin archivo) | **0** |
| disco − ledger / ledger − disco | **0 / 0** |
| ramas sin mergear a `main` | 13 |
| **migraciones que existen en una rama y NO en `main`** | **0** |

*Se miró el DIRECTORIO además del ledger (`L-422` enmendada), y se recorrieron
las 13 ramas sin mergear (`L-217`): están **atrás** de `main`, no adelante.*

---

## ⑤ LO QUE CONTRADICE AL ACTA O AL PEDIDO

1. **9 tarjetas, no 8** — y el reparto es **5+4**, no 4+4.
2. **El guard del IVA ya está levantado y ejercido** — el pedido decía «no lo
   levantes todavía».
3. **El comprobante no imprime el impuesto** — el acta lo da por hecho.
4. **`usuario_proveedor_uid` sigue en 1** y las tarjetas creadas después del uid
   estable siguen anotando el id del alta. *Es el riesgo diferido que el acta
   describe, y hoy sigue vivo.*
5. **H1 empeoró**: webhooks `recibido` sin `pago_id` de **7 → 16**.
6. **Caso nuevo que el acta no lista**: el cobro de **CITA**, ejercido **11 veces
   hoy** — es lo mejor que hay para mostrarle a Erick, y salió de S106.

---

## ⑥ H1 — LAS TRES CLASES, Y LA CAUSA RAÍZ

**16 webhooks `recibido` + `pago_id NULL`, todos `ambiente=sandbox`:**

| clase | n | qué es | plata |
|---|---|---|---|
| A | **10** | $2,56 · `cred=CLIENT` · devref vacío = cargo de verificación del **alta** | $0 |
| B | **2** | $8,05 ×2 (20-ago): intento **aprobado**, compra **pagada**, comprobante entregado. Webhook duplicado, llegó tras la respuesta síncrona | $0 |
| 🔴 C | **3** | **APPROVED por Nuvei y no registrados** | **$87,65** |
| — | 1 | `TEST-1`, sintético | $0 |

### 🔴 LA CAUSA RAÍZ — y NO es «el actuador no corre»

Sonda ejecutada en **subtransacción que se deshace sola** (`L-406`): se llamó
`aplicar_evento_de_pago` sobre los tres y se revirtió todo. **Nada se aplicó.**

```
DF-2099041 ($70,90) => LANZO 22023: transicion_no_permitida: cancelado_cliente → pago_capturado
DF-2100043 ($10,75) => LANZO 22023: transicion_no_permitida: cancelado_cliente → pago_capturado
DF-2099049 ($6,00)  => {"ok": true, "motivo": "sin_dev_reference", "aplicado": false}
```

**El actuador CORRE. Es la falla SUCESORA de `L-402`, no la misma:**

- **Dos compras:** el actuador **lanza**, y el webhook lo envuelve en un
  `try/catch` que solo hace `console.error` ⇒ **la excepción se traga y la fila
  queda en `recibido`.** *`recibido` se lee como «guardado, pendiente de
  resolver»; la verdad es «intentado y rechazado».* **El fallo es ruidoso en el
  código e invisible en la base.**
- **La cita:** el actuador devuelve **`ok: true` con `aplicado: false`** — una
  respuesta con forma de éxito para trabajo no hecho. Su causa: el payload de
  `DF-2099049` trae **`dev_reference` vacío** ⇒ el actuador no sabe a qué cita
  apuntar. **No es aplicable hoy, ni siquiera con firma.**

### 🔴 Y EL CONCILIADOR SÍ LOS ALCANZA — el diagnóstico de la mañana era falso

`pagos_pendientes_de_conciliar(10)` **los devuelve ahora mismo** (6 candidatos:
las 2 compras de Nuvei + 4 de DeUna). Y su corrida real de hoy 17:00 dice:

```
{"ok":true,"revisados":6,"resumen":{"huerfano_sin_stock":2,"huerfano_escalado":4},
 "escalados":["7559f789… (huerfano_sin_stock)","33ec2091… (huerfano_sin_stock)", …]}
```

⇒ **El conciliador los ve, los pregunta, los resuelve y los ESCALA — a un
`console.error` que nadie lee.** Hace exactamente lo correcto y le avisa a nadie.

**`huerfano_sin_stock` es la misma pared de `D-913` desde el otro lado:** ahí el
botón «pagar» nacía muerto porque la reserva de stock había vencido; acá **la
plata YA entró y el stock ya no está.** El barrido no puede confirmar una compra
cuya mercadería se liberó — y se niega, que es lo correcto.

### 🔴 EL HUECO ESTRUCTURAL QUE ESTO DESTAPA

`pagos_pendientes_de_conciliar` es `FROM compras c JOIN pagos_intentos i ON
i.compra_id = c.id`. **Un intento de CITA tiene `compra_id` NULL ⇒ el
conciliador es CIEGO A LAS CITAS por construcción.**

Y eso importa hoy más que ayer: **S106 convirtió a la cita en el sujeto que más
cobra — 11 cobros aprobados hoy.** *El único sujeto sin red de seguridad es el
que más plata mueve.*

---

## ⑦ CONSTRUIDO Y **NO EJERCIDO** — al cierre de S107-CERT

*Misma disciplina que el §② del acta de S105: cada pieza con **cómo se ejerce**,
no solo con que falta.*

| pieza | qué falta para ejercerla |
|---|---|
| 🔴 **Las tres voces nuevas de `pago_reversado`** (`20260827220000`) | **cobrar una cita y reversarla antes de las 17:00 `America/Guayaquil`**. La ventana del 27-ago se pasó. ⚠️ **Con un prestador DISTINTO de `4f572081`**: él ya recibió la versión vieja a las 15:46, y un segundo aviso con otro texto sobre el mismo hecho **le cuenta dos historias**. Es un caso nuevo, no una repetición |
| 🔴 **El aviso a la FAMILIA** | nace con el mismo acto de arriba. Hoy tiene **0 enviados**: la cura llegó después del único reverso de cita del día |
| 🟡 **`obtener_cita_resuelta`, brazo `pago_reversado`** | **NO CONCLUYENTE**, no rojo: por SQL rebota en `sin_sesion` antes de llegar al brazo. Se ejerce con el deep link `cliente://videoconsulta/d41c9dea-…` en el aparato, **con sesión real** |
| 🟡 **El pasillo a la cita cancelada** (`D-951`) | no se puede ejercer: **no existe**. El deep link prueba el lector, no el camino |
| 🟢 **La verdad vencida curada** (`20260827210000`) | verificada contra el objeto, **pero no vista en una respuesta real**: hace falta un reverso nuevo para leer `sujeto_movido: true` saliendo de la función en vez de del assert |
| 🔴 **El acto A del uid** (piezas ②③④) | ③ desplegada · ② y ④ **bloqueadas por la build**, que recién ahora existe |
| 🔴 **El borrado de las 2 tarjetas parcheadas** | suspendido con fecha de vencimiento escrita: **se hace dentro del acto A**, no antes |

### La regla que este bloque cobra por segunda vez en dos sesiones

> **Una cura que llega después del único caso del día no está probada: está
> escrita.** El reverso de las 15:46 gastó el único sujeto disponible y la cura
> salió a las 16:30 — *el orden importa tanto como el contenido, y acá el orden
> lo decidió una ventana de un tercero.*
