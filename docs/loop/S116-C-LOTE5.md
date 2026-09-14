# S116-C · LOTE 5 — 02 Beneficios vuelve a ser UNA pantalla

**Rama:** `pista/s116-c-05`, desde `origin/main` @ `6e3e5003` (A cerró el merge de
`0c7633bc`, verificado con `merge-base --is-ancestor`).

---

## ① LO QUE MURIÓ, y con qué

☠️ **Las tres tarjetas deslizables**, y con ellas toda su maquinaria: el
`ScrollView` horizontal con `pagingEnabled`, el estado `actual`, el
`useWindowDimensions`, la fila de puntos de paginación y la condición que
mostraba el CTA sólo en la última. **Ley 37: se retira entero, no se comenta.**

Se van también sus seis voces (`unoTitulo` … `tresApoyo`) y `paso`, que decía
*«Tarjeta {{actual}} de {{total}}»* — *una voz que cuenta tarjetas que ya no
existen es letra muerta que el próximo censo va a encontrar sin saber por qué.*

**Lo que se conserva, y por qué:** la marca de «ya la vio»
(`epp.cliente.beneficiosVistos.v1`) y el `CONTEO_PENDIENTE` de los dos toques.
*El cambio es de forma, no de contabilidad: cuántos saltan y cuántos completan
se sigue queriendo saber el día que exista la puerta de eventos.* ⚠️ Y esa
puerta **sigue sin existir** — medido en el lote 3, cero en `apps/cliente/src/lib`
y cero en `packages/api`.

## ② LO QUE ENTRÓ, pieza por pieza

| zona | qué monta | de dónde sale |
|---|---|---|
| fondo | `theme.bg.base` | el lienzo, sin tarjeta ni degradado |
| «Saltar» | `Boton variante="ghost" tamaño="sm"`, arriba a la derecha | tinta apagada por la variante, no por un color |
| la cara | `Personaje tamano="grande" fondo="blanco" forma="circulo"` | el círculo blanco grande; `grande` es el doble del avatar del hogar y **lo resuelve la pieza** |
| el título | `Texto variante="titulo"` | Baloo por `ESCALA_V5`, sin una línea de fuente acá |
| las cuatro filas | `Tarjeta` **una sola**, con cuatro `Celda` | glifo en `inicio`, `titulo` y `subtitulo` |
| el glifo | `Icono registro="capa"` | el círculo ciruela lo pone el registro |
| la entrada | `Entrada orden={i}` | escalonada, con `useReducedMotion` y memorial resueltos adentro |
| el CTA | `Boton variante="primario" bloque` | la única primaria, y ahora **siempre** |

**La cara y el título van EN FILA**, no centrados uno sobre otro: es lo que
muestra el sketch, y así el título arranca a la altura de la mirada del
personaje en vez de flotar encima.

**Las cuatro filas salen de un arreglo y no escritas a mano** para que el
escalonado salga del índice — *cuatro `Entrada orden={…}` copiadas divergen la
primera vez que alguien reordene.*

### 🔴 El glifo de «verificado», elegido con razón

Los cuatro pedidos eran buscar · verificado · agenda · documento. **Tres existen
con ese sentido** (`lupa`, `hoy`, `documento`); **«verificado» no**, y los dos
candidatos dicen cosas distintas:

- `certificaciones` es *«papel + huella como SELLO»* — **el documento**;
- `checkEnCirculo` es un tilde en un círculo — **el estado**.

La fila no dice «hay certificados»: dice que los profesionales **están
verificados**. ⇒ **`checkEnCirculo`**. *Montar el papel donde va el estado es el
préstamo entre significados distintos que la casa prohíbe.*

## ③ 🔴 LA RUEDA SE ESCRIBE UNA VEZ — y ya eran TRES

02 rota caras con **el mismo reloj** que el splash y que la `OndaAcceso` de B.
La casa ya escribió la doctrina al construir la onda: *«tiene estado propio que
corre solo… dos pantallas que la dibujen son dos ruedas que se desincronizan — y
peor, dos lugares donde alguien tiene que acordarse de apagarla con
`useReducedMotion`»*.

⇒ nace **`lib/rueda-de-caras.ts`**, y **00 se migró a él en el mismo commit**:
la copia que yo mismo había escrito en el splash muere ahí. *Escribirla una
tercera vez habría sido cobrar la lección que la casa ya había pagado.*

⚠️ **Es un `.ts` y no una pieza, y se declara:** ahí vive **el tiempo**, no el
dibujo — cada pantalla monta `Personaje` como quiera (círculo grande en 02, fila
de seis en 00). `packages/ui` no expone ninguna rueda (medido: cero exports
`Rueda*`). *Si algún día la necesita una pista fuera del cliente, el pedido a B
es una pieza y este hook muere.*

