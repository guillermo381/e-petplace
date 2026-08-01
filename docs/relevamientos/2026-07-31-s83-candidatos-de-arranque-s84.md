# S83 → CANDIDATOS DE ARRANQUE PARA S84

> **Qué es esto y qué NO es.** Es la lista de lo que S83 deja **con dueño y
> sin hacer**, escrita al cierre para que la próxima sesión no la
> re-descubra. **No es un mandato:** el norte lo declara el founder. Los
> ítems de acá se ofrecen ordenados por lo que cuesta descubrirlos de nuevo.
>
> Precedente de forma: **§5 del acta del método de S82** (la checklist de
> arranque del prestador). Ese documento sigue siendo la fuente de la
> checklist; éste solo agrega lo que S83 produjo.

---

## 1 · EL BARRIDO DE FICHAS CON DUEÑO VIEJO — *el candidato principal*

**Origen: límite declarado por A en S83-A7.** Al enmendar **D-576** (que
decía "Territorio B" con el reparto de S80, cuando en S83 `apps/prestador`
es de C) quedó dicho en la propia ficha que **se curó ESA y no se barrieron
las demás**.

**El modo de falla, que no es el obvio:** una ficha con dueño viejo **no
pierde su diagnóstico — pierde su destinatario.** Sigue siendo correcta,
sigue siendo legible, y **no tiene quién la retire**. Por eso no aparece
como error en ninguna corrida: el archivo está sano, el trabajo está
huérfano.

**Por qué es el candidato principal y no una tarea de higiene:** el
territorio **se re-reparte cada sesión** (S80: B tenía prestador · S82: tres
pistas con otro corte · S83: B tooling + `packages/ui`, C prestador). Cada
re-reparto **envejece en silencio todas las fichas que nombran al dueño
anterior**, y el archivo de deudas es el instrumento con el que la casa
decide qué hacer. **Es L-141 aplicada al reparto: la prosa decae, y acá lo
que decae es a quién le toca.**

**Forma sugerida (no ejecutada):** `grep -n "Territorio\|Quién la retira\|
Quién la cierra" docs/DEUDAS_CANONICAS.md` → contrastar cada dueño nombrado
contra el reparto vigente → **las que cambian se enmiendan con fecha**, como
se hizo con D-576. **Costo: no medido.** Nadie corrió el grep todavía, así
que el tamaño del barrido es desconocido — **medirlo es el primer paso, no
presupuestarlo de memoria** (regla que esta sesión cobró tres veces).

**Y la pregunta de fondo que el barrido va a destapar** está desarrollada
abajo, en §1bis — el founder pidió anotarla aparte porque **no es una nota al
pie del barrido: es lo que hace que el barrido no haya que repetirlo.**

---

## 1bis · LA CANDIDATA QUE RESUELVE LA CLASE ENTERA — *las fichas nombran TERRITORIO, no pista*

**Anotada por orden del founder (S83-A9).**

**El texto candidato:**

> **Una deuda nombra el TERRITORIO que hay que tocar para retirarla, jamás
> la pista que lo tenía asignado.** *"Quien toque `apps/prestador`"* no
> caduca; *"C"* caduca **la próxima vez que se reparta** — y caduca en
> silencio, porque una ficha con dueño viejo sigue siendo correcta, sigue
> siendo legible y **no falla en ninguna corrida**: solo deja de tener
> destinatario.

**Por qué resuelve una clase y no un caso:** el reparto cambió **tres veces en
cuatro sesiones** (S80: B tenía prestador · S82: tres pistas con otro corte ·
S83: B tooling + `packages/ui`, C prestador). Con dueño-por-pista, **cada
re-reparto vuelve a envejecer el archivo entero** y hay que barrerlo de nuevo;
con dueño-por-territorio, **el barrido de §1 se hace UNA vez y no vuelve**: la
ficha se resuelve sola contra el reparto vigente, sea cual sea.

**Su forma exigible (propuesta, sin firma):** el campo *"Quién la retira"*
nombra **una ruta o un paquete** (`apps/prestador`, `packages/ui`,
`supabase/`, `scripts/`), y **solo nombra pista cuando el trabajo no es de un
territorio** sino de alguien con un contexto irrepetible — un gate del
founder, un arbitraje de mesa. **Esa excepción hay que dejarla escrita**, o la
regla se fuerza a ruta donde no corresponde.

**El costo, honesto:** convertir las fichas existentes **es el mismo barrido
de §1** — no es trabajo adicional, es el criterio con el que ese barrido se
hace. **Por eso conviene firmar esta candidata ANTES de barrer:** barrer con
el criterio viejo obliga a barrer dos veces.

