# S112 · CIERRE CONSOLIDADO — las cuatro pistas (A · B · C · D · E)

> **Compilado por A el 3-sep-2026**, sobre `main` con las cuatro pistas de
> código dentro (B, C, D, E) más el trabajo propio de A — control de
> ancestría corrido antes de compilar sobre TODAS las ramas del remoto.
> Fuentes: `S112-A.md` (este parte) · `S112-B.md` · `S112-C.md` · `S112-D.md` ·
> `S112-E.md` · `S112-LOOP-ADOPCION.md` (el brief que abrió el vertical).

---

## ① CONSTRUIDO Y EJERCIDO — por camino real, y lo que vio el founder en aparato

**El hallazgo del cierre: sólo DOS cosas se probaron con un dedo real en un
teléfono en toda la sesión — el ejercicio de E del vertical de adopción, y la
pasada del founder sobre el lote 5.** Todo lo demás de abajo es "ejercido"
en el sentido de *corrido contra el objeto por camino real* (RPC real, RLS
real, JWT real), no de *visto en una pantalla*.

- **🟢 EL PRIMER TRASPASO REAL DE LA HISTORIA DEL PRODUCTO (E).** Sobre
  *Nube*, con tres sesiones reales, de punta a punta: postular con formulario
  → hilo → aceptación → acta → dos firmas con código de un solo uso →
  **traspaso**. Folios `F-2026-000050` (adoptante) y `F-2026-000054`
  (refugio). Verificado desde cada asiento: la familia ve a Nube (`adoptada`,
  `user_id` propio, 3 eventos incluido uno de ANTES de la entrega — el
  expediente que el refugio cargó viajó con ella), el refugio dejó de verla,
  un tercero tampoco. **De este ejercicio salieron cinco defectos reales que
  ningún typecheck ni gate había visto** (ver §②) — todos en el camino
  feliz, no en un borde.
- **🟢 EL LOTE 5 EN APARATO, RECORRIDO Y APROBADO POR EL FOUNDER (3-sep).**
  El hilo de adopción abre en las dos apps — la cura del crash (TDZ en
  `useMemo` antes del `useRef`, ver §④ del handoff previo) queda **verificada
  en dispositivo**, no sólo por contenido en `main`.
- **El durante de guardería, los cinco actos** (A) — cinturones con rojo
  producido primero.
- **Las cinco voces del aviso** (A) — medidas ejecutando la función contra la
  base, control positivo y negativo.
- **La bitácora del prestador** (A) — 10 brazos, 5 rojos primero, residuo 0;
  el rojo que vale: `vomito` rebotó sobre Pepe, un ave.
- **El orden del día por franja** (A) — ejecutado sobre datos vivos.
- **El acta de recogida** (C, S111) — ejercida por el founder en su pasada.
- **`ruta` en el `data` de FCM** (A) — edge desplegada; C probó su parser
  9/9.
- **El módulo de mensajería** (D) — `verify:mensajeria` **50/50**, dominio
  puro.
- **D-485, el censo** (A) — rojo confirmado con `BEGIN/ROLLBACK` sobre la
  base viva ANTES de curar; verde después por PostgREST real (anon key +
  sesión real, `pnpm verify:d485-familia-lee`): familiar=1 · tercero=0 ·
  anon=0, en `mascotas` y `estadias`; cinturón SQL 10/10 sobre las cinco
  tablas del censo.
- **La burbuja de pendientes, mitad cliente** (B+C) — motor por camino real
  (`pnpm verify:mis-hilos-realtime`: familiar=1 · refugio=1 · tercero=0 ·
  residuo=0), montada en el shell del cliente y **publicada** (ver §⑥).
- **El hook curado** (A) — rojo medido en las dos direcciones (`MOCK_EXIT=1`
  y `=2`) antes de curar, verde después, con el hook real corriéndose a sí
  mismo en el commit que lo cura.
- **`verify:diseno`, `verify:vio-todo`, `verify:fila-memoizada`,
  `verify:hoisting-nativo`, `verify:ref-antes-de-uso`, `verify:abanico`,
  `verify:rutas-de-aviso`** — los siete gates nuevos de S112, todos con su
  rojo probado antes de cablearse (ver §⑤ de cada parte fuente para el
  control positivo de cada uno).

---

## ② 🔴 CONSTRUIDO Y NO EJERCIDO — la sección que se lee como hecho

> *Lo no construido se sabe. **Lo construido y no ejercido se lee como
> hecho.***

**El hallazgo más caro de la sesión, dicho por C: "de todo lo que hice en
S112, lo único que tocó un aparato fue el crash del hilo — y apareció con
los cuatro typechecks en 0, `verify:diseno` verde con 61 reglas y todos los
trinquetes en su número."** La burbuja, la bitácora del lado familia, los
clips, el quinto oficio (guardería en el Hoy) y la pantalla forense **no se
probaron en teléfono.**

