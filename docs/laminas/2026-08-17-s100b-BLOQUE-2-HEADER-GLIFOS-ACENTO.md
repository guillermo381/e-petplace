# S100b-B · BLOQUE ② — HEADER, GLIFOS Y ACENTO, medidos sobre lo re-derivado

> **Medición, no receta.** Instrumento: SM-S938B (384 × 832 dp) · bounds por `uiautomator` ·
> píxeles por PIL · censo de acento con `scripts/censar-acento.py`.
> **Lo que es impresión va rotulado como impresión.**

---

## 🔴 §1 · EL ACENTO — el founder lo pidió expreso, y ahora tiene número

**N5 es ley firmada —*un acento por pantalla*— y hasta hoy no tenía instrumento:** se cumplía por
criterio de quien construía. `censar-acento.py` cuenta **píxeles de una captura real**, no
declaraciones en el código. *Un `accent.` declarado una vez puede ocupar media pantalla, y diez
declaraciones pueden no verse.*

| pantalla | píxeles de marca en el contenido | familias presentes |
|---|---|---|
| **vitrina** | **1.34 %** | magentaDark 1.17 · pinkDark 0.12 · ctaOro 0.05 · pink 0.00 |
| **carrito** | **6.05 %** | **ctaOro 5.96** · magentaDark 0.08 · pinkDark 0.01 |
| **entrega** | **6.31 %** | **ctaOro 5.95** · magentaDark 0.36 |
| **ficha** | **0.77 %** | magentaDark 0.44 · pinkDark 0.32 |
| **en camino** | **0.13 %** | magentaDark 0.13 · tealDark 0.01 |

### La prueba que el founder pidió: *«si tapás el botón principal, ¿queda algo compitiendo?»*

| pantalla | tapando el CTA queda | veredicto |
|---|---|---|
| **carrito** | **0.09 %** | ✅ el oro manda solo |
| **entrega** | **0.36 %** — el chip *«Envío a domicilio»* elegido + el foco del campo | ⚠️ compite poco, pero compite |
| **vitrina** | **🔴 no hay un botón principal que tapar** | ver abajo |

> ### 🔴 EL HALLAZGO DE LA VITRINA: NO GASTA UN ACENTO, GASTA N
>
> Su 1.17 % de magenta **no es un CTA: son los `+` de cada tarjeta**, todos idénticos y repetidos.
> **N5 pide un acento por pantalla y la vitrina tiene uno por PRODUCTO.**
>
> *Es la ley de la vuelta en el dominio del color: el único elemento saturado de la pantalla es el
> control, repetido tantas veces como mercadería haya.* Y explica por qué el `+` «pesa» aunque
> mida apenas 36 dp — **no pesa por su tamaño: pesa por su cardinalidad.**
>
> ⚠️ **Esto NO se cura achicando más el `+`** (ya está en 36 con blanco táctil de 44, y Baymard
> recomienda el control de cantidad en la grilla para grocery). **Es decisión de forma para la
> re-derivación**, y va al founder con el número, no resuelta acá.

### Y el acento cambia de familia entre temas — confirmado por segundo instrumento

| tema | la barra de tabs gasta |
|---|---|
| claro | **magentaDark `#8E1F68`** · 5820 px |
| oscuro | **ctaOro `#FCBC1D`** · 5840 px |

**Misma forma, casi los mismos píxeles, otra familia de marca.** Dos mediciones independientes
—muestreo puntual y censo de área— dan lo mismo. *Se declara como medición y no como veredicto:
puede ser el slot resolviendo por tema, pero **la letra que encontré no lo dice**, y un acento que
cambia de familia entre temas deja de ser el acento de la marca y pasa a ser el del tema.*

---

## §2 · EL HEADER — 156 dp que no ceden nada

| | nuestro (vitrina) | Laika (listado) |
|---|---|---|
| **alto hasta el primer contenido** | **156.4 dp** | **149 dp** |
| **qué contiene** | isotipo + el título *«Despensa»* | **buscador + la dirección de entrega con chevron** |
| **filas útiles** | 1 | 2 |
| **¿colapsa al scrollear?** | **NO** — medido: el título queda en `y=[152,269]` antes y después | — |

