/* Arnés de REGISTRAR Y DESPEDIRSE (S113-B · lote 1.2). La regla común:
   **nada se guarda sin que la persona toque**, y lo que la casa no revisó no
   se muestra. */
import { fechaDespedidaValida } from '../packages/ui/src/components/despedida-fecha.ts';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
let ok = 0, mal = 0;
const t = (n: string, real: unknown, esp: unknown) => {
  const a = JSON.stringify(real), b = JSON.stringify(esp);
  if (a === b) { ok++; console.log(`  ✓ ${n}`); } else { mal++; console.log(`  ✗ ${n}\n     esperado ${b}\n     real     ${a}`); }
};
const sin = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
/* 🔴 **UN GATE QUE NO PUEDE MEDIR NO SE MUERE: LO DICE.** Tercero de la misma
   clase —carnet, perfil y éste—: con un `readFileSync` pelado, un árbol sin
   alguna de estas piezas reventaba con `ENOENT`. *Un stack trace no distingue
   «no hay defecto» de «no corrí»*, y por un pipe se lleva el exit del pipe
   (`L-191`). Sale **2 con NO CONCLUYENTE**. */
const NO_CONCLUYENTE: string[] = [];
const src = (f: string) => {
  try {
    return sin(readFileSync(new URL(`../packages/ui/src/components/${f}`, import.meta.url), 'utf8'));
  } catch {
    NO_CONCLUYENTE.push(f);
    return '';
  }
};
const RAZA = src('SugerenciaRaza.tsx'), FICHA = src('FichaRaza.tsx'), DESP = src('PantallaDespedida.tsx');

console.log('\n── ① ROJO · NADA SE GUARDA SIN TOQUE ──');
t('🔴 `elegida` puede ser null: nada viene preelegido', /elegida: string \| null/.test(RAZA), true);
t('…y la pieza NO elige sola', /elegida \?\? |elegida = candidatas/.test(RAZA), false);
t('el tope de tres vive en la PIEZA, no en quien la monta', /slice\(0, 3\)/.test(RAZA), true);
t('🔴 la confianza se dice en PALABRAS, no en porcentaje',
  /%|porcentaje|confianza \* 100/.test(RAZA), false);
t('sin animal, lo DICE y no inventa un mestizo',
  /if \(!vioAnimal\) return/.test(RAZA) && /elegir\('mestizo'\)/.test(RAZA) === false, true);

console.log('\n── ② ROJO · SIN CONTENIDO REVISADO NO HAY FICHA ──');
t('🔴 `revisado: false` ⇒ la tarjeta no existe', /if \(!revisado\) return null/.test(FICHA), true);
t('…y no hay versión degradada ni «pronto»', /pronto|Pr[óo]ximamente/i.test(FICHA), false);
t('la línea de revisión se dibuja siempre que la ficha exista', /vozRevision/.test(FICHA), true);
t('lo que es null no aparece', /c\.valor != null && c\.valor\.trim\(\) !== ''/.test(FICHA), true);
t('la etapa actual se resalta y las otras se VEN',
  /c\.actual \? theme\.bg\.hundido : 'transparent'/.test(FICHA), true);

console.log('\n── ③ ROJO · LA FECHA DE DESPEDIDA NUNCA ES FUTURA ──');
t('hoy vale', fechaDespedidaValida('2026-09-04', '2026-09-04'), true);
t('ayer vale', fechaDespedidaValida('2026-09-03', '2026-09-04'), true);
t('🔴 mañana NO', fechaDespedidaValida('2026-09-05', '2026-09-04'), false);
t('el año que viene tampoco', fechaDespedidaValida('2027-01-01', '2026-09-04'), false);
t('el guard apaga el botón', /disabled=\{!valida\}/.test(DESP), true);
t('🔴 y dice POR QUÉ (un apagado mudo es el defecto)', /vozFechaFutura/.test(DESP), true);

