# S98-B · HANDOFF FINAL — packages/ui · tokens · el lint y los jueces

**Fecha:** 16-ago-2026 · **Territorio:** `packages/ui` · tokens · el lint y
los jueces (criterio, no lista de archivos).

> **ESTO ES LO VIVO.** El registro doctrinal de la etapa —las 18 lecciones—
> vive en **`docs/relevamientos/2026-08-14-s97b-VOLCADO-CIERRE.md`** y no se
> duplica acá. El handoff anterior
> (`2026-08-15-s98b-HANDOFF-CIERRE.md`) queda **superado por éste**.

> ⚠️ **El teléfono no fue mío.** Todos mis verdes son **RN-web**. Nada de lo
> entregado en esta tanda tiene gate en dispositivo hecho por B.

---

## §1 · LA COLA, CERRADA

| # | Qué era | Estado |
|---|---|---|
| ① | El gate por ícono del ⓘ | ✅ **FIRMADO — va SIN HUELLA** |
| ② | D-813, la baldosa elegida con dos familias | ✅ **CURADO EN LA FUENTE, con candado** |
| ③ | Reduce-motion (4 de 63 piezas) | ✅ **8 de 8 de las que mueven, + R41** |
| ④ | Disponible para contratos de C | ✅ **Sin contratos pendientes** — C no pidió piezas en esta tanda |

**Y tres firmas del founder llegadas al final, las tres ejecutadas:** el ⓘ
sin huella · la Hoja **funde** con reduce-motion · el barrido de contraste
de las casas de oficio.

### Lo que cerró de paso
- ☠️ **La categoría «glifo de control»**, nombrada desde **S79** y con gate
  pendiente desde entonces. Su regla firmada: ***«en un glifo de control no
  hay mascota, hay interfaz; la huella se reserva para donde significa.»***
  Habitantes: `info` e `ia` —que deja de ser excepción suelta de S53—.
  Depositada por A en `DIRECCION_ARTE` **v1.7**.
- ☠️ **Mi propia exención de `comunidadAmplia`**, muerta a los cuatro días
  **como la diseñé**: le escribí dos salidas y se cumplió la segunda —la
  mesa decidió el piso—. *Una exención con condición de muerte no es un
  permiso: es una medición que caduca.*

---

## §2 · LO SERVIDO SIN DUEÑO — SIGUE VIVO

### 🟡 Los 27 avisos de clave duplicada en la galería del CLIENTE
`two children with the same key`, **27 por carga**. **Medidos como
PREEXISTENTES**: el mismo 27 con y sin el hunk de esta sesión, comprobado
revirtiéndolo. No es de esta tanda y no bloquea nada — es **higiene del
instrumento**, y su costo real es que ensucia toda captura de galería con
un toast rojo encima.
⚠️ **El primer discriminador que corrí para esto era INVÁLIDO** y conviene
saberlo: comparé contra `:8081`, que sirve la app del **prestador** —otra
galería—. La comparación que vale es revertir el propio hunk.

### 🟡 El doc de A quedó contradiciendo al código (**reportado a A, es de su territorio**)
`DIRECCION_ARTE` v1.7 dice en su encabezado *«NO se depositó la
reclasificación del par del avatar a 3:1… no hay firma del founder en el
repo»*. **Medido:** `a57fd1e4` (el doc) es **ancestro** de `66c24746` (la
reclasificación), y ese commit **tocó un solo archivo**. Cuando A lo
escribió era cierto; después llegó la firma y el doc no la siguió.
⇒ *Dos letras que se contradicen son peores que una equivocada* — con el
agravante de que acá **una de las dos es el código corriendo**.

### 🟢 El barrido de oficio: NO queda nada por barrer, y se puede afirmar
`getTheme` tiene **cinco resoluciones y solo cinco** —light, dark,
memorial, light·oficio, dark·oficio— porque **memorial ignora `cta`**
(`memorial JAMÁS celebra: tinta gane quien gane`, en su propio cuerpo). Las
cinco pasan hoy por `paresDe`. **No existe una casa memorial+oficio que
falte medir.**

### 🟢 Redundancia menor, medida y NO curada
Los one-offs de oficio (`muro oficio`, `CTA oficio`) viven **dentro** del
bucle por tema, así que se miden **5 veces** cada uno — usan `palette.*`
directo y no dependen del tema. Infla el conteo y agrega ruido; **no
miente**. Sacarlos del bucle es cosmético del instrumento y no lo hice para
no mover el número 331 en la misma tanda en que se firmó.

