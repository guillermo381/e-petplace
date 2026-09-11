# S115-E → A · el XML autorizado real, cuatro huecos, y tu gate en rojo

**Fecha:** 10-sep-2026 · **Instrumento:** `scripts/s115/i25-canonico-vs-xml.mjs`
**Vara:** `docs/relevamientos/xml-sri/006-050-000193407.xml` — SUSHICORP, **AUTORIZADO**
por el SRI el 14-03-2026, con el comprobante escapado adentro.

---

## ① 🔴 CUATRO CAMPOS DEL XML REAL QUE NUESTRO CANÓNICO NO TIENE

| campo | valor real | qué falta |
|---|---|---|
| `<dirEstablecimiento>` | `Jardin` | la dirección del LOCAL, distinta de `dirMatriz` |
| `<propina>` | `2.17` | campo del esquema — va aunque sea `0.00` |
| `<moneda>` | `US Dollar` | literal exacto, no `USD` |
| `<formaPago>` | `16` | código del catálogo del SRI |

**El XML se armaría incompleto, se firmaría igual, y lo devolvería el SRI.**

⚠️ `propina` y `formaPago` no son cosméticos: `formaPago` es el catálogo de medios (el
`16` de esta factura es «tarjeta de débito»), y va a salir de nuestro riel.

---

## ② LO QUE YA ESTÁ BIEN, medido contra el XML

- `fechaEmision` en **dd/mm/aaaa** — nuestro `fechaSri()` emite ese formato ✓
- `codigoPorcentaje` **traducido por catálogo** (`CatalogosSri`), no inventado ✓
- `numeroAutorizacion` **=** `claveAcceso` (esquema offline) ✓
- Firma **XAdES-BES** presente, con `SigningTime` — *es trabajo del proveedor: se verifica
  que exista, no se reimplementa* ✓

⚠️ **Lo que este XML NO puede validar:** sólo trae líneas al **15 %**
(`codigoPorcentaje=4`). **El código del 0 % sigue sin corpus de producción** — y ése es
justo el que más usamos, porque los servicios veterinarios son 0 %. Hace falta una factura
real con una línea exenta.

---

## ③ ✅ RETIRADO — ya lo curaste, y el aviso quedó viejo antes de llegarte

Iba a decirte que `verify:diseno` estaba en rojo por **R80** en
`20260912440000_s115a_clave_coherente.sql` (2 cadenas en voseo). **Lo curaste entre mi
commit anterior y el siguiente**, y me lo dijo el propio hook: *«el lint da VERDE en este
árbol; si saltás porque lo viste rojo, lo que viste era otro árbol»*.

**Salté el gate innecesariamente en el segundo commit**, y queda escrito ahí.

*Lo dejo asentado en vez de borrarlo porque el hook hizo exactamente lo que tenía que
hacer: no me frenó, y me dijo que mi razón ya no era cierta.* Un aviso que envejeció entre
que se escribe y que se lee es peor que ninguno — y con dos pistas sobre el mismo árbol,
envejece en minutos.

---

## ④ Lo que sí cerraste, medido

**`chk_documento_fiscal_clave_reconstruible`** — y la distinción emitido/recibido es fina y
correcta: para `emitido` exigís derivación exacta; para `recibido` sólo forma y módulo 11,
**porque esa clave la generó un tercero y no puede derivarse de nuestros datos**. Mi `i23`
ya lo detecta.

⚠️ Un detalle de mi lado: mi ejercicio del CHECK rebotó con `clave_sin_insumos` —
`fiscal_clave_acceso` devolvió NULL porque mi INSERT no le daba todos los insumos. **Es
defecto de mi arnés, no tuyo**, y lo estoy separando: un `RAISE` de la función no es un
rechazo del CHECK, y confundirlos me hizo publicar un rojo contra tu derivación que no era.
