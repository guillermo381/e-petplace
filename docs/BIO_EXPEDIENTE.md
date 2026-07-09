# BIO_EXPEDIENTE — Modelo conceptual del expediente unificado de mascotas

> Versión: v0.7
> Repo: https://github.com/guillermo381/e-petplace-prestadores
> Audiencia: founder + Claude (web y code) en sesiones futuras + cualquier dev del proyecto.
> Última actualización: 15 Mayo 2026 — Sesión 19. **Fase G ejecutada**: alta asistida cliente+mascota end-to-end. Tabla nueva `cliente_pendiente_registro` + 3 RPCs SECURITY DEFINER (`buscar_cliente_por_email`, `crear_alta_asistida_pendiente`, `crear_alta_asistida_existente`) + trigger `_trg_completar_pendiente_registro` sobre `profiles` + cleanup pg_cron diario. D-166 mitigada vía REVOKE INSERT/UPDATE/DELETE de `mascota_perfil_vigente` (defense-in-depth). D-128 Fase H verificada cerrada. Bloque 9: 7 de 11 fases ejecutadas.

---

## Propósito

Este documento es el contrato técnico-conceptual del **Bio-Expediente de mascotas** — el activo central de e-PetPlace.

El Bio-Expediente es la **timeline unificada de todos los eventos relevantes de la vida de una mascota**, contribuida por múltiples actores (vets, paseadores, hoteles, grooming, sellers, dueño, wearables, etc), propiedad del dueño, gestionada por e-PetPlace, y eventualmente alimentadora de un motor de IA.

Este documento define los principios, actores, eventos, estructura, acceso/permisos, y uso futuro (IA + monetización). Es el documento al que TODOS los sistemas de e-PetPlace deben referirse cuando toquen data de la mascota.

Análogo a `MODELO_FINANCIERO.md` que define el modelo financiero del marketplace.

---

## Principios fundacionales

Son **invariantes del sistema**. Las decisiones técnicas deben respetar estos principios. Si una decisión los rompe, hay que cuestionarla o cambiar el principio explícitamente.

### P1 — e-PetPlace es ecosistema, no software vertical

e-PetPlace NO es "software para veterinarios" o "software para paseadores". Es **ecosistema centrado en el bio-expediente unificado de la mascota**. Los vets, paseadores, hoteles, etc, son **contribuyentes** al ecosistema, no clientes del software.

Implicación: el modelo de data está diseñado para ser **horizontal** (eventos genéricos) en lugar de vertical (tablas específicas por profesión).

### P2 — Cliente es propietario de su data

El **pet parent (cliente)** es propietario de la data del bio-expediente de su mascota. e-PetPlace tiene **licencia de uso** vía TyC (incluye: operar plataforma, alimentar IA, generar insights agregados).

El **prestador es contribuyente, no propietario**. Aporta eventos al expediente cuando atiende a la mascota.

Si el cliente cierra cuenta, el prestador pierde acceso al expediente — salvo un **log inmutable mínimo** que el prestador retiene para cumplimiento legal (qué hizo, cuándo, en qué mascota identificada por pet_hash sin PII).

### P3 — Modelo evento-céntrico, no actor-céntrico

Una cuenta comercial puede tener **múltiples roles** (ej: clínica vet que también vende suplementos = prestador + seller). Lo que define el evento NO es el actor, es la **naturaleza del evento**.

Implicación: los tipos de evento son horizontales. Las policies/RLS definen qué tipo de actor puede crear qué tipo de evento.

### P4 — Modelo C híbrido: eventos genéricos + tablas tipadas + perfil vigente

- Tabla central `eventos_mascota` con metadata mínima.
- Tablas tipadas para detalles específicos por tipo de evento (ej: `evento_cita_servicio`, `evento_vacuna_aplicada`, etc).
- Tabla derivada `mascota_perfil_vigente` con estado actual (alergias, condiciones, peso actual, etc) — actualizada por triggers DB.

### P5 — Datos del cliente como activo: modelo de monetización

e-PetPlace **monetiza data** pero con reglas explícitas:
- **Nivel 1** (insights agregados/anónimos): vía API a terceros (fabricantes, aseguradoras, gobierno, académicos). Con umbral mínimo de muestra para evitar re-identificación.
- **Nivel 2** (segmentación pagada): terceros pagan para mostrar contenido a clientes de un segmento. Cliente puede opt-out, con transparencia del "por qué".
- **Nivel 3** (venta de data identificable): **PROHIBIDO**. Línea ética.

Las recomendaciones clínicas/de salud **nunca están sponsoreadas**. Priorizan el bienestar de la mascota sobre la monetización.

### P6 — Implementación por fases

El modelo completo en DB desde día 1. La implementación va por fases:
- **Fase 1 (pre-MVP)**: esqueleto DB + 5-6 tipos de evento principales + UI mínima.
- **Fase 2 (MVP soft launch)**: tipos secundarios para los 4 prestadores reales (vet, paseador, hotel, grooming).
- **Fase 3 (post-MVP)**: tipos diferidos, wearable, comida especializada.
- **Fase 4 (escala)**: IA, agregaciones, monetización de data.

---

## Actores

### A1 — Lista de actores y sus capacidades

Los actores se identifican por la pareja **(cuenta_comercial_id, rol_activo)** o **(user_id, rol_sistema)** para clientes/admin.

| Actor | Tipo cuenta | Contribuye eventos | Lee expediente |
|---|---|---|---|
| Veterinario dueño | prestador (tipo=vet) | ✅ | ✅ con permisos |
| Veterinario empleado | empleado de prestador vet | ✅ (atribuido al empleado_id) | ✅ vía cuenta |
| Paseador | prestador (tipo=paseador) | ✅ | ✅ vista filtrada |
| Hotel | prestador (tipo=hotel) | ✅ | ✅ vista filtrada |
| Grooming | prestador (tipo=grooming) | ✅ | ✅ vista filtrada |
| Entrenador | prestador (tipo=adiestramiento) | ✅ | ✅ vista filtrada |
| Criadero | prestador (tipo=criadero) | ✅ eventos de origen | ✅ con permisos |
| Refugio | prestador (tipo=refugio) | ✅ eventos de adopción | ✅ con permisos |
| Servicio emergencia 24/7 | prestador (tipo=emergencia) o modalidad de cita | ✅ | ✅ con permisos |
| Proveedor comida (con asesoría) | prestador + seller | ✅ ambos roles | ✅ según rol |
| Proveedor comida (solo venta) | seller | ✅ producto_asignacion | ❌ |
| Wearable device | sistema integrado | ✅ automático | ❌ |
| Cliente / pet parent | user (rol=pet_parent) | ✅ notas, peso, observaciones | ✅ TODO |
| Admin e-PetPlace | user (rol=admin) | ✅ correcciones con audit | ✅ con audit |
| Aseguradora | sistema integrado (futuro) | ✅ pólizas y reclamos | ✅ vista limitada |
| Seller productos | seller | ✅ producto_asignacion | ❌ |
| Laboratorio | indirecto, vía vet | ✅ a través de vet | ❌ |
| Crematorio / fin de vida | prestador (tipo=fin_de_vida) | ✅ evento_fin_vida | ✅ con permisos |
| Adoptante secundario | hereda rol pet_parent con consentimiento | ✅ | ✅ TODO |
| Familiar autorizado | user con permisos delegados por dueño | ✅ notas limitadas | ✅ vista limitada |

### A2 — Visibilidad parcial por tipo de prestador

El sistema define qué **subconjunto del expediente** ve cada tipo de prestador, basado en lo necesario y suficiente para su rol.

Ejemplos (a refinar en futuras sesiones):
- **Paseador** ve: alergias, miedos, condiciones de seguridad, medicación diaria. NO ve: historia clínica detallada.
- **Hotel** ve: alergias, medicación, plan nutricional, temperamento. NO ve: detalles diagnósticos médicos.
- **Grooming** ve: alergias dermatológicas, condiciones de piel/pelo, temperamento. NO ve: historia clínica completa.
- **Vet** ve: todo lo relacionado a salud + alergias + condiciones + intervenciones + cuidado externo (contexto).

Decisión pendiente: definir matriz exacta de `tipo_prestador × eje_expediente → visible/no_visible` en próximas sesiones.

---

## Eventos

### E1 — Modelo central: `eventos_mascota`

Estructura conceptual (DDL detallado pendiente):
eventos_mascota
├── id (uuid PK)
├── mascota_id (FK)
├── fecha (timestamptz — cuándo ocurrió el evento)
├── tipo (text — uno de la lista de tipos válidos)
├── evento_padre_id (uuid FK self-reference, nullable — para sub-eventos)
├── cuenta_comercial_id (uuid FK, nullable — actor)
├── prestador_id (uuid FK, nullable — si aplica)
├── empleado_id (uuid FK, nullable — si fue un empleado quien actuó)
├── user_id (uuid FK, nullable — si fue el cliente quien creó)
├── datos (jsonb — metadata mínima por tipo)
├── propaga_a_perfil (boolean — si true, actualiza mascota_perfil_vigente)
├── visibilidad_default (jsonb — qué actores pueden verlo por default)
├── created_at, updated_at
├── created_by_user_id (auditoría)
└── soft_delete (boolean default false)

