# PEDIDO A LA PISTA C · LA PRUEBA DE CABLE DE LIVEKIT

> **De:** pista D · S106 tanda 1 · 25-ago-2026
> **Autocontenido (76b):** las versiones, la config, los permisos, cómo sacar
> los tokens y **el criterio de verde** están todos acá. No hay que abrir otro
> documento ni preguntarme nada para correr esto.
>
> 🔴 **El CP1 está firmado CONDICIONADO a esta prueba.** Si esto no da verde,
> LiveKit no queda — y **la escalera de caída la decide la mesa, no la pista.**
> Tu trabajo es producir el veredicto con su literal, no elegir el plan B.

---

## §1 · POR QUÉ ESTA PRUEBA EXISTE

Del turno ⓪, medido contra el registro npm:

- **Expo SDK 57 salió el 30-jun-2026. RN 0.86 salió el 9-jun-2026.**
- **`@livekit/react-native@2.12.0` se publicó el 23-jul-2026** → nació después
  de los dos. ✅
- 🔴 **Pero su plugin de Expo, `@livekit/react-native-expo-plugin@1.0.2`, es
  del 17-mar-2026** — *tres meses antes de que SDK 57 existiera*, y su peer
  dep dice `expo: "*"`, que **no verifica nada**.
- **Cero issues de SDK 57 reportadas** en el repo… lo que **no** es evidencia
  de compatibilidad.

> **Ningún SDK de video del mercado declara Expo 57.** Esta prueba no es
> desconfianza en LiveKit: es que **el dato no existe en ninguna parte y sólo
> una build lo produce.**

---

## §2 · LAS VERSIONES — exactas, con fecha de publicación

Medidas de `registry.npmjs.org` el **25-ago-2026**. **Pineá exacto, sin
caret**: si algo falla queremos saber qué versión falló.

| paquete | versión | publicado |
|---|---|---|
| `@livekit/react-native` | **2.12.0** | 2026-07-23 |
| `@livekit/react-native-webrtc` | **144.1.2** | 2026-07-23 |
| `livekit-client` | **2.22.0** | 2026-08-17 |
| `@livekit/react-native-expo-plugin` | **1.0.2** | 2026-03-17 ⚠️ |

**Los peer deps que el propio paquete declara** (o sea: estos cuatro van
juntos, no es elección mía):

```
@livekit/react-native@2.12.0 exige:
  @livekit/react-native-webrtc  ^144.1.2
  livekit-client                ^2.19.0
  react, react-native           *
```

```bash
pnpm add @livekit/react-native@2.12.0 \
         @livekit/react-native-webrtc@144.1.2 \
         livekit-client@2.22.0 \
  --filter @epetplace/cliente

pnpm add -D @livekit/react-native-expo-plugin@1.0.2 --filter @epetplace/cliente
```

⚠️ **`@livekit/react-native-webrtc` es un FORK** de `react-native-webrtc`, no
el paquete genérico. **No los mezcles**: si terminás con los dos instalados,
hay dos copias del módulo nativo de WebRTC y el síntoma no se parece en nada
a la causa.

---

## §3 · CONFIG — `app.config.ts` del cliente

El plugin es lo único que hay que agregar:

```ts
plugins: [
  // …lo que ya haya…
  ['@livekit/react-native-expo-plugin', {
    // pedirlo sólo si se va a usar; hoy NO se usa (la letra no menciona
    // compartir pantalla), y un permiso de más se nota en la ficha de la tienda
    enableScreenShareService: false,
  }],
],
```

Y en el arranque de la app, **una sola vez**, antes de cualquier uso:

```ts
import { registerGlobals } from '@livekit/react-native';
registerGlobals();
```

