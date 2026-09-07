# S113 · pista B — parte de cierre

**Rama:** `pista/s113-b-inventario` · **SHA `88e1ac73`** ·
verificado contra origin con `git ls-remote` (local = origin) · **árbol limpio**.

🔴 **UNA SOLA RAMA PARA MERGEAR, NO OCHO.** La cadena es lineal y la punta las
contiene a todas, verificado con `git merge-base --is-ancestor`:
`2.2` → `2.2.1` → `2.2.2` → `2.2.3` → `2.2.4` → `3.0` → `3.1` → `inventario`.
*Mergear `88e1ac73` trae la sesión entera.*

---

## 1 · QUÉ CONSTRUÍ

**Piezas nuevas (10):** `TarjetaMetrica` · `TarjetaHoy` · `FilaAcciones` ·
`TarjetaConociendolo` · `DetallePeso` · `HeroMascota` · `HuellaDelVinculo` ·
`PantallaDocumentos` · `FichaPapel` · `HojaTraerPapeles` · `ActivarPlaca`
(+ contratos puros `tablero-metrica.ts` y `papeles-boveda.ts`).

**Ensanches (5):** `ResultadosBusqueda`+`nexo-busqueda` (tipos `mascotas` y
`papeles`) · `FilaAcciones` de slots a lista · `TarjetaMetrica` con `glifo` y
`ancho` · `LineaDeVidaItem.voz_titulo` · `SelectorOpcion` `'fila'` envuelve ·
`FranjaSeguridad` a una línea · `respiroDelOrbe()` · `TextoColor` gana `'warm'` ·
`fechaCortaHumana()` en el riel.

**Glifos (3):** `pasaporte` (**gate cerrado**) · `papel` (**gate cerrado**) ·
`lupa` (**🔴 GATE PENDIENTE**).

**Gates (3 nuevos + 3 ampliados):** `verify:tablero` **120/0** ·
`verify:boveda` **42/0** · `verify:sin-montar` (nuevo) · y secciones nuevas en
`glifos` **62/0**, `nexo` **71/0**, `vida` **45/0**.
**Los seis tienen su línea en `package.json` y corren verdes.**

**Documentos:** dirección del Hogar (con su auditoría) · traspaso a C de las
cuatro de pantalla · inventario del DS · propuestas Ley 37 y hex · nota a A.

---

## 2 · QUÉ MEDÍ — cada número con su denominador y su objeto

Salvo indicación, medido sobre **`cb3e34c9`** (7-sep-2026).

| medición | número | contra qué |
|---|---|---|
| piezas dibujables | **171** | `ls packages/ui/src/components/*.tsx \| grep -v '\.web\.tsx'` = 172, − `capturaFoto` (infra) |
| con consumidor en apps | **133 de 171** | los `.tsx`/`.ts` de `apps/cliente` y `apps/prestador` |
| sin consumidor | **16** · 13 en gracia · **3 vencidas (7+ d)** | `verify:sin-montar` |
| **el lenguaje del tablero** | **0 de 195 pantallas** | marcador = las piezas que sólo existen en él |
| lenguaje «capas» | 5 de 195 | `capaBg\|theme.capa[` |
| lenguaje «marca/gradiente» | 1 de 195 | `HeroMarca\|techoVivo` |
| pantallas con 2+ lenguajes | **1** (el Hogar) | idem |
| colores aplicados a mano | **0** | hex literal en `color\|backgroundColor\|borderColor\|stroke\|fill`, fuera de `tokens/`+`themes/` |
| hex en **comentarios** | **45 en 22 archivos** | idem, contando prosa |
| …de ésos, cotejables (nombre+hex) | **7** | comentario que cita token y valor |
| `size.control` / `size.metrica` | **2 / 1** consumidores | contra 187 de la escala de prosa |
| el techo del Hogar | **1171 px de 2992 = 39 %** (390 dp) | captura `07-hogar-antes-arriba.png` |
| el 4.º retrato de la tira | **37 % visible** | paso 258 px, retrato 234, quedan ~87 |
| la píldora de «Ponte al día» | **`#DCFBF9`** | barrido sobre la placa del glifo |
| franja en memorial | **1,25 → 13,39 : 1** | píxeles, antes y después |
| sparkline al angostar | **274 → 211 px** | 480 → 560 dpi |
| glifo `papel` / `lupa` | 53,0 (+14 %) / 44,8 (−4 %) | vara `vacuna` = 46,4 · banda ±15 % |

