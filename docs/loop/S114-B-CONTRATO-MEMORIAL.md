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

## ③bis 🔴 LA SEGUNDA REGLA VIVA — censada a pedido del founder

**C declaró que en Sombra las piezas ya estaban apagadas por el `{!esMemorial …}`
de la pantalla. Es cierto — y el censo da algo más grande que «dos reglas».**

### Lo medido (por balance de llaves, no por ventana de líneas)

| grupo | ¿la pantalla tiene su propia regla? | **qué forma tiene esa regla** |
|---|---|---|
| **la ficha** · `TarjetaHoy` · `TarjetaConociendolo` · `HojaContanos` · `BotonContanos` | 🔴 **SÍ — los 10 montajes caen dentro de un condicional `esMemorial`** | `estado_vida !== null && !== 'activa'`, derivado del perfil. **`esMemorial` aparece ~17 veces en esa pantalla**: no es un condicional, es una regla que la atraviesa |
| **el nexo** · `ChipsSugerencia` · `PresentacionNexo` · `RespuestaNexo` · `PanelMemoria` · `AvisoAnticipacion` | 🔴 **SÍ, pero es OTRA regla y de otra forma** | **no hay `esMemorial` en `nexo.tsx`**: la EDGE devuelve `codigo === 'memorial'` y la pantalla hace **`router.back()`**. *Es un rebote de navegación desde el servidor* |
| `MarcaDeAgua` · **85 montajes** | ✅ **NO — cero gateadas.** Verificado por balance de llaves en los 7 archivos que siquiera mencionan «memorial» | — |
| `PastillaConociendolo` | — (0 montajes) | — |

> ### 🔴 NO SON DOS REGLAS: SON **TRES**, EN TRES CAPAS DISTINTAS
> ```
> servidor  · la edge devuelve `codigo === 'memorial'`      → el nexo rebota
> pantalla  · estado_vida !== null && !== 'activa'          → la ficha apaga
> pieza     · theme.mode === 'memorial'                     → INERTE
> ```
> **Y con la que ya estaba medida —el pasaporte, que además excluye
> `perdida`— son CUATRO definiciones del mismo hecho conviviendo.**

### 🔴 LA CONSECUENCIA, y es la que importa para montar

**Las nueve están protegidas por la capa que SÍ se enciende, no por la que dice
protegerlas.** *El apagado que C vio en Sombra es real y no es de la pieza.*

⇒ **si mañana una de esas piezas se monta en OTRA pantalla —o el condicional se
refactoriza— la protección desaparece, y el guard de la pieza no la salva
porque está inerte.** *Una protección que vive sólo en el llamador protege esa
llamada, no a la pieza.*

### ⚠️ Y LO QUE **NO** HAY QUE HACER CON ESE CONDICIONAL: BORRARLO

**Medido antes de recomendar, porque la conclusión obvia era la equivocada:**
dos de los tres condicionales de la ficha **apagan una SECCIÓN ENTERA**, no una
pieza —`{!esMemorial && hoyMascota !== null ? (` envuelve **cinco** `TarjetaHoy`,
y otro envuelve `TarjetaConociendolo` **+** `BotonContanos` juntos—. **Eso la
pieza no lo puede hacer: no sabe que tiene hermanas.**

⇒ **no son duplicados: son capas anidadas, y las dos hacen falta.**
- la **pantalla** apaga *lo que la sección significa* (un bloque que no
  corresponde);
- la **pieza** se apaga *a sí misma* y **viaja con ella** a cualquier pantalla.

**El defecto no es que haya dos: es que la de adentro está apagada.** *Lo que
hay que cerrar no es la de la pantalla — es que la protección deje de depender
de que cada pantalla nueva se acuerde.*

**Y la que sí es candidata a morir es la de `HojaContanos`** (`{!esMemorial ? (`),
que envuelve **una sola pieza**: ahí la de la pantalla y la de la pieza dicen
literalmente lo mismo. *Pero eso es decisión de C sobre su archivo, no mía.*

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

