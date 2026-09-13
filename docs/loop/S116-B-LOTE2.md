# S116-B · LOTE 2 — el shell y las piezas base

> **Rama `pista/s116-b-02` @ `b12a7fa0` · worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-b-02` · partí de `main` @ `79c8167bf7f5770ae77ce9fbc10aca7598346032` (`79c8167b`).**
> Medido el **13-sep-2026**. Un commit por pieza, pusheado. **18 commits.**
> ✅ **LOS DIECIOCHO PUNTOS ENTRAN.** El punto 18 —la tanda de glifos— cerró último, como el encargo ordenó, **y su hoja de contacto está adjunta y RASTERIZADA** (`docs/loop/capturas-s116-b/`).
> ⚠️ **Lo que NO está y se declara arriba: ningún gate por ícono del founder corrió, ninguna pieza nueva está montada en pantalla (eso es de C, lote 3), y la barra de tabs conserva su 66/9 con la letra enmendada.** Detalle en §④.

---

## ① LA TABLA DE LAS 18 PIEZAS

| # | pieza | contrato | reemplaza a | consumidores | evidencia |
|:-:|---|---|---|--:|---|
| 1 | **`Cabecera`** | `variante · antetitulo · titulo · apoyo · accionDerecha · pasos · onVolver` | **`Encabezado`, pero NO todavía** | 0 (nace) | galería · monta C |
| 2 | **`BarraTabs`** | *conserva* · gana `onRepetir` y **`onMontaje`** | — | 5 | ⚖️ §⑦ · **la letra se enmendó, no la pieza** |
| 3 | **`BotonAsistente`** | `onPress · visible · etiqueta` | **nadie** | 0 (nace) | galería · monta C |
| 4 | **`Boton`** | *conserva* | — | **236** | ✅ captura montada |
| 5 | **`Campo`** (vía `caja-de-campo`) | *conserva* | — | **81** + `CampoFecha` + `CampoCodigo` | ✅ captura montada |
| 6 | **`Chip`** (`SelectorOpcion` · `FiltroPills`) | *conserva* · gana `chipLleno` | — | **79** + **25** | ✅ captura montada · §⑪ |
| 7 | **`Opcion`** | `opciones[] · elegida · onElegir · agregar` | **nadie** | 0 (nace) | galería · monta C |
| 8 | **`Tarjeta`** | *conserva* · `tinte` gana `plana` y `destacada` | — | **139** | ✅ captura montada |
| 9 | **`FilaLista`** (`CeldaNavegacion` · `Celda`) | *conserva* · glifo en círculo rosa | — | **66** + **115** | ✅ captura montada |
| 10 | **`Estado`** (`Insignia`) | *sin cambio* — ver §③ | — | 46 | ✅ captura montada |
| 11 | **`Confirmacion`** | `titulo · apoyo · lineaExtra · primaria · secundaria` | **nadie** | 0 (nace) | galería · monta C |
| 12 | **`Personaje`** + `TrioPersonajes` | `especie · tamano · elegido · fondo` | **nadie** | 0 (nace) | galería · monta C |
| 13 | **`IsotipoV5` · `LogoV5`** | `sobre · tamano` | **`Isotipo`, pero NO todavía** | 0 (nace) | galería · monta C |
| 14 | **`EsperaDeMarca`** | *conserva* · la nariz por slot | — | 8 | galería |
| 15 | **`AvatarMascota`** | *conserva* · cobra la prop `especie` | — | 35 | galería |
| 16 | **`BadgeFecha`** · **`BarraPasos`** | `mes · dia` · `total · actual · etiqueta` | **nadie** | 0 (nacen) | galería · monta C |
| 17 | **`StepperCantidad`** | *conserva* · «+» círculo magenta lleno | — | **15** | ✅ captura montada |
| 18 | **los glifos** | 20 entradas nuevas + 14 alias + la silueta de notificación | — | 0 (nacen) | 🖼️ **§⑫ · hoja de contacto adjunta** |

**Las nueve nuevas quedan ENTREGADAS y no montadas** — las monta C en el lote 3, como el encargo indica. **Las nueve que conservan contrato sí están montadas, y por eso son las que se capturan.**

### Dos piezas de apoyo que el lote obligó

- **`Texto`** gana el color **`inverso`** y la variante **`antetitulo`**. El color no lo prohíbe `R58` —esa regla veta los miembros que empiezan con `accent`, el color que marca IMPORTANCIA— y esto es el par legible de `primary` cuando el fondo se da vuelta. La variante sale **entera** de `typography.escala.antetitulo`.
- **`elevacion.halo.foco`** nace como token **porque `R4` lo exigió**, y la regla tenía razón: yo había escrito el halo como `boxShadow` literal en dos piezas y dos strings son dos halos que divergen.

---

## ② LAS TRES FIRMAS DE LA MESA — ejecutadas

| firma | qué se hizo | evidencia |
|---|---|---|
| **la barra queda en 66/9 — la letra se enmienda, no la pieza** | `LETRA_REDISENO_S116.md` §2 enmendada con su porqué medido. **La pieza no se tocó.** | §⑦ |
| **`usePresionado` respeta `useReducedMotion`, con un test que produzca su rojo** | `const sinTransicion = esMemorial \|\| prefiereMenosMovimiento`, **y la escala queda FUERA del condicional** | `scripts/verify-reduced-motion.mjs` · **los cuatro sabotajes dan rojos DISTINTOS** |
| **el magenta sigue en `#D10788` hasta el recorrido del founder** | sin cambio. La captura comparativa contra el arte está en §⑨ | `magenta-interfaz-vs-arte.png` |

