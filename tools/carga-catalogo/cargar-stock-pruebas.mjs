// ═══════════════════════════════════════════════════════════════════════════
// S95-K.3 · STOCK DE PRUEBA PARA LOS SEIS
//
// 🔴 POR FUNCIÓN, NUNCA POR INSERT DIRECTO. `ajustar_stock_vendedor()` valida
// quién llama, exige motivo y escribe al ledger append-only; el saldo lo
// materializa el trigger. *El inventario es plata: la autorización y el motivo
// pertenecen al servidor, no a un `if` de este script.*
//
// 🔴 MARCADO COMO DATO DE PRUEBA en el motivo, igual que la cuenta. **El stock
// real lo da el vendedor en la planilla que ya tiene** — esto existe para que
// el camino de compra se pueda recorrer, no para simular su inventario.
//
// Idempotente: lleva cada SKU AL objetivo, no le suma cada vez que corre.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TMP = mkdtempSync(join(tmpdir(), 'stock-'));
let seq = 0;
function sql(texto) {
  const f = join(TMP, `q${seq++}.sql`);
  writeFileSync(f, texto);
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', '--file', f],
    { encoding: 'utf8' });
  const s = r.stdout || '';
  const i = s.indexOf('{');
  if (r.status !== 0 || i === -1) {
    const crudo = (r.stdout || '') + (r.stderr || '');
    const m = crudo.match(/ERROR:\s*[0-9A-Z]+:\s*([^\\"]+)/);
    throw new Error(m ? m[1].trim() : crudo.slice(0, 400).trim());
  }
  return JSON.parse(s.slice(i)).rows;
}

const OBJETIVO = 20;
const MOTIVO = 'STOCK DE PRUEBA S95-K — NO ES INVENTARIO REAL DEL VENDEDOR';

const skus = sql(`
  SELECT vs.id, vs.sku_vendedor, vs.stock_disponible, vs.cuenta_comercial_id,
         cc.owner_profile_id titular
  FROM vendedor_skus vs
  JOIN cuentas_comerciales cc ON cc.id = vs.cuenta_comercial_id
  WHERE vs.sku_vendedor LIKE 'PRUEBA-%'
  ORDER BY vs.sku_vendedor`);

if (skus.length === 0) {
  console.log('✗ No hay SKUs de prueba. ¿Se cargó la semilla?');
  process.exit(1);
}

console.log(`\n═══ STOCK DE PRUEBA · objetivo ${OBJETIVO} por SKU ═══\n`);
for (const s of skus) {
  const delta = OBJETIVO - Number(s.stock_disponible);
  if (delta === 0) {
    console.log(`· ${s.sku_vendedor} ya está en ${OBJETIVO}`);
    continue;
  }
  const r = sql(`
    SELECT set_config('request.jwt.claims','{"sub":"${s.titular}","role":"authenticated"}',false);
    SELECT ajustar_stock_vendedor('${s.id}', ${delta}, '${MOTIVO}') r;`)[0].r;
  console.log(`✅ ${s.sku_vendedor}  ${s.stock_disponible} → ${r.stock_disponible}  (${delta > 0 ? '+' : ''}${delta})`);
}

console.log('\n─── saldo final ───');
for (const s of sql(`SELECT sku_vendedor, stock_disponible, stock_reservado
                     FROM vendedor_skus WHERE sku_vendedor LIKE 'PRUEBA-%'
                     ORDER BY sku_vendedor`)) {
  console.log(`   ${s.sku_vendedor}  disponible ${s.stock_disponible} · reservado ${s.stock_reservado}`);
}
console.log('');
