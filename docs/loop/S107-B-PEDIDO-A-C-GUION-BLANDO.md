# S107-B → C · PEDIDO AUTOCONTENIDO — el guion blando en tres labels

> **Qué se pide:** insertar **guion blando (`­`)** en los labels largos de la
> grilla de Negocio. **Tres cadenas, en `apps/prestador/src/i18n/`** (es y en).
> **Por qué a C:** son cadenas del riel del prestador. **B no puede resolverlo
> en la pieza, y la razón es de fondo, no de territorio.**

## POR QUÉ NO SE ARREGLA EN `Baldosa`

**React Native no hifena español.** Android tiene
`android_hyphenationFrequency`; **iOS no expone nada equivalente**, así que no
hay una sola prop que sirva en las dos plataformas. Y aunque la hubiera, **la
pieza no sabe silabificar**: dónde parte una palabra es **propiedad del IDIOMA**,
no del layout.

🔴 **Y NO se le inventa una prop a la pieza para esto** — sería exactamente el
error que esta sesión ya fichó: *una prop nace de un dato que alguien produce,
jamás del ejemplo con el que se pidió la pieza.* El dato existe y ya tiene
dueño: **es la cadena**.

**Lo que B sí hizo:** la pieza **respeta el guion blando** (RN lo dibuja como
guion sólo si el renglón corta ahí, y es invisible si no) y **nunca trunca**.
Está montado en la galería: **el mismo roster con y sin guion, lado a lado.**

## LAS TRES CADENAS

```ts
// apps/prestador/src/i18n/es.ts  (y su espejo en en.ts)
mundoAdiestramiento: 'Adiestra­miento',
mundoVeterinaria:    'Vete­ri­na­ria',
// y la de la baldosa de venta, que el founder también vio partir:
//   'Vender por e-PetPlace'  → si su corte cae mal, mismo tratamiento
```

**Criterio de dónde ponerlo:** en los puntos donde el español corta —
`a-dies-tra-mien-to` ⇒ **`Adiestra-miento`** es el corte natural. *No hace falta
marcar todas las sílabas: alcanza con la o las que el renglón pueda usar.*

⚠️ **Es invisible en el código**, así que conviene el comentario al lado — si
no, el próximo que edite la cadena lo borra sin saber que estaba.

## LO QUE ESTO **NO** RESUELVE, y es de C

**La grilla del cliente NO usa `Baldosa`.** Medido: `apps/cliente/.../explorar/index.tsx`
la dibuja **a mano** (su único `Baldosa` es una mención en un comentario). ⇒ **la
cura de altura que B hizo en la pieza no la alcanza**, y «Estética y baño»
seguirá partiendo igual.

*Se declara en vez de dejar que se descubra:* la grilla del cliente es **la
tercera baldosa a mano de la casa** y su divergencia es la que 19.9 predice. Si
la mesa quiere, montar `Baldosa` ahí es el trabajo — **pero es decisión, no
arreglo**, y no es de B.
