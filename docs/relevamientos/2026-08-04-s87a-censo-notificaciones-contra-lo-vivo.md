# S87-A · CENSO DE `MODELO_NOTIFICACIONES` v0 CONTRA LO VIVO

> **Primera tarea de S87. Nadie diseña hasta este reporte.** Medición del
> 4-ago-2026 contra el proyecto `zyltipqscdsdsxnjclhp` y el árbol en `a086501`.
> **Hallazgos con su literal, jamás veredictos (MÉTODO §5).**
>
> ⚠️ **EL CUADRO CAMBIÓ — se frena y se trae (orden de arranque).** La premisa
> madre del v0 —*"D-475 🔴: las tres capas en CERO"*— **es falsa en su literal**.
> No están en cero: están **construidas a medias, sin gates y sin transporte**, y
> **siete funciones vivas ya escriben intenciones que nadie lee ni entrega**.
> Eso no agranda el arco: lo **reordena** — hay que curar antes de encender.

**Entorno verificado antes de medir** (orden de arranque): `node_modules` en raíz
y en las apps · `.env.local` en ambas · `tsc --noEmit` de `@epetplace/api` **exit 0**
· `db query --linked` responde. Ningún rojo de esta acta es de entorno.

---

## 1. Las seis preguntas, con su literal

### ① ¿D-475 sigue cierto? — **NO en su literal. Es el hallazgo que reordena.**

D-475 dice textual: *"son TRES capas y hay CERO de las tres"*, con la evidencia
S72 *"`from('notificaciones')` = 0 hits · `push_tokens` … cero líneas de app la
tocan · no hay RPC"*. **Lo medido hoy:**

| tabla | cols | filas | quién la escribe |
|---|---|---|---|
| `notificaciones` | 16 | **26** | **7 funciones vivas** (abajo) |
| `push_tokens` | 7 | **0** | **CERO funciones · CERO líneas de app** |
| `user_notificacion_prefs` | 4 | 5 | **CERO funciones**; solo `wrappers/preferencias.ts` |
| `consentimientos` | 8 | 59 | (legado, fuera del arco) |
| `user_preferencias` | 3 | 4 | `wrappers/preferencias.ts` (idioma) |

**Las siete que INSERTAN en `notificaciones`** (`prosrc ilike '%insert into … notificaciones%'`):
`_notificar_dueño_prestador` · `_trg_completar_pendiente_registro` ·
`cerrar_y_renovar_planes` · `cleanup_pendientes_vencidos` ·
`fijar_fecha_procedimiento` · `vencer_paquetes_salidas` ·
`vencer_programas_adiestramiento`. **Las siete son SECURITY DEFINER.**

**Lo que esas filas dicen de sí mismas** (era monorepo, `created_at >= 2026-06-01`):
**todas** `canal='in_app'` · **todas** `enviada=false` · `enviada_en` NULL ·
`error_envio` NULL. Las únicas `enviada=true` con `canal='push'` son del
**2026-05-02** — legado del portal viejo, ningún productor nuestro las escribió.

**Y el otro lado, que es el que duele:** **CERO consumidores.** `from('notificaciones')`
sigue en **0 hits** en `apps/` y `packages/` — igual que en S72. `public.notificaciones`
**sí está** en la publicación `supabase_realtime`; nadie se suscribe.

> **La lectura honesta, capa por capa (§2 del v0):**
> **capa 1 INTENCIÓN — EXISTE A MEDIAS y SIN GATES.** Hay siete productores. Ninguno
> consulta momento vital, menores, rol, consentimiento ni techo (§5). Escriben directo.
> **capa 2 DESTINATARIO — PARCIAL.** `notificaciones.rol_destino` es `text` NOT NULL
> sin catálogo; no cuelga de `empleado_tiene_rol`.
> **capa 3 CONSENTIMIENTO — EXISTE MAL** (ver §3 de esta acta: el contrato vivo no
> puede expresar la unidad del modelo).
> **capa 4 TRANSPORTE — CERO, y sin vehículo** (ver ⑥: `pg_net` no está instalada).

### ② Censo de productores de email — **D-508 SIGUE CIERTO, sin matices**

