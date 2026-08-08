# S91 · CENSO DEL VOCABULARIO DE LA BITÁCORA — tabla firmable

> **Para firma del founder, de una pasada.** Las 10 filas están leídas
> VERBATIM de `cat_conductas_bitacora` (8-ago-2026); todo lo demás es
> PROPUESTA de A y va marcado como tal. **El guard `sin_contexto_activo` NO
> se tocó** — se levanta después de esta firma, no antes.
>
> Las 10 son `es_seed_preliminar = true` (10/10 medido): **esta firma es
> exactamente lo que las saca de preliminar.**

---

## ⚠️ PRIMERO, LA CORRECCIÓN AL BRIEF: NO SON DOS CANINAS, SON TRES

El brief dice «2 son caninas por su texto». **Midiendo el literal, son tres** —
y la tercera es la más interesante porque **no ladra**:

| # | texto vivo | por qué es canina |
|---|---|---|
| ① | «Jugó bien con **otros perros**» | nombra la especie |
| ② | «**Ladró** más de lo normal» | nombra la conducta canina |
| ③ | «Hizo sus necesidades **adentro**» | **presupone que el baño es AFUERA** |

**La tercera es el caso difícil, y por eso vale la pena verla:** para un gato,
«adentro» es lo normal — la anomalía es *fuera de la bandeja*. Para un conejo
o un roedor, también. La frase no menciona ningún perro y sin embargo **solo
tiene sentido en un mundo de perros**. *Un sesgo que no nombra a la especie no
lo caza un grep: hay que leer las diez.*

---

## LA TABLA — 10 filas vivas, con propuesta por columna

**Cómo leerla:** «texto vivo» es el literal de hoy (`nombre_familia`).
«Propuesta» vacía = **queda igual**. Las especies son las **seis que el alta
ofrece**; el acuario va aparte (ver §3).

| # | código | texto vivo (es) | propuesta de A | 🐕 | 🐈 | 🐇 | 🐹 | 🦜 |
|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| 1 | `lloro_al_quedarse_solo` | «Lloró cuando salimos» | **«Se alteró cuando salimos»** — «llorar» es de perro y gato; un ave grita, un conejo se queda inmóvil | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | `destrozo_objetos` | «Rompió algo en casa» | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | `hizo_adentro` | «Hizo sus necesidades adentro» | 🔴 **«Hizo sus necesidades fuera de su lugar»** — funciona para el jardín, la bandeja y la jaula sin nombrar ninguno | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | `ladridos_excesivos` | «Ladró más de lo normal» | 🔴 **«Hizo más ruido de lo normal»** — cubre ladrido, maullido, chillido y canto | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | `miedo_ruidos` | «Se asustó con ruidos fuertes» | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | `durmio_tranquilo` | «Durmió tranquilo» | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | `comio_normal` | «Comió normal» | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | `jugo_con_otros_perros` | «Jugó bien con otros perros» | 🔴 **«Se llevó bien con otros animales»** — y el código también debería cambiar (`convivio_bien`), porque un código que dice `perros` sobrevive al texto | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | `mas_carinoso` | «Estuvo más cariñoso» | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | `inquieto_en_casa` | «Estuvo inquieto en casa» | — | ✅ | ✅ | ✅ | ✅ | ✅ |

**El resultado de universalizar las tres: las diez aplican a las cinco
especies terrestres.** Ninguna queda restringida — *que es la señal de que
estaban bien pensadas y mal escritas.*

---

## §2 · LO QUE FALTA — mínimo digno, no enciclopedia

**El criterio que usé, y se puede discutir:** entra una conducta si **cambia
lo que alguien haría** (avisar al vet, cambiar la comida, llamar al
adiestrador). Queda afuera lo que solo describe. Por eso son **seis**, no
veinte.

