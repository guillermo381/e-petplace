# Placas · el método de impresión

> **La impresión queda FUERA de S113 (firma del founder, 7-sep-2026).** Esto es
> el método, para que el día que se retome nadie tenga que reconstruirlo.
> **Lo que sí queda vivo y probado es la asociación desde la app.**

## Qué existe hoy, medido

| pieza | estado |
|---|---|
| `crear_lote_placas(nombre, cantidad, proveedor)` | vive · exige **admin** |
| `listar_placas_de_lote(lote_id)` | vive |
| `activar_placa(token, mascota_id)` | vive · wrapper `activarPlaca` en la puerta única |
| `pasaporte_lote` | guarda **`creado_por` y `creado_en`**: quién y cuándo, ya |
| página pública `www.epetplace.com/p/<token>` | vive · responde `placa_libre` |
| pantalla **Placas** en el portal admin | vive (`e-petplace-admin @ c0aee5e`) |

⚠️ **Cero lotes y cero placas creados**: está construido y **sin ejercer**.

## Lo que el portal exporta

**Un CSV**, no un ZIP de SVG, y la razón está medida: el ZIP exige `jszip` en el
portal y generar N SVG en el navegador. El CSV lo abre cualquier imprenta y
**contiene lo único que no se puede regenerar: el token**.

```
serie,token,url
1,a7f3…,https://www.epetplace.com/p/a7f3…
```

*Un lote se crea una vez; el dibujo del QR se puede rehacer siempre.*

## Cómo se pide el SVG de cada QR

La edge ya lo sirve, sin dependencia nueva en ningún lado:

```
GET https://<proyecto>.supabase.co/functions/v1/pasaporte?token=<token>&formato=svg
```

Devuelve un `<svg>` de un solo `<path>`, ~1-2 kB, sin fuentes ni imágenes
embebidas — apto para grabado vectorial. La URL que codifica es
`https://www.epetplace.com/p/<token>`, y **vive en un solo lugar del código**
(`_shared/qr.ts`) *porque este texto se graba en metal: una barra de más es un
lote entero al tacho.*

## Qué pedirle al proveedor

- **Grabado láser con datos variables.** Cada placa lleva un QR distinto; no es
  una tirada con arte fijo. Es la diferencia de precio más importante y la que
  hay que nombrar en la primera conversación.
- **Material**: acero inoxidable o aluminio anodizado. *El latón se raya y un QR
  rayado deja de leerse — y esta placa existe para leerse el día que el animal
  está perdido, no el día que se compró.*
- **Tamaño mínimo del QR: 15 mm de lado.** Por debajo, un teléfono con la mano
  temblando de alguien que encontró un perro suelto no engancha.
- **Corrección de error ALTA (nivel H, 30 %).** No es prolijidad: la placa va
  colgada del collar, se raya y se llena de barro. Con corrección baja, un
  arañazo la vuelve ilegible.
- **Muestra de CINCO antes de la tirada**, y se escanean las cinco **con un
  teléfono común, no con un lector industrial**. *Un QR que lee el escáner del
  proveedor y no el teléfono de una familia no sirve para nada.*
- Grabar también la **serie** en texto pequeño: si el QR se destruye, la serie
  permite encontrar el token en el CSV.

## Qué falta el día que se retome

1. **El ZIP**, si el proveedor lo exige. Es `jszip` en el portal admin y un
   bucle sobre la edge. Media hora.
2. **Decidir dónde se venden** (Despensa) y a qué precio — no está decidido.
3. **Ejercer un lote de verdad**: hoy hay cero, así que ninguna de las tres
   funciones se corrió nunca contra datos reales. *Que compile no es que corra*
   (`L-402`).


---

## La asociación desde la app: probada de punta a punta (7-sep)

El circuito entero corrió contra la base real, con el admin verdadero y la
familia del founder. Residuo 0: el lote de prueba se borró.

| paso | resultado |
|---|---|
| ① el admin crea un lote de 3 | lote `54cf4a84` |
| ② la primera placa tiene token | `gj3zL5TgEMJg…` |
| ③ activar con una mascota de **otra familia** | **`no_access_to_mascota`** |
| ④ el titular activa la suya | `ok: true` + `pasaporte_id` |
| ⑤ activar **dos veces** | **`placa_ya_activada`** |

Los tres rojos del brief pasan, y el ⑤ dice **qué pasó** en vez de un error
genérico: *«ya está activada» es una respuesta; «algo salió mal» manda a
reintentar lo que nunca va a funcionar.*

## 🔴 Un hallazgo del circuito, para el día que se retome

**`pasaporte_placa` no tiene `GRANT SELECT` para `authenticated`.** La app **no
puede leer la tabla**: sólo puede llamar a `activar_placa`, que es `DEFINER`.

Eso está BIEN por privacidad —*un token es de quien lo tiene en la mano, y una
tabla legible es una tabla enumerable*— pero tiene una consecuencia de producto
que hay que decidir: **la app no puede avisar «esta placa ya está activada»
antes de intentar**; se entera por el rebote. La página pública sí lo sabe,
porque la edge corre con credencial de servicio.

Dos salidas, ninguna elegida: que el rebote alcance (es hablado y llega rápido),
o una RPC `estado_de_placa(token)` que devuelva sólo `libre | activada` **sin
decir de quién**. La segunda cuesta diez líneas; la primera cuesta cero.

---

## ⑤ EL ESTRENO DE `crear_lote_placas` — bloqueado por credencial, no por trabajo

**Medido:** `pasaporte_placa` tiene **0 filas**, `crear_lote_placas` **nunca
corrió**. El gate `verify:placas-lote` da su rojo con ese número.

🔴 **No lo corrí yo, y la razón es la ley y no la comodidad.** La única cuenta
admin de la base es `guillo381@` (medido: 1 admin, del founder); la que tengo en
el llavero es `guillo381+8@`, que **no es admin** (`is_admin` → `false`), y su
clave no abre la otra.

**Correrlo con `service_role` habría dado el mismo verde y no habría probado
nada**: esa credencial saltea el gate de admin, que es justamente la parte sin
estrenar. *Un gate se verifica por el camino de la pantalla, jamás por la
defensa que uno supone* (L-167). **Un verde flojo acá es peor que el rojo
honesto**, porque el rojo dice la verdad y el verde la esconde.

### Los tres pasos, para que sea un minuto

```
cd ../e-petplace-admin && pnpm dev        # el portal, en local
```

1. entrar con la cuenta **`guillo381@`** (la admin)
2. **Placas** → nombre del lote, cantidad (**20 alcanza para el estreno**),
   proveedor
3. **Crear** · después, «Descargar CSV» — es lo que va a la imprenta

Y para dejar constancia de que fue por el camino real:

```
node scripts/verify-placas-lote.mjs      # tiene que pasar a verde
```

⚠️ **El gate no puede distinguir un lote hecho por el portal de uno hecho con
`service_role`**: `pasaporte_placa` no guarda quién creó el lote. *Se declara en
vez de fingir que se mide* — la constancia de que fue por la pantalla la deja
quien lo hace, acá, con la fecha.