`resend|sendgrid|nodemailer|smtp|inviteUserByEmail|sendEmail|mailer|postmark|mailgun|brevo|sendinblue|mandrill`
sobre el monorepo y `supabase/` (excluido `docs/`): **2 archivos, ninguno productor**:

- `CLAUDE.md` — el canon **citando el propio censo de S74**.
- `supabase/config.toml` — líneas 237-239, el bloque **comentado** de la plantilla
  del CLI (`# [auth.email.smtp]` / `# host = "smtp.sendgrid.net"`).

**Cero productor de email en todo el stack.** El único correo que sale sigue siendo
el de Supabase Auth. Las 3 edge functions siguen siendo walkin / nota-clínica / vacuna.

### ③ El binario 1.0.3 del prestador — **NO PUEDE RECIBIR PUSH. Ni un byte.**

**Es la que ordena todo, y sale roja.** Medido con el guard de D-574
(`scripts/verify-manifest-apk.mjs`) contra el APK que el founder tiene:

```
$ node scripts/verify-manifest-apk.mjs apps/prestador/build-s80-b19.apk --app prestador
ROJO — LA BUILD NO SE DISTRIBUYE (D-574):
  ✗ FALTA resource google_app_id — google-services.json NO se horneó
  ✗ FALTA listener de MESSAGING_EVENT — nadie recibe el push
EXIT=1
```

Identidad del binario (`aapt2 dump badging`): `package='com.epetplace.prestador'
versionCode='1' versionName='1.0.3'` — **es la 1.0.3**. El check de
`geo.API_KEY` **pasa** (la cura B19 de S80 está adentro); lo que falta es push.

Corroboraciones independientes sobre el mismo APK:
- **Permisos:** el único relacionado es `WAKE_LOCK`. **No existe `POST_NOTIFICATIONS`.**
- **Manifest:** los únicos rastros de `firebase` son registrars de **MLKit**
  (`BarcodeRegistrar`, `VisionCommonRegistrar` — vienen con la cámara).
  **Cero `firebase-messaging`, cero `expo.modules.notifications`.**

**LA CRONOLOGÍA, que es la prueba de L-196 en su forma más limpia:**

| cuándo | qué |
|---|---|
| **Jul 28, 18:07** | se construye `build-s80-b19.apk` — **el 1.0.3** |
| Jul 29 | commit `35f3f4a` — entra `expo-notifications ~57.0.7` + el plugin |
| Jul 29 | commit `9d040fe` — entran los dos `google-services.json` |

**El binario es ~17 horas ANTERIOR a la preparación entera.** La preparación de
S79-S82 no "no pasó por un compilador": **pasó DESPUÉS del último compilador**.

**Y el cableado tiene su propia trampa, medida:** `apps/prestador/app.config.ts`
líneas 24-26 ponen `googleServicesFile` **condicional** a
`process.env.GOOGLE_SERVICES_JSON`; `app.json` **no lo declara**
(`android.googleServicesFile: undefined`). ⇒ **una build sin esa env var sale sin
FCM y en silencio** — exactamente la clase de falla que el guard existe para cazar.

**Nota del árbol nativo:** `apps/prestador/android/` existe (gitignored, Jul 21),
**no tiene** `google-services.json` ni el plugin `com.google.gms` en su gradle.
Es un prebuild viejo: **no es fuente de verdad de nada**.

**Firebase, lo medible y lo que no:** proyecto **`e-petplace-7854e`**, project_number
`676099697994`. Los dos json existen y son coherentes (cliente **multi-app** —trae
cliente y prestador—, prestador **single**); los `mobilesdk_app_id` no se cruzan.
**Lo que NO pude medir sin credenciales** (queda para el founder, no lo doy por hecho):
si la **llave FCM V1** está subida a EAS y si la **env var de archivo
`GOOGLE_SERVICES_JSON`** existe en el proyecto EAS. *El "creo que ya está" del founder
es cierto para el ARCHIVO; no es verificable desde acá para la LLAVE ni la ENV VAR.*

### ④ El gate de la vitrina — **CONFIRMADO: abre solo**

```
to_regprocedure('public.notificar_reasignacion_cita(uuid, uuid)')  →  null
trigger trg_prestadores_gate_vitrina                                →  1 (existe)
prestadores con expone_personas = true                              →  0
to_regprocedure('public.puede_encender_vitrina()')                  →  existe
```

