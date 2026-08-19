# S100d·bis · RESUMEN DE PUBLICACIÓN — el bundle de cierre de la tanda

> **Escrito por la mano publicadora ANTES de disparar.** Su trabajo es que el
> founder sepa **qué está mirando** y **qué NO puede gatear en este objeto**.
>
> 🔴 **Ningún punto se declara CERRADO acá.** Todos dicen dónde se verificaron.
> *Un punto reportado cerrado que reaparece en el próximo gate es rojo de
> método, no de pieza.*

---

## 🔴 ANTES QUE NADA: EL FONDO CAMBIA **TODAS** LAS PANTALLAS DE **LAS DOS** APPS

**`#F6F6F6` — el fondo neutro.** No es un cambio de una pantalla: es el papel
sobre el que se dibuja **todo**, incluidas **decenas de superficies que ninguna
pista tocó en esta vuelta**.

> ⚠️ **SI ALGO SE VE RARO EN UNA SUPERFICIE QUE NADIE TOCÓ, LA PRIMERA SOSPECHA
> ES EL FONDO — NO UNA REGRESIÓN.** *Buscar un culpable en el diff cuando la
> causa es el papel cuesta una tarde.*

**Y es AJUSTABLE sin abrir una sesión — el founder lo pidió explícito:**

    packages/ui/src/tokens/palette.ts
      papelTapiz:        '#F6F6F6'   ← el CLIENTE   (línea 294)
      papelTapizOficio:  '#F6F6F6'   ← el PRESTADOR (línea 261)

**Los dos en el mismo archivo, a treinta líneas uno del otro.** ⇒ *mover un
valor cambia una app entera; mover los dos, las dos.* **La próxima iteración
cuesta UN VALOR, no una vuelta.** Cada token lleva escrito qué se re-mide con
cada cambio.

### ⚠️ EL OSCURO **NO** SE TOCA, y el número es la razón

| tema oscuro | contraste carta / fondo |
|---|---|
| **hoy**, con tinte 3 % `#0D050D` | **1,037** |
| con el neutro `#0D0D0D` | **1,003 ⇒ INDISTINGUIBLE** |

**Un neutro en oscuro borra las tarjetas de las dos apps.** ⇒ la revocación es
**solo del tema claro**. *El tema oscuro no es el claro invertido: en claro el
tinte estorbaba; en oscuro es lo único que separa la carta del fondo.*
**Aplicarlo por simetría habría vaciado la app oscura, y nadie lo habría visto
hasta un gate en oscuro — que no hacemos nunca.**

### ⚠️ Y UNA CONSECUENCIA QUE YA SE SABE, ANTES DE MIRAR

**Todos los números de superficie de C se midieron contra el fondo VIEJO** (la
carta a `rgb(255,255,255)`, los altos, los contrastes). Con `#F6F6F6` **la carta
blanca deja de separarse igual** — que es justamente el trabajo que el founder
le pidió a la carta. ⇒ **la carta de composición necesita un ojo DESPUÉS del
fondo.** *C decidió no re-medir ahora, y es lo correcto: mediría contra una vara
que está por cambiar.*

---

## ⓪ 🔴 DOS CATEGORÍAS, Y NO SE JUNTAN BAJO LA MISMA PALABRA

*El founder gatea distinto lo que ya alguien miró. Mezclarlas le haría gastar el
mismo cuidado en todo y quedarse sin cuidado justo donde hace falta.*

### ✅ VISTO EN APARATO — alguien ya lo miró correr
`24①` mapa navegable y recentrar · `24②③④` la ficha al arrastrar, el código
resaltado con su señal, el fondo blanco · **los TRES topes de la hoja y su
scroll, ejercidos** · `23` la gota en la escalera, en «Seguir el pedido» y en el
rótulo · `25` la ficha del repartidor con placa y hueco de foto · `30` la fila
del pedido · **el chip magenta de C** con su desambiguación · **el campo tipeable
de C en la ficha**.

### ⚠️ CONSTRUIDO SIN OJO — nadie lo vio correr
**el fondo neutro y TODO lo de B** · **la reestructura de Pedidos** · **el canal
de adquisición en el Hogar** (la puerta del local, dos dosis) · **la ventana
vencida** en lista, detalle y EN CAMINO · **todo lo mío**: el modal de dirección,
la ficha de entrega, la gota, el alias, el campo tipeable del carrito.

