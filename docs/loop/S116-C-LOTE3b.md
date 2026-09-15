# S116-C · LOTE 3b — el parte

**CAPTURAS: `docs/loop/capturas-s116-c-lote3b/`**

Rama `pista/s116-c-05`. Cuatro commits: `bdc415d7` · `837b5ef4` · `3776e83f` ·
`ffcacdf0` · `8cf00f00`.

---

## ⓪ LO PRIMERO, PORQUE CAMBIA CÓMO SE LEE EL RESTO

**La precisión del founder llegó a mitad del lote y tenía razón.** *«Migrar no
es cambiar `Encabezado` por `Cabecera`.»* Lo mío era exactamente eso: la pieza
nueva con la ESTRUCTURA vieja — cabecera-tarjeta, esquinas de ABAJO
redondeadas, contenido debajo. **La curva miraba para el lado equivocado en 76
pantallas y yo lo había dado por hecho.** Punto 1 estaba a medias y el parte lo
habría dicho cerrado.

**Hoy: 107 montajes de `Cabecera` en el cliente · 0 sin `presentacion="fondo"`.**
Fondo ciruela + `HojaContenido` encima, con la curva ARRIBA, deslizando.

---

## ① LAS 78 MIGRACIONES — y lo que el censo no decía

**Cero `Encabezado` vivos en `apps/cliente/src/app`** (queda una mención dentro
de una lápida). 82 archivos montan `Cabecera`. `Encabezado` **no se borra**: el
prestador lo monta y tiene 173 consumidores.

**El censo tiene una fila por archivo, y 12 archivos tenían 2–3 montajes.** Tras
migrar las 78 filas quedaban **20 ocurrencias vivas en 12 archivos**: segundas y
terceras cabeceras de la MISMA pantalla (carga, error, ramas de un wizard).
Migradas también — *dejar una vieja al lado de una nueva en el mismo archivo es
justo la divergencia que el lote vino a cerrar.*

**Las 7 clasificadas:**
- 4 portadas → `variante="raiz"`, el carrito deja de ser un `ReactNode` en
  `accionDer` y pasa a la prop `carrito`. ☠️ Muere `isotipo="gradiente"` de la
  Despensa (lote 10 firmó que las raíces del cliente no llevan isotipo).
- `confirmar-programa` y `buscar`: mecánicas.
- `producto/[productoId]`: **`tituloVisible={false}` NO OCULTABA NADA.** Medido
  en `Encabezado:247`: pintaba el título **del color del fondo**. Un texto del
  color del fondo no está oculto — está invisible, ocupando su lugar, y el
  lector de pantalla lo sigue leyendo. **No pedí la prop a B: el truco del color
  no era esa prop.**

☠️ **`AccionCarrito` murió, y es lo que ella misma predijo.** Su lápida del lote
8 decía *«muere el día que `Encabezado` gane carrito»*. **La orilla llegó por el
otro lado** — fue `Cabecera` la que ganó `carrito`. *Acertó en que era un puente
y erró en cuál sería la orilla; lo que lo hizo barato fue haber escrito que era
uno.* El `.tsx` se borra y la lápida va en un `.md` al lado: `verify:piezas-locales`
cuenta `.tsx` y un archivo hueco seguiría contando. Baseline 62 → 61.

---

## ② LOS DOS TECHOS PROPIOS (`D-1106`) — `verify:techos-locales` 2 → 0

**El Hogar**, pieza por pieza: fecha → `antetitulo` · saludo → `titulo` (que
trae su `accessibilityRole="header"` de fábrica, el que el `<Text>` local ponía
a mano) · fila de mascotas → el slot `contenido`, que nació para ella · campana
y carrito → `avisos` y `carrito`, que nacieron para estos dos discos exactos.

🔴 **LO QUE CUESTA, MEDIDO Y CAPTURADO: LA FECHA CAMBIA DE VOZ.** Vivía en mono
minúsculas (Ley 3 y la lámina: *«la fecha en mono SOBRE el saludo»*);
`antetitulo` es sans **bold 11 en MAYÚSCULAS con tracking 2**. Hoy lee
**«LUNES, 14 DE SEPTIEMBRE»**. Es el único slot encima del título, y las dos
alternativas eran peores: bajarla a `apoyo` invierte el orden de la lámina, y
meterla en `contenido` obliga a `titulo=""` — **un encabezado sin nombre para el
lector de pantalla** — con el saludo dibujado a mano. *Uso el slot y reporto lo
que cuesta.* Pedido a B en el buzón (`antetituloVoz: 'rotulo' | 'dato'`).

☠️ Muere `FilaCampanaTecho` entera, y con ella **el isotipo del techo** (misma
firma del lote 10 que mató el de la Despensa). La marca de agua del fondo sigue
viva; el isotipo del techo era el segundo y la Ley 4 pide uno.

