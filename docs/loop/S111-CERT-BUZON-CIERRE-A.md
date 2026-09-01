# BUZÓN A · CIERRE DE LA PISTA CERT — S111
### Escrito el **1-sep-2026, 17:29 -05**

> **Contexto de TODA medición de este parte:** medido contra **`origin/main` =
> `67fec425`**, traído con `git fetch` a las **17:26 -05 del 1-sep**.
> ⚠️ **La rama sigue caminando después de esta hora.** *Un sha citado en un
> mensaje es una foto; si A lee esto mañana, re-mide.*
>
> **`main` estaba VERDE al cerrar:** 4 typechecks en 0 (`packages/api`,
> `packages/ui`, `apps/cliente`, `apps/prestador`) sobre `67fec425`.
> ⇒ **No hubo licencia para curar nada. Todo defecto de hoy va fichado.**

---

## 🔴 ANTES DE LAS SEIS SECCIONES — DOS CORRECCIONES QUE ME DEBO

### ① Mi buzón anterior tenía un bloqueante que NO EXISTÍA

`docs/loop/S107-CERT-CIERRE.md` decía, en su tabla de pendientes:

> *«🔴 `D-946`/`D-947` — el conciliador no alcanza las citas — **BLOQUEANTE DE
> PRODUCCIÓN**»*

**Es falso, y ya está corregido en su archivo** (tachado, no borrado). Lo
fabricaba un instrumento: `pagos_aprobados_sin_sujeto_movido()` decide por
`pedidos.pagado_en IS NULL`, **y esa columna no la escribe nadie** en el camino
del pedido ⇒ contaba como plata detenida **hasta tres pedidos ENTREGADOS**.

🔴 **Y el agravante es de método:** medido hoy, **`D-946` y `D-947` NUNCA SE
DEPOSITARON** — cero fichas en el canon. *Cité dos números de deuda para darle
peso a un bloqueante, y ni el bloqueante ni las fichas existían. Un número de
ficha se lee como evidencia aunque no haya nada detrás.*

### ② `D-998` — LO TOMÉ Y ESTABA TOMADO. **No lo renumero: lo arbitra A.**

Deposité una ficha como `D-998` a las 16:05. El founder avisó que **hoy se tomó
dos veces mientras dos pistas medían**. Medido contra `67fec425`: **en `main`
sólo aparece la mía** ⇒ la otra vive en una rama sin mergear y **no la puedo ver
ni comparar**.

**Vive en `docs/DEUDAS_CANONICAS.md:25992`, citada además desde
`MOTOR_DE_PAGOS_ESTADO.md` (2 veces) y `DEFINICION_SOFTLAUNCH.md` (1).**

⚠️ **Pedido a A: asigná el número. Yo no vuelvo a elegir uno** — es la segunda
vez hoy que un número mío choca, y la primera fue peor porque ni existía.
**Las cuatro referencias se corrigen juntas o queda un puntero roto.**

---

## ① CONSTRUIDO Y EJERCIDO — por qué camino se probó

| qué | por qué camino |
|---|---|
| **La lista de medios lee `card/list`** — aparece la tarjeta que vive en el proveedor y no en nuestra tabla | 🟢 **Gate del founder en el aparato**: la Visa …1111 apareció |
| **Borrado por `token`**, con pertenencia probada contra `card/list` | 🟢 **Gate del founder**: la borró, y la desincronía se reparó sola |
| **Freno A′** (`tarjeta_con_plan_activo`) antes de tocar al proveedor | 🟢 **Gate del founder**, con su voz correcta. Discriminador medido antes: la Diners cuelga de `debad20f`, `estado='activa'` |
| **El vencimiento desde el proveedor** (`expiry_month/year`) | 🟢 **Gate del founder**: se ve |
| **Mapa de códigos del wrapper** — 5 códigos que faltaban | 🟢 Ejercido **dentro del gate ②**: sin esto A′ decía *«probá de nuevo»* |
| **`D-961`** — el alta que falla deja rastro | 🟢 En el aparato, ejemplar `b955e0c2` |
| **El reverso** de `DF-2110458` ($70,90) | 🟢 **Ejercido hoy 15:17**. Verificado **contra el objeto**: intento → `reversado`, pedido → `cancelado_sistema`, **mismo microsegundo** |
| **Gate de edges**: parseo roto = ROJO siempre | 🟢 **Rojo producido** y verde restaurado |
| **Edge `pagos-tarjetas` v7** | 🟢 Verificada **por contenido**: `functions download` + diff byte a byte |

---

## ② CONSTRUIDO Y NO EJERCIDO — *se lee como hecho, y no lo está*

