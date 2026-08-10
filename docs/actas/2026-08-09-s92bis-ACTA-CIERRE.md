# ACTA DE CIERRE · S92-BIS (9 Ago 2026) — EL PERÍMETRO

> Continuación del loop de S92 (S93 está tomada por la landing). **Pista A sola.
> Cero features.** Lo que S92 no miró: Storage, llaves, superficies publicadas y
> la puerta de entrada.

---

## ① EL SALDO

**Cinco curas aplicadas y verificadas por camino real · cinco deudas nuevas ·
dos rescates que nadie fue a buscar · un P0 del founder curado.**

| bloque | resultado |
|---|---|
| **B0** regresión de S92 | **27/27** + **19/19** flujos + contraste de sondas |
| **B1** Storage | `avatars` y adopción curados · **13/13** · 127 huérfanos censados |
| **B2** llaves | **ninguna `service_role` en el repo** · 4 falsos positivos · 1 real (mío) |
| **B3** superficies | 2 despachadores curados **9/9** · 4 facturables curadas **8/8** |
| **B4** auth | 3 rojos medidos, perillas servidas al founder |

---

## ② LOS TRES AGUJEROS QUE ESTABAN ABIERTOS

**`avatars` era un vertedero de una sola dirección.** Cualquiera con una cuenta
podía **subir archivos a la carpeta de otro, sin límite de tamaño ni de tipo**,
servidos desde el dominio de la casa — **y no podía borrarlos ni él**, porque el
bucket no tenía policy de DELETE. Las policies de `adopcion-fotos` **se llamaban
«Admin» y solo miraban el bucket**. *El defecto estaba escrito en un comentario
del código desde hacía sesiones: se venía esquivando en vez de curando.*

**Dos despachadores contestaban a internet.** `despachar-push` y
`despachar-whatsapp` devolvían **200 sin ninguna credencial**. Y **ninguna
configuración de Supabase los habría protegido**: con `verify_jwt: true` entraría
cualquiera con la anon key, que es pública y viaja en el bundle.

**Cinco functions facturables entraban con la clave del bundle.** `verify_jwt`
valida que el JWT sea **válido**, y la anon key **es** un JWT válido. *No es fuga
de datos: es fuga de plata.*

**Y la puerta de entrada acepta `password`.** Mínimo de 6 caracteres, las cuatro
claves obvias probadas aceptadas, y **12 intentos fallidos seguidos sin un solo
429**. Contra una cuenta cuyo correo se conozca, se prueba la lista entera sin
que nada frene. *No hace falta ninguna vulnerabilidad: alcanza con la puerta como
está.*

---

## ③ LO QUE ESTABA BIEN — y conviene no re-auditar

- **Ninguna `service_role` en el árbol versionado.** Buscada **por FORMA**
  (decodificando el claim `role`), no por nombre: una llave renombrada aparecía
  igual. Los tres JWT del repo son `anon`, pública por diseño.
- **Los cinco buckets privados** —incluidos los 91 documentos de identidad—
  rebotaron las cinco pruebas. La cura de S47 sigue rigiendo.
- **Los cinco papeles clínicos** tienen `verify_jwt: false` **pero su propio
  guard**: `token_invalido`. El acceso por token en la URL funciona.
- **El schema `cron` no está expuesto**: 404 a anónimo y a autenticado, cero
  grants. *Una policy `{public}` sin grant no alcanza nada* — por eso el rojo
  aparente de los comandos con credenciales **no era rojo**.

---

## ④ EL P0 DEL FOUNDER — «el paseo es para perros», con dos perros vivos

**No era regresión de S92**, y se midió de cuatro formas: el guard del motor
devolvía `true`, **cero grants perdidos** contra el snapshot que S92 tomó al
abrir, el catálogo respondía `["perro"]`, y ninguna de las cuatro hipótesis de la
mesa se confirmó.

**La causa:** `ofrecibles()` devuelve `[]` en **tres** situaciones —cargando,
error, y de verdad no hay— y la pantalla decidía con `length === 0`.

**Lo que lo vuelve lección: la advertencia ya estaba escrita** en el header de la
lib que ese mismo archivo importa. Cuatro pantallas la cumplían y una no, y nada
lo detectó. ⇒ **L-218 + R34** en `verify:diseno`, el instrumento que la vigila.

**Y el paseo era el único que podía romperse:** es el único oficio donde la
mascota se elige en el **último paso**; los otros tres la reciben ya elegida.

---

## ⑤ LOS DOS RESCATES

**Siete archivos que nunca llegaron al canon.** La cura de una línea que S92
propuso (`git branch -a --no-merged main`) devolvió **seis actas de cierre de
pista** y un instrumento. *No era un caso aislado: la última acción de una pista
es escribir su cierre, y por eso es justo la que se queda afuera.* **D-707 sube
de gravedad.**

**Un token de sesión que yo mismo había commiteado** (D-712). De cuenta fixture y
ya vencido — pero eso es suerte, no diseño. **R6 estaba escrita desde el arranque
y no lo evitó**, porque una regla que depende de acordarse no protege un
`JSON.stringify`. Hoy el saneador redacta cualquier JWT antes de escribir.

---

## ⑥ LOS ERRORES DE ESTA PISTA

1. **Seis nombres adivinados en vez de medidos** (`p_tipo`, `familia_miembros`,
   `titular_user_id`, `eventos`, `prestador_fotos.storage_path`, tres columnas de
   los seis flujos). **Tres parecían «rompí el camino legítimo».**
2. **Un verde flojo**: el brazo sano de Storage dio 400 y parecía cura rota — era
   `415 invalid_mime_type`, o sea **el filtro nuevo funcionando**. Para probar
   una policy hay que pasar antes el filtro de tipo.
3. **El censo de la clase devolvió CERO** en sus tres ejes, incluido un patrón
   que existe en 80 archivos. *Un censo que devuelve cero se lee igual que «no
   hay nada que arreglar».*
4. **R34 se equivocó dos veces antes de servir**: numeró sobre el texto sin
   comentarios (mandó a mirar seis líneas que no eran) y marcó `length === 1`,
   que es sano. *Un lint que manda al lugar equivocado enseña a ignorarlo.*
5. **Mi censo de `.env` fue parcial** (lista de raíces a mano, ocho worktrees
   afuera) y casi concluye «no se explica» sobre una búsqueda incompleta.

---

## ⑦ LA CONTRADICCIÓN DEL `.env`, cerrada — y su dato

El founder veía la línea vacía; yo medía 32 caracteres. **Mismo archivo byte a
byte** (md5 `9db678109c30…`): su editor enmascara el valor, y **el comentario
vencido de S44 —«# ↓ completala vos», que quedó de cuando la variable nació
vacía— le confirmó la lectura errada.**

