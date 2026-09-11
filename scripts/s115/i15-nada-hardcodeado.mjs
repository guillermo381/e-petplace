/**
 * S115-E · INSTRUMENTO 15 — NINGÚN PORCENTAJE NI MÍNIMO DE COMISIÓN ESCRITO EN CÓDIGO.
 *
 * QUÉ MIDE: que la comisión viva SÓLO en `fee_configs`. Un porcentaje hardcodeado no
 * falla el día que la mesa cambia la tarifa: **sigue cobrando el viejo, en silencio**,
 * y la diferencia aparece meses después en una liquidación que nadie cuadra.
 *
 * 🔴 PRECEDENTE MEDIDO EN ESTA CASA: `D-759` — el 14 % vivía en DIEZ lugares, dos de
 * ellos VISTAS con el `0.14` embebido en el SQL y tres `?? 14` que se activaban justo
 * cuando la tabla de configuración no respondía. **Cambiar `fee_configs` no movía
 * ninguno de los diez.** Un número inflado en un pitch deck no es un bug de tablero:
 * es lo que se dijo en una reunión.
 *
 * 🔴 CONTROL ANTI-SUBCADENA, y no es paranoia: `grep -ril celcer` cazó `cancelCeremony`
 * en dos bundles y publicó una fuga de proveedor que no existía (`L-534` ③). Acá el
 * riesgo es el mismo con números: `18` está dentro de `180`, `2018`, `1.18` y de
 * cualquier hash; `0.15` está dentro de `0.150`. **Todo patrón va DELIMITADO y su
 * delimitación se prueba con casos que NO debe cazar.**
 */
import { correr, q, rojo, noConcluyente } from './_lib-e.mjs';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const SP = '/private/tmp/claude-501/-Users-guillo381gmail-com-proyectos-ePetPlace-e-petplace/e31c9cf9-5517-4887-9e34-60a4227ba727/scratchpad';

const AMBITOS = [
  ['supabase', ['--include=*.sql', '--include=*.ts']],
  ['packages', ['--include=*.ts', '--include=*.tsx']],
  ['apps',     ['--include=*.ts', '--include=*.tsx']],
];

/* Los números de comisión que la casa ha usado o discutido, cada uno en sus dos formas
   (fracción y porcentaje entero), DELIMITADOS para que no caigan dentro de otro número. */
const CIFRAS = [
  ['0\\.18',  'fracción 0.18'], ['0\\.15', 'fracción 0.15'],
  ['0\\.12',  'fracción 0.12'], ['0\\.14', 'fracción 0.14 (la de D-759)'],
  ['0\\.10',  'fracción 0.10'],
  ['18',      '18 entero'],     ['15', '15 entero'],
  ['12',      '12 entero'],     ['14', '14 entero'],
];

/* 🔴 DELIMITADO CONTRA DÍGITO, PUNTO **Y LETRA**. La primera versión excluía sólo
   dígitos y punto, y su propio control la frenó: cazó `18`, `15` y `12` dentro del
   hash `"a18b15c12"`, donde las cifras están rodeadas de LETRAS. *El fixture existía
   exactamente para eso, y funcionó.* Así `18` no cae en `180`, `1.18`, `2018` ni
   `a18b`. */
const BORDE = '[^0-9A-Za-z._]';
const patron = (n) => `(^|${BORDE})${n}(${BORDE}|$)`;

/* 🔴 EL NÚMERO TIENE QUE ESTAR **ASIGNADO O COMPARADO**, no sólo cerca de una palabra.
   La primera versión pedía «cifra + palabra de comisión en la misma línea» y devolvió
   27 hallazgos de los cuales casi todos eran ruido: `numeric(14,2)` (precisión de un
   tipo), continuaciones de comentarios multilínea —que no empiezan con `--` ni con
   `/*`, así que el filtro de comentarios no las veía—, y hasta descripciones de razas.

   *Un instrumento con 27 hallazgos y 2 reales es peor que no tenerlo: nadie revisa
   los 27, su rojo se vuelve rutina, y el día que aparezca el de verdad va a estar en
   la misma pila que el ruido.*

   Exigir asignación o comparación es lo que captura el defecto REAL de `D-759`
   —`?? 14`, `0.14` embebido en el SQL de una vista— y descarta la prosa. */
