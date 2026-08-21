# S102-B · CT — TRANSVERSAL DE DATOS PERSONALES DEL CIRCUITO DE PLATA

> **Estatuto: CENSO, TODO LECTURA.** Proyecto `zyltipqscdsdsxnjclhp` · corrida **21-ago-2026**.
>
> **🔴 DISCIPLINA DE ESTE CENSO, declarada en la puerta:** se midieron **NOMBRES
> DE CLAVE, FORMAS Y CONTEOS. Cero valores personales se leyeron, se citaron o se
> resumieron.** *Un filtro aplicado a la salida llega tarde: para filtrar hay que
> haber leído* (§6bis-A ② del método). Donde hizo falta saber qué contenía un
> campo —el número de tarjeta— **se midió su FORMA** (largo, si es solo dígitos,
> si tiene máscara), nunca su contenido.

---

## ⓪ · EL TITULAR

> ### **No hay fuga hoy, y hay dos cosas que hay que saber: el dato personal del pago vive PARA SIEMPRE, y siete tablas del circuito están cerradas por UNA SOLA capa.**

**Y un verde que vale escribir con todas las letras: NO SE GUARDA NINGÚN PAN.**

---

## ① · QUÉ DATO PERSONAL VIVE EN EL PAYLOAD CRUDO

**Tres tablas guardan el crudo del proveedor.** Claves de primer nivel, medidas
con `jsonb_object_keys`:

| tabla | columna | claves |
|---|---|---|
| `pagos_intentos` | `payload_crudo` | `card`, `user`, `transaction`, `error`, `motivo`, `pago_simulado`, `siembra` |
| `pagos_eventos` | `payload` | `card`, `user`, `transaction`, `causa`, `crudo`, `motivo`, `origen`, `resolucion`, `pago_simulado`, `siembra` |
| `webhook_events` | `payload` | `card`, `user`, `transaction`, `crudo_no_json` |

**Las dos ramas con dato personal, y sus sub-claves exactas:**

```
card  →  bank_name · bin · expiry_month · expiry_year · holder_name ·
         number · origin · status · token · transaction_reference · type
         (en webhook_events: bin · holder_name · number · origin · stoken · type)

user  →  email · id
```

### ✅ VERDE MEDIDO, Y ES EL MÁS IMPORTANTE DEL CENSO: `card.number` NO ES UN PAN

**La clave se llama `number` y eso es una trampa de lectura.** Se midió su FORMA
sobre las **94 filas** que la tienen, sin leer un solo valor:

| tabla | filas | largo mín | largo máx | solo dígitos | con máscara | **forma de PAN completo (13-19)** |
|---|---|---|---|---|---|---|
| `webhook_events` | 52 | 4 | 4 | 52 | 0 | **0** |
| `pagos_intentos` | 25 | 4 | 4 | 25 | 0 | **0** |
| `pagos_eventos` | 17 | 4 | 4 | 17 | 0 | **0** |

⇒ **Son los últimos cuatro dígitos, en las 94.** *No hay PAN en la base, y por lo
tanto la combinación PAN + expiry —que sería el hallazgo grave— no existe.*

**Y tampoco hay CVV/CVC en ninguna clave de ninguna de las tres.** *Se dice
explícito porque es el dato que jamás puede almacenarse, y su ausencia es un
resultado, no un supuesto.*

### 🔴 LO QUE SÍ QUEDA, Y QUEDA PARA SIEMPRE

**El conjunto que persiste es: `card.holder_name` + `user.email` + `card.bin` +
últimos 4 + mes/año de vencimiento.** No es catastrófico por separado; **junto
identifica a una persona y a su medio de pago.**

**Y la retención es INFINITA, medido:**

| medición | resultado |
|---|---|
| jobs de `cron` totales | **14** |
| … que purgan payloads de pago | **0** |
| funciones que hacen `DELETE FROM webhook_events / pagos_eventos` | **0** |

> **Nada borra nunca estos payloads.** *No es una política de retención larga: es
> la ausencia de política, que es distinto — una retención larga se defiende, una
> ausencia solo se explica.*

**Cruce que conviene tener a la vista:** **`D-732` y `D-733` están 🔒 BLOQUEADAS
desde S92-BIS por exactamente la misma letra que falta — el plazo de retención.**
⇒ **esa deuda de letra acaba de ganar un segundo acreedor**, y el nuevo es
material de certificación de pagos, no de documentos de identidad.

