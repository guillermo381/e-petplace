-- ============================================================================
-- S113-A · LAS FRASES DEL CATÁLOGO PASAN A TUTEO
--
-- Las escribí en voseo («pedile», «consultá», «hablá») y **la casa habla tuteo
-- neutro** (regla 27, es/en desde el día 1). Es el mismo defecto que se curó
-- hoy en la página del pasaporte, en otra pieza mía.
--
-- ⚠️ Y hay que saberlo: **los avisos ya nacidos NO se corrigen con esto.** Su
-- `detalle` lleva el texto COPIADO al nacer, no una referencia al catálogo.
-- *Eso es correcto —un aviso es una foto de lo que se dijo ese día— pero
-- significa que corregir la fuente no corrige lo ya dicho.* Los 9 vivos se
-- reescriben acá, uno por uno, porque son de hoy y nadie los leyó todavía.
--
-- 76(g): **NO RIGE.** UPDATE de texto sobre 10 filas de catálogo + 9 avisos
-- nacidos hace minutos.
-- ============================================================================

update public.cat_predisposiciones set chequeo_sugerido = case codigo
  when 'cadera'      then 'vale la pena hablar con tu vet de un estudio de cadera en su próximo chequeo'
  when 'corazon'     then 'conviene que tu vet le escuche el corazón con calma en el próximo control'
  when 'rinon'       then 'pregúntale a tu vet si conviene un análisis de sangre y orina de control'
  when 'dientes'     then 'pregúntale a tu vet cómo está su boca y cada cuánto conviene una limpieza'
  when 'peso'        then 'vale la pena revisar con tu vet la porción y el tipo de alimento'
  when 'respiracion' then 'habla con tu vet sobre cómo cuidarlo en días calurosos y cuánto ejercicio le conviene'
  when 'ojos'        then 'pídele a tu vet que le revise los ojos en el próximo control'
  when 'piel'        then 'consulta con tu vet si conviene un plan de baños o un cambio de alimento'
  when 'columna'     then 'pregúntale a tu vet cómo cuidarle la espalda: saltos, escaleras y cómo alzarlo'
  when 'tiroides'    then 'pregúntale a tu vet si conviene un análisis de tiroides en el próximo control'
  else chequeo_sugerido end
where codigo in ('cadera','corazon','rinon','dientes','peso','respiracion','ojos','piel','columna','tiroides');

-- los 9 avisos vivos, que son de hoy y nadie leyó
update public.avisos_coach a
   set detalle = a.detalle || jsonb_build_object('chequeo_sugerido', cp.chequeo_sugerido)
  from public.cat_predisposiciones cp
 where a.tipo = 'anticipacion'
   and cp.codigo = a.detalle->>'predisposicion'
   and a.leido_en is null;

do $$
declare v_voseo int;
begin
  /* El control mira las formas de voseo que YO usé, no «voseo» en general:
     un guard que busca todo el vocabulario rioplatense daría falsos rojos
     sobre palabras que también son tuteo. */
  select count(*) into v_voseo from cat_predisposiciones
   where chequeo_sugerido ~* '\m(pedile|consultá|hablá|preguntale|revisá|fijate)\M';
  if v_voseo > 0 then raise exception 'CINTURON: quedan % frases en voseo', v_voseo; end if;

  -- y siguen llevando al veterinario
  if exists (select 1 from cat_predisposiciones where chequeo_sugerido !~* 'vet') then
    raise exception 'CINTURON: una frase dejó de mandar al veterinario';
  end if;
  raise notice 'CINTURON OK · catálogo en tuteo y todas siguen llevando al vet';
end $$;
