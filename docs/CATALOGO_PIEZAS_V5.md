# CATÁLOGO DE PIEZAS v5 — lo que C monta

> **Este es el documento que C lee ANTES de componer cada pantalla.** Lo mantiene **B**.
> Medido contra el objeto el **13-sep-2026**, sobre `main` @ `5fa3599b`.
> **No se escribe de memoria y no se mantiene a mano: `pnpm verify:catalogo-v5` lo verifica.** Ese gate mide que cada pieza listada exista, esté exportada, y que **su cuenta de consumidores sea la de hoy** — porque esta casa ya pagó cuatro veces la clase «número publicado que envejeció en silencio» (el contador de `packages/ui` decía **53 cuando eran 171**, el de wrappers **26 cuando eran 122**).

---

## CÓMO SE LEE

- **consumidores** = archivos de `apps/` que importan la pieza desde `@epetplace/ui`. **`0` no significa «no sirve»: significa «todavía nadie la montó».**
  ⏪ *Cuando este catálogo nació, las nueve del shell estaban en 0 porque acababan de entregarse. **C montó el lote 3 y siete de ellas subieron** — y el gate lo dijo solo, que es para lo que existe: encontró **13** desajustes, no los 3 que se esperaban, incluidas dos que **bajaron** (`SelectorOpcion` y `AvatarMascota`: C las desmontó de algún lado). Los números de esta página son de hoy, no del día que se escribió.*
- **tokens** = lo que la pieza consume. *Si una pantalla necesita un color o una medida que la pieza no expone, **no se pasa por prop**: se pide por buzón.*
- **la casa v5** = `theme.accent.formaV5`. Es UN slot que responde una sola pregunta —*¿esta casa recibió el rediseño?*— y gobierna **geometría, tipografía y huella** a la vez. Cliente `true` · prestador `false` · **memorial `false`** (§4 de la letra apaga la fiesta).

---

## ⓪ LA ESTRUCTURA — cómo se arma una pantalla

> 🔴 **Cambió en S116-B y cambia TODA pantalla: el ciruela dejó de ser una tarjeta y pasó a ser el FONDO.** El contenido vive en una **hoja del color del lienzo** que se apoya encima y sube con el scroll.

```tsx
<HojaContenido
  fondo={<Cabecera variante="raiz" presentacion="fondo" titulo={…} />}
  costura={<FilaAccionesCostura accesos={[…]} />}
  arranque={150}
  pie={<Boton … />}
  scroll={{ contentContainerStyle: { paddingBottom: ALTO_ONDA_ACCESO } }}
>
  {tu contenido}
</HojaContenido>
<OndaAcceso frase={…} lado="der" />   {/* HERMANA, no `pie`: es absoluta al piso */}
```

> ⏪ **La onda salió del slot `pie` (lote 13).** Ahora se ancla al piso físico de la pantalla, así que **no puede vivir en un slot que mide su alto para reservarlo** — el pie mediría cero. Se monta **como hermana**, y el lugar lo reserva `ALTO_ONDA_ACCESO` en el `paddingBottom` del scroll. ⚠️ **Y se monta como hija directa de la raíz de la pantalla, sin padding horizontal:** un absoluto se ancla al padding box de su padre, y un padre con aire lateral devuelve el margen que la pieza vino a matar.

### 🔴 EL PIE FIJO — CUÁL SE USA CUÁNDO (S116-B, y **no son dos alternativas**)

| la pantalla… | monta | por qué |
|---|---|---|
| tiene **hoja** (ciruela de fondo, contenido en la hoja) | **`HojaContenido` con `pie`** | el pie va en el slot. **`PantallaConPie` NO se envuelve alrededor**: serían **dos pies y dos reservas**, y la de afuera no sabe del scroll de adentro |
| **no** tiene hoja (una pantalla de flujo, un formulario, una ficha) | **`PantallaConPie`** | sigue siendo suya; no cambió nada |
| tiene hoja y el pie es la **onda** | `HojaContenido` con `pie` + **`materialDelPie="sangrado"`** | la onda tiene que llegar al filo: sin fondo de lienzo ni padding, y el inset lo absorbe ella |

**El mecanismo es UNO (`pie-fijo.tsx`) y las dos piezas lo consumen.** Lleva adentro las tres curas que se pagaron con defectos de aparato: la **reserva medida** (el pie tapaba contenido en cinco pantallas), el **inset derivado** (se contaba dos veces adentro de `(tabs)`) y el **`box-none`** (el pie se comía el gesto en el tercio inferior). *Un segundo pie escrito a mano no tendría ninguna de las tres, porque no las pagó.*

⚠️ **Consecuencia para `R53`:** la regla vigila pies fijos escritos a mano y hoy lleva **cuatro declarados**. Con el slot, esas pantallas dejan de necesitar la declaración — **pero la declaración muere cuando migran, no antes**: retirarla hoy pondría a `R53` en rojo sobre pantallas que todavía no cambiaron. *Migración y baja de baseline son el mismo acto.*

### `HojaContenido`
- **props:** `fondo` · `costura` · `arranque` · `scroll` · `children` · **`pie`** · **`materialDelPie`**
- 🔴 **La hoja CRECE HASTA EL PIE siempre** (`flexGrow` en la hoja **y** en el `contentContainer`). ⏪ Con `minHeight: 400` sin `flexGrow`, el contenido corto dejaba asomar el ciruela entre la hoja y el pie: *un mínimo garantiza que no sea más chica, no que llegue abajo*. **El defecto sólo existe cuando sobra pantalla — justo la pantalla con la que nadie prueba.**
- **tokens:** `radius.cabeceraV5` · `theme.bg.base` (el lienzo) · `theme.accent.gradient`
- 🔴 **LA HOJA ES OPACA, COLOR LIENZO, SIEMPRE (lote 13).** El founder vio *el wordmark del fondo a través de la hoja, bajo «Email»*. ⚠️ **El color nunca fue el problema y por eso no alcanzaba mirarlo:** los tres temas traen `bg.base` sin alfa. **Lo que dejaba pasar el fondo era el ORDEN DE PINTADO en Android** — una `elevation` de cualquier cosa montada en el fondo sube su capa por encima de sus hermanos. *Un fondo opaco tapado por un hermano que se pinta después sigue siendo opaco y se ve transparente igual.* ⇒ la cura son **dos `zIndex` explícitos** (fondo `0`, hoja `1`), no un color.
- 🔴 **EL DEGRADADO LO PINTA ESTA PIEZA, no la `Cabecera`** — y no es un detalle de implementación: al scrollear *«el fondo se queda y su CONTENIDO se desvanece»*. **Si el degradado viniera dentro del nodo que se desvanece, se apagaría con él** y la pantalla quedaría blanca detrás de la hoja.
- ⚠️ **El desvanecido se acopla al SCROLL, no a un `withTiming`:** la opacidad es una función de **dónde está la hoja**. *Una transición temporal se desincroniza del dedo en cuanto alguien scrollea rápido, y el fondo se apaga cuando ya no lo tapa nada.*
- ⚠️ **No rebota**, y la pieza no te deja cambiarlo (`bounces` no está en `scroll`). *Una hoja que rebota al soltar se comporta como una tarjeta suelta; ésta está apoyada.*
- ⚠️ Con `useReducedMotion` **la hoja sigue subiendo** —eso es el scroll— y lo que se apaga es el fundido. *Quitar el scroll dejaría la pantalla inservible; quitar el fundido no le saca información a nadie.*

### `FilaAccionesCostura`
- **props:** `accesos[]` (`clave` · `icono` · `palabra` · `onPress`)
- **tokens:** `medidas.margen` · `theme.elevacion.elevada` · `theme.bg.card`
- 🔴 **De DOS a CUATRO.** Con uno no hay fila (es un botón); con cinco los círculos bajan del área táctil.
- 🔴 **UNA palabra por acceso. Si necesita dos, el círculo NO crece: se cambia la palabra.** La pieza la dibuja en **una línea con `numberOfLines={1}`**, así que dos palabras **se ven cortadas** — *y eso es la señal, no un defecto que haya que disimular: cuatro círculos de distinto ancho dejan de ser una fila.*
- ⚠️ **El desplazamiento es `DISCO / 2`, no un número:** por eso sigue siendo media mitad el día que el disco cambie de tamaño. *Una pantalla que escribe `marginTop: -32` no sabe por qué es 32.*
- ⚠️ **La sombra no es adorno:** un círculo blanco sobre el lienzo casi no tiene contorno y sobre el ciruela lo tiene de sobra. La sombra le da el mismo borde a las dos mitades.

### `FilaMascotas`
- **props:** `mascotas[]` (`id` · `nombre` · `fotoUrl?` · `enMemoria?`) · `elegida` · `onElegir` · `linea?` · `agregar?`
- **tokens:** `accent.sobreGradiente` · `text.onGradient` · `bg.overlay` · `radius.full`
- 🔴 **Es un SELECTOR, no una tira informativa, y el cambio de modelo se declara.** Lo que había en el techo del Hogar daba a cada mascota su nombre, su punto de estado y su línea de próxima vacuna: *ocho mascotas eran ocho líneas compitiendo — un tablero de faltantes con forma de fila de caras.* Acá hay **una elegida** y la línea de abajo es la suya. ⚠️ **El costo: el estado de las demás deja de verse sin tocarlas.** Ése es el intercambio, y quien monta tiene que saber que lo hace.
- 🔴 **El aro SIEMPRE está; lo que cambia es su color.** *Un aro que aparece sólo en el elegido mueve a los vecinos 6 px en cada toque* — la fila entera tiembla y el temblor se lee como defecto aunque sea la respuesta al gesto.
- 🔴 **El color sale de `accent.sobreGradiente` y NO de `accent.active`.** Medido: `active` vale `magentaAccion` en claro y `tintaV5` en memorial, y **los dos desaparecen sobre la banda**, que desde el lote 3b es ciruela oscura en los tres temas. *Ninguna medición de contraste lo iba a decir porque ese par nunca estuvo declarado.*
- ⚠️ **La línea de estado llega RESUELTA y `null` no se dibuja.** La voz sale de `calcularVozHogar` sobre el expediente real (L-139), que vive en `@epetplace/domain`. *Un «sin datos» bajo el carrusel es la trampa de la tira vieja concentrada en un renglón.*
- ⚠️ **La elegida se marca con el aro y con el PESO del nombre, jamás con color de texto.** Decirlo dos veces le quita fuerza al aro.
- ⚠️ **72 y no 112**: la tira vieja necesitaba 112 porque cada retrato cargaba nombre + punto + vencimiento. Con 112 y el modelo nuevo, la fila empuja el saludo fuera de la banda en pantallas de 360.

