/* REVERSA de `20260907520000_s111a_tres_destinos_actor_refugio.sql` — ESCRITA ANTES.
   🔴 QUÉ NO DESHACE:
   1. **NO borra los `pedido_item_destinos` ya escritos con refugio o con
      mascota en adopción.** Al volver el CHECK viejo, esas filas quedan
      VIOLANDO un constraint que ya no las admite — y Postgres **no revalida
      al agregar el CHECK si se usa NOT VALID**; con validación normal, el
      `ALTER` FALLA y la reversa no corre. *Mirar antes.*
   2. **NO borra las suscripciones de padrinazgo** que hayan nacido con el tipo
      nuevo: quedarían fuera del CHECK viejo, con el mismo efecto.
   3. **Devolver `obtener_adoptables` a sesión obligatoria CIERRA la puerta 2 de
      §4** — la vidriera deja de verse sin cuenta.
   ⇒ Mirar antes:
      SELECT count(*) FROM pedido_item_destinos WHERE refugio_cuenta_comercial_id IS NOT NULL;
      SELECT count(*) FROM pedido_item_destinos d JOIN mascotas m ON m.id=d.mascota_id
       WHERE d.es_donacion;
      SELECT count(*) FROM suscripciones_servicio WHERE tipo_servicio='padrinazgo_mensual';
      SELECT count(*) FROM cat_transiciones_pedido WHERE actor='refugio';
   El cuerpo VIEJO de `crear_pedido_despensa` se recupera de su migración de
   origen; esta reversa NO lo transcribe para no dejar dos copias divergentes. */
BEGIN;
ALTER TABLE public.pedido_item_destinos
  DROP CONSTRAINT IF EXISTS chk_destino_donacion,
  DROP COLUMN IF EXISTS refugio_cuenta_comercial_id;
ALTER TABLE public.pedido_item_destinos
  ADD CONSTRAINT chk_destino_excluyente CHECK (NOT (es_donacion AND mascota_id IS NOT NULL));
ALTER TABLE public.suscripciones_servicio DROP CONSTRAINT IF EXISTS suscripciones_servicio_tipo_valido;
ALTER TABLE public.suscripciones_servicio ADD CONSTRAINT suscripciones_servicio_tipo_valido
  CHECK (tipo_servicio = ANY (ARRAY['guarderia_mensual','paseo_mensual']));
ALTER TABLE public.cat_transiciones_pedido DROP CONSTRAINT IF EXISTS cat_transiciones_pedido_actor_check;
ALTER TABLE public.cat_transiciones_pedido ADD CONSTRAINT cat_transiciones_pedido_actor_check
  CHECK (actor = ANY (ARRAY['cliente','vendedor','sistema','admin','repartidor']));
REVOKE EXECUTE ON FUNCTION public.obtener_adoptables(text,text,integer) FROM anon;
COMMIT;
