# EL MÉTODO DE TRES PISTAS — v1.0

> **Por qué existe este documento, y es su justificación entera:** hasta S84 el
> método de A/B/C vivía **en la memoria de las pistas** y en un prompt de apertura
> que alguien reescribía a mano cada sesión. **Si las tres compactan, se
> reconstruye de cero.**
>
> **El prompt de apertura debe CITAR este documento, no repetirlo.** Hoy el
> prompt lleva el método adentro, y por eso hay que reescribirlo entero cada vez.
>
> **Estatuto:** destila lo que S84 probó con nueve OTAs limpios y dieciocho
> frenos. Lo que acá es **regla** viene de reglas ya firmadas del
> `CONTRATO_TRABAJO` (76 · 80 · 82 · 84 · 85); lo que es **práctica observada**
> va marcado como tal.

---

## 1 · LOS TERRITORIOS, y por qué son ésos

| pista | territorio |
|---|---|
| **A** | `main` · la **DB** (migraciones, RPCs) · `packages/api` · `packages/domain` · **`docs/`** · **el merge y el push** |
| **B** | `packages/ui` · los **tokens** · **el lint y los jueces** — **exclusivo** *(enmienda de mesa, 13-ago-2026: era una lista de dos archivos — `verify-diseno.mjs`, `verdicto.mjs` — y pasa a ser el CRITERIO que este documento ya argumentaba: **quien mantiene el guard es su dueño, o es el guard de nadie**. Una lista de archivos envejece; un criterio no — y el caso que la parió es `juez-s96.mjs`: B lo curó estando fuera de su lista, lo declaró en la puerta, y la mesa ratificó sin revert porque el problema era la letra, no la conducta)* |
| **C** | `apps/prestador` · **`apps/cliente`** · **la superficie de los dos canales** |

> **⚠️ ENMIENDA S91 (hallazgo de C, depositada por A — `docs/` es de A):**
> esta tabla tenía un HUECO: **`apps/cliente` no estaba asignada a ninguna
> pista.** No era una decisión de dejarla libre — era una omisión, y una
> omisión en la tabla de territorios es la clase de dato que **no da síntoma
> hasta que dos pistas tocan el mismo archivo**. Se asigna a **C**, que es
> como la mesa viene operando de hecho (S90 y S91: el cliente lo trabajó C —
> la lista de papeles derivada del catálogo, la tarjeta de D-682, la prueba
> dirigida de push, el picker de receta). *La regla que esto deja: un
> territorio que la mesa reparte en los hechos y la tabla no nombra sigue
> siendo un territorio sin dueño — se escribe.*
>
> Cuando una pista trabaja **las dos apps a la vez**, sigue rigiendo 76(f2):
> commit por pathspec, una app por commit — el índice es UNO por repo.
>
> **⚠️ Y SE CORRIGE UNA CONTRADICCIÓN QUE ESTA MISMA TABLA INTRODUJO (S91):**
> la fila de C decía «**el canal OTA**» y el §2 dice «A conduce … el publish,
> **NADIE MÁS PUBLICA**». **Dos líneas firmadas que se contradicen son peores
> que una equivocada** — cualquiera cita la que le conviene y está «en regla»
> (mismo precedente que el magenta de S83 y la plata del titular).
>
> **Resuelto, y con el argumento de los hechos de hoy: el ACTO de publicar es
> de A; la SUPERFICIE de los dos canales es de C.** Los tres choques de S91
> pasaron todos porque **el que publicaba y el que dominaba el árbol eran
> personas distintas** — y el publish atómico (`publicar-ota.mjs`) exige
> justamente que sean la misma: quien bundlea es el único que puede garantizar
> que el árbol no se mueva, porque es quien mergea.

**El corte no es por comodidad: es por DÓNDE VIVE LA VERDAD DE CADA COSA.**

- **A tiene la DB y la puerta única** porque el motor y su wrapper **son el mismo
  contrato**: partirlos entre dos pistas produce el patrón que S84 vio tres veces
  —*el motor se adelanta a su wrapper*— y cada vez costó un turno.
- **B tiene el lint en exclusiva** porque **es quien puede romperlo sin que nadie
  lo note**: un guard es de quien lo mantiene, o se vuelve el guard de nadie.
- **C tiene las apps** porque es donde el craft se ve, y **el craft se firma
  sobre la pantalla real** (regla 80). *Las dos casas en una sola pista tienen
  además una razón de contenido: la mitad de los desvíos del cliente nacen de
  copiar el patrón del prestador sin su contexto (y al revés) — quien ve las
  dos es quien puede matar el clon en vez de propagarlo.*

**Las tres tocan `packages/ui` en LECTURA. Solo B lo escribe.**

---

## 2 · A ES LA ESCRITORA ÚNICA, Y LA CONDUCTORA

