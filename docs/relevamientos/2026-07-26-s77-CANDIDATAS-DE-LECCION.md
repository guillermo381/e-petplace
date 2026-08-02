# LAS CANDIDATAS DE LECCIÓN — inventario para la firma del founder (S77, ampliado S82)

> **VEINTE candidatas.** La novena (L-169) se depositó en S77 con su texto: estuvo nombrada en el canon sin existir — ver su nota de procedencia. **Las candidatas 10 a 14 entraron en S82** — el nombre de un token es su rol · su inversa (el nombre que envejeció) · la ausencia con tipos · el defecto que vive porque el DATO DE PRUEBA no lo alcanza · y el lector que se apoya solo en la RLS y por eso nadie puede auditarlo leyendo. **Las 15, 16 y 17 entraron en S83, y son PARIENTES: las tres son L-192 mudada de lugar** — una regla con auto-prueba puede tener BRAZOS que no salen rojos (el guard del guard) · un grep por la PROP mide quién la pasa, no qué se RENDERIZA (L-192 en la búsqueda) · **razonar el efecto de un token no es medirlo** (L-192 en la medición: el modo de falla es *un número plausible*). **Las tres describen instrumentos que devuelven algo y no verifican nada** — y la 17 cobró tres veces en un solo turno, una de ellas contra la mesa que la estaba escribiendo. El inventario sigue vivo: este documento es la casa de lo que no tiene ley todavía.

> **NINGUNA ESTÁ FIRMADA. La firma es del founder.** Este documento no decide:
> junta lo que hoy vive disperso entre la letra, las deudas y los cierres de
> S75/S76/S77, con **su origen y su costo medido**, para que se puedan firmar
> o cerrar de una sentada.
>
> Criterio de inclusión: **solo lo que tiene fuente localizable**. Si algo se
> nombró como candidata y no está escrito en ningún lado, aparece abajo en
> "el hueco", no en la lista.

---

## Las veinte

### 1 · (d) — EL ORDEN NOMBRA EL ARTEFACTO QUE ABRE, JAMÁS EL ARCHIVO DONDE SE LO ESPERA
**Origen:** S75 (canon, línea 44). **Sin firma desde entonces.**
**Costo medido:** el brief de S75 ordenó R1 primero e **invirtió el orden que la propia sesión había declarado CONDICIÓN**. El interruptor se apretó en `3591db2` sin que nadie llamara a abrir la puerta, y **B3 resultó un no-op**. Daño en producción: **cero** (0 empleados activos no-titulares).
**Estado:** viva. Sus hermanas **(e)** y **(f)** quedaron **absorbidas por L-166**; **(g)** se firmó como **L-166** y **(h)** como **L-167**.

### 2 · UNA MIGRACIÓN NO ESTÁ COMPLETA HASTA QUE CORRE `gen:types`
**Origen:** S76 (candidata declarada al cierre; **no disparó** porque B regeneró completo en `7d3eb78`).
**Costo medido:** ninguno todavía — **es la única de esta lista que nunca cobró**. En S77 volvió a no cobrar: las dos migraciones corrieron `gen:types` en el mismo turno.
**Estado:** viva, sin evidencia de daño. Candidata a **cerrarse por innecesaria** tanto como a firmarse.

### 3 · L-168 — UNA LETRA NO AFIRMA EN SU CUERPO LO QUE ELLA MISMA LISTA COMO NO LEÍDO
**Origen:** S77, `LETRA_EDICION_VINCULO_S77` §10bis (nace del proceso de la propia letra).
**Costo medido:** la letra se equivocó **DOS VECES de la misma forma**, y las dos las corrigió la fuente, no la mesa.
**Estado:** viva.

### 4 · L-170 — UN CENSO POR `pg_get_functiondef` LEE LOS COMENTARIOS COMO CÓDIGO
**Origen:** S77, D-532 (nota de método).
**Costo medido:** la migración de D-532 **abortó contra sí misma** en su primer intento — el comentario que explicaba el flip reproducía el literal que el assert perseguía. **Evidencia del par:** el helper hermano, cuya nota decía `(…)` con puntos suspensivos, **no disparó**. Un carácter entre abortar y pasar.
**Regla:** un comentario jamás reproduce el literal que el censo persigue; **si el censo dispara sobre un comentario, se corrige el comentario, nunca el regex** (relajarlo pierde la garantía).

### 5 · EL ENCLÍTICO: TODO CENSO DE VOZ BARRE ESA CLASE APARTE
**Origen:** S77, D-533 (enmienda).
**Costo medido:** el censo declaró **7 strings, eran 8**. La octava era `Pedilo`, y se escapó por una razón estructural: **con clítico enclítico el voseo PIERDE la tilde** (`pedí`+`lo` → `pedilo`) **mientras el tuteo la GANA** (`pídelo`) — la regla que hacía visible al voseo **se invierte** exactamente en esa clase. No fue descuido: fue un agujero del instrumento.
**Confirmación independiente:** en `apps/cliente` apareció **`Pedila`** — el mismo verbo, la misma clase, la otra app.

### 6 · TRES CLASES × CUATRO UBICACIONES (el lint de voz)
**Origen:** S77, D-481 (2ª enmienda).
**Costo medido:** **cinco censos seguidos salieron cortos** — D-523 (declaraba 4, eran 11) · D-533 (7 → 8) · D-534 (el cliente, que ningún censo había mirado) · y `packages/api`, donde el problema resultó ser mayor que el voseo (**D-539: no hay capa de idioma**).
**Regla:** las tres clases (tilde final *case-insensitive* · vos conjugado · enclítico sin tilde) se corren sobre las cuatro ubicaciones (`apps/*/i18n` · `packages/api` · `packages/ui/i18n` · hardcodeos en `.tsx`), **o vuelve a dar corto**.

