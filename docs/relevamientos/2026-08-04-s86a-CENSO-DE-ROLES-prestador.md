# S86-A · CENSO DE ROLES DE LA APP DEL PRESTADOR — qué ve cada uno HOY

> **Para la mesa. NO es un plan de construcción.** Medido contra **el código
> vivo** (`apps/prestador/src`, ancla `26260f1`) **y contra el motor** (la DB
> `zyltipqscdsdsxnjclhp`, leída hoy) — **jamás contra la letra.**
>
> **Se declara el CAMINO DE GATE, no el path (L-161).** Un path prueba que el
> código existe; **no prueba que exista un dedo capaz de llegar.**

---

## 0 · ⚠️ EL HALLAZGO QUE ORDENA TODO LO DEMÁS: **UN ROL NO EXISTE, Y OTRO YA LLEGÓ SIN QUE EL CÓDIGO SE ENTERE**

**Las 12 filas de empleado ACTIVAS en la DB, agrupadas por lo que el código pregunta:**

| rol | ¿existe? | filas | dónde |
|---|---|---|---|
| **TITULAR** (fila `dueño`) | **SÍ** | **7** | uno por negocio |
| **ADMIN** (`rol='administrador'`) | **☠️ NO — CERO FILAS EN TODA LA DB** | **0** | — |
| **RECEPCIÓN** (activo · no titular · **0 chips**) | **SÍ** | **1** | Clínica Aurora |
| **EMPLEADO CON CHIPS** | **SÍ** | **4** | Aurora ×2 (6 chips c/u) · Los Shyris ×1 (1) · Paseos Andres ×1 (6) |

> ### ☠️ **HALLAZGO A — «ADMINISTRADOR» ES UN ROL SIN UN SOLO PORTADOR.**
> Todo predicado que dice `['dueño','administrador']` **hoy se resuelve
> ENTERAMENTE por el brazo `dueño`.** *La rama `administrador` de cada gate del
> código nunca se ejecutó en producción.* **Ninguna superficie de este censo
> distingue hoy TITULAR de ADMIN — no porque estén unificadas, sino porque el
> segundo no existe.** ⇒ **toda fila «ADMIN» de las tablas de abajo es
> TEÓRICA**, y se marca como tal.

> ### 🔴 **HALLAZGO B — LA BARRA DE TRES YA ES ALCANZABLE, Y EL CÓDIGO CREE QUE NO.**
> `app/(tabs)/_layout.tsx:305-311` declara, textual: *«**INERTE hoy: solo el
> titular llega**, y el titular es gestor → el tab aparece siempre»*.
> **La DB dice otra cosa: hay CINCO filas activas no-titulares** (4 con chips +
> 1 recepción) **en negocios `activo`**, y la puerta (`obtenerMiPrestador`, R1
> desde S75) **resuelve por titularidad O VÍNCULO ACTIVO**.
> **⇒ esas cinco personas ven HOY la barra de tres**, sobre un diseño que —por
> palabra del propio archivo— **nunca se diseñó para ser visto.**
> *Es **L-193** en su forma exacta: una premisa heredada que nadie volvió a
> fechar. Era verdad en S75 (0 empleados activos); dejó de serlo y **nadie
> recibió un rojo**, porque el comentario no es un guard.*

---

## 1 · LA PUERTA — quién entra al portal *(camino de gate: abrir la app con sesión)*

`app/(tabs)/_layout.tsx`

| condición | línea | a dónde va |
|---|---|---|
| sin sesión | `:215` | `BienvenidaPrestador` |
| `obtenerMiPrestador` falla | `:219` | voz `sin_rol` — **incluye el borde declarado**: empleado activo de un negocio **no**-`activo` cae acá |
| `estado !== 'activo'` | `:118` | `/sala-espera` — **LISTA BLANCA**: todo lo que no sea `activo` |
| gestor + primer ingreso | `:130` | `/bienvenida-dia1` (una sola vez, del motor) |
| invitación pendiente | `:209` | `/invitacion` |

**⇒ ENTRAN: titular de negocio activo · cualquier empleado ACTIVO de negocio activo.**
**Carlos (`en_revision`) NO entra** — su titular vive en la sala de espera.

