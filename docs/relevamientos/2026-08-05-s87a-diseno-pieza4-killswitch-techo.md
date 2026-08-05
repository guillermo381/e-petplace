# S87-A · DISEÑO DE LA PIEZA ④ — KILL SWITCH Y TECHO DURO

> **Adelantado mientras la mesa ordena el Lote 2** (permiso del founder, S87).
> **Nada de esto se construye hasta que el Lote 2 se ordene.**
>
> **Su condición, ya firmada:** ④ es **precondición del primer transporte** —
> junto con **D-657 curada** y **la build de push**. *Sombra sin kill switch es
> tolerable porque nada sale; transporte sin kill switch no.*

---

## 0. Qué es cada cosa — y por qué son DOS, no una

`MODELO_NOTIFICACIONES` §10 pide dos piezas que suenan parecidas y protegen de
cosas distintas:

| | qué protege | de quién |
|---|---|---|
| **§10.3 kill switch** | poder **parar**, por categoría y global, **sin deploy** | de nosotros, cuando algo sale mal y hay que frenar YA |
| **§10.4 techo duro** | que **un bug no pueda mandar 10.000 mensajes** | de nosotros, cuando nadie está mirando |

> **La diferencia que importa: el kill switch es una MANO, el techo duro es un
> FUSIBLE.** *Uno lo acciona alguien que se dio cuenta; el otro salta solo,
> y existe justamente para los casos en que nadie se dio cuenta.*
> **Un producto con kill switch y sin techo duro está protegido solo mientras
> alguien esté despierto.**

**Y el techo duro NO es el gate 5.** El gate 5 (ya construido) es **por
persona**: "esta persona no recibe más de N de esta categoría en 24 h". El techo
duro es **del sistema entero**: "hoy no salen más de N mensajes, punto". *Una
persona puede estar bajo su techo y el sistema estar mandando cien mil.*

---

## 1. DÓNDE VIVE EL KILL SWITCH — y es la decisión de diseño de esta pieza

**Dos lugares posibles, y solo uno conserva lo que §10.6 exige:**

| | qué pasa si se acciona |
|---|---|
| **(a) en LA PUERTA** (no se registra la intención) | **se pierde el rastro**: no queda registro de qué habría salido durante el apagón |
| **(b) en EL DESPACHO** (se registra, no se entrega) | la intención queda con su motivo; **la auditoría sobrevive al apagón** |

### ⇒ **VA EN EL DESPACHO. (b). — ✅ RATIFICADO POR EL FOUNDER (S87)**

**El porqué, y es el mismo argumento que ordenó todo este lote:** §10.6 existe
para poder contestar *"¿por qué me llegó esto?"* — y su gemela, que nadie
escribe pero llega igual, es ***"¿por qué NO me llegó?"***. **Un kill switch
que borra el rastro deja esa pregunta sin respuesta justo el día en que más se
va a hacer: el día del incidente.**

*Cortar en la puerta es más simple y más barato. Y es exactamente el atajo que
convierte un incidente en un misterio.*

---

## 2. La forma

### `notificacion_config` — una fila global, una por categoría

| columna | qué |
|---|---|
| `alcance` | `'global'` o el código de una categoría |
| `despacho_activo` | **el kill switch**. `false` = no se entrega nada de ese alcance |
| `apagado_por` · `apagado_en` · `motivo` | **quién lo apagó, cuándo y por qué** |
| `techo_duro_ventana_horas` · `techo_duro_max` | **el fusible** |

**`motivo` es NOT NULL cuando `despacho_activo = false`.** *Un kill switch
accionado sin razón escrita es un apagón que nadie sabe cuándo se puede
levantar* — y el que lo levante seis horas después no va a ser el que lo bajó.

**Sin deploy (§10.3):** es una fila. Se apaga con un `UPDATE`, y el despachador
la lee **en cada tick**, no al arrancar. *Un valor cacheado al arranque hace que
el kill switch tarde lo que tarde un reinicio, que es exactamente lo que no se
puede permitir.*

### El fusible, con su asimetría declarada

```
si (mensajes entregados en la ventana) >= techo_duro_max
   → se DETIENE el despacho del alcance
   → se marca la config con motivo 'techo_duro_saltado'
   → NO se auto-rearma
```

> **El fusible se rearma A MANO, a propósito.** *Un fusible que se rearma solo
> es un fusible que deja pasar el mismo bug cada ventana* — y en un motor cuyo
> modo de falla es irreversible y público (§10, primera línea), eso es peor que
> el apagón.

**Los valores nacen conservadores y se suben con uso medido, jamás al revés.**
*Un techo alto "por las dudas" no protege de nada; uno bajo produce un incidente
chico y visible el primer día, que es lo que uno quiere que pase.*

---

## 3. Lo que ④ NO hace, y hay que decirlo