### `IdentidadMascota`
- **props:** `nombre` · `fotoUrl?` · `pastilla?` (`voz` · `tono` · `glifo?` · `complemento?`) · `apoyo?` · `meta?` · `onPressFoto?` · `etiquetaFoto?`
- **tokens:** `typography.escala.titulo1` (Baloo, vía `Texto variante="titulo"`) · `text.onGradient` · `bg.card` · `elevacion.elevada`
- 🔴 **EL NOMBRE PASA A BALOO, y es una corrección medida.** El expediente lo dibujaba en `SERIF_LOCAL = Platform.select({ ios: 'Georgia', default: 'serif' })` con su marcador de override: **la serif del sistema operativo** — *dos aparatos mostraban el nombre de la misma mascota en dos tipografías distintas, y ninguna era la de la casa.* En la casa v5 `Texto variante="titulo"` ya resuelve `escala.titulo1` (Baloo 28/31), así que la pieza **no elige una fuente**: pide la variante.
- ⚠️ **El 44/48 de la serif NO se porta.** El tamaño de una fuente no se traslada a otra: Baloo tiene otra altura de x, y a 44 un nombre de tres sílabas no entra en 360.
- 🔴 **La pastilla MONTA el aro del retrato.** Suelta debajo se leería como el primer renglón del texto; cabalgando el borde es el estado de la mascota. *Mismo gesto que la tarjeta montando su borde, a otra escala.*
- ⚠️ **`apoyo` y `meta` son DOS líneas y no una.** `apoyo` es una frase (de dónde llegó), `meta` es metadato (raza · edad · peso), y van en registros distintos. *Mezclarlas convertiría «Llegó de un criadero» en un dato más* — lo declaraba el archivo viejo. El encargo nombró una; la segunda está en el objeto y sacarla borraría raza, edad y peso del techo.
- ⚠️ **Sin `onPressFoto` el retrato se MIRA**: pasa a `accessibilityRole="image"` y deja de anunciarse como botón. *Un botón deshabilitado sigue diciendo que es un botón, y sin razón visible eso es peor que no serlo* — es el caso de memorial.
- ⚠️ **Hay un TIPO con este nombre en `@epetplace/api`** (lo que devuelve `obtenerPerfilMascota`). Quien importe los dos en un archivo, lo renombra en el import: `import type { IdentidadMascota as PerfilDeMascota } from '@epetplace/api'`.


---

## S116-B lote 5 · EXPLORAR Y SERVICIOS

### `GrillaOficios`
- **props:** `oficios[]` (`clave` · `glifo` · `etiqueta` · `disponible`) · `onElegir` · `vozSinDisponibles?`
- **tokens:** `bg.card` · `elevacion.elevada` · `accent.glifo` (vía `Icono registro="glifo"`)
- 🔴 **Un oficio sin nadie cerca SE MARCA, NO SE ESCONDE** (firma de la mesa, y es lo contrario de lo que hace casi toda vitrina). *Un oficio que desaparece le enseña a la familia que el producto no lo tiene, y el día que llegue el primer prestador nadie va a volver a buscarlo.*
- 🔴 **Y por eso sigue siendo TOCABLE — no lleva `disabled`.** *Un control apagado no puede explicar por qué lo está*, y lo que la pantalla tiene que poder decir —«todavía no hay nadie cerca»— es justo lo que un botón muerto se lleva puesto. La pieza lo dibuja apagado y avisa por `accessibilityHint`; **`vozSinDisponibles` es obligatoria cuando hay alguno**: un estado que sólo existe como color más pálido es invisible para quien no ve el color.
- ⚠️ **Un tercio de ancho por ítem, NO el ancho del disco.** Con `width: DISCO` entran CUATRO en una pantalla de 360 y la grilla deja de ser de tres: *la cantidad por fila pasaría a depender del teléfono, que es lo que una grilla existe para evitar.*
- ⚠️ **El desplazamiento es `DISCO / 2`, derivado.** Misma regla que `FilaAccionesCostura`, y **sólo la primera fila pisa la costura.**
- ⚠️ **Es la hermana ancha de `FilaAccionesCostura` y no se fusionan:** aquélla es una FILA de hasta cuatro que caben en una línea; ésta es una GRILLA que crece hacia abajo. *Fusionarlas obligaría a una pieza a decidir si envuelve según cuántos le pasan, y el corte de la palabra dejaría de ser la señal que es.*

### `TarjetaPrestador`
- **props:** `nombre` · `retrato` · `lineaOficio` · `calificacion?` · `vozResenas?` · `desde?` · `vozDesde` · `vozVer` · `onPress`
- **tokens:** `Tarjeta` · `PrecioText registro="cifra"` (Baloo) · `Icono nombre="calificacion"`
- 🔴 **No es `FichaPrestador` y no se fusionan.** Aquélla es **la vitrina** —carrusel, clip, mapa de zona, historia, cohorte— y existe para que el espejo del prestador y lo que ve la familia **no puedan divergir**. Esto es una fila de resultados. *Meterle a la vitrina un modo compacto la volvería una pieza con dos anatomías, que es el defecto del que la vitrina nació.*
- 🔴 **Toda la tarjeta se toca y el «Ver» NO es un segundo destino.** *Dos áreas táctiles con dos destinos en una fila es cómo se toca lo que no se quería tocar.* El «Ver» existe para decir que la fila se toca, así que va `apoyada` y **queda fuera del árbol de accesibilidad**: el lector anuncia la fila una vez, con el nombre del negocio.
- 🔴 **Sin reseñas la línea NO EXISTE**, ni como «0 reseñas». *Un negocio nuevo no está peor calificado: está sin calificar, y un cero con una estrella al lado dice lo primero.*
- ⚠️ **Sin `desde` no se dibuja el bloque ni el «Ver»:** *una fila que ofrece «Ver» sin decir desde cuánto obliga a entrar para averiguar el precio, que es lo que esta lista existe para evitar.*
- ⚠️ El rótulo «desde» es de la pieza, no de la pantalla (escalera del precio honesto, S57): acá el precio varía siempre.

### `GrillaSubservicios`
- **props:** `subservicios[]` (`clave` · `glifo` · `nombre`) · `onElegir`
- 🔴 **El alto igual por fila NO se pide: se DERIVA.** Cada fila es `row` + `alignItems: 'stretch'`, así que las dos tarjetas miden lo que la más alta **por construcción**. *Un alto fijo acierta hasta el primer nombre de tres líneas; un alto medido llega un frame tarde y la grilla salta.*
- ⚠️ **Se arma por FILAS y no con `flexWrap`:** con `flexWrap` los hijos no se estiran entre sí y la fila queda despareja. *El envoltorio que parece equivalente rompe justo lo que esta pieza promete.*
- ⚠️ **Acá el nombre PUEDE ser de dos líneas**, al revés que la fila de la costura: la tarjeta tiene media pantalla y los subservicios se llaman como se llaman. *Forzar una palabra obligaría a inventarle nombres al catálogo.*
- ⚠️ La tarjeta huérfana de una fila impar lleva un hueco del mismo ancho al lado: **sola y del doble de ancho se leería como una destacada, y no lo es.**

### `SelectorHora`
- **props:** `horas[]` (`codigo` · `etiqueta` · `disponible`) · `elegida` · `onElegir` · `etiquetaSinLugar`
- 🔴 **No es una promoción literal de `GrillaElegir`.** Su antecesor vive local en el cliente y **hace TRES trabajos** —horas, duraciones y el QUÉ de grooming—; por eso tiene props de columnas y de voz. *Promoverlo verbatim con el nombre `SelectorHora` habría puesto en `packages/ui` un nombre que miente sobre dos de sus tres usos.* **Se promueve el TRABAJO, no el archivo.** Cuando el eje de la hora migre, `GrillaElegir` pasa de tres trabajos a dos.
- 🔴 **Apagada y NO elegible**, por orden del encargo. ⚠️ **Eso cierra el camino por el que se explicaría por qué no hay** —es lo que llevó a la rueda de días a dejar el día cerrado tocable—, así que **si todas las horas de un día están apagadas, la pantalla tiene que decirlo**: el chip ya no puede.
- ⚠️ **Sin preselección.** *Elegir por la familia una hora que no pidió es cómo se reserva lo que no se quería.*
- ⚠️ La hora va en mono: dato de máquina (Ley 3), que es lo que su antecesor ya declaraba al separar `voz='mono'` de `voz='sans'`.

### `SelectorDia` — ⭐ **gana la anatomía v5; la rueda sigue viva**
- 🔴 **Un trabajo, una pieza (Ley 19): la tira NO nace aparte.** Lo que cambia es **de qué casa es la anatomía**, y esa pregunta ya tiene su slot: **`accent.formaV5`**. Cliente: tira de cuadrados con el nombre corto arriba, el número en Baloo, el elegido en ciruela y **la pata pisando**. Prestador y memorial: la rueda de siempre.
- 🔴 **Los NUEVE montajes vivos no se tocan** —seis del cliente, tres del prestador— y cada uno recibe la anatomía de su casa. *No es una prop de variante inventada: es la decisión que la casa ya tomó, aplicada donde corresponde.*
- ⚠️ **La física firmada de la rueda queda INTACTA** (S82-C r12; su cabecera dice que no se recalibra sin otro gate). *Un reemplazo habría cambiado la portada del prestador sin que nadie la mirara.*
- ⚠️ **En la tira el día cerrado NO se elige, al revés que en la rueda.** La rueda lo dejó tocable porque la voz que explica el vacío sólo se monta para el día elegido; **acá manda el encargo**, y la contrapartida es de quien monta: el porqué tiene que decirse en otro lado.
- ⚠️ **El número pasa a Baloo y no contradice a la rueda: hereda su razón.** La rueda lo puso en sans *«porque un día que ELEGÍS es una elección, no un dato leído»* — sigue siendo cierto; lo que cambió es que la casa v5 **tiene una voz propia para las cifras** y no la tenía cuando la rueda se calibró.

