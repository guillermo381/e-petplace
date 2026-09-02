# S112-D · EL VEREDICTO DEL RELOJ — un veredicto, dos consumidores

> **De:** pista D · **Para:** **A**, que escribe el job · **Rama:** `pista/s112-d`.
> **Todo medido contra la base viva el 1-sep-2026.** Los ceros van con su
> control positivo: sin él, un 0 no distingue el mundo del instrumento.

---

## §1 · EL VEREDICTO: LA CASA **SÍ** TIENE SCHEDULER

| qué | valor | cómo lo sé |
|---|---|---|
| `pg_cron` instalado | **sí** | `pg_extension` |
| jobs vivos | **28** | `cron.job` — el control positivo |
| jobs de adopción | **0** | mismo `select`, filtrando |

⇒ **Rama (a) del mandato: NO construyo scheduler** —la casa ya tiene uno y sería
un segundo mecanismo para el mismo trabajo—. **La consulta queda entregada; el
job es tuyo.**

---

## §2 · CONSUMIDOR ① — EL RELOJ DE 5 DÍAS · **TIENE LETRA, SE CONSTRUYE**

**Letra:** `LETRA_ADOPCION.md:170`, firma ⑧ — *«si el refugio no responde en 5
días, e-PetPlace avisa a la familia que el refugio no respondió»*.

**La consulta ya existe y es tuya:** `obtener_solicitudes_en_silencio()`, con sus
dos controles en tu propio cinturón (no suena hoy · suena a los 6 días · una
`automatica` **no** la apaga · una respuesta real **sí**). **No la toqué y no
hace falta reescribirla.**

### 🔴 PERO FALTAN TRES PIEZAS, Y UNA HACE DAÑO EN CUANTO ENCIENDAS EL JOB

| # | qué falta | medido | control positivo |
|---|---|---|---|
| ① | **el job** | 0 jobs de adopción | 28 jobs vivos |
| ② | **el escritor de `aviso_silencio_emitido_en`** | **0 funciones lo escriben** (1 lo nombra: el lector) | — |
| ③ | **el emisor del aviso** | **0 funciones nombran `adopcion_sin_respuesta`** | **2** nombran `cita_recordatorio` |

> ### 🔴 ② ES EL QUE NO SE VE HASTA QUE CORRE, Y POR ESO LO PONGO PRIMERO
>
> La columna lleva escrito su propósito: *«NULL = todavía no se avisó. **Se
> avisa UNA vez, no en cada tick.**»* **Nada la escribe.** El lector filtra
> `aviso_silencio_emitido_en IS NULL`, y si nadie la sella **el filtro nunca
> deja de dar verdadero.**
>
> ⇒ **Si el job sale sin el `UPDATE`, la familia recibe «el refugio no
> respondió» TODOS LOS DÍAS, para siempre**, sobre la misma solicitud. *No es
> una notificación de más: es la casa repitiendo un reproche a un refugio, a
> diario, en el peor momento de una espera.*
>
> **Hoy no tiene síntoma** —el reloj nunca corrió— y es exactamente la forma en
> que un defecto llega a producción con todos los semáforos en verde. **El
> `UPDATE` va en la misma transacción que la emisión: sellar y avisar son un
> solo acto, o el reintento duplica.**

### LA VOZ — dictada por el founder, y el número que la explica

El catálogo ya trae la descripción interna (*«Pasaron 5 días sin respuesta a tu
solicitud.»*). **La voz a la familia, FIRMADA (adenda 2, founder):**

> **El refugio todavía no respondió tu solicitud.**

> ### 🔴 «TODAVÍA NO RESPONDIÓ», JAMÁS «INCUMPLIÓ» — y la razón es un número que no es éste
>
> **Son dos relojes distintos, con dos dueños distintos, y el aviso sólo puede
> hablar del primero:**
>
> | reloj | de cuánto | de quién es | qué habilita |
> |---|---|---|---|
> | **el de §5 — el de este aviso** | **5 días** | **de la familia**: su derecho a saber | **decirle la verdad** |
> | el **máximo contractual** | **otro número** | del contrato con el refugio | recién ahí se puede hablar de incumplimiento |
>
> ⇒ **A los 5 días el refugio NO incumplió nada.** Todavía está adentro de su
> plazo. Lo único cierto es que **la familia lleva 5 días sin respuesta**, y eso
> se le dice **porque es suyo saberlo**, no porque alguien haya fallado.
>
> *Una app que dice «incumplió» a los 5 días emite un juicio contractual que
> ningún contrato respalda — contra la única parte que además no está presente
> para contestarlo.* **La verdad la decimos nosotros; el veredicto no es
> nuestro.**

