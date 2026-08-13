# S97-A · La carga del catálogo maestro — ejecutada (13-ago-2026)

**Fuente:** `~/Downloads/Catalogos/catalogo_INTERNO_epetplace_ENRIQUECIDO.xlsx`
(el archivo del founder, 12-ago). **Puerta única:** todo por
`proponer_producto_canonico` (admin) + `declarar_composicion_estado` +
`adjuntar_fotos_producto` — **cero INSERT directo al maestro**. 9 lotes,
**497/497 filas, cero fallos** (verificado contra el objeto: 497 variantes
`INT-*` vivas).

## El resultado, medido

| medida | antes | después |
|---|---|---|
| productos en el maestro | 11 | **442** |
| variantes | 11 | **508** |
| por familia | — | alimento 272 · antiparasitario 103 · suplemento 67 |
| composición | — | `declarada_sin_verificar` 190 · `ausente` 251 · `no_aplica` 1 · **`verificada` 0** |
| con foto (portada) | 0 | **157** |

**Los SEIS del lanzamiento (§4.3): duros, completos, SIN duplicar.** El
archivo los nombra distinto de la base («PUPPY POLLO-ARROZ» vs «Puppy Pollo
y Arroz») — cargar ciego habría creado seis duplicados; se mapearon a la
**identidad medida** de §4.3 y quedaron **enriquecidos en su lugar**:
ingredientes (12 c/u) · foto · variantes nuevas (el Puppy ahora 4
presentaciones) · **alérgenos curados INTACTOS** (el `ON CONFLICT` pisa
`alergenos` siempre — se les pasó la lista curada a propósito).

## Los hallazgos, con su literal — decisiones de MESA pendientes

1. **🔴 El vocabulario de alérgenos se queda corto contra el catálogo
   real.** Tokens del archivo SIN casillero en `cat_alergenos` (23), con su
   conteo: **gluten 119 · trigo 118 · maiz 110 · huevo 46 · lacteos 23 ·
   cereales 19 · mani 4 · frutos secos 4**. NO se agregaron por script:
   ampliar el vocabulario es un INSERT *más sus RELACIONES* (¿gluten es_un
   trigo? ¿cereales puede_ser maiz/trigo/cebada?) — decisión clínica de
   mesa, no de cargador. **Sin riesgo de silencio mientras tanto:** ningún
   producto entró `verificada`, así que toda familia alérgica ve la voz ②.
   (Y el límite simétrico: nadie puede declarar una mascota alérgica a
   trigo hoy — el vocabulario acota los dos lados.)
2. **49 filas con frase en vez de tokens** («proteína nombrada en el
   producto», «línea grain-free») — derivar el alérgeno del NOMBRE está
   prohibido (corolario de §6: la advertencia se dispara por composición,
   jamás por nombre) ⇒ entraron con `alergenos=[]` y composición no
   verificada (voz ②). Los seis mapeados son la excepción: su lista curada
   ya existía medida.
3. **30 filas NO cargadas, ninguna en silencio:** 10 `higiene` (familia
   INACTIVA — TOW fuera de v1) · 7 `heno` · 8 `acondicionador_agua` · 4
   `sustrato` (familias que NO existen en `cat_familias_producto`) · 1 sin
   marca/nombre. Crear familias nuevas es gobierno del catálogo — mesa.
4. **Datos del archivo SIN columna en el maestro (no entraron, hueco
   declarado):** análisis garantizado (proteína/grasa/fibra/humedad %) ·
   kcal/kg · ración calculada · y del lado antiparasitarios/suplementos:
   **principio_activo · concentración · periodicidad · vía · espectro ·
   contraindicaciones · edad mínima · requiere_receta ·
   registro_agrocalidad**. Para esas dos familias eso ES la ficha del
   producto — el maestro hoy no tiene dónde ponerlo.
5. **D-767 disparada: la forma de `imagenes` quedó DECIDIDA por la primera
   carga real** — `["url", …]`, array de strings, la primera es la portada
   (la forma de `adjuntar_fotos_producto`). Falta el `COMMENT` en la
   columna (migración de la próxima tanda de DB).

## Reproducibilidad

Extractor + generador + 9 lotes en el scratchpad de la sesión
(`catalogo-extraido.json`, `carga-lote-*.sql`). Idempotente: re-proponer
actualiza (`ON CONFLICT`), no duplica.
