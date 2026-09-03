#!/usr/bin/env node
/**
 * S112-A · EL ROJO DE `suscribirseAMisHilos` — SIN FILTRO, LA RLS ES LO ÚNICO.
 *
 * 🔴 POR QUÉ ESTE ROJO NO ES EL MISMO QUE EL DE `suscribirseAlHilo`. Aquél
 * escuchaba **un** hilo con `filter: solicitud_id=eq.X`. Éste escucha **la
 * tabla entera sin filtro**, porque una suscripción por hilo no escala a una
 * burbuja global. ⇒ *entre un extraño y todos los mensajes de adopción de la
 * casa no queda NADA más que la RLS del socket.* Se mide, no se razona.
 *
 * ⚠️ La sonda ESCRIBE un mensaje real y lo borra. Va al hilo `ebb3b9df`
 * —declinado y con cero mensajes— para no aparecer en una conversación viva.
 * El residuo se verifica al final: si no da 0, sale ROJO.
 *
 * ⚠️ EL CONTROL DEL PROPIO ARNÉS, porque `tercero=0` solo no prueba nada: si
 * el socket no hubiera conectado, los TRES darían 0. Los tres oyentes son el
 * MISMO objeto con distinto asiento ⇒ que la familia y el refugio den 1 en la
 * misma corrida es lo que convierte ese 0 en una medición. Por eso el arnés
 * sale ROJO si un participante recibe 0: ahí no midió, no aprobó.
 *
 * 🔴 **NO VA AL HOOK DE PRE-COMMIT: ESCRIBE.** Inserta un mensaje real y lo
 * borra. Corre a mano (`pnpm verify:mis-hilos-realtime`) o en el cierre, junto
 * a los otros que hablan con la base — nunca en cada commit.
 *
 * Secretos: keychain al momento y `.env.local` fuera del repo. Nada se imprime.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SEC = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const CLAVE = execFileSync('security',
  ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
  { encoding: 'utf8' }).trim();
const env = Object.fromEntries(readFileSync(`${SEC}/apps/cliente/.env.local`, 'utf8')
  .split('\n').filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = readFileSync(`${SEC}/supabase/dev/.env.local`, 'utf8')
  .match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();

const HILO = 'ebb3b9df-a33a-4566-8275-2470af37addf';   // declinado, 0 mensajes
const REF  = '632727a3-9682-4fa7-b569-19a6399736ff';       // autor de la sonda
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

/** Un oyente con la MISMA forma que va a tener el wrapper: sin filtro. */
async function oyente(email, clave) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data } = await c.auth.signInWithPassword({ email, password: clave });
  if (!data?.session) return null;
  c.realtime.setAuth(data.session.access_token);
  const recibidos = [];
  const canal = c.channel(`mis-hilos-prueba-${email}`)
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'adopcion_mensaje' },
        (p) => recibidos.push(p.new?.id));
  await new Promise((r) => { canal.subscribe((s) => { if (s === 'SUBSCRIBED') r(); }); });
  return { c, canal, recibidos, email };
}

const hilo = (await admin.from('adopcion_solicitud').select('id').eq('id', HILO)).data?.[0]?.id;
if (!hilo) { console.error('🔴 no se encontró el hilo de la sonda'); process.exit(2); }

const fam   = await oyente('guillo381+8@gmail.com', CLAVE);
/* La clave del refugio NO vive en el keychain ni puede vivir en el repo: se
   pasa por variable de entorno al correr. Sin ella el brazo del PUBLICADOR se
   declara sin medir, jamás se da por verde. */
const refu  = process.env.CLAVE_REFUGIO
  ? await oyente('guillo381+refugio@gmail.com', process.env.CLAVE_REFUGIO)
  : null;
const otro  = await oyente('guillo381+1@gmail.com', CLAVE);   // ni solicitante ni publicador
if (!fam || !otro) { console.error('🔴 sin sesión para el par que decide'); process.exit(2); }
if (!refu) console.log('⚠️  el refugio no pudo entrar — el brazo del PUBLICADOR queda sin medir por socket');

