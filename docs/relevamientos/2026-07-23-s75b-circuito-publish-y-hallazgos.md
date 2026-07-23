# S75-B · EL CIRCUITO, EL PUBLISH, Y DOS HALLAZGOS 🔴 (prep — NO ejecutado)

> Publish EN HOLD hasta que la mesa adjudique la tabla de R2 (D-517).
> Este doc deja listo: B7 (pre-check), B8 (circuito), B4 (comando),
> B6 (cura R2→R1), y DOS hallazgos que la puerta abierta destapó.

---

## 🔴 HALLAZGO 1 — LA PUERTA ABIERTA ROMPE MI "FINAL HONESTO" DE B1

Verificado con literal: `obtenerMiPrestador` (HEAD, post-`3591db2`)
resuelve **(2) vínculo activo**. Consecuencia en `/invitacion`:

- Invitado INACTIVO entra → guard → `/invitacion` → **acepta** → el RPC
  pone `activo=true`.
- Mi pantalla muestra el estado **`aceptada`** con la voz *"tu acceso al
  día a día todavía no está disponible"* y **SE QUEDA AHÍ**.
- Pero ahora su vínculo está ACTIVO → `obtenerMiPrestador` **ya resuelve**
  → debería **ENTRAR A TABS**. Mi pantalla lo **ATRAPA** en un mensaje
  que dejó de ser verdad.

**Rompe el circuito en el paso 3→4:** el empleado acepta y NO entra, así
que nunca llega a ver la agenda (paso 4). El "final honesto" era correcto
bajo *"la puerta va última / cerrada"*; con la puerta abierta en HEAD, es
un bug.

**CURA PREPARADA (a ejecutar en el batch del OTA, con OK de mesa):**
`apps/prestador/src/app/invitacion.tsx` — al aceptar con éxito,
`router.replace('/')` en vez del estado `aceptada`. El guard re-resuelve
→ `obtenerMiPrestador` resuelve el vínculo ahora activo → el empleado
entra a tabs (sin rol → sin NEGOCIO por mi gate B2; ve HOY/Mascotas/
Cuenta). El estado `aceptada` y su voz se ELIMINAN (Ley 37: describen un
estado que ya no existe). El rebote `ya_activado` también rutea a `/`.

**Corolario en B2:** la voz `sesion.empleadoTitulo/empleadoDetalle`
(empleado activo esperando la puerta) queda **INALCANZABLE** — un empleado
activo resuelve por (2) y nunca cae en `sin_prestador`. Es código muerto
honesto (default correcto a `sinRol`), candidato a retiro en el mismo
batch. **NO lo toco sin OK** — es lo que B2 depositó por mandato bajo el
supuesto viejo; la mesa decide si se retira o se deja como defensa.

*(No ejecuto ninguna de las dos ahora: el batch del OTA las lleva junto a
la cura R2 clase 1, apenas la mesa adjudique la tabla.)*

---

## 🔴 HALLAZGO 2 — NO HAY NEGOCIO VET DEL FOUNDER PARA SER TITULAR

El circuito (B8) pone al founder como **TITULAR** que invita y cuya
recepción ve "La visita". Para eso el negocio del titular tiene que
ofrecer **vet reservable** (paso 1 reserva ahí, paso 4 recepción la ve).
Relevado con literal:

- El **único prestador activo propio del founder** es **`[DEMO S58]
  Wizard`** (titular `guillo381+wizard@gmail.com`) — **CERO servicios**
  (`prestador_servicios` vacío). No puede recibir una reserva.
- Los **únicos** negocios con vet reservable son **Aurora** (titular
  `demo-vet@epetplace.dev`, 5 servicios) y **Satori** (titular
  `satorilatam@gmail.com`, 2). **Ninguno es cuenta `guillo381+*`.**

**DECISIÓN DE MESA/FOUNDER (bloquea el circuito, no el publish):**
- (A) sembrar UN servicio vet reservable en Wizard → el founder es
  titular de su propio negocio (más real), o
- (B) el titular es **demo-vet@epetplace.dev / Aurora** (el founder entra
  con esas credenciales demo) — runnable YA, sin sembrar nada.

El resto del circuito (abajo) queda escrito con Aurora como negocio de
prueba por default (opción B, cero siembra); si gana (A), solo cambia el
nombre del negocio y el mail del titular.

---

## B7 — PRE-CHECK DE `guillo381+9` (las 3 defensas, con literal)

Cuenta elegida por el founder. Verificado contra la fuente viva:

| Defensa de `crear_empleado_directo` | Query | Resultado literal |
|---|---|---|
| (a) existe en `auth.users` | `WHERE email='guillo381+9@gmail.com'` | ✅ id `d022c3d6-e1ea-4211-8c5a-66361274e21f`, alta `2026-07-20 01:30:50+00` |
| (b) NO prestador activo (`user_roles`) | filas de rol de +9 | ✅ **cero filas** (sin rol prestador) |
| (d) NO empleado de ESE prestador | `prestador_empleados` de +9 | ✅ **cero filas** (no es empleado de NADIE) |

**+9 pasa las tres, contra cualquier prestador** — no está entre las 5
inactivas (Satori) ni las 3 legacy. El founder NO comerá rebote.

---

## B8 / B5 — EL PEDIDO DEL CIRCUITO (tres identidades)

> Se usa APENAS publiquemos, y DESPUÉS de la cura del Hallazgo 1 (sin
> ella, el paso 3 atrapa al empleado). Negocio de prueba: **Aurora**
> (opción B) salvo que la mesa siembre Wizard (opción A).

