-- ═══════════════════════════════════════════════════════════════════════════
-- REVERSA de `20260820080000_s100d_lote_cuatro_vistas_security_invoker.sql`
-- Escrita ANTES de aplicar la migración (regla de la casa).
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 🔴 QUÉ DESHACE Y QUÉ **NO**:
--
-- DESHACE: devuelve las cuatro vistas a ejecutarse con los privilegios de su
-- DUEÑO (`postgres`), o sea **saltando la RLS** de las tablas de abajo — y con
-- `anon` teniendo `SELECT` sobre ellas.
--
-- ⚠️ **REVERTIR ESTO REABRE CUATRO PUERTAS A INTERNET.** La más cara es
-- `v_resenas_todas`: expone `user_id`, `autor_nombre`, `comentario` y
-- **`es_visible`** — o sea **reseñas marcadas como NO visibles**. Le siguen
-- `v_daas_eligible_users` (`user_id` y su consentimiento DaaS) y
-- `v_conversion_funnel` (registros, carritos y checkouts por día).
--
-- ⚠️ Y EL ARGUMENTO QUE **NO** SIRVE PARA REVERTIR: *«total, hoy devuelven cero
-- filas»*. **Devuelven cero porque están vacías, no porque estén cerradas** —
-- se pueblan solas con la primera venta y la primera reseña reales. *Un cero de
-- hoy no es un control.* Ésa es justamente la razón por la que se cerraron
-- ahora y no después.
--
-- ⇒ Si algún consumidor aparece y se rompe, la salida correcta es darle un
-- camino autenticado o un lector propio con su gate — jamás volver a abrirle la
-- puerta a todo internet. **Y el censo dice que consumidor no hay:** cero
-- lectores en los SIETE repos (`e-petplace-admin`, `-prestadores`, `-v2`, `-B`,
-- `-C`, `-sistema-pruebas`, monorepo), excluyendo `node_modules`, `dist/` y
-- tipos generados. En el caso de `v_resenas_todas` son **dos censos
-- independientes con el mismo cero**: S95 y S100d.
--
-- NO DESHACE: nada de datos. La migración no toca ni una fila.

ALTER VIEW public.v_conversion_funnel     SET (security_invoker = false);
ALTER VIEW public.v_resenas_todas         SET (security_invoker = false);
ALTER VIEW public.v_daas_eligible_users   SET (security_invoker = false);
ALTER VIEW public.v_criaderos_publicos    SET (security_invoker = false);
