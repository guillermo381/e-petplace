# S106-B · PARTE DE CIERRE — lo que la sesión nueva necesita para arrancar sin mí

> **Tres ramas, las tres en origin y verificadas por SHA. Tres worktrees limpios.
> Ningún proceso vivo.**
>
> | rama | SHA | qué trae |
> |---|---|---|
> | `pista/s106-b` | `6f4da78c` | tanda 1 · el aviso de tres, la marca de modalidad, `R67` |
> | `pista/s106-b2` | `d2bba235` | tanda 2 · las piezas de la videollamada y la clase «control sobre video» |
> | `pista/s106-b3` | `f9c1cd9c` | tanda 3 · las curas del gate, `AccionQueLleva`, `R68` |

---

# 🔴 LO PRIMERO: GIRAR CÁMARA — hay una cura SIN VERIFICAR

**El estado ya no es «el botón no está».** El founder contó y ve **CUATRO
controles con el tercero vacío**: *«uno en el CENTRO que no hace nada
literalmente»*. **El botón se monta; su dibujo no aparece.**

**Y hay una cura hecha que NADIE gateó todavía** (commit `db42037e`): re-dibujé
el glifo con la **anatomía probada** de los tres que sí se ven. ⇒ **lo primero
de la sesión nueva no es investigar: es mirar si el re-dibujo funcionó.**

## Las cuatro mediciones que dicen «está», contra el ojo que dice «no»

**Y qué mide exactamente cada una — porque ahí está la trampa:**

| # | medición | qué mide **de verdad** |
|---|---|---|
| ① | **mi glifo dibuja** (154/156 px claros) | **SVG en un NAVEGADOR** |
| ② | **C pasa la prop** (`onGirarCamara` en las dos pantallas) | el **código fuente** |
| ③ | **el código viajó en la build** (`merge-base --is-ancestor 91d497aa 71e731af`) | que el commit **está adentro** |
| ④ | **la voz resuelve** (keys tipadas: no compilaría) | la **compilación** |

> ### 🔴 **NINGUNA de las cuatro mira el árbol renderizado en el aparato. Y la ① es la que más se parece a «mirar» y sin embargo mira otra cosa: `react-native-svg` NO es el SVG del navegador — traduce a vistas nativas, y ahí el mismo path puede comportarse distinto.**

**Las dos rarezas que el glifo viejo tenía y ninguno de los otros tres**
—`opacity={0.9}` y **tres elementos pintados con el color del fondo**— **siguen
siendo los únicos sospechosos**, y la ① probó que **no es el SVG en sí**. ⇒ si
tras el re-dibujo el botón aparece, era una de esas dos y ya está curado; si
sigue vacío, **la causa está en la traducción a nativo** y ahí sí hace falta
mirar el árbol con A al lado.

⚠️ **Precondición del gate:** el bundle tiene que incluir `db42037e`
(el re-dibujo) **y** `a08f37a3` (el orden). Se verifica con el ancla del
publish, **no de memoria**.

---

# LO ENTREGADO Y VERDE

## `R68` — nada del componente dentro de un worklet de gesto
**59 reglas, verde.** 56 callbacks en 22 piezas · 4 exentos. Nace de **tres
crashes que encontró el founder usando la app y ningún gate**.
**Su fixture es el caso real** (`runOnJS(pegar)(masCercana(…))`): el `runOnJS`
correcto y **el ARGUMENTO cruzando**. Tres exenciones, las tres medidas contra
el código real y no escritas de memoria: `.runOnJS(true)` en la cadena ·
funciones `'worklet'` · `scheduleOnRN` y keywords.

## `R67` — el aviso no se acorta
Lee **las tres formas** del diccionario y **la letra por ancla estructural**
(`^> - `). Los seis signos verificados; el fixture ampuTA **el sexto**, que es el
único que prueba que la cura de la cuenta funcionó.

