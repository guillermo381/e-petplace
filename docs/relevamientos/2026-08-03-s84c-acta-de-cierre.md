# S84-C — ACTA DE CIERRE

**Qué es esto:** lo que un C-nuevo NO puede reconstruir leyendo el repo.
Lo que ya está en el código —qué hace cada pantalla, qué se commiteó, qué
comentario explica qué— queda AFUERA a propósito. Acá viven los
**argumentos**, las **curas descartadas** y las **mediciones que no
dejaron rastro en ningún commit**.

Rama `s83-c` · **enmendada al cierre de S84** (§7 y §8 cubren C33 · C34 ·
C35; §5 quedó DEROGADA porque su pendiente se curó).

---

## 1. LOS NUEVE FRENOS — con su argumento, no su lista

El número solo no dice nada. Lo que vale es **por qué** cada uno paró, y
qué habría costado no parar.

### ① C10 — la portada a sangre sobre un muro ya gateado
La orden mandaba la vitrina en su lugar, y su primer bloque era la
portada **a sangre arriba** — o sea, ocupando el lugar del muro del
espejo, que **ya había pasado su gate**.

**El argumento:** no existía tabla de fotos, así que la portada no podía
mostrar ninguna. Ponerla igual significaba **reemplazar una composición
firmada por una invitación vacía PERMANENTE**, hasta que llegara el
motor. La pantalla habría quedado **peor que antes** durante un tiempo
indefinido — y "peor mientras tanto" no es un precio que una pista pueda
pagar por el founder.

**Lo que lo distinguía de un capricho:** con datos de ejemplo en una
ruta aparte el problema no existía. **La enmienda del método (lo nuevo
va directo a su lugar) fue la que creó el riesgo**, y por eso el freno
mordía ahí y no antes. Es el caso (2) que la propia enmienda conserva.

**Cómo se levantó:** no esperando el motor, sino por diseño de B — el
estado vacío de portada depende de `onAgregarFotos`. Con handler (el
espejo) hay invitación; sin handler (la familia) **la portada no se
monta**. Y en el espejo la invitación **no ocupa el lugar de nada**,
porque es pantalla nueva.

### ② C13 — el carrusel no era mío
Un carrusel circular con paginación vive **dentro de la portada de
`FichaPrestador`**. Dibujarlo en mi pantalla habría hecho nacer **la
segunda ficha por otra puerta**: el día que el cliente muestre portadas,
se copia.

**Y esa copia ya tenía antecedente medido en esta misma pantalla:** el
espejo mintió DOS veces por dibujar a mano lo que debía montar (el
oficio clavado en `"paseador · quito"` y la visibilidad clavada en `true`).

### ③ C13/C14 — el botón de IA con glifo y sin conducta
Me dieron el glifo (`ia`, tinta, color explícito) y **cero letra de
comportamiento**. Montarlo habría exigido inventar qué hace una IA en la
vitrina — decisión de producto, no de composición. **Un botón con glifo
firmado y sin conducta es una promesa que no se puede cumplir.**

### ④ C14 — la conducta llegó sin puente
`MODELO_PRESENCIA` §5 dio la conducta entera. Pero la edge function
`escribir-presencia` **existía sin wrapper**, y la app jamás llama a una
function directo.

**El segundo motivo, que es el que importa:** el mapeo de los seis
códigos a voz **es contrato, no cosmética**. Escrito en la pantalla, el
día que A cambiara un código el error se degradaría **en silencio**.

### ⑤ C16 — el clip: lo cablié, lo vi caer, lo reverté
No existía captura de video de galería (`capturaFoto.tsx` es
`mediaTypes:['images']`, y es de B). La única captura de video de la app
es `CameraView.recordAsync` en clips de adiestramiento — **una pantalla
de cámara entera, no un helper**, y grabar en vivo no es lo que el caso
pide: el clip de la vitrina es material que ya está hecho.

**Por qué revertí en vez de dejar un picker local:** duplicar la
frontera de captura es exactamente lo que L-175 persigue, y **habría
sido la segunda copia el mismo día que la primera**. Un picker local
funciona hoy y se desincroniza en tres sesiones, cuando alguien cure el
de B y nadie sepa que había otro.

