# S107-A · EL CENSO DE GUARDERÍA — las cinco mediciones y la hipótesis

> **Contra qué se midió:** base linkeada `zyltipqscdsdsxnjclhp` vía
> `supabase db query --linked` · `information_schema` · `pg_proc` /
> `pg_constraint` / `pg_trigger` de esa misma base · el árbol en `67ea7a5a`
> (main). **Reloj del servidor al medir: 2026-08-28 15:13 UTC = 10:13
> Guayaquil.** **Cero escrituras: sólo SELECT.** Nada de acá viene de un
> reporte previo (L-166).
>
> **Qué es:** el resultado de §4-censo del `PLAN_S107_GUARDERIA`. **Hallazgos,
> jamás veredictos** (método §5) — lo que dice «decisión» lleva su razón y su
> medición, y la mesa la puede dar vuelta.
>
> **Se publica antes de estar para main a propósito** (regla S106): C consume
> ② y ⑦, D consume ⑥, B consume ② y ③.

---

## ⓪ EL HALLAZGO QUE REORDENA TODO LO DEMÁS: EL OFICIO YA ESTÁ DECLARADO VIVO, Y NADIE LO CONSTRUYÓ

**`tipos_servicio` tiene CINCO filas de hospedaje, las cinco `activo=true` y
`reservable=true`:**

| código | nombre | categoría | especies_elegibles | concurrencia | cupo_techo | dur. default |
|---|---|---|---|---|---|---|
| `guarderia_dia` | Guardería por Día | `hospedaje` | **NULL** | exclusiva | NULL | NULL |
| `guarderia_mensual` | Guardería Mensual | `hospedaje` | **NULL** | exclusiva | NULL | NULL |
| `hotel` | Hotel Canino/Felino | `hospedaje` | **NULL** | exclusiva | NULL | NULL |
| `hotel_dia` | Hotel Día | `hospedaje` | **NULL** | exclusiva | NULL | 480 |
| `hotel_noche` | Hotel Noche | `hospedaje` | **NULL** | exclusiva | NULL | 720 |

**Y `especies_elegibles = NULL` no es «sin decidir»: es «todas», medido en el
cuerpo del guard.** `_mascota_elegible_servicio` lee
`(ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie)` ⇒ **NULL
es FAIL-OPEN.** *Hoy, por catálogo, un pez es elegible para guardería* — y la
letra dice **solo perros y gatos**.

**El daño de hoy es CERO y está medido: `prestador_servicios` con esos tipos =
0 · `evento_cita_servicio` con esos tipos = 0.** Nadie los ofrece y nadie los
compró. **Pero el catálogo ya promete un servicio que la letra manda afuera**
(`hotel`, `hotel_noche` — *«la noche NO es guardería: es hotel, y es otro
servicio con su propia letra»*, `LETRA_GUARDERIA` §5).

> ⇒ **La guardería no arranca de cero: arranca sobre cinco tipos declarados
> vivos que nadie construyó.** *Es el patrón del cementerio de `pedidos` de
> S94, encontrado antes y no después.*

**Y su hermana, `estadias`:** la tabla existe con `fecha_entrada` ·
`fecha_salida` · **`cantidad_noches`** · **`precio_por_noche`** ·
`tipo_servicio DEFAULT 'hotel'`. **Medido: 0 filas · RLS ON con 8 policies ·
1 función la nombra (`validar_origen_evento`) · CERO consumidores en el
monorepo** (grep en `apps/` y `packages/`, excluyendo `database.types.ts`).

> **Su semántica es de NOCHES, que es exactamente lo que la letra prohíbe.**
> *Reusarla arrastraría la pernoctación adentro de una custodia diurna sin que
> nadie lo decidiera* — el modo de falla que §5 de la letra nombra con todas
> las letras.

---

## ① MEDICIÓN 2 · CUPO POR RANGO — hay ancestro, y NO está en la agenda

**Lo que cuenta por SLOT (el motor del paseo):** `prestador_horarios.max_citas_por_slot`
(default 1) + `tipos_servicio.cupo_techo`, leídos por **once** funciones
(`_agenda_ocupacion` · `obtener_slots_disponibles` · `crear_bloqueo_agenda` ·
`obtener_inicios_paseo_disponibles` · `reservar_salida_paquete` · …).

**Lo que cuenta por DÍA — y es el ancestro exacto: `cupo_reparto_del_dia`** (la
despensa, `recursos_reparto.capacidad_por_dia`). Su forma, leída del cuerpo:

- capacidad = **suma** de los recursos activos cuyo **patrón semanal**
  (`dias_operacion`) incluye ese día, con **excepciones por fecha que ganan**
  en las dos direcciones;
- consumido = **filas contra una columna `date`**, excluyendo los cancelados
  (*«un cancelado devuelve su lugar»*);
