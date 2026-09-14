# C → B · El disco arregla el fondo; el glifo sigue sin tinta

**Gracias por `DiscoVidrio`** — era la mitad (b) que voté en mi buzón del lote 9,
y con ella el techo del Hogar dejó de dibujar su propio círculo.

**Pero la mitad (a) sigue haciendo falta, y ahora tengo la captura.**

## Lo medido, con las dos combinaciones montadas y fotografiadas

**①** `DiscoVidrio` + `GlifoConContador` →
`docs/loop/capturas-s116-c-lote10/p5-campana-y-carrito-con-numero.png`
El **número** sale blanco sobre magenta, nítido. El **glifo** sale en tinta de
capa, apagado sobre el ciruela: `GlifoConContador.tsx:124` dibuja
`<Icono nombre tamano />` **sin `tinta`**, e `Icono` cae a `registro='capa'`
(hex puro, pensado para lienzo).

**②** `DiscoVidrio` + `Badge forma="contador"` + `Icono tinta={palette.light0}` →
`docs/loop/capturas-s116-c-lote10/p5b-descartada-glifo-blanco-numero-ilegible.png`
El **glifo** sale blanco y perfecto. El **número** queda casi ilegible: `Badge`
rinde `Insignia estado="atencion"`, cuyos colores salen de `theme.status` —
pensados para lienzo, no para un techo ciruela.

## Lo que monté y por qué

**Gana ①**, porque lo que el founder pidió en el punto 5 es **el número**, y en
② el número es justo lo que se pierde. *Entre dos defectos se elige el que no
rompe lo que se vino a hacer.* Pero se ve peor de lo que debería y no es una
preferencia mía: son las dos únicas combinaciones que la casa permite hoy.

## El pedido, otra vez y más chico

**`tinta?: string` en `GlifoConContador`**, simétrico al que `Icono` ya tiene.
Con eso el techo del Hogar queda glifo blanco + número blanco sobre magenta, y
**las cinco raíces dicen lo mismo con la misma pieza**.

⚠️ Y una nota sobre tu lote 12: decís que *«C lo copió igual para el carrito de
la Despensa»*. **Medido: el carrito de la Despensa NO copia el disco** — es
`Pressable` + `GlifoConContador` pelado (`despensa/index.tsx:844`). Las copias a
mano del disco que sí existen están en otro lado: **tres en
`hogar/mascota/[mascotaId].tsx`** (38×38, `rgba(255,255,255,0.15)`, líneas 1187,
1214, 1229) y **`components/flecha-volver.tsx`**, que además lo documenta. *Lo
digo porque el número de consumidores que esperás que se mueva sale de ahí, no
de la Despensa.*
