# LETRA_PORTAL_ADMIN — el MVP con el que se opera e-PetPlace

> **v1.0 — S114, 7-sep-2026. Alcance firmado por el founder:** opción 1 — **MVP nuevo y angosto,
> web de verdad, arrancando por la liquidación al prestador — y con lo que hace falta para operar
> e-PetPlace de verdad.** F la deposita en `docs/LETRA_PORTAL_ADMIN.md`.
> Se lee junto con `docs/loop/S114-F-RELEVAMIENTO.md`, que es su piso medido.
> **Gemela para todo lo de postventa:** `LETRA_POSTVENTA.md` §9 (el candado del asiento).

---

## §1 · Qué es y qué no es

**Es la mesa de operaciones de e-PetPlace: la pantalla desde la que una persona hace funcionar el
negocio.** No es un panel de métricas, no es un CRM y no es la app de nadie.

**«Nuevo y angosto» no significa chico por prolijidad: significa que entra sólo lo que pasa la
puerta de §2.** *Un MVP que se define como «lo que hace falta» sin decir contra qué se mide es un
portal entero con otro nombre, y no llega a octubre.*

**El admin legado NO se apaga.** Sigue vivo para todo lo que este MVP no cubra. Cada pantalla se
retira **el día que su reemplazo existe**, con lápida, y no antes. **Nada vive en dos lugares:** la
frontera se escribe en este documento y se actualiza con cada retiro.

---

## §2 · LA PUERTA DEL ALCANCE — el criterio, y sólo él

**Entra al MVP lo que cumple UNA de estas dos:**

1. **Sin eso no se puede operar el 1 de octubre.** No «sería incómodo»: se detiene.
2. **Toca plata de un tercero** — del prestador, del vendedor o de la familia.

**Todo lo demás espera**, y esperar no es un juicio sobre su valor.

### 2.1 · Lo que entra, en orden de construcción

| # | qué | por qué pasa la puerta |
|---|---|---|
| **1** | **Liquidación al prestador** | Toca plata de terceros y **no existe en ningún lado**: hay que construirla vaya donde vaya el portal. El 1 de octubre alguien tiene que cobrar |
| **2** | **La bandeja y la Hoja del caso** (postventa) | Es la razón por la que este asiento existe (F5). Toca plata de la familia |
| **3** | **Alta y verificación de prestadores, vendedores y refugios** | Sin ella no entra oferta, y hoy es un acto manual sin pantalla |
| **4** | Lo que F liste como **rojo** entre sus ocho insustituibles y pase §2 | medido, no supuesto |

**La devolución de despensa NO es una pantalla nueva:** la absorbe la bandeja del caso (F9 de
`LETRA_POSTVENTA`). *Construirle su pantalla propia sería la segunda puerta que esa firma prohíbe.*

### 2.2 · Lo que se queda en el legado, con frontera declarada

Cupones y promociones · `beta_users` · catálogo · los gráficos de inversores · todo lo demás que
el relevamiento haya encontrado vivo y usado.

### 2.3 · Lo que NO se migra — se retira

🔴 **Dos pantallas del legado no se mudan, porque mudarlas sería mudar un error de casa:**

- **Adopción del admin mira el modelo viejo** (0/0/0 filas) mientras el vertical de S112 vive en
  once tablas nuevas. **No falla: muestra vacío**, que es peor. El vertical se opera desde la app
  de Negocios: la pantalla se retira con lápida.
- **Las notificaciones del admin no se despachan.** Escribe `notificaciones` (26 filas, última el
  3-ago); el motor vivo corre por `notificacion_intencion` (410, última hoy), y esa tabla la lee un
  contador de badge. **La pantalla no informa: desinforma.** Se retira; si algún día hace falta
  una superficie de avisos, se escribe contra el motor vivo y es letra propia.

*Una pantalla que muestra vacío sobre un modelo que ya no existe es más cara que una rota: la rota
avisa.*


---

## §2.4 · LA TABLA DE FRONTERA

