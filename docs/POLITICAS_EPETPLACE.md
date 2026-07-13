# POLITICAS_EPETPLACE — Políticas operativas del producto

> Versión: v1.6
> Última actualización: 12 Jul 2026 — Sesión 57. P17 FIRMADA e integrada (la Cuenta del prestador, letra v1.1 — cierra la reserva de numeración de la v1.5). P18 FIRMADA (cancelación y reagenda del paseo SUELTO: las tres ventanas).
> Audiencia: Claude (web y code), devs futuros, equipo de soporte, equipo legal.
> Análogo a: `CONTRATO_TRABAJO.md` (cómo trabajamos) pero del producto (cómo se comporta).

---

## Propósito

Este documento captura las **políticas operativas** del producto que surgen del modelo conceptual articulado en `MODELO_PRODUCTO.md` pero que requieren decisiones específicas de comportamiento del sistema o intervención humana.

Una política responde a la pregunta: "¿qué hace el sistema (o el equipo) cuando pasa X?".

Diferenciación con otros docs:
- `MODELO_PRODUCTO.md` define **qué es** el producto.
- `BIO_EXPEDIENTE.md` define **cómo se estructura** la data.
- `MODELO_FINANCIERO.md` define **cómo fluye la plata**.
- `POLITICAS_EPETPLACE.md` define **cómo se comporta el sistema y el equipo en casos específicos**.

---

## P1 — Doble confirmación destructiva

Acciones consideradas destructivas requieren consenso de **todos los co-dueños activos** de la mascota:

- Dar de baja la mascota.
- Remover un co-dueño.
- Transferir la mascota a otra familia.
- Cambiar configuración crítica de privacidad.
- Remover un familiar autorizado.
- Cambiar el modo público de la mascota (de discoverable a privado_total o viceversa).

Mecánica:
- Cualquier co-dueño puede proponer la acción.
- El sistema registra en `accion_destructiva_pendiente` con snapshot de quiénes son co-dueños al momento.
- Se ejecuta cuando todos los co-dueños del snapshot confirman.
- Si uno rechaza, la acción se cierra como `rechazada`.
- Default expira a 30 días sin resolución.
- El proponente puede revocar su propuesta.

**Si no hay consenso, el statu quo se preserva.** Sin arbitraje automático.

---

## P2 — Transferencia de mascota entre familias

La transferencia requiere handshake bilateral:

1. Familia A (origen) propone transferencia. Requiere doble confirmación (política P1) si Familia A tiene varios co-dueños.
2. Familia B (destino) recibe propuesta. Un co-dueño de Familia B acepta o rechaza.
3. Si Familia B acepta, la transferencia se consuma: `mascotas.familia_id` cambia, vínculos `mascota_codueño` de Familia A se cierran con `motivo_cierre='transferencia'`, evento `transferencia_familia` se registra.
4. El expediente clínico completo viaja con la mascota.
5. Los hitos privados de cada humano de Familia A **no migran** — quedan con el humano.

Caso especial: mascotas adoptadas de refugio. El refugio actúa como "Familia A" virtual hasta que el adoptante (Familia B) acepta. Handshake clínico al nuevo vet de la familia adoptante.

---

## P3 — Mascotas walk-in (creadas por prestador sin cliente registrado)

Cuando un prestador atiende a una mascota cuyo dueño no está registrado en e-PetPlace:

1. El prestador crea la mascota desde su portal con `origen='desconocido'` (D14.5).
2. El sistema auto-crea una `familia` con `tipo='virtual_prestador'` + `cuenta_comercial_id` del prestador.
3. La mascota queda en esa familia virtual con expediente clínico activo (HC, recetas, etc.).
4. Cuando el dueño real se registra y reclama la mascota:
   - Reclamación = transferencia con handshake (política P2).
   - Cliente acepta, sistema transfiere `familia_id` a la familia del cliente.
   - El expediente clínico viaja completo.

