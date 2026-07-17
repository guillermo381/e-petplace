# REPORTE S67 — V0: LA FUNDACIÓN DEL MODELO DE ACTOR (aplicada)

Migración: `supabase/migrations/20260717170000_v0_fundacion_modelo_actor.sql`
(2953+ líneas, verificación imperativa ADENTRO — toda falla aborta todo).
Aplicada a la DB linked el 2026-07-17 con `supabase db push`.
Protocolo: dry-run completo del cuerpo entero con abort forzado al final
(rollback probado, residuos 0 verificados por conteo) → aplicación real.
Juez: **VERDE en la corrida real** (Opción 1 firmada: identidad con
whitelist computada; las 2 citas del 23-24/07 consagradas como fixture).

## Por tramo (evidencia)

### T1 — Titular materializado (camino b)
- 4 prestadores → 4 personas `rol='dueño'` (1 c/u, assert de unicidad).
- **Las 5 franjas de Satori, muertas** — SELECT probatorio (emitido por
  RAISE NOTICE en la migración; relevado idéntico pre-migración):
  `ec71f174` lun 08-18 · `eb805255` mar 08-18 · `70e0d4e7` mié 08-18 ·
  `ae43ef66` jue 08-18 · `d859b44f` vie 08-18 — todas del prestador
  `2052f109` (Satori Latam sas), empleado `2e989931` ("Test Empleado"),
  slot 30, cupo 1, `servicio_id NULL`. Asserts: exactamente 5, todas de
  ese par, DELETE con ROW_COUNT=5.
- Backfill al titular: 18 franjas · **14** `evento_atencion` ·
  **56** `evento_cita_servicio` (enmienda blessed). NOTA DECLARADA: el
  relevamiento del 17-07 AM contó 13 atenciones; la DB viva sumó UNA
  legítima el mismo día (adiestramiento de Andres, cita 17/07 08:00,
  atención `fbb4d6c8` iniciada 18:33 UTC estado 'terminada', empleado
  NULL) — el ancla del assert se re-fijó a 14 con esta fila literal.
- NOT NULL: `prestador_horarios.empleado_id` ✅ ·
  `evento_atencion.empleado_id` ✅ (verificado contra callers: las
  únicas rutas de INSERT son `iniciar_atencion_*`, reescritas para
  resolver persona; los `simular_prestador_inicia_*` delegan en ellas).
- DECLARADO: `evento_cita_servicio.empleado_id` queda NULLABLE — todos
  los escritores del monorepo escriben persona desde V0 y el backfill
  cubrió la historia; el NOT NULL duro espera relevar escritores fuera
  del monorepo (admin). Cero silencio: está acá.

### T2 — Motor generalizado
- `_agenda_ocupacion(p_empleado_id, …, p_tipo_servicio)` — DROP de la
  firma vieja (L-119) + función nueva: ocupación por PERSONA, regla de
  mezcla EN LA FUENTE (ocupante de otro servicio ⇒ 32767 saturado;
  mismo servicio ⇒ tamaño del grupo). Intactos: firmes + holds
  vigentes, D-349, máximo de solape.
- Capacidad efectiva en TODOS los callers:
  `LEAST(COALESCE(max_citas_por_slot,1), COALESCE(cupo_techo,1))` —
  exclusiva (techo NULL) ⇒ 1; paseo ⇒ min(franja, 4).
- Los 11 callers reescritos (los 4 no-obvios incluidos):
  `_inicios_disponibles_prestador` (unión de ventanas de personas
  habilitadas: dueño siempre; empleado vía `prestador_empleado_servicios`),
  `obtener_inicios_paseo_disponibles`, `obtener_paseadores_disponibles`,
  `obtener_slots_disponibles` (cupos = mejor resto entre personas),
  `crear_bloqueo_agenda` (fija persona en el hold: la disponible; a
  igualdad, menor carga del día — ORDER BY carga de citas del día),
  `_generar_citas_programa`, `_generar_citas_plan`,
  `reservar_salida_paquete`, `reagendar_cita_suelta`,
  `reagendar_sesion_programa`, `saltar_cita_plan` (la persona de la
  cita viaja con ella). `vencer_programas_adiestramiento` solo
  mencionaba el helper en un comentario — sin cambio.