**Estado:** candidata, **sin firma** (regla 80: la ley se escribe después del
resultado). Origen: S83-A7/A8 (límite declarado por A), anotada por orden del
founder en A9.

---

## 2 · LO QUE ESPERA FIRMA DEL FOUNDER EN GALERÍA — *ya montado, listo para mirar*

Los tres entraron a `main` con B11 (`3b26ac2`) **para que se puedan ver en
la pantalla real**, que es donde la regla 80 dice que se firman:

- **D-597 · la marca de agua** — cuatro existencias, tres anatomías inline
  vivas y una pieza sin consumidores, más un JSDoc que declara muerta una
  variante que el Hogar está pintando. **Firmar la anatomía es lo que
  desbloquea unificar.**
- **D-598 🔴 · el choque de letras firmadas** (la huella del tab: S72 vs
  §15b.1). **Es arbitraje, no criterio de mesa** — y la letra que pierda
  **se enmienda en su documento**, no se deja conviviendo.
- **El glow de la casa verde** — montado en la galería como candidato; hoy
  es el `boxShadow` artesanal de **D-599**.

## 2bis · EL CHEVRON DIVERGENTE DEL CLIENTE — *lo único con síntoma visible que hoy no le toca a nadie*

**D-600, la pata de `apps/cliente`.** S83-B12 unificó el chevron dentro de
`packages/ui` (nace `chevron.ts`) y quedaron **tres paths sueltos en `apps/`**.
Dos son del prestador y tienen dueño (C). **El tercero no tiene dueño y es el
único que ya se ve mal.**

**La distinción que hay que llevarse, porque ordena el trabajo:**

> **Duplicar es DEUDA. Divergir es DEFECTO.**

- Los dos del prestador (`(tabs)/index.tsx:1177` · `prepara-espacio.tsx:54`)
  son **byte-idénticos** al canónico. Costo **futuro**: el día que el trazo
  cambie quedan viejos. **Síntoma hoy: cero.**
- El del cliente usa **`M9 5l7 7-7 7`** contra el canónico
  **`M9 18l6-6-6-6`**. **No es otro string: es otra geometría** — 7 unidades
  arrancando en `y=5` contra 6 arrancando en `y=18`. **Dos flechas de tamaño y
  proporción distintos haciendo el mismo trabajo en dos apps de la misma casa,
  hoy, en pantalla.**

**⚠️ CORREGIDO EN S83-A11 al correr el grep abierto de cierre: la divergencia
del cliente NO es un sitio, son TRES** — `(tabs)/hogar/index.tsx:184` ·
`hogar/mascota/[mascotaId].tsx:937` · `:1063`. **Eso cambia cómo hay que
tratarla:** con un solo sitio se leía como descuido puntual; **con tres, en dos
archivos, es el trazo que la app del cliente usa COMO SUYO** — la cura tiene
que asumir *dos sistemas conviviendo*, no una línea rebelde. *(Y el censo total
pasó de 3 a 6: el sexto es `prestador/components/perfil-piezas.tsx:54`, que
**nació el mismo día** en C10 mientras B unificaba — coherente con su diseño
—anatomía local hasta que se retire— pero deja el hecho crudo: **una pista
cerraba la fuente única mientras otra creaba un duplicado nuevo sin saberlo.**
Detalle completo en la corrección de D-600.)*

**Por qué nadie lo vio hasta ahora, y conviene tenerlo presente al barrer:**
el mismo archivo del cliente **acierta los otros dos trazos** (`'revela'` y
`'arriba'` son byte-idénticos al canónico). **Dos de tres coinciden**, así que
el bloque parece el mismo sistema; solo la comparación literal del tercero lo
destapa. **Un vistazo lo aprueba.**

**Lo que hace falta para que se pueda retirar: que `apps/cliente` tenga dueño
en el reparto de S84.** Es el ejemplo vivo de por qué el reparto se decide
antes de repartir trabajo — y de por qué §1bis (fichas por territorio, no por
pista) resuelve la clase: con dueño-por-territorio esta ficha se habría
resuelto sola contra quien tocara `apps/cliente`, sin esperar a que alguien la
adopte.

**Y la cura, con su trampa dicha:** se retira **consumiendo la PIEZA** que
porta el chevron (`CeldaNavegacion` / `FilaCita` / `PieRevelar`), **jamás
importando `CHEVRON` desde la pantalla** — eso movería el problema de sitio en
vez de cerrarlo: el trazo es un detalle de la anatomía, no un token que las
pantallas deban conocer.