Si el dueño nunca aparece, la mascota queda en la familia virtual del prestador. El prestador puede archivar o pedir a soporte que actúe.

---

## P4 — Especies y su ciclo de vida

Una especie tiene dos flags independientes:

- `acepta_nuevos_registros` — controla si se puede registrar **nueva** mascota de esa especie.
- `nivel_soporte` (A/B/C/D/inactivo) — controla qué features tienen las mascotas existentes de esa especie.

**Una especie nunca se borra del catálogo.** Si pasa a no soportada:

1. `acepta_nuevos_registros` se pone en `false` (impide nuevos registros).
2. `nivel_soporte` se baja según corresponda.
3. Las mascotas existentes de esa especie:
   - Mantienen su expediente, son visibles para sus familias.
   - Features asociadas se degradan según nuevo nivel.
   - **Soporte humano contacta a las familias** para acompañar la decisión:
     - Archivar (la mascota deja de aparecer activa).
     - Exportar el expediente.
     - Si en el futuro se lanza producto adyacente (ej: e-PetPlace Equine, Fase 5+), opción de migrar.

Esta política respeta el principio 8.12 (comunicación con familias en situaciones especiales es humana).

---

## P5 — Datos de menores

Permisos diferenciados por edad:
- Menores ven dimensiones apropiadas a su edad. No ven dimensiones financieras, ubicación detallada ni microchip.
- Pueden contribuir hitos y observaciones marcadas con flag `aportado_por_menor=true`.

Restricciones de uso de datos aportados por menores:
- **No se usan para DaaS (Nivel 1 — insights agregados).**
- **No se usan para segmentación publicitaria (Nivel 2).**
- Hitos contribuidos por menores marcados como **públicos** requieren **moderación de un co-dueño** antes de visibilizarse fuera de la familia.
- Hitos privados familiares no requieren moderación (visibles solo a familia).

Implementación técnica: `evento_hito_narrativo.requiere_moderacion` se setea automáticamente a `true` cuando `aportado_por_menor=true AND nivel_visibilidad='publica'`. Constraint `chk_menor_publico_modera` lo enforce.

---

## P6 — Hito narrativo privado del humano

El hito privado del humano **no es parte del Bio-Expediente de la mascota**. Es registro personal del humano sobre la mascota.

- Vive en tabla separada `hito_narrativo_privado_humano`.
- Solo el `user_id` propietario puede leer/escribir.
- No migra en transferencia de mascota.
- Si la mascota se borra del sistema (caso GDPR raro), el hito del humano se preserva (referencia a mascota_id queda NULL).
- Si el humano cierra su cuenta, sus hitos privados se borran con su cuenta.

Implicancia para soporte: si una familia pregunta "¿quién más vio mis notas privadas sobre Max?", la respuesta honesta es **nadie excepto el equipo de seguridad/admin en caso de obligación legal**. Sin excepciones.

---

## P7 — Caso clínico como acto consciente

El caso clínico se abre por **acto consciente del vet**, no por inferencia automática.

Mecánica:
1. Vet diagnostica condición crónica o alergia en HC.
2. Sistema sugiere en mismo flujo: "¿Querés abrir caso clínico para seguimiento?" con default sugerido sí.
3. Vet acepta (caso queda con vet tratante = vet de la HC) o cierra (no se crea caso).
4. Si acepta, el caso queda en estado `activo` con `proximo_evento_esperado_en` configurable.

**El sistema persigue el caso, no espera que el vet lo recuerde.** Cron consulta casos con `proximo_evento_esperado_en < now() AND estado='activo'` y dispara alerta al vet tratante (cuando D-137 motor de alertas esté implementado).

---

## P8 — Reasignación de caso clínico cuando empleado se va

El vet tratante de un caso es la pareja (clínica, empleado). Si el empleado se va de la clínica:

1. `caso_clinico.empleado_tratante_id` queda apuntando al empleado (cuyo `prestador_empleados.activo=false`).
2. La clínica (`cuenta_comercial_tratante_id`) sigue siendo dueña del caso.
3. Sistema alerta a la clínica: "Casos activos sin empleado activo, reasignar".
4. La clínica reasigna empleado o pasa el caso a otro vet de la misma clínica.
5. Alternativamente, la familia puede pedir **transferencia del caso** a otro vet/clínica (handshake clínico, política P9).

---

## P9 — Transferencia de caso clínico

Cuando la familia quiere cambiar el vet tratante de un caso (segunda opinión que se vuelve principal, mudanza, insatisfacción):

1. Co-dueño propone transferencia del caso desde la app.
2. Vet tratante original recibe notificación con motivo.
3. Vet destino acepta o rechaza.
4. Si acepta: `caso_clinico.cuenta_comercial_tratante_id` y `empleado_tratante_id` se actualizan. Evento `caso_clinico_transferido`. El vet anterior recibe handshake clínico (contexto del caso completo).
5. Si rechaza: la familia decide entre cerrar el caso, mantener al original, o pedir a otro vet.

Importante: la transferencia del caso es independiente de la transferencia de la mascota (política P2). Mascota se queda con su familia, solo cambia el vet tratante.

---

## P10 — Mascota perdida — estados y alerta comunitaria

`mascotas.estado_vida='perdida'` se setea cuando un co-dueño reporta extravío:

1. Evento `extravio_reportado` se crea.
2. Trigger propaga al `estado_vida='perdida'`.
3. Alerta comunitaria se activa (Capa 3, sistema futuro): visible a usuarios cercanos geográficamente.

**Solo la familia cambia `estado_vida`.** Tres escenarios:
- Mascota aparece: co-dueño crea evento `extravio_resuelto`. Trigger devuelve `estado_vida='activa'`.
- Familia acepta que no aparece: co-dueño marca `estado_vida='fallecida'` manualmente (transición sensible — UX con tono respetuoso).
- Familia no decide: la mascota queda como `perdida` indefinidamente. Sistema **no fuerza** cambio.

**Alerta comunitaria tiene ciclo de vida propio** independiente de `estado_vida`:
- Visible a usuarios cercanos por X meses (configurable).
- Después de X meses, alerta se silencia en feed comunitario (deja de aparecer).
- La familia recibe notificación: "La alerta de Max dejó de aparecer en feed público después de N meses. Tu mascota sigue marcada como perdida. ¿Querés mantener visible la alerta?"
- Familia puede renovar la alerta indefinidamente.

Esto respeta el duelo (8.5) sin saturar comunidad.

---

## P11 — Recomendaciones clínicas no son sponsoreadas

Recordatorio operativo del principio 8.3 de MODELO_PRODUCTO:

- Ningún prestador, fabricante o seller paga para aparecer recomendado por encima de otros en sugerencias clínicas o nutricionales.
- Cuando el sistema sugiere "tu mascota necesita X" o "considerá el producto Y para Z condición", la base es **data real + consenso profesional**, no acuerdo comercial.
- Auditable: cada recomendación generada por el sistema queda en `recomendaciones_log` con motivo jsonb visible al usuario vía "ⓘ ¿Por qué veo esto?".

Esta política es no-negociable y se aplica antes que cualquier acuerdo comercial. Cualquier sponsored content se marca **visualmente separado** y nunca aparece como recomendación clínica.

---

## P12 — Equinos y Fase 5+ (decisión arquitectónica documentada)

Equinos quedan **fuera del producto core** hasta Fase 5+. Decisión D15.5 confirmada en S16.

- `cat_especies` tiene fila `equino` con `acepta_nuevos_registros=false` + `nivel_soporte='inactivo'`.
- El motor técnico (Bio-Expediente, eventos, perfil vigente, motor de alertas) **es compatible** con equinos — el modelo está diseñado horizontalmente.
- En Fase 5+ se evalúa lanzar **e-PetPlace Equine** como producto vertical bajo la misma marca, con motor compartido pero UX, actores, narrativa y go-to-market separados.

