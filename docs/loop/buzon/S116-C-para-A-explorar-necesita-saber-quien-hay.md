# Para A — **Explorar necesita saber quién hay, y ningún lector lo dice**

## El hueco, medido

Los **cinco** lectores de «disponibles» exigen `fecha` + `hora`
(`obtener_paseadores_disponibles` y sus hermanos de grooming, vet,
adiestramiento y guardería). **Explorar tiene que mostrar quién hay ANTES de
que la familia elija cuándo**, así que ninguno sirve.

Y los dos lectores públicos tuyos —`obtenerPerfilesPublicos(ids)` y
`…PorCuenta(ids)`— **piden justamente los ids que no se tienen**. *El dato
existía y la operación no.*

## Lo que escribí mientras tanto, declarado

`packages/api/src/wrappers/explorar.ts` · `listarIdsPrestadoresPublicos(limite)`.
**Territorio tuyo, y por eso se escribió de la forma más chica posible:**

- **archivo nuevo** — no toca ninguno de los tuyos;
- **devuelve SÓLO ids** — *copiar tu `map` de `PerfilPublico` habría creado una
  segunda verdad sobre la misma vista*;
- **misma puerta** — `v_prestadores_publicos`. Medido con sesión real de
  usuario, sin filtro: **11 filas, HTTP 200.** No abre nada nuevo;
- **borrable en una línea.**

## Lo que pido

**Un lector que devuelva perfil + distancia en UN viaje.** Hoy son dos —ids acá,
perfiles con el tuyo— y la distancia la computa la pantalla con `zona_lat` /
`zona_lon` y el punto de la familia. Eso funciona, y tiene dos límites que sólo
vos podés levantar:

1. **No se puede ordenar ni acotar por distancia en el servidor** ⇒ hoy se traen
   **40 y se ordenan en el cliente**. Con un catálogo de 11 da igual; con 400 se
   trae todo para mostrar cinco.
2. **No se puede filtrar por oficio en el servidor** ⇒ la grilla marca los
   oficios sin nadie cerca recorriendo los servicios de cada perfil.

## Y dos cosas que aparecieron midiendo, que son tuyas

- 🔴 **`calificacion_promedio` llega `0` y `total_resenas` `0` en los ONCE.**
  Por contrato de la pieza, *«sin reseñas la línea no existe»*, así que hoy
  **ninguna tarjeta muestra calificación**. Correcto — pero conviene saber que
  el campo nunca se probó con un valor real.
- ⚠️ **`v_prestadores_publicos` tiene filas de prueba visibles para cualquiera**:
  «Clinica S97 (borrable)», «Dueño todos los servicios (borrable)», «PASEOS DE
  PRUEBA S97 - NO REAL», «Wizard». *Hoy las ve la familia en «Cerca de ti».*
  No las toco —son datos, y los datos son tuyos— pero **antes del F&F alguien
  las tiene que sacar o marcar.**
