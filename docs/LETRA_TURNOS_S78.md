# LETRA DE TURNOS — la jornada de cada persona del negocio

> **Estado:** PROPUESTA a la firma del founder (S78, 26 Jul 2026).
> Las partes marcadas **✅ FIRMADA** llevan su palabra literal y no se reabren.
>
> **Qué enmienda:** `MODELO_VETERINARIA` §2 (la viñeta de horarios y el
> *"el dueño no lo ve"*) · `POLITICAS` P17 v1.1 (superficie de Cuenta) ·
> convive con `LETRA_RECEPCION_S76` §4 (la tabla de verbos) y con
> `LETRA_EDICION_VINCULO_S77` §11 (la baja del vínculo) — **sin tocarlas**.
>
> **PISO DE LITERAL — de dónde sale cada afirmación de motor.** Todas las
> de este documento salen del relevamiento **S78-A0** y de las mediciones
> de la propia sesión, corridas contra la DB viva con
> `pg_get_functiondef`, `pg_policies`, `pg_constraint` e
> `information_schema`, más grep del árbol. **Ninguna sale de memoria**
> (L-141, que rige también para la mesa). Lo no relevado va marcado como
> tal en §9.
>
> **Por qué esta letra es CORTA:** porque cuatro mediciones de S78 le
> sacaron el trabajo de encima. La capacidad multi-persona y el estampado
> de la persona en la cita **ya existían desde V0**. Lo que faltaba era
> una puerta, y se abrió en A2.

---

## 1. LA TESIS

**El negocio define TURNOS; cada persona tiene su JORNADA; la familia saca
una CITA.**

Un turno es una **plantilla**: "mañana", "tarde", "sábado corto".
Asignárselo a alguien **le escribe sus franjas**. Las franjas siguen
siendo la única verdad del motor — el turno no es una capa nueva de
disponibilidad, es la forma humana de escribir las de siempre.

**Contraste obligatorio contra `MODELO_PRODUCTO` (mandato del canon, y no
como formalidad):** esta letra sirve a *amor al oficio* (§2, "el filtro y
el tono"). Un turno no es una herramienta de control de personal —
e-PetPlace no mide fichadas ni productividad. Es la manera de que **una
clínica de tres personas pueda decir su horario sin que cada profesional
tenga que cargarlo a mano**, y de que **el que ama su oficio no
desaparezca de la disponibilidad por un trámite**. Si esta letra derivara
en reportes de cumplimiento o en ranking de ocupación, está mal leída.

---

## 2. VOCABULARIO CERRADO ✅ FIRMADA

| Palabra | Qué nombra | Quién la ve |
|---|---|---|
| **Cita** | el encuentro pactado con la familia | familia y negocio |
| **Turno** | la plantilla de horario del negocio | solo el negocio |
| **Jornada** | las franjas que UNA persona tiene | el negocio |

**"Turno" JAMÁS se usa con la familia** — para la familia, turno ya
significa cita. Es la misma palabra con dos sentidos y los dos vivos; la
casa se queda con uno por lado.

**La regla dura del founder, intacta: con UN SOLO turno nadie ve la
palabra "turno".** El negocio unipersonal —que hoy son 4 de 5— no aprende
vocabulario nuevo: hereda el horario del negocio y nunca se le pregunta
nada. **El vocabulario nace con la segunda plantilla.**

*Condición barata declarada:* antes de que esta letra llegue a superficie,
grep de `turno` en los strings de cara a la familia; si aparece, migra a
`cita` en el mismo lote.

---

## 3. LA DELEGACIÓN — encendida, con el titular sin perder la lapicera

**`MODELO_VETERINARIA` §2 dice hoy:** *"Horarios: los administra el
NEGOCIO (su staff, su operación), con **delegación opcional** a cada
persona. **Default v1: administra el negocio.**"*

**Esta letra enciende la delegación.** No es decisión nueva: es ejercer la
opción que §2 ya dejó escrita.

- **Cada persona puede escribir SU jornada.**
- **El titular puede escribir la de CUALQUIERA de su negocio, siempre.**

**El motor ya lo permitía en las dos direcciones, y eso se leyó literal
antes de escribir esta línea** — las dos policies de `prestador_horarios`
son `ALL` con `USING` **idéntico** a `WITH CHECK`:

- `ph_empleado_own` → `empleado_id IN (mis empleados activos)`
- `prestador_horarios_own` → `prestador_id IN (mis prestadores) OR is_admin()`

**El argumento del founder queda cubierto:** si la única fuente fuera el
profesional, el día que se olvida de cargar su jornada desaparece de las
reservas y nadie se entera. Con el titular escribiendo también, eso no
puede pasar.

---

## 4. LA FIRMA DEL FOUNDER — cambiar de turno con citas agendadas ✅ FIRMADA

> **Las citas ya pactadas SE CONSERVAN con su persona. El turno rige hacia
> adelante; jamás toca una cita existente.**

Tres consecuencias, y la tercera es la que le saca trabajo a la sesión.

### 4.1 §11 NO se reusa acá — parecerse no es ser

`_cita_despegable` y `contar_citas_despegables` (S77, migración
`20260726120000`) **son la letra de la BAJA**: existen para cuando el
**vínculo muere** y las citas de esa persona tienen que pasar a la
clínica. **El cambio de turno no despega nada.**

Se escribe explícito **para que nadie "aproveche" el predicado que ya
está ahí**: el parecido es de forma (ambos preguntan por citas futuras de
una persona), no de fondo. Reusarlo acá haría que cambiar un horario
empiece a mover citas de dueño — exactamente lo que esta firma prohíbe.

### 4.2 La asignación escribe franjas FUTURAS y no valida contra citas

No hay conflicto posible: **la cita conservada es legal por firma.**

Lo que sí nacía como riesgo era otro — *"la agenda debe poder mostrar una
cita fuera del patrón vigente sin pintarla como error"* (Ley 13: no es
fallo, es historia). **Y la medición dice que ese trabajo no existe:**

