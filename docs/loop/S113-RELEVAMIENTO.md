# S113 · RELEVAMIENTO — el expediente de la mascota y lo que una pieza de IA necesitaría

> **Es un relevamiento, no un plan.** No arregla nada, no propone nada, no
> concluye nada que no esté medido. Lo que no se pudo medir dice NULL y por qué.

---

## ⓪ CONTRA QUÉ MIDO

| qué | valor |
|---|---|
| rama | `main` |
| `git rev-parse --short HEAD` | **`441015cc`** (completo `441015cc4e566f9f9aa37de428454d68136ca2a2`) |
| `git status --short` | **vacío — árbol limpio** |
| **en MI ÁRBOL, en ese SHA** | todas las afirmaciones de repo de este documento |
| proyecto Supabase | ref **`zyltipqscdsdsxnjclhp`** (`supabase/.temp/project-ref`), `postgres` / **PostgreSQL 17.6** |
| ambiente | **el mismo proyecto que usan las apps y el portal admin** (CLAUDE.md lo declara desde S94-A). No hay proyecto de staging separado: **medí contra la base que sirve al producto** |
| instrumento de base | `npx supabase --experimental db query --linked --file <archivo>` |
| fecha/hora de apertura | **2026-09-03 19:54 -05** |

⚠️ **Un límite que se declara arriba, no al final:** el ambiente es único. Todo
conteo de filas de abajo es el estado real de esa base al momento de medir, con
datos de prueba y datos reales mezclados — la propia base no los distingue salvo
donde una columna lo diga.

---

# PARTE 0 · LO QUE S112 DEJÓ DICHO

## 0.1(a) Lo que S112 dijo que NO se dé por hecho — verbatim de `docs/loop/S113-ARRANQUE.md`

```
## LAS TRES COSAS QUE ESTA SESIÓN NO DEBE DAR POR HECHAS

1. **Nada de los lotes 3, 4 y 5 está verificado en aparato salvo lo que el
   founder recorrió explícitamente el 3-sep** (el hilo de adopción abre en
   las dos apps). Todo lo demás — la vitrina, los filtros, el clip, la
   bitácora, el quinto oficio — se leyó del objeto, jamás de una pantalla.
2. **El reloj de 5 días nunca emitió su primera notificación real**, y no
   puede: las solicitudes vivas hoy nacieron antes de que el mecanismo
   existiera. No es un defecto — es un no-evento que se prueba esperando.
3. **El binario instalado es 1.0.7, y dos cosas esperan build nativa**:
   `expo-clipboard` en el prestador (declarado, sin hornear — el botón
   "Copiar" de la pantalla forense no funciona hasta la próxima APK) y
   ninguna otra dependencia nueva pendiente. `useAnimatedKeyboard` fue
   **retirado**, no agregado — no genera deuda de build.
```

## 0.1(b) Qué está publicado y qué no — verbatim

De `docs/loop/S113-ARRANQUE.md`:

```
## PUBLICADO, y dónde

Siete OTAs de S112, runtime **1.0.7**, canal **preview**. El último ancla
`e29238a9`. **Nada tocó producción — la veda sigue entera.** El founder
recorrió y aprobó **el lote 5** en aparato (3-sep); los lotes 3 y 4 **no se
verificaron en un teléfono**.

## CONSTRUIDO Y NO PUBLICADO

- **La burbuja del refugio en el prestador** (mensajes + solicitudes),
  mergeada en `main`, cero aparato. **Primer objetivo de S113.**
- `D-485` (motor) está publicado en el lote 7; el hook curado también.
```

De `docs/loop/S112-CIERRE.md` §⑦ (el cuadro con groups y anclas):

```
### LOS SIETE PUBLISHES DE S112, leídos del objeto con `eas update:list` +
`update:view --json` — no de memoria ni del texto del publish

| # | cliente / prestador | ancla | contenido |
|---|---|---|---|
| 1 | `6aedf349` / `51a263b2` | `fde8494d` | guardería: D-1001 con su pantalla (especie y propiedad) · D-1000 · el Botón dibuja su razón |
| 2 | `46e2afd0` / `a6fbd3d8` | `23867033` | el vertical de adopción entero: vidriera/portal, ficha, formulario, acta y firma |
| 3 | `3cf23c3e` / `1a824db9` | `6af1e3ae` | **lote 2** — adopción completa (vitrina, buscador, filtros, avatares por especie) + guardería (foto a la primera, clip, en vivo) |
| 4 | `fe5b911b` / `267dbff8` | `84e1add5` | **lote 3** — chat de adopción (escalera, hilo, realtime), vitrina del refugio y buscador, filtros |
| 5 | `a3ca0121` / `c60d81f3` | `8bd1ce4e` | **lote 4** — el día en la zona del negocio, chat en vivo sin sondeo, vitrina del refugio con sus imágenes |
| 6 | `4662308e` / `d9874131` | `f57c9967` | **lote 5** — la cura del crash del hilo (TDZ), pantalla forense, conductas en la línea de vida, zona horaria real — **recorrido y aprobado por el founder en aparato (3-sep)** |
| 7 | `95cc9073` / `d4809664` | `e29238a9` | burbuja de pendientes (mitad cliente), D-485 (motor), hook curado |

runtime **1.0.7** en las siete · canal **preview** · `dirty: None` en las
catorce filas (ios+android × 7). ⚠️ **Son SIETE, no cinco** — se declara la
cuenta medida, no la esperada: dos de los siete (#1 y #2) son de antes de que
la numeración "lote N" empezara con el lote 2.
```

## 0.2 Las decisiones de `docs/loop/S112-HOJA-DE-DECISION.md` — título y estado

Estado tal como lo declara ese documento; donde el documento no dice
"firmada", lo marco **pendiente** y no infiero.

| # | título | estado según el documento |
|---|---|---|
| 1 | La veda de producción sigue ENTERA | **pendiente** — espera el «autorizo» del founder |
| 2 | El orden: guardería primero, adopción segundo | **pendiente** — *"Propuesto, no votado — es tu decisión"* |
| 3 | Recorrido en aparato del lote 5 | **firmada / hecha** (3-sep) · **pendiente** el recorrido de los lotes 3 y 4 |
| 4 | T&C Pet Parent v1.0 (S113) | **pendiente** — falta redactar y depositar el texto; el motor ya está probado |
| 5 | El corchete del canal de soporte | **pendiente** — sin decidir a qué canal llega un reclamo |
| 6 | El 5 % a la fundación, con o sin IVA | **pendiente** — espera al contador (pregunta 11) |
| 7 | Padrinazgo y donación (§6/§7 `LETRA_ADOPCION`) | **letra firmada** (ítems ⑨⑩⑪ ✅ 3-sep) · **motor de cobro pendiente**, bloqueado por el ítem 6 |
| 8 | `D-1007` — el motor mide "hoy" con zona fija | **pendiente** — curar antes del primer prestador no-EC |
| 9 | `D-1008` — un crash no deja rastro | **pendiente** — decisión de plataforma |
| 10 | El protocolo del animal no retirado (guardería) | **pendiente** — espera al abogado (memo 10 §3) |
| 11 | El reloj de 5 días (ítem de calendario) | **sin acción** — *"se resuelve solo, con el tiempo"* |
| 12 | Cancelar la suscripción de Pepe (el ave) | **pendiente** — acción del founder, no de código |
| 13 | El compromiso de esterilización (Ordenanza 019) | **pendiente** — `SemaforoSanitario` espera esa firma |

---

# PARTE 1 · EL EXPEDIENTE EN LA BASE

### 1.1 `eventos_mascota` — columnas, `procedencia` y la columna de captura de D-753
- **EXISTE:** sí — y **la columna de captura de D-753 EXISTE**: se llama `modo_captura`
- **DÓNDE:** `public.eventos_mascota` · 22 columnas
- **MEDIDO CON:**
  `select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='eventos_mascota'`
  y `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.eventos_mascota'::regclass and contype='c'`
- **EVIDENCIA:**
  ```
  id uuid! · mascota_id uuid! · tipo text! · eje_jtbd text! · fecha_evento timestamptz!
  evento_padre_id · cuenta_comercial_id · prestador_id · empleado_id
  creado_por_user_id · creado_por_sistema · datos jsonb! def '{}' · visibilidad jsonb
  soft_delete bool! def false · soft_delete_en/_por/_motivo · country_code text!
  created_at! · updated_at! · procedencia text NULL · modo_captura text NULL

  eventos_mascota_procedencia_check
    CHECK (procedencia = ANY (ARRAY['declarado_por_familia','verificado_por_prestador','declarado_por_prestador']))
  eventos_mascota_modo_captura_check
    CHECK (modo_captura IS NULL OR modo_captura = ANY (ARRAY['tecleado','dictado','extraido_por_ia','automatico']))
  ```
- **NOTA:** `procedencia` es text con CHECK de 3 valores, `modo_captura` text con CHECK de 4 — ninguno es enum de `pg_enum`.

### 1.1bis Llenado real de `procedencia` y `modo_captura`
- **EXISTE:** parcial — la columna existe, el dato casi no
- **MEDIDO CON:** `select coalesce(procedencia,'(null)'), coalesce(modo_captura,'(null)'), count(*) from public.eventos_mascota group by 1,2`
- **EVIDENCIA:**
  ```
  procedencia=(null)                 modo_captura=(null)        n=443
  procedencia=declarado_por_familia  modo_captura=(null)        n=101
  procedencia=declarado_por_prestador modo_captura=(null)       n=20
  procedencia=declarado_por_familia  modo_captura=automatico    n=2
  ```
- **NOTA:** de 566 eventos, **`modo_captura` está poblada en 2**; `verificado_por_prestador` tiene **0 filas**.

### 1.1ter Quién exige `procedencia` y quién escribe `modo_captura`
- **EXISTE:** sí (procedencia: trigger que la exige) · **parcial** (modo_captura: 2 escritores, ninguno clínico)
- **DÓNDE:** trigger `trg_eventos_procedencia_clinica` → `_trg_eventos_procedencia_clinica()`
- **MEDIDO CON:** `pg_get_functiondef` del trigger + `select proname from pg_proc where pg_get_functiondef(oid) ilike '%modo_captura%'`
- **EVIDENCIA:**
  ```sql
  IF NEW.procedencia IS NULL
     AND EXISTS (SELECT 1 FROM cat_tipos_evento c WHERE c.codigo = NEW.tipo AND c.es_clinico) THEN
    RAISE EXCEPTION 'procedencia_requerida' USING ERRCODE = '22023';
  END IF;
  ```
  ```
  FUNCIONES que nombran modo_captura: reclamar_compra_mostrador, _depositar_item_en_expediente
  CONTROL-POS: funciones que nombran procedencia = 12
  eventos CLÍNICOS con procedencia NULL = 0   (control-pos: clínicos totales = 49)
  eventos NO clínicos con procedencia NULL = 443
  ```
- **NOTA:** los 443 nulos son **todos no-clínicos** — el trigger cierra la clase clínica; `modo_captura` sólo lo escribe el camino de despensa.

