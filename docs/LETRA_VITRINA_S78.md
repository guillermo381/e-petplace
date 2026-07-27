# LETRA DE LA VITRINA — qué expone el negocio

> **Estado:** PROPUESTA a la firma del founder (S78-A1bis, 26 Jul 2026).
>
> **Qué es:** la regla que faltaba para que reservar *"con la persona"* fuera
> **legal**. `MODELO_VETERINARIA` §2 la nombró en S66 —*"el negocio decide
> qué expone: configura si el dueño reserva 'con el negocio' o 'con la
> persona'"*— y **nunca se escribió**. S78-A0 lo midió: barrido de
> `information_schema.columns` por `expon|visible_como|modo_reserva|
> reserva_con|elige_persona|por_persona|nivel_reserva` → **una sola fila**,
> `prestadores.modo_horarios`, que es `universal|por_servicio` y **jamás
> miró `empleado_id`**. **No existe ni columna, ni catálogo, ni letra.**
>
> **Por qué se escribe AHORA y no antes:** porque hasta S78 no había un
> negocio con dos personas ofertables. `LETRA_TURNOS_S78` §9.1 dejó la
> elección **fuera por gobierno, no por costo** — *"construir la elección
> visible sin esa regla es una superficie sin gobierno"*. Esta letra es esa
> regla.
>
> **Piso de literal:** relevamiento S78-A0 + la medición del chasis de esta
> misma sesión (§5). Ninguna afirmación de motor sale de memoria (L-141).

---

## 1. LA TESIS

**La vitrina la elige el negocio; la persona la elige la familia — cuando el
negocio lo permite.**

Hay dos formas de reservar y **las dos son legítimas**. Una clínica grande
quiere que la familia reserve *"con la clínica"* y resolver internamente
quién atiende. Un consultorio de dos socios quiere que la familia **elija a
su vet**. **El producto no decide por ellos: les da el interruptor.**

**Contraste contra `MODELO_PRODUCTO`, y no como formalidad.** §2, *amor al
oficio*: *"el producto no es para todos los vets… es para los que aman lo
que hacen"*. Un profesional que construyó su clientela **tiene nombre**, y
esconderlo detrás del negocio le quita exactamente lo que lo hace valioso.
Pero forzar la exposición sería igual de malo: una clínica de urgencias
rota turnos y prometer una persona sería mentir. **La configuración ES el
respeto al oficio de cada uno.** Y contra EL NORTE: *"el vet no atendió una
consulta — adoptó un caso"* no se sostiene si la familia nunca supo quién
era su vet.

---

## 2. LA REGLA

| | Reserva **con el negocio** (default) | Reserva **con la persona** |
|---|---|---|
| Qué ve la familia en el CUÁNDO | la **unión** de ventanas libres | **elige persona**, y ve la ventana de esa persona |
| Quién fija la persona | el **sistema**, al confirmar | **la familia** |
| Reasignación interna | **derecho del negocio, sin avisar** | **SE AVISA** (§3) |
| N=1 | **colapsa solo: nadie ve la configuración** | idem |

**DEFAULT: negocio.** Es lo que hoy ya ocurre y funciona — no se cambia el
comportamiento de nadie al aplicar esta letra. **Un negocio existente no
nota nada.**

