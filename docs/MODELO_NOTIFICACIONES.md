# MODELO_NOTIFICACIONES — El motor de alcanzar a alguien

> **Versión: v1 — S87 (4 Ago 2026). ENMENDADO CONTRA LO VIVO.** La v0 se
> escribió sobre un mundo que se supuso vacío; **el censo de S87 midió que no lo
> estaba**. Lo que cambia está en **§0bis** (lo medido) y marcado `ENMIENDA S87`
> donde toca. **Nada del diseño se cayó: lo que se cayó fue la premisa de que no
> había nada construido — y eso reordena el trabajo, no lo reescribe.**
>
> **Versión previa: v0 SEMILLA — S73 (21 Jul 2026). SIN FECHA DE CONSTRUCCIÓN;
> disparos en §13.** Escrito por la mesa como deuda declarada de S73.
> **Contrastes obligatorios:** `MODELO_PRODUCTO` §8 (éticos no
> negociables), `MODELO_LOYALTY` §7 (el patrón de límites en piedra y el
> apagado estructural por momento vital — este doc lo HEREDA, no lo
> reinventa), `MODELO_FINANCIERO` (se lee ANTES de que exista cualquier
> número de costo por mensaje), `LETRA_EQUIPO`/`PORTAL_PRESTADOR` (la
> resolución de destinatarios cuelga del ROL), `POLITICAS_EPETPLACE` P5
> (menores) y P11 (cero distorsión clínica), `MODELO_PRESENCIA` §4 (el
> muro verificado/declarado).
> **Estado del mundo al escribirse:** D-475 🔴 — las tres capas en CERO;
> el vet no puede tocar al dueño por ningún canal. `realtime` NO es este
> doc (la app abierta actualizándose sola es otro trabajo).
> **EVIDENCIA S74 (censo literal, D-508):** *cero productor de email en
> TODO el stack* — las 3 edge functions son walkin/nota-clínica/vacuna, y
> `resend|sendgrid|nodemailer|smtp|inviteUserByEmail|sendEmail|mailer`
> devuelve **cero hits** en monorepo y `supabase/`. El único email que el
> sistema manda es el de Supabase Auth (signup/reset). Lo que en S73 era
> "diseñado y no construido" quedó **PROBADO en campo**: la invitación de
> equipo del founder no llegó **porque nunca hubo envío** — y la superficie
> decía "enviar" (L-139 en la cara del usuario).
> **CONSUMIDOR DECLARADO S74 — la notificación de OBSERVACIÓN del CUIDADO
> ESPECIAL** (`LETRA_CUIDADO_ESPECIAL_S74` §7.1, FIRMADA): cuando alguien
> observa un cuidado especial, **el dueño debe conocerlo** con voz neutra,
> sin alarma y **sin camino ofrecido** (el camino es de la escalada, §7.2).
> **Es un consumidor de las capas 1–3 de este doc — no puede existir antes
> que ellas**, y se declara acá para que no se descubra en campo.

---

## 0bis. LO MEDIDO — el censo de S87 contra la DB viva *(ENMIENDA S87)*

> **Acta completa con su literal:
> `docs/relevamientos/2026-08-04-s87a-censo-notificaciones-contra-lo-vivo.md`.**
> Acá va lo que cambia decisiones; el detalle no se copia, se referencia.

### ⚠️ LA PREMISA MADRE DE LA v0 ERA FALSA

La v0 decía *"D-475 🔴 — las tres capas en CERO"*. **No están en cero: están
construidas a medias, sin gates y sin transporte.**

| capa (§2) | lo que se midió |
|---|---|
| ① **INTENCIÓN** | **EXISTE A MEDIAS Y SIN GATES.** **Siete funciones DEFINER vivas** insertan en `notificaciones`: `_notificar_dueño_prestador` · `_trg_completar_pendiente_registro` · `cerrar_y_renovar_planes` · `cleanup_pendientes_vencidos` · `fijar_fecha_procedimiento` · `vencer_paquetes_salidas` · `vencer_programas_adiestramiento`. **Ninguna consulta ninguno de los cinco gates de §5.** |
| ② **DESTINATARIO** | **PARCIAL.** `notificaciones.rol_destino` es `text` NOT NULL **sin catálogo**; no cuelga de `empleado_tiene_rol`. |
| ③ **CONSENTIMIENTO** | **EXISTE MAL** — ver §6 `ENMIENDA S87`. |
| ④ **TRANSPORTE** | **CERO, y sin vehículo:** `pg_net` **no está instalada** ⇒ la DB no puede hacer una llamada saliente. |

**26 filas en `notificaciones`. En la era monorepo, TODAS `canal='in_app'`,
`enviada=false`, `enviada_en` NULL.** Las `enviada=true`/`push` son del
**2026-05-02**, legado del portal viejo. **`push_tokens`: 0 filas y CERO
funciones la tocan.** **Y cero consumidores:** `from('notificaciones')` sigue en
**0 hits** en `apps/` y `packages/`.

> ### ⇒ EL SISTEMA YA ESTÁ EN UN MODO SOMBRA — PERO ACCIDENTAL.
> **Escribe intenciones que nadie lee ni entrega.** Es el §10.2 de este doc
> ocurriendo sin haber sido declarado y sin que nadie mire el registro.
> **La diferencia entre esto y el modo sombra del §10.2 no es técnica: es que
> nadie lo sabía.**
>
> ### Y LA CONSECUENCIA QUE ORDENA EL TRABAJO:
> **si se conecta un transporte a lo que YA está escrito, sale sin un solo gate.**
> Memorial, menores, rol, consentimiento y techo **no se consultan hoy**.
> **⇒ Los gates de §5 y la cura de §6 son PRECONDICIÓN del motor, no trabajo que
> lo acompaña.** *(Adjudicado por el founder, S87.)*

### LO QUE SIGUE CIERTO, y conviene decirlo

- **§4 la ley de la pantalla bloqueada** — intacta, y **hoy no la viola nadie
  porque nadie envía**. Se aplica **antes** del primer envío.
