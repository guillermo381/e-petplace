# S106-A · MEDICIONES DEL PRIMER TURNO — telemedicina, el quinto oficio

> **Pista A** · 25-ago-2026 · **SIN CÓDIGO. Cero migraciones escritas.**
> **Objeto de toda medición de DB:** proyecto linkeado `zyltipqscdsdsxnjclhp`,
> vía `supabase --experimental db query --linked --file` (ref verificado ANTES
> de la primera consulta, L-123). Las mediciones de repo declaran su comando.
> **Regla que gobierna el reporte:** lo que no se midió se dice «no medido».

---

## §0 · LÍNEA BASE OPERATIVA

| Qué | Valor | Objeto |
|---|---|---|
| worktree | `../e-petplace-s106-a`, rama `pista/s106-a` | `git worktree list` |
| árbol al abrir | **limpio** | `git status --porcelain` → vacío |
| `main` al abrir | `09def031` == `origin/main` | `git rev-parse` |
| **`node_modules` del worktree** | **NO EXISTE** — sin `pnpm install`. **No estoy enganchada al primario: no tengo paquetes.** El primario resuelve `@epetplace/ui` → `/…/e-petplace/packages/ui` | `pwd -P` sobre ambos |
| migraciones | **442 local = 442 remoto · cero desemparejadas** | `ls supabase/migrations/*.sql` + `migration list --linked` parseado por JSON |
| siguiente `D-` libre | **D-926** (más alta real `D-925`) | grep contra `DEUDAS_CANONICAS.md` |
| siguiente `L-` libre | **L-426** (más alta real `L-425`; `L-714` está declarado como typo de `D-714`, no es lección) | ídem |
| siguiente `R-` libre | **R67** (más alta `R66`) | grep sobre `scripts/verify-diseno.mjs` |

*Nota de método:* mi worktree no tiene `node_modules` y **no lo instalé** — este
turno no corre Metro ni typechecks de app. Se declara para que nadie asuma que el
enganche está probado: **no está medido porque no existe**.

---

## §1 · A-M1 — QUÉ EXISTE YA DE TELEMEDICINA EN LA DB

**Objeto:** `information_schema`, `pg_proc`, `pg_constraint`, `pg_policy` y las
tablas mismas.

### 1.1 · La fila de `tipos_servicio` EXISTE, con todas sus columnas

```
codigo                     telemedicina
nombre                     Teleconsulta
categoria                  telemedicina        ← PROPIA, no 'veterinario'
es_medico                  true
activo                     true
reservable                 FALSE               ← la llave, apagada
reserva_solo_hoy           false
concurrencia               exclusiva     cupo_techo  null
duracion_default_minutos   20
requiere_historia_clinica  true
requiere_resultado         false
requiere_validacion_admin  TRUE
admite_atencion_local      TRUE                ← ver 🔴 C-6
especies_elegibles         las 11 (incluye equino y pez)
country_codes              ["EC"]
```

`tipos_servicio` tiene **21 columnas**; `reservable` es `NOT NULL DEFAULT true`
— o sea que **una fila nueva nace reservable**; la de telemedicina está en
`false` porque alguien la apagó explícitamente.

### 1.2 · Ya hay UNA OFERTA ACTIVA publicada — y esto no estaba declarado

| campo | valor |
|---|---|
| negocio | **Clínica Aurora** (`de680000-…-e5`), estado `activo` |
| precio | **$30,00** · duración 20 min |
| `activo` | **true** |
| `prestador_servicios.reservable` | **TRUE** |
| `atiende_local` / `atiende_domicilio` | true / false |
| creada | **18-jul-2026** |
| `prestadores.acepta_telemedicina` | **false** |

⇒ **La oferta está lista y el prestador dice que no acepta telemedicina.** Hoy no
hace daño porque `tipos_servicio.reservable=false` corta antes; pero es el
patrón que `PLAN_MESA_106` §0 nombra: *un interruptor que no está conectado a
nada no falla, se siente encendido.*

### 1.3 · 🔴 `cita_telemedicina_detalle` — una TABLA ENTERA que nadie declaró

*(Se cruza con A-M6; el censo completo está en §6.)* Existe en la base, **cero
filas, cero funciones la nombran, cero FKs entrantes**, y **ninguna migración
del monorepo la crea**. Trae `room_url`, `room_name`, `token_prestador`,
`token_cliente`, `grabacion_url`, `grabacion_consentida`, y `proveedor` con
**CHECK cerrado a `daily | whereby | zoom`, default `'daily'`**.

### 1.4 · Ocho funciones ya nombran telemedicina