const { data: sonda, error } = await admin.from('adopcion_mensaje')
  .insert({ solicitud_id: hilo, autor_user_id: REF, cuerpo: 'sonda de realtime — se borra sola' })
  .select('id').single();
if (error) { console.error('🔴 la sonda no entró:', error.message); process.exit(2); }

const fallos0 = [];
await new Promise((r) => setTimeout(r, 5000));

/* ═══ LA OTRA MITAD DEL PEDIDO: `contar_pendientes` POR EL CAMINO REAL ═══════
   🔴 **Con la sonda TODAVÍA VIVA, a propósito.** Medido antes de moverlo acá:
   con los hilos al día la familia y un extraño devuelven los dos `0` — dos
   ceros que se leen como verde y no distinguen «correcto» de «roto». *Un
   contador sólo se prueba cuando hay algo que contar.*
   El cinturón SQL usa `SET LOCAL ROLE`, que **no es la puerta que usa la
   app**: acá se llama por PostgREST con la anon key del bundle. */
const anonCli = createClient(URL, ANON, { auth: { persistSession: false } });
const rAnon = await anonCli.rpc('contar_pendientes');
if (!rAnon.error) fallos0.push(`🔴 anon EJECUTÓ contar_pendientes y recibió ${JSON.stringify(rAnon.data)}`);

const rFam = await fam.c.rpc('contar_pendientes');
if (rFam.error) fallos0.push(`la familia no pudo contar: ${rFam.error.message}`);
else if ((rFam.data?.mensajes_sin_leer ?? 0) < 1 || (rFam.data?.hilos_con_sin_leer ?? []).length < 1)
  fallos0.push(`🔴 la familia no contó la sonda: ${JSON.stringify(rFam.data)}`);

const rOtro = await otro.c.rpc('contar_pendientes');
if (rOtro.error) fallos0.push(`el tercero no pudo contar: ${rOtro.error.message}`);
else if (rOtro.data?.mensajes_sin_leer !== 0 || rOtro.data?.solicitudes_por_revisar !== 0)
  fallos0.push(`🔴 el tercero contó ajeno por camino real: ${JSON.stringify(rOtro.data)}`);

await admin.from('adopcion_mensaje').delete().eq('id', sonda.id);

const residuo = (await admin.from('adopcion_mensaje').select('id').eq('id', sonda.id)).data?.length ?? 0;
const vio = (o) => (o ? o.recibidos.filter((id) => id === sonda.id).length : -1);

const fallos = [...fallos0];
if (vio(fam) !== 1)  fallos.push(`la familia (participante) recibió ${vio(fam)}, esperaba 1`);
if (refu && vio(refu) !== 1) fallos.push(`el refugio (publicador) recibió ${vio(refu)}, esperaba 1`);
if (vio(otro) !== 0) fallos.push(`🔴 UN TERCERO RECIBIÓ ${vio(otro)} — la RLS no filtra el socket sin filtro`);
if (residuo !== 0)   fallos.push(`la sonda dejó residuo (${residuo})`);

for (const o of [fam, refu, otro]) if (o) await o.c.removeChannel(o.canal);

console.log(`socket   · familia=${vio(fam)} · refugio=${vio(refu)} · tercero=${vio(otro)} · residuo=${residuo}`);
console.log(`contador · anon=${rAnon.error ? 'rebotado — ' + rAnon.error.message : '🔴 PASÓ'}`);
console.log(`contador · familia=${JSON.stringify(rFam.data)} · tercero=${JSON.stringify(rOtro.data)}`);
if (fallos.length) { console.error('🔴 ' + fallos.join('\n🔴 ')); process.exit(1); }
console.log('✅ sin filtro, la RLS entrega a los dos lados y a nadie más');
process.exit(0);
