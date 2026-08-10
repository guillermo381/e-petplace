# S94-PERF · ACTA DE CIERRE — EL LOOP DE VELOCIDAD

**9 de agosto de 2026 · Pista A sola · founder ausente durante la corrida.**
Cero features. Cero seguridad tocada. Cero diseño.

---

## ① LA TESIS, EN UNA LÍNEA

> **No hay consultas que optimizar. Hay viajes que eliminar.**

Todo lo demás de esta acta es la evidencia de esa frase, y lo que se hizo con
ella. La sesión abrió buscando consultas lentas —que es lo que se busca
siempre— y **no encontró ninguna**. Lo que encontró fue una app que paga un
peaje fijo de ~150 ms por cada ida y vuelta, y pantallas que encadenan hasta
doce.

---

## ② DÓNDE SE MIDIÓ, Y POR QUÉ IMPORTA DECIRLO (R4)

Todo número de esta acta viene de la **base remota del proyecto vivo**, medido
desde la máquina del founder, **por la misma puerta que usa la app**
(PostgREST), con token real donde hacía falta. Cada medición descarta tiros de
calentamiento y reporta p50 y p95, nunca una media sola.

**Lo que NO es:** el teléfono del founder en red móvil. Estos números son el
**piso optimista**. En el aparato, cada ola cuesta más — así que las diferencias
que se reportan acá se AGRANDAN allá, no se achican.

Instrumentos, todos reutilizables, en `scripts/perf/`:
`b0-linea-base` · `b1-censo-focos` · `b2-base-datos` · `b3-reparto` ·
`b4-cable` · `b5-camino-real` · `b6-verde-zona` · `b8-techo`.
Sus salidas crudas quedan en `scripts/perf/salida/`.

---

## ③ B0 — LA LÍNEA BASE, Y LA SORPRESA QUE REORDENÓ LA SESIÓN

`pg_stat_statements` estaba instalada (v1.11) con **105 días de ventana**. El
podio de consumo por tiempo total acumulado:

| % | consulta | llamadas |
|---|---|---|
| **38,8 %** | el poller de WAL de Realtime | 1.147.245 |
| **21,8 %** | el mismo, segundo tenant | 661.260 |
| 9,5 % | introspección de funciones (dashboard/CLI) | 3.435 |
| 5,7 % | introspección de tablas (dashboard) | 3.584 |
| 4,9 % | `SELECT name FROM pg_timezone_names` (dashboard) | 1.487 |
| 3,0 % | `expirar_citas_pendientes()` — **nuestra**, del cron | 151.433 |

**Las consultas de la app aparecen recién en el 0,2 %.** El 60 % del tiempo de
esta base es Realtime y otro ~25 % es el panel de administración abierto en un
navegador. *La sesión venía a buscar consultas lentas de producto y el
instrumento contestó que no existen.*

**Y la trampa que ese hallazgo tiene adentro, declarada antes de cualquier
propuesta:** verifiqué si alguien usa Realtime. En el monorepo, **cero
`.channel(`**. Pero **tres webs del legado sí lo usan** —el portal de
prestadores (campana y notificaciones), `e-petplace-v2` (pedidos) y el admin
(mensajes)—, y comparten este mismo proyecto. Las 14 tablas publicadas tienen
consumidores reales. **No se toca nada** y se registra el porqué: *un 60 % que
sirve a tres apps vivas no es desperdicio, es costo.* Además es trabajo de
fondo: **consume margen (B4), no latencia percibida (B3)**.

**El tamaño real, post-purga de sondas de S92:** la base entera pesa **87,3 MB**.
La tabla más grande de `public` tiene **288 filas**. Ninguna tabla se recorre
entera con más de 5.000 filas. Aciertos de caché: **100 %** — no lee de disco.

---

## ④ B1 — LA BASE DE DATOS: LO QUE ESTÁ BIEN, MEDIDO

Se buscó lo que se busca siempre, y no estaba:

- **Recorridos secuenciales caros: NINGUNO.** La tabla más recorrida devuelve
  36 filas por pasada. Un índice nuevo ahí costaría escritura y no ahorraría
  nada.
- **Índices sin un solo escaneo: 284** (3,4 MB), de los cuales 153 no son
  únicos. **No se borran** — freno 1 declarado: un índice sin escaneos puede
  servir a un camino estacional que la ventana no vio. Censado en **D-736**.
- **`is_admin()` sigue VOLATILE en 241 policies** (D-725, de S92-BIS). Se
  re-evalúa por fila. Con 72 mascotas no se siente; con 72.000 sí. **Es deuda de
  escala y su cura toca policies ⇒ FRENO, la firma es del founder.** Los otros
  cinco helpers de policy son STABLE y están bien.

### El reparto — la medición que define la sesión

Cinco formas de consulta, misma puerta, 25 tiros cada una:

| forma | p50 |
|---|---|
| 1 fila · 1 columna | 155,8 ms |
| 10 filas | 156,3 ms |
| **105 filas · 3 columnas** | **149,9 ms** |
| tabla con RLS (0 filas, policy evaluada) | 150,8 ms |
| función (RPC) | 173,8 ms |

**Traer 105 filas cuesta MENOS que traer una.** La diferencia entre el caso más
barato y el más caro es de 24 ms sobre ~150. *El costo no está en los datos, ni
en las filas, ni en el trabajo del servidor: está en la petición.* Cada ida y
vuelta tiene un peaje fijo y todo lo que la app hace se paga en múltiplos de ese
peaje.

