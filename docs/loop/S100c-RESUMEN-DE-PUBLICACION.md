# S100c · RESUMEN DE PUBLICACIÓN

> Mano publicadora: **pista A**. Escrito con el repo y la base a la vista el **18-ago-2026**.
> **Todo SHA y toda ancla de acá se midió del objeto.** *Lo derivado decae mientras el objeto no.*
> **Se publica para GATEAR, no para cerrar.**

---

## 🎯 ⓪ter · EL BUNDLE DEL GATE — **FINAL. ÉSTE es el que se mira**

| | |
|---|---|
| **`main`** | **`e20113b6`** · árbol en **0** |
| **OTA cliente** | group **`e6ebf9d3`** · runtime **1.0.3** |
| **OTA prestador** | group **`2e57c413`** · runtime **1.0.5** |
| **ancla de las dos** | **`e20113b6`**, leída del OBJETO en las 4 plataformas · `dirty: None`, **sin asterisco** |

**Lo que este bundle tiene y el anterior NO:** el **glifo `pedido` CONSUMIDO** (`_layout.tsx:192` —
antes la tab Pedidos dibujaba `despensa` y quedaban **dos tabs vecinas con la misma bolsa**) y **la
miniatura montada** en la lista de pedidos. *Sin esto el founder habría vuelto a ver su hallazgo original
—«pedido 17 de agosto, pedido 17 de agosto»— y lo habría leído como «la cura no funcionó» cuando la
verdad era «la cura no viajó».* **Aviso de D, y tenía razón.**

**CORTE DECLARADO:** lo que `origin/pista-d` tiene más allá de `e20113b6` es **solo `docs/loop/S100c-D.md`**
(medido) ⇒ **no hay nada de código afuera del bundle.**

### 🔴 UN ERROR MÍO, DECLARADO: EL ANCLA NO COINCIDIÓ CON LO QUE DECLARÉ

**Declaré `b4ec5445` y publiqué contra `e20113b6`.** Lo cazó verificar el ancla contra el objeto después
de publicar — *que es exactamente para lo que sirve declarar antes.*

**La causa es mía y no de nadie más: LEVANTÉ LA VEDA ANTES DEL ÚLTIMO PUBLISH.** B estaba autorizada a
depositar y depositó (`e20113b6` = L-305 al canon), y `main` se movió debajo de mí mientras yo bundleaba.

**El daño, medido antes de decidir:** `git diff --name-only b4ec5445..e20113b6` → **`docs/DEUDAS_CANONICAS.md`
y nada más** ⇒ **el bundle es funcionalmente idéntico al declarado.** Con eso, la salida correcta era
publicar el prestador **contra el mismo `e20113b6`** para que las dos OTA compartan ancla, y no
re-declarar el número viejo. *Un ancla que no coincide no se corrige escribiendo el número que uno quería:
se corrige diciendo cuál salió.*

**La lección, que es de secuencia y no de git:** **la veda se levanta DESPUÉS del último publish, jamás
cuando la última pista avisa que está en cero.** *Avisar que estás en cero no es lo mismo que quedarte en
cero* — y la mano que publica es la única que sabe cuándo terminó de bundlear.

---

## ⓪bis · EL SEGUNDO BUNDLE — superseded por ⓪ter (le faltaba el glifo consumido)

| | |
|---|---|
| **`main`** | **`902cb47b`** · árbol en **0** |
| **OTA cliente** | group **`63188915`** · runtime **1.0.3** |
| **OTA prestador** | group **`1079553c`** · runtime **1.0.5** |
| **ancla de las dos** | **`902cb47b`**, **leída del OBJETO** en las 4 plataformas |
| **asterisco** | **NINGUNO** — `dirty: None` en las cuatro |
| Metro | **`--clear-cache` en los dos publish** |

**Ancla DECLARADA antes de elegir** (`902cb47b`) y después verificada contra el objeto: coinciden.

