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

## Marca DEUNA — assets VENDORED

> **Depositados:** 24-ago-2026 · sesión **S105-B** · reparto firmado por el
> founder: **B produce, C monta**.
> **Fuente:** manual de marca oficial de Deuna, alojado en Corebook
> (`https://my.corebook.io/deuna`). **Acceso por link privado en poder del
> founder — el token NO se registra acá ni en ningún archivo del repo.**
> **Bajados por:** el founder, del Corebook oficial. **Fecha:** 24-ago-2026.
> **Versión de la arquitectura de marca vista en el manual:** *14 de abril 2025*.

| archivo | qué es | nivel en su manual | lienzo = cuerpo | aspecto |
|---|---|---|---|---|
| `ic_deuna.png` | wordmark `deuna!` | **N1 — marca principal / ecosistema** | 1583×418 | **3.787** |
| `ic_deuna_isotipo.png` | isotipo `d!` | N1 (variante) | 468×420 | **1.114** |

### Byte-idénticos al original — verificado, no afirmado

**No se redibujó, no se recortó, no se resampleó, no se recomprimió.** Los dos
archivos son copia exacta de lo que entregó el proveedor:

```
ic_deuna.png          sha256 c476c26006c186c5…
ic_deuna_isotipo.png  sha256 c29721a65b127159…
```

*Rige la misma orden de mesa que las cinco tarjetas: **son marcas registradas, el
archivo del proveedor es la fuente de verdad**. Un logo redibujado a ojo se lee
como error, no como marca.*

### El cuerpo, medido por decodificación de alfa

**Los dos vienen sin un solo píxel de padding** — el cuerpo llena el lienzo
exacto. Se midió decodificando el canal alfa, **no comparando lienzos**: es la
ley que la casa ya se cobró una vez (S104-B declaró *«ninguno de los dos assets
es el isotipo»* comparando lienzos, y era falso). **El instrumento se validó
antes de usarlo** contra un caso de resultado conocido —el splash del prestador,
245×168— y lo reprodujo exacto.

⇒ Se le pasan `w` y `h` tal cual, igual que el `viewBox` de cada SVG.

### 🔴 SON PNG, NO SVG — y por qué eso importa

El proveedor entregó raster. **No hacen falta `@2x`/`@3x`**: el wordmark tiene
1583 px de ancho y se dibuja a 44 dp, así que a densidad ×3 sobra resolución por
un factor de 12 — siempre downsamplea.

**Si Deuna entrega SVG, se reemplaza y la rama de PNG muere**: el pipeline
vectorial ya existe (`metro.config.js` + `react-native-svg-transformer`) y es
mejor. Se pidió; al depositar esto no estaba.

### Colores oficiales — medidos de los archivos

| color | hex | de dónde |
|---|---|---|
| morado Deuna | **`#4C1D80`** | **100 % de los píxeles opacos** del wordmark y del isotipo |
| verde Deuna | `#008081` | el chip «Negocios» del lockup de producto |

### 🔴 REGLAS DE USO QUE SU MANUAL EXIGE

De su lámina de usos sobre fondo, que marca cada combinación explícitamente:

| fondo | logo | veredicto |
|---|---|---|
| blanco | morado | ✅ |
| morado `#4C1D80` | blanco | ✅ |
| verde `#008081` | morado | ✅ |
| verde `#008081` | blanco | ❌ **prohibido** |
| morado `#4C1D80` | verde | ⚠️ condicionado (nota al pie no disponible) |

⚠️ **`bg.hundido` NO sirve como fondo en oscuro ni en memorial**: el morado da
**1.74:1** y **1.51:1** respectivamente, y ninguno de esos fondos está entre los
que el manual autoriza. En claro (`#EDEBF5`) da 9.92:1 y sí sirve.

### La grafía del nombre — la fija el manual, no nosotros

- **`deuna!`** (minúscula, con exclamación) es **el LOGOTIPO**. Existe **solo
  como asset**: jamás se tipografía con nuestras fuentes.
- **«Deuna»** (capital inicial, **sin exclamación**) es **el nombre en texto
  corrido**. Es como su propio manual lo escribe en los niveles N3 y N4 de su
  arquitectura de marca: *«Promos Deuna», «Club Deuna», «Lealtad Deuna»*.