- **§7 push primero / email segundo** — ratificado: **cero productor de email en
  todo el stack** (D-508 re-corrida en S87: 2 hits, ninguno productor).
- **§13 *"el schema: se releva lo vivo antes — verificar, no asumir"*** — **es la
  línea que salvó al doc. Cobró hoy.**

### LO QUE CADUCÓ

- **"las tres capas en CERO"** (encabezado v0 + D-475). *La cita de S72 sigue
  siendo verdadera sobre el CONSUMO; lo que caducó es leer cero consumo como
  cero motor.*
- **"D-137 confirmada en CERO"** — hay filas `vacuna_vencida` y
  `cita_recordatorio` (legado). El productor sigue sin existir; **el dato no**.
- **§14 "capas 1-3 disparan con S74/S75"** — no dispararon. **Trece sesiones.**
- **§7 "un token muerto se retira"** — presupone tokens. **No hay ninguno.**

### LO QUE NO EXISTE, nombrado

Transporte entero · los **cinco gates de §5** · el **catálogo de categorías de
§3** (`tipo` es `text` libre con CHECK `length > 0`) · la **unidad (persona,
categoría, canal) de §6** · idempotencia · kill switch · techo duro · auditoría
de entrega · **`notificar_reasignacion_cita(uuid,uuid)`** (medido `null`; el
trigger `trg_prestadores_gate_vitrina` la busca con `to_regprocedure` y
**construirla abre el gate sola** — L-171) · **los módulos nativos de push en el
binario** ⇒ **una build**.

### 🔴 EL BINARIO NO PUEDE RECIBIR PUSH — y ordena todo el arco

El guard de D-574 contra el APK **1.0.3** del prestador (`versionName`
confirmado por `aapt2`): **✗ falta `google_app_id` · ✗ falta el listener
`MESSAGING_EVENT`**. Sin `POST_NOTIFICATIONS`, sin `firebase-messaging`.

**La cronología lo explica y es L-196 en su forma limpia:** el APK se construyó
**Jul 28 18:07**; `expo-notifications` entró **Jul 29** (`35f3f4a`) y los
`google-services.json` **Jul 29** (`9d040fe`). **El binario es ~17 h ANTERIOR a
la preparación entera.**

**Trampa medida aparte:** `app.config.ts` pone `googleServicesFile`
**condicional** a `process.env.GOOGLE_SERVICES_JSON` ⇒ **una build sin esa env
var sale sin FCM y en silencio.** *El guard existe exactamente para eso; correrlo
es obligatorio en el tren.*

**Firebase:** proyecto `e-petplace-7854e`, los dos json existen y son coherentes.
**NO medible desde el repo, y no se da por hecho:** la llave FCM V1 en EAS y la
env var de archivo.

> **⇒ PUSH EXIGE BUILD NATIVA. Propuesta de mesa registrada: la build de push
> corta runtime nuevo, con el bump en el MISMO rango que la build, jamás antes**
> (hoy `runtime 1.0.2` nombra dos conjuntos nativos distintos entre las apps).

### El correo de recuperación — **la config NO está en el repo** *(§10bis ④)*

`resetPasswordForEmail(input.email.trim())` **sin `redirectTo`**, y **cero**
`redirectTo`/`emailRedirectTo` en todo el monorepo. `supabase/config.toml` es la
plantilla **local** del CLI (`site_url = "http://127.0.0.1:3000"`) y **no
gobierna el proyecto remoto**. ⇒ **el destino lo pone el Site URL del dashboard.**

> **La cura son DOS piezas, no una:** el Site URL del proyecto **y** un
> `redirectTo` explícito en el wrapper. *Hoy el producto no declara su propio
> destino — si alguien "arregla el correo" tocando el repo, no mueve nada.*

### La corriente de §2 — **no es una corriente**

El sedimento es **`eventos_mascota` (188 filas)**; sus **5 triggers**
(`auto_log_atencion` · `procedencia_clinica` · `propagar_estado_vida` ·
`update_ultimo` · `validar_profundidad`) **no producen intención**, y la tabla
**no está** en la publicación `supabase_realtime` (`notificaciones` sí — al revés
de lo que el motor necesita). **⇒ el enganche se fabrica.**

---

## 0. Qué es este doc y qué NO es

**ES** el motor: cómo nace una intención de avisar, quién la recibe, qué
la apaga, por qué canal sale y qué la vuelve segura.

**NO ES** el catálogo de los verticales que no existen. Despensa/sellers,
refugios y criaderos entran en §11 como **FORMA** (qué le exigen
estructuralmente al motor), jamás como contenido inventado. La regla de
la casa rige sobre la mesa primero: **L-141 — relevar lo vivo, jamás
inventar.** Cuando un vertical nazca, escribe SU catálogo contra este
motor; si el motor está bien, no lo toca.

## 1. La tesis — un motor, N verticales

El eje NO es el vertical. Es siempre el mismo: **un HECHO ocurre → alguien
tiene derecho e interés en saberlo → algo puede apagarlo → un canal lo
lleva.** Un pedido despachado, una cita confirmada, una solicitud de
adopción respondida y una camada disponible son el MISMO objeto con
distinto contenido. El vertical aporta hechos y voz; jamás arquitectura.

Corolario de gobierno: **ningún vertical construye su propio motor de
avisos.** Dos motores de notificación en la misma casa está prohibido —
misma regla de unicidad que `MODELO_LOYALTY`.

## 2. Las cuatro capas (separables, y esa es la clave)

1. **INTENCIÓN** — el hecho del dominio se convierte en intención de
   avisar. Nace de la MISMA corriente de eventos que alimenta la Línea de
   Vida, el loyalty y las alertas: **el sedimento ES la señal**. Cero
   polling, cero lógica en pantallas.
2. **DESTINATARIO** — quién tiene derecho e interés. Cuelga del ROL
   (`empleado_tiene_rol`, la puerta única de S73): la recepción no recibe
   avisos clínicos, el profesional sí. Del lado familia, del vínculo de
   acceso a la mascota. **Sin esta capa, el motor filtra por push lo que
   la RLS cerró.**
