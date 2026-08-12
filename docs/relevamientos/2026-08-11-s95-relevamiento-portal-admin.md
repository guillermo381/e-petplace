# RELEVAMIENTO — PORTAL ADMIN (`e-petplace-admin`)

> **11 ago 2026 · S95-F · SOLO LECTURA.** Cero cambios de código, cero
> migraciones, cero escrituras a la base sobre el repo relevado.
>
> **Por qué existe:** todas las mediciones de S94/S95 se hicieron sobre
> el monorepo, y cada reporte dejó el mismo hueco declarado —
> ***«cero consumidores en el monorepo» no es «cero consumidores»***.
> El portal admin habla con la MISMA base. Este documento cierra ese
> hueco.
>
> **Se archiva en el monorepo y no en el admin** porque el hueco se
> declaró acá, y acá es donde se va a leer el día que alguien decida
> apagar `seller_perfil`.
>
> **Regla que gobierna el documento entero: lo que no está medido no se
> afirma.** Los huecos van declarados en §8.

---

## 1. 🔴 LA CREDENCIAL — la pregunta que cambia cómo se lee todo lo demás

**Es `anon`.** Confirmado decodificando el claim `role` del JWT vivo,
**sin imprimir la llave**.

| Evidencia | Valor |
|---|---|
| `src/lib/supabase.ts:4` | `import.meta.env.VITE_SUPABASE_ANON_KEY` |
| Claim `role` del valor real en `.env.local` | **`anon`** |
| Claim `ref` | **`zyltipqscdsdsxnjclhp`** |
| `VITE_SUPABASE_URL` | `https://zyltipqscdsdsxnjclhp.supabase.co` |

El **nombre** de la variable no prueba nada — el **valor** sí. No hay una
`service_role` escondida en una variable mal nombrada, que era el peor
escenario posible en una app Vite cuyo bundle es público.

**Y el `ref` es el MISMO proyecto que el monorepo.** No es una base
espejo ni un staging: es la de producción.

### Lo que esto obliga a concluir

**Cada cambio de permisos del monorepo le pega directo.** El portal
loguea un usuario (`Login.tsx`) y opera como `authenticated`. El gate de
admin (`App.tsx:103`) es **solo de cliente**: lee `admin_users.activo`
para decidir si dibuja las rutas. Lo que de verdad protege los datos es
la RLS.

Medido sobre las **30 tablas que el portal escribe**: **las 30 tienen
RLS activa.**

> ⚠️ **CORRECCIÓN DE MI PROPIA MEDICIÓN, declarada porque cambia la
> conclusión.** Conté `is_admin` **textualmente** en las expresiones de
> policy. Eso **subcuenta**. `prestador_documentos` apareció con 0 y
> parecía un hallazgo grave — el admin no podría aprobar documentos de
> identidad. Fui a leerlo: su única policy es
> `prestador_documentos_own USING user_gestiona_prestador(prestador_id)`,
> y el cuerpo de ese helper es `titular OR administrador OR is_admin()`.
> **El admin sí llega: el `is_admin` vive un piso más abajo.**
>
> ⇒ **El conteo textual de `is_admin` en policies es un PISO, no un
> techo, y no debe leerse como que una tabla quedó sin alcance de
> admin.** Medir texto no es medir alcance.

---

## 2. INVENTARIO DE DATOS

**368 accesos a datos** en 30 archivos · **59 objetos** distintos +
2 buckets de Storage · **un solo RPC en todo el portal**.

**Tablas leídas y/o escritas** (❌ = medida como inexistente hoy):

`admin_users` · `admin_roles` · `admin_permisos` · `admin_usuarios_roles`
· `adopcion_seguimiento` · `app_config` · `audit_log` · `beta_users` ·
`campanas` · `citas`❌ · `country_config` · `cupon_usos` · `cupones` ·
`devoluciones` · `envio_eventos` · `envios` · `historia_clinica`❌ ·
`logros` · `logros_usuario` · `mascotas` · `mascotas_adopcion` ·
`mensajes_admin_seller`❌ · `niveles` · `notas_admin_usuario` ·
`notificaciones` · `pedidos` · `planes_prime` · `prestador_documentos` ·
`prestador_horarios` · `prestador_resenas` · `prestador_servicios` ·
`prestadores` · `productos` · `profiles` · `puntos_usuario` ·
`seller_comisiones`❌ · `seller_inventario`❌ · `seller_liquidaciones`❌ ·
`seller_perfil` · `solicitudes_adopcion` · `suscripciones` ·
`tipos_servicio` · `transacciones_puntos` · `user_roles` · `vacunas`❌ ·
`wearable_alerts` · `wearable_devices` · `zonas_cobertura`

