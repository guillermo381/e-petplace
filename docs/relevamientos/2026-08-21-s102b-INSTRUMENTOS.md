# S102-B · LOS INSTRUMENTOS DE ESTA SESIÓN — cómo midieron, y las cuatro veces que casi mienten

> **Territorio:** los jueces y los guards son de B *(enmienda S99 al método:
> «quien mantiene el guard es su dueño, o es el guard de nadie»)*. **Este
> archivo se deposita acá por pedido de mesa y por el principio de `L-328`: el
> dato se deposita donde vive.** *A no lo deposita porque no tiene la fuente —
> y frenó bien al no inventarla.*
>
> **Qué es:** el registro de los desvíos de INSTRUMENTO de S102-B, cada uno con
> su literal y su par reproducido. **Ninguno produjo un reporte falso**, y esa
> es exactamente la razón de escribirlos: *los que se cazan no dejan cicatriz, y
> por eso son los que se repiten.*

---

## ① · EL CASO PEDIDO — **UN VALOR DE ENUM ADIVINADO, Y LA ALARMA ERA FALSA**

**Qué pasó.** Verificando si la tanda podía cerrar, medí las tarjetas
utilizables con:

```sql
select count(*) from tarjetas_guardadas where estado = 'activa'
```

**Devolvió `0`.** Y con ese cero estuve a punto de reportar **«no hay tarjetas
guardadas ⇒ ningún cobro es posible»** — una conclusión que habría frenado la
tanda por la razón equivocada.

**El valor real es `guardada`.** Medido:

```
estado='guardada' → 7 filas · 7 con token · 7 con proveedor_uid · última: 2026-08-21
```

**Y ningún otro estado existe en la tabla.**

### 🔴 POR QUÉ ESTE ES PEOR QUE UNA COLUMNA MAL ESCRITA

> ### **Un nombre de columna equivocado ROMPE. Un VALOR equivocado DEVUELVE CERO — y cero es un resultado perfectamente creíble.**

*`where estado='activa'` es SQL válido sobre una columna que existe.* La base no
tiene nada que objetar: contesta la verdad de una pregunta que nadie quería
hacer. **El error no se manifiesta como fallo: se manifiesta como un hallazgo.**

**Y era un cero especialmente creíble**, que es lo que lo vuelve peligroso: yo
venía de medir que **`v_liquidaciones_pendientes_pago` tenía 0 filas**, que
**`liquidaciones` tenía 0**, que **el ledger tenía 0 eventos de pedido**. *Un
cero más encajaba con todo lo que la sesión venía encontrando.*

**Lo que lo cazó:** que 7 filas tuvieran `proveedor_uid` en la misma corrida.
**Dos números incompatibles en la misma tabla** —cero utilizables y siete con
credencial del proveedor— *y esa contradicción es lo único que obligó a mirar el
enum.* **Sin esa segunda columna en la misma consulta, el cero se iba al reporte.**

> **La regla 22 del contrato ya lo dice para columnas —*verificar nombres reales
> antes de escribir queries, no asumir*— y este caso la ensancha: EL VALOR
> TAMBIÉN SE MIDE.** *Un enum se lee de `pg_enum` o de un `group by`, jamás de lo
> que uno esperaría que dijera.*

**Forma barata que lo hubiera evitado**, y que queda como práctica:

```sql
-- en vez de filtrar por un valor que uno supone…
select estado, count(*) from tarjetas_guardadas group by 1;
```

*Cuesta lo mismo y no puede devolver un cero falso: si el valor no es el que
creías, te lo muestra.*

---

## ② · 🔴 LA CAUSA COMÚN QUE APARECIÓ AL MEDIR EL ①: **MI FILTRO DE SALIDA BORRABA LOS ERRORES**

**Al escribir este archivo reproduje el desvío y encontré algo más grande.** El
pipeline con el que leí la base toda la sesión —`… | sed -n '/rows/,$p'`, para
recortar el ruido del CLI— **descarta el mensaje de error completo cuando la
consulta falla.**

**Par reproducido hoy, mismo comando, única diferencia el filtro:**

