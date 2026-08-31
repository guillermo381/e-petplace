/* S108-B2 · encargo 3 · UN COBRO REAL DE BONO CONTRA LA EDGE DESPLEGADA.
   No es un arnés contra la función: es una petición HTTP a `pagos-cobro` v24
   con la sesión de una familia real, que es lo único que prueba que la puerta
   está abierta. Los secretos se leen AL MOMENTO y jamás se imprimen. */
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
if (!CLAVE || !URL || !ANON || !SERVICE) { console.error('🔴 falta un secreto — abortado'); process.exit(1); }

const EMAIL = 'guillo381+8@gmail.com';
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const cli = createClient(URL, ANON, { auth: { persistSession: false } });

const { data: sesion, error: eL } = await cli.auth.signInWithPassword({ email: EMAIL, password: CLAVE });
if (eL || !sesion?.session) { console.error('🔴 no pude iniciar sesión:', eL?.message); process.exit(1); }
const token = sesion.session.access_token, uid = sesion.session.user.id;
console.log(`① sesión de ${EMAIL} · uid ${uid.slice(0,8)}`);

/* La tarjeta de esta familia. */
const { data: tarjetas } = await admin.from('tarjetas_guardadas')
  .select('id, marca, ultimos4').eq('user_id', uid).eq('estado', 'guardada').limit(1);
if (!tarjetas?.length) { console.error('🔴 sin tarjeta guardada'); process.exit(1); }
const tarjeta = tarjetas[0];
console.log(`② tarjeta ${tarjeta.marca} ****${tarjeta.ultimos4}`);

/* Un prestador de guardería con paquete activo. */
const { data: paq } = await admin.from('guarderia_paquetes')
  .select('prestador_id, tamano, precio').eq('activo', true).order('tamano').limit(1);
if (!paq?.length) { console.error('🔴 sin paquete de guardería activo'); process.exit(1); }
console.log(`③ paquete de ${paq[0].tamano} días · $${paq[0].precio}`);

/* 🔴 EL BONO SE COMPRA POR LA PUERTA REAL, no se fabrica: si `comprar_paquete_
   guarderia` rebota, el cobro tampoco tendría que ocurrir. */
const { data: compra, error: eC } = await cli.rpc('comprar_paquete_guarderia',
  { p_prestador_id: paq[0].prestador_id, p_tamano: paq[0].tamano });
if (eC) { console.error('🔴 la puerta del paquete rebotó:', eC.message); process.exit(1); }
const bonoId = compra.bono_id;
console.log(`④ bono ${bonoId.slice(0,8)} · estado_pago=${compra.estado_pago} · vence ${compra.pago_expira_en}`);

const { data: desg } = await admin.from('bono_desglose')
  .select('subtotal, impuesto, total, moneda').eq('bono_id', bonoId).maybeSingle();
console.log(`⑤ desglose congelado: ${desg ? `${desg.subtotal}+${desg.impuesto}=${desg.total} ${desg.moneda}` : '🔴 NO HAY'}`);

/* ⑥ LA EDGE DESPLEGADA. Petición HTTP real, con la sesión de la familia. */
const r = await fetch(`${URL}/functions/v1/pagos-cobro`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${token}` },
  body: JSON.stringify({ bono_id: bonoId, tarjeta_id: tarjeta.id }),
});
const cuerpo = await r.text();
/* 🔴 LA ETIQUETA NO CLAVA UNA VERSIÓN. La primera versión decía «v24» fijo y
   siguió diciéndolo sobre v25 y v26 — *un marcador que nombra una versión que
   no midió es la misma clase que el `[bundle]` estático de `L-160`: prueba
   quién lo escribió, no qué corrió.* La versión se lee de `functions list`,
   aparte, y se reporta desde ahí. */
console.log(`⑥ pagos-cobro (desplegada) → HTTP ${r.status} · ${cuerpo.slice(0, 300)}`);

/* ⑦ El rastro en la base: sin esto, el 200 es una promesa. */
await new Promise((s) => setTimeout(s, 2500));
const { data: intentos } = await admin.from('pagos_intentos')
  .select('id, estado, monto, proveedor, proveedor_transaction_id, authorization_code, motivo_rechazo')
  .eq('bono_id', bonoId).order('creado_en', { ascending: false });
for (const i of intentos ?? []) {
  console.log(`⑦ intento ${i.id.slice(0,8)} · ${i.proveedor} · ${i.estado} · $${i.monto}`);
  console.log(`   transaction_id = ${i.proveedor_transaction_id ?? '(ninguno)'}`);
  console.log(`   authorization_code = ${i.authorization_code ?? '(ninguno)'}`);
  if (i.motivo_rechazo) console.log(`   motivo = ${i.motivo_rechazo.slice(0,200)}`);
}
const { data: bonoFin } = await admin.from('bonos')
  .select('estado_pago, estado').eq('id', bonoId).maybeSingle();
console.log(`⑧ el bono quedó: estado=${bonoFin?.estado} estado_pago=${bonoFin?.estado_pago}`);
console.log(`\nBONO DE LA PRUEBA: ${bonoId}`);
