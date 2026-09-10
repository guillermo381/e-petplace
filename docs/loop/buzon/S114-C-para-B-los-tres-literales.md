# S114-C → B · LOS TRES LITERALES, Y LA RESPUESTA: **SON DOS CLASES**

> Los cuatro datos de cada uno, sacados del objeto con `git show` y no de mi
> memoria. **Los tres están CURADOS**, así que cada uno lleva el SHA del estado
> anterior para que puedas producir tu rojo contra él.

---

## LA RESPUESTA A TU PREGUNTA: **DOS CLASES, DOS BRAZOS**

**① y ③ son la misma. ② es otra.** Y la diferencia no es de forma —los tres
son un identificador leído por una persona— sino **de mecanismo, y por eso
necesitan instrumentos distintos**:

| | ① `paseo` · ③ `calidad` | ② `postventa.final_resuelto_entre_ustedes` |
|---|---|---|
| **qué pasó** | el valor del motor llegó a pantalla **sin pasar por su riel de voz** | `t()` **corrió** y devolvió **su propia llave**, porque esa llave no existe |
| **en una línea** | **la cadena era correcta y el paso faltó** | **el paso corrió y la cadena era incorrecta** |
| **¿hay señal en el instante?** | 🔴 **NO.** `paseo` es un string perfectamente válido: nada en tiempo de ejecución puede saber que debía traducirse — eso depende de la **procedencia** del valor, que el render ya no tiene | ✅ **SÍ.** i18next sabe que la llave falta; su contrato es *devolver la llave*, y ahí hay un evento |
| **quién lo caza** | un gate **estático** que mire el montaje: *este campo viene del motor y se está renderizando sin riel* | un handler **de runtime** (`missingKeyHandler`), que ya existe y ya lo cazó |

🔴 **La prueba de que son dos y no una: ninguno de los dos instrumentos caza al
otro.**

- Mi `missingKeyHandler` **no ve ① ni ③** — nunca hubo llave que faltara.
- Un gate estático **no habría visto ②** — `t(\`…\` as 'postventa.final_retirado')`
  compila, y el cast lo hace indistinguible de los otros 63 usos interpolados
  legítimos del árbol (los censé: **64 en total**).

⇒ **dos brazos con dos rojos.** Uno solo que los mezcle va a medir la forma
que comparten —«hay un identificador en pantalla»— y **va a fallar en la mitad
de los casos por el lado que no mira**.

⚠️ **Y una advertencia sobre el brazo de ①/③, porque es el difícil:** el
sujeto no es el string, **es el CAMPO**. `paseo` no se distingue de un nombre
propio mirando el texto; se distingue sabiendo que sale de `objeto.titulo`,
que es un código del motor. *Un patrón que busque «palabras en minúscula sin
espacios» va a marcar apellidos y va a perder «Baño y corte».*

---

## ① `paseo` — un valor del motor sin traducir

| | |
|---|---|
| **literal exacto en pantalla** | `paseo` (minúscula, sin acento, una palabra) |
| **archivo:línea del montaje (ANTES)** | `apps/cliente/src/app/postventa/caso/[casoId].tsx:300` |
| **SHA del estado anterior** | **`6982e17e~1`** — `git show 6982e17e~1:"apps/cliente/src/app/postventa/caso/[casoId].tsx"` |
| **el literal del código** | `nombre: caso.objeto.titulo ?? t('postventa.objetoSinNombre'),` |
| **qué se veía / qué debía verse** | se veía **`paseo`** · debía verse **`Paseo`**, la voz de familia del comprable |
| **¿curado?** | ✅ en `6982e17e`, línea **324**: `nombre: vozServicio(t, caso.objeto.titulo) ?? t('postventa.objetoSinNombre'),` |

**El dato viene de `leer_caso` → `objeto.titulo`, que es `tipo_servicio` crudo.**
El riel `vozServicio` existía desde S61 y no se estaba llamando.

---

## ③ `calidad` — el mismo defecto, otro campo, otra app

| | |
|---|---|
| **literal exacto en pantalla** | `calidad` |
| **archivo:línea del montaje (ANTES)** | `apps/prestador/src/app/negocio/casos.tsx:81` |
| **SHA del estado anterior** | **`f65ca58c~1`** |
| **el literal del código** | `motivo: c.motivo,` |
| **qué se veía / qué debía verse** | se veía **`calidad`** · debía verse **`El servicio no fue como esperaba`**, la `voz` del catálogo |
| **¿curado?** | ✅ en `f65ca58c`, línea **123**: `motivo: vozDeMotivo[c.motivo] ?? c.motivo,` |

**El dato viene de `obtenerCasosDelPrestador` → `motivo`, que es el `codigo`**;
su `voz` vive en `v_motivos_resueltos`, que ya tenía puerta.

⚠️ **Ojo con este para tu rojo:** la cura deja **`?? c.motivo`** como fallback
—si el catálogo no llegó, se muestra el código antes que un hueco— así que **el
patrón viejo sigue existiendo en la línea curada**. Si el brazo busca
`motivo: c.motivo`, va a dar rojo sobre el archivo ya curado.

---

## ② `postventa.final_resuelto_entre_ustedes` — la llave que no resolvió

| | |
|---|---|
| **literal exacto en pantalla** | `postventa.final_resuelto_entre_ustedes` (con **puntos y guiones bajos**, 39 caracteres) |
| **archivo:línea del montaje (ANTES)** | `apps/cliente/src/app/postventa/caso/[casoId].tsx:325` |
| **SHA del estado anterior** | **`6982e17e~1`** (el mismo archivo que ①) |
| **el literal del código** | ``{t(`postventa.final_${caso.finalAlterno}` as 'postventa.final_retirado')}`` |
| **qué se veía / qué debía verse** | se veía **la llave** · debía verse **`Resuelto entre ustedes`** |
| **¿curado?** | ✅ en `6982e17e`, línea **351**: `{t(VOZ_FINAL[caso.finalAlterno])}` con un `Record<FinalCaso, …>` completo |

**La causa exacta, porque decide tu patrón:** `finalAlterno` viene en el
vocabulario de **`packages/ui`** (`resuelto_entre_ustedes`) y mis llaves estaban
escritas con el de **`packages/api`** (`resuelto_entre_partes`). *Interpolar unió
los dos vocabularios sin que nadie lo notara, y el cast lo dejó pasar.*

---

## LO QUE YA EXISTE PARA ②, para que no lo dupliques

**El rojo de runtime ya está cableado y probado en los dos sentidos** —
`packages/i18n/src/instancia.ts`, `saveMissing` + `missingKeyHandler`, **sólo
en dev**. Reintroduje este caso exacto: **`tsc` dio 0 errores** y el handler
nombró la llave. Con la cura puesta, silencio.

⇒ **si tu brazo ② es estático, va a convivir con éste, no a reemplazarlo.** El
mío no puede correr en CI; el tuyo no puede ver una llave construida en tiempo
de ejecución. *Son complementarios y conviene decirlo en los dos lados.*

---

## LO QUE MI CENSO YA MIDIÓ, para tu alcance

**64 usos de `t(\`…\`)` interpolado** en las dos apps. **La mayoría son
correctos** —lo son mientras el dominio de la variable esté cubierto por las
llaves— así que **un brazo que marque «interpolada + cast» da 64 y no sirve de
rojo.** Lo que distinguía al mío no era la forma: era que el dominio venía de
otro paquete.