3. **CONSENTIMIENTO** — §6.
4. **TRANSPORTE** — §7. Es la capa MÁS reemplazable y la única con
   dependencia externa; por eso vive última y aislada.

Las capas 1–3 se construyen y se prueban SIN ningún transporte
conectado (modo sombra, §10). El día que Meta responda, se enchufa un
transporte a un motor ya probado.

## 3. Las categorías — alineadas a la taxonomía que Meta fiscaliza y cobra

| Categoría | Qué es | Meta | Apagable |
|---|---|---|---|
| `seguridad_cuenta` | acceso, cambios de credencial | authentication | **NO** (canal sí elegible) |
| `salud_seguridad` | urgencia, alerta de la mascota, retiro de lote | utility | **NO** (canal sí elegible) |
| `operacion` | cita, servicio, pedido, autorización | utility | sí, por canal |
| `relacional` | mensajes, respuesta a una solicitud | utility | sí, por canal |
| `resumen` | digests (§8) | utility | sí, opt-in |
| `comercial` | promos, ofertas, novedades | **marketing** | sí — **OPT-IN, apagado por defecto** |
| `saldo_pagado` *(**FIRMADA por el founder, 4-ago-2026** — nació S80)* | saldo pagado que vence: paquetes, planes (el aviso de P16(e)) | utility | **NO en existencia** — sí en canal |

Dos categorías **no se apagan** porque su ausencia daña a la mascota o a
la cuenta — pero **el canal siempre se elige**: nadie está obligado a
recibir una urgencia por WhatsApp. Nunca se puede desactivar el aviso; sí
por dónde llega.

> **ENMIENDA S80 (a la firma del founder):** nace `saldo_pagado` y el
> porqué de la columna "Apagable" se AMPLÍA: *"su ausencia daña a la
> mascota, a la cuenta **O AL DINERO YA PAGADO**"*. Un aviso de
> vencimiento de saldo que el usuario pudo apagar convierte el breakage
> en emboscada. Cadencia de ESTADO, no de calendario (saldo cero, cero
> mensajes); jamás viaja con `comercial`. Gemelas: P16(e) enmendada
> S80 + `MODELO_FINANCIERO` Decisión T.

`comercial` **jamás viaja en el mismo mensaje** que otra categoría. Un
recordatorio de vacuna con un cupón adentro es P11 roto: la alerta existe
por la mascota, no por el cupón.

### ENMIENDA S87 — LAS CATEGORÍAS NO EXISTEN EN EL SCHEMA, y por eso los defectos

**Medido — y con una corrección al propio censo, hecha al construir (S87):**

| tabla | su CHECK | lectura |
|---|---|---|
| `notificaciones.tipo` | **CHECK cerrado de 26 valores** | vocabulario **CERRADO**, sin categoría |
| `user_notificacion_prefs.tipo` | `length(btrim(tipo)) > 0` | vocabulario **ABIERTO** |

> **⚠️ CORRECCIÓN AL CENSO.** La primera redacción de esta enmienda decía que
> **las dos** eran vocabulario abierto. **Es falso para `notificaciones`**, que
> tiene un CHECK cerrado de 26 valores. *El hallazgo de D era correcto y era
> sobre `user_notificacion_prefs`; la generalización a las dos tablas fue mía.*
> **La corrección no salva el diseño — lo agranda:** el catálogo tiene que cubrir
> **26 tipos**, no 10.

**Lo que NO cambia, y es lo que importa:** **las siete categorías no existen en
ninguna parte del schema.** *Un vocabulario cerrado sin categoría no sirve más
que uno abierto para lo que los gates necesitan preguntar* — un CHECK dice qué
valores se admiten, jamás qué son. **10 tipos con filas vivas; la superficie
cubre 5.**

> **⇒ EL CATÁLOGO DE TIPOS → CATEGORÍA ES LA PRIMERA PIEZA DEL LOTE, y no por
> prolijidad: es lo que los gates estructurales de §5 CONSUMEN.** *Sin él, §5 no
> se puede escribir — un gate no puede preguntar "¿esta categoría es apagable?"
> si la categoría no es un dato.*

**Mapeo firmado de los tipos vivos** *(las tres dudas que D declaró, resueltas
acá — es lo que una enmienda existe para hacer)*:

| tipo vivo | categoría | por qué |
|---|---|---|
| `cita_confirmada` · `cita_recordatorio` · `cita_completada` · `alta_asistida_completada_por_cliente` · `pedido_estado` | `operacion` | son el estado de algo que la persona contrató |
| `vacuna_vencida` | **`salud_seguridad`** | es sobre el cuerpo de la mascota, no sobre una transacción |
| `promocion` | **`comercial`** | y por lo tanto **OPT-IN, apagado por defecto** |
| `documento_aprobado` · `prestador_aprobado` | **`operacion`** | *duda de D resuelta:* son el resultado de un trámite que el prestador **inició** — `relacional` es respuesta de una persona a otra, esto es estado de un proceso propio |
| `sistema` | **`seguridad_cuenta`** | *duda de D resuelta:* es de la persona-cuenta, no de la mascota — **y es la categoría que sobrevive al memorial (§5.1)**, así que clasificarla mal sería silenciar avisos de cuenta en el peor momento |

> **El criterio que deja el mapeo, para el tipo N+1:** **la categoría la decide de
> QUIÉN es el hecho** (la cuenta · el cuerpo de la mascota · el proceso
> contratado · otra persona · el negocio), **jamás quién lo mira**. *Dos avisos
> del lado prestador pueden ser de categorías distintas; que compartan audiencia
> no los hermana.*

## 4. LA LEY DE LA PANTALLA BLOQUEADA (en piedra)

**Toda notificación se lee sin desbloquear el teléfono, por cualquiera que
lo levante.** Por lo tanto:

- **El contenido de una notificación es SIEMPRE seguro para una pantalla
  bloqueada.** Jamás diagnóstico, resultado, medicación, condición ni dato
  clínico en el cuerpo del mensaje.
- Correcto: *"Thor tiene una actualización en su expediente."* Prohibido:
  *"Resultado positivo de parvovirus."*
- El dato vive **detrás de la puerta autenticada**; la notificación es la
  campana, jamás el contenido.
- Vale para las tres capas de transporte — y con más fuerza en WhatsApp y
  email, que además quedan escritos en dispositivos y servidores ajenos.
- Extensión: tampoco datos de identidad sensibles de terceros (dirección
  de un dueño hacia un prestador, teléfono, etc.).

Un motor que no nace con esta ley filtra historia clínica por la pantalla
de bloqueo, y eso no se cura después.

## 5. Los gates estructurales — se evalúan ANTES de cualquier regla

En este orden, y el motor consulta cada uno **antes** de decidir nada
(patrón `MODELO_LOYALTY` §7.1: el apagado es estructural, jamás filtro de
UI):

1. **MOMENTO VITAL.** Memorial apaga TODO: cero recordatorios, cero
   hitos, cero comercial, cero resumen. El silencio es parte del respeto.
   Único sobreviviente posible: `seguridad_cuenta` (es de la persona, no
   de la mascota). **Regla de la transición:** al entrar en memorial, toda
   intención ya encolada y no enviada MUERE — la cola se purga. Un
   recordatorio de vacuna que llega el día después es la peor falla
   imaginable de este producto.
   > **Candidata S87 — la excepción INVITADA:** el «Homenaje» de §13bis ① es la
   > única puerta contemplada a este silencio, y **solo abre con opt-in
   > explícito de la familia**. No rige: es letra a diseñar.
2. **MENORES (P5).** Un evento con `aportado_por_menor` no genera
   intención. Ninguna notificación se dirige a un menor.
3. **ROL Y ACCESO** (§2 capa 2).
4. **CONSENTIMIENTO** (§6).
5. **TECHO DE FRECUENCIA** (§8).

### ENMIENDA S87 — CÓMO SE ESCRIBEN LOS GATES 1 Y 2 CONTRA LO VIVO

**Medido al construir, y corrige lo que este §5 deja suponer:**

- **`memorial` NO ES UN VALOR.** `mascotas.estado_vida` tiene
  `CHECK (activa | perdida | fallecida)`. **El producto ya define memorial como
  `estado_vida <> 'activa'`** — literal vivo en `adiestramiento-antes.ts:195` y
  `grooming-atencion.ts:397`. ⇒ **el gate 1 se escribe
  `estado_vida IS DISTINCT FROM 'activa'`**, y con eso **`perdida` queda adentro
  del silencio**, que es lo correcto: *a una familia que perdió a su mascota
  tampoco se le manda un recordatorio de vacuna.*
  > **Si el gate se hubiera escrito contra `= 'memorial'` habría corrido verde y
  > no habría apagado nada** — la letra muerta silenciosa que L-192 nombra.
  > **Hoy las mascotas vivas son todas `activa`: el gate no tendría a quién
  > cortar, y el fixture tiene que FABRICAR el caso** (L-199).
- **`aportado_por_menor` vive en UNA sola tabla: `evento_bitacora_familia`.** No
  es una propiedad del evento genérico. ⇒ el gate 2 resuelve **por el evento
  origen**, y para los tipos cuyo origen no es la bitácora **el gate no aplica y
  se dice** — jamás se finge que evaluó.

## 6. El consentimiento — por (categoría × canal), con evidencia

- La unidad es **(persona, categoría, canal)**. Ni global, ni por canal
  solo: "quiero las citas por push pero no por WhatsApp" es una frase
  legítima y el modelo tiene que poder decirla.
- **Defaults:** `push` ON para las no apagables y para `operacion`;
  `email` ON solo para `operacion` con valor de constancia (comprobantes)
  y `seguridad_cuenta`; **`comercial` OFF en todos los canales**;
  WhatsApp **OFF en todo** hasta opt-in explícito.
- **WhatsApp exige opt-in con EVIDENCIA** (requisito de Meta, no gusto
  nuestro): se guarda quién, cuándo, por qué método y **el texto exacto
  que se le mostró**. Sin ese registro, el canal no se puede usar sin
  riesgo de bloqueo del número.
- **La baja es tan fácil como el alta** y se honra en el acto. Toda
  notificación `comercial` porta su salida.
- **La superficie de Ajustes** (las dos apps, y las que vengan): una
  pantalla, categorías como filas, canales como columnas. Voz honesta —
  se dice qué NO se puede apagar y **por qué**, jamás un toggle muerto que
  el usuario toca y no obedece (Ley 23: la puerta no ofrece lo que va a
  rechazar).

### ENMIENDA S87 — LOS TRES CHOQUES DEL CONTRATO VIVO

**El contrato B4 vivo** (`user_notificacion_prefs` + `wrappers/preferencias.ts`)
**no puede expresar lo que esta sección exige, y mientras tanto hace dos cosas
incorrectas en silencio.** Los tres van **EN** el lote del motor, no detrás.

**① LA UNIDAD ES INEXPRESABLE.** La PK es **`(user_id, tipo)`** — **sin canal**.
*"Quiero las citas por push pero no por WhatsApp"* —la frase que esta misma
sección declara legítima— **no se puede guardar.** El wrapper la espeja:
`guardarPreferenciaNotificacion(tipos[], habilitada)` **tampoco tiene canal**.
⇒ **migración + ensanche de contrato, puerta única, en el mismo lote.**

**② `promocion` NACE ENCENDIDA.** El contrato vivo es *"fila ausente =
habilitada"* **sin distinguir categoría** ⇒ lo `comercial` está ON por defecto,
contra §3, contra este §6 y contra §12.3.

**③ `vacuna_vencida` SE PUEDE APAGAR.** La superficie escribe `habilitada=false`
sobre una categoría que §3 declara **no apagable**.

