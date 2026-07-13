# MODELO_PASEO — El contrato del servicio de paseo

> **Versión: v1.5 — S59 (13 Jul 2026, plan L-V + sugeridos del wizard + §7 EL DURANTE + P19).**
> Decisiones de producto cerradas
> por el founder en sesión; escrito por el arquitecto (escritor único de
> docs, regla 76). **Contrastes obligatorios:** `MODELO_FINANCIERO.md`
> v2.7 (el camino de la plata — Decisiones Q/R/S/T y reglas
> 7.13/7.14/7.15/7.16 rigen acá sin excepción), `POLITICAS_EPETPLACE.md`
> P14 (la política del plan), P16 (la política del paquete) y P18 (la
> política del suelto), `DISEÑO_EXPERIENCIA.md` (momento-primero, verdad
> firme), `RUTA_F1.md` (principio de secuencia S54: el paseo se deja
> COMPLETO antes del siguiente servicio).
>
> **Qué es este doc:** el modelo del PASEO como servicio — duraciones,
> precio, capacidad y agenda. Lo que está cerrado, cerrado está; los
> huecos se declaran con su disparo. Ninguna feature de paseo nace
> contradiciendo este contrato.

---

## 1. El menú canónico de duraciones (CERRADO, founder S55)

El paseo se vende en BLOQUES de un menú fijo:

**30 · 60 · 120 · 180 · 240 · 300 minutos — máximo 300.**

- **El porqué del techo:** *"más de 5 horas es guardería, no paseo"* —
  la necesidad de día completo es OTRO servicio (`guarderia_dia`), con
  otro modelo. El menú no se estira: se deriva al servicio correcto.
- **El porqué del piso:** el 30 es la **salida al baño** — la unidad
  mínima digna de un paseo con sentido.
- El menú vive **en piedra** en DB: CHECK `chk_paseo_duracion_menu`
  sobre `prestador_servicios` (`tipo_servicio='paseo'` ⇒
  `duracion_minutos ∈ {30,60,120,180,240,300}`). Un bloque nuevo en el
  menú = enmienda de este doc + migración, jamás un INSERT suelto.

## 1bis. Elegibilidad por ESPECIE (FIRMADA, founder S57 — enmienda del gate)

**El paseo es SOLO para perros.** El flujo solo ofrece perros del hogar;
un hogar sin perros ve voz honesta CON CAMINO (patrón §6ter — jamás
oferta vacía ni final mudo). Los demás servicios son multi-especie de
nacimiento. La elegibilidad vive como **configuración por tipo de
servicio en DB** (fuente de verdad única) — JAMÁS hardcodeada por
pantalla: la UI filtra, la DB manda (el guard también rige en las RPCs
de reserva: mascota no elegible rebota tipado).

## 2. Precio por bloque (CERRADO, founder S55)

El prestador **elige qué bloques ofrece** y les pone **precio por
bloque**: cada oferta es una fila de `prestador_servicios`
(`tipo_servicio='paseo'`) diferenciada por `duracion_minutos`, con su
`precio` propio. No hay prorrateo ni precio-por-hora derivado: el
bloque de 120 vale lo que el prestador dice que vale.

- La cita **snapshotea precio Y duración** de la oferta al crear el
  hold (S55-B2, patrón del precio S54) — el checkout jamás re-resuelve.
- **Regla de plata intacta (financiero v2.4):** no se oferta quien no
  puede cobrar (cuenta comercial activa, Decisión Q); el evento
  económico nace al CERRAR con calidad (Decisión R), sea el bloque de
  30 o el de 300.

## 3. La agenda: ocupación por VENTANA COMPLETA (S55-B2, implementado)

Una cita ocupa **[inicio, inicio + duración)** — una de 120' sobre
grilla de 30' bloquea sus 4 slots. Implementación (migración
`20260712030000`):

- `evento_cita_servicio.duracion_minutos` NOT NULL (DEFAULT 30 para
  inserts legacy que no la declaran).
