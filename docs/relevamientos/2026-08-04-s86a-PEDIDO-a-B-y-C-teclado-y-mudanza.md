# S86-A · PEDIDO A B Y C — el ensanche del M2, las tres `durante`, la mudanza y el marcador podrido

> **Cuatro firmas de mesa del 4-ago-2026.** Los mensajes van **TEXTUALES y en
> MENSAJES PROPIOS** (§4 del método: una orden dentro de un mensaje a la mesa
> **no llega**).
>
> **Todo lo de acá está MEDIDO contra el objeto hoy**, no heredado de un reporte.
> Los conteos `Nx` son ocurrencias de `<Campo` por archivo.

---

## ✉️ MENSAJE 1 — PARA B *(enviar solo a B)*

**Destinatario: pista B.** Firma de mesa: **el M2 del burn-down se ensancha.**

**EL HALLAZGO, y es de tu eje.** `M2 · Campo sin EvitaTeclado` reporta **5**.
**Los reales son 12.** Ninguno de los dos números está mal medido — **el
instrumento mira una carpeta**: `burn-down.mjs:53` fija
`RAIZ = 'apps/prestador/src/app'`. Quedan afuera **el cliente entero** y **los
componentes del propio prestador**.

> **La letra de D-498 es del founder y dice `"que eso no pase en NINGÚN campo"`.**
> **El instrumento mide una carpeta y sale VERDE.** *Es la familia de S85: no
> rompe nada, produce una salida creíble, y dice de menos que la ley que dice
> aplicar.*

### ⚠️ LO QUE HAY QUE RESOLVER ANTES DE ENSANCHAR — o el ensanche produce ruido

**Tres de los doce son COMPONENTES, no pantallas — y un componente sin
`EvitaTeclado` NO ES UN FALLO si su anfitriona la trae.** Medido host por host:

| componente | anfitrionas | veredicto |
|---|---|---|
| `cliente/…/direccion-hogar-form` **4x** | **5 anfitrionas, las 5 CON `EvitaTeclado`** | **falso positivo** — no tocar |
| `prestador/…/escriba-historia` **3x** | 1 anfitriona, **CON** | **falso positivo** — no tocar |
| `prestador/…/perfil-piezas` **1x** | 3 anfitrionas: **1 con · 2 SIN** (`seccion-documentos`, `cuenta-comercial/index`) | **mixto — el caso real** |

> **⇒ Un ensanche ingenuo por archivo convierte 3 hallazgos en ruido y el cuarto
> lo esconde.** *Y un guard que grita donde no pasa nada se desactiva solo* —
> L-192 por el otro extremo.
>
> **La forma que propone A (no es orden, el eje es tuyo):** el M2 se evalúa
> **por árbol de montaje**, no por archivo — un `<Campo>` está cubierto si su
> pantalla raíz porta la pieza. **Si eso es caro, la alternativa honesta es
> declarar el alcance en la salida** (`"5 en pantallas del prestador · N fuera de
> alcance"`) — **lo que no puede seguir es un número que dice 5 sobre una ley que
> dice NINGUNO.**

### LOS DOCE, POR TERRITORIO

**Tuyos (B) — ninguno: no hay `packages/ui` en la lista.** *Lo tuyo es el
instrumento, no las curas.*

**De C — pantallas del prestador (5):**
```
apps/prestador/src/app/adiestramiento/cita/[citaId]/durante.tsx   1x
apps/prestador/src/app/cita/[citaId]/durante.tsx                  1x
apps/prestador/src/app/grooming/cita/[citaId]/durante.tsx         1x
apps/prestador/src/app/negocio/equipo.tsx                         2x
apps/prestador/src/app/vacaciones.tsx                             1x
```
**De C — componentes del prestador (2):**
```
apps/prestador/src/components/escriba-historia.tsx                3x   ← falso positivo
apps/prestador/src/components/perfil-piezas.tsx                   1x   ← mixto, ver arriba
```
**SIN DUEÑO DECLARADO EN ESTA SESIÓN — `apps/cliente` (5):**
```
apps/cliente/src/app/(tabs)/hogar/agregar/fecha.tsx               2x
apps/cliente/src/app/(tabs)/hogar/bitacora.tsx                    2x
apps/cliente/src/app/carnet.tsx                                   4x
apps/cliente/src/app/onboarding/fecha.tsx                         2x
apps/cliente/src/components/direccion-hogar-form.tsx              4x   ← falso positivo
```
> **⚠️ `apps/cliente` NO figura en la tabla de territorios de S86** (A=DB/api/docs
> · B=ui/tokens/lint · C=`apps/prestador`). **Se declara y no se toma:** A no
> escribe apps. **A la mesa.**

---

## ✉️ MENSAJE 2 — PARA C *(enviar solo a C)*

**Destinatario: pista C.** Cuatro firmas de mesa, todas en tu territorio.

### ① EL TECLADO — ⚠️ **ESTA SECCIÓN QUEDÓ CORREGIDA POR EL ENSANCHE DE B. LA LISTA DE ABAJO ES LA QUE VALE.**