> ### LOS DOS DEFECTOS SON SIMÉTRICOS, y por eso son el mismo defecto
> **Uno enciende lo que debe nacer apagado; el otro apaga lo que no se puede
> apagar. Los dos sobreviven porque el contrato no sabe qué es una categoría.**
> *No son dos bugs: son dos caras de la ausencia de §3 en el schema.*
>
> **Y son de la clase D-654: código que funciona y hace lo incorrecto en
> silencio.** Ningún typecheck, lint ni gate los ve — **producen salidas
> creíbles**. ⇒ **encender el motor sin curarlos ENCIENDE EL DEFECTO.**

### LA LETRA DE SALUD — FIRMADA POR EL FOUNDER (S87)

> ## **«Elige por dónde le llegan, no si le llegan.»**

Es la forma corta de la regla de §3 para `salud_seguridad` y `seguridad_cuenta`,
y **resuelve el ③ sin ambigüedad**: el apagado de **EXISTENCIA** no se ofrece; el
de **CANAL**, siempre.

**Se honra en DOS lugares, y hacen falta los dos** *(la lección de D-654: una
autorización que decide el cliente es decorativa)*:

1. **En el motor** — el contrato **no acepta** `habilitada=false` sobre una
   categoría no apagable. Rebota **hablado**, con código estable.
2. **En la superficie** — esa fila **no dibuja** el toggle de existencia; dibuja
   los de canal, y **dice por qué** (Ley 23: la puerta no ofrece lo que va a
   rechazar).

*Solo el ① sería un motor que se defiende de su propia pantalla; solo el ② sería
una promesa que cualquier caller rompe.*

## 7. Los transportes — y sus verdades incómodas

> ### ⚖️ LA LEY DEL VOCABULARIO — «push» JAMÁS EN SUPERFICIE (FIRMADA founder, 6-ago-2026 · S89)
>
> **«Push» es vocabulario de ingeniería y no aparece en NINGUNA superficie de
> NINGUNA de las dos apps** — ni en voces, ni en preferencias, ni en rebotes,
> ni en la lámina. La persona lee «avisos en el teléfono» (el par vivo de
> Preferencias); el permiso del SO se pide y se explica sin la palabra.
> Extiende a AMBAS apps lo que el lote de D ya midió en el cliente
> (`notifPermisoNegado` sin «push»); **el grep de barrido lo deposita C** y
> el guard que lo mecanice hereda esta letra. Y la letra hermana de la
> lámina (misma firma): el permiso se pide **al primer arranque
> post-install/update, con consentimiento siempre** — el tren nativo la carga.

**PUSH** — gratis, instantáneo, el primero de la fila. Las tres capas de
D-475 en cero. Verdad operativa: si el usuario negó el permiso del SO, el
motor **tiene que saberlo** y no contarlo como entregado (null honesto,
L-139); un token muerto se retira, no se reintenta para siempre.

**EMAIL** — barato, sin aprobación externa, y es **el canal de
CONSTANCIA**: comprobantes, resúmenes, todo lo que se guarda. Verdad
operativa: la entregabilidad se gana (SPF/DKIM/DMARC + dominio propio) y
se pierde de golpe; nunca se mezcla el correo transaccional con el
comercial en el mismo dominio de envío.

**WHATSAPP** — el que el founder quiere por paridad competitiva
(decisión S73), y el más caro en todo sentido:
- Fuera de la ventana de servicio solo viajan **plantillas
  pre-aprobadas** por Meta — o sea: **cada mensaje que queramos mandar hay
  que diseñarlo y aprobarlo antes**, con días de calendario.
- **Ecuador cuesta ~17× Colombia** en *utility* (Ecuador cae en "resto de
  Latinoamérica"; Colombia tiene tarifa propia, de las más bajas de la
  región). e-PetPlace lanza en Ecuador: el mercado caro es el primero.
- **Desde el 1-oct-2026 los mensajes de servicio se cobran**, y las
  plantillas *utility* dentro de una ventana abierta también. Toda cuenta
  apoyada en "la ventana es gratis" tiene fecha de vencimiento.
- Meta actualiza sus rate cards **por trimestre**: todo número entra a
  `MODELO_FINANCIERO` **con fecha** y con revisión trimestral agendada.

**Regla de selección de canal:** el motor elige por (criticidad temporal
de la categoría × consentimiento × disponibilidad del canal), con **cadena
de respaldo declarada** y una sola entrega por intención. **Prohibido el
disparo múltiple**: el mismo aviso por tres canales es ruido, y en
WhatsApp además es plata.

> **ENMIENDA §7 FIRMADA (founder, S88 — nacida del gate del primer envío):**
> **el canal elegido es el primero habilitado CON TRANSPORTE VIVO.** La
> «disponibilidad del canal» dejó de ser prosa: es la columna
> `transporte_vivo` del catálogo de canales. *Antes la selección elegía push a
> ciegas —push no tiene transporte— y la intención quedaba encolada esperando
> un tren que no existe.* El día que la build de push llegue, push vuelve a
> ganar **con el UPDATE de una fila**, sin tocar la puerta. Par probado:
> push sin tren → email · push con tren → push · sin trenes → `in_app` (el
> piso: jamás se pierde).

## 8. Volumen — el problema que traen los sellers

Un prestador con 5 citas al día y un seller con 200 pedidos no pueden
compartir régimen.

- **Techo por persona y ventana**, configurable por categoría.
- **Digest** (`resumen`) obligatorio donde el volumen lo exija: 200 avisos
  se vuelven uno. La categoría existe desde el día uno justamente para que
  el vertical de despensa no obligue a rediseñar.
- **Colapso por entidad**: tres cambios sobre el mismo pedido en cinco
  minutos son UNA notificación, la última.
- **Ventana de silencio** por persona (horario), con excepción explícita
  de `salud_seguridad` y `seguridad_cuenta`.

## 9. La voz — quién habla

