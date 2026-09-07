# S113 · pista C — parte de cierre

**Rama `pista/s113-c-3.7` · SHA `e728fc06` · verificado contra origin por
`ls-remote` (coincide) · árbol limpio (0 sucios).**

---

## 1 · QUÉ CONSTRUÍ

| tanda | qué |
|---|---|
| 1.x | el perfil habla · el carnet · la despedida · FichaRaza |
| 2.0–2.1 | Nexo con su hilo · el «cuéntanos» · el pasaporte y su QR |
| 2.2 | **el perfil como tablero** — orden firmado, seis tarjetas, memorial |
| 2.2.1–2.2.5 | el pulido: pie plegado · una invitación · «Hoy» con su texto · chips de rasgos · las cuatro acciones · los cinco del ojo del founder |
| fase 3 | **la bóveda de papeles** (pantalla + traer) · **la búsqueda** · **la placa** |

**Pantallas nuevas:** `hogar/mascota/documentos` · `buscar` · `placa/[token]`.
**Piezas locales:** `traer-papeles` · `busqueda` · `chips-rasgos` ·
`lib/perfil/tablero`.

---

## 2 · QUÉ MEDÍ (cada número con su denominador y su objeto)

Todo con la cuenta del founder (`guillo381+8`), Metro propio verificado por
«Bundled», contra `e728fc06`.

### El perfil, en web (420px)

```
                        Thor    Lolo    Sombra
orden firmado             ✓       ✓        —     (memorial no monta tablero)
invitaciones «cuéntanos»  1       1        0
truncados                 0       0        0
fuera de caja             0       0        0
tablero                  sí      sí       NO
«Sin registro»            1       4        0
acciones                  4       4        2     ← firma del founder
errores de página         0       0        0
```

### El expediente — **44 filas leídas · 0 con voz genérica**

Censo **desde la pantalla** (`scripts/censo-voces-expediente.mjs`), que es lo
que la mesa pidió porque A y E midieron contra diccionarios distintos: Thor 20 ·
Zeus 20 · Lolo 2 · Sombra 2.

⚠️ **Su verde dice «ninguno de los que se dibujan hoy cae al genérico», jamás
«los 21 tipos tienen voz»**: lo que ninguna mascota de esta cuenta tiene, no se
ve.

### La bóveda · la búsqueda · la placa

```
bóveda    Thor: grupo Exámenes + e-PetPlace · Sombra: sin invitar ✓ · alarma 0
búsqueda  «proplan» → Despensa ✓ sin pasar por el chat · ISO crudos 0
          «clinica» → Citas · Papeles · Recuerdos · Prestadores ✓
placa     sin sesión: no opina, no nombra mascotas, ofrece la suya ✓
```

### En aparato — emulador propio `s113_C`, **densidad 420 (412dp)**

La entrada de búsqueda: **reproducida tapada** y **curada**, con captura antes y
después en `capturas-s113-c-f3/`.

---

## 3 · QUÉ **NO** MEDÍ, dicho por nombre

- **El saludo sobre la hora del sistema.** `insets.top + spacing[5]` ya está en
  el techo (`hogar/index.tsx:1592`) y **en mi captura no se superponen** (hora
  y≈30, logo y≈150). *No digo que no pase: no lo pude reproducir con 412dp y
  este notch.* **Hace falta el modelo del founder y su captura.**
- **Nada en iOS.** Cero.
- **El PDF y el escaneo de placa**: sus dependencias nativas no están
  instaladas, así que su camino **no existe todavía** — no es que falle.
- **Los 21 tipos de evento**: sólo los que estas cuatro mascotas tienen.

---

## 4 · LO QUE QUEDA ABIERTO, **con dueño por PISTA**

### 🔴 Pista A