| # | propuesta de texto (es) | 🐕 | 🐈 | 🐇 | 🐹 | 🦜 | por qué NO es opcional |
|---|---|:-:|:-:|:-:|:-:|:-:|---|
| A | **«No quiso comer»** | ✅ | ✅ | ✅ | ✅ | ✅ | Hoy solo existe «Comió normal»: **la ausencia de un chip no es un chip**. Y en conejo y roedor **dejar de comer es una urgencia de horas**, no un dato de color |
| B | **«Se escondió más de lo normal»** | ✅ | ✅ | ✅ | ✅ | ✅ | En presa (conejo·roedor·ave) esconderse es EL primer signo de dolor. Hoy no hay forma de decirlo |
| C | **«Se rascó o se lamió mucho»** | ✅ | ✅ | ✅ | ✅ | — | La puerta de entrada dermatológica y de parásitos. Cruza con grooming |
| D | **«Vomitó»** | ✅ | ✅ | — | — | — | Dato clínico duro y frecuente; hoy se pierde en texto libre |
| E | **«Se arrancó plumas»** | — | — | — | — | ✅ | Es **la** señal conductual del ave y no tiene equivalente. Sin esto, la bitácora de un ave es una de perro con las palabras cambiadas |
| F | **«Cojeó o le costó moverse»** | ✅ | ✅ | ✅ | ✅ | ✅ | Observable por cualquiera, y su ausencia obliga a escribirlo libre |

**Total propuesto: 16 conductas** (10 universalizadas + 6). *Con menos, «ave»
y «roedor» serían etiquetas sobre vocabulario de perro. Con más, nadie las
lee.*

---

## §3 · EL ACUARIO — no entra, y decirlo es la propuesta

**El sujeto es el SISTEMA** (cláusula del pez firmada el 7-ago). Un chip de
«durmió tranquilo» sobre un acuario no es impreciso: **no significa nada**.

**Propuesta: el acuario NO recibe el vocabulario terrestre.** Cuando el arco
del acuario llegue (D-685), trae **su propio set**, y de arranque alcanzan
tres: *«El agua se ve turbia» · «Un habitante no se ve bien» · «Comieron
todos»*. **No se construyen ahora**: se nombran para que nadie los invente
a las apuradas dentro del set terrestre.

**Consecuencia operativa hoy:** con `especies_aplicables` puesto, un acuario
simplemente **no tiene chips que ofrecer** — y esa pantalla vacía es honesta,
no un hueco.

---

## §4 · LA FORMA TÉCNICA — y por qué esta y no otra

`cat_conductas_bitacora` **no tiene columna de especie** (medido). Propuesta:

```sql
ALTER TABLE cat_conductas_bitacora ADD COLUMN especies_aplicables text[];
-- NULL = todas las especies (el default honesto para las 10 actuales
-- una vez universalizadas)
```

**Es el patrón que YA rige en la casa, no un invento:**
`tipos_servicio.especies_elegibles` es exactamente esta forma —array con NULL
= todas— y la usa el guard `mascota_no_elegible` desde S57. *Copiar la forma
viva cuesta cero y evita que la casa tenga dos maneras de decir lo mismo.*

**Lo que NO se hace acá, dicho:** no se toca el guard `sin_contexto_activo`
(orden de mesa) ni se migra ningún chip ya registrado — las conductas
renombradas conservan su código salvo la #8, cuyo código **también** miente.

---

## §5 · LO QUE ESTA FIRMA HABILITA Y LO QUE NO

**Habilita:** sacar las 16 de `es_seed_preliminar`, poner
`especies_aplicables`, y recién entonces levantar el guard —el orden importa,
porque una bitácora universal sobre un gato que ofrece «Ladró más de lo
normal» es peor que no tenerla.

**NO habilita, y sigue siendo de mesa (D-500):** que una conducta DISPARE un
cuidado especial. El canal de seguridad no transporta conductas — voz de
MANEJO, jamás de carácter (`LETRA_CUIDADO_ESPECIAL_S74`). *Y baja la urgencia:
`cuidado_especial` no existe en el schema (D-469).*

---

## LO QUE HAY QUE FIRMAR — cuatro casillas

1. **Las tres reescrituras** (#3 «fuera de su lugar» · #4 «más ruido» · #8
   «otros animales» + su código a `convivio_bien`). ☐
2. **Las seis nuevas** (A–F), o cuáles de las seis. ☐
3. **El acuario queda afuera** del set terrestre, con sus tres propias
   nombradas y no construidas. ☐
4. **La forma:** `especies_aplicables text[]`, NULL = todas. ☐

*Con esas cuatro, A escribe una migración y el guard se levanta en la
siguiente pasada. Sin ellas, no se toca nada.*
