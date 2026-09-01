# EL MOTOR DE PAGOS — CÓMO QUEDÓ FUNCIONANDO
### Estado medido el **1-sep-2026**, el día que **Nuvei certificó**

> **Esto NO es una letra.** Las doce letras de pagos dicen **qué decidimos**;
> ninguna decía **qué está vivo**. Este documento existe para cerrar ese hueco,
> y **todo lo de acá está medido contra el objeto** — no contra fichas, no
> contra actas, no de memoria.
>
> ⚠️ **Se re-mide, no se recuerda.** Cada número lleva su comando al lado.

---

## ① EL ESTADO EN UNA LÍNEA

> ## 🟢 Nuvei CERTIFICÓ. El motor habla bien con el proveedor, en los dos rieles, con reverso ejercido.

**Y lo que la certificación NO dice, dicho acá antes que nada:** certifica **la
conversación con el proveedor**. **No dice nada del acto 2** —mover el sujeto
después de cobrar— y ahí es donde está lo que falta (§⑦).

*Un motor certificado que cobra bien y no entrega es un motor que pasa su examen
y falla su trabajo.*

---

## ② EL CIRCUITO, DE PUNTA A PUNTA

```
  la familia toca «Pagar»
        ↓
  crear_intento_pago            ← nace el intento, con SU SUJETO adentro
        ↓
  verificar_compuertas_pre_cobro ← lo que puede impedir cobrar, ANTES de cobrar
        ↓
  ┌─ riel NUVEI (tarjeta) ──────┐   ┌─ riel DEUNA (push) ────────┐
  │ pagos-cobro                 │   │ pagos-deuna-solicitud       │
  │ 3DS/OTP en pagos-web        │   │ código de 6 dígitos         │
  └─────────────┬───────────────┘   └──────────┬─────────────────┘
                ↓                              ↓
  pagos-webhook-stg                  pagos-deuna-webhook
  (persiste ANTES de analizar)       (+ pagos-deuna-barrido de respaldo)
                ↓                              ↓
        ═══════════ aplicar_evento_de_pago ═══════════   ← EL ACTUADOR
                            ↓
                  ACTO 2 · mueve el sujeto
```

**🔑 Las dos propiedades que lo sostienen, y las dos se pagaron con un defecto:**

1. **El buzón PERSISTE antes de analizar.** *Si analiza primero y falla, el
   evento del proveedor se pierde y no hay reintento: el proveedor ya lo dio por
   entregado.*
2. **El actuador NOMBRA el sujeto que no conoce.** ⏪ Antes devolvía `ok: true` y
   **no escribía nada** ⇒ *un cobro que no ocurrió, reportado como ocurrido.*
   Hoy **marca el evento y devuelve `ok: false`.** *Si el cableado de un sujeto
   nuevo queda a medias, SUENA.*

---

## ③ LOS DOS RIELES — los dos vivos, medidos

```sql
select proveedor, count(*) from pagos_intentos group by proveedor;
```

| riel | intentos | qué es |
|---|---|---|
| **nuvei** | **98** | tarjeta, con alta 3DS/OTP y tokenización |
| **deuna** | **19** | push — la familia paga desde su app con un código de 6 dígitos |
| `seed_gate` · `simulado` · `siembra` | 14 | **datos de prueba, no plata** — importa para §⑦ |

**Vocabulario de estados vivo:** `pendiente` · `aprobado` · `rechazado` ·
`reversado`. **96 aprobados · 6 reversados.**

⚠️ **`transaction.id` se comporta DISTINTO por riel, y está en la letra por eso:**
**Nuvei REUSA el id** al reversar (el reverso lleva el mismo `DF-…`); **DeUna
emite uno propio.** *Quien escriba una conciliación que asuma un solo
comportamiento va a perder la mitad de los casos.*

---

## ④ LOS SIETE SUJETOS QUE EL MOTOR MUEVE — **ejercidos, no declarados**

| sujeto | intentos |
|---|---|
| **pedido** (despensa) | 58 |
| **cita** (los cuatro oficios) | 45 |
| **compra** | 44 |
| **bono** (paquete de salidas) | 15 |
| **guardería** (mensualidad) | 6 |
| **programa** (adiestramiento) | 4 |
| **suscripción de servicio** | 3 |

