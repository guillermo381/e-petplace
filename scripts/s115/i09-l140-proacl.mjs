/**
 * S115-E · INSTRUMENTO 9 — L-140: NADA FISCAL ALCANZABLE POR anon.
 *
 * QUÉ MIDE: que ninguna pieza del frente fiscal quede REALMENTE alcanzable por
 * `anon`. La anon key viaja en el bundle: lo que anon alcanza está en internet.
 *
 * 🔴 SE MIDE POR `has_*_privilege`, JAMÁS POR `LIKE` SOBRE `proacl`. Un `proacl`
 * NULL significa "privilegios por defecto", y el default INCLUYE a PUBLIC: la
 * lectura textual da "limpio" justo donde el agujero está abierto (S92 abortó una
 * migración de seguridad por eso, con la puerta abierta).
 *
 * 🔴 Y SE MIDE LA CADENA ENTERA, NO EL GRANT SOLO. Un GRANT que la RLS neutraliza
 * NO es una puerta abierta: es defensa en profundidad ausente. La primera versión
 * de este instrumento midió sólo el grant y produjo un rojo VERDADERO E INÚTIL
 * (4 tablas "abiertas" que la RLS ya cerraba) — habría mandado a curar lo que no
 * estaba roto. *Medir media cadena da un diagnóstico cierto y equivocado.*
 * Por eso el veredicto tiene dos niveles: ROJO (alcance real) y AVISO (grant
 * huérfano), y sólo el primero corta.
 *
 * CONTROL POSITIVO OBLIGATORIO: el instrumento tiene que poder VER un EXECUTE de
 * anon; si ve cero en toda la base, el cero es suyo y no del mundo.
 *
 * ⚠️ ROJO DEL GUARD: no se pudo ejercer sobre el frente fiscal ANTES de que A
 * aplicara sus REVOKE — cuando este instrumento nació, las nueve migraciones ya
 * estaban aplicadas. Declarado en el acta, no maquillado. Lo que SÍ se ejerció es
 * que el instrumento distingue: ve las 245 alcanzables de la base (positivo) y
 * las 0 del frente fiscal (medición).
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

const TABLAS = ['documentos_fiscales', 'fiscal_sequences', 'fiscal_emisor', 'tax_profiles', 'pagos_desglose_lineas'];

/**
 * Funciones alcanzables por anon que están DECIDIDAS, con su razón.
 * *No es una lista para que el gate pase: es la lista de lo que alguien decidió.*
 * La pregunta que importa no es «cuántas hay», es «cuántas sin que nadie lo haya
 * decidido» — cualquiera fuera de acá es rojo.
 */
const DECIDIDAS = {
  'validar_identificacion_fiscal':
    'Validación de FORMATO contra la máscara regex de cat_paises. No dice si una identificación EXISTE ' +
    '(no es oráculo, a diferencia de verificar_identificacion_disponible que S92 cerró) y el registro la ' +
    'necesita antes de que haya sesión. Preexistente, no nace del frente fiscal de S115.',
};

