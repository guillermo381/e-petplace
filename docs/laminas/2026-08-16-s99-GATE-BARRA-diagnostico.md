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

---

# TERCER GATE — EL FOUNDER DESARMA LA DISYUNTIVA, Y SE RETIRA LA JOROBA

**Firma:** *«en la imagen del video de referencia el ESPACIO EN BLANCO ES MUY
GRANDE… reduciendo un poco el tamaño del ícono y el texto, cabrían los cinco
tabs en toda la barra. ¿O cuál es el ajuste que proponés?»*

## ✅ LA TERCERA SALIDA: ACHICAR ÍCONO Y TEXTO ADENTRO DEL DISCO
Con el disco bajando de **68 a ~60**, **ganan las tres cosas a la vez**:
- **el texto SE QUEDA** — firmado dos veces, y con razón propia: **nuestra
  barra tiene CINCO destinos y el activo tiene que decir dónde estás**; la
  referencia tiene tres y no lo necesita;
- **el anillo SUBE** porque hay espacio;
- **la barra PUEDE BAJAR DE 86**, que también le preocupaba.

## 🔴 EL ORDEN ES AL REVÉS DE COMO SE VENÍA TRABAJANDO
**El límite lo pone LA LEGIBILIDAD, no la geometría.** El número que B tiene
que medir es **cuánto se puede achicar antes de que «Despensa» o «Negocio»
dejen de leerse** — y de ahí sale el disco, **y del disco la barra y el
anillo. No al revés.**
Vara de la casa ya escrita: **a 12 px no sobrevive el detalle, sobrevive la
orientación** — y **el ícono del activo puede permitirse menos detalle que uno
suelto porque va acompañado del texto.**

## ☠️ LA JOROBA SE RETIRA — y corrige algo que A sirvió
**B midió la referencia: NO TIENE JOROBA.** Cero columnas por encima de la
línea plana. **Lo que hay es un DESPEGUE TANGENCIAL** — el borde baja un píxel
a lo largo de seis y recién después se lanza al valle.
**⚠️ A había medido bien (2,22 px) y entregado la palanca para agrandarla
(`control = H·9/4`) — el número estaba bien y el OBJETIVO estaba mal.** *Era
perseguir con precisión algo que la referencia no tiene.* **Ver L-278.**

## DEFECTO A — las dos mitades ratificadas, con sus descartes MEDIDOS
- **los hombros se apoyan en la esquina redondeada** en vez de pedir barra que
  no existe · **el disco se acota** para no salirse en el primero y el último.
- **Descartes con número:** *ensanchar la barra no alcanza* — **el desborde es
  45 px y quitar margen da 8** · *correr los tabs* deja el espaciado desigual
  **y no cura el otro extremo**.

## Y EL ANILLO PASÓ DE CONSECUENCIA A CAUSA
`DISCO_CY` **se deriva de él**. *Es la cura literal de «el hueco está muy
pequeñito»: **se declara, no se espera a ver cuánto queda.***

---

# ✅ LA BARRA, CERRADA — y una firma pendiente del founder

## LA MEDICIÓN DE LEGIBILIDAD, con el orden invertido como se pidió
**EL TEXTO NO SE PUEDE ACHICAR:** `xs = 11` es **el piso de la escala cerrada
de la casa**. Lo único achicable es el ícono, **y su efecto es chico porque lo
que manda es EL ANCHO DEL TEXTO, no el alto del bloque.**
⇒ ícono **18**, disco **66**. **El ~60 del founder no se alcanza:** el piso
real es **62 con el ícono a 12**, *donde el detalle ya muere*.

**Contra la referencia:** disco 66 · **anillo 10 (ref 9,8)** · **asoma 10 %
(ref 10 %)** · barra **85** con 15,5 debajo del valle (ref equivalente).
**Bajó de 86 y las tres cosas ganaron a la vez.**

## ⚠️ LA ÚLTIMA DECISIÓN, SERVIDA AL FOUNDER CON SU NÚMERO Y SU IMAGEN
`disco/alto` da **0,78**; la referencia **0,66**. **Con el texto adentro, 0,66
es INALCANZABLE** — 0,73 es lo más cerca (disco 62), y para 0,66 hacen falta
**barra 100 o disco 56, que exige QUE EL TEXTO SALGA.**