Cada tipo de evento tiene además una **tabla tipada de detalle** (ej: `evento_vacuna_aplicada` con FK al evento). Esto da tipado fuerte sin perder la flexibilidad del evento genérico.

**Aclaración S16 — qué pertenece a `eventos_mascota` y qué no:**

`eventos_mascota` captura eventos de la vida documentada de la mascota — eventos que pertenecen a la mascota como entidad y viajan con ella en transferencia entre familias.

Hay un tipo de registro que **no es evento del Bio-Expediente**: el hito narrativo privado del humano (tabla `hito_narrativo_privado_humano`, S16). Pertenece al humano que lo escribió, no a la mascota. No tiene FK a `eventos_mascota`. Si la mascota cambia de familia, este registro no migra — queda con el humano. Esto materializa D15.4 ("los hitos privados son del humano, no de la mascota").

> Cuando un dev pregunte "¿todo lo que pasa con la mascota va a `eventos_mascota`?" — la respuesta es **no**. Lo que pertenece a la mascota sí. Lo que pertenece al humano sobre la mascota, no.

### E2 — Tipos de evento (MVP + diferidos)

**Tipos MVP — soft launch**:
- `cita_servicio` (vet, grooming, paseo, hotel, entrenamiento, nutrición)
- `emergencia` (cita urgente / fuera de horario, modalidad de cita)
- `vacuna_aplicada`
- `medicacion_prescrita`
- `examen_diagnostico`
- `producto_asignacion`
- `alergia_diagnosticada` (permanente)
- `condicion_cronica_diagnosticada` (permanente)
- `peso_medicion`
- `incidente_paseo`
- `incidente_hotel`
- `nota_dueno` (drift documental corregido en S18: el código real en `cat_tipos_evento` es `nota_dueno` sin ñ)
- `otro` (catch-all)

**Tipos modelados pero diferidos** (sin UI inicialmente):
- `cirugia_procedimiento`
- `esterilizacion`
- `chip_implantado`
- `evento_inicio_vida` (origen: criadero, refugio, adopción, encontrada)
- `transferencia_dueño`
- `evento_fin_vida` (fallecimiento)
- `wearable_telemetria` (agregada diaria/semanal)
- `wearable_alerta` (anomalía detectada)
- `cambio_comida` (transición de plan nutricional)
- `observacion_comportamiento`
- `medicacion_administrada` (dueño da medicina ya prescrita)
- `evento_seguro` (póliza, reclamo)
- `constancia_legal` (reporte generado a demanda regulatoria)
- `atencion_grooming_registrada` (sub-evento de `cita_servicio`; tabla tipada
  `eventos_mascota_grooming`; agregado en S27)

### E3 — Sub-eventos: `evento_padre_id`

Eventos pueden tener **estructura jerárquica de 1 nivel** (no recursivo) vía `evento_padre_id`:
- Padre: `cita_servicio` (cita vet)
- Hijos: `vacuna_aplicada`, `examen_diagnostico`, `medicacion_prescrita` (todos con `evento_padre_id = id_de_la_cita`)

Beneficios:
- Trazabilidad: cada vacuna sabe en qué cita se aplicó.
- Vista timeline: agrupable por evento padre.
- IA-friendly: contexto del padre disponible al analizar el hijo.

Cada tipo de evento tiene marca de:
- `puede_ser_raiz` (boolean): puede existir sin padre.
- `puede_ser_subevento` (boolean): puede ser hijo de otro.
- `tipos_padre_validos` (text[]): si es sub-evento, qué tipos pueden ser su padre.

Ejemplos:
- `cita_servicio`: raíz=sí, sub=no.
- `vacuna_aplicada`: raíz=sí (vacuna externa registrada por cliente), sub=sí (típicamente en cita vet).
- `incidente_paseo`: raíz=no, sub=sí (siempre dentro de cita_servicio tipo=paseo).

### E4 — Propagación a `mascota_perfil_vigente`

Algunos eventos son **puntuales** (pasan, quedan en timeline). Otros son **permanentes** (descubiertos en una fecha pero vigentes hasta desmentirse).

Para los permanentes, el evento dispara actualización a `mascota_perfil_vigente` vía **trigger DB** (patrón aprendido en D-004, ver L-048 en CLAUDE.md).

Estructura actual de `mascota_perfil_vigente` (S14 + S16, validada en relevamiento literal del schema en S16):
mascota_perfil_vigente
├── mascota_id (FK PK)
├── peso_clinico_kg + peso_clinico_medido_en              (D13.8: peso clínico — fuente de verdad médica)
├── peso_reportado_kg + peso_reportado_medido_en + peso_reportado_metodo (D13.8: cualquier método, estado más reciente)
├── alergias (jsonb array — estructura detallada en sección dedicada)
├── condiciones_cronicas (jsonb array, dedupe por condición)
├── intervenciones_permanentes (jsonb array, append-only)
├── medicacion_actual (jsonb array, dedupe por medicamento)
├── plan_nutricional_actual (jsonb)
├── prestadores_habituales (jsonb objeto con 5 slots fijos — D13.7)
├── temperamento (jsonb objeto por contexto — bitácora de observaciones de prestadores)
├── microchip_activo (text, propagado desde evento_microchip_asignado)
├── seguro_activo_id (uuid FK, propagado desde evento_seguro_alta)
├── tiene_emergencia_activa (boolean)
├── ultimo_evento_id (FK al evento más reciente)
├── ultimo_evento_fecha (timestamptz)
└── created_at, updated_at

**NO tiene `etapa_vida_actual`**: el momento vital (M0-M6) se calcula on-demand vía función `calcular_momento_vital(mascota_id)` (S16). No se materializa en perfil vigente porque depende de `now()` y debería recalcularse en cada lectura. La función vieja `calcular_etapa_vida(fecha, especie)` queda deprecada (devuelve 4 etapas, no 7 momentos; tiene contradicción `IMMUTABLE + now()`).

`mascota_perfil_vigente` es **lectura rápida** — no requiere scan de timeline para responder "¿qué alergias tiene Firulais hoy?".

*Cierra deuda D-119 (drift documental sección E4 vs schema real).*

### E5 — Eventos puntuales vs permanentes: ambos modelados

- **Puntuales**: viven en `eventos_mascota` sin propagar a perfil vigente.
- **Permanentes**: viven en `eventos_mascota` + propagan a `mascota_perfil_vigente`.

El campo `propaga_a_perfil` controla este comportamiento. Es definido por tipo de evento, no por evento individual.

### E6 — Capa de atención `evento_atencion` (S36, DM-S36.3)

`evento_atencion` es una **capa genérica de atención por mascota**, lateral al hito del bio-expediente. NO es un `eventos_mascota` — es una tabla tipada que cuelga del hito vía `evento_id` (FK→`eventos_mascota`, RESTRICT), exactamente como las demás tablas tipadas (`evento_vacuna_aplicada`, `eventos_mascota_grooming`, etc.) cuelgan del hito.

**Por qué la jerarquía plana (P-OP-5) no se viola:** una `cita_servicio` sigue siendo el hito raíz del bio-expediente; `evento_atencion` no se cuelga *bajo* la cita en `eventos_mascota.evento_padre_id` — se cuelga *al lado* en su propia tabla, con FK directa al hito. La jerarquía conceptual sigue siendo de 1 nivel (E3): cita_servicio → sub-eventos (`vacuna_aplicada`, `incidente_paseo`, etc.). `evento_atencion` no es un nuevo nivel, es modelo lateral de la operación que ejecutó esa cita.

Estructura conceptual:
```
evento_atencion
├── id (uuid PK)
├── evento_id (FK→eventos_mascota, RESTRICT — el hito raíz)
├── cita_id (FK→evento_cita_servicio)
├── familia (text + CHECK: 'grooming'|'paseo'; NO FK — ver D-272)
├── mascota_id, prestador_id, empleado_id, country_code
├── estado (CHECK: en_curso|terminada|cerrada_con_calidad|cerrada_con_pendiente)
├── iniciada_en, terminada_en, cerrada_en
├── mensaje_familia (text — transversal: paseo también lo usa)
├── created_at, updated_at
└── UNIQUE(cita_id, mascota_id)
```

**Unidad = una atención por MASCOTA**, no por cita. Grooming: 1 atención por cita (1 mascota por cita de facto). Paseo: 1 atención por cita — cada perro tiene SU cita (DM-S38.1); la "ruta" es agrupación operativa, no entidad. El `UNIQUE(cita_id, mascota_id)` materializa esta unidad sin caso especial por familia.

**RLS:** 4 policies clonadas del molde grooming (SELECT por mascota, INSERT por prestador+mascota, UPDATE por prestador, DELETE admin). Trigger `updated_at`.

**Cómo se relaciona con las tablas tipadas de oficio:** cada familia mantiene su tabla tipada de detalle (`eventos_mascota_grooming`, `eventos_mascota_paseo`) reducida a oficio puro. Esas tablas cuelgan de `evento_atencion` vía `evento_atencion_id (FK RESTRICT)` — la integridad referencial impide borrar la fila de la capa mientras existe oficio, NO directamente del hito. Post-refactor S36, `eventos_mascota_grooming` quedó: `id, evento_atencion_id (puente único a la capa y al hito), mascota_id, prestador_id, empleado_id, country_code, tipo_pelaje_observado` (único campo grooming-específico).

