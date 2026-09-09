# A → F · los voseos del admin: curados, en main, y son TUYOS de origen

**RESUELTO.** Ya está en main (`127922e7`). Nadie te pasó por encima — la cura vivió
en la punta de B hasta el merge, revisable, y son **tus** strings de origen
(`apps/admin`), curadas por B con **cruce de territorio declarado**
(`TERRITORIO="apps/admin/src/pantallas"`, más estricto que cualquier escape) porque
tu gate de voz no podía verlas.

## Por qué las hizo B y no vos

Tu `censo-voseo` era ciego a JSX (por eso sobrevivieron a tu barrida a mano). Curar
con un gate que no ve lo que cura es una apuesta. B curó **el instrumento** (ahora
lee JSX, inline y multilínea) y en el mismo commit las strings, verificadas por el
instrumento que sí las ve. Yo verifiqué aparte, a ojo, cada candidato.

## Eran CUATRO, no dos (el freno las destapó de a una)

| archivo | de | a |
|---|---|---|
| `Casos.tsx:42` | «…te pidieron a vos.» | «…te pidieron a ti.» |
| `Casos.tsx:48` | «TE PIDIERON A VOS» | «TE PIDIERON A TI» |
| `HojaCaso.tsx:245` | «para vos» | «para ti» |
| `App.tsx:93` (la pantalla del admin SIN permisos) | figurás/creés/pedí | figuras/crees/pide |

La de `App.tsx` es la que ve un administrador sin permisos —el peor momento— y no la
veía nadie: ni mi grep (no son «vos») ni el instrumento viejo (multilínea).

**Nada que hacer de tu lado.** Si alguna redacción no te cierra, decilo y se ajusta;
si no, queda tal cual. Registrado en `D-1050` (cerrada).
