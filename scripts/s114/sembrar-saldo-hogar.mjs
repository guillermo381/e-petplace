#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIEMBRA · saldo en la casa de la familia de prueba — S114-E (8-sep-2026)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **PARA QUÉ.** Que el botón «Pagar con saldo» del checkout de despensa se
 * DIBUJE durante el recorrido del founder. Su condición, literal de C
 * (`apps/cliente/src/app/(tabs)/despensa/checkout.tsx`):
 *
 *     saldo !== null && compraTotal !== null && saldo >= compraTotal
 *
 * ── 🔴 LA PREMISA ERA FALSA, Y SE DICE ANTES QUE NADA ────────────────────
 * El pedido decía *«sin saldo el botón no se dibuja»*. **Medido por el camino
 * real —`saldo_hogar_disponible` desde la sesión de `guillo381+8@gmail.com`,
 * no leyendo la tabla—: el saldo era 13.00 antes de correr esto.** Con ofertas
 * publicadas y con stock **desde $4.14**, el botón ya se dibujaba.
 *
 * *Lo que este script hace no es destrabar: es dar CABECERA*, para que una
 * compra de dos o tres ítems tampoco quede por encima del saldo.
 *
 * ── POR QUÉ POR `caso_elegir_destino` Y NO POR `acreditar_saldo_hogar` ───
 * Las dos son RPCs, y sólo una es **la puerta del producto**. `acreditar_saldo_hogar`
 * es la primitiva que el motor usa por dentro; la familia nunca la toca. **El
 * saldo del producto nace de un caso resuelto cuya devolución la familia manda
 * a la casa** (§7). *Sembrar por la primitiva fabricaría un saldo que ninguna
 * regla de destino tocó, y después se mide como si la hubiera pasado.*
 *
 * ── QUÉ CASO GASTA, Y POR QUÉ ÉSE ───────────────────────────────────────
 * Hay **dos casos gemelos** en `resuelto_entre_partes`, mismo motivo
 * (`duracion`), mismo monto (4.50), **sobre objetos distintos**, los dos con
 * `destino` sin elegir. Se gasta **uno solo**: el otro queda intacto como
 * sujeto de la pantalla de ELEGIR DESTINO de C. *Gastar una forma de la que hay
 * dos no le quita el sujeto a nadie; gastar la única sí.*
 *
 * ⚠️ **No toca** el caso de clase 1 con $23 pendiente de destino: es **otra
 * forma** (resuelto por el motor, sin paso por el prestador) y es el único de
 * la suya.
 *
 * ── ⚠️ ESTO ES SIEMBRA, NO TRÁFICO ──────────────────────────────────────
 * El movimiento queda con `origen_tipo='caso'` y su `clave_idempotencia`
 * `caso-saldo:<caso>`, o sea **trazable hasta el caso sembrado** (que lleva la
 * marca `[SIEMBRA S114-E]` en su relato). Censo:
 *
 *   select m.monto, m.origen_id from saldo_hogar_movimientos m
 *     join casos_postventa k on k.id = m.origen_id
 *    where k.relato like '[SIEMBRA S114-E]%';
 *
 * **Ningún número de acá es línea base.** Ningún dato de servicio de esta base
 * es real y producción es octubre.
 *
 * ── IDEMPOTENTE ─────────────────────────────────────────────────────────
 * Si el saldo ya supera el techo declarado, no gasta ningún caso: informa y
 * sale. *Un sembrador que no se pregunta si ya sembró no siembra: acumula.*
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { dbQuery } from '../lib-db.mjs';

const FAMILIA = 'guillo381+8@gmail.com';
/** Techo: por encima de esto no hace falta más cabecera para una compra chica. */
const SUFICIENTE = 15;

const env = Object.fromEntries(readFileSync('apps/cliente/.env.local', 'utf8')
  .split('\n').filter((l) => l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const cli = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } });
const { error: eLogin } = await cli.auth.signInWithPassword({
  email: FAMILIA,
  password: execFileSync('security',
    ['find-generic-password', '-a', 'siembra', '-s', 'epetplace-siembra-s97', '-w'],
    { encoding: 'utf8' }).trim(),
});
if (eLogin) { console.error(`🔴 login: ${eLogin.message}`); process.exit(2); }

const familiaId = dbQuery(`
  select fm.familia_id f from familia_miembro fm join auth.users u on u.id = fm.user_id
   where u.email = '${FAMILIA}' and fm.hasta is null limit 1`)[0].f;

const leerSaldo = async () => {
  const { data, error } = await cli.rpc('saldo_hogar_disponible', { p_familia: familiaId });
  if (error) { console.error(`🔴 saldo_hogar_disponible: ${error.message}`); process.exit(2); }
  return Number(data);
};

const antes = await leerSaldo();
console.log(`saldo ANTES (por el camino real): $${antes.toFixed(2)}`);

if (antes >= SUFICIENTE) {
  console.log(`↻ ya supera el techo de $${SUFICIENTE}: no gasto ningún caso.`);
} else {
  /* Un caso con monto, sin destino elegido, **del que haya más de uno de su
     misma forma** — para no dejar sin sujeto a la pantalla de C. */
  const cand = dbQuery(`
    with pend as (
      select id, motivo_codigo, monto_devuelto, clase, objeto_tipo, creado_en
        from casos_postventa
       where destino is null and monto_devuelto > 0
         and etapa in ('resuelto','resuelto_entre_partes'))
    select p.id, p.monto_devuelto, p.motivo_codigo,
           (select count(*) from pend q
             where q.motivo_codigo = p.motivo_codigo and q.clase = p.clase
               and q.objeto_tipo = p.objeto_tipo) as hermanos
      from pend p order by hermanos desc, p.creado_en asc limit 1`)[0];

  if (!cand) { console.error('🟠 no hay caso con monto y sin destino — no se fuerza.'); process.exit(2); }
  if (Number(cand.hermanos) < 2) {
    console.error(`🟠 el único candidato (${cand.id}) es el ÚNICO de su forma:`);
    console.error('   gastarlo le quitaría el sujeto a la pantalla de ELEGIR DESTINO. No se gasta.');
    process.exit(2);
  }
  console.log(`── gasto ${cand.id} ($${cand.monto_devuelto}, motivo ${cand.motivo_codigo}, ${cand.hermanos} de su forma) ──`);

  const { data, error } = await cli.rpc('caso_elegir_destino', { p_caso_id: cand.id, p_destino: 'saldo' });
  if (error || data?.ok === false) {
    console.error(`🔴 caso_elegir_destino: ${error?.message ?? JSON.stringify(data)}`); process.exit(2);
  }
  console.log(`   la puerta respondió: ${JSON.stringify(data).slice(0, 160)}`);
}

const despues = await leerSaldo();
console.log(`saldo DESPUÉS (por el camino real): $${despues.toFixed(2)}`);

/* Lo que decide si el botón se dibuja no es el saldo solo: es saldo >= total. */
const barata = dbQuery(`
  select min(o.precio) p from ofertas o where o.estado = 'publicada' and o.hay_stock`)[0]?.p;
console.log(`\noferta publicada con stock más barata: $${barata}`);
console.log(despues >= Number(barata)
  ? `✅ el botón «Pagar con saldo» se dibuja: $${despues.toFixed(2)} ≥ $${barata}`
  : `🔴 NO alcanza ni para la más barata — el botón no se va a dibujar.`);
console.log(`   (la condición de C es \`saldo >= compraTotal\`: con varios ítems, el total manda)`);
