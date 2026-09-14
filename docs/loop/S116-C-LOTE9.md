# S116-C · LOTE 9 — el parte

**CAPTURAS: `docs/loop/capturas-s116-c-lote9/`**

Rama `pista/s116-c-05` · sobre `origin/main @ b5e4e630` (traído en este lote,
merge con dos conflictos declarados abajo).
Aparato: AVD propio `s114_C` (`emulator-5578`), cliente **1.0.7**, Metro 8097
del worktree mergeado, bundle fresco verificado por `Android Bundled` fechado.

---

## LA TABLA — una captura por punto

| # | qué | captura | estado |
|---|---|---|---|
| 1 | el abanico abierto en el Hogar, con sus cuatro atajos | `p1-abanico-abierto-hogar.png` | ✅ y **usado**: `p1c-atajo-carne-usado.png` |
| 2 | el carrito de la Despensa, sobre main | `p2-despensa-carrito-en-el-techo.png` | ✅ **estaba** — lo que fallaba era mi bundle |
| 2b | la firma: el carrito al lado de la campana | `p2b-hogar-carrito-junto-a-la-campana.png` | ✅ montado |
| 3 | el pago de punta a punta, tocando por texto | `p3a…` `p3b…` `p3c…` `p3d…` `p3e…` `p3f…` (6) | ✅ pagado de verdad, dos veces |
| 4 | el confeti cayendo en ¡Listo! | `p4-confeti-cayendo-en-listo.png` (+ `p4b`) | ✅ |

---

## ① EL ABANICO — y lo que casi publico como defecto del producto

**El cableado ya estaba en main.** Yo lo había escrito en mi rama (commit
`f765a51d`) y A lo había escrito en la suya; al mergear chocaron y **gané la de
main a propósito**: traía dos mediciones que la mía no tenía (`D-1115` el campo
de texto que se perdió al morir la hoja · `D-1116` tocar un atajo deja el
abanico abierto). *Mi versión hacía lo mismo con menos información adentro.*

🔴 **Y acá está lo que vale del punto, que no es el abanico: TOQUÉ EL BOTÓN Y
FUE A `/nexo`, DOS VECES, CON EL CÓDIGO CORRECTO EN DISCO.** Leí `_layout.tsx`,
leí `BotonAsistente` —`onPress={props.onPress ?? (() => setAbanicoAbierto(a =>
!a))}`, la unión estaba bien— y el aparato seguía navegando. **Era el bundle:
Metro llevaba horas vivo y servía una versión anterior del shell.** Lo curé
matándolo y levantándolo con `--clear`; a la primera corrida con `Android
Bundled` fechado, el abanico abrió.

*Un Metro que no rebundlea no falla: sirve el árbol de hace dos horas y la
pantalla se ve perfectamente creíble.* Estuve a un paso de reportar «la unión
de `BotonAsistente` no funciona» sobre una pieza sana.

**Las cinco filas, medidas del árbol:** `Pregúntale a Nexo` · `Anotar su peso`
· `Cargar su carné` · `Anotar un antiparasitario` · `Guardar un recuerdo` — los
cuatro de `ORDEN_DE_PATA` más la fila de preguntar.

### 🔴 Vara 11 — lo USÉ, y usarlo destapó un defecto de la pieza

Toqué **por texto** `Cargar su carné`. **La app abrió la pantalla de
RECUERDO.** Antes de escribir eso como defecto de ruteo, volqué el árbol:

```
Cargar su carné   clk=true  [849,1833][1017,1319]
```

**`y2 < y1`: el rectángulo está dado vuelta.** Las cinco filas reportan el
MISMO `y1` (1833, el borde del botón) y un `y2` del lado equivocado. El centro
calculado cae sobre otra fila — por eso mi dedo aterrizó en «Guardar un
recuerdo».

