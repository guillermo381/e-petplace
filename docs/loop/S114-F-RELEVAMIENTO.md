# S114-F · EL PORTAL DEL ADMIN — RELEVAMIENTO Y ALCANCE DEL MVP

**Tanda 0 · SOLO LECTURA.** Cero escrituras, cero migraciones, cero cambios en el admin legado.
Medido el **7-sep-2026** contra el objeto (repo `e-petplace-admin` @ `c0aee5e0` y la DB de
producción `zyltipqscdsdsxnjclhp`). Cada cero de este parte lleva su control positivo.

---

## 🔴 PRIMERA LÍNEA — CÓMO SE AUTENTICA (punto 2)

**NO es `service_role`. Es sesión de usuario real + gate respaldado por el servidor.
La anon key expuesta en el bundle no abre nada.**

Medido **por forma, no por nombre** (un grep de `service_role` en el repo da cero, pero eso mide
la convención): decodifiqué el claim `role` de cada JWT del `.env.local` **y del bundle
desplegado en `dist/`**, sin imprimir la clave.

| Qué | Resultado |
|---|---|
| Claves en `.env.local` | 1 JWT · `role=anon` · `ref=zyltipqscdsdsxnjclhp` |
| JWTs horneados en `dist/assets/index-*.js` | 1 · `role=anon` · mismo ref |
| Proyecto | **El mismo de producción del monorepo** |
| Entrada del humano | `signInWithPassword` + Google OAuth |
| Gate de admin | `admin_users.activo` (`App.tsx`, efecto 2) |

**Control del instrumento** — sin esto el "no hay service_role" no vale nada:
- **Positivo:** fabriqué un JWT con `role=service_role` y el mismo decodificador lo detectó.
- **Negativo:** sobre un archivo sin JWT devolvió 0, no inventó.

### El gate NO es decorativo — y esa era la pregunta real

Un gate en el cliente sirve de nada si el servidor no lo respalda. Acá **sí lo respalda, y por la
misma fuente**: `is_admin()` es `SECURITY DEFINER` y lee **la misma tabla `admin_users`** que
consulta el front. Las policies de escritura de la base la invocan.

**Sonda por camino real con la anon key del bundle** (solo lecturas, respetando la veda):

```
admin_users     HTTP 200  filas=0        prestadores   HTTP 200  filas=0
cupones         HTTP 200  filas=0        app_config    HTTP 200  filas=0
beta_users      HTTP 200  filas=0        pedidos       HTTP 401  (42501)
devoluciones    HTTP 401  (42501)
--- control positivo ---
cat_paises      HTTP 200  filas=1        cat_especies  HTTP 200  filas=1
```

La sonda discrimina: devuelve filas donde debe y cero donde debe. **Ninguna tabla del admin filtra
a un anónimo.** De las 36 tablas que el admin escribe, las 29 que existen tienen **RLS activa —
cero con RLS apagada**.

*Control del detector de RLS:* marcó `RLS-OFF` en `cat_bancos`, `cat_paises` y
`cat_tipos_documento_titular` (las tres que el canon declara sin RLS) y `RLS-ON` en `pedidos` y
`prestadores`. Discrimina.

### Los tres asteriscos, que no cambian el veredicto pero hay que nombrar

1. **🔴 `otorgar_puntos` — `D-314` está curada a medias.** `anon` ya no la ejecuta (eso se cerró),
   pero **`authenticated` sí**, es `SECURITY DEFINER` y **no tiene gate de admin en el cuerpo**
   (medido: `pg_get_functiondef ILIKE '%is_admin%'` → false). Cualquier usuario logueado de la app
   cliente puede otorgarse puntos arbitrarios. Hoy es inocuo porque el motor de gamificación está
   muerto; **deja de serlo el día que se encienda**.

2. **🟡 `admin_users` tiene los 7 privilegios concedidos a `anon`** (`SELECT, INSERT, UPDATE,
   DELETE, REFERENCES, TRIGGER, TRUNCATE`). Hoy **la RLS los frena**: hay una sola policy, de
   SELECT, con expresión `auth.uid() = id` — por eso la sonda anónima devolvió 0 filas, y sin
   policy de escritura la RLS deniega. **No es explotable por la API REST hoy** (PostgREST no
   expone TRUNCATE). Es defensa en profundidad ausente: el día que alguien agregue una policy
   permisiva, esos grants ya están puestos.

