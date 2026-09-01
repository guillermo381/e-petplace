# S109-C · EL PARTE DE LA PISTA — escrito por C, no relatado

> **Insumo para el traspaso de S109.** El founder pidió que lo escribiera yo:
> *una decisión que llega relatada es una decisión que nadie firmó.*
>
> **Rama `pista/s108-c` = `7a01ab84` = `main`** · local = remoto por SHA · árbol
> limpio · **cero commits fuera de `main`** (`merge-base --is-ancestor` verde).

---

## ① LO QUE CERRÉ, Y CÓMO SUPE QUE ESTABA BIEN

**El criterio, primero, porque es lo que hay que leer:** casi nada de esto lo
probó un gate. **Lo que encontró los defectos fue medir el motor y cruzarlo con
la superficie** — y tres de los cuatro hallazgos grandes salieron revisando un
rojo ajeno o una cura propia, no buscándolos.

### EL MANDATO POR DEUNA — y el «muy pronto» murió porque cambió su medición
La condición `!recurrente` que apagaba DeUna tenía **su razón medida y escrita**
(`tarjeta_id` NOT NULL, la puerta exigía tarjeta). A puso la palabra, **re-medí,
y se retiró**. *Un freno que sobrevive a su medición ya no protege a nadie:
esconde una función que existe.*
**Prueba:** `MedioDelMandato` —unión discriminada— hace **inexpresable** mandar
DeUna con tarjeta o tarjeta sin tarjeta. No es un rebote más: es que no compila.
**Y el `riel` se lee de la RESPUESTA, no del que mandé**: si el motor degradara
un riel, la pantalla debe prometer lo que quedó firmado.

### EL MES PENDIENTE EN CUENTA — la tercera puerta que faltaba
`obtener_mes_pendiente_guarderia` estaba creada, grantada y **sin wrapper**
(`L-318`, tercera vez en este frente).
**Prueba de que está bien:** los **dos relojes viajan separados** —`mesVenceEn`
(días) y `codigoExpiraEn` (minutos)— y el código **no se muestra en la tarjeta**:
lleva a la pantalla del link, que es la que lo maneja. *Juntarlos en un contador
diría que se acabó algo que no se acabó.*
**Y entra en la MISMA condición de fallo que el resto de la pantalla**: un mes
pendiente que no se pudo leer se ve idéntico a «no tienes nada que pagar» — el
peor error posible ahí, porque la familia pierde el plan por el silencio.

### EL ARCO DE ADIESTRAMIENTO — primero el quién
La lista pintaba **una fila por programa** y partía el oficio en dos caminos: la
sesión iba a la vitrina, el programa la salteaba. **Ahora un adiestrador es una
fila** y el tap lleva siempre a su vitrina.
**El hallazgo que lo abarató: la vitrina YA estaba cableada para programas.**
*Era motor con puerta, y la puerta la tenía cerrada una rama de la lista.*
**Prueba del `find`:** medido en `_adiestramiento_ofertas_cobrables` —
`prestador_programas.prestador_servicio_id` es FK a `prestador_servicios` ⇒
**sesión y todos los programas comparten `ps.id`**. El `find` no era ambiguo *a
veces*: **lo era siempre que hubiera dos programas**, y el segundo era
inalcanzable en silencio. *Acertaba por cómo llegaba la llamada, no por lo que
preguntaba.*

### EL PASO DEL QUÉ — muerto por firma, pero no era borrar un selector
**Alimentaba al motor** (`obtenerIniciosAdiestramiento(dia, mascotaId,
comprable)`). Y el motor **siempre admitió los dos** (`p_comprable DEFAULT NULL`):
era el wrapper el que lo pedía obligatorio.
**Las cuatro voces que murieron con él se midieron en 0 consumidores ANTES de
borrarlas**, y quedan con lápida en los dos diccionarios.

### LAS VOCES
· `pago_en_proceso` **proponía repetir el toque que la produjo** — *un rebote que
  propone la acción que lo produjo es un loop con voz amable.* Estaba mal en los
  **cinco** sujetos, no sólo en el link.
· El copy de reactivación decía **«ese día de cada mes»** — la misma promesa
  falsa que A ya había curado una vez acá. **La escribí por copiar la FORMA de la
  frase vieja.**
· `programa_no_empieza_hoy`: ver `L-455` abajo.

---

## ② LO QUE QUEDÓ ABIERTO — con dueño y disparo

| qué | dueño | disparo |
|---|---|---|
| **DeUna no cobra planes de paseo** — `SujetoDeuna` no nombra `plan` **y `pagos-deuna-solicitud` no conoce `suscripcion_servicio_id`** (0 ocurrencias, medido por B) | **B** | firma del founder. **Es la rama entera de la edge**, no dos líneas |
| **`/pagos/mensualidad` resuelve SÓLO guardería** — un link de plan de paseo llegaría a una pantalla que no sabe leerlo | **C** | **viaja con la de B**: sola dejaría un sujeto emitible sin destino |
| El paso del QUÉ murió; **el `comprable` sigue llegando por URL y ya no se lee** — queda declarado en el tipo de params | C | limpieza, sin urgencia |

