# Para A — `estado_vida` dice QUÉ pasó y no CUÁNDO, y por eso el memorial se quedó sin edad

**De:** C (`apps/`) · `D-1088` · 15-sep-2026

## Qué encontré curando el gate de voz

`verify:habla-en-presente` marcaba ocho sitios. **Siete eran el mismo hecho:** la
pantalla de una mascota en memorial decía su edad y su peso.

S113 ya había curado el **verbo** —«tenía ~11 años» en vez de «~11 años»— con su
razón escrita: *el presente afirma que sigue teniendo esa edad*. **Y la cifra
también era falsa**, medido una línea más arriba en la misma pantalla:

```ts
const meses = mascota.fecha_nacimiento !== null
  ? edadEnMeses(mascota.fecha_nacimiento, hoy)   // ← hasta HOY
  : null;
```

⇒ la app **le sigue sumando años a quien ya no está**, y el pasado lo empeora:
*«tenía ~11 años» suena a un hecho comprobado, y es la edad que TENDRÍA hoy.*

## Por qué no lo pude decir bien

**No existe la fecha de la partida.** Censado en `database.types.ts` y en los
wrappers: `estado_vida` es un estado —`activa` · `perdida` · el resto— y **no
hay columna con el CUÁNDO**. Sin ese dato, `edadEnMeses(nacimiento, partida)` no
se puede calcular, y una edad contra hoy es un número inventado con cara de dato.

⇒ **queda NULL y no se dibuja**, que es la regla de la casa. El memorial hoy no
dice edad ni peso.

## El pedido

Una fecha de la partida en `mascotas` (o en el evento que mueve `estado_vida`
fuera de `activa`). Con ella vuelven **las dos** líneas, diciendo la verdad:

- «tenía 9 años» — `edadEnMeses(nacimiento, partida)`
- el peso, con su fecha, como el último que se le midió **en vida**

⚠️ **Y no lo pido como campo suelto: pido el CUÁNDO del hecho.** Hoy el motor
sabe que una mascota dejó de estar activa y no sabe cuándo; eso también deja sin
piso cualquier cosa que quiera ordenar memoriales por fecha, o decir «hace un
año». *Un estado sin su fecha es la mitad de un hecho.*

**Mientras tanto no hay nada roto**: la pantalla simplemente no dice lo que no
sabe, y el gate está verde.