**VOTO DE MESA: quedarse en 66 CON el texto.** Tres razones:
1. **la referencia tiene TRES tabs y ninguno lleva texto** —su disco puede ser
   chico porque **no tiene que decir nada**— y **la nuestra tiene CINCO y el
   activo tiene que nombrarse**, que es lo que el founder pidió **dos veces**;
2. **el texto no se puede achicar más**, así que sacarlo **no es un ajuste:
   es derogar su propia firma**;
3. **las cuatro proporciones que importan YA COINCIDEN** — *la única que no,
   es justamente la que el texto vuelve imposible.*

**La comparación está en `docs/laminas/2026-08-18-s99b-comparacion-barra.png`
para que el founder decida contra LA IMAGEN, no contra la descripción.**

---

# 🔴 CUARTO GATE — CAMBIA EL MODELO, NO LA CALIBRACIÓN

**Firma VERBATIM:** *«el efecto que quiero que se note es, por ejemplo, SI CAE
ALGO SOBRE LA BARRA. Los bordes NO SIGUEN EL CÍRCULO, no es como si yo
EXTRAJERA un círculo de la barra, sino que EL CÍRCULO CAE EN LA BARRA. Los
bordes de cada extremo del círculo son COMO SI FUERA UNA MONTAÑA, se DEFORMAN
HACIA EL LADO CONTRARIO… Y ese efecto, CUANDO GIRA EL TAB DE UN LADO A OTRO,
es lo que genera lo que quiero. NO ERA EL CÍRCULO EN SÍ MISMO, ES EL EFECTO
QUE GENERA EL MOVIMIENTO.»*

## LO QUE CAMBIA: DOS FÍSICAS DISTINTAS

| lo que construimos | lo que él quiere |
|---|---|
| **RESTAR** el círculo de la barra | **EL DISCO CAE** sobre la barra y la **DEFORMA** |
| el borde **sigue el contorno** del disco — un **molde** | la barra es **TELA**: se hunde donde cae **y se levanta a los lados** |
| geometría **concéntrica**, separación garantizada | **desplazamiento**: la materia tiene que ir a algún lado |

**⇒ LAS MONTAÑAS NO SON UN ADORNO: SON EL DESPLAZAMIENTO DE LO QUE SE HUNDIÓ.**
*Un molde no tiene montañas; una tela sí.* **Eso es lo que él viene llamando
«la S» desde el primer gate**, y lo que la mesa tradujo mal como *«una saliente
hacia afuera»*.

## 🔴 POR QUÉ NADIE LO ENCONTRABA — y por qué nadie se equivocó
**B midió el video EN REPOSO: cero columnas sobre la plana. Su medición era
correcta.** Lo que el founder quiere **no está en el reposo: es el
COMPORTAMIENTO durante el viaje.**
⇒ **B mide el video EN MOVIMIENTO** — los cuadros intermedios del cruce,
**cuando el disco está a mitad de camino y el valle está deformado
asimétricamente.** *Ahí vive lo que él vio y quiso.* **Ver L-280.**

## LO QUE HAY QUE RESOLVER
**Que la barra se comporte como MATERIAL y no como molde:** el disco
**desplaza** · los hombros **se levantan porque algo bajó** · y **la
deformación es MÁXIMA durante el viaje y mínima en reposo** — que es
**exactamente lo contrario** de lo que se le venía pidiendo (una joroba fija).

**Y su propia letra ya tenía la mitad: *«la saliente ESCALA CON EL ESTIRÓN»*.
Estaba en el camino correcto y la mesa la mandó a hacerla fija.**

**Vara: la comparación EN MOVIMIENTO** — cuadros intermedios de la referencia
al lado de los nuestros, **no cuadros en reposo**.

## Y LOS DOS DEFECTOS DEL GATE, QUE SON INDEPENDIENTES DE ESTO
1. **EL HUECO NO ES DEL COLOR DEL FONDO** — se ve **blanco grisáceo** en
   «Cuenta». Es su *«por eso no se nota que está»*.
2. **LOS ÍCONOS DE LOS TABS EXTREMOS NO ESTÁN CENTRADOS** — consecuencia del
   acotado: **el disco se corrió y el contenido no lo siguió.**
