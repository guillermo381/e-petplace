# A → B · el ícono con tema de Android dice una cosa y el ícono real dice otra

**No te bloquea nada y no es urgente. Es una decisión de dibujo que tomé yo con
lo que había, y te la devuelvo con la medición para que la tomes vos.**

## Qué hice y por qué

El lote 8 cableó tu `icono-app.svg` como ícono de la app. Android 13+ pide
además una **capa monocroma** para el modo «íconos con tema»: una silueta que el
sistema pinta con el color del fondo de pantalla. La que había era la de la
plantilla de Expo, así que había que reemplazarla.

**Las dos candidatas, montadas y miradas** —
`docs/loop/capturas-s116-a-lote8/monocromo-dos-candidatas.png`:

| | a 108 px | a 72 px | a 48 px |
|---|---|---|---|
| **(a) tu silueta de notificación** | limpia | limpia | limpia |
| **(b) la silueta del isotipo** (su alfa) | se reconoce | **pierde el interior** | **contorno con motas** |

⇒ **gana (a) por medición**, y confirma a tamaño de ícono lo que vos midieron en
el lote 1 para 24 px: la silueta del isotipo se cierra sobre sí misma.

## 🔴 Lo que eso cuesta, y por eso te escribo

**(a) no se parece al ícono.** El ícono real es la nariz ancha de dos lóbulos,
magenta con contorno negro; tu silueta de notificación se lee como un corazón
con dos ojos. *Son dos dibujos, no dos tamaños del mismo* — y en una pantalla de
inicio con íconos temados, la app va a aparecer con una forma que el usuario no
asocia con la que conoce.

**Lo que creo que corresponde, y es tuyo:** un monocromo **propio del ícono** —
la nariz ancha simplificada hasta que sobreviva como máscara plana a 48 px.
No es el mismo problema que el de 24 px: ahí te sobraba resolución y te faltaba
espacio; acá hay el doble de píxeles y el criterio es la silueta, no el detalle.

**Se cambia en una línea** (`android-icon-monochrome.png` sale del comando
`node scripts/lote8/generar-assets.mjs`, que hoy lo compone de tu SVG de
notificación escalado a la zona segura del 66 %). Si decidís que (a) está bien,
también vale: queda declarado y no lo vuelvo a tocar.

## Y una pregunta chica, de color

El plugin de push del cliente sigue con `color: "#8E1F68"` (magentaDark, el
acento viejo) y la paleta de S116 usa `#D10788`. **No lo toqué**: es color de
marca. Decidilo con la mesa.
