# ESTÁNDAR DE IMAGEN Y DE NOMBRE — para quien carga el catálogo

> **Para qué es esto.** Las galerías de marca **no vienen normalizadas**: en la misma carpeta llegan
> packshots sobre blanco, PNG transparentes, fotos de ambiente, imágenes con el sello de promoción
> quemado en el pixel y resoluciones de 400 a 4000 px. Si eso entra tal cual, **la vitrina queda con
> fotos hermosas y despareja — que se ve peor que fotos mediocres y consistentes.**
>
> **Este documento es un FILTRO DE ENTRADA, no una aspiración.** Dice, para cada tipo de imagen que va
> a llegar, **qué se hace con ella**: cuál se usa tal cual, cuál necesita trabajo, y cuál no entra.
>
> **Herramienta:** `scripts/auditar-imagenes.py` mide un lote entero y dice cuáles cumplen y por qué
> no las otras. *Con quinientas imágenes el ojo no alcanza y el criterio se afloja en la número
> cincuenta.*

---

## 🔴 LA DECISIÓN QUE MÁS PESA, TOMADA Y DECLARADA

# LA CASA MUESTRA EL PRODUCTO SOBRE FONDO BLANCO UNIFORME. EL AMBIENTE NO ENTRA COMO PRIMERA FOTO.

**Por qué, y no es gusto — es lo que hacen los referentes de catálogo y lo que sus especificaciones
publicadas dicen:**

| fuente | qué especifica | etiqueta |
|---|---|---|
| **Instacart** (catálogo de grocery — el análogo más cercano) | 1:1 · mín 600×600 · recomendado 1000×1000 · **fondo blanco puro** · **el producto llena el 85 % del área** | `[SPEC]` |
| **eBay Playbook** | **1:1** — *«our dominant and recommended ratio»* | `[SPEC]` |
| **N19**, nuestra propia ley firmada | *la primera foto es el producto solo, sin composición de marketing* | firmada |

**La razón de fondo, en una línea:** *una grilla se lee comparando.* Dos productos sobre dos fondos
distintos no se comparan — se miran uno por uno. **El fondo uniforme es lo que convierte una lista de
fotos en un estante.**

**Y la razón que la hace urgente:** con fondos mezclados, **cuanto mejores sean las fotos, peor se ve
la vitrina** — porque la disparidad se vuelve más visible, no menos.

---

## ① LA IMAGEN — la especificación

| qué | valor | por qué |
|---|---|---|
| **relación de aspecto** | **1:1 (cuadrada)** | es lo que entregan las galerías de marca y lo que especifican Instacart y eBay. **La caja de la app es 1:1**: un asset cuadrado entra sin recortarse |
| **resolución mínima** | **600 × 600 px** | debajo de eso se ve blanda en la ficha, que abre a pantalla completa |
| **resolución recomendada** | **1000 × 1000 px** | el número de Instacart, y deja margen para pantallas densas |
| **fondo** | **blanco puro `#FFFFFF`** *o* **transparente (PNG)** | los dos sirven: la caja de la app usa el color de la tarjeta, así que **un transparente queda apoyado sin marco y un blanco se funde con ella**. Lo que no sirve es un fondo de OTRO color |
| **el producto ocupa** | **~85 % del área**, centrado | el número de Instacart. Menos, y el producto se pierde; más, y queda apretado contra el borde |
| **margen contra el borde** | **≥ 5 % por lado** | lo que sobra del 85 %, repartido |
| **formato** | JPG (fondo blanco) · PNG (transparente) | |
| **peso** | ≤ 400 kB | la vitrina carga 50 de estas de una vez |

### ⛔ LO QUE NO ENTRA COMO PRIMERA FOTO

- **Sellos de oferta quemados en el pixel** (`OFERTA`, `-30 %`, `BAJÓ DE PRECIO`). *Un descuento es un
  dato que cambia; una imagen no cambia.* Además nuestra ley prohíbe la urgencia artificial.
- **Collages «antes / ahora»** y comparativas de precio.
- **Logos superpuestos** o marcos de agua de la marca.
- **Textos de marketing** sobre la imagen.
- **Fotos de ambiente** (el perro comiendo, la casa, la mano sosteniendo el producto) — *pueden entrar
  como foto SECUNDARIA; nunca como la primera.*
- **Composiciones con varios productos** cuando se vende uno solo.

