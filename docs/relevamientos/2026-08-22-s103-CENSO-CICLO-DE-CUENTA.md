# CENSO DEL CICLO DE CUENTA — S103-A, 22-ago-2026

**Encargo de la mesa (founder, 22-ago):** *el ciclo de cuenta completo, que es
precondición declarada de tiendas y del destino (`DEFINICION_SOFTLAUNCH` §3.5).*
**Alcance:** cambiar correo · cambiar clave · cerrar cuenta · invitar a un
miembro de la familia — **en las dos apps.**

**Primer acto: CENSO. Cero código.** *No se construye hasta que la mesa vuelva:
el borrado depende de `P15`, que sigue candidata sin firma, y su forma la fija
esa firma.*

---

## ⓪ MÉTODO — y cada medición con su control

Se midió contra **tres objetos distintos**, y se declara cuál en cada caso:
**el árbol** (`main` en `09a44325`, worktree A), **la base** (remoto linkeado,
`zyltipqscdsdsxnjclhp`) y **los diccionarios** (`i18n/es.ts` de cada app).

**Todo censo negativo lleva su control positivo al lado** — *un grep que devuelve
vacío porque el término no existe se lee igual que uno que devuelve vacío porque
el grep está mal escrito.*

---

## ① LA TABLA — las cuatro capacidades, las dos apps

| | **CLIENTE** | **PRESTADOR** | **BASE** |
|---|---|---|---|
| **cambiar clave** | ❌ **no hay camino** | ✅ `cuenta/seguridad.tsx` | Supabase Auth |
| **recuperar clave** | ❌ *(no censado en detalle)* | ✅ por código, 3 pasos | Supabase Auth |
| **cambiar correo** | ❌ **no existe** | ❌ **no existe** | — |
| **cerrar cuenta** | 🟡 entrada + voz honesta | 🟡 entrada + voz honesta | ❌ **cero RPC** |
| **invitar a la familia** | 🟡 entrada + «Pronto» | *(no aplica)* | ❌ **cero tabla, cero RPC** |

---

## ② CAMBIAR CLAVE — **construido en una app y ausente en la otra**

**PRESTADOR — existe y está completo.** `apps/prestador/src/app/(tabs)/cuenta/seguridad.tsx`
llama `cambiarContrasena({ actual, nueva })`. El wrapper vive en
`packages/api/src/wrappers/seguridad.ts` y expone **cuatro** funciones:

```
cambiarContrasena · pedirCodigoRecuperacion
verificarCodigoRecuperacion · establecerContrasenaNueva
```

**CLIENTE — no hay camino.** Censo sobre `cuenta/index.tsx`: **cero menciones**
de `seguridad`, `Seguridad`, `contrasena` o `Contrasena`. **No existe la
pantalla ni la entrada.** *Y no hay `seguridad.tsx` en el árbol del cliente —
verificado por `find`.*

> ### 🔴 **El wrapper es COMPARTIDO y solo lo consume una app.**
> `seguridad.ts` vive en `packages/api`, o sea que **ya está disponible para el
> cliente**: la familia no puede cambiar su clave **no porque falte motor, sino
> porque falta la pantalla.** *Es `L-318` en su forma más barata de pagar —
> media hora de superficie contra una capacidad que ya existe y ya se probó.*

---

## ③ CAMBIAR CORREO — **no existe en ningún lado, y es la única de las cuatro que no tiene ni entrada**

**Censo en `apps/` + `packages/api/src`** con seis variantes del término
(`cambiar.*correo`, `cambiar.*email`, `nuevoCorreo`, `nuevoEmail`,
`correoNuevo`): **un solo hit, y es un COMENTARIO** —
`apps/prestador/src/app/(tabs)/cuenta/perfil.tsx:1495`, dentro de la
justificación del rótulo *«Nombre y acceso»*:

> *«medido contra el contenido real (nombre · correo de ingreso · **cambiar
> clave · cambiar correo**): uno es identidad y tres son acceso»*