### `PieReserva` — ⭐ **gana el rótulo y la cifra; no nace un pie nuevo**
- **props nuevas:** `rotuloTotal?`
- 🔴 **La cifra pasa a Baloo cuando la casa lo es (`formaV5`).** ⏪ La línea decía *«el precio es dato de máquina a escala chica: mono (Ley 3)»* — **y ese criterio quedó atrás, no equivocado**: la Ley 3 manda mono para metadata chica de máquina, y la letra v5 le dio a la casa una voz para las cifras que **no existía cuando esto se escribió**. *La ley no se deroga: ahora hay un registro para esto.* El prestador conserva el mono (`formaV5: false`).
- ⚠️ **`cifraChica` (22) y no `cifra` (44):** 44 es la cifra que preside una pantalla; acá comparte el renglón con el CTA y a ese tamaño lo empuja fuera.
- ⚠️ **`rotuloTotal` sin default:** un pie cuyo precio varía por prestador **no dice «Total» — dice «desde»**, y rotularlo así afirmaría un total que la pantalla todavía no sabe.

### `FilaIncluye`
- **props:** `items[]` (líneas ya en voz de familia)
- ⚠️ **El verde acá no rompe la regla del semáforo:** no dice «está bien», dice **«esto sí entra»**, y contrasta contra lo que no está en la lista. *Misma función que el check de «Al día»: afirmar, no calificar.* Sale de `status.successText` —el registro de TEXTO— porque acompaña texto.
- 🔴 **Lo que NO incluye no se dibuja tachado, y no hay estado negativo.** *Una lista que enumera lo que no entra le enseña a la familia todo lo que le falta a lo que está por comprar.* Si hace falta decir una exclusión, es una frase de la pantalla.
- ⚠️ El check es **gráfica y no un glifo del registry**: no significa una acción ni una sección — es el bullet de esta lista. Queda fuera del árbol de accesibilidad.

### `PrecioText` — ⭐ **gana el registro `cifra`**
- 🔴 **Nace de un hueco que la pieza tenía y su cabecera no podía ver:** la letra v5 dice *«Baloo 2 800 para display, títulos y CIFRAS»* y `typography.escala` la declara desde el lote 2 — **pero los tres registros seguían en PJS**, o sea en la escala v4. *La voz única del precio se quedó una letra atrás, y como no falla nada nadie lo iba a notar hasta que una pantalla pidiera la cifra de la casa.*
- ⚠️ **No cambia ninguno de los otros tres.** Migrarlos es decisión de mesa con su gate: toca los 53 sitios que esta pieza unificó.

---

### `FiltroPills` — ⭐ **es la fila de pestañas del perfil; no nace una pieza nueva**
- El encargo del lote 4 pedía «`FilaPestañas` si no existe». **Existe**: `FiltroPills`, promovida en S85-B7, ya es la fila de chips con el elegido marcado y **la pata que pisa** (`MarcaEleccion`), y el chip activo en ciruela está declarado en `palette.ts:63` como su empleo. *Un componente por caso real, y este caso ya tiene el suyo.*

### `OndaAcceso`
- **props:** `frase` (dos líneas) · `lado` (`izq`|`der`) · `especies?`
- **tokens:** `palette.magentaAccion` · `motion.v5.personajePrimeraMs` · `motion.v5.personajeCadaMs` · `motion.v5.personajeFundidoMs` · `spacing`
- **exporta:** `ALTO_ONDA_ACCESO` — 🔴 **la única forma que tiene el contenido de no quedar debajo del magenta**, porque la pieza ya no ocupa lugar. ⚠️ Es la parte **FIJA y no incluye el inset** (mismo trato que `AIRE_RAIZ`): lo dibujado es `ALTO_ONDA_ACCESO + insets.bottom`, y *un token que se llevara el inset adentro sería falso en cuanto cambie el aparato*.
- 🔴 **La ola es un `Path`, no un `borderRadius`:** un radio da un DOMO —simétrico, una sola inflexión— y *una ola tiene dos*. El `viewBox` de 100 con `preserveAspectRatio="none"` la estira con la pantalla en vez de repetirla.
- 🔴 **La frase llega YA PARTIDA en dos líneas.** Dónde corta es una decisión de redacción; un `numberOfLines={2}` la tomaría por su cuenta con el ancho de cada teléfono.
- 🔴 **GEOMETRÍA DICTADA (lote 13, recorrido 4 — cuarta vez que se pide y la primera con números):** `position:'absolute'` · `bottom:0` · `left:0` · **ancho = el de la PANTALLA** (`useWindowDimensions`) · **cero margen propio** · **cero radio abajo** · el magenta **por debajo de la barra de teclas de Android**, hasta el piso físico.
  > **Antes era un bloque en el flujo, así que el margen y el radio se los ponía quien la montaba y ella no tenía cómo impedirlo.** *Una pieza que pide «sin márgenes» en su documentación está pidiendo que el consumidor se acuerde.* Absoluta y anclada al piso, **no hay dónde ponerle un margen**.
  ⚠️ **Y la galería era parte del defecto:** sus tres montajes la envolvían en un `View` con `borderRadius: radius.lg` — *una galería que envuelve la pieza en algo que la pieza no tiene no la muestra: la disfraza.*
- 🔴 **El teclado: fundido + DESMONTE.** ⏪ Antes dejaba un hueco de su alto para que el contenido de arriba no saltara; **siendo absoluta no hay nada que saltar**, así que devuelve **`null`**. *«Cero magenta» se cumple mejor no existiendo que siendo transparente* — y el hueco era la última forma en que un nodo suyo seguía en pantalla.
- ⚠️ **Absorbe `insets.bottom` como padding, no como margen:** el magenta sangra hasta el filo y sólo el contenido se corre (Ley 8, precedente `Hoja`/`PantallaConPie`).
- **Su lugar es HERMANA de `HojaContenido`, no su `pie`** (ver §⓪).
- 🔴 **EL MAGENTA VIVE EN LA RAÍZ** (lote 8). ⏪ Lo ponían la ola y la banda, cada una en su caja: **todo lo que quedara entre ellas o alrededor salía lienzo** —el SVG a 100 % deja subpíxeles en los cantos, y cualquier redondeo abre una línea abajo—. *Un color que se compone de dos piezas tiene tantas junturas como piezas.* Con el fondo en la raíz, las junturas **no pueden existir**.
- ⚠️ **El inset es el CRUDO, no el derivado** — el derivado mide *cuánto de la barra queda debajo del contenedor*, correcto para un pie y **equivocado para una franja que tiene que llegar al borde físico**. *La misma lección que el asistente ya había cobrado.*

### `FilaBeneficio`
- **props:** `glifo` · `titulo` · `apoyo`
- **tokens:** `accent.glifo` · `accent.glifoBg` · `radius.chipV5`
- 🔴 **NO ANUNCIA TOQUE, y no es «una celda con el `onPress` apagado»:** ni `Pressable`, ni `accessibilityRole`, ni chevrón, ni hundido — **no están apagados: no están.** *Una celda de navegación dice «acá se entra» con todo su cuerpo; quitarle el toque deja una puerta que no abre, y quien la toque concluye que la app está rota.* Para el lector de pantalla la diferencia es total: una celda se anuncia «botón», y acá no hay botón que anunciar.
- ⚠️ **Cuatro tarjetas, no una lista con divisores:** *una lista dice «estos ítems van juntos»; cuatro tarjetas dicen «cada uno vale por sí mismo»*, que es lo que una pantalla de propuesta necesita.

### `EsperaLarga`
- **props:** `titulo` · `apoyo` · `pie?`
- **tokens:** `motion.coach.respiracionMs` · `motion.v5.asistenteHalo*` · `bg.base`
- **consume:** `lib/rueda-de-caras` (la misma de 00, 02 y la onda) y el halo del asistente. **Nada se redibuja.**
- 🔴 **NO SABE CUÁNTO FALTA Y NO LO FINGE — por eso muere la línea de progreso.** *Una barra que avanza sin saber hacia dónde es una promesa que nadie puede cumplir, y cuando se queda quieta al 80 % lo que comunica es que algo se rompió.* Lo que esta pieza comunica es otra cosa: **que hay alguien acá**.
- 🔴 **ES LA ÚNICA PIEZA DE LA CASA CON MOVIMIENTO SIN FIN**, firmado. En el asistente el halo respira tres veces y descansa **porque una animación infinita deja la ventana no-idle**; acá esa razón no aplica: *la espera es lo que dura, y una pantalla de espera detenida a los 24 s dice lo contrario de lo que vino a decir.* ⚠️ **Consecuencia declarada: mientras esté, `uiautomator` no reporta `idle`.**
- ⚠️ Con reducir movimiento: la rueda **no arranca** y el halo **se queda puesto**. *Lo que descansa es el movimiento, no la presencia.*

### 🔴 LAS DOS ESPERAS — CUÁL SE USA CUÁNDO, Y DÓNDE ESTÁ EL CORTE

| la espera… | va con | por qué |
|---|---|---|
| **corta** — cabe en un parpadeo: una lista que llega, un guardado, un refresco | **`EsperaDeMarca`** | ocupa un hueco y **no cambia la pantalla**. *Poner una pantalla entera de espera para 400 ms hace que algo instantáneo se sienta lento* |
| **larga** — la persona **no puede hacer nada más** y lo sabe: pago, lectura del carné, un PDF que se arma | **`EsperaLarga`** | **toma la pantalla**, dice qué está pasando y ofrece salida. *A los tres segundos, un spinner en un hueco deja de informar y pasa a parecer que se colgó* |

**EL CORTE, dicho como número para que no se discuta cada vez: ~2 segundos** — el mismo umbral que la Ley 13 ya usa para decidir cuándo aparece un spinner. ⚠️ **Y no es el tiempo que tarda: es el que la persona VA A ESPERAR.** *Una operación de 5 s que casi siempre resuelve en 300 ms es corta; una de 2 s que siempre tarda 2 s es larga.*

**Dónde hay que reemplazar:** toda espera larga que hoy sea un spinner suelto, una línea de progreso o un texto solo, **cuando C la monte**. *Esta tabla no migra nada por sí sola: dice qué poner cuando se toque.*