🔴 **EL CUARTO SABOTAJE ES EL QUE VALE, y no estaba en el pedido: «sobre-curar».** Mover la escala ADENTRO del condicional también da rojo. *Reducir movimiento es «sin interpolación», no «sin respuesta al toque» — un botón que no se hunde al tocarlo no es accesible, es un botón roto.* El gate mide las dos direcciones porque **la cura equivocada también se ve como cumplimiento**.

## ③ EL DÉCIMO SLOT — `accent.formaV5`

**El problema que lo obliga:** la letra §5 deja al **prestador sin cambios**, pero `Boton`, `Tarjeta` y `Campo` los montan **las dos apps**. Rediseñarlos en su archivo —que es lo que el lote pide, justamente para no tocar a sus 456 consumidores— le habría cambiado la forma al prestador **en silencio**. El COLOR ya se resolvía por casa desde S63; lo que no estaba separado era la **geometría**.

⇒ Un booleano por casa: **¿esta casa recibió la geometría del rediseño?** Cliente sí · prestador no · **memorial tampoco** (§4 apaga la fiesta).

🔴 **Nació llamándose `ctaPildora` y se renombró en el mismo lote**, al aparecer su segundo consumidor. *Un slot con el nombre de su primer caso obliga a abrir uno nuevo por cada pieza que se rediseñe, y cinco booleanos de casa que siempre valen lo mismo son un tema paralelo escrito de a poco.*

---

## ③bis LO QUE NO HIZO FALTA TOCAR, Y POR QUÉ CUENTA

**El punto 10 (`Estado`) ya estaba cumplido por los tokens del lote 1.** `Insignia` mapea `alDia→success`, `proximo→warning`, `info→info`, y esos tres slots del tema ya resuelven a **verde al día · ámbar pendiente · rosa informativo**. **La pieza no se tocó una línea.**

*Es el dividendo de que la pieza lea del tema y no escriba hex: el rediseño la alcanzó sola.* Se declara porque un punto del encargo sin commit se lee como un punto olvidado — y éste está hecho, por otra vía.

---

## ④ 🔴 LO QUE NO ALCANCÉ — y ninguno es una pieza que falte

**Los dieciocho puntos entran.** Lo que falta es de otra naturaleza y se lista entero, sin maquillar:

| lo que falta | por qué | de quién es |
|---|---|---|
| **El gate por ícono del founder** sobre los 20 glifos nuevos | §2.9 manda que los juzgue un ojo a 21 px. **La plancha está adjunta, rasterizada y lista** — lo que no puedo hacer es firmarla. | founder |
| **Montar las nueve piezas nuevas en pantalla** | el encargo lo dice: *«DELIVERED en este lote y MOUNTED by C en lote 3»* | C · lote 3 |
| **El vector drawable de la nariz y su cableado** | el SVG está entregado; convertirlo y apuntarlo en el plugin de `expo-notifications` toca `app.config.ts` y `android/`, que **no es mi territorio** | A o C |
| **La lectura de la barra de tabs 66 vs 74** | declarada y no resuelta — la letra ya está enmendada con el porqué medido, pero **la que pierde la decide la mesa** | mesa |
| **El glifo de HISTORIA CLÍNICA** | su disparo escrito es *«el próximo arco que toque los papeles o el registry de glifos»*, y **este lote tocó el registry**. 🔴 **Se declara que el disparo SONÓ y no se atendió**: el encargo listaba los 52 del mock y éste no está entre ellos. *Un disparo que suena y nadie anota vuelve a sonar dentro de diez sesiones.* | próximo arco de glifos |
| **`prime`/`primeCorona` y los 12 gates por ícono pendientes desde S82** | ahora que existe el rasterizador, **son corribles**: una línea del comando por glifo. No lo hice porque no estaba en el encargo. | próximo lote de B |

