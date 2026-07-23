# S74-A · T2 — CENSO D-495: las vías de `anon` hacia `user_tiene_acceso_a_mascota`

> **Censo puro: CERO REVOKE ejecutado.** El REVOKE se decide en mesa con
> esta tabla a la vista — el riesgo censado: una policy cuyo `qual` llama
> a una función que anon no puede ejecutar convierte consultas que hoy
> devuelven VACÍO en consultas que FALLAN (42501 en tiempo de query).
> Fuente: DB viva `zyltipqscdsdsxnjclhp`, 22-jul-2026, solo lectura.

## 1 · Los proacl (literal)

| Función | proacl | Estado |
|---|---|---|
| `user_tiene_acceso_a_mascota(uuid)` | `{=X/postgres, postgres=X, anon=X, authenticated=X, service_role=X}` | **PUBLIC y anon con EXECUTE — la deuda** |
| `user_acceso_clinico_a_mascota(uuid)` (S73) | `{postgres=X, authenticated=X, service_role=X}` | limpio — nació bajo L-140 |
| `user_puede_acceder_prestador(uuid)` | mismo proacl enfermo (anon + PUBLIC) | **misma enfermedad — de regalo a la mesa** |
| `is_admin()` | mismo proacl enfermo | **ídem** |

## 2 · El contexto que decide la alcanzabilidad

`anon` tiene **TODOS los privilegios de tabla** (grants default de Supabase)
sobre las 43 relaciones del censo, con RLS activa en todas. Conclusión de
método: el filtro real NO son los grants — son los `roles` de cada policy.

## 3 · El censo: 66 policies citan el helper

- **62 policies con `roles={authenticated}`** → **NO alcanzables por anon**
  (jamás se evalúan para él; el REVOKE no puede romper nada por esas vías).
  Tablas: las 30 tipadas `evento_*` clínicas/grooming/adiestramiento,
  `eventos_mascota*`, `mascotas`, `grooming_talla_discrepancias`,
  `paseo_social_negativas`, `restricciones_mascota_activas`,
  `cita_telemedicina_detalle` y las 5 de `storage.objects`.
- **4 policies con `roles={public}` → SÍ alcanzables por anon** (herencia
  S44, pre-estándar):

| Tabla | Policy | cmd | Efecto de un REVOKE del helper |
|---|---|---|---|
| `eventos_mascota_paseo` | `paseo_select` | SELECT | **vacío → ERROR 42501** |
| `eventos_mascota_paseo` | `paseo_insert` | INSERT | rebota hoy (RLS false) → rebotaría con 42501 de función; cambia el código de error, no el comportamiento |
| `evento_paseo_novedades` | `paseo_nov_select` | SELECT | **vacío → ERROR 42501** |
| `evento_paseo_novedades` | `paseo_nov_insert` | INSERT | ídem paseo_insert |

Verificado con el listado COMPLETO de policies de esas 2 tablas: TODAS son
`{public}` (incl. UPDATE/DELETE, que citan a `user_puede_acceder_prestador`
/ `is_admin`) y la única SELECT de cada una es la que llama al helper — no
hay policy permisiva alternativa: el error post-REVOKE sería inevitable en
esa vía.

- **Views:** las 4 `security_invoker=true` tienen cero grants para anon →
  no son vía. Las 14 owner-rights con grant a anon bypassean RLS y jamás
  invocan el helper → el REVOKE no las toca.

## 4 · Resumen para la mesa

1. **Vías reales de anon hacia el helper hoy: 4** (las policies `{public}`
   de las dos tablas de paseo). Ninguna app usa anon contra esas tablas
   (los wrappers van autenticados), pero la regresión semántica
   vacío→error existe.
2. **Camino limpio propuesto (decisión de mesa):** en la MISMA migración,
   recrear las policies de `eventos_mascota_paseo` y
   `evento_paseo_novedades` con `TO authenticated` (nunca debieron ser
   `{public}`) y recién entonces el REVOKE del helper — cero vías, cero
   cambio observable. Si además se corrige el proacl de
   `user_puede_acceder_prestador` e `is_admin` en el mismo movimiento,
   los tres helpers quedan bajo L-140 de una vez.

