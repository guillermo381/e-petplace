# RUTA_F1 — El camino al soft launch (v2: dos arcos)

> **Trazada en S49 (9 Jul 2026), founder + arquitecto.** El destino es
> `DEFINICION_SOFTLAUNCH.md` (con la enmienda de operación de esta misma
> sesión). **Contrastes obligatorios:** `MODELO_PRODUCTO.md` para el
> Arco A (mandato EL NORTE) y `MODELO_FINANCIERO.md` para el Arco B
> (regla del propio doc: toda feature que toque plata lo lee ANTES).
> La v1 trazaba solo la experiencia; el founder detectó el hueco:
> **una ruta que no traza la operación no llega a ningún launch.**
>
> **La ruta son DOS ARCOS TRENZADOS:**
> - **Arco A — Experiencia:** lo que el dueño y el ecosistema viven.
> - **Arco B — Operación:** lo que hace que eso cobre, escale y se
>   sostenga (pagos, admin, cuenta, post-venta, multi-país/idioma).
>
> Ninguno avanza solo: las trenzas (§final) dicen qué etapa de un arco
> bloquea a cuál del otro.
>
> **Criterio de cierre de toda etapa:** gates founder en dispositivo +
> al menos un evento/movimiento real depositado por el flujo nuevo +
> vara UX MoeGo+ sostenida.

---

## Decisiones de S49 que anclan esta ruta

- **Tienda v1 = VTEX**, post cierre del portal prestadores → A6.
- **Reuniones con vets = co-diseño F0 en curso** → alimentan A3.
- **La experiencia de la superapp se diseña antes de construir la UI
  del dueño** → nace A0.
- **MODELO_LOYALTY.md llamado** → nace en A0, partiendo del
  relevamiento de la gamificación EXISTENTE (hallazgo B0).
- **Cobro in-app desde el día 1** (founder S49): el primer loop de
  servicio ya cobra dentro de la app. A2 no cierra sin B2.
- **Español + inglés desde el inicio** (founder S49): i18n es RIEL de
  arquitectura (B1), no feature posterior. Cero strings crudos en
  pantallas nuevas desde que el riel exista.
- **Hallazgo S49 — el admin vive en el MISMO proyecto Supabase**
  (`zyltipqscdsdsxnjclhp`): la operación existente (pedidos+Kushki,
  cupones/campañas, gamificación, Prime multi-país, `country_config`,
  liquidaciones, logística, notificaciones, roles, beta users) se
  CONECTA y ALINEA — no se reinventa.

---

# ARCO A — EXPERIENCIA

## A0 — Arquitectura de la Experiencia (sesión dedicada, próxima)

**Entrega:** `DISEÑO_EXPERIENCIA.md` (tesis del Home, mapa de
navegación, modelo de descubrimiento, capa de loyalty) +
`MODELO_LOYALTY.md` + **prototipo navegable** (Claude Design) gateado
por el founder.

**Por qué primero:** el design system son los ladrillos, no la casa.
Las decisiones de Home y navegación moldean TODA la UI posterior.

**Tesis de partida del arquitecto (a debatir):** (1) el Home es el
estado del hogar, no una grilla de servicios — los servicios se
ofrecen EN CONTEXTO; (2) el descubrimiento es la revelación progresiva
(§6.4) — las funciones aparecen cuando el momento vital las pide;
(3) loyalty anclado al CUIDADO, no a la compra — límite duro §8, el
memorial JAMÁS gamificado.

**Precondición nueva (del hallazgo B0):** relevamiento de la
gamificación existente en DB (puntos/logros/niveles/RPC
`otorgar_puntos`) — MODELO_LOYALTY decide qué conserva, qué rediseña
y qué jubila. Dos sistemas de lealtad en la misma DB está prohibido.

**Contraste:** Capas 1-3 + §6.4 + §8. **Test del ecosistema:** la
arquitectura hace que alimentar el expediente sea el camino de menor
esfuerzo. **Doble uso:** ensayo S2a con Kary + material F0 vets.

## A1 — El hogar completo y el expediente que se ve