- **No frena la creación de intenciones.** El motor sigue evaluando los cinco
  gates y registrando. **Durante un apagón el sistema vuelve al modo sombra** —
  que es donde vive hoy y donde sabe estar.
- **No decide qué pasa con la cola al volver.** Ver §4.
- **No reemplaza al gate 5.** Conviven: gate 5 protege a una persona del ruido;
  el techo duro protege a todos de nosotros.

---

## 4. LA PREGUNTA QUE ④ ABRE Y NO CIERRA — es de la mesa

**Cuando el despacho se re-enciende, ¿qué pasa con lo que se acumuló?**

| opción | consecuencia |
|---|---|
| **(a) sale todo** | la avalancha: la persona recibe seis horas de avisos de golpe |
| **(b) se descarta todo** | se pierden avisos legítimos, incluidos los no apagables |
| **(c) sale lo vigente, se descarta lo vencido** | pide saber qué es "vencido" **por categoría** |

### ✅ FIRMADA POR EL FOUNDER (S87): **(c) — SOLO LO VIGENTE**

**Cada aviso retenido SE RE-EVALÚA al re-encender**, y el vencimiento **cuelga
de la categoría**: un `cita_recordatorio` de una cita que ya ocurrió no tiene
sentido; un `plan_renovacion_fallida` sigue siendo urgente seis horas después.

> **Es la lógica de §5.1 GENERALIZADA.** *El memorial ya había contestado esta
> misma pregunta para un caso: **hay avisos que envejecen y avisos que no**.* La
> firma la saca del caso y la vuelve regla — y el catálogo es donde cada
> categoría declara de cuál es.
>
> **Consecuencia de forma:** re-encender **no es un `UPDATE` de un flag**. Es
> volver a pasar la cola por la puerta. *Un re-encendido que solo suelta lo
> acumulado es la opción (a) con otro nombre.*

---

## 5. Lo que ④ le pide a la mesa antes de construirse

1. ~~**Firma de que el kill switch va en el DESPACHO** (§1).~~ ✅ **RATIFICADA.**
2. ~~**El criterio de la cola al re-encender** (§4).~~ ✅ **FIRMADA** — solo lo vigente.
3. ~~**Los valores iniciales del fusible.**~~ ✅ **FIRMADO: global 500/24 h.**
   Holgado para la operación real de hoy y **absurdamente bajo para un bug**,
   que es la única forma de que salte antes de que duela. **Su gobierno, en §8.**

> **Y una nota de orden que vale para todo el Lote 2:** ④ **no depende del
> transporte**. Se puede construir y probar entero **en sombra**, con el
> despachador rechazando por kill switch sobre intenciones que nunca iban a
> salir. **Es la última pieza que se puede probar sin riesgo — y por eso
> conviene que sea la primera que se construya cuando el Lote 2 abra.**


---

## 6. RATIFICACIONES DE MESA (S87) — al acta

- **El kill switch en el DESPACHO** — *el rastro contesta «¿por qué no me
  llegó?» el día que más se pregunta.*
- **Mano y fusible separados** — *un producto con kill switch y sin techo duro
  está protegido solo mientras alguien esté despierto.*
- **Techo duro ≠ gate 5** — persona vs sistema. *Una persona puede estar bajo su
  techo y el sistema mandando cien mil.*

## 7. ORDEN DE APERTURA DEL LOTE 2 — firmado (S87)

**④ PRIMERO** (se construye y se prueba entera en sombra: la última pieza sin
riesgo, y por eso la primera) → **correo** como primer transporte (no necesita
build) → **push** cuando la build exista.

**Camino crítico real: ④ y D-657.**


---

## 8. EL GOBIERNO DEL FUSIBLE — firmado (founder, 5-ago-2026)

**Valor inicial: `global 500 / 24 h`.**

- **El techo SIGUE AL USO MEDIDO, jamás lo anticipa.** Cuando el **pico real de
  7 días** llegue a **~⅓ del techo**, se sube manteniendo **~10× sobre el pico
  observado**.
- **Revisión en cada corte:** soft launch, y después **trimestral — alineada a
  la revisión de rate cards de Meta que §7 ya tiene agendada.** *Un fusible que
  se revisa en su propia agenda se olvida; enganchado a una revisión que ya
  existe, no.*
- **Cuando WhatsApp encienda: SUB-TECHO PROPIO DEL CANAL, más bajo.**
  > **El global protege la CONFIANZA; el de WhatsApp además protege la PLATA.**
  > *Son dos daños distintos y por eso son dos números — Ecuador cuesta ~17×
  > Colombia en utility (§7), así que el mismo volumen que en push es ruido, en
  > WhatsApp es factura.*
- **Toda suba es FIRMA DEL FOUNDER CON EL DATO ADELANTE, jamás preventiva.**
  *Un techo que sube "porque se viene un pico" es un techo que ya no protege:
  protegía justamente de lo que nadie previó.*
