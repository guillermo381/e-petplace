/**
 * S92-A · B3+B4 — EL VERDE, con sus dos brazos.
 *
 * BRAZO ① lo cerrado rebota · BRAZO ② lo que DEBE seguir andando, anda —
 * y acá el brazo ② es el que más importa de toda la sesión, porque incluye
 * **la lectura de catálogos SIN SESIÓN que sostiene la pantalla de registro**.
 * Si eso se rompe, nadie puede crear una cuenta y ningún typecheck avisa.
 *
 * Corre: node scripts/s92/b34-verde.mjs
 */

import { rest, sql, guardar, linea } from './lib-s92.mjs';

const filas = [];
const anotar = (id, pregunta, obtenido, ok) => {
  filas.push({ id, pregunta, obtenido, ok });
  linea(`  ${ok ? '✅' : '🔴'} ${id.padEnd(44)} ${obtenido}`);
};

linea('\n══ B3+B4 · EL VERDE ══\n');
linea('BRAZO ① — lo cerrado REBOTA (camino real, sin sesión)\n');

// ① la traza
{
  const r = await rest('/rest/v1/_traza_promocion_e164?select=id,valor_despues&limit=5');
  const vacio = r.cuerpo.trim() === '[]';
  anotar('anon lee la traza', 'la que devolvía teléfonos E.164 reales',
    r.status >= 400 ? `REBOTA ${r.status}` : vacio ? 'HTTP 200 · VACÍO (RLS sin policies)' : `⚠️ ${r.cuerpo.slice(0, 60)}`,
    r.status >= 400 || vacio);
}

// ⑤ escritura de catálogos — se intenta DE VERDAD (un DELETE que rebota no borra nada)
for (const tabla of ['cat_bancos', 'cat_paises', 'cat_tipos_documento_titular']) {
  const r = await rest(`/rest/v1/${tabla}?id=eq.00000000-0000-0000-0000-000000000000`, { metodo: 'DELETE' });
  anotar(`anon DELETE ${tabla}`, 'S90 midió que borraba 17 y 23 filas de verdad',
    r.status >= 400 ? `REBOTA ${r.status}` : `⚠️ HTTP ${r.status}`, r.status >= 400);
}

// ⑨ audit_log
{
  const r = await rest('/rest/v1/audit_log', { metodo: 'POST', cuerpo: { accion: 's92-probe' } });
  anotar('anon INSERT audit_log', 'un audit log que el auditado escribe no es un audit log',
    r.status >= 400 ? `REBOTA ${r.status}` : `⚠️ HTTP ${r.status}`, r.status >= 400);
}

// ⑥ consentimientos: el DELETE se va, el INSERT SE CONSERVA
{
  const rd = await rest('/rest/v1/consentimientos?id=eq.00000000-0000-0000-0000-000000000000', { metodo: 'DELETE' });
  anotar('anon DELETE consentimientos', 'un consentimiento no se borra',
    rd.status >= 400 ? `REBOTA ${rd.status}` : `⚠️ HTTP ${rd.status}`, rd.status >= 400);
}

linea('\nBRAZO ② — lo que DEBE seguir andando  ← el registro depende de esto\n');

for (const tabla of ['cat_bancos', 'cat_paises', 'cat_tipos_documento_titular']) {
  const r = await rest(`/rest/v1/${tabla}?select=*&limit=2`);
  const conFilas = r.status === 200 && r.cuerpo.trim() !== '[]';
  anotar(`anon LEE ${tabla}`, 'la pantalla de registro lo lee SIN sesión — la trampa declarada de S90',
    conFilas ? 'HTTP 200 · con filas' : `⚠️ HTTP ${r.status} ${r.cuerpo.slice(0, 40)}`, conFilas);
}

// las RPC de catálogo que consume el wrapper de cuenta comercial
for (const [fn, args] of [['get_paises_activos', {}], ['get_bancos_activos_por_pais', { p_country_code: 'EC' }]]) {
  const r = await rest(`/rest/v1/rpc/${fn}`, { metodo: 'POST', cuerpo: args });
  anotar(`RPC ${fn}`, 'los lectores de catálogo del alta de cuenta comercial', `HTTP ${r.status}`, r.status === 200);
}

// y las 14 filas siguen ahí: esta migración NO borra datos
{
  const n = await sql(`SELECT count(*)::int AS n FROM public._traza_promocion_e164`, 'b34-filas');
  anotar('traza · filas intactas', 'cerrar la puerta no es borrar el dato (freno 3)',
    `${n[0].n} filas (eran 14)`, n[0].n === 14);
}

guardar('b34-verde.json', filas);
const rojos = filas.filter((f) => !f.ok);
linea(`\n── ${filas.length} pruebas · ${filas.length - rojos.length} verdes · ${rojos.length} rojas ──`);
if (rojos.length) for (const r of rojos) linea(`   🔴 ${r.id}: ${r.obtenido}`);
linea('');
