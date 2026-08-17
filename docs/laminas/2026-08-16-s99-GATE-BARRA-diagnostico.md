# GATE DE LA BARRA (OTA `01a00d5a…`, ancla `d93edd32`) — DIAGNÓSTICO PARA B

> **Depositado por A (conducción) porque el canal entre pistas sigue caído.**
> **Se lee ANTES de tocar la pieza: cambia DÓNDE hay que buscar.**

## FIRMA DEL FOUNDER, VERBATIM

> *«en el menú no quedó la S del círculo, no le hace la forma a la S tan
> marcada, pareciera que no está. El espacio en blanco sí está, PERO ESTÁ MUY
> PEQUEÑITO. La S hay que hacerla MUCHO MÁS PRONUNCIADA en los dos extremos,
> tanto izquierdo como derecho. NO PINTÓ NADA, hizo también como una especie
> de S en la tapa. Ayudame a que sea MUCHO MÁS NOTORIO: no sé si generar más
> contraste, si hay que subir el tono del tab, o abrir más el espacio en
> blanco. Y CUBRE LOS BORDES, tanto izquierda como derecha del tab.»*

## 🔴 DIAGNÓSTICO DE MESA — EL PROBLEMA ES LA GEOMETRÍA, NO EL COLOR

**El founder ofrece tres salidas y las tres son de color** (*«más contraste ·
subir el tono del tab · abrir más el blanco»*). **Ninguna arregla esto.**
*Sería pintar mejor una forma que no está pasando.* **Que B NO vaya por el
color.**

**La causa única: el disco está prácticamente AFUERA de la barra** —asoma casi
entero— **y de ahí salen las tres quejas, que son una sola:**

| Lo que el founder ve | Por qué pasa |
|---|---|
| *«la S… pareciera que no está»* | **el valle es superficial**: con el disco tan arriba la barra apenas se hunde, y **los hombros no tienen de dónde salir**. *La S existe y no tiene recorrido.* |
| *«el espacio en blanco… muy pequeñito»* | solo hay contacto en un **arco corto**. Si el disco entrara más, **el hueco lo RODEARÍA en vez de rozarlo** |
| *«no pintó nada» en los extremos · «una especie de S en la tapa»* | **el valle no llega a los bordes** porque es corto y poco profundo — es el MISMO síntoma dicho de dos formas |

## LA CURA, EN ORDEN (y el orden importa: ③ no puede pasar antes que ①)

1. 🔴 **METER EL DISCO — que asome UN TERCIO, no casi entero.** Hoy: asoma 10
   sobre r34. **El founder lo pidió «más metido» TRES veces** (ésta es la
   tercera). **Que la barra lo ABRACE.**
2. **ENGORDAR EL HUECO** — hoy es un pelo. Con el disco adentro y el hueco más
   grueso, **la separación se lee sin cambiar un solo color** — que es la
   prueba de que el diagnóstico es geométrico.
3. **Y RECIÉN AHÍ los hombros en S tienen recorrido para salir**, que es lo
   que el founder pide con *«mucho más pronunciada en los DOS extremos»*.

## LA VARA
**El video de referencia que el founder ya compartió DOS VECES**: ahí **el
disco entra hondo y el valle recorre buena parte del ancho**. *Medir contra el
video, no contra el frame — el frame ya llevó a una lectura equivocada una vez
en esta sesión.*

## LO QUE NO HAY QUE RE-DISCUTIR (ya está firmado y verde)
- **El isotipo del pin PASA**: *«se ve bien, no hay necesidad de cambiarlo»*.
- **Ícono Y texto adentro del disco**, con el founder **autorizando
  agrandarlo**.
- **El recorte del hueco FUNCIONA** (L-252 cumplida). Lo que fallaba era el
  contenedor, y eso ya se curó: **la barra flota.**

---

# ✅ CERRADO POR B — y el número es mejor que el diagnóstico de mesa

**La mesa dijo «el disco está casi afuera» y acertó en frenar el color. B
encontró la magnitud, que lo vuelve obvio: el hueco era un círculo de
diámetro 78 perforando una barra de 76 de alto** ⇒ **13 px de barra debajo: el
83 % del alto desaparecía.** *No era un anillo: era una mordida.*

**La cura es ESTRUCTURAL, no de medida:** el valle **sigue el contorno** en vez
de perforar, con su radio **DERIVADO** (`DISCO_RADIO + ANILLO`) — *y eso es lo
que garantiza que la separación sea la misma en todo el arco; antes dependía
de dónde mirabas.* **☠️ `VALLE_HONDO` murió** (ver **L-277**).

| | antes | ahora |
|---|---|---|
| anillo | **5 en un punto** | **8 uniforme** |
| barra bajo el disco | 13 | **21** |
| recorrido del valle | 100 | **156** |

**Y la S crece con el viaje** —la saliente escala con el estirón—, que es lo
que la vuelve notoria **en los extremos**, que es exactamente lo que el
founder pidió.