3. **🟡 `profiles` no contempla admin.** Sus dos policies de escritura son `auth.uid() = id`.
   `UsuarioDetalle.tsx:255` hace `UPDATE` sobre `profiles` ⇒ **el admin no puede editar el perfil
   de otro usuario, y PostgREST devuelve éxito con cero filas.** Falla en silencio.

> **Corrección de mi propio instrumento, declarada:** mi primer conteo marcó
> `prestador_documentos` y `prestador_servicios` como "escritura sin gate de admin". **Era
> falso**: medí *texto* en vez de *alcance*. Sus policies llaman a `user_gestiona_prestador()`,
> cuya rama ③ es `OR public.is_admin()`. Es exactamente la trampa que S95-F documentó, y me la
> comí igual.

---

## 1 · QUÉ ES HOY EL ADMIN LEGADO

| | |
|---|---|
| **Repo** | `e-petplace-admin` — `git@github:guillermo381/e-petplace-admin`, **separado del monorepo** |
| **Stack** | React **19.2** · Vite **8** · TypeScript **6** · react-router-dom **7** · `@supabase/supabase-js` **2.105** · recharts · date-fns |
| **Observabilidad** | Sentry + PostHog (ambos por env var, apagados si falta) |
| **UI** | **Sin librería ni design system** — estilos inline en cada archivo |
| **Deploy** | **Vercel**, automático al push a `main` (`vercel.json` con rewrite SPA) |
| **URL** | `e-petplace-admin-git-main-guillo381-8993s-projects.vercel.app` — **URL de deployment de rama, no dominio propio** (leída del `redirectTo` del OAuth de Google) |
| **Quién despliega** | Vercel por push. **No verificado en vivo** (sin acceso al dashboard) — es lo que declara el README |
| **Último commit** | `c0aee5e0` · **2026-09-07 00:02** · *"Placas · los lotes de códigos se crean acá (S113 fase 3, firma del founder)"* |
| **Tamaño** | 30.843 líneas; **22.267 propias** (sin `database.types.ts`, que son 8.576 generadas) |
| **Pantallas** | **31** |
| **Bundle** | 1,9 MB (`index-ClZ_B9Sx.js`) |
| **Árbol** | Limpio, sin cambios sin commitear |

### 🔴 El ritmo, que es el dato que más dice

```
2026-04 : 18 commits
2026-05 : 72 commits   ← última actividad de desarrollo: 10 de mayo
2026-06 :  0
2026-07 :  0
2026-08 :  0
2026-09 :  1           ← ayer, S113 fase 3 (Placas)
```

**Los últimos tres meses completos (jun-jul-ago): CERO commits.** El admin se construyó en dos
meses, se congeló casi cuatro, y **volvió a moverse ayer**. En esos cuatro meses el monorepo
corrió de S60 a S113: el modelo de datos se movió debajo y el admin no.

**Y el commit de ayer marca la dirección:** `Placas` se construyó **con RPC gateada**
(`crear_lote_placas`, con `is_admin` en el cuerpo y no ejecutable por `anon` — medido), no con
INSERT directo como las 30 pantallas anteriores. Es el único módulo del admin escrito con el
criterio de la casa de hoy.

---

## 2 · EL CENSO DE PANTALLAS (punto 3)

**Método:** parser sobre cada `.from('x')` con su ventana de contexto para clasificar la
operación, más las `.rpc(`. **Verificado con un segundo método independiente** (grep crudo de
operadores): los dos coinciden exacto — `insert=31 · update=67 · upsert=4 · delete=2 · rpc=3`.

> **Nota de instrumento:** mi primer intento de ese control devolvió **0 en todo** — no por
> ausencia, sino porque zsh expandió el glob de `--include` y `grep` falló. El `0` era del
> comando, no del código. Lo repetí con comillas.

### El titular: **104 escrituras directas contra 3 RPCs**

El admin escribe **36 tablas con `insert`/`update`/`delete` directos** y usa exactamente **3
funciones** (`otorgar_puntos`, `crear_lote_placas`, `listar_placas_de_lote`). Es la arquitectura
inversa a la del monorepo, donde todo pasa por wrappers y funciones con gate.

