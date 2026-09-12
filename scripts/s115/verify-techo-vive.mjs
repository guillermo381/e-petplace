#!/usr/bin/env node
/**
 * `D-1080` · EL ROJO DE LA PERILLA: que cambiar el valor en `app_config`
 * CAMBIE DE VERDAD EL TECHO.
 *
 * 🔴 POR QUÉ ESTE GATE Y NO UNA LÍNEA DE CÓDIGO CONFIADA. `cargarTechosDeRed`
 *    existía, estaba exportada, compilaba, y **no la llamaba nadie**. Un gate
 *    que sólo verifique «la función existe» habría dado verde todo este tiempo.
 *    *Lo que hay que medir no es que la pieza esté: es que mover el dato mueva
 *    el comportamiento.*
 *
 * 🔴 Y SU CONTROL POSITIVO, que es la mitad que decide (L-459): antes de
 *    aplicar nada se afirma que el techo vale lo del ARRANQUE. Sin eso, un
 *    verde podría venir de que el valor de prueba coincidiera por casualidad
 *    con el que ya regía.
 *
 * ⚠️ EXIGE SESIÓN REAL: `app_config` es legible por `authenticated` y **no por
 *    `anon`** (medido: 4 filas contra 0). Un gate sin login mediría el caso
 *    equivocado y saldría en falso.
 *
 * Exit: 0 sano · 1 rojo · 2 no concluyente (L-533).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const VALOR_DE_PRUEBA = 7777;      // distinto de los 8000 del arranque, a propósito
const CLAVE = 'red_techo_lectura_ms';

/**
 * 🔴 `process.exit()` SE SALTA EL `finally` — y este arnés se lo cobró a sí
 *    mismo en su primera corrida: dejó `red_techo_lectura_ms` en 7777 en la
 *    base compartida. *Una sonda que deja residuo contamina la medición ajena*,
 *    y acá el residuo era un techo de red movido para todo el que midiera
 *    después.
 *
 *    Por eso no se sale desde adentro: se LANZA con el veredicto pegado, el
 *    `finally` restaura, y recién entonces el proceso termina. **La limpieza no
 *    puede depender de por dónde salga el control.**
 */
class Veredicto extends Error {
  constructor(codigo, mensaje) { super(mensaje); this.codigo = codigo; }
}
const sal = (c, m) => { throw new Veredicto(c, m); };
const noConcluyente = (m) => sal(2, `\n  ⚠️  NO CONCLUYENTE — ${m}\n`);