## ⑥ ① · QUIÉN DERIVA «ES MEMORIAL» EN `packages/ui`, Y QUÉ QUEDA MAL CON LA FIRMA

### ✅ CERO piezas lo derivan del estado de vida. Las que lo saben, lo RECIBEN.

Censado con las cuatro formas (`estado_vida` · `'perdida'` · `'fallecida'` ·
`theme.mode`):

| pieza | forma | ¿exige la señal? |
|---|---|---|
| `LineaAlgoSalioDistinto` | `enMemorial` dentro de la unión de sujeto | 🟢 **OBLIGATORIA**, y en el pedido **inexpresable** |
| `FichaMascotaHogar` | `enMemoria?: boolean` **`\|\| theme.mode`** — *el mismo patrón que B8, y ya existía* | 🟡 **OPCIONAL** ⇒ sin ella cae al tema, **que está inerte** |
| `TarjetaPasaporte` | `enMemoria?: boolean = false` | 🔴 **default `false`** — el guard apagado por omisión, escrito |

⚠️ **Y las 60 de `theme.mode === 'memorial'` son la cuarta forma**: no derivan del
estado de vida, derivan del TEMA. Ya censadas en §③.

> ### ⚠️ UN FALSO POSITIVO DE MI PROPIO CENSO, declarado
> El conteo por token daba **29 `M6`** en `packages/ui`, y parecían derivaciones
> del momento vital. **Los 29 son paths SVG** (`d="M6 6l12 12…"`). *`L-499`
> otra vez, en el mismo día: el token se cuenta, el hecho se lee.*

### 🔴 QUÉ QUEDA MAL CON LA FIRMA — y el dato lo calcula la PANTALLA

| llamador | su regla | con la firma |
|---|---|---|
| `hogar/index.tsx` (`enMemoriaDe` :1233 · :1661) → `FichaMascotaHogar` | `!== null && !== 'activa'` | 🔴 **MAL** — una mascota **PERDIDA se dibuja como memorial en el Hogar** |
| `[mascotaId].tsx:961` → el tablero | ídem | 🔴 **MAL**, misma razón |
| `pasaporte.tsx` (:98 · :162) → `TarjetaPasaporte` | `… && !== 'perdida'` | ✅ **la única que la cumple** |

### ⚠️ Y LA SALVEDAD QUE EL CENSO OBLIGA A DECIR

**Que sea «mal» supone que la firma GENERALIZA fuera de la puerta de postventa,
y se firmó sobre la línea de reclamo.** Antes de aplicarla en el Hogar hay algo
que el censo no puede contestar:

> ### **`perdida` no es memorial — pero tampoco es `activa`, y la casa hoy sólo tiene DOS tratamientos.**
> *Aplicar la firma a la ficha del Hogar no arregla el caso: lo mueve del
> tratamiento equivocado a otro tratamiento equivocado.* **`perdida` necesita el
> suyo, y eso es letra, no censo.**

---

## ⑦ ② · DÓNDE DEBERÍA VIVIR LA DEFINICIÓN ÚNICA — opciones con su costo

> **No la escribo: es decisión de mesa y cruza territorios.** Traigo las cuatro
> con lo que cada una cuesta y lo que NO resuelve.

### 🔴 EL LUGAR YA EXISTE, Y HASTA EL ARCHIVO

**`packages/domain` está VIVO** —11 módulos— **y lo consumen LOS CUATRO
paquetes** (`api`, `ui`, `cliente`, `prestador`; medido en sus `package.json`).
**Y tiene `momentoVital.ts`, cuya función hace esto:**

```ts
export function calcularMomentoVital(entrada: { esMemorial: boolean; … }) {
  if (entrada.esMemorial) return 'M6'
```

⇒ **la casa YA trató este dato como de dominio: `domain` lo CONSUME como
argumento y nunca lo definió.** *El lugar no hay que elegirlo — hay que llenarlo.*

