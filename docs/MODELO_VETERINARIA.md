# MODELO_VETERINARIA — El contrato del oficio veterinario y del modelo de actor

> **Versión: v1.0 — S66 (16 Jul 2026).** Letra FIRMADA por el founder
> (decisiones D1-D8 + adiciones de mesa resueltas en sesión
> founder+arquitecto S66), dictada por el arquitecto (escritor único de
> docs, regla 76 — el commit lo hace la Sesión A).
> **Base de discovery declarada:** conversaciones directas del founder
> con veterinarios (S65→S66), SIN transcripción literal — la síntesis
> del founder es la fuente primaria disponible. Hallazgos de dirección:
> (1) los vets NO quieren otra historia clínica con recordatorios;
> (2) los mejor calificados gestionan EL NEGOCIO, no una agenda de
> citas. La precondición F0 de RUTA_F1 §A3 se da por CUMPLIDA con esta
> base (enmienda registrada en RUTA_F1). La red de seguridad es §14.3:
> la conversación con vet/clínica REAL sigue BLOQUEANTE de apertura.
> **Investigación de mercado (arquitecto, S66):** regional — OkVet
> (freemium+DIAN), Vetlogy (SaaS 10 países), VetEase (SRI Ecuador);
> global — ezyVet/Shepherd (~$299/doctor/mes), Digitail (AI-native).
> TODOS venden herramienta de un actor mirando hacia adentro; NINGUNO
> conecta al dueño ni piensa la rentabilidad del negocio. Precedente de
> modelo: Fresha/Toast — software gratis, monetización por el flujo
> transaccional (Toast: 5:1 fintech:software).
> **Contrastes obligatorios:** `MODELO_FINANCIERO.md` (el camino de la
> plata rige sin excepción; este doc dispara sus enmiendas §15.1),
> `MODELO_PRODUCTO.md` §3.2.4 (adopción de caso — EL diferenciador) y
> §2.5 (enmendado por este doc, §15.2), `MODELO_PASEO.md` /
> `MODELO_GROOMING.md` / `MODELO_ADIESTRAMIENTO.md` (el chasis probado
> 4 veces que este oficio HEREDA), `BIO_EXPEDIENTE.md` Eje 3 y
> §Actores, `DEFINICION_SOFTLAUNCH.md` §2/§3 (telemedicina: §15.3),
> `POLITICAS_EPETPLACE.md`, `DISEÑO_EXPERIENCIA.md` (gramática
> canónica, verdad firme), `DIRECCION_ARTE.md` (el estetoscopio escucha
> a la huella).
> **Realidad relevada:** Bloque 0 S66 (4 reportes literales de Code) —
> este doc decide sobre ese piso (L-141/L-144).
>
> **Qué es este doc:** DOS letras en una. La PARTE I es el MODELO DE
> ACTOR (negocio contenedor / persona) — nace acá porque el vet lo
> fuerza, pero es letra de PLATAFORMA: candidata a extraerse como doc
> transversal cuando el segundo oficio la pida. La PARTE II es el
> oficio veterinario: qué se vende, cómo cobra la plataforma, qué
> registra el vet y qué ve la familia. Lo cerrado, cerrado está; los
> huecos se declaran con su disparo. Ninguna feature vet nace
> contradiciendo este contrato.

---

# PARTE I — EL MODELO DE ACTOR (letra de plataforma)

## 1. El principio: negocio contenedor, persona = negocio de 1

**No hay dos tipos de prestador. Hay UN modelo:** la cuenta comercial
(entidad fiscal, `MODELO_FINANCIERO` §2.6) es el NEGOCIO, y tiene 1..N
**personas** ejerciendo oficios bajo ella. La persona natural con
negocio propio (groomer, paseador, adiestrador, vet independiente) es
el **caso degenerado de negocio con staff = 1** — no un tipo aparte.

Corolarios firmados (founder S66):

- **El independiente que crece contrata gente SIN migrar de tipo de
  cuenta** — cero refactor, cero fricción, ni se entera de que el
  modelo soporta más.