*(S95-F midió "104 escrituras contra 1 RPC". El 104 coincide exacto — mide lo mismo. Los RPC
subieron de 1 a 3 con el commit de ayer.)*

### 🔴 10 de 58 objetos referenciados YA NO EXISTEN (17%)

`citas` · `vacunas` · `historia_clinica` · `v_bio_expediente` · `envio_eventos` ·
`mensajes_admin_seller` · `seller_comisiones` · `seller_inventario` · `seller_liquidaciones` ·
`v_pedido_liquidacion`

No es deriva del dominio de sellers: **`citas`, `vacunas`, `historia_clinica` y `v_bio_expediente`
son el modelo clínico viejo** que el monorepo reemplazó por eventos.

### Tabla del censo

Criterio: **MUERTA** = su objeto central no existe · **VIVA SIN USO** = objetos existen, datos
congelados o vacíos · **VIVA** = objetos existen y hay actividad medible.

| Pantalla | Qué hace | Escribe | Rastro de uso | Estado |
|---|---|---|---|---|
| **Citas** | Agenda de citas | `citas`✝, `notificaciones` | — | 🔴 **MUERTA** — su tabla central no existe |
| **Mensajes** | Chat admin↔seller | `mensajes_admin_seller`✝ | — | 🔴 **MUERTA** |
| **Liquidaciones** | Pago a sellers | `seller_liquidaciones`✝ | — | 🔴 **MUERTA** — 3 de 5 objetos no existen |
| **Productos** | Catálogo | `productos` | 470 filas, últ. 14-ago | 🔴 **MUERTA** — usa 8 columnas, **solo `nombre` existe** |
| **MascotaDetalle** | Ficha clínica | `vacunas`✝ | — | 🔴 **MUERTA** — 4 de 7 objetos no existen |
| **Sellers** | Gestión de sellers | `seller_comisiones`✝, `seller_inventario`✝, `user_roles`, `seller_perfil` | — | 🟠 **PARCIAL** — 3 de 8 rotos |
| **Financiero** | Finanzas | *(solo lectura)* | — | 🟠 **PARCIAL** — lee `seller_liquidaciones`✝ |
| **Logística** | Envíos, zonas, **devoluciones** | `envio_eventos`✝, `envios`, `zonas_cobertura`, `devoluciones` | envíos: 5 (últ. 18-ago) · zonas: 20 (02-may) | 🟠 **PARCIAL** — ver abajo |
| **Adopción** | Refugios y solicitudes | `mascotas_adopcion`, `solicitudes_adopcion`, `adopcion_seguimiento` | **0 · 0 · 0 filas** | 🔴 **MODELO EQUIVOCADO** — ver abajo |
| **UserTimeline** | Actividad del usuario | *(lectura)* | — | 🟠 lee `citas`✝, `vacunas`✝ |
| **Dashboard** | Métricas | *(lectura)* | — | 🟠 2 objetos rotos + **el 14%** |
| **Notificaciones** | Envío masivo | `notificaciones`, `app_config` | 26 filas, últ. **3-ago** | 🔴 **NO DESPACHA** — ver abajo |
| **Promociones** | Cupones y campañas | `cupones`, `campanas` | 1 y 1 fila, **02-may** | 🟡 VIVA SIN USO |
| **BetaUsers** | Compuerta beta | `beta_users` | 2 filas, **02-may** | 🟡 VIVA SIN USO |
| **PlanesPrime** | Planes Prime | `planes_prime` | 3 filas, **02-may** | 🟡 VIVA SIN USO |
| **Gamificación** | Logros y niveles | `logros`, `niveles`, RPC `otorgar_puntos` | 18 logros, sin motor | 🟡 VIVA SIN USO |
| **Paises** | `country_config` | `country_config` | 2 filas | 🟡 VIVA SIN USO |
| **Servicios** | `tipos_servicio` | `tipos_servicio` | 30 filas | 🟡 VIVA SIN USO |
| **Roles** | Roles de admin | `admin_roles`, `admin_permisos`, `admin_usuarios_roles` | 3 admins (2 activos) | 🟡 VIVA SIN USO |
| **UsuarioDetalle** | Ficha de usuario | `profiles`⚠, `user_roles`, `notas_admin_usuario` | notas: **0 filas** | 🟠 el UPDATE de `profiles` **no puede escribir** |
| **PrestadorDetalle** | **Verificación de prestadores** | `prestador_documentos`, `prestadores`, `prestador_servicios`, `prestador_resenas` | **8 de 11 docs revisados, últ. 15-ago** | 🟢 **VIVA — la única con uso administrativo reciente** |
| **Prestadores** | Lista | *(lectura)* | 12 prestadores | 🟢 VIVA |
| **Pedidos / PedidoDetalle** | Pedidos, envíos, devoluciones | `pedidos`, `envios`, `devoluciones`, `notificaciones` | 96 pedidos, últ. **7-sep** | 🟢 VIVA *(los pedidos los crean las apps, no el admin)* |
| **Placas** | Lotes de códigos | RPC `crear_lote_placas` | construida **ayer** | 🟢 VIVA |
| **Inversores** | Pitch metrics | *(lectura)* | — | 🔴 **el 14%** — ver abajo |
| **Mascotas / Usuarios** | Listas | *(lectura)* | — | 🟢 VIVA |
| **Layout** *(transversal)* | Badge de mensajes | *(lectura)* | — | 🔴 suscripción realtime a tabla inexistente **en cada carga** |