**Control positivo:** `correo` aparece **4 veces** en el diccionario del cliente
⇒ *el grep encuentra lo que hay.*

🔴 **Y acá hay una divergencia de las que la mesa pidió declarar — chica pero
real: el rótulo se ELIGIÓ contra un contenido que incluye «cambiar correo», y
ese contenido no existe.** El rótulo *«Nombre y acceso»* se argumentó midiendo
cuatro cosas, **de las cuales dos no están construidas**. *No miente al usuario
—el rótulo no promete nada— pero sí deja escrito en el canon un argumento
apoyado en una premisa que la base no sostiene.* **La ficha del rótulo ya se
declara PROVISIONAL, así que el arreglo es de una línea cuando se firme.**

---

## ④ CERRAR CUENTA — **las dos apps dicen la verdad, y la base no puede cumplirla**

**LO QUE HAY, en las dos apps:** una entrada visible (`Boton variante="ghost"`
en el prestador; equivalente en el cliente) que **abre una Hoja con una voz
honesta y un botón «Entendido».**

**El literal, verbatim** (idéntico en las dos):

> *«Va a estar acá, con todas las de la ley. Antes tenemos que resolver bien qué
> pasa con la historia de tus mascotas, tus co-dueños y tus hitos — **una vida
> documentada no se borra a la ligera**.»*

> ### ✅ **NO HAY DIVERGENCIA — y conviene decirlo con todas las letras, porque `D-337` está escrita como «el botón existe y no ejecuta».**
> **Es cierto que no ejecuta. Y es cierto que NO PROMETE ejecutar.** La pantalla
> **dice que la función no está todavía y da su razón.** *La divergencia que esta
> casa castiga es la promesa incumplida en silencio; acá la promesa nunca se
> hizo.* **`D-337` es un HUECO DECLARADO, no un defecto de honestidad** — y la
> distinción importa porque cambia la urgencia: *no hay nadie engañado hoy.*

**LO QUE LA BASE DICE, y es la medición que decide la FORMA de la cura:**

| | |
|---|---|
| **FKs que apuntan a `auth.users`** | **62** |
| **BLOQUEANTES** (`NO ACTION` / `RESTRICT`) | **24** |
| `CASCADE` | 21 |
| `SET NULL` | 17 |
| *control positivo* | *657 FKs en la base ⇒ la consulta mide* |

**Las 24 bloqueantes incluyen, textual:** `pagos_intentos` · `pedidos` ·
`compras` · `evento_cita_servicio` · `consentimientos` · `bonos` ·
`suscripciones_servicio` · `donaciones` · `estadias` · `programas_contratados` ·
`prestador_empleados` (×2) · `empleado_invitaciones` · `empleado_roles` ·
`refugios` · `solicitudes_adopcion` · `admin_users` · …

> ### 🔴 **UN `DELETE` DE USUARIO REBOTA HOY. Y si alguien «arreglara» eso pasando las 24 a CASCADE, el borrado se llevaría los consentimientos y los intentos de pago.**
> *Las dos mitades son igual de graves y apuntan a la misma conclusión:*
> **«cerrar cuenta» NO PUEDE SER UN BORRADO.** Las 24 bloqueantes lo impiden, y
> las 21 que ya cascadean son las que lo volverían peligroso si se forzara.
> **`consentimientos` es el caso testigo: es el registro de que la persona
> aceptó algo — el dato que hay que CONSERVAR justamente para poder demostrar
> qué se le prometió.**

**Es la misma clase que S92 midió con `mascotas`** (80 FKs, 40 bloqueantes) y
que ya tiene precedente resuelto en la casa: **las 64 cuentas de sonda se
borraron de `auth` y sus datos se MARCARON, no se destruyeron.** *Ese precedente
es el insumo directo de `P15`.*

**Y el segundo insumo, que ya es letra firmada:** `POLITICAS` **P23** — *el
borrado deja el archivo **inalcanzable, no lo sobrescribe**; ante un derecho de
supresión la respuesta honesta es «ya no es accesible por ningún medio del
producto», **jamás «fue destruido»**.* **P15 tiene que ser coherente con P23 o
una de las dos se cae.**