### 1.2 `cat_tipos_evento` — filas reales y conteo de eventos por tipo
- **EXISTE:** sí — 62 tipos, 20 columnas
- **MEDIDO CON:** `select codigo, eje_jtbd, es_clinico, activo, es_mvp, propaga_a_perfil, tabla_tipada from public.cat_tipos_evento` con `left join` al conteo de `eventos_mascota`
- **EVIDENCIA (los que tienen eventos, ordenados por n):**
  ```
  cita_servicio                     salud           n=375   tabla=evento_cita_servicio
  hito_narrativo                    identidad       n=69    tabla=evento_hito_narrativo
  vacuna_aplicada          CLÍNICO  salud           n=32    tabla=evento_vacuna_aplicada
  atencion_paseo_registrada         cuidado_externo n=29
  foto_guarderia                    cuidado_externo n=15
  atencion_grooming_registrada      cuidado_externo n=7
  historia_clinica_registrada CLÍN. salud           n=7
  peso_medicion                     etapa_vida      n=7
  medicacion_prescrita     CLÍNICO  salud           n=5
  alta_asistida_pendiente_creada    administrativo  n=4
  bitacora_familia                  identidad       n=4
  atencion_adiestramiento_registrada comportamiento n=3
  caso_clinico_abierto     CLÍNICO  salud           n=3
  producto_asignacion               alimentacion    n=2
  alergia_diagnosticada    CLÍNICO  salud           n=1
  examen_diagnostico       CLÍNICO  salud           n=1
  transferencia_familia             identidad       n=1
  alta_asistida_completada_por_clien administrativo n=1
  ```
- **NOTA:** **44 de los 62 tipos tienen n=0** — entre ellos `desparasitacion_aplicada`, `condicion_cronica_diagnosticada`, `observacion_comportamiento`, `chip_implantado`, `cambio_comida`, `esterilizacion`, los dos `wearable_*` y los tres `medicacion_*`/`intervencion_*`.

### 1.3 La tabla tipada de vacuna — columnas y llenado
- **EXISTE:** sí — `public.evento_vacuna_aplicada`, 19 columnas
- **MEDIDO CON:** `information_schema.columns` + `select count(*), count(<cada columna>) from public.evento_vacuna_aplicada`
- **EVIDENCIA (columnas):**
  ```
  id! evento_id mascota_id! nombre_vacuna! fecha_aplicada fecha_proxima
  veterinario_nombre_externo created_at! country_code! lote dosis via_administracion
  archivo_url prestador_id updated_at! tipo_vacuna cita_id empleado_id vacuna_codigo
  ```
- **EVIDENCIA (llenado, 32 filas):**
  ```
  filas=32 · nombre=32 · tipo=22 · vacuna_codigo=22 · fecha_aplicada=32
  fecha_proxima=1 · lote=32 · dosis=0 · via_administracion=0
  archivo_url=32 · prestador_id=0 · veterinario_nombre_externo=19 · cita_id=0 · evento_id=32
  ```
- Marcado específicamente:
  - **lote:** columna EXISTE, 32/32 poblada
  - **marca / laboratorio:** **NO EXISTE como columna.** Control positivo con la misma consulta: `lote` sí aparece en la lista de `information_schema.columns`
  - **vía:** `via_administracion` EXISTE, **0/32** poblada
  - **vencimiento del biológico:** **NO EXISTE como columna.** Control positivo: `fecha_proxima` sí existe (y es *próxima dosis*, no vencimiento del vial)
  - **próxima dosis:** `fecha_proxima` EXISTE, **1/32** poblada
- **NOTA sobre `lote`:** los valores se repiten entre mascotas distintas — `9B2F` aparece en 7 filas de **4 mascotas**; `0129035B01`, `47087B`, `A127G01`, `A468A01` en 4 filas de **4 mascotas** cada uno.

### 1.3bis `cat_vacunas` y `cat_plan_vacunal`
- **EXISTE:** sí — `cat_vacunas` 7 filas · `cat_plan_vacunal` 9 filas
- **MEDIDO CON:** `select count(*) from public.cat_vacunas` · `select especie_codigo, vacuna_codigo, periodicidad_meses, obligatoria from public.cat_plan_vacunal`
- **EVIDENCIA:**
  ```
  perro/multiple/12/obl · perro/leptospirosis/12/obl · perro/tos_perreras/12
  perro/giardia/12 · perro/antirrabica/12/obl
  gato/triple_felina/12/obl · gato/leucemia_felina/12/obl · gato/giardia/12 · gato/antirrabica/12/obl
  cols: especie_codigo, vacuna_codigo, obligatoria, periodicidad_meses, edad_inicio_meses, orden, activo, created_at, exigida_guarderia
  ```
- **NOTA:** el plan vacunal SÍ tiene periodicidad y obligatoriedad por especie — la pantalla de vacunas del cliente declara en su cabecera que no los tiene (ver 2.3, ítem ①).

### 1.4 Antiparasitario — cómo está modelado hoy
- **EXISTE:** parcial — **tipo de evento propio, con tabla tipada y trigger, y CERO filas**
- **DÓNDE:** `cat_tipos_evento.codigo='desparasitacion_aplicada'` (es_clinico=S, activo=S, mvp=S, `tabla_tipada='evento_desparasitacion_aplicada'`) · `public.evento_desparasitacion_aplicada`
- **MEDIDO CON:** `information_schema.columns` · `select count(*) from public.evento_desparasitacion_aplicada` · `pg_constraint` · `pg_trigger`
- **EVIDENCIA:**
  ```
  cols: id! evento_id mascota_id! prestador_id empleado_id country_code
        producto! tipo_desparasitacion fecha_aplicada fecha_proxima lote notas archivo_url created_at! updated_at!
  filas = 0
  único CHECK: (fecha_proxima IS NULL OR fecha_aplicada IS NULL OR fecha_proxima >= fecha_aplicada)
  triggers: trg_desparasitacion_crear_evento -> _trg_desparasitacion_crear_evento · trg_..._updated_at
  ```
- **«Tipo de plaga» (pulga / garrapata / mosquito / interno):**
  - En el EVENTO: **NO** — `tipo_desparasitacion` es `text` **sin CHECK que lo restrinja** (el único CHECK de la tabla es el de fechas). Tipado en `packages/api` como `'interna' | 'externa' | 'mixta' | null` (`packages/api/src/wrappers/perfilMascota.ts:72`), que es interna/externa, **no** especie de plaga.
  - En el PRODUCTO: **SÍ, y con detalle** — `public.producto_ficha_dosificacion`, **143 filas**, columna `espectro`.
- **EVIDENCIA (`espectro`, 3 valores literales de los ~30 distintos):**
  ```
  "Pulgas (Ctenocephalides spp.), garrapatas (Rhipicephalus sanguineus, Amblyomma spp.), sarna demodecica y sarcoptica"
  "Nematodos (Toxocara, Toxascaris, Ancylostoma, Uncinaria, Trichuris) y cestodos (Dipylidium, Taenia, Echinococcus)"
  "Pulgas, garrapatas, mosquitos, flebotomos y moscas de establo (accion insecticida y repelente)"
  cols: producto_id, principio_activo, concentracion, periodicidad_dias, via_administracion,
        espectro, contraindicaciones, edad_minima, requiere_receta, registro_agrocalidad,
        rango_peso_animal_kg, fuente, created_at, updated_at
  familia_codigo de los productos con ficha: antiparasitario · suplemento
  ```
- **Tres filas reales como evidencia:** **NO PUDE** — `evento_desparasitacion_aplicada` tiene 0 filas. Control positivo con la misma consulta: `evento_vacuna_aplicada` devolvió 32.
- **NOTA:** el saber antiparasitario vive del lado **producto** (143 fichas con espectro y periodicidad); el lado **expediente** tiene la estructura entera y ningún hecho.

### 1.5 `mascota_perfil_vigente` — columnas y quién propaga
- **EXISTE:** sí — 23 columnas, 89 filas (una por mascota)
- **MEDIDO CON:** `information_schema.columns` · `pg_trigger` join `pg_proc` sobre las tablas `evento*`
- **EVIDENCIA (columnas):**
  ```
  mascota_id! · peso_clinico_kg · peso_clinico_medido_en · peso_reportado_kg
  peso_reportado_medido_en · peso_reportado_metodo · alergias jsonb!
  condiciones_cronicas jsonb! · intervenciones_permanentes jsonb! · medicacion_actual jsonb!
  plan_nutricional_actual jsonb · prestadores_habituales jsonb! · temperamento jsonb!
  ultimo_evento_id · ultimo_evento_fecha · seguro_activo_id · microchip_activo
  tiene_emergencia_activa bool! · created_at! · updated_at! · identidad_personal jsonb!
  alergias_ninguna_declarada_en · alergias_ninguna_declarada_por
  ```
- **EVIDENCIA (los propagadores, medidos en `pg_trigger`):**
  ```
  evento_alergia_diagnosticada            :: trg_alergia_propagar_perfil      -> _trg_alergia_propagar_perfil
  evento_condicion_cronica_diagnosticada  :: trg_condicion_propagar_perfil    -> _trg_condicion_propagar_perfil
  evento_medicacion_prescrita             :: trg_medicacion_propagar_perfil   -> _trg_medicacion_propagar_perfil
  evento_peso_medicion                    :: trg_peso_propagar_perfil         -> _trg_peso_propagar_perfil
  evento_intervencion_permanente          :: trg_intervencion_propagar_perfil -> _trg_intervencion_propagar_perfil
  evento_microchip_asignado               :: trg_microchip_propagar           -> _trg_microchip_propagar
  evento_temperamento_observacion         :: trg_temperamento_propagar_perfil -> _trg_temperamento_propagar_perfil
  eventos_mascota                         :: trg_eventos_update_ultimo        -> _trg_eventos_update_ultimo
  mascota_perfil_vigente                  :: trg_perfil_sincronizar_restricciones -> _trg_sincronizar_restricciones_mascota
  ```
- Cómo llega cada uno: **alergias** ← trigger sobre `evento_alergia_diagnosticada` · **condiciones crónicas** ← trigger sobre `evento_condicion_cronica_diagnosticada` · **medicación vigente** ← trigger sobre `evento_medicacion_prescrita` · **peso y su fecha** ← trigger sobre `evento_peso_medicion`.
- **NOTA:** `evento_vacuna_aplicada` **no tiene trigger de propagación** (sólo `crear_evento` y `updated_at`) — coherente con que el perfil no tenga campo de vacunas.

### 1.6 CUIDADO ESPECIAL (`LETRA_CUIDADO_ESPECIAL_S74` / D-469)
- **EXISTE:** **no**, en las tres capas
- **DÓNDE:** la letra sí existe en `docs/LETRA_CUIDADO_ESPECIAL_S74.md`; el catálogo, la tabla, el enum, el wrapper y la pantalla, no
- **MEDIDO CON:**
  - schema: `select table_name from information_schema.tables where table_schema='public' and (table_name ilike '%cuidado%' or table_name ilike '%especial%')` · `select table_name, column_name from information_schema.columns where column_name='cuidado_especial'` · `select typname from pg_type t join pg_enum e on e.enumtypid=t.oid where e.enumlabel in ('recedida','escalada')`
  - api/apps: `grep -rn -i "cuidado_especial\|cuidadoEspecial\|CuidadoEspecial" packages/api/src packages/domain/src apps/*/src`
