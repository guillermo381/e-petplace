# GUÍA DEL REDISEÑO DEL PRESTADOR

> **Para quién es esto.** Para la pista que va a rehacer `apps/prestador` y **no estuvo en S116**. No es el resumen de lo que hicimos en el cliente: es **lo que costó descubrirlo**, que es lo único que no se puede volver a leer del código.
>
> **Cómo se lee.** Los §1 y §5 primero. El §1 dice qué **no** se puede copiar —y es donde se pierden los días—; el §5 son los modos de falla que nos costaron vueltas, cada uno con la medición que lo destapó. El resto se consulta.
>
> **Regla de esta guía, y vale para todo lo que escribas después:** cada número que publica **nombra su comando**. Un número sin comando no es una medición: es una afirmación con aspecto de medición, y se lee con la autoridad de la segunda. Medido contra el objeto el **15-sep-2026**.

---

## §1 · LO QUE NO SE PUEDE COPIAR DEL CLIENTE

Esto va primero a propósito. El reflejo natural al abrir el prestador es «aplicar lo mismo», y **hay cinco cosas donde eso produce una app rota o fea**, no una app rediseñada.

### 1.1 · La dosis es otra, y no es una preferencia de estilo

El cliente es **dosis alta** (capas visibles, gradiente firma, magenta). El prestador es **dosis baja**: *un* acento de capa por vista, sin gradiente de UI. **La razón está escrita desde S63 y sigue vigente: «tinta = decidir (cliente) · teal = trabajar (prestador)».**

⚠️ **Y el corolario que se olvida: sobriedad NO es ausencia de firma.** Una pantalla del prestador también tiene que tener un elemento por el que se la recuerde (Ley 15) — pero suele ser **de comportamiento**, no de color: la vista previa viva, la consecuencia visible, el dato que se actualiza mientras tocás. *Si copiás la dosis del cliente vas a tener una app alegre que el prestador siente que no es para trabajar; si copiás sólo «menos color», vas a tener una app gris sin firma.*

### 1.2 · Su acento es el teal oscuro, y ya está resuelto por casa

No hay que teñir nada a mano. **Las dos casas de oficio ya resuelven todo el bloque `accent` a teal**, y lo hacen en el tema, no en las pantallas:

```
grep -n "formaV5" packages/ui/src/themes/*.ts
# light.ts / dark.ts  → formaV5: true   (cliente)
# memorial.ts         → formaV5: false
# index.ts (2 casas de oficio) → formaV5: false + cta/control/active/glifo… = teal
```

⇒ **Si te encontrás escribiendo un hex teal en una pantalla, algo está mal**: o la pieza no lee del tema, o estás en la casa equivocada.

### 1.3 · `accent.formaV5` es el interruptor, y hoy el prestador lo tiene APAGADO

Es **un** booleano que responde una sola pregunta —*¿esta casa recibió el rediseño?*— y gobierna **geometría, tipografía y huella a la vez**.

🔴 **Ésta es la decisión más grande que vas a tomar, y es de mesa, no tuya:** prender `formaV5` en las casas de oficio cambia **15 piezas de golpe** en toda la app del prestador.

```
grep -rln "formaV5" packages/ui/src/components/*.tsx
# 15: AvatarMascota · Boton · Campo · CampoCodigo · CampoFecha · CeldaNavegacion ·
#     Confirmacion · Encabezado · Icono · PieReserva · SelectorDia · SelectorOpcion ·
#     StepperCantidad · Tarjeta · Texto
```

*No lo prendas «para ver cómo queda» en una rama que después vas a mergear: eso no es un experimento, es el rediseño entero sin gate.*

### 1.4 · DM Sans sigue viva ahí, y Baloo no llegó

El cliente v5 usa **Baloo** para la voz humana. El prestador **no**:

```
grep -rn "Baloo" apps/prestador/src | wc -l   →  0
grep -rn "Baloo" apps/cliente/src   | wc -l   →  1
```

