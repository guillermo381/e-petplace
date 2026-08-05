# LÁMINA — LA BARRA DE TRES (la casa del no-gestor)

> **✅ FIRMADA ENTERA POR EL FOUNDER — 5 de agosto de 2026.**
> Superficie del prestador **no-gestor**: quien tiene vínculo activo con un
> negocio y **no lo administra**. Nace de **[[D-651]]** — cinco personas veían
> una barra de tres tabs que nunca se había diseñado, y el código declaraba por
> escrito que eso era imposible.
> **C arranca su lote contra esta lámina.**

---

## 0. La tesis

> ### **LOS TRES TABS NO SON UN ACCIDENTE: SON LA CASA DEL NO-GESTOR.**

D-651 los encontró como un descarte —lo que queda cuando se le saca una tab a
la barra del titular— y esta lámina los **ratifica como diseño**. La diferencia
no es cosmética: **un descarte se tolera; una casa se cuida.**

**La barra: `Hoy` · `Datos` · `Cuenta`.**

*El titular ve cuatro. El no-gestor ve tres, y las tres son suyas.*

---

## 1. EL TECHO — lo que más cambia, y por qué

**Hoy el techo del no-gestor le muestra la plata del negocio con un candado
encima («Owner only»).** Eso muere.

> ### **EL TECHO DEL NO-GESTOR MUESTRA SU PROPIO DÍA.**

| rol | qué muestra el techo |
|---|---|
| **profesional** (con chips) | **sus citas de hoy** |
| **recepción** (sin chips) | ~~el movimiento de la puerta~~ → **la misma posición consolidada que el dueño** (letra founder, abajo) |

> ### ☠️ **REVOCADA POR LETRA DEL FOUNDER (5-ago-2026, gate de la barra)**
>
> **La letra nueva, verbatim:** *«la recepción ve exactamente la misma posición
> consolidada que el dueño; no puede atender; solo puede asignar las citas que
> no tienen prestador agendado.»*
>
> ⇒ **NO es «lo que ya existe alcanza».** Es **lote de construcción propio**, y
> la mesa lo dibuja antes de que se toque una línea.
>
> **Lo que dice de la recepción, y es más que una pantalla:** ve **todo** —
> misma posición consolidada que el dueño— y **hace poco**: no atiende, solo
> **asigna lo que no tiene prestador**. *Ver completo y poder poco no es una
> limitación: es la definición del mostrador.*
>
> **La lectura revocada, conservada a propósito:** *«`AgendaRecepcion` ES el
> movimiento de la puerta; media lámina cumplida sin escribir una línea»*
> (decisión de mesa del mismo día, antes del gate). **Se conserva marcada y no
> se borra:** quien lea tiene que ver que hubo una lectura anterior y por qué
> cayó. *Se cayó porque miró la superficie que existía y no preguntó qué PUEDE
> hacer ese actor — y la respuesta era ninguna de las dos cosas que la fila
> suponía.*

**Y la razón que hay que conservar aunque el diseño evolucione:**

> **El candado no se explica: DESAPARECE.** *El slot deja de ser la plata y pasa
> a ser su trabajo.* **«Owner only» como saludo diario le recuerda todos los
> días lo que no es, en el primer renglón de su casa** — y encima ocupa el lugar
> donde debería estar lo único que sí necesita al abrir la app.
>
> *Un candado en un lugar de paso informa. Un candado en la portada define.*

**Coherencia con la letra firmada:** `PORTAL_PRESTADOR` §2.4bis pone PLATA en la
portada **del titular**; la plata del día la ve **solo el titular (y el admin)**,
y el gate vive en el SERVIDOR (`obtener_plata_del_dia`). **Esta lámina no toca
ese gate: cambia lo que ocupa el slot cuando el gate dice que no.**

---

## 2. Las tres tabs

| tab | qué es para el no-gestor |
|---|---|
| **Hoy** | su jornada. El techo de §1 + lo que tiene que hacer. **Es la tab que abre.** |
| **Datos** | las mascotas que atiende y su expediente, con el alcance que su rol permite (lo clínico cuelga del CHIP, jamás del cargo — `LETRA_RECEPCION_S76`). |
| **Cuenta** | lo suyo: su perfil, sus preferencias, su sesión. |