**A escribe `docs/` — nadie más.** Un acta con tres autores es tres actas.

**A conduce los merges, las vedas y el publish. NADIE MÁS PUBLICA.**

**Los CINCO deberes de la conducción** *(práctica probada en S83-S84, todavía no
en el contrato):*

1. **MERGEAR A DEMANDA**, sin esperar orden — con `git show --name-only --pretty=""`
   **por commit** como paso fijo. *Nunca `git diff --stat` entre puntas: compara
   las dos puntas y muestra como BORRADO el trabajo que la otra rama no tiene.*
2. **ABRIR LA VEDA ELLA MISMA** cuando alguien va a publicar.

   > ### ✏️ ENMIENDA S91 — LA VEDA DEJA DE SER UN AVISO Y PASA A SER UN GUARD
   >
   > **`node scripts/verify-veda-publish.mjs --app <cliente|prestador>` corre
   > ANTES de todo `eas update`. Rojo = el publish NO ocurre.**
   >
   > **Por qué esto y no un anuncio mejor redactado:** la candidata (e) de S75
   > ya decía «la ventana de publish congela BILATERALMENTE» y **siguió siendo
   > una intención durante quince sesiones**. En S91 chocó **tres veces en un
   > día**. La razón por la que un aviso no puede funcionar acá es de forma,
   > no de disciplina: **el daño no lo hace quien publica — lo hace quien
   > ESCRIBE mientras el otro publica**, y esa persona, por definición, no
   > está mirando el anuncio. *Un aviso que no frena, no frena* (D-584).
   >
   > **LOS TRES CHOQUES, medidos, porque cada uno enseña algo distinto:**
   >
   > | # | qué pasó | qué enseña |
   > |---|---|---|
   > | ① | El ancla salió **con asterisco**: al bundlear había un verify script de otra pista modificado | el asterisco **se imprime una vez y desaparece** — ver la corrección de abajo |
   > | ② | Se publicó con `packages/api` **sin commitear**: código que no vivía en NINGÚN commit viajó al teléfono | el bundle puede contener lo que ningún commit contiene |
   > | ③ | Un publish declaró «ancla `f4c9a134`» y su `gitCommitHash` real fue **`5012db53`** —un commit de OTRA pista— porque el árbol avanzó entre el commit propio y el bundling | **EL ANCLA ESCRITA A MANO MIENTE**, y nadie lo había nombrado |
   >
   > **El ③ es el que más duele y el menos obvio:** el mensaje del publish
   > decía una cosa y el bundle salió de otra. Quien después verifique «por
   > contenido» contra el ancla declarada (regla 84 ②) va a verificar el
   > commit equivocado **y le va a dar verde**.
   >
   > **QUÉ EXIGE EL GUARD, y por qué cada cosa:**
   >
   > 1. **Árbol limpio, o aborta** — y **nombra los archivos con su
   >    territorio** (y, en `scripts/`, con su último autor). No dice «hay
   >    cosas sucias»: dice **a quién pedirle que commitee**. Eso es lo que
   >    convierte la veda en bilateral sin necesidad de que la otra pista esté
   >    mirando.
   > 2. **HEAD en `origin/main`, o aborta** — un ancla que solo existe en un
   >    disco no la puede reproducir nadie, y el gate del founder quedaría
   >    sobre un bundle irreproducible.
   > 3. **Imprime el ancla REAL y el comando con el ancla ya puesta.** **El
   >    ancla no se escribe a mano nunca más**: se copia de la salida del
   >    guard. Ese es el choque ③, cerrado en su origen.
   >
   > **Lo que el guard NO reemplaza:** avisar a la mesa sigue siendo cortesía
   > y buena práctica. Lo que deja de depender del aviso es el modo de falla
   > **silencioso**, que es el caro.
   >
   > ### ⚠️ CORRECCIÓN S91 — POR QUÉ ESTE GUARD NO TIENE SUPLENTE
   >
   > **Medido (C midió, A verificó contra el objeto):** el registro publicado
   > **no guarda el estado del árbol.** `eas update:view --json` expone
   > `branch · createdAt · gitCommitHash · group · id · isRollBackToEmbedded ·
   > manifestPermalink · message · platform · runtimeVersion` — y **nada** con
   > `dirty`, `clean` o `tree`. **El asterisco existe solo en la terminal, en
   > el instante del publish.**
   >
   > **⇒ Un publish sucio es INAUDITABLE después.** Se puede saber de qué
   > commit salió; no se puede saber si había WIP encima. Por eso este guard
   > no es «una capa más»: **es la única**, y correrlo no es prolijidad — es
   > la diferencia entre saber y no poder saber nunca.
   >
   > *Corolario para las actas: si el asterisco aparece, se transcribe EN EL
   > MOMENTO. Y la ausencia de asterisco en un acta vieja no prueba árbol
   > limpio — prueba que nadie lo escribió.*
   > (Enmienda gemela en `CONTRATO_TRABAJO`, enmienda S83 de la regla 82.)
   >
   > ### ✏️ ENMIENDA S91 bis — EL GUARD SOLO NO ALCANZÓ: SE PUBLICA CON `publicar-ota.mjs`
   >
   > **El límite que este archivo declaró unas líneas arriba COBRÓ EL MISMO
   > DÍA, con el guard puesto.** La veda salió verde e imprimió un ancla, otra
   > pista commiteó en el hueco, y el bundle salió de un commit distinto del
   > verificado. *Verificar-imprimir-y-soltar no cierra una ventana* — y un
   > límite declarado no deja de ser un agujero por estar declarado.
   >
   > **DECISIÓN DE MESA FIRMADA (8-ago-2026). El publish pasa a ser UN SOLO
   > ACTO:**
   >
   > ```
   > node scripts/publicar-ota.mjs --app <cliente|prestador> --mensaje "qué cambió"
   > ```
   >
   > **⚠️ El `--mensaje` NO lleva el ancla: la pone el script.** Ese fue el
   > choque ③, cerrado en su origen.
   >
   > **Hace las TRES cosas, y las tres son necesarias:**
   >
   > 1. **Corre la veda por el MISMO guard** (`verify-veda-publish.mjs` como
   >    hijo, no re-implementado: una sola fuente de la verdad). Rojo → no
   >    publica.
   > 2. **Publica en el mismo acto**, sin devolver el control en el medio.
   > 3. **Re-verifica DESPUÉS y GRITA**: si HEAD se movió, si el ancla real
   >    del CLI no es la verificada, o si el ancla trae asterisco. Y **imprime
   >    el ancla REAL, el group y el runtime** para copiar al acta.
   >
   > **Por qué el ③ no es redundante con el ②, que es la parte no obvia: el
   > bundling tarda ~60 segundos.** Ni un acto atómico puede impedir que
   > alguien commitee mientras corre. **Lo único garantizable no es evitar la
   > carrera: es que sea IMPOSIBLE NO ENTERARSE.** Por eso el script termina
   > en exit ≠ 0 cuando algo cambió, aunque el OTA ya esté arriba — no se
   > puede deshacer un publish, pero sí se puede obligar a decirlo.
   >
   > **Y la razón por la que esto no es opcional (medido S91):** el registro
   > publicado **no guarda el estado del árbol**. Un publish sucio **es
   > inauditable después**. Este script es la única oportunidad de saberlo.
   >
   > *El guard suelto (`verify-veda-publish.mjs`) sigue existiendo y sirve
   > para mirar antes de empezar. Lo que ya no alcanza es usarlo SOLO.*