**El principio rector:** el modelo aguanta equinos sin que hoy diseñemos para equinos.

---

## P13 — Alta asistida por prestador (origen: S19)

Un prestador puede registrar a un cliente y su mascota durante una atención presencial cuando el cliente no está en e-PetPlace todavía. La política define el flow preservando consentimiento.

**Decisión canónica:**

- NO se crea un user en `auth.users` sin consentimiento explícito del cliente.
- Se crea un **alta asistida pendiente** + familia placeholder + mascota.
- e-PetPlace invita al cliente a completar su registro (email, link, QR).
- Si completa en 30 días, las mascotas se transfieren a su familia real automáticamente (trigger).
- Si no completa en 30 días, el pendiente y la familia placeholder se eliminan vía cleanup automático.
- El cliente puede pedir a soporte resolución manual en cualquier momento.

**Por qué:**

- Respeto al consentimiento. Crear users sin consentimiento es violatorio de privacidad.
- El cliente es dueño de su entrada al ecosistema, no el prestador.
- Si el cliente nunca quiso entrar, su data no queda flotando indefinidamente.

**Implicancia operacional para el prestador:**

Mientras el cliente está pendiente, no se pueden generar estadías, suscripciones ni bonos para esa mascota. La operación queda diferida hasta que el cliente complete su registro. UI del portal del prestador muestra mensaje claro al respecto.

**Implementación:**

Ver `BIO_EXPEDIENTE.md` (S19) para schema y RPCs (`buscar_cliente_por_email`, `crear_alta_asistida_pendiente`, `crear_alta_asistida_existente`, trigger `_trg_completar_pendiente_registro`, cleanup `cleanup_pendientes_vencidos`).

---

## P14 — El plan de paseo: saltos, fallas, pausa y plata (FIRMADA — founder S55)

> Parte del paquete del PLAN (S55-B5): `MODELO_PASEO.md` §6 (la UX) y
> `MODELO_FINANCIERO.md` v2.5 Decisión S (el dinero: un pago por
> período mensual, N devengos al cierre). Esta política rige cada cita
> del plan desde que el plan exista en producción.

**(a) El dueño salta una cita — con aviso.** Con **≥24 h de aviso**, el
dueño salta UNA cita y la **reagenda dentro del mismo período con el
mismo paseador** (la continuidad es parte del plan). Las citas pagadas
que queden sin ejecutar al CIERRE del período: **crédito al período
siguiente si renueva; reembolso proporcional si no renueva** (al precio
unitario efectivo — Decisión S).

**(b) Falla del prestador.** Si el paseador no ejecuta una cita del
plan, el dueño elige — **crédito o reembolso proporcional, A SU
ELECCIÓN, sin discusión**. La plataforma no litiga la falla del lado
que cobró.

**(c) El dueño avisa tarde.** Con **<24 h de aviso**, la cita se
pierde: la franja del paseador ya no se puede revender y su agenda se
protege. Sin excepciones automáticas (los casos humanos extremos son
soporte, no regla).

**(d) Pausa del plan.** Pausar = **no renovar** (un toque, Decisión S).
El período corriente YA pagado se termina de regir por (a)/(b) — la
pausa jamás confisca lo pagado ni fabrica reembolsos de lo ejecutado.

**Por qué:** el plan es un contrato de confianza entre tres — el dueño
compra continuidad, el paseador compra previsibilidad de agenda, la
plataforma garantiza que la plata siga a lo EJECUTADO (el devengo solo
existe por cierre con calidad; lo no ejecutado vuelve o se acredita,
nunca queda en un limbo).

---

## P15 — Eliminación de cuenta del dueño (CANDIDATA — S55, pendiente de firma del founder)

