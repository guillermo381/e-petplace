#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   MEDIR EL APK QUE ESTÁ INSTALADO EN EL APARATO — no el que alguien cortó
   ═══════════════════════════════════════════════════════════════════════════

   Nace el 29-ago-2026, S107-A, después de que una medición por USB **tirara
   abajo un supuesto que llevaba media sesión repitiéndose**: que la build de
   nube era «lo que cierra las tres cadenas de permiso».

   🔴 **`verify-manifest-apk` mide UN ARCHIVO. Nadie guardaba cómo sacar ese
   archivo del teléfono** — el procedimiento vivía en la cabeza de quien lo
   corrió, y por eso el supuesto sobrevivió tres repeticiones sin que nadie lo
   comprobara. *Un método que no está escrito no se vuelve a correr.*

   ── QUÉ MIDE, y por qué estas cuatro cosas ───────────────────────────────
   · **`geo.API_KEY`** y **`google_app_id`** — los secrets que sólo el builder
     puede hornear (`D-574`). Sin ellos el mapa mata la app en hilo nativo.
   · **Los permisos declarados** — lo que el sistema va a poder pedir.
   · **Los módulos nativos** que viajan (`SondaManifest` y los que se pidan) —
     *un módulo ausente hace que su sonda devuelva `null`, y con fail-closed eso
     apaga la función en un aparato donde parecía andar.*
   · **Las cadenas de permiso** — y acá está el hallazgo que motivó el script:

   > ### 🔴 EN ANDROID LAS CADENAS DE PERMISO **NO EXISTEN EN EL APK.**
   > `photosPermission` y `locationWhenInUsePermission` viven bajo
   > `expo-image-picker` / `expo-location` y esos plugins **las escriben en el
   > `Info.plist` de iOS**. En Android generan los `<uses-permission>` y **el
   > texto del prompt lo escribe el SISTEMA OPERATIVO.**
   >
   > *Si este script las busca y no las encuentra, eso NO es un defecto: es la
   > plataforma.* **Buscar ese prompt en un gate de Android es anotar como falla
   > algo que nunca se iba a mostrar.**

   ── USO ──────────────────────────────────────────────────────────────────
     node scripts/medir-apk-instalado.mjs prestador
     node scripts/medir-apk-instalado.mjs cliente

   Exige el aparato por USB (`adb devices` con un `device`).
   ═══════════════════════════════════════════════════════════════════════════ */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const APP = process.argv[2];
const PAQUETE = { prestador: 'com.epetplace.prestador', cliente: 'com.epetplace.cliente' }[APP];
if (!PAQUETE) {
  console.error('uso: node scripts/medir-apk-instalado.mjs <prestador|cliente>');
  process.exit(2);
}

function aapt2() {
  const tools = join(homedir(), 'Library/Android/sdk/build-tools');
  if (!existsSync(tools)) throw new Error(`no encontré build-tools en ${tools}`);
  const v = readdirSync(tools).sort().pop();
  const bin = join(tools, v, 'aapt2');
  if (!existsSync(bin)) throw new Error(`aapt2 no está en ${bin}`);
  return bin;
}
const sh = (c, a) => execFileSync(c, a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

console.log(`── midiendo el APK INSTALADO de ${APP} (${PAQUETE}) ──\n`);

const dev = sh('adb', ['devices']).split('\n').filter((l) => /\tdevice$/.test(l));
if (dev.length === 0) {
  /* 🔴 NO CONCLUYENTE, jamás verde. *Un instrumento que no pudo medir no dice
     «está bien»: dice que no midió.* */
  console.error('✗ NO CONCLUYENTE — no hay aparato por USB. Conectalo y repetí.');
  process.exit(3);
}

const ruta = sh('adb', ['shell', 'pm', 'path', PAQUETE]).trim().replace(/^package:/, '').split('\n')[0].trim();
if (!ruta) { console.error(`✗ ${PAQUETE} no está instalado en el aparato.`); process.exit(3); }
const apk = `/tmp/instalado-${APP}.apk`;
sh('adb', ['pull', ruta, apk]);
console.log(`✓ traído del aparato: ${ruta}\n`);

const badging = sh(aapt2(), ['dump', 'badging', apk]);
const version = /versionName='([^']+)'/.exec(badging)?.[1] ?? '(sin versionName)';
console.log(`  versionName instalada: ${version}`);

/* Los secrets, por el guard que ya existe — no se reimplementa. */
try {
  console.log('\n── secrets (verify-manifest-apk) ──');
  console.log(sh('node', ['scripts/verify-manifest-apk.mjs', apk, '--app', APP]).trim());
} catch (e) {
  console.log((e.stdout ?? '').trim() || '✗ el guard de secrets falló');
}

const permisos = [...sh(aapt2(), ['dump', 'permissions', apk]).matchAll(/android\.permission\.[A-Z_]+/g)]
  .map((m) => m[0]).filter((v, i, a) => a.indexOf(v) === i).sort();
console.log(`\n── permisos declarados (${permisos.length}) ──`);
for (const p of permisos) console.log(`  ${p.replace('android.permission.', '')}`);

/* Los módulos nativos: se buscan en TODOS los dex. Uno solo no alcanza —
   el bundler los reparte y el que importa puede estar en el quinto. */
const MODULOS = ['SondaManifest'];
console.log('\n── módulos nativos que VIAJAN ──');
const dexes = [...sh('unzip', ['-l', apk]).matchAll(/classes\d*\.dex/g)].map((m) => m[0])
  .filter((v, i, a) => a.indexOf(v) === i);
for (const mod of MODULOS) {
  let donde = null;
  for (const d of dexes) {
    const n = execFileSync('sh', ['-c', `unzip -p '${apk}' ${d} | strings | grep -ci ${mod} || true`],
      { encoding: 'utf8' }).trim();
    if (n !== '0' && n !== '') { donde = `${d} (${n} refs)`; break; }
  }
  console.log(donde ? `  ✓ ${mod} → ${donde}` : `  ✗ ${mod} NO viaja — su sonda daría null (fail-closed)`);
}

console.log('\n── cadenas de permiso ──');
console.log('  ⓘ En Android NO se hornean: el texto del prompt lo escribe el');
console.log('    sistema operativo. Estas claves van al Info.plist de iOS.');
console.log('    Buscarlas acá y no encontrarlas ES LO ESPERADO.');

console.log(`\n✓ MEDIDO sobre el APK instalado — copiá esta línea al --binario-local:`);
console.log(`  "${version} — MEDIDO POR USB el ${new Date().toISOString().slice(0, 10)} sobre el APK instalado (${PAQUETE}). Ya no es declaración: es medición."`);