⚠️ **Antes de llevar Baloo al prestador hay que decidir si su voz es la misma**, y probablemente no lo sea: Baloo es cálida y el prestador está trabajando. *La tipografía no se migra «por consistencia»: es parte de la dosis.*

### 1.5 · Los dos números que definen el tamaño del trabajo

**119 montajes de `<Campo>` en 47 archivos**, todos con la ley vieja (rótulo afuera):

```
grep -rn "<Campo" apps/prestador/src --include="*.tsx" | wc -l      → 119
grep -rln "<Campo" apps/prestador/src --include="*.tsx" | wc -l     →  47
grep -rn "<CampoFecha\|<CampoCodigo" apps/prestador/src | wc -l     →   6
```

> ⚠️ **La mesa venía manejando «98» y el objeto dice 119.** No es que el número anterior estuviera mal medido: es que **envejeció**. Publico el mío con su comando para que el próximo pueda hacer lo mismo en vez de heredarlo. *Es el §5.8 de esta guía ocurriéndole a esta guía mientras se escribe.*

**51 formateos de plata a mano** — y el contraste con el cliente es lo que dice cuánto duele:

```
grep -rnE "toFixed\(2\)" apps/prestador/src | wc -l   →  51
grep -rnE "toFixed\(2\)" apps/cliente/src   | wc -l   →   1
```

⇒ **El cliente ya centralizó la plata y el prestador no.** Cincuenta y un lugares donde el símbolo, los decimales y el redondeo se deciden por separado. *No es deuda estética: es la clase de cosa donde dos pantallas muestran distinto el mismo monto y nadie lo nota hasta que un prestador reclama.*

---

## §2 · LAS PIEZAS — QUÉ YA SIRVE Y QUÉ NO

**213 piezas** en `packages/ui/src/components` (`ls *.tsx | grep -v '\.web\.' | wc -l`). Se dividen en tres grupos, y el grupo decide cuánto trabajo es:

### (a) De la casa, y ya sirven para las dos apps — **la mayoría**
Las que **no** consultan `formaV5` se ven igual en las dos casas y **ya resuelven su color por tema**. Montalas y listo.

### (b) De la casa, pero cambian de forma por casa — **las 15 de §1.3**
Sirven en el prestador **hoy**, con su forma vieja. Cambian todas juntas el día que se prenda `formaV5`.

### (c) Nacidas para el cliente — **no se montan en el prestador sin mesa**
`FilaMascotas`, `IdentidadMascota`, `OndaAcceso`, `FilaAccionesCostura`, `HojaContenido` con fondo ciruela, `GrillaOficios`, `TarjetaPrestador`… Son piezas de **la experiencia de la familia**. Algunas podrían servir; **ninguna se asume**.

> 🔴 **La regla que ahorra el error más caro de esta categoría: `0` consumidores NO significa «no sirve» — significa «todavía nadie la montó».** El catálogo (`docs/CATALOGO_PIEZAS_V5.md`) publica la cuenta de hoy y **`pnpm verify:catalogo-v5` la verifica**, porque ya nos pasó que una pieza «entregada» estuviera en cero durante lotes enteros.

---

## §3 · LAS LEYES QUE CAMBIARON, Y EN QUÉ ORDEN

El orden importa: varias se enmendaron **a sí mismas** dos y tres veces, y leer sólo la última hace perder el porqué.

### 3.1 · N11 — la etiqueta del campo, **tres vueltas**
- **N11 (S99):** la etiqueta va **adentro**, quieta.
- **N11′ (S100):** se fue **afuera, arriba**.
- **N11″ (S116):** vuelve **adentro, flotando** — al tipear se achica y sube al borde, el valor queda abajo, el nombre del campo **siempre visible**. Muere el placeholder de ejemplo; **sobrevive el de búsqueda**.