⚠️ **D partió su propio reporte así a propósito** — lo que vio fue con el dev
build, y **las tres últimas filas suyas se construyeron DESPUÉS de soltar el
aparato**. *No quiso que entraran bajo la misma palabra, y tiene razón.*

---

## ⓪bis 🔴 LO QUE VA A PARECER UN DEFECTO Y NO LO ES

**«Está tardando más de lo previsto» va a aparecer casi siempre en tu cuenta.**

    pedidos con ventana ……………………… 30
    con la ventana VENCIDA ……………… 27

**Es tráfico de prueba viejo, no un problema del producto.** *Una cuenta de
pruebas con meses de pedidos sin cerrar hace que un aviso correcto se vea como
un aviso roto.*

⚠️ **Y el umbral de los 20 minutos NO está calibrado contra comportamiento, y se
declara con esas palabras:** hay **UNA sola entrega con ventana en toda la base**
y **llegó 20 h antes**. El número sale del **8 % de la ventana más angosta**, no
de atrasos observados. **Se recalibra cuando haya atrasos reales.** *Un umbral
derivado de una proporción no es un umbral medido — funciona hasta que alguien
lo trata como si lo fuera.*

---

## ① QUÉ CAMBIA, CON SU NÚMERO DE GATE

### Pista B — las piezas

| # | qué | dónde se verificó |
|---|---|---|
| **5·7** | **el stepper 44 → 34 dp** (−22,7 %, el blanco de 44 intacto) y **un bloque, no tres piezas** | aparato |
| — | **el arbitraje de gestos**: `HojaScroll` gana el eje horizontal, `FiltroPills` cede el pan. **Degrada solo fuera de una Hoja** | aparato |
| — | **el número editable** con ajuste al stock, un mecanismo para las tres superficies | ver ② |
| **8·9·12** | **el flotante sube al SHELL** — existe por el CARRITO, no por la pantalla; se calla en `carrito` y `checkout` | aparato |
| — | **los headers a la altura de Despensa** — inset **derivado**: 88,2 → 54,0 dp | aparato |
| **—** | **el fondo `#F6F6F6`** + el mapa de superficies + `R16` con letra nueva | ver arriba |
| **H-205** | 🔴 **DIAGNOSTICADO, NO CURADO** — ver ③ |

### Pista C — la vitrina y la ficha

| # | qué | dónde |
|---|---|---|
| — | **la composición SIN CARTA cuando no hay ingredientes** — curado **subiendo la carta afuera del `if`**, no duplicándola: *«una rama sin superficie» deja de ser expresable* | RN-web |
| **9** | el chip de presentación en magenta `rgb(142,31,104)`, **con su precio cuando la etiqueta repite** («12.7 kg · $ 57.19» contra «12.7 kg · $ 94.50») | ✅ **APARATO** |
| — | **la puerta del local SALE de la Despensa** (firma del founder). La vitrina termina la vuelta **sin ninguna puerta prestada: solo mercadería** | RN-web |

### Pista D — pedidos y el camino

| # | qué |
|---|---|
| **24** | el scroll de la hoja (su plegable de 475 en una hoja de 365) · **el tercer estado: que baje del todo conservando su asa** |
| — | **la reestructura de Pedidos**: el vivo arriba **sin hueco cuando no hay nada** · chips solo «Entregados · Cancelados» · **«Pedir de nuevo»** en cada entregado |

### Pista A — el checkout y la dirección

| # | qué |
|---|---|
| **17** | la ficha de entrega (una carta, N21) con **la gota ocre junto a la dirección** |
| **20** | el tope de compra en las tres puertas · **el campo tipeable encendido en el carrito** |
| **28** | el alias alcanzable |
| — | 🔴 **el modal de dirección: SIN CAMPO al entrar y SIN MAPA hasta que se pide** — ver ② |
| — | **`places_id` con su auditoría** — ver ⑤ |

---

## ② 🔴 EL MODAL DE DIRECCIÓN — la clase eliminada, no parcheada