- **`deuna`** minúscula es clave de código del proveedor, no es voz.
- ⚠️ **`DeUna` no existe en el manual.** Es una forma que inventamos nosotros;
  no se escribe más. *(Al depositar esto vivía en 223 lugares del repo, ninguno
  en pantalla.)*

### Lo que NO se depositó, y por qué

**El lockup `deuna! Negocios` y las marcas de campaña.** «Negocios» es su
**producto para el comercio** —o sea, nosotros—; lo que la familia elige en la
pantalla de pago es pagar con **su** app, que es la marca principal N1. *Depositar
el lockup de Negocios sería ponerle a la familia el logo del lado del mostrador.*


---

## ⬆️ ENMIENDA A LO DE ARRIBA — firma del founder, 24-ago-2026 (S105-C)

> **El bloque de S105-B no se reescribe: es el registro de lo que B depositó y
> de lo que era cierto ese día.** Lo de acá abajo llegó DESPUÉS y cambia dos
> cosas. *Reescribir arriba borraría que la decisión se tomó con un dato que
> todavía no estaba.*

### ① LA ELECCIÓN SE CERRÓ, Y NO POR GUSTO: **VA EL ISOTIPO `d!`**

El pedido de B dejaba la elección abierta al gate y recomendaba montar el
wordmark como default. **El dato que faltaba llegó del proveedor y la cerró
sola** — es exactamente el desenlace que §6.1 de su pedido había previsto:

- **Mínimo de reproducción de la versión principal (wordmark): 50.** En nuestra
  caja el wordmark se dibuja a **44 de ancho** ⇒ **queda fuera de norma.**
- **Mínimo del símbolo: 16.** El isotipo se dibuja a **24.5 × 22.0** ⇒ entra con
  margen.

⇒ **`ic_deuna.png` (wordmark) queda vendorizado y SIN montar.** No es residuo:
es la marca principal N1 y **el archivo que hay que usar el día que exista una
superficie donde entren sus 50** *(un pie, una pantalla de confirmación, un
comprobante)*. *Se conserva con su razón escrita para que nadie lo borre por
prolijidad ni lo monte por costumbre.*

### ② ÁREA DE RESERVA — regla nueva, y **manda sobre la caja**

**1X libre a cada lado, donde X = el grosor del punto del signo de
exclamación.** **Ningún elemento puede invadir ese espacio: ni un borde, ni
texto, ni el fondo de otra tarjeta.**

🔴 **Y la firma dice qué cede si no entra: `si el isotipo más su resguardo no
entra en la caja de 56×32, LA CAJA CAMBIA, no el resguardo.`** *Sobre una marca
ajena manda su manual — es la misma ley que ya regía para el fondo.*

**El umbral, calculado contra la geometría real de la pieza** (lienzos
verificados acá por lectura del `IHDR`, independiente de la medición de B:
`1583×418` y `468×420`):

| | |
|---|---|
| escala de render del isotipo | `min(44/468, 22/420)` = **0.052381 dp/px** |
| render | **24.514 × 22.000 dp** |
| aire libre al borde — horizontal | 15.743 dp por lado |
| aire libre al borde — **vertical** | **5.000 dp por lado ← es el que liga** |

⇒ **`X ≤ 95.45 px` de origen (= 5.00 dp) entra sin tocar absolutamente nada.**
Por encima de eso hay que decidir, y **la decisión no es de esta carpeta.**

### ③ FONDO: **BLANCO FIJO `#FFFFFF`** para esta marca, en los tres temas

Firmado. Resuelve el choque que B midió: el morado `#4C1D80` da **1.74:1** sobre
`bg.hundido` en oscuro y **1.51:1** en memorial, **y ninguno de esos dos fondos
está entre los que su manual autoriza.** Blanco es la fila ✅ más literal de su
lámina.

⚠️ **Alcance de la firma: SOLO esta marca.** La alternativa que B sirvió —pasar
las cinco tarjetas a blanco fijo también, para no romper el set— **sigue abierta
y es del founder.** *No se resuelve por coherencia interna: cada una de esas
cinco tiene su propio manual.*
