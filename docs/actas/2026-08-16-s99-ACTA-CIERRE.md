# S99 · ACTA DE CIERRE — LA DESPENSA GANA SU MOTOR DE VERDAD, Y EL EXPEDIENTE DEJA DE PERDER EVENTOS

> **Se lee ANTES del bloque de estado del canon, que es su resumen.**
> Cuatro pistas: **A** (motor · `packages/api` · docs · merges/publish) ·
> **B** (`packages/ui` · marca) · **C** (superficie del prestador) ·
> **D** (recorrido del cliente · seguimiento).
> **El canal entre pistas estuvo CAÍDO toda la sesión: todo viajó por el
> repo.** *Y esa restricción, que parecía un costo, produjo el rasgo de
> método de la jornada — abajo, §6.*

---

## §1 · LO QUE SE ENTREGÓ, EN UNA LÍNEA POR FRENTE

**EL DEFECTO MÁS CARO NO ESTABA EN LA DESPENSA: EL BIO-EXPEDIENTE PERDÍA
EVENTOS AL PAGINAR.** El timeline ordenaba por `fecha_evento` sin desempate y
cortaba con `< cursor` **estricto** ⇒ los eventos que compartían la fecha del
corte **no se repetían: desaparecían**. Medido con discriminador sobre dos
mascotas reales: **el cursor viejo alcanzaba 55 de 62 — perdía 7, el 11 %.**
Curado con clave compuesta `(fecha_evento, id)`, cursor opaco, consumidores
intactos, e instrumento permanente **con su discriminador adentro**
(`verify-timeline-paginacion-s99.mjs`). *Apareció censando otra cosa.*

**UN SOLO INVENTARIO, DOS BOCAS** (firma del founder, `MODELO_DESPENSA`
§8.6quinquies v2.7). Los cuatro puntos medidos: misma tabla ✅ · la carrera
cerrada ✅ (la reserva descuenta del disponible y el mostrador lee ese mismo
número) · el ledger ✅ · **y el reloj de reservas, que era el único rojo — y
cuya cura obvia era un arma:** `expirar_reservas_vencidas` filtraba solo por
`expira_en` y **las 13 reservas vivas eran las 13 de pedidos PAGADOS**; un
tick habría devuelto 15 unidades vendidas al disponible. **Primero el gate,
después el reloj.** Cinturón por discriminación: viejo 12, nuevo 0.

**LA BANDA DE PRECIO** — decisión de mesa delegada por el founder y reversible
por su palabra: referencia por variante, **±15 % libre**, fuera de banda
propone y e-PetPlace aprueba. **La referencia nace NULL y la carga el equipo**
(sembrarla del precio actual es circular) y **mientras sea NULL, fail-closed**.
El 15 % vive en `app_config`, **jamás como constante**.

**LA PAGINACIÓN DE STOCK, ENTERA**: cursor (no offset), `nombre ASC, id ASC`,
total, los tres filtros al servidor, y **las razones con UN SOLO DUEÑO** — el
servidor las emite, el cliente les pone dueño y voz.

**EL ESPEJO ORDENA IGUAL EN LAS DOS CARAS** — divergía (el vendedor por fecha,
la vitrina **sin orden**) y no se veía porque *el orden es invisible hasta que
alguien pagina*.

**LA SIEMBRA QUE HIZO POSIBLE TODO LO DEMÁS**: 399 productos comprables, **25
variantes con dos vendedores** (antes: cero), inventario con reparto
deliberado —holgado · escaso de 2-3 para agotar en vivo · **cero de verdad**—
y **dos pedidos pagados en el MISMO instante** para el guard del FIFO.

**SUPERFICIE (B · C · D):** la barra flotando con ícono y texto en disco r34 ·
el pin con el par invertido · los cuatro glifos de nodo · `EntradaDeCruce` ·
la gramática de bloque · **«Tu tienda» en dos segmentos con la vitrina adentro
del stock** · el chevron en Administrar · el FIFO con su comparador y su guard.

---

## §2 · LAS FIRMAS DEL FOUNDER, CON SU LITERAL