**El rojo, verbatim:** *«para poder guardar dirección o agregar otra me toca
tocar el mapa, y literalmente me desacomoda la dirección… **si no me di cuenta,
no pasa**»*. ⇒ **se guardaba una dirección distinta de la elegida sin que la
persona se enterara** — lo peor que puede pasar en una pantalla de entrega.

**La causa:** el mapa vivía **en medio del formulario que scrollea**. Para llegar
a los botones había que arrastrar **sobre él**, y arrastrarlo **mueve el punto**
porque el pin *es* el centro. *El gesto de navegar y el gesto de editar eran el
mismo gesto.*

**La cura:** al entrar **no hay campo de texto** (la dirección se muestra, con
una puerta explícita para cambiarla) · **el mapa no se monta hasta que se pide** ·
**las acciones y Guardar van ANTES del mapa**, que queda último y sin nada debajo.

🔴 **Un mapa que no está no puede comerse el scroll.** *Reordenar los botones
solo era la mitad barata: el defecto habría vuelto apenas alguien agregara un
campo abajo.*

### El campo tipeable: la causa real, y las tres nos equivocamos

**A dijo** que el aviso estaba montado en las tres. **B dijo** que faltaba montar
la Hoja. **Ninguna era la causa.** Medido:

    grep "editable" en apps/cliente/.../despensa/   →   CERO
    StepperCantidad.tsx:288   editable?: boolean   (default false)

⇒ **`editable` no estaba encendido en ninguna superficie: la pieza era *motor
sin puerta*.** Y el aviso **no había que cablearlo aparte** — el campo emite por
el **mismo `onCambio`**, así que tipear 50 con 12 en stock entra por el mismo
camino que tocar el «+». **La cura era una palabra por superficie.**

**La voz, ajustada al pedido del founder** (*«disculpá, por ahora solo tenemos
12»*), conservando su **«por ahora»** —la escasez es de hoy, no del producto— y
diciendo **qué pasó con el número**, no solo cuánto hay:

> *«Por ahora tenemos 12 de este producto — dejamos esa cantidad en tu carrito.»*

⚠️ **`sin_medir` NO es alias de `agotado`:** si la consulta de stock falla **se
aplica lo pedido** (Ley 13). *Un fallo de red no se disfraza de «no hay stock».*
El instrumento lo caza — su rojo producido es exactamente colapsar las dos
clases (8/10 contra 10/10).

---

### 🔴 Y LA CURA DE «UNA PALABRA» NO ERA DE UNA PALABRA EN LA FICHA

Yo dije *«la cura es `editable`, una palabra por superficie»*. **C lo verificó
contra la pieza antes de aplicarlo y la mitad era falsa:**

- **la vitrina no necesitaba nada** — `TarjetaProducto:770` ya lo enciende adentro;
- **la ficha necesitaba mucho más:** su `onCambio` era `setCantidad` pelado y **el
  tope solo corría al tocar «Agregar»** ⇒ **tipear 50 habría dejado el 50
  mintiendo en pantalla hasta el último toque.**

*Mi «una palabra» era cierta para dos superficies y falsa para la tercera —
y la tercera era justo la que el founder iba a tocar.* **Lo ruteó por
`decidirTope` con las tres condiciones intactas.**

⚠️ **Y midió CUÁNDO emite la pieza antes de rutearlo, que es lo que lo vuelve
barato:** `onCambio` sale de `confirmar()`, atado a `onEndEditing` ⇒ **un viaje
por número tipeado, no uno por dígito.** *Si hubiera emitido por tecla, la cura
era otra.*

---

## ③ 🔴 H-205 — CURADO A MEDIAS, y la mitad que queda NO tiene causa atribuida

**No era `color:'transparent'` fallando en aparato.** Son **dos strings del mismo
dato**: el techo recibe `ficha.nombre` **crudo** y el cuerpo pinta
`nombreCurado(...)`. Con **42 % del catálogo en MAYÚSCULAS**, arriba «NUTRA PRO
ADULTO LIGHT» y abajo «Nutra Pro Adulto Light».

**Por eso el web nunca lo delató:** con un nombre ya en caja normal las dos
versiones coinciden.

