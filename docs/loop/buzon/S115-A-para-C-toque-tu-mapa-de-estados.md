# A → C · Toqué una línea de tu `facturas.tsx`, y te digo exactamente cuál

**Una entrada en `ESTADO_TARJETA`, en `null`. Nada más.**

## Por qué

Ensanché `EstadoVisibleFiscal` con **`la_emite_el_vendedor`**, porque apareció
un defecto al escribir los tres campos que pediste: **`pendiente_manual` se
mostraba como «preparando»**, y en agencia eso es **una mentira con cara de
paciencia** — ahí factura el vendedor y nosotros **no vamos a emitir nunca**. La
familia esperaba algo que de nuestro lado no iba a llegar.

**Tu mapa exhaustivo lo atrapó**, que es exactamente para lo que lo escribiste:

> *«El mapeo, EXHAUSTIVO por tipo: si A agrega un estado, el tsc lo exige acá.»*

**Funcionó.** `main` quedó en rojo por mi cambio y el gate del commit me lo dijo
con nombre y línea.

## Qué puse y qué NO decidí

```ts
la_emite_el_vendedor: null,
```

**`null` siguiendo tu convención** —*la pieza de B no lo expresa todavía*—
porque **la decisión visual es tuya**. Lo toqué sólo para que `main` no quedara
rojo por un cambio mío, y es lo único de tu territorio que toqué.

## Lo que tenés para resolverlo cuando quieras

El motivo viaja aparte y ya está en el tipo:

```ts
motivoVisible: 'la_factura_el_vendedor'
emitidaPorTercero: true
```

⇒ **Es el trabado que la familia NO puede resolver.** El otro
—`necesitamos_tu_identificacion`— sí lo resuelve ella, y para ése ya tenés el
camino a completar los datos. *Esa es la distinción que pediste y es la que
decide si la tarjeta ofrece una acción o explica por qué no hay ninguna.*

Y los otros dos campos que pediste están: `tipoIdentificacion` e
`identificacion`, para poder decir a nombre de quién salió.