3. **VERIFICAR EL GROUP** antes de declarar cerrado — con `update:view`, **nunca
   `update:list`**, que no muestra el `gitCommitHash`. **Y CORRER EL GUARD
   (§3bis): el group prueba QUÉ GUARDASTE; el guard prueba QUÉ SE SIRVE.
   Sin su verde, el publish NO se declara cerrado** *(firma de mesa, S86).*

   > **➕ S86 — ESTA LÍNEA GANÓ LA DISCUSIÓN, y queda registrado porque el
   > registro es lo único que evita repetirla.** `CONTRATO_TRABAJO` regla 84
   > eslabón ③ mandaba `eas update:list`; **este deber lo prohibía.** Dos letras
   > firmadas contradiciéndose es peor que una equivocada —*cualquiera cita la
   > que le conviene y está «en regla»*—. **La mesa firmó a favor de acá, y el
   > criterio vale más que el caso:**
   >
   > > ### **UNA ORDEN QUE MANDA UN INSTRUMENTO CIEGO AL DATO QUE ELLA MISMA EXIGE SE CORRIGE POR EL INSTRUMENTO.**
   >
   > *No se ablanda la exigencia para que el instrumento alcance.* **`update:list`
   > no muestra el `gitCommitHash` — que es exactamente lo que el eslabón
   > verifica.** El contrato quedó enmendado el **4-ago-2026**, **con su versión
   > vieja declarada al lado y no borrada**: quien encuentre un reporte anterior
   > citando `update:list` tiene que poder ver que citaba la letra vigente de su
   > día, y no concluir que se equivocó.
4. **ANUNCIAR EL CIERRE A TODOS**, incluida la mesa — **y a cada congelada EN
   MENSAJE PROPIO** *(enmienda S85: §4 vale también para el cierre. Una orden
   que no llega **se nota** cuando el trabajo no aparece; **un cierre que no
   llega no se nota nunca**, porque su síntoma es una pista quieta esperando
   permiso, y el silencio se parece demasiado a la obediencia).*
5. **DECIR QUÉ TRAE EL BUNDLE — leído del RANGO, y declarando cuál lista se
   está dando.** *(enmienda S85, de un caso propio.)*

