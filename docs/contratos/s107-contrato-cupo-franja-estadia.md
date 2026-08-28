# S107 · CONTRATO — CUPO, FRANJA Y ESTADÍA (pista A → B, C)

> **Publicado:** 28-ago-2026, **antes de que exista la migración** (regla S106: los artefactos que otra pista debe medir se publican aunque no estén para main).
> **Estado:** 🟡 **CONTRATO, no motor.** Los nombres están fijados y **no se mueven sin avisar acá**; los cuerpos los escribe A. B y C **codifican contra esto desde ya**.
> **Fundado en:** `S107-A-CENSO` §① y §② — **esto es una traducción del molde vivo de la despensa (`20260812140000_s96_b3`), no un diseño nuevo.** Quien lo lea con esa migración al lado va a reconocer cada pieza.

---

## ⓪bis · LOS NOMBRES, RATIFICADOS POR A — *(28-ago-2026, contra la base)*

**Los fijó C (por el prompt pegado por error) y el plan dice que los fija A contra la base. A los midió y los RATIFICA los cuatro, sin renombrar:**

`guarderia_espacios` · `guarderia_espacio_excepciones` · `guarderia_franjas` · `guarderia_estadias` · `guarderia_media` + `guarderia_media_etiquetas`

**Por qué se ratifican y no se renombran:** la casa nombra la **configuración** por su dominio (`recursos_reparto`, `prestador_horarios`, `prestador_servicios`) y el **expediente** con `evento_*`. Estas tablas son configuración y operación del oficio, no eventos de expediente — **los eventos siguen naciendo en `eventos_mascota`**, que no cambia. *Un renombre sin razón cuesta dos recodificaciones y no compra nada.*

> 🔴 **PERO HAY UNA TRAMPA MEDIDA, Y SE CIERRA ACÁ: YA EXISTE UNA TABLA `estadias`.**
> Censo ⓪: **0 filas · RLS ON con 8 policies · CERO consumidores en el monorepo · `tipo_servicio DEFAULT 'hotel'` · semántica de NOCHES** (`cantidad_noches`, `precio_por_noche`) — *justo lo que `LETRA_GUARDERIA` §5 manda afuera de v1.*
>
> **`estadias` y `guarderia_estadias` van a convivir**, y el prefijo alcanza para desambiguar al escribir — **pero no al leer de apuro**. ⇒ **La migración le pone LÁPIDA a la vieja** (`COMMENT ON TABLE`) diciendo qué es, que no se usa y que **guardería NO vive ahí**. *Una tabla vacía con el nombre correcto es la trampa más barata de caer y la más barata de cerrar.*

**Desde acá los nombres están CONGELADOS: cambiarlos es aviso a B, C y D, no un edit.**

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

> ⚠️ **Y ACÁ HAY QUE DESARMAR UNA CONTRADICCIÓN APARENTE CON EL BRIEF, ANTES DE QUE ALGUIEN LA «CURE».** El `BRIEF S107` §1 dice, en negrita: *«se comporta como un PASEO, no como una cita»* — y este contrato dice que **la reserva ES una cita**. **No se contradicen, y lo prueba el objeto: el paseo también vive en `evento_cita_servicio`** (medido: sus reservas son citas con `tipo_servicio` de paseo). **Lo que el brief niega es la GRILLA de la cita médica** —turnos de 30 minutos, hora exacta, disponibilidad por profesional—, **no la tabla.** *Heredar el motor del paseo y ser una fila de citas son la misma cosa dicha con dos vocabularios.* 🔴 **Quien lea el brief y quiera sacar la guardería de `evento_cita_servicio` va a perder el motor de pagos entero por una lectura de palabra.**

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
| **paquete** | `bono_id` | 🔴 **construcción de A** — columna nueva en `pagos_intentos` **+ su entrada al check de sujeto + `bono_desglose`** |

🟢 **La comisión NO se cablea:** `fee_configs` vigente da **10 % base `subtotal`** para `tipo_origen='cita'` **sin discriminar oficio** ⇒ **guardería hereda sin fila propia** (censo §⑥). **Nadie siembra una fila de guardería.**

🟢 **EL CONGELADO EXISTE Y NUESTRA PUERTA LO HEREDA — verificado leyendo el trigger, no asumido** (censo §⑤):

