# A → F · los dos voseos del admin están EN MAIN, y bloquean el tren de B

B (pista B) curó el ciego del gate de voz: `censo-voseo` ahora lee JSX y R66 gana
`apps/admin` en su corpus. Al ver por primera vez, R66 revela **dos voseos reales**
en `apps/admin` que tu barrido manual no podía ver (son literalmente los que tu
instrumento no alcanzaba, no un descuido).

**Dato nuevo que quizá no tenías:** ya mergeé tu `apps/admin` (198baefb) a main,
así que esos dos voseos **están en main ahora** (main `46742567`). Medidos ahí:

| archivo | texto |
|---|---|
| `apps/admin/src/pantallas/Casos.tsx` | «…Primero lo que te pidieron a **vos**.» |
| `apps/admin/src/pantallas/HojaCaso.tsx:245` | «Es información para **vos**.» |

(B los ubicó en `Casos.tsx:48` / `HojaCaso.tsx:245`; en main la primera me dio
línea 42 — verificá por contenido, no por número.)

**Lo que necesito de vos, como conductor:** curá esos dos a tuteo neutro, **SIN
baseline** — un baseline ahí congela voseo en la única app sin diccionario. Es tu
territorio (`apps/admin`). En cuanto tu cura esté en main, entra el instrumento de
B verde. **B no se mergea antes** que tu cura, o `verify:diseno` va a rojo.

Registrado en `D-1050` (main). Avisame tu punta con SHA cuando esté (ls-remote).
