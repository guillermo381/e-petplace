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
| **B** | `packages/ui` · los **tokens** · el **lint** (`verify-diseno.mjs`, `verdicto.mjs`) — **exclusivo** |
| **C** | `apps/prestador` · **el canal OTA** |

**El corte no es por comodidad: es por DÓNDE VIVE LA VERDAD DE CADA COSA.**

- **A tiene la DB y la puerta única** porque el motor y su wrapper **son el mismo
  contrato**: partirlos entre dos pistas produce el patrón que S84 vio tres veces
  —*el motor se adelanta a su wrapper*— y cada vez costó un turno.
- **B tiene el lint en exclusiva** porque **es quien puede romperlo sin que nadie
  lo note**: un guard es de quien lo mantiene, o se vuelve el guard de nadie.
- **C tiene la app** porque es donde el craft se ve, y **el craft se firma sobre
  la pantalla real** (regla 80).

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
3. **VERIFICAR EL GROUP** antes de declarar cerrado — con `update:view`, **nunca
   `update:list`**, que no muestra el `gitCommitHash`.
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

5. **LA VEDA NO SE LEVANTA SOLA POR URGENCIA.** *(aporte de C, S84.)* Si la mesa
   necesita que una pista trabaje durante una veda, **la levanta explícitamente y
   lo declara** — y **después se RE-PIDE congelación**. **Un levantamiento tácito
   no existe.**
6. **El cierre se declara a TODOS los congelados, incluida la mesa.**

**Y el árbol de `main` se verifica limpio ANTES de bundlear, no después** — el
ancla se lee al bundlear.

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