console.log('\n── ④ LA DESPEDIDA ES EN TINTA, SIN MARCA ──');
t('🔴 el botón es tinta, no el acento', /backgroundColor: valida \? theme\.text\.primary/.test(DESP), true);
t('🔴 ni una gota de marca', /accent\.|gradient|Gradient|HeroMarca|Isotipo/.test(DESP), false);
t('sin ilustración', /Huella|Guijarro|Image|Svg/.test(DESP), false);
t('el segundo toque ES la seguridad', /if \(!confirmando\)/.test(DESP), true);
/* 🔴 **LA GARANTÍA SE MUDÓ, Y EL GATE SE MUDA CON ELLA.**
   ⏪ Medía que la PIEZA dibujara `{nombre}` suelto debajo del botón. El founder
   mandó ese nombre ADENTRO de la etiqueta del segundo toque, así que hoy lo
   compone la pantalla (Ley 3) y **la pieza recibe un string opaco: ya no puede
   verificarlo**.
   *Una garantía que se muda de la pieza a la pantalla se lleva su gate, o
   desaparece sin que nada avise* — y ésta es la que hace parar a alguien el
   peor día de su vida. Por eso se mide en el CONSUMIDOR, contra `origin/main`,
   igual que el brazo ⑮ del carnet. */
{
  const git = (...a: string[]) =>
    execFileSync('git', a, { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });
  let pantalla = '';
  try {
    pantalla = git('show', 'origin/main:apps/cliente/src/app/(tabs)/hogar/mascota/despedida.tsx');
  } catch { /* sin remoto: NO CONCLUYENTE, abajo */ }
  if (pantalla === '') {
    NO_CONCLUYENTE.push('origin/main:…/despedida.tsx (no alcanzable)');
  } else {
    /* ⚠️ **ESTE ASSERT MEDÍA UNA SOLA LÍNEA Y DIO ROJO SOBRE UNA PANTALLA
       CORRECTA.** El patrón exigía `vozConfirmar={t(… { nombre` seguido, y la
       pantalla lo escribe como un ternario en TRES líneas — el nombre está,
       pero partido. *Un rojo falso es peor que un verde falso acá: manda a
       «arreglar» algo que está bien.* Se mide el BLOQUE de la prop, sin
       importar dónde caiga el salto de línea. */
    const bloqueConfirmar = pantalla.slice(
      pantalla.indexOf('vozConfirmar='),
      pantalla.indexOf('vozConfirmar=') + 260,
    );
    t('🔴 …y la PANTALLA nombra a la mascota en la voz del segundo toque',
      /\{ nombre \}/.test(bloqueConfirmar), true);
    t('CONTROL · y se la pasa desde su propio parámetro, no de un literal',
      /nombre \?\? ''/.test(pantalla), true);
  }
}
t('🔴 ningún «¿estás seguro?» con signos', /¿est[áa]s seguro|!!|¡/.test(DESP), false);
t('el estado del segundo toque es LOCAL (una pantalla que se re-monta no llega confirmada)',
  /useState\(false\)/.test(DESP), true);