## 2ter · MEDIR `eas update` DESDE UN WORKTREE — *la candidata que cierra DOS deudas de raíz*

**Está en el canon desde S81 como letra founder** (*"si la veda vuelve a fallar, la
cura es publicar desde un WORKTREE en detached sobre el sha declarado"*) y quedó
**candidata** por una razón honesta: *"el comportamiento de EAS en detached no se
conoce lo suficiente para mandarla"*. **S83 no la resolvió, pero le sumó el segundo
incidente que la respalda.**

**Lo que S83 aprendió y cambia el cálculo:** el worktree por pista (regla 85) se
estrenó y **curó la mitad del problema** — tres árboles, tres índices, **cero
arrastres en toda la sesión** contra los tres que D-586 documentaba. **Pero la clase
era más ancha que el índice: es trabajo concurrente sobre un recurso compartido**, y
la otra mitad —**el árbol de trabajo de `main`, desde donde se publica**— siguió viva
y **cobró el mismo día** (incidente C17: porcelain vacío en ①, árbol sucio durante el
publish, ancla con asterisco; el bundle salió limpio **de casualidad**, eran dos
`.md`).

**Las dos deudas que cierra si se mide y funciona:**
- **D-586** — su mitad restante (el árbol compartido, no el índice).
- **La regla 82** — el **paso ⓪** que S83 acaba de agregar pasaría de **puerta** a
  **red**: el ancla dejaría de depender de que nadie toque el árbol.

**Lo que hay que medir, concretamente (es una tarde, no un arco):** ¿`eas update`
corre desde un worktree? ¿toma bien el `gitCommitHash` del sha en detached? ¿el
`projectId` y las credenciales resuelven fuera del árbol principal? **Y el dato que
S83 dejó servido:** un worktree nuevo **necesita `pnpm install` propio** (787 MB,
minutos — medido en A1), así que el costo de tener un árbol dedicado a publicar
**está medido y es bajo**.

**Por qué vale la pena y no es higiene:** las dos deudas que cierra **no producen
errores visibles — producen anclas que mienten**. Un ancla con asterisco no rompe
nada hoy; rompe la trazabilidad del día que alguien pregunte *qué corría en ese
OTA*. **Es exactamente la clase de defecto que la casa decidió no acumular.**

## 2quater · `text.tertiary` — LA ÚNICA TANDA DE S84 QUE LLEGA CON TAMAÑO YA MEDIDO

**D-605 (texto) y D-606 (gráfica), partidas en S83-A23.** El censo que su
condición de muerte pedía **ya está hecho** (S83-A22), así que esta tanda no
empieza por relevar: **empieza por curar.**

**Lo que el censo decidió, y decidió por dato:** la salida *"re-confirmar la
exención y acotarla al rol apagado"* —que sonaba a la barata— **queda
descartada: acotar al rol obliga a migrar ~20 sitios igual.** No es
re-confirmar, es trabajo.

**El tamaño, medido y CONCENTRADO en cuatro grupos** (no son 20 sitios
dispersos):

| grupo | n | dueño |
|---|---|---|
| **los 2 helpers de `packages/ui`** | 2 | B |
| los 4 checkouts del cliente | 5 usos | `apps/cliente` — **sin dueño en S83** |
| `plan-hoja` | 6 | `apps/cliente` — sin dueño |
| los 3 educativos del prestador | 3 | C |

**La prioridad sale sola y no hace falta discutirla:**
1. **Los 2 helpers de `packages/ui` — máximo ALCANCE.** No son dos pantallas:
   **los hereda cada `Campo` de la casa**, en las dos apps. Dos líneas mueven
   todos los formularios.
2. **El mono de `checkout-reserva:241` — máximo DAÑO.** Dato de máquina, en la
   pantalla donde se paga, a **2.18 en el tema por defecto**.

**Y una dependencia que conviene ver antes de empezar: D-606 (la gráfica) NO se
cierra sola.** Es familia de **D-590** y **D-599**, y las tres comparten la
causa raíz que ninguna nombra sola — **el corpus de pares gráficos de
`verify-contrast` es MANUAL**. Curar los chevrones con pares agregados a mano
deja el hueco abierto para el próximo glifo. **Las tres se cierran juntas o
ninguna cierra del todo.**

**Nota de reparto que se repite:** de los cuatro grupos, **dos viven en
`apps/cliente`, que no tuvo dueño en S83** — el mismo hueco que §2bis (el
chevron divergente). **Es el segundo caso del día que espera al reparto**, y
refuerza §1bis: con fichas por TERRITORIO esto no esperaría a que alguien las
adopte.

## 0 · LA VITRINA ABRE S84 — y su primera decisión NO es de diseño

**El founder firmó el modelo (Kaxo/Fluvi): el Perfil se parte en tres ejes y
"Tu perfil" pasa a ser LA VITRINA**, con espejo *"Así te ven"* y portada +
galería. **Antes de dibujar una línea hay una decisión de MODELO que le toca al
founder, no a la mesa ni a las pistas.**

### La primera decisión: **D-173** — el choque, abierto desde S21

> El TDR de Portal Sellers declara como principio fundacional: *"para el
> comprador, el seller es e-PetPlace; el comprador **nunca ve ni interactúa
> con el seller directamente**"*.
> `PORTAL_PRESTADOR` §4.4 le da al prestador **cara, nombre, biografía y URL
> propia**.

**Son incompatibles tal como están escritos**, y D-173 lo llama **"decisión de
modelo bloqueante"** desde S21. **Construir la vitrina como cara pública del
prestador es tomar partido en ese choque** — y conviene que sea **a propósito y
con firma**, no como consecuencia de haber empezado a dibujar. *(Nota: el choque
es prestador ↔ seller. Puede resolverse distinto para cada uno — pero eso
también hay que decidirlo.)*

### Lo que YA está escrito y hay que leer antes (no re-descubrir)

**`PORTAL_PRESTADOR` §4.4, línea 504 — DECISIÓN CERRADA S20**, con sus ocho
contenidos y la promesa de que la página es *"activo real del prestador"* atada
a la **graduación (Día 90)**. **No es candidata: está firmada.** Detalle,
huecos y literal en **D-612**.

### Los tres huecos que la letra deja, medidos

| | qué falta | por qué importa |
|---|---|---|
| **el anclaje** | la deuda documental que S20 se auto-declaró (`MODELO_PRODUCTO` + `EPETPLACE`) **nunca se pagó** — cero menciones | `MODELO_PRODUCTO` **es paquete de arranque** y `PORTAL_PRESTADOR` no: una sesión puede diseñar la vitrina **sin enterarse de que la letra existe** |
| **el slug** | no hay columna, y el literal dice *"o equivalente final"* | `ciudad+nombre` **no es único** y el nombre **es editable**: un rename rompe la URL **y el SEO que la letra promete** |
| **las insignias** | certificación · Fundador · Familia G **sin modelo de dato** | §4.4 las exige visibles; ninguna está en las 18 columnas de `v_prestadores_publicos` |

### Y lo que la vitrina desbloquea de paso

**D-601** — los cuatro campos de contacto (`telefono`·`whatsapp`·
`email_contacto`·`sitio_web`) **dejan de ser escritura sin lector**: §4.4 los
pide como *"información de contacto y reserva"*. **El WhatsApp obligatorio que
el founder firmó tiene, por fin, a dónde llegar.**

## 3 · LAS OTRAS FICHAS S83 CON DISPARO PROPIO

| | qué espera |
|---|---|
| **D-589** | el gate del founder sobre el próximo OTA del prestador (¿el halo alcanzó para las seis Tarjetas?) |
| **D-590** | **después de H2** — el guard NO se construye antes: el número depende del fondo |
| **D-592** | confirmación en pantalla; la cura es **repartida** (guarda de B + voz de C) |
| **D-594** | una línea en el hook (`quotePath`), con su rojo producido en **las dos** direcciones |
| **D-595** 🔴 | **el seed de dos paseos simultáneos es parte de la cura**, no un paso previo |
| **D-599** | la decisión (a) zona franca declarada / (b) entra al corpus — **lo ilegítimo es seguir sin decidir** |
| **D-593** | la checklist de la regla 85 (ya tiene sus dos puntos: install propio · `checkout` sobre trabajo sin commitear) |

## 4 · OPERATIVO QUE NO SE RESOLVIÓ EN S83

- **El runtime del prestador sigue sin build alcanzable** (medido en R0): el
  canal sirve **1.0.3** y el build EAS más nuevo es **1.0.2**. El único
  1.0.3 conocido es el **APK local de S78**, que no está en `eas build:list`.
  **Si el teléfono no lo tiene, ningún OTA del prestador le llega** — por
  limpio que salga el publish.
- **Los tres worktrees siguen montados** (`main` · `s83-b` · `s83-c`).
  Retirarlos o conservarlos es decisión de arranque (regla 85).

---

*Origen: S83, cierre de la pista A. Los ítems 2-4 son estado medido; el 1 es
el límite que A declaró en su propio trabajo y el founder pidió anotar.*