- **CONTROL POSITIVO:** con la misma consulta de tablas aparecieron `cat_especialidades_vet`, `prestador_especialidades`, `logros`, `puntos_usuario`, `user_preferencias`. Con la misma consulta de enums aparecieron `estado_cuenta_comercial_enum`, `estado_evento_economico_enum`, `revenue_stream_enum`, `tipo_actor_enum` y 4 más. Con el mismo grep aparecieron hits de `"cuidado especial"` como TEXTO.
- **EVIDENCIA:**
  ```
  tabla/columna llamada cuidado_especial          → (NO EXISTE)
  enum con valores recedida/escalada              → (NO EXISTE)
  grep cuidado_especial en packages/api|domain|apps → 0 hits
  evento observacion_comportamiento: filas        → 0
  ```
- **EVIDENCIA (lo que sí aparece con ese texto, y es otra cosa):**
  ```
  apps/cliente/src/i18n/es.ts:403      momentoM4: 'Con cuidado especial'
  apps/prestador/src/i18n/es.ts:1328   etapaM4: 'Con cuidado especial'
  apps/prestador/src/app/mascota/[mascotaId].tsx:189  // CUIDADO ESPECIAL entra entre la etapa y lo operativo; el aviso de
  ```
- **NOTA:** el texto "cuidado especial" en las apps es la **etiqueta de M4** (momento vital), no el catálogo de la letra; los nombres que la letra propone (`cuidado_especial`, estados `vigente/recedida/escalada`, naturaleza `temporal/definitiva`) no existen en ninguna capa.

### 1.7 Peso — tabla, columnas y fuente
- **EXISTE:** sí — `public.evento_peso_medicion`, **7 filas**
- **DÓNDE:** columna `metodo_medicion` con CHECK
- **MEDIDO CON:** `information_schema.columns` · `pg_constraint` · `select count(*)`
- **EVIDENCIA:**
  ```
  cols: id! evento_id! mascota_id! prestador_id empleado_id country_code!
        peso_kg numeric! metodo_medicion text! fecha_medicion timestamptz! notas created_at! updated_at!
  CHECK (metodo_medicion = ANY (ARRAY['bascula_clinica','bascula_casa','estimacion']))
  filas = 7
  ```
- **¿Distingue la fuente vet / grooming / casa?** **Parcial y no por oficio:** distingue `bascula_clinica` / `bascula_casa` / `estimacion`, y por separado guarda `prestador_id` y `empleado_id`. **No hay columna de oficio.** El snapshot del perfil separa `peso_clinico_kg` de `peso_reportado_kg` (dos campos distintos), que es la misma distinción de dos lados.
- **Filas por mascota de prueba:** ver 1.13 — de las 18 mascotas medidas, **una** tiene peso clínico (Thor `d2e31d70`, 11.4 kg) y **la misma** tiene peso reportado (23 kg).

### 1.8 Documentos y adjuntos (eje 8)
- **EXISTE:** sí — 14 buckets, tabla `evento_archivo_adjunto`, tipo de evento `archivo_adjunto` con **0 filas**
- **MEDIDO CON:** `select id, public, file_size_limit, allowed_mime_types, (select count(*) from storage.objects o where o.bucket_id=b.id) from storage.buckets b`
- **EVIDENCIA (buckets):**
  ```
  adiestramiento-clips  priv  50MB  video/mp4,quicktime,webm             objetos=1
  adopcion-fotos        PUB    5MB  png,jpeg,webp                        objetos=0
  avatars               PUB    5MB  png,jpeg,webp                        objetos=12
  cita-archivos         priv  10MB  (sin lista de mimes)                 objetos=11
  cuenta-documentos     priv   5MB  application/pdf,jpeg,png,webp        objetos=2
  entregas              priv   5MB  jpeg,png,webp                        objetos=0
  especies-razas        PUB  256KB  image/webp                           objetos=111
  grooming-archivos     priv  10MB  jpeg,png,webp,heic,application/pdf   objetos=27
  guarderia-media       priv  50MB  jpeg,png,webp,mp4,quicktime,webm     objetos=12
  marca-publica         PUB    2MB  png,jpeg,webp,svg+xml                objetos=1
  mascotas              priv   5MB  jpeg,png,webp                        objetos=22
  prestador-documentos  priv   5MB  jpeg,png,webp,heic,application/pdf   objetos=0
  prestador-galeria     PUB   10MB  jpeg,png,webp,mp4,quicktime          objetos=8
  productos-fotos       PUB    5MB  png,jpeg,webp                        objetos=0
  ```
- **Tabla de documentos:** `evento_archivo_adjunto` — `id! mascota_id! prestador_id! country_code! bucket! storage_path! nombre_archivo! mime_type tamano_bytes categoria! descripcion subido_por_user_id! orden! created_at! evento_padre_id! evento_id empleado_id updated_at! origen_captura`
- **¿Existe hoy algo que reciba un PDF o una foto de otra clínica?**
  - **PDF:** los buckets que aceptan `application/pdf` son `cuenta-documentos`, `grooming-archivos`, `prestador-documentos` — **ninguno cuelga de una mascota**: los dos primeros son del titular/negocio y el tercero de los papeles del prestador. `cita-archivos` no declara lista de mimes (aceptaría PDF), y `mascotas` sólo acepta imágenes.
  - **Foto de otra clínica:** existe `extract-documento` (edge desplegada, v31, Sonnet 5) — ver 3.2.
  - `evento_archivo_adjunto` tiene **0 eventos de tipo `archivo_adjunto`**.
- **Policies de los buckets:** **NO PUDE MEDIR** en esta pasada — no corrí `pg_policies` sobre `storage.objects`; lo declaro en vez de suponerlo.

### 1.9 Momento vital (M0–M6) y memorial
- **EXISTE:** parcial — **el momento vital NO es una columna: se calcula**; el estado de vida sí es columna
- **DÓNDE:** `public.mascotas.estado_vida` + `estado_vida_desde` · `public.cat_especies_perfil.momentos_vitales_jsonb` · `public.calcular_etapa_vida(p_fecha_nacimiento date, p_especie text)` · `packages/domain` `calcularMomentoVital`
- **MEDIDO CON:** `select table_name||'.'||column_name from information_schema.columns where column_name ilike '%momento%' or column_name ilike '%estado_vida%'` · `pg_constraint` · `pg_proc`
- **EVIDENCIA:**
  ```
  mascotas.estado_vida        CHECK (estado_vida = ANY (ARRAY['activa','perdida','fallecida']))
  mascotas.estado_vida_desde  timestamptz
  valores vivos: activa=89   (ninguna perdida, ninguna fallecida)
  cat_especies_perfil.momentos_vitales_jsonb — 9 de 9 especies con jsonb
  pg_proc: calcular_etapa_vida(p_fecha_nacimiento date, p_especie text) · INVOKER · sin search_path
           acl: =X/postgres, postgres, anon, authenticated, service_role   ← alcanzable por anon
  ```
- **Funciones de `pg_proc` que consultan el momento vital ANTES de actuar:** **NINGUNA medida.** `calcular_etapa_vida` es la única función de momento vital, y **cero funciones la llaman** desde otro cuerpo (no aparece en el censo de `pg_get_functiondef ilike '%etapa%'` como llamador). El único consumo medido es desde la app.
- **Wrappers de `@epetplace/api` que lo consultan:** `obtenerUmbralesMomentoVital` (usado en `apps/prestador/src/app/mascota/[mascotaId].tsx:51`) y `obtenerPerfilMascota` (devuelve `umbrales`); el cálculo lo hace `calcularMomentoVital` de `@epetplace/domain`.
- **EVIDENCIA (los tres consumidores medidos):**
  ```
  apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx:701  tieneCondicionCronica: tiene_condicion_cronica
  apps/cliente/src/components/coach.tsx:71                       tieneCondicionCronica: tiene_condicion_cronica
  apps/prestador/src/app/mascota/[mascotaId].tsx:198             tieneCondicionCronica: detalle.tiene_condicion_cronica
  ```
- **Memorial:** se deriva de `estado_vida !== 'activa'` (`coach.tsx:72` — `esMemorial: mascota.estado_vida !== null && mascota.estado_vida !== 'activa'`), y `vozMomento` devuelve `null` para M6 (`coach.tsx:56`). **Con 89/89 mascotas en `activa`, el brazo memorial nunca se ejerce con los datos vivos.**

### 1.10 Corriente de eventos y motores
**(a) Motor de alertas (3.2.5)**
- **EXISTE:** parcial — catálogo, tabla, productor y lector existen; **1 fila viva**
- **DÓNDE:** `public.cat_restricciones_servicio` (14 filas) · `public.restricciones_mascota_activas` (1 fila) · productor `_trg_sincronizar_restricciones_mascota` (trigger sobre `mascota_perfil_vigente`) · lector `obtener_alertas_activas_mascota_para_familia_servicio(p_mascota_id uuid, p_familia_servicio text)` DEFINER con `search_path` fijo
- **MEDIDO CON:** `pg_get_functiondef` del lector · `information_schema.columns` · `select count(*)` de ambas tablas · `select proname from pg_proc where pg_get_functiondef(oid) ilike '%restricciones_mascota_activas%'`
- **EVIDENCIA:**
  ```sql
  FROM restricciones_mascota_activas rma
  JOIN cat_restricciones_servicio cr ON cr.id = rma.restriccion_catalogo_id
  WHERE rma.mascota_id = p_mascota_id AND rma.familia_servicio = p_familia_servicio
    AND rma.estado = 'activa'
  -- severidades: hard_block(1) > requiere_consentimiento(2) > soft_warn(3)
  ```
  ```
  cat_restricciones_servicio: 14 filas · cols: id, country_code, familia_servicio,
    tipo_antecedente, criterio, severidad, duracion_dias, descripcion, validado, activo, ...
  restricciones_mascota_activas: 1 fila
  productores medidos: _trg_sincronizar_restricciones_mascota   (único)
  ```

**(b) Motor de revelaciones (§6.4)**
- **EXISTE:** **no**
- **DÓNDE:** `apps/cliente/src/app/(tabs)/hogar/index.tsx:170`
- **MEDIDO CON:** `select table_name from information_schema.tables where table_name ilike '%revelacion%'` (0 filas) · `select proname from pg_proc where proname ilike '%revelacion%'` (0 filas) · `grep -n "ZONA 3" apps/cliente/src/app/(tabs)/hogar/index.tsx`
- **CONTROL POSITIVO:** la misma consulta de tablas devolvió `logros`, `puntos_usuario`, `user_preferencias`, `loyalty_b2b`; la misma de `pg_proc` devolvió `calcular_etapa_vida`, `otorgar_puntos`, `obtener_alertas_activas_mascota_para_familia_servicio`.
- **EVIDENCIA:**
  ```
  apps/cliente/src/app/(tabs)/hogar/index.tsx:16   Zona 3 — en contexto: el motor de revelaciones es B4 — hueco
  apps/cliente/src/app/(tabs)/hogar/index.tsx:170  // ═══════════ ZONA 3 — EN CONTEXTO (hueco estructural) ═══════════
  ```

