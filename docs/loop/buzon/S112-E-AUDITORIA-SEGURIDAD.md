# S112-E · AUDITORÍA DE SEGURIDAD DEL VERTICAL DE ADOPCIÓN (§5)

> **Instrumento independiente.** Una fila por requisito de §5, con **la sonda
> exacta**, **el rojo esperado**, **lo que dio**, **contra qué** y **cuándo**.
>
> **CONTRA QUÉ:** la **base viva** (`zyltipqscdsdsxnjclhp`) y el repo en
> `origin/main f704daa2`. **CUÁNDO:** **1-sep-2026, 23:20–23:55**.
>
> 🔴 **ESTE DOCUMENTO SE VENCE.** A está construyendo mientras yo mido: entre mi
> censo de anoche y esta pasada cambiaron **cuatro** cosas que yo había reportado
> (abajo, §0). **Se re-corre entero antes del lote** — es la pasada 1 de 2.
>
> **Cómo leer los verdictos:** ✅ verde medido · 🔴 rojo abierto · ⚠️ **no
> concluyente** (la sonda no pudo producir su rojo, casi siempre por falta de
> datos) · ⛔ **la pieza no existe todavía** (no es un hallazgo: es cobertura
> pendiente).

---

## §0 · LO QUE SE VENCIÓ DE MI PROPIO CENSO DE ANOCHE

*Se declara primero porque un buzón vencido se lee con la misma confianza que
uno vigente, y estas cuatro correcciones son mías.*

| lo que dije anoche | hoy, medido | evidencia |
|---|---|---|
| «`consentimientos.tipo` es un CHECK cerrado de **7** sin ningún valor de adopción ⇒ la aceptación es **inexpresable**» | **PAGADO** — el CHECK tiene **9** e incluye `terminos_refugio` y `condiciones_adopcion` | `chk_consentimiento_tipo` |
| «cero cuentas con `tipo_actor='refugio'`» | **PAGADO** — existe **`Refugio de prueba Satori`** (`80c41ac7`), cuenta **activa**, rol **activo**, titular `guillo381+refugio@gmail.com` | `cuenta_roles` |
| «`publicar_adoptable` toma 2 parámetros» | **VENCIDO** — toma **4** (`p_mascota_id, p_cuenta_comercial_id, p_ingresado_en, p_ficha jsonb`) con 14 campos de ficha | `pg_get_functiondef` |
| «no existe `otorgar_rol_refugio`» | **VENCIDO** — existe, con `is_admin()` en la primera línea | idem |

**Lo que NO se venció y sirve de ancla:** el acta `acta_adopcion v1` sigue con
**`sha256 = f788d883…`** ⇒ **mi censo de las 22 variables del acta sigue
describiendo el documento vigente.**

---

## §1 · LA TABLA — un requisito por fila

### §5.1 · RLS es la puerta · todo DEFINER con `search_path` y guard de rol

**Sonda A (estructura):** `pg_proc.proconfig` + `has_function_privilege('anon', …)`
sobre las 14 funciones del vertical.
**Sonda B (camino real):** la **clave anon** por PostgREST llama 7 DEFINERs.
**Rojo esperado:** `42501` en todas menos la vidriera.

| resultado | evidencia |
|---|---|
| ✅ **14 de 14 con `search_path=public, pg_temp`** | ninguna quedó mutable |
| ✅ **`anon` sólo alcanza `obtener_adoptables`** | las otras 13 en `false` |
| ✅ **7 de 7 DEFINERs rebotaron a `anon`** con `42501 :: permission denied for function` | `publicar_adoptable` · `otorgar_rol_refugio` · `crear_solicitud_adopcion` · `traspasar_mascota_a_familia` · `obtener_mis_solicitudes_adopcion` · `aceptar_documento_adopcion` · `barrer_adopcion_diario` |
| ✅ **CONTROL POSITIVO** — el mismo cliente anon leyó `cat_especies` (2 filas, 9 claves) ⇒ **la clave funciona y el rojo es del permiso, no de la sonda** | — |
| ✅ **guard de rol en la primera línea, leído:** `otorgar_rol_refugio` → `is_admin()` · `publicar_adoptable` → `_user_gestiona_cuenta_refugio` **y** `estado='activa'` · `crear_solicitud_adopcion` → `auth_required` + `tengo_aceptado_documento` | — |

**Veredicto §5.1: ✅ VERDE.**

---

### §5.2 · La vidriera anónima expone SÓLO lo que la letra permite

**Sonda:** ① leer la proyección de `obtener_adoptables` en su `RETURNS TABLE`
② llamarla como `anon` y listar las claves devueltas.
**Rojo esperado:** que aparezca teléfono, correo, dirección, RUC o cédula.

| resultado | evidencia |
|---|---|
| ✅ **la proyección es de 10 columnas y ninguna es prohibida** | `publicacion_id, mascota_id, nombre, especie, raza, sexo, fecha_nacimiento, foto_url, publicador_nombre, creada_en` |
| ✅ del refugio viaja **sólo `cuentas_comerciales.nombre_comercial`** | el `SELECT` no toca teléfono, correo, dirección ni identificación |
| ⚠️ **NO CONCLUYENTE por el camino real: la llamada devolvió 0 filas** porque hay **0 publicaciones en estado `publicada`**. *Un cero no prueba una proyección: la prueba la da la firma, y la confirmación por camino real espera a la siembra.* | — |
| 🟠 **nota de letra, no de seguridad:** la proyección devuelve **`raza`**, y §4.1 dice *«sin raza»*. **No lo curo: lo nombro.** | — |

**Veredicto §5.2: ✅ por la firma · ⚠️ pendiente de confirmación con datos.**

---

### §5.3 · Los datos del solicitante los ve sólo el publicador

**Sonda:** `anon` hace `select *` sobre las cinco tablas del vertical.
**Rojo esperado:** cualquier fila devuelta.

| resultado | evidencia |
|---|---|
| ✅ **0 filas para `anon` en las cinco**: `adopcion_publicacion`, `adopcion_solicitud`, `adopcion_mensaje`, `adopcion_documentos`, `adopcion_seguimiento` | — |
| ✅ **0 filas también en `mascotas`, `profiles`, `cuentas_comerciales`** | — |
| ⚠️ **el brazo «tercer usuario» y «otro refugio» NO se pudo correr: hay 0 solicitudes y 0 mensajes.** *D ya lo probó en rojo para el hilo; yo no lo repito de memoria — lo corro cuando exista una solicitud.* | — |

**Veredicto §5.3: ✅ para `anon` · ⚠️ los otros dos brazos, pendientes de datos.**

---

### §5.4 · D-485 curado antes del primer traspaso · censo de lo colgado de la mascota

**🔴 ESTE ES EL HALLAZGO QUE BLOQUEA EL PASO 15 DE §0.**

**Sonda (la decisiva):** dentro de una transacción, **simulé exactamente lo que
hace `traspasar_mascota_a_familia`** (mover `familia_id` a la familia del usuario
de sonda) y **leí desde el asiento de esa familia** con su JWT.
**Rojo esperado:** que la familia adoptante NO vea a su propia mascota.

```
familia del usuario de sonda      ce057f90-82d8-40f8-a816-796c0f2b5b2a
mascota traspasada (simulado)     Test-RLS-Firulais · 6d96b48d-…
tras el traspaso · mascota_codueño         1 fila   (del dueño ANTERIOR)
tras el traspaso · user_id quedó           con dueño (el REFUGIO)
🔴 ¿la familia adoptante VE a la mascota?  NO — 0 filas
   ¿ve el expediente (eventos)?            0 eventos
✅ CONTROL POSITIVO · total que sí ve      11 mascotas
```

**Lo que esto dice, y es más grave que «no la ve»:** el traspaso mueve
`familia_id`, pero **las tres policies `SELECT` de `mascotas` no leen `familia_id`
en absoluto** — gatean por `is_admin()`, `_user_es_codueño_mascota` y
`user_tiene_acceso_a_mascota`. Y **`user_id` queda apuntando al refugio** ⇒ *no
es sólo que la familia no la vea: es que el refugio la sigue viendo como dueño.*

**La asimetría que lo vuelve inequívoco:** el **UPDATE** de `mascotas` sí usa
`user_es_familiar_adulto_de_mascota`, que **sí lee `familia_miembro` y
`familia_id`**. ⇒ **la familia puede ESCRIBIR la mascota que no puede LEER.**

**Magnitud, medida:** de **83** mascotas, **83** tienen familia y **51 no tienen
`user_id`** ⇒ hoy ya hay 51 invisibles para todos salvo admin y codueño.

**El censo que §5.4 pide — 81 tablas cuelgan de `mascota_id`, y la cura tiene
cuello de botella, no 81 puertas:**

| cómo gatean | cuántas | leen familia |
|---|---|---|
| `user_tiene_acceso_a_mascota(mascota_id)` | ~30 | **NO** |
| `user_acceso_clinico_a_mascota(mascota_id)` | ~15 | **NO** |
| `_user_es_codueño_mascota` / `_user_es_familiar_autorizado_mascota` | ~8 | **NO** |
| `user_id = auth.uid()` sobre su propia fila | ~20 | (otra pregunta) |
| **sin policy SELECT** | 3 (`acuario_composicion`, `documento_token`, `nota_clinica_borrador`) | — |

