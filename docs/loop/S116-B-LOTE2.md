# S116-B · LOTE 2 — el shell y las piezas base

> **Worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-b-02` · rama `pista/s116-b-02` · partí de `main` @ `79c8167bf7f5770ae77ce9fbc10aca7598346032` (`79c8167b`), que ya trae el 65 % firmado y mi lote 1 mergeado.**
> Medido el **13-sep-2026**. Un commit por pieza, pusheado.
> **🔴 EL LOTE NO ESTÁ COMPLETO — trece de los dieciocho puntos.** Los cinco que faltan (`Chip`, `FilaLista`, `Confirmacion`, `Stepper`, y **los glifos, que son un lote propio**) no se empezaron y están en §④ con lo que cada uno necesita. *Se declara arriba y no al final, porque un parte que esconde el alcance al final se lee como si estuviera entero.*

---

## ① LA TABLA DE PIEZAS

| pieza | punto | contrato | reemplaza a | consumidores hoy | captura |
|---|:-:|---|---|--:|---|
| **`Boton`** | 4 | *conserva* (+ nada nuevo) | — | **236** | ✅ montada |
| **`Tarjeta`** | 8 | *conserva* · `tinte` gana `plana` y `destacada` | — | **139** | ✅ montada |
| **`Campo`** (vía `caja-de-campo`) | 5a | *conserva* | — | **81** + `CampoFecha` + `CampoCodigo` | ✅ montada |
| **`Insignia`** | 10 | *sin cambio* — ver §③ | — | 46 | ✅ montada |
| **`Personaje`** + `TrioPersonajes` | 12 | `especie · tamano · elegido · fondo` | **nadie** | 0 (nace) | galería · lote 3 |
| **`Cabecera`** | 1 | `variante · antetitulo · titulo · apoyo · accionDerecha · pasos · onVolver` | **`Encabezado`, pero NO todavía** | 0 (nace) | galería · lote 3 |
| **`Opcion`** | 7 | `opciones[] · elegida · onElegir · agregar` | **nadie** | 0 (nace) | galería · lote 3 |
| **`BotonAsistente`** | 3 | `onPress · visible · etiqueta` | **nadie** | 0 (nace) | galería · lote 3 |
| **`BadgeFecha`** | 16 | `mes · dia` | **nadie** | 0 (nace) | galería · lote 3 |
| **`BarraPasos`** | 16 | `total · actual · etiqueta` | **nadie** | 0 (nace) | galería · lote 3 |
| **`BarraTabs`** | 2 | *conserva* · gana `onRepetir` y **`onMontaje`** | — | 5 | ⚖️ ver §⑦ |
| **`IsotipoV5` · `LogoV5`** | 13 | `sobre · tamano` | **`Isotipo`, pero NO todavía** | 0 (nace) | galería · lote 3 |
| **`EsperaDeMarca`** | 14 | *conserva* · la nariz por slot | — | 8 | galería · lote 3 |
| **`AvatarMascota`** | 15 | *conserva* · cobra la prop `especie` | — | 35 | galería · lote 3 |

**Las seis nuevas quedan ENTREGADAS y no montadas** — las monta C en el lote 3, como el encargo indica. Las cuatro que conservan contrato **sí** están montadas y por eso se capturan.

### Dos piezas de apoyo que el lote obligó

- **`Texto`** gana el color **`inverso`** y la variante **`antetitulo`**. El color no lo prohíbe `R58` —esa regla veta los miembros que empiezan con `accent`, el color que marca IMPORTANCIA— y esto es el par legible de `primary` cuando el fondo se da vuelta. La variante sale **entera** de `typography.escala.antetitulo`: familia, tamaño, interlínea, tracking 2 y mayúsculas.
- **`elevacion.halo.foco`** nace como token **porque `R4` lo exigió**, y la regla tenía razón: yo había escrito el halo como `boxShadow` literal en dos piezas y dos strings son dos halos que divergen. **No entra en `elevacion`**: eso es APOYO y esto es PRESENCIA — confundirlos era el defecto que el foco del campo tenía antes de este lote.

---

## ② EL DÉCIMO SLOT — `accent.formaV5`

**El problema que lo obliga:** la letra §5 deja al **prestador sin cambios**, pero `Boton`, `Tarjeta` y `Campo` los montan **las dos apps**. Rediseñarlos en su archivo —que es lo que el lote pide, justamente para no tocar a sus 456 consumidores— le habría cambiado la forma al prestador **en silencio**. El COLOR ya se resolvía por casa desde S63; lo que no estaba separado era la **geometría**.

⇒ Un booleano por casa: **¿esta casa recibió la geometría del rediseño?** Cliente sí · prestador no · **memorial tampoco** (§4 apaga la fiesta).

🔴 **Nació llamándose `ctaPildora` y se renombró en el mismo lote**, al aparecer su segundo consumidor. *Un slot con el nombre de su primer caso obliga a abrir uno nuevo por cada pieza que se rediseñe, y cinco booleanos de casa que siempre valen lo mismo son un tema paralelo escrito de a poco.*

---

## ③ LO QUE NO HIZO FALTA TOCAR, Y POR QUÉ CUENTA

**El punto 10 (`Estado`) ya estaba cumplido por los tokens del lote 1.** `Insignia` mapea `alDia→success`, `proximo→warning`, `info→info`, y esos tres slots del tema ya resuelven a **verde al día · ámbar pendiente · rosa informativo**. **La pieza no se tocó una línea.**

*Es el dividendo de que la pieza lea del tema y no escriba hex: el rediseño la alcanzó sola.* Se declara porque un punto del encargo sin commit se lee como un punto olvidado — y éste está hecho, por otra vía.

---

## ④ 🔴 LO QUE NO ALCANCÉ — cinco puntos

| punto | pieza | qué falta |
|:-:|---|---|
| **6** | **`Chip` con la pata que pisa** | En la casa el chip son `FiltroPills` y `SelectorOpcion`. Falta la **huella blanca que pisa** al elegir, con la física S62. |
| **9** | **`FilaLista`** | Contenedor blanco con filas separadas, glifo magenta en círculo rosa, chevrón tenue. Hoy son `Celda` y `CeldaNavegacion`. |
| **11** | **`Confirmacion`** | La pantalla de «¡Listo!». **`TrioPersonajes` ya está**, que es su mitad. |
| **17** | **`StepperCantidad`** v5 | «−» en círculo blanco, «+» en círculo magenta lleno. |
| **18** | **Los glifos** — 17 nuevos + 17 alias + **la silueta de nariz** | **Es un lote propio**, y el encargo ya lo ordenó último. Incluye la hoja de contacto (§6b) y la silueta de notificación. *Mi medición del lote 1 dice que en silueta blanca la nariz **no se lee a 24 px**: ese glifo no es un recorte del isotipo — hay que dibujarlo.* **No hay hoja de contacto adjunta porque no se dibujó ningún glifo.** |

**Ninguno se empezó.** No hay medio trabajo escondido en la rama.

## ⑤ LO QUE SE VERIFICA

```
npx tsc --noEmit -p packages/ui      → EXIT 0
npx tsc --noEmit -p packages/api     → EXIT 0
npx tsc --noEmit -p apps/cliente     → EXIT 0
npx tsc --noEmit -p apps/prestador   → EXIT 0
node scripts/verify-diseno.mjs       → EXIT 0 · VERDE (auto-prueba: 80 reglas)
npx tsx scripts/verify-contrast.ts   → EXIT 0 · 450 pares · 0 fallo(s)
```

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

*Cambiar un dibujo calibrado con gate por un número de una letra que no sabía que ese gate existió es el error que esta casa ya documentó tres veces — el magenta de S83, la plata de S88, la telemedicina de S113.* **La que pierde se decide en la mesa.**

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

Instalado como skill de proyecto. 🔴 **No se le dejó generar `PRODUCT.md` ni `DESIGN.md`**: su flujo de `init` los escribe en el repo, y es **segunda opinión, no dueña del repo**. Se aplicó su criterio a mano.

**Lo que señaló sin chocar — CURADO:** *«placeholder needs the same 4.5:1, not the muted-gray default»*. Medido: el placeholder usaba `text.tertiary` = **3.28:1**. **Un placeholder no es decoración: es lo que la persona lee para saber qué escribir.** Pasa a `secondary` (**5.24**), en `Campo` y `BarraEscribir`. El token `tertiary` **no se toca** —sigue siendo placeholder-y-decorativo por doctrina, con 28 lectores—; lo que cambia es que un placeholder deja de contar como decorativo. *La casa ya había resuelto este mismo caso igual en S114.*

**Lo que contradice a la letra — IGNORADO Y ANOTADO:**
- *«Tiny uppercase tracked eyebrow»* como ban absoluto ⇒ **la letra §2 firma el antetítulo** en mayúsculas con tracking 2. Y la distinción ya estaba escrita en el código **antes** de esta crítica: el eyebrow que S52 mató era estructura **decorativa** (Ley 18); éste codifica una verdad del contenido y lleva color semántico.
- *«Glassmorphism as default»* contra el disco de la `Cabecera` ⇒ la letra pide textual *«un botón redondo translúcido»*. Y **no es glass**: no hay blur ni `backdrop-filter`, es un fill al 16 %.

**Lo que señaló y NO se curó, declarado:** **`usePresionado` respeta memorial pero no mira `useReducedMotion`.** Es una cura real de accesibilidad y de una línea, **pero toca la primitiva que usa toda la casa** — su alcance no es de este lote.
