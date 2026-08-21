# S102-B · DOS FICHAS DEL CENSO DE RESPUESTAS — `D-867` y `D-868`

> ✅ **Números asignados por A el 21-ago**, midiendo ASIGNACIONES y no menciones.

> **`L-331` rige: el número lo pone quien deposita — y lo puso A.**
>
> ⚠️ **Y una trampa propia, declarada, porque es del mismo día:** `D-865` y
> `D-866` dieron **2 en mi árbol** — **y era mi propio texto**: mis dos fichas
> anteriores los nombran como candidatos medidos. **Mi grep contó menciones y yo
> iba a leer asignaciones.** *La misma clase que este relevamiento documenta,
> ahora sobre el instrumento que la regla del número usa.*
>
> **LAS CUATRO DE LA TANDA, ya numeradas:** `D-865` el perfil · `D-866`
> `requireCommit` · **`D-867`** y **`D-868`** las de abajo.

---

## `D-867` — 🔴 TODO LO NO APROBADO COLAPSA EN UNA SOLA SALIDA

> ### **La ley define SIETE causas con voz. El actuador tiene DOS salidas. Y las tres reales que la base vio caen en la de SOPORTE.**

🔴 **ALTA.**

### ① LO MEDIDO

**La ley** (`LETRA_MOTOR_PAGOS_S101` §7 + E5) define **siete** causas, cada una
con su voz **y su salida**: rechazo del banco → *otra tarjeta* · OTP → *reintentar
el código* · fondos → *otra tarjeta, sin nombrarlo* · timeout → *esperar, no es
rechazo* · datos inválidos → *corregir* · **desconocido → soporte** · compuerta
pre-cobro → *resolver y reintentar*.

**El motor** tiene **un solo brazo default**:

```sql
IF NOT _pago_aprobado(...) THEN
  UPDATE webhook_events SET resultado='desconocido',
    detalle = ... || ' · actuador: status=' || status || ' no confirma';
```

**Y los tres rechazos que la base realmente recibió terminan los tres ahí:**

| par visto | `resultado` |
|---|---|
| `0/31` | `desconocido` |
| `2/32` | `desconocido` |
| `5/14` | `desconocido` |

### ② EL COSTO, y se paga DOS VECES

**`desconocido` es literalmente la fila 6 de la ley** — *«No pudimos completar el
cobro, ya lo estamos viendo → **Soporte**»*.

> ### **Un rechazo del banco —que la ley manda resolver con «probá otra tarjeta»— saca al cliente del flujo Y genera un caso de soporte que no era.**
>
> **Las dos salidas no son intercambiables: una devuelve al cliente al producto;
> la otra lo saca.** *El cliente que podía pagar con otra tarjeta no lo intenta, y
> la casa atiende un ticket que no existía.*

**Y el daño secundario, que es de gobierno:** con una sola etiqueta **no se
pueden contar por separado**. *Un tablero que mida «pagos fallidos» hoy no puede
distinguir un problema del banco de un problema nuestro.*

### ③ LA CURA — es de FORMA, **no de vocabulario**

> **Separar «no aprobado CON causa conocida» de «no aprobado SIN causa».**
> **NO nacen voces nuevas** — el vocabulario cerrado no se amplía de paso, y el
> punto 4 de la orden ya se cumple hoy: **el cliente jamás ve un código del
> proveedor**.

*Lo que falta no es decir más cosas: es poder decir la que corresponde.*

### 🔒 ④ BLOQUEADA, Y POR ALGO QUE NO ESTÁ EN NUESTRAS MANOS

**La tabla oficial de `status_details` de Nuvei no se pudo obtener** (dos
intentos contra `developers.paymentez.com`; la página es una SPA y esa sección no
viaja en el render). **La consigue la MESA por Erick — hilo activo.**

> ### **Sin esa tabla no se puede mapear `31` a «banco no autorizó», porque no se sabe qué es `31`. Y mapearlo por parecido sería exactamente el defecto que el censo vino a medir.**

*Es la disciplina de `LETRA_DEUNA` §12: **se preguntan, no se adivinan.***

> **Dueño:** la cura es **motor → pista A**; **la tabla es de la mesa (Erick)**.
> **☠️ DISPARO: la ventana de certificación** — cuando haya rechazos reales de un
> tarjetahabiente, cada uno mal clasificado es un cliente perdido y un ticket
> falso.
> **☠️ MUERTE:** un no-aprobado con causa conocida y uno sin causa **se
> distinguen en el registro y en la salida**, y se pueden contar por separado.
> **Se cruza con:** `LETRA_MOTOR_PAGOS_S101` §7 (la ley que hoy no se cumple
> entera) · `D-868` (abajo).
> Origen: S102-B, censo del catálogo de respuestas.

---

## `D-868` — 🟡 LOS ESTADOS DE TARJETA `review` · `pending` · `rejected` NUNCA SE EJERCITARON

🟡 **ALTA.**

### Lo medido

| `card.status` en el crudo | veces |
|---|---|
| `valid` | **8** |
| `review` | **0** |
| `pending` | **0** |
| `rejected` | **0** |

**Y los tres existen: la doc oficial de Nuvei los enumera** — es lo único de esa
doc que **sí** se pudo confirmar en los dos intentos de fetch.

> ### **El alta de tarjeta corrió ocho veces y las ocho por el camino feliz.**
>
> *No es que el manejo esté mal: es que **nunca se probó**. Y una rama sin caso
> no tiene verde ni rojo — tiene silencio.*

### Por qué importa más de lo que su color sugiere

**`review` es el peor de los tres**, y por eso vale nombrarlo: *no es un fallo
—la tarjeta puede terminar siendo válida— y tampoco es un éxito.* **Si el motor
lo trata como cualquiera de los dos extremos, el cliente recibe una respuesta
falsa en un caso que la casa nunca vio.**

*Es la misma forma del hallazgo de la ficha ③, un piso más arriba: un estado
intermedio aplastado contra uno de los bordes.*

> **Dueño:** pista A (motor) · su verificación es de **gate**, no de censo.
> **☠️ DISPARO: la ventana de certificación con OTP real** — es la primera
> ocasión en que un emisor de verdad puede devolver `review` o `rejected`.
> **☠️ MUERTE:** los tres estados **tienen camino medido** —con su voz y su
> salida— **y al menos uno se ejercitó contra el proveedor**, no contra un
> fixture.
> **Se cruza con:** `D-867` (misma forma) · `LETRA_MOTOR_PAGOS_S101` §7.
> Origen: S102-B, censo del catálogo de respuestas.

---

## ⑤ · LO QUE **NO** VA EN NINGUNA DE LAS DOS — declarado

**El «estado honesto del intento» NO se convierte en ficha, porque no se pudo
verificar.** Los 8 casos `desconocido` de la base **no tienen intento ligado**:
son sondas del arnés disparadas contra el endpoint, no cobros reales.

> **La rama no-aprobada nunca corrió contra un intento real.** **Queda como
> LÍMITE DEL CENSO, y no se maquilla a verde** *(dictamen de mesa, punto 6)*.

*Declararlo como ficha sería afirmar un defecto que no medí; declararlo verde
sería peor. **Es un silencio, y se nombra como silencio.***