| opción | costo | qué NO resuelve |
|---|---|---|
| **(a) `packages/domain`** ⭐ | mover `EstadoVidaMascota` desde `packages/api/src/wrappers/_mascotas-elegibles.ts` y que `api` lo re-exporte — **`api` ya depende de `domain`, la capa da**. Un archivo, un re-export, cero consumidores rotos | **no alcanza al SERVIDOR**, que hoy decide por su cuenta (el nexo, por código de la edge) |
| (b) `packages/api` | 🔴 **`ui` no lo ve.** Agregar `ui → api` **invierte la capa** —presentación dependiendo de la puerta a la DB— y arrastra `supabase-js` al bundle de un paquete de presentación | — |
| (c) el MOTOR (Postgres) | ✅ **es la única que alcanza al servidor**, que ya decide ahí | 🔴 **no alcanza a `packages/ui`**, que no habla con la DB ⇒ *no es alternativa: es complemento de (a)* |
| (d) donde está hoy (`apps/cliente/src/lib/nexo/atajos.ts:87`) | — | 🔴 **el prestador no lo alcanza**, y su regla es `!== 'activa'`: **la que la firma contradice** |

**Mi voto: (a) con (c) como su espejo** — y con la consecuencia dicha: *si el
motor y `domain` deciden lo mismo por separado, van a divergir; la única forma de
que no pase es que alguien lo MIDA*, con un gate que compare el vocabulario de
los dos. **Eso es lo que hoy no existe y es por lo que hay cuatro definiciones.**

### 🔴 Y LA FORMA IMPORTA MÁS QUE EL LUGAR: **NO un booleano**

**Un booleano es lo que causó la divergencia.** Obliga a cada llamador a decidir
**por su cuenta** dónde cae `perdida` — y **cuatro decidieron distinto.**

```ts
type MomentoDeVida = 'activa' | 'perdida' | 'memorial'
```

⇒ **el llamador no puede colapsar `perdida` sin escribirlo**, y un `switch`
exhaustivo lo obliga a decir qué hace con ella. *Un booleano esconde la
decisión; una unión de tres la exige.* **Es la misma cura que `R77` pide para
los órdenes y que la unión de sujeto de B8 aplicó al pedido: volver la pregunta
inexpresable de contestar mal.**

---

## ⑥bis 🔴 NO ERAN CUATRO CAPAS — LA CUARTA TENÍA DOS HABITANTES MÁS

**Y los encontró el GATE, no la lectura.** Al construir
`verify:memorial-derivado` y correrlo sobre el árbol entero aparecieron **nueve
sitios que deciden memorial fuera de `packages/domain`**, y **dos no estaban en
mi censo**:

```
🔴 packages/api/src/wrappers/adiestramiento-antes.ts:195   es_memorial: …
🔴 packages/api/src/wrappers/grooming-atencion.ts:397      es_memorial: …
```

> ### `packages/api` también deriva memorial — y es la capa que alimenta al PRESTADOR.
> *Mi censo de §⑥ miró `packages/ui` porque eso fue lo que se pidió, y el
> resultado —«cero piezas lo derivan»— era cierto **para `packages/ui`**. Lo que
> no vi es que la pregunta tenía otra mitad al lado.*

**Los nueve, con su línea:**

```
apps/cliente · hogar/index.tsx:1661
             · hogar/mascota/[mascotaId].tsx 369 · 546 · 991
             · hogar/mascota/pasaporte.tsx 98 · 162
             · hogar/vacunas/[mascotaId].tsx:262
packages/api · adiestramiento-antes.ts:195 · grooming-atencion.ts:397
```

⚠️ **Y el décimo que el gate llegó a reportar era FALSO** —artefacto de su
propia ventana sin techo (`L-501`)—: **`[mascotaId].tsx:2507` NO es una
derivación de memorial.** *Se retira acá antes de que alguien lo cure.*

**Lo que esto cambia para la firma del lugar:** la definición única en
`packages/domain` **no alcanza sólo a las apps** — `packages/api` **ya depende
de `domain`**, así que las dos de arriba pueden consumirla sin ninguna capa
nueva. *La firma sigue siendo la correcta; lo que cambia es cuánto cubre.*

---

## ⑨ 🔴 FIRMADO — LA FORMA, EL LUGAR, Y QUÉ ES `perdida`