### ⑥ C18 — `modo` en la function y no en el wrapper
La edge function soportaba `'alternativa'` entera; el wrapper no lo
declaraba ni lo reenviaba. Forzarlo con un cast habría mandado un campo
que **el wrapper no reenvía** — o sea: el botón prometiendo variar y el
motor mejorando. Exactamente el defecto que la orden quería evitar.

### ⑦ C22 — el mapa, con la sede exacta a mano
`MiPrestador` traía `lat`/`lon` **a un tipeo de distancia** y ninguna
columna de zona.

**Lo que hacía peligroso construir:** pasar la sede **compilaba y se veía
MEJOR** — un mapa centrado en el negocio parece más correcto que uno
desplazado. El defecto habría sido **invisible al ojo y solo legible en
el código**.

**Y en ESA pantalla pesa doble:** el espejo muestra lo que ve la familia.
Con la sede exacta, el prestador creería que la familia ve su ubicación
real cuando la vista fue angostada para que no (D-624) — **el espejo
pasaría de mostrar la verdad a certificar una mentira**.

### ⑧ C24 — el ocre no existía como token
Cero en `tokens/palette.ts`, cero en `themes/index.ts`. Montarlo exigía
**hex crudo en la app** (Ley 1 directa) y además **perdía los dos
registros** (5.72 / 9.73), que son lo que hace que el color sirva en las
dos superficies.

### ⑨ C24 — mudar cuenta comercial rompía tres llamadores
`liquidaciones:210` · `sala-espera:196` · `negocio:334`. **Mover la
ENTRADA era una línea; mudar las pantallas rompía a los tres.**

### El que no cuento pero vale
En C24 escribí la prop `zonaVacia` para la pieza de B **y la retiré antes
de que compilara**. No llegó a ser freno porque no llegó a existir — pero
es el mismo reflejo, y aparece más rápido cada vez.

---

## 2. LAS CURAS QUE DESCARTÉ, con su razón

### Igualar hacia abajo el glifo de "Cómo te contactan"
Dos secciones tenían glifo y una no, y el registry no tenía ninguno que
no mintiera (`compartir` es compartir, `ayuda` es soporte, `nombre` es
identidad).

**La salida fácil era quitarles el glifo a las otras dos.** Cumple la
simetría **y rompe justo lo que la Ley 12 busca**: que el ojo separe
headers que significan cosas distintas. **La simetría no es el fin; es el
síntoma de que la ley se cumplió.** Se igualó hacia arriba, pidiendo el
glifo con su gate.

### Drag-to-reorder para las fotos
El arrastre **pelea con el gesto del scroll del contenedor**: sacar un
ítem *de* un `ScrollView` horizontal para reordenarlo es un conflicto de
gestos, y resolverlo bien es **una pieza de gestos, no una prop**.
Se eligió **un paso por toque**, en las dos direcciones.

**⚠️ Y la evidencia del carrusel NO derriba esto**, aunque comparta la
palabra "gesto": B probó que un `ScrollView` horizontal **pagina** limpio
en Android. Paginar es scroll nativo; arrastrar un ítem fuera del scroll
es otra cosa. **Su condición de derribo, escrita:** que alguien mida un
drag-to-reorder real dentro de un ScrollView horizontal en Android y no
tironee.

### Unificar los dos Guardar de "Dónde atendés"
`SeccionSede` no tiene una escritura sino **DOS** (`{tipo:'direccion'}`
con botón y `{tipo:'radio'}` que guarda **solo al moverlo**). Unificarlas
exigía subir cinco estados de un componente de 246 líneas —coordenadas
de Places incluidas— o ensanchar el wrapper, que es de A.

**Y el costo real no era mecánico:** el Guardar de arriba pasaría a hacer
**dos escrituras que pueden fallar por separado** — una dirección
guardada con un radio que no, **sin forma de decirlo en un solo aviso**.
Entre dos guardados honestos y uno que puede mentir a medias, ganó la
honestidad; lo que se curó fue que el usuario no lo descubriera solo.

---

## 3. MIS CORRECCIONES DE MÉTODO — los patrones propios que cobraron

### "Porté la composición y no porté el dato" — CUATRO veces, todas en la misma pantalla
1. **El logo** (`onEditarLogo={() => undefined}`): un handler vacío que
   compila, renderiza y no hace nada.
2. **La alineación de la bandera**: la declaré curada **por construcción,
   no por pantalla** (L-153 contra quien construye).
3. **La visibilidad del espejo**: la pantalla vieja **sí** computaba
   `visible`; el cableado perdió el cómputo y quedó clavada en `true`.
