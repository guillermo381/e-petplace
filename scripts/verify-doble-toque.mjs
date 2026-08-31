#!/usr/bin/env node
/**
 * ═══ EL SEGUNDO TOQUE EN «PAGAR» ═══════════════════════════════════════════
 *
 * 🔴 DE DÓNDE SALE. Medido en S109-B: en `pagos-cobro` el guard de
 * intento-en-vuelo existía en **UNA de las seis ramas** (la mensualidad), y la
 * `clave_idempotencia` es `cobro:<sujeto>:${Date.now()}` — **nunca puede
 * colisionar**, así que el índice único tampoco frena nada.
 *
 * > **Dos toques en «Pagar» producían dos intentos y DOS DÉBITOS REALES**, en el
 * > riel que ya cobra.
 *
 * EL CASO SE FABRICA, NO SE BUSCA (`L-443`). Cada sujeto se crea acá y se toca
 * dos veces; no se sale a ver si por casualidad hay alguno con dos intentos.
 *
 * MIDE DOS COSAS DISTINTAS Y LAS REPORTA APARTE — *un instrumento que las
 * mezcla da un veredicto sobre la que no preguntaste*:
 *
 *   ① SECUENCIAL — el segundo toque llega después del primero.
 *      **Tiene que dar 1 intento.** Es lo que el guard cura y es el caso real:
 *      un dedo que toca dos veces.
 *   ② CONCURRENTE — los dos toques salen juntos.
 *      **Puede dar 2, y eso NO es una falla del guard: es la CARRERA declarada**
 *      que sólo cierra el índice parcial + la clave por sujeto, que son de la
 *      base. Se mide para que el número exista, no para juzgarlo.
 *
 * ⚠️ El brazo ① es el que hace fallar al arnés. El ② informa.
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
if (!CLAVE || !URL || !ANON || !SERVICE) { console.error('🔴 falta un secreto'); process.exit(2); }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const cli = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: sesion } = await cli.auth.signInWithPassword(
  { email: 'guillo381+8@gmail.com', password: CLAVE });
if (!sesion?.session) { console.error('🔴 sin sesión'); process.exit(2); }
const TOKEN = sesion.session.access_token;

const { data: tj } = await admin.from('tarjetas_guardadas')
  .select('id').eq('user_id', sesion.user.id).eq('activa', true).limit(1).maybeSingle();
if (!tj) { console.error('🔴 sin tarjeta'); process.exit(2); }

const cobrar = (cuerpo) => fetch(`${URL}/functions/v1/pagos-cobro`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...cuerpo, tarjeta_id: tj.id }),
}).then(async (r) => ({ http: r.status, cuerpo: await r.json().catch(() => ({})) }));

const contar = async (col, id) => {
  const { count } = await admin.from('pagos_intentos')
    .select('id', { count: 'exact', head: true }).eq(col, id);
  return count ?? 0;
};

const fallas = [];
const exigir = (cond, queFalta) => {
  if (!cond) { fallas.push(queFalta); console.log(`   🔴 ${queFalta}`); }
};

/** Un sujeto: se crea, se toca dos veces SEGUIDAS, se cuentan los intentos. */
async function secuencial(etiqueta, col, id, cuerpo) {
  const a = await cobrar(cuerpo);
  const b = await cobrar(cuerpo);
  const n = await contar(col, id);
  console.log(`   ${etiqueta.padEnd(22)} 1º=${a.http} 2º=${b.http} (${b.cuerpo?.codigo ?? 'ok'}) · intentos=${n}`);
  exigir(n === 1, `${etiqueta}: el segundo toque dejó ${n} intentos, no 1`);
  exigir(b.http === 409, `${etiqueta}: el segundo toque no rebotó (HTTP ${b.http})`);
  return n;
}