| Firma | Literal |
|---|---|
| **Un solo inventario** | *«tanto si vendo desde el local como si vendo a través de e-PetPlace me tiene que afectar el inventario»* |
| **El carrito y la reserva** | *«se puede dejar en el carrito, pero ya no se reserva… si no lo tienen, le dice PRODUCTO YA NO DISPONIBLE»* |
| **`hay_stock` booleano** | dato de producto permanente; la familia necesita *«¿puedo comprar esto?»*, no el inventario ajeno |
| **La banda de precio** | *«lo que vos consideres que es lo mejor para el sistema, apliquémoslo»* — delegada, **reversible por su palabra** |
| **«Tu tienda»** | *«tienda, y escuchando lo que dices, tenés razón»* · *«SOLO TENDRÍAMOS UNA PANTALLA: la configuración del local y la del stock… y dentro de la del stock está la vitrina»* |
| **El hallazgo que la ordenó** | *«me deja verlo, pero no identifico fácilmente cómo lo edito… le falta administrar el stock»* ⇒ **no faltaba una pantalla: la vitrina mostraba y no dejaba tocar** |
| **La moto** | revierte su firma anterior: **púrpura oscuro**, no claro |
| **El isotipo del pin** | *«se ve bien, no hay necesidad de cambiarlo»* |
| **El cierre** | *«no abramos frentes nuevos… posteriormente abrimos una sesión para el PULIDO DE LOS COMPONENTES»* |

---

## §3 · OPERATIVO

**OTA de cierre — las dos apps del MISMO ancla `d93edd32`, `dirty: None`,
ancla verificada en `origin/main`, carga de 25 commits sin merges:**
- **prestador** · group `001006f0-2f4a-4e71-97fb-1cfade2a264b` · id
  `01a00d5a-109e-7e83-9b6b-e3939a3f2428` · runtime 1.0.5
- **cliente** · group `4d913a2c-d272-425a-bd8d-b813fdb31612` · id
  `01a00d5a-b5e0-7ef9-84fe-bd2169013263` · runtime 1.0.3

> ⚠️ **D-785 EN CARNE, Y HAY QUE DECIRLO: los dos ids comparten los OCHO
> primeros caracteres** (`01a00d5a`) porque UUIDv7 comparte prefijo por
> diseño. **El pie de la app muestra 8** ⇒ *para este par, el pie NO distingue
> entre las dos apps.* Se separan recién en el bloque siguiente:
> prestador `…109e…` · cliente `…b5e0…`.

**Migraciones de A:** el gate del reloj + la voz del saldo + el juez de
coherencia · `hay_stock` · la puerta alcanzada a la competencia ·
`v_skus_vendedor` · el espejo de orden y razones · la banda de precio · la
propuesta pendiente. **Todas con cinturón, reversa y 76(g) declarada.**

---

## §4 · LO PENDIENTE, CON DUEÑO

| Qué | Dueño | Estado |
|---|---|---|
| **D-842 · la transición del dual** | **D** | 🔴 **causa LOCALIZADA** (*no falta una transición: sobra un salto*), 3 hipótesis y **4 curas descartadas con su razón**. Es **regresión reportada dos veces** — va a pulido **sin degradar su gravedad** |
| **D-843 · las dos caras paginan distinto** | A + superficie | disparo medible: **catálogo ≥ 600** |
| **La banda: cargar las referencias** | **equipo** | tarea humana; hoy 444 sembradas (fixture) y los reales en NULL |
| **D-838 · borrar la siembra** | A | **antes del primer vendedor real**, con su orden de borrado escrito |
| **D-834** | 🧊 | congelada |
| **D-825** | B | solo-baja, **se cura al TOCAR** |

---

## §5 · LA COLA DE LA SESIÓN DE PULIDO — con su análisis YA HECHO

**Está en `PLAN_S99.md`, no acá, para que esa sesión no lo re-derive:** las
tres referencias (PedidosYa + Uber ×2) con su lectura —**apilan OBJETOS, no
filas**, que es lo que produce el «hay un diseño detrás»— · **la ficha del
repartidor estilo Uber** con su jerarquía y su razón (*la placa manda porque
es lo que se verifica en la calle*) · **la lista de hitos con hora** (el dato
existe en el motor; exponerlo es una línea) · **`nodoFacturado`** · **D-825** ·
**D-842**.

> ⚠️ **Y lo que falta y alguien tiene que poner: las tres capturas NO están en
> el repo.** El análisis quedó; **las imágenes viven en el chat, y el chat
> muere.** Van a `docs/laminas/referencias/` antes de que abra el pulido.

---

## §6 · EL RASGO DE MÉTODO DE LA JORNADA: SIETE VECES LA MEDICIÓN CORRIGIÓ A LA MESA

**Y las siete las corrigió una pista que midió en vez de ejecutar.**