4. **El control del clip**: construí el lugar y nunca cablié la subida.

**El patrón es uno solo y no se cura leyendo el diff:** al portar una
composición, el ojo verifica que *se vea* igual — y un dato que no llega
**se ve igual**. La verificación tiene que ser sobre el DATO, no sobre el
render.

### El barrido case-sensitive
Reporté **"el voseo es UNA"**. Eran **cuatro**. Los imperativos voseantes
**abren oración**, o sea que viven en mayúscula: **el punto ciego estaba
exactamente donde vivía lo que buscaba.**
**Lo que la hace peligrosa: el número era plausible.** Un barrido que
devuelve 0 se desconfía solo; uno que devuelve 1 se cree.

### El preview que NO estaba roto
La hipótesis era "lectura vieja". **Falsa:** `como-te-ven` usa
`useFocusEffect` (relee en cada foco) y las fotos **persisten al
subirlas**. Lo que el founder no veía era **su historia**, que es
borrador hasta el Guardar. **El espejo decía la verdad** — lo que faltaba
era la otra mitad de la regla: **que ofreciera guardar**.
**Sin medir, habría "curado" un cache que no existía.**

### El copy que envejece
`clipVacio` decía *"todavía no está disponible: llega con la próxima
versión"*. **Nació verdadera y se volvió falsa sin que nadie la tocara**,
cuando A entregó el lib. Y encima **desalentaba el uso**.
La regla que salió: **una cadena que declara el estado de NUESTRA
construcción nace con su condición de muerte al lado.**
**La distinción que la hace aplicable** (y sin ella es inaplicable): las
cadenas que describen el estado del **dato del usuario** —"todavía no
cargaste tu contacto"— **no envejecen nunca**, porque se computan y se
corrigen solas. **La prueba: ¿deja de ser verdad cuando el USUARIO hace
algo, o cuando NOSOTROS entregamos algo?**

---

## 4. LO QUE MEDÍ Y NO ESTÁ EN NINGÚN COMMIT

**Cuenta comercial** — tres pantallas (`index` · `nueva` · `bancarios`) y
**tres entradas externas vivas**: `liquidaciones:210`, `sala-espera:196`,
`negocio:334`. **No son duplicados: son contextos** (cobrar · entrar ·
gestionar).

**Los documentos** — **no tienen pantalla propia**: viven dentro de
`veterinaria/verificacion.tsx`. La consecuencia que la mesa encuadró y
es mayor que la ubicación: **un paseador o un groomer no tiene dónde
subir los suyos** ⇒ **~~D-630~~ D-632** (ver la corrección de número
abajo), sin fecha, letra antes que pantalla.

### ENMIENDA S84-C29 ④ — EL NÚMERO ESTABA OCUPADO, y el conteo lo dice

**Esta acta reservó `D-630` para los documentos. `D-630` ya existe y es
otra cosa:** *"EL BURN-DOWN DE LA REGLA 81"* (`DEUDAS_CANONICAS.md:4372`,
firmada por el founder en S84). **Gana el archivo canónico**, no esta
acta: una mención en un relevamiento no reserva un número.

Medido por grep sobre `DEUDAS_CANONICAS.md` —**jamás de memoria**, que es
exactamente cómo se produjo el choque— el último ocupado es **D-631**
(`keyboardShouldPersistTaps` en siete pantallas más, la que A abrió con
mi alcance). **El libre es D-632.**

**LA MEDICIÓN QUE LA FICHA NECESITA — tres llamadores, los tres gateados
al mismo oficio:**
- `sala-espera.tsx:215` — dentro de `{esVet && (…)}`
- `veterinaria/index.tsx:212` y `:255` — dentro del mundo vet, al que se
  entra por `negocio.tsx:298` (`mundoVeterinaria`)

⇒ **un prestador NO veterinario tiene CERO caminos a subir documentos.**
No es que estén escondidos: **no existen para él.**

**Y por qué eso es más grave que una pantalla mal ubicada:** el sello de
verificación es de PLATAFORMA — es lo que una familia lee para confiar.
**Un sello que solo puede ganarse un oficio no es un sello de
plataforma**, es una credencial de veterinarios con nombre de sello. Un
paseador con antecedentes limpios y un groomer con su certificado no
tienen cómo probarlo, y la familia no tiene cómo distinguirlos de quien
no los tiene.