**Instrumentos sobre ESTE ensamblado:** los **4 typechecks exit 0** · `verify:diseno` **VERDE 46 reglas**
· `verify-s100c-disponibilidad` **18/18**.

**Orden del segundo ensamble:** `main` (ff) → **B** `0fd68bfb` → **C** `d85c44e0` → **D** `bdee13e2`.
**Cero conflictos en las tres.** (A ya estaba dentro desde el primer bundle.)

**Lo que entró en esta segunda pasada y no estaba en la primera:** el **glifo `pedido`** (caja con tapa —
antes la tab nueva prestaba el de la despensa y quedaban dos vecinas con el mismo dibujo) · la **quinta
tab** de D · el **orden por especie** de C (H-301 firmado) · el cierre de cola de B.

**Sujetos vivos, re-medidos DESPUÉS de este publish:** envío `474e6ff6` **`hacia_destino` · 6 puntos** ·
pedido `21fb1284` **`entregado` · 2 ítems · 1 depósito total** ⇒ **los tres intactos.**

---

## ⓪ EL PRIMER BUNDLE — la base, ya superseded

| | |
|---|---|
| **`main`** | **`efa59a6d`** · árbol en **0** |
| **OTA cliente** | group **`34658f38`** · runtime **1.0.3** |
| **OTA prestador** | group **`2bb6f6f7`** · runtime **1.0.5** |
| **ancla de las dos** | **`efa59a6d`**, leída del OBJETO (`update:view <updateId> --json` → `gitCommitHash`, las 4 plataformas) |
| **asterisco** | **NINGUNO** — `isGitWorkingTreeDirty: None` en las cuatro |

**El ancla se DECLARÓ antes de elegir** (`efa59a6d`) y después se verificó contra el objeto: coinciden.
⚠️ **`update:list --json` NO expone `gitCommitHash`** (confirmado otra vez acá) y en esta versión de
`eas-cli` **`update:view` rechaza `--non-interactive`** y devuelve una **lista**, una fila por plataforma.
*Se anota porque los tres detalles hacen fallar el comando del canon tal como está escrito.*

**☑️ SUPERSEDIDO POR `902cb47b` (§0bis), como estaba previsto.** El founder decidió **una pasada
completa** en vez de un gate a medias. **Este bundle queda como base verificada; el objeto del gate es el
de arriba.** *Se conserva porque su ancla y sus verdes son ciertos y porque el canal guarda los dos
groups: quien mire el historial del canal tiene que poder saber cuál era cuál.*

---

## ① ORDEN DE ENSAMBLE, DECLARADO — B → C → A → D

**Fundación primero, después el recorrido en el orden en que la familia lo camina.**

| # | rama | por qué ahí |
|---|---|---|
| 1 | **B** `packages/ui` | es lo que las tres consumen. Las apps aterrizan sobre las piezas finales, no sobre las viejas |
| 2 | **C** vitrina y ficha | la puerta de entrada del recorrido |
| 3 | **A** carrito · checkout · resumen | consume ui + api |
| 4 | **D** pedidos · en-camino | la más grande (24+ commits) y la más integrada — **última para reconciliarla contra todo lo demás ya puesto** |

**Un solo conflicto en las cuatro:** `producto/[productoId].tsx`, dos estados adyacentes (el plegado de
composición de C y el `consultandoMaximo` mío). **Los dos se conservaron: no competían.**

⚠️ **C y D movieron su SHA MIENTRAS ensamblaba** y hubo que re-mergear. *C me corrigió una lectura
vencida —medí `8f8bec14` y ya valía `956928fd`— y tenía razón: cierto al medirse, falso al usarse.* Los
SHA finales se releyeron de `git ls-remote` inmediatamente antes de cada merge.

---

## ② 🔴 EL AVISO QUE TIENE QUE VIVIR ACÁ Y NO EN UN MENSAJE (de D)

