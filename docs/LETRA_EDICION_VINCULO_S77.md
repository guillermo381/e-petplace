# LETRA — LA EDICIÓN DEL VÍNCULO (S77) — 🕐 **PROPUESTA, ESPERA FIRMA**

> **Estado: PROPUESTA DE MESA (S77, 24 Jul 2026).** Nace del pedido literal del
> founder en S76: *"edición es agregar o quitar chips de servicio o eliminar a
> ese prestador de mi negocio."*
>
> **PISO DE LITERAL — de dónde sale cada afirmación de motor de esta letra:**
> las lecturas **S77-A L1 · L2 · L2bis**, corridas contra la DB linkeada con
> `pg_constraint`, `pg_policies`, `information_schema` y `pg_get_functiondef`.
> **Ninguna afirmación de motor sale de memoria** (L-141 y L-166, que rigen
> también para la mesa). Lo que NO se relevó está marcado como tal en §10.
>
> **FRENO DECLARADO:** la **lectura 3** (¿existe HOY la superficie de
> desvincular en `/negocio/equipo`?) **no fue reportada** — es territorio B por
> 76(d). Por eso **§6 (la superficie) está en blanco a propósito**: decide si
> S77 construye una superficie o dos, y la mesa no lo supone. `CLAUDE.md:42`
> afirma que B la construyó en S74; eso es resumen, no fuente.
>
> **Contrastes obligatorios (corridos, no anunciados):** `MODELO_PRODUCTO`
> §2.5 / §6.1 / §8.1 / §8.6 / §8.8 — el contraste vive en **§9** de esta letra,
> como manda la casa · `LETRA_RECEPCION_S76` §3 / §5 / §6.1 / §6.2 ·
> `BIO_EXPEDIENTE` §(procedencia) y P-OP-3 · `LETRA_ROLES_EQUIPO` §7.2 ·
> `DEUDAS_CANONICAS` D-486, D-513, D-517, D-526, D-528.
>
> **Qué es:** qué puede hacer el titular de un negocio con la gente de su
> equipo — dar y quitar oficio, y sacar a alguien. **No es motor nuevo en su
> mayor parte: es la fotografía de lo que la DB ya permite y ya prohíbe**, más
> una ley que el canon firmado ya tenía escrita y nadie había cruzado con esta
> operación.

---

## 1. LA TESIS — el borrado duro está prohibido por el canon, no por la mesa

La mesa de S77 iba a elevarte una decisión: *eliminar = baja (`activo=false`),
jamás borrado*. **La lectura 1 la convirtió en otra cosa.** No es una
preferencia de arquitectura sobre la que puedas votar — es lo que ya firmaste,
en otro documento, para otro problema.

**El literal (L1): 32 FKs apuntan a `prestador_empleados`. NINGUNA es RESTRICT
ni NO ACTION** — borrar la fila del empleado **no rebota nunca**.

| Acción de la FK | Cuántas | Qué se lleva |
|---|---|---|
| **CASCADE** | **3** | `prestador_horarios` · `prestador_empleado_servicios` · `empleado_roles` — sus horarios, **sus chips** y sus roles, en silencio |
| **SET NULL** | **29** | **todo el sedimento**: la historia clínica, la vacuna aplicada, la medicación prescrita, el examen, la alergia, la condición crónica, el certificado, los 3 de caso clínico, el peso, el microchip, la atención, el presupuesto, las reseñas, `prestador_atencion_log` |

**Qué significa SET NULL acá, sin eufemismo: el evento sobrevive y se queda sin
autor.** La nota clínica que esa persona firmó hace tres años sigue en el
expediente, y a partir del DELETE **ya no dice quién la firmó**.

Y eso es exactamente lo que `BIO_EXPEDIENTE` prohíbe con todas las letras:

> **La procedencia nombra al colega cuando fue un prestador.** No se puede
> decir *"declarado por un prestador"* sin decir cuál — eso es precisamente lo
> que lo vuelve verificable, y es ecosistema: el vet puede llamar.
>
> …y el porqué, un párrafo antes: sin procedencia, **el expediente le miente
> sin querer y él no vuelve.**

> ## **LA LEY: DESVINCULAR ES BAJA (`activo = false`). EL BORRADO DURO NO
> EXISTE COMO OPERACIÓN DE PRODUCTO.**

