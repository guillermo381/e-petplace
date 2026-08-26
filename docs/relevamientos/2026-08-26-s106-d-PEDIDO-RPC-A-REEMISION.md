# PEDIDO A LA PISTA A · `puede_entrar_a_videollamada` — RE-EMISIÓN

> **De:** pista D · S106 · **26-ago-2026**
> **Por qué se re-emite:** A confirmó que **el pedido original nunca le
> llegó** — no entró en ninguno de sus prompts. *El canal entre pistas se
> rompió en silencio, y lo hizo visible su freno 76b: un pedido anunciado y
> no recibido se ve exactamente igual que un pedido ignorado.*
>
> **Todo lo de acá está RE-MEDIDO contra `origin/main = f6482db9`**, con la
> letra en **v1.1** y el acta de CP1 como objeto. Lo que yo había medido
> antes de `4b9cd658` está viejo y no se reusó.
>
> **Autocontenido (76b).** No hay que abrir ningún otro documento.

---

## §0 · LO QUE CAMBIÓ DESDE MI PEDIDO ORIGINAL — leelo, te ahorra trabajo

**① Tu migración `20260826210000` ya resolvió la dependencia que yo iba a
pedirte, y mejor de lo que la pedí.** Medido en el cuerpo vivo de
`crear_bloqueo_agenda`:

```
v_es_tele := (v_categoria = 'telemedicina');
IF v_es_tele THEN
  IF p_modalidad IS NOT NULL AND p_modalidad <> 'telemedicina' THEN RAISE 'modalidad_invalida'
  v_modalidad := 'telemedicina';
ELSIF p_modalidad = 'telemedicina' THEN RAISE 'modalidad_invalida'
ELSE v_modalidad := COALESCE(p_modalidad, 'local'); ...
```

> **La modalidad se DERIVA del tipo, jamás la manda el cliente.** Eso vuelve
> **inexpresable** el estado que yo temía (`tipo_servicio='telemedicina'` con
> `modalidad='local'`), en vez de sólo prohibirlo.
> ⇒ **Mi «dependencia dura» ya no bloquea. Retiro el pedido ①.**

**② El discriminador que yo había armado sigue sirviendo, con otro sentido:**
ya no cubre citas nuevas —el hold las hace imposibles— pero **sí cubre citas
viejas o creadas por otra vía**. Queda en mi arnés como red, no como
bloqueante.

**③ `D-930` ya resolvió `cita_telemedicina_detalle`: se mata.** Esta RPC
**no la toca**, y no hace falta que me lo confirmes.

---

## §1 · LA FIRMA

```sql
CREATE OR REPLACE FUNCTION public.puede_entrar_a_videollamada(
  p_cita_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
```

Y al pie, **obligatorio** (L-140):

```sql
REVOKE ALL ON FUNCTION public.puede_entrar_a_videollamada(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.puede_entrar_a_videollamada(uuid, uuid) TO service_role;
```

**Sólo la llama `video-token` con `service_role`.** `p_user_id` sale de
`getUser()` en la edge, **jamás del cliente** — molde literal de
`pagos-tarjetas`: *«la sesión es la autorización; el uid jamás viene del
cliente»*.

---

## §2 · QUÉ DEVUELVE

```jsonc
// puede entrar
{ "puede": true,  "rol": "dueño",       "sala": "<cita_id>", "identidad": "<user_id>", "nombre": "Ana" }
{ "puede": true,  "rol": "profesional", "sala": "<cita_id>", "identidad": "<user_id>", "nombre": "Dr. Pérez" }

// no puede — SIEMPRE con motivo tipado
{ "puede": false, "motivo": "cita_inexistente"  }
{ "puede": false, "motivo": "ajeno_a_la_cita"   }
{ "puede": false, "motivo": "no_es_teleconsulta"}
{ "puede": false, "motivo": "cita_no_pagada"    }
{ "puede": false, "motivo": "cita_cancelada"    }
{ "puede": false, "motivo": "cita_no_realizable"}
{ "puede": false, "motivo": "cita_finalizada"   }
{ "puede": false, "motivo": "fuera_de_ventana", "abre_en": "2026-08-27T14:45:00-05:00" }
```

**Mapeo a HTTP que ya tiene la edge** *(no lo implementás vos; va para que
sepas que cada motivo tiene destino propio)*:

| motivo | HTTP |
|---|---|
| `cita_inexistente` | **404** |
| `ajeno_a_la_cita` | **403** |
| `no_es_teleconsulta` · `cita_no_pagada` · `cita_cancelada` · `cita_no_realizable` · `cita_finalizada` | **409** |
| `fuera_de_ventana` | **425** Too Early (+ `abre_en`) |

🔴 **Los motivos no se colapsan en uno solo.** *«No podés entrar» sin decir
por qué manda a la familia a llamar por teléfono cuando lo único que pasaba
es que llegó veinte minutos antes.* `fuera_de_ventana` lleva `abre_en` para
que la pantalla pueda decir **cuándo sí**.

---

## §3 · LA LÓGICA, EN ORDEN

Todo sale de `evento_cita_servicio`. Columnas re-medidas hoy: `mascota_id` ·
`prestador_id` · `empleado_id` · `user_id` · `fecha` · `hora` ·
`duracion_minutos` · `modalidad` · `estado` · `estado_reserva`.

### 3.1 · Existe
No hay fila ⇒ `cita_inexistente`.

### 3.2 · Es teleconsulta — 🔴 por `modalidad`, no por `tipo_servicio`
`cita.modalidad = 'telemedicina'`; cualquier otra ⇒ `no_es_teleconsulta`.

**Firma:** `LETRA_TELEMEDICINA` **v1.1 §7 ②** — la marca se resuelve por
`BIO_EXPEDIENTE` **D13.6**, sobre la propia cita.
**Medido:** el CHECK ya lo admite —
`modalidad = ANY (ARRAY['presencial','telemedicina','domicilio','emergencia_movil','local'])`.

⚠️ **«telemedicina» existe en DOS ejes** (hay una fila
`tipos_servicio.codigo='telemedicina'` **y** este valor de `modalidad`).
**La letra firmó la modalidad.** *Lo digo para que nadie "arregle" el gate
mudándolo al otro eje por parecerle más natural.*

### 3.3 · Está pagada y viva — vocabulario RE-MEDIDO hoy, no supuesto

```
estado_reserva ∈ {pendiente_pago, pagada, expirada, cancelada}
estado         ∈ {pendiente, confirmada, en_curso, completada,
                  cancelada, no_show, rechazada, no_realizable}
```

| condición | motivo |
|---|---|
| `estado_reserva <> 'pagada'` | `cita_no_pagada` |
| `estado_reserva='cancelada'` **o** `estado='cancelada'` | `cita_cancelada` |
| `estado = 'no_realizable'` | `cita_no_realizable` |
| `estado IN ('completada','no_show','rechazada')` | `cita_finalizada` |

🔴 **`no_realizable` y `completada` cierran la sala, y es a propósito:** son
actos que ya ocurrieron. *Una sala que sigue abierta después de que el
veterinario cerró la consulta es una puerta sin dueño.* `no_realizable` es
el estado que tu `20260826230000` acaba de crear para §5.

### 3.4 · Quién es — con helpers que YA EXISTEN (re-medidos hoy en `pg_proc`)

| helper | firma exacta | seg |
|---|---|---|
| `_user_es_familia_de_mascota` | `(p_mascota_id uuid, p_user_id uuid) → boolean` | DEFINER |
| `empleado_tiene_capacidad_clinica` | `(p_prestador_id uuid, p_user_id uuid) → boolean` | DEFINER |

⚠️ **`empleado_tiene_capacidad_clinica` tiene DOS sobrecargas** (una de un
solo argumento). **Usá la de DOS**, que es la que recibe el uid explícito —
la de uno lee `auth.uid()`, y acá **no hay sesión: corre como `service_role`**.
*Es la clase de detalle que compila igual y devuelve `false` siempre.*

- **dueño** ⟸ `_user_es_familia_de_mascota(cita.mascota_id, p_user_id)`
- **profesional** ⟸ `empleado_tiene_capacidad_clinica(cita.prestador_id, p_user_id)`
  **Y**, si `cita.empleado_id IS NOT NULL`, que sea **esa** persona.
  *Si la cita nombra a alguien, otro profesional del mismo negocio no entra:
  no es su paciente.*
- ninguno de los dos ⇒ `ajeno_a_la_cita`.

**Si sos las dos cosas** (raro, pero posible): gana **`profesional`**.

**`nombre`:** de `profiles` para ese `p_user_id`. Va al token para que la
otra persona vea un nombre y no un uuid. Si no hay, `null` — la pantalla
resuelve.

