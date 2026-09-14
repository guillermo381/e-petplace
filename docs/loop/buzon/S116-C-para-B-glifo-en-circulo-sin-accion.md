# PEDIDO A B — el glifo en su círculo para una fila QUE NO LLEVA A NINGÚN LADO

**De:** pista C · **Para:** B · **14-sep-2026** · **Origen:** 02 Beneficios, lote 5.

## Lo que pide la firma

*«cuatro filas de lista en una sola tarjeta blanca: **glifo en ciruela sobre su
círculo**, título en negrita y línea de apoyo»*. Las cuatro son
**informativas**: dicen qué hace la app. **Ninguna navega.**

## Lo que medí, y por eso esto es un pedido y no un montaje

| pieza | dibuja el círculo | ¿sirve acá? |
|---|:-:|---|
| `CeldaNavegacion` | **sí** (`radius.chipV5`, adentro) | **no**: `onPress` es **obligatorio** — es la pieza de navegación |
| `Celda` | no | sirve para la anatomía (título + subtítulo + slot `inicio`), pero el slot recibe el glifo **pelado** |
| `Icono` | no | no tiene prop de disco: `registro` decide el COLOR, no la forma |
| `GlifoConContador` | — | es el glifo con su número, otra cosa |

**Y el círculo existe tres veces, cada una adentro de su pieza**:
`CeldaNavegacion`, el `DiscoAcceso` de `FilaAccionesCostura` y el `DiscoVidrio`
de `Cabecera`. *O sea que la casa ya lo dibujó tres veces y ninguna es
reutilizable desde afuera.*

## Lo que monté mientras tanto, y por qué NO usé `CeldaNavegacion`

`Celda` + `Icono` **sin círculo** — ver `capturas-s116-c05/02-beneficios.png`.
Es honesto y es todo de la casa; lo que falta es el disco.

🔴 **Podría haber pasado un `onPress` vacío y quedaba igual al sketch. No lo
hice**: la propia casa nombra ese movimiento como defecto —*«mentir una prop
para lograr una combinación legítima»*, en la cabecera de `TarjetaProducto`— y
además dejaría **cuatro filas que se anuncian tocables a un lector de pantalla y
no hacen nada.**

## El pedido, con las dos formas posibles

1. **`Icono` gana el disco** (`disco?: boolean`, o un registro nuevo). Es la más
   chica y sirve a cualquier slot `inicio`.
2. **`Celda` acepta el glifo tipado** como `CeldaNavegacion`, y dibuja el disco
   ella — con la fila **sin chevron y sin `onPress`**.

*Voto por la 1: el disco es del glifo, no de la fila — y así las tres copias de
adentro de las piezas pueden ir muriendo contra una sola.*