- Las **7** funciones de DB que cruzan `evento_cita_servicio` con
  `prestador_horarios` son **TODAS escritoras** (`_generar_citas_plan`,
  `_generar_citas_programa`, `crear_bloqueo_agenda`,
  `reagendar_cita_suelta`, `reagendar_sesion_programa`,
  `reservar_salida_paquete`, `saltar_cita_plan`). **Cero lectoras.**
- En el árbol de wrappers, el único archivo que nombra las dos cosas es
  `equipo.ts`, y su `obtenerJornadaEmpleado` lee **franjas**, no agenda.

⇒ **Ningún lector de agenda asume `cita ⊆ franjas`.** Una cita fuera del
turno vigente se dibuja como cualquier otra, porque se lee de
`evento_cita_servicio` por derecho propio. **No hay que curar nada.**

### 4.3 El conteo "fuera del nuevo horario" es OTRA pregunta

El wrapper de `contar_citas_despegables` **sigue pedido, y su consumidor
es SOLO la baja** (la Hoja del miembro ya lo usa).

El estado de turnos **no lo necesita para bloquear** — por 4.1, no
bloquea nada. Si algún día quiere **informar** *"3 citas quedan fuera del
nuevo horario"*, eso es una pregunta distinta (no *"¿se pueden despegar?"*
sino *"¿cuáles caen fuera de estas franjas?"*) y pide **su propio
lector**. **No se escribe hasta que una superficie lo pida** — decisión
declarada acá para no escribir de más.

---

## 5. EL DESEMPATE, declarado en una línea

Cuando la reserva es "con el negocio", el motor fija persona en el hold
(§2: *cero citas huérfanas*). El orden, hoy explícito:

1. **Continuidad clínica** — si la mascota tiene un caso ACTIVO cuyo
   tratante es esta persona, gana (S78-A5, migración `20260726180000`,
   gateado por `es_medico`).
2. **Menor carga del día** — lo que §2 ya decía.
3. **Mayor antigüedad en el negocio** (`created_at`), y a igualdad, el id.

**El punto 3 era política silenciosa: estaba en el `ORDER BY` y en ningún
documento.** Queda escrito. Es arbitrario, y esa es la virtud —
**determinista es lo que hace un reparto debuggable**; un desempate al
azar haría que el mismo caso se resuelva distinto cada vez y nadie podría
explicarle a un profesional por qué le tocó.

**El empate de continuidad, declarado:** una mascota puede tener varios
casos activos con personas distintas del mismo negocio (Thor hoy tiene
dos). Con empate, cae al punto 2. Degradación honesta: sin saber a qué
caso pertenece la cita, el motor no puede elegir. Se resuelve cuando la
cita **diga su caso al nacer** — que es lo que abre A3.

---

## 6. EL BACKFILL — heredan AL ACEPTAR, no al aplicar

**Decisión propuesta:** la persona recibe la jornada del negocio **cuando
acepta la invitación**, no cuando esta letra se aplica.

**El porqué:** aplicar la letra escribiría franjas a **2 personas activas
que hoy tienen 0** (las dos de Clínica Aurora, medidas), y eso las
volvería **ofertables de golpe, sin que nadie lo decida**. Una de ellas
tiene 6 chips clínicos: quedaría recibiendo reservas de consulta el mismo
día de la migración. **Una migración no concede disponibilidad** — eso es
decisión de negocio, y la toma el titular.

