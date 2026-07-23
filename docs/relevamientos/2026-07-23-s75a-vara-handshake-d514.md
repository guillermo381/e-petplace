# S75-A5 · VARA CRUZADA (M2) del boceto del handshake de B — VEREDICTO: **APTO CON DOS ENMIENDAS DE DATO**

> Vara de A sobre `2026-07-23-s75b-boceto-handshake-d514.md` (`d5543e0`).
> Método M2 (L-158): se lee la FUENTE de cada dato del boceto, jamás su tabla.
> Adjudicación de mesa que rige esta vara: el §0 de B es correcto (la sonda
> `existe_invitacion_pendiente` del arranque no sirve — el camino por
> `prestador_empleados` rige). La vara audita el resto contra el literal.

---

## 1. LO QUE LA VARA CONFIRMA CONTRA EL LITERAL (el boceto acertó)

- **§0 — el camino de B rige, confirmado byte a byte.**
  `pg_get_functiondef(aceptar_invitacion_pendiente_login)`: toma
  `p_empleado_id` (no prestador_id), busca `WHERE id = p_empleado_id AND
  activo = false`, activa con `UPDATE … SET activo = true`. La sonda por
  `empleados_self` (`user_id = auth.uid()`) es la fuente correcta del
  `empleado_id`.
- **§6 — los tres rebotes tipados son EXACTOS al `prosrc`:** `'Sin sesión'` →
  `sin_sesion` · `'Empleado no encontrado o ya activado'` → `ya_activado` ·
  `'No tenés permiso para aceptar esta invitación'` → `no_es_tuya`. Verbatim,
  cero deriva.
- **§0/§6 — la desalineación 5 filas / invitaciones es real:**
  `empleado_invitaciones` = `aceptada` 3 + `pendiente_aceptacion_login` 2;
  `prestador_empleados` inactivas = 5. **La verdad es la FILA DE EMPLEADO**, no
  la invitación (registro paralelo desalineado). Correcto.
- **§4 — `LogoNegocio` consume `prestadores.foto_url`:** la columna existe.
- **Integración con R1 (A1) — coherente:** el guard llama `obtenerMiPrestador()`
  y ramifica en `codigo === 'sin_prestador'`. Con R1, un empleado **activo**
  ahora resuelve el negocio → entra a `(tabs)`; el **inactivo** sigue cayendo
  en `sin_prestador` → es exactamente donde el boceto inserta la sonda. El
  punto de inserción del §3 es el correcto post-R1.

---

## 2. LOS CUATRO PUNTOS QUE LA MESA MANDÓ CRUZAR

### (a) El borde de la sonda con 2+ negocios — el hermano de `maybeSingle` de R1
**Contra la fuente: hoy CERO users invitados por dos negocios distintos** —
los 5 con fila inactiva tienen `count(DISTINCT prestador_id) = 1`. El boceto lo
afirmó bien y declara el orden determinista + la lista N como deuda. **✅ el
borde está declarado, no descubierto.**

> **ENMIENDA DE DATO 1 (L-158 — R1 y la sonda deben coincidir en el borde):**
> el boceto ordena por **`invitado_en ASC`**. Esa columna es **NULLABLE**; mi
> R1 ordenó por **`created_at ASC`** (NOT NULL). Hoy las 5 filas tienen
> `invitado_en` poblado y ambas columnas dan el MISMO orden — pero son
> columnas distintas para el mismo criterio "el más antiguo", y eso abre dos
> grietas: (1) el día que una fila nazca con `invitado_en` NULL, `ORDER BY
> invitado_en ASC` la manda al final (Postgres NULLS LAST en ASC) — deja de
> significar "el primero que te sumó"; (2) R1 (que elige el negocio ACTIVO
> más antiguo) y la sonda (el INACTIVO más antiguo) miran conjuntos disjuntos,
> así que no compiten, pero usar columnas distintas es una divergencia latente
> que se paga el día del segundo negocio. **Recomendación: la sonda ordena por
> `created_at ASC` (igual que R1), o si se quiere la semántica de invitación,
> `ORDER BY invitado_en ASC NULLS LAST, created_at ASC` con el desempate NOT
> NULL explícito.** Enmienda menor, de una línea del wrapper.

