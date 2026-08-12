# Cargador del catálogo de la despensa

**Qué es:** la herramienta con la que se carga el catálogo inicial de la
despensa a partir de una planilla.

**Qué NO es:** una pantalla. `MODELO_DESPENSA` §4.2 (enmienda S95-F) dice
que **el catálogo inicial v1 se carga por script**, porque con un vendedor
y tres familias esto es un seed y no una interfaz. *Construir UI sobre un
modelo que todavía se mueve es fabricar deuda.*

---

## La separación que importa

**El cargador es código. El catálogo es un archivo que llena el founder.**

Por eso el cargador se pudo escribir hoy, aunque la lista del vendedor
todavía no exista.

```
tools/carga-catalogo/
  cargar.mjs             ← el código (esto no se toca)
  catalogo.ejemplo.csv   ← la plantilla con dos filas de muestra
  README.md
```

Para cargar: se copia `catalogo.ejemplo.csv`, se reemplazan las dos filas de
muestra por las reales, y se corre.

---

## Por qué CSV y no JSON

Tres razones, y la primera manda:

1. **La lista del vendedor va a llegar como planilla.** Un CSV se abre en
   Excel o Google Sheets, se pega la lista y listo. Un JSON obliga al
   founder a escribir llaves y comillas sin equivocarse.
2. **Una fila = un producto a la venta = una llamada.** El mapeo es directo
   y el reporte puede decir «línea 14».
3. **Se revisa de a dos.** El founder y el vendedor pueden mirar la misma
   planilla; nadie revisa un JSON de a dos.

Las listas (especies, tallas, alérgenos) van **separadas por `|`**:
`perro|gato`.

---

## Cómo se usa

**Siempre se empieza en ensayo.** El modo por defecto valida todo y **no
escribe nada**.

```bash
# ① ENSAYO — no escribe
node tools/carga-catalogo/cargar.mjs mi-catalogo.csv --cuenta <uuid-de-la-cuenta>

# ② APLICAR — escribe de verdad
node tools/carga-catalogo/cargar.mjs mi-catalogo.csv \
     --cuenta <uuid-de-la-cuenta> --admin tu@correo --aplicar
```

- `--cuenta` es el id de la **cuenta comercial del vendedor**.
- `--admin` es el correo de un admin real. Hace falta **solo para
  aplicar**, porque publicar una oferta exige admin: *el vendedor propone,
  e-PetPlace publica.* Si el correo no es de un admin activo, el cargador
  frena — no lo simula.

**Correrlo dos veces no duplica nada.** Las funciones son idempotentes: la
segunda corrida actualiza en vez de crear.

---

## Las columnas

### Obligatorias — sin estas la fila se rechaza

| Columna | Qué es | Ejemplo |
|---|---|---|
| `familia` | A qué familia pertenece. **Tiene que existir en el catálogo vivo** (el script las lista al arrancar) | `alimento` |
| `marca` | Marca comercial | `Marca Ejemplo` |
| `producto` | Nombre del producto, sin la presentación | `Alimento adulto pollo` |
| `presentacion` | Cómo viene | `Bolsa 2 kg` |
| `codigo_variante` | Código corto de esta presentación. Único dentro del producto | `ADU-POLLO-2K` |
| `codigo_impuesto` | Código de la tasa. **El script lista los vivos al arrancar** | `EC_IVA_0` |
| `sku_vendedor` | El código con el que el vendedor identifica este ítem en SU sistema | `MEJ-ADU-2K` |
| `precio_venta` | Precio al que se publica, en USD | `18.90` |
| `especies` | Para qué animal es | `perro` o `perro\|gato` |
| `tallas` | Para qué tamaño | `pequeno\|mediano` |
| `momento_vital` | En qué etapa de la vida | `cachorro`, `adulto\|senior` |
| `alergenos` | Alérgenos declarados. **Si no tiene, se escribe `ninguno`** | `pollo` o `ninguno` |

### Opcionales — se pueden dejar vacías

`descripcion` · `contenido_valor` · `contenido_unidad` (`kg`, `g`, `l`,
`ml`, `unidad`) · `peso_kg` · `gtin` (código de barras) · `largo_cm` ·
`ancho_cm` · `alto_cm` · `stock` · `ingredientes` · `dieta_prescripcion`
(`si`/`no`)

> **El peso y las medidas no son opcionales de verdad:** sin ellos no se
> puede cotizar el envío. Se dejan opcionales acá para que la carga entre
> aunque falten, **pero un producto sin peso no va a poder venderse.**

---

## 🔴 La regla que gobierna el cargador

**Jamás completa un dato que falta.**

Si una fila no trae la tasa, la especie o los alérgenos, **el cargador para
y lo dice**. No pone un valor por defecto, no deduce del nombre, no copia
de la fila de arriba.

Y el caso que más importa, porque es el que parece inofensivo:

> **`alergenos` vacío se rechaza.** Una celda vacía es ambigua: puede
> querer decir «no tiene» o «no lo llené», y **las dos cosas se ven
> igual**. Para decir «no tiene» hay que escribir `ninguno`.
>
> *Un alérgeno inventado no es un error de datos: es un riesgo clínico.*
> (L-139 — el dato verosímil-falso está prohibido.)

---

## Qué reporta

Una línea por fila, con el número de línea del archivo:

```
✅ L  2 creado      Marca Ejemplo — Alimento adulto pollo · Bolsa 2 kg
         sku 3f2a91bc · oferta 88d0e412
🔄 L  3 actualizado Marca Ejemplo — Antipulgas mensual · Caja 3 pipetas
🔴 L  4 rechazado   (sin marca) — Snack dental · Bolsa 500 g
         ↳ falta codigo_impuesto
         ↳ alergenos vacío: escribí "ninguno" si el producto no tiene…
```

Si hubo algún rechazo, el proceso **termina con código distinto de cero**.

---

## Lo que hace por debajo

Cero `INSERT` directo. Por cada fila válida:

1. **`proponer_sku_vendedor()`** — crea o actualiza el producto canónico, su
   variante y el SKU del vendedor, que **nace en `propuesto`**.
2. **`publicar_oferta_sku()`** — pasa el SKU a `aceptado` y crea la oferta
   publicada.

Son **las mismas dos funciones que va a usar el vendedor desde su app**. Por
eso esta carga vale doble: deja el catálogo cargado **y** deja el camino
probado con datos reales antes de que lo toque el primer vendedor.

**Credenciales:** ninguna en el repo. Usa el CLI de Supabase ya linkeado, el
mismo canal por el que opera el resto de la casa.

---

## 🔴 Antes de la primera carga real

**Falta la cuenta comercial del vendedor.** Medido el 11-ago-2026:
`cuenta_roles` tiene 6 filas y las 6 son `prestador_servicios` —
**cero cuentas con rol `seller_productos`**.

El cargador **frena** si la cuenta que se le pasa no tiene ese rol, y **no
lo crea**: es un acto del founder, no de un script. Ver **D-758…D-763** en
`docs/DEUDAS_CANONICAS.md`.
