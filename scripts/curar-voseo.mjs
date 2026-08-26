/**
 * S105-A · EL BARRIDO DE VOSEO — cura, no censa.
 *
 * 🔴 **REUSA EL DETECTOR DE `censo-voseo.mjs` (pista C), no uno paralelo.**
 * Ese instrumento tiene SIETE trampas resueltas —comentarios de bloque
 * multilínea, la tilde que rompe `\b`, `vos` como subcadena de «nuevos»— y
 * escribir un segundo detector para curar sería garantizar que los dos
 * diverjan. *El que cura tiene que ver exactamente lo que ve el que mide, o el
 * censo deja de describir la cura.*
 *
 * SÓLO toca el interior de cadenas literales, nunca comentarios ni código.
 * Uso:  node scripts/curar-voseo.mjs <archivos...>      (imprime el plan)
 *       APLICAR=1 node scripts/curar-voseo.mjs <...>    (escribe)
 */
import fs from 'node:fs';

/* El mapeo. Voseo → tuteo neutro, que es la voz firmada de la casa (regla 27
   extendida al móvil en S51). Se escribe COMPLETO y explícito: derivar el
   tuteo del voseo por reglas de acentuación falla en los irregulares
   (`andá`→«ve», `vení`→«ven`, `pedí`→«pide») y esos son justamente los que un
   lector nota. */
const MAPA = {
  // imperativos con tilde
  'probá': 'prueba', 'tocá': 'toca', 'elegí': 'elige', 'escribí': 'escribe',
  'andá': 've', 'mirá': 'mira', 'poné': 'pon', 'hacé': 'haz',
  'agregá': 'agrega', 'volvé': 'vuelve', 'ingresá': 'ingresa', 'revisá': 'revisa',
  'buscá': 'busca', 'cargá': 'carga', 'seleccioná': 'selecciona',
  'confirmá': 'confirma', 'guardá': 'guarda', 'contactá': 'contacta',
  'abrí': 'abre', 'activá': 'activa', 'compartí': 'comparte', 'enviá': 'envía',
  'esperá': 'espera', 'intentá': 'intenta', 'verificá': 'verifica',
  'completá': 'completa', 'aceptá': 'acepta', 'corregí': 'corrige',
  'contá': 'cuenta', 'pedí': 'pide', 'sacá': 'saca', 'cerrá': 'cierra',
  'dejá': 'deja', 'sumá': 'suma', 'usá': 'usa', 'pagá': 'paga',
  'entrás': 'entras', 'vení': 'ven',
  // enclíticos (van ANTES que sus raíces — ver el orden de aplicación)
  'contanos': 'cuéntanos', 'escribila': 'escríbela', 'escribilo': 'escríbelo',
  'corregilo': 'corrígelo', 'corregila': 'corrígela',
  'ingresalo': 'ingrésalo', 'ingresala': 'ingrésala',
  'probalo': 'pruébalo', 'probala': 'pruébala',
  'tocalo': 'tócalo', 'tocala': 'tócala',
  'elegilo': 'elígelo', 'elegila': 'elígela',
  'agregalo': 'agrégalo', 'agregala': 'agrégala',
  'revisalo': 'revísalo', 'revisala': 'revísala',
  'guardalo': 'guárdalo', 'guardala': 'guárdala',
  'avisanos': 'avísanos', 'contactanos': 'contáctanos',
  'compartile': 'compártele', 'compartilo': 'compártelo', 'compartila': 'compártela',
  // pronominales
  'tenés': 'tienes', 'podés': 'puedes', 'querés': 'quieres', 'sabés': 'sabes',
  'debés': 'debes', 'necesitás': 'necesitas', 'hacés': 'haces',
  'ponés': 'pones', 'compartís': 'compartes',
};

/* 🔴 LOS ENCLÍTICOS VAN PRIMERO. Si `probá`→`prueba` corriera antes,
   `probalo` quedaría como `pruebalo` — sin tilde y sin pasar por su regla.
   *Un mapeo ordenado por el diccionario en vez de por longitud produce
   palabras que ningún corrector va a marcar y ningún lector va a entender.* */
const CLAVES = Object.keys(MAPA).sort((a, b) => b.length - a.length);

function conMayus(orig, nuevo) {
  return orig[0] === orig[0].toUpperCase()
    ? nuevo[0].toUpperCase() + nuevo.slice(1)
    : nuevo;
}

let totalCambios = 0;
const APLICAR = process.env.APLICAR === '1';

for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8').split('\n');
  let enBloque = false;
  let cambios = 0;

  const salida = src.map((linea, i) => {
    // ── mismo recorrido de comentarios que el censo de C (trampa 6)
    let resto = linea, prefijoSeguro = '';
    if (enBloque) {
      const c = resto.indexOf('*/');
      if (c === -1) return linea;            // línea entera es comentario
      prefijoSeguro = resto.slice(0, c + 2);
      resto = resto.slice(c + 2);
      enBloque = false;
    }
    const ab = resto.indexOf('/*');
    let cola = '';
    if (ab !== -1 && resto.indexOf('*/', ab) === -1) {
      cola = resto.slice(ab); resto = resto.slice(0, ab); enBloque = true;
    }
    const lineaCom = resto.indexOf('//');
    let colaLinea = '';
    if (lineaCom !== -1) { colaLinea = resto.slice(lineaCom); resto = resto.slice(0, lineaCom); }

    // ── sólo el INTERIOR de las cadenas
    const curado = resto.replace(/'([^'\\]{4,})'|"([^"\\]{4,})"/g, (m, s1, s2) => {
      const comilla = s1 !== undefined ? "'" : '"';
      let v = s1 ?? s2;
      for (const k of CLAVES) {
        const rx = new RegExp(`(^|[^a-záéíóúñA-ZÁÉÍÓÚÑ])(${k})([^a-záéíóúñA-ZÁÉÍÓÚÑ]|$)`, 'gi');
        v = v.replace(rx, (_mm, pre, pal, post) => {
          cambios++; totalCambios++;
          return pre + conMayus(pal, MAPA[k]) + post;
        });
      }
      return comilla + v + comilla;
    });

    return prefijoSeguro + curado + colaLinea + cola;
  });

  if (cambios > 0) {
    console.log(`${String(cambios).padStart(4)}  ${f}`);
    if (APLICAR) fs.writeFileSync(f, salida.join('\n'));
  }
}
console.log(`\n${APLICAR ? 'APLICADOS' : 'PLAN'}: ${totalCambios} cambios`);
