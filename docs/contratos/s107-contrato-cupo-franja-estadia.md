# S107 · CONTRATO — CUPO, FRANJA Y ESTADÍA (pista A → B, C)

> **Publicado:** 28-ago-2026, **antes de que exista la migración** (regla S106: los artefactos que otra pista debe medir se publican aunque no estén para main).
> **Estado:** 🟡 **CONTRATO, no motor.** Los nombres están fijados y **no se mueven sin avisar acá**; los cuerpos los escribe A. B y C **codifican contra esto desde ya**.
> **Fundado en:** `S107-A-CENSO` §① y §② — **esto es una traducción del molde vivo de la despensa (`20260812140000_s96_b3`), no un diseño nuevo.** Quien lo lea con esa migración al lado va a reconocer cada pieza.

---

## ⓪ LA FORMA DEL OFICIO — fijada, y es lo que ordena todo lo demás

**Una estadía = UN animal, UN día.** La «lista de hoy» del prestador es una **VISTA** sobre las estadías del día — **jamás una entidad «jornada»** (plan §4.5). Un día con seis animales son **seis estadías**, no una jornada con seis.

🔴 **Consecuencia que C debe respetar:** la pantalla del día **compone** leyendo estadías; no existe un objeto «jornada» que pedir ni que mutar.

---

## ① EL CUPO — `guarderia_espacios` + `guarderia_espacio_excepciones`

Traducción literal del molde (`recursos_reparto` + `recurso_reparto_excepciones`).

```
guarderia_espacios
  id                uuid pk
  prestador_id      uuid not null        -- la capacidad es DEL LUGAR, no de la casa
  nombre            text not null        -- "Sala principal"
  capacidad_por_dia integer not null  CHECK > 0
  dias_operacion    integer[] not null   -- dow 0..6
  activo            boolean not null default true

guarderia_espacio_excepciones
  espacio_id  uuid not null
  fecha       date not null
  disponible  boolean not null           -- false = cierra ese día; true = abre fuera de patrón
  UNIQUE (espacio_id, fecha)
```
**Regla, idéntica al molde: confirmado ese día = activo Y (patrón lo incluye O una excepción lo trae) Y ninguna excepción lo saca. La excepción GANA.**

### La función de cupo — **la firma es la del molde**

```
cupo_guarderia_del_dia(p_prestador_id uuid, p_fecha date) RETURNS jsonb
  -- { fecha, capacidad, consumido, disponible }
  -- capacidad = SUMA de espacios confirmados ese día
  -- consumido = estadías de ese prestador con esa fecha, estado NOT IN ('cancelada')
  -- disponible = GREATEST(capacidad - consumido, 0)
```
🔴 **`p_fecha` es fecha LOCAL del lugar** (zona horaria de sus franjas, §②) — contar por timestamp UTC parte el día a medianoche y sobrevende el borde.
🔴 **Bajar la capacidad con reservas tomadas rige hacia adelante y jamás cancela.** Si `capacidad < consumido`, `disponible` da 0 y el día queda **sobrevendido declarado**: la función lo devuelve como `sobrevendido: true` y **la superficie del prestador lo muestra** — nunca se resuelve solo.

**Wrapper:** `obtenerCupoGuarderia(prestadorId, desde, hasta) → ResultadoWrapper<CupoDia[]>`
`CupoDia = { fecha: string; capacidad: number; consumido: number; disponible: number; sobrevendido: boolean }`

> **Para B (pieza 1, el calendario):** el día lleno es `disponible === 0`. 🔴 **Se ve lleno y lo dice** — jamás desaparece. **No pintes `disponible` como «quedan N»**: es dark pattern prohibido (`MODELO_LOYALTY` §7.5). El número viaja para que la pieza decida, no para mostrarse.

---

## ② LAS FRANJAS — `guarderia_franjas`

Traducción de `entrega_turnos`, **con su `zona_horaria` como dato** (el molde ya lo traía; no se cablea Guayaquil).

```
guarderia_franjas
  id            uuid pk
  prestador_id  uuid not null
  tipo          text not null CHECK IN ('recogida','devolucion')
  desde         time not null
  hasta         time not null
  dias_semana   integer[] not null
  zona_horaria  text not null default 'America/Guayaquil'
  activo        boolean not null default true
  UNIQUE (prestador_id, tipo, dias_semana)   -- una ventana por tipo por patrón
```
**Validación mínima (en la puerta, no en la pantalla):** `desde < hasta` en cada una, y **la de recogida termina antes de que empiece la de devolución** — rebote tipado `franjas_se_cruzan`.