🔴 **Y una que no es de nadie todavía:** el `find`→`filter` de la barra y el
filtro programa-hoy **se resuelven al montar y no se re-evalúan**. La carrera de
la medianoche (elige mañana, pasa medianoche, toca pagar) **la cubre sólo el
motor** con `programa_no_empieza_hoy`. *No es un defecto: es el reparto correcto,
y se escribe para que nadie "arregle" la pantalla creyendo que falta algo.*

---

## ③ LAS FIRMAS — confirmo cuatro y **corrijo la quinta**

✅ el link mensual es NUESTRO · exige sesión · **vence el CÓDIGO, no el link**
✅ el mes impago **no termina el plan: lo deja reactivable, con ancla NUEVA**
✅ todo se contrata **POR MASCOTA**, con su excepción: **el USO, no el SALDO**
✅ **primero el QUIÉN, después el QUÉ** — el paso del QUÉ murió

🔴 **CORRIJO: «recurrente sólo por tarjeta» está DEROGADA y no debe entrar al
canon.** El founder la revocó el mismo día: **el recurrente por DeUna existe, con
link mensual**, y por eso maté el «muy pronto» y construí la pantalla del link.
*Lo que rige hoy es más fino y es lo que hay que escribir:* **DeUna alcanza a la
mensualidad de guardería (recurrente) y NO alcanza al plan de paseo** — y la
razón **no es la categoría, es el SUJETO**: `SujetoDeuna` no nombra `plan`.
⚠️ Esa distinción es la que sostiene `deunaCobraEsteSujeto`. Escribirla como
«recurrente sólo por tarjeta» **volvería a justificar por categoría un apagado
que es por sujeto** — el defecto exacto que esta sesión enterró.

---

## ④ LAS LECCIONES — el hilo que las une

**`L-455` es mía y su segunda mitad es la que explica por qué el defecto
sobrevivió:**
> **Un guard correcto puede tener una voz falsa, y el correcto tapa a la falsa.**
> *Yo medí que el guard rechazaba y me quedé en la consecuencia, sin leer qué
> decía al rechazar.* **Y la voz vieja además compensaba la mentira**: decía
> *«ya pasó — elige una desde mañana»* — **dos mitades de casos distintos**, la
> segunda una muleta para cubrir que hoy tampoco sirve.
> ⇒ **Un censo de guards no lo encuentra** (frenan bien) **y un censo de voces
> tampoco** (se leen bien). **Sólo aparece cruzando los dos.**

**El hilo del resto, en una línea:** *el tipo aplasta un estado que el motor sí
tiene* — con **tres mecanismos distintos** medidos el mismo día: un `COALESCE`
que aplasta «no declaró» · un `DEFAULT` que aplasta que el cuerpo lo necesita ·
**un parámetro obligatorio que aplasta «no filtres»** (el mío). *Los dos primeros
mienten sobre un valor; el tercero borra una pregunta.*

Y la de forma, que se cobró tres veces entre las tres pistas: **medir la propia
rama y llamarlo «el estado»** — y su causa estructural, **el instrumento ciego
por un generado ausente**, que A ya mecanizó (`guard-rutas-tipadas.mjs`).

---

## ⑤ 🔴 LA RESPUESTA SIN REDONDEAR: **NINGUNA PANTALLA MÍA SE VERIFICÓ EN APARATO**

**Cero.** Ni una. **Todo lo mío se probó por typecheck, lectura del motor y
gates** — y **no se publicó OTA en toda la sesión**, así que **nada de esto llegó
a un teléfono, ni al del founder.**

⚠️ **Y la distinción que el renglón necesita para ser exacto:** B **ejerció el
MOTOR** de los seis sujetos con id de transacción y comprobante. **Eso no es mi
superficie.** *Que el cobro del plan haya salido por `DF-2108362` prueba que el
motor cobra; no prueba que mi checkout lo llame bien, ni que la espera pinte, ni
que el rebote se lea.*

### LO QUE ESTÁ CORRECTO Y **NUNCA CORRIÓ** (construido y sin ejercer)
Ordenado por lo que más cuesta si está mal:

1. **El mandato por DeUna** — B midió el riel entero en **`por_deuna = 0`**.
   Nunca se firmó uno. ⇒ **la unión, el riel del checkout y sus dos cuerpos de
   espera nunca corrieron.**
2. **La pantalla del link `/pagos/mensualidad` entera** — su código, su
   `regenerar`, su `sin_sesion` y **el login return-to con lista blanca**.
   *Depende de un link emitido, que depende de (1).*
3. **La tarjeta de mes pendiente en Cuenta** — misma cadena.
4. **La Hoja de elección de programa** en la vitrina: **exige un adiestrador con
   2+ ofertas** y **no pude medir si existe uno** (este worktree no está linkeado
   a la DB). *Si no existe, la Hoja nunca se dibujó ni puede probarse.*
5. **El filtro programa-hoy** y **la voz `programa_no_empieza_hoy`**.
6. **La reactivación de mensualidad** con ancla nueva.

> 🔴 **Lo digo con todas las letras porque es lo que se pierde al redondear: en
> esta sesión escribí el arco de cobro de la superficie casi entero y NADA de eso
> tocó un dispositivo.** *Construido, tipado y con gates verdes no es lo mismo
> que ejercido* — y los cuatro hallazgos grandes de hoy aparecieron **midiendo el
> motor**, no leyendo mi código, que es exactamente la clase de cosa que un
> aparato encuentra y un typecheck no.