### 7 · UN CENSO DE PERMISOS SE HACE POR TABLA Y POR COMANDO
**Origen:** S77, D-481 (3ª enmienda) — el mismo error de alcance, ahora en RLS.
**Costo medido, y es el más caro de la lista:** el censo preguntó *"quién cita la tabla de empleados"* y midió **TRES** policies; sobre `evento_cita_servicio` hay **CINCO SELECT**. La cuarta (`cita_select_por_acceso`, que concede por MASCOTA) era la que importaba. **Consecuencia: una migración firmada llevaba una policy con delta 0**, y **la premisa falsa llegó a estar en negrita y firmada** en §11.1 de la letra hasta que el discriminador la tumbó.
**Regla:** `pg_policies` completo por tabla y por comando, **jamás "quién menciona X"**.

### 8 · ANTES DE PRESUPUESTAR UN ARCO, SE LEEN LAS POLICIES
**Origen:** S77, D-540 (enmienda L23).
**Costo medido — al revés que las demás: esta AHORRÓ trabajo, dos veces.** ① `prestador_empleado_servicios`: la policy DELETE existía desde que nació la tabla y `packages/api` nunca la expuso — **quitar un chip parecía motor y era un wrapper de 15 líneas**. ② `prestador_horarios`: `prestador_horarios_own` ya deja al titular escribir las franjas de su gente — **D-540 pasó de "motor" a wrapper + superficie**. Y una tercera aparición el mismo día: el brazo del UPDATE **nace abierto y sin puerta**.
**Regla:** la casa se dio por bloqueada donde el motor ya estaba abierto, y las dos veces **el costo real fue una fracción del estimado**.

### 9 · L-169 — ENTRE DOS CURAS EQUIVALENTES, GANA LA QUE NO DEPENDE DE QUE EL CENSO ESTÉ COMPLETO
**Origen:** S77, el piso `RESTRICTIVE` de INSERT en `prestadores` (dentro de D-532).
**Costo medido de la alternativa:** el censo declaró **DOS** policies de INSERT y eran **CUATRO** — las dos `FOR ALL` también son puerta, y las permisivas se combinan en OR. **Endurecer solo las dos `FOR INSERT`, que es lo que la mesa pidió, habría dejado `prestador_own_profile` abierta: una fuga viva con el cinturón en verde.** La forma `RESTRICTIVE` cerró sobre las cuatro **sin que nadie tuviera que saber cuántas eran** — se combina con AND sobre el OR de todas las permisivas, presentes y futuras.
**La regla, y por qué no es lo mismo que "hacé bien el censo":** los censos van a volver a salir cortos (esta sesión lo probó **seis veces**). Cuando existe una forma cuya corrección **no depende de haber enumerado bien**, esa gana — aunque la otra parezca más quirúrgica.
**Hermana de D-495**, donde el cinturón in-migración atrapó 10 policies que el censo no había visto.
**Estado:** viva, sin firma.

> **NOTA DE PROCEDENCIA, y es parte de la lección:** este número estuvo **NOMBRADO en el canon durante toda S77 sin existir**. La mesa lo declaró depositado en la letra y **la edición nunca se hizo** — grep en `docs/` y en `CLAUDE.md` devolvía una sola ocurrencia: la del índice que lo citaba. **Es el mismo patrón que S74 registró con L-165** (una ley ordenada como firmada y jamás escrita). Su texto se deposita acá, en S77, con esta nota puesta: **un número reservado no es una lección; una lección es un texto que alguien puede leer.**

---

### 10 · UN TOKEN SE NOMBRA POR SU ROL, NO POR DÓNDE SE USÓ PRIMERO
*(sumada en S82, 30-jul-2026 — origen: el trabajo de B sobre el tema del cliente)*

**El texto candidato:** un token se nombra por **su ROL**, jamás por el
lugar donde se usó la primera vez. **Y si su uso mayoritario contradice
el nombre, lo que se corrige es EL NOMBRE — no se migran los usos.** El
nombre viejo mintiendo es más caro que el rename: cada lectura futura
decide mal, y la decisión mala es invisible (nadie revisa un token que
"ya existe").

**Costo medido — TRES casos, los tres de esta sesión:**
- **`bg.overlay`** — declarado como token de HOVER en su propio
  comentario, y **28 de sus 43 consumidores lo usan fuera de ese rol**.
  El defecto que destapó: se lo eligió como fill del secundario `sinCaja`
  porque un censo lo llamaba *"el material intermedio"* — **un hover no
  es un fill**, y la elección salió mal justamente por leer el uso en vez
  del rol.
- **`text.onGradient`** — **dos sitios que funcionaban por COINCIDENCIA
  DE VALOR**, no porque hubiera gradiente: el token decía "sobre
  gradiente" y el papel del consumidor era otro. Funcionaba hasta que
  alguien cambiara el valor por la razón correcta.
- **`#EEECE8`** — el arquitecto lo tomó del CSS de una lámina **creyendo
  que era token de la casa**. No lo era. *(Hermana directa del corolario
  ya firmado en S82: la tipografía y los hexes de una lámina son
  CRITERIO, no fuente — acá el mismo error, en sentido inverso: un valor
  de lámina que se coló como si fuera ley.)*

**Por qué merece ser ley y no solo anécdota:** las tres fallas son
**silenciosas** — ninguna rompe el build, ninguna cambia un píxel el día
que se comete. Se cobran meses después, cuando alguien confía en el
nombre. Es la familia de L-192 aplicada al vocabulario del tema.

**Estado:** viva, sin firma. *(Su contra-argumento honesto, para que el
gate lo tenga: renombrar un token de N consumidores tiene costo propio y
puede chocar con "no se toca un token de N consumidores para curar uno"
— el principio que el propio founder fijó con `light0`. La candidata dice
CUÁNDO renombrar, no que renombrar sea gratis.)*

