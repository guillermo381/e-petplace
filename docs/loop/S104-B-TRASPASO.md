# S104-B · TRASPASO

> **Qué es esto:** un mapa de **dónde retomar**, no una fuente de datos vivos.
> **No lleva ni un número que se pueda medir solo** — donde haría falta una
> cifra, va el comando. *La prosa derivada decae mientras el objeto no (L-141),
> y este archivo es prosa derivada por definición.*

**Territorio:** `packages/ui`, tokens, jueces (`scripts/verify-*`).
**Rama:** `pista/s104-b` · **árbol en cero al cerrar.**
**Todos mis commits están en `main`** — verificado con `git merge-base --is-ancestor`, uno por uno, no por el reporte del merge.

---

## 1 · QUÉ QUEDÓ EN MAIN

| SHA | qué |
|---|---|
| `4b7147c2` | La cura S81-C al arco de entrada del cliente (aire, secundarios a `ghost`, `MarcaDeAgua`) · nace el par **`ojo`/`ojoTachado`** y el toggle del campo de clave · **nace `R63`** + la cura del regex de `sinComentarios` |
| `5b1a3fa5` | El contraste contra `RITUAL_DE_ENTRADA` (llegó después del build) · `bienvenida` baja `sinCaja` → `ghost`, que **cierra por letra el gate de esa variante** · `R63·C` deja de medir mtime |
| `fe7839a9` | ☠️ **El foco vuelve a `accent.active`** (enmienda del founder); queda el **+1pt en 150 ms** · `R63·C` deja de dar falso rojo en worktrees de pista |
| `b3547461` | **`LockupMarca`** (el nombre en un solo lugar) · **`PantallaDeCandado`** · la prop `estatica` de `PaseoDeHuellas` · el gate del ojo a 21 px en galería · el `name` del launcher |
| `80032c0a` | **El splash del cliente**: el isotipo real sobre `tapizDark`, en lugar del chevron del template sobre el azul de Expo |
| `fe7495cb` | Ratifico la voz de C y curo las dos derivas que dejó: `onUsarClave` → **`onSalirDeLaSesion`**, y la cabecera que describía una naturaleza ya enmendada |
| `a608f47b` | **Las tres piezas de la salida** (`HojaConfirmacionDestructiva` · `ConsecuenciasDelCierre` · `CierreEnCurso`) · **nace `R64`** |

**Verificá que siguen vivas por CONTENIDO, no por el SHA del merge:**
```
git cat-file -e origin/main:packages/ui/src/components/ConsecuenciasDelCierre.tsx
git show origin/main:scripts/verify-diseno.mjs | grep -c '^function r6[34]'
```

---

## 2 · QUÉ QUEDA ABIERTO

| # | qué | bloqueo | dueño |
|---|---|---|---|
| 1 | **El splash del ritual** (§1: tapiz claro + isotipo entintado + wordmark) | **No hay rasterizador de SVG ni librería de imagen** en este entorno, y el wordmark tiene que ir horneado en el PNG. Además la coincidencia de **posición** es geométricamente imposible: el splash nativo centra y bienvenida ancla arriba | **Founder / diseño** — spec medida en `docs/loop/S104-B-SPLASH-BLOQUEADO.md` |
| 2 | **`PantallaDeCandado` está INERTE** | `expo-local-authentication` no está instalado y es **nativo** ⇒ no viaja por OTA | **Tren nativo** |
| 3 | **Las tres piezas del cierre están INERTES** | **No hay motor de cierre** en `packages/api` | **Motor (A)**, disparo: la compuerta de tiendas (B6) |
| 4 | 🔴 **Los «30 días» no están firmados** | `P15` no los menciona; viven como *Propuesta* sin firma, y su otra mitad («borrado duro») **choca con el titular firmado y es inejecutable** | **Mesa** |
| 5 | 🔴 **`MODELO_LOGIN` cita a `P15` diciendo algo que `P15` no dice** | — | **A / mesa** — hay que curarlo pase lo que pase con el punto 4 |
| 6 | **El gate por ícono del ojo a 21 px** | Sin hoja de contacto de 2-3 variantes (§6b). Atajo tomado por orden explícita | **Founder**, en `/gallery` |
| 7 | **El gate del biométrico en dispositivo** | Ni el typecheck ni el juez ven ciclo de vida | **Founder** — ver abajo |
| 8 | El `name` del launcher y el splash **no viajan por OTA** | Son nativos | **Tren nativo** |

**El tren nativo tiene tres pasajeros:** el splash del cliente, el `name` del launcher y `expo-local-authentication`.
⚠️ **Si el founder abre el cliente tras un doble reinicio y ve el splash viejo, es CORRECTO** — no es un OTA fallido.

**El gate del biométrico, con el caso que importa:** ya no alcanza «volver del segundo plano». Es **abrir la app en frío con sesión guardada**, y sobre todo **con el sensor fallando a propósito** (dedo mojado) — para ver que la salida está ahí *durante* el fallo y que al tocarla cae al login. *Es el único punto donde una equivocación deja a alguien afuera de su cuenta.*

---

## 3 · LAS FIRMAS QUE RIGEN

