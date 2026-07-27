# LETRA_PERFIL_S79 — El perfil del prestador y la dirección (v1.1)

**Estado: FIRMADA (27 Jul 2026, Tanda 4) Y CONTRATO APLICADO (misma
fecha, T4.6 — liberado por el gate en dispositivo del founder: el alta
completa contra Paseos Shyris).** Migraciones `20260727200000` (las 5
piezas del contrato) + `20260727210000` (las tres lectoras hermanas con
el mismo AND + `invitar_prestador` con propósito/dirección de envío) +
`20260727190000` (el invariante §4bis de LETRA_ALTA). Fixture 12/12 con
ROLLBACK y residuo 0 — incluido el discriminador de la firma: el
paseador sin coordenadas DESAPARECE de la oferta con cliente
geolocalizado y reaparece sin él.
**La única excepción de la firma sigue viva: §7 (vencimientos) es
PROPUESTA con gate propio abierto.**

Contenido transpuesto de decisiones ya tomadas por el founder y la mesa
(mandato S79 Tanda 2) — esta letra las ORDENA y las deja exigibles; no las
re-abre. Fuentes de medición: `docs/relevamientos/2026-07-27-s79a-lecturas.md`
(Tanda 1, todo literal contra DB viva).

---

## §0 Por qué esta letra existe (el contraste con MODELO_PRODUCTO, adentro)