console.log('\n── ⑤ NINGUNA COMPONE VOZ (Ley 3) ──');
for (const [n, s] of [['raza', RAZA], ['ficha', FICHA], ['despedida', DESP]] as const)
  t(`\`${n}\` no arma frases`, /`\$\{[a-z]+\} (de|en|para|hasta)/i.test(s), false);

if (NO_CONCLUYENTE.length > 0) {
  console.log(`\n⚠️ NO CONCLUYENTE · no se pudieron abrir: ${NO_CONCLUYENTE.join(' · ')}`);
  console.log('   Este árbol no tiene todas las piezas que el gate mide. **No es verde ni rojo:');
  console.log('   es que no se pudo medir**, y sale 2 para que ningún tablero lo lea como salud.');
  process.exit(2);
}
console.log('\n── ROJO · LOS CUATRO DEL TELÉFONO ──');
/* ⚠️ Se reusan los de arriba: `RAZA` es SugerenciaRaza y `FICHA` es FichaRaza.
   La primera versión de este bloque los redeclaró CRUZADOS —su `RAZA` era
   FichaRaza— y **de haber compilado, cada assert habría medido el archivo
   equivocado dando verdes por la razón equivocada.** Lo cazó el compilador. */
const HOGAR = src('FichaMascotaHogar.tsx');

/* ① El chip elegido cambiaba de relleno y la letra se quedaba con el contraste
   del fondo que ya no estaba. `Texto` no expone el blanco y no debe: su paleta
   es semántica. Acá el fondo lo pinta la casa. */
/* ⚠️ Cuenta las DOS líneas del chip —el nombre y la confianza—: la primera
   versión pedía UNA sola coincidencia y **daba verde con la mitad curada**,
   porque matcheaba la otra. Segunda vez en el turno que un assert mide de
   menos: *el que decide el número es el cuantificador, no el ojo.* */
t('🔴 ① las DOS líneas del chip elegido llevan blanco, no la tinta por defecto',
  (RAZA.match(/color: on \? theme\.text\.inverse/g) ?? []).length, 2);
t('…y el no elegido sigue en tinta', /: theme\.text\.primary/.test(RAZA), true);
t('el par sale de `text.inverse`, jamás de `sobreVideo`', /sobreVideo/.test(RAZA), false);

/* ② Un texto que no se distingue de una descripción no se toca: la ficha
   quedaba cerrada porque nadie sabía que abría. */
/* ⚠️ **ESTE ASSERT MEDÍA EL CARÁCTER, y se puso ROJO CUANDO LA PIEZA MEJORÓ.**
   Buscaba `abierta ? '⌃' : '›'`, o sea el chevron dibujado como texto — y el
   día que pasó a la primitiva de la casa, el assert leyó la cura como una
   regresión. *Un gate atado a la FORMA de escribir algo castiga a quien lo
   escribe mejor.* Hoy mide lo que la ley pide (19.7): que haya label Y
   chevron, y que el chevron DIGA si va a abrir o a cerrar. */
t('🔴 ② «ver más» tiene afordance: label + chevron',
  /\{abierta \? vozCerrar : vozAbrir\}/.test(FICHA) &&
  /<Chevron[^>]*direccion=\{abierta \? 'arriba' : 'derecha'\}/.test(FICHA), true);
/* Con tres datos —uno largo y dos cortos— las dos columnas partían el largo en
   renglones angostos y dejaban un hueco al lado. */
t('🔴 el cuerpo NO usa dos columnas al 50 %', /width: '50%'/.test(FICHA), false);
t('…la primera va a todo el ancho', /visibles\[0\]\.etiqueta/.test(FICHA), true);
t('…y el resto en una fila corta', /visibles\.slice\(1\)\.map/.test(FICHA), true);

/* ③ En la pantalla del peor día, lo primero que se lee no puede estar peleando
   con la barra de estado. */
t('🔴 ③ el título respeta la zona segura', /paddingTop: spacing\[6\] \+ insets\.top/.test(DESP), true);
t('🔴 el nombre ya NO cuelga suelto debajo del botón',
  /confirmando \? <Texto variante="apoyo">\{nombre\}/.test(DESP), false);
/* 🔴 El botón se pinta con `text.primary` de fondo y la letra usaba el default
   de `Texto`, que es ESE MISMO TOKEN: tinta sobre tinta. Nadie lo pidió: salió
   leyendo el archivo para mover el nombre adentro. */
t('🔴 y su letra es BLANCA sobre la tinta, no el default',
  /color: valida \? theme\.text\.inverse : theme\.text\.tertiary/.test(DESP), true);

/* ④ En la tira conviven las vivas y la que se fue. Con un solo tema para
   todas, la que se fue se dibujaba idéntica a las que están. */
t('🔴 ④ el memorial es de la MASCOTA, no del tema',
  /const esMemorial = enMemoria \|\| theme\.mode === 'memorial'/.test(HOGAR), true);
t('…y viaja a la acción, o su pill de «en vivo» saldría en verde',
  /<AccionFicha accion=\{accion\} enMemoria=\{esMemorial\} \/>/.test(HOGAR), true);
t('CONTROL · el tema sigue mandando cuando la pantalla ENTERA es memorial',
  (HOGAR.match(/theme\.mode === 'memorial'/g) ?? []).length, 2);

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
