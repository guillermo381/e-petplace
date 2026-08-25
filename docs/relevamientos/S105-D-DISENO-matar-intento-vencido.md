# S105-D · DISEÑO — matar un intento vencido

> **Diseño, no construcción.** Pedido del founder: *«¿qué se necesitaría del
> lado nuestro, suponiendo que el proveedor SÍ dé un mecanismo de anulación?
> Quiero saber el tamaño antes de decidir si entra en esta mesa.»*
> **Supuesto declarado, y todo esto cuelga de él:** que DeUna dé una anulación
> **por transacción**. **Si su anulación es por punto de venta, este diseño no
> sirve y hay que rehacerlo entero** — es la pregunta 3 que está con el founder.
> **Medido contra el objeto** el 24-ago-2026: base del proyecto
> `zyltipqscdsdsxnjclhp`, `main` en `2fc15bb5`.

---

## 1 · LA BUENA NOTICIA: EL VOCABULARIO YA EXISTE

```
pagos_intentos_estado_check → 'iniciado' · 'pendiente' · 'aprobado' ·
                              'rechazado' · 'expirado' · 'reversado' ·
                              'reverso_fallido'
```

**`'expirado'` ya está en el CHECK.** ⇒ **cero migración de vocabulario, cero
decisión de nombre.**

⚠️ **Y su contracara, que es lo que obliga al censo:** medido, **hay CERO filas
en `'expirado'`** — el valor existe y **nunca se usó**. *Un estado declarado sin
productor jamás fue visto por ningún lector, así que «está en el CHECK» no
prueba que alguien sepa qué hacer con él.* **Es la ley de S101 en su forma
literal: agregar un valor obliga a censar TODOS los consumidores, porque el que
no lo conoce no falla — lo ignora.**

## 2 · EL CENSO DE LECTORES — once funciones, y una sola muerde

Se censó toda función de la base que menciona `pagos_intentos`, línea por línea
donde aparece `estado`.

**🟢 CERO lectores negativos.** Ninguno usa `NOT IN` ni `<>` sobre
`pagos_intentos.estado` ⇒ **`'expirado'` no se cuela en ningún conjunto por
omisión.** *Ése era el riesgo caro y no está.*

| lector | cómo lee | efecto de `'expirado'` |
|---|---|---|
| **`verificar_compuertas_pre_cobro`** | `estado IN ('iniciado','pendiente')` | ✅ **queda afuera — ES LA CURA** |
| `verificar_compuertas_recurrencia` | idem | ✅ igual, y correcto |
| `crear_pedido_de_recurrencia_cobrada` · `planes_vencidos_pendientes` · `recurrencias_vencidas_pendientes` · `renovar_plan_cobrado` | `estado = 'aprobado'` | ✅ indiferentes |
| `confirmar_pago_pedido` | **escribe** `'aprobado'` | ✅ indiferente |
| `pagos_pendientes_de_conciliar` · `confirmar_pago_compra` · `resolver_consulta_activa` | leen el estado de **`compras`**, no del intento | ✅ no aplican |
| ~~🔴 `aplicar_evento_de_pago` · `i.estado IN ('iniciado','pendiente','aprobado')` · queda afuera y eso es el defecto~~ | **ENMENDADO — ver abajo** | |

### ⚠️ ENMIENDA AL CENSO *(24-ago, mismo día · lo señaló A, lo verifiqué sobre la definición viva)*

**La fila tachada atribuía al actuador entero un filtro que pertenece a UNA de
sus tres ramas.** Medido línea por línea sobre `pg_get_functiondef`:

| rama | busca por | ¿filtra estado? |
|---|---|---|
| **DeUna** (línea 61) | `i.referencia_corta = v_refcorta` | ❌ **NO filtra** |
| **Nuvei** (línea 118) | `cita_id = v_ref AND proveedor_transaction_id = v_tx` | ❌ **NO filtra** |
| **recurrencia** (líneas 157-159) | `recurrencia_id` / `suscripcion_servicio_id` | ✅ la única con lista — **y A ya le aplicó `'expirado'`** |

⇒ **En compra y en cita, un intento `'expirado'` YA se encuentra hoy.**
**El escenario de §3 no aplica al riel DeUna**, porque DeUna **jamás es
recurrente** (`§6bis` borde ②). *La pieza ① nunca fue precondición de la (b), y
saberlo evita esperar algo que ya estaba.*

**Se corrige el alcance, no el diagnóstico** — y la distinción importa: `'expirado'`
sigue siendo invisible para la compuerta, que es lo que la cura necesita.

## 3 · 🔴 LA RESTRICCIÓN QUE DEFINE EL DISEÑO