**LA PANTALLA NO SE MUEVE (orden de la mesa, y la comparto):** el hueco
no es de ubicación sino de LETRA — qué documento pide cada oficio, quién
lo aprueba y qué sello otorga. Mover `verificacion.tsx` a un lugar común
sin esa letra le daría a un paseador un formulario que pide credencial
médica. **Letra antes que pantalla.**

**EL NOMBRE DEL DOCUMENTO — FIRMA DE LA MESA (S84-C32), y entra al
literal porque es lo primero que se pierde entre sesiones:**

**Viene del CATÁLOGO. No se hardcodea.** La regla *persona_natural →
cédula · las otras tres → RUC* es verdadera **en Ecuador y el nombre no
viaja**: en Colombia una persona jurídica tiene **NIT**, no RUC. Y como
el país del documento **SE ELIGE** (firmado en C31), la pantalla va a
estar en EC mostrando un documento de otro país — hardcodear "RUC" la
hace mentir **apenas alguien elija Colombia**.

**Y LA SALIDA SI EL CATÁLOGO NO LLEGA A TIEMPO — que es la parte que
importa, porque es la que se improvisa mal bajo presión:** *no* se
hardcodea igual "por ahora". **La pantalla NO LO NOMBRA** y dice **"tu
identificación fiscal"** — genérico y **verdadero en los dos países**,
en vez de específico y falso en uno. Es Ley 13 y L-139 en la misma
frase: **el dato que no se tiene no se rellena con el que suena bien.**

*Lo medido que sostiene esto: `obtenerPaisesParaRegistro()` ya devuelve
`tiposFiscales` **y** `mascaraPorTipo` por país (`cat_paises.mascara_id_fiscal`)
— la VALIDACIÓN del número no hay que inventarla. Lo que **no** trae hoy
es el NOMBRE, y ése es el hueco exacto del ensanche de A.*

*(Territorio: el número y la ficha son de A — `DEUDAS_CANONICAS.md` es
suyo. Esto es el literal para que lo deposite, no la ficha.)*

**El censo del voseo** — ~20 cadenas con "todavía no / aún no" en el
prestador, y **la gran mayoría NO tiene el defecto** (son estado del dato
del usuario). El hermano real del clip es
`salaEspera.empleadoDetalle` (`i18n/es.ts:63`): *"tu acceso… todavía no
está disponible en la app"* — misma clase, **no curado**.

**El bilingüe** (`{es, en}` del escriba) — **cero pares bilingües en toda
la DB**: la casa nunca guardó contenido de usuario en dos idiomas. Y
**nadie muestra la descripción de un prestador a una familia** todavía:
sus únicos consumidores son el espejo y el taller. **El problema real no
es la columna: es la SINCRONIZACIÓN** — el prestador edita a mano, el
`es` cambia, el `en` queda viejo, **y nadie se entera porque el afectado
no habla el idioma del error.**

**La zona del mapa** — 7 prestadores: 6 activos y en la vista, 1
`en_revision` afuera. De los 6, **3 tienen zona (radio 500) y 3 no — y
son exactamente los tres sin `lat`**. El mapa no falta por bug: **falta
porque la sede nunca se capturó.**

---

## 5. ~~EL PENDIENTE VIVO~~ — PLACES BAJO EL TECLADO · **CURADO EN C34 ⑤**

> ⚠️ **ESTA SECCIÓN SE ENMIENDA EN SU TÍTULO Y NO SOLO AL PIE, a propósito.**
> Decía "EL PENDIENTE VIVO" y **el pendiente ya no vive**: la cura entró en
> `a26f2ed`. Un acta que sigue anunciando roto lo que está arreglado manda
> a la próxima instancia a curar dos veces — y es el mismo defecto que este
> documento existe para no tener. Lo de abajo se conserva **como el rastro
> de la medición**, que sigue siendo el porqué de la forma que tomó la cura.
> **Lo que SÍ queda pendiente es su GATE en dispositivo** (ver §7).


**Lo que sé, medido, para que la próxima instancia no arranque de cero:**

- El campo vive en `apps/prestador/src/components/seccion-sede.tsx`.
  Las predicciones se pintan **INLINE, en flujo normal, justo debajo del
  `Campo`** (línea ~192: `{predicciones.length > 0 ? (<View>…` con una
  `Celda` por predicción). **No hay `position:'absolute'`, ni `zIndex`,
  ni overlay** — son contenido más del scroll.