- **Todos los servicios individuales pueden agruparse en un negocio, y
  los servicios del negocio pueden prestarse individualmente** — el
  tránsito es bidireccional por diseño.
- **La complejidad de dos niveles JAMÁS se exporta al usuario** (test
  de este modelo, hallazgo de campo del founder: la gente quiere el
  menor esfuerzo posible). El dueño reserva sin saber ni importarle si
  del otro lado hay empresa o persona. El prestador se registra sin
  que nadie le pregunte "¿sos persona natural o negocio?" — nace
  clínica-de-uno. Si una pantalla obliga a entender la distinción, la
  pantalla está mal.

## 2. Vitrina del negocio, ocupación de la persona

- **El negocio decide qué expone** (founder S66): configura si el
  dueño reserva "con el negocio" o "con la persona". N=1 colapsa solo.
- **La ocupación es de la PERSONA** — las manos y la silla son de
  alguien concreto. El motor de ventana pasa a ocupar por persona
  (`empleado_id`, que YA existe en `prestador_horarios` y
  `evento_atencion` — relevamiento S66: hoy el motor lo ignora y los
  wrappers filtran `.is('empleado_id', null)`; esa conspiración de
  NULLs se cura en la fundación, §16-V0).
- **Reserva "con el negocio":** el CUÁNDO muestra la unión de ventanas
  libres de las personas habilitadas para ese servicio; al confirmar,
  el sistema fija una persona concreta en el hold (la disponible; a
  igualdad, menor carga del día). El dueño no lo ve; adentro la cita
  SIEMPRE tiene persona desde el primer segundo. Cero citas huérfanas.
- **Reasignación interna = derecho del negocio:** hasta que la
  atención empieza, el negocio puede mover la cita a otra persona
  habilitada, sin notificar al dueño — SALVO que el dueño haya elegido
  persona explícitamente: ahí SÍ se le avisa (eligió a alguien; la
  verdad firme es con ese alguien).
- **Horarios:** los administra el NEGOCIO (su staff, su operación),
  con delegación opcional a cada persona. Default v1: administra el
  negocio. El independiente edita "sus horarios" como siempre.

## 3. Concurrencia declarada por servicio

