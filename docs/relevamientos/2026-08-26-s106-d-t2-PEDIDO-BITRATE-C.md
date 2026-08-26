# PEDIDO A LA PISTA C · LAS DOS PALANCAS DE ANCHO DE BANDA

> **De:** pista D · S106 tanda 2 · 26-ago-2026 · **autocontenido (76b).**
> **Disparo:** firma del founder — *«encendé `adaptiveStream` y `dynacast`
> AHORA; el preset queda en `h720` hasta que él lo mire con un animal en
> pantalla.»*
>
> 🔴 **Te lo pido a vos porque NO es mi territorio.** Son `RoomOptions` **del
> cliente**, viven en `apps/`. Mi territorio es `supabase/functions`.
> *Y no es un tecnicismo de reparto: **medí que el bitrate no se puede fijar
> desde el servidor** — ni el token ni la configuración de sala lo tienen. La
> palanca la tiene quien publica, o sea la app.*

---

## §1 · 🔴 LO PRIMERO, PORQUE CAMBIA SI ESTO ES UN NO-OP O NO

**Medido en el bundle de `livekit-client@2.22.0`:**

```
adaptiveStream: false,
dynacast: false,
```

> ### **Vienen APAGADOS por defecto.** Encenderlos es un cambio real.
> *Tal como está el cable hoy, estamos mandando bytes que nadie mira.*

---

## §2 · QUÉ HAY QUE CAMBIAR

Donde se construye la `Room` / se monta el `LiveKitRoom`:

```ts
const opcionesDeSala = {
  adaptiveStream: true,   // ajusta lo que se RECIBE al tamaño real en pantalla
  dynacast: true,         // deja de PUBLICAR capas que nadie consume
};
```

**Y nada más. El preset NO se toca: queda en `h720`** *(1280×720, 1,7 Mbps —
el default del SDK)*, por firma del founder, **hasta que lo mire con un animal
en pantalla.**

---

## §3 · POR QUÉ ESTAS DOS Y NO BAJAR LA CALIDAD

**Son las únicas dos palancas que atacan bytes sin tocar lo que la gente ve:**

| | qué hace | por qué no cuesta calidad |
|---|---|---|
| `adaptiveStream` | ajusta la calidad **recibida** al tamaño en que el video se está mostrando | 🔴 *en una in-call con el vet en grande y el dueño en un thumbnail, **el thumbnail no necesita 720p**. Ya se veía chico: sólo dejamos de pagar por píxeles que la pantalla descarta* |
| `dynacast` | deja de publicar capas de simulcast **que nadie está consumiendo** | si nadie las mira, nadie las extraña |

> **La primera pregunta no es «cuánta calidad sacrificamos», es «cuántos bytes
> estamos mandando que nadie mira».** Estas dos contestan la segunda, y por eso
> van **antes** de tocar el preset.

**El contexto de por qué importa** *(medido, tanda 1 y 2)*: el plan gratis da
**50 GB**, y **el ancho de banda corta antes que los minutos** — ≈98 consultas
a `h720` contra las ≈125 que darían los minutos. **El eje que manda es el GB.**

---

## §4 · ⚠️ UNA PERILLA QUE VA EN LA DIRECCIÓN CONTRARIA — no la toques

`AdaptiveStreamSettings` acepta `pixelDensity`. **Dejá el default.**

El propio SDK lo advierte, literal:

> *«Set it to `screen` to use the actual pixel density of the screen. **Note:
> this might significantly increase the bandwidth consumed** by people
> streaming on high definition screens.»*

🔴 **Un teléfono moderno tiene DPR 3.** Poner `pixelDensity: 'screen'`
**subiría** el consumo justo en los aparatos donde más caro sale — *es la
misma perilla, girada al revés, dentro de la opción que vinimos a encender
para ahorrar.*

---

## §5 · LO BUENO DEL TREN: ESTO NO NECESITA BUILD

**Medido:** estas opciones son **JS del cliente**, no código nativo.

> ### 🟢 **Viaja por OTA.** No hay que reinstalar nada.
> *A diferencia del transporte —que es nativo y por eso tuvo su gate de
> cable—, esta palanca se mueve con un update de JS. **Se puede calibrar
> después del soft launch con consumo real**, en vez de adivinar ahora.*

---

## §6 · CÓMO SE VERIFICA QUE QUEDÓ ENCENDIDO

⚠️ **No alcanza con que compile:** `adaptiveStream: true` y
`adaptiveStream: false` **compilan igual y se ven igual en una llamada de
prueba corta.** *Es exactamente la clase de cambio cuyo modo de falla es el
silencio.*

**Lo que sí lo prueba:** en la llamada, **mostrar un participante en un
recuadro chico** y comprobar que la capa recibida baja
(`VideoQuality`/dimensiones del track suscrito en el log del cliente).
**Si con el video en miniatura sigue llegando 720p, `adaptiveStream` no está
haciendo efecto**, aunque la opción esté escrita.

---

## §7 · LO QUE NO TE PIDO

- ❌ **No toques el preset.** `h720` queda por firma.
- ❌ **No hace falta build nueva** (§5).
- ❌ **No me devuelvas un número de GB** — ese lo mira el founder en el panel,
  y su vigilancia está en mi relevamiento de esta tanda.