---

## 2 · LA BARRA — *camino de gate: la barra inferior, siempre visible*

**Predicado único:** `esGestor = empleadoTieneRol(prestador, ['dueño','administrador'])` — `_layout.tsx:122`. **Falla de lectura ⇒ `false`** (Ley 23: ante la duda se cierra).

| tab | TITULAR | ADMIN *(teórico)* | RECEPCIÓN | EMPLEADO c/chips |
|---|---|---|---|---|
| **HOY** | visible | visible | visible | visible |
| **DATOS** | visible | visible | visible | visible |
| **NEGOCIO** | **visible** | visible | **☠️ OCULTO** | **☠️ OCULTO** |
| **CUENTA** | visible | visible | visible | visible |

> **⚠️ OCULTO ≠ CERRADO, y es un hallazgo de seguridad de navegación:**
> `<Tabs.Screen name="negocio" />` **se declara SIEMPRE** (`:380`) — solo el
> **ítem de la barra** es condicional (`:327`). **La RUTA sigue montada**: un
> deep link o un `router.push('/(tabs)/negocio')` la abre para cualquiera.
> **Lo que la salva no es la barra: es el `useGateGestor` de adentro**
> (`negocio.tsx:247` → `Redirect` a `/(tabs)`). *La barra es cosmética; el gate
> real está una capa más adentro — y eso está bien, pero conviene saberlo.*

---

## 3 · TAB **HOY** — *camino: barra → HOY*

**La bifurcación mayor de la app.** `app/(tabs)/index.tsx:700-725`:

```
recepción ⟺ fila activa · NO titular · CERO chips
```

| rol | qué renderiza | línea |
|---|---|---|
| TITULAR | la jornada completa | — |
| ADMIN *(teórico)* | la jornada completa *(no distingue)* | — |
| **RECEPCIÓN** | **`AgendaRecepcion` — pantalla DISTINTA, early return** | `:720` set · `:1425` render |
| EMPLEADO c/chips | la jornada completa | — |

**Detalles medidos, los dos deliberados y declarados en el código:**
- **Ante CUALQUIER fallo de lectura cae a la jornada normal** (`:704-706`): *un
  falso-recepción escondería la jornada del titular, que es peor.* **La RLS es
  la que restringe de verdad.**
- **Cuesta +3 viajes en todo arranque del HOY** (D-497). La cura —resolvedor
  cacheado— **es pedido a A y no está hecho**.

🔴 **REGRESIÓN VIVA (gate del founder, S86): «lo vivo desaparece al cambiar de
día».** Sin curar al escribir este censo. Sospechosos por forma:
`vistaEsHoy ? … : []` (`:1166`) y el desacuerdo entre el comentario `:1575`
—*«el gate ya NO es `vistaEsHoy`»*— y los gates de `:1147` y `:1587`, que
**todavía lo son**.

---

## 4 · TAB **DATOS** — *camino: barra → DATOS*

`app/(tabs)/mascotas.tsx`. **El tab NO tiene gate de rol** — entra todo el
equipo. **La modulación es POR PIEZA, y cada una trae la suya:**

| pieza | TITULAR | ADMIN *(teór.)* | RECEPCIÓN | EMPLEADO | predicado |
|---|---|---|---|---|---|
| KPIs · día-por-día · mix · trayectoria | visible | visible | visible | visible | ninguno |
| **LA PLATA (KPI + sección)** | **visible** | visible | **☠️ OCULTA** | **☠️ OCULTA** | **`datos.plata.visible`** — resuelto **EN EL SERVIDOR** (`obtener_datos_negocio`: `IF NOT (v_es_titular OR is_admin())` → `{visible:false}` **sin las otras claves**) · consumido en `:346` y `:521` |
| sección **EQUIPO** | visible | visible | oculta | oculta | **`esDueno` del LECTOR** (`:165` lo declara: *este tab no tiene gate de gestor y aquél sí*) |

