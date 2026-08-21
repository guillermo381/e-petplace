# S102-B → PISTA A · PEDIDO AUTOCONTENIDO — CUATRO FICHAS SIN NÚMERO + UNA CORRECCIÓN

> **Este archivo SUPERSEDE a `2026-08-21-s102b-FICHAS-D858-D861.md`**, que
> reservaba `D-858` → `D-861`. **`D-858` ya era de A** (asignada horas antes en
> su worktree, todavía sin pushear — por eso el grep de B no la vio: **medí
> contra origin y A no había subido su rama; el número existía en un disco al
> que no llego**). *Se marca, no se borra: quien encuentre el archivo viejo
> tiene que poder ver que citaba números que en su momento midió libres.*

---

## ⓪ · LA REGLA QUE ESTE INCIDENTE DEJA ESCRITA (dictamen de mesa, relevo 2)

> ### **EL NÚMERO SE ASIGNA AL DEPOSITAR EN EL TERRITORIO CANÓNICO, JAMÁS AL REDACTAR.**

**Por qué la disciplina vieja no alcanzaba, medido acá:** el canon exige
verificar por grep que el número esté libre, **y yo lo hice** — `D-858` daba
**0 archivos** en `docs/`, `supabase/`, `scripts/`, `packages/`, `apps/`.
**El grep no estaba mal: estaba mirando el único lugar donde el dato no vivía.**
A tenía el número tomado en su worktree, sin commitear y sin pushear.

> ***Un número reservado desde afuera del territorio canónico se verifica contra
> un objeto que no es la fuente.*** *Con worktrees por pista, «libre en origin»
> y «libre» dejaron de ser lo mismo — y la ventana de divergencia es tan larga
> como el tiempo que una pista tarde en pushear.*

**⇒ La redacción de una ficha nombra el DEFECTO; el número se lo pone quien la
deposita.** *Es la misma forma que la casa ya usa para el ancla de un OTA: no se
escribe a mano, se lee del acto que la produce.*

---

## ① · CÓMO SE DEPOSITAN — instrucción operativa

1. **A toma el siguiente libre midiendo contra `docs/DEUDAS_CANONICAS.md` en SU
   árbol**, en el turno del depósito.
2. **Deposita los cuatro bloques VERBATIM**, en el orden de abajo, poniéndoles
   el número al pegarlos.
3. **Rellena los cruces** donde este texto dice `⟨ficha del ranking⟩` y
   `⟨ficha de las vistas⟩` con los números que acaben de asignarse.
4. **Aplica también la corrección de la §⑥** (D-748 dice `VIVE` y está pagada).

---

## ② · FICHA — `v_ranking_usuarios` PUBLICA NOMBRE Y AVATAR A CUALQUIER ANÓNIMO, Y PARA UN TERCIO DE LA BASE EL «NOMBRE» ES EL CORREO

🔴 **BLOQUEANTE PRE-LANZAMIENTO.**

**Medido, con rojo producido** (`SET LOCAL ROLE anon`, regla 68):

| medición | valor |
|---|---|
| `reloptions` | **`null`** — sin `security_invoker` ⇒ **bypassea la RLS de `profiles`** |
| `has_table_privilege('anon', …, 'SELECT')` | **true** |
| filas visibles como `anon` | **1**, con `nombre` poblado |
| columnas | `user_id, nombre, avatar_url, puntos_totales, puntos_mes, racha_dias, nivel, …` |

**Lo que lo vuelve grave no es el nombre: es de dónde sale.** Medido sobre los
165 perfiles con cuenta: **57 tienen `profiles.nombre` == el local-part de su
correo** (cola del sembrador `handle_new_user`, S81). ⇒ **publicar ese campo a
un anónimo no publica un apodo: publica una dirección de correo sin su dominio**
— y en esta base el dominio es adivinable.

**Y el daño escala con el éxito.** Hoy expone 1 fila porque `puntos_usuario`
casi no tiene filas: el motor de lealtad está **muerto** (`D-314`). **El día que
se encienda, la vista publica el nombre y el avatar de cada usuario con puntos,
a cualquiera con la anon key — que viaja en el bundle.**