- `_agenda_ocupacion` = **máximo de citas simultáneas** en algún
  instante de la ventana consultada (solapamiento real).
- Un arranque se **oferta** (`obtener_slots_disponibles`,
  `obtener_paseadores_disponibles`) solo si la ventana completa cabe en
  la franja del prestador Y hay cupo en todo su recorrido; el hold
  (`crear_bloqueo_agenda`) re-valida lo mismo bajo el advisory lock
  prestador+día.
- **Intactos:** expiración perezosa del hold (15 min), invariante
  `'pagada' ⟺ confirmar_cita_pagada`, verdad firme del prestador (el
  hold es invisible hasta el pago).

## 3bis. Cancelación y reagenda del paseo SUELTO — las tres ventanas (FIRMADA, founder S57)

> La política completa es `POLITICAS_EPETPLACE.md` P18; el dinero,
> `MODELO_FINANCIERO.md` v2.7 (nota 7.16). Acá vive el contrato del
> SERVICIO: qué le pasa a la cita y a la agenda. Cubre el paseo
> INDIVIDUAL pagado (el plan tiene P14; el paquete, P16).

1. **≥24 h antes de la recogida — reagendar o cancelar.**
   - *Reagendar:* la cita se mueve a otra franja REAL del **mismo
     paseador** — inicios del motor de ventana de siempre, re-snapshot de
     fecha/hora; la franja vieja se libera y se re-oferta. El pago viaja
     con la cita.
   - *Cancelar definitivo:* el dueño elige el destino de su plata (medio
     de pago original o saldo e-PetPlace — P18(a)). Hoy, con pago
     simulado, el reembolso se declara sobre el pago y la pantalla de
     elección de destino NO se muestra (espera Kushki fase 1).
2. **Entre 24 y 2 h — solo reagendar.** La franja es difícil de revender
   a esa altura, pero el servicio puede seguir vivo en otro horario. La
   plata no se mueve.
3. **<2 h o no presentarse — el paseo se pierde.** Cierre administrativo
   `no_show` (Decisión T, el MISMO cierre del paquete): el paseador
   devenga al precio snapshoteado de la cita — su agenda se bloqueó de
   verdad.
4. **Falla del prestador:** devolución o saldo a elección del dueño, sin
   discusión (P18(d)).
5. **La agenda dice la verdad:** toda franja liberada por cancelación o
   reagenda vuelve a ofertarse sola (motor de ventana §3, sin caminos
   laterales); el prestador ve el movimiento con honestidad en su agenda.

## 4. Capacidad simultánea

`prestador_horarios.max_citas_por_slot` = cuántas citas SUPERPUESTAS
son legales en la franja (cupo N ⇒ N mascotas a la vez). Hoy el seed y
las ofertas reales operan con cupo 1 (paseo individual).

- **Empleados como multiplicador (futuro):** cuando el prestador tenga
  equipo, la capacidad real es paseadores disponibles × su cupo — hoy
  el cupo es un número plano por franja; el multiplicador por empleado
  se modela cuando exista el segundo paseador de una misma sede.

### 4.1 HUECO — paseo grupal y la señal `nervioso_otros_perros`

