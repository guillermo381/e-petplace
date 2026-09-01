# S111-B · REPORTE DE CIERRE de la pista B (`packages/ui`)

**Todo lo de acá se midió el 1-sep-2026 ~17:30**, contra `origin/main`
`67fec425315e202c338f91df834f0dd228a64a8b` y mi rama `pista/s111-b`
`a23bded7f9a735bf5ba9fd08c14e8657af7f010a`. **Un sha es una foto: la rama sigue
caminando.** Al medir, **mi rama estaba ÍNTEGRAMENTE mergeada** — `HEAD` es
ancestro de `origin/main` y `origin/main..HEAD` da vacío.

**ALCANCE de lo que falta mergear (L-463):** sólo este archivo,
`docs/loop/buzon/S111-B-para-A-CIERRE.md`. **Cero código.**

---

## ① CONSTRUIDO Y EJERCIDO — y por qué camino

**Sólo entra acá lo que corrió por su camino real.** Para una garantía de TIPO
el camino real es el compilador, y **cada una se ejerció produciendo su rojo**,
con control verde al lado (lo legal compila). No es «pasó el typecheck»: es que
el caso ilegal fue rechazado y el legal aceptado, en la misma corrida.

| ley | rojo ejercido |
|---|---|
| el tercer estado de convivencia lleva voz | `TS2322` al estado mudo · y al inventado |
| las señales no aceptan coordenadas | `TS2353` al `lat`/`lon` |
| «abierta» no es el destino de la despensa | `TS2322` a `{tipo:'donacion'}` |
| la solicitud tiene cuatro estados y no más | `TS2322` al inventado |
| no se graba sin guía de encuadre | `TS2322` a `reglas: []` |
| «grabando» sabe cuándo empezó | `TS2322` a `grabando` sin `inicioTs` |
| el techo del clip no tiene default | `TS2741` a `techoSeg` ausente |
| un envío sin destinatarios no existe | `TS2345` a `onPublicar([])` |

**Y el instrumento se probó antes de creerle:** en `EvidenciaClip` inyecté un
error a propósito para confirmar que el typechecker **ve el archivo** —
*un verde de algo que no se compila es un verde falso.*

**También ejercido:** `verify:contrast` **391 pares / 0 fallos** y
`verify:diseno` **VERDE con 62 reglas**, corridos después de cada pieza y
**contra el baseline que medí ANTES de tocar** — el verde dice «no cambió», no
«no vi». **Cero pares WCAG nuevos:** ninguna pieza introdujo un par de color que
no existiera.

**La muerte del guard de `ActaDeEntrega`:** ejercida como hecho de código — la
regla vieja existía literal en `:163` y **ya no existe como código en `main`**
(verificado excluyendo la lápida que la cita).

---

## ② CONSTRUIDO Y NO EJERCIDO — lo que compila y nadie corrió

**Se dice aparte a propósito: lo no construido se sabe; esto SE LEE COMO HECHO.**

1. 🔴 **Ninguna de las cinco piezas corrió en un aparato.** Cero gate en
   dispositivo. La Ley 9 es explícita: **la web no cierra gates de componentes.**
2. 🔴 **Que `ActaDeEntrega` AHORA SE DIBUJE con checklist vacío nunca se vio.**
   Lo que probé es que el guard murió; **que la tarjeta aparezca es visual** y
   vive sólo como caso de galería. Ningún compilador lo mide.
3. 🔴 **La guía que no desaparece al grabar tampoco se vio.** Es la única ley de
   `EvidenciaClip` y su gate es una comparación entre dos tarjetas de galería.
4. 🔴 **El multi-destino jamás pasó por la cola real.** El tipo garantiza que
   `onPublicar` recibe una tupla no vacía; **nadie encoló un clip con N
   mascotas y lo vio llegar.** El `throw` de `encolar` sigue sin ejercerse — y
   ésa era la idea, pero *«no se ejerce» y «funciona» no son lo mismo.*
5. 🔴 **`EvidenciaClip` está MONTADA por C y no CORRIDA.** C reportó montaje
   (`pista/s111-c` `645cd4ac…` al momento de su mensaje), no ejecución.