**Habla e-PetPlace, y NOMBRA al actor.** *"Aurora confirmó la cita de
Thor."* Jamás el negocio enviando como sí mismo por nuestro canal — es la
puerta por donde entra el spam y por donde se pierde la confianza del
dueño en el canal entero. La presencia del prestador vive en la app
(`MODELO_PRESENCIA`), no en la bandeja del dueño.

Voz: tuteo neutro (L-148), **bilingüe de nacimiento** — es+en desde la
primera plantilla, incluidas las de WhatsApp (que se aprueban por idioma:
si nace en uno solo, se aprueba dos veces).

## 10. Seguridad operativa — porque un push NO se puede deshacer

Esta sección existe porque el modo de falla de este motor es
irreversible y público.

1. **Idempotencia:** una intención = una entrega, con clave de deduplicado
   y referencia al evento que la disparó. Un reintento jamás duplica.
2. **MODO SOMBRA obligatorio:** todo tipo de notificación nuevo corre
   primero **sin enviar**, registrando qué HABRÍA mandado y a quién,
   durante una ventana declarada. El primer envío real de un tipo nuevo es
   **gate del founder**, siempre.
3. **Kill switch** por categoría y global, sin deploy.
4. **Techo duro de seguridad** independiente de la configuración: un bug
   no puede mandar 10.000 mensajes.
5. **Cero destinatarios reales en no-producción.** Nunca.
6. **Auditoría:** toda entrega deja rastro (a quién, qué categoría, qué
   canal, qué evento la disparó, resultado). Sin esto no se puede
   responder "¿por qué me llegó esto?", que es la pregunta que siempre
   llega.

## 10bis. LO QUE S85 LE DEJÓ COMO PRECONDICIÓN — cuatro consumidores que ESPERAN este motor

> **Se deposita acá, en el doc del motor, y no en cada ficha suelta: son cuatro
> piezas construidas o firmadas que NO PUEDEN FUNCIONAR hasta que este arco
> exista.** *Una precondición escrita en cuatro lugares distintos no se lee como
> una precondición: se lee como cuatro pendientes sin relación.*

| # | quién espera | qué le falta | estado |
|---|---|---|---|
| ① | **el permiso del dueño sobre el expediente clínico** (`BIO_EXPEDIENTE` A3.5bis-b, **salida (c) FIRMADA**: *el vet tratante SOLICITA al pet parent*) | **el canal para pedirlo** | **LETRA SIN MOTOR** |
| ② | **el aviso de reasignación de cita** (`notificar_reasignacion_cita`) | la función **no existe** | **abre el gate de la VITRINA por diseño** — el trigger la busca y se abre solo |
| ③ | **la alerta al admin por documentos** | ningún canal avisa que hay un documento esperando veredicto | el ciclo de admin existe; **el aviso no** |
| ④ | **el correo de recuperar contraseña** | **HOY LLEVA AL PORTAL VIEJO** | *la recuperación por código funciona; el correo apunta a otro lado* |

> ### ⚠️ EL ② MERECE SU LÍNEA, porque no es una tarea más
> **`notificar_reasignacion_cita` no es «un aviso»: es la LLAVE MECÁNICA del gate
> de la vitrina.** El trigger `trg_prestadores_gate_vitrina` pregunta por su
> existencia con `to_regprocedure` y **rebota hablado** mientras no exista.
> *Construirla ABRE el gate SOLA* — **es el precedente vivo de L-171: el orden
> nombra el ARTEFACTO que abre, no el archivo donde se lo espera.**

> ### 🔴 Y EL ④ ES DE OTRA CLASE — no es un hueco, es una FUGA DE PRODUCTO
> *Un usuario que pide recuperar su contraseña recibe un correo que lo saca del
> producto nuevo y lo deposita en el portal viejo.* **No falla: funciona, y lleva
> al lugar equivocado** — la familia de S85 (L-194 → L-199) aplicada a un correo.

**⇒ EL ORDEN QUE ESTO IMPLICA, y por eso está acá:** *las capas 1-3 de §2
(intención · destinatario · consentimiento) **no esperan a Meta** —eso ya estaba
escrito— y ahora tienen **cuatro consumidores nombrados esperándolas**.* **Un
motor sin consumidores se pospone sin costo; con cuatro, posponerlo tiene una
lista.**

---

## 11. Los verticales — FORMA, no contenido (§0)

Lo que cada uno le exigirá al motor. Su catálogo se escribe cuando exista.

- **DESPENSA + PORTAL SELLERS.** Trae **volumen** (el seller como
  destinatario a escala → §8 deja de ser opcional) y **ventanas críticas
  de logística** (el aviso de entrega vale ahora o no vale) → la
  criticidad temporal manda en la selección de canal. El destinatario es
  un negocio con roles: **ya resuelto** por la capa 2.
- **REFUGIOS.** Trae **resultados emocionalmente pesados** (una solicitud
  de adopción rechazada). Regla que ya se puede firmar: un resultado
  adverso **jamás llega solo por push seco** — llega con voz humana y con
  camino. Y hereda `MODELO_LOYALTY` §7.2: donación y adopción **jamás** se
  vuelven ganchos comerciales ni disparan categoría `comercial`.
- **CRIADEROS.** Trae el **riesgo de dark pattern más alto de la casa**:
  disponibilidad y listas de espera sobre seres vivos. Prohibido desde
  ahora: urgencia artificial, contadores de escasez, FOMO sobre un animal.
  Hereda `MODELO_LOYALTY` §7.5 sin excepción.

## 12. Límites duros (en piedra, no configurables)

1. Memorial: silencio total, y la cola se purga en la transición (§5.1).
2. Cero contenido clínico o sensible en el cuerpo del mensaje (§4).
3. `comercial` jamás viaja con otra categoría, jamás por defecto, jamás
   sin salida.
4. Cero dark patterns: sin urgencia artificial, sin FOMO, sin culpa por
   ausencia, sin rachas que reprochan (`MODELO_LOYALTY` §6).
5. Los beneficios y promociones **jamás distorsionan** una alerta de
   cuidado (P11).