"Una persona, una atención" NO es principio de plataforma — es el caso
particular del vet (founder S66: "puede depender del servicio
brindado"). Cada servicio comprable declara su **semántica de
concurrencia**:

1. **EXCLUSIVA (C=1):** la atención toma a la persona entera.
   Consulta vet, grooming, sesión de adiestramiento. **Default de
   plataforma** — servicio que no declara, es exclusivo.
2. **POR CUPO (C=N):** la persona atiende N sujetos simultáneos del
   MISMO servicio. Caso vivo: el paseo grupal (DM-S38.1 ya lo intuyó:
   "cada perro tiene SU cita; la ruta es agrupación operativa" — eso
   ES cupo). Las clases grupales de adiestramiento (diferido §9 de su
   modelo) caen acá cuando disparen. El cupo lo declara el prestador
   dentro de un techo de plataforma.

**Regla de mezcla:** la ocupación compartida solo comparte con su
propio grupo. Una persona a una hora dada está: libre, o en UNA
atención exclusiva, o en UN grupo de un mismo servicio con cupo
disponible. Jamás mezcla. Para el motor es una generalización limpia:
"¿libre?" pasa a "¿libre, o compartible con este mismo servicio y con
cupo?". C=1 colapsa a la pregunta de hoy — los cuatro oficios cerrados
no se mueven.

**Huecos declarados con disparo:**
- **Ocupación por CAPACIDAD DE LUGAR** (estadía: caniles, no manos) —
  tercera semántica NO modelada. Disparo: el primer servicio de
  estadía que abra (hotel vive en "próximamente honesto").
- **Recursos físicos** (quirófano, rayos, tina): v1 NO se modelan — el
  negocio administra con criterio humano cuánto simultáneo aguanta su
  infraestructura. Disparo: la primera clínica real que choque.

## 4. Reputación de dos capas, con snapshot

- **La persona:** solo se miden las suyas. **El negocio:** el agregado
  de los servicios prestados bajo su techo (founder S66).
- **Snapshot histórico (founder S66):** cuando una persona se va, sus
  calificaciones NO se van del agregado del negocio (esos servicios
  ocurrieron bajo su techo y su gestión) — y la persona se lleva su
  agregado personal a donde vaya. Nadie pierde historia; ningún
  negocio se desploma porque se fue su estrella.
- Implementación: el evento de calificación porta SIEMPRE los dos
  sujetos (negocio + persona ejecutante — el `empleado_id` del chasis
  lo da gratis). `prestador_resenas` tiene 0 filas (relevamiento):
  gana `empleado_id` AHORA, sin backfill, sin drama.

## 5. Multi-rol y multi-sede

- **La clínica que vende Despensa** (founder S66): resuelto por
  §2.6 del FINANCIERO — la cuenta agrega el rol seller: mismo RUC,
  liquidación consolidada con desglose por rol. Se declara como
  **camino esperado**, no excepción.
- **Multi-sede:** la multiplicidad vive en cuenta→sedes y
  cuenta→personas, NO en humano→filas de prestador. El choque
  relevado (§2.7 del FINANCIERO decía `user_id` no-UNIQUE; la DB tiene
  `uq_prestadores_user_id`) se resuelve: **el índice GANA** — §2.7 se
  reescribe sobre este modelo (enmienda §15.1). Humano→prestador
  queda 1:1.

---

# PARTE II — EL OFICIO VETERINARIO

## 6. El menú v1 (comprable ≠ registrable, aplicado a medicina)

**Comprables desde la vitrina (v1):**

- **Consulta** (`consulta_general`) — la unidad madre. El "control" es
  narrativa de la consulta, no comprable aparte.
- **Vacunación** (`vacunacion`).

**Comprables desde la CONSULTA, no desde la vitrina:**

- **Procedimientos de catálogo libre del negocio** (nombre + precio,
  sin taxonomía de plataforma más allá de "procedimiento"): cirugía,
  ecografía, radiografía, laboratorio, certificados. Los tipos
  sembrados (`cirugia`, `ecografia`, `radiografia`, `laboratorio`,
  `certificado_*`, `vacunacion_internacional`) quedan ACTIVOS como
  vocabulario declarativo pero NO reservables por el dueño en v1 — se
  llega a ellos por el PRESUPUESTO (§8). Fundamento: medicina tiene
  más variabilidad que peluquería; forzar matriz de plataforma sería
  trabajo difícil exportado al vet.

**Fuera de v1, honesto:**

- **Emergencia:** promete disponibilidad que no podemos garantizar —
  "próximamente honesto".
- **Telemedicina:** fuera de ESTE modelo, DENTRO del destino (§15.3).

**Registrables (vocabulario del Durante — jamás se venden sueltos):**
diagnóstico, medicación prescrita, examen, vacuna aplicada — los tipos
de evento del Eje 3 que el Bio-Expediente definió desde S12-S16. El
vet no inaugura vocabulario: hereda el del expediente.

**El caso clínico NO es un registrable más:** es la unidad que AGRUPA
consultas (§10). El dueño compra "consulta"; el vet, al atenderla, la
asocia a un caso nuevo o existente — o a ninguno.

## 7. EL MOSTRADOR — el flujo walk-in (construcción v1, no diferida)

**El punto ciego que define el modelo:** la mayoría del tráfico de una
clínica real NO reserva — entra caminando. Si la plataforma solo ve lo
agendado, la clínica vive en dos sistemas, el reporte de rentabilidad
queda incompleto — y un reporte incompleto no es gancho, es juguete.
La tesis Fresha/Toast se sostiene solo si el flujo ENTERO pasa por
adentro.

**El flujo de mostrador:** el negocio registra y cobra una atención
walk-in EN EL MOMENTO — cita nacida FIRME desde el mostrador (sin
hold, sin momento-primero), con persona asignada, mismo devengo
variante (b), misma comisión, mismo sedimento al Eje 3. Es un camino
de CREACIÓN nuevo sobre el chasis existente, no un chasis nuevo. Si la
mascota/familia no existe aún en la plataforma, el mostrador la da de
alta mínima (la clínica como puerta de entrada de familias — el
ecosistema alimentando al ecosistema).

## 8. EL PRESUPUESTO CLÍNICO (primitiva nueva)

El flujo médico real: consulta → diagnóstico → "hay que operar, cuesta
X" → la familia decide. Ese objeto no existe en ningún oficio
anterior y es LA transacción grande del vet.

**v1:** desde una consulta (o el mostrador), el vet emite un
**presupuesto** (ítems del catálogo libre + precio); la familia lo
APRUEBA en su app; la aprobación agenda la cita de procedimiento con
**precio congelado** (snapshot — el patrón de la casa). Sin aprobación
no hay cita. El presupuesto vencido expira sereno.

## 9. RESERVA Y COBRO: el chasis heredado + la escalera gratis→comisión

**Chasis entero, sin mecanismos nuevos de plata:** gramática canónica
(mascota→qué→día→hora→quién→pagar; el "quién" respeta §2) ·
momento-primero · hold 15' con expiración perezosa · regla 7.13 · pago
simulado DECLARADO hasta Kushki · **devengo al CIERRE, variante (b)** ·
**fee 15% genérico existente** (`fee_configs` fila
prestador_servicios/cita EC — SIN fila nueva, SIN tocar el enum;
`categoria_origen` queda como palanca si algún día el vet negocia
distinto) · duración declarada por el negocio por servicio, pasos de
15'.

**La escalera gratis→comisión (founder S66, tesis ratificada):**

- **GRATIS, para siempre, TODO lo que hace que la transacción pase por
  la plataforma:** agenda, historia del caso, recordatorios, reporte
  de rentabilidad básico. **Jamás se cobra — es el candado.** Ningún
  competidor lo regala porque para ellos ES el producto.
- **El candado positivo:** el reporte de rentabilidad se llena
  COMPLETO solo con los cobros que pasaron por la plataforma. Cobrar
  adentro es más fácil que afuera — sin fricción forzada.
- **COMISIONA:** la cita completada y pagada. 15% genérico.
- **PREMIUM candidato (founder S66 — el sistema lo contempla, v1 no lo
  dibuja):** lo que va MÁS ALLÁ de la transacción (analítica avanzada,
  marketing a su cartera, multi-sede avanzado). La infra existe
  (`revenue_stream`, suscripciones Prime preparadas-apagadas). Nace
  como principio declarado con CERO features premium en v1 — nada se
  dibuja apagado.
- **Gratis+comisión se declara PATRÓN DE PLATAFORMA para todo
  prestador** (founder S66): los otros tres oficios ya lo eran de
  hecho — el vet solo lo hizo visible, por ser el primer oficio con
  competencia de herramienta. Enmienda al FINANCIERO §15.1.

## 10. LA ADOPCIÓN DE CASO CLÍNICO — forma v1

Sobre el schema D-136 existente (`caso_clinico`: 0 filas, cero RPCs —
se construye el negocio, no la tabla):

- **El caso es del PET PARENT** (founder S66): la plataforma no decide
  dónde se atiende la mascota — la familia decide. Coherencia con
  §8.1 del MODELO_PRODUCTO (la mascota es dueña de su vida
  documentada; el expediente viaja con ella SIEMPRE).
- **Doble referencia:** el caso porta CLÍNICA (cuenta) y DR. TRATANTE
  (persona). La adopción es de la persona (§3.2.4: identidad
  profesional); la plata es de la cuenta.
- **Transferencia = handshake único:** si la familia sigue al médico
  que se independizó, el caso se transfiere a su clínica-de-uno nueva;
  si se queda, mismo handshake con dr. nuevo en la misma clínica.
  Ningún camino es especial. Corolario estratégico: e-PetPlace no le
  facilita la cartera a nadie — le da a la familia lo que ya era suyo.
- **v1:** abrir/continuar caso desde el Durante · casos activos en el
  Antes del vet · el caso visible en el timeline del dueño · tablas
  tipadas para `caso_clinico_abierto/cerrado/transferido` (hoy en
  catálogo SIN tabla — relevamiento) · **cura de la policy
  `caso_clinico_insert_vet` ANTES de UI** (hoy no valida relación con
  la mascota — deuda §16).
- **v2 con disparo:** el motor de alertas por horizonte vencido
  (§3.2.5 — "el sistema persigue el caso") comparte infra con
  loyalty/revelaciones; se construye una vez, en su tanda.

## 11. ANTES / DURANTE / DESPUÉS — con la IA como respuesta al discovery

- **ANTES — el resumen destilado:** vista filtrada Eje 3 completo
  (BIO §A2: el vet ve todo lo de salud + contexto de cuidado externo)
  + casos activos + **resumen IA** cuando el expediente es largo
  ("Zeus, 4 años, alergia activa en tratamiento con X, última consulta
  hace 3 meses"). Los 30 segundos del Antes, de verdad.
- **DURANTE — LA NOTA CLÍNICA QUE SE ESCRIBE SOLA (la killer feature,
  respuesta directa al hallazgo "no quieren otra historia clínica"):**
  el vet dicta o habla; la IA estructura (motivo, hallazgos,
  prescripción, próximo control); el vet CONFIRMA. El Durante clínico
  sin teclado. La objeción del discovery convertida en argumento de
  venta. De paso resuelve el vocabulario libre (§12): la IA estructura
  texto libre sin catálogo curado. La captura jamás se exige en
  caliente (regla heredada). El registro alimenta Eje 3 vía puerta
  única; si hay caso, se asocia.
- **DESPUÉS — cierre con piso de calidad:** ≥1 registro clínico + el
  parte a la familia en VOZ HUMANA (jamás jerga cruda — Ley 3:
  "le pusimos la vacuna X; volvé en 3 semanas") + presupuesto si
  nació + próxima consulta SUGERIDA, jamás cita. Devengo al cierre,
  variante (b).
- **La IA del lado dueño:** el Coach ante "mi perro vomitó" orienta
  urgencia y sugiere agendar — **JAMÁS diagnostica** (§8.3, muro
  firmado). **La IA del negocio:** el reporte de rentabilidad con voz
  ("qué servicio te deja más, qué clientes no vuelven hace 6 meses") —
  el socio de gestión del dueño perezoso. **Diferido honesto:**
  alertas de interacciones medicamentosas y razonamiento clínico
  profundo exigen catálogos curados con validación veterinaria (§12) —
  IA sin vocabulario controlado ahí es peligro, no ayuda.

## 12. VOCABULARIO CLÍNICO v1: libre, con UNA excepción

- **v1 SIN catálogos clínicos curados** (relevamiento: no existe
  ninguno — cero `cat_vacunas/diagnosticos/medicamentos/examenes`):
  texto libre + nota, patrón D-382 del grooming. Curar un vademécum
  hoy es trabajo difícil que no le facilita la vida a nadie todavía.
- **EXCEPCIÓN — VACUNAS: catálogo mínimo EC, YA.** El carnet del
  cliente ya escribe `evento_vacuna_aplicada` (único escritor clínico
  vivo — relevamiento 1e); alinear las dos puntas es barato hoy y caro
  después.
- **Catálogos curados = diferido con disparo:** cuando el Coach y las
  alertas cruzadas los necesiten para razonar — se construyen con
  validación veterinaria profesional, no antes.

## 13. PROCEDENCIA de los eventos clínicos + la identidad digital como destino

**El problema (duda del founder, S66, resuelta):** carnet del dueño y
aplicación del vet escriben el MISMO tipo de evento con valor
probatorio distinto. Si se mezclan sin distinguir, el expediente
miente sin querer — y un certificado de viaje no puede emitirse sobre
una vacuna "declarada por foto".

**La solución — NIVEL DE PROCEDENCIA en el evento (se modela YA,
barato hoy, carísimo de retrofitear):**

- `declarado_por_familia` (carnet, nota del dueño) vs
  `verificado_por_prestador` (aplicación/registro directo de un
  prestador validado).
- Voz honesta en superficie: "registrada del carnet" vs "aplicada por
  Clínica X". Jamás se degrada lo declarado — se distingue.
- **Precondición de la procedencia verificada: la VERIFICACIÓN DEL
  VET** (§14.2). Sin vet validado, "verificado" no vale nada.

**La identidad digital de la mascota (destino declarado, founder
S66):** ES, en gran parte, el subconjunto VERIFICADO del expediente —
no un sistema nuevo: una vista certificable de lo que ya sedimenta.
Primer caso de uso real: el certificado de viaje. **Se declara, no se
construye** — deuda con disparo §16.

## 14. PRECONDICIONES (bloqueantes de apertura, no de construcción)

1. **L-140 de nacimiento** en toda función del motor vet; RLS y REVOKE
   patrón de la casa. Las RPCs huérfanas del legado
   (`completar_historia_clinica`, `completar_cita_servicio`) se
   JUBILAN — el motor nace de cero bajo los patrones vigentes; el
   portal congelado es mina de REQUISITOS (los 11 componentes de HC),
   jamás de arquitectura (era consulta-céntrico; el diferenciador es
   caso-céntrico).
2. **Verificación del vet:** título/registro profesional a la cuenta,
   gate admin (`requiere_validacion_admin` existe; el PROCESO se
   construye). Sin esto no hay procedencia verificada ni certificados.
3. **La conversación con vet/clínica REAL** — BLOQUEANTE para
   desmarcar seeds y abrir (patrón §10.3 grooming): valida menú,
   catálogo libre, defaults de duración, el mostrador y la escalera
   gratis→comisión contra vets con nombre y apellido. **Acá se
   contrasta lo firmado sobre la síntesis del founder.**
4. **Importación de historia previa** — camino v1 honesto: adjuntar el
   PDF/foto del historial al expediente (evento con archivo,
   procedencia declarada). Sin esto, el costo de cambio mata la
   adopción. La importación rica es diferida.
5. **La muerte en la clínica — diseño obligado pre-apertura:** el vet
   es el actor que más probablemente registre un fallecimiento.
   `evento_fin_vida` existe modelado; la transición M6 apaga el motor
   de loyalty estructuralmente. Lo que NO existe: el momento en que un
   VET lo registra y qué vive la familia del otro lado. Es la pantalla
   más delicada del oficio — se diseña con gate founder, jamás se
   improvisa.
6. **No-show:** v1 hereda la política existente (P18 como base); la
   política médica propia se escribe con clínicas reales.

## 15. ENMIENDAS QUE ESTE DOC DISPARA (cada una con historial en su doc)

1. **`MODELO_FINANCIERO.md`** (v2.8 → v2.9):
   (a) §2.7 REESCRITO — humano→prestador queda 1:1
   (`uq_prestadores_user_id` GANA sobre la letra vieja); la
   multiplicidad vive en cuenta→sedes y cuenta→personas (modelo de
   actor, PARTE I). (b) §2 gana el principio **gratis+comisión como
   patrón de plataforma para todo prestador** + la línea premium
   (gratis lo transaccional, premium candidato lo que va más allá).
2. **`MODELO_PRODUCTO.md`** §2.5, enmienda a "NO es un CRM
   veterinario": el vet SÍ es cliente del software en las herramientas
   de GESTIÓN DEL NEGOCIO, cuando regalarlas asegura que el cobro pase
   por la plataforma — el criterio deja de ser solo "alimenta el
   expediente" y suma "hace que cobrar adentro sea más fácil que
   afuera". El espíritu del párrafo (no competimos vendiendo licencias
   de CRM) queda intacto: no las vendemos — las regalamos.
3. **`DEFINICION_SOFTLAUNCH.md`** §2, nota: telemedicina SIGUE en el
   destino (JTBD-1/2, decisión S48 intacta) — queda FUERA de
   MODELO_VETERINARIA v1 y entra como tanda propia posterior. El
   destino no se toca; el orden sí (opción (a), founder S66).
4. **`RUTA_F1.md`** §A3: precondición F0 CUMPLIDA con base de
   discovery declarada (síntesis del founder, sin transcripción) +
   esqueleto de tandas (§17) + SRI reclasificado.
5. **`BIO_EXPEDIENTE.md`**: nota de procedencia (§13) en E1/E2 cuando
   su construcción dispare — el campo nace en la fundación V0.

## 16. DEUDAS NUEVAS (numeración A ASIGNAR contra DEUDAS_CANONICAS vivo)

- **D-VET-1 🔴** — Policy `caso_clinico_insert_vet` no valida relación
  cuenta↔mascota. Cura ANTES de cualquier UI de caso (patrón D-314).
- **D-VET-2** — Guard de coherencia `tabla_tipada` ↔ schema real en
  `cat_tipos_evento` (tercera aparición del copy-paste en
  relevamientos; un test/CHECK lo mata para siempre).
- **D-VET-3** — Tabla `facturas` sin origen en migraciones: documentar
  o jubilar (objeto huérfano de historial = drift esperando morder).
- **D-VET-4** — Cuenta comercial sin rol en `cuenta_roles` (anomalía
  de datos relevada; explicar o curar).
- **D-VET-5** — `requiere_resultado=true` en los 11 tipos médicos SIN
  mecanismo: se APAGA honesto en la fundación (L-139); se re-enciende
  cuando la letra de "resultado clínico" exista (candidata: el
  registro del Durante con procedencia verificada alcanza).
- **D-VET-6 🟠 PRIORIDAD (founder S66)** — SRI integrado en la agenda
  (emisión de comprobante desde el cobro): diferido de v1 pero PRIMERA
  tanda post-apertura — el país entero ya factura electrónico
  (transmisión inmediata desde ene-2026), hay proveedores maduros de
  firma/RIDE, y los competidores locales lo tienen. Es integración, no
  invención. Hasta entonces: el vet factura por fuera bajo su RUC
  (obligación legal que YA tiene); e-PetPlace factura solo su comisión
  (espejo white-label §2.3).
- **D-VET-7** — Catálogos clínicos curados con validación veterinaria
  (disparo: Coach/alertas cruzadas los necesiten).
- **D-VET-8** — Identidad digital verificable de la mascota (vista
  certificable del subconjunto verificado; primer caso: certificado de
  viaje). Destino declarado §13.
- **D-VET-9** — Importación rica de historias previas (v1 = PDF
  adjunto honesto, §14.4).
- **D-VET-10** — Ocupación por capacidad de lugar (estadía) y recursos
  físicos como entidad de agenda (§3, huecos con disparo).
- **D-VET-11** — `especies_elegibles` NULL en los 11 tipos médicos:
  muere en la fundación. **Techo del vet = TODAS las especies de
  `cat_especies`** (D7 firmada — el vet es la puerta de los niveles
  B/C del multi-especie); cada negocio acota con
  `especies_compatibles`.
- **D-VET-12** — Reactivación de cartera ("hace 8 meses que Max no
  viene") — el motor de recordatorios apuntando al negocio; candidata
  barata post-v1.
- **Fuera de scope declarado:** comisiones internas del staff (cómo la
  clínica paga a SUS vets es SU problema; el desglose por empleado se
  le regala como dato) · compras a proveedores / Despensa B2B
  (adyacencia de revenue futura, se anota) · inventario, laboratorio,
  hospitalización, multi-vet avanzado (diferidos del arranque,
  ratificados).

## 17. ESQUELETO DE TANDAS (Bloque 2 — orden fino al arrancar cada una)

- **V0 — FUNDACIÓN DB:** modelo de actor en el motor (ocupación por
  persona + semántica de concurrencia; deshacer la conspiración de
  NULLs de `empleado_id` en wrappers) · procedencia en eventos
  clínicos · `empleado_id` en reseñas · curas D-VET-1/5/11 · catálogo
  mínimo de vacunas EC · tablas tipadas de caso. Todo L-140 de
  nacimiento. **Es la tanda más pesada y la más transversal — toca a
  los 4 oficios vivos; regla 76 estricta.**
- **V1 — LA OFERTA DEL NEGOCIO:** wizard vet (personas, servicios del
  menú, catálogo libre de procedimientos, precios, horarios por
  persona, qué expone).
- **V2 — LA RESERVA DEL DUEÑO:** chasis heredado + el "quién" de dos
  niveles (§2).
- **V3 — EL MOSTRADOR:** walk-in con alta mínima de familia (§7).
- **V4 — EL DURANTE CLÍNICO:** nota IA + registrables Eje 3 + caso
  clínico v1 + presupuesto (§8/§10/§11).
- **V5 — EL PARTE Y EL SEDIMENTO:** timeline del dueño, voz humana,
  reputación dos capas.
- **V6 — SRI (D-VET-6, prioridad post-apertura).**

Las trenzas finas y el interleaving con el resto de RUTA_F1 se deciden
sesión a sesión, como manda la ruta.

## 18. LOS TESTS DE TODA FEATURE VET

1. ¿Respeta el modelo de actor — y la complejidad de dos niveles quedó
   ADENTRO (ninguna pantalla obliga a entender negocio vs persona)?
2. ¿La ocupación es de la persona, con su semántica de concurrencia
   declarada, y el motor de ventana quedó generalizado sin romper los
   4 oficios?
3. ¿El menú respeta comprable≠registrable — y los procedimientos
   llegan por presupuesto aprobado, jamás por vitrina v1?
4. ¿El camino de la plata es EL de la casa (hold, 7.13, variante (b),
   fee genérico) — y el mostrador deposita igual que la reserva?
5. ¿Todo lo transaccional-gratis sigue gratis (el candado), y nada
   premium se dibujó apagado?
6. ¿El caso clínico respeta al pet parent (doble referencia, handshake
   único) y la policy está curada antes de su UI?
7. ¿Cada evento clínico porta procedencia — y la voz la dice honesta?
8. ¿La IA estructura y orienta pero JAMÁS diagnostica (§8.3), y nada
   clínico-profundo corre sin catálogo curado?
9. ¿El memorial y el registro de fin de vida pasaron por diseño con
   gate founder — jamás improvisados?
10. ¿Los diferidos siguen declarados con su disparo, o su disparo
    sonó?

## Historial

- **v1.0 (S66, 16 Jul 2026):** redacción inicial con la letra FIRMADA
  del founder (S66): PARTE I — modelo de actor (negocio contenedor,
  persona = negocio de 1; vitrina/ocupación; concurrencia por
  servicio; reputación dos capas con snapshot; multi-rol como camino
  esperado; resolución del choque §2.7 vs índice). PARTE II — menú v1
  (consulta+vacunación en vitrina, procedimientos por presupuesto) ·
  el MOSTRADOR como construcción v1 · el PRESUPUESTO como primitiva ·
  escalera gratis→comisión ratificada como patrón de plataforma con
  línea premium declarada · caso clínico del pet parent (forma v1
  sobre D-136) · Antes/Durante/Después con la nota IA como killer
  feature · vocabulario libre con excepción vacunas · PROCEDENCIA de
  eventos + identidad digital como destino · piso fiscal espejo
  white-label con SRI en prioridad (D-VET-6) · precondiciones
  (verificación del vet, conversación real, importación honesta,
  muerte digna con diseño obligado) · 5 enmiendas disparadas · 12
  deudas nuevas · esqueleto de tandas V0-V6. Base de discovery
  declarada sin transcripción; investigación de mercado del
  arquitecto; realidad relevada Bloque 0 (4 reportes Code).