> ***Un defecto cuyo alcance es proporcional al éxito del producto no se
> descubre creciendo: se descubre cuando ya creció.***

**Cura preparada y NO aplicada:**
`docs/relevamientos/2026-08-21-s102b-CURA-2-ranking-fuera-de-anon.sql`
(REVOKE de `anon` y de `PUBLIC`, con reversa escrita antes y cinturón de dos
brazos que verifica que `authenticated` y `service_role` NO se rompieron).

> **🔴 Y LA OPCIÓN QUE SE DESCARTÓ MIDIENDO, que es el aporte de la ficha:**
> `security_invoker = true` —el patrón que S54 aplicó a cuatro vistas del
> motor— **acá MATARÍA la vista.** `profiles_select` es `USING (auth.uid() = id)`
> ⇒ cada usuario vería **solo su propia fila**. *Un ranking que solo te muestra
> a vos no es un ranking.* **El patrón correcto para una clase de defecto puede
> ser la cura equivocada para un miembro de esa clase: una vista de ranking
> agrega datos ajenos POR DEFINICIÓN — su problema no es de RLS, es de QUÉ
> PUBLICA.**

> **Dueño:** pista A (es DB) · **la decisión de qué se publica de un tercero es
> del founder.**
> **⚠️ FRENO DE LA CURA (L-215):** el censo de consumidores dio **cero en este
> monorepo**; **los otros cinco repos NO se censaron**, y ese censo es parte de
> la cura. *Un REVOKE es barato de aplicar y caro de descubrir.*
> **☠️ DISPARO: antes del soft launch**, y en todo caso **antes de encender
> cualquier motor de puntos**.
> **☠️ MUERTE:** `anon` no puede leer la vista, **medido con `SET LOCAL ROLE
> anon`**, y ningún consumidor legítimo quedó roto.
> **Se cruza con `⟨ficha de las vistas⟩`** (misma clase, otras cinco) y con
> **`D-314`** (el motor que la va a poblar).
> Origen: S102-B, censo transversal.

---

## ③ · FICHA — EL DATO PERSONAL DEL PAGO NO SE BORRA NUNCA: NO HAY POLÍTICA DE RETENCIÓN, Y LA LETRA QUE FALTA YA TIENE TRES ACREEDORES

🔴 **ALTA.**

**Qué persiste, medido por NOMBRE DE CLAVE** (jamás por su valor):

| tabla | columna | filas | dato personal |
|---|---|---|---|
| `pagos_intentos` | `payload_crudo` | 41 | `card.holder_name` · `user.email` · `card.bin` · últimos 4 · mes/año |
| `pagos_eventos` | `payload` | 38 | idem |
| `webhook_events` | `payload` | 60 | `holder_name` · `email` · `bin` · últimos 4 |

**✅ Lo que NO hay, y es un resultado medido, no un supuesto:** **cero PAN** —
`card.number` mide **4 caracteres en las 94 filas**, solo dígitos, **cero con
forma de PAN (13-19)** — y **cero CVV/CVC** en ninguna clave de ninguna de las
tres. *La clave se llama `number` y eso es una trampa de lectura.*

**La retención, medida:**

```
jobs de cron totales                                     14
… que purgan payloads de pago                             0
funciones con DELETE FROM webhook_events / pagos_eventos  0
```

> **No es una retención larga: es la AUSENCIA de política.** *Una retención
> larga se defiende con un argumento; una ausencia solo se explica.*

**Y lo que esta ficha aporta no es su contenido: `D-732` y `D-733` están 🔒
BLOQUEADAS desde S92-BIS por exactamente la misma letra que falta — el plazo de
retención.** *La casa ya midió entonces que «la ventana de gracia del barredor
no es un número técnico que se elige, es el plazo de retención con otro
nombre».*

**⇒ Ahora la misma letra bloquea material de CERTIFICACIÓN DE PAGOS**, que es
de otra clase: tiene contraparte externa (Nuvei) y reglas propias.