> **Estado: CANDIDATA.** Redactada como espec (S55-B3, letra (a) de Cuenta v1);
> NO rige hasta la firma. La UI de Cuenta muestra "Eliminar cuenta" con voz
> honesta y NO ejecuta nada. El disparo de implementación es la compuerta de
> tiendas (B6: la eliminación de cuenta es requisito de Play/App Store).
> Nota de numeración: P14 = el plan de paseo (FIRMADA S55-B5).

**El principio:** una vida documentada no se borra a la ligera. Eliminar la
CUENTA de un humano no puede destruir por arrastre el expediente de una
mascota que otros humanos también cuidan, ni los hitos sellados de un
prestador (P6), ni registros con obligación legal/fiscal.

**Lo que la espec tiene que resolver ANTES de que el botón ejecute:**

1. **Destino de las mascotas.** Si el user es el ÚNICO adulto de la familia:
   ¿el expediente se elimina, se anonimiza o se ofrece exportar? Propuesta
   base: ofrecer exportación + eliminación real de datos personales;
   el expediente clínico anonimizado puede requerir retención (consulta
   legal pendiente). Si HAY co-dueños (P1): la mascota y su expediente
   QUEDAN con la familia; solo sale el miembro.
2. **Co-dueños y familia.** El titular que se va con más miembros vigentes:
   transferencia de titularidad explícita ANTES de eliminar (jamás una
   familia acéfala).
3. **Hitos del prestador (P6).** Los hitos sellados y el log anónimo
   (`prestador_atencion_log`, ya anonimizado por diseño con pet_hash) NO se
   borran: no contienen datos personales del dueño.
4. **La plata.** Eventos económicos, liquidaciones y pagos NO se borran
   (regla 7.8 del financiero: en producción no se borra — estados). La
   eliminación de cuenta anonimiza la referencia personal, no el ledger.
5. **Auth y storage.** auth.users + objetos del bucket en su carpeta
   ({uid}/…) se eliminan de verdad; los paths huérfanos se barren.
6. **Ventana de arrepentimiento.** Propuesta: soft-delete con 30 días de
   gracia comunicados, luego borrado duro programado.

**Implementación:** deuda D-337 (disparo: pre-compuerta B6, DESPUÉS de la
firma de esta política).

---

## P16 — El paquete de salidas: reservas, no-show, rollover y vencimiento (FIRMADA — founder S56)

> Parte del paquete de letra del PAQUETE DE SALIDAS (S56): `MODELO_PASEO.md`
> §6bis (la UX del bono anclado al prestador) y `MODELO_FINANCIERO.md` v2.6
> Decisión T + regla 7.15 (el dinero). Esta política rige cada salida del
> paquete desde que el paquete exista en producción.

**(a) Comprar no es reservar.** El paquete acredita salidas con vigencia
mensual declarada al comprar. Cada salida se reserva después, contra la
agenda real del prestador anclado.

**(b) Cancelar una reserva.** Con **≥2 horas antes de la hora de
recogida**, la salida vuelve al saldo del paquete y la franja se libera.
Sin excepciones automáticas (los casos humanos extremos son soporte, no
regla — patrón P14(c)).

**(c) No-show.** Reserva no cumplida sin cancelación en ventana = salida
consumida. El paseador cobra (cierre `no_show`, Decisión T): bloqueó su
agenda de verdad.

**(d) Falla del prestador.** La salida vuelve al saldo, o el dueño elige
reembolso proporcional de esa salida — **a su elección, sin discusión**
(espejo P14(b)).

**(e) Rollover.** Renovar antes del vencimiento suma las salidas sin usar
al paquete nuevo. Sin renovación, vencen (Decisión T: breakage declarado).
El recordatorio de vencimiento es UNO y sereno — jamás countdown ni
urgencia (coherencia LOYALTY §6-7).

**Por qué:** el paquete compra flexibilidad (el plan compra ritmo). La
plata sigue a lo ejecutado o a lo COMPROMETIDO (el no-show comprometió una
agenda real); lo nunca comprometido que el dueño dejó vencer se declara
como lo que es — ingreso de plataforma por flexibilidad no usada, avisado
en la superficie de compra.

