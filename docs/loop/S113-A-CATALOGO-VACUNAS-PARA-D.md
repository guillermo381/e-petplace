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

---

# ADENDA · `codigos_cubiertos` — la cobertura de una combinada

`registrar_vacunas_de_carnet` acepta ahora, **por ítem**, un array
`codigos_cubiertos` con **los mismos siete códigos**, validado igual (contra
`cat_vacunas` **activo**; fuera del catálogo ⇒ `item_invalido` nombrando **cuáles**
valores fallaron).

**Para qué es:** una **séxtuple** es `vacuna_codigo: "multiple"` **y además**
cubre `leptospirosis`. Sin esa lista, el plan marcaría la lepto como vencida
aunque el perro la tenga puesta.

```json
{ "nombre": "Nobivac DHPPi + L",
  "vacuna_codigo": "multiple",
  "codigos_cubiertos": ["multiple", "leptospirosis"] }
```

**Tres cosas, y la primera es la que más importa:**

**① Vale lo mismo que para `vacuna_codigo`: adivinar es peor que omitir.** Si el
carnet no dice qué cubre la combinada, **no mandes la lista**. *Poner
`leptospirosis` de más marca al día una vacuna que quizá nunca se aplicó — y el
plan deja de avisar.* Omitir sólo deja la casilla como estaba.

**② `[]` y ausente NO son lo mismo en el dato, aunque hoy signifiquen lo mismo
para los lectores.** `[]` dice *«no cubre nada más»*; ausente dice *«no sé»*. La
columna guarda las dos; se distinguen el día que alguien quiera saber quién
contestó.

**③ Incluir el propio código en la lista es inofensivo.** El motor une
`vacuna_codigo` con `codigos_cubiertos` y toma la más reciente por casilla:
`["multiple","leptospirosis"]` con `vacuna_codigo: "multiple"` **no duplica nada**.

**Lo verificado (fixture in-txn, residuo 0):** con `cubre` → **las dos casillas
al día**; **sin `cubre` → sólo la del código** (`leptospirosis` sigue `vencida`);
un código inventado **rebota hablado**; y **guardería lee lo mismo** — con la
combinada, `faltantes` deja de incluir `leptospirosis`.

---

# ADENDA · `precision_fecha` — cuando el carnet sólo dice el mes

`registrar_vacunas_de_carnet` acepta, **por ítem**, `precision_fecha` con dos
valores: **`"dia"`** (default) y **`"mes"`**.

```json
{ "nombre": "Nobivac DHPPi", "fecha_aplicada": "2024-05-01", "precision_fecha": "mes" }
```

**Cuándo usar `"mes"`:** cuando el renglón dice **`05/2024`, `mayo 2024`,
`05-24`** — mes y año, **sin día**. Hoy esa fila o se descartaba o se le
inventaba un día.

**Qué pasa con la fecha, y son dos cosas distintas a propósito:**
· **se guarda el PRIMER día del mes** (`2024-05-01`) — el ancla que no inventa
  nada más allá de lo que el carnet dice. Podés mandar cualquier día de ese mes:
  el motor lo trunca solo;
· **el plan cuenta desde el ÚLTIMO** (`2024-05-31`), que es **conservador**:
  *contar desde el día 1 gritaría «vencida» hasta 30 días antes de tiempo, y una
  alarma que se adelanta enseña a ignorar las alarmas.*
· **la app dice «mayo 2024»**, no «1 de mayo».

⚠️ **No lo uses para «no sé cuándo».** `precision_fecha` dice **granularidad**,
no confianza: si el carnet no dice ni el mes, **`fecha_aplicada` va `null`** —
que ya es legal y es el NULL honesto. *Poner `"mes"` con una fecha inventada
convierte «no sé» en «sé el mes», y eso el plan se lo cree.*

**Un valor fuera de los dos rebota** `item_invalido: N: precision_fecha X no es
«dia» ni «mes»`, y **tira el lote entero** como el resto de las validaciones.

**Verificado (fixture in-txn, residuo 0):** `"mes"` con `2024-05-17` guarda
**`2024-05-01`** y el plan cuenta desde **`2024-05-31`**; la MISMA fecha sin
precisión guarda `2024-05-17` y el plan usa **`2024-05-17`** — **14 días de
diferencia**, que es el discriminador. Las 8 vacunas reales de Thor quedaron en
`'dia'`: *el default escribe el supuesto que ya estaba implícito, no cambia un
hecho.*