Multi-mascota (el hogar, no una lista) + identidad 5D visible junto a
la Línea de Vida. **Por qué:** sin el sujeto completo, nada tiene
dónde caer; construye sobre S45-S48. **Transversal que entra acá:**
M0/causas — refugios visibles con adopción y donaciones (§8.9). Las
donaciones nacen como el financiero manda: passthrough Kushki con
proceso manual v1 (Decisión D) — la plataforma no gana con donaciones.
**Contraste:** §3.1 + §4. **Test:** una app = toda la familia; la
identidad se carga porque el dueño QUIERE.

## A2 — El primer loop vivo: paseo agendable por el dueño 🔗 B2

El dueño agenda paseo → el prestador ejecuta con lo construido en S44
→ el evento cae al expediente → **y COBRA in-app** (decisión founder).
**Por qué:** camino más corto a dos actores girando de verdad; el
paseo es el evento más rico ya depositado. **Trenza dura:** esta etapa
NO cierra sin B2 (pago del servicio). **Contraste:** §3.2.3 (paseador
●●● M3) + §3.2.0. **Test:** agendar y pagar en tres toques; el
expediente se alimenta solo.

> **HITO S57 (12-13 Jul 2026): el paseo quedó FUNCIONALMENTE COMPLETO**
> — suelto (con cancelación/reagenda P18), plan mensual, paquete de
> salidas del hogar (v1.4, especie por servicio), agenda futura del
> prestador y vacaciones. Gates felices del founder: PERFECTOS.
> **EL ORDEN DEL CIERRE (corrección founder S57, EN PIEDRA — enmienda
> al principio de secuencia S54):** un servicio se declara CERRADO solo
> funcional Y VISUALMENTE. Secuencia obligada: 1º gates de ESPERA +
> curas (D-365) → 2º PASADA DE ACABADOS (capa de craft firmada, Leyes
> 14-20 + diccionario + pantallas patrón; insumos: notas literales del
> founder S57 + notas de Kary cuando existan) → 3º CORRIDA E2E como
> JUEZ FINAL (guion en poder del founder, enmendado a letra v1.4) →
> 4º recién ahí se abre el siguiente servicio (A3).
>
> **ESTADO AL CIERRE S59 (13-14 Jul 2026):** pasos 1º y 2º CUMPLIDOS —
> gates de espera VERDES (D-365 ✅) y la pasada de acabados ejecutada
> (S58) + el AFINADO y EL DURANTE construidos (S59, MODELO_PASEO v1.5
> §7). **El paso 3º — la CORRIDA E2E como juez — dio VERDE: veredicto
> founder S60-arranque. EL PASEO SE DECLARA CERRADO. Toda falla futura
> entra como tanda de curas anotadas, no reabre el servicio.**
> *(Enmienda S60 sobre la rama conservadora L-142 asentada al cierre
> S59.)* Nota de secuencia declarada: A4 (grooming) abrió
> su FUNDACIÓN en S59 por letra firmada del founder — la excepción a la
> secuencia es del dueño de la secuencia.

## A3 — El vet: agenda, adopción de caso, telemedicina

JTBD-1/2 + adopción de caso clínico (§3.2.4, EL diferenciador).
Telemedicina: en el destino, tanda posterior (nota S66 en
SOFTLAUNCH §2).

**EN CURSO desde S66:** la letra vive en `docs/MODELO_VETERINARIA.md`
v1.0 (FIRMADA founder S66) — ese doc es EL CONTRATO de esta etapa Y
porta el MODELO DE ACTOR de plataforma (PARTE I: negocio contenedor,
ocupación por persona, concurrencia por servicio) cuya fundación V0
es la tanda más transversal de la etapa (toca el motor de los 4
oficios vivos).

**Precondición F0: CUMPLIDA (enmienda S66)** — base de discovery
declarada: conversaciones directas del founder con vets, SIN
transcripción literal (la síntesis del founder es la fuente
primaria; hallazgos: no quieren otra HC con recordatorios; los
mejores gestionan el negocio). La red de seguridad es la
precondición de APERTURA del modelo (§14.3): conversación con
vet/clínica real BLOQUEANTE para desmarcar seeds.

Esqueleto de tandas: V0 fundación (modelo de actor en motor +
procedencia + curas) · V1 oferta del negocio · V2 reserva del dueño
· V3 mostrador walk-in · V4 Durante clínico (nota IA + caso +
presupuesto) · V5 parte y sedimento · V6 SRI (D-419 prioridad,
founder S66). Orden fino al arrancar cada tanda.