```
trg_cita_congela_desglose  AFTER INSERT ON evento_cita_servicio
```
Congela en **`cita_desglose`** cuando la cita nace con `estado_reserva='pendiente_pago'` y `precio IS NOT NULL`; resuelve moneda de la cuenta comercial y `fee_config`. **Sin moneda no congela, y la compuerta 2 del motor rebota fail-closed.**

⇒ **Toda puerta que INSERTe una estadía con `pendiente_pago` + `precio` hereda el congelado sin tocar el trigger. La «octava puerta» que la letra anticipó es la nuestra.** 🔴 **No se reimplementa nada.**

> ⚠️ **CORRECCIÓN DE ESTE CONTRATO (28-ago, antes de que nadie lo consumiera):** una versión anterior declaró acá un hueco —*«el congelado no está donde el plan lo supone»*— **y era falso: se buscó el trigger sobre `pagos_intentos` cuando vive sobre `evento_cita_servicio`, y la tabla es `cita_desglose`, no `pagos_desglose`.** *Se midió el objeto equivocado y se concluyó con seguridad.* Queda escrito porque **un hueco inventado manda a alguien a resolver un problema que no existe**, y en este caso lo habría invitado a reimplementar un congelado que ya funciona.

🔴 **PERO EL DESGLOSE ES POR CITA, O SEA POR DÍA** (censo §⑤, costo 3) — y eso **sí** es hueco real: paquete y mensualidad se cobran como **UNA** compra, así que su desglose **no puede ser la suma de N desgloses de cita**. La mensualidad ya tiene `suscripcion_desglose`; **el paquete no tiene ninguno.**

### ✏️ EL PAQUETE, RESUELTO (firma de la mesa, 28-ago) — y es construcción de A

```
pagos_intentos
  + bono_id  uuid            -- QUINTO sujeto
  chk_intento_un_solo_sujeto -> pedido | cita | recurrencia | suscripcion | BONO  (sigue = 1)

bono_desglose                -- hermano de suscripcion_desglose
  bono_id  uuid pk
  subtotal · impuesto · total · moneda · fee_config_id · congelado_en
```

🔴 **EL DESGLOSE DEL PAQUETE ES POR COMPRA — jamás la suma de N desgloses de cita.** *El congelado por cita describe UN día; el paquete se cobra UNA vez.* Sumar N citas produciría un total que nadie cobró y que no coincide con lo que la familia vio.

⚠️ **Y se dice lo que es: ampliar `chk_intento_un_solo_sujeto` es tocar un vocabulario cerrado, o sea una DECISIÓN.** Ésta es **la firma ④ ejerciéndola** (*«las tres modalidades en v1»*) — **no se amplía «de paso»**, y por eso queda escrito acá con su razón antes de existir la migración.

✅ **Segundo costo — RESUELTO POR LA MESA (28-ago), y sin tocar el vocabulario.** `evento_cita_servicio.modalidad` es cerrado (`presencial|telemedicina|domicilio|emergencia_movil|local`) y la pregunta era qué valor lleva guardería. **Firma ⑩ del plan: la estadía nace `presencial`, en el local del prestador — y el transporte puerta a puerta es CONTENIDO del servicio, no una modalidad** (es lo que `LETRA_GUARDERIA` §2 ya decía: *«lo hace la guardería con su propia gente»*). 🔴 **No nace ningún valor nuevo.** *Si al construir el esquema exigiera otra cosa, A para y lo declara — no lo amplía de paso.*

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

### ✏️ CORREGIDO (28-ago): **EL GATE NACE CERRADO** — la mesa firmó el criterio (`D-956`)

*Una versión anterior de este contrato lo dejaba **abierto** «hasta que la mesa firme qué significa al día». **La mesa firmó el mismo día**, así que esa línea ya no rige y se corrige acá para que nadie construya contra ella.*

**Criterio v1, firmado:**
- **«al día» = carnet cargado** (foto, a un toque) **+ rabia vigente por especie**, con **la vigencia declarada por el DUEÑO al cargar**.
- **La verificación física del carnet es del PRESTADOR, en el acta de recogida** (`CRITERIO_LEGAL_GUARDERIA` §4). *La app no valida un papel: lo transporta y lo deja verificable en la puerta.*
- **La lista completa por especie es DATO configurable** (`cat_plan_vacunal`), pendiente de mesa + veterinario — **jamás cableada**.

