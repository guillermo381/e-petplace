# S116-B · LOTE 3c — las dos marcas de agua mueren, y la curva invertida se vuelve inexpresable

**Rama `pista/s116-b-05`** (con `origin/main` mergeado antes de tocar).

**Gates:** `verify:diseno` VERDE (81) · `verify:contrast` 479/0 · `verify:catalogo-v5` VERDE · `verify:techos-locales` VERDE · `tsc` 0 en las cuatro.

---

## ① LAS DOS MARCAS DE AGUA — dónde vivían y qué las montaba

| archivo:línea | qué era | pantalla |
|---|---|---|
| `apps/cliente/src/app/(tabs)/hogar/index.tsx:1781` | isotipo viejo, tinta al **6 %**, `size 210`, centrado y fijo | **el Hogar** |
| `apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx:1124` | isotipo viejo, tinta al **4 %**, `size 1000`, **sangrado por los cuatro lados** | **el Expediente** |

**Las dos eran `@override-s82c` locales de su pantalla** — ninguna venía de una pieza. *Por eso no salían en el censo de `MarcaDeAgua`: esa pieza la enciende **sólo el prestador** (`apps/prestador/_layout.tsx:217`), y en el cliente nadie la monta.*

**Se retiran por la misma razón que el isotipo derivado de las cabeceras (lote 10): el dibujo no representa la marca.** *No es una decisión de dosis ni de opacidad — bajarle el alfa habría sido dejarlo puesto con menos discusión.*

### Lo que se va con ellas, y no es sólo un dibujo

🔴 **La del Hogar cerraba una tensión abierta.** Su propio comentario declaraba un **choque con la Ley 4** —*«isotipo UNO por pantalla y el techo ya lleva el suyo»*— y lo dejaba *«para que el gate resuelva»*. **El gate resolvió, y resolvió que no va.** *Una tensión que se cierra sacando una de las dos partes no deja deuda: deja una ley que vuelve a valer.*

🔴 **Y la del Expediente se llevó su propio argumento.** Estaba escalada a `size 1000` para salirse por los cuatro lados, con esta letra: *«una forma completa es una marca; cortada es papel — así la Ley 4 no muerde»*. **Ese argumento es justamente el que cae:** sangrarlo lo volvía papel *para la Ley 4*, **pero seguía siendo el dibujo viejo**. *Recortar una marca que no representa a la casa no la convierte en textura: la convierte en esa misma marca, más difícil de señalar.*

### ⚠️ EL VACÍO NO SE RELLENÓ, y lo digo en vez de taparlo

En las dos queda **`bg.base` liso**. No puse nada en su lugar.

> **El fondo del expediente nunca pidió una textura: la recibió con una lámina.** Y en el Hogar lo mismo. *Si ese fondo pide algo, lo va a pedir mirándolo vacío — poner otra textura ahora sería contestar una pregunta que nadie hizo todavía.*

---

## ② EL CENSO — todo el isotipo viejo que queda en superficie del cliente

**Cinco montajes de `<Isotipo>` vivos** (el sexto, `index.tsx:168`, ya es **`IsotipoV5`** ✅):

| archivo:línea | tamaño · variante | dónde se ve |
|---|---|---|
| `app/(tabs)/hogar/index.tsx:654` | `28` · `blanco` | **el techo del Hogar** — el lockup de la banda |
| `app/(tabs)/hogar/vacunas/[mascotaId].tsx:298` | `32` · `blanco`/`gradiente` | carné de vacunas |
| `app/invitacion.tsx:125` | `64` · `gradiente` | la pantalla de invitación |
| `components/reserva-piezas.tsx:172` | `20` · teñido al oficio | pieza local de reserva |
| `app/index.tsx:168` | — | ✅ **ya es `IsotipoV5`** |

⚠️ **Los cuatro que quedan NO son marcas de agua: son el isotipo usado como marca, a la vista.** *Tu orden fue retirar las dos aguas; estos cuatro los declaro y no los toco — cambiarlos es cambiar cómo se firma la casa en cuatro pantallas, y eso no es de este lote.* **Si «en ningún lado» incluye estos cuatro, es una línea por cada uno** (`Isotipo` → `IsotipoV5`) y entra en el próximo.

---

## ③ LA CURVA INVERTIDA — inexpresable, no documentada

`presentacion="fondo"` **ya no puede dibujar radio inferior ni sombra**. Antes era un objeto con dos ternarios (`esFondo ? 0 : …`); ahora son **dos objetos separados** y el del fondo **no tiene esas claves**.

> **Un ternario documenta la regla; dos objetos la hacen imposible.** Con el ternario el radio **seguía estando en el estilo del fondo, valiendo `0`** — alcanzaba con que alguien lo cambiara, lo copiara, o agregara el tercer caso *«fondo pero con un bordecito»*. **Ahora no hay qué cambiar.**

*La curva de abajo es de una tarjeta apoyada sobre algo; el fondo no está apoyado sobre nada — es lo que está debajo de todo.*

### Los consumidores de `Cabecera` en el cliente: **10**, de los cuales **3 usan `tarjeta`**

| presentación | cuántos | cuáles |
|---|--:|---|
| `fondo` | **7** | `login` · `registro` · `recuperar` · `alta/PasoDatosBasicos` · `alta/PasoRazaFicha` · `alta/PasoFoto` · `alta/PasoCarnet` |
| **`tarjeta`** (el default) | **3** | `(tabs)/hogar/index.tsx` · `postventa/caso/[casoId].tsx` · `adoptar/solicitud/[solicitudId].tsx` |

🔴 **Esos tres son los que siguen dibujando la curva invertida, y el default es la razón:** *`tarjeta` se hereda sin escribir nada, así que una pantalla la elige por omisión — y las tres que la tienen es porque nadie decidió lo contrario.* **La cura de la pieza no los alcanza** (la tarjeta sí lleva su curva, y debe llevarla): **pasarlos a `fondo` es una prop por pantalla, y es de C.**