**N=1 COLAPSA SOLO, y es la misma regla dura del founder que gobierna los
turnos:** con una sola persona ofertable no hay nada que elegir, así que
**la configuración no se ofrece y la familia no ve un selector de uno**
(`LETRA_SELECTOR_ELEGIBILIDAD_S73`: *"la puerta no pregunta lo que ya
sabe"*). Hoy eso son **4 de 5 negocios**.

---

## 3. LO QUE SE ENCIENDE JUNTO — la reasignación deja de ser silenciosa

`MODELO_VETERINARIA` §2 ya lo firmó, **verbatim**:

> *"Reasignación interna = derecho del negocio: hasta que la atención
> empieza, el negocio puede mover la cita a otra persona habilitada, **sin
> notificar al dueño — SALVO que el dueño haya elegido persona
> explícitamente: ahí SÍ se le avisa (eligió a alguien; la verdad firme es
> con ese alguien)**."*

⇒ **Encender la vitrina por persona enciende una obligación de aviso.** No
es una feature aparte: es la mitad que la hace honesta. Si la familia eligió
a alguien y el negocio lo cambia **en silencio**, el producto rompió una
promesa que él mismo ofreció.

**Consecuencia declarada, y es un costo real:** el aviso necesita un canal.
`MODELO_NOTIFICACIONES` existe (v0, S73) y **su motor de disparo no está
construido**. ⇒ **La vitrina por persona no se declara COMPLETA hasta que
ese aviso exista.** Se puede construir el motor y la elección antes —lo que
NO se puede es encender el toggle en un negocio real sin el aviso. **Queda
como precondición de encendido, no de construcción.**

---

## 4. QUÉ SE GUARDA — una columna, y por qué esa

**`prestadores.expone_personas boolean NOT NULL DEFAULT false`.**

- **Vive en `prestadores`, no en la oferta ni en la persona:** es una
  decisión de **vitrina del negocio** (§2 la llama así), y ponerla por
  oferta multiplicaría estados sin que nadie lo haya pedido — el mismo
  error que `modo_horarios` evita viviendo en `prestadores`.
- **`NOT NULL DEFAULT false`** — el default ES la regla: sin decisión
  explícita, se reserva con el negocio. **Cero backfill** (todas las filas
  nacen `false`, que es exactamente su comportamiento de hoy), y por lo
  tanto **L-176 no se viola: esta migración no concede nada.**
- **NO es un enum de dos valores** aunque suene simétrico: *"expone
  personas"* es un hecho binario del negocio, y `LETRA_RECEPCION_S76` ya
  enseñó el costo de modelar como selector lo que es un toggle.

---

## 5. EL MOTOR MÍNIMO — medido antes de escribirlo

**La instrucción era verificar que el chasis lo da antes de escribir nada
nuevo. Lo da.** El camino del CUÁNDO vet, leído literal:

```
obtener_inicios_vet_disponibles(fecha, tipo, mascota)
  → _vet_ofertas_cobrables(mascota)
    → _inicios_disponibles_prestador(prestador, oferta, fecha, duracion)
```

⇒ **la elección es un `AND` más en `_inicios_disponibles_prestador`**, que
ya trae `h.empleado_id` en su `FROM` y ya une contra `prestador_empleados`.

**Las 9 lectoras NO se migran.** El parámetro nace
`p_empleado_id uuid DEFAULT NULL`, así que **todos los callers existentes
resuelven igual sin tocarse** — `NULL` significa *"cualquiera"*, que es el
comportamiento de hoy.

**Tres toques, y ninguno es motor nuevo:**

1. `_inicios_disponibles_prestador` — `AND (p_empleado_id IS NULL OR
   h.empleado_id = p_empleado_id)`.
2. `obtener_inicios_vet_disponibles` — pasa el parámetro hacia abajo.
3. `crear_bloqueo_agenda` — con `p_empleado_id` presente, **fija esa
   persona** en lugar de resolverla por continuidad/carga (§5 de
   `LETRA_TURNOS_S78`), y **rebota tipado si esa persona no está
   disponible** en vez de caer en otra en silencio — elegir a alguien y
   recibir a otro es peor que no poder elegir.

**Nota de método (L-119):** agregar un parámetro **cambia la firma**, así
que las tres piden `DROP FUNCTION` explícito de la firma vieja — `CREATE OR
REPLACE` crearía una sobrecarga y dejaría la vieja zombi.

**Un lector nuevo, mínimo:** *"¿quiénes atienden este servicio en este
negocio?"* — para que el CUÁNDO pueda dibujar el selector. Es el mismo
predicado que ya vive en `_inicios_disponibles_prestador`
(`pe.rol = 'dueño' OR EXISTS(chip)`), extraído: **no se inventa quién puede
atender.**

---

## 6. LO QUE ESTA LETRA **NO** RESUELVE

1. **El aviso de reasignación** (§3) — precondición de **encendido**, no de
   construcción. Sin motor de notificaciones no se enciende en un negocio
   real.
2. **La vitrina por OFICIO.** Un negocio podría querer exponer sus vets y
   no sus groomers. **Se declara y se difiere:** hoy nadie lo pidió, y la
   columna por negocio no lo impide — el día que haga falta, es una tabla
   puente, no un rediseño.
3. **El perfil público de la persona.** Elegir por nombre es lo mínimo;
   elegir viendo foto, especialidad y reseñas es **D-370**, que ya existe
   con su mock firmado. Esta letra habilita la elección, **no la vitrina
   rica**.
4. **La reserva "con la persona" en los otros tres oficios.** La letra está
   escrita en términos del arco vet porque es el que tiene el caso vivo;
   el motor es de plataforma y sirve igual, pero **la superficie de paseo,
   grooming y adiestramiento no se toca en S78**.

---

## 7. LOS NÚMEROS DE HOY

Medidos el 26-jul-2026:

- **5 negocios**, de los cuales **1 tiene 2+ personas activas** (Clínica
  Aurora). Los otros 4 **colapsan solos** y no verían la configuración.
- **`expone_personas` nace `false` en las 5** — cero cambio de conducta.
- El único negocio que podría encenderla tiene **una persona con 6 chips
  clínicos y otra con 0** ⇒ **con la vitrina encendida hoy, el selector
  mostraría UNA sola persona** (la que tiene chip vet) y **volvería a
  colapsar por N=1**. La vitrina se vuelve visible de verdad **cuando la
  segunda persona con chip cargue su jornada** — que es lo que A2 acaba de
  habilitar.
