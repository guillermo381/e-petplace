# S95-H · ELEVACIÓN — el vendedor de pruebas no tiene puerta

> **12 ago 2026 · Pista H.** Territorio: `tools/carga-catalogo` ·
> `docs/relevamientos`. **Cero migraciones, cero escrituras de esquema.**
>
> **Qué pasó, en una línea:** la pista salió a crear la cuenta de pruebas y
> a sembrar el catálogo, y midió que **tres de las cuatro piezas que
> necesita no tienen función que las cree**. Se frena y se eleva a la
> Pista G, como manda la regla.

---

## 1. LO QUE SE MIDIÓ — el censo de puertas

Se buscó **por CUERPO de función, no por nombre** (un censo por nombre no
ve lo que se llama distinto):

```sql
-- ¿qué función escribe cuenta_roles / reglas_envio / vendedor_bodegas?
WHERE pg_get_functiondef(p.oid) ~* '(insert into|update)\s+(public\.)?(…)'
```

| Pieza | ¿Hay función? | Medido |
|---|---|---|
| Cuenta comercial | **SÍ** — `crear_cuenta_comercial_inicial()` | Crea la fila, estado `pendiente_validacion` |
| **Rol `seller_productos`** | **🔴 NO** | Las únicas dos funciones que escriben `cuenta_roles` son `crear_prestador_inicial` e `invitar_prestador`, **y las dos insertan `prestador_servicios`** |
| **Regla de envío** | **🔴 NO** | **Cero** funciones escriben `reglas_envio` |
| **Bodega del vendedor** | **🔴 NO** | **Cero** funciones escriben `vendedor_bodegas` |

**Estado de los datos al momento de medir:**

```
productos 0 · producto_variantes 0 · vendedor_skus 0 · ofertas 0
reglas_envio 0 · vendedor_bodegas 0
cuenta_roles: 6 filas, las 6 `prestador_servicios` · seller_productos: 0
```

> **La consecuencia:** sin rol de vendedor no entra catálogo; sin catálogo
> no hay pedido; sin regla de envío el motor **se niega a cotizar** (y hace
> bien: `sin_regla_envio`, medido). **Es una cadena, y la primera pieza no
> existe.**

---

## 2. LO QUE LA PISTA G TIENE QUE CONSTRUIR

Tres puertas. Las tres con la forma de la casa: `SECURITY DEFINER`,
`search_path` fijo, gate en el cuerpo, error tipado, idempotentes.

### 2.1 Otorgar el rol de vendedor a una cuenta

```
otorgar_rol_vendedor(p_cuenta_comercial_id uuid, p_metadata jsonb) → jsonb
```

- Gate: **`is_admin()` y nada más.** Nadie se hace vendedor solo.
- Inserta en `cuenta_roles`: `tipo_actor = 'seller_productos'`,
  `estado = 'activo'`, `activado_en = now()`.
- **Idempotente:** si el rol ya existe activo, no-op que responde bien.
- Rechazos hablados: cuenta inexistente · cuenta `cerrada`.

> ⚠️ **Enum medido: el label es `seller_productos`, NO `vendedor`.**

### 2.2 La regla de envío

```
fijar_regla_envio(p_cuenta_comercial_id uuid, p_tipo text,
                  p_parametros jsonb, p_country_code text) → jsonb
```

- Gate: `is_admin() OR es_vendedor_de(cuenta)`.
- El `tipo` **sale de `cat_tipos_regla_envio`** y tiene que estar activo.
- **Idempotente por `(cuenta, country_code, tipo)`.**

**El contrato de `parametros` está medido, leyendo `cotizar_envio_despensa`:**

| tipo | claves que el motor lee |
|---|---|
| `plana` | `monto` |
| `gratis_sobre_umbral` | `umbral` · `monto_bajo_umbral` |

**La fila firmada por el founder para el vendedor de pruebas:**

```json
tipo: "gratis_sobre_umbral"
parametros: { "umbral": 0, "monto_bajo_umbral": 0, "pagado_por": "vendedor" }
country_code: "EC" · moneda: "USD" · prioridad: 100 · activo: true
```

*Por qué `gratis_sobre_umbral` con umbral 0 y no `plana` con monto 0: el
día que el vendedor ponga un mínimo de compra, es cambiar un número — no
cambiar de tipo.*

> **🔴 HALLAZGO SOBRE `pagado_por`, para que nadie lo dé por resuelto:**
> `pagado_por` **no es columna de `reglas_envio` y el cotizador no lo lee**.
> Viaja adentro de `parametros`, y el motor lo devuelve entero en
> `parametros_aplicados`. O sea: **hoy `pagado_por` es documentación que
> viaja en el dato, no una regla que el motor haga cumplir.** Alcanza para
> que la liquidación lo pueda leer, que era el objetivo; **no alcanza para
> impedir que alguien escriba una regla sin declararlo.** Si eso importa,
> es un CHECK, y es de G.

### 2.3 La bodega