> ### ~~Marcar un intento `'expirado'` sin tocar el actuador **reproduce D-912 exactamente**: el actuador dejaría de aplicar ese pago, sin error y sin log.~~
>
> ⚠️ **ENMENDADO EL MISMO DÍA — y la conclusión sobrevive con OTRO fundamento.**
> Para **compra y cita** esto es **falso**: esas ramas no filtran por estado, así
> que el pago tardío **sí se aplica**. Era cierto **solo para recurrencia**, y
> DeUna nunca es recurrente. **Lo que sigue es el escenario tal como se
> escribió**, conservado porque *describe bien un modo de falla real —el que A
> acaba de cerrar en la rama que sí lo tenía— y porque tacharlo sin dejarlo
> legible haría ilegible la enmienda.*

**El escenario, y no es raro:** la persona tiene el código viejo **ya tecleado
en su app Deuna**. El código venció **de nuestro lado**; del lado del proveedor
la transacción sigue `PENDING` y **se puede pagar**. Paga. El webhook llega. El
actuador busca su intento, lo encuentra en `'expirado'`, **no está en su lista,
y no hace nada.**

**Plata cobrada que la casa no registra** — el mismo daño de `D-912`, por otra
puerta y con la misma firma: sin síntoma.

⇒ **De acá salen las dos leyes de este diseño, y ninguna es opcional:**

**LEY ①  ·  Primero se ANULA con el proveedor; recién si el proveedor confirma
la anulación se marca `'expirado'`.** **Si la anulación falla, el intento NO se
expira** — fail-closed: *un cliente trabado se queja; una plata perdida no
avisa.*

> ### 🔴 SU FUNDAMENTO CAMBIÓ CON LA ENMIENDA, Y LA LEY SOBREVIVE IGUAL — conviene no perder cuál de los dos rige
>
> **Se escribió con este motivo:** ~~*expirar es dejar de escuchar, y no se puede
> dejar de escuchar por un código que todavía alguien puede pagar.*~~ **Ese motivo
> se cayó**: en compra y cita el actuador no filtra, así que expirar **no** es
> dejar de escuchar.
>
> **El motivo que la sostiene, y es el más fuerte de los dos:** *si expirás sin
> anular, quedan **DOS códigos vivos del lado del proveedor** —medido en el
> sondeo— **y los dos se pueden pagar**.* **Anular no es para poder dejar de
> escuchar: es para que no haya dos bocas cobrando.**
>
> *Es el patrón que A nombró hoy en otra forma: **la letra tenía razón por un
> motivo que no era el suyo.** Y no es cosmético — con el fundamento viejo,
> alguien que midiera «el actuador igual lo aplica» concluiría que la ley ①
> sobra, y ablandaría justo la pieza que evita el doble cobro.*

**LEY ②  ·  Aun anulado, el actuador tiene que seguir aceptando `'expirado'`.**
Entre que pedimos la anulación y el proveedor la ejecuta hay una carrera, y la
persona puede pagar en el medio. **Un pago que llega tarde sobre un intento
expirado es un pago igual.**

> ✅ **YA SATISFECHA, no pendiente** — y por dos caminos distintos: en compra y
> cita **sale gratis** (esas ramas no filtran por estado) y en recurrencia **A la
> aplicó** con la pieza ①. *Se conserva escrita porque es un invariante que hay
> que **defender**, no una tarea: el día que alguien agregue un filtro de estado
> «para prolijidad», esta línea es lo que se lo impide.*

## 4 · LAS PIEZAS, CON SU TAMAÑO Y SU DUEÑO

| # | pieza | tamaño | dueño |
|---|---|---|---|
| ① | ~~**`aplicar_evento_de_pago` acepta `'expirado'`**~~ | ✅ **HECHA por A, firmada por el founder** — con reversa antes y **rojo producido**. ⚠️ **Cerró la rama de RECURRENCIA, que no es la de DeUna**: útil igual, pero **nunca fue precondición de la ②** | **A** (DB) |
| ② | **La puerta anula-y-expira antes de crear el nuevo**: si hay intento `pendiente` con `codigo_expira_en` pasado → anular con DeUna → si confirma, marcar `'expirado'` → seguir | **el grueso**: ~40-60 líneas en `pagos-deuna-solicitud`, con su camino de fallo | **D** |
| ③ | **El barrido sigue mirando los `'expirado'` recientes** — hoy solo levanta `pendiente` | chico, pero **es la red de la LEY ②** | **D** |
| ④ | **La voz del rebote cuando la anulación falla** | **decisión de letra + código nuevo en el contrato con C** | **mesa → C** |
| ⑤ | Vocabulario de estado | **CERO** — ya existe | — |
| ⑥ | Migración de CHECK | **CERO** | — |

### El detalle de ④, porque es el que no es de código