**Seis ramas que compilan y que nadie corrió por el camino real.**

| qué | qué haría falta para ejercerla |
|---|---|
| **Fail-open de la lista** (`verificado:false`) + su voz `mediosSinVerificar` | que **Nuvei no responda**. Nunca pasó en el gate |
| **Voz `mediosOcultas`** (tarjetas que el banco ya no tiene activas) | que `ocultas_por_estado > 0`. **El founder no la reportó** ⇒ no la vio |
| **`no_pudimos_verificar`** — el fail-**closed** del borrado por token | que `card/list` falle **durante** un borrado |
| **Los 3 campos nuevos en la rama fail-open de la edge** (vencimiento desde NUESTRA tabla) | lo mismo que la fila 1 |
| **El reintento de `anotarIncidente`** | que el primer intento falle. **Nunca falló** |
| **El fallback de `/already\s*added/i`** | que el proveedor cambie su texto. **Siempre matcheó** |

> 🔴 **La más importante de las seis es la primera**, y no por su tamaño: **es el
> camino que corre justo cuando el proveedor está caído** — o sea, el peor
> momento posible para descubrir que nunca se probó.

---

## ③ ENTREGADO Y NO MONTADO — piezas sin consumidor

| pieza | dónde está | de quién es la puerta |
|---|---|---|
| **`TarjetaVerificada` con `expiraMes` · `expiraAnio` · `creadaEn`** | `packages/api` | **El checkout no la consume**: `seccion-medio-de-pago.tsx` sigue leyendo nuestra tabla. Puerta de **C** |
| **`RefBorrado` con `{ token }`** | `packages/api` | Único consumidor: `medios.tsx`. **Nadie más borra por token** |
| **`MedioDibujable`** (la fila pide una FORMA, no un tipo) | `apps/cliente/src/components/fila-medio-de-pago.tsx` | Montada por las **dos** pantallas ✅ — *ésta sí tiene consumidor, va acá sólo para que no se busque* |
| **`solo_del_proveedor`** — el contador que prueba que la inversión sirve | edge `pagos-tarjetas` | **Ninguna pantalla lo lee.** Es el termómetro de la desincronía y hoy no lo mira nadie |

---

## ④ NO CONSTRUIDO A PROPÓSITO — con su razón

*Sin esta lista se lee como trabajo que faltó.*

| qué | por qué NO |
|---|---|
| **El checkout a la fuente verificada** | Usa `m.tipo`, que `TarjetaVerificada` **no tiene**. Son dos caminos —**ensanchar la forma** o **traducir el selector**— y es **camino de plata**: decisión de mesa, no de quien construye |
| **`onError`/`onHttpError` del WebView** | **No es cablear dos handlers.** La edge rebota sin `Origin` y `anotar_incidente_alta` **no la puede ejecutar `authenticated`** (medido: `false`) ⇒ hay que **abrir una puerta cerrada a propósito**, de uno de los dos lados |
| **Cambio de medio de pago de una suscripción** | **No existe** — cero pantalla, cero wrapper. *Por eso A′ manda a soporte y no lo promete: prometer una acción que no existe es peor que frenar sin salida* |
| **La cura del instrumento (`pagado_en`)** | **Dos curas y sólo una es correcta**: llenar la columna, o que el criterio lea el ESTADO. **Elegir sin medir los otros lectores de `pagado_en` rompe algo del otro lado** |
| **Plurales en el riel i18n** | `mediosOcultas_one/_other` **rompería las keys tipadas**. Meter un mecanismo de plurales es **decisión del riel**, no de una pantalla |
| **Reverso de los 22 casos viejos de Nuvei** | Están **fuera de ventana** (20-31 ago; cierra 17:00 del día). Y tras §⑦ del estado, **no son lo que parecían** |

---

## ⑤ FICHAS Y LECCIONES — **sin número; los pide A**

### Fichas

| tema | disparo (cuándo se cobra) |
|---|---|
| **El instrumento sobre-reporta** — `pagos_aprobados_sin_sujeto_movido()` mide `pedidos.pagado_en`, columna sin escritor ⇒ cuenta pedidos **entregados** como plata detenida. **Hoy depositada provisoriamente como `D-998`** | **Antes de volver a usar su número para decidir algo.** Y su nota ancha: el criterio de `pedido` es **uno de seis** y **los otros cinco nunca se probaron contra un caso conocido** |
| **El censo de mapas de códigos** — cuántos wrappers tienen vocabulario cerrado y cuántos están al día con su edge *(hoy `D-984`)* | Antes de agregar un rebote nuevo a cualquier edge de plata |
| **El `onError` del WebView** *(hoy `D-985`)* | La decisión de mesa sobre **cuál puerta** se abre |
| **`pedido_items` queda en `pendiente` tras un reverso** | Cuando alguien lea estado de ítem para decidir algo. *Hoy es inofensivo: el pedido manda* |
| **`D-946`/`D-947` — números tomados y nunca depositados** | **Ya**: A los libera o los declara vacíos. *Un hueco se declara, no se rellena* |