**Las dos cadencias se conservan**: primera cara al segundo, las siguientes cada
tres. Y `useReducedMotion` **la apaga, no la acelera** — queda la primera cara
quieta. *Quien pidió menos movimiento no quiere uno más rápido: quiere ninguno.*

## ④ LA VARA — las once preguntas para 02

| # | pregunta | 02 | evidencia |
|--:|---|:-:|---|
| 1 | una sola cabecera | **sí** | no lleva: es una presentación sobre lienzo, con «Saltar» como único control arriba |
| 2 | tabs solo en raíz | **sí** | pantalla empujada, sin barra |
| 3 | un acento | **sí** | una sola primaria («Comenzar»); «Saltar» es `ghost` |
| 4 | Baloo arriba, PJS abajo | **sí** | `titulo` y `Celda`, resueltos por `ESCALA_V5` — cero fuentes en la pantalla |
| 5 | nada local | **sí** | `Personaje` · `Texto` · `Tarjeta` · `Celda` · `Icono` · `Boton` · `Entrada` · `spacing`. **Cero color, tamaño o tiempo literal**; el único número propio es el reloj, y vive en el hook con su porqué |
| 6 | plata y fecha por su riel | **n/a** | no muestra ninguna |
| 7 | estado con palabra | **n/a** | no tiene estados: es una presentación |
| 8 | vacío honesto | **n/a** | no hay datos que puedan faltar — las cuatro filas son texto fijo |
| 9 | movimiento que dice algo | **sí** | la rueda dice que la app es de varias especies; el escalonado da el orden de lectura. *Nada se mueve por moverse* |
| 10 | voz | **sí** | tuteo neutro, es/en en paridad |
| **11** | **se USÓ, no se fotografió** | ⚠️ **ver ⑤** | |

**Cero «no» ⇒ ninguna ficha.**

## ⑤ ⚠️ LO QUE NO PUDE VERIFICAR, Y NO LO DOY POR BUENO

### ⑤.1 · 🔴 EL GLIFO NO ESTÁ EN SU CÍRCULO — falta la pieza

La firma pide *«glifo en ciruela sobre su círculo»*. **Lo monté sin el círculo**,
y la captura lo muestra: salen en trazo suelto.

**Medido, y por eso es un pedido y no un descuido:** el disco lo dibuja
`CeldaNavegacion` **adentro**, y esa pieza **exige `onPress`** — es la de
navegación, y estas cuatro filas **no llevan a ningún lado**. `Icono` no tiene
prop de disco (`registro` decide el COLOR, no la forma) y `Celda` recibe el
glifo pelado por su slot.

⚠️ **El círculo existe TRES veces en la casa, cada una encerrada en su pieza**
(`CeldaNavegacion`, el `DiscoAcceso` de `FilaAccionesCostura`, el `DiscoVidrio`
de `Cabecera`) — *tres dibujos del mismo disco y ninguno alcanzable desde
afuera.*

🔴 **Podría haber pasado un `onPress` vacío y la captura salía igual al sketch.
No lo hice**: la casa nombra ese movimiento como defecto —*«mentir una prop para
lograr una combinación legítima»*— y dejaría **cuatro filas anunciándose
tocables a un lector de pantalla sin hacer nada.** *Prefiero entregar la pantalla
con un disco de menos que con cuatro mentiras de accesibilidad.*

**Pedido a B:** `docs/loop/buzon/S116-C-para-B-glifo-en-circulo-sin-accion.md`,
con las dos formas posibles y mi voto.

### ⑤.2 · La 11, respondida sin adornos

**Se usó como se usa**: salí de la sesión, entré por 01 → «Crear cuenta» y **02
apareció en su camino real**, no por deep link ni por arnés. La captura es de ahí.

⚠️ **Lo que NO probé, y lo digo:** «Saltar» y «Comenzar» **no se tocaron** —
los dos marcan `beneficiosVistos` y llevan a 05, y quería dejar la pantalla
alcanzable para el gate del founder en vez de quemar la marca en mi emulador.
*No los doy por buenos: son el mismo `seguir()` que ya estaba y que no cambié,
pero eso es un argumento, no una medición.*

### ⑤.3 · El emulador peleó, y se declara

La red del emulador quedó rota desde el lote anterior (corté wifi para filmar el
splash). Reinicio, `-dns-server`, y quedó con **pérdida parcial de paquetes**.
02 no toca la red, así que la captura es válida — *pero el `AuthRetryableFetchError`
que se ve en algunas capturas intermedias es del emulador, no de la app*, y lo
digo para que nadie lo lea como un defecto del producto.