---

## 3 · QUÉ **NO** MEDÍ — declarado, no omitido

· 🔴 **Ninguna pieza de la fase 3 se probó contra datos reales.** Bóveda, placa
  y búsqueda se ejercieron **con fixtures**: la puerta de A
  (`papeles_familia`/`papel_valor`) **no estaba en `origin/main`** al escribirlas
  — medido. **Hay que cotejar nombres cuando aterrice.**
· 🔴 **El lote del pasaporte (1.3) NUNCA vio el emulador.** Declarado desde
  entonces y sigue sin verse.
· **B4 no se ejerció contra `buscar_en_mi_familia` real**: el ensanche es de
  tipos y glifos, no de datos.
· **`respiroDelOrbe` es un número, no una captura**: nadie verificó en pantalla
  que 76/110 px alcancen.
· **El orden del Hogar no se probó**: está firmado, no montado.
· El `verify:diseno` de mi última rama corre verde, pero **no re-corrí los
  gates de otras pistas** sobre mi punta.

---

## 4 · LO QUE QUEDA ABIERTO — **con dueño por PISTA**

### Pista C
1. 🔴 **Montar lo entregado.** 13 piezas terminadas sin pantalla (`verify:sin-montar`
   las cuenta). Incluye la fase 3 entera y el tablero.
2. 🔴 **Las 3 vencidas: decir si fueron descarte.** `CierreEnCurso` (14 d) ·
   `HiloDelDia` y `SelectorRoster` (10 d). **Su pantalla existe y ninguna las
   nombra** — 15 de paseo, 17 de guardería, cero menciones. *Si su pantalla
   resolvió de otra forma, se jubilan con lápida; si fue desconocimiento, se
   montan.* **No las jubilo yo: la respuesta es de C.**
3. Las cuatro del Hogar (`S113-B-A-C-HOGAR-LAS-CUATRO.md`), **con medición** —
   ⏸️ **paradas hasta el rediseño de S116/117**, por firma del founder.
4. `documentos` confirmado y `lupa` disponible: `<Icono nombre="lupa" tamano={21}
   registro="tinta" montaje="control" />`.

### Pista A
5. **Merge: una sola rama, `88e1ac73`.**
6. ✅ **CERRADO — el contador del canon.** *A ya lo resolvió y llegó más lejos
   que mi aviso: encontró **cuatro números conviviendo** (81 · 53 · 41 · 39)
   donde yo medí uno.* La nota queda como registro, **no como pedido**.

### Pista A o E (necesita la DB, yo no puedo)
7. 🔴 **El assert «tipos-vivos-vs-diccionario», mandado desde S72.** El canon lo
   pasó de candidato a mandato tras ver **dos** «Momento de cuidado» genéricos.
   **Hoy el founder vio TRES.** Sigue sin instrumento.

### Pista B (quien retome)
8. 🔴 **Gate por ícono de `lupa`, pendiente.** Riesgo declarado: sin el mango es
   un círculo más. Hoja montada a 21/44 contra los tres círculos + la vara.
9. **Las excepciones de un consumidor** (`size.control` 2 · `size.metrica` 1 ·
   `motion.coach` 2): **anotadas y sin tocar, se deciden con el rediseño.**
10. Las dos curas del decaimiento de comentarios (`S113-B-PROPUESTAS-LEY37-Y-HEX.md`):
    (a) citar el token, (b) el gate cotejador. **Propuestas, no ejecutadas.**