**LAS TRES IDENTIDADES:**
- 🐾 **PET PARENT** — `guillo381+8@gmail.com` (la de Thor y Zeus, 2
  mascotas). Pasos 1 y 5.
- 🏢 **TITULAR** — `demo-vet@epetplace.dev` (Aurora) *[o la cuenta del
  founder si se siembra Wizard]*. Pasos 2 y 4a.
- 👤 **EMPLEADO** — `guillo381+9@gmail.com`. Pasos 3 y 4b.

**(0) MARCADOR — antes de evaluar nada (L-138/L-160).** En **las dos**
apps (cliente + prestador): tab **Cuenta → el pie**. Verificá el id del
**group NUEVO** (te lo paso al publicar). Si no coincide, cerrá y abrí la
app dos veces. **No evalúes nada hasta que el id coincida.**

**(1) PET PARENT reserva.** App **cliente**, cuenta `guillo381+8`.
Explorar → veterinaria → **Aurora** → una consulta → reservar y pagar
(simulado). Resultado: una cita vet firme de una mascota de +8 en Aurora.

**(2) TITULAR invita.** App **prestador**, cuenta `demo-vet@epetplace.dev`.
Negocio → **Equipo** → *Invitar* → email **`guillo381+9@gmail.com`** +
un nombre. **Pre-check hecho (B7): pasa las 3 defensas → NO rebota.**
Resultado: +9 queda como fila inactiva de Aurora.

**(3) EMPLEADO acepta.** App **prestador**, cuenta `guillo381+9`.
- **Si la clave de +9 no está a mano:** en la pantalla de login, *"olvidé
  mi contraseña"* → el reset de **Supabase Auth es el único email que el
  stack manda de verdad** (D-508), y el alias `+9` cae en el buzón del
  founder. Que esto NO frene el circuito.
- Login → el guard detecta la invitación inactiva y **redirige solo a
  `/invitacion`** → en pantalla: **el logo/monograma de Aurora** + *"Aurora
  te sumó a su equipo"* + *"Te invitaron como {nombre}"* + botón **"Entrar
  al equipo"**.
- Tap "Entrar al equipo" → **(con la cura del Hallazgo 1)** entra a las
  tabs: ve **HOY / Mascotas / Cuenta**, **SIN NEGOCIO** (no tiene rol aún
  — mi gate B2). *(Sin la cura, queda atrapado en "acceso no disponible"
  — por eso la cura es precondición.)*

**(4a) TITULAR asigna recepción.** App **prestador**, `demo-vet`.
Equipo → la fila de +9 → asignar rol **recepción**.

**(4b) EMPLEADO opera y REBOTA.** App **prestador**, `guillo381+9`.
- Ahora ve la **agenda** y, en la visita de +8, **"La visita" CON
  contacto** (nombre+teléfono de quien reservó) **y SIN lo clínico**.
- Intenta **escribir algo clínico** → **REBOTA** (ese rebote es el assert
  de **D-490** en la mano del founder — recepción no escribe la HC).

**(5) PET PARENT ve el sedimento.** App **cliente**, `guillo381+8`. La
consulta aparece **en la Línea de Vida** de la mascota.
- **Si (5) falla:** primera hipótesis **D-485** (mitad familia caída), NO
  el arco del equipo.

---

## B4 — EL PUBLISH (comando listo, NO ejecutado)

Cuando la mesa adjudique la tabla de R2 + la cura clase 1 esté adentro:

1. `git status --porcelain` **en 0** ANTES de bundlear (ancla SIN
   asterisco — regla del árbol limpio, precedente S74).
2. Bumpear el marcador de sesión `console.log('[bundle] prestador S73')`
   → `S75` en `_layout.tsx` (L-160; el visible del pie ya es auto).
3. Desde **`apps/prestador/`** (jamás la raíz — el stub `app.json` basura):
   ```
   cd apps/prestador
   npx eas-cli update --channel preview --environment development \
     --message "El handshake de equipo y los gates de rol: aceptar invitación (D-514) + ausencia de NEGOCIO/talleres para no-gestores + lectura de cuenta por vínculo (R2→R1)"
   ```
4. Post-publish: **group + ancla + qué carga** → a la mesa y a **A** (que
   deposita canon, 76d).

---

## B6 — LA CURA R2→R1 CLASE 1 (prep — espera la tabla de A)

**Mecánica:** donde una pantalla usa `obtenerMiCuentaComercial()` (R2,
owner-only → **null para el empleado**) y **solo lee el `.id`**, se swapea
a `obtenerMiPrestador()` (R1, resuelve por vínculo) tomando
**`.cuenta_comercial_id`** (A1 ya lo trae en `MiPrestador`).

**Confirmado clase 1 (leído):** `veterinaria/mostrador/autorizar.tsx`
usa **solo** `cuenta.data.id` (`setCuentaId`). Swap directo.

**19 consumidores** de `obtenerMiCuentaComercial` en `apps/prestador` —
la tabla de A clasifica cada uno; yo swapeo los **clase 1**.

**Verificación NO negociable (disciplina de A1, el typecheck no ve
identidad):**
- **TITULAR:** `obtenerMiPrestador` resuelve por titularidad (camino 1) →
  MISMO `cuenta_comercial_id` que hoy → **no-regresión byte a byte**.
- **EMPLEADO:** resuelve por vínculo (camino 2) → el `cuenta_comercial_id`
  del negocio → recibe lo suyo.
- Si una pantalla resulta **clase 2** (usa campos de la cuenta, no solo el
  id) **NO se fuerza**: se declara en **D-517** y el circuito la esquiva.