### Permisos que el plugin agrega en Android
De su README (el objeto):
`FOREGROUND_SERVICE` · `FOREGROUND_SERVICE_CAMERA` ·
`FOREGROUND_SERVICE_MICROPHONE` · `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.

Más los de siempre: **cámara y micrófono**, con su cadena de uso en iOS
(`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`).

🔴 **La cadena de iOS la lee una persona real** en el diálogo del sistema. Que
diga para qué, en la voz de la casa — no *«Esta app necesita acceso a la
cámara»*. Algo como *«Para tu videoconsulta con el veterinario.»*

### El tren de build
🔴 **Development build / EAS. Nada de esto corre en Expo Go** — lo dice
literal `react-native-webrtc`: *«As this module includes native code it is not
available in the Expo Go app by default.»*
⇒ **Coincide con `LETRA_TELEMEDICINA` §9: es módulo nativo y NO viaja por
OTA.** El tren lo decide la mesa.

**NO MEDIDO y sólo lo dice tu build:** `minSdkVersion` / target resultante,
**cuánto crece el APK**. Anotalos — completan una celda que dejé abierta.

---

## §4 · LOS TOKENS DE PRUEBA — no esperes a la edge

> ### ✅ LAS CLAVES YA ESTÁN — verificado contra el objeto, 26-ago-2026
> `npx supabase secrets list --project-ref zyltipqscdsdsxnjclhp` devuelve las
> tres con el **nombre exacto** que la edge lee, las tres selladas
> `2026-08-26T04:30:31Z`:
> **`LIVEKIT_API_KEY` · `LIVEKIT_API_SECRET` · `LIVEKIT_URL`.**
> *(Lo verifiqué en vez de creerlo: «están cargadas» es una declaración, y un
> nombre con un typo se ve idéntico a uno correcto hasta que la edge devuelve
> `video_sin_configurar`.)*

### 🔴 Pero los dos tokens NO los puedo generar yo, y es a propósito

`secrets list` devuelve **hashes, no valores** — que es exactamente lo que
tiene que hacer. **Yo no tengo las claves, y no debo tenerlas.** Pedirlas
para generarte dos tokens sería sacarlas del único lugar donde están seguras
y meterlas en un chat. *`D-712`: los artefactos de una auditoría son un vector
nuevo.*

**Las genera quien tiene las claves. Un solo comando, en la terminal del
founder** (o en la tuya, si él te las pasa por un canal que no sea texto
plano):

🔴 **OJO CON LA RUTA — el script NO está en `main`.** Vive en la rama
`pista/s106-d`. Corrido desde el repo primario el error es *«Cannot find
module»*, **que no dice «estás en la rama equivocada»**. La ruta que
funciona hoy:

```bash
cd /Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s106-d/supabase/functions/video-token

LIVEKIT_API_KEY='...' \
LIVEKIT_API_SECRET='...' \
LIVEKIT_URL='wss://...' \
  node generar-token-prueba.mjs
```

**Sin dependencias** — corre con el Node que haya, sin `pnpm install`.

**Si el gate se corre más tarde**, generarlos con más vida: agregar
`TTL_HORAS=3` adelante. **Por defecto duran 1 h.**
🔴 *Un token vencido se ve EXACTAMENTE igual que un cable roto: los dos dan
«no conecta», sin error distinguible en pantalla. La primera hipótesis va a
ser «LiveKit no anda» y va a ser falsa. Ante la duda se regeneran — cuestan
un comando.*

**Lo que sale de ahí sí puede viajar hacia vos**: la URL y dos tokens de
**una hora**, para una **sala de juguete**, sin acceso a ninguna cita ni a
ningún dato. *Un token de `cable-quito` no abre nada más que `cable-quito`.*

⚠️ **Aun así no los pegues en un commit.** Vencen en una hora, pero un
secreto en el historial de git no vence nunca.

---

**No hace falta `video-token` para probar el cable.** La herramienta es local
y no tiene dependencias:

```bash
cd supabase/functions/video-token

LIVEKIT_API_KEY='...' \
LIVEKIT_API_SECRET='...' \
LIVEKIT_URL='wss://...' \
  node generar-token-prueba.mjs
