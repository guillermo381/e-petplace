# MODELO_NOTIFICACIONES — El motor de alcanzar a alguien

> **Versión: v0 SEMILLA — S73 (21 Jul 2026). SIN FECHA DE CONSTRUCCIÓN;
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

Dos categorías **no se apagan** porque su ausencia daña a la mascota o a
la cuenta — pero **el canal siempre se elige**: nadie está obligado a
recibir una urgencia por WhatsApp. Nunca se puede desactivar el aviso; sí
por dónde llega.

`comercial` **jamás viaja en el mismo mensaje** que otra categoría. Un
recordatorio de vacuna con un cupón adentro es P11 roto: la alerta existe
por la mascota, no por el cupón.

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
2. **MENORES (P5).** Un evento con `aportado_por_menor` no genera
   intención. Ninguna notificación se dirige a un menor.
3. **ROL Y ACCESO** (§2 capa 2).
4. **CONSENTIMIENTO** (§6).
5. **TECHO DE FRECUENCIA** (§8).

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

## 7. Los transportes — y sus verdades incómodas

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

- **v0 (S73, 21 Jul 2026):** semilla escrita por la mesa como deuda
  declarada de S73. Motor diseñado vertical-proof por pedido del founder
  ("pensá en todo": despensa/sellers, refugios, criaderos) con el límite
  honesto de §0 — forma, no contenido inventado. Nace la LEY DE LA
  PANTALLA BLOQUEADA (§4). Categorías alineadas a la taxonomía que Meta
  fiscaliza y cobra. Seguridad operativa (§10) por la irreversibilidad del
  envío.