⚠️ **Y la vuelta que no estaba en el plan:** la etiqueta flotante **pisaba la primera mitad de las letras del valor**. Se midió cero solape *sobre los bounds* y era **falso sobre lo que se ve** (§5.3). **Excepción declarada: `CampoCodigo`** — ocho casillas de un dígito no tienen dónde poner una etiqueta flotante, su rótulo vive arriba del grupo, y eso está escrito en el gate y en la pieza.

### 3.2 · El acento — el magenta se corrió un casillero
**«MAGENTA ACCIONA, CIRUELA SELECCIONA»**, y está escrito en `light.ts`. `accent.activoLleno` es el disco firmado de la barra; **lo que SELECCIONA es `accent.controlLleno`**. *Nos costó un lote entero: los días y horas elegidos salieron magenta porque se usó el slot del acento equivocado — y el slot correcto ya existía, con su uso declarado.*

### 3.3 · La curva de la hoja — el ciruela dejó de ser una tarjeta
Pasó a ser **el fondo**; el contenido vive en una hoja del color del lienzo que se apoya encima y **sube con el scroll**, con el fondo desvaneciéndose a medida que lo tapan. ⚠️ **El desvanecido se acopla al SCROLL, no a un temporizador** — una transición temporal se desincroniza del dedo.

### 3.4 · El isotipo — sólo donde preside
Es **identidad**, va en gradiente oficial y **está fuera de la contabilidad de dosis**, con un límite: **uno por pantalla**. ⚠️ El agua sangrada por los cuatro bordes **no** es un isotipo: es textura.

### 3.5 · El carrito y la letra blanca del CTA
El carrito ocupa el **slot derecho de la cabecera raíz** (y en la cabecera empujada **no está**, aunque se lo pases). La letra del CTA sale de **`accent.ctaTexto`**, no de un blanco a mano: en la casa de oficio el par es otro y un `#FFF` fijo rompe el contraste.

---

## §4 · LOS GATES — QUÉ MIDE CADA UNO

Dieciséis nacieron en esta sesión. Los que le importan a quien rediseña:

| gate | qué mide | su límite, declarado |
|---|---|---|
| `verify:catalogo-v5` | que cada pieza listada **exista, esté exportada** y su **cuenta de consumidores sea la de hoy** | no dice que las descripciones sean ciertas |
| `verify:etiqueta-dentro` | que ninguna pantalla dibuje un rótulo propio **encima** de un `Campo`, y que `Campo` no acepte placeholder de ejemplo | no mira píxeles: eso lo dice una captura |
| `verify:alto-con-texto` | **un alto fijo en dp que contiene texto es sospechoso** salvo que derive de la escala o sea piso y no jaula | entró como **ratchet con baseline 31/11**, no en cero |
| `verify:boton-alto` | que el alto que el botón dibuja sea el que su `tamaño` pide | no dice si «se ve bien» |
| `verify:techos-locales` · `verify:piezas-locales` | que una pantalla no se fabrique su propia versión de algo que ya es pieza | — |
| `verify:huella-por-casa` · `verify:isotipo-path` | que la marca se resuelva por tema y no a mano | — |
| `verify:assets-resuelven` | que un asset referido **exista y viaje** | §5.2 |
| `verify:reduced-motion` | que toda animación tenga su alternativa | — |
| `verify:contrast` | 504 pares, los tres temas base **+ las dos casas de oficio** | **sólo mide los pares DECLARADOS**: §5.4 |

> 🔴 **Un gate nuevo no se cablea hasta haber producido su ROJO sobre un caso real.** Y su primera prueba **no es que dé verde**: es que dé rojo sobre el primer caso real. *Un fixture escrito por el mismo que escribió el gate comparte sus supuestos.*

---

## §5 · LOS MODOS DE FALLA QUE NOS COSTARON VUELTAS

Esto es el corazón de la guía. **Ninguno de éstos produce un error**: todos producen una salida creíble, y por eso ninguno lo caza un typecheck.

