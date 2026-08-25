# S105-B → C · LA MARCA DEUNA: EL ASSET, SU PROCEDENCIA Y SUS REGLAS DE USO

> **Autocontenido por L-355.** Todo lo que necesitás está en esta carpeta: no
> hay que leer mi bitácora, ni pedirme nada, ni abrir el manual.
> **Reparto firmado por el founder (S105): B produce, C monta.**
>
> **De:** pista B (`packages/ui`, tokens, jueces) · **Para:** pista C (`apps/cliente`)
> **Fecha:** 24-ago-2026 · **Rama de origen:** `pista/s105-b`

---

## §0 · LO PRIMERO, PORQUE ES UNA ORDEN Y NO UNA PREFERENCIA

> ### 🔴 **El fallback de texto NO se mata hasta que el asset real esté montado.**
> Orden del founder, literal: *«la fila no puede quedar sin marca ni un turno»*.
>
> ⇒ El brazo de texto de `LogoFranquicia` **sigue vivo tal cual está**. Lo que
> cambia es que `deuna` **deja de caer en él** porque pasa a tener archivo. Si por
> lo que sea el archivo no carga, la fila tiene que seguir dibujando algo.
> **La rama que devuelve `null` sigue sin existir.**

---

## §1 · QUÉ TE ESTOY ENTREGANDO

| archivo | qué es | lienzo | cuerpo | aspecto |
|---|---|---|---|---|
| `ic_deuna.png` | **wordmark `deuna!`** — la marca principal (N1 del manual) | 1583×418 | **1583×418** | **3.787** |
| `ic_deuna_isotipo.png` | **isotipo `d!`** | 468×420 | **468×420** | **1.114** |

**Los dos vienen sin un píxel de padding: el cuerpo llena el lienzo exacto.**
Medido con decodificación de alfa, no comparando lienzos — *la ley «medí el
cuerpo, no el lienzo» ya nos cobró una vez (S104-B)*. El instrumento se validó
antes de usarlo contra un caso de resultado conocido: reprodujo los 245×168 del
splash del prestador que S104-B había medido. **Control verde declarado.**

⇒ **No hay que recortar, ni centrar, ni compensar nada.** Le pasás `w` y `h` tal
cual, igual que el mapa `ARCHIVOS` hace hoy con el `viewBox` de cada SVG.

### 🔴 Son PNG, no SVG — y eso te toca a vos

El proveedor entregó **raster**. Tu `ARCHIVOS` de `logo-franquicia.tsx` está
tipado para componentes de `react-native-svg` (`React.FC<{width,height}>`), así
que **necesita una rama nueva** — un PNG se monta con `<Image>`, no como
componente. **Es la única pieza de código que este cambio pide.**

Dos datos para que no la sobre-pienses:
- **No hacen falta `@2x`/`@3x`.** El wordmark tiene 1583 px de ancho y se
  renderiza a 44 dp ⇒ a densidad ×3 son 132 px reales. Sobra resolución por un
  factor de 12. **Downsamplea, nunca interpola hacia arriba.**
- **`resizeMode="contain"`** reproduce exactamente la regla de escala del set.

⚠️ **Si DeUna entrega SVG más adelante, se reemplaza y esta rama muere** — el
pipeline vectorial ya existe (`metro.config.js` + `react-native-svg-transformer`)
y es mejor. Lo pedí; hoy no lo tengo.

---

## §2 · CÓMO QUEDA EN LA CAJA — calculado, no estimado

La caja del set es **56×32 con contenido 44×22** (`ANCHO_LOGO`/`ALTO_LOGO` y
`CONTENIDO_*` de tu pieza). Con la escala conteniendo de S101-D:

| marca | aspecto | render dp | alto |
|---|---|---|---|
| Visa | 3.111 | 44.0×14.1 | 14.1 |
| Mastercard · Diners · Amex · Discover | ~1.52 | 33.4×22.0 | 22.0 |
| **`deuna!` wordmark** | **3.787** | **44.0×11.6** | **11.6** |
| **`d!` isotipo** | **1.114** | **24.5×22.0** | **22.0** |