> Nota de ventanas: P14 (plan) usa 24 h; P16 (paquete) usa 2 h. Es
> DECISIÓN, no accidente: el plan genera citas automáticas con antelación;
> el paquete se reserva a demanda. Si el ensayo con paseadores reales
> muestra que las 2 h dañan la reventa de franjas, se enmienda con firma.

---

## P17 — La Cuenta del prestador (FIRMADA — founder S57, letra v1.1)

> Decisión FIRMADA por el founder en S57 (conversación con el
> arquitecto; la letra la integró la Sesión A — escritora única de docs,
> regla 76). Construcción estructural: S57, Sesión B (commits `09f7d73`
> + `4676158`). Pulido: pasada de acabados.

**(1) La estructura (firmada — v1.1).** La app del prestador tiene
CUATRO tabs: **Hoy · Mascotas · Negocio · Cuenta**. La decisión de S57
fue UNA sola: separar Cuenta de Negocio — Mascotas conserva el lugar
que ya tenía (la v1.0 de esta letra la sacó de la barra por error de
redacción del arquitecto, no por decisión; corregido con firma del
founder en la misma sesión). Ninguna tab es eterna: si un día llega una
función de más valor diario, la barra se rediscute con firma (decisión
reversible declarada).

**(2) La mudanza (qué vive dónde).**
- **Cuenta:** perfil del prestador, preferencias, idioma,
  notificaciones, y eliminación de cuenta (requisito de tiendas — ver
  (4)).
- **Negocio queda puro oficio:** la oferta (servicios, horarios,
  vacaciones) y la plata (cobros, liquidaciones). Nada más.

**(3) La vara.** El mismo pulido que la Cuenta del cliente (v1 S56):
pantalla por pantalla, gate del founder en dispositivo, strings es/en.
El pulido NO es parte de la mudanza estructural — es la pasada de
acabados, con la capa de craft firmada.

**(4) Eliminación de cuenta del prestador (declarada, construcción
aparte).** Es requisito de tiendas también de este lado. Toca base de
datos y reglas propias (¿qué pasa con citas futuras pagadas, planes
vivos, saldo por liquidar?) — esas reglas se escriben como enmienda de
esta letra ANTES de construirla, con la Sesión A como escritora. En la
mudanza estructural la entrada existe y dice su verdad ("Pronto") —
jamás un botón que finge borrar.

**Historial de la letra:**
- v1.1 (S57, misma sesión): (1) corregido con firma del founder —
  CUATRO tabs (Hoy · Mascotas · Negocio · Cuenta): Mascotas conserva su
  lugar; la v1.0 la había desplazado por error de redacción del
  arquitecto.
- v1.0 (S57, 12 Jul 2026): decisión firmada (tab Cuenta; Negocio puro
  oficio; pulido a la vara del cliente en acabados; eliminación
  declarada con enmienda previa a construcción).

---

## P18 — Cancelación y reagenda del paseo SUELTO (FIRMADA — founder S57)

> **Qué cubre:** el paseo INDIVIDUAL pagado (ni plan ni paquete — esos ya
> tienen P14 y P16). Hasta S57 el suelto pagado no tenía salida: ni
> reagendar ni cancelar existían. Gemelos: `MODELO_PASEO.md` §3bis (las
> ventanas en el modelo del servicio) y `MODELO_FINANCIERO.md` v2.7
> (nota 7.16: el camino de la plata del suelto no ejecutado).

### Las tres ventanas

**(a) Con ≥24 horas antes de la hora de recogida — reagendar o cancelar.**

- **Reagendar:** mover la cita a otra franja REAL del mismo paseador
  (contra su agenda viva, motor de ventana de siempre). El pago viaja con
  la cita; la franja vieja se libera y se re-oferta.
