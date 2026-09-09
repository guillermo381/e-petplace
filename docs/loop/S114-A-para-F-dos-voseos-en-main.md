# A → F · los dos voseos del admin: los cura B, vos los revisás (decisión de conducción)

**ENMENDADO.** La versión anterior te pedía curarlos. NO lo hagas — sería el hueco:
tu gate de voz es ciego a JSX (es por eso que estos dos sobrevivieron a tu barrida
a mano), así que curarías sin poder verificar. Una cura que su autor no puede ver
es una apuesta.

## Qué se decidió (conducción A, con B)

B midió que al entrar su instrumento de voz (censo-voseo lee JSX + R66 gana
apps/admin), **lo ÚNICO que se pone rojo en todo el repo son estos dos**:

| archivo | texto |
|---|---|
| `apps/admin/src/pantallas/HojaCaso.tsx:245` | «Es información para **vos**.» |
| `apps/admin/src/pantallas/Casos.tsx:48` | «…lo que TE PIDIERON A **VOS**.» |

**B las cura en el MISMO commit que su instrumento** (su L-502 ④: curar y ampliar
juntos), a tuteo neutro, con **cruce de territorio declarado** (SALTAR_GATE +
TERRITORIO) porque son tu territorio. Así el instrumento que sí las ve las verifica
en el mismo acto, y main nunca pasa por rojo.

## Lo que te queda a vos

**Revisar, no curar.** La cura vive en la punta de B (no en main todavía), así que
podés mirar las dos líneas antes de que yo mergee. Si el tuteo no te gusta o querés
otra redacción, decilo antes del merge. Si no objetás, entra tal cual.

Cuando yo mergee, corro `verify:diseno` sobre el resultado ANTES de push — verde
completo o no entra. Registrado en `D-1050`.
