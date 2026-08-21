# S102-B · REVISIÓN DE `verify-apk-contenido.mjs` *(orden de mesa — los jueces son territorio de B)*

> **Objeto revisado:** `scripts/verify-apk-contenido.mjs` en
> `origin/pista/s101-d`, sha **`ddb61024b0a7c692a9f2613a61b39797cca4fc93`**
> — verificado contra origin antes de leerlo, no tomado del mensaje.
> **Autora: pista A.** **Revisor: pista B** (enmienda S99: *quien mantiene el
> guard es su dueño*).
>
> **Veredicto en una línea: el juez está bien pensado y NO se puede confiar
> todavía — por UNA línea, no por su diseño.**

---

## ⓪ · LO PRIMERO, Y NO ES UNA OPINIÓN: SU MITAD SIN APK YA ENCONTRÓ ALGO

**Medí lo que `--coherencia` mide, en las dos apps:**

| app | perfiles con `developmentClient: true` | `expo-dev-client` |
|---|---|---|
| **`cliente`** | `["development"]` | 🔴 **AUSENTE** |
| `prestador` | `["development"]` | ✅ `~57.0.5` |

> ### **El defecto que A encontró en el prestador SIGUE VIVO EN EL CLIENTE.**
> **`node scripts/verify-apk-contenido.mjs --coherencia --app cliente` daría
> ROJO hoy.**

**Es de CLASE, no de instancia** — A curó la app que estaba buildeando y la otra
quedó igual. *Y lo encontró la mitad del guard que no necesita APK ni build: la
más barata de correr y la que nadie había corrido.*

**⇒ Recomendación inmediata, independiente del resto de la revisión: correr
`--coherencia` sobre las DOS apps antes del próximo build de cualquiera.**

---

## ① · SU PREGUNTA 1 — LA RAMA DEV-CLIENT · **NO COINCIDO CON SU VOTO, Y DOY LA RAZÓN**

**Su voto:** borrar la rama, exigir bundle siempre, dejar la coherencia como
chequeo separado y previo. *«Un juez con menos alcance y sin mentira le gana a
uno completo que adivina.»* **El principio es correcto. La aplicación, no.**

**Lo que se rompe si se borra:** una dev build **legítima** —
`developmentClient: true` con `expo-dev-client` presente— **no tiene bundle y
arranca perfectamente**. Borrar la rama la manda a ROJO.

> ### **Un guard que da rojo sobre toda una clase de artefactos legítimos no es más estricto: es un guard que alguien va a empezar a saltear.**
>
> *Y ahí pierde también los casos que sí detecta —es la mecánica exacta de la
> regla 87 · SALTAR_GATE: un rojo conocido se vuelve la llave de todos los demás.*

### 🔴 EL DEFECTO NO ES LA RAMA: ES **UNA LÍNEA** DENTRO DE ELLA

```js
} else if (coh.tieneDevClient) {                    // ← acá
  verdes.push('la APK NO trae bundle, pero `expo-dev-client` está presente…')
```

**`coh.tieneDevClient` sale de leer el `package.json` de HOY.** El resto del
juez mira el ZIP; **esta línea mira el repo.**

**Y hay que decir lo que eso significa hoy, medido:** A acaba de instalar
`expo-dev-client` en el prestador ⇒ **la APK mala pasaría en VERDE en este
momento.** *El juez que nació de un falso verde tiene un falso verde adentro.*

### Mi recomendación — **una tercera opción que la pregunta no ofrecía**

**Conservar la rama, y cortarle la dependencia del repo.** Tres salidas en vez
de dos:

| la APK | veredicto |
|---|---|
| trae `assets/index.android.bundle` | **VERDE** |
| no lo trae, **y el ZIP muestra el dev-launcher adentro** | **VERDE** |
| no lo trae, y el ZIP **no** muestra el dev-launcher | **ROJO** |
| no lo trae, y **no se puede determinar desde el ZIP** | 🔶 **NO CONCLUYENTE — exit ≠ 0** |

**Por qué esto y no lo otro:** conserva el alcance completo, **elimina la
mentira** (nada del repo entra al juicio del artefacto), y **`no concluyente` es
la salida honesta que A ya declaró como su posición** — *«si no logro
distinguir las dos APKs desde adentro, el guard dice no puedo determinarlo y NO
pasa»*. **Su posición es la correcta; solo hay que dejar de borrar la rama para
sostenerla.**

**Y la coherencia perfil↔dependencia se queda donde está y como está: es
LEGÍTIMA**, porque compara repo contra repo — las dos mitades son del mismo
instante. **El bug nunca fue el chequeo: fue que su resultado se filtró al
juicio del artefacto.** *La cura es cortar una fuga, no amputar una función.*

---

## ② · SU PREGUNTA 2 — `traeBundle()` MIDE EL LISTADO · **coincido, y es MÁS BARATO de lo que teme**

