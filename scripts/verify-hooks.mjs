#!/usr/bin/env node
/**
 * S113-E · `verify:hooks` — LAS REGLAS DE LOS HOOKS, MEDIDAS.
 *
 * ═══ POR QUÉ EXISTE ════════════════════════════════════════════════════════
 * Un hook llamado después de un `return` condicional **compila, pasa el
 * typecheck y arranca en dev**. Rompe en runtime, y rompe raro: React pierde el
 * orden de los hooks entre renders y el síntoma es una pantalla que no abre o
 * un estado que salta, lejos de la línea que lo causó.
 *
 * **El caso que lo pidió:** `apps/prestador/src/app/(tabs)/_layout.tsx` tiene
 * un `if ('error' in sesion) { … return … }` en la línea **654** y TRES hooks
 * después — `useSafeAreaInsets()` en **754**, `useState` en **755** y
 * `useEffect` en **759**. Ningún gate de la casa lo veía.
 *
 * ═══ CÓMO MIDE, y por qué no lo escribí a mano ═════════════════════════════
 * Con **ESLint + `eslint-plugin-react-hooks`**, corriendo **UNA sola regla**:
 * `react-hooks/rules-of-hooks`. Nada más.
 *
 * *No escribí el censo a mano a propósito.* `rules-of-hooks` exige análisis de
 * flujo de control real —qué returns dominan qué llamadas—, y un regex sobre
 * líneas produce falsos rojos: es exactamente la clase que ya me costó **10
 * hallazgos falsos** en `verify:puerta-unica` por medir la línea en vez de la
 * sentencia.
 *
 * ⚠️ **Esto NO revive `pnpm lint`** (S83-B7 lo enterró: corría `expo lint` sin
 * ESLint instalado y salía en 1 SIEMPRE, o sea nunca corrió). La diferencia es
 * deliberada y está en la config de abajo: **cero `eslint.config.*` en el
 * repo** —la config vive acá dentro, es del gate y de nadie más— y **una sola
 * regla encendida**. Sin primera pasada roja que absorber: el gate nace
 * midiendo una clase, no auditando la casa entera.
 *
 * ═══ 🔴 UN PARSE ERROR ES ROJO, JAMÁS VERDE ════════════════════════════════
 * Sin el parser de TypeScript, ESLint no lee un `.tsx` — y entonces reporta
 * **cero violaciones de la regla**, que es indistinguible de un archivo sano.
 * *Medido en vivo antes de agregar `typescript-eslint`: el `_layout.tsx` daba
 * `PARSE Unexpected token BarraTabsItem` y cero hallazgos de hooks.*
 * ⇒ Los archivos que no parsean se cuentan aparte y **ponen el gate en rojo**
 * con su nombre. Un archivo que no se pudo medir no es un archivo limpio.
 *
 * ═══ CONTROL (`--control`) ═════════════════════════════════════════════════
 *   POSITIVO  el `_layout.tsx` del prestador en `9d19de78` ⇒ ROJO nombrando
 *             **:754 y :759**
 *   NEGATIVO  el mismo archivo con los hooks movidos ARRIBA del early return
 *             ⇒ VERDE
 *   PARSEO    un `.tsx` con sintaxis rota ⇒ ROJO como «no se pudo medir»,
 *             no como verde
 *
 * Salida: 0 verde · 1 hay violaciones o archivos sin medir · 2 no concluyente.
 */
import { ESLint } from 'eslint';
import hooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { readdirSync, statSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const di = (s) => process.stdout.write(s + '\n');
const REGLA = 'react-hooks/rules-of-hooks';
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SALTAR = new Set(['node_modules', '.expo', 'dist', 'build', '.next', 'ios', 'android', '.turbo']);

/**
 * La config del gate. Vive ACÁ, no en un `eslint.config.*` del repo: así
 * `verify:hooks` no puede convertirse por acumulación en el `pnpm lint` que la
 * casa enterró. Una regla, encendida a mano.
 */
const CONFIG = [
  {
    /* 🔴 APAGADO A PROPÓSITO, y costó un falso rojo de 34 archivos. El repo
       tiene 34 `// eslint-disable-next-line react-hooks/exhaustive-deps`
       escritos por gente que esperaba un linter que nunca corrió (S83-B7).
       Como este gate enciende UNA regla y `exhaustive-deps` no es esa, ESLint
       los reportaba como *«Unused eslint-disable directive»* — mensajes sin
       `ruleId`, que mi clasificador contaba como «no pude parsear».
       *Los 34 archivos parseaban perfecto.* Un gate que enciende una sola
       regla no tiene autoridad para opinar sobre los disables de otra. */
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { 'react-hooks': hooks },
    rules: { [REGLA]: 'error' },
  },
];

function archivos(dir) {
  const out = [];
  let e;
  try { e = readdirSync(dir); } catch { return out; }
  for (const n of e) {
    if (SALTAR.has(n)) continue;
    const p = join(dir, n);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) out.push(...archivos(p));
    else if (EXT.has(n.slice(n.lastIndexOf('.')))) out.push(p);
  }
  return out;
}

