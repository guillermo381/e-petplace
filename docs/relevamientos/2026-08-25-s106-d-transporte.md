# S106-D · LA MEDICIÓN DEL TRANSPORTE DE VIDEO

> **Pista D · 25-ago-2026 · SIN CÓDIGO.** Esta es la tabla que la mesa
> necesita para decidir proveedor y tren de build **antes** de que nadie
> construya la pieza.
>
> **Yo no elijo.** Doy la tabla, una recomendación fundada y las preguntas
> abiertas. La firma es de la mesa.
>
> **Regla de esta medición:** cada celda dice **contra qué objeto se midió**.
> Lo que no alcancé dice **NO MEDIDO** — no hay una sola cifra inventada.
> *(Orden literal del founder: «no inventes precios».)*

---

## §0 · LA LÍNEA BASE — contra qué tiene que encajar

Medido de `apps/{cliente,prestador}/package.json` en `pista/s106-d`:

| | valor | publicado (registro npm) |
|---|---|---|
| Expo | **~57.0.4** | `expo@57.0.0` → **30-jun-2026** |
| React Native | **0.86.0** | **9-jun-2026** |
| React | **19.2.3** | — |
| Deno de las edge functions | **2** | `supabase/config.toml:383` |
| perfiles EAS | `development`, `preview` | `apps/cliente/eas.json` |

🔴 **Estas dos fechas son la vara de toda la tabla.** Un SDK publicado
**antes** del 30-jun-2026 nunca vio nuestro Expo; uno publicado antes del
9-jun-2026 nunca vio nuestro React Native. No prueba que rompa — prueba
que **nadie lo probó**.

---

## §1 · LA TABLA

Objetos usados: **`registry.npmjs.org`** (versión, fecha, peerDeps,
licencia) · **GitHub API** (stars, issues, último push, commits) ·
**`reactnative.directory/api`** (flag `newArchitecture`) · **páginas de
precio públicas del proveedor**.

### ① SDK cliente React Native — ¿existe, está vivo, y vio nuestro stack?

| Proveedor | paquete RN | versión | publicado | ¿post SDK-57? | peer `react-native` | objeto |
|---|---|---|---|---|---|---|
| **LiveKit** | `@livekit/react-native` | 2.12.0 | **23-jul-2026** | ✅ **sí** | `*` | npm |
| **Daily** | `@daily-co/react-native-daily-js` | 0.87.1 | **19-ago-2026** | ✅ sí | `>=0.68.0` | npm |
| **Agora** | `react-native-agora` | 4.6.2 | 5-mar-2026 | ❌ no (−117 d) | `*` | npm |
| **100ms** | `@100mslive/react-native-hms` | 1.12.3 | 22-jun-2026 | ❌ no (−8 d) | `>=0.77.3` | npm |
| **Stream** | `@stream-io/video-react-native-sdk` | 1.44.0 | **18-ago-2026** | ✅ sí | `>=0.73.0` | npm |
| **Vonage** | `opentok-react-native` | 2.33.3 | 7-ago-2026 | ✅ sí | `*` | npm |
| **Jitsi** | `@jitsi/react-native-sdk` | 13.1.1 | 30-jul-2026 | ✅ sí | 🔴 **`~0.85.0`** | npm |
| **Twilio** | `react-native-twilio-video-webrtc` | 3.2.1 | 🔴 **2-oct-2024** | ❌ no (−691 d) | — | npm |
| *(base)* | `react-native-webrtc` | 124.0.8 | 21-jul-2026 | ✅ sí | `>=0.60.0` | npm |

🔴 **Jitsi cae acá y no se levanta:** su peer dep es `react-native: ~0.85.0`
y `react: 19.2.3` **exactos**. Nosotros corremos **RN 0.86.0**. El `~` no
acepta 0.86. Además arrastra **~20 peer deps**, seis de ellas apuntando a
**forks de GitHub de Jitsi** (`react-native-background-timer`,
`react-native-sound`, `react-native-orientation-locker`,
`react-native-worklets-core`, …). *No es un SDK: es un stack entero que exige
ser el dueño del proyecto.*

🔴 **Twilio cae por el cliente, no por el producto** — ver §4.

### ② Qué exige de la build — el plugin de Expo es donde duele