**No hay excepción de "todavía no escribió nada".** Una regla que dependa de si
la persona alcanzó a firmar algo es una regla que la superficie tiene que
computar, que puede computar mal, y que cambia de respuesta entre el momento en
que se muestra el botón y el momento en que se toca. La baja es reversible por
el titular y ahora está protegida por el trigger de D-526; el borrado es
irreversible sobre autoría y **ninguna FK lo frena**.

> **⚠️ HALLAZGO CANDIDATO — pedido de lectura, no afirmación (§10.1).**
> `prestador_atencion_log` aparece en el grupo SET NULL, y `BIO_EXPEDIENTE`
> **P-OP-3** declara esa tabla *append-only por trigger* (`BEFORE UPDATE/DELETE`
> lanzan excepción, *"independiente de quién intente modificar, incluyendo admin
> o service_role"*). Un `ON DELETE SET NULL` **es un UPDATE sobre esa fila**. O
> el trigger existe y **el DELETE de un empleado ya rebota hoy con un error
> opaco**, o el trigger no cubre ese camino y **un log declarado inmutable se
> está mutando por acción de FK**. Las dos respuestas importan y ninguna se
> supone. Se lee antes de construir.

---

## 2. LA ASIMETRÍA — el vínculo se da de baja; el chip se borra

Podría parecer que la misma ley debería regir para los chips. **No, y el porqué
es preciso: el vínculo porta autoría, el chip porta permiso.**

**El literal (L2):** `prestador_empleado_servicios` tiene **tres columnas** —
`empleado_id` · `servicio_id` · `created_at DEFAULT now()`, las tres NOT NULL.
**No hay columna `activo`.** El chip es presencia o ausencia de fila. **No hay
policy UPDATE, y no hace falta.**

| | Qué pasa si se borra | Por eso |
|---|---|---|
| **La fila del vínculo** | 29 tablas de sedimento pierden a su autor | **BAJA** |
| **La fila del chip** | nada la referencia; el sedimento no la mira | **DELETE** |

**El chip es una llave, y una llave devuelta no deja rastro en la cerradura.**
Quién firmó cada nota lo responde `empleado_id` del evento, no el chip.

**Y la economía manda en la misma dirección.** Un soft-delete en el chip
obligaría a filtrar por él en **las 8 lectoras excluyentes de disponibilidad**
(`LETRA_RECEPCION_S76` §6.1, A0bis punto 1) **y en el gate clínico**, que
acabamos de flipear en S76. `LETRA_RECEPCION_S76` §6.1 eligió su cura
precisamente con ese criterio: *"aditivo, una función, **las 8 quedan
intactas**"*. Introducir estado en el chip es reabrir ese arco por la puerta de
atrás.

**Lo que la asimetría SÍ deja abierto, declarado y no resuelto:** hoy nada
registra **cuándo se quitó** un chip. `created_at` dice cuándo se dio; el DELETE
no deja fecha. Diez años después, el expediente puede decir *quién* firmó y no
*si estaba autorizado ese día*. **La mesa NO propone curarlo acá** — sería
fabricar una tabla de auditoría adentro de una superficie de edición. Se declara
como su propia línea (§10.3), con la disciplina de registro que
`LETRA_ROLES_EQUIPO` §7.2 ya nombra para los roles.

---

## 3. QUIÉN EDITA — titular-only, y la letra firmada no se rompe

**El literal (L2), las cuatro policies de `prestador_empleado_servicios`:**

| cmd | policy | gate |
|---|---|---|
| ALL | `empleado_servicios_admin` | `is_admin()` |
| **DELETE** | `empleado_servicios_dueño_elimina` | empleado de un prestador con `prestadores.user_id = auth.uid()` |
| INSERT | `empleado_servicios_dueño_inserta` | idéntico (en `with_check`) |
| SELECT | `empleado_servicios_select` | cualquier empleado activo del mismo negocio |

**La policy DELETE EXISTE.** La premisa del brief de S77 (*"B0 de S76 censó el
INSERT y nada más… sin policy DELETE, quitar un chip no tiene camino y la mitad
de la edición nace muerta"*) **es falsa contra la fuente**: hay camino, y es
titular-only. Sexto caso L-166 del arco, esta vez en un brief de arranque.

> ## **LA EDICIÓN DEL VÍNCULO ES DEL TITULAR. HOY NO HAY OTRA MANO.**

**El roce con la letra firmada, declarado y resuelto:** `LETRA_RECEPCION_S76`
§5 dice que el administrador gana *"invitar, dar chips y desvincular personas"*.
El motor dice titular-only (es el hueco inverso de **D-513**, ahora sobre el eje
del oficio). **No hay contradicción viva**, porque la misma §5 firma que
***"GATEAR NO ES CONCEDER — el toggle de administrador NO se ofrece hasta que su
motor exista"***. La consecuencia para S77 es una sola línea, y se escribe para
que nadie la "corrija" después:

**La superficie de edición que S77 construya se ofrece SOLO al titular.** El día
que exista el motor administrativo (D-513 v2 + D-517 CLASE 2), estas dos
policies se enmiendan junto con las otras — **no antes, y no desde acá**.

---

## 4. EL CHIP ES LA LLAVE CLÍNICA — lo que quitar un chip apaga, con literal

**El literal (L2bis)** — `empleado_tiene_capacidad_clinica`, cuerpo real:

```
SELECT is_admin()
  OR EXISTS (… prestadores p WHERE p.id = p_prestador_id AND p.user_id = auth.uid())
  OR EXISTS (… prestador_empleados pe
             JOIN prestador_empleado_servicios pes ON pes.empleado_id = pe.id
             JOIN prestador_servicios ps           ON ps.id = pes.servicio_id
             JOIN tipos_servicio ts                ON ts.codigo = ps.tipo_servicio
             WHERE pe.prestador_id = p_prestador_id
               AND pe.user_id = auth.uid()
               AND pe.activo = true
               AND ts.es_medico = true);
```

**Confirmado: no mira `ps.activo`** — que es lo que S76 decidió a propósito
(*desactivar una oferta no le quita el expediente al vet*), y ahora queda con su
literal a la vista.

**Las dos revocaciones, medidas:**

1. **Quitar el último chip médico** ⇒ el brazo 3 se cae ⇒ pierde lectura y
   escritura clínica. **Inmediato, sin migración, por la policy DELETE que ya
   existe.**
2. **La baja (`pe.activo = false`)** ⇒ el brazo 3 se cae igual, **sin tocar
   ninguna otra fila**. Es la revocación limpia.

**Lo que NINGUNA de las dos toca:** los brazos 1 y 2 (`is_admin()` y
titularidad). El titular no puede quedarse afuera de su propio expediente por
esta superficie — **y eso es correcto: la letra no fabrica un candado sobre el
dueño del negocio.**

---

## 5. EL BORDE QUE ESTA LETRA NO PUEDE RESOLVER SOLA — y que ata el ítem 1 al ítem 2

**Dar de baja a alguien no es un acto sobre una persona: es un acto sobre su
agenda.**

El predicado real de las tres policies de agenda, byte-idéntico en las tres
(`LETRA_RECEPCION_S76` §4, A0 punto 3):

```
( prestador_id IN (SELECT id FROM prestadores WHERE user_id = auth.uid()) )
OR
( empleado_id IN (SELECT id FROM prestador_empleados
                  WHERE user_id = auth.uid() AND activo = true) )
```

**Consecuencia, con el `activo = true` a la vista:** el segundo que el titular
da de baja a un profesional, **todas las citas donde esa persona es el
`empleado_id` dejan de ser visibles para todo el mundo salvo el titular.** No se
cancelan, no avisan, no aparecen en la agenda de nadie. La familia tiene su cita
del jueves; el negocio dejó de verla.

**Es la forma de D-526 otra vez, por la puerta de al lado: la baja hace
desaparecer trabajo en silencio.** Y es exactamente el hueco que el ítem 2 del
brief ya sabe llenar: **`empleado_id = NULL` ES "cita de la clínica"**
(`registrar_atencion_mostrador` ya lo produce cuando hay >1 profesional).

> **POR ESO LOS ÍTEMS 1 Y 2 SON UNA SOLA MIGRACIÓN.** La baja necesita saber
> qué hacer con las citas futuras; la respuesta correcta es el objeto que el
> ítem 2 construye. Separarlos obliga a construir la baja dos veces.

**LA DECISIÓN ES TUYA (§11, la única pregunta de esta letra).**

---

## 6. LA SUPERFICIE — EN BLANCO, ESPERANDO LA LECTURA 3

Esta sección no se escribe hasta que B reporte si `/negocio/equipo` ya tiene su
camino de desvincular. **Un boceto contra una superficie supuesta es una
corazonada con lámina.** Lo único que la letra fija de antemano:

- **Mecanismo M1–M5 sin excepción**, sea superficie nueva o recompuesta.
- **Ley 23 directa:** la puerta no ofrece lo que el motor va a rechazar — si el
  actor no es el titular, la acción **no se dibuja** (§3).
- **L-139:** el conteo de citas futuras que §11 decide mostrar sale de un lector
  real o no se muestra. **Jamás un número plausible.**
- **La baja se dice con su verbo honesto.** No es "eliminar": la persona deja de
  trabajar acá y su firma se queda en el expediente. La voz lo dice; la letra no
  fija el string acá porque **no hay pantalla contra la cual leerlo**.

---

## 7. EL PEDIDO DE MOTOR — qué falta construir, sin maquillaje

1. **El trigger de herencia de chips** (`LETRA_RECEPCION_S76` §6.1, decisión de
   mesa firmada en S76). **HOY NO TIENE DUEÑO.** Sin él, la clínica agrega una
   oferta nueva y sus chips viejos no la cubren ⇒ las 8 lectoras excluyentes
   dejan esa oferta **sin profesionales, en silencio**. Converge con esta letra:
   la misma pantalla que da chips es la que hace visible el hueco.
2. **La resolución de las citas futuras en la baja** (§5 + §11).
3. **Nada más.** Quitar chip y dar de baja **ya tienen camino de motor** — la
   policy DELETE existe y el titular ya escribe `activo` (verificado 4/4 en la
   enmienda A2 v2 de D-526, brazo (b): *"el TITULAR SIGUE escribiendo `activo`
   — desvincular no se rompió"*).

---

## 8. LO QUE ESTA LETRA JAMÁS HACE

Un botón que borra a una persona · un evento clínico sin autor · una superficie
de edición ofrecida a quien el motor va a rebotar · un soft-delete en el chip
que obligue a tocar las 8 lectoras · una baja que hace desaparecer citas sin
decirlo · estado nuevo en `prestador_empleado_servicios` · el toggle de
administrador con poderes que su motor no tiene.

---

## 9. CONTRASTE CONTRA `MODELO_PRODUCTO` — CORRIDO (regla de la casa)

**§2.5 — *"e-PetPlace NO es un CRM veterinario"*, con su enmienda S66.** Es el
roce candidato: administrar el equipo de una clínica **suena a** operación
interna. **Sobrevive por las dos preguntas del filtro.** La primera
(*¿enriquece el expediente?*): esta letra existe **para que el expediente no
pierda a su autor** — es la única razón por la que la baja gana al borrado.
La segunda (*¿hace que cobrar adentro sea más fácil que afuera?*): un negocio
que no puede corregir a quién le dio qué oficio **gestiona su equipo afuera de
la plataforma**, y con él se va la agenda. **Roce declarado y resuelto, no
escondido.**

**§6.1 — *wow = cero explicación necesaria*.** La asimetría se explica en una
frase: *el oficio se da y se quita; la persona se da de baja, porque su firma
queda*. Y la superficie se compone por lo que el actor PUEDE (§3): el que no es
titular **nunca ve una acción que le va a rebotar**.

**§8.1 — *la mascota es dueña de su vida documentada*.** Es el principio que
esta letra defiende de frente: el DELETE de un empleado **le arranca el autor a
la vida documentada de mascotas que no son suyas**. La familia no autorizó eso y
el negocio no debería poder hacerlo. **Verde, y es la tesis.**

**§8.6 — *hitos privados del humano, inviolables*.** Ningún verbo de esta letra
los alcanza.

**§8.8 — *datos sensibles con consentimiento explícito*.** Quitar un chip
**revoca** acceso; nunca lo concede sin acto del titular. La letra se mueve en
la dirección restrictiva.

**§8.3 — *no sponsoreo en recomendaciones clínicas*.** Esta letra no toca
recomendación, urgencia ni orden de oferta — **con una salvedad honesta**: quien
tiene chip aparece en disponibilidad, así que **el titular decide quién es
reservable**. Es criterio de negocio sobre su propia gente, no pago por
posición. Declarado por si algún día alguien vende esa posición.

**Sin roce sin declarar.**

---

## 10. LO QUE QUEDA ABIERTO — sin maquillar

1. **`prestador_atencion_log` vs P-OP-3** (§1, hallazgo candidato). Lectura
   obligatoria antes de construir: ¿existe hoy el trigger `BEFORE UPDATE` en esa
   tabla, y qué hace ante el SET NULL de una FK?
2. **¿Las 8 lectoras excluyentes de disponibilidad exigen `pe.activo = true`?**
   **NO RELEVADO.** L2bis probó que el gate clínico sí lo exige. Si alguna de
   las 8 no lo hace, **una persona dada de baja sigue apareciendo como
   reservable para las familias** — la baja no da de baja, y sería D-526 en su
   tercera forma. **Es la lectura 4, y decide si esta letra necesita una cura
   adentro.** (Su rama gemela: la rama `pe.rol = 'dueño'` de esas mismas 8, que
   D-486 enmendada declara con **nueve** lectores vivos.)
3. **La fecha de revocación del chip** (§2, último párrafo). Declarada, no
   curada.
4. **La superficie** (§6): esperando la lectura 3.
5. **Los chips AL INVITAR** siguen sin verificar — `LETRA_RECEPCION_S76` §13
   punto 1 lo dice y esta letra no lo mueve. **La mesa no afirma que esté APTO.**
6. **Las 3 filas legacy desactivadas: ¿personas reales o seed?** Sigue abierta
   desde S76. Si alguna es real, la baja que esta letra construye tiene un caso
   de uso hoy, no mañana.

---

## 11. LA ÚNICA PREGUNTA PARA EL FOUNDER

**Cuando das de baja a un profesional que tiene citas agendadas para los
próximos días, ¿qué pasa con esas citas?**

Hoy el motor responde solo, y responde mal: quedan pegadas a él y **se vuelven
invisibles para todos menos para vos** (§5).

| | Qué hace | Qué cuesta |
|---|---|---|
| **(a) Pasan a ser de la clínica** *(recomendación de mesa)* | `empleado_id → NULL` — cualquier profesional libre la toma | Es el objeto del ítem 2; una migración para los dos |
| **(b) La baja rebota** | *"Esta persona tiene 3 citas esta semana. Resolvelas primero."* | Honesto, pero le pone al titular una tarea antes de una decisión que ya tomó |
| **(c) Quedan como están** | nada | **Es el comportamiento de hoy, y es el que rompe en silencio** |

**La mesa propone (a), con una condición que no es negociable:** la superficie
**lo dice antes**, con el número real leído de la agenda — *"tiene N citas en
los próximos días; al darla de baja pasan a ser citas de la clínica"*. Cambiar
datos en silencio es lo que esta casa no hace, aunque el cambio sea el correcto.

---

## Historial

- **PROPUESTA (S77, 24 Jul 2026):** redactada por la mesa sobre el pedido
  literal del founder en S76, con piso de literal en las lecturas S77-A
  L1/L2/L2bis. Da vuelta la premisa del brief de arranque (*"sin policy DELETE"*
  — la policy existe, §3). Eleva la decisión baja-vs-borrado de **decisión de
  mesa** a **consecuencia del canon firmado** (`BIO_EXPEDIENTE`, procedencia).
  Declara la asimetría vínculo/chip. Ata el ítem 1 al ítem 2 por el borde de las
  citas futuras (§5). Abre la lectura 4 (§10.2) y el hallazgo candidato de
  P-OP-3 (§1). **Números de deuda propuestos en esta tanda: D-532** (bucket
  `avatars` — el brief lo llamaba D-527, que está OCUPADA por
  `porcentaje_comision`/`modelo_pago`; máximo depositado leído hoy: D-531). Toda
  numeración se re-verifica contra el depósito al momento de depositar (L-166).
