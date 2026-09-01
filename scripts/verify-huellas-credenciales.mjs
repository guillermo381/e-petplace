#!/usr/bin/env node
/**
 * S109-A · LA HUELLA DE LAS CREDENCIALES — que una vieja SE NOTE al usarla.
 *
 * ═══ QUÉ HACE ═════════════════════════════════════════════════════════════
 * `docs/HUELLAS_DE_CREDENCIALES.md` declara `sha256(valor)` **truncado a 8 hex**
 * de cada credencial vigente. Este guard calcula la del `.env.local` del
 * worktree donde corre y **habla si difiere**.
 *
 * 🔑 **LO QUE VALE NO ES EL GUARD: ES QUE ROTAR OBLIGUE A UN COMMIT.** Hoy una
 * rotación ocurre en una consola web y **no deja rastro en el repo** (`L-454`).
 * Con esto pasa a ser un cambio versionado, con fecha y autor.
 *
 * ═══ 🔴 LO QUE **NO** SE HUELLA, Y NO ES UN OLVIDO ════════════════════════
 * **Una CONTRASEÑA no lleva huella acá. Nunca.**
 *
 * Ocho hex no reconstruyen un valor — cierto para un JWT o una API key, que
 * viven en un espacio de 10^40 posibilidades. **Falso para una contraseña.**
 * Una contraseña sale de un espacio chico y adivinable, y una huella publicada
 * en el repo es **un oráculo de verificación OFFLINE**: cualquiera con el repo
 * prueba candidatas contra el hash, **sin tocar nuestros servidores, sin límite
 * de intentos y sin dejar rastro**. 32 bits alcanzan de sobra para confirmar el
 * acierto.
 *
 * ⚠️ Y acá pesa más que en abstracto, porque la casa ya lo midió: S92 encontró
 * que esta autenticación **aceptó las cuatro contraseñas obvias** que se le
 * probaron y **no devolvió un solo 429 tras doce intentos fallidos**. *Un
 * acierto confirmado offline es directamente usable.*
 *
 * ⇒ El mecanismo cubre lo de ALTA entropía. La rotación de una contraseña se
 * verifica entrando, no comparando hashes.
 *
 * ═══ 🔴 Y ADMITE VALORES LOCALES DECLARADOS ══════════════════════════════
 * Condición de diseño que salió de un falso positivo REAL de S109-D: midió
 * `PAGOS_ALTA_URL` con dos valores, la llamó «desincronizada», **fue a medir**,
 * y el segundo era **el banco local de la pista de pagos de S101** — un valor
 * correcto. *Su propio falso positivo le encontró el defecto a la propuesta
 * antes de construirla.*
 * ⇒ Una línea `# banco: <razón>` sobre la variable en el `.env.local` la exime,
 * **y el guard IMPRIME la razón** en vez de callarla. *Un guard que grita donde
 * no aplica enseña a ignorarlo.*
 *
 * ⚠️ **NO va en el pre-commit**: 29 de 36 worktrees no tienen `.env.local`
 * (medido por S109-D). Corre a mano, o en el paso ⓪ de quien vaya a usar
 * credenciales.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';

const DECL = 'docs/HUELLAS_DE_CREDENCIALES.md';
const ENV = 'apps/cliente/.env.local';
const di = (s) => process.stdout.write(s + '\n');
const huella = (v) => createHash('sha256').update(v, 'utf8').digest('hex').slice(0, 8);

/* Las que NO se huellan, por clase y no por caso. */
const PROHIBIDAS = [/PASSWORD/i, /SECRET/i, /_PWD/i];

if (!existsSync(DECL)) { di(`🔴 falta ${DECL}`); process.exit(1); }
if (!existsSync(ENV)) {
  di(`ℹ️  este worktree no tiene ${ENV} — nada que comparar.`);
  di('   (medido por S109-D: 29 de 36 worktrees están así, y es normal)');
  process.exit(0);
}

const declaradas = new Map();
for (const l of readFileSync(DECL, 'utf8').split('\n')) {
  const m = l.match(/^\|\s*`([A-Z0-9_]+)`\s*\|\s*`([0-9a-f]{8})`/);
  if (m) declaradas.set(m[1], m[2]);
}
if (!declaradas.size) { di(`🔴 ${DECL} no declara ninguna huella — el guard no mide nada.`); process.exit(1); }

const txt = readFileSync(ENV, 'utf8').split('\n');
const bancos = new Map();
let rojo = false, ok = 0;
txt.forEach((l, i) => {
  const b = l.match(/^#\s*banco:\s*(.+)$/);
  if (b) { const sig = txt[i + 1]?.match(/^([A-Z0-9_]+)=/); if (sig) bancos.set(sig[1], b[1].trim()); }
});

for (const [nombre, esperada] of declaradas) {
  if (PROHIBIDAS.some((r) => r.test(nombre))) {
    rojo = true;
    di(`🔴 ${nombre} NO puede llevar huella: su clase es adivinable y una huella`);
    di('   publicada es un oráculo de verificación OFFLINE. Sacala de la tabla.');
    continue;
  }
  const linea = txt.find((l) => l.startsWith(`${nombre}=`));
  if (!linea) { di(`ℹ️  ${nombre} no está en este .env.local — no se compara.`); continue; }
  const actual = huella(linea.slice(nombre.length + 1).trim());
  if (actual === esperada) { ok++; continue; }
  if (bancos.has(nombre)) {
    di(`ℹ️  ${nombre} difiere y está DECLARADA como local: «${bancos.get(nombre)}»`);
    ok++; continue;
  }
  rojo = true;
  di(`🔴 ${nombre}: la huella de este worktree NO es la declarada.`);
  di(`   declarada ${esperada} · acá ${actual}`);
  di('   O este worktree quedó con una credencial vieja, o alguien rotó y no');
  di(`   actualizó ${DECL}. Si es un valor local a propósito, declaralo con una`);
  di(`   línea "# banco: <razón>" arriba de la variable.`);
}

if (!rojo) di(`✅ verify:huellas — VERDE · ${ok} credencial(es) coinciden con lo declarado`);
else di('\n🔴 verify:huellas — ROJO');
process.exit(rojo ? 1 : 0);