**Medido helper por helper** (`pg_get_functiondef … ilike`, con `length` al lado
para probar que el cuerpo vino entero):

| helper | lee `familia_miembro` | lee `familia_id` |
|---|---|---|
| `user_tiene_acceso_a_mascota` (267 ch) | false | false |
| `user_acceso_clinico_a_mascota` (2225 ch) | false | false |
| `_user_es_codueño_mascota` (353 ch) | false | false |
| `_user_es_familiar_autorizado_mascota` (375 ch) | false | false |
| `user_tiene_acceso_a_mascota_como` (2179 ch) | false | false |
| **`user_es_familiar_adulto_de_mascota` (714 ch)** | **true** | **true** |

⇒ **la superficie de la cura son 4 helpers + las 3 policies de `mascotas`**, y
~45 de las 81 tablas siguen solas. **No propongo la cura: nombro la puerta.**

**Veredicto §5.4: 🔴 ROJO ABIERTO — bloquea E3 y el paso 15 de §0.**

---

### §5.5 · Firma: OTP, inmutabilidad, evidencia

⛔ **LA PIEZA NO EXISTE.** Medido: no hay `adopcion_firma`, no hay
`adopcion_acta`, **no hay ninguna tabla con «firma» en el nombre**, y no existen
`solicitar_codigo_firma`, `firmar_acta_adopcion` ni `obtener_acta_adopcion`.

**Los seis rojos de §5.5 están escritos y esperando su motor:** código vencido ·
reintento con el mismo código · sexto intento · firmar sin cédula · firmar un
acta jubilada · firmar por otro usuario. *El guion completo, con sus fixtures,
ya vive en `S112-E-para-A-TRASPASO-ESTADO.md` §③ — no se re-inventa.*

**Nota que sí puedo dar hoy:** **el rojo del acta jubilada YA es producible** —
`traspasar_mascota_a_familia` exige `vigente` (séptimo de sus siete guards), y
`adopcion_documentos.vigente` se puede apagar (probado: el UPDATE de `vigente`
pasa mientras el de `contenido` rebota). **Producir ese rojo exige jubilar
`acta_adopcion`, que es una escritura de A, no mía.**

---

### §5.6 · Aceptaciones y textos legales inmutables

**🔴 ADVERTENCIA DE MÉTODO, y casi reporto tres agujeros falsos.** La primera
pasada la corrí desde el asiento del **CLI (superusuario)** y dio **tres rojos**:
`DELETE` de `adopcion_documentos` pasó, `UPDATE` de `consentimientos.aceptado`
pasó, `DELETE` de `consentimientos` pasó. **Los tres eran del instrumento: RLS no
se aplica al superusuario.** Re-corrida desde el asiento `authenticated` con JWT
real:

| # | sonda (asiento `authenticated`, JWT `dd024680…`) | dio |
|---|---|---|
| 0 | **CONTROL POSITIVO** · `select consentimientos` | ✅ **27 filas, no 97** ⇒ el asiento es real y RLS aplica |
| 1 | `UPDATE consentimientos SET aceptado=false` (los propios) | ✅ rebotó · `permission denied for table consentimientos` |
| 2 | `DELETE FROM consentimientos` (los propios) | ✅ rebotó · `permission denied for table` |
| 3 | `UPDATE adopcion_documentos SET contenido=…` | ✅ **0 filas** — RLS lo negó |
| 4 | `DELETE FROM adopcion_documentos` | ✅ **0 filas** — RLS lo negó |
| 5 | `INSERT` de un texto legal nuevo (v99) | ✅ rebotó · `new row violates row-level security policy` |
| 6 | `INSERT` de un consentimiento **por otro usuario** | ✅ rebotó · `violates row-level security policy` |

**Y desde el asiento del superusuario, lo que SÍ es prueba** (un trigger dispara
para todos): `UPDATE adopcion_documentos.contenido` → **`texto_legal_inmutable:
terminos_refugio v2 — se carga una version nueva, no se edita`**. Y `UPDATE` de
`vigente` **pasa**, que es lo correcto: **A jubila versiones**.

**Veredicto §5.6: ✅ VERDE.** Con dos notas para el acta, no para curar:
- **`consentimientos` cierra por GRANT** (`permission denied`) y
  **`adopcion_documentos` cierra por RLS silenciosa** (`0 filas`). *El cero
  silencioso es evidencia más débil: se lee igual que «no había filas que
  coincidieran». Quien re-corra esto necesita el control positivo al lado.*
- **La inmutabilidad del texto es contra `UPDATE`, no contra `DELETE`.** Hoy no
  importa —RLS no deja borrar a nadie salvo un `DEFINER`—, pero **un
  consentimiento guarda `documento_sha256` y `version`**: si alguna vez un
  DEFINER borra la fila, *la evidencia queda apuntando a un texto que ya no
  existe.* **Lo nombro; no lo curo.**

---

### §5.7 · El rol lo otorga sólo el administrador · publicar exige rol Y cuenta activa

**Sonda:** lectura de los dos cuerpos + la llamada `anon`.
**Rojo esperado:** que un no-admin otorgue el rol, o que una cuenta
`pendiente_validacion` publique.

| resultado | evidencia |
|---|---|
| ✅ `otorgar_rol_refugio` → **`IF NOT is_admin() THEN RAISE 'solo_admin_otorga_rol_refugio' (42501)`** | leído |
| ✅ además **rebota cuentas `suspendida`/`cerrada`** con `cuenta_no_activable`, y explica por qué | leído |
| ✅ `publicar_adoptable` → `_user_gestiona_cuenta_refugio` **y después** `IF v_estado_cuenta <> 'activa' THEN RAISE 'cuenta_no_activa'` | leído |
| ⚠️ **el rojo `pendiente_validacion publica` NO se pudo producir**, y la razón es de diseño: **`otorgar_rol_refugio` ACTIVA la cuenta al otorgar el rol** ⇒ el estado «rol activo + cuenta pendiente» **no es alcanzable por esa puerta**. *El camino que sí lo alcanza es: otorgar (activa) → suspender después.* Lo corro con la cuenta de prueba cuando A me diga que puedo tocarla. | — |
| 🔴 **N4 NO ESTÁ CUMPLIDA.** La decisión dice que `otorgar_rol_refugio` escribe `verificado_por`, `verificado_en`, **`tipo` (organización / rescatista)** y `criterio`. Lo que escribe es `metadata: {otorgado_por, motivo}`. **`tipo` no está en ninguna parte**, y `verificado_en` se está infiriendo de `activado_en`, que es otro hecho. *El abogado pidió que la verificación tenga criterio documentado; hoy tiene un texto libre sin tipo.* | `pg_get_functiondef` |

**Veredicto §5.7: ✅ los dos guards · 🔴 N4 incompleta · ⚠️ un rojo pendiente.**

---

### §5.8 · Anti-abuso N1 · el 90 días

**Sonda:** cuerpo de `crear_solicitud_adopcion` + índices de `adopcion_solicitud`
+ prueba de cable del barrido.

| resultado | evidencia |
|---|---|
| ✅ **«una activa por animal» existe en DOS capas**, que es la forma correcta: el índice `uq_solicitud_viva (publicacion_id, solicitante_user_id) WHERE estado IN ('recibida','en_conversacion')` **y** un guard tipado que **explica y lleva el id** (`solicitud_ya_viva: <uuid>`) | `L-424` aplicada |
| 🔴 **«hasta 3 activas en total» NO EXISTE.** No hay ningún conteo en el cuerpo ⇒ **una familia puede tener solicitudes activas sin techo** mientras sean de animales distintos | leído |
| ✅ **la compuerta del consentimiento es del servidor:** `IF NOT tengo_aceptado_documento('condiciones_adopcion') THEN RAISE 'condiciones_no_aceptadas'` | leído |
| ✅ **PRUEBA DE CABLE del barrido**: `barrer_adopcion_diario()` **corre y devuelve estructura** → `{"ok":true,"purga":{"anonimizadas":0,"mensajes_anonimizados":0},"reloj":{"avisadas":0,…}}`. **CONTROL NEGATIVO** al lado: una función inexistente lanza ⇒ el instrumento discrimina | in-txn, ROLLBACK |
| 🔴 **el cron está tendido y NUNCA CORRIÓ**: job **48** `barrer-adopcion-diario`, `0 14 * * *` (09:00 Guayaquil), `active=true`, **0 filas en `cron.job_run_details`**. *Que la función corra no prueba que el reloj la llame: son dos hechos.* | — |

**Veredicto §5.8: ✅ media N1 y el cable · 🔴 la otra media N1 y el reloj sin una sola corrida.**

---

### §5.9 · Menores: el esquema no admite nombres ni edades exactas

⛔ **LA PIEZA NO EXISTE.** `adopcion_solicitud` **no tiene ninguna columna de
respuestas** y `crear_solicitud_adopcion` **sigue tomando 2 parámetros**
(`p_publicacion_id, p_mensaje_inicial`) — sin `respuestas` ni `aceptacion_id`.