> **N19 lo dice y acá se vuelve operativo: LA PRIMERA FOTO ES EL PRODUCTO SOLO.**

### 🔴 QUÉ SE HACE CON CADA TIPO QUE VA A LLEGAR

*Esta es la tabla que se usa carpeta por carpeta.*

| lo que llega | veredicto | qué se hace |
|---|---|---|
| **packshot cuadrado sobre blanco, ≥600 px** | ✅ **entra tal cual** | nada |
| **packshot cuadrado transparente (PNG), ≥600 px** | ✅ **entra tal cual** | nada — la caja lo apoya sobre la tarjeta sin marco |
| **packshot sobre blanco pero RECTANGULAR** (ej. 1200×800) | ⚠️ **necesita trabajo** | extender el blanco hasta cuadrar (no estirar, no recortar el producto) |
| **packshot con fondo de color o degradado** | ⚠️ **necesita trabajo** | recortar el producto y ponerlo sobre blanco |
| **producto pegado al borde** (ocupa >95 %) | ⚠️ **necesita trabajo** | agregar margen hasta el ~85 % |
| **producto diminuto en el centro** (ocupa <60 %) | ⚠️ **necesita trabajo** | recortar hacia el producto hasta el ~85 % |
| **menos de 600 px de lado** | ❌ **no entra** | pedirla a la marca. *Una foto blanda se ve peor que ninguna* |
| **con sello, texto, collage o logo superpuesto** | ❌ **no entra como primera** | buscar la limpia en la galería; si no hay, va como secundaria |
| **foto de ambiente** | ❌ **no entra como primera** | queda como secundaria |

> **La regla que resuelve las dudas: ante dos candidatas, gana LA MÁS ABURRIDA** — el producto solo,
> de frente, sobre blanco. *La foto de catálogo no tiene que ser linda: tiene que ser comparable.*

---

## ② EL NOMBRE — la forma canónica

**El nombre de vitrina NO es el nombre del importador.** El del importador está hecho para una planilla
de inventario: tiene que ser único y describirlo todo. El de vitrina está hecho para que una persona
reconozca lo que ya compra, **en dos líneas y de reojo**.

### La forma

```
<Línea de producto> <variante o sabor>
```

**Y lo que NO va adentro del nombre, porque la tarjeta ya lo muestra en su propia línea:**
- **la marca** → tiene su renglón (`marca`)
- **la presentación** → tiene su renglón (`2.3 kg`, `Sobre 85 g`)
- **la especie y la etapa** → viven en el producto como dato, y la app filtra por ellas

### 🔴 EL LARGO MÁXIMO, MEDIDO Y NO ESTIMADO

**Sobre la tarjeta re-derivada, en el teléfono del gate (SM-S938B, 384 dp de ancho):**

| | |
|---|---|
| ancho de la tarjeta | **164 dp** |
| caja interna de texto | **138.3 dp** (bounds reales del árbol) |
| tipografía del nombre | DM Sans regular **16 px** |
| **ancho medido por carácter** | **7.64 dp** |
| **capacidad** | **~18 caracteres por línea · ~36 en dos líneas** |

**Cómo se midió, para que se pueda repetir:** sobre la captura del aparato se midió la **extensión de
tinta** del nombre *«Adulto Control PH Feline»*, que la tarjeta parte en dos líneas. La primera línea
—*«Adulto Control PH»*, 17 caracteres— ocupa **129.8 dp**. ⇒ **129.8 ÷ 17 = 7.64 dp por carácter**, y
138.3 ÷ 7.64 = **18.1 por línea**.

*No es un promedio de tabla tipográfica: es la tinta que el teléfono dibujó.* (La segunda línea,
*«Feline»*, da 6.75 dp/carácter — las letras angostas rinden más, así que **18 es el número
conservador y por eso es el que manda.**)

> ⇒ **EL NOMBRE DE VITRINA ENTRA EN ~36 CARACTERES.** Más que eso se corta con puntos suspensivos y
> **el final del nombre —que suele ser justo el sabor o la variante— es lo que se pierde.**

*El número se re-mide con `node scripts/medir-tarjeta-producto.mjs` cada vez que la tarjeta cambie:
la capacidad sale del ancho de la caja y del cuerpo de la letra, no de esta línea.*

### El antes y después, con productos reales del catálogo