**(c) Motor de disparo del loyalty (LOYALTY §8)**
- **EXISTE:** **no**
- **MEDIDO CON:** `select proname from pg_proc where proname<>'otorgar_puntos' and pg_get_functiondef(oid) ilike '%otorgar_puntos%'` · el mismo patrón sobre `pg_trigger` · conteos de las 4 tablas
- **CONTROL POSITIVO:** la misma consulta por cuerpo sí encontró `_trg_sincronizar_restricciones_mascota` para `restricciones_mascota_activas`, y devolvió 12 funciones para `procedencia`.
- **EVIDENCIA:**
  ```
  callers de otorgar_puntos en pg_proc      → (NINGUNO)
  triggers que llaman otorgar_puntos        → (NINGUNO)
  logros / logros_usuario / puntos_usuario / transacciones_puntos → 18 / 2 / 1 / 4
  logros con condicion vacia                → 18 de 18
  ```

**(d) Estado de D-314 (`otorgar_puntos`)**
- **EXISTE:** parcial — **la mitad de `anon` está curada; `search_path` y la policy siguen como los describe la ficha**
- **MEDIDO CON:** `select prosecdef, proconfig, proacl from pg_proc where proname='otorgar_puntos'` · `select policyname, cmd, roles, qual from pg_policies where tablename in ('puntos_usuario','transacciones_puntos','logros_usuario','logros','loyalty_b2b')`
- **CONTROL POSITIVO:** con la misma consulta, `obtener_alertas_activas_mascota_para_familia_servicio` devolvió `cfg = search_path=public, pg_temp` — el instrumento sí sabe leer un `search_path` cuando existe.
- **EVIDENCIA:**
  ```
  otorgar_puntos · DEFINER · cfg=(sin search_path)
    acl: postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres   ← anon YA NO figura
  puntos_usuario :: pu_own | cmd=ALL | roles=authenticated | using=((user_id = auth.uid()) OR is_admin())
  transacciones_puntos :: tp_insert | cmd=INSERT | roles=authenticated
  transacciones_puntos :: tp_own   | cmd=SELECT | roles=authenticated | using=((user_id = auth.uid()) OR is_admin())
  logros_usuario :: lu_own | cmd=SELECT | roles=authenticated
  ```
- **NOTA:** `pu_own` sigue siendo `cmd=ALL`; `search_path` sigue mutable. **No emito veredicto de severidad — no es el alcance de este relevamiento.**

### 1.11 Preferencias de uso de datos (IA3 / IA4)
- **EXISTE:** **no** — ni `cliente_preferencias_uso_data` ni `recomendaciones_log`
- **MEDIDO CON:** `select table_name from information_schema.tables where table_schema='public' and table_name in ('cliente_preferencias_uso_data','recomendaciones_log','user_notificacion_prefs','user_preferencias')`
- **CONTROL POSITIVO:** la misma consulta devolvió `user_preferencias` y `user_notificacion_prefs`.
- **EVIDENCIA:**
  ```
  tabla cliente_preferencias_uso_data     → (NO EXISTE)
  tabla recomendaciones_log               → (NO EXISTE)
  CONTROL-POS user_notificacion_prefs     → user_notificacion_prefs
  cols user_preferencias: user_id, idioma, updated_at, medio_pago_preferido, tarjeta_preferida_id
  filas user_preferencias: 5
  ```
- **NOTA:** `user_preferencias` tiene idioma y medio de pago; **ninguna columna sobre uso de datos, IA o recomendaciones**.

### 1.11bis Lo más cercano que sí existe: `senales_comerciales`
- **EXISTE:** sí (estructura) · **no** (dato) — **0 filas**
- **MEDIDO CON:** `information_schema.columns` + `select count(*)`
- **EVIDENCIA:**
  ```
  cols: id, senal, visitante_id, user_id, sesion_id, ctx_especie, ctx_talla,
        ctx_momento_vital, ctx_condicion, ctx_tiene_alergias, termino_busqueda,
        producto_id, variante_id, familia_codigo, pedido_id, monto, moneda,
        country_code, ciudad, sector, motivo, detalle, version_esquema, ocurrido_en, created_at
  filas = 0
  ```
- **NOTA:** es la única tabla de la base que lleva `ctx_momento_vital` y `ctx_tiene_alergias` como contexto de una señal; nadie la escribe todavía.

### 1.12 Menores — la marca `aportado_por_menor`
- **EXISTE:** sí — la columna existe; **0 filas en `true`**
- **DÓNDE:** `public.evento_bitacora_familia.aportado_por_menor` boolean
- **MEDIDO CON:** `select table_name||'.'||column_name from information_schema.columns where column_name ilike '%menor%'` · `select count(*), count(*) filter (where aportado_por_menor) from public.evento_bitacora_familia`
- **EVIDENCIA:**
  ```
  evento_bitacora_familia.aportado_por_menor :: boolean     (única ocurrencia en todo public)
  filas=4  true=0
  ```
- **Quién la escribe:** **NULL — no lo medí.** No corrí el censo de funciones que insertan en `evento_bitacora_familia` con esa columna; lo declaro en vez de suponerlo.

### 1.13 Las mascotas de prueba — la medida de «expediente vacío»
- **EXISTE:** sí — **18 filas** con esos ocho nombres (hay homónimos: Thor ×3, Zeus ×7, Kira ×2, Bruno ×2)
- **MEDIDO CON:** `select nombre, left(id::text,8), especie, estado_vida, (fecha_nacimiento is not null), count de eventos no borrados, y el desglose por tipo` + `left join mascota_perfil_vigente`
- **EVIDENCIA (eventos por tipo, las 18 filas):**
  ```
  Thor  d2e31d70  perro  205 ev  cita_servicio=150 atencion_paseo=18 vacuna=8 historia_clinica=6
                              atencion_grooming=5 medicacion_prescrita=5 caso_clinico_abierto=3
                              peso_medicion=3 producto_asignacion=2 bitacora_familia=2
                              alergia_diagnosticada=1 atencion_adiestramiento=1 examen_diagnostico=1
  Zeus  a3332037  perro   67 ev  cita_servicio=55 atencion_paseo=9 atencion_grooming=2 adiestramiento=1
  Kira  ea96b8a4  perro   35 ev  cita_servicio=29 foto_guarderia=5 hito_narrativo=1
  Zeus  de300000  perro   19 ev  cita_servicio=9 vacuna=7 atencion_paseo=2 adiestramiento=1  (sin fecha nac)
  Thor  79930830  perro    9 ev  vacuna=8 cita_servicio=1
  Thor  8e953ce9  perro    8 ev  vacuna=8
  Nube  b59a2a4e  gato     3 ev  hito_narrativo=2 transferencia_familia=1
  Bruno 60ad35b1  perro    1 ev  hito_narrativo=1
  Bruno de820000  perro    1 ev  cita_servicio=1                                   (sin fecha nac)
  Kira  5b0a110a  perro    1 ev  hito_narrativo=1
  Luna  cbe4ee32  perro    1 ev  hito_narrativo=1
  Mica  73c381cc  gato     1 ev  hito_narrativo=1
  Tito  c9aaa1ee  perro    1 ev  hito_narrativo=1
  Zeus  4c17ccf0  perro    1 ev  hito_narrativo=1
  Zeus  5af4f1f2  perro    1 ev  cita_servicio=1
  Zeus  0ce7df92  perro    0 ev
  Zeus  e0c28888  perro    0 ev
  Zeus  e6ed9020  perro    0 ev
  Zeus  fc441d35  perro    0 ev
  ```
  (`Zeus fc441d35` cierra la lista de 7 Zeus; las 18 filas están todas arriba.)
- **EVIDENCIA (perfil vigente — `length(jsonb::text)=2` significa `[]` vacío):**
  ```
  Thor d2e31d70  peso_cl=11.4  peso_rep=23  alergias=array:188  cronicas=array:2
                 medic=array:1317  temper=object:2  chip=-  ident=2
  LAS OTRAS 17   peso_cl=-     peso_rep=-   alergias=array:2    cronicas=array:2
                 medic=array:2      temper=object:2  chip=-  ident=2
  ```
- **EVIDENCIA (el agregado sobre las 89 mascotas de la base):**
  ```
  mascotas totales                    89
  con fila en perfil_vigente          89
  con alergias no vacías               1
  con condiciones crónicas no vacías   0
  con medicación no vacía              1
  con peso clínico                     1
  con peso reportado                   5
  con microchip                        0
  con fecha_nacimiento                61
  con >=1 evento no borrado           80
  con >=1 evento CLÍNICO               6
  ```
- **NOTA:** de 89 mascotas, **6 tienen algún evento clínico y 1 tiene perfil clínico poblado**; los dos pesos de Thor `d2e31d70` divergen (clínico 11.4 kg · reportado 23 kg) y no medí cuál es correcto.

---

# PARTE 2 · EL EXPEDIENTE EN LA APP

### 2.1 Pantalla del perfil de la mascota (cliente) — secciones y wrappers
- **EXISTE:** sí
- **DÓNDE:** `apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx` — **2086 líneas**
- **MEDIDO CON:** lectura del archivo + `grep -n "RotuloSeccion titulo={t(" ` (orden por número de línea = orden vertical)
- **EVIDENCIA (secciones en orden vertical, con su línea):**
  ```
  1188  perfil.hoyTitulo      — "HOY" (celdas de estado + fila de ausencias)
  1301  perfil.identidad      — identidad progresiva
  1372  perfil.vacunas        — "Sus vacunas" (+ 1377 perfil.carnetVacio)
  1471  perfil.habitantes     — sólo sujeto=acuario (+ 1510 habitantesDeclarar)
  1523  perfil.documentos     — papeles de la mascota
  1568  perfil.suAlimento     — producto asignado
  1585  perfil.vida           — LineaDeVida paginada (1598 error · 1618 vacío · 1645 con datos)
  1820  perfil.vitales        — VITALES sobre tracks de paseo
  ```
- **EVIDENCIA (wrappers de `@epetplace/api` que la alimentan, líneas 68-88):**
  ```
  leerTimelineMascota · obtenerEstadoHogar · obtenerPaseosConTrack · obtenerPerfilMascota
  resolverUrlFoto · listarPapelesDeMascota · obtenerHistoriaPeso · obtenerRazasDeEspecie
  obtenerCensoDelAcuario · obtenerSolicitudesPendientesDueno · obtenerPresupuestosFamilia
  obtenerCitasActivasHogar
  ```
- **NOTA:** no hay sección de alergias, de condiciones crónicas, de medicación ni de desparasitación — ver 2.1bis.