**RESUELTO por P19 (founder S59 — cierra D-330):** el paseo es GRUPAL
POR NORMA (`POLITICAS_EPETPLACE.md` P19). El consentimiento operativo
es la pregunta única de la primera reserva por mascota ("¿{nombre} se
lleva bien paseando con otros perros?"): SÍ agenda y no se re-pregunta;
NO bloquea la reserva con voz honesta con camino y SE REGISTRA
(mascota, familia, fecha) como insumo de la decisión paseo
personalizado vs derivación a entrenador. La respuesta vive EDITABLE en
el perfil de la mascota. La fila conductual `nervioso_otros_perros`
(D-300, S46) sigue siendo la señal RICA del expediente — conviven: una
es información de cuidado, la otra es consentimiento de reserva.

## 5. HUECOS declarados (con disparo, no vergüenza)

- **Cobertura por zonas:** hoy el paseador se oferta sin geografía —
  cualquier dueño de EC lo ve. El modelo de zonas (dónde trabaja, radio
  o polígono) está en **relevamiento de la Sesión B (en curso)**; se
  incorpora por enmienda. Deuda D-331.
- **Excepciones de calendario:** la agenda son franjas SEMANALES
  (`prestador_horarios`); no existen feriados, vacaciones ni bloqueos
  puntuales del prestador. Ídem: relevamiento B en curso. Deuda D-332.

## 6. El PLAN (recurrencia) — espec FIRMADA, construcción con bloque propio

> **El candado v1.0 quedó ABIERTO en S55-B5:** los tres docs del
> paquete están firmados (este §6 v1.1 + `MODELO_FINANCIERO.md` v2.5
> Decisión S + `POLITICAS_EPETPLACE.md` P14). Lo que sigue cerrado es
> la CONSTRUCCIÓN: bloque propio con disparo (deuda D-338 — gate E2E
> founder del Bloque 4 + pantallas de la Sesión B cerrado). Hasta ese
> bloque, la UI muestra la frecuencia APAGADA con "Pronto".

Se monta sobre el mecanismo existente (`bono_id` /
`suscripcion_servicio_id`, enmienda S54 de RUTA_F1).

### 6.1 La UX firmada (founder S55)

- **Entrada:** el flujo del paseo SUELTO no cambia; al final del CUÁNDO
  vive el chip **"Hacerlo frecuente"**. Tocándolo se abre una Hoja:
  - **7 chips redondos L·M·X·J·V·S·D** — el día elegido en el CUÁNDO
    llega PRESELECCIONADO; multi-selección (martes y jueves = 2 citas
    por semana del plan).
  - **Frecuencia de un toque:** cada semana / cada dos semanas / cada
    mes.
  - **Auto-renovación DECLARADA** en la superficie al contratar (con su
    aviso previo de 72 h y pausa de un toque — Decisión S).
- **EL PLAN MENSUAL ES DE LUNES A VIERNES (enmienda v1.5, founder S59 —
  regla DURA):** los fines de semana se pasean SUELTO o por PAQUETE,
  jamás dentro del plan. Los chips sábado/domingo de "Hacerlo
  frecuente" quedan APAGADOS con voz honesta CON CAMINO: *"Los fines de
  semana se reservan sueltos o con tu paquete."* La regla vive también
  en DB (guard en la contratación/renovación del plan — la UI filtra,
  la DB manda, patrón §1bis). **Punto de reversión declarado:** si el
  founder pasa la regla a default-con-excepción, el guard de DB se
  relaja a default — un cambio de validación, no de chasis.
- **La continuidad es POR DÍA DE SEMANA (enmienda v1.2, founder S56):**
  todas las citas del plan que caen el mismo día de la semana las
  ejecuta el MISMO paseador (todos los martes, el paseador del martes).
  Días distintos pueden tener paseadores distintos cuando la cobertura
  lo exija — el vínculo se preserva por ritual, no por monopolio. La
  sustitución automática con mensaje al pet parent sigue post-MVP
  (D-333 intacta): si el paseador de un día falla, rige P14(b).
  **Porqué (founder S56):** el escenario real "nadie cubre martes Y
  jueves" no puede matar el plan; la promesa emocional ("Zeus conoce a
  su paseador del martes") sobrevive entera.
  - **Alcance v1 de la construcción (decisión arquitecto+founder S56):**
    el plan NACE con el paseador elegido en el flujo suelto; los días
    que ESE paseador no cubre se muestran honestos y no seleccionables
    ("Andrés no pasea los jueves"). El reparto multi-paseador que esta
    continuidad por día legaliza es el peldaño SIGUIENTE — declarado
    acá, no construido en D-338.
- **Hub "Mis paseos" = el DOBLE CLIC del servicio** — JAMÁS una tab (la
  navegación de 3 tabs S50 queda intacta). Se entra por la tarjeta del
  Hogar y por Explorar→Paseo. Tres segmentos:
  1. **Próximos** — lo que viene + el estado del plan.
  2. **Agenda** — las citas del período: modificar / saltar (P14).
  3. **Historial** — lo caminado (sedimento, peldaño por datos).

### 6.2 La plata del plan (espejo de Decisión S — el detalle manda allá)

UN pago por PERÍODO MENSUAL (al contratar y en cada renovación);
descuento por volumen lo configura el prestador; **un pago, N
devengos**: cada cita del plan devenga sola al cerrar con calidad
(variante (b) intacta). `MODELO_FINANCIERO.md` v2.6 §Decisión S.

### 6.3 Evolución opcional (apagada)

**Plan anual:** registrado como evolución posible del mismo chasis
(período anual con cobro mensual). NO se diseña ni se construye hasta
decisión explícita del founder — apagado, sin lugar en UI.

### 6.4 Precios SUGERIDOS del wizard (founder S59 — incentivo a recurrencia)

Al configurar su oferta, el wizard del prestador PRE-LLENA (editable,
patrón D-346 — azúcar de captura, jamás imposición) los precios de
recurrencia como derivación del precio SUELTO del mismo bloque:

- **Paquete: 80%** del precio suelto por salida.
- **Plan: 60%** del precio suelto por salida.

Lo que se persiste sigue siendo el precio que el prestador CONFIRMA
(`precio_paquete` / `precio_plan` — §2 intacto: precio por bloque, cero
prorrateo del motor). **Nota de calibración declarada:** si los
prestadores suben sistemáticamente el sugerido del plan en el ensayo,
el 60% se recalibra — el sugerido es hipótesis de incentivo, no ley.

## 6bis. El PAQUETE DE SALIDAS (bono) — espec FIRMADA (founder S56), construcción D-343

> El paquete es el SEGUNDO producto de recurrencia, hermano del plan (§6)
> sobre el mismo chasis (`bono_id` — ya existente en DB). **Comprar no es
> reservar**: el paquete acredita salidas; la reserva es un acto posterior,
> salida por salida, sobre el flujo suelto de siempre. La plata del
> paquete vive en `MODELO_FINANCIERO.md` v2.6 (Decisión T + regla 7.15);
> su política en `POLITICAS_EPETPLACE.md` P16. **La construcción es
> D-343 — disparo: cierre de D-338** (el plan se construye PRIMERO).

1. **Qué es.** N salidas (presets 5 · 10 · 15) de UNA duración del menú
   canónico, compradas a UN prestador concreto (**anclado**: el dueño lo
   elige como en el flujo suelto; el precio es la tarifa de ESE prestador
   con su descuento por volumen — él lo configura, patrón Decisión S).
   **El paquete es DEL HOGAR (enmienda v1.4, founder S57):** anclado a
   paseador + duración, NO a una mascota — la mascota se elige en cada
   reserva, entre las elegibles por especie (§1bis).
2. **Vigencia MENSUAL.** El paquete vence al cierre de su mes de vigencia.
   La vigencia se declara en la superficie de compra — la honestidad vive
   ahí, no en letra chica.
2bis. **Comprar no es reservar — TAMBIÉN EN LA UI (enmienda v1.4, founder
   S57, del gate del paquete):** la compra se habilita con paseador +
   duración elegidos y JAMÁS exige fecha/hora; comprar no crea ninguna
   cita; tras comprar, invitación OPCIONAL a reservar la primera salida
   (un toque lleva al flujo de reserva con el saldo activo); la reserva
   contra saldo tiene entrada clara desde el hub "Mis paseos".
3. **Reservar.** Cada salida se reserva contra la agenda real del
   prestador anclado (motor de ventana S55-B2, sin cambios), para LA
   mascota elegida en esa reserva (§6bis.1). Reservar descuenta del
   saldo del paquete al confirmarse la cita (sin pago: el pago fue el
   del paquete).
4. **Cancelación de una reserva:** con **≥2 horas antes de la hora de
   recogida**, la salida VUELVE al saldo y la franja del prestador se
   libera y se re-oferta. Con menos de 2 h, rige el no-show (§6bis.5).
5. **No-show (reservó y no cumplió):** la salida se da por CONSUMIDA y el
   paseador DEVENGA (cierre administrativo `no_show` — Decisión T): su
   agenda se bloqueó de verdad; la plata sigue a lo comprometido.
6. **Rollover condicionado:** al comprar otro paquete ANTES del
   vencimiento (renovar), las salidas sin usar SE SUMAN al nuevo. Sin
   renovación, VENCEN (destino de la plata: Decisión T — breakage
   declarado). El consumo es FIFO: las salidas más viejas se gastan
   primero, y cada una devenga al precio unitario de su paquete de ORIGEN.
7. **Cero dark patterns:** sin countdowns de vencimiento, sin urgencia
   artificial (coherencia MODELO_LOYALTY §6-7). Un recordatorio sereno
   cerca del cierre del período es voz honesta, no FOMO — una (1) noticia,
   jamás una cuenta regresiva.
8. **Evolución declarada (APAGADA): el paquete FLEX / tarifa de
   plataforma.** Modelo dispatch (precio de plataforma + asignación por
   disponibilidad/zona/calidad, con preferencia por el paseador anterior;
   el paseador del pool acepta la tarifa de plataforma — jamás arbitraje
   de spread contra el que cobra menos; el precio mostrado al comprar es
   EL precio — cero dynamic pricing en vivo delante del usuario).
   **Tres disparos, los tres:** D-331 cerrada (zonas) · masa crítica de
   paseadores por zona · volumen de demanda C/D (D-344) suficiente para
   calibrar tarifa. Hasta entonces: sin lugar en UI, sin diseño técnico.
   Doc propio cuando dispare.

## 6ter. Los cuatro escenarios de disponibilidad (founder S56)

Al buscar cobertura (suelto, plan o paquete):

- **A — cobertura perfecta:** flujo actual.
- **B — cobertura repartida:** posible bajo la continuidad por día (§6.1
  v1.2); la UI lo dice con honestidad ("martes con Andrés, jueves con
  Carla").
- **C — cobertura PARCIAL:** verdad firme + promesa honesta: *"Hoy podemos
  cubrir X. El equipo de e-PetPlace ya conoce tu necesidad y está buscando
  cómo cubrirla."* La necesidad SE PERSISTE (D-344).
- **D — sin cobertura:** mismo patrón, cero callejones: *"No tenemos
  disponibilidad para esto todavía — ya lo sabemos y estamos buscando."*
  La necesidad SE PERSISTE (D-344).

**Regla:** cero disponibilidad JAMÁS es un final mudo; siempre es promesa
honesta + captura de demanda.

## 7. EL DURANTE (FIRMADA — founder S59)

> La letra del paseo mientras OCURRE: qué ve el dueño, con qué voz y
> con qué honestidad. Construida sobre el relevamiento S59-A1 (el lado
> escritor del durante existe entero — track, novedades, fotos, RLS
> que ya deja leer al dueño; lo que faltaba era el canal lector).

1. **UNA VOZ.** El estado se llama **"En vivo"** (es) / **"Live"** (en)
   en TODA superficie de AMBAS apps — pill, subtítulos, títulos,
   accesibilidad. La key vive en el **namespace `ui`** del riel i18n
   (la voz del design system nace bilingüe en su paquete); ningún
   literal hardcodeado, ninguna key paralela por app. Memorial degrada
   sereno (la degradación visual de CitaEnVivo se conserva; la palabra
   es la misma).
2. **DOS CARAS, UNA RUTA.** La pantalla del paseo
   (`/paseo/[atencionId]`) pinta **EN VIVO** mientras
   `estado='en_curso'` y **RECORRIDO** al cerrar. MUERE el detalle
   histórico rendereando nulls como si fueran contenido ("09:14 –
   --:--" era la cara del vivo pintada con la plantilla del pasado).
3. **EL EN VIVO DEL DUEÑO.** La cara del vivo muestra: **mapa vivo**
   con el tramo acumulado del track · **inicio + tiempo transcurrido**
   · **novedades con voz de familia** (`cat_novedades_paseo.
   nombre_familia` — jamás el código de oficio) · **fotos al llegar** ·
   **GPS honesto**: si el track está vacío, pausado o falló, la voz lo
   dice — JAMÁS un mapa muerto sin explicación (Ley 13: el error no se
   disfraza de vacío).
4. **FRESCURA HONESTA v1.** Sondeo **~30 s con la pantalla en foco** +
   **pull-to-refresh** + **"Actualizado hace X"** visible. JAMÁS
   prometemos "tiempo real": el GPS del paseador escribe ~cada 60 s y
   solo en foreground (D-292) — prometer más sería verosímil-falso.
   El realtime (suscripción push) queda como deuda declarada con
   disparo (D-377).
5. **MULTI-MASCOTA PRIMERA CLASE.** N paseos vivos simultáneos = N
   celdas vivas en el Hogar, cada una navegando a SU EN VIVO. El
   wrapper del estado del hogar devuelve la LISTA de atenciones en
   curso — dos paseos a la vez jamás se pisan.
6. **SIN CHAT en v1.** El canal dueño⇄paseador durante el paseo es B5
   (canal interno del ecosistema) — el EN VIVO informa, no conversa.
   Declarado, sin lugar en UI.

## 8. Los tests de toda feature de paseo

1. ¿Respeta el menú canónico (ni un bloque fuera del CHECK)?
2. ¿La ventana completa manda (cero doble-booking parcial)?
3. ¿Verdad firme intacta (nada tentativo visible al prestador)?
4. ¿El camino de la plata intacto (Q, R, S, T, 7.13 — cero eventos al pagar; en el plan: un pago, N devengos; en el paquete: 7.15, solo los dos cierres devengan)?
5. ¿Los huecos §5 siguen declarados o su disparo ya sonó?
6. ¿Toda búsqueda sin cobertura completa responde con los escenarios §6ter (promesa honesta + captura de demanda — jamás final mudo)?
7. ¿El durante respeta §7 (una voz, dos caras, frescura honesta — cero promesas de tiempo real)?

## Historial

- **v1.5 (S59, 13 Jul 2026 — founder S59):** (1) §6.1 ENMENDADO — EL
  PLAN MENSUAL ES DE LUNES A VIERNES, regla DURA (fines de semana =
  suelto o paquete; chips S/D apagados con voz honesta con camino;
  guard en DB con punto de reversión declarado: si el founder pasa a
  default-con-excepción, el guard se relaja a default). (2) §6.4
  NUEVO — precios sugeridos del wizard: paquete 80% · plan 60% del
  precio suelto (editables, patrón D-346; nota de calibración: si los
  prestadores suben sistemáticamente el sugerido del plan, se
  recalibra). (3) §7 NUEVO — EL DURANTE (una voz "En vivo"/"Live" en
  namespace ui · dos caras una ruta EN VIVO/RECORRIDO · el en vivo del
  dueño con mapa/tiempo/novedades en voz de familia/fotos/GPS honesto ·
  frescura honesta v1: sondeo ~30 s en foco + pull-to-refresh +
  "Actualizado hace X", jamás "tiempo real" · multi-mascota primera
  clase · sin chat en v1); los tests pasan a §8 y ganan el test 7. (4)
  §4.1 RESUELTO por P19 (el paseo es grupal por norma; pregunta única
  de socialización por mascota, editable; el NO se registra — cierra
  D-330). Gemelo: `POLITICAS_EPETPLACE.md` v1.7 (P19).
- **v1.4 (S57, 12 Jul 2026 — enmienda FIRMADA del gate del paquete,
  founder S57):** (1) §6bis.2bis NUEVO — comprar no es reservar TAMBIÉN
  en la UI: la compra se habilita con paseador + duración, jamás exige
  fecha/hora, jamás crea cita; invitación opcional post-compra a la
  primera reserva; entrada de compra/renovación desde el hub. (2)
  §6bis.1 ENMENDADO — el paquete es DEL HOGAR (anclado a paseador +
  duración, no a una mascota; la mascota se elige en cada reserva).
  (3) §1bis NUEVO — elegibilidad por ESPECIE como configuración por
  tipo de servicio en DB (paseo = solo perros; hogar sin perros = voz
  honesta con camino; el resto multi-especie; la UI filtra, la DB
  manda).
- **v1.3 (S57, 12 Jul 2026 — founder S57, P18 firmada en sesión):** §3bis
  NUEVO — cancelación y reagenda del paseo SUELTO: las tres ventanas
  (≥24 h reagendar o cancelar con destino a elección · 24-2 h solo
  reagendar · <2 h/no-show = cierre `no_show` de Decisión T al precio
  snapshoteado), falla del prestador a elección del dueño, y la regla de
  agenda (toda franja liberada se re-oferta sola por el motor). La
  pantalla de elección de destino y el saldo e-PetPlace quedan
  DECLARADOS Y APAGADOS (disparo: Kushki fase 1). Gemelos:
  `POLITICAS_EPETPLACE.md` v1.5 (P18) y `MODELO_FINANCIERO.md` v2.7
  (nota 7.16).
- **v1.2 (S56, 11-12 Jul 2026 — founder S56, paquete de letra FIRMADO en
  sesión con el arquitecto):** (1) §6.1 ENMENDADO — la continuidad del
  plan pasa de "mismo paseador todo el plan" a **continuidad POR DÍA DE
  SEMANA** (el paseador del martes ejecuta todos los martes; días
  distintos pueden repartirse cuando la cobertura lo exija; D-333 sigue
  post-MVP), con el alcance v1 de la construcción declarado (el plan
  nace con el paseador elegido; días no cubiertos honestos y no
  seleccionables; el reparto multi-paseador es el peldaño siguiente).
  (2) §6bis NUEVO — el PAQUETE DE SALIDAS (bono anclado al prestador):
  presets 5/10/15 de una duración, vigencia mensual declarada, comprar
  ≠ reservar, cancelación ≥2 h devuelve al saldo, no-show consume y
  devenga, rollover condicionado con FIFO a precio de origen, cero dark
  patterns, y la evolución FLEX/dispatch declarada APAGADA con sus tres
  disparos (D-331 + masa crítica por zona + demanda D-344). Gemelos:
  financiero v2.6 (Decisión T + 7.15) y POLITICAS v1.4 (P16).
  Construcción = D-343, disparo: cierre de D-338. (3) §6ter NUEVO — los
  cuatro escenarios de disponibilidad A/B/C/D: cero disponibilidad
  jamás es final mudo (promesa honesta + captura de demanda D-344).
  (4) Test 4 ampliado (Decisión T/7.15) y test 6 nuevo (§6ter).
- **v1.1 (S55-B5, 11 Jul 2026):** §6 reescrito con la espec FIRMADA del
  plan (OK completo del founder al paquete): chip "Hacerlo frecuente" +
  Hoja de 7 chips L-D con multi-selección y frecuencia de un toque +
  auto-renovación declarada; continuidad de paseador firmada
  (sustitución+mensaje sigue post-MVP, D-333); hub "Mis paseos" como
  doble clic del servicio con Próximos/Agenda/Historial; plan anual
  como evolución apagada. El candado se ABRE (financiero v2.5 Decisión
  S + P14 firmados); la construcción es D-338.
- **v1.0 (S55, 11 Jul 2026):** redacción inicial con el modelo cerrado
  del founder (menú canónico con techo 300, precio por bloque,
  capacidad por cupo) + el motor de ocupación por ventana implementado
  (S55-B2) + huecos declarados con disparo (grupal/zonas/calendario) +
  candado de paquetes (financiero v2.5 + P14).