> 🔴 **CUÁL DE LAS DOS VA ES DECISIÓN DEL FOUNDER EN EL GATE, NO MÍA NI TUYA.**
> El wordmark queda **más bajo que cualquier tarjeta del set** (11.6 contra los
> 14.1 de Visa, que es la más chata); el isotipo usa el alto completo pero pide
> que la persona reconozca `d!`.
>
> **Dato duro a favor del wordmark, y no es opinión:** al leer la lámina del
> manual, un lector automático transcribió el isotipo como **«d1»** — con uno.
> *Si una máquina entrenada en glifos lo lee mal, alguien que nunca usó la app
> también puede.*
>
> **Dato a favor del isotipo:** la fila **ya dice «Deuna» en su título**, así que
> el nombre no depende del logo.
>
> **Montá el wordmark como default** (es la marca principal N1 y el nombre se
> lee) y dejá el isotipo listo para que el founder compare en el gate. **Si él
> elige el otro, es cambiar una constante.**

---

## §3 · LAS REGLAS DE USO QUE EL MANUAL EXIGE — con su lámina como fuente

Todo esto sale de **la lámina de usos sobre fondo del manual oficial** (una de
las páginas que el founder bajó del Corebook), que marca cada combinación con
✅ / ❌ / ⚠️ explícitos:

| fondo | logo | veredicto del manual |
|---|---|---|
| blanco | morado | ✅ permitido |
| morado `#4C1D80` | blanco | ✅ permitido |
| verde `#008081` | morado | ✅ permitido |
| verde `#008081` | **blanco** | ❌ **PROHIBIDO — X roja explícita** |
| morado `#4C1D80` | **verde** | ⚠️ **condicionado** (asterisco; su nota al pie no está en la lámina que tengo) |

**El morado oficial es `#4C1D80`** — medido, no supuesto: es el **100 % de los
píxeles opacos** del wordmark. El verde del chip «Negocios» es `#008081`.

### 🔴 EL CHOQUE, MEDIDO: TU CAJA HEREDA EL TEMA Y EL MANUAL NO LO PERMITE

`LogoFranquicia` pinta el fondo con `theme.bg.hundido`, **que cambia por tema**:

| tema | `bg.hundido` | contraste del morado `#4C1D80` |
|---|---|---|
| claro | `#EDEBF5` | **9.92:1** ✅ |
| oscuro | `#050508` | **1.74:1** 🔴 |
| memorial | `#141A14` | **1.51:1** 🔴 |

**En oscuro y en memorial el logo es prácticamente invisible** — y además
**ninguno de esos dos fondos figura entre los que el manual autoriza.**

⇒ **NO montes el asset heredando `bg.hundido` sin resolver esto.** Mi propuesta
—que **decide el founder**, es su decisión ②— es **fondo blanco `#FFFFFF` fijo
para la caja de DeUna en los tres temas**: es el uso ✅ más literal de la lámina
(fila 1) y da 11.70:1.

**Y hay una alternativa que el founder también tiene que ver, porque preserva el
set:** que **todas** las cajas de marca pasen a fondo blanco fijo — Visa,
Mastercard, Diners, Amex y Discover también son marcas registradas y sus
manuales piden lo mismo. *Con la primera opción el set se rompe justo en la fila
que el founder puso primera; con la segunda no se rompe, pero toca cinco filas
que hoy nadie reportó como rotas.*

### Una nota que vale para toda marca ajena

El manual **aprueba morado sobre verde (2.45:1) y prohíbe blanco sobre verde
(4.77:1)**: aprueba la combinación de menor contraste y prohíbe la de mayor.
**No es un error del manual — es que no mide lo mismo que nosotros.** Su criterio
es identidad de marca; el nuestro es legibilidad. **Sobre una marca ajena manda
el manual**, porque un logo no es texto funcional. *No corrijas su lámina con
nuestro medidor de WCAG.*

---

## §4 · LA GRAFÍA DEL NOMBRE — el manual la fija y hoy vive triplicada

