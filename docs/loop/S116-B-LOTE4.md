# S116-B · LOTE 4 — el techo del Hogar y el del Expediente

**Rama `pista/s116-b-05`.** Gates: `verify:diseno` VERDE (80) · `verify:contrast` **489 pares / 0** (eran 479: entran los **10 del par nuevo**) · `verify:catalogo-v5` VERDE · `verify:boton-alto` VERDE · `verify:techos-locales` VERDE · `tsc` 0 en las cuatro.

---

## ① EL CENSO, contra el objeto

### Techo del Hogar — `hogar/index.tsx:1767-1965`, dentro de `Cabecera presentacion="fondo"`

| contenido | hoy | ¿pieza? |
|---|---|---|
| fecha | `antetitulo` con `fechaConDiaMono` | ✅ — y **el mono minúscula ya existe**: `antetituloVoz="dato"`, que nació en el lote 3f por esta misma nota. **C monta.** |
| saludo | `titulo` | ✅ |
| fila de mascotas | **~200 líneas locales** dentro del slot `contenido` | ❌ **falta** |
| campana + carrito | props `avisos` / `carrito` | ✅ |

### Techo del Expediente — `mascota/[mascotaId].tsx:1214-1447`

| contenido | hoy | ¿pieza? |
|---|---|---|
| flecha · editar · compartir | `onVolver` + `accionDerecha` + `DiscoVidrio` ×2 | ✅ |
| foto grande redonda con aro | ~60 líneas locales (200/8) — **el archivo declara el choque**: *«el squircle NO aplica — el retrato de la ficha es circular; por eso no pasa por `AvatarMascota`»* | ❌ |
| pastilla de estado | ~60 líneas locales | ❌ |
| nombre | `<Text>` local en `SERIF_LOCAL` | ❌ **y es un desvío medible** (ver ③) |
| origen + raza·edad·peso | dos `<Text>` locales | ❌ |
| cuatro accesos en la costura | **`FilaAccionesCostura`** | ✅ **ya existe y ya está montada** |
| pestañas Resumen·Salud·Historia·Documentos | **no existen** — la hoja es un scroll de secciones | pieza ✅ · **montaje de C** |

**⇒ NACEN DOS, NO TRES.** `FilaPestañas` **no nace**: es **`FiltroPills`**, promovida en S85-B7, que ya trae los chips con el elegido y **la pata que pisa**, y el chip activo en ciruela está declarado en `palette.ts:63` como su empleo. *Un componente por caso real, y este caso ya tenía el suyo.*

## ② LO QUE NACIÓ

**`FilaMascotas`** — 🔴 **es un SELECTOR y eso cambia el modelo, no sólo el dibujo.** Lo que había era una **tira informativa**: cada mascota con su nombre, su punto y su propia línea de vencimiento. *Ocho mascotas eran ocho líneas compitiendo: un tablero de faltantes con forma de fila de caras.* ⚠️ **El costo se declara: el estado de las demás deja de verse sin tocarlas** — foco a cambio de simultaneidad.

**`IdentidadMascota`** — retrato, pastilla que monta el aro, nombre y las dos líneas. ⚠️ **Hay un TIPO con ese nombre en `@epetplace/api`.** No es descuido: son el DATO y la PIEZA, y la pantalla que monta una consume el otro. El compilador lo dice fuerte y la salida es un `as` en el import; **no se renombra la pieza porque el nombre es de la mesa y el tipo vive en territorio de A.** → buzón.

**`retrato-mascota.tsx`** (interna, no se exporta) — 🔴 **la geometría compartida.** Medido: el retrato del expediente y el avatar de la fila eran **dos bloques distintos, con dos fondos de respaldo y dos escalas de huella**, para dibujar el mismo hecho —*una mascota que todavía no tiene foto*—. Nada fallaba: se veían diferente sin que nadie lo hubiera decidido.

## ③ LOS DOS SLOTS NUEVOS, y los dos salieron de MEDIR, no de preferir