### 2.1bis 🔴 Campos que el wrapper TRAE y la pantalla del perfil NO lee (regla 6 del encargo)
- **EXISTE:** el dato viaja · **no** se dibuja
- **DÓNDE:** `packages/api/src/wrappers/perfilMascota.ts` (select y return) vs `apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx:621`
- **MEDIDO CON:** lectura del select del wrapper + `grep -rn "alergias_estado\|alergias_detalle\|desparasitaciones\|tiene_condicion_cronica" apps packages/ui`
- **EVIDENCIA (el wrapper SÍ pide los tres):**
  ```ts
  // packages/api/src/wrappers/perfilMascota.ts
  .from('mascota_perfil_vigente')
  .select('peso_clinico_kg, condiciones_cronicas, tiene_emergencia_activa, alergias, alergias_ninguna_declarada_en')
  .from('evento_desparasitacion_aplicada')
  .select('producto, tipo_desparasitacion, fecha_aplicada, fecha_proxima')
  ```
- **EVIDENCIA (la pantalla destructura cinco campos y ninguno es ésos):**
  ```ts
  // [mascotaId].tsx:621
  const { mascota, vacunas, peso_clinico_kg, tiene_condicion_cronica, umbrales } = perfil;
  // :1182  — y empuja los dos a la lista de AUSENCIAS, sin condición:
  faltan.push(t('perfil.hoyDesparasitacion').toLowerCase(), t('perfil.hoyAlergias').toLowerCase());
  ```
- **EVIDENCIA (censo de consumidores en todo `apps/` + `packages/ui`):**
  ```
  alergias_estado    → apps/cliente/src/app/(tabs)/despensa/producto/[productoId].tsx:352   (SOLO despensa)
  alergias_detalle   → apps/cliente/src/app/(tabs)/despensa/producto/[productoId].tsx:353
                       apps/cliente/src/lib/despensa/composicion.ts:32
  desparasitaciones  → (NINGÚN consumidor)
  tiene_condicion_cronica → 6 hits, todos como BOOLEAN de entrada a calcularMomentoVital
  ```
- **CONTROL POSITIVO:** el mismo grep sí encontró consumidores para `alergias_estado` y `consultas_total`, así que el instrumento no está ciego.
- **NOTA:** `condiciones_cronicas` se colapsa a `tiene_condicion_cronica: boolean` **en el wrapper mismo** — el detalle no sale de `packages/api`; `alergias` sale con detalle y sólo la despensa lo lee; `desparasitaciones` sale con detalle y no lo lee nadie. `faltan.push(...)` es **incondicional**: la fila de ausencias nombra desparasitación y alergias aunque el dato exista.

### 2.2 Hogar — zonas y datos
- **EXISTE:** sí
- **DÓNDE:** `apps/cliente/src/app/(tabs)/hogar/index.tsx` — **2513 líneas**
- **MEDIDO CON:** lectura de la cabecera (líneas 1-30) + bloque de import de api (líneas 77-107)
- **EVIDENCIA (las zonas, verbatim de la cabecera):**
  ```
  Techo vivo — HeroMarca techoVivo (curva 44/26) + destello Coach.
  HERO de hoy — atención en curso (CitaEnVivo, Ley 7) o el próximo paseo...
  Tu hogar — las mascotas con su línea de estado Y su próxima cita (FichaMascotaHogar;
    voz calculada por calcularVozHogar de @epetplace/domain sobre el expediente REAL — L-139)
  GRUPO de celdas (Ley 19.1) — carnet/hub/agregar con subtítulo VIVO.
  Zona 3 — en contexto: el motor de revelaciones es B4 — hueco estructural, null honesto.
  La vida — LineaDeVida del HOGAR (merge multi-mascota por fecha).
  ```
- **EVIDENCIA (los 20 wrappers que lee, líneas 77-107):**
  ```
  getEstadoOnboardingDueno · obtenerMiPerfil · leerDetalleAtencion · leerTimelineHogar
  obtenerEstadoHogar · obtenerMisEstadiasGuarderia · obtenerMascotasDeFamilia
  obtenerMisPlanesPaseo · obtenerCitasActivasHogar · obtenerPresupuestosFamilia
  mascotasElegibles · obtenerResumenServiciosHogar · obtenerVacunaPorEvento
  obtenerSolicitudesPendientesDueno · listarMisPedidos · hayNovedades
  resolverUrlFoto · resolverUrlsFotos
  ```
- **¿El antiparasitario aparece en alguna zona?** **NO.**
- **MEDIDO CON:** `grep -rn -i "desparasit\|antiparasit" apps/cliente/src`
- **EVIDENCIA (los únicos 3 lugares del cliente, ninguno es el Hogar):**
  ```
  (tabs)/hogar/mascota/[mascotaId].tsx:1182  — como AUSENCIA en la fila de faltantes del perfil
  (tabs)/despensa/index.tsx:386-387          — como FAMILIA DE PRODUCTO ('antiparasitario')
  app/adoptar/[publicacionId].tsx:255-261    — como EJE SANITARIO del adoptable (si/no/no_se_sabe)
  ```
- **NOTA:** las tres apariciones son de tres dominios distintos (ausencia del expediente · categoría de tienda · semáforo de adopción); ninguna es un registro de desparasitación de la mascota.

### 2.3 Carnet en el cliente — qué se dibuja y el cruce con 1.3
- **EXISTE:** sí
- **DÓNDE:** `apps/cliente/src/app/(tabs)/hogar/vacunas/[mascotaId].tsx` · componente `packages/ui/src/components/FichaVacuna.tsx`
- **MEDIDO CON:** lectura del archivo + `grep -n` de los nombres de columna
- **EVIDENCIA (props que FichaVacuna sabe recibir):**
  ```
  nombre: string · veterinario?: string|null · lote?: string|null · rechazada?: boolean
  ```
- **EVIDENCIA (lo que la pantalla arma):**
  ```ts
  :110  if (v.fecha_proxima === null) return 'sinFecha';
  :111  return v.fecha_proxima >= hoyIso ? 'alDia' : 'atencion';
  :449  if (vacuna.fecha_aplicada !== null) detalle.push({ etiqueta: t('planVacunas.aplicada'), ... })
  ```
- **EVIDENCIA (el cruce, ya declarado literalmente en la cabecera del archivo):**
  ```
  :60 · `packages/api`: el select de `obtenerPerfilMascota` no trae `lote`
  :61   ni `veterinario_nombre_externo`, así que el cuerpo desplegado NO
  :62   dice "quién la aplicó" (la lámina sí). Es UNA línea de select y
  :63   esta ronda es app cliente: se declara, no se toca.
  :24 ② MEDIDO: `fecha_proxima` está poblada en **1 de 32** filas de la DB
  ```
- **CRUCE con 1.3, columna por columna:**

  | columna de `evento_vacuna_aplicada` | poblada | ¿se dibuja? |
  |---|---|---|
  | `nombre_vacuna` | 32/32 | **sí** |
  | `fecha_aplicada` | 32/32 | **sí** |
  | `fecha_proxima` | 1/32 | **sí** (y con 31 dice "sin fecha de refuerzo") |
  | `tipo_vacuna` / `vacuna_codigo` | 22/32 | **NO PUDE MEDIR** — el select los trae; no verifiqué el render |
  | `lote` | **32/32** | **NO** — el select del wrapper no lo pide |
  | `veterinario_nombre_externo` | 19/32 | **NO** — el select del wrapper no lo pide |
  | `dosis` | 0/32 | no (y no hay dato) |
  | `via_administracion` | 0/32 | no (y no hay dato) |
  | `archivo_url` | 32/32 | **NO PUDE MEDIR** — hay VisorFoto del carnet en el Hogar; no verifiqué si esta pantalla lo abre |
- **NOTA:** la pieza `FichaVacuna` **acepta `lote` y `veterinario`**; quien no los entrega es el select del wrapper. Es un campo que existe en base, existe en la pieza, y se pierde en el medio.

### 2.4 Lectura de carnet por foto (EsperaDeMarca)
- **EXISTE:** sí — **no es una espera vacía: llama a un modelo de visión**
- **DÓNDE:** `apps/cliente/src/app/carnet.tsx` → wrapper `extraerVacunasDeCarnet` → edge `extract-vacuna` (desplegada, **v64 ACTIVE**) → `https://api.anthropic.com/v1/messages`
- **MEDIDO CON:** `grep -n` en `carnet.tsx` · `grep -rn "api.anthropic.com" supabase/` · `npx supabase functions list --project-ref zyltipqscdsdsxnjclhp`
- **EVIDENCIA:**
  ```
  apps/cliente/src/app/carnet.tsx:56   extraerVacunasDeCarnet,
  apps/cliente/src/app/carnet.tsx:58   registrarVacunasDeCarnet,
  apps/cliente/src/app/carnet.tsx:188  const ext = await extraerVacunasDeCarnet({ imageBase64: base64, mediaType: 'image/jpeg' });
  apps/cliente/src/app/carnet.tsx:258  const r = await registrarVacunasDeCarnet({
  apps/cliente/src/app/carnet.tsx:338  {spinnerVisible && <EsperaDeMarca tamano={64} />}

  supabase/functions/extract-vacuna/index.ts:185  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  supabase/functions/extract-vacuna/index.ts:190  await fetch('https://api.anthropic.com/v1/messages', {
  supabase/functions/extract-vacuna/index.ts:203  // Contrato de request para Sonnet 5 (skill claude-api, S48)
  extract-vacuna · status ACTIVE · version 64 · verify_jwt true
  ```
- **EVIDENCIA (quién navega a `/carnet`, 5 puertas):**
  ```
  (tabs)/hogar/index.tsx:1405 · (tabs)/hogar/mascota/[mascotaId].tsx:1278 y :2070
  (tabs)/explorar/guarderia/index.tsx:633 · (tabs)/explorar/guarderia/[prestadorId].tsx:563
  ```
- **NOTA:** `EsperaDeMarca` también se monta en videollamada, alta de tarjeta, checkout y mostrador — no es exclusiva del carnet.

### 2.5 Coach v0 (S53)
- **EXISTE:** sí — **y NO hay ninguna llamada a un LLM en el Coach**
- **DÓNDE:** `apps/cliente/src/components/coach.tsx` (**208 líneas**) · destello y montaje en `apps/cliente/src/app/(tabs)/hogar/index.tsx:614, 627-628, 681, 1718-1719`
- **MEDIDO CON:** lectura completa del archivo · `grep -rn "Coach" apps/cliente/src/app` · `grep -rn "api.anthropic.com" ...` (0 hits en `apps/`)
- **`obtenerPerfilMascota` — firma y retorno:**
  ```ts
  // packages/api/src/wrappers/perfilMascota.ts:120
  export async function obtenerPerfilMascota(
    mascotaId: string,
  ): Promise<ResultadoWrapper<PerfilMascota, 'error_perfil' | 'sin_acceso'>>
  ```
  `PerfilMascota` = `{ mascota, vacunas[], paseos_total, ultimo_paseo_fecha, peso_clinico_kg, tiene_condicion_cronica, tiene_emergencia_activa, umbrales, alergias_estado, alergias_detalle, alergias_ninguna_declarada_en, desparasitaciones[], consultas_total }`
