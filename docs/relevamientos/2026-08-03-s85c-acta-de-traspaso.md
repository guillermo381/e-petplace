# S85-C · ACTA DE TRASPASO

> **Qué es esto:** lo que una instancia de C que NO vivió la sesión no puede
> reconstruir leyendo el repo. Lo que ya está en el código —qué hace cada
> pantalla, qué comentario explica qué— queda AFUERA a propósito. Acá viven los
> **argumentos**, las **mediciones sin rastro en ningún commit**, y **lo que
> quedó a mitad de camino con su dueño**.
>
> **Territorio (76(d) · `METODO_TRES_PISTAS` §1): `docs/` es de A.** Esto es mi
> propia acta y cero doc ajeno tocado — **precedente exacto: el acta de cierre
> de C en S84** (`39379a0`), que se depositó con esta misma declaración.
>
> **Escrita para quien no estuvo.** Donde cito letra, cito su archivo.

---

## 1 · MIS DIECISIETE COMMITS, uno por uno

| # | hash | qué cura |
|---|---|---|
| C1 | `d2ff86e` | **D-595** — el GPS dejaba de repartir con dos paseos vivos, y terminar uno mataba la captura del otro. **Cerrada en campo por el founder** (`9f5fe6f`) |
| C2 | `455c18d` | **El lote Cuenta** — cuatro puertas por audiencia · documentos en tres capas · **D-633** (la copia de países muere) |
| C3 | `22fbc19` | ☠️ el experimento del fondo transparente, con lápida |
| C4 | `d2a1fea` | `permiso_funcionamiento` gana pantalla · el nombre del negocio en UNA transacción |
| C5 | `78d7c5b` | el nombre de la persona sale de Seguridad |
| C6 | `b5747c0` | el escudo de Seguridad (reusa `seguros`, con la colisión declarada) |
| C7 | `8d881c0` | **Tu día** — la rueda de B montada |
| C8 | `d1420a7` | ☠️ **Semana muere** con su lápida · la franja nueva nace en 3 |
| **C9** | `24136a4` | **el tope del cupo sale del catálogo** — muere `max={4}` |
| **C10** | `68e250e` | 🔴 **el trinquete** |
| C11 | `a1ec2b6` | el lápiz y la galería |
| C12 | `6d21927` | las dos piezas de DATOS, sueltas |
| C13 | `699cf99` | el lápiz separado, en vidrio |
| C14 | `2914c70` | el `compileSdk` de la sonda |
| C15 | `508427a` | el servicio exclusivo lo DICE |
| C16 | `9990bff` | la sonda temporal del cupo |
| **C17** | `a5de747` | **el clamp que aplastaba el valor real** |

---

## 2 · ⭐ LA LECCIÓN DEL TALLER — C9 · C10 · C17

**Es el hilo más largo de la sesión: tres curas sobre el mismo control, y las
dos primeras produjeron el defecto siguiente.**

### C9 — el tope sale del catálogo
`max={4}` estaba escrito a mano. **Quedó viejo sin que nada fallara** el día que
A subió `cupo_techo` a 10: el motor aceptaba diez y la pantalla cortaba en
cuatro. Lo reemplacé por el techo del catálogo **y agregué una protección**:

```ts
max={Math.max(techoDelOficio, cupoSel)}
```

Mi nota de entonces, textual: *"para que un techo caído no deje un stepper por
debajo de lo que la franja YA declara (mostraría 3 con tope 1, que es un control
mintiendo sobre su propio valor)"*.

### C10 — el trinquete
Con el techo llegando en 1, ese `Math.max` hacía que **`max` valiera el valor
vigente**. Literal del founder: *"deja disminuir pero no aumentar. Lo bajé a 3 y
me dejó, lo traté de subir a 4 y no me dejó"*.

> **Un tope que se mueve con el dato no es un tope: es un trinquete.**

Lo saqué. **Y con eso reabrí exactamente lo que C9 protegía.**

### C17 — el clamp, y la distinción que faltaba
Literal del founder: *"en la franja, antes de entrar a editar dice 4; le doy
clic y está en 1, como si hubiera dos datos diferentes"*.