**El rojo está escrito y espera su CHECK:** enviar `{"nombre_menor": …}` y que
rebote. *Hoy no hay dónde enviarlo.* **Y el dato que sirve al abogado ya está
medido y no cambió: hoy no existe, en ninguna tabla del ecosistema, un campo que
pida el nombre o la edad exacta de un menor.**

---

### §5.10 · Storage

**Sonda:** `storage.buckets` + las policies de `storage.objects` que nombran
adopción, leídas **completas** (`L-437`: un censo por patrón acota, no cierra).

| resultado | evidencia |
|---|---|
| ✅ `adopcion-fotos` es **público**, 5 MB, sólo `image/png,jpeg,webp` | — |
| 🔴 **pero sus policies de INSERT y DELETE son `is_admin()`** ⇒ **un refugio NO puede subir una foto a ese bucket.** El paso 4 de §0 («sube fotos») no tiene camino por ahí | — |
| ✅ **las fotos de la vidriera salen del bucket PRIVADO `mascotas`**, por una policy `anon` nueva — **y es correctamente angosta**: `bucket_id='mascotas' AND EXISTS (… JOIN adopcion_publicacion p ON p.estado='publicada' … JOIN cat_estados_adopcion e ON e.visible_en_vidriera … WHERE m.foto_url = objects.name)`, rol `{anon}` | leída completa |
| ⇒ **el riesgo que fui a buscar NO está**: un anónimo alcanza **exactamente el objeto que es la portada de un adoptable publicado**, y nada más del bucket | — |
| 🟠 **pero es UNA sola foto por animal** (`m.foto_url`, singular). §4.1 pide *«fotos grandes, deslizables»*: **la galería del adoptable no tiene motor ni storage alcanzable hoy** | — |
| ⚠️ el rojo discriminante («anon lee un objeto de `mascotas` que NO es adoptable publicado») **no discrimina todavía**: con 0 publicaciones el `EXISTS` es siempre falso, así que anon no alcanza nada y el cero no prueba la cláusula. **Se re-corre con la siembra** | — |
| ⛔ el rojo «subir un archivo desde el hilo» **no aplica**: el hilo no tiene adjuntos por decisión (ítem 14) | — |

**Veredicto §5.10: ✅ la vidriera no filtra · 🔴 el refugio no puede subir a `adopcion-fotos` · 🟠 la galería no existe.**

---

### §5.11 · Reportar publicación no revela al reportante

⛔ **LA PIEZA NO EXISTE.** `adopcion_reporte` no existe y `reportar_publicacion`
tampoco. **El rojo («el refugio lista sus reportes → no puede») espera su tabla.**

---

### §5.12 · No se inventa evidencia

| resultado | evidencia |
|---|---|
| ✅ **`aceptar_documento_adopcion` es el caso ejemplar**: toma la IP del **header del servidor**, la guarda **hasheada**, y si el header no llega **deja `NULL` y lo DICE** (`ip_capturada: false` viaja en la respuesta). Guarda además `documento_sha256` y `version` | leído |
| ✅ es **idempotente y lo dice** (`ya_estaba: true`) ⇒ no fabrica una segunda aceptación | — |
| ✅ el vocabulario está **cerrado a dos códigos** y exige `vigente` | — |

**Veredicto §5.12: ✅ VERDE.**

---

## §2 · RESUMEN — qué bloquea el lote

| # | requisito | veredicto |
|---|---|---|
| 5.1 | RLS es la puerta · DEFINERs | ✅ |
| 5.2 | vidriera anónima | ✅ por firma · ⚠️ falta confirmar con datos |
| 5.3 | datos del solicitante | ✅ anon · ⚠️ faltan dos brazos |
| **5.4** | **D-485** | **🔴 BLOQUEA E3 y el paso 15** |
| 5.5 | firma / OTP | ⛔ no existe |
| 5.6 | inmutabilidad | ✅ |
| 5.7 | rol de refugio | ✅ guards · **🔴 N4 incompleta** |
| 5.8 | anti-abuso + reloj | ✅ mitad · **🔴 «3 activas» no existe · el cron nunca corrió** |
| 5.9 | menores | ⛔ no existe |
| 5.10 | storage | ✅ no filtra · **🔴 el refugio no puede subir** |
| 5.11 | reportes | ⛔ no existe |
| 5.12 | no inventar evidencia | ✅ |

**Rojos abiertos hoy: cinco.** D-485 · N4 sin `tipo` · N1 sin techo de 3 · el
cron sin una corrida · el refugio sin poder subir fotos.
**Cobertura pendiente por pieza inexistente: cuatro** (firma, formulario/menores,
reportes, y los brazos de §5.3 que necesitan una solicitud viva).

---

## §3 · LECCIÓN QUE DEJA ESTA PASADA

**🔴 La misma sonda, desde dos asientos, da veredictos opuestos — y el asiento
del superusuario es el que miente.** Tres «agujeros» (borrar el texto legal,
editar una aceptación, borrarla) **desaparecieron** al re-correrlos como
`authenticated`. *El CLI de la casa conecta con un rol que RLS no alcanza: toda
sonda de permisos corrida por `db query` mide la ausencia de TRIGGER, jamás la
presencia de RLS.* **Su correctivo es barato y es el que apliqué: toda sonda de
RLS lleva `SET LOCAL ROLE authenticated` + `request.jwt.claims`, y al lado un
control positivo que pruebe que ese asiento SÍ lee algo** (acá: 27 filas y no 97).

---

# ADDENDUM · 2-sep 00:10–00:55 — LO QUE APARECIÓ AL SEMBRAR

*Con 1 005 publicaciones sembradas (ya borradas, residuo cero) se pudieron correr
los brazos que ayer quedaron ⚠️. **Y el vertical cambió mientras yo medía:** A
reemplazó `obtener_adoptables` entero y creó `obtener_adoptable`,
`actualizar_adoptable`, `cambiar_estado_adoptable` y la vista
`v_adoptables_publicos`. **La §5.2 de arriba describe la función VIEJA.** Esto la
enmienda.*

## A1 · 🔴 EL HALLAZGO MAYOR — la vidriera anónima no puede mostrar NINGUNA foto

**La policy `mascotas_select_vidriera_anon` no puede dar verdadero nunca.**

Su predicado pregunta por filas de `mascotas`, `adopcion_publicacion` y
`cat_estados_adopcion` — **tres tablas que `anon` no puede leer**. Cuando el
predicado se evalúa *desde el asiento de `anon`*, la RLS de esas tres tablas se
aplica **dentro del `EXISTS`** y lo vuelve falso.

**Medido, el mismo predicado desde los dos asientos:**

```
predicado desde SUPERUSUARIO ............................ true
🔴 el MISMO predicado desde el asiento ANON ............. false
por qué: lo que anon VE de cada tabla del EXISTS
         mascotas=0 · adopcion_publicacion=0 · cat_estados_adopcion=0
```

**Confirmado por camino real, con su discriminador:**

```
ANON  download portada de adoptable publicado  -> ⛔ Object not found
AUTH  (dueño ajeno) mismo objeto               -> ⛔ Object not found
AUTH  (su propia foto) otro objeto             -> ✅ 62 582 bytes   ← CONTROL POSITIVO
```

*El control positivo es lo que cierra el caso: el mismo cliente, la misma llamada,
baja 62 kB cuando el objeto es suyo ⇒ **el ⛔ es la policy negando, no el archivo
faltando** (Storage responde «Object not found» también cuando deniega: no revela
existencia).*

**Consecuencia, en la voz del recorrido:** **§0 pasos 8 y 9 no tienen foto.** La
lista sin sesión y la ficha de Luna se dibujan sin imagen para un visitante
anónimo. *No es una fuga: es lo contrario — está cerrado de más.* **La puerta:
`mascotas_select_vidriera_anon`. Es de A.**

## A2 · §5.2 RE-MEDIDA sobre la función nueva — ✅ VERDE

Con datos, por camino real y con control negativo:

| sonda | dio |
|---|---|
| `anon → rpc obtener_adoptables()` | ✅ **3 destacados + 2 resto**, con `cursor`, `hay_mas`, `orden_por_convivencia` |
| las **37 claves** de una tarjeta | ✅ **ninguna prohibida** (sin teléfono, correo, dirección, RUC, cédula ni coordenadas) |
| `anon → rpc con {"nombre_menor":"x"}` | ✅ **rebota `filtro_no_valido: nombre_menor`** |
| `anon → rpc con cursor basura` | ✅ **rebota `cursor_no_valido`** |
| CONTROL− `anon` sobre las 4 tablas de abajo | ✅ **0 filas en las cuatro** |

🟠 **Pero `anon` alcanza la vista directamente** y con eso saltea paginación,
tope y lista blanca: **1 005 filas, 36 columnas, 1,06 MB, p95 651 ms.** Sin
columna prohibida ⇒ **no es fuga**, es que *la puerta de adelante tiene al lado
una ventana sin marco.* **Detalle completo en `S112-E-PERFORMANCE.md` §5.**

## A3 · §5.9 · media respuesta que sí se pudo dar

El formulario sigue sin existir, **pero la lista blanca de filtros ya rebota una
clave fuera de esquema**: mandarle `nombre_menor` a `obtener_adoptables` devuelve
`filtro_no_valido: nombre_menor`. *Es el mismo mecanismo que §5.9 pide para las
respuestas, ejercido en la otra puerta — y prueba que el patrón funciona.*

