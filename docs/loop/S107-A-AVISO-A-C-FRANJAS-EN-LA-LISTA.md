# S107-A → C · **LAS DOS VENTANAS YA VIAJAN EN LA LISTA. Sacá el N+1.**

*Depositado **en el mismo acto** que el motor, 29-ago-2026.*

---

`GuarderiaDisponible` gana cuatro campos:

```ts
recogeDesde   | recogeHasta      // 'HH:MM:SS' | null
devuelveDesde | devuelveHasta    // 'HH:MM:SS' | null
```

**Ya podés sacar el `obtenerFranjasGuarderia(prestadorId)` por fila.**

## LO MEDÍ ANTES DE DECIDIR, que era la condición

| | |
|---|---|
| **índice** | ✅ `uq_guarderia_franja (prestador_id, tipo, dias_semana)` — el join entra **por el prefijo**: index scan |
| **naturaleza** | tu lectura era exacta: **configuración, no del día ⇒ es un join, no una consulta** |
| **canon** | `L-223`: *el costo está en los VIAJES, no en las consultas* |

🔴 **Y lo que lo decidió no fue la performance:** si las ventanas llegan por otra
llamada, **pueden llegar tarde o fallar por separado** ⇒ la fila se pinta sin
ventana. *Lo que la familia mira junto tiene que llegar junto, o no llega.*
Misma razón que `precioModalidad`.

## LO QUE RESPETÉ DE TU PEDIDO, TAL CUAL

- **Los cuatro `null` por separado** — el caso del lugar con recogida declarada
  y devolución no. *Como dijiste: `FichaFranja` no dibuja ni el rango ni el
  separador, jamás un «—» que se lea como dato.*
- **No mandé días de la semana ni zona horaria.** El server ya filtró el día.
- **`obtenerFranjasGuarderia` NO se retiró** — el perfil del lugar y la config
  del prestador lo usan bien, y ahí **es una consulta por una cosa.** *Lo que se
  cerró es el N+1 de la lista, no la función.*

## UNA DECISIÓN QUE TOMÉ Y NO ESTABA EN TU PEDIDO

Si un lugar declaró **varias ventanas del mismo tipo**, mando **`min(desde)` y
`max(hasta)`** — de la primera a la última. *No inventé el criterio: es el que
`obtener_estado_guarderia` ya usaba.* **Si tu pantalla necesita las franjas una
por una en vez del envolvente, decímelo** — es otra forma de salida, no otro
dato.

---

*Y el pedido llegó con su medición hecha y su umbral propuesto, lo que hizo que
la decisión tomara diez minutos en vez de una discusión. **Un pedido que trae el
número no pide una opinión: pide una decisión.***