| qué | medición |
|---|---|
| `estado_de_placa` devuelve `libre` para un token **que no existe** | medido: con sesión, cualquier cadena se ofrece para activar. *La pantalla no puede curarlo: sin ese dato, cualquier texto parece una placa virgen.* |
| `TipoResultado` de `coach.ts` **no lista `papel`** | la RPC **sí lo devuelve** (`20260910220000_s113a_ruta_documentos`). Compila porque un tipo es una promesa, no una validación. |
| el perfil no lee `cat_rasgos` | por eso la dimensión **carácter** de `TarjetaConociendolo` sale del timeline. Si la familia carga rasgos y el timeline no los trajo, la almohadilla se ve apagada un momento. |
| se puede guardar **una bitácora vacía** | `chips_de_bitacora` devuelve **0 filas** para las 8 bitácoras de Thor: se guardaron sin conductas ni texto. Decisión de producto si la puerta debe rebotar. |

### ✅ Cerrados (no volver a pedirlos)

- **el glifo `lupa`** — B lo entregó en `cb3e34c9` y **está enchufado**;
- **el cuarto slot de `FilaAcciones`** — B lo entregó como lista en `330d903e`
  y **las cuatro acciones están montadas**;
- **`verify:lista-voseo`** — le faltaba su línea en el `package.json`; **puesta,
  corre verde**;
- **el texto de la bitácora en el timeline** — lo pedí a A creyendo que faltaba
  un campo y **ya viajaba** (`chips_de_bitacora`): curado de mi lado.

### Parado por decisión

**El pulido de composición del Hogar** — lo toca el rediseño (S116/117).

---

## 5 · LO QUE APRENDIÓ LA CASA (cada ley con su caso medido)

**① Un arnés escrito contra una composición no mide la pantalla: mide la
composición, y sobrevive a ella dando rojos.** — Mi arnés de la bóveda buscaba
«Descargar PDF» y mis rótulos viejos: **3 rojos falsos** sobre una pantalla que
funcionaba.

**② Un arnés web no puede ver lo que sólo pasa en el aparato.** — Medía a
**420px con DPR 1**; el aparato son **412dp con densidad 420**. *Más ancho y sin
escalado de fuente no puede ver un texto que no entra.* Costó dos tandas de
«Documentos» partiendo la «s».

**③ La captura corrige al arnés.** — Dos veces: el «fuera de caja» eran **7
capas de pintura**, y el truncado de la franja **no era defecto** (tenía «Ver
13 ⌄» al lado) y el `94062` que reporté **no existía en la pantalla**: era
`textContent` pegando nodos vecinos. *Estuve a un paso de mandarle a B un
defecto que no existe.*

**④ Un pedido a otra pista se mide antes de emitirlo.** — Pedí a A el texto de
la bitácora: **ya viajaba**. *El wrapper trae más de lo que su consumidor usa, y
eso no se ve leyendo la pantalla.*

**⑤ Dos vocabularios para lo mismo se mapean explícito, nunca con un cast.** —
El motor dice `prestador`, la pieza `prestadores`. Y **lo que no mapea se cuenta
y se avisa**: *un resultado que desaparece por un vocabulario desalineado se lee
como «no hay».*

**⑥ Un rebote de permisos leído como veredicto sobre el objeto es la peor clase
de mentira: suena a dato.** — `estado_de_placa` **exige sesión**, y mi primera
versión decía *«esta no es una placa de e-PetPlace»* a quien encuentra un perro
en la calle, sobre una placa que sí es nuestra.

**⑦ Un arreglo puede causar el defecto que viene a arreglar.** — El botón de
enviar: `center` → Δ13px · `sinPie` + pie **dentro** del View → Δ13px · el pie
**fuera de la fila** → **Δ0**. *El pie montado adentro hacía que el View midiera
caja + pie.*

**⑧ Un gate atado a un bloqueante ajeno es la única forma de que la puerta se
abra sola el día que la llave existe.** — `verify-documentos-preparado` **se
puso rojo solo** al mergear el slot de B y dijo qué hacer. Ejecutado y borrado.

**⑨ Un control que promete un acto y hace otro no es un atajo: es una promesa
incumplida.** — «Buscar en tu familia» abría el chat.