### 11 · UN TOKEN CUYO NOMBRE ENVEJECIÓ FALLA AL BUSCARLO, NO AL USARLO — Y ES PEOR
*(sumada en S82, 30-jul-2026 — origen: C, el canto de veterinaria. **Es la INVERSA de la #10 y por eso va aparte, no como nota suya.**)*

**El texto candidato:** cuando una taxonomía se firma DESPUÉS que sus
tokens, el token queda haciendo lo correcto con **el nombre viejo**. No
es el caso de la #10 —ahí el nombre prometía más de lo que el token
era—: acá **el token cumple y el nombre quedó desactualizado respecto de
la ley**. **La cura es una PIEZA QUE TRADUCE: la pantalla habla LA LEY,
una sola pieza mapea al token que existe, y nadie más tiene que saber
que no se llaman igual.**

**El caso:** la Ley 10 (taxonomía firmada S80) dice que lo clínico es
**SALUD** — y el token que pinta ese canto se llama **`capa.identidad`**
(nació en v4, mucho antes de la taxonomía). El token hace exactamente lo
correcto: es el verde de la capa de vida, es el que el timeline usa para
la vacuna desde S52. Solo su NOMBRE quedó viejo.

**Por qué es PEOR que la #10, y es lo que la vuelve candidata propia:**

| | #10 (`bg.overlay`) | #11 (`capa.identidad`) |
|---|---|---|
| dónde falla | **al USARLO** — alguien lo elige mal | **al BUSCARLO** — no lo encuentra |
| qué produce | un uso equivocado, visible en la pantalla | **un token DUPLICADO** — el que busca `capa.salud` no lo halla y crea uno |
| cómo se nota | mirando la pantalla | **no se nota**: dos tokens coexistiendo y divergiendo con el tiempo |

**Costo evitado, medido en esta sesión:** dos pistas escribieron el canto
clínico el mismo día (C en el perfil, A en el log de veterinaria) y las
dos tuvieron que resolver a mano que "SALUD" es `capa.identidad`. Una
tercera que no lo supiera habría creado `capa.salud` — y el día que
alguien cambie uno de los dos, divergen sin que nada avise.

**La cura, que vale como PATRÓN (aplicada por C):** no renombrar el token
—que arrastra sus consumidores y choca con el principio de `light0`—
sino **una sola pieza que traduzca ley→token**. La pantalla escribe el
nombre de la LEY; la traducción vive en un lugar y se corrige en un
lugar.

**Estado:** viva, sin firma. *Con su pregunta abierta para el gate: si la
pieza traductora es la respuesta general, ¿cuándo conviene igual
renombrar? La #10 y la #11 piden cosas distintas —una re-declarar el
nombre, la otra traducirlo— y el gate tiene que decidir si son dos leyes
o dos caras de una.*

### 12 · LA AUSENCIA TIENE TIPOS, Y EL MODELO LOS COLAPSABA EN UNO
*(sumada al censo en S82, 30-jul-2026 — **el texto completo vive en
`MODELO_PRODUCTO`, sección "CANDIDATA — la ausencia tiene tipos"**; acá
entra al inventario para que se firme o se cierre con las demás.)*

**El texto candidato:** **L-139 dice que no se rellena lo que falta —
nunca dijo que faltar tenga UNA SOLA FORMA.** La diferencia entre los
tipos de ausencia no es de copy: es de MODELO, porque cada uno exige que
*el motor pueda producirlo*.

**Costo medido — CINCO tipos, de TRES pistas que no se estaban hablando,
en UN día:**

| tipo | qué significa de verdad | de dónde salió |
|---|---|---|
| **sin registro** | nadie preguntó nunca | grilla "Cómo está hoy" (C) |
| **ninguna conocida** | alguien SÍ miró y no había — hecho clínico | alergias (A, r4) |
| **aún no corresponde** | la pregunta todavía no aplica (edad/etapa) | plan vacunal (A, r7) |
| **cerrado** vs **no configurado** | decisión declarada vs omisión | días del prestador (A, r7) |
| **firme sin fecha** | el compromiso existe; falta coordinarlo | citas vet (A, r9 · D-439) |

**El quinto es el que más lejos lleva la tesis, y tiene daño REAL
registrado:** una cita firme sin fecha no resta, **agrega trabajo** — y
tratarla como "dato faltante" la ESCONDE. Eso ya pasó: fue el bug 🔴 de
S71, donde el dueño aprobaba un presupuesto y su procedimiento no
aparecía en ninguna superficie suya porque el lector filtraba
`fecha >= hoy` y una fecha nula no pasa ningún filtro de fecha. **No es
una hipótesis de mesa: es una falla que ya cobró.**

**Lo ya construido que la sostiene** (por si el gate la firma):
`alergias_ninguna_declarada_en/_por` · `cat_plan_vacunal.edad_inicio_meses`
→ estado `aun_no_corresponde` · `prestador_dias_cerrados` ·
`ConsultaDelHogar.fecha: string | null` con su nulo declarado.

**Estado:** viva, sin firma. **Va DESPUÉS del gate, jamás antes** (regla
80). *Y su honestidad, escrita en la propia candidata: cinco casos son un
patrón sospechado, no una ley — lo que el gate tiene que juzgar es si es
UNA ley transversal del expediente o cinco cosas que se parecen.*

### 13 · UN DEFECTO PUEDE VIVIR INVISIBLE PORQUE EL DATO DE PRUEBA NO LO ALCANZA
*(sumada en S82, 30-jul-2026 — origen: lo que destapó sembrar la familia de cuatro.)*

**El texto candidato:** un defecto no sobrevive solo porque el camino sea
difícil de recorrer — sobrevive porque **los datos con los que probamos
no llegan hasta él**. La cura NO es más disciplina de gate: es que **el
dato de prueba cubra los extremos**. Un extremo que ninguna cuenta de
prueba alcanza es un extremo que nadie va a ver hasta que lo vea un
usuario real.

**Costo medido — CUATRO casos, todos de esta sesión:**

| defecto | por qué nadie lo vio | el extremo que faltaba |
|---|---|---|
| **el CTA muerto de UNA mascota** | con una, el selector **se auto-resuelve** y el estado "sin elegir → deshabilitado" no existe | una familia de **1** |
| **el barrido de L-b (4+)** | el relleno pleno se cae con 4 hermanos y **el máximo del sistema eran DOS** | una familia de **4** |
| **los chips viejos en los cuatro salvavidas** | esas pantallas solo aparecen en estados que la demo feliz no produce | los estados de **borde** |
| **`bg.overlay` invertido en oscuro** | el tema oscuro **casi no se mira** | el **segundo tema** |

**La evidencia que la vuelve candidata y no anécdota:** el CTA muerto del
paseo **vivió desde S57 hasta S82** — no porque fuera difícil de
alcanzar, sino porque **la familia del founder tiene DOS mascotas** y con
dos ese camino no se dibuja. Nadie fue descuidado: el dato no llegaba
ahí. Y la contraprueba es del mismo día: **sembrar una familia de cuatro
hizo visibles dos caminos en una sola corrida** (`seed_demo_familia_cuatro_s82`).

**Por qué es hermana de L-161 pero NO la misma:** L-161 exige que la
superficie sea **alcanzable** —que exista el camino—; ésta dice que
**existir el camino no basta si el dato no te pone en la rama**. Se puede
llegar a la pantalla y aun así no ver nunca su estado defectuoso.

**La forma de la cura, ya probada:** un seed por EXTREMO, versionado,
**que no reemplaza al feliz sino que convive** — y barato si no siembra
nada fechado (el de cuatro no tiene una sola fecha, así que no envejece).
El seed feliz sigue siendo el que se parece a un usuario real; el de
extremo existe para las ramas que ese nunca toca.

**Estado:** viva, sin firma. *Pregunta abierta para el gate: ¿qué otros
extremos merecen su dato? Los candidatos que esta sesión rozó — familia
de UNA (existe), de CUATRO (existe), **memorial** (nadie tiene una
mascota fallecida sembrada), **hogar sin mascotas**, **cuenta sin
oferta** — y cuántos seeds es sano mantener antes de que el costo se dé
vuelta.*

---

### 14 · UN LECTOR QUE SE APOYA SOLO EN LA RLS ES UN LECTOR QUE NADIE PUEDE AUDITAR LEYENDO

**El texto propuesto:**

> **Un lector que se apoya SOLO en la RLS es un lector que nadie puede
> auditar leyendo.** Para saber qué devuelve hay que ir a `pg_policy`, y
> ahí el que audita descubre lo que el que escribió el lector nunca
> declaró: **de qué ROL está preguntando.** En una tabla con más de una
> puerta de lectura, el filtro explícito no es redundancia con la RLS —
> es **el contrato del lector**. La RLS defiende; el filtro **declara**.

**El origen (S82-A r17, con rojo producido).** C halló que
`obtenerMisPlanesPaseo` consultaba `suscripciones_servicio` sin filtro
alguno y que en una cuenta demo aparecía un plan de otra familia. La
sospecha razonable era **fuga de RLS**. La medición dijo otra cosa: la
policy del dueño **corta** (`user_id = auth.uid()`) — pero esa tabla
tiene **cuatro puertas de lectura**, y las otras tres (prestador,
empleado, admin) también son **correctas**. La fila llegaba por la puerta
del **prestador**, porque la cuenta era de **doble papel**: dueño y
paseador a la vez. El hub de la familia pintaba, como propio, el plan que
esa persona **vende**.

**Por qué merece ley y no solo una cura.** El defecto es **invisible en
cuentas de un solo papel** — que son todas las que alguien prueba a
mano. Y no es un caso de laboratorio: **un groomer que es dueño de su
perro es el usuario normal del producto**. Además, la cura correcta era
*al revés* de lo que la sospecha pedía: **tocar la policy habría roto la
lectura legítima del prestador**. Sin el literal de `pg_policy` delante,
la cura "obvia" era el daño.

**Su hermana mayor:** la #8 (*antes de presupuestar un arco se leen las
policies*) — la misma raíz, otro momento. Aquella evita presupuestar mal;
ésta evita **escribir un lector cuyo alcance nadie declaró**. Y la #13
explica por qué sobrevivió tanto: **el dato de prueba de un solo papel
nunca lo alcanza.**

