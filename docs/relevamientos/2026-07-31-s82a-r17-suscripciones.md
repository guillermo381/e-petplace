# S82-A r17 — La sospecha de fuga en `obtenerMisPlanesPaseo`: MEDIDA

**Fecha:** 31-jul-2026 · **Pista:** A · **Territorio:** DB + `packages/api`
**Origen:** hallazgo de C — el lector no filtra por familia ni usuario, y en
una cuenta demo apareció un plan de otra familia.

---

## Veredicto en una línea

**NO es fuga de RLS — la policy corta. Pero el hallazgo es REAL y la cura
era necesaria:** el lector decía "MIS planes" sin declarar **desde qué
ROL**, y en una cuenta que es dueño **y** prestador devolvía el plan que
esa persona VENDE, pintado en el hub de la familia como si fuera suyo.

---

## 1. El literal de las policies (`pg_policy` + `pg_get_expr`, no de memoria)

`suscripciones_servicio` — RLS **encendida** (`relrowsecurity = true`,
`relforcerowsecurity = false`). **Cuatro puertas de LECTURA**, todas para
`authenticated`:

| policy | `USING` |
|---|---|
| `suscr_servicio_pet_parent_own` | `user_id = auth.uid()` |
| `suscr_servicio_prestador_own` | `prestador_id IN (SELECT id FROM prestadores WHERE user_id = auth.uid())` |
| `suscr_servicio_empleado_own` | `empleado_id IN (SELECT id FROM prestador_empleados WHERE user_id = auth.uid() AND activo)` |
| `suscr_servicio_admin` | `is_admin()` |

**La puerta del dueño SÍ corta**, y corta por `user_id` (el comprador), no
por familia. Las otras tres son **correctas y necesarias**: el paseador
tiene que ver los planes que vende. Tocar la policy habría roto la lectura
legítima del prestador — por eso la cura **no va en la policy**.

## 2. Por qué esa fila pasó — el camino legítimo que faltaba ver

En toda la tabla hay **UNA sola suscripción**:

```
suscripcion  cf59a466…   mascota Thor (d2e31d70…)   familia ce057f90…
comprador    dd024680…  = guillo381+8@gmail.com     ← miembro VIGENTE de ce057f90
prestador    de300000…0e5 → user c5d54e3a… = demo-prestador@epetplace.dev
```

La cuenta con la que se vio el plan es **`demo-prestador@epetplace.dev`**,
que es **prestador Y dueño a la vez** (su familia `de300000…` tiene un
Zeus). El plan le llegó por **`suscr_servicio_prestador_own`**.

### La trampa de medición que casi lo hace pasar por fuga

La premisa decía *"la demo pertenece solo a la familia de Zeus"*. Medido:
**hay NUEVE mascotas llamadas Zeus / Zeus N y TRES llamadas Thor**, en
familias distintas. Y la familia `ce057f90` (la del plan) tiene **Thor Y
Zeus juntos** — es la de `+8`. **"La familia de Zeus" no identifica nada:
el nombre no es llave.** Es la misma trampa que S45 registró con "DOS
Zeus"; hoy son nueve. *(Nota para el dato de prueba: los homónimos
convierten cualquier medición por nombre en una moneda al aire.)*

## 3. El rojo, producido — y el verde, con no-regresión

Fixture in-txn con `SET LOCAL request.jwt.claims` + `SET LOCAL ROLE
authenticated`, `ROLLBACK` (residuo 0 — solo SELECT):

| cuenta | lector de HOY (sin filtro) | lector CON filtro | qué veía |
|---|---|---|---|
| `demo-prestador@epetplace.dev` (dueño **y** prestador) | **1** 🔴 | **0** ✅ | `Thor (fam ce057f90)` — **ajena** |
| `guillo381+8@gmail.com` (el dueño real) | 1 | **1** ✅ | su propio plan — **sin regresión** |

El discriminador es limpio en los dos sentidos: el filtro **quita
exactamente la fila indebida y no toca la debida**.

## 4. La cura — cinturón y tiradores, y dónde va cada uno

- **La RLS queda como está.** Es la defensa y está bien: las cuatro
  puertas son legítimas.
- **El wrapper gana el filtro explícito** (`.eq('user_id', uid)`), con
  `uidActual()` (S80, sobre `getSession` — cero red) y `sin_sesion`
  tipado: sin uid **no se lee "a ver qué trae la RLS"**, se dice que no
  hay sesión (L-178).

**LA REGLA QUE DEJA — candidata de lección:**
> **Un lector que se apoya SOLO en la RLS es un lector que nadie puede
> auditar leyendo.** Para saber qué devuelve hay que ir a `pg_policy`. El
> filtro explícito no reemplaza a la defensa: **declara desde qué rol se
> está preguntando** — y en una tabla multi-rol, esa declaración *es* el
> contrato del lector.

El defecto se vuelve invisible en cuentas de un solo papel. **Las cuentas
de doble papel no son un artefacto de la demo: un groomer que además es
dueño de su perro es el caso normal del producto.**

## 5. El censo de hermanos (punto 4 — SOLO censo, sin curar)

Método: las 72 lecturas de `packages/api/src/wrappers` sin filtro de
pertenencia propio, cruzadas contra **cuántas puertas de lectura tiene su
tabla**. La mayoría de las 72 son inofensivas y salen del censo:
catálogos globales (`cat_*`, `tipos_servicio`, `country_config`) e hijas
atadas a un padre ya leído bajo RLS (`eq('grooming_id', …)`,
`in('evento_id', …)`).

**El criterio exigible: puertas de lectura > 1 · lector sin filtro propio
= LECTOR AMBIGUO.**

| tabla | puertas | lector sin filtro | clase |
|---|---|---|---|
| `bonos` | **4** (dueño·prestador·empleado·admin) | `paquetes.ts:251` (solo `tipo_servicio`) | 🔴 **IDÉNTICA a la curada** — y vive en la **misma pantalla** (el hub "Mis paseos" pinta el saldo de paquetes). El mismo doble papel lo reproduce. |
| `presupuesto` | 3 (familia·cuenta·admin) | `presupuestos-familia.ts:98` (solo `estado`) | 🟠 misma clase: familia vs cuenta comercial |
| `eventos_economicos` | 2 (own·admin) | `eventosEconomicos.ts:38` (solo `estado`) | 🟡 la 2ª puerta es `is_admin()` y el admin no usa las apps — riesgo bajo, ambigüedad igual |
| `liquidaciones` | 2 (own·admin) | `liquidaciones.ts:46` (ninguno) | 🟡 ídem |
| `v_eventos_con_origen` | vista sobre lo anterior | `eventosEconomicos.ts:110` | 🟡 hereda |
| `direcciones_guardadas` | **1** (`dir_own`) | `direcciones.ts:77` | ⚪ **sale del censo**: una sola puerta, no hay ambigüedad posible |

**El próximo a curar es `bonos`** — no por severidad teórica sino porque
es el mismo defecto, en la misma pantalla, reproducible con la misma
cuenta.

### Lo que este censo NO cubre (declarado, no barrido en silencio)
Solo miró `packages/api`. Un lector de la app que llame directo a
PostgREST quedaría afuera — pero la puerta única (`@epetplace/api`) lo
prohíbe, así que el censo es completo **si la puerta única se cumple**.

## 6. Archivos

- `packages/api/src/wrappers/planes.ts` — filtro + `sin_sesion` + el porqué
  escrito en el propio lector.
- Cero migraciones: **la DB no se toca** — no había nada roto en la DB.
- typecheck `@epetplace/api` y `cliente`: verdes, exit real 0 (L-191).
