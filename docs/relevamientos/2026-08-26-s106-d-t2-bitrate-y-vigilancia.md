# S106-D TANDA 2 · EL BITRATE, LA VIGILANCIA Y EL CIERRE DE LA TABLA

> **Pista D · 26-ago-2026.** Actos 3, 4 y 5 del mandato.
> **Todo medido contra el objeto** — los tarballs publicados de
> `livekit-client@2.22.0`, `livekit-server-sdk@2.18.0` y
> `@livekit/protocol@1.50.4`, no contra documentación.

---

# ACTO 3 · EL BITRATE — dónde vive la palanca

## §1 · 🔴 EL HALLAZGO QUE CORRIGE CÓMO VENÍAMOS HABLANDO DE ESTO

**El bitrate NO se puede fijar desde el servidor, ni por el token, ni por
configuración de sala.** Medido:

| dónde busqué | qué encontré |
|---|---|
| `AccessToken` / `VideoGrant` | **ningún campo de bitrate ni de calidad** |
| `RoomConfiguration` *(lo que el token puede fijar de la sala)* | `name` · `emptyTimeout` · `departureTimeout` · `maxParticipants` · `metadata` · `egress` — **ninguno de bitrate** |
| `livekit.VideoLayer` en el protocolo | tiene `bitrate`, pero su propio comentario dice ***«target bitrate… server will measure actual»*** ⇒ **lo DECLARA el publicador; el servidor lo MIDE** |

> ### **La palanca es del CLIENTE, no del servidor.**
> *Veníamos hablando de «configurar el bitrate» como si fuera una perilla
> nuestra del lado servidor. No existe. La decide quien publica el video.*

## §2 · ✅ Y LA BUENA NOTICIA, QUE ES LA QUE IMPORTA PARA EL TREN

Las opciones que la deciden son **JavaScript del cliente**
(`TrackPublishDefaults.videoEncoding`, `videoCodec`, `RoomOptions`), **no
código nativo**:

> ### 🟢 **El bitrate VIAJA POR OTA.** No necesita build nueva.
> *A diferencia del transporte —que es nativo y por eso tuvo su gate de
> cable—, esta palanca se mueve con un update de JS. **Se puede calibrar
> después del soft launch, viendo consumo real, sin pedirle a nadie que
> reinstale nada.*** Eso cambia cuándo hay que decidirlo: **no es una
> decisión de arquitectura, es una perilla.**

## §3 · LOS NÚMEROS — presets reales del SDK, y qué significan en GB

Medidos del objeto (`VideoPresets` en `livekit-client@2.22.0`), y llevados a
nuestra unidad: **1 teleconsulta = 20 min × 2 participantes**, downstream
(cada uno recibe al otro).

| preset | resolución | bitrate | GB/consulta | **consultas en los 50 GB gratis** | $/consulta¹ |
|---|---|---|---|---|---|
| `h360` | 640×360 | 450 kbps | **0,135** | **≈ 370** | $0,036 |
| `h540` | 960×540 | 800 kbps | **0,24** | **≈ 208** | $0,049 |
| **`h720`** | 1280×720 | 1,7 Mbps | **0,51** | **≈ 98** | $0,081 |
| `h1080` | 1920×1080 | 3 Mbps | **0,90** | **≈ 55** | $0,128 |

¹ *minutos ($0,02) + GB a $0,12, post free tier.*

✅ **Esto valida la estimación anterior sin haberla usado:** yo había calculado
**0,45–1 GB por consulta** partiendo de los 1,5 Mbps de §6. Los presets reales
ponen ese rango entre **h720 y h1080** — o sea que la cuenta anterior estaba
bien, y ahora tiene nombre.

> ### 🔴 **Bajar de `h720` a `h540` MÁS QUE DOBLA el plan gratis: de ≈98 a ≈208 consultas.** Y a `h360`, casi lo cuadruplica.
> *Es la palanca más grande que tenemos sobre el eje que corta primero, y no
> cuesta una línea de infraestructura.*

## §4 · DOS PALANCAS MÁS QUE NO CUESTAN CALIDAD PERCIBIDA

Medidas en `RoomOptions` — **también cliente, también OTA**:

- **`adaptiveStream`** — ajusta lo que se RECIBE al tamaño real en pantalla.
  🔴 *En una in-call con el vet en grande y el dueño en un thumbnail, el
  thumbnail no necesita 720p.* **Baja GB sin que nadie vea peor**, porque
  ajusta a lo que ya se estaba mostrando chico.
- **`dynacast`** — deja de publicar capas que nadie consume.

> **Estas dos son gratis en calidad y por eso van antes que tocar el preset.**
> *La primera pregunta no es «cuánta calidad sacrificamos», es «cuántos bytes
> estamos mandando que nadie mira».*

## §5 · LO QUE **NO** PROPONGO, Y POR QUÉ

**No propongo un número.** Y la razón es la corrección que la mesa ya me hizo:

> `LETRA_TELEMEDICINA` §6 declara 1,5 Mbps como **requisito de la CONEXIÓN del
> profesional**, no como **promesa de calidad del STREAM** — *pedir mejor
> conexión que la que se usa es margen*. ⇒ **bajar el preset no toca la
> letra.**
>
> **Lo que sí es firma del founder es el piso de calidad visual, y se decide
> viendo un animal en pantalla, no en una tabla.**

⇒ **Mi entrega es la tabla y las palancas; el número lo pone el ojo.**
*Un preset elegido por su columna de GB puede dejar una lesión de piel
imposible de evaluar, y eso no aparece en ninguna de estas cuentas.*

**Recomendación de método, no de valor:** encender `adaptiveStream` y
`dynacast` primero —que no cuestan nada visualmente— y recién después probar
`h540` contra `h720` **con un animal real en pantalla**.

---

# ACTO 4 · EL DISPARO DE VIGILANCIA

**Firmado:** *se mira el panel a **~30 GB/mes** (60 % de los 50 GB), **no** a
3.000 minutos.* **Vigilar el eje que no corta primero es no vigilar nada.**

| | |
|---|---|
| **qué se mira** | «Media transport → Downstream data transfer» en el panel de LiveKit |
| **umbral** | **30 GB/mes** |
| **por qué 30 y no 50** | *preguntar el precio del excedente el día que se cruza el límite es preguntarlo tarde: para entonces ya se está pagando.* Los 20 GB de margen son el tiempo de decidir sin apuro |
| **responsable** | 🔴 **el founder** — es el único con acceso al panel de billing |
| **cadencia** | mensual, y **antes** de cualquier campaña que empuje volumen |
| **qué hacer al cruzarlo** | ① encender `adaptiveStream`/`dynacast` si no lo están · ② evaluar `h540` con el ojo · ③ recién entonces, plan pago |

## ⚠️ LA DEBILIDAD DE ESTE DISPARO, DECLARADA

> **Es un acto humano y no tiene alarma.** Depende de que alguien se acuerde
> de abrir un panel. *Una vigilancia que depende de la memoria de una persona
> ocupada no es una vigilancia: es una intención.*

### ✅ MEDIDO (encargo del founder): ¿LiveKit expone el consumo por API?

**Sí existe. NO la tenemos.**

| | |
|---|---|
| **cómo se llama** | **Analytics API** |
| **endpoints** | `GET /api/project/{PROJECT_ID}/sessions` · `…/sessions/{SESSION_ID}`, en `https://cloud-api.livekit.io`, con Bearer |
| **qué reporta** | **`bandwidth` facturable**, connection minutes, bitrate por track — *exactamente lo que necesitamos* |
| 🔴 **quién puede usarla** | literal de la doc: ***«Analytics API is only available to LiveKit Cloud customers with a Scale plan or higher»*** |

**Scale cuesta $500/mes. Nosotros estamos en Build ($0).**

> ### 🔴 Y ahí está la ironía, que es el hallazgo y no una queja:
> **el instrumento que nos diría cuándo hay que empezar a pagar $50 sólo se
> compra en el plan de $500.** *El dato para decidir si conviene subir de plan
> está detrás de subir dos planes.*

⇒ **El cron que avise solo NO se puede construir contra LiveKit.**
**La debilidad de §anterior queda declarada y aceptada como está**, según la
instrucción del founder.

