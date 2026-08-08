# S91 · GATE DE STRINGS — LOS 15 CHIPS DEL GATO (+ la cuarta del acuario)

> **Para firma del founder.** Los 15 están leídos VERBATIM de
> `cat_conductas_bitacora` (8-ago-2026); el diagnóstico y las propuestas son
> de A y van marcados como tales. **A no firma strings.**

## LOS 15 QUE VE UN GATO, literales

*(orden real de display; «esp» = a cuántas especies aplica)*

| ord | código | ES | EN | esp |
|---|---|---|---|:-:|
| 10 | `lloro_al_quedarse_solo` | Se alteró cuando salimos | Got upset when we left | 5 |
| 15 | `no_quiso_comer` | No quiso comer | Wouldn't eat | 5 |
| 20 | `destrozo_objetos` | Rompió algo en casa | **Chewed** something up at home | 5 |
| 25 | `vomito` | Vomitó | Threw up | 2 |
| 30 | `hizo_adentro` | Hizo sus necesidades fuera de su lugar | Went in the wrong place | 5 |
| 40 | `ladridos_excesivos` | Hizo más ruido de lo normal | Was noisier than usual | 5 |
| 45 | `se_escondio` | Se escondió más de lo normal | Hid more than usual | 5 |
| 50 | `miedo_ruidos` | Se asustó con ruidos fuertes | Got scared by loud noises | 5 |
| 55 | `se_rasco_o_lamio` | Se rascó o se lamió mucho | Scratched or licked a lot | 4 |
| 60 | `durmio_tranquilo` | Durmió tranquilo | Slept calmly | 5 |
| 65 | `costo_moverse` | Cojeó o le costó moverse | Limped or had trouble moving | 5 |
| 70 | `comio_normal` | Comió normal | Ate normally | 5 |
| 80 | `convivio_bien` | Se llevó bien con otros animales | Got along with other animals | 5 |
| 90 | `mas_carinoso` | Estuvo más cariñoso | Was extra affectionate | 5 |
| 100 | `inquieto_en_casa` | Estuvo inquieto en casa | Was restless at home | 5 |

---

## EL DIAGNÓSTICO — por qué el founder no podía apostar cuál

**Su percepción es correcta y su causa es una AUSENCIA, no una presencia.**
Eso explica exactamente por qué no se podía señalar un chip culpable: casi
ningún texto español está inclinado a perro. Lo que está inclinado es **el
conjunto**.

**Lo medido:** de las 16 conductas terrestres, **cuántas son propias de una
especie**:

| especie | chips propios |
|---|:-:|
| ave | **1** (`se_arranco_plumas`) |
| perro | 0 |
| **gato** | **0** |
| conejo · roedor | 0 |
| acuario | 3 (su set entero) |

**Las 10 originales se escribieron desde la vida de un perro** (eso es un
hecho de su origen, no una crítica: nacieron con el adiestramiento). En S91
se universalizaron **las PALABRAS** —y bien: tres reescrituras firmadas—
**pero universalizar palabras no agrega los gestos que solo tiene un gato.**
El ave sí recibió el suyo. *El gato quedó con una lista correcta y sin nada
que sea suyo, y eso se siente como «inclinada a perro» sin que se pueda
nombrar el culpable.*

## LO QUE SÍ TIENE NOMBRE — tres hallazgos concretos

### ① 🔴 EL INGLÉS DE `destrozo_objetos` SÍ ESTÁ SESGADO

| hoy | el problema |
|---|---|
| ES «Rompió algo en casa» | ✅ neutro |
| EN «**Chewed** something up at home» | 🔴 *chew* = MASTICAR |

**Un gato no mastica los muebles: los ARAÑA.** El español se universalizó y
**el inglés no** — nadie lo miró porque el gate de strings se hizo sobre el
castellano. **Propuesta de A:** «**Damaged something at home**» (o «Wrecked
something at home», más coloquial). *Es el único texto de los 15 con sesgo
demostrable de especie.*

### ② DOS CÓDIGOS QUE MIENTEN — y es una inconsistencia MÍA, declarada

`ladridos_excesivos` y `hizo_adentro` conservan códigos de perro aunque su
texto ya no lo sea.

