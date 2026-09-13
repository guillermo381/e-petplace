# S116-B · LOTE 1 — los tokens del rediseño del cliente

> **Worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-b-01` · rama `pista/s116-b-01` · partí de `main` @ `2f1f82bb2e46666666deba2028babddfb69745a9` (`2f1f82bb`), traído con `git merge --ff-only origin/main` y confirmado con `git merge-base --is-ancestor origin/main HEAD` = 0.**
> **Rehecho de memoria: NADA.** El trabajo no se perdió — lo mudé del árbol principal a este worktree *antes* del aviso, con parche (`git diff`) + copia de los untracked, y se verificó vivo: 37 archivos, los 4 `.ttf`, los 17 assets, `medidas.ts` y la paleta v5. El árbol principal quedó en `main` con `git status --porcelain` en 0.
> **Ocho commits, uno por punto, pusheados cada vez y verificados por SHA** (`git ls-remote` = `git rev-parse`, jamás por código de salida — L-239).
> Medido el **13-sep-2026**.

---

## ⓪ LOS COMMITS

| punto | SHA | qué |
|---|---|---|
| 1 fuentes | `c32cc57b` | Baloo 2 800 + PJS 400/600/700, por `require`, con OFL |
| 2 paleta | `363b0707` | los 16 valores de §2 + 3 degradados |
| 3 temas | `2a015ad6` | los tres isomorfos + noveno slot + 22 guards muertos |
| 4 tipografía | `b713ae7b` | dos familias nuevas + escala por ROL |
| 5 medidas | `e6766102` | `medidas.ts` nuevo + radios/motion/sombras |
| 6 assets | `13837553` | ingesta + inventario + los dos NULL |
| 7 gate | `c0ac4d53` | las 25 reglas, una por una |
| 8 capturas | `6c4dbec4` | tres pantallas en el AVD |

⚠️ **El mensaje del commit 2 quedó en dos líneas y NO lleva su evidencia.** Su `--amend` fue denegado (pedía `--force-with-lease`) y no insistí. **Toda esa evidencia vive en §② de este parte**, que es donde se lee. El commit 1 tampoco lleva la atribución, por el mismo motivo.

---

## ① LO QUE SE VERIFICA — con su comando

```
node scripts/verify-diseno.mjs      → EXIT 0 · VERDE (auto-prueba: 80 reglas encendieron)
npx tsx scripts/verify-contrast.ts  → EXIT 0 · 450 pares · 0 fallo(s)
npx tsc --noEmit -p packages/ui     → EXIT 0 · 0 errores
npx tsc --noEmit -p packages/api    → EXIT 0 · 0 errores
npx tsc --noEmit -p apps/cliente    → EXIT 0 · 0 errores
npx tsc --noEmit -p apps/prestador  → EXIT 0 · 0 errores
```
*El exit se lee del COMANDO, jamás del pipe (L-191). Los cuatro typecheck se corrieron DESPUÉS de instalar `node_modules` en el worktree: sin eso `apps/cliente` daba **903 errores** que no son del código sino de la falta de dependencias — un verde o un rojo desde un worktree sin instalar no mide nada.*

**Los tres temas, isomorfos — y lo prueba el compilador, no una nota.** `FormaDeTema` en `themes/index.ts`. **Rojo producido, dos veces:** borrar `accent.active` de `memorial.ts` da EXIT 2 con 7 errores, uno de ellos en `themes/index.ts:59` (`_formaMemorial`); borrar el grupo `capaBg` de `dark.ts` da EXIT 2 en cada consumidor. El verde vuelve al restaurar.
⚠️ **La primera vez leí sólo los tres primeros errores y concluí que el guard no disparaba. Disparaba, y estaba cuatro líneas más abajo.** *Un `head -3` sobre una salida ordenada por archivo prueba presencia, jamás ausencia.*

---

## ② LAS CORRECCIONES DEL OBJETO A LA ORDEN

**Ninguna es una opinión: las tres se midieron antes de borrar nada.**

| la orden decía | el objeto dice | comando |
|---|---|---|
| «el papel algodón muere» | `palette.light0` tiene **37 lectores** en código de producto, casi todos del **prestador**, donde no es el fondo sino el papel que va **sobre su muro teal**. **Muere su ROL de fondo del cliente, no su valor.** | `grep -rn "palette\.light0" packages/ui/src apps \| grep -v TokenGallery \| grep -vE ":\s*(//\|\*)"` |
| «`controlLleno` y `sobreControlLleno` mueren: nadie los lee» | **3 lectores**: `SelectorOpcion:283` y `:408` (el entity chip que el founder firmó en S73) y `EncuadreFoto:297` | `grep -rn "controlLleno" packages/ui/src apps` |
| «DM Sans sale» | **no puede**: el prestador la consume — **64 ocurrencias en 26 archivos** — más **130 en 58 piezas compartidas** de `packages/ui`. La letra §5 dice que el prestador no cambia. | `grep -rn "family\.sans\|family\.mono" apps/prestador/src` |

🔴 **Por qué el lote 0 midió `controlLleno` en CERO, que es la parte enseñable:** su censo buscaba `theme\.\w+\.\w+` y la forma real es `'controlLleno' in theme.accent` + un cast. **Es el ciego exacto que advierte la cabecera de `verify-diseno`**: *«un censo por patrón acota, no cierra … ¿qué FORMA de lo que busco no matchea esto?»*. Si hubiera obedecido al pie, habría roto el entity chip del selector de mascota.

### Y un error PROPIO, del mismo tipo

**El gris cálido del memorial lo calculé a ojo: escribí `#EFEAEC` y la cuenta da `#EBE5E9`** — cuatro puntos por canal. Queda escrito en `palette.ts`, no corregido en silencio: *un hex plausible al lado de una nota que dice «tinta al 6 %» se lee como calculado, y nadie lo re-mide.*

