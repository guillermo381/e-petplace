BEGIN;
CREATE OR REPLACE FUNCTION public._trg_ps_paseo_sin_local()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public','pg_temp'
AS $f$
DECLARE v_admite boolean;
BEGIN
  IF NOT NEW.atiende_local THEN RETURN NEW; END IF;   -- nada que vigilar

  SELECT admite_atencion_local INTO v_admite
    FROM tipos_servicio WHERE codigo = NEW.tipo_servicio;

  -- Un tipo que no esta en el catalogo NO se bloquea aca: este guard vigila
  -- la MODALIDAD, no la existencia del codigo. Bloquearlo desde aca seria
  -- hacerle decir a un guard algo que no vino a decir.
  --
  -- 🔴 CORRECCION S97-A (medida): la version anterior de este comentario
  -- decia "esa es otra validacion y tiene su propia FK". **NO HAY FK.** Lo
  -- que hay es un CHECK en `prestador_servicios.tipo_servicio` con SU PROPIA
  -- lista, divergida del catalogo en las dos direcciones (el CHECK admite
  -- `otro`, que el catalogo no tiene — 3 filas vivas; el catalogo tiene 5
  -- codigos que el CHECK prohibe). Ficha D-812.
  -- *Un comentario que afirma un mecanismo inexistente es peor que ninguno:
  --  le dice a la proxima sesion que no hace falta construirlo.*
  IF v_admite IS NOT NULL AND v_admite = false THEN
    RAISE EXCEPTION 'oficio_no_atiende_en_local: «%» no se atiende en el local del negocio — su modalidad la fija el catálogo (tipos_servicio.admite_atencion_local)', NEW.tipo_servicio
      USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END
$f$;
COMMIT;