| Proveedor | plugin de Expo | versión | publicado | peer `expo` declarado | veredicto |
|---|---|---|---|---|---|
| **LiveKit** | `@livekit/react-native-expo-plugin` | 1.0.2 | **17-mar-2026** | `*` | ⚠️ **quieto 3 meses antes de que SDK 57 existiera** |
| **Daily** | `@daily-co/config-plugin-rn-daily-js` | 0.0.12 | 6-abr-2026 | 🔴 **`^55.0.0`** | 🔴 **declara Expo 55 — dos majors atrás** |
| **Expo (oficial)** | `@config-plugins/react-native-webrtc` | 15.0.2 | **15-ago-2026** | ✅ **`>=56`** | ✅ **el único publicado post-SDK-57 que lo declara** |
| Agora / 100ms / Stream / Vonage | *sin plugin propio publicado* | — | — | — | NO MEDIDO / no aplica |

🔴 **El hallazgo de forma más importante de toda la medición:**
**ningún SDK de video declara Expo 57.** El único plugin del ecosistema
publicado *después* del 30-jun-2026 **y** que declara soportarlo es el de
**Expo mismo** (`github.com/expo/config-plugins`), y es para
`react-native-webrtc` genérico — no para ningún proveedor.

*Un peer dep `expo: "*"` (LiveKit) no dice «compatible»: dice «no verifico».
Un peer dep `expo: "^55.0.0"` (Daily) sí dice algo, y lo que dice es que no.*

**Los tres exigen lo mismo del build**, y es sabido y no negociable:
**development build / EAS — nada de esto corre en Expo Go.**
`react-native-webrtc` lo dice literal: *«As this module includes native code
it is not available in the Expo Go app by default.»*
⇒ **coincide con `LETRA_TELEMEDICINA` §9: es módulo nativo y no viaja por OTA.**