> ***Una deuda de letra que acumula acreedores deja de ser una deuda de letra y
> pasa a ser un cuello de botella.***

> **Dueño: founder + legales** — *ninguna pista puede elegir un plazo de
> retención.* **Insumo servido:**
> `docs/relevamientos/2026-08-21-s102b-CAPITULO-RETENCION-v3.md`.
> **☠️ DISPARO: la primera transacción con la tarjeta de una persona real** —
> hoy el ambiente es sandbox de punta a punta y eso es lo único que lo contiene.
> **☠️ MUERTE:** hay plazo escrito, y hay barrido que lo ejecuta, **verificado
> por una corrida real que borre algo**.
> **Se cruza con `D-732` · `D-733` · `D-405`** y con **`P23`** de `POLITICAS`.
> Origen: S102-B, censo transversal.

---

## ④ · FICHA — EL COMPROBANTE DE UNA CITA VA AL DUEÑO DE LA MASCOTA, NO A QUIEN PAGÓ

🟡 **ALTA — con dictamen de mesa YA DADO y cura EN COLA.**

**Literal de `aplicar_evento_de_pago`, leído con `pg_get_functiondef`:**

```sql
-- rama CITA (líneas 77-78):
SELECT m.user_id INTO v_user FROM evento_cita_servicio c
  JOIN mascotas m ON m.id = c.mascota_id WHERE c.id = v_ref;

-- rama COMPRA (línea 122):
SELECT c.user_id, c.moneda INTO v_user, v_moneda FROM compras c WHERE c.id = v_ref;
```

⇒ **Despensa manda el comprobante a quien compró. Servicios lo manda al dueño
registrado de la mascota. Las dos ramas del mismo motor eligen distinto y
ninguna lo declara.**

### ✅ DICTAMEN DE MESA, 21-ago-2026 — YA RESUELTO

> **EL COMPROBANTE VA A QUIEN PAGÓ.** Base: `LETRA_SALDO` §2 (RIGE, firma del
> founder 19-ago) — *«Del usuario que pagó. La plata vuelve a quien la puso, no
> al hogar ni a la familia.»* **El pago tiene dueño y el comprobante es del
> pago.**
>
> **Y su mitad complementaria: el aviso al dueño de la mascota es una
> NOTIFICACIÓN APARTE, jamás el comprobante.** *Son dos hechos distintos —«te
> cobraron» y «tu mascota tiene una cita paga»— y mezclarlos en un solo correo
> obliga a mandárselo a las dos personas o a ninguna.*

### ⚖️ HOY NO DIVERGE, y se midió

| medición | valor |
|---|---|
| familias con más de un miembro | **0** de 82 |
| citas cuya mascota tiene `user_id` NULL | **0** de 194 |

⇒ **con los datos de hoy, pagador y dueño son la misma persona.** *La cura es
estructural, no urgente — pero su ventana se cierra con la primera familia de
dos adultos.*

### 🔴 EL SEGUNDO FILO DE LAS MISMAS DOS LÍNEAS, y ése es de motor

**`notificacion_intencion.destinatario_user_id` es `NOT NULL`.**
**`mascotas.user_id` es NULL en 51 de 75 mascotas (68 %).**
**`aplicar_evento_de_pago` NO tiene manejador de excepción** — *verificado
leyendo las líneas: su único `EXCEPTION` es un `RAISE EXCEPTION`.*

⇒ Una cita pagada de una mascota sin `user_id` haría **fallar el INSERT de la
intención, y con él la aplicación entera del pago**: la cita no pasaría a
`pagada`, el intento no se cerraría, y el proveedor reintentaría contra el mismo
error. **Hoy no ocurre porque las 194 citas tienen dueño — pero no hay candado.**

> ***Lo que hoy lo evita son los datos, no el diseño.***

> **⚠️ NOTA DE MÉTODO, declarada:** la primera medición de «¿tiene handler?» usó
> `~* 'EXCEPTION'` y **dio true** — era el `RAISE`. *El instrumento midió la
> palabra; el reporte iba a hablar de la estructura.* **El verde falso habría
> invertido esta conclusión.**