**Transversales-en-intención** (`evento_grooming_pausas`, `evento_grooming_notas`, `evento_grooming_incidencias`) cuelgan también de `evento_atencion_id` (FK CASCADE) — toda familia pausa, anota, reporta incidencia. **Oficio-puro** (servicios_aplicados, zonas_trabajadas, productos_consumidos, estados_pelaje) sigue colgando de `grooming_id` (conceptos exclusivos de peluquería).

**Familia paseo (S38):** `eventos_mascota_paseo` (oficio puro post-SB1) — `id, evento_atencion_id (puente único, FK RESTRICT a la capa), mascota_id, prestador_id, empleado_id, country_code, gps_estado, gps_motivo_fallo, track_gps jsonb`. Los puntos GPS van en jsonb (append con cap 10000), NO en tabla aparte — paseo-1 prohíbe la entidad "salida". La hija de oficio `evento_paseo_novedades` cuelga del paseo (CASCADE) con FK RESTRICT a `cat_novedades_paseo(codigo)` y guarda el parte del perro — observación neutral del oficio, NO incidencia (paseo-5). El tipo de evento `atencion_paseo_registrada` vive en `cat_tipos_evento` con eje `cuidado_externo` y `propaga_a_perfil = false` (P1: paseo sugiere a la familia, no escribe perfil directo). DM-S38.1: cada perro tiene SU cita, así que paseo cae en el camino estándar 1 atención/cita (sin caso especial multi-perro por cita).

**Archivos siguen colgando del hito (D13.4), NO de la capa.** `evento_archivo_adjunto` cuelga de `evento_padre_id → eventos_mascota`, no de `evento_atencion`. Esta decisión se preserva en S36 — el archivo es del bio-expediente, no de la operación. D-275 (sistema único de archivos) confirma este principio: familias nuevas usan `evento_archivo_adjunto` directamente, sin crear `evento_<familia>_archivos`.

**Por qué no usar `eventos_mascota` para esto:** la tabla central es bio-expediente (hito), con `eje_jtbd NOT NULL`, soft-delete y visibilidad — semántica de hito, no de atención. La atención necesita estado mutable (en_curso → terminada → cerrada_con_*) y timestamps de operación (iniciada/terminada/cerrada) que no encajan con la inmutabilidad del hito. Modelar atención como tabla lateral preserva ambas semánticas.

---

## Estructura — Los 8 ejes JTBD-orientados

El expediente se organiza visualmente y semánticamente en **8 ejes** que corresponden a **Jobs To Be Done** del ciclo de vida de la mascota.

### Eje 1 — Identidad

**Job**: "saber quién es esta mascota".

Contenido: especie, raza, sexo, fecha nacimiento, foto, chip de identificación, origen (criadero/refugio/calle/etc), padres (si criadero), nombre familiar/apodo, pet_hash único.

Permanente. Raramente cambia.

### Eje 2 — Etapa de vida

**Job**: "saber qué cuidados corresponden a esta etapa".

Contenido: etapa actual (cachorro/joven/adulto/senior), edad, peso vs estándar de raza, jobs sugeridos por etapa (ej: senior → chequeo cardiológico recomendado).

Derivado. Se actualiza por triggers cuando pasa cumpleaños o se registra peso nuevo.

### Eje 3 — Salud

**Job**: "mantener saludable, detectar enfermedades, tratar".

Contenido: citas vet (incluye emergencias), vacunas, exámenes diagnósticos, medicación, alergias identificadas, condiciones crónicas, cirugías, esterilización.

Timeline + perfil vigente.

### Eje 4 — Cuidado externo

**Job**: "atender necesidades cuando no estoy".

Contenido: paseos, estadías de hotel, sesiones de grooming. Cada uno con observaciones del prestador.

Timeline.

### Eje 5 — Alimentación

**Job**: "alimentar bien según necesidades".

Contenido: plan nutricional actual + histórico de cambios + premios/suplementos + transiciones. Conecta con `producto_asignaciones` (productos comprados/usados).

Timeline + perfil vigente (plan actual).

### Eje 6 — Comportamiento

**Job**: "educar y entender comportamiento".

Contenido: sesiones de entrenamiento, observaciones de prestadores (hotel, paseador), observaciones del dueño, miedos identificados, mejoras notadas.

Timeline + perfil vigente (temperamento, miedos).

### Eje 7 — Datos pasivos (wearable / monitoreo)

**Job**: "detectar cambios sutiles sin esfuerzo".

Contenido: telemetría agregada (actividad, sueño, ritmo), alertas automáticas.

Timeline pero **diferenciada visualmente** — no contamina la timeline humana principal.

Diferido: schema preparado, implementación posterior cuando haya wearable real.

### Eje 8 — Administrativo

**Job**: "cumplir requisitos legales y financieros".

Contenido: pólizas de seguro activas, reclamos, documentos legales (registros sanitarios, certificaciones), constancias generadas a demanda regulatoria.

Mixto.

---

## Acceso y permisos

### AC1 — Identidad de la mascota a través de prestadores

Cada mascota tiene un **`pet_hash`** único e inmutable (generado al crear). Es la identidad técnica fuerte usada por:
- IA (clave estable para feature engineering).
- Reportes legales (identificación sin PII del dueño).
- API de monetización (anonimización).

En el día a día humano, prestadores y dueños no usan hashes — usan flujos UX descriptos abajo.

### AC2 — Otorgamiento de acceso del prestador al expediente

Modelo **híbrido**:

**Primera vez** (sin relación previa): el dueño debe otorgar acceso explícito a la cuenta del prestador. Mecanismos:
- Dueño escanea QR del prestador desde su app cliente.
- Dueño busca al prestador en su app y comparte la mascota.
- Prestador busca al pet_parent en su portal + dueño confirma desde notificación push en su app.

**Relación activa**: una vez que existe cita pendiente o reciente con el prestador, el acceso queda otorgado **automáticamente**.

**Implementado en S27 (DM-S27.2):** el otorgamiento automático por relación
activa se materializó. El trigger `trg_otorgar_acceso_por_cita_confirmada` sobre
`evento_cita_servicio` inserta una fila en `mascota_acceso_prestador` con
`metodo_otorgamiento = 'cita_automatica'` cuando una cita pasa a estado
`confirmada` (no se duplica si ya hay acceso vigente). La caducidad es lazy:
`user_tiene_acceso_a_mascota` considera vigente una fila `cita_automatica` solo
si existe una cita con esa mascota dentro de una ventana de N meses
(`app_config.acceso_prestador_caducidad_meses`, default 6). No hay job de
revocación — la caducidad se evalúa en lectura.

**Expiración**: si pasan X meses (a definir, sugerido: 12) sin nueva interacción, los permisos pasan a "solo lectura limitada" o expiran. El dueño puede renovar siempre.

**Revocación**: el dueño puede revocar acceso en cualquier momento desde su app.

### AC3 — Tabla `mascota_acceso_prestador`
mascota_acceso_prestador
├── id (uuid PK)
├── mascota_id (FK)
├── cuenta_comercial_id (FK — el prestador, a nivel cuenta)
├── otorgado_en (timestamptz)
├── otorgado_por (uuid: pet_parent que dio permiso)
├── metodo_otorgamiento (enum: qr_scan | search_owner | cita_automatica | familiar_delegacion)
├── expira_en (timestamptz nullable: null = sin expiración hasta revocar)
├── revocado_en (timestamptz nullable)
├── revocado_por (uuid nullable)
├── motivo_revocacion (text nullable)
└── audit_log (jsonb)

### AC4 — Acceso a nivel cuenta comercial, NO empleado individual

El acceso se otorga a la **cuenta_comercial_id**, no al `empleado_id`. Si un empleado se va de la clínica (estado activo=false), pierde acceso automáticamente. Si la clínica contrata empleado nuevo, hereda acceso a las mascotas de la clínica.

Razones:
- Consistente con modelo de roles de portal-prestadores (S5/S10/S11).
- Simplifica revocación (revocás 1 fila, no N empleados).
- Empleados son "manos" de la cuenta — la cuenta es responsable.

### AC5 — Visibilidad parcial por tipo

Una vez otorgado acceso, el prestador NO ve todo. Ve **vista filtrada por su tipo** (ver A2).

Implementación: views Postgres específicas por tipo de prestador, o RLS policies con joins a `prestadores.tipo`. Decisión técnica pendiente.

### AC6 — Cumplimiento legal del prestador post-revocación

Cuando cliente revoca acceso o cierra cuenta, el prestador pierde acceso al expediente. PERO el prestador retiene un **log inmutable mínimo** para cumplir regulación de retención de historiales (Ecuador, USA, España, etc):
prestador_atencion_log (immutable, append-only)
├── id (uuid PK)
├── cuenta_comercial_id (FK)
├── pet_hash (text — identificación de la mascota sin PII)
├── fecha_atencion
├── tipo_atencion (text)
├── resumen_breve (text — qué se hizo, sin detalles sensibles)
├── created_at
└── trigger: BLOCKS UPDATE/DELETE

Esto cumple regulación sin exponer data del cliente. El prestador puede generar **reportes legales** desde este log a demanda de autoridad.

---

## IA y monetización

### IA1 — Tipos de uso de IA (visión a largo plazo)