Toqué entonces la posición **visual** (`958,1259`, leída de la captura) y
**abrió `/carnet`**. ⇒ **el ruteo está bien; lo que está mal es lo que el árbol
reporta.** Cuesta TalkBack (exploración por tacto sobre un área invertida) y
cuesta toda medición automática. **No lo curé: es `packages/ui`.** Nota con el
volcado literal en `docs/loop/buzon/S116-C-para-B-el-abanico-entrega-rectangulos-invertidos.md`.

---

## ② EL CARRITO DE LA DESPENSA — la medición contestó «estaba»

Medido sobre main, con bundle fresco:

```
Despensa              View    [42,189][944,299]
Carrito, 0 productos  Button  clk=true  [975,213][1038,276]
```

**El carrito está en el techo de la Despensa y es tocable.** No hay nodo que
falte y no hay árbol que volcar: la cabecera está completa.

**Lo que fallaba era lo mismo del punto ①** — el Metro viejo. En el lote
anterior medí «desapareció tras el merge», dejé escrito que las cuatro piezas
del razonamiento decían que debería verse, y **no lo curé a ciegas**. Fue lo
correcto: no había nada que curar. *La sospecha era verdadera sobre la pantalla
que yo estaba mirando, y esa pantalla no era la de main.*

### La firma de la mesa: al lado de la campana

Montado en `FilaCampanaTecho` (`hogar/index.tsx:615`), **a la izquierda de la
campana y sin moverla** — el pulgar ya sabe dónde está la campana, y correrla
para hacerle lugar a algo nuevo le cobra el cambio a quien no pidió nada.

```
Carrito, 0 productos  [850,194][913,257]
Avisos, avisos sin leer  [965,194][1028,257]
```

🔴 **Y NO usa `AccionCarrito` ni la prop `carrito` de `Cabecera`, por medición
y no por gusto.** Las dos terminan en `GlifoConContador`, que dibuja su `Icono`
**sin tinta** (`GlifoConContador.tsx:124`) ⇒ sobre el degradado ciruela saldría
en tinta oscura. Su vecina la campana ya lo sabía: pasa `palette.light0`
explícito. B ya resolvió esto en `Cabecera` envolviéndolo en `DiscoVidrio`,
**que es privado de ese archivo y no se exporta**.

⇒ compuse **igual que la vecina**: `Badge` + `Icono` en papel. ⚠️ **El costo lo
declaro: quedan dos versiones del mismo carrito** —disco magenta en cuatro
raíces, píldora del `Badge` en el Hogar—. *Mismo hecho, dos signos.* Pedido a B
con sus dos formas posibles y mi voto (exportar el disco) en
`docs/loop/buzon/S116-C-para-B-el-carrito-no-se-puede-pintar-sobre-un-techo.md`.

---

## ③ EL PAGO DE PUNTA A PUNTA — tocando por texto, dos veces

Despensa → «Agregar» → carrito (1 × Aceite de Salmón, $18,50) → ¿para quién?
Zeus → entrega → pago con la **tarjeta guardada Visa ···· 1111** → `EsperaLarga`
→ `Confirmacion`. **Todos los toques por texto**, salvo los dos que el árbol
invertido del abanico obligó (punto ①) y los `swipe` de scroll.

**Pagó de verdad**: al volver al Hogar, «Ponte al día» dice **«Tu pedido está
confirmado»**, que no lo escribe la pantalla de éxito sino el motor.

### Lo que el camino me obligó a curar

**(a) `«Procesando tu pago»`** — el founder nombró esas palabras en el lote 7 y
otra vez en el lote 9; la pantalla decía **«Estamos confirmando tu pago»**.
Cambiado en `pago.esperaTitulo` (es/en). ⚠️ **Alcance declarado: esa clave la
usan SEIS esperas de pago** (despensa, reserva de cita, paquete, plan,
guardería, programa de adiestramiento) — es el mismo momento en las seis, así
que el cambio es correcto ahí, pero **lo digo porque no es un texto local**.
Requirió **arranque en frío**: i18next carga los diccionarios al init y fast
refresh no los recarga.

