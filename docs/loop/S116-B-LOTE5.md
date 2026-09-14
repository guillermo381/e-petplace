# S116-B · LOTE 5 — el glifo en ciruela, la onda, el asistente que respira y el logo sin fondo

**Rama `pista/s116-b-05` · SHA `274a1fb6`** (desde `origin/main` @ `ae4fcdb4`).
Cuatro commits: `61880eed` · `4c7b0b1c` · `0836069d` · `274a1fb6`.

---

## LA TABLA DE LOS CINCO PUNTOS

| # | Encargo | Estado | Dónde |
|---|---|---|---|
| 1 | Glifo a ciruela · círculo a ciruela-tinte · `verify:contrast` en cero | ✅ **y cambia de significado — ver §1** | `Icono` (registro `'glifo'`) · `CeldaNavegacion` · tema ×5 |
| 2 | Foco y halo a ciruela en `Campo` y `CampoCodigo` | ✅ **+ un defecto que el token escondía** | `caja-de-campo.ts` · `elevacion.ts` |
| 3 | `OndaAcceso` nueva | ✅ construida, exportada, en galería y catálogo · **0 consumidores** | `OndaAcceso.tsx` |
| 4 | Halo que respira + glifo de destellos | ✅ **y el glifo YA ESTABA** | `BotonAsistente.tsx` |
| 5 | `logo.png` sin fondo blanco, verificado sobre lienzo a portada | ✅ **y acá el fondo SÍ era una forma aparte** | `assets/marca/logo*.png` |
| — | Catálogo al día en el mismo commit | ✅ 30 piezas en 25 entradas | `CATALOGO_PIEZAS_V5.md` |

**Gates:** `verify:contrast` **457 pares / 0** (eran 450 y **no medían nada de esto**) · `verify:diseno` **VERDE, 80 reglas** · `verify:catalogo-v5` VERDE · `verify:reduced-motion` VERDE · `tsc` 0 en `packages/api`, `packages/ui`, `apps/cliente`, `apps/prestador`.

---

## ① EL PUNTO 1 NO ERA LO QUE DECÍA SER, y conviene saberlo antes de leer el resto

La orden dice *«el color de glifo… pasa de magenta a ciruela»*. **Medido: hoy ningún glifo de la casa es magenta.** Los de la costura se montan `registro="tinta"` y los de fila heredan `text.primary`.

El comentario de `FilaAccionesCostura` decía *«círculos blancos con glifo magenta»* **y su propia galería los montaba en tinta** — cuarto comentario de esta sesión que afirma lo que el código no hace.

⇒ **El cambio real no es «magenta → ciruela»: es que el glifo deja de heredar la tinta del texto y pasa a tener color propio.** Eso es lo que permite que un día cambie sin arrastrar todo lo que está escrito en tinta.

**Cómo se cableó, y por qué así:** entra como **cuarto registro de `Icono` (`'glifo'`)**, no como un color que pase cada pantalla. El registro es el único lugar donde esta casa decide de qué color sale un glifo; con `tinta={theme.accent.glifo}` habría que escribirlo en cada consumidor, y el día que la mesa lo mueva **la lista de quién lo escribió no existe en ninguna parte**.

**Medido en pantalla (consumidor montado, no galería):** en el tab Cuenta, cada fila sale con glifo **`#4E1160`** sobre círculo **`#EAE0EA`** — leído del píxel, no del ojo. Captura: `capturas-s116-b/glifo-ciruela-en-cuenta.png`.

**Ciruela sobre su tinte da 10,39:1; el magenta sobre ese mismo tinte daba 3,99** — el cambio casi triplica la legibilidad del glifo.

### Lo que NO se tocó, con su razón

- **`EscaleraIconos`** — su color es el **ESTADO del nodo** (hecho · actual · pendiente). Pintarlo de ciruela borraría la señal.
- **`Campo.iconoIzq`** — el slot existe y **nadie lo monta** en ninguna pantalla. No hay nada que repintar.
- **No existe pieza de «paso numerado» en `packages/ui`.** `BarraPasos` son tramos, no discos numerados.

