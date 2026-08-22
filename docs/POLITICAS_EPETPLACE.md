# POLITICAS_EPETPLACE — Políticas operativas del producto

> Versión: v1.11
> Última actualización: 9 Ago 2026 — S92-BIS. **P23 FIRMADA: qué significa «borrado» para un documento de identidad — el archivo queda inalcanzable, no se sobrescribe, y esa diferencia se declara en vez de prometerse de más.**
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
- e-PetPlace invita al cliente a completar su registro con **email O
  teléfono** (contacto-flexible, enmienda S69: al menos uno). El reclamo
  matchea por email O teléfono normalizado (`normalizar_telefono`, un
  único normalizador; el trigger se dispara también cuando el cliente
  agrega su teléfono más tarde).
- Si completa (por cualquiera de los dos contactos), las mascotas se
  transfieren a su familia real automáticamente (trigger).
- **La invitación expira a 30 días; el DATO CLÍNICO JAMÁS (enmienda
  S69, decisión founder — letra = realidad).** El relevamiento Bloque 0
  S69 probó que el cleanup **NUNCA borró** (la letra v1.0 decía "se
  eliminan" pero la función sólo notificaba). Se firma como PRINCIPIO:
  la INVITACIÓN expira (deja de estar activa a los 30 días), pero el
  expediente de la mascota **no se borra** — queda bajo el acceso
  operativo del prestador que lo produjo, esperando reclamo **sin fecha
  de muerte**. Un dato clínico que expira es un expediente que miente.
- Soporte recibe **UNA notificación terminal** por pendiente vencido
  (`notificado_soporte_en`, enmienda S69 — el goteo nocturno que
  re-avisaba cada noche murió).
- El cliente puede pedir a soporte resolución manual en cualquier momento.

**Por qué:**

- Respeto al consentimiento. Crear users sin consentimiento es violatorio de privacidad.
- El cliente es dueño de su entrada al ecosistema, no el prestador.
- Si el cliente nunca quiso entrar, su data no queda flotando indefinidamente.

**Implicancia operacional para el prestador:**

Mientras el cliente está pendiente, no se pueden generar estadías, suscripciones ni bonos para esa mascota. La operación queda diferida hasta que el cliente complete su registro. UI del portal del prestador muestra mensaje claro al respecto.

**Implementación:**

Ver `BIO_EXPEDIENTE.md` (S19) para schema y RPCs (`buscar_cliente_por_email`, `crear_alta_asistida_pendiente`, `crear_alta_asistida_existente`, trigger `_trg_completar_pendiente_registro`, cleanup `cleanup_pendientes_vencidos`). **Enmiendas S69 (migración `20260718173000`):** las 6 funciones ganaron L-140 (REVOKE anon/PUBLIC); `crear_alta_asistida_pendiente` acepta email O teléfono; nace `normalizar_telefono` + hermana `buscar_cliente_por_telefono`; el match del trigger es dual (email O teléfono normalizado, AFTER INSERT OR UPDATE); `cleanup_pendientes_vencidos` marca `notificado_soporte_en` (UNA notificación) y **jamás borra**.

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

> **⚠️ CONFLICTO ABIERTO S79 (auditoría de mesa al cierre — NO
> RESUELTO; es firma del founder y plata de cara al cliente):** la
> REFORMA DEL PLAN MENSUAL (`MODELO_PASEO` §6.2 enmienda S79)
> contradice las cláusulas de DEVOLUCIÓN de esta política. (a)/(b)
> prometen crédito/reembolso proporcional *"al precio unitario
> efectivo"* y el porqué promete que *"lo no ejecutado vuelve o se
> acredita, nunca queda en un limbo"* — pero la voz publicada del plan
> dice lo contrario (*"las salidas que no uses no se descuentan"*), y
> el unitario ya NO es base estable (mensual ÷ N, con N variable por
> período — declarado en §6.2.4). **Estado medido, para que el
> conflicto se vea entero: el MOTOR todavía cumple P14** —
> `cerrar_y_renovar_planes` computa `crédito = unitario × sobrantes` y
> lo acredita/reembolsa (simulado); **la contradicción viva es
> VOZ-contra-P14/motor**, más la base unitaria debilitada. **Las dos
> salidas (decide el founder):** (α) **P14 se enmienda al modelo de
> suscripción pura** — pausar evita el próximo cobro; lo no usado del
> período corriente NO se devuelve (la voz publicada gana; el crédito
> del motor MUERE; (b) falla-del-prestador probablemente sobrevive como
> excepción); o (β) **la voz se corrige y el crédito vive** — P14 gana
> ("no se descuentan" muere de la Hoja; el unitario derivado queda
> consagrado como base de crédito pese a su no-estabilidad, declarada).
> **Disparo: ANTES del primer plan contratado por una familia REAL** —
> hasta la firma, el cobro simulado hace el conflicto invisible pero no
> menos real. `MODELO_PASEO` §6.2 punto 9 lo cruza.

---

## P15 — Cierre de cuenta ✅ **FIRMADA** (founder, 22-ago-2026 — S103)

> **Estado: FIRMADA y RIGE.** *Fue CANDIDATA desde S55 (once sesiones) y se
> firmó sobre el censo medido de S103-A.* El disparo de implementación sigue
> siendo la compuerta de tiendas (B6: el cierre de cuenta es requisito de
> Play/App Store) **y la letra ya no lo bloquea.**
> Nota de numeración: P14 = el plan de paseo (FIRMADA S55-B5).

### ✅ LA FIRMA, en sus cinco cláusulas

> ### **Cerrar la cuenta la vuelve INALCANZABLE. No destruye el registro.**

1. **La persona pierde el acceso.** El cierre es terminal desde su lado: no
   vuelve a entrar con esas credenciales.
2. **Su identidad se ANONIMIZA donde la ley lo permite.**
3. **Lo que la ley obliga a conservar —consentimientos, plata, obligación
   fiscal— SE CONSERVA, desligado de la persona.**
4. **Se le dice EXACTAMENTE eso antes de confirmar.** *No «vamos a borrar todo»:
   qué se va, qué queda y por qué.*
5. **Se le ofrece SU COPIA antes de irse** — portabilidad (LOPDP).

**Coherencia declarada: con `P23`** (*el borrado deja el archivo inalcanzable,
no lo sobrescribe; ante un derecho de supresión la respuesta honesta es «ya no
es accesible por ningún medio del producto», jamás «fue destruido»*) **y con la
regla 7.8.**

> ### ⚠️ **Y ACÁ VA UNA ACLARACIÓN QUE LA FIRMA NECESITA, MEDIDA EL MISMO DÍA: `7.8` SOSTIENE LA MITAD MECÁNICA DE `P15` Y NO LA MITAD LEGAL.**
>
> **Su literal COMPLETO, medido en `MODELO_FINANCIERO` §7.8:**
> *«**No se borra.** Eventos, liquidaciones, cuentas comerciales, roles: nunca
> DELETE en producción. Usar estados.»*
>
> **Eso es todo lo que dice. No menciona anonimización** — verificado por grep
> sobre el documento entero, con control positivo (`anonimiz` **sí** aparece en
> otros cinco documentos de `docs/`, o sea que la búsqueda encuentra lo que hay).
>
> **Por qué importa y no es prolijidad:** *«no se borra» a secas es
> **incompatible** con el derecho de supresión. «No se borra, **pero se anonimiza
> la referencia personal**» **sí** es compatible — y es el argumento que una
> política puede sostener ante la autoridad.* **La mitad que vuelve defendible a
> la regla es exactamente la que no está escrita.**
>
> **`P15` la agrega en su cláusula ②** y por eso las dos son coherentes **hacia
> adelante**; lo que queda debiendo es que **`7.8` lo diga en su propio archivo**
> — *y eso es enmienda de `MODELO_FINANCIERO`, firma del founder, no de esta
> política.* **Se declara acá para que nadie cite `7.8` como si ya lo dijera.**
> *Hallazgo de S103-D; medido de primera mano por S103-A antes de depositarlo.*

### 🔴 Y EL ARRASTRE QUE `P15` §1 TEME **YA ESTÁ EXPRESADO EN LA BASE**

**Entre las 21 FKs en `CASCADE` están `familia_miembro` y `mascota_codueño`.**
⇒ *Borrar al humano desengancha su vínculo con la mascota **sin preguntar por
los otros cuidadores**.* **Es literalmente el arrastre que §1 de esta política
declara temer — y no es hipotético: es el comportamiento vigente.**

*Otra razón, y de las buenas, por las que la firma eligió inalcanzable sobre
destruido: el `DELETE` no solo rebota contra 24 constraints — donde NO rebota,
hace daño callado.* Hallazgo de S103-D.

### 🔬 EL ARGUMENTO MEDIDO QUE SOSTIENE LA FIRMA — al acta por orden del founder

**No es una preferencia de diseño: es lo que la base permite y lo que no.**
Medido contra el remoto el 22-ago (`docs/relevamientos/2026-08-22-s103-CENSO-CICLO-DE-CUENTA.md` §④):

| | |
|---|---|
| FKs que apuntan a `auth.users` | **62** |
| **BLOQUEANTES** (`NO ACTION`/`RESTRICT`) | **24** |
| `CASCADE` | **21** |
| `SET NULL` | 17 |
| *control positivo* | *657 FKs en la base ⇒ la consulta mide* |

**Las dos mitades del argumento, y las dos apuntan a la misma conclusión:**

**① Un `DELETE` de usuario REBOTA hoy** — 24 FKs lo impiden, entre ellas
`pagos_intentos`, `pedidos`, `compras`, `consentimientos`, `evento_cita_servicio`,
`bonos` y `suscripciones_servicio`.

**② Y «arreglar» eso pasando las 24 a `CASCADE` sería PEOR que el rebote: se
llevaría los consentimientos y los intentos de pago.**

> ### **El registro de que alguien aceptó algo es justamente el que hay que conservar para poder demostrar qué se le prometió.**
> *Un producto que borra el consentimiento junto con la cuenta se queda sin la
> única prueba de que actuó bien — y se la lleva puesta en el momento exacto en
> que más la va a necesitar.*

**Precedente de la casa que la firma hereda:** las **64 cuentas de sonda de
S92** se resolvieron así — **cuentas borradas de `auth`, datos MARCADOS**, no
destruidos. *Y la marca no fue un rodeo para esquivar los CHECKs: era lo que los
CHECKs pedían.*

### Lo que la implementación TODAVÍA tiene que resolver (la firma fija la forma, no el detalle)

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

> ### ⚠️ ENMIENDA S87 — LA CLÁUSULA NO RIGE EN MEMORIAL *(firma del founder, 5-ago-2026)*
>
> **Criterio del founder, verbatim en su forma corta:** *la regla fue escrita
> para quien **eligió** no usar — **una familia en duelo no eligió nada**.*
>
> ⇒ **Cuando la mascota entra en memorial (`estado_vida <> 'activa'`), «lo que
> el cliente no usa lo pierde el cliente» DEJA DE REGIR** sobre el saldo ligado
> a esa mascota. Lo no consumido se libera; no se devenga como capacidad
> comprometida ni como flexibilidad no usada.
>
> **Por qué la enmienda existe y no es un detalle:** aplicarle a una familia en
> duelo la misma cláusula que a quien decidió no pasear **convierte una regla
> justa en un cobro por una ausencia que nadie quiso**. *Es el mismo criterio con
> el que S87 firmó `saldo_pagado` para `plan_renovacion_fallida`: **el daño manda
> sobre la coherencia formal de la regla**.*
>
> **Hermana obligatoria: [[D-657]]** — hoy el motor de planes **renueva y cobra
> sin mirar `estado_vida`**, y desde S87 el motor de avisos **calla** lo de esa
> mascota. *Sin esta enmienda y sin esa cura, el silencio del duelo vuelve
> silencioso el cobro.* **Su construcción es precondición del Lote 2.**

> **ENMIENDA FIRMADA S80 — DIFERIDA AL SOFT LAUNCH (decisión founder).**
> **LA REGLA, verbatim del founder:** *"El prestador cobra la capacidad
> que comprometió. Lo que el cliente no usa, lo pierde el cliente y lo
> cobra el prestador. Lo único que le corta el cobro al prestador es su
> propio incumplimiento."* Coincide ya con P14(b), P16(c) y P16(d) — las
> GENERALIZA. **Lo que cambia cuando dispare: lo vencido de (e) pasa de
> ingreso de plataforma a PAYOUT DEL PRESTADOR** (enmienda gemela en
> `MODELO_FINANCIERO` — Decisión T y 7.15 — con el argumento del
> descuento que la justifica). **EL DISPARO, escrito:** el soft launch
> (1-oct) — y como `vencer_paquetes_salidas` existe SIN CRON (medido
> S80: nadie la corre, cero breakage en la historia), **encender el
> reloj y aplicar esta enmienda son el MISMO ACTO** — jamás se enciende
> uno sin el otro. El aviso de (e) queda firmado: periódico y sereno,
> saldo + fecha, jamás countdown, SIEMPRE nombra la renovación (un
> aviso que anuncia la pérdida sin ofrecer el camino es una amenaza);
> cadencia de ESTADO, no de calendario — saldo cero, cero mensajes.
> Cruza con `MODELO_NOTIFICACIONES` §3 (`saldo_pagado`, a la firma).

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

**(1) La estructura (firmada — v1.2, S85).** La app del prestador tiene
CUATRO tabs: **Hoy · DATOS · Negocio · Cuenta**.

> ### ➕ ENMIENDA S85 — `Mascotas` PASA A LLAMARSE **DATOS**, y NO es una tab nueva
>
> **Firmada por la mesa (3-ago-2026).** *DATOS es **Mascotas creciendo y
> renombrándose**: la pantalla ya existía, gana el estado activo/histórico
> (`BIO_EXPEDIENTE` A3.5ter), las familias y la trayectoria, y cambia de
> nombre porque **dejó de contener solo mascotas**.*
>
> **⚠️ SIGUEN SIENDO CUATRO. Nadie agrega una quinta**, y se dice con esta
> claridad porque *"nace DATOS"* se lee como *"nace una tab"* — y esta misma
> letra ya se equivocó una vez en la dirección contraria: **la v1.0 sacó a
> Mascotas de la barra "por error de redacción, no por decisión"**. *Dos
> versiones seguidas discutiendo cuántas tabs hay es señal de que el número
> importa más de lo que parece: cada tab es un cuarto del pulgar del
> prestador.*
>
> **Y el porqué del rename, que es lo que lo justifica y no la moda:** la
> pantalla pasó de listar **a quiénes atendí** a contestar **a quiénes
> cuido** (el cambio de eje firmado en A3.5ter — *cartera, no historial*).
> **"Mascotas" describía su contenido viejo**; con familias y trayectoria
> adentro, el nombre habría quedado más chico que la pantalla.
>
> *Lo que NO cambia: su lugar en la barra, su posición y su historia. Es la
> misma tab.* La decisión de S57
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

**CON PASARELA REAL (disparo: PASARELA fase 1 — sin apellido de proveedor, enmienda S81):**
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

## P19 — El paseo es GRUPAL por norma (FIRMADA — founder S59)

> Cierra D-330 con esta letra. Gemelo: `MODELO_PASEO.md` §4.1 (el hueco
> del guard queda cubierto por esta política).

**La norma.** El paseo estándar de e-PetPlace puede incluir **más de un
perro a la vez**. No es excepción ni letra chica: se declara en las
condiciones del servicio Y visible en el flujo de reserva — la voz de la
superficie: *"Los paseos suelen ser con más de un perro a la vez."*

**La pregunta única (primera reserva por mascota).** En la PRIMERA
reserva de paseo de cada mascota, la familia responde UNA vez:
*"¿{nombre} se lleva bien paseando con otros perros?"*

- **SÍ** → se agenda con normalidad y **no se re-pregunta** en las
  reservas siguientes.
- **NO** → **no se permite agendar** el paseo grupal. Voz honesta SIN
  final mudo (patrón §6ter del paseo): *"Por ahora los paseos son en
  grupo. Estamos armando algo para {nombre}."* El NO **se REGISTRA en
  DB** (mascota, familia, fecha).

**Para qué se registra el NO.** El registro de NOs es el insumo de la
decisión de producto siguiente: si se acumulan, decide si nace la
**oferta de paseo personalizado** (individual, otro precio) o la
**derivación a entrenador** (la señal conductual es información de
cuidado, no un rechazo). Ninguna de las dos existe hoy — se declaran,
no se construyen.

**Dónde vive la respuesta.** En el perfil de la mascota, como dato de
socialización **EDITABLE** por la familia (un perro socializa, una
familia cambia de opinión) — editarla a SÍ habilita agendar; editarla a
NO vuelve a bloquear con la misma voz. La fila conductual
`nervioso_otros_perros` (D-300) sigue siendo la señal RICA del
expediente; la respuesta de P19 es el CONSENTIMIENTO operativo de
reserva — conviven, no se pisan.

---

---

## P21 — LA LETRA UBER: la cuenta es GLOBAL, el país es contexto de OPERACIÓN (FIRMADA — founder S70, 19 Jul 2026)

**El principio.** Una cuenta de e-PetPlace es **global**. El país **no es
un atributo de identidad** del usuario: es el **contexto en el que ocurre
una operación**. La persona se muda, viaja, opera en dos países, o vive en
uno con la línea telefónica de otro — y **sigue siendo la misma cuenta,
con el mismo expediente**. El modelo de Uber: te bajás en otra ciudad y la
app es la misma; lo que cambia es el contexto de lo que hacés ahí.

**La regla dura que se desprende (y el caso que la forzó):**

1. **El teléfono NO implica país.** El **caso canónico** es el propio
   founder: **opera en Ecuador con una línea de Colombia**. Un número con
   prefijo `+57` en un perfil de contexto EC no es un error de datos: es
   la realidad.
2. **PROHIBIDO derivar el prefijo telefónico del `country_code` del
   perfil.** Es exactamente la inferencia que este principio niega, y
   fabrica basura (`593` pegado a un número colombiano). El prefijo lo
   **declara el usuario**: escribiéndolo con `+`, o eligiéndolo en un
   selector de país **de la línea** — nunca heredado del contexto de
   operación. Forma canónica y estado de la reconciliación: **D-442**.
3. **Fiscalidad, liquidación y catálogo SIGUEN siendo por país de
   operación.** Esta letra no toca el camino de la plata: la cuenta
   comercial, la retención, el catálogo de servicios y los precios viven
   en el país donde la operación ocurre (`MODELO_FINANCIERO`). Lo que se
   prohíbe es usar ese contexto para **inferir identidad** del usuario.

**Test de la política:** si una pantalla, un guard o una normalización
**deduce** algo del usuario a partir del país de su perfil —su idioma, su
prefijo, su moneda personal, su documento—, está violando P21. El país
responde *"¿dónde está pasando esto?"*, jamás *"¿quién es esta persona?"*.

**Nota de numeración:** **P20 está RESERVADA** a la letra de **CUSTODIA**
(`MODELO_ADIESTRAMIENTO` §10.2, sesión de legales D-405) — verificado en
el cierre S70; por eso esta política toma **P21**.

**Gemelos:** `DEFINICION_SOFTLAUNCH.md` §3.5 (nota de operación) ·
`DEUDAS_CANONICAS.md` **D-442** (forma canónica del teléfono).

## P22 — Reagenda y cancelación de la cita CLÍNICA (DECLARADA — S76, sin letra)

**Estado: DECLARADA, SIN LETRA.** Nace por `LETRA_RECEPCION_S76` §8 (FIRMADA
founder, 24 Jul 2026) para que el boceto de la agenda de recepción sepa contra
qué reserva el lugar. **No se construye en S76.**

**Hermana de P18** — que cubre **SOLO el paseo suelto** (verificado en su
encabezado: *"el paseo INDIVIDUAL pagado, ni plan ni paquete"*). Para
veterinaria hoy **no existe ninguna política de reagenda — ni para el dueño, ni
para recepción, ni para nadie**.

**Lo que su letra ya tiene decidido** (`LETRA_RECEPCION_S76` §8): la reagenda es
del **pet parent**; recepción tiene **la misma puerta, porque el teléfono
existe** — con la misma huella (**fecha y hora, jamás servicio ni profesional**)
y procedencia escrita de quién la movió. **COORDINAR ≠ REAGENDAR:** fijar la
fecha de una `por_coordinar` es la excepción ya aprobada; reagendar una cita
fijada espera esta política.

**Lo que P22 tendrá que resolver y el paseo no tiene:** una cita clínica puede
arrastrar **caso clínico abierto**, **presupuesto atado** o **instrucciones de
preparación**.

**Contraste financiero OBLIGATORIO al escribirse** (`MODELO_FINANCIERO`, como
toda hermana de P18).

**Nota de numeración:** la letra fuente la dictó como "P20"; **P20 está
RESERVADA a la letra de CUSTODIA** (nota de P21, verificada al cierre S70) — la
mesa resolvió en S76 que custodia CONSERVA P20 (materia legal, su número puede
estar citado afuera del repo) y la reagenda clínica toma **P22**.

## P23 — Qué significa «borrado» para un documento de identidad (FIRMADA — founder S92-BIS, 9 Ago 2026)

**Origen: orden del founder al cerrar D-731** — *«anotá lo que reportaste sobre
el blob: borrar deja el objeto inalcanzable, no lo sobrescribe. Para datos de
identidad esa distinción importa y debe estar escrita en la política de datos,
no solo en un acta.»*

**Alcance:** cédulas, RUC, títulos profesionales, registros y permisos — todo lo
que vive en `prestador-documentos`, y por extensión cualquier archivo que
acredite la identidad de una persona.

### (a) La cadena completa, y por qué son dos actos y no uno

Un documento vive en **dos lugares**: una fila que lo referencia y un archivo en
Storage. **Borrar la fila no borra el archivo.** Hasta S92-BIS eso era el
defecto D-731: toda baja dejaba el documento en el bucket para siempre. Desde la
cura, borrar la fila **encola** el borrado del archivo y un barredor con
credencial lo ejecuta. *Los dos actos ahora están atados, pero siguen siendo
dos: quien toque este camino no puede asumir que uno arrastra al otro por
magia.*

### (b) Lo que el borrado hace, dicho sin adorno

El archivo **deja de ser alcanzable**: desaparece de la API, de todo listado y
de toda URL firmada. **No se sobrescribe.** La recuperación física del bloque en
el almacenamiento del proveedor no está bajo control de e-PetPlace y no se
promete.

**Por qué esta distinción se escribe acá y no solo en un acta técnica:** el día
que una persona ejerza su derecho a que se borren sus datos, la respuesta
honesta es *«el documento ya no es accesible por ningún medio del producto»* —
no *«el archivo fue destruido»*. **Prometer lo segundo sería una promesa que el
sistema no puede cumplir**, y una política de datos que promete de más es peor
que una que declara su límite.

### (c) Lo que nunca es aceptable

- **Reportar éxito sobre un borrado no confirmado.** Si el archivo no se pudo
  quitar, la intención queda registrada, se reintenta y queda visible. *Un
  borrado que falla en silencio deja a la persona creyendo que su documento no
  existe cuando existe.*
- **Dejar la fila sin el archivo.** Es el estado peor de los dos mundos: el dato
  ya no se puede usar y **ninguna política de retención lo protege, porque para
  el producto ya no existe**.
- **Conservar documentos de quien no es prestador vigente** sin una razón
  escrita. La retención sin razón declarada no es archivo: es acumulación.

### (d) Lo que esta política NO resuelve todavía

El plazo de retención de los documentos de un prestador que se da de baja
(obligaciones fiscales o de verificación pueden exigir conservarlos un tiempo).
**Hoy no hay plazo escrito**, y hasta que lo haya la decisión de borrar
documentos existentes es del founder, caso por caso — ver **D-732**.

## Historial de versiones

- **v1.0 (13 May 2026 — S16)**: Primera redacción. 12 políticas iniciales derivadas del refactor de modelo de S16.
- **v1.1 (15 May 2026 — S19)**: Política P13 agregada (alta asistida por prestador). Cubre el flow de consentimiento cuando un prestador necesita registrar a un cliente no registrado durante atención presencial.
- **v1.2 (11 Jul 2026 — S55)**: P15 agregada como CANDIDATA (eliminación de cuenta del dueño — espec de la letra (a) de Cuenta v1; rige recién con la firma del founder). P14 reservada para paquetes de paseo (`MODELO_PASEO.md` §6, financiero v2.5).
- **v1.3 (11 Jul 2026 — S55-B5)**: P14 FIRMADA (founder, OK completo al paquete del plan): (a) salto con ≥24 h reagenda en el período con el mismo paseador, sobrantes al cierre = crédito si renueva / reembolso proporcional si no · (b) falla del prestador = crédito o reembolso a elección del dueño · (c) <24 h = la cita se pierde · (d) pausa = no renovar, el período corriente se rige por (a)/(b). Gemelos: `MODELO_PASEO.md` v1.1 y `MODELO_FINANCIERO.md` v2.5 (Decisión S).
- **v1.4 (12 Jul 2026 — S56)**: P16 FIRMADA (founder S56, paquete de letra del PAQUETE DE SALIDAS): (a) comprar no es reservar — vigencia mensual declarada al comprar · (b) cancelar con ≥2 h devuelve la salida al saldo y libera la franja · (c) no-show = salida consumida, el paseador cobra (cierre `no_show`) · (d) falla del prestador = saldo o reembolso proporcional a elección del dueño · (e) rollover al renovar antes del vencimiento; sin renovación vencen (breakage declarado); recordatorio UNO y sereno, jamás countdown. Nota de ventanas: 24 h del plan vs 2 h del paquete es DECISIÓN. Gemelos: `MODELO_PASEO.md` v1.2 (§6bis/§6ter) y `MODELO_FINANCIERO.md` v2.6 (Decisión T + 7.15).
- **v1.6 (12 Jul 2026 — S57)**: P17 FIRMADA e integrada (letra v1.1 del arquitecto, firmada por el founder en sesión): la Cuenta del prestador — CUATRO tabs Hoy·Mascotas·Negocio·Cuenta (la única decisión fue separar Cuenta de Negocio; la v1.0 desplazaba Mascotas por error de redacción, corregido con firma en la misma sesión) · Negocio puro oficio · pulido a la vara de la Cuenta del cliente en la pasada de acabados · eliminación de cuenta DECLARADA con enmienda de letra previa a construcción (la entrada dice "Pronto", jamás finge borrar). Cierra la reserva de numeración de la v1.5. Nota de proceso: la integración llegó UNA respuesta tarde — el primer envío anunció el literal sin adjuntarlo y la A frenó por regla 76b (freno ratificado por el arquitecto).
- **v1.8 (18 Jul 2026 — S69/T2)**: P13 enmendada (letra = realidad, decisión founder): la invitación de alta asistida expira a 30 días, el **dato clínico JAMÁS** (el Bloque 0 S69 probó que el cleanup nunca borró; se firma como principio — el expediente queda bajo el acceso operativo del prestador que lo produjo, esperando reclamo sin fecha de muerte). Contacto-flexible (email O teléfono) + reclamo dual por teléfono normalizado + una notificación terminal a soporte. Migración `20260718173000` (S69-A2).
- **v1.7 (13 Jul 2026 — S59)**: P19 FIRMADA (founder S59 — el paseo es GRUPAL por norma): la norma se declara en condiciones Y en el flujo de reserva ("Los paseos suelen ser con más de un perro a la vez.") · pregunta única en la primera reserva por mascota ("¿{nombre} se lleva bien paseando con otros perros?") · SÍ = se agenda y no se re-pregunta · NO = no se agenda, voz honesta con camino ("Por ahora los paseos son en grupo. Estamos armando algo para {nombre}.") y el NO se REGISTRA (mascota, familia, fecha) como insumo de la decisión paseo personalizado vs derivación a entrenador · la respuesta vive en el perfil de la mascota y es EDITABLE. **Cierra D-330.** Gemelo: `MODELO_PASEO.md` §4.1.
- **v1.5 (12 Jul 2026 — S57)**: P18 FIRMADA (founder S57, redacción del arquitecto sobre decisión en sesión — cancelación y reagenda del paseo SUELTO): (a) ≥24 h = reagendar o cancelar con destino a elección del dueño (medio de pago original con sus 15 días hábiles declarados, o saldo e-PetPlace) · (b) entre 24 y 2 h = solo reagendar, la plata no se mueve · (c) <2 h o no presentarse = el paseo se pierde y el paseador cobra (cierre `no_show`, Decisión T) · (d) falla del prestador = devolución o saldo a elección, sin discusión. Camino de la plata: la cancelación se DECLARA sobre el pago (patrón 7.14 enmendada; `aplicar_reembolso()` intacta). Construcción diferida: la pantalla de elección de destino y el saldo e-PetPlace esperan Kushki fase 1 — hoy el reembolso es simulado y declarado, sin pantalla de destino. **P17 queda RESERVADA** para la Cuenta del prestador (sin letra). Gemelos: `MODELO_PASEO.md` v1.3 (§3bis) y `MODELO_FINANCIERO.md` v2.7 (nota 7.16).
- **v1.10 (24 Jul 2026 — S76)**: **P22 DECLARADA, sin letra** (reagenda y cancelación de la cita CLÍNICA — nace por `LETRA_RECEPCION_S76` §8, FIRMADA founder). Hermana de P18 (que cubre SOLO el paseo suelto); contraste financiero obligatorio al escribirse; lo que tendrá que resolver y el paseo no tiene: caso abierto, presupuesto atado, instrucciones de preparación. No se construye en S76. **Nota de numeración:** la letra fuente decía "P20"; la mesa resolvió que **custodia CONSERVA P20** (reserva S70, D-405 — materia legal, número citable afuera del repo) y la reagenda toma **P22** — el choque lo atrapó el freno de A contra el literal de POLITICAS (L-166 aplicada contra la mesa).
- **v1.9 (19 Jul 2026 — S70/T3)**: **P21 FIRMADA (LA LETRA UBER)** — la cuenta es GLOBAL y el país es contexto de OPERACIÓN, jamás de identidad; el teléfono NO implica país (caso canónico: el founder en EC con línea CO); PROHIBIDO derivar el prefijo del `country_code` del perfil (el prefijo lo declara el usuario, con `+` o selector de país de la línea); fiscalidad y liquidación siguen por país de operación. **P20 queda RESERVADA a la custodia (D-405)** — verificado en el cierre. Gemelos: `DEFINICION_SOFTLAUNCH.md` §3.5 y **D-442** (forma canónica del teléfono, reescrita bajo esta letra).
- **v1.11 (9 Ago 2026 — S92-BIS)**: **P23 FIRMADA** — qué significa «borrado» para un documento de identidad. Origen: orden del founder al cerrar **D-731** (la FK `ON DELETE CASCADE` + la policy de borrado propio + cero funciones que tocaran Storage dejaban cédulas, RUC y títulos en el bucket para siempre). La política dice las tres cosas que un acta técnica no alcanza a fijar: **(a)** el documento vive en dos lugares y borrar la fila no borra el archivo — desde la cura los dos actos están atados, pero siguen siendo dos; **(b)** el borrado deja el archivo **inalcanzable, no lo sobrescribe** ⇒ ante un derecho de supresión la respuesta honesta es *«ya no es accesible por ningún medio del producto»*, jamás *«fue destruido»* — **prometer lo segundo sería una promesa que el sistema no puede cumplir**; **(c)** nunca es aceptable reportar éxito sobre un borrado no confirmado, ni dejar la fila sin archivo (*el dato ya no se puede usar y ninguna retención lo protege, porque para el producto ya no existe*), ni conservar documentos de quien no es prestador vigente sin razón escrita. **Lo que P23 NO resuelve y queda declarado: el plazo de retención tras una baja** — hasta que exista, el borrado de documentos existentes lo decide el founder caso por caso (**D-732**).
