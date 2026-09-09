# Plan de reconstrucción del admin — **las 27, ordenadas por lo que hace falta para OPERAR**

> ## 🔴 Si vas a copiar UNA frase de acá, que sea ésta
>
> **De las 27 pantallas del legado, sólo 9 hacen falta para operar en octubre. De ésas, 2 ya
> existen en la mesa nueva y 3 las cubre el monorepo desde las apps. Quedan CUATRO por
> construir.**
>
> ### 🔴 Y el número que ordena todo lo demás
>
> **~11 000 líneas que NO se reconstruyen porque nadie las usa.**
>
> *`Gamificacion` son **1 005 líneas para administrar dos logros**, y `MODELO_LOYALTY` ya
> firmó **moneda invisible**: no hay puntos que administrar. `PlanesPrime` son 858 líneas
> para 3 filas. `Promociones`, 920 para un cupón. `Logistica`, 1 956 para cinco envíos.*
>
> ⇒ **Lo que decide qué se retira no es que esté roto: es que su tabla está vacía.**

**8-sep-2026 · S114-F.** Medido, sin construir. Ordenado por **necesidad de operación**, no
por estado — *una pantalla rota que nadie usa no se reconstruye: se retira.*

---

## El criterio de la columna que ordena

**«Octubre abre con SERVICIOS»** (`DEFINICION_SOFTLAUNCH` §3.5) **y con la despensa.** Así
que «se necesita para operar» significa: **sin esto, el founder no puede atender un problema
real de un usuario real en octubre.** Todo lo demás —métricas, campañas, catálogos que nadie
toca— **puede esperar o morir.**

---

## 🟢 GRUPO 1 · Hacen falta para operar (9)

| pantalla | qué hace | hoy | dónde queda |
|---|---|---|---|
| **Login** | entrar al portal | ✅ | ✅ **ya está** en la mesa nueva |
| **Casos** *(no existe en el legado)* | postventa: la casa decide | — | ✅ **ya está**, y es lo único nuevo |
| **Liquidaciones** | qué se le paga a cada prestador | 🔴 muerta | ✅ **ya está** en la mesa nueva, andando |
| **Usuarios** | buscar una persona, ver su cuenta | ✅ | 🔨 **construir** — 246 líneas, la más barata |
| **Mascotas** | buscar una mascota, ver de quién es | ✅ | 🔨 **construir** — 241 líneas |
| **Prestadores** | ver/aprobar un prestador y sus documentos | 🟠 permiso | 🔨 **construir** — 394 líneas · *A ya puso la policy* |
| **Pedidos** | ver un pedido de la despensa | ✅ | 🔨 **construir** — 329 líneas |
| **Placas** | lotes de placas del pasaporte | ✅ | ↔️ **mover** — 218 líneas, ya cableada a `listar_lotes()` |
| **Paises** | `country_config` — moneda, IVA, cobertura | ✅ | ⏸️ **2 filas, casi nunca se toca**: puede esperar a que haga falta |

**Costo del grupo: ~1 400 líneas de pantalla**, y **ninguna necesita motor nuevo** — todas
leen lo que ya existe.

---

## ⚪ GRUPO 2 · NO se reconstruyen porque el monorepo ya las cubre (5)

*El legado nació antes de que las apps existieran. Hoy el dato vive en el producto.*

| pantalla | por qué no |
|---|---|
| **Citas** · **MascotaDetalle** · **UserTimeline** | 🔴 leen `citas`, `vacunas`, `historia_clinica` — **el modelo viejo que el monorepo reemplazó por eventos.** *Reconstruirlas es rehacerlas contra otro modelo, no migrarlas.* Y **el expediente vive en la app del dueño y en la del prestador**, que es donde tiene que estar |
| **PrestadorDetalle** · **Servicios** | el prestador **gestiona lo suyo en su propia app** desde S79. *Un admin que edita servicios ajenos compite con la pantalla del dueño del negocio* |

**Ahorro: ~3 500 líneas que no se escriben.**

---

## ⚫ GRUPO 3 · Se retiran: su modelo murió o nadie las usa (13)

| pantalla | evidencia |
|---|---|
| **Sellers** · **Financiero** · **Dashboard** · **Mensajes** | 🔴 leen `seller_comisiones`, `seller_liquidaciones`, `mensajes_admin_seller` — **tablas que NO EXISTEN**. *El modelo de sellers se rehizo entero en S95* |
| **Logistica** | 🔴 `envio_eventos` no existe · **`envios` tiene 5 filas** · 1 956 líneas, la pantalla más grande del legado |
| **Productos** | 🟠 `seller_perfil` cerrada · **el catálogo se carga por script, no por portal** (`MODELO_DESPENSA` §4.2 **derogada** en S95-F: *«el portal existe y no sirve para esto»*) |
| **Gamificacion** | 1 005 líneas · **`puntos_usuario` 1 fila, `logros_usuario` 2**. Y `MODELO_LOYALTY` firmó **moneda invisible**: *no hay puntos que administrar* |
| **PlanesPrime** | **3 filas** · Prime está **preparado-apagado** por decisión |
| **Promociones** | **1 cupón, 1 campaña** |
| **BetaUsers** | **2 filas** |
| **Inversores** | 🔴 métricas con **el 14 % embebido en vistas SQL** (`D-759`): *un pitch deck con el ingreso inflado un orden de magnitud*. **Se retira o se rehace bien — no se migra** |
| **Roles** | administra los 4 `admin_users`. *Con una casa de una persona, es un `INSERT` cada varios meses* |
| **PedidoDetalle** | 789 líneas · **entra sólo si Pedidos pide detalle**; hoy la lista alcanza |

**Se retiran ~11 000 líneas.** *Ninguna se borra del repo: el legado queda en su URL de
Vercel. **Apagar no es borrar.***

---

## Las tandas, y el costo relativo

| | qué | costo | por qué en ese orden |
|---|---|---|---|
| **T1** | **Usuarios · Mascotas** | 🟢 bajo — ~490 líneas, sólo lectura | *son la respuesta a «tengo un problema con mi cuenta», que es el 80 % del soporte real* |
| **T2** | **Placas** | 🟢 muy bajo — 218 líneas, **ya cableada** | es **traer** una pantalla que anda, no escribirla |
| **T3** | **Prestadores** | 🟡 medio — 394 líneas + documentos | **octubre abre con servicios**: sin esto no se aprueba a un prestador nuevo |
| **T4** | **Pedidos** | 🟡 medio — 329 líneas | la despensa también abre. *Entra `PedidoDetalle` sólo si la lista no alcanza* |
| **T5** | **Paises** | ⚪ diferible — 2 filas | *cuando haga falta tocar una, no antes* |

🔴 **Y una tanda cero que no es de pantallas:** cuando `admin.epetplace.com` apunte a la mesa
nueva, **12 pantallas que hoy andan dejan de existir de golpe**. El founder firmó que no
importa — *pero conviene tener el link del legado a mano el primer día, no el día que haga
falta.*

---

## Lo que este plan NO decide

- **Si `Inversores` se rehace.** Sus métricas están mal por `D-759` (el 14 % vs 10 %, y GMV
  vs fee). *Rehacerla es una decisión de producto, no de portal.*
- **Si `Paises` entra alguna vez.** Con 2 filas, editarlas por SQL es más barato que
  mantener 883 líneas.
- **El detalle de cada pantalla nueva.** Este plan dice **cuáles y en qué orden**; el **qué
  muestra cada una** se firma pantalla por pantalla, como el MVP del portal.
