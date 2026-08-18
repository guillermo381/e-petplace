# S100c · RESUMEN DE PUBLICACIÓN

> Mano publicadora: **pista A**. Escrito con el repo y la base a la vista el **18-ago-2026**.
> **Todo SHA y toda ancla de acá se midió del objeto.** *Lo derivado decae mientras el objeto no.*
> **Se publica para GATEAR, no para cerrar.**

---

## ⓪ 🔴 EL PRIMER BUNDLE YA SALIÓ — y esto es el estado, no un plan

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

**⚠️ ESTE BUNDLE VA A SER SUPERSEDIDO.** El founder decidió **una pasada completa** en vez de un gate a
medias: entran la quinta tab de D y el cierre de cola de B. **El bundle del gate se publica ENCIMA de
`efa59a6d`.** Este queda como base verificada, no como el objeto del gate.

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
4. **El glifo del carrito ahora es un CARRITO CON RUEDAS**, no una canasta. 🔴 **Necesita el ojo del
   founder a 21 px** (§2.9): B no pudo verificarlo — no hay rasterizador SVG en el entorno.
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
