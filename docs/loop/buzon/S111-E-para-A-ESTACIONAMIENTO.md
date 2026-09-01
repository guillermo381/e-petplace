# BUZÓN · S111-E → A · UN ÍTEM PARA EL ESTACIONAMIENTO

> **Asunto único.** Formato de `S111-ESTACIONAMIENTO.md`, las cinco partes.
> **Evidencia:** medición ③ en `docs/loop/S110-E-MEDICIONES-3-A-6.md`
> (commit `47bbb6ddb18a5105f21abe02bdd12e50c3aff5c0`).

---

## ¿QUÉ ACTIVA EL CANAL DE CONVERSACIÓN CUANDO NO HAY SERVICIO?

**① QUÉ FALTA.** §5 pide una conversación entre publicador y solicitante, con
estados (recibida · en conversación · aceptada · declinada). **§6.4.7 —decisión
cerrada S20— dice literal: *«Sin servicio activo, no hay canal»*, y refugio y
adoptante NO comparten cita.** Medido: no existe mensajería entre dos cuentas
(única tabla `ticket_mensajes`, usuario↔admin, 0 filas, 0 wrappers de 110, 0
rutas de 174). ⇒ **La regla vigente, aplicada al pie, deja la conversación de §5
sin poder existir.** No es que falte construirla: **está excluida por diseño.**

**② LAS OPCIONES.**
- **(a) LA SOLICITUD DE ADOPCIÓN ES UN ACTIVADOR DE PLENO DERECHO**, igual que una
  cita: el canal se abre al postular y se cierra con el desenlace. Se ensancha el
  vocabulario del activador; el principio de §6.4.7 no se toca.
- **(b) CANAL PROPIO DE ADOPCIÓN**, superficie separada del canal
  prestador↔familia, con su propia regla de vida.

**③ EL VOTO DE E: (a).** §6.4.7 no dice «cita»: dice *«cita / servicio /
**contrato** activo»*, y una solicitud de adopción es exactamente eso — un vínculo
acotado entre dos cuentas, con principio y con fin. **(a) ensancha el activador
sin tocar el principio** (privacidad, trazabilidad, no llevarse al otro fuera del
ecosistema); **(b) crea un segundo canal cuya divergencia hay que sostener para
siempre**, y la casa ya sabe lo que cuesta una pieza duplicada que empieza igual.
⚠️ **El costo de MI propia opción, declarado:** (a) obliga a definir **el cierre
del canal cuando la solicitud se declina** — quién puede volver a escribir, por
cuánto tiempo. *(b) no tiene ese problema porque lo resuelve por separado.*

**④ QUÉ SE CONSTRUYÓ ALREDEDOR — nada, y es fail-closed por construcción.**
La pista E es de **sólo lectura**: no tocó una línea de código, ni una migración,
ni un seed. **No hay puerta abierta que cerrar ni trabajo a medias que revertir.**
El estado actual ya es el fail-closed: **sin canal, la conversación de §5
simplemente no existe, y ninguna superficie la promete.**

**⑤ QUÉ SE ROMPE SI SE ELIGE MAL.**
- **Si se elige (a) y no se decide el cierre al declinar:** un refugio que dijo
  que no queda **escribible para siempre** por alguien a quien rechazó. *Es el
  peor modo de falla de los dos, porque no se ve al construir: se ve cuando una
  persona usa el canal para insistir.*
- **Si se elige (b) y después se quiere unificar:** dos canales con dos reglas de
  vida, dos superficies y dos historiales que **no se pueden fusionar sin decidir
  de quién es cada mensaje** — y el historial es justamente lo que §6.4.7 protege
  para las disputas.
- **Si no se elige ninguna:** §5 no se puede construir. **La conversación es la
  mitad del vertical de adopción**, así que esta firma bloquea el bloque entero,
  no un detalle.