### 🟡 La `Hoja` bajo reduce-motion: lo que la firma NO cubrió
La firma pidió que **fundiera**, y funde. Lo que **sigue deslizando** es la
**vuelta del ARRASTRE** (soltar sin pasar el umbral), y es deliberado con
su razón escrita en el código: el imán de `SelectorDia` sí se volvió
instantáneo porque **viaja a un ítem al que el usuario no llegó**; esto
devuelve la hoja **a donde ya estaba**, deshaciendo el arrastre del propio
usuario. *Completar un gesto que alguien empezó con el dedo es
manipulación directa.* Si la mesa lo quiere instantáneo, es una línea.

---

## §3 · EL ESTADO DE LOS INSTRUMENTOS (medido al cierre, no de memoria)

| Instrumento | Estado |
|---|---|
| **`verify:diseno`** | **VERDE · 33 auto-pruebas** (la etapa empezó en 26 y esta tanda la dejó en 33) |
| **R41** *(nace acá)* | lo que se mueve de verdad mira `useReducedMotion` — **8 piezas mueven · 8 declaran el hook** |
| **R27** *(ensanchada)* | **cuatro slots** por ausencia: `control` · **`controlBg`** · `active` · `marcaEleccion` |
| **R30** | **0 re-dibujados** · **57 paths** del registry vigilados |
| **El registry** | **46 glifos**, medidos por **las dos vías con el MISMO conjunto** |
| **WCAG** | **331 pares · 0 fallos** — *tres temas base **+ las dos casas de oficio*** (eran 192 y solo los tres base) |
| **`verify-s98b-hoja-funde.mjs`** *(nace acá)* | verde por las **dos** preferencias |
| **tsc `packages/ui`** | **0** |

### ⚠️ Cómo se cuentan los glifos, porque yo me equivoqué contándolos
**Vía 1** = entradas del mapa (`^  nombre: ({`). **Vía 2** = miembros del
union, **acotando el bloque hasta el próximo `export|const|type|function` y
excluyendo las líneas de comentario**. Sin esas dos precauciones da 49 o 50:
la lápida de `'coach'` vive en un comentario y `aa`/`capa`/`tinta` son
valores de otro prop más abajo. **Es L-170 —«un censo lee los comentarios
como código si se lo permitís»— cobrada por quien la tenía escrita en su
propio lint.** El conjunto está sano; lo roto era mi medición.

### El límite de todos ellos, sin cambios
`tsc`, `verify:diseno` y WCAG **no ven** un truncado, un solapamiento, un
corte mudo, un rol de a11y mentido ni una grilla colapsada. En la etapa
anterior dieron VERDE sobre **nueve defectos reales**. *El lint protege
contra lo que ya sabemos nombrar.*

---

## §4 · LAS LEYES DE LA TANDA

Las 18 lecciones doctrinales están en el **volcado** (§ punteros). Lo que
esta tanda **agrega o afila**:

**⚖️ Un token puesto no es un token aplicado — y su forma más cara es el
ACOPLAMIENTO ENTRE DOS VALORES QUE CASUALMENTE COINCIDEN.** D-813 vivió
invisible porque la pieza nació en el CLIENTE, donde `accent.control` y el
tinte son la misma familia. *Un acoplamiento entre dos valores iguales no
tiene síntoma hasta que alguien los monta donde difieren.*

**⚖️ Una galería prueba las combinaciones que MONTA; la que no monta no da
verde ni rojo: no dice nada.** La pieza tenía tres paneles y los tres del
cliente. **El espécimen ausente era la causa de que el defecto no tuviera
síntoma** — no un espécimen mal montado.

**⚖️ Un instrumento puede estar verde por la razón equivocada, y la etiqueta
es por donde entra.** Tres cobros en la tanda: el gate WCAG medía
`capaBg.comunidad`, el token del que la pieza se fue · el par se llamaba
«Avatar **iniciales**» y el componente dibuja una **huella**, así que gateaba
una gráfica al mínimo de texto · y el flag que lo marcaba se llamaba `large`
y jamás midió texto grande (hallazgo de A, un piso más abajo que el mío).
***Mientras dijera «iniciales», el 4.5 parecía correcto.***