| ID | Tipo | Para quién | Fase |
|---|---|---|---|
| A | Detección de patrones de salud | Dueño + vet | Fase 4 |
| B | Recomendaciones de prestador | Dueño | Fase 4 |
| C | Anticipación por ciclo de vida | Dueño + vet | Fase 4 |
| D | Alertas comportamentales | Dueño + vet | Fase 4 |
| E | Optimización del prestador | Prestador | Fase 4 |
| F | Match cliente-prestador por compatibilidad | Sistema | Fase 4 |
| G | Alertas de consumo (recomprar) | Dueño | Fase 4 |
| H | Sugerencias de consumo (productos nuevos) | Dueño | Fase 4 |
| I | Publicidad segmentada (Nivel 2) | Tercero pagante | Fase 4 |

### IA2 — Niveles de monetización de data

**Nivel 1 — Insights agregados/anónimos** ✅ permitido sin restricción.
- Data agregada con N ≥ umbral (sugerido: 50 mascotas o más por segmento).
- Sin PII, sin posibilidad de re-identificación.
- API o reportes a fabricantes, aseguradoras, gobierno, académicos.

**Nivel 2 — Segmentación pagada** ✅ permitido con reglas.
- Tercero define segmento. e-PetPlace muestra contenido del tercero solo a clientes del segmento.
- Tercero NUNCA recibe la data.
- Cliente puede opt-out de segmentación publicitaria.

**Nivel 3 — Venta de data identificable** ❌ PROHIBIDO. Línea ética.

### IA3 — Las 5 reglas (invariantes del sistema)

1. **Recomendación clínica nunca está sponsoreada**. Si el sistema recomienda "tu mascota necesita X", basado en data clínica. Separación visual estricta de "Sponsored".

2. **Toda monetización tiene opt-out visible**. Settings → "Recibir recomendaciones de productos" → toggle. Default ON pero opt-out fácil (un click).

3. **Transparencia del por qué de cada recomendación**. Ícono "ⓘ ¿Por qué veo esto?" con explicación honesta (segmentación por raza, por diagnóstico, sponsored, etc).

4. **Umbral mínimo N ≥ X para insights agregados**. Si un segmento tiene menos de X mascotas, no se vende ese insight. X a calibrar con asesoría privacy (sugerido 50).

5. **Auditoría de uso de data + reportes al cliente**. El cliente puede ver: "estos son los segmentos a los que pertenezco, esto es lo que se mostró por eso". Puede revocar permisos retroactivamente.

### IA4 — Tablas relacionadas (esquema conceptual)
cliente_preferencias_uso_data
├── user_id (FK PK)
├── recibe_recomendaciones_salud (bool default true)
├── recibe_recomendaciones_productos (bool default true)
├── recibe_segmentacion_publicitaria (bool default true)
├── contribuye_insights_agregados (bool default true)
├── updated_at
└── audit_log

recomendaciones_log
├── id (uuid PK)
├── user_id
├── mascota_id (nullable: si la recomendación es de la mascota)
├── fecha
├── tipo (clinica | producto | prestador | sponsored)
├── motivo (jsonb: qué data se usó)
├── item_recomendado_id
├── interactuo (bool: si el cliente hizo click)
└── created_at

socios_data_comerciales
├── id, nombre, contacto
├── nivel_acceso (1 | 2)
├── scope (jsonb: qué segmentos puede usar)
├── tyc_firmados_en, vigencia
└── audit_log

---

## Decisiones cerradas en S12 (Discovery completo)

Listado de **TODAS las decisiones tomadas** durante el discovery del 11 May 2026. Si en futuras sesiones una decisión cambia, se actualiza acá explícitamente.

### Bloque 1 — Actores
- ✅ Lista de 14+ tipos de actores (vets, paseador, hotel, grooming, entrenador, criadero, refugio, emergencia, comida, wearable, cliente, admin, aseguradora, seller, laboratorio, crematorio, adoptante secundario, familiar).
- ✅ Visibilidad parcial por tipo de prestador (sistema decide qué es necesario/suficiente).
- ✅ Sellers contribuyen TODO lo comprado vía `producto_asignaciones` separado de `pedidos`.
- ✅ Cuenta puede tener múltiples roles, el evento define el contexto.

### Bloque 2 — Eventos
- ✅ Tipos MVP + tipos diferidos (lista completa en E2).
- ✅ Permanentes vs puntuales: ambos modelados, propagación selectiva.
- ✅ Sub-eventos via `evento_padre_id` nullable.
- ✅ Propagación a `mascota_perfil_vigente` vía triggers DB (patrón D-004).
- ✅ Modelo C híbrido: eventos genéricos + tablas tipadas + perfil vigente.

### Bloque 3 — Estructura
- ✅ 8 ejes JTBD-orientados (Identidad, Etapa de vida, Salud, Cuidado externo, Alimentación, Comportamiento, Datos pasivos, Administrativo).
- ✅ Identidad mascota: pet_hash inmutable + `mascota_acceso_prestador` + acceso a nivel cuenta comercial.

### Bloque 4 — IA y monetización
- ✅ 9 tipos de uso de IA en visión a largo plazo (Fase 4).
- ✅ Modelo de monetización Nivel 1 + Nivel 2, Nivel 3 prohibido.
- ✅ 5 reglas invariantes codificadas en el modelo.

### Estratégicas (founder)
- ✅ Aceptable aplazar soft launch si arquitectura lo requiere.
- ✅ Modelo data sobre velocidad de lanzamiento.
- ✅ Implementación por fases (4 fases definidas en P6).

---

## Pendientes para futuras sesiones

Discovery está completo, pero el documento tiene secciones que requieren más detalle técnico para ser implementables. Próximas sesiones cubrirán:

### Pendiente PE1 — DDL completo de tablas
- `eventos_mascota` con todos los índices recomendados.
- Tablas tipadas por evento (`evento_cita_servicio`, `evento_vacuna_aplicada`, etc).
- `mascota_perfil_vigente`.
- `mascota_acceso_prestador`.
- `producto_asignaciones`.
- `cliente_preferencias_uso_data`, `recomendaciones_log`, `socios_data_comerciales`.
- `prestador_atencion_log` (immutable).

### Pendiente PE2 — Matriz de visibilidad por tipo de prestador
- Tabla `tipo_prestador × eje_expediente → permitido/no_permitido`.
- Decisión técnica: views Postgres por tipo o RLS con joins.

### Pendiente PE3 — Triggers DB
- Trigger sobre `eventos_mascota` → propagación a `mascota_perfil_vigente` para eventos con `propaga_a_perfil=true`.
- Trigger sobre `eventos_mascota` → escritura automática a `prestador_atencion_log`.
- Trigger sobre `mascota_acceso_prestador` UPDATE → auditoría.

### Pendiente PE4 — RLS policies
- Por tipo de actor.
- Por tabla de evento.
- Con coherencia entre acceso (cuenta) + visibilidad parcial (tipo).

### Pendiente PE5 — Integración con tablas existentes
- ¿`citas` migra a ser tabla tipada de `evento_cita_servicio` o queda separada con FK?
- ¿`vacunas` (si existe) idem?
- ¿`wearable_alerts` (en repo cliente) idem?
- Decisión: migración vs FK paralela.

### Pendiente PE6 — Reportes legales
- Estructura del PDF "constancia de atención por mascota".
- Generación a demanda desde el portal-prestadores.
- Auditoría de quién pidió cuál constancia y cuándo.

### Pendiente PE7 — Catálogo de productos (centralizado)
- Estructura de tabla `productos` que alimenta `producto_asignaciones`.
- Atributos jsonb (proteína, edad target, ingredientes activos, etc).
- Sellers como dueños de SKUs específicos pero productos como entidades canonicales.

### Pendiente PE8 — UX flow concretos
- "Cliente comparte mascota con prestador nuevo" (QR vs búsqueda).
- "Prestador atiende mascota por primera vez en portal".
- "Cliente revoca acceso a prestador".
- "Familiar autorizado accede temporal".

### Pendiente PE9 — Schema preparado para IA
- Estructura de feature store eventual.
- Anonimización de pet_hash para vista agregada.
- Vistas Postgres para entrenar modelos sin tocar tabla principal.

### Pendiente PE10 — Definición de N umbral para Nivel 1 (regla 4 de IA3)
- Asesoría con experto privacy.
- Sugerencia inicial: N≥50, ajustar tras revisión legal.

---

## Estado de implementación (al cierre S14)

Esta sección describe qué del modelo conceptual está implementado en DB, qué decisiones se tomaron en S13-S14, qué patrones rigen el modelo, y qué falta. Mantener sincronizada con la realidad.

### Decisiones de modelo cerradas en S13

Estas decisiones afectan estructura y semántica. Documentarlas evita re-litigar en sesiones futuras.

**D13.1 — Diagnósticos secundarios como jsonb, no tabla aparte.**
La tabla `cita_diagnosticos_secundarios` fue eliminada. Los diagnósticos secundarios viven en `evento_historia_clinica_registrada.diagnosticos_secundarios jsonb`. Razón: son ricos en contexto pero pocos por HC (típicamente 0-3), y consultarlos junto con la HC es más natural que JOIN aparte.

