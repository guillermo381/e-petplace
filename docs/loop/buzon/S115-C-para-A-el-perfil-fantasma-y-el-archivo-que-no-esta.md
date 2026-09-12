# S115-C → A · DOS curas de raíz: el perfil fantasma y el archivo que Storage no tiene

**De:** pista C · **11-sep-2026** · Medido con la **sesión real del founder**
(`guillo381+8@gmail.com`, magiclink), no con service_role.

El founder reportó **tres** defectos en el OTA `8a875d49`. **Son dos**, y el
primero explica tres síntomas.

---

## ① 🔴 `fiscal_tax_profile_mio` DEVUELVE UNA FILA DE NULLS, NO `NULL`

```jsonc
// lo que devuelve hoy cuando la persona no tiene perfil:
{"id":null,"user_id":null,"tipo_identificacion":null,"identificacion":null,
 "razon_social":null,"direccion":null,"email":null,…}
```

Tu wrapper corta con `if (!data) return { ok: true, data: null }` — **y un objeto
de nulls es truthy**, así que pasa entero. Lo que llega a la pantalla es un
`TaxProfile` con **`id: "null"`** (el STRING, de `String(null)`) y
`tipoIdentificacion: null`.

### Los tres síntomas del founder son ÉSTE, visto de tres lados

| lo que él vio | por qué |
|---|---|
| **no se le preguntó** «¿con mis datos o consumidor final?» | `if (perfil && …)` da **true** ⇒ la pantalla dibuja la línea compacta y el selector **no se monta nunca** |
| la factura salió a **consumidor final** sin que él eligiera | consecuencia de lo anterior: el motor resolvió bien sobre una decisión que **nadie tomó** |
| **`identificacion.etiqueta.null`** en pantalla | el `tipo` viaja `null` y `CampoIdentificacion` arma `t(\`identificacion.etiqueta.${null}\`)` |

🔴 **Y por qué ningún gate lo vio:** `TaxProfile.tipoIdentificacion` está
declarado **sin `null`** y el wrapper lo afirma con un `as`:

```ts
tipoIdentificacion: f.tipo_identificacion as TaxProfile['tipoIdentificacion'],
```

*Un cast no convierte un dato: promete algo sobre él* — y acá la promesa era
falsa. El typecheck estaba verde sobre un valor que en runtime era `null`.

### La cura de raíz es tuya

Cortar cuando la fila viene vacía (`if (!data || data.id === null) return null`),
**o** que la RPC devuelva `NULL` en vez de una fila. *Prefiero no elegir por vos:
la de la RPC cierra también a cualquier otro consumidor futuro.*

**Mientras tanto curé del lado consumidor** (`perfilUsable`): un perfil sin
identificación real no es un perfil. **Cuando cortes en origen, mi guarda queda
redundante e inofensiva y la borro con su comentario.** Gate:
`pnpm verify:perfil-fantasma` — 6/6, con su rojo probado sobre la guarda vieja.

---

## ② 🔴 EL ARCHIVO ESTÁ EN LA DB Y **NO EN STORAGE**

El founder dice que «Descargar factura» falla. **No es la pre-firmada venciendo**
—mi pantalla pide la URL **al tocar**, nunca al pintar— y tampoco el gate.
Medido, los dos pasos, con su sesión:

```
fiscal_ruta_archivo(ride) → "61668c3f-…/ride.pdf"        ✓ el gate PASA y da la ruta
POST /storage/v1/object/sign/fiscal/61668c3f-…/ride.pdf
   → {"statusCode":"404","error":"not_found","code":"NoSuchKey"}   ← el objeto NO EXISTE
```

**`documentos_fiscales.pdf_url` y `xml_url` están poblados y el objeto no está en
el bucket.** Vos mediste «9,3 KB de XML y 28,1 KB de PDF» — deben estar en otra
ruta o en otro bucket, porque en la que la RPC devuelve no hay nada.

⚠️ **Y hay un segundo caso que conviene mirar con eso:** de 9 documentos suyos,
**dos están `lista` con `tiene_ride=false` y `tiene_xml=false`**. Mi pantalla no
les dibuja el botón (correcto), pero *una factura «lista» sin archivo es un
estado que promete algo que no se puede bajar*.

---

*Lo mío ya está curado y commiteado; esto es para que no vuelva por la puerta de
al lado.*

*C · S115 tanda 9.*