**Y una cosa que SÍ empecé y dejé a medias, dicha: los alias son 14, no 17.** El §② del lote 0 decía 17 y el objeto dice otra cosa (§⑬). De los 21 que existen con otro nombre, **3 son `Chevron` y 1 es `Huella`** —piezas, no entradas del registry— y **3 ganaron dibujo propio en esta tanda**. Quedan 14 y están los 14.

---

## ⑤ LO QUE SE VERIFICA — con números y exit

```
npx tsc --noEmit -p packages/ui        → EXIT 0
npx tsc --noEmit -p packages/api       → EXIT 0
npx tsc --noEmit -p apps/cliente       → EXIT 0
npx tsc --noEmit -p apps/prestador     → EXIT 0
node scripts/verify-diseno.mjs         → EXIT 0 · 81 reglas · 0 fallos
npx tsx scripts/verify-contrast.ts     → EXIT 0 · 450 pares · 0 fallos
node scripts/verify-reduced-motion.mjs → EXIT 0 · 5 controles · GATE NUEVO
```

🔴 **DOS REGLAS ME FRENARON EN ESTA TANDA Y LAS DOS TENÍAN RAZÓN — se
declara porque un gate que sólo se cita cuando da verde no está midiendo
nada.**
- **`R17`** cazó `NarizNotificacion` exportada sin entrada de galería
  (*«una exportación sin entrada de catálogo es una pieza que nadie sabe
  que existe»*). Ley 11 mecanizada, y la pieza entró a la galería con su
  sección de gate.
- **`R4`** cazó mi `backgroundColor: '#26062E'` en esa misma sección. **Y
  acá el caso era discutible y la regla ganó igual**: la bandeja de Android
  es oscura SIEMPRE, no por tema, así que el hex no iba a «apagarse en
  oscuro». Pero el valor igual sale del token (`palette.ciruelaNoche`), con
  su porqué escrito al lado. *Que un hex sea defendible no lo vuelve
  auditable.*

### 🔴 LA VERIFICACIÓN QUE EL TYPECHECK NO HACE — que los assets RESUELVAN

```
npx expo export --platform android --output-dir <dir>
# y contar por hash los assets de <dir>/metadata.json
```
**27 de 27 assets míos en el bundle · 11 `.ttf` en el manifest.**

*La primera corrida dio **18 de 27**, y eso también era correcto: los 9 de
`marca/` no estaban porque **ninguna pieza los requería todavía** — Metro
sólo empaqueta lo alcanzable desde el grafo. Entraron al existir `IsotipoV5`
y `LogoV5`. **Un asset en el repo no es un asset en la app.***

### Las capturas

`docs/loop/capturas-s116-b-lote2/piezas-v5-montadas.png` — **784K en total** (4 láminas) (precisión (d): a la resolución mínima que muestra lo que hay que ver).

**`Android Bundled … (3083 modules)` a las 13:54:55 del 13-sep**, con `Starting project at .../e-petplace-s116-b-02/apps/cliente`. *Son 12 módulos más que el lote 1 (3071): las piezas nuevas.* Emulador propio (`Pixel_10_Pro_XL`, puerto 5566, `adb -s` siempre); binario `com.epetplace.cliente` **1.0.7**.

La segunda captura cayó en la revisión del carnet **por accidente de navegación y resultó mejor evidencia**: muestra **cuatro piezas rediseñadas a la vez** — botón píldora magenta, botón terciario en rosa tinte, campo con radio 18 y tarjeta plana.

---

## ⑥ TRES HALLAZGOS QUE VALEN MÁS QUE SU CURA