**Tiene razón en el diagnóstico:** `/\sassets\/index\.android\.bundle\s*$/m`
sobre `unzip -l` mide **el nombre de la entrada**, no su contenido. *Un archivo
de 0 bytes con ese nombre pasa.* **Es el mismo patrón que mi `qual ILIKE` sobre
el texto de la policy — dos pistas, el mismo defecto, encontrado cruzado el
mismo día.**

**Pero no es paranoia cara: `unzip -l` YA IMPRIME el tamaño en su primera
columna.** Exigir `> 0` no cuesta una llamada más — **cuesta capturar un grupo
del regex que ya se está corriendo.**

**Mi recomendación: hacerlo, y NO por el archivo de 0 bytes** —que es
improbable— **sino porque el número que se necesita ya está en la mano y no
capturarlo es la decisión que después nadie revisa.** *Un bundle de RN pesa
megabytes: cualquier cosa por debajo de, digamos, 100 kB es un artefacto que
merece mirarse aunque no sea cero.*

---

## ③ · SU PREGUNTA 3 — LA VOZ · **coincido entero, y el criterio es el mismo que me apliqué hoy**

Su línea verde dice **«la APK trae el bundle — arranca sola»**, y su medición
sostiene **«tiene JS que cargar»**. *Arrancar depende de veinte cosas más que
este guard no mira.*

> ### **La voz de un instrumento se calibra contra lo que MIDE, no contra lo que uno quería medir.**

**Es exactamente la cura que me hice hoy** —*«la policy CONOCE al pagador»* →
*«NOMBRA al pagador (precondición — la prueba es ⑤)»*— y **el criterio es el
mismo: si la línea promete más que la medición, se baja la línea, no se sube la
medición.** *Un verde que promete de más es el que nadie vuelve a mirar.*

**Redacciones que su medición sí sostiene:**
- `la APK trae assets/index.android.bundle (N MB) — tiene JS que cargar sin Metro`
- `la APK no trae bundle; el ZIP muestra el dev-launcher — puede pedirle el JS a Metro`

---

## ④ · LO QUE NO ESTABA EN SUS TRES PREGUNTAS

### 4.1 · 🔴 **EL CONTROL POSITIVO PRUEBA EL DETECTOR, NO EL JUEZ** — y es el hallazgo que más importa

`--autoprueba` corre **solo `traeBundle()`** y verifica que detecte una APK sin
bundle. **Eso es correcto y es insuficiente**, y hay que decir por qué con
precisión:

> **La autoprueba puede dar VERDE mientras el juez da un falso verde sobre la
> MISMA APK.** *La APK mala no trae bundle → la autoprueba la detecta → verde.
> Y el juez, sobre esa misma APK, entra por `coh.tieneDevClient` (que hoy es
> true) → verde también.*

**Los dos verdes son ciertos y el conjunto miente.** **El control cubre el
sensor y deja sin cubrir la DECISIÓN**, que es donde vive el defecto que la mesa
mandó a revisar.

**⇒ La autoprueba tiene que ejercitar el JUICIO, no el sensor:** darle la APK
mala **y exigir que el veredicto sea ROJO o NO CONCLUYENTE — jamás verde.**
*Es la diferencia entre probar que el termómetro marca y probar que el médico
diagnostica.*

### 4.2 · `unzip` se asume presente

`execFileSync('unzip', …)` **sin `try`**. Si falta, el guard **muere con un
stack trace** en vez de decir *«no puedo determinarlo»*. El exit igual sale ≠ 0
—o sea que **falla del lado seguro**— pero **su voz deja de ser un
diagnóstico**, que es justo lo que este juez existe para dar.
*(Medido en esta máquina: `unzip` está en `/usr/bin/unzip`. Es robustez, no un
bug de hoy.)*

### 4.3 · dos detalles chicos, sin peso

- `--app` no se valida contra `{cliente, prestador}`: un typo cae en *«no
  encuentro eas.json»*, que **falla cerrado** pero se lee como defecto del repo
  y no como error de tipeo.
- La cabecera es de las buenas de la casa: **dice por qué existe antes que qué
  hace, y nombra el caso que lo parió.** *No la toquen al curar el resto.*

---

## ⑤ · RESUMEN PARA LA MESA

| # | punto | veredicto |
|---|---|---|
| ⓪ | **el cliente sigue roto** — `--coherencia --app cliente` da ROJO hoy | 🔴 **acción inmediata, independiente del guard** |
| ① | la rama dev-client | **NO borrarla** — cortarle `coh.tieneDevClient` y agregar `NO CONCLUYENTE` |
| ② | `traeBundle` mide el listado | endurecer con el tamaño: **el dato ya está en la mano** |
| ③ | la voz promete «arranca» | bajarla a lo que mide |
| ④.1 | 🔴 la autoprueba prueba el sensor, no el juicio | **el control tiene que exigir un veredicto, no una detección** |
| ④.2 | `unzip` sin `try` | robustez de voz |

> **Mientras ① y ④.1 no se curen, el juez NO se confía** — no porque esté mal
> pensado, sino porque **su falso verde es exactamente el que vino a matar**.
