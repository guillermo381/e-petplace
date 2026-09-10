/**
 * S115-E · INSTRUMENTO 22 — EL EMAIL DEL DOCUMENTO ES DEL RECEPTOR, NUNCA DEL EMISOR.
 *
 * 🔴 EL DEFECTO MÁS COMÚN DEL RIDE, y visto en una factura real: el campo del correo
 * trae **el de la propia empresa que emite**. No falla nada — el SRI autoriza igual, el
 * PDF se genera igual — y **el cliente nunca recibe su factura**. Después reclama, y
 * desde adentro todo se ve bien: el documento existe, está autorizado, y «se envió».
 *
 * DOS BRAZOS, y el primero no depende de saber cuál es el correo del emisor:
 *   (a) el email del documento **pertenece al `user_id` del documento**. Eso ES la
 *       definición de «es del receptor», y se verifica contra `auth.users`.
 *   (b) el email no está en la lista de correos del EMISOR (dominios de la casa).
 *
 * ROJO: plantar el correo del emisor en un documento y ver que grita.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

/* Los dominios y buzones de la CASA. Un documento cuyo receptor sea uno de éstos no es
   imposible —un empleado puede comprar— pero sí lo es que TODOS lo sean, o que aparezca
   un buzón operativo (no-reply, facturacion, soporte) como receptor de una venta. */
const DOMINIOS_EMISOR = ['epetplace.com', 'satori', 'satoriinov'];
const BUZONES_OPERATIVOS = ['no-reply', 'noreply', 'facturacion', 'facturación', 'soporte',
                            'admin@', 'info@', 'contacto@', 'ventas@'];

await correr('i22 · el email del documento es del receptor, nunca del emisor', async (r) => {
  if (uno(`select to_regclass('public.documentos_fiscales') is null as no`).no)
    noConcluyente('documentos_fiscales no existe.');

  const total = uno(`select count(*)::int as n from documentos_fiscales`).n;
  const conEmail = uno(`select count(*)::int as n from documentos_fiscales where email is not null`).n;
  r.dato('documentos', `${total} · con email ${conEmail}`);

  // ── (a) EL EMAIL PERTENECE AL user_id DEL DOCUMENTO ──────────────────────
  if (conEmail > 0) {
    const ajenos = q(
      `select d.id, d.email as email_documento, u.email as email_del_user, d.user_id
         from documentos_fiscales d
         left join auth.users u on u.id = d.user_id
        where d.email is not null
          and (d.user_id is null or lower(d.email) is distinct from lower(u.email))
        limit 10`);
    r.dato('con email que NO es el de su user_id', `${ajenos.length}`);
    for (const a of ajenos.slice(0, 5)) r.dato('  🔴', JSON.stringify(a));

    /* ⚠️ Un email distinto del de la cuenta NO siempre es el defecto: una familia puede
       declarar en su `tax_profile` un correo de facturación distinto del de su login.
       Lo que sí es el defecto es que sea del EMISOR — por eso (a) informa y (b) corta. */
    if (ajenos.length) {
      const conPerfil = uno(
        `select count(*)::int as n from documentos_fiscales d
           join tax_profiles t on t.id = d.tax_profile_id
          where d.email is not null and lower(d.email) = lower(t.email)`).n;
      r.dato('  de ésos, los que coinciden con su tax_profile', `${conPerfil} — declarados por la familia, no un defecto`);
    }
  }

  // ── (b) 🔴 EL EMAIL NO ES DEL EMISOR ─────────────────────────────────────
  const patronEmisor = DOMINIOS_EMISOR.concat(BUZONES_OPERATIVOS)
    .map((d) => d.replace(/[.@]/g, (m) => `[${m}]`)).join('|');
  const delEmisor = conEmail > 0
    ? q(`select id, email, rol::text as rol from documentos_fiscales
          where email is not null and email ~* '${patronEmisor}' limit 10`)
    : [];
  r.di('');
  r.dato('con email DEL EMISOR', delEmisor.length ? `🔴 ${delEmisor.length}` : '0 ✓');
  for (const d of delEmisor) r.dato('  🔴', `${d.id} → ${d.email} (${d.rol})`);

  // ── (c) ROJO PROBADO: plantar el correo del emisor ───────────────────────
  const SONDA = 'facturacion@epetplace.com';
  const cazado = q(`begin;
    insert into documentos_fiscales (total, sentido, rol, tipo, estado, emitida_por_tercero, email)
      values (10.00,'emitido','venta_cliente','factura','borrador',false,'${SONDA}');
    select count(*)::int as n from documentos_fiscales
      where email is not null and email ~* '${patronEmisor}';
    rollback;`);
  const nCazado = cazado[cazado.length - 1].n;
  r.di('');
  r.dato('rojo ejercido · plantado ' + SONDA, `${nCazado > delEmisor.length ? 'CAZADO ✓' : `🔴 NO lo caza (${nCazado})`}`);
  if (nCazado <= delEmisor.length)
    noConcluyente(`el detector no ve un «${SONDA}» plantado a propósito: su cero de arriba no dice nada.`);

  // Control negativo: un correo de familia NO se marca.
  const inocente = q(`begin;
    insert into documentos_fiscales (total, sentido, rol, tipo, estado, emitida_por_tercero, email)
      values (10.00,'emitido','venta_cliente','factura','borrador',false,'familia.gomez@gmail.com');
    select count(*)::int as n from documentos_fiscales
      where email is not null and email ~* '${patronEmisor}';
    rollback;`);
  const nInocente = inocente[inocente.length - 1].n;
  r.dato('control negativo · familia.gomez@gmail.com', nInocente === delEmisor.length
    ? 'no se marca ✓' : `🔴 se marca (${nInocente})`);
  if (nInocente !== delEmisor.length)
    noConcluyente('el detector marca un correo de familia común: marcaría a receptores legítimos.');

  // ── (d) Residuo ──────────────────────────────────────────────────────────
  const resto = uno(`select count(*)::int as n from documentos_fiscales where email in ('${SONDA}','familia.gomez@gmail.com')`).n;
  r.dato('residuo', `${resto}`);
  if (resto !== 0) rojo(`el instrumento dejó ${resto} documento(s).`);

  // ── (e) VEREDICTO ────────────────────────────────────────────────────────
  if (delEmisor.length)
    rojo(`${delEmisor.length} documento(s) llevan el correo del EMISOR como receptor.\n   No falla nada: el SRI autoriza, el PDF se genera, y el cliente nunca recibe su factura.\n   Después reclama, y desde adentro todo se ve bien.`);

  if (total === 0)
    r.di('\n   ⚠️ CERO documentos todavía: los dos brazos no tienen sobre qué medir.\n      Lo que SÍ queda probado es el DETECTOR — caza el correo del emisor plantado\n      y no marca uno de familia. Cuando el outbox empiece a escribir, mide solo.');

  r.di('\n   → el email del documento es del receptor, y el detector se vio cazar y se vio callar.');
});