El precedente es de la casa: A2bis de S76 hizo exactamente esto para la
fila `recepcion` — el piso se concede **al entrar**
(`aceptar_invitacion_pendiente_login`), no por backfill.

**Consecuencia declarada, sin maquillaje:** las 2 personas activas de hoy
**no heredan solas**. Su jornada la carga el titular desde la superficie
de B, que es justo el camino que A2 acaba de abrir.

---

## 7. EL SOLAPE ENTRE PERSONAS — ya está firmado, y se cita

Dos personas del mismo negocio **se pisan legalmente en el reloj**: la
ocupación protege el cuerpo, no la agenda.

El motor ya lo trata así, medido: `_agenda_ocupacion(p_empleado_id, …)`
cuenta **por persona**, y las lectoras **UNEN** ventanas (`SELECT
DISTINCT` en `_inicios_disponibles_prestador`, `GROUP BY … max(libre)` en
`obtener_slots_disponibles`, `EXISTS` en
`obtener_paseadores_disponibles`). **Ninguna suma.**

El solape **dentro de una misma persona** sigue gobernado por **D-409**
(firmada S70): MERGE server-side atómico con retorno hablado + `GIST
EXCLUDE` como piso, y retirar los pre-checks del wrapper. **No existe doc
dedicado de horarios: esa deuda ES su letra**, y esta sección la cita en
lugar de duplicarla. D-409 **no se paga en S78**.

---

## 8. LA ENMIENDA A `MODELO_VETERINARIA` §2 — la cita DICE quién atiende

§2 dice hoy, sobre la reserva "con el negocio", que el sistema fija una
persona y **"el dueño no la ve"**.

**Pasa a decirlo.** La cita nombra a quien atiende, en **confirmación** y
en **detalle**.

**El porqué:** ocultarlo era defendible cuando el negocio era de una
persona (no había nada que decir). Con dos, el silencio se vuelve una
mentira por omisión el día que la familia llega y la atiende alguien que
no esperaba. Y contra EL NORTE: *"el vet no atendió una consulta — adoptó
un caso"* no se sostiene si la familia no sabe **quién** es su vet.

**Alcance de la enmienda:** la cita **dice** la persona. **NO** la deja
elegir — la elección visible **queda fuera de S78** (§9), porque la
configuración de *qué expone el negocio* no existe todavía.

Superficie: **cliente**, territorio de A.

---

## 9. LO QUE ESTA LETRA **NO** RESUELVE — declarado, no escondido

1. **La elección de persona por la familia (§2, camino "con la persona").**
   Fuera de S78 **por gobierno, no por costo**: el barrido de
   `information_schema.columns` dio **una sola fila** parecida
   (`prestadores.modo_horarios`, que es `universal|por_servicio` y jamás
   miró `empleado_id`). **La configuración de "qué expone el negocio" NO
   EXISTE** — ni columna, ni catálogo, ni letra. Construir la elección
   visible sin esa regla es una superficie sin gobierno.
   **Disparo: la letra de "qué expone", que nace con el wizard V1 (§17) o
   con el primer negocio que lo pida.**

2. **La plantilla como ENTIDAD.** Esta letra define qué ES un turno y qué
   hace al asignarse. **No decide si se persiste como tabla propia o si es
   un preset de UI que escribe franjas.** Es la decisión que el M1 de B
   marca como bloqueante y **es del founder sobre píxeles** (L-143), no de
   esta prosa.

3. **El candado de `(prestador_id, empleado_id)` en la fuente.** A2 puso
   el guard en el wrapper y **declaró** que la RLS no lo cubre:
   `prestador_horarios_own` gatea por `prestador_id` y **jamás mira
   `empleado_id`**, así que un titular podría estampar en su franja la
   persona de otro negocio, y el lector une por `pe.id` **sin comparar
   `pe.prestador_id`**. **Es MOTOR** (FK compuesta o trigger) y queda
   pendiente con su disparo: **la primera superficie que deje elegir
   persona a mano**.

4. **D-409** (§7) y **el conteo "fuera del nuevo horario"** (§4.3).

---

## 10. LOS NÚMEROS DE HOY, para que la próxima sesión no los suponga

Medidos el 26-jul-2026 contra la DB viva:

- **25 franjas** en total, **las 25 de titulares**. Cero de empleados.
- **5 titulares activos** · **2 empleados activos no titulares** (ambos
  en Clínica Aurora; uno con **6 chips** clínicos y **0 franjas** — el
  caso exacto de D-540) · 5 inactivos legacy.
- **81 citas, 81 con persona, CERO huérfanas** — §2 se cumple desde V0.
- **`modo_horarios`**: 0 filas `por_servicio` en toda la DB. **No es el
  eje de esta letra** y no se toca.