`_trg_temperamento_crear_evento` · `_vet_ofertas_cobrables` ·
`crear_prestador_inicial` · `eje_de_tipo_servicio` ·
`obtener_inicios_vet_disponibles` · `obtener_veterinarios_disponibles` ·
`simular_cliente_agenda_cita` · `wizard_crear_cuenta_y_rol`.

**Lo importante es CÓMO la nombran** (líneas literales):

- `_vet_ofertas_cobrables:21`, `obtener_inicios_vet_disponibles:15`,
  `obtener_veterinarios_disponibles:15` → `AND ts.categoria IN ('veterinario',
  'telemedicina', 'emergencia')`
- `_vet_ofertas_cobrables:3` → *«telemedicina y emergencia existen en el mundo
  pero nacen…»*
- `obtener_inicios_vet_disponibles:20` → *«S68: el tipo existe pero no se
  reserva (telemedicina/emergencia) — rebote tipado, no disfraz de
  inexistente.»*

⇒ **La categoría propia NO rompe la herencia: los tres lectores del mundo vet ya
la incluyen a propósito desde S68.**

---

## §2 · A-M2 — LA HERENCIA DEL MOTOR DE CITAS

**Objeto:** `pg_get_functiondef` de las funciones reales del camino.

### ① Lo que es AGNÓSTICO del tipo (hereda solo, sin tocar nada)

- **El hold**: `crear_bloqueo_agenda` — 15 min (`v_expira := now() + interval
  '15 minutes'`), advisory lock, y sus compuertas genéricas: `auth_required` ·
  `slot_invalido` · `no_access_to_mascota` · `prestador_inactivo` ·
  `servicio_no_disponible` · `slot_en_pasado` · `prestador_no_disponible` ·
  `fuera_de_horario` · `persona_no_disponible` · `slot_ocupado`.
- **El desglose congelado**: tabla `cita_desglose` (`cita_id, subtotal,
  impuesto, total, moneda, fee_config_id, congelado_en`), **13 filas vivas**, y
  lo congela un **TRIGGER** (`trg_cita_congela_desglose` sobre
  `evento_cita_servicio`) — o sea que **cubre cualquier puerta que inserte una
  cita, incluida una nueva** (`LETRA_PAGO_CITAS` §9, verificado vivo).
- **El cobro al reservar**: `pagos_intentos` ya tiene puntero `cita_id`
  (junto a `pedido_id`, `compra_id`, `recurrencia_id`, `suscripcion_servicio_id`).
- **La grilla y la ocupación**: `_inicios_disponibles_prestador`,
  `_agenda_ocupacion` — por persona y por ventana, sin mirar el tipo.
- **El gate `reservable` en DOS niveles**, escrito y comentado desde S68 (ver §5).

### ② Lo que DISTINGUE por tipo y necesita decisión

**🔴 El hallazgo grave de esta medición: `crear_bloqueo_agenda` no puede crear
una teleconsulta hoy, y su modo de falla es peor que un error.**

Líneas 100-108 del cuerpo:

```
v_modalidad := COALESCE(p_modalidad, 'local');
IF v_modalidad NOT IN ('local', 'domicilio') THEN
    RAISE EXCEPTION 'modalidad_invalida'
IF v_modalidad = 'local' AND NOT v_servicio.atiende_local THEN
    RAISE EXCEPTION 'modalidad_no_disponible'
```

La única puerta que crea citas **acepta solo `'local'` y `'domicilio'`**, aunque
la tabla admita más (ver abajo). Y **el default es `'local'`** ⇒ una teleconsulta
reservada sin tocar nada **no falla: nace con `modalidad='local'`**, es decir con
la marca de §7 **diciendo que fue presencial en el local**. *No hay error, no hay
log, hay un dato equivocado con cara de normal.*

Lo demás que distingue: la **duración** (20 min, ya en la fila) · las **especies**
· `reserva_solo_hoy` (false, correcto) · `requiere_validacion_admin` (**true** —
telemedicina ya entra por el camino de verificación §14.2 de S68).

### ③ 🔴 DÓNDE VIVE LA VENTANA DE CANCELACIÓN — **en ningún catálogo: es constante literal, cinco veces**

Barrido de TODO `pg_proc` por `interval '<n> <unidad>'`:

| función | línea | ventana | política |
|---|---|---|---|
| `cancelar_cita_suelta` | 28 | **24 h** | P18 |
| `cancelar_reserva_paquete` | 23 | 2 h | P16 |
| `reagendar_cita_suelta` | 44 | 2 h | P18 |
| `reagendar_sesion_programa` | 34 | 24 h | — |
| `saltar_cita_plan` | 32 | 24 h | P14 |

**No hay parámetro en `tipos_servicio`, no hay tabla, no hay catálogo.** La
ventana es un literal en el cuerpo de cada función. ⇒ Los 30 min de la letra §4
**no se configuran: se escriben**, y la forma que el plan §5 propone
(«parámetro por `tipos_servicio`») **es construcción nueva, no un valor que se
cambia**.

