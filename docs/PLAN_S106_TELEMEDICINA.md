# PLAN_S106_TELEMEDICINA — el quinto oficio, en cuatro pistas

> **Versión:** **v1.1** · 25-ago-2026 · ✅ **FIRMADO en el Checkpoint 1** —
> acta: `docs/actas/2026-08-25-s106-CP1-ACTA.md` (diez firmas).
> 🔴 **Su §5-C quedó FALSO por medición y está tachado ahí mismo** — decía
> *«el saldo ya existe por `LETRA_SALDO`»* y **el motor de saldo no existe**.
> *No se borra: se tacha con puntero, para que nadie vuelva a escribirlo.*
> **Fuentes que obedece:** CLAUDE.md · CONTRATO_TRABAJO (reglas 73–88) ·
> `docs/LETRA_TELEMEDICINA.md` (incluido su FRENO DE DEPÓSITO) ·
> `LETRA_PAGO_CITAS` (el motor de citas rige entero) · `LETRA_SALDO` ·
> POLITICAS (P11) · T&C §7 y §14 · `MODELO_VETERINARIA` camino (c) ·
> el acta de cierre de S105. **Si este plan contradice fuente firmada, gana
> la fuente.**
> **Decisiones del founder que este plan ya incorpora (25-ago-2026):**
> ① la receta a distancia ENTRA — sustancias fiscalizadas bloqueadas POR
> DISEÑO; ante duda, pregunta al abogado (su última palabra: el servicio no
> tiene regulación especial) · ② el transporte de video se DECIDE **y se
> CONSTRUYE** en S106 · ③ telemedicina PAGA SU PROPIA BUILD.

---

## §0 · La forma de la sesión, y por qué este orden

**Cuatro fases, tres entradas del founder.** El principio que gobierna el
plan es autonomía con frenos escritos: cada pista recibe territorio cerrado
(76h), mediciones con su objeto declarado, gates que puede auto-verificar, y
la lista de cuándo frenar. El founder entra exactamente en tres momentos:

| Fase | Qué pasa | Founder |
|---|---|---|
| **F0 — Mediciones** | Las cuatro pistas miden, SIN CÓDIGO. | pega 4 prompts |
| **CP1 — Checkpoint** | La mesa contrasta, el founder FIRMA (§4). | **firma** |
| **T1 — Motor y superficie** | Todo lo que hereda del motor de citas, sin video. En paralelo, D integra el proveedor elegido (server-side). | crea la cuenta del proveedor (pedido autocontenido de D) |
| **T2 — El video y su build** | Módulo nativo en las dos apps + builds nuevas. | **instala y gatea en dispositivo** |
| **T3 — Cierre** | P-CIRCUITO por otra pista, caminos tristes ejercidos, acta. | — |
| **Encendido** | `reservable=true` — la llave, ÚLTIMA. | **gira la llave** |

**Por qué el video no espera al final para decidirse pero sí para
construirse:** la decisión de transporte se firma en CP1 (con la medición de
D sobre la mesa), así D arranca el lado servidor en T1 — pero **nada del
módulo nativo se escribe antes de esa firma**, que es la orden de apertura.
Y la llave del encendido es del founder, como `recurrente_vivo` en S103:
*el cron es el cable; la llave es del founder.*

---

## §1 · Alcance

**ENTRA a S106:**

1. Teleconsulta como **cita con hora agendada** que hereda el motor entero:
   las 12 compuertas, el hold, el desglose congelado, el cobro al reservar,
   la confirmación por el motor (§1 de la letra). Comisión 10 %.
2. El **aviso previo §3** — los cinco signos, sin resumir — con sus tres
   acciones, ANTES de confirmar.
3. El **consentimiento POR CITA, registrado** (requisito del abogado): quién,
   cuándo, qué versión del texto, contra qué cita. **Sin consentimiento no
   hay reserva confirmada — atómico, no secuencial.**
4. **Cancelación sin penalidad hasta 30 min antes** → saldo. **Consulta que
   se corta** → el vet la marca **no realizable** → saldo. Sin investigación
   de culpa (§5, deliberado).
5. **La marca de teleconsulta VISIBLE** en la historia clínica y el
   Bio-Expediente (§7). El aviso de IA de T&C §14 rige sin cambios.
6. **Habilitación del prestador**: prende el servicio aceptando los mínimos
   declarados de §6 (registro con versión y fecha). T&C §7 rige.
7. **Receta a distancia**: medicación prescrita en teleconsulta, con
   **sustancias fiscalizadas bloqueadas POR DISEÑO** (guard en el motor, no
   declaración del vet). El diseño exacto se firma en CP1 sobre lo medido.
8. **El transporte de video**: se decide en CP1, se construye en T2 —
   módulo nativo, **no viaja por OTA**, build nueva de LAS DOS apps (el
   dueño entra por `cliente`, el vet por `prestador`).

**NO ENTRA (y se declara para que nadie lo construya de más):**

