-- S61 — DOMICILIO v1, ENMIENDA (pedido SQL v2 del arquitecto): el
-- RECARGO cambia de tabla. La 20260714070000 ya estaba APLICADA cuando
-- llegó la corrección (reportado, no descartado — esta enmienda la
-- corrige): recargo_domicilio muere en prestador_servicios (nació hace
-- minutos, CERO datos — drop seguro, verificado 12/12 filas NULL) y el
-- recargo renace en PRESTADORES como grooming_recargo_domicilio,
-- ESPEJO LITERAL del patrón grooming_extra_pelaje_largo relevado:
-- numeric NULL, sin default, CHECK (col IS NULL OR col >= 0).
-- atiende_local / atiende_domicilio + CHECK quedan donde nacieron
-- (prestador_servicios) — la v2 los confirma ahí. Alcance honesto:
-- las columnas existen para TODA oferta pero hoy solo el wizard de
-- grooming las escribe; el paseo es domicilio por naturaleza y sus
-- filas quedan en default (declarado).

alter table public.prestador_servicios
  drop constraint chk_ps_recargo_domicilio_no_negativo;

alter table public.prestador_servicios
  drop column recargo_domicilio;

alter table public.prestadores
  add column grooming_recargo_domicilio numeric
    check (grooming_recargo_domicilio is null or grooming_recargo_domicilio >= 0);

comment on column public.prestadores.grooming_recargo_domicilio is
  'Domicilio v1 (S61, enmienda v2): recargo del groomer por atender a domicilio (>= 0, NULL = sin recargo declarado). Espejo del patrón grooming_extra_pelaje_largo. El motor v1 NO lo suma al snapshot todavía — entra con la mitad del dueño (deuda anotada).';