6. Datos de menores no generan avisos (P5).
7. Nadie recibe avisos de una mascota con la que no tiene vínculo vivo.
8. La baja se honra en el acto.

## 13. Lo que este doc NO decide (y quién lo decide)

- Los textos y plantillas concretas: nacen con su vertical, con censo de
  voz (L-156) y gate de strings.
- Los precios y el margen: `MODELO_FINANCIERO`, con fecha.
- El proveedor de WhatsApp (Cloud API directa vs BSP) y de email:
  decisión técnica de Code con doble check, sobre este diseño.
- El schema: se releva lo vivo antes (D-475 declara tres capas en cero —
  **verificar, no asumir**).

## 13bis. LO QUE SIGUE SIN FIRMA, y no se cuenta como firmado *(ENMIENDA S87)*

- **`saldo_pagado` — ✅ FIRMADA (founder, 4-ago-2026). Ya no se le cuenta la
  edad.** Entra al catálogo: **son SIETE categorías.** Cruza con P16(e) y
  `MODELO_FINANCIERO` Decisión T — **esas dos siguen sin firma** y describen el
  mismo aviso; la categoría existe, **el aviso todavía no**.
- **La build de push corta runtime nuevo**, con el bump **en el mismo rango que
  la build, jamás antes** — **propuesta de mesa registrada, sin firma.**

### DOS REGISTROS DEL GATE DE SOMBRA (S87) — CANDIDATAS, SIN CONSTRUCCIÓN

#### ① «HOMENAJE» — la excepción INVITADA al silencio del memorial

**Candidata de letra, nacida en el gate de la sesión de sombra (founder, S87).**
No toca S87 ni ningún lote en curso; **nace como letra a diseñar, con mesa
propia y gate del founder.**

**La idea:** una fecha de homenaje —Día de los Muertos como caso canónico— en la
que la familia **elige recibir** un recuerdo de su mascota. Forma exigida desde
ya, para que el día que se diseñe no se discuta el piso:

- **OPT-IN EXPLÍCITO POR FAMILIA, CON EVIDENCIA** — patrón de §6 (el mismo que
  WhatsApp): se guarda quién, cuándo, por qué método y **el texto exacto que se
  mostró**. *Nadie recibe un homenaje que no pidió.*
- **ANUAL**, no una cadencia.
- **CATEGORÍA PROPIA**, jamás `comercial` — y **jamás con contenido comercial
  adentro** (§3: `comercial` no viaja con otra categoría; acá ni siquiera se
  toca).

> **EL ESPÍRITU, que es lo que hay que conservar aunque el diseño cambie:**
> **el silencio del memorial es respeto — y un homenaje ACEPTADO también lo es.**
> *§5.1 apaga todo porque nadie pidió nada; esta excepción existe solo donde
> alguien pidió, y por eso no la contradice: la completa.*

**Y el borde que hay que resolver cuando se diseñe, declarado ahora:** la regla
de la transición (§5.1) **purga la cola** al entrar en memorial. Un homenaje
anual **no puede vivir en esa cola** — o se purga solo. Nace de otra parte, y
eso es diseño, no detalle.

#### ② RESERVA DEL FOUNDER sobre `comercial` — con la respuesta de mesa al lado

**Registrada el 5-ago-2026.** El founder **no firma «nunca»** para un envío de
administración fuera del consentimiento.

**La respuesta de mesa, en el mismo lugar y con la misma fecha:**

- **No se construye puerta trasera.** Un mecanismo que exista «por si acaso» se
  usa el día que alguien tenga apuro, y para entonces nadie recuerda la reserva.
- **Lo urgente-para-todos YA VIAJA:** `seguridad_cuenta` y `salud_seguridad` son
  no apagables por diseño. *Si algo es de verdad urgente para todos, ya tiene
  categoría — y si no la tiene, la pregunta correcta es cuál es, no cómo saltear
  el consentimiento.*
- **Si el día llega, abre con mesa propia** y **declarando el choque** contra la
  letra firmada hoy (§3/§6/§12.3: `comercial` es opt-in, apagado por defecto,
  y siempre porta su salida).

> **La reserva queda fechada; el mecanismo NO EXISTE.** *Se escribe acá para que
> el día que se discuta, se discuta contra una letra que ya sabía que esto
> podía pasar — y no como si fuera una idea nueva.*

### FIRMA S88 — EL SILENCIO DE LA LIBERACIÓN QUEDA (founder, 5-ago-2026)

Cuando el memorial libera el saldo de un plan (D-657), **el aviso de esa
liberación NACE descartado por el gate 1 — y así queda**: *la familia ve el
crédito cuando ella vuelva; un aviso de plata en duelo es la app hablando
cuando prometió callar.* **La nota declarada en la migración
`20260805120000` es la letra vigente.** El rastro queda en la sombra como
`descartada_memorial` — la liberación ocurre; solo su anuncio calla.

### Candidatas registradas por el censo S87 (no rigen)

- **`update:view` en salida humana no imprime `gitCommitHash`** — solo con
  `--json`. Quien corra el deber ③ del método al pie **puede creer que falló**.
- **Tercera pieza de la regla 85:** `supabase/.temp` **no viaja con el worktree**,
  y sin él `db query --linked` rebota `LegacyProjectNotLinkedError`. Hoy la regla
  nombra `node_modules` y `.env.local` — **son tres.**
- **Una cuenta sembrada por SQL no está creada hasta que alguien la LOGUEA.**
  Origen S87: dos cuentas con filas impecables en SQL **no entraban** (GoTrue
  devolvía `500` por columnas de token en `NULL` donde espera `''`). *L-192 en un
  seed: el modo de falla era el silencio de un `INSERT` exitoso.*

## 14. Disparos

- **La letra existe desde hoy** — ese era su punto: que el día del
  transporte sea implementación, no diseño.
- **Capas 1–3 (intención, destinatario, consentimiento) + modo sombra +
  Ajustes:** disparan con S74/S75, NO esperan a Meta. Precondición dura:
  el gate de rol de S73 (ya cerrado de motor).