function llavero(servicio) {
  try {
    return execFileSync('security',
      ['find-generic-password', '-s', servicio, '-w'], { encoding: 'utf8' }).trim();
  } catch { return null; }
}
function cuentaDePrueba() {
  /* El email vive en `acct`, no en el secreto (`-w` da sólo la mitad). */
  let acct = null;
  try {
    const salida = execFileSync('security',
      ['find-generic-password', '-s', 'epetplace-cuenta-prueba'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    acct = (salida.match(/"acct"<blob>="([^"]+)"/) ?? [])[1] ?? null;
  } catch { /* lo dice abajo */ }
  const clave = llavero('epetplace-cuenta-prueba');
  return acct && clave ? { email: acct, clave } : null;
}

function sql(texto) {
  const f = `/tmp/techo-vive-${process.pid}.sql`;
  execFileSync('bash', ['-c', `cat > ${f} <<'EOF'\n${texto}\nEOF`]);
  const out = execFileSync('npx',
    ['supabase', '--experimental', 'db', 'query', '--linked', '--file', f],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const i = out.indexOf('{');
  return i < 0 ? null : JSON.parse(out.slice(i));
}

const env = (() => {
  const p = 'apps/cliente/.env.local';
  if (!existsSync(p)) return {};
  return Object.fromEntries(readFileSync(p, 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }));
})();

const URL = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !ANON) noConcluyente('faltan EXPO_PUBLIC_SUPABASE_URL / ANON_KEY en apps/cliente/.env.local');

const cuenta = cuentaDePrueba();
if (!cuenta) {
  noConcluyente('la cuenta de prueba no está en el llavero.\n'
    + '     Cargala con:  security add-generic-password -s epetplace-cuenta-prueba '
    + '-a <email> -w <clave>\n'
    + '     (nunca inline en este archivo — es una credencial, D-1035)');
}

let original = null;
let veredicto = new Veredicto(2, '\n  ⚠️  NO CONCLUYENTE — el arnés terminó sin veredicto\n');
try {
  const { initApi, techosVigentes } = await import('../../packages/api/src/index.ts');

  // ── ① CONTROL POSITIVO: el techo arranca en el valor del código.
  const antes = techosVigentes().lectura;
  if (antes === VALOR_DE_PRUEBA) {
    noConcluyente(`el techo ya vale ${VALOR_DE_PRUEBA} antes de tocar nada — `
      + 'el gate no puede discriminar (¿corrida anterior sin restaurar?)');
  }

  // ── ② Mover la perilla en la base.
  const leido = sql(`select valor from app_config where clave='${CLAVE}';`);
  original = leido?.rows?.[0]?.valor ?? null;
  if (original === null) noConcluyente(`no existe la fila ${CLAVE} en app_config`);
  sql(`update app_config set valor='${VALOR_DE_PRUEBA}' where clave='${CLAVE}';`);

  // ── ③ Sesión real: sin ella se lee 0 filas y el gate mide el caso equivocado.
  const cli = initApi(URL, ANON);
  const { error } = await cli.auth.signInWithPassword({
    email: cuenta.email, password: cuenta.clave,
  });
  if (error) noConcluyente(`no se pudo abrir sesión: ${error.message}`);

  // El enganche es `onAuthStateChange` + una consulta: se le da aire.
  for (let i = 0; i < 40 && techosVigentes().lectura !== VALOR_DE_PRUEBA; i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  const despues = techosVigentes().lectura;
  await cli.auth.signOut();

  console.log(`\n  control positivo · techo antes de tocar nada : ${antes} ms`);
  console.log(`  app_config movido a                          : ${VALOR_DE_PRUEBA} ms`);
  console.log(`  techo vigente con sesión                     : ${despues} ms\n`);

  if (despues !== VALOR_DE_PRUEBA) {
    sal(1, `  🔴 ROJO — la perilla NO mueve nada: app_config dice ${VALOR_DE_PRUEBA} `
      + `y el techo sigue en ${despues}.\n`
      + '     Es exactamente D-1080: el dato existe, es correcto, y no llega a ninguna parte.\n');
  }
  sal(0, '  ✅ verify:techo-vive — VERDE · mover app_config mueve el techo de verdad\n');
} catch (e) {
  veredicto = e instanceof Veredicto ? e
    : new Veredicto(2, `\n  ⚠️  NO CONCLUYENTE — el arnés no pudo correr: `
        + `${String(e?.message ?? e).slice(0, 200)}\n`);
} finally {
  /* Restaurar SIEMPRE, y VERIFICAR que se restauró: «lo intenté» no es «quedó
     como estaba». Si la restauración falla, el veredicto pasa a rojo — porque
     un gate que deja la base movida es peor que un gate que no corrió. */
  if (original !== null) {
    try {
      sql(`update app_config set valor='${original}' where clave='${CLAVE}';`);
      const v = sql(`select valor from app_config where clave='${CLAVE}';`)?.rows?.[0]?.valor;
      if (String(v) !== String(original)) {
        veredicto = new Veredicto(1,
          `\n  🔴 ROJO — el arnés NO pudo restaurar ${CLAVE}: quedó en ${v}, `
          + `debía volver a ${original}. RESTAURALO A MANO antes de seguir.\n`);
      }
    } catch (e2) {
      veredicto = new Veredicto(1,
        `\n  🔴 ROJO — el arnés NO pudo restaurar ${CLAVE} (${String(e2?.message ?? e2).slice(0, 120)}). `
        + `Debía volver a ${original}. RESTAURALO A MANO.\n`);
    }
  }
  console.log(veredicto.message);
  process.exit(veredicto.codigo);
}
