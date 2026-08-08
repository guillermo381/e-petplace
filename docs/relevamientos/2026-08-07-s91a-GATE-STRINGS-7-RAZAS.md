# S91 · GATE DE STRINGS — LAS 7 RAZAS DE PERRO QUE NO TIENEN NOMBRE

> **Es un gate del founder: 7 UPDATEs DESPUÉS de su firma, jamás antes.**
> Lo de abajo es una PROPUESTA con su medición. A no firma strings.
> Origen: freno de B (7-ago-2026), verificado por A contra la fuente.

## EL LITERAL DE HOY (medido en `cat_razas`, 7-ago-2026, no de memoria)

Las siete están **APAGADAS** (`activo = false`, migración `20260807200000`):
salen del catálogo para todo consumidor —el lector filtra `activo = true`—
y la fila se conserva para que la cura sea un UPDATE y no una siembra nueva.

| slug (máquina) | `nombre` HOY | imagen en el bucket |
|---|---|---|
| `bulldog-frances` | `Bulldog_Frances` | `perro/bulldog-frances.webp` |
| `bulldog-ingles` | `Bulldog_Ingles` | `perro/bulldog-ingles.webp` |
| `jack-rusell` | `Jack_Rusell` | `perro/jack-rusell.webp` |
| `labrador-retriever` | `Labrador_Retriever` | `perro/labrador-retriever.webp` |
| `pastor-aleman` | `Pastor_Aleman` | `perro/pastor-aleman.webp` |
| `shih-tzu` | `Shih_Tzu` | `perro/shih-tzu.webp` |
| `yorkshire-terrier` | `Yorkshire_Terrier` | `perro/yorkshire-terrier.webp` |

**Por qué no las escribí yo:** ese campo no es un nombre, es el nombre de la
carpeta del bucket. La forma presentable **no existe en el mapeo** —y ninguna
de las 44 razas de perro tiene acento, así que no hay de dónde sacarla—.
Derivarla es fabricar dato, que el brief prohíbe.

## LAS TRES CLASES, porque no todas piden lo mismo

**No son siete decisiones iguales.** Separarlas deja firmar rápido lo que no
tiene criterio y pensar solo lo que sí.

### ① PURO CAMBIO DE SEPARADOR — cero interpretación (3)

El guion bajo pasa a espacio y no hay nada más que decidir: ni acento, ni
ortografía, ni typo.

| slug | propuesta |
|---|---|
| `labrador-retriever` | **Labrador Retriever** |
| `shih-tzu` | **Shih Tzu** |
| `yorkshire-terrier` | **Yorkshire Terrier** |

### ② PIDEN UN ACENTO — ortografía, con una decisión de ESTILO detrás (3)

El acento no se inventa (es ortografía del español), **pero la mayúscula sí
es decisión** y hay que tomarla mirando las otras 98:

> **MEDIDO — el estilo vivo del catálogo es TITLE CASE**, con los conectores
> en minúscula: «Cacatúa Alba» · «Azul Ruso» · «Bosque de Noruega» ·
> «Oriental de Pelo Corto» · «Guacamayo Azul y Amarillo».
> **La mesa escribió «Pastor alemán»** (mayúscula de oración), que es la
> ortografía española estricta para gentilicios. **Las dos son defendibles y
> chocan: gana la que el founder firme, y la firma rige para las tres.**

| slug | (a) estilo de la casa | (b) ortografía estricta (lo que escribió la mesa) |
|---|---|---|
| `pastor-aleman` | **Pastor Alemán** | **Pastor alemán** |
| `bulldog-frances` | **Bulldog Francés** | **Bulldog francés** |
| `bulldog-ingles` | **Bulldog Inglés** | **Bulldog inglés** |

*Nota honesta: si gana (b), las 98 vivas quedan en otro estilo que estas tres
— y eso es una divergencia nueva, chica pero real. Si gana (b) **y** se
quiere coherencia, es un barrido aparte de las 98, con su propio gate.*

### ③ PIDE CRITERIO DE VERDAD — un typo y un nombre incompleto (1)

| slug | hoy | qué le pasa |
|---|---|---|
| `jack-rusell` | `Jack_Rusell` | **Russell va con dos eses** (typo del archivo original) **y el nombre completo de la raza es «Jack Russell Terrier»** |

- **Propuesta mínima:** **Jack Russell** — corrige el typo y nada más.
- **Propuesta completa:** **Jack Russell Terrier** — el nombre real de la
  raza; consistente con que el catálogo ya escribe «Yorkshire Terrier» y
  «English Angora» completos.
- **Voto de A:** la completa. *Pero es criterio, no ortografía — por eso
  sube.*

## ⚠️ EL SLUG NO CAMBIA, Y ESTO NO ES UN OLVIDO

`jack-rusell` conserva su typo **a propósito**: el slug es clave de máquina y
**apunta al objeto real del bucket** (`perro/jack-rusell.webp`). Renombrarlo
obliga a renombrar el objeto y a re-generar su fila — trabajo de la familia
D-684 (la galería), no de un gate de strings. **El humano lee `nombre`; el
slug no se muestra nunca.**

## EL SQL, LISTO PARA CORRER DESPUÉS DE LA FIRMA

*(No aplicado. Entra como migración propia cuando el founder firme, con las
opciones elegidas sustituidas.)*

```sql
BEGIN;

UPDATE public.cat_razas SET nombre = 'Labrador Retriever', activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'labrador-retriever';
UPDATE public.cat_razas SET nombre = 'Shih Tzu',           activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'shih-tzu';
UPDATE public.cat_razas SET nombre = 'Yorkshire Terrier',  activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'yorkshire-terrier';

-- ② con la opción FIRMADA (acá va (a) o (b), no las dos)
UPDATE public.cat_razas SET nombre = 'Pastor Alemán',      activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'pastor-aleman';
UPDATE public.cat_razas SET nombre = 'Bulldog Francés',    activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'bulldog-frances';
UPDATE public.cat_razas SET nombre = 'Bulldog Inglés',     activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'bulldog-ingles';

-- ③ con la opción FIRMADA
UPDATE public.cat_razas SET nombre = 'Jack Russell Terrier', activo = true, updated_at = now()
 WHERE especie = 'perro' AND slug = 'jack-rusell';

-- El CHECK que hoy vive NOT VALID pasa a valer para TODAS las filas: ya no
-- queda ninguna con nombre de archivo. Si algo quedó roto, esto rebota.
ALTER TABLE public.cat_razas VALIDATE CONSTRAINT chk_cat_razas_nombre_presentable;

COMMIT;
```

**Cinturón que acompaña esa migración:** `98 → 105 activas` y `0 apagadas`.

## LO QUE CUESTA LA ESPERA, dicho sin maquillar

Las siete están entre **las razas de perro más comunes**. Hasta la firma, el
tipeo predictivo del alta no las sugiere. **Nada se rompe**: por la letra de
D-379 la raza viaja TEXTO LIBRE, así que el dueño escribe «Pastor Alemán» y
se guarda tal cual. Lo que se pierde es la sugerencia con su foto, justo en
los casos más frecuentes. *Es el costo correcto: 98 nombres verdaderos valen
más que 105 donde siete los inventamos nosotros.*
