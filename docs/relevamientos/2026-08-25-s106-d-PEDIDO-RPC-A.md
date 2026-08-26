# PEDIDO A LA PISTA A · LA RPC DEL VEREDICTO DE VIDEOLLAMADA

> **De:** pista D · S106 tanda 1 · 25-ago-2026
> **Por qué a vos:** `supabase/migrations/**` es territorio de A. **No la
> escribo yo.** Este es el texto completo, autocontenido (76b) — no hay que
> abrir mi relevamiento ni preguntarme nada.
>
> **Qué hace mi lado:** `video-token` autentica al caller, llama a esta RPC y,
> **sólo si dice que sí**, emite un token de LiveKit. **La edge no decide
> nada** — el veredicto vive acá, donde ya viven los helpers y la RLS.

---

## §0 · 🔴 FRENO ANTES DE ESCRIBIR NADA — la tabla del legado

Tu propia medición (`A-M6`) encontró **`cita_telemedicina_detalle`**: 0 filas,
ninguna migración del monorepo la crea, ninguna función la nombra, y trae
**`token_prestador`**, **`token_cliente`**, `room_url`, `grabacion_url`,
`grabacion_consentida`.

**Mi diseño NO la usa, y son cuatro razones medidas — no preferencia:**

1. 🔴 **Un token de video no se persiste. Es una credencial de vida corta.**
   Guardarlo lo desacopla de su ventana: *un token guardado sigue sirviendo
   después de que la cita terminó, y entonces la ventana temporal deja de ser
   una defensa y pasa a ser una decoración.*
2. 🔴 **Su policy de SELECT es `user_tiene_acceso_a_mascota(mascota_id) OR
   pet_parent_id = auth.uid()`** ⇒ **el dueño podría leer `token_prestador`**.
   *Una columna de credencial detrás de una policy pensada para datos de la
   mascota tiene dos dueños con intereses opuestos* — es la familia exacta de
   `L-4xx` del campo `detalle` que autenticaba eventos en S103.
3. **Su CHECK dice `proveedor ∈ {daily, whereby, zoom}` con `DEFAULT 'daily'`**
   ⇒ **rebota `livekit`**. Aunque quisiéramos usarla, hoy no entra.
4. **`grabacion_url` / `grabacion_consentida` presuponen grabación**, y
   `LETRA_TELEMEDICINA` **no la menciona en ninguna parte**. *Usar la tabla
   sería adoptar en silencio un modelo de producto que nadie firmó.*

⇒ **No pido tocarla, ni borrarla, ni migrarla.** Pido que **esta RPC no la
lea ni la escriba**, y que su adjudicación siga siendo de la mesa como vos
dejaste planteado. *Lo digo acá para que nadie "complete" la pieza conectándola
por prolijidad.*

---

## §1 · QUÉ NECESITO — una sola función

```
puede_entrar_a_videollamada(p_cita_id uuid, p_user_id uuid)
  → jsonb
```

**`SECURITY DEFINER`, `STABLE`, `search_path` fijo**, y **revocada de `anon` y
`PUBLIC`** (L-140). La llama `video-token` con `service_role`.

### Qué devuelve

```jsonc
// puede entrar
{ "puede": true,  "rol": "dueño",       "sala": "<cita_id>", "identidad": "<user_id>", "nombre": "…" }
{ "puede": true,  "rol": "profesional", "sala": "<cita_id>", "identidad": "<user_id>", "nombre": "…" }

// no puede — SIEMPRE con motivo tipado
{ "puede": false, "motivo": "cita_inexistente" }
{ "puede": false, "motivo": "ajeno_a_la_cita" }
{ "puede": false, "motivo": "no_es_teleconsulta" }
{ "puede": false, "motivo": "cita_no_pagada" }
{ "puede": false, "motivo": "cita_cancelada" }
{ "puede": false, "motivo": "fuera_de_ventana", "abre_en": "<timestamptz>" }
```

🔴 **Los motivos son tipados y no se colapsan en uno solo.** *«No podés
entrar» sin decir por qué manda a la familia a llamar por teléfono cuando lo
único que pasaba es que llegó veinte minutos antes.* `fuera_de_ventana` lleva
`abre_en` para que la pantalla pueda decir **cuándo sí**.

---

## §2 · LA LÓGICA

### 2.1 · De dónde salen los datos
De `evento_cita_servicio` — columnas medidas por mí en los tipos generados:
`mascota_id` · `prestador_id` · `empleado_id` · `user_id` · `fecha` · `hora` ·
`duracion_minutos` · `estado` · `estado_reserva` · `tipo_servicio`.

### 2.2 · Quién es quién — con helpers que YA EXISTEN
Medidos contra `pg_proc` en la DB viva, los dos `DEFINER` y `boolean`:

| helper | firma |
|---|---|
| `_user_es_familia_de_mascota` | `(p_mascota_id uuid, p_user_id uuid)` |
| `empleado_tiene_capacidad_clinica` | `(p_prestador_id uuid, p_user_id uuid)` |