**Vistas:** `v_metricas_tiempo_real` · `v_pitch_metrics` ·
`v_gmv_mensual` · `v_mrr` · `v_crecimiento_usuarios` ·
`v_ranking_usuarios` · `v_dashboard_logistico` · `v_bio_expediente`❌ ·
`v_pedido_liquidacion`❌

**Storage:** `adopcion-fotos` · `productos-fotos` (upload +
`getPublicUrl` en ambos)

**RPC:** `otorgar_puntos` — el **único** (`Gamificacion.tsx:89`).
Medido en la base: existe, `SECURITY DEFINER`, ACL
`postgres | authenticated | service_role` — **sin `anon` y sin
`PUBLIC`**.

### 2.1 🔴 Los 9 objetos que el portal consulta y ya no existen

Diff medido contra `information_schema` de la base viva:

| Objeto | Estado |
|---|---|
| `citas` | NO EXISTE |
| `vacunas` | NO EXISTE |
| `historia_clinica` | NO EXISTE |
| `v_bio_expediente` | NO EXISTE |
| `mensajes_admin_seller` | NO EXISTE |
| `seller_comisiones` | NO EXISTE |
| `seller_inventario` | NO EXISTE |
| `seller_liquidaciones` | NO EXISTE |
| `v_pedido_liquidacion` | NO EXISTE |

> **🔴 LOS CUATRO PRIMEROS NO SON DEL DOMINIO DE SELLERS.** Son el
> núcleo viejo del modelo — cita, vacuna, historia clínica, expediente —
> que el monorepo reemplazó por `evento_cita_servicio`,
> `evento_vacuna_aplicada`, `evento_historia_clinica_registrada`.
> **La rotura es mucho más ancha que la premisa de «datos de prueba de
> sellers borrados a propósito».**

*Inferencia declarada como tal (no medida): los scripts de S95 listan las
tablas de sellers pero **no** `citas`/`vacunas`/`historia_clinica`, lo que
sugiere cosechas distintas y bastante anteriores. **No medí en qué
migración desapareció cada una.***

---

## 3. LAS TRES PREGUNTAS PUNTUALES

### 3.a `resenas_productos` y `v_resenas_todas` → CERO consumidores, en ningún repo

Busqué en **los seis repos** de la casa (`e-petplace`,
`e-petplace-admin`, `e-petplace-v2`, `epetplace-web`,
`e-petplace-prestadores`, `e-petplace-sistema-pruebas`) — **1.725
archivos** escaneados.

`v_resenas_todas` aparece solo en:

- `database.types.ts` de tres repos → **tipos generados, no consumo**
- scripts y migraciones de S95 del monorepo → **la nombran como
  bloqueante, no la leen**

**Ninguna pantalla, de ningún repo, hace `.from('v_resenas_todas')`.**
Idem `resenas_productos`: cero lecturas fuera de los tipos generados.

La pantalla de reseñas del portal (`PrestadorDetalle.tsx:158` y `:283`,
toggle `es_visible`) **lee `prestador_resenas` directo** — nunca pasa por
la vista.

**Su forma, medida con `pg_get_viewdef`, para que se pueda reescribir
conservándola:** `UNION ALL` de dos ramas con **11 columnas** — `tipo`
(`'producto'`/`'prestador'`) · `id` · `user_id` · `autor_nombre` ·
`calificacion` · `comentario` · `es_visible` · `created_at` ·
`entidad_nombre` · `entidad_id` · `referencia_id`. La rama de producto
une `resenas_productos → profiles → productos`; la de prestador une
`prestador_resenas → profiles → prestadores`. **No filtra por tipo: lo
expone como columna.**

> **Conclusión:** la vista está **bloqueando el borrado de
> `resenas_productos` sin que nadie la lea**. Reescribirla —o dejarla
> con una sola rama— no rompe ningún frente medido. El frente vivo de
> reseñas de prestadores **no depende de ella**.

### 3.b `seller_perfil` → SÍ, dos pantallas más, y una escribe