Y el cuerpo lo dice con todas las letras (`_trg_prestadores_gate_vitrina`):

```sql
IF NEW.expone_personas IS NOT TRUE OR OLD.expone_personas IS TRUE THEN
  RETURN NEW;   -- solo gatea el FLIP a encendido
END IF;
IF to_regprocedure('public.notificar_reasignacion_cita(uuid, uuid)') IS NULL THEN
  RAISE EXCEPTION 'aviso_reasignacion_no_existe' USING ERRCODE = '23514', HINT = …
```

**Construir `notificar_reasignacion_cita(uuid, uuid)` con esa firma exacta abre el
gate sin tocar el trigger.** L-171 en su precedente vivo.

### ⑤ El correo de recuperación — **LA CONFIG NO ESTÁ EN EL REPO**

Esto es lo que la pregunta pedía ubicar, y el hallazgo es **dónde NO está**:

- `packages/api/src/wrappers/seguridad.ts:199` — `resetPasswordForEmail(input.email.trim())`,
  **sin `redirectTo`**.
- **Cero** ocurrencias de `redirectTo` / `emailRedirectTo` / `redirect_to` en todo
  el monorepo (`packages`, `apps`, `supabase`).
- `supabase/config.toml` es la plantilla **LOCAL** del CLI: `site_url = "http://127.0.0.1:3000"`.
  **No gobierna el proyecto remoto.**

⇒ **El destino lo pone íntegramente el Site URL del proyecto**, que vive en el
dashboard de `zyltipqscdsdsxnjclhp` (Authentication → URL Configuration) y **no es
versionable**. Único candidato de destino medido en los repos legado:
`https://e-petplace-v2.vercel.app`.

> **No cierro ⑤ por medición: no puedo.** Requiere leer el dashboard. Lo que sí
> queda probado es que **el código no lo decide** — si mañana alguien "arregla el
> correo" tocando el repo, no va a mover nada. **Y la cura correcta es de dos
> piezas: el Site URL del proyecto Y un `redirectTo` explícito en el wrapper**
> (hoy no hay ninguno: el producto no declara su propio destino).
> D-628 ya declara aparte que las plantillas son las default (inglés, remitente ajeno).

### ⑥ La corriente de eventos de §2 — **HAY QUE FABRICAR EL ENGANCHE**

El v0 dice: *"Nace de la MISMA corriente de eventos … el sedimento ES la señal."*
Lo medido:

- El sedimento real es **`eventos_mascota` (188 filas)**. La tabla `eventos` existe
  con **0 filas**; su único trigger no-interno es `trg_eventos_updated -> update_updated_at`.
- **Los 5 triggers de `eventos_mascota`**, y ninguno produce intención:
  `trg_eventos_auto_log_atencion` · `trg_eventos_procedencia_clinica` ·
  `trg_eventos_propagar_estado_vida` · `trg_eventos_update_ultimo` ·
  `trg_eventos_validar_profundidad`.
- **`eventos_mascota` NO está** en la publicación `supabase_realtime`
  (`notificaciones` sí lo está — al revés de lo que el motor necesita).
- **Extensiones:** `pg_cron` 1.6.4 ✓ · `supabase_vault` 0.3.1 ✓ · **`pg_net` NO INSTALADA**.
  4 cron jobs vivos.

⇒ **La "corriente" es una TABLA con cinco vigilantes, ninguno de los cuales avisa.**
El enganche se fabrica. **Y el dato duro del transporte: sin `pg_net`, la DB no
puede hacer una llamada saliente** — el vehículo de push/email no es solo "falta
código", falta la extensión o un Edge Function invocado desde afuera.

---

## 2. Las tres columnas sobre el v0

### ✅ SIGUE CIERTO
- **§2 la separación en 4 capas** — el orden es correcto y la medición lo respalda:
  lo único con dependencia externa (transporte) es lo único en cero absoluto.
- **§4 LA LEY DE LA PANTALLA BLOQUEADA** — intacta, y **hoy no la viola nadie
  porque nadie envía**. Se aplica antes del primer envío, no después.