**Test:** el expediente se alimenta porque al vet LE SIRVE — y el
negocio cobra adentro porque es MÁS FÁCIL que afuera.

## A4 — Grooming lado dueño — EN CURSO (S59)

JTBD-3 agendable, con señal clínica cruzada (§3.2.6). **Precondición
honesta:** relevamiento de qué falta portar del portal web congelado
(en el monorepo móvil lo vivo es paseo). Cobra con la infra de B2.

> **EN CURSO desde S59:** la letra vive en `docs/MODELO_GROOMING.md`
> v1.0 (FIRMADA founder S59) — ese doc es EL CONTRATO de esta etapa:
> menú de dos capas, precio servicio × talla + extra pelaje, chasis de
> reserva/cobro del paseo entero, Antes/Durante/Después v1, local
> primero (domicilio D-380), recurrencia v2. Fundación DB = migración
> S59-A3 (L-140 grooming + devengo al cierre + especies perro/gato +
> estructura de oferta y perfil). La señal clínica cruzada automática
> es D-383 (grooming-2). La conversación con el groomer real sigue
> BLOQUEANTE para abrir a prestadores reales, no para construir (§10.3
> del modelo).
>
> **ESTADO AL CIERRE S59:** el LADO PRESTADOR está VIVO — wizard de 2
> pasos (tallas/precios/extra + horarios, sección COMPARTIDA con el
> paseo), el mundo Grooming abierto en Negocio, y el COBRO ya resuelve
> por talla del perfil + extra con snapshot congelado (migración
> `20260714000000`, asserts 6/6). **FALTA la reserva del DUEÑO**
> (momento-primero adaptado: servicio→hora, la duración es
> consecuencia; talla del perfil con pregunta si NULL; checkout del
> chasis) — Bloque 1 del arranque S60. Curas B6 del gate del founder
> en cola de la B.

## A5 — Producto-que-sabe, después el coach

(1) Motor de alertas básico (§3.2.5) — primer caso real: dosis del
carnet vencida → alerta con acción en contexto. (2) Coach de IA que
conoce a SUS mascotas, SOBRE el expediente sedimentado. **Convicción
ratificada:** el coach rinde en proporción al expediente; el
producto-que-sabe demuestra inteligencia antes de conversar.

## A6 — Tienda VTEX y cierre del soft launch

JTBD-5 integrada al expediente (compra = evento nutricional), post
portal prestadores. + "Próximamente honesto" definitivo. **Nota:** la
cadena pedidos→Kushki→envíos→devoluciones YA existe operada por el
admin — esta etapa la conecta a la experiencia del dueño, no la crea.

---

# ARCO B — OPERACIÓN

## B0 — Relevamiento y gobernanza de lo que YA opera

**Entrega:** mapa verificado (Code, contra DB viva) de la operación
existente: qué tablas/RPCs/vistas usa el admin, qué policies `admin_*`
viven, qué se reutiliza tal cual, qué se alinea, qué se jubila. Y la
**decisión de gobernanza**: el admin escribe con `supabase.from()`
directo mientras el monorepo manda puerta única RPC — se decide
mirándolo (perfil de riesgo de backoffice ≠ app pública), no se
hereda sin verlo. **Por qué primero:** todo el arco B construye sobre
esto; relevar mal acá = pagar en cada etapa. **Incluye:** estado real
de Kushki (¿qué flujos cobra hoy?, ¿solo pedidos o también
suscripciones?), gamificación, notificaciones, country_config, y el
**contraste DB viva vs MODELO_FINANCIERO §10** (el doc dice qué tablas
esperan datos y qué seeds viven — el doc es de mayo, la DB manda).
Nota menor detectada: el Financiero del admin grafica "revenue neto
14%" fijo mientras los fees son parametrizables por rol/país — se
anota para corregir en B3.

## B1 — Rieles del día 1: idioma, país, cuenta

