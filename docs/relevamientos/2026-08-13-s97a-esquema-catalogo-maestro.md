# S97-A · El esquema del catálogo maestro — MEDIDO, para que C cablee sin inventar

**Orden de mesa (13-ago, PASO 0).** Todo lo de abajo es del objeto
(`information_schema` + `pg_constraint` + `pg_indexes` + cuerpos de función),
no de la letra. **Conclusión primero: el esquema M21 YA ES la separación
maestro/oferta que el archivo del founder traza — lo que falta es el DATO
(hoy 11 productos vivos), no las tablas.**

## ① EL MAESTRO — existe (M21, S96)

**`productos`** (el producto canónico — lo que no cambia porque lo venda otro):
`id, nombre, imagen_url, descripcion, created_at, estado, imagenes,
updated_at, familia_codigo, marca, especies_aplicables, tallas_aplicables,
momentos_aplicables, ingredientes_activos, alergenos, es_dieta_prescripcion,
origen_carga, creado_por, composicion_estado, composicion_mercado`

- **La familia ES columna de primera clase:** `familia_codigo` → FK a
  `cat_familias_producto`. **Las tres que la configuración necesita YA
  EXISTEN ACTIVAS**, con estos códigos exactos (C: cablear contra esto, no
  inventar):

  | código | nombre | estado |
  |---|---|---|
  | `alimento` | Alimento | activo |
  | `antiparasitario` | Antiparasitarios | activo |
  | `suplemento` | Suplementos | activo |
  | `dieta_prescripcion` | Dieta de prescripción | activo |
  | `accesorio` · `cama` · `higiene` · `juguete` | — | **INACTIVAS** (fuera del alcance v1) |

- **El estado de composición viaja con el producto:** `composicion_estado`
  (`verificada · declarada_sin_verificar · ausente · no_aplica`) +
  `composicion_mercado` (la ficha del PAÍS). Es lo que decide la voz de
  alergia (MODELO_DESPENSA §6, cuarta enmienda).
- **Los lugares de enriquecimiento existen desde el día uno, aunque lleguen
  vacíos:** `imagenes` (jsonb — múltiples fotos, forma pendiente D-767) ·
  `descripcion` (larga) · `ingredientes_activos` (componentes).
- **⚠️ Hueco declarado, no inventado:** el análisis garantizado
  (proteína/grasa/fibra %), kcal/kg y ración **no tienen columna**. El
  archivo del founder los trae; entran cuando tengan lugar decidido — no se
  fabrican columnas en esta pasada.

**`producto_variantes`** (la presentación): `producto_id, codigo,
presentacion, contenido_valor, contenido_unidad, peso_kg, gtin,
impuesto_codigo, activo, largo_cm, ancho_cm, alto_cm` ·
`UNIQUE (producto_id, codigo)`. *Sin peso no se cotiza envío — opcional de
carga, obligatorio de venta.*

## ② LA OFERTA — existe, y dos vendedores son expresables SIN duplicar (medido, no supuesto)

**`vendedor_skus`** (el MAPEO del vendedor al maestro): `cuenta_comercial_id,
variante_id, sku_vendedor, precio_propuesto, estado (nace 'propuesto'),
stock_disponible, stock_reservado, origen_carga, propuesto_por/en,
revisado_por/en, motivo_rechazo…`

- **`UNIQUE (cuenta_comercial_id, variante_id)`** — N cuentas pueden mapear
  LA MISMA variante: *un segundo vendedor con los mismos productos no
  escribe nada en el maestro; prende disponibilidad contra los mismos
  identificadores.* Expresable por construcción.
- **`UNIQUE (cuenta_comercial_id, sku_vendedor)`** — el SKU propio del
  vendedor, por cuenta.

**`ofertas`**: `variante_id, sku_id, precio, estado, publicado_por,
cuenta_comercial_id…` con el candado de §4.1 medido:
**`uq_oferta_publicada_por_variante` — UNIQUE (variante_id) WHERE
estado='publicada'**. La vitrina curada: N mapeos, UNA oferta publicada.

## ③ LA PUERTA DE PROPOSICIÓN — existe (corrección de premisa por medición)

La orden decía «hoy no existe». **Existe desde M21/S95-F**, con dos brazos:

- **`proponer_sku_vendedor(cuenta, producto jsonb, variante jsonb, sku
  jsonb, origen)`** — el vendedor propone; si el producto no está en el
  maestro **nace ahí en `propuesto`** y su vínculo también; al aprobarse
  (`publicar_oferta_sku`, solo admin) queda disponible para todos.
- **`proponer_producto_canonico(producto jsonb, variante jsonb)`** —
  e-PetPlace autora directo (admin).
- **El maestro no lo escribe una app:** puerta única — el cargador de
  `tools/carga-catalogo/` llama estas funciones, **cero INSERT directo**
  (104-vs-1 de S95-F como precedente).

## El archivo del founder — localizado y censado

`~/Downloads/Catalogos/catalogo_INTERNO_epetplace_ENRIQUECIDO.xlsx`
(12-ago-2026): **CATALOGO 244** (50 cols, enriquecido: ingredientes,
análisis, kcal, ración calculada, fotos) · **ANTIPARASITARIOS 103** ·
**SUPLEMENTOS 60** · **OTRAS_ESPECIES 120** — headers en fila 4, código de
colores en LEEME (verde=fuente pública · azul=calculado · naranja=hueco
declarado · rojo=advertencia · **crema=lo llena el vendedor: precio, SKU,
stock** — la separación PRODUCTO_CANONICO / OFERTA_VENDEDOR trazada por el
propio archivo). El LEEME declara: 187/244 con ingredientes, 188/244 con
`base_alergeno`, raciones originales GENÉRICAS marcadas «no usar en la app».

## Los guards de la carga (vigentes en el motor, medidos)

- `cat_alergenos` (23) + `cat_alergeno_relaciones` con trigger de parejas
  prohibidas: **pollo/pavo/pato jamás se agrupan** (solo vía
  `ave_no_especificada —puede_ser→`). Los **80 «proteínas de ave»** entran
  con `alergenos=['ave_no_especificada']` + composición no verificada ⇒
  **voz ② (vacío), jamás aptos**.
- El vocabulario rebota alérgenos fuera de catálogo (trigger) — el cargador
  **jamás completa un dato que falta** (`alergenos` vacío se rechaza; se
  escribe `ninguno`).

## El plan de carga (orden firmado)

1. **Los SEIS del lanzamiento (§4.3), completos de punta a punta** —
   enriquecer los que ya viven (son 6 de los 11 productos actuales) con la
   ficha del archivo. Duros con los seis.
2. **El resto (~521) entra con su estado tal cual está** — blandos:
   `declarada_sin_verificar` si trae ingredientes, `ausente` si no; huecos
   naranjas quedan huecos.
3. Todo por `proponer_producto_canonico` (admin) + `declarar_composicion_estado`
   — puerta única, cero INSERT directo al maestro.