> **`apps/cliente/.expo/types/router.d.ts` ESTÁ GITIGNOREADO, y S100c mudó rutas.** Nacen `/pedidos`,
> `/pedidos/pedido/[pedidoId]` y `/pedidos/en-camino/[pedidoId]`; mueren sus versiones bajo `/despensa`.
> **Después de mergear, `tsc apps/cliente` FALLA sobre rutas que SÍ existen** hasta regenerar los tipos:
> `cd apps/cliente && npx expo start --port <libre>` (~4 s, escribe el `.d.ts`).
> 🔴 **SU SÍNTOMA DICE LO CONTRARIO DE LO QUE PASA:** se lee «rutas rotas» y la causa es «tipos viejos».
> **Ya mordió en S100b.**

**Cobrado acá, tal cual:** el typecheck del cliente dio **8 errores de ruta** después del merge de D.
Con los tipos regenerados: **exit 0**. *Un aviso que viaja por chat es un puntero, no una medición* —
por eso vive en este archivo.
⚠️ Y un detalle propio: **`expo start` no reescribe el `.d.ts` si ya existe** (el mío era del 17-ago).
**Hay que borrarlo primero.** Además rebota si el puerto está tomado por otro proceso del harness.

---

## ③ LOS INSTRUMENTOS, SOBRE EL ENSAMBLADO — jamás sobre las ramas

| instrumento | resultado |
|---|---|
| `tsc --noEmit` × 4 | ✅ **`packages/api` · `packages/ui` · `apps/cliente` · `apps/prestador`, los cuatro exit 0** |
| `verify:diseno` | ✅ **VERDE · 46 reglas** encendidas (auto-prueba) |
| `verify-s100c-disponibilidad` | ✅ **18/18** |
| Metro | **`--clear-cache` en los dos publish** (esta vuelta tocó `packages/ui` fuerte) |
| migraciones | **1 nueva aplicada** (`20260820060000`), aditiva pura, L-140 verde |

---

## ④ 🔴 LA LISTA DE QUÉ CAMBIA VISUALMENTE — el founder mira contra esto

**Ninguna está verificada en pantalla. Todas son COSAS A MIRAR.**

### De `packages/ui` (B) — diez piezas que nadie vio
1. **El pie sube ~52 dp** en ficha, carrito y checkout: `PantallaConPie` contaba el `insets.bottom` **dos
   veces** dentro de `(tabs)`. **Era el «~1 cm muerto» del founder.**
2. **La tarjeta de la vitrina ya no salta al agregar** — antes crecía **44,1 dp** y dejaba de coincidir
   con su vecina. ⚠️ **Ahora es ~44 dp más alta SIEMPRE**: es el costo declarado de N24. C midió que la
   primera tarjeta **igual entra entera, con 42 dp de sobra**. *Si esto no está en la lista, se lee como
   que algo creció solo.*
3. **El `+` de la vitrina muta a stepper sin romper la fila.**
4. 🔴 **TRES GLIFOS NUEVOS, LOS TRES SIN VERIFICAR, los tres a mirar A 21 px** (§2.9 — ese gate es del
   founder): **`carrito`** ahora tiene **ruedas** (era una canasta que se leía como bolsa) ·
   **`papelera`** (el `−` del stepper en 1, solo en el carrito) · **`pedido`**, una **caja con tapa** para
   la tab nueva, cuyo discriminador es **la costura horizontal** que ni la bolsa ni el carro tienen.
   **No hay rasterizador SVG en el entorno** (ni `cairosvg`, ni `rsvg-convert`, ni Inkscape) ⇒ **nadie
   pudo mirarlos chicos.** *Se declara en vez de darse por bueno: es el juicio que el ojo del founder sí
   puede emitir y el nuestro no.*
5. **Con el teclado arriba la Hoja ya no empuja el contenido fuera de pantalla.** ⚠️ **Mirar que el
   `Guardar` de la Hoja de dirección no quede comido abajo.**
6. **La ventana de entrega va en TIRA HORIZONTAL** (antes cuatro opciones apiladas).
7. **`TarjetaPedido` acepta miniatura.**
8. **La moto y el destino en el mapa de «en camino»** (`MarcaDeMapa`).
9. **El destino se dibuja aunque no haya track** — la dirección se confirma antes de que salga.
10. **La escalera del pedido y el detalle**, con las cartas de N21.

