/**
 * S107-C · SONDA DE LA SECUENCIA — **qué ve el founder antes y después de
 * elegir un día**, con datos reales.
 *
 * Nació de una pregunta que no se podía contestar leyendo código: *«la pantalla
 * se ve casi toda pendiente — ¿es la compuerta o falta trabajo?»*
 *
 * ── ⚠️ LA LECCIÓN DE SU PRIMERA CORRIDA, escrita porque casi reporto mal ──
 * La primera versión tocaba un nodo con texto `«mon 31»` **que no existe**:
 * `SelectorDia` pinta el día y el número en **nodos separados**. El toque no
 * pasaba y la pantalla no cambiaba ⇒ **parecía un defecto de la pantalla y era
 * de la sonda.**
 * 🔴 **Por eso imprime si encontró el nodo ANTES de tocarlo:** *un instrumento
 * que no puede distinguir «no pasó nada» de «no hice nada» no mide, adivina.*
 *
 * 🔴 **SÓLO LEE.** Toca el selector de día —que dispara un LECTOR— y nada más.
 * No reserva, no paga, no escribe. */
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { tocar } from './sonda-tocar.mjs';
const REF = 'zyltipqscdsdsxnjclhp';
const CLAVE = execFileSync('security', ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'], {encoding:'utf8'}).trim();
const ANON = execFileSync('npx',['supabase','projects','api-keys','--project-ref',REF],{encoding:'utf8'}).match(/"api_key":"(eyJ[^"]*)"/)?.[1];
const sb = createClient(`https://${REF}.supabase.co`, ANON);
const { data } = await sb.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password: CLAVE });
const b = await chromium.launch({ channel:'chrome', headless:true });
const p = await b.newPage({ viewport:{ width:430, height:932 } });
await p.goto('http://localhost:8091/bienvenida', { waitUntil:'domcontentloaded' });
await p.evaluate(([k,v]) => localStorage.setItem(k,v), [`sb-${REF}-auth-token`, JSON.stringify(data.session)]);
/* Thor, para que la mascota viaje como viaja desde el hub. */
const { data: m } = await sb.from('mascotas').select('id,nombre').eq('nombre','Thor').limit(1);
const mid = m?.[0]?.id ?? '';
await p.goto(`http://localhost:8091/explorar/guarderia?mascotaId=${mid}&mascotaNombre=Thor`, { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(2500);
console.log('── ANTES de elegir día ──\n' + (await p.evaluate(()=>document.body.innerText)).replace(/\s+/g,' ').trim().slice(0,500));
/* 🔴 CON DISCRIMINADOR: si el toque no cambia NADA, no sé si el defecto es de
   la pantalla o de mi sonda. Se busca el nodo por su texto exacto y se verifica
   que el click ocurrió. */
/* `SelectorDia` pinta el día y el número en NODOS SEPARADOS — por eso «mon 31»
   como texto exacto no existe. Se busca el número.
   🔴 El discriminador ya no se escribe acá: vive en `tocar()`, que **no deja
   tocar sin verificar** y lanza si el nodo no está. */
const { cambio } = await tocar(p, p.getByText('31', { exact: true }).first(), '31');
console.log(`\n[sonda] toque emitido · ¿la pantalla cambió? ${cambio ? 'SÍ' : 'NO'}`);
console.log('\n── DESPUÉS de elegir día ──\n' + (await p.evaluate(()=>document.body.innerText)).replace(/\s+/g,' ').trim().slice(0,900));
await b.close(); await sb.auth.signOut();
