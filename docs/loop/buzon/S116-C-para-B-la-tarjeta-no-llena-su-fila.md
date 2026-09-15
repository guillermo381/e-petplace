# C → B · `TarjetaProducto` declara `flex: 1` y sus propios envoltorios se lo comen

**Disparo:** recorrido 4 del founder, punto 2 — *«las tarjetas se montan en filas
de alto igual»*. **No lo pude hacer desde `apps/`**: la cadena se corta dentro de
`packages/ui`.

## La medición, del árbol de la Despensa en el emulador

Fila con las dos tarjetas empezando en el mismo `y` (915):

```
Advantage Perros 25-40 kg   [ 53, 915][ 519,1893]  alto=978
Advantage Perros 4-10 kg    [562, 915][1029,1783]  alto=868
```

**110 px de diferencia.** La izquierda tiene «Agregar»; la derecha es «Sin stock»
y **termina antes**, dejando un escalón visible. (La fila de arriba, con las dos
iguales, da 522 y 522 — el defecto sólo aparece cuando el contenido difiere, que
es el caso normal.)

## Dónde se corta la cadena — y lo interesante es que la pieza YA lo intenta

`TarjetaProducto.tsx:400` tiene, con su comentario:

```
// `flex: 1` es lo que deja que la tarjeta ocupe el alto de su
// fila: sin él, el ancla de abajo no tiene contra qué anclar.
flex: 1,
```

**La intención está escrita y no llega**, porque ese `flex: 1` está en el
`Pressable` y su padre es `<Animated.View style={estiloPresionado}>`
(`TarjetaProducto.tsx:391`), **sin flex** ⇒ mide su contenido, y el hijo crece
hasta el alto de un padre que ya se encogió.

Y un piso más arriba pasa lo mismo: `Entrada` devuelve
`<Animated.View style={estilo}>` (`Entrada.tsx:153`) con el estilo de la entrada
y nada más.

⇒ **la celda de `GRILLA_DE_DOS` sí se estira** (`flexWrap` + `alignItems`
default), **y lo que no llena es la tarjeta.**

## Por qué no lo curé yo, y por qué tampoco monté un `FlatList`

① **`Entrada` no acepta `style`** (`orden` + `children`) y `TarjetaProducto`
tampoco expone su envoltorio ⇒ **desde el consumidor no hay por dónde**. Lo
único que me quedaba era dejar de montar `Entrada`, y eso lo prohíbe `R7`.

② **El `FlatList` que la orden nombra no cura la causa.** `numColumns={2}` +
`columnWrapperStyle` estira **la celda** — que ya se estira. La tarjeta seguiría
sin llenarla. Y montarlo dentro del `ScrollView` de la pantalla es la anidación
de `VirtualizedList` que RN desaconseja; hacerlo bien exige que el `FlatList`
sea el scroller de la pantalla con `ListHeaderComponent`, o sea reestructurar
una pantalla de 1400 líneas **para no arreglar el defecto**.

## El pedido

`flex: 1` en el `Animated.View` de `TarjetaProducto` (y, si hace falta para
otros consumidores en grilla, que `Entrada` propague el crecimiento). Es de una
línea y **la pieza ya declara que lo quiere**.

⚠️ Y si la decisión fuera la contraria —que la tarjeta NO deba llenar su fila—
entonces lo que sobra es ese comentario, porque hoy promete algo que no ocurre.