### 5.1 · Una pieza entregada no está montada
La pieza existe, compila, está exportada, tiene su entrada de catálogo… y **ninguna pantalla la usa**. En esta casa se llama **«motor sin puerta»**, y apareció cuatro veces en un solo día. **Del lado del motor tiene su gemela:** una RPC no está entregada hasta que su **wrapper está exportado en `packages/api/src/index.ts`**.
> **Cómo se caza:** el catálogo publica consumidores y el gate los verifica. **Preguntá siempre «¿quién la monta?», no «¿existe?».**

### 5.2 · Un asset en el repo no viaja en el bundle
Un archivo puede estar commiteado, verse en el editor, y **no llegar al aparato**. *El repo no es el bundle.*
> **Cómo se caza:** `verify:assets-resuelven` + mirarlo en el teléfono. **Una imagen que no carga no siempre falla: a veces deja un hueco del color del fondo.**

### 5.3 · Un `bounds` no dice dónde cae la tinta
`uiautomator dump` devuelve la **caja declarada** de cada nodo. **El texto se dibuja más arriba de lo que su caja declara**, y una caja puede contar como suyo un espacio vacío. Medimos **cero solape sobre los bounds** mientras la etiqueta pisaba visiblemente las letras.
> **Cómo se caza:** **no midas bounds, mirá píxeles.** Recortá la franja, contá píxeles de tinta ahí, y adjuntá el recorte ampliado. ⚠️ Y calibrá el umbral **relativo**, no absoluto: un piso fijo en dp dio **falso rojo** sobre «1712345675» —sólo dígitos, sin descendentes—.

### 5.4 · Un gate verde sobre un corpus que no contiene el caso real
El de contraste mide **los pares declarados**. Un color nuevo que nadie declaró **no entra al corpus y el gate sigue verde**. Pasó con un aro sobre la banda ciruela: los dos candidatos desaparecían sobre el fondo y **ninguna medición lo iba a decir porque ese par nunca estuvo declarado**.
> **Cómo se caza:** al agregar un color o una superficie, **declarás el par o tu verde no dice nada de tu cambio**. La pregunta es *«¿este gate puede ver lo que acabo de hacer?»*.

### 5.5 · Un Metro que sirve un bundle viejo
`expo start` con el puerto ocupado **no falla**: ve el puerto tomado, imprime «Skipping dev server» y sigue. El aparato queda hablando con **el Metro anterior, que sirve otro árbol**. La captura sale perfecta y es de otro código. **Nos pasó cuatro veces.**
> **Cómo se caza, y es barato:** ① un `Android Bundled … (N modules)` **fechado después** de arrancar tu Metro; ② para lo que de verdad importa, **un marcador probado en LAS DOS direcciones** — ponés un color imposible, contás sus píxeles (**916**), lo sacás, y contás que dan **0**. *Confirmar que el cambio llega no alcanza: hay que confirmar que además se va, porque un marcador pegado prueba lo mismo que uno que nunca llegó.*

### 5.6 · El árbol de accesibilidad no refleja el `zIndex`
Lo que se ve encima no es lo que el lector de pantalla anuncia primero, y **el orden de pintado de Android no respeta al hermano**: una `elevation` de cualquier cosa montada en el fondo **sube su capa por encima de sus hermanos**. *Un fondo opaco tapado por un hermano que se pinta después sigue siendo opaco y se ve transparente igual* — la cura son `zIndex` explícitos, no un color.

