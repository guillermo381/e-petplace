# S97+-B · VOLCADO DE CIERRE — packages/ui, los tokens, el lint y los jueces

**Fecha:** 14-ago-2026 · **Territorio:** `packages/ui` · tokens · el lint y
los jueces (criterio, no lista de archivos) · **Norte:** la mesa del 13-ago.

> **El teléfono no fue mío.** Nada de lo de abajo tiene gate en
> dispositivo. Lo que sigue está **medido**, no visto — y el ítem ① de §5
> es exactamente lo que ningún instrumento puede ver.

---

## §1 · LO ENTREGADO — cinco commits, todos en `origin/main`

| Commit | Qué |
|---|---|
| `11ef479b` | **El juez se cura antes de extenderse** — R35 corría sin estar en `REGLAS` + el tercer guard estructural + las cuatro reglas del Norte |
| `dea60fa1` | **`Destape`** — la ceremonia de cierre del wizard (pedido de C) + N10 y la luz de la esquina tokenizadas |
| `55e218ad` | **`BarraTabs` gana el destino central** + nace el glifo `atender` (la puerta abierta) |
| `6e26eda1` | **N1 elevada con números** (después ejecutada) + los `gap: 2` de `ui` a token |
| `b365705f` | **N1 ejecutada por vía A** — la escala se mueve en el token (330 sitios) · el overshoot se firma y su prop muere · las 13 píldoras a `radius.full` |

**Verificado por CONTENIDO** (regla 84 ②), no por el OK del push:
`git show origin/main:packages/ui/src/tokens/typography.ts` →
`sm: 14 · base: 16 · md: 20`.

---

## §2 · EL HALLAZGO DE LA TANDA, Y ES DEFECTO PROPIO

**`R35` corría sin estar en `REGLAS`.** La escribí yo en S96-B así, y
sobrevivió dos sesiones. Los TRES guards estructurales iteran sobre
`REGLAS` ⇒ era **invisible para los tres**: sin fixture, sin auto-prueba.
Su *«DURA EN 0»* se reportó en S96 y otra vez en S97 leyendo una regla
**de la que nadie había comprobado jamás que supiera decir que no.**

> Es L-192 en su forma más incómoda: **el guard escrito para impedir que
> una regla escape en silencio tenía él mismo la puerta abierta, porque
> vigilaba EL REGISTRO en vez de vigilar LO QUE CORRE.**

**La cura no fue registrar R35: fue el TERCER GUARD** (`corridas →
REGLAS`). El triángulo *regla · fixture · corrida* solo se cierra
recorriéndolo en los dos sentidos. **Auto-prueba: 26 → 31 reglas.**

---

## §3 · LOS TRES CHOQUES CONTRA LETRA FIRMADA — declarados, no resueltos en silencio

*(Precedente S63 y la enmienda A4 de §9bis.2: el choque SE DECLARA.)*

### ① EL ESCALÓN 45 ESTÁ DEROGADO — y el error estaba en casa

El contrato de C y el Norte N6 decían *«escalonadas 45/300»*. §5.4
registra la enmienda **FIRMADA en S81**: pasó a **120**
(`motion.stagger.slow`), con su porqué medido — *«con 45, tres bloques
resolvían en ~390 ms y el escalonado no se PERCIBÍA como orden de
lectura»*.

**La causa de que el 45 volviera a viajar no era del contrato: el header
de `Entrada` DECÍA 45 mientras su constante decía 120.** La pieza se
contradecía a sí misma, y lo que se lee es el header. Curado.

> *Un número derogado que sobrevive en una prosa derivada no se queda
> quieto: se propaga al siguiente contrato que lo cite.* (L-141)

### ② «DURACIÓN TOTAL 520» NO ERA EJECUTABLE — y lo dijo un número de la casa

Cinco fases + N tabs en medio segundo son **~104 ms por fase**. Y no fue
opinión: **la casa YA había medido ese umbral** en la misma enmienda S81
(390 ms para TRES bloques ya era demasiado rápido). Si 390/3 no alcanza,
520/5+N tampoco. Total real **~1620 ms**, declarado para que la mesa
firme o corte.