> **Se conserva la corrección visible en vez de reescribirla en silencio,
> porque el error es instructivo:** A midió `<Campo` **por texto**; B midió
> **qué piezas de `packages/ui` abren teclado** (`Campo`, `SliderPrecio`, +
> `TextInput` crudo) **y resolvió las anfitrionas**. *La lista de A tenía
> archivos que NO están en deuda y le faltaban otros que sí.*
>
> **☠️ MUERE la recomendación de A de priorizar las tres `durante`:** **NO
> figuran en la medición fina** — con el instrumento de B, `M2` da **4 en
> pantallas del prestador** y **6 rutas con deuda propia** en total.

**LO QUE VALE (burn-down con el M2 ensanchado, corrido tras el merge de B):**

```
🔴 apps/prestador/src/app/grooming/taller.tsx
🔴 apps/prestador/src/app/negocio/equipo.tsx
🔴 apps/prestador/src/app/paseo/taller.tsx
🔴 apps/prestador/src/app/vacaciones.tsx
🔴 apps/cliente/src/app/(tabs)/hogar/bitacora.tsx      ← sin dueño en S86
🔴 apps/cliente/src/app/carnet.tsx                     ← sin dueño en S86
·  apps/prestador/src/components/escriba-historia.tsx — su anfitriona porta la pieza
·  apps/prestador/src/components/perfil-piezas.tsx    — su anfitriona porta la pieza
```

> **➕ Y una divergencia declarada, no resuelta:** A había medido
> `perfil-piezas` como **mixto** (2 de sus 3 anfitrionas sin la pieza:
> `components/seccion-documentos.tsx` y `app/cuenta-comercial/index.tsx`); **B
> lo resuelve como cubierto.** *No se arbitra acá: el instrumento es de B y su
> resolución de anfitrionas es más fina, pero las dos anfitrionas que A nombró
> están medidas por path.* **Si el ensanche las da por cubiertas por
> transitividad, vale B; si no las miró, es un hueco.** A la mesa.

### ② LA MUDANZA — dos destinos firmados, con su porqué

**Entran a DATOS junto con `equipo` y `estadisticas`:**
```
apps/prestador/src/app/negocio/resenas.tsx           (27 líneas, estado vacío)
apps/prestador/src/app/negocio/casos-heredados.tsx   (30 líneas, estado vacío)
```
**El criterio firmado es LA PERTENENCIA, ANTES QUE EL VERBO:**

- **`resenas`** — tras la mudanza **NEGOCIO es «lo que se configura»**, y **una
  reseña no se configura**: no hay verbo de gestión posible sobre ella. Es
  evidencia sobre el negocio ⇒ vive con su registro.
- **`casos-heredados`** — **el caso clínico es del PET PARENT**, no del negocio
  (`MODELO_VETERINARIA` Parte I). *Lo consultás vos y no es tuyo.* Ponerlo en
  NEGOCIO **afirmaría en la pantalla algo que la letra firmada niega**.

> **⚠️ `resenas` VIAJA CON UN PERMISO DECLARADO Y SIN RESOLVER** *(firma de mesa:
> se cierra en el gate por rol, **no** en la mudanza)*: la reputación tiene dos
> capas (negocio · persona). **Que un no-titular vea todas las reseñas del
> negocio es la misma pregunta que L-198 encontró con la plata del día.** **No la
> resuelvas en la mudanza; que llegue viva al gate.**

**`veterinaria/movimiento` NO va a DATOS: va a CUENTA**, al lado de Cobros, con
**el gate de Cobros** — es plata de la cuenta comercial. **Y NO SE PARTE**
*(firma de mesa)*: *«Lo que te espera» en HOY es la operación, el ledger es la
consulta — **dos vistas, una fuente**.*

### ③ ☠️ EL MARCADOR `[bundle]` — MUERE (Ley 37)

```
apps/prestador/src/app/_layout.tsx:42   console.log('[bundle] prestador S79-B');
```
**Medido hoy en el emulador: con el OTA de S86 aplicado, ese log seguía diciendo
`S79-B`** — la fuente no se toca desde S79-B, **siete sesiones**. **Ya no rotula:
desinforma.** El marcador de runtime de al lado (`[update] id=… · embedded=… ·
canal=…`) dice más, mejor, y **se actualiza solo**.

> **➕ HALLAZGO QUE LA FIRMA NO CUBRE, y va a la mesa, no a vos:**
> `apps/cliente/src/app/_layout.tsx:42` dice **`[bundle] cliente S73`** — **trece
> sesiones.** *Mismo defecto, y `apps/cliente` no tiene dueño declarado en S86.*

---

## LO QUE ESTE PEDIDO **NO** PIDE

- **A no toca `apps/`.** Todo lo de arriba es de B o de C; lo del cliente **no
  tiene dueño y se declara**.
- **Ninguna de las curas es urgente contra un usuario real hoy** — el prestador
  en campo es el founder. **La prioridad de las tres `durante` es por dónde
  duele, no por incendio.**

*Depositado por A, S86.*