### (b) El final honesto contra L-139
**Correcto.** El §5 dice la verdad verificable ("Ya eres parte de {{negocio}}"
= la fila quedó `activo=true`) y niega las tres promesas que la puerta no puede
cumplir. Ley 13 + L-139 respetadas.

> **ENMIENDA DE DATO 2 (coherencia interna del boceto):** el §6 declara que
> `negocioNombre puede venir null` (si el prestador no está `activo`, por
> `prestadores_public`) → *"Te sumaron a un equipo"*. **Ese mismo fallback
> tiene que regir el §5**: si el nombre es null, el final honesto dice *"Ya
> eres parte de un equipo"*, jamás un nombre inventado (L-139). El mockup del
> §5 usa el nombre literal y no menciona su rama null — se explicita para que
> las DOS superficies (invitación y final) hereden el fallback, no solo la
> primera.

### (c) La voz "Ya eres parte de {{negocio}}"
**Firmada por la mesa** (la enmienda de voseo→tuteo del §2, L-148). Nada que
auditar: la mesa ya adjudicó que el "Ya sos" del arranque era voz de mesa y
"Ya eres" es la de producto.

### (d) El roce del re-login — ¿la sonda mira también activas?
**La vara CONCUERDA con B: la sonda mira SOLO `activo = false`. NO debe mirar
activas.** El razonamiento contra la fuente:
- Si la sonda mirara filas activas, redirigiría a `/invitacion` a alguien **ya
  activo**, y `aceptar_invitacion_pendiente_login` lo rebotaría con *"ya
  activado"* — **es Ley 23 violada exacta**: ofrecer un botón que el server va
  a rechazar. El propio §3 del boceto ya lo dice.
- El roce (tras aceptar, la fila es `activo=true`, la sonda no la encuentra, el
  invitado cae en el `EstadoVacio` de `sin_rol`) **es la consecuencia honesta
  de que B3 no está abierta**. La cura correcta es **B3** — cuando la puerta
  abra, el empleado activo entra al negocio en vez de caer en el vacío. Meter
  activas en la sonda no tapa el roce: crea un loop de "aceptar lo ya aceptado".
- **Dato duro que lo respalda:** hoy CERO users tienen fila inactiva **y**
  activa simultáneamente, así que el roce no tiene ni un caso vivo — es un
  estado transitorio de un solo reingreso, que B3 absorbe por diseño.
- **Veredicto: B3 absorbe el roce; la sonda no se ensancha.** Es la misma
  disciplina de "la puerta va última" del arco: el resolvedor y las voces
  quedan inertes/honestos hasta que la puerta abra, y ahí todo cierra sin
  parches.

---

## 3. VEREDICTO

**APTO CON DOS ENMIENDAS DE DATO**, ambas menores y de una línea:
1. la columna de orden de la sonda se alinea con R1 (`created_at ASC`, o
   `invitado_en ASC NULLS LAST, created_at ASC`);
2. el fallback de nombre-null del §6 se explicita también en el final honesto
   del §5.

El §0 (la premisa corregida) y el camino de B por `prestador_empleados` rigen
—confirmados contra el literal—. Los cuatro puntos de mesa: (a) declarado, con
la enmienda de columna; (b) correcto, con la enmienda de fallback; (c) firmado;
(d) la vara concuerda con B — la sonda mira solo inactivas, B3 absorbe el roce.
**El boceto puede construirse tras aplicar las dos enmiendas** (territorio de
B — la vara no construye, L-153).

**Fuera de la vara, ratificado como declarado:** el `anon=X` de las tres
funciones de invitación es clase D-503 (ventana propia post-arco, jamás
mezclada con las migraciones del arco) — el boceto §0/§9 lo declara y no lo
toca; correcto.

---

## 4. VERIFICACIÓN

Literal de la DB viva (`pg_get_functiondef`, conteos de estado, el censo de
negocios-por-user, `invitado_en` vs `created_at` de las 5 inactivas) y del
guard real `apps/prestador/src/app/(tabs)/_layout.tsx:63-65`. Cero escritura.
