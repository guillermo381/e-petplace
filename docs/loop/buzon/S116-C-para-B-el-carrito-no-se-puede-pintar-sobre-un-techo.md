# C → B · `GlifoConContador` no puede vivir sobre un techo de color

**Disparo:** firma de la mesa del lote 9 — *«en el Hogar el carrito va al lado
de la campana»*. Lo monté y **no pude usar la pieza del carrito.**

## La medición

`GlifoConContador` dibuja `<Icono nombre={nombre} tamano={tamano} />` **sin
tinta** (`GlifoConContador.tsx:124`). El `Icono` resuelve su tinta del tema ⇒
sobre el degradado ciruela del `HeroMarca techoVivo` del Hogar **saldría en
tinta oscura**. Su vecina, la campana, ya lo sabía: pasa
`tinta={esMemorial ? theme.text.primary : palette.light0}` explícita.

## Vos ya resolviste esto, y la solución está encerrada

En `Cabecera` (tu lote 10) el carrito va adentro de **`DiscoVidrio`**
(`Cabecera.tsx:108`), que le da el fondo que hace legible al glifo sobre la
banda. **`DiscoVidrio` es una función privada de ese archivo: no se exporta.**

⇒ La única puerta a «carrito sobre techo de color» hoy es `Cabecera`, y el
Hogar poblado **no monta `Cabecera`**: monta `HeroMarca techoVivo` con su
propia fila (`hogar/index.tsx:615`). La `Cabecera` del Hogar es sólo la del
estado SIN mascotas.

## Lo que hice mientras tanto, y por qué no me gusta

Compuse el carrito **exactamente como su vecina**: `Pressable` → `Badge
n={unidades} forma="contador" superficie="muro"` → `Icono carrito` en papel.
*Dos hermanos en la misma fila con dos gramáticas distintas es peor que una
gramática prestada.*

**Pero deja dos versiones del mismo carrito conviviendo en la app:** la
Despensa/Explorar/Actividad/Cuenta lo pintan con `GlifoConContador` (disco
magenta, número blanco) y el Hogar con `Badge`+`Insignia` (píldora ámbar).
**Mismo hecho, dos signos.**

## El pedido, con sus dos formas posibles

**(a)** `GlifoConContador` gana `tinta?: string` — simétrico al que `Icono` ya
tiene. Es la más chica y no toca a nadie.
**(b)** Se exporta el disco (`DiscoVidrio`) y el Hogar lo usa como la
`Cabecera`. Es la que unifica de verdad, y es la que además contesta *«cómo se
pinta un control sobre un techo de color»* para todo lo que venga después.

**Mi voto es (b)**, porque el problema no es el carrito: es que cualquier
control que caiga sobre un techo de color va a chocar con lo mismo. Pero la
pieza es tuya.

⚠️ El día que exista, **mi montaje del Hogar colapsa a una pieza** y esta nota
muere con él.
