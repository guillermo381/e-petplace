# S116-C · LOTE 10 — el parte

**CAPTURAS: `docs/loop/capturas-s116-c-lote10/`**

Rama `pista/s116-c-05` · sobre `origin/main @ 55361836` (traído en este lote).
Aparato: AVD propio `s114_C` (`emulator-5578`), **barra de tres botones**,
cliente 1.0.7, Metro 8097 del worktree, bundle fresco verificado.

**Gates:** `tsc apps/cliente` **0** tras cada tanda · **`verify:diseno` VERDE,
81 reglas** · `verify:piezas-locales` VERDE.

---

## LA TABLA — una captura por punto

| # | qué | captura | estado |
|---|---|---|---|
| 1 | la onda fuera de la hoja, sin y con teclado, en 03 y 05 | `p1a…` `p1b…` `p1c…` `p1d…` | ✅ + las dos flechas tocadas |
| 2 | la última fila de la Despensa con su «Agregar» entero | `p2-despensa-ultima-fila.png` | ⚠️ media: la reserva ✅, el alto igual **frenado con medición** |
| 3 | la pantalla de raza | `p3-raza-pug.png` · `p3b-golden-la-raza-se-salta-sola.png` | ✅ y usada |
| 4 | la nariz al entrar | `p4-espera-de-marca-al-entrar.png` | ✅ + censo: eran **tres**, no una |
| 5 | campana y carrito con su número | `p5-…` (+ `p5b-…`, la descartada) | ✅ con su costo declarado |

---

## ① LA ONDA SALE DE LA HOJA

**Lo que el slot de pie le hacía, medido en `PieFijo.tsx:135`:** con
`material='lienzo'` (el default) el pie envuelve a su hijo en
`paddingHorizontal: spacing[5]` + `paddingTop`/`paddingBottom` **y un
`backgroundColor: theme.bg.base`** ⇒ la onda quedaba **metida 20 dp por cada
lado y con una franja de lienzo detrás**. *El magenta no llegaba al filo, que es
literalmente lo que la pieza dice que tiene que hacer* (`OndaAcceso.tsx:185`).

**Hecho:** la onda pasa a la raíz de la pantalla, hermana de la hoja, en un
`View` absoluto **sin relleno**; el contenido de la hoja gana
`paddingBottom: ALTO_ONDA_ACCESO`.

⏪ **Y esto REVIERTE mi lote 3i**, donde escribí que con el slot de pie *«muere
mi excepción de R53»*. **La excepción vuelve, y vuelve DECLARADA** (`R53` la
cuenta: 7 con pie a mano, 4 declarados). *La razón por la que R53 existe —un
consumidor que TECLEA el alto de un pie— no aplica: el número es
`ALTO_ONDA_ACCESO`, la constante que la propia pieza exporta.* Lo que R53 mató
fue un `96` tecleado.

**Va FUERA de `EvitaTeclado` a propósito**: es decoración. Con el teclado arriba
se queda en el borde y el teclado la tapa — *subirla le robaría al formulario
los 156 dp que la persona necesita justo cuando está escribiendo*. Verificado:
con el teclado abierto, «Entrar» se alcanza scrolleando (`[53,1388][1028,1517]`,
justo sobre el borde del teclado).

**Los CTA, medidos con la hoja al fondo:** en 03 entran sin scroll; en 05 hay que
bajar y ahí **«Crear mi cuenta», el botón de Google, los legales y «Ya tengo
cuenta» quedan los cuatro enteros sobre la ola**.

**Las dos flechas, tocadas:** 03 → vuelve a 01. 05 → vuelve a 01.

⚠️ **Lo que medí y NO curé:** debajo del magenta quedan **126 px (42 dp) de
lienzo** — es la franja de la barra de tres botones. La onda llega al borde del
área que la app dibuja; más abajo está el sistema. *Lo digo porque en la captura
se ve y alguien lo va a leer como un hueco.*

---

## ② LA DESPENSA — la mitad hecha y la mitad frenada CON MEDICIÓN

**✅ La reserva de abajo ya estaba y se verificó en el emulador de tres botones.**
`paddingBottom: AIRE_RAIZ + insets.bottom` (mi lote 7). Medido con la rejilla al
fondo: el último «Agregar» en `[597,1219][995,1309]`, la barra de tabs empieza en
`y=2051`. **Lo toqué: el carrito pasó de 1 a 2.**

**🔴 El alto igual por fila NO lo pude hacer desde `apps/`, y no es una excusa —
es una cadena rota adentro de `packages/ui`.** Medido en el árbol:

```
Advantage Perros 25-40 kg   [ 53,915][ 519,1893]  alto=978
Advantage Perros 4-10 kg    [562,915][1029,1783]  alto=868
```

**110 px de escalón.** La celda de `GRILLA_DE_DOS` **sí se estira**; lo que no
llena es la tarjeta. Y lo interesante: **`TarjetaProducto:400` YA tiene
`flex: 1` con su comentario** —*«es lo que deja que la tarjeta ocupe el alto de
su fila»*— **y su propio `Animated.View` de arriba (`:391`) se lo come**, igual
que el de `Entrada` (`:153`). *La intención está escrita y no llega.*

