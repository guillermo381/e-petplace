# S83 · PISTA B — ACTA DE CIERRE

> Territorio: `packages/ui` + tokens + `scripts/` (lint). Un cruce declarado:
> `apps/cliente/src/app/_layout.tsx` (un archivo, autorizado en B34).
>
> **Qué es este documento:** lo que **no se reconstruye leyendo el repo** —
> los porqués, los modos de falla que cada pieza cierra, los números que
> ordenaron decisiones, y los errores de método propios. El código está en
> los commits; esto es por qué está así.

---

## 1. LOS OCHO SLOTS

Un **slot** no es "un campo que cambia entre temas" —eso son casi todos: es
lo que un tema *es*—. Un slot es **un campo que un tema DERIVADO PISA para
separar las dos casas** (`lightOficio`/`darkOficio`). El número no existía
hasta S82-B r30, que lo declaró en el tipo `SlotDeTema`: **la lista ES el
contrato**, y por eso cada slot nuevo se agrega ahí.

Eran cuatro al abrir S83. Son ocho al cerrar.

| # | slot | cliente | prestador | qué modo de falla cierra |
|---|---|---|---|---|
| 1 | `bg.base` | `papelTapiz` / `tapizDark` | `papelTapizOficio` / `tapizDarkOficio` | el prestador heredaría el tinte MAGENTA del cliente |
| 2 | `accent.cta` | oro `#FCBC1D` | tealDark (claro) · **teal puro (oscuro)** | el CTA del prestador saldría oro |
| 3 | `accent.ctaTexto` | tinta | light0 (claro) · **tinta (oscuro)** | el label del CTA quedaría ilegible sobre su fill |
| 4 | `accent.ctaElevado` | `true` | `false` | el relieve del oro viajaría al teal, que no lo necesita |
| 5 | `accent.control` | magentaDark / violetText | tealDark · **teal puro** | el prestador **elegiría** en magenta |
| 6 | `accent.active` | pink | tealDark · **teal puro** | el prestador **enfocaría** en magenta |
| 7 | `accent.marcaEleccion` | magentaDark / violetText | tealDark · **teal puro** | la **pata** saldría magenta |
| 8 | `accent.atmosfera` | pink | tealDark · **teal puro** | la atmósfera del cliente saldría **verde** |

**La física que los une, y es la misma en los ocho:** los temas de oficio se
arman por **spread** (`...darkTheme`) y **heredan en silencio lo que no
pisan**. Quitar un override **no rompe nada**, **no lo ve el tsc** (el campo
existe igual, heredado) y devuelve el valor del cliente sin que nadie se
entere. Por eso los guards son **por ausencia de la línea**, nunca por
presencia de un hex.

### 1bis. La regla de los DOS REGISTROS

**Sobre superficie oscura manda el hex PURO; `tealDark` es la variante AA
para claro.** No es criterio nuevo: es la Ley 2 (dos registros) y §15b.2.

Medido sobre los fondos reales del prestador (mínimo 3:1, elemento no
textual — el focus y los acentos son **gráfica**, no texto):

| | CLARO (base/card) | OSCURO (base/card) |
|---|---|---|
| teal **PURO** `#28E8DA` | **1.46 / 1.54 ✗** | 12.70 / 12.59 |
| **tealDark** `#0A7268` | 5.51 / 5.80 | **3.37 / 3.34** (margen 0.37) |

**Ninguno solo sirve en los dos temas.** El puro **reprueba en claro**;
tealDark en oscuro pasa raspando y **no "ilumina"**, que es lo que el founder
pidió con su letra *"verde que ILUMINE, fosforescente"*. El par da 5.51 y
12.70.

**Y por eso el CTA fue el que cayó cuando el fondo se movió:** era **el único
slot de acento del oficio sin sus dos registros**. `control`, `active` y
`marcaEleccion` los ganaron en B13/B17/B19; el CTA quedó fuera de esa
corrección **tres veces seguidas**, y con el tapiz al 8% su fill pasó de 3.37
a **2.79** (repruebado). Se curó en B31: fill teal puro (**10.50**) + label
en tinta (**11.01**) — que además es la gramática que el cliente ya usa con
el oro.