Y dos cosas más que salieron del mismo cuerpo:

- **`cancelar_cita_suelta` NO filtra por tipo de servicio.** Rechaza plan y
  paquete, exige `confirmada` + `pagada`, y nada más. **Una cita clínica
  confirmada y pagada entra por ahí hoy** — lo que choca con
  `LETRA_PAGO_CITAS` §5 firma ② (ver 🔴 C-3).
- **El reembolso es SIMULADO**: la función solo escribe
  `metadata.reembolso_simulado = {monto, simulado: true, …}`. **No mueve plata.**

### ④ 🔴 DÓNDE VIVE EL CATÁLOGO CERRADO DE FUENTES DE SALDO — **NO VIVE: EL MOTOR DE SALDO NO EXISTE**

Barrido amplio contra el objeto:

| pregunta | resultado |
|---|---|
| tablas `%saldo%`, `%wallet%`, `%monedero%`, `%credito%`, `%haber%`, `%balance%` | **(ninguna)** |
| funciones `%saldo%` o que lean `saldo_cliente` | **(ninguna)** |
| columnas `%saldo%` | solo `cuentas_comerciales.saldo_arrastre`, `liquidaciones.saldo_arrastre_aplicado`, `v_eventos_resumen_cuenta.saldo_arrastre` — **eso es el arrastre de LIQUIDACIÓN DEL PRESTADOR (T&C §22), otra cosa** |

⇒ **No hay enum, no hay CHECK, no hay tabla: la «lista cerrada» de `LETRA_SALDO`
§3 vive SOLO EN PROSA.** La enmienda que el freno de depósito dejó servida **no
tiene objeto que enmendar en el motor** — es enmienda de letra, y su
construcción es trabajo nuevo completo. Coherente con `LETRA_SALDO` §8 ítem 5
(*«el esquema exacto de tablas… censo de S102»*) y con `LETRA_PAGO_CITAS` §7
(*«pago mixto y motor de saldo (S102)»*). **Medido: S102 no lo construyó.**

### ⑤ Lo que NO hereda — nombrado, no redondeado

1. **La modalidad `'telemedicina'` en el hold** (②, arriba).
2. **La ventana de 30 min** — no existe el mecanismo, ni siquiera para 24 h.
3. **El destino de la plata** — no existe motor de saldo (④).
4. **El estado «no realizable»** — `evento_cita_servicio.estado` tiene CHECK
   cerrado: `pendiente | confirmada | en_curso | completada | cancelada |
   no_show | rechazada`. **No está y no se agrega de paso** (regla de la casa:
   *un vocabulario cerrado no se amplía de paso; es decisión de letra*).
5. **El consentimiento por cita** (A-M3).
6. **El guard de sustancias fiscalizadas** (A-M4).
7. **Todo el transporte de video** (§9 de la letra).

---

## §3 · A-M3 — EL CONSENTIMIENTO

**Objeto:** tabla `consentimientos`, sus policies, sus datos y
`pg_get_functiondef` de su escritor.

**La tabla existe:** `id · user_id (FK auth.users) · tipo · aceptado · ip_hash ·
created_at · version (default 'v1.0') · metadata jsonb`.
**Constraints: solo PK y FK.** `tipo` **no tiene CHECK** — vocabulario abierto.

**Datos vivos:** `registro` v1.0 (59, abr-may) · `registro` `legales-2026-08` (1,
23-ago) · `terminos_parent` 1.0 (3, 24-ago) · `privacidad` 1.1 (3, 24-ago).

**RLS:** `INSERT` con `WITH CHECK (auth.uid() = user_id)` · `SELECT` propio.
⇒ **el cliente escribe DIRECTO por RLS**, no por RPC.

**El escritor de S104, `registrar_consentimiento_de_alta`, NO sirve de molde
para una cita** — leído entero: es del alta *sin sesión* (exige email
coincidente, cuenta sin confirmar, ventana de 15 min) y **rechaza a cualquier
usuario que ya tenga un consentimiento** (`consentimiento_ya_registrado`,
`23505`). Es one-shot por usuario, por diseño.

**Veredicto:** la **tabla** sirve de base (quién · cuándo · versión · metadata);
**le falta el objeto** — no hay `cita_id`, ni unicidad por (usuario, cita), ni
`tipo` acotado.

⚠️ **Consecuencia directa sobre el plan §1.3** (*«atómico, no secuencial»*): hoy
el consentimiento lo escribe **el cliente por RLS**. Para que *«una teleconsulta
confirmada sin consentimiento sea inexpresable»*, el registro tiene que ocurrir
**dentro de la RPC de reserva, server-side**, y no como una llamada más de la
pantalla. **Es diseño, no cableado.**