> **Nota de método, sobre un error propio.** La primera versión de esta medición
> restaba el tiempo de un `HEAD` al de una consulta y llamaba «trabajo» a la
> diferencia. Salió un imposible: 1 fila costaba 128 ms de «trabajo» y 200 filas
> costaban 114. *Un resultado imposible no es ruido: es la prueba de que las dos
> cosas comparadas no eran comparables.* Se tiró la resta entera y se rediseñó
> el experimento comparando formas entre sí. **El número bueno salió de admitir
> que el primero no significaba nada.**

---

## ⑤ D-728 RE-INSTRUMENTADA — EL PRIMER BLOQUE, COMO ORDENÓ EL FOUNDER

La orden era explícita: *«la sonda se retiró sin medirse y ahí se reinstrumenta
con el instrumento completo»*. Y también decía *«se lee en el aparato»* — cosa
imposible con el founder ausente. Así que se cambió el instrumento, no la
pregunta.

**Lo que se puede establecer sin aparato, y se estableció:** `Hoja` monta un
`<Modal>` nativo (`Hoja.tsx:265`, verificado). El mecanismo —el Modal toma el
foco de la ventana, React Navigation lo lee como blur del screen, `useFocusEffect`
vuelve a pedir todo al recuperarlo— es comportamiento del aparato. **Una repro
en RN-web daría verde midiendo otra cosa**, porque en web no hay ventana aparte:
R4 en su forma más cara. No se hizo.

**Lo que sí se midió: la EXPOSICIÓN y el COSTO.** Por cada pantalla se extrajo
el cuerpo de su `useFocusEffect`, se siguieron las llamadas locales, y se contó
qué wrappers de `@epetplace/api` dispara y en cuántas **olas encadenadas**.

### El resultado

- **24 pantallas** combinan `useFocusEffect` + `Hoja` en la misma pantalla (la
  ficha vieja decía 8, mirando solo el cliente).
- **43 más** tienen `useFocusEffect` sin Hoja propia: pagan el ciclo cuando un
  hijo abre una.

Las peores, con su espera de pura red al piso de 153 ms:

| app | peticiones | olas | espera ≈ | pantalla |
|---|---|---|---|---|
| pre | **28** | **12** | **1.838 ms** | `(tabs)/index` — el HOY |
| pre | 7 | 7 | 1.072 ms | `historico` |
| cli | 7 | 6 | 919 ms | `hogar/paseos` |
| pre | 6 | 6 | 919 ms | `(tabs)/_layout` |
| cli | 10 | 3 | 460 ms | `hogar/mascota/[mascotaId]` |

**Y el matiz que cambia la cura:** el HOY tiene **bien resuelto lo grande** —tres
`Promise.all`, uno de ellos con 17 wrappers— y **mal resuelto lo chico**: un
prólogo serial de cuatro viajes encadenados que solo sirve para resolver *quién
soy*. Medido con token real: **el prólogo cuesta 621,8 ms; una ola de cinco
peticiones en paralelo cuesta 191,2 ms.** *El paralelismo es gratis; el
encadenamiento se paga entero.*

**Estado de la ficha:** el COSTO pasa de desconocido a medido. El DISPARO del
ciclo sigue siendo hipótesis fuerte con evidencia parcial — y ahora se sabe
exactamente cuánto cuesta cada vez que dispara. Ficha enmendada, no cerrada.

### Dos correcciones del instrumento, declaradas

El censo se equivocó **dos veces antes de dar un número creíble**, y las dos
merecen quedar escritas:

1. **Contaba `useCallback` como wrapper.** El regex de imports usaba
   `\{([\s\S]*?)\}` y el no-greedy arrancaba en el PRIMER `import {` del archivo,
   tragándose los de React. Daba 11 peticiones donde había 9.
2. **Contaba de menos, y peor.** Solo miraba los wrappers escritos DENTRO del
   `useFocusEffect`, y el patrón dominante de la casa es
   `useFocusEffect(useCallback(() => { cargar() }))`. **Las pantallas mejor
   escritas daban cero.** `hogar/paseos` marcaba 0 peticiones teniendo un
   `cargar()` entero adentro.

*El segundo error es el interesante: un censo que premia con un cero al que
ordenó su código no está midiendo el código, está midiendo el estilo.*
⇒ **L-225**.

---

## ⑥ LAS DOS CURAS APLICADAS, CON SU ANTES Y SU DESPUÉS

### Cura 1 · La zona viaja en la misma RPC — `20260809180000`

`obtenerMiPrestador()` aparece en **28 de los efectos de foco censados**: es el
wrapper más invocado del monorepo. Hacía **dos viajes encadenados** — la RPC, y
con el id que devolvía, una lectura a `v_prestadores_publicos` por tres columnas
de zona.

| | p50 |
|---|---|
| dos viajes encadenados | **316,1 ms** (re-medido al cerrar: 314,1) |
| un viaje, con la zona adentro | **157,7 ms** |
| **ahorro por llamada** | **156,4 ms · 50,2 %** |

Hasta **~4,4 s de red** en un recorrido completo de la app.