---

## 2. EL CENSO DE BRAZOS DEL LINT

**40 brazos medidos · 32 probados · 8 decorativos.** Un **brazo** es cada
condición independiente que produce un fallo dentro de una regla.

### El método, y por qué el primero estaba mal

**v1 (descartado):** mutaba un sitio y miraba si la auto-prueba dejaba de
gritar. **Eso mide NECESIDAD, no ACTIVACIÓN** — si un fixture enciende dos
brazos de la misma regla, matar uno deja al otro produciendo el rojo, y el
brazo aparece "decorativo" siendo que sí se ejecuta. **Dio 19 falsos
positivos.** Funcionó por casualidad en R16 porque sus tres brazos son
mutuamente excluyentes.

**v2 (el bueno):** **instrumenta el paso**. Cada sitio marca su ejecución, se
corre **solo la fase de auto-prueba** y se vuelca la traza. Sitio en la traza
= un fixture lo enciende. Sitio ausente = decorativo.

**Control del instrumento** (no se confía en él sin probarlo): con un fixture
que no traía el archivo, el guard de fuente de R14 **pasó a probado** y el
ternario **pasó a decorativo** — exactamente lo esperado.

### Las dos familias de decorativos

- **4 guards de fuente** (R14 ×3, R16 ×1) — el *"sin fuente no hay
  verificación"* de L-192. **Nunca se prueban porque el fixture siempre trae
  la fuente**: son excluyentes con el camino feliz **por construcción**. La
  defensa contra el silencio vivía **sin que nadie hubiera comprobado que
  suena**.
- **4 excluyentes de contenido** (R22 ×3, R18 ×1) — su condición no puede
  coexistir con la del brazo que el ancla ya prueba.

**Curados en B7: los ocho, con caso etiquetado y rojo producido.**

**Y una distinción que la medición obligó a hacer:** al desactivar un brazo
hay **tres** resultados, no dos — **ROJO** (la auto-prueba lo caza),
**CRASH** (sin el brazo el lint *explota* con TypeError: es la prueba **más
fuerte** de que no es decorativo, porque el guard existe justamente para que
el lint hable en vez de romperse) y **MUDO** (sigue verde: ahí sí no aporta).
Resultado final: 3 CRASH + 5 ROJO · 0 MUDO.

**Candidata sin firma que sale de acá:** *"las tres capas de L-192 se aplican
por BRAZO, no por REGLA"*. Evidencia de tres sesiones: B3 la estrenó, B6 la
aplicó al nacer, B7 la cobró ocho veces.

**El refactor genérico NO se hizo, con su costo dimensionado:** `FIXTURES`
como lista de casos etiquetados · brazos declarados por nombre (`F('sin-marca',
msg)`, nombre no declarado = error duro) · el guard exigiendo que la unión de
casos active todos los nombres. **21 funciones · ~42 sitios · más el runner.**
Hoy son cuatro bloques `EXTRAS_*` a mano.

---

## 3. LA ESCALA DEL TAPIZ

Derivada en **HSL desde el ancla real de producción** (`#080D0E` = "3%", H190
S27%), **H y S fijos y L escalada** — el mismo eje con el que nació. Nunca a
ojo.

| % | hex | crudo | +Atmosfera | +luz en la tarjeta |
|---|---|---|---|---|
| 3 | `#080D0E` | 1.009 | 1.008 | 2.30 |
| 4 | `#0B1113` | 1.019 | 1.038 | 2.24 |
| **5** | **`#0D1617`** | **1.056** | 1.096 | 2.16 |
| 6 | `#101A1C` | 1.095 | 1.149 | 2.08 |
| 8 | `#152325` | 1.199 | 1.277 | 1.90 |

### El hallazgo que ordena la decisión

