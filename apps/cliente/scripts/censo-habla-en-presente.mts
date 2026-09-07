/**
 * ⭐ **CENSO: ¿ESTA APP HABLA DE UNA MASCOTA QUE YA NO ESTÁ COMO SI ESTUVIERA?**
 * S113-E · fase 3. **La otra mitad de `censo-pide-en-memorial.mts`.**
 *
 * ── POR QUÉ HACE FALTA UN SEGUNDO CENSO ─────────────────────────────────────
 * Su hermano mide **lo que la app le PIDE** a quien ya no está —«cargar»,
 * «registrar», «reservar»— y está VERDE, con su control positivo de 10 frases
 * plantadas. Caminé la pantalla de Sombra en el aparato y esa mitad se cumple:
 * nada le ofrece contratar ni cargar. **Y aun así la pantalla decía dos cosas:**
 *
 *   · la pastilla del retrato: **«Conociéndolo»** — donde en Thor dice
 *     «✓ Cuidado al día». *En la viva significa «tu cuidado está al día»; en la
 *     muerta significa «todavía no sabemos suficiente de él».*
 *   · la línea de identidad: **«~11 años»**. Thor tiene 6 años.
 *     **Sombra no tiene 11: los tuvo.**
 *
 * Ninguna de las dos es una frase de acción, así que el censo de verbos **no
 * puede verlas**: una es una etiqueta de estado y la otra es un dato calculado.
 *
 * > **Un gate que cubre «no le pidas nada» no cubre «no hables de él como si
 * > estuviera».** Son dos clases, y hasta hoy sólo una tenía instrumento.
 *
 * ── QUÉ MIDE, EN DOS CLASES DECLARADAS ──────────────────────────────────────
 *   ① **estados en presente** — keys del diccionario que afirman una condición
 *      CONTINUA de la mascota. Se declaran una por una: *una regex astuta sobre
 *      el texto marcaría «Llegó a la familia», que es pasado y es correcto.*
 *   ② **datos vivos** — identificadores que llevan un hecho del presente al
 *      render: edad, peso, etapa. No son frases: no hay texto que grepear, y
 *      por eso un censo de diccionario nunca los iba a encontrar.
 *
 * Para cada sitio se hace la MISMA pregunta que el hermano —*¿está bajo un
 * ancestro que sólo lo dibuja cuando la mascota NO está en memorial?*— y por eso
 * `protegido()` es **gemela** de la suya. Si una cambia, la otra también.
 *
 * ── LO QUE ESTE GATE NO MIDE, DECLARADO ─────────────────────────────────────
 * **Las frases con verbo de acción son del hermano y acá se DESCARTAN.** *Dos
 * gates que miden lo mismo dan dos rojos por un defecto y ninguno por el otro.*
 * Y no juzga el pasado: «Sombra llegó a la familia» es correcto y tiene que
 * seguir dibujándose — el memorial no borra la vida, borra el presente.
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE.
 *
 *   pnpm verify:habla-en-presente
 *   pnpm verify:habla-en-presente --control
 */
import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';

const di = (s: string) => console.log(s);
const args = process.argv.slice(2);
for (const a of args) {
  if (a !== '--control') {
    di(`⚠️ NO CONCLUYENTE — no entiendo el argumento \`${a}\`.`);
    di('   Un gate que acepta en silencio lo que no entiende empieza a medir otra cosa.');
    process.exit(2);
  }
}

/**
 * ① **ESTADOS EN PRESENTE.** Cada key con su porqué: *el que las lea después
 * tiene que poder discutir la lista, y para discutirla necesita el motivo.*
 */
const ESTADOS: Array<[string, string]> = [
  ['perfil.pastillaAlDia', 'declara que su cuidado está al día — no hay cuidado que esté al día'],
  ['perfil.pastillaAtencion', 'dice que necesita atención — ya no la necesita'],
  ['perfil.pastillaConociendo', 'dice que lo estamos conociendo — empuja a contar más de alguien que no está'],
  ['perfil.conociendoloTitulo', 'la sección entera se presenta como algo por completar'],
  ['perfil.conociendoloVoz', '«sabemos N de M cosas de él» es una cuenta pendiente'],
];

/**
 * ② **DATOS VIVOS.** Identificadores, no frases. Se nombran los que LLEVAN el
 * hecho al render, no los que lo calculan: `edadEnMeses` puede correr sin que
 * nadie lo dibuje, y **lo que se juzga es el dibujo.**
 */
const DATOS: Array<[string, string]> = [
  ['vozEdad', 'dice la edad en presente («~11 años»)'],
  ['pesoVigente', 'dice cuánto pesa — un peso vigente de quien no está'],
  ['edadMeses', 'la edad viajando a una pieza que la va a mostrar'],
  ['momentoVital', 'la etapa de vida como si siguiera avanzando'],
];

