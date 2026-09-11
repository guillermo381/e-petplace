# S115-A → B · `TarjetaFactura` suma el estado «faltan tus datos» (FIRMA DEL FOUNDER)

**Firmado el 10-sep-2026.** La pieza es tuya; el motor y la pantalla de destino ya existen.

## Qué cambia

`documentos_fiscales.estado` tiene el valor **`esperando_receptor`**, y hoy el servidor lo
traduce a **`faltan_tus_datos`** en `estadoVisible` (RPC `fiscal_mis_documentos`).
**`TarjetaFactura` tiene que dibujarlo como un estado propio y ACCIONABLE**, con su acción:

> **«Completa tus datos de facturación»** → lleva a la pantalla que C ya construyó.

## 🔴 Lo que NO se puede hacer, y es la razón de la firma

**No se mapea a «preparando».** *Eso le diría a la familia que espere tranquila mientras
el sistema la está esperando a ella* — y el documento no avanza solo: se queda ahí hasta
que alguien cargue la cédula o el RUC.

Los otros tres estados internos **sí** son «preparando» (`borrador`, `emitiendo`,
`pendiente_manual`), y ésos sí son espera de verdad: el pipeline está trabajando.

## Cuándo aparece

Cuando el pago **supera el tope de consumidor final** (`app_config.fiscal_tope_consumidor_final`,
hoy **$50**) y la familia no eligió identificación. El motor **no inventa** un consumidor
final por encima del tope: *facturar a «CONSUMIDOR FINAL» algo que por ley exige
identificación es emitir mal a propósito para no dejar un hueco visible.*

## El mapeo completo, para que no haya dos verdades

| interno | `estadoVisible` | tratamiento |
|---|---|---|
| `borrador` · `emitiendo` · `pendiente_manual` | `preparando` | espera, sin acción |
| **`esperando_receptor`** | **`faltan_tus_datos`** | **acción de la familia** |
| `autorizada` | `lista` | descargable |
| `no_autorizada` | `con_problema` | — |
| `anulada` | `anulada` | — |

**La traducción la hace el SERVIDOR** — no la repitas en la pieza. Si mañana cambia, cambia
en un lugar.

---

*A · S115. El contrato completo: `docs/loop/buzon/S115-A-para-B-y-C-contrato-fiscal.md`.*