**En la casa VERDE el par card/base MEJORA al subir el tapiz** (1.009 →
1.199), **al revés que en el cliente**. El recuerdo del founder —*"al 8% el
par daba 1.009 y borraba las tarjetas"* (su propio revert `fa03ce8`)— **es
del cliente y NO se traslada**: su magenta y este verde parten de
luminancias distintas respecto de la **misma** tarjeta. Acá el 3% era el
**peor** de la escala, no el más seguro.

**Dos preguntas que conviene no mezclar:** si lo que se quiere es
**presencia de color**, subir es seguro; si lo que se quiere es que **las
tarjetas se separen**, eso ya lo resolvió `elevacion.luz` — al 3% con luz
(2.30) separa más que el 8% crudo (1.199).

### Los tres textos que el 5% curó solo

El 8% (firmado, luego bajado a 5% por *"muy pesado"*) causó **cuatro
regresiones** que el barrido nuevo cazó **a los minutos**. Bajar a 5% curó
**dos** sin tocar un token de texto:

| par | 3% | 8% | 5% |
|---|---|---|---|
| `fill accent.cta/bg.base` | 3.37 | **2.79 ✗** | curado aparte (B31) → 11.93 |
| `capaText.comunidad/capaBg` | 5.22 | **4.35 ✗** | **4.90 ✅** |
| `status.dangerText/dangerBg` | 5.48 | **4.43 ✗** | **5.06 ✅** |
| `capaText.comunidadAmplia/capaBg` | 4.71 | **3.87 ✗** | **4.40 ⚠️** falta 0.10 |

**La causa, medida:** `capaBg` y `statusBg` son **rgba con alpha** y se
componen **sobre `bg.base`**. Aclarar el fondo aclara el tinte, y el texto de
capa —que es claro— pierde contraste contra él. **Tres de las cuatro son de
TEXTO**, o sea AA de verdad.

**Queda UNA regresión abierta** (`comunidadAmplia` 4.40, a 0.10) — rotulada
como tal en el lint, **contada aparte del baseline** y esperando el ojo del
founder en pantalla (L-153). *Un baseline que no distingue lo heredado de lo
que uno acaba de romper es donde se esconde el daño propio.*

---

## 4. `Atmosfera`

**Qué es:** un **degradado radial** detrás del contenido, en el color de la
capa. **`RadialGradient` de `react-native-svg` — cero dependencias nuevas.**
**No lleva blur y no lo necesita: el degradado ES el difuminado.** Skia se
descartó por eso (no está instalado y agregaría build nativa).

**Tres stops y no dos:** con dos, el borde del degradado se lee como un
anillo. El del medio es lo que lo hace atmósfera.

**Intensidad 0.18** — entre el 0.16 del layout del portal viejo y el 0.22 de
su pantalla del Durante, del lado sobrio porque §15b manda sobriedad.

**El nombre no se inventó.** La **Ley 7** dice que el *glow* es **semántico**
("en vivo/en curso"); esto es **atmósfera** — no dice que algo esté pasando,
dice de qué capa es la pantalla. **Dos trabajos distintos no comparten
nombre**, así que la Ley 7 queda **intacta** y el efecto tiene el suyo: el
portal viejo tituló su archivo *"Atmósfera de capa"* (v3.2).

**Dónde NO se monta:** memorial (Ley 8) y **claro** — este último **firmado
por el founder el 1-ago-2026**, no es un pendiente. *(El dato del otro lado
se conserva: el AmbientGlow del legacy sí vivía en claro, 0.12 contra 0.22.)*

**Su complemento: `elevacion.luz`**, con el patrón exacto del halo — **no es
un nivel, es otro canal**, y por eso `Tarjeta` lo recibe por prop. `null` en
claro (la sombra ya separa) y `null` en memorial (**separar es necesidad;
iluminar de color es celebración**).

### 4bis. El orden de planos — por qué "el glow desapareció"

**El glow existe y es fuerte. Lo tapan 73 fondos opacos.**