## 5 · 🔴 HALLAZGO LATERAL GRAVE (fuera del alcance de D-495 — candidata a
## deuda propia; el número lo asigna la mesa, B puede estar numerando)

**`v_recurrentes_pendientes` es una view owner-rights (bypassea RLS) con
SELECT para anon que expone `kushki_token` y emails.** Un cliente anónimo
con la anon key puede leerla. Misma clase (sin secretos de pago):
`v_metricas_tiempo_real` y `v_pitch_metrics` exponen agregados sobre
tablas protegidas. Se registra SIN curar (regla de esta tanda: censo, cero
cambios; y la semántica ajena se releva, no se opera de pasada — L-150).
**Merece fila 🔴 y cura corta** (REVOKE de anon sobre la view o
security_invoker), decisión de mesa. *(Post-mesa: es **D-501**.)*

## 6 · ADDENDUM S74-A — el cinturón corrigió este censo (L-158 sobre el censo mismo)

La afirmación del §4 *"user_puede_acceder_prestador e is_admin comparten …
las mismas 4 policies como única vía anon"* era **verosímil-falso para
`is_admin`**: el cinturón de la migración `20260722200000` (primer intento,
ABORT con rollback limpio — nada aplicado) atrapó **10 policies más**
alcanzables por anon que lo citan: 5 admin legacy `{public}`
(`solicitudes_adopcion/admins_read_all_solicitudes` ·
`mascotas_adopcion/admins_read_all_mascotas_adopcion` ·
`productos/admins_manage_productos` · `profiles/admins_read_all_profiles` ·
`pedidos/admins_update_pedidos`) + 2 de `storage.objects`
(`productos-fotos: upload/delete admin`) + **las 3 `caso_*_select` de las
tipadas de caso** (también `{public}` — y su qual llama al helper clínico
S73 que anon NO puede ejecutar: **un SELECT anónimo ahí ya daría 42501
HOY**, bug latente registrado sin curar). Verificado por-helper: las 10
citan SOLO `is_admin`.

**Lo ejecutado (migración `20260722200000`, aplicada con juez verde):** las
8 policies de paseo → `TO authenticated` + REVOKE anon/PUBLIC de
`user_tiene_acceso_a_mascota` y `user_puede_acceder_prestador` (cinturón
por-helper en 0, sonda L-140 verde, anon = vacío sin error, el dueño real
sigue viendo lo suyo — asserts in-txn). **`is_admin` NO se revocó** —
candidata a deuda propia (censo de lectores admin/legado + las 3 de caso;
número en mesa — *post-mesa: son D-503 y D-504*). Lección operativa: **el
cinturón in-migración es la vara del censo** — un censo sin assert que lo
pruebe es una tabla de hallazgos más.

## 7 · MÉTODO, REVISADO (pedido de mesa S74: un censo que subcontó dos veces)

Las dos subcuentas de esta tanda comparten UNA causa: **el censo se scopeó
por HELPER (grep de un nombre en los quals) cuando la decisión era por
SUPERFICIE** (todas las policies de las tablas afectadas × todos los
helpers del paquete de cura).

1. **4 vías vs 8 policies:** la tabla del §3 respondía "¿qué policies
   citan a `user_tiene_acceso_a_mascota`?" — correcta para SU pregunta
   (4 vías) — pero la cura tocó 8 porque el paquete incluía revocar
   `user_puede_acceder_prestador` (paseo_update/_nov_update lo citan) y
   la higiene de la superficie completa (paseo_delete/_nov_delete, que
   citan `is_admin`). El §4 los nombraba EN PARÉNTESIS y la tabla no los
   elevó — lo que no está en la tabla no existe para quien decide.
2. **La extrapolación a `is_admin`** ("misma única vía") se afirmó sin
   correr SU grep — el cinturón halló 10 policies más.

**La regla que queda:** un censo de seguridad (a) se corta por SUPERFICIE
completa, (b) eleva a la tabla TODO lo que la cura va a tocar — cero
paréntesis, y (c) su verdad final la firma un ASSERT ejecutable (el
cinturón in-migración), jamás la tabla sola. Es L-156 aplicada a los
censos: lo que un assert puede atrapar no se confía a la prosa.