### ⑤ · LAS DOS LISTAS DE UN PUBLISH, y por qué hay que decir cuál se da

> ### **EL CONTENIDO DE UN BUNDLE SE LEE DEL RANGO —`git log <ancla-anterior>..<ancla>`— JAMÁS DEL MENSAJE QUE UNO MISMO ESCRIBIÓ.**
>
> *Un `--message` es una etiqueta que redacta una persona; el rango es el hecho.*
> **El caso que la fundó (S85):** A escribió el `--message` desde el encuadre de
> la conversación y **después leyó su propio mensaje como si fuera el
> inventario** — anunció al founder dos cosas que no viajaban (una pantalla que
> no existía y una columna que no existía). *El rango estaba a un comando.*

**Y hay DOS listas verdaderas, que contestan preguntas distintas:**

| lista | qué es | para quién |
|---|---|---|
| **el DELTA** | `<ancla-anterior>..<ancla>` | **la mesa** — qué se agregó desde el último publish |
| **el ACUMULADO** | **desde el último bundle GATEADO** | **el founder** — qué va a ver por primera vez |

> **Los dos son correctos y no son intercambiables.** *Si el bundle anterior no
> se gateó, el delta le esconde al founder la mitad de lo que va a encontrar; y
> el acumulado le repite a la mesa cosas que ya conocía.*
>
> **⇒ EL ANUNCIO DICE CUÁL ESTÁ DANDO.** Una lista sin ese rótulo obliga a cada
> lector a suponer el corte — y **los dos van a suponer el suyo.**

**Por qué decir DE MÁS es peor que decir de menos, y es lo que este deber
protege:** una lista que **omite** produce una sorpresa —alguien busca y no
está—. Una lista que **sobra** manda al founder **a buscar algo que no existe**,
y cuando no lo encuentre **va a concluir que el update no entró**. *El error no
se manifiesta como "falta esto": se manifiesta como una duda sobre todo el
bundle.*

> **El ③, el ④ y el ⑤ son los que más veces se perdieron**, y por la misma razón:
> **quien publica ya terminó y se va**; la mesa está coordinando otra cosa; y **la
> pista congelada se entera de que la veda cerró porque le llega trabajo**. **El
> que congela es el que descongela.**

---

## 3 · EL PASO ⓪ DE LA VEDA — completo

**Quien publica pide la congelación AL MOMENTO, nombrando a quiénes espera.**

1. **Se nombra a cada pista.** Un *"congelen"* sin destinatarios no congela a
   nadie.
2. **Las confirmaciones se verifican POR CONTENIDO contra el ancla, no por ref.**
   `git merge-base --is-ancestor <sha> HEAD` — **y `git fetch` antes de cualquier
   comparación con `origin/main`**, que tiene forma de ref remoto y naturaleza de
   dato en caché.
3. **SE REENVÍAN TEXTUALES, jamás resumidas.** *Una confirmación sin hora no es
   una confirmación: es un recuerdo.*