## Las piezas
`AvisoTeleconsulta` (tres acciones con forma: dos `CeldaNavegacion` + un
`Boton secundario`) · la clase **«control sobre video»** con sus 8 pares medidos
· `SuperficieLlamada` · `ModalDosAlturas` · `TemporizadorLlamada` (fuera del
ocultado, con su banda) · **`AccionQueLleva`** (nueva) · el toggle de **altavoz,
que se dibuja SIEMPRE** (corrección de firma: el default respeta lo enchufado,
la existencia del control no).

---

# 🔴 LO QUE QUEDÓ MÍO Y SIN CERRAR

| qué | estado |
|---|---|
| **girar cámara** | cura sin gatear (arriba) |
| **el asa** | el founder la ve como *«una rayita»*. **C mide primero si es la pieza o el montaje.** Mi lado medido: `ASA_ALTO 28`, rayita `40×4` — **dentro de la convención**, así que sospecho que **no es el tamaño sino que nada dice que hay algo abajo**. *Una rayita sobre una foto es una rayita; la misma sobre un borde de panel es un asa.* |
| **el encabezado con isotipo** | si C lo pide |
| **el contrato de altavoz** | 🔴 **las dos apps en ROJO a propósito**: `onAltavoz` y `vozControles.altavoz` son obligatorias y **las cablea C**. `packages/ui` verde. *Es un contrato reclamando, no un typecheck roto* |

---

# LOS NÚMEROS QUE NO HAY QUE RE-MEDIR

## El ancho de la barra — llegó a su techo
```
5 controles: 4×48 + 60 + 4×12 = 300 px  → 10 px/lado en 320 · 30 en 360
a md=52 eran 316 → 2 px/lado en 320 (sin aire) ⇒ md bajó a 48
```
**48 es el piso** (target táctil mínimo 44). **Un SEXTO control lleva la fila a
`5×48 + 60 + 5×12 = 360` ⇒ no entra ni en 360.** *La salida entonces no es
achicar el disco —se rompe el target— sino decidir qué sale de la barra.*

## El inventario de piezas sin montar — **dato, NO regla**
De **114 exportadas**: 14 sin uso en apps y, descontando las **internas** (las
monta otra pieza), **5 que nadie monta**:
`LineaDeVidaNodo · ConsecuenciasDelCierre · CantoMarca · AccionQueLleva ·
CierreEnCurso`.
**No nace regla**: `AccionQueLleva` está ahí **siendo correcta** (entregada,
esperando a C) — *un trinquete arrancaría acusando a una pieza sana.*

## 🔴 «Entregada ≠ montada» — NO SE PUEDE VIGILAR (para que nadie lo reintente)
Los cuatro casos que motivaron el encargo —asa, temporizador, dictado, girar
cámara— **estaban todos MONTADOS**. Girar cámara tenía la pieza montada, la prop
pasada, y el defecto era de **render**.

> **Lo que separa «entregada» de «montada» ahí no es estructural —no hay símbolo
> ausente que buscar— es que la pieza está y no cumple su efecto.** Eso solo lo
> dice un ojo en un aparato, y por eso los cuatro los encontró el founder.

---

# LOS CRITERIOS QUE LA MESA REGISTRÓ EN ESTA SESIÓN

*No los repito para lucirlos: son las decisiones que la sesión nueva va a tener
que aplicar sin poder preguntarme.*

- **Una preferencia contra una medición pierde**, incluso cuando la preferencia
  es la que estaba escrita.
- **Un patrón escrito es lo que la próxima sesión cree sin volver a medirlo.**
- **Un candado obliga a contar; no puede obligar a contar bien.**
- **La paridad se cumplía en la forma y se violaba en el efecto** — las tres
  acciones se veían igual **de muertas**. *Un chevron no baja disponibilidad: la
  sube.*
- **Un destructivo entre dos reversibles es el peor lugar donde puede estar:**
  el pulgar lo encuentra buscando otra cosa.
- **Exceptuar un elemento del ocultado no es moverlo de contenedor: es darle el
  piso que el contenedor le prestaba.**
- **Un guard que falla en su propio caso testigo no es un guard: es una regla
  que da verde.**