**Lo que NO cambia (R3), verificado valor contra valor:** la RPC hace `LEFT JOIN`
contra la vista **en vez de copiar la fórmula**, así que conserva el ofuscado de
S84 *y* su `WHERE estado='activo'`.

> **La trampa que esta migración esquivó, y que el cinturón exige probar.** Hoy,
> un prestador NO activo recibe `zona_* = NULL` porque su fila simplemente no
> está en la vista. Calcular la zona inline con la fórmula le habría dado
> valores REALES: **un cambio de resultado disfrazado de optimización**. Existe
> exactamente **un caso vivo** que lo discrimina —un prestador `en_revision` con
> coordenadas— y el cinturón **aborta si ese caso no existe**, porque entonces
> el assert habría pasado sin probar nada.

**Y no ensancha exposición — probado, no argumentado:** las tres columnas ya eran
legibles por cualquier `authenticated` vía la vista (`has_table_privilege`:
`anon` false, `authenticated` true). La función es DEFINER, `anon` no la
ejecuta, y gatea por `user_gestiona_prestador`. **Su audiencia es estrictamente
más angosta que la de la vista.** Cero policies tocadas.

**Verde 4/4** por camino real con token: las tres columnas llegan · su valor es
idéntico al de la vista · sin sesión la RPC sigue rebotando 401 · el viaje único
cuesta el 50,2 % de lo que costaban los dos (el JOIN no se comió el ahorro).

> **Un assert de este cinturón nació flojo y se corrigió antes de aplicar.** La
> primera versión comparaba `v_prestadores_publicos` contra sí misma para el
> mismo id y contaba divergencias: **da 0 siempre**. Habría salido verde con la
> fórmula copiada mal adentro, que es justo lo que venía a impedir. *Un assert
> que no puede fallar no es un assert.* Se reemplazó por un par con dos brazos
> de resultado opuesto.

### Cura 2 · Las fuentes se importan por PESO

`fonts.ts` siempre cargó **seis** fuentes. El export de Android empaquetaba
**35 archivos `.ttf`**. La causa no estaba en el mapa sino en la **forma del
import**: el índice de cada familia de `@expo-google-fonts` hace un `require` de
todos sus pesos, así que importar desde la raíz arrastra el Thin, el Black y
todas las itálicas al grafo de assets.

| caso | assets | ttf | total |
|---|---|---|---|
| prestador ANTES | 64 | 35 | **11,36 MB** |
| prestador DESPUÉS | 36 | 7 | **8,99 MB** |
| cliente ANTES | 63 | 35 | **10,60 MB** |
| cliente DESPUÉS | 35 | 7 | **8,23 MB** |

**−2,37 MB en cada app.** Cero cambio visible: las mismas seis fuentes con los
mismos nombres.

**Lo que este número SÍ significa:** menos bytes en la instalación y en cada OTA
que toque assets, y una APK más chica. **Lo que NO significa:** no acelera el
arranque de cada día, porque en una build las fuentes ya están en disco. *Se
dice así para que nadie lo lea como la cura de la lentitud.*

> Y el detalle que vale como lección: el comentario de S82-B que vive en ese
> archivo decía, textual, *«un asset que nadie usa igual pesa en el bundle»*.
> **Era exactamente correcto y aun así no alcanzó**, porque el peso no entraba
> por el mapa que ese comentario cuidaba: entraba por la forma del import.
> ⇒ **L-224**.

---

## ⑦ B2 — LO QUE VIAJA POR EL CABLE

### Lo que está bien (medido, para que nadie lo vuelva a auditar)

- **CERO `select('*')` en los 80 wrappers de `packages/api`.** El sobre-pedido
  de columnas, hallazgo típico de este bloque, **acá no existe**.
- **Las URLs firmadas tienen cache con TTL y firma por lote.**
  `resolverUrlsFotos` firma una lista entera en un viaje. El N+1 de firmas
  tampoco existe.
- **Las fotos de mascota están bien dimensionadas**: mediana 62,9 kB, p90
  207,7 kB, **ninguna sobre 300 kB**. El resize a 800 px funciona.

### Lo que no

**`prestador-galeria` sube sin redimensionar.** Es el carrusel de la vitrina, o
sea la pantalla más pública del producto: mediana **474,4 kB**, mayor **5,9 MB**,
8 objetos = 17,9 MB. Medido en el código: `agregarFoto()` llama
`capturarDeGaleria({ calidad: 0.9 })` **sin `redimensionarA`**, y el logo con
`calidad: 1` sin resize ninguno — mientras que **todos los demás caminos de
subida de la casa sí redimensionan** (800 el avatar, 1600 los documentos).

**No se curó, y el porqué es la regla del founder:** R1 exige antes y después con
el mismo instrumento, y el «después» de una subida **necesita un aparato**.
Aplicarla a ciegas sería exactamente el verde sin medir que R5 prohíbe.
⇒ **D-734**, con su cura de una línea escrita y su número de partida medido.

---

## ⑧ B3 — EL ARRANQUE

El bundle de JavaScript (Hermes) pesa **7,2 MB en el prestador** y **6,7 MB en el
cliente**, con **2.332 módulos**. Eso se carga y se ejecuta en cada arranque, y
**no lo arregla ningún índice**: la cura es dividir el bundle, que no es barata y
no entra en esta sesión. ⇒ **D-737**.

