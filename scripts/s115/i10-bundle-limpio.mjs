/**
 * S115-E · INSTRUMENTO 10 — NADA FISCAL EN EL BUNDLE.
 *
 * QUÉ MIDE: que ningún secreto ni credencial fiscal viaje al teléfono. El bundle
 * se descompila: lo que está adentro es público, aunque nadie lo mire.
 *
 * 🔴 SE MIDE SOBRE EL OUTPUT DE `expo export`, NO SOBRE EL FUENTE. Grepear
 * `apps/` y `packages/` mide lo que ALGUIEN ESCRIBIÓ; el bundle mide lo que
 * VIAJA — y son cosas distintas: un `.env` inlineado por Metro, una constante
 * arrastrada por un import transitivo o una key horneada en `app.config.ts` no
 * aparecen en el fuente y sí en el `.hbc`.
 *
 * ROJO PROBADO: se planta cada cadena buscada en un fixture propio y el buscador
 * tiene que cazarla. *Un grep que nunca encontró nada puede estar mirando el
 * archivo equivocado, y su cero se lee igual que un cero verdadero.*
 *
 * CONTROL POSITIVO DE UBICACIÓN: las mismas cadenas SÍ tienen que aparecer en
 * `supabase/` — ahí es donde deben vivir. Si tampoco aparecen ahí, el instrumento
 * está buscando cadenas que no existen en ningún lado y su cero no dice nada.
 */
import { correr, rojo, noConcluyente } from './_lib-e.mjs';
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const SP = '/private/tmp/claude-501/-Users-guillo381gmail-com-proyectos-ePetPlace-e-petplace/e31c9cf9-5517-4887-9e34-60a4227ba727/scratchpad';

/** Lo que JAMÁS puede viajar, con el porqué al lado. */
const PROHIBIDO = [
  ['FACTURACION_', 'prefijo de los secrets de facturación (token, clave del certificado)'],
  /* 🔴 EL PATRÓN VA COMPLETO Y CASE-SENSITIVE. La primera versión buscaba `celcer`
     con `grep -ril` — y la `i` de ese flag es case-INSENSITIVE: cazó
     `cancelCeremony` (un identificador de Reanimated que en minúsculas contiene
     "celcer") en los DOS bundles y publicó un rojo cierto como texto y falso como
     hecho. Un patrón corto sin delimitar cae dentro de otra palabra; es la lección
     `\b` del canon en su forma de subcadena. */
  ['celcer.sri.gob.ec', 'el endpoint del SRI de certificación: delata la integración'],
  ['.p12', 'el certificado de firma — un .p12 en el bundle es la firma de Satori en el teléfono'],
  ['1793240435001', 'el RUC del emisor horneado como constante en vez de leído del servidor'],
];

/** Cadenas que SÍ deben existir del lado servidor — control positivo de ubicación. */
const DEBE_ESTAR_EN_SERVIDOR = ['FACTURACION_', 'celcer.sri.gob.ec'];

function buscar(patron, dir) {
  // `-rl`, JAMÁS `-ril`: los nombres de secretos y hosts son case-sensitive, y la
  // `i` convierte cualquier patrón corto en un cazador de falsos positivos.
  const r = spawnSync('grep', ['-rl', '--binary-files=text', '-F', patron, dir], { encoding: 'utf8' });
  // grep: 0 = encontró, 1 = no encontró, ≥2 = error del propio grep
  if (r.status >= 2) return { error: (r.stderr || '').slice(0, 200) };
  return { hits: r.status === 0 ? r.stdout.trim().split('\n').filter(Boolean) : [] };
}

await correr('i10 · nada fiscal en el bundle', async (r) => {
  // ── (a) ROJO PROBADO: el buscador tiene que cazar lo plantado ─────────────
  const fixture = `${SP}/fixture-bundle`;
  mkdirSync(fixture, { recursive: true });
  writeFileSync(`${fixture}/plantado.txt`,
    PROHIBIDO.map(([p]) => `sonda ${p} sonda`).join('\n'));
  for (const [patron] of PROHIBIDO) {
    const f = buscar(patron, fixture);
    if (f.error) noConcluyente(`grep falló sobre el fixture: ${f.error}`);
    if (!f.hits.length)
      noConcluyente(`el buscador NO caza "${patron}" ni plantado a propósito: no está midiendo.`);
  }
  r.dato('rojo ejercido', `${PROHIBIDO.length}/${PROHIBIDO.length} cadenas cazadas en el fixture`);

  // ── (b) CONTROL POSITIVO DE UBICACIÓN: sí están del lado servidor ─────────
  for (const patron of DEBE_ESTAR_EN_SERVIDOR) {
    const s = buscar(patron, `${RAIZ}/supabase`);
    r.dato(`control · "${patron}" en supabase/`, s.hits?.length ? `${s.hits.length} archivo(s) ✓` : '⚠️ CERO');
    if (!s.hits?.length)
      r.di(`      ⚠️ la cadena tampoco existe del lado servidor: su ausencia en el bundle no prueba nada todavía.`);
  }

  // ── (c) LA MEDICIÓN: sobre los bundles exportados ────────────────────────
  const apps = [['cliente', `${SP}/dist-cliente`], ['prestador', `${SP}/dist-prestador`]];
  const filtrados = apps.filter(([, d]) => existsSync(d));
  const ausentes = apps.filter(([, d]) => !existsSync(d)).map(([a]) => a);
  if (!filtrados.length)
    noConcluyente(`no hay ningún bundle exportado. Se genera con:\n   cd apps/<app> && npx expo export --platform android --output-dir ${SP}/dist-<app>`);
  if (ausentes.length)
    r.di(`   ⚠️ NO MEDIDO: ${ausentes.join(', ')} — no hay export. Lo medido vale sólo para ${filtrados.map(([a]) => a).join(', ')}.`);

  const hallazgos = [];
  for (const [app, dir] of filtrados) {
    r.di(`\n   ${app}:`);
    for (const [patron, porque] of PROHIBIDO) {
      const f = buscar(patron, dir);
      if (f.error) noConcluyente(`grep falló sobre ${dir}: ${f.error}`);
      if (f.hits.length) {
        hallazgos.push(`${app} · "${patron}" en ${f.hits.length} archivo(s): ${f.hits[0].replace(dir, '')}`);
        r.dato(`  🔴 ${patron}`, `${f.hits.length} archivo(s) — ${porque}`);
      } else {
        r.dato(`  ${patron}`, 'ausente');
      }
    }
  }

  if (hallazgos.length)
    rojo(`material fiscal en el bundle:\n   · ${hallazgos.join('\n   · ')}\n   Un bundle se descompila: lo que está adentro es público.`);

  r.di(`\n   → ${filtrados.length} bundle(s) limpios de las ${PROHIBIDO.length} cadenas, con el buscador probado en rojo.`);
});
