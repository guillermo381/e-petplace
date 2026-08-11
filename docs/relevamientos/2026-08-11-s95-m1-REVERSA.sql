-- ═══════════════════════════════════════════════════════════════════
-- REVERSA DE LA MIGRACIÓN 1 · S95-C — limpieza del comercio de legado
--   supabase/migrations/20260811120000_s95_m1_limpieza_comercio.sql
--
-- 🔴 LO QUE ESTA REVERSA PUEDE Y LO QUE NO — se dice antes de la primera línea:
--
--   ✅ PUEDE devolver la ESTRUCTURA: las 14 tablas, sus constraints, sus
--      índices, sus policies, las 2 vistas y las 12 columnas `vtex_*`.
--   ✅ PUEDE devolver el estado de permisos de `pedidos` anterior a D-757.
--
--   ❌ NO PUEDE devolver NINGUNA FILA. Se borran 137 pedidos, 5 envíos,
--      9 eventos de envío, 5 devoluciones, 2 comisiones, 3 liquidaciones,
--      1 regla de asignación y 1 mensaje. **El DDL se puede recrear; las filas
--      no vuelven.**
--
--   ❌ Y la copia de seguridad tampoco alcanza como red: es diaria y COMPLETA
--      (D-742). Recuperar una fila significa volver la base ENTERA a ayer, y
--      con ella todo lo bueno que pasó desde entonces.
--
--   ⇒ Esta reversa sirve para «se rompió una pantalla del portal admin»,
--      JAMÁS para «necesitaba ese dato».
--
-- Autorización del borrado: firma del founder del 11-ago-2026 sobre las quince
-- fichas — «TODO ES DATA DE PRUEBA, nada es real hoy», incluidas las dos
-- liquidaciones que dicen «pagado» y el mensaje a «Luis».
--
-- Este archivo se GENERA, no se escribe a mano:
--   node scripts/s95/generar-ddl-reversa-m1.mjs > <este archivo>
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── PARTE 1 · LAS TABLAS (estructura, sin filas) ──────────────────────

-- ─── seller_inventario ───────────────────────────────────────────────
CREATE TABLE public.seller_inventario (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  stock_disponible integer DEFAULT 0 NOT NULL,
  stock_reservado integer DEFAULT 0 NOT NULL,
  stock_minimo integer DEFAULT 5 NOT NULL,
  precio_seller numeric(10,2),
  costo_seller numeric(10,2),
  ciudad text,
  country_code text DEFAULT 'EC'::text NOT NULL,
  tiempo_despacho_dias integer DEFAULT 1,
  activo boolean DEFAULT true NOT NULL,
  acepta_pedidos boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.seller_inventario ADD CONSTRAINT seller_inventario_stock_disponible_check CHECK ((stock_disponible >= 0));
ALTER TABLE public.seller_inventario ADD CONSTRAINT seller_inventario_stock_reservado_check CHECK ((stock_reservado >= 0));
ALTER TABLE public.seller_inventario ADD CONSTRAINT seller_inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE;
ALTER TABLE public.seller_inventario ADD CONSTRAINT seller_inventario_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.seller_inventario ADD CONSTRAINT seller_inventario_pkey PRIMARY KEY (id);
ALTER TABLE public.seller_inventario ADD CONSTRAINT seller_inventario_seller_id_producto_id_key UNIQUE (seller_id, producto_id);
CREATE INDEX idx_inventario_producto ON public.seller_inventario USING btree (producto_id, activo, stock_disponible);
CREATE INDEX idx_inventario_seller ON public.seller_inventario USING btree (seller_id, activo);
CREATE INDEX idx_inventario_ciudad ON public.seller_inventario USING btree (ciudad, country_code, activo);
ALTER TABLE public.seller_inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventario_admin" ON public.seller_inventario FOR ALL TO authenticated
  USING (is_admin());
CREATE POLICY "inventario_seller_own" ON public.seller_inventario FOR ALL TO authenticated
  USING ((seller_id = auth.uid()))
  WITH CHECK ((seller_id = auth.uid()));

-- ─── seller_comisiones ───────────────────────────────────────────────
CREATE TABLE public.seller_comisiones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  tipo text NOT NULL,
  categoria text,
  producto_id uuid,
  take_rate_pct numeric(5,2) DEFAULT 14.00 NOT NULL,
  es_override boolean DEFAULT false NOT NULL,
  activo boolean DEFAULT true NOT NULL,
  notas text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  country_code character(2)
);
ALTER TABLE public.seller_comisiones ADD CONSTRAINT seller_comisiones_take_rate_pct_check CHECK (((take_rate_pct >= (0)::numeric) AND (take_rate_pct <= (100)::numeric)));
ALTER TABLE public.seller_comisiones ADD CONSTRAINT seller_comisiones_tipo_check CHECK ((tipo = ANY (ARRAY['global'::text, 'categoria'::text, 'producto'::text])));
ALTER TABLE public.seller_comisiones ADD CONSTRAINT seller_comisiones_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.seller_comisiones ADD CONSTRAINT seller_comisiones_pkey PRIMARY KEY (id);
CREATE INDEX idx_comisiones_seller ON public.seller_comisiones USING btree (seller_id, activo);
ALTER TABLE public.seller_comisiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comisiones_admin" ON public.seller_comisiones FOR ALL TO authenticated
  USING (is_admin());

