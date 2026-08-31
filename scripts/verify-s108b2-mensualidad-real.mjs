/* S108-B3 · encargo ③ · LA MENSUALIDAD POR LA EDGE DESPLEGADA, de punta a punta.
   Espejo del arnés del bono. Secretos leídos al momento, jamás impresos. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();
const env = Object.fromEntries(
  readFileSync(`${RAIZ}/apps/cliente/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = readFileSync(`${RAIZ}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
if (!CLAVE || !URL || !ANON || !SERVICE) { console.error('🔴 falta un secreto'); process.exit(1); }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const cli = createClient(URL, ANON, { auth: { persistSession: false } });

/* La suscripción viva y de quién es. */
const { data: susc } = await admin.from('guarderia_suscripciones')
  .select('id, familia_id, autorizada_por, estado, precio_mensual, monto_esperado, periodo_desde, periodo_hasta, dia_de_cobro')
  .eq('estado', 'activa').limit(1).maybeSingle();
if (!susc) { console.error('🔴 sin suscripción activa'); process.exit(1); }
console.log(`① mandato ${susc.id.slice(0,8)} · $${susc.precio_mensual} (techo $${susc.monto_esperado})`);
console.log(`   periodo_desde=${susc.periodo_desde} periodo_hasta=${susc.periodo_hasta} dia_de_cobro=${susc.dia_de_cobro}`);

const { data: u } = await admin.auth.admin.getUserById(susc.autorizada_por);
const EMAIL = u?.user?.email;
if (!EMAIL) { console.error('🔴 no resolví el correo del titular del mandato'); process.exit(1); }
const { data: ses, error: eL } = await cli.auth.signInWithPassword({ email: EMAIL, password: CLAVE });
if (eL || !ses?.session) { console.error('🔴 no pude iniciar sesión de', EMAIL, eL?.message); process.exit(1); }
console.log(`② sesión de ${EMAIL}`);

const { data: t } = await admin.from('tarjetas_guardadas')
  .select('id, marca, ultimos4').eq('user_id', ses.session.user.id).eq('estado','guardada').limit(1);
if (!t?.length) { console.error('🔴 sin tarjeta guardada'); process.exit(1); }
console.log(`③ tarjeta ${t[0].marca} ****${t[0].ultimos4}`);

const r = await fetch(`${URL}/functions/v1/pagos-cobro`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ses.session.access_token}` },
  body: JSON.stringify({ guarderia_suscripcion_id: susc.id, tarjeta_id: t[0].id }),
});
console.log(`④ pagos-cobro (desplegada) → HTTP ${r.status} · ${(await r.text()).slice(0,300)}`);

await new Promise((s) => setTimeout(s, 4000));
const { data: ints } = await admin.from('pagos_intentos')
  .select('id, estado, monto, proveedor_transaction_id, authorization_code, motivo_rechazo, guarderia_suscripcion_periodo')
  .eq('guarderia_suscripcion_id', susc.id).order('creado_en', { ascending: false }).limit(2);
for (const i of ints ?? []) {
  console.log(`⑤ intento ${i.id.slice(0,8)} · ${i.estado} · $${i.monto} · periodo=${i.guarderia_suscripcion_periodo}`);
  console.log(`   transaction_id = ${i.proveedor_transaction_id ?? '(ninguno)'} · auth = ${i.authorization_code ?? '(ninguno)'}`);
  if (i.motivo_rechazo) console.log(`   motivo = ${i.motivo_rechazo.slice(0,180)}`);
}
const { data: fin } = await admin.from('guarderia_suscripciones')
  .select('periodo_desde, periodo_hasta, dia_de_cobro').eq('id', susc.id).maybeSingle();
console.log(`⑥ el mandato quedó: desde=${fin?.periodo_desde} hasta=${fin?.periodo_hasta} dia=${fin?.dia_de_cobro}`);
const { data: dg } = await admin.from('guarderia_suscripcion_desglose')
  .select('periodo, subtotal, impuesto, total, moneda').eq('guarderia_suscripcion_id', susc.id);
console.log(`⑦ desgloses congelados: ${JSON.stringify(dg)}`);
const { count } = await admin.from('notificacion_intencion')
  .select('*', { count: 'exact', head: true }).like('clave_dedup', `comprobante:${susc.id}%`);
console.log(`⑧ comprobantes emitidos: ${count}`);
const { count: citas } = await admin.from('evento_cita_servicio')
  .select('*', { count: 'exact', head: true }).eq('metadata->>suscripcion_id', susc.id);
console.log(`⑨ citas del plan generadas: ${citas}`);