**Permisos que pide LiveKit en Android** (de su README, el objeto):
`FOREGROUND_SERVICE` · `FOREGROUND_SERVICE_CAMERA` ·
`FOREGROUND_SERVICE_MICROPHONE` · `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.
**minSdk / target / tamaño del binario: NO MEDIDO** — sólo lo cierra una build.

### ③ New Architecture — la pregunta que RN 0.86 vuelve obligatoria

| Proveedor | `codegenConfig` en npm | RN Directory `newArchitecture` |
|---|---|---|
| LiveKit | no | ✅ **`true`** |
| Agora | ✅ **sí (`all`)** | NO MEDIDO (`undefined`) |
| Vonage (`opentok-react-native`) | ✅ sí (`all`) | (no está en el directorio) |
| Daily / 100ms / Stream / Jitsi / `react-native-webrtc` | no | NO MEDIDO / no listados |

⚠️ **Freno declarado sobre mi propia medición:** `codegenConfig` mide *«tiene
módulos generados por codegen»*, **no** *«soporta New Architecture»* — un
módulo legacy corre bajo new arch por el **interop layer**. **Un marcador
ausente no prueba ausencia.** Por eso la columna de la derecha existe, y por
eso las celdas vacías dicen NO MEDIDO en vez de ❌.

**Lo único afirmable con objeto:** LiveKit es el **único** del set con
`newArchitecture: true` medido por el directorio.

### ④ Token server-side DESDE DENO — mi territorio, y es decisivo

| Proveedor | paquete server | módulo | dependencias | ¿corre limpio en Deno? |
|---|---|---|---|---|
| **LiveKit** | `livekit-server-sdk@2.18.0` | ✅ **ESM (`type: module`)** | `jose`, `@livekit/protocol`, `@bufbuild/protobuf` | ✅ **sí — `jose` es Web Crypto** |
| Agora | `agora-token@2.0.5` | CJS | `crc-32`, `cuint`, `md5` | ⚠️ vía `npm:`; sin publicar **453 d** |
| 100ms | `@100mslive/server-sdk@0.3.0` | CJS | `axios`, `jsonwebtoken` | ⚠️ compat Node; **sin publicar 1196 d** |
| Stream | `@stream-io/node-sdk@0.8.3` | CJS | `jsonwebtoken` | ⚠️ `engines: node>=22.12` |
| Twilio | `twilio@6.1.0` | CJS | `axios`, `jsonwebtoken`, `https-proxy-agent` | ⚠️ pesado para edge |
| Vonage | `@vonage/video@1.30.0` | CJS | cadena `@vonage/*` | ⚠️ `engines: node>=22` |

🟢 **Y el piso que aplica a TODOS:** el token de los siete es **un JWT**. Se
puede firmar con **Web Crypto puro + REST**, sin SDK, exactamente como
`pagos-tarjetas` ya firma su `authToken` de Nuvei hoy
(`crypto.subtle.digest`). **Ningún proveedor queda bloqueado por esto.**
Lo que la tabla mide es **fricción**, no imposibilidad — y LiveKit es el
único sin fricción alguna.

### ⑤ Costo — sólo lo que la doc pública dio

Unidad de comparación que armé para que la mesa lea algo útil:
**una teleconsulta = 20 min × 2 participantes = 40 participante-minutos.**

| Proveedor | free tier / mes | ≈ consultas gratis | precio post-free | base mensual | objeto |
|---|---|---|---|---|---|
| **LiveKit Cloud** | **5.000** WebRTC min + 50 GB ⚠️ | **≈ 125** | $0,0005/min → **$0,02/consulta** ⚠️ | $0 (Build) · **desde $50 (Ship)** | livekit.com/pricing + panel ⚠️ |
| **Daily** | **10.000** part-min | **≈ 250** | $0,0040/min → **$0,16/consulta** | **$0** | daily.co/pricing/video-sdk |
| **Agora** | **10.000** RTC min | **≈ 250** | $0,00059/min → **$0,024/consulta** | **$0** | agora.io/en/pricing |
| **100ms** | **10.000** min | **≈ 250** | $0,004/min → **$0,16/consulta** | $0 | 100ms.live/pricing |
| **Stream** | $100 en créditos | NO MEDIDO (video) | $0,30/1000 part-min *(audio only)* | — | getstream.io/video/pricing |
| **Twilio** | crédito de prueba, **monto NO MEDIDO** | — | $0,004/min → **$0,16/consulta** | $0 | twilio.com/en-us/video/pricing |
| **Vonage** | **NO MEDIDO** | — | **NO MEDIDO** | — | 🔴 **HTTP 403** |
| **LiveKit self-host** | infra propia | — | costo de servidor | — | Apache-2.0 |
| **Jitsi self-host** | infra propia | — | costo de servidor | — | Apache-2.0 |

### ⚠️ LA CELDA DE LIVEKIT, CERRADA — *(medición del founder en el panel real, 26-ago-2026)*

**Se midió con la cuenta creada, y el resultado es PARCIAL. Se cierra así, no
mejor de lo que es:**

| dato | estado | fuente |
|---|---|---|
| plan actual = **Build**, $0, sin tarjeta | ✅ **verificado en el panel** | objeto |
| Ship = **«STARTING AT $50/mo»** | ✅ **verificado en el panel** | objeto |
| **5.000 min incluidos** (Build) | 🔴 **PÚBLICO, no verificado en panel** | `livekit.com/pricing` |
| **$0,0005/min de excedente** | 🔴 **PÚBLICO, no verificado en panel** | `livekit.com/pricing` |

🔴 **Por qué no se pudo cerrar mejor, y es un hallazgo, no una excusa:** el
comparador del panel **no muestra minutos incluidos ni precio de excedente en
ningún plan** — compara *features*, y su vocabulario está volcado a **agentes
de voz** (inference credits, custom voices, telephony). **Los dos números que
deciden cuándo esto deja de ser gratis no están en el panel.**

🔴 **Y «STARTING AT» no es «$50».** Es un **piso**, no un precio cerrado. *Un
número con «desde» adelante no se puede meter en un presupuesto: dice que no
va a costar menos, y no dice cuánto va a costar.* Cualquier cuenta que use
esa cifra tiene que decir que es piso.

**⏰ DISPARO DE RE-MEDICIÓN, con número y no con adjetivo:** el panel **sí
muestra uso**. *(Firma del founder: «cuando el consumo real se acerque a los
5.000 min/mes».)* ⇒ **se mira el panel al llegar a ~3.000 min/mes (60 % del
tope público)**, no a 5.000.
*Preguntar el precio del excedente el día que se cruza el límite es
preguntarlo tarde: para entonces ya se está pagando. El margen de 2.000
minutos es el tiempo de decidir sin apuro.*

---

🔴 **Dos lecturas opuestas del mismo cuadro, y las dos importan:**
- **LiveKit tiene el free tier MÁS CHICO del set** (5.000 vs 10.000): la mitad
  de consultas gratis. **Es su peor número.**
- **LiveKit y Agora son ~7× más baratos por minuto** que Daily / 100ms /
  Twilio ($0,02 vs $0,16 por consulta).

*Puesto en plata del negocio:* con comisión del 10 % (`LETRA_TELEMEDICINA`
§2), una consulta de $20 nos deja **$2,00**. El transporte se lleva **$0,16
(8 %)** con Daily/100ms/Twilio y **$0,02 (1 %)** con LiveKit/Agora. **No es
decorativo: es 8 % de la comisión del quinto oficio.**

### ⑥ TURN

| | TURN | objeto |
|---|---|---|
| **LiveKit self-host** | ✅ **TURN embebido en el servidor** | `config-sample.yaml`: *«This isn't necessary if using embedded TURN server»* |
| LiveKit Cloud / Daily / Agora / 100ms / Stream / Twilio / Vonage | **NO MEDIDO explícitamente** — es parte del servicio SFU gestionado, pero **no lo verifiqué en doc** | — |
| **Jitsi self-host** | ⚠️ **coturn aparte** — es infraestructura propia a montar | — |

### ⑦ Región / latencia para Ecuador

🔴 **NO MEDIDO, para ningún proveedor.** La doc de arquitectura de LiveKit
Cloud nombra un componente «Regions» *(«Configure and manage regional
traffic… for improved latency»)* **sin listar geografías**; la de Daily
devolvió **404**.

**Esto no se cierra leyendo: se cierra midiendo desde Ecuador.** Es una
pregunta a la mesa (§5), no un dato que yo pueda completar.

### ⑧ Riesgo — madurez, EOL, dependencia de una sola empresa

| Proveedor | repo | stars | issues abiertas | último push | licencia | riesgo |
|---|---|---|---|---|---|---|
| **LiveKit (cliente)** | `livekit/client-sdk-react-native` | 286 | 37 | **24-ago-2026** | **Apache-2.0** | 🟢 |
| **LiveKit (servidor)** | `livekit/livekit` | **20.519** | 188 | **25-ago-2026** | **Apache-2.0** | 🟢 **self-hosteable** |
| Daily | `daily-co/react-native-daily-js` | 46 | 10 | 19-ago-2026 | BSD-2 | 🟡 plugin atrasado |
| Agora | `AgoraIO-Extensions/react-native-agora` | 653 | 15 | 19-ago-2026 | MIT | 🟡 **sin self-host: lock-in total** |
| 100ms | `100mslive/100ms-react-native` | 99 | 2 | 11-ago-2026 | MIT | 🔴 **server SDK sin publicar 1196 d** |
| Stream | `GetStream/stream-video-js` | 123 | 16 | 25-ago-2026 | NOASSERTION | 🟡 ver §4 |
| **Vonage** | `Vonage/vonage-video-react-native-sdk` | 🔴 **3** | 🔴 **81** | 25-ago-2026 | Apache-2.0 *(client SDK: propietaria)* | 🔴 |
| Jitsi | `jitsi/jitsi-meet` | 29.808 | 146 | 25-ago-2026 | Apache-2.0 | 🔴 **incompatible por pin** |
| Twilio | `blackuy/react-native-twilio-video-webrtc` | 629 | 🔴 **237** | 30-ene-2026 | MIT | 🔴 **wrapper de comunidad** |

### ⚠️ SEÑAL DE PRODUCTO — la trajo la medición del panel, y no la estaba buscando

**El panel de LiveKit tiene su vocabulario volcado a agentes de voz**
(inference credits, custom voices, telephony) — y su propia página de precios
lidera con *«agent session minutes»*, dejando *«WebRTC minutes»* como una
línea más abajo.

> **LiveKit está comunicando que su producto es infraestructura para agentes
> de IA por voz.** El WebRTC de dos personas hablando —que es lo único que
> nosotros usamos— **sigue existiendo, pero dejó de ser el titular.**

🔴 **Por qué se anota:** *el mercado ya nos mostró un EOL de video* (Twilio,
§2). Cuando la comunicación de un proveedor se corre de tu caso de uso, es
la primera señal — mucho antes que un anuncio.

✅ **Y por qué NO cambia la recomendación, que es lo justo de decir:** esto es
**exactamente lo que la razón ④ de §3 ya cubría**. El servidor de LiveKit es
**Apache-2.0, self-hosteable y con TURN embebido**. *Si mañana LiveKit
Cloud se vuelve una plataforma de agentes y nuestro caso queda de segunda,
nos vamos a self-host con el mismo código de cliente.* **Ningún otro
candidato del set ofrece esa salida** — y es la diferencia entre una señal
que se anota y una que asusta.

⇒ **Se registra como observación, no como bandera roja.** Se vuelve a mirar
en la misma pasada del disparo de ⑤.

---

## §2 · EL ESTADO REAL DE TWILIO — verificado, porque el prompt lo pidió

**El EOL fue revertido y el producto está vivo.** Fuente primaria:
changelog de Twilio, **21-oct-2024**, título literal *«Twilio Video Will
Remain a Standalone Product»*:

> *«Current Twilio Video customers can continue to use Video as they always
> have; there's no action or change needed.»*
> *«New Twilio Video customers can get started by reviewing our Video
> developer docs.»*

Cronología medida: EOL anunciado a fines de 2023 (corte 5-dic-2024) →
extendido a 5-dic-2026 en marzo 2024 → **revertido el 21-oct-2024**.
`twilio-video@2.35.0` **no está marcado `deprecated` en npm** y se publicó el
29-abr-2026.

🔴 **Y sin embargo Twilio se descarta — por el cliente, no por el producto.**
**Twilio no publica un SDK de React Native para Video.** El único camino es
`react-native-twilio-video-webrtc`, de comunidad (`blackuy`), **sin publicar
en npm hace 691 días** y con **237 issues abiertas**.

> *Un proveedor que revive su producto pero no mantiene el único puente hacia
> tu plataforma te dejó exactamente donde estabas.*

---

## §3 · LA RECOMENDACIÓN — **LiveKit Cloud**, con self-host como salida

**Recomiendo LiveKit Cloud.** Cinco razones, todas con objeto:

1. **Es el único cuyo SDK RN y su fork de WebRTC se publicaron DESPUÉS de
   RN 0.86 y de Expo SDK 57** — ambos el **23-jul-2026**, contra el
   9-jun y el 30-jun. *Nadie declara SDK 57; LiveKit es el que al menos
   nació después de que existiera.*
2. **`livekit-server-sdk` es ESM puro con `jose`** — la única cadena que
   corre nativa en Deno 2 sin compat de Node. Todos los demás usan
   `jsonwebtoken` + `axios`. **Esto es mi territorio y es donde vive el
   token.**
3. **Único con `newArchitecture: true` medido** — y RN 0.86 lo vuelve
   obligatorio.
4. 🔴 **Apache-2.0 en cliente Y servidor, con TURN embebido y self-host
   real** (20.519 stars, push del día de la medición). **La salida de
   emergencia existe y no obliga a reescribir el cliente.**
   *Esto es lo que más pesa después de §2: el mercado ya vio a un proveedor
   grande anunciar el EOL de su video. Con LiveKit ese anuncio no nos deja a
   pie — cambiamos de cloud a self-host con el mismo código.*
5. Cliente y servidor de la **misma casa**, los dos vivos.

**Su peor número, dicho sin maquillar:** **el free tier más chico del set**
(5.000 min = ~125 consultas/mes, la mitad de Daily/Agora/100ms), y salta a
**$50/mes fijo** cuando se pasa, mientras los otros son pay-as-you-go sin
base.

⚠️ **Y el riesgo que la recomendación NO cierra:** el **config plugin de Expo
de LiveKit no se toca desde el 17-mar-2026 — tres meses antes de que SDK 57
existiera.** No hay issues reportadas de SDK 57 en ningún repo del set, pero
**ausencia de reportes no es evidencia de compatibilidad**. El plugin es
config declarativa (permisos, flags), así que el riesgo es acotado — **pero
sólo una build de prueba lo cierra, y esa build es un acto de la mesa.**

**Segundo lugar real: Agora.** El precio más bajo, free tier doble,
`codegenConfig` presente. Cae al segundo puesto por: **sin self-host
(lock-in total)**, `react-native-agora` sin publicar hace 173 días y
`agora-token` hace 453. *Si la mesa prioriza costo sobre soberanía, Agora es
la elección honesta y hay que decirlo.*

---

## §4 · DESCARTES, CADA UNO CON SU MEDICIÓN

| | por qué cae | objeto |
|---|---|---|
| **Jitsi** | peer `react-native: ~0.85.0` exacto vs nuestro **0.86.0** + ~20 peer deps con forks de git | npm |
| **Twilio** | producto vivo, **pero sin SDK RN oficial**; wrapper de comunidad muerto hace 691 d, 237 issues | npm + GitHub |
| **Vonage** | **3 stars / 81 issues** en su repo RN; client SDK con licencia propietaria; **pricing 403** | GitHub + npm |
| **Stream** | peerDeps exigen 🔴 **`@react-native-firebase/app` + `messaging`** — corremos `expo-notifications`, no RN Firebase. **Arrastra migrar el stack de push entero** | npm |
| **100ms** | RN SDK sano, pero **server SDK sin publicar hace 1196 días (3+ años)** | npm |
| **Daily** | SDK muy vivo (19-ago), pero su config plugin **declara `expo: ^55.0.0`** | npm |

*Daily es el descarte más recuperable del set: si publica un plugin que
declare 57, vuelve a la mesa con buenos números.*

---

## §5 · PREGUNTAS ABIERTAS — las decide la mesa, no yo

1. 🔴 **¿Cuántas teleconsultas/mes espera el soft launch?** Es **la** variable
   que da vuelta la tabla de costo: bajo 125/mes, LiveKit Build es gratis;
   entre 125 y 250, Agora/Daily siguen gratis y LiveKit cuesta $50.
2. 🔴 **¿Hay requisito de residencia de datos o privacidad clínica** que
   excluya proveedores por jurisdicción? Afecta a Agora en particular, y a
   todo cloud en general. *La teleconsulta deposita en la historia clínica
   (`LETRA_TELEMEDICINA` §7) — el video no se graba en v1, pero el audio y
   la imagen atraviesan al proveedor.*
3. 🔴 **Región / latencia para Ecuador: NO MEDIDO.** Sólo se cierra probando.
4. **¿La mesa paga la build de prueba** LiveKit + Expo 57? Es lo único que
   cierra el riesgo del plugin — y §9 de la letra dice que **el tren de build
   lo decide la mesa**.
5. **¿Se graba la teleconsulta?** La letra **no lo menciona**. Si algún día
   sí: cambia costo (recording se cobra aparte en los cinco proveedores) y
   cambia lo legal. **Lo declaro como pregunta, no como supuesto.**
6. **Vonage quedó sin precio (403).** ¿Se descarta por lo demás — 3 stars,
   81 issues — o alguien pide la tarifa?

---

## §6 · D-M2 · EL MOLDE DE UNA EDGE FUNCTION NUEVA

Medido del repo, no recordado.

- **Dónde viviría:** `supabase/functions/video-token/index.ts`. Hoy hay
  **32 functions**; el molde más cercano es **`pagos-tarjetas`**.
- **Runtime:** Deno **2** (`supabase/config.toml:383`).
- **Secretos: `Deno.env.get('NOMBRE')`**, cargados con `supabase secrets set`.
  Censado en las 32 functions: 25 usan `SUPABASE_SERVICE_ROLE_KEY`, 8
  `NUVEI_APP_KEY_SERVER`, 4 `DEUNA_API_SECRET`… **Serían
  `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` + `LIVEKIT_URL`.**
- ⚠️ **El `vault` de `L-408` NO aplica acá.** Ese patrón resolvió otra cosa:
  el secreto que **`pg_cron` necesita** para llamar a una edge desde la DB
  (y fue al vault porque `app_config` lo leen los admin). **Una edge function
  llamada por la app lee su secreto de `Deno.env`.** *Lo aclaro porque el
  paso ⓪ me mandó a leer L-408 y aplicarla acá sería copiar un patrón a un
  problema que no tiene.*
- **Gate de sesión:** `_shared/sesion.ts` → `exigirSesion(req)` exige
  `role: authenticated` (`anon` **no** pasa: es la clave del bundle — D-714).
- **Verificación:** `node scripts/verify-edge-deno.mjs`, con sus **dos
  condiciones medidas en S103**: 🔴 **sobre copia en directorio aislado FUERA
  del repo** (dentro, `deno` **escribe** una clave `workspaces` en
  `package.json`) y **nunca en pre-commit** (~1 min por corrida).
- **Deploy:** `--use-api` (sin Docker), el patrón de S92-BIS.

## §7 · D-M3 · LA SEGURIDAD DEL TOKEN — diseño mínimo, NO construido

**El principio:** el token de video es la llave de una sala donde dos
personas hablan de la salud de un animal. **Se emite por cita, para una
persona, en una ventana.**

**① El uid jamás viene del cliente.** Molde literal de `pagos-tarjetas`:

```
Authorization: Bearer  →  createClient(URL, ANON, {headers})  →  getUser()  →  userId
```
Y con su distinción, que copio tal cual: **`sesion_no_verificable` (503) no es
`sin_sesion` (401)** — *tratarlas igual esconde una caída del proveedor de
auth detrás de un 401 del usuario.*

**② El veredicto lo da la DB, no la edge.** Los helpers **ya existen**
(medidos contra la DB viva, `pg_proc`):

| helper | firma | seg |
|---|---|---|
| `_user_es_familia_de_mascota` | `(p_mascota_id uuid, p_user_id uuid) → boolean` | DEFINER |
| `empleado_tiene_capacidad_clinica` | `(p_prestador_id uuid, p_user_id uuid) → boolean` | DEFINER |

⇒ **Propongo UNA RPC** —`puede_entrar_a_videollamada(p_cita_id, p_user_id)`—
que devuelva `{ puede, rol, sala, motivo }` leyendo de
`evento_cita_servicio` (columnas medidas: `mascota_id`, `prestador_id`,
`empleado_id`, `user_id`, `fecha`, `hora`, `duracion_minutos`, `estado`,
`estado_reserva`, `tipo_servicio`) y aplicando:

- **dueño** ⟸ `_user_es_familia_de_mascota(cita.mascota_id, uid)`
- **profesional** ⟸ `empleado_tiene_capacidad_clinica(cita.prestador_id, uid)`
  **y**, si `cita.empleado_id` no es nulo, que sea **esa** persona.
- **la cita está pagada** (`estado_reserva`), **no cancelada**, y es
  **teleconsulta** — *un token para una cita presencial no debería existir.*

🔴 **Por qué la RPC y no lógica en la edge:** el veredicto vive donde ya viven
los helpers y la RLS. **Lección S103, aplicada:** *el veredicto de
autenticación jamás vive en un campo de log* — y agrego su hermana: **tampoco
vive repartido entre dos lugares que pueden divergir.** Si mañana nace un
sexto rol, se enmienda **una** función.

**③ La ventana temporal.** Propuesta a firmar, **no decidida por mí**:
`[hora − 15 min, hora + duracion_minutos + 15 min]`. Fuera de ventana el
token no se emite, con código hablado (`fuera_de_ventana`), **jamás con un
genérico**.

⚠️ **Y el borde que la letra crea:** `LETRA_TELEMEDICINA` §4 dice que la
consulta **se cobra aunque el dueño no asista** y **aunque dure veinte
segundos**. ⇒ **el token del veterinario tiene que emitirse aunque el dueño
nunca entre.** *La ventana no puede exigir que haya dos.*

**④ TTL corto y sin renovación silenciosa** — el token dura la ventana, no el
día.

---

## §8 · LO QUE ESTA MEDICIÓN **NO** HIZO

Declarado para que nadie lo dé por hecho:

- ❌ **Ninguna cuenta creada, ninguna key pedida.** El alta del proveedor es
  acto del founder **después** de la firma (§9).
- ❌ **Cero código.** No existe `video-token`.
- ❌ **Ninguna build de prueba** — y es justo lo que cerraría el riesgo del
  plugin.
- ❌ **Regiones/latencia Ecuador**, **precio de Vonage**, **minSdk/target/peso
  del binario**, **TURN de los cloud**: NO MEDIDO.
- ⚠️ **Los minutos incluidos y el excedente de LiveKit siguen siendo PÚBLICO,
  no del objeto** — se intentó contra la cuenta real y **el panel no los
  expone** (§1⑤). *El intento no convierte una celda en verificada.*
- ❌ **No toqué nada de S105**: ni `pagos-*`, ni el deploy de `pagos-web`, ni
  el guard del IVA, ni la puerta de retomar.

---

## §9 · PEDIDO AUTOCONTENIDO AL FOUNDER — *sólo si la mesa firma LiveKit*

> Crear cuenta en **livekit.io** (plan **Build**, gratis, sin tarjeta) y
> generar un **API Key + Secret** de proyecto. Hacen falta **tres valores**:
> `LIVEKIT_URL` (`wss://<proyecto>.livekit.cloud`), `LIVEKIT_API_KEY`,
> `LIVEKIT_API_SECRET`.
>
> 🔴 **El secreto NO va al chat, ni a un reporte, ni al repo.** Va directo con
> `npx supabase secrets set` o por el panel de Supabase. *Precedente medido:
> `D-712` — los artefactos de una auditoría son un vector nuevo.*