### 🔴 La de **devoluciones** en `Logistica.tsx` (marcada como pediste)

- Vive en `TabDevoluciones()` (línea 1152), con modal de detalle (528) y 4 `UPDATE` sobre
  `devoluciones` (563, 575, 585, 598) — aprobar, rechazar, marcar recibida, cerrar.
- La tabla **existe** y tiene **RLS con 3 policies de escritura, las 3 con `is_admin`**. Está bien
  construida del lado del permiso.
- **`devoluciones` tiene CERO filas.** Nunca se usó.
- La otra punta: `PedidoDetalle.tsx:199` **inserta** devoluciones. Ese es el productor, y tampoco
  produjo nunca.
- **Ninguna app del monorepo la toca** (0 archivos en `packages/api`).

**Lectura:** es una pantalla completa, con permisos correctos, para un proceso que **todavía no
ocurrió ni una vez**. No está rota — está sin estrenar. Cuál de las dos cosas es depende de si en
octubre va a haber devoluciones de despensa, y eso es decisión de producto, no medición.

### 🔴 Adopción está mirando el modelo muerto

Hay **dos modelos de adopción conviviendo** en la base, y el admin ve el que no se usa:

```
VIEJO (lo que ve el admin)        NUEVO (S112, el vertical real)
mascotas_adopcion      = 0        adopcion_publicacion = 6
solicitudes_adopcion   = 0        adopcion_solicitud   = 3
adopcion_seguimiento   = 0        adopcion_mensaje     = 9
                                  adopcion_firma       = 2
```

S112 construyó el vertical entero —vidriera, postulación, hilo, acta, dos firmas, traspaso— sobre
**once tablas nuevas** que el admin no conoce. La pantalla de Adopción abre y muestra tres listas
vacías, sin error. **No dice que está mirando el lugar equivocado: dice que no hay nada.**

### 🔴 Notificaciones: el admin escribe donde ya nadie lee

```
notificaciones        (lo que escribe el admin)  = 26 filas · última 2026-08-03
notificacion_intencion (el motor vivo de S90)    = 410 filas · última 2026-09-07 · 294 entregadas
```

Y el censo de consumidores: **`notificaciones` la toca 1 sola función** (`contar_pendientes`, un
contador de badge). **`notificacion_intencion` la tocan 9.**

⇒ **Una notificación enviada desde el admin no se despacha.** No hay push, ni email, ni WhatsApp:
cae en una tabla que solo alimenta un contador. La pantalla promete un envío que no ocurre, y no
falla — es la clase de defecto sin síntoma que el canon persigue.

### 🔴 El 14% de `D-759` sigue vivo, 19 sesiones después

- `Dashboard.tsx:392` → `gmvMes * 0.14`
- **`v_gmv_mensual` lo lleva embebido en el SQL de la vista:** `(sum(total) * 0.14) AS revenue`
- `Inversores.tsx:45` lee `revenue` **de esa vista** y lo grafica