**Estado:** viva, sin firma. *Su forma exigible ya existe y está medida:
**puertas de lectura > 1 · lector sin filtro propio = LECTOR
AMBIGUO**, con cinco casos censados en D-587.*


### 15 · UNA REGLA CON AUTO-PRUEBA PUEDE TENER BRAZOS QUE NO PUEDEN SALIR ROJOS

**El texto propuesto:**

> **La unidad que se auto-prueba no es la REGLA: es el BRAZO.** Una regla
> con varios brazos y una sola auto-prueba declara verde sobre los brazos
> que nunca ejercitó — y un brazo que no puede salir rojo **no vigila
> nada**: es decorado con forma de guard. **L-192 escondida un piso más
> abajo**, y peor que la original, porque arriba hay un fixture que dice
> que sí se probó.

**El origen (S83-B4, censo de B).** El lint tenía **40 brazos** repartidos
en sus reglas; **8 salieron DECORATIVOS** — no podían producir rojo con
ningún input. Y los 8 caían en **dos familias** distintas, lo que es el
dato que convierte el hallazgo en ley: no era un descuido puntual repetido
ocho veces, eran **dos formas sistemáticas** de escribir un brazo que no
vigila. *(Los tres números son de B; esta mesa no los re-midió — se citan
como suyos, no como verificados por A.)*