**Por qué tampoco monté el `FlatList` que la orden nombra:** `numColumns={2}` +
`columnWrapperStyle` estira **la celda**, que ya se estira — **la tarjeta
seguiría sin llenarla**. Y anidar un `VirtualizedList` en el `ScrollView` de la
pantalla es la anidación que RN desaconseja; hacerlo bien exige volver la
pantalla entera alrededor de un `ListHeaderComponent`. *Reestructurar 1400
líneas para no arreglar el defecto es el peor de los dos resultados posibles.*

⇒ pedido a B con las tres líneas exactas:
`docs/loop/buzon/S116-C-para-B-la-tarjeta-no-llena-su-fila.md`.

---

## ③ LA PANTALLA DE RAZA — nace, y el golden la manda a saltarse

Nace `PasoRazaFicha` y `raza` entra a `PASOS` entre `foto` y `datos`.

**🔴 Es un paso del RECORRIDO y NO un paso CONTADO.** Los tres pasos escriben su
número a mano (`total: 3, actual: N`). Si éste contara, quien **no** lo ve
—que es el caso normal— leería «3 de 4» habiendo hecho tres. *Un contador que
cambia según si el producto tuvo algo que contarte no es un contador.* ⇒
cabecera **empujada** con el nombre de la raza, como la orden pide, y sin barra.

**Se muestra sólo si las TRES:** ① hay ficha (`obtenerContenidoDeRaza` devuelve
`null` también cuando la raza casa y su ficha **no está publicada**) · ② la ficha
es **de la raza** y no de la especie (`es_de_especie` ⇒ el texto habla del PERRO,
no de su perro) · ③ hay algo que leer (los dos campos en `null` ⇒ una pantalla
con título y aire). Cualquiera que falle ⇒ **`replace`, no `push`**: con `push`
el «atrás» del formulario caería en una pantalla que se vuelve a saltar.

**«si un campo no existe, no se inventa»:** el bloque simplemente no se dibuja.
Sin texto de relleno y sin «Sin información» — la tercera cláusula de la ley del
5-sep.

### La corrida ordenada, y contestó distinto

**`p3b-golden-la-raza-se-salta-sola.png`** — con la foto del golden la
identificación acierta (`especie=Perro`, `raza=Golden retriever` preseleccionada)
y **la pantalla se salta sola**, porque **`golden-retriever` no tiene ficha
publicada**. Medido contra la base:

> 17 fichas activas · **7 de perro**: american-bully, beagle, bulldog-ingles,
> criollo, labrador-retriever, pug, schnauzer-miniatura. **Golden no está.**

*O sea que la orden «usala con la foto del golden» ejercita exactamente la regla
«sin ficha, se salta sola» — y eso es lo que pasó.*

**`p3-raza-pug.png`** — para ver la pantalla RENDERIZANDO subí al emulador la
imagen de catálogo del **pug** (ficha publicada) y corrí el alta completa:
cabecera «Pug», «Saltar» arriba a la derecha, el personaje, «De dónde viene» y
«Cómo es» con el texto real. **Toqué «Continuar» y llegó a 2/3 con `Perro` y
`Pug` puestos.**

### 🔴 Y usarla destapó un cuelgue que era MÍO

Volviendo de 2/3 a 1/3 y tocando «Continuar» otra vez, **la pantalla se quedó en
«Mirando la foto» más de tres minutos, DOS veces.** El `avanzar` de `PasoFoto`
dice *«se avanza SIEMPRE»* y era verdad — **pero sólo si la promesa TERMINA**.
Una promesa colgada no falla: deja la pantalla quieta, sin error, sin log y sin
salida. *Es la clase que esta casa ya tiene escrita —un arnés colgado no falla,
su silencio se lee como progreso— un piso más abajo.*

**Dos curas, y hacen falta las dos:** un techo de **30 s** en la identificación
(las sanas tardan 3-6 s medidos acá) que cae al mismo `catch` y no frena el alta;
y **la espera gana su `pie`** («Seguir sin reconocer»). ⏪ No tenía pie, con su
razón escrita: *«de esta espera no se sale»*. **Era cierto hasta que se colgó.**
*El techo tapa la falla que ya conozco; la puerta tapa la que todavía no.*

---

## ④ LA NARIZ AL ENTRAR — y el censo contestó TRES, no una

`HuellaDeLlegada` → **`EsperaDeMarca`**. El censo que la orden pide:

```
apps/cliente/src/app/login.tsx:472
apps/cliente/src/app/registro.tsx:379
apps/cliente/src/app/recuperar.tsx:426
```

**Las tres pantallas de acceso, el mismo instante en las tres.** Curé las tres:
*curar sólo la que el founder vio habría dejado dos caminos de entrada con otra
espera, y ésa es la divergencia que nadie descubre hasta que alguien recorre el
tercero.*

⚠️ **`HuellaDeLlegada` queda con CERO consumidores.** No la mato yo: es de
`packages/ui`.

---

## ⑤ CAMPANA Y CARRITO CON SU NÚMERO

