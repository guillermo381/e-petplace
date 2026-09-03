#!/usr/bin/env node
/**
 * S112-A · EL TRINQUETE DEL FRENO MUDO — RE-APUNTADO (firma del founder, 2-sep).
 *
 * ══ ⏪ QUÉ MEDÍA ANTES Y POR QUÉ DEJÓ DE SERVIR ═══════════════════════════
 * Nació en S111-A midiendo consumidores que pasaban `razonDeshabilitado=` SIN
 * `onRazon=`, con esta premisa escrita en su cabecera: *«sin `onRazon`, `Boton`
 * calcula `conRazon=false` y el botón queda apagado y sin hint»*.
 *
 * 🔴 **Esa premisa murió el 2-sep** con la cura de `D-999` (B, `55f51ad6`), que
 * separó dos hechos que estaban pegados: `hayRazon` → hay algo que DECIR ⇒ se
 * dibuja la línea; `conRazon` → además hay a dónde LLEVAR ⇒ el toque navega.
 * **`onRazon` dejó de gobernar el texto.** Los seis archivos que el gate viejo
 * contaba como mudos **dibujan su razón desde ese commit, sin tocarles nada**.
 *
 * ⇒ Su último verde fue **correcto por casualidad**: el número no había subido.
 * *Lo que cambió no era el número — era qué significaba.* Y peor: el founder le
 * pidió a C pasar razones reales, y cada razón nueva sin `onRazon` —que desde
 * la cura es la forma CORRECTA— **subía el número y cortaba**. Un trinquete que
 * impide justo el trabajo que la sesión vino a hacer dejó de proteger.
 *
 * Lo midió B y NO lo tocó, con su razón: *«es tu gate, su baseline lo firmó el
 * founder, y re-apuntarlo sin mesa sería el error que S111 se negó a cometer»*.
 * Su voto fue jubilarlo; el founder eligió **re-apuntarlo**, y el hallazgo de B
 * lo respalda: **el gate viejo medía una premisa muerta; éste mide un defecto
 * vivo que ninguna cura de `Boton` puede tapar.**
 *
 * ══ QUÉ MIDE AHORA ════════════════════════════════════════════════════════
 * **Botones que se apagan SIN NINGUNA RAZÓN.** Por OCURRENCIA y no por archivo
 * —un archivo puede crecer sin cambiar de fila, y el segundo botón mudo del
 * mismo archivo era invisible—. Baseline **140**, SOLO-BAJA.
 * ⏪ Bajó de 141 en S112-C: la barra vieja del hilo de adopción tenía un
 * `Boton deshabilitado` con su razón, y murió al montar `BarraEscribir` — que
 * resuelve lo mismo **sin freno**: el glifo de enviar se atenúa y tocarlo vacío
 * no hace nada, así que no hay nada que explicar. *El trinquete baja cuando la
 * cura elimina el freno, no cuando alguien le escribe una razón.*
 *
 * ⚠️ LO QUE NO VE, declarado (correctivo de `L-459`):
 * ① **Es una RESTA, no un emparejamiento por elemento.** Cuenta `deshabilitado={`
 *    y le resta `razonDeshabilitado=`; no verifica que la razón esté en el MISMO
 *    botón. Un archivo con dos botones —uno con razón y otro sin ella— sale
 *    empatado. *Emparejar de verdad exige parsear JSX, y el número que el
 *    founder firmó es éste.* (Medido que la resta es legítima: `deshabilitado={`
 *    no matchea dentro de `razonDeshabilitado=` — la `D` mayúscula lo impide.)
 * ② **No dice si la razón es BUENA.** Una razón que no explica nada cuenta igual.
 * ③ **No mide si el usuario la VE**: eso lo cubre `Boton` desde `D-999` y se
 *    gatea en el recorrido, no en un contador.
 *
 * ⚠️ Y NO ESTÁ CABLEADO AL PRE-COMMIT (medido por B): no frena commits, sale en
 * el cierre. Su rojo se lee tarde y como culpa de quien cerró.
 *
 * Salidas: 0 verde · 1 el número SUBIÓ · 2 la auto-prueba falló (no pude medir).
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASELINE_FILE = 'scripts/.baseline-razon-muda.json';
const RAIZ = 'apps';
const FRENO = /deshabilitado=\{/g;
const RAZON = /razonDeshabilitado=/g;

function archivos(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.expo' || e === 'dist') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) archivos(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const cuenta = (txt, re) => (txt.match(re) ?? []).length;

/** 🔴 EL CORPUS CUENTA CÓDIGO, NO PROSA (S112, lo cobró C sobre sí mismo).
 *
 *  Su caso, entero: subió a 143 por un freno real que había introducido — bien
 *  cazado. **Lo retiró y siguió en 143**, porque el gate estaba contando la
 *  palabra dentro del comentario que explicaba su propio hallazgo. Su cura fue
 *  no nombrar la prop en la prosa: *resuelve su caso y no el de la próxima
 *  pantalla.*
 *
 *  Es `L-170` —un censo por patrón lee los comentarios como código— por segunda
 *  vez en su día. **La resta sigue siendo legítima como diseño; lo que no
 *  distinguía prosa de código era el corpus.**
 *
 *  Se quitan bloques de comentario, líneas de `//` y los comentarios de JSX.
 *  NO se tocan las cadenas: una prop dentro de un string es rarísima, y
 *  quitarlas exigiría un parser — *un instrumento que necesita un parser para
 *  medir una resta se volvió más caro que el defecto que vigila.*
 *
 *  ⚠️ Y de paso: la primera versión de ESTE comentario escribía la secuencia de
 *  cierre de bloque como ejemplo, y **se cerró a sí misma**. La ironía queda
 *  anotada — es la misma familia del hallazgo que viene a curar. */