- **Las plantillas — dónde viven y cuántas: TRES**, en `coach.tsx:62-92`, función `responder(pregunta, perfil, t, idioma)`, tipo `Pregunta = 'edad' | 'carnet' | 'actividad'`:
  ```ts
  if (meses === null) return t('coach.rEdadSinFecha');
  return vozM !== null ? t('coach.rEdad', {nombre, edad, momento}) : t('coach.rEdadSinMomento', {...});
  if (vacunas.length === 0) return t('coach.rCarnetVacio');
  return vacunas.length === 1 ? t('coach.rCarnetUna', {vacuna}) : t('coach.rCarnet', {n, vacuna});
  if (paseos_total === 0) return t('coach.rActividadVacia');
  return paseos_total === 1 ? t('coach.rActividadUno', {fecha}) : t('coach.rActividad', {n, fecha});
  ```
- **La activación por mérito — condición literal:** **NO ESTÁ IMPLEMENTADA.** El archivo lo declara:
  ```
  coach.tsx:10  * por mérito (§6: presentarse al cerrar la carga del carnet) queda
  coach.tsx:11  * ANOTADA para cuando el Coach conteste de verdad.
  ```
  El montaje real es un toque manual: `hogar/index.tsx:1718  onPress={() => setCoachAbierto(true)}`
- **El apagado por memorial — dónde consulta el momento vital, literal:**
  ```ts
  coach.tsx:72   esMemorial: mascota.estado_vida !== null && mascota.estado_vida !== 'activa',
  coach.tsx:56   case 'M6': return null;      // vozMomento devuelve null para M6
  ```
- **¿Hay hoy alguna llamada a un LLM en el Coach?** **NO.** Medido: `coach.tsx` importa `obtenerPerfilMascota` y nada más de red; `grep "api.anthropic.com"` sobre `apps/` devuelve 0 hits (control positivo: el mismo grep sobre `supabase/functions/` devuelve 6).

### 2.6 Dictado clínico del prestador
- **EXISTE:** sí — **ASR EN DISPOSITIVO, sin proveedor de nube**
- **DÓNDE:** `apps/prestador/src/components/dictado-en-vivo.tsx` · montado en `apps/prestador/src/app/veterinaria/consulta/[citaId].tsx:659` y `apps/prestador/src/app/videollamada/[citaId].tsx:1093`
- **MEDIDO CON:** `grep -rn "expo-speech-recognition"` · `grep -rn "speech" apps/*/package.json` · `grep -n` en la pantalla de consulta
- **EVIDENCIA:**
  ```
  apps/prestador/package.json:35   "expo-speech-recognition": "56.0.1",
  dictado-en-vivo.tsx:51  let speech: typeof import('expo-speech-recognition') | null = null;
  dictado-en-vivo.tsx:54    speech = require('expo-speech-recognition');
  ```
- **Proveedor de ASR y nombre de env:** `expo-speech-recognition` 56.0.1, **on-device**. **No hay env de ASR** — el censo de `Deno.env.get` en `supabase/functions` no devuelve ninguna clave de voz (ver 3.3); control positivo: sí devuelve `ANTHROPIC_API_KEY`, `LIVEKIT_API_KEY`, `RESEND_API_KEY`.
- **Qué oficio lo tiene:** **sólo veterinaria** (consulta + videollamada del prestador). Declarado en `apps/prestador` únicamente; `apps/cliente/package.json` no lo trae.
- **Cómo entra al expediente:**
  ```
  veterinaria/consulta/[citaId].tsx:52   estructurarNotaClinica,   → :323  await estructurarNotaClinica({...})
  veterinaria/consulta/[citaId].tsx:60   sedimentarNotaClinica,    → :477  await sedimentarNotaClinica({...})
  ```
  `estructurarNotaClinica` → edge `estructurar-nota-clinica` (**ACTIVE v41**, `claude-sonnet-5`, `max_tokens: 16000`) → `sedimentarNotaClinica` → RPC `sedimentar_nota_clinica`.
- **🔴 Procedencia y captura declaradas — CRUCE con 1.1:**
  ```
  sedimentar_nota_clinica nombra modo_captura → NO
  sedimentar_nota_clinica nombra procedencia  → NO
  ```
- **NOTA:** el tipo de evento es `historia_clinica_registrada` (`es_clinico=true`), así que `_trg_eventos_procedencia_clinica` **exige** procedencia — la pone algún llamador aguas arriba, no la RPC. **`modo_captura` queda NULL**: una nota dictada y una tecleada entran indistinguibles, aunque el CHECK tenga el valor `'dictado'` disponible. Los 2 únicos `modo_captura` no nulos de la base son `'automatico'` y vienen de despensa.

### 2.7 Exportar o imprimir el expediente
- **EXISTE:** sí — **cinco papeles PDF server-side + una exportación de datos del usuario**
- **DÓNDE:** `supabase/functions/documento-{carnet,historia-clinica,receta,ficha-identidad,certificado}` · `apps/cliente/src/app/(tabs)/cuenta/exportar.tsx` · tabla `public.exportacion_datos`
- **MEDIDO CON:** `supabase functions list` · `grep -n "Content-Type"` · `select ... from public.cat_documentos_mascota` · `grep -rn "pdf-lib|pdfkit|jspdf|react-pdf|puppeteer"`
- **EVIDENCIA:**
  ```
  documento-carnet/index.ts:195   'Content-Type': 'application/pdf',
  cat_documentos_mascota (5 filas, todas activo=true):
    carnet_vacunas   -> documento-carnet
    historia_clinica -> documento-historia-clinica
    receta           -> documento-receta
    ficha_identidad  -> documento-ficha-identidad
    certificado_salud-> documento-certificado
  cuenta/exportar.tsx:27   import { exportarMisDatos } from '@epetplace/api';
  exportacion_datos: cols id, user_id, solicitada_en, estado, archivo_path, enviado_a,
                           enviada_en, expira_en, motivo_fallo · filas = 1
  ```
- **¿Hay librería de PDF en el monorepo?** **NO.** `grep -rn "pdf-lib\|pdfkit\|jspdf\|react-pdf\|puppeteer"` sobre `package.json` raíz, `apps/*/package.json`, `packages/*/package.json` y `supabase/functions/*/deno.json` → **0 hits**. Control positivo: el mismo tipo de grep sí encontró `expo-speech-recognition` en `apps/prestador/package.json`. El PDF se compone en `supabase/functions/_shared/papel.ts` (importa `MX, Papel, TINTA_65, fechaLarga`) — **NO PUDE MEDIR** con qué primitiva lo emite; no leí ese archivo.
- **NOTA del propio código (alcance del carnet):**
  ```
  documento-carnet/index.ts:20  Alcance v1 declarado EN EL PAPEL: es el carnet DE VACUNAS (la
  documento-carnet/index.ts:21  desparasitación no existe en el motor — D-476).
  ```

### 2.8 Vista pública por token
- **EXISTE:** parcial — **hay infraestructura de token de un solo uso para PAPELES; no hay ruta pública read-only del expediente de una mascota**
- **DÓNDE:** RPC `public.emitir_token_documento` · tabla `public.documento_token` (**54 filas**) · edges `documento-*` con `verify_jwt: false`
- **MEDIDO CON:** `select proname from pg_proc where proname ilike '%documento%'` · `information_schema.columns` de `documento_token` · `supabase functions list` · `ls apps/cliente/src/app/`
- **EVIDENCIA:**
  ```
  documento_token cols: id, user_id, mascota_id, tipo, expira_en, usado_en, created_at, ref_id, folio
  documento_token filas: 54
  emitir_token_documento acl: postgres=X, authenticated=X, service_role=X   (anon NO)
  documento-carnet · verify_jwt: false · ACTIVE v42
  ```
  ```
  documento-carnet/index.ts:11  LA PUERTA: token quemable de un solo uso (10 min), emitido por RPC
  documento-carnet/index.ts:12  autenticada con el gate de acceso a la mascota... El JWT
  documento-carnet/index.ts:14  jamás viaja en la URL; esta función corre con --no-verify-jwt y EL TOKEN
  documento-carnet/index.ts:15  ES LA AUTORIZACIÓN — validado y quemado en el mismo acto.
  ```
- **Links compartibles / vitrina / adopción — nombres reales:**
  ```
  obtener_adoptables   anon=true    ← la vidriera pública de adopción
  obtener_adoptable    anon=true    ← la ficha pública de un adoptable
  _objeto_es_portada_de_adoptable  anon=true
  (los otros 15 de adopción/vitrina: anon=false)
  rutas: apps/cliente/src/app/adoptar.tsx · adoptar/[publicacionId].tsx · adoptar/refugio/[cuentaId].tsx
  ```
- **EVIDENCIA (la vista `v_adoptables_publicos`, re-medida con el instrumento correcto):**
  ```
  has_table_privilege('anon','public.v_adoptables_publicos','SELECT')          = false
  has_table_privilege('authenticated','public.v_adoptables_publicos','SELECT') = false
  has_table_privilege('anon','public.v_adoptables_publicos','INSERT')          = true
  CONTROL: eventos_mascota  anon SELECT=true · anon INSERT=true · auth SELECT=true
  ```
- **NOTA:** la primera lectura de esto la hice con `information_schema.role_table_grants`, que devolvió una lista rara (INSERT/UPDATE sin SELECT); **la re-medí con `has_table_privilege` antes de reportar**. La vitrina pública no pasa por la vista sino por las dos RPC con `anon=true`. **No emito veredicto sobre el `INSERT=true` — es privilegio de tabla, no medí RLS detrás, y no es el alcance de este relevamiento.**
- **Ruta pública read-only de una MASCOTA:** **no existe.** El único camino no-sesión que devuelve datos de una mascota es un papel PDF con token quemable de 10 minutos.

### 2.9 Briefing del prestador (A3.7)
- **EXISTE:** sí — **y modula por AUTOR, no por oficio**
- **DÓNDE:** `apps/prestador/src/app/mascota/[mascotaId].tsx` (**447 líneas**) · wrapper `packages/api/src/wrappers/expedienteModulado.ts` → RPC `obtener_expediente_modulado`
- **MEDIDO CON:** lectura del archivo (imports líneas 46-58) · `grep -n -i "oficio\|tipo_servicio\|familia_servicio"` en la pantalla · lectura del wrapper
- **EVIDENCIA (los 7 wrappers que alimentan la pantalla):**
  ```
  caraDeMascota · obtenerDetalleMascotaPrestador · obtenerExpedienteModulado
  obtenerFamiliaDeMascota · obtenerMiPrestador · obtenerUmbralesMomentoVital · resolverUrlFoto
  ```
- **EVIDENCIA (los tres niveles, del tipo):**
  ```ts
  export type NivelAporte =
    | 'detalle'     // Es MÍO — contenido completo
    | 'existencia'  // De OTRO prestador — existe y quién, sin contenido
    | 'familia'     // De la FAMILIA — fuera de la modulación, con contenido
  datos: nivel === 'existencia' ? null : (f.datos ?? null),
  ```