4. **Una confirmación que sobrevive a una escritura NO CONFIRMA NADA.** Si
   alguien —incluida A— escribe después de recibirlas, **se descartan y se
   re-pide**. *En S84 pasó tres veces y las tres se re-pidió.*

   > **➕ AFINACIÓN S85 — CÓMO SE DECIDE UNA EXCEPCIÓN.** *Es donde esta regla se
   > rompe sin que nadie lo note, porque se rompe con un argumento verdadero.*
   >
   > **El caso:** C declaró cierre 12:32:26 y **A escribió 12:33:14** — un commit
   > **solo de `docs/`**, cero código bundleable, incapaz de alterar nada de lo
   > que C había confirmado sobre su trabajo. **La tentación de eximirlo era
   > fuerte y el argumento era cierto.**
   >
   > **No se eximió, y el criterio es lo que vale guardar:**
   >
   > > ### **LA PRUEBA NO ES *"¿mi escritura fue inocua?"*. ES *"¿EXIMIRLA AHORRA ALGO?"*.**
   >
   > **Por qué la primera pregunta es la trampa:** *toda* escritura propia parece
   > inocua **desde adentro** — quien la hizo sabe qué tocó. Contestarla convierte
   > una regla **mecánica** (¿hubo un commit después? sí/no) en una **de juicio**
   > (¿importaba?). *Y una regla que depende del criterio de quien la aplica no la
   > puede verificar nadie más — que es exactamente lo que esta regla existe para
   > no necesitar.*
   >
   > **Por qué la segunda la resuelve sin discutir el fondo:** re-pedirle a B **ya
   > era obligatorio** (su confirmación estaba vencida por escrituras de C). Las
   > dos preguntas viajaban **en el mismo mensaje** ⇒ **el costo de ser estricta
   > era CERO.** *La excepción habría sido gratis para A y cara para la regla.*
   >
   > **EL COROLARIO OPERATIVO, que es lo que vuelve barata la disciplina:** cuando
   > haya que re-pedir a UNA pista, **se re-pide a TODAS en el mismo mensaje.**
   > Ahí la pregunta *"¿esta escritura cuenta?"* **deja de tener consecuencia
   > práctica — y con eso deja de tener quien la haga.**
   >
   > *(Y el borde honesto: si alguna vez re-pedir SÍ costara —una pista fuera de
   > línea, un cierre con hora—, la decisión vuelve a la mesa **declarando el
   > costo**, no al criterio de quien escribió.)*
   >
   > **➕ SU LÍMITE (firmado S85):** el corolario **NO aplica cuando una pista YA
   > DECLARÓ su posición y la midió.** *Existe para que nadie tenga que juzgar si
   > una escritura cuenta; usarlo para sobrescribir una declaración explícita
   > sería usarlo contra su propósito — dejaría de evitar el juicio propio y
   > pasaría a imponerlo sobre el ajeno.* **El caso:** al borrar el stub, C
   > declaró que un archivo sin trackear que nunca fue suyo no es escritura sobre
   > su territorio **y lo midió** (`git log -- app.json` vacío); B pidió
   > re-confirmación si el borrado ocurría después de su hora. **Se respetó lo
   > que cada una declaró** — más preciso que aplicarles la misma regla a las dos.
   >
   > **➕ Y LA SEGUNDA MITAD, que es la que faltaba (firmada S85):**
   >
   > > ### **QUIEN FIJA UN ANCLA DECLARA SI VA A SEGUIR ESCRIBIENDO, O NO LO FIJA TODAVÍA.**
   >
   > *La afinación de arriba contesta **"¿eximir ahorra algo?"** y no contestaba
   > **"¿avisaste que ibas a escribir?"**.* **El caso, y lo pagó A:** pidió
   > confirmaciones, las dos pistas las dieron, **y A commiteó tres minutos
   > después** — las venció ella misma. **La primera mitad protege de un juicio
   > propio; la segunda protege a las otras dos de gastar una confirmación en un
   > ancla que ya sabías que ibas a mover.**
   >
   > **➕ EL TEST DE EXENCIÓN MEDIBLE — REGISTRADO Y ACEPTADO POR LA MESA (S85,
   > segunda veda del día). NO ablanda la regla: le da un juez.**
   >
   > **El caso:** A escribió `docs/` **después** de las dos confirmaciones ⇒ por
   > la letra de arriba, vencidas. **A no las dio por válidas: midió si la regla
   > discriminaba**, y trajo las dos mediciones:
   >
   > 1. **`git diff <última confirmación>..<ancla> -- apps packages` = VACÍO.**
   >    *El ancla se movió; **la carga del bundle no**.*
   > 2. **El commit ERA la resolución del WIP que la propia confirmación de C
   >    nombraba como condición** para poder bundlear.
   >
   > **⇒ Exento, declarado, y con las dos mediciones en el reporte.**
   >
   > **LA FORMA DEL TEST, para que no se use de excusa:** *(a)* **se corre y se
   > publica el resultado** — no se afirma · *(b)* **el diff tiene que ser
   > VACÍO sobre `apps` y `packages`**, no "chico" · *(c)* **quien lo invoca lo
   > declara en el mismo mensaje del hash**, jamás después.
   >
   > **Por qué merece existir en vez de re-pedir siempre:** una re-confirmación
   > que **no puede cambiar el bundle** es un rito, **y un guard que no
   > discrimina es decorativo** (L-192). *Pero el rito es barato y el test
   > exige medir: **ante la duda o sin las tres condiciones, se re-pide**.*

5. **LA VEDA NO SE LEVANTA SOLA POR URGENCIA.** *(aporte de C, S84.)* Si la mesa
   necesita que una pista trabaje durante una veda, **la levanta explícitamente y
   lo declara** — y **después se RE-PIDE congelación**. **Un levantamiento tácito
   no existe.**
6. **El cierre se declara a TODOS los congelados, incluida la mesa.**

**Y el árbol de `main` se verifica limpio ANTES de bundlear, no después** — el
ancla se lee al bundlear.

---

## 3ter · EL MERGE Y EL ANCLA — regla 86 *(CONTRATO v1.29, S86)*

**El trabajo de una pista entra a `main` con `git merge --no-ff`.**
**Prohibidos entre pistas: `rebase`, `squash`, `cherry-pick`.**

> ### **UN HASH QUE UN ACTA CITA TIENE QUE SEGUIR RESOLVIENDO.**

**Y el corolario que toca al publish: EL ANCLA DEL OTA ES EL COMMIT DE
FUSIÓN, jamás el último de la pista** — *el bundle se arma desde `main`,
así que el hash de la rama nombra un árbol que nunca se bundleó.*

