# S112-E · PERFORMANCE DEL VERTICAL (§6) — con número y con plan

> **CONTRA QUÉ:** base viva `zyltipqscdsdsxnjclhp`, con **1 005 publicaciones
> sintéticas sembradas y ya borradas**. Repo `main f704daa2`.
> **CUÁNDO:** **2-sep-2026, 00:10–00:40**.
> **Instrumento:** 20 corridas por caso, p95 por `percentile_cont(0.95)`.
> **Residuo: CERO, verificado** (`0 mascotas · 0 publicaciones · 0 familia` de la
> marca, y los totales volvieron a `83 mascotas / 86 familias`, los de antes).

---

## §1 · LA SIEMBRA — cómo se hizo y cómo se repite

| qué | cómo |
|---|---|
| **volumen** | **1 005 publicaciones** en estado `publicada`, con su mascota cada una |
| **refugios** | **15**, no 20 — *usé las `cuentas_comerciales` que ya existen en vez de fabricar 20 cuentas falsas: la cardinalidad del join no cambia y no ensucio una tabla que el founder ve en el panel.* **Se declara la desviación** |
| **marca** | `adopcion_publicacion.senas = '[PERF-S112E]'` · `mascotas.nombre LIKE 'PERF-%'` · `familia.created_by_sistema = 'S112E_PERF'` (la convención de la casa desde S92) |
| **realismo** | `creada_en` e `ingresado_en` repartidos sobre 540 días · 6 especies · convivencia en los tres estados · 1 de cada 17 urgente · historia de ~130 caracteres · foto repetida |
| **borrado** | tres `DELETE` por esas marcas. **Corrido y verificado en cero** |

Los dos archivos (`seed.sql` con `:N` y `unseed.sql`) quedan descritos acá para
que **cualquiera pueda repetir la medición**; no los deposito en el repo porque
son andamio, no producto.

---

## §2 · EL NÚMERO — servidor y camino real, que son dos cosas distintas

### 2.1 · Servidor (dentro de la base, sin red)

| caso | n | min | avg | **p95** | max |
|---|---|---|---|---|---|
| lista · página 1 sin filtros | 20 | 6,9 | 12,7 | **15,8 ms** | 27,1 |
| lista · página 1 filtro especie | 20 | 5,5 | 5,6 | **5,9 ms** | 6,2 |
| lista · página 1 tres filtros (con convivencia) | 20 | 1,7 | 1,7 | **1,8 ms** | 1,9 |
| lista · página 5 (cursor encadenado) | 20 | 11,0 | 11,3 | **11,6 ms** | 11,6 |
| **ficha** `obtener_adoptable` | 20 | 0,2 | 1,0 | **2,3 ms** | 8,3 |

### 2.2 · Camino real (HTTP con la clave anon, desde esta máquina)

| caso | n | min | avg | **p95** | max | payload |
|---|---|---|---|---|---|---|
| L1 · lista página 1 sin filtros | 20 | 155 | 177 | **224 ms** | 389 | 24,7 kB |
| L2 · lista página 1 filtro especie | 20 | 155 | 166 | **168 ms** | 256 | 25,0 kB |
| L3 · lista página 1 tres filtros | 20 | 146 | 154 | **157 ms** | 188 | 9,8 kB |
| L4 · lista página 5 (cursor) | 20 | 154 | 168 | **215 ms** | 221 | 21,8 kB |
| **F1 · ficha** | 20 | 148 | 176 | **203 ms** | 486 | 1,1 kB |
| V1 · la vista **sin límite** (ver §4) | 5 | 199 | 295 | **651 ms** | 651 | **1 061,6 kB** |

---

## §3 · EL VEREDICTO CONTRA §6, y no es el que se esperaba

| ley | techo | servidor | camino real | veredicto |
|---|---|---|---|---|
| vidriera | **< 250 ms** | 15,8 ms | **224 ms** | ✅ **cumple** — pero con 26 ms de margen |
| ficha | **< 200 ms** | 2,3 ms | **203 ms** | 🔴 **NO cumple por 3 ms** |
| un viaje por página | — | — | ✅ un solo RPC | ✅ |
| hilo paginado 50 | — | ⛔ sin datos | — | pendiente |

**🔴 Y lo que el número dice de verdad, que importa más que el pass/fail:**

> **El piso de TODAS las llamadas es 146–155 ms, y el trabajo del servidor es de
> 2 a 16 ms.** ⇒ **más del 90 % de lo que §6 mide es peaje de viaje, no consulta.**

*Es `L-223` de S94-PERF otra vez, con datos nuevos: no hay consultas que
optimizar, hay viajes que eliminar.* **Ningún índice va a hacer que la ficha baje
de 200 ms, porque un solo viaje de ida y vuelta ya cuesta 148.** Y esto se midió
**desde una Mac por wifi**: **desde el teléfono del founder con datos móviles el
peaje es mayor, no menor.**

