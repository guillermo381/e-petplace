# LA GRAMÁTICA DE BLOQUE — ver el estado sin entrar

**Estatuto:** Toque 1. Cierra el hueco que el founder nombró: *«configuración
todavía no tiene la vista completa… falta simplemente que le pongamos la
ficha al repartidor»*, ya destilado por la mesa a lo que de verdad falta —
**que el estado se vea sin tener que entrar**.

**Su guarda, que es lo que lo hace difícil:** §D2 sobrevive —*en
configuración todo se lista en filas; el bloque es la pantalla a la que la
fila lleva*— así que esto **no puede volver la pantalla de dos gramáticas.**

---

## §1 · 🔴 LO MEDIDO PRIMERO — Y EL HUECO NO ESTÁ DONDE YO LO BUSCABA

Fui a buscar una colisión en la fila del repartidor y **no existe**: C la
resolvió con dos slots distintos (verificado contra `origin/main`):

```
subtitulo    → las EXCEPCIONES  (inactivo · sin reclamar, compuestas)
metadataMono → vehículo · placa (la firma de §B3, y en mono como pedía)
```

**La fila ya dice quién es, cómo se lo reconoce y qué le pasa.** *Buscar
ahí era buscar donde ya estaba resuelto.*

**El hueco está UN PISO MÁS ARRIBA**, y también se midió: las secciones de
configuración (`Local`, `Turnos`, `Repartidores`, …) son
`<Texto variante="seccion">` **con su título y nada más**.

> ⇒ Para saber cómo está su configuración, el vendedor **tiene que
> recorrer y leer cada lista**. No hay ningún piso donde su operación se
> vea de un vistazo — y **ése es exactamente «el estado sin entrar»**.

---

## §2 · LA LEY, en una línea

> ## **CADA SECCIÓN DECLARA SU ESTADO EN SU ENCABEZADO. LA FILA NO CAMBIA.**
> El bloque es la **SECCIÓN**, no el ítem.

**Y así la guarda se cumple sola, sin negociar nada:** siguen habiendo
**una gramática de ítem** (la fila, con su ficha detrás) y **una gramática
de sección** (encabezado · filas · alta). *Lo que no hay —y es lo que el
founder prohibió— es un ítem dibujado distinto de sus hermanos.*

### La anatomía

```
Repartidores                    3 · 2 activos     ← ① el estado del CONJUNTO
┌──────────────────────────────────────────┐
│ [ ] Diego Salinas          AB 123 C   ›  │     ← ② las filas, intactas
│ [ ] Marco Ruiz    Sin reclamar        ›  │
└──────────────────────────────────────────┘
  + Agregar repartidor                          ← ③ el alta
```

**⚠️ El encabezado NO es una fila y no se toca.** Informa; la acción vive
en las filas y en el alta. *Es 19.7 al pie: información despliega, acción
lleva — y esto no hace ninguna de las dos, así que no lleva ni chevron ni
tap.*

---

## §3 · QUÉ CUENTA COMO ESTADO DE SECCIÓN

> **Un hecho DE CONJUNTO que el vendedor no puede deducir mirando una
> fila.**

| ✅ entra | ⛔ no entra |
|---|---|
| «3 · 2 activos» — hay que **contar** para saberlo | repetir lo que ya dice una fila |
| «falta la dirección» — **no está en ninguna fila**, falta la sección entera | un adorno («todo en orden ✓») que no cambia nada |
| «sin turnos» — el conjunto vacío | el detalle de un ítem: eso es de la ficha |

## §4 · 🔴 LOS TRES ESTADOS, Y NINGUNO PUEDE CALLAR IGUAL QUE OTRO

**Ésta es la parte que se hace mal en silencio**, y la casa ya la pagó una
vez con los alérgenos:

| estado | qué dice | por qué |
|---|---|---|
| **completa** | el hecho en positivo y breve — *«3 · 2 activos»* | **si callara, se vería igual que una sección que no cargó** |
| **incompleta** | **qué falta**, en tono de aviso | Ley 23: se dice antes de que lo intente |
| **vacía** | que está vacía (ya existe `sinRepartidores`) | una lista sin filas y una lista que no cargó no son lo mismo |

> **La regla que los une: una sección sana y una sección sin datos NO PUEDEN
> VERSE IGUAL.** *Es la letra de `AvisoAlergia` aplicada a otra cosa — el
> silencio se lee como «está bien», y esa lectura la hace el vendedor, no
> nosotros.*

---

## §5 · POR QUÉ NO SE AGRANDA `Celda` A TRES RENGLONES

Era la salida obvia y **se descarta con medición**: `Celda` tiene **un**
`subtitulo`, y sus dos slots ya están tomados por dos firmas distintas
(§1). Meter un tercer renglón:

1. **no resolvería el pedido** — el estado que falta es **de conjunto**, y
   un conjunto no cabe en la fila de UN ítem;
2. **tocaría las 100+ filas de las dos apps** para servir a una pantalla;
3. y **empujaría la altura de la fila**, justo después de que la fila de
   Stock quedara fijada en 56 por aritmética.

*Agrandar la pieza para contestar una pregunta que no es de la pieza es la
cura equivocada con mejor cara.*

---

## §6 · LO QUE NO DECIDE

1. **Las voces exactas de cada sección** — son de producto y del riel.
2. **Si el estado de sección también va en HOY** — ahí la pregunta es otra
   (*qué hago ahora*), y mezclarlas sería traer configuración a la
   operación.
3. **El ojo**, con su pregunta: *entrando a configuración y sin scrollear
   hasta el fondo, ¿sabés qué te falta?* **Si hace falta recorrer las
   listas para contestarlo, el encabezado no está diciendo lo que tiene
   que decir.**
