# S114-B → C · EL CONTRATO DE MEMORIAL

> **Lo pidió el founder: que C monte contra un contrato y no contra un grep.**
> Todo lo de acá está **medido en este árbol** (`main` @ `e516a089` + mi rama).
> Ningún número es heredado; cada uno lleva cómo se sacó.
>
> ⚠️ **No decide nada de C.** Dice qué señal necesita cada pieza y dónde está
> ese dato hoy. Lo que es DECISIÓN y no dato está marcado como tal.

---

## ① `LineaAlgoSalioDistinto` (B8) — ¿el contrato le sirve a C tal como está?

**Sí, con tres avisos. Dos son baratos y el tercero es una decisión de letra.**

### 🔴 LA LETRA — FIRMA DEL FOUNDER, 7-sep-2026

> ### **EL PEDIDO NUNCA SE APAGA POR MEMORIAL: ES DEL HOGAR, NO DE UNA MASCOTA.**
> **Precedente: `bonos.familia_id`.** *Apagar el reclamo de un pedido porque una
> de las mascotas de la casa falleció le quita a la familia la puerta sobre lo
> que compró para las otras* — y un pedido tiene **N destinos y puede tener
> donación**, así que *«la mascota» en singular no existe ahí*.

**Y la letra vive en el TIPO, no en una nota:**

```ts
sujeto: 'mascota'  →  enMemorial OBLIGATORIA     · la cita · la estadía
sujeto: 'hogar'    →  enMemorial INEXPRESABLE    · el pedido
```

```ts
enMemorial: boolean   // = estado_vida === 'fallecida'
```
🔴 **`perdida` NO cuenta** — firma del founder: *una familia cuyo animal se
perdió sigue pudiendo decir que el paseo salió distinto.*

**Probado en las DOS direcciones, y las dos son errores de compilación:**

| lo que alguien intenta | qué pasa |
|---|---|
| el pedido pasa `enMemorial={false}` | 🔴 **no compila** (`TS2322`) |
| la cita **olvida** `enMemorial` | 🔴 **no compila** (`TS2322`) |

> *Un `false` por decisión y un `false` por comodidad **se ven idénticos en el
> código**, y el segundo es cómo vuelve el guard apagado que la prop vino a
> curar (`L-498`). La única forma de que no vuelva es que no se pueda
> escribir.*

⚠️ **Y el `theme.mode` también cuelga de `sujeto === 'mascota'`.** El tema
memorial es un sustituto de *«esta mascota está en memorial»*, y **un hogar no
tiene mascota**: dejarlo suelto apagaría el pedido por una vía lateral justo
después de que la firma dijera que no se apaga. *La letra no se cumple a medias
por un `OR` heredado.*

---

## ② 🔴 EXIGIBLE — DE DÓNDE SALE EL DATO, PANTALLA POR PANTALLA

> **El rojo, con todas las letras:** *si al montar se pasa `false` por
> comodidad porque `estado_vida` no está en la pantalla, se reintroduce el
> guard apagado que la prop vino a curar.* Con la firma del sujeto, **en el
> pedido eso ya es imposible**; en las otras dos **sigue siendo posible y por
> eso está esta tabla.**

**Medido: ninguna de las tres tiene `estado_vida` hoy.**
```
grep -c estado_vida  →  0 · parte/[eventoId].tsx
                        0 · guarderia/[estadiaId].tsx
                        0 · (tabs)/pedidos/pedido/[pedidoId].tsx
```
**Pero las tres tienen con qué cruzar, y no hace falta motor nuevo:**

| pantalla | `sujeto` | el id de la mascota | de dónde sale `estado_vida` |
|---|---|---|---|
| `parte/[eventoId]` | `mascota` | ✅ **`ParteConsulta.mascotaId`** — está en el tipo (`veterinaria-nota-clinica.ts:403`, poblado en `:474`); *la pantalla no lo usa todavía, pero el dato le llega* | `obtenerMascotasDeFamilia` → cruzar por id |
| `guarderia/[estadiaId]` | `mascota` | ✅ `mascotaId`, **ya lo usa la pantalla** | ídem |
| `pedidos/pedido/[pedidoId]` | 🔴 **`hogar`** | — | **NINGUNA. No recibe señal y no tiene apagado** (firma). *Y ya no puede pasarla ni queriendo.* |

### 🔴 LA MEDICIÓN QUE IMPIDE QUE EL `false` VUELVA POR OTRA PUERTA

