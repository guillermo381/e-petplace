# S97+-B · VOLCADO DE CIERRE — packages/ui, los tokens, el lint y los jueces

**Fecha:** 14-ago-2026 · **Territorio:** `packages/ui` · tokens · el lint y
los jueces · **Norte:** la mesa del 13-ago.

> **El teléfono no fue mío.** Nada de lo de abajo tiene gate en
> dispositivo, y §6 explica por qué eso importa más de lo habitual en esta
> tanda: **los cinco instrumentos dieron VERDE sobre NUEVE defectos
> reales.**

---

## §1 · LO ENTREGADO

**El juez** — R35 curado + tercer guard estructural + **cinco reglas
nuevas** (R36 ritmo · R37 radios · R38 separadores · R39 escala · R40
placeholder). Auto-prueba: **26 → 32 reglas**.

**Las piezas** — `Destape` (la ceremonia del wizard) · `Baldosa` (lo que
se elige) · `BarraTabs` con el destino central · el glifo `atender` (la
puerta abierta) · `Celda` con su reparto curado · `Entrada` respetando
reduce-motion.

**Los tokens** — N1 ejecutada (la escala se movió: `sm` 14 · `base` 16 ·
`md` 20) · N10 tokenizado (`micro|estandar|grande`) ·
`opacity.luzDeEsquina` · `motion.duration.overshootTab`.

**LA SEGUNDA MITAD DE LA JORNADA — ocho commits más, y casi todos son
defectos propios encontrados por otros:** el ritual del `Destape` a
**~3000 ms** (firma en dispositivo) · **D-801** (la luz al 100 % con el
token del 7 % puesto sin hacer nada) · el `overflow` de `Celda`
**retirado** por adjudicación · **`Entrada` deja las layout animations**
(colapsaba a altura 0 **cualquier** grilla) · **`Baldosa`**: el título a
`cuerpo` (+ un `role="header"` que mentía), la raíz declarando sus **dos**
dimensiones (**D-804**), y el patrón de grilla en **dos vueltas**
(**D-805**).

---

## §2 · EL HALLAZGO DEL JUEZ, Y ES DEFECTO PROPIO

**`R35` corría sin estar en `REGLAS`.** La escribí yo en S96-B así, y
sobrevivió dos sesiones. Los TRES guards estructurales iteran `REGLAS` ⇒
era **invisible para los tres**. Su *«DURA EN 0»* se reportó en S96 y en
S97 leyendo una regla **de la que nadie había comprobado jamás que
supiera decir que no.**

> L-192 en su forma más incómoda: **el guard escrito para impedir que una
> regla escape en silencio tenía él mismo la puerta abierta, porque
> vigilaba EL REGISTRO en vez de vigilar LO QUE CORRE.**

La cura no fue registrar R35: fue el **tercer guard** (`corridas →
REGLAS`). El triángulo *regla · fixture · corrida* solo cierra
recorriéndolo en los dos sentidos.

---

## §3 · LOS CHOQUES CONTRA LETRA FIRMADA — declarados, no resueltos en silencio

1. **El escalón 45 está derogado** (§5.4, enmienda firmada S81 → **120**).
   Viajaba en el contrato de C porque **el header de `Entrada` decía 45
   mientras su constante decía 120**: la pieza se contradecía a sí misma.
2. **«Duración total 520» no era ejecutable**: cinco fases en medio
   segundo son ~104 ms cada una, y **la casa ya había medido ese umbral**
   (390 ms para tres bloques ya era demasiado rápido). Total real ~1620.
3. **N10 se contradice solo**: pide *«UN bezier»* y pide **overshoot** —
   que con esa curva no existe. Se usó `motion.easing.spring`, que ya
   estaba desde v3.1. **El defecto era del Norte**, y la mesa lo adoptó
   como ley mejor.
4. **El peso 700 del título** invertía la regla de voz firmada. La mesa lo
   rechazó: `titulo` sigue en light 300.

---