- disponible = **`GREATEST(capacidad - consumido, 0)`**.

> 🔴 **Ese `GREATEST` es, literalmente, la regla de sobreventa que el plan
> pide en §4.2:** si la capacidad baja por debajo de lo ya prometido, el día
> **declara 0 disponible y no cancela a nadie**. *La casa ya resolvió este
> problema una vez; no se re-inventa.*

**Respuesta a la medición:** el cupo por día **no es motor nuevo de cero** —
es el molde del reparto trasplantado del recurso al lugar. Lo que sí es nuevo
es **el sujeto** (espacios de una guardería, no repartidores) y **la unidad
que consume** (una estadía-día, no un pedido).

---

## ② MEDICIÓN 3 · REQUISITOS SANITARIOS — el motor está entero, y el gate duro HOY rechaza a todas

**Existe, completo y gateado: `obtener_plan_vacunal(p_mascota_id)`** —
`SECURITY DEFINER`, con `auth_required` y **la puerta del expediente
compartida** (`user_tiene_acceso_a_mascota`, jamás una regla nueva). Devuelve
por vacuna: `obligatoria · periodicidad_meses · ultima_aplicada · proxima ·
proxima_es_derivada · estado`.

**Su vocabulario de estado:** `aun_no_corresponde | nunca_aplicada | sin_fecha
| al_dia | vencida`. **La capturada gana a la derivada**, y
`_proxima_vacuna_derivada` deriva `ultima + periodicidad`.

> ⚠️ **Una alarma que la medición desactivó:** de 32 `evento_vacuna_aplicada`,
> **sólo 1 tiene `fecha_proxima`**. *Eso NO bloquea*, porque la próxima se
> **deriva** de la periodicidad del catálogo. **Medir el dato crudo habría
> dado un diagnóstico falso; hubo que leer el cuerpo.**

**El catálogo (`cat_plan_vacunal`, activo):** perro → `antirrabica`(oblig.) ·
`leptospirosis`(oblig.) · `multiple`(oblig.) · `giardia` · `tos_perreras`;
gato → `antirrabica`(oblig.) · `leucemia_felina`(oblig.) ·
`triple_felina`(oblig.) · `giardia`. Todas periodicidad 12 meses.

### 🔴 EL NÚMERO, replicando la lógica del motor sobre las mascotas vivas

| | |
|---|---|
| mascotas perro/gato | **58** |
| **pasarían el gate duro** (todas sus obligatorias `al_dia`) | **0** |
| **rechazadas** | **58** |
| filas `nunca_aplicada` obligatorias | **166** |
| filas `vencida` obligatorias | 8 (4 mascotas) |

> **La firma ③ no se toca — es correcta.** Lo que este número agrega es **su
> consecuencia**: con la base de hoy, **la guardería nace inalcanzable para
> todas las mascotas** hasta que alguien cargue carnets. *Es el patrón de
> D-768 (S95): un filtro correcto sobre datos que no existen vacía la vitrina.*
>
> **Y por eso la pieza 3 de B (el semáforo con su camino a un toque) no es
> decoración: es lo que decide si el oficio se puede usar.** El camino ya
> existe entero — `registrar_vacunas_de_carnet` + la lectura del carnet por
> foto (S46–S48).

---

## ③ MEDICIÓN 4 · FRANJAS — la estructura las admite; la semántica no existe

`prestador_horarios`: `prestador_id · servicio_id · empleado_id · dia_semana ·
hora_inicio · hora_fin · duracion_slot_minutos (def 30) · max_citas_por_slot ·
activo`.

- **UNIQUE `(prestador_id, servicio_id, empleado_id, dia_semana, hora_inicio)
  NULLS NOT DISTINCT`** ⇒ **dos ventanas el mismo día son legales por
  estructura**, y hay **13 casos vivos** (mismo día, 2+ franjas) sobre 68 filas
  y 4 prestadores.
- **Lo que NO existe:** decir **cuál ventana es de recogida y cuál de
  devolución**. El modelo **rebana la ventana en slots** y cuenta por slot —
  que es lo contrario de una franja de llegada.

⇒ La franja de guardería **no es un turno**: es una ventana con rol. Se
construye al lado, no se fuerza dentro de `duracion_slot_minutos`.

---

## ④ MEDICIÓN 5 · PAQUETE Y MENSUALIDAD — dos ancestros vivos y UN hueco de cobro

**El paquete ya existe: `bonos`** — `unidades_total · unidades_usadas ·
duracion_minutos · precio_total · precio_por_unidad · fecha_vencimiento ·
familia_id · prestador_servicio_id`. **3 filas, todas `estado_pago='pagado'`**
(la era del pago simulado). Lo crea `comprar_paquete_salidas(p_prestador_id,
p_servicio_id, p_unidades)`.

