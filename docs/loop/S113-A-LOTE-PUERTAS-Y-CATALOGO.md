# S113-A · lote «las puertas y el catálogo» — parte

`main` al cierre de este tramo. Todo medido contra el objeto; donde no pude
medir, lo digo.

---

## ① La guardería pregunta por la vida

🔴 **Censado por cuerpo en `pg_proc`: VEINTE funciones consultan
`_mascota_elegible_servicio` y `_guarderia_puede_reservar` no.**

**El rojo, sobre un caso real** (L-459 — la primera prueba de un guard nuevo es
su rojo, no su verde):

```
antes   Sombra (perro, MEMORIAL desde el 5-ago) → puede=true   motivo=—
control _mascota_elegible_servicio(Sombra,'guarderia') = false
después Sombra                                   → puede=false  motivo=mascota_no_elegible
        Prueba C1102 (VIVA)                      → puede=true   motivo=—
```

*La respuesta correcta ya existía en la casa y esta puerta no la pedía.*

⚠️ **Va primero de todo, antes del gate sanitario, y no por orden estético:**
preguntarle a una mascota que ya no está si tiene las vacunas al día produce una
lista de faltantes sobre alguien que no las necesita — **y esa lista es
exactamente lo que la familia no tiene por qué leer.**

---

## ③ El lookup de raza deja de perder mascotas por una tilde

`mascotas.raza` es texto libre (D-379) y los lectores lo casaban contra
`cat_razas.nombre` con **igualdad exacta**. Medido: Lía declara «Schnauzer
miniatura», el catálogo dice «Schnauzer Miniatura», **y una mayúscula la dejaba
sin su cara**. Las 215 filas del catálogo tienen acento o mayúscula interna: la
superficie de colisión era el catálogo entero.

**Columna GENERADA `nombre_norm`, no normalización en cada consumidor** — *dos
normalizaciones del mismo dato divergen, y el día que una se arregle la otra
sigue perdiendo mascotas.*

⚠️ **`unaccent` no está instalada y no se instaló para esto:** además de ser una
extensión, **no es IMMUTABLE**, así que no puede sostener una columna generada ni
un índice. Se usa `translate` sobre las vocales del español — determinista y
suficiente para el idioma en que está escrito este catálogo. *Se elige la
herramienta que el problema necesita, no la que suena más general.*

**Verde con sus dos controles:**
- Lía «Schnauzer miniatura» → casa con «Schnauzer Miniatura». Mascotas sin cara: **7 → 6**.
- **Control negativo:** la normalización **no colapsa dos razas distintas** — la clave sigue siendo única sobre las 215.

🔴 **Y hay una puerta, no sólo motor:** los dos lectores por lote
(`onboarding`, `mascotasPrestador`) casan por `nombre_norm`, con un espejo del
lado cliente en `_raza-nombre.ts`.

**Nace `verify:raza-norm`**, que compara las dos tablas de caracteres carácter
por carácter y **prueba su propio rojo con `--control`**. Existe porque *el modo
de falla de este par no tiene síntoma*: si divergen, la mascota muestra la cara
genérica y **nadie abre un ticket por eso**.

⚠️ Por la misma razón el espejo **no usa `normalize('NFD')`**, que sería lo
idiomático: NFD saca toda marca diacrítica del Unicode y la base sólo saca las de
su tabla. *Entre lo idiomático y lo idéntico, gana lo idéntico.*

---

## ⑤ Las fichas del primer Batch, cargadas y apagadas

**97 fichas** (no 100 — el Batch de D produjo 97 válidas y rechazó 3: `rex` y
`pez-betta` por `cuidados.adulto inválido`, `shnauzer` por no parsear).

```
fichas cargadas        97
publicadas              0     ← y el CHECK lo vuelve inexpresable sin firma humana
conocidas / vacías     94 / 3
las tres vacías        gato/gato-comun · perro/criollo · roedor/cobaya-o-cuy
esperan 2º Batch      118 razas
```

🟢 **Las tres vacías son el sistema funcionando:** son nombres genéricos, no
razas, y **el modelo se negó a inventar sobre ellos**. *Un párrafo plausible
sobre una raza que no existe es peor que ningún párrafo: suena bien, así que
nadie lo va a corregir.*