1. el anillo del pin · 2. los «26 curados» · 3. la trampa del rename ·
4. la lectura del frame de la barra (superseded por el video) ·
5. **la generalización del symlink** (*«esto es directo para B»* — y el
   worktree de B resolvía a sí mismo) · 6. **«el chevron ya está»** (cierto en
   la rama, **falso en el canon**) · 7. **la reestructura pedida DOS veces**,
   que ya estaba en `main`.

**⇒ LA FORMA FINAL DEL COROLARIO: LA MESA RELEVA LO QUE LEYÓ EN UN REPORTE,
NO LO QUE HAY EN MAIN** — *un reporte dice «lo hice»; el canon dice «está»* —
**y cuando generaliza la medición de UNA pista a las cuatro, esa
generalización ES el dato a verificar.**

**Y lo que hace que esto funcione en vez de ser una lista de reproches: la
mesa registró sus siete errores en el mismo canon donde registra los de las
pistas.** *Un canon donde solo se anotan los errores ajenos se vuelve un
expediente disciplinario, y ahí nadie frena a nadie.*

**Y su gemela, del lado de las pistas — las tres que C se cobró a sí misma:**
un bloqueo declarado **envejece igual que un dato** (le pasó **dos veces el
mismo día, en las dos direcciones**) · *«está en origin» no es «está en el
canon»* · y **una analogía cómoda reemplaza a una medición** *(la vez que B la
corrigió citándole su propio número)*.

---

## §7 · LAS LECCIONES DE S99 — L-245 → L-276

**Las que más van a volver:** **L-268** (una lista completa y una truncada se
ven igual — *ningún guard la caza; la cazó la siembra*) · **L-271** (la
paginación sin orden estable es una lotería que se ve prolija, **y los
empates NO son artefacto de siembra: `now()` no avanza dentro de una
transacción**) · **L-269** (declarar alcanza para un hueco, **no para una
regresión**) · **L-272** (*un fixture que entra por la puerta prueba dos
cosas: la suya y la de la puerta* — **cuatro gates cobraron y ninguno se
esquivó**) · **L-276** (*un agregado sobre objetos distintos no mide ninguno*)
· **L-273/L-274** (un nombre correcto puede volverse falso sin que nadie lo
edite; una etiqueta nombra su número, no su pantalla).

**Reglas nuevas del contrato: la 88** (*el merge a `main` es de una sola
mano*) y el corolario de la 85 (**el worktree aísla el árbol, NO
necesariamente los paquetes** — con el tercer estado nombrado: **ENGANCHADO**).

**Y dos colisiones de numeración declaradas y resueltas con criterios
opuestos, que ahora son regla:** `D-832` **se corrió** (una de las dos no
había viajado) · las **dos reglas 87 NO se mueven, se desambiguan por nombre**
(las dos ya circulaban). ⇒ ***se mueve lo que todavía no fue citado; se
desambigua lo que ya circula.***

---

## §7bis · EL OTA DE CIERRE SÍ LLEGÓ — resuelto por EVIDENCIA, no por medición

La mesa levantó la duda de *«el OTA no está publicado, o no le llegó»* y pidió
medirlo en las dos direcciones. **La verificación quedó interrumpida a mitad —
y no hizo falta: el founder GATEÓ la barra publicada**, con seis
observaciones sobre la forma del disco y del valle. **Solo se puede describir
así lo que se está mirando.**

**Se registra como resuelto POR EVIDENCIA y se dice cuál**, en vez de
declararlo verificado: *ancla `d93edd32` · pie `01a00d5a…` · runtimes 1.0.5 y
1.0.3, que son los de los binarios del founder.* **Lo que NO se llegó a
verificar del objeto es el mapeo rama→canal**, y queda dicho por si alguna vez
vuelve la duda: **es lo primero que hay que mirar**, porque un publish a una
rama no mapeada sale «bien» y no llega a nadie.

## §8 · LO QUE ESTA SESIÓN **NO** HIZO, SIN MAQUILLAR

- **La transición del dual sigue saltando.** Es lo más visible del gate y
  **cierra sin curarse.**
- **La barra NO pasó su gate**, y su diagnóstico cambia el pedido: **el
  problema es la GEOMETRÍA, no el color** — el disco asoma casi entero, así
  que el valle es superficial y *la S existe pero no tiene recorrido*. Las
  tres salidas que el founder ofrece son de color y **ninguna arregla esto**.
  Diagnóstico completo en `docs/laminas/2026-08-16-s99-GATE-BARRA-diagnostico.md`.