/** Descartes explícitos: lo que es del hermano y lo que es pasado legítimo. */
const VERBOS_DEL_HERMANO = /\b(registr|carg|reserv|agend|agreg|cambi|contanos|cuentanos|sub[ei]|complet|anot|compart)/i;
const sinTilde = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '');

const ARCHIVOS = [
  'src/app/(tabs)/hogar/mascota/[mascotaId].tsx',
  /* Entra por CLASE y no porque alguien la nombrara: es otra pantalla DE UNA
     MASCOTA, y el hermano ya aprendió que censar el caso reportado y no su
     clase deja la segunda puerta para la vuelta siguiente. */
  'src/app/(tabs)/hogar/vacunas/[mascotaId].tsx',
];

/* ═══ LA GEMELA ══════════════════════════════════════════════════════════════
   🔴 Esta función es **la misma pregunta** que hace `censo-pide-en-memorial.mts`
   y está copiada de ahí a propósito, porque su original vive en un script que
   corre al importarse. **Si una cambia, la otra también** — y para que eso no
   dependa de la memoria de nadie, el gate verifica abajo que su hermano siga
   existiendo y siga registrado. */
function libresDe(n: ts.Expression, sal: ts.Expression[] = []): ts.Expression[] {
  if (ts.isBinaryExpression(n)) { libresDe(n.left, sal); libresDe(n.right, sal); return sal; }
  if (ts.isPrefixUnaryExpression(n)) { libresDe(n.operand as ts.Expression, sal); return sal; }
  if (ts.isParenthesizedExpression(n)) { libresDe(n.expression, sal); return sal; }
  if (!/esMemorial/.test(n.getText())) sal.push(n);
  return sal;
}
function evaluar(n: ts.Expression, memorial: boolean, libres: ts.Expression[], bits: number): boolean {
  const i = libres.indexOf(n);
  if (i !== -1) return ((bits >> i) & 1) === 1;
  if (ts.isParenthesizedExpression(n)) return evaluar(n.expression, memorial, libres, bits);
  if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.ExclamationToken) {
    return !evaluar(n.operand as ts.Expression, memorial, libres, bits);
  }
  if (ts.isBinaryExpression(n)) {
    const k = n.operatorToken.kind;
    if (k === ts.SyntaxKind.AmpersandAmpersandToken) {
      return evaluar(n.left, memorial, libres, bits) && evaluar(n.right, memorial, libres, bits);
    }
    if (k === ts.SyntaxKind.BarBarToken) {
      return evaluar(n.left, memorial, libres, bits) || evaluar(n.right, memorial, libres, bits);
    }
  }
  if (/^esMemorial$/.test(n.getText().trim())) return memorial;
  return true;
}
function puedeDibujarseConMemorial(cond: ts.Expression, enVerdadero: boolean): boolean {
  const libres = libresDe(cond);
  if (libres.length > 10) return true;
  for (let m = 0; m < 1 << libres.length; m += 1) {
    if (evaluar(cond, true, libres, m) === enVerdadero) return true;
  }
  return false;
}
export function protegido(n: ts.Node): { si: boolean; por: string } {
  let hijo: ts.Node = n;
  let p = n.parent;
  while (p !== undefined) {
    if (ts.isConditionalExpression(p) && /esMemorial/.test(p.condition.getText())) {
      /* 🔴 **Y ACÁ ESTÁ LA TRAMPA FINA, que es el caso REAL de la pantalla:**
         el nodo tiene que estar DENTRO de una rama del ternario. En el archivo
         vivo hay un `opacity: esMemorial ? 1 : 0.76` **en el mismo `style`**, y
         un ternario que sólo cambia la opacidad **dibuja las dos veces**. Como
         no es ancestro del texto, no lo protege — y por eso este chequeo sube
         por PADRES y no busca la palabra en la vecindad. */
      const dentro = (r: ts.Node) => r === hijo || (r.getStart() <= hijo.getStart() && hijo.getEnd() <= r.getEnd());
      const enVerdadero = dentro(p.whenTrue);
      if (enVerdadero || dentro(p.whenFalse)) {
        if (!puedeDibujarseConMemorial(p.condition, enVerdadero)) {
          const l = ts.getLineAndCharacterOfPosition(p.getSourceFile(), p.getStart()).line + 1;
          return { si: true, por: `ternario con esMemorial (línea ${l})` };
        }
      }
    }
    if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      const enDerecha = p.right === hijo || (p.right.getStart() <= hijo.getStart() && hijo.getEnd() <= p.right.getEnd());
      if (enDerecha && !puedeDibujarseConMemorial(p.left, true)) {
        const l = ts.getLineAndCharacterOfPosition(p.getSourceFile(), p.getStart()).line + 1;
        return { si: true, por: `&& … (línea ${l})` };
      }
    }
    hijo = p;
    p = p.parent;
  }
  return { si: false, por: '—' };
}