-- ─── seller_documentos ───────────────────────────────────────────────
CREATE TABLE public.seller_documentos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  tipo text NOT NULL,
  nombre text NOT NULL,
  archivo_url text NOT NULL,
  estado text DEFAULT 'pendiente'::text NOT NULL,
  revisado_por uuid,
  revisado_en timestamp with time zone,
  notas text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.seller_documentos ADD CONSTRAINT seller_documentos_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'aprobado'::text, 'rechazado'::text])));
ALTER TABLE public.seller_documentos ADD CONSTRAINT seller_documentos_tipo_check CHECK ((tipo = ANY (ARRAY['cedula'::text, 'ruc'::text, 'cuenta_bancaria'::text, 'permiso_comercial'::text, 'otro'::text])));
ALTER TABLE public.seller_documentos ADD CONSTRAINT seller_documentos_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES profiles(id);
ALTER TABLE public.seller_documentos ADD CONSTRAINT seller_documentos_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES seller_perfil(id) ON DELETE CASCADE;
ALTER TABLE public.seller_documentos ADD CONSTRAINT seller_documentos_pkey PRIMARY KEY (id);
CREATE INDEX idx_seller_docs ON public.seller_documentos USING btree (seller_id, tipo, estado);
ALTER TABLE public.seller_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sd_own" ON public.seller_documentos FOR ALL TO authenticated
  USING (((seller_id IN ( SELECT seller_perfil.id
   FROM seller_perfil
  WHERE (seller_perfil.user_id = auth.uid()))) OR is_admin()));