## A4 · 🔴 LA MISMA TRAMPA, COBRADA DOS VECES EN UN DÍA, EN LAS DOS DIRECCIONES

Ayer el asiento del superusuario me fabricó **tres rojos falsos** (§5.6). Hoy el
mismo asiento me fabricó **un verde falso**: leí el predicado de la policy, lo
evalué como superusuario, **dio `true`, y la policy está muerta**.

> **Un predicado de RLS medido desde un asiento que RLS no alcanza no mide la
> policy: mide otra pregunta parecida.** Y falla en las dos direcciones — de más
> (inventa agujeros) y de menos (esconde puertas trancadas).
>
> **El correctivo, ejercido acá:** toda evaluación de un predicado de policy se
> corre **con `SET LOCAL ROLE <el rol al que gatea>`**, y al lado se imprime
> **qué ve ese rol de cada tabla que el predicado menciona** — que es lo que
> convirtió un `false` inexplicable en un diagnóstico.

## A5 · TABLA ACTUALIZADA

| # | requisito | ayer | **hoy** |
|---|---|---|---|
| 5.2 | vidriera anónima | ⚠️ | ✅ **verde, re-medida sobre la función nueva** |
| 5.4 | D-485 | 🔴 | 🔴 sin cambio |
| 5.10 | storage | 🟠 | **🔴 la policy anon no puede dar verdadero — la vidriera no muestra fotos** |
| 5.9 | menores | ⛔ | ⛔ (media respuesta: la whitelist de filtros sí rebota) |
| — | vista alcanzable por `anon` | — | 🟠 **nuevo** |

**Rojos abiertos: SEIS.** D-485 · N4 sin `tipo` · N1 sin techo de 3 · el cron sin
una corrida · el refugio sin poder subir fotos · **la policy anon de storage
muerta**. **Más un 🟠 nuevo:** el `GRANT SELECT` de `anon` sobre la vista.

---

# ADDENDUM 2 · 2-sep 12:30–13:10 — LAS TRES CURAS DE A, RE-MEDIDAS · Y EL ROJO QUE APARECIÓ AL PRODUCIR OTRO

**CONTRA QUÉ:** base viva + `main f74706bb` (migración `20260907920000`).

## B1 · 🔴 EL TRASPASO NO PUEDE TERMINAR NUNCA — y no es `D-485`

**Lo encontró el CONTROL POSITIVO del rojo del acta**, no una sonda dirigida a él.
*Ese es el argumento entero de por qué un rojo se prueba con su par: el par existe
para demostrar que la sonda muere donde uno cree — y acá demostró que muere en
otro lado.*

```
CONTROL+ · acta VIGENTE, ¿pasa el guard 7?
   -> ✅ pasó el 7 · murió después en:
      new row for relation "adopcion_publicacion" violates check constraint
      "chk_estado_adoptable"
```

**La causa, en el paso ④ de `traspasar_mascota_a_familia`:**

```sql
UPDATE adopcion_publicacion
   SET estado='retirada', retirada_en = now(), motivo_retiro = 'adoptada'
 WHERE id = v_pub;
```

**Acotado con tres mediciones:**

| medición | resultado |
|---|---|
| `chk_estado_adoptable` admite | `borrador · publicada · pausada · adoptada · no_disponible` — **«retirada» no está** |
| `cat_estados_adopcion` contiene | `adoptada · borrador · no_aplica · pausada · publicada` — **tampoco** |
| funciones que escriben `'retirada'` | **UNA**: `traspasar_mascota_a_familia`. *Es un punto, no una clase* |
| filas con `estado='retirada'` | **0** — el CHECK no las deja nacer |

**Lo único bueno:** muere en el **último** paso ⇒ la transacción entera revierte y
**no deja media adopción aplicada**. **Lo grave:** el traspaso **nunca pudo
correr**, y ningún gate lo habría visto **porque nadie lo llamó** — es
literalmente *el candidato natural al guard equivocado*. Y `adoptada`, que parece
el valor correcto, está en el CHECK y en el catálogo, a la vista.

**PUERTA: el vocabulario entre la función y su CHECK. Es de A.** *No propongo el
valor: el vocabulario se firma, no se deduce.*

## B2 · LAS TRES CURAS DE A — ✅ las tres, con discriminador

| cura | sonda | dio |
|---|---|---|
| **① la policy de storage** | `anon` baja la **portada de un adoptable publicado** | ✅ **62 582 bytes** |
| | `anon` baja una foto que **NO** es de un adoptable | ✅ ⛔ `Object not found` |
| **③ el GRANT** | `anon → select v_adoptables_publicos` | ✅ ⛔ `42501 permission denied for view` |
| | **CONTROL+**: `anon → rpc obtener_adoptables` | ✅ sigue devolviendo **3 destacados** |
| **② el bucket** | `authenticated` no dueño sube a la carpeta de **una publicación ajena** | ✅ ⛔ `violates row-level security policy` |
| | el mismo, a **una carpeta inventada** | ✅ ⛔ idem |

*Para que ① discriminara de verdad sembré usando como portada **el único objeto
legible del bucket**: si hubiera usado uno cualquiera, el `Object not found` del
caso (a) habría sido del archivo faltando y no de la policy — y el verde no
habría valido nada.*

🟠 **Una nota que queda:** `authenticated` **conserva** `SELECT` sobre
`v_adoptables_publicos`. El argumento con el que se le quitó a `anon` —*la vista
no es una API pública, es el detalle de implementación de los dos lectores*—
aplica igual a un usuario logueado, que también puede saltear la paginación.
**Mucho menos grave (exige cuenta) y puede ser deliberado. Se nombra.**

## B3 · LOS DOS ROJOS AUTORIZADOS, EJERCIDOS — cada uno con su par

| # | sonda | esperado | dio |
|---|---|---|---|
| 1 | **CONTROL+** · traspaso con el acta **vigente** | pasa el guard 7 | ✅ pasó (y murió en B1) |
| 2 | 🔴 traspaso con el acta **jubilada** | `acta_no_disponible` | ✅ **`acta_no_disponible: acta_adopcion v1`** |
| 3 | 🔴 publicar desde cuenta **`pendiente_validacion`** | `cuenta_no_activa` | ✅ **`cuenta_no_activa: pendiente_validacion`** |
| 4 | **CONTROL+** · la misma llamada con la cuenta **activa** | pasa el gate | ✅ pasó |

**Cómo se produjeron, declarado porque me aparté de lo pedido:**
- **El acta no se jubiló en dos actos:** el ida y vuelta ocurrió **dentro de una
  transacción que termina en `ROLLBACK`**. *Una transacción abortada no la ve
  ninguna otra sesión y no puede quedar a medias — es más fuerte que «volvela a
  `true` después», porque no depende de que yo llegue a hacerlo.*
- **La cuenta del founder no se tocó de forma persistente.** Intenté crear una
  cuenta de prueba aparte y **no se puede: hay un `UNIQUE` por
  `owner_profile_id`** y ese usuario ya tiene la suya. Así que el cambio de
  estado ocurrió **dentro de la misma transacción abortada**.

**RESIDUO CERO, verificado al cerrar:** cuenta `80c41ac7` **activa** ·
`acta_adopcion v1` **vigente** · **0** cuentas `SONDA-E` · **0** publicaciones ·
`mascotas` de vuelta en **83**.

## B4 · TABLA AL CIERRE DE LA PASADA 2

| # | requisito | estado |
|---|---|---|
| 5.1 · 5.2 · 5.3(anon) · 5.6 · 5.12 | — | ✅ |
| 5.7 | rol de refugio | ✅ **los dos rojos ejercidos** · 🔴 N4 sigue sin `tipo` |
| 5.10 | storage | ✅ **curado y re-medido con par** |
| — | `anon` sobre la vista | ✅ **cerrado** · 🟠 queda `authenticated` |
| **—** | **el traspaso escribe un estado que su CHECK prohíbe** | **🔴 NUEVO — bloquea E3 antes que `D-485`** |
| 5.4 | `D-485` | 🔴 sin cambio |
| 5.8 | N1 sin techo de 3 · el cron sin correr | 🔴 |
| 5.5 · 5.9 · 5.11 | firma · formulario · reportes | ⛔ no existen |

---

# ADDENDUM 3 · 2-sep 13:00–13:30 — §5.3 CERRADA, con sus cuatro asientos

**Escenario armado dentro de una transacción que termina en `ROLLBACK`**: una
publicación viva del refugio real, el solicitante postulando **por la puerta**
(`aceptar_documento_adopcion` → `crear_solicitud_adopcion`), y después la misma
lectura desde **cuatro asientos distintos**.