**El Expediente**: el hero al slot `contenido`, y mueren tres cosas de la COPIA
que el propio archivo declaraba —**la flecha dibujada a mano** (`<Path d="m14 5-7
7 7 7">`, el ejemplo con el que el censo de B nombró este techo), **la rama de
memorial** (el tema ya resuelve `memorialPlano`) y **la luz de la esquina**—.
Los cuatro círculos de la costura: **Citas · Pasaporte · Documentos · Cuéntanos**,
una palabra cada uno. Nace `pasaporte.palabra`: la entrada decía «Pasaporte y
QR» y la fila es de UNA palabra; la larga sigue viva en la celda.

🔴 **El retrato sin foto cambió de color POR ESTO, no por gusto:** la huella se
pintaba `capa.identidad`, que en memorial es `tintaV5` — tinta oscura. Sobre el
`bg.card` claro del techo viejo se veía; **sobre la ciruela noche de la banda
nueva desaparecía.**

🔴 **El agua va DESPUÉS de la hoja**, y es la cura de haberla metido adentro: su
lámina la manda FIJA y adentro del scroll se iba con el contenido; antes de la
hoja quedaba tapada entera por el degradado absoluto. **Lo vi scrolleando, no
razonando.**

☠️ **`R14` jubilada** (`verify:diseno` 81 → 80). Vigilaba `SOLAPE_RECO <
RESPIRO_BANDA`: dos constantes del techo local. Hoy el solape es **la costura** y
lo pone la pieza. No se reescribe contra ella porque lo que protegía es
**inexpresable**: la tarjeta vive en la hoja y el saludo en la banda, son dos
superficies. *Una regla que no puede producir su rojo no está midiendo* (`L-459`).
Archivo de B, tocado por C: mismo precedente que `R18` en S112-C, declarado en
el buzón y reversible.

---

## ③ LA PLATA Y LAS FECHAS

**Plata: 58 → 0 en el cliente**, todo por `formatearPrecio`. El prestador queda
en **51 INTACTO** — es su sesión, y el baseline es por app justamente para esto.

Tres formas, y la tercera es la que ningún gate veía:
1. 38 plantillas con el símbolo pegado → la fuente única.
2. 17 interpolados donde **el `$` vivía en el DICCIONARIO**: se le saca a la
   llave y viaja el monto entero.
3. 🔴 **`hogar.presupuestoDetalle` con un número CRUDO.** `verify:moneda` no lo
   veía: su discriminador busca el redondeo o la plantilla, y esto no era
   ninguno. **Un presupuesto de 45 se leía «$45», sin decimales y sin miles, en
   la primera fila del Hogar.** *La fuga estaba repartida entre el código y el
   diccionario, que es donde ningún grep de una sola cara la encuentra.*
   Censadas las cuatro llaves con `$` pegado a un placeholder: era la única con
   consumidor; a las otras tres (muertas) se les saca igual.

⚠️ Y el comentario que explicaba esto **disparó su propio gate**. Reescrito por
semántica, no por formato.

**Fechas (`D-1096`):** nacen `horaHumana` y `fechaYHoraHumana` en el riel. **No
reusé `horaCortaDeMensaje`**: fija `hour12:false` a propósito y lo dice en su
cuerpo — son dos horas con dos razones opuestas.

- **el Hogar** «15 sept 2026 · 01:00» → **«mar 15 sept · 1:00 a. m.»**, y el
  rail de servicios deja de salir cortado («14 sept 20…»).
- **las citas**: al riel, y sale de `datoMd` (mono 18) a `cuerpo`.
- **el pago**: decía **«2026-09-15 · 15:00»**, el ejemplo literal que la firma
  prohíbe.
- 🔴 **el paso QUIÉN de la reserva**: `metadataMono={fecha}`, el ISO de la URL a
  la pantalla sin tocar nada. **No estaba en ningún censo mío: lo vi caminando
  la reserva para capturar el pago.**

⚠️ **LO QUE NO PUDE:** dos sitios (resumen del pago, próxima salida del plan)
montan la fecha en `Celda metadataMono`, el único slot de metadata que la pieza
tiene y es mono. Moverla a `subtitulo` desalojaría «con {prestador}». Pedido a B.
**La voz está curada; la fuente es de su pieza.**

---

## ④ LA ESTRUCTURA FIRMADA — 107 montajes, 0 tarjetas

Los grupos y su razón de no entrar por la pasada mecánica:
- **8 con `PantallaConPie`** → ☠️ muere la pieza ahí: su pie pasa al slot `pie`
  de la hoja. *Las dos reservan el alto MEDIDO del pie; una dentro de otra hace
  la cuenta dos veces.* En carrito y checkout el pie **sigue siendo condicional**.
