# S81-R4 · EL TREN DE NOTIFICACIONES — qué exige la build, qué más sube

> Relevamiento, CERO construcción (mandato). Medido 29-jul contra el
> árbol y la DB viva. El reloj: **62 días al 1-oct** y el Día 30 cae en
> septiembre; el motor de notificaciones es PRECONDICIÓN del 1-oct
> (`DEFINICION_SOFTLAUNCH` §3.5). El binario tarda; el motor puede
> llegar por OTA DETRÁS del tren — por eso el tren se prepara AHORA.

## 0 · Lo medido hoy (la línea base)

- `expo-notifications`: **CERO** en ambos `package.json` (grep = 0/0).
- `google-services.json` / config de FCM: **CERO** en ambos `app.json`.
- Tokens: cero tabla de push tokens en DB (lo que SÍ existe:
  `user_notificacion_prefs` de S55 — preferencias POR TIPO, fila
  ausente = habilitada — la capa de CONSENTIMIENTO ya tiene semilla).
- Versiones: cliente `1.0.2` · prestador `1.0.3` (policy `appVersion`).
- Perfiles `preview` de eas.json: listos en ambas apps (channel
  preview, APK, environment development).

## 1 · Lo que la build EXIGE, exactamente (por app)

1. **`expo-notifications` instalado** — módulo NATIVO ⇒ build, jamás
   OTA (L-134). En ambas apps (el dueño recibe "tu paseo empezó"; el
   prestador recibe "tenés una reserva").
2. **El config plugin en `app.json`** (ícono/color de la notificación
   Android; el permiso `POST_NOTIFICATIONS` de Android 13+ lo agrega el
   plugin — el PROMPT runtime es de la UI, que viaja OTA después).
3. **FCM V1 (Android) — LA PIEZA QUE NO ES DE CODE:** proyecto
   Firebase + `google-services.json` por app + credencial subida a EAS
   (`eas credentials`). **DECISIÓN/ACCIÓN FOUNDER:** ¿Firebase NUEVO o
   el del ecosistema legado? — el admin v2 YA opera notificaciones
   sobre el mismo proyecto Supabase (S49): si existe un proyecto FCM
   vivo del legado, se REUTILIZA (la operación se conecta, no se
   reinventa). Sin esta pieza el token Android no nace: es EL
   bloqueante externo del tren.
4. **iOS/APNs: NO para este tren** (declarado) — hoy no hay binario
   iOS instalado en ningún dispositivo del producto; Android alcanza
   para el Día 30 EC. APNs entra con el primer build iOS.
5. **`version` bump** — cliente `1.0.2 → 1.0.3` · prestador
   `1.0.3 → 1.0.4` (runtime policy `appVersion`): desde ese momento
   los OTA se publican CONTRA EL RUNTIME NUEVO (la regla en piedra de
   S78: nadie publica contra el viejo para esa APK), y los APK
   anteriores siguen su canal hasta reinstalarse.
6. **D-574, el checklist del manifest ANTES de distribuir** (corrido
   1/1 en S81-B1, ahora con una meta-data más): la build declara qué
   secrets exigía y encontró — `GOOGLE_MAPS_API_KEY` (geo.API_KEY en
   manifest) **+ la config de FCM**. Sin declaración, no se distribuye.
   Y el recordatorio D-574-addendum: versionName/versionCode NO
   discriminan — el manifest es el único juez.
7. `adb install -r` en el dispositivo del founder + verificación por
   el pie de Cuenta (L-160) + doble reinicio (L-138).

## 2 · Lo que viaja OTA DESPUÉS del tren (NO exige build — no lo cargue nadie al binario)

- Las tablas del motor (tokens por dispositivo · intención ·
  destinatario) y sus RPCs — capas 1-3 de `MODELO_NOTIFICACIONES`
  (§4 la ley de la pantalla bloqueada ya tiene letra).
- La Edge Function de ENVÍO (Expo Push API server-side).
- La Hoja del permiso con voz honesta (patrón del permiso "siempre"
  del GPS: la voz ANTES del prompt nativo) y la superficie de Ajustes.
- `user_notificacion_prefs` ya existe — el consentimiento por tipo
  tiene mesa servida.

## 3 · Qué MÁS debería subir al MISMO tren (candidatos, decisión de mesa)

| Candidato | Por qué ESTE tren | Costo |
|---|---|---|
| **D-579 · la sonda nativa del manifest** (`PackageManager.getApplicationInfo(GET_META_DATA)`) | la propia ficha dice "el próximo tren de build"; mata el guard-constante del mapa (la constante que no puede ver el manifest) | módulo mínimo, chico |
| **La re-horneada del embebido del prestador** | GRATIS por definición: la build nueva embebe el bundle ACTUAL — muere el estado-fantasma del guard compilado (`build-s80-b19` lleva `MAPA_NATIVO_DISPONIBLE=false` embebido; el arranque sin red de un APK recién instalado hoy tapa el mapa) | 0 |
| **D-298 · LargeSecureStore** (endurecer la sesión, pre-soft-launch) | exige lib AES NATIVA — es exactamente carga de tren; si no sube acá, necesita OTRO tren antes del 1-oct | espera la decisión founder "cero librerías nuevas" |
| NO sube nada más | barrido del canon: mic (D-456) ya viajó · video ya viajó · mapas ya — cero deudas "espera build" restantes | — |