**No eran dos datos.** La lista pinta `f.cupo` crudo; el stepper pinta
`Math.min(Math.max(valor,min),max)` — con el techo en 1, **el componente clampea
el 4 a 1**.

> ### **EL DEFECTO NUNCA FUE EL `Math.max`. ERA SU OPERANDO.**
>
> · **`cupoSel` SE MUEVE mientras editás** ⇒ el tope persigue al dedo ⇒ trinquete
> · **`cupoBase` es FIJO desde que la franja se abrió** ⇒ el 4 se ve, no se
>   inventa un 5, y el trinquete no vuelve
>
> **Los dos defectos eran reales y cambié uno por el otro.** Las dos veces el
> código se veía correcto al leerlo.

**Lo que esto deja para quien siga:** cuando una cura reintroduce el defecto que
la anterior arreglaba, **la pregunta no es cuál de las dos versiones era buena —
es qué distinción no se hizo.** Acá era *valor en edición* vs *valor de
apertura*, dos cosas que se llamaban casi igual.

### La causa raíz NO era mía y sigue con A
El techo llegaba en 1 porque **`prestador_servicios` no tiene FK declarada a
`tipos_servicio`** (verificado en `database.types.ts`: sus únicas relaciones son
las dos de `prestador_id`). Sin FK, PostgREST **no puede embeber**
`tipos_servicio!inner(cupo_techo)` → error → y las dos funciones del techo hacen
`if (error || !Array.isArray(data)) return 1;` — **el fallo devuelve un número
legal y creíble**.

> **Por eso sobrevivió a tres mediciones que apuntaron a lugares correctos.** A
> midió la **DB** (10 ✅, por SQL directo). Yo medí la **pantalla** (1, y lo
> reportaba bien). **Nadie midió el tramo del medio**, y ese tramo tiene un
> `catch` que convierte un fallo en un dato plausible. Es **L-192** en su forma
> más cara.

**A lo está curando** (el embed + matar el `return 1` mudo).

---

## 3 · 🔴 LO QUE QUEDA SIN ANCLAR

**El founder está mirando `68e250e`** — probado por contenido:
`merge-base --is-ancestor 508427a 6a9f1a4` da **NO**, y el último commit de
`seccion-horarios.tsx` dentro de ese ancla es `68e250e` (19:00). Por eso ve la
frase duplicada y el `+` muerto: **no hay nada que curar, hay que anclar
después.**

| commit | en origin | qué lleva |
|---|---|---|
| `699cf99` | ✅ | el lápiz separado, en vidrio |
| `2914c70` | ✅ | **el `compileSdk`** — destraba la build 1.0.3 |
| `508427a` | ✅ | **el duplicado de `vozTecho` Y el `+` muerto** (los dos síntomas del founder) |
| `9990bff` | ⚠️ **FUERA** | la sonda |
| `a5de747` | ⚠️ **FUERA** | **el clamp** |

> **⚠️ `9990bff` y `a5de747` NO están en origin.** Regla 79: ningún OTA se
> publica con ancla fuera de origin. **Hay que pushear antes de anclar.**

**☠️ La sonda `9990bff` tiene condición de retiro escrita:** se va **cuando A
cure el embed y el founder confirme "Hasta 10"**, en el mismo commit de la cura.
Va en `__DEV__`, así que **no habla en el APK del founder** — sirve con cable o
en dev.

---

## 4 · EL ESTADO DEL LOTE DATOS

### Qué construí: `components/datos-piezas.tsx` (`6d21927`)
**`BloqueEquipo`** y **`BloquePlata`**, sueltas. Son las **únicas dos franjas
cuyos lectores ya existen** (`obtenerEquipoNegocio` ·
`obtenerResumenPendienteLiquidar`).

### Por qué NO monté la tab ni su shell
**La tab:** su eje firmado es *"a quiénes cuido"*. Una tab que abriera con
**equipo y plata** —el negocio— sin las vidas ni las familias **no sería
incompleta: sería INVERTIDA**, y diría lo contrario de su letra. La mesa aceptó
este argumento dos veces (también para "Necesita tu atención").