---

## ② · LA RLS DEL CIRCUITO — MEDIDA CON ROJO PRODUCIDO

**No se leyeron policies para concluir: se corrió como `anon` y como
`authenticated` con `SET LOCAL ROLE` (regla 68).**

### Las dos capas de defensa, y cuáles tablas tienen cuál

| tabla | `anon` | cómo lo rebota |
|---|---|---|
| `pedidos` · `pagos_intentos` · `pagos_eventos` · `webhook_events` | ❌ | **por GRANT** — literal: `ERROR: 42501: permission denied for table pedidos` |
| `eventos_economicos` · `liquidaciones` · `liquidacion_eventos` · `fee_configs` · `fee_configs_historial` · `cuentas_comerciales` · `cuenta_roles` | ⚠️ **el grant existe** | **por POLICY** — devuelven **0 filas** como `anon` |

> ### **Siete tablas del circuito contable están cerradas por UNA SOLA capa.**
>
> **Hoy no hay fuga: las siete devolvieron 0 filas medidas.** Lo que se declara
> es la **profundidad de la defensa**, no un defecto: en las cuatro de arriba
> harían falta **dos** errores para abrir (un grant y una policy); en las siete
> de abajo alcanza **uno**. *Y el modo de falla de una policy mal escrita es
> silencioso — devuelve filas, no un error.*

### La frontera vendedor / prestador

**Es la misma en las cuatro tablas del ledger, y es correcta:**

```sql
EXISTS (SELECT 1 FROM cuentas_comerciales cc
        WHERE cc.id = <tabla>.cuenta_comercial_id
          AND cc.owner_profile_id = auth.uid())
```

**⇒ La frontera es por CUENTA COMERCIAL, no por oficio.** Y eso tiene una
consecuencia que conviene declarar antes de que sorprenda: **`MODELO_DESPENSA`
firma «una sola app, el vendedor como ROL sobre `cuentas_comerciales`»**, y hay
**2 cuentas con los DOS roles activos** (`seller_productos` + `prestador_servicios`
— el caso `duenotodo`). ⇒ **su titular ve, en el mismo ledger, los eventos de los
dos oficios.** *Es su plata, así que probablemente es lo correcto — pero es una
decisión de producto que hoy nadie firmó: la toma la forma del predicado.*

**`pagos_eventos` está mejor cerrada que el resto: su SELECT es `is_admin()` a
secas** ⇒ **el payload con `holder_name` y `email` no lo lee ningún usuario
final.** ✅ **Y `webhook_events` no tiene grant para nadie** — solo
`service_role`/`postgres`. **Es la mejor cerrada del circuito.**

### 🔴 LA POLICY QUE QUEDÓ ATRÁS DEL ENSANCHE DE S101

`pagos_intentos` ganó la columna **`cita_id`** cuando S101 llevó el motor de pagos
a los cuatro oficios. **Su policy de SELECT no se enteró:**

```sql
pagos_select :  EXISTS (SELECT 1 FROM pedidos p
                        WHERE p.id = pagos_intentos.pedido_id
                          AND p.user_id = auth.uid())
                OR is_admin()
```

**Población medida:** 34 intentos con `pedido_id` · **7 intentos con `cita_id` y
`pedido_id` NULL** · 0 sin ninguno.

**Rojo producido con discriminador** — mismo usuario, misma tabla, misma consulta:

| | resultado |
|---|---|
| intentos de **pedido** que ve | **33** |
| intentos de **cita** que ve | **0** |

> **El dueño no puede ver su propio intento de pago de una cita.** Solo `is_admin()`.
>
> **Es fail-closed, así que NO es un agujero de seguridad — es un motor sin puerta
> del lado de la lectura.** Y su causa es exactamente la lección que S101 escribió
> y firmó: ***agregar un sujeto obliga a censar TODOS los consumidores del evento,
> no solo la puerta*** (`L-318`). **Acá el consumidor no censado fue una POLICY.**

---

## ③ · EL COMPROBANTE — QUÉ IMPRIME Y A QUIÉN LE LLEGA

### Qué imprime

