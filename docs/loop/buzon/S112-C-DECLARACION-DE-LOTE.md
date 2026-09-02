# S112-C · DECLARACIÓN DE LOTE — **hasta acá entra**

```
HASTA ACÁ ENTRA:   63054b7c9bd2de6339daca9dd083e384d304e644
rama:              pista/s112-c
```

**Verificado por SHA contra origin** (`git ls-remote` = `git rev-parse HEAD`),
árbol limpio, **y NO por código de salida** (`L-239`).

## 🔴 EL PORTAL DE ADOPCIÓN DEL PRESTADOR **NO ENTRA** — y cómo se sacó

`apps/prestador/src/app/adopcion/**` **no existe en este SHA.** Se retiró con un
**revert** (`63054b7c` revierte `2226081c`), y las cuatro huellas se fueron
juntas: las dos pantallas **y sus voces en los dos idiomas**. *Dejar las voces
habría sido peor que dejar el código: strings huérfanos que el próximo censo lee
como deuda sin dueño.*

**Por qué revert y no una rama aparte ni un rebase:** el portal es `2226081c`,
**anterior a casi todo lo que vino después** — el gate de adopción, la
bifurcación del onboarding y las dos mitades de `D-1001`. Un SHA que no lo
incluyera se llevaría puesto todo eso, y rebasar a esta hora para mover un
commit de en medio es el riesgo que no vale. **El revert saca las huellas del
binario y deja el trabajo intacto en la historia.**

**Cómo vuelve, y por eso esto no pierde nada:** `git revert 63054b7c` — una
línea, en el lote de adopción. El trabajo está escrito, con typecheck verde y
sus voces completas.

⚠️ **NO se subió el baseline de `verify:razon-muda` a 7**, y la razón la da el
propio gate: *un caso nuevo se declara jamás en el mismo commit que lo
introdujo.* Además sería **declarar aceptable una razón muda de adopción para
que viaje un lote de guardería** — pagar en calidad de una vertical el pasaje de
otra.

## LO QUE SÍ ENTRA

| qué | commit |
|---|---|
| **`D-1000`** — muere el espejo del tramo vivo | `5ba785c0` |
| **El censo del hogar vacío + `SinQuienReservar`** (un guard con dos hechos adentro, en las 5 raíces de oficio) | `b6f60a0f` |
| **El hogar sin mascotas recompuesto** + entrada de adopción **apagada** | `4e4f5302` · `d7ff2538` |
| **El onboarding con salida** — `BifurcacionDeEntrada`, construida con su puerta cerrada | `cf139002` |
| **`D-1001`, las dos mitades**: el rebote con nombre · **la puerta apagada ANTES del botón** sobre `puedeContratarGuarderia` | `4fe6be82` · `dfb29722` |
| **El rebote de postular** deja de mentir en su comentario y gana camino | `08f66aeb` |

**Recuperación de contraseña: NO lleva código, y es un hallazgo, no una
omisión.** Medido: ya aterriza en `/` con la sesión de `verifyOtp` viva, y el
correo manda **código de 8 dígitos, no link** — *no hay deep link que rutear.*
Lo que faltaba era el destino, y lo cubre el onboarding con salida.

## ESTADO DE LOS GATES EN ESTE SHA

| gate | resultado |
|---|---|
| `tsc` cliente · prestador · ui | **0 · 0 · 0** |
| `verify:diseno` | **VERDE**, 62 reglas |
| `verify:razon-muda` | **VERDE — el número no subió** |

## ⚠️ LO QUE NO ESTÁ VERIFICADO, Y SE DICE

**Ninguna pasada de aparato.** Lo verificado es typecheck, gate de diseño y
medición contra el objeto. *Que el motor conteste no prueba que la pantalla
pinte* — y de este lote, lo que el founder va a ver por primera vez son la voz
del hogar vacío, el guard de los oficios y la razón del plan de guardería.

## ⏸️ ADOPCIÓN EN EL CLIENTE — apagada, con su interruptor

`apps/cliente/src/lib/gate-adopcion.ts` → `ADOPCION_ALCANZABLE = false`, con
**tres** lectores: Explorar · el hogar sin mascotas · el onboarding. **A lo
verificó contra el bundle y no encontró una cuarta puerta descubrible.** Las
rutas `/adoptar` siguen existiendo —no son secreto, y la puerta desde el login
es de S111-C— pero **el descubrimiento está apagado**.

— **Pista C, S112**
