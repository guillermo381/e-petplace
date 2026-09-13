# S116-B · LOTE 2 — el shell y las piezas base

> **Worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-b-02` · rama `pista/s116-b-02` · partí de `main` @ `79c8167bf7f5770ae77ce9fbc10aca7598346032` (`79c8167b`), que ya trae el 65 % firmado y mi lote 1 mergeado.**
> Medido el **13-sep-2026**. Un commit por pieza, pusheado.
> **🔴 EL LOTE NO ESTÁ COMPLETO.** Nueve de los dieciocho puntos están hechos; los otros nueve no se empezaron y están listados en §④ con lo que cada uno necesita. *Se declara arriba y no al final, porque un parte que esconde el alcance al final es un parte que se lee como si estuviera entero.*

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

## ④ 🔴 LO QUE NO ALCANCÉ — nueve puntos, con lo que le falta a cada uno

| punto | pieza | qué falta |
|:-:|---|---|
| **2** | **`BarraTabs` de cinco** | La pieza más grande que queda. Necesita: el círculo magenta que **viaja** entre destinos (Reanimated, sin rebote), el borde del lienzo, la poda de pila (hoy en `(tabs)/_layout.tsx:696`) y **el enganche `onMontaje`** que E va a usar para medir memoria. |
| **5b** | **`FilaDato`** (etiqueta izq / valor der, editable) | La pieza existe con otro contrato (apilada). El punto pide la **horizontal**, que ya estaba registrada como candidata desde S71 sin construir. |
| **6** | **`Chip` con la pata que pisa** | En la casa el chip son `FiltroPills` y `SelectorOpcion`. Falta la **huella blanca que pisa** al elegir, con la física S62. |
| **9** | **`FilaLista`** | Contenedor blanco con filas separadas, glifo magenta en círculo rosa, chevrón tenue. Hoy son `Celda` y `CeldaNavegacion`. |
| **11** | **`Confirmacion`** | La pantalla de «¡Listo!» — check que crece, seis destellos, trío de personajes, tarjeta plana con el dato. **`TrioPersonajes` ya está**, que es su mitad. |
| **13** | **`Logo` e `Isotipo` v5** | Los assets **están ingeridos** (`marca/`); falta la pieza y la lápida de `gradients.logo`. |
| **14** | **`EsperaDeMarca` rehecha** | Hoy respira la huella; la letra pide **la nariz**. |
| **15** | **`AvatarMascota`** con el personaje como fallback | Hoy cae a una huella. `Personaje` ya existe, así que es un cambio chico. |
| **17** | **`StepperCantidad`** v5 | «−» en círculo blanco, «+» en círculo magenta lleno. |
| **18** | **Los glifos** — 17 nuevos + 17 alias + **la silueta de nariz** | **Es un lote propio.** Incluye la hoja de contacto (método §6b) y la precisión (b): la silueta para notificación de Android, con captura a 24 y 48. *Mi medición del lote 1 ya dice que en silueta blanca la nariz **no se lee a 24 px** — así que ese glifo no es un recorte del isotipo: hay que dibujarlo.* |

**Ninguno se empezó.** No hay medio trabajo escondido en la rama.

---

## ⑤ LO QUE SE VERIFICA

```
npx tsc --noEmit -p packages/ui      → EXIT 0
npx tsc --noEmit -p packages/api     → EXIT 0
npx tsc --noEmit -p apps/cliente     → EXIT 0
npx tsc --noEmit -p apps/prestador   → EXIT 0
node scripts/verify-diseno.mjs       → EXIT 0 · VERDE (auto-prueba: 80 reglas)
npx tsx scripts/verify-contrast.ts   → EXIT 0 · 450 pares · 0 fallo(s)
```

### Las capturas

`docs/loop/capturas-s116-b-lote2/piezas-v5-montadas.png` — **212 KB en total** (precisión (d): a la resolución mínima que muestra lo que hay que ver).

**`Android Bundled … (3083 modules)` a las 13:54:55 del 13-sep**, con `Starting project at .../e-petplace-s116-b-02/apps/cliente`. *Son 12 módulos más que el lote 1 (3071): las piezas nuevas.* Emulador propio (`Pixel_10_Pro_XL`, puerto 5566, `adb -s` siempre); binario `com.epetplace.cliente` **1.0.7**.

La segunda captura cayó en la revisión del carnet **por accidente de navegación y resultó mejor evidencia**: muestra **cuatro piezas rediseñadas a la vez** — botón píldora magenta, botón terciario en rosa tinte, campo con radio 18 y tarjeta plana.

---

## ⑥ TRES HALLAZGOS QUE VALEN MÁS QUE SU CURA

**① `@3x` no es parte del nombre: es una instrucción al bundler.** Ingerí los assets del lote 1 como `perro@3x.png` y **Metro no los resolvió**: *«Unable to resolve "../../assets/personajes/perro@3x.png"»*. El sufijo `@nx` **es la densidad de pantalla**, así que Metro busca el archivo BASE y toma `@3x` como una variante; con sólo la variante, no encuentra nada. *El nombre parecía documentación —«esto está a 3×»— y era una orden.* Renombrados a nombre plano. **El lote 1 pasó typecheck, `verify:diseno` y `verify:contrast` con este defecto adentro: lo encontró el primer bundle.**

**② El typecheck de `packages/ui` NO alcanza para una pieza nueva — dos veces en el lote.** `ReturnType<typeof require>` compila en el paquete y resuelve a `unknown` bajo la config de `apps/prestador`; y `estiloPresionado` en el `style` de un `Pressable` compila en el paquete y rompe el `ViewStyle` de la app. **Las dos las cazó el gate del hook, que compila las apps.** *Un verde del paquete es un verde sobre un tsconfig que ningún usuario ejecuta.*

**③ `R4` y `R17` hicieron su trabajo sin que nadie las llamara.** R17 frenó las seis piezas nuevas hasta que entraron a la galería (Ley 11 mecanizada) y R4 me frenó el halo escrito a mano, que terminó siendo el token `halo.foco`. *Las dos reglas convirtieron un atajo mío en la pieza correcta.*