- **§7 push primero / email segundo** — ratificado: email sigue en cero productores (②).
- **§10.2 modo sombra obligatorio** — **hoy el sistema YA está en un modo sombra
  accidental**: 26 intenciones escritas, cero entregadas. La diferencia con el modo
  sombra del doc es que este no fue declarado y nadie mira el registro.
- **§13 "el schema: se releva lo vivo antes — verificar, no asumir"** — la línea que
  el propio doc escribió es la que lo salva: **cobró hoy**.
- **§10bis ② el gate de la vitrina** — confirmado al literal (④).
- **§10bis ④ el correo al portal viejo** — confirmado como fuga, con la precisión de
  ⑤: la config no vive donde el doc deja suponer.

### ❌ CADUCÓ
- **La premisa madre "las tres capas en CERO" (encabezado + D-475).** Falsa en su
  literal: capa 1 tiene siete productores vivos, capa 3 tiene tabla y wrapper.
  **La cita de S72 sigue siendo verdadera sobre el CONSUMO** (`from('notificaciones')`
  = 0 hits) — lo que caducó es leer "cero consumo" como "cero motor".
- **"D-137 confirmada en CERO (ningún productor escribe `vacuna_vencida` ni
  `cita_recordatorio`)"** — hay filas `vacuna_vencida` y `cita_recordatorio` en la
  tabla (2026-05-02, legado). El productor sigue sin existir; **el dato ya no está en cero**.
- **§14 "Capas 1-3 … disparan con S74/S75"** — no dispararon. Trece sesiones.
- **§7 "un token muerto se retira"** — presupone tokens. `push_tokens` = **0 filas**
  y **cero código** que la escriba: no hay nada que retirar todavía.

### 🕳 NOMBRA LO QUE NO EXISTE
1. **El transporte entero.** Cero envío, cero cola, cero reintento, cero
   idempotencia (§10.1), cero kill switch (§10.3), cero techo duro (§10.4),
   cero auditoría de entrega (§10.6). `notificaciones.enviada` es una columna
   que **ningún código pone en `true`** en la era monorepo.
2. **Los cinco gates estructurales de §5.** Ninguno existe. Las siete funciones
   insertan sin consultar memorial, menores, rol, consentimiento ni techo.
   **Consecuencia medible hoy: si mañana se conecta un transporte a lo que ya
   está escrito, sale sin un solo gate.**
3. **El catálogo de categorías de §3.** `notificaciones.tipo` y
   `user_notificacion_prefs.tipo` son `text` libre. Las 7 categorías del doc
   (`seguridad_cuenta`…`saldo_pagado`) **no existen en ninguna parte del schema**.
4. **La unidad (persona, categoría, canal) de §6.** Inexpresable: la PK de
   `user_notificacion_prefs` es `(user_id, tipo)` — **sin canal**.
5. **`notificar_reasignacion_cita(uuid, uuid)`** — la llave del gate de la vitrina.
6. **Los módulos nativos de push en el binario** — y por lo tanto **una build**.
7. **`pg_net`** — o la decisión explícita de que el transporte se invoca desde afuera.
8. **El `redirectTo` del producto** — el código no declara su propio destino de correo.

---

## 3. El contrato de preferencias — tres defectos, y por qué van EN el lote del motor

Hallazgos de la pista D, medidos y adoptados como territorio A. **Los tres son de
la clase D-654: código que funciona y hace lo incorrecto en silencio.**

1. **La PK `(user_id, tipo)` no tiene canal** ⇒ §6 es inexpresable. Migración.
2. **`tipo` es vocabulario ABIERTO** (CHECK = `length > 0`), 10 tipos vivos, la
   superficie cubre 5, sin catálogo ni categoría. **El catálogo de tipos con su
   categoría (§3) es la pieza que los gates estructurales consumen** — sin él,
   §5 no se puede escribir. *Dudas de mapeo declaradas, sin resolver acá:*
   `documento_aprobado` / `prestador_aprobado` (¿`operacion` o `relacional`? son
   del lado prestador) · `sistema` (¿`seguridad_cuenta`?).