**Wrapper:** `obtenerFranjasGuarderia(prestadorId)` · `definirFranjaGuarderia({ prestadorId, tipo, desde, hasta, diasSemana, zonaHoraria })`

> **Para B (pieza 2, la ficha de franja):** recibe las dos franjas ya resueltas y las pinta («Recoge 7:00–9:00 · Devuelve 16:30–18:30»). **La misma pieza** en config del prestador y en perfil del lugar.

---

## ③ LA ESTADÍA — `guarderia_estadias`, compañera 1:1 de la cita

🔴 **La reserva ES una cita** (`evento_cita_servicio`, `tipo_servicio = 'guarderia_dia'`), con `fecha` = el día y **`hora` NULL** — medido: ambas son nullable (censo §④). **Así hereda el motor de pagos entero por `cita_id`.**
La máquina de estados del oficio vive **aparte**, para no contaminar la cita compartida:

```
guarderia_estadias
  id            uuid pk
  cita_id       uuid not null UNIQUE     -- 1:1 con la cita
  espacio_id    uuid                     -- dónde quedó (nullable hasta asignar)
  estado        text not null CHECK IN
        ('reservada','recogida_en_curso','en_guarderia',
         'retorno_en_curso','entregada','cancelada','no_recogida')
  a_bordo_en    timestamptz
  llegada_en    timestamptz
  entregada_en  timestamptz
```

🔴 **Las transiciones ocurren SOLO por eventos server autenticados** (el actuador de `LETRA_PAGO_CITAS` §4). **La UI jamás declara un estado** — C lee y muestra; nunca escribe el estado por su cuenta.

**`no_recogida` (firma ②):** la franja de recogida venció sin animal a bordo. **Lo declara un evento server al vencer la franja, no una pantalla.** El día **queda cobrado y no se repone**.
🔴 **De `no_recogida` no cuelga NADA**: sin conteo, sin avisos de mora, sin camino a refugio. Eso es letra + soporte (§0 del plan).

**Wrappers:** `obtenerEstadiasDelDia(prestadorId, fecha)` (la vista del prestador) · `obtenerMisEstadias(mascotaId)` (la del dueño) · `marcarABordo(estadiaId)` · `marcarLlegada(estadiaId)` · `marcarRetorno(estadiaId)` · `marcarEntregada(estadiaId)`.
**Todos devuelven `ResultadoWrapper`; cada rebote es un código tipado, jamás un `throw` desnudo.**

---

## ④ EL COBRO — qué hereda y qué cuesta

Medido (censo §③): el sujeto del pago es **una columna nullable por tipo** en `pagos_intentos`.

| modalidad | sujeto | estado |
|---|---|---|
| **día suelto** | `cita_id` | 🟢 existe — **cero trabajo de esquema** |
| **mensualidad** | `suscripcion_servicio_id` + `suscripcion_periodo` | 🟢 existen |
| **paquete** | `bono_id` | 🔴 **columna nueva** en `pagos_intentos` |

🟢 **La comisión NO se cablea:** `fee_configs` vigente da **10 % base `subtotal`** para `tipo_origen='cita'` **sin discriminar oficio** ⇒ **guardería hereda sin fila propia** (censo §⑥). **Nadie siembra una fila de guardería.**

🟢 **EL CONGELADO EXISTE Y NUESTRA PUERTA LO HEREDA — verificado leyendo el trigger, no asumido** (censo §⑤):

```
trg_cita_congela_desglose  AFTER INSERT ON evento_cita_servicio
```
Congela en **`cita_desglose`** cuando la cita nace con `estado_reserva='pendiente_pago'` y `precio IS NOT NULL`; resuelve moneda de la cuenta comercial y `fee_config`. **Sin moneda no congela, y la compuerta 2 del motor rebota fail-closed.**

⇒ **Toda puerta que INSERTe una estadía con `pendiente_pago` + `precio` hereda el congelado sin tocar el trigger. La «octava puerta» que la letra anticipó es la nuestra.** 🔴 **No se reimplementa nada.**