| # | asiento | pregunta | dio |
|---|---|---|---|
| 1 | **solicitante (+8)** | `crear_solicitud_adopcion` | ✅ creó `607a226c…` |
| 2 | solicitante | ¿ve **su** solicitud? | **1 fila** |
| 3 | solicitante | ¿ve **su** hilo? | **1 mensaje** |
| 4 | solicitante | `obtener_mis_solicitudes_adopcion` | **1 fila** |
| 5 | **CONTROL+ · el publicador (refugio)** | ¿ve la solicitud? | ✅ **1 fila** |
| 6 | **CONTROL+ · el publicador** | ¿ve el hilo? | ✅ **1 mensaje** |
| 7 | 🔴 **tercer usuario (+7)** | ¿ve la solicitud ajena? | ✅ **0 filas** |
| 8 | 🔴 tercer usuario | ¿ve el hilo ajeno? | ✅ **0 mensajes** |
| 9 | 🔴 tercer usuario | `obtener_mis_solicitudes_adopcion` | ✅ **0 filas** |
| 10 | 🔴 **OTRO refugio** (rol otorgado en la txn) | ¿ve la solicitud ajena? | ✅ **0 filas** |
| 11 | 🔴 OTRO refugio | ¿ve el hilo ajeno? | ✅ **0 mensajes** |
| 12 | 🔴 **N1** · misma familia, mismo animal, segunda vez | segunda solicitud | ✅ **rebotó `solicitud_ya_viva: 607a226c…`** |

**Los pasos 5 y 6 son lo que le da valor a los ceros de abajo:** el publicador
**sí ve**, con los mismos datos y en la misma transacción ⇒ *los ceros del tercer
usuario y del otro refugio son denegación, no una tabla vacía.*

**Y de paso quedan ejercidos por camino real:**
- **§5.12** — `aceptar_documento_adopcion` **corrió de verdad** (sin eso la
  compuerta `condiciones_no_aceptadas` habría frenado la postulación).
- **la mitad buena de N1** — con su **rebote hablado y con el id adentro**
  (`L-424` cumplida: no es un `23505` crudo, lleva a dónde ir).

**RESIDUO CERO, verificado:** `0` solicitudes · `0` mensajes · `0` publicaciones ·
`0` familias de sonda · `0` mascotas de sonda · **1** rol de refugio (el
original) · y `+8` sigue con sus **27** consentimientos, no 28.

## Un hallazgo operativo para el recorrido del founder

**`guillo381+refugio@gmail.com` NO entra con la clave compartida de las cuentas
de prueba.** Medido: `+8`, `+7` y `+9` entran; **el refugio rebota con
`Invalid login credentials`**. *No es un defecto —puede tener clave propia a
propósito— pero es el paso 1 del recorrido de §0, así que el founder tiene que
saber con qué clave entra antes de tener el teléfono en la mano.* **Se declara
en `S112-E-ESCENARIO-DEL-FOUNDER.md` §1.**

---

# ADDENDUM 4 · 2-sep 14:00–15:00 — SOBRE DATOS REALES · el traspaso completa · y el bucket rompe DOS actos

**CONTRA QUÉ:** base viva + `main 60ab4891`, con **los cinco animales de A6
sembrados por las puertas reales** (Luna · Nube · Tito · Bruno publicados,
**Kira en borrador**).

## D1 · ✅ EL CRON 48 CORRIÓ — se cierra el último rojo de la primera pasada

```
now() UTC ......... 2026-09-02 14:23
corridas .......... 1        última: 2026-09-02 14:00:00.21+00
status ............ succeeded
```

*Ayer era «tendido, activo y con cero corridas». Hoy tiene su primera, y el
cable ya estaba probado aparte con control negativo ⇒ **los dos hechos, que son
distintos, están los dos medidos**.*

## D2 · 🟢 EL TRASPASO COMPLETA — y `D-485` queda ejercido de punta a punta

Corrido **sobre Luna**, en transacción con `ROLLBACK`:

```
🟢 ¿EL TRASPASO COMPLETA AHORA? ....... ✅ SÍ · {"ok": true, "evento_id": "d8e7f469…"}
   estado de la publicación ........... adoptada · retirada_en=NULL      ✅
   evento de procedencia escrito ...... 1                                 ✅
   familia_id de Luna ................. ce057f90… (la familia adoptante)  ✅
   user_id de Luna .................... 632727a3… (EL REFUGIO)            🔴
   filas en mascota_codueño ........... 0                                 🔴
🔴 ¿la familia VE a Luna? ............. NO — 0 filas
🔴 ¿ve su expediente? ................. 0 eventos  (el refugio le había cargado 1)
✅ CONTROL+ · mascotas que sí ve ...... 11
🔴 ¿el REFUGIO la sigue viendo? ....... SÍ
```

**La cura de `retirada` es verde: el traspaso ya no muere.** Y con eso `D-485`
pasa de predicción a **hecho ejercido**: *la vacuna que el refugio cargó antes de
la entrega —que es literalmente la promesa del paso 15— queda invisible para la
familia, y el refugio conserva la mascota como dueño.*

## D3 · ✅ N4 EJERCIDA — cuatro rojos y su control

| sonda | dio |
|---|---|
| criterio `NULL` | ✅ `criterio_requerido: escribi qué se revisó…` |
| criterio **en blanco** (`'   '`) | ✅ `criterio_requerido` — *rechaza espacios, no sólo NULL* |
| tipo inventado (`santuario`) | ✅ `tipo_de_refugio_no_valido: santuario` |
| **CONTROL+** tipo y criterio válidos | ✅ pasó |
| **§5.7** un NO-admin se otorga el rol | ✅ `solo_admin_otorga_rol_refugio` |

Y las cuatro columnas pobladas de verdad: `tipo_verificacion=organizacion` ·
`criterio_verificacion` con texto · `verificado_por` · `verificado_en`.

## D4 · ✅ §5.2 SOBRE LA VIDRIERA REAL

```
anon → obtener_adoptables ..... 3 destacados + 1 resto = Tito, Luna, Nube, Bruno
🔴 ¿aparece Kira (borrador)? .. ✅ NO
claves prohibidas ............. ✅ ninguna de 38
anon → select a la vista ...... ✅ ⛔ 42501
```

**Kira no se filtra**, que era el rojo que importaba de §5.2 con datos reales.

## D5 · 🔴 EL BUCKET `adopcion-fotos` NO TIENE POLICY DE `SELECT`, Y ESO ROMPE DOS ACTOS

**El camino de la foto funciona… hasta que hay que volver a tocarla.** Corrido
como el refugio, con su clave:

```
① subir (sin upsert) ................... ✅ SUBIÓ
② reemplazar con upsert:true ........... 🔴 new row violates row-level security policy
③ reemplazar con .update() ............. 🔴 idem
④ ANON la baja (bucket público) ........ ✅ 70 bytes
⑤ agregar_foto_adoptable ............... ✅ {"ok":true,"es_portada":true,"orden":0}
⑥ la ficha la devuelve ................. ✅ como URL pública  ← lo que §6 pedía
⑦ quitar_foto_adoptable ................ ⛔ la función NO EXISTE
```

**Y al ir a limpiar apareció lo de fondo.** Las policies de `adopcion-fotos` son
`a` (insert) ×2, `d` (delete) ×2 y `w` (update) — **ninguna de `SELECT`**:

```
el refugio → list() de SU PROPIA carpeta ....... vacío
storage.objects para esa carpeta ............... 2 filas, owner = el refugio
el refugio → remove([los dos paths exactos]) ... ✅ sin error, data.length=0
storage.objects después ........................ 🔴 SIGUEN LAS 2
```

**Dos consecuencias, y la segunda es la peligrosa:**
1. **La pantalla del refugio no puede listar sus propias fotos** ⇒ «subir,
   ordenar, la primera es la portada» (§4.2) no tiene de dónde leer.
2. 🔴 **`remove()` responde ÉXITO y no borra.** *Es `L-222` de esta casa otra vez:
   el DELETE de Storage resuelve los objetos con un SELECT interno; sin policy de
   SELECT no encuentra ninguno, borra cero y reporta bien.* **Un borrado que
   miente es peor que uno que falla: nadie va a verificar lo que ya dijo que hizo.**

⚠️ **RESIDUO QUE NO PUEDO LIMPIAR, DECLARADO:** quedan **2 objetos de sonda** en
`adopcion-fotos/9adfbbe0-…/` (`e-1788359163167.png` y `portada.png`, 70 bytes cada
uno, owner el refugio). **No los puedo borrar**: la API dice que sí y no lo hace,
y el `DELETE` por SQL lo rebota `storage.protect_delete`. **Los borra A** con la
policy de admin, o **desaparecen solos cuando exista la policy de `SELECT`.**
*La fila de `adopcion_foto` sí quedó limpia (0).*

## D6 · 🔴 LOS CINCO ANIMALES NO TIENEN NINGUNA FOTO

```
Bruno · Kira · Luna · Nube · Tito → foto_url = ~ SIN FOTO · galería = 0
```

**La policy de la vidriera está curada y la vidriera sigue sin fotos, por otra
razón: no hay ninguna foto cargada.** *Dos causas distintas con el mismo síntoma
— y si sólo se recuerda «la policy se curó», el recorrido del founder va a fallar
igual y va a parecer que la cura no sirvió.*

## D7 · 🔴 MI PROPIO FALSO ROJO, CAZADO ANTES DE REPORTARLO

**Mi primera sonda de subida usaba `upsert: true` y dio
`new row violates row-level security policy`.** Estuve a un paso de reportar *«el
refugio no puede subir fotos»* — **y es falso: sin `upsert` sube perfecto.**

