/**
 * ⭐ **UN CANAL REALTIME NO PUEDE TENER NOMBRE FIJO** (S113-C, sobre el hallazgo
 * de E en `pista/s113-e-2.0`).
 *
 * ── LO QUE PASÓ, Y POR QUÉ NINGÚN GATE LO VEÍA ─────────────────────────────
 * E midió que **la raíz se caía 3 de cada 4 veces** con una segunda navegación
 * durante el arranque — *que es exactamente lo que hace abrir la app desde un
 * QR*. La cadena: `supabase.channel(nombre)` **devuelve el canal que ya
 * existe** si el nombre coincide, y `.on()` sobre uno ya suscrito **lanza**.
 * Con nombre fijo, dos montajes rápidos son el mismo canal.
 *
 * *No lo veía nadie porque compila perfecto, corre bien con una sola
 * navegación, y su síntoma es un crash de arranque que se confunde con
 * cualquier otra cosa.*
 *
 * ── LO QUE ESTE GATE MIDE, Y LO QUE NO ─────────────────────────────────────
 * Mide **la causa**: un literal fijo dentro de `.channel(...)`. No mide el
 * crash — eso lo hace el recorrido de E, que reproduce el deep link durante el
 * arranque. *Son dos instrumentos y hacen falta los dos: éste corre en cada
 * commit y es barato; el suyo prueba que el usuario ya no se cae.*
 *
 * ⚠️ **Un nombre fijo puede ser correcto si el canal se reusa a propósito.**
 * Por eso la salida no dice «error»: dice **dónde** y pide que se declare con
 * `CANAL_REUSADO_A_PROPOSITO` en la misma línea.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const di = (s) => console.log(s);
const archivos = execSync(
  `grep -rl "\\.channel(" packages/*/src apps/*/src --include='*.ts' --include='*.tsx' || true`,
  { encoding: 'utf8' },
).trim().split('\n').filter(Boolean);

/** `.channel('literal')` o `.channel("literal")` — sin plantilla ni variable. */
const FIJO = /\.channel\(\s*['"]([^'"]+)['"]\s*[,)]/g;

let malos = 0;
let vistos = 0;
di('⭐ verify:canal-unico · ningún canal realtime con nombre fijo\n');
for (const f of archivos) {
  const src = readFileSync(f, 'utf8');
  const lineas = src.split('\n');
  for (const [i, linea] of lineas.entries()) {
    FIJO.lastIndex = 0;
    let m;
    while ((m = FIJO.exec(linea)) !== null) {
      vistos += 1;
      /* La declaración va **en la misma línea o en las tres de arriba**: pegada
         al sitio, no en un archivo de excepciones que nadie relee. */
      const cerca = lineas.slice(Math.max(0, i - 3), i + 1).join('\n');
      if (cerca.includes('CANAL_REUSADO_A_PROPOSITO')) {
        di(`  ok  ${f}:${i + 1} · «${m[1]}» — reuso declarado`);
        continue;
      }
      malos += 1;
      di(`  🔴  ${f}:${i + 1} · .channel('${m[1]}')`);
      di('      Dos montajes rápidos comparten este canal y el segundo `.on()` lanza.');
      di('      ⇒ nombre único por montaje, o declaralo con CANAL_REUSADO_A_PROPOSITO.');
    }
  }
}

/* 🔴 **EL CONTROL: este gate tiene que poder ver algo.** Si el regex dejara de
   casar —porque alguien cambia el estilo de llamada— saldría VERDE sobre un
   repo lleno de canales fijos, y ese verde se leería como salud. */
const control = `  supabase.channel('x-fijo').on('a', () => {})`;
FIJO.lastIndex = 0;
if (FIJO.exec(control) === null) {
  di('\n🔴 NO CONCLUYENTE · el patrón no reconoce ni su propio caso de prueba.');
  process.exit(2);
}

di(`\n  llamadas con nombre literal halladas: ${vistos}`);
di(malos === 0 ? '✓ VERDE · ninguna sin declarar.' : `🔴 ROJO · ${malos} canal(es) con nombre fijo sin declarar.`);
process.exit(malos === 0 ? 0 : 1);