---

## ③ EL CHOQUE MEDIDO CON LA LETRA — el contraste no se afloja

**El rango de §2 «texto secundario tinta 50–58 %» NO alcanza AA en ningún fondo del tema.**

| alpha | lienzo | blanco | rosa tinte |
|---|---|---|---|
| .50 | 3.20 | 3.28 | 3.13 |
| **.58** (tope de la letra) | **4.05** | **4.18** | **3.94** |
| .63 (el primero que pasa) | 4.73 | 4.91 | 4.58 |
| **.65 (firmado acá)** | **5.04** | **5.24** | **4.87** |

Piso AA = 4.5. **R12 lo tumbó con SIETE pares** (tres del cliente y cuatro que el prestador hereda). El plan §2 es explícito: *«contraste WCAG AA de todo texto — se re-mide, no se afloja»*.
**Se firma .65 y no .63** porque a .63 el rosa tinte queda con margen 0.08, y esta casa ya pagó la lección de que *un par que se decide por el redondeo no es un par decidido* (S100d, el magenta de la serie).

### Las otras cuatro curas que el gate obligó

- **`coralDarkTexto` `#B93333` → `#A8332B`.** Sobre el lienzo daba **4.49**, a una centésima del piso. No es un color nuevo: es el mismo token cumpliendo su contrato con el fondo cambiado — su cabecera ya narra un ajuste igual en S82-B r5.
- **`light.accent.primary` → `magentaTinta`.** Es **la regla de dos registros (Ley 2)** aplicada al magenta: el puro daba **4.27** sobre el tinte y `magentaTinta` da **7.44**. La letra §2 lo define literalmente para eso: *«magenta tinta — magenta sobre claro donde hay TEXTO»*.
- **`memorial.accent.warm` → `terracottaDark`.** Memorial pasó a CLARO y su familia `warm` había quedado con registro oscuro: `cream` sobre lienzo daba **1.02**.
- **`violetText` `#AE59FF` → `#BE79FF`.** Su propia nota decía *«aclarado MÍNIMO para AA»*, o sea calibrado al límite contra el `bg.card` viejo; con la ciruela de v5 daba **4.28**. *Un token que promete AA y deja de darlo no es «el tema sin calibrar»: es un token que dejó de cumplir lo que su nombre dice.*

**Y un crash del verificador, curado:** mis alphas de `dark` lo rompían con `Error: Fondo con alpha sin superficie`. Precomputados sobre `ciruelaNoche` — la lección Kaxo que `palette.ts` ya tenía escrita.

---

## ④ LAS 25 REGLAS, UNA POR UNA

**Ninguna se apagó.**

### Recalibradas (6)

| regla | qué cambió |
|---|---|
| **R12** | baseline **6 → 1**. **Cinco bajaron** y salen por solo-baja: las dos del oro sobre el tapiz murieron con el oro como CTA (§1.3) y las tres de `capaText`/`controlLleno`/`bg.elevated` con el colapso de las capas. *No se curaron de a una: dejaron de existir.* La que queda es del tema **oscuro**, que §5 deja sin calibrar. |
| **R15** | los **10 pendientes** que esperaban arbitraje desde S82-B r6 **bajaron solos** (`10 BAJARON`); la lista se vacía. Nacen **3 exentos** por §2, que firma `#14584A` como verde al día — y ese hex **está** en la familia excluida, a **6.6°**. ⚠️ **La razón de A5 sigue siendo verdadera** (a **5.6°** del teal del prestador): lo que cambió es que la letra nueva decide pagar esa colisión para el rol de ESTADO. Se dice cuál letra pierde. |
| **R39** | el tope pasa de **3 a 4** (§1.4, textual) y el baseline de **6 → 0**. |
| **R43** | 🔴 **medía contra un fondo que ya no existe**: `papelTapiz` en claro y `memorialDark0` en memorial. **Daba VERDE con 3.41/3.34 sobre un par que el producto no monta.** Con los fondos reales: light **3.33** · memorial **3.33** · dark **6.08**. El umbral 3:1 es de N11 y no se toca. |
| **R36 · R37** | sus baselines se re-miden contra la escala nueva (`medidas.ts` + 5 radios por rol). Miden FORMA y sobreviven; lo que se movió son sus números. |