- Cinturón: assert en la migración — ningún caller de
  `_agenda_ocupacion(` sin la marca `V0-actor` en el body.
- Firmas públicas de los `obtener_*_disponibles`: INTACTAS (los 4
  QUIÉN/inicios de grooming/adiestramiento ni se tocaron — consumen
  `_inicios_disponibles_prestador`).
- L-140: la función nueva nació con REVOKE total (helper interno);
  sonda `proacl` de las 19 funciones tocadas al final de la migración —
  **cero `anon=`** (el simulador traía un grant anon PREEXISTENTE y
  murió acá, con su guard `test_guard_activo()` como puerta funcional).

### T3 — Concurrencia declarada
`tipos_servicio.concurrencia` ('exclusiva' NOT NULL default | 'cupo') +
`cupo_techo` (CHECK de coherencia). Seed firmado: los 5 tipos de
categoría paseo ⇒ cupo techo 4. Nadie más declara nada (§3 literal).

### T4 — Procedencia + reseñas
- `cat_tipos_evento.es_clinico` (14 códigos: los registrables §13 —
  el eje 'salud' NO alcanzaba: `cita_servicio` y `emergencia_solicitada`
  son transaccionales y quedaron fuera, decisión declarada).
- `eventos_mascota.procedencia` CHECK
  ('declarado_por_familia'|'verificado_por_prestador'); backfill: los
  24 eventos clínicos vivos (todas vacunas del carnet) ⇒
  'declarado_por_familia'; gate por trigger `BEFORE INSERT`
  (`procedencia_requerida` para tipos clínicos); la puerta única
  `_crear_evento_padre_auto` estampa 'declarado_por_familia' —
  'verificado_por_prestador' queda TIPADO SIN PRODUCTOR hasta la
  verificación del vet (§14.2), comentado en la fuente.
- `prestador_resenas.empleado_id` (FK SET NULL) sobre 0 filas (assert).

### T5 — Curas y catálogo
- **D-414 ✅**: `caso_clinico_insert_vet` recreada — `with_check`
  original + `EXISTS mascota_acceso_prestador` (cuenta↔mascota con
  vigencia). Literal post-cura (pg_get_expr):
  `(… pertenencia usuario↔cuenta …) AND (EXISTS ( SELECT 1 FROM
  mascota_acceso_prestador map WHERE map.mascota_id =
  caso_clinico.mascota_id AND map.cuenta_comercial_id =
  caso_clinico.cuenta_comercial_tratante_id AND map.revocado_en IS NULL
  AND (map.expira_en IS NULL OR map.expira_en > now())))`.
- **D-418 ✅**: `requiere_resultado=false` en los 11 médicos (assert
  previo: único false = `registro_evento`).
- **D-424 ✅**: `especies_elegibles` de los 11 médicos = las **11**
  especies del catálogo completo (techo firmado, no las 6 activas).
- **Vacunas EC**: `cat_vacunas` (7 filas = el vocabulario CERRADO de
  extract-vacuna v21: antirrábica, múltiple, tos de las perreras,
  leptospirosis, giardia, triple felina, leucemia felina), todas
  `es_seed_preliminar=true`; RLS lectura pública patrón catálogo; SIN
  FK desde `evento_vacuna_aplicada` — el texto libre sigue legal.
- **D-415 ✅ absorbida** (cura ratificada: NULL honesto): 8 códigos
  fantasma ⇒ `tabla_tipada=NULL`; nacen las 3 tablas de caso
  (`evento_caso_clinico_abierto/cerrado/transferido`, doble referencia
  cuenta+persona, RLS lectura por acceso a mascota, SIN escritores
  hasta V4); nace `verificar_coherencia_tablas_tipadas()` (ancla legal
  `evento_id` O `evento_atencion_id` — hallazgo de la corrida: el
  chasis de tres capas ancla su oficio en la capa) y corrió como
  assert: **0 incoherencias**.

