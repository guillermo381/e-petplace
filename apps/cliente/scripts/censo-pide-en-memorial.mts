/**
 * ⭐ **CENSO: ¿QUÉ LE PIDE ESTA APP A UNA MASCOTA QUE YA NO ESTÁ?** (S113-C · D-1021).
 *
 * ── POR QUÉ EXISTE, Y POR QUÉ NO ES UN `grep` ───────────────────────────────
 * La primera vuelta de D-1021 curó `focoNexo` y los guards de `theme.mode`, y
 * **dio por cerrada la pantalla sin censarla**. A midió en el aparato lo que
 * quedaba: «Cómo está hoy» seguía diciendo *«Registrar el de hoy»* y *«Cargar
 * carnet»* sobre Bruma. Un `grep` no podía contestar la pregunta que importa
 * —*¿este texto está bajo el guard?*— porque la respuesta no está en la línea:
 * está en sus ANCESTROS.
 *
 * Por eso este censo **parsea**. Recorre el AST, encuentra cada `t('…')` cuya
 * frase le PIDE algo a la familia, y sube por los padres buscando un ternario o
 * un `&&` que sólo lo dibuje cuando la mascota NO está en memorial. Lo que no
 * tiene ese ancestro, se dibuja siempre — y con Bruma en pantalla, se ve.
 *
 * 🔴 **La lista de verbos es del mandato, no mía**: registrar · cargar ·
 * reservar · agendar · agregar. Se le suman los que la propia pantalla usa para
 * pedir (`cambiar`, `contanos/cuéntanos`, `subir`, `completar`), porque el
 * mandato dice *«se lee, no se pide nada»* y pedir una foto es pedir.
 *
 * ⚠️ **Su control negativo es parte del gate**: si el censo dijera 0 porque no
 * encontró NADA que mirar, sería un verde vacío. Por eso exige haber hallado un
 * mínimo de frases de acción y, con `--control`, prueba que sabe dar rojo.
 */
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { clienteEs } from '../src/i18n/es.ts';

const VERBOS =
  /\b(registr|carg[aá]|reserv|agend|agreg|cambi|cont[aá]nos|cu[eé]ntanos|sub[ií]|complet)/i;

/** Aplana el diccionario a `namespace.camino.key` → frase. */
function aplanar(o: unknown, pre: string[] = [], sal = new Map<string, string>()): Map<string, string> {
  if (typeof o === 'string') {
    sal.set(pre.join('.'), o);
    return sal;
  }
  if (o !== null && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) aplanar(v, [...pre, k], sal);
  }
  return sal;
}

/* 🔴 **LO QUE NO ES PEDIR, declarado uno por uno y no por una regex astuta.**
   La primera corrida conto 46 frases y 43 «sin guard» — y adentro habia
   «Cargando tu hogar» y «No pudimos cargar la vacuna». *Un gerundio de carga
   no le pide nada a nadie, y un error tampoco.* Se excluyen por CLASE, con su
   razon escrita, para que la lista se pueda auditar: una exclusion sin razon
   es un numero que baja sin que nadie sepa por que. */
const NO_ES_PEDIR: Array<[RegExp, string]> = [
  [/^Cargando\b/i, 'gerundio de carga: dice lo que la app hace, no lo que la familia debe hacer'],
  [/^No pudimos\b/i, 'error: informa un fallo; no propone un acto'],
  [/^(Cargar m[aá]s|Ver completo)$/i, 'paginacion / revelar: actua sobre la LISTA, no sobre la mascota'],
  [/^Sin\b/i, 'declara una AUSENCIA («Sin registro»): es un valor, no un acto que se propone'],
  [/^Ver\b/i, 'LEER no es pedir — y el mandato dice que en memorial se lee'],
];

const frases = aplanar(clienteEs);
/** Las keys que PIDEN. Se juzga la FRASE, no el nombre de la key: una key
 *  puede llamarse `perfil.pesoRegistrar` y decir otra cosa, y al revés. */
const pide = new Set(
  [...frases]
    .filter(([, v]) => VERBOS.test(v) && !NO_ES_PEDIR.some(([r]) => r.test(v)))
    .map(([k]) => k),
);