- **dueño** ⟸ `_user_es_familia_de_mascota(cita.mascota_id, p_user_id)`
- **profesional** ⟸ `empleado_tiene_capacidad_clinica(cita.prestador_id, p_user_id)`
  **y**, si `cita.empleado_id IS NOT NULL`, que sea **esa** persona.
  *Si la cita nombra a alguien, otro profesional del mismo negocio no entra a
  esa consulta: no es su paciente.*
- **cualquier otro** ⇒ `ajeno_a_la_cita`.

⚠️ **No inventes un helper nuevo.** Si alguno no alcanza, **decímelo y lo
subimos a la mesa** — prefiero un pedido trabado a un predicado paralelo que
mañana diverja del que usa la RLS.

### 2.3 · Que sea teleconsulta
`cita.tipo_servicio = 'telemedicina'` — el código que vos mismo medís en
`tipos_servicio` (`codigo=telemedicina`, `categoria=telemedicina`).
Cualquier otro ⇒ `no_es_teleconsulta`.

🔴 **Un token de sala para una cita presencial no debería poder existir.**

### 2.4 · Que esté pagada y no cancelada
Con el vocabulario real de `estado` / `estado_reserva` — **el que midas vos,
no el que yo suponga.** Si no está cubierta por un pago ⇒ `cita_no_pagada`;
si está cancelada ⇒ `cita_cancelada`.

### 2.5 · 🔴 LA VENTANA — y el borde que la letra crea

**Propuesta (la firma la mesa con este pedido):**

```
desde  = (fecha + hora) − 15 min
hasta  = (fecha + hora) + duracion_minutos + 15 min
```

Fuera de eso ⇒ `fuera_de_ventana` + `abre_en`.

🔴 **Y acá va el borde que hay que codificar, porque es lo que la letra manda
y es contraintuitivo:**

> `LETRA_TELEMEDICINA` §4 dice que la consulta **se cobra aunque dure veinte
> segundos** y **aunque el dueño no asista** — *«si el veterinario entra y
> determina que el caso necesita atención presencial, eso ES el servicio
> prestado»*.

⇒ **El token del PROFESIONAL se emite aunque el dueño nunca entre.**
**La ventana jamás exige que haya dos.** *Cualquier regla del tipo «la sala
se abre cuando ambos están» rompe §4 y le saca al veterinario el derecho a
cobrar que la letra le acaba de dar.*

Los 15 minutos de margen: que la familia pueda entrar un poco antes sin
llamar a soporte, y que una consulta que se estira no expulse a nadie a mitad
de frase. **Es propuesta, no decisión mía.**

### 2.6 · La sala
**`sala = cita_id`.** Determinístico, único, sin estado que guardar y sin
tabla nueva. *Dos personas que pertenecen a la misma cita derivan el mismo
nombre de sala sin coordinarse.*

---

## §3 · QUÉ NO LE PIDO A ESTA RPC

- ❌ **No emite tokens.** No sabe qué es LiveKit. Devuelve un veredicto.
  *El día que cambie el proveedor, esta función no se toca.*
- ❌ **No escribe nada.** `STABLE`, sin efectos.
- ❌ **No toca `cita_telemedicina_detalle`** (§0).
- ❌ **No registra asistencia ni «en curso».** Si la mesa quiere eso, hay
  webhooks de LiveKit que lo dan mejor (lo declaro en mi reporte) — pero **no
  es esta pieza.**

---

## §4 · LO QUE PIDO PARA PODER PROBARLO

**Discriminadores, no camino feliz.** Mi arnés (`L-402`: un arnés que no
corrió no probó nada) necesita ejercer los rojos **a propósito**:

| caso | espero |
|---|---|
| dueño, en ventana, pagada | `puede: true, rol: "dueño"` |
| profesional de la cita, en ventana | `puede: true, rol: "profesional"` |
| **un tercero cualquiera** | `puede: false, motivo: "ajeno_a_la_cita"` |
| **el mismo dueño, 3 h antes** | `puede: false, motivo: "fuera_de_ventana"` |
| **cita cancelada** | `puede: false, motivo: "cita_cancelada"` |
| **cita presencial** | `puede: false, motivo: "no_es_teleconsulta"` |

⚠️ **Ojo con el estado de la base, que lo mediste vos:** `acepta_telemedicina`
está en **false en 11 de 11 prestadores** y hay **0 citas de telemedicina**.
⇒ **hoy no existe ni una sola cita con la que probar el camino feliz.**
*Sembrar un caso vivo o correr los asserts in-txn con ROLLBACK es decisión
tuya — pero si el arnés sale verde sin haber tocado una cita real, es un verde
flojo y lo voy a declarar como tal.*

---

## §5 · CÓMO LA LLAMO

```ts
const { data } = await db.rpc('puede_entrar_a_videollamada', {
  p_cita_id: citaId,
  p_user_id: userId,   // ← de getUser(), JAMÁS del body
});
```

**`p_user_id` sale de la sesión verificada en la edge, nunca del cliente.**
Molde literal de `pagos-tarjetas`: *«la sesión es la autorización — el uid
jamás viene del cliente»*.