**D13.2 — Rename limpio, NO view de compatibilidad.**
Cuando renombramos `citas → evento_cita_servicio`, `historia_clinica → evento_historia_clinica_registrada`, etc., NO creamos views con el nombre viejo para backward compat. Frontend que use nombres viejos rompe hasta Bloque 7. Razón: voto explícito del founder por "modelo limpio sin deuda".

**D13.3 — Mascotas reorganizada con origen NOT NULL.**
`mascotas.origen` (`criadero/refugio/adoptado/comprado_particular/nacido_en_casa/encontrado/transferido/desconocido`) es NOT NULL sin default. Cualquier nueva mascota debe declarar origen explícito. Si `origen='criadero'`, `criadero_id` NOT NULL. Si `origen='refugio'`, `refugio_id` NOT NULL. Enforced por CHECK compuesto `mascotas_origen_coherencia_check`.

**D13.4 — `evento_archivo_adjunto.evento_padre_id` apunta a `eventos_mascota.id` directamente.**
NO apunta a `evento_cita_servicio.id` ni a `evento_historia_clinica_registrada.id` específicamente. Razón: archivo puede colgar de una cita o de una HC indistintamente. La FK a `eventos_mascota.id` permite ambos casos sin polimorfismo. La tabla no es standalone — `evento_padre_id` es NOT NULL.

**D13.5 — `evento_vacuna_aplicada` puede ser standalone.**
`cita_id` es nullable. Una vacuna puede ser sub-evento de cita médica (vet la aplica en consulta) o evento standalone (dueño la registra de aplicación anterior sin cita). `prestador_id` también nullable por la misma razón.

**D13.6 — `cita_telemedicina_detalle` es tabla anexa, NO sub-evento.**
Una cita con `modalidad='telemedicina'` tiene UN registro 1:1 en `cita_telemedicina_detalle` con room URL, tokens, grabación, etc. NO se crea evento separado en `eventos_mascota` para "sesión de telemedicina". El padre es la propia cita.

**D13.7 — `prestadores_habituales` como jsonb estructurado, no 4 columnas.**
Estructura: `{vet: uuid|null, grooming: uuid|null, paseador: uuid|null, hotel: uuid|null, entrenador: uuid|null}`. Razón: extensible (agregar slots futuros sin ALTER TABLE), lectura O(1) desde JSON. Propagación pendiente (D-117), por ahora se mantiene en `{}` vacío.

**D13.8 — `mascota_perfil_vigente` tiene 5 campos de peso, no 1.**
- `peso_clinico_kg` + `peso_clinico_medido_en`: última medición con método `bascula_clinica`. Fuente de verdad médica.
- `peso_reportado_kg` + `peso_reportado_medido_en` + `peso_reportado_metodo`: última medición de cualquier método (clínica, casa, estimación). Refleja estado más reciente.
- Trigger B1 actualiza ambos según método, siempre con regla "solo si fecha más reciente".

### Patrones operacionales del modelo

Estos patrones aplican uniformemente. Si un caso futuro los rompe, escalar.

**P-OP-1 — Triggers de auto-creación de evento padre son no-op si `evento_id` viene poblado.**
Las 16 tablas tipadas con trigger BEFORE INSERT verifican `IF NEW.evento_id IS NULL THEN crear padre`. Si la función `completar_historia_clinica` (o cualquier orquestador futuro) crea el padre explícito y popula `evento_id` antes del INSERT, el trigger no hace nada. Esto permite mismo schema en ambos flujos (orquestado vs standalone).

**P-OP-2 — Tablas standalone vs siempre-cuelga.**
- Standalone permitido (`cita_id` nullable o sin `evento_padre_id`): `evento_medicacion_prescrita`, `evento_examen_diagnostico`, `evento_vacuna_aplicada`, todas las tablas tipadas nuevas excepto archivo.
- Siempre cuelga (`evento_padre_id` NOT NULL): `evento_archivo_adjunto` (archivo siempre pertenece a una cita o a una HC, nunca al aire).

**P-OP-3 — `prestador_atencion_log` es append-only por trigger, NO por RLS.**
Triggers C1 (BEFORE UPDATE/DELETE) lanzan excepción. Las policies RLS deciden quién puede SELECT/INSERT. La inmutabilidad la garantiza el trigger, independiente de quién intente modificar (incluyendo admin o service_role).

**P-OP-4 — Propagación a `mascota_perfil_vigente` es condicional según naturaleza del dato.**
- Peso: actualizar solo si fecha más reciente.
- Alergias, condiciones, medicación: dedupe por clave (alérgeno, condición, medicamento). Si llega un INSERT con misma clave, reemplaza la entrada existente.
- Intervenciones permanentes: append-only (no dedup, no remove).
- Temperamento: union de rasgos por contexto.
- Microchip: sobrescribe (último implante es el actual).

**P-OP-5 — Máximo 1 nivel de profundidad en sub-eventos.**
Trigger C2 valida que `eventos_mascota.evento_padre_id` no apunte a un evento que ya tenga `evento_padre_id`. La jerarquía es plana: raíz → sub-eventos. No hay sub-sub-eventos.

**P-OP-6 — Auto-logging de atención profesional dispara por `_debe_logear_atencion`.**
Función IMMUTABLE retorna true para eventos clínico-profesionales con prestador no-NULL. Trigger 5.D inserta en `prestador_atencion_log` con snapshot inmutable: `pet_hash` (no PII), tipo de atención, prestador, fecha, resumen breve. Esta entrada sobrevive aunque el dueño revoque acceso o borre la mascota.

### Schema en DB (Bloque 4 — completo)

**Catálogos (4):**
- `cat_ejes_jtbd` (8 filas) — los 8 ejes JTBD.
- `cat_tipos_evento` (53 filas) — tipos de evento del Bio-Expediente. (Conteo
  actualizado en S27 tras relevamiento; incluye los tipos agregados en S16-S26 y
  `atencion_grooming_registrada` agregado en S27.)
- `cat_especies` (8 filas, 2 activas: perro, gato) — especies soportadas.
- `cat_categorias_archivo` (13 filas) — categorías de archivos adjuntos (médicas + grooming + multimedia).

**Tabla central:**
- `eventos_mascota` — la tabla raíz del Bio-Expediente. Cada fila es un evento en la vida de la mascota.

**Tablas núcleo (3):**
- `mascota_perfil_vigente` — estado vigente derivado. 1 fila por mascota. Mantenida por triggers.
- `mascota_acceso_prestador` — permisos prestador→mascota. UNIQUE parcial sobre activos.
- `prestador_atencion_log` — log append-only de atenciones profesionales. Sobrevive revocaciones.

**Tabla base reorganizada:**
- `mascotas` — reorganizada: agregadas columnas `origen`, `criadero_id`, `refugio_id`, `fecha_alta`, `microchip`. Eliminadas `peso` y `notas`. `pet_hash` NOT NULL UNIQUE (GENERATED).

**Tablas tipadas existentes renombradas (6):**
- `citas → evento_cita_servicio` (con cleanup de 8 columnas legacy + agregadas `evento_id`, `modalidad`, `updated_at`).
- `historia_clinica → evento_historia_clinica_registrada` (con `diagnosticos_secundarios jsonb`, `evento_id`, `empleado_id`).
- `cita_recetas → evento_medicacion_prescrita`.
- `cita_examenes → evento_examen_diagnostico`.
- `cita_archivos → evento_archivo_adjunto` (con `evento_padre_id` reemplazando `cita_id`).
- `vacunas → evento_vacuna_aplicada`.

**Tablas tipadas nuevas (12):**
- `evento_alergia_diagnosticada`
- `evento_condicion_cronica_diagnosticada`
- `evento_intervencion_permanente`
- `evento_medicacion_administrada`
- `evento_peso_medicion`
- `evento_temperamento_observacion`
- `evento_nota_dueno`
- `evento_microchip_asignado`
- `evento_cambio_nombre`
- `evento_correccion_dato_identidad`
- `evento_certificado_emitido`
- `evento_emergencia_solicitada`

**Tabla anexa:**
- `telemedicina_sesiones → cita_telemedicina_detalle` (NO sub-evento, anexa de cita telemedicina).

**Integración wearables:**
- `wearable_alerts` — agregado `evento_id` UNIQUE FK a `eventos_mascota`.

**Tablas legacy eliminadas (5):**
- `recetas_medicas` (vacía, duplicada).
- `cita_diagnosticos_secundarios` (jsonb en HC ahora).
- `resultado_servicio` (vacía, sin reemplazo aún para servicios no-médicos).
- Vista `v_bio_expediente` (legacy, reemplazada por modelo nuevo).

### Estructura interna de jsonb's críticos

**`mascota_perfil_vigente.alergias`** — array:
```json
[
  {
    "alergeno": "polen",
    "severidad": "moderada",
    "categoria": "ambiental",
    "estado": "confirmada",
    "fecha_diagnostico": "2025-03-15",
    "evento_id": "uuid"
  }
]
```
Dedupe por `alergeno`. Si `estado` pasa a `resuelta` o `descartada`, se elimina del array.

**`mascota_perfil_vigente.condiciones_cronicas`** — array similar, dedupe por `condicion`:
```json
[
  {
    "condicion": "diabetes",
    "cie_codigo": "...",
    "estado": "controlada",
    "fecha_diagnostico": "2024-08-01",
    "evento_id": "uuid"
  }
]
```