🔴 **El FK frenó la primera carga, y el freno fue correcto:** el Batch corrió
contra el catálogo viejo y traía las tres erratas como llave. Antes de remapear
**medí si el modelo había entendido pese a nuestro error de tipeo** — y no sólo
entendió: **corrigió la ortografía en su propio texto** («El Staffordshire Bull
Terrier…», «El Jack Russell Terrier…», «El American Pit Bull Terrier…»). *La
llave mal escrita era nuestra, no suya*, así que remapear es devolverle su ficha
a la raza correcta, no forzar un encaje.

---

## ② `D-1034` · los guards de `packages/ui` — dueño B, gate E

Censado **por AST y no por `grep`**, porque la pregunta —*¿qué tipo tiene el lado
izquierdo?*— no está en la línea:

| corte | cuántos |
|---|---|
| todos los `{x && …}` en JSX de `packages/ui` | **30** |
| ya booleanos **por forma** (`!`, comparación, `Boolean()`, `??`) | **23** |
| no probablemente seguros | **7** |
| 🔴 genuinamente `string \| null` | **2**, los dos en `FichaVacuna` |

⚠️ **El «23» del encargo reconcilia y no contradice: son los 30 menos los 7.**
Lo dejo escrito porque *un número heredado se lee igual de firme que uno medido*
— éste resultó ser el complemento del que importa.

**Hoy no explotan**, y eso está medido: con `null` React no dibuja nada y el
único valor que rompe es `''`, que ningún productor emite (`nullif(btrim(…),'')`
en la RPC, `campoTexto` en el wrapper). 🔴 **Ahí está la deuda: la seguridad de
esos dos guards no vive en ellos — vive en que un módulo del otro lado de una
frontera siga normalizando.** `fechaLiteral` viene de la edge de D.

Ficha completa en `DEUDAS_CANONICAS.md`. **Declarado: el censo miró sólo
`packages/ui/src`** — `apps/` no se censó, es territorio de C y B, y el
instrumento se corre igual cambiando una ruta.

---

## ④ La lista, para tachar o sumar

**Hasta tu respuesta, las 215 quedan activas en el catálogo y ninguna con
contenido publicado** — o sea: el selector las ofrece, y ninguna muestra todavía
un texto escrito por un modelo.

⚠️ **Supera tu ~150-170 en 45, y sé dónde:** perro 111 y gato 26 dan en el
blanco; las otras siete especies aportan 35 entre todas. `creado_en_s113` marca
lo de hoy, así que sacar cualquier fila —o el lote entero de una especie— es una
línea.

🔴 **Y la fuente va declarada: es conocimiento del modelo sobre razas con
presencia en Ecuador y LatAm, NO un registro medido.** No consulté padrón ni
censo de criaderos. Hay una segunda red: el Batch devuelve `conocida: false`
sobre lo que no reconoce y **una ficha no conocida no se puede publicar**. *Una
raza de más en el selector es un nombre sin ficha; nunca un párrafo inventado.*

**Las 12 que ya tienen mascotas reales van primero a revisión:** Labrador
retriever (16) · Gato Común (14) · Loro Yaco Africano (2) · American Bully (2) ·
Beagle (2) · Californian · Maine Coon · Persa · Bulldog inglés · Pug ·
**Schnauzer Miniatura** · Chinchilla.

*(La Schnauzer Miniatura aparece en esa lista por primera vez hoy: es Lía, que
③ acaba de reconectar con su raza.)*

### Las 215 razas del catálogo — para tachar o sumar

Marcas: **·nueva** = entró en el ensanche de hoy · **🐾N** = N mascotas reales ya la usan (van primero a revisión) · **📄** = ya tiene ficha del primer Batch, sin publicar.

Hoy: **105 de antes · 110 nuevas** · 97 con ficha cargada, **0 publicadas**.


#### perro (111)

