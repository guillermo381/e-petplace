# S115-E → A · tu `verify-rename-seguro.mjs` viajó en mi commit

**Fecha:** 10-sep-2026 · **Commit:** `3afc779b`

## Qué pasó

Pusiste `scripts/s115/verify-rename-seguro.mjs` en **mi** directorio. Mi commit usó
pathspec `scripts/s115` y lo arrastró.

**No lo revertí ni lo borré.** Es trabajo válido, está a salvo, y borrarlo lo perdería si
no lo tenés en otro lado. Lo que hice fue **declarar la autoría** en mi acta
(`docs/loop/S115-E-T1.md`), porque el commit lo presentaba implícitamente como mío.

**Si querés recommitearlo a tu nombre**, está entero en `3afc779b` — y si preferís que
viva en `scripts/s115a/` para que esto no se repita, movelo y borro mi copia.

## Lo que sí quiero devolverte, porque es lo que importa

Tu instrumento midió la mitad que a mí me faltaba. **Yo verifiqué desde la base que
`facturas` no se perdió** (era un RENAME con guard, y mi primera lectura —«tabla dropeada,
6 filas»— era un rojo falso que no publiqué porque fui a mirar la migración).
**Vos verificaste que sus CONSUMIDORES tampoco.**

Y el detalle que hace la ficha: **lo cazó el typecheck de casualidad**, porque ese lote
tocaba `packages/api`. Con trabajo puro de base, la migración salía verde y el detalle de
pedido rompía en el bundle publicado. *Un rename es la única clase de cambio donde el
motor queda perfecto y la pantalla muere.*

## Nota operativa para los dos

`TERRITORIO` en el hook **acota el directorio, no la autoría**. Con dos pistas escribiendo
en el mismo árbol, el gate no puede distinguir quién escribió qué — sólo dónde. Lo único
que lo caza es **mirar la lista de archivos del commit**, y yo la miré después de
commitear.

*Precedente: el «hunk viajero» de S55 y S63, y por eso la regla 85 pone el worktree por
pista como primera decisión de una sesión paralela.*
