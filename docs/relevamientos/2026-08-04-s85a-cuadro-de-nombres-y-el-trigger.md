# S85 · EL CUADRO DE NOMBRES Y LA DECISIÓN DEL TRIGGER — medido, para la firma del founder

> **Nada de acá está ejecutado.** Es el cuadro que la mesa pidió **ANTES** de
> escribir, y las salidas de la decisión ② con su costo.
>
> **Medido el 3-ago-2026 contra la DB viva** (`zyltipqscdsdsxnjclhp`), sobre
> `profiles` ⋈ `auth.users`, filtrado a **gente con vínculo prestador**.

---

## 🔴 EL HALLAZGO QUE CAMBIA LA DECISIÓN — se lee primero

**`handle_new_user` NO está "sin metadata": está mirando UNA CLAVE QUE NADIE
MANDA.** El body literal (`pg_get_functiondef`):

```sql
insert into public.profiles (id, email, nombre)
values (
  new.id,
  new.email,
  coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
)
on conflict (id) do nothing;
```

> **Busca `'nombre'`. Google manda `'full_name'` y `'name'`.**

**⇒ para el ÚNICO usuario del censo que trae nombre real de su proveedor
—Satori—, el trigger tenía el dato al lado y no lo miró.** *Cayó al local-part
teniendo `full_name = "Satori Latam"` en la misma fila que estaba leyendo.*

**Esto no es una salida nueva: es un DEFECTO** — *la clave `'nombre'` no la
produce ni el registro propio de la app ni Google.* **Y explica por qué el
sembrador "siempre" cae al correo: no es su fallback, es su único camino** (la
misma forma que L-197 — un catch-all pensado para lo ocasional que resultó ser
lo único).

**⚠️ Y NO SE VE:** el trigger **funciona**, no tira error, y produce un nombre
plausible. **Familia S85 (L-194 → L-199).**

---

## 1 · EL CUADRO — **12 personas con vínculo prestador**

### ⛔ LOS 7 TITULARES: **los 7 tienen username-como-nombre**

| # | `profiles.nombre` hoy | metadata del proveedor | negocio | ¿resoluble? |
|---|---|---|---|---|
| 1 | `satorilatam` | **`full_name = "Satori Latam"`** (Google) | Satori Latam sas | ✅ **SÍ — el dato existe** |
| 2 | `carlosprueba1` | ∅ | Carlos | ❌ |
| 3 | `demo-prestador` | ∅ | Paseos Andres | ❌ |
| 4 | `demo-vet` | ∅ | Clínica Aurora | ❌ |
| 5 | `guillo381+vet1` | ∅ | Paseos Shyris | ❌ |
| 6 | `guillo381+vet2` | ∅ | Clínica Los Shyris | ❌ |
| 7 | `guillo381+wizard` | ∅ | Wizard | ❌ |

### ✅ LOS 5 EMPLEADOS: **ninguno tiene slug** — nacen con nombre humano

`Giillo` · `Guillermo` · `Guillermo Prueba 5` · `Guillermo Prueba 6` ·
`Guillermo Prueba 7`. *(El primero tiene un typo evidente, puesto a mano.)*

> **El contraste es el diagnóstico:** **el alta por invitación escribe un nombre
> humano** (S79 le puso `p_nombre_titular` OBLIGATORIO); **el alta por registro
> propio cae al correo.** *No es que "los nombres estén mal": es que **hay dos
> puertas y solo una pregunta el nombre**.*

---

## 2 · LA SALIDA (c) — **qué se puede escribir sin preguntar: UNA fila**

| se resuelve | no se resuelve |
|---|---|
| **1** — `satorilatam` → **`Satori Latam`** *(de su `full_name`, criterio S81)* | **6** |

**⚠️ Y LO QUE NO SE VA A HACER, declarado:** *derivar el nombre de la persona
desde `nombre_comercial`.* **"Clínica Aurora" no es una persona.** Sería
exactamente la salida **(a) que la mesa descartó** — *adivinar si un nombre es un
nombre es fabricar el defecto siguiente*.

**LOS 6 QUE NO SE RESUELVEN VIENEN A LA MESA.** *Y traen su propio dato: los
seis son cuentas de prueba/demo del founder* — **la decisión razonable puede ser
que no haya nada que curar en ellas**, pero **eso lo decide él, no yo**.

### ⚠️ LA ADVERTENCIA DE C, que es la que ordena la decisión ②

> **(c) cura el presente y no el futuro. El próximo alta vuelve a sembrar
> igual.**

---

## 3 · LA DECISIÓN ② — las salidas MEDIDAS, con su costo

**Lo que el trigger toca hoy:** una sola columna, `profiles.nombre`.
**Sus lectores, medidos:** **2 wrappers** (`familia.ts:87` · `miPerfil.ts:36`) —
**los dos ya devuelven `?? null`**— y **5 superficies** en las apps.

| | salida | costo | qué deja |
|---|---|---|---|
| **(a)** | heurística que adivine si un slug es un nombre | — | **DESCARTADA por la mesa** |
| **(b)** | **seguir sembrando el local-part** | cero | *el defecto se reproduce en cada alta* |
| **(d)** | **dejar `NULL` cuando no hay dato** | una línea | **el vacío se nota; el slug se obedece** |
| **(e)** | **leer las claves que los proveedores SÍ mandan** (`full_name` → `name` → `nombre`) | una línea | **resuelve Google solo**; sin metadata sigue el problema |
| **(d+e)** | **las dos juntas** | una línea | **usa el dato real cuando existe y calla cuando no** |

### 🗳️ Mi lectura, con lo medido

**La lectura previa de la mesa se sostiene:** *sembrar un nombre falso es peor
que dejarlo vacío, **porque un vacío se nota y un slug se obedece***. **Y ahora
tiene evidencia propia:** el slug sobrevivió desde el inicio en **7 de 7**
titulares **sin que ningún typecheck, lint ni gate lo viera** — *un `NULL` habría
aparecido en la primera pantalla que lo pinta.*

**(e) por sí sola NO alcanza** — resuelve Google y deja igual al registro por
correo, que es la puerta que más va a usarse. **(d) sin (e) tira un dato bueno**
cuando el proveedor lo manda.

> **⇒ recomiendo (d+e), y son la misma línea.** *Pero es firma del founder, y la
> traigo con las cinco salidas, no con una.*

**El costo de `NULL`, medido y no supuesto:** **los dos wrappers ya lo
manejan**; lo que hay que mirar es **qué dicen las 5 superficies con `null`** —
*si alguna pinta un vacío mudo, eso es voz, no motor* (y es el mismo criterio de
D-637: la app del prestador **no tiene superficie de edición del nombre
personal**, así que **hoy un `NULL` no tendría cómo llenarse desde adentro**).

---

## 4 · LO QUE ESTE CUADRO DEJA ANOTADO Y NO RESUELVE

1. **`handle_new_user` es `SECURITY DEFINER` SIN `SET search_path`** — medido en
   su `functiondef`. *El patrón canónico de la casa lo exige* (skill
   `epetplace-db`). **No lo toco en el mismo acto que una decisión de producto:
   se declara acá y se cura donde corresponda.**
2. **D-637 se cruza con esto:** si el nombre pasa a poder ser `NULL`, **la
   ausencia de superficie de edición deja de ser "consecuencia aceptada" y pasa
   a ser un camino sin salida.** *La decisión ② debería mirar las dos juntas.*

---

*Depositado por A, S85. Cero escritura ejecutada: el cuadro se trae, no se
aplica.*
