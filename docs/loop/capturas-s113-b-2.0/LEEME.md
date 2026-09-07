# Capturas S113-B · lote 2.0 y 1.2.1 · emulador Pixel_10_Pro_XL

**Cómo se tomaron, porque el método es la mitad del valor.** No por la
galería: por una **sonda temporal** (`apps/cliente/src/app/sonda.tsx`,
**retirada al terminar y verificada con `git status`**) gobernada **por deep
link y no por toques** — la sesión anterior perdió la inyección de gestos del
emulador y no volvió ni en frío, y los deep links siguieron llegando.

`Bundled` fechado **después** de arrancar el Metro que se estaba usando
(`ARRANQUE2 09:13:49` → `Android Bundled 8441ms (2974 modules)` 09:14:07).
Captura y volcado de `uiautomator` **tomados juntos**, borrando el `u.xml`
anterior — *un volcado que no se pudo tomar no borra el de antes: lo deja ahí
para que uno lo lea como si fuera de ahora.*

## 🔴 Dos trampas medidas hoy, y las dos producen capturas creíbles y falsas

**① `adb shell` se come el `&` de la URL, y no avisa.** `-d "…?p=a&t=b"` llega
al dispositivo como `…?p=a`: la shell de Android lo interpreta como
background. **Las primeras seis capturas salieron así** — las «oscuras»
byte-idénticas a las claras porque el parámetro del tema nunca llegó, y el
nombre del archivo decía «oscuro». *Lo cazó comparar los md5, no mirarlas.*
Se escapa: `-d 'cliente://x?p=a\&t=b'`.

**② Por eso cada captura lleva su control DENTRO de la pantalla.** La sonda
imprime `modo=dark · p=nexo` y eso se lee del volcado: *«se ve claro» no
distingue «el tema no llegó» de «el tema llegó y el fondo lo pinta otro»* — el
fondo lo pinta la APP, así que un tema oscuro sin `bg.base` propio se
fotografía con papel detrás. Donde la pantalla sale antes del control (la
despedida) se verificó **por píxel**: `#0D050D` contra `#F6F6F6`.

Cada `.png` tiene su `.txt` con el árbol de textos, tomado en el mismo
instante.

## Lo que las capturas decidieron, y el tipo no podía

**🔴 «de su carnet · 12 mar» se leía como una etiqueta.** El
`accessibilityRole="link"` estaba —y su assert estuvo **verde todo el
tiempo**— pero en pantalla eran dos líneas grises seguidas, la nota de IA y la
fuente, con la misma talla, color y peso, y una de las dos llevaba a algún
lado. *Un rol de accesibilidad es una promesa para quien no ve la pantalla, y
no dice nada sobre lo que ve quien sí la ve.* Curado con `AccionQueLleva`, que
es la pieza que la casa ya tiene para una acción suelta que navega.

**🔴 Mis dos chips tenían anatomías distintas** — el de «Preguntale a Nexo»
sin borde, los de sugerencia con borde. Sobre papel claro `bg.card` es blanco
contra `#F6F6F6`: se leía como tarjeta, no como algo tocable. *Dos anatomías
de chip en la misma casa son dos afordancias, y la persona aprende la más
débil.*

**🔴 Y el chevron de `CeldasHoy` era un carácter `›`**, no la primitiva de la
casa — o sea un chevron distinto del de `CeldaNavegacion` y `PieRevelar`.
Curado en la rama del 1.2.1, que es donde vive esa pieza.

## El antes y el después, los dos en el repo

Las capturas `03/04/06/07` son **anteriores a las tres curas**: son la
evidencia del defecto. Las `despues-*` son el estado final, tomadas en una
segunda pasada (`ARRANQUE4 11:14:06` → `Bundled` 11:14:33).

**Se conservan las dos**, y no por prolijidad: *una cura sin su antes es una
afirmación sobre algo que ya nadie puede ver.* En `despues-nexo-claro` la
fuente «de su carnet · 12 mar ›» sale en tinta con su chevron, separada de la
nota de IA gris — contra `03`, donde eran dos líneas grises iguales y una de
las dos llevaba a algún lado.

## El índice

| archivo | qué prueba |
|---|---|
| `01/02-celdas` | la celda **con** destino (chevron + rol) contra la que no lo tiene, plana |
| `03/04-nexo` | la primera respuesta con su nota de IA · la fuente · el acto · la propuesta con sus dos salidas |
| `05-nexo-memorial` | **el Coach no existe**: la pantalla queda con el control y nada más |
| `06/07-busqueda` | el término resaltado, agrupado por tipo, con fecha en mono · y el vacío con su salida |
| `08/09-memoria` | los hechos con su fuente, corregibles y borrables · el acto de agregar |
| `10-memoria-memorial` | **el panel no se dibuja** |
| `11/12-raza` | el chip elegido y la ficha en una columna con su afordancia (1.2.1) |
| `13/14-despedida` | el texto **dentro** del botón y el título respetando la zona segura (1.2.1) |
| `despues-nexo` | la fuente como ACCIÓN, con su chevron, separada de la nota de IA |
| `despues-busqueda` | el chip del vacío con el mismo borde que los de sugerencia |
| `despues-memoria` | el panel con sus hechos, su fuente y sus actos |