**Por qué merece ley y no solo ocho curas.** El modo de falla es
**exactamente el que L-192 existe para matar, con una capa de maquillaje
encima**: la regla tiene fixture, el fixture pasa, el runner dice verde —
y un quinto del vigilante está apagado. Quien audita ve "auto-prueba: N
reglas encendieron" y **no tiene forma de saber que el conteo es de reglas
y no de brazos**. La casa ya había tropezado con esto de a uno (B dejó
escrito en su propio commit: *"probado que no es decorativo: desactivado
el brazo de los hexes, la auto-prueba grita BRAZO DECORATIVO"*); lo que
S83 agrega es la **medición del conjunto**, que es la que muestra que es
clase y no anécdota.

**Su costo, declarado — y por eso era candidata y no orden.** Llevarla a
ley se presupuestó en **~40 sitios** (un fixture por brazo, no por regla)
**más trabajo de runner** (el reporte tiene que contar y exhibir BRAZOS,
si no la ley es inauditable desde su propia salida).

**➕ ENMIENDA S83-A7 — EL COSTO YA NO ES HIPOTÉTICO: B LO PAGÓ.** En
**S83-B7 (`d121262`)** los ocho brazos decorativos ganaron su rojo y **el
censo bajó de 8 a CERO**. Con eso, la candidata cambia de naturaleza y hay
que decirlo sin maquillar: **ya no propone un gasto, describe un gasto
hecho.** Lo que queda para firmar no es *"¿vale la pena pagarlo?"* sino
**"¿esto es ley de la casa de acá en adelante?"** — es decir, si todo
brazo nuevo nace con su rojo producido o si S83 fue una limpieza puntual.
**La pregunta cara ya está contestada por medición; la barata sigue
abierta y es la única que le queda al founder.** *(El pago es de B; A
verificó el merge por contenido, no re-midió los ocho.)*

**Su hermana:** L-192 (una verificación cuyo modo de falla es el silencio
no es una verificación). Ésta es su aplicación recursiva: **el guard del
guard.**

### 16 · UN GREP POR LA PROP MIDE QUIÉN LA PASA, NO QUÉ SE RENDERIZA

**El texto propuesto:**

> **Buscar por la PROP encuentra a los que usan la pieza; no encuentra a
> los que la reimplementaron.** Un inline no pasa props: pinta. Por eso es
> **invisible** a la búsqueda que uno cree exhaustiva — y el resultado no
> es "no encontré nada", es **"no hay nada", dicho con la autoridad de un
> grep**. Para censar una anatomía se busca **por lo que queda en la
> pantalla**: el elemento renderizado, el token, la forma. La prop es
> evidencia de adopción; **el render es evidencia de existencia.**

**El origen (S83-B9/B10).** B censó la marca de agua buscando por su prop
y concluyó que la pieza no tenía consumidores — cierto, pero incompleto:
**había TRES aguas vivas, todas inline**, con opacidades 0.06 / 0.04 /
0.03, tamaños 210 / 1000 / 280 y tres disposiciones distintas (entera,
sangrada, esquina). El grep que las encontró fue otro: **por el render**
(`opacity: 0.0*` junto a `<Isotipo`). B lo declaró él mismo al corregirse
— la candidata nace de su autocorrección, no de una auditoría externa.

**Por qué merece ley y no solo un recordatorio.** El modo de falla es
**silencioso y con forma de rigor**: un censo por prop devuelve cero, y
cero se reporta como *"no existe"*. **Es L-192 mudada al método de
medición** — la verificación corre, sale limpia, y su limpieza no prueba
nada porque la pregunta estaba mal hecha. Y es la clase de error que
**agranda el trabajo después**: sobre ese cero se decide "entonces la
pieza no hace falta" o "entonces promuevo sin migrar nada", y las tres
copias siguen divergiendo un ciclo más.

**Su forma exigible, para que no quede en consejo:** todo censo de
anatomía declara **por qué buscó** (prop · render · token · forma) y, si
buscó por prop, **dice explícitamente que los inline quedan fuera de su
alcance**. Un censo que no declara su método no se puede auditar — y
heredarlo como si fuera completo es lo que produjo D-597.

**Sus hermanas:** L-170 (*un censo por `pg_get_functiondef` lee los
comentarios como código*) — la misma familia: **el instrumento decide qué
puede aparecer**. Y la #13 (*un defecto vive invisible si el dato de
prueba no lo alcanza*): allá el hueco lo abre el DATO, acá lo abre la
CONSULTA.

**Estado:** viva, sin firma. *Su primer cobro ya está en el archivo:*
**D-597** *existe porque el segundo grep encontró lo que el primero no
podía ver.*

### 17 · RAZONAR EL EFECTO DE UN TOKEN NO ES MEDIRLO

**El texto propuesto:**

> **Un token no tiene el efecto que su definición sugiere: tiene el que
> rinde en el theme resuelto.** Razonar *"esto no debería mover el par"* es
> una hipótesis, y en color las hipótesis fallan por composición: alphas
> que se compositan, capas que se acumulan, fondos que ya no son el hex que
> uno recuerda. **Todo par que se REPORTA sale del theme resuelto —
> `getTheme(...)` y el medidor— jamás de un hex escrito a mano.**

**El origen (S83-B, DOS casos en el mismo turno).** ① *"La `Atmosfera` no
mueve el par"* — **falso: sí lo mueve, y en direcciones OPUESTAS según el
nivel.** ② un cálculo hecho **con hexes inventados** para valores que en
realidad son `rgba` **con alpha**: el número salía, era plausible, y no
correspondía a ningún píxel de la pantalla.

**TERCER CASO, del mismo día y de esta mesa — que es el que prueba que la
candidata no es sobre B:** al verificar `text.tertiary` para fichar D-605,
A calculó a mano `#A9A4C0` sobre `#FAF9F7` y obtuvo **2.279**. El medidor
sobre el theme resuelto devuelve **2.18**. La diferencia no es de redondeo:
**`bg.base` del tema claro ya no es `#FAF9F7`** — es `palette.papelTapiz`
(*pink 3% sobre papel*, S82-B r10). **El hex "de memoria" era el de antes
del tapiz.** Tres casos, dos personas, un solo turno.

**Por qué merece ley y no cuidado.** El modo de falla es **un número
plausible**: no rompe nada, no dispara ningún gate, **y se cita después como
si fuera medición**. Es la familia de *el literal que miente* (D-602) pero
sin mala fe y sin rótulo: **acá el que miente es el método.** Y en color es
especialmente traicionero porque **la intuición funciona casi siempre** —
los hexes suelen ser estables, hasta que alguien mete un alpha, un tapiz o
una capa y todo el razonamiento previo queda viejo **sin aviso**.