De los assets que quedan tras la cura de fuentes, **0,93 MB son
`MaterialSymbols_400Regular`**, que **no lo pide nadie de esta casa** —el registry
de glifos es SVG— sino `expo-symbols`, dependencia transitiva **sin un solo
consumidor en el monorepo** (medido: cero `SymbolView`). Sacarlo es cirugía de
dependencias con build nueva. ⇒ **D-735**.

**Lo que NO se midió y por eso va rojo (R5):** el tiempo hasta la primera
pantalla útil en el aparato real, y qué pasa entre el toque y la respuesta en
las pantallas que el founder señala. **Las dos exigen el teléfono.** Quedan como
el primer bloque de la próxima pasada.

---

## ⑨ B4 — CUÁNTOS USUARIOS AGUANTA

**Conexiones:** máximo 60, en uso 14 (6 de clientes). Margen: 46. **Pero ese no
es el techo de usuarios**: las apps no abren una conexión por persona, hablan por
PostgREST, que comparte un pool chico entre todas las peticiones. *Mil usuarios
con la app abierta sin tocar nada consumen cero conexiones. Lo que consume es la
petición, no la persona.*

**Trabajo:** sobre 105,2 días, 23.565 s de consulta acumulados en 3.810.822
llamadas ⇒ **ocupación media del 0,3 % de un núcleo**, sostenida. Una petición
de la app cuesta **8,91 ms** de base.

**La cuenta, con los supuestos a la vista para que se puedan discutir:** ~60
peticiones por sesión (del censo: el HOY solo son 28) · ~180 s de uso activo ·
8,91 ms por petición (medido) · un núcleo útil con la mitad reservada de margen.

> **⇒ ~170 usuarios concurrentes**, y el número frágil es el de peticiones por
> sesión, que sale de un censo estático. **Es una estimación y se dice que lo
> es.**

**Y el techo que va a aparecer primero no es ése.** Con 87 MB de base, 100 % de
aciertos de caché y ninguna tabla que se recorra entera, el límite no lo pone el
servidor: **lo pone la cantidad de viajes por pantalla**, que castiga al usuario
mucho antes de que la base transpire.

**La prueba de carga real NO se corrió** (freno 2). Su guion, para cuando exista
dónde correrlo:

1. Flujos: abrir el HOY del prestador · abrir el Hogar del cliente · reservar un
   paseo hasta el checkout. Son los tres que concentran los viajes.
2. Escalera de usuarios virtuales: 10 → 50 → 100 → 250, cinco minutos cada
   peldaño, sesiones reales por PostgREST con tokens de fixture.
3. Se mide: p50/p95 por petición · errores 5xx · conexiones en uso ·
   `pg_stat_statements` antes y después de cada peldaño.
4. Entorno: **una copia del proyecto, jamás producción.** Sin eso, el guion no
   corre.

**Lo que no se pudo verificar desde acá (R5):** los **backups diarios** no son
visibles por SQL ni por la anon key — se ven en el panel (Database → Backups) y
**eso es del founder**. Queda declarado como pendiente, **no como verificado**.

---

## ⑩ LA TABLA PRIORIZADA — por beneficio sobre esfuerzo

| # | hallazgo | costo medido | cura | estado |
|---|---|---|---|---|
| 1 | `obtenerMiPrestador` hacía 2 viajes, en 28 focos | 156 ms × 28 | barata | **✅ APLICADA** |
| 2 | 35 `.ttf` empaquetados, 6 usados | 2,37 MB × 2 apps | barata | **✅ APLICADA** |
| 3 | El prólogo serial del HOY: 4 viajes para saber quién soy | **622 ms** por foco | media (una RPC de contexto) | **D-738** |
| 4 | Las pantallas recargan al abrir una Hoja | hasta 1.838 ms **cada vez** | media, por pantalla | **D-728** enmendada |
| 5 | La galería del prestador sube sin redimensionar | mediana 474 kB, mayor 5,9 MB | **barata**, una línea | **D-734** (falta aparato) |
| 6 | 0,93 MB de MaterialSymbols sin consumidor | 0,93 MB × 2 apps | media (build nueva) | **D-735** |
| 7 | Bundle Hermes de 7,2 MB, 2.332 módulos | cada arranque | cara (dividir bundle) | **D-737** |
| 8 | 284 índices sin escaneos | 3,4 MB + escritura | barata pero **freno 1** | **D-736** |
| 9 | `is_admin()` VOLATILE en 241 policies | invisible hoy, caro a escala | **FRENO — firma del founder** | D-725 |
| 10 | Realtime: 60 % del tiempo de base | margen, no latencia | **no se toca** (3 apps vivas) | **D-739** |

---

## ⑪ LO QUE NO SE PUEDE ACELERAR — el insumo de la sesión de diseño

Esta sección existe porque **hay esperas que van a seguir existiendo**, y
tratarlas como bugs es perder el tiempo dos veces. **No se construye acá**: es
material para la sesión de percepción.

1. **El peaje de ~150 ms por petición.** Es TLS + pooler + ida y vuelta hasta la
   región del proyecto. **Ninguna cura de código baja de ahí.** Se puede hacer
   menos viajes; no se puede hacer viajes más cortos.
2. **La primera pintura de una pantalla que necesita datos remotos.** Aunque
   quede en un solo viaje, son ~150-200 ms en escritorio y más en móvil.
3. **La subida de una foto o un clip.** Son megabytes por una red móvil: eso
   dura lo que dura.