> **Mismo presupuesto de alto, muy distinto retorno: ellos ponen ahí las dos cosas que se usan
> —buscar y a dónde llega—; nosotros ponemos el nombre de la pantalla en la que ya estás.**
>
> Y **no cede nada al scroll**: son **156 dp permanentes = el 19 % del alto** ocupado por un rótulo.
> *Con G-04 al lado —84.1 % de cromo antes del primer producto— el header es el primer sospechoso
> del que más barato se recupera.*

**Los otros headers, medidos:** carrito 121.6 dp · entrega 106.3 · tus pedidos 123.4 (variante
`navegación`, título 26.7 dp). ⚠️ Ficha y «en camino» dan 366 y 490 dp con este método **porque su
primer contenido es una IMAGEN o un MAPA, no texto** — *el número no es el header ahí, y se dice
en vez de publicarlo como si lo fuera.*

**El título duplicado de la ficha, confirmado:** el header dice *«Adulto Cordero y Arroz»* (26.7 dp)
y el cuerpo lo repite (34.1 dp) 800 px más abajo. **Dos veces el mismo dato en la misma pantalla.**

---

## §3 · LOS GLIFOS — no hay una escala, hay dos tamaños y una cola

Censados los `tamano` en uso en las dos apps y en `packages/ui`:

| tamaño | usos |
|---|---|
| **21** | **31** |
| **48** | **27** |
| 28 | 15 |
| 24 | 11 |
| 56 | 6 |
| 44 | 4 |
| 72 · 34 · 26 | 3 cada uno |
| 64 · 22 · 20 | 2 cada uno |

> **Doce tamaños distintos.** Dos concentran el uso (21 y 48 = 58 de ~110) y **el resto es cola**:
> 22, 20, 26 y 34 son valores de una o dos apariciones — *«cada uno tiene el suyo»* en estado puro.
>
> **N4 fijó una sola escala de radios y la casa la respeta. Para el glifo esa ley no existe**, y el
> censo muestra qué pasa cuando falta. `[IMPRESIÓN]` **una escala de tres o cuatro pasos
> (21 · 28 · 48 y quizá 24) absorbería todo el uso real** — pero eso es una firma, no una medición,
> y va a la mesa con la tabla, no decidido acá.

---

## §4 · LO CONSTRUIDO EN ESTE BLOQUE

| | qué | estado |
|---|---|---|
| **G-15** | nodo de la escalera **20 → 32**, derivado (`spacing[8]`; su glifo da 24, sobre el gate de 21 px). **Sigue bajo 44**, así que no se lee tocable | ✅ hecho |
| **G-15bis** | el slot del ícono ahora **recibe `tamano` derivado del nodo** — nodo y glifo no pueden divergir | ✅ hecho |
| **G-14** | nace el glifo **`carrito`** — canasta con la huella adentro; **no es alias de `despensa`** (la sección contra lo que llevás) | ✅ el glifo · ⚠️ **sin gate de ícono** (§2.9 pide verlo a 21 px, y ese gate es del founder) |

⚠️ **El MONTAJE del carrito en el header es de C/D**, no mío: la pieza está, el lugar es de ellos.
*Y el header tiene 156 dp con una sola fila útil — el lugar existe y está vacío.*

---

## §5 · LO QUE ESTE BLOQUE **NO** MIDIÓ

- **Movimiento y transiciones** (bloque ⑨ de la adenda) — nada de acá es de tiempo.
- **Los glifos de los referentes.** El censo es de nuestra casa; el de ellos exige capturas suyas a
  escala conocida, y **las de Uber/Rappi son de un aparato desconocido ⇒ solo dan RATIOS, no dp**.
- **Memorial**, que no se fuerza desde el sistema.
- **El efecto de lo re-derivado en el aparato**: la escala nueva no se ve hasta que alguien publique,
  y publicar frena. *Todos los números de acá son del estado ANTERIOR a la re-derivación, salvo los
  de §4, que son del código.*
