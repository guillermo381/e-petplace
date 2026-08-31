/* S109-B · LOS DOS SUJETOS QUE NUNCA COBRARON, ejercidos contra las edges
 * DESPLEGADAS. No es un arnés contra la función: es una petición HTTP con la
 * sesión de una familia real, que es lo único que prueba que la puerta abrió.
 * Secretos leídos al momento y jamás impresos.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SEC = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();
const env = Object.fromEntries(
  readFileSync(`${SEC}/apps/cliente/.env.local`, 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = readFileSync(`${SEC}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();
if (!CLAVE || !URL || !ANON || !SERVICE) { console.error('🔴 falta un secreto'); process.exit(1); }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const cli = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: ses, error: eL } = await cli.auth.signInWithPassword(
  { email: 'guillo381+8@gmail.com', password: CLAVE });
if (eL || !ses?.session) { console.error('🔴 sin sesión:', eL?.message); process.exit(1); }
const uid = ses.session.user.id, tok = ses.session.access_token;

const { data: tar } = await admin.from('tarjetas_guardadas')
  .select('id, marca, ultimos4').eq('user_id', uid).eq('estado', 'guardada').limit(1).maybeSingle();
const { data: fm } = await admin.from('familia_miembro')
  .select('familia_id').eq('user_id', uid).is('hasta', null).limit(1).maybeSingle();
console.log(`sesión guillo381+8 · tarjeta ${tar.marca} ****${tar.ultimos4}\n`);

const cobrar = async (body) => {
  const r = await fetch(`${URL}/functions/v1/pagos-cobro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${tok}` },
    body: JSON.stringify({ ...body, tarjeta_id: tar.id }),
  });
  return { status: r.status, cuerpo: await r.text() };
};
const esperar = (ms) => new Promise((s) => setTimeout(s, ms));

const rastro = async (col, id, etiqueta) => {
  await esperar(9000);
  const { data: i } = await admin.from('pagos_intentos')
    .select('id, estado, monto, proveedor_transaction_id, authorization_code, motivo_rechazo')
    .eq(col, id).order('creado_en', { ascending: false }).limit(1).maybeSingle();
  console.log(`   intento ${i?.estado} · $${i?.monto} · tx=${i?.proveedor_transaction_id} · auth=${i?.authorization_code}`);
  if (i?.motivo_rechazo) console.log(`   motivo: ${i.motivo_rechazo.slice(0, 160)}`);
  const { data: c } = await admin.from('notificacion_intencion')
    .select('datos').eq('clave_dedup', `comprobante:${id}`).maybeSingle();
  console.log(`   COMPROBANTE: ${c ? `«${c.datos.concepto}» · $${c.datos.monto} ${c.datos.moneda} · tx=${c.datos.transaction_id}` : '🔴 ninguno'}`);
  return { intento: i, comprobante: c };
};

// ══ ① EL PROGRAMA DE ADIESTRAMIENTO ══════════════════════════════════════
console.log('① PROGRAMA DE ADIESTRAMIENTO');
const { data: pg } = await admin.from('prestador_programas')
  .select('id, nombre, n_sesiones, prestador_servicio_id').eq('activo', true).limit(1).maybeSingle();
const { data: sv } = await admin.from('prestador_servicios')
  .select('id, prestador_id').eq('id', pg.prestador_servicio_id).maybeSingle();
const { data: perro } = await admin.from('mascotas')
  .select('id, nombre').eq('familia_id', fm.familia_id).eq('especie', 'perro')
  .eq('estado_vida', 'activa').limit(1).maybeSingle();
console.log(`   «${pg.nombre}» ${pg.n_sesiones} sesiones · mascota ${perro.nombre}`);
const inicio = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const { data: ct, error: eC } = await cli.rpc('contratar_programa', {
  p_prestador_id: sv.prestador_id, p_servicio_id: sv.id, p_programa_id: pg.id,
  p_mascota_id: perro.id, p_fecha_inicio: inicio, p_hora: '10:00:00',
});
if (eC) { console.log(`   🔴 la puerta del programa rebotó: ${eC.message}`); }
else {
  const pid = ct.programa_contratado_id ?? ct.id;
  console.log(`   contratado ${String(pid).slice(0,8)} · ${JSON.stringify(ct).slice(0,150)}`);
  const r = await cobrar({ programa_contratado_id: pid });
  console.log(`   pagos-cobro → HTTP ${r.status} · ${r.cuerpo.slice(0, 180)}`);
  await rastro('programa_contratado_id', pid, 'programa');
  const { data: fin } = await admin.from('programas_contratados')
    .select('estado, estado_pago').eq('id', pid).maybeSingle();
  console.log(`   el programa quedó: estado=${fin?.estado} estado_pago=${fin?.estado_pago}`);
  console.log(`   ID: ${pid}`);
}

// ══ ② EL PAQUETE DE PASEO ════════════════════════════════════════════════
console.log('\n② PAQUETE DE PASEO');
const { data: sp } = await admin.from('prestador_servicios')
  .select('id, prestador_id').eq('tipo_servicio', 'paseo').eq('activo', true).limit(1).maybeSingle();
const { data: cp, error: eP } = await cli.rpc('comprar_paquete_salidas', {
  p_prestador_id: sp.prestador_id, p_servicio_id: sp.id, p_unidades: 5,
});
if (eP) { console.log(`   🔴 la puerta del paquete rebotó: ${eP.message}`); }
else {
  const bid = cp.bono_id ?? cp.id;
  console.log(`   bono ${String(bid).slice(0,8)} · ${JSON.stringify(cp).slice(0,150)}`);
  const r = await cobrar({ bono_id: bid });
  console.log(`   pagos-cobro → HTTP ${r.status} · ${r.cuerpo.slice(0, 180)}`);
  await rastro('bono_id', bid, 'paquete de paseo');
  const { data: fin } = await admin.from('bonos')
    .select('estado, estado_pago').eq('id', bid).maybeSingle();
  console.log(`   el bono quedó: estado=${fin?.estado} estado_pago=${fin?.estado_pago}`);
  console.log(`   ID: ${bid}`);
}
