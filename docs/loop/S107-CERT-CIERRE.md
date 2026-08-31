# CIERRE · S107-CERT — el frente de tarjetas
### 30-ago-2026 · **`D-922` CERRADA por gate del founder en el aparato**

> Reemplaza a `S107-CERT-TRASPASO.md`, que se escribió a mitad de camino y
> **queda vigente sólo como registro de lo que se sabía entonces.**
> Todo lo de acá está **medido contra el objeto**.

---

## ① 🟢 EL GATE — los tres pasaron, y el ① es el que prueba la tesis

| | qué se probó | veredicto |
|---|---|---|
| **①** | **La Visa …1111 apareció y se borró** | 🟢 *«la desincronía se reparó sola»* |
| **②** | El freno A′ de la Diners **con su voz correcta** | 🟢 |
| **③** | El vencimiento se ve — el ensanche llegó | 🟢 |

**El ① es el que cierra `D-922`, y hay que decir por qué es más que «funcionó»:**
esa tarjeta vivía en Nuvei bajo el uid del founder y **no en nuestra tabla**. Con
la fuente vieja era **inexpresable** — ni se veía ni se podía borrar — y sólo la
habría descubierto quien intentara volver a agregarla y recibiera un rechazo sin
explicación.

> **Con `card/list` como fuente, la reparación no necesitó a nadie: apareció, se
> borró, y los dos lados quedaron iguales.** *Ésa era la promesa de invertir la
> fuente, y es la que se ejerció.*

---

## ② LO QUE SE GANÓ HOY — es más de lo que la mañana prometía

La jornada abrió para **medir el estado de certificación**. Cerró con cuatro
cosas que no estaban en el plan del día:

### 🟢 `D-961` — un alta que falla ahora deja rastro

Seis altas de una noche habían quedado `pendiente` sin motivo,
**indistinguibles de una en curso salvo por el reloj**. Y era **el defecto que
tapaba a todos los demás**: cada vez que algo falló, el rastro que lo habría
explicado no existía.

⚠️ **La puerta ya estaba construida y sin usar:** `pagos-alta-tarjeta` aceptaba
`desenlace: 'incidente'` desde `D-925` —*anotar sin cerrar*— **y la página nunca
la llamaba.** `L-318` en su forma limpia. Verificado en el aparato con el
ejemplar `b955e0c2`.

### 🟢 La voz con fundamento del proveedor

*«Esa tarjeta ya está agregada»* dejó de ser una adivinanza. Sale **del motivo
que manda Nuvei**, con matcheo tolerante (`/already\s*added/i`) **y fallback a la
genérica** — porque el texto del proveedor puede cambiar sin avisar, y **el
motivo crudo queda intacto en el rastro** aunque el matcheo falle.

*No se adivina bien la mayoría de las veces: se dice lo que el proveedor dijo, o
se calla.*

### 🟢 `D-922` completa, con su gate ejercido

Motor + superficie. La lista lee al proveedor, indexa por **token**, borra por
token con **pertenencia probada contra `card/list`** —*nombrar un token no es
demostrar que es tuyo*— y **frena** (A′) antes de tocar al proveedor cuando la
tarjeta paga un plan activo.

### 🟢 Y la desincronía reparada **sin intervención de nadie**

Ni un SQL, ni un pedido a Erick, ni una limpieza a mano. *El lado que manda pasó
a ser uno solo.*

---

## ③ LOS TRES DEFECTOS DEL DÍA, y son **la misma clase** — `L-440`

> ### Peor que no tener voz es tener la voz de otro.

Los tres sobre **rastros que no llegan**, y los tres murieron en un borde
distinto del mismo camino:

| | dónde murió la información |
|---|---|
| **`D-961`** | el alta fallaba y **no se anotaba nada** |
| **la voz** | el motivo del proveedor **llegaba y se descartaba** por no matchear exacto |
| **`L-440`** | el código llegaba entero y **el mapa del wrapper lo tiraba** |

**El tercero es el más caro y el más invisible.** La edge devolvía **doce**
códigos; el wrapper declaraba **ocho**. `tarjeta_con_plan_activo` —el freno A′—
caía al genérico *«No pudimos borrarla. Prueba de nuevo en un momento.»*

⇒ **Un freno que funciona perfecto se habría leído como falla transitoria**, e
invitaba a reintentar algo que rebota siempre.

🔴 **Y estuvo a punto de cobrarse en el gate de hoy.** El founder lo había
previsto al revés —*«va a mostrar un código sin texto»*— y habría leído como
«falta la voz» algo que era «el código no llega». *Su hipótesis benigna habría
tapado el defecto.* **Lo salvó medir el emisor antes de construir, no el gate.**