/* ═══ EL CENSO ═══════════════════════════════════════════════════════════════ */
type Hallazgo = { archivo: string; linea: number; que: string; clase: '①' | '②'; porque: string };

export function censar(rel: string, texto: string, dicc: Map<string, string>): { hallazgos: Hallazgo[]; mirados: number } {
  const sf = ts.createSourceFile(rel, texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hallazgos: Hallazgo[] = [];
  let mirados = 0;

  const recorrer = (n: ts.Node): void => {
    // ① una llamada `t('key')` cuya key está declarada como estado en presente
    if (ts.isCallExpression(n) && n.expression.getText() === 't' && n.arguments.length > 0) {
      const a = n.arguments[0];
      if (ts.isStringLiteralLike(a)) {
        const key = a.text;
        const fila = ESTADOS.find(([k]) => k === key);
        if (fila !== undefined) {
          const frase = dicc.get(key) ?? '';
          /* Lo que ya caza el hermano NO se cuenta acá: un defecto, un rojo. */
          if (!VERBOS_DEL_HERMANO.test(sinTilde(frase))) {
            mirados += 1;
            const g = protegido(n);
            if (!g.si) {
              hallazgos.push({ archivo: rel, linea: ts.getLineAndCharacterOfPosition(sf, n.getStart()).line + 1,
                que: `${key} — «${frase.slice(0, 46)}»`, clase: '①', porque: fila[1] });
            }
          }
        }
      }
    }
    // ② un identificador declarado que lleva un dato vivo al render
    if (ts.isIdentifier(n)) {
      const fila = DATOS.find(([d]) => d === n.text);
      /* Sólo cuenta si se está USANDO, no donde se declara: `const pesoVigente
         = …` no dibuja nada. *Contar la declaración daría un rojo sobre la línea
         que define el dato, que es justo la que no se puede borrar.* */
      const esDeclaracion = n.parent !== undefined
        && (ts.isVariableDeclaration(n.parent) || ts.isFunctionDeclaration(n.parent) || ts.isImportSpecifier(n.parent))
        && (n.parent as { name?: ts.Node }).name === n;
      if (fila !== undefined && !esDeclaracion) {
        mirados += 1;
        const g = protegido(n);
        if (!g.si) {
          hallazgos.push({ archivo: rel, linea: ts.getLineAndCharacterOfPosition(sf, n.getStart()).line + 1,
            que: n.text, clase: '②', porque: fila[1] });
        }
      }
    }
    ts.forEachChild(n, recorrer);
  };
  recorrer(sf);
  return { hallazgos, mirados };
}

/* ═══ CONTROL ════════════════════════════════════════════════════════════════ */
if (args.includes('--control')) {
  let fallos = 0;
  const ok = (b: boolean, et: string) => { di(`${b ? '✅' : '🔴'} ${et}`); if (!b) fallos += 1; };
  const D = new Map<string, string>(ESTADOS.map(([k]) => [k, k === 'perfil.pastillaConociendo' ? 'Conociéndolo' : 'Cuidado al día']));
  const uno = (src: string) => censar('x.tsx', src, D).hallazgos;

  // POSITIVO primero: los dos casos REALES de la pantalla de Sombra.
  ok(uno("const a = <T>{t('perfil.pastillaConociendo')}</T>;").length === 1,
    'POSITIVO ① una etiqueta de estado sin guard se delata («Conociéndolo»)');
  ok(uno('const a = <T>{vozEdad(meses, p, y, t)}</T>;').some((h) => h.clase === '②'),
    'POSITIVO ② un dato vivo sin guard se delata (la edad)');

  // NEGATIVO — LA MITAD QUE EL FOUNDER PIDIÓ: en una viva, el presente es correcto.
  ok(uno("const a = <T>{esMemorial ? null : t('perfil.pastillaConociendo')}</T>;").length === 0,
    'NEGATIVO ① bajo el guard NO es hallazgo — en una mascota viva el presente es correcto');
  ok(uno('const a = <T>{esMemorial ? null : vozEdad(m, p, y, t)}</T>;').filter((h) => h.clase === '②').length === 0,
    'NEGATIVO ② el dato vivo bajo el guard tampoco');
  ok(uno("const a = <T>{!esMemorial && t('perfil.pastillaAlDia')}</T>;").length === 0,
    'NEGATIVO ① el guard también vale escrito con `&&`');

  // CLASE — las tres que separan este gate de su hermano y de los falsos rojos.
  ok(uno("const a = <T style={{opacity: esMemorial ? 1 : 0.76}}>{t('perfil.pastillaAlDia')}</T>;").length === 1,
    'CLASE    un ternario que sólo cambia la OPACIDAD no es un guard: dibuja las dos veces');
  const conVerbo = new Map([['perfil.pastillaConociendo', 'Cargar el carnet']]);
  ok(censar('x.tsx', "const a = <T>{t('perfil.pastillaConociendo')}</T>;", conVerbo).hallazgos.length === 0,
    'CLASE    una frase con verbo de acción NO es de este gate — la caza su hermano');
  ok(uno('const pesoVigente = leer();').length === 0,
    'CLASE    la DECLARACIÓN de un dato no dibuja nada: no se cuenta');
  ok(uno("const a = <T>{t('perfil.llegoALaFamilia')}</T>;").length === 0,
    'CLASE    el PASADO no se juzga — «llegó a la familia» es correcto y tiene que seguir');

  di('');
  if (fallos > 0) { di(`🔴 ${fallos} control(es) en rojo — el gate NO mide.`); process.exit(1); }
  di('✅ el gate mide: caza el estado y el dato vivo, y los suelta bajo el guard.');
  process.exit(0);
}

/* ═══ GATE ═══════════════════════════════════════════════════════════════════ */
const RAIZ = new URL('..', import.meta.url).pathname;
const HERMANO = 'scripts/censo-pide-en-memorial.mts';
if (!existsSync(RAIZ + HERMANO)) {
  di(`⚠️ NO CONCLUYENTE — no encuentro a su hermano \`${HERMANO}\`.`);
  di('   Los dos censos hacen la MISMA pregunta sobre los ancestros y se');
  di('   mantienen juntos: si uno se movió, el otro puede estar midiendo viejo.');
  process.exit(2);
}

const { clienteEs } = await import('../src/i18n/es.ts');
const dicc = new Map<string, string>();
(function aplanar(o: unknown, pre: string[] = []): void {
  if (typeof o === 'string') { dicc.set(pre.join('.'), o); return; }
  if (o !== null && typeof o === 'object') for (const [k, v] of Object.entries(o)) aplanar(v, [...pre, k]);
})(clienteEs);

di('⭐ CENSO · ¿la app habla de una mascota que ya no está como si estuviera?');
di(`   ${ESTADOS.length} estado(s) en presente y ${DATOS.length} dato(s) vivo(s) declarados · ${ARCHIVOS.length} pantalla(s)`);

let mirados = 0;
const todos: Hallazgo[] = [];
for (const rel of ARCHIVOS) {
  const abs = RAIZ + rel;
  if (!existsSync(abs)) { di(`   ⚠️ no existe \`${rel}\`: esa pantalla NO se midió`); continue; }
  const r = censar(rel, readFileSync(abs, 'utf8'), dicc);
  mirados += r.mirados;
  todos.push(...r.hallazgos);
}

/* 🔴 Un cero con cero sitios mirados no es un aprobado: es la ausencia de la
   prueba. *Si el censo dijera 0 porque no encontró NADA que mirar, sería un
   verde vacío* — el hermano lo escribió y vale igual acá. */
if (mirados === 0) {
  di('\n⚠️ NO CONCLUYENTE — no hallé un solo sitio que dibuje un estado o un dato vivo.');
  di('   O las listas quedaron viejas, o las pantallas se movieron. NO es verde.');
  process.exit(2);
}

/* 🔴 **UN MISMO SITIO SE CUENTA UNA VEZ.** Mi primera corrida dio 13 sobre 16,
   y adentro `pesoVigente` aparecía DOS VECES en la línea 1345 —es el mismo
   `${pesoVigente.kg} kg`, con el identificador leído dos veces por el AST—.
   *Un instrumento que cuenta el mismo defecto dos veces infla su propio número
   y hace ver peor a la pantalla de lo que está.* */
const vistos = new Set<string>();
const unicos = todos.filter((h) => {
  const k = `${h.archivo}:${h.linea}:${h.que}`;
  if (vistos.has(k)) return false;
  vistos.add(k); return true;
});
di(`   sitios mirados: ${mirados} · fuera del guard: ${unicos.length}` +
   (todos.length !== unicos.length ? ` (${todos.length - unicos.length} repetido(s) del mismo sitio, no se cuentan)` : ''));
if (unicos.length > 0) {
  di('\n🔴 HABLA EN PRESENTE DE QUIEN YA NO ESTÁ:');
  for (const h of unicos) {
    di(`   ${h.clase} ${h.archivo}:${h.linea}  ${h.que}`);
    di(`      ${h.porque}`);
  }
  di('\n   Ninguno de éstos le PIDE nada —su hermano está verde— y por eso');
  di('   sobrevivieron: un dato en presente sobre alguien que no está no dispara');
  di('   ninguna regla de acción y se lee perfectamente normal.');
  process.exit(1);
}
di('\n✅ VERDE · ninguna voz habla en presente de quien ya no está.');