**El sujeto vive EN la fila del intento**, en una columna por tipo. *No hay un
`sujeto_tipo` de texto libre: agregar un sujeto es agregar una columna, y eso lo
ve el compilador.*

**Confirmadores, uno por sujeto:** `confirmar_pago_pedido` · `confirmar_pago_compra` ·
`confirmar_pago_bono` · `confirmar_pago_plan_paseo` · `confirmar_pago_programa`.

---

## ⑤ EL REVERSO — y su hallazgo es de FORMA, no de falla

**Un reverso de Nuvei llega con `status=2`, exactamente igual que un rechazo.**
*Un evento que se confunde con otro no deja síntoma: deja un contador de rechazos
que se lee perfectamente normal.*

**El discriminador no salió de la documentación — salió de ejercer el reverso:**
**`status_detail: 7`** + **`carrier_code: ReversedByMerchant`**. Vive en
`_nuvei_status_detail_es_reverso`.

### Cómo se ejerce hoy

```
POST /functions/v1/pagos-reverso
header  x-despacho-secret: <vault: despacho_secret>
body    { "intento_id": "<uuid>" }
```

🔴 **Tres propiedades del diseño, cada una con su razón:**

- **NO acepta un monto del llamador** (`monto_no_se_recibe`). *Un reverso cuyo
  monto lo dice quien llama es un reverso que puede devolver de más.*
- **El secreto se resuelve DENTRO de Postgres** (`vault.decrypted_secrets`,
  inline en `net.http_post`), igual que los crones. *Un secreto que no pasa por
  un terminal no se puede filtrar en un terminal.*
- **⏱️ La ventana cierra a las 17:00 America/Guayaquil.** Después, no es reverso:
  es otro trámite.

### El sujeto se mueve SOLO

`trg_pagos_intentos_reverso_mueve_sujeto` → `_trg_reverso_mueve_sujeto` →
`mover_sujeto_por_reverso`. **Por trigger sobre la transición del intento, NO
cableado por riel.** *Cablearlo dentro de cada registrador es exactamente cómo el
segundo riel se olvida.*

**Verificado el 1-sep** con el reverso de `DF-2110458` ($70,90, pedido
`P-20260901-877ed5`): intento → `reversado` y pedido → `cancelado_sistema`
**en el mismo microsegundo**.

⚠️ **Residuo conocido, declarado y NO curado:** los `pedido_items` quedan en
`pendiente`. Da igual mientras el pedido esté cancelado, pero **el ítem dice algo
que ya no es cierto**. *Es pregunta de modelo, no defecto del reverso.*

---

## ⑥ LOS RELOJES DEL MOTOR — activos, medidos en `cron.job`

| reloj | cuándo | qué hace |
|---|---|---|
| `pagos-conciliar-mediodia` | 12:00 -05 | consulta al proveedor los no terminales |
| `pagos-conciliar-antes-del-corte` | 16:15 -05 | **la última antes de que cierre la ventana del reverso** |
| `pagos-deuna-barrido-tick` | 03:00 -05 | respaldo del webhook de DeUna |
| `cobrar-recurrencias` | 09:00 -05 | el cobro recurrente |
| `avisar-recurrencias` | 08:00 -05 | avisa **antes** de cobrar |
| `expirar-*-sin-pago` (5) | cada minuto | bono · mensualidad · plan · programa · pedido |

*La cadencia del barrido de DeUna salió de medir, no de preferir: con el webhook
vivo, `*/5` son 288 corridas diarias buscando casos que hoy son cero, gastando
rate limit compartido con clientes pagando en vivo.*

---

## ⑦ 🔴 LO QUE EL MOTOR **NO** CUBRE — y es lo único que bloquea producción

```sql
select * from pagos_conciliacion_cobertura();
```

La función **lo declara ella misma**, que es como tiene que ser:

| | |
|---|---|
| ✅ **cubre** | **8** intentos no terminales con `transaction_id` — **automático** |
| 🔴 **NO cubre** | **39** intentos **APROBADOS cuyo sujeto no se movió** — *«son terminales; el barrido sólo mira no terminales»* · **necesita una persona** |

### ⚠️ Y el contador de $1.686,39 ESTÁ INFLADO — 56 %

**Clasificado por riel**, que es la pregunta que el contador no hace:

