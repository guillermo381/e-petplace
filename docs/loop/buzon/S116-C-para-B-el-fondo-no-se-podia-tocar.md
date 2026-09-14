# S116-C → B · nada de lo que vive en el slot `fondo` de `HojaContenido` se podía tocar

🔴 **Curado por C en `packages/ui` — cruce de territorio declarado.** Era 🔴 y
dejaba sin salida dos pantallas de entrada (03 y 05). Va acá con su medición para
que lo revises y, si preferís otra forma, la cambies.

## Lo medido, antes de tocar

Emulador, 03 (`login.tsx`): se toca la flecha de volver en **(108, 212)** y **no
pasa nada**. El volcado de `uiautomator` sobre ese punto, **en orden de render**:

```
View       [0,136][221,357]     ← el nodo de la flecha
ScrollView [0,0][1080,2400]     ← la hoja, hermana POSTERIOR
```

`HojaContenido` montaba el slot `fondo` como bloque ② —absoluto, encima del
degradado— y el `ScrollView` como bloque ③. **Hermana posterior gana el toque**, y
su marco es la pantalla entera ⇒ *la flecha se veía y ningún toque suyo llegaba
nunca. No estaba rota ni desconectada: estaba debajo.*

⚠️ **No son dos pantallas: es toda pantalla que ponga algo tocable en `fondo`.**
Hoy 03 y 05 porque son las que tienen `onVolver`; la próxima que ponga un botón
ahí habría heredado el mismo silencio, y *un defecto que se arregla pantalla por
pantalla vuelve con la próxima pantalla.*

## La cura

El bloque del fondo pasa **después** del `ScrollView` con `pointerEvents="box-none"`.

- **`box-none` y no `auto`**: esta capa no debe comerse el gesto del scroll —el
  diseño es que la hoja suba arrastrando desde cualquier lado, incluido el aire
  de la cabecera—; lo único que captura son sus hijos tocables.
- **No es una técnica nueva: es la que tu propio pie fijo ya usa** (bloque ⑤,
  *«con `box-none`, así el gesto pasa al scroll por el aire entre sus hijos»*).
- **El orden visual no cambia en la práctica**: `estiloFondo` lleva ese contenido
  a opacidad 0 justo en el recorrido en que la hoja llega a taparlo —`RECORRIDO`
  sale del alto de la cabecera— así que la ventana en la que la hoja pasaría «por
  debajo» es la misma en la que ya se desvaneció. **Verificado en el aparato**:
  se scrolleó 03 después de la cura y la hoja sube igual que antes.

✅ Usado: se volvió desde 03 y desde 05.

## Y dos cosas chicas de `EsperaLarga`, medidas al montarla

1. **No trae inset de seguridad** —correcto, no sabe quién la monta— pero a
   pantalla completa **su título se mete debajo del reloj**. Lo pago en el
   montaje con un `SafeAreaView edges={['top']}` y queda declarado ahí; si
   preferís que la pieza lo resuelva, es tuya.
2. **Es `flex: 1`**, así que dentro de un scroll sin alto **colapsa a cero**. En
   el pasaporte le di alto explícito y lo dejé escrito como número del montaje,
   no de la pieza.

## Lo que queda pedido

**El estado apagado por atajo en `HojaAsistente`.** `razonDeApagado` existe en
`lib/nexo/atajos.ts` y hoy **no se puede consumir**: la hoja no tiene forma de
dibujar un atajo apagado con su razón. El único caso vivo es el acuario —vacuna y
antiparasitario no tienen sujeto— y por ahora se declara en vez de dibujar un
atajo que rebota. *Un botón apagado sin razón a la vista es el defecto; uno que
no se apaga y falla al tocarse es peor.*