function sinComentarios(t) {
  return t
    .replace(/\/\*[\s\S]*?\*\//g, ' ')   // bloque y JSX
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 '); // línea, sin comerse `https://`
}

function medir(lista) {
  let frenos = 0, razones = 0;
  const porArchivo = [];
  for (const f of lista) {
    const t = sinComentarios(readFileSync(f, 'utf8'));
    const a = cuenta(t, FRENO), b = cuenta(t, RAZON);
    frenos += a; razones += b;
    if (a - b > 0) porArchivo.push([f, a - b]);
  }
  return { mudos: frenos - razones, frenos, razones, porArchivo };
}

const di = (s) => process.stdout.write(s + '\n');
const lista = archivos(RAIZ);
if (lista.length === 0) { di('ROJO · cero .tsx en apps/ — no pude medir.'); process.exit(2); }

/* ══ AUTO-PRUEBA: si no puede distinguir su rojo, no cuenta un verde (L-459) ══ */
const SIN = '<Boton deshabilitado={true} />';
const CON = '<Boton deshabilitado={true} razonDeshabilitado="x" />';
const sonda = (txt) => cuenta(txt, FRENO) - cuenta(txt, RAZON);
if (sonda(SIN) !== 1) { di('ROJO · auto-prueba: no cuenta un freno mudo.'); process.exit(2); }
if (sonda(CON) !== 0) { di('ROJO · auto-prueba: cuenta como mudo un freno CON razón.'); process.exit(2); }
if (sonda('<Boton />') !== 0) { di('ROJO · auto-prueba: cuenta un boton sin freno.'); process.exit(2); }

const { mudos, frenos, razones, porArchivo } = medir(lista);

const base = existsSync(BASELINE_FILE)
  ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
  : null;
if (base === null || typeof base.baseline !== 'number') {
  writeFileSync(BASELINE_FILE, JSON.stringify({ baseline: mudos, sembrado: new Date().toISOString() }, null, 2) + '\n');
  di(`baseline sembrado en ${mudos}`); process.exit(0);
}

di(`verify:razon-muda · ${mudos} freno(s) MUDO(s) · ${frenos} deshabilitado / ${razones} con razon · baseline ${base.baseline} SOLO-BAJA`);
porArchivo.sort((a, b) => b[1] - a[1]).slice(0, 5)
  .forEach(([f, n]) => di(`   · ${f}  (${n})`));
if (porArchivo.length > 5) di(`   … y ${porArchivo.length - 5} archivo(s) mas`);

if (mudos > base.baseline) {
  di(`\n✗ EL NUMERO SUBIO: ${base.baseline} → ${mudos}. El trinquete NO deja subir.`);
  di('  Un boton que se apaga sin decir por que manda a la persona a adivinar.');
  di('  Si el caso nuevo es legitimo, se declara y se sube el baseline A MANO,');
  di('  con su razon — jamas en el mismo commit que lo introdujo.');
  process.exit(1);
}
if (mudos < base.baseline) {
  di(`\n✓ VERDE — y BAJO: ${base.baseline} → ${mudos}. Actualiza el baseline en el mismo commit que lo curo.`);
} else {
  di('\n✓ verify:razon-muda VERDE — el numero no subio.');
}
process.exit(0);
