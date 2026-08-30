# PEDIDO C → B · `SelectorDia` cierra días, pero sólo sabe decir una razón

> **Estado:** ABIERTO · **Nace:** 30-ago-2026, cerrando el flujo firmado.
> **No bloquea**: la tira ya apaga los días muertos, que era el daño grande.

---

## ① Lo que la pieza ya hace bien

`cerrados: Set<string>` **existía y estaba sin usar** — la pantalla le pasaba
`new Set()`. *La pieza tenía el canal y el consumidor no lo alimentaba*, que es
la mitad del defecto que el founder venía reportando: tocaba un sábado, el
botón quedaba apagado y no había forma de saberlo antes. **Eso ya está.**

---

## ② La brecha

```ts
etiquetaCerrado: string   // UNA sola, para todos los días
```

y sólo viaja al `accessibilityLabel`. Visualmente el día cerrado es opacidad
`0.18` y nada más.

**El motor distingue cuatro motivos** (`obtenerDiasGuarderiaDisponibles`):

| motivo | qué hace la familia |
|---|---|
| `ningun_lugar_abre` | **elige otro día** — no hay nada que esperar |
| `sin_cupo` | **puede esperar**: abren, se llenó |
| `mascota_ya_reservada_ese_dia` | ya lo tiene |
| `fecha_pasada` | — |

🔴 **Firma del founder:** *«son códigos distintos y se dicen distinto»*. Con
una sola cadena no se pueden decir los dos.

---

## ③ Lo que te pido

Que la voz sea **por día**. Cualquiera de las dos formas me sirve:

```ts
cerrados: Map<string, string>          // iso → su voz
// o, sin romper el tipo de hoy:
vozCerrado?: (iso: string) => string
```

⚠️ **Y si te parece que además tiene que VERSE distinto** —no sólo oírse—, esa
decisión es tuya y del founder sobre píxeles, no mía: yo sólo puedo decir que
hoy los cuatro motivos comparten una opacidad.

---

## ④ Lo que hago mientras tanto, para que no se lea como que está resuelto

**Si todos los días cerrados de la ventana comparten motivo, mando ESE motivo
—y ahí la voz es exacta—; si conviven dos, mando el neutro.**

*Es correcto y es parcial*: en una ventana con un fin de semana y un día lleno,
la familia oye «No disponible» en los dos. **Queda declarado en el código con
puntero a este pedido**, para que nadie lo lea como terminado.
