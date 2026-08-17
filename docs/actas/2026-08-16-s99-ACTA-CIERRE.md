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