**El shell, y esto lo decidí yo con la orden permitiéndolo:** un shell es una
**composición** —qué preside, qué sigue, con cuánto aire— y esa decisión se toma
con el bloque que preside **a la vista**. Componer alrededor de las dos franjas
secundarias y meterle después las vidas arriba es componer dos veces, la segunda
contra una forma ya vista.

> **EL SHELL NACE CON SU EJE.**

### Qué franja espera qué

| franja | estado | qué falta |
|---|---|---|
| **① las vidas** + chips ACTIVOS/HISTÓRICO | 🔴 | el predicado tiene **tres patas** y llega **una**: `ultima_atencion` ✅ · **cita futura** ❌ · **memorial** ❌. Memorial mal clasificado pone una mascota muerta en "activos" |
| **② familias** | 🔴 **muro de RLS** | no es un lector que falta. `mascotasPrestador.ts:7` lo dice: *"familia humana NO — policies"*. Hueco §6.4.5 |
| **③ la plata** | 🟡 construida | falta **`$ del día` = lo AGENDADO** (decisión de mesa, `d1fdc3a`) |
| **④ equipo** | ✅ construida | — |
| **⑤ trayectoria** | 🔴 **sin lector y sin pedir hasta que lo declaré** | fue **hueco de mi censo**, lo reconocí |
| **la ficha de mascota** | 🔴 | el filtro de **`BIO_EXPEDIENTE` §A3.5bis** — y **no puede vivir en la pantalla: es autorización** |
| **la 4ª tab** | ⏸️ | nace con ① |

### "Necesita tu atención" — 2 de 4 fuentes

| fuente | estado |
|---|---|
| ① por coordinar | ✅ existe y **ya está en pantalla** |
| ② presupuestos sin respuesta | ✅ `obtenerPresupuestosPrestador` trae `estado` y `vence_en` |
| ③ handshakes pendientes | 🔴 el lector es **del DUEÑO** (`obtenerSolicitudesPendientesDueno`) |
| ④ atenciones sin cerrar | 🔴 no existe — los `obtenerCitas*DelDia` solo ven **el día** |

> **⚠️ Por qué esto es peor que una franja faltante de DATOS:** el bloque se
> llama *"Necesita tu atención"* y **su promesa es la COMPLETITUD**. Vacío
> significa "estás al día". **Y el peor de los cuatro es ④: una atención sin
> cerrar es plata sin devengar** (el devengo ocurre al cerrar con calidad,
> variante (b) S54) ⇒ le ocultaría dinero no cobrado mientras le dice que no le
> falta nada. **Miente por omisión.**

---

## 5 · LO QUE MEDÍ Y NO ESTÁ EN NINGÚN COMMIT

### El censo del árbol de Cuenta (S85, primera tarea)
- **Cuatro filas desnudas** (sin superficie): la galería del índice · la celda
  de identidad · **las dos celdas comerciales del Perfil**. Las cuatro
  resueltas.
- **Las dos celdas comerciales de `perfil.tsx` (1318 y 1341) apuntaban al MISMO
  destino** — el comentario de C34 decía *"había DOS celdas y ahora hay una"* y
  había dos.
- **`Tus datos` llevaba a una pantalla titulada "Seguridad"** — se tocaba una
  cosa y se aterrizaba en otra (17.3).
- **`nombre_comercial` vive en DOS columnas** (`prestadores` y
  `cuentas_comerciales`), nacen iguales del alta (`invitar_prestador` escribe el
  mismo valor en las dos) y **no había escritor para ninguna**. Por eso la
  edición se hizo **atómica por RPC** — evitar la primera divergencia, no
  reparar una existente.
- **`profiles.nombre` quedó sin superficie de edición en toda la app del
  prestador** (D-637). Es **precio aceptado**, no defecto: `handle_new_user`
  siembra desde el local-part del correo, así que un nombre mal sembrado no
  tiene cómo corregirse desde la app.