> **Firmas del founder, 7-sep-2026.** Lo de abajo **ya no es propuesta.**

### ① LA FORMA: una unión de tres, jamás un booleano

```ts
EstadoVidaMascota = 'activa' | 'perdida' | 'memorial'
```

**El booleano es lo que causó la divergencia:** obliga a cada llamador a decidir
**por su cuenta** dónde cae `perdida`, y **cuatro decidieron distinto**. Con la
unión, *el llamador no puede colapsarla sin escribirlo.*

### ② EL LUGAR: `packages/domain`, con el MOTOR como espejo

**El lugar ya existía:** `domain` lo consumen **los cuatro paquetes**, y
`momentoVital.ts` **ya recibe `esMemorial` como argumento** — la casa ya trató
este dato como de dominio y nunca lo definió ahí.

### ③ 🔴 `perdida` ES SU PROPIO ESTADO — QUÉ **NO** SE APAGA

> **Firma, verbatim:** *«La app entera disponible, sin ninguna pieza de duelo,
> sin apagar el Hoy ni el Coach — quien está buscando a su animal necesita el
> producto funcionando. Su única superficie propia es el pasaporte en modo "se
> perdió", que es para lo que existe la placa.»*

| | con `perdida` |
|---|---|
| `TarjetaHoy` · `TarjetaConociendolo` · `PastillaConociendolo` | ✅ **se dibujan** |
| el Coach entero (`ChipsSugerencia` · `PresentacionNexo` · `RespuestaNexo` · `PanelMemoria` · `AvisoAnticipacion` · `BotonContanos` · `HojaContanos`) | ✅ **se dibuja** — *y `nexo.tsx` NO debe rebotar* |
| `LineaAlgoSalioDistinto` | ✅ **se dibuja** (`enMemorial={false}`) |
| `TarjetaPasaporte` | ✅ **se dibuja, y es SU superficie**: la franja «se perdió» con su fecha |
| **cualquier pieza de duelo** | 🔴 **NO se monta** |

⇒ **`estado_vida === 'perdida'` NO alimenta `enMemorial` / `enMemoria` en
ninguna pieza.** *Hoy `hogar/index.tsx` (2 sitios) y `[mascotaId].tsx:961` lo
hacen con `!== 'activa'` — ésos son los dos que la firma deja mal, y su cura es
de C.*

---

## ⑩ ✅ CURADO EN ESTA TANDA — `TarjetaPasaporte`

`enMemoria` era `?: boolean = false`: **el guard apagado por omisión, escrito en
el tipo.** Ahora es **obligatoria sin default**, con el patrón de B8:

```ts
if (!sePintaPasaporte({ enMemoria }) || theme.mode === 'memorial') return null
```

**Rompió exactamente UN sitio** (`pasaporte.tsx:213`) y **la variable ya existía
ahí**, calculada con la regla que la firma ratificó (`&& !== 'perdida'`). ⚠️
**Cruce de territorio declarado y mínimo:** el cambio de API es de
`packages/ui`; pasar la prop es su única consecuencia — *dejar el árbol sin
compilar para que otro escriba una palabra es peor que escribirla.* **Los cuatro
typechecks en 0.**

**Y la galería ganó el discriminador de la firma:** la tarjeta con
`estado: 'perdida'` + `enMemoria={false}` **se dibuja**, al lado de la que no.

---

## ⑪ CÓMO SE MEDIRÍA EL ESPEJO — *«si deciden lo mismo por separado, divergen»*

> **Es lo que no existe hoy, y es la razón de las cuatro definiciones.**

🔴 **Y lo primero es que los dos vocabularios NO son la misma palabra:** el motor
**almacena** `estado_vida ∈ {activa, perdida, fallecida}`; el dominio
**clasifica** en `{activa, perdida, memorial}`. *`fallecida` es el hecho;
`memorial` es lo que la casa hace con él.* **Esa traducción es exactamente la
costura donde van a divergir**, así que es lo que hay que medir.

### Dos gates, partidos por si necesitan red — el corte que la casa ya usa

