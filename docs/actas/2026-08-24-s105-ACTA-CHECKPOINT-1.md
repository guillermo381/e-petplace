# S105 · ACTA DE CHECKPOINT 1 — para firma del founder

> **Mesa 106 (numeración del founder) · S105 (bitácora).** 24-ago-2026.
> Armada por **A** al cierre del turno 0. **Ninguna tanda arranca antes de la
> firma de esta acta.**
> Evidencia completa: `docs/loop/S105-A.md`. Acá va sólo **lo que se firma**.

---

## §1 · ESTADO DE LAS CUATRO MEDICIONES

| § | qué | dueño | estado |
|---|---|---|---|
| **1.1** | *(la de D)* | D | 🔴 **SIN INSUMO** — D no abrió: cero worktrees, cero ramas `s105-*`, cero depósitos |
| **1.2** | *(la de D)* | D | 🔴 **SIN INSUMO** — ídem |
| **1.3** | **Nuvei** | **A** | ✅ **HECHA** contra la base viva |
| **1.4** | **WhatsApp** | **A** | ✅ **HECHA** contra la base viva |

**El checkpoint sale con dos huecos NOMBRADOS y no rellenados.** *Un checkpoint
que completa el hueco de otra pista con una suposición es peor que uno
incompleto* — y esta casa ya midió, once veces en la sesión anterior, lo que
cuesta un color producido por la razón equivocada.

---

## §2 · LOS DOS FRENOS DE ENCUADRE

### 🔴 F1 — `PLAN_MESA_106` no existe

Rige esta mesa y **no está en `docs/`, ni en ningún commit, ni llegó pegado**.
**No se compone de memoria** (freno 76b · `L-142`). **Pedido: su texto completo.**

*Lo único de él que ya es canon y no hace falta pedir:* su §0 —***«no alcanza con
mirar el color: hay que preguntar quién lo produjo»***— es **literal de
`S104-A.md` y su traspaso §5**, donde nació con sus once casos.

### 🔴 F2 — las mediciones de D no tienen dónde leerse

No es que no llegaran: **D no ha abierto**. El punto 4 del encargo queda abierto
**por ausencia de insumo, no por falta de trabajo**.

---

## §3 · LO QUE PIDE FIRMA HOY — una sola cosa, y es la urgente

### 🔴 H2 · EL CIERRE DE CUENTA ESTÁ ENCENDIDO Y LE FALTA SU RELOJ

Medido en `app_config`: **`cierre_cuenta_vivo = true`** ·
**`exportacion_datos_viva = false`**.

**Encender fue derecho del founder y no se juzga.** Lo que se declara es lo que
quedó del otro lado:

1. **`ejecutar_cierres_vencidos` existe y ningún cron la llama.** Los **18** jobs
   se leyeron **con su `command` completo**, no por su nombre. ⇒ el acto ①
   (quitar acceso, **reversible**) corre por RPC; el acto ② (día 30, **terminal**)
   **no tiene quién lo dispare**.
2. **La exportación está apagada mientras el cierre está vivo**, y P15 promete —y
   la pantalla dice— que **se le ofrece su copia antes de irse**.

**Por qué no puede esperar al plan:** su modo de falla **no tiene síntoma hasta
el día 30 de una persona real**, y para entonces la ventana de arrepentimiento
de §19.2 **existiría en la tabla y no en la vida** — la misma frase con la que
S104 justificó separar los dos actos.

**Tres salidas. Ninguna se toma por iniciativa:**

- **(a)** apagar `cierre_cuenta_vivo` hasta que el cron exista *(recomendada por A:
  es la reversible)*
- **(b)** crear el cron **y** encender la exportación
- **(c)** dejarlo así, **declarándolo**, si el alcance de hoy es sólo el acto ①

> **FIRMA: ▢ (a) ▢ (b) ▢ (c)**

---

## §4 · LO QUE SE DECLARA ANTES DE EMPEZAR — `D-897` y `D-900` MUERDEN LA CERTIFICACIÓN

**Se declaran ahora, no después.** Son de **producto**, no de texto: *no se
resuelven redactando mejor.*

| ficha | qué dice | cómo muerde la certificación de Nuvei |
|---|---|---|
| **`D-897` ②** | la **liquidación** nunca se probó punta a punta — **cero liquidaciones** | es el acto que cierra el circuito del dinero; sin él sólo se demuestra el cobro |
| **`D-897` ③** | falta la leyenda **«no es factura»** en el comprobante | **el comprobante ES la pieza que la certificación mira** ⚠️ *no medido en este turno: vive en la plantilla de `despachar-correo`* |
| **`D-897` ④** | re-verificar §14.4 **cuando la fee del procesador deje de ser cero** | hoy es cero; **certificar es el paso previo a que deje de serlo** |
| **`D-900`** | el sistema **no expresa el mandato de recaudación** que §17 ya firmó — y **lo grave es que tampoco falla**: mandato y nombre propio producen los mismos registros | **disparo: antes de la primera liquidación real**, que es el primer acto de rendición del mandato. **Ata con `D-897` ②:** la liquidación no se puede probar sin probar el mandato |

