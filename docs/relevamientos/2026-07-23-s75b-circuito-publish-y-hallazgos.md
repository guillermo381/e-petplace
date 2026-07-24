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

**LAS TRES IDENTIDADES (fijas, mesa S75):**
- 🐾 **PET PARENT** — `guillo381+8@gmail.com` (la de Thor y Zeus, 2
  mascotas). Pasos 1 y 5.
- 🏢 **TITULAR** — `demo-vet@epetplace.dev` (Aurora; el founder trae la
  clave). Pasos 2 y 4a.
- 👤 **EMPLEADO** — `guillo381+9@gmail.com`. Pasos 3 y 4b.

**RITMO: 4 cambios de sesión** (titular → +9 → titular → +9). La
ventana de equipo filtra `.activo` (B9): el rol NO se puede asignar antes
de que +9 acepte, así que titular y empleado se turnan. No es bug — es
el flujo v1.

**(0) MARCADOR — antes de evaluar nada (L-138/L-160).** En **las dos**
apps (cliente + prestador): tab **Cuenta → el pie**. Verificá el id del
**group NUEVO** (te lo paso al publicar). Si no coincide, cerrá y abrí la
app dos veces. **No evalúes nada hasta que el id coincida.**

**(1) PET PARENT reserva.** App **cliente**, cuenta `guillo381+8`.
Explorar → veterinaria → **Aurora** → una consulta → reservar y pagar
(simulado). Resultado: una cita vet firme de una mascota de +8 en Aurora.

**(2) TITULAR invita.** App **prestador**, cuenta `demo-vet@epetplace.dev`.
Negocio → **Equipo**. **Vas a ver UNA sola persona: Dra. Aurora (vos) —
es lo esperado, Aurora no tiene siembra (B14).** → *Invitar* → email
**`guillo381+9@gmail.com`** + un nombre. **Pre-check hecho (B7 + B14):
pasa las 3 defensas → NO rebota.** Resultado: +9 queda como fila inactiva
de Aurora (aún NO aparece en la lista — la lista filtra activos).

**(3) EMPLEADO acepta.** App **prestador**, cuenta `guillo381+9`. El
founder trae la clave (es su cuenta). — *nueva sesión (2ª de 4).*
- Login → el guard detecta la invitación inactiva y **redirige solo a
  `/invitacion`** → en pantalla: **el logo/monograma de Aurora** + *"Aurora
  te sumó a su equipo"* + *"Te invitaron como {nombre}"* + botón **"Entrar
  al equipo"**.
- Tap "Entrar al equipo" → **entra a las tabs** (cura H1 EJECUTADA): ve
  **HOY / Mascotas / Cuenta**, **SIN NEGOCIO** (no tiene rol aún — gate
  B2). *(Aún NO ve datos del negocio: el rol llega en 4a.)*

**(4a) TITULAR asigna recepción.** App **prestador**, `demo-vet`.
Equipo → la fila de +9 → asignar rol **recepción**.

**(4b) EMPLEADO opera.** App **prestador**, `guillo381+9`.
- Ahora ve la **agenda** y, en la visita de +8, **"La visita" CON
  contacto** (nombre+teléfono de quien reservó) **y SIN lo clínico**.
- **⚠️ ENMENDADO (A33, acta de cierre §0): este paso YA NO promete el
  rebote de escritura.** El agujero es de motor (`sedimentar_nota_clinica`
  es DEFINER y salta la RLS); D-490 está 🔴 REABIERTA hasta su fase 2.
  El rebote se gatea recién con la fase 2 aplicada — prometerlo hoy sería
  pedirle al founder que gatee algo que puede NO rebotar.

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

---

## ═══ B16/B17/B18 — strings rotos del gate del founder ═══

**B16 (curado):** `consulta.errorDetalle` era voseo + reintento falso
(*"Revisá tu negocio... y probá de nuevo"*) → **"Puede que no tengas
acceso a esta mascota."** (tuteo, sin promesa de reintento — si no hay
acceso, reintentar no lo arregla). De paso, `consulta.iniciarDetalle`
(voseo *"Dictá... guardá"*, misma pantalla) → tuteo.

**Censo de voseo (mesa B16):** mis strings S75 (`invitacion.*` +
`sesion.empleado*`) están **LIMPIAS (tuteo)**. **Voseo PRE-EXISTENTE
encontrado en passing (NO mío, para la mesa — cheap, cabe en el OTA de
cierre si se quiere barrer):** `veterinaria.aprobadoPresencial`
(*"coordiná"*) · los `errorDetalle: 'Probá de nuevo...'` del namespace
vet · y el wrapper `veterinaria-nota-clinica.ts` (*"probá"*, *"tenés"*).

**B17 (curado):** *"Te invitaron como {{nombre}}"* se leía como ROL
(founder: *"Luos no es un rol"*). **Fuente hallada con literal:**
`{{nombre}}` = `datos.nombreInvitado` = `prestador_empleados.nombre` — el
nombre que el TITULAR tipeó al invitar (**dato de la fila, NO
interpolación rota, NO key mal resuelta**); la invitación v1 no lleva rol
(E4). Reescrito → **"Tu nombre en el equipo: {{nombre}}"** (claramente un
nombre, no un cargo). *(Gate de copy del founder: si prefiere quitar la
línea, es un toque — el dato es marginal.)*

