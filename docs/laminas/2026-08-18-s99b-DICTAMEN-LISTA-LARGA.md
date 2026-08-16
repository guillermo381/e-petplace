# DICTAMEN — LA LISTA LARGA: cómo se recorre y qué exige del motor

**Estatuto:** Toque 1. **Desbloquea a A**, que necesita el contrato antes
de escribir (`listarSkusDelVendedor`, 722 filas, sin techo).

---

## §1 · LA DECISIÓN, en una línea

> ## **CARGA AL LLEGAR AL FINAL — JAMÁS UN BOTÓN. Y el contrato es por CURSOR, no por offset.**
> **El contrato PAGINA; la forma no muestra la paginación.**

Las dos mitades son independientes y las dos están decididas: **la forma
ya está firmada por uso**, y **el mecanismo lo decide un hecho del
producto, no un gusto.**

---

## §2 · POR QUÉ NO ES UN BOTÓN — y no lo estoy decidiendo yo ahora

**Ya está construido y con su razón escrita**, en `ventas/vitrina.tsx`:

```
TAM_VENTANA = 30
«Carga al llegar al final, JAMÁS un botón»
```

⇒ **la mecánica de lista de esta app ya existe.** Poner un botón en Stock
crearía **dos vocabularios de lista en la misma app**, y el vendedor
tendría que aprender que una lista se sigue sola y la otra se pide. *Esa
es la clase de diferencia que nadie explica y todos pagan.*

### ⚠️ Y EL BOTÓN NO APORTA LO QUE PARECE APORTAR

L-268 cura **no saber cuántos hay** —*«una lista de 722 recortada a 100
se ve idéntica a una de 100 completa»*—. **Eso lo cura el TOTAL, no el
botón.** Un botón que existe para informar es **un cartel con un tap de
más**: informa una vez, y después estorba 23 veces.

⇒ **el total es obligatorio en cualquiera de las dos formas**, y por eso
no puede ser el argumento que elija entre ellas.

---

## §3 · 🔴 CURSOR Y NO OFFSET — y acá sí decide un hecho, no una preferencia

**El hecho: en Stock, el que lee la lista es el que la está moviendo.**
Esa pantalla existe para publicar, despublicar y ajustar — o sea que el
conjunto **cambia mientras se recorre**.

Con **offset**, si entre la página 1 y la 2 se publica o se despublica un
SKU, **la 2 repite o saltea filas**. Con 722 filas eso son **24 páginas**:
la ventana para que ocurra no es teórica, **es el caso normal**.

> ***Offset asume una lista quieta. Acá el que la lee es el que la mueve.***

**Y el defecto que produce es el peor de todos: silencioso.** Nadie ve un
error; ve un producto repetido —o no ve uno que existe— y **le echa la
culpa al catálogo, no a la lista.**

---

## §4 · EL ORDEN ESTABLE ES PRECONDICIÓN, NO ADORNO

El tercer hallazgo de A es exacto: *«la paginación sin orden estable no es
paginación: es una lotería que se ve prolija»*. **Con cursor deja de ser
una advertencia y pasa a ser estructural: un cursor ES una posición en un
orden.** Sin orden, no hay cursor que escribir.

**El orden propuesto: `nombre ASC, id ASC`.**
- **`nombre`** porque es como el vendedor busca — el orden tiene que
  servir a quien recorre, no al que consulta.
- **`id` como desempate, y no es prolijidad:** sin él, **dos productos con
  el mismo nombre rompen el cursor**. En un catálogo de 722 con variantes,
  los homónimos no son el borde: son lo normal.

---

## §5 · LO QUE LA FORMA LE EXIGE AL CONTRATO (para escribirlo una vez)

| exige | por qué |
|---|---|
| **el TOTAL**, no solo la página | sin él la lista miente (L-268), y el encabezado de sección no puede declarar su estado |
| **el cursor siguiente** | es la posición, no un número de página |
| **decir que NO HAY MÁS** (`sinMas`) | **el final se DICE.** Sin eso el vendedor no distingue «terminó» de «falló» |
| **poder decir que FALLÓ traer más** | 🔴 una lista que deja de crecer **en silencio** se lee como que terminó — es L-268 aplicada a la cola, y sin un estado propio en el contrato la pantalla no puede decirlo |

**Y del lado de la forma, ya decidido en la receta de Stock:** ventana de
**30**, y **la siguiente tanda se pide a la fila 20**, no al final —
*cargar cuando ya no hay nada abajo es cargar tarde.*

---

## §6 · LO QUE NO CAMBIA, Y CONVIENE DECIRLO

**La ventana de la vitrina hoy corta un array en memoria** (declarado por
C: *«no pide nada al servidor»*). Con 722 eso deja de valer, y **lo único
que cambia es de dónde vienen las filas**: la mecánica que el vendedor ve
—scroll que sigue, sin botón— es exactamente la misma.

*Un cambio de contrato que no cambia el gesto es el mejor tipo de cambio
de contrato.*

## §7 · Y EL HALLAZGO QUE ESTO DEJA A LA VISTA

**Con 722 filas, la lista NO es el camino a un producto concreto — el
camino es el buscador**, que C ya construyó en la vitrina *«porque el
founder lo pidió con 399 en pantalla»*.

⇒ **la paginación es el recorrido, no la búsqueda.** Vale escribirlo
porque decide una prioridad: si algún día hay que elegir entre pulir la
carga incremental y pulir el buscador, **gana el buscador** — es el que
usa el vendedor que sabe qué quiere, que es el caso frecuente en una
pantalla de administración.

## §8 · LO QUE ESTE DICTAMEN NO DECIDE

1. **Los nombres del contrato** — son de A.
2. **Si el orden debería ser configurable** (por stock, por precio): hoy
   no hay pedido; el día que lo haya, **cada orden necesita su propio
   desempate**, no solo su columna.
3. **El ojo**, con su pregunta: *scrolleando Stock, ¿en algún momento
   sentís que la lista se colgó?* **Si la respuesta es sí, el problema no
   es la ventana: es que el final o el fallo no se están diciendo.**