**Y el criterio para renombrarlos ya lo escribí yo mismo** al cambiar
`jugo_con_otros_perros` → `convivio_bien`: *«un código que dice `perros`
sobrevive al texto y vuelve a sesgar en la próxima lectura»*. **Apliqué ese
criterio a UNO de los tres y no a los otros dos.** No se ve en pantalla (los
chips muestran `nombre_familia`), pero se ve en cada consulta, en cada log y
en el próximo censo — que es precisamente cómo un sesgo vuelve.

**Propuesta:** `ladridos_excesivos` → `hizo_mas_ruido` · `hizo_adentro` →
`hizo_fuera_de_lugar`. **Costo medido: cero chips registrados con esos dos
códigos** (los 2 vivos son `miedo_ruidos` y `hizo_adentro`… ⚠️ **uno de los
dos ES `hizo_adentro`**, así que ese rename SÍ toca una fila viva: hay que
migrar ese chip junto con el código, o dejarlo). *Se dice antes de firmar,
no después.*

### ③ `vomito` COLAPSA DOS COSAS DISTINTAS EN EL GATO

«Vomitó» aplica a perro y gato. Pero en un gato, **una bola de pelo y un
vómito son dos hechos con significados clínicos opuestos**: la primera es
casi rutina, el segundo es señal. Con un solo chip, la familia informa lo
mismo en los dos casos y el dato pierde su valor para el vet.

## LAS CANDIDATAS PROPIAS DEL GATO — propuesta, para elegir o descartar

**Criterio que usé (el mismo del censo original): entra si CAMBIA LO QUE
ALGUIEN HARÍA.** Son cinco, no quince.

| # | propuesta ES | propuesta EN | por qué no es opcional |
|---|---|---|---|
| G1 | **«Usó la bandeja con normalidad»** | «Used the litter box normally» | Hoy solo existe la ANOMALÍA («fuera de su lugar»). Para un gato la bandeja es EL termómetro diario, y la normalidad también es dato — igual que existe «Comió normal» |
| G2 | **«Vomitó una bola de pelo»** | «Coughed up a hairball» | Separa lo rutinario de la señal (hallazgo ③). Sin esto, `vomito` miente por exceso |
| G3 | **«Arañó muebles o paredes»** | «Scratched furniture» | Es el equivalente felino de `destrozo_objetos`, y su causa suele ser otra (uñas, territorio, estrés) |
| G4 | **«Marcó con orina»** | «Sprayed urine» | Conducta felina sin equivalente, y de las que más rápido manda a la consulta |
| G5 | **«Maulló de noche»** | «Yowled at night» | La queja felina más frecuente y una señal de dolor o de edad en gato mayor. `Hizo más ruido de lo normal` no distingue el CUÁNDO, que acá es la mitad del dato |

**Con G1–G5 el gato pasa de 15 a 20 y deja de ser «un perro con otras
palabras».** *Y si esto se firma, conviene mirar de una vez si conejo, roedor
y perro también quieren los suyos — hoy los tres tienen cero.*

---

## LA CUARTA DEL ACUARIO — la que ya esperaba

La enmienda del founder glosó el mundo del acuario como «**agua,
mantenimiento, observación del conjunto**». Las tres construidas cubren
**agua** (`agua_turbia`) y **observación** (`habitante_no_bien` ·
`comieron_todos`). **MANTENIMIENTO no quedó cubierto.**

| propuesta ES | propuesta EN | por qué |
|---|---|---|
| **«Le cambié parte del agua»** | «Changed some of the water» | Es EL acto de mantenimiento de un acuario, y su ritmo es el dato que un servicio de acuarios necesitaría leer |

**No está sembrada** (orden de mesa: no antes del gate).

---

## LO QUE HAY QUE FIRMAR

1. **El inglés de `destrozo_objetos`** → «Damaged something at home» ☐
2. **Los dos códigos que mienten** (con la nota: `hizo_adentro` tiene 1 chip
   vivo, así que su rename arrastra una migración de dato) ☐
3. **G1–G5**, o cuáles ☐
4. **La cuarta del acuario** ☐
5. **Y la pregunta que abre:** ¿conejo, roedor y perro también reciben los
   suyos en esta pasada, o se firma solo el gato y los demás esperan? ☐
