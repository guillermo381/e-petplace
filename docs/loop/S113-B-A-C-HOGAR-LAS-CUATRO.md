# Para C — las cuatro del Hogar que son de pantalla, **con su medición**

Las otras tres (⑦ ⑩ ⑪) ya están entregadas como piezas en `pista/s113-b-3.1`.
Y **cuatro de mis once originales se retiraron** por chocar contra letra
firmada: ver la auditoría en `S113-B-DIRECCION-HOGAR.md`. **Estas cuatro
sobrevivieron.**

Capturas: `capturas-s113-b-3.0/07-hogar-antes-arriba.png` · `08-…-abajo.png`.

---

## ① El techo: **1171 px de 2992 = 39 % de la pantalla · 390 dp de alto**

Medido sobre la captura buscando dónde el gradiente da paso al papel. **390 dp
para decir cuatro cosas** (logo, fecha, saludo, la tira).

**La vara ya existe y está medida:** el hero del perfil pasó de ~340 a **~120**
sin perder nada, en el 2.2. *Acá no hace falta inventar cuánto: hace falta el
mismo criterio.*

**Dónde:** `hogar/index.tsx` — `HeroMarca techoVivo` (su nota vive en la
cabecera del archivo, línea 6, y el montaje cerca de 1575).

## ② La tira: **del cuarto retrato se ve el 37 % de su ancho**

Paso de la tira ≈ **258 px**, retrato ≈ **234 px**; el cuarto arranca cuando
quedan ~87 px de pantalla. *Un tercio de foto asomando sobre un fondo saturado
no se lee como «hay más»: se lee como un recorte mal hecho.* Sobre papel, el
mismo corte sí invita.

⚠️ **Y su orden ya está firmado:** la tira baja **debajo del techo corto**, sobre
papel (ver el orden de la pantalla, firmado 7-sep).

## ③ 🔴 «pulgas · 01 oct 2026» — **CORRIJO MI PROPIO DIAGNÓSTICO**

**No es un dato huérfano.** Lo dije mirando la pantalla; al abrir el código,
está **dentro de `mascotas.map((m) => …)`** (`hogar/index.tsx:1652`), y sale de
`senalesPorMascota.get(m.id)` (`:1777`, `hogar.proximaPlagaCorta`). **El código
sabe perfectamente de quién es: es de Thor, y se dibuja bajo Thor.**

**Lo que falla es que no se LEE como suyo**, y son tres cosas juntas:
· cae **debajo de la línea del nombre**, fuera del bloque visual del retrato;
· va **en mono**, que en esta casa es voz de máquina y no de sujeto;
· y **ninguna otra mascota tiene una**, así que no hay con qué compararla — una
  línea sola bajo una tira de cuatro se lee como un pie de la tira entera.

**Cómo:** que viva **dentro** de la caja del retrato (o en la ficha de la
mascota), pegada al nombre. *La cura es proximidad y registro, no averiguar de
quién es.*

## ⑤ La píldora de los glifos: **`#DCFBF9`**, un menta que el tablero no usa

Medido por barrido sobre la placa del glifo en «Ponte al día»: **220, 251, 249**
sobre tarjeta blanca. Sale de `theme.capaBg[capa]` (`hogar/index.tsx:257`).

**En el tablero el glifo va en tinta y sin placa detrás.** *Una capa de color
que sólo existe en una sección enseña que esa sección es de otra app.*

⚠️ **Lo que NO estoy diciendo:** que `capaBg` esté mal. Es un registro legítimo
de la casa; lo que digo es que **en esta lista compite**, porque las filas de al
lado (En vivo, servicios, vida) no lo usan.

---

### ⚠️ Lo que estas cuatro NO deciden

Ninguna toca **qué secciones hay**. El **orden** sí está firmado (7-sep): techo
corto · mascotas · **En vivo** · Ponte al día · Tus servicios · Tu vida ·
Agregar/Adoptar al pie, y **«¿Compraste en el local?» sale** (su casa es
Pedidos).

### Las tres piezas que ya tenés

· **`TarjetaMetrica`** ensanchada con `glifo` y `ancho` → «Tus servicios» con la
  anatomía del tablero (rótulo chico · dato 18 · contexto 11). **No trunca.**
· **`LineaDeVidaItem.voz_titulo`** → la pantalla compone «Zeus salió a pasear»;
  ausente, sigue el diccionario. *En el Hogar hace falta el nombre; en el perfil
  de Zeus, no.*
· **`respiroDelOrbe(insets)`** → **76 px sin insets, 110 con 34**. Suma al
  `paddingBottom` de la lista. Cuenta **el resplandor**, no sólo el disco.