**Fichas depositadas:** `L-440` · `D-984` (el censo de mapas de códigos) ·
`D-985` (el `onError`) — `docs/relevamientos/S107-CERT-FICHAS-D984-D985-L440.md`.

---

## ④ EL ENSANCHE QUE SE DECLARÓ EN VEZ DE DARSE POR OBVIO

`card/list` trae el vencimiento. **Sin ensanchar, cambiar la fuente APAGABA** la
línea *«Vence 03/2030»* que la lista ya mostraba.

> **Firma del founder: se queda.** *«Una regresión sin síntoma es la que nadie
> reporta.»*

⇒ **Regla que deja:** *un cambio de fuente se audita por lo que la superficie
DEJA de mostrar, no sólo por lo que empieza a mostrar.* **Lo que se apaga no
tiene stack trace y nadie lo extraña.**

---

## ⑤ LO QUE QUEDA ABIERTO, con dueño y disparo

| | qué | disparo |
|---|---|---|
| 🔴 **`D-946`/`D-947`** | **el conciliador no alcanza las citas** — **BLOQUEANTE DE PRODUCCIÓN** | antes de cobrar de verdad |
| 🟠 **`D-984`** | el censo de mapas de códigos (pregunta del founder) | antes de agregar un rebote a cualquier edge de plata |
| 🟡 **`D-985`** | el `onError` del WebView — **necesita abrir una puerta cerrada a propósito**, decisión de mesa | la decisión sobre cuál puerta |
| 🟡 **`D-962`** | la Visa huérfana **del lado de Nuvei** — camino A firmado: se deja | Erick |
| ⚪ **Erick** | ¿`"Card already added"` es identificador estable o texto de display? | próxima llamada |
| 🟡 **`D-945`** | **tomado y sin depositar** desde S106-C | quien lo tomó |

**Cambio de medio de pago de una suscripción: sigue sin existir.** Medido: cero
pantalla, cero wrapper, **1 suscripción activa** (la del founder). *Por eso A′
manda a soporte y no promete el cambio — prometer una acción que no existe es
peor que frenar sin salida.*

---

## ⑥ OPERATIVO — medido, no recordado

- **Rama:** `pista/s107-rastro` @ **`4cd19815`**, en origin (verificado por sha).
- **`origin/main` (`29cd8007`) es ancestro de HEAD** ⇒ **6 commits adelante, 0
  atrás: el merge es fast-forward limpio.** 🔴 **NO se mergeó — es firma del
  founder.**
- **12 archivos · +727 / −65.**
- **OTA del cliente:** group **`f2843330-0c7e-4942-bdf3-a7b3fe70a4f3`** ·
  android `01a055bf-3686-743f…` · ios `01a055bf-3686-7174…` · runtime **1.0.6** ·
  **ancla `4cd19815`, leída del OBJETO** (`update:view --json` → `gitCommitHash`).
  ⚠️ **Sin asterisco, y quién lo firma importa:** medido, `update:view` expone
  **diez campos y ninguno es el estado del árbol**. *El limpio lo firma el guard
  de veda corrido ANTES de bundlear* (`git status --porcelain` vacío), no el
  objeto. **La limitación que S91 declaró sigue exacta: un publish sucio es
  inauditable después.**
- **Edges desplegadas hoy:** `pagos-tarjetas` **v7** (verificada **por
  contenido**: `functions download` + diff byte a byte contra el fuente local) ·
  `pagos-borrar-tarjeta` **v17** · `pagos-alta-tarjeta` **v27**.
- **`apps/pagos-web`** desplegada a Vercel, verificada por contenido.
- **Gates:** typechecks `packages/api` y `apps/cliente` en **0** ·
  `verify-edge-deno` **VERDE, 34 functions** (con su propia cura del día: **un
  archivo que no parsea es ROJO siempre** — antes daba verde porque «no tenía
  errores de clase», y lo cazó el deploy, que no siempre está).
- **Migraciones:** ninguna hoy. Las dos de esta pista (`20260827210000` la verdad
  vencida · `20260827220000` el aviso de reverso por destinatario) ya estaban
  aplicadas y con reversa escrita antes.

---

## ⑦ LO PRÓXIMO — y no es de esta sesión

**El cobro real de guardería.** Tiene plan escrito
(`docs/PLAN_S108_COBRO_REAL_GUARDERIA.md`) y **tres decisiones ya firmadas
adentro**. **Va en su propia sesión, como el propio plan dice** — es el arco
entero de un sujeto **dos veces** (bono y mensualidad).

⚠️ **Y `D-946`/`D-947` van ANTES**: el conciliador ciego a las citas es
bloqueante de producción, y S108 mueve plata de verdad.
