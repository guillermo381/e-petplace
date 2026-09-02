/* ═══════════════════════════════════════════════════════════════════════════
   S112-D · REVERSA del barrido diario de adopción.
   ESCRITA ANTES DE LA MIGRACIÓN. No la apliqué: no aplico migraciones.
   ═══════════════════════════════════════════════════════════════════════════

   ── 🔴 LO QUE ESTA REVERSA **NO** PUEDE DESHACER ─────────────────────────
   Se dice primero porque cambia si conviene correrla.

   **① LA ANONIMIZACIÓN ES IRREVERSIBLE, Y ESE ES SU PUNTO.**
   `purgar_postulaciones_vencidas()` pone `solicitante_user_id = NULL` y
   **no guarda copia en ningún lado**. Correr esta reversa **NO devuelve una
   sola identidad**. *Un borrado que se puede deshacer no es un borrado: es un
   archivo con otro nombre* — y lo que el founder firmó es borrar.

   ⚠️ **Y por eso el `SET NOT NULL` de abajo PUEDE FALLAR, a propósito.**
   Si alguna fila ya se anonimizó, restaurar `NOT NULL` revienta. **Eso no es un
   bug de la reversa: es la reversa negándose a mentir.** No hay valor con el
   cual rellenar. Si pasa: se decide en la mesa si se conserva la columna
   nullable (lo correcto) — **jamás se inventa un uuid para que pase.**

   **② LOS AVISOS YA EMITIDOS NO VUELVEN.** Las filas de
   `notificacion_intencion` quedan; si alguna salió, salió.

   **③ `aviso_silencio_emitido_en` NO SE LIMPIA, y es deliberado.** Borrar esas
   marcas haría que el reloj **vuelva a avisar** sobre solicitudes ya avisadas
   el día que el barrido se re-aplique. *La marca es historia de un hecho, no
   estado de esta migración.*

   ── QUÉ SÍ DESHACE ───────────────────────────────────────────────────────
   El cron, las cuatro funciones, el trigger, el CHECK y la columna.
   ⇒ **Al correrla, el barrido diario se apaga entero**: ni el reloj de 5 días
   ni la purga de 90 vuelven a correr. Nada queda a medias.
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

-- ① EL CRON PRIMERO. Si se apagara al final, quedaría una ventana en la que el
--    job existe y su función ya no: un error por minuto en el log del cron.
SELECT cron.unschedule('barrer-adopcion-diario')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'barrer-adopcion-diario');

-- ② LAS FUNCIONES
DROP FUNCTION IF EXISTS public.barrer_adopcion_diario();
DROP FUNCTION IF EXISTS public.avisar_adopcion_sin_respuesta();
DROP FUNCTION IF EXISTS public.purgar_postulaciones_vencidas();
DROP FUNCTION IF EXISTS public._voz_adopcion_sin_respuesta(uuid, text);

-- ③ EL TRIGGER que exige autor al nacer
DROP TRIGGER IF EXISTS trg_adopcion_mensaje_nace_con_autor ON public.adopcion_mensaje;
DROP FUNCTION IF EXISTS public._adopcion_mensaje_nace_con_autor();

-- ④ EL CHECK y la columna
ALTER TABLE public.adopcion_solicitud DROP CONSTRAINT IF EXISTS chk_identidad_xor_anonima;
ALTER TABLE public.adopcion_solicitud DROP COLUMN IF EXISTS anonimizada_en;

-- ⑤ 🔴 LAS DOS RESTAURACIONES QUE PUEDEN FALLAR — ver nota ① de la cabecera.
--    Se dejan explícitas y NO envueltas en un `EXCEPTION WHEN OTHERS`: si hay
--    filas anonimizadas, esto TIENE que doler. *Un `SET NOT NULL` que se traga
--    su propio fallo deja el esquema diciendo una cosa y los datos otra.*
ALTER TABLE public.adopcion_solicitud ALTER COLUMN solicitante_user_id SET NOT NULL;
ALTER TABLE public.adopcion_mensaje   ALTER COLUMN autor_user_id       SET NOT NULL;

COMMIT;