| Dónde | Qué hace |
|---|---|
| `Productos.tsx:555` | **lee** `id, nombre_comercial` — selector y columna «Seller» |
| `Productos.tsx:329/355/467/563/592` | usa `productos.seller_perfil_id` — formulario, filtro y join en memoria |
| `Sellers.tsx:241` | **UPSERT** al crear un seller (con `paises_operacion`) |
| `Sellers.tsx:531` | **UPSERT** de configuración (`onConflict: 'user_id'`) |
| `Sellers.tsx:1104` | **lee** los perfiles completos por `user_id` |

> ⚠️ **Corrección a la premisa de la pregunta:** `Liquidaciones.tsx`
> **no toca `seller_perfil` en ninguna línea**. Usa `user_roles` +
> `profiles` + `seller_comisiones` + `v_pedido_liquidacion` +
> `seller_liquidaciones` — y **tres de esos no existen**, por eso está
> rota. **La rotura de Liquidaciones no pasa por `seller_perfil`.**

### 3.c Métricas → es `v_pitch_metrics`, el tablero de INVERSORES, y su dependencia es `seller_perfil`

Leídas las definiciones de las dos candidatas:

- **`v_metricas_tiempo_real`** (`Dashboard.tsx:129`) cuenta mascotas y
  citas — y **ya está migrada**: su CTE `citas_mes` lee
  `evento_cita_servicio`, **no** `citas`. Depende de `pedidos`,
  `profiles`, `mascotas`. **No la sostiene ninguna tabla en la mira.**
- **`v_pitch_metrics`** (`Inversores.tsx:148`) se construye **sobre**
  `v_metricas_tiempo_real` y le agrega:
  - `mascotas_con_historial` ← `evento_historia_clinica_registrada`
  - `prestadores_activos` ← `prestadores`
  - 🔴 **`sellers_activos` ← `seller_perfil WHERE estado='activo'`**

> **Conclusión:** el tablero que la consume es **`/inversores`** — el
> pitch deck. **Apagar `seller_perfil` rompe `v_pitch_metrics`, y con
> ella la pantalla de inversores entera (12 KPIs).** Y hay una cadena de
> dos pisos que conviene no perder: tocar `v_metricas_tiempo_real`
> arrastra a `v_pitch_metrics` ⇒ **el Dashboard y el pitch de
> inversores comparten raíz.**

---

## 4. PANTALLAS — 28 rutas + login

Agrupadas como las agrupa el propio menú (`Layout.tsx:9`).

### 🔴 TRANSVERSAL — afecta a las 28

| Componente | Qué hace | Estado |
|---|---|---|
| `Layout.tsx:143` | Badge de no leídos: `count` sobre `mensajes_admin_seller` **+ suscripción realtime a esa misma tabla** | **ROTO Y SILENCIOSO** — el error se traga con `count ?? 0` y el badge muestra 0. Además deja **una suscripción realtime a una tabla inexistente en cada carga de página** |

### OPERACIONES

| Ruta | Pantalla | Fuentes | Estado |
|---|---|---|---|
| `/` | Dashboard | 5 vistas + `mascotas` `pedidos` `profiles` `solicitudes_adopcion` `wearable_*` `devoluciones` `suscripciones` + **`vacunas`❌ `seller_liquidaciones`❌** | **PARCIAL** — 2 tiles caídos |
| `/pedidos` | Pedidos | `pedidos` | OK |
| `/pedidos/:id` | PedidoDetalle | `pedidos` `profiles` `envios` `audit_log` `notificaciones` `devoluciones` | OK |
| `/logistica` | Logística | `envios` `envio_eventos` `devoluciones` `zonas_cobertura` `v_dashboard_logistico` | OK |
| `/prestadores` | Prestadores | `prestadores` `prestador_documentos` | OK |
| `/prestadores/:id` | PrestadorDetalle | `prestadores` `prestador_*` `profiles` | OK |
| `/citas` | Citas | **`citas`❌** + `profiles` `mascotas` `prestadores` `prestador_horarios` `notificaciones` | **🔴 ROTA ENTERA** |
| `/notificaciones` | Notificaciones | `profiles` `pedidos` `notificaciones` `app_config` + **`vacunas`❌** | **PARCIAL** — cae el segmento «vacuna por vencer» |
| `/financiero` | Financiero | `pedidos` + **`seller_liquidaciones`❌** | **PARCIAL** |
| `/liquidaciones` | Liquidaciones | `user_roles` `profiles` + **`seller_comisiones`❌ `v_pedido_liquidacion`❌ `seller_liquidaciones`❌** | **🔴 ROTA ENTERA** (3 de 5 fuentes) |

### USUARIOS