**`mascota_perfil_vigente.intervenciones_permanentes`** — array, append-only:
```json
[
  {
    "tipo": "castracion",
    "descripcion": "...",
    "fecha_realizada": "2023-06-15",
    "reversible": false,
    "evento_id": "uuid"
  }
]
```

**`mascota_perfil_vigente.medicacion_actual`** — array, dedupe por `medicamento`:
```json
[
  {
    "medicamento": "Carprofen",
    "principio_activo": "carprofen",
    "dosis": "50mg",
    "frecuencia": "cada 12 horas",
    "via_administracion": "oral",
    "fecha_inicio": "2025-04-01",
    "fecha_fin_estimada": "2025-04-15",
    "duracion_dias": 14,
    "evento_id": "uuid"
  }
]
```

**`mascota_perfil_vigente.temperamento`** — objeto por contexto:
```json
{
  "visita_clinica": ["tranquilo", "cooperador"],
  "grooming": ["ansioso", "vocaliza"],
  "paseo": ["sociable", "tira_correa"]
}
```
Por cada observación nueva, union de rasgos (dedup) dentro del contexto correspondiente.

**`mascota_perfil_vigente.prestadores_habituales`** — objeto fijo (pendiente trigger D-117):
```json
{
  "vet": "uuid|null",
  "grooming": "uuid|null",
  "paseador": "uuid|null",
  "hotel": "uuid|null",
  "entrenador": "uuid|null"
}
```

**`eventos_mascota.datos`** — jsonb genérico para metadata del evento. Estructura varía por tipo. Los detalles ricos viven en la tabla tipada asociada (FK por `evento_id`), no acá.

### Funciones helper (4)

- `calcular_etapa_vida(fecha_nacimiento, especie)` — umbrales por especie. Requiere validación veterinaria profesional (D-111).
- `eje_de_tipo_servicio(tipo_servicio)` — mapea `tipo_servicio` → eje JTBD.
- `_debe_logear_atencion(tipo_evento, prestador_id)` — decide si un evento clínico-profesional debe loggear en `prestador_atencion_log`.
- `completar_historia_clinica(input_data jsonb) RETURNS uuid` — orquesta cierre de cita médica con HC completa. Crea jerarquía de eventos. Pendiente runtime test end-to-end (D-107).

### Triggers (Bloque 5 — completo)

**Sub-bloque 5.A — Auto-creación de evento padre (16 triggers):**
- Función genérica `_crear_evento_padre_auto`.
- Trigger BEFORE INSERT en 16 tablas tipadas. Aplica patrón P-OP-1.

**Sub-bloque 5.B — Propagación a `mascota_perfil_vigente` (8 triggers):**
- B0: auto-crear perfil al crear mascota.
- B1: peso (P-OP-4: solo si más reciente).
- B2: alergias (P-OP-4: dedupe por alérgeno, según estado).
- B3: condiciones crónicas (P-OP-4: dedupe por condición, según estado).
- B4: intervenciones permanentes (P-OP-4: append-only).
- B5: microchip (P-OP-4: sobrescribe + a `mascotas.microchip`).
- B6: temperamento (P-OP-4: union de rasgos por contexto).
- B7: medicación prescrita (P-OP-4: dedupe por medicamento).

**Sub-bloque 5.C — Coherencia operacional (4 triggers):**
- C1: bloqueo append-only en `prestador_atencion_log` (P-OP-3).
- C2: validación máx 1 nivel de profundidad (P-OP-5).
- C3: auto-completar cita al insertar HC.

**Sub-bloque 5.D — Auto-logging atención profesional (1 trigger):**
- AFTER INSERT en `eventos_mascota` (P-OP-6).

**Sub-bloque 5.E — Updates finales perfil (2 triggers):**
- E1: `ultimo_evento_id`/fecha (solo si más reciente).
- E2: `tiene_emergencia_activa` (recalcula desde estado).

**Total Bloque 5: 31 triggers + 25 funciones de trigger.**

### Schema en DB — Bloque 9 (S16-S19, refactor de integración) — 7 de 11 fases ejecutadas

DDL conceptual cerrado en S16. Fases A/B/C/D/E ejecutadas en S16-S17. Fase F ejecutada en S18. Fase G ejecutada en S19 (alta asistida cliente+mascota). Fases H-K pendientes S20+.

**Migraciones aplicadas:**
- `migrations/2026-05-13-S16-fase-A.sql` (commit `29c1a9f`) — Fase A completa: extensión de `cat_especies` y `cat_tipos_evento`, creación de `cat_especies_perfil` y `cat_especies_vocabulario`, pre-carga de perfiles y vocabulario base.
- `migrations/2026-05-14-S17-fase-B.sql` — Fase B: tablas `familia`, `familia_miembro`, `mascota_codueño`, `mascota_familiar_autorizado` + 27 RLS policies + reescritura de `user_tiene_acceso_a_mascota`.
- `migrations/2026-05-14-S17-fase-C.sql` — Fase C: ALTERs a `mascotas` (`familia_id`, `estado_vida`, `estado_vida_desde`) + backfill + trigger `propagar_estado_vida_desde_evento`.
- `migrations/2026-05-14-S17-fase-D.sql` — Fase D: tablas `mascota_visibilidad_config` + `accion_destructiva_pendiente` + helper `user_puede_ver_dimension` + triggers + RLS.
- `migrations/2026-05-14-S17-fase-E.sql` — Fase E: tablas `caso_clinico` + `caso_clinico_consultor` + 6 ALTERs a tablas tipadas clínicas (`caso_clinico_id`) + 21 RLS policies + 2 helpers SECURITY DEFINER (`_user_clinica_tratante_del_caso`, `_user_clinica_consultor_del_caso`).
- `migrations/2026-05-15-S18.sql` — Migración consolidada S18 (5 bloques): (1) 3 ALTER FUNCTION SECURITY DEFINER sobre triggers de `eventos_mascota` (D-156); (2) DROP+CREATE policy `eventos_mascota_insert` con coherencia prestador/empleado (D-160); (3) **Fase F** parcial — RPC `crear_mascota_walkin` + ALTER CHECK + DROP policy laxa walk-in (D-157); (4) **Fase F core** — tabla `evento_identidad_personal` + ALTER `mascota_perfil_vigente` con columna `identidad_personal` jsonb + policy SELECT + 2 RPCs (`registrar_rasgo_identidad_personal`, `desactivar_rasgo_identidad_personal`); (5) ALTER FUNCTION `_trg_mascotas_crear_perfil_vigente` a DEFINER (D-162).
- `migrations/2026-05-15-S19.sql` — Migración consolidada S19 (3 bloques + 2 patches): (1) **Fase G** core — tabla `cliente_pendiente_registro` + 3 RPCs SECURITY DEFINER (`buscar_cliente_por_email`, `crear_alta_asistida_pendiente`, `crear_alta_asistida_existente`) + trigger `_trg_completar_pendiente_registro` sobre `profiles` + función `cleanup_pendientes_vencidos` + pg_cron diario 03:00 UTC; (2) ALTERs a CHECK constraints (`familia.tipo` + `pendiente_completar`, `mascotas.origen` + `alta_asistida`, `mascota_acceso_prestador.metodo_otorgamiento` + `alta_asistida_creada_por_prestador`, `notificaciones.tipo` + 3 nuevos) + 3 tipos nuevos en `cat_tipos_evento`; (3) REVOKE INSERT/UPDATE/DELETE de `mascota_perfil_vigente` (defense-in-depth D-166); patches: fix de columnas inventadas (cc.user_id → prestadores.user_id en RPCs, mascota_acceso_prestador.prestador_id → cuenta_comercial_id, eliminación de permisos_jsonb del INSERT en familia_miembro).

**Tablas nuevas (14 diseñadas, 10 ejecutadas en S17-S19):**
- ✅ Núcleo familia: `familia`, `familia_miembro`, `mascota_codueño`, `mascota_familiar_autorizado`.
- ✅ Núcleo mascota: `mascota_visibilidad_config`, `accion_destructiva_pendiente`.
- ✅ Núcleo caso clínico: `caso_clinico`, `caso_clinico_consultor`.
- ✅ Núcleo identidad personal: `evento_identidad_personal` (Fase F, S18). 5 subtipos (`personalidad/gusto/miedo/mania_ritual/senal_sutil`). FK opcional a `familia_miembro`. Materialización jsonb en `mascota_perfil_vigente.identidad_personal`.
- ✅ Núcleo alta asistida: `cliente_pendiente_registro` (Fase G, S19). Tabla buffer para clientes registrados por prestador que no han completado su perfil. TTL 30 días vía cleanup automático. FK a `prestadores`, `cuentas_comerciales`, `familia` (placeholder vía `familia_id_placeholder`). RLS habilitada con REVOKE INSERT/UPDATE/DELETE de authenticated (defense-in-depth).
- Núcleo hitos narrativos: `evento_hito_narrativo`, `hito_narrativo_privado_humano` (esta última **FUERA de `eventos_mascota`** — ver E1). Pendiente Fase H (S20+).
- Núcleo especies: `cat_especies_perfil`, `cat_especies_vocabulario`. Ejecutadas en Fase A.