**`obtenerMascotasDeFamilia` trae `estado_vida` en su `select` explícito Y NO
FILTRA A LAS MEMORIALES.** Su consulta es `.eq('familia_id', …)` y nada más
(`onboarding.ts`).

> **Por qué esto es parte del contrato y no una nota al pie:** *si ese lector
> filtrara a las memoriales, el cruce por id no encontraría nada y el default
> volvería a ser `false`* — el mismo defecto entrando por una puerta que nadie
> estaba mirando. **Está verificado acá para que C no tenga que ir a
> comprobarlo, y para que quien lo cambie sepa qué rompe.**

✅ **Y la pantalla del pedido YA la llama** (`[pedidoId].tsx:151`) — dato que
ahora no necesita, y que queda escrito porque *el día que el pedido gane
cualquier señal por mascota, el lector ya está ahí.*

---

---

## ③ LAS ONCE DE `packages/ui` — **el número real no es once**

`R78` cuenta **11 piezas** que deciden si existen mirando sólo el tema. Pero
para MONTAR lo que importa no es cuántas piezas son: **es cuántos puntos hay
que tocar.** Medido por consumidor (`grep -rl "<Pieza" apps/*/src`):

| grupo | piezas | dónde se montan | qué señal | costo real |
|---|---|---|---|---|
| **A · EL COACH** | `ChipsSugerencia` · `PresentacionNexo` · `RespuestaNexo` · `PanelMemoria` · `AvisoAnticipacion` | **`nexo.tsx`, las cinco** | **la mascota EN FOCO**, no «hay una memorial en el hogar» | 🟢 **CERO props.** Se curan en `focoNexo` — **es la mitad ② de `D-1021`, que ya tiene dueño y ya está escrita** |
| **B · LA FICHA** | `TarjetaHoy` · `TarjetaConociendolo` · `HojaContanos` · `BotonContanos` | **`(tabs)/hogar/mascota/[mascotaId].tsx`, las cuatro** | la mascota **de la ficha** | 🟡 **una prop cada una — y el booleano YA ESTÁ CALCULADO en esa pantalla** (`:546`, la cura de C para `D-1021`). *Es pasarlo, no derivarlo.* |
| **C · IMPORTADA Y NO MONTADA** | `PastillaConociendolo` | importada en `[mascotaId].tsx:73` y **usada CERO veces** | — | ⚪ ninguna hoy. Inerte **por partida doble**: ni el tema se enciende ni la pieza se dibuja. **Pero su import muerto es de C** (Ley 37) |
| **D · CROMO GLOBAL** | `MarcaDeAgua` | **~90 pantallas de las dos apps** | 🔴 **no tiene mascota de la cual sacar señal** | 🔴 la única que de verdad depende del tema. Su inercia cuesta **estética**, no respeto |

> ### 🔴 ONCE PROTECCIONES, **DOS ARCHIVOS Y UNA DECISIÓN**
> `nexo.tsx` cubre cinco · `[mascotaId].tsx` cubre cuatro · una está importada
> y no montada · y la última no tiene mascota. **El trabajo no escala con las
> once.**

### ⚠️ UNA CORRECCIÓN DE MI PROPIO CENSO, hecha antes de entregarlo

**La primera versión de esta tabla decía «nadie la monta» sobre
`PastillaConociendolo`, y su evidencia era `grep -rl "<Pieza"`.** Al verificar
apareció que **SÍ está importada** (`[mascotaId].tsx:73`) — sólo que **usada
cero veces**.

*El hecho no cambió —no se dibuja— pero la evidencia era incompleta, y quien
grepeara el nombre habría encontrado un hit y concluido lo contrario.* **Es la
misma clase que vengo midiendo toda la sesión: `grep -rl "<Pieza"` mide la
FORMA del montaje, no el hecho.**

⇒ **el import muerto queda declarado para C** (Ley 37: lo que sale de la UI
sale del código). **Y de paso dice algo del tooling:** `tsc` pasa con un import
sin usar, así que `noUnusedLocals` no está encendido en esa app — *no es de
esta tanda, se anota porque lo medí.*

### La forma de la cura, para que las nueve queden iguales

**El molde ya existe y es el de B8** — no se inventa nada:

```ts
enMemorial: boolean            // OBLIGATORIA sin default
…
if (enMemorial || theme.mode === 'memorial') return null
```