## §4 · EL ARCO DE `Celda` — SEIS VUELTAS, Y CADA UNA CON SU LECCIÓN

El defecto: el nombre de la mascota truncaba a **`Z…`** —UNA letra— en el
HOY. Lo vio D en dispositivo; **ningún instrumento lo veía.**

| vuelta | qué | la lección |
|---|---|---|
| 1ª | `minWidth` en el sujeto | el `flexShrink` que escribí **era decorativo** |
| 2ª | `minWidth: 0` en la derecha | el default de un ítem flex es `min-width: auto`: **sin eso, `flexShrink` no encoge nada** |
| 3ª | se retira el `overflow` del texto | **el cinturón se comía la elipsis** — `ellipsizeMode` estaba declarado, así que si no hay «…» **no truncó el `Text`** |
| 4ª | el piso **baja** de 128 a 96 | leer el árbol entero: **no caben** (~348 pedidos vs ~340) |
| 5ª | se retira el `overflow` | doctrina correcta, **alcance equivocado** |
| 6ª | vuelve, por adjudicación | **por ALCANCE**: el guard miraba 2 filas, el atributo protege 157 montajes |

**LA ARITMÉTICA QUE ORDENÓ TODO**, y solo apareció al leer el árbol
completo tras cuatro parches:

```
avatar + gaps + padding ....  ~92 px
bloque de texto (piso) .....   96 px
la derecha (glifo + 2 chips)  ~160 px  ← NO comprimible
────────────────────────────────────
pedido ~348   ·   disponible ~340
```

**No caben, y ningún elemento es comprimible de verdad** (una `Insignia`
con texto tiene ancho intrínseco). *Por eso cada vuelta movía el defecto
de lugar en vez de cerrarlo* — truncado → solapamiento → corte mudo →
colisión: **cuatro síntomas de una causa**.

**La cura final no fue de flexbox: fue de ANATOMÍA** (D bajó los chips a
su propia línea). El sujeto pasó de 96 a **189 px**, sin elipsis porque no
hizo falta.

---

## §5 · LO QUE QUEDA ABIERTO, CON DUEÑO

| Qué | Estado | Dueño |
|---|---|---|
| **🔴 El gate en dispositivo de la escala** | **330 sitios cambiaron de tamaño y ningún instrumento lo ve.** El riesgo es de **layout, no de tipo** | founder · **Lote 1** |
| ~~El `overflow` de `Celda`~~ | ☠️ **RETIRADO** por adjudicación de mesa: su condición de muerte se cumplió (guard de D: 28/59 · 23/50 · 5/10 + las 3 del censo, con discovery estructural). Viajó con sus dos declaraciones: **evidencia RN-web** y si Android reparte distinto vuelve **como vendaje fechado, jamás como default** | ✅ cerrado |
| **El peor caso de `veterinaria/consulta`** | Verde **en el estado que existe hoy**: la variante con dos chips no se dibujó en el estado que D pudo montar. *Dato sobre qué cubre el verde, no pendiente de nadie* | — |
| **El glifo `atender` a 21px** | Riesgo declarado (la diagonal puede fundirse con la jamba). **Recambio ya elegido: el vano sin hoja** | founder |
| **El peso del título de `Baldosa`** | `cuerpo` (16). Si falta peso, la salida es **variante nueva con gate** (Ley 11), jamás un `style` inline | founder |
| **2 radios de 9×9** | Los únicos que quedan a firma. *De los «7», 4 eran círculos y 1 es el squircle FIRMADO de S53* | founder |
| **reduce-motion en 59 piezas** | **Solo 4 de 63 lo miran.** Barrerlas es tanda con censo propio | próxima B |
| **`DIRECCION_ARTE` §5.4** | Lista el overshoot como candidata; **la mesa lo firmó el 14-ago**. Hay que enmendar la letra | A (su doc) |
| **`packages/ui/CLAUDE.md`** | Contador 63 → **65** (`Destape`, `Baldosa`); glifos 44 → **45** | próxima B |
| **D-806 · los glifos de especie** | **Dimensionada, NO empezada**: son **6** (perro·gato·conejo·ave·pez·roedor — las activas de F1), no 10; `otro` no lleva glifo. 🔴 **Espera una firma previa**: §1 pide «objeto del oficio + una huella» y acá **la mascota ES el concepto** — un perro con huella adentro es redundante. Es si nace una **segunda categoría de glifo** (el sujeto), y eso lo firma el founder | founder → B |