### De la vitrina y la ficha (C)
11. **La búsqueda encuentra pegado:** `proplan` **0 → 20**, `royalcanin` **0 → 50**,
    `tasteofthewild` **0 → 27**. (`hills` sigue en 0 y es correcto: `Hill's` no está en el catálogo.)
12. **Las dos tiras de chips → un control «Filtrar» con hoja** de cinco ejes.
13. **48 de los 74 dp muertos del buscador**, recuperados.
14. **La composición se pliega**; **la advertencia de alérgeno NO se plieg**a.
15. **El cromo de la vitrina: 317 → 213 dp** (50,2 % → 33,8 % del alto útil).
15bis. 🔴 **LA BÚSQUEDA ORDENA POR LA ESPECIE DE LA MASCOTA ELEGIDA** (H-301, firmado). Con un gato
    elegido y «alimento»: **19 resultados cambian de posición y 31 no estaban antes** — ninguna de 50
    tarjetas quedó en su lugar. Los tres primeros pasan de *«pensado para perros»* a *«para gatos»*.
    **No filtra** (§5.2: se ofrece, no se exige). El orden se hace **en el servidor, en dos baldes**: la
    búsqueda trae 50 de hasta 285, así que reordenar en memoria **habría ordenado el recorte y no el
    catálogo**, y esos 31 habrían seguido invisibles con una pantalla que *parecía* correcta.
    **Reversible en una línea** (quitar el tercer argumento devuelve el orden alfabético único).
    ⚠️ **La señal «para perros» en la tarjeta está APROBADA y DIFERIDA, no olvidada:** la vitrina tiene
    **42 dp de presupuesto vivo y son todos**.

### Del carrito al «listo» (A)
16. **La ficha ya no deja agregar un producto agotado** — y antes **lo decía y lo dejaba pasar igual**.
17. **El carrito avisa qué cambió mientras estaba guardado**: «se agotó» y «ya no está a la venta» con
    voces distintas, más **«el precio cambió»**. El CTA no avanza con algo no disponible adentro.
18. **Al subir cantidad: «de este producto podemos entregarte 2 ahora»** en vez del rebote al pagar.
19. **El resumen dice CÓMO y CUÁNDO llega** (modalidad + dirección + fecha), a la vista al pagar.
20. **El pin junto a la dirección.**
21. **La libreta de direcciones con alias** — «Oficina», «Casa de mamá», además del hogar.
22. **El buscador de direcciones apagado LO DICE** en vez de callar (ver §6).
23. **El marco lila del carrito murió** (`LienzoProducto` pintaba el lavanda detrás de la foto).

### De pedidos (D)
24. **La barra pasa a CINCO tabs:** `Hogar · Explorar · Despensa · Pedidos · Cuenta`. **La Despensa
    conserva el trono en el centro** (posición 3 exacta), y **Pedidos aparece con el primer pedido.**
25. **Pedidos nace como CASA** — en curso arriba, historial abajo.
26. **El pedido en vuelo llega al Hogar** (12 en vuelo hoy en la cuenta del gate).
27. **El título de la fila pasa a ser QUÉ TRAE** (antes nueve tarjetas decían «pedido 17 de agosto»).

---

## ⑤ LOS SUJETOS VIVOS, RE-MEDIDOS DESPUÉS DE PUBLICAR

| sujeto | medido | veredicto |
|---|---|---|
| **envío `474e6ff6`** | `hacia_destino` · **6 puntos de track** · destino ✓ · código **`1402`** · repartidor asignado | ✅ **intacto** |
| **pedido `21fb1284`** | `entregado` · **2 ítems** | ✅ **intacto** |
| **el par que discrimina** | **ADULTO SMALL BREED (alimento → Thor) = 1 depósito** · **CANADA LITTER (higiene → Jack) = 0** | ✅ **sigue discriminando** |