**① `@3x` no es parte del nombre: es una instrucción al bundler.** Ingerí los assets del lote 1 como `perro@3x.png` y **Metro no los resolvió**: *«Unable to resolve "../../assets/personajes/perro@3x.png"»*. El sufijo `@nx` **es la densidad de pantalla**, así que Metro busca el archivo BASE y toma `@3x` como una variante; con sólo la variante, no encuentra nada. *El nombre parecía documentación —«esto está a 3×»— y era una orden.* Renombrados a nombre plano. **El lote 1 pasó typecheck, `verify:diseno` y `verify:contrast` con este defecto adentro: lo encontró el primer bundle.**

**② El typecheck de `packages/ui` NO alcanza para una pieza nueva — dos veces en el lote.** `ReturnType<typeof require>` compila en el paquete y resuelve a `unknown` bajo la config de `apps/prestador`; y `estiloPresionado` en el `style` de un `Pressable` compila en el paquete y rompe el `ViewStyle` de la app. **Las dos las cazó el gate del hook, que compila las apps.** *Un verde del paquete es un verde sobre un tsconfig que ningún usuario ejecuta.*

**③ `R4` y `R17` hicieron su trabajo sin que nadie las llamara.** R17 frenó las seis piezas nuevas hasta que entraron a la galería (Ley 11 mecanizada) y R4 me frenó el halo escrito a mano, que terminó siendo el token `halo.foco`. *Las dos reglas convirtieron un atajo mío en la pieza correcta.*

---

## ⑦ ⚖️ EL CHOQUE DE LA BARRA DE TABS — declarado, no resuelto

La letra §2 dice *«activo círculo 74 con borde 5 del lienzo, −14»*. La barra mide **disco 66 · anillo 9 · alto 85**, y **no se tocaron**:

1. **El anillo ya cumple lo que la letra pide, y mejor.** No hay borde pintado: el hueco es **ausencia de material** (`fillRule="evenodd"`), así que lo que se ve es el fondo **real** de la pantalla, *sea cual sea*. Pintarlo del lienzo mentiría sobre cualquier otro fondo.
2. **El 9 es firma del founder**, con su pedido literal en la pieza, y la propia cabecera lo declara *«la única palanca real»* de una geometría donde el valle, el hombro y el clamp **se derivan de él**. Cambiarlo no mueve un borde: recalcula el dibujo que pasó su gate en S99/S100.

*Cambiar un dibujo calibrado con gate por un número de una letra que no sabía que ese gate existió es el error que esta casa ya documentó tres veces — el magenta de S83, la plata de S88, la telemedicina de S113.*

✅ **RESUELTO POR FIRMA DE LA MESA (13-sep): la barra queda en 66/9 y LA LETRA SE ENMIENDA, no la pieza.** `LETRA_REDISENO_S116.md` §2 lleva la enmienda con su porqué medido. ⚠️ **Y se enmienda ACÁ, en la letra, y no sólo en este parte** — mismo precedente que el magenta de S83 y la plata de S88: *dos letras firmadas que se contradicen son peores que una equivocada, porque cualquiera cita la que le conviene y está «en regla».*

**Lo que sí entró de v5 en la barra:** el disco ya es magenta (lo resuelve `accent.activoLleno` desde el lote 1) y el enganche `onMontaje`.

---

## ⑧ VTRACER — el veredicto es NO, y su porqué es el hallazgo

`docs/loop/capturas-s116-b-lote2/vtracer-vs-png.png` · vtracer 0.6.12, modo spline, cuantizado a los diez hex del ilustrador.

| | resultado a 78 y 52 px |
|---|---|
| **perro** | ✓ casi idéntico |
| **gato** | 🔴 **las patas salen negras** (eran blancas) |
| **conejo** | 🔴 **manchas verde oscuro** en la cara |

🔴 **La causa: la paleta de 10 del ilustrador es la del DISEÑO DE LA APP, no la de los personajes.** Medido — **cero grises medios** entre los diez (ninguno con `S<.15` y `.25<L<.75`), así que el gris del conejo cae al **verde `#14584A`** y el blanco sombreado del gato a la tinta. *Es la prueba concreta de la precisión 1: las caras son **arte**, no tokens.*
⇒ **Los tres se quedan en PNG. No hay puente.**

**Y un dato para quien use VTracer acá: no emite `viewBox`**, sólo `width`/`height`, así que su SVG **no escala — se recorta**. Mi primer rasterizado salió en blanco por eso.

---

## ⑨ EL MAGENTA AL LADO DEL ARTE

`docs/loop/capturas-s116-b-lote2/magenta-interfaz-vs-arte.png` — tamaño real, tema claro.