const ARCHIVOS = [
  'src/app/(tabs)/hogar/mascota/[mascotaId].tsx',
  'src/app/(tabs)/hogar/index.tsx',
];


/**
 * 🔴 **LA CONDICIÓN SE EVALÚA SOBRE EL AST, NO SOBRE SU TEXTO.** Dos versiones
 * anteriores fallaron y las dos por el instrumento, no por la app: la primera
 * miraba si el texto empezaba con `!` y daba rojo sobre `monta.comoEstaHoy &&
 * !esMemorial`; la segunda evaluaba el texto de `getText()` — **que dentro de
 * JSX devolvía `.comoEstaHoy && !esMemorial`, sin el `monta`**. *Un texto
 * mutilado se evalúa igual de bien y contesta cualquier cosa.*
 *
 * Ahora se interpreta el árbol: `esMemorial` vale lo que se le fije, `!`, `&&`
 * y `||` se resuelven, y **todo lo demás es una variable libre** que se enumera
 * en sus dos valores. Si con `esMemorial = true` ninguna combinación dibuja,
 * está protegido. Lo que no se sabe interpretar cuenta como libre: el censo
 * puede equivocarse hacia el rojo, jamás hacia el verde.
 */
function libresDe(n: ts.Expression, sal: ts.Expression[] = []): ts.Expression[] {
  if (ts.isParenthesizedExpression(n)) return libresDe(n.expression, sal);
  if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.ExclamationToken) {
    return libresDe(n.operand as ts.Expression, sal);
  }
  if (ts.isBinaryExpression(n) && (n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || n.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
    libresDe(n.left, sal);
    return libresDe(n.right, sal);
  }
  if (ts.isIdentifier(n) && n.text === 'esMemorial') return sal;
  sal.push(n);
  return sal;
}

function evaluar(n: ts.Expression, memorial: boolean, libres: ts.Expression[], bits: number): boolean {
  if (ts.isParenthesizedExpression(n)) return evaluar(n.expression, memorial, libres, bits);
  if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.ExclamationToken) {
    return !evaluar(n.operand as ts.Expression, memorial, libres, bits);
  }
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    return evaluar(n.left, memorial, libres, bits) && evaluar(n.right, memorial, libres, bits);
  }
  if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    return evaluar(n.left, memorial, libres, bits) || evaluar(n.right, memorial, libres, bits);
  }
  if (ts.isIdentifier(n) && n.text === 'esMemorial') return memorial;
  const i = libres.indexOf(n);
  return i >= 0 ? ((bits >> i) & 1) === 1 : true;
}

/** ¿Puede dibujarse este nodo con la mascota en memorial? */
function puedeDibujarseConMemorial(cond: ts.Expression, enVerdadero: boolean): boolean {
  const libres = libresDe(cond);
  if (libres.length > 10) return true;
  for (let m = 0; m < 1 << libres.length; m += 1) {
    if (evaluar(cond, true, libres, m) === enVerdadero) return true;
  }
  return false;
}

/** ¿Este nodo sólo se dibuja cuando la mascota NO está en memorial? */
function protegido(n: ts.Node): { si: boolean; por: string } {
  let hijo = n;
  let p = n.parent;
  while (p !== undefined) {
    if (ts.isConditionalExpression(p)) {
      const cond = p.condition.getText();
      if (/esMemorial/.test(cond)) {
        const enVerdadero = p.whenTrue === hijo || (p.whenTrue.getStart() <= hijo.getStart() && hijo.getEnd() <= p.whenTrue.getEnd());
        const dibujaEnMemorial = puedeDibujarseConMemorial(p.condition, enVerdadero);
        if (!dibujaEnMemorial) return { si: true, por: `ternario con esMemorial (línea ${ts.getLineAndCharacterOfPosition(p.getSourceFile(), p.getStart()).line + 1})` };
      }
    }
    if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      const enDerecha = p.right === hijo || (p.right.getStart() <= hijo.getStart() && hijo.getEnd() <= p.right.getEnd());
      if (enDerecha && !puedeDibujarseConMemorial(p.left, true)) {
        return { si: true, por: `&& … (línea ${ts.getLineAndCharacterOfPosition(p.getSourceFile(), p.getStart()).line + 1})` };
      }
    }
    hijo = p;
    p = p.parent;
  }
  return { si: false, por: '—' };
}