---

## §4 · A-M4 — LA RECETA

**Objeto:** `information_schema`, los 42 catálogos `cat_*`, y los datos.

**Lo que existe:**

- `evento_medicacion_prescrita` — 23 columnas, incluidas `nombre_medicamento`,
  **`principio_activo`**, `concentracion`, `forma_farmaceutica`, `dosis`,
  `frecuencia`, `duracion_dias`, `via_administracion`, `cantidad`,
  `caso_clinico_id`. **CHECKs: ninguno.**
- `prestador_recetas_frecuentes` — la lista personal del vet, misma forma.
- `mascota_perfil_vigente.medicacion_actual` (jsonb) ·
  `producto_ficha_dosificacion.principio_activo`.

**Lo que NO existe, medido:**

| pregunta | resultado |
|---|---|
| catálogo de medicamentos / principios / sustancias entre los 42 `cat_*` | **NINGUNO** |
| CHECKs en `evento_medicacion_prescrita` | **(ninguno)** |
| filas vivas | **4** |
| filas con `principio_activo` poblado | **0 de 4** |

### 🔴 Veredicto sin adorno

**Identificar una sustancia fiscalizada POR DISEÑO es hoy IMPOSIBLE.** No hay
vocabulario, no hay catálogo, y el único campo que serviría —`principio_activo`—
**está vacío en el 100 % de las filas vivas**. Un guard construido sobre él
**daría verde siempre**: sería exactamente *«un requisito que suena serio y no
filtra nada»*, la frase con la que §6 de la propia letra rechaza la resolución
mínima de cámara.

Esto **confirma medido el Riesgo 3 del plan**. Lo que la mesa tiene que decidir
en CP1 no es el guard: es **si v1 puede tener un vocabulario cerrado de
prescribibles**, porque sin él no hay dónde apoyar el bloqueo.

---

## §5 · A-M5 y A-M7 — LOS INTERRUPTORES

**Objeto:** `pg_policy`, `information_schema.role_table_grants`, `pg_proc`, grep
sobre el repo.

| # | Interruptor | Estado HOY | Escritores | Lectores | Veredicto |
|---|---|---|---|---|---|
| ① | **`tipos_servicio.reservable`** | **false** | **admin** — policy `ts_admin` `FOR ALL TO authenticated USING is_admin()` | **14 funciones** leen `ts.reservable`; **5** producen `servicio_no_reservable` (`crear_bloqueo_agenda`, `obtener_inicios_vet_disponibles`, `obtener_slots_disponibles`, `obtener_veterinarios_disponibles`, `reservar_salida_paquete`) | **RIGE. Es LA llave.** Un `UPDATE` de un admin: llave, no obra |
| ④ | **`prestador_servicios.reservable`** | **true** en la oferta de Aurora (32 true / 3 false en total) | el prestador, sobre su oferta | **14 funciones** leen `ps.reservable` | **RIGE, y es del prestador** |
| ② | `country_config.services_enabled->>'telemedicine'` | **false** en EC y en CO | no medido (ninguna función lo escribe) | SQL: `service_active_in`. App: `apps/cliente/src/app/(tabs)/explorar/index.tsx:107` + `packages/api/src/wrappers/paisConfig.ts` | 🟡 **suelto** — ver 🔴 C-7 |
| ③ | `prestadores.acepta_telemedicina` | **false en 11 de 11** (0 true, 0 null) | `crear_prestador_inicial`, `wizard_crear_cuenta_y_rol` — **lo SIEMBRAN al crear** | **CERO** en SQL. **CERO** en el repo: el único hit fuera de `database.types.ts` es… ninguno. Viaja además en `v_prestadores_publicos` | 🟡 **se escribe y nadie lo lee** |

### ✅ ① y ④ NO están en conflicto: son un AND deliberado de S68

Corregí una lectura propia acá y conviene que quede. Mi primer regex
(`s\.reservable`) **confundía `ts.reservable` con `ps.reservable`** y me iba a
hacer reportar «un cuarto interruptor suelto». Re-medido separando prefijos, el
motor lo dice en su propio cuerpo:

- `crear_bloqueo_agenda` → *«S68: la puerta del hold es del MOTOR — reservable
  en DOS niveles»* y
  `IF NOT v_servicio.reservable OR NOT COALESCE(v_ts_reservable, true) THEN`
- `reservar_salida_paquete` → misma línea, mismo comentario.
- `_inicios_disponibles_prestador` → *«S68: lo no reservable (tipo O oferta) no
  genera inicios.»*

⇒ **plataforma AND oferta**, escrito y comentado. Aurora ya tiene ④; falta ①.

### 🟡 Los que sí están sueltos son ② y ③