### ③ N10 SE CONTRADICE A SÍ MISMO — y el defecto era del Norte

N10 dice *«UN bezier (.32,.72,0,1)»* y en la misma frase pide
**overshoot**. **Un overshoot con esa curva no hace overshoot** — termina
en 1 y no lo pasa. Se usó `motion.easing.spring` [.34, 1.56, .64, 1], que
**ya existía desde v3.1**: no se inventó una curva.

**La mesa lo adoptó como ley mejor.** El reparto quedó: *el bezier de la
casa gobierna entradas y transiciones; el spring gobierna lo que
confirma.*

---

## §4 · LAS CUATRO REGLAS DEL NORTE — lo que hace posible que C y D corran sin gate por pieza

Ratchet, con **su brazo de ancla probado aparte** y **discriminador
corrido contra el código real** (los cuatro pisos bajados un punto: las
cuatro salieron rojas nombrando archivos reales, coincidiendo con el
censo independiente por grep).

| Regla | Qué mide | Piso |
|---|---|---|
| **R36** | N2 · el espaciado sale del token | 21 |
| **R37** | N4 · una sola escala de radios | 20 → **7** |
| **R38** | N3 · 3 separadores por pantalla | 6 |
| **R39** | N1 · 3 tamaños a mano por pantalla | 6 |

**🔴 R36 NO mide «múltiplo de 8» literal, y es su decisión de diseño:**
mecanizarlo así **pondría en rojo la escala firmada** (`spacing` tiene
4·6·10·12·20·28). Mide que nadie re-decida el ritmo a mano — los números
del Norte YA son tokens (32 = `spacing[8]` · 24 = `spacing[6]` · 16 =
`spacing[4]`). *El múltiplo de 8 gobierna la composición, que es juicio de
gate; el crudo es lo mecanizable.*

**Lo que R37 encontró al medirse, antes de existir: 13 píldoras escritas
`borderRadius: 999` cuando `radius.full` es 9999.** Clampean igual — **por
eso nadie lo vio nunca**. El defecto no era visual: era que la píldora de
la casa dejó de tener un solo dueño. Curadas (cero cambio visual).

**Y los pisos se fijan con el número de LA HERRAMIENTA QUE LOS EXIGE:** el
grep sobre `apps`+`packages` dijo 36/21 y el lint (solo `apps`, despojando
comentarios) dice 21/20. El baseline es el segundo, o el ratchet arrancaría
con margen regalado. Misma historia que R2.

---

## §5 · LO QUE QUEDA ABIERTO, CON DUEÑO

| Qué | Estado | Dueño |
|---|---|---|
| **🔴 El gate en dispositivo de la escala** | **330 sitios cambiaron de tamaño y NINGÚN instrumento lo ve.** El riesgo es de **layout, no de tipo**: `verify:diseno`, `tsc` y WCAG dan **verde con truncados rotos** | founder · **encabeza el Lote 1** |
| **El glifo `atender` a 21px** | Riesgo declarado: la diagonal de la hoja puede fundirse con la jamba. **Recambio YA elegido: el vano sin hoja** — la puerta se conserva en los dos casos | founder · Lote 1 |
| **Los 7 radios fuera de toda escala** | `36` · `5` ×4 (el mismo patrón en los cuatro oficios) · `2` ×2. **Cambian el dibujo** ⇒ gate, no reemplazo | founder + C/D |
| **`SelectorDia:227` → `borderRadius: 22`** | **NO se tocó a propósito.** Llegó verbatim de la lámina FIRMADA de la rueda D3 (S85). *Cambiar la forma de una pieza firmada por prolijidad de lint es lo que esta casa prohíbe.* Visible en el ratchet | mesa |
| **`DIRECCION_ARTE` §5.4** | Lista el overshoot como **candidata sin firma** y la mesa lo FIRMÓ el 14-ago. La letra hay que enmendarla | A (su doc) |
| **`packages/ui/CLAUDE.md`** | Contador 63 → **64** (`Destape`); glifos 44 → **45** (`atender`), re-medidos por las dos vías con el mismo conjunto | próxima B |