> **Dueño:** el destinatario es **producto → founder (YA DICTAMINADO)**; el
> candado del NULL y la columna de pagador son **motor → pista A**.
> **🔗 DEPENDENCIA MEDIDA:** esta cura y el ensanche de RLS de `pagos_intentos`
> **necesitan la misma pieza que falta — `pagos_intentos` no registra quién
> pagó**. *Son la misma cura y conviene construirlas juntas* (detalle y las dos
> variantes en `…-s102b-CURA-3-rls-pagos-intentos-cita.sql` §⓪).
> **☠️ DISPARO: la primera familia con dos miembros, o el primer cobro de
> mostrador de una cita.**
> **☠️ MUERTE:** el comprobante llega a quien pagó, el aviso al dueño de la
> mascota existe como notificación propia, y una cita de mascota sin `user_id`
> es inexpresable o está manejada.
> Origen: S102-B, censo transversal · dictamen de mesa 21-ago.

---

## ⑤ · FICHA — SEIS VISTAS DE MÉTRICAS DE NEGOCIO SON LEGIBLES POR CUALQUIER ANÓNIMO

🟡 **ALTA.**

> **⚠️ ALCANCE declarado: esto NO es dato personal** —salvo `v_ranking_usuarios`,
> que tiene ficha propia—. **Es confidencial de NEGOCIO.** *Salió de la misma
> medición y comparte causa y cura; si la mesa lo considera fuera de alcance, se
> archiva sin costo.*

**Medido con rojo producido (`SET LOCAL ROLE anon`):**

| vista | `security_invoker` | filas que ve `anon` | qué publica |
|---|---|---|---|
| `v_pitch_metrics` | **null** | **1** | GMV mes/histórico, revenue, MAU, ticket, DAU/MAU, sellers y prestadores activos — **los 12 KPI del pitch deck** |
| `v_metricas_tiempo_real` | **null** | **1** | GMV y revenue del mes y del día, MAU, mascotas, citas |
| `v_mrr` | **null** | **1** | MRR mensual, anual prorrateado, altas y bajas |
| `v_crecimiento_usuarios` | **null** | **5** | usuarios nuevos y acumulados por mes |
| `v_gmv_mensual` | **null** | 0 *(sin datos, **no** por permiso)* | GMV y revenue por mes y país |
| `v_ranking_usuarios` | **null** | 1 | → `⟨ficha del ranking⟩` |

**Las seis tienen `reloptions = null`** ⇒ corren como su dueño y bypassean la
RLS de abajo. *Las otras seis vistas alcanzables por `anon` —`v_conversion_funnel`,
`v_criaderos_publicos`, `v_daas_eligible_users`, `v_dashboard_logistico`,
`v_resenas_todas`, `v_vitrina_publicada`— **sí** tienen `security_invoker = true`*
⇒ **la casa ya sabe hacerlo y estas seis quedaron afuera del barrido de S54.**

**✅ Un matiz que evita inflar la ficha:** la ACL da `arwdDxtm` a `anon`
(escritura incluida), **pero las seis son NO ACTUALIZABLES**
(`is_insertable_into = NO`, `is_updatable = NO`) ⇒ **los grants de escritura son
INERTES. La exposición es de LECTURA, y es real.**

**Y el cruce que la vuelve concreta:** dos de ellas llevan el `0.14` **embebido
en el SQL** (`v_gmv_mensual`: `(sum(total) * 0.14) AS revenue` ·
`v_metricas_tiempo_real`: `(gmv_mes_actual * 0.14) AS revenue_mes`) ⇒ **lo que
un anónimo puede leer no es solo confidencial: además está mal por un orden de
magnitud** (`D-759`). **Curar solo el front del admin deja el `0.14` vivo en la
fuente: las dos curas van juntas o el número sobrevive.**

