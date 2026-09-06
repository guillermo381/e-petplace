
## B · el gate de gates YA EXISTE, y me cazó a mí (S113-B, 2.0)

**Lo que iba a escribir acá estaba mal, y lo corrige el objeto.** Iba a
proponer que el corredor de gates enumerara los `verify:*` y saliera 2 si
alguno no existe. **Ya está construido**: `verify:gates-existen` frenó mi
propio commit por nombrar **el gate del pasaporte, que vive en la rama del
lote 1.3 y todavía no está en `main`** —acá no lo escribo por su nombre, que
es justo lo que el gate prohíbe— con el argumento exacto: *«un gate nombrado y ausente no da rojo: NO
CORRE; su silencio se lee como salud, y esa lectura la hace el que confía en
el canon»*.

**Lo que sí queda descubierto, y es angosto:** el gate protege **el canon**
(las menciones en docs), no **la consola**. Corrido a mano, `pnpm -s` sobre un
script que no existe **sale 0 y no imprime nada** — así que una batería
corrida a mano puede leerse como siete verdes cuando uno de los siete no
existe. Me pasó esta noche con el gate del pasaporte.

**Opciones.** (a) nada: el gate del canon alcanza, porque lo que se publica
pasa por ahí · (b) que el parte declare **contra qué rama** corrió cada gate,
que no cuesta código · (c) un corredor único que enumere los gates
esperados y falle si falta uno.

**Mi voto: (b).** (a) deja el hueco de la lectura a mano y (c) duplica lo que
el gate de gates ya hace. Y (b) además cubre un caso que ninguna de las
otras dos ve: **un gate que existe pero está midiendo otra rama** — que es
el caso real de esta noche, no una hipótesis.

**Dueño:** convención de partes (mesa). **No me frena**: lo declaro en cada
parte mientras tanto.