3. **Los dos defectos dormidos, y son SIMÉTRICOS:**
   - **`promocion` nace ENCENDIDA** — el contrato vivo es *"fila ausente = habilitada"*
     sin distinguir categoría, contra §3/§6/§12.3 (`comercial` **OFF por defecto**).
   - **`vacuna_vencida` se puede APAGAR** — la superficie escribe `habilitada=false`
     sobre lo que §3 declara **no apagable** (`salud_seguridad`: se elige el canal,
     jamás la existencia).
   > **Uno enciende lo que debe nacer apagado; el otro apaga lo que no se puede apagar.
   > Los dos sobreviven porque el contrato no sabe qué es una categoría.**
4. **`guardarPreferenciaNotificacion(tipos[], habilitada)` no tiene canal** —
   ensanche de contrato, **puerta única con la migración**.

> **La consecuencia de orden, y es la razón de ponerlo acá:** **encender el motor
> sin curar esto enciende el defecto.** No es "deuda que acompaña": es precondición.

---

## 4. Los tres encargos de mesa

### ① El «antes» de capa motor de D-654 — **REBOTE PRODUCIDO** ✅

Inalcanzable desde la pantalla (C midió que el menú se arma de un lector vet).
Producido por SQL, in-txn con **ROLLBACK**, con claims reales del titular de Aurora:

```
hora Guayaquil : 2026-08-04 22:17:47.466837
hora UTC       : 2026-08-05 03:17:47.466837+00
código enviado : 'paseo'  (tipos_servicio.es_medico = false)
REBOTE LITERAL : 22023 :: tipo_no_medico :: hint=(vacío)
```

Guard responsable (`registrar_atencion_mostrador`, cuarto en el orden de guardas,
después de `auth_required` → `no_access_to_prestador` →
`el_mostrador_registra_no_reserva` → `prestador_sin_cuenta` → `sin_acceso_mascota`):

```sql
IF NOT EXISTS (SELECT 1 FROM tipos_servicio WHERE codigo = p_tipo_servicio_codigo AND es_medico = true) THEN
  RAISE EXCEPTION 'tipo_no_medico' USING ERRCODE = '22023';
END IF;
```

**Residuo verificado: 0 citas** nacidas hoy en ese negocio. **Nota para el gate:
el rebote NO trae HINT** — a diferencia del gate de la vitrina, que sí lo trae.

### ② Las TRES credenciales — **CREADAS / RESETEADAS Y VERIFICADAS** ✅

Negocio: **Aurora `de680000-0000-4000-8000-0000000000e5`** (`estado='activo'`).
Ambas `activo=true`, `rol='empleado'` — **ni `dueño` ni `administrador`**.

| | email | clave temporal | uid | chips |
|---|---|---|---|---|
| **(a) profesional** | `guillo381+s87prof@gmail.com` | `S87prueba!2026` | `a16ac32c-80fe-45a0-bfbf-cebc69b82a20` | **2** (consulta_general + vacunacion, ambos `es_medico`) |
| **(b) recepción** | `guillo381+s87recep@gmail.com` | `S87prueba!2026` | `31bb74c0-a769-4ce0-9db8-65d9b33f7652` | **0** |

**(c) TITULAR de `[DEMO S44] Paseos Andres`** — pedido de C, solo clave temporal,
**la fila NO se tocó** (verificado: sigue `dueño / activo=true` en
`de300000-0000-4000-8000-0000000000e5`):

| | email | clave temporal | uid |
|---|---|---|---|
| **(c) titular** | `demo-prestador@epetplace.dev` | `S87prueba!2026` | `c5d54e3a-cf1a-45c6-8605-dfd826b022ee` |

Sirve para el «antes» **y** el «después» de D-654.

**Verificado por el camino real, no por el INSERT — las TRES:**
- **Login real** contra `/auth/v1/token?grant_type=password` con la anon key:
  **(a) OK · (b) OK · (c) OK**.
- **Discriminador del producto** — `empleado_tiene_capacidad_clinica('de68…e5')`
  con los claims de cada una: **profesional = `true` · recepción = `false`**.