- **Ninguna de las referencias de precio reales está cargada** ⇒ la banda vive
  hoy sobre un fixture.
- **La reestructura de «Tu tienda» se construyó y NO se vio en un teléfono
  antes de este OTA** — C lo declaró sin atenuante: *«todo está verificado por
  typecheck, lint y medición contra la base, y ninguna de las tres ve una
  pantalla»*.
- **El E2E por wrapper del lector paginado del vendedor NO corrió** (no tengo
  credencial de vendedor y no salí a buscar una); lo que sí está probado punta
  a punta es **el mismo predicado de keyset**, en el test del timeline.
- **`especies_aplicables` aterriza en el PRÓXIMO publish** — se agregó después
  del OTA de cierre y ninguna superficie lo consume todavía.

---

## §9 · EL ÚLTIMO OTA DE S99 — publicado, con dos correcciones medidas adentro

**Ancla `141a372d`, las dos apps, `dirty: None` en las cuatro entradas (leídas del OBJETO).**
· **PRESTADOR** `01a00da9-0935…` · group `ed88aee5` · runtime **1.0.5**
· **CLIENTE** `01a00da9-d974…` · group `c1b2f5a2` · runtime **1.0.3**

**⚠️ D-785 OTRA VEZ, y hay que decirlo ANTES de que el founder mire el pie:** los dos
updates comparten los **8 primeros caracteres** (`01a00da9`) ⇒ **el pie de Cuenta va a
mostrar LO MISMO en las dos apps.** Se distinguen recién en el carácter 10
(`-0935` prestador · `-d974` cliente). **Contra el par anterior sí se distinguen**
(`01a00d8f`/`01a00d90` → `01a00da9`): *sirve para saber que LLEGÓ algo nuevo, no para
saber CUÁL de las dos apps estás mirando.*

**Lo que lleva:** la barra como **TELA** — montañas **máximas en viaje (9 px) y mínimas
en reposo (2 px)**, la del lado del viaje creciendo más, y los **íconos centrados
derivados de la posición del disco** (no de dos cuentas distintas).

**🔴 LO QUE NO LLEVA, Y POR QUÉ (medido antes de escribir código):** el **hueco gris**.
La cura propuesta —pasar `tabBarStyle`— **es un no-op**: la barra se monta con un
**tabBar CUSTOM**, `BarraTabs` no lee esa opción (cero menciones) y el custom solo
recibe `{state, navigation}`. **Y la causa real ya estaba medida en el repo desde S85**
(`apps/prestador/src/app/_layout.tsx`): el navegador pinta `colors.background` en dos
capas propias y **el tema por default de expo-router lo tiene en `rgb(242,242,242)`** —
literalmente «blanco grisáceo». La misma nota **ya midió que hacerlas transparentes
ROMPE la transición firmada**. Detalle y camino de cura en
`docs/laminas/2026-08-16-s99-GATE-BARRA-diagnostico.md`.

**Verificación de la publicación:** `verify:diseno` VERDE con **40 reglas** · typechecks
**4/4 VERDES** *(con el hallazgo de L-282: el rojo inicial del prestador era un
`router.d.ts` generado y VIEJO en este árbol — con los tipos frescos, el mismo commit
compila verde)* · árbol en **0** al bundlear (se apartó un `.claude/settings.json`
malformado, guardado en scratchpad).

---

## §10 · EL OTA FINAL DE S99 — **la S existe por primera vez**

**Ancla `0770b967`, las dos apps, `dirty: None`.**
· **PRESTADOR** `01a00dd4-c7c7…` · group `d35bf3d9` · runtime **1.0.5**
· **CLIENTE** `01a00dd5-9478…` · group `c9f60bb2` · runtime **1.0.3**

**✅ Esta vez los pies SÍ se distinguen** (`01a00dd4` vs `01a00dd5`) — el par anterior
compartía los ocho. *No se arregló nada: se tuvo suerte con el contador. D-785 sigue
viva y el próximo par puede volver a colisionar.*

**Los tres números sobre lo CONSTRUIDO** (instrumento que **extrae `pathBarra` del
archivo real**, no reimplementa la fórmula — que es lo que lo vuelve prueba y no eco):
**columnas sobre el plano `0` en los tres casos** (vara 0) · **ratio `1,10` en reposo y
`1,11` en viaje** (vara 1,08) · **inflexión al 50 % de profundidad** = el piso duro
firmado · **anillo `9,00`**. **Antes: `0,83`** — el plato ancho y poco profundo,
confirmado por número.

