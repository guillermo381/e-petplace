# Deudas canónicas — e-PetPlace Portal Prestadores

> Inventario completo D-001 a D-259. Extraído de CLAUDE.md en S29 (21 May 2026), mantenido por sesión.
> Para el plan de construcción por fases, ver `BACKLOG_PORTAL_PRESTADORES.md`.

## Backlog canónico

> Numeración D-NNN (Deuda y features). Una sola fuente de verdad.
> Cada ítem: ID nuevo + título + descripción + origen + prioridad +
> referencia a IDs viejos donde aplique.
>
> Origen: S6, S7, S8, S9, S10, "Planning 8 mayo", "external" (otros repos).
> Prioridad:
> - 🔴 BLOQUEANTE — sin esto no se puede tener primer prestador real funcionando
> - 🟡 ALTA — necesario para flujo completo, no urgente para piloto inicial
> - 🟢 MEDIA — importante, post-MVP de operación
> - ⚪ BAJA — nice-to-have / pulido
> - ⏸ DIFERIDA — sin criterio de disparo claro o dependencia externa

### 🔴 Bloqueantes para primer prestador real

#### D-001 — Admin: ver documentos del prestador ✅
Sin esto el admin no puede aprobar y nadie pasa de pendiente a activo.
Origen: S8 / Para integrar admin/v2. Prioridad: 🔴.
(consolida #24)
Cerrado en sesión coordinada del 10 May 2026 (agente portal-admin).
Helper src/lib/storage.ts en portal-admin con generarSignedUrl(bucket, path, expirySeconds).

#### D-002 — Bug convención dia_semana entre prestador y admin ✅
Prestador configura horario L-S, admin lo ve M-D. Aprobación incorrecta. Probablemente conversión `getDay()` JS (0=domingo) vs Postgres / convención del modelo. Releva primero.
Origen: S9 / Para integrar admin/v2. Prioridad: 🔴.
(consolida #21)
Cerrado en sesión coordinada del 10 May 2026.
- Sub-bloque A (este repo): migración 20260510 con CHECK + COMMENT documentando convención 0=Domingo. Commit 66be7ed.
- Sub-bloque B (portal-admin): helper src/lib/dias_semana.ts + fix bug funcional en Citas.tsx que aplicaba mapa JS_TO_DB innecesario.
- Sub-bloque C (este repo): relevamiento confirmó que portal-prestadores ya usaba convención correcta consistentemente.

#### D-003 — Notificaciones visibles para prestador en estado pendiente/en_revision ✅
Hoy la sección de notificaciones está oculta para prestadores en limbo. Necesario para que se enteren de aprobación de documentos y otros eventos. Distinto de D-018 (configuración).
Origen: S10. Prioridad: 🔴.
Cerrado el 10 May 2026. Fix en 2 archivos:
- src/lib/usePrestador.ts: canAccess('notificaciones') ahora devuelve true para pendiente/en_revision/activo (no solo activo).
- src/App.tsx: /notificaciones agregada a RUTAS_LIMBO_OK.
Runtime verificado en localhost. Commit del fix junto a este cierre.

#### D-004 — Sistema de notificaciones bidireccional admin↔prestador ✅
Admin podía cambiar estados pero prestador no recibía notif (detectado en runtime de D-003 el 10 May). Implementación con triggers DB sobre `prestadores` y `prestador_documentos` cubre 6 eventos admin→prestador. Bloque B/C (cliente→prestador) diferido a D-101 + D-102.
Cerrado el 11 May 2026. Ver detalle en Sesión 12.
Origen: S6/S7 + S10. Prioridad: 🔴.
(consolida #29, #30, #31)

#### D-005 — Empleados: relevamiento + fix integral del flujo ✅
Módulo de empleados estaba roto post-S10 por desconexión entre policies RLS (que exigían fila dueño en `prestador_empleados`) y wizard v2 que no creaba esa fila. Fix integral en 4 sub-bloques durante Sesión 11.
Cerrado el 10 May 2026. Ver detalle completo en Sesión 11.
Origen: S10. Prioridad: 🔴.

#### D-006 — Activar PITR / snapshots automáticos en Supabase ✅
15 min de setup, sin código. Mitigación de riesgo de DB compartida con producción.
Origen: S10. Prioridad: 🔴.
(consolida #98)
Cerrado el 10 May 2026 con upgrade a plan Pro de Supabase ($25/mes).
Daily backups activos con retención 7 días. PITR no se activó (es
add-on adicional de $100/mes); se mantiene como deuda nueva con
criterio de disparo: cuando arranque flujo Kushki real con
transacciones en producción.

#### D-007 — Ambiente staging separado de producción
Hoy localhost y producción apuntan a la misma DB Supabase. Riesgo bajo hoy, alto cuando primer prestador real se registre.
Origen: S10. Criterio de disparo: antes del primer prestador real registrado en producción. Prioridad: 🔴.
(consolida #97)

### 🟡 Catálogos y datos

#### D-008 — Vacunación: catálogo de vacunas alimenta el servicio
Lo que se cobra son las vacunas, no la vacunación. Necesario para veterinarios. Si primer prestador es grooming u hotel, no bloquea.
Origen: S10. Prioridad: 🟡.
**Enmienda S48-A4:** el vocabulario cerrado del prompt de `extract-vacuna` v17 (antirrábica · múltiple · tos de las perreras · leptospirosis · giardia · triple felina · leucemia felina) es PROTO-CATÁLOGO — la primera encarnación viva de esta deuda. Cuando `cat_vacunas` exista, la function lee el vocabulario de DB, no del prompt (regla 21: el prompt hoy es el hardcode consciente, con esta deuda como criterio de salida).
**Nota S48-B7:** la columna `tipo_vacuna` convive en DOS dialectos — el vocabulario cerrado que escribe la extracción y el texto libre de la edición manual (la Hoja de revisión acepta cualquier string). `cat_vacunas` los normaliza cuando exista, y el backfill retroactivo de D-306 debe saberlo: no puede asumir que todo tipo guardado pertenece al vocabulario.

#### D-009 — Catálogo categorías/especialidades por tipo de prestador
Origen: Planning 8 mayo. Prioridad: 🟡.
(consolida #70)

#### D-010 — Catálogo documentos requeridos por tipo de prestador
Origen: Planning 8 mayo. Prioridad: 🟡.
(consolida #71)

#### D-011 — Plantillas descripción sugerida por tipo prestador
Origen: Planning 8 mayo. Prioridad: 🟡.
(consolida #72)

#### D-012 — Auditoría de contratos, paseos y paquetes de paseos
Revisar coherencia y completitud. Tarea de relevamiento, no implementación.
Origen: S10. Prioridad: 🟡.

### 🟡 Multi-sede y gestión post-aprobación

#### D-013 — Módulo "agregar sede" (segundo prestador en cuenta_comercial existente)
Crear segundo prestador desde el portal (no desde wizard). Requiere UI nueva en sección "Sedes" + RPC `crear_prestador_adicional` con guard de ownership. Habilitado por modelo refinado en S10.
Origen: Planning 8 mayo + S9 + S10. Prioridad: 🟡.
(consolida #75, #92, #99)

#### D-014 — Rol "admin de cuenta" para vista multi-sede
Cuando aparezca caso de cadenas (dueño con N sedes que necesita ver todas), creamos rol nuevo aprobado desde portal-admin.
Origen: S10. Prioridad: 🟡.
(consolida #100)

#### D-015 — Diseño y guard de gestión de documentos post-aprobación
Evitar que prestador borre permisos críticos (ej: permiso de funcionamiento). Requiere decisión de producto antes de codear.
Origen: S10. Prioridad: 🟡.

#### D-099 — TyC + políticas para empleados al aceptar invitación
Tanto en flow nuevo (link de invitación, `AceptarInvitacion.tsx`) como pet_parent_existente (modal al primer login, `ModalInvitacionPendienteLogin`), el empleado acepta sin checkbox de TyC. Decisión MVP: las TyC del prestador (cuando se redacten, depende de D-088) incluyen cláusula "el prestador es responsable por las acciones de sus empleados invitados a la plataforma". Re-evaluar acceptación explícita del empleado en mercados con protección laboral estricta (USA, España).
Origen: S11. Prioridad: 🟡 ALTA.
Criterio de disparo: antes del primer prestador real registrado + revisión legal D-088.
Dependencia: D-061 (página /legal/privacidad), D-088 (revisión legal con abogado).

#### D-101 — Conectar flujo "cliente agenda cita" al schema real de `citas` (repo e-petplace-v2)
Confirmado por founder en S12: la UX de "cliente agenda cita" existe en repo e-petplace-v2 pero está desconectada del schema real (datos ficticios usados durante construcción del repo cliente antes de existir portal-prestadores). Requiere trabajo en repo paralelo, no en portal-prestadores.
Origen: S12. Prioridad: 🟡 ALTA.
Criterio de disparo: antes de que un prestador real reciba citas externas.
Dependencia: trabajo en repo e-petplace-v2.

#### D-102 — Triggers de notificación cliente→prestador (Bloque B + emergencias)
Pendientes los eventos: nueva cita agendada por cliente, cita cancelada por cliente, cita reagendada por cliente, solicitud de emergencia recibida. Patrón ya validado en S12 — replicar con triggers sobre `citas` y `solicitudes_emergencia`.
Origen: S12. Prioridad: 🟡 ALTA.
Criterio de disparo: D-101 cerrada (flujo end-to-end existe).

### 🟢 UX

#### D-016 — Editar especie en activación de servicios debe ser inline
Hoy aparece como botón separado. Debe ser inline donde se activa el servicio.
Origen: S10. Prioridad: 🟢.

#### D-017 — UX post-wizard: bienvenida + banner + modal progreso
Para usuarios en estado pendiente que entran al portal por primera vez.
Origen: S9. Prioridad: 🟢.
(consolida #96)

#### D-018 — Configuración de notificaciones (qué eventos suscribir)
Origen: Backlog módulos. Prioridad: 🟢.
(consolida #46)

#### D-019 — Foto perfil + galería con upload
Origen: Mejoras UX. Prioridad: 🟢.
(consolida 20 sin # de "Mejoras UX")

#### D-020 — Horarios v2
Origen: Mejoras UX. Prioridad: 🟢.
(consolida 16-19 sin # de "Mejoras UX")

#### D-021 — Preview integrado de documentos
Origen: Mejoras UX. Prioridad: 🟢.
(consolida 22 sin # de "Mejoras UX")

#### D-022 — Subir documentos opcionales
Origen: Mejoras UX. Prioridad: 🟢.
(consolida 23 sin # de "Mejoras UX")

### 🟢 Módulos por construir

#### D-023 — Métricas / Dashboard
Origen: Módulos por construir. Prioridad: 🟢.
(consolida #41)

#### D-024 — Liquidaciones
Vista de liquidaciones del prestador. Depende de cuentas_comerciales pobladas y wiring eventos_economicos.
Origen: Módulos por construir. Prioridad: 🟢.
(consolida #42, #65 Sprint 3.1.D)

#### D-025 — Mensajes con cliente
Origen: Módulos por construir. Prioridad: 🟢.
(consolida #43)

#### D-026 — Calificaciones de servicios
Origen: Módulos por construir. Prioridad: 🟢.
(consolida #45)

#### D-027 — Página pública del prestador
Origen: Módulos por construir. Prioridad: 🟢.
(consolida #47)

#### D-028 — Promociones / Cupones
Origen: Módulos por construir. Prioridad: 🟢.
(consolida #48)

#### D-029 — Tutorial onboarding
Origen: Módulos por construir. Prioridad: ⚪.
(consolida #49)

#### D-030 — Centro de ayuda
Origen: Módulos por construir. Prioridad: ⚪.
(consolida #50)

#### D-031 — Admin: ver servicios configurados
Origen: Para integrar admin/v2. Prioridad: 🟢.
(consolida 15 sin # de "Para integrar admin/v2")

### 🟢 Funcionalidad pendiente del Wizard v2

#### D-032 — Función `buscar_cuenta_por_identificacion` SECURITY DEFINER
Origen: Planning 8 mayo. Prioridad: 🟢.
(consolida #67)

#### D-033 — Función `validar_identificacion_fiscal` STABLE
Origen: Planning 8 mayo. Prioridad: 🟢.
(consolida #68)

#### D-034 — Documentar flujo multi-rol con sedes preexistentes
Origen: Planning 8 mayo. Prioridad: 🟢.
(consolida #76)

#### D-035 — Validación frontend formato número cuenta y documento
Origen: Planning 8 mayo. Prioridad: 🟡 (afecta liquidaciones reales).
(consolida #77)

### 🟡 Deuda técnica DB y SQL

#### D-036 — Limpiar columnas deprecated en citas
Origen: S8. Prioridad: 🟡.
(consolida #55)

#### D-037 — Refactor RLS de citas/mascotas a `user_puede_acceder_prestador`
Origen: S8. Prioridad: 🟡.
(consolida #56)

#### D-038 — `is_admin()` VOLATILE → STABLE
Origen: S8. Prioridad: 🟡.
(consolida #57)

#### D-039 — Adendum a historia clínica
Origen: S8. Prioridad: 🟢.
(consolida #59)

#### D-040 — Wiring citas pagadas a `eventos_economicos` (Sprint 3.1.B.3)
Bloqueado por Kushki + integración con app v2.
Origen: S8. Prioridad: ⏸ DIFERIDA. Disparo: cuando Kushki esté integrado.
(consolida #66)

#### D-041 — Default `cuentas_comerciales.modelo_comercial` → `mixto`
Origen: S9. Prioridad: ⚪.
(consolida #81)

#### D-042 — Eliminar policy duplicada en `prestador_documentos`
Origen: S9. Prioridad: ⚪.
(consolida #82)

#### D-043 — Tests SQL buscaban literal "No tenés permiso" — fallarían post-migración tuteo
Origen: S9. Prioridad: ⚪.
(consolida #83)

#### D-044 — Poblar `formato_telefono` para 14 países restantes
Origen: S9. Prioridad: 🟢.
(consolida #84)

#### D-045 — `prestadores.tipo` y `.estado` son text con CHECK; migrar a ENUMs
Origen: S9. Prioridad: ⚪.
(consolida #91)

#### D-046 — Validación slug documento contra catálogo en DB
Origen: S9. Prioridad: 🟢.
(consolida #95)

#### D-047 — Refactor multi-tipo de prestador (relación N:N)
Origen: S9. Prioridad: ⏸ DIFERIDA.
(consolida #94)

#### D-048 — Pasaporte regex genérico, ajustar si reportan inválido
Origen: S9. Prioridad: ⏸ DIFERIDA. Disparo: si users reportan rechazo erróneo.
(consolida #89)

#### D-049 — Inconsistencia `Refugios.user_id` apunta a `auth.users`
Origen: S9. Prioridad: ⚪.
(consolida #88)

### 🟡 Deuda técnica Frontend

#### D-050 — Code-splitting (bundle > 500 kB)
Origen: S8. Prioridad: 🟢.
(consolida #62)

#### D-051 — Limpiar casts `as TypeName` en `historiaClinica.ts`
Origen: S8. Prioridad: 🟢.
(consolida #63)

#### D-052 — UI autocomplete recetas frecuentes
Origen: S8. Prioridad: 🟢.
(consolida #60)

#### D-053 — Sidebar mobile auto-oculta
Origen: S8. Prioridad: ⚪.
(consolida #61)

#### D-054 — Strings inline en `src/pages/` no centralizados
Origen: S9. Prioridad: ⚪.
(consolida #85)

#### D-055 — Helper `formatearTelefonoParaMostrar(e164SinPlus)`
Origen: S9. Prioridad: 🟢.
(consolida #86)

### 🟡 Deuda técnica Storage

#### D-056 — Edge Function limpieza Storage al borrar cita
Origen: S8. Prioridad: 🟢.
(consolida #58)

#### D-057 — Limpiar archivos huérfanos en bucket cita-archivos
Origen: S8. Prioridad: ⚪.
(consolida #64)

#### D-058 — Cleanup archivos huérfanos en bucket prestador-documentos
Origen: S9. Prioridad: ⚪.
(consolida #79)

### 🟡 Deuda técnica Tipos / TypeScript

#### D-059 — Bug generador Supabase tipea nullable como no-nullable
Origen: S9. Prioridad: 🟢.
(consolida #87)

### 🟡 Datos legacy / Limpieza puntual

#### D-060 — Fila duplicada en `user_roles` para `dianavanessacharry@gmail.com`
Origen: S9. Prioridad: ⚪.
(consolida #90)

### 🟢 Features menores y pulido

#### D-061 — Crear `/legal/privacidad`
Origen: S9. Prioridad: 🟢.
(consolida #80)

#### D-062 — Rate limiting en `verificar_identificacion_disponible`
Origen: S9. Prioridad: ⏸ DIFERIDA. Disparo: si crece tráfico.
(consolida #93)

#### D-063 — Email enumeration en RPC futura `prestador_email_check`
Trade-off conocido (Stripe, Notion lo aceptan). Mitigar con rate-limiting si crece riesgo.
Origen: S10. Prioridad: ⏸ DIFERIDA. Disparo: cuando se construya esa RPC.
(consolida #101)

### ⏸ Diferidos: Pendientes externos (otros repos)

#### D-064 — Multi-clínica completo (otros repos)
UI multi-clínica, selector de clínica activa, switch en header.
Origen: S6. Prioridad: ⏸.
(consolida #54, "54 sistémicos")

#### D-065 — Rol Recepcionista (otros repos)
Origen: S6. Prioridad: ⏸.
(consolida #51, "51 sistémicos")

#### D-066 — Sistema pagos automáticos a empleados
Origen: S6. Prioridad: ⏸.
(consolida "52 sistémicos")

#### D-067 — Email custom invitación SMTP (otros repos)
Origen: S6. Prioridad: ⏸.
(consolida #53, "53 sistémicos")

#### D-068 — Modelo cuentas progresivas
Origen: S7. Prioridad: ⏸.
(consolida X1)

#### D-069 — Migración cuentas Nivel 1 walk-in
Origen: S7. Prioridad: ⏸.
(consolida X2)

#### D-070 — Integración Kushki
Origen: S7+. Prioridad: ⏸.
(consolida #35-#37, "35,36,37 sistémicos")

#### D-071 — Facturación con prorrateo
Origen: S7+. Prioridad: ⏸.
(consolida "36 sistémicos")

#### D-072 — Sistema descuentos checkout
Origen: S7+. Prioridad: ⏸.
(consolida "37 sistémicos")

#### D-073 — Lógica cancelación/reembolsos según TyC
Origen: S7+. Prioridad: ⏸.
(consolida "9-13 sistémicos")

#### D-074 — Sistema formal habilitación de servicios
Origen: S7+. Prioridad: ⏸.
(consolida "14 sistémicos")

#### D-075 — Lógica descuentos cross-servicio
Origen: S7+. Prioridad: ⏸.
(consolida "27 sistémicos")

#### D-076 — Migración notificaciones a triggers/edge functions ✅
Cerrado el 11 May 2026 junto a D-004. Triggers DB implementados sobre `prestadores` y `prestador_documentos` para notificaciones admin→prestador. Pattern reusable para futuras notificaciones via DB triggers (cliente→prestador queda pendiente como D-102 hasta que flujo de citas del cliente se conecte).
Origen: S7+. Prioridad: ⏸ → cerrada en S12.

#### D-077 — Vencimiento bonos con fecha + relativo + urgencia
Origen: S7+. Prioridad: ⏸.
(consolida "40 sistémicos")

### 🟢 Pendientes menores descubiertos en testing

#### D-079 — Modal de detalle de cita muestra "Invalid Date"
Cuando empleado abre cita asignada en el modal de detalle, la fecha aparece como "Agendada: Invalid Date". Bug de formato.
Origen: S9 testing. Prioridad: 🟢.

#### D-080 — Email de bienvenida al cliente walk-in
Pendiente de configurar SMTP en Supabase. Para clientes Nivel 1 creados desde portal-prestadores.
Origen: S9 testing. Prioridad: 🟢. Disparo: cuando se configure SMTP custom (relacionado con D-067).

#### D-081 — Auditoría completa de policies con patrón "solo dueño"
Potencialmente afectan historia_clinica, prestador_bloqueos, telemedicina_sesiones, resultado_servicio, solicitudes_emergencia. Agregar policies para empleados cuando se implementen esos flujos.
Origen: S9 testing. Prioridad: 🟡.

#### D-095 — Cleanup global de casts `as unknown as` preexistentes
8 ocurrencias en archivos no tocados en S11: citas.ts (2), servicios.ts (1), notificaciones.ts (1), dashboard.ts (1), useCountry.ts (1), historiaClinica.ts (2). Detectado durante grep de verificación en D-005. Viola regla 34. Para limpiar: regenerar tipos + type predicates o refactor del shape esperado.
Origen: S11 (descubierto en cleanup post-D-005). Prioridad: 🟢.

#### D-096 — Modal pendiente_login no muestra error si RPC falla
`handleAceptarInvitacionLogin` y `handleRechazarInvitacionLogin` en App.tsx capturan errores con `console.error` pero no muestran feedback al user. El modal vuelve a estado interactivo pero el user no sabe que falló. Agregar mensaje inline rojo en catch.
Origen: S11. Prioridad: 🟢.

#### D-097 — `invitacionCheckedRef` no se resetea en error path
Si `fetchInvitacionPendienteLogin` falla (catch silencioso), `invitacionCheckedRef.current` queda en `true` y el modal nunca aparece aunque la invitación exista. Solo logout/login lo resetea. Probabilidad baja (query simple) pero edge case válido.
Origen: S11. Prioridad: 🟢.

#### D-098 — Extraer `ModalInvitacionPendienteLogin` a archivo propio
Hoy definido inline en App.tsx (133 líneas agregadas). Coherencia con organización del proyecto recomienda archivo separado en `src/components/`.
Origen: S11. Prioridad: 🟢.
Criterio de disparo: si se reusa el modal o si App.tsx supera 700 líneas.

#### D-100 — Cancelar invitación `pendiente_aceptacion_login` deja fila empleado huérfana
El botón "Cancelar" en `InvitacionCard` llama `cancelarInvitacion(id)` que solo marca `empleado_invitaciones.estado='cancelada'`. La fila correspondiente en `prestador_empleados` con `activo=false` queda huérfana. Necesita función SQL `cancelar_asociacion_directa(p_empleado_id)` que borre fila + marque invitación.
Origen: S11. Prioridad: 🟢.
Criterio de disparo: si en testing aparecen empleados huérfanos en DB.

#### D-103 — Ampliar CHECK `notificaciones.tipo` con `prestador_en_revision`
S12 usa `tipo='sistema'` + `datos.evento='prestador_en_revision'` para el evento A3 porque no hay tipo específico en el CHECK. Agregarlo permite mejor categorización y filtrado por tipo en frontend.
Origen: S12. Prioridad: 🟢.

#### D-105 — Realtime DELETE de notificaciones no propaga a UI
Detectado en runtime test de D-004 (S12, 11 May 2026): cuando se borra notif en DB, la fila desaparece de la lista solo después de refrescar la página. El INSERT realtime sí funciona. Probablemente la suscripción en frontend solo escucha eventos INSERT, no DELETE. No es bloqueante para D-004 porque la operación DELETE de notif es rara en operación real (usuario marca como leída, no borra). Si en futuro se agrega cron de auto-cleanup, se vuelve visible.
Origen: S12. Prioridad: 🟢.
Criterio de disparo: si se implementa auto-cleanup de notif viejas.

#### D-106 — Frontend portal-prestadores y e-petplace-v2 rotos por rename Bio-Expediente
S13 renombró tablas (`citas` → `evento_cita_servicio`, `historia_clinica` → `evento_historia_clinica_registrada`, etc). Wrappers TS, modales y páginas que las usan van a fallar en compilación. Aceptado por founder S13 (sin prestadores reales). Resolver en Bloque 7 (TS wrappers) + Bloque 8 (UI) en próximas sesiones del Bio-Expediente.
Origen: S13. Prioridad: 🟡 ALTA. Bloqueante para reactivar portal-prestadores en localhost.

#### D-107 — Runtime test end-to-end de `completar_historia_clinica` pendiente
Función reescrita en S13 (4.X) crea jerarquía de eventos + tablas tipadas. Dispara ~50 triggers en cascada. NO probada con datos reales. Próxima sesión arrancar con runtime test: cita real → completar HC con receta/examen/archivo → verificar propagación a `mascota_perfil_vigente` + log en `prestador_atencion_log`.
Origen: S13. Prioridad: 🔴 BLOQUEANTE para arrancar Bloque 6 con confianza.

#### D-108 — Bloque 6 (RLS) del Bio-Expediente
Reescribir policies de las 22+ tablas del Bio-Expediente. Matriz dueño/vet/empleado/admin × tipo de operación. Resolver deudas RLS específicas (H6 vacunas no permite vet, H9 citas insert/update inseguro). Crear policies usando `mascota_acceso_prestador` y `user_puede_acceder_prestador`.
Origen: S13. Prioridad: 🔴 BLOQUEANTE para uso real del Bio-Expediente.

#### D-109 — Bloque 7 (TS wrappers) del Bio-Expediente
Actualizar `historiaClinica.ts`, `citas.ts`, modales, pages al schema nuevo. Regenerar `database.types.ts`. Re-testear `npm run build`. Verificar que ningún wrapper usa nombre viejo.
Origen: S13. Prioridad: 🔴 BLOQUEANTE para reactivar frontend.

#### D-110 — Bloque 8 (UI) del Bio-Expediente
Modales y páginas que usaban `citas`. Recodificar timeline desde `eventos_mascota` (la vista legacy `v_bio_expediente` ya no existe). UI debe leer del modelo nuevo.
**Avance al cierre S19:** DB + wrappers TS hechos (`src/lib/identidadPersonal/` y `src/lib/timelineMascota/` con funciones `registrar_rasgo_identidad_personal`, `desactivar_rasgo_identidad_personal`, `leerIdentidadPersonal`, `leerTimelineMascota`). Modal de alta asistida cliente+mascota hecho. **Pendiente:** UI `MascotaDetalle.tsx` + timeline page consumiendo wrappers existentes. Diferido a S22+ con frame de producto definido por PORTAL_PRESTADOR.md v1.0.
Origen: S13. Prioridad: 🔴 BLOQUEANTE para uso real del Bio-Expediente.

#### D-111 — Validación veterinaria de umbrales `calcular_etapa_vida`
Función creada en S13 (4.B) con umbrales aproximados por especie (perro, gato, conejo, ave). Requiere validación con veterinario profesional antes de uso público. Conejo de 5 años actualmente clasifica "adulto" — algunos vets dirían "senior temprano".
Origen: S13. Prioridad: 🟡 ALTA. Disparo: antes de soft launch público.

#### D-112 — Constraints/índices con prefijo viejo en `evento_historia_clinica_registrada` y `evento_medicacion_prescrita`
3 constraints en cada tabla quedaron con prefijo `historia_clinica_*` / `cita_recetas_*` porque se crearon ANTES del RENAME TABLE. Solo estético, no funcional. Lección L-056 documentada.
Origen: S13. Prioridad: ⚪ BAJA. Cleanup cuando se toque cada tabla.

#### D-113 — `evento_cita_servicio.mascota_id` quedó nullable
Schema debería ser NOT NULL (Bloque 3.8 lo definía así). Quedó nullable por la migración. Citas reales siempre van a tener mascota_id (frontend manda), pero el constraint debería enforce. Cuando esté limpio el Bio-Expediente, hacer `ALTER COLUMN ... SET NOT NULL`.
Origen: S13. Prioridad: ⚪ BAJA.

#### D-114 — Falta catálogo `cat_tipos_vacuna`
`evento_vacuna_aplicada.tipo_vacuna` es text libre sin CHECK. Cuando se decida lista canónica (rabia, parvo, leptospira, etc), crear catálogo y agregar FK.
Origen: S13. Prioridad: 🟢 MEDIA.

#### D-115 — RLS de `evento_vacuna_aplicada` no permite vet aplicar
Policies viejas heredadas de `vacunas` solo permiten al dueño. Vet/empleado debe poder aplicar vacuna. Resolver en Bloque 6.
Origen: S13 (heredado de H6 S12). Prioridad: 🔴 BLOQUEANTE (incluido en D-108).

#### D-116 — Sin tabla tipada para "resultado de servicios no-médicos"
Modelo nuevo no cubre ruta GPS de paseo, notas de grooming, horarios de hotel, etc. Tabla legacy `resultado_servicio` se eliminó (S13 4.L). Por ahora, usar `eventos_mascota.datos jsonb`. Re-evaluar cuando haya paseadores/groomers/hoteles reales y se vea qué necesitan persistir.
Origen: S13. Prioridad: 🟢 MEDIA. Disparo: primer prestador no-médico con feature de resultado.

#### D-117 — Mapeo `prestadores_habituales` no implementado
Campo `mascota_perfil_vigente.prestadores_habituales jsonb` con estructura `{vet, grooming, paseador, hotel, entrenador}` se mantiene en `{}` vacío. Requiere trigger que mapee eje JTBD del último servicio completado → slot del jsonb. Diseño no trivial.
Origen: S13. Prioridad: 🟢 MEDIA. Disparo: cuando UI necesite mostrar "tu vet habitual".

#### D-118 — Repo `e-petplace-v2` puede consumir vista `v_bio_expediente` dropeada
La app cliente (otro repo, no portal-prestadores) probablemente usa la vista legacy `v_bio_expediente`. S13 la dropeó. Cuando se trabaje ese repo, verificar y actualizar.
Origen: S13. Prioridad: 🟡 ALTA. Disparo: próxima sesión sobre e-petplace-v2.

#### D-119 — Drift documental BIO_EXPEDIENTE.md E4 vs schema real `mascota_perfil_vigente` ✅
Sección E4 lista columnas obsoletas: `etapa_vida_actual` (no existe), `peso_actual/peso_actualizado_en` (reemplazadas por 5 campos D13.8), `prestador_habitual_vet/paseador` (reemplazadas por `prestadores_habituales jsonb` D13.7). No menciona `microchip_activo`, `seguro_activo_id`, `plan_nutricional_actual`. Actualizar E4 al schema real.
Origen: D-107 S14. Prioridad: 🟢 MEDIA → ✅ CERRADA en S16. Sección E4 de BIO_EXPEDIENTE.md actualizada con schema real post-S14 (commit `5691c6a`).

#### D-120 — Drift documental CLAUDE.md S9 vs CHECK real `chk_datos_bancarios_validos`
S9 documenta esquema v2.2 con 6 keys (`banco, tipo_cuenta, numero_cuenta, titular_nombre, titular_documento, metadata`). CHECK real exige 7 keys distintas (`banco_codigo, banco_nombre, tipo_cuenta, numero_cuenta, titular_nombre, titular_tipo_documento, titular_documento`) y NO exige `metadata`. Wizard y MODELO_FINANCIERO.md probablemente desactualizados.
Origen: D-107 S14. Prioridad: 🟡 ALTA.

#### D-121 — BIO_EXPEDIENTE.md sub-bloque 5.A sin enumerar las 16 tablas
"16 triggers BEFORE INSERT en 16 tablas tipadas" no lista cuáles. Enumerar explícito.
Origen: D-107 S14. Prioridad: ⚪ BAJA.

#### D-122 — Trigger E2 (`tiene_emergencia_activa`) no aparece en `eventos_mascota`
Solo aparecen 5.D (auto-log), E1 (ultimo_evento), C2 (profundidad). E2 puede estar en `evento_emergencia_solicitada` o pendiente. Verificar y documentar.
Origen: D-107 S14. Prioridad: 🟢 MEDIA.

#### D-123 — Tests runtime de tablas tipadas no probadas en D-107
D-107 solo validó `completar_historia_clinica` (HC + recetas + exámenes + archivos + peso). Pendiente probar INSERTs directos en alergias, condiciones, intervenciones, microchip, temperamento, emergencia, certificado, medicación administrada, cambio_nombre, correccion_dato_identidad. La detección de D-128 confirma necesidad.
Origen: D-107 S14. Prioridad: 🟡 ALTA.

#### D-124 — `mascota_perfil_vigente.medicacion_actual` no calcula fechas
Trigger B7 deja `fecha_inicio` y `fecha_fin_estimada` como NULL. Debería calcular `fecha_inicio = NOW()` y `fecha_fin_estimada = fecha_inicio + duracion_dias`.
Origen: D-107 S14. Prioridad: 🟢 MEDIA.

#### D-125 — Eventos clínicos operacionalmente inmutables post-atencion_log
Combinación C1 + FK SET NULL bloquea cualquier borrado natural. Documentar el patrón en BIO_EXPEDIENTE.md como invariante. Diseñar flujo "borrar mascota / corregir error administrativo" que respete C1.
Origen: D-107 S14. Prioridad: 🟢 MEDIA. Disparo: primer caso GDPR-like o primer error administrativo.

#### D-126 — Integración VTEX con Bio-Expediente — diseño pendiente
Tienda operada por MediaLab usando VTEX. Eventos de compra (`producto_asignacion`) deben fluir al Bio-Expediente vía webhook. Decisiones pendientes: (a) actor "vtex_integration" vs catálogo tipo evento, (b) `cuenta_comercial_id` del evento = seller, (c) RLS de INSERT requiere `service_role` o función SECURITY DEFINER, (d) handshake bidireccional refunds/cancellations.
Origen: D-108 S14. Prioridad: 🟡 ALTA. Disparo: cuando MediaLab tenga draft de portal-sellers.

#### D-127 — Sección "Tienda y productos" en EPETPLACE.md ✅
Documentar arquitectura tienda + sellers + VTEX + MediaLab. Acompaña D-126.
Origen: D-108 S14. Prioridad: 🟢 MEDIA. Cerrada en S14 cierre (sección agregada a EPETPLACE.md v1.1).

#### D-128 — Drift catálogo `cat_tipos_evento` vs nombres en triggers de 4 tablas ✅
~~Los triggers de auto-creación de evento padre (sub-bloque 5.A) usan códigos NO presentes en `cat_tipos_evento`:~~
~~- `evento_alergia_diagnosticada` → trigger usa `alergia_diagnosticada`, catálogo tiene `alergia_identificada`.~~
~~- `evento_microchip_asignado` → trigger usa `microchip_asignado`, catálogo tiene `chip_implantado`.~~
~~- `evento_intervencion_permanente` → trigger usa `intervencion_permanente`, catálogo no lo tiene (sí `esterilizacion`, `cirugia_procedimiento`).~~
~~- `evento_temperamento_observacion` → trigger usa `temperamento_observacion`, catálogo tiene `observacion_comportamiento`.~~

~~Consecuencia: INSERT en estas 4 tablas FALLA con `eventos_mascota_tipo_fkey violation`. Solución decidida en S16 (Bloque 9): agregar `intervencion_permanente` al catálogo (no existe), actualizar los 3 triggers restantes para usar códigos correctos del catálogo (`alergia_diagnosticada` → `alergia_identificada`, `microchip_asignado` → `chip_implantado`, `temperamento_observacion` → `observacion_comportamiento`). El catálogo es la verdad, los triggers se adaptan.~~
Cerrada técnicamente en S18, verificada en S19 (relevamiento Bloque 9): 16 triggers BEFORE INSERT en tablas tipadas usan códigos válidos del catálogo. La Fase H del plan original (cambio de 3 triggers) ya estaba ejecutada desde S18 — la verificación en S19 lo formalizó.
Origen: D-108 S14. Prioridad: 🔴 → ✅ cerrada (técnicamente cerrada S18, verificada S19).

#### D-129 — Scripts admin / Edge Functions deben usar `SET LOCAL ROLE` para no bypasear RLS ✅
Cualquier script SQL como `postgres` superuser (SQL Editor, migraciones, jobs cron) bypassea RLS por default. Para validar policies o respetar aislamiento en operaciones admin, usar `SET LOCAL ROLE authenticated` o `anon` explícito. Documentar en CONTRATO_TRABAJO.md como regla técnica + en BIO_EXPEDIENTE.md como nota operacional.
Origen: D-108 S14. Prioridad: 🟢 MEDIA. Parcialmente cerrada en S14 cierre (regla 68 agregada a CONTRATO_TRABAJO.md).

#### D-130 — `completar_historia_clinica` acepta `proxima_cita_*` pero no los persiste
Input de la función incluye `proxima_cita_fecha`/`proxima_cita_motivo` pero ninguna tabla del schema tiene esas columnas. La función los descarta silenciosamente. Diseño correcto post-D-110: próxima cita es una nueva fila en `evento_cita_servicio` con `estado='pendiente'`, no columna de HC. Refactor de la función para o (a) crear la cita nueva automáticamente cuando llegan esos campos, o (b) rechazar input con esos campos para forzar al frontend a crear la cita por separado.
Origen: D-109 S14. Prioridad: 🟡 ALTA. Disparo: en D-110 (UI) cuando se rediseñe el form de completar consulta.

#### D-131 — Bug pre-existente: `VistaHistoriaCompleta.tsx:308` null index ✅
Type 'null' cannot be used as an index type. Detectado por Claude Code durante D-109 pero pre-existente. Resuelto en D-109 con guard `dx.tipo ? ... : 'Secundario'`.
Origen: D-109 S14. Prioridad: 🟢 MEDIA.

#### D-132 — Bug pre-existente: `historiaClinica.ts:230` cast `as unknown as RpcFn`
Viola regla 24 del contrato (no usar casts `as TypeName` salvo Database). La RPC `completar_historia_clinica` ya está en los tipos generados — el cast es redundante y removible con refactor del wrapper.
Origen: D-109 S14. Prioridad: 🟢 MEDIA.

#### D-133 — Modelo de familia + co-dueños + familiares autorizados ✅
Refactor del modelo de pertenencia humana sobre mascotas. Schema actual asume `mascotas.user_id` único. Modelo nuevo requiere: tabla `familia`, tabla `familia_miembro` con roles (adulto_titular, adulto_autorizado, menor, cuidador_externo), tabla `mascota_codueños` (subset de adultos titulares), tabla `mascota_familiar_autorizado` (subset con permisos delegados), `mascota.familia_id`. Helper `user_tiene_acceso_a_mascota` se actualiza para soportar el nuevo modelo. Doble confirmación para acciones destructivas. Modelo simétrico (decisión D15.1).
Origen: S15 (`MODELO_PRODUCTO.md` Sección 4). Prioridad: 🟡 ALTA. Disparo: antes de que el primer usuario real necesite agregar segundo co-dueño o familiar autorizado.
Cierre: S17 (Fase B). Tablas `familia`, `familia_miembro`, `mascota_codueños`, `mascota_familiar_autorizado` + 27 RLS policies ejecutadas. Helper `user_tiene_acceso_a_mascota` reescrito. 19 tests pasados.

#### D-134 — Schema de identidad personal estructurada de la mascota
Tabla o jsonb estructurado para identidad personal (personalidad, gustos, miedos, manías, rituales). Hoy no existe en el modelo. Es Dimensión 2 de Capa 1 — central para diferenciación del producto.
Origen: S15 (`MODELO_PRODUCTO.md` Sección 3.1.1, Dimensión 2). Prioridad: 🟡 ALTA. Disparo: cuando se diseñe UI de Capa 1 (probablemente con D-110).

#### D-135 — Schema de hitos narrativos (públicos y privados)
Tabla `evento_hito_narrativo` con tipos (llegada, primer_*, cumpleaños, aprendizaje, salud, especial). Permite fechas retroactivas. Tabla separada `evento_hito_narrativo_privado` con FK al miembro de familia que escribió (hitos privados del humano, no migran con la mascota — decisión D15.4).
Origen: S15 (`MODELO_PRODUCTO.md` Sección 3.1.1, Dimensión 5). Prioridad: 🟡 ALTA. Disparo: con D-110 o sub-bloque dedicado.

#### D-136 — Schema de caso clínico con vet tratante adoptado ✅
Tabla `caso_clinico` con `mascota_id`, `condicion`, `vet_tratante_prestador_id`, `fecha_apertura`, `fecha_cierre`, `estado` (activo / resuelto / transferido), `horizonte_proximo_evento`. FK opcional `caso_clinico_id` desde `evento_historia_clinica_registrada`, `evento_medicacion_prescrita`, `evento_examen_diagnostico` para filtrar "ver toda la historia del caso X". Decisión D15.7 (vet tratante por caso, no por mascota).
Origen: S15 (`MODELO_PRODUCTO.md` Sección 3.2.4). Prioridad: 🟡 ALTA. Disparo: cuando se diseñe flujo de completar consulta veterinaria con frame de producto nuevo (relacionado con D-130).
Cierre: S17 (Fase E). Tablas `caso_clinico` + `caso_clinico_consultor` + 6 ALTERs a tablas tipadas clínicas + RLS policies ejecutadas.

#### D-137 — Motor de alertas declarativo
Catálogo `cat_reglas_alerta` con condiciones declarativas (jsonb), targets (a quién avisar), prioridad, frecuencia máxima. Worker o trigger evaluador que corre las reglas activas contra cambios en `eventos_mascota` y `mascota_perfil_vigente`. Tabla `alertas_emitidas` con historial. 3 tipos de alertas (ausencia, presencia, oportunidad). Configuración por actor (anti-spam, do-not-disturb en M6).
Origen: S15 (`MODELO_PRODUCTO.md` Sección 3.2.5). Prioridad: 🟢 MEDIA. Disparo: post-MVP, cuando haya N mínimo de mascotas activas que justifiquen el motor (probablemente F2).

#### D-138 — `cat_especies` con flag `activa` + `nivel_soporte` + `cat_especies_perfil`
Agregar columnas `activa` (boolean) y `nivel_soporte` (A/B/C/D) a `cat_especies`. Crear `cat_especies_perfil` jsonb con configuración por especie (qué JTBDs aplican, qué eventos típicos, vocabulario base, defaults de visibilidad). Componentes UI agnósticos que consultan perfil dinámicamente. Equinos quedan con `activa=false` (D15.5).
Origen: S15 (`MODELO_PRODUCTO.md` Sección 5). Prioridad: 🟢 MEDIA. Disparo: cuando se diseñe primer flujo que se comporta distinto por especie en UI (probablemente con D-110).

#### D-139 — Infraestructura i18n desde día 1
Implementar internacionalización con archivos de strings centralizados en frontend, aunque hoy solo haya español. Estructura: `src/i18n/<locale>/<namespace>.ts` con namespaces por feature. Todos los componentes consumen strings vía wrapper `t('namespace.key')`. **Refactorizar i18n después es brutal** — entrar a Brasil necesita portugués, a USA inglés. Costo de hacerlo ahora: medio. Costo de hacerlo después: 10x.
Origen: S15 cierre extendido (análisis estratégico/arquitectónico). Prioridad: 🔴 BLOQUEANTE antes de cualquier expansión de UI significativa (probablemente antes de D-110 Bloque 8). Disparo: inmediato.

#### D-140 — Multi-moneda y multi-formato en frontend
Implementar formatters centralizados para moneda, fecha, número, teléfono. Cada precio mostrado va vía `formatCurrency(amount, country, locale)`. Soportar mínimo: USD (Ecuador soft launch), MXN (México), COP (Colombia), ARS (Argentina), PEN (Perú), CLP (Chile), BRL (Brasil futuro). Fechas en formato local del país. El motor financiero (`MODELO_FINANCIERO.md`) ya soporta multi-moneda en DB — esta deuda es del frontend.
Origen: S15 cierre extendido. Prioridad: 🔴 BLOQUEANTE antes de expansión geográfica más allá de Ecuador. Disparo: inmediato (mismo bloque que i18n).

#### D-141 — Stack de observabilidad: Sentry + PostHog + logs estructurados
**Antes del primer prestador real cobrando con Kushki.** Sentry para errores frontend y backend (Edge Functions). PostHog para analítica de producto (eventos, funnels, retention). Logs estructurados en JSON con correlación entre frontend → Edge Function → DB. Sin esto, cuando algo falle en producción estamos a ciegas y no podemos diagnosticar.
Origen: S15 cierre extendido. Consolida y reemplaza D-083 (que tenía prioridad menor). Prioridad: 🔴 BLOQUEANTE. Disparo: antes del primer prestador real (coincide con disparo de D-094 PITR, mismo bloque de trabajo).

#### D-142 — Modelo `mascota.estado_vida` con propagación desde eventos ✅
3 valores (`activa | perdida | fallecida`). Columna en `mascotas` + `estado_vida_desde timestamp`. Trigger `propagar_estado_vida_desde_evento` actualiza la columna cuando se inserta evento `extravio_reportado`/`extravio_resuelto`/`fin_vida` en `eventos_mascota`. Historial completo de transiciones queda en `eventos_mascota`. Cambio de modelo respecto a MODELO_PRODUCTO 3.1.4: 3 estados, no 4. `transferida` no es estado de vida — se modela como cambio de `familia_id` + evento `transferencia_familia`.
Origen: S16 Sub-bloque 1.3. Prioridad: 🟡 ALTA. Disparo: Fase B-J del plan S16. DDL diseñado, cierre al ejecutar.
Cierre: S17 (Fase C). ALTER TABLE mascotas ejecutado: `familia_id FK`, `estado_vida CHECK(activa|perdida|fallecida)`, `estado_vida_desde`, backfill de `familia_id` + trigger de propagación activo.

#### D-143 — `mascota_visibilidad_config` + helper `user_puede_ver_dimension` ✅
Tabla 1:1 con `mascotas` con modo público global (`discoverable | solo_amigos | privado_total`) + visibilidad por dimensión (`biologica | temporal | personal | relacional | narrativa_publica`) con 4 niveles (`publica_autenticados | amigos_de_mascota | privada_familia | privada_total`). Helper `user_puede_ver_dimension(mascota_id, dimension)` SECURITY DEFINER consulta esa config + relación user↔mascota (co-dueño / autorizado / amigo de mascota / prestador con acceso). Datos clínicos, financieros, ubicación, microchip se manejan en helper aparte (siempre privados). Filtrado fino por rol de prestador (paseador ve miedos relevantes para paseos) diferido hasta D-137.
Origen: S16 Sub-bloque 1.5. Prioridad: 🟡 ALTA. Disparo: Fase D del plan S16.
Cierre: S17 (Fase D). Tabla `mascota_visibilidad_config` + tabla `accion_destructiva_pendiente` + helper `user_puede_ver_dimension` + RLS policies ejecutadas.

#### D-144 — Catálogo `cat_revelaciones` + motor de revelación progresiva
Decisión de producto S15 sin schema todavía. Tabla `cat_revelaciones` declarativa con disparadores (cambio de momento vital, prestador habitual identificado, hito registrado, N mascotas en familia, etc.), feature revelada, mensaje narrativo (i18n), prioridad, condiciones adicionales. Tabla `revelaciones_emitidas` historial por familia/mascota con estado (`ofrecida/aceptada/ignorada/descartada`). Feature flags por familia para activación de módulos. Calibración por especie consultando `cat_especies_perfil`. Probable comparte infraestructura con motor de alertas.
Origen: MODELO_PRODUCTO 6.4. Prioridad: 🟢 MEDIA. Disparo: F2 post-MVP, depende de N mínimo de mascotas activas que justifiquen el motor.

#### D-145 — Sistema de badges + reputación con sustancia
Capa 3.F del modelo. Badges automáticos derivados del Bio-Expediente (no se compran, se ganan): "vet con 200 vacunas aplicadas", "grooming con 95% rebookings", "paseador con 0 incidentes en 6 meses". Badges de comunidad curados (no algoritmo). Especialización certificada validada contra documentación cargada. Reputación de dueños discreta y no humillante (P11 política / 8.4 modelo). Sistema interno de protección de mascotas para intervención de soporte, no sanción.
Origen: MODELO_PRODUCTO 3.3.6. Prioridad: 🟢 MEDIA. Disparo: F2 post-MVP.

#### D-146 — Amistades entre mascotas + actos sociales con autor en backend
Capa 3.B. Tabla `mascota_amistad` bidireccional con consentimiento mutuo. Tabla de actos sociales (saludos, reacciones) con `actuado_por_user_id` (cuál co-dueño hizo el acto en nombre de la mascota). Backend sabe, UI lo narra como "Max le mandó saludo a Luna" sin exponer al user. Habilita la dimensión `amigos_de_mascota` del helper de visibilidad D-143.
Origen: MODELO_PRODUCTO 3.3.2. Prioridad: 🟢 MEDIA. Disparo: F2/F3.

#### D-147 — Memorial (Capa 3.E) — sub-sesión de diseño específica
Componente delicado emocionalmente. Schema base: estado memorial en `mascota_perfil_publico_config` cuando `estado_vida='fallecida'`. Comportamiento: silenciamiento de notificaciones cotidianas, preservación de hitos públicos, hitos privados de cada humano siguen en sus perfiles. Activo no pasivo — amigos de la mascota pueden dejar mensajes, recordatorios. Sub-sesión específica de diseño cuando aparezca primer caso real (mascota fallecida en producción).
Origen: MODELO_PRODUCTO 3.3.5. Prioridad: 🟢 MEDIA. Disparo: primer caso real.

#### D-148 — `handshake_log` entre actores
Tabla que registra handshakes operativos entre prestadores cuando una mascota es atendida por múltiples. Ejemplos del modelo: paseador↔vet cuando vet diagnostica algo que afecta paseos, hotel↔vet cuando hay condición crónica relevante para la estadía, transferencia de caso clínico entre vets. Habilita "visibilidad cruzada inteligente" de Capa 2.C.
Origen: MODELO_PRODUCTO 3.2.7. Prioridad: 🟢 MEDIA. Disparo: F2.

#### D-149 — Comunidades por afinidad (Capa 3.C)
Tipos: comunidad temática (ej "Diabéticos Felinos Ecuador"), comunidad de raza (ej "Beagles de Quito"), comunidad de causa (ej "Refugio Amigos"). Tablas: `comunidades`, `miembros`, `posts`, moderación. Gobernanza: moderadores curados, reglas por comunidad, política de spam.
Origen: MODELO_PRODUCTO 3.3.3. Prioridad: 🟢 MEDIA. Disparo: F3 (comunidad activa con masa crítica).

#### D-150 — `mascotas.especie` conversión a FK contra `cat_especies.codigo` ✅
Hoy es text con default `'perro'`, sin FK constraint. Detectado en relevamiento S16 (H5). Convertir a FK suave (`mascotas.especie REFERENCES cat_especies.codigo`). Si hay valores que no están en el catálogo, agregar al catálogo o rechazar conversión. Habilita JOINs con `cat_especies` + perfil de especie sin riesgo de huérfanos.
Origen: S16 Sub-bloque 2 H5. Prioridad: 🟢 MEDIA. Disparo: Fase A del plan S16 (junto con extensión de `cat_especies`).
Cierre: S17 (confirmado en relevamiento inicial — la FK ya existía en el schema desde Fase A de S16).

#### D-151 — Refactor `calcular_etapa_vida` → `calcular_momento_vital` y deprecación gradual
Función vieja devuelve 4 etapas (`cachorro|joven|adulto|senior`), modelo S15 pide 7 momentos (M0-M6). Además contradicción técnica: marcada IMMUTABLE pero usa `now()`. Nueva función `calcular_momento_vital(mascota_id)` consulta `cat_especies_perfil` para umbrales por especie + `mascota_perfil_vigente.condiciones_cronicas` para distinguir M3 de M4. M6 derivado de `estado_vida='fallecida'`. Marcada STABLE. Función vieja queda deprecada hasta que frontend migre.
Origen: S16 Sub-bloque 2 H12-H13. Prioridad: 🟡 ALTA. Disparo: Fase I del plan S16. Reemplaza/refina D-111.

#### D-152 — Granularidad `cat_especies` para roedor
Hoy "roedor" es categoría única. MODELO_PRODUCTO discrimina hámster/ratón/jerbo/cobaya como especies separadas. Cobaya ya se agregó en S16 (es Nivel B). Resto pueden agregarse si emerge demanda real de discriminar.
**Enmienda S45 (D-287 ampliada):** en F1 cobaya se REGISTRA como roedor (decisión founder S45 — `cobaya.activo=false`, `acepta_nuevos_registros=false`); la fila y el perfil de cobaya QUEDAN en el catálogo (sus mascotas existentes y la granularidad futura los usan). S16 y S45 no se contradicen: S16 modeló la granularidad, S45 decidió qué expone el registro F1. Si esta deuda se ejecuta, la reactivación de cobaya (y nuevas especies de roedor) pasa por el mismo gate de catálogo.
Origen: S16 Sub-bloque 2 H8. Prioridad: ⚪ BAJA. Disparo: cuando emerja demanda real.

#### D-153 — Sub-sesión específica de POLITICAS_EPETPLACE.md con equipo legal
Las 12 políticas v1.0 son derivadas del modelo. Antes de soft launch, revisión con abogado para: TyC alineados, política de datos de menores (P5) consistente con GDPR/COPPA/legislación local, política de transferencia de mascota (P2) sin riesgo legal, política de mascota walk-in (P3) sin conflicto de titularidad, política de hitos privados (P6) con respaldo de privacidad explícito.
Origen: S16. Prioridad: 🟡 ALTA. Disparo: antes de soft launch, junto con D-088.

#### D-154 — Re-leer 88 policies RLS desde perspectiva del modelo nuevo (lector frío L-068)
Antes de ejecutar Fase K del plan S16, releer las 88 policies con frame del modelo nuevo de familia + co-dueños + visibilidad por dimensión. Identificar cuáles requieren reescritura, cuáles siguen sirviendo con `user_tiene_acceso_a_mascota` (reescrito internamente), cuáles necesitan helper nuevo `user_puede_ver_dimension`. Aplicar L-068 (segunda lectura desde lector frío).
Origen: S16 Sub-bloque 4 (plan de migración). Prioridad: 🔴 BLOQUEANTE para Fase K. Disparo: antes de tocar policies.

#### D-155 — Verificar que repos paralelos toleren refactor de `mascotas`
Regla 69 (contratos explícitos entre repos): después de ejecutar el refactor, verificar que portal-admin y app-cliente-final siguen compilando y funcionando. Tablas tocadas: `mascotas` (nueva columna `familia_id`, deprecación de `user_id`), tablas tipadas con `caso_clinico_id` opcional, `mascota_perfil_vigente` (sin cambios pero referencia familia indirectamente vía helper). Si algo se rompe, fixear en mismo bloque o anotar como deuda con criterio de disparo.
Origen: S16. Prioridad: 🟡 ALTA. Disparo: junto con Sub-bloque 5 ejecución.

#### D-156 — 3 triggers de `eventos_mascota` son SECURITY INVOKER y rompen INSERT real desde cliente ✅
~~Los triggers `_trg_eventos_update_ultimo`, `_trg_eventos_auto_log_atencion`, `_trg_eventos_validar_profundidad` corren como SECURITY INVOKER. Cuando un usuario `authenticated` (no admin) inserta en `eventos_mascota`, los triggers ejecutan con sus permisos limitados y son rechazados por RLS de tablas dependientes (ej: INSERT a `mascota_perfil_vigente` falla con error 42501). Detectado en S17 Fase C test C-T5 al intentar disparar trigger propagar_estado_vida desde flow authenticated.~~
~~Solución probable: marcar los 3 triggers como SECURITY DEFINER con `SET search_path = public`. Auditar que el body NO use `auth.uid()` para decisiones — porque DEFINER ejecuta como postgres pero `auth.uid()` sigue devolviendo el del invocador.~~
Cerrada en S18 (15 May 2026). 3 ALTER FUNCTION aplicados: SECURITY DEFINER + search_path = public, pg_temp. Owner postgres (BYPASSRLS bajo DEFINER, exactamente lo requerido). Ninguno de los 3 bodies usa `auth.uid()` para decisiones (auditados). 3 runtime tests pasados con `SET LOCAL ROLE authenticated`: update_ultimo propaga al perfil vigente, validar_profundidad rechaza nieto, auto_log_atencion escribe en log con snapshot. Migración: `migrations/2026-05-15-S18.sql` Bloque 1.
Origen: S13 Bloque 5. Prioridad: 🔴 BLOQUEANTE → ✅ cerrada.

#### D-157 — `mascotas_insert_prestador_walkin` roto post-Fase C.4 ✅
~~Después de S17 Fase C.4 (`mascotas.familia_id` NOT NULL), la policy `mascotas_insert_prestador_walkin` no popula familia_id automáticamente. Un prestador haciendo walk-in fallará con error de NOT NULL antes de llegar a la policy. Producción no usa walk-in hoy (0 prestadores reales), pero queda como deuda crítica.~~
~~Solución: reescribir la policy o el flow para que el prestador walk-in dispare creación de familia virtual (`tipo='virtual_prestador'`, `cuenta_comercial_id=<prestador>`) en mismo flujo de INSERT mascota.~~
Cerrada en S18 (15 May 2026). Solución arquitectónica final: RPC `crear_mascota_walkin` SECURITY DEFINER como puerta única de entrada. Crea atómicamente: (1) familia virtual_prestador, (2) mascota con user_id=NULL/origen=desconocido (pet_hash auto-calculado por generated column), (3) mascota_acceso_prestador con metodo_otorgamiento=walkin_origen permanente. Drop de policy original laxa (D-163 absorbida). ALTER del CHECK constraint de mascota_acceso_prestador para agregar `'walkin_origen'` al enum de métodos. 4 runtime tests pasados (happy path + 3 negativos). Migración: `migrations/2026-05-15-S18.sql` Bloque 3.
Origen: S17 Fase C. Prioridad: 🟡 ALTA → ✅ cerrada.

#### D-158 — Las 88 policies RLS originales del Bio-Expediente no respetan modelo nuevo
Consolida y refina D-154. Las 88 policies de S13/S14 fueron escritas asumiendo modelo de propiedad simple (`mascotas.user_id`). Post-S17 el modelo es familia + codueños + visibilidad por dimensión. Las policies necesitan reescritura para usar `user_tiene_acceso_a_mascota` actualizado al nuevo modelo + `user_puede_ver_dimension` para granularidad. Aplicar L-072 (helpers SECURITY DEFINER en lugar de EXISTS directo).
Origen: S16 D-154 + verificaciones S17. Prioridad: 🟡 ALTA. Disparo: Fase K (sesión dedicada, con runtime test entre policies).

#### D-159 — Auditar triggers existentes contra `information_schema.columns` ✅
~~L-076 detectó que el trigger nuevo `_trg_propagar_estado_vida_desde_evento` usaba `NEW.fecha` cuando la columna real es `NEW.fecha_evento`. Necesitamos auditar otros triggers existentes (de S13 Bio-Expediente, motor financiero, notificaciones) por referencias a `NEW.X` u `OLD.X` con nombres que pudieran no coincidir con el schema real. Buscar via `pg_get_functiondef` + cruzar contra `information_schema.columns`.~~
Cerrada en S18 (15 May 2026). Auditoría ejecutada vía query con regex sobre bodies de funciones de trigger + LEFT JOIN contra `information_schema.columns`. **0 drifts** encontrados. L-076 confirmada como hábito sano del repo. La query queda como pattern reusable si surge sospecha futura.
Origen: S17 Fase C fix runtime. Prioridad: 🟢 MEDIA → ✅ cerrada.

#### D-160 — Policy INSERT de `eventos_mascota` no validaba `prestador_id` ni `empleado_id` ✅
~~Detectada al cerrar D-156. El predicado original de `eventos_mascota_insert` (with_check) solo validaba acceso a la mascota y anti-spoof de `creado_por_user_id`, pero permitía a cualquier authenticated insertar evento con `prestador_id` y `empleado_id` arbitrarios. Una vez que el trigger DEFINER `_trg_eventos_auto_log_atencion` quedó funcional (D-156), aceptaría esos valores y escribiría en `prestador_atencion_log` atribuyendo atención profesional a prestadores que no actuaron. Bug pre-existente desde S13/S14 enmascarado por SECURITY INVOKER — el fix de D-156 lo hizo explotable (L-078).~~
Cerrada en S18 (15 May 2026). DROP + CREATE POLICY con predicado de 4 cláusulas: acceso a mascota (preservado), anti-spoof creado_por_user_id (preservado), acceso a prestador via `user_puede_acceder_prestador`, coherencia empleado_id↔prestador_id↔auth.uid() vía EXISTS sobre `prestador_empleados`. 3 runtime tests pasados (no-regresión sin prestador, no-regresión con prestador propio, rechazo con prestador ajeno). Migración: `migrations/2026-05-15-S18.sql` Bloque 2.
Origen: S18 (detectada al cerrar D-156). Prioridad: 🟡 ALTA → ✅ cerrada.

#### D-161 — Drift de tipos entre `_debe_logear_atencion` y CASE de `_trg_eventos_auto_log_atencion`
La lista de tipos que logean en el helper `_debe_logear_atencion` no coincide 1:1 con los labels legibles del CASE en el trigger `_trg_eventos_auto_log_atencion`. Algunos tipos (ej: `chip_implantado` en helper pero CASE mapea `microchip_asignado`; `alergia_identificada` en helper pero CASE mapea `alergia_diagnosticada`) logean correctamente pero quedan en `prestador_atencion_log.tipo_atencion` con el código técnico literal (cayendo al ELSE del CASE) en lugar de label legible. También faltan en helper varios tipos que SÍ tienen entrada en el CASE: `intervencion_permanente`, `temperamento_observacion`, `peso_medicion`, `archivo_adjunto`. Inversamente, varios del helper no aparecen en CASE: `cirugia_procedimiento`, `esterilizacion`, `nota_prestador`, `fin_vida`, `observacion_comportamiento`, `incidente_paseo`, `incidente_hotel`.
Detectado durante runtime test de D-156 en S18 Sub-bloque 4.
Solución: alinear ambas funciones contra el catálogo `cat_tipos_evento` como fuente de verdad. Probable: extraer el CASE a una columna nueva en el catálogo (jsonb o text) y leer desde ahí en el trigger. **Decisión de modelo previa al fix técnico**: qué tipos logean es decisión legal/regulatoria (prestador_atencion_log es registro legal).
Origen: S18. Prioridad: 🟢 MEDIA. Disparo: junto con Fase K (D-158) o cuando se vaya a usar `prestador_atencion_log` para reportes regulatorios.

#### D-162 — `_trg_mascotas_crear_perfil_vigente` es SECURITY INVOKER ✅
~~Detectado durante relevamiento Sub-bloque 7.A de D-157. El trigger AFTER INSERT en `mascotas` que auto-crea row en `mascota_perfil_vigente` es INVOKER. Como `mascota_perfil_vigente` tiene RLS habilitada y solo policy SELECT (D-166), un INSERT directo de mascota desde authenticated dispararía el trigger y fallaría con 42501 al intentar INSERT en perfil. Patrón D-156 redux pero sobre tabla `mascotas`.~~
Cerrada técnicamente en S18 (15 May 2026). ALTER FUNCTION a SECURITY DEFINER + search_path = public, pg_temp. Runtime test end-to-end pendiente para sesión que toque flow cliente regular (mascotas_insert_due, Fase G o D-110) — el patrón está validado 3 veces por D-156 en sesión, alta confianza en que funciona.
Origen: S18 (relevamiento de D-157). Prioridad: 🟢 MEDIA-BAJA → ✅ cerrada (técnicamente).

#### D-165 — 17 triggers `_trg_*_crear_evento` + helper `_crear_evento_padre_auto` son SECURITY INVOKER
Detectado en S18 Sub-bloque 8.A. Los 17 triggers BEFORE INSERT sobre las tablas tipadas del Bio-Expediente (que auto-crean evento_mascota padre) y el helper genérico `_crear_evento_padre_auto` son todos INVOKER. Funcionan hoy porque la entrada al sistema es via funciones SECURITY DEFINER (ej: `completar_historia_clinica`) cuyos contextos heredan al trigger. Si algún flow nuevo intentara INSERT directo desde authenticated en una tabla tipada, podría fallar silencioso si los triggers de propagación a perfil vigente (también INVOKER, ver D-166) no tienen contexto correcto.
Solución: pasar las 18 funciones a SECURITY DEFINER + search_path acotado. Misma operación mecánica que D-156, pero por volumen requiere sesión dedicada con runtime test por cada tabla tipada.
Origen: S18 Sub-bloque 8.A (relevamiento Fase F). Prioridad: 🟢 MEDIA. Disparo: sesión de hardening dedicada o junto con Fase K (D-158).

#### D-166 — `mascota_perfil_vigente` tiene RLS habilitada pero solo policy SELECT 🟡 mitigada
Detectado en S18 Sub-bloque 8.A. La tabla `mascota_perfil_vigente` tiene RLS habilitada (`relrowsecurity=true`) pero solo policy SELECT (`perfil_vigente_select`). No hay policies INSERT/UPDATE/DELETE. Eso significa que cualquier authenticated que intente mutar la tabla → rechazado con 42501. Los 17 triggers `_trg_*_propagar_perfil` que actualizan `mascota_perfil_vigente` son todos INVOKER (parte de D-165) y dependen de que la entrada sea via SECURITY DEFINER para funcionar.
**Mitigada en S19:** decisión arquitectónica tomada — defense-in-depth vía `REVOKE INSERT/UPDATE/DELETE` de authenticated en `mascota_perfil_vigente`, en lugar de agregar policies redundantes. Mantiene el patrón "RPCs SECURITY DEFINER como puerta única" sin duplicación. La deuda original (RLS sin policies de mutación) sigue conceptualmente abierta, pero el riesgo está controlado: cualquier intento de mutación directa desde authenticated falla por REVOKE antes de llegar a RLS.
Origen: S18 Sub-bloque 8.A. Prioridad: 🟡 ALTA → 🟡 mitigada en S19. Disparo: si se decide reemplazar REVOKE por policies INSERT/UPDATE explícitas (decisión arquitectónica futura, no urgente).

#### D-167 — Bug routing "Completar atención" según `tipo_servicio`
Módulo "Completar atención" en el portal del prestador rutea según `tipo_servicio` (médico vs no-médico). Detectado en S19 como bug latente. Funcional hoy pero frágil: cualquier nuevo tipo de servicio agregado podría exponer el bug. Mencionado informalmente como "D-167" en CLAUDE.md S19 sin asiento formal hasta S21 Trabajo B paso 2.
**Reclasificado de 🟡 ALTA a 🔴 BLOQUEANTE en S22.** Auditoría Fase 2 + Bloque C de S22 reveló que el flujo médico completo (`/cita/:id/completar` con 11 subcomponentes + 821 líneas de page) **está completamente huérfano** — ningún componente navega a él. Todos los servicios (médicos y no-médicos) pasan por `ModalCompletarCita.tsx` (textarea simple) que escribe en `citas.notas_prestador`, NO en Bio-Expediente. Localización exacta: `src/components/CitaDetalleModal.tsx:560-565` — botón "Completar atención" llama `setModalCompletar(true)` incondicionalmente sin chequear `tipo_servicio.es_medico`. Consecuencia operativa: hoy ningún veterinario puede documentar Historia Clínica desde el portal. Bloqueante para primer vet real.
Origen: S19 — formalizado en S21 Trabajo B paso 2. Reclasificado: S22 Fase 2. Prioridad: 🔴 BLOQUEANTE. Disparo: Fase 1 del backlog del portal. Resolución: fix chico (~10 líneas) en `CitaDetalleModal.tsx:560-565`.

#### D-168 — [hueco intencional, sin asignación]
Número saltado en S19 durante asignación informal de D-NNN. No corresponde a deuda real. Se preserva el hueco en lugar de renumerar para mantener trazabilidad con menciones históricas de D-167 y D-169 en CLAUDE.md S19.
Origen: S21 Trabajo B paso 2. Estado: N/A.

#### D-169 — Regenerar `src/lib/database.types.ts` post-cambios DB S19 ✅
~~Tras el refactor de "alta asistida cliente+mascota" en S19 (Fase G del Bloque 9), los types TS quedaron desincronizados con el schema. Regeneración necesaria para que el build TS valide contra la realidad de la DB.~~
Completado en S19 (commit `c533dae`): 12768→13611 líneas. Mencionado informalmente como "D-169" en CLAUDE.md S19 sin asiento formal hasta S21 Trabajo B paso 2.
Origen: S19 — formalizado y cerrado retroactivamente en S21 Trabajo B paso 2. Prioridad: 🟡 → ✅ cerrada.

#### D-170 — Walk-in: ciclo de vida del contacto telefónico tomado por el prestador
Detectado en S21 lectura fría de PORTAL_PRESTADOR.md (hallazgo A3). El documento declara dos principios que se cruzan: (i) "el prestador no ve teléfono ni email de la familia" (sección 6.4.7, comunicación mediada por plataforma); (ii) en walk-in con alta asistida pendiente, "si la mascota tiene contacto telefónico tomado en la atención presencial, ese contacto aparece solo para el prestador que la registró como nota privada" (sección 9.9). El cruce genera ambigüedad operacional: ¿qué pasa con el teléfono cuando el cliente completa el registro? ¿Persiste como nota privada del prestador? ¿Se transfiere a la familia real? ¿Se elimina? ¿Hasta cuándo es accesible?
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo A3). Prioridad: 🟡 ALTA — decisión de modelo bloqueante para implementación de walk-in real. Disparo: antes de primer caso walk-in completado con cliente que termina su registro.

#### D-171 — Asimetría de detalle entre Familias A vs B-G en PORTAL_PRESTADOR.md
Detectado en S21 lectura fría (hallazgo C2). PORTAL_PRESTADOR.md sección 5.2 define las 6 familias de servicios con un párrafo cada una, pero solo Familia A tiene sección dedicada (5.3) con frame de "anclaje técnico y narrativo". Las familias B-G no tienen tratamiento equivalente. Decisión declarada implícitamente en sección 5.3 ("orden de prioridad de construcción"). Conviene agregar nota explícita al cierre de 5.3 indicando que cada familia recibe tratamiento detallado en sesión propia cuando llegue su construcción.
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo C2). Prioridad: 🟢 BAJA. Disparo: cuando se aborde construcción de Familia B o cualquiera distinta de A.

#### D-172 — Concepto "equipo dedicado" / "equipo de e-PetPlace" sin definición formal
Detectado en S21 lectura fría (hallazgo C3). PORTAL_PRESTADOR.md usa indistintamente "equipo dedicado del founder", "equipo dedicado", "equipo de e-PetPlace", "persona dedicada del equipo", "el equipo". El lector frío entiende que es el mismo grupo, pero no hay definición formal en ningún documento maestro de qué es ese equipo, qué roles tiene, qué permisos, qué notificaciones recibe. Probablemente parte de PORTAL_ADMIN.md cuando se redacte.
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo C3). Prioridad: 🟢 BAJA. Disparo: cuando se redacte PORTAL_ADMIN.md o cuando un dev necesite implementar acciones del "equipo" en el sistema.

#### D-173 — Marca unificada e-PetPlace vs página pública del prestador (coherencia con TDR Portal Sellers)
Detectado en S21 lectura fría con cruzado contra TDR Portal Sellers v3 (hallazgo D1). TDR Sellers declara principio fundacional: "para el comprador, el seller es e-PetPlace. El comprador nunca ve ni interactúa con el seller directamente". PORTAL_PRESTADOR.md sección 4.5 declara que cada prestador graduado recibe "página web pública dentro del dominio de e-PetPlace" con foto, biografía, identidad propia del prestador. Los dos modelos son **opuestos**: en sellers la identidad del actor interno se oculta; en prestadores la identidad del actor se exhibe. ¿Por qué la asimetría? ¿Es decisión consciente o drift documental entre ecosistemas? Si es consciente, anclar la justificación en MODELO_PRODUCTO.md. Si no, decidir cuál modelo aplica.
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo D1) cruzado con TDR Portal Sellers v3. Prioridad: 🟡 ALTA — decisión de modelo bloqueante para coherencia entre PORTAL_PRESTADOR.md y PORTAL_SELLER.md futuro. Disparo: antes de redactar PORTAL_SELLER.md o cuando MediaLab tenga primera versión del checkout unificado.

#### D-174 — Modelo de reseñas para prestadores (calificación numérica vs cualitativa)
Detectado en S21 lectura fría (hallazgo D2). PORTAL_PRESTADOR.md menciona reseñas en secciones 2.6, 3.6, 4.6, 6.6.5, 7.3.3 pero NO define el modelo concreto (¿1-5 estrellas o cualitativo?, ¿moderación previa o post-hoc?, ¿quién modera?, ¿qué pasa con reseñas negativas? — solo declara que se atienden con presencia). El principio "reputación honrada, no jerarquizada" (sección 2.7) parece chocar con "1-5 estrellas" del TDR Sellers (que sí usa numérico para productos). Decisión de modelo necesaria: el sistema de reseñas de prestadores **no es** el de productos, pero su shape concreto está pendiente.
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo D2). Prioridad: 🟡 ALTA — decisión de modelo bloqueante antes de F1 real (primera reseña aparece como momento narrativo 7.3.3). Disparo: antes de soft launch real o cuando aparezca primera reseña.

#### D-175 — Recetas y diagnósticos del prestador como insumo para Portal Sellers cross-selling
Detectado en S21 lectura fría con cruzado contra TDR Portal Sellers v3 (hallazgo D3). TDR Sellers describe cross-selling personalizado basado en Bio-Expediente ("vet receta producto → tienda lo sugiere; condición alimentaria → filtra alimentos"). PORTAL_PRESTADOR.md no menciona que las recetas/diagnósticos que el prestador deja en el bio-expediente alimentan recomendaciones de productos al cliente vía Portal Sellers. Esto cambia cómo el prestador debe pensar sus recetas (no son solo "para mi propio uso") y conecta los dos portales.
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo D3) cruzado con TDR Portal Sellers v3. Prioridad: 🟡 ALTA — coordinación necesaria entre PORTAL_PRESTADOR.md y PORTAL_SELLER.md. Disparo: antes de implementación de cross-selling personalizado en Portal Sellers, o cuando se redacte PORTAL_SELLER.md.

#### D-176 — Multi-país desde la base en portal-prestadores (consistencia arquitectónica con TDR Sellers)
Detectado en S21 lectura fría con cruzado contra TDR Portal Sellers v3 (hallazgo D4). TDR Sellers declara multi-idioma/moneda/impuesto/políticas/carrier como requerimiento de arquitectura desde día 1 (sección 12 TDR). PORTAL_PRESTADOR.md sección 12.6 menciona soporte multi-país como principio pero deja "decisiones técnicas concretas viven en EPETPLACE.md y eventualmente en documentos por país". El frame multi-país del portal del prestador en F1 debe usar el mismo principio que TDR Sellers: código preparado para soportar la expansión sin refactor estructural, no "hoy hardcodeamos Ecuador y mañana refactorizamos".
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo D4) cruzado con TDR Portal Sellers v3. Prioridad: 🟢 BAJA. Disparo: durante auditoría técnica del repo `e-petplace-prestadores` contra PORTAL_PRESTADOR.md v1.1 (sesión futura).

#### D-177 — Canales de notificación al prestador fuera del portal (push, email, SMS, WhatsApp)
Detectado en S21 lectura fría con cruzado contra TDR Portal Sellers v3 (hallazgo D5). TDR Sellers detalla canales de notificación al comprador (WhatsApp Business prioritario, SMS respaldo, email). PORTAL_PRESTADOR.md no toca explícitamente qué canales fuera del portal usa para notificar al prestador (excepto push e in-app, sección 6.6.4 — sin desarrollar). Decisión técnica diferida: definir qué canales y con qué prioridad recibe notificaciones el prestador, considerando que el principio "comunicación mediada por plataforma" (6.4.7) aplica al canal prestador-familia pero no necesariamente al canal sistema-prestador.
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo D5) cruzado con TDR Portal Sellers v3. Prioridad: 🟢 BAJA. Disparo: cuando se implementen notificaciones operativas reales al prestador en F1.

#### D-178 — Shape técnico de "autorización de urgencia con trazabilidad legal"
Detectado en S21 lectura fría (hallazgo D6). PORTAL_PRESTADOR.md sección 9.10 promete: "La autorización [del co-dueño en emergencia] queda registrada para trazabilidad legal", sin especificar formato ni ubicación técnica (¿entrada de bio-expediente? ¿log separado? ¿es vinculante legalmente o solo registro interno?). Es declaración de principio en v1.1; importa cuando llegue primer caso real de urgencia con consecuencias clínicas serias.
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo D6). Prioridad: 🟢 BAJA. Disparo: antes de primer caso real de urgencia con autorización del co-dueño, o cuando se diseñe el sistema de eventos clínicos de mayor sensibilidad.

#### D-179 — SLA real del soporte F1 (canal directo con el equipo)
Detectado en S21 lectura fría (hallazgo D7). PORTAL_PRESTADOR.md sección 3.8 promete "canal directo con el equipo durante Momento Fundacional" y "comunicación quincenal del founder a los primeros 10 prestadores fundadores". Sección 12.6 dice "soporte F1 es founder + 1 persona, 9-18 hora local". Quedan preguntas operativas no resueltas: ¿qué pasa si un prestador necesita ayuda urgente fuera de 9-18? ¿Hay backup si el founder está incomunicado dos semanas? ¿Cuál es el SLA real implícito?
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo D7). Prioridad: 🟢 BAJA. Disparo: cuando se redacte PORTAL_ADMIN.md o antes de soft launch público con primeros 15 fundadores.

#### D-180 — Lectura literal de secciones 8.6-8.8 de PORTAL_PRESTADOR.md no completada en lectura fría S21
Detectado en S21 lectura fría (hallazgo E2). Durante la lectura fría de PORTAL_PRESTADOR.md v1.0 en S21, las líneas 1678-1742 (secciones 8.6, 8.7, 8.8) quedaron sin lectura literal completa por truncado de vista. El contenido aparece consistente con el resto del documento según referencias del apéndice y del cuerpo, pero no se verificó literalmente. Esta deuda no implica que haya problema — solo registra que la lectura fría no cubrió 100% del documento.
Origen: S21 lectura fría PORTAL_PRESTADOR.md (hallazgo E2). Prioridad: 🟢 BAJA. Disparo: próxima sesión que aborde el detalle de mascota o que necesite frame literal de las secciones 8.6-8.8, o cuando se actualice PORTAL_PRESTADOR.md a v1.2.

#### D-181 — Migración S19 ausente del repo + body de RPCs solo en DB
La migración `migrations/2026-05-15-S19.sql` no existe en el repo. Las 3 RPCs (`buscar_cliente_por_email`, `crear_alta_asistida_pendiente`, `crear_alta_asistida_existente`), la tabla `cliente_pendiente_registro`, las policies RLS, el REVOKE defense-in-depth de D-166, el cron job `cleanup_pendientes_vencidos_diario` y la función `cleanup_pendientes_vencidos()` viven solo en producción Supabase project `zyltipqscdsdsxnjclhp`. `database.types.ts` captura firmas pero no bodies.
Origen: Fase 1 auditoría S22 (O-1). Prioridad: 🟡 ALTA. Disparo: antes de staging real (D-007) o antes de cualquier modificación a las RPCs. Resolución: extraer body con `pg_get_functiondef(oid)` para las 3 RPCs + dumpear tabla + policies + cron job + función SQL desde producción → consolidar en archivo migracional retroactivo.

#### D-182 — Drift de versionado SQL: dos carpetas + huecos S12-S15
Existen dos carpetas con migraciones (`migrations/` y `sql/`) sin convención clara. Faltan migraciones entre S12 y S15 que sí fueron ejecutadas según CLAUDE.md.
Origen: Fase 1 auditoría S22 (O-2). Prioridad: 🟢 MEDIA. Disparo: cuando se decida consolidar el versionado SQL. Resolución: consolidar en una sola carpeta `migrations/` con archivos ordenados cronológicamente.

#### D-184 — `PORTAL_PRESTADOR_KICKOFF.md` sigue versionado ✅
Archivo intermedio del proceso de S20 que ya cumplió su propósito (consolidación en PORTAL_PRESTADOR.md v1.1).
Origen: Fase 1 auditoría S22 (O-6). Prioridad: ⚪ BAJA. Cerrada en S23 Fase D.2 (19 May 2026) con `git rm PORTAL_PRESTADOR_KICKOFF.md` como parte de limpieza del directorio raíz. El archivo está superseded por `PORTAL_PRESTADOR.md` v1.1 desde S20. Rastro histórico preservado en git history y en entradas de sesiones S19/S20/S21 que lo referencian.

#### D-185 — `'es-EC'` hardcodeado en `Agenda.tsx:formatSemanaLabel`
`formatSemanaLabel` en `Agenda.tsx` hardcodea `'es-EC'` para formato de fecha. Es uno de los 14+ sitios identificados en D-191. Viola imperativo multi-país declarado en S22.
Origen: Fase 2 auditoría S22. Prioridad: 🟡 ALTA. Disparo: Fase 0 del backlog del portal (i18n + format helpers). Resolución: absorbida por D-191 cuando se migre a `formatFecha(iso, countryCode)`.

#### D-186 — Wrapper de Storage faltante en `CompletarCita.tsx`
`CompletarCita.tsx` hace `supabase.storage.from('cita-archivos').upload(path, file)` directo sin abstracción. Otros wrappers en `lib/` (ej: `documentos.ts`) sí usan wrapper. Violación de patrón establecido.
Origen: Fase 2 auditoría S22. Prioridad: 🟢 MEDIA. Disparo: Fase 2 del backlog (pulir flujo "Después" clínico). Resolución: crear `lib/storage.ts` con `uploadCitaArchivo(path, file)` y migrar el sitio.

#### D-187 — Signed URLs de preview vencen en 1h durante upload
En `CompletarCita.tsx`, `supabase.storage.createSignedUrl(path, 3600)` genera URLs que expiran en 1h. Si el vet tarda más de 1h en completar la consulta, las preview URLs ya no funcionan al guardar.
Origen: Fase 2 auditoría S22. Prioridad: 🟢 BAJA. Disparo: Fase 2 del backlog (pulir flujo "Después" clínico). Resolución: o regenerar URLs al guardar, o usar URLs de mayor duración (24h), o convertir a URLs públicas si los archivos lo permiten.

#### D-189 — Logo final pendiente
El logo final del producto está pendiente. Cualquier construcción que use logo (Día 1, Página Pública, insignias, cabecera de portal) debe usar placeholder declarado `<LogoPlaceholder />` reemplazable en un solo sitio.
Origen: sesión S22 (declaración del founder). Prioridad: ⚪ BAJA. Disparo: cuando el diseño definitivo del logo se entregue. Resolución: crear componente `<LogoPlaceholder />` en Fase 0, usar en todos los sitios. Reemplazar archivo de assets cuando llegue el logo final.

#### D-190 — `currency_code` cargado de DB pero no consumido en frontend
`useCountry.ts` carga `currency_code` + `currency_symbol` desde `country_config` pero ningún consumidor los usa. `Servicios.tsx:441` hardcodea `$ {precio.toLocaleString()}` como string sin moneda dinámica. Multi-país real no funciona.
Origen: Fase 3 auditoría S22 (Bloque A.4). Prioridad: 🟡 ALTA — bug sistémico multi-moneda. Disparo: Fase 0 del backlog del portal (i18n + format helpers). Resolución: construir `formatMoneda(amount, countryCode)` en `lib/format.ts` y migrar los sitios identificados.

#### D-191 — 14+ sitios hardcodean `'es-EC'` para formato de fecha
Bug sistémico multi-locale. Sitios identificados: `ModalLinkInvitacion.tsx:14`, `CitaDetalleModal.tsx:45,68`, `VistaHistoriaCompleta.tsx:36,37`, `citas.ts:94`, `Documentos.tsx:44`, `Dashboard.tsx:19,211`, `Agenda.tsx:67,68`, `CompletarCita.tsx:65`, `Contratos.tsx:16,21`, `Empleados.tsx:21`. También `Perfil.tsx:39` usa `'es-ES'` (incorrecto).
Origen: Fase 3 auditoría S22 (Bloque A.4). Prioridad: 🟡 ALTA. Disparo: Fase 0 del backlog del portal. Resolución: construir `formatFecha(iso, countryCode)` en `lib/format.ts` y migrar los 14+ sitios.

#### D-192 — `lib/ciudades.ts` hardcodeado solo para EC + CO
`CIUDADES_POR_PAIS` es `Record<string, Ciudad[]>` con solo EC (16) y CO (12). Para MX, PE, CL, AR, BR, US devuelve array vacío silencioso.
Origen: Fase 3 auditoría S22 (Bloque A.1). Prioridad: 🟢 MEDIA. Disparo: cuando aparezca prestador real de país distinto a EC o CO. Resolución: migrar a tabla `cat_ciudades` en DB con campos por país, o al menos completar el mapa con países previstos.

#### D-193 — `lib/tiposPrestador.ts` documentos hardcodeado EC-only
`TIPOS_PRESTADOR` tiene estructura `documentos: { EC: [...] }` lista para multi-país, pero solo EC está poblado. Hoy `Paso7Documentos.tsx:152` hardcodea `tipoConfig.documentos.EC ?? []` (D-213).
Origen: Fase 3 auditoría S22 (Bloque A.1). Prioridad: 🟢 MEDIA. Disparo: cuando se active otro país en `country_config.is_active`. Resolución: migrar a tabla `cat_documentos_por_tipo_prestador_pais` en DB, o al menos poblar `documentos.CO` y consultar dinámicamente por `state.pais`.

#### D-194 — Sistema de strings dividido: ~60% inline en pages operativas, ~40% en `*/strings.ts`
Módulos nuevos (wizard, altaAsistida, identidadPersonal, timelineMascota — todos S17+) adoptaron `*/strings.ts`. Pages operativas pre-existentes (Dashboard, Citas, Agenda, Contratos, Empleados, Servicios, Horarios) no adoptaron el patrón — ~60% del texto está hardcoded en JSX. Sin librería i18n instalada.
Origen: Fase 3 auditoría S22 (Bloque A.3). Prioridad: 🟡 ALTA — cada pantalla nueva que hardcodea aumenta costo futuro. Disparo: Fase 0 del backlog del portal. Resolución: instalar `i18next` + `react-i18next`, migrar archivos `*/strings.ts` a estructura de claves, migrar texto hardcoded de pages operativas. Decidir locales soportados (ES-EC + ES-CO mínimo F1).

#### D-195 — Sin componentes atómicos reutilizables (Button, Input, Modal, Card)
Cada modal, botón, input, card del repo se reimplementa en línea con `style={{...}}`. El patrón overlay de modal `rgba(0,0,0,0.8) + backdropFilter: blur(4px)` se repite en 6+ modales sin abstracción. No hay sistema de componentes. **Decisión cerrada del founder en S22.**
Origen: Fase 3 auditoría S22 (Bloque A.5). Prioridad: 🔴 BLOQUEANTE — sin esto, cada CN del backlog cuesta 3-5x. Disparo: Fase 0 del backlog del portal (es la fase). Resolución: construir 11 componentes atómicos (Button, Input, TextArea, Card, Modal, Select, Toast, Skeleton, Badge, EmptyState, StatCard) sobre Design System v3.1 con soporte explícito de 3 modos (dark, light, memorial).

#### D-196 — Tokens v3.1 NO incorporados al repo ✅ OBSOLETA
~~El repo está en design system v2 con 11 vars CSS básicas. `handoff/MIGRATION-v3.1.md` documenta 12 breaking changes para migrar a v3.1. Los archivos del handoff (`tokens.ts`, `variables.css`, `ThemeContext.tsx`) están listos pero no incorporados a `src/theme/` ni a `src/contexts/`.~~
**Obsoleta confirmada en S30 (21 May 2026):** los tokens v3.1 SÍ están incorporados al repo desde S24 — `src/index.css` importa `src/theme/variables.css` (v3.1 completo, 3 temas dark/light/memorial) + `src/theme/compat.css` (alias v2→v3.1). El relevamiento de S30 (sub-bloque 3) confirmó los 20+ tokens en uso. La deuda real residual es D-198 (347 valores rgba/hex fuera de tokens) que se reduce progresivamente.
Origen: Fase 3 auditoría S22 (Bloque A.5). Prioridad: 🟡 → ✅ obsoleta.

#### D-197 — Light mode pendiente — combinado con D-196
Repo actual es dark-only (cero `prefers-color-scheme`, cero `ThemeContext`, cero `data-theme`). Design System v3.1 declara dark + light + memorial como first-class. Instrucción nueva del founder en S22: habilitar light desde día 1 de la migración.
Origen: Fase 3 auditoría S22 (Bloque A.6). Prioridad: 🟡 ALTA. Disparo: Fase 0 del backlog del portal. Resolución: habilitar `data-theme` en body desde `ThemeProvider`, localstorage de preferencia, toggle accesible, verificar contraste AA en pantallas existentes.

#### D-198 — 347 valores rgba/hex fuera de tokens
347 ocurrencias de hex (`#XXXXXX`, `#XXX`) y rgba(...) hardcoded en archivos `.tsx`, fuera de tokens CSS. Bloquea theming dark/light real.
Origen: Fase 3 auditoría S22 (Bloque A.5). Prioridad: 🟢 MEDIA. Disparo: progresivo durante Fase 0-4 del backlog del portal. Meta de cierre F1: ≤100 hardcoded. Resolución: migrar progresivamente a tokens v3.1 a medida que se reconstruyen componentes.

#### D-199 — Tokens de opacidad/estado faltantes
Los tokens actuales codifican colores sólidos pero no sus variantes con opacidad. Resultado: `rgba(255,45,155,0.08)` repetido sin abstracción donde debería haber `--pink-subtle`. Los temas de v3.1 ya incluyen estas variantes (`pinkAlpha15`, `cyanAlpha15`, etc.).
Origen: Fase 3 auditoría S22 (Bloque A.5). Sub-deuda de D-198. Prioridad: 🟢 MEDIA. Disparo: Fase 0 del backlog del portal. Resolución: consumir las variantes de v3.1 al migrar componentes (parte de D-198).

#### D-200 — `esServicioExtendido()` Set TS hardcodeado divergente del catálogo DB
En `lib/servicios.ts`, `esServicioExtendido()` usa Set hardcodeado: `['hotel', 'guarderia_diurna', 'paseo', 'paseo_paquete', 'entrenamiento', 'adiestramiento']`. Si admin agrega un tipo nuevo al catálogo DB, no aparece en configuración extendida hasta editar este Set. Antipatrón regla 21.
Origen: Fase 3 auditoría S22 (Bloque B.1). Prioridad: 🟡 ALTA — bloquea motor de catálogo flexible. Disparo: Fase 7.1 del backlog del portal (motor de catálogo expandido). Resolución: consultar `tipos_servicio.requiere_config_extendida` desde DB en lugar de Set TS.
**Actualización S39:** drift confirmado contra catálogo real — el Set contiene 'guarderia_diurna' (código INEXISTENTE en DB) y omite los 4 reales de hospedaje ('guarderia_dia', 'guarderia_mensual', 'hotel_dia', 'hotel_noche'), que hoy no reciben configuración extendida. Resolución sin cambio: flag en DB (Fase 7.1).

#### D-201 — `TIPOS_QUE_VALIDAN_MEDICOS` hardcodeado en `Servicios.tsx:22-24`
Mismo antipatrón que D-200. Lista de tipos que requieren validación médica hardcoded en TS, divergente del flag `es_medico` que ya existe en `tipos_servicio` DB.
Origen: Fase 3 auditoría S22 (Bloque B.1). Prioridad: 🟢 MEDIA. Disparo: Fase 7.1 del backlog del portal. Resolución: consultar `tipos_servicio.es_medico` desde DB.

#### D-202 — Canal de invitación de empleado bypasea 6.4.7
`ModalLinkInvitacion.tsx:35-40` usa `window.open('https://wa.me/?text=...')` para compartir invitación. Decisión S20 declara mediación por plataforma invariante. F1-pragmático aceptable mientras no exista canal interno.
Origen: Fase 3 auditoría S22 (Bloque B.2). Parte de D-212 (violación sistémica 6.4.7). Prioridad: 🟢 MEDIA. Disparo: cuando exista canal interno mediado (Fase 7.2 del backlog del portal). Resolución: migrar a canal interno cuando esté disponible.

#### D-203 — Upload de foto de empleado es `<input type="text">` para URL externa
`ModalEditarEmpleado.tsx` permite editar `foto_url` como input de texto para pegar URL externa. No hay upload real a Storage ni preview.
Origen: Fase 3 auditoría S22 (Bloque B.2). Prioridad: 🟢 MEDIA. Disparo: Fase 1 o Fase 2 del backlog del portal. Resolución: implementar upload real con preview, alineado al wrapper de Storage de D-186.

#### D-204 — Casts prohibidos `as unknown as` en `dashboard.ts:140` + `servicios.ts`
`dashboard.ts:140` usa `return (data ?? []) as unknown as CitaResumen[]`. `servicios.ts` usa `as unknown as Json` en `configToJson`. Violan regla 34 del contrato.
Origen: Fase 3 auditoría S22 (Bloque B.3 + B.1). Prioridad: 🟢 MEDIA. Disparo: Fase 4 (Dashboard) y Fase 7.1 (Servicios) del backlog del portal. Resolución: tipar correctamente usando tipos inferidos por Supabase del JOIN.

#### D-205 — `Perfil.tsx` usa PhoneInput legacy con contrato divergente — data corruption activa
`Perfil.tsx` usa `PhoneInput` (contrato E.164 con `+`). El wizard usa `TelefonoInput` (contrato canónico sin `+`, L-035). Si un prestador completa wizard con `593991234567` y después edita en Perfil, el componente infiere prefijo desde `+` y vuelve a escribir con `+`. Formato inconsistente en DB. **Reclasificado de 🟡 ALTA a 🔴 BLOQUEANTE** — bug de datos en producción.
Origen: Fase 3 auditoría S22 (Bloque E.1). Prioridad: 🔴 BLOQUEANTE. Localización: `src/components/PhoneInput.tsx` (legacy), `src/pages/Perfil.tsx:17,417,424` (consumidor único activo). Disparo: Fase 1 del backlog del portal (reparaciones críticas). Resolución: migrar `Perfil.tsx` a `TelefonoInput`, eliminar `PhoneInput.tsx` (sin consumidores tras migración — regla 37), normalizar datos existentes con `+`.

#### D-206 — `isValidRucEC` hardcodeado EC-only en `Perfil.tsx:57`
Validación fiscal local en frontend que asume Ecuador (`/^\d{13}$/`). El resto del repo delega correctamente a RPCs SQL `validar_identificacion_fiscal` y `verificar_identificacion_disponible` por país.
Origen: Fase 3 auditoría S22 (Bloque B.4). Prioridad: 🟡 ALTA. Disparo: Fase 1 del backlog del portal (reconstrucción de Perfil). Resolución: eliminar función local, delegar a RPC.

#### D-207 — `Perfil.strings.ts` con `tipoFiscalOpciones` EC-only
Las opciones de tipo fiscal en `Perfil.strings.ts` son EC-only (`ruc`, `cedula`). Colombia tiene NIT con dígito verificador, Tarjeta Profesional, etc. Sin rama por `country_code`.
Origen: Fase 3 auditoría S22 (Bloque B.4). Prioridad: 🟡 ALTA. Disparo: Fase 1 del backlog del portal. Resolución: consultar tipos fiscales desde `cat_tipos_documento_titular` por país (RPC ya existe).

#### D-208 — `perfil.ts:79` descarta detalle de error de Supabase
`if (error) return { success: false }`. El mensaje de error de Supabase se descarta — el caller no puede mostrar qué falló al usuario.
Origen: Fase 3 auditoría S22 (Bloque B.4). Prioridad: 🟢 MEDIA. Disparo: Fase 1 del backlog del portal. Resolución: retornar `{ success: false, error: error.message }` o estructura equivalente. Migrar caller para mostrar detalle.

#### D-210 — `ModalAltaAsistida.tsx` sin estilos visuales en producción
El modal usa CSS classes (`modal-backdrop`, `modal`, `modal-header`, `modal-body`, `modal-footer`, `modal-error`, `form-paso1`, `paso2-bloque`, `resumen-alta`) que no tienen definición en `index.css`. Funcional en React pero visualmente unstyled en producción. Se propaga a 3 consumidores: `ModalCrearEstadia`, `ModalCrearBono`, `ModalCrearSuscripcion`. **Bug activo en producción.**
Origen: Fase 3 auditoría S22 (Bloque C.10). Prioridad: 🔴 BLOQUEANTE. Disparo: Fase 1 del backlog del portal. Resolución: reescribir con átomos de Fase 0 (Modal, Input, Button).

#### D-211 — TyC declara comisión 15%, MODELO_FINANCIERO declara 18%
`pages/legal/TerminosPrestadores.tsx` declara comisión 15%. `MODELO_FINANCIERO.md` declara 18% default para EC y CO. Si prestador firma TyC al 15% pero el motor cobra 18%, base para disputa legal.
Origen: Fase 3 auditoría S22 (Bloque C.7). Prioridad: 🟡 ALTA — discrepancia legal antes primer prestador real. Disparo: Fase 1 del backlog del portal. Resolución: decisión de negocio del founder + actualizar TyC y/o MODELO_FINANCIERO para consistencia. Verificar consistencia con `cat_paises.fee_percentage` y `fee_configs` en DB.

#### D-212 — Violación sistémica de 6.4.7 (comunicación mediada por plataforma)
Tres puntos del repo usan WhatsApp directo, bypaseando la decisión cerrada S20 (mediación por plataforma invariante): (a) `CitaDetalleModal.tsx:389-398` — link directo `wa.me/${cita.user?.telefono}`; (b) `wizard/strings.ts whatsappHelper` — declara que el WhatsApp es para que "tus clientes te contacten"; (c) `ModalLinkInvitacion.tsx:35-40` (D-202).
Origen: Fase 3 auditoría S22 (Bloques B.2, C.2, C.8). Prioridad: 🟡 ALTA. Disparo: Fase 7.2 del backlog del portal (canal interno mediado). Resolución: depende de construir canal mediado. Mientras tanto F1-pragmático aceptable con comentarios explícitos en código marcando la violación.

#### D-213 — `Paso7Documentos.tsx:152` hardcodea `tipoConfig.documentos.EC`
`const docs = tipoConfig.documentos.EC ?? []`. Para Colombia, `tipoConfig.documentos.CO` no existe — devuelve array vacío silencioso. El prestador colombiano no ve documentos requeridos.
Origen: Fase 3 auditoría S22 (Bloque C.8). Prioridad: 🟡 ALTA — bug multi-país real. Disparo: cuando se active prestador real de país distinto a EC. Resolución: leer `state.pais` del wizard state. Combinar con D-193 (poblar documentos por país en DB o en estructura TS).

#### D-214 — `ESPECIES` hardcodeado en dos lugares con conteo distinto
`lib/especies.ts ESPECIES_OFICIALES` tiene 7 especies. `ModalAltaAsistida.tsx ESPECIES` tiene 9 (incluye `cobaya`, `huron`). Ninguno lee de `cat_especies` DB. Si admin activa/desactiva especies en DB, ninguno refleja.
Origen: Fase 3 auditoría S22 (Bloque C.10). Prioridad: 🟢 MEDIA. Disparo: Fase 1 del backlog del portal (reescritura de ModalAltaAsistida). Resolución: consultar `cat_especies` desde DB, eliminar arrays hardcoded.

#### D-215 — Nav items `/metricas` y `/liquidaciones` apuntan a páginas inexistentes
`Layout.tsx` declara items en nav que no tienen `Route` ni componente. Click → 404.
Origen: Fase 3 auditoría S22 (Bloque C.9). Prioridad: 🟡 ALTA — confunde al prestador con 404. Disparo: Fase 1 del backlog del portal. Resolución: implementar páginas placeholder con `<EmptyState>` "Próximamente" hasta que las pantallas reales existan (D-023 y D-024).

#### D-216 — `ModalAltaAsistida` caso `prestador_existente` sin UI
`buscarClientePorEmail` puede retornar `existe: 'prestador_existente'`. `Paso2Display` no tiene branch para ese caso — cae al branch genérico de "varias familias" con `resultado.familias` que probablemente es array vacío. UI muestra dropdown vacío sin error.
Origen: Fase 3 auditoría S22 (Bloque C.10). Prioridad: 🟡 ALTA — silent failure. Disparo: Fase 1 del backlog del portal. Resolución: implementar branch dedicado con mensaje claro al prestador.

#### D-217 — `altaAsistida/index.ts` envía `p_telefono: ''` en lugar de `null`
La llamada envía string vacío cuando teléfono no fue ingresado. RPC recibe `p_telefono: string` (no nullable). DB guarda `''` en `cliente_pendiente_registro.telefono`. Semánticamente incorrecto.
Origen: Fase 3 auditoría S22 (Bloque D.3). Prioridad: 🟢 BAJA. Disparo: Fase 7.14 del backlog del portal. Resolución: `p_telefono: input.telefono?.trim() || null`. Requiere que la firma de la RPC acepte null.

#### D-218 — `timelineMascota` confía en RLS sin validación explícita de acceso
`lib/timelineMascota/index.ts` hace `.from('eventos_mascota').select(...).eq('mascota_id', mascotaId)` confiando en policies RLS. Si las policies de `eventos_mascota` todavía apuntan al helper viejo `user_tiene_acceso_a_mascota` antes de la reescritura post-S17 (riesgo L-076), el wrapper podría devolver filas incorrectas.
Origen: Fase 3 auditoría S22 (Bloque D.3). Prioridad: 🟢 MEDIA. Disparo: Fase 3 del backlog del portal (MascotaDetalle UI). Resolución: verificar en DB que policies usan helper post-S17. Validar acceso explícito en wrapper si aplica.

#### D-219 — RPC `crear_mascota_walkin` huérfana en DB sin wrapper TS
Tras la eliminación de `lib/walkin.ts` en S19, la RPC `crear_mascota_walkin` quedó en DB sin wrapper TS canónico. Accesible vía `supabase.rpc()` directo pero no abstraída.
Origen: Fase 3 auditoría S22 (Bloque D + E). Prioridad: 🟢 MEDIA. Disparo: cuando MascotaDetalle (D-110 UI) o un nuevo flow de walkin necesite crear mascotas desde el prestador. Resolución: crear wrapper en `lib/mascotas.ts` o `lib/walkin.ts` cuando se necesite.

#### D-234 — Asistente de oficio (feature de producto con IA)
Feature donde el prestador consulta conversacionalmente con un asistente IA que tiene contexto del bio-expediente de la mascota en atención. No es dictado por voz (eso es la decisión técnica F.1 de S26, ya resuelta con Web Speech API). Es un asistente con contexto que ayuda al prestador a pensar sobre el caso específico (ej: "¿Tobi tiene alergia registrada al shampoo medicado?", "¿la piel está más roja que en sesiones previas?"). Planteado y evaluado en S26. Decisión: construir, pero diferido. Es un producto en sí, no extensión de F.1. Su diseño correcto depende de saber qué consultas hacen los prestadores reales — información que no existe todavía. Requiere sesión propia de planning de producto, decisiones de costo recurrente (estimado 1-5 centavos USD por consulta), y guardrails de honestidad robustos (alucinación en contexto sanitario es catastrófica).
Origen: S26. Prioridad: 🟢 MEDIA (alta palanca de diferenciación, pero no urgente). Disparo: después de tener las 6 familias del flujo de atención en producción con prestadores reales usándolo. Ver `docs/FLUJOS_ATENCION_POR_FAMILIA.md` §4.

#### D-235 — Referencia ambigua "D-010" entre cierre de S25 y backlog canónico
El cierre de S25 (CLAUDE.md) menciona "D-010 (bug `formatFechaCorta(created_at)`)" como sub-sesión específica de fix trivial. Pero la entrada D-010 del Backlog canónico es "Catálogo documentos requeridos por tipo de prestador" (origen Planning 8 mayo), sin relación con `formatFechaCorta`. Una de las dos referencias usa el ID equivocado — probablemente el cierre de S25, donde la deuda heredada de la sesión paralela del sistema de pruebas debió recibir un D-NNN libre propio en lugar de "D-010". No bloquea Fase 2.
Origen: S26 (detectado al cruzar archivos en el arranque). Prioridad: 🟢 MEDIA. Disparo: próxima sesión que toque mantenimiento de CLAUDE.md o la sub-sesión del bug `formatFechaCorta`. Resolución: identificar el ID correcto de la deuda del bug `formatFechaCorta`, asignar D-NNN libre, corregir la mención en el cierre de S25.

#### D-236 — Confirmación post-pago de cita con Kushki
Cuando se integre Kushki, una cita pagada debe poder pasar a `confirmada` sin aceptación explícita del prestador. Para que las citas de la app no pisen la agenda externa del prestador, se necesitarán opciones de bloqueo de franjas.
Origen: S27 (diseño del mecanismo de acceso por cita). Prioridad: 🟡 ALTA. Disparo: integración de Kushki al ciclo de cita.

#### D-237 — Inventario prestador↔producto de oficio
Sección post-MVP para que el prestador marque (toggle) qué productos del catálogo maestro `cat_productos_oficio` usa, agregue los suyos con foto y componentes activos. No estricto en MVP — el prestador debe verlo útil, no como trabajo extra.
Origen: S27 (creación de `cat_productos_oficio`). Prioridad: 🟢 MEDIA. Disparo: post-MVP de grooming.

#### D-238 — Runtime test end-to-end del acceso por cita ✅
~~La migración `2026-05-20-S27-acceso-por-cita.sql` quedó verificada estructuralmente (trigger y función creados) pero sin runtime test end-to-end por falta de datos de prueba. Pasos del test documentados en el header de la migración.~~
Cerrada en S28 (20 May 2026). El runtime test del Bloque A ejercitó `iniciar_atencion_grooming` sobre una cita con acceso otorgado por `cita_automatica` (DM-S27.2). El acceso por cita funciona end-to-end.
Origen: S27. Prioridad: 🟡 ALTA → ✅ cerrada en S28.

#### D-239 — Seeds preliminares de catálogos de grooming sin validar
Los 37 seeds de los 5 catálogos de grooming + los 5 de `cat_productos_oficio` tienen `es_seed_preliminar = true`. Requieren validación con un groomer profesional antes de declarar grooming "cerrado a calidad de producto".
Origen: S27 (consolida marca de validación de S26). Prioridad: 🟡 ALTA. Disparo: regreso del founder a Colombia (~mediados junio 2026).

#### D-240 — Estado `no_show` sin punto de entrada en el portal
La RPC `marcar_no_show_cita` existe y está verificada (transición `confirmada → no_show`), pero no hay botón ni pantalla que la invoque en el portal del prestador. Decisiones de producto pendientes sobre el efecto económico de una cita pagada que pasa a `no_show`: reembolso o penalización. El founder decidió que eso se resuelve junto con el modelo de liquidaciones del servicio.
Origen: S28. Prioridad: 🟡 ALTA. Disparo: modelo financiero / liquidaciones, o integración de Kushki (relacionada con D-236). El botón/pantalla es Fase 4 del flujo de grooming.

#### D-241 — Zona horaria del "día" en `obtener_resumen_dia_grooming`
El filtro de fecha del resumen usa `terminada_en::date = p_fecha`, que compara en la zona horaria del servidor (UTC). Para un prestador en Colombia (UTC-5) una atención cerrada cerca de medianoche local puede caer en otro día UTC. El cálculo es correcto; lo que falta definir es si el "día" del resumen es el del prestador (zona local) o UTC.
Origen: S28. Prioridad: 🟢 MEDIA. Disparo: cuando haya prestadores reales operando, o al construir la pantalla `/cierre-del-dia` (Fase 4 del flujo de grooming).

### ⚪ Pulido pre-launch

#### D-082 — Validación con 5-10 prestadores reales
Piloto con prestadores reales antes de soft launch público.
Origen: Pulido post-stack. Prioridad: ⚪. Disparo: cuando bloque BLOQUEANTE esté completo.

#### D-083 — Stack de observabilidad: Sentry + PostHog + GitHub Actions
Monitoreo de errores en producción + analytics + CI/CD básico.
Origen: Pulido post-stack. Prioridad: ⚪.

#### D-084 — Auditoría de accesibilidad
WCAG mínimo 2.1 AA. Revisar contraste, navegación por teclado, screen readers.
Origen: Pulido post-stack. Prioridad: ⚪.

#### D-085 — Sistema de toasts coherente
Hoy hay mezcla de alerts, modals, mensajes inline. Unificar.
Origen: Pulido post-stack. Prioridad: ⚪.

#### D-086 — Página 404 amigable
Hoy es default de React Router.
Origen: Pulido post-stack. Prioridad: ⚪.

#### D-087 — Política de cookies + banner de consent
Requerimiento legal en LATAM y EU. Necesario antes de lanzamiento.
Origen: Pulido post-stack. Prioridad: ⚪. Disparo: antes de soft launch.

### ⏸ Pendientes legales y de operaciones

#### D-088 — Revisión legal con abogado
TyC, política de privacidad, contratos de prestadores.
Origen: Pulido post-stack. Prioridad: ⏸. Disparo: antes de soft launch.

#### D-089 — Constituir e-PetPlace S.A.S.
Constitución legal de la empresa.
Origen: Pulido post-stack. Prioridad: ⏸. Disparo: antes de facturar / antes del primer prestador real.

#### D-090 — Manual de operaciones de admin
Documentar procesos de aprobación de prestadores, gestión de disputas, etc.
Origen: Pulido post-stack. Prioridad: ⏸. Disparo: antes de soft launch.

#### D-091 — Persona de soporte / customer success
Equipo o persona dedicada a atender prestadores y clientes finales.
Origen: Pulido post-stack. Prioridad: ⏸. Disparo: antes de soft launch.

### 🟡 Seguridad

#### D-092 — Rotar API key de Google Places
Buena práctica periódica de seguridad. La key actual está en el repo via .env.local.
Origen: Seguridad. Prioridad: 🟡. Disparo: antes de soft launch público o cuando se sospeche compromiso.

### Meta

#### D-093 — Refactor estructural de CLAUDE.md ✅
~~Esta misma deuda. Cuando se complete el refactor de las 6 fases, marcar como cerrada.~~
Completado en Sesión 10 (10 Mayo 2026) en 6 fases. Secciones unificadas, numeración L-NNN + D-NNN, obsoletos eliminados.
Origen: S10. Prioridad: 🟡 → ✅ cerrada.
(consolida #102)

#### D-094 — Activar PITR (Point-in-Time Recovery) en Supabase
Add-on adicional al plan Pro. ~$100/mes. Permite restaurar a punto
exacto en el tiempo (no solo daily snapshot).
Origen: S11. Prioridad: ⏸ DIFERIDA. Disparo: cuando arranque flujo
Kushki real con transacciones en producción.

### Deudas de Sesión 29 (21 Mayo 2026)

#### D-242 — Subsistema de restricciones / alertas de salud (redimensionada en S30) ✅
🟠 ALTA. El relevamiento de S30 confirmó que la RPC `obtener_alertas_activas_mascota_para_familia_servicio` NO existe y, más importante, que NINGUNA tabla del subsistema que la sostiene existe. La deuda no es "verificar la RPC" — es **diseñar e implementar el subsistema completo**: (1) catálogo `cat_restricciones_servicio` (reglas declarativas por familia: qué alergia/condición bloquea qué servicio), (2) tabla `restricciones_mascota_activas` (filas vivas por mascota, alimentadas desde eventos del bio-expediente), (3) trigger de aplicación automática (crea/actualiza filas vivas cuando se diagnostica una alergia/condición), (4) la RPC misma (consulta + curación por familia destinataria), (5) decisiones de modelo de negocio (qué reglas hard-block, qué soft-warn, qué requiere consentimiento del prestador). La pantalla del Antes (S30) renderiza un bloque "Alertas de salud activas — próximamente" como placeholder declarado.
Origen: S29, redimensionada en S30 (T-S30.3). Prioridad: 🟠 ALTA. Disparo: arranque de S31 (trabajo central declarado). Idealmente tras validación con groomer/vet real (~junio 2026) — las reglas de restricción requieren validación profesional.
Cerrada en S31 (22 May 2026). Las 5 piezas implementadas y probadas E2E: catálogo `cat_restricciones_servicio` con 14 seeds; tabla `restricciones_mascota_activas`; trigger sobre `mascota_perfil_vigente` (no sobre `eventos_mascota` como decía el diseño inicial); RPC `obtener_alertas_activas_mascota_para_familia_servicio` que devuelve `{ ok, alertas: [...] }` con severidad y descripción; frontend con wrapper `obtenerAlertasSaludActivas` (sección G de `src/lib/grooming/index.ts`) y bloque renderizable en `ColumnaEstadoFisico` (lista con Badge por severidad). Commit del frontend: `6c4cb65` (pieza 5). Las 4 piezas de DB se cerraron en sesión paralela del founder pre-S31. Drift documental detectado y corregido en S31: `BIO_EXPEDIENTE.md` §E2 y `FLUJOS_ATENCION_POR_FAMILIA.md` §3.4.

#### D-243 — Actualizar §3.4 FLUJOS_ATENCION_POR_FAMILIA.md de 14 a 15 RPCs
🟢 MEDIA. T-S28.1 agregó `registrar_estado_pelaje_grooming` al alcance pero §3.4 del doc sigue listando 14 RPCs. Drift documental.
Origen: S29 (detectado al revisar T-S28.1). Disparo: inicio de S30 o cualquier sesión que lea §3.4.

#### D-244 — Extracción `ResultadoWrapper<T>` + cronómetro a `src/lib/atencion/`
🟢 MEDIA. T-S29.1: los 15 wrappers en `src/lib/grooming/` tienen lógica transversal reusable (ResultadoWrapper, mapeo de error, cronómetro). Extraer a `src/lib/atencion/` cuando se diseñe la segunda familia (paseo) para que el patrón sea reusable. No abstraer especulativamente antes.
Origen: S29. Disparo: diseño de Familia B (paseo).

### Deudas de Sesión 30 (21 Mayo 2026)

#### D-245 — Sub-bloques 3b/3c del Durante de grooming ✅
🟠 ALTA. El Durante (S30 sub-bloque 3a) tiene esqueleto completo: header (foto + nombre + cronómetro), footer Pausar/Reanudar/Terminar contra los wrappers, ciclo de vida por nav state. Pero el cuerpo era un placeholder `<PlaceholderSecciones />`. Falta: (3b) acciones de captura — Foto / Nota / Incidencia, que consumen `subirArchivoGrooming`, `crearDictadoVoz`, `agregarIncidenciaGrooming`; (3c) captura ligera — Servicios / Zonas / Estado del pelaje, que consumen `agregarServicioGrooming`, `agregarZonaGrooming`, `registrarEstadoPelajeGrooming`. Las 6 RPCs de captura ya están construidas en S28 y los wrappers TS en S29.
Origen: S30. Disparo: S31, parte del flujo de grooming pendiente.
Estado S31: sub-bloque 3b ✅ CONSTRUIDO y probado E2E. Componentes nuevos: `BotonAccionGrande`, `AccionNota` (con dictado de voz), `AccionIncidencia` (con catálogo de incidencias vía wrapper `obtenerIncidenciasGrooming` nuevo en `lecturaAntes.ts`), `AccionFoto` (con dos round-trips encadenados, manejo de huérfano). navState del Durante extendido con `prestador_id` (DM-S31.2). Encabezado "Registrá la atención" agregado. 2 bugs de contrato detectados en runtime y corregidos: `via='texto'/'dictado'` → `'escrita'/'dictada'`; campo `id` en respuesta vs `nota_id`/`incidencia_id`/`archivo_id`. Commits: `81f5667`, `a1f8b9b`, `48d2476`, `c6eea99`, `605e9fe`. Pendiente 3c (captura ligera) — ver D-253 antes (auditar contrato del resto de wrappers de S28).
Cerrada en S31b (22 May 2026). Sub-bloque 3c construido (componente `CapturaLigera`, 3 wrappers de lectura de catálogo, carga de estado registrado) y probado E2E. 3b se había cerrado en S31. D-245 completa.

#### D-246 — Runtime test pendiente de Storage + dictado de voz ✅
🟢 MEDIA. `src/lib/storage/` (S30 sub-bloque 1) y `src/lib/captura/dictadoVoz.ts` (S30 sub-bloque 2) compilan verde y están consumidos teóricamente por el Durante futuro, pero nunca fueron ejercitados contra runtime real. El runtime test E2E de S30 cubrió `iniciar`/`pausar`/`reanudar`/`terminar` pero no las acciones de captura.
Origen: S30. Disparo: construcción del sub-bloque 3b del Durante (D-245) — las acciones Foto/Nota los ejercitan naturalmente.
Cerrada en S31 (22 May 2026). Runtime test E2E del 3b ejercitó: `AccionFoto` → `subirArchivoGrooming` (sube blob al bucket, devuelve `storage_path` + signed_url) → `registrarArchivoGrooming` (escribe fila en DB). `AccionNota` → `crearDictadoVoz` (Web Speech, transcripción en navegador) → `agregarNotaGrooming`. Ambos paths verificados en navegador. Bugs del wrapper detectados en este test → corregidos en commit `605e9fe`.

#### D-247 — Race condition en `ProtectedRoute` con entrada por URL directa (sesión fría)
🟢 MEDIA. En `src/App.tsx`, al entrar por URL directa a una ruta protegida profunda con sesión fría, hay un instante con `session` presente pero rol aún no resuelto: `ProtectedRoute` rebota a `/login` (porque `isPrestador=false`), y `/login` con `isPrestador` ya resuelto rebota a `/` (Dashboard). Resultado: la URL profunda se pierde. Bug pre-existente de `App.tsx`, ajeno al scope de S30, destapado por el runtime test E2E (entrada por URL al Antes redirige a Dashboard). La navegación interna (sesión caliente) no lo dispara. Mitigación temporal usada en S30: botón de test interno con `useNavigate()`.
Origen: S30 (descubierto en runtime test E2E). Disparo: antes de exponer rutas profundas compartibles por link, o cuando se construya el ruteo Agenda→Antes. Fix probable: que `ProtectedRoute` espere a que el rol esté resuelto antes de rebotar (acoplar mejor `authLoading` con el check de rol).

#### D-248 — `ResultadoIniciarGrooming` sin timestamp de inicio
🟢 MEDIA. La RPC `iniciar_atencion_grooming` escribe `eventos_mascota_grooming.iniciada_en` (DEFAULT `now()` del servidor) pero NO lo devuelve en su payload (`{ grooming_id, evento_id, cita_id, estado: 'en_curso' }`). El cliente usa `new Date().toISOString()` para el cronómetro indicativo del Durante — drift cliente/servidor ~50-500ms, irrelevante para un cronómetro indicativo (el cómputo real de duración lo hace el server en `terminar`).
Origen: S30. Prioridad: 🟢 MEDIA. Disparo: si el cronómetro pasa a ser auditado / fuente de verdad. Fix: extender la RPC para devolver `iniciada_en` en el JSON resultado.

#### D-249 — Pasos 6 y 7 del runtime test E2E S30 verificados solo por lectura de código
⚪ BAJA. El runtime test E2E del camino Antes→Durante (S30) cubrió los pasos 1-5 contra DB real: setup del escenario, navegación interna al Antes, lectura de las 3 columnas, click en "Iniciar atención", llegada al Durante con cronómetro corriendo, iniciar/pausar/reanudar/terminar. Los pasos 6 (entrada a `/cita/<id>/grooming/antes` con cita NO-grooming → estado de error con link a /agenda) y 7 (entrada al Durante sin nav state → `EstadoSinNavState`) se verificaron por lectura del código, no ejercitados en runtime. Bloqueados por: falta de ruteo Agenda→Antes y por D-247 (URL directa rebota a Dashboard).
Origen: S30. Disparo: cuando exista el ruteo Agenda→Antes y/o se resuelva D-247.

### Deudas de Sesión 31 (22 Mayo 2026)

#### D-250 — Drift `cat_tipos_evento` para evento de alergia ✅
🔴 BLOQUEANTE latente. Detectado en S31. La fila de catálogo tenía `codigo='alergia_identificada'` / `tabla_tipada='evento_alergia_identificada'`, pero la tabla tipada real es `evento_alergia_diagnosticada` y el trigger escribe `tipo='alergia_diagnosticada'`. Cualquier diagnóstico real de alergia habría fallado contra la FK `eventos_mascota.tipo → cat_tipos_evento.codigo`. Sin contrato consistente entre catálogo y triggers, el primer caso real explotaba en producción.
Origen: S31 (detectado al diseñar el test de D-242). Prioridad: 🔴 hasta cerrar.
Cerrada en S31 (22 May 2026). Fila recreada en `cat_tipos_evento` con `codigo='alergia_diagnosticada'` / `tabla_tipada='evento_alergia_diagnosticada'` vía INSERT+DELETE. Verificado en DB. Drift documental asociado: `BIO_EXPEDIENTE.md` §E2 (`alergia_identificada` → `alergia_diagnosticada`) — corregido en S31.

#### D-251 — Simulación de diagnóstico de alergia/condición en el sistema de pruebas
🟢 MEDIA. El test E2E de D-242 tuvo que sembrar la alergia por INSERT directo a `evento_alergia_diagnosticada` porque no existe una función helper `simular_vet_diagnostica_alergia` / `simular_vet_diagnostica_condicion`. Funciones equivalentes ya existen para otros eventos sintéticos. Sin esto, cada test futuro que necesite arrancar de "mascota con alergia activa" repite el INSERT crudo (o salta el camino completo de propagación al perfil vigente).
Origen: S31. Disparo: cuando el sistema de tests necesite alergias/condiciones como precondición y el INSERT directo deje de alcanzar (p.ej. tests que dependan de side-effects del trigger de diagnóstico real).

#### D-252 — Cronómetro del Durante salta al reanudar tras pausa ✅
🟢 MEDIA. Hoy el cronómetro del Durante (`src/components/CitaGroomingDurante/Cronometro.tsx`) cuenta `now - iniciada_en` y el display se congela en pausa pero al reanudar salta al tiempo real transcurrido (correcto-por-diseño en S30, ver D-248). Objetivo: que no salte y que el cierre del Durante muestre dos tiempos — tiempo real de servicio (descontando pausas, calculado server-side desde `evento_grooming_pausas`) y tiempo total de pared.
Origen: S31. Disparo: construcción del cierre del Durante (post-3c).
Cerrada en S32 (30 May 2026) por DM-S32.2 (decisión, sin código): el cronómetro mantiene comportamiento de tiempo de pared — no se congela en pausa, sobrevive a re-montaje sin saltos artificiales ("el tiempo pasó aunque la atención estuviera detenida"). El doble tiempo (trabajo vs sesión) se calcula server-side en la RPC `obtener_resumen_cierre_grooming` y se muestra en el modal de cierre rápido, no en el cronómetro del Durante.

#### D-253 — Resto de wrappers de S28 con mismo bug de contrato del 3b ✅
🟠 ALTA. `registrarProductoGrooming` lee `o.producto_id` (campo inexistente); la RPC devuelve `{ ok: true, id: <uuid> }`. Mismo bug que se corrigió en S31 para `agregarNotaGrooming`, `agregarIncidenciaGrooming` y `registrarArchivoGrooming` (commit `605e9fe`). Conviene auditar también `agregarServicioGrooming`, `agregarZonaGrooming` y `registrarEstadoPelajeGrooming` — todo el set de S28 puede tener el mismo desajuste; ninguno fue ejercitado en runtime todavía.
Origen: S31. Disparo: ANTES de construir 3c (las acciones de captura ligera consumen estos wrappers). Probable fix: leer `o.id` y validar `o.ok === true`, igual que la corrección de `605e9fe`.
Cerrada en S31b (22 May 2026). Los 4 wrappers (`agregarServicio`, `agregarZona`, `registrarProducto`, `registrarEstadoPelaje`) corregidos al patrón `o.ok === true` + `o.id`. 3 de los 4 ejercitados en el runtime test E2E de 3c; `registrarProducto` corregido por consistencia, no ejercitado (no lo consume 3c). Commit `05e2663`.

#### D-254 — `test_cleanup_all()` no barre lo creado en tests E2E desde la navegación real
🟢 MEDIA. La función `test_cleanup_all()` del sistema de pruebas no contempla: groomings iniciados (`eventos_mascota_grooming`), eventos `atencion_grooming_registrada`, alergias sembradas por INSERT directo, blobs de Storage (bucket `grooming-archivos`). Y choca con tablas auto-referenciales (`eventos_mascota.evento_padre_id`) al no ordenar hijos antes que padres. Necesita un barrido por escenario, no solo por registry.
Origen: S31 (observado en cleanup del runtime test del 3b). Disparo: cuando se monten suites de tests E2E recurrentes que dependan de un estado limpio entre corridas.
Actualización S32 (30 May 2026): diferida sin fix de código por DM-S32.7. `escenario_grooming_iniciado()` existe en DB pero no es invocable desde SQL Editor (no provee `auth.uid()`). El procedimiento manual transaccional documentado en el handoff de S31b (borrar grooming + sub-evento `atencion_grooming_registrada` con la auto-referencia `eventos_mascota.evento_padre_id` ordenada) queda como método oficial hasta que se monte la suite recurrente.
Actualización S33 (1 Jun 2026): se ejecutó el cleanup manual y se mapeó el grafo de FK real (más complejo de lo documentado). El borrado de un grooming de test huérfano del registry está bloqueado por TRES FK distintas, en este orden de resolución: (1) `eventos_mascota_grooming` referencia al sub-evento `atencion_grooming_registrada` por `evento_id` Y a la cita por `cita_id` → borrar el grooming PRIMERO; (2) el sub-evento `atencion_grooming_registrada` cuelga de un evento-cita del registry por `eventos_mascota.evento_padre_id` (auto-referencia RESTRICT) → borrarlo SEGUNDO, ya sin grooming que lo referencie; (3) recién entonces `test_cleanup_all()` puede barrer el registry sin trabarse. Procedimiento verificado en transacción única con COMMIT en el mismo batch (el SQL Editor de Supabase NO mantiene transacción entre ejecuciones separadas; un BEGIN sin COMMIT en el mismo batch hace rollback implícito).
Actualización S34 (1 Jun 2026): el cleanup se acumuló más. Runtime tests del paso 2 del sub-bloque 6 (cerrar con pendiente desde el modal) y del sub-bloque 3 (pantalla `/mis-atenciones`) dejaron groomings adicionales en estado `cerrada_con_pendiente`/`cerrada_con_calidad` sin barrer. Sigue diferida sin fix de código; aplica el procedimiento manual transaccional documentado.

#### D-255 — Pausa del Durante con tres representaciones del estado
🟠 ALTA. El estado de pausa vive en tres lugares que se desincronizan: (1) frontend `estadoAtencion: 'pausada' | 'en_curso'`, (2) `eventos_mascota_grooming.estado`, (3) tabla `evento_grooming_pausas` (filas abiertas). Observado en S31: `pausar_atencion_grooming` rechazó con `atencion_ya_pausada` por una pausa abierta en la tabla, mientras el `estado` decía `en_curso` y el frontend también. Sin una fuente única de verdad, pausar/reanudar quedan frágiles. `pausar` y `reanudar` deben ser robustos a estados inconsistentes (no asumir, leer y reconciliar).
Origen: S31 (observado en runtime test del 3b). Disparo: antes del primer prestador real usando el flujo de grooming, o si reaparece en otro runtime test.
Actualización S32 (30 May 2026): diferida sin evidencia nueva por DM-S32.8. La tabla `evento_grooming_pausas` quedó vacía al cierre de S32 — no se reprodujo la desincronización ni se observaron filas huérfanas en la sesión.

#### D-256 — Log de acciones capturadas en pantalla del Durante ✅
🟢 MEDIA. La pantalla del Durante tiene espacio vacío debajo del grid de las tres acciones. Mostrar ahí lo capturado en la sesión en curso (notas / incidencias / fotos ya cargadas, con timestamp) cumple dos objetivos: aprovechar el espacio y dar visibilidad inmediata al groomer de qué ya quedó registrado.
Origen: S31 (mejora de UX pedida en S31). Disparo: junto con 3c o después.
Cerrada en S31b (22 May 2026). Log de acciones del Durante construido y probado E2E. Wrapper `obtenerLogAcciones` con tipo unificado `AccionLog` discriminado (nota/incidencia/foto), 3 SELECT directos en paralelo, orden cronológico DESC. Componente `LogAcciones` con miniaturas vía signed URL, refresco vía `refreshKey` que las 3 acciones del 3b bumpean por `onCapturado`. Commit `3482cb0` (+ fix escala severidad `4ca8414`).

### Deudas de Sesión 31b (22 Mayo 2026)

#### D-257 — Regenerar tipos de Supabase / eliminar binds `as unknown as` de RPCs no tipadas
🟢 MEDIA. Cada RPC nueva creada en DB queda fuera de `database.types.ts` hasta regenerar los tipos. El repo viene arrastrando un patrón de workaround — `supabase.rpc.bind(supabase) as unknown as RpcFn` — para llamar RPCs no tipadas sin que TypeScript se queje. Ya aparece en `historiaClinica.ts`, en `obtenerAlertasSaludActivas` (sección G, S31), y en los 3 wrappers de quitar de la opción B (sección H, S31b). El cast es funcional pero es deuda: el día que se regeneren los tipos de Supabase, todos esos binds se pueden eliminar y las llamadas `supabase.rpc('nombre', ...)` typechequean solas.
Origen: S31b. Disparo: próxima vez que se toque la generación de tipos de Supabase, o antes de que el patrón se multiplique más.
Actualización S34 (1 Jun 2026): el patrón se multiplicó. Los 2 wrappers nuevos `obtenerMisAtencionesGrooming` y `registrarEstadoPelajeEnCierre` (sub-bloque 3 backend) reutilizan el `rpcCierre` bind heredado de S32 — son al menos 2 wrappers más sobre la misma vía. Mientras no se regeneren tipos, futuras RPCs nuevas seguirán cayendo al mismo patrón.

### Deudas de Sesión 32 (30 Mayo 2026)

#### D-258 — Migraciones SQL de S29-S31b ausentes del repo
🟠 ALTA. El sistema versiona migraciones en `supabase/migrations/` (patrón retomado en S32 con la migración de la RPC `obtener_resumen_cierre_grooming`), pero las RPCs creadas entre S29 y S31b se ejecutaron solo en SQL Editor y no quedaron versionadas en el repo. Hoy `supabase/migrations/` no refleja el estado real de DB: faltan al menos la RPC `obtenerAlertasSaludActivas` y las 3 RPCs de borrado de la opción B (`quitar_servicio_grooming`, `quitar_zona_grooming`, `quitar_estado_pelaje_grooming`), más cualquier otra creada en ese tramo. La migración de S32 cumple para lo nuevo desde ahora; resolver el atrasado requiere relevar todas las RPCs creadas entre S29 y S31b contra DB y emitir migraciones retroactivas.
Origen: S32. Disparo: antes de cualquier ambiente staging/prod nuevo (D-007), o antes de que alguien tenga que rehidratar DB desde el repo. Tarea de sesión dedicada.
Actualización S33 (1 Jun 2026): cierre PARCIAL. Versionadas retroactivamente las 3 RPCs de borrado `quitar_servicio_grooming`/`quitar_zona_grooming`/`quitar_estado_pelaje_grooming` (commit `43da974`, DDL relevado literal desde DB, idempotente). Descubierto en el relevamiento: esas 3 RPCs dependen de la función auxiliar `_grooming_atencion_operable(uuid)`, que TAMBIÉN está sin versionar (sumar a esta deuda). Sigue pendiente: `obtener_alertas_activas_mascota_para_familia_servicio` + subsistema D-242 (tabla/catálogo/trigger), `_grooming_atencion_operable(uuid)`, los bodies de `escenario_grooming_iniciado()`/`test_cleanup_all()`/`escenario_d167_setup()`, y cualquier otra RPC del tramo S29-S31b. La RPC `obtener_resumen_cierre_grooming` quedó al día (extendida y versionada en S32/S33).
Actualización S34 (1 Jun 2026): se amplía con el backend de Mis atenciones. Aplicadas en DB pero NO versionadas en `supabase/migrations/`: el guard `_grooming_atencion_editable_en_cierre(uuid)` (tercer gemelo de `_grooming_atencion_operable`/`_grooming_atencion_terminada` — los 3 sin versionar), la RPC `registrar_estado_pelaje_en_cierre`, y la RPC `obtener_mis_atenciones_grooming`. Sumar a la lista de retroactivas pendientes para la sesión dedicada de housekeeping.
Actualización S35-SB5b (2 Jun 2026): cierre PARCIAL adicional. Versionadas retroactivamente las 2 funciones S34 que SB-5b necesitaba tocar/reusar: `_grooming_atencion_editable_en_cierre(uuid)` y `registrar_estado_pelaje_en_cierre(uuid, text, text, text)`. Cuerpos pegados verbatim desde `pg_get_functiondef` en DB al 2 jun 2026 (no inferidos). Versionadas como `CREATE OR REPLACE` en `supabase/migrations/2026-06-02-S35-SB5b-cierre-con-calidad-relajado.sql` (junto a `cerrar_grooming_con_calidad` que se modifica para reusar el helper, ver DM-S35.8). Sigue pendiente del tramo S34: `obtener_mis_atenciones_grooming`. Sigue pendiente del tramo S29-S31b: `_grooming_atencion_operable(uuid)`, `obtener_alertas_activas_mascota_para_familia_servicio` + subsistema D-242, bodies de `escenario_grooming_iniciado()`/`test_cleanup_all()`/`escenario_d167_setup()`.

#### D-259 — Bottom-sheet responsivo en mobile para modal de cierre rápido
⚪ BAJA. El componente `ModalCierreRapido` (`src/components/CitaGroomingDespues/ModalCierreRapido.tsx`) reusa el `Modal` de `ui/` que es centrado en ambos viewports. Por DM-S32.9 se aceptó modal centrado universal como cierre de S32; bottom-sheet en mobile queda como mejora UX para cuando se haga pulido del Después. Originalmente F2 en el handoff de S32.
Origen: S32. Disparo: pulido de UX mobile del flujo Después.

### Deudas de Sesión 34 (1 Jun 2026)

#### D-260 — Drift de copy "Cierre del día" → "Mis atenciones" en strings de UX ✅ SALDADA en S35-SB5b
🟢 MEDIA. ~~Por DM-S34.3 la pantalla se llama "Mis atenciones" y la ruta es `/mis-atenciones`. Pero quedaron strings que todavía mencionan "Cierre del día" (rename incompleto)~~.
Resolución (2 jun 2026, en SB-5b junto con la extracción de sub-componentes a `secciones.tsx`):
- `NotaCierre` (ahora en `src/components/CitaGroomingDespues/secciones.tsx`): copy reescrito con los textos correctos inlineados. "Cierre del día" → "Mis atenciones" en las 2 frases del componente.
- `src/lib/grooming/strings.ts`: los 4 mensajes `calidad_falta_*` recortados — se quitó el sufijo "Completalo en el Cierre del día." entero (no se reemplazó por "Mis atenciones" porque ahora el usuario subsana desde la pantalla de cierre misma, no desde Mis atenciones; el copy queda más corto y la UI dice qué hacer). Los 4 mensajes ahora son enunciados puros: "Para cerrar con calidad falta {X}.".

#### D-261 — Captura en cierre limitada a estados recibir/entregar
⚪ DIFERIDA CONDICIONAL. Por DM-S34.4 la primera versión de captura en cierre (Sub-bloque 4, D-262) edita SOLO `registrar_estado_pelaje_en_cierre` (los dos momentos del pelaje, que son lo mínimo bloqueante para cerrar con calidad). Quedan FUERA del alcance: agregar/quitar servicios, agregar/quitar zonas, agregar notas, fijar precio final, escribir mensaje a la familia. Activador: si Carolina (o cualquier groomer) reporta necesidad de corregir esos otros campos desde el cierre, ampliar agregando RPCs gemelas que acepten estados de cierre (mismo patrón de DM-S34.1).
Origen: S34. Disparo: pedido real post-producción, o hallazgo de gap en runtime test.

#### D-262 — Sub-bloque 4 del Después: detalle de atención + captura recibir/entregar desde Mis atenciones
🟠 ALTA. La pantalla `/mis-atenciones` lista las pendientes con chips de qué falta, pero el `onClick` de cada card es `() => {}` (TODO sub-bloque 4). Falta la pantalla/modal de detalle que: (a) muestre el resumen de la atención, (b) permita registrar los estados recibir/entregar usando `registrarEstadoPelajeEnCierre` (RPC ya existe), (c) ofrezca el botón "Cerrar con calidad" cuando las 4 banderas estén en false, llamando `cerrarGroomingConCalidad` (wrapper ya existe). DIFERIDA a S35 porque depende de la decisión de navegación abierta (pipeline visual): si la navegación cambia, "cerrar con calidad" puede vivir en otra pantalla de la nueva estructura, no necesariamente como sub-vista de Mis atenciones.
Origen: S34. Disparo: una vez decidida la navegación en S35.

#### D-263 — Drift documental `/cierre-del-dia` → `/mis-atenciones` en docs maestros
🟢 MEDIA. La ruta `/cierre-del-dia` nunca existió como ruta construida (solo en docs); por DM-S34.3 la ruta real es `/mis-atenciones`. Quedan referencias documentales por barrer en `docs/FLUJOS_ATENCION_POR_FAMILIA.md` (§3.4-§3.6 documentaban `/cierre-del-dia` con sus dos modos según DM-S33.2, "cerrar día / histórico solo-lectura"), posiblemente también en `MODELO_PRODUCTO.md` si la menciona. Fix: relevar literal y reescribir referencias a `/mis-atenciones` (ojo: el "histórico solo-lectura" pasa a ser el tab Historial de la nueva pantalla; el "cerrar día" se distribuye entre el modal de cierre rápido + el flujo de Sub-bloque 4 cuando exista).
Origen: S34. Disparo: oportunístico cuando se toquen esos docs, o batch en pulido documental.

### Deudas de Sesión 35 (2 Jun 2026)

#### D-264 — UPDATE directo a `evento_cita_servicio` desde lib/citas.ts ✅ SALDADA en S35-SB1
🟠 ALTA → ✅ SALDADA. ~~Pre-S35 los 5 wrappers de transición de estado de cita (`confirmarCita`, `rechazarCita`, `iniciarAtencion`, `completarCita`, `marcarNoShow`) hacían `UPDATE` directo a `evento_cita_servicio` desde el frontend, evadiendo el patrón canónico del repo (RPC SECURITY DEFINER como única entrada a tablas con RLS). Acoplaba la UI al schema y dejaba sin guard de transición/validación de acceso server-side las acciones más comunes del prestador.~~
Resolución (2 jun 2026, S35-SB1): migración `supabase/migrations/2026-06-02-S35-SB1-rpcs-transicion-cita.sql` con 4 RPCs nuevas (`confirmar_cita_servicio`, `rechazar_cita_servicio`, `iniciar_atencion_cita`, `completar_cita_servicio`) + `CREATE OR REPLACE` aditivo de `marcar_no_show_cita` (que ya existía desde S28 sin callers TS). Los 5 wrappers TS de `src/lib/citas.ts` reapuntados, firmas TS intactas (los callers en `CitaDetalleModal` no notan el cambio). Patrón canónico cumplido: SECURITY DEFINER + search_path + auth gate + validación de inputs + `user_puede_acceder_prestador(prestador_id)` derivado del SELECT INTO de la fila (sin acceso horizontal) + guard de transición por estado origen + UPDATE con `AND estado=<esperado>` para idempotencia + REVOKE/GRANT. Camino A (decidido por founder): RPC solo hace UPDATE, notificación al cliente queda client-side via `crearNotificacion` con campos meta devueltos por la RPC en su jsonb — ver D-265 para el trade-off documentado.
Origen: S35-SB1. Saldada: S35-SB1.

#### D-268 — Retiro de Citas.tsx + integración con "Tu día" diferido a S36
🟠 ALTA. SB-6 de S35 originalmente contemplaba retirar `src/pages/Citas.tsx` (reemplazada por "Tu día"), pero el relevamiento mostró 3 capacidades únicas que "Tu día" NO cubre y que el founder NO quiere perder:
- **Filtro libre por estado de cita** (ver "solo las canceladas", "solo las pendientes"). "Tu día" agrupa por momento/fuente, no por estado libre.
- **Historial completo de citas no-grooming** (completadas/canceladas/no_show/rechazadas, sin tope temporal). "Tu día" solo muestra día/semana/mes actual o un período pasado puntual. `MisAtenciones` cubre historial pero SOLO para grooming.
- **Vista de "todas las citas del prestador" en una sola pantalla** sin navegar fecha por fecha.
Decisión del founder en S35-SB6: Citas se mantiene tal cual. SB-6 quedó reducido a solo el ajuste visual de Agenda (quitar BLOQUE_COLOR y la leyenda de estados, ver commit de S35-SB6).
Trabajo diferido a S36: decidir cómo integrar Citas y "Tu día" sin perder esas 3 capacidades, + mejora visual de "Tu día" (uso del espacio). Opciones a evaluar: (a) Citas se fusiona dentro de "Tu día" como un tab/sub-vista, (b) Citas queda como pantalla separada pero rediseñada para no duplicar lo que "Tu día" ya muestra, (c) las capacidades únicas de Citas migran a Agenda u otra pantalla pre-existente.
Origen: S35-SB6. Disparo: S36 inicia con esta decisión como uno de los primeros puntos a cerrar.

**Actualización S36 (DM-S36.1):** el trabajo de integración de Citas + "Tu día" se difiere formalmente a S38, una vez que las familias simples (S36) y médica (S37) estén conectadas al contenedor. La decisión de cómo integrar se toma mejor con el modelo ya generalizado. Sigue 🟠 ALTA. NO se tocó en S36.

**Actualización S37 (doble listado en Tu día):** tras terminar una atención de grooming, la CITA queda `en_curso` (la RPC de terminar no toca el estado de la cita) → la misma mascota aparece en la zona "En curso" (filtro por cita) Y en "Por cerrar" (filtro por atención terminada) de Tu día. Resolución correcta: se decide en la unificación Tu día/Citas, no parchear el filtro hoy.

**Actualización S38 (reproducida en 2ª familia, sube urgencia):** la misma patología se observó en paseo durante el smoke E2E — tras cerrar con calidad, la cita queda `en_curso` (las RPCs de cierre de oficio NO tocan `evento_cita_servicio.estado`) y Tu día sigue listando la mascota en "En curso". Pasó de ser caso aislado de grooming a incidencia transversal de 2 familias, y todas las familias futuras lo arrastrarán por defecto. **Sube urgencia de cara al soft launch.** La resolución de D-268 (integración Tu día/Citas, B6 del arco) debe incluir el tratamiento del estado terminal de la cita post-cierre de atención: o se resuelve a nivel cita-RPC (la RPC de cierre orquesta la transición de la cita), o a nivel filtro de Tu día (cita `en_curso` CON atención cerrada NO debe aparecer en "En curso"). Decisión a tomar en B6.

**Actualización S40/S41 (pata DB resuelta):** las RPCs de cierre ahora orquestan la transición de la cita (opción cita-RPC de la decisión B6): UPDATE evento_cita_servicio → 'completada' al cerrar con calidad. Grooming verificado imperativamente (S40) y contra pg_get_functiondef (S41); paseo aplicado, test imperativo pendiente en S41. D-268 queda ABIERTA solo por la pata de integración Tu día/Citas (las 3 capacidades únicas de Citas.tsx) — la patología de cita colgada en_curso post-cierre está resuelta a nivel DB.

**Actualización S41 (pata operativa CERRADA):** verificado end-to-end en ambas familias — grooming por UI (smoke 2ª corrida) y paseo por test imperativo 4/4 (atención cerrada_con_calidad + cita completada, sin fuga a citas hermanas). El doble listado de Tu día no se reprodujo. D-268 queda abierta EXCLUSIVAMENTE por la integración Citas/Tu día (3 capacidades únicas de Citas.tsx) — alcance B6.

#### D-267 — Flujo médico fuera del contenedor genérico de atención (DM-S35.4)
⚪ BAJA. El contenedor genérico `/atencion/:citaId` (SB-5a) cubre grooming y familias sin Durante construido (paseo/hospedaje cuando aparezcan en S36). El flujo médico (`es_medico=true`) **no entra al contenedor**: sigue yendo directo a `/cita/:id/completar` (pantalla pre-existente, intacta). Para que "transversal a todas las citas" de DM-S35.4 sea completo, el flujo médico debería migrar al contenedor en el futuro — hoy se respeta su pantalla existente para no romper lo que funciona y para no inflar el scope de SB-5.
Disparo: cuando se rediseñe la pantalla médica (post-launch), o cuando aparezca una decisión de producto que exija unificar la puerta de entrada de todas las atenciones bajo `/atencion/:citaId`. Implica mover la captura de historia clínica al modelo "slot por familia" del contenedor.
Origen: S35-SB5a. Disparo: rediseño médico o pedido explícito de unificación.

#### D-266 — Filtro por familia en `obtener_resumen_actividad_prestador` diferido a S36
⚪ BAJA, no bloqueante. La RPC SB-2 cuenta `atendidas` sobre todas las familias (cualquier `c.estado IN ('en_curso','completada')` o evento_atencion en estado de cierre) y `cerradas_con_calidad` sobre todas las tablas tipadas que estén en `eventos_atencion` (hoy solo grooming). Mientras solo grooming tenga capa de evento-de-atención, la métrica `tasa_cierre` saldrá baja porque el numerador refleja solo grooming mientras el denominador cuenta todas las familias. **No es bug**: es el estado honesto del modelo de calidad hoy, antes de S36.
La pantalla "Tu semana/mes" (SB-4) muestra la tasa como dato de apoyo sin disclaimer en la UI — decisión consciente del founder. Cuando S36 sume tablas tipadas (paseo, hospedaje, etc.) al andamiaje universal (CTE `eventos_atencion` de la RPC), la tasa se va a estabilizar sin tocar la pantalla — la RPC ya tiene la zona de extensión documentada (`-- ↓↓↓ ZONA DE EXTENSIÓN S36+ ↓↓↓` en la migración SB-2).
Mejora futura opcional: agregar parámetro `p_familia text DEFAULT NULL` a la RPC para permitir filtrar por categoría de servicio (ej. ver "tasa de cierre solo de grooming"). Hoy NO es accionable porque con una sola familia el filtro no aporta nada verificable. Reabrir el debate cuando exista una segunda familia con Durante construido.
Origen: S35-SB4. Disparo: hallazgo en producción de que la tasa global confunde a los prestadores, o pedido explícito de filtrar por familia.

#### D-265 — Notificación al cliente queda client-side en las 5 RPCs de transición de cita (SB-1)
⚪ BAJA, no bloqueante. Las 5 RPCs SECURITY DEFINER creadas en SB-1 de S35 (`confirmar_cita_servicio`, `rechazar_cita_servicio`, `iniciar_atencion_cita`, `completar_cita_servicio`, `marcar_no_show_cita`) hacen SOLO el UPDATE sobre `evento_cita_servicio`. La notificación al cliente (`crearNotificacion` → tabla `notificaciones`) se queda client-side, en el wrapper TS de `src/lib/citas.ts`. La RPC retorna en su `jsonb` los campos meta (`user_id, fecha, hora, tipo_servicio, country_code, motivo`) para que el wrapper pueda armar la notificación sin un fetch adicional (Camino A, decidido por founder).
Consecuencia: si la RPC tiene éxito pero el INSERT a `notificaciones` falla (red caída, RLS, error transitorio), la cita transiciona de estado pero el cliente NO recibe la notificación. La cita queda en estado "huérfano" desde el punto de vista del cliente, hasta que el polling siguiente le actualice la lista. Hoy esto ya pasaba con el UPDATE directo + crearNotificacion separados, así que NO es regresión: es el mismo riesgo, simplemente persistido.
Disparo: si en producción aparecen casos reales de notif huérfana (ej. cliente reporta "no me llegó el aviso de confirmación pero la cita está confirmada"), unificar UPDATE + INSERT de notificación dentro de la RPC en una sola transacción. Implica internar `crearNotificacion` en SQL o convertir las 5 RPCs en orquestadoras. Decisión diferida hasta tener evidencia real del problema.
Origen: S35-SB1. Disparo: evidencia de notif huérfana en producción, o auditoría futura del flujo notificacional.

### Deudas de Sesión 36 (2 Jun 2026)

#### D-269 — Precio en el flujo de cita ✅ SALDADA en S36-SB3
🟠 ALTA → ✅ SALDADA. Regla de modelo (founder, S36): el precio NO vive en el flujo de la cita. Vive en configuración de servicios (del prestador, fuera de scope), pago del cliente (app), y motor financiero/liquidaciones. El `precio_final` del cierre de grooming era un vestigio.
Resolución (S36-SB3): eliminado el input de precio de `CierreGrooming` (rama terminada) y el display de `VistaCerradaConCalidad`. Los wrappers dejan de mandar `p_precio_final`; las RPCs `cerrar_grooming_con_pendiente`/`cerrar_grooming_con_calidad` conservan el parámetro con DEFAULT NULL (inerte, COALESCE preserva, sin cacería cross-repo). Catálogo de servicios (`Servicios.tsx`) y estadía (`ModalCrearEstadia.tsx`) NO tocados (configuración de servicio, válida). Detectada en el E2E del camino pendiente→calidad.
Origen: S36. Saldada: S36-SB3.

#### D-270 — Garantizar la foto/captura obligatoria al terminar la atención (BIFURCADA por familia)
- **Grooming: ✅ SALDADA en S37 (DM-S37.1).** `terminar_atencion_grooming` exige `foto_entregar` (rebota `falta_foto_entregar` con ERRCODE 22023); el front integra la captura al gesto de Terminar (AccionFoto parametrizado por `tipo`, modal liviano que reusa el componente con `tipo='foto_entregar'`, precheck con `obtenerLogAcciones` + manejo del rebote como defensa contra carrera).
- **Paseo (paseo-3): sin cambios** — la garantía NO es por bloqueo; comentario por perro como única condición dura; visibilidad gobierna el resto (D-271). Se implementa con la construcción de paseo.

**Contexto original (S36):** una atención puede terminar sin la nota/foto que el cierre con calidad exige; como nota/foto solo se capturan en el Durante y no hay subsanación posible, queda como pendiente definitiva. Problema de incentivo: si "sin captura no se paga" (DM-S34.2) y la captura no se tomó en el momento, el prestador tiene incentivo a falsificar (foto de cualquier animal) para cobrar — contaminando el bio-expediente. Preferible atención vacía y honesta que con evidencia falsa. Resolución (S37, DM-S37.1): la foto de entrega es la única captura que se vuelve imposible-honesta post-terminada (el animal se fue); bloquear al terminar elimina de raíz el cierre incompleto y la "puerta sin salida". Origen: S36. Grooming saldado: S37-SB1b.

#### D-271 — Motor de visibilidad/ranking de prestadores por calidad
🟢 MEDIA, transversal, hogar en app cliente (no portal-prestadores). La calidad de servicio (especialmente en familias como paseo, donde el cierre no se bloquea) se gobierna por incentivo de visibilidad: el prestador que captura bien (fotos, novedades, ruta GPS completa) aparece priorizado cuando un pet parent busca; el que reiteradamente no captura, pierde señal, o acumula incidencias reportadas, pierde visibilidad. El consumo (ranking, ordenamiento de búsqueda) vive en la app cliente. **Portal-prestadores es PRODUCTOR de señales:** el diseño del flujo de atención debe registrar de forma consultable las señales que el motor consumirá (foto subida sí/no, ruta GPS enviada sí/no + motivo de fallo, novedades registradas, completitud de cierre). No afecta el alcance de portal-prestadores hoy salvo el requisito de emitir esas señales registradas.
Disparo: cuando se construya la búsqueda/listado de prestadores en la app cliente. Origen: S36, diseño de paseo.

#### D-272 — Catálogo de categorías/familias de servicio inexistente + unificación de catálogos de incidencias
⚪ BAJA. `tipos_servicio.categoria` (text, sin FK) y la nueva `evento_atencion.familia` (text + CHECK, S36) representan la misma taxonomía de familias de servicio (grooming/paseo/hospedaje/veterinario/…) sin catálogo común. Coherente con T-S27.1 (no duplicar `categoria`). Riesgo: drift si se agregan familias en un lado y no en el otro (los CHECK/validaciones se mantienen a mano). Mejora futura: crear `cat_categorias_servicio` y apuntar ambas columnas. Verificado en S36 (queries 13-14): no existe catálogo de familias de servicio; `categoria` es text libre sin FK.
**Actualización S38 (SB7-fix2):** D-272 absorbe también la unificación de los catálogos de incidencias por familia. Hoy: `cat_incidencias_grooming` y `cat_incidencias_paseo` con FKs separadas; `agregar_incidencia_atencion` v2 valida el código contra el catálogo activo según la familia del `evento_atencion`. El patrón "una tabla `cat_incidencias` unificada con columna `familia`" se evalúa cuando haya 3ª familia con catálogo propio — la duplicación con 2 catálogos no justifica refactor todavía.
Disparo: 3ª familia con catálogo de incidencias — momento natural para crear `cat_incidencias` unificada y/o `cat_categorias_servicio`. Hoy no accionable con 2 familias. Origen: S36.

#### D-273 — Fan-out en métrica `atendidas` cuando una cita tenga N atenciones → VERIFICADA en S38, LATENTE
🟡 ALTA → 🟢 LATENTE. **Decisión founder (S37):** la métrica `atendidas` cuenta por PERRO (atención = unidad atómica). **Verificación S38 (DM-S38.1):** paseo NO crea N atenciones por cita — cada perro tiene SU cita (relevado contra `evento_cita_servicio.mascota_id` singular). El smoke E2E con 4 perros midió "4 de 4 atendidas, 100%" sin fan-out: ya cuenta por la unidad correcta. El fix de COUNT DISTINCT que asumíamos pendiente NO es necesario para paseo: el modelo de cita-por-perro ya garantiza 1 atención por cita.
**Disparo nuevo:** la primera familia que cree N atenciones por cita-ruta (candidata: guardería B2, donde una "cita" podría ser una estadía multi-perro). Hasta entonces, latente. Origen: S36-SB-D.3. Decisión: S37. Verificada en limpio: S38.

#### D-274 — RPCs de resumen leen transversales por `grooming_id`, no por `evento_atencion_id` ✅ SALDADA en S37-SB1
⚪ → ✅. Tablas, RPCs de escritura (4 transversales: agregar_nota_atencion / agregar_incidencia_atencion / pausar_atencion / reanudar_atencion), helper de validación (`_atencion_operable` reemplaza al viejo `_grooming_atencion_operable`), resumen de cierre (`obtener_resumen_cierre_grooming` lee las 3 transversales por `evento_atencion_id`) y log de acciones del front (`obtenerLogAcciones` filtra notas/incidencias por `evento_atencion_id`; archivos siguen por `grooming_id`, D-275) operan por la capa transversal. `grooming_id` quedó nullable como columna legacy (no se escribe). Oficio puro (servicios/zonas/archivos/pelaje) sigue por `grooming_id` a propósito (frontera DM-S36.2, no era parte de esta deuda).
Origen: S36-SB-E. Saldada: S37-SB1 (migración `2026-06-03-S37-SB1-transversales-genericas.sql`).

#### D-275 — Sistema único de archivos (convergencia a `evento_archivo_adjunto`)
⚪ BAJA, dos partes.
**Parte A (grooming):** `evento_grooming_archivos` debe migrar a `evento_archivo_adjunto` (cuelga del hito vía `evento_padre_id`, D13.4). Hoy queda como tabla de oficio. Implica reapuntar los guards de calidad del cierre (`foto_recibir`/`foto_entregar`) y resolver dónde vive el eje temporal del momento de captura, que `categoria` por sí sola no expresa. **Actualización S38:** la convergencia tiene una gemela operativa pendiente — `AccionFotoAtencion` (paseo, usa `registrar_archivo_atencion` genérico contra el bucket `cita-archivos`) coexiste con `AccionFoto` (grooming, usa `registrar_archivo_grooming` específico contra `grooming-archivos`). Cuando A se ejecute, `AccionFoto` se elimina y todas las familias usan `AccionFotoAtencion`. El comentario de cabecera del componente nuevo deja explícito el criterio de disparo.
**Parte B (principio de diseño):** toda familia nueva que necesite capturas (paseo en adelante) usa `evento_archivo_adjunto` directamente — NO crea su propia `evento_<familia>_archivos`. Evita reintroducir el drift que la Parte A va a corregir.
Decisión founder S36: sistema único como destino, grooming migra después, familias nuevas nacen convergidas.
Disparo: rediseño del modelo de evidencia, o paseo necesita capturas. Origen: S36.

### Deudas de Sesión 37 (3 Jun 2026)

#### D-276 — Índices `idx_grooming_*_groomingid` sobre columna legacy
⚪ BAJA. Las 3 transversales (`evento_grooming_pausas/notas/incidencias`) conservan índice sobre `grooming_id`, que tras S37-SB1 ya no se escribe (mayormente NULL en filas nuevas — las RPCs transversales escriben solo `evento_atencion_id`). Limpieza menor: `DROP INDEX` cuando se confirme que ningún reader histórico los necesita. Sin urgencia: el índice sobre columna NULL no daña la performance de escritura. Disparo: housekeeping de schema o auditoría de índices. Origen: S37-SB1.

#### D-277 — Mover AccionNota/AccionIncidencia a `components/Atencion/` + parametrizar catálogo de incidencias por familia ✅ SALDADA en S38
🟡 ALTA → ✅ SALDADA. Los 3 componentes (`AccionNota.tsx`, `AccionIncidencia.tsx`, `BotonAccionGrande.tsx`) se movieron de `src/components/CitaGroomingDurante/` a `src/components/Atencion/` vía `git mv` (S38-SB6c, commit `14b60d7`). `AccionIncidencia` recibe ahora una prop obligatoria `cargarCatalogo: () => Promise<ResultadoWrapper<ItemCatalogoIncidencia[]>>` y NO importa nada de `lib/grooming`; el caller de grooming pasa un adapter sobre `obtenerIncidenciasGrooming`, paseo pasa `obtenerIncidenciasPaseo`. **Decisión de producto cerrada (paseo-5, founder):** la "novedad de paseo" es observación neutral del oficio (catálogo `cat_novedades_paseo` con `grupo`, sin severidad) — componente NUEVO `AccionNovedad` en `components/AtencionPaseo/`, NO comparte con `AccionIncidencia`; las incidencias transversales (catálogo `cat_incidencias_paseo`) sí reusan el componente compartido.
Origen: S37-SB1. Saldada: S38-SB6c.

#### D-278 — Realtime caído (log en vivo sin push)
🟡 MEDIA. WebSocket a `realtime/v1` falla en el entorno del founder (confirmado en runtime de S37); el log del Durante no recibe updates push. Hoy funciona porque `LogAcciones` refresca por `refreshKey` que el padre incrementa tras cada captura — pero sin tiempo real. Investigar: config de realtime de las tablas transversales (`evento_grooming_notas`/`_incidencias`/`_archivos`), o problema de entorno local. No bloquea operación. Origen: S37.

#### D-279 — Navegaciones al Durante sin nav state (preexistente S35, destapada en S37)
🟡 ALTA. **Patrón demostrado en S38 para paseo:** el `SlotFamiliaPaseo` entero es URL-reconstruible — el slot lee `obtener_paseo_por_cita(citaId)` al montar y deriva su sub-estado (sin_iniciar / en_curso / cerrable / lectura) sin depender de nav state. El smoke E2E de S38 ejercitó refresh F5 a mitad de paseo (perro Bruno) y la pantalla se reconstruyó correctamente. Patrón validado y reutilizable para B2+.
**Retrofit grooming pendiente:** el Durante de grooming (`CitaGroomingDurante.tsx`) sigue exigiendo 5 campos de nav state. Las 2 rutas que rompen al navegar siguen rotas:
- Tu día zona "En curso" → `rutaParaCita(..., 'continuar')` devuelve `{ path: '/cita/.../grooming/durante' }` **sin state**.
- Atencion.tsx (slot grooming, sub-estado `en_curso`) → botón "Volver al Durante" navega al Durante **sin state**.
Disparo: aplicar el patrón del `SlotFamiliaPaseo` al Durante de grooming (leer `obtener_grooming_por_cita` y reconstruir nav state, o convertir el Durante de grooming en slot del contenedor `/atencion/:citaId` siguiendo el modelo de paseo). Origen: S35-SB5a, destapada y registrada en S37. Patrón demostrado: S38.

### Deudas de Sesión 39 (10 Jun 2026)

#### D-280 — Subsistema comercial estadias/suscripciones_servicio/bonos pre-patrón
Tres tablas creadas pre-S26 sin DDL versionado en este repo; escritura por INSERT directo desde TS (sin RPC SECURITY DEFINER, anti-patrón canónico); CHECKs de tipo_servicio hardcodeados y desalineados del catálogo (estadias solo 'hotel'; bonos solo 'paseo'; suscripciones solo 'guarderia_mensual'|'paseo_mensual'); estadias sin conexión a evento_cita_servicio ni a la capa de atención. 0 filas en las tres; consumo front read-only (Dashboard/Agenda/Citas/Contratos) + 2 modales de creación. Patrón vivo: bonos y suscripciones amparan citas vía evento_cita_servicio.bono_id / suscripcion_servicio_id (FK SET NULL) — la cita sigue siendo la unidad operativa. Hipótesis de destino (S39): estadía como contenedor comercial de N citas-día (calco del patrón suscripción→cita), 1 atención por día sobre la capa. Prioridad: 🟡 ALTA. Disparo: B3 hotel (estadias) / integración Kushki (suscripciones, bonos). B2/guardería ya NO está en MVP. Origen: S39.

#### D-281 — Camino a activar los 3 servicios MVP desde la app mobile (4 capas)
Paseo, grooming y veterinario deben quedar 100% activables end-to-end. Capas en orden de desarrollo: (1) operación/atención del prestador — paseo+grooming hechos, falta endurecer D-268/D-279 y construir veterinario; (2) integridad operativa — D-278, D-275 A; (3) configuración del servicio desde vista prestador (horarios, condiciones, precios, disponibilidad, capacidad) — arrastra D-200 y D-210; (4) cliente/app mobile (OTRO repo) — descubrimiento, agendamiento, cobro Kushki, devolución de evidencia; relevamiento del repo app-cliente pendiente. Metodología: simulación por DB con tests imperativos por bloque hasta el final de capa 4, donde recién corre el E2E 100% por UI. Veterinario arrastra además el refactor RLS Bio-Expediente (D-107/108/109/110/154). Prioridad: 🔴 BLOQUEANTE soft launch. Origen: S39.

### Deudas de Sesión 41 (3-4 Jul 2026)

#### D-282 — Lecturas remanentes de transversales por grooming_id legacy en RPCs de cierre
⚪ BAJA. cerrar_grooming_con_calidad lee evento_grooming_notas por grooming_id (columna legacy, NULL desde S37-SB1) en su guard de nota-o-foto. Hoy inofensivo: el OR con archivos siempre satisface (foto_entregar obligatoria, DM-S37.1). Las lecturas análogas en las 5 RPCs de lectura se corrigieron en S41-SB2. Disparo: próxima migración que toque las RPCs de cierre (SB-3b es candidata natural). Origen: S41.

### Deudas de Sesión 42 (5 Jul 2026)

#### D-283 — Reconciliación del modelo v2 en la DB principal
🟠 ALTA. e-petplace-v2 apunta al mismo proyecto Supabase y dejó tablas de un modelo paralelo (pedidos, productos, mascotas_adopcion, solicitudes_adopcion, consentimientos, profiles); sus queries fallan en runtime post-refactor (mascotas cambió de shape; vacunas y citas no existen), y la Edge Function extract-vacuna escribe contra tabla inexistente (su herencia requiere reescritura de destino hacia eventos_mascota). Disparo: ANTES de construir el alta de mascota en apps/cliente — relevamiento FK completo (regla 41) y decisión archivar/migrar/eliminar por tabla. Origen: S42 Tarea 4.
**Enmienda S46 — pata extract-vacuna RESUELTA:** la function fue re-targeteada al modelo real y vive en el monorepo (v16 desplegada; destino `eventos_mascota` vía tabla tipada `evento_vacuna_aplicada` + trigger `_trg_vacuna_crear_evento` — S46-B1.1). Su disparo original ("antes del alta de mascota") venció en S45 sin morder. El resto de la deuda (reconciliación de las tablas muertas de v2) queda con disparo nuevo: primera sesión de limpieza de DB o antes del soft launch, lo que llegue primero.

### Deudas de Sesión 43 (monorepo e-petplace)

#### D-284 — Verificación nativa de packages/ui pendiente
✅ RESUELTA-CONVERTIDA (S43-B5). La verificación nativa dejó de ser deuda y es PRÁCTICA: Ley 9 de la skill `epetplace-design-system` ("la web no cierra gates de componentes") + sección "Gate en dispositivo" del CLAUDE.md raíz. Los 10 componentes de B3 cerraron con gate en el teléfono del founder (Expo Go 57 por túnel). Origen: S43-B2.

#### D-285 — Gates de S43 solo en Android — iOS sin verificar
🟡 ALTA. Todos los gates en dispositivo de S43 corrieron en Android (teléfono del founder); iOS jamás se probó (safe areas, KeyboardAvoidingView behavior=padding, gestos de la Hoja, fuentes). Disparo: ANTES del primer TestFlight, pasada completa de la galería en iPhone (Expo Go iOS o dev build). Origen: S43-B5.

### Deudas de Sesión 44 (6 Jul 2026)

#### D-286 — TalkBack sobre EsqueletoGrupo sin verificar en dispositivo
🟢 MEDIA. El gate visual de Esqueleto (S44-B2.2) cerró en Android, pero la pasada de TalkBack (anunciar "Cargando, barra de progreso" una vez y no leer formas vacías) no se corrió en el teléfono — solo se verificó el DOM en RN-web (`[role=progressbar][aria-busy=true]`). Disparo: B4, primera pantalla real con Esqueleto. Origen: S44-B2.2.

#### D-287 — Activar en cat_especies las familias F1 faltantes ✅
✅ CERRADA (S45, migración `20260707120000_d287_especies_f1` con gate founder). Ampliada por decisión founder S45: el registro sale con EXACTAMENTE 6 familias (perro, gato, conejo, ave, pez, roedor); **hurón y cobaya quedaron desactivados** (`activo=false`, `acepta_nuevos_registros=false`, motivo por especie — cobaya se subsume en roedor para nuevos registros, P4 protege a las existentes: había 0). Perfiles de `cat_especies_perfil` creados para roedor y pez. Verificación imperativa: trigger de visibilidad con perfil nuevo ✓, alta asistida rechaza hurón ✓. Implicancia regla 69 anotada: el ModalAltaAsistida del repo viejo (D-215) ofrece cobaya/hurón que el guard ahora rechaza. Origen: S44-B2.3.

#### D-288 — Set de avatares ilustrados por especie (6 F1) — dirección de arte
🟢 MEDIA. Assets con licencia comercial verificada (LICENCIA.txt en el repo), curaduría founder/Ana María, estilo único, SVG fondo transparente, legibles a 40px. Integración: solo assets + mapeo, la API de AvatarMascota ya recibe `especie` (códigos reales de cat_especies). Evolución posterior: por raza (perro/gato) — requiere dato raza confiable + set ampliado. Disparo: founder entrega la carpeta, o a más tardar onboarding de mascotas de la app dueño. Origen: S44-B2.3 (enmienda final — las siluetas outline propias se descartaron; queda huella genérica).

#### D-289 — API key de Google Maps + dev build Android ✅
✅ CERRADA (S46): la key S44 expuesta fue borrada de Google Cloud por el founder; la key de Maps vigente quedó re-creada y verificada VIVA (tiles funcionando en la dev build de cliente). **Remanente menor anotado (no reabre la deuda):** confirmar que la key vigente tenga entries de restricción package name + SHA-1 de AMBAS apps (prestador y cliente — L-130 enmendada: en keys de cliente Android la protección real son las restricciones) — disparo: próxima visita del founder a Google Cloud. Historial: hallazgo S44 — Google Maps REMOVIDO de Expo Go Android en SDK 53 → dev build por EAS con key por env secret, jamás en el repo; key expuesta en S44, ROTADA en S45-B0 (la vieja quedó sin borrar hasta S46); gate de tiles de MapaRecorrido cerrado en S45-B5.4. Origen: S44-B2.6.

#### D-290 — Auth del prestador en apps/prestador ✅
~~🟡 ALTA. El bootstrap dev-only de sesión (signInWithPassword con credenciales demo en `.env.local`, dev only, no commiteado) es atajo asumido de B4 — no hay pantalla de login ni flujo de sesión real en el app. Disparo: antes de cualquier usuario real / soft launch.~~
CERRADA en S54-B (11 Jul 2026): login real por los wrappers de auth S45, routing por estado real (sin sesión → invitación · sin negocio → honesto con salida · con negocio → HOY), sesión persistida en nativo, MUERTE del bootstrap dev. Verificación runtime bajo auth real: 10 checks (persistencia y logout). Origen: S44-B4.0.

#### D-291 — Detalle del paseo sin notas de familia ni raza/edad
🟢 MEDIA. Fuentes identificadas (`evento_cita_servicio.notas`/`metadata`, `mascotas.raza`/`fecha_nacimiento`); ampliar el contrato de lectura cuando el Detalle lo pida en serio. Incluye la limitación del deep-link a citas de otro día (la cita se resuelve contra la lista de HOY — mismo contrato, se resuelven juntas) y los THUMBNAILS de fotos en Durante/Cierre (no hay contrato de lectura de evento_archivo_adjunto — hoy solo conteo del resumen; ampliado en S44-B4.4). Disparo: feedback de prestador real o diseño del Detalle v2. Origen: S44-B4.2.

#### D-292 — B5: GPS background del Durante
🟡 ALTA. GPS background (la dev build ya existe; expo-location + TaskManager) — el Durante real con pantalla apagada. Hoy el track es FOREGROUND (documentado en use-track-gps.ts): con el teléfono en el bolsillo la captura se corta. Único bloque de S44 no ejecutado; el defer registrado que el arranque previó. Disparo: antes de un paseador real en producción; requiere permiso "always" + servicio + textos de permiso nuevos + rebuild (L-134). Origen: S44 cierre.

### Deudas de Sesión 45 (7 Jul 2026)

#### D-293 — Key de Places v2: verificar uso real y borrar ✅
✅ CERRADA (S46): key de Places de v2 borrada de Google Cloud por el founder — estaba atada solo a apps viejas archivadas, nada vivo la consumía. Verificación empírica post-borrado: mapas de las apps vivas funcionando. Origen: S45-B0.

#### D-294 — Rama co-dueño en `user_tiene_acceso_a_mascota`
🟡 ALTA. La función que gobierna TODO el timeline (las 4 tablas + la policy de storage S45-B5.1 la heredan) NO tiene rama `mascota_codueño`/`familia_miembro`: un co-dueño puro puede ver, editar y hasta BORRAR la mascota (policies de `mascotas` sí tienen rama codueño) pero no puede leer un solo evento de su historia. Hoy no muerde porque el flujo de alta hace al que reclama también `mascotas.user_id` — muerde con el SEGUNDO co-dueño. Al cerrar esta brecha, storage y las 4 tablas la heredan gratis (misma puerta). Disparo: antes de habilitar co-dueños reales (bloquea D-295). Origen: S45 relevamiento dueño.

#### D-295 — Flujo de invitación de co-dueños
🟡 ALTA. No existe RPC ni flujo: el titular puede INSERT directo en `mascota_codueño` por RLS solo si el otro user YA existe; no hay invitación para no-registrados (el único análogo, `cliente_pendiente_registro`, es prestador-céntrico). Necesita: invitación + aceptación + D-294 resuelta. Disparo: F1 post-onboarding, cuando la familia deje de ser unipersonal. Origen: S45 relevamiento dueño.

#### D-296 — El dueño no puede leer su propia `mascota_visibilidad_config`
🟢 MEDIA. Verificado en S45-B4: el trigger crea la config al nacer la mascota, pero el dueño no la VE por RLS (`cfg_como_postgres=1 | cfg_como_authenticated_rls=0`, literal). Hoy no muerde (ninguna pantalla la lee); muerde cuando el dueño gestione visibilidad. Disparo: pantalla de visibilidad/privacidad del dueño. Origen: S45-B4 verificación imperativa.

#### D-297 — `gen:types` del package api llama `supabase` pelado
⚪ BAJA. `packages/api/package.json` → `gen:types` invoca `supabase` sin npx y falla con ENOENT (el CLI no está en PATH del script); en S45 se corrió a mano con `npx supabase gen types…`. Fix trivial: `npx supabase …` en el script. Disparo: próxima regeneración de tipos. Origen: S45-B4.

#### D-298 — Endurecer persistencia de sesión (LargeSecureStore)
🟡 ALTA. La sesión del dueño persiste en AsyncStorage (patrón oficial supabase RN — la skill de stack pide SecureStore, pero su límite de 2048 bytes no banca el JSON de sesión). El endurecimiento canónico es LargeSecureStore (AES por streaming: key en SecureStore, blob cifrado en AsyncStorage — exige lib de AES, decisión founder por "cero librerías nuevas"). Disparo: pre-soft-launch. Origen: S45-B4.

#### D-299 — Confirmación de email desactivada en el proyecto Supabase
🟡 ALTA. Verificado en S45-B4 (literal: `sesion_activa tras signUp = true`): cualquier email inventado crea cuenta con sesión inmediata. Comodísimo para los gates de hoy, inaceptable con usuarios reales (spam, cuentas basura, emails ajenos). El wrapper ya contempla el flujo con confirmación (`email_no_confirmado`, aviso "Te mandamos un correo…"). Disparo: pre-soft-launch (activar en el dashboard + gate E2E del flujo confirmación). Origen: S45-B4 asserts de auth.

#### D-300 — Voz del dueño en `cat_novedades_paseo` ✅
✅ CERRADA (S46, migración `20260708120000_d300_voz_familia_novedades` con gate founder): columna `nombre_familia` NOT NULL con los 13 textos aprobados por founder+arquitecto — la voz de picker del prestador queda INTACTA en `nombre`. **AMPLIADA en sesión:** `reactivo_otros_perros` contenía DOS comportamientos distintos — se separó con fila nueva `nervioso_otros_perros` (miedo/evitación, orden 35) vs reactiva (tensión/lanzarse); decisión founder: es info conductual para futuros adiestradores, no se aplasta ni suaviza. Wrapper del dueño (`catalogos.ts`) lee `nombre_familia` con fallback a `nombre`; el parche local S45-B5.3 se eliminó (regla 37, código muerto); los pickers del prestador conservan la voz de oficio (`paseo.ts`, catálogo por `activo=true` — la fila nueva apareció sola). Verificación: 13 filas literales, 0 NULLs, asserts como authenticated. Origen: S45-B5.3.

#### D-301 — Huérfanos en bucket `mascotas` + falta vía DELETE gateada ✅
✅ CERRADA (S47-B0.1/B0.2). **Barrido COMPLETO**: cruce DB literal de los 23 objetos (una sola columna referencia el bucket: `mascotas.foto_url`; 1 solo objeto referenciado — la foto real de Zeus) → 22 huérfanos confirmados (17 de la era v2 sin fila que los apunte + 5 sintéticos del diagnóstico S45, incluido el `avatar-diag-` que sobrevivió al barrido manual S46 y el 12-bytes sin sello que lo explicó) borrados vía Storage API con service role (`supabase/dev/cleanup_bucket_mascotas_s47.mjs`: dry-run con gate founder → `--ejecutar` → re-inventario = 1 objeto ✓; el path de Zeus protegido por assert del propio script). **La vía DELETE gateada EXISTE**: policy `mascotas_delete_carpeta_propia` (migración `20260708220000`) — "reemplazar = subir + borrar" habilitado, y el flujo carnet ya la usa para limpiar extracciones fallidas. Historial: 6 huérfanos detectados en S45-bugs; barrido parcial a mano en S46. Origen: S45-bugs.

#### D-302 — Salida "Lo hago después" del onboarding dueño
⚪ BAJA (decisión founder S45: prioridad baja, no se construyó). El flujo de onboarding no tiene salida lateral: quien no quiere terminar de registrar a su mascota no tiene camino digno al Home "vacío". Disparo: pre-ensayo S2a. Origen: S45-B4 espec.

#### D-303 — Foto huérfana si la RPC falla post-upload
🟢 MEDIA. El cierre del onboarding sube la foto ANTES de `crear_familia_con_primera_mascota`; si la RPC falla y el user abandona (o sigue "sin foto"), el objeto queda huérfano en el bucket sin fila que lo vincule. Mismo problema de fondo que D-301 (estrategia de limpieza del bucket); mitigable invirtiendo el orden (RPC primero, foto después) cuando exista UPDATE de foto para el dueño. Disparo: junto a D-301. Origen: S45-B4.1.
**Enmienda S47-B1.2 — segundo caso, mismo patrón:** el flujo carnet (B3) sube la foto al bucket ANTES de `registrar_vacunas_de_carnet`. Los fallos de extracción se limpian solos (la pantalla borra el objeto con la DELETE por carpeta, S47-B0.2), pero **"carnet subido + abandono en la revisión sin guardar"** (back, cierre del app) deja el objeto huérfano sin fila que lo vincule. Mismo disparo que ya tiene la deuda; nada se construye hoy. **Primer ejemplar real (gate parcial S47):** `889a72c5-…/carnet-1783564367515.jpg` (109.761 bytes, 9 Jul 02:32 UTC — el founder abandonó la revisión durante el diagnóstico de las 8 dudosas). Se conserva a propósito como imagen de referencia del re-gate; entra al barrido cuando D-301/D-303 se ejecuten.

#### D-304 — Concurrencia del guard `familia_ya_existe`
🟢 MEDIA. El guard de `crear_familia_con_primera_mascota` es check-then-insert sin lock: dos requests simultáneos del mismo user (doble tap + red lenta) pueden crear dos familias estandar. Hoy mitigado por UX (cerrojo del cierre + redirect en `familia_ya_existe`), no por la DB. Endurecer con advisory lock por user o unique parcial (miembro vigente × familia estandar). Disparo: antes de tráfico real de registro. Origen: S45-B4.

#### D-305 — La app no sigue el tema del sistema
🟢 MEDIA. `ThemeProvider` está clavado en light default desde S43: un teléfono en dark mode ve la app en claro. Decisión de producto pendiente — voto del arquitecto: seguir el tema del SISTEMA (light/dark por `useColorScheme`), con memorial SIEMPRE encima (no es elegible, es un momento — su activación automática no cambia). Los 3 temas ya existen y gatean juntos (WCAG 139/0), es decisión + cableado, no construcción. Disparo: pre-soft-launch. Origen: S45 addendum (gate E2E founder).
**Enmienda S47 — decisión CERRADA por el founder:** la app sigue el tema del SISTEMA, con memorial SIEMPRE encima. Queda solo el cableado (`useColorScheme` + gate visual). Disparo: S48.

### Deudas de Sesión 46 (8 Jul 2026)

#### D-306 — `propaga_a_perfil=true` de vacuna_aplicada es promesa sin mecanismo NI destino
🟢 MEDIA. `cat_tipos_evento.vacuna_aplicada` declara `propaga_a_perfil=true`, pero no existe trigger `_trg_vacuna_propagar_perfil` (los 7 `_trg_*_propagar_perfil` cubren otras tipadas: alergia, condición, intervención, medicación, microchip, peso, temperamento) NI columna de vacunas en `mascota_perfil_vigente` (21 columnas relevadas, cero `%vacun%`). Hoy no muerde: nada lee vacunas del perfil vigente. Alternativa barata: flag a `false` si el modelo decide que vacunas no propaga. Disparo: cuando el perfil vigente quiera mostrar "vacunas al día". Origen: S46-B1.1 C1.
**Nota S48-A4:** la inferencia de tipo de v17 (vocabulario cerrado desde nombre comercial) habilita el backfill retroactivo de filas históricas sin tipo cuando el badge "vacunas al día" dispare: re-pasar los nombres guardados por la misma clasificación, sin re-leer carnets.

#### D-307 — Dueño sin corrección self-service de vacunas
🟡 ALTA. RLS relevada literal (S46-B1.0): `vacuna_update` es solo-prestador y `vacuna_delete_admin` solo-admin. Una vacuna mal cargada por el dueño (vía carnet o manual) no tiene camino de corrección ni borrado para él. Con extracción por IA, equivocarse es esperable; la pantalla de revisión pre-guardado mitiga, no resuelve. Disparo: antes de exponer el flujo de carnet a dueños reales. Origen: S46-B1.0/B1.1.
**Enmienda S47:** la revisión pre-guardado EXISTE (flujo carnet B1.2 — LA red está viva y ya atrapó lecturas torcidas reales tipo "Peeknrb"); la corrección/borrado POST-guardado sigue faltando y el disparo no cambia.
**Nota S48-B8.1:** el camino de borrado self-service debe recomputar `ultimo_evento_*` del perfil vigente — hallazgo: `_trg_eventos_update_ultimo` es solo-INSERT con guard `<=`; borrar el evento más reciente deja el perfil apuntando a un muerto o con fecha que bloquea toda actualización futura. El patrón del recómputo atómico ya está escrito en el bloque DO de B8.1 (log de sesión S48).

#### D-308 — Foto del carnet no se conserva (`archivo_url` fuera de v1) ✅
✅ RESUELTA (S47-B1.2, migración `20260709010000` con gate founder — decisión de producto: el carnet SE CONSERVA): la RPC acepta `p_archivo_url` (path del bucket privado, carpeta del dueño, guard tipado `archivo_invalido` — ni URL ni carpeta ajena) y el MISMO carnet respalda las N filas del lote en `evento_vacuna_aplicada.archivo_url`. El flujo lo sube en B3 (con limpieza si la extracción falla) y la Hoja de detalle del timeline lo muestra con "Ver carnet" (VisorFoto firmado; sin archivo no hay botón). Verificado con asserts con y sin archivo. Origen: S46-B1.1.

#### D-309 — `crear_cliente_walkin` desplegada sin fuente en repo ✅
✅ RESUELTA (S48-B7.4, disparo cumplido: S48 tocó Edge Functions). Fuente bajada con `supabase functions download` desde la v3 ACTIVE y versionada en `supabase/functions/crear_cliente_walkin/index.ts` (113 líneas: creación de usuario walk-in con service role — camino existe/no-existe, upsert de profile y rol `pet_parent` EC). Correspondencia verificada por procedencia + metadata: el download sale del bundle desplegado y la function quedó intacta post-download (version 3, `ezbr_sha256 ce4ffabb…` idéntico al relevado en S46, `updated_at` 2026-05-06). Cero cambios de código. Pendiente del principio: `chat-ayuda` sigue solo en v2 (repo archivado pero en disco). Origen: S46-B1.0.

#### D-310 — Bucket `mascotas` PUBLIC + 2 policies SELECT amplias ✅
✅ CERRADA (S47-B0.2, migración `20260708220000` con gate founder): **bucket PRIVADO + signed URLs**. El relevamiento probó la exposición empíricamente (HTTP 200 anónimo sin ningún header a la URL pública) y encontró PEOR que el warning: las 2 SELECT públicas eran DUPLICADAS entre sí (mismo predicado, herencia v2), la INSERT laxa dejaba letra muerta a la estricta por carpeta, y una **UPDATE laxa dejaba a cualquier authenticated PISAR fotos ajenas** (integridad, no solo privacidad — el hallazgo extra del saneo). La policy S45 de cita-archivos NO era decorativa: gatea su propio bucket, que siempre fue privado. Saneo: 4 policies eliminadas, SELECT nueva de dos patas (carpeta propia OR join inverso `foto_url` + `user_tiene_acceso_a_mascota` con índice parcial — el prestador ve el avatar en la Agenda, verificado E2E en ambos sentidos), DELETE por carpeta, límites server-side (5MB + jpeg/png/webp). `mascotas.foto_url` guarda PATH — garantizado por CHECK `mascotas_foto_url_es_path` (migración `20260708233000`, nacida del gate 1 fallido) — y la lectura firma vía `resolverUrlFoto`/`resolverUrlsFotos` (cache TTL, batch para listas). Espejo empírico del cierre: la URL pública vieja pasó de 200 anónimo a 400. Origen: S46 (captura del dashboard).

**Nota S46 (no es deuda aparte — es parte de la UI pendiente del carnet):** LineaDeVida necesita entrada de voz para `vacuna_aplicada` (hoy degrada digno a "Momento de cuidado" por eje salud) — va junto con la decisión de flujo del founder. El CORS `'*'` de extract-vacuna queda documentado en el código: restringir cuando exista dominio web del dueño.

### Deudas de Sesión 48 (9 Jul 2026)

#### D-311 — FichaVacuna en RN-web anida `<button>` en `<button>`
⚪ BAJA. El Boton "Esta no es" vive dentro de la Tarjeta interactiva (tap = onEditar): en RN-web ambos Pressables renderizan `<button>` anidados → hydration warning en consola, sin efecto visible. En nativo no existe. Fix conocido: la Tarjeta interactiva delega el rol de botón cuando contiene acciones propias. Disparo: antes de servir vistas web del cliente a usuarios reales. Origen: S47, detectada S48-A2 (verificación de galería RN-web).

#### D-312 — "Evento de fecha sola" es un concepto del modelo, hoy resuelto por tipo en la puerta única
🟢 MEDIA. `eventos_mascota.fecha_evento` es timestamptz para TODO evento; los eventos cuya fuente de verdad es un `date` sin hora (vacuna del carnet) se anclan en la medianoche UTC vía `_trg_vacuna_crear_evento` (`fecha_aplicada::timestamptz`), lo que en UTC-5 se mostraba como "un día antes · 19:00". El fix S48-B6.3 es de INTERPRETACIÓN: el wrapper de timeline marca `fecha_sola: tipo === 'vacuna_aplicada'` y LineaDeVida muestra el día en partes UTC y sin hora — el trigger no cambió (la medianoche UTC queda como ancla de orden). La derivación por tipo vive en UN solo lugar (la puerta única, regla 35-friendly), pero es conocimiento del modelo puesto en el wrapper. Disparo: cuando nazca el SEGUNDO tipo de evento fecha-sola (desparasitación histórica, peso importado, etc.) — ahí la precisión pasa a `eventos_mascota` (columna `precision` o equivalente, patrón `fecha_nacimiento_precision` de S45) con migración y contrato regla 69. Origen: S48-B6.3 (gate 4 con carnet físico real).

#### D-313 — Carnet multi-página: la UI ya lo cuenta, los duplicados siguen sin red
🟡 ALTA. El flujo carnet es una-foto-por-pasada repetible, pero tenía tres huecos: (a) la UI no contaba que un carnet de varias páginas se escanea página por página — **resuelta en S48-B7.3** (guía en el paso de captura: "¿El carnet tiene varias páginas? Escanealas de a una — cada tanda se suma a su historia."); (b) NO hay protección de duplicados: re-escanear una página ya guardada duplica vacunas en el expediente sin que la revisión ni la RPC lo detecten. Cura propuesta para (b): en la revisión, contrastar nombre+fecha contra las vacunas ya guardadas de la mascota y marcar "Esta ya está en su historia" (estado de FichaVacuna o Insignia — diseño pendiente); (c) **fuga de huérfanos al abandonar** (detectada S48-B9 con forense en B9/C4: `carnet-1783604098076.jpg` con 0 refs): la limpieza del objeto subido solo corre cuando la extracción FALLA — si el dueño abandona la pantalla de revisión sin guardar, el carnet subido queda huérfano en el bucket. Cura candidata: limpieza al desmontar sin guardado O barrido periódico de objetos sin referencia. Disparo de (b) y (c): antes de exponer el carnet a dueños reales (misma frontera que D-307). Origen: S48, pregunta founder + hallazgo B9. (Se registra acá y no como enmienda D-301 porque es conducta del FLUJO carnet, no residuo histórico del bucket — D-301 quedó cerrada con su barrido.)

### Deudas de Sesión 50 (10 Jul 2026)

#### D-314 — Cerrar el motor de puntos (seguridad del loyalty)
🔴 BLOQUEANTE (del loyalty). (1) `otorgar_puntos` es SECURITY DEFINER **sin gate de autorización, sin `SET search_path`, con EXECUTE otorgado a `anon`/`authenticated`/PUBLIC** — cualquiera con la anon key acuña puntos (el DEFINER bypasea la policy solo-admin del ledger `transacciones_puntos`). Cura: gate en el body + `SET search_path` + REVOKE a anon/PUBLIC. (2) Policy `pu_own` ALL en `puntos_usuario` deja al propio user editar sus totales. Cura: reducir a SELECT propio; escritura solo del motor. Origen: S50-B0c (relevamiento de gamificación). Criterio de disparo: la PRIMERA migración que toque loyalty (antes si la anon key queda expuesta a un cliente público). Referencia: `MODELO_LOYALTY.md` §10.

### Deudas de Sesión 51 (10 Jul 2026)

#### D-315 — Extracción de strings existentes al riel i18n
🟡 ALTA. El riel existe (S51-B1a: `packages/i18n`, namespaces por dueño, keys tipadas exigibles) pero las pantallas construidas ANTES del riel siguen con voz hardcodeada en español — varias en voseo, pre-decisión tuteo neutro. Pendiente de extraer: cliente (onboarding ×6, login/registro, home parcial — solo la Hoja Ajustes migró —, carnet, paseo), prestador (agenda parcial — solo el saludo migró —, cita/*, `INSIGNIA_POR_ESTADO`, `fechaHumana` con locale fijo `es-EC`), y los strings internos restantes de `packages/ui` (solo el pie de LineaDeVida migró; quedan su DICCIONARIO de voz, FichaVacuna, CampoFecha, EvidenciaFoto, VisorFoto, EsqueletoGrupo, etc.). Reglas de la extracción: al tocarse se transpone voseo→tuteo (regla 27 ampliada S51); la voz FUNCIONAL se traduce directo; la voz EMOCIONAL (tres voces del estado, mensajes de familia, memorial, heros de marca) exige lote es/en con gate del founder (decisión 7 de S51, patrón D-300) — hasta ese gate queda hardcodeada en español (mezcla es/en visible en modo inglés: honesta y transitoria). Criterio de disparo: **antes de declarar cerrada A1**; las pantallas que S51+ toque migran AL TOCARSE. Origen: S51-B1a (decisión founder 6). **Enmienda S53 (hallazgos del founder en dispositivo):** el LOGIN sigue con strings crudos en español — "Entrar", "ver contraseña", labels del formulario y otros de esa pantalla; van en la próxima pasada que la toque.

#### D-316 — Preferencia de idioma: sincronización a DB (cola del ciclo B1)
🟢 MEDIA. Hoy la preferencia vive SOLO en dispositivo (AsyncStorage `epetplace.idioma`; default = locale del dispositivo, decisión founder S51). Falta la pata server: persistir la preferencia en el perfil del usuario, sync al iniciar sesión (consistencia multi-dispositivo) y que todo texto generado del lado server (notificaciones B4, emails) hable el idioma del usuario. Scope del ciclo B1 completo (rieles de cuenta), explícitamente FUERA de B1a. Criterio de disparo: B1 (riel de cuenta) — a más tardar antes de notificaciones server-side (B4). Origen: S51-B1a (decisión founder 5).

#### D-317 — Vista semanal de la agenda del prestador (toggle día/semana) ✅ CERRADA (S57-B, `33c4940`)
~~🟢 MEDIA~~ **CERRADA en S57-B B1**: segmento Hoy/Semana en el tab Hoy — próximos 7 días con citas FIRMES, marca de plan, chips de vacaciones, 'Libre' honesto; enmienda aditiva a obtenerCitasPaseoDelDia (fecha_hasta opcional); dos curas de paso (duración del snapshot, no del catálogo; fechaDiaSemanaHumana al riel = D-315p). El toggle chips-como-segmento migra al selector segmentado en la pasada de acabados (D-357). Letra original:
🟢 MEDIA. HOY (§13 de DISEÑO_EXPERIENCIA) pide toggle día/semana para planificar (la vista anticipada §6.4.2 del portal: primera-vez vs recurrente, lo que requiere preparación). En S51-B3.2 el HOY quedó re-jerarquizado a las 4 zonas con solo la vista día — el toggle NO se inventó (lugar hecho en el layout de Zona 2). Criterio de disparo: cuando el prestador real tenga más de un día con citas firmes (a más tardar, el portado de grooming — segunda familia viva exige planificación). Origen: S51-B3.2.

#### D-318 — Migración visual de los íconos pre-b′ al lenguaje de DIRECCION_ARTE
🟢 MEDIA. El set b′ nació en S53 (`Icono` en packages/ui: paseo, veterinaria, grooming, refugio, despensa, coach) pero los íconos anteriores siguen en el idioma viejo: campana (S46, galería), tabs del PRESTADOR (S51 — espera el gate del lote por dosis §2.7), adiestramiento de Explorar (S52), engranaje/íconos sueltos de pantallas, y el ícono de flechita/chevrons NO migra (es navegación, no concepto). Mecánica D-315: cada ícono migra AL TOCARSE su pantalla, dibujado como entrada nueva del registry de `Icono` + fila de galería + gate founder (DIRECCION_ARTE §6 — el lote 2 sale de este relevamiento). Criterio de disparo: al tocar cada pantalla; el prestador completo, tras el gate del lote 1. Origen: S53-B2a. **Enmienda S53 (relevamiento founder):** rezagados confirmados — íconos del PERFIL de mascota, los del LOGIN, el engranaje (donde sobreviva), la campana (S46) y las tabs del prestador.

> **Herramientas con disparo (S53, decisión founder):** **HyperFrames** — video de tiendas (B6) y piezas de marketing del soft launch; el `frame.md` se deriva de DIRECCION_ARTE cuando dispare. **GStack `/plan-ceo-review`** — ejercicio de estrategia PRE-soft-launch (una corrida puntual); JAMÁS integrado al flujo de sesiones.
>
> **Nota operativa S51 (L-134 aplica):** `expo-localization` es módulo nativo — las APKs preview vigentes (cliente y prestador `aa5914cd`) NO lo contienen, y con runtimeVersion por policy `appVersion` (ambas 1.0.0) un `eas update` del canal preview con el JS del riel les llegaría y las rompería ("Cannot find native module"). ANTES del próximo update de cualquiera de los dos canales: subir `version` en app.json + build preview nueva + reinstalar.

#### D-319 — Zona 2 del Hogar muestra holds ('pendiente') como próxima cita
🟡 ALTA. `hogar.ts` (proxima_cita) filtra `estado IN ('pendiente','confirmada')`: un hold vivo del propio dueño — o uno VENCIDO cuyo `estado` nadie barre (el cron solo toca `estado_reserva`) — aparece como "próxima cita" del hogar. Ajustar a firmes + hold VIGENTE propio con voz distinta ("reservando…"), o solo firmes. Disparo: antes del Gate de Oro / primer dueño real. Origen: S54-A B3.

#### D-320 — Zona horaria hardcodeada en las RPCs de agenda
🟢 MEDIA. `obtener_slots_disponibles`, `crear_bloqueo_agenda` y `obtener_paseadores_disponibles` usan `America/Guayaquil` para "el pasado" (convención del seed S44, comentada en el SQL). Derivar de `country_config` cuando el bloque multi-país abra. Disparo: apertura de Colombia. Origen: S54-A B1.

#### D-321 — Rango horario del CUÁNDO fijo en la pantalla
🟢 MEDIA. `/explorar/paseo` ofrece horas 06:00–20:00 hardcodeadas (constantes comentadas); deberían derivarse de las franjas reales de la oferta del país. Disparo: primer prestador con franjas fuera de ese rango. Origen: S54-A B3.2.

#### D-322 — Helper de cleanup dev para el árbol de citas
⚪ BAJA. El patrón L-065 (DISABLE/ENABLE de `trg_atencion_log_no_update` alrededor del borrado del hito) se ejecutó A MANO tres veces en S54 para limpiar citas de test. Extraer a script/función dev con el orden de FKs adentro. Disparo: la cuarta limpieza manual. Origen: S54-A.

#### D-323 — H1: fechaLargaHumana en el riel i18n
🟢 MEDIA. El riel solo tiene `fechaCortaMono`; las pantallas que necesitan fecha larga humana (día de la semana + fecha, voz humana por idioma) la arman artesanal (Intl inline en `/explorar/paseo`). Nace en `packages/i18n` como la corta. Disparo: la próxima pantalla que la necesite (o al tocar el CUÁNDO). Origen: S54-B (H1) + S54-A B3.2.

#### D-324 — H2: MOTIVOS_GPS catalogables
🟢 MEDIA. El vocabulario de motivos de fallo GPS del flujo de paseo es es-only y vive en código; catalogarlo (cat_* o riel) para i18n y consistencia. **Decisión de producto pendiente asociada (registrada, no resuelta).** Disparo: primer paseador operando en inglés. Origen: S54-B (H2).

#### D-325 — H3: `t` imperativa (no-React) para libs
🟢 MEDIA. El riel expone `useTraduccion` (hook): el código fuera de componentes (packages, wrappers, helpers) no puede traducir. Exponer una `t` imperativa del mismo diccionario tipado. Disparo: primer string traducible en una lib. Origen: S54-B (H3).

#### D-326 — Divergencia user_roles ↔ prestadores
🟡 ALTA. Hay DOS fuentes de "es prestador": `user_roles.role='prestador'` (acceso a portales) y `prestadores.user_id` (operativa) — pueden divergir (S54 relevó users con rol sin fila y viceversa). Definir la fuente de verdad y reconciliar. Disparo: al tocar el modelo de roles o el portal admin. Origen: S54-B.

#### D-327 — Voz financiera del server es-only
🟢 MEDIA. Las RPCs §6.5 de cuenta comercial devuelven `mensaje` humano SOLO en español (contrato TABLE(success, mensaje)); con el idioma en vivo, un user en inglés recibe rechazos en español. Pariente de D-315 (la voz del server también es voz del producto). Disparo: Gate de Oro en inglés / primer actor operando en en. Origen: S54-B.

#### D-328 — Wizard multi-actor §6.5 (segundo rol sobre cuenta existente)
🟢 MEDIA. El wizard S54-B cubre el ALTA del prestador; falta el camino §6.5/§8.14 completo: detectar cuenta comercial existente por (identificación fiscal, país) y agregar un SEGUNDO rol (seller/refugio/criadero) sin re-pedir fiscales ni bancarios. Disparo: primer actor no-prestador (refugio piloto o seller). Origen: S54-B.

### Deudas de Sesión 55 (11 Jul 2026)

> **Estado S55-A de deudas previas:** D-319 CURADA en código (commit `b1b4c29`: el wrapper del Hogar filtra a firmes + hold VIGENTE con voz propia; el hold vencido —cuyo `estado` nadie barre— ya no tapa a la pagada) — cierra con el gate founder en dispositivo. **D-322 ✅ CERRADA** (disparo cumplido: 4ª/5ª limpieza manual en S55 → helper `supabase/dev/cleanup_citas_test.sql` con FKs, triggers append-only y recómputo de `ultimo_evento_*` adentro). **D-323 ✅ CERRADA** (`fechaLargaHumana` nació en `packages/i18n` al tocarse el detalle del paseo; día local para timestamps, partes literales para fecha-sola — D-312 respetada). **D-315 enmendada:** la pata CLIENTE + packages/ui se ejecutó en S55-A A3 (raíz, auth, onboarding, carnet, paseo + voz interna de ui con Espejo es↔en); quedan la voz del server (D-327) y el lote emocional EN en gate founder.

#### D-329 — ✅ CERRADA (S55-B2). El CTA "Ir al Hogar" del checkout no navegaba
Origen: gate founder S55. Causa: `router.dismissTo('/hogar')` solo busca en el stack ACTUAL (Explorar) y `/hogar` vive en otro tab → no-op silencioso. Cura (commit `7c7e438`): vaciar el stack (`canDismiss` + `dismissAll`) y cambiar de tab con `navigate`. Verificado E2E con hold real + pago simulado + aterrizaje en `/hogar` (script `verify-d329-checkout-cta.mjs`).

#### D-330 — Guard de paseo grupal sobre `nervioso_otros_perros` ✅ CERRADA (S59 — P19 firmada)
~~🟡 ALTA~~ **CERRADA en S59** con la firma de **P19** (`POLITICAS_EPETPLACE.md` v1.7): el paseo es GRUPAL POR NORMA — declarado en condiciones y en el flujo de reserva; consentimiento = pregunta única en la primera reserva por mascota ("¿{nombre} se lleva bien paseando con otros perros?"); SÍ agenda sin re-preguntar, NO bloquea con voz honesta con camino Y SE REGISTRA (mascota, familia, fecha — insumo de paseo personalizado vs derivación a entrenador); respuesta EDITABLE en el perfil. La resolución fue por NORMA de producto, no por guard sobre la señal conductual: `nervioso_otros_perros` sigue como señal rica del expediente, sin participar de la reserva. Estructura DB = migración S59-A2. Letra original:
🟡 ALTA. El motor de ocupación permite cupo >1 (capacidad simultánea) sin mirar la señal conductual `nervioso_otros_perros` (D-300): una mascota que evita a otros perros podría caer en un paseo grupal sin decisión de su familia. El diseño del guard (bloquear / avisar / consentimiento) es decisión de producto pendiente. **Disparo: el primer prestador que oferte cupo >1** — antes de publicar ese horario. Origen: S55-B2, `MODELO_PASEO.md` §4.1.

#### D-331 — Cobertura por zonas del paseador
🟢 MEDIA. El paseador se oferta sin geografía: cualquier dueño del país lo ve, camine donde camine. El modelo de zonas (radio/polígono/barrios) está en relevamiento de la Sesión B (en curso); entra por enmienda a `MODELO_PASEO.md` §5. Disparo: cierre del relevamiento B o el primer paseador real con zona limitada — lo que llegue primero. Origen: S55 (founder).

#### D-332 — Excepciones de calendario del prestador
🟢 MEDIA. La agenda son franjas SEMANALES (`prestador_horarios`): no existen feriados, vacaciones ni bloqueos puntuales — un prestador de viaje sigue ofertándose. Relevamiento B en curso (junto a D-331). Disparo: primer prestador real operando (a más tardar, el primer feriado ecuatoriano con citas reales). Origen: S55, `MODELO_PASEO.md` §5.

#### D-333 — Continuidad y sustitución de paseador en paquetes
⏸ DIFERIDA (post-MVP, candado del paquete). Decisiones founder S55 registradas: el paquete aspira al MISMO paseador (continuidad como valor) y toda sustitución se COMUNICA al pet parent — jamás reemplazo silencioso. Se implementa con la capa de paquetes, que NO se vende sin `MODELO_FINANCIERO.md` v2.5 + P14 firmados (`MODELO_PASEO.md` §6). Origen: S55 (founder).

> **Estado S55-B4:** **D-321 ✅ CERRADA** (commit `4b1f4e2`): el rango horario del CUÁNDO dejó de estar hardcodeado — la grilla de inicios sale de las franjas reales vía `obtener_inicios_paseo_disponibles` (server-side, 7.13, motor por ventana S55-B2).
>
> **Estado S55-B3 de deudas previas:** **D-316 ✅ CERRADA** (commits `ac52aa5`/`2dc558b`): la preferencia de idioma persiste en `user_preferencias` (DB = verdad multi-dispositivo, AsyncStorage = cache local) y se sincroniza al abrir la app; la voz server-side de B4 ya tiene dónde leer el idioma del user.

#### D-334 — Catálogo de tipos de notificación
🟢 MEDIA. `notificaciones.tipo` es text libre (8 tipos vivos relevados: cita_recordatorio, cita_confirmada, cita_completada, vacuna_vencida, promocion, pedido_estado, documento_aprobado, prestador_aprobado) y `user_notificacion_prefs.tipo` lo referencia sin FK. Catalogar (cat_* con canal/es-en/rol) cuando B4 construya el envío — el contrato "fila ausente = habilitada" no cambia. Disparo: B4 (motor de notificaciones al teléfono). Origen: S55-B3.

#### D-335 — Invitar co-dueño a la familia (material P1)
🟡 ALTA. "Tu familia" muestra miembros en LECTURA y el hueco "Invitar" con Pronto; no existe el canal de invitación (email/link, aceptación, rol elegido) ni la visibilidad de nombres entre miembros (profiles es solo-propio — un co-dueño real se listaría sin nombre). El diseño toca P1 (co-titularidad). Disparo: primer hogar real con dos adultos (a más tardar, Gate de Oro con Kary si comparte hogar). Origen: S55-B3.

#### D-336 — Textos legales definitivos (términos + privacidad)
🟡 ALTA. "Ayuda y legales" muestra PLACEHOLDER DECLARADO ("los textos definitivos están en preparación… fase de pruebas"). Los textos reales (es/en) requieren revisión legal. Disparo: pre-compuerta B6 — las reviews de tienda los exigen; sin ellos no hay submit. Origen: S55-B3.

#### D-337 — Eliminación de cuenta funcional (ejecuta la P15)
🟡 ALTA. La UI existe con voz honesta (letra (a) founder S55) y NO ejecuta; la espec vive como **P15 CANDIDATA** en `POLITICAS_EPETPLACE.md` (destino de mascotas/expediente, co-dueños, hitos P6, ledger intocable 7.8, ventana de gracia). Implementar EXIGE la firma de P15. Disparo: pre-compuerta B6 (requisito de tiendas). Origen: S55-B3.

#### D-338 — Construcción del PLAN de paseo (la recurrencia) — CANDADO ABIERTO
🟡 ALTA (bloque propio, espec completa firmada). El paquete de espec quedó FIRMADO en S55-B5 (`MODELO_PASEO.md` v1.1 §6 — chip "Hacerlo frecuente", Hoja L-D multi-selección, frecuencia de un toque, auto-renovación declarada, mismo paseador, hub "Mis paseos" con Próximos/Agenda/Historial · `MODELO_FINANCIERO.md` v2.5 Decisión S + regla 7.14 — un pago por período mensual, N devengos al cierre, precio unitario efectivo · `POLITICAS_EPETPLACE.md` P14 — saltos/fallas/pausa/plata). Alcance de construcción: DB sobre el mecanismo existente (`suscripcion_servicio_id`/`bono_id`, generación de citas del período con el motor de ventana S55-B2, cobro de período simulado declarado, crédito/reembolso proporcional P14 vía `aplicar_reembolso`), UI dueño (chip + Hoja + hub) y lado prestador (Sesión B). D-333 (sustitución+mensaje) sigue post-MVP aparte. **Disparo: gate E2E founder del Bloque 4 + pantallas de la Sesión B cerrado.** Origen: S55-B5 (OK completo del founder al paquete).

#### D-339 — Dirección-en-cita: el paseo no registra DÓNDE ocurre
🟡 ALTA (decisión de producto S56). Hallazgo del relevamiento B (S55): NO existe cobertura de servicio (`zonas_cobertura` es de envíos; `cat_zonas_trabajo_grooming` es del cuerpo del animal) y **la cita no registra dónde ocurre el paseo** — el paseador confirmado no sabe a qué puerta llegar sin WhatsApp. `direcciones_guardadas` existe con RLS y está vacía. Voto arquitecto (a decidir founder en S56): v1 = dirección del HOGAR sobre `direcciones_guardadas` con SNAPSHOT en la cita (patrón precio/duración); las zonas de cobertura del paseador son la otra mitad y viven en D-331. Disparo: mandato S56 (decisión antes del E2E completo). Origen: S55-B relevamiento.

#### D-340 — Empleados como capacidad real del motor
🟢 MEDIA. `prestador_empleados` es una tabla rica y el motor de ocupación es CIEGO a ella: la capacidad real es paseadores disponibles × cupo, hoy el cupo es un número plano por franja (proxy honesto mientras cada prestador demo/real sea unipersonal — `MODELO_PASEO.md` §4). Nota financiera del relevamiento B: `datos_bancarios` de empleados vs Decisión L (los fiscales viven SOLO en cuentas_comerciales) se resuelve cuando este bloque abra. Disparo: primer prestador real con equipo. Origen: S55-B relevamiento.

#### D-341 — Integración de `prestador_bloqueos` + pantalla de vacaciones
🟡 ALTA. La tabla `prestador_bloqueos` EXISTE y es letra muerta: NINGUNA función del motor la consulta (un prestador de vacaciones se sigue ofertando — pariente operativo de D-332). La Sesión B dejó un pedido de integración RETENIDO para el paquete motor S56; **su texto literal NO viajó a la A** (el corchete del founder llegó vacío) — **la B lo re-emite como texto completo autocontenido al abrir el paquete (regla 76b); esta deuda no se ejecuta sin ese literal.** Alcance esperado: el motor (`_agenda_ocupacion`/slots/inicios/bloqueo) respeta bloqueos + pantalla de vacaciones del prestador. Disparo: paquete motor S56. Origen: S55-B relevamiento.

#### D-342 — Higiene: policies duplicadas y doble CHECK en tablas de agenda
⚪ BAJA. Relevamiento B: policies duplicadas `ps_own`/`ph_own`/`pb_own` (conviven con las nuevas por-comando en `prestador_servicios`/`prestador_horarios`/`prestador_bloqueos`) y `dia_semana` con DOS CHECKs equivalentes. Cero riesgo funcional hoy (OR de policies permisivas del mismo dueño); es ruido que confunde relevamientos. Disparo: la primera tanda de DB que toque esas tablas (candidato natural: el paquete motor S56 / D-341). Origen: S55-B relevamiento.

### Deudas de Sesión 56 (11-12 Jul 2026)

> **Cierres de decisión S56 (registro):** **D-339 DECIDIDA por el founder** — dirección-en-cita v1 = dirección del HOGAR sobre `direcciones_guardadas` + SNAPSHOT en la cita (el voto del arquitecto, ratificado; la construcción es la Tarea 1 de S56; zonas de cobertura siguen en D-331). **Voz del 30' CERRADA: "Salida corta"** (es/en en el lote de strings S56). El paquete de letra del PAQUETE DE SALIDAS quedó FIRMADO (founder S56, en sesión con el arquitecto): `MODELO_PASEO.md` v1.2 (§6.1 continuidad POR DÍA DE SEMANA + §6bis paquete + §6ter escenarios A/B/C/D), `MODELO_FINANCIERO.md` v2.6 (Decisión T + 7.15 + comisión visible desde `fee_configs`), `POLITICAS_EPETPLACE.md` v1.4 (P16). En S56 se CONSTRUYE D-338 (el plan); D-343/D-344/D-345 solo se documentan — cero código de paquetes.

> **Estado S56-A (12 Jul 2026):** **D-339 ✅ CONSTRUIDA** (migración `20260712090000` + UI Cuenta/checkout — cierra del todo con el gate en dispositivo del Bloque 0). **D-338 ✅ CONSTRUIDA** (candado abierto por decisión founder SIN gate E2E; migraciones `20260712130000`+`133000` + Hoja del plan + hub "Mis paseos"; **cierra con el gate E2E del Bloque 0 — deuda de cierre de S56, condición de salida**). **D-348 ✅ CURADA** (ver su entrada). **D-341 ✅ APLICADA y D-342 ✅ CERRADA** (llegó el literal de la B, regla 76b — migración `20260712160000`: helper `_prestador_bloqueado` + las CUATRO puertas del pedido + los DOS callers del plan que la B no podía conocer (relevó pre-D-338; anclaje semántico, nota 3 del arquitecto) + `precio_plan` en la misma tanda; verificación literal A1-A5 VERDE + A6-A8 propios; policies pb_own/ps_own/ph_own y el CHECK duplicado de dia_semana MUERTOS, verificado post-drop). **Decisión ratificada founder+arquitecto:** la contratación del plan es ATÓMICA (una fecha sin cupo = rebote entero); la alternativa "genera las que caben y declara el resto" queda anotada con disparo: fricción real reportada por dueños.

#### D-349 — Edge del auto-solape en saltar_cita_plan ✅ CERRADA (S57-A)
⚪ ~~BAJA~~ **CERRADA en S57-A** (migración `20260712200000`): `_agenda_ocupacion` ganó el parámetro `p_excluir_cita` (DROP+CREATE de firma nueva, L-119; los 7 callers con 4 args intactos por el DEFAULT) y lo usan `saltar_cita_plan` Y la nueva `reagendar_cita_suelta`. Probado literal: mover un 120' de 08:00 a 09:00 (solapa su propia ventana) con cupo 1 PASA. Origen: S56-A (auto-declarada en construcción).

#### D-350 — EL WOW del ledger: el primer evento económico ante los ojos del founder
🟡 ALTA (deuda de cierre de S56, decisión founder regla 72 — el Bloque 0 (c) se DIFIRIÓ a propósito). Alcance: cierre con calidad de la cita viva `cfce1d43` (el paseo pagado de Thor) → PRIMER evento económico real del ledger (variante (b): `fecha_devengo`=cierre, `fecha_cobro_kushki`=pago simulado) → el gate en dispositivo de **Liquidaciones v1 de la B** (que espera exactamente ese primer evento desde S55) + la validación en vivo del devengo. El ledger sigue en CERO eventos: correcto y declarado — nada se fabrica antes del momento. **Disparo: APERTURA del Gate de Oro con Kary** (el wow abre esa sesión). Origen: veredicto founder del Bloque 0, S56.

#### D-351 — gen:types del package roto: spawn ENOENT que TRUNCA database.types.ts ✅ CERRADA (S57-A1)
~~🟡 ALTA~~ **CERRADA en S57-A1** las DOS patas (npx + archivo temporal con move atómico y limpieza en fallo), verificada rompiéndola a propósito (PATH saboteado: exit 1, `database.types.ts` intacto, sin tmp residual) y el default de SCRATCH de `verify-i18n.mjs` curado a `os.tmpdir()` — la carpeta `undefined/` no vuelve a nacer. Letra original:
🟡 ALTA (rotura SILENCIOSA peligrosa — el redirect `>` vacía el archivo ANTES de que el spawn falle: un fallo deja tipos truncados que el typecheck puede no atrapar entero). `pnpm --filter @epetplace/api gen:types` invoca `supabase` pelado (no está en PATH del package → ENOENT); ambas sesiones S56 lo esquivaron regenerando desde la raíz con `npx supabase gen types…` (declarado por la B en `3e5289a`). Cura: el script del package usa `npx supabase` (o genera a archivo temporal + move atómico). Misma tanda de harness: `verify-i18n.mjs` escribe capturas a `${process.env.SCRATCH}/` SIN default — sin la env var nace la carpeta literal `undefined/` en la raíz (barrida y al .gitignore en el cierre S56; el default al scratchpad se cura acá). Disparo: primera tanda que toque `packages/api`. Origen: reporte final B, S56.

#### D-352 — Smokes anclados a fecha ✅ CERRADA (S57-A1)
~~🟢 MEDIA~~ **CERRADA en S57-A1**: nace `scripts/lib-db.mjs` (dbQuery solo-SELECT vía CLI linkeado + hoyLocal); parametrizados leyendo de DB: `verify-direccion-cita-web-s56` (fecha de cfce1d43 leída; si no es hoy, precondición honesta exit 2 — probado el mismo día: la cita era de ayer y lo dijo), `verify-verdad-firme` (día y conteos leídos; el ancla '2026-07-07' apuntaba a citas que YA NO EXISTEN), `verify-prestador-s51` (vacío de HOY por conteo real, rama doble), `verify-esqueleto-s51` (voz 'al día' derivada de la última actividad en DB — la ventana de 12 meses vencía sola en jul-2027), `verify-tramo-final-web-s56` (hoyIso muerto fuera, regla 37). Robustos sin tocar: los de "próximo sábado" (siempre futuro), vacaciones (fechas generadas), voz-hogar/vitales (reloj pinneado), plan-marca-web (mock sintético). Letra original:
🟢 MEDIA. `verify-direccion-cita-web-s56` exige que la cita `cfce1d43` sea "hoy" — un smoke que solo pasa el día que se escribió no es una red, es una foto (pariente del hallazgo toISOString S55: el harness y la fecha local se muerden). Barrer los verify-* buscando anclas de fecha absoluta/relativa frágil y parametrizarlas (fecha de la cita LEÍDA de la DB, jamás asumida). Disparo: la misma tanda de harness que D-351. Origen: reporte final B, S56.

> **GATES EN FRÍO — deuda de cierre ÚNICA de S56 (ninguno bloquea; el founder los corre a su ritmo o en el arranque de S57; todos sobre las APKs con doble reinicio, L-138):** lote de strings S56 completo (es/en, marcados GATE PENDIENTE en los diccionarios de ambas apps) · neto visible en /servicios · precio del plan (persistencia + "Sin plan en este bloque") · vacaciones (crear/quitar + LA PRUEBA DE FUEGO CRUZADA: el prestador bloqueado desaparece de los inicios del CLIENTE) · "A dónde ir" con mapa (la cita del E2E) · "Parte del plan" (se enciende con la primera cita de plan del E2E) · gates de Cuenta v1 por pantalla (heredados S55) · lectura/firma de P15.

### Deudas de Sesión 57 (12 Jul 2026)

> **Estado S57-A (12 Jul 2026):** **P18 FIRMADA e integrada** (POLITICAS v1.5 + PASEO v1.3 §3bis + FINANCIERO v2.7 regla 7.16; P17 RESERVADA a la Cuenta del prestador — luego FIRMADA v1.1 en la misma sesión: POLITICAS v1.6). **D-343 ✅ CONSTRUIDA lado dueño** (migración `20260712180000` + wrappers + UI; asserts 12/12 rollback + runtime E2E 12/12 con limpieza verificada; la UI del prestador —campo precio_paquete en /servicios— es de la Sesión B sobre el contrato publicado: columna `prestador_servicios.precio_paquete`, espejo exacto de `precio_plan`, presets 5/10/15 EN LETRA no configurables). **A3/P18 ✅ CONSTRUIDA** (migración `20260712200000`: reagendar_cita_suelta + cancelar_cita_suelta + no_show conectado con devengo Decisión T; asserts 8/8 rollback). **D-349/D-351/D-352 ✅ CERRADAS.** **Hallazgo curado:** la rama "revenue puro plataforma" de `crear_evento_economico` estaba muerta de nacimiento (v_fee_resuelto sin asignar — error 55000; el breakage del paquete fue su primer caller real); cura versionada en `20260712180000`, proacl intacto. **Enmienda técnica declarada:** `marcar_no_show_cita` ganó gate temporal `cita_aun_no_ocurre` (con el devengo nuevo, marcar anticipado era palanca de cobro sin agenda bloqueada). **Gates en frío S57 (founder, en dispositivo):** strings `paquete.*`/`suelto.*` es/en (GATE PENDIENTE en diccionarios) · compra del paquete + reserva contra saldo + cancelaciones + reagenda del suelto por pantalla. **Pendiente de firma (NO integrada):** la enmienda de craft a `epetplace-design-system` (Leyes 14-18) — su propio texto la declara propuesta.

> **CIERRE S57 (registro final, escritora única):** cerradas D-317 (`33c4940`), D-343 (todas las patas), D-349, D-351, D-352 (ver sus entradas). **D-315p** (fechas del prestador al riel: `fechaDiaSemanaHumana`) quedó curada dentro de `33c4940`; la **pata prestador de la persistencia de idioma** (espíritu D-316, cerrada S55 para el cliente) quedó cubierta en `09f7d73` — ninguna reabre número. **D-330 sigue ABIERTA** esperando decisión del founder (voto arquitecto registrado: (c) consentir + micro-consentimiento). **D-347** se alimenta del registro de notas literales del founder S57 (+ notas de Kary cuando existan). D-353/D-354 registradas en esta sesión, vigentes. **Gates felices del founder: PERFECTOS**; los de ESPERA = D-365.

#### D-355 — Guard de especie del PLAN entró por transformación anclada ✅ CERRADA (S59-A2, migración `20260713170000`)
~~🟢 MEDIA~~ **CERRADA en S59-A2**: el disparo sonó (el guard L-V tocó `contratar_plan_paseo`) y la RPC quedó reescrita NATIVA completa — body entero versionado con el guard de especie Y el guard L-V adentro; la transformación anclada de `20260713010000` quedó absorbida. Letra original:
🟢 MEDIA. En `20260713010000` el guard `mascota_no_elegible` de `contratar_plan_paseo` se inyectó por transformación anclada del body vigente (replace con verificación de anclaje — el DO aborta si el texto no matchea). Funciona y está probado, pero las transformaciones NO se apilan: el próximo toque de esa RPC la reescribe NATIVA (body completo versionado con el guard adentro). Disparo: próxima migración que toque `contratar_plan_paseo`. Origen: S57-A (auto-declarada).

#### D-356 — especies_compatibles por oferta existe SIN guard
⚪ BAJA. `prestador_servicios.especies_compatibles` (S44, jsonb por oferta, hoy `["perro"]` en las de paseo) es refinamiento del PRESTADOR y no participa de la elegibilidad canónica (que vive en `tipos_servicio.especies_elegibles`, v1.4 §1bis). Cuando un servicio multi-especie real exista, decidir: o el campo por oferta gana un guard propio (intersección con el del tipo) o se declara solo-informativo. Disparo: primer servicio multi-especie construido. Origen: S57-A (relevamiento F3).

#### D-357 — Migración chips→selector segmentado en pantallas vivas
🟢 MEDIA. Ley 19.3 (capa de craft firmada): los chips quedaron PROHIBIDOS como tabs/segmentos. Pantallas vivas que migran al selector segmentado canónico cuando exista (D-359): Hoy/Semana del prestador (S57-B B1) y el hub "Mis paseos" del cliente (Próximos/Agenda/Historial). Disparo: pasada de acabados. Origen: S57 (capa de craft).

#### D-358 — Tokens de elevación (Ley 20) en packages/ui
🟡 ALTA (pieza estructural de los acabados). Dos niveles y solo dos — `elevacion.reposo` (tarjetas/celdas: sombra doble suave, contacto+difusa) y `elevacion.elevada` (Hojas/menús) — vara Airbnb: sutil, jamás dramática; se conservan en dosis prestador y en memorial; el fondo deja de ser blanco puro (papel cálido — D-360). UNA definición en tokens, jamás sombras artesanales por pantalla; calibración en el primer lote de pantallas patrón con gate founder. Territorio de la A. Disparo: pasada de acabados (primer pedido). Origen: S57 (capa de craft, Ley 20).

#### D-359 — Componente selector segmentado canónico (Ley 19.3) en packages/ui
🟡 ALTA. El control de vistas exclusivas (segmentos) que el diccionario de patrones exige — nace por el método completo de la Ley 11 (espec con escalera, tokens, WCAG si trae pares, galería, gate en dispositivo). Territorio de la A. Disparo: pasada de acabados (con D-357 como primera migración). Origen: S57 (capa de craft).

#### D-360 — Fondo/marco de la casa: el papel cálido
🟡 ALTA. El tono exacto del fondo (deja de ser blanco puro para que las superficies con elevación respiren — nota abierta de la Ley 20) se firma con el MARCO de la casa: propuesta del arquitecto + firma del founder, sobre píxeles (pantalla patrón, primera: el Hogar). Disparo: pasada de acabados. Origen: S57 (capa de craft).

#### D-361 — Lote de íconos b′ del set firmado para placeholders y pre-b′
🟢 MEDIA. El lote de íconos del set b′ (DIRECCION_ARTE, método §6: registry + galería + gate founder por ícono, 21px §2.9) para reemplazar los placeholders de las pantallas nuevas S56/S57 y los rezagados pre-b′ — convive con D-318 (que sigue rigiendo la mecánica al-tocarse; este lote es la pasada dedicada). Disparo: pasada de acabados. Origen: S57.

#### D-362 — Prueba cruzada específica del paquete (condicional)
⚪ BAJA (condicional). Guion: compra → reserva → cancelación → la franja liberada reaparece en los inicios del CLIENTE y en la agenda del PRESTADOR. Ya cubierta por asserts SQL (rollback) y E2E de wrappers; SOLO se construye como verify cruzado dedicado si la casilla 5.4 del guion E2E del founder FALLA. Disparo: fallo de la casilla 5.4. Origen: S57.

#### D-363 — Los domingos ausentes: ¿config del prestador demo o regla escondida?
🟢 MEDIA. La agenda demo no tiene franjas de domingo (relevado S57: prestador_horarios días 1-6). Verificar: si es CONFIG del prestador (lo esperable — franjas semanales que él define), la voz honesta del flujo debe poder decirlo ("no atiende domingos" es oferta, no bug); si alguna regla en código excluye domingos por fuera de la config, SE EXTIRPA. Disparo: próxima sesión que toque agenda. Origen: S57 founder (pregunta del gate).

#### D-364 — Pantalla de elección de destino del reembolso (banco vs saldo e-PetPlace)
⏸ DIFERIDA (ya declarada en P18 — esta entrada es el puntero de deuda). La elección del destino (medio de pago original con sus ~15 días hábiles declarados / saldo e-PetPlace en segundos) se construye con las DOS vías reales; el saldo e-PetPlace nace con su letra financiera propia ANTES del primer crédito (financiero v2.7 §7.16). Disparo: Kushki fase 1. Origen: P18 (founder S57).

#### D-365 — Gates de ESPERA del founder (hold que expira, paquete que vence) ✅ CERRADA (S59 — gates corridos VERDES)
~~🟡 ALTA~~ **CERRADA en S59**: el founder corrió los dos escenarios de espera en la tanda de gates S59 y salieron VERDES — sin curas. Letra original:
🟡 ALTA (deuda de cierre de S57 — los corre el FOUNDER; curas si fallan). Los dos escenarios que los gates felices no cubren porque exigen tiempo real: (1) el hold de 15 min que expira sin pagar (la franja debe re-ofertarse sola y el checkout decirlo honesto); (2) el vencimiento del paquete (el aviso sereno UNO ≤3 días antes vía `vencer_paquetes_salidas` + el breakage declarado — la corrida hoy es manual/cron pendiente, nota 6.6 del financiero). Disparo: el founder los corre a su ritmo; toda falla vuelve como tanda de curas. Origen: veredicto del gate S57.

#### D-366 — Sesión de USABILIDAD/navegación del cliente (segunda pasada, founder S58; ENMENDADA S59)
🟡 ALTA (deuda de sesión, registrada por pedido literal de la adenda S58). La pasada de acabados S58 pule pantalla por pantalla contra el patrón; la SEGUNDA pasada mira los RECORRIDOS: navegación entre pantallas, descubribilidad, nombres de acciones a lo largo del flujo (Ley 17.3). Hallazgos ya anotados como insumo: (1) la tríada del hub "Mis paseos" es/en (Próximos·Agenda·Historial / Upcoming·Schedule·History) es léxicamente paralela, pero **Próximos y Agenda se solapan en contenido** (ambos muestran salidas futuras — el usuario no sabe cuál abrir; candidato a renombrar o fusionar); (2) la entrada al hub es doble (Hogar + Explorar→Paseo) y su descubribilidad se re-mide con la celda con ícono del grupo S58 (D-347); (3) el precio del plan del lado dueño (~~enmienda de RPC propuesta~~ CURADA en S59-A2, D-375) cambia lo que el CUÁNDO puede prometer. **Disparo: post-E2E juez final; insumo rey = las notas de Kary.** Origen: decisión founder S58 (adenda, punto 4).
**ENMIENDA S59 (founder, literal — el PRIMER insumo de Kary llegó):** *"Los servicios de Explorar deberían tener vista rápida desde la posición consolidada (el Hogar). Usuaria intensiva de compras para mascotas, perfil 'perezoso' en el buen sentido: todo a la mano, la app casi anticipando lo que necesita."* **Lectura del arquitecto anotada:** el patrón "Mis paseos" con saldo vivo SE GENERALIZA — cada servicio activo o frecuente gana su celda viva en el Hogar; el Hogar es estado Y anticipación. **Evidencia convergente:** la barra de progreso de perfil de Laika (pantallazo founder S59). Sigue siendo insumo rey de la sesión D-366; el disparo no cambia (post-E2E juez).

> **CIERRE S58 (registro final, escritora única):** cerradas **D-347** (hub v2: descubribilidad — portada del mundo + celda con saldo vivo), **D-357** (primera migración chips→SelectorSegmentado en el hub), **D-358/D-359/D-360** (materiales: elevación+papel+segmentado, `862dcf2`), **D-361** (lote 3 construido `ea7e8e4` — el CIERRE REAL espera el gate founder por ícono; cláusula del ilustrador vigente). **D-330 SIGUE ABIERTA** (sin firma del founder al push). **LECCIONES:** **L-145** — L-9 CONFIRMADA en móvil: el smoke web mintió el crash (la verificación browser no cierra gates de dispositivo); **L-146** — la letra del arquitecto TAMBIÉN se gatea sobre píxeles (las tarjetas apiladas del boceto no sobrevivieron al teléfono); **L-147** — toda entrada-por-estado exige su camino de validación (`__DEV__` toggle o seed): un estado inalcanzable en dev es un estado sin gate.

#### D-368 — Jerarquía ciudad → BARRIOS de las zonas de cobertura
🟢 Registrada S58. El contrato D-331 v1 es nivel CIUDAD; el barrio/sector (Cumbayá ≠ Quito centro) exige tabla hija de cat_ciudades + UI de la B. Disparo: primer prestador real que lo pida, o D-367.

#### D-369 — RPC atómica `guardar_oferta_paseo` (el wizard guarda por partes)
🟡 ALTA. El arte del paseo guarda sección por sección (N wrappers); una caída a mitad deja oferta INCONSISTENTE visible. Nace la RPC atómica (todo-o-nada, patrón contratar). **Disparo: antes del primer prestador real.**

#### D-370 — Edición de nombre/descripción de la oferta renace en el perfil del prestador
🟢 Registrada S58 (Chanel del wizard la sacó del arte). Disparo: sesión del perfil público del prestador.

#### D-371 — Promoción de TechoTinta a packages/ui
🟢 El techo de tinta vive hoy en apps/prestador (B); cuando un segundo consumidor aparezca, sube a packages/ui por Ley 11. Disparo: segundo consumidor.

#### D-372 — Glifos de tabs centralizados en el registry
🟢 Los tabs de ambas apps arman sus Svg localmente con estadoPorHuella; con el lote 3 vivo, migrar los glifos al registry (una fuente). Disparo: pasada de tabs post-gate del lote.

#### D-373 — Tira horizontal: forense L-132 abierto en el CLIENTE ✅ CERRADA (S59 — gate en dispositivo VERDE)
~~🟡~~ **CERRADA en S59**: el gate en dispositivo de la Hoja del plan salió VERDE — la tira NO pierde contra el swipe-to-close; el forense L-132 del cliente se cierra sin cura. Letra original:
🟡 La tira (ScrollView horizontal) dentro de Hojas puede perder contra el swipe-to-close en Android como L-132 — web no lo delata. Verificar EN DISPOSITIVO las tiras de plan-hoja/paquete-hoja; si pierde, patrón HojaScroll horizontal. Disparo: gate de la Hoja del plan.

#### D-374 — Háptica del slider/interruptor (expo-haptics) ✅ CERRADA (S59 — decisión founder: SIN háptica v1)
~~⏸ DIFERIDA~~ **CERRADA en S59** por decisión del founder: v1 SIN háptica. `onStep` queda como hook vacío (cero deuda de refactor si reabre). **Se reabre SOLO si el ensayo la pide.** Letra original:
⏸ DIFERIDA a decisión founder. `onStep` ya es el hook (cero refactor); expo-haptics = dep NATIVA → L-134: version bump + builds nuevas. Disparo: firma founder.

#### D-375 — El precio del plan del lado dueño ✅ CERRADA (S59-A2, migración `20260713170000`)
~~🟡~~ **CERRADA en S59-A2**: `obtener_paseadores_disponibles` ganó `precio_plan` en el RETURNS (DROP+CREATE por L-119, cero callers en DB relevados, L-140 re-afirmado — proacl sin anon) + wrapper `obtenerPaseadoresDisponibles` con `precio_plan: number | null` (null honesto = sin descuento) + runtime E2E solo-lectura verde (1 paseador demo, precio=8, precio_plan=null). La PlanHoja lo pinta en la Tarea 3 de la misma sesión. Letra original:
🟡 `obtener_paseadores_disponibles` no devuelve `precio_plan` y la PlanHoja muestra el precio del SUELTO cuando el server cobra COALESCE(precio_plan, precio) — verosímil-falso de plata. Propuesta S58: agregar precio_plan al RETURNS + PlanHoja lo pinta. **Disparo: firma founder (gate de migración).**

#### D-376 — Regla 76(f): staging por RUTA en el árbol compartido ✅ CERRADA (S59 — FIRMADA al contrato)
~~🟡~~ **CERRADA en S59**: la enmienda **76(f)** quedó FIRMADA en `CONTRATO_TRABAJO.md` v1.10 — staging SIEMPRE explícito por ruta (git add -A/. prohibidos) + `git status` pre-commit verificando territorio propio; archivo ajeno modificado se deja intacto y se declara. Letra original:
🟡 El incidente S58 (`3691b1a`→`98c7e5e`): un `git add -A` de la A barrió WIP incompleto de la B y dejó main rojo; cura sin reescribir historia. Letra propuesta: staging SIEMPRE explícito por ruta + `git status` pre-commit verificando territorio propio. **Disparo: firma founder en la letra del contrato.**

#### D-367 — FILTRO por zona de cobertura en slots/oferta (la v1 declara, no filtra)
🟡 ALTA (nace CON la construcción de D-331 v1, S58 — registrada por pedido literal). El contrato v1 de zonas es DECLARATIVO: `prestador_zonas` dice "cubre Quito y Bogotá" y la ficha lo muestra, pero `obtener_paseadores_disponibles`, `obtener_slots_disponibles` y el motor de ocupación NO consultan la cobertura — un dueño en Cuenca puede reservar a un paseador que solo declaró Quito. La v1 no miente (declara, no filtra) y lo declara acá. El filtro exigirá además resolver QUÉ ciudad porta la reserva (la dirección del hogar tiene `ciudad` en texto libre — el puente a `cat_ciudades` es parte de esta deuda). **Disparo: primer dueño real fuera de zona, o decisión founder.** Origen: decisión founder S58 (D-331 v1 declarativa).

#### D-354 — Escalera de precio por preset del paquete (evolución DECLARADA, APAGADA)
⏸ DIFERIDA. La v1 del paquete (S57-A, D-343) usa **precio único por salida** (`prestador_servicios.precio_paquete`) para los tres presets 5/10/15 — el descuento por volumen es uno solo, no escala con el tamaño del preset (decisión técnica de Code ratificada por el arquitecto S57: patrón Decisión S/precio_plan, una columna). La escalera por preset (5 a un precio, 15 a otro) queda declarada como evolución posible del mismo contrato: exigiría columnas/jsonb por preset + enmienda del wrapper y de la Hoja de compra, sin tocar el chasis (el bono ya snapshotea SU precio de origen). Sin lugar en UI hasta el disparo. **Disparo: pedido del founder tras el gate del paquete.** Origen: respuesta del arquitecto S57-A.

#### D-353 — Devolución al saldo post-vencimiento queda fuera del breakage ya declarado
⚪ BAJA. Edge declarado en `20260712180000`: una reserva hecha antes del vencimiento del paquete y cancelada en ventana DESPUÉS de que el pase de vencimiento corrió devuelve la salida a un bono ya 'vencido' — la fila dice la verdad (unidades_usadas baja, `pago_metadata.devolucion_post_vencimiento`) pero el evento de breakage ya nació sin esa salida. Ventana de horas, caso raro. Disparo: primer caso real en datos (o Kushki fase 1, que rediseña el cierre del reembolso). Origen: S57-A2a (auto-declarada en construcción).

#### D-343 — Construcción del PAQUETE DE SALIDAS (bono anclado) ✅ CERRADA (S57, ambas sesiones)
~~🟡 ALTA~~ **CERRADA en S57**: DB+wrappers+UI dueño por la A (`09687a7`+`3dabd51`+`2c59ba2`; enmienda v1.4 del gate — paquete DEL HOGAR + comprar≠reservar en la UI + especie por servicio — en `18789ec`+`b040733`), superficie del prestador (/servicios, campo precio del paquete sobre el contrato precio_paquete) por la B (`704462b`), vista del prestador de la cancelación (`dfd69ac`). Gates felices del founder PERFECTOS; quedan los de ESPERA (D-365). Letra original:
🟡 ALTA (espec completa: el paquete de letra S56 firmado — `MODELO_PASEO.md` §6bis, financiero v2.6 Decisión T/7.15, P16). Alcance: DB sobre `bono_id` existente (saldo, vigencia, rollover FIFO, cierre `no_show`, breakage al vencimiento — L-140 en todo), UI dueño (compra del paquete en el flujo del prestador elegido + saldo visible + reserva contra saldo), UI prestador (configurar precio de presets 5/10/15 con neto visible), lado B la vista de su agenda. **Disparo: cierre de D-338** (el plan mensual se construye PRIMERO tal cual firmado; el paquete entra después sin refactor — mismo chasis). Origen: S56 founder.

#### D-344 — Captura de demanda no cubierta (escenarios C/D)
🟡 ALTA. Cierra el hueco "captura de demanda" (RUTA_F1, enmienda S54). Toda búsqueda con cobertura parcial o nula PERSISTE la necesidad (qué servicio, duración, día/hora pretendida, zona cuando D-331 exista, timestamp; user_id — dato personal: retención/anonimización se define con la letra de P15) y responde con la voz honesta de `MODELO_PASEO.md` §6ter. Es además el insumo del pricing del paquete flex (§6bis.8). Disparo: primer flujo de búsqueda que pueda devolver vacío en producción de verdad — se construye con o inmediatamente después de D-338. Origen: S56 founder.

#### D-345 — Portal admin: alertas de demanda no cubierta
🟢 MEDIA. El admin VE la demanda capturada por D-344 (agregada por servicio/zona/franja) con alerta cuando un patrón se repite — es inteligencia de reclutamiento de prestadores. Disparo: D-344 con datos reales acumulándose. Origen: S56 founder.

#### D-346 — Pre-llenado EDITABLE de bloques largos desde precio/hora en /servicios
🟢 MEDIA. UX de `/servicios` del prestador: al configurar la oferta, los precios de los bloques largos se PRE-LLENAN como derivación editable del precio/hora — el prestador ajusta, jamás se le impone. **El modelo `MODELO_PASEO.md` §2 (precio POR BLOQUE) queda INTACTO:** lo que se persiste sigue siendo el precio por bloque que el prestador confirma; el pre-llenado es azúcar de captura, no prorrateo del motor. Convive con la regla de comisión visible (financiero 7.15: neto desde `fee_configs`). Disparo: la próxima vez que `/servicios` se toque. Origen: S56 founder.

#### D-348 — resolver_fee_aplicable expone fees negociados de terceros
🔴 BLOQUEANTE (seguridad; addendum arquitecto S56). `resolver_fee_aplicable` es SECURITY DEFINER con EXECUTE para authenticated: cualquier user autenticado que conozca (o enumere) el uuid de una cuenta comercial ajena puede leer su fee NEGOCIADO — la RLS `actor_read_own_fees` de `fee_configs` protege la tabla pero el resolver la bypassea por diseño (necesita las filas default, invisibles por RLS). Cura: split — `_resolver_fee_aplicable` interna (sin EXECUTE de authenticated; la llaman `crear_evento_economico` y `confirmar_cita_pagada` como owner) + la pública conserva nombre/firma (fees.ts de la B intacto) con gate: claims `authenticated` ⇒ is_admin() o cuenta propia (`owner_profile_id = auth.uid()`), si no error tipado `cuenta_ajena`; `service_role` y callers DEFINER internos intactos. Verificación exigida: dueño resuelve · ajeno rebota tipado · asserts motor S54/S55 verdes. Origen: S56 addendum arquitecto. **Curada en la misma S56 (tanda propia — el literal de D-341 aún no llegó y esto es exposición viva).**

#### D-347 — Sesión de ELEVACIÓN DE CRAFT visual (pre-Gate de Oro)
🟡 ALTA. Sesión dedicada de elevación de craft de las pantallas clave del arco de paseo: composición, jerarquía y elemento firma por pantalla — vara MoeGo+ (la fluidez no alcanza; la pantalla tiene que tener FIRMA). No es deuda de componentes (el sistema existe): es la pasada de dirección de arte sobre las pantallas ya construidas, con gate founder por pantalla. **Disparo: cierre del arco de paseo, ANTES del Gate de Oro con Kary.** Origen: S56 founder.
**Insumo del veredicto Bloque 0 (founder, S56): llegar al hub "Mis paseos" CUESTA** — el doble clic del servicio no se encuentra solo (las dos entradas existen pero no llaman). La descubribilidad del hub entra al alcance de esta sesión de craft; no se parcha hoy.

### Deudas de Sesión 59 (13 Jul 2026)

> **Registro S59-A2 (escritora única):** cerradas **D-330** (P19 firmada — el paseo es grupal por norma), **D-374** (decisión founder: sin háptica v1; reabre solo si el ensayo la pide), **D-376** (regla 76(f) firmada al contrato v1.10). **D-375 se cura en la migración única de esta sesión** (ver su entrada al cierre). Letra nueva: `MODELO_PASEO.md` v1.5 (§6.1 plan L-V · §6.4 sugeridos 80/60 · §7 EL DURANTE) + `POLITICAS` v1.7 (P19).

> **CIERRE S59 (registro final, escritora única):** cerradas **D-330** (P19 completa: norma + DB + guard en tres puertas + UI), **D-355** (contratar_plan_paseo reescrita nativa al entrar el guard L-V), **D-365** (gates de espera VERDES), **D-373** (la tira no pierde — gate verde), **D-374** (sin háptica v1), **D-375** (precio_plan verdadero, migración `20260713170000`), **D-376** (76(f) al contrato v1.10, estrenada 2× en la propia tanda). Nuevas **D-377→D-386** (realtime del durante · policies {public} · razas · domicilio · uñas · catálogos S26 · restricciones grooming-2 · ancla híbrida · salida grupal del HOY · franjas por servicio). **Sin lecciones numeradas nuevas** — el hallazgo estructural de la tanda (el modelo de familia no podía editar `mascotas`; el helper legacy `mascota_codueño` no conocía a `familia_miembro`) quedó curado y documentado en `20260713213000`. **E2E juez: PENDIENTE — S60 abre con la corrida como primer bloque (corchete del founder sin resolver al cierre; rama conservadora asentada por L-142).** *Enmienda S60: E2E juez resuelto VERDE por veredicto founder en arranque S60 — el paseo se declara CERRADO; toda falla futura entra como tanda de curas anotadas.*

#### D-377 — Realtime del DURANTE (suscripción push al track/novedades)
🟢 MEDIA. La frescura v1 del EN VIVO del dueño es HONESTA por diseño (§7.4 del paseo): sondeo ~30 s con pantalla en foco + pull-to-refresh + "Actualizado hace X" — coherente con un GPS que escribe ~cada 60 s foreground-only (D-292). La suscripción realtime (canal supabase sobre `eventos_mascota_paseo`/`evento_paseo_novedades`) se construye cuando la frescura del insumo la justifique. **Disparo: GPS de fondo (B5/D-292) construido, o el ensayo pidiendo más frescura.** Origen: S59 (§7 del paseo, letra firmada).

#### D-378 — Higiene: policies con rol `{public}` en tablas del paseo
⚪ BAJA. `eventos_mascota_paseo` y `evento_paseo_novedades` tienen sus policies colgadas del rol `{public}` mientras el resto de la familia del durante (`evento_atencion`, `evento_archivo_adjunto`, `evento_grooming_notas/incidencias`) usa `{authenticated}`. SIN efecto práctico hoy (RLS activa + las funciones gatean auth), pero es asimetría que confunde relevamientos. Homogeneizar a `{authenticated}` la próxima vez que esas policies se toquen. Origen: relevamiento S59-A1.

#### D-385 — La salida GRUPAL en el HOY del prestador (hallazgo de gate S59)
🟢 MEDIA. Con cupo >1 (que P19 legaliza como norma), N citas vivas del MISMO bloque horario se pintan como N filas separadas en el HOY — deberían ser UNA salida con N mascotas (la unidad de trabajo del paseador es la SALIDA, no la cita). Toca la vista del prestador (agrupar por prestador+ventana) y quizá el EN VIVO del dueño (su cita sigue siendo suya — la agrupación es del lado oficio). **Disparo: la sesión D-366, o el pulgar del founder antes.** Origen: hallazgo del gate founder S59.

#### D-386 — Franjas de horario POR SERVICIO (el prestador con dos oficios)
🟢 MEDIA. `prestador_horarios` admite `servicio_id` (NULL = franja para todo), pero el wizard de cada oficio (paseo S58, grooming S59 — sección horarios COMPARTIDA) escribe franjas generales: un prestador con DOS oficios no puede declarar "paseo por la mañana, grooming por la tarde". La estructura ya lo soporta — falta la UI y la letra fina (¿la franja general convive con la específica?). **Disparo: el primer prestador con dos oficios que pida horarios distintos.** Origen: relevamiento S59 (wizard grooming de la B sobre la sección compartida). **Letra founder (S60): el prestador con varios oficios ELIGE — horarios por servicio o franjas universales para todo (la franja general y la específica no conviven mezcladas: es una opción del prestador). Cláusula del arquitecto: la OCUPACIÓN del motor sigue siendo GLOBAL por prestador — las franjas declaradas se independizan, el cuerpo no. Disparo intacto.** **Hallazgo del relevamiento S61 (R0 parte 3, contra realidad): el motor HOY lee ADITIVO — los cuatro lectores (`obtener_inicios_paseo_disponibles`, `obtener_paseadores_disponibles`, `_inicios_disponibles_prestador` y por él las gemelas grooming) filtran `(servicio_id IS NULL OR servicio_id = <oferta>)`: la general aplica a todo Y una específica se SUMARÍA. La letra "no conviven mezcladas" exige un guard EXCLUYENTE nuevo (cirugía de motor pendiente — el SQL actual las mezclaría sin quejarse); además el UNIQUE no protege franjas generales (NULLs no colisionan) y la anti-duplicación vive solo en el wrapper. Los wizards siempre escriben `servicio_id` NULL; cero filas específicas en DB.** **Dueño declarado (cierre S61): el guard EXCLUYENTE es cirugía de MOTOR — pedido a la A en S62.**

#### D-379 — Catálogo de razas por especie con características
🟡 ALTA. Catálogo de razas por especie con características (talla y pelaje DEFAULT → pre-llenan el perfil; más adelante, insumo del Coach y del producto-que-sabe). Reglas de la letra (founder S59, `MODELO_GROOMING.md` §3): **"Mestizo / No sé" es respuesta LEGÍTIMA** de primera clase; **el catálogo SUGIERE, el dueño CONFIRMA** — jamás pisa lo declarado. Grooming v1 NO lo espera (pregunta talla/pelaje directo). **Disparo: antes del soft launch.** Origen: S59 (letra del grooming).

#### D-380 — Grooming a DOMICILIO (segunda tanda de F1)
🟡 ALTA. El groomer declara local/domicilio/ambos; v1 construye SOLO local (camino feliz). La tanda domicilio hereda dirección-en-cita (D-339, snapshot existente) + recargo opcional del groomer. Sin lugar en UI hasta la tanda — la oferta domicilio no se dibuja apagada. **Disparo: cierre del grooming local (A4) funcional.** Origen: S59, `MODELO_GROOMING.md` §4.

#### D-381 — Uñas como servicio COMPRABLE suelto
🟢 MEDIA. Hoy `corte_unas` es solo REGISTRABLE (vocabulario del Durante). Los groomers reales suelen vender uñas suelto (ticket chico, alta frecuencia). Al abrir: entra como tercer comprable del menú de dos capas SIN romper la regla madre (comprable ≠ registrable), con su matriz talla propia. **Disparo: el primer groomer real que lo pida.** Origen: S59, `MODELO_GROOMING.md` §1.

#### D-382 — Catálogos ricos del canon S26 (pelaje/productos/plantillas)
🟢 MEDIA. El Durante v1 usa selector simple + nota libre. Los catálogos ricos del canon S26 (estados de pelaje finos, productos con marcas, plantillas de nota del groomer) y las sugerencias grooming-1 esperan uso real. **Disparo: la conversación con el groomer real (la misma de §10.3).** Origen: S59, `MODELO_GROOMING.md` §8.

#### D-383 — Restricciones automáticas grooming-2 (señal clínica cruzada)
🟢 MEDIA. El cruce clínico automático (p.ej. dermatitis registrada por el vet → aviso al groomer de shampoo medicado / restricción) es grooming-2. v1: el Antes muestra la vista filtrada y el criterio es humano. **Disparo: el primer evento clínico cruzado real en el expediente de una mascota con cita de grooming.** Origen: S59, `MODELO_GROOMING.md` §8.

#### D-384 — Ancla híbrida de las tablas hijas del grooming
⚪ BAJA. Relevado S59: `evento_grooming_notas/incidencias/pausas` ya portan `evento_atencion_id` (capa atención), pero `evento_grooming_archivos`, `evento_grooming_estados_pelaje`, `evento_grooming_productos_consumidos`, `evento_grooming_servicios_aplicados` y `evento_grooming_zonas_trabajadas` siguen ancladas SOLO en `grooming_id`. Sin efecto funcional hoy (el puente `eventos_mascota_grooming.evento_atencion_id` existe); es deuda de coherencia del modelo de capas. **Migrar a la capa atención AL TOCARLAS** — jamás migración big-bang. Origen: relevamiento S59-A3.

### Deudas de Sesión 60 (13-14 Jul 2026)

#### D-387 — Los registrables de grooming ganan voz de familia y viajan al EN VIVO del dueño
🟡 ALTA. Los 9 registrables de grooming (`cat_servicios_grooming`) ganan `nombre_familia` (textos gateados por el founder, patrón D-300 — el catálogo de novedades del paseo es el precedente) y el EN VIVO del dueño los pinta como novedades (MODELO_GROOMING §8: "estado y novedades"). **v1 muestra estado + fotos + mensaje — honesto por Ley 3**: el registro fino del groomer es vocabulario del oficio sin voz de familia, y volcarlo crudo al dueño violaría la regla del vocabulario interno (hallazgo 5 del cierre S60-A1: las novedades del grooming NO viajan al vivo v1, declarado y no parchado). **Disparo: antes de prestadores reales, o pulgar founder.** Origen: S60-A2 (pedido founder sobre el hallazgo del cierre A1). Emparentada con D-388 (misma tabla, dos columnas de voz).

#### D-388 — Voz es-only de los catálogos de grooming (familia D-324)
🟢 MEDIA. Los 6 códigos de `cat_incidencias_grooming` y los 9 registrables de `cat_servicios_grooming` hablan SOLO español (`nombre` sin pata en) — el mismo patrón que los MOTIVOS_GPS del paseo (D-324). Emparentada con D-387: misma tabla, dos columnas de voz (`nombre_familia` de D-387 nace bilingüe o hereda esta deuda). **Disparo: el riel de catálogos bilingües, o el primer usuario en.** Origen: S60-A3 (pedido founder). **Enmienda S61 (A7): D-387 ya nació BILINGÜE (`nombre_familia_en`, migración `20260714060000`) — la mitad de esta deuda quedó absorbida; queda la voz de oficio (`nombre` de incidencias + registrables). Y la familia gana un caso NUEVO relevado en S61-A1/A5: `prestador_servicios.nombre_custom` es DATO del prestador, NO vocabulario del catálogo — no se traduce por diccionario; cuando el menú custom por groomer exista, necesita su carril propio (mostrar el dato tal cual, con la voz canónica del riel al lado si hace falta).**

#### D-389 — La policy `prestador_own_profile` deja al prestador escribirse TODA la fila
✅ CERRADA (S61-A9, migración `20260714110000` — el disparo SONÓ: las migraciones de domicilio tocaron `prestadores`). Cura: trigger BEFORE UPDATE `_prestadores_protege_columnas` — el editor de a pie (`current_user = 'authenticated' AND NOT is_admin()`) rebota tipado `columna_protegida` al tocar veredicto (`estado`, `aprobado_*`, `motivo_rechazo`), métricas (`calificacion_promedio`, `total_*`) o estructura/plata (`id`, `user_id`, `cuenta_comercial_id`, `country_code`, `created_at` — la cuenta comercial ES el camino de la plata); las funciones SECURITY DEFINER, el service_role y el admin PASAN. Asserts en ambos sentidos con claims reales: descripcion/recargo/extra PASAN (los flujos B2/A6 vivos) · estado/calificacion/aprobado_en/cuenta_comercial_id/total_citas REBOTAN · el camino no-authenticated PASA · L-140 (función del trigger cerrada entera). Nota: `es_seed_preliminar` no existe en `prestadores` (vive en catálogos). Familia D-314. Origen: S60 (hallazgo de relevamiento).

#### D-390 — Higiene: policies duplicadas de escritura propia en `prestadores`
✅ CERRADA (S61-A9, misma migración `20260714110000` que D-389 — jamás suelta, como pedía la letra): `prestadores_own` [UPDATE] MURIÓ; `prestador_own_profile` [ALL] queda como la única escritura propia (verificado: el prestador sigue editando sus columnas libres post-drop). **Hallazgo extra declarado (fuera de letra, no tocado):** `prestadores_insert` [INSERT] duplica a `prestador_insert_self` — misma familia D-342, para la próxima pasada de higiene. Origen: S60 (mismo relevamiento que D-389).

#### D-391 — EDITAR una franja de horario en su lugar
✅ CERRADA (S61-B5 `cf2bb15` — la primera mitad de la cirugía de horarios: nace `editarFranjaHorario` y la franja se edita EN SU LUGAR, tocar → Desde/Hasta → Guardar, sin eliminar+crear; gate 7bis del pase largo S61 sin falla anotada). Origen: S60 (pulgar founder).

### Deudas de Sesión 61 (14 Jul 2026)

#### D-392 — Domicilio v1: el motor no filtraba por modalidad ni cobraba el recargo
✅ CERRADA (S61, mismo día que nació — `b5540ef`, migración `20260714100000`). Historia corta: las columnas del DÓNDE nacieron en la mañana (pedido SQL v2: `atiende_local/atiende_domicilio` en la oferta + `grooming_recargo_domicilio` en `prestadores`, espejo del extra de pelaje) con el motor declarado-no-tocado; la letra founder+arquitecto de la tarde disparó la mitad del dueño y el motor entero: `_grooming_ofertas_cobrables` gana `p_modalidad` (filtro + recargo por el MISMO camino del extra), oferta/inicios/QUIÉN la pasan, la oferta expone las modalidades del agregado, el QUIÉN entrega el DESGLOSE server-side, el congelador suma el recargo ANTES del snapshot y la cita PORTA su modalidad, el pago hereda D-339 verbatim + guard duro `direccion_requerida`. Asserts T1-T9 con ROLLBACK (GEMELA==CONGELADOR con domicilio incluido; paseo intacto). Restos vivos: el traslado del groomer = D-393; el "A dónde ir" del groomer y el espejo del artesano = pedidos a la B declarados.

#### D-393 — El TRASLADO del groomer a domicilio no está modelado
🟢 MEDIA. La ocupación sigue siendo global y CONTIGUA: para el motor es legal un domicilio que termina 10:00 y un local (u otro domicilio en la otra punta de la ciudad) que empieza 10:00 — el tiempo de viaje no existe. v1 lo tolera (un groomer demo, agenda corta); con groomers reales a domicilio, el doble-apuro es cuestión de tiempo. Modelar = buffer de traslado por franja o por cita (letra pendiente). **Disparo: el primer groomer real a domicilio, o el primer doble-apuro reportado.** Origen: S61-A6 (hueco declarado al construir D-392).

#### D-394 — Higiene: la policy puente de fotos grooming en el bucket del paseo
⚪ BAJA. `cita_archivos_select_acceso_mascota_grooming` (migración `20260714090000`) existe SOLO porque el uploader del prestador sube las fotos grooming al bucket del paseo (`cita-archivos`) — el pedido a la B de mover su `BUCKET` a `grooming-archivos` está declarado (S61-A2). Cuando el uploader mude Y no queden objetos grooming en el bucket viejo (migrar o dejar expirar los existentes), la policy puente MUERE y el fallback de bucket del wrapper (`timeline.ts`) se simplifica a una línea. **Disparo: el barrido de la B del bucket + verificación de cero objetos grooming en cita-archivos.** Origen: S61-A2 (hallazgo de raíz del assert T8).

#### D-395 — El MOTION de marca de las bienvenidas (video/animación)
🟢 MEDIA. Las bienvenidas v1 son ESTÁTICAS dignas (letra founder S61: la composición de la propuesta entra traducida a la casa; el movimiento queda como deuda). El momento de marca — huella/isotipo con motion de entrada, o video corto — se diseña con DIRECCION_ARTE §5 (motion de marca, jamás decorativo) y se gatea en dispositivo. **Enmienda A14 — cubre las DOS bienvenidas (cliente S61-A8 y prestador S61-B8.1); gate founder S61: "nos vamos con esta, pero necesita una mano" — motion de entrada + un pase de composición.** **Disparo: la sesión de marca, o pre-soft-launch (intacto).** Origen: S61 (letra de la bienvenida).

#### D-396 — Higiene web: FichaVacuna anida botón en botón (hydration warning)
⚪ BAJA. La galería web loguea `<button> cannot contain a nested <button>` — atribuido por DOM a FichaVacuna (el botón "Esta no es" dentro de la ficha tappeable, S47). Solo-web (hydration warning, nativo no lo sufre), cero efecto visible hoy. Cura: la acción interna deja de ser button anidado (rol/estructura, no visual). **Disparo: la próxima pasada sobre FichaVacuna o el carnet.** Origen: S61-A4 (hallazgo de harness, declarado y no parchado).

#### D-397 — Nota de la familia al prestador para una cita
🟢 MEDIA. Nota de la familia al prestador para una cita (canal §6.4.5, hueco). Vista en el prototipo del founder S61. **Disparo: sesión del canal familia⇄prestador, o pulgar founder.** Origen: S61-B7 (texto listo de la B, asentado por la A en A14).

#### D-398 — El badge "Prestador fundador" como PROGRAMA
🟢 MEDIA. El badge "Prestador fundador" no es un sticker: es un PROGRAMA que necesita su letra — quién lo porta (¿los del grupo curado pre-soft-launch?), qué promete (¿visibilidad, condiciones, permanencia?), cuándo se otorga y si expira. La bienvenida del prestador (S61-B8, grupo curado) es la superficie natural que lo espera. **Disparo: la sesión del programa de fundadores, o antes de abrir a prestadores reales.** **Enmienda cierre S61: el perfil del prestador (B12) porta el badge como pill de vidrio y el TRÍO de hitos reales; la variante RICA de 'hitos de preparación' pide su letra — va junto a esta sesión y a D-370.** Origen: S61-B8 (asentado por la A en A14).

#### D-399 — El WhatsApp del founder como canal de solicitud de acceso
🟡 ALTA. **Texto listo de la B (S61-B13 `cbe356f`, verbatim):** "El canal de solicitud de prestadores es el WhatsApp personal del founder (decisión founder S61, correcta para el grupo curado F1 — el test §3.5 aplica al dueño operando, no a la curaduría manual). Disparo de retiro: el flujo de solicitud real, post-F1." Construido en B13: CTA wa.me con mensaje pre-escrito por locale + camino triste con el número seleccionable; la constante vive en UN lugar (lib/contacto.ts) — al retirarse muere en un solo punto. *(Enmienda A14-bis: el texto compuesto provisorio se reemplazó por el canónico cuando `cbe356f` llegó a git.)* Origen: S61-B13.

#### D-400 — GATE DIFERIDO de la escalera del precio con >1 prestador REAL
🟢 MEDIA. La variante 'desde +$X' del chip de domicilio y los agregados que varían quedaron probados por assert (T2 in-txn, `8445eb8`) pero NO vistos por el founder en dispositivo — con un solo prestador todo pinta exacto. **Disparo: el segundo prestador real con oferta activa (o el segundo seed persistido si el founder quiere verlo antes).** El gate: chip 'desde', cards del QUIÉN con precios distintos, checkout exacto del elegido. Origen: S61 (founder, literal — A14).

#### D-401 — MICRO-INTERACCIONES de toque (el pressed parejo)
🟡 ALTA. El efecto de clic/pressed en botones, links y donde merezca — hoy varios tocables no responden al dedo: el pressed físico existe en Boton (0.97) y Tarjeta (0.99) pero NO es parejo en toda la casa (Pressables artesanales de pantalla, celdas, chips de acción). Sesión propia con la skill de motion en la mano (Ley 6: <300ms, spring SOLO como confirmación física; el CRITERIO de emil-design-eng + el CÓDIGO de Software Mansion). **Disparo: S62 o la sesión de marca — lo que llegue primero.** Origen: founder S61 (A14 addendum).

#### D-402 — LOS TABS RESETEAN A SU RAÍZ
🟡 ALTA. Tocar un tab del menú lleva SIEMPRE al directorio raíz de ese tab — hoy, estando en una cita, tocar Home puede dejar pegada una pantalla interna del stack (p.ej. ver mascota). Es config de expo-router sobre BarraTabs (popToTop al re-tocar/cambiar de tab) — **relevamiento primero: catalogar en qué tabs pasa, en AMBAS apps.** **Disparo: S62, temprano — toca la confianza de navegación diaria.** Origen: founder S61 (bug de navegación percibido; A14 addendum).

#### D-403 — Paridad del bucket grooming-archivos
⚪ BAJA. El bucket propio del grooming (S61-B4) quedó sin la paridad completa del bucket del paseo: falta la policy UPDATE espejo y la decisión de MIME permitidos. No urgente (los uploaders ya escriben ahí y el dueño firma por la policy de A2). **Disparo: la próxima pasada de storage, o el primer caso que la pida.** Origen: cierre S61-B (asentado por la A).

#### D-404 — Candidatos a promoción a packages/ui (patrones del techo del oficio)
🟢 MEDIA. TechoOficio, ToggleTecho y FiltroOficio nacieron LOCALES en apps/prestador (S61-B12/B5 — legal: primera superficie). Cuando el patrón se repita en una segunda superficie, promueven a `packages/ui` con el método completo (Ley 11) — jamás se clonan. **Disparo: la segunda superficie que pida cualquiera de los tres.** Origen: cierre S61-B (asentado por la A).

### Deudas de Sesión 62 (15 Jul 2026)

#### D-405 — LA SESIÓN DE LEGALES: políticas, términos y páginas estáticas del ecosistema

🔴 ALTA. El ecosistema opera sin su capa legal de cara al usuario — y
parte de ella es requisito de tiendas (§3.5 compuerta de salida), otra
parte es bloqueante de prestadores reales. Sesión dedicada
founder+arquitecto (la letra de producto) + abogado ecuatoriano (el
marco de responsabilidad). Inventario:

1. **Términos y Condiciones de la plataforma** — el instrumento legal
   real del marketplace (dueño ↔ prestador ↔ plataforma).
2. **P20 — Custodia y responsabilidad durante el servicio**
   (transversal): asignación de responsabilidad del prestador desde
   entrega hasta retorno · protocolo de incidente con notificación
   INMEDIATA a la familia (esto es producto y se construye) ·
   autorización de emergencia veterinaria con techo de gasto ·
   check-in/check-out con foto donde no hay track (recogida) · seguro
   declarado y diferido. **Hueco declarado S62: rige TAMBIÉN al paseo
   — P1-P19 no asignan responsabilidad civil de custodia.** Bloqueante
   de abrir a prestadores reales, junto a §10.3 (la conversación con
   el groomer/adiestrador real). Precondición §10.2 de
   MODELO_ADIESTRAMIENTO v1.0.
3. **Manejo de datos / política de privacidad** — requisito de tiendas
   (URL obligatoria) + P5 menores + la bitácora de la familia como
   dato conductual nuevo.
4. **Aviso de uso de IA** — el Coach, extract-vacuna (Sonnet), y todo
   agente futuro: qué hace la IA, con qué datos, y su voz honesta.
5. **Páginas ESTÁTICAS** que sirvan todo lo anterior (web pública,
   linkeables desde las apps y las fichas de tienda) — infra propia,
   fuera del monorepo de apps o dentro, decisión de la sesión.

**Puerta que abre (nota founder S62):** la letra de custodia + la
evidencia que la plataforma ya genera (track GPS, EN VIVO, registro de
incidencias, expediente, grupo curado de prestadores) es el material
de NEGOCIACIÓN CON ASEGURADORAS — y "seguros" ya vive como
"próximamente honesto" en DEFINICION_SOFTLAUNCH §2: la negociación
convierte esa promesa en producto. Disparo comercial: post-P20, tarea
del founder.

**Disparo: sesión dedicada pre-soft-launch — antes de la compuerta de
tiendas (§3.5) y antes de prestadores reales (la pata P20).** Origen:
S62 (founder, sobre el hallazgo del hueco de custodia al escribir
MODELO_ADIESTRAMIENTO).

---

## Lecciones del monorepo (L-NNN — continúa la numeración del repo prestadores, congelado en L-130)

- **L-131** — La verificación de accesibilidad es programática o no existe: v3.1 shippeó memorial con texto cream sobre fondo cream (1.00:1) sin que nadie lo viera — los temas de baja frecuencia jamás se auditan a ojo. Origen: S43-B2.
- **L-132** — El gate físico audita también los reportes: "cableado" no es "funciona" — el back de Android de la Hoja estaba correctamente cableado según el código y muerto en el dispositivo (predictive back). Origen: S43-B3.8/B4.
- **L-133** — El acceso prestador→mascota se otorga por trigger AFTER UPDATE OF estado — solo en la TRANSICIÓN a confirmada. INSERTs que nacen confirmada NO otorgan acceso (walk-in futuro, seeds, imports). Detectado en B4.0 por test RLS como authenticated. Si un flujo directo-confirmada llega a existir, el trigger necesita su par AFTER INSERT. Origen: S44-B4.0.
- **L-134** — Módulo nativo nuevo = dev build nueva. El túnel actualiza JS; lo nativo viaja en el APK. Checklist antes de cada gate en dev build: ¿se instaló algún paquete nativo después de la última build? Detectado en S44: build lanzada en B3, expo-location entró en B4.3 ("Cannot find native module ExpoLocation"). Origen: S44-B4.3.
- **L-135** — La verificación va en batch SEPARADO del write: un `RAISE EXCEPTION` de verificación en el mismo batch del CLI rollbackea también el INSERT que quería verificar (todo el string es una transacción). El patch del seed S45 se "aplicó" dos veces sin persistir hasta separar write y verificación en llamadas distintas. Corolario del espíritu L-063: la verificación posterior ES el test — y tiene que sobrevivir al test. Origen: S45-B5.3 (patch seed).
- **L-136** — Preservar los logs ANTES de limpiar buffers: `logcat -c` para "empezar limpio" barrió la evidencia literal de la repro del founder (BUG 1 de S45) y obligó a reconstruir la causa por forense de DB + re-reproducción sintética. Antes de cualquier `-c`/clear/restart sobre un buffer compartido: volcar (`logcat -d > archivo`) lo que haya. Origen: S45-bugs.
- **L-130 (enmienda S45)** — Distinguir keys de SERVER de keys de CLIENTE Android al aplicar L-130 ("secretos jamás por chat/repo"): la key de Google Maps viaja INEVITABLEMENTE dentro del APK — su protección real no es el secreto sino las RESTRICCIONES (package name + SHA-1 por app en Google Cloud; por eso dos proyectos EAS = dos entries de restricción, prestador y cliente). El manejo por env secret de EAS sigue siendo correcto (higiene de repo), pero rotar una key de cliente sin actualizar restricciones y rebuild no protege nada. Origen: S45-B0/B5.4.
- **L-137** — En Expo Go + monorepo con slug `@scope/app`, los uri de picker/manipulator traen `%` LITERALES (el directorio del proyecto se llama `%40scope%2Fapp`) que TODA API de FS de Expo decodifica (File nueva Y legacy) → path fantasma → "Missing 'READ' permission"/"isn't readable". Leer esos archivos exige re-encodear (`%`→`%25`, no-op en dev build). Corolario que muerde dos veces: **el gate en dev build no cubre Expo Go ni viceversa — son DOS entornos de filesystem distintos** (S44 gateó evidencia en dev build y el bug durmió; despertó en el primer gate Expo Go de cliente). Y el catch mudo lo escondió: todo fallback silencioso loggea su literal. Origen: S45 bug foto (fix 95e34c4, verificado con foto real de 12MP → 62KB post-resize).
- **L-137 (segunda enmienda, S47 — gate B3 del carnet):** la cura clásica (`%`→`%25`) NO es idempotente, y el picker de GALERÍA puede entregar el uri en la forma PRE-CODIFICADA (`%2540…%252F…`): sobre esa forma, curarla la sobre-codifica y fabrica exactamente el path fantasma que quería evitar — `Missing 'READ' permission` CON la cura puesta, en bundle nuevo (hipótesis (d) del diagnóstico, sentenciada por camino: cámara+manipulator entregan la forma literal, galería la pre-codificada). Consecuencia estructural: la cura dejó de ser un parche por caller — vive en la FRONTERA ÚNICA `apps/cliente/src/lib/leer-archivo.ts` con reintento DUAL-FORMA (curada primero, cruda después) y forense permanente en el log (`[leer-archivo] leyó forma …`); ningún consumidor vuelve a tocar `new File()` directo, así que no se puede saltear. Verificado E2E en el gate parcial S47 (galería en Expo Go, flujo carnet completo). Origen: S47-B1.2 gate B3.
- **L-137 (tercera enmienda, S61 — cura de la foto B10):** la frontera dual-forma es de TODAS las apps — el prestador corrió dos sesiones con la cura naive por-caller; toda app nueva nace leyendo archivos por la frontera compartida (`packages/ui`, `leerBytes`/`leerBase64`), jamás con cura local. (Texto de la B, S61-B10 `f22c250`; asentado por la A en A14.)
- **L-138 (enmendada S47 tras el re-gate fallido)** — El gate en dispositivo empieza confirmando el bundle, y el mecanismo es el MARCADOR: `console.log('[bundle] cliente S47')` a nivel módulo en `_layout.tsx`, cuyo texto se actualiza al arrancar cada sesión — **sin la línea de la sesión vigente en Metro, no se gatea**. `--clear` solo limpia la caché del SERVIDOR Metro: Expo Go puede seguir sirviendo su copia cacheada del JS (entrada de recents apuntando a un túnel viejo — la URL exp:// cambia por sesión) y el forense del re-gate S47 lo probó ejecutando código que no existía en NINGÚN commit (working tree efímero de S45-bugs). Cura del lado del teléfono: matar todos los Metro, borrar el proyecto de recents/caché de Expo Go, abrir SOLO la URL del Metro vivo. Un gate sobre bundle viejo no verifica nada y puede escribir datos con formato viejo (el CHECK `mascotas_foto_url_es_path`, migración `20260708233000`, hace ese formato imposible). Origen: S47 gate 1 fallido dos veces.
- **L-138 (segunda enmienda, S49 — gate 3.1 de la APK):** el principio se extiende de Metro a los BINARIOS: **el gate de una APK empieza confirmando el binario instalado** (`adb shell dumpsys package <pkg>` → `lastUpdateTime` + tamaño del base.apk), no solo el bundle de Metro. Caso: la APK preview de S48 (119MB, bundle embebido sano) "clavada en splash azul" — el forense mostró que lo instalado era la **dev build de S45** (251MB, `lastUpdateTime` del día anterior, CERO `index.android.bundle`): la instalación desde el link nunca se completó, y una dev build sin Metro no tiene JS que cargar. Se quemaron dos horas de hipótesis (updates/env/routing) contra una build que estaba perfecta. Cura del gate: instalar por cable (`adb install -r`) cuando el link falle, y confirmar el marcador `[bundle] cliente <sesión>` en `adb logcat` ANTES de diagnosticar nada. Origen: S49 gate 3.1.
- **L-138 (tercera enmienda, S51 — el blanco 100% del prestador):** dos síntomas nuevos catalogados. (1) **Dev build sin Metro = blanco 100% post-splash**: `DevLauncherActivity` espera `ws://localhost:8081` y falla EN SILENCIO (logcat: `ReconnectingWebSocket … will silently retry`) — no hay crash que diagnosticar; el forense empieza por `dumpsys package` (¿QUÉ binario está instalado?) y el logcat de un arranque en frío. (2) **Metro sirve por default a la development build**: la tecla `s`/el QR abren la dev build, no Expo Go — un gate "en Expo Go" puede estar corriendo en otro runtime sin que nadie lo note. Protocolo de gate del prestador desde S51: confirmar en la terminal Metro las TRES líneas — `Android Bundled …` + `[bundle] prestador <sesión>` + **`[sesion] raíz prestador: ok`** (el forense permanente del guard raíz) — ANTES de evaluar nada en pantalla. Corolario L-136 aplicado: volcar el log de Metro ANTES de reiniciarlo (un `>` truncó la evidencia de una ventana de gate en S51). Origen: S51 (diagnóstico del blanco 100% + gate por túnel propio del founder en 8084 que el log de 8081 no podía ver).
- **L-139** — En extracción por IA, "verosímil pero falso" es PEOR que null: la revisión humana no atrapa lo que no se VE mal. El gate 4 de S48 lo probó — el modelo tomaba fechas impresas de los stickers (lote/vencimiento) como fecha de aplicación, y como eran fechas plausibles, la revisión del founder las dejó pasar al expediente. Toda extracción del producto prefiere null honesto ante la duda; **la plausibilidad no es evidencia**. Fue techo de MODELO, no de prompt: dos iteraciones de reglas de atribución sobre Haiku 4.5 no lo movieron (v18 idéntica a v17; v19 fabricó años); lo curó Sonnet (v21) + las reglas de atribución — y la regla explícita extra (v22) volvió a EMPEORAR el output, así que el residuo fino lo cubre la red de revisión, no más prompt. Origen: S48 gate 4 con carnet físico real (B6.2/B7.1). 
- **L-140** — **Toda función nueva nace con EXECUTE para anon (default privileges de Supabase).** Al crear las 3 RPCs del hold en S54-B1 (`obtener_slots_disponibles`, `crear_bloqueo_agenda`, `confirmar_cita_pagada`), los default privileges del proyecto les otorgaron EXECUTE a `anon` automáticamente — a pesar del `REVOKE ALL … FROM PUBLIC; GRANT … TO authenticated, service_role` explícito de la migración: **`REVOKE FROM PUBLIC` no toca el grant explícito a `anon`** que el default privilege ya insertó en el `proacl`. Se detectó en la verificación estructural post-migración (`pg_proc.proacl` mostró `anon=X`) y se curó con la migración correctiva `20260710213000_s54_b2b_revoke_anon_rpcs.sql`. Las RPCs tenían gate `auth_required` en el body (defensa en profundidad), pero el privilegio sobrante viola el patrón canónico. Regla operativa: **toda migración que cree una función termina con `REVOKE EXECUTE … FROM PUBLIC, anon` + el GRANT mínimo necesario, y la verificación estructural del gate incluye `pg_proc.proacl` de cada función nueva** — el CREATE solo no alcanza, y el REVOKE genérico tampoco. Cura de raíz APLICADA (gate founder S54) en DOS migraciones, porque la primera sonda destapó una segunda capa: (1) `20260710220000` — `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;` quitó el grant explícito a anon de la entrada por-schema… pero la sonda (`CREATE FUNCTION` + `has_function_privilege('anon',…)` en DO auto-rollback) probó que **anon seguía ejecutando por la puerta de PUBLIC**: el default hard-wired de Postgres (`=X`, toda función nace ejecutable por PUBLIC) se UNE a la entrada por-schema y esta no puede restarlo — las funciones viejas no lo exhibían solo porque cada migración hacía su `REVOKE FROM PUBLIC` explícito por función. (2) `20260710221500` — `ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;` (entrada GLOBAL, reemplaza el built-in). Estado final probado con sonda: función recién nacida = `anon:false · authenticated:true · service_role:true`, acl `{postgres, authenticated, service_role}`; las públicas pre-login existentes (`get_paises_activos` y familia) intactas (default privileges solo rigen objetos futuros). Corolario de método: **la cura de un default se prueba con una SONDA que crea el objeto y pregunta `has_function_privilege`, no leyendo `pg_default_acl`** — la primera migración se veía perfecta en el catálogo y estaba incompleta en la realidad. Origen: S54-B1 (verificación estructural del gate B2b) + sonda S54.
- **L-141** — **Las letras se escriben contra la realidad RELEVADA, jamás contra la memoria del arquitecto.** La P17 v1.0 sacó Mascotas de la barra del prestador porque el arquitecto redactó "tres tabs" de memoria — la decisión real era UNA (separar Cuenta de Negocio) y la barra existente tenía a Mascotas legítima. Costó una construcción de la B (`09f7d73`), un gate del founder que la detectó, una corrección de letra con firma (v1.1) y una re-construcción (`4676158`). Toda letra que describe estado existente (una barra, un schema, un flujo) se contrasta contra el repo/la DB ANTES de firmarse — la regla 19 ("DB es fuente de verdad sobre memoria") aplica también a la prosa. Origen: S57 (caso barra Mascotas/P17).
- **L-142** — **La norma del corchete: texto anunciado como pegado se VERIFICA pegado.** Dos casos S57 la canonizaron: el corchete vacío de la letra P17 (el arquitecto anunció "texto completo al pie" y no viajó — el freno 76b de la A fue correcto y ratificado) y el precedente S55 del pedido de `prestador_bloqueos` que nunca llegó. Regla operativa: quien ENVÍA verifica que el literal esté en el mensaje antes de mandarlo; quien RECIBE un anuncio sin literal FRENA y lo pide — SALVO que el contrato entero ya viva en otro canal canónico (doc versionado, migración commiteada), declarándolo explícito. Origen: S57.
- **L-143** — **Las leyes de composición se firman sobre PÍXELES, no sobre prosa.** La prosa de diseño se interpreta distinto por cada constructor; una pantalla patrón firmada se COPIA. Mecanismo inaugurado en S57 con el boceto del Hogar (aprobado en esencia en primera ronda): arquitecto boceta aplicando las leyes → crítica founder → firma sobre el boceto → entra a la skill como referencia visual → el gate compara contra la patrón (la vara deja de ser adjetivo). Primera pantalla patrón: el Hogar del cliente. Origen: S57 (capa de craft).
- **L-144** — **Relevamiento antes de curar: la falla percibida no dicta la cirugía.** El founder reportó "el paquete nació agendado" — el relevamiento probó que la DB estaba SANA (comprar insertaba solo en bonos; cero citas) y la falla era del FLUJO de UI (exigía fecha/hora para comprar). Sin el relevamiento previo exigido por el arquitecto, la cura habría operado una base sana y dejado el flujo enfermo. Es la regla 48 del contrato elevada a método entre sesiones: toda tanda de fallas de gate ARRANCA con relevamiento literal reportado, y recién después cura. Origen: S57 (tanda de fallas del gate del paquete).

---