---

## ⑤ INVITAR A LA FAMILIA — **el hueco más profundo de los cuatro**

**PANTALLA (cliente):** `cuenta/familia.tsx` monta una celda
`familiaInvitar: 'Invitar a alguien de tu familia'` con la insignia
`familiaInvitarPronto: 'Pronto'`. **Honesta.** *Su propia cabecera lo declara:
«co-dueño como hueco declarado con "Pronto"».*

**WRAPPER:** `packages/api/src/wrappers/familia.ts` expone **dos** funciones —
`obtenerMiFamilia` y `renombrarFamilia`. **Ninguna de invitación.**

**BASE:**

| | |
|---|---|
| tabla `invitaciones` | ❌ **no existe** |
| tabla `invitaciones_familia` | ❌ **no existe** |
| tablas con `invit` en el nombre | **`empleado_invitaciones`** — y **solo esa** |
| RPC de invitación familiar | ❌ **ninguna** |
| *control positivo* | *680 funciones en `public` ⇒ el censo mide* |

> ### 🔴 **PERO EXISTE LA MÁQUINA ENTERA, CONSTRUIDA PARA EL OTRO ACTOR.**

El arco del **empleado** resolvió exactamente el mismo problema —*invitar por
correo a alguien que puede no tener cuenta, y activarlo cuando entra*— y tiene
**tabla + seis RPCs vivas**:

```
invitar_prestador(…)              email_status_para_invitacion(text)
existe_invitacion_pendiente(uuid) aceptar_invitacion_pendiente_login(uuid)
rechazar_invitacion_pendiente_login(uuid)  marcar_invitacion_aceptada(uuid)
```

**Es el mismo problema con otro sujeto**, y la casa ya pagó su diseño: el
handshake al login, el estado pendiente, la verificación de si el correo ya
tiene cuenta. *La invitación familiar no arranca de cero: arranca de un molde
probado.* **Y `D-509` ya midió el borde caro de ese molde —el link sin canal—,
así que la deuda de ese camino también está levantada.**

**Lo que NO se puede copiar y hay que decidir:** `empleado_invitaciones` invita
a **trabajar en un negocio**; la familiar invita a **ver el expediente de una
mascota**. *El molde sirve para el mecanismo; el ALCANCE de lo que se concede es
decisión de letra, no de copia.*

---

## ⑥ EL PRESTADOR QUE SE VA — **hay estado vivo, y no es poco**

**Medido contra la base, hoy:**

| | total en la base | peor caso, un solo prestador |
|---|---|---|
| citas futuras firmes (`confirmada`/`en_curso`, fecha ≥ hoy) | **17** | **17** (`de300000…00e5`) |
| empleados activos | **27** | **2** |
| eventos económicos sin liquidar (`liquidacion_id IS NULL`) | **36** | *no desagregado* |

**Las tres son obstáculos de NATURALEZA DISTINTA, y por eso no hay una sola
regla:**

**① Las citas futuras son de TERCEROS.** Una familia reservó y pagó. *El
prestador no puede irse llevándose una cita que otro compró* — su baja tiene que
resolver **qué pasa con esa cita**, y las salidas (reasignar · cancelar con
reembolso · bloquear la baja hasta que no queden) son **decisión de letra**, no
de código.

**② Los empleados son PERSONAS con acceso.** `dar_de_baja_empleado(uuid)` ya
existe y es atómica **con anti-lockout del titular** (S77). *La pieza existe; lo
que no existe es quién la llama cuando el titular se va.*

**③ Los 36 eventos sin liquidar son PLATA que se le debe a alguien.** *Cerrar
una cuenta con saldo por liquidar no es un problema de datos: es no pagarle a
quien trabajó.*

⚠️ **Y las reglas ya están NOMBRADAS en el código, sin escribir** — el comentario
de la Hoja del prestador lo dice literal:

> *«Eliminar cuenta — P17 §4: la entrada existe y dice su verdad; **las reglas
> (citas pagadas, planes vivos, saldo por liquidar) se escriben como enmienda de
> letra ANTES de construir**.»*

**Quien escribió esa pantalla ya sabía qué faltaba y lo dejó anotado donde se
lee.** *Este censo no descubre las tres reglas: confirma que siguen sin
escribirse.*

---

## ⑦ LAS DIVERGENCIAS — el veredicto que la mesa pidió

**La orden fue:** *«gana lo prometido o se corrige la promesa, jamás divergen en
silencio».* **Veredicto: NO HAY NINGUNA DIVERGENCIA DE PROMESA AL USUARIO.**

| superficie | promete | hace | veredicto |
|---|---|---|---|
| cerrar cuenta (×2 apps) | *«va a estar acá»* | abre una Hoja y explica | ✅ **honesta** |
| invitar a la familia | *«Pronto»* | nada | ✅ **honesta** |
| cambiar clave (prestador) | cambiar la clave | la cambia | ✅ **cumple** |
| cambiar clave (cliente) | — *(no hay entrada)* | — | ✅ **no promete** |
| cambiar correo | — *(no hay entrada)* | — | ✅ **no promete** |

**La única divergencia medida no es de pantalla: es de CANON.** El argumento del
rótulo *«Nombre y acceso»* se apoya en cuatro contenidos y **dos no existen**
(§③). *Nadie lo lee salvo quien vuelva a decidir ese rótulo — y ése es
exactamente quien puede quedar mal parado.*

> **La conclusión honesta de este censo, y va sin adornos: el ciclo de cuenta no
> está roto — está AUSENTE, y lo dice.** *Eso es mejor de lo que la ficha
> `D-337` sugería, y no cambia que sea precondición del destino.*

---

## ⑧ LO QUE NO MEDÍ — declarado para que nadie lo lea como completo

- **La recuperación de clave del CLIENTE.** Se midió que no hay pantalla de
  *cambio*; **no se censó el flujo de *recuperación*** (el «olvidé mi clave» del
  login). *Son dos cosas distintas y solo una está medida.*
- **Si Supabase Auth tiene la confirmación de correo encendida** en este
  proyecto — se mide en el panel, no por SQL (precedente `D-299`), y **eso
  decide la mitad de «cambiar correo»**: sin confirmación, cambiar el correo es
  entregarle la cuenta a quien escriba mal una letra.
- **Los 36 eventos sin liquidar, desagregados por prestador.** El total es real;
  el peor caso individual **no se midió**.
- **Qué RLS gobierna `empleado_invitaciones`**, que es lo que habría que
  replicar si el molde se reusa.

---

## ⑨ LO QUE LA MESA TIENE QUE DECIDIR — cuatro cosas, y solo una es de código

**① `P15` — la forma del cierre de cuenta.** *Sin esa firma no hay nada que
construir*, y este censo le entrega su insumo: **no puede ser un DELETE** (24
FKs bloqueantes; 21 CASCADE que se llevarían consentimientos y pagos) y **tiene
que ser coherente con `P23`**, que ya firmó *«inalcanzable, no destruido»*.
**Precedente de la casa: las 64 sondas de S92 —cuentas borradas, datos
marcados.**

**② Las tres reglas del prestador que se va** — citas de terceros · empleados
con acceso · saldo por liquidar. **Ya están nombradas en el código y sin
escribir.** *Enmienda de letra ANTES de construir, como su propio comentario
pide.*

**③ El alcance de la invitación familiar.** El mecanismo se copia del molde del
empleado; **lo que se concede al invitado es letra** — `P1` sigue siendo el
hueco.

**④ Y la única barata, que no necesita mesa: la pantalla de cambiar clave del
CLIENTE.** El wrapper compartido ya existe y ya se probó en el prestador.
*Es superficie sobre motor vivo* ⇒ **dueño C**, cuando la mesa lo suelte.

---

*Censo ejecutado por S103-A. Cero código, cero migraciones, cero escritura en la
base. Todas las consultas de solo lectura.*