*Un comentario vencido al lado de un dato vivo hizo que el founder concluyera que
una credencial no existía, y costó varias vueltas.* Pariente de **L-210**, del
otro lado: ahí el guard confundía el epitafio con la ley; acá el comentario
negaba un valor que sí estaba.

**La diferencia de un carácter, medida y cerrada:** 25 (nombre) + 1 (`=`) + 32
(valor) = **58** en las dos mediciones. La resta de 57 salía de no contar el `=`.
El valor está limpio: sin espacios, comillas ni CRLF.

---

## ⑧ OPERATIVO

- **1 migración** (`20260809030000`) con reversa escrita antes y 76(g) declarada.
- **6 edge functions desplegadas** con `--use-api` (sin Docker).
- **11 fixtures `seg2-*` limpiados dentro de la sesión**: 161 → 150, residuo 0,
  con el mismo protocolo de guards que S92 usó con las 64 sondas.
- **`verify:diseno` VERDE con 26 reglas** (R34 nueva) · typecheck del cliente
  verde.
- **Deudas D-709 → D-718** · **lección L-218** · **D-713 y D-714 nacen y mueren
  el mismo día**.

---

## ⑨ LO QUE **NO** ESTÁ FIRME (regla 77) — PARCIAL declarado

- **El OTA no se publicó.** Medido: el canal sirve el ancla `c4c92933` de S91,
  **anterior a la cura del paseo** ⇒ **nada de lo que toca pantalla llegó al
  aparato**. El OTA es del founder.
- **Ningún gate en dispositivo corrió.** La lista con checkboxes está en
  `docs/relevamientos/2026-08-09-seg2-GATES-EN-DISPOSITIVO.md`. **El más
  importante: que una notificación real siga llegando** (una cura tocó ese
  camino).
- **`chat-ayuda` quedó sin curar** — la quinta facturable, sin fuente en el repo
  (D-717).
- **D-715** (el muro §8.3 al `system`) **no se tocó por decisión del founder**:
  exige re-gate de calidad de dictado.
- **El brief de S93 no se escribió, por orden del founder: ya existe.**
- **Efecto declarado:** el retome de WhatsApp del canon ahora necesita el header
  `x-despacho-secret`; **el curl viejo rebota 401**.

---

## ⑩ ADENDA — LO QUE PASÓ DESPUÉS DE ESTE CIERRE (9-ago, mismo día)

*Todo lo de abajo es posterior al acta y se anexa acá en vez de reescribirla:
un acta firmada no se toca, pero un acta que calla lo que pasó después miente
por omisión.*

### ⑩.1 · `chat-ayuda` BORRADA (D-717 cerrada)

El founder eligió **(a) borrarla**, tras la medición que pidió. **Qué era:** una
boca de ayuda automática colgada del botón de la web vieja, que contestaba con
IA. **Por qué se borró:** ① **cualquiera con la llave que viaja en la app podía
hacerla correr**, y cada corrida facturaba contra la cuenta de la casa — era la
única de las facturables que un desconocido podía ejecutar de verdad;
② **contestaba con el producto de hace dos versiones** —carrito, checkout, un
«índice de salud» con puntaje— en una voz que `MODELO_LOYALTY` §3 prohíbe. *Un
guard arreglaba lo primero y no lo segundo.*

**Verde por camino real:** el mismo POST con la misma anon key pasó de
**`200`** a **`404`**, y **las otras 13 functions dieron el mismo status antes y
después**.

⚠️ **Y el instrumento se equivocó primero, lo que justificó el orden:** la v1 del
script traía los nombres **tipeados a mano** y **tres estaban mal**, apareciendo
como `404` en la corrida **«antes»**. *Si el orden hubiera sido
borrar-y-después-medir, ese 404 se habría leído como «el delete se llevó tres
functions por delante» — un rojo inventado sobre un acto irreversible.* Curado:
la lista se lee de `functions list`.

**Reversible:** la fuente (11 261 bytes) quedó en el repo, verificada **por
contenido desde `main:`**. **Costo aceptado y firmado: el botón de ayuda de
`e-petplace-v2` queda roto a propósito.** Nace **D-722** (si algún día se quiere
un asistente, se construye nuevo).

### ⑩.2 · EL HALLAZGO DEL BASELINE: LOS DESPACHADORES ERAN **TRES** (D-723 🔴)

Midiendo el «antes» del borrado apareció que **`despachar-correo` responde `200`
con la anon key y PROCESA LA COLA**. Es el defecto de D-713 — *y el censo de esa
deuda dijo «los dos despachadores» cuando eran tres.*

**Por qué se escapó:** los dos curados tienen `verify_jwt: false` y éste `true`,
que **da sensación de puerta cerrada**. Pero L-714 ya lo había medido: *la anon
key **es** un JWT válido.* **La lección estaba escrita y el censo igual se hizo
por la propiedad equivocada.** No se curó: tiene la misma ventana delicada que
D-713 (primero el cron, después el deploy) y es decisión del founder.

### ⑩.3 · EL CENSO DE LA VOZ DE CONTRASEÑA — y el camino que estaba caído

El founder pidió censar qué **ve** el usuario ante clave corta, clave filtrada y
falta de la contraseña actual, en las dos apps y el portal. **El censo encontró
algo que no era de mensajes:**

🔴 **D-719 — el cambio de contraseña estaba CAÍDO desde que se encendió la
perilla.** El wrapper re-autenticaba y después llamaba `updateUser` **sin**
`current_password`; la perilla exige el campo **en el PUT** y la sesión fresca no
alcanza. **El prestador veía «Ocurrió un error inesperado» y probar de nuevo
fallaba siempre.** Curado (la línea que faltaba + brazo por `code` estable),
**verde 7/7 por el wrapper** con el rojo reproducido y contra-caso.

🟠 **D-720 — la app no puede distinguir «corta» de «filtrada», y decía la
equivocada.** Las dos viajan con el **mismo** `weak_password`; solo cambia el
texto en inglés. Ante `password123` —**once** caracteres— las cuatro superficies
decían «necesita al menos 8»: falso **y además irresoluble**, porque quien
obedecía agregaba caracteres y volvía a rebotar. *El bucle de D-659 con otra
causa.* Curado con **voz única firmada por el founder**, verde 8/8.