- **EVIDENCIA (qué ve, de la cabecera del archivo):**
  ```
  identidad ✓ (mascotas_select_prestador_con_acceso), señales de cuidado ✓
  (perfil_vigente/vacunas vía user_tiene_acceso_a_mascota), historial SOLO con
  este prestador ✓ — y la FAMILIA HUMANA **YA SÍ** (S85-C29)... **Lo que NO
  cambió y sigue rigiendo: cero datos de contacto por esta vía** (§6.4.5).
  Las 5 dimensiones de identidad personal son D-110 (sin UI aún).
  ```
- **🔴 `mascota_acceso_prestador.oficio` — EXISTE: no**
- **MEDIDO CON:** `select column_name from information_schema.columns where table_schema='public' and table_name='mascota_acceso_prestador'`
- **CONTROL POSITIVO:** la misma consulta devolvió 13 columnas de esa tabla, y `select count(*)` devolvió **30 filas** — la tabla existe y tiene datos.
- **EVIDENCIA:**
  ```
  cols: id, mascota_id, cuenta_comercial_id, otorgado_en, otorgado_por_user_id,
        metodo_otorgamiento, expira_en, revocado_en, revocado_por_user_id,
        motivo_revocacion, audit_log, created_at, updated_at
  filas: 30
  grep -i "oficio|tipo_servicio|familia_servicio" en la pantalla → 0 hits
  ```
- **NOTA:** el acceso se otorga **por cuenta comercial**, no por oficio; la modulación del expediente es por autoría (mío / de otro / de la familia). El cruce que pedía el encargo no se puede hacer: esa columna no existe.

---

# PARTE 3 · LA INFRAESTRUCTURA QUE D Y E VAN A NECESITAR

### 3.1 `packages/*` reales
- **EXISTE:** sí — 6 paquetes · **ninguno de IA**
- **MEDIDO CON:** `for d in packages/*/; do ... done` con `package.json.description` y conteo de `.ts`/`.tsx` en `src/`
- **EVIDENCIA:**
  ```
  api            116 archivos  Tipos generados de Supabase + wrappers tipados con discriminated
                               unions (puerta única a la DB)
  cuadro-video     1 archivo   (sin description)
  domain          10 archivos  Helpers puros de dominio (periodo, validaciones, strings, países/servicios)
  i18n            10 archivos  Riel i18n del ecosistema: instancia única, detección de locale,
                               persistencia en dispositivo y keys tipadas exigibles
  mensajeria       7 archivos  La ley del canal interno... Dominio PURO — sin Supabase, sin UI
  ui             186 archivos  Design system: tokens, componentes, motion
  ```
- **¿Existe ya algo de IA (packages/ia, librería de prompts, cliente de LLM)?** **NO.**
- **MEDIDO CON:** `ls -d packages/*ia* packages/*ai* packages/*prompt*` → sin coincidencias
- **CONTROL POSITIVO:** el mismo `ls -d packages/*/` sí lista los 6 de arriba.
- **NOTA:** los prompts viven **dentro de cada edge function**, no en un paquete compartido.

### 3.2 Edge functions y llamadas a proveedores externos de IA
- **EXISTE:** sí — **35 en el repo, 33 desplegadas, 4 de ellas llaman a Anthropic**
- **MEDIDO CON:** `ls -1 supabase/functions/` · `npx supabase functions list --project-ref zyltipqscdsdsxnjclhp` · `grep -rn "api.anthropic.com|api.openai.com|generativelanguage|api.deepgram|api.elevenlabs|bedrock" supabase/ packages/ apps/`
- **EVIDENCIA (los hits de proveedor, archivo y línea):**
  ```
  supabase/functions/extract-documento/index.ts:151        fetch('https://api.anthropic.com/v1/messages'
  supabase/functions/escribir-presencia/index.ts:307       fetch('https://api.anthropic.com/v1/messages'
  supabase/functions/extract-vacuna/index.ts:190           fetch('https://api.anthropic.com/v1/messages'
  supabase/functions/estructurar-nota-clinica/index.ts:197 fetch('https://api.anthropic.com/v1/messages'
  supabase/functions/chat-ayuda/index.ts:178               fetch('https://api.anthropic.com/v1/messages'
  supabase/functions/chat-ayuda/RESCATE.md:30              (documentación, no código)
  ```
- **EVIDENCIA (modelo y env por función):**
  ```
  extract-vacuna            ANTHROPIC_API_KEY · Sonnet 5 (contrato S48) · desplegada ACTIVE v64
  extract-documento         ANTHROPIC_API_KEY · model 'claude-sonnet-5' · max_tokens 4000  · ACTIVE v31
  estructurar-nota-clinica  ANTHROPIC_API_KEY · model 'claude-sonnet-5' · max_tokens 16000 · ACTIVE v41
  escribir-presencia        ANTHROPIC_API_KEY · model 'claude-sonnet-5' · max_tokens 4000  · ACTIVE v40
  chat-ayuda                ANTHROPIC_API_KEY · model 'claude-haiku-4-5-20251001' · max_tokens 400
                            → 🔴 NO FIGURA en el listado de desplegadas
  ```
- **CONTROL POSITIVO del listado:** el mismo `functions list` sí devolvió las otras 33 con `status ACTIVE`, incluidas las cuatro de IA — el instrumento no está ciego.
- **NOTA:** `chat-ayuda` tiene **fuente en el repo y no está desplegada** (CLAUDE.md registra su borrado en S92-bis por D-717). **Ningún proveedor de IA que no sea Anthropic** aparece en el monorepo: OpenAI, Google, Deepgram, ElevenLabs y Bedrock dan 0 hits.

### 3.3 Variables de entorno declaradas — SOLO nombres
- **EXISTE:** sí
- **MEDIDO CON:** `find . -name '.env.example' -not -path '*/node_modules/*'` (**0 archivos**) · `grep -rho "Deno\.env\.get(['\"][A-Z_0-9]*" supabase/functions | sort -u`
- **EVIDENCIA (26 nombres, ningún valor):**
  ```
  ANTHROPIC_API_KEY · AVISOS_EMAIL · DESPACHO_SECRET
  DEUNA_API_KEY · DEUNA_API_SECRET · DEUNA_BASE_URL · DEUNA_POINT_OF_SALE
  DEUNA_WEBHOOK_SECRET · DEUNA_WEBHOOK_SECRET_SIGUIENTE
  FCM_SERVICE_ACCOUNT · GOOGLE_PLACES_API_KEY · INVITACION_CORREO_VIVO · LIMITE_SALT
  LIVEKIT_API_KEY · LIVEKIT_API_SECRET · LIVEKIT_URL
  NUVEI_APP_CODE_SERVER · NUVEI_APP_KEY_CLIENT · NUVEI_APP_KEY_SERVER
  PAGOS_AMBIENTE · PAGOS_ORIGENES_PERMITIDOS · RESEND_API_KEY
  SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY · SUPABASE_URL · URL_APP_BASE
  ```
- **NOTA:** **no existe ningún `.env.example` en el repo** — los nombres salen del código. Sólo hay UNA env de IA: `ANTHROPIC_API_KEY`, compartida por las cuatro (cinco con `chat-ayuda`) funciones.

### 3.4 La puerta única
- **EXISTE:** sí (la capa) · **no** (el gate que la vigila)
- **DÓNDE:** `packages/api` — `getClient` exportado en `packages/api/src/index.ts:5`
- **MEDIDO CON:** `grep -rn "\.from(" apps/*/src | grep -o "[A-Za-z_]*\.from(" | sort | uniq -c` · `grep -rn "\.rpc(" apps/*/src` · `grep -rn "createClient" apps/*/src` · lista de scripts de `package.json`
- **EVIDENCIA:**
  ```
  packages/api/src/index.ts:5
    export { initApi, getClient, type EpetplaceClient, type OpcionesApi, type StorageSesion } from './client';

  .from( en apps/ :  9 Array.from(  ·  14 storage.from(  ·  1 supabase.from(
  .rpc( en apps/  :  0
  createClient en apps/ : 0 hits
  ```
  El único `supabase.from(` es **un comentario**, no código:
  ```
  apps/cliente/src/app/(tabs)/pedidos/serie/[serieId].tsx:51
    * territorio de A. *Escribir un `supabase.from('pedidos_recurrencias')` acá
  ```
  Los 14 `storage.from(` son sobre el cliente de la puerta:
  ```
  apps/cliente/src/lib/subir-avatar.ts:82    .storage.from(BUCKET)
  apps/cliente/src/lib/subir-avatar.ts:105   getClient().storage.from(BUCKET).remove([path])
  apps/cliente/src/lib/url-galeria.ts:28     getClient().storage.from(BUCKET_GALERIA).getPublicUrl(path)
  ```
- **Cómo está construida:** capa de wrappers en `@epetplace/api` con `ResultadoWrapper<T>` (discriminated union) sobre PostgREST/RPC; las apps consumen wrappers y, para Storage, `getClient().storage` directo.
- **¿Existe el gate que impide saltarla?** **NO.** Ninguno de los 23 scripts `verify:*`/`proximo:*` del `package.json` mide `.from(` ni `.rpc(` en `apps/`. **CONTROL POSITIVO:** sí existen gates con nombre y archivo para otras clases (`verify:jornada-completa`, `verify:razon-muda`, `verify:hoisting-nativo` — ver 3.7). **NOTA:** la puerta se cumple hoy **por disciplina medida en 0**, no por un instrumento.

### 3.5 Telemetría y costo
- **EXISTE:** **no**
- **MEDIDO CON:** `grep -rn "Sentry\|captureException\|bugsnag" apps packages supabase` · por función de IA: `grep -c "\.insert(\|\.from(" supabase/functions/<f>/index.ts` · `grep -rn "usage\|input_tokens\|output_tokens"` en las dos funciones más grandes · `select table_name from information_schema.tables where table_name ilike '%_log%' or ... '%telemetr%' or ... '%error%'`
- **CONTROL POSITIVO:** `grep -c "\.from(" supabase/functions/despachar-push/index.ts` → **7** (una edge que sí escribe). La consulta de tablas sí devolvió `audit_log`, `prestador_atencion_log`, `wearable_telemetry`.
- **EVIDENCIA:**
  ```
  inserts/escrituras en las 4 funciones de IA:
    extract-vacuna 0 · extract-documento 0 · estructurar-nota-clinica 0 · escribir-presencia 0
  usage / input_tokens / output_tokens en extract-vacuna y estructurar-nota-clinica → 0 hits
  tablas de log encontradas: wearable_telemetry, v_dashboard_logistico, audit_log,
                             logros, logros_usuario, prestador_atencion_log
  Sentry / captureException / bugsnag en apps y packages → 0 hits de CÓDIGO
  ```