### 🔴 LO QUE FALTA Y ES DE C, con el token exacto

Las filas de **«Ponte al día»** en el Hogar siguen con círculo **`#FCE4F1`** (rosa tinte). Medido: las pinta `apps/cliente/src/app/(tabs)/hogar/index.tsx:267` con `theme.capaBg[capa]`.

**No lo toqué y no se cura desde el tema:** `capaBg` tiene consumidores muy lejos de un glifo — `FichaDeOferta`, `Guijarro`, `CalendarioCupo`, `Insignia`, `SelectorRoster` —, así que moverlo cambiaría cinco piezas que la orden no nombra.

**Lo que esa fila necesita:** `backgroundColor: theme.accent.glifoBg` y el glifo con `registro="glifo"`.

---

## ② EL FOCO — y el defecto que el token escondía

`colorDeContorno` devuelve **`accent.glifo` bajo v5** y conserva `accent.active` (tealDark) en el prestador. **Ley 5 intacta**: el campo enfocado sigue siendo el elemento activo de la vista; lo único que cambió es con qué color lo dice la casa del cliente. `CampoCodigo` **no se tocó** — comparte `estiloDeCaja`, que es exactamente para lo que esa frontera existe.

🔴 **Y al ir a cambiar el rgba del halo apareció lo que el string fijo escondía: `formaV5` es `true` en el tema CLARO Y EN EL OSCURO del cliente**, y en oscuro el acento no es ciruela sino rosa. **Un halo horneado miente en una de las dos casas y no falla**: se ve un cerco violáceo casi invisible sobre fondo oscuro y nadie lo reporta.

⇒ el token conserva lo que de verdad es suyo —**la geometría (4 px) y la dosis (10 %)**— y **recibe el color**: `halo.presencia(color)`. Un halo es, por la letra, su propio borde al 10 %: derivarlo lo vuelve imposible de desincronizar.

**`Opcion` se queda en magenta A PROPÓSITO** — elegir una opción **es** accionable, y la orden reserva el magenta para eso. *El mismo canal puede hablar con dos acentos; por eso el halo recibe su color en vez de traerlo.*

`conAlfa` sube de `MapaZona` a `tokens/con-alfa.ts` al aparecer su segundo consumidor (N17).

**Medido:** foco sobre interior del campo **13,35:1** en claro y **10,04:1** en oscuro.

---

## ③ `OndaAcceso`

Contrato: **`frase` (ya partida en dos líneas) · `lado` · `especies?`** (las seis por default). Exporta **`ALTO_ONDA_ACCESO`**.

- **La ola es un `Path`, no un `borderRadius`:** un radio da un **domo** —simétrico, una sola inflexión— y *una ola tiene dos*. `viewBox` de 100 con `preserveAspectRatio="none"`: la curva se estira con la pantalla en vez de repetirse.
- **La frase llega partida.** Dónde corta es redacción; un `numberOfLines={2}` la decidiría con el ancho de cada teléfono.
- **El teclado, con sus dos mitades:** el **alto es una constante** (una franja que mide un número no se puede comprimir) y el **fundido** es lo que impide que se vea salir. ⚠️ **Lo que la pieza no puede sola:** si la pantalla la mete en un reparto `flex`, el reparto es de la pantalla.
- **La rueda no sortea:** orden fijo, así no repite dos veces la misma cara —*que se lee como que se colgó*—. Con **una sola especie no arranca**. Con `useReducedMotion` **queda quieta**: apagar el fundido y dejar el salto sería peor que no moverse.
- `Personaje` gana **`forma='circulo'`** (default `'chip'`, ningún consumidor cambia). Prop y no pieza nueva: lo único que cambia es el radio, y un `PersonajeCircular` sería **una segunda lista de especies** que diverge el día que entre el cerdo.
- Nace **`motion.v5.personajePrimeraMs`**. Token y no «un 3000 menos en la primera vuelta»: **cuándo arranca la rueda y cada cuánto gira son dos decisiones**.