🟠 **D-721 — el portal pedía 6 donde el servidor exige 8**, y el censo por clase
halló **dos casos más**, incluido uno que enseña: **`seguridad.largoMinimo`
tenía el 8 a mano mientras su gemela de `recuperar` ya se interpolaba** — y el
comentario de la gemela dice, textual, *«el hardcodeo parió el 6 vs 8»*. **Se
curó el hermano y no el gemelo.**

### ⑩.4 · D-724 — EL CORREO DE AUTH SALÍA DE UN DOMINIO BORRADO

Preparando la medición de D-719 (b) apareció que **el correo de recuperación no
salía** (`500 · Error sending recovery email`, reproducido ×2).

**La causa raíz no estaba en este producto:** se **borró el dominio
`avisos.epetplace.com` de Resend** y **el SMTP de auth siguió apuntando ahí**.
Probado **por DNS público, sin tocar una credencial**: la raíz `epetplace.com`
tiene DKIM, su `send.` tiene MX de bounces y SPF; `avisos.epetplace.com`
responde **`NXDOMAIN`** — *no era «sin verificar»: no existía.*

**Curado por el founder** (remitente → `hola@epetplace.com`). **`/recover` pasó
de `500` a `200`**, con el falso verde esquivado: se probó sobre una cuenta que
**existe**, porque `/recover` responde `200` aunque no exista.

**Alcance acotado y medido:** la confirmación de cuenta está apagada (D-299),
el magic link rebota por perilla de producto, **la invitación de prestador no
usa correo de auth** (viaja por WhatsApp o carta), y **las notificaciones nunca
estuvieron afectadas** — mandan por **API** de Resend desde el dominio bueno.
*Por eso el canal parecía sano: el que funcionaba y el que fallaba no eran el
mismo.*

**⇒ L-219**, pariente de L-193: *un canal externo se cae por un cambio hecho en
otro lado, y nada avisa.* **Y estuvo caído sin una sola alarma** — se descubrió
de rebote.

### ⑩.5 · LO QUE QUEDA ABIERTO DE ESTA ADENDA

- **D-719 (b)** — si la perilla rompe la **recuperación** no se pudo medir hasta
  tener un código real. *No se curó «por las dudas»: quien recupera **no
  conoce** su contraseña actual, así que la cura de (a) no aplica y adivinar
  dejaría el flujo roto con un mensaje bonito.*
- **D-723** — el tercer despachador, abierto.
- **Nadie vigila el canal de correo** — sin monitor ni prueba periódica.
- **La pantalla de recuperar NO EXISTE en la app del cliente** (ni «olvidé mi
  contraseña» en su login). Construirla es de la **sesión de login** del founder.

---

## ⑪ EL OTA — PUBLICADO Y VERIFICADO (9-ago-2026)

**Lo que S92 y S92-BIS curaron llegó al aparato.** Hasta este acto el canal
servía el ancla `c4c92933` de **S91** ⇒ *nada de lo que toca pantalla existía
para el founder*, incluida la cura del paseo.

### El runbook, eslabón por eslabón (regla 84)

**⓪ VEDA declarada** aunque la pista fuera única: `git status --porcelain` en
**cero** y `git worktree list` con **12 worktrees, todos de sesiones cerradas**
(S83/S86/S87/S90/S91 — los de D-718). **Ninguna pista en vuelo.** Metro lee el
primario, que estaba en `main` y limpio. Ventana **abierta y cerrada** con el
árbol verificado en los dos extremos.

**② PUSH ANTES DE BUNDLEAR.** Medido: `origin/main` estaba en **`017bd11f`**
—el cierre de S91— o sea que **S92, S92-BIS y las curas de hoy no existían en
remoto**. Se pushearon **26 commits** (rango declarado commit por commit,
enmienda 79) y **`origin/main` se re-midió DESDE EL REMOTO** tras el push:
`5c3046b5` = `main`. *Un OTA cuyo ancla no existe en origin deja el bundle del
teléfono sin fuente auditable.*

**③ PUBLISH como ACTO ÚNICO** (`scripts/publicar-ota.mjs`), que verifica,
bundlea y **re-verifica después** — porque el bundling tarda ~60 s y ni un acto
atómico impide que alguien commitee mientras corre; lo único garantizable es que
sea imposible no enterarse.

### ⑤ LO TRANSCRIPTO EN EL MOMENTO — leído del OBJETO con `update:view`

*`update:list` NO expone el hash, que es justo lo que el eslabón verifica.*

| | **CLIENTE** | **PRESTADOR** |
|---|---|---|
| **group** | `7311eab6-eadc-40aa-95cc-52aa0c748b07` | `a0831942-6edd-45b3-9e9f-d9d756c17c3f` |
| **android** | `019fe79c-04de-77a5-b0af-8e6982c906f2` | `019fe79c-c27f-7246-b183-5b9d996c30bf` |
| **ios** | `019fe79c-04de-723f-af8b-fc6979e3140c` | `019fe79c-c27f-7728-9b65-f735256e11ea` |
| **runtime** | **1.0.3** | **1.0.4** |
| **gitCommitHash** | `5c3046b5b0fa61f4c5eac86363d33f5ce2b4119e` | `5c3046b5b0fa61f4c5eac86363d33f5ce2b4119e` |

**El ancla es la misma en las dos apps y es un commit de `main`**, no la punta de
una rama — y está en `origin`, verificado antes de bundlear.

### ④ VERIFICADO POR LO QUE SE SIRVE, no por lo que se guardó

`verify-ota.mjs` **VERDE en las dos**: ① el canal **sirve** el update publicado
· ② existe build `finished` para su runtime (cliente `522e948e` 1.0.3 ·
prestador `b339f942` 1.0.4).

⚠️ **Su aviso ③, que no frena y se transcribe igual: RUNTIMES HUÉRFANOS** — el
cliente tiene binarios instalables en **1.0.0, 1.0.1 y 1.0.2** y el prestador en
**1.0.0, 1.0.1, 1.0.2 y 1.0.3**, y **ninguno recibe este lote**. *Un aparato con
una APK vieja no se rompe: se queda quieto con lo que ya tenía, y eso es
exactamente lo que hizo creíble el diagnóstico equivocado del 4-ago.* **Si el
founder mira una APK que no sea 1.0.3 (cliente) / 1.0.4 (prestador), no va a ver
nada de esto y no será un fallo de las curas.**

### ⑥ ASTERISCOS: **CERO** — y se declara

Los **dos** publishes salieron con el árbol quieto: el script re-verificó
después de bundlear y confirmó *«el ancla real es la verificada y el árbol no se
movió»*. **Ningún archivo sucio, ninguno entrando al bundle.** *Se declara la
ausencia porque `eas update:view` no expone el estado del árbol: un publish
sucio es inauditable después, y ésta es la única ventana para decirlo.*

