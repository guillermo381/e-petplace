# LETRA_PERFIL_S79 — El perfil del prestador y la dirección (v1.0)

**Estado: DEPOSITADA — ESPERA FIRMA DEL FOUNDER.**
Gate declarado en el mandato de la tanda: *la letra se firma antes de que
exista una columna*. El anexo §9 lista el DDL exacto que espera esa firma;
al momento de depositar esta letra, **cero columnas nuevas existen** (medible:
`information_schema.columns` de `prestadores` idéntico al de la Tanda 1).

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
  - Gate: `auth.uid()` debe ser **el TITULAR** (`prestadores.user_id`).
    Un empleado que entra NO estampa la marca del negocio — la bienvenida
    del §2.3 le habla al que aplicó y respondió el propósito; la bienvenida
    del empleado es otra letra (fuera de alcance, declarado).
  - **Idempotente y atómica**: `UPDATE … SET primer_ingreso_en = now()
    WHERE user_id = auth.uid() AND primer_ingreso_en IS NULL` y devuelve
    `{ es_primer_ingreso: (FOUND), primer_ingreso_en }`. El PRIMER caller
    recibe `true`; todos los siguientes `false` — la condición de carrera
    de dos dispositivos se resuelve en la fila, no en la pantalla.
  - B la llama al resolver la raíz del portal con sesión de titular;
    `es_primer_ingreso=true` → muestra la bienvenida §2.3. Borde declarado
    y aceptado: si la app muere entre el estampado y el render, la
    ceremonia se pierde para siempre — es UN tap de ventana; no se
    construye máquina de dos fases para eso.
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

## §7 El motor de vencimientos — PROPUESTA (espera gate del founder, NO construida)

Medido: `fecha_vencimiento` NULL en 7/7 filas; el estado `'vencido'` existe
en el CHECK sin productor. Propuesta para la firma (cero código hoy):

- **Expiración PEREZOSA, patrón de la casa** (S78 mostrador): NINGÚN cron,
  NINGÚN escritor. Los lectores derivan `estado_efectivo = CASE WHEN
  estado='aprobado' AND fecha_vencimiento < current_date THEN 'vencido'
  ELSE estado END`. La fila no se toca; el valor `'vencido'` del CHECK
  queda como estado DERIVADO en lectura (o se escribe solo cuando un admin
  re-veredicta — decisión dentro de esta propuesta).
- La captura gana el campo `fecha_vencimiento` opcional en la subida (hoy
  el wrapper no lo pide).
- La alerta del §6.5.2 (*"vencimiento y renovación visibles"*) nace como
  fila en la pantalla de verificación del prestador, no como notificación —
  el motor de notificaciones tiene su propio arco (MODELO_NOTIFICACIONES).
- Lo que el doc maestro deja "a refinar" (*"documentos sin renovar pueden
  afectar visibilidad pública"*) se decide RECIÉN cuando el primer
  documento real tenga fecha: hoy sería letra sobre datos que no existen.

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
4. RPC `registrar_primer_ingreso()` (§4) con su REVOKE anon/PUBLIC + sonda
   proacl.
5. Post-aplicación: `gen:types` + fixture in-txn ROLLBACK (radio NULL entra
   · titular estampa primer ingreso una sola vez · paseador sin coords
   desaparece de la oferta CON cliente geolocalizado y reaparece SIN él).

**76(g), declarada por adelantado para ese paquete: NO RIGE** — DDL aditivo
(columnas nullable sin DEFAULT — instantáneas, sin reescritura), cero
backfill, cero anclas sobre datos vivos. Las tres lectoras hermanas
(grooming/adiestramiento/vet) se migran en la MISMA tanda post-firma,
leyendo cada body antes de tocarlo (L-141).

---

## Historial

- **v1.0 (27 Jul 2026, S79-A Tanda 2):** depositada. Transpone las
  decisiones del mandato Tanda 2 (cuatro registros · caída del default 5 ·
  firma sin-datos-sin-oferta · propósito y dirección de envío · primer
  ingreso · puente a ciudades NO nace · credencial-de-persona como gate ·
  vencimientos como propuesta). Espera firma del founder; ninguna columna
  existe hasta entonces.