### T6 — El juez (intra-transacción, mismo now())
- QUIÉN a las 10:00 (paseadores 30/60, groomers ×2, adiestradores):
  identidad ESTRICTA multiset — VERDE.
- Inicios/slots: cero apariciones nuevas; faltantes SOLO con
  justificación computada (solape con exclusiva firme); slots comunes:
  paseo byte a byte, exclusivas recortadas a exactamente 1 desde ≥1.
- **FIXTURE consagrado**: las 2 citas de adiestramiento (23-24/07
  08:00-09:00, franjas cupo 3) NO se tocaron; asserts positivos: el
  ANTES las ofertaba (el agujero probado) y el DESPUÉS ya NO oferta
  08:00/08:30 en ningún oficio. Verificación en vivo post-aplicación:
  `obtener_inicios_paseo_disponibles('2026-07-24',30)` = 09:00…17:00.
- min(franja, techo) sobre la franja 3/1/4 de Andres: domingo 08:00
  cupos=4 · viernes 09:00 cupos=3 · viernes 15:00 cupos=1 — asserts.
- Sondas P1..P11 (con rollback y residuos 0 verificados): hold con
  persona desde el primer segundo · doble-booking bloqueado · grupo
  del mismo servicio comparte (D-385 legible: 2 citas del bloque) ·
  mezcla imposible · exclusiva bloquea todo (incluso a sí misma) ·
  'pagada' ⟺ confirmar_cita_pagada · grooming con snapshot por talla
  ($8.00/60' Zeus M local) · programa entero al comprar (6 sesiones,
  suma exacta $160.00, todas con persona) · reagenda entre vecinas ·
  orden_programa_violado · sesion_anterior_abierta en la fuente.
- Cierres y `confirmar_cita_pagada` INTACTOS por firma md5 ANTES/DESPUÉS.

### T7 — Wrappers TS (motor-adyacente, único código permitido)
- Nace `packages/api/src/wrappers/titular.ts` (`obtenerTitularId`).
- Los 6 `.is('empleado_id', null)` resuelven titular con contrato
  hacia pantallas IDÉNTICO: `configuracionPaseo.ts`
  (obtenerFranjasHorario · crearFranjaHorario — el INSERT porta
  `empleado_id` titular, NOT NULL manda · editarFranjaHorario) y
  `horarios-modo.ts` (eliminarFranjasPrestador · obtenerFranjasDeServicios
  · crearFranjaServicio).
- Tipos regenerados (`gen:types`, +322 líneas aditivas). Typecheck
  VERDE en `@epetplace/api` y en AMBAS apps (`packages/domain` falla
  por `@types/emscripten` PREEXISTENTE — sin relación, no tocado).
- E2E `scripts/verify-titular-franjas-s67.mjs` con sesión demo:
  **13/13 VERDES** (titular resuelto · franja nace con persona ·
  solape por titular · guard D-386 rebota tipado · limpieza por id,
  residuos 0). `eliminarFranjasPrestador` no se ejerció en vivo
  (borraría la agenda real del demo) — mismo filtro titular, declarado.

## Deudas
- **Cerradas con evidencia**: D-414 · D-415 · D-418 · D-424 (entradas
  actualizadas en DEUDAS_CANONICAS.md).
- **D-426 INTACTA** (decisión firmada: no se absorbe — es UI; la
  fundación dejó la puerta: franjas por persona×servicio ya posibles).
- **D-423 nota**: la fundación NO la toca (capacidad de lugar y
  recursos físicos siguen diferidos con su disparo).

## Guion de humo en dispositivo (gate founder)
1. Reservar un paseo, un grooming y una sesión — IDÉNTICOS a ayer.
2. **El check positivo (enmienda founder): intentar reservar con
   Andres el 23 o el 24 a las 08:00 — la app NO debe ofrecerlo**
   (ni 08:00 ni 08:30, en ningún oficio): el agujero del doble-booking
   del titular, cerrado ante tus ojos.

## NO tocado (orden explícita)
UI · snapshot de precio (probado ortogonal por md5 + P6/P7) · cierres
(md5 idéntico) · MODELO_*.md (las enmiendas las dicta el arquitecto
post-gate).