## 📌 DECISIÓN DE MÉTODO, al acta
El arco va en **DOS CÚBICAS con control calculado, no con `A`**. Literal de B:
*«los flags de barrido de un arco SVG no se pueden verificar sin renderizar, y
una cúbica cae exactamente donde dice la aritmética — no quise dejar colgada
de un flag la forma que este gate vino a arreglar».* **Es elegir el mecanismo
VERIFICABLE sobre el conveniente.**

## ⚠️ EL COSTO VA A FIRMA DEL FOUNDER: LA FILA MIDE 86
Es lo que exigen **las tres cosas juntas**: disco de **68** (el que hace entrar
**ícono + texto**, autorizado dos veces) · **metido a un tercio** · con **8 de
anillo**. **Las tres tiran en la misma dirección.**

**Palanca declarada por B:** *«si 86 es mucho, es el disco (cada px de radio
cuesta ~2 de barra) o el anillo. **NO HAY UNA TERCERA**».*

**VOTO DE MESA: dejarlo en 86 y juzgarlo CON EL DEDO.** Es la barra de una app
que se usa **parada en un mostrador**; una barra generosa no molesta ahí como
molestaría en una app de lectura. **Y si come demasiada pantalla, la palanca
es un número y baja en un turno.**

---

# SEGUNDO GATE — SON DOS DEFECTOS SEPARADOS, Y UNO YA TIENE SU NÚMERO

**Firma:** *«todos los puntos mejoraron pero necesitan refinamiento — eso va a
la otra sesión. En ÉSTA, que quede bien el menú: NO HA ENTENDIDO NI LA S NI
LOS BORDES.»*

**Se estaban tratando como uno y son DOS**, con causas distintas y curas
distintas.

## 🔴 DEFECTO A — EL DISCO SE SALE DEL ANCHO DE LA BARRA EN LOS TABS EXTREMOS
- **«Cuenta»** (último): el disco sobresale por el **costado derecho**, la
  barra termina y **el anillo queda cortado**.
- **«Hoy»** (primero): lo mismo del lado izquierdo.
- **«Atender»** (medio): **NO pasa** — hay barra a los dos lados.

**⇒ No es la S: es que EL VALLE EN UN TAB EXTREMO NECESITA MÁS ANCHO DE BARRA
DEL QUE HAY.** Las dos frases del founder son la misma cosa: *«cubre los
bordes»* y *«en los extremos no pintó nada»* — **no falta la curva: se acabó
la barra.**

**Y es DECISIÓN, no calibración.** Tres salidas, y B elige con número:
① la barra **se ensancha** (menos margen lateral) para que el valle quepa ·
② el valle se **asimetriza** en el primero y el último (el hombro de afuera se
acorta) · ③ los tabs extremos **se corren hacia adentro**.

## 🔴 DEFECTO B — LA S NO SE VE EN EL MEDIO · **YA ESTÁ MEDIDO: NO ES LA HIPÓTESIS**

**La mesa preguntó si la saliente es CERO en reposo y solo crece con el
movimiento. Medido contra el código vivo: NO.** `BarraTabs.tsx:290`

```
const SALIENTE = 5 * (1 + Math.min(Math.abs(estira), 1) * 0.6)
```
con `estira = 0` da **5**, no cero. **La hipótesis se descarta.**

**🔴 LA CAUSA REAL ES ARITMÉTICA, Y ES OTRA: LA CÚBICA NO LLEGA A SU PUNTO DE
CONTROL.** El hombro se dibuja con un control en `-SALIENTE`, pero una cúbica
**pasa CERCA de sus controles, nunca por ellos**. Con
`y(t) = 3(1-t)²t·(-S)`, el máximo cae en `t = 1/3` y vale **`S · 4/9`**:

| | `SALIENTE` | **pico REAL de la joroba** | sobre la barra de 86 |
|---|---|---|---|
| **reposo** | 5,0 | **2,22 px** | **2,6 %** |
| viaje completo | 8,0 | 3,56 px | 4,1 % |

**⇒ La joroba existe y mide 2,2 px. Ése es el defecto entero: no está
ausente, es IMPERCEPTIBLE.** *Y explica por qué «la S existe en la letra» y no
en la pantalla — las dos cosas eran ciertas.*

**Palanca directa:** para una joroba de `H` px visibles, el control va en
`H · 9/4`. *Una saliente de 6 px reales pide un control en 13,5, no en 6.*

## EL ANILLO
En «Atender» **se ve, pero es una línea fina**. **El founder no lo volvió a
pedir ⇒ no se toca.** Si al resolver A y B queda espacio, **se lee mejor
grueso**.

## LA VARA Y DÓNDE SE VERIFICA
**EL VIDEO, no el frame** — el frame ya llevó a una lectura equivocada una vez
en esta sesión. En la referencia: **el valle recorre buena parte del ancho, la
saliente se ve CON LA BARRA QUIETA, y el disco nunca se sale del ancho de la
píldora.**

**Y por L-241 se verifica DONDE VIVE: en la app, con el tab del EXTREMO Y con
el del MEDIO** — son los dos casos, y **cada uno muestra un defecto distinto.**