4. **El arranque en frío de la app** mientras carga 7 MB de bytecode.

*Para las cuatro, lo que queda es que la espera se sienta atendida y no rota —
que es trabajo de diseño, no de base de datos.*

---

## ⑫ OPERATIVO

- **1 migración**: `20260809180000_perf_zona_en_obtener_mi_prestador.sql`, con
  **76(g) declarada NO RIGE** (DDL de lectura, cero backfill), **reversa escrita
  ANTES** (`docs/relevamientos/2026-08-09-s94perf-REVERSA-zona-en-mi-prestador.sql`)
  y cinturón con discriminador de dos brazos. **245 migraciones local = remoto.**
- **`gen:types` regenerado** — y de paso trajo **la cola de borrado de D-731, que
  la sesión de ayer aplicó sin regenerar tipos**. Sin consecuencia (nadie la
  consume desde la app), pero es el caso limpio de la candidata de S76: *una
  migración no está completa hasta `gen:types`*.
- **Typechecks verdes** en `packages/api`, `packages/ui`, `apps/cliente` y
  `apps/prestador`. **`verify:diseno` VERDE con 26 reglas.**
- **8 instrumentos nuevos** en `scripts/perf/`, con sus salidas en disco.
- **CERO OTA publicado.** Las dos curas tocan bundle (`packages/api`,
  `packages/ui`) y **la publicación es del founder** (regla 82). Hasta que
  publique, su aparato **no las tiene**.
- **Residuo ajeno declarado, no tocado:** `packages/ui/src/contacto.astro`, 71
  bytes, sin trackear, importa `../paginas/Contacto.astro` que **no existe**. No
  es de esta sesión ni de este paquete (es un `.astro` dentro de un design system
  de React Native). Ensucia el árbol y **un árbol sucio saca el ancla con
  asterisco** — se declara para que el founder decida si lo borra.

---

## ⑬ LAS TRES LECCIONES

- **L-223 — El costo de una app no está donde uno lo busca.** Traer 105 filas
  costó *menos* que traer una. Cuando el peaje por petición domina, optimizar
  consultas es trabajo sin efecto: lo que se cura es la CANTIDAD DE VIAJES.
  *Buscar la consulta lenta es el reflejo correcto y acá habría consumido la
  sesión entera sin mover un milisegundo.*
- **L-224 — Un asset entra al bundle por la FORMA DEL IMPORT, no por el mapa que
  lo declara.** Seis fuentes declaradas, treinta y cinco empaquetadas, con un
  comentario correcto vigilando el mapa equivocado.
- **L-225 — Un censo que premia con un cero al que ordenó su código no está
  midiendo el código: está midiendo el estilo.** El instrumento se equivocó dos
  veces —inflando por un regex goloso y desinflando por no seguir la
  indirección— y las dos veces el número era creíble. *Un instrumento nuevo se
  prueba contra un caso que uno ya conoce antes de creerle el primero.*

---

## ⑭ PARA LA PRÓXIMA PASADA

**Lo primero, y no se puede saltear: el aparato.** Tres cosas quedaron rojas
solo porque el founder estaba ausente, y las tres son de una sesión corta:

1. **Publicar el OTA de las dos curas** y confirmar que el HOY abre bien.
2. **El tiempo hasta la primera pantalla útil**, medido en el teléfono real,
   declarando modelo, red y si es build de desarrollo o de producción — *una
   build de desarrollo es varias veces más lenta y confundirla invalida el
   bloque entero*.
3. **D-728 en el aparato**: con el costo por foco ya medido, falta ver el
   disparo. Es un contador y una hoja que se abre.

Después, por orden de la tabla: **D-738** (la RPC de contexto, 622 ms) y
**D-734** (la galería, una línea y un aparato).

**Lo que NO hereda esta sesión:** seguridad sigue cerrada. D-732 y D-733 siguen
🔒 bloqueadas por la letra de retención y son de legales. La landing de S93 sigue
intacta.

---

## ⑮ ADDENDUM — EL REBOTE DE D-730, MEDIDO (pedido del founder, cero cura)

*«Medilo como fenómeno de performance: cuánto trabajo se hace de más en ese
rebote. Si resulta que ese camino repite consultas que ya se hicieron, es dato
para B2 y refuerza el costeo de D-730 con números en vez de con "se ve feo".
Solo medir. No curar.»*

**Repite. Y hay algo peor que la repetición.**

### ① La ficha repite una consulta que la lista ya tenía en memoria

La lista pide `obtenerPerfilesPublicos(ids)` con **todos** los negocios visibles
para dibujar sus tarjetas. Al tocar uno, la ficha pide
`obtenerPerfilesPublicos([prestadorId])` — **el mismo perfil, entero, otra vez**.

| | p50 |
|---|---|
| la lista, los 6 ids de una | 161,1 ms |
| **la ficha, el mismo perfil para uno solo** | **156,7 ms** |

*Cuesta casi lo mismo pedir uno que los seis.* Son **156,7 ms para traer un dato
que estaba a un prop de distancia**.

### ② Al volver, la lista re-pide lo que ya tiene