**Nota honesta:** este commit del acta es POSTERIOR al ancla `5c3046b5`, así que
`main` avanza un paso respecto del bundle. Es normal y no ensucia nada — el
ancla es el commit **del que salió el bundle**, y quedó registrado arriba.

---

## ⑫ 🔴 EL P0 DEL PASEO, REABIERTO — y la lección es sobre cómo verifico

**El founder lo probó con el bundle nuevo ya en el aparato y el error persistía.**
La primera cura era correcta **como cura** y estaba en el ancla publicada
(`b8488231` es ancestro de `5c3046b5`, verificado) — **pero no era la causa
completa**.

### Lo que la verificación anterior contestó, y lo que no

`p0-verde.mts` importaba `ofrecibles()` real, sí, **pero reescribía la decisión
de la pantalla en una función local y le pasaba las mascotas a mano**
(`const THOR = {…}`).

> **Contestó:** *«dada una lista y una fase, ¿la lógica decide bien?»* — y sí.
> **No contestó:** *«¿la pantalla RECIBE las mascotas?»* — que es donde estaba el bug.

*Le di los perros al test y después celebré que encontrara perros.* **⇒ L-220.**

### El backend, descartado por medición (no por confianza)

| qué | resultado |
|---|---|
| Thor y Zeus en DB | `especie='perro'` · `estado_vida='activa'` ✅ |
| catálogo de paseo | `["perro"]`, 5 filas activas ✅ |
| grants de columna de `mascotas` para `authenticated` | **13/13** ✅ |

**Nada se movió con S92.**

### LA CAUSA — dos `return` mudos, en la línea de al lado de la cura anterior

```ts
const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);   // ← arranca vacío
const estado = await getEstadoOnboardingDueno();
if (!vigente || !estado.ok || !estado.data.familia_id) return;    // ← muere callado
const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
if (!vigente || !r.ok) return;                                    // ← muere callado
```

Si cualquiera dispara, la lista queda en `[]` **para siempre y sin reintento**. Y
**el catálogo es público y rápido, así que llega ANTES**: con la fase ya en
`listo` y las mascotas en vuelo, `elegibles` es `[]` y la pantalla afirmaba *«tu
hogar no tiene un perro registrado»*. **Ésa es la explicación de «tocando
rápido»** que el founder reportó desde el primer minuto y que se leyó como
síntoma del catálogo.

**Es L-218 exacta, un piso más arriba:** se partió en tres fases el vacío del
CATÁLOGO y se dejó intacto el de las MASCOTAS. *Se curó el vacío que el P0
mostró, no la clase.* **Y la casa ya lo hacía bien al lado**: `paseo/index.tsx`
declara `MascotaResumen[] | 'cargando' | 'error'`.

### Lo curado, y lo que NO se tocó por medición

**Dos pantallas, no tres.** `paseo/disponibles.tsx` y `hogar/bitacora.tsx`
modelan ahora las tres fases, **dicen** el fallo y ofrecen **reintentar** (con su
contador, porque un botón que solo pone `cargando` y no vuelve a pedir es peor
que ningún botón). Voz nueva en es/en, **GATE PENDIENTE**, y **no culpa a las
mascotas**: *«Están bien: lo que falló es la conexión con tus datos, no ellas.»*

**`hogar/adiestramiento.tsx` NO se tocó**: se midió que ya registra el fallo por
rama (`sumarFallo`) y lo pinta. *Curar una pantalla sana es riesgo sin
beneficio* — el founder autorizó tres y la medición dijo dos.

### El guard (R34 brazo B), y los cuatro errores que costó afinarlo

Se declaran porque son el valor del brazo, no su ruido:
1. **v1: 31 rojos** en las dos apps. El número es real y va a deuda, pero **no
   puede ser el lint** — *un lint que enciende 31 de golpe se apaga*. Acotado a
   la familia donde el vacío se vuelve **una afirmación sobre el hogar**.
2. **v2: dos falsos positivos** (`ofertaPublica`, `vocabulario`) por marcar
   cualquier lista de un archivo que *mencionara* el lector.
3. **v3: otro falso positivo** por atar la lista a su fuente **solo por nombre** —
   `r` es universal, y un `.then((r) => …)` de otra pantalla se leía como el
   `await`. Curado con **proximidad** (15 líneas).
4. **v4, el que más enseña:** al probar el brazo **EN ROJO**, la auto-prueba no
   gritó «decorativo»… porque el fixture curado **seguía fallando por el motivo
   equivocado**: el regex exigía `setX('error')` literal y **no reconocía
   `setX(r.ok ? r.data : 'error')`, el patrón canónico de la casa**. *El guard
   habría marcado en rojo a la pantalla que lo hace bien.* Es L-216 en su forma:
   el cinturón se prueba en rojo **antes** de confiar en él.

**Estado: `verify:diseno` VERDE con 26 reglas**, brazo B con su rojo probado por
separado (EXTRAS_BRAZOS), typechecks verdes, paridad es↔en 4/4.

### ⚠️ LA VERIFICACIÓN VA **ROJA** — y así se declara (R5)

**No se escribió otro test que transcriba la pantalla: ése fue el error.** Lo que
se puede medir sin aparato está medido (backend, guard, typecheck); **lo que
decide si el P0 murió solo se ve en el aparato**, y hasta que el founder lo
corra esto **no está verde**.

**Y queda pendiente una pregunta que puede cambiar el diagnóstico:** `verify-ota`
avisó que hay **binarios huérfanos** (cliente en 1.0.0/1.0.1/1.0.2, y este lote
es runtime **1.0.3**). Si el aparato corre una APK anterior, **sigue con el
bundle viejo** y el bug persistiría con cualquier cura. Se resuelve mirando el
pie de Cuenta: **`update 019fe79c…`** (L-138 segunda enmienda).

---

## ⑬ EL SEGUNDO OTA — la cura del P0 reabierto (9-ago-2026)

Mismo runbook de siete pasos, sin saltar eslabones.

**⓪ VEDA declarada** — pista A única, `git status --porcelain` en **cero** y
`git worktree list` con los 12 worktrees de sesiones cerradas. Ventana abierta y
cerrada con el árbol verificado en los dos extremos.

**② PUSH ANTES DE BUNDLEAR** — `origin/main` estaba en `4777209c`; **un commit
pendiente**, declarado (`5c41613d`, la cura del P0 + R34 brazo B + L-220).
Pusheado, y **`origin/main` re-medido DESDE EL REMOTO**: `5c41613d` = `main`.

### ⑤ TRANSCRIPTO DEL OBJETO (`update:view` — `update:list` no expone el hash)