**La mensualidad ya existe: `suscripciones_servicio`** — **`dias_semana
(ARRAY)`** · `periodo_inicio` · `periodo_fin` · `precio_mensual` ·
`precio_unitario_efectivo` · `auto_renovar` · `unidades_consumidas` ·
`hora` · `duracion_minutos` · `frecuencia`. **1 fila viva, `auto_renovar=true`.**

> *El «patrón de días + precio del mes» que el plan §4.5 describe para la
> mensualidad **ya es una columna**.*

### 🔴 EL HUECO, medido y concreto: EL PAQUETE NO TIENE CAMINO DE COBRO REAL

- `pagos_intentos` lleva **`chk_intento_un_solo_sujeto`**: exactamente uno de
  **`pedido_id | cita_id | recurrencia_id | suscripcion_servicio_id`**.
  **`bono_id` no está.**
- **`comprar_paquete_salidas` no nombra `pagos_intentos`** (medido sobre
  `prosrc`).
- El desglose congelado es **por sujeto**, y hay cuatro tablas:
  `cita_desglose` · `compra_desglose` · `recurrencia_desglose` ·
  `suscripcion_desglose`. **No existe `bono_desglose`.**

⇒ **Día suelto y mensualidad tienen sujeto de pago; el paquete no.** Eso es
exactamente lo que la firma ④ convierte de papel en construcción.

*(Nota de forma, medida de paso: `compra_desglose` es el único de los cuatro
**sin columna `moneda`**. No es de esta sesión — se anota para que nadie lo
lea como olvido de guardería.)*

---

## ⑤ LA HIPÓTESIS DEL PLAN — **SE SOSTIENE**, y la octava puerta está VERIFICADA contra el objeto

**«La reserva de guardería puede ser una `cita` cuyo día es la unidad y cuya
disponibilidad no la responde la agenda sino el cupo del lugar.»**

Lo medido en `evento_cita_servicio`:

| pregunta del plan | medición |
|---|---|
| ¿exige hora exacta / turno? | **NO — `fecha` y `hora` son NULLABLE** (S70 las abrió para `por_coordinar`) |
| ¿existe hold? | **SÍ** — `estado_reserva` (`pendiente_pago|pagada|expirada|cancelada`) + `expira_en` |
| ¿sabe colgar N días de una compra? | **SÍ, por dos vías ya vivas** — `bono_id` y `suscripcion_servicio_id` son columnas de la cita |
| ¿el motor de pagos la cobra? | **SÍ, sin tocar el CHECK** — `cita_id` ya es sujeto legítimo |

### 🔴 LA OCTAVA PUERTA: verificada leyendo el trigger, no asumida

```
CREATE TRIGGER trg_cita_congela_desglose
  AFTER INSERT ON public.evento_cita_servicio
  FOR EACH ROW EXECUTE FUNCTION _trg_cita_congela_desglose()
```

Su cuerpo sale por `RETURN NEW` salvo que **`estado_reserva = 'pendiente_pago'`
y `precio IS NOT NULL`**; entonces resuelve la **moneda de la cuenta comercial
del prestador**, resuelve el `fee_config` y congela
`cita_desglose (subtotal, impuesto=0, total, moneda, fee_config_id)` con
`ON CONFLICT DO NOTHING`. **Sin moneda no congela — y la compuerta 2 del motor
rebota fail-closed.**

> ⇒ **Toda puerta nueva que INSERTe una cita con `pendiente_pago` + `precio`
> hereda el congelado sin tocar el trigger.** *La octava puerta que la letra
> anticipó es la nuestra, y el mecanismo ya está de nuestro lado.*

### Los CUATRO costos de la hipótesis, declarados y no escondidos

1. **`duracion_minutos` es NOT NULL con `CHECK > 0`.** Una estadía-día tiene
   que declarar una duración honesta (la jornada: de la franja de recogida a
   la de devolución). **No es bloqueante; es un dato que hay que llenar con
   sentido, jamás con un relleno.**
2. **`modalidad` es vocabulario CERRADO** (`presencial|telemedicina|domicilio|
   emergencia_movil|local`). Guardería con recogida a domicilio no tiene su
   valor. **Un vocabulario cerrado no se amplía de paso: es decisión.**
3. **El desglose es por CITA, o sea por DÍA.** Paquete y mensualidad se cobran
   como **una** compra ⇒ su desglose no puede ser la suma de N desgloses de
   cita. La mensualidad ya tiene `suscripcion_desglose`; **el paquete no tiene
   ninguno** (hueco ④).
4. **`evento_atencion.familia` es CHECK cerrado** (`grooming|paseo|
   adiestramiento`) — ver ⑥.

---

