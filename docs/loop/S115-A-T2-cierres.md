# S115-A · TANDA 2 — LOS TRES CIERRES DE LA T1, LA FIRMA DEL PRECIO Y LA MEDICIÓN

**Punta de `main` al abrir:** `edc4b49c` (leída con `git ls-remote --heads origin main`).
**Nada publicado.** El recorrido en aparato es al final de la tanda 3.

---

# ⓪ LOS TRES CIERRES

## ⓪.1 · Los cuatro grants huérfanos — YA ESTABAN CERRADOS, y el número correcto es otro

Medido AHORA, con **los cuatro privilegios** que E usó (yo en la T1 había mirado sólo
`SELECT` e `INSERT` — su instrumento era más ancho que el mío):

| objeto | S | I | U | D | RLS | policies |
|---|---|---|---|---|---|---|
| `documentos_fiscales` | ✗ | ✗ | ✗ | ✗ | sí | 4 |
| `facturas` (vista compat) | ✗ | ✗ | ✗ | ✗ | — | 0 |
| `fiscal_emisor` | ✗ | ✗ | ✗ | ✗ | sí | 1 |
| `fiscal_sequences` | ✗ | ✗ | ✗ | ✗ | sí | **0** |
| `pagos_desglose_lineas` | ✗ | ✗ | ✗ | ✗ | sí | 1 |
| `tarifas_iva_historial` | ✗ | ✗ | ✗ | ✗ | sí | 1 |
| `tax_profiles` | ✗ | ✗ | ✗ | ✗ | sí | 3 |

**No hay discrepancia con E: son dos momentos.** E midió sobre `f3737db6`, anterior a que
se aplicara `20260912320000_s115a_anon_fuera_de_lo_fiscal`. Su tabla era cierta cuando la
tomó.

### 🔴 Pero E y yo medimos con una LISTA DE NOMBRES, y eso mide la lista

Censo **por esquema**, no por lista:

```
objetos de public con escritura (INSERT/UPDATE/DELETE) para anon ....... 218
  ...de un total de tablas+vistas en public ............................ 365
  ...con RLS APAGADA (riesgo real) ..................................... 12  ← las 12 son VISTAS
  ...con policy no-SELECT que alcanza anon/public ....................... 5
```

⇒ **Los cuatro de E no eran especiales: es la condición de TODA la casa** (default
privileges de Supabase sobre `public`). Lo que hizo el REVOKE fue volver a mis siete
objetos **la excepción, no la regla**.
**Es heredado y NO lo toqué**: 218 objetos es una pasada propia, con censo de consumidores
y su discriminador — exactamente lo que S92 hizo para funciones. Va como hallazgo, no como
cura a medias. *(La medición de si esas 12 vistas son `security_invoker` y escribibles
quedó **sin terminar**: la consulta a `information_schema.views` colgó a los 120 s y no la
reintenté — se declara en vez de rellenarla.)*

## ⓪.2 · `sonda-sri-s115` — no está, y lo que importa es CÓMO lo sé ahora

**Medido hoy, dos vías independientes:**

```
functions list → 45 funciones · control positivo OK (incluye las 5 conocidas)
                 sonda-sri-s115 en la lista: False
endpoint       → sonda-sri-s115        http=404
CONTROL+         fiscal-reconciliar    http=401   (existe, y su guard corta)
CONTROL−         inventada-no-existe   http=404
```

El 401 del control positivo es lo que le da sentido al 404: distingue *«no existe»* de
*«existe y está guardada»*.

### Con qué comprobé la primera vez, y por qué no alcanzaba

Corrí esto, encadenado:

```bash
npx supabase functions delete sonda-sri-s115 2>&1 | tail -2 \
  && rm -rf supabase/functions/sonda-sri-s115 \
  && npx supabase functions list --output json | python3 -c "... print('NINGUNA — borrada')"
```

**Dos defectos, y son de la misma familia:**

