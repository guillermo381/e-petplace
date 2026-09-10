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

## §6 · EL TABLERO ECONÓMICO Y FISCAL — dictado del founder (S115, 10-sep-2026)

> **Depositado verbatim.** Lo que sigue es la letra del founder, sin editar. Debajo, en §6.1,
> el estado MEDIDO de cada pieza contra el motor vivo — porque la ley del dictado
> («todo LEE del motor») decide quién construye qué, y dos de los cinco tableros piden
> números que hoy la base no tiene.

```
apps/admin. Todo lo que sigue LEE del motor; ningún número se calcula en la pantalla.

① Editor de comisiones: las filas vigentes de fee_configs con su porcentaje, su mínimo,
su vigencia y su historial visible (quién cambió qué y cuándo). Cambiar una comisión es
cerrar la vigente y abrir otra, nunca editar el pasado. ② Tablero de margen por
transacción y por mes: GMV, ingreso de la casa (comisión + tarifa de servicio), costo del
riel, costos variables, contribución, y el take rate efectivo. Con corte por vertical y
por medio de pago — ese corte es el que dice si la mezcla se está moviendo hacia DeUna,
que es la palanca más grande que tenemos. ③ Tablero de caja retenida: retención de renta
y de IVA acumuladas del período, y cuánto lleva atrapado. Es plata que vuelve, pero hay
que verla. ④ Panel fiscal: documentos por estado, rechazos, reemisión, cierre manual,
alerta de vencimiento del certificado a 30 y 7 días. ⑤ La compuerta de la liquidación,
visible: qué prestador no puede cobrar y por qué (falta su comprobante del período).

Sin gráficos de torta, sin proyecciones: números del mes, comparables con el anterior.
```

### 6.1 · El estado medido de cada tablero

> Medido el 10-sep-2026 contra el proyecto `zyltipqscdsdsxnjclhp` con
> `npx supabase --experimental db query --linked --file <censo>.sql`.
> **Un tablero sin lector no es una pantalla pendiente: es motor pendiente**, y quien lo
> dibuje igual va a publicar un número plausible sobre datos que no existen.

| # | Tablero | Motor hoy | Qué falta |
|---|---|---|---|
| ① | Editor de comisiones | 🟢 **casi entero** — `fee_configs` ya tiene `vigencia_desde/hasta`, `activo`, `minimo_por_transaccion`, `created_by`, `notas`; **el historial ya se está grabando** en `fee_configs_historial` (`operacion`, `valor_anterior`, `valor_nuevo`, `cambiado_por`, `cambiado_en`, `motivo`) por el trigger `audit_fee_configs` | El lector admin y **la puerta de escritura atómica** — cerrar la vigente y abrir la nueva en un acto. Hoy no existe `admin_cambiar_comision`: sin ella, «cerrar y abrir» son dos UPDATE y un rebote deja el período sin comisión vigente |
| ② | Margen y take rate efectivo | 🟡 **la mitad** — los insumos por evento existen (`monto_bruto`, `monto_kushki_fee`, `monto_plataforma`, `monto_payout`, `fecha_devengo`) | 🔴 **El corte por MEDIO DE PAGO no es derivable hoy** — ver §6.2. Y el corte «por vertical» no sale de `revenue_stream`: tiene **un solo valor vivo** (`transaccional`); lo que hoy distingue es `origen_tipo` (`cita · estadia · pedido`) |
| ③ | Caja retenida | 🔴 **no existe** — ver §6.3 | El registro de la retención. Cero columnas de retención en `pagos_*`. `liquidaciones.retenciones_fiscales` es lo que Satori **retiene a terceros**, no lo que a Satori **le retienen**; `fiscal_emisor.agente_retencion` es una bandera |
| ④ | Panel fiscal | 🟢 **dos de cuatro** — `fiscal_admin_listar(estado, desde, hasta)` y `fiscal_admin_cerrar_manual(...)` vivas; `documentos_fiscales` tiene `estado`, `sri_error`, `motivo_rechazo`, `autorizado_en` y `documento_referencia_id` | **Reemisión** (no hay función) y 🔴 **la alerta del certificado, que no tiene dato** — ver §6.4 |
| ⑤ | Compuerta de la liquidación | 🟡 **la vista existe, muda** — `v_liquidaciones_pendientes_pago` trae `estado`, `datos_bancarios`, `dias_desde_aprobacion` | **El porqué.** La vista no expone si falta el comprobante del período (`documentos_fiscales.rol = comprobante_proveedor`). Sin eso la pantalla puede decir «no cobra» y no puede decir por qué, que es exactamente lo que el dictado pide |