- **②** confirma el hallazgo de C: `explorar/index.tsx:107` es
  `if (!servicios.telemedicine) proximamente.push(…)` — **solo brazo de
  apagado**. Encender la bandera **no enciende nada**: solo saca la fila de
  «Próximamente».
- **③** confirma el de C y lo agrava con el escritor: **dos funciones lo
  siembran en cada alta de prestador** y **ningún lector lo consume**. Es el
  candidato natural a ser el flag de habilitación de §8 de la letra… o a
  jubilarse. **La mesa adjudica; yo no toco.**

---

## §6 · A-M6 — `cita_telemedicina_detalle` Y LA DERIVA DB↔MIGRACIONES

### 6.1 · El censo

| | |
|---|---|
| **filas** | **0** |
| **RLS** | habilitada |
| **policies** | 4, **todas `TO authenticated`**: `telemedicina_select` (`user_tiene_acceso_a_mascota(mascota_id) OR pet_parent_id = auth.uid()`) · `telemedicina_insert` (`user_puede_acceder_prestador`) · `telemedicina_update` (ídem `OR is_admin()`) · `telemedicina_delete_admin` (`is_admin()`) |
| **grants de tabla** | `anon` tiene SELECT/INSERT/UPDATE/DELETE/TRUNCATE… **pero ninguna policy lo alcanza** ⇒ RLS lo deniega. **Residuo, no agujero** (familia D-686) |
| **FKs salientes** | `cita_id → evento_cita_servicio` (RESTRICT, **UNIQUE**) · `mascota_id → mascotas` · `prestador_id → prestadores` · `pet_parent_id → **profiles**` |
| **FKs entrantes** | **NINGUNA** (censo ③ de C) |
| **funciones que la nombran** | **NINGUNA** |
| **columnas** | 20, incluidas `room_url`, `room_name`, **`token_prestador`**, **`token_cliente`**, **`grabacion_url`**, **`grabacion_consentida`** |
| **CHECKs** | `estado ∈ {programada, en_curso, completada, cancelada, **no_conectado**}` · **`proveedor ∈ {daily, whereby, zoom}`, `DEFAULT 'daily'`** |

### 6.2 · La deriva, dimensionada

- **Ninguna migración del monorepo la crea**: `grep -rl cita_telemedicina_detalle supabase/migrations/` → **0**.
- **Los dos ledgers la desconocen por igual**: 442 local = 442 remoto, todas
  emparejadas, y **ninguna la menciona**. *El ledger está perfecto y no explica
  el objeto* — L-422 en su forma general.
- **Sí vive en `packages/api/src/database.types.ts`** (generado de la base) y en
  `docs/BIO_EXPEDIENTE.md`.
- **Tamaño de la clase:** de **268 tablas base** en `public`, **57 (21 %) no las
  nombra ninguna migración**. *(Método: concatenar las 442 migraciones y buscar
  cada nombre de tabla con `grep -qi "\bnombre\b"`. Limitación declarada: es
  búsqueda textual — una tabla creada con nombre partido o generado se contaría
  mal; el número es una cota, no un censo fino.)* Entre ellas hay residuo de
  test vivo en producción: `_test_resultado_d242`, `test_data_registry`.

⇒ **Se nombra ahora, antes de que nazca ninguna migración de S106**, como pide
la adenda. **No propongo qué hacer con ella: es adjudicación de la mesa.**

---

## §7 · LOS CENSOS DE C, CORRIDOS (§7 de su relevamiento)

### C-① · ¿El botón «Ir a urgencias» tiene algo detrás?

*(Agregué `consulta_general` porque `consulta` no existe como código — el
catálogo lo llama `consulta_general`.)*

| código | ofertas activas | negocios |
|---|---|---|
| `consulta_general` | 5 | 5 |
| `telemedicina` | **1** | **1** |
| `urgencia_domicilio` | 1 | 1 |
| `urgencia_local` | 1 | 1 |

⇒ **Sí tiene algo detrás, pero es un solo negocio.** Y `urgencia_local` /
`urgencia_domicilio` son `reservable=true` con `reserva_solo_hoy=true`, mientras
`emergencia` es `reservable=false`. **El aviso §3 no mentiría, pero ofrecería
una sola clínica.**

### C-② · Los interruptores → §5 de este documento

⚠️ **Dos correcciones al SQL de C, medidas:**
1. `country_config.servicios_activos` **no existe**; la columna es
   **`services_enabled`**. Rebotó `42703`.
2. `prestadores.nombre_negocio` **no existe**; es **`nombre_comercial`**.

Resultados con los nombres reales:
`prestadores`: **11 filas, 0 con `acepta_telemedicina=true`**.
`country_config`: **EC** activo con `telemedicine: false` (y `walking`,
`grooming`, `training`, `veterinary`, `adoption`, `marketplace` en true) · **CO**
inactivo con todo en false.

