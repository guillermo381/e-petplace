/**
 * S107-C · **EL CAMINO DEL DEDO, ENTERO** — hub → pagar → confirmación.
 *
 * 🔴 Nace de que **el founder nunca pudo comprar ni reservar**, y de que mi
 * corrida en subtransacción probó **el MOTOR, no el camino**. *Un motor verde
 * con un camino cortado es exactamente un verde que no sirve.*
 *
 * Reporta **el paso donde deja de funcionar**, no «funciona».
 *
 * ═══ ⚠️ HASTA DÓNDE LLEGA HOY, Y POR QUÉ — leelo ANTES de leer su salida ═══
 *
 * **Recorre hasta el PASO 5 (tocar el lugar) y ahí se detiene**, con
 * *«el control «día 31 del calendario» NO EXISTE»*.
 *
 * 🔴 **ESO ES UN LÍMITE DEL INSTRUMENTO, NO UN DEFECTO DEL PRODUCTO.** El
 * calendario del lugar renderiza sus días de una forma que este localizador no
 * alcanza, y RN-web deja montadas las pantallas anteriores del stack, así que
 * el mismo número existe varias veces.
 *
 * **Los pasos 6 y 7 SÍ están medidos, por otra vía** (llamada directa a los RPC
 * con la sesión de la familia, 29-ago):
 *   · `reservar_dia_guarderia`    → 🔴 `documentos_no_disponibles`
 *   · `comprar_paquete_guarderia` → ✓ compró **(saltea el gate — ver el pedido)**
 *
 * *Se declara acá y no en un parte porque el que corre una sonda no lee partes:
 * lee su salida.* **Un instrumento que se corta y no dice de quién es la culpa
 * es la clase de defecto que esta pista pasó el día cazando.**
 */
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { porClave, porDato } from './sonda-tocar.mjs';

const REF = 'zyltipqscdsdsxnjclhp';
const CLAVE = execFileSync('security', ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'], {encoding:'utf8'}).trim();
const ANON = execFileSync('npx',['supabase','projects','api-keys','--project-ref',REF],{encoding:'utf8'}).match(/"api_key":"(eyJ[^"]*)"/)?.[1];
const sb = createClient(`https://${REF}.supabase.co`, ANON);
const { data: s } = await sb.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password: CLAVE });

const b = await chromium.launch({ channel:'chrome', headless:true });
const pg = await b.newPage({ viewport:{ width:430, height:932 } });
await pg.goto('http://localhost:8091/bienvenida', { waitUntil:'domcontentloaded' });
await pg.evaluate(([k,v]) => localStorage.setItem(k,v), [`sb-${REF}-auth-token`, JSON.stringify(s.session)]);

const txt = async () => (await pg.evaluate(() => document.body.innerText)).replace(/\s+/g,' ').trim();
let paso = 0;
const PASO = async (nombre, accion) => {
  paso++;
  try {
    await accion();
    await pg.waitForTimeout(2500);
    console.log(`✓ ${paso}. ${nombre}\n     ruta: ${new URL(pg.url()).pathname}\n     ve:  ${(await txt()).slice(0,220)}`);
    return true;
  } catch (e) {
    console.log(`\n🔴 SE CORTA EN EL PASO ${paso}: ${nombre}`);
    console.log(`   motivo: ${String(e.message).split('\n')[0]}`);
    console.log(`   ruta:   ${new URL(pg.url()).pathname}`);
    console.log(`   en pantalla: ${(await txt()).slice(0,400)}`);
    return false;
  }
};

/* 🔴 **SÓLO LO VISIBLE.** RN-web deja montadas las pantallas anteriores del
   stack, así que un mismo texto existe varias veces y `.first()` puede tomar
   uno **de una pantalla que ya no se ve**. *La sonda decía «no es visible»
   sobre un control que sí estaba — midiendo el nodo equivocado.* */
const visible = (loc) => loc.locator('visible=true');

const toca = (loc0, nombre) => async () => {
  const loc = visible(loc0);
  const n = await loc.count().catch(()=>0);
  if (n === 0) throw new Error(`el control «${nombre}» NO EXISTE en pantalla`);
  const box = await loc.first().boundingBox();
  const alto = await pg.evaluate(()=>window.innerHeight);
  if (box && box.y > alto) throw new Error(`«${nombre}» está FUERA DE PANTALLA (y=${box.y.toFixed(0)} > ${alto})`);
  const dis = await loc.first().evaluate((el) => (el.closest('[aria-disabled]')?.getAttribute('aria-disabled')) ?? 'no');
  if (dis === 'true') throw new Error(`«${nombre}» está DESHABILITADO`);
  await loc.first().click({ force: true });
};

await pg.goto('http://localhost:8091/hogar/guarderia', { waitUntil:'networkidle', timeout:60000 });
await pg.waitForTimeout(2500);
console.log(`✓ 0. el hub\n     ve:  ${(await txt()).slice(0,220)}`);

const ok1 = await PASO('elegir la mascota (chip)', toca(pg.getByText('Thor', { exact:true }), 'chip Thor'));
if (ok1) {
  const ok2 = await PASO('tocar «Reservar una estadía»', toca(porClave(pg,'logGuarderia.reservarDe').localizador, 'CTA del hub (con mascota elegida)'));
  if (ok2) {
    const ok3 = await PASO('elegir un día', toca(porDato(pg, /^31$/), 'día 31'));
    if (ok3) {
      const ok4 = await PASO('«Ver quién puede»', toca(porClave(pg,'elegirGuarderia.verQuienPuede').localizador, 'botón ver quién puede'));
      if (ok4) {
        const ok5 = await PASO('tocar Clínica Aurora', toca(pg.getByText('Aurora', { exact:false }), 'la fila del lugar'));
        if (ok5) {
          const ok6 = await PASO('elegir el día en el calendario del lugar', toca(porDato(pg, /^31$/), 'día 31 del calendario'));
          if (ok6) await PASO('PAGAR / reservar', toca(porClave(pg,'lugarGuarderia.reservar').localizador, 'CTA de reservar'));
        }
      }
    }
  }
}
await b.close(); await sb.auth.signOut();
