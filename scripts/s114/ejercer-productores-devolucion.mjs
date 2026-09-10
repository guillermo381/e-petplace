#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIEMBRA · ejercer los DOS productores de devolución — S114-E (9-sep-2026)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **PARA QUÉ.** Que `caso_devolucion_por_elegir` y `devolucion_estado` pasen de
 * **«tienen productor»** a **«emitieron»**. *No es lo mismo, y la distinción es
 * la que hace el propio gate de A (`D-673`: sin productor ≠ nunca emitió).* Los
 * dos son los que le dan el {{3}} —el MONTO— a las plantillas aprobadas
 * `caso_elegir_devolucion` y `caso_resuelto`.
 *
 * ── POR QUÉ DOS CASOS Y NO UNO ──────────────────────────────────────────
 * Con un solo caso no se puede hacer las dos cosas: elegir destino **consume**
 * el sujeto de la pantalla de ELEGIR DESTINO de C. Entonces:
 *
 *   · **CASO A** — abrir → resolver con monto → **SE DEJA SIN ELEGIR**.
 *     Dispara `caso_devolucion_por_elegir` y **queda como sujeto NUEVO para C**.
 *   · **CASO B** — abrir → resolver con monto → **elegir destino**.
 *     Dispara `caso_devolucion_por_elegir` **y** `devolucion_estado`.
 *
 * ⇒ los dos tipos emiten **y C termina con un sujeto MÁS**, no con uno menos.
 *
 * ── ⚠️ EFECTO DECLARADO, Y NO ES CHICO ──────────────────────────────────
 * `push`, `email` e `in_app` están **vivos** (`transporte_vivo=true`) ⇒ **esto
 * manda avisos REALES a la cuenta de prueba.** El founder lo autorizó
 * explícitamente (*«el aviso real a la cuenta de prueba está bien —es mía—»*).
 * **WhatsApp NO sale**: su `transporte_vivo` sigue en `false`, y este script no
 * lo toca ni podría.
 *
 * También **acredita saldo** (el caso B elige `saldo`), y **cierra dos citas
 * pagadas con una devolución parcial** ⇒ toca el ledger. Todo por las RPCs.
 *
 * ── ⚠️ ESTO ES SIEMBRA, NO TRÁFICO ──────────────────────────────────────
 * **Marca:** `[SIEMBRA S114-E]` al principio del `relato`. Censo:
 *
 *   select id, etapa, destino, monto_devuelto from casos_postventa
 *    where relato like '[SIEMBRA S114-E]%';
 *
 * **Ningún número de acá es línea base.** Ningún dato de servicio de esta base
 * es real y producción es octubre.
 *
 * ── IDEMPOTENTE ─────────────────────────────────────────────────────────
 * Si los dos tipos ya tienen intenciones, **no abre nada**: informa y sale.
 * *Un sembrador que no se pregunta si ya sembró no siembra: acumula.*
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { dbQuery } from '../lib-db.mjs';

const MARCA = '[SIEMBRA S114-E]';
const FAMILIA = 'guillo381+8@gmail.com';
const PRESTADOR = 'demo-prestador@epetplace.dev';
const MOTIVO = 'duracion';            // clase 2 · cita · sin foto · no urgente
const TIPOS = ['caso_devolucion_por_elegir', 'devolucion_estado'];

const env = Object.fromEntries(readFileSync('apps/cliente/.env.local', 'utf8')
  .split('\n').filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const cl = (svc, acct) => execFileSync('security',
  acct ? ['find-generic-password', '-a', acct, '-s', svc, '-w']
       : ['find-generic-password', '-s', svc, '-w'], { encoding: 'utf8' }).trim();

async function sesion(email, pass) {
  const c = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: pass });
  if (error) { console.error(`🔴 login ${email}: ${error.message}`); process.exit(2); }
  return c;
}

const cuenta = (t) => dbQuery(
  `select count(*)::int n from notificacion_intencion where tipo = '${t}'`)[0].n;

const antes = Object.fromEntries(TIPOS.map((t) => [t, cuenta(t)]));
console.log('── intenciones ANTES ──');
for (const t of TIPOS) console.log(`   ${t.padEnd(30)} ${antes[t]}`);

if (TIPOS.every((t) => antes[t] > 0)) {
  console.log('\n↻ los dos tipos ya emitieron: no abro nada.');
  process.exit(0);
}