**Hoy el cliente recibe `pago_en_proceso`, que es falso.** Con la cura aplicada
sigue siendo falso en el caso de anulación fallida: no hay un pago en proceso,
hay un código que no se pudo matar. **Hace falta un código propio** —
`codigo_vencido_no_anulable` o el que la mesa firme — y su voz. *Sin eso, la
cura arregla el camino feliz y **deja la mentira intacta en el camino triste**,
que es donde el cliente ya está frustrado.*

## 5 · EL TAMAÑO, EN UNA LÍNEA

**Chico en la base (una línea y su cinturón), mediano en la puerta (el grueso
del trabajo, con su camino de fallo), y una decisión de letra que no es de
código.** Nada de esto es una migración estructural: **el modelo ya previó este
estado y solo le faltó el productor.**

⚠️ **Pero NO entra en esta mesa mientras la pregunta 3 no tenga respuesta**, y
la razón no es de esfuerzo: **si la anulación de DeUna resulta ser por punto de
venta y no por transacción, la LEY ① es inaplicable** y el diseño entero cambia
de forma. *Construir ② antes de esa respuesta es construir sobre un supuesto del
proveedor — exactamente lo que la v1.1 de `LETRA_DEUNA` hizo y esta casa pasó
una sesión corrigiendo.*

## 5bis · 🔴 EL BORDE QUE ABRIÓ LA PROPIA ENMIENDA — un hecho, dos consecuencias opuestas

**Salió de verificar la corrección de A, no de buscarlo.** Las mismas dos ramas
que **no filtran por estado** —lo que hace que `'expirado'` se aplique, y está
bien— hacen también que **`'reversado'` se reaplique**, y eso está mal:

```
112  UPDATE pagos_intentos
113     SET estado='aprobado', confirmado_por='webhook', …
117   WHERE (v_intento IS NOT NULL AND id = v_intento)
118      OR (v_intento IS NULL AND cita_id = v_ref AND proveedor_transaction_id = v_tx);
```

**Sin guard de estado en el `WHERE`.** Un intento en `'reversado'` o
`'reverso_fallido'` que reciba un evento de aprobación **vuelve a `'aprobado'`**,
y la línea 105 además deja la cita `'confirmada'` / `'pagada'`. **Plata devuelta
que se cuenta otra vez como cobrada.**

> ### No filtrar por estado es **la misma decisión** que resuelve un problema y abre el otro. Por eso una corrección que achica un diseño puede ser **media medición de otra cosa**.

**Severidad, acotada y medida antes de reportarla:** **hoy inalcanzable** —
`aprobado` 39 · `pendiente` 3 · `rechazado` 2, **cero reversados**, y jamás se
ejerció un reverso. **Alcanzable el día del primero**, y **más probable en DeUna
por su ventana de 24 h que en Nuvei por la de mismo día**.

⚠️ **El disparo más cercano no es un pago: es un REPROCESO.** Reaplicar un
evento viejo sobre un intento que entretanto cambió de estado tiene esta forma
exacta. **Con los cuatro de `D-912` no muerde** (verificado por las dos pistas:
ninguno está reversado), pero **el reproceso como mecanismo tiene la puerta
abierta** ⇒ *todo reproceso mira el estado del intento **al momento de
reprocesar**, jamás el que tenía cuando se decidió reprocesarlo.*

**Dueño: A** (es el actuador). **Voto de esta pista, registrado:** entre ignorar
(fail-closed) y **escalar como hallazgo**, gana **escalar** — *un proveedor que
aprueba algo que ya reversó es un caso de soporte, no un no-op silencioso* — y
el vocabulario ya tiene el valor (`reverso_fallido` en
`chk_hallazgo_vocabulario`). **Lo decide la mesa.**

## 6 · LO QUE SE PUDO HACER YA, SIN LA RESPUESTA — ✅ hecho

**① no dependía del proveedor**, y por eso se pudo firmar y aplicar el mismo
día. `aplicar_evento_de_pago` aceptando `'expirado'` **no habilita nada por sí
sola** —hoy nadie produce ese estado— y **deja el motor listo con la puerta
cerrada**, como el cron del recurrente que nace inerte. **La hizo A, con reversa
antes y rojo producido.**

⚠️ **Con su alcance real dicho, que no es el que este documento le atribuyó:**
cerró **la rama de recurrencia**, la única que filtraba. **Para el riel DeUna no
cambió nada** —DeUna nunca es recurrente— **y nunca fue precondición de la ②.**
*Sigue siendo correcta y sigue valiendo la pena; lo que no hay que hacer es
esperarla como si destrabara esto.*

---

## 7 · QUÉ QUEDA, EN UNA LÍNEA

**El diseño está completo y su única precondición es externa:** la respuesta del
proveedor sobre si su anulación es **por transacción** (el diseño rige) o **por
punto de venta** (la LEY ① es inaplicable y se rehace). **Nada de lo que falta
depende de nosotros**, y eso es una buena posición para esperar: *lo que se
puede construir sin la respuesta ya está construido.*