*Tercera vez en dos días que el instrumento produce un rojo que no es del objeto,
y la tercera con causa distinta: el asiento equivocado (§5.6), el predicado
evaluado bajo RLS ajena (A1), y ahora **una bandera del cliente que cambia el
camino que se está midiendo**.* **Lo que lo cazó fue el control positivo de
siempre:** el mismo cliente subiendo al bucket `mascotas`, que funcionó — *si la
sesión estuviera rota, ése habría fallado también.*

> **Lección, y es la forma general de las tres:** *una sonda mide el camino que
> toma, no el que uno cree que toma. Toda opción que se le pasa al cliente
> (`upsert`, `head`, `count`) es parte del camino y hay que variarla antes de
> llamar rojo a un rebote.*

---

# ADDENDUM 5 · 2-sep 15:30–16:15 — `D-485` CURADO Y EJERCIDO · §5.9 y N1 CERRADOS

**CONTRA QUÉ:** base viva + `main 23ab355a`.

## E1 · 🟢 `D-485` — los seis puntos dieron vuelta, sobre Luna

```
el traspaso .............................. ✅ ok
user_id de Luna después .................. dd024680…  (el TITULAR destino, ya no el refugio)
① ¿la familia VE a Luna? ................. ✅ SÍ
② ¿ve su expediente? ..................... ✅ 2 eventos  (la vacuna del refugio + la procedencia)
   CONTROL+ · total que ve ............... 12   (era 11: la de más es Luna)
③ ¿el REFUGIO la sigue viendo? ........... ✅ ya no
   CONTROL− · ¿un TERCERO la ve? ......... ✅ no
```

**El paso 15 de §0 está VERDE por camino real.** *«Luna está en su familia con la
vacuna que el refugio cargó»* dejó de ser una promesa: son los 2 eventos de la
línea ②.

**Y el brazo que hace que este verde valga es el CONTROL NEGATIVO:** un tercero
sigue sin verla. *Sin ese brazo, un helper que devolviera `true` siempre habría
dado exactamente el mismo resultado en las tres primeras líneas.*

## E2 · ✅ §5.9 — el esquema del formulario rebota nombrando la clave

**Con el CONTROL POSITIVO PRIMERO**, que es lo que le da sentido a lo de abajo:

| # | sonda | dio |
|---|---|---|
| 1 | **CONTROL+ · formulario VÁLIDO** | ✅ **creó la solicitud** |
| 2 | el **mismo** payload + `hogar.nombre_menor` | ✅ `respuesta_no_valida: hogar.nombre_menor` |
| 3 | el **mismo** + `hogar.edad_menor` | ✅ `respuesta_no_valida: hogar.edad_menor` |
| 4 | el **mismo** + `sueldo` en la raíz | ✅ `respuesta_no_valida: sueldo` |

**Rebota con el NOMBRE de la clave**, así que la pantalla puede llevar al campo
exacto — y cuando la clave no está en el esquema, la persona ve **que ese dato no
se pide**. *Es la respuesta que el abogado esperaba, ejercida y no leída.*

## E3 · ✅ N1 completo

```
solicitud sobre el animal #2 ....... ✅ creó
solicitud sobre el animal #3 ....... ✅ creó
solicitud sobre el animal #4 ....... ⛔ tope_de_solicitudes: 3
activas al final ................... 3
```

**Las dos mitades:** «una por animal» (índice + guard con el id) y «tres en
total» (`tope_de_solicitudes: 3`, **hablado**). `L-424` cumplida en las dos.

## E4 · 🔴 MI CUARTO FALSO — y esta vez fue un falso VERDE

**Mi primera pasada de §5.9 «pasó»:** mandé `hogar.nombre_menor` y rebotó. **Pero
rebotó por `por_que`** — una clave mía mal escrita, que el validador rechazaba
antes de mirar el hogar. *El rojo era correcto y no era el mío.*

**Lo que lo destapó fue que el CONTROL POSITIVO también rebotó**, con el mismo
mensaje. *Un control positivo que falla no es un detalle del arnés: es el aviso de
que todo lo demás que corriste no midió lo que creías.*

> **Cuarta vez en dos días, y las cuatro con causa distinta:** el asiento
> equivocado · el predicado evaluado bajo la RLS ajena · una bandera del cliente ·
> y ahora **un payload inválido por otra razón**.
>
> **La forma que las cubre a las cuatro:** *el control positivo va PRIMERO, no
> al lado. Si el caso que debe pasar no pasa, ningún rojo de abajo significa
> nada — y se lee igual de convincente.*

---

# ADDENDUM 6 · 2-sep 16:45–17:20 — E3 CORRIÓ POR CAMINO REAL Y MURIÓ EN EL ACTA

**CONTRA QUÉ:** base viva + `main f81494aa`. **Dos sesiones reales** (la familia
`+8` y el refugio), sobre **Nube** —no sobre Luna, para no tocar el animal del
recorrido del founder—.

## F1 · LO QUE CAMINÓ

```
① aceptar condiciones (familia) ....... ✅ nueva
② postular con el formulario completo . ✅ solicitud 8b747efd-5f23-454a-990d-0d28ad9b59cd
③ el refugio responde en el hilo ...... ✅
④ el refugio ACEPTA ................... ✅ {"ok":true,"estado":"aceptada"}
⑤ obtener_acta_adopcion ............... 🔴 malformed array literal: "adoptante_cedula"
⑥ solicitar_codigo_firma .............. 🔴 el mismo error
```

**Los pasos 10 a 13 de §0 caminan de verdad**, con las dos personas, el hilo y la
aceptación. **El arco muere al abrir el acta.**

## F2 · 🔴 LA CAUSA, AISLADA CON DOS CONTROLES POSITIVOS

```
text[] := '{}' || 'literal sin casteo' ...... 🔴 malformed array literal
CONTROL+ · el mismo CON ::text .............. ✅ {adoptante_cedula}
CONTROL+ · array_append(v,'x') .............. ✅ {adoptante_cedula}
¿y si el array YA tiene un elemento? ........ 🔴 igual
```

En `_renderizar_acta`: `v_falt text[] := '{}'` y después **trece líneas** de la
forma `v_falt := v_falt || 'adoptante_cedula'`. *Con el literal sin tipo, Postgres
resuelve `anyarray || anyarray` e intenta castear el texto a `text[]`.* **Las 13
ocurrencias medidas, todas con la misma forma.**

**Por qué no se vio antes, y es lo que lo vuelve caro:** la línea de
`adoptante_nombre` **no falló** —el nombre sí estaba—; falló la siguiente. ⇒ **el
defecto se manifiesta en la PRIMERA línea que se ejecute**, así que un acta a la
que sólo le faltara `animal_senas` reventaría nombrando `animal_senas`.

> **No es un caso borde: es toda la rama de los faltantes** — y hoy dispara
> **siempre**, porque nadie tiene cédula cargada. *El único camino que pasa es el
> del acta sin nada que falte, que es exactamente el que no va a ocurrir la
> primera vez que alguien la use.*

**Alcance del daño: cero.** Muere al abrir el acta ⇒ **0 firmas, 0 códigos
emitidos**, nada a medias.

**PUERTA: `_renderizar_acta`, sus 13 líneas. Es de A.** *No propongo la forma:
hay dos que funcionan y elegir entre ellas no es mío.*

## F3 · LO QUE ESTO DEJÓ SIN MEDIR, DECLARADO

**El defecto del OTP que A pidió medir desde afuera —que
`solicitar_codigo_firma` ya no devuelva el código en su payload— NO SE PUDO
MEDIR:** la llamada muere antes de emitir nada.

**Lo único que sí se puede afirmar:** `solicitar_codigo_firma` **murió con el
mismo error** ⇒ *llama a `_renderizar_acta` ANTES de emitir*, así que **para un
acta incompleta no emite código**. Eso es la mitad buena. **La otra mitad —que el
payload no lo lleve cuando el acta SÍ está completa— queda SIN MEDIR**, y no se
da por buena leyendo el cuerpo: se pidió medirla desde afuera y así se va a medir.

## F4 · ESTADO REAL QUE ESTA CORRIDA DEJÓ, declarado y no limpiado

**La solicitud `8b747efd-5f23-454a-990d-0d28ad9b59cd` sobre Nube quedó en
`aceptada`, con 2 mensajes en el hilo y 0 firmas.** **No se limpió a propósito:**
es exactamente el fixture que hace falta para probar la firma en cuanto el acta
abra. *Se declara para que su dueño decida — no para que aparezca de sorpresa.*

**Los seis rojos de §5.5, más `acta_cambio_de_version` y `acta_incompleta`,
quedan escritos y corren el día que el acta abra.**

---

# ADDENDUM 7 · 2-sep 17:30–18:20 — EL ACTA ABRE · Y LA FIRMA SE FRENA EN EL CATÁLOGO DE AVISOS

**CONTRA QUÉ:** base viva + `main ed984c9a`. **Tres sesiones reales** (familia,
refugio, tercero), sobre la solicitud `8b747efd` de **Nube**.

## G1 · ✅ EL ACTA ABRE, Y BIEN

