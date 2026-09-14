# S116-B · LOTE 6 — las siete del recorrido en aparato

**Rama `pista/s116-b-05`** (sigue la misma: las piezas viven ahí sin mergear). **No pido merge.**

**Gates:** `verify:diseno` VERDE (80 reglas) · `verify:contrast` **461/0** · `verify:catalogo-v5` VERDE · `verify:reduced-motion` VERDE · `tsc` 0 en las cuatro superficies.

**Emulador con barra de TRES BOTONES**, como pidió el founder: el overlay `navbar.gestural` se apagó y quedó sólo `navbar.threebutton` (verificado con `cmd overlay list`).

---

## LA TABLA

| # | qué pedía | estado |
|---|---|---|
| 1 | la onda respeta el inset | ✅ **el diseño ya era el correcto; fallaba el NÚMERO** |
| 2 | la cabecera y el fondo, una sola superficie | ✅ **causa medida: son dos superficies, no dos tonos** |
| 3 | el asistente sobre la barra, más chico | ✅ **y el aparato corrigió MI primera cura** |
| 4 | el halo más ancho y luminoso | ✅ 7,8 px → 15,6 px de aura, mismo ritmo |
| 5 | Identidad y Pasaporte + censo de la jeringa | ✅ dos dibujos + **censo en CERO, con su consecuencia** |
| 6 | borde del campo en ciruela | ✅ **y «tenue» resultó tener piso** |
| 7 | el isotipo de los papeles (`D-1107`) | ✅ **y la ficha describía mal el problema** |

---

## ① LA ONDA — el diseño era correcto, el número no

La adenda del founder (*«la franja se queda como está… lo único que sube es el CONTENIDO»*) describe **exactamente** la forma que la pieza ya tenía desde el lote 5b: `paddingBottom` y no margen, para que el color sangre y sólo el contenido se corra.

⇒ **lo que fallaba era con qué número.** `insets.bottom` dice **cuánto mide** la barra del sistema, **no cuánto de ella queda debajo de vos**: adentro de `(tabs)` el navegador ya la reservó. Ahora se **mide** contra la base de la pantalla (`useInsetQueFalta`, extraído de `pie-fijo`).

⚠️ **Sin captura, y la razón no cambió desde el lote 5b:** la onda tiene 0 consumidores en mi rama, `cliente://gallery` no navega y el prestador instalado no es dev build. Los tres obstáculos siguen medidos en el parte anterior.

---

## ② LA COSTURA — no eran dos tonos, eran dos superficies

**Medido, y la causa es aritmética:** `Cabecera` y `HojaContenido` pintan **el mismo degradado** con el **mismo `start`/`end`** — pero `end={{ y: 1 }}` significa *el fondo de MI caja*. La cabecera completa la rampa entera en sus **~300 px**; el fondo la estira sobre los **~2400** de la pantalla. **Al pie de la cabecera se tocan dos colores distintos del mismo degradado.**

> *No es que «no empaten»: son dos superficies, y dos superficies siempre van a tener un borde.* **El síntoma lo prueba solo — no se ven DOS tonos si no hay DOS.**

Igualar los números habría sido perseguir el empate en cada alto de cabecera y en cada teléfono. ⇒ **como `fondo`, la cabecera no pinta nada**: con una sola superficie el borde es **inexpresable**. Y es lo que su propio contrato ya decía (*«el degradado lo pinta ESTA pieza, no la Cabecera»*); lo que faltaba era que la cabecera dejara de pintarlo.

**Medido en el aparato** (login, franja vertical cada 10 px): la rampa baja de `(76,16,93)` a `(63,12,76)` con **Δ ≤ 1 por paso**. Los dos saltos de Δ=39 son el disco de vidrio del botón volver, no una costura.

---

## ③ EL ASISTENTE — y acá el aparato corrigió MI cura

Puse el inset **derivado** y medí: **el botón seguía tapado.** Magenta visible **y 2004-2048** — 44 px de ~156 — con la barra de tabs arrancando en **y=2052**.

Con el inset **crudo**: **y 1876-2010**, o sea **42 px por encima de la barra**, entero.

> **La derivación es correcta para un pie que vive DENTRO del contenedor y equivocada para un absoluto anclado a la pantalla.** *Dos piezas con el mismo síntoma no tienen por qué tener la misma cura, y la única forma de saberlo fue mirar los píxeles de las dos.*

Diámetro **60 → 52**. No 48: el área táctil mínima de la casa son **44** y el halo respira por fuera; a 48 el disco queda a 4 px del piso táctil y cualquier ajuste futuro lo cruza sin que nada avise.

**Captura:** `capturas-s116-b/asistente-sobre-barra-3botones.png` (antes/después, barra de tres botones).

⚠️ **Hallazgo para la mesa:** ya sobre la barra, el asistente **se superpone con la pastilla «En vivo»**. Es colocación de contenido, de C.

---

## ④ EL HALO

`1,3 → 1,6` y `0,35 → 0,55`. **Sobre un disco de 52, el 1,3 asomaba 7,8 px** — a un brazo de distancia eso es un borde, no un aura; 1,6 asoma **15,6**. *El ritmo no se tocó: siguen tres respiros y descansa.*

---

## ⑤ LOS GLIFOS

### El censo, que da CERO y por eso dice algo

**`nombre="vacuna"` montado en `apps/cliente`: CERO** — en mi rama **y** en `origin/pista/s116-c-03b`. El único hit es mi propia nota de un lote anterior diciendo exactamente eso.

