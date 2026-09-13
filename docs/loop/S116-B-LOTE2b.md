# S116-B · LOTE 2b — la corrección de mesa sobre las láminas del lote 2

> **Ramas `pista/s116-b-02b` (mergeada a main en `5fa3599b`) y `pista/s116-b-02c` (la corrección del ícono) · worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-b-02` · partí de `main` @ `7dd13513`, que ya trae mi lote 2 mergeado.**
> Medido el **13-sep-2026**. No es lote nuevo: es corrección del 2.

---

## ① EL PUNTO 3 PRIMERO, PORQUE ES UNA MEDICIÓN Y DECIDE DE QUIÉN ES EL TRABAJO

**La orden:** *«medí por qué: qué token consumen los títulos… y a qué familia resuelve hoy. Si el token de la casa no resuelve a Baloo, es tuyo; si las pantallas leen un token propio, lo escribís en el parte y queda para C.»*

### 🔴 Es mío, y la hipótesis obvia era falsa

La sospecha natural era que las pantallas leyeran un token propio. **No.** Leen `Texto`, que es el token de la casa — y **`Texto` nunca migró a la escala v5**:

| variante de `Texto` | resolvía a | familia real |
|---|---|---|
| `titulo` (título de pantalla) | `typography.family.sans.light` | **DMSans_300Light** |
| `seccion` (título de sección) | `typography.family.sans.bold` | **DMSans_700Bold** |
| `cuerpo` · `apoyo` · `enfasis` | `typography.family.sans.*` | **DM Sans** |
| `antetitulo` | `typography.escala.antetitulo` | PJS 700 ✓ *(migrado en el lote 2)* |

**De sus nueve variantes, `antetitulo` era la única que consumía la escala v5.** El token `typography.escala` trae Baloo desde el lote 1, con los números de la letra §2 adentro, **y nadie lo enchufó**. *El rediseño tipográfico no falló: no llegó.*

⚠️ **Y hay un agravante que lo vuelve un defecto y no un pendiente.** La enmienda de la letra §1.4 deja DM Sans viva **como token del PRESTADOR**. ⇒ hasta hoy **los títulos del cliente venían pintados con la fuente de la otra casa**, que es exactamente lo que esa enmienda separaba.

### El CTA es el mismo defecto, un piso más abajo

`Boton` pintaba su etiqueta con `typography.family.sans.medium` = **DM Sans 500**, donde la letra pide **PJS 700 16** (`escala.cta`). **Por eso «Pagar» se ve fino: dos pesos abajo y la familia equivocada.**

### Cómo se cura, y por qué NO nace un slot nuevo

`Texto` y `Boton` los montan **las dos apps**, y la letra §5 deja al prestador sin cambios. Se resuelve por casa con **`accent.formaV5`** — **el mismo slot del lote 2, no uno nuevo.** Su propia nota ya escribió el argumento: *«cinco booleanos de casa que siempre valen lo mismo son un tema paralelo escrito de a poco»*. **La tipografía v5 y la geometría v5 son la misma decisión de la misma letra**; separarlas permitiría un estado —cliente con píldoras y sin Baloo— que ninguna letra describe.

**Memorial no recibe Baloo y salió gratis:** su tema ya resuelve `formaV5` en `false` (§4 apaga la fiesta). *La cifra en Baloo no aparece en memorial porque no hay plata ni peso que celebrar, y eso ya lo decidía el slot.*

**Lo que NO migró, y es decisión medida:** `dato`/`datoMd` (la **Ley 3** sigue: JetBrains Mono para metadata de máquina, y la letra §1.4 no toca la voz del dato) y `voz` (DM Sans 300, *«lo humano a escala de voz»* — **la letra no nombra una variante de voz y cambiarla sería decidir algo que nadie firmó**).

---

## ② EL PUNTO 1 · LA HUELLA — la orden decía doce y el censo dio cuarenta y nueve

| | la orden | el objeto |
|---|--:|--:|
| glifos con huella | **12** | **49** |
| …de ésos, los monta el prestador | — | **24** |
| …con la huella **como dibujo** (queda vacío sin ella) | — | **3** (`negocio` · `datos` · `ia`) |

**Apagarla a secas le habría sacado la huella a la barra del prestador entera** —que la letra §5 deja sin cambios— **y habría borrado tres glifos sin dar error: habría dejado un hueco.**

⇒ **se apaga POR CASA, en `icono-huella.ts`, que es donde vive la regla.** Y eso *es* la letra, no una atenuación: §1.1 dice **«deroga `DIRECCION_ARTE` §1 leyes 1-3 _para el cliente_»**.

### 🔴 El gate nace declarando un hueco de tres sesiones

`icono-huella.ts` se creó en S113-B **«para que su gate pueda importarla sin arrastrar react-native»**. Medido: **cero consumidores de `resolverHuella` fuera de `Icono.tsx`. El gate nunca se escribió.** *La mudanza era correcta y su razón también; lo que faltó fue la mitad que la justificaba — y durante tres sesiones la regla estuvo tan sin gate como antes, pero con una nota diciendo que lo tenía.*

**`pnpm verify:huella-por-casa` — 10/10, con tres sabotajes de rojo DISTINTO:**

| sabotaje | qué falla | por qué importa |
|---|---|---|
| no leer `casaV5` | los dos casos de la casa v5 | la letra no se aplicaría |
| apagarla también en el estructural | los dos casos de `ESTRUCTURAL` | **el hueco silencioso** — `ia` se borra entero y no da error |
| apagarla en las dos casas | los dos casos de `sin v5` | le saca la huella al prestador |

*Tres rojos con el mismo conteo no habrían probado nada: lo que prueba que discrimina es que fallan casos distintos.*

---

## ③ EL TAMAÑO ÓPTICO — medido del píxel, y contradice el ejemplo de la orden

### Primero, un instrumento que se cazó a sí mismo

Mi primer medidor leía las bounding boxes **parseando los paths**, y **no resolvía comandos relativos**: daba `quitar` en **0,0** y `colgar` en **22,3 de ancho estando rotado 135°**. *Números creíbles y falsos.* Se tiró. **La medición buena es del PÍXEL**: rasterizar a 192 px y medir la caja de tinta — incluye el trazo, no depende de parsear nada, y de paso da el peso óptico real.

### 🔴 Lo que la medición dice, y va al revés del ejemplo

La orden dice: *«hoy agregar, quitar, favorito y calificación pesan el doble que hora o salir»*.

| glifo | tinta | caja mayor |
|---|--:|--:|
| `agregar` | **20,5** | 9,9 |
| `quitar` | **10,9** | 9,9 |
| `calificacion` | 33,8 | 9,6 |
| `favorito` | 38,8 | 11,9 |
| `hora` | **46,4** | 11,9 |
| `salir` | 37,7 | 11,2 |

**`hora` tiene 2,3× la tinta de `agregar`.** Los cuatro señalados son de los **más livianos** del set.

**Pero la percepción no está equivocada: la métrica que la explica es la CAJA.** Los cuatro estaban **debajo** de la banda donde vive el resto (11,6–12,9), y **un glifo más chico con el mismo trazo se ve más pesado**, porque el trazo ocupa mayor fracción de su caja. ⇒ **agrandarlos es lo que los hace ver más livianos**, que es la cura contraintuitiva y es la que la orden pide con su otra mitad: *«un solo tamaño óptico para todo el set»*.

**Normalizados 8 glifos** (`agregar` · `quitar` · `mas` · `calificacion` · `medicamento` · `microchip` · `papel` · `colgar`).
**Dispersión: 8,6–14,9 → 10,2–12,9.** El rango se redujo de 6,3 a 2,7.

**Trazo 1,9 → 1,8** en todo el registry, las dos casas. *Un trazo por casa haría que el mismo glifo tenga dos pesos según dónde se monte, que es lo contrario de lo que la orden pide.*

⚠️ **Un hallazgo de paso, que ningún gate veía:** seis glifos dibujaban su punto con `v.01`, y **`.01` no rasteriza** — `mas` medía 8,6 cuando sus tres puntos abarcan 13,4. Se pasaron al molde medido de la casa (`info`, que usa `v.3`). *Si no rasteriza en el renderer de macOS, no hay ninguna razón para creer que rasteriza en Android.*

---

## ④ LOS REDIBUJOS — y tres riesgos que se cobraron en su propia hoja

Siete redibujos (`personalidad` · `ayuda` · `receta` · `microchip` · `seguros` · `alergia` · `alimento`) más la separación `documentos`/`copiar`.

### 🔴 Uno de ellos estaba PREDICHO POR ESCRITO desde S103-B

La entrada de `copiar` declaró su riesgo con su condición de muerte adentro:

> *«los separan DOS cosas: la huella (uno la lleva, el otro no) y que jamás comparten unidad de barrido … **si el founder los ve juntos a 21 px y no los separa, el que se mueve es éste**»*

**La letra §1.1 le sacó la primera de las dos cosas, y la hoja de contacto los puso juntos por primera vez.** *Las dos condiciones que aquella entrada nombró, cumplidas a la vez. El riesgo no apareció: se cobró como estaba escrito, tres sesiones después.*
⇒ `documentos` se queda con el **doblez**; `copiar` con el apilado plano.
⚠️ **Vecino nuevo que esto despierta, declarado: `presupuesto`**, que ya es *«documento con esquina doblada»*. Los separa el conteo (uno con líneas de texto, dos vacías), y eso es más frágil que un doblez.

### Y la hoja cobró dos veces más, en este mismo lote

| glifo | qué mostró | cura |
|---|---|---|
| **`receta`** | el ℞ se leía **como una «R» sola** — la diagonal salía de la pata derecha y **se fundía con ella** | la R se angosta y **una segunda barra la CRUZA**. *Dos trazos que se cruzan sobreviven a la escala; uno que continúa a otro, no.* |
| **`personalidad`** | la costura única descentrada se leía **como un círculo TACHADO** — peor que un globo, porque significa algo | **dos arcos que nacen y mueren en el borde**, sin cruzar el centro: la costura de una pelota |

*Quitarle un eje al globo no lo convirtió en pelota: lo convirtió en una prohibición.*

### `papel` NO se retira

La orden decía *«papel se retira si no tiene consumidor»*. **Tiene cuatro:** `historia_clinica` (`apps/cliente/src/lib/papeles.ts:55`), `examenes` e `informes` (`PantallaDocumentos.tsx:59,61`) y `papeles` (`ResultadosBusqueda.tsx:67`). **Se queda.**

---

## ⑤ EL PUNTO 2 · LA SILUETA Y EL ÍCONO

### La silueta es el TERCER dibujo, y los tres quedan escritos

| | qué era | por qué murió |
|:-:|---|---|
| ① | dos lóbulos con hueco (un corazón agujereado) | **medición**: al montarlo contra el isotipo real, el isotipo no es eso |
| ② | el anillo abierto con dos volutas | **firma de la mesa**, no medición — *«solo el corazón-nariz relleno con las dos fosas como hueco»* |
| ③ | el corazón-nariz con las dos fosas | vive |

🔴 **Lo que la ② deja como lección: ser fiel al isotipo era una premisa mía, no una orden.** El isotipo es una composición de dos volutas; **la silueta es la NARIZ, que es de lo que la composición habla.** Que dejen de ser el mismo objeto es deliberado.

**Tres tamaños de fosa probados sobre los DOS fondos reales** (ciruela noche y el gris de la barra de Android). Ganó **2,3 × 3,0**, por el criterio de siempre: **a 24 px es el que más aguanta.**

⚠️ **Riesgo declarado y NO curado: a 24 px las fosas se leen como ojos.** Es consecuencia directa de la firma — *una nariz frontal con dos fosas simétricas ocupa el lugar donde el ojo espera ojos, y cualquier dibujo fiel a esa descripción lo va a hacer.* La salida, si molesta, es **inclinarlas** (el candidato `c`, ya dibujado y medido), no achicarlas.

### El ícono de app — y una medición que corrigió la composición obvia

🔴 **El isotipo NO está centrado en su propio viewBox.** Medido rasterizando y midiendo la caja de tinta: el dibujo ocupa **820 × 522 dentro de 1254 × 1254** —o sea **65 % del ancho y 42 % del alto**— y su centro cae en (650, 611) contra (627, 627).
⇒ **escalar por el viewBox daba un ícono al 43 % real**, chico y corrido hacia abajo. Se escala y centra **sobre la caja del dibujo**. *La zona segura se cumple sobre lo que se VE, no sobre lo que el archivo declara.*

### ✅ ZONA SEGURA = LECTURA (B) — FIRMADA POR LA MESA (lote 2c)

Se midieron las dos y **ganó la que Android significa**:

| | lectura | ancho | diagonal | ¿entra en el círculo del 66 %? |
|:-:|---|--:|--:|:-:|
| A | el LADO del dibujo mide 66 % | 676 (66 %) | **801** | **NO** |
| **B** ✅ | la nariz **CABE ENTERA** en el círculo del 66 % | **570 (56 %)** | **676** | **sí, exacto** |

🔴 **EL CRITERIO NO ES EL LADO: ES LA DIAGONAL CONTRA EL DIÁMETRO** — y es lo único que hay que recordar acá, porque **la lectura equivocada es la que parece obvia**. El dibujo del ilustrador es **ancho** (820 × 522), así que con (A) su diagonal daba 801 contra un diámetro seguro de 676: **se salía de cualquier recorte redondo, y todo lanzador de Android recorta redondo.** *(A) cumplía la letra de la orden y rompía su propósito — una zona segura que no protege no es una zona segura.*

**Compuesto con (B): dibujo 570 × 363, diagonal 676 = exactamente el diámetro seguro.** Verificado con el **recorte circular simulado**, no supuesto (`capturas-s116-b-2b/icono-app.png`): la nariz entra entera a 48 dp real, a 96 y a 192.
*La lámina de las dos lecturas se conserva — es la evidencia de por qué se eligió, y sin ella la decisión se lee como una preferencia.*

---

## ⑥ LO QUE SE VERIFICA

```
npx tsc --noEmit -p packages/ui        → EXIT 0
npx tsc --noEmit -p packages/api       → EXIT 0
npx tsc --noEmit -p apps/cliente       → EXIT 0
npx tsc --noEmit -p apps/prestador     → EXIT 0
node scripts/verify-diseno.mjs         → EXIT 0 · 81 reglas · 0 fallos
npx tsx scripts/verify-contrast.ts     → EXIT 0 · 450 pares · 0 fallos
npx tsx scripts/verify-huella-por-casa.mjs → EXIT 0 · 10/10 · GATE NUEVO
node scripts/verify-reduced-motion.mjs → EXIT 0
```

### Las láminas

| archivo | qué muestra |
|---|---|
| `capturas-s116-b-2b/hoja-de-contacto-2b.png` | **los 20 a 21 y 48 px, SIN huella** — como los va a renderizar la casa v5 |
| `capturas-s116-b-2b/icono-app.png` | el ícono **recortado en círculo**, a 48 dp real y ampliado — como Android lo muestra |
| `capturas-s116-b-2b/icono-app-dos-lecturas.png` | A y B lado a lado — **la evidencia de por qué ganó (B)** |

🔴 **La hoja ahora dibuja el set SIN huella, y eso es una corrección del instrumento, no una opción.** *Una hoja de contacto que pinta huellas que el cliente no va a ver no es una hoja de contacto: es un dibujo del registry.* Sin el flag las sigue pintando, que es lo correcto para juzgar los glifos del **prestador**.

---

## ⑦ LO QUE NO ALCANCÉ

| | por qué |
|---|---|
| **Capturas de las cuatro pantallas con el token nuevo** | 🔴 **NO SON MÍAS — las produce C en su lote** (firma de la mesa). El cambio de Baloo toca toda pantalla del cliente, y **quien monta las pantallas es otra mano**: una captura la toma quien compone la pantalla, no quien cambió el token que la pinta. *Lo que entrego yo es la medición de qué token consumían y a qué familia resolvían — que es lo que la orden pedía.* **Las del lote 2 NO sirven de reemplazo: muestran el estado viejo.** |
| **El gate por ícono del founder** | la hoja está lista; firmarla no es mío |
| **El vector drawable de la silueta y el cableado del ícono** | tocan `app.config.ts` y `android/` — no es mi territorio |
| **Los ~29 glifos con huella que el prestador NO monta** | siguen dibujándola en su dibujante. **No molesta** —la casa v5 la apaga y el prestador no los monta— pero **es código que no se ejecuta en ninguna casa**, y merece una pasada de limpieza con su censo. No la hice porque no estaba en la orden. |