- **12 multi-cabecera** → los estados de carga y error son la misma pantalla en
  otro momento; entran igual.
- **el checkout de la Despensa** → ☠️ muere su `EvitaTeclado` (la hoja trae su
  ScrollView; anidar dos rompe el gesto). **Probado con el teclado arriba.**

🔴 **UNA PÉRDIDA SILENCIOSA QUE CACÉ MIDIENDO EL DIFF, NO LEYENDO.** Al volver
los `ScrollView` en `View` se caían sus props, **y ninguna rompe nada**: el
`scrollTo` sigue compilando y deja de mover la pantalla. 14 archivos —
`keyboardShouldPersistTaps` en 7, `keyboardDismissMode` en 1, y **`ref` en 6**
(carnet, los tres hubs de oficio, guardería y su checkout). Las de teclado
volvieron por `scroll`; el `ref` **no entra ahí** —no es prop de
`ScrollViewProps`— así que **`HojaContenido` gana `scrollRef`**. Pieza de B
tocada por C, declarada y reversible: *la alternativa era seis pantallas
perdiendo su auto-scroll sin que nada fallara.*

☠️ **Una hoja dentro de un scroll:** en `cuenta/index` la Cabecera vivía DENTRO
del ScrollView, así que la hoja nació anidada. **Se veía perfecta** y eran dos
scrolls.

⚠️ **LA ÚNICA EXCEPCIÓN, tres pantallas con la misma razón medida:** el Modal
del pasaporte, la videollamada y la videoconsulta llevan `fondo` —la curva
invertida muere también ahí— **pero no llevan hoja**: su contenido es un
`WebView` o una sala de video a `flex: 1`, y dentro del scroll **colapsa a
cero**. *No son pantallas de hoja: son páginas y salas.*

---

## ⑤ LA VARA, POR GRUPO

**Grupo A — las 78 migraciones + la estructura (107 montajes)**
1. ¿Se ve? Sí — Despensa, Cuenta, carrito, checkout, disponibles, capturadas.
2. ¿Es del sistema? Sí: `Cabecera` + `HojaContenido` + `FilaAccionesCostura`.
3. ¿Dibujé algo? **Sí, y lo declaro: `scrollRef` en `HojaContenido`** (pase, no
   capacidad) y **jubilé `R14`**. Los dos en territorio de B, los dos en el
   buzón, los dos reversibles.
4. ¿Pedí lo que falta? Sí: `antetituloVoz` y `Celda metadata` en sans.
5. ¿Gates? tsc ×4 en 0 · diseño VERDE (80) · techos 0 · piezas 61 · moneda 0.
6. ¿Baselines asentados en el mismo commit? Sí: piezas 62→61, techos 2→0,
   moneda cliente 58→0.
7. ¿Memorial? Sí — y **mejoró**: murió una rama por tema en cada techo.
8. ¿Voz? `comun.volver` nace para los 71 (una llave, no 71).
9. ¿Lápidas? `AccionCarrito`, `FilaCampanaTecho`, `R14`, `SOLAPE_RECO`.
10. ¿Medí antes de afirmar? Sí, y **dos veces me corrigió**: `tituloVisible` y
    el diff de props.
11. **¿USADO?** Sí. Caminado: Hogar, Expediente (flecha tocada, vuelve),
    Despensa, carrito, checkout con teclado, reserva hasta el pago, Cuenta
    scrolleada, citas.

**Grupo B — la plata**
Vara 11: **usada** — reserva real hasta «$6,00» en el checkout y «$18,50 /
$6,70» en la vitrina, con coma y en pantalla.

**Grupo C — las fechas**
Vara 11: **usada** — «mar 15 sept · 1:00 a. m.» en el Hogar, en las citas, en
el hub de paseos y en el pago.

---

## ⑥ CUÁLES DE LAS 78 NO PUDE ALCANZAR

**Ninguna quedó sin migrar.** Lo que NO alcancé es otra cosa y va con nombre:
1. **La fuente mono en dos `Celda`** (pago y próxima salida del plan) — la prop
   no existe. Pedido a B.
2. **El mono del `antetitulo` del Hogar** — la fecha en mayúsculas. Pedido a B.
3. **Tres pantallas sin hoja** (pasaporte-Modal, videollamada, videoconsulta),
   con `fondo` y con su razón medida.

---

## ⑦ LA PANTALLA 04, USADA DE PUNTA A PUNTA

✅ **Cerrada.** El recorrido completo, con el código que el founder pasó:

1. **Canje** — el primer código (`71356743`) rebotó con **«Ese código ya no
   sirve»**: había vencido antes de que yo llegara. *El rebote es correcto y su
   voz también* — capturado, porque **un camino de error ejercido vale tanto
   como el feliz**, y éste además probó la cura anti-bucle: al pedir otro, el
   campo se limpia solo (si quedara lleno, ocho cajas llenas se leen como «ya
   está» sobre un código que el servidor va a rechazar seguro).
