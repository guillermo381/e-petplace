# S96-C · CENSO FOTOGRÁFICO — el panel del vendedor y el repartidor (13-ago-2026)

> **Qué es:** censo de lo que S96 dejó construido y sin ver, medido contra
> letra — `LETRA_PANEL_VENDEDOR_S96` · `LETRA_RECORRIDO_DESPENSA_S96` §9 ·
> `DISEÑO_EXPERIENCIA` §15b/§15b.0. **CERO construcción, CERO cura.**
> Ninguna forma se firma acá: el ojo es del founder (L-153/regla 80).
>
> **Capturas:** `scripts/capturas/s96-c-censo/`. Bundle del aparato:
> el brief declara OTA `019ff8db`; **la verificación L-160 (el id EN
> PANTALLA, pie de Cuenta) NO se pudo correr** — ver §5.
>
> ⚠️ **EL CENSO QUEDÓ PARCIAL Y LA CAUSA SE DECLARA ENTERA (§0).**

---

## 0. LO QUE PASÓ CON EL TELÉFONO — léase antes que los hallazgos

**El teléfono NO estaba libre durante la ventana.** La secuencia, medida:

1. **11:18** — al conectar por adb, la app del prestador ya estaba abierta
   en un Pedido vivo (`P-20260813-ad2aef`, "Karina (gate S96)") con el
   escalón listo para despachar.
2. **11:18 → 11:20** — el pedido **avanzó de escalón solo** (de «para
   despachar» a «En manos del repartidor»), la app saltó al HOY, después a
   la **app del cliente** (Despensa), sin que esta pista lo navegara.
   Lectura: **una persona estaba caminando el gate S96 en la mano**
   (consistente con el nombre del pedido) y/o la siembra de A avanzaba
   estados del lado del servidor.
3. **11:23** — captura de verificación de foco mostró **WhatsApp Business
   con un mensaje personal a medio tipear**. El founder estaba usando el
   teléfono EN ESE MOMENTO. La captura se borró sin conservar nada y
   **esta pista cesó toda inyección de eventos**.
4. **11:24 → 11:33** — espera pasiva (solo lectura de foco, cero input):
   el teléfono quedó en lockscreen, quieto.
5. **11:34** — al reintentar, el keyguard pidió **PIN (Bouncer)**. Sin
   PIN no se adivina: **el censo en dispositivo queda bloqueado acá.**
   Se cerró el bouncer y se apagó la pantalla. **Teléfono soltado.**

**Efecto colateral propio, declarado:** a las 11:23 esta pista ejecutó un
`am start` del prestador **mientras el founder tipeaba** — le trajo la app
al frente encima de su chat. Un solo evento, sin escritura, pero es
exactamente la clase de interferencia que el turno existe para evitar.

**Nota de método para el turno del teléfono:** «Turno 1» envejece igual
que cualquier dato vivo (L-166). Antes de inyectar el primer evento:
`dumpsys window | grep mCurrentFocus` — si el foco no es de una app
nuestra, el turno no está vigente, diga lo que diga el brief.

**Además, dos gestos propios se comieron la ventana útil:** dos swipes de
scroll fueron interpretados por el sistema (o se cruzaron con dedos
reales) y sacaron la app de foco; una captura aterrizó en el launcher con
una foto personal de fondo y **se borró sin conservar**. Todas las
capturas privadas (launcher, WhatsApp) fueron eliminadas en el acto; en
`scripts/capturas/s96-c-censo/` viven **solo pantallas de las apps**.

---

## 1. LO CAPTURADO — una entrada por pantalla

### 1.1 El pedido — `/ventas/pedido/[pedidoId]` · `00-estado-inicial.png` (11:18) + `01-pedido-arriba.png` (11:20)

**El mismo pedido en dos escalones distintos** (la siembra/gate lo avanzó
entre capturas): `00` = listo para despachar («Quién lo lleva» con
*Repartidor de Pruebas* preseleccionado —decisión ① del arranque: un solo
repartidor activo se preselecciona— y CTA «Despachar») · `01` = en manos
del repartidor («En manos del repartidor.», sin CTA — el cuarto escalón
es de quien está en la puerta, enmienda §5 cumplida).