> **⚠️ EL FALLO QUE ESTA VERIFICACIÓN CAZÓ, y por qué se registra:** el primer
> login dio **500 `Database error querying schema`** en las dos. Causa: un INSERT
> directo a `auth.users` deja `confirmation_token`, `recovery_token`, `email_change`
> y `email_change_token_new` en **NULL**, donde GoTrue espera **`''`**. Curado con
> un `coalesce(...,'')` sobre las ocho columnas de token. **Las filas se habrían
> visto perfectas en SQL y las cuentas no entraban** — es L-192 exacta: *una
> verificación cuyo modo de falla es el silencio no es una verificación.*
> **Regla que deja: una cuenta sembrada por SQL no está creada hasta que alguien la LOGUEA.**

> **🔴 CONSECUENCIA QUE DECLARO Y NO ESCONDO — toca la evidencia de D-651.**
> D-651 dice *"se muestra a 5 personas"*. Esas 5 son los empleados
> `activo=true, rol='empleado'`: `55996928` · `5c0bf879` · `93cea629` · `afdc7fb9` ·
> `ebd956db`. **No toqué ninguna.** Pero mis dos filas son de la misma clase:
> **el censo pasa de 5 a 7.** Las dos nuevas son identificables por nombre
> (`Prueba Profesional S87` / `Prueba Recepcion S87`) y por email `+s87`.
> **Todo recuento de D-651 de acá en más las excluye explícitamente, o miente.**

### ③ D-654, dato de contrato — **anotado para el lote**

El wrapper manda `p_prestador_id · p_mascota_id · p_tipo_servicio_codigo ·
p_precio · p_empleado_id · p_country_code` — **sin duración**. La firma viva
la acepta: `p_hora time DEFAULT NULL`, `p_fecha date DEFAULT NULL`, y la duración
la resuelve el motor. **El paso 3 del orden firmado es ensanche de contrato:
motor y wrapper viajan juntos, puerta única.**

---

## 5. Lo que esta acta deja para la mesa (no lo decide)

- **La build de push corta runtime nuevo**, con el bump **en el mismo rango que la
  build, jamás antes** (propuesta de D). **Espejo del prestador CONFIRMADO en este
  censo:** APK Jul 28 · módulo Jul 29 — el mismo patrón que el cliente
  (APK 16-jul · módulo 29-jul). **Hoy `runtime 1.0.2` nombra dos conjuntos
  nativos distintos en las dos apps.**
- **Candidata de letra (deber ③ del método):** `update:view` en salida humana **no
  imprime `gitCommitHash`** — solo con `--json`. Quien corra el deber al pie puede
  creer que falló. **Se registra, no se enmienda sin mesa.**
- **Candidata a tercera pieza de la regla 85:** `supabase/.temp` **no viaja con el
  worktree**, y sin él `db query --linked` rebota `LegacyProjectNotLinkedError`.
  Hoy la regla nombra `node_modules` y `.env.local` — **son tres**.
- **Nota menor de acta:** el mensaje del commit `35f3f4a` conserva la premisa
  superada *"SE REUSA el Firebase del legado"*. **El archivo está bien**
  (`e-petplace-7854e` es el proyecto nuevo); el mensaje quedó viejo y no se reescribe.

### DEUDA CANDIDATA — LA ÚLTIMA MILLA DE LOS ASSETS (sin numerar)

**Se numera cuando el diagnóstico cierre, con el literal de C** (regla 66: el
número se verifica libre por grep al depositarla; el instrumento, si nace, es de B).

**El síntoma medido:** `verify-ota` **VERDE** (sirve lo publicado, build `finished`)
y el emulador lleva **cinco arranques fríos** sin poder aplicar **`019fcfc1`** —
`DownloadError` a **64/65 assets** (`d5435ef51f3ec81bff48d5fb18f54470`), segundo
modo `CheckError`.

> **Por qué es deuda y no un incidente:** **ninguna mitad del paso ⓪ cubre que los
> assets BAJEN.** El paso ⓪ verifica que lo publicado *se sirva*; nadie verifica que
> *llegue*. **Un OTA con 64 de 65 assets no falla el gate: falla el arranque** — y el
> verde de `verify-ota` es honesto sobre lo que mide y mudo sobre lo que falta.
> **Es la familia de L-192 en la capa de entrega.**

Discriminación **en curso** (emulador vs CDN) con el aparato del founder. **Esta
acta no la cierra ni le adjudica causa.**