⚠️ **DECLARADO Y NO DISIMULADO:** la orden dice *«la CARA de un personaje»* y lo que la casa tiene es el **personaje entero**. Se monta entero. Recortar a ojo seis ilustraciones distintas daría seis encuadres distintos, **y el que quede mal no se nota hasta que lo ve el founder**. El recorte, si la mesa lo quiere, lo decide el ilustrador y entra como asset.

### 🔴 SU CAPTURA NO SE PUDO TOMAR, y la razón es una ley de la casa

`OndaAcceso` tiene **0 consumidores**, así que su única superficie de gate es `/gallery` — **y la galería NO es alcanzable en el binario instalado**. Medido: `cliente://gallery` **no navega** (la pantalla no cambia un píxel), ni con la app corriendo ni en frío; en el tab Cuenta **ya no está su entrada** (quedó sólo «Lámina S74 · la fusión del avatar»).

**Es `L-161` otra vez** —*toda superficie de gate se verifica ALCANZABLE antes de publicarse*— y esta vez le toca a la galería entera. **La sección está escrita y montada** (tres casos: los dos lados y el borde de una sola especie); lo que falta es una puerta.

---

## ④ EL ASISTENTE

- El halo respira con la **cadencia del orbe** (`motion.coach.respiracionMs`), **tomada y no copiada**: la orden pide *«que se lea como el orbe viejo»*, y dos respiraciones con el mismo número en dos lados se separan el día que alguien ajuste una. **Escala propia (1,3)**: el orbe respira **1,06 sobre sí mismo** y en un halo eso es invisible — *un halo no es el cuerpo respirando: es el aire que el cuerpo mueve.*
- **«Sin cambiar tamaño ni posición» se cumple con aritmética:** el contenedor crece `2×margen` y el `right`/`bottom` restan ese mismo margen, con el **margen derivado de la escala**. El botón queda en el píxel donde estaba, y el día que la escala cambie las dos mitades se mueven juntas.
- **El arco de la enmienda queda escrito entero en la pieza.** Declaraba *«no respira, no late: está»* con las palabras del encargo del lote 2, y su argumento (Ley 5) **sigue siendo correcto**. La mesa no levantó la regla: **declaró la excepción y la acotó a UNA pieza** — si mañana otra pide respirar en reposo, esta excepción es el argumento **en contra**, no el precedente a favor.
- ⚠️ **El glifo de destellos YA ESTABA — medido, no agregado.** `'ia'` es el trío de chispas de Kaxo re-tokenizado desde que la pieza nació. Se declara para que nadie salga a dibujar un segundo glifo de chispas.

**Medido en el emulador, cuatro cuadros a un segundo:** el halo pasa de **33 px a 51 px** en la fila central y **el botón se queda en 150 px constantes**. Captura: `capturas-s116-b/asistente-halo.png`. *La respiración no se afirma: se cuenta en píxeles.*

### 🔴 HALLAZGO DE CAMPO, para la mesa

En el tab **Cuenta**, el botón del asistente **se superpone con la pastilla del tab activo** (ver `glifo-ciruela-en-cuenta.png` y las capturas del halo): la pastilla del tab elevado sube por encima de la barra y el asistente vive justo ahí. **Se ve en el último tab de la derecha y sólo en ése.** No lo toqué: mover el asistente cambia `AIRE_RAIZ`, que C ya consumió.

---

## ⑤ EL LOGO CLARO — y acá el fondo SÍ era una forma aparte

**Medido antes:** alfa **mínimo 247 sobre 255** en toda la imagen —opaca entera— y la esquina en blanco pleno. **Después: 55 % transparente, 35 % opaco.**

🔴 **Y la cura del isotipo no alcanzaba, que es el hallazgo:** los dos rasterizados veían el blanco igual, el despeje daba **α = 1** y **devolvía exactamente lo que entró**. *Un resultado idéntico al original es el síntoma, y se lee como «ya estaba bien»* — corrí la cura, no falló, y no había curado nada.

El blanco resultó ser un **`<path fill="#ffffff">` propio**: un rectángulo de **1255×903 sobre un lienzo de 1254×1254**. ⇒ **la respuesta a la pregunta de la mesa es distinta en cada logo: en el oscuro NO era una forma aparte y en el claro SÍ.** Un censo por `<rect>` no lo habría encontrado: está dibujado como path.

