# PROPUESTA · que un tipo de servicio **no pueda existir sin su voz y sin su glifo**

> S109-D · 31-ago-2026. **Medida y NO construida — espera firma.**
> Nace del pedido del founder al firmar la cura de `guarderia_dia`: *«el archivo
> ya documentaba que esto pasó con telemedicina y el mapa siguió cerrado igual —
> lo que faltaba no era disciplina, era un mecanismo»*.

---

## ① LAS DOS FORMAS, Y UNA SE CAE AL MEDIRLA

### 🔴 A · `Record` exhaustivo con `never` — **NO ES VIABLE**

Exige una **unión de tipos** contra la cual exhaustivizar. **Medido:
`tipo_servicio` es `string` en los tipos generados** (`database.types.ts`, cinco
apariciones, todas `string`), porque en la base **no es un enum de Postgres**:
es `text` con FK al catálogo `tipos_servicio`, que es una **tabla de filas**.

⇒ TypeScript **no tiene contra qué comparar**. Construir la unión a mano
devuelve el problema con otro nombre: *alguien tendría que acordarse de agregar
el tipo nuevo a la unión* — que es exactamente la disciplina que falló dos veces.

### ✅ B · Gate que compara el mapa contra la BASE — **viable, y con números**

**Para cada tipo `reservable` del catálogo, que exista su clave de voz y su
glifo.** La fuente de verdad es la tabla, que es donde el tipo nace.

---

## ② EL NÚMERO DE HOY, y dice cómo tiene que nacer el gate

Medido contra la base y contra el mapa **post-cura**:

- **30 tipos** en `tipos_servicio` · **17 reservables**
- `KEY_VOZ_SERVICIO`: **14 claves**
- 🔴 **reservables SIN voz: 3** → `consulta_especializada` · `registro_evento` ·
  `servicio_exequial`

**El discriminador que el founder pidió, y lo tiene:** antes de la cura de hoy
eran **4** (con `guarderia_dia` adentro); ahora son **3**. **Rojo antes, menos
rojo después** — el gate mide el movimiento que le importa.

⚠️ **Pero nace en rojo, así que no puede nacer bloqueando.** Y de los tres, al
menos dos huelen a falso positivo del universo elegido: `registro_evento` es del
mostrador y `servicio_exequial` puede no ser comprable por la familia. **El
universo correcto no es «reservable»: es «lo que una familia puede ver en una
lista de citas»**, y eso hay que decidirlo — es la única parte que no puedo
medir sola.

⇒ **Forma sugerida: baseline solo-baja**, el patrón que la casa ya usa en `R66`.
Nace en 3, **no puede subir**, y muere cuando llegue a 0.

---

## ③ DÓNDE MIRAR, MEDIDO — son DOS mapas, no uno

| mapa | dónde | qué rompe si falta |
|---|---|---|
| `KEY_VOZ_SERVICIO` | `apps/cliente/src/lib/voz-servicio.ts` | **el nombre** — la cita queda muda |
| `iconoOficio()` | `apps/cliente/src/app/citas/[mascotaId].tsx` | **el glifo** — la fila queda sin marca |

*Los dos están en el camino de la misma pantalla, y por eso la estadía aparecía
sin nombre **y** sin glifo. Un gate que mire uno solo deja la mitad.*

**Censo del resto de la app de familia:** revisadas las 30 superficies que
enumeran tipos de servicio, **las demás no tienen mapa cerrado** — mencionan
oficios pero no enumeran, así que un tipo nuevo no las rompe.

---

## ④ ⚠️ UNA ADVERTENCIA SOBRE EL PROPIO GATE, medida en carne

**Mi primer intento de contar las claves del mapa dio 5 faltantes y eran 3.** El
grep `^  [a-z_]+:` tomó **los parámetros de la firma de la función** (`codigo`,
`t`) como si fueran claves, y perdió dos que sí estaban.

⇒ 🔴 **El gate tiene que PARSEAR el bloque del objeto** —recortar entre
`const KEY_VOZ_SERVICIO = {` y `} as const;`, y quitar comentarios— **no
grepear el archivo.** *Un gate que cuenta mal no es un gate flojo: es uno que va
a acusar tipos que sí están y absolver a los que faltan.*

*Es la tercera vez en esta sesión que un instrumento mío midió otra cosa —el
`grep` sin `-a` sobre el bundle, el censo por import de `L-451`, y éste—. Los
tres se cazaron igual: **con un control cuyo resultado ya se conocía.** El gate
debe traer el suyo.*

---

## ⑤ LO QUE PIDO FIRMAR

1. **Si va B** (el gate contra la base), y si nace **solo-baja** con baseline 3.
2. 🔴 **Cuál es el universo**: ¿«reservable», o «lo que la familia puede ver»?
   *De eso depende si los tres de hoy son deuda real o ruido.*
3. **Dónde vive el gate** — `verify:diseno` ya corre 62 reglas y tiene el patrón
   solo-baja andando; entrar ahí es más barato que un script nuevo. Es territorio
   de B/A.
