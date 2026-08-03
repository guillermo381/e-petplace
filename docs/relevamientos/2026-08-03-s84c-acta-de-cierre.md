# S84-C — ACTA DE CIERRE

**Qué es esto:** lo que un C-nuevo NO puede reconstruir leyendo el repo.
Lo que ya está en el código —qué hace cada pantalla, qué se commiteó, qué
comentario explica qué— queda AFUERA a propósito. Acá viven los
**argumentos**, las **curas descartadas** y las **mediciones que no
dejaron rastro en ningún commit**.

Rama `s83-c` · último commit `60575f3` · 17 commits de S84.

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
subir los suyos** ⇒ **D-630**, sin fecha, letra antes que pantalla.

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

## 5. EL PENDIENTE VIVO — las opciones de Places bajo el teclado

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