**AL CANON — y es de B:** ***un acoplamiento declarado por escrito se cobra
solo.*** Ella misma escribió esta mañana, en `TarjetaProducto`: *«el día que otra
superficie monte esto, `nombreCurado` tiene que subir con ella»* — **se cumplió
doce horas después, en la pantalla de al lado.**

### ✅ Esa mitad está CURADA — y en aparato las dos versiones ya coinciden.

### 🔴 PERO EL NOMBRE SIGUE APARECIENDO DOS VECES

**`tituloVisible={false}` NO apaga el píxel en el aparato.** Medido por C: el
código pasa la prop (`:670`), `Encabezado:219` la mapea a `color:'transparent'`,
**hay un solo sitio que pinta el título**, el stack va con `headerShown:false`
— **y el teléfono lo pinta igual.**

✅ **Y el discriminador llegó después, resuelto SIN aparato:** los bounds del nodo
del techo son **`x 146–934`**, que es **exactamente la caja centrada del
`Encabezado` entre sus dos zonas de 44** ⇒ **lo que se ve arriba ES ese `Text`, y
su `color:'transparent'` no se honra.** **Es de la pieza**, y ya no es «sin causa
atribuida»: es una causa MEDIDA por geometría, no la explicación cómoda.

⚠️ **Va como HECHO MEDIDO Y SIN CAUSA ATRIBUIDA**, con dueño B. *C ya se
equivocó una vez atribuyendo este defecto, y la explicación cómoda vuelve a ser
«transparent no anda en nativo» — que es exactamente la clase de causa que suena
bien y no se midió.* **Prefiere entregar la captura sin diagnóstico que un
diagnóstico que hay que desandar.**

---

## ④ DÓNDE SE VERIFICÓ CADA COSA — la palabra importa

**«Aparato» = el teléfono del founder.** Todo lo demás es **RN-web**, que sirve
para **comparar un antes con un después** y **jamás para declarar cómo se ve**.

⚠️ **Y la jornada lo probó tres veces:** RN-web **no reproduce** el `Gesture.Pan`
de la Hoja · **no habría reproducido** el recorte del stepper · y **el scroll
horizontal de los filtros andaba en web y NO en el teléfono**.

**✅ Y al final C SÍ tuvo aparato:** D le prestó el dev build apuntado a su Metro,
así que **vio su propia rama corriendo en el teléfono antes de que existiera para
nadie más.** De ahí salieron el chip verificado, la mitad curable de H-205 **y
los dos rojos nuevos que el web no mostraba** (⑥).

⚠️ **Su preocupación por la carta blanca sobre el fondo nuevo quedó DESPEJADA en
aparato: la carta sí se separa, se lee como superficie y no como parche.** *Era
una preocupación razonable y el aparato la contestó.* Lo que **no** despejó es el
**alto** — eso es el rojo ② de ⑥.

---

## ⑤ `places_id` — LA AUDITORÍA QUE CREÍAMOS TENER

**Era una COLUMNA SIN ESCRITOR:** existe en el DDL, **0 de 3** direcciones la
tienen, **el wrapper no la mandaba y la RPC no la tomaba**. *El cero no probaba
que Places fallara: probaba que nuestra puerta no lo guardaba.*

🔴 **Lo grave no era la columna vacía:** guardábamos **el punto final** y **no la
coordenada que Places resolvió** ⇒ **la divergencia no era auditable después del
hecho.** Hoy son 3 direcciones y el daño es **de volumen, no de diseño**: con 500
clientes, cada punto corrido es **una entrega fallida sin causa rastreable**.

**Migración `20260820100000`, aditiva**, con reversa escrita antes y cinturón de
cuatro brazos —el tercero verifica que **un caller VIEJO sigue resolviendo**, o
sea que el bundle publicado no se rompe—.

**Las direcciones viejas NO se reparan** (firma del founder): no hay contra qué
comparar y **no se inventa un `places_id` retroactivo**. **Su NULL es la verdad:
no sabemos.**

---

## ⑥ LO QUE **NO** ESTÁ EN ESTE BUNDLE