## 5 · EL TREN ARMADO (S81-A23 — decisión founder: SE REUSA el Firebase del legado)

**Lo que ya está EN EL ÁRBOL (commiteado, inerte hasta el build):**

- `expo-notifications@~57.0.7` instalado en AMBAS apps (nativo ⇒ solo
  vive en la build; ningún JS lo importa todavía — los OTA actuales no
  lo bundlean).
- El plugin `"expo-notifications"` en ambos `app.json`.
- `googleServicesFile` CONDICIONAL en ambos `app.config.ts` (lee
  `GOOGLE_SERVICES_JSON` del entorno — env var de ARCHIVO de EAS; sin
  la variable, la config queda byte-idéntica a la de hoy: cero riesgo
  para los OTA en curso).
- **Pasajero 1 — D-579, LA SONDA DEL MANIFEST:**
  `apps/prestador/modules/sonda-manifest/` (módulo Expo local, Kotlin:
  `PackageManager.getApplicationInfo(GET_META_DATA)`), PREPARADO-APAGADO
  patrón D-456: `requireOptionalNativeModule` → null honesto en APK
  pre-tren (L-187), CERO consumidores hasta la mesa post-tren.
  **DECLARADO: compila RECIÉN en el tren — Kotlin/gradle sin build
  local posible acá; si el build lo rebota, se baja del tren sin
  frenar a los demás (es pasajero, no locomotora).**
- **Pasajero 2 — el entierro del b19: GRATIS.** La build nueva del
  prestador embebe el bundle ACTUAL (flip true + filtro + voces) —
  muere el embebido con guard-false.
- **Pasajero 4 — EL TECLADO: `softwareKeyboardLayoutMode: "pan"` —
  CANDIDATO CONDICIONADO, NO firmado (corrección de mesa S81).**
  **Disparo: que el barrido de EvitaTeclado (la mitad OTA, de B — ya
  promovido a packages/ui) NO resuelva el síntoma EN DISPOSITIVO.**
  El porqué, con el literal del JSDoc de B (EvitaTeclado.tsx:9-13):
  *"el manifest trae `windowSoftInputMode="adjustResize"`, pero SDK 57
  fuerza EDGE-TO-EDGE en Android y ahí el sistema NO achica la ventana
  — adjustResize queda letra muerta"* — la MISMA suerte puede correr
  `"pan"`: **poner una línea de manifest que no gobierna es la clase
  de verificación decorativa que L-192 persigue.** Si el disparo suena,
  la línea se escribe EL DÍA DEL TREN y se gatea en dispositivo (una
  config de manifest también tiene que poder salir roja). *(Nota de
  historial: la línea llegó a escribirse en ambos app.json bajo una
  orden previa y se REVIRTIÓ con esta corrección — cero rastro en el
  árbol.)* Medición base: 31 pantallas con campos (8 cliente · 23
  prestador), cero config previa.
- **Pasajero 3 — D-298 LargeSecureStore: BANCO DE ESPERA.** Sigue
  condicionado a que el founder LEVANTE su "cero librerías nuevas"
  (lib AES nativa). Si lo levanta ANTES del build, se instala y sube;
  si no, espera otro tren. NO instalado.

**LO QUE NECESITO DEL FOUNDER — exacto, con su dónde (VERIFICADO
contra la doc vigente de Expo, docs.expo.dev/push-notifications/
fcm-credentials — 29-jul, no de memoria):**