```
A · con el filtro:      (salida completamente vacía)

B · sin el filtro:      ERROR: 42703: column "creado_en" does not exist
                        LINE 1: select creado_en from tarjetas_guardadas limit 1
                                       ^
                        HINT: Perhaps you meant to reference the column
                              "tarjetas_guardadas.creada_en".
```

> ### **El error traía la respuesta adentro — con el código, la línea, el caret y hasta el HINT del nombre correcto. Mi filtro lo tiró entero.**

### Y su modo de falla es el peor posible

**Una salida vacía se lee como «cero filas».** *Cero filas es un RESULTADO; un
error es un FALLO. El filtro convierte lo segundo en lo primero, en silencio.*

**Las tres veces que pasó hoy, nombradas:**

| # | la consulta pedía | el error real (invisible) |
|---|---|---|
| 1 | `sum(monto_prestador)` en `eventos_economicos` | la columna es **`monto_payout`** |
| 2 | `max(creado_en)` en `tarjetas_guardadas` | la columna es **`creada_en`** |
| 3 | conteo de 8 tablas como `anon`, en un solo `BEGIN…ROLLBACK` | **`42501: permission denied for table pedidos`** |

**El caso 3 es el que cuesta más y conviene mirarlo de cerca:** era una medición
de SEGURIDAD. El bloque entero devolvió vacío, **y tuve que ir tabla por tabla
para descubrir que el rechazo existía y era el hallazgo**. *El dato que buscaba
—«¿`anon` rebota?»— estaba en el mensaje que el filtro borró.* **La medición
salió bien, pero por insistencia, no por instrumento.**

### La ley que sale

> ### **UN FILTRO DE SALIDA QUE PUEDE COMERSE UN ERROR CONVIERTE «FALLÓ» EN «NO HAY NADA» — Y «NO HAY NADA» ES UNA RESPUESTA QUE UNO ACEPTA.**

**Es la hermana de `L-191` en la dirección contraria:** allá el pipe falsificaba
el **éxito** (`$?` del `tail`); acá el filtro borra el **diagnóstico**. *En las
dos, una herramienta de comodidad se metió entre la medición y la conclusión, y
no avisó* — el mismo eje que el contrato ya nombró en la **regla 87 ·
SALTAR_GATE** y en el `head -8` de S97.

**La forma correcta, para el próximo:** *si la salida filtrada viene vacía, se
re-corre SIN filtro antes de concluir nada.* **Un vacío nunca se reporta como
cero sin haber visto el crudo.**

---

## ②bis · 🔴 EL MISMO DEFECTO, UN PISO MÁS ADENTRO — **EN EL HELPER COMPARTIDO DE LA CASA** *(hallado al escribir este archivo · CURADO)*

**Al aplicarme la práctica del ② me pregunté si mi propio arnés la heredaba.
No la hereda —`dbQuery` LANZA cuando el CLI sale ≠ 0, verificado— pero al medir
**qué dice** al lanzar apareció algo peor.**

`scripts/lib-db.mjs`, la línea que usan **27 verify-scripts del repo**:

```js
throw new Error(`db query falló (exit ${r.status}): ${(r.stderr || r.stdout || '').slice(0, 400)}`);
```

**Medido:** el CLI manda a `stderr` un **`npm warn` fijo de ~200 chars**, y **el
error de Postgres va a `stdout`**. El `||` toma la primera fuente no vacía —
**que nunca está vacía** — y el corte de 400 se llena de ruido.

**El par, reproducido:**

```
ANTES →  db query falló (exit 1): npm warn Unknown project config "node-linker"…
DESPUÉS → db query falló (exit 1): … ERROR: 42703: column "columna_que_no_existe"
          does not exist  LINE 1: select columna_que_no_existe from tarjetas_guardadas
```

> ### **Todo verify de la casa que fallara por SQL decía «npm warn Unknown project config» en lugar de la causa.** *El diagnóstico llegaba en la caja y el helper lo tiraba.*

**Curado** (territorio de B: es harness). **Estrictamente aditivo** — se leen las
dos fuentes, se descarta el ruido conocido, y recién ahí se corta. **Ningún
llamador recibe menos que antes.**