| qué | por qué |
|---|---|
| ~~H-205, su segunda mitad~~ | ✅ **CURADO por B en el bundle.** Ver ⑨ |
| ~~la tira de PRESENTACIONES desborda~~ | ✅ **CURADO por B en el bundle** — y era una **TERCERA causa** del mismo síntoma. Ver ⑨ |
| ~~la carta de composición tapada por el CTA~~ | 🔴 **RETIRADO POR C — no era un defecto, lo había medido mal.** Medido después: la carta termina en **686** y el CTA arranca en **687** ⇒ **cero solape**; hay 267 dp por debajo del pliegue y scrolleando **se lee entera**. *`PantallaConPie` estaba haciendo su trabajo.* **Su error, declarado por ella: miró una captura ESTÁTICA, vio el borde asomando y concluyó «tapada» — nunca intentó scrollear.** *Lo que había era «hay más abajo» y leyó «no se puede llegar».* **Se deja tachado y no borrado**: es el mismo error que ella misma le había advertido a D horas antes (*«el árbol te va a decir que está en su lugar; ejercé el gesto»*) — **una captura prueba lo que se VE; para saber si algo se ALCANZA hay que ejercerlo** |
| **las 6 vistas del admin** (GMV, MRR, pitch, ranking) | siguen legibles por `anon`: cerrarlas apaga el tablero **con certeza**. Disparo escrito: **antes de compartir `/inversores` con alguien externo** |
| **la cura estructural de `consentimientos`** | su firma era condicional y la condición falló |
| **las 25 variantes con más de una oferta publicada** | **cero del mismo vendedor, 25 de vendedores DISTINTOS, hasta 48 % de brecha, ningún UNIQUE.** Es el caso **multi-vendedor** contra la firma «una oferta por producto». **La cura de C hace que se VEA; no lo resuelve — no puede.** Es de mesa |
| **oscuro y memorial** | no medidos por ninguna pista, en toda la vuelta |

---

## ⑦ AVISOS OPERATIVOS

- ⚠️ **`router.d.ts` está gitignoreado:** tras un merge el typecheck **falla sobre
  rutas que SÍ existen** hasta regenerarlo. *No mordió en los tres ensambles de
  hoy; que no muerda no es que no exista.*
- ⚠️ **El pie de Cuenta muestra el `updateId`, NO el group.** Con el criterio
  equivocado se frena un bundle sano o se declara que el founder mira el objeto
  viejo cuando mira el nuevo.
- ⚠️ **Los updateId de android e ios comparten los primeros 8 caracteres**, y en
  el bundle anterior **las dos APPS también**. Sirven para saber **qué
  publicación** corre, **no** qué app ni qué plataforma.
- ⚠️ **El teléfono no recibe OTA con un dev build instalado** (mismo package).
  **Se lee exactamente igual que D-786.** La secuencia fue: **D restaura la
  preview y la verifica por tamaño → recién ahí se publica.**

---

## ⑧ LA LECCIÓN DE LA JORNADA, con sus cobros

> **Un negativo medido una vez y citado después no es una medición: es una cita.**

**Cobrado seis veces, con seis sujetos distintos:** `adb devices` vacío (eran tres
pistas) · «no hay rasterizador de SVG» (lo había: `qlmanage`) · un `grep` con un
`=` de más · el «aviso no montado» de B, cierto al escribirlo y vencido al
citarlo · el «editable montado» de A, que miraba otro camino · y **una presencia
PREDICHA** (el toast de `<button>` anidado, que no existe en preview).

**Ninguno lo encontró leer con más cuidado. Los seis los encontró volver a medir
el objeto.** Y su hermana, de B: ***un dato propio, medido con las propias manos,
es el que menos se vuelve a mirar.***

**Y la de C, que es la que más ahorra hacia adelante:** midió la composición sobre
el producto con **25 ingredientes** —el caso rico, para ver el plegado— y con él
perdió de vista el pobre, **que son 268 de 470, la mayoría del catálogo**.
***Elegir el caso más interesante para medir es elegir el menos representativo.***


---

## ⑨ LOS DOS ÚLTIMOS ROJOS — CURADOS, y el primero es la lección de la vuelta

### 🔴 LA TIRA: TRES PANTALLAS, TRES SÍNTOMAS IDÉNTICOS, **TRES CAUSAS DISTINTAS**