**Su forma exigible, y es barata:** cualquier par de contraste que entre a
un reporte, una ficha o un commit **se saca del medidor**
(`scripts/verify-contrast.ts` o `getTheme`), y si se calculó a mano **se
dice que se calculó a mano**. Un número sin procedencia declarada **no es
un dato: es una impresión con decimales**.

**Sus hermanas:** la **#16** (*un grep por la prop mide quién la pasa, no
qué se renderiza*) — las dos son *el instrumento decide qué podés ver*,
una en búsqueda y otra en medición. Y **L-166**: el dato se lee de la
fuente al momento del acto; acá la fuente es el theme resuelto, no la
memoria del hex.

**Estado:** viva, sin firma. *Ya cobró tres veces en un solo turno, y una
fue de quien la estaba escribiendo.*

---

## Nota sobre el conteo

**Son NUEVE, y la novena nació acá.** El inventario abrió con ocho porque **L-169 no existía**: el canon la nombraba y ninguna edición la había escrito. Su texto se depositó en S77 (ver arriba), con su nota de procedencia — que es, ella misma, material de la lección.

> **⚖️ DIVERGENCIA DECLARADA CON EL ACTA DE S82 (r19, no resuelta por la pista):** el `2026-07-31-s82-censo-de-enmiendas.md` y el acta del método dicen **"las 13 candidatas"**; **acá son CATORCE**, verificadas por conteo (`### 1` … `### 14`, sin huecos). La decimocuarta —*un lector que se apoya solo en la RLS no se puede auditar leyendo*— se depositó **con su texto completo** en r17, y las dos piezas del cierre se compilaron sin ella. **Este archivo es la lista; el acta la cita en prosa** — así que el número bueno es **14** y el acta quedó con el contador viejo, que es exactamente lo que este documento existe para evitar (L-141). **No se toca el acta: está firmada. La corrección vive acá y el founder arbitra si el acta se enmienda.**
>
> **RE-MEDIDO S82 (31-jul-2026): son CATORCE.** La decimocuarta —*un lector que se apoya solo en la RLS no se puede auditar leyendo*— entró en r17: la sospecha era fuga, la medición la desmintió **y encontró un defecto peor de ver** (la cuenta de doble papel), con su rojo producido y cinco hermanos censados en D-587. Es hermana de la #8 en otro momento del trabajo, y la #13 explica por qué sobrevivió.
>
> **RE-MEDIDO S82 (30-jul-2026): eran TRECE.** Entraron la décima —*un token se nombra por su ROL*, del trabajo de B sobre el tema— y la undécima —*el nombre que envejeció falla al BUSCARLO*, del canto de veterinaria de C. **Son INVERSAS y por eso van separadas:** una falla al usar el token, la otra al no encontrarlo (y ésa produce duplicados, que es peor porque no se ve). La duodécima —*la ausencia tiene tipos*— entró al inventario en r11 con su quinto tipo; su texto completo vive en `MODELO_PRODUCTO` y acá figura para que se firme con las demás. La decimotercera —*un defecto vive invisible si el dato de prueba no lo alcanza*— entró en r14 con sus cuatro casos y su contraprueba del mismo día (la familia de cuatro hizo visibles dos caminos en una corrida). El conteo se corrige acá y en el título en el MISMO acto (L-141: un contador que envejece miente igual que una ley sin escribir). **Las nueve de S77 siguen SIN FIRMA**, ninguna cerrada: este documento acumula, no vence.

> **RE-MEDIDO S83 (31-jul-2026): son QUINCE.** La decimoquinta —*una regla con auto-prueba puede tener brazos que no pueden salir rojos*— entra del censo de B en S83-B4: **40 brazos, 8 decorativos, en DOS familias**. Es **L-192 aplicada a sí misma** (el guard del guard) y la única de esta lista que llega **con su costo medido de antemano** (~40 sitios + trabajo de runner), porque sin el runner la ley no puede verificarse desde su propia salida. Los números son de B y se citan como suyos: **A no los re-midió**. El conteo se corrige acá y en el título en el MISMO acto (L-141).
>

> **RE-MEDIDO S83 (31-jul-2026, segunda entrada del día): son DIECISÉIS.** La decimosexta —*un grep por la prop mide quién la pasa, no qué se renderiza*— nace de la **autocorrección de B** en B9/B10: el censo por prop de la marca de agua devolvió cero consumidores, y el censo por RENDER encontró **tres aguas inline con tres anatomías distintas** (hoy D-597). Es **L-192 mudada al método de medición**: la verificación corre, sale limpia, y su limpieza no prueba nada porque la pregunta estaba mal hecha. Hermana de L-170 (el instrumento decide qué puede aparecer) y de la #13 (allá el hueco lo abre el dato, acá la consulta). El conteo se corrige acá y en el título en el MISMO acto (L-141).
>

> **RE-MEDIDO S83 (1-ago-2026): son VEINTE.** La decimoséptima —*razonar el efecto de un token no es medirlo*— entra con **TRES casos del mismo turno**: los dos de B (la `Atmosfera` que "no movía el par" y sí lo movía en direcciones opuestas · el cálculo con hexes inventados sobre valores `rgba` con alpha) **y uno de esta mesa**, que calculó `text.tertiary` a mano sobre un `#FAF9F7` que **ya no es el fondo** (`bg.base` es `papelTapiz` desde S82-B r10): 2.279 a mano contra **2.18** del medidor. Su modo de falla es **un número plausible** que después se cita como si fuera medición. Hermana de la #16 (el instrumento decide qué podés ver) y de L-166. El conteo se corrige acá y en el título en el MISMO acto (L-141).
>

Si alguna otra candidata quedó fuera, es porque no encontré su fuente. **Pasame el literal y entra**: el criterio de este documento es que nada figure sin dónde leerlo.