`supabase/functions/despachar-correo/index.ts`, función `bloqueCodigosPago`, en
orden: **Mascota · Con (negocio) · Fecha · Concepto · Monto · Transacción ·
Autorización · Hora.**

**Medido sobre las 23 intenciones `pago_confirmado` vivas:**

| clave | cuántas la llevan |
|---|---|
| `transaction_id` | 16 de 16 entregadas |
| `concepto` | **9 de 16** |
| **`mascota_nombre`** | **0** ✅ |

⇒ **La plantilla PUEDE imprimir el nombre de la mascota y el productor NO se lo
pone.** *El riesgo de privacidad que la forma sugiere no existe en el dato — y se
declara porque la plantilla lo habilita: el día que alguien agregue
`mascota_nombre` a los datos, el comprobante empieza a llevarlo sin que nadie
toque la plantilla.*

**Y se verificó que el concepto tampoco lo filtra por atrás:** cero de las 23
intenciones tienen un `concepto` que contenga el nombre de alguna mascota de la
base (medido por JOIN, sin leer los textos).

**Las 7 sin concepto son historia, no defecto:** la cura de S101-B (*«medido el
20-ago: el comprobante no lo decía»*) llegó a mitad de vuelo.

**Claves que viajan en la intención:** `authorization_code, compra_id, concepto,
mensaje, moneda, monto, negocio, sujeto_id, titulo, transaction_id`. **Ningún
email, ningún nombre de persona, ningún dato de tarjeta.** ✅ *El dato personal no
se duplica en la cola de avisos.*

### 🔴 A QUÉ CORREO VA — Y ACÁ ESTÁ LA RESPUESTA A LA DELEGACIÓN

**El destinatario se resuelve así** (`despachar-correo`, líneas 379-381):

```ts
const { data: usuario } = await supabase.auth.admin.getUserById(i.destinatario_user_id);
const email = usuario?.user?.email;
```

⇒ **va al correo de la cuenta de auth de `destinatario_user_id`.** La pregunta,
entonces, es quién es ése — y `aplicar_evento_de_pago` lo resuelve **distinto
según el sujeto**:

| sujeto | literal | a quién le llega |
|---|---|---|
| **compra** (despensa), línea 122 | `SELECT c.user_id … FROM compras c WHERE c.id = v_ref` | **a quien compró** ✅ |
| **cita** (servicios), líneas 77-78 | `SELECT m.user_id INTO v_user FROM evento_cita_servicio c JOIN mascotas m ON m.id = c.mascota_id WHERE c.id = v_ref` | 🔴 **al dueño registrado de la MASCOTA** |

> ### **En servicios, el comprobante NO va a quien pagó: va al `user_id` de la mascota.**
>
> **Las dos ramas del mismo motor eligen destinatario con criterios distintos**, y
> ninguna de las dos lo declara.

**Lo que eso significa si el pagador no es el dueño de la mascota** —un miembro
de la familia, o un cobro de mostrador—: **quien puso su tarjeta no recibe su
respaldo de transacción, y el respaldo con monto, comercio y los dos códigos de
certificación le llega a un tercero.**

### ⚖️ Y AHORA LA MITAD HONESTA: HOY NO PUEDE PASAR, Y SE MIDIÓ

| medición | valor |
|---|---|
| familias totales | 82 |
| **familias con más de un miembro** | **0** |
| citas totales | 194 |
| **citas cuya mascota tiene `user_id` NULL** | **0** |

⇒ **con los datos de hoy, pagador y dueño de la mascota son siempre la misma
persona.** *La divergencia es estructural y está latente; no está ocurriendo.*

> **Su disparo es concreto y hay que escribirlo: la primera familia con dos
> miembros, o el primer cobro de mostrador de una cita.**

### 🔴 EL SEGUNDO FILO DE ESAS DOS LÍNEAS, y es de motor

**`destinatario_user_id` es `NOT NULL`** y **`mascotas.user_id` es NULL en 51 de
75 mascotas (68 %)**. Si una de esas mascotas tuviera una cita pagada,
`v_user` sale NULL, el INSERT de la intención viola el NOT NULL, **y
`aplicar_evento_de_pago` no tiene manejador de excepción** ⇒ **el pago no se
aplicaría**: la cita no pasa a `pagada`, el intento no se cierra, y el proveedor
reintentaría contra el mismo error.