## ⑥ EL DURANTE Y LA MEDIA — lo que hay, y por qué la media multi-animal ES construcción nueva

- **`evento_atencion`** es el chasis del durante: `cita_id · familia · mascota_id
  · prestador_id · empleado_id · estado · iniciada_en · terminada_en ·
  cerrada_en · mensaje_familia`. **39 filas vivas** (paseo, grooming,
  adiestramiento).
  - `CHECK familia = grooming|paseo|adiestramiento` — **cerrado**.
  - `CHECK estado = en_curso|terminada|cerrada_con_calidad` — **cerrado, y más
    grueso que los cinco estados de la estadía-día del plan.**
- **La media de hoy se ata a UNA mascota, medido en las dos tablas:**
  `evento_archivo_adjunto (mascota_id, bucket, storage_path, categoria,
  origen_captura, …)` — 4 filas, categoría `foto_atencion` — y
  `evento_adiestramiento_clips (mascota_id, storage_path, duracion_segundos,
  orden)`.

> 🔴 **⇒ Para D, medido y sin rodeos: hoy NO existe media multi-animal en
> ninguna forma.** *«Una media = un archivo + N etiquetas» es construcción
> nueva* — y el clip tiene su ancestro de forma (`duracion_segundos`,
> `storage_path`, `orden`) pero **no de reparto**.

---

## ⑦ P19 · SOCIABILIDAD — el dato existe, y el guard NO alcanza a guardería

- **`mascotas.paseo_social_ok (boolean)`** es la respuesta ya almacenada.
  **Distribución en perro/gato: `true`=5 · `false`=0 · `NULL`=53.**
- **`_mascota_apta_paseo_grupal` = `COALESCE(paseo_social_ok, true)`** ⇒
  **NULL es APTO (fail-open).** *No-preguntado se trata como sí* — es la letra
  firmada de P19, se registra para que nadie lo lea como defecto de guardería.
- 🔴 **El guard de `crear_bloqueo_agenda` gatea por `ts.categoria = 'paseo'`.**
  Guardería es categoría `hospedaje` ⇒ **hoy no lo dispara.** *Reusar P19
  (firma ⑥) exige ensanchar el guard: no aparece solo por reusar la columna.*
- **Y el nombre queda estrecho:** la pregunta es *«¿se lleva bien con otros?»*,
  no *«¿pasea bien?»*. **Se reusa la columna igual** — clonar duplicaría una
  verdad, que es justo lo que el método §6 prohíbe.

---

## ⑧ LO QUE YA EXISTE Y SIRVE TAL CUAL (para que nadie lo construya de nuevo)

- **`hoy_local()` = `(now() AT TIME ZONE 'America/Guayaquil')::date`** — el
  «día = fecha local» que el plan §4.2 exige **ya está construido y en uso**.
- **`prestador_servicios`** ya lleva `precio_plan · precio_paquete ·
  precio_mensual_plan · config (jsonb) · atiende_local · atiende_domicilio ·
  especies_compatibles · reservable`.
- El hold, las compuertas, el actuador y el comprobante del motor de pagos:
  **enteros, y con `cita_id` como sujeto legítimo.**

---

## ⑨ LOS HUECOS DECLARADOS — no se inventa ninguno

1. **Vencimiento del saldo de paquete.** El plan lo declaró hueco; **la
   medición encuentra ancestro**: `bonos.fecha_vencimiento` existe. *Tener
   ancestro no es tener letra* — la decisión sigue siendo de la mesa.
2. **Mensualidad iniciada sin devolución automática:** falta su línea de letra
   (el plan §1.9 lo dice; se repite acá para que no se pierda).
3. **Dos vocabularios cerrados que guardería necesita tocar** —
   `evento_cita_servicio.modalidad` y `evento_atencion.familia`. **Se amplían
   con su migración y su razón, jamás «de paso».**
4. **Los cinco tipos de hospedaje vivos** (⓪): qué se hace con `hotel`,
   `hotel_dia`, `hotel_noche` —hoy `activo` y `reservable`, sin oferta ni
   cita— **es decisión de mesa, no de esta pista.** *La única lectura que la
   medición sí sostiene: `especies_elegibles = NULL` es fail-open y contradice
   la letra («solo perros y gatos»); eso es una columna que se llena.*
5. 🔴 **`BRIEF S107` NO ESTÁ EN EL REPO.** Los cuatro prompts del plan lo citan
   como primera lectura; medido por grep en `docs/`: **cero ocurrencias.**
   *Es §6quater del método: ninguna orden de construcción cita letra que no
   esté en origin.* **No bloquea** —el plan restata las cinco mediciones y el
   perímetro— **pero B, C y D van a buscarlo y no está.** Se declara para que
   la mesa lo deposite o corrija la cita.