| rol | hex |
|---|---|
| interfaz · CTA | **`#D10788`** |
| arte · magenta vivo | `#EC0F7C` |
| arte · magenta medio | `#B80B60` |
| arte · magenta oscuro | `#8E1149` |

**Mi lectura, que es un dato y no un veredicto: conviven, pero la diferencia se ve cuando están cerca.** El CTA lee más profundo y el del ilustrador más vivo. En el caso real —CTA bajo una tarjeta con la cara— funciona porque están separados; enfrentados como muestras, la diferencia es clara. **La mesa juzga.**

---

## ⑩ LA CRÍTICA DE IMPECCABLE

⚠️ **Ya estaba instalada desde S43-B0** — `.claude/skills/impeccable` es un **symlink** a `.agents/skills/impeccable`, trackeado desde el scaffold del monorepo. `skills add` lo **reemplazó por una copia real y rompió el symlink**; se restauró (`git checkout --`) y queda sólo la actualización de `skills-lock.json`, que registra la versión que el instalador trajo. *Un «instalá X» sobre un repo que ya tiene X no falla: lo duplica en silencio, y el `D` de git fue lo único que lo dijo.*

🔴 **No se le dejó generar `PRODUCT.md` ni `DESIGN.md`**: su flujo de `init` los escribe en el repo, y es **segunda opinión, no dueña del repo**. Se aplicó su criterio a mano.

**Lo que señaló sin chocar — CURADO:** *«placeholder needs the same 4.5:1, not the muted-gray default»*. Medido: el placeholder usaba `text.tertiary` = **3.28:1**. **Un placeholder no es decoración: es lo que la persona lee para saber qué escribir.** Pasa a `secondary` (**5.24**), en `Campo` y `BarraEscribir`. El token `tertiary` **no se toca** —sigue siendo placeholder-y-decorativo por doctrina, con 28 lectores—; lo que cambia es que un placeholder deja de contar como decorativo. *La casa ya había resuelto este mismo caso igual en S114.*

**Lo que contradice a la letra — IGNORADO Y ANOTADO:**
- *«Tiny uppercase tracked eyebrow»* como ban absoluto ⇒ **la letra §2 firma el antetítulo** en mayúsculas con tracking 2. Y la distinción ya estaba escrita en el código **antes** de esta crítica: el eyebrow que S52 mató era estructura **decorativa** (Ley 18); éste codifica una verdad del contenido y lleva color semántico.
- *«Glassmorphism as default»* contra el disco de la `Cabecera` ⇒ la letra pide textual *«un botón redondo translúcido»*. Y **no es glass**: no hay blur ni `backdrop-filter`, es un fill al 16 %.

**Lo que señaló y quedó pendiente al escribir la primera versión de este parte — HOY CURADO Y CON GATE PROPIO:** *«`usePresionado` respeta memorial pero no mira `useReducedMotion`»*. **La mesa lo firmó con su test** y entró en `0ed06575`.

🔴 **Y la construcción encontró lo que la crítica no dijo: la cura obvia también está mal.** Mover la escala adentro del condicional —o sea, «sin movimiento reducido ⇒ sin hundimiento»— es sobre-curar: *reducir movimiento es «sin interpolación», no «sin respuesta al toque». Un botón que no se hunde al tocarlo no es accesible: es un botón roto.* Por eso el gate mide **las dos direcciones**, y su cuarto sabotaje es justamente ése.

*Es el mejor caso de la crítica en todo el lote: señaló un hueco verdadero que ningún gate de la casa veía, y el valor terminó estando en cómo se curó — que es la parte que ella no podía aportar.*

---

## ⑪ EL CHIP CON LA PATA — y el defecto que introduje yo

**La pata YA ESTABA MONTADA desde S91.** `SelectorOpcion` monta
`MarcaEleccion` al elegir, con la física S62 (la huella que pisa y la
superficie que cede). *El punto 6 no pedía construirla: pedía verificar que
sobreviviera al rediseño — y no sobrevivió por mi culpa.*

🔴 **MI PROPIO COMMIT LA VOLVIÓ INVISIBLE.** Al darle al chip elegido el
relleno `chipLleno` (ciruela), la pata quedó pintada de `accent.control`
—**la misma ciruela**— sobre ese fondo. Cero contraste. **El typecheck,
`verify:diseno` y `verify:contrast` los tres en verde**, porque ninguno
mide una pieza contra el fondo que otra pieza le pone debajo.
⇒ Curado: sobre el chip lleno la pata pasa a `rosaSobreCiruela`.