const OPERADOR = '(=|:|\\?\\?|<>|!=|==|>=|<=|>|<|\\*|DEFAULT|default|RETURN|return)\\s*';

/* Y además la línea tiene que hablar de comisión: la asignación sola marcaría cada
   `= 15` del repo. Las dos condiciones juntas, no cualquiera de las dos. */
const CONTEXTO = 'comision|commission|fee|take_rate|takeRate|tarifa|minimo|mínimo|pct|porcentaje';

/* Formas que llevan un número pegado a una palabra de comisión y NO son una comisión.
   Cada una está acá porque produjo un falso positivo medido, no por precaución. */
const RUIDO = [
  /numeric\s*\(\s*\d+\s*,\s*\d+\s*\)/,     // numeric(14,2) — precisión del tipo
  /decimal\s*\(\s*\d+\s*,\s*\d+\s*\)/,
  /varchar\s*\(\s*\d+\s*\)/,
];

/* 🔴 UN SOLO CRITERIO PARA EL CONTROL Y PARA LA MEDICIÓN.
   La versión anterior probaba el control con `patron(n)` a secas mientras la medición
   ya exigía operador y filtraba ruido: **el control estaba midiendo un buscador que no
   era el que corre**. Es la misma ley que aplico a los arneses ajenos —un instrumento
   que juzga una salida usa el MISMO parser que el sistema real— cobrada en el mío. */
