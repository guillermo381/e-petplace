# S80-A13 · CENSO de `auth.getUser()` en packages/api + LA PROPUESTA (sin aplicar — toca autorización, gate pendiente)

> Origen: B12 midió "los 4 segundos" y paró la mitad-wrapper donde
> correspondía (cirugía de packages/api = territorio A). Este doc es la
> medición + la propuesta. **NADA de esto está aplicado.**

## 1. EL CENSO (grep literal, 28-jul)

**10 wrappers (archivos), 29 sitios de llamada:**

| Wrapper | Sitios | Qué consume | Semántica del fallo |
|---|---|---|---|
| `configuracionPaseo.ts` | 8 | solo `user.id` | `falla('sin_sesion')` |
| `horarios-modo.ts` | 6 | solo `user.id` | `falla('sin_sesion')` |
| `bloqueos.ts` | 3 | solo `user.id` | `falla('sin_sesion')` |
| `equipo.ts` | 3 | solo `user.id` | mixta: 1 escritor `sin_sesion` · **2 SONDAS que devuelven `ok:true, data:null`** (el guard raíz las consume — sin sesión NO es error ahí) |
| `eventosEconomicos.ts` | 2 | solo `user.id` | `sin_sesion` |
| `prestador.ts` | 2 | solo `user.id` | `sin_sesion` |
| `cuentaComercial.ts` | 1 | solo `user.id` | `sin_sesion` |
| `liquidaciones.ts` | 1 | solo `user.id` | `sin_sesion` |
| `titular.ts` | 1 | solo `user.id` | `null` (lector suave) |
| `veterinaria-nota-clinica.ts` | 1 | solo `user.id` | `sin_sesion` |

**¿Cuántos NECESITAN el user completo? CERO.** Grep de
`user.email`/`user_metadata`/`phone` sobre los 29 sitios: **cero
ocurrencias**. Los 29 usan el `uid` para UNA sola cosa: componer el
`.eq('user_id', uid)` / el `asignado_por` de una query que **la RLS
gatea de todos modos con el JWT del request**.

## 2. LA CLAVE TÉCNICA (por qué esto son "los 4 segundos")

`auth.getUser()` es un **round-trip de RED al servidor de Auth** (valida
el JWT contra el server en cada llamada). En estos 29 sitios esa
validación **no aporta autorización**: la autorización real la hace la
RLS con el JWT que viaja pegado al request de PostgREST — un uid
inventado o viejo no puede leer nada que el JWT no permita. Pagamos un
RT de red por dato que ya tenemos local.

## 3. LA PROPUESTA — `uidActual()` sobre `getSession()`, NO una caché artesanal

Un resolvedor único en la puerta (`packages/api`):

- Lee `auth.getSession()` — **el session store LOCAL del SDK, cero
  red** — y devuelve `session.user.id ?? null`.
- **No fabricamos estado propio: la "caché" ES el SDK**, que ya se
  invalida solo (signOut, refresh, `onAuthStateChange`). No hay TTL
  nuestro, no hay Map nuestro, no hay invalidación que podamos olvidar.
- Los 29 sitios migran mecánicamente; las 2 SONDAS de `equipo.ts` y el
  lector suave de `titular.ts` conservan su semántica (null ≠ error).

### El riesgo D-571, respondido punto por punto (la pregunta de la orden)

> *"Una caché que sobrevive a un cambio de sesión o a una revocación
> produce un permiso denegado disfrazado de dato."*

- **Cambio de sesión local (logout/login):** el store del SDK se
  actualiza en el acto (`signOut` lo vacía; `onAuthStateChange` es su
  mecanismo interno). No hay estado nuestro que sobreviva. ✓
- **Revocación REMOTA** (admin borra el user, password cambiado en otro
  dispositivo): `getSession()` local sigue devolviendo el uid viejo
  hasta que el refresh falle — **este es el único caso donde el local
  "miente"**, y su consecuencia es EXACTAMENTE la correcta: el wrapper
  compone la query, **el SERVER la rebota** (401/RLS) y el fallo llega
  HABLADO del lado que tiene la verdad. La regla exigible de la
  cirugía: **ese rebote sale como error de servidor/permiso, JAMÁS
  como `sin_sesion` ni como lista vacía** — que es la clase D-571/D-538
  que la orden teme. Con `getUser()` hoy pasa lo MISMO en ese borde
  (getUser puede dar verde y la revocación llegar un instante después)
  — el server siempre fue la única verdad; la propuesta no abre un
  agujero nuevo, lo deja dicho.
- **Bonus que CURA D-538 en esta capa:** el patrón actual descarta el
  error de `getUser()` y "sin red" sale como "sin sesión" (los 10 lo
  hacen — es la deuda). Con `getSession()` **no hay red que falle en
  esta capa**: `sin_sesion` pasa a significar exactamente "no hay
  sesión local", y el error de red queda donde corresponde (la query al
  server, que ya tiene su código). La clase muere de raíz acá.

### Lo que esta propuesta NO cubre (declarado)

- **D-555 (el resolvedor cacheado de identidad-en-el-negocio — ¿titular?
  ¿chips? ¿rol?) es OTRA CAPA y sigue VIVA**: eso sí es estado nuestro
  con invalidación propia (el toggle de equipo escribe en caliente) y
  pide su frontera con invalidación, como su ficha dice. El uid-resolver
  no la reemplaza — le quita de encima solo la mitad `getUser`.
- La respuesta a la pregunta de la orden: **la caché de D-555 NO
  alcanza para los 10** — mezcla dos capas; el uid es del SDK (gratis y
  auto-invalidado), la identidad-en-negocio es nuestra (cara y con
  invalidación). Separarlas es la propuesta.

## 4. EL GATE

No se aplica sin gate (toca autorización). El diff sería mecánico
(29 sitios → 1 resolvedor + el barrido de semántica de fallo por sitio,
verificado wrapper por wrapper contra su consumidor). Estimación de
efecto: hasta 29 RTs de red eliminados de los arranques — la mitad de
motor que B12 midió en "los 4 segundos".
