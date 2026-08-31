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
 *   · `reservar_dia_guarderia`    → `documentos_no_disponibles`
 *   · `comprar_paquete_guarderia` → ✓ compró **salteando el gate**
 *
 * ✅ **Las dos líneas ya están atendidas y su lectura CAMBIÓ:**
 *   · el salteo lo cerró A (`20260831020000`): las tres puertas gatean igual.
 *   · 🔴 **`documentos_no_disponibles` NO es un defecto: es el estado NORMAL**
 *     del frente hasta que existan los seis textos legales (`D-977`). *Si esta
 *     sonda te lo devuelve, no encontraste un bug.*
 *
 * ── LA REGLA QUE ESTA SONDA ES (firma del founder, sobre un error mío) ───
 * > *«Medir una pantalla por su ruta directa contesta **¿esta pantalla anda?**,
 * > no **¿se puede comprar?**. Toda sonda tuya de acá en más entra por donde
 * > entra el dedo.»*
 *
 * Tres sondas midieron **bien** pantallas que el dedo nunca alcanzaba. Ninguna
 * mintió; todas contestaron una pregunta que nadie había hecho.
 *
 * *Se declara acá y no en un parte porque el que corre una sonda no lee partes:
 * lee su salida.* **Un instrumento que se corta y no dice de quién es la culpa
 * es la clase de defecto que esta pista pasó el día cazando.**
 */
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { porClave, porDato, claveAnon } from './sonda-tocar.mjs';

const REF = 'zyltipqscdsdsxnjclhp';
const CLAVE = execFileSync('security', ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'], {encoding:'utf8'}).trim();
/* 🔒 Por el CLAIM, no por el orden — ver `claveAnon` en `sonda-tocar.mjs`.
   El regex que había acá acertaba porque `anon` sale primera HOY. */
const ANON = claveAnon(REF);
const sb = createClient(`https://${REF}.supabase.co`, ANON);
const { data: s } = await sb.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password: CLAVE });

const b = await chromium.launch({ channel:'chrome', headless:true });
const pg = await b.newPage({ viewport:{ width:430, height:932 } });
/* Techo corto a propósito: una sonda que espera 30 s por control no reporta
   «no está», reporta nada — y quien la corre no sabe si colgó o si falló. */