### 6.2 · 🔴 El corte por medio de pago — la palanca más grande no se puede medir hoy

El dictado dice que el corte por medio de pago *«es el que dice si la mezcla se está
moviendo hacia DeUna, que es la palanca más grande que tenemos»*. **Medido: hoy no se puede
construir.**

`eventos_economicos` **no tiene `pago_intento_id`**. Sus únicas columnas de atadura son
`origen_tipo` / `origen_id` (que apuntan al objeto — cita, estadía, pedido — no al pago) y
`kushki_charge_id`, que está **en 0 de 61 eventos**. El medio de pago vive en
`pagos_intentos.proveedor` / `.forma`, y **no hay camino del evento al intento**.

⚠️ **Lo que lo vuelve urgente y no burocrático: este tablero no falla si se construye igual.**
Agrupa todo bajo un solo medio, o bajo «desconocido», y publica un número de mezcla
perfectamente creíble. *La palanca más grande medida con el instrumento equivocado es peor
que no medirla: una decisión de negocio se toma sobre ella.*

**Es motor, y es de A** — la columna, su backfill sobre los 61 eventos vivos, y el productor
que la estampe de ahí en adelante.

⚠️ **Ampliado el mismo día (§6.7 ②): la palanca tiene número.** `MODELO_ECONOMICO` v1.1 §3.bis
mide que **cada punto que sale de tarjeta de crédito vale ~4 % del ticket**, y calcula el
break-even entero sobre una **mezcla supuesta** de 45 % crédito · 15 % débito · 40 % DeUna.
*Este corte es el único instrumento que diría si esa mezcla es real.*

### 6.3 · 🔴 La caja retenida es plata que hoy nadie anota

`MODELO_FISCAL` §5 ya describe la retención — **2 % de renta** sobre pagos al establecimiento
afiliado (Res. NAC-DGERCGC26-00000009, mar-2026) más retención de IVA cuando aplica, que la
pasarela descuenta de la liquidación de fondos — y la deja como **F4, «dimensionarlo»,
pregunta abierta al contador**.

**Medido: no hay dónde anotarla.** Ninguna tabla `pagos_*` tiene columna de retención, y
`monto_kushki_fee` es el **costo del riel**, no la retención — sumarlos sería contar dos cosas
distintas en la misma fila.

Así que ③ tiene **dos huecos, y sólo uno es de código**: el registro por transacción (motor,
de A) y ~~**el número que el contador todavía no ratificó** (F4)~~ **[🔴 TACHADO EL MISMO DÍA —
ver §6.7 ①: `MODELO_ECONOMICO` v1.1 §1 hecho 2 ya lo da verificado, 2 % de renta + 30/70 % del
IVA, con fuente. El porcentaje está firmado; lo que sigue faltando es DÓNDE anotarlo]**.
*Un tablero de caja retenida alimentado por un porcentaje supuesto no muestra plata atrapada:
muestra una hipótesis con formato de dinero — y por eso el número firmado no cierra este hueco,
lo vuelve construible.*

### 6.4 · 🔴 La alerta del certificado no tiene dato — y es el ítem más barato de la lista

`MODELO_FISCAL` §7 ya la pedía, con su razón escrita: *«alerta de vencimiento del certificado
a 30 y 7 días (un certificado vencido detiene el 100 % de la facturación)»*. El dictado la
ratifica.

**Medido: `fiscal_emisor` no tiene ninguna columna de vencimiento** (`id · ruc · razon_social ·
nombre_comercial · direccion_matriz · establecimiento · punto_emision · obligado_contabilidad ·
leyenda_regimen · agente_retencion · contribuyente_especial · ambiente · actualizado_en`). El
censo de columnas `certificad|vence|expira|caduc` en todo `public` devuelve 31 columnas y
**ninguna es del emisor fiscal**.

Es **una columna y un lector**, y su ausencia apaga la facturación entera un martes cualquiera
sin aviso previo.

### 6.5 · ⚠️ EL CHOQUE DE ALCANCE — ② y ③ contra la puerta de §2, para firma