**El camino quedó como script** —`scripts/curar-alfa-horneado.py`— porque fue la segunda vez: *derivar la fórmula de nuevo cada vez es la misma deuda que un número tecleado dos veces.* Lleva el despeje (`α = 1 − (Cb − Cn)`, `C = Cn/α`), por qué hacen falta dos rasterizados (`qlmanage` no preserva alfa) y `--quitar-fondo`, que exige **dos** condiciones y **dice qué sacó y de qué tamaño**.

⚠️ **Su primer criterio estaba mal y lo dijo en voz alta:** pedía 95 % en **los dos** ejes, y la banda cubre el ancho entero pero **el 72 % del alto** ⇒ contestó *«el fondo NO es una forma aparte»*, **una respuesta falsa con forma de medición**. El eje horizontal es el que discrimina.

⚠️ **LO QUE QUEDA Y NO SE DISIMULA:** el **trazo del marco del SVG** sobrevive en el borde con **alfa ~100/255 en las esquinas**. Sobre lienzo es blanco sobre casi-blanco y **no se ve**; sobre ciruela **sí**. **No llega a ninguna pantalla** porque `sobre="claro"` es, por contrato, sólo para lienzo y superficie. *No se quita porque su trazo es el MISMO path que contornea la marca entera: sacarlo se lleva el contorno del logo.*

Captura a tamaño **portada real** (184 pt = `marcaPortadaFraccion` × 400, a 3×), antes y después, sobre lienzo y sobre ciruela: `capturas-s116-b/logo-claro-alfa.png`.

---

## ⑥ DOS ERRORES MÍOS, declarados

**(a) Rompí `verify:contrast` y lo arreglé.** Mi bloque de pares nuevos se insertó **dentro de un `todos.push(` que seguía abierto**, así que el push interno se evaluaba como argumento del externo y **lo que entraba al arreglo era el número que devuelve `push`**. El gate tiraba `TypeError` sobre `par.fg`. Lo encontré poniendo una sonda que imprime los vecinos del elemento roto, no leyendo.

**(b) 🔴 `4c7b0b1c` exporta `OndaAcceso` y NO llevaba el archivo — y ningún gate podía cazarlo.** La forma pathspec de la regla 84 **no ve archivos sin trackear** (su propia letra pide `git add -N` primero) y no lo corrí. **El hook corrió `tsc` sobre las cuatro superficies y dio VERDE, correctamente**: `tsc` compila **el árbol de trabajo**, donde el archivo sí estaba.

> *Un gate que mide el árbol no puede decir nada del commit. Su verde es verdadero y no habla de lo que se está guardando.* Y el síntoma **no aparece en la pista que lo comete**: aparece en la siguiente, como un import roto que no corresponde a ninguna línea que esa persona escribió.

Curado en `274a1fb6`. **Lo vi con `git status --porcelain` después de commitear, no con un gate.**

---

## ⑦ OPERATIVO — y un aviso a C

Para capturar levanté **mi propio emulador** (AVD `s113_E`, puerto **5590**) y **mi propio Metro** (puerto **8090**), respetando la regla de un emulador por pista: **no toqué `emulator-5578` (`s114_C`), que tenía un `adb reverse` vivo.**

🔴 **AVISO A C, y no puedo resolverlo desde acá:** al apagar lo mío, `adb devices` quedó **vacío** — **el emulador de C también dejó de estar**. Estaba vivo cuando arranqué. **No puedo distinguir si lo tumbé yo o si cayó solo con dos emuladores en memoria**, porque no medí `adb devices` justo antes de matar el mío. *Lo declaro en vez de suponer que no fue mío.*

Las credenciales se copiaron al worktree para la captura y **se borraron al terminar**; no se imprimieron en ningún momento.

**Lo que NO se hizo:** capturas de 03, 05 y 07 —esas pantallas son de C y las piezas de este lote tienen **0 consumidores** ahí— y la captura de `OndaAcceso`, por la galería inalcanzable (§3).
