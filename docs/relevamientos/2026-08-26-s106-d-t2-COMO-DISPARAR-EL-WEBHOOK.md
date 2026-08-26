# CÓMO DISPARAR EL PRIMER EVENTO DEL WEBHOOK — sin la app

> **De:** pista D · S106 tanda 2 · 26-ago-2026 · **autocontenido.**
> **Por qué existe:** C retiró las pantallas del cable en su Obra 8, así que
> ya no se puede entrar a una sala desde la app. **Y sin un evento real, el
> webhook queda construido y no ejercido.**
>
> **Dos pasos, ~30 segundos. Sin instalar nada.**

---

## §1 · GENERAR EL TOKEN — el mismo script del cable

```bash
cd /Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s106-d-t2/supabase/functions/video-token

LIVEKIT_API_KEY='...' \
LIVEKIT_API_SECRET='...' \
LIVEKIT_URL='wss://epetplace-ilqza4vl.livekit.cloud' \
  node generar-token-prueba.mjs
```

🔴 **Usá la key que diste de alta en el webhook — la que llamaste
`telemedicina`.** *Si el token se firma con una key y el webhook con otra, el
evento llega y rebota; ver §4, que ahora sí lo dice.*

**Imprime la URL y dos tokens**, sala **`cable-quito`**, vida 1 h.
**Con UNO alcanza** — ver §3.

⚠️ **La ruta importa: el script vive en `e-petplace-s106-d-t2`, no en el repo
primario.** Desde el primario el error es *«Cannot find module»*, que no dice
«rama equivocada».

---

## §2 · ENTRAR — el playground oficial de LiveKit, en el navegador

Armá esta URL con **el token de `Dispositivo A`**:

```
https://meet.livekit.io/custom?liveKitUrl=wss://epetplace-ilqza4vl.livekit.cloud&token=EL_TOKEN
```

**Abrila, dale permiso de cámara/micrófono, y entrá. Eso es todo.**

**Verificado contra el código fuente** de `livekit-examples/meet`
(`app/custom/page.tsx:6-18`), no contra un tutorial:
```ts
searchParams: { liveKitUrl?: string; token?: string; … }
if (typeof liveKitUrl !== 'string') return <h2>Missing LiveKit URL</h2>;
if (typeof token !== 'string')      return <h2>Missing LiveKit token</h2>;
```
⇒ **los nombres son exactamente `liveKitUrl` y `token`** (ojo con las
mayúsculas: `liveKitUrl`, K mayúscula).

**Discriminador que corrí:** sin parámetros la página devuelve *«Missing
LiveKit URL»*; con ellos, no. **La vía sirve.**

---

## §3 · 🔴 CON UN SOLO PARTICIPANTE ALCANZA — y conviene

**No hace falta que entre nadie más.** LiveKit dispara **`room_started`** y
**`participant_joined`** con el primero que entra.

*Un segundo participante agregaría `participant_joined` otra vez y nada más:
para probar que el webhook llega, uno basta — y menos partes móviles en una
prueba que puede fallar de varias maneras.*

**Quedate ~10 segundos y cerrá la pestaña.** Al salir se disparan
`participant_left` y, poco después, `room_finished` ⇒ **una sola visita
produce tres o cuatro hechos**, que es mejor evidencia que uno solo.

---

## §4 · CÓMO SE VERIFICA — y ahora es diagnosticable, que antes no lo era

**Avisame y yo miro la fila** en `public.videollamada_hechos`. **No me voy a
quedar en «devolvió 200».**

### ⚠️ Lo que curé antes de mandarte a probar
Medí dos cosas incómodas:
1. **`supabase functions logs` NO existe** en esta CLI ⇒ **yo no puedo leer
   los logs de la edge.**
2. Mi webhook **no registraba los rechazos en la base** (a propósito: *una
   tabla que cualquiera puede llenar deja de ser un registro*).

> ### 🔴 Juntas daban un silencio ambiguo: **si el evento rebotaba por firma, entrar a la sala y que no pasara nada se veía IDÉNTICO a que el webhook no estuviera dado de alta.** Dos causas muy distintas, un mismo silencio.

**Curado:** ahora la function **loguea el rechazo con el `key_id` del emisor**
—el claim `iss`, que es **público**— y **con cuál header vino la firma**.

⇒ **Si no aparece la fila, andá a**
`Dashboard → Edge Functions → video-webhook → Logs` **y buscá
`[video-webhook]`.** Vas a ver una de tres:

| lo que dice el log | qué significa |
|---|---|
| *(nada)* | **el evento no llegó** — el alta no está apuntando acá |
| `firma_invalida` con `key_id_del_emisor: …` | **llegó, pero firmado con otra key.** 🔴 **Comparalo con `APIVwiwRPKxvXze`** — si difiere, en el alta se eligió otra |
| `header de firma: …` y luego la fila aparece | **todo bien** |

*El veredicto lo sigue dando la verificación criptográfica: el log no
autoriza nada, sólo cuenta qué pasó.*

---

## §5 · LO QUE ESTE EVENTO CIERRA

**La ambigüedad del header**, que sólo se cierra así:

> `livekit-server-sdk@2.18.0` **exporta** `authorizeHeader = "Authorize"` **y
> no lo usa en ningún lado**, mientras el JSDoc de su propio `receive()` dice
> «**`Authorization`**». **Los dos del mismo archivo.**

Mi edge lee los dos **y ahora loguea cuál vino** — *si sólo lo registrara
cuando falla, un webhook que anda bien dejaría la pregunta abierta para
siempre.* **Te lo reporto con el literal.**

Y con el primer hecho registrado **se dispara el estimador de consumo**, que
hoy no construyo por su propia regla: *un contador sobre una tabla vacía
informa cero para siempre.*

---

## §6 · SI ALGO SALE MAL

- **«Missing LiveKit token»** → el token no viajó en la URL. *Suele ser que se
  cortó al copiar: son ~490 caracteres.*
- **La página conecta pero no se ve nada** → da igual. **El webhook no depende
  del video**: `participant_joined` se dispara al conectar, aunque la cámara
  esté denegada.
- **«token expired»** → duran **1 h**. Regeneralo, o pedí más:
  `TTL_HORAS=3` adelante del comando. *Un token vencido y un cable roto dan el
  mismo síntoma.*