### 🔧 PERO HAY UNA TERCERA VÍA, y la propongo porque la medición la habilita

**Podemos estimar el consumo NOSOTROS, con datos que ya vamos a tener.**

El webhook de esta misma tanda (`video-webhook`) entrega
`participant_joined` · `participant_left` · `room_finished`. De ahí sale,
**sin pedirle nada a LiveKit**:

```
participante-minutos  =  Σ (salida − entrada) por participante
GB estimados          =  participante-minutos × bitrate del preset ÷ 8
```

🔴 **Y su error cae del lado seguro, que es lo que lo vuelve usable:**
estimamos con el **preset nominal** (`h720`), pero `adaptiveStream` **baja el
bitrate real** cuando el video se muestra chico ⇒ **la estimación queda por
ENCIMA del consumo facturado** ⇒ **la alerta suena antes de tiempo, nunca
después.**

> *Para una alarma, un proxy que sobreestima vale más que un número exacto que
> llega tarde. No necesitamos saber cuántos GB gastamos: necesitamos saber
> cuándo ir a mirar.*

**Lo que NO es, dicho antes de que alguien lo confunda:** **no es el número de
facturación** y no debe presentarse como tal. Es un **disparador**, no un
estado de cuenta.

**Condiciones para que exista:** ① el webhook dado de alta y vivo · ② la RPC
de A guardando los eventos · ③ un cron que sume el mes y avise al cruzar
**30 GB estimados**.
⇒ **No lo construyo en esta tanda:** depende de ① y ② que todavía no existen,
y **un contador que corre sobre una tabla vacía informaría cero para siempre**
— que es peor que no tenerlo. **Disparo: cuando el webhook registre su primer
evento real.**

---

# ACTO 5 · LA TABLA DE TRANSPORTE, CERRADA

> ⚠️ **Esto ya se depositó en la tanda 1** (commit `c1ccec58`, en
> `2026-08-25-s106-d-transporte.md` y en la spec del cable). **Se re-declara
> acá como medición, no como conclusión**, porque el mandato lo pide y porque
> **este documento tiene que poder leerse solo.**

## El gate del founder — 26-ago-2026

| # | qué | resultado |
|---|---|---|
| ① | compila e instala | ✅ **en los dos teléfonos** |
| ② | los dos entran a `cable-quito` | ✅ |
| ③ | **se ven en AMBOS sentidos** | ✅ **cada aparato vio la cámara del OTRO** |
| ④ | **se oyen en AMBOS sentidos** | ✅ |
| ⑤ | **red real de Quito** | ✅ |

**Condiciones:** dos dispositivos · **APK autónomos** (preview local, **sha256
verificados**) · red real de Quito.

⇒ ### **LiveKit Cloud queda FIRMADO SIN CONDICIÓN. La escalera de caída (① plugin genérico de Expo · ② Agora) SE RETIRA: ya no hay condición que la dispare.**

🔴 **Por qué el ③ es lo que valida el verde y no una formalidad:** *cada
aparato vio la cámara del otro — nadie se vio a sí mismo y creyó que anduvo*,
que es exactamente el modo de falla que la spec nombró **antes** de correr.
**El criterio escrito de antemano hizo su trabajo.**

## Lo que el verde NO cerró — para que no se lea de más

- ⚠️ **Latencia Ecuador: cerrada en usabilidad, no en número.** Probamos que
  **es usable**; **no hay milisegundos medidos**, y ningún proveedor publica
  su footprint. *«Anduvo» y «anduvo con qué latencia» son dos datos
  distintos; tenemos el primero, que era el que decidía.*
- ⚠️ **minSdk / target / peso del APK: el dato EXISTE** (C hizo las builds) y
  **no llegó a este relevamiento.** Pendiente de **traspaso**, no de medición.
- 🔴 **El verde del cable NO desbloquea `video-token`.** El cable probó **el
  transporte**; la teleconsulta necesita **una cita real**. *Que el video ande
  no significa que la teleconsulta ande*, y conviene que esté escrito antes de
  que alguien lo lea al revés.
- ❌ Siguen **NO MEDIDO**: precio de Vonage · TURN de los proveedores cloud.