| | **CLIENTE** | **PRESTADOR** |
|---|---|---|
| **group** | `a93ca861-8c6f-489a-af87-92c22ac4cd5b` | `91ec6559-5d3e-4500-a457-22af97fe71ed` |
| **android** | `019fe7b9-9264-7b70-badf-2e6684d48872` | `019fe7ba-6614-7e82-b92a-3d0c5ada999a` |
| **ios** | `019fe7b9-9264-7c26-9508-557f6fb8a169` | `019fe7ba-6614-7f9b-9c61-f903bb77bc95` |
| **runtime** | **1.0.3** | **1.0.4** |
| **gitCommitHash** | `5c41613d9fd2fb6bb7c59fad1ca3c2c1e43fc34c` | `5c41613d9fd2fb6bb7c59fad1ca3c2c1e43fc34c` |

**⚠️ DECLARADO: esta tanda NO tocó código del prestador.** Su bundle no cambia
funcionalmente; se re-publicó **para que las dos apps queden ancladas al mismo
commit**, que es la disciplina que el canon ya aplicó en S91 (*el mismo ancla a
propósito*). Quien audite el prestador no debe buscar cambios: no los hay.

**④ VERIFICADO POR LO QUE SE SIRVE:** `verify-ota` **VERDE en las dos** — el
canal sirve el update publicado y existe build `finished` para su runtime. Su
aviso ③ (runtimes huérfanos) **sigue vigente y sigue importando**: cliente con
binarios en 1.0.0/1.0.1/1.0.2 y prestador también en 1.0.3, **ninguno recibe
este lote**.

**⑥ ASTERISCOS: CERO**, en los dos publishes — el script re-verificó después de
bundlear y confirmó que el ancla real es la verificada y el árbol no se movió.
*Se declara la ausencia porque `eas update:view` no expone el estado del árbol.*

---

## ⑭ P0-C · LA CAUSA ERA UN CARTEL QUE NADIE APAGABA

**El dato del aparato cerró lo que tres diagnósticos no pudieron.** La traza que
el founder fotografió mostró la pantalla **cargando bien y completa**:

```
 262ms · ◆ hook especies: RESUELVE ok=true · perro
 431ms · ② después · ok=true · 6 mascota(s)
        · ✔ setMascotas(lista)
2092ms · ✂ se limpia el efecto → vigente=false
   0ms · ▶ entra al efecto (focus)     ← y todo otra vez
```

**Nada colgado, nada fallando, nada lento** — y el modal ahí igual.

### La causa, en una línea

`setCatalogoNoLlego(faseEspecies.fase)` guardaba **una COPIA de la fase** en el
instante del toque, y **solo se limpiaba a mano**. Se tocaba a los ~100 ms con
la fase en `cargando`; el catálogo llegaba a los 262 ms y la fase pasaba a
`listo`, **pero la copia seguía diciendo `cargando` para siempre**. *El modal no
esperaba nada: mostraba una foto del pasado.* La pantalla de atrás estaba lista;
el cartel de adelante no se retiraba nunca. **Y lo escribí yo, en la cura
anterior.**

**Las cuatro preguntas del founder, contestadas:** ① el blur lo provoca **el
propio modal** (un `Modal` de RN toma el foco) — es consecuencia, no causa · ②
**no hay deps inestables ni remount**, y lo prueba la traza mejor que el código:
*las dos vueltas aparecen en la MISMA traza*, así que el estado sobrevivió · ③
el ciclo deja de importar para la cura · ④ el segundo ciclo **sí pinta**: lo que
no se va es el cartel.

### Las cuatro curas

**① El estado deja de ser copia y se DERIVA de la fase viva** — cuando el dato
llega, el modal se apaga solo, sin efecto que lo sincronice. *Un estado derivado
de otro estado es una copia, y toda copia diverge.*
**② El hogar no se vuelve a pedir si ya está** — solo en esta pantalla, por
orden del founder: *extenderlo a las otras siete se decide con la medición en la
mano, no por arrastre*, porque la disponibilidad de paseadores **sí** debe
re-pedirse y el hogar no.
**③ D-727 curada, con una enmienda que cambia el diagnóstico:** «Grooming para
Thor» **no fue copia-pega** — el comentario de al lado declaraba el reuso a
propósito (*«la misma voz del QUIÉN del grooming, Ley 17.3»*). **La decisión era
sana; el literal no**: lo compartible era la FORMA («X para {nombre}»), no el
texto, porque el texto nombra el oficio.
**④ El instrumento se queda** hasta que el founder cierre el gate (D-726).

### La señal transversal — D-728, medida y no supuesta

**25 pantallas del cliente** y **42 del prestador** usan `useFocusEffect`; **8
del cliente lo combinan con `<Hoja>`**. En `disponibles` el ciclo se vio porque
había un cartel colgado; **en las otras siete no se ve** — recargan, los datos
vuelven rápido, y *cargar todo dos o tres veces no se siente como un bug: se
siente como lentitud.*

Para confirmarlo se instrumentó **una segunda pantalla elegida a propósito**:
`hogar/mascota/[mascotaId]`, **la que el founder probó y declaró que «entra
bien»**. Cuenta cuántas veces pide todo y lo muestra al pie. **Si ese número
sube al abrir una hoja, la ficha pasa de hipótesis a hecho** y es el punto de
partida de la sesión de performance.

### ⇒ L-221, la lección de la sesión

*Todas las mediciones estaban bien; la pregunta estaba mal.* Se persiguió
lentitud, promesas colgadas, policies, RLS, grants y bucles de foco — **y cada
medición fue correcta**. La disciplina de no afirmar sin medir **cubre la
respuesta, no la pregunta**, y una medición impecable sobre la pregunta
equivocada **se siente como progreso**. Lo cortó **el dato del aparato**: ver la
pantalla cargada CON el modal encima cambió la pregunta de *«¿por qué no llega
el dato?»* a *«¿por qué sigue el cartel si el dato llegó?»*, y la causa apareció
en una línea.

---

## ⑮ EL P0 DEL PASEO, CERRADO — la cadena de seis hipótesis

**✅ GATE DEL FOUNDER, FIRMADO (9-ago, bundle `019fe7f4`):** los cuatro oficios
reservan **en el primer intento** y llegan a pago. El guard 2 ya no corta.

### La cadena completa — cinco medidas y descartadas, la sexta era la buena

*Se escribe entera y no resumida, porque la cadena ES la lección.*