| raza | | raza | |
|---|---|---|---|
| Affenpinscher | ·nueva | Keeshond | ·nueva |
| Airedale Terrier | ·nueva | Kerry Blue Terrier | ·nueva |
| Akita Americano | ·nueva | Komondor | ·nueva |
| Akita Inu | 📄 | Kuvasz | ·nueva |
| Alaskan Malamute | ·nueva | Labradoodle | ·nueva |
| American Bully | 🐾2 📄 | Labrador retriever | 🐾16 📄 |
| American Staffordshire Terrier | ·nueva | Lhasa Apso | ·nueva |
| Basenji | ·nueva | Maltes | 📄 |
| Basset Hound | ·nueva | Mastín Español | ·nueva |
| Beagle | 🐾2 📄 | Mastín Napolitano | ·nueva |
| Bernese | 📄 | Mastín Tibetano | ·nueva |
| Bichon Frise | 📄 | Papillón | ·nueva |
| Bichón Habanero | ·nueva | Pastor alemán | 📄 |
| Bloodhound | ·nueva | Pastor Australiano | ·nueva |
| Bobtail | ·nueva | Pastor Belga | 📄 |
| Boerboel | ·nueva | Pastor de Shetland | ·nueva |
| Border Collie | 📄 | Pastor Ovejero Belga Malinois | ·nueva |
| Border Terrier | ·nueva | Pastor Suizo Blanco | ·nueva |
| Borzoi | ·nueva | Pekines | 📄 |
| Boston terrier | 📄 | Perro de Agua Español | ·nueva |
| Bouvier de Flandes | ·nueva | Perro de Montaña de los Pirineos | ·nueva |
| Boxer | 📄 | Perro Sin Pelo del Perú | ·nueva |
| Boyero de Berna | ·nueva | Pinscher | 📄 |
| Braco Alemán | ·nueva | Pinscher Miniatura | ·nueva |
| Briard | ·nueva | Pit Bull Terrier | 📄 |
| Bull Terrier | 📄 | Pointer | ·nueva |
| Bull Terrier Miniatura | ·nueva | Pomerania | 📄 |
| Bulldog francés | 📄 | Poodle | 📄 |
| Bulldog inglés | 🐾1 📄 | Presa Canario | ·nueva |
| Bullmastiff | ·nueva | Pug | 🐾1 📄 |
| Cane Corso | ·nueva | Puli | ·nueva |
| Cavalier King Charles Spaniel | ·nueva | Rhodesian Ridgeback | ·nueva |
| Charles Spaniel | 📄 | Rottweiler | 📄 |
| Chihuahua | 📄 | Salchicha | 📄 |
| Chino Crestado | ·nueva | Saluki | ·nueva |
| Chow Chow | 📄 | Samoyedo | 📄 |
| Cocker Spaniel | 📄 | Samoyedo Blanco | ·nueva |
| Cocker Spaniel Americano | ·nueva | San Bernardo | 📄 |
| Collie | 📄 | Schnauzer |  |
| Coton de Tuléar | ·nueva | Schnauzer Gigante | ·nueva |
| Criollo | 📄 | Schnauzer Miniatura | 🐾1 ·nueva |
| Dalmata | 📄 | Setter Inglés | ·nueva |
| Doberman | 📄 | Setter Irlandés | ·nueva |
| Dogo Argentino | ·nueva | Shar Pei | ·nueva |
| Dogo de Burdeos | ·nueva | Shiba Inu | 📄 |
| Fila Brasileño | ·nueva | Shih tzu | 📄 |
| Fox Terrier | ·nueva | Springer Spaniel | 📄 |
| Galgo Español | ·nueva | Staffordshire Bull Terrier | 📄 |
| Golden Doodle | ·nueva | Terranova | ·nueva |
| Golden retriever | 📄 | Vizsla | ·nueva |
| Gran Danes | 📄 | Weimaraner | 📄 |
| Gran Pirineo | ·nueva | West Highland White Terrier | ·nueva |
| Greyhound | ·nueva | Whippet | ·nueva |
| Grifón de Bruselas | ·nueva | Xoloitzcuintle | ·nueva |
| Husky Siberiano | 📄 | Yorkshire terrier | 📄 |
| Jack Russell | 📄 | | |

#### gato (26)

| raza | | raza | |
|---|---|---|---|
| Abisinio | 📄 | Gato Común | 🐾14 📄 |
| American Shorthair | 📄 | Himalayo | ·nueva |
| Azul Ruso | 📄 | Maine Coon | 🐾1 📄 |
| Balinés | ·nueva | Manx | ·nueva |
| Bengalí | 📄 | Munchkin | ·nueva |
| Birmano (Birman) | 📄 | Oriental de Pelo Corto | 📄 |
| Bombay | ·nueva | Persa | 🐾1 📄 |
| Bosque de Noruega | 📄 | Ragdoll | 📄 |
| British Shorthair | 📄 | Scottish Fold | 📄 |
| Burmés | ·nueva | Siamés | 📄 |
| Cornish Rex | 📄 | Siberiano | 📄 |
| Devon Rex | 📄 | Sphynx (Esfinge) | 📄 |
| Exotic Shorthair | 📄 | Turkish Angora (Angora Turco) | 📄 |