### El mapa de recuperar-contraseña
- **Dos puertas:** `login.tsx:110` y el rebote `sin_contrasena` de Seguridad.
- **Dos pasos, un wrapper:** `pedirCodigoRecuperacion` (devuelve **ok siempre**,
  exista la cuenta o no) → `canjearCodigoRecuperacion` (`verifyOtp` +
  `updateUser`).
- **⭐ EL DISCRIMINADOR, que es lo que no se reconstruye leyendo:** los dos
  pasos fallan con **voces distintas**, y esa diferencia es la prueba entera —
  *"Ese código no es válido o ya venció"* = falló `verifyOtp` (el camino sigue
  en pie) · ***"Ocurrió un error inesperado"* = falló `updateUser` ⇒ la sesión
  de `verifyOtp` NO alcanzó ⇒ el camino del código se cae.**
- 🔴 **Y el founder ya lo probó en campo: el correo no trae código — trae un
  link al portal de prestadores ANTIGUO** (registrado por A en `f05412b`). El
  gate mira pantallas; esto se cae por el correo.

### El tamaño del lote DATOS
**~640 líneas mías + tres piezas de A.** Construible sin motor: **~200**. El
argumento que la mesa aceptó para diferirlo **no fue el tamaño** — fueron las
dependencias de motor y el muro de RLS.

### Otros
- **Los cuatro `> 4` hardcodeados** del wrapper están **muertos** (solo lápidas).
- **`cohorte_periodo` es columna sin wrapper** ⇒ la insignia del emblema **no se
  monta**. **L-195** (de A, esta sesión): *una columna que EXISTE no es una
  columna POBLADA*.
- **El experimento del fondo transparente perdió su único sujeto** cuando
  enterré `cuenta/identidad` — por eso murió con lápida y no en silencio.

---

## 6 · MIS PENDIENTES CON A

| pedido | qué destraba | prioridad |
|---|---|---|
| **el embed sin FK + matar el `return 1` mudo** | **el bug del taller** — causa raíz | 🔴 |
| **`$ del día` = lo AGENDADO** | **tres cosas de una vez**: el techo con los tres números de `PORTAL_PRESTADOR` §2.4bis · **"Cómo va"** · el número que falta en `BloquePlata` | 🔴 **el que más rinde** |
| **lectores de vidas** (`+ cita futura`, `+ memorial`) | ① y **con ella nace la tab por su eje** | 🔴 |
| **familia** | ② — **decisión de RLS, no un `select`** | 🔴 |
| **⑤ trayectoria** | la franja entera (hechos, jamás score — §2.7) | 🟠 |
| **handshakes del prestador · atenciones abiertas** | "Necesita tu atención" completa. **④ toca plata** | 🟠 |
| **`cohorte` expuesta** | la insignia del emblema, con `superficie="muro"` OBLIGATORIO (sin eso da **1.03** en claro) | 🟡 |

---

## 7 · TRES COSAS DE MÉTODO QUE COBRARON

**① El árbol compartido frenó mis commits CUATRO veces** (WIP de B o de A en
vuelo, tsc o lint rojo por causa ajena). Las cuatro se saltaron con
`SALTAR_GATE` **declarado y probado** (midiendo que el rojo no viajaba a `main`).
Es **D-586 / regla 85** cobrando en vivo. **La mesa firmó bundlear desde un
worktree en detached** — no se implementó hoy (*no se cambia el vehículo el día
del viaje*) y queda para la próxima con **tres casos de S85** como evidencia.

**② El ancla se movió entre la declaración y el bundle TRES veces**, y las tres
las cazó el paso ⓪. Ninguna fue descuido: el ancla **se declara en un momento y
se lee en otro**, con tres pistas sobre un árbol compartido.

**③ Una orden citó una referencia que no existía** (*"tomá como referencia la
app del cliente"* para el glifo `lapiz` — medido: el cliente **no lo usa en
ningún lado**). Se declaró en vez de inventarla, y se tomó la que **sí** estaba
medida: el engranaje del muro.

---

*Depositada por C al cierre de S85. Nada de acá está firmado: son commits,
mediciones y pendientes. Lo que rige sigue siendo el canon.*