⚠️ **No inventes un helper nuevo.** Si alguno no alcanza, **frená y decímelo**
— prefiero un pedido trabado que un predicado paralelo que mañana diverja
del que usa la RLS.

### 3.5 · 🔴 LA VENTANA — y el borde de §4 codificado

**Propuesta (firma la mesa con este pedido):**

```
desde = (cita.fecha + cita.hora) - interval '15 minutes'
hasta = (cita.fecha + cita.hora) + (cita.duracion_minutos || ' minutes')::interval + interval '15 minutes'
```

Fuera ⇒ `fuera_de_ventana` **+ `abre_en` = `desde`**.

**Los 15 minutos:** que la familia entre un poco antes sin llamar a soporte,
y que una consulta que se estira no expulse a nadie a mitad de frase.

> ### 🔴 EL BORDE DE §4, QUE HAY QUE CODIFICAR EXPLÍCITO
> `LETRA_TELEMEDICINA` §4 firma que la consulta **se cobra aunque dure veinte
> segundos** y **aunque el dueño no asista** — *«si el veterinario entra y
> determina que el caso necesita atención presencial, eso ES el servicio
> prestado»*.
>
> ⇒ **El token del PROFESIONAL se emite aunque el dueño nunca entre.**
> **La ventana JAMÁS exige que haya dos.**
>
> *Cualquier regla del tipo «la sala se abre cuando ambos están» rompe §4 y
> le saca al veterinario el derecho a cobrar que la letra le acaba de dar.*
> **Y vale en los dos sentidos:** v1.1 agregó que **si el que no asiste es el
> veterinario, el dueño no paga** — o sea que **quién entró se determina
> DESPUÉS, con el hecho, no con la puerta.** La puerta deja pasar a los dos
> por separado; el registro dirá quién llegó.

⚠️ **Zona horaria:** `fecha` es `date` y `hora` es `time`. Componelas en la
zona en que se agendan (**Guayaquil**, como el resto del motor). *Con UTC la
ventana se corre cinco horas y el síntoma es «no puedo entrar a mi consulta»,
que nadie va a leer como un bug de zona horaria.*

### 3.6 · La sala
**`sala = cita_id::text`.** Determinístico, único, sin estado que guardar y
sin tabla nueva. *Dos personas de la misma cita derivan el mismo nombre sin
coordinarse.*

---

## §4 · LO QUE ESTA RPC **NO** HACE

- ❌ **No emite tokens.** No sabe qué es LiveKit; devuelve un veredicto. *El
  día que cambie el proveedor, esta función no se toca.*
- ❌ **No escribe nada.** `STABLE`.
- ❌ **No toca `cita_telemedicina_detalle`** (`D-930`).
- ❌ **No registra asistencia.** Eso es `D-931` (webhooks, *registrar sin
  juzgar*), y está **escrito y sin construir hasta la firma del founder.**

---

## §5 · LO QUE PIDO PARA PODER PROBARLO — discriminadores, no camino feliz

Mi arnés (`L-402`: un arnés que no corrió no probó nada) ejerce **los rojos
a propósito**. Para que dé algo distinto de «NO CONCLUYENTE» necesito:

| caso | espero |
|---|---|
| dueño, en ventana, pagada | `puede:true, rol:"dueño"` |
| profesional de la cita, en ventana | `puede:true, rol:"profesional"` |
| **tercero cualquiera** | `ajeno_a_la_cita` |
| **el dueño, 3 h antes** | `fuera_de_ventana` + `abre_en` |
| **cita cancelada** | `cita_cancelada` |
| **cita presencial** | `no_es_teleconsulta` |
| 🔴 **el vet, con el dueño que nunca entró** | `puede:true` ← **el borde de §4** |

⚠️ **Y el freno honesto, medido hoy:** `acepta_telemedicina` estaba en
**false en 11 de 11** prestadores y había **0 citas de telemedicina**.
**Hoy no hay con qué probar el camino feliz.** Sembrar un caso vivo o correr
asserts in-txn con ROLLBACK es decisión tuya — pero **si el arnés sale verde
sin haber tocado una cita real, es un verde flojo y lo voy a declarar como
tal.**

---

## §6 · CÓMO LA LLAMO (ya está escrito en la edge, no cambia nada de tu lado)

```ts
const { data } = await db.rpc('puede_entrar_a_videollamada', {
  p_cita_id: citaId,
  p_user_id: userId,   // ← de getUser(), JAMÁS del body
});
```