| Ruta | Pantalla | Fuentes | Estado |
|---|---|---|---|
| `/usuarios` | Usuarios | `profiles` | OK |
| `/usuarios/:id` | UsuarioDetalle | `profiles` `user_roles` `mascotas` `pedidos` `puntos_usuario` `beta_users` `planes_prime` `notas_admin_usuario` `niveles` + **`citas`❌** | **PARCIAL** |
| `/mascotas` | Mascotas | `mascotas` `profiles` | OK |
| `/mascotas/:id` | MascotaDetalle | `mascotas` `profiles` `prestadores` + **`v_bio_expediente`❌ `vacunas`❌ `historia_clinica`❌ `citas`❌** | **🔴 ROTA — 4 de 7 fuentes.** Es la pantalla del expediente; además **inserta en `vacunas`** (L215) |
| `/adopcion` | Adopción | `mascotas_adopcion` `solicitudes_adopcion` `adopcion_seguimiento` + Storage | OK |
| `/gamificacion` | Gamificación | `logros` `niveles` `puntos_usuario` `logros_usuario` `transacciones_puntos` `v_ranking_usuarios` + RPC | OK |

### MARKETPLACE

| Ruta | Pantalla | Fuentes | Estado |
|---|---|---|---|
| `/productos` | Productos | `productos` `seller_perfil` + Storage | OK **hoy** — cae si `seller_perfil` se apaga |
| `/sellers` | Sellers | `user_roles` `profiles` `seller_perfil` `pedidos` `productos` + **`seller_comisiones`❌ `seller_inventario`❌ `citas`❌** | **🔴 ROTA** — 3 de 4 tabs |
| `/promociones` | Promociones | `cupones` `cupon_usos` `campanas` | OK |

### CONFIGURACIÓN

| Ruta | Pantalla | Fuentes | Estado |
|---|---|---|---|
| `/paises` | Países | `country_config` | OK |
| `/mensajes` | Mensajes | `user_roles` + **`mensajes_admin_seller`❌** | **🔴 ROTA ENTERA** |
| `/servicios` | Servicios | `tipos_servicio` `prestador_servicios` `prestadores` | OK |
| `/roles` | Roles | `admin_roles` `admin_permisos` `admin_usuarios_roles` `admin_users` | OK |
| `/beta-users` | Beta users | `beta_users` | OK |
| `/timeline` | Timeline usuario | `profiles` `mascotas` `pedidos` `solicitudes_adopcion` + **`citas`❌ `vacunas`❌** | **PARCIAL grave** |
| `/planes-prime` | Planes Prime | `planes_prime` | OK |
| `/inversores` | Inversores | `admin_users` `v_pitch_metrics` `v_gmv_mensual` `v_crecimiento_usuarios` `v_mrr` | OK **hoy** — cae con `seller_perfil` (§3.c) |

**Resumen: 5 rotas enteras · 5 parciales · 1 rotura transversal
silenciosa · 2 en riesgo por `seller_perfil` · 15 sanas.**

> 🔴 **EL LÍMITE DEL VEREDICTO «OK», declarado:** este diff se hizo a
> nivel de **TABLA**, no de **COLUMNA**. `productos` perdió 8 columnas y
> `pedidos` perdió 6 en S95. **Una pantalla marcada OK puede estar
> escribiendo una columna que ya no existe.** Los «OK» son un **techo**,
> no un piso.

---

## 5. 🔴 ESCRITURAS QUE SALTAN LA PUERTA ÚNICA

**104 escrituras directas sobre 36 tablas. Un (1) RPC en todo el
portal.**

> **Nota de método, declarada porque el primer número estuvo mal:** mi
> primer contador dio **94** porque el regex consumía la cola y se
> saltaba cadenas `.from()` solapadas — dos `DELETE` de `beta_users`
> quedaron invisibles. Corregido y recontado: **104**. El número que
> vale es el del contador corregido.

**La regla de la casa no rige acá en absoluto: prácticamente el 100 % de
la escritura del portal es INSERT/UPDATE/DELETE directo a tabla.**

Las diez más escritas: `user_roles` (9) · `beta_users` (7) ·
`seller_comisiones` (7)❌ · `devoluciones` (5) · `mascotas_adopcion` (4) ·
`envios` (4) · `zonas_cobertura` (4) · `country_config` (4) ·
`pedidos` (4) · `productos` (4).

Las que pesan por lo que significan, no por el conteo:

| Pantalla | Línea | Acción |
|---|---|---|
| Sellers | `234` `542` `548` `1276` `1280` | INSERT/UPDATE de `user_roles` — alta, aprobación y revocación del rol seller |
| UsuarioDetalle | `238` `302` `331` `366` | 4 escrituras más de `user_roles` |
| UsuarioDetalle | `255` | UPDATE de `profiles` |
| PrestadorDetalle | `230` `245` | **Aprobar / rechazar documentos de identidad** — el proceso §14.2 |
| PrestadorDetalle | `197` `213` `222` | UPDATE directo de `prestadores` |
| PedidoDetalle | `165` `178` `191` | **UPDATE de estado de pedido**, incluye cancelar |
| PedidoDetalle | `218` `239` | INSERT de `envios` y `devoluciones` |
| Logistica | `563`-`598` | Aprobar, rechazar, recibir y **reembolsar** devoluciones — `monto_reembolso` a mano |
| Liquidaciones | `260` `475` `498` | Crear y aprobar liquidaciones (sobre tabla inexistente) |
| Sellers | `171`-`506` | **7 escrituras de `take_rate_pct`** (sobre tabla inexistente) |
| Notificaciones | `256` | INSERT masivo de `notificaciones` en lotes de 500 |
| Roles | `99` `191` `344` `581` | Crear roles de admin y asignar permisos |

> **La consecuencia, medida:** decidir el estado de un pedido, aprobar un
> documento de identidad, aprobar un reembolso, otorgar un rol o fijar un
> take rate son **acciones que solo existen dentro de un `onClick` de
> React**. No hay función que las nombre. **Ningún asistente, ninguna
> automatización, ningún otro cliente puede ejecutarlas** — y ninguna
> deja rastro salvo el que la propia tabla guarde.
>
> Y el cruce con S95: **`PedidoDetalle` hace UPDATE directo del estado
> del pedido — que es exactamente lo que la máquina de estados
> append-only de S95-D vino a impedir.**

**La única excepción:** `Gamificacion.tsx:89` → `rpc('otorgar_puntos')`.

---

## 6. NÚMEROS DE NEGOCIO ESCRITOS A MANO

### 6.1 🔴 El take rate: 14 %, en diez lugares

| Dónde | Qué dice |
|---|---|
| `Financiero.tsx:16` | `const TAKE_RATE = 0.14` |
| `Financiero.tsx:254` | `const revenueNeto = gmvTotal * TAKE_RATE` |
| `Dashboard.tsx:391` | literal `"Revenue del mes (14%)"` |
| `Dashboard.tsx:392` | `gmvMes * 0.14` |
| `Dashboard.tsx:393` | literal `"14% take rate"` |
| `Liquidaciones.tsx:197` | `?? 14` — **default cuando `seller_comisiones` no responde** |
| `Sellers.tsx:414` y `:419` | `?? 14` — defaults global y por país |
| `Sellers.tsx:820` | texto al usuario: `"… > global (14% default)"` |
| **DB — `v_gmv_mensual`** | `sum(total) * 0.14 AS revenue` |
| **DB — `v_metricas_tiempo_real`** | `gmv_mes_actual * 0.14 AS revenue_mes` |

**Está mal por partida doble contra lo firmado en S95:**

1. **La tasa es 10 %**, no 14 %.
2. **El modelo ya no es GMV con margen: es FEE.** En Forma B el vendedor
   cobra y **esa plata jamás pasa por e-PetPlace**. Un tablero que
   muestra `GMV × tasa` **infla el ingreso proyectado un orden de
   magnitud**.

Y no es un solo número: son **tres mecanismos distintos** —una
constante, literales de texto, y un `?? 14` que se activa **justo cuando
la tabla de configuración no responde**— más **dos vistas de la base con
el `0.14` adentro del SQL**. **Cambiar `fee_configs` no mueve ninguno de
los diez.**

*(El `0.14` de las vistas no vive en el repo admin. Se reporta igual
porque alimenta directamente sus pantallas, y porque es la mitad del
problema que un relevamiento solo del código no vería.)*

### 6.2 IVA y país

`Paises.tsx:43-52` — catálogo **hardcodeado de 8 países** con su
`iva_pct`, moneda, pasarela y umbral de envío gratis: CO 19 · MX 16 ·
PE 18 · CL 19 · AR 21 · BR 17 · US 0 · ES 21. Son **semillas de
escritura**: al crear un país esos valores se insertan en
`country_config`. La base tiene `cat_tasas_impuesto` — **este catálogo no
la consulta**. **Ecuador no figura en la lista.**