const sFam = await sesion(FAMILIA, cl('epetplace-siembra-s97', 'siembra'));
const sPre = await sesion(PRESTADOR, cl('epetplace-cuenta-prueba'));
const uid = dbQuery(`select id from auth.users where email = '${FAMILIA}'`)[0].id;

/* Dos citas pagadas, ejecutadas, en la ventana de 7 días y **sin ningún caso**
   — el guard `caso_ya_abierto` mira el objeto, así que reusar una con caso
   rebota y no es un fallo del motor. */
const objetos = dbQuery(`
  select c.id from evento_cita_servicio c
   where c.user_id = '${uid}' and c.estado_reserva = 'pagada'
     and c.tipo_servicio = 'paseo'
     and c.fecha >= (current_date - 7) and c.fecha <= current_date
     and not exists (select 1 from casos_postventa k where k.objeto_id = c.id)
   order by c.fecha desc limit 2`).map((r) => r.id);
if (objetos.length < 2) { console.error('🟠 no hay DOS citas libres en ventana — no fuerzo.'); process.exit(2); }

async function abrirYResolver(objetoId, etiqueta) {
  console.log(`\n── ${etiqueta} · objeto ${objetoId.slice(0, 8)} ──`);
  const a = await sFam.rpc('abrir_caso', {
    p_objeto_tipo: 'cita', p_objeto_id: objetoId, p_motivo: MOTIVO,
    p_relato: `${MARCA} ${etiqueta}: el paseo duró menos de lo reservado.`,
    p_procedencia: 'familia', p_modo: 'texto',
  });
  if (a.error || a.data?.ok === false) {
    console.error(`   🔴 abrir_caso: ${a.error?.message ?? JSON.stringify(a.data)}`); process.exit(2);
  }
  const casoId = a.data?.caso_id ?? a.data?.id;
  console.log(`   caso abierto: ${casoId} · etapa ${a.data?.etapa ?? '—'}`);

  /* `parcial` EXIGE monto>0 y motivo (firma founder: «un cero sin porqué se
     parece a que nadie miró el caso»). Lo resuelve el PRESTADOR, que es quien
     tiene el caso en `con_prestador`. */
  const r = await sPre.rpc('caso_resolver', {
    p_caso_id: casoId, p_alcance: 'parcial', p_monto: 2.5,
    p_motivo: `${MARCA} se devuelve la parte proporcional del tiempo que faltó.`,
  });
  if (r.error || r.data?.ok === false) {
    console.error(`   🔴 caso_resolver: ${r.error?.message ?? JSON.stringify(r.data)}`); process.exit(2);
  }
  console.log(`   resuelto parcial $2.50 → ${JSON.stringify(r.data).slice(0, 160)}`);
  return casoId;
}

// ═══ CASO A — se resuelve y NO se elige destino: queda de sujeto para C ═════
const casoA = await abrirYResolver(objetos[0], 'CASO A (queda esperando destino, para C)');

// ═══ CASO B — se resuelve Y se elige destino: dispara el segundo tipo ═══════
const casoB = await abrirYResolver(objetos[1], 'CASO B (se elige destino)');
const d = await sFam.rpc('caso_elegir_destino', { p_caso_id: casoB, p_destino: 'saldo' });
if (d.error || d.data?.ok === false) {
  console.error(`   🔴 caso_elegir_destino: ${d.error?.message ?? JSON.stringify(d.data)}`); process.exit(2);
}
console.log(`   destino elegido: ${JSON.stringify(d.data).slice(0, 160)}`);

// ═══ EL VEREDICTO — por el objeto, jamás por el `ok` de las RPCs ═══════════
console.log('\n── intenciones DESPUÉS ──');
let fallo = false;
for (const t of TIPOS) {
  const n = cuenta(t);
  const marca = n > antes[t] ? '✅' : '🔴';
  if (n <= antes[t]) fallo = true;
  console.log(`   ${marca} ${t.padEnd(30)} ${antes[t]} → ${n}`);
}
console.log('\n── qué DATOS llevan (es lo que decide el mapeo a {{1}}{{2}}{{3}}) ──');
for (const r of dbQuery(`
  select tipo, datos::text d from notificacion_intencion
   where tipo in (${TIPOS.map((t) => `'${t}'`).join(',')})
   order by created_at desc limit 2`)) console.log(`   ${r.tipo.padEnd(30)} ${r.d}`);

console.log(`\nsujeto NUEVO para C (esperando destino): ${casoA}`);
process.exit(fallo ? 1 : 0);