### C-③ · ¿Es legado muerto?

**Filas: 0. FKs entrantes: NINGUNA.** Sumado a *cero funciones* y *ninguna
migración*: **sí, es legado muerto** — pero con dos columnas que no son inocuas
(ver 🔴 C-5 y 🔴 C-8).

---

## §8 · A-M8 — `PLAN_MESA_106` CONTRA `LETRA_TELEMEDICINA`

**Citado verbatim, sin enmendar nada.**

> **§4 · LO QUE ESTA MESA NO HACE**
>
> No construye telemedicina, adopción ni guardería — **las escribe** · no publica
> los Títulos IV y V de los T&C hasta que sus cuatro frenos caigan · no enciende el
> canal de WhatsApp sin token real y sin el productor del mapeo · no adivina la
> respuesta de DeUna sobre la devolución · no renumera sesiones.

> **§5.4** — Las tres letras nuevas arrancan **en paralelo y en la mesa**, no en las pistas:
>    son conversación con el founder y consulta al abogado, no construcción.

**Las fechas, medidas:**

| documento | fecha | qué dice de telemedicina |
|---|---|---|
| `PLAN_MESA_106` | escrito **al cierre de la mesa 105**; su §TERRITORIOS lleva **firma del founder 24-ago-2026** y dos enmiendas del **25-ago-2026** | «no construye… **las escribe**» |
| `LETRA_TELEMEDICINA` v1.0 | **nace 25-ago-2026** | la letra que §4 mandaba escribir |

**Lectura, y NO es adjudicación mía:** `PLAN_MESA_106` gobierna **su propia
mesa** — la que las pistas numeraron **S105** (su propio encabezado lo dice:
*«la mesa anterior se numeró 105 y las pistas se llamaron S104; no se renumera
nada»*). Esa mesa **cumplió su §4**: escribió la letra el 25-ago. **S106 es la
mesa siguiente**, y ahí sí se construye.

⚠️ **La trampa que sí conviene declarar:** hay ahora **dos archivos con «106» que
se refieren a sesiones distintas** — `PLAN_MESA_106` (numeración de mesa) y
`PLAN_S106_TELEMEDICINA` (numeración de pista). El primero dice literalmente *«no
construye telemedicina»* y va a quedar al lado del segundo, que la construye.
*Quien lea el nombre y no la fecha va a leer una contradicción que no existe.*
**Lo declaro; la adjudicación es firma del founder en el checkpoint.**

---

## §9 · 🔴 CHOQUES CONTRA FUENTE FIRMADA — **frené, no armonicé nada**

> Ninguno de estos lo resolví. Ninguno lo escribí en la letra ni en el plan.
> **Los ocho son adjudicación del founder en CP1.**

### 🔴 C-1 · El motor de saldo NO EXISTE, y de él dependen §4 y §5 de la letra

- **La letra §4:** *«la plata vuelve como saldo»*. **§5:** ídem para la consulta
  no realizable. **El plan §5-C** dice *«el saldo ya existe por `LETRA_SALDO`»*.
- **Medido:** cero tablas, cero funciones (§2 ④). `LETRA_SALDO` **fija el
  contrato**; su §8 ítem 5 remite el esquema a *«censo de S102»*, y
  `LETRA_PAGO_CITAS` §7 pone *«motor de saldo (S102)»* fuera de alcance.
  **S102 no lo construyó.**
- **Consecuencia:** las dos ramas donde la plata vuelve **no tienen a dónde
  volver**. O S106 construye el motor de saldo (trabajo grande, con esquema que
  `LETRA_SALDO` deja explícitamente sin fijar), o v1 declara otro camino.

### 🔴 C-2 · La ventana de cancelación tiene **TRES** valores firmados, no dos

El freno de depósito encontró dos (`LETRA_SALDO` ≥24 h vs letra 30 min).
**Hay un tercero, en documento legal publicado:**

| fuente | ventana | fecha |
|---|---|---|
| `LETRA_SALDO` §3 | cancelación de cita **≥24 h** | 19-ago-2026 |
| **T&C §25.1** (Usuario Profesional) | *«cancelar **con derecho a reembolso** … hasta **veinticuatro (24) horas** antes»* + §25.2 reagenda 2 h + §26.1 *«menos de dos (2) horas… se cierra como **no asistida**»* | **24-ago-2026** |
| `LETRA_TELEMEDICINA` §4 | **30 minutos** | 25-ago-2026 |

**Y el choque es concreto, no formal:** una teleconsulta cancelada **a 5 horas**
cae *fuera* de las 24 h del T&C (sin derecho a reembolso) y *dentro* de los 30
min de la letra (sin penalidad, plata de vuelta). **La banda 30 min – 24 h tiene
dos respuestas opuestas, las dos firmadas.**