**Los dos defectos que encontró el INSTRUMENTO y no el ojo, los dos curados POR
CONSTRUCCIÓN:** ① el **retraso del valle mordía el disco** (−2,78 px en viaje) — y
**con el anillo en 10 ya mordía 2 px sin que nadie lo midiera**: *no lo rompió bajar el
anillo, lo destapó medirlo* (**L-284**); curado derivando `retraso = ANILLO − 2`, el
defecto pasa a ser **inexpresable**. ② en el **tab del extremo el path se dibujaba al
revés** — el clamp del disco no conocía el valle nuevo; curado con
`margenDisco = RADIO_BARRA + VALLE_SEMI`: *«entra el disco y su valle, o no entra
ninguno»*.

### Servido al founder, sin bloquear el OTA
· **Lo que se ve juntando los paneles y NO es un número:** en la vara **el disco es más
grande respecto de la barra** y el valle lo abraza más. Es la decisión abierta de
siempre —**disco/alto 0,78 contra 0,66**— con su precio sin cambios: **barra de 100 o
disco de 56**, y en los dos **el texto sale del disco**.
· **En el tab del EXTREMO el hombro queda comido por la esquina redondeada**
(ratio 1,65). **Degradación acotada** —el anillo aguanta en 8,97— y darle hombro
exigiría **correr el disco más adentro de su tab**. **B no lo decidió.**

### Lo que va con este OTA además de la barra
Las **cuatro cosas sin mirar desde hace varias tandas**: el **chevron en Administrar**
—la pregunta que abrió todo este arco— · el **interruptor del espejo** · **«Tu local ·
Tu stock»** · el **pin con el par invertido**.

---

## §11 · **EL OTA FINAL DE S99 — la barra COMPLETA**

**Ancla `ea682858`, las dos apps, `dirty: None`.**
· **PRESTADOR** `01a00def-e6b0…` · group `a5be2bd9` · runtime **1.0.5**
· **CLIENTE** `01a00df0-a286…` · group `0e65489f` · runtime **1.0.3**

**⚠️ Los dos pies se distinguen SOLO en el octavo carácter** (`01a00de`**f**` vs
`01a00df`**0**`). *Se distinguen de verdad, pero a simple vista se leen iguales* —
D-785 sigue viva y el indicador sigue siendo de 8.

**La geometría final, medida sobre lo construido:** columnas sobre el plano **0 en los
tres casos** · ratio **1,10** reposo · **1,11** viaje · **1,26** extremo (vara 1,08) ·
**INFLEXIÓN AL 50 % EN LOS TRES** —la condición de esta palanca: **acercó el disco al
borde SIN TOCAR EL VALLE**— · anillo **9,00** · blanco entre disco y filo **28,4 →
22,1** · **el disco NO se corre con 3 ni con 4 tabs (0,0)**.
**Cero números nuevos:** `radius.md = 12` y `spacing[2] = 8` son **escalones de las
escalas cerradas**.

**🔴 El costo aceptado resultó MUCHO MENOR que el declarado** — y la causa es de método:
**el hombro medía el trozo equivocado.** *«Lo que importaba no era cuánto SOBRA, era
cuánto SE COME EL RADIO.»* Re-medido: **hombro 0,0 → 1,8 px · ratio 1,39 → 1,26 ·
inflexión de 0 % a 25 % del ancho**, a un paso del reposo (35 %). **La pared del extremo
pasó de ser casi toda esquina a ser casi toda curva.** ⇒ depositado como **la cara
complementaria de L-285**: *la variable equivocada no tiene sesgo — infla o desinfla
según de qué lado caiga, y ésta iba a hacerle aceptar al founder un costo que casi no
existía.*

**Y B curó una nota vencida sin que nadie se lo pidiera** (**L-245bis**): `RADIO_BARRA`
justificaba su valor con *«el escalón para superficies grandes APOYADAS»* — **una razón
que caducó el día que la barra fue a sangre**. *La nota no mentía sobre el qué: mentía
sobre el porqué, y eso ningún lint lo ve.*

**Lo que el founder tiene en la mano:** la barra **completa** —tela · inflexión al 50 %
en los tres casos · a sangre · disco centrado · íconos centrados · anillo uniforme— más
las **cuatro que no mira desde hace varias tandas**: el **chevron en Administrar** (la
pregunta que abrió todo este arco) · el **interruptor del espejo** · **«Tu local · Tu
stock»** · el **pin con el par invertido**.