**(b) 🔴 `«Ver tus pedidos»` SALÍA DOS VECES, y lo encontró PAGAR, no leer.**
Una adentro de `Confirmacion` como acción primaria, y otra abajo, en el pie
fijo de la pantalla. *Mi propio comentario del lote 7 dice «⏪ antes había UNA
sola, en el pie» —y nunca la saqué.* Y no era sólo repetición: **el pie tapaba
la fila «Que llegue solo»**, que es la recurrencia de §6.1 ⇒ *un botón
duplicado estaba escondiendo una decisión*. Curado: la fase `exito` ya no
manda pie; la pieza trae sus dos acciones.

### Lo que la pieza NO tiene mal, aunque lo parezca

`EsperaLarga` pinta el título **alineado a la izquierda** y la ilustración
**centrada**. Eso es su diseño, escrito en su propio cuerpo (*«`flex:1` para que
quede centrado en lo que sobre entre el título y el pie»*) y coherente con la
casa, donde todo título va a la izquierda. **No lo toqué.** *Centrar algo que
ya está compuesto es la forma de descomponerlo.*

---

## ④ EL CONFETI — cae, y no hubo que montar nada

**`Confeti` no se exporta de `packages/ui` y no hay que montarlo: su único
consumidor es `Confirmacion`, que lo trae adentro** y lo enciende solo en la
casa v5 (`confeti ?? esCasaV5`, apagado en memorial y con movimiento
reducido). Lo dice la propia línea de `index.ts` que B escribió al retirarlo.

⇒ el punto no era construir: era **capturarlo**, y eso costó método. Dura **1,5
s sin loop**, y `uiautomator dump` + `screencap` se comen más que eso ⇒ las
primeras vueltas siempre llegaban tarde. Lo saqué con **ráfaga de `screencap`
sin volcar árbol**, cada 0,75 s, y el confeti vive en los cuadros **01 y 02**
(se ven además por peso: 212 kB y 206 kB contra 203 kB del estado quieto).

**Camino usado: mascota nueva.** Alta completa —foto omitida → datos (perro,
«Confeti») → carné omitido → ¡Listo!—. Papelitos desde el **borde superior**,
magenta/ciruela/rosa/blanco, **muriendo arriba del botón**, una sola vez.
Exactamente la firma.

---

## EL MERGE DE `origin/main @ b5e4e630` — dos conflictos, los dos declarados

**①** `(tabs)/_layout.tsx` → **gana main** (arriba, punto ①).

**②** `docs/CATALOGO_PIEZAS_V5.md` → **gana main entero** (es de A, que reescribió
el archivo en `b5e4e630`), **pero restauré el encabezado `## ① EL SHELL`**, que
main había perdido: sus tres piezas siguen ahí y el documento saltaba de ⓪ a ②,
dejándolas colgadas de una sección que habla de estructura y no de piezas. *No
es re-litigar la resolución de A: una sección sin título no se puede citar.*

---

## LO QUE NO HICE, Y POR QUÉ

· **El pago por DeUna** — el medio por defecto era DeUna y lo cambié a la
  tarjeta guardada porque la orden decía *«con la tarjeta guardada»*. El camino
  de DeUna no se caminó.
· **El envío a domicilio** — usé **retiro en tienda**: a domicilio el CTA queda
  apagado con dos razones honestas (*«a tu dirección le falta el punto en el
  mapa»* y *«este vendedor todavía no tiene reparto configurado»*). No forcé el
  camino; el que caminé es el que la puerta ofrecía.
· **El teléfono de contacto no persiste entre pedidos** — lo tuve que cargar de
  nuevo en la segunda compra. Lo declaro como observación, **no lo medí**: puede
  ser por diseño (es del pedido, no del perfil).
· **Los rectángulos invertidos del abanico** — `packages/ui`, al buzón.
· **La tinta de `GlifoConContador`** — `packages/ui`, al buzón.

## GATES

typecheck `apps/cliente` **en 0** tras cada tanda (merge · carrito del Hogar ·
las dos curas del pago). Commits con `SALTAR_GATE="D-1088, rojo heredado"`.