```

Imprime **la URL y dos tokens** (`Dispositivo A` y `Dispositivo B`), sala
**`cable-quito`**, **vida 1 hora**. Sin dependencias — corre con el Node que
tengas. *Ya lo corrí: produce JWTs bien formados.*

Las tres variables **te las da el founder** (§ pedido de alta). 🔴 **No las
pegues en un commit, ni en un reporte, ni en el chat.**

🔴 **La sala es FIJA (`cable-quito`) a propósito.** Dos dispositivos en salas
distintas se ven exactamente igual que un cable roto: cada uno solo, sin
error. *Antes de declarar rojo, verificá que los dos usaron la misma URL y la
misma sala.*

---

## ✅✅ VERDE — GATE DEL FOUNDER, 26-ago-2026

**Los cinco puntos pasaron, en dos dispositivos, con APK autónomos (preview
local, sha256 verificados), en la red real de Quito.**

| # | qué | |
|---|---|---|
| ① | compila e instala | ✅ en los dos teléfonos |
| ② | los dos entran a `cable-quito` | ✅ |
| ③ | **se ven en AMBOS sentidos** | ✅ *cada aparato vio la cámara del OTRO* |
| ④ | **se oyen en AMBOS sentidos** | ✅ |
| ⑤ | red real de Quito | ✅ |

🔴 **La forma del ③ es la que hace válido el verde:** *nadie se vio a sí mismo
y creyó que anduvo* — que era el modo de falla que esta spec nombró antes de
correr. **El criterio escrito de antemano hizo su trabajo.**

⇒ **LiveKit Cloud queda FIRMADO SIN CONDICIÓN.** La escalera de caída
(① plugin genérico de Expo · ② Agora) **se retira: ya no hay condición que la
dispare.**

**Observación del founder, menor y para tanda 2 — no defecto:** la pantalla
del cable no muestra preview propio. **No es transporte, es vista local**, y
esta pantalla existía para probar el cable, no para ser completa — es
literalmente lo que §7 de esta spec declaró (*«no es la pantalla de
teleconsulta; dos cuadritos alcanzan»*). **La in-call real de tanda 2 sí lo
lleva.**

---

## §5 · CRITERIO DE VERDE — escrito ANTES de correr *(cumplido; se conserva como registro)*

**Verde es TODO esto junto. Falta uno solo ⇒ rojo.**

| # | qué | cómo se verifica |
|---|---|---|
| ① | **La build compila** con Expo SDK 57 / RN 0.86 | `eas build` termina, APK instalable |
| ② | **Dos dispositivos entran a la sala** | ambos conectados a `cable-quito` |
| ③ | **Se VEN en ambos sentidos** | A ve el video de B **y** B ve el de A |
| ④ | **Se OYEN en ambos sentidos** | A escucha a B **y** B escucha a A |
| ⑤ | **En la red real de Quito** | red de todos los días, **no** una VPN ni el wifi de la oficina si no es el escenario real |

🔴 **«En ambos sentidos» no es formalismo.** Un SFU mal configurado deja pasar
un sentido y no el otro — el que publica se ve a sí mismo y cree que anduvo.
**Probalo con dos personas o con dos aparatos separados, jamás mirando una
sola pantalla.**

🔴 **Y ⑤ no se sustituye.** Todo el punto de esta prueba es Ecuador: **la
región/latencia para Ecuador quedó NO MEDIDA** en mi relevamiento (la doc de
LiveKit nombra un componente «Regions» sin listar geografías). *Un verde en
otra red no contesta la pregunta que la prueba vino a hacer.*

---

## §6 · SI DA ROJO — qué necesito de vos

**No elijas el plan B.** La mesa ya escribió la escalera:
① `@config-plugins/react-native-webrtc` (de Expo, `>=56`, publicado
15-ago-2026 — el único posterior a nuestra vara) con el SDK de LiveKit
encima · ② recién después Agora.

**Lo que sube a la mesa es el LITERAL del fallo:**

- **en qué punto** de los cinco cayó,
- **el mensaje de error textual** — de Gradle, de Xcode, del runtime o del log
  del dispositivo, **copiado, no parafraseado**,
- **qué versiones** quedaron instaladas de verdad (`pnpm why @livekit/react-native`),
- si fue de **build** o de **runtime** — *son dos escaleras distintas: un fallo
  de build lo cura el plugin genérico de ①; un fallo de medios en la red real
  no lo cura ningún plugin y salta directo a ②.*

> **Un rojo sin su literal obliga a repetir la prueba entera.** Es la
> diferencia entre «no anduvo» y un dato con el que la mesa puede decidir.

---

## §7 · LO QUE ESTA PRUEBA **NO** ES

- ❌ **No es la pantalla de teleconsulta.** No hay que diseñar nada: dos
  cuadritos de video alcanzan. *El diseño llega cuando el cable esté probado.*
- ❌ **No conecta con citas reales.** Sala fija, tokens de juguete, cero DB.
- ❌ **No prueba la autorización** — eso es `video-token` + la RPC de A, y va
  por otro carril.
- ❌ **No hay que grabar nada.** La letra **no menciona grabación** y el token
  de prueba trae `roomRecord: false` explícito.