### `AbanicoAsistente`
- **props:** `atajos[]` (`glifo` · `texto` · `onPress`) · `vozPreguntar` · `onPreguntar` · `onCerrar`
- ☠️ **Reemplaza a `HojaAsistente`, que murió en el lote 11** (lápida en `components/HojaAsistente.LAPIDA.md`). 🔴 **Una hoja modal tapa la pantalla desde la que se la abrió — y el contexto de lo que se va a preguntar ES esa pantalla.** *Preguntar sobre algo no puede empezar por esconderlo.* Segunda razón, de gesto: una hoja pide dos manos o un pulgar que viaje; **el abanico nace donde está el dedo**.
- 🔴 **LOS ATAJOS DEL ORBE, CENSADOS DEL OBJETO:** `apps/cliente/src/lib/nexo/atajos.ts:57` — `['peso','vacuna','antiparasitario','foto']`. ⚠️ La mesa los nombró de memoria como «agregar recuerdo, carné de vacunas»; **`peso` y `antiparasitario` no estaban en esa lista y sí en el código.**
- ✅ **Reusa el MOTION del orbe y no su geometría:** `coach.escalonadoMs` al abrir y `coach.cierreMs` al cerrar, con su regla — **se abre escalonado y se recoge de golpe**, *porque escalonar la salida hace esperar a quien ya decidió irse*. El arco de pata NO se reusa: el sketch pide una columna, y heredar el arco sería una coreografía que nadie pidió.
- ⚠️ **La etiqueta va a la IZQUIERDA y no debajo:** debajo, cuatro etiquetas empujan la columna a lo alto y el último atajo queda fuera del pulgar. *A la izquierda la columna mide lo mismo con etiqueta que sin ella.*
- ⚠️ **El velo ocupa la pantalla entera**, porque *«se cierra tocando fuera» sólo se cumple si «fuera» es tocable*. Y **el botón también cierra**: uno que sólo abre deja a quien se arrepintió buscando dónde tocar.

---

## ① EL SHELL — las que nacieron en el lote 2 y monta C

### `Cabecera`
La banda ciruela de arriba. **Va en TODAS las pantallas del cliente**, no solo en las del lote 3: es lo primero que se ve y lo que hace que la app parezca una sola.
- **props:** `variante` (`raiz` | `empujada`) · **`presentacion`** (`tarjeta` | `fondo`) · `antetitulo` · `titulo` · `apoyo` · `accionDerecha` · **`carrito`** · **`avisos`** · **`contenido`** · `pasos` · `onVolver` · `etiquetaVolver`
- 🔴 **`contenido` (lote 3b, `D-1106`) — contenido propio DENTRO de la banda.** Lo pidieron **los dos techos locales que quedaban vivos**, medidos: el **Hogar** (fecha en mono + saludo + **la fila de mascotas adentro del degradado**) y el **Expediente** (el hero, con su flecha de volver dibujada con un `Path` a mano). *El propio código del Hogar lo declaraba: «HeroMarca no tiene slots para fecha-antes-del-saludo ni para la fila de mascotas: se compone local COPIANDO NIVEL de la primitiva».* ⚠️ **Es un slot, no una pieza:** el contenido lo arma la pantalla porque es suyo; **lo que deja de ser suyo es el techo**.
- 🔴 **`avisos` (lote 3b) — la campana con su contador**, hermana de `carrito` y en el mismo slot derecho. **El censo encontró DOS acciones-con-contador en raíz** y hasta hoy cabía una: la campana vivía dibujada a mano en el techo del Hogar. ⚠️ **En `empujada` no se dibuja ninguno de los dos.**
- 🔴 **`presentacion="fondo"` (S116-B) — y desde el lote 3c la curva invertida es INEXPRESABLE, no documentada.** El founder seguía viendo cabeceras con **las esquinas de abajo redondeadas**, como tarjeta, en vez de la estructura firmada: **fondo ciruela sin radio + hoja con las esquinas de ARRIBA redondeadas**.
  > **Un ternario documenta la regla; dos objetos la hacen imposible.** Antes el radio estaba en el estilo del fondo **valiendo `0`** — alcanzaba con que alguien lo cambiara, lo copiara, o agregara el tercer caso *«fondo pero con un bordecito»*. **Ahora el estilo del fondo no tiene la clave: no hay qué cambiar.**
  *La curva de abajo es de una tarjeta apoyada sobre algo; el fondo no está apoyado sobre nada — es lo que está debajo de todo.* **Default `tarjeta`**, y quien la monta como fondo tiene que darle una superficie debajo (hoy, `HojaContenido`).
- ⚠️ **No tiene un alto fijo y no se puede exportar uno:** mide `inset + padding + CONTENIDO + padding`, y el contenido es variable por diseño. Se exportan `ALTO_CABECERA_RAIZ_FIJO` / `ALTO_CABECERA_EMPUJADA_FIJO` (**sólo el padding**) como piso de arranque para medir con `onLayout`. *Un alto único sería correcto para una combinación y falso para las otras siete.*
- **tokens:** `gradients` · `medidas` · `palette` · `radius` · `spacing` · `elevacion` · `theme.accent`
- **captura:** `docs/loop/capturas-s116-b-lote2/piezas-v5-montadas.png`
- ⚠️ **El degradado lo resuelve el TEMA, no un `if memorial`** — memorial cae a ciruela noche plana solo.

### `DiscoVidrio`
El círculo translúcido de las acciones **sobre la banda ciruela** (la flecha de volver, el carrito).
- **props:** `children` · `onPress?` · `etiqueta?`
- **tokens:** `medidas.cabeceraEmpujada.flecha` · `radius.chipV5` · blanco al 16 %
- ⚠️ **Todavía sin consumidores en las apps:** `Cabecera` la monta *dentro de `packages/ui`*, que no cuenta. **Deja de estar sin nadie el día que el carrito de la Despensa migre de su copia a esta pieza** — que es exactamente lo que esta entrada existe para habilitar.
- 🔴 **NACE COMO PIEZA (lote 12) PORQUE ESTAR EXPUESTO NO ALCANZÓ.** Vivía dentro de `Cabecera.tsx` y desde el lote 2 estaba disponible como `Cabecera.Disco`, **con un comentario que pedía literalmente lo que después pasó** —*«que quien monte la acción derecha use EL de la cabecera y no dibuje otro»*—. **C lo copió igual** para el carrito de la Despensa.

  > **Exponer no es publicar.** Una propiedad estática no entra al índice del paquete, no tiene entrada de catálogo, no tiene fila en la galería y no aparece en un autocompletado de `@epetplace/ui`. **Para quien no leyó ese archivo es indistinguible de una pieza privada** — y la salida barata siempre es volver a dibujarla.

- ⚠️ **SU MATERIAL EXIGE CIRUELA DEBAJO:** es blanco al 16 %, así que sobre lienzo no se ve. **Montarlo en fondo claro no lo muestra mal: lo muestra ausente.** Quien lo necesite sobre una superficie clara está buscando otra pieza.
- ⚠️ **Sin `onPress` es CONTENEDOR** (no anuncia toque ni toma rol); con `onPress` es botón y **la etiqueta deja de ser opcional en la práctica**.
- ☠️ **`Cabecera.Disco` queda como alias** y **muere cuando su último consumidor migre**: *dos puertas al mismo disco son exactamente lo que produjo la copia que esta pieza vino a borrar.*

### `BotonAsistente`
El botón flotante que abre NEXO. Va en **toda raíz**.
- **props:** `onPress` · `visible` · `etiqueta`
- **tokens:** `medidas` · `palette` · `radius` · `shadows` · `spacing` · `theme.accent`
- 🔴 **FLOTA SOBRE EL CONTENIDO, así que la pantalla tiene que dejarle aire:**

  ```tsx
  contentContainerStyle={{ paddingBottom: AIRE_RAIZ + insets.bottom }}
  ```

  **`AIRE_RAIZ` = 168** (`barra 92 + separación 8 + asistente 60 + respiro 8`), y es **la parte FIJA** — la pantalla le suma `insets.bottom`, igual que el shell hace con `ALTO_FILA_TABS`. *Un token que incluyera el inset sería falso en cuanto cambiara el aparato.*
- ⚠️ **UN SOLO TOKEN, no un número por pantalla.** Nació de un defecto visto: la barra tenía su medida y el asistente la suya, **y nadie tenía la suma** — *dos medidas correctas que nadie compone dejan un hueco que no es de ninguna de las dos.* Se **deriva**, no se escribe: si el asistente crece, las once raíces lo heredan solas.
- ⚠️ Y la separación la comparten pieza y token (`SEPARACION_ASISTENTE`): **si el botón escribiera su propio número, los dos podrían divergir sin que nada falle** — el botón se movería y el aire quedaría corto.

### `Opcion`
Filas con círculo de elección — **no chips**. Para elegir una de varias cosas que se leen como texto.
- **props:** `opciones[]` (`clave` · `texto` · `apoyo` · `derecha`) · `elegida` · `onElegir` · `agregar`
- **tokens:** `medidas` · `palette` · `radius` · `spacing` · `elevacion` · `theme.bg` · `theme.border`
- ⚠️ **`derecha` es TEXTO, no nodo, a propósito:** una pantalla no puede meter un botón ahí.

### `Confirmacion`
La pantalla de «¡Listo!» a lienzo completo.
- **props:** `titulo` · `apoyo` · `dato` · `lineaExtra` · `primario` · `secundario` · `especies` · `exclamacion`
- **tokens:** `medidas` · `radius` · `spacing` · `motion` · `elevacion` · `theme.accent` · `theme.bg` · `theme.mode`
- 🔴 **El trío VIENE ENCENDIDO en el cliente (S116-B) — no lo pidas.** Era opt-in y **nadie pasaba `especies`**: cero en `apps/`. ⚠️ **No es un booleano como la pata: el trío necesita saber QUÉ caras**, así que el default no es «true», es **completar** — lo que le pases va PRIMERO (la especie de la mascota) y la casa pone el resto hasta tres, **sin repetir la protagonista**. *Un trío con el mismo gato tres veces no es una familia: es un error de render que nadie reporta porque «se ve bien».* Apagalo con `trio={false}`; memorial y prestador ya quedan afuera solos.
- ⚠️ **`lineaExtra` es STRING, no nodo** — es el slot fiscal de S115 y `R74`/`R84` mantienen la plata fuera de las piezas.
- ⚠️ **Memorial no monta trío ni destellos, y lo decide el TEMA**, no el consumidor. Con `useReducedMotion` la pantalla **aparece hecha**.