- **Los cinco defectos del traspaso real de E — construidos y NUNCA
  ejercidos hasta que E los corrió**, y las tres del medio son la lección de
  la jornada: *una rama que nunca se ejecutó no está probada por existir.*
  El traspaso escribía `retirada` (un estado que su propio CHECK prohíbe) ·
  el array de faltantes sin castear reventaba con un error crudo · el
  `INSERT` del hito nombraba 5 columnas inexistentes · el OTP aceptaba
  intentos ilimitados · `adopcion-fotos` sin policy de SELECT hacía que
  `remove()` dijera éxito sin borrar.
- **La burbuja del prestador (mensajes + solicitudes)** — construida por C
  al cierre (`53ed5f22`, mergeada en `main`), con dos rojos que su propio
  arnés cazó (el hilo colapsaba destino-vs-colisión de teclado, el acta se
  apagaba de más). **Cero aparato.** Ver §⑥: entra a S113 sin publicar,
  por orden del founder.
- **H3 · guardería no aparece en la lista de oficios del Hoy** — medido y NO
  curado (`(tabs)/index.tsx:191`, una lista escrita a mano que no incluye
  `guarderia_dia`, que SÍ está activo para demo-vet). No se tocó porque
  mueve el techo, el filtro y la unidad del HOY entero — va con su propia
  pasada.
- **H4 · la bitácora del lado familia** — los lectores devuelven 25 eventos
  con bitácora y foto; **es puro montaje** de tres puertas (el en vivo, la
  ficha de la estadía, el expediente) contra un dato que ya existe.
- **`Convivencia`, `TarjetaAdoptable`, `BloqueConCriterio`, `FiltroPills`
  varias** (B) — entregadas, **0 puertas en `apps/`** al cierre de la primera
  tanda de B; `TarjetaAdoptable` la montó C y la revirtió al deshacer un
  merge, así que hoy también está sin puerta.
- **El gate de `Convivencia`, arbitrado por el founder (a): en el lote de
  adopción, sobre la ficha con datos reales** — sigue esperando que esa
  ficha exista; hoy la vidriera postula directo, sin pantalla intermedia.
- **Que el correo LLEGUE** (E) — medido hasta el proveedor (6 intenciones,
  con `proveedor_id`, sin gate, `correo_suprimido` en 0); que una persona lo
  reciba es del founder, abriendo su bandeja.
- **Que el cron 48 (silencio de 5 días) DISPARE de verdad** — el mecanismo
  corre para 27 de 28 jobs; al 48 sólo le falta que pase el reloj (ver
  hoja de decisión, ítem de calendario).
- **El scroll a 60 fps del hilo, el número del perfilador de A14** (B) —
  las tres patas de la memoización están puestas; que den cero lo dice un
  perfilador que nadie corrió, no el código.

---

## ③ ENTREGADO Y NO MONTADO — y de quién es la puerta

| pieza | dueño | puerta | estado |
|---|---|---|---|
| `Convivencia` (todo-desconocido) | B | ficha de adoptable (C) | ⏸ ficha inexistente |
| `TarjetaAdoptable` | B | vidriera (C) | ⏸ montada y revertida |
| `BloqueConCriterio` | B | vidriera (C) | ⏸ espera `destacado_espera` del servidor |
| `FiltroPills` modo `varias` | B | vidriera (C) | ⏸ espera los 3 estados de convivencia del lector |
| `TarjetaMascotaRefugio` séptimo estado | B | tab Mascotas (C) | ✅ montada |
| El menú «Quiénes están hoy» de fila | B | Hoy del prestador (C) | 🟡 C no lo pidió a propósito — el lector no falta (`obtener_estadias_del_dia`), pero pedir con un contrato adivinado es cómo nacen las piezas que nadie monta |
| Burbuja del refugio (mensajes+solicitudes) | B+C | shell del prestador (A merge) | ✅ montada, **NO publicada** — primer objetivo de S113 |
| `SemaforoSanitario` — el compromiso de esterilización | B | ficha + portal del refugio (C) | ⏸ espera firma del founder — ítem 13 de `S112-HOJA-DE-DECISION.md` |

---

## ④ NO CONSTRUIDO A PROPÓSITO — con su razón

- **Ni una palabra de texto legal nueva más allá de lo firmado.** Las
  puertas fail-closed contra documentos que no existen se quedan así.
- **El protocolo del animal no retirado** (guardería) — frenado por riesgo
  penal, esperando al abogado (memo 10 §3). Ver hoja de decisión.