> **Depositada por F en la tanda 1 (7-sep-2026), sobre el censo de
> `docs/loop/S114-F-RELEVAMIENTO.md`.** Es el mapa de qué se opera dónde, y se
> actualiza con cada retiro. *Mientras tenga filas en «legado», el legado no se
> apaga (§4).*
>
> **Cómo leer la columna «criterio»:** ① = *sin eso no se opera el 1-oct* ·
> ② = *toca plata de un tercero* · **«espera»** = no pasa ninguno de los dos, y
> **por eso no se vuelve a nombrar** (§2 y §4). Esperar no es un juicio sobre
> su valor.

### Las pantallas del legado

| Pantalla del legado | Destino | Criterio | Por qué |
|---|---|---|---|
| **Liquidaciones** (sellers) | 🟢 **MVP** *(construida en tanda 1)* | **②** | Toca plata de terceros. Su pantalla legada está **rota** (`seller_liquidaciones`, `seller_comisiones`, `v_pedido_liquidacion` no existen) y era de *sellers*, no de prestadores. **Cero liquidaciones en toda la historia** |
| **PrestadorDetalle** (verificación) | 🟡 **MVP, tanda 2** | **①** | Sin verificar prestadores no entra oferta. Es lo **único** del legado con uso administrativo reciente medido (8 de 11 documentos revisados, última 15-ago) |
| **Prestadores** (lista) | 🟡 **MVP, tanda 2** | **①** | Entra con la anterior: es su puerta de acceso |
| *(no existe)* **Alta de prestadores** | 🟡 **MVP, tanda 2** | **①** | `invitar_prestador` / `activar_prestador` existen en la base **sin un solo wrapper**. Hoy es un acto manual por SQL |
| *(no existe)* **Bandeja y Hoja del caso** | 🟡 **MVP** (§2.1 #2) | **②** | Postventa. Absorbe la devolución de despensa (F9 de `LETRA_POSTVENTA`) |
| **Adopción** | ☠️ **RETIRADA** | — | Mira el modelo viejo (0/0/0) mientras el vertical de S112 vive en once tablas nuevas. **Muestra vacío, no falla.** Lápida en `src/LAPIDAS.md` del legado |
| **Notificaciones** | ☠️ **RETIRADA** | — | Escribe una tabla que sólo lee un contador de badge; el motor vivo despacha por `notificacion_intencion`. **Un envío no se despachaba.** Lápida en `src/LAPIDAS.md` |
| **Pedidos · PedidoDetalle** | 🔵 legado | espera | Vivos y con actividad real (96 pedidos, último 7-sep). Los crean las apps; el admin sólo cambia estado |
| **Logística** (envíos, zonas) | 🔵 legado | espera | Envíos con actividad (5, último 18-ago). Funciona |
| **Logística › Devoluciones** | 🔵 legado *(hasta la bandeja)* | espera | **Cero filas en toda la historia.** No está rota: está sin estrenar. Cuando exista la bandeja del caso, la absorbe — y **no se le construye pantalla propia** (§2.1) |
| **Promociones** (cupones, campañas) | 🔵 legado | espera | §2.2 lo declara explícito. Nada del soft launch depende de una promoción |
| **BetaUsers** | 🔵 legado | espera | 🔴 **Con una salvedad:** §3.5 de `DEFINICION_SOFTLAUNCH` lo nombra compuerta del launch controlado. La pantalla funciona (2 filas, congelada en mayo); **hay que confirmar que abre antes del 1-oct**, y eso es una verificación, no una construcción |
| **Productos** (catálogo) | 🔵 legado **ROTO** | espera | Usa 8 columnas y **sólo `nombre` existe**. No se repara: el catálogo v1 se carga **por script** (firma S95-F). Con un vendedor es un seed, no una interfaz |
| **Sellers** | 🔵 legado (parcial) | espera | 3 de 8 objetos no existen. Con un solo vendedor no bloquea |
| **Roles** (admin) | 🔵 legado | espera | 3 admins, 2 activos. Se opera por SQL sin fricción |
| **Dashboard** | 🔵 legado | espera | 🔴 **con el 14% vivo** (`gmvMes * 0.14`). No bloquea operar, pero el número es falso |
| **Inversores** | 🔵 legado | espera | 🔴 **el mismo 14%, embebido en `v_gmv_mensual`**. Es lo que ve un inversor. No es del MVP, pero es la corrección más barata del censo |
| **Citas** | 🔵 legado **MUERTA** | espera | Su tabla central (`citas`) no existe. Las citas se operan desde la app del prestador |
| **Mensajes** | 🔵 legado **MUERTA** | espera | `mensajes_admin_seller` no existe. ⚠️ **Su suscripción realtime sigue viva en `Layout.tsx` en cada carga** |
| **MascotaDetalle** | 🔵 legado **MUERTA** | espera | 4 de 7 objetos no existen (modelo clínico viejo) |
| **Financiero** | 🔵 legado (parcial) | espera | Lee `seller_liquidaciones`, que no existe |
| **UserTimeline** | 🔵 legado (parcial) | espera | Lee `citas` y `vacunas`, que no existen |
| **UsuarioDetalle** | 🔵 legado | espera | ⚠️ Su `UPDATE profiles` **no puede escribir** (las policies son `auth.uid() = id`, sin admin) y **falla en silencio** |
| **Usuarios · Mascotas** (listas) | 🔵 legado | espera | Lectura, funcionan |
| **Gamificación** | 🔵 legado | espera | Catálogo sin motor de disparo |
| **PlanesPrime** | 🔵 legado | espera | Prime nace apagado (`DEFINICION_SOFTLAUNCH`) |
| **Placas** | 🔵 legado | espera | Construida el 6-sep con RPC gateada. **Es el único módulo del legado escrito con el criterio de hoy** |
| **Países · Servicios** | 🔵 legado | espera | Configuración estable |
| **Login · Layout** | 🔵 legado | espera | Infraestructura del legado |

### Las funciones administrativas (lo que el admin hace y nadie más)

| Función | ¿Puerta en las apps? | Destino | Criterio |
|---|---|---|---|
| **Liquidar al prestador** | ❌ el prestador **sólo ve** su ledger | 🟢 **MVP tanda 1** | **②** |
| **Verificar documentos de prestador** | ❌ `revisar_documento_prestador` sin wrapper | 🟡 MVP tanda 2 | **①** |
| **Alta de prestadores** | ❌ `invitar_` / `activar_` sin wrapper | 🟡 MVP tanda 2 | **①** |
| **Alta de vendedores y refugios** | ❌ | 🟡 MVP tanda 2 | **①** |
| **Postventa: caso y devolución** | ❌ | 🟡 MVP (§2.1 #2) | **②** |
| **Beta gate** | ❌ | 🔵 legado *(verificar)* | ① *acotado a confirmar que abre* |
| **Cupones y campañas** | ❌ | 🔵 legado | espera |
| **Catálogo de productos** | ❌ `publicar_oferta_sku` sin wrapper | 🔵 script | espera |
| **Notificaciones masivas** | ❌ | ☠️ retirada | — |
| **Roles de plataforma** | ❌ | 🔵 legado | espera |
| **`country_config` · `tipos_servicio`** | 🟡 lectura sí, escritura no | 🔵 legado | espera |
| **Zonas de cobertura** | ❌ | 🔵 legado | espera |
| **Gamificación / Prime** | ❌ | 🔵 legado | espera |
| **Adopción / refugios** | 🟢 el vertical S112 vive en las apps | ☠️ retirada | — |
| **Pedidos** | 🟢 las apps los crean y operan | 🔵 legado | espera |

> **La medición que ordena esta tabla entera:** hay **115 funciones con
> `is_admin` en la base y CERO wrappers en `packages/api`**. *El motor
> administrativo está construido: lo que falta es la puerta.* Por eso cada fila
> «MVP» es un wrapper y una pantalla, no un motor nuevo.

---

## §3 · Las decisiones técnicas, y por qué

**① Web de verdad — React + Vite en `apps/admin` del monorepo. No RN-web.** Lo que el monorepo
aporta es `packages/api` (TypeScript, sirve igual en cualquier front) y los gates. `packages/ui`
es React Native y **una mesa de operaciones de escritorio no lo necesita** — averiguar si RN-web
aguanta una tabla ancha es gastar la primera pantalla en una pregunta que no hace falta contestar.

**② La puerta única es la razón de ser de este MVP, y el relevamiento la dejó servida: hay 115
funciones con `is_admin` en la base y CERO wrappers en `packages/api`. El motor está; falta la
puerta.** El MVP no reinventa lógica administrativa: **la envuelve.**

**③ Frontera entre A y F dentro de `packages/api`, porque las pistas no se hablan.** F escribe sus
wrappers **sólo bajo `packages/api/src/admin/`** y no toca ningún otro archivo de ese paquete; A
merge. Cualquier necesidad de F sobre un wrapper existente se pide **por escrito en
`docs/loop/`, por nombre**, jamás editándolo.

**④ Autenticación: la que ya funciona, sin reinventar.** Anon key + sesión real
(`signInWithPassword`) + gate `admin_users` con `is_admin()` DEFINER leyendo la misma tabla que
consulta el front. **Medido por camino real:** con la clave del bundle, cero filas o 401 en todo lo
del admin contra 1 fila en el control. *La anon key expuesta no abre nada: la RLS hace el trabajo.*
**Prohibido `service_role` en cualquier bundle web.**

**⑤ El aspecto.** El MVP lee los **tokens** de la casa (valores, no componentes) y construye sus
piezas web. **No importa componentes de React Native.** No es la app: es su mesa de trabajo — y aun
así no puede parecer otro producto.

**⑥ Ninguna escritura directa a tablas.** Todo por función, igual que el resto de la casa. El
`REVOKE` de postventa ya lo garantiza para el caso y el saldo; el MVP sostiene la misma regla en
todo lo que toque.

---

## §3.4 · **UN GATE QUE ES UN `WHERE` NO DISTINGUE «VACÍO» DE «PROHIBIDO»**

*(Firma del founder, 8-sep-2026. Nace de un caso real y se escribe como ley porque **es la
clase, no el conteo**.)*

**Toda función de LECTURA del admin rebota explícitamente cuando el que llama no es la
casa. No alcanza con filtrar.**

```sql
-- ❌ el gate como filtro: un no-admin recibe [] y cree que no hay nada
SELECT … FROM pasaporte_lote l WHERE is_admin();

-- ✅ el gate como rebote: «no podés» y «no hay» quedan separados
IF NOT COALESCE(is_admin(), false) THEN
  RETURN jsonb_build_object('ok', false, 'codigo', 'sin_permiso');
END IF;
```

🔴 **Por qué importa, y no es teoría:** con el `WHERE`, **«no hay lotes» y «no podés
verlos» llegan a la pantalla como el MISMO valor.** La superficie no puede distinguirlos
—ni con el mejor diseño— porque *la diferencia se perdió en la base*. Y el estado vacío que
dibuje va a decir una de las dos cosas: **si acierta, es casualidad**.

⚠️ **Y la razón por la que se escribe hoy, con el caso todavía inofensivo:** al portal sólo
se entra por el login de admin, así que **hoy el no-admin no puede llegar**. *Esa
protección no es del gate: es de quién puede abrir la puerta de al lado.* **Deja de ser
cierta el día que alguien agregue un rol** —un operador, una vista de sólo lectura, un
soporte— y ese día **no falla nada: la pantalla dice «todavía no hay ningún lote» a alguien
que sí los tiene.**

> ***Un permiso que se pierde en silencio no se descubre cuando se rompe: se descubre
> cuando alguien toma una decisión con el dato equivocado.***

**El estado medido (8-sep-2026), para que la ley no se lea más grande de lo que es:** de
**33** funciones de lectura con `is_admin()`, **una sola** tiene el gate como `WHERE` —
`listar_lotes()`— y **una** rebota explícitamente. Las 31 restantes son **helpers de
policy** que devuelven `boolean`, donde `false` **es** la respuesta correcta y esta ley no
aplica. *El censo se corre así:*

```sql
SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) ~* 'WHERE\s+is_admin\(\)';
```

**Y lo que corresponde hacer con `listar_lotes()` no lo decide esta letra:** es de A, y la
elección es entre rebotar tipado —lo que esta ley pide— o dejarlo y **declarar en su cuerpo
que su vacío es ambiguo**. *Lo que no vale es que quede sin decidir.*

---

## §4 · Lo que esta letra NO decide

- **El diseño de las pantallas.** Se decide con su dirección, escrita antes de construir, y se
  juzga en la pantalla real.
- **La forma de la liquidación** (períodos, agrupación, comprobante): la dice `MODELO_FINANCIERO`
  §4.1/§4.3 y su Decisión B, y se lee ANTES de dibujar.
- **Si el legado se apaga alguna vez.** Se decide cuando la frontera de §2.2 quede vacía.
- **Cualquier cosa que no pase la puerta de §2.** No se «deja preparada»: no se nombra.

---

## §5 · ENCARGO — pista F, tanda 1

```
Pista F — S114 · PORTAL ADMIN, TANDA 1: LA FRONTERA Y LA PRIMERA PUERTA.
Leé docs/LETRA_PORTAL_ADMIN.md entera (te la paso para depositar) y tu propio
docs/loop/S114-F-RELEVAMIENTO.md. El alcance está FIRMADO: no lo re-discutas, aplicalo.

F0. DEPOSITÁ la letra en docs/LETRA_PORTAL_ADMIN.md, verbatim.

F1. LA TABLA DE FRONTERA — es el entregable que más va a durar. Una fila por pantalla y por
    función administrativa del legado, con: entra al MVP / se queda en el legado / se retira
    con lápida, y CUÁL de los dos criterios de §2 la hace entrar. Las que no pasan ninguno
    se marcan «espera» y no se nombran de nuevo. Publicala en la letra, no en tu parte:
    la va a leer gente que no lee partes.

F2. EL ESQUELETO. apps/admin en el monorepo: React + Vite, auth con anon + signInWithPassword
    + gate is_admin (la que YA funciona, medida por camino real — no la reinventes), layout,
    ruteo y el manejo de sesión. NADA de packages/ui: es React Native. Leé los tokens de la
    casa (valores, no componentes) y armá tus piezas web sobre ellos. Rojo primero: un
    usuario sin fila en admin_users no puede ver ninguna ruta, probado por camino real y no
    por un guard de front.

F3. LA PRIMERA PUERTA — LIQUIDACIÓN AL PRESTADOR. Leé MODELO_FINANCIERO §4.1, §4.3 y
    Decisión B ANTES de dibujar. Wrappers SÓLO bajo packages/api/src/admin/ (frontera con A:
    no toques ningún otro archivo del paquete; lo que necesites de un wrapper existente lo
    pedís por nombre en docs/loop/). Pantalla: ver qué se le debe a cada prestador, con su
    detalle por evento, y generar la liquidación. JAMÁS $0 mudo: si no hay eventos, se dice
    por qué. ⚠️ Contexto medido por E: hoy hay servicios pagados y cerrados SIN evento
    económico — A está construyendo los cuatro productores que faltan. Tu pantalla tiene que
    poder decir esa verdad sin mentir ni romperse, y no la cura.

F4. LOS DOS RETIROS de §2.3 — adopción y notificaciones del legado — con lápida y con el
    porqué escrito en la lápida, no sólo en el commit.

F5. ANOTÁ Y NO CURES: otorgar_puntos quedó con D-314 a medias (cerrada a anon, ABIERTA a
    authenticated sin gate). Es de A y de la base. Escribilo en docs/loop/ por nombre para
    que A lo levante; no lo toques vos.

Cero cambios al admin legado en esta tanda salvo los dos retiros. Cada número que publiques
nombra el comando que lo produce. Y declará lo que no pudiste medir, como hiciste en el
relevamiento — incluido si algo sigue ambiguo sobre el rastro de uso.
```

---

## Historial

- **v1.0 (S114, 7-sep-2026):** alcance firmado por el founder sobre el relevamiento de F. Opción 1
  con web real. Puerta de §2 establecida como el único criterio de entrada. Frontera con el legado
  declarada; dos pantallas marcadas para retiro por mirar modelos muertos.