**Verificado con su par y su discriminador:** el error trae ahora el SQLSTATE y
el identificador · **el camino feliz sigue devolviendo filas** · y
`verify-censo.mjs` —consumidor ajeno, de otra pista— **corre entero y emite su
veredicto normal** (sus 5 rojos son suyos, sobre ítems de S89-C, y son
anteriores).

⚠️ **Y lo que la cura NO alcanza, medido después y declarado para no prometer de
más:** el **`HINT`** del motor —que a veces trae el nombre correcto de la
columna— **sigue cayendo fuera del corte de 600**, porque el JSON viene
escapado y es largo. *Subir el corte es barato el día que haga falta; declararlo
es lo que evita confiar en un dato que no llega.*

> **Nota de método sobre esta misma cura:** al escribir el comentario que
> explica el arreglo **rompí el archivo** — cerré el bloque `/* */` en el medio
> y dejé dos líneas de prosa como código. **Lo cazó correr `node -e` con el
> import**, no leerlo. *Un comentario largo dentro de una cura es código: se
> ejecuta el archivo después de escribirlo, siempre.*

---

## ③ · UN REGEX QUE MIDIÓ LA PALABRA Y YO IBA A REPORTAR LA ESTRUCTURA

**Midiendo si `aplicar_evento_de_pago` tenía manejador de excepción:**

```sql
(pg_get_functiondef(p.oid) ~* 'EXCEPTION')  →  true
```

**Y era un `RAISE EXCEPTION`.** La función **no tiene handler**: su único
`EXCEPTION` es el que LANZA, no el que ATRAPA.

**Qué habría costado:** la conclusión se invertía. Con handler, un `v_user` NULL
quedaría atrapado y el comprobante simplemente no saldría; **sin handler, la
violación de NOT NULL propaga y el pago entero no se aplica.** *Es la diferencia
entre un aviso que falta y un cobro que no se registra* — y es literalmente el
filo de `D-862`.

> **Un identificador de una palabra no distingue dos construcciones opuestas del
> lenguaje.** *`RAISE EXCEPTION` y `EXCEPTION WHEN` comparten el token y hacen lo
> contrario.* **Lo que se mide es la estructura: se leen las líneas.**

---

## ④ · EL FILTRO QUE FUI YO, NO EL INSTRUMENTO

**El caso:** la cuarta ocurrencia de `D-748`
(`LETRA_MOTOR_PAGOS_S101.md:41`). **A la atribuyó a que «mi grep no alcanzó».**

**No es cierto: el grep la devolvió.** Corrí el barrido sobre `docs/` completo y
esa línea salió en la salida. **El que la recortó fui yo**, al acotar el pedido
a las tres menciones que describen el ESTADO de la deuda — **y no lo declaré.**

> ### **UN INSTRUMENTO CIEGO SE CURA CAMBIÁNDOLO; UN FILTRO NO DECLARADO SE REPITE.**

*Atribuirlo al instrumento habría mandado a la próxima sesión a arreglar un grep
que funcionaba.* **A lo aceptó y lo escribió como corrección suya** en la
enmienda de `LETRA_MOTOR_PAGOS_S101` (v1.4 → v1.5).

**Y notar el parentesco con el ②, que no es casual:** en el ② el filtro era de
la herramienta y yo no sabía; en el ④ el filtro era mío y yo sí sabía. **La
diferencia entre los dos es una línea de declaración.**

---

## ⑤ · EL LADO BUENO — EL ARNÉS Y SU ROJO PRODUCIDO

`scripts/s102/verificar-pagador.mjs`, **corrido el 21-ago contra la base real
con nada aplicado: 7 fallos, `EXIT=1`**, cada línea nombrando qué falta.

**Tres decisiones de diseño que salieron de los desvíos de arriba:**

1. **Sale ROJO cuando no puede medir** (L-197), jamás verde por ausencia. *El ②
   es exactamente el caso que esto previene: sin datos no se dice «cero».*
2. **`SIN CASO` es un FALLO, no un pase.** Si no hay un cobro posterior al
   deploy, frena y lo dice. *Un arnés sin caso no da verde.*