- **Padrinazgo y donación (§6/§7 de `LETRA_ADOPCION`)** — construidos hasta
  donde la letra alcanza, **sin motor de cobro**: esperan la respuesta del
  contador sobre el 5 % (pregunta 11).
- **`_voz_notificacion` NO se tocó** por D — 30 000 caracteres de `CASE`
  compartido; reescribirlo desde un worktree que no puede aplicar ni medir
  es cómo se pisa a otra pista. Sigue tomado por A.
- **El adjunto de imagen del hilo** — D no pudo producir su rojo porque no
  hay puerta; se reporta la ausencia, jamás un verde de mentira.
- **B6 (el memorial del chat) no se construyó** — el memorial de esta casa
  es `<ThemeProvider memorial>`, un TEMA, no una pieza nueva.
- **Las cuatro láminas de gate de S112 quedan como están** (orden del
  founder, 2-sep) — desde ahora **B no construye láminas**: el gate es el
  recorrido montado, no la galería.

---

## ⑤ FICHAS Y LECCIONES — con su disparo

| # | qué | disparo |
|---|---|---|
| `D-485` | ✅ **CERRADA.** El censo de las 81 tablas colgadas de `mascota_id`; 5 compartían la misma clase que `mascotas` (estadías, programas, suscripciones, acceso a prestador, acción destructiva) | — |
| `D-1001` | 🔴 la mensualidad no valida especie | cerrar antes de la primera mensualidad real fuera de prueba |
| `D-1002` | 🔴 el comando de numeración del canon medía mal para los dos lados | curado — `proximo:ficha` |
| `D-1005` | el mapa de glifos vivía dentro de una app | — |
| `D-1006` | los `nodo*` con anatomía de 12px vencida en un nodo de 24 | — |
| `D-1007` | 🔴 `hoy_local()` ignora la zona del prestador, 58 funciones repiten la constante — la APP ya pide el día correcto, el MOTOR no | el primer prestador fuera de Ecuador |
| `D-1008` | 🔴 un error que tira una pantalla no llega a ningún lado — cero Sentry, cero tabla, cero `captureException` | decisión de plataforma |
| `D-1009` | el predicado de "sin leer" vive repetido tres veces, a propósito, con su costo declarado | la primera tanda que toque cualquiera de los dos lectores por otro motivo |
| `L-478` | el toque 2 de B se mide en la app montada, no en la galería | — |
| `L-481` | la entrega se declara por rama; la recepción se verifica por commit — mergear "el tip" no garantiza que entre todo | — |
| `L-484`–`L-487` | (numeración de B/C/D — ver cada parte fuente para el texto completo) | — |
| `L-488` | un censo estático entrega candidatos, no veredictos — ningún grep puede leer una intención (co-autoría C+E) | — |
| `L-489` | un rojo verdadero con fecha, leído después como un hecho presente | — |
| `L-490` | `core.hooksPath` es una ruta absoluta al árbol principal, no obedece a ninguna rama | — |

⚠️ **La numeración completa de L-4xx entre B/C/D no se re-lista acá letra por
letra** — cada parte fuente (`S112-B.md`, `S112-C.md`, `S112-D.md`) trae su
candidata con su texto y su co-autoría; éste es el consolidado de las que
tienen número depositado.

---

## ⑥ LO QUE ESPERA AL FOUNDER

**→ `docs/loop/S112-HOJA-DE-DECISION.md`**, por separado.

---

## ⑦ EL ESTADO OPERATIVO

| qué | valor |
|---|---|
| `main` | **ver §6 del cierre técnico, abajo — commit final** |
| migraciones | **652** local = remoto, cero huérfanas |
| typechecks | **4 en 0** (api · ui · cliente · prestador) — `domain` con su rojo **pre-existente**, declarado desde S45 (`@types/emscripten`), nada de S112 lo mueve |
| gates | `diseno` 61 reglas verde · `vio-todo` 6/6 · `fila-memoizada` 3/3 · `hoisting-nativo` 0 fuera de declaración · `ref-antes-de-uso` verde · `abanico` 10/10 · `rutas-de-aviso` 4 emitibles con destino · `mensajeria` 50/50 · `razon-muda` **140**, baseline sin subir |
| ramas mergeadas | B (`b40cbb06`) · C (`53ed5f22`) · D (`b9ad78d2`) · E (`ddb457b9`) — las cuatro verificadas ancestro de `main` por SHA |
| ramas listadas, no mergeadas | 16, ninguna de S112 — ver §① del cierre técnico |

### LOS SIETE PUBLISHES DE S112, leídos del objeto con `eas update:list` +
`update:view --json` — no de memoria ni del texto del publish