pg.setDefaultTimeout(8000);
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
    /* ⏪ **ANTES ERA `porDato(/^31$/)` — el día 31, tecleado.** Frágil por dos
       lados: un mes de 30 no lo tiene, y **el 31 caía en lunes por
       casualidad**. Al cambiarlo por «el primero de la tira» la sonda se cortó
       ANTES —domingo, y el lugar abre L-V—, o sea que *el instrumento acertaba
       por el mismo azar que el resto de la pista vino cazando*.
       Ahora **el dedo hace lo que hace un dedo: prueba hasta que el botón se
       enciende**, y si ninguno lo enciende lo dice con los días que probó. */
    const ok3 = await PASO('elegir un día que habilite el botón', async () => {
      const dias = await visible(pg.getByRole('radio', { name: /^\w+ \d+$/ })).all();
      if (dias.length === 0) throw new Error('la tira de días NO EXISTE en pantalla');
      const probados = [];
      for (const d of dias) {
        const etq = await d.getAttribute('aria-label');
        await d.click({ force: true });
        await pg.waitForTimeout(2000);
        const apagado = await visible(porClave(pg, 'elegirGuarderia.verQuienPuede').localizador)
          .first().evaluate((el) => (el.closest('[role="button"]') ?? el).getAttribute('aria-disabled'));
        if (apagado !== 'true') { console.log(`     (probó ${probados.length + 1}: ${etq} — habilita)`); return; }
        probados.push(etq);
      }
      throw new Error(`NINGUNO de los ${probados.length} días habilita el botón: ${probados.join(', ')}`);
    });
    if (ok3) {
      const ok4 = await PASO('«Ver quién puede»', toca(porClave(pg,'elegirGuarderia.verQuienPuede').localizador, 'botón ver quién puede'));
      if (ok4) {
        const ok5 = await PASO('tocar Clínica Aurora', toca(pg.getByText('Aurora', { exact:false }), 'la fila del lugar'));
        if (ok5) {
          /* Mismo criterio que el paso 3: el día se elige por lo que ADMITE,
             no por su número. El calendario del lugar marca sus días con
             `aria-disabled`, así que acá el dedo sí puede ver cuál sirve. */
          const ok6 = await PASO('elegir un día en el calendario del lugar', async () => {
            const dias = visible(pg.getByRole('radio')).filter({ hasNotText: /^$/ });
            const libres = await visible(pg.locator('[role="radio"]:not([aria-disabled="true"])'))
              .filter({ hasText: /\d/ }).all();
            if (libres.length === 0) {
              const total = await dias.count();
              throw new Error(`el calendario tiene ${total} días y NINGUNO es elegible`);
            }
            await libres[libres.length - 1].click({ force: true });
          });
          if (ok6) await PASO('PAGAR / reservar', toca(porClave(pg,'lugarGuarderia.reservar').localizador, 'CTA de reservar'));
        }
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   EL SEGUNDO BRAZO · **EL CAMINO DEL PAQUETE**, que es el que el founder
   nunca vio entero: comprar → primera sesión → volver al hub → «te quedan N»
   → agendar la segunda contra saldo.
   ═══════════════════════════════════════════════════════════════════════════ */
console.log('\n───────────── EL CAMINO DEL PAQUETE ─────────────');
paso = 0;
/* ⏪ `domcontentloaded` y no `networkidle`: con la app ya andando quedan
   sondeos abiertos y `networkidle` NO VUELVE NUNCA — la sonda se colgaba
   entera después del primer brazo, sin decir por qué. */
await pg.goto('http://localhost:8091/hogar/guarderia', { waitUntil:'domcontentloaded', timeout:60000 });
await pg.waitForTimeout(4000);

const okP1 = await PASO('elegir la mascota', toca(pg.getByText('Thor', { exact:true }), 'chip Thor'));
if (okP1) {
  const okP2 = await PASO('«Reservar una estadía»', toca(porClave(pg,'logGuarderia.reservarDe').localizador, 'CTA del hub'));
  if (okP2) {
    const okP3 = await PASO('cambiar la modalidad a «Paquete»', toca(porClave(pg,'modalidadGuarderia.paquete').localizador, 'segmento Paquete'));
    if (okP3) {
      /* 🔴 EN PAQUETE EL BOTÓN EXIGE DOS COSAS, NO UNA: el día **y** el
         tamaño. La primera versión de este brazo chequeaba el botón después
         de cada día **sin haber elegido tamaño**, y reportó *«ninguno de los
         14 días habilita»* — cierto, y por el motivo equivocado.
         *Un instrumento que mide un gate sin cumplir todas sus condiciones
         no reporta el gate: reporta su propio orden.*
         Ahora hace lo que hace un dedo: elige el día, elige el tamaño, y
         recién ahí mira el botón. */
      const okP4 = await PASO('elegir día + tamaño hasta que el botón encienda', async () => {
        const dias = await visible(pg.getByRole('radio', { name: /^\w+ \d+$/ })).all();
        if (dias.length === 0) throw new Error('la tira de días NO EXISTE');
        const probados = [];
        for (const d of dias) {
          const etq = await d.getAttribute('aria-label');
          await d.click({ force:true }); await pg.waitForTimeout(1800);
          const chips = await visible(pg.getByRole('radio', { name: /opción|option/i })).all();
          if (chips.length === 0) { probados.push(`${etq}(sin tamaños)`); continue; }
          /* La VOZ de los chips se reporta siempre: es donde se ve si el
             precio por tamaño llegó o si quedaron mudos. */
          const voces = await Promise.all(chips.map((c)=>c.getAttribute('aria-label')));
          await chips[0].click({ force:true }); await pg.waitForTimeout(1800);
          const apagado = await visible(porClave(pg,'elegirGuarderia.verQuienPuede').localizador)
            .first().evaluate((el)=>(el.closest('[role="button"]')??el).getAttribute('aria-disabled'));
          if (apagado !== 'true') { console.log(`     (día ${etq} · tamaños: ${voces.join(' | ')})`); return; }
          probados.push(`${etq}[${voces.join('|')}]`);
        }
        throw new Error(`ningún día+tamaño habilita: ${probados.join(' · ')}`);
      });
      if (okP4) {
          const okP6 = await PASO('«Ver quién puede»', toca(porClave(pg,'elegirGuarderia.verQuienPuede').localizador, 'ver quién puede'));
          if (okP6) {
            const okP7 = await PASO('tocar Clínica Aurora', toca(pg.getByText('Aurora',{exact:false}), 'la fila del lugar'));
            if (okP7) {
              const okP8 = await PASO('elegir un día en el calendario del lugar', async () => {
                const libres = await visible(pg.locator('[role="radio"]:not([aria-disabled="true"])')).filter({ hasText:/\d/ }).all();
                if (libres.length === 0) throw new Error('el calendario no tiene ningún día elegible');
                await libres[libres.length-1].click({ force:true });
              });
              if (okP8) await PASO('COMPRAR el paquete', toca(porClave(pg,'lugarGuarderia.reservar').localizador, 'CTA de comprar'));
            }
          }
      }
    }
  }
}

await b.close(); await sb.auth.signOut();