### `Personaje` · `TrioPersonajes`
Las seis caras del founder. **`TrioPersonajes` es la mitad de `Confirmacion`.**
- 🔴 **El trío entra en FUNDIDO ESCALONADO (S116-B).** Tenía cero movimiento: el check de `Confirmacion` crecía y *los tres personajes aparecían de golpe debajo*. Es `FadeIn` y no una entrada con desplazamiento —la letra §2 dice **fundido**— y el escalonado usa `stagger.normal`: *tres caras a la vez son una imagen; de a una es que llegaron.*
- **props:** `especie` (`perro`|`gato`|`conejo`|`ave`|`roedor`|`otro`) · `tamano` (`grande`|`hogar`|`selector`|`fila`) · `elegido` · `fondo` · (trío: `especies` de exactamente 3)
- **tokens:** `medidas` · `palette` · `radius` · `theme.bg`
- 🔴 **El `ave` usa la nariz como cara** hasta que llegue su archivo — el único que entró trae el wordmark encima. Enmienda firmada de la letra §1.10.
- ⚠️ **Ninguna es vector**; el `roedor` tiene fondo blanco opaco.

### `CampoCodigo`
Las ocho casillas del código de verificación. **No es un campo de texto con espacios.**
- **props:** `largo` (**obligatoria, sin default**) · `valor` · `onCambio` · `etiqueta` · `error` · `tono` · `deshabilitado`
- **tokens:** `estiloDeCaja` (la misma anatomía que `Campo`) · `typography.escala.cifraChica` · `motion`
- 🔴 **UN input invisible cubre la fila entera; las ocho cajas son PRESENTACIÓN.** *N inputs con foco entre ellos es el camino que parece obvio y es el malo.* Consecuencias que salen gratis: el tap funciona **caiga donde caiga** (no hay «caja equivocada» que tocar), el pegado del código entero anda solo, y **el lector de pantalla ve UN campo, no ocho**.
- ⚠️ **El área táctil 44 ya está resuelta por diseño**, no con `hitSlop`: el input cubre toda la fila aunque cada casilla mida menos.
- 🔴 **El dígito va en Baloo cifra (S116-B)** y choca con la Ley 3 en apariencia — la casa ya resolvió este caso (MATIZ S53): *a escala display el dato viste sans; el dato sigue siendo de máquina, el traje cambia con la escala.* **`tabular-nums` se conserva**: ocho casillas de ancho igual necesitan que el 1 ocupe lo mismo que el 8, o la fila late al escribir.
- 🔴 **Con error, las ocho tiemblan UNA vez, corto y SIN rebote.** Lo del rebote no es un detalle: `easing.spring` es la curva de las confirmaciones táctiles — *un error que rebota celebra el fallo*. Y `withSequence`, no `withRepeat`: *un temblor que se repite pide atención cuando la persona ya está leyendo el mensaje.*
- ⚠️ **Respeta `useReducedMotion`, y acá importa más que en un botón:** un temblor es exactamente el movimiento que dispara el malestar vestibular. Con la preferencia activa **el error se ve igual** —las cajas cambian de color y el pie dice qué pasó—, sólo no se mueve.
- ⚠️ **«Pegar» sólo aparece si el nativo de clipboard existe**, y el autocompletado del sistema (SMS/correo) ya entra por `oneTimeCode` + `sms-otp`.

### `BotonMarcaAjena`
Entrar con una cuenta que no es nuestra (Google hoy; Apple tiene su lugar y **no se puede montar**).
- **props:** `marca` (`google` | `apple`) · `onPress` · `etiqueta` · `alto`
- **tokens:** `medidas.secundarioAlto`
- 🔴 **El botón lo entrega su DUEÑO entero** — tipografía, caja y padding incluidos — y la casa sólo le da lugar. *La marca ajena no se redibuja, no se re-colorea y no se estira.* El asset es el oficial de Google, bajado de su página de branding; su procedencia y su licencia están en `assets/marcas-ajenas/PROCEDENCIA.md`.
- ⚠️ **SE ESCALA, NO SE ESTIRA.** El asset es 180×40 con relación fija; `alto` lo agranda por igual en los dos ejes (52 ⇒ 234×52). **Un `width:'100%'` deformaría la tipografía de otro**, que es lo que sus guidelines prohíben. *Si tu fila es de ancho completo, el que se estira es el contenedor y este botón va centrado adentro.*
- ⚠️ **Por qué el botón entero y no sólo el logo:** poner su logo en un botón nuestro **también está permitido, pero exige Google Sans Medium 14/20**, que la casa no tiene. *Un botón «casi» conforme a las guidelines de otro no es un atajo: es un incumplimiento con mejor aspecto.*
- 🔴 **APPLE: montalo igual y no lo dibujes vos.** `marca="apple"` **devuelve `null`** porque no hay asset — el motor de Apple no existe (medido) y la mesa firmó que *un botón que no funciona no se muestra*. **No escribas `{apple && …}` en tu pantalla:** once pantallas con ese `if` son once lugares donde alguien se olvida de sacarlo el día que exista. Montá los dos; la pieza decide.
- ⚠️ **`etiqueta` la ponés vos y no es opcional de hecho:** el texto va DIBUJADO en el asset, así que ningún lector de pantalla lo puede leer.

### `BadgeFecha` · `BarraPasos`
El recuadro de fecha (mes sobre día) y la barra de progreso de un flujo.
- **props:** `mes` · `dia` — `total` · `actual` · `etiqueta`
- **tokens:** `radius` · `spacing` · `palette` · `theme.accent`

### `IsotipoV5` · `LogoV5`
La marca v5 por imagen. **Las dos se dimensionan por ANCHO** — el logo lleva wordmark y fijarle el alto lo deja ilegible; el isotipo lo necesita para poder pedirle *«la mitad del ancho»*.
- **props:** `sobre` (`claro` | `oscuro`) · `tamano` (`cabecera` | `splash` | **`protagonista`** | **`portada`**)
- 🔴 **`protagonista`** para 00, donde el ISOTIPO es la pantalla: **50 % del ancho**. **`portada`** para 01 · 03 · 05, donde preside el LOGO: **46 %** — *más chico a propósito, porque lleva el wordmark: al mismo ancho su nariz se vería la mitad. Igualar las fracciones habría igualado las CAJAS y desigualado las marcas.*
- ⚠️ **SON FRACCIONES DEL ANCHO, NO PÍXELES, y no es un detalle:** *«cerca de la mitad del ancho del teléfono» no es un tamaño, es una proporción.* Un px fijo la cumple en el aparato donde se midió y la incumple en los demás — en un teléfono chico tapa la pantalla, en una tablet queda perdido. La pieza resuelve con `useWindowDimensions`; **vos no pasás números.**
- ⏪ Lo que había, medido: el `splash` del isotipo usaba **`avatarHogar` (78)** —*el tamaño de un avatar de ficha para el protagonista de la primera pantalla*— y `LogoV5` tenía un **200 escrito a mano adentro de la pieza**, debajo de un comentario que decía «salen de `medidas`, no de números sueltos».
- ⚠️ **No reemplazan a `Isotipo` todavía** — aquél sigue vivo con sus 18 consumidores.

---

## ② LAS QUE CONSERVAN CONTRATO — ya están montadas

*Se rediseñaron **en su archivo** para no tocar a sus consumidores. C las usa como siempre.*

### `Boton`
La acción de la pantalla. **Una primaria por pantalla** (Ley 5).
- **props:** `etiqueta` (**no children**) · `onPress` · `variante` · `superficie` (`clara`|`muro`|**`oscura`**) · `tamano` (`sm`|`md`|`lg`) · `bloque` · `cargando` · `deshabilitado` · `iconoIzq` · `chevron` · `razonDeshabilitado`
- **tokens:** `medidas` · `radius` · `shadows` · `elevacion` · `motion` · `typography` · `theme.accent`
- 🔴 **`razonDeshabilitado` no es opcional en la práctica:** `verify:razon-muda` cuenta los botones apagados sin razón. *Un botón que se apaga sin decir por qué manda a la persona a adivinar.*
- ⚠️ En la casa v5 la etiqueta es **PJS 700 16** (`escala.cta`); el `ghost` conserva su peso — sin superficie que las distinga, **el peso ES la jerarquía**.
- 🔴 **`superficie="oscura"` (S116-B)** para el degradado de entrada y la cabecera ciruela: el primario conserva su magenta y **todo lo demás pasa a blanco**. *Va como superficie y no como variante porque la superficie es ORTOGONAL a la variante — lo dice la propia pieza.* Memorial queda afuera: su acción es tinta (Ley 21).