| # | cliente / prestador | ancla | contenido |
|---|---|---|---|
| 1 | `6aedf349` / `51a263b2` | `fde8494d` | guardería: D-1001 con su pantalla (especie y propiedad) · D-1000 · el Botón dibuja su razón |
| 2 | `46e2afd0` / `a6fbd3d8` | `23867033` | el vertical de adopción entero: vidriera/portal, ficha, formulario, acta y firma |
| 3 | `3cf23c3e` / `1a824db9` | `6af1e3ae` | **lote 2** — adopción completa (vitrina, buscador, filtros, avatares por especie) + guardería (foto a la primera, clip, en vivo) |
| 4 | `fe5b911b` / `267dbff8` | `84e1add5` | **lote 3** — chat de adopción (escalera, hilo, realtime), vitrina del refugio y buscador, filtros |
| 5 | `a3ca0121` / `c60d81f3` | `8bd1ce4e` | **lote 4** — el día en la zona del negocio, chat en vivo sin sondeo, vitrina del refugio con sus imágenes |
| 6 | `4662308e` / `d9874131` | `f57c9967` | **lote 5** — la cura del crash del hilo (TDZ), pantalla forense, conductas en la línea de vida, zona horaria real — **recorrido y aprobado por el founder en aparato (3-sep)** |
| 7 | `95cc9073` / `d4809664` | `e29238a9` | burbuja de pendientes (mitad cliente), D-485 (motor), hook curado |

runtime **1.0.7** en las siete · canal **preview** · `dirty: None` en las
catorce filas (ios+android × 7). ⚠️ **Son SIETE, no cinco** — se declara la
cuenta medida, no la esperada: dos de los siete (#1 y #2) son de antes de que
la numeración "lote N" empezara con el lote 2.

### LO QUE ESPERA BUILD NATIVA, no OTA

- **`expo-clipboard` en el prestador** — dependencia nueva declarada en el
  lote 5, el binario 1.0.7 no la tiene; el botón "Copiar" de la pantalla
  forense dice "no se pudo copiar" hasta la próxima build nativa (guardado
  por `require` perezoso en un `try`, no rompe nada).
- **`useAnimatedKeyboard` fue RETIRADO**, no agregado — su retiro fue la
  primera hipótesis del crash (descartada: no era la causa real, que fue
  el TDZ). No genera deuda de build.

---

## ⑧ ERRORES DE CONDUCCIÓN, sin maquillar

1. **Empecé a construir la burbuja del prestador en paralelo con C**, sin
   saber que C ya lo tenía casi terminado — la descarté sin commitear al
   ver el aviso de C, pero el propio C midió que fue timing y no diseño:
   sus dos rojos aparecieron DESPUÉS de commitear, no antes; si el orden
   hubiera sido al revés, mi versión (sin esos dos rojos) habría entrado
   limpia. El costo real es §23 de C: **el reparto no se escribió en
   ningún lado al abrir la sesión**, y con cinco pistas un pedido puede
   mandarse a la sesión equivocada (le pasó a C con D) o dos pistas pueden
   construir lo mismo sin saberlo (me pasó a mí con C).
2. **Expliqué mal el mecanismo del hook a C** — dije "tu rama no lo tenía
   todavía" cuando la causa real es que `core.hooksPath` es una ruta
   absoluta al árbol principal y no depende de ninguna rama (`L-490`). C lo
   midió contra su propio `git config`, no aceptó mi explicación de
   palabra, y me lo corrigió con el comando y su salida.
3. **La primera versión de `contar_pendientes()` duplicó una función que ya
   existía** (`contar_solicitudes_por_revisar`) — mi censo por patrón
   (`%pendiente%`/`%hilo%`) no la veía; el que la encuentra es un censo por
   CUERPO. Curado el mismo día (`D-1009` declara por qué el resto del
   predicado sigue triplicado a propósito).
4. **Mi primer discriminador del cinturón de `contar_pendientes` nació mal**
   — exigía que la familia viera `!= 0` cuando la familia había leído todo
   y `0` era la verdad. El propio cinturón lo cazó al primer intento; curado
   con una sonda que se fabrica su propio caso en una subtransacción que se
   deshace sola (`L-406`).
5. **Asumí "eutanasia" para `accion_destructiva_pendiente` por el nombre de
   la tabla**, sin leer el CHECK — es la máquina de consenso entre codueños
   (dar de baja, remover codueño, transferir), no un protocolo de fin de
   vida. Corregido antes de depositar la migración, no después.

**Ninguno de los cinco tenía síntoma hasta que algo lo miró** — el patrón que
la propia sesión nombró seis veces del lado de B/C/D/E: *un rojo verdadero
con fecha, leído después como un hecho presente* (`L-489`), y *medir la
propia rama y llamarlo "el estado"* (precedente de S107, cobrado otra vez
por A y por B el mismo día, en direcciones opuestas — ver `S112-B.md`).