```
crear_bodega_vendedor(p_cuenta_comercial_id uuid, p_nombre text,
                      p_ciudad text, …) → jsonb
```

- Gate: `is_admin() OR es_vendedor_de(cuenta)`.
- `crear_pedido_despensa` **recibe `p_bodega_id`**: sin bodega no hay pedido.
- Defaults que ya trae la tabla y no hay que inventar: `horas_preparacion`
  24 · `dias_operacion` L-V · `zona_horaria` `America/Guayaquil`.

---

## 3. 🔴 LOS DATOS QUE **NO** SE INVENTARON

### 3.1 La identificación fiscal

`crear_cuenta_comercial_inicial` valida la identificación contra una
**máscara regex** de `cat_paises`. Medida para EC:

```
persona_natural           ^\d{10}$
persona_juridica          ^\d{13}$
persona_natural_obligada  ^\d{13}$
entidad_sin_fines_lucro   ^\d{13}$
```

**No se inventó ningún RUC.** Cualquier número de 13 dígitos que pase la
máscara **puede pertenecer a una empresa real** — y la cuenta de pruebas
quedaría con el RUC de un tercero.

**Recomendación para la cuenta de pruebas:** usar un número que **pase la
máscara y sea inconfundiblemente falso**, del tipo `9999999999999`, con
`razon_social` y `nombre_comercial` que digan que es de pruebas
(p. ej. `VENDEDOR DE PRUEBAS — NO ES UN COMERCIO REAL`). **La decisión es
del founder, no del script.**

### 3.2 Presentaciones, códigos, SKU y precios

**Son datos del vendedor y no se inventaron.** La semilla se entrega
**pre-llenada en lo defendible y VACÍA en lo que es del vendedor**
(ver §4).

---

## 4. LA SEMILLA — qué entra y qué NO

Archivo: **`tools/carga-catalogo/catalogo-semilla-s95h.csv`**

**Siete productos**, todos marcados `NO VERIFICADO CONTRA ENVASE`:

| Producto | Por qué el alérgeno es afirmable |
|---|---|
| Pro Pac Puppy **Pollo y Arroz** | proteína y cereal en el nombre |
| Pro Pac Puppy **Cordero y Arroz** | ídem |
| Pro Pac Puppy **Pescado y Papa** | ídem |
| Taste of the Wild **Salmón** | línea sin grano + proteína nombrada |
| Taste of the Wild **Bisonte y Venado** | ídem |
| Taste of the Wild **Trucha y Salmón** (felino) | ídem |
| Royal Canin **Hypoallergenic Canine** | proteína hidrolizada por diseño de línea |

> **🔴 EL SÉPTIMO ES DISTINTO A LOS SEIS PRIMEROS, y conviene que se sepa
> antes de firmarlo.** En los seis primeros la declaración es una
> **PRESENCIA** («contiene pollo») derivada del nombre — eso es sólido. En
> Royal Canin Hypoallergenic la declaración es una **AUSENCIA** («ninguno»),
> y una ausencia es otra clase de afirmación: se apoya en el diseño de la
> línea, no en el nombre del producto.
>
> Se cargó como `ninguno` porque es lo que hace que un veterinario la
> recete, **pero es el único de los siete que no se puede defender leyendo
> la etiqueta**. Si el founder prefiere sacarlo hasta verificar el envase,
> es una línea del CSV.

**El resto NO se cargó.** *Un alérgeno verosímil-falso en un producto que
la app le recomienda a un perro alérgico es un riesgo clínico, no un dato
faltante* (L-139).

### 4.1 Lo que el founder tiene que completar

El ensayo corrido sobre la semilla devuelve **7 rechazados**, y la lista
de motivos **es exactamente su lista de tareas** — cuatro columnas por
fila, todas dato del vendedor:

```
↳ falta presentacion      (ej. "Bolsa 15 kg")
↳ falta codigo_variante   (ej. "PP-PUPPY-POLLO-15K")
↳ falta sku_vendedor      (el código del vendedor en SU sistema)
↳ falta precio_venta
```

Y dos columnas opcionales que **en la práctica no lo son**: `peso_kg` y
las medidas. Sin peso **no se puede cotizar el envío**, así que un producto
sin peso entra al catálogo y no se puede vender.

### 4.2 🔴 EL PRODUCTO CON IVA 15 % NO SE PUDO CARGAR

El pedido era cargar una **arena de gato** en la familia `higiene` con
`EC_IVA_15`, para probar que el catálogo de tasas funciona de verdad y no
es un 0 % disfrazado de sistema.

**Medido: la familia `higiene` existe y está `activo = false`**, con motivo
escrito en la propia fila:

> *«Fuera de v1 (MODELO_DESPENSA §11.3, en evaluación al 15-sep). No
> alimenta el expediente.»*

Lo mismo `juguete`, `accesorio` y `cama`. **Las cuatro están apagadas por
una decisión de alcance firmada**, y `proponer_sku_vendedor` rechaza
familias inactivas con `familia_desconocida` — correctamente.