async function medir(rutas) {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: CONFIG });
  const res = await eslint.lintFiles(rutas);
  const violaciones = [];
  const sinMedir = [];
  for (const f of res) {
    for (const m of f.messages) {
      /* 🔴 SÓLO `fatal` significa «no se analizó». La primera versión decía
         `m.fatal || !m.ruleId` y metía en la misma bolsa a las directivas no
         usadas — 34 archivos sanos reportados como ilegibles. *Un `ruleId`
         nulo dice «este mensaje no es de una regla», no «no pude leer el
         archivo».* */
      if (m.fatal) { sinMedir.push({ archivo: f.filePath, linea: m.line, motivo: m.message }); continue; }
      if (!m.ruleId) continue;
      if (m.ruleId === REGLA) violaciones.push({ archivo: f.filePath, linea: m.line, col: m.column, mensaje: m.message });
    }
  }
  return { violaciones, sinMedir, revisados: res.length };
}

const rel = (p) => p.replace(process.cwd() + '/', '');

// ═══ CONTROL ══════════════════════════════════════════════════════════════
if (process.argv.includes('--control')) {
  /* 🔴 El temporal vive DENTRO del repo, no en `/tmp`. Medido: ESLint 10
     ignora todo archivo fuera del base path y devuelve *«File ignored because
     outside of base path»* — que se cuenta como cero violaciones. La primera
     versión de este control puso los casos en `/tmp` y los tres salieron por
     esa razón; el de PARSEO incluso salió **verde**, por la razón equivocada.
     *Un control que corre fuera del alcance del instrumento no controla nada.* */
  const tmp = '.control-verify-hooks-s113e';
  mkdirSync(tmp, { recursive: true });
  let rojo = false;
  try {
    // ① POSITIVO — el archivo REAL de 9d19de78, tal cual, sin retocar.
    const crudo = execFileSync('git',
      ['show', '9d19de78:apps/prestador/src/app/(tabs)/_layout.tsx'], { encoding: 'utf8' });
    const caso = join(tmp, 'caso.tsx');
    writeFileSync(caso, crudo);
    const r1 = await medir([caso]);
    const lineas = new Set(r1.violaciones.map((v) => v.linea));
    const cazo = lineas.has(754) && lineas.has(759);
    di(`${cazo ? '✅' : '🔴'} POSITIVO  _layout.tsx de 9d19de78 ⇒ ${r1.violaciones.length} violación(es) en ` +
       `${[...lineas].sort((a, b) => a - b).join(', ')}`);
    di(`   exigido :754 y :759 → ${lineas.has(754) ? '754 ✓' : '754 ✗'} · ${lineas.has(759) ? '759 ✓' : '759 ✗'}`);
    if (r1.sinMedir.length) { di(`   🔴 y ${r1.sinMedir.length} sin medir: ${r1.sinMedir[0].motivo.slice(0, 60)}`); rojo = true; }
    if (!cazo) rojo = true;

    // ② NEGATIVO — el MISMO archivo con los hooks movidos ARRIBA del early
    //    return. Es la forma de la cura.
    //    ⚠️ Se fabrica acá porque **la cura de C no existe todavía**: medido el
    //    4-sep contra las 8 ramas `pista/s113-*` de origin y contra `main`
    //    `d29b34f1` — las nueve tienen el early return en 654 y el hook en 754.
    //    Cuando la cura llegue, este control se re-corre contra ella:
    //      git show <rama>:apps/prestador/src/app/\(tabs\)/_layout.tsx
    const l = crudo.split('\n');
    const hooksMovidos = [l[753], l[754], l[758]].join('\n');            // 754, 755, 759
    const sinHooks = l.filter((_, i) => ![753, 754, 758].includes(i));
    // Se insertan justo después de la firma de la función (línea 213 → idx 212).
    const iFirma = sinHooks.findIndex((x) => x.includes('export default function TabsLayout()'));
    sinHooks.splice(iFirma + 1, 0, hooksMovidos);
    const curado = join(tmp, 'curado.tsx');
    writeFileSync(curado, sinHooks.join('\n'));
    const r2 = await medir([curado]);
    const limpio = r2.violaciones.length === 0 && r2.sinMedir.length === 0;
    di(`${limpio ? '✅' : '🔴'} NEGATIVO  los mismos hooks ARRIBA del early return ⇒ ` +
       `${r2.violaciones.length} violación(es)${r2.sinMedir.length ? ` · ${r2.sinMedir.length} sin medir` : ''}`);
    if (!limpio) rojo = true;

    // ③ PARSEO — un archivo roto NO puede salir verde.
    const roto = join(tmp, 'roto.tsx');
    writeFileSync(roto, 'export function X() { const a = ; return <div/>; }\n');
    const r3 = await medir([roto]);
    const loDice = r3.sinMedir.length > 0;
    di(`${loDice ? '✅' : '🔴'} PARSEO    un .tsx con sintaxis rota ⇒ ` +
       `${loDice ? 'lo cuenta como SIN MEDIR (rojo)' : 'PASÓ COMO VERDE — el gate mentiría'}`);
    if (!loDice) rojo = true;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  di(rojo ? '\n🔴 EL GATE NO MIDE.' : '\n✅ el gate mide: caza las violaciones reales, aprueba la cura y no traga un archivo que no pudo leer.');
  process.exit(rojo ? 1 : 0);
}

// ═══ CORRIDA NORMAL ═══════════════════════════════════════════════════════
const dirs = [];
for (const a of (() => { try { return readdirSync('apps'); } catch { return []; } })()) {
  const d = join('apps', a, 'src');
  try { if (statSync(d).isDirectory()) dirs.push(d); } catch { /* sin src */ }
}
try { if (statSync('packages/ui/src').isDirectory()) dirs.push('packages/ui/src'); } catch { /* sin ui */ }

if (dirs.length === 0) {
  di('🔴 NO CONCLUYENTE: no encontré apps/*/src ni packages/ui/src.');
  process.exit(2);
}
const rutas = dirs.flatMap(archivos);
if (rutas.length === 0) {
  di('🔴 NO CONCLUYENTE: 0 archivos en el corpus. Un cero sin control no es un verde.');
  process.exit(2);
}

const { violaciones, sinMedir } = await medir(rutas);
di(`hooks · ${rutas.length} archivos en: ${dirs.join(' · ')}`);

if (sinMedir.length) {
  di(`\n🔴 SIN MEDIR — ESLint no los pudo parsear (${sinMedir.length}):`);
  for (const s of sinMedir.slice(0, 10)) di(`   ${rel(s.archivo)}:${s.linea}  ${s.motivo.slice(0, 80)}`);
  di('   ⇒ un archivo que no se pudo medir NO es un archivo limpio.');
}
/* Dos clases, porque se curan distinto y una de las dos puede no ser un
   defecto. La regla decide «esto es un custom hook» por el NOMBRE (tiene que
   empezar con `use`), y esta casa escribe en español: `usarMoneda` ES un
   custom hook y la regla no puede saberlo. Amontonarlas mandaría a alguien a
   «curar» código que no está roto. */
const ORDEN = violaciones.filter((v) => /called conditionally|early return|called in function.*loop/i.test(v.mensaje));
const NOMBRE = violaciones.filter((v) => !ORDEN.includes(v));

if (ORDEN.length) {
  di(`\n🔴 ORDEN ROTO — hook después de un early return o dentro de un condicional (${ORDEN.length}):`);
  for (const v of ORDEN) di(`   ${rel(v.archivo)}:${v.linea}:${v.col}\n     ${v.mensaje}`);
  di('   ⇒ defecto de runtime real: React pierde el orden de los hooks entre renders.');
}
if (NOMBRE.length) {
  di(`\n⚠️  NOMBRE NO RECONOCIDO — la regla no ve que sea un componente o un hook (${NOMBRE.length}):`);
  for (const v of NOMBRE) di(`   ${rel(v.archivo)}:${v.linea}:${v.col}\n     ${v.mensaje.slice(0, 150)}`);
  di('   ⇒ la regla decide por el NOMBRE (`use…`, o mayúscula inicial) y esta');
  di('     casa nombra en español. Verificar si es un custom hook legítimo mal');
  di('     nombrado para la regla, o una llamada de verdad fuera de lugar.');
}
if (violaciones.length || sinMedir.length) {
  di(`\n🔴 ${violaciones.length} violación(es) · ${sinMedir.length} sin medir.`);
  process.exit(1);
}
di('\n✅ VERDE · ningún hook fuera de las reglas.');
process.exit(0);