const di = (s: string) => console.log(s);
let sinGuard = 0;
let hallados = 0;

di('⭐ CENSO · lo que la app le PIDE a una mascota, y si está bajo `esMemorial`');
di(`   frases que piden algo en el diccionario: ${pide.size}`);

for (const rel of ARCHIVOS) {
  const url = new URL(`../${rel}`, import.meta.url);
  const src = ts.createSourceFile(rel, readFileSync(url, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  di('');
  di(`── ${rel} ${'─'.repeat(Math.max(0, 56 - rel.length))}`);
  /* 🔴 **EL HOGAR NO SE JUZGA CON `esMemorial`, Y ES A PROPÓSITO.** Es la casa
     de la familia: ahí conviven las vivas y las que ya no están, así que un
     guard de PANTALLA no puede decidir por una fila —y el `esMemorial` que hay
     ahí es el del tema, que nadie enciende—. Lo que rige es el filtro por
     MASCOTA sobre las recomendaciones. El censo lo exige por estructura: si el
     filtro no está, estas líneas van a rojo. */
  const esHogar = rel.endsWith('hogar/index.tsx');
  let filtroPorMascota = false;
  if (esHogar) {
    const buscar = (n: ts.Node): void => {
      if (ts.isCallExpression(n) && n.expression.getText().endsWith('.filter') && n.getText().includes('enMemoria')) {
        filtroPorMascota = true;
      }
      ts.forEachChild(n, buscar);
    };
    buscar(src);
    di(`  · las filas de acá se juzgan por el filtro por mascota: ${filtroPorMascota ? 'PRESENTE ✓' : '🔴 AUSENTE'}`);
  }

  const filas: string[] = [];
  const ver = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && n.expression.getText() === 't' && n.arguments.length > 0) {
      const a = n.arguments[0];
      /* 🔴 **EL HOGAR SE MIDE POR MASCOTA, NO POR PANTALLA.** Es la casa de la
         familia y ahi conviven vivas y ausentes: «Agregar mascota» no le pide
         nada a Bruma. Lo que el mandato prohibe ahi es lo que se dibuja PARA
         ELLA — y eso se reconoce por un hecho, no por mi criterio: la frase
         interpola su nombre. */
      const deUnaMascota = /\{\{(mascota|nombre)\}\}/.test(frases.get(ts.isStringLiteral(a) ? a.text : '') ?? '');
      const cuenta = rel.includes('[mascotaId]') || deUnaMascota;
      if (ts.isStringLiteral(a) && pide.has(a.text) && cuenta) {
        hallados += 1;
        const linea = ts.getLineAndCharacterOfPosition(src, n.getStart()).line + 1;
        const g = esHogar
          ? { si: filtroPorMascota, por: 'el filtro por mascota de `filasReco`' }
          : protegido(n);
        if (!g.si) sinGuard += 1;
        filas.push(
          `  ${g.si ? 'ok  ' : '🔴  '}:${String(linea).padStart(4)}  ${a.text.padEnd(28)} «${(frases.get(a.text) ?? '').slice(0, 46)}»` +
            (g.si ? `\n            bajo ${g.por}` : ''),
        );
      }
    }
    ts.forEachChild(n, ver);
  };
  ver(src);
  for (const f of filas) di(f);
  if (filas.length === 0) di('  (ninguna frase de acción)');
}

di('');
/* 🔴 El control del propio censo: un 0 puede querer decir «no hay» o «no vi». */
if (hallados < 5) {
  di(`ROJO · el censo halló sólo ${hallados} frases de acción: es un verde vacío, no un verde.`);
  process.exit(2);
}
di(`halladas ${hallados} frases de acción · fuera del guard: ${sinGuard}`);
di(sinGuard === 0 ? 'VERDE · ninguna le pide nada a quien ya no está.' : `ROJO · ${sinGuard} le piden algo igual.`);
process.exit(sinGuard === 0 ? 0 : 1);