Medido en el repo (código + letra, sin `node_modules`):

| forma | ocurrencias | qué es |
|---|---|---|
| `DeUna` | **223** | 🔴 **no existe en el manual. Es invención nuestra.** |
| `Deuna` | 44 | ✅ **la correcta para texto corrido** |
| `deuna` | 186 | ✅ correcta como **clave de código** (no es voz) |

**Lo que el manual establece**, visto en su lámina de arquitectura de marca
(N1–N6, versión 14 de abril de 2025):

- **El LOGOTIPO es `deuna!`** — minúscula, con signo de exclamación, en su
  tipografía propia. **Existe solo como asset. Jamás se tipografía.**
- **El NOMBRE en texto corrido es «Deuna»** — capital inicial, **sin
  exclamación**. Es como el propio manual lo escribe en sus niveles N3 y N4:
  *«Promos **Deuna**», «Club **Deuna**», «Lealtad **Deuna**»*.

✅ **BUENA NOTICIA PARA VOS: tu i18n YA ESTÁ BIEN.** `deunaFila: 'Deuna'` y las
doce voces de `pago.deuna*` usan la forma correcta. **No toques ni una.**

⇒ Lo que está mal son las 223 de `DeUna`, y **viven en letra y comentarios, no en
pantalla**. **No pido un barrido**: se curan al tocarse. Lo dejo dicho para que
nadie escriba una nueva.

⚠️ **El `!` no se escribe nunca en texto.** «Pagá con Deuna», jamás «Pagá con
deuna!». El signo pertenece al logotipo.

---

## §5 · QUÉ HACER, EN ORDEN

1. **Copiá los dos PNG** de esta carpeta a `apps/cliente/assets/marcas/`.
2. **Pegá el bloque de `PROCEDENCIA.md`** (archivo hermano en esta carpeta) al
   final del `PROCEDENCIA.md` que ya existe ahí. **No lo reescribas**: el de las
   cinco tarjetas sigue siendo verdad.
3. **Agregá la rama de PNG** a `LogoFranquicia` y mapeá `deuna` al wordmark.
4. **Resolvé el fondo** con lo de §3 — o dejalo explícitamente pendiente del gate
   y montalo con blanco fijo mientras tanto, que es el uso ✅ del manual.
5. **No toques el fallback de texto** (§0).
6. **Gate del founder**: montá las dos variantes en algo que él pueda comparar,
   con los tres temas y con las cinco tarjetas al lado. Son sus tres decisiones y
   ninguna se cierra sin sus ojos.

**Lo que NO cambia, y es la promesa que tu propia pieza ya hacía:** la caja sigue
midiendo 56×32, el radio no se toca, el alto de la fila no se mueve, y las cinco
tarjetas quedan idénticas. *«Cambia el interior de esta caja y nada más.»*

---

## §6 · LO QUE NO SÉ, Y NO LO INVENTÉ

El manual completo vive en Corebook, que es una aplicación de una sola página:
**no pude leerlo entero** (sin navegador conectado, la descarga directa devuelve
solo el shell). Trabajé con **las láminas que el founder bajó** más medición
directa de los archivos.

**Sigue sin respuesta, y hay que preguntárselo a DeUna — no resolverlo por
criterio nuestro:**

1. **Tamaño mínimo de reproducción.** Si su mínimo es mayor que 11.6 dp de alto,
   **el wordmark queda fuera de norma en nuestra caja** y la decisión ① se cierra
   sola a favor del isotipo. *Es la pregunta que más puede cambiar el resultado.*
2. **Área de resguardo.** Nuestra caja deja 6 dp horizontales y 5 verticales de
   aire alrededor del contenido. Falta saber si alcanza.
3. **Qué dice el asterisco ⚠️** de la combinación morado+verde.
4. **Si autorizan una variante monocroma o negativa** para fondos oscuros —
   sería la salida limpia si el founder quiere conservar el fondo por tema.
5. **Si tienen el logo en SVG.**
6. **Si exigen leyenda de atribución** junto al logo.