🔴 **`theme.mode` SE CONSERVA en el `OR`, no se retira.** La galería **sí**
monta el sub-tema, y ahí el guard tiene que seguir valiendo. *Lo que está mal
no es mirar el tema: es mirar SÓLO el tema.* Precedentes vivos con esa forma:
`LineaAlgoSalioDistinto` y `Atmosfera`.

**Y cada una entra con su discriminador en la galería** — un montaje con
`enMemorial` que **no dibuja nada**. *Un guard que sólo se ve encendido no se
puede juzgar apagado* (`L-498`).

### Qué pasa con `R78` a medida que C avanza

`R78` es **ratchet SOLO-BAJA en 11** y **distingue una pieza curada de una que
no lo está** (probado: desandar el `OR` de B8 sube el número). ⇒ **cada pieza
que C cure BAJA el baseline**, y quien lo baje lo edita en la regla. *No hay
que avisarle al gate: el gate lo cuenta.*

⚠️ **Lo que su verde NO dice, y conviene tenerlo escrito:** que llegue a 2
—`MarcaDeAgua` y `PastillaConociendolo`— **no significa que memorial funcione**.
Significa que ninguna pieza depende sólo del tema. **Que la app se comporte en
memorial se mide montando, que es como apareció todo esto.**

---

## ④ `MarcaDeAgua` — DECLARADA APARTE Y **NO SE CURA EN ESTA TANDA**

**No es un olvido: es la única de las once que de verdad depende del tema, y
se dice acá con su razón para que nadie la lea de otro modo.**

| | |
|---|---|
| **no tiene mascota** | es la marca de agua del fondo. **No hay señal que pasarle**: ninguna de las ~90 pantallas que la montan tiene un sujeto del cual derivarla |
| **su inercia cuesta ESTÉTICA, no respeto** | lo que no ocurre es que la marca degrade. **No le pide nada a nadie** — es cromo, no un pedido |
| **~90 pantallas en las DOS apps** | `login` · `registro` · `recuperar` · todo `ventas/` · todo `veterinaria/` · los cuatro oficios · adopción… |

⇒ **su cura no es una prop: es que el tema memorial llegue a montarse alguna
vez** —o aceptar que no degrada—. **Es decisión de mesa, no trabajo de esta
tanda**, y por eso queda **dentro del baseline de `R78`** en vez de exenta:
*una exención la saca del conteo y la vuelve invisible; el baseline la deja a
la vista cada corrida.*

### 🔴 EL PISO VIVE EN EL GATE, NO EN ESTE DOCUMENTO

**`R78` no puede llegar a 0: su piso es 2**, y desde hoy **lo imprime en cada
corrida con los dos nombres y sus razones**:

```
🔴 PISO 2, NO 0 — MarcaDeAgua (duro) · PastillaConociendolo (blando):
   NO se curan con una prop y bajar de ahí NO es deuda
```

*Un ratchet que sólo dice «baseline 11 SOLO-BAJA» se lee como «faltan once», y
en tres sesiones alguien intenta llevarlo a 0 — y para lograrlo tendría que
inventarle una señal a algo que no la tiene, que es la cura falsa que este gate
existe para no invitar.* **Un piso que hay que recordar no es un piso.**

**Y se verifica, no se recuerda:** si alguien baja el baseline por debajo del
piso, la regla **sale roja diciendo por qué** (probado en rojo). Si una del piso
**desaparece de la medición**, la salida lo dice y pide confirmar que se curó de
verdad y no con una señal inventada.

**Los dos son piso por razones DISTINTAS, y confundirlas es el error opuesto:**

| | por qué | cuándo baja |
|---|---|---|
| `MarcaDeAgua` | **DURO** · no tiene mascota de la cual sacar señal | sólo si el tema memorial llega a montarse |
| `PastillaConociendolo` | **BLANDO** · hoy no la monta nadie, no hay a quién pedirle la señal | sola, el día que gane consumidor — o el día que se borre |

⚠️ **Y llegar a 2 tampoco significa que memorial funcione**: significa que
ninguna pieza depende sólo del tema. *Que la app se comporte en memorial se mide
montando, que es como apareció todo esto.*

---

## ⑤ EL BARRIDO DE `R77` SOBRE `apps/` — NO SE ABRIÓ

Tanda propia después de S114, por orden del founder. **`R77` declara en su
propio `info` que no ve `apps/`**, así que su alcance vive en el gate y no en
una línea que alguien tenga que recordar.

---

*Pista B · S114 · contrato para C. Todo medido en este árbol; lo que es
decisión de letra está marcado como decisión y no como dato.*
