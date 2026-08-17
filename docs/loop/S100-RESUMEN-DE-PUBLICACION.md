# S100 · RESUMEN DE PUBLICACIÓN — para la mesa

> **Lo arma A (mano publicadora, regla 88). El push del bundle sale SOLO con el
> GO literal del founder.** Este documento es lo que la mesa lee para darlo.
> **Todo lo de abajo está medido contra `origin` al escribirlo, no recordado.**

---

## §1 · QUÉ HAY EN `main` AL ARMAR EL BUNDLE — el checklist de la regla 88

**`origin/main` = `02870ee1`**

`main` **ya tiene** `packages/api` de S100-A, por **cuatro merges tempranos
acotados**, autorizados por el founder como **procedimiento** de esta sesión.
Cada uno: acotado por pathspec · declarado con su SHA · avisado a las cuatro ·
`--clear` de Metro después. **Ninguno fue publicación: no salió OTA.**

| # | qué entró | main quedó en |
|---|---|---|
| 1 | el gate de la puerta · determinismo del catálogo · `track` · `sedimentado` | `2e3536b6` |
| 2 | `destino_lat/lon` (H-11) + la ficha del repartidor (F3) | `92d3d65a` |
| 3 | los wrappers de **la compra** | `53dbb1d1` |
| 4 | **F6** · el nombre de la tienda | `02870ee1` |

**Por qué existieron:** D estaba bloqueada tres veces seguidas — su pantalla de
EN CAMINO consume `track` y `destino`, su ficha consume `obtenerFichaRepartidor`
y su ceremonia consume `sedimentado`. *Un merge acotado y declarado es
exactamente lo que la regla 88 protege: que quien publica pueda **afirmar** qué
hay en main.*

---

## §2 · QUÉ FALTA ENTRAR — las cuatro ramas, medidas

| rama | SHA | commits sobre main | toca `packages/*` |
|---|---|---|---|
| `pista-a` | `c8eeeae8` | 10 | 5 (ya en main) |
| `pista-b` | `580e0c0a` | 17 | **21** |
| `pista-c` | `29c02541` | 34 | **21** |
| `pista-d` | `f70072c0` | 19 | **0** |

### 🔴 LOS TRES PUNTOS DONDE EL ORDEN DECIDE SI HAY CONFLICTO

1. **`packages/ui` lo tocan B y C.** Pero **C ya contiene el trabajo de B** —su
   diff incluye `docs/loop/S100-B.md` y la lámina de las seis recetas—, o sea
   que C mergeó a B. ⇒ **B entra antes que C, o C lo trae y B queda redundante.**
2. **`apps/cliente/src/i18n/{es,en}.ts` lo tocan A, C y D.** Es el punto de
   colisión clásico: tres pistas agregando claves al mismo archivo. **No es un
   conflicto de contenido —cada una agrega las suyas— pero git lo va a marcar
   igual si caen cerca.** Se resuelve conservando **las tres**, jamás eligiendo.
3. **`packages/api/src/wrappers/despensa-catalogo.ts` lo tocan A y C.** **Ya
   está resuelto y declarado por las dos:** C escribió su propia cura, comparó,
   **se quedó con la mía** y la trajo con `git checkout origin/pista-a`. ⇒ **no
   debería conflictuar; si conflictúa, gana la de `main`.**

### ORDEN PROPUESTO
**B → C → D → A.** B primero porque C lo contiene (así el conflicto se resuelve
una vez y no dos). D no toca `packages/*`, así que entra limpia. **A último
porque es lo único que ya está parcialmente en main** y porque la mano
publicadora debe ver el árbol final antes de bundlear.

---

## §3 · 🔴 LA INCONSISTENCIA DECLARADA, Y SI EL BUNDLE LA CIERRA

**SÍ LA CIERRA — y por eso hay que decir explícitamente que se cierra.**

Hoy: **CINCO migraciones de S100-A están APLICADAS en la base** y viven **solo
en `pista-a`**. `main` tiene los **tipos** (sin `envio_eventos`, con `compras`)
y **no** las migraciones que los produjeron.

- Contra la **base viva**: **cero drift** — `gen:types` lee la base.
- Contra las **migraciones de `main`**: **sí hay drift** — una base reconstruida
  desde ahí recrearía `envio_eventos` y no tendría `compras`.
