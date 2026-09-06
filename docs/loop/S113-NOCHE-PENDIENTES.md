
---

## C · noche del lote 2 — cuatro anotaciones, todas medidas

### ① 🔴 EL BRIEF DEL 2.2 SE APOYA EN UNA PREMISA FALSA — `extract-documento` no es eso

El brief dice: *«extract-documento ya existe: fotos o PDF de exámenes, recetas e
informes → eventos tipados con adjunto»*.

**Medido en su fuente** (`supabase/functions/extract-documento/index.ts`, 206
líneas): devuelve `{nombre, numero_documento, tipo_documento}` con
`tipo_documento ∈ {CEDULA, PASAPORTE, RUC}`, y su propia cabecera dice para qué
nació: *«el alta del repartidor se pre-llena de una foto del documento»*.

⇒ **Es un lector de documentos de identidad DE PERSONAS**, no de papeles
clínicos de mascotas. *Comparten el nombre y nada más.* Ni PDF, ni exámenes, ni
adjuntos, ni eventos de mascota.

**Por qué importa antes de empezar:** D tiene asignado *«prompt v2 con el
contrato del carnet»* sobre esta función. **No es un v2: es una función nueva**,
y presupuestarla como enmienda de algo que existe es la clase de error que ya
nos costó una tanda (el portal admin de S95-F: *«el portal existe y no sirve
para esto»*).

**Voto de la pista:** que el 2.2 la trate como **construcción nueva** —con el
molde de `extract-vacuna`, que sí es su clase— y que **`extract-documento` no se
toque**: su consumidor es el alta del repartidor, y cambiarle el contrato para
otra cosa rompería eso.

### ② `extract-documento` está desplegada y SIN UN SOLO LLAMADOR en el monorepo

`grep` sobre `apps/` y `packages/`: **cero**. Y **no tiene wrapper en la puerta
única**. O su consumidor vive fuera de este repo (el portal legado), o quedó
huérfana. *Precedente exacto: `chat-ayuda` — desplegada, facturable, sin fuente
en el repo (D-717), y se borró.*

**Voto:** censarla antes de tocarla. **No propongo borrarla**: el alta del
repartidor puede estar llamándola desde otro lado, y eso no se mide desde acá.

### ③ ⚠️ RIESGO LATENTE DEL 2.0, para B y para mí — la Hoja se abre en memorial

Medido en `apps/cliente/src/app/(tabs)/_layout.tsx:275`: en memorial **la
presencia SÍ se monta**, en su variante `PresenciaSinCoach` — *«la puerta a lo
que te espera no se le quita a nadie; lo que se apaga es el Coach»* (D-1021).

⇒ **Si la caja de texto de Nexo vive en la Hoja compartida, va a aparecer en
memorial** — y el objetivo del lote 2 dice, textual, «apagado en memorial».

*No es un defecto hoy: la caja no existe. Es el rojo que va a nacer el día que
se agregue, si nadie lo mira antes.* Lo escribo ahora porque **después va a
parecer obvio y nadie va a acordarse de que había dos variantes de la misma
Hoja**.

**Voto:** la caja se declara **por variante**, no por Hoja — que la que no lleva
Coach tampoco pueda llevarla, por tipo, no por cuidado.

### ④ C está bloqueada en sus TRES frentes, y no invento trabajo para llenarla

| frente | lo que me toca | qué falta |
|---|---|---|
| **2.0** | cablear la Hoja, deep links, memoria, búsqueda desde el Hogar | las RPC de A, la Hoja de B, la edge de D — **nada en `main`** |
| **1.3 pasaporte** | la pantalla y sus acciones | `emitirPasaporte` / `marcarPerdida` / `configurarPasaporte` (A) y `TarjetaPasaporte` / `PlacaQR` (B) — **cero ocurrencias en los índices** |
| **2.2 bóveda** | la pantalla «Traer papeles» | la puerta de A, y ① de arriba |

**Lo único de mi lista que NO dependía de nadie ya está hecho y verificado:
«memorial apagado»** — `verify:nexo` lo cubre (*la presencia no lleva Coach, el
hogar entero da «ninguna»*), y la caja, cuando llegue, vivirá dentro de esa
misma decisión (③).

*Declaro el bloqueo en vez de fabricar entregas: una pista que inventa trabajo
para no reportar vacío es una pista que después hay que revisar dos veces.*