**① LA TABLA DE VERDAD (exige la DB) — *sin nombre de gate todavía, y es a
propósito*.**

> ⚠️ **NO lleva prefijo `verify:` porque NO EXISTE, y su sujeto tampoco:** la
> definición en `domain` está firmada y sin escribir. **Un nombre `verify:*` en
> el canon se lee como vigilancia que corre** — y lo cazó `verify:gates-existen`
> frenándome el commit por nombrarlo. *El gate que vigila que no se nombren
> gates inexistentes me frenó a mí, que acababa de escribir `L-498` sobre lo
> que parece cuidado.* Se bautiza el día que se construya.

Para **cada valor del CHECK de `estado_vida`**, comparar qué dice el motor y qué
dice `domain`:

```
valor del CHECK    motor          domain            ¿coinciden?
activa          →  activa      ·  activa           ✅
perdida         →  perdida     ·  perdida          ✅
fallecida       →  memorial    ·  memorial         ✅
```

- **rojo** si una fila difiere **o si el CHECK tiene un valor que `domain` no
  clasifica** — *un estado nuevo que nadie tradujo cae en silencio al lado
  equivocado*;
- 🔴 **publica su ALCANCE** (`L-500`): **cuántos valores del CHECK comparó.** *Si
  el CHECK gana un valor y el gate sigue comparando tres, el número se mueve y
  delata la ceguera — un «✅ coinciden» no puede.*
- **exige la DB ⇒ sin ella sale NO CONCLUYENTE, jamás verde** (`L-197`), y su
  lugar es el **paso ⓪ y el cierre**, al lado de `verify:censo`. *Un gate que
  exige red se saltea por costumbre.*

**② `verify:memorial-derivado` — EL RATCHET · ✅ CONSTRUIDO EN ESTA TANDA**

**Baseline medido: 9 sitios**, y el censo corrige lo que yo había reportado:

```
apps/cliente · hogar/index.tsx:1661 · [mascotaId] 369 · 546 · 991
             · pasaporte.tsx 98 · 162 · vacunas/[mascotaId]:262
🔴 packages/api · adiestramiento-antes.ts:195 · grooming-atencion.ts:397
```

🔴 **DOS de las nueve viven en `packages/api`**, o sea que **`es_memorial`
también se deriva en la capa que alimenta al PRESTADOR.** *No eran cuatro
definiciones: la cuarta capa tenía dos habitantes más que nadie había contado,
y los encontró el gate, no la lectura.*

**Nadie fuera de `packages/domain` compara contra `'activa'` / `'perdida'` /
`'fallecida'` para decidir si algo es memorial.** Mide por grep sobre `apps/` y
`packages/` **excluyendo `domain`**, con baseline solo-baja.

- su baseline de arranque son **los sitios que el censo de §⑥ ya nombró** (los
  dos de `hogar/index.tsx`, el de `[mascotaId].tsx:961`, el de `pasaporte.tsx`,
  y `atajos.ts:87`);
- **cada cura lo baja sola**, como `R78`;
- ⚠️ **y su piso no es 0**: `domain` mismo y los tests quedan exentos —
  **declarados por nombre, jamás por patrón** (`R78` §④).

### ⚠️ LO QUE NINGUNO DE LOS DOS RESUELVE, dicho para que no se lea de más

**El servidor decide en su propio idioma.** Hoy la edge del nexo devuelve
`codigo === 'memorial'` **sin pasar por ninguna de las dos fuentes**. ⇒ el gate ①
compara **motor↔dominio**; que la EDGE use la clasificación del motor en vez de
la suya **es cableado, no medición** — y es de A. *Se dice acá porque un espejo
de dos caras no cubre una tercera.*

---

## ⑧ EL BARRIDO DE `R77` SOBRE `apps/` — NO SE ABRIÓ

Tanda propia después de S114, por orden del founder. **`R77` declara en su
propio `info` que no ve `apps/`**, así que su alcance vive en el gate y no en
una línea que alguien tenga que recordar.

---

*Pista B · S114 · contrato para C. Todo medido en este árbol; lo que es
decisión de letra está marcado como decisión y no como dato.*