**Lo que NO está, y es la definición:** la tab de **NEGOCIO**. Gestionar el
negocio no es de este actor — y por eso su ausencia **no se explica ni se
insinúa**: simplemente no hay cuarta tab.

---

## 3. DONDE SÍ HAY PUERTA CERRADA — la voz honesta

Un no-gestor puede llegar a una ruta de gestión **por deep link** (un link
compartido, una notificación futura, una URL escrita). Ahí **sí** hay puerta, y
la puerta habla:

> **«Esta sección es de quien administra el negocio.»**

- **JAMÁS pantalla vacía** — una lista vacía dice «no hay nada», y sí hay: no es
  suyo.
- **JAMÁS error mudo** — un rebote silencioso a `Hoy` deja a la persona creyendo
  que tocó mal.

*Es L-178 y su mitad L-182 aplicadas juntas: un dato faltante jamás se disfraza
de permiso denegado, **y un permiso denegado jamás se disfraza de dato
faltante**.*

**La diferencia con §1, que es la que ordena todo esto:** en la **portada** el
candado desaparece porque ese lugar es de la persona; en una **ruta a la que
navegó** el candado habla, porque preguntó algo concreto y merece respuesta.

---

## 4. LO QUE VIAJA EN EL MISMO LOTE — firmado

1. **Los 8 sitios de la premisa caducada.** Mapa: el registro del guard de B.
   *Son las superficies que asumen «prestador = titular», la premisa que D-651
   probó falsa.*
2. **La celda «Your business» se gatea.** **Cura de superficie PURA** — el
   servidor ya está correctamente acotado (medido S87: el `CHECK` ata la fila a
   `auth.uid()`; no hay escalación). **Ojo: esto NO cura [[D-656]]** —
   *cerrar la puerta que no debía estar abierta y dejar de quemar a quien la
   cruzó son dos cosas, y la segunda es contrato.*
3. ~~**La quinta voz:** el empleado de negocio inactivo.~~
   ### ☠️ **RETIRADA DEL LOTE (S88) — no tiene caso vivo**

   **Lo medido, y corrige a esta misma lámina:** el conteo que fundaba esta fila
   —*"1 caso vivo"*— **contó empleados activos de negocio no activo SIN FILTRAR
   TITULARIDAD**. Re-medido bajo RLS con sus claims reales:

   ```
   el único caso ES EL TITULAR de ese negocio (es_titular = true)
   el embed prestadores(nombre_comercial) le devuelve "Carlos", NO null
   empleados activos NO titulares de negocio no activo  →  0
   ```

   La policy `prestador_own_profile` (`user_id = auth.uid()`) le da su fila
   **aunque el negocio esté `en_revision`**. ⇒ **`empleadoTitulo`/`empleadoDetalle`
   NO es alcanzable hoy por ningún camino.**

   > **Sin caso vivo no se construye: sería letra muerta con cara de cobertura.**
   > *Es la misma clase que el censo de contenedores de S87 — un conteo que mide
   > una cosa y se reporta como otra, y esta vez lo cometió la pista que pedía
   > medir para no construir a ciegas.*

   **ENTRA EN SU LUGAR, y como MEDICIÓN antes que construcción:** *¿qué ve hoy un
   **titular de negocio `en_revision`**?* Es el caso que **sí existe**. Primero
   por código (qué rama pinta `obtenerMiPrestador` con ese estado) — **sin tocar
   la cuenta de Carlos, que es una persona real**; si el código no alcanza, se
   siembra un titular de prueba `+s88` declarado como fixture. **Si hay voz que
   curar, se diseña con el caso vivo adelante.**

---

## 4bis. LO QUE YA ESTÁ LISTO PARA §1 *(S88)*

**El lector del profesional YA TRAE `empleado_id`.** Freno 1b de C resuelto: el
dato estaba **estampado desde S78** (medido hoy: **112 de 112 citas**, cero sin
persona, 4 personas distintas) y **ningún `select` lo exponía** — el motor sabía
y la app no podía preguntar.

