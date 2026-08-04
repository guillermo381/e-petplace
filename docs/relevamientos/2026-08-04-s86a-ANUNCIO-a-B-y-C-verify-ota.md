# S86-A · ANUNCIO A B Y C — el paso ⓪ gana su segunda mitad

> **Firmado por la mesa el 4-ago-2026.** Viaja **en el mismo commit que el
> enganche**, por orden expresa: *un cambio al gate que se anuncia después de
> hacerse ya cambió la vara debajo de quien estaba midiendo.*
>
> **Los dos mensajes de abajo se envían TEXTUALES y EN MENSAJES PROPIOS** (§4
> del método: una orden a una pista dentro de un mensaje a la mesa **no llega**).
> No se resumen ni se funden en uno solo.
>
> **Qué cambió, en una línea:** *"cerrado" ya no es "el group está publicado" —
> es "el group está publicado **y el servidor lo sirve**".*

---

## ✉️ MENSAJE 1 — PARA C *(enviar solo a C)*

**Destinatario: pista C.** Cambio de gate, firmado por la mesa hoy. Te toca
directo porque es tu app y tu canal.

**QUÉ CAMBIÓ.** El paso ⓪ tenía una sola mitad: verificar el **ancla** antes de
bundlear. Desde hoy tiene una segunda, que corre **después del publish**:
`scripts/verify-ota.mjs`. **Un publish sin su verde no se declara cerrado.**

**POR QUÉ, con su fecha.** El 4-ago el OTA del prestador salió con **todo
verde** —12 hashes ancestros de `origin/main`, árbol limpio, el group propio
como cabeza del branch— **y el founder no vio ningún cambio.** Ninguna
verificación del paso ⓪ podía fallar, porque **ninguna preguntaba qué le
responde el servidor a un aparato que pregunta como aparato.** `update:list`
describe **lo que se guardó**; el guard mide **lo que se sirve**.

**QUÉ NO CAMBIA PARA VOS, y conviene decirlo para que nadie lo lea de más:**

- **Seguís sin publicar.** El publish sigue siendo de A (§2). El guard lo corre
  quien publica, no vos.
- **No cambia nada de cómo commiteás, ni tus territorios, ni el reporte.**
- **No hay trabajo nuevo para vos en este anuncio.** Es información sobre cuándo
  tu trabajo se va a declarar entregado.

**QUÉ SÍ CAMBIA PARA VOS — dos cosas, las dos operativas:**

1. **El cierre de la veda te va a llegar un paso más tarde**, porque ahora hay
   una verificación después del publish. *Si te llega el ancla pero no el
   cierre, no es un olvido: es que el guard todavía no dio verde.* **Seguís
   congelada hasta el cierre explícito** — el que congela es el que descongela.
2. **Vas a ver un aviso nuevo en los reportes de publish: RUNTIMES HUÉRFANOS.**
   **Avisa, no frena**, y es letra de mesa. Su porqué te va a servir: el
   prestador tiene **cuatro** runtimes con binario instalable —`1.0.0`, `1.0.1`,
   `1.0.2`, `1.0.3`— y **el `1.0.2` recibe todavía el update del 26-jul**. *Por
   eso «si su APK fuera 1.0.2 no le llegaría» sonaba tan bien el 4-ago: era
   cierto y comprobable, y le faltaba que además le llegaría algo de hace nueve
   días.*

**UN COSTO QUE ACEPTAMOS DE ANTEMANO, y te lo decimos ahora para que el día que
pase no parezca un invento:** por L-197 el guard **sale ROJO cuando no puede
medir** —jamás verde—, así que **una caída de EAS puede frenar un cierre.** Es a
propósito: *un guard que ante la duda dice «verde» es exactamente el que no
hubiera atrapado el 4-ago.* Hay escape (`--sin-builds`), es ruidoso, y quien lo
use lo declara en el mismo mensaje del ancla.

**DÓNDE ESTÁ LA LETRA:** `docs/METODO_TRES_PISTAS.md` **§3bis** (comando, los
tres casos, el costo) y `docs/CONTRATO_TRABAJO.md` **regla 84, eslabón ③**. El
fixture con los rojos producidos: `…-s86a-FIXTURE-verify-ota.md`.

**Y LO QUE EL GUARD NO CUBRE, que es tuyo cuando toque:** él prueba que el
update **se sirve**; **`D-649`** es que el aparato pueda **ir a buscarlo** — hoy
no hay forma de forzar la búsqueda desde la app, y reinstalar (la única salida)
**borra la evidencia de por qué no bajó**. Registrada, **no** para construir
ahora: dispara cuando el prestador tenga superficie libre.

---

## ✉️ MENSAJE 2 — PARA B *(enviar solo a B)*

**Destinatario: pista B.** Cambio de gate, firmado por la mesa hoy. Te llega
porque cambia **cuándo tu trabajo se declara entregado**, no porque te pida
nada.

**QUÉ CAMBIÓ.** El paso ⓪ gana una segunda mitad que corre **después del
publish**: `scripts/verify-ota.mjs`. **Un publish sin su verde no se declara
cerrado.**

**POR QUÉ.** El 4-ago un OTA salió con el ancla verificada y **el founder no vio
nada**: todo lo que el paso ⓪ sabía mirar estaba verde, y **nadie preguntaba qué
le sirve el servidor a un aparato real.** *`update:list` describe lo que
guardaste; el guard mide lo que se sirve.*

**QUÉ SIGNIFICA PARA VOS, concreto:** tu trabajo en `packages/ui` viaja adentro
del bundle de las apps. Hasta hoy, "publicado" cerraba el asunto. **Desde hoy,
entre "publicado" y "cerrado" hay una medición más** — y si sale roja, **tu
pieza no llegó a ningún aparato aunque el group exista.** *El cierre te va a
llegar un paso más tarde; si tarda, no es olvido.*

**QUÉ NO CAMBIA:** nada de tu territorio, tu lint, tus tokens, tu forma de
commitear ni de reportar. **No hay trabajo nuevo para vos en este anuncio.**

**EL COSTO ACEPTADO, declarado:** por L-197 el guard **sale ROJO cuando no puede
medir**, jamás verde ⇒ **una caída de EAS puede frenar un cierre.** A propósito:
*un guard que ante la duda dice «verde» es el que no hubiera atrapado el 4-ago.*

**DÓNDE ESTÁ LA LETRA:** `docs/METODO_TRES_PISTAS.md` **§3bis** y
`docs/CONTRATO_TRABAJO.md` **regla 84, eslabón ③**.

---

## ⚠️ LO QUE ESTE ANUNCIO **NO** RESUELVE — a la mesa

**Una divergencia entre dos letras firmadas, encontrada al enganchar y dejada
declarada en vez de arreglada por mano propia:**

| dice | dónde |
|---|---|
| verificar el group con **`eas update:list`** | `CONTRATO_TRABAJO`, regla 84 eslabón ③ |
| verificar el group con **`update:view`**, y **`update:list` PROHIBIDO** *(no muestra el `gitCommitHash`)* | `METODO_TRES_PISTAS` §2 deber ③ |

**No se tocó porque resolverlo es decidir sobre letra firmada que esta enmienda
no tenía mandato de mover.** Queda nombrada en los dos documentos para que la
próxima sesión **no la descubra chocando**: *dos letras firmadas que se
contradicen son peores que una equivocada — cualquiera cita la que le conviene y
está «en regla».*

*Depositado por A, S86.*