- El Perfil las envuelve en `EvitaTeclado` (`perfil.tsx:820`), que es
  `KeyboardAvoidingView` con **`behavior="padding"` en las dos
  plataformas** desde S83-B (antes era `height` en Android, y ése era el
  bug del scroll trabado).
- **La hipótesis que NO verifiqué en dispositivo:** al enfocar el campo
  de dirección, el teclado sube y las predicciones nacen **debajo** —
  dentro del área que el teclado tapa. `EvitaTeclado` empuja el
  contenedor, pero **no hace scroll hacia el elemento**: el auto-scroll
  al foco lo hace el `ScrollView` con el campo, y las predicciones
  **aparecen DESPUÉS** (debounce 350 ms), cuando el scroll ya ocurrió.
- **Por eso la cura probable NO es de `EvitaTeclado`:** es que la lista,
  al aparecer, **pida su propio scroll** (`scrollTo`/`measureLayout` sobre
  el contenedor) o que la sección se desplace lo suficiente. Es del
  consumidor, no de la pieza de B.
- **Lo que hay que medir primero:** si las predicciones se ven al
  aparecer, o solo se ven **scrolleando a mano**. Los dos síntomas se
  parecen y tienen curas distintas — uno es de scroll automático y el
  otro de alto disponible.

### ENMIENDA S84-C28 (2-ago) — el founder lo confirmó en dispositivo, y la medición encontró el patrón de la casa

**CÓMO SE ENCUADRA, y es lo que importa para el 1-oct: no es defecto
nuevo — vive desde S79, cuando Places entró.** Nadie lo encontró porque
**nadie tenía motivo para llegar**: la sede se cargaba una vez, sin nada
que la recompensara. **Lo destapó el mapa** — recién con la vitrina
mostrando la zona alguien tuvo razón para escribir una dirección de
verdad. *Un defecto de entrada solo aparece cuando algo le da valor a la
entrada; hasta entonces el camino existe y nadie lo camina.*
**El founder lo encontró porque sabía que estaba ahí. Cualquier otro
concluye que el buscador no funciona.**

**① DÓNDE VIVE — dos consumidores, ninguno en Hoja, y NO son iguales:**
  · `cuenta/perfil.tsx:1185` — dentro de `EvitaTeclado` > `ScrollView`
    (`keyboardShouldPersistTaps="handled"`), y además dentro de la
    CUARTA `SeccionDesplegable`. El acordeón abre **una a la vez**
    (`setAbierta((a) => (a === s ? null : s))`), así que con "Dónde
    atendés" abierta las otras están plegadas.
  · `sala-espera.tsx:215` — `ScrollView` **SIN `EvitaTeclado` y SIN
    `keyboardShouldPersistTaps`**. Ver ⚠️ abajo: ahí hay DOS defectos
    más, y uno es peor que este.
  · **Ninguno es Hoja** ⇒ el borde de Hoja que la propuesta temía no
    existe. *(El gemelo del cliente sí vive en Hoja a veces —
    `direccion-hogar-form` en el checkout— pero son dos archivos
    gemelos, no una pieza compartida: curar acá no lo toca.)*

**② EL ESPACIO — NO ES MEDIBLE DESDE EL REPO, y digo por qué no bloquea.**
Depende del alto del teclado del dispositivo. **Pero la cura de ③ no
necesita ese número**: no acomoda la lista en el hueco que sobra — lleva
el campo arriba y le entrega a la lista *todo* el alto restante. Si la
lista de 5 no entra entera, entra la primera opción y el resto scrollea,
que es exactamente lo que hoy no pasa.

**③ SÍ EXISTE PATRÓN EN LA CASA — Y NO ES OVERLAY. Esto contradice la
propuesta, y por eso lo levanto antes de construir.** La casa resuelve
"algo apareció y hay que verlo" con **scroll medido**, dos veces, una en
cada app, con la MISMA receta (`onLayout` → `posiciones.current` →
`scrollTo({ y: Math.max(0, y - spacing[4]) })`):
  · `apps/prestador/src/app/veterinaria/taller.tsx:348` — el ancla del
    lápiz, `animated: false`.
  · `apps/cliente/src/app/carnet.tsx:279` — la ficha rechazada por
    `item_invalido`, `animated: true`.