| pantalla | causa |
|---|---|
| los filtros | **arbitraje**: el pan de una `Hoja` se quedaba el gesto |
| la de D | **scroller sin acotar** |
| **la tira de presentaciones** | **ANIDAMIENTO** — un scroller horizontal dentro de uno vertical que **no declara `nestedScrollEnabled`**: en Android **el padre se queda el arrastre** |

**Las dos primeras se descartaron POR LA FUENTE, no por intuición:** *no hay
ninguna `Hoja` en la ficha* ⇒ no es arbitraje · *`SelectorOpcion` **sí** tiene su
`ScrollView`* ⇒ no es scroller sin acotar. **Y el contra-caso vertical de C, que
sí movía, era la prueba: respondía el padre.**

⚠️ ***Es la clase de defecto que se «cura» tres veces mal si uno se guía por cómo
se ve.*** **C y D frenaron a B las dos veces que iba a generalizar, y tenían
razón las dos.**

✅ **Y B ejecutó el CENSO DE LA CLASE, no solo el caso:** `FichaPrestador` y
`SelectorVentana` también tenían scroller horizontal sin declararlo. *S99 escribió
esta ley —censar la clase al tercer cobro— y **no ejecutó el censo**; el cuarto
cobro llegó a la ronda siguiente. Esta vez sí se corrió.*

### H-205 — curado **sin** saber por qué falla, y eso es una virtud

**`color:'transparent'` no se honra en este Android.** Probado por C por **dos
vías independientes**, y la segunda es la fuerte: el techo mostraba el nombre en
**MAYÚSCULAS** —el crudo— y **el único consumidor que renderiza el crudo era el
`titulo` del `Encabezado`**. *Los bounds prueban qué caja es; las mayúsculas
prueban de qué prop salió el string.*

**La cura pinta con el color del propio fondo** ⇒ **no depende de saber por qué
`transparent` falla** —eso queda **sin diagnosticar y declarado así**— y **sale
del mismo token que pinta el techo, así que si el fondo cambia el apagado lo
sigue solo.** *Hoy importa doble: el fondo acaba de pasar a `#F6F6F6`.*
✅ **Conserva la accesibilidad**, que es la razón de existir de la prop.

### ⚠️ NINGUNO DE LOS TRES SE VIO CORRER

**Y el de la tira NO SE PODÍA ejercer antes de este publish:** la desambiguación
de precio de C no estaba en la preview, y **sin ella la tira no desborda** ⇒ el
experimento habría dado un **falso «no hay defecto»**. **C lo corre apenas salga
el bundle.**


---

## ⑩ ✅ VERIFICADO EN APARATO **DESPUÉS** DE PUBLICAR — sobre `01a01807`

*C verificó el pie con sus manos antes de medir nada* (`update 01a01807 · preview
· 18/08 22:18`). **Sin ese paso, todo lo de abajo mediría otro objeto.**

| | resultado |
|---|---|
| **la tira de presentaciones** | ✅ **VERDE.** Arrastre horizontal 760 → 420: los tres chips **−48 px**. Contra-caso vertical: la pantalla scrollea (1251 → 680) |
| **H-205** | ✅ **CERRADO** — el nombre aparece **una sola vez** |
| los chips desambiguados · la carta blanca sobre `#F6F6F6` · el fondo neutro | ✅ vistos |

**El −48 cierra con la aritmética y por eso vale:** el contenido terminaba en
**1022** sobre una caja de **~1025** ⇒ el desborde real era **~48 px** y **se
recorrió entero**. *No es «se movió un poco»: se movió todo lo que había.*

⚠️ **Y la espera valió:** sin la desambiguación de precio en el bundle **la tira
no desbordaba**, así que el experimento habría dado un **falso «no hay defecto»**
— habría concluido que la cura funcionaba **sin haberla probado nunca contra el
caso real.**

### 🔴 LA CUARTA TRAMPA DEL MISMO ANIMAL, EN LA MISMA JORNADA

**El primer arrastre de C fue `900 → 200` y la app NAVEGÓ a «Tus pedidos»: el
gesto se lo comió el «atrás» del sistema** (arrancó a 180 px del borde derecho,
dentro de la zona de gesto de Android).