```
⑤ obtener_acta_adopcion (familia) ....... ✅
   faltantes ............................ ["adoptante_cedula","adoptante_ciudad",
                                           "refugio_representante_cedula","animal_senas"]
   versión · largo ...................... 1 · 5 121 chars
   CONTROL+ · el refugio también la ve .. ✅
   🔴 un TERCERO ........................ ✅ sin_acceso
```

**El texto se rinde de verdad**: el nombre del adoptante, «Nube» y el refugio
aparecen. **Los únicos `{{…}}` que sobreviven son los cuatro que DEBEN
sobrevivir hasta la firma** — `{{folio}}`, `{{firma_refugio}}`,
`{{firma_adoptante}}`, `{{hash_documento}}`.

⚠️ *Mi primera sonda los marcó en rojo: el regex buscaba `{{…}}` **o** guiones
bajos, y los `{{…}}` legítimos lo dispararon. **Falso rojo, verificado antes de
reportarlo.***

## G2 · ✅ `acta_incompleta` NOMBRA LOS FALTANTES, y no hay callejón

```
solicitar_codigo_firma (familia) ... ✅ acta_incompleta: adoptante_cedula, adoptante_ciudad,
                                        refugio_representante_cedula, animal_senas
solicitar_codigo_firma (refugio) ... ✅ el mismo, con los mismos cuatro
solicitar_codigo_firma (tercero) ... ✅ sin_acceso
```

**No se emite código para un acta con huecos** — que era el punto. **Y probé que
el callejón que sospechaba NO existe**: cada actor puede llenar **su** faltante
por camino real, sin depender de la firma.

```
familia → profiles.cedula + direccion_ciudad ....... ✅ escribió
refugio → profiles.cedula (el representante) ....... ✅ escribió
refugio → actualizar_adoptable(senas) .............. ✅ ok
faltantes después .................................. []
```

*Importaba medirlo: `firmar_acta_adopcion` toma `p_cedula` y `p_domicilio`, y si
ésa fuera la única puerta habría deadlock — el código exige el acta completa y la
cédula se cargaría al firmar. **No lo es.***

## G3 · 🔴 LA FIRMA NO PUEDE EMITIR CÓDIGO: falta el tipo en el catálogo de avisos

**Con el acta ya completa (`faltantes: []`):**

```
solicitar_codigo_firma ....... 🔴 tipo_desconocido
payload ...................... null
```

**Causa, medida:** la función llama a
`registrar_intencion_notificacion('codigo_firma_adopcion', …)` y **ese código no
está en `cat_notificacion_tipos`**:

```
tipos en el catálogo ......... 64
los de adopción / firma ...... adopcion_mensaje_nuevo · adopcion_sin_respuesta ·
                               adopcion_solicitud_nueva · adopcion_solicitud_respondida
🔴 codigo_firma_adopcion ..... NO ESTÁ
```

**Alcance del daño: cero, y por la razón correcta** — `adopcion_codigo_firma`
tiene **0 filas**: la excepción revierte la RPC entera, así que **no quedan
códigos huérfanos**. *El diseño es sano; le falta una fila de catálogo.*

**PUERTA: el tipo `codigo_firma_adopcion` en `cat_notificacion_tipos`. Es de A o de D.**

## G4 · LO QUE ESTO DEJA SIN MEDIR — la sonda que A pidió, otra vez

**No se pudo medir que el payload de `solicitar_codigo_firma` no lleve el
código**, porque la llamada **no llega a devolver payload**. *Se declara por
segunda vez en lugar de darse por buena leyendo el cuerpo.*

**Lo que sí quedó medido de esa cura, y es la mitad del diseño:** el código
**sale por el motor de intenciones** y el `RETURN` construye *«a dónde se mandó,
jamás qué se mandó»*. **Eso es lectura, no medición, y así se declara.**

## G5 · LOS ROJOS DE ACCESO, TODOS VERDES

| sonda | dio |
|---|---|
| un tercero abre el acta | ✅ `sin_acceso` |
| un tercero pide código | ✅ `sin_acceso` |
| un tercero firma | ✅ `sin_acceso` |
| firmar sin código emitido (×6) | ✅ `sin_codigo` las seis |

*`sin_codigo` en los seis intentos es coherente: no hay código que acertar. **Los
rojos de `codigo_vencido`, `codigo_incorrecto`, `intentos_agotados`, `ya_firmaste`
y `acta_cambio_de_version` siguen sin poder correr**, y no se dan por buenos.*

## G6 · MI SEXTO FALSO, y esta vez en la campana

**Mi sonda de «¿la campana lleva el código?» dio 🔴 en las dos tablas.** Fui a
mirar el crudo antes de reportar: **las tres filas son `cita_recordatorio` de
citas de Thor y de Kira**, del mismo día, **sin ninguna relación con la firma**.
El `\d{8}` pegaba en otra cosa.

> **Sexta vez en dos días.** *Un regex laxo sobre un corpus ajeno encuentra
> siempre — y encuentra algo verdadero que no es lo que se preguntó.* **La forma:
> antes de llamar rojo a una coincidencia, se mira la fila que la produjo.**

---

# ADDENDUM 8 · 2-sep 18:30–19:30 — LA FIRMA CORRIÓ · DOS AGUJEROS Y UN INSERT IMPOSIBLE

**CONTRA QUÉ:** base viva + `main 42630c0c`. Tres sesiones reales sobre el
fixture `8b747efd` (Nube), con el acta ya completa.

## H1 · ✅ EL OTP NO VIAJA EN EL PAYLOAD — medido por mí, desde afuera

*Lo declaré dos veces como no medido antes de darlo por bueno. Éste es el
literal:*

```json
{"ok":true,"enviado_a":"guillo381+8@gmail.com","expira_en":"2026-09-02T15:18:21+00:00"}

¿ocho dígitos seguidos? ........... ✅ NO
¿alguna clave codigo/code/otp/pin?  ✅ NO
¿dice A DÓNDE se mandó? ........... ✅ sí
```

Y del objeto: **`codigo_hash` de 64 caracteres** ⇒ hasheado en reposo. **El
código sí existe y viaja: la intención lleva los 8 dígitos en su mensaje.** *El
segundo factor va por su canal y no vuelve por el que la pantalla lee.*

## H2 · 🔴 EL OTP ACEPTA INTENTOS ILIMITADOS — `intentos_agotados` es inalcanzable

**Medido de tres formas independientes:**

```
seis intentos con código falso .... los SEIS: «codigo_incorrecto: quedan 4 intento(s)»
la fila después de los seis ....... intentos = 0
el literal ........................ UPDATE …SET intentos = intentos + 1 WHERE id = v_c.id;
                                    RAISE EXCEPTION 'codigo_incorrecto: quedan %', 4 - v_c.intentos;
```

**El `UPDATE` y el `RAISE` están en la misma transacción** ⇒ la excepción
**revierte el incremento**. `intentos` queda en 0 para siempre, `4 - 0` da 4
siempre, y el guard de más arriba (`IF v_c.intentos >= 5`) **nunca se cumple**.

> *No se puede contabilizar un intento fallido y lanzar en la misma transacción.*
> **Y es de las que leer el código NO muestra: el `UPDATE` está ahí, escrito, y
> parece correcto.** Aparece ejerciéndolo seis veces y mirando la fila.

**Lo que deja:** un OTP de 8 dígitos, vida de 10 minutos, **sin techo de
intentos**. *La ventana acota el daño; el límite de 5 que §5.5 pide no existe.*
**PUERTA: `firmar_acta_adopcion`. Es de A.**

## H3 · 🔴 LA SEGUNDA FIRMA NO COMPLETA — el INSERT del hito, contra otro esquema

```
el refugio firma → 🔴 column "tipo_evento" of relation "eventos_mascota" does not exist
```

**De las 8 columnas que el INSERT nombra, CINCO no existen:**

| usa | existe |
|---|---|
| `mascota_id` · `fecha_evento` · `procedencia` | ✅ |
| **`tipo_evento`** | 🔴 la real es **`tipo`** |
| **`titulo`** · **`descripcion`** | 🔴 no están |
| **`creado_por`** | 🔴 la real es **`creado_por_user_id`** |
| **`metadata`** | 🔴 la real es **`datos`** |

*Y la casa tiene tabla tipada para esto:* `evento_hito_narrativo (evento_id,
mascota_id, country_code, clave, contexto)`. **El patrón es evento padre + fila
tipada; el INSERT actual escribe contra un esquema que no es el de esta tabla.**

**Daño cero, verificado:** 1 sola firma (la del adoptante) · Nube **sigue
publicada** · la solicitud sigue en `aceptada`. *El traspaso se llama justo antes
del INSERT, así que corrió y revirtió con todo lo demás — no quedó media
adopción.*

**⇒ El traspaso nunca se dispara, y el paso 15 no se puede cerrar.**

## H4 · LO QUE SÍ QUEDÓ VERDE, todo por camino real