De los 27 `position:'absolute'` de las dos apps, **ninguno es un menú
flotante**: son techos, filtros, encuadre de foto y el ícono animado.
**Un overlay sobre un campo sería el primero de la casa** — y L-175 dice
que antes de pedir pieza nueva se lee lo que hay.

**⇒ EL FRENO NO DISPARA: la cura no pide pieza de overlay en
`packages/ui`.** Lo único que cruza frontera es plumbing propio: el
`ScrollView` lo tiene la PANTALLA y el campo lo tiene `SeccionSede`, así
que la pieza necesita **una prop para pedir vista** y los dos
consumidores se la pasan. Cero componente nuevo, cero `absolute`, cero
`zIndex`, cero costo de B.

**DESCARTADAS, con su porqué:**
  · **Empujar con `KeyboardAvoidingView`** — descartada porque **ya está
    puesta y es justamente lo que no alcanza**: `EvitaTeclado` ES un KAV,
    y B ya le dio su vuelta de tuerca en S83-B36 (`height`→`padding`, por
    L-193: bajo edge-to-edge SDK 57 la ventana no se achica). No hay una
    segunda vuelta ahí: el KAV corre el CONTENEDOR, y el problema es que
    **nadie mueve el SCROLL** cuando la lista nace 350 ms después.
  · **Overlay anclado al campo creciendo hacia arriba** — funciona en
    teoría, pero: (a) sería el primer menú flotante de la casa; (b)
    `absolute` dentro de `ScrollView` en Android pelea con los hermanos
    posteriores y obliga a `zIndex`/`elevation`; (c) **taparía justo el
    texto que explica** — arriba del campo en el Perfil están el título
    de sección, "se guarda aparte" y el aviso de dirección faltante, que
    no es contenido pasivo sino la voz que dice qué hacer; (d) el scroll
    medido no tapa nada y ya está probado dos veces.

**⚠️ Y EL HALLAZGO QUE NO BUSCABA — `sala-espera.tsx` tiene DOS defectos
propios, y el primero explica "el buscador no funciona" MEJOR que el
teclado:**
  · **sin `keyboardShouldPersistTaps`** el default es `'never'`: con el
    teclado arriba, **el primer tap sobre una predicción solo cierra el
    teclado y NO elige**. Hay que tocar dos veces. En el Perfil está en
    `'handled'` y no pasa. *Es de una línea.*
  · **sin `EvitaTeclado`**, el teclado tapa peor que en el Perfil.
  · **Y es la pantalla donde MÁS duele**: la sala de espera es donde el
    prestador nuevo carga su sede por primera vez.

---

## 6. LO QUE QUEDA ESPERANDO A OTROS

- **De A:** la columna del `en` **no se pide** — su ficha es la
  sincronización, no la columna.
- **De B:** el `▶` en el punto del carrusel (viaja con la build, D-617)
  · `Boton` con prop `icono` (**candidata sin consumidor** — hoy no hace
  falta y por eso no se pidió) · `accessibilityState={{expanded}}` en
  `CeldaNavegacion` (hueco de a11y declarado desde C13).
- **Sin gate del founder:** toda la vitrina, las dos pantallas de
  Seguridad, y el escriba.
- **`verify:i18n` nunca corrió** de mi lado en toda la sesión: pide un
  server en `:8081`. **Jamás lo declaré verde.** La paridad es↔en la
  sostiene el typecheck vía `Espejo<D>` — que **cobró dos veces**: una
  key viva de un solo lado, y una local `t` que tapaba al hook.

---

*Depositada por C al cierre de S84. Nada de acá está firmado: son
argumentos, mediciones y frenos. Lo que rige sigue siendo el canon.*


---

## 7. LAS ÚLTIMAS TRES RONDAS (C33 · C34 · C35) — enmienda de cierre

*Lo anterior quedó depositado hasta C33. Esto cubre lo que vino después,
con el mismo criterio: solo lo que **no se reconstruye leyendo el repo**.*

### El freno que más valió: `identidad.tsx` no estaba vacía

La orden de ① era puentearla — la celda del Perfil directo a Seguridad —
y venía con su propio salvavidas escrito: *"NO la borres sin decirme qué
había"*. **Había el NOMBRE DE LA PERSONA**, editable y escribiendo en DB,
más el correo de ingreso.