La tasa firmada es **10%**, y la base **no es GMV: es FEE** (en Forma B el vendedor cobra y esa
plata nunca pasa por e-PetPlace). El número que ve un inversor está inflado por dos ejes a la vez.

*Enmienda a lo heredado:* S95-F reportó "dos de los diez son vistas con el 0.14 embebido". Medido
hoy: **`v_gmv_mensual` sí, `v_pitch_metrics` no** (control: `v_mrr` también da false, el detector
discrimina).

---

## 3 · QUÉ HACE EL ADMIN QUE NINGUNA OTRA SUPERFICIE HACE (punto 4)

**La medición que ordena todo el punto:** las funciones administrativas de la base **existen y
están gateadas**, pero **no tienen puerta**.

```
revisar_documento_prestador  → wrappers en packages/api: 0   (solo en database.types.ts)
invitar_prestador            → 0        activar_prestador  → 0
crear_lote_placas            → 0        otorgar_puntos     → 0
publicar_oferta_sku          → 0
```

Las seis aparecen **únicamente en el tipo generado**. Cero wrappers, cero exports en `index.ts`,
cero llamadas desde `apps/`. *(El `invitarPrestador` que aparecía en tres archivos de `apps/` es
una clave de i18n —`invitarPrestadorToggle`—, falso positivo descartado.)*

Y del otro lado: **115 funciones de la base ya tienen gate `is_admin` en su cuerpo.** El motor
administrativo está construido. Lo que falta es la puerta y la superficie.

| Función | ¿Puerta en las apps? | Quién la hace hoy |
|---|---|---|
| **Verificar prestadores** (aprobar/rechazar documentos) | ❌ `revisarDocumentoPrestador` sin wrapper | **Solo el admin** — y es lo único con uso reciente (8/11 docs) |
| **Alta de prestadores** (`invitar_` / `activar_`) | ❌ sin wrapper | Founder por SQL, o el admin |
| **Liquidar al prestador** | ❌ el prestador **solo ve** su ledger (Liquidaciones v1, lectura) | **Nadie** — la pantalla del admin está rota |
| **Cupones y campañas** | ❌ 0 archivos en `packages/api` | **Solo el admin** |
| **Beta gate** (`beta_users`) | ❌ 0 | **Solo el admin** |
| **Catálogo de productos** | ❌ `publicar_oferta_sku` sin wrapper | **Solo el admin** — y su pantalla está rota |
| **Notificaciones masivas** | ❌ 0 | **Solo el admin** — y no despacha |
| **`country_config`, `tipos_servicio`** | 🟡 lectura (1 y 11 archivos) | Escritura: solo el admin |
| **Roles de plataforma** | ❌ 0 | **Solo el admin** |
| **Gamificación / Prime** | ❌ 0 | Solo el admin (motor muerto) |
| **Zonas de cobertura, devoluciones** | ❌ 0 | Solo el admin |
| **Adopción / refugios** | 🟢 el vertical S112 vive en las apps | El admin mira el modelo viejo |
| **Pedidos** | 🟢 las apps los crean y operan | El admin solo cambia estado |

**Lo insustituible hoy, en una línea:** verificar prestadores · dar de alta prestadores ·
cupones · beta gate · catálogo · notificaciones masivas · roles · configuración de país y
servicios. De esos ocho, **tres tienen la pantalla rota** (catálogo, liquidaciones, notificaciones
que no despachan).

---

## 4 · QUÉ NECESITA LA CASA PARA OPERAR EN OCTUBRE (punto 5)

Esto es **mi lectura con argumento**, separada del censo de arriba. Contrasta contra
`DEFINICION_SOFTLAUNCH` §3.5, cuyo test es: *"¿puede un dueño real pagar, quejarse, cancelar,
cambiar de idioma y borrar su cuenta sin que ninguna de esas acciones pase por el WhatsApp del
founder?"*

### 🔴 Sin esto no se puede lanzar

1. **Verificar y dar de alta prestadores.** Es la puerta por la que entra la oferta. Sin ella no
   hay a quién reservarle. Hoy funciona por el admin (8 de 11 documentos revisados) y **no tiene
   equivalente en ninguna app**. *Es lo único del admin con uso administrativo reciente medido —
   y eso mismo dice cuál es el corazón del MVP.*