3. **Su discriminador es `pagador_origen`, no la presencia de la columna.** Las
   7 filas del backfill tienen `pagador_user_id` poblado y **ninguna pasó por la
   puerta** ⇒ **solo `'sesion'` prueba que `pagos-cobro` escribió.**

> *La (3) es la lección del gate de S101 hecha instrumento: **verificar la
> MATERIA PRIMA no prueba el ARTEFACTO.*** Allá la intención llevaba los dos
> códigos y el correo salía genérico; acá la columna podría estar poblada y la
> puerta muerta.

**Y el exit se leyó del comando, no de un pipe** (L-191) — con la corrida de A
del mismo día como recordatorio: leyó un guard con `| tail; echo $?`, obtuvo `0`
sobre un rojo, **y casi declara verde el guard que estaba salvando su sesión.**

---

## ⑥ · 🔴 Y `L-191` COBRADA POR MÍ, EN EL TURNO EN QUE ESCRIBÍA ESTE ARCHIVO

**Verificando que la cura del ②bis no rompiera a los 27 consumidores, corrí:**

```
node scripts/verify-censo.mjs 2>&1 | tail -6; echo "EXIT=$?"
   →  (stack trace de un SyntaxError)
   →  EXIT=0
```

**El script estaba CRASHEANDO y leí `0`.** El exit era el de `tail`, no el del
comando. **Es `L-191` textual** — *el exit code se lee del comando, jamás del
pipe* — **cometida en el mismo turno en que depositaba un archivo sobre
instrumentos que mienten.**

**Se re-corrió sin pipe** (`> archivo 2>&1; echo $?`) y dio **`EXIT REAL = 1`**.

> ***Una ley conocida no protege de nada mientras la comodidad de leer seis
> líneas siga estando a un pipe de distancia.*** *A se la cobró hoy leyendo un
> guard que estaba salvando su sesión; yo me la cobré verificando una cura sobre
> guards. **Dos pistas, el mismo día, la misma trampa** — que es la evidencia de
> que el problema no es la disciplina de nadie: es la forma del comando.*

**Lo que deja exigible, y es más barato que acordarse:** cuando lo que se mide es
**el exit**, la salida va a un archivo y se lee después. *El pipe es para mirar,
nunca para decidir.*

---

## ⑦ · LO QUE ESTE ARCHIVO DEJA EXIGIBLE

| # | práctica | costo |
|---|---|---|
| 1 | **el VALOR de un enum se mide** (`group by`), no se filtra por lo que uno supone | cero — la misma consulta |
| 2 | **una salida filtrada vacía se re-corre SIN filtro antes de concluir** | una corrida |
| 3 | **una construcción del lenguaje se mide por estructura, no por su palabra clave** | leer las líneas |
| 4 | **todo recorte del resultado de un instrumento se DECLARA** | una línea |
| 5 | **todo guard nuevo se corre en rojo antes de que alguien confíe en él** | ya está pago acá |
| 6 | **cuando lo que se mide es el EXIT, la salida va a un archivo** — el pipe es para mirar, nunca para decidir | un redirect |
| 7 | **un archivo tocado se EJECUTA después de tocarlo**, aunque el cambio sea un comentario | un `node -e` |

> **Ninguno de los seis desvíos llegó a un reporte.** *Se escriben igual —y por
> eso se escriben— porque un error cazado no deja cicatriz, y lo que no deja
> cicatriz es lo que vuelve.*

---

## ⑦bis · LECCIÓN — **`L-331`** *(número asignado por A el 21-ago, medido en LOS DOS árboles)*

> **⚠️ Y esta vez la regla del número se atrapó ANTES de escribirlo, que es la
> primera vez que pasa.** La orden decía *«número por grep»*. **Mi grep dio
> `L-329` y `L-330` LIBRES** en mi árbol… **y las dos ya eran de A** en
> `origin/pista/s101-d`. *Lo vi porque esta vez medí también contra la rama de
> A* — la mejora que las dos colisiones anteriores implicaban y que no había
> hecho. **Viajó sin número igual, y A contestó `L-331` con su worktree a la
> vista.**
>
> ### 📌 Y ahí está la forma final de la regla, que ninguna de las tres versiones anteriores tenía:
> **Medir contra `origin` REDUCE la ventana; no la cierra. Lo que la cierra es
> PREGUNTARLE AL DUEÑO DEL TERRITORIO** — porque el único árbol donde el número
> es real es el suyo. *(Convergimos las dos pistas en esta lectura por separado;
> queda registrada acá y en su depósito.)*

