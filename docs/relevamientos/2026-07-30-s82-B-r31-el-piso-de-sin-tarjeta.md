# S82-B r31 · EL PISO DE SIN-TARJETA — qué NO puede desaparecer

**Sesión B · 30-jul-2026.** Insumo de la aplicación de (c) SIN TARJETA, firmada
por el founder junto con el tapiz al 8%. Cero código tocado: es la lista que el
resto necesita.

## EL CRITERIO, antes de la lista

La lista no se enumera de memoria — **se deriva**, y este es el eje:

> **Sobrevive la superficie que SEPARA PLANOS. Muere la que solo AGRUPA
> contenido dentro del mismo plano.**

Una Hoja **flota sobre** lo que hay debajo: sin superficie no hay dónde flotar y
el contenido de atrás se mezcla con el de adelante — deja de ser legible, no
"queda más limpio". Una tarjeta que envuelve tres datos del mismo plano no separa
nada: **el aire hace ese trabajo igual de bien y sin pedir un color** (que es
justo lo que el 8% le quitó).

Corolario que evita la discusión caso por caso: **si al quitarle la superficie el
usuario no sabe QUÉ ESTÁ ARRIBA DE QUÉ, la superficie sobrevive.**

## LA LISTA POR APP

### Sobreviven en LAS DOS apps (son de `packages/ui`, viven una vez)

| Pieza | Por qué NO puede desaparecer |
|---|---|
| **`Hoja`** (bottom sheet) | Es EL caso: flota sobre el contenido y lo tapa parcialmente. Sin superficie, el texto de la Hoja cae encima del de la pantalla. Ya usa `elevacion.elevada` — medido, es una de las dos únicas piezas que la usan. |
| **`VisorFoto`** | Fondo pleno (tinta + scrim) por diseño desde S45: no depende del tema y no está en discusión, pero entra a la lista para que nadie lo "limpie" por coherencia. |
| **`Aviso`** (toast) | Aparece SOBRE cualquier pantalla y se va. Sin superficie no se distingue del contenido que estaba ahí. |
| **`BarraTabs`** | Es el plano de navegación: está por encima de todo el contenido, siempre. |
| **El techo de marca** (`HeroMarca` · el techo del oficio) | No es agrupamiento: es el borde superior del mundo, con su gradiente/tinta. Sin él la pantalla no tiene cabecera. |
| **La BARRA FIJA del CTA** | **El caso más fácil de perder de vista, y el más caro:** el contenido SCROLLEA POR DEBAJO. Sin superficie, el texto que pasa por atrás se lee a través del botón. Medido: **10 pantallas del cliente** tienen pie fijo. |

### Mueren (las que solo agrupan) — el trabajo de sin-tarjeta

**`Tarjeta elevacion="reposo"` envolviendo contenido del mismo plano: 25
archivos entre las dos apps.** Ahí el agrupamiento pasa al aire (spacing) y a la
jerarquía tipográfica que ya existe.

**La excepción dentro de la excepción, declarada:** una `Tarjeta` que envuelve un
bloque **tocable que navega** (la ficha de mascota del Hogar, una fila de cita)
NO es solo agrupamiento — la superficie es también el **área tocable** y su
`pressed`. Esas se juzgan de a una en la pasada de craft, no se barren.

## LAS DOS PANTALLAS DEL GATE, con su porqué

- **Cliente: `hogar/paseos`** (el log del paseo). Elegida porque **tiene las dos
  cosas juntas** — varias tarjetas de agrupamiento puro (el historial colapsable,
  las filas del plan) **Y una barra fija de CTA** en el pie. Así el gate no
  muestra solo qué desaparece: muestra **qué desaparece contra qué sobrevive**,
  que es la decisión real. Y es una pantalla que el founder ya recorrió tres
  veces reportando la pieza que no separa.
- **Prestador: `(tabs)/index`** (el HOY). Elegida porque es **la pantalla que se
  repite todos los días** y la que más superficies de agrupamiento tiene (las 4
  listas de citas con `FilaCita`), además de su techo de oficio — o sea el
  contraste máximo entre lo que muere y lo que queda. Si sin-tarjeta funciona
  ahí, funciona en las 102; si molesta, molesta donde más duele y se sabe
  temprano.

## Estado y lo que sigue

**Cero código tocado en esta ronda: la lista es el insumo y va sola** para que
puedas objetarla antes de que 25 archivos se muevan. Cuando la firmes, aplico
sin-tarjeta en esas dos pantallas, y **el tinte al 8% vuelve con ellas** — el par
viaja junto, como quedó establecido al revertirlo.