**Se declara como LATENTE y no como defecto vivo**, porque las 194 citas tienen
dueño. **Pero no hay candado**: `mascotas.user_id` es nullable y nada impide
agendar una cita a una mascota sin él. *Lo que hoy lo evita son los datos, no el
diseño.*

> **⚠️ ERROR PROPIO DE INSTRUMENTO, DECLARADO:** la primera medición de «¿tiene
> manejador de excepción?» usó `~* 'EXCEPTION'` y dio **true** — y era un
> **`RAISE EXCEPTION`**. *El instrumento midió la palabra y yo iba a reportar la
> estructura.* Se releyeron las líneas y la respuesta correcta es **no hay
> handler**. Queda escrito porque el verde falso habría cambiado la conclusión
> justo al revés.

---

## ④ · LOS LOGS DE LAS EDGE FUNCTIONS DE PAGO — casi todo verde

| función | líneas | `console.*` | qué escribe |
|---|---|---|---|
| **`pagos-cobro`** | 341 | **0** | **nada** ✅ *la que más dato sensible maneja no loguea* |
| `pagos-alta-tarjeta` | 183 | 1 | solo `error.message` de la RPC ✅ |
| `pagos-webhook-stg` | 274 | 6 | 5 son mensajes de error; **1 loguea el retorno del actuador** — medido: es `{ok, aplicado, motivo}`, **sin dato personal** ✅ |
| `pagos-conciliar` | 112 | 3 | ids internos y errores ✅ |
| **`pagos-borrar-tarjeta`** | 113 | 4 | 🟡 **línea 89: `crudo.slice(0, 300)`** |

### 🟡 EL ÚNICO PUNTO A DECLARAR

```ts
if (!r.ok) {
  const crudo = await r.text().catch(() => '');
  console.error('[borrar-tarjeta] el proveedor rechazó', r.status, crudo.slice(0, 300));
```

**Es el único lugar del circuito donde una respuesta ajena entra al log sin
filtrar.** *Es un cuerpo de ERROR del proveedor, así que lo esperable es un
código y un mensaje —no dato de tarjeta— **pero eso es una expectativa, no una
medición**: no se provocó un rechazo real y no se leyó ningún cuerpo.*

**Se reporta como superficie declarada, no como fuga**, y su cura barata sería
loguear el `status` y un identificador propio en vez del cuerpo.

---

## ⑤ · LO QUE ESTE CENSO **NO** MIDIÓ — declarado, no omitido

1. **Los logs REALES de las edge functions en el panel de Supabase.** Se auditó
   **qué escriben** leyendo el código; **no se leyó ningún log emitido**.
2. **No se provocó un rechazo del proveedor** para ver qué trae ese `crudo`.
3. **No se midió la superficie del admin** (si su pantalla de comisiones muestra
   o come el error de la tabla borrada — ver relevamiento C0).
4. **No se auditó el resto de las tablas del producto**, solo el circuito de
   plata y sus vecinas inmediatas.
5. **Nada se tocó.** Cero escrituras, cero grants, cero funciones ejecutadas que
   muten. Las únicas transacciones abiertas fueron `BEGIN … ROLLBACK` de solo
   lectura para probar RLS.

---

## ⑥ · LO QUE SALE DE ACÁ, POR DUEÑO

**Nada de esto se cura en esta sesión.** Va servido para que la mesa adjudique.

| hallazgo | naturaleza | dueño natural |
|---|---|---|
| retención infinita del payload con `holder_name` + `email` | **letra que falta** (la misma de D-732/D-733) | **founder / legales** |
| el comprobante de cita va al dueño de la mascota, no al pagador | **producto** — es una decisión, no un bug | **founder** |
| `mascotas.user_id` NULL + `destinatario_user_id` NOT NULL sin handler | **motor**, latente con disparo nombrado | **pista A** |
| la policy de `pagos_intentos` no conoce `cita_id` | **motor**, fail-closed | **pista A** |
| 7 tablas del ledger cerradas por una sola capa | **defensa en profundidad** | **pista A**, con firma de mesa |
| `crudo.slice(0,300)` al log en `pagos-borrar-tarjeta` | **higiene**, barata | **pista A** |
| la plantilla del comprobante habilita `mascota_nombre` | **vigilancia**, no defecto | quien toque el comprobante |