| oficio | viajes del rebote | ≈ red | qué re-pide |
|---|---|---|---|
| paseo | 3 | 460 ms | disponibilidad **+ los perfiles** — el hogar NO (cura S92-BIS, solo acá) |
| adiestramiento | 3 | 460 ms | disponibilidad **+ los perfiles** |
| grooming | 4 | 613 ms | perfil de mascota + disponibilidad **+ los perfiles** |
| **veterinaria** | **5** | **766 ms** | perfil + disponibilidad + vitrina **+ los perfiles** |

**🔴 Corrección de la primera corrida (+1 viaje por oficio).** El instrumento
miraba solo `useFocusEffect`, y las cuatro listas re-piden los perfiles desde un
`useEffect(..., [disponibles])` que dispara cuando el foco recarga la
disponibilidad. **El mismo perfil viaja TRES veces en un solo rebote**: lo trajo
la lista, lo volvió a traer la ficha, y lo trae de nuevo la lista al volver.

El «≈ red» es viajes × el peaje de 153,2 ms de B0. **Es una multiplicación y se
dice**; se sostiene porque B1 probó que el costo es por petición, no por payload.

### 🔴 ③ Lo que lo convierte de costo en desperdicio

`router.back()` **no re-monta la lista** — la conserva con su fecha, su hora y su
scroll, que es exactamente por lo que `senal-reserva.ts` eligió `back` y no
`replace`. **Los datos que re-pide ya están en su estado.** Y la cadena de
reserva navega al checkout **en el mismo foco**: cuando esas respuestas llegan,
**la pantalla que las pidió ya no está a la vista**.

> *No es trabajo de más: es trabajo para nadie.*

### ④ El parpadeo no es el costo, es el síntoma

El founder reporta entre medio segundo y dos segundos. **Los viajes explican
306-613 ms**, o sea la mitad baja del rango. El resto es montaje y pintado, que
**no se puede contar leyendo el repo** — es del árbol de React en el aparato, y
un número de re-renders inventado desde una terminal sería *el «se ve feo» con
decimales*. Va rojo (R5) y espera el teléfono.

### ⑤ Lo que esta medición le regala a la cura ya firmada

La opción ① —que la ficha reserve de verdad— **elimina los dos costos a la vez**:
sin rebote no hay re-carga descartada, y si la ficha recibe el perfil por params
(la lista ya lo tiene) tampoco lo re-pide. **La cura firmada no solo saca el
parpadeo: saca de 2 a 4 viajes por reserva.**

### ⑥ Y el instrumento se equivocó una tercera vez

`b9-rebote.mjs` buscaba `useFocusEffect` **sin el paréntesis**, así que la línea
de `import` contaba como un efecto y el contador se tragaba medio archivo,
mezclando la cadena de reserva con la de carga — *justo lo que ese instrumento
existía para separar*. Su propia salida lo desmentía: **decía «3 efectos de
foco» en pantallas que tienen dos.** ⇒ **L-225 gana su tercer caso y su forma
final: un instrumento nuevo imprime lo que contó, no solo el total.**

*(`b1-censo-focos` sí buscaba con paréntesis desde el principio: sus números no
se movieron al corregir esto, lo que de paso probó que el censo estaba sano.)*

---

## ⑯ D-730 EJECUTADA — la ficha reserva de verdad en los cuatro oficios

**Decisión del founder, en sesión: «Dale A y resolvemos».** Le di mi voto en
contra —sesión propia, con aparato— y lo reafirmó. Se ejecutó entera.

### Lo que se hizo

El flujo de reserva salió de las cuatro listas y vive **una vez** en
`lib/reserva/<oficio>`; la lista y la ficha son sus dos consumidores. **No hay
clon**, que era la razón por la que `senal-reserva.ts` existía — y `senal-reserva`
**murió entero**, con los cuatro efectos que lo consumían.

**La condición de diseño se sostuvo:** la oferta entra **como argumento**. Los
hooks no leen la lista, no la conocen, y no pueden tener una copia vieja de
ella. *La puerta por la que el P0 entró tres veces está cerrada por
construcción, no por cuidado.*

**El bloqueante que la ficha exigía primero, resuelto:** ahora la lista le
reenvía el contexto de la ventana — valores que **ya viajaban por su propia
URL**. Y la oferta se **resuelve por el mismo lector** que usa la lista: una
fuente de verdad, URL reconstruible, y la verdad de AHORA.

**Efecto medido: de 3-5 viajes descartados por reserva a CERO.**

### El hallazgo que la mudanza destapó

**En la lista del paseo, `alElegir` tenía UN solo llamador**: el efecto que
consumía el pedido que volvía de la ficha. Desde la anatomía Airbnb de S91-C la
fila abre el perfil, no reserva.

> *El flujo entero —seis Hojas, trece estados, 897 líneas— vivía en la lista
> para servirle a la ficha, que era la que de verdad reservaba y no podía.*

Con la ficha reservando, la lista deja de necesitarlo. **Pasa de 897 a 222
líneas.** Dejarle el flujo habría dejado seis Hojas que ya no puede abrir nadie.

### 🔴 Lo que esta tanda casi se lleva puesta

El corpus de `verify:diseno` recorre **solo `.tsx`**. Al mudar el guard de tres
estados del paseo a un `.ts`, **R34 —la regla que existe para vigilar
exactamente ese guard— dejó de verlo**, y su contador bajó de 5 a 4 **dando
VERDE**.

> *Un lint que se apaga por un cambio de extensión no avisa que se apagó: dice
> un número más chico, y un número más chico en un lint se lee como progreso.*