*(Lo que sí coincide: T&C §26.2 — el profesional percibe la tarifa íntegra ante
inasistencia — es exactamente lo que la letra §4 pide. Ese no choca.)*

### 🔴 C-3 · La cancelación clínica automática choca con `LETRA_PAGO_CITAS` §5, firma ② del founder

Literal de esa letra: *«**Mientras P22 no tenga letra, la cancelación de la cita
clínica se resuelve por soporte, manual y declarada**»* — **firma ② del founder,
20-ago-2026**. Y **P22 sigue DECLARADA SIN LETRA** (verificado en POLITICAS
v1.11: *«Para veterinaria hoy no existe ninguna política de reagenda — ni para el
dueño, ni para recepción, ni para nadie»*).

**Una teleconsulta es una cita clínica** (`es_medico=true`). ⇒ o la letra §4
constituye la letra de P22 para este caso —y eso **se firma**—, o la cancelación
automática contradice una firma vigente.

*Nota favorable, y es la salida elegante:* **C-1 y C-3 apuntan al mismo lugar**.
La firma ② ya dice «por soporte, manual», que es exactamente lo único que se
puede honrar sin motor de saldo.

**Y un hallazgo lateral del mismo cuerpo:** `cancelar_cita_suelta` **no filtra
por tipo de servicio** — una cita clínica confirmada y pagada entra hoy por esa
puerta, contra la firma ②. No lo toqué.

### 🔴 C-4 · La receta ENTRA en el plan y la letra la deja FUERA de v1

`LETRA_TELEMEDICINA` **§9 · LO QUE NO ENTRA EN v1**: *«… **receta a distancia
(hasta que el abogado se pronuncie)** …»*. El plan §1.7 la mete en alcance,
declarando que el abogado ya se pronunció.

**La condición de la exclusión puede estar cumplida — pero el texto firmado sigue
diciendo que no entra.** Necesita **enmienda escrita a §9**, no interpretación.
Lo mismo §10, cuyas tres preguntas al abogado quedan contestadas de palabra y sin
depositar.

*(Coherente con lo que sí sostiene el ingreso: T&C §7.2 hace al profesional
**único responsable** de *«la normativa … de manejo y prescripción de
medicamentos de uso veterinario»*.)*

### 🔴 C-5 · El `CHECK` de `proveedor` **pre-decide el transporte** que CP1 va a elegir

`cita_telemedicina_detalle.proveedor` tiene **`CHECK ∈ {daily, whereby, zoom}`**
y **`DEFAULT 'daily'`**. La medición D-M1 evalúa LiveKit, Agora, 100ms, Stream,
Vonage, Jitsi… **Si la mesa elige cualquiera de esos, la tabla lo rechaza.**

Y la regla de la casa aplica al pie: *un vocabulario cerrado no se amplía de
paso; es decisión de letra.* **Hay una tabla muerta que ya votó.**

### 🔴 C-6 · `admite_atencion_local = true` en telemedicina

La fila de teleconsulta dice que **admite atención en el local**, y su oferta
viva tiene `atiende_local=true`. Combinado con el default `'local'` del hold
(§2 ②), es lo que haría nacer la marca mintiendo. *Una videollamada no ocurre en
el local del veterinario.* **Necesita decisión, no un `UPDATE` al vuelo.**

### 🔴 C-7 · Dos punteros mal en la letra y el plan (baratos, pero están en firmado)

1. **El aviso de IA NO es T&C §14.** §14 es **«Comisión: tasa y base de
   cálculo»**. El aviso de IA es **§31 · Funcionalidades asistidas por
   inteligencia artificial** (§31.3 es literalmente la frase que la letra
   parafrasea: *«no constituye diagnóstico, prescripción ni criterio clínico»*).
   El puntero equivocado está en `LETRA_TELEMEDICINA` §7, en el plan §1.5 y §5-C,
   y en `PLAN_MESA_106`.
2. **La comisión: la letra tiene razón y el T&C quedó viejo.** T&C **§14.1**
   (24-ago) dice **15 %** sobre servicios sin impuestos. **Medido en
   `fee_configs`:** el **25-ago a las 16:04 UTC**, S105-A cerró esa fila y abrió
   `{"pct": 10, "base": "subtotal"}` con nota de firma del founder. ⇒ **el motor
   vivo y la letra dicen 10 %; el documento que el profesional ACEPTA dice 15 %.**
   *No perjudica al profesional, pero el T&C publicado nombra un número que el
   sistema no aplica* — y quien «corrija» el motor hacia el T&C rompería una firma
   del founder de ayer.

