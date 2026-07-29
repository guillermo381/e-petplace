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

## 4 · El orden propuesto del tren (para cuando la mesa lo dispare)

① El founder resuelve FCM (¿proyecto legado o nuevo? + los
`google-services.json`) — **es el único paso que Code no puede dar
solo** · ② install + plugins + bump en las dos apps (Code) · ③ builds
preview Android ×2 con el checklist D-574 POR MANIFEST · ④ instalar,
pie de Cuenta, doble reinicio · ⑤ primer OTA contra los runtimes
nuevos · ⑥ el motor (tablas+RPC+Edge) por OTA detrás, con su letra.