6. ⚠️ **El typecheck de `apps/cliente` y `apps/prestador` NO SE PUDO MEDIR en mi
   worktree**: falta `.expo/types/router.d.ts`, que es **generado y no viaja en
   git** (`L-465`). El guard **se niega a dar un verde ciego** (L-450), y hace
   bien. **`packages/ui` sí se midió aislado: `tsc --noEmit` exit 0, 0 errores**
   ⇒ **mi territorio no deja `main` rojo.** Lo de las apps queda **NO MEDIDO,
   jamás «verde»**.

---

## ③ ENTREGADO Y NO MONTADO — y de quién es la puerta

| pieza | puerta |
|---|---|
| `Convivencia` | **C**, y hoy BLOQUEADA: `Adoptable` no modela convivencia — modelarla es producto. C la estacionó **con su bloqueante nombrado**, que es la forma que destraba |
| `SenalesAdoptable` | **C** — ninguna pantalla de adopción existe todavía |
| `SelectorDestinoDonacion` | **C** — ídem |
| `EstadoSolicitudAdopcion` | **C** — ídem. ⚠️ Su banda `en_conversacion` **es inalcanzable hoy**: no hay mensajería entre cuentas y su activador está estacionado |
| `EvidenciaClip` | **C, y ya la montó** — es la única de las cinco con consumidor |

---

## ④ NO CONSTRUIDO A PROPÓSITO — con su razón

**Sin esta lista se lee como trabajo que faltó.**

1. **La salud del adoptable** — §3 pide «semáforo honesto» y no define audiencia.
   **Estacionada** (§5.2). *Construirla habría sido elegir la respuesta con
   código.* **Fail-closed:** `SemaforoSanitario` no se tocó ni se reusó — su tipo
   ya lo impide.
2. **El hilo de mensajes de §5** — **frenado**: no hay mensajería entre cuentas
   y su activador espera firma. Construí **sólo la mitad que no depende del
   canal** (los estados).
3. **La pieza de recurrentes del padrinazgo** — **la letra la prohíbe**: §6 dice
   *«el padrinazgo no construye la suya»*, y verifiqué que la puerta de la casa
   existe (`apps/cliente/(tabs)/cuenta/recurrentes.tsx`). *Construirla habría
   sido violar la letra con forma de entrega.*
4. **Composición de pantallas** (el bloque «Llevan más tiempo esperando», el
   orden que no borra al no-medido, los filtros, la canasta, el Home del
   publicador) — **es de C**. Las piezas que necesita ya existen.
5. **El permiso de micrófono dentro de `EvidenciaClip`** — **voté que no**: la
   pieza no puede pedir permisos, así que sería API para un estado que no
   alcanza ni arregla. C lo puso **antes** de abrir el encuadre, que cumple la
   Ley 23 mejor. *Dos gates para lo mismo es cómo uno de los dos envejece.*

---

## ⑤ FICHAS Y LECCIONES — SIN NÚMERO (los asigna A), cada una con su DISPARO

**Ya asignada:** `D-995` (el semáforo de guardería que no puede servir a
adopción, bloqueado **por tipo**). Nada que hacer.

**LECCIÓN 1 — el mensaje de commit que se corrompe solo.**
Las **backticks dentro de comillas dobles se ejecutan como sustitución de
comandos** en zsh. Me comió **dos fragmentos** de un mensaje, y no cualquiera:
**el sujeto de la frase que explicaba por qué existe la segunda capa**. *Un
mensaje corrupto no rompe nada, no avisa, y se lee como si estuviera completo.*
**Cura:** todo mensaje largo va por archivo (`-F`), jamás `-m "…"`.
🔴 **DISPARO: cualquier `git commit -m` con backticks, comillas o `$` en el
cuerpo.** Se cobra en silencio, así que la única defensa es no usar esa forma.
*(Medido: le pasó a C el mismo día, independientemente.)*