---

## §6 · LAS LECCIONES — y la primera es la que gobierna

**① NINGÚN INSTRUMENTO ENCONTRÓ NINGUNO DE LOS NUEVE DEFECTOS REALES.**

| defecto | lo vio | los gates decían |
|---|---|---|
| `Z…` en el HOY | **D**, en dispositivo | VERDE |
| el destape «pasó rápido» | **el founder** | VERDE |
| «Adiestramiento» partido | **C**, montándola | VERDE |
| `role="header"` en cada baldosa | **investigando el de C** | VERDE |
| mi galería probando piezas más anchas que la pantalla | **C**, midiendo su instrumento | VERDE |
| el destape a opacidad plena (D-801) | **el founder** («una sombra que no alcanzo a detallar») | VERDE |
| la grilla colapsando a altura 0 | **C**, poniéndole un vecino debajo | VERDE |
| la baldosa a ~800 px (D-804) | **A**, caminando el lote | VERDE |
| mi patrón `48%` que falla en todo teléfono (D-805) | **C**, midiendo antes de copiarlo | VERDE |

*`tsc`, `verify:diseno` y WCAG no ven un truncado, un solapamiento, un
corte mudo ni un rol de a11y mentido.* **El lint protege contra lo que ya
sabemos nombrar; lo que no sabíamos nombrar lo trajo un ojo.**

**② VER TUS COMMITS VIEJOS EN `origin` NO VALIDA EL NUEVO.** Trabajé una
tanda entera creyéndola entregada porque el `fetch` mostró mis commits
**anteriores** en `origin/main`. El último quedó solo local y **lo cazó C**
yendo a mergearlo. Y el cierre lo confirmó en espejo: el `git push` final
imprimió *«Everything up-to-date»* —no movió nada— y **eso el OK del
comando tampoco lo dice; lo dijo el contenido del ref.**

**③ UN VERDE MEDIDO DURANTE UN INSTALL NO ES UN VERDE.** D recreó el
`node_modules` del primario desde su worktree; mi `verify:contrast` falló
en esa ventana y lo esquivé **sin entender por qué**. Los tres gates se
re-corrieron con el árbol estable. (D-769 en concreto.)

**④ TODAS LAS MEDICIONES BIEN, LA PREGUNTA MAL** (L-221) — **cuatro veces
en la jornada, dos de D, dos mías**: el «solapamiento» que era recorte · el
DOM que preguntaba *«¿desborda?»* en vez de *«¿colisiona?»* · mi cálculo de
32 px entre chips **asumiendo sin medir** que el solape era con el vecino ·
y mi `echo "$?"` leyendo el exit de `head` en vez del de `tsc` (**L-191, y
D la cobró el mismo día por su lado**).

**⑤ UNA CURA PUEDE APLICARSE EN SILENCIO.** El `flexShrink: 1` que escribí
**no encogía nada**: el atributo estaba, el typecheck lo aceptaba, y no
movía un píxel. *No era una verificación que fallara en silencio: era una
CURA que se aplicaba en silencio.*

**⑥ UN RECORTE ESCONDE EL SÍNTOMA.** El `overflow` tapó la colisión
durante tres vueltas: se veía un corte y **nadie podía saber que dos
columnas se superponían**. *Un recorte no arregla: pospone, y cobra
intereses en diagnóstico.*