| # | hipótesis | cómo se midió | veredicto |
|---|---|---|---|
| ① | **Lentitud** (la app «se siente lenta») | cronómetro por eslabón | **descartada**: base **11 ms**, red **200-650 ms** |
| ② | **RLS / policies / `is_admin()` volatile** | `EXPLAIN (ANALYZE, BUFFERS)` con los claims REALES del founder | **descartada**: 3.2 ms, `Bitmap Index Scan`, `shared hit=1`. El defecto de volatilidad **existe** (D-725) y **no era la causa** |
| ③ | **Grants por columna movidos por S92** | `has_column_privilege` sobre las 13 columnas | **descartada**: 13/13 intactos |
| ④ | **Promesa colgada** (`auth.getSession`, el `.then` sin `catch`) | sonda en cada `await` del hook | **descartada**: resolvía `ok=true` en 262 ms. *Pero destapó un `.then` sin rama de error —modo de falla mudo— que se curó igual* |
| ⑤ | **Bucle de foco / remount** | traza con las dos vueltas en el MISMO registro | **descartada como causa**: el estado sobrevivía ⇒ no había remount. *Pero destapó D-728* |
| ⑥ | **Estado copiado que no se sincroniza** → luego **CLOSURE OBSOLETO** | la traza mostró la pantalla **cargada** y el guard leyendo `cargando` | **✅ LA CAUSA** |

**Y fueron DOS causas encadenadas, no una:**
**(a) el modal-snapshot** — `setCatalogoNoLlego(fase)` guardaba una copia de la
fase en el instante del toque y **nadie la actualizaba**: el dato llegaba 262 ms
después y el cartel seguía diciendo «cargando» para siempre.
**(b) el closure obsoleto** — al sacar `alElegir` de las dependencias del efecto
del pedido *(mi optimización)*, ese efecto capturaba una versión de la función
donde `mascotas` todavía era `'cargando'`. **Datos presentes, semáforo en rojo.**

**Las dos las escribí yo, y las dos son la misma familia:** *un valor que se
lee desde una foto vieja*. La cura de (a) fue **derivar** el modal de la fase
viva; la de (b), el **ESPEJO VIVO** —refs que se pisan enteros en cada render y
que TODO guard consulta—. **Ninguna es un parche en el punto donde dolía**, que
es lo que el founder exigió: *mientras haya una lectura que pueda ser vieja,
esto vuelve.*

### Lo que se retiró y lo que se queda

**Retirado (D-726 ✅, su disparo era el gate):** la traza visible, sus 24 marcas,
la sonda del hook y el bloque de los dos modales. **Verificado: cero trazas
sueltas.**
**Se queda, porque es CURA:** el espejo vivo · el techo de espera de 8 s · las
tres fases de `mascotas` · los modales derivados · el `.catch` del hook · la
cura 2 (no re-pedir el hogar) · la key propia del paseo (D-727).
**Se queda a propósito y por recomendación:** el **contador del perfil**, para
que el founder corra **una** medición y cierre D-728 sin otro OTA.

### La lección, en acción

**L-221** dice que *todas las mediciones pueden estar bien y la pregunta estar
mal*. Esta cadena es su prueba: **seis hipótesis, cinco descartadas con datos
correctos**, y las tres que sí encontraron algo —el `.catch` mudo, D-725, D-728—
**no eran la causa pero eran defectos reales**. *Medir bien nunca es en vano; lo
que hay que corregir a tiempo es la pregunta.* Y lo que la corrigió **siempre**
fue el mismo instrumento: **un dato del aparato**.

---

## ⑯ LA LECCIÓN DE NEGOCIO DE LA JORNADA (founder, verbatim en su idea)

> **Medir bien no es en vano aunque la hipótesis caiga. Lo que sale caro es no
> corregir la pregunta a tiempo.**

**Y esta jornada lo probó de las dos maneras a la vez.** De las **seis**
hipótesis del P0-C, **cinco se descartaron** — y **tres de esas cinco
encontraron defectos reales que hoy tienen ficha propia**:

| hipótesis descartada | lo que encontró igual |
|---|---|
| promesa colgada en el hook | el **`.then` sin `catch`**: una promesa rechazada dejaba el catálogo en `cargando` **para siempre y en silencio**. Curado. |
| RLS / policies | **D-725** — `is_admin()` es `VOLATILE` y vive en **239 policies**: se re-evalúa por fila. Hoy cuesta 3 ms con 6 mascotas; **es defecto de escala** |
| bucle de foco | **D-728** — las pantallas **recargan todo al abrir una hoja**, y en 7 de 8 no se nota porque cargan rápido. **Es la punta del ovillo de «la app se siente lenta»** |

**Ninguno era la causa. Los tres eran defectos.** Sin esas mediciones —todas
sobre hipótesis equivocadas— **no existirían tres de las fichas más útiles del
día**, incluida la que le da punto de partida medido a la sesión de performance.

**El costo no estuvo en medir: estuvo en tardar en cambiar de pregunta.** Por
eso **L-221 se depositó con sus dos caras**: la que ordena cambiar de pregunta
tras tres verdes seguidos, y ésta, que impide leerla como «medir de menos».
*Quien la lea al revés va a terminar adivinando — que es justo lo que L-220
castiga.*

---

## ⑰ D-730 — DECISIÓN FIRMADA: LA FICHA VA A RESERVAR DE VERDAD

**Opción ① firmada por el founder: extraer el flujo de reserva a una pieza
compartida** —una fuente, dos consumidores—, **en SESIÓN PROPIA y no de
arrastre** (también firmado). **② descartada por el founder con su razón:** *un
estado que sobrevive a la navegación es la misma familia del bug de hoy.*

**El re-encuadre fue del founder y cambió la ficha entera:** el «preview» **es**
la ficha del prestador, y su botón **está en el lugar correcto** — el flujo que
él quiere es el que ya existe. **Lo que está mal es que la ficha no ejecuta la
reserva: se la delega a la lista.** *El paso final vive en el lugar equivocado, y
el parpadeo era solo cómo eso se filtraba a la vista.* La deuda dejó de ser de
navegación y pasó a ser de **arquitectura del flujo de reserva**.

**Y medir antes de costear corrigió dos cosas de la letra vigente:**
· **el flujo pesado es SOLO del paseo** — 9 Hojas contra 0/0/1 de los otros tres
oficios, que es exactamente por qué ellos reservan de una y el paseo no;
· **son CINCO Hojas de flujo, no tres** como declara `senal-reserva.ts`.
· Y el bloqueante que ninguna opción evita: **la ficha no recibe fecha, hora ni
duración**, que es lo que el hold necesita.

Los tres puntos de arranque quedaron escritos en la ficha, en orden.

---

