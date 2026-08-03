-- REVERSA de 20260803200000_s85_nombre_comercial_atomico.sql
-- Escrita ANTES de aplicar.
--
-- Retira la RPC. NO toca datos: la función no cambió ningún nombre por sí
-- misma — solo es la puerta por la que se cambian de a dos.
--
-- ⚠️ REVERTIR ESTO NO "VUELVE ATRÁS": DEJA LA CASA PEOR QUE ANTES DE S85, y
-- por eso conviene leer el porqué antes de correrla.
--
-- La firma que la RPC implementa es *"la portada edita el nombre; el fiscal lo
-- exhibe"* — un nombre, dos casas, cero divergencia POSIBLE. Sin esta función,
-- el nombre vuelve a poder escribirse en UNA sola de las dos columnas, y esa
-- es exactamente la clase de divergencia que **no da error, no rompe un build y
-- nadie descubre**: la portada dice una cosa y el documento fiscal otra, cada
-- una correcta en su pantalla.
--
-- Y hay un dato que lo vuelve concreto: al aplicar la migración, las 7 filas
-- vivas COINCIDÍAN (medido). *La RPC no reparó una divergencia: impidió la
-- primera.* Revertirla no re-abre un problema viejo — abre uno que todavía no
-- ocurrió.
--
-- ⇒ Si igual hay que revertir, la mitad que NO es SQL: el consumidor
-- (`actualizarNombreComercial` en packages/api y su pantalla) queda llamando a
-- una función que no existe. **Los dos cuerpos se mueven juntos**, o el rebote
-- le llega al prestador al guardar.

BEGIN;

DROP FUNCTION IF EXISTS public.actualizar_nombre_comercial(text);

DO $$
BEGIN
  IF to_regprocedure('public.actualizar_nombre_comercial(text)') IS NOT NULL THEN
    RAISE EXCEPTION 'REVERSA INCOMPLETA: la función sigue viva.';
  END IF;
  RAISE NOTICE 'reversa OK — actualizar_nombre_comercial retirada.';
END $$;

COMMIT;
