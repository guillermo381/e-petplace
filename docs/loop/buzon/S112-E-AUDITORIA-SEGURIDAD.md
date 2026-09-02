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