*Es exactamente la clase que esta casa persigue: no falló nada, se dejó de
ver algo. Y lo que la destapó no fue una regla — fue mirar la captura.*

---

## ⑫ LA TANDA DE GLIFOS (punto 18) — y su hoja de contacto

### 🔴 EL HALLAZGO QUE CAMBIÓ LA TANDA ENTERA

Mi parte del lote 0 cerró su §② diciendo *«no rastericé ninguno … en este
entorno no hay rasterizador de SVG»*, y de ahí colgaba que **ningún gate
por ícono a 21 px había corrido nunca** — trece glifos vivos con su gate
declarado pendiente, alguno desde S82.

**`qlmanage` de macOS rasteriza SVG. Estaba instalado todo el tiempo.**

*La afirmación no era mentira: era una ausencia no medida, y se leyó igual
que una imposibilidad. Nadie la iba a verificar porque venía escrita como
un hecho del entorno.* Nace **`scripts/hoja-de-contacto-glifos.mjs`**:
traduce los dibujantes JSX del registry a SVG plano, los rasteriza a
**21 · 48 · 96 px** y arma la plancha que §6b pide. **Declara su límite**:
entiende `Path`, `Circle`, `Rect`, `G rotation` y `Huella`, y **reporta por
nombre lo que no puede dibujar en vez de omitirlo** — *un glifo que falta
en la plancha tiene que verse; uno que se dibuja mal se firma.*

### Lo que entró

**20 entradas nuevas** = 15 que el §② midió como inexistentes + 3 que
nacieron porque el dibujo decía otra cosa (`quitar` · `contrasena` ·
`medicamento`) + 2 redibujos (`receta` · `personalidad`).
**14 alias** (§⑬). **La silueta de notificación**, que no es del registry.

### 🔴 LA HOJA COBRÓ CUATRO VECES — y ése es todo su valor

| glifo | qué mostró la medición | cura |
|---|---|---|
| **`urgencias`** | a 21 px la huella externa **se pegaba al maletín y se leía como suciedad** | **sin huella**, y el maletín ocupa la grilla entera. Ley 9 en su forma afilada: *sobrevive o es ruido* |
| **`microchip`** | doce trazos en 21 px de lado = **una mancha** | murieron las cuatro patas verticales. **La huella se quedó**: sin ella es un componente electrónico, no la identidad de ella |
| **`receta`** | **dos veces.** Primero la cápsula se cerraba y se leía como una línea. Después, **montado al lado de `papel` como §6b manda, seguían siendo el mismo rectángulo con la misma huella en la misma esquina** | la cura NO fue agrandar la cápsula otra vez: **fue sacarla de la hoja** para que cambie la SILUETA |
| **la nariz** | **era otra forma.** La dibujé de memoria como *dos lóbulos con hueco* —un corazón agujereado— y contra el isotipo real quedó claro que el isotipo es **un anillo abierto abajo con dos volutas colgando de su borde interno** | re-dibujada. Tres radios de voluta probados a 24/48/96; ganó 3.3 |

🔴 **LA LECCIÓN DE LAS CUATRO ES UNA SOLA, y la escribo porque me la
cobré yo: los cuatro dibujos eran PLAUSIBLES.** Compilaban, pasaban los
tres gates, y se veían limpios de a uno. **El único que los frenó fue
verlos al tamaño real y al lado de su vecino** — que es literalmente lo que
§6b pide desde que se escribió, y lo que nadie podía entregar.
*Y el más caro es el de `receta`: por separado los dos se leían bien. Sólo
montados juntos se vio que eran el mismo glifo.*

**Corolario que vale para el próximo que dibuje:** *dos glifos que se
distinguen por su INTERIOR se confunden al achicarse; dos que se distinguen
por su CONTORNO, no.* La silueta es lo único que sobrevive a 21 px.

### La estrella, que la resolvió una nota de hace tres sesiones

**La entrada vieja de `personalidad` dejó escrita su propia regla de
desempate:** *«el día que exista un favorito, esto se revisa antes que
aquello, porque llegó primero y va a parecer que califica»*. El mock pide
Favorito **y** Calificación ⇒ ese día llegó, y la letra §1.9 lo firma.
**La estrella se muda a `calificacion` BYTE A BYTE** — su geometría estaba
MEDIDA (`r/R = 0.5`, resuelto por los 21 px: la estrella clásica abre 36° y
a 2 px de la punta mide 1,30 px, **menos que el trazo que la dibuja**).
Re-dibujarla habría tirado esa medición. `personalidad` recibe **la
pelota**, con su choque contra `ayuda` declarado y **medido en la plancha
de vecinos: no se materializó.**