**No propongo cura. Nombro la puerta:** o el techo de la ficha se mide
**server-side** (donde sobra: 2,3 ms), o el techo se escribe **contando el peaje**
(el propio `§6` dice *«medido con EXPLAIN y con la app»*: son dos números
distintos y hoy comparte un solo umbral). **Es decisión de la mesa, no mía.**

---

## §4 · EL PLAN — ningún índice falta

`EXPLAIN (ANALYZE, BUFFERS)` de la consulta de la página 1 sobre 1 005 filas:

```
Limit (actual time=0.175..3.762 rows=20 loops=1)   Buffers: shared hit=106
  -> Nested Loop Left Join …
       -> Index Scan using ix_adoptable_recientes on adopcion_publicacion p
            (actual time=0.117..0.139 rows=20)     Buffers: shared hit=16
       -> Index Scan using mascotas_pkey on mascotas m       (loops=20)
       -> Memoize (Cache Key: p.cuenta_comercial_id · Hits 12 / Misses 8)
            -> Index Scan using cuentas_comerciales_pkey
       -> Memoize (Cache Key: cc.id)
            -> Index Scan using uq_prestadores_cuenta_nombre on prestadores
       -> Index Scan using cat_ciudades_pkey on cat_ciudades
Planning Time: 4.325 ms      Execution Time: 3.995 ms
```

- ✅ **usa `ix_adoptable_recientes`** — el índice keyset de A **se está usando**.
- ✅ **cero `Seq Scan`, cero `Sort`** — el orden sale del índice.
- ✅ **`Buffers: shared hit=106`, cero `read`** — todo de caché.
- ✅ los cuatro joins son index scan, dos con `Memoize`.

**⇒ NO falta ningún índice.** *Lo digo con el plan al lado porque §6 me pedía
nombrarlo si faltaba: no falta.*

**Nota honesta:** `Planning Time (4,3 ms) > Execution Time (4,0 ms)`. Con 1 000
filas planificar cuesta más que ejecutar — **irrelevante hoy**, y sólo empezaría
a importar con un orden de magnitud más de filas.

---

## §5 · UN HALLAZGO QUE SALIÓ DE MEDIR PERFORMANCE Y ES DE SEGURIDAD

**`anon` puede leer `v_adoptables_publicos` DIRECTAMENTE**, salteando
`obtener_adoptables` — y con eso saltea **la paginación, el tope de 50 y la lista
blanca de filtros**.

```
anon → rpc obtener_adoptables()          → 3 destacados + 2 resto, con cursor   ✅
anon → select * from v_adoptables_publicos → 1 005 filas, 36 columnas, 1,06 MB  🟠
        (p95 651 ms, sin límite, sin cursor, sin whitelist)
CONTROL− → anon sobre adopcion_publicacion · mascotas · cuentas_comerciales
           · prestadores                 → 0 filas en las cuatro                ✅
```

**Lo que NO es:** *no es una fuga.* Revisé las 36 columnas contra la lista de
§5.2 y **ninguna prohibida viaja** — ni teléfono, ni correo, ni dirección, ni RUC,
ni cédula, ni coordenadas. La vista filtra `p.estado='publicada'` y excluye
fallecidas, así que **tampoco se filtran borradores** (Kira no se ve).

**Lo que SÍ es:** con la clave anon —que viaja en el bundle— **cualquiera se
baja el catálogo entero en un pedido**. Con 1 000 animales eso es **1 MB y
651 ms**; el día que sean 10 000 es 10 MB. **Y `§6`'s «20 por página» deja de ser
una garantía: es sólo la puerta de adelante.**

⚠️ **Y hay un segundo hecho estructural al lado:** la vista **no tiene
`security_invoker`** ⇒ corre con los privilegios del dueño y **no aplica RLS
sobre las cuatro tablas que junta**. Eso es **deliberado y correcto** —es la
vidriera anónima, y sin eso no habría vidriera—, pero significa que **la vista es
la ÚNICA puerta: detrás de ella no hay una segunda defensa.** *Precedente de la
casa: en S103 se hallaron cuatro vistas del motor con ACL total hasta para `anon`;
ésta es distinta —su `WHERE` sí acota— pero su ACL es la misma clase de decisión y
conviene que esté tomada a propósito.*

**No propongo la cura. Nombro la puerta:** el `GRANT SELECT` de `anon` sobre
`public.v_adoptables_publicos`. **Es de A.**

---

## §6 · LO QUE NO SE MIDIÓ, Y POR QUÉ

- **El hilo paginado a 50** (§6): `adopcion_mensaje` tiene **0 filas** y no hay
  solicitudes. *Sembrar un hilo sintético mediría mi siembra, no el producto.*
- **El scroll a 60 fps en el aparato** (§6): **es de C con el perfilador.** *Yo
  puedo medir el servidor y el viaje; los cuadros por segundo los mide quien
  monta la lista.*
- **Miniaturas**: §6 pide miniatura para la lista y original para la ficha. **Hoy
  la lista y la ficha devuelven el MISMO `foto_url`** — no hay dos tamaños. *Lo
  nombro; no lo construyo.*