- **Cancelar definitivamente:** el dueño ELIGE el destino de su plata:
  1. **Vuelta al medio de pago original.** La superficie lo dice honesto:
     *"La devolución depende de tu banco y tarda en promedio 15 días
     hábiles."*
  2. **Saldo en e-PetPlace.** Disponible para usar en segundos.
  La elección es del dueño, sin default oscuro: las dos opciones se
  presentan parejas, con sus tiempos declarados — la rapidez del saldo se
  INFORMA, jamás se usa para esconder la opción del banco (cero dark
  patterns, coherencia LOYALTY §7).

**(b) Entre 24 y 2 horas antes — solo reagendar.**
Mover la cita a otra franja real del mismo paseador. Cancelar con
devolución ya no: la franja es difícil de revender a esa altura, pero el
servicio puede seguir vivo en otro horario. La plata no se mueve.

**(c) Con <2 horas, o no presentarse — el paseo se pierde.**
El paseador COBRA (cierre administrativo `no_show`, Decisión T del
financiero: su agenda se bloqueó de verdad). Sin excepciones automáticas —
los casos humanos extremos son soporte, no regla (patrón P14(c)/P16(b)).

**(d) Falla del prestador.**
Si el paseador no ejecuta, el dueño elige — **devolución al medio de pago
o saldo e-PetPlace, a su elección, sin discusión** (espejo P14(b)/P16(d)).
La plataforma no litiga la falla del lado que cobró.

### El camino de la plata (contraste financiero, regla de piedra)

- Un suelto pagado y NO ejecutado no tiene devengo que reversar (el evento
  económico solo nace al cierre — variante (b) intacta): la cancelación se
  **DECLARA sobre el pago** (estado/metadata de la cita), patrón de la
  enmienda 7.14. `aplicar_reembolso()` no se toca — sigue reservada a
  reversar devengos de citas ejecutadas.
- El `no_show` del suelto usa el MISMO cierre que el del paquete (Decisión
  T, no hay tercera vía): el paseador devenga al precio snapshoteado de la
  cita.
- **El saldo e-PetPlace es un pasivo del ledger** (plata que le debemos al
  dueño). Su contrato contable (tabla, acreditación, consumo, expiración
  si la hay) NO se diseña acá: es letra propia del financiero cuando
  dispare.

### Qué se construye HOY y qué espera su disparo

**HOY (v1, pagos simulados):**
- Reagendar en ventana (a)/(b): funcional entero, contra agenda real.
- Cancelar en ventana (a): funcional con **reembolso simulado y
  DECLARADO** — la superficie dice que el pago era simulado y la
  devolución también (mismo contrato de estados que el pago S54). La
  pantalla de elección de destino NO se muestra todavía: mostrar dos vías
  que no existen sería promesa vacía.
- Ventana (c): el cierre `no_show` ya existe (Decisión T) — se conecta.
- El prestador VE la cancelación/reagenda con honestidad en su agenda
  (lado Sesión B): la franja liberada vuelve a ofertarse sola.

**CON PASARELA REAL (disparo: Kushki fase 1):**
- La elección de destino se enciende con las dos vías reales y sus
  tiempos honestos.
- El saldo e-PetPlace nace con su letra financiera propia ANTES del
  primer crédito real. Evolución declarada, apagada hasta entonces —
  sin lugar en UI, como manda la casa.

### Nota de ventanas (coherencia del ecosistema)

El suelto usa **2 h para "se pierde"** (como el paquete: reserva a
demanda) y **24 h para "devolución"** (como el plan: la plata solo vuelve
con antelación real). No es accidente: reagendar protege el servicio,
cancelar protege al dueño, y las 2 horas protegen al paseador. Si el
ensayo con paseadores reales muestra que estas ventanas dañan la reventa
de franjas, se enmienda con firma (patrón P16).

---

## Historial de versiones