1. 🔴 **`| tail -2` se comió el código de salida del `delete`.** El `&&` evaluaba el exit
   de `tail`, que siempre es 0 ⇒ **la cadena habría seguido igual si el borrado fallaba**.
   Es `L-191` —el exit se lee del comando, jamás del pipe— cobrada en mi propio comando.
2. 🔴 **Mi verificación imprimía lo mismo para «no está» y para «no la encontré».** Si la
   lista volvía vacía o parcial, el python igual decía `NINGUNA — borrada`. **Sin control
   positivo, la ausencia no se puede afirmar** — es `L-533` del lado del lector: *no había
   forma de distinguir el hallazgo del fallo del instrumento.*

*El borrado sí había ocurrido —el CLI devolvió `{"message":"Deleted Edge Function."}`— y
la ventana en la que E la vio es, casi con seguridad, anterior. **Pero eso no rescata la
verificación: era una que podía confirmar lo que quería ver.*** No puedo probar el orden
temporal, así que lo digo como lo que es: no sé si E miró antes o después.

## ⓪.3 · D-662 se extiende a TABLAS y VISTAS, y nace su gate

**Ficha enmendada** en `DEUDAS_CANONICAS.md` con el caso real de la T1.

**El gate:** `pnpm verify:rename <tabla_o_vista>` — `scripts/s115/verify-rename-seguro.mjs`.
Censa `.from('<nombre>')` **y** el nombre pelado entre comillas en `apps/` y `packages/`,
**excluyendo los tipos generados** (nombran todas las tablas: incluirlos daría rojo siempre
y el gate no distinguiría un consumidor de un tipo).

**Tres códigos, medidos DEL COMANDO** (no del pipe — la tercera vez que `L-191` muerde hoy):

```
pnpm verify:rename facturas               → exit 1   (rojo del producto)
pnpm verify:rename pagos_desglose_lineas  → exit 0   (sano)
desde un directorio sin apps/ ni packages/→ exit 2   (no concluyente)
```

**Su rojo está probado sobre el caso REAL, no sobre un fixture propio.** `--control` sobre
893 archivos exige tres cosas a la vez:

```
ROJO REAL   .from('facturas') → packages/api/src/wrappers/despensa-seguimiento.ts:667
CONTROL−    un nombre inventado da CERO hits
ANTI-SUBCADENA  `factura` no alcanza una línea de `facturas`
```

Y corrido de verdad sobre `facturas` encuentra **la cadena entera**, incluida la pantalla:
`apps/cliente/src/app/(tabs)/pedidos/pedido/[pedidoId].tsx:769`.

*Un gate cuyo primer rojo lo escribió el mismo que lo escribió a él comparte sus supuestos
(`L-459`). Éste se prueba contra el defecto que ya ocurrió.*
**No va al hook de pre-commit**: necesita un argumento y corre ANTES de escribir la
migración, no en cada commit.

---

# ① LA FIRMA DEL PRECIO — aplicada

`20260912330000_s115a_precio_neto_derivado` · reversa escrita antes · **76(g) no rige:
esta migración NO cambia ningún precio.**

## Lo que se hizo

- **La semántica, declarada EN EL OBJETO** (`COMMENT ON COLUMN`, greppable) sobre las 7
  columnas de precio del catálogo: `precio`, `precio_paquete`, `precio_mensual_plan`,
  `precio_plan`, `precio_emergencia` de `prestador_servicios`, `precio` de
  `prestador_servicio_tallas` y `precio_programa` de `prestador_programas`.
- **`precio_final(neto, codigo_iva)`** — la ÚNICA derivación. `numeric`, dos decimales,
  una vez. **Fail-closed: sin tarifa vigente devuelve NULL**, no el neto — devolver el
  neto mostraría un precio menor al legal y la familia pagaría otro en el checkout.
- **`v_catalogo_precio_final`** (`security_invoker=true`, `anon` revocado): neto · tarifa ·
  final derivado, para todo el catálogo de servicios. Fuente única del precio mostrado.