2. **Liquidar al prestador.** §3.5 lo pone explícito: *"el que trabaja, cobra — el motor de
   liquidaciones se extiende de sellers a prestadores"*. Hoy el prestador **ve** su ledger y nadie
   puede **pagarle**: la pantalla del admin está rota (3 objetos inexistentes) y era de sellers,
   no de prestadores. **Un prestador que trabaja en octubre y no cobra es el peor modo de falla
   del lanzamiento**, y no tiene camino hoy.
3. **Notificaciones que lleguen.** §3.5 las declara precondición de dos decisiones ya firmadas
   (aviso de vencimiento P16(e) y renovación 72h del plan). El motor vivo funciona; **la puerta
   del admin escribe a la tabla que nadie despacha**. Si el operador necesita avisarle algo a las
   familias, hoy no puede.
4. **Beta gate (`beta_users`).** §3.5 lo nombra como compuerta de salida para un launch
   controlado. La pantalla existe y funciona; **2 filas, congelada en mayo**. Barato, pero es la
   llave del lanzamiento controlado y hay que confirmar que abre.

### 🟡 Esto puede esperar

- **Catálogo de productos.** La pantalla está rota, pero el corte de la despensa se maneja por
  script (firma S95-F: *"el catálogo inicial v1 se carga por SCRIPT, no por pantalla"*). Con un
  vendedor, es un seed, no una interfaz.
- **Cupones y campañas.** Nada del soft launch depende de una promoción.
- **Devoluciones.** Cero filas históricas. Si en octubre aparece la primera, se atiende a mano;
  construir el flujo antes de tener el caso es adivinar.
- **Adopción en el admin.** El vertical de S112 corre en las apps, incluido un traspaso real.
- **Gamificación, Prime, Placas, Roles, Países, Servicios, Inversores.** Ninguno bloquea.

### 🔴 Y una que no es de pantallas y sí es de octubre

**El 14% del Dashboard y de Inversores.** No bloquea la operación, pero es el número que se le
muestra a un inversor, inflado por dos ejes. Es una línea en una vista y una en el Dashboard.

---

## 5 · EL COSTO DE LAS DOS SALIDAS (punto 6)

### 🔴 Primero: una premisa de la consigna que hay que corregir, con la medición

La consigna dice *"las ~25% de carga de realtime que el panel de administración suma hoy"*. Medí,
y **son dos cosas distintas y ninguna es el admin portal**:

```
24.9%  SELECT wal->>... (poller de WAL)   calls=1.147.245
20.9%  SELECT wal->>... (poller de WAL)   calls=  957.019   → realtime = 45,8%
 6.5%  SELECT name FROM pg_timezone_names          calls=2.962
 6.1%  with f as (-- CTE with sane arg_modes...)   calls=3.435
 3.7%  SELECT tbl.schemaname... json_agg(columns)  calls=3.587
 3.6%  SELECT e.name... pg_available_extensions    calls=3.825
 2.6%  WITH RECURSIVE base_types...                calls=2.962   → introspección ≈ 22,5%
```

El **45,8%** es el poller de WAL (realtime). El **~22,5%** que le sigue es **introspección de
esquema de Supabase Studio y del schema cache de PostgREST** — `pg_timezone_names`,
`pg_available_extensions`, el `json_agg` de columnas. **Ese es el "panel de administración" del
canon: es Supabase Studio, no el admin portal de e-PetPlace.**

**Y el admin portal no aparece en el perfil de la base.** Ninguna consulta sobre sus tablas figura
en el top.

> *Declaro un error propio: para buscarlas corrí una query cuyo porcentaje se calculaba sobre el
> subconjunto filtrado, no sobre el total — daba "35%" para consultas con `calls=1`. Números sin
> sentido; los descarté y no los uso.*

**Y el realtime del admin es aún menos que eso:**

```
Suscripciones realtime en el admin : 2  (Layout.tsx y Mensajes.tsx)
Ambas sobre                        : mensajes_admin_seller  ← NO EXISTE
Tablas en la publicación supabase_realtime : 16  ← mensajes_admin_seller NO está
Replication slots                  : 0
```