| sonda | dio |
|---|---|
| **la familia FIRMA** | ✅ `folio F-2026-000050 · papel adoptante · firmas 1 · completa false` |
| **el estado intermedio** de §4.1 | ✅ `firmas:[{papel:"adoptante", sello:…}] · mi_papel:"adoptante"` |
| 🔴 **`ya_firmaste`** | ✅ **y en el lugar correcto: rebota al PEDIR el código, no al firmar** |
| 🔴 `codigo_incorrecto` | ✅ con los intentos en el mensaje |
| 🔴 un tercero: acta · código · firma | ✅ `sin_acceso` en las tres |
| el refugio pide código | ✅ y su payload **tampoco** lleva el código |

*Que `ya_firmaste` rebote al pedir el código y no al firmar es **mejor** de lo que
§5.5 pedía: no se emite un código para algo que no se puede firmar.*

## H5 · LO QUE SIGUE SIN PODER CORRER

- **`codigo_vencido`** — exige esperar 10 minutos o mover `expira_en`, y mover un
  código emitido es tocar la evidencia. *Se corre con la ventana real.*
- **`acta_cambio_de_version`** — el camino real es **publicar `acta_adopcion v2`**
  para que el código quede emitido sobre otro texto. **Publicar una versión de un
  documento legal no es mío**: se pidió a A y no se hizo por cuenta propia.
- **`intentos_agotados`** — inalcanzable por H2.

## H6 · UNA NOTA PARA A Y D, sin medir a fondo

Las intenciones del código salieron con **`estado='entregada'`**. *Que el motor
las marque entregadas no es lo mismo que un correo llegando a un buzón.* **Sigue
sin verificar, y es el pendiente declarado con D.**

## H7 · LA FORMA QUE SE REPITIÓ TRES VECES HOY

`retirada` que el CHECK no admite · el array de faltantes sin castear · y el
INSERT del hito contra otro esquema. **Las tres compilan, las tres están
escritas, y las tres revientan la primera vez que alguien las recorre.**

> **Una rama que nunca se ejecutó no está probada por existir.** *Las tres
> aparecieron por ejercer y ninguna por leer — y las tres estaban en el camino
> feliz, no en un borde.*

---

# ADDENDUM 9 · 2-sep 20:00–20:40 — 🟢 **E3 CERRADO: EL PRIMER TRASPASO REAL CORRIÓ DE PUNTA A PUNTA**

**CONTRA QUÉ:** base viva + `main 4ec71100`. Tres sesiones reales sobre el
fixture `8b747efd` (**Nube**).

## I1 · ✅ EL TECHO DE INTENTOS, con su discriminador

```
intento 1 .. {"ok":false,"motivo":"codigo_incorrecto","intentos_restantes":4}
intento 2 .. 3      intento 3 .. 2      intento 4 .. 1      intento 5 .. 0
intento 6 .. {"ok":false,"motivo":"intentos_agotados","intentos_restantes":0}
la fila .... intentos = 5
```

**Y el brazo que hace que el techo sirva de algo** — sin él sólo frenaría a los
equivocados, que es justo a quien no hace falta frenar:

```
firmar con el código CORRECTO, ya agotado → {"ok":false,"motivo":"intentos_agotados"}
```

*Un código errado dejó de ser una excepción y pasó a ser un resultado: por eso el
`UPDATE` commitea. La cura es de A; la medición, independiente.*

## I2 · 🟢 LAS DOS FIRMAS Y EL TRASPASO

```
el refugio firma → {"ok":true,"folio":"F-2026-000054","papel":"refugio","firmas":2,
                    "completa":true,"hito_id":"55ae3cb5…","traspaso":{"ok":true,…}}

el acta, con las dos firmas:
  [{"papel":"adoptante","sello":"…15:09:58…"},{"papel":"refugio","sello":"…15:22:23…"}]
```

## I3 · 🟢 EL PASO 15 DE §0, VERIFICADO DESDE CADA ASIENTO

| # | qué promete §0 | dio |
|---|---|---|
| ① | Nube está en su familia | ✅ **la familia la ve** · `estado_adopcion=adoptada` · `user_id` = el titular |
| ② | **con la vacuna que el refugio cargó** | ✅ **3 eventos**, y **uno es de las 13:26**, de antes de la firma ⇒ *el expediente que el refugio cargó ANTES de la entrega viajó con ella* |
| ③ | procedencia: el refugio | ✅ `80c41ac7…` en el evento de transferencia |
| ④ | el hito | ✅ **dos hitos, y son dos momentos distintos** (abajo) |
| ⑤ | sale de la vidriera | ✅ `obtener_adoptables` ya no la lista |
| ⑥ | el refugio deja de verla | ✅ |
| — | **CONTROL−** · un tercero | ✅ **tampoco la ve** |

**Los dos hitos, medidos con su hora, porque a primera vista parecían un
duplicado:**

```
13:26:58  hito_narrativo · llego_a_la_familia    ← el rescate (A la sembró)
15:22:23  transferencia_familia                  ← el traspaso
15:22:23  hito_narrativo · adopcion_completada   ← la firma
```

⇒ **No es ruido: son el rescate y la adopción, separados.** *La decisión de A de
**no** reusar `vida_nueva_empieza` —porque esa clave describe el alta de un
animal individual— queda validada en el objeto: los dos momentos conviven en la
misma línea de vida y se distinguen.*

## I4 · LA TABLA DE §5, AL CIERRE DE E3

| # | requisito | estado |
|---|---|---|
| 5.1 · 5.2 · 5.3 · 5.4 · 5.6 · 5.7 · 5.8 · 5.9 · 5.10 · 5.12 | — | ✅ **verde, ejercido** |
| 5.5 | firma / OTP | ✅ **verde salvo dos brazos** (abajo) |
| 5.11 | reportar publicación | ⚪ **no medido por E** — A la aplicó en A10 |

**Los dos brazos de §5.5 que no corrieron, y por qué:**
- **`codigo_vencido`** — exige esperar los 10 minutos reales o mover `expira_en`
  de un código emitido, que es tocar la evidencia. *Se corre con la ventana real.*
- **`acta_cambio_de_version`** — el camino real exige **publicar `acta_adopcion
  v2`**, que deja rastro en una tabla inmutable y le cambiaría el texto a
  cualquiera que abra un acta en ese instante. **Se frenó y se pidió a A**, que
  lo cubre en un cinturón con `ROLLBACK`. *No se hizo por cuenta propia.*

## I5 · ESTADO QUE ESTA CORRIDA DEJÓ EN LA BASE, declarado

**Nube está adoptada de verdad.** `8b747efd` cerrada con sus dos firmas, folios
`F-2026-000050` y `F-2026-000054`, y Nube vive en la familia de `guillo381+8`.
**La vidriera quedó con TRES animales publicados** (Luna, Tito, Bruno) más Kira
en borrador. *Se declara porque cambia lo que el founder va a ver en su
recorrido: donde §0 dice cinco, hay cuatro y uno ya adoptado.*

---

# ADDENDUM 10 · 2-sep 21:00 — EL CANAL DEL CÓDIGO, MEDIDO

*Era lo último del arco que nadie había mirado: `estado='entregada'` no es un
buzón.* **Esto acota cuánto se puede afirmar.**

## J1 · ✅ EL CÓDIGO SALE POR CORREO, y el proveedor lo aceptó

Las **seis** intenciones de `codigo_firma_adopcion` emitidas durante E3:

```
total .................. 6
con proveedor_id ....... 6      ← el transporte devolvió un id del proveedor
canal_elegido = email .. 6
cortadas por un gate ... 0
```

Y el `resuelto_como` de una, entero:

```json
{"despacho":"para_transporte","despacho_en":"2026-09-02T15:27:00Z",
 "evaluado_en":"2026-09-02T15:26:44Z","proveedor_id":"318f3b49-…",
 "canal_elegido":"email","gate_que_corto":null,
 "canales_habilitados":["in_app","push","email"]}
```

**Lo que esto SÍ prueba:** el motor eligió `email`, ningún gate lo cortó, y **un
proveedor de correo aceptó el mensaje y devolvió su id**. *Es bastante más que
«se marcó entregada».*

**Lo que NO prueba, y se dice:** **que el correo haya llegado a un buzón.** *Que
un proveedor acepte un mensaje y que una persona lo reciba son dos hechos, y el
segundo sólo lo puede verificar quien abre el correo.* **Queda para el founder,
en el paso 7 y el 14 de su recorrido.**

`correo_suprimido`: **0 filas** ⇒ ninguna de las dos direcciones está en la lista
de supresión, que es la causa silenciosa más común de un correo que no llega.

## J2 · ✅ EL CÓDIGO NO SE FILTRA A LA CAMPANA — y esta vez el cero significa algo

```
🔴 filas de codigo_firma_adopcion en `notificaciones` ....... 0
✅ CONTROL+ · la campana tiene ....... 26 filas de 10 tipos
```

⚠️ **Mi primera pasada de esta sonda dio el mismo 0 y NO valía nada:** el control
que corrí al lado era *«¿la campana tiene otras de adopción?»* y dio **0 también**
⇒ el cero podía ser «la campana está vacía de adopción», no «el código está
excluido». **El control bueno es que la campana reciba ALGO**, y recibe 26 cosas
de 10 tipos.

> **Séptima vez en dos días, y ya como reflejo:** *el control positivo no es
> cualquiera que esté cerca — es el que, si fallara, explicaría el resultado por
> otra razón.*