> ⚠️ **CORRECCIÓN DE ESTE CONTRATO (28-ago, antes de que nadie lo consumiera):** una versión anterior declaró acá un hueco —*«el congelado no está donde el plan lo supone»*— **y era falso: se buscó el trigger sobre `pagos_intentos` cuando vive sobre `evento_cita_servicio`, y la tabla es `cita_desglose`, no `pagos_desglose`.** *Se midió el objeto equivocado y se concluyó con seguridad.* Queda escrito porque **un hueco inventado manda a alguien a resolver un problema que no existe**, y en este caso lo habría invitado a reimplementar un congelado que ya funciona.

🔴 **PERO EL DESGLOSE ES POR CITA, O SEA POR DÍA** (censo §⑤, costo 3) — y eso **sí** es hueco real: paquete y mensualidad se cobran como **UNA** compra, así que su desglose **no puede ser la suma de N desgloses de cita**. La mensualidad ya tiene `suscripcion_desglose`; **el paquete no tiene ninguno.** **Ese es el trabajo de cobro del paquete, y es de A.**

⚠️ **Segundo costo medido, y es decisión de mesa, no de pista:** `evento_cita_servicio.modalidad` es **vocabulario CERRADO** (`presencial|telemedicina|domicilio|emergencia_movil|local`) y **guardería con recogida a domicilio no tiene su valor**. *Un vocabulario cerrado no se amplía de paso.*

**El orden de cobro no se negocia** (`LETRA_PAGO_CITAS` §3): compuertas → cobro por el motor → **`confirmada` sólo cuando el motor confirma**. **Hold de cupo con vencimiento** en las tres modalidades: si el pago no llega, el hold vence y los espacios se liberan.

---

## ⑤ EL ANCLA DE P18 — un solo instante, escrito acá para que ninguna pantalla lo invente

🔴 **El ancla de las ventanas 24 h / 2 h es el INICIO de la franja de recogida del día reservado** (una franja no es un instante; su inicio sí).

Camino de la plata, P18 tal cual: **≥24 h** reagendar o cancelar con destino a elección · **24–2 h** sólo reagenda · **<2 h o no-show** se pierde y el prestador cobra · **falla del prestador** devuelve sin discusión.
**Paquete (firma ⑤):** cancelar un día con las ventanas de P18 **lo devuelve al saldo — la plata no se mueve.**
**Mensualidad:** cancelar **un día** libera el cupo **y nada más** (el abono compra el lugar, no asistencias).

**Wrapper:** `cancelarEstadia(estadiaId, destino?)` · `reagendarEstadia(estadiaId, nuevaFecha)` — el server decide qué ventana rige y **devuelve cuál aplicó**, para que la pantalla no la recalcule.

---

## ⑥ EL GATE SANITARIO — se construye, y nace ABIERTO

```
evaluar_requisitos_guarderia(p_mascota_id uuid) RETURNS jsonb
  -- { estado: 'al_dia' | 'faltan', faltantes: [ { codigo, nombre, camino } ] }
```
**Cada faltante viaja con su camino a resolver** (cargar el carnet) — *un pendiente que el dueño no puede resolver es peor que no mostrarlo.*

🔴 **PERO EL GATE NACE ABIERTO, Y ES DECISIÓN MEDIDA, NO DESCUIDO.** Censo §⑤: **5 de 78 animales tienen alguna vacuna** y **`fecha_proxima` está en 1 de 32 filas**. Cerrarlo hoy **rechaza a 73 de 78** — *un gate que corre sobre un criterio sin datos no gatea: rechaza a todos.*
**La función se construye y devuelve la verdad; el enforcement se enciende cuando la mesa firme qué significa «al día».** Hasta entonces `faltan` **informa y no bloquea**, y la superficie lo dice honesto.

> **Para C:** montá el semáforo completo. **No escribas el bloqueo de reserva contra él todavía** — la compuerta es del server y hoy está abierta a propósito.

---

## ⑦ LO QUE ESTE CONTRATO **NO** CUBRE (y a quién le toca)

- **Documentos, aceptaciones y actas** — contrato aparte, A lo publica enseguida.
- **El esquema de media del durante** — contrato aparte (A → D, B).
- **Cualquier texto legal** — de la mesa. Acá se construye el estante, jamás el libro.
- **El protocolo de mora** — **no se construye** (§0 del plan).