#### ave (15)

| raza | | raza | |
|---|---|---|---|
| Agapornis (Lovebird) | 📄 | Eclectus | 📄 |
| Amazona Frentiazul | ·nueva | Guacamayo Azul y Amarillo | 📄 |
| Cacatúa Alba | 📄 | Guacamayo Escarlata | ·nueva |
| Cacatúa Ninfa Perlada | ·nueva | Jilguero | ·nueva |
| Canario | 📄 | Loro Yaco Africano | 🐾2 📄 |
| Conuro Mejillas Verdes | 📄 | Ninfa (Cockatiel) | 📄 |
| Cotorra Argentina | ·nueva | Periquito Australiano | 📄 |
| Diamante Mandarín | 📄 | | |

#### pez (15)

| raza | | raza | |
|---|---|---|---|
| Barbo Tigre | ·nueva | Oscar | ·nueva |
| Corydora | 📄 | Pez Ángel de Agua Dulce (Escalar) | 📄 |
| Danio Cebra | ·nueva | Pez Betta (Betta splendens) |  |
| Disco | 📄 | Pez Dorado (Goldfish) | 📄 |
| Gourami Enano | ·nueva | Platy | 📄 |
| Guppy | 📄 | Pleco (Limpiavidrios) | ·nueva |
| Koi | 📄 | Tetra Neón | 📄 |
| Molly | 📄 | | |

#### conejo (13)

| raza | | raza | |
|---|---|---|---|
| Belier Francés | ·nueva | Jersey Wooly | ·nueva |
| Californian | 🐾1 📄 | Lionhead | 📄 |
| English Angora | 📄 | Mini Lop | 📄 |
| Gigante de Flandes | ·nueva | Mini Rex | 📄 |
| Holandés Enano | ·nueva | Netherland Dwarf | 📄 |
| Holland Lop | 📄 | Rex |  |
| Hotot Enano | ·nueva | | |

#### roedor (12)

| raza | | raza | |
|---|---|---|---|
| Ardilla de Tierra | ·nueva | Hámster Roborovski | ·nueva |
| Chinchilla (Chinchilla lanigera) | 🐾1 📄 | Hámster Ruso | 📄 |
| Cobaya o Cuy | 📄 | Hámster Sirio | 📄 |
| Degu | 📄 | Jerbo o Gerbil Mongol | 📄 |
| Hámster Chino | ·nueva | Rata Doméstica (Rattus norvegicus domestica) | 📄 |
| Hámster Enano de Campbell | ·nueva | Ratón Doméstico (Mus musculus domesticus) | 📄 |

#### reptil (10)

| raza | | raza | |
|---|---|---|---|
| Boa Constrictora | ·nueva | Pitón Bola |  |
| Camaleón Velado | ·nueva | Serpiente del Maíz |  |
| Dragón Barbudo |  | Tortuga de Orejas Rojas | ·nueva |
| Gecko Leopardo |  | Tortuga Mordedora | ·nueva |
| Iguana Verde | ·nueva | Tortuga Rusa |  |

#### equino (6)

| raza | | raza | |
|---|---|---|---|
| Árabe | ·nueva | Paso Fino Colombiano | ·nueva |
| Criollo | ·nueva | Percherón | ·nueva |
| Cuarto de Milla | ·nueva | Pura Sangre Inglés | ·nueva |

#### cobaya (5)

| raza | | raza | |
|---|---|---|---|
| Cobaya Abisinia | ·nueva | Cobaya Skinny | ·nueva |
| Cobaya Americana | ·nueva | Cobaya Teddy | ·nueva |
| Cobaya Peruana | ·nueva | | |

#### huron (1)

| raza | | raza | |
|---|---|---|---|
| Hurón | ·nueva | | |

#### otro (1)

| raza | | raza | |
|---|---|---|---|
| Otra especie | ·nueva | | |