**§2 firma que entra al MVP sólo lo que cumple una de dos:** ① sin eso no se puede operar el
1 de octubre, o ② toca plata de un tercero. Y **§4 dice, literal:** *«Cualquier cosa que no
pase la puerta de §2. No se "deja preparada": no se nombra.»*

Contra esa puerta, los cinco no entran igual:

- **① editor de comisiones · ④ panel fiscal · ⑤ compuerta visible — PASAN.** ① y ⑤ tocan plata
  de un tercero de frente (definen cuánto cobra el prestador, y por qué no cobra). ④ pasa por
  las dos: una factura rechazada sin camino de reemisión **detiene** la operación.
- **② margen y ③ caja retenida — por la puerta literal, «esperan».** Son tableros de lectura de
  gestión: no detienen la operación el 1-oct y no mueven plata de un tercero.

**Esto no se absorbe en silencio.** El founder los está dictando, o sea que los está decidiendo
— pero decidirlos **ensancha §2**, y esta casa ya pagó tres veces el precio de dejar dos letras
firmadas contradiciéndose (el magenta en S83, la plata en S88, la telemedicina en S113):
*cualquiera cita la que le conviene y está «en regla»*.

**Las dos formas de cerrarlo, y las dos son del founder:**

- **(a) Enmendar §2** con un tercer criterio —*«③ mide si el negocio aguanta»*— y que ② y ③
  entren por ahí, con el criterio escrito para que la próxima pantalla se contraste contra él.
- **(b) Dejar §2 como está** y declarar ② y ③ como **excepción nominada del founder**, fuera de
  la puerta y con esa marca puesta.

*A favor de (a), honestamente: la contribución y la caja atrapada no son métricas de vanidad —
son lo que dice si hay con qué operar en noviembre. Pero el criterio lo escribe quien firma la
puerta, no quien construye contra ella.*

### 6.6 · Lo que este dictado NO decide

- **El diseño de los cinco tableros.** Rige §4: se decide con su dirección escrita antes de
  construir, y se juzga en la pantalla real.
- **El orden de construcción** dentro de §2.1. Hoy la tabla de §2.1 tiene cuatro filas y estos
  cinco no están en ninguna.
- **El número de la retención** (F4, del contador) ni **la tarifa de veterinaria** (F1, en
  disputa por `MODELO_FISCAL` v0.4 · E3).

### 6.7 · ⚠️ ENMIENDA DEL MISMO DÍA — el contexto económico que §6.1 no había leído

> **Escrita minutos después de depositar §6.1, y se declara en vez de reescribirla en
> silencio.** Al medir el árbol aparecieron `docs/MODELO_ECONOMICO.md` **v1.1** (10-sep,
> mesa + founder, **sin commitear al momento de escribir esto**) y dos migraciones de A de
> hace tres horas. *§6.1 se midió contra el motor vivo y contra `MODELO_FISCAL`; no contra
> la letra económica que se firmó esta misma mañana* — que es el contexto directo de este
> dictado. **Es `L-166` en carne: un dato vivo se relee al usarlo, y el mío tenía cuatro
> horas.**

**① Lo que CORRIGE de §6.3 — el número de la retención ya no es una hipótesis.**
`MODELO_ECONOMICO` §1 hecho 2 lo da verificado: las emisoras retienen **2 % de renta sobre la
base y 30 % (bienes) / 70 % (servicios) del IVA** de cada cobro con tarjeta, con su fuente
(calculadora de Nuvei + tablas de retención). Y lo dice casi con las palabras del dictado:
*«No es costo: es caja que sale hoy y vuelve en meses. Hay que tenerla.»*

⇒ **Se tacha de §6.3** *«el número que el contador todavía no ratificó»*: el porcentaje está
firmado. **Lo que NO cambia es el hallazgo**: sigue sin haber **dónde anotarla** — cero
columnas de retención en `pagos_*`. Y `MODELO_ECONOMICO` §3 ya le puso destino al motor:
*«deja de ser "TODO lejano"; se diseña apagado con la primera liquidación y se enciende para
las cuentas en agencia»*. **Queda una incógnita con dueño que sí toca a ③:** *«costo real de
DeUna y si retiene renta/IVA»* — Carlos Ochoa. Si DeUna no retiene, la caja atrapada depende
de la mezcla, y el tablero ③ y el ② dejan de ser dos tableros independientes.

