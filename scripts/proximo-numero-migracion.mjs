#!/usr/bin/env node
/**
 * S109-A · EL NÚMERO DE MIGRACIÓN SE PIDE, NO SE ELIGE.
 *
 * ═══ POR QUÉ EXISTE — cinco colisiones en UNA sesión ═══════════════════════
 * Con cuatro pistas en vuelo, cinco veces dos migraciones nacieron con el mismo
 * número. La quinta pasó **en silencio** por un `ON CONFLICT DO NOTHING`.
 *
 * 🔴 **Y la medición dice que no es azar:** de las migraciones del repo, el
 * **99 % tiene los segundos en `00`** y el **98 % los minutos redondos**. Los
 * números **no salen de un reloj: se eligen a mano** — y `…220000`, `…240000`
 * son el próximo obvio para todos. *Dos pistas no chocan por mala suerte:
 * chocan porque eligen del mismo cajón.*
 *
 * ⇒ **Verificar el número que elegiste es la respuesta chica.** La grande es
 * que no lo elijas: este comando **te lo da**, tomando el máximo entre el
 * directorio y el ledger remoto y sumando un paso.
 * *Si la pista nunca elige, no puede elegir uno tomado* — `L-439`: un atajo que
 * puede producir un valor equivocado se hace inexpresable.
 *
 * ═══ 🔴 SU PUNTO CIEGO, Y VIVE ACÁ A PROPÓSITO ════════════════════════════
 * **Un número que otra pista ya ESCRIBIÓ en su worktree y todavía NO APLICÓ es
 * invisible para el directorio y para el ledger** — este comando no lo ve, y
 * ninguna verificación previa lo vería. Sólo lo cerraría una reserva
 * compartida, que es coordinación y no script.
 * *Se declara en el comando y no en un documento para que lo sepa el que lo
 * corre, sin tener que acordarse.*
 * (Dato del arco: las cinco colisiones fueron contra números ya APLICADOS ⇒
 * este comando las habría cazado a las cinco.)
 *
 * USO:  node scripts/proximo-numero-migracion.mjs [--paso 20000]
 * L-197: si no puede leer el ledger, sale ROJO — jamás un número a medias.
 */
import { readdirSync } from 'node:fs';
import { dbQuery } from './lib-db.mjs';

const DIR = 'supabase/migrations';
const iP = process.argv.indexOf('--paso');
const PASO = iP > -1 ? Number(process.argv[iP + 1]) : 20000;
const di = (s) => process.stdout.write(s + '\n');

const locales = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => f.split('_')[0])
  .filter((v) => /^\d{14}$/.test(v));

let remotas = [];
try {
  remotas = dbQuery('select version from supabase_migrations.schema_migrations')
    .map((r) => String(r.version));
} catch (e) {
  di('🔴 NO SE PUDO LEER EL LEDGER — no se da un número a medias (L-197).');
  di(`   ${e.message}`);
  di('   Un número calculado sólo contra el directorio ignora lo que otra pista');
  di('   ya aplicó, que es exactamente la colisión que este comando evita.');
  process.exit(1);
}

const todas = [...locales, ...remotas].map(Number).filter(Number.isFinite);
if (!todas.length) { di('🔴 no se encontró ninguna migración — el comando no mide nada.'); process.exit(1); }

const tope = Math.max(...todas);
const proximo = String(tope + PASO).padStart(14, '0');

di(proximo);
di('');
di(`· tope medido: ${tope}  (directorio ${locales.length} · ledger ${remotas.length})`);
const soloRemoto = remotas.filter((v) => !locales.includes(v));
if (soloRemoto.length) {
  di(`· ${soloRemoto.length} versión(es) aplicadas por otra pista y sin archivo local — CONTADAS: ${soloRemoto.join(', ')}`);
}
di('');
di('⚠️  PUNTO CIEGO, y no se puede cerrar desde acá: un número que otra pista');
di('   ESCRIBIÓ y todavía NO APLICÓ no está ni en el directorio ni en el ledger.');
di('   Este comando no lo ve. Si sabés que hay otra pista escribiendo migraciones');
di('   en este momento, decíselo — es lo único que cierra ese hueco.');