Las 16 tablas publicadas son todas del monorepo (`evento_cita_servicio`, `prestadores`,
`adopcion_*`, `bonos`, `estadias`…).

**⇒ Respuesta directa al punto 6: apagar o migrar el admin NO baja la carga de realtime en nada.
Sus dos canales son sobre una tabla que no existe ni está publicada. El 45,8% lo consumen las
apps del monorepo y las webs del legado; el ~22,5% es Studio.** El costo de infraestructura **no
es un criterio para decidir entre (a) y (b)** — y eso es bueno, porque libera la decisión para
juzgarse por lo que sí importa.

### Salida (a) — front nuevo en el monorepo, legado vivo para lo no cubierto

**Qué se reusa:**
- **El motor entero: 115 funciones con gate `is_admin` ya construidas y probadas en la base.** Es
  el activo grande y ninguna salida lo pierde.
- El gate de identidad: `admin_users` + `is_admin()` funciona y está respaldado.
- La disciplina de la casa: `ResultadoWrapper<T>`, errores tipados, wrappers como puerta única.

**Qué se reescribe:**
- **Los wrappers, que hoy son cero.** Las 6 funciones administrativas no tienen ninguno. Es
  trabajo nuevo, pero es el trabajo que el monorepo ya sabe hacer (122 wrappers construidos).
- **La superficie entera.** No hay atajo: el admin no tiene design system, son estilos inline en
  22.267 líneas. Nada de eso se copia a `packages/ui`.

**Qué queda huérfano:** las ~25 pantallas que no entren al MVP siguen en el legado, con su
frontera declarada.

**🔴 El freno medido, y es el que más pesa:** **no hay precedente de un front web con
`packages/ui` en el monorepo.** `apps/pagos-web` es **HTML estático generado por `build.mjs`** —
no usa `packages/ui` ni `packages/api`. Las dos apps son Expo/RN-web. Construir un admin con
`packages/ui` significa **estrenar RN-web para tablas densas de escritorio**, que es justo donde
un design system pensado para teléfono da menos. *Eso no es una medición de costo: es un riesgo
que la primera pantalla va a revelar, y conviene que la primera sea chica.*

### Salida (b) — evolucionar el legado en su lugar

**Qué se reusa:** las 31 pantallas, el routing, el layout, el login, los 1,9 MB de superficie ya
construida. **Y el precedente de ayer: `Placas` demuestra que se puede sumar un módulo nuevo al
legado con RPC gateada.**

**Qué se reescribe:** las 5 pantallas muertas y las 3 parciales. **Y las 104 escrituras directas,
si se quiere alinear con la disciplina de la casa** — aunque nada obliga a hacerlo de una.

**Qué queda huérfano:** nada.

**🔴 Los frenos medidos:**
- **La deriva es estructural, no un atraso.** 10 de 58 objetos ya no existen. El monorepo corrió
  56 sesiones mientras el admin estuvo quieto, y **va a seguir corriendo**. Cada vertical nuevo
  (adopción fue el último) deja al admin una pantalla más atrás, y **la pantalla no falla:
  muestra vacío**.
- **Dos fuentes de verdad para el mismo dominio.** El admin tiene su propio `database.types.ts`
  (8.576 líneas) que hay que regenerar aparte, y su propio criterio de acceso. Ninguna regla del
  monorepo lo alcanza: ni `verify:diseno`, ni el hook de pre-commit, ni la puerta única.
- **Nada garantiza que no vuelva a congelarse.** Estuvo cuatro meses sin tocarse y nadie lo notó
  hasta que hizo falta.

---

## 6 · RECOMENDACIÓN (punto 7) — el founder firma

No decido. Sirvo tres opciones con **una razón cada una**, y digo cuál votaría.

**Opción 1 — MVP nuevo en el monorepo, angosto: solo lo que octubre exige.**
Las cuatro rojas del punto 4 (verificar/dar de alta prestadores · liquidar al prestador ·
notificaciones que despachen · beta gate), con sus wrappers, y el legado vivo para todo lo demás.
> **La razón:** de las ocho funciones insustituibles, **tres ya están rotas** — no se migran, se
> construyen igual. Y liquidar al prestador **no existe en ningún lado**, así que es construcción
> nueva vaya donde vaya. El MVP no es una migración: es lo que falta.