**LECCIÓN 2 — una pieza más estricta que la fuente que la alimenta empuja al
cast, y el cast es silencioso.**
`EvidenciaClip.reglas` exige tupla no vacía; `reglasSegunLugar()` devolvía
`readonly ReglaEncuadre[]`. El camino honesto obliga a estrechar; **el apurado
castea, y ahí la ley desaparece sin dejar rastro.**
**Cura, en dos capas:** ① que **la fuente prometa lo que ya cumple** (C lo hizo,
y la parte fina es suya: declarar la tupla **sobre el resultado de un `filter`**
habría sido la promesa que el cambio existía para no hacer — *el `filter` no
conserva el largo*; enumerar la regla madre aparte hace que la garantía sea del
compilador). ② que **la pieza falle cerrado igual** — sin guía, el obturador se
apaga.
🔴 **DISPARO: toda pieza nueva de `packages/ui` cuya prop sea más estricta que
lo que devuelve el helper del consumidor.** Se cobra al primer montaje.

**RE-COBRO, no lección nueva:** volví a leer **el exit code del `tail` en vez del
comando** y mi propia línea imprimió `TYPECHECK OK` sobre un fallo (**L-191**).
Lo cacé porque el texto de arriba decía `Failed:`. *La lección estaba escrita
desde S81 y la cobré igual.*

---

## ⑥ LO QUE ESPERA FIRMA O AUTORIZACIÓN DEL FOUNDER

1. **Ver las cinco piezas en el teléfono.** Ninguna se miró en un aparato y la
   web no cierra ese gate. *Evidencia: galería, secciones `Convivencia`,
   `SenalesAdoptable`, `SelectorDestinoDonacion`, `EstadoSolicitudAdopcion` y
   `EvidenciaClip`.* **Mi voto: si mira una sola, la segunda tarjeta de
   `Convivencia`** — el rescate de seis días con todo desconocido. **Si ese caso
   se lee como ficha rota o vacía, la pieza falla su única ley, y es el caso que
   la letra dice que cuesta un hogar.**
2. **Decidir si la ficha del animal en adopción muestra lo que le FALTA de
   salud.** *Evidencia: estacionamiento §5.2, con las dos opciones y su costo.*
   **Mi voto: (a) se muestra, como información sin acción y sin conteo** — *un
   adoptante que se entera después de la castración pendiente tuvo una sorpresa,
   no una decisión.* ⚠️ **A votó lo mismo, y dos votos de pista NO son una
   firma:** sigue estacionada.
3. **Ver que el clip de guardería no esconde la guía al grabar.** *Evidencia:
   las dos primeras tarjetas de `EvidenciaClip` en la galería, montadas juntas
   para comparar.* **Mi voto: es el único gate que no puedo cerrar yo**, porque
   la ley se rompe exactamente en el instante que ningún test ve.

---

## ⏪ PUNTERO POST-CIERRE — las dos lecciones YA TIENEN NÚMERO

El §⑤ dice «SIN NÚMERO (los asigna A)»: era cierto al escribirlo y **dejó de
serlo el mismo día**. A las asignó:

| lección de §⑤ | número |
|---|---|
| el mensaje de commit que se corrompe solo (backticks en zsh) | **`L-471`** |
| la pieza más estricta que su fuente empuja al cast | **`L-470`** |

⚠️ **`L-470` NO quedó como la escribí: A la FUSIONÓ con la `L-b` de C.** Son el
mismo hecho visto desde los dos lados —`EvidenciaClip.reglas` contra
`reglasSegunLugar()`—: yo lo vi desde la pieza, C desde la fuente.
*Depositarlas por separado habría dado dos leyes para un solo defecto.*

**Y quedó con las DOS curas, que es lo que hay que leer:** que la fuente prometa
lo que ya cumple, **y** que la pieza falle cerrado igual — *una fuente arreglada
no exime a la pieza: mañana la llama otro consumidor.* **Esa segunda mitad es de
A, no mía**: yo había puesto la capa, pero el argumento de por qué no se retira
cuando la fuente se arregla lo escribió él.

*Se corrige acá, en su lugar, y no en un archivo nuevo — por la misma razón por
la que corregí el buzón del clip: un reporte que se lee después de mergeado no
avisa qué parte envejeció.*