Curado con un corpus de LÓGICA (`archivosCodigo`) solo para las reglas que
vigilan lógica y no píxeles — ensancharlo entero encendería de una vez todas las
demás reglas sobre archivos que nunca miraron, y eso es decisión de mesa. **R34
vuelve a 5.** ⇒ **L-226**.

### 🟡 Lo que falta, y es la mitad que no puedo hacer yo

**NO SE GATEÓ EN APARATO.** Los cuatro caminos de reserva cambiaron de forma y
**el modo de falla de esto es silencioso**: no se ve como un glitch, se ve como
«no puedo reservar». Typecheck y `verify:diseno` están verdes en los cuatro,
pero **ninguno de los dos ve ciclo de vida**.

El gate son **cuatro reservas, una por oficio**, y en el paseo hay que llegar a
las Hojas: elegir mascota con dos elegibles, la pregunta social sin responder, y
el saldo de paquete si hay. *Hasta que eso corra, esto está construido y no
verificado — y se dice así.*

---

## ⑰ EL GATE — las dos OTA publicadas y el veredicto del founder

**Veredicto verbatim: *«funcionó, está bien y rápido»*.**

| app | update | group | runtime | ancla |
|---|---|---|---|---|
| cliente | **`019fe9d2`** | `c19b106f` | 1.0.3 | `863fddc8`\* |
| prestador | **`019fe9d3`** | `e3652562` | 1.0.4 | `863fddc8`\* |

Las dos **leídas del OBJETO** con `update:view`, jamás del texto del publish.

**Un solo bundle llevó las tres cosas de la jornada**: las dos curas de
velocidad (la zona en una RPC, las fuentes por peso) y el arco entero de D-730.
Por eso el «rápido» del veredicto es también **lo primero que el aparato dice
sobre las curas de performance** — que hasta ese momento solo tenían números de
escritorio.

**Se registra VERDE por ausencia de falla anotada**, y se dice así: el founder
dio un veredicto global, no un paso por paso. **No consta que las seis Hojas del
paseo se hayan caminado una por una.** Rige la regla de la casa: toda falla
futura entra como cura anotada y no reabre lo declarado.

### ⚠️ Las dos salieron CON ASTERISCO, y por qué queda escrito acá

El árbol tenía un archivo sin trackear al bundlear. **`update:view` NO expone el
estado del árbol** (medido en S91): un publish sucio es **inauditable después**,
así que si el asterisco no se escribe en el momento, no lo escribe nadie.

**El residuo, identificado por medición y NO borrado por decisión del founder:**
`packages/ui/src/contacto.astro` es de **`epetplace-web`** — ese repo es Astro,
tiene el `src/paginas/Contacto.astro` que el import busca, y **su
`src/pages/contacto.astro` ya existe byte-idéntico**. Una sesión de la landing
escribió bien en la web y dejó una copia en el repo de al lado: *los dos caminos
son `<repo>/src/…`, y se fue por la raíz vecina.* **Nada se perdió, y nada de él
entró al bundle** — un `.astro` no es alcanzable desde el grafo de Metro.

> **La nota que deja:** el asterisco no dice «algo malo entró». Dice **«no se
> puede probar qué entró»** — y esa es exactamente la razón por la que se
> declara en vez de encogerse de hombros.

---

## ⑱ D-734 — la vitrina y la evidencia se redimensionan (gate firmado)

**Orden del founder: curar con el aparato a mano**, para que el «después» se
midiera de verdad. Sus cinco condiciones, cumplidas:

**① El censo dijo CLASE, no caso.** Nueve superficies capturan imagen; seis ya
redimensionaban y **tres no**: la galería de la vitrina, **`EvidenciaFoto`** y el
logo. `EvidenciaFoto` es la que lo vuelve clase — alimenta los dos «durante»
(`cita-archivos` mediana **500 kB**, `grooming-archivos` **441 kB**) y pedía
`calidad` sin pedir `redimensionarA`. *El defecto que el founder vio en la
vitrina no era de la vitrina.*

**② Misma pieza, 1600 y no los 800 del avatar** — medido, no argumentado:
`FichaPrestador` pinta la portada **a sangre** en 4:3 (~1290 px reales en un
teléfono de 430 pt a DPR 3) y la evidencia se abre a pantalla completa. **1600 no
es un número nuevo:** es el de carnet y documentos.

**③ El logo queda afuera con su razón** (⇒ **D-740**): el resize compartido
devuelve JPEG y el logo es PNG-only por orden del founder — aplicarlo mataría el
alpha **y la subida rebotaría su propio archivo**.

**④ El transporte, medido y leído honesto:**

| payload | p50 |
|---|---|
| 6.042 kB · peor caso real | **818 ms** |
| 474 kB · mediana de hoy | **343 ms** |
| 204 kB · la comparable a 1600 | **357 ms** |

**A 474 kB la subida no mejora**; solo el caso monstruo, 2,3×. **La cura paga en
la bajada**, que es por vista: una vitrina de 8 fotos pasa de ~3,8 MB a ~1,6 MB
cada vez que un cliente la abre. ⇒ **L-227**.

**⑤ Las ya subidas no se tocaron** (freno 3) ⇒ **D-741**, con su bloqueante.