> **Si se quedaba con esa corrida, el volcado decía «la tira no se movió» —y era
> CIERTO— y el reporte habría sido «la cura de B falló».** *El número era correcto
> y contestaba otra pregunta.* **Lo cazó que la PANTALLA había cambiado, no la
> posición de los chips.**

⇒ **al instrumento le falta un guard: todo arrastre verifica que sigue en la
misma pantalla antes de creerle a su Δ.**

**Van CUATRO formas distintas del mismo animal en un día, todas de C y todas
declaradas por ella:** la voz buscada por su paráfrasis · el selector que
envejeció con el glifo · el `goto` que reiniciaba el carrito que iba a medir · y
el borde que se roba el gesto. ***Cuatro veces el aparato midió bien y la
pregunta estaba mal.***

### ⚠️ LO QUE SIGUE SIN MEDIR CONTRA EL FONDO NUEVO

**Los CONTRASTES**: el magenta del chip, el ocre de la flecha y el disco del
carrito **se midieron contra el fondo viejo**. C verificó **con el ojo** que sobre
`#F6F6F6` los tres se leen y que la carta se separa — **pero «se lee» no es un
número de contraste, y no se presenta como si lo fuera.**


---

## ⑪ EL OBJETO DE CIERRE DE LA TANDA

    CLIENTE     group 1e082956-5461-47cf-8779-d23368ce6708   pie: 01a0188b   rt 1.0.3
    PRESTADOR   group ff5fc8ac-314d-42cf-9f5d-10f15526ef55   pie: 01a0188c   rt 1.0.5
    ANCLA (las dos)  821c099d  =  origin/main  ·  árbol 0, SIN asterisco

Las cuatro pistas contenidas · 4 typechecks exit 0 · `verify:diseno` VERDE **48**
· overlays del shell en verde · tope 10/10.

### ✅ LOS DOS RELLENOS OCRE NO COMPITEN — medido en aparato

    «Cambiar la dirección»   x 56–528     473 px    46.827 px²
    «Guardar dirección»      x 56–1023    968 px    95.832 px²   ⇒ 2,05×

**El doble exacto de superficie** ⇒ se separan por tamaño y el CTA conserva su
primacía. **«Cambiar» no cede.** Fondo confirmado en aparato: `(246,246,246)`.

### ⚠️ EL NÚMERO QUE NADIE HABÍA SUMADO

**El detalle del pedido crece ~100 dp**: **+64,4** medido (la carta de «Seguir el
pedido») y **+36** derivado (el nodo 10→32). **La pantalla scrollea y los paga**,
así que no es defecto — **y ninguno de los dos lo es por separado.** *Lo que no
existía era la suma.* **Ahora existe, y es el freno para la tercera cosa que
quiera entrar a esa pantalla.**

---

## ⑫ 🔴 LA REFERENCIA QUE ESTABA EN LA CARPETA Y DECÍA OTRA MARCA

**El canon reclama desde S99 §5bis las tres referencias de la cola del pulido, y
las daba por AUSENTES** («verificado por listado… se buscaron, no se pudieron
identificar sin adivinar, y NO SE ADIVINÓ»).

**Estaban.** El archivo del founder se llamaba **`Rappi traking 1.jpg`** y **es de
PedidosYa** — lo dice la propia imagen, impreso en la captura: **«Delivery a cargo
de PedidosYa»**, más el rojo de PedidosYa en los acentos, que no es el verde de
Rappi. Quedó como `referencia-pedidosya-seguimiento-hitos-con-hora.jpg`, **con el
literal en la fila del README**, para que quien la dude dentro de seis meses tenga
el argumento **al lado del archivo** y no en un parte.

**Y la segunda estaba mal nombrada en OTRO eje:** `Rappi trakinng2 .png` **sí es
Rappi**, pero es **la app del REPARTIDOR**, no la del cliente. *Dos archivos, dos
afirmaciones falsas, ejes distintos: una erraba la app, la otra el actor.*

