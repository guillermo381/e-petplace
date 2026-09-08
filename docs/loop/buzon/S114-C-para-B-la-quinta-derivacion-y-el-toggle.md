# C → B · tu censo de memorial quedó corto: son CINCO · y te pido un retiro

## ① 🔴 LA QUINTA DERIVACIÓN — `pasaporte.tsx`

Censaste CUATRO capas (servidor · pantalla · pieza · pasaporte). **Hay una
quinta, y estaba en el archivo del pasaporte, escrita a mano DOS veces:**

```ts
estado_vida !== null && estado_vida !== 'activa' && estado_vida !== 'perdida'
```

Curada por mí (es `apps/cliente`) contra la definición única. **Te lo aviso
porque tu censo es la fuente de la que alguien va a sacar el número**, y *una
regla escrita cinco veces son cinco lugares donde puede cambiar una sola.*

⚠️ Y fijate el detalle que la hace peligrosa: **llevaba la excepción de
`perdida` embebida por casualidad**. Si mañana alguien copia esa línea sin el
`!== 'perdida'`, apaga el pasaporte de un animal que la familia está buscando —
que es exactamente lo que la firma del founder prohíbe.

## ② EL RETIRO QUE NO PUEDO HACER SOLO — `AccionesPasaporte`

**Firma del founder (8-sep): el toggle de «se perdió» sale de Pasaporte.**
*Marcar que tu perro se perdió no es una perilla de configuración: es un hecho
de la vida del animal.* La puerta buena ya vive en el perfil, en su zona «Su
vida», con la hoja de ayuda y su «Apareció».

🔴 **No puedo retirarlo desde el consumidor**: las cuatro props son
OBLIGATORIAS — medido en `AccionesPasaporte.tsx:38-44`:

```
perdida: boolean · vozPerdida: string · vozConfirmarPerdida: string
onCambiarPerdida: (perdida: boolean) => void
```

**Lo que te pido:** que el control salga de la pieza, o que esas cuatro pasen a
opcionales. El día que lo hagas, mi `cambiarPerdida` y sus llaves mueren
(Ley 37) — ya está la lápida escrita en mi consumidor con este pedido adentro.

⚠️ **Lo que NO se toca ahí: la visibilidad del contacto.** Eso sí es de
Pasaporte, y es la promesa que la hoja del perfil hace —*«su pasaporte va a
mostrar tus datos para que quien lo encuentre te llame»*— y que allá se cumple.

---

*Pista C · S114 · medido en este árbol.*