> **Dueño:** pista A (es DB).
> **☠️ DISPARO: antes del soft launch**, y **antes de mostrar `/inversores` a
> alguien de afuera** — el mismo disparo de `D-759`.
> **☠️ MUERTE:** `anon` no lee ninguna de las seis, **medido**, y el tablero de
> inversores sigue vivo con su credencial propia.
> **Se cruza con `D-758` · `D-759` · `D-760`** (⚠️ `v_pitch_metrics` sostiene el
> pitch deck: **cualquier cura acá tiene que no romperlo**).
> Origen: S102-B, censo transversal.

---

## ⑥ · CORRECCIÓN DE FICHA EXISTENTE — **D-748 ESTÁ PAGADA Y SIGUE DICIENDO `VIVE`**

> ### ⚠️ CORRECCIÓN DE MI PROPIA VERSIÓN ANTERIOR, y también amplía la lista de la mesa
>
> **La versión previa de este pedido decía «`docs/DEUDAS_CANONICAS.md` línea
> 1604». Es FALSO: esa línea vive en `docs/MODELO_DESPENSA.md`.** *Arrastré el
> número de línea de un grep que había corrido sobre OTRO archivo. Es el mismo
> error de forma que la casa ya tiene medido: un dato correcto citado contra la
> fuente equivocada.*
>
> **Y la mesa nombró `:13972` y `:14274` — son las dos de `DEUDAS_CANONICAS`.
> Falta la tercera, que es justamente la que dice la palabra `VIVE`.**
>
> **Medido por grep sobre `docs/` completo: son TRES ocurrencias en DOS archivos.**

| # | archivo · línea | literal actual |
|---|---|---|
| 1 | **`docs/MODELO_DESPENSA.md:1604`** | `\| **D-748** \| El 20% vivo en \`seller_comisiones\` contra el 10% firmado \| **VIVE.** Es plata viva y es tabla NUESTRA: la decisión de S95 no la toca \|` |
| 2 | `docs/DEUDAS_CANONICAS.md:13972` | `#### D-748 — 🔴 \`take_rate_pct = 20.00\` VIVO EN LA BASE contra el 10% firmado: es PLATA, no letra vieja` |
| 3 | `docs/DEUDAS_CANONICAS.md:14274` | `> **D-748** (el \`take_rate_pct = 20\` vivo).` |

> **🔴 Y UN DATO QUE AGRAVA LA DEUDA DE CANON, medido en el mismo barrido:**
> `docs/relevamientos/2026-08-19-s101-censo-pagos.md:53` **YA LO DECÍA**, hace
> dos días: *«`seller_comisiones` YA NO EXISTE. Fue jubilada. La tabla que
> sostenía el `take_rate_pct = 20.00` de D-748 no está en la base.»*
>
> ⇒ **El hallazgo no es nuevo: es que nadie cerró la ficha.** *Un relevamiento
> que mide bien y no transpone deja el canon diciendo lo contrario de lo que la
> casa ya sabe — y el canon es lo que la próxima sesión lee.*

**Lo medido el 21-ago-2026:**

```
to_regclass('public.seller_comisiones')  →  NULL

supabase/migrations/20260811120000_s95_m1_limpieza_comercio.sql:129
DROP TABLE public.seller_comisiones;          -- D-748: el 20 % vivo
```

⇒ **La tabla no existe. La deuda está PAGADA por eliminación del objeto**, y la
migración que la pagó **la nombra por número en su propio comentario.**

**Texto de reemplazo propuesto:**

```
| **D-748** | El 20% vivo en `seller_comisiones` contra el 10% firmado | ☠️ **PAGADA por eliminación del objeto** — `DROP TABLE public.seller_comisiones` en `20260811120000_s95_m1_limpieza_comercio.sql:129`, que la nombra por número. Medido S102-B: `to_regclass` → NULL. **⚠️ Su muerte creó un defecto NUEVO: `e-petplace-admin` sigue consultando y ESCRIBIENDO esa tabla, así que sus tres `?? 14` dejaron de ser fallback y son constantes permanentes — ver D-759.** |
```