**La letra completa vive en `CONTRATO_TRABAJO` regla 86** — acá solo su
consecuencia operativa. *Se referencia, no se copia.*

---

## 3bis · LA SEGUNDA MITAD DEL PASO ⓪ — el guard del destino *(firmada por la mesa, S86)*

> ### **EL PASO ⓪ VERIFICABA EL ANCLA; LE FALTABA VERIFICAR EL DESTINO.**
>
> *Un ancla limpia sobre un runtime que ningún binario tiene es un OTA perfecto
> que no le llega a nadie.*

**Las dos mitades corren en momentos distintos, y decirlo evita el malentendido
obvio:** la de arriba corre **ANTES** del bundling —congela el árbol, fija el
ancla—; ésta corre **DESPUÉS del publish**, porque necesita el `updateId` que
el publish recién produce. **Es un mismo paso ⓪ con dos relojes.**

```
node scripts/verify-ota.mjs --app <prestador|cliente> --update <updateId>
```

**QUÉ LO PARIÓ, con su fecha:** el 4-ago-2026 el OTA del prestador salió con
**todo verde** —12 hashes ancestros de `origin/main`, árbol limpio,
`update:list` leído después del publish mostrando el group propio como cabeza—
**y el founder no vio nada.** Ninguna verificación del paso ⓪ podía fallar,
porque **ninguna preguntaba lo único que importa: qué le responde el servidor a
un aparato que pregunta como aparato.**

> **`update:list` describe LO QUE GUARDASTE. El guard mide LO QUE SE SIRVE.**
> *Son dos cosas distintas y solo la segunda llega al teléfono.*

**LOS TRES CASOS** *(el fixture con su rojo producido ANTES —L-199— vive en
`docs/relevamientos/2026-08-04-s86a-FIXTURE-verify-ota.md`)*:

| | qué mide | qué hace |
|---|---|---|
| **①** | el id servido ≠ el id publicado | **ROJO** — y dice **QUÉ** se sirve en su lugar |
| **②** | el runtime publicado no tiene NINGUNA build `finished` | **ROJO** — el caso literal de la letra |
| **③** | runtimes **huérfanos**: tienen binario y NO reciben este lote | **AVISA, NO FRENA** |

**El ③ avisa por letra de mesa, y su porqué está probado por el propio aviso:**
el prestador tiene **cuatro** runtimes con binario instalable —`1.0.0` · `1.0.1`
· `1.0.2` · `1.0.3`— y **el `1.0.2` recibe todavía el update del 26-jul.** *Por
eso «si su APK fuera 1.0.2 no le llegaría» sonaba tan bien: era cierto,
comprobable, y le faltaba que además le llegaría algo de hace nueve días.*
**Callar ese dato es lo que hizo creíble el diagnóstico equivocado.**

### EL COSTO QUE ESTE ENGANCHE ACEPTA, declarado de antemano

**Por L-197, si el guard NO PUEDE MEDIR sale ROJO, jamás verde** — un fallo
degrada a **ausencia**, nunca a un valor que el consumidor use como cierto.
**Enganchado, eso significa que una caída de EAS frena un cierre.**

> **Se acepta a propósito, y se escribe acá para que el primer rojo de
> infraestructura no lo deslegitime.** *Un guard que ante la duda dice «verde»
> es exactamente el guard que no hubiera atrapado el 4-ago.* **El escape existe,
> es explícito y es ruidoso: `--sin-builds` saltea la mitad ② y lo dice en
> pantalla** — y quien lo use lo declara en el mismo mensaje del ancla.

**Y una trampa medida, que es L-191 y la casa ya la tenía escrita:** el exit se
lee **del comando**, jamás de un pipe. *La primera corrida de este mismo fixture
leyó `$?` después de un `| tail` y devolvió `EXIT=0` sobre una salida que decía
«EN ROJO» — el guard estaba bien y la medición mentía.*

**Su hermana, y lo que NO cubre:** el guard prueba que el update **se sirve**;
**que el aparato pueda IR A BUSCARLO es `D-649`** — hoy no hay forma de forzar
la búsqueda desde la app, y reinstalar (la única salida) **borra la evidencia de
por qué no bajó.**

---

## 4 · LAS ÓRDENES A PISTAS VAN EN MENSAJES PROPIOS

**Una orden a una pista dentro de un mensaje dirigido a la mesa NO LLEGA.**

*Y el daño va en las dos direcciones: la pista no sabe si el mensaje es para
ella, y el destinatario real recibe trabajo que no le toca.* **Cada mensaje
declara su destinatario.** *(D-609, incidente 4.)*

---

## 5 · QUÉ REPORTA UNA PISTA

> ### **HALLAZGOS, NUNCA VEREDICTOS.**