---

### L-331 — **LA CAPA QUE AHORRA RUIDO SE SACA EN EL MOMENTO DE DECIDIR**

> ### **Mirar puede ser cómodo. Concluir tiene que ser crudo.**

**El ruido y el diagnóstico salen por el mismo caño.** Toda capa que se pone
para ver menos —un `sed`, un `tail`, un `head`, un `|| fallback`, un
`slice()`— **no distingue lo que sobra de lo que decide**, porque para
distinguirlo habría que haberlo leído.

**Es la segunda mitad de «el crudo antes de diagnosticar»:** la primera dice
*mirá el objeto*; ésta dice *y mirálo SIN la capa que te pusiste para leerlo
cómodo*.

### La evidencia, y es lo que la vuelve regla y no anécdota: DOS PISTAS, EL MISMO DÍA

| pista | la capa | qué borró |
|---|---|---|
| **A** | `\| tail; echo $?` sobre `verify-manifest-apk` | **un `EXIT 1`** — casi declara verde el guard que le estaba salvando la sesión |
| **B** | `\| tail -6; echo $?` sobre `verify-censo` | **un crash entero** — leyó `0` sobre un `SyntaxError` |
| **B** | `sed -n '/rows/,$p'` sobre el CLI | **tres errores de SQL**, uno de ellos un `42501` en una medición de seguridad |
| **B** | `(stderr \|\| stdout)` en `lib-db.mjs` | **la causa de todo fallo, para 27 verify, durante 40 días** |

> **Ninguna de las dos pistas fue descuidada: las dos conocían `L-191` y una de
> ellas la había citado ese mismo día.** *Cuando dos personas distintas caen en
> la misma trampa el mismo día, el problema dejó de ser la disciplina y pasó a
> ser la forma del comando.*

### Lo exigible

**Cuando lo que se mide es un EXIT o una CAUSA, la salida va a un archivo y se
lee después.** *El pipe es para mirar, nunca para decidir.*

---

## ⑧ · LA FORMA QUE TIENEN LOS SEIS EN COMÚN

**Ninguno fue un error de razonamiento. Los seis fueron una CAPA entre la
medición y la conclusión:**

| # | la capa | qué borró |
|---|---|---|
| ① | un valor supuesto en el `where` | la pregunta correcta |
| ② | `sed` sobre la salida | el mensaje de error |
| ②bis | `stderr \|\| stdout` en el helper | la causa, para 27 scripts |
| ③ | un regex de una palabra | la diferencia entre lanzar y atrapar |
| ④ | un recorte mío no declarado | una cuarta ocurrencia |
| ⑥ | un `tail` antes del `$?` | un crash entero |

> ### **Cinco de las seis capas se pusieron para AHORRAR RUIDO. Y el ruido y el diagnóstico salen por el mismo caño.**
>
> *Por eso ninguna de estas se evita con más cuidado: se evitan sacando la capa
> en el momento en que hay que decidir algo.* **Mirar puede ser cómodo; concluir
> tiene que ser crudo.**

---

## ⑧bis · LAS DOS LECCIONES QUE LA MESA MANDÓ FUNDAR — **`L-332` y `L-333`**

> ✅ **Números asignados por A el 21-ago**, medidos en su worktree **y** contra
> `origin/pista/s102-b`. **Y lo asignó ella por ser la dueña del territorio de
> `DEUDAS_CANONICAS.md`** — que es exactamente lo que `L-331` pide y lo que
> **ninguno de los dos podía cerrar midiendo solo**.

### `L-332` — **CAPA QUE BORRA ≠ SUPERFICIE EQUIVOCADA. SE CURAN DISTINTO.**

