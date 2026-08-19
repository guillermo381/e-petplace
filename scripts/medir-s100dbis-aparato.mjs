/**
 * medir-s100dbis-aparato.mjs — EL SCROLL DE LOS FILTROS, EJERCIDO CON UN
 * DEDO DE VERDAD EN EL TELÉFONO.
 *
 * ══════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ EXISTE: **YO REPORTÉ ESTE SCROLL COMO CERRADO MIDIENDO EN
 * RN-WEB, Y EN EL APARATO NO ANDA.**
 * ══════════════════════════════════════════════════════════════════════
 *
 * En web la tira scrollea perfecto: el DOM la deja y el evento de rueda la
 * mueve — lo medí y lo reporté. **En el teléfono el founder arrastró y no
 * se movió nada.** *RN-web no reproduce el gesto: no hay `Gesture.Pan` de
 * la `Hoja` peleándole al arrastre porque no hay gestos nativos.*
 *
 * ⚠️ **Y lo peor es que yo había PREDICHO este fallo por escrito** en el
 * pedido de `envuelve` a B: *«el pan podría ganarle al arrastre
 * horizontal… si pasa, `envuelve` lo mata de raíz»*. `envuelve` lo mató en
 * los cinco ejes, la hipótesis se volvió **inalcanzable**, y cuando el
 * segundo veredicto me hizo devolver tres ejes a `tira` **le devolví el
 * gesto y traté la hipótesis como resuelta.** *Lo inalcanzable se siente
 * igual que lo resuelto.*
 *
 * ── QUÉ MIDE, Y POR QUÉ ASÍ ─────────────────────────────────────────────
 * **`adb shell input swipe` es un TOQUE REAL**: entra por el mismo camino
 * que el dedo del founder, así que **sí reproduce la pelea de gestos**. Se
 * lee la posición de un chip conocido ANTES y DESPUÉS del arrastre:
 *  · si se movió → la tira scrollea;
 *  · si no se movió → **el arrastre lo capturó otra cosa** (la hipótesis).
 *
 * Y se hace el **contra-caso en la misma corrida**: un arrastre VERTICAL
 * sobre la misma zona. *Si el vertical mueve la hoja y el horizontal no
 * mueve nada, el gesto llega — lo que falla es quién se lo queda.* **Sin
 * ese contra-caso, «no se movió» también podría ser «el `swipe` no llegó»,
 * y estaría midiendo mi propio aparato.**
 *
 * ── LO QUE **NO** PUEDE DECIR ───────────────────────────────────────────
 * `uiautomator` mide **LAYOUT**, no pintado (aviso de B, que se lo cobró
 * hoy con un stepper que el árbol daba en su lugar y el ojo veía cortado).
 * **Para el scroll alcanza** —una tira que se desplaza cambia de bounds—
 * pero **para color y superficie NO**: la carta blanca, la flecha ocre y el
 * chip magenta se verifican por **captura**, y se MIRAN.
 *
 * ── PRECONDICIÓN QUE HAY QUE VERIFICAR, NO SUPONER ──────────────────────
 * 🔴 El teléfono puede tener **un dev build de D encima de la preview**
 * (mismo package). **Medir el bundle publicado sobre un dev build es medir
 * otro objeto** — y su síntoma se lee igual que D-786 («el OTA no llegó»),
 * que ya costó una sesión. El script **declara qué está corriendo** y no
 * decide por vos.
 *
 * Uso: node scripts/medir-s100dbis-aparato.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ADB = `${process.env.HOME}/Library/Android/sdk/platform-tools/adb`;
const APP = 'com.epetplace.cliente';

const sh = (...args) => execFileSync(ADB, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** El árbol de la pantalla, con los bounds de cada nodo con texto. */
function arbol() {
  sh('shell', 'uiautomator', 'dump', '/sdcard/ui.xml');
  sh('pull', '/sdcard/ui.xml', '/tmp/ui-s100dbis.xml');
  const xml = readFileSync('/tmp/ui-s100dbis.xml', 'utf8');
  const nodos = [];
  for (const m of xml.matchAll(/text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)) {
    if (m[1].trim().length === 0) continue;
    nodos.push({
      texto: m[1],
      x1: Number(m[2]), y1: Number(m[3]), x2: Number(m[4]), y2: Number(m[5]),
    });
  }
  return nodos;
}
const buscar = (ns, t) => ns.find((n) => n.texto.trim() === t) ?? null;

console.log('\n═══ APARATO · el scroll de los filtros, con un dedo de verdad ═══');
const dispositivos = sh('devices').split('\n').filter((l) => /\tdevice$/.test(l));
if (dispositivos.length === 0) {
  console.log('  ✗ no hay teléfono conectado — se DECLARA sin medir, no se supone.');
  process.exit(1);
}
console.log(`  teléfono: ${dispositivos[0].split('\t')[0]}`);