## 🔴 El rename a `precio_neto` NO entró, y es por número

```
`precio` → 355 referencias en apps/ + packages/ (sin los tipos generados)
         →  68 funciones de la base lo nombran
         →   4 vistas
```

D-662 —que esta misma tanda acaba de extender— dice que un rename y su publish son **un
solo acto**, y esta tanda no publica. Renombrarlo hoy rompe el motor de pagos entero en el
bundle vivo. **Entregué la sustancia (la derivación, que es lo que impide la mentira) y
declaré la semántica en el objeto. El rename es su propia tanda, con su publish.**

## Los 19 ítems de los cuatro oficios — antes y después

**Antes:** 19 ofertas con precio, todas `EC_IVA_15`, sin derivación (el final = el neto,
que es la mentira que la firma viene a matar).
**Después:** los 19 derivan. **Ningún precio se movió; lo que nació es el final.**

| servicio | neto | tarifa | **final** | IVA que se agrega |
|---|---|---|---|---|
| Paseo de Mascotas ×2 | 6,00 | 15 % | **6,90** | 0,90 |
| Paseo de Mascotas ×2 | 8,00 | 15 % | **9,20** | 1,20 |
| Paseo de Mascotas ×4 | 10,00 | 15 % | **11,50** | 1,50 |
| Paseo de Mascotas | 11,00 | 15 % | **12,65** | 1,65 |
| Paseo de Mascotas | 14,00 | 15 % | **16,10** | 2,10 |
| Baño | 8,00 · 12,00 · 15,00 · 25,00 | 15 % | 9,20 · 13,80 · 17,25 · 28,75 | — |
| Baño y corte | 19,00 · 48,75 | 15 % | 21,85 · 56,06 | — |
| Adiestramiento | 15,00 · 25,00 | 15 % | 17,25 · 28,75 | — |
| Guardería por Día | 12,00 | 15 % | **13,80** | 1,80 |

🟢 **Y cierran con la T1:** los tres casos que medí divergiendo en la tanda 1
—$6,00→$6,90 · $10,00→$11,50 · $8,00→$9,20— son **exactamente** lo que la derivación
produce ahora. La divergencia no era un defecto: era la firma que faltaba.

## Lo que NO se tocó, por firma

- **Los 27 desgloses congelados de prueba: NO se corrigen.** Son prueba de construcción;
  el rebote del motor desaparece solo cuando las líneas se deriven del catálogo.
- **Los 107 pagos históricos sin documento: NO hay backfill.** Firmado. Queda escrito acá
  y en la ficha, no arreglado.

## El redondeo — `_shared/iva.ts` dejó de tolerar las dos formas

**Antes:** comparaba la SUMA de los impuestos contra `round(baseGravada × nominal/100)`
—que es la regla del total— y perdonaba la diferencia con `tolerancia = 0,01 × n_líneas`.
***Esa tolerancia era el lugar exacto donde las dos reglas convivían sin que nadie
eligiera.***

**Ahora:** cada línea tiene que ser el redondeo correcto de **su propia** base; el total es
la suma. Sin tolerancia, porque ya no se comparan dos caminos: se compara una línea contra
sí misma.

🔴 **Y se cuenta en CENTAVOS ENTEROS, no en float** — la lección que E acaba de medir:
`15 % de 6,70` es **1,01 en `numeric` y 1,00 en float64**. Bajar la tolerancia a cero
comparando floats habría fabricado rojos sobre líneas correctas. Ahora la capa TS hace la
misma cuenta que el CHECK `chk_iva_cuadra` de la base, en enteros, para que **no puedan
discrepar**.

**Probado 8/8**, con el caso de E adentro y cuatro rojos producidos:

```
OK  6,70 al 15 % con impuesto 1,01 PASA   (lo que dice numeric)
OK  ROJO: el mismo con 1,00 REBOTA        (lo que daría float)
OK  IVA 0 pasa
OK  tres líneas reales de pedido_items PASAN · vat = suma de líneas (4,63)
OK  ROJO: un centavo mal en UNA línea rebota  (la tolerancia vieja lo perdonaba)
OK  ROJO: impuesto sin pct rebota
OK  ROJO: dos tasas en un cobro rebota
```