### `Campo`
Entrada de texto con su pie.
- **props:** `label` · `ayuda` · `error` · `tono` (`alarma`|`estado`) · `etiquetaVisible` · `deshabilitado` · **`razonDeshabilitado`** · `sinPie` · `secure` · `multilinea` · `iconoIzq` · `iconoDer`
- **tokens:** `medidas` · `motion` · `spacing` · `typography` · `theme.status` · `theme.text`
- ⚠️ **El halo del foco entra en la transición (S116-B).** La lista decía sólo `borderColor` **desde antes de que el halo existiera**, así que el borde llegaba suave y *el halo aparecía de golpe*: dos mitades del mismo estado entrando distinto. **Nadie lo decidió** — la lista se quedó donde estaba cuando la cosa que describe creció.
- ⚠️ **El error NO pinta la caja de rojo:** lo dice el pie. Y el placeholder va en `secondary` (**5,24:1**), no en `tertiary` — *un placeholder no es decoración: es lo que la persona lee para saber qué escribir.*
- ⭐ **N11″ (S116-B lote 6) — LA ETIQUETA VUELVE ADENTRO, FLOTANDO.** Glifo en su disco ciruela-tinte a la izquierda; la etiqueta donde iba el placeholder; **al enfocar se achica y sube al borde superior** y el valor queda debajo. **TERCERA vuelta de esta ley** (N11 adentro → N11′ afuera → N11″ adentro flotando) — el arco entero y lo que cada vuelta contestaba viven en `caja-de-campo.ts`.
- 🔴 **Contesta el argumento de N11′ y se declara lo que NO contesta.** Aquél decía *«la etiqueta adentro tiene que ENCOGERSE para dejar entrar el valor y pierde legibilidad»* — flotando cada uno tiene su renglón. ⚠️ **Siguen vivos sus dos costos:** en español un rótulo largo («Instrucciones de entrega») a 11 px **sigue siendo nota al pie**, y el autofill no está medido *(sí se vio funcionando en la 03: llenó los dos campos y la etiqueta quedó a la vista)*.
- ✅ **LA REGLA RECTORA QUEDA INTACTA, sin excepción tallada:** la etiqueta se mueve **AL ENFOCAR** —antes del primer carácter—, así que *nada se mueve mientras alguien tipea*. ⚠️ **Y no se anima:** animar su tamaño es animar LAYOUT, que la Ley 6 prohíbe; el cambio viaja junto al del borde, que sí se anima.
- ⚠️ **La caja pasa de 48 a 54 (derivada) y el campo IGUAL achica**, porque se va la etiqueta de afuera (14 + gap 8). Neto por campo: **−16**. Es **constante entre los dos estados**: enfocar no mueve el formulario.
- 🔴 **El glifo se DERIVA de `autoComplete`, y lo decidió un censo: `iconoIzq` tiene CERO consumidores.** Ninguna pantalla pasa un glifo, y el encargo pedía no tocarlas. ⚠️ **No es una heurística sobre el rótulo:** `autoComplete` es vocabulario estándar que el campo ya declara. **Cae a NADA cuando no puede decidir** — un genérico repetido no informa (Ley 12). `iconoIzq` gana sobre la derivación.
- ☠️ **El placeholder de ejemplo MUERE** en la casa v5 — la etiqueta hace ese trabajo. **Excepción viva: la búsqueda** (`etiquetaVisible={false}`), donde N11′ firmó *lupa + placeholder* y no hay etiqueta que flote.
- ⚠️ **`EtiquetaFlotante` es INTERNA y no se exporta** (como `retrato-mascota` o `disco-contador`): es la etiqueta de N11″ escrita una vez para `Campo` y `CampoFecha`. 🔴 **Nació al aparecer el SEGUNDO consumidor, no antes** — *dos inline que coinciden hoy coinciden por copia, la forma más frágil de coincidir.* No resuelve el CUERPO a propósito: uno es un `TextInput` y el otro un `<Text>` con una fecha.
- 🔴 **La columna del valor lleva `minHeight`, y NO es defensivo: sin él colapsa a cero y el input NO SE DIBUJA.** Medido en `antiparasitario`: la caja salía **vacía, sin rótulo y sin campo**, y **sólo cuando el campo no tiene glifo** —sin `autoComplete` ni `secure`—. *Con el disco de 32 la fila tenía un hijo con alto propio y la columna se estiraba con él; sin disco no hay de dónde sacarlo.* ⚠️ **Aislado en dos corridas y la primera hipótesis era la equivocada:** con `minWidth: 0` solo, el input seguía sin dibujarse — *el `minWidth` es el reflejo de flexbox que uno escribe de memoria; lo que faltaba era el alto.*
- ⚠️ **El rótulo visual queda fuera del árbol de a11y** (`accessible={false}` en el nodo, no sólo en su envoltorio — *medido: con las props sólo en el padre el nodo seguía en el volcado*). El `accessibilityLabel` del input sigue diciendo el nombre del campo, **igual que antes**.

### `CampoFecha` — ⭐ **la etiqueta entra a la caja (lote 8)**
- 🔴 **Era la mitad que faltaba de N11″, y la midió el censo:** la ley entró en `Campo` y esta pieza se quedó con la etiqueta afuera, así que **las dos convivían en seis pantallas** —en `carnet.tsx`, en líneas consecutivas—. N11 lo prohíbe: *«dos estilos de campo jamás conviven en la misma región de una pantalla»*.
- ⏪ **La razón que S100 había escrito acá se DA VUELTA, no se tira:** decía que *«la caja de una fecha muestra un valor LARGO, así que era justo donde el rótulo encogido peor se leía»*. **Flotando, el valor largo deja de compartir renglón con el rótulo** — el caso que peor se llevaba con N11 es el que más gana con N11″.
- 🔴 **Flota con valor *O* con la hoja abierta.** En `Campo` el disparo es el FOCO; acá no hay foco —es un botón— y su equivalente es **la hoja abierta**: el momento en que la persona está parada en este campo.
- ⚠️ **Lo que S99 escribió sigue en pie:** la etiqueta vive DENTRO del `Pressable`, así que tocar el rótulo abre el selector — un `<label for>` de toda la vida.
- ☠️ **El placeholder de fecha muere** con v5: sin valor el cuerpo queda vacío y el rótulo lo ocupa, centrado.

### `CampoCodigo` — ⭐ **EXCEPCIÓN DECLARADA, por firma de la mesa**
- 🔴 **Ocho casillas de un dígito no tienen dónde poner una etiqueta flotante; su rótulo vive arriba del grupo.** *Flotar significa subir al borde superior DE LA CAJA, y acá hay ocho: ¿en cuál flota? El rótulo no es de una caja, es del GRUPO — la ley se escribió para un control con un cuerpo, y éste tiene ocho.*
- ⏪ **Y es la tercera vez que esta forma cambia de estatus:** S99 la escribió como excepción, N11′ la celebró como *«la excepción de ayer es la norma de hoy»*, y N11″ la vuelve excepción. **La forma nunca cambió; lo que cambió tres veces es si era la norma.** *Por eso ahora está FIRMADA y no heredada: una excepción que sobrevive por inercia es indistinguible de un olvido.*
- ⚠️ La lleva `verify:etiqueta-dentro` en `PIEZAS_EXENTAS` — **no se cuenta, y se ve que no se cuenta**: su salida imprime las exentas en cada corrida.

### `PieDeCampo` — ⭐ **el aire entre campos hermanos, y el defecto no estaba donde parecía**
- 🔴 **Medido en el emulador antes de tocar: 121 px = 40,3 dp entre una caja y el rótulo siguiente.** ⚠️ **Y el `gap` de las pantallas ya era 8** —menos que los 10-12 pedidos—: *si sólo se hubiera mirado el `gap`, la conclusión habría sido que ya estaba bien.* Los 40 salían de este slot, que **reservaba 25 dp siempre**.
- 🔴 **De sus dos razones, una murió con N11″:** garantizar ≥24 para que la etiqueta de afuera no se leyera como el pie del campo de arriba. *La razón se fue con la cosa que protegía.* ⇒ vacío reserva `spacing[1]` (4), que con el `gap: 8` de las pantallas da **12 exactos**, sin que nadie toque una pantalla.
- ⚠️ **Lo que cuesta, declarado:** al aparecer un error el campo **crece 21 dp y lo de abajo se corre**. Se acepta porque **un error aparece al ENVIAR, no mientras se tipea** —el mismo corte que deja flotar la etiqueta al enfocar—. **Un campo con `ayuda` no salta nunca.**
- 📏 **El resultado, medido en la 05:** paso entre campos **100,3 → 59,7 dp** · el CTA sube **307 px** · los términos dejan de cortarse en el borde y entra además «Ya tengo cuenta».

### `Tarjeta`
La superficie que agrupa.
- **props:** `tinte` · `elevacion` (`plana`|`reposo`|`elevada`) · `relleno` (`normal`|`amplio`|`ninguno`) · `luz`
- **tokens:** `radius` · `shadows` · `elevacion` · `spacing` · `theme.bg` · `theme.border` · `theme.capa`
- ⚠️ **Tarjetas anidadas: nunca.** Y en claro la superficie en reposo conserva su hairline.

### `SelectorOpcion` · `FiltroPills` — *el chip*
`SelectorOpcion` elige (una o varias); `FiltroPills` filtra.
- **props:** `opciones[]` · `seleccionada`/`seleccionadas` · `onSelect` · `disposicion` (`fila`|`tira`|`grilla`) · `multiple` · `adorno` · `entidad` · `marcaPata` · `cargando` (por chip)
- **tokens:** `radius` · `spacing` · `motion` · `elevacion` · `theme.accent` · `theme.capa`
- 🔴 **La pata VIENE ENCENDIDA en el cliente (S116-B) — no la pidas.** Era `marcaPata = false` y **nadie la pasaba**: medido, cero ocurrencias en `apps/`. *Una firma visual que hay que pedir explícitamente no es la firma de la casa: es una opción que nadie eligió, y por eso ninguna captura la mostró nunca.* **Pasá `marcaPata={false}` sólo si tu pantalla es la excepción**; el prestador no la recibe (la decide la casa). En el chip lleno pasa a `rosaSobreCiruela` — *pintada del mismo ciruela que el relleno se volvía invisible, y los tres gates daban verde.*
- 🔴 **Y desde S116-B PISA de verdad:** tenía cero movimiento — *una pata que aparece de golpe no pisó nada, se materializó encima*. Ahora entra, **se pasa a 1,12 y vuelve**: el excedente es lo que la hace leer como PESO. Va con `easeOut` y **no con `spring`**, aunque spring sea la curva de la confirmación táctil: *algo que se apoya no rebota, se detiene.*
- ⚠️ **Los chips NO son tabs.** Para vistas exclusivas va `SelectorSegmentado`, salvo que convivan tres ejes hermanos (ahí manda la gramática de la pantalla).

### `CeldaNavegacion` · `Celda` — *la fila de lista*
`CeldaNavegacion` entra a una sección (glifo + título + chevrón); `Celda` muestra un dato.
- **props:** `icono` · `titulo` · `detalle` · `onPress` · `registro` · `chevron` — `subtitulo` · `inicio` · `densidad` · `tituloEntero` · `elegida`
- **tokens:** `radius` · `spacing` · `motion` · `typography` · `theme.accent` · `theme.bg`
- ⚠️ **El contorno transparente murió como acción de fila.** Información despliega; acción lleva. El glifo va en círculo rosa tinte.