**Dos familias que se confunden porque las dos terminan en un verde falso:**

| | **capa que borra** | **superficie equivocada** |
|---|---|---|
| qué pasa | el instrumento **no ve** el dato | el instrumento **ve bien** |
| dónde falla | entre la medición y la conclusión | en QUÉ se eligió medir |
| síntoma | vacío, cero, un exit ajeno | **un verde correcto y sin valor** |
| cura | **sacar la capa** | **cambiar qué se mira** |
| casos | `sed` · `tail` · `\|\|` · `slice()` | el manifest perfecto sobre una APK sin bundle |

> ### **En la segunda no hay nada roto: el instrumento leyó bien, midió bien, y contestó bien LA PREGUNTA EQUIVOCADA.**

**Y por eso no se pueden meter en la misma bolsa: la cura de una parecería
cubrir a la otra.** *Sacarle el `tail` a un guard que mide el manifest no lo
acerca ni un paso a mirar dentro del ZIP.*

**El caso fundador:** `verify-manifest-apk.mjs` dio **VERDE con razón** —el
manifest tenía sus cuatro claves— **mientras la APK no traía
`index.android.bundle` y se quedaba en el splash para siempre**.

> **Complementa la tríada de mesa un nivel más fino** —*controles curan
> instrumentos · leyes curan lectores · invariantes curan resultados
> plausibles*— **partiendo el primer término: hay control que cura una capa y
> control que cura una superficie, y no son el mismo control.**
>
> ⚠️ *Ese literal de la tríada me lo dio A. **Lo busqué por grep y encontré un
> homónimo** —la tríada del hub «Mis paseos» (Próximos·Agenda·Historial) en
> `D-366`—. **Buscar la PALABRA en vez del concepto es la misma clase que este
> archivo documenta**, así que se declara en lugar de citarla como si la
> hubiera medido.*

---

### `L-333` — **LA VOZ DE UN INSTRUMENTO SE CALIBRA CONTRA LO QUE MIDE, NO CONTRA LO QUE UNO QUERÍA MEDIR**

> ### **Un verde que promete de más es el que nadie vuelve a mirar.**

**Es sub-especie de la ⓐ y merece número propio porque su cura es distinta y es
barata: no se toca la medición, se baja la línea.**

**Los dos casos, del mismo día y de las dos pistas:**

| instrumento | decía | mide | curado a |
|---|---|---|---|
| `verificar-pagador` ① (B) | «la policy **conoce** al pagador» | `ILIKE` sobre el TEXTO de la policy | «**NOMBRA** al pagador (precondición — la prueba es ⑤)» |
| `verify-apk-contenido` (A) | «trae el bundle — **arranca sola**» | que hay JS que cargar | «tiene JS que cargar sin Metro» *(propuesto en la revisión)* |

**La prueba de si una voz está calibrada, en una pregunta:** *¿podría esta línea
salir verde con la cosa rota?* **Si sí, la línea promete de más.**

**Y el matiz que la vuelve útil en vez de purista:** en el caso de B **la
medición estaba bien y la prueba real ya existía en otro bloque** — *lo único
equivocado era el rótulo.* **Curar la voz no debilitó nada: hizo visible dónde
vivía la prueba.**

---

### ⓒ — **UN CONTROL DE INSTRUMENTO EXIGE UN VEREDICTO, NO UNA DETECCIÓN** *(sin número — a la confirmación de A)*

> ### **Probar que el termómetro marca no es probar que el médico diagnostique.**

**Es la generalización de `L-333`:** allá la VOZ prometía más que la medición;
acá **el CONTROL cubre menos que el instrumento**. *En las dos el verde es
cierto y no alcanza.*

**El caso que la funda, medido sobre `verify-apk-contenido.mjs`:** su
`--autoprueba` corría **solo el detector** (`traeBundle`) y verificaba que
reconociera una APK sin bundle.

> **Podía dar VERDE mientras el juez daba un FALSO VERDE sobre la MISMA APK.**
> *La APK mala no trae bundle → el detector la detecta → verde. Y el juez, sobre
> esa misma APK, entraba por una rama que leía el `package.json` de hoy → verde
> también.* **Los dos verdes ciertos, y el conjunto mintiendo.**