### 6.3 Otros

- `PlanesPrime.tsx:52` — `['EC','CO','MX']` hardcodeada
- `Servicios.tsx:22` — `['EC','CO','MX','PE','CL','AR']` hardcodeada,
  **distinta de la anterior**
- 12+ sitios con `'EC'` como default literal
- `Productos.tsx` — `stock_minimo ?? 5` repetido en 7 lugares
- `Liquidaciones.tsx:27` · `Promociones.tsx:74` · `Sellers.tsx:68` —
  `currency: 'USD'` fijo en el formateo

---

## 7. ESTADO DEL DESPLIEGUE

| Qué | Medido |
|---|---|
| Stack | Vite 8 + React 19 + react-router 7 + recharts. SPA pura, sin backend propio |
| Plataforma | **Vercel** — `vercel.json` con rewrite SPA (commit `29a54dc`, 4-may-2026). **No hay directorio `.vercel`** ⇒ no puedo confirmar desde acá que el deploy esté vivo |
| Repo remoto | `guillermo381/e-petplace-admin`, rama `main`, árbol limpio |
| **Último commit** | **`79eb141` — 10 de mayo de 2026** |
| **Congelado hace** | **~3 meses.** La reforma de esquema es posterior. **Eso explica los 9 objetos rotos sin necesidad de ninguna otra hipótesis** |
| Telemetría instalada | **Sentry** (`main.tsx:8`) y **PostHog** con `capture_pageview: true` (`main.tsx:16`) — **ambos gateados por variable de entorno** |
| ¿Se puede medir el uso? | **Desde acá, no.** `.env.local` tiene **solo** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. En local la telemetría está apagada. Si esas variables están cargadas en Vercel, **PostHog tiene los pageviews** y ahí está la respuesta |

---

## 8. QUÉ **NO** PUDE MEDIR

Declarado, no completado con criterio:

1. **Si el portal está efectivamente desplegado y sirviendo.** Hay
   `vercel.json`; no hay evidencia local del deploy. No consulté la API
   de Vercel.
2. **Quién lo usa y con qué frecuencia.** Requiere el dashboard de
   PostHog, o confirmar que su key está cargada en Vercel.
3. **En qué migración desapareció cada uno de los 9 objetos.** Medí que
   *no existen hoy*; no reconstruí su historia.
4. **Si las pantallas rotas fallan ruidosa o silenciosamente.** Lo
   verifiqué **solo** para el badge del `Layout` (silencioso). Para las
   demás no leí el manejo de error de cada llamada.
5. **Si un admin real puede efectivamente escribir en las 30 tablas.**
   Medí RLS activa y policies con alcance de admin. **No ejecuté ninguna
   escritura de prueba** — esto es solo lectura, y probarlo exigiría
   escribir.
6. **El diff por COLUMNA.** Se hizo por tabla (§4, recuadro).
7. **Si `v_resenas_todas` tiene consumidores fuera de estos seis repos**
   (una función de base, un cron, un cliente externo). Medí seis repos y
   la definición de la vista; **no censé funciones de la base que la
   lean**.
8. **Las variables de entorno de producción.** Solo vi `.env.local`.

---

## 9. LOS TRES HALLAZGOS QUE ORDENAN LO QUE SIGUE

1. **La credencial es `anon` sobre la base de producción** ⇒ el portal es
   un ciudadano más de la RLS y las precauciones del monorepo **sí lo
   alcanzan**. No hay atajo de `service_role`.
2. **La rotura no es del dominio de sellers: es del núcleo.** `citas`,
   `vacunas`, `historia_clinica` y `v_bio_expediente` se llevan puestas
   cinco pantallas y la del expediente de mascota entera. **Eso no
   estaba en la premisa.**
3. **`v_resenas_todas` bloquea un borrado sin que nadie la lea, y
   `v_pitch_metrics` va a romper el tablero de inversores el día que se
   apague `seller_perfil`.** Las dos son consecuencias que **solo
   aparecen mirando afuera del monorepo** — que es exactamente para lo
   que se pidió este relevamiento.

---

## 10. DEUDAS QUE NACEN DE ACÁ

`D-758` · `D-759` · `D-760` · `D-761` · `D-762` · `D-763` — fichas en
`docs/DEUDAS_CANONICAS.md`.

*(`D-757` se encontró **tomada** por artefactos de S95-C sin ficha
depositada; no se usó ni se renumeró.)*