console.log('\n── ⓪ · QUÉ ESTÁ CORRIENDO (precondición, no trámite) ──');
/* 🔴 Un dev build y la preview comparten package: si no se declara cuál
   está puesta, se mide un objeto creyendo que es el otro — y el síntoma
   es indistinguible de «el OTA no llegó» (D-786). */
const info = sh('shell', 'dumpsys', 'package', APP);
const version = (info.match(/versionName=([^\s]+)/) ?? [])[1] ?? '?';
const instalador = (info.match(/installerPackageName=([^\s]+)/) ?? [])[1] ?? 'ninguno (cable)';
console.log(`  ${APP} · versionName ${version} · instalado por ${instalador}`);
console.log('  ⚠️ el PIE de la pantalla Cuenta dice el updateId real — es la única prueba');
console.log('     de qué bundle corre. Si no coincide con el publicado, NO se sigue.');

await espera(500);
console.log('\n── ① · EL ROJO: ¿la tira se mueve con un arrastre horizontal? ──');
console.log('  (se asume la hoja de filtros ABIERTA en pantalla — abrila antes de correr esto)');
const antes = arbol();
const objetivo = ['Suplementos', 'Alimento', 'gatos', 'perros', 'Hasta $10']
  .map((t) => buscar(antes, t))
  .find((n) => n !== null && n !== undefined);
if (objetivo === undefined) {
  console.log('  ✗ no se encontró ningún chip conocido en pantalla.');
  console.log('    Textos visibles:', antes.map((n) => n.texto).slice(0, 14).join(' · '));
  process.exit(1);
}
console.log(`  chip ancla: «${objetivo.texto}» en x ${objetivo.x1}–${objetivo.x2}, y ${objetivo.y1}–${objetivo.y2}`);

const cy = Math.round((objetivo.y1 + objetivo.y2) / 2);
const ancho = Number(sh('shell', 'wm', 'size').match(/(\d+)x\d+/)[1]);
/* De derecha a izquierda sobre la fila del chip: el gesto de «ver lo que
   sigue». 400 ms — un arrastre, no un flick: un flick puede leerse como
   otra cosa y su inercia ensucia la medición del después. */
sh('shell', 'input', 'swipe', String(Math.round(ancho * 0.8)), String(cy), String(Math.round(ancho * 0.2)), String(cy), '400');
await espera(1200);
const despues = arbol();
const mismo = buscar(despues, objetivo.texto);
const dx = mismo === null ? null : mismo.x1 - objetivo.x1;
console.log(`  después del arrastre HORIZONTAL: ${mismo === null ? 'el chip salió de pantalla (se movió mucho)' : `x ${mismo.x1} (Δ ${dx} px)`}`);
console.log(`  🔴 ¿LA TIRA SCROLLEA? ${mismo === null || Math.abs(dx ?? 0) > 8 ? '✓ SÍ' : '✗ NO — no se movió'}`);

console.log('\n── ② · EL CONTRA-CASO: ¿llega el gesto? (arrastre VERTICAL) ──');
/* Si el vertical mueve algo y el horizontal no movió nada, **el `swipe`
   llega y el problema es de arbitraje**. Sin esto, «no se movió» también
   podría ser «mi swipe no entró», y estaría midiendo el aparato en vez de
   la pantalla. */
const refVert = despues[0] ?? null;
sh('shell', 'input', 'swipe', String(Math.round(ancho / 2)), String(cy), String(Math.round(ancho / 2)), String(cy - 300), '400');
await espera(1200);
const trasVert = arbol();
const mismoV = refVert === null ? null : buscar(trasVert, refVert.texto);
console.log(
  `  ancla vertical «${refVert?.texto ?? '?'}»: y ${refVert?.y1 ?? '?'} → ${mismoV?.y1 ?? '(salió de pantalla)'}`,
);
console.log(
  `  ⇒ ${mismoV === null || Math.abs((mismoV?.y1 ?? 0) - (refVert?.y1 ?? 0)) > 8 ? 'el gesto LLEGA (el vertical movió) ⇒ el horizontal lo captura OTRO' : 'el gesto NO llega — el rojo del ① no prueba nada'}`,
);

console.log('\n── ③ · LA CAPTURA — lo que el árbol no puede contestar ──');
sh('shell', 'screencap', '-p', '/sdcard/s100dbis.png');
sh('pull', '/sdcard/s100dbis.png', '/tmp/s100dbis-aparato.png');
console.log('  /tmp/s100dbis-aparato.png — **se MIRA**: el árbol mide layout, no pintado.');
console.log('  (la carta blanca, la flecha ocre y el chip magenta se verifican acá, no arriba.)');