⚠️ **La placa `PBA-0142` NO se pudo re-medir en la tabla:** `repartidores` **no tiene columna de placa**
(medido: `id, cuenta_comercial_id, nombre, documento, telefono, user_id, activo, country_code,
created_at, updated_at, tipo_documento, documento_foto_path, foto_path, whatsapp, correo,
vinculo_aceptado_en`). El wrapper la expone (`vehiculo_placa`) leyéndola de la RPC
`obtener_ficha_repartidor`, así que **el dato existe pero sale de otra fuente**. *Se declara en vez de
darla por buena: no la verifiqué.*

---

## ⑥ INCONSISTENCIAS ABIERTAS, DECLARADAS

**① 🔴 EL ROJO DE LA VITRINA NO SE REPRODUCE, Y LOS NÚMEROS DICEN POR QUÉ.**
El founder reportó que agregó **una** unidad desde la vitrina y el pago dijo que no había stock. Medido
contra la base:

| | |
|---|---|
| ofertas publicadas | **563** |
| dicen `hay_stock = true` | **483** |
| **`hay_stock = true` con stock real 0** | **0** |
| **`hay_stock = false` con stock real > 0** | **0** |
| sin fila de stock | **0** |
| **stock mínimo entre las que dicen «hay»** | **2** |

⇒ **el booleano está perfectamente sincronizado con el número, y ninguna oferta publicada tiene 1 ni 0
unidades diciendo que hay.** Y `TarjetaProducto` **sí gatea**: sin `hayStock` no dibuja el `+` ni el
stepper y baja la opacidad. **La vitrina no ofrece agotados.**
**Candidato que sí explica el síntoma, y ya está curado:** un ítem **anterior** del mismo carrito,
agregado desde **la ficha** —que **no tenía gate hasta esta vuelta**— con cantidad mayor al stock. El
rebote del pago dice *«uno de los productos»* **sin nombrarlo**, así que se lee como si fuera el último
que se agregó. **No lo puedo probar y no lo doy por probado.**
**Lo que NO hice: abrir una H-nnn contra C.** *Acusar a la vitrina con la medición diciendo lo contrario
sería fabricar un dueño.*

**② H-301 (de C) — la búsqueda ignora la especie de la mascota.** Con un gato elegido, los primeros
resultados de «alimento» declaran *«Está pensado para perros»*. **No se curó porque filtrar
contradiría letra firmada** (`LETRA_RECORRIDO_DESPENSA_S96` §5.2: *se ofrece, no se exige*). La salida
legítima es **orden o señal**, y eso es decisión de producto. **Va al gate.**

**③ El margen de la vitrina quedó en 42 dp** (medición de C). **Cualquier pieza que sume alto al cromo o
a la tarjeta vuelve a cortar la primera tarjeta.**

**④ Las 6 facturas tienen `archivo_url` y `pdf_url` en CERO** (medido por D sobre mi lector). ⇒ **no hay
documento que abrir**, así que la casa «Facturas» no se montó: el número va dentro de la carta del total.
*Un botón que no abre nada es una puerta que rebota.*

**⑤ El glifo de Pedidos es el de la Despensa** — dos tabs vecinas con el mismo dibujo. Pedido a B.

---

## ⑦ LO QUE UN INSTRUMENTO DE ACÁ **NO** PUEDE DECIR

- **Cuatro typechecks y un lint verdes no dicen que nada tape a nada.** `verify:diseno` mide **forma**;
  R53 dice *«el pie lo pone la pieza»*, jamás *«nada tapa a nada»*.
- **Ninguna de las 27 cosas de la lista se vio en un teléfono por la mano publicadora.**
- **Oscuro y memorial: no medidos** por nadie, en ninguna pista.
- **El glifo del carrito a 21 px: sin verificar** (sin rasterizador).
- **`PantallaConPie` subió el pie ~52 dp:** mi censo dio **cero compensaciones vivas** en mis pantallas,
  pero **eso lo dice el typecheck y el pie es asunto de píxeles.**
