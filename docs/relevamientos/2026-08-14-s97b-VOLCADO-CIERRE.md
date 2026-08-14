# S97+-B · VOLCADO DE CIERRE — packages/ui, los tokens, el lint y los jueces

**Fecha:** 14-ago-2026 · **Territorio:** `packages/ui` · tokens · el lint y
los jueces · **Norte:** la mesa del 13-ago.

> **El teléfono no fue mío.** Nada de lo de abajo tiene gate en
> dispositivo, y §6 explica por qué eso importa más de lo habitual en esta
> tanda: **los cinco instrumentos dieron VERDE sobre cinco defectos
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
| **El `overflow` de `Celda`** | **ELEVADO, no retirado.** La condición de muerte se cumplió (guard de D: 28/59 · 23/50 · 5/10 + las 3 del censo), pero **la adjudicación de que quedaba fue de la mesa** y solo ella la declara cumplida. Evidencia de **RN-web, no dispositivo** | mesa |
| **El peor caso de `veterinaria/consulta`** | Verde **en el estado que existe hoy**: la variante con dos chips no se dibujó en el estado que D pudo montar. *Dato sobre qué cubre el verde, no pendiente de nadie* | — |
| **El glifo `atender` a 21px** | Riesgo declarado (la diagonal puede fundirse con la jamba). **Recambio ya elegido: el vano sin hoja** | founder |
| **El peso del título de `Baldosa`** | `cuerpo` (16). Si falta peso, la salida es **variante nueva con gate** (Ley 11), jamás un `style` inline | founder |
| **2 radios de 9×9** | Los únicos que quedan a firma. *De los «7», 4 eran círculos y 1 es el squircle FIRMADO de S53* | founder |
| **reduce-motion en 59 piezas** | **Solo 4 de 63 lo miran.** Barrerlas es tanda con censo propio | próxima B |
| **`DIRECCION_ARTE` §5.4** | Lista el overshoot como candidata; **la mesa lo firmó el 14-ago**. Hay que enmendar la letra | A (su doc) |
| **`packages/ui/CLAUDE.md`** | Contador 63 → **65** (`Destape`, `Baldosa`); glifos 44 → **45** | próxima B |

---

## §6 · LAS LECCIONES — y la primera es la que gobierna

**① NINGÚN INSTRUMENTO ENCONTRÓ NINGUNO DE LOS CINCO DEFECTOS REALES.**

| defecto | lo vio | los gates decían |
|---|---|---|
| `Z…` en el HOY | **D**, en dispositivo | VERDE |
| el destape «pasó rápido» | **el founder** | VERDE |
| «Adiestramiento» partido | **C**, montándola | VERDE |
| `role="header"` en cada baldosa | **investigando el de C** | VERDE |
| mi galería probando piezas más anchas que la pantalla | **C**, midiendo su instrumento | VERDE |

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