### EL OSCURO — `'inverso'` NO significa «sobre fondo oscuro»
🔴 **Lote 15, medido en el aparato con el teléfono en oscuro.** `text.inverse` es **blanco en claro y TINTA en oscuro**: *significa «al revés del tema», no «sobre fondo oscuro»*. Sobre una superficie que es **la misma en los dos temas** —la franja magenta de `OndaAcceso`, la banda ciruela de `Cabecera`— acierta en claro **por casualidad** y en oscuro deja la letra ilegible (**3,29**).
- **La regla:** *si la superficie no cambia con el tema, el color de su letra tampoco puede cambiar.* Para magenta: **`Texto color="sobreMagenta"`** (blanco fijo, **5,13**, en el gate).
- ⚠️ **Es la misma ley que `sobreCta` vista del otro lado:** aquélla resuelve **por casa** porque el CTA cambia de color; ésta es **fija** porque la franja no.
- **`Personaje`**: su fondo `'blanco'` leía `theme.bg.card` y en oscuro era ciruela. *Un valor cuyo nombre dice «blanco» y en un tema no lo es no es una decisión de tema: es un nombre que miente.* **Y tenía una segunda razón**, escrita en su propia cabecera: el blanco tapa el fondo blanco opaco del asset del roedor.
- 🔴 **Sin curar y censado** (lote 15, §③): `Cabecera:209·213·217` y `bienvenida.tsx:155·165` — **la cabecera va en toda pantalla del cliente**.

### EL BOTÓN DE LA REJILLA — `Boton tamaño="xs"`
Alto **30**, letra un escalón menos. *Un CTA de alto de pantalla dentro de una celda de dos columnas compite con el producto que la celda existe para mostrar.*
- ⚠️ **Bajó la CAJA, no sólo el botón:** `ALTO_STEPPER_ANCHO` 34 → 30, porque `Mutacion` la comparte con el stepper — *dos formas que se turnan en la misma caja tienen que medir lo mismo o la tarjeta salta al tocar* (L-284).
- **El blanco táctil sigue en 44 por `hitSlop`:** se achica el píxel, nunca el blanco del dedo.

### LA GALERÍA SALTA A UNA SECCIÓN — `?solo=`
`cliente:///gallery?solo=abanico` monta sólo las secciones cuyo título contenga ese texto. **Nació de un costo medido:** dos lotes cerraron sin su captura porque llegar a una pieza era barrer ~9.800 líneas con swipes. ⚠️ **Filtra, no reordena**: sin parámetro la galería es la de antes — *un instrumento que cambia lo que mide cuando no se lo usa no sirve para medir.*

### EL CONTADOR — *un disco, dos portadores* (`disco-contador`)
🔴 **Lote 13, orden del founder:** *«el contador es un círculo magenta con el número adentro en blanco, PJS 700, pegado arriba a la derecha del glifo; **la pata muere ahí**. Con cero, no se dibuja. **Misma pieza para campana y carrito**.»*
- **dónde vive:** `components/disco-contador.tsx` — **geometría compartida, no una pieza exportada** (como `grilla-de-dos` o `caja-de-campo`). *Exportarla obligaría a darle galería a algo que nunca se ve solo.*
- **quiénes lo portan:** `Badge` (la campana) · `GlifoConContador` (el carrito). **Son dos envoltorios con contratos distintos** —uno recibe el ícono armado, el otro el nombre del glifo— y *«misma pieza» se cumple en el DISCO, que es lo que se ve.*
- **color:** `palette.magentaAccion` + `palette.white`, **fijos**. ⏪ Antes cada portador usaba `theme.accent.control` sobre `theme.bg.base`: un par medido **y distinto en cada casa** — en oscuro el «círculo magenta con número blanco» salía ciruela con número lienzo. *Un contador que cambia de color con el tema deja de ser la misma señal.* **Medido: blanco sobre magenta 5,13** (pasa el 4,5 de texto; el par ya está en `verify:contrast`).
- ☠️ **LA PATA MURIÓ**, y lo que se paga queda escrito: la huella decía la novedad **por presencia y jamás con un número**, para no invitar a vaciarla (`MODELO_LOYALTY` §3). *Esa razón sigue siendo buena; el founder decidió otra cosa — se ejecuta y se anota que la mecánica de «bajarlo a cero» vuelve a estar a la vista.*
- ⚠️ **`Badge` conserva `forma` y `superficie` INERTES**, con fecha de muerte: se van cuando su último consumidor migre. *Romperle el typecheck a la app a mitad de sesión cuesta más que dos props muertas declaradas.*

### LA REJILLA PAREJA — cómo se estira una fila de dos
🔴 **Lote 13:** *«dos tarjetas de la misma fila miden lo mismo y el botón «Agregar» va pegado al borde inferior en las dos, alineados»*.
- **La cadena de estiramiento tenía DOS eslabones cortados**, y ninguno estaba donde se lo buscaba: ① el `Animated.View` de `usePresionado` **dentro de `TarjetaProducto`** medía su contenido, así que el `flex: 1` de su `Pressable` no tenía contra qué crecer — *lo pone la primitiva de presión, no el autor de la tarjeta, y por eso es invisible al leer la pieza*; ② `Entrada`, que envuelve a la tarjeta en la grilla, también medía contenido.
- **`Entrada` gana `estira?: boolean`** (default `false`). ⚠️ **No se le puso `flex: 1` a todos:** tiene **64 consumidores** y `flexGrow` reparte espacio libre **allá donde lo haya** — encenderlo para todos cambiaría pantallas que hoy están bien, en silencio y sin que ningún gate lo vea. *La capacidad se ofrece; quien la necesita la pide.*
- **Pedido a C, una palabra:** `<Entrada estira orden={…}>` en `grillaProductos` de la despensa.

### `Insignia` — *el estado*
Verde al día · ámbar pendiente · rosa informativo.
- **props:** `estado` (`alDia`|`atencion`|`proximo`|`info`) · `capa` · `tamano`
- **tokens:** `radius` · `spacing` · `theme.status` · `theme.capa` · `typography`
- 🔴 **No se tocó una línea en el lote 2 y aun así está en v5:** lee `theme.status`, y los tokens del lote 1 la alcanzaron sola. *Es el dividendo de que la pieza lea del tema y no escriba hex.*
- ⚠️ **Ningún estado se dice solo con color** — siempre lleva palabra.

### `StepperCantidad`
Sumar y restar unidades.
- **props:** `valor` · `min` · `max` · `onCambio` · `onBorrar` · `editable` · `tamano` (`normal`|`compacto`|`menudo`|`ancho`) · `salida`
- **tokens:** `radius` · `spacing` · `motion` · `theme.accent` · `theme.border`
- ⚠️ El «+» es círculo magenta lleno con el trazo invertido; el «−» queda blanco con borde fino. **La papelera aparece SOLO cuando bajar de 1 saca el ítem de la lista** — si no, prometería un borrado que no ocurre.

### `Icono` — *los glifos*
El set b′. **Nombre tipado: cero strings mágicos.**
- **props:** `nombre` (canónico **o** nombre del mock) · `tamano` · `registro` (`capa`|`aa`|`tinta`) · `tinta` · `huella` · `activa` · `montaje`
- **tokens:** `medidas` · `palette` · `theme.capa` · `theme.status` · `theme.accent`
- 🔴 **En la casa v5 NINGÚN glifo lleva huella** (letra §1.1). Lo decide `resolverHuella`, no la pantalla — y lo vigila `verify:huella-por-casa`.
- ⚠️ **C puede montar los nombres del mock** (`buscar`, `agenda`, `chat`, `camara`…): 14 alias resuelven al canónico, y un alias mal escrito **rompe el compilador**.
- ⚠️ `Volver`/`Avanzar`/`Flecha` **no son del registry**: son `Chevron`, otra pieza.

### `Texto`
Toda la tipografía.
- **props:** `variante` (`titulo`|`seccion`|`cuerpo`|`apoyo`|`enfasis`|`antetitulo`|`dato`|`datoMd`|`voz`) · `color` (+ **`acentoSobreOscuro`**) · `numberOfLines` · `centrado` · `tabular`
- **tokens:** `typography` · `theme.text` · `theme.status`
- 🔴 **En la casa v5, `titulo` y `seccion` son Baloo 2 800** (28/31 y 22/26); `cuerpo`/`apoyo`/`enfasis` son Plus Jakarta Sans. **No hay que pasar nada: la pieza resuelve por casa.**
- ⚠️ **`dato` y `datoMd` siguen en JetBrains Mono** (Ley 3: metadata de máquina) y **`voz` sigue en DM Sans 300** — la letra no nombra una variante de voz, y cambiarla sería decidir algo que nadie firmó.
- 🔴 **`acentoSobreOscuro` (S116-B)** = el rosa sobre ciruela, para el acento de un claim sobre el degradado. **Resuelve a la paleta, no al tema**, igual que `sobreVideo`: la superficie ciruela es oscura aunque el tema sea claro. En memorial cae a `inverso` — *un acento rosa es fiesta, y §4 dice «la misma estructura sin la fiesta»*.
- ⚠️ **`Texto` no acepta `style`.** El color sale de `color`; si hace falta uno que no está, se pide.

### `AvatarMascota`
La cara de la mascota — **el último peldaño de la escalera de la cara**.
- **props:** `nombre` · `fotoUrl` · `fotoDeEspecie` · `especie` · `tamano` (`xs`|`sm`|`entidad`|`md`|`lg`) · `capa`
- 🔴 **`caraDePersonaje(especie)` (S116-B)** exporta la tabla especie→cara para que no viva en dos lugares. **Devuelve `undefined` cuando no hay cara propia** —ésas van al monograma— así que la pantalla que necesite una cara sí o sí **escribe su fallback a la vista**. *Un `?? 'otro'` adentro borraría ese criterio para todos.*
- **tokens:** `palette` · `typography` · `theme.capaBg` · `theme.text`

### `BarraTabs`
Las cinco tabs. **El activo es el círculo elevado.**
- **props:** `items` · `activo` · `onCambiar` · `onRepetir` · **`onMontaje`** · `estadoPorHuella` · `acento`
- **tokens:** `medidas` · `radius` · `spacing` · `motion` · `typography` · `theme.accent`
- ⚠️ **Geometría 66/9, firmada — la letra se enmendó, no la pieza.** El anillo es **ausencia de material**, así que muestra el fondo real de la pantalla, sea cual sea.
- ⚠️ **`onMontaje` es el enganche del contador de montajes** que C tiene que cablear.