### Sin cambio (19) — verificado en la corrida, no supuesto

`R14` (32<56) · `R16` (el papel sigue COMPARTIDO) · `R17` (213/203/10) · `R20` (0 fills) · `R25` (0 patas) · `R27` (sostenida por el noveno slot) · `R30` (0 glifos, 99 paths) · `R32` (2) · `R33` (2) · `R38` (5/5) · `R47` (39) · `R48` (3/5) · `R51` (4) · `R56` (0 — el oro ya estaba en 0) · `R58` (8 miembros, 0 de acento) · `R62` (1) · `R65` (56×32) · `R70` (6 paths, 22 usos) · `R72` (5 etapas).

### 🔴 La auto-prueba de L-192 cazó algo mío en la misma corrida

Al subir el tope de R39 de 3 a 4, **su fixture dejó de producir rojo**: `AUTO-PRUEBA ✗ R39 no salió roja contra su fixture — REGLA DECORATIVA`. El fixture generaba pantallas con cuatro tamaños, que con el tope nuevo ya no exceden.
⇒ **El fixture de una regla con presupuesto es función del presupuesto; si no sube con él, la regla queda viva y ciega.** Se le agregó el quinto tamaño.

---

## ⑤ LOS 22 GUARDS QUE LA ISOMORFÍA DEJÓ MUERTOS

Al ganar memorial sus 12 slots, las ramas de fallback **dejaron de poder ocurrir** y `tsc` las marcó `never`. Es el mecanismo **inverso** al que `SelectorEspecie` documentó en su cabecera. Se quitan (Ley 37).
De **62** guards `'X' in theme` del repo se tocaron **sólo los 22 que rompían la compilación**; los otros 40 quedan como booleanos siempre ciertos y su limpieza es del lote 2.

🔴 **Dos de ellos no eran fallbacks de color: eran un PROXY de «¿es memorial?».** En `SelectorOpcion`, *«no tiene `capaBg`»* se usaba para preguntar por el tema, y funcionaba mientras memorial fuera el único sin ese slot. Con los tres isomorfos el proxy queda **siempre falso**, y **el chip solitario seleccionado habría perdido su borde sereno en memorial sin que nada fallara.** Ahora preguntan por `theme.mode`.

**3 de los tocados son de `apps/` (territorio de C)** — `hogar/index.tsx` y los dos `avisos.tsx`. Son consecuencia mecánica: sin ellos no compila ninguna app. Declarado.

---

## ⑥ ASSETS — inventario, y los dos NULL

Inventario completo en `packages/ui/assets/INVENTARIO-MARCA.md`. **La carpeta no estaba en el escritorio sino en `~/Downloads`, y se llama «Catlog», no «catalog».** 18 archivos, todos los PNG de 2090×2090.

**El mapa se confirmó contra el objeto, con una corrección a favor:** la variante **sin wordmark ya existe** para gato (2), perro (4), conejo (6) y hámster (9). **Las dos variantes por especie difieren en el wordmark y nada más.** El par 10/11 difiere además en el fondo.

**NULL ① · la cara del AVE sin wordmark no se puede extraer.**
- *Por estructura:* `10.svg` tiene **0 grupos, 0 ids, 0 `clipPath`, 0 `<text>`** — una lista plana de **1.289 `<path>`**. **No hay grupo del texto que separar.**
- *Por geometría:* el único hueco horizontal está al **93,8 %** y separa el wordmark de su bajada, no la cara del texto. **Las patas del ave se apoyan sobre la caja.**
⇒ ingerida como `ave-CON-wordmark`, nombrada por lo que es. **La cara limpia la tiene que dar el founder.**

**NULL ② · sólo 8 de los 18 «SVG» son vectores.** Los otros **10 son un PNG en base64 envuelto en `<svg>`**. ⇒ **gato, perro y conejo no existen en vector.** Sólo se ingiere `.svg` donde de verdad lo hay.