Y el dato que convierte eso en riesgo real: **su único llamador era la
celda que se iba** (medido, un solo `router.push('/cuenta/identidad')` en
toda la app). Puentear sin más no la dejaba vacía: **la dejaba
inalcanzable, con el nombre de la persona sin ningún lugar donde
editarse** — un dato que se pierde sin que nada falle ni avise.

*La lección que dejo escrita: "¿queda vacía?" es la pregunta equivocada.
La pregunta es **"¿quién más la alcanza?"** — una pantalla con contenido
vivo y un solo llamador es más frágil que una vacía, porque la vacía se
nota.*

### La cadena del botón del logo — tres errores míos sobre el MISMO botón

Vale escribirla entera porque el patrón importa más que el botón:

1. **C34/S83** — puse un **subrayado**. Idioma web, fuera del diccionario.
   Me lo corrigieron.
2. **La corrección me llevó a `compacto`** — y el founder lo rechazó con
   una razón mejor que la mía: **un botón con caja al lado de una foto
   compite con la foto**, que es lo que la vitrina viene a mostrar.
3. **Y `compacto` estaba mal por un tercer motivo que nadie había visto,
   incluido yo, que escribí la nota:** ese botón vive **sobre el muro**, y
   su texto daba **2.92** contra él — bajo el 4.5 de AA. *Lo escribí en
   C34 sin medirlo.*

**Los números de toda la cadena, para que no haya que re-medirlos:**