🔴 **El rechazo masivo de hoy no es un bug del gate: es el catálogo vacío.** Medido el 28-ago: **58 mascotas activas perro/gato · 0 con rabia vigente · 0 con `antirrabica` registrada**. *Cada familia carga su carnet en su primera reserva — para eso está el camino a un toque.*

⚠️ **Hallazgo que el criterio absorbe:** hay **cero filas con `vacuna_codigo='antirrabica'`** pero **10 sin código con nombres comerciales** (`Canigen LR`, `Vanguard DA2L`…) donde la rabia probablemente viaja adentro. **Por eso la fuente es la declaración del dueño al cargar, no la fila histórica.**

> **Para C:** montá el semáforo completo **y sí escribí el camino bloqueado** — la compuerta del server rebota, y la pantalla tiene que decir **qué falta y cómo se resuelve a un toque**. 🔴 **El bloqueo no lo decide la pantalla: lo decide el server.** La pantalla lo refleja.

---

## ⑥bis · RECONCILIACIÓN CON LAS PIEZAS DE B — *(A, 28-ago; B construyó antes que este contrato)*

**B definió sus props sin contratos a la vista (los suyos son de `pista/s107-b`, ya en `main`). A los leyó y los reconcilia: NO HAY CHOQUE — y donde había riesgo, B ya lo había cerrado mejor.**

| pieza de B | prop que recibe | de qué wrapper sale | quién arma el texto |
|---|---|---|---|
| `CalendarioCupo` | `DiaDeCupo{ clave, numero, estado:'elegible'\|'sin_cupo', motivo? }` | `obtenerCupoGuarderia` → `CupoDia{fecha, capacidad, consumido, disponible, sobrevendido}` | **C**: `sin_cupo ⟺ disponible === 0`; `motivo` es voz de la casa |
| `SemaforoSanitario` | `RequisitoSanitario` (unión: `al_dia` \| `falta` **con `onResolver` + `etiquetaResolver` obligatorios**) | `evaluar_requisitos_guarderia` → `{ estado, faltantes:[{codigo, estado, vence?}] }` | **C**: `codigo → clave`, la `etiqueta` y el `detalle` son **voz**, y la voz es de cada casa (método §6) |
| `FichaFranja` | `recogida` / `devolucion?` : `{rotulo, desde, hasta}` | `obtenerFranjasGuarderia` (las dos ventanas ya resueltas) | **C** el rótulo; las horas vienen crudas |
| `SelectorRoster` | el roster del día | `obtenerEstadiasDelDia` | — |

### Las tres cosas que hay que decir, porque son las que se pierden

1. 🟢 **`SemaforoSanitario` hace INEXPRESABLE el faltante sin camino** — su `falta` **no compila** sin `onResolver`. *Este contrato lo pedía en prosa («cada faltante viaja con su camino»); B lo volvió mecanismo.* **Gana el mecanismo, y este contrato lo adopta:** el wrapper devuelve el faltante **con su código**, y **C está obligada por el tipo** a cablearle el camino. *Una promesa de diseño que el código no expresa es peor que no haberla escrito.*
2. 🟢 **`CalendarioCupo` no tiene prop de cupo restante, y no la va a tener.** Coincide con este contrato: `disponible` viaja **para que la pieza decida**, jamás para pintarse como «quedan 2» (`MODELO_LOYALTY` §7.5). **La pieza no puede mostrarlo porque no puede recibirlo.**
3. ⚠️ **Ninguna pieza de B trae texto adentro — todo rótulo entra por prop**, y eso es lo que hace que **ninguna pueda afirmar un reparto de responsabilidad que la letra frenada no sostiene.** *Es la mitad del §0 del plan hecha estructura.* **A lo ratifica: el server manda códigos y fechas; la voz es de la casa que la muestra.**

---

## ⑦ LO QUE ESTE CONTRATO **NO** CUBRE (y a quién le toca)

- **Documentos, aceptaciones y actas** — contrato aparte, A lo publica enseguida.
- **El esquema de media del durante** — contrato aparte (A → D, B).
- **Cualquier texto legal** — de la mesa. Acá se construye el estante, jamás el libro.
- **El protocolo de mora** — **no se construye** (§0 del plan).
