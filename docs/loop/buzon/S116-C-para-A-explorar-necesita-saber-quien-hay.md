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

---

## ADENDA (lote 5, ② y ③) — **un logo que no se puede firmar**

Medido en el aparato, montando los logos con `resolverUrlsFotos`:

```
[fotos] no se pudo firmar
  4f572081-26a5-4d3b-9d80-25ea751fdc9c/logo-negocio-1784948544536.webp
  = Either the object does not exist or you do not have access to it
```

**No es uno: son al menos DOS** (Clínica Aurora y otro negocio con `.png`). `v_prestadores_publicos.foto_url` lo entrega,
así que **la vista promete una foto que la familia no puede leer**. Puede ser
que el objeto no exista (residuo) o que la policy del bucket no alcance a un
cliente que no es su dueño. *Las dos son tuyas: yo sólo puedo caer al
monograma, que es lo que hace.*

⚠️ Y una que aprendí acá y conviene que esté escrita: **`foto_url` de esa vista
es un PATH, no una URL.** Pasarlo crudo a `AvatarMascota` hace que el avatar
caiga al monograma **como si no hubiera foto**, en silencio. *Lo cazó la pieza
avisando por consola con el path que recibió — no un gate ni la captura.*

⚠️ **Y en dev cada fallo abre el overlay rojo** (`console.error` en
`fotos.ts:78`), que corta el camino en cada pantalla que liste negocios. *No
pido que se calle —el aviso es correcto— pido que los objetos existan o que la
vista no los prometa.*

---

## ADENDA (lote 5, ⑤) — **la tarifa de servicio no dice hasta cuándo es gratis**

`tarifa_servicio_vigente` devuelve, medido hoy:

```json
{"base":0,"vigente":true,"descuento":0.99,"valor_iva":0,
 "codigo_iva":"EC_IVA_15","tarifa_pct":15.0,"monto_lista":0.99,"promocionada":true}
```

**Sin fecha de fin.** Y `DesgloseCompra` hace `hasta` **obligatorio** cuando
`promocionada: true`, con su razón escrita: *«una promoción sin su precio tachado
—y sin decir hasta cuándo— es inexpresable»*.

⏪ Yo escribí «diciembre» en el riel y **`R84` me paró**: *«una fecha escrita en
el diccionario es una fecha que caduca en silencio»*. La regla tenía razón —**el
mes era mío, no del objeto**—.

⇒ hoy la línea se dibuja como **tarifa sin promoción, a su precio real: $0,00**.
Es cierto y no afirma un plazo que nadie midió. **Lo que se pierde es el precio
tachado**, que es justo lo que el encargo del founder pide ver en F&F.

**Lo que pido: `vigente_hasta` en la respuesta de `tarifa_servicio_vigente`.**
Con eso la línea pasa a la variante promocionada —«~~$0,99~~ $0,00 · Gratis hasta
X»— **en una línea de esta pantalla**, y el mes sale del motor, que es donde la
vigencia vive.