## ⑱ EL CIERRE DE LAS VENTANAS — D-723, D-718+D-711, D-710 (9-ago)

**Orden del founder: no dejamos las ventanas nuevas.** Se ejecutaron las tres en
la misma sesión.

### D-723 ✅ — el tercer despachador, y la lección del censo

Mismo protocolo que sus hermanos: **primero el cron, después el deploy** (al
revés dejaba una ventana con el correo caído). El secreto **no se transcribió**:
se leyó del job ya curado y se re-inyectó dentro de la misma sentencia (R6).
**Verde doble:** la anon key pasó de **`200` + cola procesada** a **`401`**, y
los **cuatro ticks siguientes al deploy** salieron `succeeded` — *que la puerta
rebote al desconocido es la mitad; la otra es que el correo siga saliendo.*

> **⚠️ LA LECCIÓN, que el founder pidió explícita: se escapó del censo anterior
> porque se buscó por la propiedad equivocada.** D-713 buscó los despachadores
> por `verify_jwt: false` —las puertas obviamente abiertas— y **éste tiene
> `true`**, así que no apareció. **Y L-714 ya estaba escrita: la anon key ES un
> JWT válido**, o sea que `true` nunca protegió nada.
> ***Un censo que filtra por el atributo que no define el riesgo deja huecos que
> parecen cubiertos*** — y es peor que no censar, porque el resultado se lee
> como completo.

### D-718 + D-711 ✅ — la poda, con la red de seguridad primero

**7 ramas sin mergear, medidas archivo por archivo: 0 faltantes en `main`.** Lo
que difiere existe con versión más nueva — *mergearlas revertiría trabajo*
(L-217). **10 de 12 podados directo; dos frenaron** con «Directory not empty» y
**ahí se paró a mirar en vez de forzar**: tenían `node_modules` **y cuatro PNG
de S61**, que resultaron **versionados en `main`**. Recién entonces `--force`.

**`git worktree list` muestra solo el primario.** Las ramas siguen vivas.
**D-711 en el mismo acto:** `.env` con **`service_role` de 5 a 1** —la copia
legítima— y credenciales demo **de 16 a 0 fuera del primario**.

**Queda declarado:** los directorios físicos de `e-petplace-B` y `e-petplace-C`
siguen en disco (git los desregistró y no pudo borrarlos). **Ya no son
worktrees**; borrarlos es `rm -rf`, fuera de git, **y lo hace el founder**.

### D-710 ✅ en su residuo — y el hallazgo que valía más

**27 borrados, 91 → 64 objetos, y los 56 con dueño INTACTOS** (verificado en las
dos direcciones). **Y antes de borrar se midió de quién eran**, que es lo que
partió la decisión en dos: *decidir un borrado de documentos de identidad por su
peso en MB sería decidir por el número equivocado.*

**Los 56 restantes son de personas reales** —`satorilatam`,
`admin@e-petplace.com`, `dianavanessacharry`, cuentas del founder— **y ninguno
es de las 64 sondas**: el JOIN con `prestadores` dio **cero**, y la carpeta
resultó ser `user_id`, no `prestador_id`.

**⇒ NACE D-731 🔴, que es el verdadero hallazgo:** FK **`ON DELETE CASCADE`** +
policy que deja al prestador borrar su fila + **ninguna función que limpie
Storage** ⇒ **cada baja deja la cédula en el bucket para siempre**. *Un dato
personal que el sistema cree haber borrado y en realidad conserva: no se puede
usar y no está protegido por ninguna retención, porque para el producto ya no
existe.*

---

## ⑲ D-731 CURADA — LA FILA Y EL ARCHIVO SE VAN JUNTOS, Y EL ENSAYO DE FALLO ENCONTRÓ EL DEFECTO ADENTRO DE LA CURA

Orden del founder: *«Curá hoy. Que ninguna baja futura deje un documento de
identidad huérfano»*, con tres condiciones — verde doble, el patrón de los
despachadores para el brazo con credencial, y **un fallo que no se pierda**.

### ⓪ Lo primero: la ficha se equivocaba de mecanismo, y se corrigió antes de curar

D-731 nació atribuyéndose los 56 huérfanos. **Era falso.** El productor real
está escrito, con esas palabras, en el repo congelado
(`e-petplace-prestadores/src/lib/documentos.ts:61`):

> *«Upload puro (sin INSERT a prestador_documentos). Útil para el wizard donde
> prestador_id aún no existe.»*

El wizard sube el archivo **antes de que la fila pueda existir**; lo que se
abandona ahí queda. La huella lo confirma sola: los 22 de Satori son **4 tipos
con hasta 12 versiones del mismo tipo** — doce intentos, no un documento
perdido. **Y eso tumba la regla con la que el founder pensaba decidir los 56**
(*«si es prestador vigente, falta un documento»*): a Satori **no le falta
ninguno**; sus 4 filas están completas. ⇒ nace **D-733**, y los 56 pasan a
**D-732** con su lista servida.

*El defecto que la ficha describía sí existía y sí había que cerrarlo — pero
**nunca había disparado**. Se curó antes de su primera víctima.*

### ① La cura, y el límite duro que le dio la forma

**Postgres no puede borrar el blob.** El `DELETE` sobre `storage.objects` lo
rebota `storage.protect_delete` (`42501`) y, aun sin ese trigger, borrar la fila
dejaría el archivo vivo — *el huérfano al revés*. ⇒ el trigger **encola la
intención**; `barrer-storage` la ejecuta con credencial, por **el mismo camino
que los tres despachadores curados hoy**: cron cada 5 minutos + `x-despacho-secret`,
guard adentro (nunca `verify_jwt`, que **la anon key satisface**).

La cola nació **genérica** a propósito: D-733 alimenta la misma tabla y el mismo
barredor sin construir nada nuevo.

### ② 🔴 El ensayo de fallo salió 4/7 — y ese rojo vale más que los dos verdes

El camino feliz dio **10/10**. El ensayo escrito para fallar dio **4/7**: el
barredor marcaba `borrado` una intención que **jamás pudo ejecutar**. *La cura
tenía adentro exactamente el defecto que vino a curar.*

La causa, medida contra la API — no deducida:

```
DELETE /storage/v1/object/<bucket-inexistente>   →  200 []
POST   /storage/v1/object/list/<bucket-inexist>  →  200 []
```

**Las dos contestan con forma de éxito.** Un bucket que no existe y una carpeta
vacía son indistinguibles desde afuera ⇒ **ninguna lectura más cuidadosa de la
respuesta salvaba el caso: el dato no estaba en la respuesta.** Yo había escrito
una rama entera para distinguirlos, y era **inverificable por construcción**.

