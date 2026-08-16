# RECETA DE FORMA — LA NAVEGACIÓN DE LA VITRINA (N20)

**Estatuto:** Toque 1. Se destrabó con las cardinalidades de A
(`conteos_vitrina_por_eje()` sobre LO COMPRABLE, adjudicación (a)).

**Los números, medidos, no supuestos:** **perro 11 · gato 3, sobre 13
comprables** · **2 pares con `momento` NULL** · **octubre abre con 6 + 1**.

---

## §1 · LO PRIMERO, Y NADIE LO NOMBRÓ: **LOS EJES NO PARTICIONAN**

**11 + 3 = 14, y el total comprable es 13.**

⇒ **al menos UN producto vive en las dos especies.** No es un detalle de
conteo: **es una decisión de forma que ya está tomada por el dato.**

> **La especie es un FILTRO, jamás una carpeta.** Nada de tabs
> excluyentes, nada de «secciones» donde un producto *pertenece* a un
> lado. *Un alimento que sirve a perro y a gato no tiene por qué elegir
> dónde vivir — y una navegación que lo obligue va a esconderlo de la
> mitad de las familias.*

*El dato lo dijo antes que el diseño: 14 no cabe en 13.*

---

## §2 · ⭐ LA DECISIÓN QUE LA MESA PIDIÓ — el eje «necesidad» **NO aparece hoy**

**Y no aparece por UMBRAL, no por decreto** — el umbral se computa del
mismo `conteosVitrinaPorEje()`, **así que se enciende solo**.

### El razonamiento, con los números en la mano

N20 ya prohibió el anidado (*«el catálogo anidado hace que la gente
abandone la navegación»*) y fijó **dos toques máximo**. Entonces la
pregunta no es *«drill-down o no»* — eso ya está resuelto. La pregunta es
**si el segundo filtro paga lo que cuesta**.

**Un filtro paga cuando REDUCE algo que no se podía recorrer.** Hoy:

| especie | productos | ¿se recorre de una sentada? |
|---|---|---|
| perro | **11** | **sí** — ~2 pantallas de grilla de 2 columnas |
| gato | **3** | **sí, sin scrollear** |

> **Poner un filtro de necesidad arriba de 3 productos no ayuda: estorba.**
> Le pide a la familia una decisión para ahorrarle un scroll que no
> existe — *y la fricción es real mientras que el ahorro es cero.*

**⇒ HOY: la vitrina abre SIN eje de necesidad.** Confirmado el
diagnóstico de la mesa: con estas cardinalidades sería *innecesario o
hasta dañino*.

### EL UMBRAL, escrito para que se encienda solo

El eje de necesidad **se muestra para la especie elegida** cuando se
cumplen **las dos**:

1. **su lista dejó de recorrerse de una sentada** — más de **12**
   comprables (≈2 pantallas de grilla), y
2. **al menos DOS necesidades con ≥3 productos cada una.**

**La segunda condición es la que evita el peor caso**, y es el defecto
que un umbral de un solo número no ve: *con 30 productos donde 27 son
«adulto», el filtro muestra un bucket enorme y tres vacíos — cumple el
volumen y no ayuda a nadie.* **Un filtro que no reparte no es un filtro:
es un adorno con estado.**

**Se deriva del conteo, jamás de una perilla.** *Nadie tiene que
acordarse de encenderlo el día que el catálogo crezca; y nadie puede
encenderlo antes «para probar».*

---

## §3 · ⭐ EL BUCKET «TODAS LAS EDADES» — decidido CON número (2 de 13)

**`momento` NULL = COMODÍN. El producto aparece en TODOS los momentos, y
JAMÁS existe un bucket «todas las edades».**

**Las dos razones, y la segunda es la fuerte:**

1. **Es lo que el dato significa.** Un alimento para todas las edades
   **es** para un cachorro. Esconderlo cuando alguien filtra «cachorro»
   sería ocultarle un producto que le sirve — *la app sabiendo algo y
   callándolo, que es lo que la casa no hace.*
2. **Con 2 productos, un bucket propio sería un chip que muestra dos
   cosas** — exactamente *el menú que esconde* que N20 prohíbe. **Y
   peor: le sacaría esos 2 a los buckets reales**, dejando «cachorro»
   más pobre de lo que es.

### 🔴 POR QUÉ HAY QUE DECIDIRLO HOY, aunque el eje no se muestre

**El eje se enciende SOLO** (§2). ⇒ el día que el catálogo cruce el
umbral, **nadie va a estar mirando**.

> Sin esta regla escrita ahora, ese día **2 productos desaparecen en
> silencio de todos los filtros** — y el síntoma sería «faltan
> productos», que nadie va a atribuir a una navegación que se encendió
> sola tres semanas antes.
>
> ***Una automatización obliga a decidir sus casos ANTES: no va a haber
> nadie presente cuando dispare.***

---

## §4 · LA PRIMERA PANTALLA — qué se monta con 13 productos

- **El eje de especie, a la vista** (N20: *jamás detrás de un menú*),
  como **filtro** (§1), con la especie de la mascota **ya resuelta**:
  *la vitrina sabe de quién es la mascota* (N20). Con una sola mascota,
  **el primer toque ya está gastado y el producto queda a UNO.**
- **La grilla, directamente debajo** — `Baldosa`, 2 columnas.
- **Sin filtro de necesidad** (§2). **Sin acordeones, sin categorías,
  sin «ver todo».** Con 11 productos, *la lista ES la navegación.*
- **El buscador** corre **sobre lo comprable** (adjudicación (a)) — nunca
  sobre los 457 canónicos. *Una vitrina que devuelve algo que no se puede
  comprar miente dos veces: promete y después se desdice.*

**⚠️ Y la primera compra NO recomienda** (`MODELO_DESPENSA` §5.3): sin
saber qué come, el orden por defecto no finge criterio.

---

## §5 · LO QUE ESTA RECETA **NO** DECIDE

1. **Cuáles son las necesidades** — el vocabulario es de A y del
   catálogo. Esta receta decide **cuándo se muestran**, no cuáles hay.
2. **El orden por defecto dentro de la especie** — depende del motor de
   recomendación; lo único que la forma exige es que **con primera
   compra no ordene por criterio inventado**.
3. **El ojo.** La pregunta para el gate, en el teléfono y con los 7
   productos reales:

> *Con la especie ya elegida por tu mascota: ¿encontrás lo que buscás
> scrolleando, o extrañás un filtro?* **Si lo extrañás con 11 productos,
> el umbral está mal y baja.**
