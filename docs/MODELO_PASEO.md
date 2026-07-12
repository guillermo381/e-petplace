# MODELO_PASEO — El contrato del servicio de paseo

> **Versión: v1.0 — S55 (11 Jul 2026).** Decisiones de producto cerradas
> por el founder en sesión; escrito por el arquitecto (escritor único de
> docs, regla 76). **Contrastes obligatorios:** `MODELO_FINANCIERO.md`
> v2.4 (el camino de la plata — Decisiones Q/R y regla 7.13 rigen acá
> sin excepción), `DISEÑO_EXPERIENCIA.md` (momento-primero, verdad
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

## 6. Paquetes y recurrencia — CAPA POSTERIOR (candado)

El paquete mensual / la recurrencia se montan sobre el mecanismo
existente (`bono_id` / `suscripcion_servicio_id`) como manda la
enmienda S54 de RUTA_F1 (principio de secuencia). PERO:

> **REGLA DURA (founder S55): el paquete NO se vende sin
> `MODELO_FINANCIERO.md` v2.5 + P14 firmados.** El devengo de un bono
> multi-paseo (¿cuándo se gana la comisión de un paquete pagado por
> adelantado?) es contrato financiero, no feature de UI.

Decisiones de producto YA tomadas para esa capa (registradas, no
implementadas):

- **Continuidad de paseador (post-MVP):** el paquete aspira al MISMO
  paseador (el vínculo es parte del valor).
- **Sustitución con mensaje al pet parent (post-MVP, decisión founder
  S55):** si el paseador titular no puede, la sustitución se COMUNICA
  al dueño — jamás un reemplazo silencioso. Deuda D-333.

## 7. Los tests de toda feature de paseo

1. ¿Respeta el menú canónico (ni un bloque fuera del CHECK)?
2. ¿La ventana completa manda (cero doble-booking parcial)?
3. ¿Verdad firme intacta (nada tentativo visible al prestador)?
4. ¿El camino de la plata intacto (Q, R, 7.13 — cero eventos al pagar)?
5. ¿Los huecos §5 siguen declarados o su disparo ya sonó?

## Historial

- **v1.0 (S55, 11 Jul 2026):** redacción inicial con el modelo cerrado
  del founder (menú canónico con techo 300, precio por bloque,
  capacidad por cupo) + el motor de ocupación por ventana implementado
  (S55-B2) + huecos declarados con disparo (grupal/zonas/calendario) +
  candado de paquetes (financiero v2.5 + P14).