---

### 18 · UN EXIT CODE LEÍDO DESPUÉS DE UN PIPE NO ES EL EXIT DE TU COMANDO

**Origen (S84, 2-ago-2026): DOS PISTAS INDEPENDIENTES, EL MISMO DÍA.** A con
`verify:i18n` (`${PIPESTATUS[0]}` tras un pipe, que en zsh además se llama
`pipestatus` y es 1-indexed ⇒ salió **vacío**) y B con el `tsc`. **Las dos lo
cazaron solas y las dos lo declararon.**

**L-191 ya existe** —*"el exit code se lee del comando, jamás del pipe"*— **y no
alcanzó.** Ése es el dato que vuelve candidata a la lección, no el error: **una
regla que depende de que quien la conoce se acuerde ya falló dos veces en un
día.**

**SU MODO DE FALLA ES UN `EXIT=0` CREÍBLE.** No rompe nada, no se ve, y **se cita
después como verificación**. Es la misma familia que la #17 (*razonar el efecto
de un token no es medirlo*) y la #16 (*el grep por la prop*): **salidas
plausibles que ningún gate caza**, porque el gate solo mira si algo explotó.

---

#### EL BRAZO DE LINT — medido, y lo que la medición dice es que el obvio NO sirve

**El brazo obvio (grepear `$?`/`PIPESTATUS` en scripts) CAZA CERO CASOS. Medido:**
`git grep '$?\|PIPESTATUS'` sobre `*.sh`, `*.mjs`, `*.ts` y `package.json` da
**cero matches** (hay 8 `.sh` en el repo). **Y no es que estemos limpios: es que
el error NO VIVE EN UN ARCHIVO.** Vive en el comando que una pista escribe en su
turno, que no queda versionado en ningún lado que un lint pueda leer.
**Escribir ese brazo sería un guard decorativo** — exactamente lo que la
candidata #15 condena.

**EL BRAZO QUE SÍ EXISTE ATACA LA CAUSA: que no haga falta leer el exit.**
Si todo verify **imprime su veredicto en stdout**, pipear deja de ser peligroso —
el veredicto viaja en el texto. **Y eso ya es casi cierto, pero no del todo:**

> **79 verify en `scripts/`. OCHO no imprimen línea de veredicto**
> (`verify-alcanzabilidad` · `verify-frontera-caida` · `verify-gallery` ·
> `verify-gestos-cliente` · `verify-moneda` · `verify-tabs-s51` ·
> `verify-verdad-firme` · `verify-diseno-pares.ts`).
> **TRES de esos ocho tampoco llaman `process.exit`** (`verify-gallery`,
> `verify-tabs-s51`, `verify-diseno-pares`): dependen de que un `throw` los
> mate. En esos, **"pasó" y "no encontró nada que revisar" son
> indistinguibles**, con o sin pipe.

**Costo:** ~25 líneas de brazo (`verify-diseno.mjs` ya tiene la forma: censar
archivos y contar) + **8 scripts a curar**, una línea cada uno.

**Lo que el brazo NO cubre, declarado:** un `tsc` o un `eas` pipeado siguen sin
veredicto propio — son de afuera. Para esos la única defensa sigue siendo la
regla. **El brazo baja la superficie, no la elimina.**

---

**⚠️ SIN FIRMA (regla 80).** No rige. Y lo que hay que firmar son **dos cosas
distintas**: (1) la lección como texto, (2) **el brazo, que es lo que la vuelve
mecánica** — porque la lección sola es lo que ya falló dos veces.

**Y una observación que le toca a esta mesa:** el caso de A no fue leer mal un
exit *en vez* del veredicto — **`verify-i18n` SÍ imprimió `VERIFICACIÓN
COMPLETA: 0 fallos` y A lo vio**. El error fue **agregarle una segunda lectura
peor y darle prioridad**. *Cuando el comando ya dice su veredicto en texto, ir a
buscar el exit code es redundante — y si lo leés mal, degradás una verificación
que estaba bien.*

---

### 19 · UN INSTRUMENTO CORRECTO SOBRE UN ÁRBOL VIEJO DA UN NÚMERO CREÍBLE Y FALSO

**Origen: S84-B12 (`8519597`), 2-ago-2026.** Depositada **LITERAL** — el texto de
abajo es de B, sin resumir, porque el caso que la funda es suyo y contarlo en
tercera persona le sacaría lo que la hace útil.

> EL VEREDICTO IMPRESO curó que un éxito no dijera nada. Esto cura lo que
> costó más caro: **un instrumento CORRECTO sobre un árbol VIEJO da un
> número creíble y falso, y no hay forma de verlo desde adentro de la
> medición.** El grep está bien escrito, corre, devuelve cero, y el cero
> es verdad — de un árbol que ya no existe.
>
> MI CASO, que es el que lo paga: reporté "el carrusel nace dormido, la
> columna no tiene lectores" con la rama 40 commits atrás de main, donde
> esa columna ya estaba muerta y su reemplazo tenía lector vivo, dos
> migraciones y wrapper. Nada de lo que corrí estaba mal. El árbol sí.
>
> LA CURA ES LA MISMA FORMA que la del veredicto: se IMPRIME arriba de
> todo, antes de cualquier resultado — rama, HEAD, si el árbol está
> sucio, y cuántos commits lo llevan main y origin/main. Un verdicto sin
> ancla dice si el código pasa, no CUÁL código pasó.
>
> Y EL ANCLA DICE SU PROPIA LIMITACIÓN, que es lo que la vuelve
> confiable: las refs son LOCALES. Sin `git fetch`, `origin/main` puede
> estar tan viejo como el árbol que vino a denunciar. Se imprime esa
> línea porque un ancla que se calla su punto ciego miente igual que el
> número que protege.
>
> SE ESTRENÓ CAZANDO SU PROPIO CASO: la primera corrida, la de este
> commit, avisó "1 commits DETRÁS de main". No hubo que acordarse de
> mirar.
>
> TOMADO POR INICIATIVA PROPIA Y LO DECLARO: la orden pedía traer el
> mecanismo con su costo, no ejecutarlo. Lo hice porque son ~15 líneas en
> mi propio archivo y porque una lección sin mecanismo es un
> recordatorio — que es exactamente lo que L-191 ya era cuando falló dos
> veces el mismo día. Si la mesa quería solo la propuesta, se revierte
> con un commit.