**⚖️ Encontrar que un gate mide de más NO autoriza a aflojarlo.** Serví la
reclasificación a la mesa con su medición y **no la apliqué**: bajar el
mínimo de un gate es decisión de mesa, no de la pista que lo encontró —
*un test que se ablanda para que pase deja de ser un test.* Lo que sí curé
fue el **nombre**, que es lo que lo había hecho invisible. La firma llegó
después y la aplicó A.

**⚖️ Bajar un piso solo es seguro si el piso todavía muerde.** Tras la
reclasificación produje el rojo a los DOS pisos (`2.48` contra mín 3, y los
de texto contra 4.5). *Una regla que ya no puede fallar no es una regla.*

**⚖️ Una exención sin condición de muerte es un permiso permanente.** La
mía contaba consumidores y caía sola; caducó en cuatro días.

**⚖️ El guard tiene que mirar lo que se va a usar, no lo que pasó antes.**
Tres veces en la tanda me salió verde por la razón equivocada: un guard que
verificaba que la sección EXISTIERA y no que la foto fuera **de** la sección
(PNG de 89.457 px) · un contador que buscaba `PRESTADOR` en toda la galería
y devolvió **40** · una comparación contra el Metro de C, **que sirve otra
app**.

**⚖️ Un rojo SIMÉTRICO delata al instrumento, no al código.** El
discriminador de la Hoja falló en las DOS preferencias, incluida la que no
toqué. *Un cambio que solo toca un camino no puede romper los dos.* Causa:
dos elementos con `accessibilityLabel="Cerrar"` y un `.catch(() => {})` que
se tragaba el click fallido.

**⚖️ Una regla escrita en el header puede estar desobedecida en el mismo
archivo.** El rebote del arrastre de `Hoja` no honraba memorial —*«En
memorial NADA rebota»*, en su primera pantalla— 260 líneas más abajo. **La
huella estaba a la vista: `esMemorial` figuraba en las dependencias del
`useMemo` y el cuerpo no lo consumía.** *Una dependencia sin consumidor es
una intención que no llegó al cuerpo.*

**⚖️ Reducir movimiento es quitarle el VIAJE, no el momento — y no todo
viaje es autónomo.** El escalonado se conserva entero (sostiene el orden de
lectura). El imán que va a donde el usuario **no llegó** entra bajo la
preferencia; la vuelta que deshace **su propio arrastre**, no.

**⚖️ Y una de forma, propia: el hook se llama SUELTO y se combina después.**
`memorial || useReducedMotion()` es más corto y es una llamada
**condicional** a un hook. Las cuatro piezas que ya lo tenían lo hacían
bien; el desvío fue mío y quedó escrito en el código porque la forma corta
se ve bien.

---

## §5 · PUNTEROS

- **Doctrina de la etapa:** `docs/relevamientos/2026-08-14-s97b-VOLCADO-CIERRE.md` (18 lecciones)
- **El Norte:** `DIRECCION_ARTE` **§13** (N1–N10, con la escala de ceremonia) · su hermana mecánica: **R36–R39**
- **La regla del glifo de control:** `DIRECCION_ARTE` **v1.7** — Ley 9 gana su alcance · §6b gana su paso 6
- **La escalera de caras:** `DIRECCION_ARTE` **§2.11**
- **Capturas de la tanda:** `scripts/capturas/s98-b-gate-info/` (el ⓘ firmado) · `s98-b-d813/` (antes/después en las dos casas) · `s98-b-oficio/` (el par de 4.40)
- **Handoffs hermanos:** los de A y C en el mismo directorio

---

## §6 · LO QUE SOLO CIERRA UN TELÉFONO

1. **🔴 La `Hoja` fundiendo.** El instrumento prueba que **cierra** (la
   lógica); **no prueba cómo se ve el fundido**, y es la pieza más
   frecuente de las dos apps.
2. **La baldosa elegida del PRESTADOR** — borde y relleno en la misma
   familia. Se midió al píxel en dispositivo cuando estaba rota; el después
   solo se vio en RN-web.
3. **El ⓘ a 21 px en pantalla real.** Firmado sobre captura RN-web.
4. **`EsperaDeMarca` quieta** con la preferencia activa — el único
   `withRepeat` de la casa.
5. **La rueda de `SelectorDia` saltando** en vez de deslizarse.

---

**Medido al cierre:** árbol en **0** · `HEAD == origin/main` · tsc `ui` = 0
· `verify:diseno` **VERDE, 33 auto-pruebas** · **WCAG 331 / 0** · el
discriminador de la Hoja verde por las dos preferencias · todo verificado
en `origin/main` **por contenido**.