**Lo que la vuelve exigible, en una pregunta:** *¿el control ejercita la DECISIÓN
del instrumento, o solo una de sus partes?* **Si solo mide una parte, su verde
no dice nada sobre el veredicto** — y el veredicto es lo único que alguien va a
leer.

**Su forma correcta:** el control le pasa el caso malo **al juez entero** y
**exige un veredicto no-verde**. *(Aplicado por A el mismo día: su autoprueba
ahora corre `juzgarApk()` completo y exige rojo o no concluyente.)*

**Y su parienta directa, que la casa ya tenía:** `L-330` —*un cero sin control
positivo no es un cero*—. **Acá el hueco no es el control que falta: es el
control que existe y cubre la mitad de abajo.**

---

### 📐 PRINCIPIO REGISTRADO — **LA CURA ES CORTAR UNA FUGA, NO AMPUTAR UNA FUNCIÓN** *(dictamen de mesa, 21-ago)*

**Nace de la revisión del juez de A.** Su rama dev-client tenía **una línea** que
leía el repo dentro de un juez que mira el ZIP. **La salida propuesta era borrar
la rama entera; la correcta era cortar esa línea.**

**Por qué la amputación era peor, y no es un argumento de elegancia:** borrar la
rama ponía el guard en **ROJO sobre una clase entera de artefactos legítimos**
—una dev build sana no trae bundle y arranca perfecto—.

> ### **Y un guard que da rojo sobre lo legítimo es el guard que alguien empieza a saltear — y ahí pierde también los casos que sí detectaba.**
>
> *Es la mecánica exacta de la **regla 87 · SALTAR_GATE**: un rojo conocido se
> vuelve la llave de todos los demás.*

**El discriminador que probó la cura, y lo corrió A:** *la misma APK sin bundle
que antes pasaba **VERDE** ahora sale **NO CONCLUYENTE**.* **Mismo objeto,
veredicto opuesto** — el arreglo probado contra el caso que lo motivó, no contra
la confianza de quien lo hizo.

---

## ⑨ · UNA SÉPTIMA QUE **NO** ES DE ESTA FAMILIA — y por eso vale nombrarla aparte *(aporte de A, 21-ago)*

**Las seis de arriba son capas que BORRAN.** La de A es otra cosa: **un guard
que mide la superficie equivocada.**

**Su caso:** el perfil `development` de `eas.json` declaraba
`developmentClient: true` **sin `expo-dev-client` en dependencias** ⇒ la APK
salía **sin `index.android.bundle`** y se quedaba en el splash para siempre.
**`verify-manifest-apk.mjs` dio VERDE — y tenía razón: el manifest estaba
perfecto.**

> ### **Verificábamos lo que el artefacto DECLARA, jamás lo que CONTIENE.**

*No hay ninguna capa de por medio: el instrumento leyó bien, midió bien y
contestó bien **la pregunta equivocada**.* Es la hermana un piso más abajo de la
que esta sesión ya tenía —*verificar la MATERIA PRIMA no prueba el ARTEFACTO*
(el comprobante de S101)— y **la distinción entre las dos familias importa
porque se curan distinto**: una capa se saca; una superficie equivocada exige
**cambiar qué se mira**.

### 🔴 ME LA APLIQUÉ AL ARNÉS, Y TENÍA UN CASO

**El bloque ① valida la policy con `qual ILIKE '%pagador_user_id%'`** — eso es
**el TEXTO de la policy**, no su efecto. *Una policy podría nombrar la columna y
no abrir nada: un brazo mal parentizado, un `AND` donde iba un `OR`.*

**El arnés se salva porque el bloque ⑤ corre como el pagador y cuenta filas** —
ahí está la prueba. **Pero su línea de salida decía «la policy conoce al
pagador», que se lee como veredicto.** Curado: ahora dice **«NOMBRA al pagador
(precondición — la prueba es ⑤)»**.

> *El instrumento no estaba mal: su VOZ prometía más de lo que su medición
> daba.* **Y un verde que promete de más es el que nadie vuelve a mirar.**