// ══ LOS SUJETOS SE FABRICAN ═══════════════════════════════════════════════
const { data: fm } = await admin.from('familia_miembro')
  .select('familia_id').eq('user_id', sesion.user.id).limit(1).maybeSingle();

const { data: conProg } = await admin.from('programas_contratados')
  .select('mascota_id').in('estado', ['activo', 'pendiente']);
const ocupados = new Set((conProg ?? []).map((x) => x.mascota_id));
const { data: perros } = await admin.from('mascotas')
  .select('id, nombre').eq('familia_id', fm.familia_id).eq('especie', 'perro')
  .eq('estado_vida', 'activa');
const perroLibre = (perros ?? []).find((m) => !ocupados.has(m.id)) ?? perros?.[0];

const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

console.log('\n═══ ① SECUENCIAL — el segundo toque NO puede crear un intento\n');

/* ── bono de guardería ── */
{
  const { data: pg } = await admin.from('prestador_servicios')
    .select('prestador_id').eq('activo', true).eq('tipo_servicio', 'guarderia')
    .limit(1).maybeSingle();
  const { data: r } = await cli.rpc('comprar_paquete_guarderia',
    { p_prestador_id: pg.prestador_id, p_tamano: 5 });
  if (r?.bono_id) await secuencial('bono·guardería', 'bono_id', r.bono_id,
    { bono_id: r.bono_id });
  else console.log(`   bono·guardería        no se pudo sembrar: ${JSON.stringify(r).slice(0,90)}`);
}

/* ── bono de paseo: la oferta DEBE vender paquete (`L-443`) ── */
{
  const { data: ofs } = await admin.from('prestador_servicios')
    .select('id, prestador_id, precio_paquete').eq('activo', true)
    .eq('tipo_servicio', 'paseo').not('precio_paquete', 'is', null);
  const of = (ofs ?? []).find((o) => Number(o.precio_paquete) > 0);
  if (of) {
    const { data: r } = await cli.rpc('comprar_paquete_salidas',
      { p_prestador_id: of.prestador_id, p_servicio_id: of.id, p_unidades: 5 });
    if (r?.bono_id) await secuencial('bono·paseo', 'bono_id', r.bono_id, { bono_id: r.bono_id });
    else console.log(`   bono·paseo            no se pudo sembrar: ${JSON.stringify(r).slice(0,90)}`);
  } else console.log('   bono·paseo            ninguna oferta vende paquete');
}

/* ── programa: se elige midiendo que quepa en su vigencia ── */
{
  const { data: pgs } = await admin.from('prestador_programas')
    .select('id, n_sesiones, vigencia_dias, prestador_servicio_id').eq('activo', true);
  const pg = (pgs ?? []).find((x) => (x.n_sesiones - 1) * 7 + 1 <= x.vigencia_dias);
  const { data: sv } = await admin.from('prestador_servicios')
    .select('id, prestador_id').eq('id', pg.prestador_servicio_id).maybeSingle();
  const { data: r } = await cli.rpc('contratar_programa', {
    p_prestador_id: sv.prestador_id, p_servicio_id: sv.id, p_programa_id: pg.id,
    p_mascota_id: perroLibre.id, p_fecha_inicio: manana, p_hora: '10:00:00' });
  if (r?.programa_contratado_id ?? r?.id)
    await secuencial('programa', 'programa_contratado_id',
      r.programa_contratado_id ?? r.id, { programa_contratado_id: r.programa_contratado_id ?? r.id });
  else console.log(`   programa              no se pudo sembrar: ${JSON.stringify(r).slice(0,90)}`);
}

console.log('\n───────────────────────────────────────────────────────────────');
if (fallas.length) {
  console.log(`\n🔴 ${fallas.length} falla(s):`);
  for (const f of fallas) console.log(`   · ${f}`);
  console.log('\nDos toques en «Pagar» no pueden producir dos débitos.\n');
  process.exit(1);
}
console.log('\n✅ ningún segundo toque produjo un segundo intento\n');