**Otros hechos:** `7.svg` y `8.svg` son **byte-idénticos** (mismo sha256) y sus PNG difieren 0,29 % — son el mismo hámster. **`9.png` tiene fondo BLANCO OPACO**: sobre el lienzo rosa se va a ver como un recuadro; **se ingiere tal cual y se declara**, porque quitarle el fondo es decisión del founder.

**Peso:** 9 piezas + el sexto personaje = **1,27 MB** (los originales pesan 9,0 MB). 16/17/18 → `docs/marca/`.

### El ícono de la app — probado, con captura

`docs/loop/capturas-s116-b-lote1/icono-app-{48,24}px-cuatro-vias.png`

🔴 **La silueta blanca de `14` sale RECTÁNGULO**: su placa negra es opaca, así que la silueta toma la placa y no la nariz. Con el negro removido (color plano, no redibujo) se puede juzgar:

| | 48 px | 24 px |
|---|---|---|
| **silueta blanca** | se lee la forma, **pierde los remolinos** | ✗ **no se lee**: mancha |
| **a color con contorno blanco** | ✓ nítida | ✓ se distinguen lóbulos y remolinos |

⇒ **Respuesta medida: en silueta blanca NO se lee a 24 px.** Lo que se lee en los dos tamaños es la nariz **a color con su contorno blanco**. La elección es del founder.

---

## ⑦ LAS CAPTURAS

`docs/loop/capturas-s116-b-lote1/piel-nueva-sobre-estructura-vieja.png`

**Emulador propio** (`Pixel_10_Pro_XL`, puerto 5566, `adb -s` siempre — había otro corriendo que no es mío). **Metro propio** en 8090 desde este worktree.
**La línea `Bundled`, fechada:** `Android Bundled 6778ms node_modules/expo-router/entry.js (3071 modules)`, **12:21:56 del 13-sep-2026**, con `Starting project at .../e-petplace-s116-b-01/apps/cliente`. *Sin esa línea la captura no prueba de qué árbol es: `expo start` con el puerto ocupado saltea el dev server **sin fallar**.*
**Binario confirmado antes de capturar** (L-138): `com.epetplace.cliente` **1.0.7**.

**Tres pantallas: Hogar · expediente de la mascota · «Confirmar y pagar».** NO se tocó «Pagar»: capturar no es cobrar.

**El id del update es NULL y el pie lo dice: `metro · dev`.** No hay `updateId` porque esto corre contra Metro y no contra un OTA — que es lo correcto para verificar **mi** árbol; un OTA probaría el árbol de quien publicó. *El marcador de L-160 está haciendo lo que promete: declarar que no hay update en vez de inventar uno.*

---

## ⑧ LO QUE NO ALCANCÉ / LO QUE QUEDA ABIERTO

1. **Nadie miró esto en un teléfono real.** Las capturas son de emulador. Ninguna afirmación de este parte dice cómo se **siente**.
2. **El tema OSCURO no está calibrado, por letra** (§5). Sus valores son derivados por regla mecánica. **`verify:contrast` los mide igual**, así que sus números van a aparecer en la salida: **son la medición de un tema sin calibrar, y eso no es un tema aprobado.** Su único par en baseline (`dark·superficie·bg.card/bg.base` = 1.15) espera el lote de oscuro.
3. **Los 40 guards `'X' in theme` restantes** quedan como booleanos siempre ciertos. No rompen; su limpieza es del lote 2, al rediseñar cada pieza.
4. **DM Sans sigue viva** y su disparo quedó escrito en `fonts.ts`: sale cuando el prestador tenga su letra, o cuando el último lector del cliente migre.
5. **El mensaje del commit 2 quedó sin su evidencia** (§⓪). La evidencia está acá.
6. **No corrí `expo export`** para ver el manifest con las cuatro fuentes nuevas. El lote 0 midió el mecanismo (una fuente por `useFonts` entra al manifest); **yo no re-medí el manifest con estas cuatro.**
7. **Las piezas no se tocaron.** Este lote es de tokens: ninguna pieza se rediseñó contra el mock. Lo que se ve en las capturas es estructura vieja con piel nueva, que es lo que el plan §1 pide.
8. **El hook de pre-commit evalúa los backticks del mensaje** — el primer intento del commit 2 murió con `line 558: un: command not found` sin crear el commit. Aislado con un mensaje simple. **Desde acá, mensajes sin backticks.**
9. **`verify:razon-muda` está en 140 contra un baseline de 139** y frena todo commit que toque `apps/`. **Medido que no es mío**: da 140 con y sin mis cambios, salidas idénticas, y todos sus casos viven en `apps/prestador/ventas`. Es arrastre de **D-1086** y se declaró con la fórmula que el propio gate indica.