**ALTERs a tablas existentes:**
- ✅ `mascotas`: + `familia_id`, `estado_vida`, `estado_vida_desde`. `user_id` deprecada (no eliminada en S16-S17, deprecación gradual). FK `mascotas.especie → cat_especies.codigo` confirmada existente.
- ✅ `cat_especies`: + `nivel_soporte`, `acepta_nuevos_registros`, `motivo_estado`, `updated_at` (Fase A).
- ✅ `cat_tipos_evento`: + `deprecado`, `deprecado_motivo`, `reemplazado_por`. 17 tipos nuevos. Deprecación de `transferencia_dueno` → `transferencia_familia` (Fase A).
- ✅ 6 tablas tipadas clínicas: + `caso_clinico_id` opcional (HC, medicación, examen, alergia, condición crónica, cirugía) (Fase E).
- ✅ `mascota_perfil_vigente`: + `identidad_personal jsonb NOT NULL DEFAULT '[]'` (Fase F, S18). Source-of-truth en `evento_identidad_personal`. Coexiste con `temperamento` (observaciones de prestadores — fuentes distintas).
- ✅ `mascota_acceso_prestador`: CHECK constraint `chk_metodo_otorgamiento_valido` ampliado con valor `'walkin_origen'` (S18 D-157).

**Funciones (9 nuevas en S17 + 3 RPCs nuevas en S18):**
- `user_tiene_acceso_a_mascota` — sigue como está de S14. Reescritura al modelo nuevo diferida a Fase K (D-158).
- ✅ `user_puede_ver_dimension(mascota_id, dimension)` nuevo — helper fino para visibilidad por dimensión.
- `calcular_momento_vital(mascota_id)` ⏳ Fase I (pendiente). Reemplazará gradualmente `calcular_etapa_vida` deprecada.
- Helpers nuevos S17 Fase B (5 SECURITY DEFINER): `_user_es_miembro_familia`, `_user_es_codueño_mascota`, `_user_es_familiar_autorizado_mascota`, `_familia_tiene_miembros_vigentes`, `_user_es_titular_familia`.
- Helpers nuevos S17 Fase E (2 SECURITY DEFINER): `_user_clinica_tratante_del_caso`, `_user_clinica_consultor_del_caso`.
- ✅ **RPCs nuevas S18 (3, todas SECURITY DEFINER + search_path acotado)**: `crear_mascota_walkin(p_prestador_id, p_nombre, p_especie, ...)` (D-157), `registrar_rasgo_identidad_personal(p_mascota_id, p_subtipo, p_titulo_corto, ...)` (Fase F), `desactivar_rasgo_identidad_personal(p_evento_id, p_motivo)` (Fase F). Las 3 con `REVOKE EXECUTE FROM PUBLIC; GRANT TO authenticated`.
- ✅ **RPC nueva S46**: `registrar_vacunas_de_carnet(p_mascota_id, p_vacunas jsonb)` — **SECURITY INVOKER** (la RLS del dueño ES la puerta: rama titular de `vacuna_insert` por `mascotas.user_id`; hereda A SABIENDAS la brecha co-dueño D-294), atómica (una fila mala = cero escritas), errores tipados por shape (`sin_acceso_mascota` / `vacunas_vacias` / `item_invalido: <n>: <motivo>`); el trigger `_trg_vacuna_crear_evento` crea los eventos padre. Su insumo es la Edge Function `extract-vacuna` **v16**, que desde S46 vive en el monorepo re-targeteada al modelo real (cierra la pata extract-vacuna de D-283; el resto de D-283 — tablas muertas v2 — sigue abierto).

**Patrón arquitectónico establecido en S18:** RPCs SECURITY DEFINER como puerta única de entrada para flows que mutan múltiples tablas con RLS. Razón: `mascota_perfil_vigente` tiene RLS habilitada pero solo policy SELECT (D-166); el patrón viejo "trigger INVOKER que propaga al perfil" depende de que la entrada sea via DEFINER. Decisión arquitectónica: nuevas tablas/flows usan RPCs (Fase F las usa); existentes (17 triggers `_trg_*_crear_evento`, D-165) quedan pendientes de migración.

**Triggers nuevos:**
- ✅ `auto_crear_visibilidad_config` (AFTER INSERT en `mascotas`) (Fase D).
- ✅ `validar_codueño_es_titular` (BEFORE INSERT/UPDATE en `mascota_codueño`) (Fase B).
- ✅ `validar_familiar_no_es_codueño` (BEFORE INSERT/UPDATE en `mascota_familiar_autorizado`) (Fase B).
- ✅ `propagar_estado_vida_desde_evento` (AFTER INSERT en `eventos_mascota`, solo para tipos `extravio_reportado`/`extravio_resuelto`/`fin_vida`) (Fase C).
- (Fase F NO usa triggers — la materialización al perfil vigente vive inline en las RPCs por decisión T-S18.38.)

**Fix de drift cerrado en Bloque 9:**
- D-128: 4 triggers de tablas tipadas actualizados para usar códigos correctos del catálogo. `intervencion_permanente` agregado al catálogo. (Fase A parcial en S16; Fases H restantes pendiente S19+.)
- D-119: documentación E4 sincronizada con schema real (S16).
- D-156 (S18): 3 triggers de `eventos_mascota` pasados de SECURITY INVOKER a DEFINER. Bug pre-launch crítico resuelto.
- D-160 (S18): policy `eventos_mascota_insert` ampliada con coherencia `prestador_id` / `empleado_id` contra el authenticated. Bug pre-existente expuesto por el fix de D-156 (ver L-078).
- D-162 (S18): `_trg_mascotas_crear_perfil_vigente` también a SECURITY DEFINER. Runtime test end-to-end pendiente para flow cliente regular.
- D-159 (S18): auditoría completa de triggers contra `information_schema.columns`. 0 drifts. L-076 confirmada.

**Plan de ejecución:** 11 fases A-K documentadas en sesión.

- ✅ Fase A: catálogos extendidos (ejecutada en S16, migración `29c1a9f`).
- ✅ Fase B: núcleo familia + RLS (ejecutada en S17, migración `2026-05-14-S17-fase-B.sql`).
- ✅ Fase C: mascota refactor (ejecutada en S17, migración `2026-05-14-S17-fase-C.sql`).
- ✅ Fase D: visibilidad por dimensión (ejecutada en S17, migración `2026-05-14-S17-fase-D.sql`).
- ✅ Fase E: caso clínico (ejecutada en S17, migración `2026-05-14-S17-fase-E.sql`).
- ✅ **Fase F: identidad personal (ejecutada en S18, parte de migración `2026-05-15-S18.sql`).** Patrón RPCs SECURITY DEFINER establecido.
- ✅ **Fase G: alta asistida cliente+mascota (ejecutada en S19, parte de migración `2026-05-15-S19.sql`).**
- Fases H-J: pendientes S20+. Aditivas (bajo riesgo). Cubren hitos narrativos y helpers avanzados.
- Fase K: reescritura de 88 policies RLS. Requiere sesión dedicada con runtime test entre cada policy. Ver D-154 (pre-lectura obligatoria antes de tocar policies) y D-158.

Total estimado restante: 1-2 sesiones de trabajo más.

**Deudas detectadas en S18 no cerradas (ver CLAUDE.md backlog):**
- D-161 (MEDIA): drift de tipos entre helper `_debe_logear_atencion` y CASE de `_trg_eventos_auto_log_atencion`. Requiere decisión legal/regulatoria de qué tipos logean en `prestador_atencion_log`.
- D-165 (MEDIA): 17 triggers `_trg_*_crear_evento` + helper `_crear_evento_padre_auto` son SECURITY INVOKER. Patrón D-156 sobre tablas tipadas, sesión de hardening dedicada.
- D-166 (S18, cerrada S19): originalmente ALTA (RLS habilitada solo con policy SELECT). Mitigada en S19 con REVOKE INSERT/UPDATE/DELETE de `mascota_perfil_vigente` desde authenticated (defense-in-depth, manteniendo patrón "RPCs DEFINER puerta única"). Decisión arquitectónica: opción (c) defense-in-depth sin policies INSERT/UPDATE/DELETE redundantes.

### Pendiente (bloques 6, 7, 8 + runtime testing)

Cada uno con su D-NNN en CLAUDE.md:

- **D-107** ✅ CERRADA (S14) — Runtime test `completar_historia_clinica` + fix B1 + test C1.
- **D-108** ✅ CERRADA (S14) — Bloque 6 RLS soft launch base.
- **D-109** ✅ CERRADA (S14) — Bloque 7 TS wrappers, build limpio.
- **D-110 (BLOQUEANTE)** — Bloque 8 UI: modales + páginas + timeline.
- **D-111 (ALTA)** — Validación veterinaria de umbrales `calcular_etapa_vida`.
- **D-115** ✅ CERRADA (S14, parte de D-108) — RLS vacunas permite vet aplicar.
- **D-117 (MEDIA)** — Trigger `prestadores_habituales` pendiente.
- **D-118 (ALTA)** — Repo `e-petplace-v2` puede consumir vista `v_bio_expediente` dropeada.
- **D-123 (ALTA)** — Tests faltantes de tablas tipadas (alergias, condiciones, intervenciones, microchip, temperamento, emergencia, certificado, medicación administrada).
- **D-128 (BLOQUEANTE)** — Drift catálogo `cat_tipos_evento` vs triggers (4 tablas con INSERT roto en producción).
- **D-130 (ALTA)** — `completar_historia_clinica` acepta `proxima_cita_*` pero no los persiste.