| clase | casos | monto | período |
|---|---|---|---|
| **PLATA REAL — nuvei** | 22 | **$524,56** | 20-ago → 31-ago |
| **PLATA REAL — deuna** | 3 | **$271,86** | 25-ago → **1-sep** |
| siembra / gates | 14 | $890,00 | 12-ago → 18-ago |

> ### **Lo real son 25 casos y $796,42. El resto es siembra de gates viejos contándose como plata.**

*Un contador que mezcla datos de prueba con cobros reales no exagera un poco:
exagera justo en la dirección que hace que nadie lo mire, porque el número
grande parece un problema de otro.*

🔴 **Y la parte que sí es urgente son TRES casos, no veinticinco:** los de
**DeUna llegan hasta HOY**. Los 22 de Nuvei son del 20 al 31 de agosto —
**escombro de cuando el actuador estaba roto**, anterior a las curas. *Los de
DeUna son de un motor que ya está curado, y eso los vuelve otra cosa.*

**Qué significa cada uno, sin suavizar:** **plata cobrada a una familia sobre
algo que no recibió** — el pedido no avanzó, el bono no dio saldo, la cita no
quedó firme.

⇒ **`D-946` / `D-947`. BLOQUEANTE DE PRODUCCIÓN**, y va **antes** de S108.

---

## ⑧ QUÉ FALTA PARA COBRAR DE VERDAD

| | dueño | estado |
|---|---|---|
| ✅ **certificación Nuvei** | Erick | **APROBADA 1-sep-2026** |
| 🔴 credenciales de **producción** | Erick | pendiente |
| 🔴 **host productivo** | founder / Erick | pendiente |
| 🔴 **`D-946`/`D-947`** — el acto 2 que no llegó | equipo | **bloqueante** |
| 🟡 el guard del IVA | contador + Erick | corta **todo IVA > 0**: nadie lo probó contra esta cuenta |
| 🟡 3 claves de `app_config` | **founder** | el recurrente nace inerte a propósito |

⚠️ **`PAGOS_AMBIENTE` sigue en `sandbox`**, y **no es una suposición: es
evidencia del reverso del 1-sep.** La respuesta del proveedor trajo
`"message": "Reverse by mock"` sobre el host `ccapi-stg` ⇒ *el proveedor mismo
declaró que estaba simulando.* **El motor está certificado; el ambiente no
cambió, y son dos cosas distintas.**

---

## ⑨ DÓNDE VIVE CADA COSA

**Edge functions** (`supabase/functions/`): `pagos-alta-tarjeta` ·
`pagos-cobro` · `pagos-cobro-recurrente` · `pagos-webhook-stg` ·
`pagos-conciliar` · `pagos-reverso` · `pagos-tarjetas` ·
`pagos-borrar-tarjeta` · `pagos-deuna-{solicitud,webhook,barrido}` ·
`pagos-reverso-deuna`.

**Superficie de pago:** `apps/pagos-web` (Vercel, alias
`epetplace-pagos-stg.vercel.app`) — es **UNA sola pieza** para todos los
oficios, vigilada por `R57`.

**Las letras** (qué decidimos, y por qué): `LETRA_MOTOR_PAGOS_S101` ·
`LETRA_PUERTA_DE_PAGO_S101B` · `LETRA_PAGO_CITAS` · `LETRA_DEUNA` ·
`LETRA_COBRO_RECURRENTE` · `CONTRATO_CARD_LIST_NUVEI`.

⚠️ **Ninguna de ellas autoriza ledger, devengo, comisión ni liquidación.** *El
motor cobra; repartir la plata es otro frente.*

---

## ⑩ CÓMO SE RE-MIDE ESTE DOCUMENTO

```sql
select * from pagos_conciliacion_cobertura();      -- ⑦ la cobertura
select * from pagos_aprobados_sin_sujeto_movido(); -- ⑦ la lista con nombre
select * from verificar_cobertura_sujetos_de_pago();-- ④ ¿algún sujeto sin actuador?
select proveedor, estado, count(*) from pagos_intentos group by 1,2; -- ③
select jobname, schedule, active from cron.job where jobname like 'pagos%'; -- ⑥
```

```bash
npx supabase functions list | grep pagos   # las edges y su version
```

> **Si un número de acá no coincide con el objeto, gana el objeto.**
> *Un documento de estado que se lee en vez de medirse es una letra con otra
> ropa — y las letras ya las tenemos.*
