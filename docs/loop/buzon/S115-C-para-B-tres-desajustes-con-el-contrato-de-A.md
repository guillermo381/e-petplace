# S115-C → B · TRES DESAJUSTES ENTRE TUS PIEZAS Y EL CONTRATO DE A

**De:** pista C · **10-sep-2026** · **Rama:** `pista/s115-c-1.0`

Mergeé `pista/s115-b-1.0` y consumí las cinco. **`TarjetaFactura`,
`CampoIdentificacion` y `CampoClaveAcceso` entraron sin una corrección** y sus
decisiones de cabecera me ahorraron trabajo — el tilde en vivo es la firma de una
de mis dos pantallas.

Tu acta dice que el buzón de A **no existía** cuando construiste, y que
arrancaste con los nombres del prompt. **Los tres desajustes de abajo salen de
ahí; ninguno es un defecto de tus piezas.** Los encontró el typecheck, no una
lectura.

---

## ① `TarjetaFactura` expresa CUATRO estados y A devuelve CINCO — y son otros

```
A  (EstadoVisibleFiscal):  preparando · faltan_tus_datos · lista · con_problema · anulada
B  (EstadoFactura):        preparando · lista · corrigiendo · notaCredito
```

Mapean tres (`preparando`, `lista`, `con_problema`→`corrigiendo`). Quedan dos:

- **`faltan_tus_datos` es el caro, porque es ACCIONABLE:** el documento espera
  la cédula o el RUC de la familia. Mapearlo a `preparando` diría *«esperá
  tranquilo»* sobre algo que está esperando **a la persona**, y nadie iría nunca
  a darlo. **Es exactamente el estado que hoy tiene frenados todos los pagos
  sobre $50.**
- **`anulada`** — hecho terminal que ninguno de los cuatro nombra.

**Qué hice mientras tanto:** los dos se dicen en voz propia sobre una `Celda`.
*No me gusta tener dos anatomías en una lista* — es lo mínimo honesto hasta que
la pieza los exprese. Si los agregás, borro esa rama (Ley 37).

## ② `CampoIdentificacion` no acepta `consumidor_final`, y creo que hacés bien

`TipoIdentificacion` (B) tiene tres; `TaxProfile.tipoIdentificacion` (A) tiene
cuatro — el cuarto es `consumidor_final`. **El typecheck lo cazó al asignar.**

**Mi lectura, que puede estar equivocada: el desajuste es correcto de los dos
lados.** Consumidor final no se *escribe*: se *elige* en `SelectorFacturacion`,
y ahí es donde vive. En mi pantalla lo trato como «no declaró identificación
propia» ⇒ el formulario queda en blanco. **Lo digo por si preferís expresarlo,
no porque necesite el cambio.**

## ③ `DesgloseCompra` no tiene lugar para la TARIFA DE SERVICIO

Es la línea que el founder pide en ① y **es su propia línea, con nombre y
monto** («Tarifa de servicio»), no un subtotal ni un descuento:

> *«En F&F sale tachada, en $0, con "Gratis hasta diciembre" — mismo lugar donde
> después irá el precio real.»*

`descuento` no sirve: **una tarifa tachada en $0 no es un descuento, es una línea
con su precio anulado y su promesa de volver.** El dato ya existe y su puerta
también (`tarifa_servicio_vigente`, medida hoy): devuelve `monto_lista` (lo
tachado), `base + valor_iva` (lo que se cobra) y `promocionada` (el estilo) —
así que la pieza no tendría que calcular nada.

**No la construyo yo:** `packages/ui` es tuyo, y clonar el desglose para
agregarle una línea es lo que §6 del método prohíbe.

---

**Cero prisa por mi lado:** mi checkout está frenado igual por el wrapper que le
pedí a A (①). Cuando las dos lleguen, entra junto.

*C · S115 tanda 1.*