- Verificación técnica de red o hardware (§6: declarados, jamás medidos).
- Consulta asíncrona · el incentivo IA de criticidad (v2) — §9 de la letra.
- **Grabación de la videollamada** — nadie la pidió; privacidad y costo la
  dejan fuera hasta letra propia.
- **Documento de receta formal (PDF firmado)** — v1 es el registrable
  «medicación prescrita» sedimentando al expediente con su marca; el papel
  se decide aparte si el abogado o un vet lo piden.
- iOS: las builds de S106 son Android preview (el gate del founder es
  Android). iOS queda como decisión aparte (D-285 sigue sin verificar).
- **Todo lo abierto de S105**: el deploy de `pagos-web` (ventana Vercel),
  el guard del IVA (Erick), la puerta de retomar, y las siete piezas
  construidas-no-ejercidas del acta §②. **Se leen, no se pisan.**

---

## §2 · Reparto y territorios (propuesta — se firma en CP1)

Sigue el reparto que S105 dejó probado:

| Pista | Territorio | En S106 |
|---|---|---|
| **A** | conducción · DB/migraciones (escritora única) · `packages/api` · docs · merges/push/OTA/**builds** | motor: consentimiento, ventana 30 min, no-realizable→saldo, habilitación, marca, receta+guard fiscalizadas; wrappers; enmienda `LETRA_SALDO`; las DOS builds |
| **B** | `packages/ui` · jueces/instrumentos | AvisoPrevio §3 · marca de teleconsulta en las piezas de historia/Línea de Vida · piezas de pre-join/in-call (Ley 11) · el juez del texto verbatim |
| **C** | `apps/cliente` + `apps/prestador` | flujo de reserva con aviso+consentimiento · detalle con «entrar» · habilitación del prestador · Durante de teleconsulta (no realizable, nota, receta) · integración del SDK nativo en T2 |
| **D** | `supabase/functions/` (video) · la medición de transporte | `video-token` (mint por cita, valida pertenencia) · webhook del proveedor si existe · arneses del token |

**Reglas que rigen a las cuatro, sin excepción:** worktree propio y rama
pusheada apenas exista commit, verificada por sha (regla 85 + L-239) · el
estado de `node_modules` del worktree SE MIDE, no se deduce (corolario 85:
`pwd -P` sobre `@epetplace/ui`) · Metro con `--clear` tras todo merge que
toque `packages/*` · staging por ruta explícita, jamás `git add -A` (76f) ·
declaración de archivos al abrir tanda (76h) · veda declarada en toda
migración, aunque la conclusión sea «no rige» (76g) · pedidos SQL entre
pistas como texto completo (76b) · `main` lo escribe SOLO la conductora
(regla 88) · cambio de firma de función = `DROP FUNCTION` explícito (L-119)
· números D-/L- por grep contra el objeto, jamás de memoria (L-141) · **un
mensaje de éxito prueba que algo pasó, no que fuera lo tuyo — todo se
verifica contra el objeto** (S105: `db push` miente; el ledger no es
prueba; el directorio de migraciones se mira DESPUÉS de traer ramas,
L-422).

---

## §3 · FASE 0 — las mediciones (primer turno, sin código)

Las seis mediciones del arranque + la de receta, repartidas. Cada una
declara contra qué objeto se midió. Los prompts completos están en §11.

| # | Medición | Pista |
|---|---|---|
| 1 | Qué existe ya de telemedicina: DB (fila, ofertas, precios, habilitados) | A |
| 1b | Qué existe en pantallas (las dos apps) + la voz honesta del wizard | C |
| 2 | La herencia del motor: compuertas, hold, desglose, cobro — qué es agnóstico del tipo, qué no; **dónde vive la ventana de cancelación**; **dónde vive el catálogo cerrado de fuentes de saldo** | A |
| 3 | 🔴 El transporte: candidatos, compatibilidad Expo SDK 57, build, token desde Deno, costo, riesgo — tabla + recomendación, **sin elegir** | D |
| 4 | El aviso §3 y el consentimiento por cita: dónde entra en el flujo real de reserva, qué molde existe (`registrarConsentimiento` S104) | C + A |
| 5 | La marca visible: qué piezas dibujan historia/Línea de Vida y cuál llevaría la marca (Ley 11) | B + A |
| 6 | La habilitación del prestador y dónde entran los mínimos §6 | C |
| 7 | Receta: qué existe de «medicación prescrita», ¿catálogo o texto libre?, ¿cómo se identificaría una fiscalizada? | A |
| 8 | Re-medición del cero de transporte en el monorepo (grep, L-141) + inventario UI para pre-join/in-call | B |

---

## §4 · CHECKPOINT 1 — las firmas del founder

Con las mediciones sobre la mesa, la mesa contrasta y el founder firma:

1. **El transporte elegido y su tren**: proveedor + la build propia
   (version bump en las dos apps, EAS preview Android).
2. **La enmienda a `LETRA_SALDO` §3** que el freno de depósito dejó
   servida: las fuentes de cita distinguen **presencial (≥24 h)** de
   **teleconsulta (30 min)**, y **la consulta no realizable** entra como
   fuente propia. Hasta esta firma, en el cruce con §3 gana la fuente.
3. **El diseño del bloqueo de fiscalizadas** (sobre lo que A midió en #7):
   la opción propuesta es una **tabla de principios activos fiscalizados**
   (fuente: los listados públicos ARCSA/CONSEP de Ecuador) + guard tipado
   en la puerta que registra la medicación en contexto teleconsulta. Si la
   medición destapa que hoy es texto libre sin vocabulario, la mesa decide
   el alcance honesto de v1 — y si queda duda regulatoria, **la pregunta va
   al abogado antes de construir**.
4. 🔴 **La conjugación del aviso §3**: el texto de la letra está en voseo
   («notás», «llevala») y la voz de las apps es **tuteo neutro** (decisión
   founder S51; la familia R66 vigila el voseo con baseline 0). La letra
   prohíbe resumir y acortar — no prohíbe conjugar. Propuesta: adaptación
   de conjugación **sin tocar contenido** (los cinco signos intactos),
   firmada acá, y el juez de B compara contra el texto FIRMADO. Ídem la
   traducción `en` (gate del founder por fidelidad).
5. **El destino real de «Ir a urgencias»** (sobre lo que C midió en #3 del
   camino (b) urgencia solo-HOY).
6. **Los territorios de T1**: lista de archivos por pista (76h), sobre las
   propuestas que cada pista trae de su medición.
7. **Todo choque que las mediciones destapen contra letra firmada** — se
   adjudica acá, no se «armoniza» en silencio.

---

## §5 · TANDA 1 — todo lo que hereda del motor (sin video)

El diseño de abajo es la propuesta del arquitecto **para contrastar contra
lo medido** — el chasis manda (la lección de la vitrina S78: primero medir
que el motor lo da, después escribir).

**A — el motor:**

- **Consentimiento por cita**: tabla propia (cita, usuario, versión del
  texto, timestamp). La RPC de reserva de teleconsulta lo exige **en el
  mismo acto** — una teleconsulta confirmada sin fila de consentimiento es
  inexpresable, no prohibida por prosa.
- **Ventana de cancelación por tipo**: según dónde M2 diga que vive la
  ventana de hoy — la forma esperable es parámetro por `tipos_servicio`
  (30 min telemedicina, ≥24 h el resto), jamás un `if` por nombre.
- **No realizable**: transición nueva del ciclo de la cita (la marca el
  prestador, solo antes de completada), que deposita en saldo por la misma
  puerta que la cancelación en ventana. Rechazos tipados.
- **Habilitación**: registro de aceptación de mínimos §6 (prestador,
  versión, fecha) + el interruptor del servicio en su oferta. Sin
  aceptación registrada, la oferta de telemedicina no se publica.
- **La marca**: según M5 — si el evento clínico ya referencia su
  cita/atención, la marca puede ser derivable y los lectores la dibujan;
  si no, columna de modalidad en el evento. Decisión técnica con doble
  check al construir (patrón MODELO_LOYALTY §4).
- **Receta**: el guard de fiscalizadas según la firma de CP1, con rechazo
  tipado y su arnés produciendo el rojo a propósito.
- **Wrappers** en `packages/api` (puerta única, voz tuteo neutro, R66).
- Todas las migraciones: **reversa escrita ANTES**, 76(g) declarada,
  verificadas contra el objeto.
- **Docs**: ~~la enmienda firmada de `LETRA_SALDO` §3 (letra vieja tachada,
  no borrada)~~ **SIN OBJETO — ver abajo** + depositar este plan + toda
  enmienda que CP1 firme sobre `LETRA_TELEMEDICINA`.

> ### 🔴 ENMIENDA v1.1 — `LETRA_SALDO` §3 **NO SE TOCA**. Firma founder CP1
>
> Con la firma ③ (la devolución va **al medio de pago**), telemedicina **no
> agrega ninguna fuente** a la lista cerrada de §3 ⇒ **la enmienda que el
> freno de depósito pedía queda SIN OBJETO, no pendiente.**
>
> *Enmendar una lista ajena por un choque que ya se cerró es trabajo que
> ensucia:* dejaría en el canon una distinción presencial/teleconsulta sobre
> fuentes que este oficio dejó de usar. **El freno se disuelve por la
> adjudicación, no por enmienda** — acta de CP1, firma ⑨.

**B — las piezas y el juez:**

- `AvisoPrevio` de teleconsulta: bloqueante, tres acciones, texto firmado
  en CP1 vía i18n. **El juez nuevo (R-siguiente por grep)**: compara el
  texto renderizado contra el firmado, carácter por carácter — *el aviso
  no se acorta, y eso lo vigila un instrumento, no un ojo*.
- La marca de teleconsulta en las piezas que dibujan historia y Línea de
  Vida (chip/voz — Ley 11 si falta componente, jamás inline).
- Las piezas de pre-join (preview de cámara, mic) e in-call mínima que el
  SDK elegido no traiga — solo si Ley 11 lo exige.

**C — las superficies:**

- **Cliente**: reserva de teleconsulta = el flujo vet con el aviso §3
  ANTES de confirmar; el consentimiento viaja en el acto de confirmar (el
  wrapper atómico de A); detalle de cita con «entrar a la videoconsulta»
  como placeholder honesto hasta T2; cancelación con la ventana de 30 min
  dicha en pantalla; ~~el saldo ya existe por `LETRA_SALDO`~~.

> ### 🔴 ENMIENDA v1.1 — *«el saldo ya existe» ERA FALSO.* Firma founder CP1, 25-ago-2026
>
> **Medido en el turno ⓪ contra la base: cero tablas, cero funciones de
> saldo.** `LETRA_SALDO` fija el **contrato**; su **motor** era trabajo de
> S102 y S102 no lo construyó. *Esta línea confundía contrato con motor —
> el error más caro del plan, porque de él colgaban las dos ramas donde la
> plata vuelve.*
>
> **Lo que rige:** la devolución va **al medio de pago, gestionada por
> soporte**, con reverso automático solo dentro de la ventana del riel
> (Nuvei mismo día · DeUna 24 h). Ver **firma ③** del acta de CP1 y las
> enmiendas de §4/§5 de `LETRA_TELEMEDICINA` v1.1. El motor de saldo tiene
> ficha propia: **`D-926`**.
>
> ⇒ **La superficie de C promete «a tu medio de pago» con plazo honesto, y
> jamás «al instante» ni «como saldo».**
- **Prestador**: habilitación (prender el servicio aceptando §6, con el
  texto de los mínimos visible); la agenda distingue la teleconsulta; el
  Durante de teleconsulta con **marcar no realizable** (y su voz honesta:
  la plata vuelve como saldo), la nota clínica de siempre (T&C §14 rige) y
  la receta con el guard.
- Mientras `reservable=false`, la voz honesta del camino (c) sigue en pie.

**D — el proveedor, lado servidor (arranca apenas CP1 firma el
transporte):**

- Pedido autocontenido al founder: alta de cuenta del proveedor; las keys
  van a secrets/vault (patrón L-408), **jamás al repo ni al chat**.
- `video-token`: mint de token por cita — valida contra la DB que el
  caller **es parte de esa cita** (dueño de la mascota o prestador
  habilitado), en ventana temporal alrededor de la hora, sala = id de la
  cita. La autenticación jamás lee campos de log (lección S103).
- Webhook del proveedor si existe (eventos de sala) — o se declara que no
  hay, por escrito.
- `verify-edge-deno` sobre copia FUERA del repo. Arnés que **corre de
  verdad** (L-402: ¿corrió alguna vez?) con sus rojos a propósito: el
  ajeno a la cita NO obtiene token.

---

## §6 · TANDA 2 — el video y su build

- **C**: el SDK nativo en las dos apps — config plugin, permisos de cámara
  y micrófono (strings es/en), pre-join con preview, in-call mínima (video
  remoto + propio, mute, colgar), estados de fallo honestos (sin
  conexión, permiso negado, el otro no llegó). Detrás del gate de datos
  del motor: el botón «entrar» solo existe para una teleconsulta pagada y
  en ventana.
- **A**: version bump en `app.json` de las DOS apps (runtimeVersion por
  `appVersion`: los OTA viejos siguen llegando a las APK viejas — se
  declara) · `eas build -p android --profile preview` **desde
  `apps/<app>/`, jamás desde la raíz** (el stub scaffoldeado de S74/S85) ·
  keystores y secrets ya viven en EAS.
- **D**: ajustes del token contra el SDK real.
- **Gate en dispositivo (founder)**: DOS teléfonos, una teleconsulta real
  de punta a punta — se detalla en §8.

---

## §7 · TANDA 3 — el cierre

- **P-CIRCUITO por OTRA pista** (L-398): recorrer el circuito entero
  declarando pieza por pieza si está alcanzable desde afuera Y si corrió
  alguna vez — reserva → aviso → consentimiento → cobro → recordatorio de
  agenda existente → entrar → token → llamada → nota → marca en expediente
  → (rama triste) no realizable → saldo.
- **Los caminos tristes, ejercidos contra el objeto**: cancelación en
  ventana → fila de saldo VERIFICADA · cancelación fuera de ventana →
  rebote tipado · reserva sin consentimiento → inexpresable · ajeno a la
  cita → sin token · receta fiscalizada → rebote tipado · no realizable →
  saldo + la cita en su estado.
- Typechecks en 0 · `verify:diseno` verde · R-nuevo del aviso verde ·
  barrido de voz (R66) · migraciones local = remoto MEDIDO · reversas
  completas · ramas en origin por sha.
- Acta de cierre + canon + este plan marcado EJECUTADO. La deuda de canon
  de S102/S104/S105 **no se toca acá** — sigue siendo la pasada dedicada
  que el founder ya tiene servida.

---

## §8 · Los gates del founder (en dispositivo)

1. **La reserva entera**: elegir teleconsulta → el aviso §3 con los cinco
   signos y las tres acciones → continuar → pagar (sandbox) → la cita
   firme. Después, **la fila del consentimiento verificada en DB** (quién,
   cuándo, versión, cita).
2. **La videollamada real**: dos teléfonos (founder = dueño, Karina o
   segundo dispositivo = vet), entrar desde ambos lados, verse y oírse,
   colgar.
3. **La marca**: la consulta sedimentada en la historia y el expediente
   **con «atendida por teleconsulta» visible** en las dos apps.
4. **El camino triste**: una teleconsulta marcada no realizable y la plata
   de vuelta **como saldo, visto en pantalla**.
5. **La habilitación**: prender el servicio como prestador y ver los
   mínimos §6 en el acto de aceptar.
6. **La ventana**: cancelar a >30 min (entra) y a <30 min (rebota, con la
   voz honesta).

---

## §9 · El encendido — la llave es del founder

`reservable=true` en `tipos_servicio` es **la última llave y es una sola**.
Precondiciones, todas verificadas contra el objeto antes de girarla:

1. Gates de §8 verdes.
2. **El consentimiento registrado FUNCIONANDO** — es requisito del
   abogado, no preferencia: sin él no se publica nada de telemedicina.
3. La enmienda de `LETRA_SALDO` §3 firmada y depositada.
4. Las builds nuevas instaladas en los dispositivos que van a operar (una
   teleconsulta reservada contra una app vieja sin el módulo es un botón
   que no puede llamar a nadie — la razón de que el video no viaje por
   OTA).

---

## §10 · Frenos y riesgos

- **Choque contra letra firmada → frenar y avisar** (la orden que el freno
  de depósito ya honró una vez en esta letra).
- **Nada del módulo nativo antes de la firma de transporte** — ya resuelta
  en CP1 por diseño de este plan.
- Riesgo 1 — **el proveedor**: si la medición de D muestra que ningún
  candidato entra limpio en Expo SDK 57, la mesa decide antes de que nadie
  pelee una integración a ciegas. Por eso la medición es primero.
- Riesgo 2 — **la build**: es la primera build nativa nueva en varias
  sesiones; el ciclo (bump → EAS → instalar → marcador en el pie) ya está
  escrito en CLAUDE.md y se sigue al pie. El gate empieza confirmando el
  binario (L-138).
- Riesgo 3 — **el catálogo de fiscalizadas**: si poblarlo honesto es más
  grande que la sesión, la mesa acota v1 con letra (p. ej. vocabulario
  cerrado de prescribibles) antes que un guard que aparenta y no filtra —
  *un requisito que suena serio y no filtra nada* es exactamente lo que §6
  de la letra enseñó a no escribir.
- Riesgo 4 — **el tiempo del founder**: hay dos actos suyos en el camino
  crítico (la cuenta del proveedor tras CP1, y el gate de dos teléfonos).
  Se piden autocontenidos y con fecha.

---

## §11 · Los cuatro prompts del arranque (F0 — listos para pegar)

> Pegá cada uno en su sesión de Code. Son SOLO mediciones: ninguna pista
> escribe código en este turno.

### Pista A

```
Sos la PISTA A de S106 — TELEMEDICINA, el quinto oficio. Conducís: DB
(escritora única), packages/api, docs, merges (regla 88: main lo escribís
solo vos), y las builds cuando lleguen.

PASO ⓪ — antes de todo:
1. Desde main actualizado: git worktree add ../e-petplace-s106-a -b
   pista/s106-a · árbol limpio verificado con git status.
2. La rama a origin apenas exista el primer commit, verificada POR SHA:
   git ls-remote origin pista/s106-a contra git rev-parse (jamás por
   código de salida).
3. Medir tu node_modules (corolario regla 85): cd
   apps/cliente/node_modules/@epetplace/ui && pwd -P — declarar si estás
   enganchada al primario.
4. Leer ANTES de medir: docs/LETRA_TELEMEDICINA.md ENTERA (incluido el
   FRENO DE DEPÓSITO al pie) · LETRA_PAGO_CITAS · LETRA_SALDO §3 ·
   POLITICAS P11 · MODELO_VETERINARIA camino (c) · T&C §7 y §14 · el acta
   docs/loop/S105-A-ACTA-CIERRE.md · CLAUDE.md (estado S105).
5. Las leyes de la casa que pagó S105: un mensaje de éxito prueba que algo
   pasó, no que fuera lo tuyo — TODO se verifica contra el objeto (db push
   miente; el directorio de migraciones se mira DESPUÉS de traer ramas,
   L-422). L-141: ningún número de memoria — el siguiente D-/L-/R- libre
   se mide por grep contra DEUDAS_CANONICAS.md.

LO QUE NO SE TOCA (abierto de S105, con dueño): el deploy de pagos-web
(ventana Vercel) · el guard del IVA (espera a Erick) · la puerta de
retomar · las siete piezas construidas-no-ejercidas del acta §②. Se leen,
no se pisan.

PRIMER TURNO — SIN CÓDIGO. Mediciones, cada una declarando contra qué
objeto se midió:

A-M1 · Qué existe ya de telemedicina en la DB: la fila de tipos_servicio
(TODAS sus columnas: reservable, categoria, especies_elegibles, lo que
haya), ofertas y precios existentes, prestadores con el servicio
habilitado, y todo objeto de DB que nombre telemedicina/teleconsulta
(information_schema + grep de funciones por pg_get_functiondef). Objeto:
la DB linkeada.

A-M2 · La herencia del motor de citas, contra el objeto: leer las
funciones REALES del camino (inicios disponibles → bloqueo/hold →
confirmación por motor → desglose congelado → cobro al reservar; los
nombres los da el objeto y LETRA_PAGO_CITAS) y declarar: ① qué es
agnóstico del tipo de servicio (hereda solo) · ② qué distingue por tipo y
va a necesitar la fila nueva · ③ DÓNDE VIVE la ventana de cancelación hoy
(¿constante ≥24h? ¿parámetro? ¿en qué función/tabla?) · ④ DÓNDE VIVE el
catálogo cerrado de fuentes de saldo de LETRA_SALDO §3 en el motor
(¿enum? ¿CHECK? ¿solo prosa?) y qué tocaría la enmienda que el freno de
depósito dejó servida · ⑤ lo que NO hereda — nombrarlo, no redondearlo.

A-M3 · El consentimiento: qué existe hoy (registrarConsentimiento de S104
— su tabla, su modelo, sus tres caminos) y si sirve de molde para un
consentimiento POR CITA (quién, cuándo, versión del texto, cita).

A-M4 · La receta: qué existe de «medicación prescrita» como registrable
del Eje 3 (¿tabla? ¿vocabulario? ¿texto libre?), y qué haría falta para
identificar una sustancia fiscalizada POR DISEÑO (no por declaración).
Medir, no diseñar.

A-M5 · El interruptor: cómo se enciende reservable (quién puede
escribir esa columna, qué lector produce servicio_no_reservable), para
que el encendido final sea una llave y no una obra.

REPORTE: depositá docs/relevamientos/2026-08-25-s106-a-mediciones.md +
tu parte docs/loop/S106-A.md · commit por ruta explícita (76f — jamás
git add -A) · push de tu rama · y reportá acá: cada medición con su
objeto, TODO lo que contradiga la letra en sección propia 🔴 (frená ahí y
avisá — no armonices nada), y tu propuesta de territorio para la tanda 1
(lista de archivos, 76h).

FRENO GENERAL: nada de telemedicina se construye en este turno. Ninguna
migración se escribe. Si algo contradice fuente firmada, frenás y avisás.
```

### Pista B

```
Sos la PISTA B de S106 — TELEMEDICINA, el quinto oficio. Tu territorio:
packages/ui y los jueces/instrumentos.

PASO ⓪ — antes de todo:
1. Desde main actualizado: git worktree add ../e-petplace-s106-b -b
   pista/s106-b · árbol limpio con git status.
2. La rama a origin apenas exista el primer commit, verificada POR SHA
   (git ls-remote origin pista/s106-b contra git rev-parse).
3. Medir tu node_modules (corolario regla 85): cd
   apps/cliente/node_modules/@epetplace/ui && pwd -P — declarar si estás
   enganchado al primario.
4. Leer ANTES de medir: docs/LETRA_TELEMEDICINA.md ENTERA (con el FRENO
   DE DEPÓSITO al pie) · DIRECCION_ARTE y la skill
   epetplace-design-system · el acta docs/loop/S105-A-ACTA-CIERRE.md ·
   CLAUDE.md (estado S105).
5. Ley de S105: un mensaje de éxito prueba que algo pasó, no que fuera lo
   tuyo — todo contra el objeto. L-141: números por grep, jamás de
   memoria.

LO QUE NO SE TOCA: lo abierto de S105 (deploy pagos-web · guard del IVA ·
puerta de retomar · las siete piezas no ejercidas del acta §②).

PRIMER TURNO — SIN CÓDIGO. Mediciones, cada una con su objeto:

B-M1 · La marca visible (§7 de la letra): censar qué piezas de
packages/ui dibujan la historia clínica, la Línea de Vida y el detalle
del evento en las DOS apps (qué componentes montan esas pantallas), y
declarar cuál llevaría la marca «atendida por teleconsulta» — ¿alcanza el
sistema o falta componente (Ley 11)? Censar, no construir.

B-M2 · El aviso §3: ¿existe patrón de aviso BLOQUEANTE con tres acciones
(Hoja, Aviso, otro)? Contra el objeto: los componentes reales y dónde se
usan hoy.

B-M3 · Re-medir el cero de transporte (L-141 — la medición de S105 fue
tuya y se re-mide, no se cita): grep -ri
"webrtc\|livekit\|daily\|agora\|twilio\|jitsi\|100ms\|vonage\|stream-video"
en el monorepo. Declarar el resultado y el comando. ClipSesion reproduce
archivo grabado — si aparece, se declara como lo que es.

B-M4 · Inventario de piezas UI para un pre-join (preview de cámara, mic)
y una in-call mínima (video remoto + propio, mute, colgar): qué existe
que sirva, qué faltaría por Ley 11. Sin diseñar.

B-M5 · El juez del texto: proponer (no construir) el instrumento que
verifique que el aviso §3 se renderiza VERBATIM contra el texto firmado
— estilo baseline exacto, familia R66. El número R- libre se mide por
grep al momento de nacer, no ahora.

REPORTE: depositá docs/relevamientos/2026-08-25-s106-b-mediciones.md +
tu parte docs/loop/S106-B.md · commit por ruta explícita (76f) · push ·
y reportá acá: cada medición con su objeto, choques contra letra en
sección 🔴 propia (frenar y avisar), y tu propuesta de territorio para la
tanda 1 (lista de archivos, 76h).

FRENO GENERAL: nada se construye en este turno.
```

### Pista C

```
Sos la PISTA C de S106 — TELEMEDICINA, el quinto oficio. Tu territorio:
apps/cliente y apps/prestador.

PASO ⓪ — antes de todo:
1. Desde main actualizado: git worktree add ../e-petplace-s106-c -b
   pista/s106-c · árbol limpio con git status.
2. La rama a origin apenas exista el primer commit, verificada POR SHA
   (git ls-remote origin pista/s106-c contra git rev-parse).
3. Medir tu node_modules (corolario regla 85): cd
   apps/cliente/node_modules/@epetplace/ui && pwd -P — y lo mismo en
   apps/prestador. Declarar si estás enganchado al primario. Metro
   siempre con --clear al arrancar y tras cada merge que toque
   packages/*.
4. Leer ANTES de medir: docs/LETRA_TELEMEDICINA.md ENTERA (con el FRENO
   DE DEPÓSITO) · MODELO_VETERINARIA camino (c) (la voz honesta del
   wizard, enmienda v1.2 S68) · el acta docs/loop/S105-A-ACTA-CIERRE.md ·
   CLAUDE.md (estado S105).
5. Ley de S105: un mensaje de éxito prueba que algo pasó, no que fuera lo
   tuyo — todo contra el objeto. L-141: números por grep.

LO QUE NO SE TOCA: lo abierto de S105 (deploy pagos-web · guard del IVA ·
puerta de retomar · las siete piezas no ejercidas del acta §②) — en
particular, apps/pagos-web es tu territorio DE S105 y este turno no lo
toca.

PRIMER TURNO — SIN CÓDIGO. Mediciones, cada una con su objeto:

C-M1 · Qué pantallas nombran telemedicina HOY en las dos apps (grep por
app, archivos con línea), y dónde vive la voz honesta del camino (c)
mientras reservable=false. ¿Existe? ¿Dónde?

C-M2 · El camino REAL de reserva vet en el cliente, mapeado archivo por
archivo (desde Explorar/el CUÁNDO hasta confirmar y pagar por el motor de
S101): dónde entra el aviso previo de §3 ANTES de confirmar, y en qué
acto exacto se colgaría el registro del consentimiento (el abogado exigió
consentimiento POR CITA, registrado).

C-M3 · El destino de «Ir a urgencias» (la primera acción del aviso §3):
qué existe hoy del camino (b) urgencia solo-HOY de MODELO_VETERINARIA —
¿tiene superficie? ¿a dónde podría apuntar el botón sin mentir? Medir
para que la mesa decida; no decidir.

C-M4 · La habilitación del prestador: dónde vive la configuración de
servicios (el wizard), cómo se «prende» un servicio hoy, y dónde entraría
la aceptación registrada de los mínimos de §6 (conexión, cámara del
teléfono, iluminación, auriculares recomendados — declarados, jamás
verificados).

C-M5 · Dónde viviría «entrar a la videoconsulta» en el detalle de cita
de las DOS apps, y el Durante del prestador para teleconsulta: marcar no
realizable (§5), la nota clínica de siempre (T&C §14 rige) y la receta.
Censo de archivos, sin construir.

REPORTE: depositá docs/relevamientos/2026-08-25-s106-c-mediciones.md +
tu parte docs/loop/S106-C.md · commit por ruta explícita (76f) · push ·
y reportá acá: cada medición con su objeto, choques contra letra en
sección 🔴 propia (frenar y avisar), y tu propuesta de territorio para la
tanda 1 (lista de archivos, 76h). Si algo te pide SQL, lo pedís como
texto completo a la mesa (76b) — la DB la escribe solo la A.

FRENO GENERAL: nada se construye en este turno. El módulo nativo de
video NO EXISTE para vos hasta que la mesa firme transporte y build —
construirlo antes es la línea roja de la sesión.
```

### Pista D

```
Sos la PISTA D de S106 — TELEMEDICINA, el quinto oficio. Tu territorio:
supabase/functions (lo nuevo de video) y LA MEDICIÓN DE TRANSPORTE — la
medición más importante de la sesión: la mesa decide proveedor y build
con tu tabla sobre la mesa, ANTES de que nadie construya la pieza.

PASO ⓪ — antes de todo:
1. Desde main actualizado: git worktree add ../e-petplace-s106-d -b
   pista/s106-d · árbol limpio con git status.
2. La rama a origin apenas exista el primer commit, verificada POR SHA
   (git ls-remote origin pista/s106-d contra git rev-parse).
3. Medir tu node_modules (corolario regla 85): cd
   apps/cliente/node_modules/@epetplace/ui && pwd -P — declarar si estás
   enganchado al primario (en S99 el único enganchado fuiste vos: por eso
   se mide, no se deduce).
4. Leer ANTES de medir: docs/LETRA_TELEMEDICINA.md ENTERA (§9: el
   transporte es módulo NATIVO y no viaja por OTA) · el patrón de
   secrets de S103 (vault, L-408) y la lección del veredicto en campo de
   log · el acta docs/loop/S105-A-ACTA-CIERRE.md · CLAUDE.md (estado
   S105, incluida la fila de supabase/ con verify-edge-deno y sus dos
   condiciones de uso).
5. Ley de S105: un mensaje de éxito prueba que algo pasó, no que fuera lo
   tuyo — todo contra el objeto. L-141: números por grep.

LO QUE NO SE TOCA: lo abierto de S105 (deploy pagos-web · guard del IVA ·
puerta de retomar · las siete piezas no ejercidas del acta §②) — en
particular las funciones pagos-* son tu territorio DE S105 y este turno
no las toca.

PRIMER TURNO — SIN CÓDIGO. Mediciones, cada una con su objeto:

D-M1 🔴 EL TRANSPORTE. Para cada candidato — LiveKit (cloud y
self-host), Daily, Agora, 100ms, Stream Video, Vonage, Jitsi
(self-host); y verificá el estado REAL hoy de Twilio Video, que anunció
EOL y después lo revirtió — medí:
  ① SDK React Native con soporte Expo SDK 57 + config plugin: contra
    npm/github (versión vigente, fecha de última publicación, peer deps,
    issues abiertas de Expo). El objeto es el registro/repo, no el
    marketing.
  ② Qué exige de la build: EAS, permisos, minSdk/target, tamaño.
  ③ Token/auth server-side DESDE DENO (nuestras edge functions): ¿JWT
    firmable en Deno? ¿SDK server compatible o REST puro?
  ④ Costo: lo que las docs públicas den (por participante-minuto, fijo
    mensual, free tier y sus límites). Lo que no puedas alcanzar, lo
    declarás como no medido — la mesa lo completa. No inventes precios.
  ⑤ TURN incluido sí/no · ⑥ región/latencia para Ecuador · ⑦ riesgo:
    madurez, señales de EOL, dependencia de una sola empresa.
SALIDA: tabla comparativa + UNA recomendación fundada + las preguntas que
quedan abiertas para la mesa. VOS NO ELEGÍS: la mesa decide con tu tabla.

D-M2 · El molde de una edge function nueva: cómo nacen hoy (config,
secrets por vault — patrón S103 —, verify-edge-deno SOBRE COPIA FUERA DEL
REPO y jamás en pre-commit), y dónde viviría video-token.

D-M3 · La seguridad del token, diseño mínimo propuesto (no construido):
qué necesita consultar contra la DB para afirmar «sos parte de ESTA cita»
(dueño de la mascota de la cita, o prestador habilitado de la cita), con
qué credencial, y en qué ventana temporal alrededor de la hora. El
veredicto de autenticación jamás vive en un campo de log (lección S103).

REPORTE: depositá docs/relevamientos/2026-08-25-s106-d-transporte.md +
tu parte docs/loop/S106-D.md · commit por ruta explícita (76f) · push ·
y reportá acá: la tabla entera con cada celda diciendo contra qué objeto
se midió (o «no medido»), tu recomendación con su porqué, y tu propuesta
de territorio para la tanda 1 (lista de archivos, 76h).

FRENO GENERAL: nada se construye en este turno. Ninguna cuenta se crea,
ninguna key se pide — el alta de cuenta del proveedor es un acto del
founder que llega DESPUÉS de la firma de la mesa, como pedido
autocontenido tuyo.
```

---

## Historial

- **v1.0 (25-ago-2026):** redacción inicial sobre `LETRA_TELEMEDICINA`
  v1.0 + su freno de depósito + el estado S105, con las tres decisiones
  del founder del 25-ago incorporadas (receta entra · transporte se decide
  y construye en S106 · build propia). PROPUESTA a la firma.