Otras deudas relevantes en CLAUDE.md sección "Backlog canónico": D-112 a D-116, D-119 a D-132.

### Progreso del Bio-Expediente

| Componente | Estado |
|---|---|
| Modelo conceptual | ✅ S12 v0.1 + S13 v0.2 + S14 v0.3 + S16 v0.4 |
| Schema DB base | ✅ S13 Bloque 4 |
| Schema DB refactor S16 | ✅ Fases A/B/C/D/E (S16-S17) + Fase F (S18). 6 de 11 fases. |
| Triggers | ✅ S13 Bloque 5 + 4 triggers S17 + ALTERs SECURITY DEFINER S18 (D-156, D-162) |
| Función `completar_historia_clinica` | ✅ S13 + fix B1 S14, runtime validado |
| RPCs SECURITY DEFINER (patrón S18) | ✅ 3 RPCs: `crear_mascota_walkin`, `registrar_rasgo_identidad_personal`, `desactivar_rasgo_identidad_personal` |
| RLS | ✅ S14 Bloque 6 (88 policies) + S17 (~50 nuevas) + S18 (policy `eventos_mascota_insert` ampliada, policy `evento_identidad_personal_select`). Reescritura completa diferida a Fase K (D-158). |
| TS wrappers | ✅ S14 Bloque 7 (commit `d36e071`) |
| UI | ⏳ Pendiente Bloque 8 (D-110) |
| Runtime end-to-end | ✅ S14 (D-107 happy path + D-108 RLS) + S18 (9 tests: D-156, D-160, D-157, Fase F) |

**Estado real: ~92% del Bio-Expediente funcional.** Faltan: UI Bloque 8 (D-110, wrappers TS + modal alta asistida + RPCs DB ya hechos en S19; UI MascotaDetalle + timeline page diferidos a S20+), Fase H (hitos narrativos), Fase I (calcular_momento_vital), Fase J (helpers avanzados), Fase K (reescritura policies RLS al modelo nuevo).

### Cómo arrancar sesión sobre Bio-Expediente

Si tomás una sesión nueva sobre Bio-Expediente:

1. Leer este documento entero.
2. Leer sección "Backlog canónico" de CLAUDE.md filtrando por deudas Bio-Expediente (D-106 a D-118).
3. Leer Sesión 13 en CLAUDE.md para entender qué se hizo y por qué.
4. Primera acción del bloque de trabajo: runtime test (D-107) si todavía no se hizo.
5. Avanzar en orden Bloque 6 → 7 → 8.
6. Cualquier decisión que toque modelo conceptual: comparar con sección "Decisiones de modelo cerradas en S13" antes de proponer cambios.

---

## Cómo usar este documento

- **Antes de cualquier sesión que toque data de mascota**: Claude (web y code) lee este documento primero.
- **Si una decisión nueva contradice algo**: se discute en sesión y se actualiza la sección correspondiente (no se ignora).
- **Si surge tipo de evento nuevo no listado**: se agrega en E2 con su clasificación (puede_ser_raiz, puede_ser_subevento, propaga_a_perfil, eje al que pertenece).
- **Si surge actor nuevo no listado**: se agrega en A1 con sus capacidades (contribuye/lee, tipo, vista parcial).

---

## Historial de versiones

- **v0.1 (11 May 2026 — S12)**: Discovery completo. Esqueleto inicial con principios, actores, eventos, estructura, acceso, IA/monetización. Pendientes técnicos listados.
- **v0.2 (11 May 2026 — S13)**: Schema completo ejecutado en DB (Bloque 4: 4 catálogos + 1 central + 3 núcleo + 18 tablas tipadas + 1 anexa + integración wearables). Triggers completos (Bloque 5: 31 triggers de coherencia, propagación, append-only). Función `completar_historia_clinica` reescrita end-to-end. Sección "Estado de implementación" agregada (incluye decisiones de modelo, patrones operacionales, advertencia de runtime no probado). Pendientes: Bloque 6 (RLS), Bloque 7 (TS), Bloque 8 (UI), runtime testing.
- **v0.3 (12 May 2026 — S14)**: D-107 cerrada (runtime test + fix B1 incorporado en `completar_historia_clinica`). D-108 cerrada (Bloque 6 RLS soft launch base: 88 policies en 25 tablas + helper `user_tiene_acceso_a_mascota`). D-109 cerrada (Bloque 7 TS wrappers + build limpio en commit `d36e071`). H6/D-115 (vet aplicar vacuna) y H9 (`citas_insert_all` permisiva) resueltos. Estado real: ~85%.
- **v0.4 (13 May 2026 — S16)**: Refactor de integración. DDL conceptual cerrado para Bloque 9 (13 tablas nuevas + ALTERs + 3 funciones + 4 triggers). Sección E1 ampliada con aclaración sobre `hito_narrativo_privado_humano` como entidad fuera del Bio-Expediente (D15.4 materializada en schema). Sección E4 actualizada con schema real de `mascota_perfil_vigente` post-S14 (cierra D-119). Modelo de integración con familia + co-dueños + caso clínico + identidad personal + multi-especie articulado. Ejecución del Bloque 9 pendiente Sub-bloque 5 (S17+). Documento complementario nuevo: `POLITICAS_EPETPLACE.md` con 12 políticas operativas derivadas.
- **v0.5 (14 May 2026 — S17)**: Fases B/C/D/E del Bloque 9 ejecutadas en DB. 8 tablas nuevas (familia, familia_miembro, mascota_codueño, mascota_familiar_autorizado, mascota_visibilidad_config, accion_destructiva_pendiente, caso_clinico, caso_clinico_consultor). ALTERs a mascotas (familia_id, estado_vida, estado_vida_desde + backfill). 6 ALTERs a tablas tipadas clínicas (caso_clinico_id). 9 funciones nuevas (`user_puede_ver_dimension` + 7 helpers SECURITY DEFINER de Fases B/E + función de propagación de estado_vida). ~50 RLS policies. 4 triggers nuevos. 19 tests pasados. D-133, D-136, D-142, D-143, D-150 cerradas. D-156 detectada (🔴 BLOQUEANTE triggers SECURITY INVOKER). Bloque 9: 5 de 11 fases ejecutadas.
- **v0.6 (15 May 2026 — S18)**: D-156 cerrada (3 triggers de `eventos_mascota` a SECURITY DEFINER + search_path acotado). D-160 detectada y cerrada en misma sesión (policy `eventos_mascota_insert` ampliada con coherencia `prestador_id`/`empleado_id`/authenticated). D-157 cerrada con arquitectura limpia: RPC `crear_mascota_walkin` SECURITY DEFINER como puerta única, drop de policy laxa, ALTER CHECK de `mascota_acceso_prestador` para agregar `'walkin_origen'`. **Fase F ejecutada**: tabla `evento_identidad_personal` (5 subtipos, FK a `familia_miembro`, soft-delete coherente), ALTER `mascota_perfil_vigente` con columna `identidad_personal jsonb`, policy SELECT única, 2 RPCs SECURITY DEFINER (`registrar_rasgo_identidad_personal`, `desactivar_rasgo_identidad_personal`). Materialización inline en RPCs (sin trigger). D-162 cerrada técnicamente (trigger mascotas a DEFINER, runtime test pendiente). D-159 cerrada (auditoría triggers vs columnas, 0 drifts). Patrón arquitectónico establecido: **RPCs SECURITY DEFINER como puerta única de entrada** para tablas con RLS sin policies INSERT/UPDATE/DELETE. 9 tests runtime pasados con SET LOCAL ROLE authenticated. 3 deudas nuevas detectadas (D-161, D-165, D-166). 5 lecciones nuevas (L-078 a L-082). Drift documental corregido: `nota_dueño` → `nota_dueno`. Migración consolidada: `migrations/2026-05-15-S18.sql`. Bloque 9: 6 de 11 fases ejecutadas.
- **v0.7 (15 May 2026 — S19)**: **Fase G ejecutada** (alta asistida cliente+mascota). Tabla `cliente_pendiente_registro` + 3 RPCs SECURITY DEFINER (`buscar_cliente_por_email`, `crear_alta_asistida_pendiente`, `crear_alta_asistida_existente`) + trigger `_trg_completar_pendiente_registro` sobre `profiles` + cleanup `cleanup_pendientes_vencidos` via pg_cron diario. ALTERs a CHECK constraints de `familia.tipo`, `mascotas.origen`, `mascota_acceso_prestador.metodo_otorgamiento`, `notificaciones.tipo` + 3 tipos nuevos en `cat_tipos_evento`. D-166 mitigada con REVOKE INSERT/UPDATE/DELETE de `mascota_perfil_vigente` desde authenticated (defense-in-depth). D-128 Fase H verificada cerrada (16 triggers usando códigos válidos del catálogo). Política P13 agregada a `POLITICAS_EPETPLACE.md` (alta asistida por prestador). Migración consolidada: `migrations/2026-05-15-S19.sql`. Bloque 9: 7 de 11 fases ejecutadas.