**EL MECANISMO QUEDA — firma de la mesa (2-ago-2026):** `scripts/verdicto.mjs`
imprime el ancla arriba de todo y **declara que sus refs son locales**.

---

#### LA CONSECUENCIA QUE SU LETRA ABRE, y trasciende el método *(mesa, 2-ago-2026)*

> **LOS FRENOS SON EL INSTRUMENTO MÁS CARO DE AUDITAR.** Un dato viejo que dice
> **"sí"** se descubre al chocar; uno que dice **"no se puede"** **no se
> descubre nunca**, porque **nadie verifica por qué algo NO se hizo**.
>
> **S84 tuvo once frenos: diez correctos, y uno que casi congela trabajo bueno.**
>
> **La cura no es frenar menos — es que todo freno declare CONTRA QUÉ MIDIÓ.**

**Por qué esto es más grande que la candidata que lo abre:** el ancla de B
protege un **número**. Esta consecuencia protege una **omisión** — y la omisión
no deja rastro. Un reporte que dice *"cero lectores"* se puede re-correr; un
freno que dijo *"no se puede, medí y no da"* **se archiva como prudencia** y
nadie vuelve. **El costo de un freno equivocado se paga en trabajo que no se
hizo, que es exactamente el que ningún gate cuenta.**

*Ejemplo vivo de esta misma sesión, del lado bueno: el freno de S84-A4 sobre
`fotos_galeria` se disparó con un `git grep` que la encontraba en dos
migraciones. **Si se hubiera archivado ahí, habría frenado contra un fantasma**
— la definición VIVA del trigger no la nombraba (cero funciones). Lo que salvó
al freno de ser un falso "no se puede" fue declarar contra qué se midió y volver
a medir contra el objeto.*

---

#### Y EL HALLAZGO HERMANO *(S84-A9b, la mesa lo suma acá porque es el mismo eje)*

> **La verificación que parece REDUNDANTE al escribirla es la que caza lo que
> nadie previó.**

**El caso, medido:** el cinturón de la promoción mecánica verificaba que la fila
del seed siguiera intacta. **Al escribirlo parecía sobrar** — *"el `WHERE` ya la
excluye, esto no puede fallar"*. Fue **la única verificación que vio el
problema**: la fila cambió, la migración se frenó a sí misma, y el incidente
quedó como **D-622** en vez de como un dato alterado que nadie habría notado.

**La relación con las tres anteriores (#15, #17, #18) es directa:** todas son
**modos de falla silenciosos**. Ésta es su contracara operativa — **la única
defensa contra un silencio es una verificación que no dependa de haber previsto
la causa.** Por eso las que "sobran" son las que valen: las que uno escribe
sabiendo qué va a fallar solo cazan lo que ya sabía.

**⚠️ SIN FIRMA (regla 80).** Ni la candidata de B ni sus dos consecuencias
rigen. **Lo que SÍ rige es el mecanismo** — `verdicto.mjs` con su ancla, firmado
por la mesa y ya mergeado.

---

### 20 · UNA CADENA QUE DECLARA EL ESTADO DE NUESTRA CONSTRUCCIÓN NACE CON SU LÁPIDA

**Origen: C (S84), con el caso que la pagó.**

> **UNA CADENA QUE DECLARA EL ESTADO DE NUESTRA CONSTRUCCIÓN NACE CON SU
> CONDICIÓN DE MUERTE ESCRITA AL LADO**, como las lápidas de piezas.
>
> **NO aplica** a las que declaran el estado del **DATO DEL USUARIO** (*"Todavía
> no cargaste tu teléfono"*): ésas **se computan del dato**, son verdaderas cada
> vez que se muestran y **se corrigen solas**. No envejecen nunca.
>
> **LA PRUEBA, en una pregunta:** *¿esta línea deja de ser verdad cuando el
> usuario hace algo, o cuando NOSOTROS entregamos algo?* **Si es lo segundo,
> necesita lápida.**

**LA DISTINCIÓN ES LO QUE LA VUELVE APLICABLE, y por eso va pegada a la regla.**
Sin ella, "todo copy con 'todavía' lleva lápida" sería un barrido de cientos de
strings y moriría de costo. Con ella, el conjunto se achica a las que **dependen
de nuestra entrega** — que son pocas y son justamente las que envejecen.

**ORIGEN, con su caso:** el clip de la vitrina decía *"llega con la próxima
versión"*. **Era verdad al escribirla** y dejó de serlo cuando A entregó
`subirClipVitrina`. **Nadie volvió a leerla.** Un copy honesto que nadie re-lee
se convierte en uno que miente — y **ése además desalentaba el uso** de algo que
ya funcionaba.

**Su familia:** es la hermana en COPY de lo que las lápidas de piezas ya
resuelven en CÓDIGO, y prima de #19 (el árbol viejo): en los dos casos **el
artefacto es correcto y el mundo se movió debajo**. La diferencia es que un
número viejo se re-corre; **una cadena vieja se sigue mostrando**.

**CASO DE ESTRENO, encontrado por el barrido de C y registrado sin curar:**
`i18n/es.ts:63` — `salaEspera.empleadoDetalle`. **Misma clase, peor
consecuencia: la lee alguien RECIÉN INVITADO.** Ficha **D-623**, con su
condición de muerte **atada al arco de equipo** (D-512), no suelta.

**⚠️ SIN FIRMA (regla 80).** No rige. **Que nazca con un caso vivo es lo que
permite firmarla sabiendo qué cuesta aplicarla** — y el costo medido es una
ficha, no un barrido.
