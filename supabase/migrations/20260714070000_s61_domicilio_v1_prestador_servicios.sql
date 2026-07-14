-- S61 — DOMICILIO v1 (pedido SQL autocontenido del arquitecto, 76b):
-- la oferta declara sus MODALIDADES. Relevado regla 22: la fila de
-- oferta vive en prestador_servicios (tipo_servicio + precio + tallas
-- hijas) — es la tabla correcta, sin freno.
--
-- Defaults = comportamiento actual (grooming v1 es local, MODELO §4):
-- todo local, nada a domicilio → CERO backfill.
--
-- EL MOTOR NO SE TOCA EN ESTA PIEZA (declarado): obtener_groomers_
-- disponibles sigue ofertando igual — el filtro por modalidad entra
-- con la mitad del dueño. Nace columna+CHECK, cero funciones → L-140
-- no aplica.

alter table public.prestador_servicios
  add column atiende_local boolean not null default true,
  add column atiende_domicilio boolean not null default false,
  add column recargo_domicilio numeric;

alter table public.prestador_servicios
  add constraint chk_ps_alguna_modalidad
    check (atiende_local or atiende_domicilio),
  add constraint chk_ps_recargo_domicilio_no_negativo
    check (recargo_domicilio is null or recargo_domicilio >= 0);

comment on column public.prestador_servicios.atiende_local is
  'Domicilio v1 (S61): la oferta se atiende en el local del prestador. Al menos una modalidad encendida (CHECK).';
comment on column public.prestador_servicios.atiende_domicilio is
  'Domicilio v1 (S61): la oferta se atiende en el domicilio de la familia. El motor v1 aún no filtra por modalidad (entra con la mitad del dueño).';
comment on column public.prestador_servicios.recargo_domicilio is
  'Domicilio v1 (S61): recargo del prestador por ir a domicilio (>= 0, NULL = sin recargo declarado).';
