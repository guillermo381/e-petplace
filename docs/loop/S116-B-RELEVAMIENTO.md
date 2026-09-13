# S116-B · RELEVAMIENTO DEL OBJETO — qué hay hoy, medido

> **Rama `pista/s116-b` · SHA de partida `ca564994ee55c1f33d00dd015ee21a4286c96dd3` (`ca564994`), que es `main` == `origin/main`.**
> Medido el **12-sep-2026**, worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-b`, árbol limpio al abrir.
> **Esto releva. No construye, no cura, no propone.** Donde hay un juicio y no una medición, lo dice.

---

## ⓪ CÓMO SE MIDIÓ, Y LOS DOS INSTRUMENTOS QUE SE CAYERON ANTES DE PUBLICAR

Las cabeceras citadas se leyeron primero (`verify-diseno.mjs`, `packages/i18n/src/moneda.ts`, las cuatro piezas fiscales). **Su advertencia central se cobró dos veces en este mismo relevamiento**, y por eso está acá arriba y no en una nota al pie:

> *«un censo por patrón acota, no cierra … antes de publicar un número salido de un patrón: ¿qué FORMA de lo que busco no matchea esto?»*

**① El medidor de consumidores sub-contaba casi 5×.** Mi regex de import era `\{([\s\S]*?)\}\s*from '@epetplace/ui'`. El `[\s\S]*?` **arranca en un import ANTERIOR** y se come el primer símbolo del nuestro: en `apps/cliente/src/app/_layout.tsx`, `Atmosfera` desaparecía porque el motor empezaba a contar desde `import { useFonts } from 'expo-font'`. **`Boton` daba 49 y da 233.** Curado con `[^{}]*`, que cruza saltos de línea (multilínea ✓) pero **no puede saltar a otro import**. *Lo destapó un control cruzado, no releer el regex.*

**② Un grep crudo leyó comentarios como código — dos veces** (`L-170`). `HeroMarca` aparecía «viva» en `hogar/index.tsx`: eran los comentarios `@override-s82c` que explican **por qué NO se usa**. Y el registry de glifos daba **73 nombres** contra 72 dibujantes: el 73.º era `coach`, que vive en un comentario **narrando su propia muerte** (`☠️ 'coach' MURIÓ COMO NOMBRE — RENAME a 'ia'`). Los censos de este parte **limpian comentarios antes de contar**; los que no pueden, lo declaran.

**Controles.** Todo cero de este parte tiene su control positivo al lado. El medidor de piezas se probó con `Boton` (233, discrimina) y con `PiezaInexistenteXYZ` (0 en todas las zonas). Los ceros de app se probaron además con un detector independiente que ignora comentarios y mira import + JSX + llamada.

**Un cero en `apps/` no prueba pieza muerta:** puede vivir por dentro de `packages/ui`. Por eso toda tabla lleva la columna «dentro de `ui`», y el barrel `packages/ui/src/index.ts` **está excluido de ese conteo** — re-exporta todo y haría parecer viva a cada pieza.

---

## ① TOKENS

**Comando del censo:** `ls -la packages/ui/src/tokens/ && wc -l packages/ui/src/tokens/*.ts packages/ui/src/themes/*.ts packages/ui/src/fonts.ts packages/ui/src/ThemeProvider.tsx`

| archivo | líneas | qué contiene, vivo |
|---|--:|---|
| `tokens/palette.ts` | 721 | **la primitiva.** 146 hex · **130 claves de nivel 2**, de las cuales **71 son un hex directo** (el resto son alphas precomputadas y agrupaciones). Adentro vive `gradients` (4). |
| `tokens/motion.ts` | 195 | duraciones, easings, stagger, y los sub-vocabularios `marca` y `coach`. |
| `tokens/elevacion.ts` | 115 | `reposo` · `elevada` · `halo` · `luz`, por tema, como **string de boxShadow**. |
| `tokens/typography.ts` | 136 | familias (4 sans + 2 mono), **13 tamaños**, 4 pesos, 4 leadings, 5 trackings. |
| `tokens/sobreVideo.ts` | 124 | 12 valores para UI sobre video (discos, velos, banda, colgar). |
| `tokens/opacity.ts` | 65 | 3 valores: `disabled` · `luzDeEsquina` · `marcaDeAgua`. |
| `tokens/shadows.ts` | 64 | sombras RN por tema + 5 glows (**sólo dark**). |
| `tokens/spacing.ts` | 31 | **21 escalones**, base 4. |
| `tokens/dosis.ts` | 30 | 2 valores: `prestador:'baja'` · `dueno:'alta'`. |
| `tokens/radius.ts` | 20 | **9 escalones**. |
| `fonts.ts` | 50 | el mapa de 6 fuentes. |
| `ThemeProvider.tsx` | 127 | la resolución. |
| `themes/light.ts` · `dark.ts` · `memorial.ts` · `index.ts` | 311 · 243 · 198 · 210 | los tres temas y su resolvedor. |

> **Tres números de esta tabla los publiqué mal en el primer borrador y los corregí re-midiendo antes de cerrar** (radius 8→**9**, tamaños 12→**13**, claves de paleta 60→**130/71**). Los conté a ojo sobre la lista en vez de con un comando. *Es el mismo modo de falla que este parte documenta dos veces en §0, cobrado una tercera.* Los comandos quedan al pie.

### Valores vivos

**`spacing`** — 21 escalones, base 4, múltiplos estrictos: `0·px(1)·0.5(2)·1(4)·1.5(6)·2(8)·2.5(10)·3(12)·4(16)·5(20)·6(24)·7(28)·8(32)·10(40)·12(48)·14(56)·16(64)·20(80)·24(96)·28(112)·32(128)`.

**`radius`** — 9 escalones: `none 0 · xs 4 · sm 8 · suave 10 · md 12 · lg 16 · xl 20 · 2xl 24 · full 9999`. La **ley de geometría (S58, firma founder)** está escrita adentro: *lo que se ELIGE es rectángulo suave (10-12); lo que INFORMA es píldora (full)*.

**`typography.size`** — **13** tamaños: `xs 11 · control 13 · sm 14 · base 16 · metrica 18 · md 20 · lg 22 · xl 28 · 2xl 32 · 3xl 38 · 4xl 48 · hero 56 · display 68`. ⚠️ **Dos entran con nombre propio y NO como peldaño de la escala**, y su archivo lo declara: `control: 13` (etiqueta de un control, *«la escala es de PROSA y una etiqueta no es prosa»*) y `metrica: 18` (la cifra grande de una tarjeta de tablero). *Quien los lea como el siguiente escalón de la prosa se va a equivocar de registro.*
**`weight`** 300/400/500/700 · **`leading`** tight 1.1 · snug 1.3 · normal 1.6 · relaxed 1.75 · **`tracking`** tight −0.4 · normal 0 · mono 0.6 · wide 0.8 · widest 1.4.

**`motion.duration`** — el vocabulario del Norte (**N10**) es `micro 150 · estandar 300 · grande 520`, más `overshootTab 280`. Conviven **cinco legados renombrados a propósito**: `legacy_instant 80 · fast 150 · legacy_normal 250 · legacy_slow 400 · legacy_verySlow 600`. El archivo explica el rename con su medición: *de los cuatro legados, sólo `normal` (250) tenía usos — **15** —, y era justo el del nombre plausible*. `motion.marca` (apertura 340 ms, bezier `.32,.72,0,1`, scrim 0.4) y `motion.coach` (13 valores) son sub-vocabularios cerrados.
**`easing`** — 4: `easeOut` · `spring` · `easeInOut` · `easeIn`. **`stagger`** — 60 / 80 / 120.

**`shadows`** — por tema. `dark` tiene `sm·md·lg` + **5 glows** (teal, pink, verde, violet, coral); `light` tiene `sm·md·lg` **sin glow**, todas tintadas lavanda `#6450B4`; `memorial` sólo `sm·md` sobre `sage`. La regla vive en el archivo: *glow SOLO en dark, y es SEMÁNTICO — reservado a «en vivo»*.

**`elevacion`** — el sistema nuevo (boxShadow string, dos niveles). `light` tiene `halo: null` y `luz: null` *«en claro la superficie ya existe sin ayuda»*; `dark` tiene halo `rgba(255,255,255,0.14)` y **luz teal** `0 0 24px rgba(40,232,218,0.33)`; `memorial` hereda el halo y **apaga la luz**.

**`opacity`** — `disabled .45` · `luzDeEsquina .07` (firmado, `DIRECCION_ARTE` §9bis.2) · `marcaDeAgua .045` (firmado 2-ago-2026, **un solo valor para las dos casas**, con su reserva de 0.040 explícitamente muerta).

**`dosis`** — `prestador:'baja'` · `dueno:'alta'`. No es un tema: gobierna cuánta marca recibe cada superficie. Declara que **el logo queda FUERA de la contabilidad de dosis** (es identidad, no acento).

### Los tres temas: cómo se resuelven

`getTheme(mode, cta)` en `themes/index.ts`. **`mode`** ∈ `light|dark|memorial` y lo resuelve el SISTEMA (`useColorScheme` en el `_layout` raíz de cada app) — **el usuario no lo elige** (D-305). **`memorial` queda SIEMPRE encima** del modo: no es un tema elegible, es un momento.

El segundo eje es **`cta: 'tinta' | 'oficio'`** — el ancla del CTA primario, que en la práctica **es la casa**: `tinta` = cliente, `oficio` = prestador. `getTheme` compone `lightOficio` / `darkOficio` sobre el tema base sobreescribiendo **`bg.base` + 12 slots de `accent`** (`cta·ctaTexto·ctaElevado·control·hito·controlBg·active·marcaEleccion·atmosfera·activoLleno·sobreActivoLleno`). **Memorial ignora el ancla:** `case 'memorial': return memorialTheme` — *memorial no se celebra*.
El ancla **se HEREDA del provider padre** (`ctaProp ?? padre?.cta ?? 'tinta'`), y el archivo cuenta por qué: con un default duro, los **78 `<ThemeProvider>` de `TokenGallery`** perdían `cta="oficio"` y el founder vio papel rosa en el prestador.

**`SlotDeTema`** declara 8 nombres como el contrato público de lo que una pieza puede pedir del tema: `bg.base · accent.cta · accent.ctaTexto · accent.ctaElevado · accent.control · accent.active · accent.marcaEleccion · accent.atmosfera`.

### 🔴 Los tres temas NO son isomorfos — y eso lo hereda cualquier rediseño

**Comando:** diff de claves de nivel 1 y 2 entre `light.ts` y `memorial.ts`.

| grupo | light / dark | memorial |
|---|---|---|
| `bg` | 8 slots | 8 — igual |
| `text` | 6 | 6 — igual |
| `accent` | 26 (light) / 26 (dark) | **22 — le faltan `active`, `controlBg`, `controlLleno`, `sobreControlLleno`** |
| `capa` | 4 | 4 — igual |
| `capaText` | 4 | **grupo ENTERO ausente** |
| `capaBg` | 4 | **grupo ENTERO ausente** |
| `status` | 16 | 16 — igual |
| `services` | 8 | 8 — igual |
| `border` | 7 | 7 — igual |

⇒ **una pieza que lea `theme.capaBg.cuidado` o `theme.accent.active` funciona en dos temas de tres.** No es un defecto declarado en ningún lado que yo haya encontrado; es un hecho del objeto y se declara acá.

**A cuántas piezas alcanza — medido al cerrar** (`packages/ui/src` + las dos apps, comentarios excluidos):

| slot ausente en memorial | archivos que lo leen |
|---|--:|
| `capaBg.*` | **9** |
| `capaText.*` | **6** |
| `accent.active` | **4** |
| `accent.controlBg` | **2** |
| `accent.controlLleno` · `accent.sobreControlLleno` | 0 |
| **total de lecturas** | **21** |

**Control positivo:** `accent.cta`, que memorial **sí** tiene, da **10** archivos — el medidor discrimina.
⚠️ **Esto NO dice que haya 21 defectos.** La explicación probable es que cada lectura viva en una rama que memorial nunca alcanza, que sería lo correcto. **Verificarlo pide leer las 21 y no las leí** (ver §⑧).

### Fuentes cargadas (`fonts.ts`)

**Seis, y sólo seis:** `DMSans_300Light` · `DMSans_400Regular` · `DMSans_500Medium` · `DMSans_700Bold` · `JetBrainsMono_400Regular` · `JetBrainsMono_500Medium`.
**El import es POR PESO y eso es la mitad del archivo:** `from '@expo-google-fonts/dm-sans/300Light'`, no desde la raíz de la familia. El comentario trae la medición de S94-PERF: importar desde la raíz empaquetaba **35 `.ttf`** (el índice hace `require` de todos los pesos) contra los 7 de hoy — **−2,37 MB en cada app**. *El mapa decía seis y el bundle llevaba treinta y cuatro.*
☠️ **La itálica murió** (S82-B r15, decisión del founder: estigma de texto generado por IA). El slot se retiró entero.
⚠️ El `.ttf` que queda y no es nuestro: `MaterialSymbols_400Regular` (0,93 MB), que **no lo pide nadie de esta casa** — entra por una dependencia de expo-router.

### Dónde viven los hex de la rampa del isotipo

**En `packages/ui/src/tokens/palette.ts`, en el bloque `gradients` (líneas ~694-715). Los seis stops del SVG de marca:**

```
gradients.logo = {
  colors:    ['#FF00AF', '#D32EB7', '#68A2CD', '#28E8DA', '#90FF8B', '#FFF645'],
  locations: [0, 0.06, 0.2, 0.28, 0.48, 0.65],
  angle:     180,
}
```

**Uso declarado CERRADO: splash y logo. El amarillo `#FFF645` sólo existe acá.**
`Isotipo.tsx` **los DERIVA de ahí, no los repite** — su cabecera dice que en S96-B vivían escritos a mano y se retiraron. Los otros tres gradientes son `firmaUILight` (pinkDark→violetDark→tealDark), `firmaUIDark` (pinkVivo→violet→teal) y `transparent` (memorial: *la marca habla bajito ahí*).

⚠️ **El PATH del isotipo es otra cosa y vive aparte:** `ISOTIPO_PATH`, una constante de ~3.500 caracteres en `packages/ui/src/brand/Isotipo.tsx:26`, viewBox 471.82×324. **Se exporta a propósito** y tiene **un solo consumidor externo: `PinEnMapa.tsx`**, que no puede anidar `<Svg>` — la cabecera declara que exportarlo es *«lo único que evita el clon, y un clon de la MARCA es el peor de todos»*.

---

## ② PIEZAS

### El contador oficial

```
$ node scripts/verify-contador-piezas.mjs
verify:contador-piezas · 191 .tsx − 4 .web − 1 infra = 186 piezas · 127 wrappers
✅ ninguna fuente escribe el número; el comando es la fuente
```
**EXIT = 0.** Su propia salida declara su punto ciego: *«⚠️ SIN instrumento, y ya se cayeron: migraciones · fichas · pares de voseo · cadenas de galería de R66 · ordinales · el conteo de reglas de este lint»*.

**Mi inventario cuenta 198 y reconcilia así:** 186 oficiales **+ 11 de `brand/`** (que el contador no mira: sólo cuenta `components/`) **+ 1 infra** (`capturaFoto`, que el oficial resta). Los uso a los dos: **186 es el número de la casa**; 198 es el universo que un rediseño tiene que tocar.

### Cómo se midió el consumo

Para cada archivo de pieza se extraen sus **símbolos exportados**; para cada archivo de `apps/*/src` se extraen los **símbolos importados desde `@epetplace/ui`** (regex multilínea, ver §0); una pieza «tiene N consumidores en la app X» si N archivos de X importan alguno de sus símbolos. **Esto responde exactamente la pregunta del encargo —qué pantalla se mueve si toco la pieza— y es distinta de la del censo, que pregunta si existe y compila.**

⚠️ **La columna «dentro de `ui`» se mide por USO DEL SÍMBOLO** (`<Pieza`, `Pieza(`, `Pieza,`), no por import: dentro de `ui` los imports son relativos y de rutas variadas. Puede sobre-contar si un nombre corto coincide con otra cosa; **no se usa para declarar nada muerto por sí sola.**

### Titulares

- **`apps/admin` y `apps/pagos-web` consumen CERO piezas.** Control positivo: `grep -rl '@epetplace/ui' apps/admin apps/pagos-web` → **0 hits**, contra **183 hits** en `apps/cliente/src`. `apps/admin/package.json` declara `@epetplace/api` y **no** `@epetplace/ui`; `apps/pagos-web` no tiene dependencias (es un `build.mjs` estático). **El cero es real, no un fallo del medidor.**
- **44 piezas de 198 tienen cero consumidores en apps.** De ésas, **25 tampoco se usan dentro de `ui`** y sólo aparecen en `TokenGallery`.
- **Las 8 más montadas concentran el producto:** `Texto` 227 · `Boton` 233 · `Encabezado` 168 · `EstadoVacio` 151 · `Aviso` 145 · `Esqueleto` 143 · `Tarjeta` 138 · `Separador` 106.

### Las 25 sin ningún consumidor (ni en apps ni dentro de `ui`)

`ActivarPlaca` · `BotonBajarAlFinal` · `BurbujaPendientes` · `CabeceraCoach` · `CalendarioCupo` · `CampoClaveAcceso` · `CantoMarca` · `CierreEnCurso` · `ConsecuenciasDelCierre` · **`DesgloseCompra`** · `DetallePeso` · `FichaMascotaHogar` · `FichaPapel` · `FichaVacuna` · `FilaVacunaCarnet` · `Fundido` · **`HeroMarca`** · `HeroMascota` · `HiloDelDia` · `LockupMarca` · `PastillaConociendolo` · `PlacaQR` · `Salida` · `SelectorDestinoDonacion` · `SelectorRoster`

**Verificadas una por una con un detector que ignora comentarios** (import + JSX + llamada, excluyendo el propio archivo, el barrel y la galería). Dos merecen nombre propio:

- 🔴 **`HeroMarca` — el Hogar la reemplazó con una copia local y lo dejó escrito.** `apps/cliente/src/app/(tabs)/hogar/index.tsx:1613` lleva un `@override-s82c` que dice: *«HeroMarca no tiene slots para fecha-antes-del-saludo ni para la fila de mascotas: se compone local **COPIANDO NIVEL** de la primitiva (gradiente firma + curva 44/26 + safe area absorbida + memorial plano) — CANDIDATA a B: HeroMarca gana slots»*. **El techo del Hogar es una copia declarada de una primitiva que no usa nadie.**
- 🔴 **`DesgloseCompra` y `CampoClaveAcceso` son piezas fiscales de S115 sin montar** — ver §⑥.

### Inventario completo, por familia

Consumidores = **archivos distintos que la importan**. `⚠️` = cero en apps y cero dentro de `ui`.

⚠️ **Cada pieza aparece en UNA sola familia** — la primera que la nombra en mi mapeo — así que la suma da 198 sin repetir. **Eso reparte lo fiscal:** `TarjetaFactura` y `TarjetaDestinoPlata` cayeron en *tarjetas y fichas*, `SelectorFacturacion` y `SliderPrecio` en *controles*, `PrecioText` en *texto y datos*, `CampoIdentificacion` y `CampoClaveAcceso` en *campos*. **La vista fiscal completa está en §⑥**, que es donde importa.
La agrupación es **mía y es un juicio** — el objeto no tiene familias declaradas.

#### brand — 22 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `MarcaDeAgua` | 9 | 76 | 0 | **85** | 2 |
| `Isotipo` | 10 | 8 | 0 | **18** | 7 |
| `PaseoDeHuellas` | 5 | 4 | 0 | **9** | 0 |
| `EsperaDeMarca` | 4 | 3 | 0 | **7** | 1 |
| `EsperaDeTrabajo` | 6 | 0 | 0 | **6** | 0 |
| `RitualDeEntrada` | 5 | 0 | 0 | **5** | 0 |
| `Huella` | 3 | 1 | 0 | **4** | 9 |
| `PresenciaCoach` | 3 | 1 | 0 | **4** | 1 |
| `Atmosfera` | 1 | 1 | 0 | **2** | 0 |
| `Baldosa` | 0 | 2 | 0 | **2** | 0 |
| `Destape` | 0 | 1 | 0 | **1** | 0 |
| `Guijarro` | 1 | 0 | 0 | **1** | 2 |
| `CabeceraCoach` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `CantoMarca` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `Fundido` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `HeroMarca` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `LockupMarca` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `MarcaEleccion` | 0 | 0 | 0 | **0** | 14 |
| `Mutacion` | 0 | 0 | 0 | **0** | 1 |
| `OrbeCoach` | 0 | 0 | 0 | **0** | 4 |
| `PuntoEstado` | 0 | 0 | 0 | **0** | 2 |
| `Salida` ⚠️ | 0 | 0 | 0 | **0** | 0 |

#### navegación y estructura — 20 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `Encabezado` | 88 | 80 | 0 | **168** | 0 |
| `Hoja` | 51 | 47 | 0 | **98** | 17 |
| `EvitaTeclado` | 22 | 24 | 0 | **46** | 1 |
| `Entrada` | 9 | 10 | 0 | **19** | 2 |
| `PantallaConPie` | 6 | 1 | 0 | **7** | 2 |
| `chevron` | 3 | 1 | 0 | **4** | 27 |
| `HojaCaptura` | 0 | 4 | 0 | **4** | 0 |
| `HojaConfirmacionDestructiva` | 2 | 2 | 0 | **4** | 0 |
| `BarraTabs` | 1 | 1 | 0 | **2** | 1 |
| `HojaTraerPapeles` | 2 | 0 | 0 | **2** | 1 |
| `ModalDosAlturas` | 1 | 1 | 0 | **2** | 0 |
| `PantallaDeCandado` | 1 | 1 | 0 | **2** | 0 |
| `PuertaHermana` | 0 | 2 | 0 | **2** | 1 |
| `HojaContanos` | 1 | 0 | 0 | **1** | 0 |
| `PantallaDespedida` | 1 | 0 | 0 | **1** | 0 |
| `PantallaDocumentos` | 1 | 0 | 0 | **1** | 0 |
| `PieReserva` | 1 | 0 | 0 | **1** | 0 |
| `PuertaDeOficio` | 0 | 0 | 0 | **0** | 1 |
| `teclado-resuelto` | 0 | 0 | 0 | **0** | 2 |
| `tilde` | 0 | 0 | 0 | **0** | 3 |

#### controles — 26 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `Boton` | 124 | 109 | 0 | **233** | 42 |
| `SelectorOpcion` | 25 | 32 | 0 | **57** | 4 |
| `Interruptor` | 7 | 14 | 0 | **21** | 4 |
| `FiltroPills` | 7 | 2 | 0 | **9** | 1 |
| `SelectorSegmentado` | 2 | 5 | 0 | **7** | 2 |
| `StepperCantidad` | 3 | 4 | 0 | **7** | 2 |
| `SliderPrecio` | 0 | 6 | 0 | **6** | 0 |
| `SelectorDia` | 2 | 2 | 0 | **4** | 0 |
| `SelectorEspecie` | 1 | 2 | 0 | **3** | 1 |
| `Casilla` | 2 | 0 | 0 | **2** | 4 |
| `FiltrosLineaDeVida` | 2 | 0 | 0 | **2** | 0 |
| `SelectorDestinoItem` | 2 | 0 | 0 | **2** | 0 |
| `SelectorMotivo` | 2 | 0 | 0 | **2** | 0 |
| `BotonContanos` | 1 | 0 | 0 | **1** | 0 |
| `BotonCopiar` | 1 | 0 | 0 | **1** | 0 |
| `ChipsSugerencia` | 1 | 0 | 0 | **1** | 0 |
| `FilaAcciones` | 1 | 0 | 0 | **1** | 0 |
| `HojaFiltros` | 1 | 0 | 0 | **1** | 0 |
| `SelectorFacturacion` | 1 | 0 | 0 | **1** | 0 |
| `SelectorVentana` | 1 | 0 | 0 | **1** | 0 |
| `AccionQueLleva` | 0 | 0 | 0 | **0** | 1 |
| `BotonBajarAlFinal` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `BotonExplicar` | 0 | 0 | 0 | **0** | 3 |
| `SelectorAvatar` | 0 | 0 | 0 | **0** | 1 |
| `SelectorDestinoDonacion` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `SelectorRoster` ⚠️ | 0 | 0 | 0 | **0** | 0 |

#### campos — 11 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `Campo` | 32 | 47 | 0 | **79** | 11 |
| `CampoFecha` | 6 | 1 | 0 | **7** | 1 |
| `BarraEscribir` | 2 | 2 | 0 | **4** | 0 |
| `CampoCodigo` | 2 | 2 | 0 | **4** | 1 |
| `CampoIdentificacion` | 2 | 0 | 0 | **2** | 0 |
| `CodigoFirmaInput` | 1 | 1 | 0 | **2** | 0 |
| `BuscadorDeLugar` | 1 | 0 | 0 | **1** | 0 |
| `ConvivenciaInput` | 0 | 1 | 0 | **1** | 0 |
| `FormularioPostulacion` | 1 | 0 | 0 | **1** | 0 |
| `SugerenciaRaza` | 1 | 0 | 0 | **1** | 0 |
| `CampoClaveAcceso` ⚠️ | 0 | 0 | 0 | **0** | 0 |

#### texto y datos — 10 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `Texto` | 113 | 114 | 0 | **227** | 101 |
| `FilaDato` | 8 | 8 | 0 | **16** | 1 |
| `Cronometro` | 1 | 3 | 0 | **4** | 1 |
| `CodigoAEscala` | 2 | 1 | 0 | **3** | 0 |
| `TarjetaMetrica` | 2 | 0 | 0 | **2** | 0 |
| `TresNumeros` | 0 | 2 | 0 | **2** | 0 |
| `BarrasSemana` | 1 | 0 | 0 | **1** | 1 |
| `ContadorClip` | 0 | 1 | 0 | **1** | 1 |
| `PrecioText` | 1 | 0 | 0 | **1** | 4 |
| `DetallePeso` ⚠️ | 0 | 0 | 0 | **0** | 0 |

#### tarjetas y fichas — 27 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `Tarjeta` | 61 | 77 | 0 | **138** | 18 |
| `Insignia` | 13 | 31 | 0 | **44** | 7 |
| `FichaFranja` | 2 | 2 | 0 | **4** | 0 |
| `TarjetaEstado` | 0 | 4 | 0 | **4** | 0 |
| `ChipEntidad` | 3 | 0 | 0 | **3** | 4 |
| `FichaPrestador` | 2 | 1 | 0 | **3** | 1 |
| `TarjetaAdoptable` | 2 | 1 | 0 | **3** | 0 |
| `TarjetaPedido` | 1 | 2 | 0 | **3** | 0 |
| `Badge` | 1 | 1 | 0 | **2** | 3 |
| `FichaRaza` | 2 | 0 | 0 | **2** | 0 |
| `TarjetaProducto` | 1 | 1 | 0 | **2** | 0 |
| `VitrinaRefugio` | 1 | 1 | 0 | **2** | 0 |
| `BloqueConCriterio` | 1 | 0 | 0 | **1** | 0 |
| `FichaAdoptable` | 1 | 0 | 0 | **1** | 0 |
| `FichaDeOferta` | 0 | 1 | 0 | **1** | 0 |
| `FichaRepartidor` | 1 | 0 | 0 | **1** | 0 |
| `PanelMemoria` | 1 | 0 | 0 | **1** | 0 |
| `TarjetaConociendolo` | 1 | 0 | 0 | **1** | 0 |
| `TarjetaDestinoPlata` | 1 | 0 | 0 | **1** | 0 |
| `TarjetaFactura` | 1 | 0 | 0 | **1** | 0 |
| `TarjetaHoy` | 1 | 0 | 0 | **1** | 0 |
| `TarjetaMascotaRefugio` | 0 | 1 | 0 | **1** | 0 |
| `TarjetaPasaporte` | 1 | 0 | 0 | **1** | 0 |
| `FichaMascotaHogar` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `FichaPapel` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `FichaVacuna` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `HeroMascota` ⚠️ | 0 | 0 | 0 | **0** | 0 |

#### listas y filas — 22 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `Separador` | 47 | 59 | 0 | **106** | 9 |
| `Celda` | 43 | 43 | 0 | **86** | 5 |
| `CeldaNavegacion` | 20 | 28 | 0 | **48** | 2 |
| `FilaCita` | 5 | 2 | 0 | **7** | 1 |
| `PieRevelar` | 6 | 0 | 0 | **6** | 3 |
| `BurbujaMensaje` | 3 | 2 | 0 | **5** | 2 |
| `EventoDelHilo` | 2 | 2 | 0 | **4** | 0 |
| `FilaBandejaCaso` | 1 | 1 | 0 | **2** | 0 |
| `LineaDeVida` | 2 | 0 | 0 | **2** | 0 |
| `PastillaNuevoMensaje` | 1 | 1 | 0 | **2** | 0 |
| `ResultadosBusqueda` | 2 | 0 | 0 | **2** | 0 |
| `SeccionPlegable` | 1 | 1 | 0 | **2** | 0 |
| `SeparadorDia` | 1 | 1 | 0 | **2** | 0 |
| `CeldasHoy` | 1 | 0 | 0 | **1** | 0 |
| `FilaConfirmacionVacuna` | 1 | 0 | 0 | **1** | 0 |
| `FilaEntrega` | 0 | 1 | 0 | **1** | 0 |
| `ListaPlanVacunal` | 1 | 0 | 0 | **1** | 0 |
| `BurbujaPendientes` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `fila-de-cabecera` | 0 | 0 | 0 | **0** | 2 |
| `FilaVacunaCarnet` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `HiloDelDia` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `PastillaConociendolo` ⚠️ | 0 | 0 | 0 | **0** | 0 |

#### estado y avisos — 23 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `EstadoVacio` | 76 | 75 | 0 | **151** | 3 |
| `Aviso` | 75 | 70 | 0 | **145** | 0 |
| `Esqueleto` | 65 | 78 | 0 | **143** | 2 |
| `EscaleraEstados` | 3 | 2 | 0 | **5** | 4 |
| `EscaleraIconos` | 4 | 1 | 0 | **5** | 3 |
| `LineaAlgoSalioDistinto` | 5 | 0 | 0 | **5** | 0 |
| `CitaEnVivo` | 3 | 1 | 0 | **4** | 1 |
| `EscaleraCaso` | 3 | 0 | 0 | **3** | 0 |
| `EscaleraSolicitud` | 2 | 1 | 0 | **3** | 0 |
| `SemaforoSanitario` | 3 | 0 | 0 | **3** | 0 |
| `AvisoAlergia` | 1 | 1 | 0 | **2** | 1 |
| `AvisoTeleconsulta` | 2 | 0 | 0 | **2** | 0 |
| `Convivencia` | 1 | 1 | 0 | **2** | 2 |
| `AvisoAnticipacion` | 1 | 0 | 0 | **1** | 0 |
| `BannerPlazo` | 0 | 1 | 0 | **1** | 0 |
| `FranjaSeguridad` | 1 | 0 | 0 | **1** | 0 |
| `GlifoConContador` | 1 | 0 | 0 | **1** | 0 |
| `HitoUnaVidaNueva` | 1 | 0 | 0 | **1** | 0 |
| `SenalesAdoptable` | 1 | 0 | 0 | **1** | 0 |
| `CierreEnCurso` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `ConsecuenciasDelCierre` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `EstadoConexion` | 0 | 0 | 0 | **0** | 1 |
| `HuellaDelVinculo` | 0 | 0 | 0 | **0** | 1 |

#### fiscal y plata — 2 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `DesgloseCompra` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `VozComision` | 0 | 0 | 0 | **0** | 2 |

#### media y mapa — 35 piezas

| pieza | cliente | prestador | admin | apps | dentro de `ui` |
|---|--:|--:|--:|--:|--:|
| `Icono` | 45 | 17 | 0 | **62** | 29 |
| `AvatarMascota` | 17 | 17 | 0 | **34** | 13 |
| `capturaFoto` | 6 | 4 | 0 | **10** | 3 |
| `LogoNegocio` | 2 | 5 | 0 | **7** | 5 |
| `VisorFoto` | 5 | 1 | 0 | **6** | 1 |
| `ClipSesion` | 2 | 3 | 0 | **5** | 3 |
| `EvidenciaFoto` | 0 | 5 | 0 | **5** | 1 |
| `MapaRecorrido` | 3 | 2 | 0 | **5** | 1 |
| `AceptacionDeDocumentos` | 1 | 3 | 0 | **4** | 0 |
| `DocumentoLegalLectura` | 2 | 2 | 0 | **4** | 0 |
| `SuperficieChat` | 2 | 2 | 0 | **4** | 0 |
| `ActaDeEntrega` | 1 | 1 | 0 | **2** | 0 |
| `CabeceraHilo` | 1 | 1 | 0 | **2** | 0 |
| `EntradaDeCruce` | 0 | 2 | 0 | **2** | 0 |
| `PinEnMapa` | 2 | 0 | 0 | **2** | 0 |
| `SuperficieLlamada` | 1 | 1 | 0 | **2** | 0 |
| `AccionesPasaporte` | 1 | 0 | 0 | **1** | 0 |
| `CabeceraCaso` | 1 | 0 | 0 | **1** | 0 |
| `ConfiguracionPasaporte` | 1 | 0 | 0 | **1** | 0 |
| `ControlLlamada` | 1 | 0 | 0 | **1** | 6 |
| `EvidenciaClip` | 0 | 1 | 0 | **1** | 0 |
| `GotaUbicacion` | 1 | 0 | 0 | **1** | 0 |
| `MapaPunto` | 0 | 1 | 0 | **1** | 1 |
| `PiezaMedicacionActiva` | 1 | 0 | 0 | **1** | 0 |
| `PinMovible` | 1 | 0 | 0 | **1** | 1 |
| `PresentacionNexo` | 1 | 0 | 0 | **1** | 0 |
| `RespuestaNexo` | 1 | 0 | 0 | **1** | 0 |
| `ActivarPlaca` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `CalendarioCupo` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `EncabezadoLlamada` | 0 | 0 | 0 | **0** | 1 |
| `MapaZona` | 0 | 0 | 0 | **0** | 2 |
| `MiniaturaClip` | 0 | 0 | 0 | **0** | 1 |
| `PlacaQR` ⚠️ | 0 | 0 | 0 | **0** | 0 |
| `TemporizadorLlamada` | 0 | 0 | 0 | **0** | 1 |
| `TileVideoPropio` | 0 | 0 | 0 | **0** | 1 |

---

## ③ GLIFOS Y MARCA

### El set de `Icono`

`packages/ui/src/components/Icono.tsx` — **2.454 líneas, 136 KB**, el archivo más grande de `packages/ui`. Registry de dibujantes por nombre (regla 74): agregar un glifo = una entrada.

**Medido con el union `IconoNombre` limpio de comentarios y el registry parseado por entrada:**

| medición | valor |
|---|--:|
| nombres declarados en `IconoNombre` | **72** |
| dibujantes en el registry | **72** |
| declarados sin dibujante | 0 |
| dibujantes sin declarar | 0 |
| **montan `<Huella/>` en su dibujo** | **44** |
| **no la montan** | **28** |
| reciben el argumento `huella` | 45 |
| reciben **sólo** `tinta` | 27 |
| máximo de elementos SVG en un glifo | **5** (`vacuna`) |

*El techo de 5 elementos no es casualidad: la Ley 9 dice que a 21 px la huella sobrevive o es ruido.*

### Los 28 sin huella, clasificados leyendo su declaración (no su nombre)

**a) Declarados GLIFO DE CONTROL — la Ley 9 en su alcance S98 los exime** (*«en un glifo de control no hay mascota, hay interfaz»*): `papelera` · `candado` · `campana` · `lapiz` · `filtro` · `compartir` · `descargar` · `copiar` · `ojo` · `ojoTachado` · `peso` · `personalidad` · `antiparasitario` · `foto`. **(14)**

**b) Los cuatro nodos del seguimiento**, declarados sin huella en bloque: `nodoConfirmado` · `nodoPreparando` · `nodoEnCamino` · `nodoEntregado`. **(4)**

**c) Los cinco de etapa de la adopción**, con su razón escrita: *«sobre, burbujas, check y pluma son objetos de trámite, y una huella sobre un sobre diría "sobre de mascota", que no significa nada»*: `sobre` · `burbujas` · `checkEnCirculo` · `pluma` · `enviar`. **(5)**

**d) `ia` — no está sin huella: la huella ES el dibujo.** Son tres `CHISPA` con `fill={huella}`. Es el único que recibe `huella` y no monta `<Huella/>`, y `icono-huella.ts` lo declara junto a `negocio` y `datos`: *«un `'none'` ahí no deja un glifo sin adorno: deja un glifo VACÍO — `ia` se borraría entero»*. **(1)**

**e) 🔴 Los cuatro que no cumplen la regla madre y NO están declarados de control:** `carrito` · `info` · `ubicacion` · `lupa`. **Medido por el dibujante, no por el nombre: los cuatro reciben SÓLO `tinta`** ⇒ estructuralmente no pueden llevar huella. No encontré marca de «control» en su declaración del union. **(4)**

### Quién decide la huella

Vive fuera del componente, en `packages/ui/src/components/icono-huella.ts` (**87 líneas**), para que su gate pueda importarla sin arrastrar `react-native`. La regla nueva de S113 es **sobre el CONTEXTO, no sobre el glifo**: `montaje: 'control'` suprime la huella — salvo donde la huella es el objeto (`esEstructura`). No es un `sinHuella?: boolean` **a propósito**: *un booleano dejaría a cualquier pantalla apagar cualquier huella por gusto*.

### Todos los lugares donde vive el logo o el isotipo

**Comandos:** `find apps packages -type f \( -name '*.png' -o -name '*.svg' \)` · `shasum -a 256` para duplicados · `grep -rl` para consumidores.

| # | dónde | qué | cambiarlo sale por | ¿duplicado? |
|---|---|---|---|---|
| 1 | `packages/ui/src/brand/Isotipo.tsx:26` | `ISOTIPO_PATH` (SVG en código) + 3 registros (tinta/blanco/gradiente) | **OTA** | fuente única; `PinEnMapa` lo importa en vez de clonarlo |
| 2 | `packages/ui/src/tokens/palette.ts` `gradients.logo` | los 6 stops de la rampa | **OTA** | fuente única; `Isotipo` los deriva |
| 3 | `packages/ui/src/brand/LockupMarca.tsx` | el lockup | **OTA** | ⚠️ **cero consumidores** |
| 4 | `apps/{cliente,prestador}/assets/images/icon.png` | ícono de app | **BUILD** | **distintos** (cli 32 K · pre 88 K) |
| 5 | `.../android-icon-foreground.png` | adaptive icon | **BUILD** | 🔴 **BYTE-IDÉNTICOS** (`13e3018b88fe`) |
| 6 | `.../android-icon-monochrome.png` | adaptive monochrome | **BUILD** | 🔴 **BYTE-IDÉNTICOS** (`460460b5f834`) |
| 7 | `.../splash-icon.png` | splash | **BUILD** | 🔴 **BYTE-IDÉNTICOS** (`90183ac581d8`) |
| 8 | `.../notification-icon.png` | ícono de notificación | **BUILD** | 🔴 **BYTE-IDÉNTICOS** (`66bf0565a6b3`) |
| 9 | `.../favicon.png` | favicon web | **BUILD** (web export) | **distintos** |
| 10 | `apps/*/app.json` | rutas + **fondos**: adaptive cli `#050508` / pre `#0A7268`; splash cli `#0D050D` / pre `#0A7268` | **BUILD** | los colores están **tecleados en el json**, no salen del token |
| 11 | `packages/ui/assets/brand/` — 13 archivos | `isotipo-{bimi,blanco,tinta,gradiente}.svg`, `isotipo-correo@2x.png`, **8 `logo-estandar-0N0.svg`** | ninguno: no viajan | ⚠️ **sólo 2 tienen consumidor, y son SCRIPTS** (`gen-bimi.mjs`, `verify-bimi.mjs`, `gen-correo-demos-v2.mjs`). `isotipo-blanco`, `isotipo-tinta`, `isotipo-correo` y **los 8 `logo-estandar`** no los lee nadie en código. |
| 12 | `supabase/functions/despachar-correo/index.ts:77` | **URL absoluta** `…/storage/v1/object/public/marca-publica/isotipo@2x.png` | 🔴 **ni OTA ni build: subir el archivo a Storage** | el bitmap del correo **no está en el repo** |
| 13 | `supabase/functions/despachar-correo` · `despachar-invitacion-correo` · `_shared/pasaporte-html.ts` | paleta de correo **tecleada a mano** | deploy de edge function | 🔴 `pasaporte-html.ts` usa **`#F0A92A`, que NO existe en `palette.ts`** (control: `#FCBC1D` sí existe) |
| 14 | `apps/admin` | **sin logo.** Su marca es tipográfica; tokens copiados | deploy web (Vercel) | ver abajo |
| 15 | `apps/pagos-web/src/index.html` | 8 hex a mano | deploy web | 🔴 **4 de los 8 no están en `palette.ts`**: `#FF6FC0` · `#F2EFEA` · `#E6E2DC` · `#A39C93` |
| 16 | `../e-petplace-admin` (**fuera del monorepo**) | portal legado, 5 imágenes, 36 hex | deploy propio | 🔴 ver abajo |

### 🔴 Cuatro sistemas visuales, no uno

1. **`packages/ui`** — el design system. 186 piezas, tokens, tres temas.
2. **`apps/admin`** — **copia declarada**. `apps/admin/src/tokens.ts` (63 líneas) dice: *«Están copiados, no importados, y eso es una decisión con costo … **si la casa cambia un hex, este archivo no se entera**»*. **Verifiqué los 16 pares hoy: 16/16 coinciden.** No divergió todavía — y **nada lo vigila**. Además tiene **6 piezas propias** (`Carta`, `Boton`, `Monto`, `Insignia`, `VacioQueHabla`, `Fallo`) que **duplican nombres de la casa**, y **no usa DM Sans**: su fuente es `-apple-system, …`.
3. **`apps/pagos-web`** — HTML estático con su propia paleta parcial.
4. **`../e-petplace-admin`** (portal legado, último commit 8-sep-2026) — 🔴 **corre sobre la paleta ANTERIOR a la canonización.** Sus cuatro colores más usados son `#FF2D9B` (141), `#00E5FF` (81), `#FFE600` (62) y `#00F5A0` (94), **y los cuatro figuran en `palette.ts` sólo dentro del comentario que narra su reemplazo**: *«pink `#FF2D9B` → `#FF00AF` (hex real del logo)»* · *«cyan `#00E5FF` → teal `#28E8DA`»* · *«yellow `#FFE600` → ELIMINADO»* · *«Jade `#00F5A0` también sigue deprecado»*. **Control:** grep exacto de `#FF2D9B` en `palette.ts` = 1 ocurrencia, y es esa línea de comentario; `#FF00AF` = 4 ocurrencias reales. *El portal que la operación usa todos los días es el único lugar donde la marca vieja sigue viva.*

---

## ④ `verify:diseno`

```
$ node scripts/verify-diseno.mjs
… 81 líneas de regla …
verify:diseno — VERDE (auto-prueba: 80 reglas encendieron; informativas declaradas: R9)
EXIT DEL COMANDO = 0            ← leído del comando, jamás del pipe (L-191)
```

**81 reglas imprimen línea · 80 se auto-prueban · 1 informativa declarada (R9).** La numeración tiene **9 huecos** — `R18 R19 R21 R22 R23 R26 R28 R31 R61` — que son jubilaciones. La tabla viva `JUBILADAS` tiene **1 entrada** (`AvatarMascota.especie`, que R62 vigila hasta que llegue a 0).

El script mecaniza **L-192**: toda regla con modo de fallo recibe un fixture sintético y **tiene que salir roja**; si no puede, el lint entero se declara decorativo y falla. Un **guard estructural** exige que cada regla esté en `FIXTURES` **o** en `INFORMATIVAS`, exactamente en una.

### Baselines

**40 constantes de baseline**, todas en `scripts/verify-diseno.mjs`: **29 escalares** + 11 objetos/listas con **33 entradas**. Más cuatro tablas grandes que no llevan el prefijo:

| tabla | entradas | qué es |
|---|--:|---|
| `MIGRACIONES_CON_VOSEO` | **26** | **lápida, no baseline**: una migración aplicada no se edita, así que no pueden bajar. Su único trabajo es que una migración NUEVA con voseo salga roja. |
| `EXENTOS_R17` | 20 | exenciones de «la galería no envejece» |
| `PENDIENTES_R15` | 10 | la familia `#0F5E56` pendiente de arbitraje |
| `BASELINE_VOSEO` | 6 | por archivo (`prestador/i18n/es.ts` = 47, deuda declarada sin dueño) |
| `BASELINE_R12` | 6 | pares de contraste |
| `JUBILADAS` | 1 | props jubiladas con su cura escrita |

**Los baselines más altos:** `BASELINE_R47` = **39** (usos de `Boton compacto`, variante jubilada, muere en 0) · `BASE_R78` = **11** (piezas donde el tema memorial es la única señal, **piso 2 declarado**) · `BASELINE_R53` = 11 · `BASELINE_R36` = 20 (espaciados crudos) · `BASELINE_R39` = 6 · `BASELINE_R48` = 5.

**Archivos que el script nombra por ruta: 161 únicos** — `apps/cliente` 93 · `packages/ui` 90 · `apps/prestador` 37 · `packages/api` 24 · `supabase/migrations` 3 · `apps/admin` 2.

### FORMA vs VALOR

**Esto es un juicio, no una medición, y se declara como tal.** Intenté medirlo automáticamente (¿el cuerpo de la regla nombra un hex, un token de paleta o una constante de píxeles?) y **el instrumento se cayó**: el corte «hasta la próxima función» arrastra constantes intermedias, así que `r30` aparecía con 13 hex que no son suyos. **No publico ese número.**

El criterio aplicado es el del encargo: **¿la regla sigue diciendo lo mismo si cambio la paleta, la tipografía o los glifos?**

**Atadas al VALOR — mueren o hay que re-medirlas con el rediseño (23):**

| regla | qué valor la ata |
|---|---|
| **R12** contraste dos temas | los **168 pares** y su `baseline 5` se re-miden con cualquier paleta nueva. El umbral (4.5 / 3.0) es de WCAG y sobrevive; la lista no. Lleva **1 regresión abierta** del tapiz al 8 % esperando decisión del founder. |
| **R15** la familia de `#0F5E56` | nombra el hex literal. 10 pendientes de arbitraje. |
| **R16** papel tapiz | `#F6F6F6` compartido, `#0D050D`, `#0D1617`. |
| **R27** el pink no enfoca en el prestador | `tealDark` claro / `teal` oscuro. |
| **R43** el contorno del campo tiene piso | mide 3.41 / 3.40 / 3.34 sobre tres hex de borde contra piso 3:1. |
| **R56** el oro no es tinta en el cliente | vigila el slot `acento`; su nota narra la enmienda a F-OCRE (1,70 → 9,96). |
| **R20** la familia alerta no se rellena | color. |
| **R58** `Texto` no gana color de acento | los **8 miembros** de `TextoColor`. |
| **R30** el glifo no se re-dibuja | **99 paths del registry**. Cambiar un glifo cambia la regla. |
| **R25** la pata no se reinventa | el path de la pata. |
| **R70** un path SVG no va en posición de texto | **6 constantes de path** por nombre (`CHEVRON`, `CHISPA`, `GOTA_D`, `PATH_TILDE`, `BLOB`, `ISOTIPO_PATH`). |
| **R33** la superficie de la huella se declara | la huella. |
| **R72** ninguna etapa del caso se pierde | 5 etapas **con glifo**. |
| **R65** el área de reserva de una marca ajena | 🔴 **el más duro:** `SHA_ISOTIPO_MEDIDO` clavado, caja 56×32, contenido 44×22, `MIN_SIMBOLO_DEUNA = 16`. Es **marca ajena** (Deuna): sólo se mueve si cambia la caja que la contiene. |
| **R32** la esquina compartida | los **20 dp** de la lámina. |
| **R14** el solape no tapa el saludo | 32 < 56. |
| **R51** un token legado no entra a una pieza nueva | los 5 `duration` legados por nombre. |
| **R36** el espaciado sale del token | la regla es de forma; **su baseline de 20 crudos y sus «7 fuera de la escala» se re-miden** si cambia `spacing`. |
| **R37** el radio único | ídem: 3 crudos, 3 fuera de escala, 2 esquinas de 9 px a firma. |
| **R39** N1 la escala | ídem: presupuesto de 3 tamaños a mano; **N1 nombra 16/14/20**. |
| **R38** 3 separadores por pantalla | presupuesto numérico. |
| **R17** la galería no envejece | **213 exportaciones / 203 en galería / 10 exentas** — todo número que se mueve con cada pieza nueva. |
| **R47 · R48 · R62** variantes/alias/props jubiladas | nombran una variante concreta de `Boton` y una prop de `AvatarMascota`. Mueren cuando lleguen a 0. |

**Atadas a la FORMA — sobreviven al rediseño (las otras 58).** Las que lo dicen explícitamente en su salida:
- **R90** *«atada a la FORMA («una sola fuente»), no al valor del regex (L-534)»*
- **R87** *el formato de la plata es UNO SOLO* — es el caso que **funda `L-534`**: se escribió con la firma «punto», el founder la enmendó a «coma» **el mismo día, y la regla no se tocó**, porque mide que haya una sola fuente y no cuál es el separador.
- **R2 / R35** los hex no se escriben a mano · el color aplicado sale del tema. **Sobreviven a cualquier paleta.**
- **R84** ninguna tarifa vive adentro de una pieza · **R88** la plata no se parsea a mano · **R89** un monto formateado no viaja a un payload · **R57** la sección de pago es UNA · **R71** un wrapper sin exportar es un motor sin puerta · **R77** lo que enumera una unión a mano se declara.

⇒ **La lista de arriba (23) es la que el rediseño va a mover.** Y el orden importa: **R12 no es una más** — cambiar la paleta la deja midiendo 168 pares contra colores que ya no existen, y es la única que traduce el rediseño a un número de accesibilidad.

### Qué corre en cada commit

`core.hooksPath` = `/Users/…/e-petplace/.githooks` — **ruta absoluta al árbol PRINCIPAL, no obedece a ninguna rama** (`L-490`): el hook que corre para cualquier worktree es el que tenga en disco quien conduce `main`.
Gates en el pre-commit: **`verify:diseno`** · `verify:censo` · `verify:gates-existen` · `verify:hoisting-nativo` · `verify:ref-antes-de-uso` · `verify:rutas-de-aviso` · `verify:fila-memoizada` · `verify:vio-todo` · `verify:voz-por-tipo` · `verify:jornada-completa` · `verify:sin-byte-nul`.

---

## ⑤ PANTALLAS

### Censo de rutas

**Comando:** `find apps/<app>/src/app -name '*.tsx'`

| app | archivos del router | `_layout` | pantallas | piezas de `ui` por pantalla (media) | con CERO piezas |
|---|--:|--:|--:|--:|--:|
| `apps/cliente` | **112** | 7 | **105** | 11,8 | 9 |
| `apps/prestador` | **93** | 5 | **88** | 14,5 | 3 |

**Las de cero piezas son todas estructurales o delegan**, y las nombro para que el cero no se lea como hallazgo: en el cliente, los 5 `_layout` + `hogar/agregar/{index,[paso]}` + `onboarding/{index,[paso]}` (los dos wizards, que montan sus pasos desde `components/`); en el prestador, sus 3 `_layout`.

### La matriz: qué comparten las dos apps

**Símbolos de `@epetplace/ui` importados desde archivos del router:**

| | símbolos |
|---|--:|
| cliente | **187** |
| prestador | **125** |
| **en las DOS** | **91** |
| solo cliente | **96** |
| solo prestador | **34** |

**El núcleo compartido (91)** — lo que un rediseño mueve en las dos casas de una vez:
`ALTO_FILA_TABS, AceptacionDeDocumentos, AlturaModal, AsaModal, Atmosfera, AvatarMascota, AvisoAlergia, AvisoProvider, BarraEscribir, BarraTabs, BarraTabsItem, Boton, BurbujaMensaje, CARA_EN_HILO, CabeceraHilo, Campo, CampoCodigo, CampoFecha, CampoFechaValor, CasoEnBandeja, Celda, CeldaNavegacion, CitaEnVivo, ClipSesion, CodigoAEscala, CodigoFirmaInput, Cronometro, DocumentoLegalLectura, Encabezado, Entrada, EscaleraEstados, EscaleraSolicitud, EsperaDeMarca, Esqueleto, EsqueletoGrupo, EstadoVacio, EventoDelHilo, EvitaTeclado, FichaFranja, FichaPrestador, FilaBandejaCaso, FilaCita, FilaDato, FiltroMascotas, FiltroPills, Hoja, HojaConfirmacionDestructiva, HojaScroll, Huella, Icono, IconoNombre, Insignia, Interruptor, Isotipo, LogoNegocio, MapaRecorrido, MarcaDeAgua, ModalDosAlturas, PantallaConPie, PaseoDeHuellas, PastillaNuevoMensaje, PendientesCoach, PresenciaCoach, SeccionPlegable, SelectorDia, SelectorOpcion, SelectorSegmentado, Separador, SeparadorDia, StepperCantidad, SuperficieChat, SuperficieLlamada, Tarjeta, TarjetaAdoptable, TarjetaPedido, Texto, ThemeProvider, TokenGallery, VisorFoto, VitrinaRefugio, capturarDeGaleria, conIconos, epetplaceFonts, palette, radius, sobreVideo, spacing, sugerir, typography, useAviso, useTheme`

**Solo prestador (34):** `AvatarMascotaEspecie, Baldosa, BannerPlazo, ColumnaTecho, ConvivenciaInput, Destape, DesvioEscalera, EntradaDeCruce, EstadoConvivencia, EstadoMascotaRefugio, EvidenciaFoto, EvidenciaFotoCapturar, EvidenciaFotoEstado, EvidenciaFotoThumbnail, FichaDeOferta, FilaCitaOficio, GLIFOS_PEDIDO, FilaEntrega, HojaCaptura, InsigniaEstado, OpcionFiltro, PasoEscalera, PublicacionDeMascota, PuertaHermana, SelectorEspecie, SelectorEspecieOpcion, SelectorOpcionItem, SliderPrecio, TarjetaEstado, TarjetaMascotaRefugio, TresNumeros, capturarVideoDeGaleria, esCorreoValido, leerBytes`

**Solo cliente (96)** — la lista larga: incluye toda la línea de vida (`LineaDeVida`, `FiltrosLineaDeVida`, `TipoLineaDeVida`), el Coach (`AtajosCoach`, `COLA_PRESENCIA_COACH`, `SugerenciaNexo`, `RespuestaNexo`, `PresentacionNexo`), el pasaporte (`TarjetaPasaporte`, `AccionesPasaporte`, `ConfiguracionPasaporte`, `VisibilidadPasaporte`), lo fiscal (`TarjetaFactura`, `EstadoFactura`, `CampoIdentificacion`, `DatosIdentificacion`, `PrecioText`), la adopción del lado familia y los helpers puros (`diasEntre`, `tendenciaPeso`, `estadoDelPlan`, `nombreCurado`, `ordenarSeguridad`, `coincidenciasPrimero`).

⇒ **El prestador es un consumidor más chico y más específico: 125 símbolos contra 187, y sólo 34 propios.** Un rediseño del núcleo compartido lo alcanza casi entero.

### La deuda que un rediseño hereda

**Patrones declarados** (comentarios excluidos en todos, `L-170`):
- `hexCrudo` → `/#[0-9A-Fa-f]{6}\b/` — cualquier hex.
- `hexAplicado` → `/\b(background|backgroundColor|color|borderColor|tintColor|shadowColor|fill|stroke|placeholderTextColor)\s*[:=]\s*['"]#[0-9A-Fa-f]{3,8}['"]/` — el hex **puesto en un estilo**, que es la deuda de verdad.
- `fontSizeNum` → `/\bfontSize\s*:\s*\d+/` · **control positivo** `fontSizeToken` → `/\bfontSize\s*:\s*typography\.size\./`
- `styleInline` → cuerpo balanceado de cada `style={{…}}` (multilínea), clasificado por si contiene **un número crudo** en una prop geométrica/tipográfica o **un token**.

| zona | archivos | hex crudo | **hex aplicado** | `fontSize` numérico | `fontSize` por token | `fontFamily` literal |
|---|--:|--:|--:|--:|--:|--:|
| `apps/cliente/src` | 256 | 1 / 1f | **0** | 9 / 3f | 137 / 38f | 0 |
| `apps/prestador/src` | 216 | 0 | **0** | **0** | 62 / 25f | 0 |
| `packages/ui/src` | 254 | 128 / 7f | 7 / 3f | 0 | 228 / 50f | 0 |
| `apps/admin/src` | 10 | 22 / 4f | 3 / 2f | **82 / 7f** | **0** | 0 |

🟢 **Las dos apps móviles están limpias de color literal aplicado: CERO.** El gate (R2 baseline 1, R35 dura en 0) funciona. El prestador además tiene **cero** `fontSize` numérico.
Los 7 `hexAplicado` de `packages/ui` viven en 3 archivos y **dos son legítimos**: `tokens/shadows.ts` (3 — es la fuente) y `TokenGallery` (1). El tercero es `components/placa-qr.ts` (3).
🔴 **`apps/admin` es la zona sucia y no tiene gate de escala:** 82 `fontSize` numéricos en 7 archivos y **cero** por token — porque no importa `typography`. Sus peores: `HojaCaso.tsx` (29), `Liquidaciones.tsx` (21), `Casos.tsx` (14).

**Estilos inline, refinados** (el conteo crudo engaña: un inline con tokens no es deuda):

| zona | `style={{…}}` | con **número crudo** | con token | ninguno de los dos |
|---|--:|--:|--:|--:|
| `apps/cliente/src` | 1155 | **84** | 1045 | 90 |
| `apps/prestador/src` | 1125 | **35** | 1011 | 107 |
| `packages/ui/src` | 1461 | **197** | 1253 | 151 |

**De los 197 de `ui`, 139 son de `gallery/TokenGallery.tsx`** — una herramienta, no producto. Fuera de ella quedan **58**.
Props con número crudo, por frecuencia: `height` · `width` · `borderWidth` · `minHeight` · `right` · `left` · `top` · `bottom` — **posicionamiento absoluto y cajas de dibujo**, no ritmo. `padding`/`margin`/`gap` casi no aparecen: la escala de `spacing` se respeta.

**Los archivos con más deuda de número crudo en inline:** cliente → `hogar/index.tsx` (32) · `hogar/mascota/[mascotaId].tsx` (26) · `lamina-fusion.tsx` (9); prestador → `mascotas.tsx` (6) · `bienvenida-dia1.tsx` (6) · `ventas/repartidor/[id].tsx` (6) · `components/techo-oficio.tsx` (6). **`hogar/index.tsx` aparece dos veces en este parte** — es también el que copia `HeroMarca` local.

---

## ⑥ LO FISCAL DE S115

### Dónde vive cada pieza y quién la consume

| pieza | archivo | líneas | cliente | prestador | dentro de `ui` |
|---|---|--:|--:|--:|--:|
| `TarjetaFactura` | `packages/ui/src/components/TarjetaFactura.tsx` | 159 | **1** (`cuenta/facturas.tsx`) | 0 | 0 |
| `DesgloseCompra` | `packages/ui/src/components/DesgloseCompra.tsx` | 246 | **0** 🔴 | 0 | 0 |
| `SelectorFacturacion` | `packages/ui/src/components/SelectorFacturacion.tsx` | 194 | **1** | 0 | 0 |
| `CampoIdentificacion` | `packages/ui/src/components/CampoIdentificacion.tsx` | — | **2** | 0 | 1 |
| `CampoClaveAcceso` | `packages/ui/src/components/CampoClaveAcceso.tsx` | — | **0** 🔴 | 0 | 0 |
| `PrecioText` | `packages/ui/src/components/PrecioText.tsx` | 203 | 1 | 0 | **4** (`DesgloseCompra`, `FichaDeOferta`, `TarjetaFactura`, `TarjetaProducto`) |
| `SliderPrecio` | `packages/ui/src/components/SliderPrecio.tsx` | — | 0 | **6** | 0 |

🔴 **Dos de las cinco `PIEZAS_FISCALES` que R84/R85/R86 vigilan no las monta nadie: `DesgloseCompra` y `CampoClaveAcceso`.** Verificado con el detector que ignora comentarios: sólo aparecen en `TokenGallery`. **Los gates las siguen vigilando igual — y eso es correcto: vigilan la pieza, no su uso** — pero un rediseño que las toque no mueve ninguna pantalla, y uno que las borre tampoco. *`DesgloseCompra` es la que explica el IVA a la familia; su cabecera argumenta con cuidado por qué el cero se muestra y por qué el nulo no, y hoy no lo lee nadie.*

### El checkout

**R57** («la sección de pago es UNA, medida») vigila exactamente **dos**: `apps/cliente/src/app/(tabs)/despensa/checkout.tsx` y `apps/cliente/src/components/checkout-reserva.tsx`. Los dos montan `SeccionMedioDePago` + `BotonPagar`; **0 versiones propias**. Su nota declara el límite: *«mide QUE MONTEN LA MISMA PIEZA, jamás que se vean igual — eso lo dice el ojo del founder»*.
`checkout-reserva.tsx` es el checkout compartido por extracción (S60): lo consumen los checkouts de paseo, grooming, veterinaria, adiestramiento y guardería.

### Las tres voces de «no cargó»

🔴 **La pieza NO está en `packages/ui`: vive en `apps/cliente/src/components/aviso-no-cargo.tsx`** (97 líneas), y su cabecera dice que existe porque *«son seis superficies de cobro, y la respuesta es la misma en todas»*.

**Las tres son un tipo, no tres textos:** `export type MotivoNoCargo = 'red' | 'sesionCortada' | 'sinSesion'`, *«porque mandan a mirar lugares distintos: la red, el refresco de la sesión, o la puerta de entrada. Cuatro veces el founder se colgó y el mensaje genérico lo mandó a buscar del lado equivocado las cuatro»*.

**Sus 6 consumidores, medidos:** `despensa/checkout.tsx` · `explorar/adiestramiento/confirmar-programa.tsx` · `explorar/guarderia/checkout.tsx` · `explorar/paseo/checkout-paquete.tsx` · `explorar/paseo/checkout-plan.tsx` · `components/checkout-reserva.tsx`.

**La voz vive en `apps/cliente/src/i18n/es.ts` (`noCargo`, línea ~4667):** titulo · detalle · reintentar · noSePuedePagar. Más dos bloques hermanos: `facturaTrabada` (3 claves) y `frenoFiscal` (2). El diccionario declara sus decisiones: *«sin conexión y "tardó demasiado" son el MISMO hecho desde el lado de la familia … y por eso una sola voz»* · **no dice «sin conexión»** aunque el código sea `sin_red`, *«afirmar la causa es la clase de precisión que se vuelve mentira en el caso de al lado»*.
⚠️ Hay además **5 pares `noCargoTitulo`/`noCargoDetalle` anteriores y específicos** por pantalla (días, documentos, mascotas ×2, recurrentes) que **no pasan por esta pieza**.

### El formato de plata

**La fuente única vive en `packages/i18n/src/moneda.ts` (284 líneas), no en `packages/ui`** — y el archivo explica por qué: *«`packages/ui` YA depende de `packages/i18n` … un import al revés sería un CICLO»*. `PrecioText` **re-exporta** `formatearPrecio` (`PrecioText.tsx:157`, y el barrel de `ui` lo vuelve a exportar).

**La firma vigente (founder, 10-sep-2026): COMA DECIMAL Y PUNTO DE MILES, sin excepciones** — `$45,00` · `$1.234,50`. **No depende del idioma**, y está firmado: *«la factura dice el mismo número en los dos idiomas»*. Se fija el locale `es-EC` y **no** se lee el del usuario.
⏪ La primera firma del mismo día decía **punto**; el arco de la enmienda quedó escrito en el archivo, sin borrar. *Es el caso que funda `L-534`.*

**`parsearPrecio` es el par inverso y nace de un defecto medido:** con separador de miles, `'1.234,50'.replace(',','.')` + `parseFloat` da **1.234** — un número plausible y equivocado que **`Number.isFinite` deja pasar**. La cura hace el estado inexpresable: valida la FORMA con `FORMA_DE_PRECIO` y **devuelve `NaN`** ante formato ajeno. `'1234.50'` (punto decimal) **se rechaza a propósito**: sin eso daría `123450`, cien veces el valor.

**Consumidores medidos del riel** (import multilínea desde `@epetplace/i18n`): **23 archivos distintos**.

| símbolo | consumidores |
|---|--:|
| `monto` | **8** — 7 vivos del prestador (`historico`, `ventas/facturacion`, `ventas/mostrador`, `ventas/pedido`, `ventas/producto`, `ventana-pedidos`, `vitrina-piezas`) + `cliente/src/lib/use-moneda.ts` |
| `parsearPrecio` | **10** — 8 pantallas del prestador + guardería/checkout del cliente + `SliderPrecio` |
| `formatearPrecio` | 3 — `seccion-facturacion`, `tres-numeros-precio`, `PrecioText` |
| `montoConCodigo` · `precioPorKg` | 1 cada uno |
| `ConfigMoneda` · `MONEDA_FALLBACK` | 3 cada uno |

⚠️ **`useMoneda` está muerto y lo confirmé:** `grep -rln 'use-moneda\|useMoneda'` devuelve **sólo su propio archivo** y el comentario de `moneda.ts`. Control positivo: `useTraduccion` aparece en **149** archivos del cliente. **El baseline 8 de R87 incluye ese muerto**, y la regla dice que muere en 0.

### Qué está protegido por gate

**Seis reglas de `verify:diseno`, todas verdes hoy:**

| regla | qué hace inexpresable | su límite, declarado por ella misma |
|---|---|---|
| **R84** | ninguna tarifa (`15`, `50`, «IVA») vive adentro de una pieza — 5 piezas, 133 literales mirados | *«JAMÁS "el cálculo del IVA está bien" ni "ninguna pantalla la teclea"»*. No mide «may» en inglés. |
| **R85** | la voz fiscal pasa por el riel **en los dos idiomas** — 43 llamadas | *«JAMÁS "la traducción es buena"»* |
| **R86** | **el error del SRI no puede llegar a la familia** — 0 vías de entrada sobre 17 campos de props | *«jamás "el mensaje que se muestra es el correcto"»* |
| **R87** | el formato de la plata es uno solo — baseline **8**, solo-baja, muere en 0 | 🔴 *«JAMÁS "el producto muestra un solo formato" — **no mide los `toFixed(2)` a mano, que son el otro formato**»* |
| **R88** | la plata no se parsea a mano — **dura en 0**, 3 rutas exentas por no ser plata | no mira los exentos |
| **R89** | un monto formateado no viaja a un payload — **dura en 0**, 4 formateadores vigilados | sólo ve la MISMA LÍNEA; no sigue el flujo de una variable |

**Y cuatro gates propios de S115, los cuatro con EXIT = 0:**
- `verify:voz-de-sesion` — *«cada estado tiene su voz y cortada no expulsa», JAMÁS «la sesión se recupera»*
- `verify:reintento-visible` — la secuencia falla→toque→espera→resultado **sin ningún paso que dibuje NADA**. Nació de `D-1074`: *«al tocar reintentar no pasa nada»* — el handler disparaba, pero el estado intermedio borraba el aviso.
- `verify:perfil-fantasma` — *«la fila de nulls no pasa por perfil»*
- `verify:siempre-se-pregunta` — *«el monto no decide si se pregunta»*

Más `verify:plata` (**29 comprobaciones sobre el archivo REAL**, EXIT 0) y `verify:identificacion-ec` (**778 comprobaciones**, EXIT 0). Los dos corren con `tsx` sobre `.ts` importando el archivo vivo — **la cura del transpilador casero que la cabecera de `verify-diseno` narra**.

⚠️ **De estos diez gates, sólo `verify:diseno` corre en el pre-commit.** Los nueve restantes se corren a mano o en el cierre.

### Lo que hacen inexpresable (y por eso el rediseño no puede romperlo por descuido)

Las tres piezas fiscales están construidas con el mismo movimiento, y conviene saberlo antes de tocarlas: **no documentan la prohibición, la vuelven imposible de escribir.**
- `TarjetaFactura` **no tiene prop `motivo` ni slot `ReactNode`** — así el `sri_error` crudo no puede llegar a la pantalla *«el día que alguien tenga apuro por diagnosticar»*. Sus cuatro estados comparten `minHeight` para que la lista no salte.
- `SelectorFacturacion` recibe `topeConsumidorFinal` **por props** y `mostrarDeducible` **nace en `false`**: *«afirmar que un gasto es deducible es una afirmación fiscal, y esta pieza no tiene con qué sostenerla»*.
- `DesgloseCompra` distingue **`null` (no se dibuja) de `0` (sí se dibuja)** a propósito: *«el alimento balanceado tributa IVA 0 % en Ecuador; "IVA: $0,00" no dice "no sabemos": dice "corresponde cero"»*. Eso **no deroga la ley del nulo 19.9** de `PrecioText`, y las dos cabeceras lo aclaran mutuamente.

---

## ⑦ ADENDA — LAS PIEZAS QUE NO SON DE `packages/ui`

No estaban pedidas por nombre, pero salieron al medir §⑤ y **cambian el tamaño del problema**, así que van con su medición:

**Comando:** `find apps/<app>/src/components -name '*.tsx' | wc -l`

| zona | piezas |
|---|--:|
| `packages/ui` (contador oficial) | **186** |
| `apps/cliente/src/components` | **62** |
| `apps/prestador/src/components` | **53** |
| **total que un rediseño tiene que recorrer** | **~301** |

⇒ **El 38 % de las piezas del producto vive fuera del design system.** No es necesariamente deuda —muchas son composiciones de dominio, que es donde deben estar— pero **ninguna la vigila `verify:contador-piezas`, y `verify:diseno` sólo las alcanza por las reglas cuyo corpus incluye `apps/`**.

**Siete nombres existen en las dos apps. Medido por `shasum`:**

| pieza local | estado |
|---|---|
| `flecha-volver.tsx` | 🔴 **copia byte-exacta** |
| `gate-biometrico.tsx` | 🔴 **copia byte-exacta** |
| `videollamada-piezas.tsx` | 🔴 **copia byte-exacta** |
| `entrada-videollamada.tsx` | divergen (82 vs 121 líneas) |
| `invitacion-avisos.tsx` | divergen (232 vs 252) |
| `pantalla-caida.tsx` | divergen (227 vs 234) |
| `seccion-direccion.tsx` | divergen (200 vs 119) |

*Las tres copias exactas son candidatas obvias a subir; las cuatro que divergen son la pregunta interesante — no se sabe, sin mirarlas, si divergen por diseño o por deriva.* **No las miré: queda en la lista de abajo.**

### El gate de contraste, corrido

```
$ npx tsx scripts/verify-contrast.ts
436 pares verificados · 0 fallo(s)
GATE WCAG: OK — los tres temas base + las DOS casas de oficio pasan.
EXIT DEL COMANDO = 0
```
**Es el número que un cambio de paleta tiene que volver a poner en cero.** (R12, adentro de `verify:diseno`, mide 168 pares con otro corpus y lleva **1 regresión abierta** del tapiz al 8 % esperando decisión del founder — no es baseline.)

---

## ⑧ LO QUE NO ALCANCÉ A MIRAR

Declarado para que nadie lo lea como medido.

**Nada de esto corrió en un aparato ni en un emulador. Cero capturas.** Todo el parte es lectura del objeto en disco. Ninguna afirmación de este documento dice cómo se VE algo.

1. **`packages/cuadro-video` y `packages/mensajeria`** — no los abrí. No sé si tienen UI, tokens propios o marca.
2. **Las 4 variantes `.web.tsx`** que el contador resta — no las abrí; no sé cuánto divergen de su par nativo.
3. **Las 62 + 53 piezas locales de app** — las conté y comparé por nombre y hash. **No leí ninguna**: no sé cuáles deberían subir a `ui`, ni cuántas re-implementan algo que ya existe. Las 4 que divergen entre apps quedan sin diagnóstico.
4. **`TokenGallery`** — sé que tiene 78 `<ThemeProvider>` y 695 estilos inline, y que R17 mide 213 exportaciones / 203 en galería / 10 exentas. **No la abrí ni la corrí.** No sé si un rediseño la rompe.
5. **Los diccionarios `i18n`** — no medí su tamaño, ni la paridad es↔en, ni cuánta voz toca el rediseño. Sólo miré el bloque `noCargo` y los pares fiscales.
6. **El peso del bundle hoy** — el dato de `fonts.ts` (−2,37 MB) es **heredado de S94-PERF**, no lo re-medí. No corrí `expo export`.
7. **El estado de los OTA y el runtime** — no consulté EAS. El canon dice runtime 1.0.7 y ancla `5d83a413`; **no lo verifiqué contra el objeto**.
8. **No corrí typecheck de nada.** No sé si `main` está verde en las cuatro puntas.
9. **La clasificación FORMA/VALOR de las 81 reglas es JUICIO, no medición** — el instrumento automático se cayó (§④) y no publiqué su número. Cada fila lleva la evidencia de por qué la clasifiqué así, pero **otra pista podría clasificar distinto tres o cuatro casos de borde** (R36, R37, R38, R39, donde la regla es de forma y el baseline es de valor).
10. **No medí qué regla de `verify:diseno` toca qué pieza.** Sé qué archivos nombra el script (161 rutas) pero no crucé regla × pieza, que es lo que diría exactamente qué gates se encienden al tocar cada componente.
11. **`apps/admin`** — leí sus tokens y conté sus hex. **No leí sus 5 pantallas** ni sé cuánto trabajo sería alinearlo, ni si debe alinearse.
12. **`../e-petplace-admin`** (portal legado) — medí su paleta desde afuera. No entré a su código, no sé qué pantallas tiene vivas ni quién lo usa hoy.
13. **`isotipo@2x.png` en Storage** (`marca-publica/`) — **no lo descargué ni lo comparé** con `packages/ui/assets/brand/isotipo-correo@2x.png`. No sé si son el mismo archivo.
14. **Los 8 `logo-estandar-0N0.svg`** — no los abrí. No sé qué distingue a uno del otro (¿versiones de la rampa? ¿pesos?), sólo que **ninguno tiene consumidor en código**.
15. **`apps/cliente/assets/expo.icon/` y su gemelo del prestador** — el formato nuevo de ícono de Apple. Los vi en el `find`, no los abrí.
16. **El baseline de R12** (168 pares, 5 de baseline, 1 exenta firmada, 1 regresión abierta) — **no lo desglosé**. Es el gate que más trabajo va a dar en un cambio de paleta y no sé qué pares son.
17. ~~No medí cuántas piezas leen un slot que memorial no tiene.~~ **MEDIDO al cerrar** — ver §① addendum. Lo que queda sin mirar es **si cada una de esas 21 lecturas está dentro de una rama que memorial nunca alcanza** (que es la explicación probable, y sería lo correcto): eso pide leer las 21, y no las leí.


---

## ⑨ LOS COMANDOS, PARA QUE CUALQUIERA REHAGA LA CUENTA

Todos corridos el **12-sep-2026** sobre `pista/s116-b` @ `ca564994`, desde la raíz del worktree.

```bash
# ① tokens
ls -la packages/ui/src/tokens/
wc -l packages/ui/src/tokens/*.ts packages/ui/src/themes/*.ts packages/ui/src/fonts.ts packages/ui/src/ThemeProvider.tsx
grep -oE '#[0-9A-Fa-f]{3,8}\b' packages/ui/src/tokens/palette.ts | wc -l          # 146
grep -cE "^  [a-zA-Z0-9_]+: +'#" packages/ui/src/tokens/palette.ts                 # 71
grep -cE '^  [a-zA-Z0-9_]+:' packages/ui/src/tokens/palette.ts                     # 130
sed -n '/^export const gradients/,/^} as const/p' packages/ui/src/tokens/palette.ts

# ② piezas
node scripts/verify-contador-piezas.mjs                                            # 186 · 127 wrappers
grep -rl '@epetplace/ui' apps/admin apps/pagos-web | wc -l                         # 0   (control: apps/cliente/src = 183)
find apps/cliente/src/components -name '*.tsx' | wc -l                             # 62
find apps/prestador/src/components -name '*.tsx' | wc -l                           # 53

# ③ glifos y marca
#   (union limpio de comentarios + registry parseado por entrada)
shasum -a 256 apps/{cliente,prestador}/assets/images/*.png
grep -o '#FF2D9B' packages/ui/src/tokens/palette.ts | wc -l                        # 1, y es un comentario

# ④ el lint
node scripts/verify-diseno.mjs ; echo "EXIT=$?"                                    # 81 líneas · 80 encienden · EXIT 0
grep -cE '^R[0-9]+ ' <(node scripts/verify-diseno.mjs)                             # 81
npx tsx scripts/verify-contrast.ts ; echo "EXIT=$?"                                # 436 pares · 0 fallos

# ⑤ pantallas
find apps/cliente/src/app   -name '*.tsx' | wc -l                                  # 112
find apps/prestador/src/app -name '*.tsx' | wc -l                                  # 93

# ⑥ fiscal
node scripts/s115/verify-{voz-de-sesion,reintento-visible,perfil-fantasma,siempre-se-pregunta}.mjs
npx tsx scripts/verify-plata.ts                                                    # 29 comprobaciones
npx tsx scripts/verify-identificacion-ec.ts                                        # 778 comprobaciones
grep -rln 'use-moneda\|useMoneda' apps packages --include='*.ts*' | grep -v node_modules
```

Los medidores que escribí para este parte (inventario de consumidores, censo de glifos, deuda de tokens, matriz de pantallas) **son de un solo uso y viven en el scratchpad de la sesión, no en el repo** — si algo de acá va a volver a medirse, hay que cablearlos como gate. *Un número que se mide una vez y no tiene comando en git es exactamente lo que `D-1015` prohíbe publicar.*
