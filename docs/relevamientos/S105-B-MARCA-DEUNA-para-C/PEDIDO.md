# S105-B → C · LA MARCA DEUNA: EL ASSET, SU PROCEDENCIA Y SUS REGLAS DE USO

> **Autocontenido por L-355.** Todo lo que necesitás está en esta carpeta: no
> hay que leer mi bitácora, ni pedirme nada, ni abrir el manual.
> **Reparto firmado por el founder (S105): B produce, C monta.**
>
> **De:** pista B (`packages/ui`, tokens, jueces) · **Para:** pista C (`apps/cliente`)
> **v2 · 25-ago-2026** — *la v1 dejaba dos decisiones abiertas. **Las dos se
> firmaron** y el proveedor contestó las tres preguntas que faltaban. Este
> documento ya no ofrece opciones: dice qué montar.*

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

## §1 · LO QUE MONTÁS — ya no hay opciones que elegir

| | |
|---|---|
| **archivo** | **`ic_deuna_isotipo.png`** — el isotipo `d!` |
| **fondo de la caja** | **`#FFFFFF` FIJO, en los tres temas** |
| **render** | **24.51 × 22.00 dp** (escala conteniendo en el contenido de 44×22) |
| **el otro archivo** | `ic_deuna.png` (wordmark) **NO se monta.** Queda depositado por procedencia y por si el proveedor cambia su mínimo |

### ✅ FIRMA ① — gana el ISOTIPO (founder, 25-ago-2026)

**Y no es preferencia: el wordmark quedó fuera por el mínimo de reproducción del
propio proveedor.**

| | mínimo que exige Deuna | lo que da nuestra caja | |
|---|---|---|---|
| **wordmark** (versión principal) | **50 px** digital | **44.0 dp** de ancho | ❌ **no entra** |
| **isotipo** (versión símbolo) | **16 px** digital | **22.0 dp** de lado menor | ✅ entra |

*El ancho del wordmark es ambiguo si se leen píxeles físicos —a ×3 son 132— pero
**se descartó por la lectura restrictiva**, y el isotipo entra bajo las dos
lecturas (22 dp ✅ · 66 px físicos ✅), así que **la ambigüedad no hay que
resolverla**. Mismo criterio que la firma ③ de `LETRA_DEUNA`: elegir el supuesto
más restrictivo cuando el dato no alcanza.*

### ✅ FIRMA ② — fondo BLANCO FIJO `#FFFFFF` (founder, 25-ago-2026)

**La caja de Deuna NO hereda `theme.bg.hundido`.** El fundamento es medición:

| tema | `bg.hundido` | contraste del morado `#4C1D80` |
|---|---|---|
| claro | `#EDEBF5` | 9.92:1 ✅ |
| **oscuro** | `#050508` | **1.74:1** 🔴 |
| **memorial** | `#141A14` | **1.51:1** 🔴 |

En oscuro y memorial el logo sería casi invisible, **y ninguno de esos fondos
está entre los que el manual autoriza.** Blanco da **11.70:1** y es el uso ✅ más
literal de su lámina.

⚠️ **La alternativa de pasar las cinco tarjetas a blanco fue evaluada y
DESCARTADA por el founder**, con su razón: *«cambia cinco piezas firmadas para
acomodar una nueva»*. ⇒ **Visa, Mastercard, Diners, Amex y Discover no se
tocan.** Solo la caja de `deuna` lleva fondo fijo.

---

## §2 · 🔴 EL ÁREA DE RESERVA — regla nueva, y entra AL FILO

**El proveedor la fijó** (grupo de WhatsApp, 25-ago-2026):

> *1X mínimo a cada lado, donde **X = el grosor total del punto del signo de
> exclamación**. Ningún elemento gráfico, fotográfico, tipográfico o de textura
> invade ese espacio.*

### X, medido del asset

Aislé el punto por componentes conexas sobre el canal alfa. **Es un círculo
perfecto** —aspecto **1.00**, llenado de elipse **0.989**— de **84 px** en el
isotipo. *(Control cruzado: en el wordmark el mismo punto mide 83 px. El
proveedor es consistente consigo mismo.)*

