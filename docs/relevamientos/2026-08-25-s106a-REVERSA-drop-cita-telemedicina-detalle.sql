-- REVERSA de 20260826250000_s106a_drop_cita_telemedicina_detalle.sql
-- ESCRITA ANTES DE APLICAR.
--
-- 🔴 LEER ANTES DE CORRERLA: **esta reversa resucita un modelo que la mesa
-- mató por una razón de seguridad, no por prolijidad.** La tabla guardaba
-- `token_prestador` y `token_cliente` como columnas de texto, y su policy de
-- SELECT alcanza a cualquiera con acceso a la mascota ⇒ **el dueño podía
-- leer el token del veterinario.** Si la revivís, revivís eso.
--
-- Además reintroduce:
--   · el `CHECK` de `proveedor` cerrado a `daily|whereby|zoom`, que
--     **rebotaría LiveKit** y cualquier proveedor que la mesa elija;
--   · `grabacion_url` / `grabacion_consentida`, que **contradicen la firma
--     ⓪ de §7** (la teleconsulta no se graba en v1).
--
-- QUÉ NO DESHACE: nada de datos — la tabla tenía **0 filas** al dropearse,
-- medido. Vuelve vacía, que es como estaba.
--
-- El DDL de abajo se generó DESDE EL OBJETO (information_schema +
-- pg_constraint + pg_policy) el 25-ago-2026, no se re-tecleó.

BEGIN;

CREATE TABLE public.cita_telemedicina_detalle (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cita_id uuid NOT NULL,
  mascota_id uuid NOT NULL,
  prestador_id uuid NOT NULL,
  pet_parent_id uuid NOT NULL,
  country_code text NOT NULL DEFAULT 'EC'::text,
  proveedor text NOT NULL DEFAULT 'daily'::text,
  room_url text,
  room_name text,
  token_prestador text,
  token_cliente text,
  estado text NOT NULL DEFAULT 'programada'::text,
  inicio_programado timestamp with time zone NOT NULL,
  inicio_real timestamp with time zone,
  fin_real timestamp with time zone,
  duracion_minutos integer,
  grabacion_url text,
  grabacion_consentida boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cita_telemedicina_detalle_pkey PRIMARY KEY (id)
);

ALTER TABLE public.cita_telemedicina_detalle ADD CONSTRAINT cita_telemedicina_detalle_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES evento_cita_servicio(id) ON DELETE RESTRICT;
ALTER TABLE public.cita_telemedicina_detalle ADD CONSTRAINT cita_telemedicina_detalle_cita_id_unique UNIQUE (cita_id);
ALTER TABLE public.cita_telemedicina_detalle ADD CONSTRAINT cita_telemedicina_detalle_estado_check CHECK ((estado = ANY (ARRAY['programada'::text, 'en_curso'::text, 'completada'::text, 'cancelada'::text, 'no_conectado'::text])));
ALTER TABLE public.cita_telemedicina_detalle ADD CONSTRAINT cita_telemedicina_detalle_mascota_id_fkey FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE RESTRICT;
ALTER TABLE public.cita_telemedicina_detalle ADD CONSTRAINT cita_telemedicina_detalle_pet_parent_id_fkey FOREIGN KEY (pet_parent_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.cita_telemedicina_detalle ADD CONSTRAINT cita_telemedicina_detalle_prestador_id_fkey FOREIGN KEY (prestador_id) REFERENCES prestadores(id) ON DELETE RESTRICT;
ALTER TABLE public.cita_telemedicina_detalle ADD CONSTRAINT cita_telemedicina_detalle_proveedor_check CHECK ((proveedor = ANY (ARRAY['daily'::text, 'whereby'::text, 'zoom'::text])));

ALTER TABLE public.cita_telemedicina_detalle ENABLE ROW LEVEL SECURITY;
CREATE POLICY telemedicina_delete_admin ON public.cita_telemedicina_detalle FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY telemedicina_insert ON public.cita_telemedicina_detalle FOR INSERT TO authenticated WITH CHECK (user_puede_acceder_prestador(prestador_id));
CREATE POLICY telemedicina_select ON public.cita_telemedicina_detalle FOR SELECT TO authenticated USING ((user_tiene_acceso_a_mascota(mascota_id) OR (pet_parent_id = auth.uid())));
CREATE POLICY telemedicina_update ON public.cita_telemedicina_detalle FOR UPDATE TO authenticated USING ((user_puede_acceder_prestador(prestador_id) OR is_admin())) WITH CHECK ((user_puede_acceder_prestador(prestador_id) OR is_admin()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cita_telemedicina_detalle TO authenticated;

COMMIT;