**Lo que cumple, medido contra letra:**
- Preside la persona y su dirección (§2.2): «Karina (gate S96)» ·
  `P-20260813-ad2aef` · «Av. de los Shyris N34-40, Quito». ✓
- Las dos acciones del mundo real: **Llamar** y **Abrir el mapa**. ✓
- La escalera de 4 a la vista; **la factura no es escalón en envío** —
  es el requisito de «Despachado» (`escalera-pedido.ts:20-22`), y en
  retiro sí se ve como paso. Coincide con §3.
- Lote visible por ítem («Puppy Pollo y Arroz · Lote A1»). ✓
- Desglose: Subtotal $29,00 · Impuesto $0,00 (los seis del catálogo son
  `EC_IVA_0` — correcto) · Envío $0,00 (§7.2(4): hoy vale cero) · Total.
- CERO mascota en toda la superficie (§4). ✓ — y el lector no la trae
  (inexpresable en la capa de datos).

**Hallazgos por letra (H1-H3, §3 de este doc).**

### 1.2 La lista de Hoy — `/ventas` · `03-ventas-hoy-esqueleto.png` (11:21)

Capturada **solo en esqueleto** (cargando): título «Pedidos», dos bloques
de esqueleto. El teléfono se perdió antes de la recarga. **Lo que la
pantalla hace se midió por código** (`ventas/index.tsx`): orden por
trabajo (`prioridad()`: entrega_fallida 0 → por preparar 1 → … →
terminados al fondo atenuados con `opacity.disabled`) · cifra del techo
«{consumido} de {capacidad} entregas hoy» con **capacidad 0 dicha**
(«Sin reparto confirmado para hoy» — §7.3/L-139 ✓) · fila con quién,
ventana, ítems, monto y escalera compacta (§2.1 ✓) · para el vendedor
puro es la CASA sin chevron muerto (`canGoBack()`).

### 1.3 El HOY del no-gestor con la tarjeta §0bis · `06a-hoy-nogestor-tarjeta.png` (11:18)

**La captura clave del turno.** Cuenta `nuevo_test2` (Satori Latam sas):
- **Tres tabs — Hoy · Datos · Cuenta, sin NEGOCIO** ✓: el caso «de tres»
  que §15b.0 anotó como sin nombrar ya es real y compuesto.
- **`TarjetaVentas` («Venta de productos · Pedidos, stock y reparto»)
  presente, entre la Zona 1 (La pizarra) y «Tu día»** ✓ §0bis — el VIVO
  conserva primacía (no había vivo en la captura).
- Glifo de la tarjeta: bolsa con huella (consumo). Techo: 0m EN RUTA ·
  $0.00 DEL DÍA · 0 MASCOTAS · «Sin citas registradas».

**Hallazgos H6-H7 abajo.**

### 1.4 Contexto fuera de territorio · `ctx-cliente-despensa.png` (11:19)

La app del **cliente** quedó capturada al saltar el foco: Despensa con el
catálogo (6 productos, precios en mono) y **las dos celdas del cierre:
«Tus pedidos» y «¿Compraste en el local? Ingresá el código de tu factura
y la compra entra a su expediente»** — el reclamo de mostrador (§4 del
recorrido) ya tiene puerta en el cliente. Se conserva como contexto para
D; no es territorio de C.

---

## 2. LO MEDIDO POR CÓDIGO (las pantallas que el teléfono no dejó ver)

Solo lectura, para que el founder sepa qué va a encontrar al caminar:

| Pantalla | Estado medido |
|---|---|
| **Stock** (`stock.tsx`) | Motivo de primera clase: **sin motivo el botón no se enciende** (`listoParaGuardar`, :109) y la ayuda dice el porqué («Sin motivo no se guarda. El inventario es plata.»). Ajuste por delta con «Entraron/Salieron» + RPC `ajustar_stock_vendedor` — **jamás escritura directa** (§2.3 ✓) |
| **Mis entregas de hoy** (`entregas.tsx`) | Fila = dirección + referencia/intento + ventana en mono. **Sin monto, sin ítems, sin mascota** (§9.2 hecho tipo — `FilaEntrega` no tiene esas props). Qué ve lo decide la RLS; un no-repartidor ve vacío honesto, no error |
| **La entrega** (`entrega/[envioId].tsx`) | **Tres acciones y nada más** (§9.1): «Voy hacia acá» (manual) · «Entregado» (exige **código + foto**, el motor rebota sin los dos) · «No había nadie» (§9.3: llamar → **espera de 60 s con el reloj a la vista** — el botón de fallida no se enciende hasta que corrió → la instrucción decide). Foto al bucket privado con la voz de §9.4 en pantalla («La ven el vendedor y e-PetPlace. Se borra a los 90 días.») · GPS §9.5 montado solo en `hacia_destino` con flush final antes del cierre; notificación «Entrega en curso» |
| **Venta de mostrador** (`mostrador.tsx`) | Registra contra nadie, descuenta stock, **da el código para la factura** con vencimiento dicho (§4 recorrido ✓) |
| **Configuración** (`configuracion.tsx`) | Repartidores (nombre/documento/teléfono) · **capacidad por recurso** con el porqué en la voz («La capacidad es del recurso: si la moto lleva 20, el día son 20») · cortes horarios como parámetro (§7.1/§7.3 ✓) · facturación |
| **Tu facturación** (`facturacion.tsx`) | Lista de lo vendido y entregado; **sin sumas del período** a propósito (la comisión es parámetro del motor de pagos — L-139) |
| **La puerta** (`PuertaDeOficio`) | Barrido de color `capa="consumo"`, **solo color — los permisos son del servidor** (contrato escrito en la pieza). Cableada en HOY (no-gestor), en Negocio (gestor, y en el muro de titularidad del empleado-vendedor) |

---

## 3. HALLAZGOS POR LETRA — el founder arbitra, esta pista solo mide

**H1 · La ventana prometida y el tipo de entrega NO están en el detalle
del pedido.** `LETRA_PANEL` §2.2: *«Debajo: los ítems, la ventana
prometida, el tipo de entrega, y la escalera»*. Lo renderizado
(`pedido/[pedidoId].tsx`): persona/dirección → acciones → escalera →
formulario del escalón → productos → desglose. La ventana vive **solo en
la fila de la lista**; en el detalle no aparece (el retiro sí se
distingue). Verificado en la foto `01`: de header a Total, sin ventana.

**H2 · El peso real del empaque es opcional.** §3 tabla: *«Empacado pide
Lote **y peso real**»*. En pantalla: «Peso real (kg) — opcional» y el CTA
se habilita solo con lotes (`lotesCompletos`, :233). Decisión tomada en
construcción — no está en ninguna letra; que la mesa la firme o la corrija.

**H3 · El punto de la escalera se llena en el escalón ACTUAL — la lectura
rápida afirma un paso que no ocurrió.** En la foto `01`, el pedido está
«En manos del repartidor» y **«Entregado» ya tiene el punto lleno** (en
negrita, como paso actual). §2.2 pide que *«se vea dónde está y cuánto
falta»*; L-139 prohíbe el dato plausible que no es verdad. La pieza lo
declara **decisión Chanel deliberada** (`EscaleraEstados.tsx:44-53`:
hecho y actual se llenan igual; la distinción es tipográfica — el anillo
está reservado a «en vivo» por Ley 7). **Las dos verdades quedan
servidas con la foto; el ojo es del founder.**

**H4 · «Tres, y ninguna más» quedó desactualizada sin marca.**
`LETRA_PANEL` §2: *«Tres pantallas y ninguna más: Hoy · El pedido ·
Stock»*. El módulo tiene **siete rutas**; las cuatro extra tienen letra
del recorrido que las manda (mostrador §4 · entregas §9 · configuración
§2 · facturación §2.2) — pero la enmienda de §12 del recorrido **no marcó
este punto en la letra del panel**, y la regla de la casa es que la marca
vive en cada lugar afectado. Es trabajo de letra, no de código.

