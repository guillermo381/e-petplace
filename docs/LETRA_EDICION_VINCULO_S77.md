# LETRA — LA EDICIÓN DEL VÍNCULO (S77) — 🕐 **PROPUESTA, ESPERA FIRMA** — v1.7

> **Estado: PROPUESTA DE MESA (S77, 24 Jul 2026) — v1.7.** Nace del pedido
> literal del founder en S76: *"edición es agregar o quitar chips de servicio o
> eliminar a ese prestador de mi negocio."*
>
> **PISO DE LITERAL — de dónde sale cada afirmación de motor de esta letra:**
> las lecturas **S77-A L1 · L2 · L2bis · L3 · L4 · L5 · L6 · L7 · L8 · L9 · L10 · L(P-OP-3)**,
> corridas contra la DB linkeada con `pg_constraint`, `pg_policies`,
> `pg_trigger`, `information_schema` y `pg_get_functiondef`, más lectura de
> árbol (`apps/prestador`, `packages/api`) con su grep declarado en L3.
> **Ninguna afirmación de motor
> sale de memoria** (L-141 y L-166, que rigen también para la mesa). Lo que NO
> se relevó está marcado como tal en §10.
>
> **EL FRENO DE LA v1.0–v1.2, LEVANTADO (v1.3).** La lectura 3 llegó: la
> superficie de `/negocio/equipo` fue leída en su archivo, no heredada de
> `CLAUDE.md:42`. **§6 deja de estar en blanco** y la pregunta que la abría
> tiene respuesta: **S77 construye UNA superficie, no dos.**
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

**Y la reversibilidad ahora está medida, no supuesta.** La baja escribe UNA
columna: **sus chips, sus roles y sus horarios quedan intactos** (son las tres
CASCADE de L1 — lo que el DELETE se lleva es exactamente lo que la baja
preserva). Reactivar a alguien es volver a poner `activo = true` y **todo su
oficio vuelve solo**, sin reconstruir nada. La persona que volvió del posparto
no tiene que ser cargada otra vez.

> **⚠️ Y LA CASA YA LO HABÍA DECIDIDO — EN UN JSDoc (lectura L3).** El wrapper
> `desvincularEmpleado` (`packages/api/src/wrappers/equipo.ts`) **no borra: hace
> `activo = false`**, y trae su porqué escrito arriba, de S74:
> *"Desvincular = `activo=false` (el mecanismo probado de la desactivación S73).
> La procedencia preserva los actos (§14.1) — el acceso muere, lo hecho queda."*
>
> **Esta letra no está inventando una prohibición: le está poniendo rango de ley
> a una decisión que ya está construida y funcionando.** Lo que cambia es que
> deja de vivir en un comentario —donde nadie la vota, nadie la contrasta y
> cualquiera la "optimiza"— y pasa a tener su porqué en el canon, con el literal
> de las 32 FKs detrás. Un JSDoc no defiende una ley: la describe hasta que
> alguien lo borra.
> (lectura L(P-OP-3), definiciones; NO probado empíricamente).**
> `prestador_atencion_log.empleado_id` es `ON DELETE SET NULL`, y la tabla lleva
> **DOS triggers habilitados** (`trg_atencion_log_no_delete` ·
> `trg_atencion_log_no_update`, ambos `tgenabled='O'`) sobre un cuerpo **sin
> ninguna rama de escape** — no es DEFINER, no mira rol, no mira `current_user`:
> `RAISE EXCEPTION 'prestador_atencion_log es append-only. % no permitido.'`.
> Un `SET NULL` **es un UPDATE sobre esa fila**, así que entra por
> `trg_atencion_log_no_update` y **aborta la transacción entera**.
>
> **Las dos consecuencias, y las dos importan:**
> 1. **La rama fea queda DESCARTADA por el mismo literal:** ningún log
>    declarado inmutable se está mutando en silencio por acción de FK.
> 2. **El DELETE de un empleado que atendió al menos una vez FALLA HOY** — con
>    un mensaje **opaco al doble**: dice *UPDATE no permitido* sobre una tabla
>    que el actor nunca nombró, cuando lo que pidió fue un DELETE sobre otra.
>
> **Lo que esto le hace a esta letra: la confirma y la vuelve urgente.** La DB
> ya implementa —sin que nadie lo decidiera— exactamente la regla que §1
> rechaza: *borrá si todavía no escribió nada, rebotá si escribió*. La misma
> regla condicional, con la peor voz posible y del lado equivocado del criterio.
> **Al que nunca atendió, el DELETE lo borra entero y se lleva sus chips, sus
> roles y sus horarios por CASCADE.** La letra no inventa una prohibición: le
> pone nombre, alcance uniforme y voz honesta a un accidente que ya está
> operando.

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
como su propia línea (§10), con la disciplina de registro que
`LETRA_ROLES_EQUIPO` §7.2 ya nombra para los roles.

> **LA ASIMETRÍA ESTÁ CONFIRMADA POR LOS DOS LADOS (L2 + L3), Y ES DESPAREJA:**
> el **vínculo** tiene motor Y superficie (la policy y el wrapper de baja, los
> dos vivos); el **chip** tiene **motor con la puerta abierta y superficie sin
> puerta** — `empleado_servicios_dueño_elimina` existe y autoriza el DELETE, y
> **no hay una sola línea de app que lo llame** (grep en cero sobre
> `packages` + `apps`). **Ahí está el trabajo de S77, y no está donde el brief
> lo buscaba.**

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

> **YA SE CUMPLE (L3), y con voz digna.** `/negocio/equipo` envuelve la lista,
> el CTA de invitar y la Hoja entera en `pantalla.equipo.esDueno`; el no-dueño
> que aterriza por deep link recibe **el porqué UNA vez, sin candados** (el
> patrón de solo-lectura de S60). La firma del negocio se ve siempre. **Ley 23
> cumplida en la superficie — S77 no la construye, la hereda.**
>
> **PERO LOS DOS EJES NO SON EL MISMO EJE, y eso es hallazgo (L3):**
> `esDueno` sale de la **fila de rol** (`roles.data.length > 0`, apoyado en que
> el SELECT de `empleado_roles` es dueño-only), mientras que las dos policies de
> **escritura** que esa pantalla usa gatean por **titularidad**
> (`prestadores.user_id = auth.uid()`). Hoy coinciden porque los 5 titulares
> tienen su fila. **El día que D-515 dispare** —la fila `dueño` del titular
> declarada REDUNDANTE— **la pantalla se apaga y el motor sigue abierto.** No es
> fuga: es una pantalla que va a mentirle al titular diciéndole que no puede.
> Se declara acá para que la tanda de D-515 lo encuentre (§10).

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