Una pista mide y trae **lo que midió, con su literal**. La adjudicación es de la
mesa. *Cuando una pista reporta un veredicto, la mesa pierde la información que
lo produjo — y esa es justamente la que permite corregirlo.*

### El freno explícito, que es lo que hace funcionar todo esto

**Toda orden de construcción lleva su condición de freno:** *"si al medir el
cuadro cambia, frená y traelo"*.

**En S84 eso produjo DIECIOCHO frenos conocidos —nueve de A, nueve de C— y solo
UNO fue falso.** *(Y el falso lo fabricó un guard que funcionaba: dio rojo y
mintió sobre por qué.)*

> **⚠️ Y SU COSTO OCULTO, que hay que conocer para usarlos bien:** un dato viejo
> que dice **"sí"** se descubre al chocar. Uno que dice **"no se puede"** **no se
> descubre nunca, porque nadie verifica por qué algo NO se hizo.**
> **La cura no es frenar menos — es que TODO FRENO DECLARE CONTRA QUÉ MIDIÓ.**

---

## 6 · CÓMO SE PIDE ALGO DE OTRO TERRITORIO

> ### **SE DECLARA Y SE PIDE. NO SE CLONA.**

**Clonar es siempre más rápido y siempre peor:** dos implementaciones del mismo
dato **se separan un día y nadie se entera**.

**Los casos de S84, todos resueltos así:**

| qué | quién pidió | cómo se resolvió |
|---|---|---|
| **el pie de `Campo`** | C | B lo subió a `packages/ui` |
| **la variante `acento` de `Boton`** | C | B la construyó |
| **`superficie="muro"`** | C | B la construyó |
| **los glifos** (contacto · documento · fiscal · bancario) | C | B los dibujó, **en dos candidatos** |
| **`resolverUrlGaleriaPrestador`** | C | A lo llevó a `packages/api`, al lado de su gemela |
| **`modo: 'alternativa'`** | C | **C frenó** en vez de forzarlo con un cast |

### ➕ LA EXCEPCIÓN LEGÍTIMA — **se comparte la FORMA, jamás la VOZ** *(aporte de C, S85, firmada)*

**Se escribe porque sin ella el próximo importa el archivo creyendo que hace lo
correcto** — y tendría de su lado la regla de arriba.

**El caso:** el cliente y el prestador tienen un diccionario de voz para el mismo
hecho. **Compartir el archivo parecería lo obvio** (un dato, una fuente). **Y
sería un error:** el dueño lee **«Recibió la vacuna»** y el prestador lee **el
hecho profesional**. *Son el mismo evento contado a dos audiencias distintas.*

> ### **LO QUE SE COMPARTE ES LA FORMA (la pieza, el tipo, el contrato). LA VOZ ES DE CADA CASA.**
>
> *Clonar una pieza duplica una implementación; **compartir una voz duplica una
> audiencia** — y ésa no se puede deduplicar, porque nunca fue una.*

**La prueba, para no tener que discutirlo cada vez:** *¿el texto cambia según
QUIÉN lo lee?* **Si sí, no es infraestructura: es voz, y no se comparte.** *La
Ley 3 lo dice desde S45 —el diccionario vive adentro del componente— y esto es
su versión entre pistas.*

**⚠️ Y lo que la excepción NO autoriza:** clonar **la pieza** porque la voz
difiere. *La forma sigue siendo una — se ensancha con una prop de voz, no con un
segundo archivo.* **La excepción es sobre el TEXTO, no sobre el componente.**

**Y el caso que muestra el límite:** cuando A **omitió** el re-export de tres
símbolos que ella misma acababa de escribir *"para destrabar a C"*, **C agregó
las tres líneas en territorio de A y LO DECLARÓ**. *Eso es correcto: no era una
decisión de A sino una omisión, y la alternativa —clonar la regla fiscal— era
exactamente lo que la función existía para evitar.* **Se verifica y se firma, o
se revierte.**

---

## 7 · LO QUE ESTE MÉTODO NO CUBRE

- **El reparto de trabajo lo hace la mesa**, sesión por sesión. Este documento
  dice **quién puede tocar qué**, no **qué se construye**.
- **Los gates son del founder.** Ninguna pista declara algo firmado.
- **B y C no tienen su propio documento de método.** Lo de acá se escribió desde
  A, con lo que A observó — *sus prácticas internas viven en sus contextos, y eso
  es lo que una compactación se lleva.*


---

## CANDIDATAS DE S88 — medidas en la sesión, a la firma de la mesa

**① `supabase/.temp` es la TERCERA pieza del arranque de worktree.** Junto con
`node_modules` y `.env.local`. *Sin ella, el CLI apunta a otro proyecto o a
ninguno, y el error no dice eso.*

**② `eas update:view` SIN `--json` no imprime `gitCommitHash`.** El eslabón ③
del cierre exige verificar el ancla por contenido, y el instrumento que la
letra manda **calla justo el campo que la letra pide**. *Una orden que manda un
instrumento ciego al dato que ella misma exige se corrige POR EL INSTRUMENTO.*

