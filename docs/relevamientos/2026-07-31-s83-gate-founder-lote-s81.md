# S83 — EL GATE DEL FOUNDER SOBRE EL LOTE S81 (en dispositivo)

> **Registro de lo REPORTADO POR EL FOUNDER, S83.** Ni un veredicto de esta
> mesa: la vara la firma el founder sobre píxeles, jamás la sesión que
> construyó (**L-153**). Lo que sigue es acta de lo que él dijo y de lo que
> se midió a partir de eso — donde algo quedó sin cerrar, se dice.
>
> **Contexto operativo, medido:** el lote S81 del prestador estaba
> **commiteado y publicado** (group `875a3bbf`, runtime 1.0.3, ancla
> `a9cd032`, 30-jul) y **nunca había pasado por el teléfono** — el tercero
> de los tres eslabones de la regla 84. Este gate es ese eslabón.

---

## 1 · LOS DOS BARRIDOS **RIGEN** — sobrevivieron su ojo

El founder pasó los dos barridos de S81-B por el dispositivo y **los dos
quedan en pie**:

- **El barrido del teclado** (D-498 · `a673d55` · `e5b9997`) — `EvitaTeclado`
  promovido a `packages/ui` y aplicado sobre las 12 pantallas que lo pedían,
  con las 7 dejadas sin cura **a propósito** (todo `Campo` dentro de `Hoja`
  ya viene cubierto de fábrica: la Hoja porta el KAV).
- **El barrido de las tres leyes** (`8606308`) — `Campo sinCaja` por flip de
  default · el elegidor solitario · `Entrada` en las puertas.

**Por qué esto se registra y no se da por obvio:** un barrido es la clase de
trabajo que se aplica sobre decenas de pantallas **sin gate por pantalla**, y
por eso su riesgo no es el error puntual sino el error multiplicado. **Que
sobrevivan el ojo del founder es lo que los convierte de apuesta en base.**
Desde acá, las dos leyes se pueden citar como vigentes en dispositivo, no solo
como verdes de lint.

## 2 · PARADA 3 — **VERDE**

Pasó en dispositivo. Sin observaciones anotadas por el founder.

## 3 · PARADA 4 — **EN DIAGNÓSTICO**

No pasó y **no se declara fallada**: quedó en diagnóstico. Se registra así, sin
adornar hacia ningún lado — una parada en diagnóstico no es un verde con
asterisco ni un rojo cerrado, y llamarla de cualquiera de las dos formas
falsearía el estado. **Su causa y su cura son trabajo abierto.**

## 4 · LA VERDAD DE PRODUCTO QUE EL GATE DEJÓ DICHA

> **"Varios paseos simultáneos es lo natural del oficio."** — founder, S83.

**No es un caso de borde: es el caso normal**, y es el que sostiene la economía
del paseador (tres perros de tres familias en una salida). Se registra como
**verdad de producto** —no como pedido de feature— porque cambia cómo se leen
las piezas que ya existen y las que falten:

- **El motor YA la cumple** desde S67-V0: la ocupación se calcula **por
  PERSONA** y el paseo tiene `cupo_techo` 4 en `tipos_servicio`, precisamente
  para permitir la salida simultánea. No hay que construirlo: hay que dejar de
  contradecirlo.
- **La superficie la tiene a medias**: la salida grupal como **una** fila con
  pila de caras es **D-385**, abierta desde S59 (hallazgo de gate, mismo
  origen: el pulgar del founder).
- **La captura de GPS NO la cumple**, y eso nace hoy como **D-595**.

**Lectura de método:** las tres capas fueron construidas por sesiones distintas
y **solo el motor leyó bien el oficio**. Es la contracara de D-512
("construido y desconectado"): acá el motor entiende el negocio y las capas de
arriba asumen un caso más simple del que existe. **Cuando una verdad de
producto no está escrita, cada capa inventa la suya** — por eso se deposita
acá con su literal.

## 5 · LO QUE NACE DE ESTE GATE

| | qué | estado |
|---|---|---|
| **D-595** | el GPS asume UN paseo por vez, contra la verdad de §4 | 🔴 abierta, con el **seed de dos paseos simultáneos dentro de su condición de cura** — sin ese dato no hay forma de producir el rojo, y curar sobre un solo paseo daría verde sobre el caso no probado (L-192) |
| **Parada 4** | en diagnóstico | trabajo abierto, sin dueño asignado en este registro |

**Lo que NO nace:** ninguna ley. La regla 80 manda que la ley se escriba
**después** del resultado firmado, y de este gate lo firmado son los dos
barridos (§1) — que ya tenían su letra.

---

*Origen: gate del founder en dispositivo sobre el lote S81 del prestador
(group `875a3bbf`), reportado a la mesa en S83 y registrado por A4.*