**Entrega:** (a) **i18n es/en** en ambas apps — infraestructura +
extracción de strings existentes + regla de casa: cero texto crudo en
pantallas nuevas (la voz humana del design system se escribe en ambos
idiomas); (b) **multi-país como riel**: `country_config` como fuente
de verdad de moneda/formato/servicios activos por país (F1 = Ecuador,
rieles listos para Colombia — §7.2/§7.3); (c) **ciclo de cuenta
completo**: configuración de cuenta, edición de perfil, cambio de
contraseña, **eliminación de cuenta** (requisito de Play Store/App
Store, no opcional), preferencias de notificaciones (conectadas a la
config que el admin ya administra); (d) **auth real del prestador**
(hoy dev-only, D-290). **Por qué acá:** retrofitear i18n o multi-país
es reescribir; se paga barato ahora o carísimo después.

## B2 — Pagos in-app v1 🔗 A2

**El motor YA existe** (MODELO_FINANCIERO: schema implementado,
fórmula universal GMV = Kushki + Plataforma + Payout, fees seedeados —
prestador 15% EC/CO —, funciones core, Kushki Fase 1 = cuenta master +
liquidación manual). **Lo que esta etapa construye es lo que el propio
doc declara no resuelto (§12):**
1. **La UX del cobro de cita en la app** (diseño nuestro, con A0):
   Kushki desde el cliente, camino triste digno — rechazo, reintento,
   timeout con voz honesta (L-139 aplica a pagos más que a nada).
2. **El wiring de citas pagadas** → `crear_evento_economico()` (sprint
   3.1.B.3 del modelo — "cuando el flujo de cobro exista en app": esta
   etapa ES ese cuándo). Regla dura §7: SOLO vía funciones core, jamás
   INSERT directo — coherente con la puerta única del monorepo.
3. **El wizard de cuenta comercial del prestador** (§6.5, TODO CRÍTICO
   del modelo): identificación fiscal + país al inicio, detección de
   cuenta existente, datos bancarios una sola vez, admin activa. Sin
   cuenta comercial activa el prestador NO puede cobrar — es
   precondición de la liquidación, no un nice-to-have.
4. **Vista de liquidaciones del prestador** (sprint 3.1.D): el que
   trabaja ve lo que va a cobrar, con desglose.
**Momento del cobro — CERRADO (founder S49, ratifica regla previa del
ecosistema):** agendar crea un **bloqueo temporal de agenda** (como la
reserva de un viaje: hold con expiración); el **pago confirma la cita**
y recién ahí es firme y visible como cita para el prestador. Sin pago,
el bloqueo expira y la agenda se libera. El devengo de la comisión
sigue siendo el del modelo (cita completada y pagada). Tarea B0:
localizar el texto canónico previo de esta regla (probable
PORTAL_PRESTADOR.md o docs del repo congelado) y citarlo.
**Por qué:** decisión founder — el pago es parte del wow y el dato que
alimenta todo el financiero; posponerlo crea hábito de pago-por-fuera.

**ENMIENDA S54 (founder) — principio de secuencia:** un servicio que se
abre se deja **COMPLETO — pagos incluidos — antes de abrir el
siguiente**. Corolario inmediato: el **paquete mensual de paseo**
(bono/serie sobre el mecanismo existente `bono_id`/
`suscripcion_servicio_id`, T9/enmienda) es el SIGUIENTE bloque del arco
paseo — no una etapa aparte del final de la ruta.