---

## §5 · LO MEDIDO QUE LA MESA TIENE QUE SABER

### ✅ Lo que está bien y no hay que re-auditar

- **El dato que la certificación pide EXISTE:** los **25 cobros aprobados de
  Nuvei traen `authorization_code` y `transaction_id`, los 25**. Los rechazados
  no traen ninguno — **que es lo correcto**.
- **El comprobante por correo CORRE:** `pago_confirmado` activo, `canal_forzado
  = email`, `ignora_techo = true`, **20 entregadas**, y sus `datos` llevan los
  dos códigos.
- **El recurrente sigue inerte por diseño:** `recurrente_vivo` **no existe** como
  clave; el job 17 corre a las **09:00 Guayaquil** y devuelve `recurrente_apagado`.
  **La llave sigue siendo del founder.**

### 🔴 H1 · Tres cobros de Nuvei que no cerraron — y uno es posterior a la cura de S103

`10,75` (**23-ago**) · `6,00` · `70,90`, los tres en **`pendiente`** con
`motivo_rechazo` y `hallazgo` en **NULL** — *no fallaron: no se resolvieron*.
Sus webhooks **llegaron autenticados** (`credencial=SERVER · autenticado=true`) y
quedaron en `recibido` con **`pago_id = null`**.

**No se afirma la causa.** `recibido` puede ser el estado legítimo del buzón que
*persiste antes de analizar*. Lo que **sí** está medido: **`pagos_actuador_vivo =
true`** ⇒ la explicación fácil está descartada, y el más reciente es **posterior
a la cura del actuador multiproveedor** ⇒ no lo cubre «eso ya se arregló».

**Muerde la certificación de forma concreta:** el paso 9 pide **demostrar un caso
con DF + código de autorización**; los datos están y **el circuito de esos tres
no cerró**. *Un caso que no cierra no se puede presentar como caso.*

### 🔴 WhatsApp está apagado en CUATRO capas, y una es construcción

`transporte_vivo = false` · **cero** tipos con `canal_forzado='whatsapp'` ·
**cero** cron · y **el productor del mapeo tipo → plantilla NO EXISTE**,
confirmado **desde las dos puntas**: cero filas con la clave `plantilla` en las
219 intenciones, **y** cero funciones en `pg_proc` que puedan escribirla.

> **Encender las tres capas de configuración sin construir la cuarta no deja
> WhatsApp funcionando: deja cada aviso cayendo en `sin_plantilla_resuelta`.**

**El token existe como secreto** (`META_WHATSAPP_TOKEN`, 08-ago). **Su validez no
es medible con `secrets list`, que da digest y no valor** — y por eso no se
afirma. *La medición barata que sí la contesta es el modo diagnóstico de solo-GET
de la propia edge, y es territorio de D.*

### 🟡 DeUna — el choque que trae su respuesta de hoy

**La ventana de reverso es de 24 horas** (respuesta del proveedor, depositada
verbatim en `docs/DEUNA_RESPUESTA_2026-08-24.md`). **`LETRA_MOTOR_PAGOS_S101`
§5.0 y `LETRA_DEUNA` §8 fundan las compuertas pre-cobro en que el reverso es
MISMO-DÍA.** *No son lo mismo:* un cobro a las 23:50 tiene diez minutos de
mismo-día y 24 horas de ventana real. **Ninguna letra se tocó. Lo arbitra la mesa.**

**Y la respuesta le quita el último argumento a `D-888`:** los reversos **se
pueden simular** ⇒ el reverso mismo-día **ya no espera al proveedor: espera un
dueño.** Medido hoy: **cero reversos, `reverso_fallido` en cero filas**, y `forma
= tokenizacion` en las 44 de la tabla. *Hoy Nuvei corre un solo caso.*

---

## §6 · LO QUE ESTA MESA NO HACE *(declarado al abrir)*

No construye **telemedicina, adopción ni guardería** — se escriben en mesa · **no
publica Títulos IV y V** · **no enciende WhatsApp sin token real** · no toca un
circuito de dinero antes de saber quién produjo el color (H1) · no renumera
sesiones.

---

> **FIRMA DEL FOUNDER:** ▢ Checkpoint 1 aprobado · se autoriza la tanda 1
> **PENDIENTE DE ÉL:** el `PLAN_MESA_106` · la salida de H2 · el arbitraje de la
> ventana de reverso · el dueño de `D-888`.