- **El foco del campo es `accent.active` + 1pt en 150 ms.** La tinta plena se aplicó y **se retiró**: *«fue orden mía sin ver el choque»*. Ley 5 y el sexto slot de S83-B13 quedan intactos.
- **`e-PetPlace` es el nombre.** Murieron `e.petplace` (el wordmark) y el `ePetPlace` del launcher del cliente.
- **El splash del cliente: isotipo real sobre `tapizDark`.** El fondo del prestador (`tealDark`) **no se copia**: es el muro de su oficio y S96-C lo puso para que las dos apps dejaran de ser gemelas.
- **En bienvenida, «Ya tengo cuenta» es `ghost`** (`RITUAL` §2.4). Eso cerró por letra el gate pendiente de `sinCaja`.
- **La huella de llegada dura `estandar`, no ~400.** `R51` rechazó el token legado; el founder retiró el 400 y corrigió §7 del ritual.
- **`candado.usarClave` dice «Entrar con otra cuenta»** (texto del founder, vía C). Ratificado: un usuario de Google no tiene contraseña, y el botón además **cierra la sesión**.
- **`P15` rige y su titular es literal:** *«Cerrar la cuenta la vuelve INALCANZABLE. No destruye el registro.»*

---

## 4 · DÓNDE MEDIR CADA COSA

| qué querés saber | comando |
|---|---|
| Reglas del juez, y cuántas | `node scripts/verify-diseno.mjs` (la última línea las cuenta) |
| Si una regla puede salir roja | está en `FIXTURES`; los tres guards estructurales lo exigen y el lint se invalida si no |
| Componentes de `packages/ui` | `ls packages/ui/src/components/*.tsx` (restá variantes `.web` y los `.ts` de infra) |
| Glifos del registry | el union `IconoNombre` en `Icono.tsx` |
| Promesas de cierre sin motor | la línea de `R64` en la corrida del juez |
| Si el compilador está midiendo rutas | la línea de `R63`, brazo C |
| Numeración libre (`D-` · `L-` · `R-`) | **grep contra `DEUDAS_CANONICAS.md`** — jamás de un parte |
| Versión instalada en el aparato | `adb shell dumpsys package com.epetplace.cliente \| grep versionName` |
| Qué OTA corre | el pie de **Cuenta** en la app (L-160), o `eas update:list` **desde `apps/<app>/`** |

⚠️ **`eas-cli` SIEMPRE desde `apps/<app>/`**, aunque solo estés mirando: desde la raíz scaffoldea un `app.json` stub y ensucia el árbol.
⚠️ **Si abrís worktree nuevo, corré `expo start` una vez** o `R63·C` te lo va a decir — y va a tener razón: sin `.expo/types/router.d.ts`, `typedRoutes` degrada `Href` a `string` y **tu typecheck sale verde sin medir una sola ruta**.

---

## 5 · LO QUE APRENDÍ, CON SU CASO

**① Medí el cuerpo, no el nombre — y me pasó a mí.** Dije *«ninguno de los dos assets de splash es el isotipo»* comparando **lienzos**. Decodificando el alfa, el contenido del PNG del prestador **es** el isotipo: el lienzo tenía padding. Casi le costamos al founder una decisión peor, y él ya había escrito una salvedad basada en mi error.
*Y la corroboración estaba durmiendo en el repo desde antes:* un comentario del prestador ya decía que el splash del template *«era el mismo caret de Expo»*.

**② Un juez nuevo hay que probarlo contra el corpus real, no solo contra su fixture — porque el primer bug va a estar en dónde mira.** `R64` informó «0 respaldos» con cuatro declarados a diez líneas de distancia **y salió verde**: su corpus no incluía la galería. No falló la regla; falló dónde estaba mirando. **L-192 en la regla escrita para cazar promesas vacías.** `R63` tuvo el gemelo: su brazo de deep links medía 0 porque el quita-comentarios de la casa se comía el `//` de las URLs.

**③ Aplicar una orden Y declarar su choque es lo que permite que quien la dio la revise.** El foco a tinta plena se aplicó, se declaró contra Ley 5 en la fuente, y el founder lo retiró: *«fue orden mía sin ver el choque»*. **Callado, habría llegado al gate con la ley rota en tres piezas de dos apps y él habría estado juzgando un desvío sin saber que lo era.**

**④ Una excepción fundada en prosa no le gana a una regla mecanizada, y está bien que no le gane.** Escribí `legacy_slow` con un párrafo explicando por qué era razonable; `R51` lo rechazó en la primera corrida. *Para eso se mecanizó.*

**⑤ Un gate que todos saltan deja de ser un gate.** `R63·C` daba falso rojo en todo worktree de pista —hasta commiteando un markdown— y D tuvo que usar `SALTAR_GATE`. La cura no fue bajar el umbral: fue que el brazo **distinga «está mal» de «no puedo medir»**, con `.expo/` como discriminador **medido antes de confiar en él**.

**⑥ Cuando una pieza tiene un modo de falla caro, hacé inexpresable el estado malo en vez de vigilarlo.** `sujeto` obligatorio sin default en la confirmación destructiva; las dos columnas obligatorias en las consecuencias; el nombre de la marca adentro de `LockupMarca` en vez de prop de texto libre —*porque una prop de texto libre es exactamente el mecanismo que produjo tres variantes del nombre*—.

**⑦ Cuando dos cosas tienen que cambiar juntas, media es peor que ninguna.** El fondo del splash y su asset: la marca es blanca, así que cambiar solo el color dejaba el arranque **en blanco** en un binario que no se cura por OTA.

**⑧ `git pull` en una rama de pista trae TU rama, no `main`.** Casi construyo la tanda 2 sin `RITUAL_DE_ENTRADA.md` ni `MODELO_LOGIN.md`. Lo cazó un grep que no encontró archivos que yo sabía que existían. **Antes de construir contra letra nueva: `git merge origin/main`.**

**⑨ La deriva vive en lo que no se ve.** Censé para otros el drift en comentarios; después `onUsarClave` se volvió falso en mi propia API cuando C curó la voz. *Un nombre no lo lee un usuario: lo lee quien monta la pieza, y monta lo que el nombre promete.*