- **v1.0 (13 May 2026 — S16)**: Primera redacción. 12 políticas iniciales derivadas del refactor de modelo de S16.
- **v1.1 (15 May 2026 — S19)**: Política P13 agregada (alta asistida por prestador). Cubre el flow de consentimiento cuando un prestador necesita registrar a un cliente no registrado durante atención presencial.
- **v1.2 (11 Jul 2026 — S55)**: P15 agregada como CANDIDATA (eliminación de cuenta del dueño — espec de la letra (a) de Cuenta v1; rige recién con la firma del founder). P14 reservada para paquetes de paseo (`MODELO_PASEO.md` §6, financiero v2.5).
- **v1.3 (11 Jul 2026 — S55-B5)**: P14 FIRMADA (founder, OK completo al paquete del plan): (a) salto con ≥24 h reagenda en el período con el mismo paseador, sobrantes al cierre = crédito si renueva / reembolso proporcional si no · (b) falla del prestador = crédito o reembolso a elección del dueño · (c) <24 h = la cita se pierde · (d) pausa = no renovar, el período corriente se rige por (a)/(b). Gemelos: `MODELO_PASEO.md` v1.1 y `MODELO_FINANCIERO.md` v2.5 (Decisión S).
- **v1.4 (12 Jul 2026 — S56)**: P16 FIRMADA (founder S56, paquete de letra del PAQUETE DE SALIDAS): (a) comprar no es reservar — vigencia mensual declarada al comprar · (b) cancelar con ≥2 h devuelve la salida al saldo y libera la franja · (c) no-show = salida consumida, el paseador cobra (cierre `no_show`) · (d) falla del prestador = saldo o reembolso proporcional a elección del dueño · (e) rollover al renovar antes del vencimiento; sin renovación vencen (breakage declarado); recordatorio UNO y sereno, jamás countdown. Nota de ventanas: 24 h del plan vs 2 h del paquete es DECISIÓN. Gemelos: `MODELO_PASEO.md` v1.2 (§6bis/§6ter) y `MODELO_FINANCIERO.md` v2.6 (Decisión T + 7.15).
- **v1.6 (12 Jul 2026 — S57)**: P17 FIRMADA e integrada (letra v1.1 del arquitecto, firmada por el founder en sesión): la Cuenta del prestador — CUATRO tabs Hoy·Mascotas·Negocio·Cuenta (la única decisión fue separar Cuenta de Negocio; la v1.0 desplazaba Mascotas por error de redacción, corregido con firma en la misma sesión) · Negocio puro oficio · pulido a la vara de la Cuenta del cliente en la pasada de acabados · eliminación de cuenta DECLARADA con enmienda de letra previa a construcción (la entrada dice "Pronto", jamás finge borrar). Cierra la reserva de numeración de la v1.5. Nota de proceso: la integración llegó UNA respuesta tarde — el primer envío anunció el literal sin adjuntarlo y la A frenó por regla 76b (freno ratificado por el arquitecto).
- **v1.5 (12 Jul 2026 — S57)**: P18 FIRMADA (founder S57, redacción del arquitecto sobre decisión en sesión — cancelación y reagenda del paseo SUELTO): (a) ≥24 h = reagendar o cancelar con destino a elección del dueño (medio de pago original con sus 15 días hábiles declarados, o saldo e-PetPlace) · (b) entre 24 y 2 h = solo reagendar, la plata no se mueve · (c) <2 h o no presentarse = el paseo se pierde y el paseador cobra (cierre `no_show`, Decisión T) · (d) falla del prestador = devolución o saldo a elección, sin discusión. Camino de la plata: la cancelación se DECLARA sobre el pago (patrón 7.14 enmendada; `aplicar_reembolso()` intacta). Construcción diferida: la pantalla de elección de destino y el saldo e-PetPlace esperan Kushki fase 1 — hoy el reembolso es simulado y declarado, sin pantalla de destino. **P17 queda RESERVADA** para la Cuenta del prestador (sin letra). Gemelos: `MODELO_PASEO.md` v1.3 (§3bis) y `MODELO_FINANCIERO.md` v2.7 (nota 7.16).