function esHallazgo(linea, cifra) {
  if (!new RegExp(`${OPERADOR}${cifra}(${BORDE}|$)`).test(linea)) return false;
  if (!new RegExp(CONTEXTO, 'i').test(linea)) return false;
  if (RUIDO.some((re) => re.test(linea))) return false;
  const cuerpo = linea.split(':').slice(2).join(':').trim();
  if (/^(--|\/\/|\*|#)/.test(cuerpo)) return false;
  return true;
}

function grep(args) {
  const r = spawnSync('grep', args, { encoding: 'utf8', cwd: RAIZ });
  if (r.status >= 2) return { error: (r.stderr || '').slice(0, 300) };
  return { lineas: r.status === 0 ? r.stdout.trim().split('\n').filter(Boolean) : [] };
}

await correr('i15 · ningún porcentaje ni mínimo de comisión en código', async (r) => {
  // ── (a) ROJO PLANTADO + CONTROL ANTI-SUBCADENA, en un fixture propio ──────
  const fx = `${SP}/fixture-comision`;
  mkdirSync(fx, { recursive: true });
  writeFileSync(`${fx}/malo.ts`, [
    'export const comision = 0.18;              // DEBE cazarse',
    'const TAKE_RATE_PCT = 18;                  // DEBE cazarse',
    'const feeMinimo = 0.50;                    // mínimo, debe cazarse',
  ].join('\n'));
  writeFileSync(`${fx}/inocente.ts`, [
    'const anio = 2018;                         // NO debe cazarse',
    'const alto = 180;                          // NO debe cazarse',
    'const factor = 1.18;                       // NO debe cazarse',
    'const otro = 0.150001;                     // NO debe cazarse',
    'const hash = "a18b15c12";                  // NO debe cazarse',
    'const timeout = 15000;                     // NO debe cazarse',
    'v_base numeric(14,2);                      // precisión de tipo, NO comisión',
    '   la comisión bajó de 18 a 15 en S25      // prosa dentro de un bloque /* */',
    'const razaDesc = "criada hace 15 siglos";  // prosa con la palabra tarifa cerca',
    "const espera = \"interval '15 minutes'\";   // tiempo, no comisión — falso medido",
    'const presets = [5, 10, 15];               // presets de paquete — falso medido',
    'const dosTipos = "numeric(14,2), numeric(14,2)"; // dos precisiones — falso medido',
  ].join('\n'));

  let cazadasEnMalo = 0;
  for (const [n] of CIFRAS) {
    const g = grep(['-rEn', `${OPERADOR}${n}(${BORDE}|$)`, `${fx}/malo.ts`]);
    if (g.error) noConcluyente(`grep falló sobre el fixture: ${g.error}`);
    if (g.lineas.some((l) => esHallazgo(l, n))) cazadasEnMalo++;
  }
  r.dato('rojo plantado', `${cazadasEnMalo > 0 ? 'el buscador CAZA las cifras plantadas ✓' : '🔴 NO caza ni lo plantado'}`);
  if (cazadasEnMalo === 0)
    noConcluyente('el buscador no caza un `0.18` plantado a propósito: no está midiendo.');

  const falsos = [];
  for (const [n, voz] of CIFRAS) {
    const g = grep(['-rEn', `${OPERADOR}${n}(${BORDE}|$)`, `${fx}/inocente.ts`]);
    for (const l of g.lineas ?? []) if (esHallazgo(l, n)) falsos.push(`${voz} → ${l.split(':').slice(2).join(':').trim()}`);
  }
  r.dato('control anti-subcadena', falsos.length
    ? `🔴 ${falsos.length} falso(s): ${falsos[0]}`
    : `0 falsos sobre 2018 · 180 · 1.18 · 0.150001 · "a18b15c12" · 15000 ✓`);
  if (falsos.length)
    noConcluyente(`el patrón caza dentro de otro número (${falsos.join(' | ')}): sus hallazgos no serían confiables. Es cancelCeremony con cifras.`);

  // ── (b) LA MEDICIÓN: cifras de comisión CERCA de palabras de comisión ─────
  const hallazgos = [];
  for (const [dir, incluye] of AMBITOS) {
    for (const [n, voz] of CIFRAS) {
      // Dos pasadas: la cifra delimitada, y de esas líneas las que hablan de comisión.
      const g = grep(['-rEn', ...incluye, `${OPERADOR}${n}(${BORDE}|$)`, dir]);
      if (g.error) noConcluyente(`grep falló sobre ${dir}: ${g.error}`);
      for (const linea of g.lineas) {
        if (!esHallazgo(linea, n)) continue;
        /* 🔴 LAS MIGRACIONES YA APLICADAS SON HISTORIA, NO CÓDIGO VIVO. Un `<> 14`
           dentro de un cinturón de agosto no cobra nada hoy: dice qué valor esperaba
           encontrar ese día. Reescribirla sería reescribir el registro.
           **Lo que sí cobra hoy es el CUERPO VIVO de una función o una vista — y eso
           no se mide por grep sobre archivos: se le pregunta al objeto.** Ese es el
           brazo (d), y es donde vivía `D-759` (dos vistas con el `0.14` embebido). */
        if (/supabase\/migrations\/.*\.sql/.test(linea)) continue;
        hallazgos.push({ voz, linea: linea.slice(0, 190) });
      }
    }
  }

  r.di('');
  if (hallazgos.length) {
    for (const h of hallazgos.slice(0, 25)) r.dato(`  🔴 ${h.voz}`, h.linea);
    if (hallazgos.length > 25) r.di(`      … y ${hallazgos.length - 25} más`);
  }
  r.dato('cifras de comisión en código vivo', `${hallazgos.length}`);

  // ── (c) CONTROL POSITIVO DE ALCANCE: el grep SÍ ve los tres árboles ───────
  for (const [dir, incluye] of AMBITOS) {
    const g = grep(['-rEl', ...incluye, 'fee_config|comision|comisión', dir]);
    r.dato(`  control · ${dir}/`, `${g.lineas?.length ?? 0} archivo(s) hablan de comisión`);
    if (!g.lineas?.length)
      noConcluyente(`el grep no encuentra NI UNA mención de comisión en ${dir}/: no está mirando donde cree.`);
  }

  // ── (d) 🔴 EL BRAZO QUE IMPORTA: el número embebido en el OBJETO VIVO ─────
  // D-759 no vivía en un archivo: vivía en dos VISTAS, con el 0.14 dentro del SQL.
  // Un grep sobre el repo no las ve; sólo el catálogo de Postgres las delata.
  /* 🔴 EL CUERPO SE TRAE ENTERO Y SE LE QUITAN LOS COMENTARIOS **EN JS**, antes de
     buscar la cifra. Filtrar con un regex de SQL marcó `precio_final`, que NO tiene
     ningún número embebido: lo tiene en un COMENTARIO que explica por qué el redondeo
     va en numeric («15 % de 6,70 es 1,01 en numeric y 1,00 en float64»).
     *Es `L-170` del canon —un censo por `pg_get_functiondef` lee los comentarios como
     código— y me pasó igual habiéndola leído.* En SQL puro sacar comentarios es
     frágil; en JS es trivial y se ve. */
  const cuerpos = q(
    `select 'funcion' as clase, p.proname as nombre, pg_get_functiondef(p.oid) as cuerpo
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and pg_get_functiondef(p.oid) ~* '(comision|fee|take_rate|tarifa)'
        and p.proname !~ '^_?trg_'
      union all
     select 'vista', c.relname, pg_get_viewdef(c.oid)
       from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind in ('v','m')
        and pg_get_viewdef(c.oid) ~* '(comision|fee|take_rate|tarifa)'`);

  const sinComentarios = (t) => String(t)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')      // bloques
    .replace(/--[^\n]*/g, ' ');                // línea

  /* 🔴 TERCERA FORMULACIÓN DEL CRITERIO, y las dos anteriores cayeron por lo mismo:
     buscaban «la cifra 14 en alguna parte» y marcaban `numeric(14,2)`, `interval
     '15 minutes'`, presets `NOT IN (5, 10, 15)`… Cada cura destapaba otro falso, que
     es la señal de que el criterio estaba mal planteado, no incompleto.

     **El número importa cuando FUNCIONA COMO TASA**, y eso tiene formas contadas —
     las mismas que tenía `D-759`:
        · asignado a algo que se llama pct/fee/comision/tasa/rate   →  pct = 14 · ?? 14
        · dividido por cien                                          →  14 / 100
        · multiplicando como fracción                                →  * 0.14
     Fuera de esas tres, un 14 es una precisión, un minuto o un preset. */
  const FORMAS = [
    { re: /(pct|porcentaje|comision|comisión|fee|tasa|rate|take_rate)\w*\s*(:?=|\?\?|<>|!=|==)\s*(0[.]1[2458]|1[2458])(?![0-9A-Za-z._])/i,
      voz: 'asignado a un campo de tasa' },
    { re: /(?<![0-9A-Za-z._])(1[2458])\s*\/\s*100(?![0-9])/,
      voz: 'dividido por cien' },
    { re: /\*\s*(0[.]1[2458])(?![0-9A-Za-z._])/,
      voz: 'multiplicando como fracción' },
  ];

  const enObjeto = [];
  for (const c of cuerpos) {
    const limpio = sinComentarios(c.cuerpo);
    for (const { re, voz } of FORMAS) {
      const m = limpio.match(re);
      if (!m) continue;
      enObjeto.push({
        clase: c.clase, nombre: c.nombre, voz,
        fragmento: limpio.slice(Math.max(0, m.index - 40), m.index + 50).replace(/\s+/g, ' ').trim(),
      });
      break;
    }
  }
  r.di('');
  r.dato('objetos vivos censados', `${cuerpos.length} (funciones y vistas que hablan de comisión)`);
  r.dato('con la cifra embebida en CÓDIGO', enObjeto.length
    ? `🔴 ${enObjeto.map((x) => `${x.clase} ${x.nombre}`).join(', ')}` : '0 ✓');
  for (const o of enObjeto) r.dato(`  · ${o.nombre}`, `${o.voz} → …${o.fragmento}…`);

  // Control positivo del brazo (d): el censo TIENE que ver los objetos que hablan de fee.
  const hablanDeFee = q(
    `select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and pg_get_functiondef(p.oid) ~ '(comision|fee_config|take_rate)'`)[0].n;
  r.dato('  control · objetos que hablan de comisión', `${hablanDeFee}`);
  if (hablanDeFee === 0)
    noConcluyente('el censo del objeto no ve NINGUNA función que hable de comisión: su cero no dice nada.');

  if (enObjeto.length)
    rojo(`${enObjeto.length} objeto(s) VIVO(s) con una cifra de comisión embebida en su CÓDIGO (no en un comentario):\n` +
         enObjeto.map((o) => `   · ${o.clase} ${o.nombre} · ${o.voz} → …${o.fragmento}…`).join('\n') +
         `\n   Es exactamente D-759: cambiar fee_configs no los mueve.`);

  if (hallazgos.length)
    rojo(`${hallazgos.length} cifra(s) de comisión escritas en código.\n   Un porcentaje hardcodeado no falla cuando la mesa cambia la tarifa: sigue cobrando el viejo, en silencio (precedente D-759: el 14 % vivía en diez lugares).`);

  r.di('\n   → la comisión vive sólo en fee_configs: ni en el código ni en el cuerpo de un objeto vivo,');
  r.di('     y el buscador probó que caza lo plantado y que no inventa sobre 2018 · 180 · 1.18 · a18b15c12.');
});
