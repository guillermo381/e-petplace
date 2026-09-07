# Dirección de diseño del perfil — S113-B · B6

**Sobre la pantalla real**, no sobre una composición: capturas en
`docs/loop/capturas-s113-b-2.1/b6-perfil-real-0{1..5}.png`, perfil de Thor,
cuenta del founder, emulador (`ARRANQUE7 20:13:23` → `Bundled` 20:13:45).

**Cómo leerla:** son **once cambios con su renglón**, ordenados por lo que más
cambia la lectura. No son principios — los principios ya están en
`DIRECCION_ARTE` y se citan donde mandan. **Las tres primeras son las que
cambian la pantalla; el resto es aire y ritmo.**

---

## Lo que PRESIDE hoy y no debería

### ① «Sin fecha de refuerzo» preside con el peso de un dato que sí existe
`b6-perfil-real-05` · celda *Vacunas*, en display grande y a dos líneas.
**Una ausencia no se dibuja como un valor.** Al lado, *Peso* dice `24 kg ↑` con
la misma tipografía: la pantalla iguala «lo medimos» con «no lo sabemos».

**Hacer:** la ausencia baja a `variante="apoyo"` y **el dato que sí hay sube**
— la celda de vacunas tiene `8 en el carnet`, que es su valor real. Queda
*«8 en el carnet»* en display y *«sin fecha de refuerzo»* como su contexto.
*Ley 19.9: lo que el dato no sabe se dice, no se agranda.*

### ② «94062» está impreso en la franja de alergias
`b6-perfil-real-03/05` · *«Alérgico a pollo · Alérgico a polen 94062»*.
Un id se coló en la voz. **Es lo primero que se ve de la salud de Thor** y es
la franja que existe para que alguien no le dé de comer algo que le hace mal.

**Hacer:** cortar el id en el compositor de la voz. *Un número sin unidad
dentro de una frase clínica se lee como una dosis.*

### ③ La invitación —la pieza más invitante del perfil— está truncada y no se ve tocable
`b6-perfil-real-03/05` · *«Thor está en su etapa adulto. ¿Quieres contarnos…»*
Se corta con puntos suspensivos **justo antes del verbo que invita**, y no
tiene chevron ni caja: se lee como una nota al pie.

**Hacer:** montar **`BotonContanos`** (ya entregado, `packages/ui`): sin
`numberOfLines`, con la primitiva de chevron y target 44.
*Ley 19.7: lo secundario baja a label, y la que baja tiene forma nombrada —
texto + chevron.* **Y la voz entera**: `«Contanos lo que hace único a Thor»`.

---

## Jerarquía

### ④ Dos rótulos de sección con dos pesos
«Identidad» y «Cómo está hoy» son grandes; «Pasaporte y QR» y «Vacunas» son
más chicos. Son el mismo nivel del árbol.

**Hacer:** los cuatro con `Texto variante="seccion"`. *Si dos cosas del mismo
nivel se ven distinto, la persona busca una jerarquía que no existe.*

### ⑤ La raza y su invitación están separadas por un hueco
La tarjeta *Bulldog inglés* y el *«Contanos…»* hablan de lo mismo —lo general
y lo propio— y hoy son dos bloques con aire entre medio.

**Hacer:** la invitación entra **al slot `cierre` de `FichaRaza`** (ya existe).
⚠️ **Con la ficha cerrada ese slot no se dibuja** —medido— así que **el perfil
conserva además su acceso propio**: la pastilla *«Conociéndolo · N por
resolver»*, que desaparece sola al llegar a cero.

### ⑥ «Pasaporte y QR» tiene rótulo y subtítulo, y debajo aparece la raza
El rótulo anuncia una sección que no se ve; lo siguiente es de otro tema.

**Hacer:** o la tarjeta del pasaporte va inmediatamente debajo de su rótulo, o
el rótulo no se dibuja. *Un título sin su contenido se lee como algo que falló
al cargar.*

---

## Aire y ritmo

### ⑦ El bloque de identidad respira distinto adentro que afuera
Las filas de la tarjeta están cómodas; entre bloques hay saltos desiguales
(mucho antes de «Cómo está hoy», poco antes de «Vacunas»).

**Hacer:** **un solo `spacing[6]` entre bloques de sección** y `spacing[3]`
dentro. Nada de valores intermedios por bloque.

### ⑧ Las cuatro celdas de «Cómo está hoy» no tienen la misma altura
*Desparasitación* queda con un hueco abajo porque su chip ocupa menos que dos
líneas de texto.

**Hacer:** `alignItems: 'stretch'` en la fila. *Cuatro celdas que dicen lo
mismo tienen que pesar lo mismo; una más corta se lee como una con menos.*

### ⑨ El orbe del Coach tapa el chevron de la última fila visible
Se ve en `b6-perfil-real-01` (sobre «Talla y pelaje») y en `03`.

**Hacer:** la cola del scroll usa `COLA_PRESENCIA_COACH`, que la pieza ya
exporta derivada. *Hoy hay un chevron que no se puede tocar porque el orbe
está encima.*

---

## Tipografía

### ⑩ La línea bajo el nombre mezcla dos registros
`bulldog inglés · 6 años · 24 kg` va en **mono**, y mono es de metadata: fecha,
código, id. Acá son tres datos de identidad.

**Hacer:** sans, `variante="apoyo"`. *Ley 3 y el matiz de S99: mono para
metadata, display/sans para lo que se lee como prosa.* **El peso `24 kg` sí es
mono** cuando aparece como dato en su celda — ahí es una medición.

### ⑪ «Cuidado al día» va en mono sobre la foto
Mismo caso: es un estado, no un código.

**Hacer:** sans. El mono lo reserva la casa para lo que se copia o se verifica.

---

## Lo que NO hay que tocar

**El hero funciona**: la foto preside, el nombre en display sobre el gradiente,
y el estado colgado de la foto es exactamente *«la mascota preside»* (§P3).
**El par 18/8 tampoco**: dos números grandes y nada más, sin barra ni progreso.
**Y la franja de alergias en ocre está bien como tinte** —`R20`— más allá del
id que hay que sacar.

---

## Quién hace qué

**C aplica.** Las piezas que hacen falta ya están entregadas en `packages/ui`:
`BotonContanos` · `PastillaConociendolo` · `HojaContanos` · el slot `cierre` de
`FichaRaza` · `COLA_PRESENCIA_COACH`.
**A captura el antes/después**; el antes ya está en este mismo directorio.

⚠️ **Lo que esta dirección NO decide:** el orden de las secciones. *Cambiarlo es
producto, no diseño*, y no hay medición que lo respalde: lo que se ve mal es el
peso y el aire, no la secuencia.