### 5.7 · La escala de letra del sistema
🔴 **El que más nos costó.** En RN el `fontSize` **escala con la preferencia del sistema y las alturas en dp no**. Medido con el mismo campo: escala 1.0 → valor **23,0 dp** (limpio); escala 1.3 → **6,7 dp** (recortado). **Un emulador recién creado está en 1.0, que es la única escala donde el defecto no existe.**
> **Cura:** derivar las medidas de `PixelRatio.getFontScale()` **en cada render**, y que los altos sean **piso (`minHeight`), no jaula (`height`)`. ⛔ **`allowFontScaling={false}` NO es la salida**: ignora una preferencia de accesibilidad de la persona.
> ⚠️ **Y el borde abierto, honesto:** el founder **no** tiene la letra agrandada y aun así reportó el defecto. La cura a 1,3 es real y está verificada; **si con la letra en 1,0 sigue apareciendo, la causa es otra** — candidatas: densidad de su pantalla, la fuente propia de Samsung, o que la escala efectiva no sea 1,0 aunque el ajuste diga normal. *Se mide antes de volver a curar.*

### 5.8 · Un número publicado envejece en silencio
El contador de piezas decía **53 cuando eran 171**; el de wrappers, **26 cuando eran 122** (≈67 sesiones). **Y lo que los volvió invisibles es lo que parecía cuidado:** las dos cifras llevaban al lado su fecha y un «RE-MEDIDO». *Un número con su constancia al lado se lee como ya verificado, así que nadie va a ir a mirarlo.*
> **Cura, y ya es ley de la casa:** **el canon declara el COMANDO, no el número.** Si publicás una cifra, va con el comando que la produce. Lo vigila `verify:contador-piezas`.

### 5.9 · El instrumento que mide su propio vacío
**El que más veces se cobró en S116, y por lejos.** Un swipe que no llega, una hoja que no estaba abierta, una sección que **cabe entera** y por eso no scrollea, un `grep -c` sobre un XML de una sola línea. **Todos devuelven un número perfectamente creíble: cero.**
> **Cura:** todo instrumento se prueba **en las dos direcciones antes de creerle** —un control que debe dar 0 y uno que debe dar distinto de 0— y **verifica su precondición antes de medir**. *Sin ese control, «no se movió» y «no había nada que mover» dan exactamente el mismo número, y el segundo se lee como el primero.*

### 5.10 · Un `flex` que cambia de significado porque cambió su padre
`flex: 1` repartía **ancho** cuando el `TextInput` era hijo de una fila; al meterlo en una columna, el mismo `flex: 1` pasó a repartir **alto** y aplastó el campo de 23 dp a 11. **El flex no se movió ni cambió de valor: cambió su padre.**

### 5.11 · Una regla atada a un NOMBRE mide la convención, no el hecho
Un gate contaba piezas «con la etiqueta afuera» **por el nombre del archivo**. Curamos la pieza y **el contador no bajó**, porque el archivo seguía llamándose igual. *Se predijo que bajaría a 0 y no bajó — así se encontró.* **Atá las reglas a hechos verificables en el cuerpo, no a nombres.**

---

## §6 · EL ORDEN QUE YO SEGUIRÍA

1. **Medí primero, contra el objeto.** Qué contiene hoy cada techo del prestador y qué de eso **ya tiene pieza**. Es lo que más trabajo ahorra: varias veces el censo **achicó** el arco en vez de agrandarlo.
2. **La decisión de `formaV5` va a la mesa antes de la primera pantalla** (§1.3). Todo lo demás depende de ella.
3. **La plata antes que los campos.** Los 51 formateos son una frontera única y su cura es mecánica; los 119 campos dependen de la decisión anterior.
4. **Una pieza por caso real del censo, jamás «por si acaso».**
5. **Gate en el aparato por lote, con marcador probado en las dos direcciones.** Un lote sin captura no está cerrado: *ninguna medición reemplaza que se vea bien.*

---

> **Lo último, y es lo que más se olvida.** Casi todos los defectos graves de esta sesión los encontró **caminar**, no leer. Ninguno rompía nada: **todos funcionaban mal en silencio**, con el typecheck y los gates en verde. *Un gate verde puede significar menos de lo que dice su nombre* — por eso cada uno de arriba lleva escrito **qué NO mide**.