- **Guardarraíl vigente hasta el bundle: nadie reconstruye una base desde las
  migraciones de `main`.**

**Al entrar `pista-a` al bundle, las cinco migraciones llegan a `main` y la
inconsistencia desaparece.** *Una inconsistencia declarada con su ventana de
cierre es deuda; la misma sin declarar es una trampa — la diferencia no está en
el estado, está en si alguien puede saberlo.*

**Las cinco:**
`20260820010000` el ítem es de su vendedor · `20260820020000` jubilar
`envio_eventos` · `20260820030000` la compra · `20260820040000` la ficha del
repartidor · `20260820050000` los nombres de tienda.
**Las cinco con reversa escrita ANTES**, en `docs/relevamientos/`.

---

## §4 · LO QUE TOCA `packages/*` — y qué exige después

`packages/api` (A, ya en main) · `packages/ui` (B y C, 21 archivos).
⇒ **Metro con `--clear` en las cuatro después del bundle.** Y el recordatorio
que costó una tarde en S99: **en un worktree, `packages/*` resuelven al repo
PRIMARIO** — lo que una app sirve puede no ser su rama.

---

## §5 · LO QUE **NO** ENTRA, CON DUEÑO Y DISPARO

| deuda | dueño | disparo |
|---|---|---|
| **El despacho debe estampar el vehículo en el envío** | motor | hoy invisible (1 repartidor, 1 vehículo); **el día del segundo, la placa que la familia verifica en la puerta es la equivocada** |
| **`crear_pedido_despensa` busca su clave de idempotencia sin filtrar por dueño** | motor | alinear a la forma de `compras` (filtro por `user_id` + UNIQUE compuesto). *El mismo defecto dos veces ya no es un descuido: es una decisión.* |
| **La cadena de selección entre vendedores (H-001)** | motor | **frenada con medición**: no hay columna ni tabla de calificación de vendedor; `resenas_productos` califica el PRODUCTO y tiene 0 filas |
| **H-007 · el prólogo serial del Hogar** (3 viajes, ~450 ms) | A | RPC de contexto; nace junto a D-738 |
| **H-10 · la foto de entrega se purga a 90 días** | founder + legales | el número de la ventana de disputa **no está medido** |
| **La foto del repartidor vive en el bucket de las cédulas** | construcción con letra | bucket propio, carga propia, consentimiento propio |
| **`envio_eventos` jubilada** | — | ☠️ cerrado |
| **3 pedidos con texto de siembra en `entrega_referencias`** | mesa | la fuente ya está curada; las filas vivas no se tocaron (freno: dato vivo) |

**Retiro de la siembra de D**, para después del gate:
`UPDATE envios SET track_gps=NULL, hacia_destino_en=NULL, estado='en_reparto' WHERE id='474e6ff6-3c99-4f56-842f-b965537903ac';`

---

## §6 · EL SUJETO VIVO DEL GATE — medido, no leído de un NOTICE

| qué | valor |
|---|---|
| envío con track | `474e6ff6-3c99-4f56-842f-b965537903ac` · **6 puntos** |
| destino | ✅ cargado |
| estado / ventana | `hacia_destino` · `salio_en` ✅ · `hacia_destino_en` ✅ |
| repartidor · placa | «Repartidor de Pruebas», activo · **`PBA-0142`** |

⚠️ **Lo que el gate tiene que poder distinguir:** **6 repartidores, 1 con
vehículo** ⇒ **5 de 6 fichas salen sin placa POR DATO, no por lector.** Y **2 de
4 envíos tienen destino** ⇒ el mapa no se dibuja en los otros dos, y eso tampoco
es falla.

---

## §7 · GATES AL ESCRIBIR ESTE RESUMEN

`verify:diseno` **VERDE, 40 reglas** · `tsc` **5 de 6** (el único rojo es
`@epetplace/domain` por `@types/emscripten`, **pre-existente y declarado en
CLAUDE.md desde S63**) · los dos instrumentos de S100-A **verdes** (14/14 y
12/12) · árbol de `pista-a` limpio · `origin` verificado **por SHA**.

**Lo que NO está verificado y se dice:** nada de S100 se vio en un aparato.
**El gate del founder es la única firma que vale**, y la pregunta que la
Dirección de Diseño fija para toda pantalla nueva es **«¿artesano, u obrero?»**.