```
X = 84 px del asset  ×  escala 0.052381  =  4.400 dp en pantalla
```

### La cuenta contra la caja de 56×32

| | requerido | caja | veredicto |
|---|---|---|---|
| ancho | 24.51 + 2×4.40 = **33.31** | 56 | ✅ sobran **22.69** |
| **alto** | 22.00 + 2×4.40 = **30.80** | 32 | ✅ sobran **1.20** |

> ## 🟢 **ENTRA — pero el alto manda y la holgura es de 0,60 dp por lado.**
>
> El aire vertical disponible es exactamente **5 dp** por lado y X pide **4,40**.
> **Sobran seis décimas de punto.**

### ⚠️ Y por eso, tres cosas que NO se pueden tocar

1. **`ALTO_LOGO = 32` no baja.** A 31 el área de reserva se viola.
2. **`CONTENIDO_ALTO = 22` no sube.** A 23 el isotipo crece, X crece con él, y
   también se viola.
3. **Nada se dibuja dentro de la caja además del logo** — ni un borde interno, ni
   un badge, ni un check de seleccionado. *La regla dice «ningún elemento
   gráfico», y adentro de la caja no hay excepción que valga.*

**El modo de falla es silencioso:** cambiar una constante de layout **no da error,
no rompe un test, y viola el manual de una marca registrada sin que nadie lo
note.** ⇒ **Ofrezco mecanizarlo con una regla del juez** (`verify-diseno`, mi
territorio): que falle si esas constantes se mueven sin recalcular el resguardo.
**Decilo y la escribo** — no la construí ahora porque el founder priorizó que
este pedido llegara antes que el gate.

---

## §3 · LO QUE TE ESTOY ENTREGANDO

| archivo | qué | lienzo = cuerpo | aspecto | sha256 vs original |
|---|---|---|---|---|
| **`ic_deuna_isotipo.png`** | **isotipo `d!` — el que va** | 468×420 | **1.114** | ✅ `c29721a65b127159…` |
| `ic_deuna.png` | wordmark `deuna!` — no se monta | 1583×418 | 3.787 | ✅ `c476c26006c186c5…` |

**Los dos vienen sin un píxel de padding: el cuerpo llena el lienzo exacto.**
Medido decodificando el alfa, **no comparando lienzos** — *esa ley ya nos cobró
una vez (S104-B)*. El instrumento se validó antes de usarlo contra un caso de
resultado conocido y lo reprodujo exacto. **Está en el repo:
`node scripts/medir-png.mjs` (sin argumentos corre su propio control).**

⇒ **No hay que recortar, ni centrar, ni compensar nada.** Le pasás `w` y `h` tal
cual, igual que el mapa `ARCHIVOS` hace hoy con el `viewBox` de cada SVG.

### 🔴 Son PNG, no SVG — y eso te toca a vos

El proveedor entregó **raster**. Tu `ARCHIVOS` está tipado para componentes de
`react-native-svg` (`React.FC<{width,height}>`), así que **necesita una rama
nueva**: un PNG se monta con `<Image>`. **Es la única pieza de código que este
cambio pide.**

- **No hacen falta `@2x`/`@3x`.** El isotipo tiene 468 px de ancho y se dibuja a
  24.5 dp ⇒ a ×3 son 74 px reales: sobra resolución por un factor de 6.
  **Downsamplea, nunca interpola hacia arriba.**
- **`resizeMode="contain"`** reproduce exactamente la regla de escala del set.

⚠️ **Si Deuna entrega SVG, se reemplaza y esta rama muere** — el pipeline
vectorial ya existe. Lo pedí; hoy no lo tengo.

---

## §4 · LAS REGLAS DE FONDO DEL MANUAL (contexto — tu caso ya está firmado)

De su lámina de usos sobre fondo, que marca cada combinación explícitamente:

| fondo | logo | veredicto |
|---|---|---|
| blanco | morado | ✅ **← el nuestro** |
| morado `#4C1D80` | blanco | ✅ |
| verde `#008081` | morado | ✅ |
| verde `#008081` | blanco | ❌ **prohibido** |
| morado `#4C1D80` | verde | ⚠️ condicionado |

**El asterisco quedó contestado** (proveedor, grupo, 25-ago-2026): la combinación
*queda sujeta a las necesidades del diseño, exige verificar legibilidad antes de
aplicar, y **recomienda no usarla en formatos pequeños o reducidos***.
**No nos toca por partida doble:** no es la combinación que montamos, **y nuestra
caja es formato reducido** — su propio manual la desaconseja a nuestro tamaño.

**Colores oficiales, medidos de los archivos:** morado **`#4C1D80`** (100 % de los
píxeles opacos), verde `#008081` (el chip «Negocios»).

---

## §5 · LA GRAFÍA DEL NOMBRE

- **`deuna!`** (minúscula, con exclamación) es **el LOGOTIPO**. Existe **solo
  como asset**. **Jamás se tipografía.**
- **«Deuna»** (capital inicial, **sin exclamación**) es **el nombre en texto
  corrido**, tal como su propio manual lo escribe en N3 y N4: *«Promos Deuna»,
  «Club Deuna», «Lealtad Deuna»*.
- **`deuna`** minúscula es clave de código, no es voz.
- 🔴 **`DeUna` no existe en el manual.** Lo inventamos nosotros.

✅ **TU i18n YA ESTÁ BIEN.** `deunaFila: 'Deuna'` y las doce voces `pago.deuna*`
usan la forma correcta. **No toques ni una.**

⚠️ **El `!` no se escribe nunca en texto.** «Pagá con Deuna», jamás «pagá con
deuna!». El signo pertenece al logotipo.

*(Las 223 ocurrencias de `DeUna` viven en letra y comentarios, **ninguna en
pantalla**. No pido barrido: se curan al tocarse.)*

---

## §6 · QUÉ HACER, EN ORDEN

1. **Copiá `ic_deuna_isotipo.png` y `ic_deuna.png`** a `apps/cliente/assets/marcas/`.
2. **Pegá el bloque de `PROCEDENCIA.md`** (archivo hermano) al final del que ya
   existe ahí. **No lo reescribas**: el de las cinco tarjetas sigue siendo verdad.
3. **Agregá la rama de PNG** a `LogoFranquicia` y mapeá `deuna` → **isotipo**.
4. **Fondo `#FFFFFF` fijo** para esa caja, en los tres temas (firma ②). Las cinco
   tarjetas **no se tocan**.
5. **No toques el fallback de texto** (§0).
6. **No muevas `ALTO_LOGO` ni `CONTENIDO_ALTO`** (§2).

**Lo que no cambia, y es la promesa que tu propia pieza ya hacía:** la caja sigue
midiendo 56×32, el radio no se toca, el alto de la fila no se mueve, y las cinco
tarjetas quedan idénticas. *«Cambia el interior de esta caja y nada más.»*

**El gate es en dispositivo y lo corre el founder** cuando el riel esté vivo en
QA. Lo que él va a mirar es la pantalla de pago real — **no una galería**.

---

## §7 · LO QUE SÉ Y LO QUE NO

**Las diez preguntas del manual quedaron cerradas:** siete con cita de sus
láminas, tres con respuesta directa del proveedor (grupo de WhatsApp, 25-ago-2026,
con fecha y canal).

**Lo único que sigue sin respuesta, y no bloquea nada:**
- **si tienen el logo en SVG** (mejoraría el montaje, no lo condiciona);
- **si exigen leyenda de atribución** junto al logo.

**No pude leer el manual completo** —Corebook es una aplicación de una sola
página y no hay navegador conectado en mi entorno—, así que trabajé con **las
láminas que el founder bajó** más **medición directa de los archivos**. *Lo que
no pude leer no lo inventé: se preguntó.*
