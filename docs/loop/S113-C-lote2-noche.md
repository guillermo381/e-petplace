# S113-C · lote 2, noche — lo que medí, y por qué no entrego código

**Rama `pista/s113-c-1.2b`** sobre `main @ 36cf0bd8` (con mi 1.2.1 ya mergeado y
publicado por A). **Cero aparato. Ningún OTA.**

---

## LO QUE HICE

Medir las tres cosas que tenía asignadas, encontrar que **ninguna tiene todavía
sus dependencias**, y **encontrar dos cosas que van a costar caro si nadie las
mira antes de construir**. Está todo en `docs/loop/S113-NOCHE-PENDIENTES.md`.

### 🔴 ① El brief del 2.2 se apoya en una premisa falsa

`extract-documento` **no lee exámenes ni recetas**: devuelve
`{nombre, numero_documento, tipo_documento ∈ CEDULA|PASAPORTE|RUC}` y nació para
**pre-llenar el alta del repartidor con la foto de su cédula** (su propia
cabecera lo dice). *Comparten el nombre y nada más.*

D tiene asignado «prompt v2» sobre ella. **No es un v2: es una función nueva.**
*Presupuestar construcción como enmienda de algo que existe es el error que ya
nos costó una tanda* — el portal admin de S95-F: «existe y no sirve para esto».

### ② Y está desplegada sin un solo llamador en el monorepo

Cero en `apps/`, cero en `packages/`, **sin wrapper en la puerta única**. Mismo
patrón que `chat-ayuda` (D-717), que terminó borrada. **No propongo borrarla**:
su consumidor puede vivir en el portal legado, y eso no se mide desde acá.

### ⚠️ ③ El rojo que va a nacer en el 2.0, escrito antes de que nazca

En memorial **la presencia SÍ se monta** (`PresenciaSinCoach`) — *la puerta a lo
que te espera no se le quita a nadie; lo que se apaga es el Coach* (D-1021).

⇒ **Si la caja de texto de Nexo vive en la Hoja compartida, aparece en
memorial**, y el objetivo del lote dice «apagado en memorial».

*Hoy no es un defecto: la caja no existe. Lo escribo ahora porque después va a
parecer obvio y nadie va a acordarse de que había dos variantes de la misma
Hoja.* **Voto: la caja se declara por variante, por tipo, no por cuidado.**

---

## ④ POR QUÉ NO HAY CÓDIGO

| frente | qué me toca | qué falta en `main` |
|---|---|---|
| **2.0** | cablear la Hoja, deep links, memoria, búsqueda desde el Hogar | las RPC de A · la Hoja de B · la edge de D |
| **1.3 pasaporte** | la pantalla y sus acciones | `emitirPasaporte`·`marcarPerdida`·`configurarPasaporte` (A) · `TarjetaPasaporte`·`PlacaQR` (B) |
| **2.2 bóveda** | la pantalla «Traer papeles» | la puerta de A · y ① |

**Todo mi trabajo del lote 2 es cableado**, y no llegó nada que cablear.

**Lo único de mi lista sin dependencias ya estaba hecho y lo verifiqué:**
*memorial apagado* — `verify:nexo` lo cubre (la presencia no lleva Coach, el
hogar entero da «ninguna»), y la caja, cuando llegue, cae dentro de esa misma
decisión.

### Lo que descarté a propósito, para no simular entrega

- **La voz del aviso de IA**: el brief la pone explícitamente en «lo que espera
  al founder». Escribirla hoy es letra que se reescribe cuando se vea.
- **Un `vaConCaja(foco)` dejado listo**: sería una función sin llamador —
  **motor sin puerta**, que es justo lo que esta casa persigue (`L-318`).

*Declaro el bloqueo en vez de fabricar entregas: una pista que inventa trabajo
para no reportar vacío es una pista que después hay que revisar dos veces.*

---

## ⑤ EN CUANTO LLEGUE ALGO

Puedo cablear **el mismo día**, sin re-medir, porque el terreno ya está leído:
la Hoja se monta en `(tabs)/_layout.tsx:275` con sus dos variantes, la decisión
vive en `lib/nexo/atajos.ts` (`focoNexo` · `vaConCoach`), el Hogar es
`(tabs)/hogar/index.tsx`, y los deep links de mascota ya andan
(`/hogar/mascota/[mascotaId]`, `/hogar/bitacora`, `/carnet`, `/antiparasitario`).

## GATES

`nexo` **344 casos** ✓ · `confirmable` ✓ · `pide-en-memorial` ✓ · `hooks` ✓ ·
`hooks-bajo-return` ✓ · `ref-antes-de-uso` ✓ · `gates-existen` ✓ ·
`puerta-unica` ✓ · `coach` ✓ · `glifos` ✓ · `diseno` **VERDE, 61 reglas** ✓ ·
`tsc apps/cliente` **0** ✓.
