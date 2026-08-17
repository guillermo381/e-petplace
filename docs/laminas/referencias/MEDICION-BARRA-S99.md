# LA BARRA — LA REFERENCIA MEDIDA, NO DESCRITA (S99-A · 16-ago-2026)

**Los cinco recortes del founder viven en esta carpeta y SON LA VARA.** Se trabaja
contra las imágenes, no contra la descripción — porque la descripción ya se tradujo
mal tres veces.

| archivo | qué es |
|---|---|
| `referencia-barra-COMPLETA-la-vara.png` | **LA VARA.** 252×116, simétrica, blanco y negro puro. Es la que se puede medir. |
| `referencia-barra-hombro-{b,c,d}.png` | el mismo hombro a otras escalas |
| `nuestro-barra-s99-141a372d.png` | **lo nuestro**, en el OTA `141a372d` |

*Corrección de conteo: son **CUATRO** de la referencia y una nuestra — la mesa dijo tres.*

---

## 🔴 LO QUE LA MEDICIÓN DICE, Y CORRIGE A LA MESA EN EL MECANISMO

Perfil del borde superior de la barra, columna por columna, sobre la vara.

### ① NO HAY CRESTAS. **Cero columnas por encima del plano.**
La mesa leyó *«la barra SUBE POR ENCIMA de su línea normal a los dos lados del disco ·
hay DOS CRESTAS NEGRAS flanqueando el hueco»*. **Medido: `columnas por encima del
plano = 0`.** El borde **nunca** pasa la línea plana. **Y la medición de B en reposo
—que barrió buscando columnas sobre la línea y encontró cero— ESTABA BIEN.**

*Esta es la CUARTA traducción del mismo gesto («saliente hacia afuera» · «joroba» ·
«montaña» · «cresta»), y las cuatro mandaron a construir un bulto que la referencia
**no tiene**. El problema nunca fue la altura.*

### ② LO QUE SÍ HAY, y es exactamente lo que el founder viene diciendo: **LA CURVA CAMBIA DE SIGNO**
**El borde arranca convexo y termina cóncavo**, sin salirse jamás del plano. La
inflexión se mide sin ambigüedad por dónde la pendiente deja de crecer:

| medida | valor |
|---|---|
| ancho del hombro (plano → fondo) | **89 px** |
| profundidad del valle | **96 px** |
| **relación profundidad / ancho** | **1,08** |
| **la INFLEXIÓN cae al** | **28 % del hombro** |
| **…y al** | **28 % de la profundidad** |
| columnas sobre el plano | **0** |

**⇒ La forma es una S de verdad: cae rápido al principio (convexa), la pendiente llega
a su máximo al 28 % del hombro, y de ahí se acuesta (cóncava) hasta el fondo.**
*Es un punto de inflexión, no un montículo.*

### ③ LO NUESTRO, en las mismas unidades — y por qué el recorte no alcanza
Perfil detectado en 136 de 146 columnas: **plano hasta x≈60, y a x=80 lleva 8 px de
descenso**. De ahí en adelante **el detector agarra el ANILLO BLANCO del disco, no la
barra** (aparecen «columnas sobre el plano» que son el anillo, no una cresta).
**⇒ el recorte propio NO sirve para medir el hombro entero: el anillo lo tapa.**
**Lo nuestro se mide desde el código o desde un render sin disco** — es de B, y es
la mitad que falta para poder comparar la relación 1,08 contra la nuestra.

**La sospecha que deja el número, declarada como sospecha:** la referencia es un valle
**profundo y angosto** (1,08 de profundidad por ancho). Si lo nuestro resulta un plato
**ancho y poco profundo**, el borde llega al plano *acostado* y por eso **no tiene dónde
terminar y se corta** — que es, literalmente, las «puntas blancas» que el founder ve
**con la barra quieta**. *Se confirma o se cae midiendo lo nuestro; no se da por cierta.*

---

## LO QUE HAY QUE CONSTRUIR (y lo que NO)
- **SÍ:** que el borde **cambie de curvatura dentro del hombro**, con la inflexión
  cerca del **28 %**, y **EN REPOSO** — el founder lo pide con la barra quieta.
- **NO:** cresta, joroba, montaña ni saliente. **La referencia no tiene nada por
  encima de su línea plana.** Construir un bulto es la quinta traducción del mismo error.
- **El ajuste pedido aparte:** **reducir UN punto** el espacio libre entre la barra y
  el anillo.

## CÓMO SE VERIFICA (el instrumento, para que no haya que discutir de nuevo)
Perfilar el borde por columnas y reportar **tres números**: `columnas sobre el plano`
(tiene que dar **0**), `profundidad / ancho de hombro` (la vara da **1,08**) y **dónde
cae la pendiente máxima** (la vara da **28 %**). *Tres números terminan una discusión
que cuatro descripciones no pudieron.*