> **✅ ESTO ESTÁ BIEN HECHO Y CONVIENE DECIRLO:** la plata **no se esconde en el
> cliente** — el servidor **no manda el dato**. Un no-titular no recibe ni la
> clave. *Una autorización que decide el cliente es decorativa.*

---

## 5 · TAB **NEGOCIO** — *camino: barra (solo gestor) → NEGOCIO*

`app/(tabs)/negocio.tsx`. **Gate de ruta: `useGateGestor`**

| estado del gate | qué pasa | línea |
|---|---|---|
| `denegado` | `Redirect → /(tabs)` (ausencia, Ley 23) | `:247` |
| `roto` (rol=false **y** titular=null) | **`GateRoto` con reintento — jamás pantalla en blanco** | `:251` |
| `verificando` / `permitido` | renderiza | — |

**Destinos dentro:** los **mundos/talleres** (`:296`) · **Liquidaciones**
(`:334`). **Todos heredan el gate del tab: RECEPCIÓN y EMPLEADO no llegan.**

> **Nota de historia, medida:** el estado `roto` existe porque en S79 el
> **titular real** fue expulsado por un `<Redirect>` mudo y la pantalla quedó en
> **blanco** — sin crash, así que ninguna frontera lo atrapó. *Un render
> legítimo de nada.*

---

## 6 · TAB **CUENTA** — *camino: barra → CUENTA*

`app/(tabs)/cuenta/index.tsx`. Sin gate de tab: **todos entran** (es donde uno
se identifica).

| destino | TITULAR | ADMIN *(teór.)* | RECEPCIÓN | EMPLEADO | predicado |
|---|---|---|---|---|---|
| perfil · preferencias · sesión · eliminar cuenta | visible | visible | visible | visible | ninguno |
| **buscar actualización (D-649)** | visible | visible | visible | visible | ninguno — **y así debe ser** |
| pie con `updateId` | visible | visible | visible | visible | ninguno |
| **«El movimiento»** | **visible** | visible | **oculto** | **oculto** | **`gate === 'permitido' && negocio.vet`** (`:643`) — **DOS gates**: el de gestor **y** el oficio |
| `/gallery` | visible | visible | visible | visible | `:724` — **sin `__DEV__`** |

> **El doble gate de «El movimiento» está bien argumentado en el propio código
> (`:628-633`)**: bajó de NEGOCIO **con el predicado que gateaba a NEGOCIO** ⇒
> **cambio nulo de audiencia**. Y el segundo gate es de honestidad: *los
> presupuestos son clínicos; sin oficio vet la pantalla no tiene nada que
> mostrar, y ofrecerla sería una puerta que no rechaza pero tampoco lleva.*

---

## 7 · ⚠️ SUPERFICIES QUE EXISTEN Y **NINGÚN ROL ALCANZA** — el hallazgo de L-161

| superficie | por qué es inalcanzable | quién la podría ver |
|---|---|---|
| **la rama `administrador` de TODOS los gates** | **cero portadores en la DB** | **nadie, hoy** |
| **el diseño de la barra de TRES** | *existe y se muestra a 5 personas* — **pero nunca se diseñó**: el archivo la declara inerte | **el founder NO**: su cuenta es titular ⇒ **jamás puede verla con su dedo** |
| `AgendaRecepcion` (el HOY de recepción) | requiere **otro rol** — 1 sola fila en la DB, en Aurora | **el founder NO**, salvo entrando con esa cuenta |
| `GateRoto` | exige un dato **contradictorio** (rol=false + titular=null) | nadie, salvo rompiendo datos a mano |

> ### **ESO ES EXACTAMENTE L-161: cuatro superficies con path correcto y CERO camino para el dedo del founder.**
> *Un censo de paths las habría listado como cobertura.*

---

## 8 · LO QUE ESTE CENSO **NO** MIDIÓ, declarado

- **La RLS**, salvo donde el código la nombra. *Este censo dice qué se MUESTRA;
  el motor puede ser más restrictivo — y en la plata, lo es.*
- **Las rutas fuera de tabs** (`/liquidaciones`, `/vacaciones`, los talleres) más
  allá de quién las enlaza.
- **La app del cliente.**

*Depositado por A, S86. Medición, no propuesta.*
