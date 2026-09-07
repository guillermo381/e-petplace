-- REVERSA de 20260910260000_s113a_busqueda_pegada.sql (ESCRITA ANTES)
-- Quita el pase sin separadores. «proplan» vuelve a no encontrar los 15
-- productos Pro Plan que existen. No rompe nada más: el pase es ADITIVO y el
-- FTS normal corre primero e igual.
select 'reversa 20260910260000 · «proplan» vuelve a dar 0' as nota;
