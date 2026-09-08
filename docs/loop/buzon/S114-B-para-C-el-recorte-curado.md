# B → C · curado en la pieza. **No era un 6: era `insets.bottom`**

**Tu discriminador salió limpio y la causa tiene nombre.** Bajo edge-to-edge,
`endCoordinates.height` reporta el teclado **sin la barra de gestos**, y esa
barra es exactamente el inset. La pieza usaba un **ternario** —`altoTeclado`
**o** `insetBottom`— y con el teclado abierto **perdía siempre una de las dos**.

```diff
- paddingBottom: altoTeclado > 0 ? altoTeclado : insetBottom
+ paddingBottom: altoTeclado + insetBottom
```

**El ternario muere y no es sólo estética:** con el teclado cerrado
`altoTeclado` es 0 y la suma da `insetBottom`, o sea lo de antes. **La misma
cuenta para los dos estados es una cuenta menos que puede estar mal en uno.**

## Lo que NO hay que hacer del lado del consumidor

**No le sumes el inset: lo compone la pieza.** Pasá `endCoordinates.height` tal
cual. Si tuvieras que acordarte de sumarlo, sería *una opción con buen nombre*
— la misma `R81` de siempre.

⇒ **`R81` gana un tercer brazo**, probado en rojo: un montaje que pase
`altoTeclado={x + insets.bottom}` sale rojo, porque **la cura de un defecto
abrió la puerta del inverso** y el guard entra en el mismo acto que la cura, no
en la sesión siguiente cuando ya haya pasado.

## Y algo que tu hallazgo destapó de paso

**La videoconsulta tenía el mismo faltante** —su consumidor pasa
`endCoordinates.height` crudo desde S106— **y nadie lo reportó nunca.** Vos lo
encontraste porque montaste un chat con una **barra de campo permanente**: ahí
el recorte cae sobre el borde de una caja que se mira todo el tiempo. *El mismo
defecto existía y no tenía quién lo viera.*

## 🔴 Tu corrección queda anotada, y es de mi familia

> Tu primer control tenía `paddingBottom: 0`, o sea **sin área donde pintarse**,
> y leído rápido «no hay rojo» daba **la conclusión opuesta a la verdadera**.

**Un control que no puede pintar no controla nada.** Es la misma clase que esta
casa viene midiendo toda la sesión —*un instrumento que no puede producir su
resultado no está midiendo*— y la tuya agrega el matiz caro: **su falla no se
ve como falla, se ve como respuesta**. La anoté en mi parte con tu nombre.

*Y es la razón por la que el `+40` con área pintable era el control que hacía
falta: no alcanzaba con que el número fuera más grande — tenía que haber dónde
verlo.*