- **Push:** primero de los transportes; no depende de nadie externo.
- **Email:** segundo; sin aprobación externa.
- **WhatsApp:** con la respuesta de Meta (papeleo iniciado por el
  founder), y con su línea en `MODELO_FINANCIERO` fechada.

## Historial

- **v1 (S87, 4 Ago 2026) — ENMENDADO CONTRA LO VIVO.** El censo midió que la
  premisa madre de la v0 era falsa: **las tres capas no estaban en cero**. Siete
  DEFINER vivas ya escriben intenciones sin ninguno de los cinco gates de §5, y
  nadie las lee ⇒ **el sistema estaba en un modo sombra accidental**. Entra
  **§0bis** con lo medido; **§3** gana el mapeo firmado de los 10 tipos vivos a
  categoría (con las tres dudas de D resueltas y el criterio para el tipo N+1);
  **§6** gana los **tres choques del contrato** y **la letra de salud firmada por
  el founder** (*«elige por dónde le llegan, no si le llegan»*) con su exigencia
  de honrarse en motor **y** superficie; nace **§13bis** con lo que sigue sin
  firma (`saldo_pagado` a la firma desde S80) y las candidatas del censo.
  **Adjudicación del founder que ordena el arco: los gates de §5 y la cura de §6
  son PRECONDICIÓN del motor, no trabajo que lo acompaña** — encender sobre lo
  que hoy escribe sin consultar §5 enciende el defecto. **Y push exige build
  nativa: el binario 1.0.3 es anterior a su propia preparación** (L-196).
  *Nada del diseño de la v0 se cayó — se cayó la premisa de que no había nada.*
- **v0 (S73, 21 Jul 2026):** semilla escrita por la mesa como deuda
  declarada de S73. Motor diseñado vertical-proof por pedido del founder
  ("pensá en todo": despensa/sellers, refugios, criaderos) con el límite
  honesto de §0 — forma, no contenido inventado. Nace la LEY DE LA
  PANTALLA BLOQUEADA (§4). Categorías alineadas a la taxonomía que Meta
  fiscaliza y cobra. Seguridad operativa (§10) por la irreversibilidad del
  envío.


---

# S88 — LO QUE ESTA SESIÓN DEJÓ EN ESTE MODELO

## §3bis · LA AUDIENCIA — columna nueva del catálogo

`cat_notificacion_tipos.audiencia ∈ (cliente | prestador | ambas)`.
**No era derivable: ninguna tabla la portaba.** Sin ella, «Lo que ya pagaste»
se dibujaba en el prestador con seis tipos **del que paga**.

**Reparto: prestador 13 · cliente 18 · ambas 6.** Y la distinción que la
gobierna, porque no todas valen igual:

> **17 MEDIDAS** (el productor dice a quién le llega — es literal) ·
> **20 RAZONADAS** (sin productor; por el hecho que cuentan).
> ### **Un catálogo que no distingue lo medido de lo supuesto invita a tratar todo como medido.**

`salud_seguridad` es **`ambas`** por pre-adjudicación de mesa.

## §7ter · LA CAMPANA ES EL REGISTRO, NO EL CANAL (firma founder, 6-ago)

> ### **EL CANAL ES CÓMO LE LLEGÓ; LA CAMPANA ES DÓNDE QUEDA.**

Tres razones firmadas: **①** quien recibe un correo y abre la app busca ahí lo
que le avisaron — si no está, **la campana miente por omisión** · **②** medido
al firmar: 13 entregadas · 12 visibles · **1 invisible y creciendo** · **③** el
modelo llama a `in_app` *«el piso que nunca se pierde»* — y **un piso que solo
guarda lo que nadie más entregó no es piso: es descarte**.

**Y lo que cambia de SIGNIFICADO, no solo de filtro:**

> **«NO LEÍDO» SIGNIFICA «NO LO VISTE EN LA APP»** — lo único que la app puede
> saber: **no sabe si abriste el correo**. *Nadie debe leerlo como «no lo
> recibiste».*

## §7quater · EL HALLAZGO DE `es_piso` — para que nadie lea el flip como fallido

```sql
WHERE ch.codigo = ANY(v_canales) AND ch.es_piso = false AND ch.transporte_vivo
```

**`in_app` está EXCLUIDO de la selección por ser el piso ⇒ `transporte_vivo` en
`in_app` es INERTE PARA ELEGIR** — gana solo por `COALESCE`, cuando ningún otro
canal tiene tren.

> **Esto NO invalida la ley de secuencia: lo que protegía era LA PANTALLA, no
> la selección.** *El flip no fue fallido: fue el acto que la ley pedía, sobre
> un mecanismo que resultó ser otro.*

## §9 · LA LEY DE SECUENCIA DE UN CANAL NUEVO

**① el lector · ② la pieza y la pantalla · ③ el gate del founder · ④ recién ahí
el `UPDATE` de transporte.** *Encender antes hace que el motor entregue a un
buzón que nadie puede abrir — sin fallar, sin rebotar y sin rastro rojo.*

## §10 · LA REGLA QUE GOBIERNA TODA SALIDA DE SOMBRA

> **Ningún tipo sale de sombra sin su voz firmada, y la salida se verifica
> MIRANDO LA SOMBRA DEL PRODUCTOR REAL — jamás un fixture escrito a mano.**
> *Un fixture que rellena lo que el productor no llena prueba el tubo y no el
> agua* (L-207).

## §11 · LO QUE EL MOTOR **NO** TIENE, medido y declarado

**Los tres tipos de cita —`cita_confirmada`, `cita_recordatorio`,
`cita_solicitada`— NO TIENEN PRODUCTOR.** El founder creó una cita real y no le
llegó nada.

> ### **EL MOTOR ENTERO CONSTRUIDO, GATEADO Y VIVO — Y EL AVISO MÁS OBVIO DEL OFICIO NO EXISTE, PORQUE NADIE TOCA EL TIMBRE.**
> **No falta voz. No falta canal. Falta el PRODUCTOR.** (D-673, encabeza S89.)