**ESTADO S54 — B2 SUSTANCIALMENTE EJECUTADA (motor + UX):** hold de 15
minutos sobre el esqueleto v2 formalizado (dos ciclos: `estado` = cita,
`estado_reserva` = pago con CHECK e invariante "'pagada' ⟺ pasó por
confirmar_cita_pagada"; expiración PEREZOSA como correctitud + cron de
higiene) · flujo MOMENTO-PRIMERO (decisión founder S54: el dueño dice
CUÁNDO y recién ahí ve QUIÉNES pueden — con la regla "no se oferta
quien no puede cobrar": cuenta comercial activa) · checkout mono-ítem
con forma de carrito y **cobro SIMULADO declarado en superficie** ·
devengo VARIANTE (b): el evento económico nace al CERRAR con calidad
(`fecha_devengo` = cierre, `fecha_cobro_kushki` = pago) por la puerta
única · wizard de cuenta comercial + Cobros del prestador (S54-B) ·
gate doble de verdad firme probado (el hold es invisible al prestador;
el pago la vuelve visible — sin tocar el wrapper de agenda).
**PENDIENTE de B2:** Kushki REAL (el simulador es el placeholder
honesto — mismo contrato de estados) y la vista de liquidaciones con
desglose (3.1.D). Tarea B0 del texto canónico: RESUELTA en S54-B2.0-T7
(el precedente literal vive en e-petplace-v2, no en PORTAL_PRESTADOR).

**HUECO HONESTO (b) — captura de demanda:** "Nadie puede a esa hora"
hoy NO registra la demanda insatisfecha (qué ventanas pidió la gente
que nadie cubrió). Ese dato vale oro para reclutar paseadores donde
hace falta. Disparo: primeros dueños reales usando el CUÁNDO.

## B3 — Modelo financiero operativo

**Las comisiones YA están firmadas en datos** (fee_configs seedeadas
con auditoría activa) — esta etapa no las diseña: **opera el motor**.
**Entrega:** conciliación de servicios + pedidos unificada, reportes
que el founder usa de verdad (Financiero/Inversores del admin como
base, corrigiendo el 14% fijo detectado en B0), liquidaciones
consolidadas corriendo con desglose por rol (sprint 3.1.C), y los
TODOs del modelo secuenciados como el propio doc manda: retenciones
fiscales = post soft launch, holdback y cron de diferidos con disparo
explícito. **Prime — decisión founder S49 CERRADA:** el sistema queda
PREPARADO (la infra existe: planes, precios por país, historial de
pagos, suscripción como revenue puro en el mapa del modelo) pero el
soft launch NACE SIN Prime — vive en "Próximamente honesto" y se
enciende cuando haya evangelistas, sin refactor. **Por qué acá:** con
B2 cobrando, el financiero pasa de teórico a operativo.

## B4 — Promos, cupones y notificaciones conectadas al cliente 🔗 A0

**Entrega:** el motor de cupones/campañas del admin llega a la app
(aplicar cupón al pagar — se monta sobre B2), y las notificaciones
existentes (11 tipos × 4 canales) llegan de verdad al teléfono del
dueño (push + in-app con permisos bien pedidos). **Trenza con A0:**
las promos y el loyalty diseñado en MODELO_LOYALTY comparten motor —
acá se implementa lo que A0 diseñó, sobre la gamificación relevada
en B0. **Por qué acá:** promos sin pagos in-app no tienen dónde
aplicarse; después de B2 son palanca de crecimiento real.

## B5 — Post-venta de servicios

**Entrega:** cancelación y reagendamiento self-service del dueño (el
admin ya reagenda con slots — falta el lado dueño), reembolso de
servicio (la infra de devoluciones existe para pedidos — se extiende),
calificaciones post-servicio alimentando la reputación (semilla de
Capa 3), y canal de ayuda/soporte digno (hoy hay chat-ayuda sin
fuente en repo — se resuelve o se reemplaza). **Por qué:** el soft
launch con dueños reales GENERA casos tristes desde el día 1; sin
post-venta, cada uno es un WhatsApp tuyo.

## B6 — Publicación y compuerta del launch

**Entrega:** cumplimiento de tiendas (política de privacidad,
permisos declarados, eliminación de cuenta de B1), **beta gate** (el
sistema `beta_users` existente como compuerta del soft launch
controlado), EAS submit (despierta D-285 iOS), y el checklist de
salida. **Por qué al final del arco:** es la puerta, no el camino —
pero se prepara con tiempo porque las reviews de tienda tardan.

---

## LAS TRENZAS (qué bloquea a qué)

- **A2 ⇄ B2:** el primer loop cobra in-app — ninguno cierra solo.
- **A0 ⇄ B0:** MODELO_LOYALTY parte del relevamiento de la
  gamificación existente.
- **B1 precede a toda UI nueva de A1+:** desde que el riel i18n
  existe, cero strings crudos (las pantallas de A1 nacen bilingües).
- **B4 después de B2** (cupones se aplican al pagar) y **después de
  A0** (implementa el loyalty diseñado). (hallazgo B0c: el motor
  compartido promos⇄loyalty hoy NO existe en DB — cero FKs cruzadas;
  B4 lo CONSTRUYE sobre el diseño de MODELO_LOYALTY.md, no lo
  conecta)
- **A6 se monta sobre la cadena B0-relevada** (pedidos/Kushki/envíos).
- **B6 al final, preparado temprano** (tiendas tardan).

## Transversales de TODA la ruta

- Vara UX MoeGo+ · ensayos con usuarios reales sobre la APK (S2a con
  Kary primero) · ley del ecosistema como test de toda feature ·
  vocabulario del modelo JAMÁS visible (Ley 3) · null honesto antes
  que verosímil-falso en todo lo que toque plata (extensión L-139).

## Lo que esta ruta NO ordena

El orden fino dentro de cada etapa (backlog al arrancarla), las
deudas D-NNN (viven en `DEUDAS_CANONICAS.md`), el lado seller/refugio
más allá de lo nombrado, y el interleaving temporal exacto entre
arcos (se decide sesión a sesión con las trenzas como ley).

## Historial

- **v2.5 (S66, 16 Jul 2026):** enmienda de A3 (disparada por
  `MODELO_VETERINARIA.md` v1.0 §15.4, letra firmada founder S66):
  **precondición F0 declarada CUMPLIDA** con base de discovery
  declarada (síntesis del founder de conversaciones directas con
  vets, sin transcripción literal; la red de seguridad es §14.3 del
  modelo — conversación con vet/clínica real BLOQUEANTE de apertura)
  · **A3 pasa a EN CURSO** con `MODELO_VETERINARIA.md` como EL
  CONTRATO de la etapa, portando además el MODELO DE ACTOR de
  plataforma (PARTE I) cuya fundación V0 es la tanda más transversal
  (toca los 4 oficios vivos) · **esqueleto de tandas V0-V6** asentado
  en el cuerpo de A3 · **SRI reclasificado a PRIORIDAD post-apertura**
  (D-419, founder S66) · telemedicina: en el destino, tanda posterior
  (nota S66 en SOFTLAUNCH §2 — decisión S48 intacta).
- **v2.4 (S57, 13 Jul 2026):** hito registrado en A2 — el paseo
  FUNCIONALMENTE COMPLETO (suelto+P18, plan, paquete v1.4 del hogar,
  agenda futura, vacaciones) — y **el orden del cierre corregido por el
  founder, en piedra**: funcional no basta; el servicio cierra con
  gates de espera → pasada de acabados (capa de craft) → corrida E2E
  como juez final → recién entonces el siguiente servicio. La frase que
  lo gobierna: *"no podemos crear la casa con la mejor estructura y
  albañilería, con unos acabados que no estén a la altura."*
- **v2.3 (S50, 10 Jul 2026):** única enmienda — nota honesta en la
  trenza A0⇄B0/B4: el motor compartido promos⇄loyalty hoy NO existe
  en DB (hallazgo B0c, cero FKs cruzadas); B4 lo construye sobre el
  diseño de `MODELO_LOYALTY.md`, no lo conecta.
- **v2.2 (S49, 9 Jul 2026):** cerrada la decisión del momento del
  cobro: bloqueo temporal de agenda al agendar, el pago confirma la
  cita (visible/firme para el prestador recién pagada). Ratifica
  regla previa del ecosistema; B0 localiza el texto canónico.
- **v2.1 (S49, 9 Jul 2026):** incorporado `MODELO_FINANCIERO.md` como
  contraste obligatorio del Arco B. B2/B3 corregidas: el motor
  financiero está implementado (schema, fees seedeados, funciones
  core) — el trabajo es UX del cobro + wiring de citas (sprint
  3.1.B.3) + wizard de cuenta comercial (§6.5 TODO CRÍTICO) + operar
  liquidaciones; no diseñar el motor. Prime cerrada: preparado, nace
  apagado. Decisión abierta registrada: momento del cobro al dueño.
- **v2.0 (S49, 9 Jul 2026):** reescritura con dos arcos tras detección
  del founder (la v1 trazaba solo experiencia). Decisiones: cobro
  in-app día 1, es/en desde el inicio, hallazgo admin en el mismo
  proyecto Supabase. Enmienda gemela en DEFINICION_SOFTLAUNCH (§ de
  operación).
- **v1.0 (S49):** trazado inicial, solo arco de experiencia.
