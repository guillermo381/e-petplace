select p.proname||'|'||pg_get_function_identity_arguments(p.oid) as sig, pg_get_functiondef(p.oid) as def
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and (
  p.proname ~ '(caso|saldo_hogar|_devengar|motivo_pertenece|motivos|familia_del_user|guarderia_aplicar_acto|pedido_devenga|plantilla_whatsapp|otorgar_puntos)'
) order by p.proname;