| qué | contra el muro | veredicto |
|---|---|---|
| `acento` (`accent.cta` = `tealDark` **#0A7268**) | **1.00** | el muro ES ese hex — invisible |
| `acento` en oscuro (teal puro sobre `tealDarkNoche`) | 6.57 | legible **y por eso peor**: falla en 2 temas de 3 |
| `compacto` (`text.primary` #1D1A2E) | **2.92** | bajo AA — lo que había |
| papel PLENO #FAF9F7 (la cura) | **5.51** claro · **9.61** oscuro | el par que la casa ya usaba |

*Lo que aprendí y no está en ningún diff: **una anatomía puede estar mal
por más de un motivo a la vez**, y arreglar el que te señalaron no prueba
nada sobre los otros. El subrayado, la competencia con la foto y el
contraste eran tres defectos distintos en un botón de cuatro líneas.*

### Mi peor error de método de estas rondas: pedí lo que ya existía

Al frenar el logo escribí que **ninguna de las ocho variantes servía** y
que hacía falta que `Boton` supiera vestir el muro. Era correcto. **Lo que
no vi es que la casa ya tenía el VOCABULARIO para decirlo** —
`LogoNegocio.superficie: 'clara' | 'muro'`— **y esa pieza estaba montada
TRES LÍNEAS más arriba, en el bloque que yo estaba editando.**

B no inventó nada: ensanchó la respuesta existente. **Yo pedí una
respuesta nueva teniendo la vieja delante de los ojos.**

*L-175 dice "se ensancha, jamás se copia". Le falta la mitad que me
cobró: **antes de pedir, se mira si la casa ya contestó** — y el lugar más
probable donde ya contestó es el archivo que tenés abierto.*

### El número que reservé y no era mío (D-630 → D-632)

Mi acta reservó `D-630` para la deuda de documentos. **A tomó ese número
para el burn-down de la regla 81**, y lo escribió en `DEUDAS_CANONICAS`,
que es el archivo canónico.

**Gana el canónico, y la regla que deja es corta: una mención en un
relevamiento NO reserva un número.** El libre se verifica por grep en el
archivo de deudas, en el momento de usarlo — nunca desde la memoria de lo
que uno mismo escribió. *Es L-166 aplicada contra mi propio texto.*

### Los descartes de glifo, con su razón

La celda de documentos nació **sin glifo a propósito** y quedó registrado
por qué los dos candidatos obvios fallaban **por ley, no por gusto**:

- **`carnet`** es el carnet de vacunas **de la mascota** — su huella b′
  sobre una cédula diría que **el documento es del animal**.
- **`cuenta`** lo usaba **la celda vecina** (Seguridad): dos celdas
  pegadas con el mismo glifo es Ley 12 directa, el precedente que el
  founder ya cazó en S73.

Y después la adenda del founder corrigió el encuadre entero, que es lo
que vale guardar: **con documentos convertido en una de tres hermanas, el
glifo dejó de ser una decisión sobre una celda y pasó a ser sobre TRES.**
*Ponérselo a una sola las jerarquiza sin que nadie lo haya decidido* — lo
contrario de lo que la unificación buscaba. De ahí salió el pedido de
`fiscal` y `bancario`, que no existían.

### Lo que medí en estas rondas y no está en ningún commit

- **Los tres llamadores de cuenta comercial, con su GATE** — y el gate es
  todo el hallazgo: `liquidaciones:210` solo se dibuja si
  `faltaCuentaActiva`; `sala-espera:205` solo antes de activarse. **Los
  dos están gateados a "todavía no tenés cuenta activa"**, así que el de
  Negocio era **el único permanente**. Sacarlo sin la puerta del Perfil
  habría dejado al prestador **ya activo** sin ninguna forma de editar sus
  datos. *Contar puertas no alcanza: hay que leer cuándo se dibuja cada
  una.*
- **El catálogo fiscal: 1 de 23 países** declara nombre y máscara (solo
  EC). Por eso el genérico *"tu identificación fiscal"* no es un plan B —
  **es el camino que va a recorrer casi todo el mundo.**
- **`obtenerPaisesParaRegistro()` filtra `.eq('activo', true)`** y por eso
  **no sirve** para el país EMISOR de un documento: con esa lista, el caso
  canónico de P21 —el profesional colombiano operando en Quito— sería
  **imposible de declarar**. La lista de emisores es más ancha que la de
  operación, y ésa es la razón de que `lib/paises.ts` exista.
- **`identidad.tsx` tenía su título hardcodeado en español** fuera del
  riel: en inglés esa pantalla quedaba en castellano, y el `Espejo<D>` no
  puede cazar lo que nunca entró al diccionario.

### Una nota de herramienta que me costó una verificación

Encadené checks con `&&` después de `grep -c`. **Un `grep -c` que
devuelve 0 sale con exit 1**, así que la cadena se cortó **justo en el
resultado que probaba que algo se había retirado bien** — y el reporte
quedó a medias sin que nada dijera "falló".

*Es la familia de L-191: el exit code se lee del comando, y **un cero
legítimo no es un fallo**. En verificaciones de ausencia, los checks van
sueltos.*

---

## 8. LO QUE QUEDA SIN GATE — para mi próxima instancia

**El founder cerró S84 sin la pasada de gate: se difiere a S85.** Así que
**nada de lo construido desde C29 se vio en dispositivo.** Lo digo con esa
crudeza porque el riesgo real no es que falle: es que la próxima instancia
lo lea como firmado.

**Sin gate, por orden de riesgo:**

1. **🔴 Places (C34 ⑤) — el más incierto, y es el que más importa.** La
   cura es un scroll RELATIVO por el alto de la lista. **Su límite está
   declarado y no medido**: si abajo no queda contenido, RN clampea y la
   lista entra parcial. **En el Perfil hay contenido de sobra; en la SALA
   DE ESPERA no lo verifiqué** — y ésa es justo la pantalla donde el
   prestador carga su sede por primera vez. *Si falla en algún lado, va a
   ser ahí.*
2. **🟠 Datos comerciales con sus tres hermanas.** Cambió una pantalla que
   ya funcionaba. El acordeón, el aviso y los tres glifos a 21px no los
   vio nadie.
3. **🟠 El aviso de revisión.** Es texto FIRMADO por el founder, pero
   firmado **en el chat, no en pantalla** — y él mismo escribió que *"se
   firma en pantalla"*. Su firma real es la pasada de S85.
4. **🟡 El reordenamiento de Cuenta** (Tus datos · Seguridad directas).
5. **🟡 El logo sobre el muro** y el clip en `acento`.

**Y lo que NO se puede verificar leyendo:** los tres glifos nuevos
(`fiscal` · `bancario` · `documento`) **a 21px, en la fila, al lado de sus
vecinos** — que es el gate que DIRECCION_ARTE §2.9 exige y que ninguna
lectura reemplaza. `documentoSello` quedó **sin consumidor a propósito**:
existe para que el founder pueda comparar los dos candidatos con el dedo.

**Lo que le dejo dicho a quien siga, en una línea:** *lo construido en
estas tres rondas está medido contra el código y contra las leyes, y **no
está medido contra un teléfono**. Las dos cosas son verdad al mismo
tiempo, y la segunda es la que falta.*