🔴 **Desde el lote 3b la banda es OSCURA en los tres temas**, y eso rompe el supuesto de **todos** los tokens elegidos mirando el lienzo. Aparecieron dos, uno por capa:

- **`accent.sobreGradiente`** — el aro de elección. `accent.active` vale `magentaAccion` en claro y `tintaV5` en memorial, y **los dos desaparecen sobre ciruela**. *Ninguna corrida de contraste lo iba a decir, porque ese par nunca estuvo declarado.* Medido al declararlo: **5,78:1** sobre el stop 0 y 6,86 sobre el final (piso gráfico 3:1).
- **`bg.sobreGradiente`** — la superficie del retrato sin foto y del «+». **Éste lo encontró la captura, no el razonamiento:** monté `bg.overlay` —que en claro es `rosaTinte`— y los cuatro retratos salieron **discos de rosa casi blanco dominando la banda entera**. *Cacé la capa del acento y se me pasó la de abajo, en la misma pieza.* Va con **alfa real** y no precomputado: la banda es un degradado, y un opaco calculado contra un stop se despega del otro.

## ④ EL NOMBRE PASA A BALOO — una corrección, no una preferencia

🔴 El expediente lo dibujaba en `SERIF_LOCAL = Platform.select({ ios: 'Georgia', default: 'serif' })`: **la serif del sistema operativo**. *Dos aparatos mostraban el nombre de la misma mascota en dos tipografías distintas, y ninguna era la de la casa.* En la casa v5 `Texto variante="titulo"` **ya resuelve `escala.titulo1` (Baloo 28/31)**, así que la pieza no elige una fuente: pide la variante. ⚠️ **El 44/48 de la serif NO se porta** — el tamaño de una fuente no se traslada a otra.

## ⑤ EL INSTRUMENTO, CURADO DE PASO

**`?solo=` ahora esconde la lámina.** Medido usándolo: el filtro recortaba las secciones **y la lámina se renderizaba igual**, así que pedir una pieza seguía costando varios swipes. *Un salto de sección que te deja a tres swipes de la sección no es un salto.*

⚠️ **Y L-138 se cobró otra vez, en una forma nueva:** el dev-client tenía **cacheada la URL de otro Metro** (hay tres vivos: 8081, 8093, 8097). La app arrancaba, corría JS, respondía a los deep links y **servía un bundle viejo** — Metro no logueaba un solo `Bundled` y todo parecía sano. Se cura entrando por `cliente://expo-development-client/?url=…` antes de la primera captura. *Un aparato que corre la app de otro árbol no se distingue mirando la pantalla.*

## ⑥ LAS CAPTURAS

📷 `lote4-fila-mascotas.png` — fecha en mono minúscula, saludo en Baloo, campana 2 y carrito 3, **Thor con aro magenta contra Zeus y Bruma con el aro insinuado**, el nombre de la elegida en peso de énfasis, y su línea de estado debajo.
📷 `lote4-identidad-expediente.png` — flecha y los dos discos de vidrio, retrato con aro, pastilla montando el aro, **«Thor» en Baloo**, «Llegó de un criadero» en sans, «labrador · 4 años · 24 kg» en mono, y los cuatro accesos pisando la costura.

## ⑦ AL BUZÓN

- **C** — `antetituloVoz="dato"` ya está en `Cabecera` desde el lote 3f: la fecha del Hogar vuelve a mono minúscula **montándolo**, no pidiendo pieza.
- **C** — al montar `IdentidadMascota` en `[mascotaId].tsx`, el import del tipo homónimo de `@epetplace/api` se renombra. Y **muere `SERIF_LOCAL`** con sus dos usos.
- **C** — el `arranque` del expediente se MIDE con `onLayout` y por eso está bien; en la maqueta con número fijo **los discos de la costura pisaban las dos líneas del nombre** con 400. Aviso para cualquier montaje con constante.
- **A** — el tipo `IdentidadMascota` de `packages/api` colisiona con la pieza. No se toca desde acá.