---

## §6 · LAS LECCIONES DE MÉTODO — las cuatro que esta tanda deja

**① VER TUS COMMITS VIEJOS EN `origin` NO VALIDA EL NUEVO.** Trabajé una
tanda entera creyendo que estaba entregada porque el `fetch` mostró mis
commits **anteriores** en `origin/main` — puestos ahí por otra mano. El
último quedó **commiteado y solo local**, y lo cazó **C** yendo a
mergearlo, midiendo contra el objeto.

> No fue *«un push que dijo OK sin llegar»* (el caso que el canon ya
> registra): **fue un push que NUNCA OCURRIÓ.** Lo que valida es el
> ancestro del commit que tenés en la mano, jamás la presencia de los
> viejos. Y el cierre lo confirma en espejo: **el `git push` final imprimió
> «Everything up-to-date»** —no movió nada, el founder había llegado
> primero— y *eso el OK del comando tampoco lo dice; lo dijo el contenido
> del ref.*

**② UN VERDE MEDIDO DURANTE UN INSTALL NO ES UN VERDE.** D corrió
`pnpm install` desde su worktree y **recreó el `node_modules` del
primario**, donde yo medía. Mi `verify:contrast` falló en esa ventana con
`runDepsStatusCheck` — lo esquivé corriendo el binario directo **sin
entender por qué**. Cuando D lo declaró, el síntoma tuvo nombre. Los tres
gates se re-corrieron con el árbol estable. *(Caso concreto de D-769:
compartir `node_modules` entre worktrees hace que un install de una pista
sea un acto sobre otra.)*

**③ EL DISEÑO CORRECTO SE PRUEBA CUANDO LA PREMISA CAMBIA.** La
composición de la barra cambió **dos veces** mientras construía (4-o-5 →
3-4-o-5, con ATENDER como **tercero de cuatro** en recepción). **Cero
líneas tocadas**, porque el destaque es **por FORMA y no por coordenada**.
Anclado a la posición, el segundo rebote lo rompía.

**④ UN ROJO AJENO SE AÍSLA ANTES DE DECLARARLO.** El hook falló por
`packages/api` (WIP de A). Se corrieron los dos `tsc` **por separado**
antes de tocar `SALTAR_GATE`, y el motivo se escribió con el error
literal. Al cerrar, se **re-midió**: `api = 0` tras el commit de A ⇒ el
último commit pasó **sin escotilla**.

---

## §7 · PARA LA PRÓXIMA B

1. **Lo primero es el gate en dispositivo de la escala.** No es una
   formalidad: es el único instrumento que puede ver lo que se rompió, y
   los tres que tenemos dan verde igual.
2. **`packages/ui/CLAUDE.md` está desactualizado** — contador de
   componentes y de glifos. Re-medir al tocarlo (L-141, y este contador ya
   se atrasó cinco veces).
3. **Los frenos que siguen vigentes:** `usePresionado` es enmienda con
   gate propio. `BarraTabs/estadoPorHuella` ya no lo es —esta tanda la
   abrió con firma—, pero la prop `acento` **sigue esperando su lámina de
   tres candidatos**, y su condición de muerte está escrita.
4. **Lo que esta tanda NO tocó:** `DIRECCION_ARTE` §9bis.4 (A1 y A3 siguen
   **candidatas y no rigen** — construir contra ellas es fabricar deuda
   auditable).

---

**Medido al cierre:** `tsc` ui/cliente/prestador **en 0** · `verify:diseno`
**VERDE (31 auto-pruebas**, eran 26) · **WCAG 178 / 0** corrido con la
escala y el peso nuevos —el gate que más podía moverse no se movió— ·
`R17` sin pendientes · los cinco commits **en `origin/main`, verificados
por contenido**.