**Ensanchado por puerta única:** `CitaAgendaPaseo` gana `empleado_id`, y los
**siete selects** de los cuatro oficios (los del día **y** los de detalle) lo
traen. Typechecks `api`/`cliente`/`prestador` verdes.

> **⚠️ Y la trampa escrita en el tipo, para que no se lea mal:** **`null` NO
> significa «de nadie»: significa DEL NEGOCIO** — la cita despegada por §11(a).
> *Un consumidor que lea `null` como «no es mía» hace invisible justo lo que la
> sección «Del negocio» existe para mostrar* (el atrape D-552, ya dos veces en
> la casa). **Hoy son 0 filas, así que el borde no se ve — y por eso se declara.**

---

## 5. Cómo se verifica que esto quedó bien

**Con dedos, no con typecheck.** Las tres credenciales de S87 existen para esto:

| cuenta | qué prueba |
|---|---|
| `guillo381+s87prof@gmail.com` | profesional con chips → techo con **sus citas** |
| `guillo381+s87recep@gmail.com` | recepción sin chips → techo con **el movimiento de la puerta** |
| `demo-prestador@epetplace.dev` | titular → **cuatro** tabs y la plata en la portada, intactas |

> **La regla que D-651 dejó y esta lámina hereda: «construido» y «verificado»
> se separan en el ROL.** *Un censo de paths habría dado cobertura sobre las
> cuatro superficies inalcanzables y ninguna estaba confirmada por un dedo.*
> **Ningún ítem de §4 se declara hecho sin la cuenta que lo alcanza.**

---

## 4ter. ENMIENDA S88 — EL HOME SE DEFINE POR ROL *(letra founder, gate del admin)*

**Hallazgo del gate:** el admin **cae en la pantalla de recepción** — el desvío
del home lo trata como mostrador.

> **La letra:** **el home se define POR ROL.**
> · **dueño y ADMINISTRADOR ven lo mismo** — el HOY del gestor.
> · **recepción ve la consolidada, con su verbo: ASIGNAR.**

*El admin no es un mostrador con más permisos: es el dueño menos una cosa
(crear admins). Mandarlo a la pantalla de recepción no es un desvío mal
configurado — es el producto diciéndole quién cree que es.*

### ⏱️ EL HALLAZGO DEL GATE (founder, 5-ago) — el home resuelve TARDE

**Literal:** el founder vio **la pantalla correcta CARGAR y después SALTAR a la
jubilada.**

> ### **El home no solo muestra la vieja: RESUELVE TARDE, y la vieja gana la carrera.**

⇒ **La lámina no pide solo «qué pantalla mostrar»: pide QUE EL ROL SE RESUELVA
ANTES DE PINTAR.** Sin parpadeo, sin salto, sin pantalla intermedia que se
corrige sola.

**Por qué esto es más que estética, y por eso está en la lámina y no en una
deuda de pulido:** *una pantalla que aparece y se corrige le enseña a la persona
que el producto no sabe quién es.* En el primer segundo de su casa. **Y el
segundo render borra el primero, así que el usuario recuerda el parpadeo y no la
pantalla correcta.**

*Es hermana de la Ley 13 (el error jamás se disfraza de vacío): acá lo que se
disfraza es un estado NO RESUELTO de un estado resuelto — y dura lo suficiente
para ser creído.*

**⚠️ Y su motor: ver [[D-660]]** — el rol `administrador`
tiene lectura perfecta y **escritura cero**. *Mandarlo al HOY del gestor sin
curar D-660 le muestra una casa donde no puede tocar nada.* **Las dos van en el
mismo lote.**

## 5bis. LÁMINAS HERMANAS

- **`LAMINA_MOSTRADOR_ORDEN.md`** — el orden de la pantalla del mostrador
  (fecha → botón → filtros → lista). **Aplica a TODOS los roles**, por eso vive
  aparte y no como sección de ésta.

---

## 6. Lo que esta lámina NO decide

- **El diseño fino del techo** (qué muestra exactamente «el movimiento de la
  puerta», con qué densidad): es de C, contra `DIRECCION_ARTE` y §15b.
- **El motor del administrador** (D-513 v2): sigue sin existir, y por eso el
  toggle de Administrador no se ofrece.
- **D-656**: contrato, ficha propia, disparo antes del soft launch.