**La cura no fue interpretar mejor: fue volver el estado malo inexpresable** —
FK de `bucket` a `storage.buckets`, con su discriminador (el INSERT imposible
rebota). Segunda migración, **6/6**. ⇒ **L-222**.

### ③ El verde doble, con sus tres condiciones

| condición del founder | medición |
|---|---|
| la fila se va **Y** el objeto se va | objeto subido de verdad y verificado presente (R4) → fila borrada → encolada → **ausente del bucket**. **10/10** |
| el legítimo sigue viendo los suyos | **26 antes, 26 después** |
| un fallo no se pierde: reintenta y queda visible | **6/6** — la intención imposible **rebota en el INSERT**; en un bucket real la ausencia se resuelve honesta; con intentos>0 aparece en la vista; al techo pasa a `fallido` **y sigue visible** |

Y dos que no pidió pero valen: **la anon key del bundle → `401`**, y **tres
ticks REALES del cron `succeeded`** — *que una función responda cuando la llamo
yo no prueba que el reloj la esté llamando.*

**Declarado sin ejercitar, en vez de contado como verde:** las ramas
`api_remove` / `api_list` (API caída, credencial revocada, objeto que se niega a
irse) **no se pueden forzar desde afuera**, justamente porque la API contesta
200 a lo imposible.

### ④ La letra, donde el founder pidió que viviera

**`POLITICAS` P23 FIRMADA** — *qué significa «borrado» para un documento de
identidad*. Su párrafo central, que es el que no podía quedarse en un acta
técnica: el archivo **deja de ser alcanzable, no se sobrescribe** ⇒ ante un
derecho de supresión la respuesta honesta es *«ya no es accesible por ningún
medio del producto»*, **jamás «fue destruido»** — *prometer lo segundo sería una
promesa que el sistema no puede cumplir.* Y lo que P23 **no** resuelve, dicho:
**no hay plazo de retención escrito**, y sin esa letra borrar es una decisión
sin criterio y conservar también.

### ⑤ Operativo

**2 migraciones** (`20260809040000` cola+trigger+vista · `20260809050000` FK de
bucket), **las dos con cinturón y con discriminador** — no basta que el trigger
exista: la migración **borra una fila de verdad adentro de la transacción** y
exige que la intención aparezca. **Reversa escrita ANTES**, y su nota ① dice con
todas las letras que **revertir REABRE el agujero** y que **lo ya encolado se
pierde**. **1 edge function nueva** (`barrer-storage`, `--use-api`), **1 shared**
(`_shared/despacho.ts` — el guard en un solo lugar; los tres despachadores en
verde **no se tocaron**: reescribir código verde para unificarlo es riesgo sin
beneficio). **1 job de cron.** Residuo de los ensayos: **0**.

---

## ⑳ EL CIERRE DE LA JORNADA — lo que queda firme, lo que queda bloqueado, y lo que no se hereda

### Las tres decisiones del founder al cerrar

**① LOS 56 NO SE TOCAN, Y ES BLOQUEANTE — no pendiente.** Su razón, verbatim:
*«queda claro que a nadie le falta un documento y que la decisión depende de un
plazo de retención que no tengo escrito»*. **La distinción no es de tono:** un
pendiente se ejecuta cuando alguien tenga un rato; esto **no se puede ejecutar
en absoluto** hasta que exista la letra. *Cualquier sesión que abra D-732 y
decida borrar o conservar sin ese plazo está inventando el criterio.* Van a
legales **D-732** (los 56) y **D-733** (el wizard que sube antes de registrar),
por la misma llave: **la ventana de gracia del barredor no es un número técnico
que se elige — es el plazo de retención con otro nombre.**

**② D-728 ES EL PRIMER BLOQUE DE LA SESIÓN DE PERFORMANCE, Y ARRANCA
RE-INSTRUMENTANDO.** La sonda del perfil se publicó, **el founder nunca llegó a
leer su número**, y se retiró con el resto del instrumental. ⇒ la ficha **no
avanzó a hecho**: sigue siendo hipótesis fuerte con evidencia parcial. *Un
contador que nadie leyó no es un dato pendiente de lectura: es un dato que no
existe* — L-141 en su forma más simple. Su sesión reinstala **el instrumento
completo** (no solo el contador de focos: también el eslabón que tarda), sobre
dos pantallas como mínimo, y **lee en el aparato antes de tocar una línea de
cura**.

**③ D-730 VA A SESIÓN PROPIA**, con sus tres puntos de arranque ya escritos en
su ficha: el bloqueante previo, la corrección de la letra (**son cinco Hojas de
flujo, no tres**) y **la unidad a extraer es el flujo, no las Hojas** — *mover
las Hojas sin la lógica que decide abrirlas es exactamente el clon que hay que
evitar.*

### Lo que el founder ejecuta con su mano

Los dos directorios físicos, que ya **no son worktrees** (git los desregistró) y
**no guardan `service_role`** — verificado, la cuenta pasó de 5 a 1:

```
/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-B
/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-C
```

### El brief de S93 queda INTACTO

**La landing no hereda nada de hoy.** Ni D-732, ni D-733, ni D-728, ni D-730:
las cuatro tienen dueño y disparo propios, y ninguno es S93. *Un brief que se
llena con los restos de la sesión anterior deja de ser un norte y pasa a ser una
bandeja de entrada.* Seguridad se declara cerrada y S93 abre limpia.

### El saldo de la jornada, en una tabla

| | |
|---|---|
| **Curadas hoy** | D-713 · D-714 · D-716 (perillas servidas) · D-717 · D-719 (a/b/c) · D-720 · D-721 · D-722 · D-723 · D-724 · **D-731** · D-718+D-711 · D-710 en su residuo · el P0 del paseo |
| **Nacen y quedan** | D-725 · D-728 · D-729 · D-730 · **D-732** 🔒 · **D-733** 🔒 |
| **Lecciones** | L-218 · L-219 · L-220 · L-221 · **L-222** |
| **Migraciones** | 244 local = remoto, todas emparejadas |
| **Letra** | `POLITICAS` v1.11 (**P23**) |

**Y una cosa que conviene que quede dicha del método, porque se repitió tres
veces hoy y las tres veces pagó:** *el diagnóstico que se corrige a sí mismo
antes de curar vale más que el que acierta de una.* D-731 se atribuía un
mecanismo que no era; el P0 del paseo cambió de causa tres veces; y la propia
cura de D-731 tenía adentro el defecto que venía a curar. **Ninguna de las tres
la encontró la revisión del código: las encontró medir el objeto y escribir un
ensayo para fallar.**
