-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — LAS VISTAS DEJAN DE CORRER COMO SU DUEÑO
--
-- 🔴 EL ROJO, producido antes de curar, como `anon` y con la llave que viaja en
-- el bundle de las dos apps:
--     v_pitch_metrics            1 fila   ← el tablero de inversores ENTERO
--     v_mrr                      1 fila
--     v_crecimiento_usuarios     6 filas
--     v_metricas_tiempo_real     1 fila
--     v_ia_costo_por_pieza_dia   9 filas
--     v_gmv_mensual              0 filas  (vacía hoy, abierta igual)
-- `v_pitch_metrics` devolvía `usuarios_registrados_total`, `mrr`, `gmv` y las
-- mascotas registradas. *No es un dato interno que se filtra: es el número que
-- se dice en una reunión con inversores, servido a cualquiera que abra el
-- bundle y copie la llave.*
--
-- ⚠️ **UNA ES MÍA Y DE HOY.** `v_ia_costo_por_pieza_dia` la creé esta tarde sin
-- `security_invoker` y sin revocar `anon` — o sea que **el costo de IA de la
-- casa quedó público durante unas horas por mi mano.** Se dice acá y no en un
-- pie de página.
--
-- ── EL CENSO CORRIGE EL NÚMERO DEL ENCARGO ──────────────────────────────────
-- El pedido hablaba de **cinco** vistas. Medido en `pg_class.reloptions`: son
-- **ONCE sin `security_invoker`**, y **SEIS** las lee `anon`. *Un censo por
-- `pg_class` y no por la lista que alguien recuerda.*
--
-- ── POR QUÉ ESTO SOLO YA CIERRA LA FUGA ─────────────────────────────────────
-- Sin `security_invoker`, una vista corre con los permisos de **quien la creó**
-- —`postgres`— y por eso atraviesa la RLS de todas sus tablas. Con `invoker`,
-- corre como quien la consulta: `anon` choca contra la RLS de `profiles`,
-- `mascotas` y las demás, y no ve nada. **El GRANT deja de importar.**
--
-- 🔴 EL `REVOKE` A `anon` NO SE HACE ACÁ, Y ES UNA DECISIÓN DECLARADA, NO UN
-- OLVIDO. El encargo dice que esas vistas «son de admin» — pero **S95-F midió
-- que el portal legado se conecta con la llave `anon` sobre esta misma base**
-- (claim `role` decodificado). Las dos cosas no pueden ser ciertas a la vez.
-- *Revocar sin resolver esa contradicción apagaría un tablero que no puedo
-- probar desde acá, y la fuga ya está cerrada por el `invoker`.* La otra mitad
-- necesita medir el panel, que vive fuera de este repo.
--
-- ⚠️ `v_adoptables_publicos` también se voltea, y se midió que es seguro: sus
-- tres consumidores (`obtener_adoptables` y hermanas) son `SECURITY DEFINER`, y
-- adentro de una DEFINER el usuario efectivo es el definidor — la vista sigue
-- viendo lo mismo. *Se midió en vez de dejarla afuera por las dudas.*
--
-- 76(g) — VEDA: NO RIGE. `ALTER VIEW … SET`, cero datos tocados.
-- ═══════════════════════════════════════════════════════════════════════════
begin;
alter view public.v_crecimiento_usuarios          set (security_invoker = on);
alter view public.v_gmv_mensual                   set (security_invoker = on);
alter view public.v_ia_costo_por_pieza_dia        set (security_invoker = on);
alter view public.v_metricas_tiempo_real          set (security_invoker = on);
alter view public.v_mrr                           set (security_invoker = on);
alter view public.v_pitch_metrics                 set (security_invoker = on);
alter view public.v_adoptables_publicos           set (security_invoker = on);
alter view public.v_inventario_reservas_vigentes  set (security_invoker = on);
alter view public.v_ranking_usuarios              set (security_invoker = on);
alter view public.v_storage_borrado_atascado      set (security_invoker = on);
alter view public.v_urls_legales_caidas           set (security_invoker = on);
commit;