```
ThemeProvider              ← NO pinta fondo (su wrapper solo existe con marcaDeAgua)
  AvisoProvider
    AtmosferaDelOficio     ← plano 0 · EL GLOW
    Stack
      pantalla
        <View bg.base>     ← plano 1 · OPACO — acá muere
          <MarcaDeAgua/>   ← plano 2 · el agua, DENTRO de la pantalla
          contenido
```

| | color | contraste vs fondo |
|---|---|---|
| fondo prestador oscuro (5%) | `#0D1617` | — |
| **+ glow, núcleo** (α .18) | `#123C3A` | **1.511** |
| + glow, anillo medio | `#0F2222` | 1.112 |

**1.511 es más de lo que rinde el halo y muy por encima de lo que separa una
tarjeta (1.055).** Lo que llega a la pantalla hoy es **cero**.

**El agua NO lo tapa** (está *dentro* de la pantalla, encima del fondo
opaco: las dos víctimas están del mismo lado). **El 5% tampoco lo mató** — el
5% es el **tapiz** (`bg.base`); la intensidad del glow es 0.18 y no se tocó.

---

## 5. LAS CUATRO IMPLEMENTACIONES DEL AGUA

**La pieza `MarcaDeAgua` de `packages/ui` fue un camino MUERTO paralelo al
que corría.** Su prop del `ThemeProvider` tiene default `false` y **ninguna
app la encendía**; lo que se veía eran **inlines con `@override-s82c`**, y no
diferían solo en el alfa (lo que r8 midió) sino en **anatomía**:

| pantalla | alfa | size | anatomía |
|---|---|---|---|
| `cliente/hogar/index:967` | 0.06 | 210 | centrada · **ENTERA, no sangra** |
| `cliente/…/mascota/[mascotaId]:440` | 0.04 | 1000 | centrada · sangrada · `overflow:hidden` |
| `prestador/bienvenida-dia1:144` | 0.03 | 280 | **esquina** (`right:-70`) |

**Nació para que el número viviera una sola vez y quedó al lado del que
corre: dos piezas para un trabajo, una viva (×3, divergente) y una que nadie
enciende.**

**Cerrado en B22:** el founder firmó *"copiá cómo quedó en cliente, allí
quedó bien"* ⇒ la receta del Hogar (**entera, centrada, 0.06**) es hoy el
**default de la pieza**. Lo único que cambió es la **robustez**: el 210 es
fijo y en una pantalla de 320 el isotipo ocupa el **96 %** del ancho (roza);
el factor **0.536** reproduce ese 210 **exacto** a 390 px y mantiene el 78 %
en cualquier ancho.

**⚠️ Y arrastra una firma:** el argumento que dejó la **Ley 4** intacta fue
que el agua *"no es un isotipo"* **porque cortada no identifica**. **Una
silueta entera SÍ identifica** ⇒ agua + isotipo del techo son **dos**. **La
Ley 4 vuelve a la mesa** — firma del founder, pendiente.

---

## 6. TRES CORRECCIONES DE MÉTODO PROPIAS

Las tres son de la misma familia y por eso valen más que los números que
corrigieron: **afirmé sobre un valor que no medí**.

1. **Razonar el efecto de un token no es medirlo.** Declaré que *"la
   Atmosfera no mueve el par card/base porque pinta sobre los dos por
   igual"*. **Es falso**: al 3% lo **baja** (cuando base y card ya son casi
   idénticos, el glow los acerca más) y del 4% en adelante lo **sube**. El
   razonamiento era plausible; el número era otro.

2. **Grep por la prop mide quién la pasa, no qué se renderiza.** Busqué
   `marcaDeAgua` (la prop) y concluí *"ninguna app la enciende"*. Era cierto
   **y era irrelevante** — el founder tenía la app abierta y veía el agua.
   **Un inline no menciona el nombre de la pieza que reemplaza**, así que es
   invisible a esa búsqueda. El grep correcto es por el **render**, por el
   **token del alfa** y por la **anatomía**.