| como está hoy | caracteres | como entra a vitrina | caracteres |
|---|---|---|---|
| `Acondicionador de agua para acuario Marca X 250 ml` | 49 ✂️ | **`Acondicionador de agua`** · marca: `Marca X` · presentación: `250 ml` | 22 ✅ |
| `ADULTO CONTROL PH FELINE` | 24 ⚠️ mayúsculas | **`Adulto Control pH`** · marca: `Vital Can Balanced` · presentación: `7.5 kg` | 17 ✅ |
| `Adaptil Calm Difusor + Recarga 48 ml` | 36 | **`Difusor + recarga`** · marca: `Adaptil` · presentación: `48 ml` | 17 ✅ |
| `ADULTO CORDERO Y ARROZ` | 22 ⚠️ mayúsculas | **`Adulto Cordero y Arroz`** · marca: `Pro Pac Ultimates` · presentación: `12.7 kg` | 22 ✅ |
| `CANADA LITTER` | 13 ⚠️ mayúsculas | **`Canada Litter`** (es la marca; el producto necesita nombre propio) | 13 ⚠️ |

**Lo que muestra la tabla y vale más que la regla:** en los cinco casos **no hubo que acortar
palabras — hubo que SACAR de adentro del nombre lo que la tarjeta ya muestra aparte.**

### Las mayúsculas

**Medido sobre el catálogo real: el 42 % de los nombres viene EN MAYÚSCULAS** (`CANADA LITTER`), y en
dos categorías es la norma (`acondicionador_agua` 88 %, `higiene` 45 %).

**Las mayúsculas sostenidas no entran.** Se leen más lento, gritan, y en una grilla de dos columnas
convierten cada tarjeta en un cartel. **Forma correcta: capitalización de nombre propio** — primera
letra de cada palabra significativa en mayúscula, el resto en minúscula (`Canada Litter`, no
`CANADA LITTER` ni `Canada litter`).

⚠️ **Las siglas y unidades se conservan:** `pH`, `XL`, `kg`, `ml`, `UV`. *Una regla que baja todo a
minúscula convierte `pH` en `ph`, y eso es un error de producto, no de estilo.*

---

## ③ CÓMO SE VERIFICA UN LOTE ANTES DE CARGARLO

```bash
python3 scripts/auditar-imagenes.py <carpeta>
```

Reporta, por imagen: **relación de aspecto · resolución · fondo (blanco / transparente / otro) ·
cuánto del área ocupa el producto · margen contra el borde · peso**, y un veredicto
**entra / necesita trabajo / no entra** con su motivo.

**No procesa las imágenes: las MIDE.** *Lo que hace falta antes de cargar quinientas no es un
convertidor — es saber cuáles van a quedar mal antes de que estén adentro.*

**Verificado contra geometría conocida antes de confiarle un lote** —el mismo método con el que se
verificó el harness del benchmark—: seis imágenes fabricadas con respuesta sabida (cuadrada blanca al
85 % · transparente al 85 % · rectangular 1200×800 · fondo de color · 300 px · producto al 35 %) y
**las seis clasificadas bien**. 🔴 **Lo que lo vuelve confiable no es que marque: es que DOS de las
seis NO las marca** — un auditor que señala todo no discrimina, solo asusta.

⚠️ **Dependencia declarada:** usa **Pillow**, que no está en el `package.json`. Es una herramienta de
escritorio para quien carga el catálogo, no parte del build (`python3 -m pip install Pillow`).

⚠️ **Su límite, escrito:** mide **geometría y fondo**. **No sabe si una imagen tiene un sello de oferta
quemado, un collage o un logo superpuesto** — eso lo ve el ojo, y por eso la tabla de arriba existe.
*Su verde dice «la geometría cumple», jamás «esta foto sirve».*

---

## ⚠️ LO QUE ESTE ESTÁNDAR NO RESUELVE, declarado

- **No decide quién hace el trabajo** de las que «necesitan trabajo». Es del founder y de quien cargue.
- **No cubre las fotos secundarias** más allá de decir que el ambiente va ahí. Su orden y su cantidad
  son decisión de la ficha (N19 ①), y hoy `fotosDeProducto` ya declara que **la primera es el producto
  solo**.
- **No mide el catálogo actual.** El auditor existe y está probado; **correrlo sobre las imágenes
  vivas es el siguiente paso y necesita acceso al lote**.
- **El número de ~36 caracteres es de la tarjeta de HOY.** Si la re-derivación cambia el cuerpo o el
  ancho, se re-mide con el instrumento — *esta línea es derivada y decae; el instrumento no.*
