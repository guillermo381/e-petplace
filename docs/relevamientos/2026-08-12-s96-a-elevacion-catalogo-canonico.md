# ELEVACIÓN A LA MESA — EL TAMAÑO DE SEPARAR EL CATÁLOGO CANÓNICO DE LA OFERTA DEL VENDEDOR (S96 · pista A · 12-ago-2026)

> **Qué es:** la medición que la firma del founder ordenó ANTES de migrar —
> *«el catálogo canónico es de e-PetPlace; del vendedor se prende
> disponibilidad. Hoy `proponer_sku_vendedor` los mezcla. Elevá el tamaño de
> esa separación antes de migrarla.»* Esto NO migra nada: mide y sirve
> opciones con voto.

## 1 · Lo que hay hoy, medido del cuerpo vivo

`proponer_sku_vendedor` (S95-F, ~200 líneas) hace TRES cosas en un acto:

1. **① Upsert del producto CANÓNICO** (`productos`): nombre, marca,
   composición, alérgenos, especies — con `ON CONFLICT … DO UPDATE` que
   **pisa el canónico** (`alergenos = EXCLUDED.alergenos`, especies/momentos
   si vienen no-vacíos, descripción por coalesce).
2. **② Upsert de la variante** (`producto_variantes`): presentación,
   contenido, impuesto — mismo patrón de pisado parcial.
3. **③ Upsert del SKU del vendedor** (`vendedor_skus`): su código, su precio
   propuesto, su stock — lo que SÍ es del vendedor.

**La violación de modelo:** cualquier cuenta con rol `seller_productos`
que "proponga" un producto cuyo (familia, marca, nombre) coincide con uno
existente **REESCRIBE el canónico** — composición y alérgenos incluidos.
Con UN vendedor (hoy) es teórico; **con el segundo vendedor es un vendedor
editándole la ficha clínica de la vitrina al otro.** Y D-780 es el mismo
defecto visto por el lado del stock.

**Lo que S96 ya decidió sin prejuzgar esta separación:** el estado y el
mercado de composición (`verificada` solo admin), el vocabulario de
alérgenos con trigger, y `ofertas.cuenta_comercial_id` derivada — todos
REFUERZAN la frontera (la curaduría quedó gated), pero **la puerta ① sigue
abierta**: un vendedor todavía pisa nombre/especies/descr del canónico, y su
alergenos (aunque validado contra vocabulario) sigue siendo escribible.

## 2 · El tamaño, por opción

### Opción A — LA SEPARACIÓN AHORA, antes de la carga del catálogo real (mi voto)

Partir la puerta en dos:

- **`proponer_producto_canonico(...)`** — SOLO e-PetPlace (`is_admin`).
  Único escritor de `productos` + `producto_variantes`. Es el cuerpo actual
  ①+② con un gate nuevo (cirugía chica: se corta, no se reescribe).
- **`proponer_sku_vendedor(...)`** se ANGOSTA a MAPEO: recibe `variante_id`
  (o un identificador de matching), valida que exista, y escribe SOLO
  `vendedor_skus`. **Sumar un vendedor pasa a ser mapeo, no autoría** — la
  letra de la firma, literal. De paso **D-780 muere acá** (el stock del
  upsert ③ pasa por `ajustar_stock_vendedor`/`carga_inicial`).
- Cargador: corre como admin — llama canónico + mapeo en la misma tanda
  (cambio de destino, no de arquitectura). Contrato: la firma de `proponer`
  CAMBIA ⇒ es elevación de contrato… pero **cero consumidores de pantalla
  hoy** (medido: el único caller vivo es el cargador; la pantalla del
  vendedor que proponga desde la app NO existe todavía).

**Costo estimado: UNA tanda de pista A** — 1 migración (dos funciones + gate
+ cinturón con el caso «segundo vendedor no pisa el canónico») + cargador +
juez (invariante: `productos` sin escritor no-admin) + contrato + D-780
cerrada. Sin backfill (el catálogo vivo ya es autoría `epetplace`).

**Por qué AHORA es más barato que después:** la carga real (456 filas) es el
acto que multiplica el costo — cargar con la puerta vieja crea cientos de
canónicos con la autoría mezclada Y deja viva la ventana en la que la carga
misma podría pisar algo curado a mano (estado de composición ya se protegió;
nombre/especies/descripcion no).

### Opción B — Después de la carga inicial

Misma migración + **una pasada de saneo de autoría** sobre lo cargado + el
riesgo de la ventana abierta durante la carga. Costo: la misma tanda + el
saneo. No compra nada a cambio.

### Opción C — No separar en v1 (statu quo + disciplina)

Gratis hoy; deja la frontera de §7.4-catálogo sostenida en que el único
vendedor es de pruebas. **Se vuelve mala retroactivamente con el segundo
vendedor** — la clase exacta de decisión que L-228 enseña a no conservar
por inercia.

## 3 · Lo que la separación NO toca (para dimensionar bien)

`publicar_oferta_sku` (ya es de e-PetPlace) · el flujo de pedidos entero ·
las pantallas de C/D (consumen wrappers de lectura) · `adjuntar_fotos_producto`
y `declarar_composicion_estado` (ya tienen el gate correcto: admin o
vendedor-con-SKU, que en el mundo separado sigue siendo el predicado justo
para PROPONER — la publicación del canónico es de e-PetPlace igual).

## 4 · Voto de la pista A

**Opción A, antes de la carga del catálogo real.** La carga está BLOQUEADA
por el vocabulario de alérgenos de todos modos (ya resuelto en M15/M16 —
falta la recategorización de Cowork): la ventana existe y es exactamente del
tamaño de una tanda.

— pista A, 12-ago-2026. **Espera firma del founder; nada de esto migró.**
