-- ROJO DE A10 · medido contra el catálogo VIVO, sin escribir nada.
-- Los dos lectores que dos pistas distintas escribirían, cada uno evaluado
-- sobre los mismos cuatro casos. La columna `deberia` es la letra (§4).
with casos(objeto, codigo, deberia, porque) as (values
  ('estadia','calidad',        true,  'estadia HEREDA las de cita (§4)'),
  ('pedido', 'calidad',        false, 'pedido NO hereda de cita'),
  ('estadia','otra_cosa',      true,  'objeto=todos aplica a todos'),
  ('cita',   'inventado_xyz',  false, 'no existe en el catalogo')
)
select
  c.objeto||' + '||c.codigo                                   as caso,
  c.deberia::text                                             as deberia,
  -- LECTOR INGENUO ①: la FK sobre el par (codigo, objeto) — la que sale sola
  -- con la PK que ya existe.
  exists(select 1 from cat_motivos_postventa m
         where m.codigo=c.codigo and m.objeto=c.objeto)::text as fk_par,
  -- LECTOR INGENUO ②: «¿existe el código?» — el SELECT que escribe alguien
  -- que ya sabe que la herencia existe y no quiere que la FK se la coma.
  exists(select 1 from cat_motivos_postventa m
         where m.codigo=c.codigo)::text                       as solo_codigo,
  c.porque                                                    as porque
from casos c;