### 🔴 C-8 · La grabación: el plan la excluye y la estructura ya la tiene

Plan §1: *«**Grabación de la videollamada** — nadie la pidió»*. Pero
`cita_telemedicina_detalle` trae `grabacion_url` y `grabacion_consentida`, y
**`BIO_EXPEDIENTE` D13.6 —letra canónica— la nombra**: *«tiene UN registro 1:1 en
`cita_telemedicina_detalle` con room URL, tokens, **grabación**, etc.»*

**Una columna que existe invita a llenarse.** Es la misma clase que el «código
latente» que `AVISO-DE-IA.md` advierte. **Se declara para que nadie la
«complete».**

---

## §10 · LO QUE SÍ ESTÁ A FAVOR (para que nadie lo re-audite)

- **La categoría propia no rompe nada**: los tres lectores vet ya incluyen
  `'telemedicina'` desde S68 (§1.4).
- **`modalidad='telemedicina'` YA es legal** en `evento_cita_servicio`
  (`CHECK ∈ {presencial, telemedicina, domicilio, emergencia_movil, local}`;
  hoy 175 `presencial`, 16 `local`, 7 `domicilio`, **0 telemedicina**).
- **La marca de §7 es DERIVABLE, y ya está decidida por letra canónica**:
  `BIO_EXPEDIENTE` **D13.6** — *«NO se crea evento separado en `eventos_mascota`
  para “sesión de telemedicina”. **El padre es la propia cita**»*. ⇒ **no hace
  falta columna nueva en el evento**; los lectores dibujan la marca desde la
  cita. *(Con su costura: `tipo_servicio='telemedicina'` y
  `modalidad='telemedicina'` son **dos fuentes del mismo hecho** y nada las
  concilia — la coherencia se deriva o se guarda; no se deja al productor.)*
- **El desglose congelado lo hace un TRIGGER**, así que cubre la puerta nueva
  sola (§2 ①).
- **`pagos_intentos.cita_id` ya existe** — el cobro no necesita puntero nuevo.
- **`requiere_validacion_admin=true`** ⇒ telemedicina ya entra por el camino de
  verificación profesional de S68 (§14.2), que es lo que T&C §7 exige.
- **La llave del encendido es una llave de verdad**: un `UPDATE` de admin sobre
  una columna, con 5 productores de `servicio_no_reservable` fail-closed (§5).

---

## §11 · PROPUESTA DE TERRITORIO PARA LA TANDA 1 (76h) — **propuesta, no reserva**

Sujeta a la firma de CP1 y a lo que la mesa decida sobre §9.

**Archivos que A escribiría:**

```
supabase/migrations/<nuevas de S106-A>          (escritora única)
packages/api/src/wrappers/telemedicina.ts       (nuevo)
packages/api/src/wrappers/index.ts              (export; hunk aditivo — aviso a las otras pistas)
packages/api/src/database.types.ts              (regenerado tras cada migración)
docs/LETRA_SALDO.md                             (enmienda §3, si CP1 la firma)
docs/LETRA_TELEMEDICINA.md                      (enmiendas §9/§10 y punteros, si CP1 las firma)
docs/PLAN_S106_TELEMEDICINA.md                  (estado)
docs/DEUDAS_CANONICAS.md                        (fichas nuevas desde D-926)
docs/relevamientos/2026-08-25-s106-a-*.md
docs/loop/S106-A.md
CLAUDE.md                                       (solo al cierre)
```

**Lo que A NO toca:** `packages/ui/**` (B) · `apps/**` (C) ·
`supabase/functions/**` (D) · y **todo lo abierto de S105**.

**Aviso de costura:** `packages/api/src/wrappers/index.ts` es el archivo
compartido de siempre — lo commiteo **por ruta explícita y en hunk aditivo**, y
lo declaro acá para que nadie lo arrastre (precedente S55).

---

## §12 · LO QUE ESTE TURNO NO MIDIÓ — declarado, no omitido

- **El cobro de punta a punta de una cita** (`pagos-cobro` y el actuador): leí el
  puntero y el desglose contra el objeto, **no ejercité un cobro**.
- **Quién escribe `country_config.services_enabled`** — ninguna función lo hace;
  no busqué el camino de admin fuera del monorepo.
- **Las policies de `prestador_servicios`** (quién puede prender ④).
- **`simular_cliente_agenda_cita`** y `_trg_temperamento_crear_evento`: nombran
  telemedicina, no leí sus cuerpos enteros.
- **El estado de los `token_*` frente a la RLS**: `telemedicina_select` deja leer
  la fila a *cualquiera con acceso a la mascota* — **incluido `token_prestador`**.
  Lo declaro como riesgo de diseño para D-M3; **no lo medí contra un caso real**
  porque la tabla tiene 0 filas.
