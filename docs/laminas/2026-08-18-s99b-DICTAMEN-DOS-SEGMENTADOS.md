# DICTAMEN — LOS DOS SEGMENTADOS DE «TU TIENDA»

**Estatuto:** Toque 1. **Bloquea a C.**

**El choque:** la pantalla pasa a dos segmentos —**Tu local · Tu stock**,
firmado— con la vitrina **adentro** del stock. Eso deja **dos controles
segmentados anidados**, y el vendedor no sabe cuál manda.

---

## §1 · POR QUÉ COMPITEN — y no es que sean dos, es que son IGUALES

Los dos controles contestan preguntas de **naturaleza distinta**:

| control | qué cambia | qué clase de elección es |
|---|---|---|
| **Tu local · Tu stock** | **QUÉ estás viendo** | **navegación** — dos temas distintos |
| **Administrar ⇄ Ver como cliente** | **CON QUÉ OJOS** lo ves | **lente** — el mismo tema, otra mirada |

> ## **DOS CONTROLES QUE SE VEN IGUALES DECLARAN QUE SON LA MISMA CLASE DE ELECCIÓN.**
> Y no lo son: uno cambia el tema, el otro cambia la mirada. *El vendedor
> no se confunde por tener dos controles — se confunde porque los dos le
> dicen «elegí una de estas dos» con la misma voz.*

**Y hay una asimetría que el segmentado NIEGA, y es la llave:**
`administrar` **no es un par** de `ver como cliente`. Administrar es el
estado natural del vendedor en su propia tienda; ver como cliente es
**asomarse un momento**. *Un segmentado dice «estos dos son iguales» —y
acá uno es la casa y el otro es la ventana.*

---

## §2 · LA DECISIÓN

> ## **EL DE AFUERA SE QUEDA SEGMENTADO. EL DEL ESPEJO DEJA DE SERLO: PASA A `Interruptor`.**

- **Tu local · Tu stock → `SelectorSegmentado`.** Es navegación entre dos
  partes, es firmado, y es exactamente para lo que la Ley 19.3 lo reserva
  (vistas exclusivas 2-3).
- **Ver como cliente → `Interruptor`**, con su etiqueta. **Encendido = lo
  estás viendo como la familia.**

### Las tres razones, en orden de peso

1. **Deja de parecerse.** Un interruptor **no puede confundirse** con la
   navegación de secciones: son dos formas distintas para dos clases
   distintas. *El problema se disuelve en vez de negociarse.*
2. **Dice la verdad de la asimetría.** Un interruptor tiene un estado
   natural (apagado) y uno que se enciende — que es **exactamente** la
   relación entre administrar y asomarse.
3. **🔴 Gana en el modo de falla, que es lo que decide.** El estado
   peligroso es **estar en «ver como cliente» sin darse cuenta** y no
   entender por qué nada se toca. Un interruptor **muestra su estado
   siempre**; un segmentado también, pero *un segmentado con un lado
   activo se lee como «estoy en esta sección», y ése es el mensaje
   equivocado*.

### ⛔ Lo que se descartó, con su razón

- **Mover el espejo al techo** para separarlo de plano: no cura nada —
  seguiría siendo un segmentado, y el vendedor seguiría teniendo dos
  controles gemelos en la misma pantalla.
- **Volverlo un `Boton` que nombra el destino** («Ver como cliente ›»):
  comunica la ACCIÓN pero **no el ESTADO**, y el estado es justo lo que
  falla arriba.

---

## §3 · DÓNDE VIVE — y sale de una ley que ya escribí

**Pegado al contenido que afecta**, o sea al encabezado de la sección de
stock/vitrina — **jamás arriba de todo, al lado del que navega.**

Es la misma ley de la ficha en modo Administrar: ***el control vive sobre
el dato que cambia.*** Acá el «dato» es la vitrina entera, así que el
control va en su cabecera. *Ponerlo arriba del todo lo devolvería al lugar
donde compite, que es de donde lo estamos sacando.*

```
◌  Tu tienda                                    ← techo: isotipo + nombre
   [ Tu local │ Tu stock ]                      ← navegación (segmentado)

   TU STOCK          399 productos · 26 sin precio    ← §gramática de sección
   Ver como cliente  ( ●———)                          ← el espejo, sobre lo que afecta
   …la vitrina…
```

---

## §4 · LO QUE ESTO **NO** CAMBIA

1. **La regla de C sigue rigiendo entera:** *cambiar de modo cambia CÓMO
   se ve, jamás QUÉ se ve.* **Lo único que cambia es la ROPA del control**,
   no lo que hace ni lo que garantiza.
2. **`InterruptorEspejo` no muere: cambia por dentro.** Hoy monta un
   `SelectorSegmentado`; pasa a montar un `Interruptor`. **Su API no se
   toca** (`modo` + `onCambio`), así que **sus consumidores no se enteran**
   — y eso es lo que hace que esto sea barato.
3. **La ficha de producto conserva su propio interruptor**, porque ahí el
   espejo también rige y ahí no hay con quién competir.

## §5 · LO QUE NO DECIDE

1. **Las voces** — del riel.
2. **Si «Tu local» también necesita espejo**: hoy no lo pide nadie, y *un
   espejo sin nada que espejar es un control que enseña a ignorarlo*.
3. **El ojo**, con su pregunta: *con los dos controles en pantalla, ¿sabés
   sin pensar cuál cambia de tema y cuál cambia de mirada?* **Si hay que
   pensarlo, todavía se parecen demasiado.**