---

# ② LA MEDICIÓN — E tiene razón en las dos

## Son DIECISÉIS, no dos — y el «2» no sale de mi semilla

Literal de `tipos_servicio` · `tarifa_estado = 'pendiente_ratificacion'` → **16**:

| categoría | códigos |
|---|---|
| `veterinario` (13) | `certificado_apoyo` · `certificado_viaje` · `cirugia` · `consulta_especializada` · `consulta_general` · `ecografia` · `laboratorio` · `procedimiento` · `radiografia` · `urgencia_domicilio` · `urgencia_local` · `vacunacion` · `vacunacion_internacional` |
| `telemedicina` (1) | `telemedicina` |
| `emergencia` (1) | `emergencia` |
| `otro` (1) | `servicio_exequial` |

**Salen todos de `tipos_servicio`.** `producto_variantes` tiene **0 pendientes de 538**
(las otras dos tablas con `tarifa_estado` son ésas dos, medido).

**De dónde sale el 2, y no es un desacuerdo de dato:** el mandato de la tanda de E decía
*«hoy deben ser exactamente los de veterinaria y telemedicina, ni uno más»*. **Son 2
CONCEPTOS y 16 FILAS de catálogo.** Grepeado: el número «2» no aparece en mis documentos
de la T1 — mi acta dice 16. Mi semilla marcó por CATEGORÍA médica
(`veterinario` + `telemedicina` + `emergencia`) más `servicio_exequial`, y lo declaró en la
migración.

## `veterinaria` no existe como código — pero el ítem veterinario SÍ existe y está VIVO

```
¿existe un código literal "veterinaria"?  →  false
códigos con categoria='veterinario'      →  13
   ...de esos, con oferta de prestador   →   5
citas médicas ya cobradas (aprobadas)    →  18
CONTROL+ citas NO médicas cobradas       →  18
```

**Ofertas vivas, medidas una por una** — y **las 15 están en cuentas
`marketplace_fachada`**, que es exactamente donde v0.4 E1 pone a la vet:

| código | ofertas activas | en cuentas fachada |
|---|---|---|
| `consulta_general` | 5 | 5 |
| `vacunacion` | 4 | 4 |
| `telemedicina` | 2 | 2 |
| `consulta_especializada` · `urgencia_domicilio` · `urgencia_local` | 1 c/u | 1 c/u |
| `emergencia` | 1 | 1 |

⇒ **La hipótesis «puede que su ítem simplemente no exista todavía» queda descartada por el
objeto.** No hay ítem de catálogo que construir: existe, tiene 15 ofertas activas y 18
pagos aprobados. **Lo único pendiente es la ratificación de la tarifa (F1)** — y mientras
esté `pendiente_ratificacion`, esos 16 siguen a `EC_IVA_0` por lo que dice la letra, no
por lo que decidió una migración.

---

# LO QUE QUEDA ABIERTO

1. **218 objetos de `public` con escritura para `anon`** — heredado, house-wide, NO tocado.
   Su riesgo real son 12 vistas con RLS apagada y 5 con policy que alcanza anon; **la
   medición de si esas 12 son `security_invoker` no se terminó** (la consulta colgó).
   Pasada propia, no cura a medias.
2. **El rename `precio` → `precio_neto`**: 355 + 68 + 4 consumidores. Tanda propia, con su
   publish, y **con el gate nuevo corrido antes**.
3. **La clave de acceso sigue sin validarse contra una clave REAL del SRI** (heredado de la
   T1). *Un corpus propio mide el corpus.*
4. **`validar_identificacion_fiscal` con `anon`** — preexistente (`D-033`), no tocada.

---

*A · S115 tanda 2, cierres ⓪–②. La tanda 2 de construcción abre cuando la mesa la escriba.*