0. **⚠️ CORRECCIÓN POR MEDICIÓN (S81-A25 — la premisa "se reusa el
   Firebase del legado" quedó FALSADA):** se buscó en LOS SEIS repos
   del ecosistema (e-petplace · admin · prestadores · v2 ·
   sistema-pruebas · supabase/): **CERO** google-services.json, CERO
   GoogleService-Info.plist, CERO firebase-messaging, CERO FIREBASE_*/
   FCM_* en env. Y el discriminador: "el admin v2 opera notificaciones"
   = un COMPOSITOR de campañas sobre tablas (`notificaciones`, 24 filas
   in-app) con canales declarados (push/email/whatsapp/in_app) — pero
   **`push_tokens` tiene 0 FILAS** y shape genérico sin proveedor: el
   push jamás existió del lado del dispositivo. **⇒ EL TREN NECESITA UN
   PROYECTO FIREBASE NUEVO** — es gratis y no toca nada del legado
   (que no tiene nada que tocar). Bonus heredable: `push_tokens` y el
   compositor del admin son chasis reutilizable (la tabla espera
   tokens; el motor OTA la llena).
1. **Crear el proyecto + los dos `google-services.json`**:
   `console.firebase.google.com` → **"Add project"** (nombre sugerido:
   `e-petplace`; Google Analytics: NO hace falta) → Create. Luego
   ⚙️ Project settings → General → "Your apps" → **Add app → Android**
   DOS veces: package `com.epetplace.prestador` y package
   `com.epetplace.cliente` → descargar el `google-services.json` de
   CADA una. (Una sola identidad de remitente para el ecosistema.)
2. **La credencial FCM V1** (la llave del servidor de push) — flujo
   LITERAL de la doc: mismo Project settings → **Service accounts →
   "Generate New Private Key" → "Generate Key"** → baja UN JSON (sirve
   para las dos apps; **este JSON SÍ es secreto: jamás al repo ni al
   chat**). Luego, POR CADA app desde su carpeta (`apps/prestador/` y
   `apps/cliente/`): `npx eas-cli credentials` → **Android →
   production → Google Service Account → "Manage your Google Service
   Account Key for Push Notifications (FCM V1)" → "Set up... → Upload
   a new service account key"** (EAS detecta el JSON local y pide
   confirmar). *(Alternativa navegador, literal de la doc: expo.dev →
   Project settings → Credentials → Android → Service Credentials →
   FCM V1 service account key → Add a service account key → Upload
   new key.)*
3. **Los `google-services.json` — la vía SIMPLE, sancionada por la
   doc:** *"contiene public-facing identifiers"* — PUEDE commitearse
   (el que es secreto es el private key del paso 2, no éste). Colocá
   cada uno en `apps/prestador/google-services.json` y
   `apps/cliente/google-services.json` y avisá: el día del tren Code
   fija `"googleServicesFile": "./google-services.json"` (mi
   app.config condicional ya cubre la alternativa por env de archivo
   si preferís no commitearlos — cualquiera de las dos vías sirve,
   UNA sola por app).

**Lo que queda para EL DÍA DEL TREN (Code, con veda):** fijar
`googleServicesFile: "./google-services.json"` en cada app (los json
YA están commiteados y verificados — cliente multi-app, prestador
single, proyecto `e-petplace-7854e`) → bump `version` (cliente
1.0.2→1.0.3 · prestador 1.0.3→1.0.4 — NO antes: el bump en main
envenena el runtime de los OTA en curso) → `eas build -p android
--profile preview` ×2 → **EL GUARD DURO: `node
scripts/verify-manifest-apk.mjs <apk> --app <app>`** (package +
geo.API_KEY + google_app_id + MESSAGING_EVENT; `exit != 0` = LA BUILD
NO SE DISTRIBUYE — prueba de fuego L-192 ya corrida en rojo) →
instalar → pie de Cuenta → primer OTA contra los runtimes nuevos.

## 4bis · LA VÍA DE ENVÍO — **PROPUESTA SIN FIRMA (el founder no la
eligió todavía; que nadie la dé por elegida)**

Medido contra la doc vigente (`sending-notifications-custom`,
literal: *"instead of uploading your FCM key to Expo, you would use
that key directly in your server"* · *"the expo-notifications API is
push-service agnostic"*), las DOS vías con su tradeoff:

- **(a) PROPUESTA — Edge Function contra la API HTTP v1 de FCM,
  directo:** el token nativo (`getDevicePushTokenAsync()`), el envío
  server-side (el patrón vivo de `estructurar-nota-clinica`), y **la
  llave FCM V1 como SECRET DE SUPABASE que el founder custodia —
  JAMÁS se sube a EAS**. Costo declarado: sin recibos/batching del
  servicio de Expo; APNs será pieza aparte cuando haya iOS (ya fuera
  de este tren).
- **(b) El push service de Expo:** ExpoPushToken unificado + recibos —
  a cambio de subir la llave a EAS credentials.

El único consumidor de EAS-credentials es la vía (b); el
`google-services.json` commiteado alcanza para TODO el lado nativo en
ambas vías. **La elección es firma del founder** — hasta entonces, el
motor OTA no se escribe contra ninguna de las dos.

## 4 · El orden propuesto del tren (para cuando la mesa lo dispare)

① El founder resuelve FCM (¿proyecto legado o nuevo? + los
`google-services.json`) — **es el único paso que Code no puede dar
solo** · ② install + plugins + bump en las dos apps (Code) · ③ builds
preview Android ×2 con el checklist D-574 POR MANIFEST · ④ instalar,
pie de Cuenta, doble reinicio · ⑤ primer OTA contra los runtimes
nuevos · ⑥ el motor (tablas+RPC+Edge) por OTA detrás, con su letra.