**Hecho, y con `DiscoVidrio`** — la pieza que B sacó en su lote 12, que es la
salida que yo había votado en mi buzón del lote 9. El techo del Hogar deja de
dibujar su propio círculo.

**🔴 ESTO RETIRA UNA LETRA FIRMADA Y LO DIGO ACÁ, NO SÓLO EN EL CÓDIGO.**
`LAMINA_CAMPANA` (S89) manda la HUELLA y **prohíbe el número**, con su razón
escrita —*«el número invita a vaciarlo»*— y el wrapper la sostiene desde el dato:
`hayNovedades()` devuelve un booleano a propósito, *«la forma del dato hace
imposible el defecto del contador»*. La orden de hoy pide justo eso. **Manda la
firma nueva.**

⚠️ **Y cambia la SEMÁNTICA, que es la mitad que no se ve:** S89 medía **lo
NUEVO** (se apaga al VISITAR /avisos); *no leídos* mide **`leida` por aviso** (se
apaga al LEER cada uno). Son dos hechos distintos y el número que la orden nombra
es el segundo.

**El costo del número, declarado:** el motor **no tiene un contador** — censé
`campana.ts` entero: `hay_novedades` (booleano), `obtener_mis_avisos` (lista),
`marcar_aviso_leido`; **ninguna cuenta**. ⇒ el número sale de contar la lista.
**Es un viaje por un viaje** (L-223: el peaje es por PETICIÓN), **pero la carga
útil crece**: antes un `boolean`, ahora hasta 100 avisos con título y mensaje en
cada foco del Hogar. *No es gratis y no lo pinto como si lo fuera.* Pedido a A:
`contar_avisos_no_leidos`. **100 y no 50** porque el disco dice «99+» a partir de
ahí: con techo de 50 el número mentiría **callado**.

**Verificado tocando:** «Avisos, 34 sin leer» abre /avisos; «Carrito, 1 producto»
abre el carrito. De paso curé el plural, que decía **«1 productos»** en el propio
control que la orden pide.

### 🔴 Y la combinación se eligió MIDIENDO las dos, no razonando

**`p5b-descartada-glifo-blanco-numero-ilegible.png`** es la que **descarté**:
`DiscoVidrio` + `Badge forma="contador"` + `Icono tinta` da el glifo blanco
perfecto y **el número casi ilegible** (`Badge` rinde `Insignia estado="atencion"`,
colores de `theme.status`, pensados para lienzo).

**`p5-campana-y-carrito-con-numero.png`** es la que quedó: `GlifoConContador` da
el **número nítido** y el glifo **apagado** (`GlifoConContador:124` dibuja
`<Icono>` **sin tinta** y cae a `registro='capa'`).

⇒ **gana la que conserva el número, porque el número es lo que la orden pide.**
La cura de verdad es una línea en `packages/ui` —`tinta` en `GlifoConContador`,
la mitad (a) de mi buzón del lote 9— y va **con las dos capturas**, para que no
se discuta de memoria.

---

## D-1117 — el rojo de A desapareció, y conviene saber por qué

A midió que `R32` daba rojo sobre código correcto: el `gap` de la fila quedó a 28
líneas de una ventana de 25 **porque yo metí el carrito en el medio**, y **se negó
a curarlo duplicando un token**. Tenía razón.

Al reescribir esa fila para el punto 5, la fila quedó compacta y **el declarante
volvió adentro de la ventana**: `verify:diseno` da VERDE sin `SALTAR_GATE`.
*El rojo se fue como efecto de hacer el trabajo, no de aplacar al lint* — pero
**la ficha sigue viva**: lo que A describe es un límite del instrumento (ventana
por líneas en vez de árbol de montaje) y hoy simplemente no está disparando.

⚠️ Y de paso `R32` me cazó a MÍ, con su número: al juntar los dos discos puse
`gap: spacing[3]` y el hueco medido quedó en **32 px ≈ 11 dp** contra el mínimo
de 20. Restaurado a `spacing[5]`.

---

## LO QUE NO HICE, Y POR QUÉ

· **El `FlatList` de dos columnas** — frenado con medición (punto ②).
· **Matar `HuellaDeLlegada`** — `packages/ui`, cero consumidores, al buzón.
· **La tinta del glifo** — `packages/ui`, al buzón con las dos capturas.
· **Publicar la ficha del golden** — es contenido con **firma humana** (el CHECK
  de `razas_contenido` exige `revisado_por`). *Ni se me ocurre firmarla yo.*

## UNA NOTA DE HIGIENE, PORQUE ES DE CREDENCIALES

Al cargar la cuenta de prueba en 03 volqué el árbol de la pantalla para ubicar
los campos, y **el correo de la cuenta quedó impreso en el transcript** (la clave
no: la pantalla la enmascara). No es un fallback ni un archivo: fue un dump de
pantalla. **La regla de `D-1035` dice que esa cuenta no se imprime ni enmascarada**
⇒ lo declaro en vez de omitirlo, y de acá en adelante en las pantallas de acceso
volco por `bounds` y no por texto.