**✅ GATE FIRMADO:** *«Subí una foto pesada y la portada a sangre se ve bien —
sin blandura ni pixelado. La cura de 1600 queda.»* Era **el único juicio que yo
no podía emitir**: el riesgo de esta cura nunca fue que pesara de más, era que se
viera peor. OTA prestador **`019febbb`**.

---

## ⑲ LOS BACKUPS — verificados, con sus dos límites escritos

**Verificado por el founder en el panel (10-ago): 8 copias diarias consecutivas,
la más reciente del 10-ago.** La base está respaldada. Lo que sigue son sus dos
límites, y se escriben ahora porque *un límite de backup que se descubre el día
del incidente ya no es un límite: es una pérdida*.

**① Son FÍSICAS, no lógicas.** Restaurar es **volver la base entera a ese
punto** — no se recupera una fila, ni una tabla, ni «lo de ayer de este
prestador». Ante un borrado puntual, la única herramienta disponible **deshace
también todo lo bueno que pasó desde el backup**.

**② NO cubren Storage.** Los 91 documentos de identidad, las fotos de las
mascotas, las vitrinas, la evidencia y los clips **viven fuera de Postgres y no
tienen respaldo**. Y el cruce con lo que esta casa ya construyó lo vuelve
concreto: **D-731 dejó una cola que borra objetos de Storage de verdad** — o sea
que ya existe un camino automático que quita archivos y **ninguno que los
devuelva**.

⇒ **D-742**, con dueño: **legales decide QUÉ hay que poder restaurar y por
cuánto tiempo; operación lo construye.** Su disparo es **la misma firma que
destraba D-732 y D-733**: el día que se escriba el plazo de retención hay que
decir, en la misma frase, con qué se restaura.

---

## ⑳ EL HALLAZGO DE FONDO, en lenguaje de negocio

> **No hay consultas que optimizar. Hay viajes que eliminar.**

Salimos a buscar por qué la app se sentía lenta, con la hipótesis de siempre:
alguna consulta pesada, alguna tabla mal indexada. **No existe.** En 105 días de
registro, ninguna consulta de la aplicación aparece antes del **0,2 %** del
tiempo de la base; el servidor trabaja al **0,3 % de un núcleo**; ninguna tabla
se recorre entera; el 100 % de lo que se lee está en memoria.

Lo que sí encontramos es esto: **cada vez que la app le pide algo al servidor
paga un peaje fijo de unos 150 milésimas de segundo**, sin importar si pide un
dato o cien. Lo medimos: **traer 105 filas costó menos que traer una**.

Y las pantallas piden muchas veces, **una después de otra**. La pantalla
principal del prestador encadenaba **doce esperas** antes de poder mostrar algo:
casi dos segundos de pura ida y vuelta, con el servidor sin hacer prácticamente
nada. *La lentitud no era del motor: era la cantidad de veces que se lo
molestaba.*

**Lo que esto significa para las decisiones:**

- **El techo no lo pone el servidor.** Con esta base —87 MB, todo en memoria— el
  límite aparece mucho antes por la cantidad de peticiones por pantalla que por
  la capacidad de la máquina. **Pagar un plan más grande no arreglaría nada de
  lo que se sentía lento.**
- **Cuántos usuarios aguanta hoy: ~170 simultáneos**, con supuestos declarados.
  Y ese número **crece cuando se bajan los viajes**, no cuando se agranda el
  servidor.
- **Dónde está el trabajo que rinde:** hacer que una pantalla pida **una vez lo
  que hoy pide cinco**. Las cuatro curas de esta sesión son eso, y sus números lo
  muestran — el wrapper más usado de la app bajó **a la mitad** por dejar de
  hacer un viaje.

*Y su corolario, que es el que se olvida: cuando el peaje domina, el tamaño de
lo que viaja casi no importa… salvo del lado de quien BAJA, que son muchos y
repiten. Por eso la cura de las fotos vale por la vitrina que se abre mil veces,
no por la foto que se sube una.*

---

## ㉑ EL SALDO DE LA SESIÓN

**Cuatro curas aplicadas, las cuatro con antes/después medido y gate en
dispositivo:**

| # | cura | antes → después | gate |
|---|---|---|---|
| 1 | la zona viaja en la misma RPC | **316 → 158 ms** por llamada, en 28 efectos de foco | ✅ |
| 2 | las fuentes se importan por peso | **11,36 → 8,99 MB** (y 10,60 → 8,23 en cliente) | ✅ |
| 3 | **D-730** · la ficha reserva de verdad | **3-5 viajes descartados → 0** | ✅ |
| 4 | **D-734** · vitrina y evidencia a 1600 | vitrina **3,8 → 1,6 MB** por apertura | ✅ |

**Seis deudas nuevas con dueño y disparo:** D-735 (MaterialSymbols) · D-736
(índices sin uso, freno 1) · D-737 (bundle de 7,2 MB) · D-738 (el prólogo serial
del HOY, 622 ms) · D-739 (Realtime, con dueño en el legado) · **D-740** (el logo
PNG con alpha) · **D-741** (el barrido de las fotos ya subidas) · **D-742** (los
backups no cubren Storage).

**Cinco lecciones: L-223 → L-227.**

**Lo que NO hereda nadie:** el brief de la segunda pasada de performance queda
**como está** · el brief de S93 queda **INTACTO — la landing no hereda nada** ·
seguridad sigue cerrada, con D-732 y D-733 🔒 bloqueadas por la letra de
retención.