### Los diez choques declarados, medidos uno por uno

`docs/loop/capturas-s116-b/hoja-vecinos.png` monta cada glifo nuevo junto al
vecino contra el que se midió. **Nueve no se materializaron. Uno sí**
(`receta` vs `papel`) y está curado arriba. *Declarar diez y que nueve no
pasen nada no es haber exagerado: es que los nueve se dibujaron esquivando
al vecino, que es para lo que sirve el censo.*

---

## ⑬ 🔴 UNA CORRECCIÓN A MI PROPIA MEDICIÓN — la más incómoda del lote

El §② del lote 0 declaró **tres casos** donde *«el dibujo dice otra cosa»*.
**Uno era falso, y lo era por el método con el que lo medí.**

**`papelera`.** Leí su nombre, leí su comentario (*«el `−` del stepper con
cantidad 1»*), lo crucé contra el dibujo (un TACHO) y concluí que no
coincidían. **Al abrir el CONSUMIDOR, coinciden perfectamente:**
`StepperCantidad:592` lo monta con `signo={onBorrar !== undefined && v <=
min ? 'papelera' : 'menos'}` — o sea **sólo cuando bajar de 1 saca el ítem
de la lista** — y el propio Stepper lo dice dos veces en sus comentarios:
*«en la GRILLA no: ahí bajar de 1 devuelve la tarjeta a su `+`, el tile no
desaparece, y una papelera prometería un borrado que no ocurre»*.
⇒ **El tacho dice ELIMINAR y ahí se elimina de verdad. El que decía de
menos era el comentario, que omitía el `onBorrar`.** Corregido en su
entrada; el dibujo no se tocó.

*Leí el nombre y el comentario y no el consumidor — que es exactamente la
clase que esta casa persigue, cobrada por quien la estaba aplicando a los
otros dos casos.* **El glifo `quitar` (el `−`) nace igual y sirve**: el
Stepper dibuja su `+` y su `−` a mano, fuera del registry (`D-546` otra
vez), y ahora tienen dueño.

### Y el conteo del §② también se corrige, contra el objeto

| | el parte del lote 0 decía | el objeto dice |
|---|--:|--:|
| existen con su nombre | 14 | **14** ✓ |
| existen con otro nombre | 17 | **19** (+2 de control = 21 marcados `↔`) |
| no existen | 17 | **15** |
| nombre y dibujo apuntan distinto | — | **1** (`receta`) |

*Sumaban 52 de las dos formas, y por eso nadie iba a mirarlo. El total
cierra en las dos: lo que estaba mal era el reparto.* **El encargo pedía
«17 nuevos y 17 alias» porque venía de mi número.** Entran **20 dibujos y
14 alias**, que es lo que el objeto pide.

---

## ⑭ LOS ALIAS — con su choque contra letra escrita, declarado

El mock nombra 52 glifos; la casa dibuja 72 con otros nombres. Los alias
existen para que **C consuma los nombres del mock sin traducir a mano en
cada pantalla**, y para que cuando traduzca mal, **el compilador lo frene**
(probado: un alias que apunte a un dibujo inexistente rompe el typecheck).

🔴 **ESTO CHOCA CONTRA LETRA ESCRITA EN EL PROPIO ARCHIVO.** La lápida del
rename `coach` → `ia` (S84-B11) dice: *«NO SE HIZO ALIAS Y ES LA DECISIÓN:
dos nombres para un dibujo es no decidir cuál es el correcto, y deja al
siguiente eligiendo»*.

**Por qué esto no es ese caso, y la diferencia es medible:** en
`coach`/`ia` los dos nombres nombraban **conceptos distintos** —uno una
pantalla, otro la marca de la IA— y quedarse con los dos era efectivamente
no decidir. Acá los pares nombran **la misma cosa por su forma y por su
función**: `lupa` es el objeto, «Buscar» es el acto que ese objeto hace.
*Ningún par de éstos puede llevar a alguien a montar el glifo equivocado,
que es el daño que aquella lápida evitaba.*