**⑩ `{/* … */}` entre las props de un componente no es JSX válido** — sólo entre
hijos. **Me lo cobró el compilador tres veces en esta sesión**, siempre por
escribir la razón donde estaba mirando.

---

## 6 · GATES QUE ESCRIBÍ O TOQUÉ

| gate | línea en package.json | control | contra qué mide |
|---|---|---|---|
| `verify:nexo` | ✓ | 71 verdes | las leyes de Nexo en su pantalla |
| `verify:pide-en-memorial` | ✓ | **10 frases plantadas, las ve todas** | que nada le pida a quien ya no está |
| `verify:confirmable` | ✓ | 11 casos | la regla del carnet, una sola cuenta |
| `verify:hooks-bajo-return` | ✓ | — | ningún hook bajo un return de guarda |
| `verify:canal-unico` | ✓ | — | canales realtime declarados |
| `verify:voz-sin-hueco` | ✓ | baseline **10, solo-baja** | ninguna voz con `{{x}}` sale vacía |
| `verify:lista-voseo` (de A) | ✓ **puesta por mí** | 2 consumidores | una sola lista de voseo |
| ☠️ `verify-documentos-preparado` | — | 2 rojos probados | **murió al cumplir su función** |

**`FIRMADAS_EN_MEMORIAL`** (en `censo-pide-en-memorial.mts`) es una lista
**distinta** de `NO_ES_PEDIR`: aquéllas *no piden nada*; **éstas piden y van
igual porque el founder lo firmó**, cada una con su firma. *Meterlas en la otra
lista sería mentir sobre qué son para que el número baje.*

---

## 7 · LO NATIVO PENDIENTE → `S113-NFC-BUILD.md`

**Nada instalado.** Tres dependencias esperan la build, cada una con su camino
declarado en pantalla en vez de fingido:

- **`expo-document-picker`** — el PDF en «Traer papeles». Hoy el selector de
  archivo lo dice con su voz; la foto alcanza.
- **`expo-camera`** — el escaneo de placa desde el pasaporte. **La pantalla del
  deep link no la necesita**: se llega por el link del QR, que es como llega
  quien encuentra al animal.
- **el micrófono de Nexo** (heredado).

*Instalar cualquiera hoy rompería la app que ya está en la calle: una
dependencia nativa no viaja por OTA (`L-134`).*

---

## 8 · LIMPIEZA

**Borrado:** los dos Metro (8082, 8083) · el AVD `s113_C` que creé · los
temporales de `/tmp` (capturas, `.sql`, `.bak`, fragmentos de edición) · la
sonda temporal que colgué del cuarto slot para medir el aterrizaje de
Documentos · `verify-documentos-preparado`, por orden de su propio rojo.

**Dejado a propósito:** los **9 arneses** de `scripts/` (`medir-*`, `censo-*`) —
son reutilizables y miden pantallas que van a seguir cambiando; las **capturas**
de `capturas-s113-c-f3/`, para que el rediseño compare contra lo aprobado y no
contra el recuerdo.

**No tocado:** los dos stashes viejos (`s107-c`, `s104-c`) que un `pop` mío trajo
por error — revertido, siguen en su pila intactos.

---

## 9 · ÚLTIMO ESTADO

```
diseno VERDE 61 · nexo 71·0 · boveda 42·0 · pide-en-memorial VERDE ·
confirmable 11 · hooks-bajo-return · canal-unico · voz-sin-hueco VERDE
(10 = baseline) · gates-existen VERDE · tsc en los 4 paquetes 0
```

🔴 **Un rojo apareció en el propio cierre y se curó**: `voz-sin-hueco` marcó
**11 contra baseline 10** — la nueva era mía, un `nombre ?? ''` en el vacío de
la bóveda. *Es el defecto exacto que A me encontró en aparato con «Lo que sé de
» y por el que existe ese gate.* De vuelta en 10.

**Todo en `preview`. La veda de producción, entera.**