-- ─── seller_liquidaciones ───────────────────────────────────────────────
CREATE TABLE public.seller_liquidaciones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  numero_liquidacion text DEFAULT ((('LIQ-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || lpad((nextval('liquidacion_seq'::regclass))::text, 3, '0'::text)) NOT NULL,
  seller_id uuid NOT NULL,
  country_code text DEFAULT 'EC'::text NOT NULL,
  periodo_inicio date NOT NULL,
  periodo_fin date NOT NULL,
  gmv_bruto numeric(12,2) DEFAULT 0 NOT NULL,
  take_rate_pct numeric(5,2) DEFAULT 14.00 NOT NULL,
  comision_plataforma numeric(12,2) DEFAULT 0 NOT NULL,
  ajustes numeric(12,2) DEFAULT 0 NOT NULL,
  monto_a_pagar numeric(12,2) DEFAULT 0 NOT NULL,
  estado text DEFAULT 'borrador'::text NOT NULL,
  aprobado_por uuid,
  aprobado_en timestamp with time zone,
  pagado_en timestamp with time zone,
  referencia_transferencia text,
  metodo_pago text,
  pedidos_count integer DEFAULT 0 NOT NULL,
  notas_admin text,
  disputa_motivo text,
  disputa_respuesta text,
  archivo_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.seller_liquidaciones ADD CONSTRAINT periodo_valido CHECK ((periodo_fin >= periodo_inicio));
ALTER TABLE public.seller_liquidaciones ADD CONSTRAINT seller_liquidaciones_estado_check CHECK ((estado = ANY (ARRAY['borrador'::text, 'calculado'::text, 'aprobado'::text, 'pagado'::text, 'disputado'::text])));
ALTER TABLE public.seller_liquidaciones ADD CONSTRAINT seller_liquidaciones_metodo_pago_check CHECK ((metodo_pago = ANY (ARRAY['transferencia_bancaria'::text, 'kushki_payout'::text, 'otro'::text])));
ALTER TABLE public.seller_liquidaciones ADD CONSTRAINT seller_liquidaciones_aprobado_por_fkey FOREIGN KEY (aprobado_por) REFERENCES profiles(id);
ALTER TABLE public.seller_liquidaciones ADD CONSTRAINT seller_liquidaciones_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.seller_liquidaciones ADD CONSTRAINT seller_liquidaciones_pkey PRIMARY KEY (id);
ALTER TABLE public.seller_liquidaciones ADD CONSTRAINT seller_liquidaciones_numero_liquidacion_key UNIQUE (numero_liquidacion);
ALTER TABLE public.seller_liquidaciones ADD CONSTRAINT uq_seller_periodo_no_solapa EXCLUDE USING gist (seller_id WITH =, daterange(periodo_inicio, periodo_fin, '[]'::text) WITH &&) WHERE ((estado <> 'borrador'::text));
CREATE INDEX idx_liquidaciones_seller ON public.seller_liquidaciones USING btree (seller_id, estado, periodo_fin DESC);
CREATE INDEX idx_liquidaciones_estado ON public.seller_liquidaciones USING btree (estado, country_code);
CREATE INDEX idx_liquidaciones_periodo ON public.seller_liquidaciones USING btree (periodo_inicio, periodo_fin);
ALTER TABLE public.seller_liquidaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "liquidaciones_admin" ON public.seller_liquidaciones FOR ALL TO authenticated
  USING (is_admin());
CREATE POLICY "liquidaciones_seller" ON public.seller_liquidaciones FOR SELECT TO authenticated
  USING ((seller_id = auth.uid()));
CREATE POLICY "liquidaciones_seller_disputar" ON public.seller_liquidaciones FOR UPDATE TO authenticated
  USING (((seller_id = auth.uid()) AND (estado = 'aprobado'::text)))
  WITH CHECK (((seller_id = auth.uid()) AND (estado = 'disputado'::text)));

-- ─── liquidacion_pedidos ───────────────────────────────────────────────
CREATE TABLE public.liquidacion_pedidos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  liquidacion_id uuid NOT NULL,
  pedido_id uuid NOT NULL,
  monto_incluido numeric(12,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.liquidacion_pedidos ADD CONSTRAINT liquidacion_pedidos_liquidacion_id_fkey FOREIGN KEY (liquidacion_id) REFERENCES seller_liquidaciones(id) ON DELETE CASCADE;
ALTER TABLE public.liquidacion_pedidos ADD CONSTRAINT liquidacion_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT;
ALTER TABLE public.liquidacion_pedidos ADD CONSTRAINT liquidacion_pedidos_pkey PRIMARY KEY (id);
ALTER TABLE public.liquidacion_pedidos ADD CONSTRAINT liquidacion_pedidos_liquidacion_id_pedido_id_key UNIQUE (liquidacion_id, pedido_id);
CREATE INDEX idx_liq_pedidos_liquidacion ON public.liquidacion_pedidos USING btree (liquidacion_id);
CREATE INDEX idx_liq_pedidos_pedido ON public.liquidacion_pedidos USING btree (pedido_id);
ALTER TABLE public.liquidacion_pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "liquidacion_pedidos_admin" ON public.liquidacion_pedidos FOR ALL TO authenticated
  USING (is_admin());

-- ─── seller_reglas_asignacion ───────────────────────────────────────────────
CREATE TABLE public.seller_reglas_asignacion (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  country_code text DEFAULT 'EC'::text NOT NULL,
  prioridad_1 text DEFAULT 'proximidad'::text NOT NULL,
  prioridad_2 text DEFAULT 'calificacion'::text,
  prioridad_3 text DEFAULT 'stock'::text,
  permitir_split boolean DEFAULT false NOT NULL,
  fallback_accion text DEFAULT 'notificar_admin'::text NOT NULL,
  radio_maximo_km integer DEFAULT 100,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.seller_reglas_asignacion ADD CONSTRAINT seller_reglas_asignacion_fallback_accion_check CHECK ((fallback_accion = ANY (ARRAY['rechazar'::text, 'preorder'::text, 'notificar_admin'::text])));
ALTER TABLE public.seller_reglas_asignacion ADD CONSTRAINT seller_reglas_asignacion_prioridad_1_check CHECK ((prioridad_1 = ANY (ARRAY['proximidad'::text, 'comision'::text, 'stock'::text, 'calificacion'::text, 'tiempo_despacho'::text])));
ALTER TABLE public.seller_reglas_asignacion ADD CONSTRAINT seller_reglas_asignacion_pkey PRIMARY KEY (id);
ALTER TABLE public.seller_reglas_asignacion ADD CONSTRAINT seller_reglas_asignacion_country_code_key UNIQUE (country_code);
ALTER TABLE public.seller_reglas_asignacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reglas_admin" ON public.seller_reglas_asignacion FOR ALL TO authenticated
  USING (is_admin());

-- ─── mensajes_admin_seller ───────────────────────────────────────────────
CREATE TABLE public.mensajes_admin_seller (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  seller_id uuid NOT NULL,
  remitente text NOT NULL,
  remitente_id uuid NOT NULL,
  contenido text NOT NULL,
  leido boolean DEFAULT false NOT NULL,
  leido_en timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.mensajes_admin_seller ADD CONSTRAINT mensajes_admin_seller_contenido_check CHECK ((length(contenido) > 0));
ALTER TABLE public.mensajes_admin_seller ADD CONSTRAINT mensajes_admin_seller_remitente_check CHECK ((remitente = ANY (ARRAY['admin'::text, 'seller'::text])));
ALTER TABLE public.mensajes_admin_seller ADD CONSTRAINT mensajes_admin_seller_remitente_id_fkey FOREIGN KEY (remitente_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.mensajes_admin_seller ADD CONSTRAINT mensajes_admin_seller_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.mensajes_admin_seller ADD CONSTRAINT mensajes_admin_seller_pkey PRIMARY KEY (id);
CREATE INDEX idx_mensajes_seller ON public.mensajes_admin_seller USING btree (seller_id, created_at DESC);
CREATE INDEX idx_mensajes_no_leidos ON public.mensajes_admin_seller USING btree (seller_id, leido) WHERE (leido = false);
ALTER TABLE public.mensajes_admin_seller ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mensajes_admin" ON public.mensajes_admin_seller FOR ALL TO authenticated
  USING (is_admin());
CREATE POLICY "mensajes_seller" ON public.mensajes_admin_seller FOR SELECT TO authenticated
  USING ((seller_id = auth.uid()));
CREATE POLICY "mensajes_seller_insert" ON public.mensajes_admin_seller FOR INSERT TO authenticated
  WITH CHECK (((seller_id = auth.uid()) AND (remitente = 'seller'::text) AND (remitente_id = auth.uid())));

-- ─── pedidos_recurrentes ───────────────────────────────────────────────
CREATE TABLE public.pedidos_recurrentes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  country_code text DEFAULT 'EC'::text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  direccion text,
  ciudad text,
  frecuencia_tipo text NOT NULL,
  frecuencia_dias integer DEFAULT 30 NOT NULL,
  entrega_hora_inicio time without time zone,
  entrega_hora_fin time without time zone,
  proximo_pedido date NOT NULL,
  ultimo_pedido_en timestamp with time zone,
  pedidos_generados integer DEFAULT 0 NOT NULL,
  max_pedidos integer,
  kushki_token text,
  activo boolean DEFAULT true NOT NULL,
  pausado_hasta date,
  motivo_pausa text,
  ultimo_total numeric(10,2),
  ultimo_pedido_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.pedidos_recurrentes ADD CONSTRAINT pedidos_recurrentes_frecuencia_dias_check CHECK (((frecuencia_dias >= 7) AND (frecuencia_dias <= 365)));
ALTER TABLE public.pedidos_recurrentes ADD CONSTRAINT pedidos_recurrentes_frecuencia_tipo_check CHECK ((frecuencia_tipo = ANY (ARRAY['semanal'::text, 'quincenal'::text, 'mensual'::text, 'personalizado'::text])));
ALTER TABLE public.pedidos_recurrentes ADD CONSTRAINT pedidos_recurrentes_ultimo_pedido_id_fkey FOREIGN KEY (ultimo_pedido_id) REFERENCES pedidos(id);
ALTER TABLE public.pedidos_recurrentes ADD CONSTRAINT pedidos_recurrentes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.pedidos_recurrentes ADD CONSTRAINT pedidos_recurrentes_pkey PRIMARY KEY (id);
CREATE INDEX idx_recurrentes_user ON public.pedidos_recurrentes USING btree (user_id, activo);
CREATE INDEX idx_recurrentes_proximo ON public.pedidos_recurrentes USING btree (proximo_pedido, activo) WHERE ((activo = true) AND (pausado_hasta IS NULL));
CREATE INDEX idx_recurrentes_pausado ON public.pedidos_recurrentes USING btree (pausado_hasta) WHERE (pausado_hasta IS NOT NULL);
ALTER TABLE public.pedidos_recurrentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recurrentes_admin" ON public.pedidos_recurrentes FOR ALL TO authenticated
  USING (is_admin());
CREATE POLICY "recurrentes_owner" ON public.pedidos_recurrentes FOR ALL TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

-- ─── wishlist ───────────────────────────────────────────────
CREATE TABLE public.wishlist (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE;
ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);
ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_producto_id_key UNIQUE (user_id, producto_id);
CREATE INDEX idx_wishlist_user ON public.wishlist USING btree (user_id, created_at DESC);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl_own" ON public.wishlist FOR ALL TO authenticated
  USING (((user_id = auth.uid()) OR is_admin()))
  WITH CHECK ((user_id = auth.uid()));

-- ─── lista_espera ───────────────────────────────────────────────
CREATE TABLE public.lista_espera (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  country_code text DEFAULT 'EC'::text NOT NULL,
  tipo text NOT NULL,
  criadero_id uuid,
  camada_id uuid,
  producto_id uuid,
  prestador_id uuid,
  raza_preferida text,
  sexo_preferido text,
  notas text,
  estado text DEFAULT 'activo'::text NOT NULL,
  notificado_en timestamp with time zone,
  convertido_en timestamp with time zone,
  posicion integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_estado_check CHECK ((estado = ANY (ARRAY['activo'::text, 'notificado'::text, 'convertido'::text, 'cancelado'::text])));
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_sexo_preferido_check CHECK ((sexo_preferido = ANY (ARRAY['macho'::text, 'hembra'::text, 'indiferente'::text])));
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_tipo_check CHECK ((tipo = ANY (ARRAY['camada'::text, 'producto'::text, 'servicio'::text, 'prestador'::text])));
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_camada_id_fkey FOREIGN KEY (camada_id) REFERENCES criadero_camadas(id) ON DELETE CASCADE;
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_criadero_id_fkey FOREIGN KEY (criadero_id) REFERENCES criaderos(id) ON DELETE CASCADE;
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_prestador_id_fkey FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE CASCADE;
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE;
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_pkey PRIMARY KEY (id);
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_user_id_camada_id_key UNIQUE (user_id, camada_id);
ALTER TABLE public.lista_espera ADD CONSTRAINT lista_espera_user_id_producto_id_key UNIQUE (user_id, producto_id);
CREATE INDEX idx_le_camada ON public.lista_espera USING btree (camada_id, estado, created_at) WHERE (camada_id IS NOT NULL);
CREATE INDEX idx_le_producto ON public.lista_espera USING btree (producto_id, estado, created_at) WHERE ((producto_id IS NOT NULL) AND (estado = 'activo'::text));
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;
CREATE POLICY "le_owner" ON public.lista_espera FOR ALL TO authenticated
  USING (((user_id = auth.uid()) OR is_admin()))
  WITH CHECK (((user_id = auth.uid()) OR is_admin()));

-- ─── planes_nutricion ───────────────────────────────────────────────
CREATE TABLE public.planes_nutricion (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  mascota_id uuid NOT NULL,
  user_id uuid NOT NULL,
  country_code text DEFAULT 'EC'::text NOT NULL,
  peso_actual_kg numeric(5,2),
  peso_objetivo_kg numeric(5,2),
  condicion_corporal integer,
  nivel_actividad text,
  calorias_diarias integer,
  proteina_pct numeric(5,2),
  grasa_pct numeric(5,2),
  carbohidrato_pct numeric(5,2),
  alimento_recomendado text,
  marca_recomendada text,
  producto_id uuid,
  cantidad_diaria_gr integer,
  raciones_por_dia integer DEFAULT 2,
  gramos_por_racion integer,
  suplementos jsonb DEFAULT '[]'::jsonb,
  duracion_semanas integer DEFAULT 4,
  proxima_revision date,
  notas_ia text,
  activo boolean DEFAULT true NOT NULL,
  generado_por text DEFAULT 'ia'::text,
  recurrente_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.planes_nutricion ADD CONSTRAINT planes_nutricion_condicion_corporal_check CHECK (((condicion_corporal >= 1) AND (condicion_corporal <= 9)));
ALTER TABLE public.planes_nutricion ADD CONSTRAINT planes_nutricion_generado_por_check CHECK ((generado_por = ANY (ARRAY['ia'::text, 'veterinario'::text, 'manual'::text])));
ALTER TABLE public.planes_nutricion ADD CONSTRAINT planes_nutricion_nivel_actividad_check CHECK ((nivel_actividad = ANY (ARRAY['bajo'::text, 'medio'::text, 'alto'::text])));
ALTER TABLE public.planes_nutricion ADD CONSTRAINT planes_nutricion_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE;
ALTER TABLE public.planes_nutricion ADD CONSTRAINT planes_nutricion_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos(id);
ALTER TABLE public.planes_nutricion ADD CONSTRAINT planes_nutricion_recurrente_id_fkey FOREIGN KEY (recurrente_id) REFERENCES pedidos_recurrentes(id);
ALTER TABLE public.planes_nutricion ADD CONSTRAINT planes_nutricion_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.planes_nutricion ADD CONSTRAINT planes_nutricion_pkey PRIMARY KEY (id);
CREATE INDEX idx_nutricion_mascota ON public.planes_nutricion USING btree (mascota_id, activo, created_at DESC);
ALTER TABLE public.planes_nutricion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pn_owner" ON public.planes_nutricion FOR ALL TO authenticated
  USING (((user_id = auth.uid()) OR is_admin()))
  WITH CHECK (((user_id = auth.uid()) OR is_admin()));

-- ─── checkout_sesiones ───────────────────────────────────────────────
CREATE TABLE public.checkout_sesiones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  session_id text,
  country_code text DEFAULT 'EC'::text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal numeric(10,2) DEFAULT 0,
  descuento numeric(10,2) DEFAULT 0,
  cupon_codigo text,
  total numeric(10,2) DEFAULT 0,
  paso_actual text DEFAULT 'carrito'::text,
  direccion_datos jsonb DEFAULT '{}'::jsonb,
  zona_cobertura_id uuid,
  costo_envio numeric(8,2) DEFAULT 0,
  estado text DEFAULT 'activo'::text NOT NULL,
  pedido_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  expira_en timestamp with time zone DEFAULT (now() + '02:00:00'::interval)
);
ALTER TABLE public.checkout_sesiones ADD CONSTRAINT checkout_sesiones_estado_check CHECK ((estado = ANY (ARRAY['activo'::text, 'completado'::text, 'abandonado'::text, 'expirado'::text])));
ALTER TABLE public.checkout_sesiones ADD CONSTRAINT checkout_sesiones_paso_actual_check CHECK ((paso_actual = ANY (ARRAY['carrito'::text, 'direccion'::text, 'envio'::text, 'pago'::text, 'confirmacion'::text])));
ALTER TABLE public.checkout_sesiones ADD CONSTRAINT checkout_sesiones_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos(id);
ALTER TABLE public.checkout_sesiones ADD CONSTRAINT checkout_sesiones_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.checkout_sesiones ADD CONSTRAINT checkout_sesiones_zona_cobertura_id_fkey FOREIGN KEY (zona_cobertura_id) REFERENCES zonas_cobertura(id);
ALTER TABLE public.checkout_sesiones ADD CONSTRAINT checkout_sesiones_pkey PRIMARY KEY (id);
CREATE INDEX idx_checkout_user ON public.checkout_sesiones USING btree (user_id, estado, created_at DESC) WHERE (estado = 'activo'::text);
CREATE INDEX idx_checkout_expiradas ON public.checkout_sesiones USING btree (expira_en, estado) WHERE (estado = 'activo'::text);
ALTER TABLE public.checkout_sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cs_own" ON public.checkout_sesiones FOR ALL TO authenticated
  USING (((user_id = auth.uid()) OR is_admin()))
  WITH CHECK ((user_id = auth.uid()));

-- ─── vtex_sync_log ───────────────────────────────────────────────
CREATE TABLE public.vtex_sync_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tipo text NOT NULL,
  entidad_id text,
  vtex_id text,
  estado text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  error_mensaje text,
  intentos integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  completado_at timestamp with time zone
);
ALTER TABLE public.vtex_sync_log ADD CONSTRAINT vtex_sync_log_estado_check CHECK ((estado = ANY (ARRAY['exitoso'::text, 'fallido'::text, 'pendiente'::text, 'reintentando'::text])));
ALTER TABLE public.vtex_sync_log ADD CONSTRAINT vtex_sync_log_tipo_check CHECK ((tipo = ANY (ARRAY['producto_creado'::text, 'producto_actualizado'::text, 'producto_eliminado'::text, 'stock_actualizado'::text, 'precio_actualizado'::text, 'pedido_recibido'::text, 'pedido_actualizado'::text, 'categoria_sync'::text, 'full_sync'::text])));
ALTER TABLE public.vtex_sync_log ADD CONSTRAINT vtex_sync_log_pkey PRIMARY KEY (id);
CREATE INDEX idx_vtex_log_estado ON public.vtex_sync_log USING btree (estado, created_at DESC);
CREATE INDEX idx_vtex_log_entidad ON public.vtex_sync_log USING btree (entidad_id, tipo, created_at DESC);
CREATE INDEX idx_vtex_log_fallidos ON public.vtex_sync_log USING btree (estado, intentos) WHERE (estado = ANY (ARRAY['fallido'::text, 'reintentando'::text]));
ALTER TABLE public.vtex_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vtex_log_admin" ON public.vtex_sync_log FOR ALL TO authenticated
  USING (is_admin());

-- ─── servicios_exequiales ───────────────────────────────────────────────
CREATE TABLE public.servicios_exequiales (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  mascota_id uuid NOT NULL,
  prestador_id uuid,
  country_code text DEFAULT 'EC'::text NOT NULL,
  tipo text NOT NULL,
  estado text DEFAULT 'solicitado'::text NOT NULL,
  fecha_servicio date,
  direccion_recogida text,
  notas_especiales text,
  certificado_url text,
  memorial_url text,
  precio_total numeric(10,2),
  pagado boolean DEFAULT false,
  pedido_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.servicios_exequiales ADD CONSTRAINT servicios_exequiales_estado_check CHECK ((estado = ANY (ARRAY['solicitado'::text, 'confirmado'::text, 'en_proceso'::text, 'completado'::text, 'entregado'::text])));
ALTER TABLE public.servicios_exequiales ADD CONSTRAINT servicios_exequiales_tipo_check CHECK ((tipo = ANY (ARRAY['cremacion_individual'::text, 'cremacion_grupal'::text, 'entierro_jardin'::text, 'entierro_cementerio'::text, 'momificacion'::text, 'memorial_virtual'::text, 'urna_personalizada'::text, 'otro'::text])));
ALTER TABLE public.servicios_exequiales ADD CONSTRAINT servicios_exequiales_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE RESTRICT;
ALTER TABLE public.servicios_exequiales ADD CONSTRAINT servicios_exequiales_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos(id);
ALTER TABLE public.servicios_exequiales ADD CONSTRAINT servicios_exequiales_prestador_id_fkey FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE SET NULL;
ALTER TABLE public.servicios_exequiales ADD CONSTRAINT servicios_exequiales_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.servicios_exequiales ADD CONSTRAINT servicios_exequiales_pkey PRIMARY KEY (id);
CREATE INDEX idx_exequiales_mascota ON public.servicios_exequiales USING btree (mascota_id);
CREATE INDEX idx_exequiales_estado ON public.servicios_exequiales USING btree (estado, country_code);
ALTER TABLE public.servicios_exequiales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "se_owner" ON public.servicios_exequiales FOR ALL TO authenticated
  USING (((user_id = auth.uid()) OR is_admin()))
  WITH CHECK (((user_id = auth.uid()) OR is_admin()));

-- ─── PARTE 2 · LAS DOS VISTAS ──────────────────────────────────────────

CREATE VIEW public.v_pedido_liquidacion AS
 SELECT p.id AS pedido_id,
    p.numero_orden,
    p.total,
    p.estado AS estado_pedido,
    p.pagado_en AS pedido_pagado_en,
    p.country_code,
    pi.id AS item_id,
    pi.nombre_producto,
    pi.cantidad,
    pi.subtotal,
    pi.estado_item,
    pi.seller_id,
    pr.nombre AS seller_nombre,
    pr.email AS seller_email,
    sl.id AS liquidacion_id,
    sl.numero_liquidacion,
    sl.estado AS estado_liquidacion,
    sl.periodo_inicio,
    sl.periodo_fin,
    sl.pagado_en AS liquidacion_pagada_en,
    sl.referencia_transferencia,
    'normalizado'::text AS origen_datos
   FROM (((pedidos p
     JOIN pedido_items pi ON ((pi.pedido_id = p.id)))
     LEFT JOIN profiles pr ON ((pr.id = pi.seller_id)))
     LEFT JOIN seller_liquidaciones sl ON ((sl.id = pi.liquidacion_id)))
UNION ALL
 SELECT p.id AS pedido_id,
    p.numero_orden,
    p.total,
    p.estado AS estado_pedido,
    p.pagado_en AS pedido_pagado_en,
    p.country_code,
    NULL::uuid AS item_id,
    (item.value ->> 'nombre'::text) AS nombre_producto,
    ((item.value ->> 'cantidad'::text))::integer AS cantidad,
    (((item.value ->> 'precio'::text))::numeric * (((item.value ->> 'cantidad'::text))::integer)::numeric) AS subtotal,
    'pendiente'::text AS estado_item,
    prod.seller_id,
    pr.nombre AS seller_nombre,
    pr.email AS seller_email,
    lp_sl.id AS liquidacion_id,
    lp_sl.numero_liquidacion,
    lp_sl.estado AS estado_liquidacion,
    lp_sl.periodo_inicio,
    lp_sl.periodo_fin,
    lp_sl.pagado_en AS liquidacion_pagada_en,
    lp_sl.referencia_transferencia,
    'legacy_jsonb'::text AS origen_datos
   FROM (((((pedidos p
     CROSS JOIN LATERAL jsonb_array_elements(p.items) item(value))
     LEFT JOIN productos prod ON ((prod.id = ((item.value ->> 'producto_id'::text))::uuid)))
     LEFT JOIN profiles pr ON ((pr.id = prod.seller_id)))
     LEFT JOIN liquidacion_pedidos lp ON ((lp.pedido_id = p.id)))
     LEFT JOIN seller_liquidaciones lp_sl ON ((lp_sl.id = lp.liquidacion_id)))
  WHERE (NOT (EXISTS ( SELECT 1
           FROM pedido_items pi2
          WHERE (pi2.pedido_id = p.id))));

CREATE VIEW public.v_recurrentes_pendientes AS
 SELECT pr.id,
    pr.user_id,
    p.nombre AS usuario_nombre,
    p.email AS usuario_email,
    pr.items,
    pr.direccion,
    pr.ciudad,
    pr.country_code,
    pr.frecuencia_dias,
    pr.proximo_pedido,
    pr.entrega_hora_inicio,
    pr.entrega_hora_fin,
    pr.kushki_token,
    pr.ultimo_total,
    pr.pedidos_generados,
    pr.max_pedidos
   FROM (pedidos_recurrentes pr
     JOIN profiles p ON ((p.id = pr.user_id)))
  WHERE ((pr.activo = true) AND (pr.pausado_hasta IS NULL) AND (pr.proximo_pedido <= CURRENT_DATE) AND ((pr.max_pedidos IS NULL) OR (pr.pedidos_generados < pr.max_pedidos)));

-- ─── PARTE 3 · LAS COLUMNAS ────────────────────────────────────────────
-- Las 12 `vtex_*` + las dos que la M1 saca porque bloquean un DROP.
ALTER TABLE public.pedido_items ADD COLUMN liquidacion_id uuid;
ALTER TABLE public.pedidos ADD COLUMN recurrente_id uuid;
ALTER TABLE public.pedidos ADD COLUMN vtex_order_id text;
ALTER TABLE public.productos ADD COLUMN vtex_product_id text;
ALTER TABLE public.productos ADD COLUMN vtex_sincronizado_en timestamp with time zone;
ALTER TABLE public.productos ADD COLUMN vtex_sku_id text;
ALTER TABLE public.seller_perfil ADD COLUMN vtex_app_key_ref text;
ALTER TABLE public.seller_perfil ADD COLUMN vtex_app_token_ref text;
ALTER TABLE public.seller_perfil ADD COLUMN vtex_estado_sync text;
ALTER TABLE public.seller_perfil ADD COLUMN vtex_fulfillment_url text;
ALTER TABLE public.seller_perfil ADD COLUMN vtex_seller_id text;
ALTER TABLE public.seller_perfil ADD COLUMN vtex_sync_error text;
ALTER TABLE public.seller_perfil ADD COLUMN vtex_trade_policy_id text;
ALTER TABLE public.seller_perfil ADD COLUMN vtex_ultima_sync timestamp with time zone;
ALTER TABLE public.vtex_sync_log ADD COLUMN vtex_id text;

-- Sus constraints e índices (medidos, no supuestos):
ALTER TABLE public.productos ADD CONSTRAINT productos_vtex_product_id_key UNIQUE (vtex_product_id);
CREATE INDEX idx_productos_vtex ON public.productos USING btree (vtex_product_id) WHERE (vtex_product_id IS NOT NULL);
ALTER TABLE public.seller_perfil ADD CONSTRAINT seller_perfil_vtex_seller_id_key UNIQUE (vtex_seller_id);
ALTER TABLE public.seller_perfil ADD CONSTRAINT seller_perfil_vtex_estado_sync_check
  CHECK (((vtex_estado_sync = ANY (ARRAY['nunca'::text,'pendiente'::text,'sincronizado'::text,'error'::text])) OR (vtex_estado_sync IS NULL)));
CREATE INDEX idx_seller_perfil_vtex_sync ON public.seller_perfil USING btree (vtex_estado_sync, vtex_ultima_sync) WHERE (vtex_seller_id IS NOT NULL);

-- Y las dos FKs que las columnas de dependencia arrastraban:
ALTER TABLE public.pedidos ADD CONSTRAINT fk_pedido_recurrente
  FOREIGN KEY (recurrente_id) REFERENCES pedidos_recurrentes(id) ON DELETE SET NULL;
ALTER TABLE public.pedido_items ADD CONSTRAINT pedido_items_liquidacion_id_fkey
  FOREIGN KEY (liquidacion_id) REFERENCES seller_liquidaciones(id);

-- ─── PARTE 4 · D-757: devolver la puerta anónima de `pedidos` ──────────────
-- 🔴 REVERTIR ESTA PARTE REABRE UNA PUERTA DE ESCRITURA ANÓNIMA.
--    Cualquiera con la clave pública del bundle vuelve a poder crear pedidos.
--    Se incluye por completitud de la reversa, NO porque convenga ejecutarla.
GRANT INSERT, UPDATE, DELETE, TRUNCATE, SELECT ON public.pedidos TO anon;
DROP POLICY IF EXISTS pedidos_insert_propio ON public.pedidos;
CREATE POLICY "Guest pedidos insert" ON public.pedidos FOR INSERT TO public
  WITH CHECK ((user_id IS NULL));
CREATE POLICY "pedidos_insert" ON public.pedidos FOR INSERT TO public
  WITH CHECK (((auth.uid() = user_id) OR ((user_id IS NULL) AND (guest_email IS NOT NULL))));
CREATE POLICY "pedidos_select_guest" ON public.pedidos FOR SELECT TO anon
  USING (false);
CREATE POLICY "reclamar_pedidos_guest" ON public.pedidos FOR UPDATE TO authenticated
  USING (((user_id IS NULL) AND (lower(guest_email) = lower(auth.email()))))
  WITH CHECK ((user_id = auth.uid()));

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- LO QUE ESTA REVERSA NO DESHACE, dicho de nuevo al final porque es lo
-- único que importa: NINGUNA FILA VUELVE. Ni los 137 pedidos, ni sus
-- envíos y devoluciones, ni las dos comisiones al 20 %, ni las tres
-- liquidaciones, ni la regla de asignación, ni el mensaje a «Luis».
-- ═══════════════════════════════════════════════════════════════════