**B18 — DEUDA DECLARADA (no cura, es LETRA):** la app le ofrece
**"Registrar atención"** en HOY a un empleado que NO puede ejecutarla
(captura del founder). Es **Ley 23 rota** — la puerta ofrece lo que va a
rechazar. La cura NO es un parche: exige **definir qué PUEDE hacer
recepción en HOY** (letra de producto — recepción opera el mostrador
§7bis, pero "Registrar atención" clínica no es suyo). **Candidata de
deuda (a que A la numere, 76d):** *gate de "Registrar atención" en HOY
por rol — recepción ve el mostrador pero no la atención clínica; el menú
de HOY se compone por lo que el rol PUEDE hacer.* Referencia: captura del
founder S75 (HOY con "Registrar atención" visible para recepción).

## ═══ ACTUALIZACIÓN (segunda tanda de mesa) ═══

### LAS 4 CLASE 1 — EJECUTADAS (typecheck api+prestador verde)
- **#2 autorizar · #3 coordinar · #4 movimiento** — swap
  `obtenerMiCuentaComercial()` → `obtenerMiPrestador().cuenta_comercial_id`
  (solo `.id`, clase 1 pura).
- **#1 consulta/[citaId]** — swap COMPLETO (`.id` + `.countryCode`): A14
  dio **5/5 sin divergencia**, así que `country_code` viaja seguro (borde
  declarado en el código: negocio operando en país ≠ al de su cuenta).
  Es la pantalla del **assert NEGATIVO** del founder.
- **No-regresión del titular VERIFICADA con literal (5/5):**
  `prestadores.cuenta_comercial_id` (R1) `IS NOT DISTINCT FROM` la cuenta
  por `owner_profile_id` (R2) en TODOS los titulares.
- CLASE 2 (`cuenta-comercial/index` · `bancarios`) **intactas** (owner-only,
  v2, D-517).

### CURA H1 — EJECUTADA
`/invitacion` al aceptar → `router.replace('/')` (la puerta abierta lo
deja entrar). Estado `aceptada` + string `invitacion.aceptadoSinNombre`
RETIRADOS (Ley 37, murieron con el supuesto de puerta-cerrada).

### B2 VOZ — NO SE RETIRA + DEUDA DECLARADA
**Verificado contra la fuente:** existe **1 caso vivo** de empleado
activo de negocio NO-`activo`. Ese empleado cae en `sin_prestador` (borde
de A1). Mi voz `empleadoTitulo/Detalle` **NO puede mostrarse** para él:
leer el nombre de un negocio no-`activo` choca con `prestadores_public`
(estado='activo') → HOY DEGRADA a `sinRol`. Dejada con comentario que
nombra el borde (para que S76 no la limpie).
**DEUDA CANDIDATA (a que A la numere, 76d):** un lector del nombre de un
negocio no-`activo` para el empleado activo (saltea RLS estado='activo')
— cuando exista, la voz habla. Territorio A (RLS/motor).

### B9 — EL CIRCUITO SE QUEDA EN 4 SESIONES (verificado, no asumido)
La policy `empleado_roles_insert_duenio` **permitiría** asignar rol a un
`activo=false` (no exige activo). PERO **`equipo.tsx:192` filtra
`.filter((m) => m.activo)`** — la ventana solo muestra activos; el
invitado no aparece hasta aceptar. **No hay UI para asignar rol antes de
aceptar → 4 sesiones** (invitar → aceptar → asignar recepción → operar).
Construir el pre-asignado sería feature nueva, fuera de alcance S75. **Se
declara para que el founder no lo lea como bug a mitad del circuito.**

### B10 → RESUELTO: AURORA CONFIRMADA (correcciones de mesa B12/B13)
- El grep dio **cero clave documentada** de `demo-vet@epetplace.dev` y
  `@epetplace.dev` es dominio demo sin buzón → sin reset por mail. PERO
  **el founder TIENE la clave** (la puso al crear el user; es dueño del
  proyecto Supabase — la fija desde el panel, no necesita buzón). **Aurora
  se abre. No hay nada que declarar de acceso.**
- **`Satori` DESCARTADA (corrección B12 — mi recomendación previa era
  FALSA):** no falla por geografía (D-518) sino por **`cc.estado='activa'`
  en el filtro de `_vet_ofertas_cobrables`** — la cuenta comercial de
  Satori está en **`pendiente_validacion`** (literal de A15), así que su
  oferta vet NO es cobrable y `+8` no podría reservar. Activarla tocaría
  el estado comercial de una **empresa REAL del founder** — no se hace
  por un gate. **El negocio del gate es AURORA, firme.**

### B14 — QUÉ VERÁ EL FOUNDER EN EL EQUIPO DE AURORA (con literal)
`prestador_empleados` de Aurora (`de680000…e5`): **UNA sola fila — la
titular** (`[DEMO S68] Dra. Aurora`, `demo-vet@epetplace.dev`, activa).
**Cero inactivas, cero legacy, cero siembra.** Las 5 filas inactivas de
la DB son de **Satori**, no de Aurora. → El founder al abrir Equipo se
verá **solo a sí mismo**; no hay historia vieja que leer como bug.
**Contra-verificación de invitar:** `+9` no tiene fila en Aurora (Aurora
solo tiene la titular) → la invitación pasa las 3 defensas (B7 confirmado
en concreto). El pedido B8 lo dice de antemano.