**⑦ LA PROSA DERIVADA DECAE AUNQUE VIVA EN EL MISMO ARCHIVO** — **cinco
veces**: el header de `Entrada` con el 45 · el piso que decía 96
explicando 128 · la lápida del `overflow` que decía «no existe» dos veces
seguidas (una por retiro, otra por reversión) · el header del `Destape`
diciendo «crossfade». **Todas escritas por mí, algunas ese mismo día.**

**⑧ EL ANCHO DE UN INSTRUMENTO DECIDE QUÉ SE PUEDE ENCONTRAR** (de C,
midiendo el suyo): capturó a 420 px porque era el viewport **heredado, no
elegido**. *Tuvo suerte de que fuera angosto* — a 600, mi baldosa pasaba
sus tres fotos. Mi galería tenía el mismo defecto y montaba `Celda` a
ancho de viewport cuando en producción vive a ~340.

**⑨ EL DISEÑO CORRECTO SE PRUEBA CUANDO LA PREMISA CAMBIA.** La
composición de la barra cambió **dos veces** mientras construía (4-o-5 →
3-4-o-5, con ATENDER de tercero de cuatro). **Cero líneas tocadas**,
porque el destaque es **por FORMA y no por coordenada**.

**⑩ UN GUARD QUE GRITA SOBRE UNA GEOMETRÍA FIRMADA ENSEÑA A IGNORARLO**
(de D) — *la única forma de fallar peor que no existir.* Su guard reportó
la pata de selección de E6, firmada en S82.

**⑪ UN VALOR ESCRITO QUE OTRO PISA EN SILENCIO — TRES CASOS.** El
`flexShrink: 1` que no encogía nada (`min-width: auto` lo anulaba) · el
`overflow` que se comía la elipsis del `Text` · el alfa del 7 % de la luz,
**pisado por el estilo animado que se aplica después** (D-801: la luz se
dibujaba al **100 %**). *Los tres pasan typecheck, lint y WCAG sin una
queja.* **Un token puesto no es un token aplicado.**

**⑫ LO QUE DIVERGE ENTRE PLATAFORMAS ES LA GEOMETRÍA DELEGADA** (de A,
corrigiendo mi propia advertencia). Yo decía *«el verde de una plataforma
no viaja a la otra»*; él lo midió con su matiz: **tampoco viaja el rojo**.
El mismo día, web y Android **divergieron** (D-804: 0 vs 800 px) **y
coincidieron** (la fila, limpia en las dos).
> ***La ausencia no tiene comportamiento portable; la declaración sí.***
D-804 deja de ser «Android reparte distinto» y pasa a ser **una pieza que
no declaraba su alto, y cada plataforma resolvió esa ausencia a su
manera**. Convierte «probar en las dos» —que no escala— en **«probar en
las dos lo que no está declarado»**, que es una lista corta.

**⑬ UN PATRÓN DOCUMENTADO SE EJECUTA EN LA PANTALLA DEL QUE LO COPIE.**
D-805: cambié `47%` a `48%` **precisamente porque el 47 era «frágil por
siete píxeles»** — y **no volví a hacer la aritmética que yo mismo había
escrito dos párrafos antes**. A la generalizó: `2·pct·u + gap ≤ u` ⇒ el
48 % exige `u ≥ 400` y **falla en TODO teléfono** (iPhone 430 por 0,08 px).
*Se cambió un margen chico por un margen negativo buscando determinismo, y
se consiguió: determinísticamente envuelve.*
· **La cura no fue un tercer porcentaje**: fue sacar el gap de la cuenta
  (`width: '50%'` con el aire adentro de la celda) — **cierra por
  construcción en cualquier ancho**.
· Y su porqué, de A, va escrito en el patrón porque es lo único que impide
  la tercera vuelta: ***el `gap` no se ve en el porcentaje*** — `48+48=96`
  invita a concluir que sobra 4 %, y el gap se come 16 px que en 380 son
  4,2 %. **Están en unidades distintas y la resta se hace en píxeles.**