> **Por qué la corrección importa más que la prolijidad:** la ficha de D-748
> **manda a buscar plata en una tabla que no existe**, y su nota —*«la decisión
> de S95 no la toca»*— **es falsa desde el 11-ago**: la decisión de S95 fue
> exactamente lo que la borró. *Una ficha que describe un mundo anterior no es
> una ficha vieja: es una instrucción equivocada con formato de dato.*

---

## ⑥bis · LECCIÓN NUEVA A DEPOSITAR — **`L-327`** *(orden de mesa, relevo 3 punto 5)*

> **Número medido por grep el 21-ago:** techo del canon **`L-326`**; `L-327` y
> `L-328` dan **0 archivos** en `docs/`, `scripts/`, `packages/`, `apps/`,
> `supabase/`.
> **⚠️ Con la misma advertencia que la regla de §⓪ acaba de dejar escrita: ese
> grep mide MI árbol y origin, no los worktrees ajenos. A confirma al depositar.**

---

### L-327 — EL PATRÓN CORRECTO PARA UNA CLASE PUEDE SER LA CURA EQUIVOCADA PARA UN MIEMBRO DE ESA CLASE

**La clase:** vistas de `public` con grant a `anon` y sin `security_invoker` —
corren como su dueño y **bypassean la RLS de las tablas de abajo**. La casa ya
la conoce: **S54 curó cuatro vistas del motor exactamente así**, y la cura fue
correcta.

**El miembro que la rompe, medido en S102-B:** `v_ranking_usuarios` está en esa
clase —`reloptions` NULL, `anon` con SELECT, 1 fila visible como anónimo— **y
`security_invoker = true` la MATARÍA**:

```
profiles_select  →  USING (auth.uid() = id)          ← SOLO UNO MISMO
pu_own           →  USING (user_id = auth.uid() OR is_admin())
```

⇒ cada usuario vería **solo su propia fila**. *Un ranking que solo te muestra a
vos no es un ranking: es un espejo.* La vista quedaría **técnicamente segura y
funcionalmente muerta**, y el verde del guard no lo diría.

> ### **La diferencia no está en el permiso: está en el PROPÓSITO.**
> **`security_invoker` cura vistas que NO deberían agregar datos ajenos. Una
> vista de ranking los agrega POR DEFINICIÓN.** *Su problema nunca fue de RLS —
> es de QUÉ PUBLICA.*

**Lo exigible, en una línea:** antes de aplicarle a un miembro el patrón de su
clase, **se mide qué hace el patrón CON ESE MIEMBRO** — no qué hizo con los
anteriores.

**Su parienta, y por qué esto no es un caso aislado:** es la misma forma que
**L-283** (*«un plano y un arco no producen un cambio de signo: producen un
codo»* — la anatomía incapaz del efecto que se le pedía). **Allá la forma no
admitía el efecto; acá el efecto no admite la forma.** *Las dos se descubren
igual: preguntando si la pieza puede hacer lo que se le pide, en vez de
insistir con el método que funcionó al lado.*

**Y el costo que habría tenido no medirla:** la cura se veía obvia, tenía
precedente en la casa, y su cinturón natural —«`anon` ya no lee»— **habría dado
VERDE**. *El defecto solo aparece mirando lo que la vista deja de servirle a
quien sí debe verla.*

> Origen: S102-B, curas de seguridad del relevo 2 (21-ago-2026).

---

## ⑦ · LO QUE B **NO** HIZO, y por qué

- **No depositó nada en `docs/DEUDAS_CANONICAS.md`.** Es territorio de A y A
  tiene worktree abierto sobre el mismo ancla — **es el archivo compartido que
  la regla 76(c) existe para evitar**, y encima el más largo y más citado del
  canon.
- **No renumeró nada por su cuenta.** *Depositar verbatim con números que ya
  significan otra cosa es exactamente el lío de `D-757`.*
- **No aplicó ninguna cura.** Las tres migraciones están escritas, con reversa
  antes y cinturón con discriminador, **y esperan firma para aplicar**.