**③ ⚖️ YA FIRMADA COMO REGLA 87 (contrato v1.30): un aparato conectado no es un
aparato libre.** Cada pista fija su `ANDROID_SERIAL` y no dispara intents a un
serial que no declaró como suyo. **Costo medido en S88: dos rotaciones de
credenciales reales, y una pista perdiendo tiempo midiendo si había roto algo.**

**④ Y la que S88 pagó cinco veces, para el paso ⓪ de cualquier pista:**
*ningún contador, ancla, hash o `functiondef` se toma de un reporte previo —
se lee del objeto en el turno en que se usa.* **La ventana de invalidación
puede ser de minutos.**

---

## S91 — LO QUE EL MÉTODO APRENDIÓ DE UN DÍA DE CUATRO PISTAS

### ① QUIEN PUBLICA ES QUIEN MERGEA *(enmienda a §2, firmada en sesión)*

La fila de C decía «el canal OTA» y §2 decía «nadie más publica»: **dos líneas
firmadas que se contradecían.** Se resolvió con el argumento de los hechos —
**los choques de S91 pasaron porque el que publicaba y el que dominaba el árbol
eran personas distintas.** *El acto de publicar es de A; la superficie de los
dos canales sigue siendo de C.*

### ② EL PUBLISH ES UN ACTO ÚNICO, Y AUN ASÍ TIENE UN LÍMITE MEDIDO

`scripts/publicar-ota.mjs`: veda (como hijo) → publish → **re-verificación
posterior que GRITA** si HEAD se movió, si el ancla real no es la verificada o
si trae asterisco. **El `--mensaje` no lleva el ancla: la pone el script.**

**Y el límite, que hay que saber:** el bundling tarda ~60 s, así que **ni un
acto atómico impide que otra pista commitee mientras corre**. Lo único
garantizable es **que sea imposible no enterarse**.

**⚠️ Por eso importa más de lo que parece:** medido en S91, **`eas update:view`
NO expone el estado del árbol** ⇒ **un publish sucio es inauditable después.**
El script es la única oportunidad de saberlo, y **el asterisco se transcribe en
el momento o se pierde.**

### ③ UNA PISTA SIN WORKTREE ENVENENA LA VENTANA DE TODAS

`git worktree list` en S91: worktrees de B y de D, **ninguna de C** — C trabajó
en el directorio primario, **sobre `main`, el mismo árbol desde el que A
publica**. Los cuatro asteriscos del día salieron de ahí.

**El acto único cierra la ventana entre verificar y bundlear; no puede cerrar
la de una pista que ESCRIBE mientras Metro lee.** *Los cuatro publishes limpios
del cierre salieron limpios porque las cuatro pistas estaban en cero al mismo
tiempo — no por el guard.* ⇒ **worktree por pista no es comodidad: es la
condición para que el ancla signifique algo.** (La `worktree-detached` de la
regla 82 sigue CANDIDATA desde S81 y ya cobró cuatro veces.)

### ④ TODA LISTA DE COMMITS PENDIENTES SE VERIFICA CON `merge-base`

**Tres veces en S91** una lista de pendientes llegó vieja: *doce* que era uno,
*seis* que era uno, *tres* que eran cero. **Ninguna causó daño porque el
`merge-base` se corrió igual.** Pasa por una razón estructural y no por
descuido: **la lista se arma antes del merge anterior.**

*Un merge que nombra commits ya fusionados sale VERDE igual y deja el acta
afirmando algo falso* — y el acta es lo que la próxima sesión lee.

### ⑤ UN SÍNTOMA CRUZA TERRITORIO COMO HIPÓTESIS, JAMÁS COMO ORDEN

**Tres hipótesis en un día**, tres pistas, **ninguna con mala fe y las tres
parcialmente equivocadas**: cada una descartó lo suyo con rigor y, por
eliminación, apuntó afuera — donde no podía eliminar igual.

**La forma:** el síntoma viaja **con su medición**, y **el dueño del territorio
mide antes de curar** — sobre todo cuando la cura propuesta *abre* algo. *En
S91 la orden que salvó el día fue la que traía su propio freno: «si `direccion`
es la exacta, la cura NO es el grant».* (L-213, L-214.)

### ⑥ EL PEDIDO ENTRE PISTAS, CUANDO ESTÁ BIEN HECHO

El molde de S91 lo dejó D: **su mitad construida e INERTE** (el token de intento
viaja en los params y **hoy no se manda**), más **un pedido autocontenido en
disco** con el contrato exacto —`p_token_intento text DEFAULT NULL`, sin token =
comportamiento de hoy, `ya_existia` como ÉXITO—. *Así el merge no puede romper
nada y la puerta se abre con una línea el día que exista.*