### Lecciones

| | disparo |
|---|---|
| **Peor que no tener voz es tener la voz de otro** *(hoy `L-440`)* — un código no reconocido no llega mudo: llega disfrazado del genérico, y el genérico suele decir lo contrario. **Ningún typecheck cruza un cable** | Cada vez que se agregue un rebote a una edge |
| 🔴 **Un instrumento que decide un bloqueante se prueba contra un caso de resultado conocido ANTES de que su número entre a un documento** | Ya. *Costó un bloqueante inventado y dos números de ficha citados sin ficha* |
| **Dos mediciones del mismo hecho el mismo día con conclusiones opuestas no se resuelven eligiendo: se resuelven preguntándole al sujeto** | Cuando dos pistas midan lo mismo |
| **Los números de ficha caducan en días** — usé `D-983`/`L-439` de hace **dos** días y el tope real era `D-997`/`L-468`: corrieron S108→S111 | Todo depósito |

---

## ⑥ LO QUE ESPERA FIRMA O AUTORIZACIÓN DEL FOUNDER

*(en lenguaje de negocio · una línea · con evidencia y mi voto)*

| | evidencia | mi voto |
|---|---|---|
| **① Producción sigue bloqueada por terceros, no por nosotros** — faltan credenciales productivas y host | `PAGOS_AMBIENTE` sigue en `sandbox`, **probado**: el reverso de hoy trajo `"Reverse by mock"` del propio proveedor | **Pedirlos a Erick con fecha.** Es lo único entre el motor certificado y cobrar de verdad |
| **② El selector de medios del checkout todavía no ve las tarjetas del proveedor** — si alguien tiene una tarjeta que vive sólo en Nuvei, **la ve para administrarla y no para pagar** | `seccion-medio-de-pago.tsx` lee nuestra tabla | **Mesa corta**: decidir *ensanchar la forma* vs *traducir el selector*. **Voto: ensanchar** — una sola fuente evita que las dos pantallas vuelvan a divergir |
| **③ Nadie puede cambiar la tarjeta de su plan de guardería** | Cero pantalla, cero wrapper. **1 suscripción activa hoy** (la tuya) | **Construirlo antes del primer plan de un tercero.** Hoy la única salida es escribirnos, y eso no escala más allá de vos |
| **④ El guard del IVA corta TODO IVA > 0** — no valida el porcentaje | Medido en S105; sigue igual | **Preguntar al contador y a Erick.** Bloquea el camino gravado el día que entre un producto con IVA |
| **⑤ El recurrente sigue inerte a propósito** — faltan **3 claves de `app_config`** | El timbre lee la clave y sin ella devuelve `recurrente_apagado` | **Que sigan apagadas hasta que §② esté cerrado.** *Encender un cobro automático mientras el selector no ve todas las tarjetas es cobrar sin poder explicar con qué* |

---

## OPERATIVO

- **Medido contra `origin/main` = `67fec425`, 1-sep 17:26 -05.**
- **Mis commits en `main`** (mergeados y verificados por contenido en su momento):
  `5b7906d8` · `4cd19815` · `817d8c09` · merge `15bbb5b4` (30-ago) ·
  `72aca697` · merge `4a92e757` · `e7e3ef31` (1-sep).
- **Documentos que dejo:** `docs/MOTOR_DE_PAGOS_ESTADO.md` (nuevo, el primer
  doc de ESTADO del motor) · `DEFINICION_SOFTLAUNCH` enmendada ·
  `S107-CERT-CIERRE.md` **corregido** · este buzón.
- **OTA vigente del cliente publicado por mí:** group
  `f2843330-0c7e-4942-bdf3-a7b3fe70a4f3`, runtime **1.0.6**, ancla `4cd19815`
  **leída del OBJETO**. ⚠️ **Otras pistas publicaron después** — A re-mide el
  vigente con `eas update:list` desde `apps/cliente/`, **no de este parte**.
- **Edges desplegadas por mí:** `pagos-tarjetas` **v7** · `pagos-borrar-tarjeta`
  **v17** · `pagos-alta-tarjeta` **v27**.
- **Nada quedó sin commitear ni sin pushear.**