⇒ **la jeringa que el founder ve no llega por nombre.** O viene de trabajo que todavía no está pusheado, o esa fila hereda su glifo de otro lado. *Un censo en cero no cierra el caso: acota dónde puede estar, y eso es lo que entrega.*

### Los dos dibujos

- **`pasaporte` SE REDIBUJA.** El viejo dibujaba un **código QR** — buen dibujo, **otra cosa**: *un QR es cómo se LEE un documento, no el documento.* Ahora: libreta con lomo (la línea pegada al borde, lo único que separa una libreta de una tarjeta a 21 px) y **sello mordido por el canto** — centrado sería un logo, no un sello.
- **`identidad` NACE**, aunque `documento` ya dibuje una cédula con retrato — **y la razón la tenía escrita el propio registry**: `documento` hace **TRIPLE TURNO** y *«tres iguales en una sección abierta es la clase D-546»*. **El founder está viendo exactamente eso.** Darle dibujo propio a la identidad **descarga el turno**, no agrega una cuarta copia.
- **Se distinguen por ORIENTACIÓN:** `documento` apaisado con el retrato chico al costado; `identidad` **vertical con el retrato dominante**. *A 21 px lo que discrimina es la orientación y el peso del retrato, no el detalle.*

**Hoja de contacto a 21 y 48** con sus cuatro vecinos (`documento`, `vacuna`, `carnet`, `papel`): `capturas-s116-b/hoja-de-contacto.png`.

---

## ⑥ EL BORDE DEL CAMPO — «tenue» tiene piso

El borde de un campo es **contorno de control** ⇒ **3:1 (WCAG 1.4.11)**, que `R43` ya vigilaba. **Ciruela al 25 % —lo que «tenue» sugiere a ojo— da 1,82:1**: *se ve tenue y deja de existir para quien no distingue bien los tonos bajos.*

El primero que pasa contra las **tres** superficies es el **55 %: `#9A76A4`** — **3,82 / 3,46 / 3,53**, contra **3,68 / 3,33 / 3,41** del gris que reemplaza. **La orden no costó accesibilidad: la mejoró.**

⚠️ **Y su par oscuro destapó un defecto viejo:** `campoBordeD` publica *«3,40 sobre tapizDark»* y **contra el interior real del campo da 2,68** — por debajo del piso. *Un número correcto contra la superficie equivocada.* El nuevo se mide donde el borde se apoya: **4,17**.

**Medido en pantalla:** el borde del campo de login lee **(160,127,170)**. **Captura:** `capturas-s116-b/campo-borde-ciruela.png`.

---

## ⑦ EL ISOTIPO DE LOS PAPELES (`D-1107`) — la ficha describía mal el problema

🔴 **El path de `_shared/papel.ts` y el de `brand/Isotipo.tsx` son IDÉNTICOS BYTE A BYTE.**

⇒ **no es que el papel se haya quedado atrás: la pieza vector de esta casa también era la vieja.** El isotipo nuevo sólo existía como PNG. *El papel no copió mal — copió bien de una fuente que ya estaba vencida.* Quien cure sólo el papel deja la pieza de `packages/ui` dibujando el isotipo viejo en cualquier consumidor futuro.

**Dónde quedaron los dos:**

| qué | dónde | para qué |
|---|---|---|
| **el vector** | `packages/ui/src/brand/isotipo-v5-path.ts`, exportado desde `packages/ui` como `ISOTIPO_V5_PATH` · `ISOTIPO_V5_VB_W/H` · `ISOTIPO_V5_CAJA` | los ocho papeles. **Se exportan constantes y no una pieza: el consumidor es una edge de Deno que dibuja un PDF, no React** |
| **el PNG** | `packages/ui/assets/marca/isotipo-correo.png` · **415×264**, fondo transparente (alfa 0-255, 37 % transparente) | el correo |

- **Por qué path y no PNG:** la marca de agua cruza un A4 a 300 dpi ≈ **2000 px**; el PNG mide 415 ⇒ se vería a **~5 aumentos**.
- **Qué es exactamente:** el **path relleno más grande** del SVG (5080 caracteres), aislado **y rasterizado solo para confirmar que se lee**: da la silueta de dos lóbulos. Los otros 267 paths del archivo son migajas del trazado y ninguno aporta forma.
- **Va con su viewBox Y con la caja medida del contenido:** el viewBox es **cuadrado (1254)** y el dibujo ocupa una banda adentro. *Un viewBox no dice dónde está el dibujo: dice cuál es el papel.*
- **415×264 y no 384×264:** el 384×264 lleva el aspecto del isotipo **viejo** (1,456). El nuevo es **1,572** y forzarlo lo habría **distorsionado un 7 %**. El founder autorizó *«el equivalente proporcional»*; a la misma altura pedida, es 415.

⚠️ **Lo que falta y no es mío:** cablear las edges a estas constantes. `supabase/functions/` no es territorio de B.

---

## ⑧ UNA CORRECCIÓN A MI PARTE DEL LOTE 5

Declaré que el marco residual del logo claro *«sobre ciruela SÍ se ve»*. **Medido ahora en la pantalla real, a tamaño montado: la diferencia entre el interior de su caja y el ciruela de alrededor es de 1/255.** No se ve. *Lo había juzgado sobre un montaje ampliado, que es otra cosa que mirar la pantalla.*