3. **Hay DOS `primary` en el tema.** Reporté que `accent.primary` era
   `text.primary` (tinta) para justificar el octavo slot. **Falso**: mi grep
   tomó el de texto. `accent.primary` **sí** es el teal — así que **lo que C
   montó en el prestador estaba bien**. El slot igual hacía falta, pero por
   la razón correcta: **`accent.primary` es el mismo teal en las dos casas**,
   así que reusarlo en el cliente daría una atmósfera verde.

**Y una cuarta, de la mesa y no del código, que anoté por pedido del
founder:** cuando se pidió la firma del tapiz al 8% **se llevó el par que
mejora (card/base) y no se midió lo que el fondo arrastraba**. El error fue
llevar el número incompleto. **El guard lo cazó a los minutos: sin él, cuatro
pares habrían viajado invisibles en ese OTA.**

---

## 7. LO QUE QUEDA SIN HACER, CON SU DIAGNÓSTICO

### 🔴 Los 73 fondos opacos — la cura de planos (de C, `apps/prestador`)

**Es la misma causa para el agua y para el glow**, y por eso es lo primero.
Dos caminos:

- **quitar el fondo redundante** de esas 73 vistas — el layout ya puede
  pintarlo una vez; **o**
- **subir la Atmosfera de plano**, montándola dentro de las pantallas como C
  hizo con el agua (**119 montas**).

**Mi lectura: el primero.** El agua terminó montándose 119 veces **justamente
porque el fondo opaco no la dejaba pasar** — se curó el síntoma. Si se quita
el fondo redundante, **el glow aparece y el agua puede volver a vivir una
sola vez en el layout**, que es donde su propia pieza dice que va. Y el
argumento de C contra montar la atmósfera por pantalla (*"N copias de una
dosis que la Ley 5/7 define POR VISTA"*) **es correcto**.

### Lo demás, en orden de alcance

| | qué | dueño |
|---|---|---|
| **D-605** | 3 de 4 grupos: 4 checkouts · `plan-hoja` ×6 · 3 educativos. **En `packages/ui` NO queda texto legible en `tertiary`** — lo que queda es placeholder (exención firmada), el tab inactivo (la espec que *firmó* la exención) y gráfica | apps |
| **D-606** | ~10 chevrons a 2.18 (mín 3:1). **Otro mínimo, otra cura** (token **o grosor** — decisión de arte) y su muerte exige además el barrido sistemático | B + arte |
| **D-599** | la **galería fuera del corpus de R4** (`RAICES_UI` = components + brand). Puede ser correcto —la galería monta lo que la ley no permite todavía— pero **nadie lo declaró como exención**: hoy es silencio | lint |
| **1 regresión** | `comunidadAmplia` 4.40, a 0.10. Se juzga **en pantalla** | founder |
| **el oro en baseline** | `light fill accent.cta` 1.55 es **exención firmada** (E1, compensada con `ctaElevado`). Debería vivir en `EXENTAS_R12` — **no lo moví: sería firmar una exención que no firmé** | mesa |
| **la Ley 4** | el agua entera identifica ⇒ agua + techo son dos | founder |
| **la asimetría de las patas** | `accent.marcaEleccion` resuelve **idéntico** a `accent.control` en las **cinco** resoluciones. Se conservó como slot porque son conceptos distintos, pero **mientras coincidan, un cambio en uno que no viaje al otro es divergencia por accidente** | mesa |

### Lo que el prestador hereda y conviene saber

- **`<Atmosfera color={theme.accent.primary} />`** en su layout: con el
  octavo slot vivo **esa prop puede irse** — el default hace lo mismo y deja
  de ser un lugar donde equivocarse de casa.
- **`verify:contrast` no mide los temas de oficio.** Daba 178/0 mientras la
  casa del prestador estaba **ciega**. El barrido de R12 sí la cubre desde
  B30 (152 pares) — **son dos gates distintos y solo uno ve las dos casas**.
