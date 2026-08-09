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