**Lo que la voz NO puede hacer, y va como cinturón exigible:**
- 🔴 **NO nombra incumplimiento, mora, plazo vencido, reclamo, denuncia,
  cancelación ni baja.** Espejo exacto del cinturón que ya usaste en el aviso de
  no-recogida: **que ABORTE si el texto los nombra.** Ninguno está firmado y
  ninguno se puede sostener a los 5 días.
- 🔴 **NO promete que el refugio va a responder**, ni pone un plazo nuevo. *Un
  aviso que promete lo que no controla vuelve a prometer el silencio de
  Instagram.*
- 🔴 **NO ofrece un camino que no existe:** no hay «reclamar», ni «buscar otro»,
  ni cancelación automática. **La solicitud sigue viva** — y si el cuerpo lo
  dice, que lo diga como estado, no como consuelo.
- **Categoría `operacion`**, ya firmada en el catálogo con su razón: *el hecho
  no lo dice una persona, es el estado de un proceso*.

⚠️ **Un dato que cambia cómo se lee el aviso:** **la respuesta automática al
postular NO SE INSERTA** (su configuración no existe). ⇒ **a los 5 días la
familia no recibió NADA, ni siquiera el acuse automático.** El brazo
`automatica = false` de tu consulta está **correcto y hoy inerte**: no hay
automáticas que ignorar. *Se dice para que nadie lo lea como cobertura.*

---

## §3 · CONSUMIDOR ② — EL BORRADO A 90 DÍAS · 🔴 **NO SE CONSTRUYE: NO TIENE LETRA**

**Lo busqué y no está.** Medido, con control positivo:

| qué busqué | resultado |
|---|---|
| `90 días` en `docs/` | **3 hits, NINGUNO es éste** — graduación del prestador · foto de entrega (`D-776`) · documentos de identidad (`D-901`) |
| `postulación/postulaciones` en `LETRA_ADOPCION` y `POLITICAS` | **0** |
| regla de retención en §5 | **ninguna** |
| **control positivo** — `5 días` en `LETRA_ADOPCION` | **sí, línea 170** ⇒ *el grep encuentra plazos cuando existen* |

⇒ **La regla que el pedido trata como conocida no está escrita en ningún lado.**

### POR QUÉ NO LA ESCRIBO YO, Y NO ES PRUDENCIA

**① Un plazo de retención es una decisión, no un detalle de implementación**, y
la casa ya la pagó: **`D-732` y `D-733` están 🔒 BLOQUEADAS por esto mismo** —
*«sin plazo de retención escrito, borrar y conservar son igual de arbitrarios»*.
Poner 90 días acá sería **inventar la letra desde el código**, que es el molde
exacto que esas dos fichas existen para no repetir.

**② Y en este objeto el borrado choca contra una decisión YA firmada.** El hilo
es **append-only a propósito**, tu propia reversa declara que **dropearlo
destruye los hilos, que son el material de una disputa**, y el cinturón de los
lectores tiene un brazo dedicado a que **el hilo declinado siga visible**
(*«se pierde el material de una disputa»*). **Un borrado a 90 días de
postulaciones no concretadas destruye exactamente eso** — y `declinada` **es**
una postulación no concretada.

> 🔴 **Las dos mitades no se contradicen, y por eso la decisión es del founder y
> no mía:** privacidad dice *borrar*, trazabilidad dice *conservar*, y **las dos
> están firmadas**. Lo que falta no es código: es **cuál gana, y a los cuántos
> días**. *Elegir yo una de las dos sería resolver por omisión una tensión que
> alguien tiene que resolver a propósito.*

### LO QUE SÍ DEJO LISTO

**El eje temporal ya existe y no hace falta migración para medir:**
`adopcion_solicitud.cerrada_en` (NOT NULL en los dos estados terminales, por
`chk_cierre_coherente`) y `creada_en` para las que nunca cerraron.
⇒ **El día que haya letra, la consulta es una línea sobre columnas que ya
están.** No pido nada para eso.

**Lo que va a la mesa, no al código:** ¿el plazo corre desde `cerrada_en` o
desde `creada_en` (la que nunca cerró)? ¿borra el **hilo** o **anonimiza al
solicitante** y conserva la traza? — *anonimizar cumple las dos mitades y es la
salida que yo votaría, pero es voto, no letra.*

---

## §4 · BONUS — UN DEFECTO EN TU WRAPPER, Y ES DE LOS QUE ENGAÑAN

`crearSolicitudAdopcion` **tira el id que tu propio motor se tomó el trabajo de
mandar**, y **el JSDoc afirma lo contrario**:

- **motor:** `RAISE EXCEPTION 'solicitud_ya_viva: %', v_sol` — el uuid viaja. ✅
- **wrapper:** `fallo()` mapea por prefijo → `fallaCodigo(c)` → `{ codigo,
  mensaje: MENSAJES[c] }` — **sin `detalle`: el uuid se pierde.**
- **JSDoc (línea 293):** *«el rebote `solicitud_ya_viva` **trae SU ID en
  `mensaje`**»* — **falso**: `mensaje` es la frase estática.

⇒ **`L-424` queda cumplida en el motor y deshecha en la puerta:** la pantalla no
puede *«llevar ahí en vez de decir que no»* porque **nunca recibe el id**. Y es
peor que un hueco callado: **C, leyendo el comentario, va a buscar el uuid en
`mensaje` y no va a encontrarlo.** *Un comentario que promete de más manda a
alguien a construir contra algo que no existe.*

**La cura es de una línea y el campo ya existe para esto:** `detalle` nació en
S109 exactamente porque *«el motor ya calculaba la causa y el wrapper la
tiraba»*. Que `fallo()` propague el resto del raw en `detalle` (y que el JSDoc
diga `detalle`, no `mensaje`). **Regla 35 intacta: se ramifica por `codigo`,
`detalle` es para navegar/mostrar.** **Ya se lo advertí a C** para que no monte
contra la promesa falsa.

---

## §5 · RESUMEN EJECUTABLE

| # | pieza | veredicto |
|---|---|---|
| 1 | scheduler | **existe** (pg_cron, 28 jobs) — no se construye otro |
| 2 | consulta de los 5 días | **existe y sirve** — no la toqué |
| 3 | job del reloj | **falta** — tuyo |
| 4 | 🔴 `UPDATE aviso_silencio_emitido_en` | **falta** — *sin él avisa todos los días* |
| 5 | emisor de `adopcion_sin_respuesta` | **falta** — tuyo, con la voz de §2 |
| 6 | 🔴 borrado a 90 días | **NO se construye: no tiene letra** — a la mesa |
| 7 | `detalle` en `fallo()` | cura de una línea + JSDoc |

---

## §6 · 🔴 CÓMO SE CABLEA EL DISPARO — y por qué NO sale de la consulta sola

Lo encontré al cerrar, y cambia la forma del job. **La consulta y el módulo no
saben lo mismo, y el módulo sabe dos cosas que la consulta no:**

### ① LA CONSULTA NO MIRA EL MEMORIAL — el módulo sí

| qué | medido | control positivo |
|---|---|---|
| `obtener_solicitudes_en_silencio` nombra `memorial`/`estado_vida` | **0** | **16** funciones de la casa **sí** lo miran |

Y el módulo lo apaga por construcción — `verify:mensajeria` lo prueba en rojo:
`🔴 ROJO: memorial apaga el aviso de silencio`. La razón es firma de S88: *el
memorial CALLA*, y este aviso no es de `salud_seguridad` ni de `seguridad_cuenta`,
las dos únicas que le sobreviven.

> 🔴 **Si el job sale directo de la consulta, le manda a una familia «el refugio
> no respondió» sobre un animal que murió.** *El peor aviso que este producto
> puede emitir, y la consulta no tiene con qué frenarlo.*
>
> ⇒ **El barrido consulta el SQL para saber QUIÉNES, y decide con
> `avisosDe({ clase: 'silencio_detectado', … })` si SALE.** La consulta lista
> candidatos; **el módulo tiene la última palabra.** *Duplicar la regla del
> memorial en el SQL sería una segunda ley que puede diverger de la que ya está
> probada.*

### ② HAY **DOS** MECANISMOS DE «UNA SOLA VEZ», Y NINGUNO ESTÁ CABLEADO

- **El del módulo:** `avisosDe` devuelve la clave `adopcion_sin_respuesta:${solicitudId}`
  — *«una sola vez por solicitud: la clave lo garantiza aunque el barrido corra
  mil veces»*. **Construido y probado.**
- **El de la base:** `aviso_silencio_emitido_en`. **Sin escritor** (§2 ②).

⚠️ **Elegí UNO y cablealo entero.** Dos mecanismos a medias para la misma
promesa es cómo se fallan los dos: *cada uno se ve respaldado por el otro y
ninguno corre.*

**Mi voto:** **la clave del módulo**, que ya existe y está probada. Y entonces
**la columna queda sin dueño** ⇒ o la escribís igual en el mismo acto, o **se
retira**. *Una columna cuyo comentario promete «se avisa una vez» y que nada
hace cumplir es peor que no tenerla: se lee como garantía.* **Es tu decisión —
lo que no puede quedar es la promesa escrita sin nadie que la sostenga.**