### 4bis. LA BAJA DA DE BAJA — verificado 8/8 (lectura L4)

La pregunta que esta letra abrió en su v1.0 (*¿las lectoras excluyentes exigen
`pe.activo`, o el dado de baja le sigue apareciendo reservable a las
familias?*) **tiene respuesta verde con literal: 8 de 8.**

`obtener_slots_disponibles` · `obtener_inicios_paseo_disponibles` ·
`obtener_paseadores_disponibles` · `_inicios_disponibles_prestador` ·
`crear_bloqueo_agenda` · `reservar_salida_paquete` · `_generar_citas_plan` ·
`_generar_citas_programa` — **las ocho llevan `pe.activo` EN EL JOIN**, no en un
`WHERE` opcional: `JOIN prestador_empleados pe ON pe.id = h.empleado_id AND
pe.activo`. **No hay rama que lo esquive.** El desactivado desaparece de toda
superficie reservable para las familias.

> **PERO LA PUERTA DE ENTRADA DE LAS OCHO NO ES EL CHIP: ES EL HORARIO.**
> Las ocho parten de `prestador_horarios` y llegan a la persona por ahí. **Un
> empleado sin franjas cargadas no aparece en ninguna — con chip, con `activo`,
> con todo.** Consecuencia directa para esta letra: **dar un chip NO vuelve a
> nadie reservable.** Es capacidad, no disponibilidad. La superficie que dé
> chips y no lo diga va a producir la pregunta *"le di el chip de vet, ¿por qué
> no aparece?"* — y esa pregunta es la vara §6.1 de `MODELO_PRODUCTO` fallando
> (*cero explicación necesaria*). Ver §6.

**El eje legacy, de paso, con su literal:** las ocho consultan el chip bajo el
mismo predicado, siempre con un OR sobre la columna congelada — `AND (pe.rol =
'dueño' OR EXISTS (… prestador_empleado_servicios …))`, **idéntico en las
ocho**. Es el lector vivo de **D-486** en el eje de disponibilidad, ahora citado
con su forma exacta. Esta letra no lo toca; lo deja registrado para el día que
el DROP se proponga.

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

### 5bis. EL SEGUNDO OBJETO — RESUELTO POR EL MOTOR, Y BIEN (lectura L5)

La v1.1 abrió este borde temiendo lo peor: que un plan pagado por adelantado
dejara de generar citas en silencio. **La lectura 5 lo desmiente, y el motor
sale mejor parado que la sospecha.**

**Ni empleado fijo, ni reasignación: elección por FECHA.** Ninguna de las dos
funciones guarda persona. En cada iteración del bucle resuelven a quién le toca
—`prestador_horarios` + `pe.activo` + el predicado del chip, desempatando por
carga del día → `created_at` → `id`— y la estampan **solo** en
`evento_cita_servicio.empleado_id`. Consecuencia declarada: **con más de un
profesional, dos fechas del mismo plan pueden caer en personas distintas.** El
plan es del negocio, no de la persona. *(Trampa declarada:
`suscripciones_servicio.empleado_id` EXISTE con su FK y **nadie la lee ni la
escribe** — 0 de 1 filas poblada. Parece "el paseador asignado" y no lo es. Ver
§10.)*

**Cuando no hay nadie elegible, ABORTA — no saltea, no reasigna:**
`RAISE EXCEPTION 'fecha_sin_cupo: %'`, idéntico en las dos, precedido de
`prestador_no_disponible` (D-341, vacaciones) y `fuera_de_horario`.

**Y las dos puertas fallan distinto, las dos honestas:**

| Puerta | Qué pasa | Rastro |
|---|---|---|
| **Contratar** (RPC de pantalla) | la excepción sube al wrapper como **código tipado**, la transacción revierte, **nada nace** | sin rastro persistente — pero la persona lo ve en el acto |
| **Renovar** (cron diario 8:00, `cerrar_y_renovar_planes`) | cada plan en su propio bloque: **no mata la corrida de los demás** | **triple**: `pago_metadata.renovacion_fallida` con `SQLERRM` y timestamp · **notificación in-app al dueño** · contador de errores en el retorno |