**Opción 2 — reparar el legado en su lugar.**
Curar las 5 muertas y las 3 parciales, sumar liquidación de prestadores al estilo `Placas`.
> **La razón:** es el camino más corto a octubre y el precedente de ayer prueba que funciona —
> pero **el 17% de objetos rotos no fue un accidente**: fue el costo de cuatro meses de deriva
> sobre un repo con su propia fuente de verdad, y ese costo se vuelve a pagar en la próxima
> sesión que mueva el modelo.

**Opción 3 — no tocar nada del admin y llegar a octubre con lo que hay.**
> **La razón:** es la única opción que **no cumple `DEFINICION_SOFTLAUNCH` §3.5** — sin liquidar
> al prestador, un prestador que trabaje en octubre no cobra, y el test del soft launch pide
> exactamente que eso no pase por el WhatsApp del founder.

**Mi voto: la 1, arrancando por la liquidación al prestador.** No porque el monorepo sea mejor
casa —eso es preferencia— sino porque **es la única de las cuatro rojas que no existe en ningún
lado**, así que se construye desde cero de todos modos; y construirla en el monorepo la deja
donde vive el ledger, los pagos y los wrappers, en vez de en un repo con su propia copia de los
tipos. **Y es la primera pantalla chica que necesito para descubrir si RN-web sirve para esto,
antes de apostar 31 pantallas a esa respuesta.**

---

## 7 · LO QUE NO MEDÍ, Y POR QUÉ

- **PostHog.** Sin acceso. El "se usa" de cada pantalla lo derivé de **datos escritos**, que es un
  rastro más pobre: dice que la tabla recibió filas, no que alguien abrió la pantalla. Donde puse
  "última: 2026-05-02" **no puedo distinguir si lo escribió el admin o un seed**.
- **Escritura por camino real.** La veda era de solo lectura y la respeté. Que un `authenticated`
  no-admin no pueda escribir esas tablas **lo derivo de la configuración** (RLS activa + cero
  policies de escritura sin `is_admin`), **no de una sonda que lo haya intentado**. Es
  determinista en Postgres, pero es derivación y no medición — y la casa ya se cobró esa
  diferencia antes (`D-490`: la policy decía una cosa y el camino real, otra).
- **El deploy en vivo.** No tengo acceso al dashboard de Vercel. Que despliegue por push a `main`
  es lo que declara el README; la URL la leí del `redirectTo` del OAuth. **No verifiqué si hay un
  dominio propio configurado** ni quién es el dueño del proyecto en Vercel.
- **Quién revisó los 8 documentos de prestador.** `prestador_documentos` tiene `revisado_en` pero
  **no pude distinguir si fue por el admin o por SQL directo**. Es el rastro más importante del
  parte y es ambiguo; lo declaro.
- **`pg_stat_statements` no atribuye por aplicación.** El admin manda
  `x-application-name: epetplace-admin`, pero ese header no llega a la vista. Que el admin no
  aparezca en el perfil es consistente con que casi no se use, **pero no lo prueba**: la vista
  tiene techo y descarta lo menos frecuente.

---

## 8 · FICHAS CANDIDATAS (no depositadas — el número se pide con `pnpm proximo:ficha`)

1. 🔴 `otorgar_puntos` sin gate para `authenticated` — `D-314` curada a medias.
2. 🔴 El 14% vivo en `Dashboard.tsx:392` y embebido en `v_gmv_mensual` — `D-759`, 19 sesiones.
3. 🔴 El admin escribe `notificaciones`, que ya nadie despacha.
4. 🔴 `Productos.tsx` usa 8 columnas de las que solo `nombre` existe.
5. 🔴 Adopción del admin apunta al modelo viejo (0 filas) mientras el vertical vive en 11 tablas nuevas.
6. 🟡 `admin_users` con los 7 privilegios concedidos a `anon`, frenados solo por RLS.
7. 🟡 `UsuarioDetalle` hace `UPDATE profiles` que no puede escribir y no falla.
8. 🟡 `Layout.tsx` abre una suscripción realtime a una tabla inexistente en cada carga.
9. 🟡 El OAuth de Google redirige a una URL de deployment de rama, no a un dominio propio.