await correr('i09 · L-140 · nada fiscal alcanzable por anon', async (r) => {
  // ── (a) CONTROL POSITIVO ──────────────────────────────────────────────────
  const positivo = uno(
    `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE')`).n;
  r.dato('control positivo', `${positivo} funciones de public alcanzables por anon`);
  if (positivo === 0)
    noConcluyente('el instrumento ve CERO EXECUTE de anon en toda la base: el cero es del instrumento.');

  // ── (b) TABLAS: alcance REAL = grant AND la RLS no lo tapa ────────────────
  const lista = TABLAS.map((t) => `'${t}'`).join(',');
  const tablas = q(
    `select c.relname, c.relrowsecurity as rls,
            has_table_privilege('anon', c.oid,'SELECT') as sel,
            has_table_privilege('anon', c.oid,'INSERT') as ins,
            has_table_privilege('anon', c.oid,'UPDATE') as upd,
            has_table_privilege('anon', c.oid,'DELETE') as del,
            (select count(*) from pg_policy p
              where p.polrelid=c.oid and 'anon' in (
                select r.rolname from pg_roles r where r.oid = any(p.polroles)))::int as pol_anon,
            (select count(*) from pg_policy p
              where p.polrelid=c.oid and p.polroles = '{0}')::int as pol_public
       from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relname in (${lista}) order by 1`);
  if (!tablas.length) noConcluyente('ninguna de las tablas fiscales existe todavía.');

  const alcanceReal = [], grantHuerfano = [];
  for (const t of tablas) {
    const permisos = ['sel', 'ins', 'upd', 'del'].filter((k) => t[k]);
    // La RLS tapa el grant si está activa Y no hay policy que alcance a anon
    // (una policy con polroles '{0}' es PUBLIC, y PUBLIC incluye a anon).
    const tapado = t.rls && t.pol_anon === 0 && t.pol_public === 0;
    if (!permisos.length) { r.dato(`tabla ${t.relname}`, 'anon: sin grant'); continue; }
    if (tapado) {
      grantHuerfano.push(t.relname);
      r.dato(`tabla ${t.relname}`, `⚠️ grant a anon (${permisos.join('/')}) — RLS activa y sin policy para anon ⇒ no alcanza nada`);
    } else {
      alcanceReal.push(`${t.relname} (${permisos.join('/')})`);
      r.dato(`tabla ${t.relname}`, `🔴 anon ALCANZA: ${permisos.join('/')}${t.rls ? ` · ${t.pol_anon + t.pol_public} policy la deja pasar` : ' · RLS APAGADA'}`);
    }
  }

  // ── (c) FUNCIONES del frente fiscal ───────────────────────────────────────
  const fns = q(
    `select p.proname,
            p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' as firma
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public'
        and (p.proname ~ 'fiscal|secuencial|tax_profile'
             or pg_get_functiondef(p.oid) ~ 'documentos_fiscales|fiscal_sequences|tax_profiles|fiscal_emisor|pagos_desglose_lineas')
        and has_function_privilege('anon', p.oid, 'EXECUTE')
      order by 1`);
  const censadas = uno(
    `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public'
        and (p.proname ~ 'fiscal|secuencial|tax_profile'
             or pg_get_functiondef(p.oid) ~ 'documentos_fiscales|fiscal_sequences|tax_profiles|fiscal_emisor|pagos_desglose_lineas')`).n;
  r.dato('funciones del frente fiscal', `${censadas} censadas · ${fns.length} alcanzables por anon`);
  if (censadas === 0) noConcluyente('el censo no encontró ninguna función fiscal.');

  const sinDecidir = [];
  for (const f of fns) {
    if (DECIDIDAS[f.proname]) r.dato(`anon · ${f.proname}`, `decidida — ${DECIDIDAS[f.proname].slice(0, 110)}…`);
    else { sinDecidir.push(f.firma); r.dato(`🔴 anon · ${f.proname}`, 'SIN DECIDIR'); }
  }

  // ── (d) proacl NULL: el caso que una lectura textual daría por limpio ─────
  const aclNull = q(
    `select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proacl is null
        and pg_get_functiondef(p.oid) ~ 'documentos_fiscales|fiscal_sequences|tax_profiles|fiscal_emisor'`);
  r.dato('proacl NULL en el frente fiscal', aclNull.length ? `🔴 ${aclNull.map((x) => x.proname).join(', ')}` : '0');

  // ── (e) Veredicto: sólo el ALCANCE REAL corta ────────────────────────────
  if (grantHuerfano.length)
    r.di(`\n   ⚠️ AVISO (no corta): grant a anon sin alcance en ${grantHuerfano.join(', ')}.\n      No es una puerta abierta — la RLS la tapa — pero es defensa en profundidad ausente:\n      el día que alguien agregue una policy permisiva, el grant ya está puesto.`);
  if (alcanceReal.length) rojo(`anon ALCANZA de verdad: ${alcanceReal.join(' · ')}.`);
  if (sinDecidir.length) rojo(`${sinDecidir.length} función(es) fiscal(es) alcanzable(s) por anon sin decisión escrita: ${sinDecidir.join(', ')}.`);
  if (aclNull.length) rojo(`${aclNull.length} función(es) del frente fiscal con proacl NULL (default incluye PUBLIC).`);

  r.di(`\n   → ${censadas} funciones fiscales · cero alcance real de anon sobre las ${tablas.length} tablas.`);
});