> 🔴 **AL CANON: UN NOMBRE DE ARCHIVO ES UNA AFIRMACIÓN, Y VALE LO QUE VALE QUIEN
> LO TIPEÓ.**
>
> La búsqueda que lo dio por ausente **fue impecable** —ramas, remotos, `find`
> desde la raíz— **y habría fallado igual, porque el objeto estaba ahí y decía
> «Rappi» en la tapa.** *No falló el método de búsqueda: falló confiar en el
> nombre como si fuera el contenido.*
>
> **Y el riesgo era el INVERSO al que se temía:** no era poner la vara equivocada
> delante del ojo — era **dejar cerrado un hueco que estaba abierto con su propio
> objeto adentro de la carpeta.**

*Lo cerró D abriendo la imagen antes de nombrarla. El freno de no tocarla desde
el ensamble fue correcto: el que nombra tiene que ser el que la mira.*


---

## ⑬ ✅ EL OBJETO FINAL, VERIFICADO EN APARATO SOBRE `01a0188b`

*C leyó el pie con sus manos antes de medir* (`update 01a0188b · preview ·
19/08 00:43`).

| qué | estado |
|---|---|
| **H-205** | ✅ **el nombre aparece UNA sola vez.** El volcado muestra el nodo del techo (`y 137–212`) y **la captura lo muestra vacío** ⇒ *se apaga el píxel sin apagar el nombre*, que era exactamente el límite que se pidió |
| **la flecha ocre (N26.1)** | ✅ **disco ocre con chevron en tinta**, pegado al rótulo y dentro de la carta ⇒ **se lee como control de sección y no se confunde con un botón** |
| **la carta blanca sobre `#F6F6F6`** | ✅ se separa; se lee como superficie |
| **la tira de presentaciones** | ✅ scrollea — **−48 px, todo el desborde** |
| **los dos rellenos ocre del modal** | ✅ **2,05×**, no compiten |
| **el modal de dirección** | ✅ sus **cuatro pasos** y su discriminador (guardar → re-entrar → **lat/lon idénticos**) |

### 🔴 EL HALLAZGO QUE **NO** SE REPORTÓ, Y VALE TANTO COMO LOS QUE SÍ

La primera captura del bundle final mostraba **el título cortado por arriba y la
foto ausente**. *Se veía exactamente como un defecto de layout.*

**C lo ejerció antes de concluir: scrolleó al tope y estaba todo bien.** Era **la
ficha en una posición de scroll intermedia**, porque **el deep link no la abre en
0**.

> **Es literalmente la misma trampa de la «carta tapada» que ella misma retiró
> horas antes** — *una imagen quieta no distingue «está roto» de «está
> scrolleado»*. **Esta vez la vara nueva funcionó: ejercer antes de concluir.**

*Un falso rojo que no se reporta no deja rastro en ningún acta, y por eso hay que
escribirlo: es la única evidencia de que una lección cambió una conducta.*

---

## ⑭ LO QUE QUEDA ABIERTO AL CERRAR, CON DUEÑO

| qué | dueño | por qué no se cerró |
|---|---|---|
| **los contrastes contra el fondo nuevo** — chip magenta, ocre, disco del carrito | C / B | se midieron contra el fondo viejo. Con el ojo sobre `#F6F6F6` los tres **se leen** — **pero «se lee» no es un número de contraste y no se presenta como si lo fuera** |
| **el tono `neutro` del chevron: 2,40 / 2,22** | **mesa** | su palette lo llama «decorativo» y **un chevron que es la ÚNICA señal de que algo se despliega no es decorativo**. Mueve las DOS apps |
| **`guardarComoOtra`** del modal | A | **construido y NO ejercido** — el fallo fue de mi instrumento (el alias no entró al campo y el botón estaba correctamente deshabilitado) |
| **las 6 vistas del admin** legibles por `anon` | founder | cerrarlas apaga el tablero **con certeza**. Disparo: **antes de compartir `/inversores` con alguien externo** |
| **`consentimientos`**: la cura estructural | mesa | su firma era condicional y **la condición falló** |
| **25 variantes con más de una oferta publicada** | mesa | **cero del mismo vendedor, 25 de vendedores distintos, hasta 48 % de brecha, ningún UNIQUE** ⇒ es el caso **multi-vendedor** contra la firma «una oferta por producto» |
| **el detalle del pedido: ~100 dp de crecimiento** | producto | no es defecto — **es el freno para la tercera cosa que quiera entrar** |
