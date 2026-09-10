# S115-A → B y C · CONTRATO FISCAL (tanda 1)

Los nombres EXACTOS que las piezas y las pantallas van a recibir. Nada de esto se
adivina ni se re-deriva: si algo falta, se pide, no se inventa.

> ⚠️ **Estado: el motor existe, las pantallas NO.** Esta tanda no publicó nada. Lo
> de abajo está aplicado y verificado contra el objeto, y no viaja al aparato hasta
> el recorrido del final de la tanda 3.

---

## 1 · La puerta única — `@epetplace/api`

Ninguna pantalla toca la base. Seis funciones, todas con `ResultadoWrapper`:

```ts
fiscalMisDocumentos()            → ResultadoWrapper<DocumentoFiscalMio[]>
fiscalUrlFirmada(id, 'xml'|'ride', segundos?) → ResultadoWrapper<string>
fiscalObtenerTaxProfile()        → ResultadoWrapper<TaxProfile | null>
fiscalGuardarTaxProfile({...})   → ResultadoWrapper<TaxProfile>
fiscalAdminListar({estado?, desde?, hasta?}) → ResultadoWrapper<Record<string,unknown>[]>
fiscalAdminCerrarManual({...})   → ResultadoWrapper<{documentoId, contraSri: false}>
```

**`urlFirmada` son DOS pasos y no uno**: la RPC decide si podés ver el archivo (el
gate vive en el servidor) y recién con su ruta se firma. Vence a los 300 s por
defecto. El bucket `fiscal` es **privado**: no hay URL pública que mostrar.

---

## 2 · Los estados que el cliente PUEDE ver

`documentos_fiscales.estado` tiene siete valores internos. **La pantalla no los ve.**
El servidor los traduce y devuelve `estadoVisible`:

| interno | `estadoVisible` | qué decir |
|---|---|---|
| `borrador` | **`preparando`** | «Estamos preparando tu comprobante» |
| `emitiendo` | **`preparando`** | *(el mismo texto — ver abajo)* |
| `pendiente_manual` | **`preparando`** | ídem |
| `esperando_receptor` | `faltan_tus_datos` | pedirle cédula/RUC |
| `autorizada` | `lista` | se puede descargar |
| `no_autorizada` | `con_problema` | «Hubo un problema con tu comprobante» |
| `anulada` | `anulada` | — |

🔴 **`borrador` y `emitiendo` se muestran IGUAL, y no es pereza:** son estados del
pipeline, no del comprobante. *Distinguirlos en pantalla invita a la familia a
preguntar por qué su factura está «en borrador», que es una pregunta que no
debería poder hacerse.* La traducción vive en el SERVIDOR (`fiscal_mis_documentos`)
justamente para que ninguna superficie decida distinto.

---

## 3 · Los cuatro totales

Salen del documento, y son estos nombres:

```
subtotal_0    numeric   -- base gravada al 0 %
subtotal_15   numeric   -- base gravada al 15 %
iva           numeric   -- el IVA
total         numeric   -- subtotal_0 + subtotal_15 + iva
```

⚠️ **Se llaman así en `documentos_fiscales`.** Si alguien mira la vista vieja
`facturas` (lápida de compatibilidad) los va a ver como `iva_valor` y
`descuento_total` — **no se usa esa vista para nada nuevo**: existe sólo para que
el bundle publicado no rompa, y muere en la pasada siguiente al próximo publish.

**El desglose por LÍNEA** vive en `pagos_desglose_lineas` y ahí el nombre del código
de tarifa es **`codigo_iva`**. *(En `producto_variantes` y `pedido_items` esa misma
cosa se llama `impuesto_codigo` — no se renombró porque un bundle publicado la
consulta y D-662 lo prohíbe sin publicar en el mismo acto. La divergencia queda
ADENTRO del motor: lo que B y C consumen es `codigo_iva`.)*

---

## 4 · La identidad tributaria — `tax_profiles`

```
tipoIdentificacion : 'ruc' | 'cedula' | 'pasaporte' | 'consumidor_final'
identificacion     : string        -- consumidor final es SIEMPRE '9999999999999'
razonSocial        : string | null -- OBLIGATORIA si el tipo es 'ruc'
direccion          : string | null
email              : string | null
telefono           : string | null
esPredeterminado   : boolean       -- uno solo por persona (índice único)
```

Validaciones que **rebotan del servidor** (no las repitan en la pantalla, léanlas
del código de error): `ruc_invalido` (13 dígitos) · `cedula_invalida` (10 dígitos) ·
`ruc_sin_razon_social` · `tipo_identificacion_invalido`.

🔴 **`profiles.tipo_identificacion` YA NO tiene default.** Decía `'cedula'` en las
182 filas porque nadie lo escribió; ahora dice NULL en 180 y `'cedula'` en las 2 que
de verdad tienen cédula. **Una pantalla que muestre «Cédula» sobre un NULL vuelve a
inventar el dato.**

---

## 5 · El tope de consumidor final

```
app_config.clave = 'fiscal_tope_consumidor_final'   valor = '50'   (categoria: legal)
```

**Es DATO, no constante.** Lo mueve la norma, no un deploy — no lo escriban en el
código ni en un `const` de la pantalla.

La regla, que ya rige del lado del servidor: **por debajo del tope y sin elección →
consumidor final. Por encima del tope y sin identificación → el documento espera**
(`esperando_receptor`) y **no se inventa un consumidor final**.

⇒ **Lo que C tiene que construir (y todavía no existe): la captura de cédula/RUC en
el checkout.** Mientras no exista, todo pago sobre $50 queda esperando. *No es un
bug: es el motor negándose a facturar mal a propósito.*

---

## 6 · Lo que NO existe todavía (para que nadie lo dibuje)

Nota de crédito · el correo con el comprobante adjunto · la validación contra el
SRI · la liquidación · cualquier pantalla. Tanda 2 y 3.

---

## 7 · 🔴 UNA COSA QUE LES VA A CAMBIAR EL NÚMERO Y NO LA DECIDÍ YO

El catálogo ahora dice que **paseo · grooming · adiestramiento · guardería son
`EC_IVA_15`** (letra §3 flujo 4), y **los desgloses congelados dicen `impuesto = 0`**.
Medido sobre 27 pagos aprobados: **17 divergen, todos exactamente el 15 %**
($6,00 → $6,90 · $10,00 → $11,50 · $8,00 → $9,20), **$94,60 en total**.

Las dos salidas son de PRODUCTO, no de motor:
**(a)** el precio del prestador pasa a ser BRUTO ⇒ la familia paga lo mismo y el
prestador recibe menos · **(b)** el IVA se suma ⇒ **la familia paga 15 % más de lo
que ve hoy en la pantalla de ustedes**.

Mientras nadie firme, el motor **no elige**: deriva del catálogo y
`reconciliar_lineas_con_congelado()` rebota con
`tarifa_del_catalogo_no_coincide_con_el_congelado`. **No construyan pantalla de
precios sobre este punto hasta que la mesa firme** — el número que muestren hoy
puede ser el equivocado en las dos direcciones.

*(Y las tarifas de veterinaria y telemedicina están en `pendiente_ratificacion`:
la letra v0.4 E3 dice que el 0 % está en DISPUTA, no sólo pendiente.)*

---

*A · S115 tanda 1. Todo lo de arriba está aplicado y medido contra el objeto; los
números y sus comandos viven en `docs/loop/S115-A-T1.md`.*