El perfil del prestador NO es un formulario de CRM — es **la firma del
prestador en el sistema** (`PORTAL_PRESTADOR` §2.4: *"el prestador se ve
representado dignamente desde el primer segundo"*). Tres leyes de
`MODELO_PRODUCTO` gobiernan cada decisión de abajo:

1. **El sujeto es la mascota; el prestador es un actor cuya experiencia
   impecable es condición de existencia** (EL NORTE, §1 de DEFINICION_SOFTLAUNCH).
   El perfil se construye para que el prestador exista dignamente en la
   vitrina — no para que la plataforma recolecte campos.
2. **Wow = cero explicación necesaria** (§2, vara tipo B). La dirección se
   escribe UNA vez y aparece completa (Places), no seis campos con un mapa
   que nadie geocodifica. Un formulario que obliga a entender la distinción
   persona/negocio está mal (`MODELO_VETERINARIA` §1: *"si una pantalla
   obliga a entender la distinción, la pantalla está mal"*).
3. **Honestidad estructural** (§2 tono: *"honesto cuando algo falla"*; L-139:
   la máquina no inventa). De acá sale la regla más dura de esta letra:
   **ningún dato geográfico se rellena por la máquina** — ni un default de
   DDL, ni un COALESCE, ni una coordenada aproximada. Lo que el prestador
   no declaró, NO existe, y el motor se comporta como si no existiera.

---

## §1 Los CUATRO REGISTROS — por dueño de dato y régimen de acceso

El perfil del prestador se compone de cuatro registros. **Cada uno tiene un
dueño de dato distinto y un régimen de acceso distinto; ninguna pantalla los
mezcla.** La medición de la Tanda 1 confirma que la DB ya separa bien (regla
25 / Decisión L verificadas: cero columnas fiscales en `prestadores`).

| # | Registro | Vive en | Quién lo ve | Quién lo edita |
|---|---|---|---|---|
| 1 | **El fiscal** | `cuentas_comerciales` (tipo_fiscal, identificación, razón social, bancarios) | SOLO el owner (RLS owner-only — el muro D-517, que acá es CORRECTO) | El owner, por su wizard/pantallas CLASE 2 |
| 2 | **La sede** | `prestadores` (dirección por Places, lat/lon, `radio_cobertura_km`, ciudad, sector) | El cliente (es la vitrina) + el equipo | El TITULAR |
| 3 | **La persona** | `profiles` / miPerfil (nombre, teléfono, foto) | Según superficie | Cada quien la suya |
| 4 | **Las credenciales** | `prestador_documentos` (título, SENESCYT, cédula, RUC, permisos) | El titular + admin (RLS medida: titular-only + `is_admin()`) | El titular sube; el ADMIN veredicta |

**La regla del registro 1 — se ENLAZA, jamás se dibuja inline.** La pantalla
de perfil puede decir *"Tus datos fiscales y de cobro"* con un chevron hacia
las pantallas de cuenta comercial (owner-only, gateadas de facto — D-517
CLASE 2); **jamás** renderiza RUC, razón social o bancarios dentro del
perfil. Dos porqués medidos: (a) el muro D-517 es RLS deliberada — para un
empleado no-owner R2 devuelve null, y una pantalla que mezcla registros
rompería para él (la pantalla actual ya lo maneja bien: degrada el estado
7.13 a null honesto, medido en Tanda 2); (b) privacidad multi-actor — la
casa ya decidió que la plata no se le muestra a quien no gestiona (S72-P1a).

**La regla del registro 2 — la sede es del NEGOCIO, no de la persona.** La
edita el titular (hoy: la RLS por fila + whitelist de producto en
`actualizarPerfilPrestador`); la delegación a administradores espera el
motor de administrador (D-513), no se dibuja antes.

---

## §2 La dirección y el radio — la ley del no-inventado

### 2.1 Lo que CAE (decidido, no re-abrir)

- **CAE el `DEFAULT 5` de `prestadores.radio_cobertura_km`.** La Tanda 1
  midió que el "15 firmado" jamás aterrizó: la columna dice DEFAULT 5 y las
  5 filas vivas valen 5 (todas de prueba — contexto firmado del mandato:
  nada que preservar, nada que borrar igual). Un default de DDL es un dato
  que NADIE declaró vistiéndose de declaración — exactamente la clase de
  relleno que L-139 prohíbe.
- **CAE el `COALESCE(p_radio_cobertura_km, 5)` de `crear_prestador_inicial`.**
  El INSERT estampa el parámetro tal cual llega; NULL entra como NULL.
- **La columna queda NULL-able DE VERDAD** — y NULL significa lo que dice:
  *este prestador no declaró radio*.
- **El 15 vive en el FORMULARIO de captura, no en el DDL:** la pantalla que
  capture el radio pre-carga 15 km como sugerencia editable (la firma S77
  del "15 como default de ARRANQUE"). El prestador lo ve, lo toca o lo
  acepta — y solo entonces existe. La diferencia entre un default de DDL y
  un valor sugerido en pantalla es que el segundo pasó por ojos humanos.

### 2.2 LA FIRMA DEL FOUNDER (transpuesta verbatim del mandato)

> **Un prestador SIN coordenadas o SIN radio declarado NO se oferta por
> geografía.**

Consecuencias operativas, en orden:

1. El filtro geográfico de las lectoras de oferta se escribe **SIN
   COALESCE** — el fragmento canónico (primera aplicación:
   `obtener_paseadores_disponibles`; las tres hermanas por oficio siguen
   el mismo AND, cada una leyendo su body antes — L-141):

   ```sql
   -- firma nueva: … , p_lat double precision DEFAULT NULL,
   --                  p_lon double precision DEFAULT NULL
   -- (parámetros nuevos con DEFAULT → los callers de hoy no se tocan;
   --  el cambio de firma exige DROP explícito de la vieja — L-119)
   AND (
     p_lat IS NULL OR p_lon IS NULL       -- §3: transición del cliente sin dirección
     OR (
       pr.lat IS NOT NULL
       AND pr.lon IS NOT NULL
       AND pr.radio_cobertura_km IS NOT NULL    -- la FIRMA: sin radio declarado, afuera
       AND 2 * 6371 * asin(sqrt(
             power(sin(radians((pr.lat - p_lat) / 2)), 2)
             + cos(radians(p_lat)) * cos(radians(pr.lat))
               * power(sin(radians((pr.lon - p_lon) / 2)), 2)
           )) <= pr.radio_cobertura_km
     )
   )
   ```

   Cero `COALESCE(pr.radio_cobertura_km, X)`: un radio inventado por la
   query es relleno plausible (L-139) — la clase de mentira que después
   nadie puede rastrear.
2. **El motor de ocupación NO se toca** (medido Tanda 1: `_agenda_ocupacion`
   opera por persona/tiempo — la geografía decide QUIÉN entra al listado,
   no cuántas citas caben; ejes ortogonales).
3. La haversine es terreno conocido de la casa (Vitales S53 sobre
   `track_gps`). Sin índice geoespacial es scan — irrelevante con 5 filas,
   **declarado** para cuando no lo sea (ya estaba en D-518, se ratifica).
4. **La misma ley rige la CAPTURA:** *"no encontramos tu dirección"* JAMÁS
   guarda coordenadas inventadas. Y su corolario simétrico — **la
   coordenada muere con el texto que la parió**: si el usuario re-guarda su
   dirección editada a mano (sin resolver por Places), lat/lon se escriben
   NULL. Una coordenada vieja pegada a un texto nuevo es peor que ninguna:
   describe OTRA puerta.

### 2.3 La transición (declarada, con disparo)

Mientras el CLIENTE no tenga dirección geocodificada (`p_lat IS NULL`), la
oferta se comporta como hoy: sin filtro geográfico. No es excepción a la
firma — la firma gobierna el lado prestador; el lado cliente sin datos no
tiene contra qué medir, y esconder toda la oferta sería castigar al cliente
por un dato que recién empezamos a capturar (A4). **Disparo de revisión:
soft launch (1-oct)** — para esa fecha la captura del hogar con Places ya
corrió semanas y la mesa decide si la dirección pasa a ser precondición de
la reserva. Cruce: D-518 pata ciudad.

---

## §3 Las dos columnas del Día 1 (`proposito` · `direccion_envio`)

Ambas nacen en `prestadores` — la tabla operativa que R1 ya resuelve para
el titular y el equipo. NO nacen en `cuentas_comerciales`: esa tabla es
fiscal pura (Decisión L en su dirección inversa — así como lo fiscal no
baja a la operativa, lo operativo no sube a la fiscal).

- **`proposito` text NULL** — la respuesta VERBATIM a la pregunta de
  `PORTAL_PRESTADOR` §2.1: *"¿por qué te metiste en esto?"*. Se guarda tal
  como la escribió el prestador (no se corrige, no se resume — es SU voz).
  **Su lector es la bienvenida §2.3 que construye B**: *"Vos nos dijiste:
  '[su respuesta]'. Acá te ayudamos a vivirlo todos los días."* El círculo
  emocional que el doc maestro pide se cierra con esta columna. Escritura:
  el flujo de aplicación/onboarding del prestador (whitelist del wrapper
  cuando B lo pida — clave por clave, patrón `actualizarPerfilPrestador`).
- **`direccion_envio` text NULL** — la dirección FÍSICA para el envío del
  kit fundador (`PORTAL_PRESTADOR` §2.2: la carta + la placa). Tres NO
  firmados: **NO es fiscal** (no vive en `cuentas_comerciales`), **NO es
  visible al cliente** (no entra a ninguna vitrina ni al shape público),
  **NO es la sede** (el prestador puede querer el kit en su casa). Lectores:
  founder/admin para operar el envío. Texto libre alcanza — es una etiqueta
  de correo, no un eje de motor; puede capturarse con Places por comodidad,
  pero se persiste como texto.

### §3bis (v1.1) — El régimen de COLUMNA: el propósito y la casa del fundador no viajan por PostgREST

Medición T3.3 (S79 Tanda 3, literal de `pg_policies`): la policy
`prestadores_public` concede **SELECT de FILA ENTERA a todo authenticated**
sobre los prestadores activos (`estado='activo' OR own OR admin`). El
`Pick` de 17 columnas de R1 es TypeScript — **no es frontera** (familia
L-140): cualquier usuario logueado puede pedir por PostgREST las columnas
que quiera. Sin más, `proposito` (la respuesta personal del fundador) y
`direccion_envio` (su casa) serían públicas de facto.

**Al paquete gated entra el PRIMER uso de privilegios por COLUMNA de la
casa** (medido: `pg_attribute.attacl` vacío en todo `public` — el
mecanismo no se usaba): se revoca el SELECT de tabla a `authenticated` y
se re-concede por LISTA de columnas — todas MENOS `proposito` y
`direccion_envio`. Compatibilidad medida, no supuesta: **cero
`select('*')` sobre `prestadores` en los wrappers vivos** (todos
seleccionan columnas nombradas — T3.3).

**Los lectores legítimos que quedan, y por dónde leen:**
- `proposito` → el TITULAR, vía `registrar_primer_ingreso()` (DEFINER —
  §4: la bienvenida lo recibe en la misma respuesta) y la escritura vía
  su whitelist. El admin, vía service_role/DEFINER.
- `direccion_envio` → SOLO founder/admin (operar el envío del kit):
  service_role o lector DEFINER gateado por `is_admin()` si alguna
  superficie lo pide. El cliente JAMÁS.
- Todo el resto de la tabla → igual que hoy (la lista de columnas
  concedidas es exhaustiva).

Declarado: la alternativa (tabla aparte `prestador_privado` con RLS
owner-only) evitaría el mecanismo de columnas, pero parte el registro de
la sede en dos tablas; la mesa eligió columna. Si un futuro
`select('*')` aparece, el rebote de permiso lo delata en desarrollo —
mejor un error ruidoso que una fuga silenciosa.

---

## §4 El primer ingreso — la marca en MOTOR (el pedido de B, diseñado acá)

La bienvenida §2.3 necesita saber **cuándo es el primer login del
prestador**. Eso es marca en motor, no estado de pantalla (un AsyncStorage
se borra con la app; la ceremonia del §2.3 ocurre UNA vez en la vida del
negocio, no una vez por instalación).

**Diseño (columna + RPC, en el paquete gated §9):**

- `prestadores.primer_ingreso_en timestamptz NULL` — NULL = el titular
  jamás entró al portal. No es "última sesión" ni telemetría: es LA marca
  ceremonial, se escribe una vez y no se toca (familia D-544: sin deshacer,
  declarado).
- RPC **`registrar_primer_ingreso()`** — SECURITY DEFINER, patrón de la casa:
  - Gate: solo **el TITULAR** (`prestadores.user_id`) estampa la marca.
    Un empleado que entra NO estampa — la bienvenida del §2.3 le habla al
    que aplicó y respondió el propósito; la bienvenida del empleado es
    otra letra (fuera de alcance, declarado).
  - **ENMIENDA v1.1 (revisión de mesa): el que NO tiene fila propia en
    `prestadores` NO es una excepción — es un estado normal.** Todo
    empleado vive en `prestador_empleados` sin fila propia en
    `prestadores` (Clínica Aurora tiene dos activos, y el arco S76–S78
    los puso a loguearse acá): la RPC les devuelve
    `{ ok: true, es_primer_ingreso: false, primer_ingreso_en: null }` —
    jamás un RAISE. La única excepción que queda es `auth_required`.
    **Consecuencia de diseño, declarada: la RPC NO exige que el caller
    sepa de antemano si es titular** — B la llama al resolver la raíz
    del portal para CUALQUIER sesión, y la respuesta ya viene modulada.
    El acoplamiento "A publica una RPC que B solo puede llamar si antes
    resolvió la titularidad por otro lado" queda eliminado.
  - **Idempotente y atómica**: `UPDATE … SET primer_ingreso_en = now()
    WHERE user_id = auth.uid() AND primer_ingreso_en IS NULL` y devuelve
    `{ es_primer_ingreso: (FOUND), primer_ingreso_en }`. El PRIMER caller
    recibe `true`; todos los siguientes `false` — la condición de carrera
    de dos dispositivos se resuelve en la fila, no en la pantalla.
  - **La respuesta del titular trae ADEMÁS su `proposito`** — la
    bienvenida §2.3 lo necesita exactamente en ese momento (*"Vos nos
    dijiste: …"*), y con el régimen de columna de §3bis el propósito no
    viaja por PostgREST: esta RPC es su lector canónico. Cero lector
    extra para B.
  - `es_primer_ingreso=true` → B muestra la bienvenida §2.3. Borde
    declarado y aceptado: si la app muere entre el estampado y el
    render, la ceremonia se pierde para siempre — es UN tap de ventana;
    no se construye máquina de dos fases para eso.
- Los prestadores de prueba existentes quedan con NULL — **cero backfill**
  (L-176: una migración no concede historia). Que el demo vea la bienvenida
  una vez es correcto, no un bug.

---

## §5 El puente ciudad → `cat_ciudades`: NO NACE AHORA (decisión con porqué)

La Tanda 1 midió: `ciudad` es texto libre en las DOS puntas, cero FK, y
`cat_ciudades` (9 filas) solo la referencia `prestador_zonas` (1 fila de
prueba, cero lectores). La enmienda L26 de D-518 ya había bajado
`cat_ciudades` a *"etiqueta y arranque en frío"*.

**Decisión: el puente NO nace en S79.** Tres porqués:

1. **El eje de alcanzabilidad de esta letra es la DISTANCIA** (radio +
   coordenadas), no la ciudad. Un FK a ciudades sería construir el eje que
   la propia firma acaba de reemplazar.
2. **Places normaliza de facto**: la captura (A2/A4) escribe `ciudad` desde
   el componente `locality` de Google — "Quito" deja de escribirse a mano.
   El dato mejora sin FK.
3. Un FK exigiría decidir qué pasa con ciudades fuera del catálogo (¿un
   prestador de Latacunga no puede existir?) — una pregunta de producto que
   nadie hizo todavía.

**Disparo declarado:** la primera superficie que necesite AGRUPAR o filtrar
POR CIUDAD como concepto (el arranque en frío de explorar por ciudad, o el
primer negocio real multi-ciudad). Ahí el puente se diseña con su regla de
"ciudad fuera de catálogo". `prestador_zonas` sigue como la dejó D-518:
declarada, sin razón de existir si el eje es distancia, y su DROP es
decisión aparte con su propio gate.

---

## §6 Las credenciales — el gate es LA PERSONA, no el establecimiento

Declaración explícita (mandato A3, entra a la letra):

> **El gate de oferta médica es la CREDENCIAL DE LA PERSONA — título
> profesional / registro SENESCYT. El permiso del ESTABLECIMIENTO
> (AGROCALIDAD, permiso de funcionamiento) se RECOLECTA, no bloquea.**

El motor medido ya dice exactamente eso (Tanda 1, A5): el trigger
`trg_ps_verificacion_profesional` rebota la activación de ofertas con
`requiere_validacion_admin=true` **solo** contra
`tipo IN ('titulo_profesional','registro_senescyt')` aprobado. Esta letra
lo consagra como decisión (no como accidente del legado): `cedula`, `ruc`,
`permiso_funcionamiento`, `certificado_vacunas`, `seguro` son documentos de
**recolección** (§6.5.2: defensiva ante auditorías) — su ausencia jamás
apaga una oferta. Si una autoridad futura exige lo contrario, es enmienda
de esta letra con su propia firma.

Del lado del proceso: el veredicto es del ADMIN (`revisar_documento_prestador`,
remate A3 — sin pantalla: 15 documentos, una vez cada uno). El founder es
admin verificado (`admin_users`, censo A0).

---

## §7 El motor de vencimientos — PROPUESTA v1.1 (espera gate del founder, NO construida)

Medido: `fecha_vencimiento` NULL en 7/7 filas; el estado `'vencido'` existe
en el CHECK sin productor.

**La v1.0 de esta propuesta tenía un hueco que la invalidaba (revisión de
mesa, T3.4):** derivaba el vencimiento SOLO en los lectores de UI, pero el
único lugar donde el vencimiento IMPORTA es el gate —
`_trg_ps_verificacion_profesional` lee la columna `estado` CRUDA y exige
`'aprobado'`. Un título vencido seguiría diciendo `'aprobado'` en la fila
y el trigger dejaría activar ofertas médicas igual: el motor habría
existido en la pantalla y no en la puerta.

**Propuesta v1.1 — la derivación perezosa entra AL GATE (sigue sin cron y
sin escritor):**

1. **El gate deriva.** El `NOT EXISTS` del trigger gana la condición de
   vigencia: `d.estado = 'aprobado' AND (d.fecha_vencimiento IS NULL OR
   d.fecha_vencimiento >= current_date)`. Un documento vencido deja de
   contar como credencial EN LA PUERTA — que es el único lugar con
   autoridad. La fila no se toca (patrón S78: la expiración se evalúa en
   lectura; escribir el vencimiento convertiría un gate en un escritor).
2. **Los lectores de UI derivan lo mismo** (`estado_efectivo`) para que
   la pantalla del prestador y el admin digan la misma verdad que la
   puerta. El valor `'vencido'` del CHECK queda reservado: solo lo
   escribiría un admin re-veredictando a mano, si alguna vez quiere
   dejarlo asentado.
3. **Limitación DECLARADA, no resuelta acá:** el trigger corre AL
   ACTIVAR una oferta — una oferta médica YA ACTIVA no se desactiva sola
   cuando el título vence después. Cerrarla de verdad exige o un barrido
   (cron — la casa lo evita), o que las lectoras de OFERTA médica sumen
   la condición de credencial vigente (un EXISTS por prestador en el
   listado — costo declarado), o la revisión humana del admin. **Cuál de
   las tres, lo decide el founder en el gate de esta propuesta** — hoy
   es teórico: 7/7 documentos sin fecha de vencimiento.
4. La captura gana el campo `fecha_vencimiento` opcional en la subida
   (hoy el wrapper no lo pide).
5. La alerta del §6.5.2 (*"vencimiento y renovación visibles"*) nace
   como fila en la pantalla de verificación del prestador, no como
   notificación — el motor de notificaciones tiene su propio arco.
6. Lo que el doc maestro deja "a refinar" (*"documentos sin renovar
   pueden afectar visibilidad pública"*) se decide RECIÉN cuando el
   primer documento real tenga fecha.

---

## §8 Contraste final contra MODELO_PRODUCTO (la prueba de EL NORTE)

- ¿El plan cierra solo ciclos transaccionales? **No** — el propósito
  devuelto (§3) y la ceremonia del primer ingreso (§4) son la capa
  emocional del portal (§2.3 del doc maestro); el radio y las coordenadas
  existen para que el CUIDADO llegue a la puerta correcta, no para una
  métrica.
- ¿Exporta complejidad al usuario? **No** — el prestador escribe su
  dirección una vez (Places), declara un radio con 15 sugerido, y jamás ve
  las palabras "lat", "lon" ni "geocodificación".
- ¿Miente en algún borde? **No** — sin coordenadas no hay oferta
  geográfica (firma §2.2), sin Places no hay coordenadas fantasma (la
  coordenada muere con el texto), sin radio declarado no hay radio.
- ¿Respeta la revelación progresiva? **Sí** — nada de esto agrega módulos
  al Día 1; enriquece los que el §2 del portal ya ordena.

---

## §9 ANEXO — el paquete de DDL que ESPERA LA FIRMA

Vive en `docs/relevamientos/2026-07-27-s79a-CONTRATO-letra-perfil.sql`
(**fuera de `supabase/migrations/` A PROPÓSITO** — precedente S78: ahí
adentro un `db push` lo aplicaría solo), con su reversa al lado
(`…-REVERSA-letra-perfil.sql`). Piezas:

1. `ALTER TABLE prestadores` — `ADD proposito text NULL` · `ADD
   direccion_envio text NULL` · `ADD primer_ingreso_en timestamptz NULL` ·
   `ALTER COLUMN radio_cobertura_km DROP DEFAULT`.
2. `crear_prestador_inicial` — muere el `COALESCE(p_radio_cobertura_km, 5)`
   (misma firma → `CREATE OR REPLACE` legal, L-119 no aplica).
3. `obtener_paseadores_disponibles` — gana `p_lat/p_lon DEFAULT NULL` + el
   AND de §2.2. **Cambio de firma ⇒ DROP explícito de la vieja + REVOKE/GRANT
   re-establecidos** (L-119 + L-140).
4. RPC `registrar_primer_ingreso()` (§4 v1.1 — el empleado recibe
   respuesta normal, jamás excepción; el titular recibe además su
   `proposito`) con su REVOKE anon/PUBLIC + sonda proacl.
5. **(v1.1)** El régimen de columna de §3bis: REVOKE SELECT de tabla a
   `authenticated` + GRANT por lista de columnas (todas menos `proposito`
   y `direccion_envio`) — primer uso del mecanismo en la casa,
   compatibilidad medida (cero `select('*')` vivo).
6. Post-aplicación: `gen:types` + fixture in-txn ROLLBACK (radio NULL entra
   · titular estampa primer ingreso una sola vez y recibe su propósito ·
   EMPLEADO recibe `es_primer_ingreso:false` sin excepción · paseador sin
   coords desaparece de la oferta CON cliente geolocalizado y reaparece
   SIN él · authenticated NO puede SELECT `proposito` por PostgREST y SÍ
   el resto de columnas).

**76(g), declarada por adelantado para ese paquete: NO RIGE** — DDL aditivo
(columnas nullable sin DEFAULT — instantáneas, sin reescritura), cero
backfill, cero anclas sobre datos vivos. Las tres lectoras hermanas
(grooming/adiestramiento/vet) se migran en la MISMA tanda post-firma,
leyendo cada body antes de tocarlo (L-141).

---

## Historial

- **FIRMA (27 Jul 2026, S79-A Tanda 4):** el founder FIRMÓ la v1.1, con
  las dos excepciones del encabezado (§7 sigue propuesta; el contrato
  espera el gate en dispositivo de la captura de sede de B). **Precisión
  del mismo acto de firma (decisión founder T4: la ceremonia §2.3
  dispara en la FASE 4 del alta, jamás antes):** `registrar_primer_ingreso`
  estampa SOLO con `estado='activo'` — el primer ingreso es AL PORTAL, y
  antes de la activación no hay portal (la sala de espera no quema la
  ceremonia). El detalle vive en `LETRA_ALTA_S79` §2; el CONTRATO §9.4
  incorpora la condición.
- **v1.1 (27 Jul 2026, S79-A Tanda 3 — dos enmiendas de revisión de mesa
  + una medición):** ① §4: `sin_prestador` DEJA de ser excepción — el
  empleado sin fila propia es estado normal y recibe
  `{ok, es_primer_ingreso:false, primer_ingreso_en:null}`; la RPC ya no
  exige que el caller resuelva titularidad antes (acoplamiento A↔B
  eliminado); el titular recibe además su `proposito` en la respuesta.
  ② §7 reescrita: la expiración perezosa entra AL GATE (el trigger
  deriva vigencia con `fecha_vencimiento`), con la limitación de las
  ofertas ya-activas DECLARADA y sus tres salidas a decisión del
  founder. ③ §3bis NUEVA (medición T3.3): `prestadores_public` expone
  fila entera a authenticated ⇒ el paquete gated gana el régimen de
  privilegios por COLUMNA para `proposito`/`direccion_envio` (primer uso
  del mecanismo; compatibilidad medida). Sigue esperando firma; cero
  columnas existen.
- **v1.0 (27 Jul 2026, S79-A Tanda 2):** depositada. Transpone las
  decisiones del mandato Tanda 2 (cuatro registros · caída del default 5 ·
  firma sin-datos-sin-oferta · propósito y dirección de envío · primer
  ingreso · puente a ciudades NO nace · credencial-de-persona como gate ·
  vencimientos como propuesta). Espera firma del founder; ninguna columna
  existe hasta entonces.