**② Lo que REFUERZA de §6.2 — la palanca tiene número, y es grande.**
El veredicto de `MODELO_ECONOMICO` §0 corre con una **mezcla supuesta de lanzamiento de
45 % crédito · 15 % débito · 40 % DeUna**, y §3.bis cuantifica la palanca: **«cada punto que
sale de tarjeta de crédito vale ~4 % del ticket»**. El break-even entero —610 transacciones/mes
en F&F, ~2.020 en Operación— está calculado **sobre esa mezcla supuesta**.

⇒ *El corte por medio de pago no es un tablero de gestión: es el único instrumento que
diría si la mezcla real se parece a la que sostiene el break-even.* **Y hoy no se puede
construir** (§6.2). Eso mueve a ② hacia el criterio ① de §2 — lo cual **no lo firma esta
sección**: lo firma el founder en §6.5, y ahora con este número a la vista.

**③ Lo que hay que RE-MEDIR antes de construir ① y ② — trabajo de A en vuelo, no medido acá.**
En disco, sin commitear: `20260912340000_s115a_fees_firmados.sql` (toca `fee_configs`,
`_resolver_fee_aplicable`, `resolver_fee_aplicable`, `comision_efectiva`) y
`20260912350000_s115a_payout_y_categoria.sql` (reescribe `crear_evento_economico`, que **gana
`p_categoria_origen`**, y `_trg_cita_congela_desglose`).

⚠️ **No se afirma nada sobre ellas.** Lo que sí se declara, y cambia el reparto:

- La columna `minimo_por_transaccion` de `fee_configs` —que §6.1 fila ① da por existente— **es
  de esa tanda de hoy**, no del modelo viejo.
- `p_categoria_origen` sugiere que **el corte por vertical de ② está naciendo ahora mismo**;
  al medir, `eventos_economicos` **todavía no tenía** la columna `categoria_origen`. *O la
  migración no está aplicada, o la columna llega en otra: no se midió y no se afirma.*
- `MODELO_ECONOMICO` §3 confirma por su lado el hallazgo de ①: *«Historial automático ya
  existe»* — y **sigue sin aparecer la puerta de escritura atómica**; las funciones que A toca
  son lectores de resolución, no el acto de cerrar una vigencia y abrir la siguiente.

**Regla que deja esta enmienda, para quien construya sobre §6.1:** *se re-mide contra el motor
el día que se empiece, y se declara la hora.* Con cinco pistas escribiendo, **un censo de la
mañana no describe la tarde** — y el de §6.1 ya se venció una vez antes de que nadie lo usara.


---

## Historial

- **v1.1 (S115, 10-sep-2026):** §6 — dictado del founder del **tablero económico y fiscal**
  (cinco piezas), depositado verbatim, con el estado MEDIDO de cada una contra el motor vivo
  (§6.1). Tres hallazgos: el **corte por medio de pago no es derivable** (`eventos_economicos`
  sin `pago_intento_id`; `kushki_charge_id` en 0 de 61) · la **caja retenida no se registra**
  en ninguna tabla de pagos · la **alerta del certificado no tiene dato** en `fiscal_emisor`,
  aunque `MODELO_FISCAL` §7 ya la pedía. **Choque de alcance declarado y NO resuelto (§6.5):**
  ② y ③ no pasan la puerta de §2 — esperan firma del founder por (a) enmendar la puerta o
  (b) nominarlos como excepción.
  **§6.7 — enmienda del mismo día:** §6.1 se midió sin haber leído `MODELO_ECONOMICO` v1.1
  (firmado esa misma mañana). Corrige §6.3 (el número de la retención **ya está verificado**),
  refuerza §6.2 (**~4 % del ticket por punto de mezcla**; el break-even corre sobre una mezcla
  supuesta) y declara **dos migraciones de A en vuelo** que pueden mover §6.1 — sin afirmar
  nada sobre ellas. *Se declara en vez de reescribir en silencio.*

- **v1.0 (S114, 7-sep-2026):** alcance firmado por el founder sobre el relevamiento de F. Opción 1
  con web real. Puerta de §2 establecida como el único criterio de entrada. Frontera con el legado
  declarada; dos pantallas marcadas para retiro por mirar modelos muertos.