**Y la forma es la que sostiene la diferencia: `ALIAS` NO es un dibujante.**
El registry sigue con **una entrada por dibujo**; esto es una tabla de
traducción que se resuelve antes de dibujar. *No hay dos funciones que
puedan divergir; hay un nombre que apunta a otro.* **Lo que la lápida
prohíbe es duplicar el DIBUJO, y esto no lo duplica.**

**Los 7 que NO entran como alias, con su razón:** `Volver`/`Avanzar`/
`Flecha` son **`Chevron`**, otra pieza con su propia tabla de direcciones ·
`Mascota` es **`Huella`**, la primitiva que todos montan adentro — un alias
que la devuelva sola sería un dibujo nuevo disfrazado · y `Quitar`,
`Contraseña` y `Medicamento` **ganaron dibujo propio** porque el que tenían
decía otra cosa.

---

## ⑮ LA SILUETA DE NOTIFICACIÓN — dibujada, no recortada

`docs/loop/capturas-s116-b/nariz-notificacion.png` — **a 24 y a 48 px
reales, sobre ciruela noche, con el isotipo REAL al lado a los mismos
tamaños.**

**Por qué se dibuja y no se recorta, y es una medición del lote 1:** la
silueta blanca del isotipo **no se lee a 24 px** — sus dos volutas, que son
lo único que la distingue de una mancha, tienen huecos que miden ~4,5 % del
alto del viewBox y **se cierran a esa escala**. *Recortar el isotipo habría
entregado un borrón que igual pasaba cualquier gate de código.*

**Qué conserva:** el anillo abierto abajo (pared ~3 px a 24) y las dos
volutas **vueltas sólidas y asomando** del borde superior interno.
**Qué pierde, dicho:** el hueco de cada voluta. A 24 px se cierra solo.

⚠️ **RIESGO DECLARADO, y la medición lo cambió de lo que yo creía: a 24 px
se lee como una CARA** (dos ojos en un óvalo). **No es culpa del recorte —
el isotipo real rasterizado se lee igual**, porque sus volutas ocupan el
lugar donde el ojo espera ojos. *El riesgo es de la marca, no de la
simplificación, y por eso no se cura acá: se declara.*

⚠️ **Y una advertencia operativa: el SVG y la pieza comparten el mismo
`d`.** Si alguien toca uno y no el otro, **el founder firma una silueta y
la bandeja muestra otra**. Lo que viaja al aparato es
`packages/ui/assets/marca/nariz-notificacion.svg`; la pieza
`NarizNotificacion` existe para poder VERLA y gatearla dentro del producto.

---

## ⑯ PESO DE EVIDENCIA

| archivo | qué prueba | peso |
|---|---|--:|
| `capturas-s116-b-lote2/piezas-v5-montadas.png` | 4 láminas · las nueve piezas con contrato conservado, montadas en la app real | **784 K** |
| `capturas-s116-b/hoja-de-contacto.png` | los 20 glifos a 21 · 48 px | **61 K** |
| `capturas-s116-b/hoja-vecinos.png` | los diez choques declarados, cada uno al lado de su vecino | **59 K** |
| `capturas-s116-b/nariz-notificacion.png` | la silueta a 24 y 48 contra el isotipo real | **34 K** |
| `capturas-s116-b-lote2/vtracer-vs-png.png` | el veredicto NO de VTracer | §⑧ |
| `capturas-s116-b-lote2/magenta-interfaz-vs-arte.png` | el `#D10788` contra los cuatro magentas del ilustrador | §⑨ |

**≈ 1,0 MB en total**, a la resolución mínima que muestra lo que hay que
ver (precisión (d) del encargo).

**El bundle que produjo las capturas montadas:** `Android Bundled … (3083
modules)` a las 13:54:55 del 13-sep, con `Starting project at
.../e-petplace-s116-b-02/apps/cliente`. Emulador propio (`Pixel_10_Pro_XL`,
puerto 5566, `adb -s` siempre); binario `com.epetplace.cliente` **1.0.7**.
*Son 12 módulos más que el lote 1 (3071): las piezas nuevas.*

🔴 **LO QUE ESA EVIDENCIA NO PRUEBA, dicho:** las nueve piezas nuevas
**no tienen captura montada porque no tienen consumidor** — su evidencia es
la galería, y la galería la mira el founder, no yo. **Y ninguna de las tres
planchas de glifos es un gate**: son el instrumento que hace posible el
gate, que sigue siendo el pulgar del founder a 21 px.
