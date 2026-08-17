# LA BARRA — LA REFERENCIA MEDIDA, NO DESCRITA (S99-A · 16-ago-2026)

**Los cinco recortes del founder viven en esta carpeta y SON LA VARA.** Se trabaja
contra las imágenes, no contra la descripción — porque la descripción ya se tradujo
mal **cuatro veces** («saliente» · «joroba» · «montaña» · «cresta»), y la anatomía que
esas cuatro mandaron a construir **no podía producir el efecto** (L-283).

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

---

# ✅ CERRADO POR MEDICIÓN DE B — la causa raíz, y la sospecha confirmada

## ① LA CAUSA RAÍZ: la anatomía no podía producir el efecto
**El hombro eran 50 px dead-flat + un arco de circunferencia.** Literal de B:
***«un plano y un arco no producen un cambio de signo: producen un CODO. Lo único
fuera del plano era la joroba. Por eso no hay S: no había dos signos que alternar.»***
⇒ **la S era INCONSTRUIBLE**, hicieran lo que hicieran con los números. **Ocho gates.**
Depositado como **L-283**.

## ② LA SOSPECHA DE ESTE DOCUMENTO, CONFIRMADA POR NÚMERO
Este archivo dejó escrito —**como sospecha, no como hecho**— que la referencia era un
valle *profundo y angosto* y lo nuestro un *plato ancho y poco profundo*.
**Medido: nuestro ratio `0,83` contra `1,08` de la vara — 19,5 px de hombro de más.**
*La sospecha se declaró como sospecha y la cerró una medición ajena: así se cierra, no
convirtiéndola en premisa.*

## ③ EL LÍMITE DURO, que hay que decir con la firma
**La inflexión de la vara cae al 28 %. Lo alcanzable con ANILLO UNIFORME es 50 %, y es
PISO — no preferencia:** el cambio de signo vive donde el hombro se encuentra con el
arco, y **ese encuentro no puede pasar del ecuador del disco** o el borde se dobla
sobre sí mismo. En el ecuador la profundidad ya es 40 %.

**La razón estructural: LA REFERENCIA NO ENVUELVE UN DISCO CON ANILLO UNIFORME** — su
piso es más ancho y más plano. ***«Son dos geometrías distintas, no la misma peor
hecha.»*** ⇒ **(a)** anillo uniforme, inflexión al **50 %** · **(b)** soltar el anillo
uniforme para llegar al **28 %**, que es **derogar la ley de que el disco lleva un
anillo parejo**.

**VOTO DE MESA: (a), y construir ya.** *El problema nunca fue el porcentaje: era que no
había inflexión. De «no existe» a «existe al 50 %» es el salto entero; de 50 a 28 es
afinar.* Si al verlo no alcanza, **(b) es un turno más con el costo ya medido.**

## ④ LO QUE SE CONSTRUYE (ratificado)
**Muere el hombro plano y muere la joroba.** **Una sola cúbica del plano al arco**:
sale horizontal, se empina, y entrega al arco **con la misma tangente** — **convexa al
salir, cóncava al entrar, sin salirse jamás de la línea.** Anillo a **9** (el punto que
pidió el founder) y el disco **1 px más hundido**.
**Y el viaje deja de ser un bulto: pasa a ser ASIMETRÍA DEL VALLE** — el hombro de
adelante se angosta y empina, el de atrás se ensancha. **Material desplazado, sin una
sola columna arriba del plano.** *Eso es la tela, por fin sin bultos.*

**Alcanzable medido:** columnas sobre el plano **0** (vara 0) · ratio **1,10**
(vara 1,08) · anillo **9** uniforme.

---

# 🔴 RONDA FINAL — EL BORDE. Y un descarte que hay que RE-MEDIR

**Firma verbatim del founder:** *«casi, estamos cerca, falta arreglar las de las
esquinas y ya. Cuando el foco está en los tabs de las esquinas LOS JALA HACIA EL
CENTRO, y HAY SUFICIENTE ESPACIO EN LOS BORDES SIN USAR para que eso no sea necesario.
Incluso el tab NO ESTÁ PINTADO HASTA EL EXTREMO DE LA PANTALLA.»*

## SON DOS COSAS COMIÉNDOSE EL BORDE A LA VEZ
① **la BARRA tiene margen lateral** y no llega al borde de la pantalla · ② **y además
el DISCO se corre hacia adentro** por el clamp (`margenDisco = RADIO_BARRA +
VALLE_SEMI`). Se ve en las capturas: en **«Cuenta»** el disco está corrido a la
izquierda de su tab **con espacio libre a la derecha**; en **«Hoy»**, al revés.

## 🔴 EL DESCARTE ANTERIOR SE RE-MIDE — se hizo con OTRA geometría
Se descartó la barra a sangre midiendo *«ni a sangre alcanza»*: **centro del primer tab
a 39, el valle pidiendo 43**. **Pero eso era con el VALLE VIEJO** (semiancho 43,
ratio 0,48). **El valle de hoy es MÁS PROFUNDO Y MÁS ANGOSTO — ratio 1,10** ⇒ **su
semiancho es MENOR**, y la cuenta que produjo el descarte **ya no describe la pieza.**

**⇒ Lo que B re-corre, con el valle ACTUAL:** ¿cuánto mide `VALLE_SEMI` hoy, y cuánto
queda **del centro del primer tab al borde** si la barra va a sangre?
· **Si alcanza:** el clamp **deja de hacer falta** y el disco vuelve al **centro de su
tab** — que es lo que el founder viene pidiendo hace tres gates.
· **Si NO alcanza:** se sirve **con el número** — cuánto falta y cuál es la palanca
(menos margen · correr los tabs · achicar el valle un punto más).

## ⚠️ EL ORDEN IMPORTA, porque las dos cosas se encadenan
**PRIMERO la barra A SANGRE** —que además es su *«no está pintado hasta el extremo de
la pantalla»*— **y RECIÉN AHÍ se re-evalúa el clamp**: con más ancho disponible,
`margenDisco` **puede no dispararse en ningún tab**.
**Y el efecto secundario que el founder ya nombró dos veces se cura solo si el clamp
deja de actuar:** los íconos vuelven a estar centrados en su tab, porque **hoy siguen
al disco corrido**.

## Y de paso, medirlo
El **hombro comido por la esquina redondeada** en el tab del extremo (ratio 1,65,
anillo aguantando en 8,97) **debería aliviarse con la barra a sangre** — se mide, no se
supone.

---

### 📌 LA LEY DE S84 COBRA SU PRIMER DIVIDENDO MEDIBLE
> *«Todo freno declara CONTRA QUÉ MIDIÓ — un "no se puede" **no se descubre nunca**,
> porque nadie verifica por qué algo no se hizo.»*

**Este descarte declaró contra qué midió** (centro a 39, valle pidiendo 43, semiancho
43) **y por eso se pudo re-abrir dos gates después, cuando la geometría cambió.** Si
hubiera dicho solo *«a sangre no alcanza»*, **el disco se quedaba corrido para
siempre** y nadie habría sabido por qué. *La ley se escribió en S84 como criterio; acá
se ve cuánto vale: un freno con su medición adentro tiene fecha de vencimiento — uno
sin ella es permanente por accidente.*
