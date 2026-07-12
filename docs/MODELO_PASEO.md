# MODELO_PASEO — El contrato del servicio de paseo

> **Versión: v1.1 — S55 (11 Jul 2026).** Decisiones de producto cerradas
> por el founder en sesión; escrito por el arquitecto (escritor único de
> docs, regla 76). **Contrastes obligatorios:** `MODELO_FINANCIERO.md`
> v2.5 (el camino de la plata — Decisiones Q/R/S y regla 7.13 rigen acá
> sin excepción), `POLITICAS_EPETPLACE.md` P14 (la política del plan),
> `DISEÑO_EXPERIENCIA.md` (momento-primero, verdad firme), `RUTA_F1.md`
> (principio de secuencia S54: el paseo se deja COMPLETO antes del
> siguiente servicio).
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

## 4. Capacidad simultánea

`prestador_horarios.max_citas_por_slot` = cuántas citas SUPERPUESTAS
son legales en la franja (cupo N ⇒ N mascotas a la vez). Hoy el seed y
las ofertas reales operan con cupo 1 (paseo individual).

- **Empleados como multiplicador (futuro):** cuando el prestador tenga
  equipo, la capacidad real es paseadores disponibles × su cupo — hoy
  el cupo es un número plano por franja; el multiplicador por empleado
  se modela cuando exista el segundo paseador de una misma sede.

### 4.1 HUECO — paseo grupal y la señal `nervioso_otros_perros`

La fila conductual `nervioso_otros_perros` (D-300, S46) existe EXACTA
para esto: una mascota que evita a otros perros **no entra a un paseo
grupal** sin decisión explícita de su familia. Hoy NO hay guard: el
motor permite cupo >1 sin mirar la señal.
**Disparo:** el primer prestador que OFERTE cupo >1 — antes de que ese
horario se publique, el guard se diseña (bloquear, avisar o pedir
consentimiento: decisión de producto pendiente). Deuda D-330.

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
- **Mismo paseador todo el plan** — la continuidad está FIRMADA (el
  vínculo es parte del valor). La sustitución automática con mensaje al
  pet parent sigue siendo post-MVP (D-333 intacta): en el MVP del plan,
  si el paseador no puede, rige P14(b).
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
(variante (b) intacta). `MODELO_FINANCIERO.md` v2.5 §Decisión S.

### 6.3 Evolución opcional (apagada)

**Plan anual:** registrado como evolución posible del mismo chasis
(período anual con cobro mensual). NO se diseña ni se construye hasta
decisión explícita del founder — apagado, sin lugar en UI.

## 7. Los tests de toda feature de paseo

1. ¿Respeta el menú canónico (ni un bloque fuera del CHECK)?
2. ¿La ventana completa manda (cero doble-booking parcial)?
3. ¿Verdad firme intacta (nada tentativo visible al prestador)?
4. ¿El camino de la plata intacto (Q, R, S, 7.13 — cero eventos al pagar; en el plan: un pago, N devengos)?
5. ¿Los huecos §5 siguen declarados o su disparo ya sonó?

## Historial

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
