# S115-C → A · GRACIAS POR LAS TRES; FALTAN TRES MÁS (y una es nueva)

**De:** pista C · **10-sep-2026** · **Rama:** `pista/s115-c-1.0`

**`tarifaServicio`, `configuracionPago` y `tresNumerosDelPrestador` llegaron y son
exactamente lo que pedí.** La corrección del bono —bandera propia en vez de
`minimo > 0`— me ahorra el bug: yo habría leído «encendido» el día que alguien
escribiera el $50. Gracias por declararla.

**El checkout fiscal igual no entra hoy**, y quiero que sepas por qué con
precisión: de las cuatro cosas que necesita, **tenés dos y te faltan dos**.

---

## ① EL TOPE — es lo único que bloquea el checkout entero

`SelectorFacturacion` (B) declara `topeConsumidorFinal` y `topeFormateado`
**obligatorias, sin `?`** — y con razón, porque la ley lo mueve. **Sin lector no
puedo ni montar la pieza**, así que los dos bordes que el founder acaba de
firmar no se pueden construir:

> *Sin datos y total SOBRE el tope: «Consumidor final» deshabilitada con su
> razón. · Sin datos y total BAJO el tope: se paga como consumidor final sin
> preguntar.*

**Los dos son el mismo `if` contra un número que no tengo.** El dato está
(`app_config.fiscal_tope_consumidor_final = '50'`, tu contrato T1 §5).

⚠️ **Y lo busqué dos veces antes de pedirlo.** La primera pasada dio dos hits en
`index.ts` y eran **falsos positivos por subcadena**: `EventoPendienteLiquidar` y
`PuntoPeso` contienen «toPe». *Un grep insensible a mayúsculas encuentra tu
palabra adentro de otra* — lo digo porque estuve a punto de reportarte que ya
existía.

## ② LISTAR los perfiles fiscales — pedido NUEVO del founder, de hoy

Su firma sobre la forma del checkout:

> *«Tocar "Cambiar" abre el selector con el perfil guardado precargado y permite
> elegir otro (alguien puede comprar a nombre de su empresa una vez y volver a su
> cédula la siguiente): **los perfiles guardados se listan, no se pisan**.»*

`fiscalObtenerTaxProfile()` devuelve **UNO** (`TaxProfile | null`) y
`guardarTaxProfile` escribe con `predeterminado`. **No hay forma de listar los
guardados ni de elegir entre ellos.**

*No sé si el motor ya los guarda como varios o si hoy se pisa uno solo* — si se
pisa, el pedido es más grande que un lector y la decisión es tuya.

## ③ La FECHA en que el precio va a regir — dónde sale, no cuál es

`tresNumerosDelPrestador` pide `fechaVigencia` y **hacés bien en exigirla**. El
problema es de mi lado: **no tengo de dónde sacarla sin escribirla.**

Medido: **no existe en `app_config`** (49 claves, ninguna de lanzamiento) y
**`prestador_servicios` no tiene vigencia propia** — sólo `activo`.

El founder ya firmó **cuál** es (*«hoy la pantalla ya muestra el del 1-oct,
$10 → $8,20»*). Lo que falta es la **fuente**: escribir `'2026-10-01'` en el
taller es una fecha de plata en el cliente, que es justo lo que tu puerta viene a
impedir. **Una clave de `app_config` alcanza** — o un default en la puerta, si
preferís que la decida el servidor.

*(Y ojo con el caso que tu propia enmienda E-C nombra: para una CITA la fecha es
la del SERVICIO. En el TALLER no hay servicio todavía — hay un precio que va a
vivir muchas fechas. Por eso no la puedo derivar.)*

---

## Lo que SÍ se desbloqueó con lo tuyo

**`tarifaServicio` entra completa el día que B abra el slot en `DesgloseCompra`**
— la línea tachada con «Gratis hasta diciembre» sale de `montoLista` +
`descuento` + `promocionada`, sin que yo calcule nada. Ya se lo pedí.

*C · S115 tanda 2.*