### Nativo
**Nada mío.** Todo lo de esta sesión es JS/TSX y va por OTA. ⚠️ **Una nota para
`S113-NFC-BUILD.md`, que hoy no la tiene:** `HojaTraerPapeles` recibe `onArchivo`
como callback, así que **el selector de PDF que lo alimenta es nativo y es de C** —
el founder ya lo nombró en la lista de la build.

---

## 5 · LO QUE APRENDIÓ LA CASA — leyes con su caso medido

1. 🔴 **Una dirección escrita mirando una captura acierta el SÍNTOMA y falla la
   CAUSA.** *La pantalla no muestra ni lo que está firmado ni lo que el código ya
   sabe.* **Medido: 4 de mis 11 decisiones sobre el Hogar se retiraron** — tres
   por chocar contra letra firmada (`PieRevelar` S71 · el anillo de `CitaEnVivo`
   S43-B3.5 · la pata de `MarcaElegido`/R22) y una por el código (el dato
   «huérfano» estaba dentro de `mascotas.map`). **Corolario: la auditoría contra
   fuentes va ANTES de que la mesa firme, no después.**
2. 🔴 **Un archivo que nombra a todo no distingue nada.** `verify:sin-montar`
   contaba el barril `index.ts` como consumidor y **dio 0 cuando la verdad era
   18**. Lo cazó compararlo contra un número ya conocido — *sin esa verdad
   previa, el 0 se habría leído como salud.*
3. 🔴 **La aritmética antes de dibujar, y dos formas resultaron
   INCONSTRUIBLES:** el QR de tres esquinas (masa exige `s ≤ 4,45`, Ley 9 exige
   `s ≥ 4,76` — **intervalo vacío**) y la lupa del tamaño de su familia (**+25 %**
   con mango). *No es calibración: la forma no admite las dos leyes a la vez*
   (`L-283`) — y se supo con una cuenta, no con tres intentos.
4. 🔴 **Un guard que reconoce una sola forma de escribir lo mismo protege del
   descuido y no del apuro.** Mi guard buscaba `nombre="pasaporte"` y **yo mismo
   lo atravesé con un ternario**; el defecto lo mostró el emulador, no él.
5. 🔴 **Un token en PAR se usa entero.** `bg.warm` sin `text.warm` dejó la franja
   en **1,25:1** en memorial y **15,66** en claro — *en dos de los tres temas se
   ve perfecto, que es por qué ningún ojo lo caza.* Y `verify:contrast` estaba
   verde **con razón**: *un gate de pares no puede ver qué token PINTA una pieza.*
6. **Las pistas no se escriben entre sí.** Mandé un mensaje ruteando por la letra
   del nombre de sesión y **contestó otra pista**. *El doc llegó; el mensaje no.*

**Fichas:** ninguna abierta ni cerrada. Cité `D-1015`, `L-175`, `L-283`,
`L-318`, `L-459`, `R17`, `R22`, `R35`, `R37`, `Ley 3`, `Ley 12`, `Ley 37`,
`19.7`, `19.9`, `§6b`, `MODELO_LOYALTY §3` y `§7.1`.

---

## 6 · LO QUE BORRÉ, Y LO QUE DEJÉ A PROPÓSITO

**Borrado:** las sondas de captura (7, una por lote — verificado
`git status --porcelain apps/` en cero cada vez) · **7 copias de `.env.local`**
que yo mismo había repartido en mis worktrees para poder medir · Metro y los
`reverse` de mi puerto (**8092, el propio**) · el emulador.

**Dejado a propósito:** los **9 worktrees** (todos limpios y contenidos en la
punta; podarlos al cierre es más riesgoso que dejarlos, y es de A) · los
`.expo/types` regenerados (generados, no versionados) · el andamio de la
galería de `lupa`, **porque su gate no cerró** — el de `pasaporte` y el de
`papel` sí murieron con su firma.

⚠️ **Y lo que vi y NO toqué porque no es mío:** quedan `.env.local` en cuatro
worktrees de C y de E.
