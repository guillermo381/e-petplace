# El catálogo de vacunas, servido a D — S113-A · 1.0.1

> **Para el prompt de `extract-vacuna`.** `registrar_vacunas_de_carnet` ya acepta
> **`vacuna_codigo` por ítem**, nullable, **validado contra `cat_vacunas` donde
> `activo`** — fuera del catálogo rebota `item_invalido` nombrando el ítem y el
> valor.

## Los SIETE códigos activos, leídos de la base (5-sep-2026)

| `vacuna_codigo` | `nombre` | especies |
|---|---|---|
| `antirrabica` | antirrábica | perro · gato |
| `multiple` | múltiple | perro |
| `tos_perreras` | tos de las perreras | perro |
| `leptospirosis` | leptospirosis | perro |
| `giardia` | giardia | perro · gato |
| `triple_felina` | triple felina | gato |
| `leucemia_felina` | leucemia felina | gato |

**Inactivos: ninguno.** (Medido; `cat_vacunas` no tiene filas con `activo=false`.)

## Las tres cosas que hay que saber para usarlo

**① `vacuna_codigo` es NULLABLE, y NULL es un resultado correcto — no un fallo.**
Un nombre comercial que no mapea a ninguno de los siete entra **sin código**.
*«Nobivac DHPPi», «Canigen LR», «Rabimune», «Peek N-RB» son nombres de producto;
el código es la FAMILIA de vacuna.* Si el modelo no está seguro, **manda null**:
`obtener_plan_vacunal` cuenta esas filas aparte en `aplicadas_sin_clasificar`
para que la pantalla pueda decir «hay N sin clasificar» en vez de callarlas.

⚠️ **Adivinar el código es peor que dejarlo en null**, y no es una opinión:
el código es lo que ata la fila al plan vacunal. *Un código equivocado no deja un
hueco — mueve una vacuna a la casilla de otra, y el plan pasa a decir «al día»
de algo que nunca se aplicó.*

**② El valor va tal cual, en minúscula y con guión bajo.** `antirrabica` **sin
tilde** (el código no la lleva; el `nombre` sí). `tos_perreras`, no
`tos_de_perreras` ni `traqueobronquitis`.

**③ Rebota el LOTE ENTERO, no la fila.** La función es atómica: un solo
`vacuna_codigo` fuera del catálogo tira `item_invalido` **con el índice del
ítem** y **no se guarda ninguna de las N vacunas**. *Por eso conviene null ante
la duda: un código inventado en la fila 7 tira las otras once.*

## Por qué el guard existe si ya había un FK

`evento_vacuna_aplicada_vacuna_codigo_fkey REFERENCES cat_vacunas(codigo)` ya
existía: un código inventado **ya rebotaba**, pero con un **`23503` crudo**, en
medio de un lote de N, **sin decir cuál ítem**. *El FK sabe negarse y no sabe
explicar* (`L-424`).

🔴 **Y hay una diferencia real: el FK no mira `activo`.** Un código jubilado
pasaría el FK y entraría al expediente; el guard lo frena. *Hoy no hay ninguno
inactivo, así que esa rama **no se puede ejercer contra dato real todavía** — se
declara en vez de darla por probada.*

## Verificado (fixture in-txn, residuo 0)

`antirrabica` llega a la fila · `vacuna_inventada` rebota **con el guard, no con
el FK** · el mismo shape con `giardia` **pasa** (discriminador: T2 rebotó por el
valor, no por la forma) · sin código ⇒ **NULL honesto**. Las 8 vacunas reales de
Thor intactas.
