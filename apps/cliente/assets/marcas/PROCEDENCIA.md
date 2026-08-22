# Marcas de franquicia de tarjeta — assets VENDORED

> **Depositados:** 21-ago-2026 · sesión **S101-D** · orden de mesa (relevo 2, adenda 8-bis)
> **Fuente:** documentación de Nuvei/Paymentez, sección *Card Brands*
> `https://developers.paymentez.com/api/#payment-methods-cards-card-brands`
> **URLs originales de cada archivo:** `https://s3.amazonaws.com/cdn.images/cc/image/<archivo>`
> **Indicada por:** Erick (Nuvei). **Descargados:** 21-ago-2026.

## 🔴 POR QUÉ ESTÁN ACÁ Y NO SE LEEN DEL CDN

**Vendored, jamás hotlink** (orden explícita). Tres razones, y ninguna es preferencia:
un CDN de un tercero **puede cambiar o borrar un archivo sin avisarnos** y la app se
queda sin logo en producción · **pedir la imagen al servidor del proveedor cada vez
que se dibuja una fila filtra a un tercero cuándo y cuánto abre la app cada familia**
· y una pantalla de pago que depende de una red externa **muestra huecos cuando la
red está mal**, que es justo cuando la familia está mirando su tarjeta.

## EL MAPEO — **medido de la doc y de la base, jamás supuesto**

| `card.type` (proveedor) | Marca | Archivo | ¿Vive en nuestra base? |
|---|---|---|---|
| `vi` | Visa | `ic_visa.svg` | ✅ **sí — 3 filas** |
| `mc` | Mastercard | `ic_mastercard.svg` | — |
| `di` | Diners | `ic_diners.svg` | ✅ **sí — 4 filas** |
| `ax` | American Express | `ic_amex.svg` | — |
| `dc` | Discover | `ic_discover.svg` | — |

**Los códigos salieron de la tabla de la doc** (columna `type`) **y se cotejaron
contra `select marca, count(*) from tarjetas_guardadas`**, que hoy devuelve
exactamente **`di` (4)** y **`vi` (3)**.

✅ **El mapa vivo de `src/components/logo-franquicia.tsx` YA está bien**: sus claves
son los códigos del proveedor en minúscula (`vi`·`mc`·`di`·`ax`·`dc`) y la pieza
normaliza con `toLowerCase()`. *Se verificó antes de tocarlo — la sospecha era que
mapeara nombres («VISA») que la base nunca produce, y no es el caso.*

⚠️ **La doc lista 24 marcas** (Colombia y Brasil incluidas: Éxito, Alkosto, Codensa,
Falabella, Elo, Hipercard…). **Se depositaron SOLO las cinco que la casa mapea.**
*Traer las 24 sería vendorear marcas de países donde no operamos, para un fallback
que ya las dibuja bien.*

## ⚠️ NO ESTÁN CABLEADOS — y es a propósito

**Ninguna pantalla los importa todavía.** El fallback de texto-en-caja **sigue
siendo la ley** (firma vigente: *al llegar los archivos cambia el interior de la
caja y nada más*).

**Lo que falta decidir, y es una decisión de dependencia, no de diseño:** hoy el
repo **no tiene transformer de SVG** (medido: cero `react-native-svg-transformer`,
cero `svgr` en `apps/cliente`). React Native **no importa un `.svg` como componente
sin uno**. Las dos salidas, con su costo:

| Salida | Costo | Riesgo |
|---|---|---|
| **(a) transformer de SVG** (`react-native-svg-transformer`) | dep de desarrollo + cambio en `metro.config.js` | toca el pipeline del bundle de las DOS apps; **JS puro, sin build nativa** |
| **(b) convertirlos a componentes** con `react-native-svg` (ya instalado) | cero deps; es **el patrón de la casa** — `Huella`, `Isotipo` y `Guijarro` son marcas dibujadas en código | 🔴 **los cinco usan `<defs>` + `<mask>` + `xlink:href`**, y **tres relaciones de aspecto distintas** (`32×21` · `56×18` · `56×37`). *Convertir a mano una marca registrada es donde se cuela la distorsión, y una marca distorsionada es peor que su texto* |

**Se frena acá a propósito.** *Elegir el pipeline de assets de la casa no es una
decisión de esta tanda, y rehacer a mano cinco marcas registradas con máscaras para
llegar a un gate es exactamente cómo se rompe un logo sin que nadie lo note.*

## Encaje visual — medido, para quien lo cablee

La caja es **56×32** (`ANCHO_LOGO`/`ALTO_LOGO`, medidos en el aparato contra la
palabra más larga: con 44 px «DINERS» se partía en «DINER / S»). **Los tres
aspectos de los SVG no coinciden entre sí**, así que el cableado necesita
**contención con aire, jamás estirado** — el precedente de la casa es la escalera de
portada de `LogoNegocio` (`contentFit: contain` + aire interno): *un logo estirado a
sangre grita «acá falló algo»*.
