# PROVEEDOR_FISCAL.md — con quién facturamos, y por qué no con los otros

**v1.0 · 12 de septiembre de 2026 (S115-CIERRE).**

> **Cómo leer este documento.** Todo lo de abajo se **midió contra el objeto** el 12-sep-2026 —el código desplegado en `supabase/functions/_shared/facturacion/`, las edges `ACTIVE` en `zyltipqscdsdsxnjclhp`, y las respuestas reales de las APIs durante la evaluación—. Lo que **no** se pudo medir se dice, no se completa.
>
> **Por qué existe:** la elección de proveedor fiscal es de las que **se toman una vez y se pagan durante años**, y a los seis meses nadie se acuerda de por qué se descartó al otro. *Un descarte sin su razón escrita se revisa de nuevo cada vez que alguien nuevo mira el precio.*

---

## 1. El elegido — **Factuplan / SigniaDigital**

| dato | valor |
|---|---|
| Razón | SigniaDigital (marca comercial **Factuplan**) |
| RUC | **0993411372001** |
| Base de API | `https://api-rest.factuplan.com.ec/v1` |
| Autenticación | header `x-api-key` + header `x-taxpayer-ruc` |
| Secretos | `FACTURACION_API_KEY` · `FACTURACION_WEBHOOK_SECRET` (Supabase secrets) |

### 1.1 Sus DOS modos, y la diferencia es quién numera

Medido en `_shared/facturacion/factuplan.ts`:

| modo | endpoint | quién numera | quién arma el XML |
|---|---|---|---|
| `factuplan` | `POST /developer/invoices` | **ellos** | ellos, desde nuestro canónico |
| `factuplan_xml` | `POST /developer/sign-and-authorize` | **nosotros** | **nosotros** (el generador propio) |

🔴 **Tener los dos no es indecisión: es la salida del encierro.** *Un proveedor que numera es un proveedor del que no se puede salir sin renumerar toda la facturación.* Con `factuplan_xml` la numeración es nuestra y el proveedor queda reducido a firmar y enviar — que es la parte reemplazable.

⚠️ **Y tiene su costo, declarado:** el modo XML **agrega un modo de falla** —el cambio de esquema del SRI nos pega a nosotros primero— a cambio de no quedar atados. *La decisión es esa y no otra: se cambia dependencia por mantenimiento.*

**La consecuencia en la base:** `documentos_fiscales.numeracion_origen` ∈ `casa` · `proveedor`, y el CHECK de la clave de acceso **exige más cuando numeramos nosotros** (reconstrucción completa) y **exime ocho dígitos cuando numera el proveedor** (ver `MODELO_FISCAL` E8).

### 1.2 Los otros endpoints que usamos

`/developer/receipts/{id}/pdf` y `/{id}/xml` (los dos papeles) · `/developer/certificate/status` (vigencia del certificado) · `/developer/usage` (el cupo del plan).

### 1.3 Su webhook, firmado

`fiscal-webhook` (desplegada, `ACTIVE` v14, `verify_jwt: false` — es un webhook) valida contra `FACTURACION_WEBHOOK_SECRET`. *Sin firma, cualquiera podría marcar una factura como autorizada.*

### 1.4 🔴 LO QUE **NO** CUMPLE — y se escribe porque cada uno costó una vuelta

1. **`sendEmail` está documentado y la API lo RECHAZA.** Literal de la respuesta: `property sendEmail should not exist` (400, validación por lista blanca). ⇒ **el correo de la factura lo manda la casa**, no ellos. *La documentación decía que sí; la API desplegada dice que no, y manda la API.*
2. **El RIDE que emiten lleva LA MARCA DE ELLOS**, no la nuestra. Tenemos generador propio (`_shared/facturacion/ride.ts`, PDF real vía `pdf-lib`) y el que viaja hoy al cliente es el de ellos.
3. **`obligadoContabilidad` está detrás del plan pago** — no es un límite sobre el dato, es que **la pantalla donde se configura el emisor** requiere plan. ⇒ hoy el RIDE dice «Obligado a llevar contabilidad: NO» y **Satori Inov SÍ lo está** (`D-1075`).
4. **No hay renovación automática del plan.** *Un servicio fiscal que se corta por olvido de renovación corta la facturación entera* — va al calendario del founder, no a un cron.

---

## 2. Los descartados, con su razón

*Se listan para que el próximo que compare precios no tenga que volver a probarlos.*

### 2.1 Luma — descartado

- **No tiene API real** para el flujo que necesitamos.
- **Genera ellos la clave de acceso** ⇒ encierro de numeración, sin modo alternativo.
- **Las notas de crédito se hacen a mano.** *Un reembolso que exige que alguien entre a un panel no es un reembolso automatizable, y la devolución es justo el momento en que el cliente está enojado.*

### 2.2 Siigo / Contífico — descartado

- **Genera ellos la clave de acceso** ⇒ mismo encierro.
- **Sin webhook**: habría que consultar por *polling* si la factura se autorizó.
- **Exige `producto_id` de SU inventario** ⇒ obligaría a mantener un catálogo espejo del nuestro adentro de su sistema. *Dos catálogos de producto que tienen que coincidir divergen: es cuestión de cuándo.*
- **Envío al SRI cada hora**, no al momento.
- 🔴 **Documentación en IVA 12 %** — la tarifa de Ecuador es **15 %** desde 2024. *Una documentación desactualizada en la tasa del impuesto no es un detalle de redacción: es la señal de cuánto se mantiene el producto.*

---

## 3. Lo que este documento NO puede cerrar

- ⚠️ **`epetplace-facturacion-sri.md` NO EXISTE en este repositorio.** Se buscó por nombre (`find`) y por contenido (`grep` de `factuplan|signiadigital|luma|contifico|siigo` sobre `docs/`) el 12-sep-2026: **cero resultados**. El encargo del cierre pedía marcar sus secciones superadas y **no hay archivo que marcar**. *Si vive fuera del repo, su marcado es del founder; se declara en vez de inventarle secciones.*
- ⚠️ **El costo del plan y su vencimiento no están medidos acá** — son del panel de Factuplan, no del objeto.
- ⚠️ **Los cuatro incumplimientos de §1.4 no tienen fecha de solución comprometida por el proveedor.** Lo único que hoy nos protege del tercero es que el modo `factuplan_xml` existe.

---

## 4. El estado del motor fiscal, medido

**Las siete edges están desplegadas y `ACTIVE`** (`supabase functions list`, 12-sep-2026):

| función | versión | qué hace |
|---|---|---|
| `fiscal-emitir` | 17 | arma el canónico y emite |
| `fiscal-webhook` | 14 | recibe la autorización, firmado |
| `fiscal-reconciliar` | 9 | el reconciliador contra el proveedor |
| `fiscal-ride` | 9 | el RIDE propio |
| `fiscal-validar-clave` | 9 | pregunta al SRI por una clave de tercero |
| `fiscal-sonda` | 10 | la sonda del estado |
| `fiscal-ensayo` | 7 | el ensayo |

**Ambiente: `pruebas`** (`app_config.fiscal_ambiente`). **El reloj de emisión automática está ENCENDIDO** (`fiscal_emision_automatica = true`) **y sólo en pruebas** — producción es una segunda llave (`fiscal_forma_pago_asumida_en_produccion = false`).
