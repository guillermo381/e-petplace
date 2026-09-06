/**
 * lib-argumentos — S113-E · **un instrumento tiene que poder decir «no».**
 *
 * ── POR QUÉ EXISTE, y no es prolijidad ──────────────────────────────────────
 * `discriminador-ota.mjs` aceptaba un segundo argumento y **lo tiraba en
 * silencio**: le pasé `<ancla> <rama>` y midió `<ancla>..HEAD`. Con dos ramas
 * distintas dio **el mismo verde**, porque midió lo mismo dos veces — *un
 * instrumento indistinguible de uno que anda, incluso comparando dos corridas.*
 *
 * El caso barato de la misma clase está en todos los gates que sólo miran
 * `--control`: **`--controll` con una ele de más corre el GATE REAL**, y su
 * salida se lee como si el control hubiera pasado.
 *
 * *Aceptar en silencio lo que no se entiende es cómo un gate empieza a medir
 * otra cosa* — y **un gate que no tiene forma de parar sólo sabe dar verde**
 * (formulación de la pista D, S113).
 */

/**
 * Valida los argumentos y **corta con exit 2 (NO CONCLUYENTE)** ante cualquiera
 * que no esté declarado. NO es exit 1: un argumento mal escrito no es un rojo
 * del objeto, es que **no se midió nada**.
 *
 * @param {string[]} banderas  las `--x` que este instrumento entiende.
 * @param {number}   maxPos    cuántos posicionales admite (default 0).
 * @returns {{ banderas: Set<string>, pos: string[] }}
 */
export function exigirArgumentos(banderas, maxPos = 0) {
  const args = process.argv.slice(2);
  const conocidas = new Set(banderas);
  const vistas = new Set();
  const pos = [];
  const malas = [];

  for (const a of args) {
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const nombre = a.split('=')[0];
    if (conocidas.has(nombre)) vistas.add(nombre);
    else malas.push(a);
  }

  const sobran = pos.slice(maxPos);
  if (malas.length || sobran.length) {
    const di = (s) => console.log(s);
    di('⚠️ NO CONCLUYENTE — no entiendo parte de lo que me pasaste, así que no medí nada.');
    for (const m of malas) {
      /* Se ofrece el candidato más parecido: el 90 % de estos son un typo, y
         decir «quizá quisiste --control» ahorra la vuelta entera. */
      const cerca = [...conocidas].find((c) => c.replace(/-/g, '').includes(m.replace(/-/g, '').slice(2, 8)));
      di(`   ${m}${cerca ? `   ¿quisiste ${cerca}?` : ''}`);
    }
    for (const s of sobran) di(`   ${s}   (posicional de más: admito ${maxPos})`);
    di(`   entiendo: ${[...conocidas].join(' ')}${maxPos ? ` y ${maxPos} posicional(es)` : ''}`);
    di('   *Un gate que acepta lo que no entiende empieza a medir otra cosa, en verde.*');
    process.exit(2);
  }
  return { banderas: vistas, pos };
}
