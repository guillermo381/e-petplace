# Capturas S113-B · 2.2.1 «Pulido del tablero»

**Receta.** Metro en **el puerto propio de B (8092)** — `ARRANQUE_B2 22:37:16` →
`Android Bundled 10358ms (2998 modules)`. Emulador **`5554`**; el `5556` es
**`s113_A`** y no se tocó (su `reverse` en 8081 quedó intacto). Modo elegido con
**el control de la pantalla**, nunca por deep link. Sonda retirada, `apps/` en
cero, `router.d.ts` regenerado.

> ⚠️ **Y otra vez lo cazó el `md5`:** las capturas de oscuro y memorial salieron
> **byte-idénticas**. El deep link con `?modo=…` **no re-monta** la pantalla, así
> que el segundo no cambió nada y las dos fotos eran la misma. *Es la misma clase
> que el `&` que se come `adb shell`: dos archivos con nombres distintos y el
> mismo contenido, y ninguna mirada lo nota.* Por eso el modo se elige tocando.

---

## ① Los gráficos entran en su tarjeta — **medido, no mirado**

El aire se midió buscando **píxeles del acento fuera del rectángulo de la
tarjeta**, con el rectángulo leído del propio aparato (`uiautomator`), en **las
dos densidades**:

| | tarjeta | trazo | aire a la derecha |
|---|---|---|---|
| sparkline **@480 dpi** (448 dp) | x 48..654 | x 325..599 | **55 px** |
| anillo **@480 dpi** | x 690..1296 | x 1134..1241 | **55 px** |
| sparkline **@560 dpi** (384 dp) | x 56..651 | x 378..589 | **62 px** |
| anillo **@560 dpi** | x 693..1288 | x 1099..1224 | **64 px** |

**🟢 Y el número que prueba que la cura es la correcta: al angostarse la
columna el sparkline pasó de 274 a 211 px de ancho.** *No se salió menos: cedió.*
Antes era un `Svg` de **96 px fijos** y en la columna angosta el dato más el
gráfico no entraban; hoy es un `viewBox` dentro de una caja con `flexShrink`,
y **el que nunca cede es el número** — la cifra es el contenido, el dibujo es
la señal.

**El margen no se elige, se deriva** (`margenDeTrazo` = medio grosor): *un trazo
se dibuja centrado en su camino, así que una caja calculada sobre la línea ideal
siempre queda chica por el grosor entero — y el recorte no se ve como defecto,
se ve como una línea que toca el borde.*

## ② El dato a 18, el contexto a 11, y nada cortado

`typography.size.metrica: 18` entra **con nombre propio, no como peldaño** de la
escala de prosa (11 · 14 · 16 · 20 · 22) — mismo trato que `control: 13`. El
contexto va a `xs` con el patrón que la casa ya usa para 11.

*«medido el lun 7 sept en Clínica Aurora»* **envuelve en dos líneas y no se
corta** en las dos densidades. Y la fecha corta es `fechaCortaHumana`, nueva en
el riel — ⚠️ **nació tarde: había ya CINCO sitios armándola a mano con `Intl`**.

## ③ El «hoy» genérico no puede existir

En `01` hay **una sola** tarjeta de hoy. La sonda monta **dos**: la segunda
lleva `titulo="   "` y **no se dibuja**. *Un hueco ausente no cuesta nada; un
hueco lleno de nada cuesta el lugar más caro de la pantalla.*

## ④ Conociéndolo: dos estados, una invitación

`01` muestra los dos, uno debajo del otro: incompleto (anillo + voz + **una**
invitación) y completo (**felicita en una línea** y ofrece más **sin urgencia**).
El tipo hace **inexpresable** mandar las dos — lo probó el typecheck, que rebotó
la galería vieja.

## ⑤ La fila de chips envuelve, no corta

- **@480 dpi (448 dp):** los cuatro entran en una fila, «Muy grave» entero.
- **@560 dpi (384 dp):** tres arriba (`y 2644`) y **«Muy grave» abajo**
  (`y 2826`). **Dos filas, sin scroll horizontal, sin texto cortado.**

*La cura es envolver y no scrollear: una tira esconde opciones detrás de un
gesto que nadie sabe que existe, y en una escala de gravedad la escondida es la
última — justo la que más importa ver.*

⚠️ **Una decisión declarada, barata de revertir:** el chip que envuelve queda
**a todo el ancho** de su fila, porque `'fila'` crece por definición y en una
fila de uno eso es el 100 %. La casa tiene el precedente contrario en
`columnas` (*«el impar queda a ancho de columna»*), pero ahí la firma es «mismo
tamaño» y acá es una **escala**, donde anchos distintos no molestan. Si el
founder lo quiere igual que `columnas`, es una línea.

## El índice

| archivo | qué prueba |
|---|---|
| `01-tablero-claro` | los cinco puntos a 480 dpi |
| `02-tablero-claro-560dpi` | la columna angosta: el sparkline cede |
| `03-gravedad-560dpi` | la fila de gravedad **en dos filas** |
| `04-tablero-oscuro` | los tres dibujos en oscuro, dentro de su tarjeta |
| `05-tablero-memorial` | qué queda (el dato) y qué se apaga (dibujos, hoy, conociéndolo) |