**No se forzó, y no se sustituyó por un producto inventado.** Asignar
`EC_IVA_15` a un antiparasitario cualquiera habría sido afirmar el
tratamiento tributario de un producto que nadie verificó — el mismo error
que la disciplina de alérgenos existe para evitar, con otra ropa.

**Las dos salidas, y las dos son del founder:**

1. **Reactivar `higiene` para v1** — es cambiar `activo` a `true` en
   `cat_familias_producto`. **Es una decisión de alcance contra §11.3, no
   un arreglo técnico.**
2. **Que el vendedor real nombre un producto suyo que tribute 15 %** y
   entre por una familia activa.

**Lo que sí quedó probado sin producto de por medio:** el cargador **lee
los códigos de tasa vivos de la base** y **rechaza los que no existen**
(`codigo_impuesto "XX_IVA_99" no existe o no está activo`, medido). Lo que
**no** quedó probado es un pedido real cuyo total use una tasa distinta de
cero.

---

## 5. EL E2E — corrido, y su rojo NO era suyo

Se corrió `scripts/verify-despensa-e2e-s95e.mjs` (leído, **no
modificado**: es territorio ajeno).

**Resultado: 25 checks en verde + 1 FALLO en el desmontaje.**

```
✗ RESIDUO 0 — expediente 295→295 · pedidos 1→3 · fixtures 0/0/0
```

**El rojo se midió antes de reportarlo, y no era del E2E.** Los pedidos de
más resultaron ser `__sonda_sup_s95g-1…6`, creados **03:23–03:24, mientras
el E2E corría** — son las sondas de la Pista G. Verificado después:

```
pedidos con prefijo del E2E (__e2e_s95e) ......... 0
productos / vendedor_skus con prefijo del E2E .... 0 / 0
pedidos TOTAL (tras la limpieza de G) ............ 0
```

> **El E2E no dejó un solo residuo propio.** Lo que falló es **su check de
> residuo, que cuenta pedidos GLOBALMENTE en vez de contar los suyos por
> prefijo** — y por eso no es seguro con otra pista escribiendo la base al
> mismo tiempo. Con tres pistas vivas, ese check va a seguir dando rojos
> falsos.
>
> **Es enmienda de una línea y es de quien lo tenga en su territorio: que
> cuente `WHERE numero_orden LIKE '%__e2e_s95e%'` en vez de `count(*)`.**

**Y una nota de método propia, porque el error fue evitable:** correr un
gate que monta y borra fixtures **mientras G escribe la base** era pedir
exactamente esta colisión. La instrucción de correrlo estaba en el brief;
la colisión igual es previsible y se declara.

### 5.1 Lo que el E2E prueba y lo que NO

**Prueba** el camino entero —vitrina, búsqueda, recomendación con exclusión
por alergia, cotización, pedido, pago idempotente, empaque con lote,
despacho, entrega y depósito al expediente— **sobre un fixture que él mismo
monta y destruye.**

**No prueba** que funcione con **catálogo real y vendedor persistente**,
que es justo lo que H.4 venía a hacer. **Ese ensayo sigue pendiente y
depende de §2.**

---

## 6. QUÉ FALTA PARA QUE EL VENDEDOR REAL REEMPLACE A LA CUENTA DE PRUEBAS

1. **Las tres funciones de §2** (Pista G).
2. **La decisión del founder sobre la identificación fiscal de pruebas**
   (§3.1) — y su reemplazo por el RUC real cuando el vendedor lo entregue.
3. **Las cuatro columnas de vendedor** en el CSV (§4.1).
4. **La resolución del 15 %** (§4.2).
5. **Y el paso que no es de nadie de estas tres pistas:** que el vendedor
   real exista como cuenta con sus datos fiscales verdaderos. La cuenta de
   pruebas **está diseñada para ser borrada**, no para renombrarse: su RUC
   es falso y su razón social dice que lo es.

---

## 7. QUÉ NO SE PUDO MEDIR

1. **Si las tres funciones de §2 alcanzan.** El diseño se dedujo de leer
   `crear_pedido_despensa` y `cotizar_envio_despensa`; **no se construyó
   nada, así que no se ejerció nada.**
2. **Si `pendiente_validacion` alcanza para vender.** `_cuenta_es_vendedora`
   y `es_vendedor_de` **no miran el estado de la cuenta** (medido). No se
   midió si algún otro punto del motor lo exige `activa` — y si lo exige,
   hace falta una cuarta puerta para activar.
3. **El E2E con catálogo real.** Bloqueado por §2.
4. **El tratamiento tributario real de ninguno de los siete productos.** Se
   usó `EC_IVA_0` siguiendo el criterio del brief; **no se verificó contra
   factura del vendedor.** Es dato de él.
5. **Si los alérgenos declarados coinciden con el envase.** Los siete van
   marcados `NO VERIFICADO CONTRA ENVASE` a propósito.
