/* ═══════════════════════════════════════════════════════════════════════════
   REVERSA de `20260907500000_s111a_motor_adopcion.sql` — ESCRITA ANTES.

   🔴 QUÉ NO DESHACE:

   1. **NO borra los eventos `transferencia_familia` ya escritos.** Un evento
      del expediente no se deshace revirtiendo código — y en adopción **es
      justamente el rastro que la letra existe para dejar**.
   2. **NO devuelve a su familia anterior a las mascotas ya traspasadas.** Se
      quedan donde el traspaso las dejó, y sin la RPC que las movió.
   3. **NO reabre los `familia_miembro` cerrados con `hasta`.** El acceso viejo
      quedó cerrado; revertir el código no reabre a nadie.
   4. **`DROP` de `mascotas.estado_adopcion` DESTRUYE el dato** de qué animales
      estaban publicados, y `adopcion_publicacion` se va con él. *Si hay
      publicaciones vivas, revertir las deja sin ningún registro.*
   5. **NO toca `familia.tipo`**: `virtual_refugio` ya estaba en el CHECK antes
      de esta migración — no lo agregó ella y no lo saca.

   ⇒ Mirar antes:
      SELECT estado_adopcion, count(*) FROM mascotas GROUP BY 1;
      SELECT count(*) FROM adopcion_publicacion;
      SELECT count(*) FROM eventos_mascota WHERE tipo='transferencia_familia';
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

DROP FUNCTION IF EXISTS public.traspasar_mascota_a_familia(uuid, uuid, integer, text);
DROP FUNCTION IF EXISTS public.despublicar_adoptable(uuid, text);
DROP FUNCTION IF EXISTS public.publicar_adoptable(uuid, uuid);
DROP FUNCTION IF EXISTS public.obtener_adoptables(text, text, integer);
DROP FUNCTION IF EXISTS public._user_publico_esta_publicacion(uuid, uuid);
DROP FUNCTION IF EXISTS public._user_gestiona_cuenta_refugio(uuid);

DROP TABLE IF EXISTS public.adopcion_publicacion;
DROP TABLE IF EXISTS public.adopcion_documentos;

ALTER TABLE public.mascotas
  DROP CONSTRAINT IF EXISTS mascotas_estado_adopcion_fkey,
  DROP COLUMN IF EXISTS estado_adopcion;

DROP TABLE IF EXISTS public.cat_estados_adopcion;

COMMIT;