### `EsperaDeMarca`
La espera de la casa: la nariz respirando. **Única animación de espera legal**, y siempre con voz honesta debajo.
- **tokens:** `motion` · `theme.accent` · `theme.capa`
- ⚠️ En memorial **queda quieta**.

### `NarizNotificacion`
La silueta de la marca para la bandeja de Android.
- **props:** `tamano` · `color`
- 🔴 **NO es lo que Android monta** — eso es `assets/marca/nariz-notificacion.svg`, y **comparten el mismo `d`**. Esta pieza existe para poder VERLA y gatearla. *Si alguien toca una y no la otra, el founder firma una silueta y la bandeja muestra otra.*

---

## ②bis EL MAPEO OFICIO → GLIFO

```tsx
import { glifoDeOficio, esOficio, type Oficio } from '@epetplace/ui'
<Icono nombre={glifoDeOficio('adiestramiento')} />   // → 'training'
```

🔴 **Vive en UN solo lugar y por eso existe.** El censo midió que hoy cada superficie escribe el nombre a mano —`explorar/index.tsx` los monta uno por uno, `paseo/index.tsx` repite el suyo **cuatro veces**— y que **`reserva-piezas.tsx:171` monta `<Icono nombre={oficio}>`**, o sea deriva el nombre del glifo del nombre del oficio. *Funciona hoy porque coinciden; el día que un oficio se llame distinto, pinta otro.* Caso vivo que lo prueba: `historico.tsx:599` tiene escrito a mano `o === 'adiestramiento' ? 'training' : o`.

⚠️ **`Oficio` se DERIVA de `FilaCitaOficio`, no se duplica** — ya había **cinco** tipos de oficio conviviendo y el sexto iba a ser éste. Es más ancho a propósito (Explorar muestra servicios que no se agendan) pero nace de él: **agregar un oficio agendable hace que el mapa deje de compilar hasta darle su glifo.** Probado.

⚠️ **La jeringa NO está en el mapa:** `vacuna` es un acto clínico, no un oficio. *Lo que impide que se use de genérica es exactamente su ausencia acá.*

---

## ③ LOS TOKENS — de dónde sale cada valor

| token | qué gobierna |
|---|---|
| `palette` | los 16 valores de la letra §2 · `tintaTexto65` es el secundario (el rango 50–58 **no llega a AA**, medido por `R12`) |
| `medidas` | las 22 medidas por objeto. **Viven aparte de `spacing` porque NO son múltiplos de 4** — 26, 70, 22, 17, 58, 52, 74, 78, 66 |
| `spacing` | la escala de RITMO, base 4, múltiplos estrictos |
| `typography` | `escala` trae la v5 (Baloo + PJS); `family` conserva DM Sans **como token del PRESTADOR** |
| `radius` · `shadows` · `elevacion` | radios, sombras por `elevation` (**nunca CSS**) y el halo. ⚠️ **`halo.presencia(color)` RECIBE su color** — el token conserva la geometría (4 px) y la dosis (10 %) y nada más: `formaV5` es `true` en el tema claro **y en el oscuro**, y un color horneado miente en una de las dos casas sin fallar |
| **`border.campoV5`** | **el borde del campo en REPOSO, en ciruela tenue** (`#9A76A4` = ciruela 55 % sobre lienzo). ⚠️ **«Tenue» tiene piso: 3:1 (WCAG 1.4.11, lo vigila `R43`)** — ciruela al 25 % da **1,82** y *deja de existir para quien no distingue tonos bajos*. El token elegido **mejora al gris que reemplaza en las tres superficies** (3,82 / 3,46 / 3,53 contra 3,68 / 3,33 / 3,41). Sólo v5; el prestador conserva su gris |
| **`COLUMNA_ASISTENTE`** | **el ancho que el asistente ocupa desde el borde derecho** (margen + disco + halo + respiro = 112). Nace porque `AIRE_RAIZ` es un `paddingBottom` y **el asistente flota sobre el scroll**: cualquier cosa pegada al borde derecho pasa por su esquina *en algún punto del recorrido*. *Ningún padding inferior protege a algo que viaja* ⇒ la pastilla de `CitaEnVivo` se corrió a la izquierda |
| **`motion.v5.asistenteHaloEscala` · `…Opacidad`** | cuánto crece y cuánto se ve el halo del asistente. ⏪ eran 1,3 y 0,35 y el founder midió *«casi no se nota»*: sobre un disco de 52 el halo asomaba **7,8 px**. Hoy 1,6 y 0,55 ⇒ **15,6 px**. *El ritmo no cambió: sólo cuánto aire mueve* |
| **`Cabecera carrito`** | 🔴 **El carrito vuelve al slot derecho de las cinco tabs** (lote 10 · revierte `D-1108`). **Se dibuja SÓLO en `variante="raiz"`**, y ésa es la mitad que importa: las pantallas de checkout —carrito, pago, confirmación— son EMPUJADAS, así que *la regla «ahí no se muestra» no se recuerda: se cumple sola*. Una de ellas que pase `carrito` no lo dibuja aunque quiera. ⚠️ Ocupa el mismo slot que `accionDerecha` — «un lugar para UN botón» |
| **`ISOTIPO_V5_PATH` · `ISOTIPO_V5_CAJA`** | **SÓLO PARA LOS PDF** (`D-1107`). 🔴 **NO va en pantalla, y lo firmó el founder tras rechazarlo** (lote 10): es una **silueta de un solo color** —buena para un papel de un tinte— y **no es la marca que la gente reconoce**, que tiene su magenta y su contorno. *Que un dibujo sea el correcto para imprimir no lo vuelve el correcto para mirar.* En pantalla, donde haga falta la nariz va **`IsotipoV5`**, que monta el asset del ilustrador tal cual. No es pieza: el consumidor es una edge de Deno. ⚠️ Va con **su viewBox (cuadrado, 1254) Y la caja medida del contenido** — *un viewBox no dice dónde está el dibujo, dice cuál es el papel*. Aspecto **1,685**, contra 1,456 del viejo: quien reemplace conservando el alto necesita **~16 % más de ancho** |
| **`accent.glifo` · `accent.glifoBg`** | **el par del glifo, y son DOS slots porque se miden juntos.** Ciruela sobre `ciruelaTinte` en el cliente; el prestador conserva su teal. Se monta con `registro="glifo"` en `Icono` — **nunca pasando el color**, que es lo que deja la decisión sin lista de dónde se escribió. **El foco del campo toma el mismo slot bajo v5**: es la misma decisión (el acento NO accionable), y el acoplamiento está declarado en `caja-de-campo.ts` |
| **`AIRE_RAIZ`** | **el aire que toda pantalla RAÍZ deja abajo** para que la última fila no quede debajo del asistente ni de la barra. Derivado; se le suma `insets.bottom` |
| `motion` | 180–240 ms sin rebote para lo que responde al toque; entrada escalonada 45/300 para lo que llega |

---

## ④ LA REGLA

> ## 🔴 Lo que no está acá no se dibuja en la pantalla; se pide por `docs/loop/buzon/` y nace en `packages/ui`.

**Sin excepción «por esta vez».** El porqué, del founder: *«cada componente que nace mal es doble trabajo»* — y la deuda visual no se paga nunca. Un color, una medida o una forma resueltos en `apps/` compilan perfecto, pasan el typecheck, **y dejan de resolverse por tema**: quedan iguales en oscuro y en memorial, que es la mitad del sistema apagada en silencio. Lo vigila `R4` del lint, y **frena de verdad**.

**Cómo se pide:** una nota en `docs/loop/buzon/` con *qué es · qué no es · sus estados · en qué pantalla se va a montar*. Si el pedido no dice dónde se monta, no es una pieza: es una idea.

**Mientras tanto, C monta lo que hay y lo declara.** *Una pantalla con una pieza aproximada y su pedido escrito es honesta; una con un hex inline es una deuda que nadie va a encontrar.*

---

## ⑤ CÓMO SE MANTIENE

### 🔴 LOS CONSUMIDORES NO SE ESCRIBEN ACÁ — SE PIDEN

```
node scripts/verify-catalogo-v5.mjs
```

El gate **los mide contra el árbol de hoy y los imprime**. Este documento ya no publica ninguno, y el gate **falla si alguna entrada vuelve a publicar un número, aunque ese día sea correcto**.

**Por qué, medido (`D-1114`, firma de la mesa 14-sep-2026):** el número **vencía en cada merge**, y no por descuido —

> **el número correcto no existía en ninguna de las dos ramas.** B es dueño del catálogo y C monta las piezas: **en la rama de B el gate está verde porque los consumidores de C no existen ahí, y en la de C el catálogo es el viejo.** *El desajuste nace en `main`, que es el único lugar donde nadie estaba mirando.*

Lo pagaba la conducción, curándolo a mano en territorio ajeno: **dos merges seguidos, 2 y 6 desajustes, en aumento** — *cuanto más monta C las piezas nuevas, más se mueve.*

**Es la TERCERA vez que esta casa cura esta clase de la misma manera:** el contador de piezas de `packages/ui` (publicaba **53 cuando eran 171**, con su nota «re-medido» al lado) y el de migraciones (**cuatro caídas: 9 → 77 → 138 → 186**). *Las dos veces la cura no fue corregirlo otra vez: fue sacarlo del documento y declarar el comando.*

⚠️ **Y una diferencia que conviene no perder:** este número **tenía gate**, así que no envejecía en silencio — se cobraba en el merge siguiente. *El daño nunca fue desinformar: era que una persona curara a mano lo que una máquina deriva.*


**Cada pieza que nace o muere actualiza este archivo EN EL MISMO COMMIT.** Lo mantiene **B**.

Y no depende de que B se acuerde: **`pnpm verify:catalogo-v5`** mide contra el objeto que cada pieza listada exista, esté exportada y **que su cuenta de consumidores sea la de hoy**. ⇒ *el número se desajusta solo cada vez que C monta una pieza, y el gate lo dice.*

⚠️ **Lo que el gate NO puede medir, declarado: si la descripción es cierta.** Ningún gate lee si una frase describe bien una pieza. **Eso lo sostiene quien escribe, y su verde no lo reemplaza.**