2. Con el código fresco: **«Código verificado. Ahora elige tu nueva
   contraseña.»**
3. **Contraseña cambiada** y sesión abierta — cayó en el Hogar de la cuenta.
4. 🔴 **Y no me quedé ahí, que es donde el gate se habría quedado corto:**
   **cerré sesión y volví a entrar por la 03 con la contraseña nueva.** *Que la
   sesión de recuperación quede abierta prueba que el canje funcionó; sólo
   volver a entrar prueba que la contraseña CAMBIÓ.* Entró.

**La clave nueva vive en el llavero (`epetplace-s116c2-clave`)**, se lee al
momento de usarla y **no se imprime en ningún lado, ni enmascarada**. La cuenta
de prueba principal **NO se rota**, por firma del founder.

☠️ **La siembra temporal ya no existe.** Para llegar al paso del código sin
tocar «Enviar el código» —que emite uno nuevo y mata el que me pasaron— sembré
`recuperar.tsx:116-117` en el paso `'codigo'` con el correo puesto. **Era un
instrumento, no una cura**: revertido con `git checkout` y verificado línea por
línea. **No entró a ningún commit.**

---

## ⑧ LO QUE QUEDA ABIERTO Y ES DE B

1. **La fuente mono en dos `Celda`** (pago y próxima salida del plan) — la prop
   en sans no existe.
2. **El mono del `antetitulo` del Hogar** — la fecha en mayúsculas.
3. **`scrollRef` y el retiro de `R14`** — los hice yo, en su territorio, con su
   razón escrita. Si prefiere otra forma, se revierten.


---

# ⑨ LA VUELTA DE LA DESPENSA (las tres del founder + lo que apareció caminando)

**Capturas:** `p5-despensa-sin-producto-en-carrito.png` ·
`p5-despensa-con-producto-en-carrito.png` ·
`p5-despensa-fila-mixta-stepper-y-boton.png` · `p5-hogar-fecha-en-mono.png` ·
`p5-pago-fecha-en-sans.png`

**① El buscador vive en la banda** — por el slot `contenido` de `Cabecera`, no
dibujado local: título arriba, y debajo, sobre el ciruela, el campo blanco con
**su lupa** (que este campo no tenía) y el filtro a la derecha en `DiscoVidrio`
—el material de la banda, el mismo del carrito—. La hoja empieza después.

**② Los chips bajan a la hoja, y eso da vuelta una decisión de este archivo.**
Decía *«la barra de mascotas va PRIMERO porque es la firma de la pantalla»*.
Gana la orden nueva **y su razón es mejor**: son un FILTRO del catálogo.

**③ La alineación, medida dos veces.** Con `center` el disco quedaba 13,5 dp más
abajo —`Campo` reserva su renglón de ayuda—. Lo curé con `sinPie` y
**`verify:diseno` lo paró con razón**; se resolvió alineando por el alto de la
CAJA. Medido después: 1,1 dp.

**④ 🔴 El «Agregar» contra el stepper ES DE LA PIEZA, y lo probé con números.**
Los dos contenedores miden **exactamente lo mismo** (`1563..1642`): la
`Mutacion` hace su trabajo. Lo que no coincide es el contenido — el label queda
pegado al borde inferior. **Causa: `Boton.tsx:622` ignora `tamaño` en la casa v5**
(`pildoraV5 ? altoV5 : t.alto`), así que el botón mide 58 dp dentro de una caja
de 30 y **se sale por abajo**. No la curé: la fila la arman `TarjetaProducto` y
`Mutacion`, las dos de B. Buzón con los números, las dos formas de cura y el
censo (93 montajes de `tamaño` no-`md` comiendo hoy el alto de un CTA).
⚠️ **No contradice la medición de B en su lote 3f**: él midió el ANCHO —y tenía
razón—; esto es VERTICAL.

**⑤ Las dos piezas de B, montadas.** `antetituloVoz="dato"` devuelve la fecha del
Hogar al mono en minúsculas; `Celda.metadata` saca la del pago de la fuente mono.
⚠️ El hub de paseos **no**: `FilaCita` no pasa `metadata`. Pedido; declarado en el
código, no disimulado.

**⑥ 🔴 Y apareció el último `Encabezado` del cliente — en una captura, no en un
grep.** El lote 3b declaró «cero vivos» y era cierto **sobre `src/app`**, que es
lo que el censo de B recorría y lo que el gate mide. `checkout-reserva.tsx` vive
en `src/components`: **ningún instrumento lo miraba**, y es la pantalla del pago.
Migrado. *El grep que lo habría encontrado es el que no corrí — censar por la
carpeta de rutas cuando la pieza puede vivir en un componente.*