**H5 · La puerta no reordena la barra inferior.** Recorrido §3: *«la
barra inferior se reordena y el color del oficio barre la pantalla»*. Lo
construido: el barrido existe (`PuertaDeOficio`), la posición consolidada
del lado productos son los pedidos ✓ — pero `/ventas` es una **pila sin
barra de tabs**: se vuelve por chevron. Para el vendedor puro la lista es
la casa sin barra alguna. Si la barra-que-se-reordena es exigible en v1 o
era imagen de destino, lo dice el founder.

**H6 · El saludo del HOY dice el username crudo** («Hola, nuevo_test2») —
comportamiento conocido del sembrador (S81); en el gate se ve. Cosmético,
se anota porque está en la foto.

**H7 · El techo del no-gestor muestra «$0.00 DEL DÍA».** La palabra es
del servidor (`obtener_plata_del_dia`, gate ensanchado a
mostrador/gestión en `20260805260000` — recepción y admin reciben
`visible=true` desde el 5-ago). Se anota para que el founder confirme que
**esa audiencia ensanchada es la firmada** — la letra de P1 (3-ago) decía
«solo titular y admin»; el ensanche es posterior y de A. No es defecto de
esta pantalla: es confirmación de audiencia.

---

## 4. LISTA APARTE — FUNCIÓN (pantalla que no hace lo que su letra dice)

**Ninguna verificada en dispositivo** — el teléfono se perdió antes de
poder ejercitar una sola acción. Lo único anómalo observado (saltos de
navegación, estado avanzando) se atribuye al uso humano concurrente y a
la siembra de A, no a defectos: **no se reporta función rota sin haberla
producido** (regla del rojo producido). La caminata del founder es la que
va a ejercitar las transiciones.

---

## 5. INALCANZABLES — para que A sepa qué sembrar/destrabar primero

| # | Qué faltó | Por qué | Qué necesita |
|---|---|---|---|
| 1 | **Lista de Hoy cargada** (con pedidos, cifra de cupo, terminados atenuados) | El teléfono pidió PIN antes de la recarga | Solo el teléfono libre — la cuenta `nuevo_test2` ya tiene pedidos vivos |
| 2 | **Stock · Mostrador · Configuración · Facturación** en pantalla | Ídem | Ídem — y catálogo ya hay (6 SKUs) |
| 3 | **«Mis entregas de hoy» + la entrega con sus tres acciones** | Doble candado: teléfono + **la entrada solo aparece si `misEntregasAsignadas()` devuelve filas para la sesión viva** (`ventas/index.tsx:369`) | 🔴 **Lo primero a sembrar: una cuenta cuyo usuario esté atado al repartidor con un envío asignado HOY.** «Repartidor de Pruebas» existe como registro del vendedor; si no está atado a un `auth.users`, ninguna sesión ve la pantalla del repartidor |
| 4 | **La puerta en movimiento** (el barrido) | Teléfono | Teléfono + una mano que grabe (o `screenrecord`) |
| 5 | **El pie de Cuenta con el updateId** (L-160: confirmar `019ff8db` EN PANTALLA) | Teléfono | Primer paso de la próxima ventana — antes de evaluar nada |
| 6 | **El HOY del GESTOR** (la tarjeta en Negocio, no en Hoy) y el **vendedor puro** (Redirect a `/ventas` como casa) | Sesión viva = `nuevo_test2` (empleado-vendedor); cambiar de cuenta gasta ventana y la siembra estaba corriendo | Credenciales/orden de quién entra en la próxima ventana |
| 7 | Estados feos: sin-cuenta-vendedora · cupo cero · entrega fallida · cancelado · vacíos · dark/memorial | Teléfono | Ventana propia; algunos exigen datos sembrados (fallida, cancelado) |

**El teléfono queda soltado** (pantalla apagada, bouncer cerrado). Puede
pasar a D — con la advertencia de §0: verificar el foco antes del primer
evento, y si el founder lo tiene en la mano, el turno no existe.
