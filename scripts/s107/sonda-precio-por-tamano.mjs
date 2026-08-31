/**
 * S107-C · **EL PRECIO DE CADA TAMAÑO, VERIFICADO CONTRA EL RENDER.**
 *
 * 🔴 Nace de un error propio: curé el precio del paquete **sin verificarlo en
 * la pantalla** y el resultado fue peor que el defecto —de mostrar el precio
 * equivocado a no mostrar ninguno—. *Leer el código no alcanza cuando lo que
 * está mal es lo que se ve.*
 */
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { porDato, tocar, claveAnon } from './sonda-tocar.mjs';

const REF = 'zyltipqscdsdsxnjclhp';
const CLAVE = execFileSync('security', ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'], {encoding:'utf8'}).trim();
/* 🔒 Por el CLAIM, no por el orden — ver `claveAnon` en `sonda-tocar.mjs`.
   El regex que había acá acertaba porque `anon` sale primera HOY. */
const ANON = claveAnon(REF);
const sb = createClient(`https://${REF}.supabase.co`, ANON);
const { data: s } = await sb.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password: CLAVE });
const { data: m } = await sb.from('mascotas').select('id').eq('nombre','Thor').limit(1);

/* La VERDAD contra la que se compara, leída del motor. */
const { data: pr } = await sb.rpc('obtener_guarderias_disponibles',
  { p_fecha: '2026-08-31', p_mascota_id: m[0].id, p_modalidad: 'paquete' });
const esperado = {};
for (const g of pr ?? []) {
  const { data: ps } = await sb.rpc('obtener_paquetes_guarderia', { p_prestador_id: g.prestador_id });
  for (const p of ps ?? []) if (p.activo && (esperado[p.tamano] === undefined || p.precio < esperado[p.tamano])) esperado[p.tamano] = p.precio;
}
console.log('esperado del motor:', JSON.stringify(esperado));

const b = await chromium.launch({ channel:'chrome', headless:true });
const pg = await b.newPage({ viewport:{ width:430, height:932 } });
await pg.goto('http://localhost:8091/bienvenida', { waitUntil:'domcontentloaded' });
await pg.evaluate(([k,v]) => localStorage.setItem(k,v), [`sb-${REF}-auth-token`, JSON.stringify(s.session)]);
await pg.goto(`http://localhost:8091/explorar/guarderia?mascotaId=${m[0].id}&mascotaNombre=Thor`, { waitUntil:'networkidle', timeout:60000 });
await pg.waitForTimeout(2500);

/* ⏪ **EL ORDEN SE INVIRTIÓ** (enmienda firmada, 29-ago): antes había que tocar
   un tamaño ANTES de la fecha, y ese primer toque era **a ciegas** porque los
   precios sólo existen con fecha. *Ahora: modalidad → fecha → tamaños, ya con
   su precio.* **Esta sonda es el control de que el ciego desapareció: si los
   chips no tuvieran precio acá, el orden no se habría invertido de verdad.** */
await tocar(pg, porDato(pg, 'Pack'), 'el segmento Paquete');
await tocar(pg, porDato(pg, '31'), 'el día 31');
await pg.waitForTimeout(3000);

const txt = (await pg.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
console.log('\nRENDER:', txt.slice(0, 420));

let fallos = 0;
for (const [tam, precio] of Object.entries(esperado)) {
  const marca = `${tam} · from $${precio.toFixed(2)}`;
  const marcaEs = `${tam} · desde $${precio.toFixed(2)}`;
  const ok = txt.includes(marca) || txt.includes(marcaEs);
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '🔴'} tamaño ${tam}: esperaba «${marca}»`);
}
await b.close(); await sb.auth.signOut();
console.log(fallos === 0 ? '\n✓ cada chip muestra SU precio' : `\n✗ ${fallos} chip(s) sin su precio`);
process.exit(fallos === 0 ? 0 : 1);