> **La baja NO rompe los planes en silencio.** El plan cae a `vencida` y la
> familia se entera con voz y con camino (*"puedes rearmarlo desde Mis
> paseos"*). **Esta letra no necesita política para el segundo objeto.**

**Lo que SÍ queda, y vuelve al primer objeto:** el cron solo toca planes cuyo
período ya cerró. **Las citas del período en curso ya están generadas y siguen
apuntando a la persona dada de baja.** Ninguna de las dos funciones reasigna
citas existentes *(límite declarado por la lectura: si existe otro camino que
reasigne al desactivar, no entró en su alcance)*. Así que la forma real es esta:
**dos semanas de paseos que el negocio no puede ver (§5), y recién al cierre del
período el aviso de que el plan no se renovó.** El aviso llega tarde y llega por
el motivo equivocado.

**LA DECISIÓN ES TUYA (§11) — y ahora es UNA sola.**

---

## 6. LA SUPERFICIE — UNA SOLA, Y NO ES LA QUE EL BRIEF BUSCABA (lectura L3)

**La respuesta a la pregunta que abrió esta letra: S77 construye UNA superficie,
no dos.** `apps/prestador/src/app/negocio/equipo.tsx` (485 líneas, S74-B) ya
existe, ya lista al equipo, ya abre una Hoja por miembro, y **ya desvincula
bien**. Lo que no existe es el chip.

### 6.1 El censo de la superficie, con literal

| Operación del pedido del founder | Hoy | Qué falta |
|---|---|---|
| **Eliminar a alguien del negocio** | ✅ **existe y es correcta** — Hoja del miembro, confirmación en dos toques, `desvincularEmpleado` → `activo=false` | **nada de superficie** |
| **Agregar chips** | ⚠️ **solo AL INVITAR** — toggle + selector múltiple de oficios → `asignarServiciosEmpleado` (INSERT batch) | **el camino para quien YA está adentro** |
| **Quitar chips** | ❌ **no existe** — grep en cero sobre `packages` + `apps`; el único consumidor de `prestador_empleado_servicios` es el INSERT | **wrapper + superficie** |

**El chip se da una sola vez, en la invitación, y no hay camino de vuelta desde
ninguna pantalla** — aunque la policy que lo autoriza exista desde siempre. La
edición del vínculo, hoy, es de ida.

### 6.2 LA COLISIÓN CON LA LETRA FIRMADA — la Hoja quedó vieja

La Hoja del miembro monta **dos `Interruptor` de rol: `profesional` y
`recepcion`.** Fue construida en S74-B; `LETRA_RECEPCION_S76` se firmó DESPUÉS y
**dice otra cosa en los dos casos**:

- **`recepcion` no es un toggle.** Es el piso, y desde la migración A2bis
  (`20260724120000`) **se concede al entrar a todos** — veterinarios incluidos.
  La propia letra firmada lo pone en piedra: *"la fila `recepcion` es MEMBRESÍA,
  JAMÁS IDENTIDAD… nada lee su presencia como 'es recepcionista'."* Un
  interruptor que la enciende y la apaga **está tratando membresía como
  identidad**, que es exactamente lo que esa ley prohíbe.
- **`profesional` no se elige.** `LETRA_RECEPCION_S76` §1: *"`profesional` deja
  de ser un valor que alguien elige y pasa a ser **derivado — tiene ≥1 chip**."*
  El toggle que corresponde es **Prestador**, y lo que hace al encenderse es
  **revelar los chips**; la verdad vive en ellos.
- **El toggle que la letra firmada SÍ define —Administrador— no se ofrece**,
  porque su motor no existe (§5 de esa letra: *gatear no es conceder*). S77 no
  lo dibuja.

> **Entonces el trabajo de S77 sobre esta pantalla no es "agregar chips": es
> RECOMPONER LA HOJA DEL MIEMBRO contra la letra firmada.** Los chips son el
> contenido; los dos interruptores viejos son lo que sale. Es superficie
> recompuesta ⇒ **mecanismo M1–M5 sin excepción.**

**Precondición declarada:** antes de tocarla hay que leer **qué escriben hoy esos
dos interruptores** (§10). La mesa no propone matarlos sin saber qué filas
mueven — sería exactamente la clase de afirmación que esta sesión viene
desarmando.

### 6.2bis. LA LECTURA 7 CONTESTÓ, Y LA DIVERGENCIA TIENE CONSECUENCIA CLÍNICA

**El toggle `profesional` escribe fila propia.** `Interruptor` →
`toggleRol(m,'profesional',v)` → `asignarRolEmpleado` → `INSERT INTO
empleado_roles (empleado_id, rol='profesional', asignado_por)`. **No toca
`prestador_empleado_servicios` en ningún punto.** El motor la trata como
**concedida a mano**; la letra firmada la declara **derivada de ≥1 chip**.

**Y la misma pantalla se contradice a sí misma** — lo que convierte esto en
hallazgo y no en detalle. La Hoja de **invitar** lo hace bien, y lo dice en su
propio comentario: *"los toggles escriben SOLO chips de servicio… `profesional`
es DERIVADO (≥1 chip) y no se escribe."* La Hoja del **miembro** hace lo
contrario. Un archivo, dos caminos, dos leyes.

> ## **EL FLIP §6.2 DE S76 NO ALCANZÓ A DOS LECTORES CLÍNICOS.**

`_user_clinica_consultor_del_caso` y `_user_clinica_tratante_del_caso` gatean,
las dos, con `AND er.rol IN ('dueño','profesional')` — **la fila, no el chip.**
No están entre los seis sitios que S76 flipeó (`user_acceso_clinico_a_mascota`,
`user_puede_escribir_clinico` y los 4 DEFINER de D-490), y el censo A4a que
autorizó el flip no podía verlos.

**El porqué es la parte que hay que registrar, porque es una lección y no un
descuido: no los vio porque NO LLAMAN AL HELPER.** Eso es literalmente **D-494**
— *"los dos helpers de caso re-implementan el chequeo de rol por join porque
reciben el usuario por parámetro"*. **Una deuda archivada como cuestión de
estilo (puerta única) resultó ser la razón por la que un flip de seguridad quedó
incompleto.** Es **L-167 un piso más arriba**: el censo buscó a los que llaman al
helper, y el sitio que no lo llama se quedó atrás. D-494 deja de ser 🟠 de
prolijidad.

**La consecuencia operativa, con su radio MEDIDO (L8):** no son "dos lectores".
Son **6 policies + 2 RPC `SECURITY DEFINER`**, sobre `caso_clinico` y
`caso_clinico_consultor`, cubriendo **SELECT · INSERT · UPDATE** — leer el caso,
editarlo, leer sus consultores, **sumar otra clínica al caso**, cerrar esa
consultoría, colgarle un evento (`asociar_a_caso`) y anclarle la nota
(`sedimentar_nota_clinica`). El titular enciende un toggle y esa persona —sin un
solo chip— entra a todo eso. **Es la ley madre al revés**, viva y alcanzable
desde un control que existe hoy en la app. Radio de filas: `profesional` × **0**
en toda la DB (A0 punto 6).

> ## **Y LA ASIMETRÍA CORTA PARA LOS DOS LADOS — el segundo es peor.**
>
> `sedimentar_nota_clinica` **corre los dos gates, uno arriba del otro**:
> **L55** `empleado_tiene_capacidad_clinica` (el chip, S76) · **L73**
> `_user_clinica_tratante_del_caso` (la fila, sin flipear). **El escritor
> clínico madre no quedó afuera del flip: quedó con un pie en cada eje.**
>
> - **Falso positivo:** una fila `profesional` concedida a mano pasa L73 sin
>   ningún chip.
> - **FALSO NEGATIVO —y es el que rompe a un usuario real—:** el vet con chip
>   médico verdadero **pasa L55 y rebota en L73**, porque no tiene fila
>   `dueño`/`profesional`.
>
> **ENMIENDA v1.6 (L9) — EL ALCANCE ERA MÁS ANGOSTO DE LO QUE LA v1.5
> AFIRMÓ, Y CAE EN PEOR LUGAR.** La v1.5 dijo que el rebote alcanzaba a *"toda
> nota de todo empleado no titular con chips"*. **Falso: L73 está guardada.**
> `v_caso_id` no es parámetro — se deriva de `p_caso->>'modo'`, y L73 vive
> **solo dentro del brazo `'existente'`**:
>
> | modo | qué pasa | ¿rebota? |
> |---|---|---|
> | `null` / ausente | la nota se sedimenta **sin caso** | **no** |
> | `'nuevo'` | llama `abrir_caso_clinico`, gateada por `empleado_tiene_capacidad_clinica` — **el eje chip, ya flipeado** | **no** |
> | `'existente'` | L73 exige ser tratante por la FILA DE ROL | **sí** |
>
> **Entonces el vet empleado puede escribir una nota suelta y puede ABRIR un
> caso nuevo; lo único que no puede es SUMAR SU NOTA A UN CASO QUE YA EXISTE.**
> Ídem `asociar_a_caso`, que es todo brazo `'existente'`.
>
> **La deuda no se cae: se afila, y queda apuntando al corazón del producto.**
> Lo que se rompe no es la primera consulta — es **la CONTINUIDAD del caso**,
> que es exactamente lo que EL NORTE pone como diferencial en su propia cita:
> ***"El vet no atendió una consulta — adoptó un caso."*** Un caso que solo
> puede seguir quien tiene fila de cargo es un caso que el vet empleado abre y
> no puede acompañar.
>
> **Por eso la cura no es solo cerrar un agujero: es DESTRABAR AL VET.** Se
> verifica en las dos direcciones, como manda la casa.

**Y la cura tiene vehículo, que es la otra mitad de la ironía: es la de D-494.**
Los helpers no pueden llamar a `empleado_tiene_capacidad_clinica` porque reciben
`p_user_id` por argumento y la función lee `auth.uid()`. **La sobrecarga con
`user_id` que D-494 propone como prolijidad es exactamente lo que habilita el
flip.** Una migración, dos deudas.

**Cruce con D-504, verificado: son OTRAS, cero solape.** D-504 vive en
`evento_caso_clinico_*` con policies `{public}` que citan
`user_acceso_clinico_a_mascota`; esto vive en `caso_clinico` /
`caso_clinico_consultor`, cuyas **21 policies son `{authenticated}`** y citan los
helpers. Distinto síntoma, distintas tablas, distinto helper.

### 6.2ter. EL TOGGLE `recepcion` — verde en su lectura, y peor en su escritura

**Nadie lee esa fila como identidad. La letra firmada §2 se cumple.** Censo con
literal: **un solo lector vivo**, `obtener_contacto_reserva_cita` — la
ventanilla, el caso legítimo. `aceptar_invitacion_pendiente_login` la **escribe**
(A2bis), no la lee. Las cuatro funciones clínicas la nombran **solo en un
comentario**: la palabra está en la prosa, el predicado no la consulta. En TS,
los dos únicos hits son el interruptor pintándose a sí mismo.

**Pero el toggle no solo sobra: puede romper.** `quitarRolEmpleado` hace `DELETE`
sobre `empleado_roles`, así que **apagarlo le borra a esa persona el piso que la
migración A2bis existe para garantizarle** — y `obtener_contacto_reserva_cita`
gatea por presencia. El titular apaga un switch y la recepcionista deja de poder
ver el teléfono de quien reservó. **Un control que puede deshacer una migración
de piso no es un control viejo: es un control peligroso.**

### 6.3 Lo que la letra le exige a esa Hoja

- **Ley 23, ya cumplida y que no se rompa:** la pantalla entera gatea por
  `esDueno` y el no-dueño recibe su porqué una vez, sin candados (§3).
- **EL CHIP NO PROMETE DISPONIBILIDAD** (§4bis). El titular da el chip de vet,
  no carga horarios, y esa persona **no aparece en ninguna reserva** sin que
  nada se lo diga. Un lector que degrada a lista vacía **esconde** el hueco. La
  forma (aviso en la celda · estado vacío · celda navegable a la jornada) la
  decide M1 sobre la lámina; **que la pantalla lo diga es letra.**
- **QUITAR EL ÚLTIMO CHIP MÉDICO ES UN ACTO CLÍNICO** (§4). Le saca a esa
  persona el expediente. La superficie lo dice antes, no después.
- **L-139:** el conteo de citas de §11 sale de un lector real o no se muestra.
  **Jamás un número plausible.**
- **La baja ya se dice con su verbo y con dos toques.** No se rehace; se
  hereda. Lo que S77 le agrega es lo que §11 decida sobre las citas.
- **LA VOZ DE LA BAJA NO HEREDA EL AVISO DE RENOVACIÓN.** El aviso que hoy
  recibe la familia cuando un plan no se renueva dice que *cambió la agenda del
  paseador* (§5bis). En el caso de la baja eso **nombra una causa que no es la
  causa**, y llega semanas tarde. **No se resuelve reciclando un string escrito
  para otro motivo.**
- **El auto-lockout del titular NO es problema de esta pantalla** (L6): la Hoja
  del titular entra por la rama `roles.includes('dueño')`, que solo pinta una
  Insignia — **ni interruptores ni botón destructivo**. El hueco es de MOTOR y
  va a §10 con su número propuesto.

---

## 7. EL PEDIDO DE MOTOR — qué falta construir, sin maquillaje

1. **El trigger de herencia de chips** (`LETRA_RECEPCION_S76` §6.1, decisión de
   mesa firmada en S76). **HOY NO TIENE DUEÑO.** Sin él, la clínica agrega una
   oferta nueva y sus chips viejos no la cubren ⇒ las 8 lectoras excluyentes
   dejan esa oferta **sin profesionales, en silencio**. Converge con esta letra:
   la misma pantalla que da chips es la que hace visible el hueco.
2. **La resolución de las citas futuras en la baja** (§5 + §11).
3. **EL WRAPPER DE QUITAR CHIP — no existe** (L3, grep en cero). La policy
   `empleado_servicios_dueño_elimina` autoriza el DELETE desde siempre y
   `packages/api` **nunca lo expuso**: el único consumidor de la tabla es el
   INSERT batch de la invitación. **No es motor nuevo — es la puerta única
   cumpliendo su regla** (los apps jamás llaman `supabase.from()` directo). Su
   hermano de dar-chip-a-quien-ya-está probablemente sea el mismo
   `asignarServiciosEmpleado` ya construido; **eso se verifica, no se supone**
   (§10).
4. **Nada más de gobierno.** Dar de baja ya tiene motor Y superficie
   (verificado 4/4 en la enmienda A2 v2 de D-526, brazo (b): *"el TITULAR SIGUE
   escribiendo `activo` — desvincular no se rompió"*, y `desvincularEmpleado`
   vivo en la app desde S74).

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

**CERRADAS en v1.1, con su literal:**

- ~~`prestador_atencion_log` vs P-OP-3~~ → **§1.** Los dos triggers existen,
  habilitados, sin rama de escape. Rama fea descartada; el DELETE ya rebota hoy
  con voz opaca. *(Lectura de definiciones — la prueba empírica NO se corrió:
  mutaría datos vivos y exige veda 76(g) + OK del founder. Precedente del por
  qué: el incidente S75-A.)*
- ~~¿las 8 lectoras exigen `pe.activo`?~~ → **§4bis.** 8 de 8, en el JOIN. La
  baja da de baja. **Esta letra no necesita cura adentro.**
- ~~¿qué hacen los generadores de citas futuras?~~ → **§5bis.** Eligen por
  fecha, abortan con código tipado, y la renovación por cron deja **triple
  rastro con notificación al dueño**. **El segundo objeto no necesita
  política.**
- ~~¿existe la superficie de desvincular?~~ → **§6.** Existe, hace `activo=false`
  y ya trae su porqué en el JSDoc. **S77 construye UNA superficie: la Hoja del
  miembro recompuesta.**
- ~~confirmación del candado anti-lockout~~ → **§6.3.** Los 5 titulares tienen
  fila con `rol='dueño'` y `activo=true` (3 de 5 con franjas propias: 7 · 6 ·
  12). **La pantalla no ofrece el auto-lockout**; el hueco es de motor.

- ~~¿qué escriben los dos `Interruptor` de la Hoja?~~ → **§6.2bis / §6.2ter.**
  `profesional` escribe **fila propia** (motor y letra firmada divergen);
  `recepcion` tiene **un solo lector legítimo** pero su toggle puede **borrar el
  piso de A2bis**.

**ABIERTAS:**

1. ✅ **DEPOSITADA COMO D-532 🔴** (número verificado libre antes de escribir;
   la v1.5 la proponía como "D-535", que habría abierto tres huecos de
   numeración — corregido). El flip §6.2 incompleto en los dos helpers de caso,
   con **D-494 enmendada** como su vehículo. **Sus dos lecturas, CERRADAS por
   L9:**
   - **L73 SÍ está guardada** (§6.2bis, enmienda v1.6): el rebote alcanza solo
     al brazo `'existente'` — la continuidad del caso, no la primera consulta.
   - **Los helpers NO tienen brazo de titularidad.** Tienen exactamente dos:
     `cco.owner_profile_id = p_user_id` (owner de la **cuenta comercial**) y el
     de empleado con fila de rol. Sin `is_admin()`, sin familia, sin
     `prestadores.user_id`.
   - **⇒ D-515 QUEDA LIBERADA, y el freno de orden se levanta**: los 5
     titulares pasan **5/5 por el brazo A**, así que quitarles la fila `dueño`
     no los saca de estos helpers. **Es deuda mínima, no mina.**
2. ⚠️ **LA COINCIDENCIA `prestadores.user_id` = `cuentas_comerciales.owner_profile_id`:
   ES INVARIANTE DEL CAMINO FELIZ, SIN CANDADO** (veredicto L10 — **corrige a la
   v1.6, que la llamó "apoyada en N=5"**). No es suerte: **el alta la fuerza por
   construcción.** `crear_prestador_inicial` (única puerta de INSERT) escribe
   `user_id := auth.uid()` y antes exige
   `_validar_ownership_cuenta_comercial`, que rebota si el owner de la cuenta no
   es ese mismo `auth.uid()`. Los 5 coinciden **por construcción**.
   **Pero la garantía es de PROCEDIMIENTO, y tiene dos fugas medidas:**
   - **El INSERT directo por PostgREST no la exige.** Las policies INSERT de
     `prestadores` tienen `with_check = (user_id = auth.uid())` y **no dicen
     nada del `cuenta_comercial_id`**: un `authenticated` puede colgarse un
     prestador de la cuenta comercial de otra persona sin pasar por el RPC.
     **Y son DOS policies duplicadas** (`prestador_insert_self` ·
     `prestadores_insert`) — se evalúan en OR, así que **curar una sola es un
     verde falso**. Precedente exacto: el cinturón de D-495.
   - **El lado de la cuenta no está congelado.** `admin_all_cuentas_comerciales`
     puede reasignar `owner_profile_id` libremente, y
     `_prestadores_protege_columnas` deja pasar a admin y a todo DEFINER: **el
     cambio de owner rompe la coincidencia sin que nada rebote.**
     **Lectura de mesa: eso no es un agujero, es la SUCESIÓN DEL TITULAR
     (D-510) ocurriendo sin su letra.** Cambiar el owner de una cuenta *es*
     traspasar el negocio. Hasta que D-510 tenga letra, lo honesto es que
     **rebote**, no que pase callado.
   - ~~"o que `cuenta_comercial_id` sea NULL"~~ → **imposible**: la columna es
     `NOT NULL` (L10.3). Mitad de la salvedad de L9, descartada por el literal.
   **El porqué parece estructural y no lo es, en una línea de L10:** existen
   `uq_prestadores_user_id` (un humano ≤ 1 prestador) y `uq_cuentas_owner_profile`
   (un humano ≤ 1 cuenta), **y dos 1:1 paralelos no componen un 1:1 cruzado.**
   **Consumidores que descansan encima:** el brazo A de los dos helpers de
   D-532 · un pedazo de la premisa de D-515 · el swap del `countryCode` de
   D-517 (A14, la misma pareja de tablas con la misma evidencia). **Deuda —
   número al depositar, con su literal.**
2. **¿`asignarServiciosEmpleado` sirve para quien ya está adentro**, o su firma
   asume el momento de la invitación? (§7.3). Lectura de una función.
3. **EL AUTO-LOCKOUT DEL TITULAR, POR MOTOR** (§6.3). `desvincularEmpleado` no
   discrimina a quién apaga y **pasa la policy de titularidad sobre la propia
   fila**: nadie puede hacerlo desde la pantalla, cualquiera puede hacerlo
   llamando al wrapper. Familia de D-526; cura barata: **una rama más en el
   trigger que D-526 ya instaló**. **Deuda propuesta — número al depositar.** *(Límite honesto:
   nadie midió si esos negocios tienen otros empleados con franjas, así que "el
   negocio queda sin disponibilidad" es consecuencia probable, no medida.)*
4. **`esDueno` (fila de rol) vs las policies de escritura (titularidad)** —
   dos ejes que hoy coinciden y que **D-515 desacopla** (§3). Registro para la
   tanda de D-515, no trabajo de esta letra.
5. **`suscripciones_servicio.empleado_id` — columna muerta que parece viva**
   (§5bis). FK a `prestador_empleados` con `ON DELETE SET NULL`, 0 de 1 filas
   poblada, **ningún generador la lee ni la escribe.** Trampa servida para la
   próxima mesa: el nombre promete *"el paseador del plan"* y el motor no lo
   cumple. Se declara para desarmarla (L-166, nota de método). **Deuda propuesta —
   número al depositar, con su literal.**
6. **La fecha de revocación del chip** (§2). Declarada, no curada.
7. **Los chips AL INVITAR** siguen sin verificar en su motor —
   `LETRA_RECEPCION_S76` §13 punto 1. L3 probó que **la superficie existe**; que
   el `CHECK` y el token la acompañen **sigue sin leerse**. La mesa no afirma
   que esté APTO.
8. **Las 3 filas legacy desactivadas: ¿personas reales o seed?** Sigue abierta
   desde S76.
9. **El eje legacy `pe.rol = 'dueño'`** aparece en las ocho con forma idéntica
   (§4bis). Registro para D-486.

### 10bis. LECCIÓN CANDIDATA — nacida del proceso de esta letra

**PROPUESTA, sin firma.** Esta letra se equivocó DOS VECES de la misma forma, y
las dos las corrigió la fuente, no la mesa:

- **v1.5** afirmó en su cuerpo que el rebote de L73 alcanzaba *"toda nota de
  todo empleado no titular con chips"* — **mientras su propia §10 listaba
  "¿L73 está guardada?" como NO LEÍDA.** L9 la desmintió: solo el brazo
  `'existente'`.
- **v1.6** llamó *"apoyada en N=5"* a la coincidencia prestador↔cuenta —
  **mientras pedía la lectura que iba a medirla.** L10 la desmintió: está
  forzada por construcción, con dos fugas nombradas.

> **L-168 (candidata): UNA LETRA NO AFIRMA EN SU CUERPO LO QUE ELLA MISMA LISTA
> COMO NO LEÍDO. Mientras la lectura no vuelve, el cuerpo lleva la versión
> ANGOSTA — la alarmante vive en el pedido de lectura, jamás en la letra.**

Es **L-158 aplicada a la mesa que escribe** (*una fila de hipótesis nombra el
TRABAJO, jamás el componente como hecho*) y hermana de **L-166**: las dos veces
lo que falló fue una afirmación de nivel resumen que la fuente no sostenía —
**esta vez producida por la propia mesa, en el documento que la lista como
pendiente dos secciones más abajo.** El daño fue cero porque las lecturas
volvieron rápido; con la letra ya firmada, no lo habría sido.

**LA NUMERACIÓN NO SE PRE-ASIGNA.** El canon exige numeración corrida SIN
huecos: cada deuda toma su número **al depositar, con su propio literal y su
`grep` de verificación en cero** — reservar tres números por adelantado abre
tres agujeros. Depositado hasta hoy: **D-532** (el flip incompleto). El bucket
`avatars`, la columna muerta, el auto-lockout y la viga N=5 toman el suyo cuando
lleguen con su texto.

---

## 11. LA ÚNICA PREGUNTA PARA EL FOUNDER

**Cuando das de baja a un profesional que tiene citas agendadas, ¿qué pasa con
esas citas?**

**Es UNA pregunta, no dos.** La v1.1 temía que los planes pagados por adelantado
necesitaran su propia política; la lectura 5 probó que **el motor ya los resuelve
con voz** (§5bis). Lo que queda es un solo objeto: **las citas que ya existen.**

Hoy el motor responde solo, y responde mal: quedan pegadas a él y **se vuelven
invisibles para todos menos para vos** (§5).

**Y el caso del plan es el que le pone cuerpo a la pregunta:** una familia con
un plan de paseos en curso tiene citas los próximos catorce días. Si el paseador
se va, esas catorce citas siguen existiendo, **el negocio no las ve**, y el
único aviso que la familia va a recibir llega al cierre del período diciéndole
que su plan no se renovó. **Alguien va a estar esperando en la puerta.**

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

- **v1.7 (S77, 24 Jul 2026) — el veredicto de la viga, y la mesa se corrige por
  SEGUNDA vez en la misma dirección.** Sobre la lectura **L10**. **§10.2
  REESCRITA:** la coincidencia prestador↔cuenta **no es "N=5 por suerte" —
  la fuerza el alta por construcción** (`crear_prestador_inicial` escribe
  `user_id := auth.uid()` y `_validar_ownership_cuenta_comercial` exige que el
  owner sea ese mismo uid). **Es invariante del camino feliz SIN CANDADO**, con
  dos fugas medidas: (a) las policies INSERT de `prestadores` solo exigen
  `user_id = auth.uid()` y **no dicen nada del `cuenta_comercial_id`** — y son
  **DOS duplicadas**, evaluadas en OR, así que curar una sola sería verde falso
  (precedente D-495); (b) un admin puede reasignar `owner_profile_id` y nada
  rebota — **y eso no es agujero, es la SUCESIÓN DEL TITULAR (D-510) ocurriendo
  sin su letra**. La mitad NULL de la salvedad de L9 **queda descartada**:
  `cuenta_comercial_id` es `NOT NULL`. **El porqué parece estructural, de L10:**
  hay dos UNIQUE paralelos (`uq_prestadores_user_id`,
  `uq_cuentas_owner_profile`) y **dos 1:1 paralelos no componen un 1:1
  cruzado.** **§10bis (nace): L-168 candidata** — *una letra no afirma en su
  cuerpo lo que ella misma lista como no leído*; nace de los dos errores de
  esta misma letra (v1.5 sobre L73, v1.6 sobre la viga), los dos corregidos por
  la fuente. Fuente: reporte S77-A (`d10742e` letra v1.6 · lectura L10).
- **v1.6 (S77, 24 Jul 2026) — la mesa se corrige a sí misma, y D-515 queda
  liberada bajo condición.** Sobre la lectura **L9**. **§6.2bis ENMENDADA:** la
  v1.5 afirmó que el rebote de L73 alcanzaba a *"toda nota de todo empleado no
  titular con chips"* — **falso, y era afirmación de mesa sin su literal.** L73
  vive **solo dentro del brazo `'existente'`** de un `p_caso->>'modo'` de tres
  valores: la nota suelta pasa, **abrir un caso nuevo pasa** (va por
  `abrir_caso_clinico`, ya flipeada al chip), y **lo único que rebota es sumar
  la nota a un caso que YA existe** (ídem `asociar_a_caso`). **La deuda no se
  cae: se afila y apunta al corazón del producto** — lo roto es la CONTINUIDAD
  del caso, la frase de EL NORTE (*"el vet no atendió una consulta — adoptó un
  caso"*). **§10.1:** D-532 depositada (y registrado que la v1.5 la proponía
  como "D-535", lo que habría abierto tres huecos de numeración); sus dos
  lecturas cerradas; **los helpers no tienen brazo de titularidad** —solo owner
  de cuenta comercial y empleado-con-fila— y **los 5 titulares pasan 5/5 por el
  brazo A**, así que **D-515 es mínima, no mina, y su freno de orden se
  levanta.** **§10.2 (nace):** la salvedad de L9 elevada a hallazgo propio —
  lo que sostiene a los titulares es que `prestadores.user_id` y
  `cuentas_comerciales.owner_profile_id` **hoy valen lo mismo en 5/5 filas**,
  dos columnas distintas tratadas como una; **es la SEGUNDA decisión apoyada en
  esa evidencia** (la primera: A14 de S75, el swap del `countryCode` sobre
  `country_code` 5/5). **§10 cierre:** la numeración deja de pre-asignarse — cada
  deuda toma su número al depositar, con su `grep` en cero. Fuente: reporte
  S77-A (`65cdc87` letra v1.5 · `c5e0aee` D-532 + enmienda D-494 · lectura L9).
- **v1.5 (S77, 24 Jul 2026) — el censo del flip incompleto: de "dos lectores" a
  un radio medido, y la cura cambia de signo.** Sobre la lectura **L8**.
  **§6.2bis:** el radio deja de estimarse — **6 policies + 2 RPC `SECURITY
  DEFINER`** sobre `caso_clinico` y `caso_clinico_consultor`, cubriendo
  **SELECT · INSERT · UPDATE** (leer y editar el caso, leer/sumar/cerrar
  consultores, `asociar_a_caso`, `sedimentar_nota_clinica`). **El hallazgo que
  da vuelta la clasificación:** `sedimentar_nota_clinica` corre **los dos ejes
  apilados** (L55 chip · L73 fila), así que la asimetría corta para los dos
  lados y **el lado que rompe a un usuario real es el falso NEGATIVO** — el vet
  con chip médico verdadero pasa L55 y **rebota en L73** por no tener fila
  `dueño`/`profesional`, y con `profesional` × 0 filas eso alcanza a **todo
  empleado no titular con chips**. **La cura no es solo cerrar un agujero: es
  destrabar al vet**, y se verifica en las dos direcciones como manda la casa.
  **Su vehículo es D-494** (la sobrecarga con `user_id` que los helpers
  necesitan para poder llamar a `empleado_tiene_capacidad_clinica`): una
  migración, dos deudas. **Cruce con D-504 verificado: cero solape** (otras
  tablas, otro helper, `{authenticated}` vs `{public}`). **§10.1:** D-535 pasa a
  🔴 **y entra ANTES que la edición de chips**, con dos lecturas que la cura
  necesita — el guard de `v_caso_id` en L73, y si los helpers tienen brazo de
  titularidad; **de la segunda depende que D-515 sea deuda mínima o mina**
  (dropear la fila `dueño` redundante dejaría a los 5 titulares sin escritura de
  caso si esos helpers no tienen otro brazo). **D-515 no dispara hasta que eso
  se lea.** Fuente: reporte S77-A (reemplazo `e65239c` + lectura L8).
- **v1.4 (S77, 24 Jul 2026) — la lectura 7 encontró un agujero que no es de esta
  letra: es de S76.** **§6.2bis (nace):** el toggle `profesional` **escribe fila
  propia** en `empleado_roles` sin tocar chips, contra la letra firmada que la
  declara DERIVADA — y **la misma pantalla se contradice**: la Hoja de invitar
  escribe solo chips y lo dice en su comentario, la Hoja del miembro escribe la
  fila. **La consecuencia: el flip §6.2 de S76 NO alcanzó a
  `_user_clinica_consultor_del_caso` ni a `_user_clinica_tratante_del_caso`**,
  que siguen gateando por `er.rol IN ('dueño','profesional')` — la ley madre
  (*el acceso clínico viene del CHIP, jamás del cargo*) con dos excepciones
  vivas, alcanzables desde un control que existe hoy en la app. **Y el porqué
  queda registrado como lección: no las vio el censo A4a porque NO LLAMAN AL
  HELPER — que es literalmente D-494**, archivada como deuda de prolijidad
  (puerta única) y que resulta ser la causa de un flip de seguridad incompleto;
  **L-167 un piso más arriba.** **§6.2ter (nace):** el toggle `recepcion` pasa su
  censo (un solo lector vivo, la ventanilla; las cuatro clínicas la nombran solo
  en comentarios) **pero puede DELETE-ar el piso que A2bis concede** — un control
  capaz de deshacer una migración de piso. **§10:** **D-535** propuesta (el flip
  incompleto) con **D-494 enmendada**, y la **lectura 8** (censo de consumidores
  de los dos helpers) declarada como precondición de la cura y **explícitamente
  fuera de la espera de esta letra**. Fuente: reporte S77-A (reemplazo `4e76a06`
  + lectura L7); D-494 verificada contra su literal en `DEUDAS_CANONICAS:2185`.
- **v1.3 (S77, 24 Jul 2026) — el freno se levanta: §6 se escribe, y el trabajo
  no estaba donde el brief lo buscaba.** Sobre las lecturas **L3** (superficie) y
  **L6** (candado). **§1:** la casa YA había decidido la baja sobre el borrado —
  `desvincularEmpleado` hace `activo=false` desde S74 **con su porqué en el
  JSDoc citando §14.1**; esta letra no inventa una prohibición, le da rango de
  ley a una decisión construida que vivía en un comentario. **§2:** la asimetría
  confirmada por los dos lados — el vínculo tiene motor Y superficie; el chip
  tiene **motor con puerta abierta y superficie sin puerta** (grep en cero).
  **§3:** Ley 23 ya cumplida (`esDueno` envuelve la pantalla, el no-dueño recibe
  su porqué sin candados) **más el hallazgo de los dos ejes**: la pantalla gatea
  por FILA DE ROL y el motor por TITULARIDAD — coinciden hoy y **D-515 los
  desacopla**. **§6 REESCRITA:** S77 construye **UNA** superficie; el censo de
  las tres operaciones; y **la colisión con la letra firmada** — la Hoja monta
  `Interruptor` de `profesional` y `recepcion`, y `LETRA_RECEPCION_S76`
  (posterior) dice que recepción **no es un toggle** (membresía, jamás identidad,
  concedida a todos por A2bis) y que `profesional` **no se elige** (derivado de
  chips). El trabajo es **recomponer la Hoja**, no agregarle un control. **§7:**
  falta el **wrapper de quitar chip** — la policy autoriza desde siempre y
  `packages/api` nunca lo expuso. **§10:** tres cerradas, nueve abiertas, con la
  **lectura 7** (qué escriben esos dos interruptores) como precondición de
  cualquier boceto, y **D-534** propuesta (el auto-lockout del titular por
  motor: la pantalla no lo ofrece, el wrapper sí lo permite — familia de D-526,
  cura de una rama en su propio trigger). Fuente: reporte S77-A (reemplazo
  `4512e3b` + lecturas L3 y L6, territorio de B leído y declarado sin escritura).
- **v1.2 (S77, 24 Jul 2026) — el segundo objeto se cierra, y la pregunta vuelve
  a ser una sola.** **§5bis reescrita** sobre la lectura L5: los generadores **no
  guardan persona** (eligen por fecha; con N>1, dos fechas del mismo plan pueden
  caer en gente distinta), **abortan con código tipado** en vez de saltear, y la
  renovación por cron deja **triple rastro con notificación in-app al dueño** —
  **la baja no rompe planes en silencio y esta letra no necesita política para
  ellos**. Lo que vuelve al primer objeto: las citas del período EN CURSO ya
  están generadas y siguen apuntando a la persona, y el aviso de no-renovación
  llega al cierre del período, tarde y por el motivo equivocado. **§6 gana dos
  candados:** la baja **no se ofrece sobre la propia fila del titular** (las
  ocho llegan por `prestador_empleados`, no por `prestadores.user_id` — un
  titular que se dé de baja se borra de la disponibilidad de su propio negocio y
  el trigger de D-526 no lo frena, porque está autorizado), y **la voz de la
  baja no recicla el string de renovación**. **§10 gana la trampa declarada:**
  `suscripciones_servicio.empleado_id` tiene FK y nadie la lee — parece *"el
  paseador del plan"* y no lo es (deuda propuesta **D-533**). **§11 colapsa a
  UNA pregunta**, con el caso del plan como su cuerpo. Fuente: reporte S77-A
  (reemplazo `97fae6b` + lectura L5). **Sigue abierta la lectura 3.**
- **v1.1 (S77, 24 Jul 2026) — las dos lecturas que la v1.0 abrió, cerradas con
  literal.** **§1:** el hallazgo candidato de `prestador_atencion_log` se
  resuelve por la rama buena — los dos triggers append-only existen y están
  habilitados sin rama de escape, así que **ningún log inmutable se está
  mutando**, y **el borrado duro de un empleado con historial ya rebota hoy**
  con un mensaje opaco al doble; la letra deja de inventar una prohibición y
  pasa a ponerle nombre y voz honesta a un accidente que ya opera. **§1
  (nuevo):** la reversibilidad de la baja, medida — chips, roles y horarios son
  exactamente las tres CASCADE que el DELETE destruye y la baja preserva.
  **§4bis (nace):** las 8 lectoras excluyentes exigen `pe.activo` **en el JOIN,
  8 de 8** — la baja da de baja y esta letra no necesita cura adentro; pero la
  puerta de entrada de las ocho es `prestador_horarios`, así que **dar un chip
  no vuelve a nadie reservable** (§6 gana su letra sobre eso). **§5bis (nace):**
  `_generar_citas_plan` y `_generar_citas_programa` están entre las ocho — la
  baja tiene un SEGUNDO objeto (el flujo que pare citas futuras), y §11 se
  parte en dos con la mitad del plan **explícitamente sin responder hasta la
  lectura 5**. Fuente: reporte S77-A (depósito `7aaba7c` + lecturas L4 y
  P-OP-3). **Sigue abierta la lectura 3** (la superficie).
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