- **EVIDENCIA (los únicos hits son prosa que declara la ausencia):**
  ```
  apps/cliente/src/components/pantalla-caida.tsx:57  LADO.** A lo censó por cuatro vías, todas en cero — sin Sentry/Bugsnag/
  apps/cliente/src/components/pantalla-caida.tsx:59  `captureException` en ningún wrapper, sin edge de telemetría.
  apps/prestador/src/components/pantalla-caida.tsx:66 (el mismo texto)
  apps/pagos-web/README.md:17  (prohíbe error-tracking que capture el DOM, por PCI)
  ```
- **NOTA (D-1008):** medido — **cero telemetría de errores y cero registro de uso de IA**. Las cuatro funciones de IA son sin estado: no escriben ninguna fila, no guardan el `usage` de la respuesta. No hay forma de saber cuántas llamadas, cuántos tokens ni cuánto costaron.

### 3.6 `hoy_local()`
- **EXISTE:** sí
- **DÓNDE:** `public.hoy_local()` — SQL, STABLE, `search_path` fijo
- **MEDIDO CON:** `pg_get_functiondef` · `select count(*) from pg_proc where proname<>'hoy_local' and pg_get_functiondef(oid) ilike '%hoy_local(%'` · el mismo censo con `%America/Guayaquil%`
- **EVIDENCIA:**
  ```sql
  CREATE OR REPLACE FUNCTION public.hoy_local()
   RETURNS date LANGUAGE sql STABLE SET search_path TO 'public', 'pg_temp'
  AS $function$ SELECT (now() AT TIME ZONE 'America/Guayaquil')::date $function$
  ```
  ```
  funciones que LLAMAN a hoy_local()                : 26
  funciones con el literal 'America/Guayaquil'      : 62
  ```
- **NOTA:** sólo medido (D-1007 no es de S113). El número del canon dice 58; **medí 62** — el canon está una medición atrás, o mide otra cosa. No lo resuelvo acá.

### 3.7 Los `verify:*` y gates del `package.json` — tabla script → archivo
- **EXISTE:** sí — 23 scripts, **los 23 con archivo presente**
- **MEDIDO CON:** `node -e` leyendo `package.json.scripts` y `fs.existsSync` de la ruta extraída
- **EVIDENCIA:**

  | script | archivo | ¿existe? |
  |---|---|---|
  | `verify:contrast` | `scripts/verify-contrast.ts` | EXISTE |
  | `verify:diseno` | `scripts/verify-diseno.mjs` | EXISTE |
  | `verify:censo` | `scripts/verify-censo.mjs` | EXISTE |
  | `proximo:migracion` | `scripts/proximo-numero-migracion.mjs` | EXISTE |
  | `proximo:ficha` | `scripts/proximo-numero-ficha.mjs` | EXISTE |
  | `verify:huellas` | `scripts/verify-huellas-credenciales.mjs` | EXISTE |
  | `verify:frenos` | `scripts/verify-frenos-por-sujeto.mjs` | EXISTE |
  | `verify:migraciones` | `scripts/verify-migraciones.mjs` | EXISTE |
  | `verify:edge-deno` | `scripts/verify-edge-deno.mjs` | EXISTE |
  | `verify:voz-por-tipo` | `scripts/verify-voz-por-tipo.mjs` | EXISTE |
  | `verify:ref-antes-de-uso` | `scripts/verify-ref-antes-de-uso.mjs` | EXISTE |
  | `verify:mis-hilos-realtime` | `scripts/verify-s112a-mis-hilos-realtime.mjs` | EXISTE |
  | `verify:d485-familia-lee` | `scripts/verify-s112a-d485-familia-lee.mjs` | EXISTE |
  | `verify:rutas-de-aviso` | `scripts/verify-rutas-de-aviso.mjs` | EXISTE |
  | `verify:jornada-completa` | `scripts/verify-jornada-completa.mjs` | EXISTE |
  | `verify:sin-byte-nul` | `scripts/verify-sin-byte-nul.mjs` | EXISTE |
  | `verify:mensajeria` | `scripts/verify-mensajeria.mjs` | EXISTE |
  | `verify:rebote-lleva-id` | `scripts/verify-rebote-lleva-id.mjs` | EXISTE |
  | `verify:razon-muda` | `scripts/verify-razon-muda.mjs` | EXISTE |
  | `verify:hoisting-nativo` | `scripts/_censo-hoisting-nativo.mjs` | EXISTE |
  | `verify:vio-todo` | `scripts/verify-vio-todo.mjs` | EXISTE |
  | `verify:fila-memoizada` | `scripts/verify-fila-memoizada.mjs` | EXISTE |
  | `verify:abanico` | `scripts/verify-abanico.mjs` | EXISTE |
- **NOTA:** dos nombres de script no coinciden con el nombre del gate — `verify:hoisting-nativo` → `_censo-hoisting-nativo.mjs` (prefijo `_`, nombre de censo) y los dos `verify-s112a-*`. **No corrí ninguno de los 23**: este relevamiento no ejecuta gates.

---

# CIERRE

## Tabla resumen

| ítem | qué | EXISTE |
|---|---|---|
| 1.1 | `eventos_mascota` + `procedencia` + `modo_captura` (D-753) | **sí** |
| 1.1bis | dato real en `procedencia` / `modo_captura` | **parcial** (2 de 566 con captura) |
| 1.1ter | trigger que exige procedencia / escritores de captura | **sí** / **parcial** (2, ninguno clínico) |
| 1.2 | `cat_tipos_evento` + conteo por tipo | **sí** (62 tipos, 44 con n=0) |
| 1.3 | `evento_vacuna_aplicada` | **sí** · marca/laboratorio **no** · vencimiento del biológico **no** · vía **sí, 0 poblada** · próxima dosis **sí, 1/32** |
| 1.3bis | `cat_vacunas` / `cat_plan_vacunal` | **sí** (7 / 9 filas) |
| 1.4 | antiparasitario modelado | **parcial** — tipo+tabla+trigger, **0 filas**; «tipo de plaga» **no** en el evento, **sí** en `producto_ficha_dosificacion.espectro` (143) |
| 1.5 | `mascota_perfil_vigente` + propagadores | **sí** (7 triggers de propagación; vacunas sin propagador) |
| 1.6 | CUIDADO ESPECIAL en schema / api / pantalla | **no · no · no** (la letra sí existe) |
| 1.7 | peso y su fuente | **sí** (7 filas; distingue método, no oficio) |
| 1.8 | buckets, tabla de adjuntos, tipos con adjunto | **sí** (14 buckets) · **policies NO PUDE MEDIR** |
| 1.9 | momento vital y memorial | **parcial** — no es columna, se calcula; **0 funciones de pg lo consultan** |
| 1.10a | motor de alertas | **parcial** (catálogo 14, productor, lector; 1 fila viva) |
| 1.10b | motor de revelaciones | **no** |
| 1.10c | motor de disparo del loyalty | **no** (18 logros con condición vacía, 0 callers) |
| 1.10d | D-314 | **parcial** (anon revocado · `search_path` mutable · `pu_own` sigue ALL) |
| 1.11 | preferencias de uso de datos / `recomendaciones_log` | **no** |
| 1.11bis | `senales_comerciales` | **sí** estructura · **0 filas** |
| 1.12 | `aportado_por_menor` | **sí** (0 en true) · **quién la escribe: NO MEDIDO** |
| 1.13 | expediente de las mascotas de prueba | **sí, medido** — 1 de 18 con expediente real |
| 2.1 | perfil de la mascota (cliente) | **sí** (8 secciones) |
| 2.1bis | campos que viajan y no se dibujan | **sí, medido** — alergias/desparasitación/crónicas |
| 2.2 | Hogar y sus zonas | **sí** · antiparasitario **no aparece** |
| 2.3 | carnet: campos dibujados vs columnas | **parcial** — `lote` y `veterinario` existen y no viajan |
| 2.4 | lectura de carnet por foto | **sí** — llama a Sonnet 5, no es espera vacía |
| 2.5 | Coach v0 | **sí** · 3 plantillas · **LLM: no** · activación por mérito **no** |
| 2.6 | dictado clínico | **sí** — ASR en dispositivo · **procedencia y captura NO declaradas** |
| 2.7 | exportar / imprimir | **sí** (5 papeles PDF + exportación) · **librería de PDF: no** |
| 2.8 | vista pública por token | **parcial** — token de papel sí; expediente público **no** |
| 2.9 | briefing del prestador | **sí** · modula por autor · **`.oficio` no existe** |
| 3.1 | `packages/*` | **sí** (6) · **IA: no** |
| 3.2 | edges y proveedores de IA | **sí** — 33 desplegadas, 4 con Anthropic; `chat-ayuda` con fuente y **sin desplegar** |
| 3.3 | nombres de env | **sí** (26) · **`.env.example`: no existe** |
| 3.4 | puerta única | **sí** la capa · **no** el gate |
| 3.5 | telemetría y costo | **no** |
| 3.6 | `hoy_local()` | **sí** — 26 llamadores, 62 funciones con el literal |
| 3.7 | tabla script → archivo | **sí** — 23/23 presentes |

## «No pude medir» — con su razón exacta

1. **1.8 · policies de los buckets de storage** — no corrí `pg_policies` sobre `storage.objects`. Medí nombre, visibilidad, límite de tamaño y mimes; las policies no.
2. **1.12 · quién escribe `aportado_por_menor`** — no corrí el censo de funciones que insertan en `evento_bitacora_familia` nombrando esa columna.
3. **2.3 · si `tipo_vacuna`/`vacuna_codigo` y `archivo_url` se renderizan** — el select los trae; no verifiqué el árbol de render de la pantalla de vacunas.
4. **2.7 · con qué primitiva se emite el PDF** — confirmé `Content-Type: application/pdf` y que no hay librería de PDF en ningún `package.json`/`deno.json`; no leí `supabase/functions/_shared/papel.ts`.
5. **2.8 · el `INSERT=true` de `anon` sobre `v_adoptables_publicos`** — medido como privilegio de tabla; **no medí la RLS detrás**, así que no digo si es alcanzable ni si es un problema.
6. **3.6 · la divergencia 58 vs 62** — medí 62 funciones con el literal `America/Guayaquil`; el canon dice 58. No investigué de dónde sale la diferencia.

## Lo que NO hice

- **No escribí fuera de este archivo.** El único archivo tocado es `docs/loop/S113-RELEVAMIENTO.md`, **sin commit**.
- **No migré.** Cero DDL, cero DML. Todas las consultas a la base fueron `SELECT` sobre catálogos y tablas.
- **No arreglé nada.** Ni el `lote` que no viaja, ni el `faltan.push` incondicional, ni `modo_captura` en el dictado.
- **No propuse nada.** No hay recomendaciones, ni prioridades, ni plan.
- **No corrí ningún gate** de los 23 de 3.7.
- **No emití veredicto de seguridad** sobre D-314 ni sobre el privilegio de `anon` en 2.8.

## SHA y hora de cierre

- **SHA:** `441015cc` (`441015cc4e566f9f9aa37de428454d68136ca2a2`), rama `main`
- **Árbol al cerrar:** limpio salvo este archivo, sin trackear
- **Proyecto medido:** `zyltipqscdsdsxnjclhp`
- **Hora de cierre:** **2026-09-03 20:41 -05**