**⑭ DOS PATRONES EN EL MISMO ARCHIVO DIVERGEN LA PRIMERA VEZ QUE ALGUIEN
CURA UNO.** D-805 no cerró al primer intento: el header de `Baldosa`
llevaba **su propia copia** del patrón, congelada mientras el pie
evolucionaba 47 → 48 → 50. **El archivo tenía dos patrones ejecutables
contradiciéndose, y el de arriba —el que se lee primero— era el que no
entra en ningún teléfono.** *No se sincronizan dos copias: se deja una.*

**⑮ UN CONTADOR QUE NO DA CERO ES UNA PREGUNTA, NO UN RESIDUO.** Al curar
D-805 mi propio grep devolvió `Baldosa.tsx: 1` y **lo dejé pasar sin
preguntarme cuál era esa ocurrencia**. Era el patrón viejo del header.

**⑯ UNA REGLA RAZONABLE SE VUELVE UN GIGANTE CUANDO LA PIEZA ATA ALTO A
ANCHO** (de C). El `flexGrow: 1` estaba puesto para que *«una baldosa
impar ocupe la fila entera»* — razonable. Con la pieza ya cuadrada, esa
misma regla la vuelve **un cuadrado de pantalla completa**. *Los dos
cambios eran defendibles por separado; juntos fabricaron el defecto.*

**⑰ REVERTIR UNA CURA PROPIA CON UNA RAZÓN DISTINTA NO ES UN IDA Y
VUELTA.** Curé la rama de reduce-motion del `Destape` para que durara lo
mismo que la larga (*«quitar movimiento no es acortar el momento»*) — y
con el ritual firmado en ~3000 ms **la mesa la revirtió a crossfade
corto** con otro argumento: *el ritual es para quien puede disfrutarlo, no
una imposición*. **Mi argumento era correcto contra 1630 y se vuelve falso
contra 3000: no cambió la doctrina, cambió la magnitud.**

**⑱ UN RANGO DECLARADO SIN UN CONSUMIDOR EN SU TOPE ES UNA PROMESA SIN
PROBAR** (de A, sobre el desborde de la tira del `Destape`). El contrato
de la pieza decía **«3 a 5»** y con cinco **no entraba** — pero el defecto
no apareció hasta que C curó la ceremonia para que **compusiera** en vez
de enumerar cuatro tabs a mano (D-819).

> *La cura no introdujo el defecto: hizo ALCANZABLE un caso que el
> contrato decía soportar y que nadie había ejercido.*

⇒ Es distinto de las otras diecisiete: **no era algo que no supiéramos
nombrar** —estaba escrito en la pieza, en su propia primera línea— sino
**una promesa que ningún consumidor había cobrado**. Y su cura tuvo que
ser por construcción (`flexWrap` + centrado) y no por margen, porque **las
etiquetas las pone el consumidor y viajan por el riel de idioma**: un
margen que hoy sobra se lo come una traducción. *Tercer margen rechazado
en el día, después de los 7 px y los 0,8.*

**La pregunta que deja para toda pieza con rango declarado:** ¿existe hoy
un consumidor en el TOPE? Si no, el tope es prosa.

---

## §7 · PARA LA PRÓXIMA B

1. **El gate en dispositivo encabeza.** No es formalidad: §6 ① lo dice con
   cinco casos.
2. **Los contadores de `packages/ui/CLAUDE.md` están viejos** (63→65,
   44→45). Re-medir al tocarlos — ya se atrasaron cinco veces.
3. **La deuda de reduce-motion**: 59 piezas sin censar.
4. **Lo que NO rige:** `DIRECCION_ARTE` §9bis.4 (A1 y A3 siguen
   candidatas). Construir contra ellas es fabricar deuda auditable.

---

**Medido al cierre:** `tsc` ui/cliente/prestador **en 0** · `verify:diseno`
**VERDE, 32 auto-pruebas** · **WCAG 178 / 0** con la escala y el peso
nuevos · `R17` sin pendientes · todo en `origin/main` **verificado por
contenido**.
