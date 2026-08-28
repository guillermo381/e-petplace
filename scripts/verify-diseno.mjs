#!/usr/bin/env node
/**
 * verify:diseno — el lint de las leyes de diseño FIRMADAS (S81-B, paga
 * D-481; ENSANCHADO S82-B). LA REGLA DE LA MESA: lo que un lint puede
 * verificar va masivo y el founder NO lo mira; este script SE ENSANCHA
 * con cada ley aplicada.
 *
 * L-192 MECANIZADA (la lección del silencio, S81): TODA regla con modo
 * de fallo se AUTO-PRUEBA en cada corrida — se le da su fixture de
 * violación sintético y TIENE que salir roja; si no puede, el lint
 * entero se declara DECORATIVO y falla. Una regla informativa (sin modo
 * de fallo) lo declara explícitamente y queda fuera de la auto-prueba.
 *
 * GUARD ESTRUCTURAL (S82-B, mismo espíritu L-192): toda regla de REGLAS
 * tiene que estar en FIXTURES o en INFORMATIVAS — exactamente en una.
 * Una regla que no está en ninguna ESCAPÓ de la auto-prueba en silencio
 * (el modo de fallo que L-192 existe para matar); en las dos, se
 * contradice. Cualquiera de los dos casos invalida el lint entero.
 *
 * El exit se lee del COMANDO, jamás del pipe (L-191).
 */

import ts from 'typescript'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { construirArbol, hitSlopsVecinos, autoPruebaArbol } from './lib-arbol-montaje.mjs';
/* R65 · el instrumento de medición de assets raster. Vive aparte porque su
   control positivo corre solo (`node scripts/medir-png.mjs`), y una regla que
   se apoya en una medición tiene que poder señalar dónde se valida esa
   medición. */
/* R66 · la lógica de voz vive en UN solo lugar: es el instrumento de la pista C
   movido a biblioteca. Importar en vez de reimplementar es la regla, no una
   preferencia — una copia del matcher divergiría sin avisar. */
import { hitsDeVoseo } from './lib-voz.mjs';
import { decodificar as decodificarPng, cuerpo as cuerpoPng, puntoRedondo as puntoRedondoPng } from './medir-png.mjs';

/** El sha256 del isotipo de Deuna **sobre el que se hizo la cuenta de R65**.
 *  Clavado por orden del founder (25-ago-2026): el proveedor va a entregar SVG
 *  y *«X es una propiedad del glifo dibujado, no del archivo»*. Cambiar el
 *  asset pone R65·C en rojo pidiendo re-medición. **No se actualiza porque el
 *  lint moleste: se actualiza cuando la cuenta se rehizo y dio.** */
const SHA_ISOTIPO_MEDIDO = 'c29721a65b12715984b20c2a612d2ac5d1b7ab0bdd185e75f580c420a1816779';
/** Mínimo de reproducción de la versión SÍMBOLO de Deuna, en px digitales.
 *  Dato del proveedor (grupo de soporte, 25-ago-2026). Su versión principal
 *  pide 50 px, y por eso el wordmark quedó afuera: daba 44. */
const MIN_SIMBOLO_DEUNA = 16;
/**
 * R66 · el voseo que YA ESTÁ, por archivo. **Trinquete solo-baja.**
 *
 * ⚠️ **TODO NÚMERO DE ACÁ SE MIDE CONTRA `origin/main`, JAMÁS CONTRA EL ÁRBOL
 * DE LA PISTA** — y está escrito porque ya se cobró:
 *
 * > La v1 de esta tabla puso **8** en el cliente. **Salió de mi worktree, que
 * > no tenía el merge de la barrida de C.** En `origin/main` valía **0** desde
 * > antes de que yo escribiera la línea que decía *«baja a 0 cuando ese merge
 * > entre»*. **Ya había entrado.**
 * >
 * > Lo frenó la pista C midiendo contra `origin/main` y las ramas. *Un baseline
 * > POR ENCIMA de la realidad no bloquea: **da permiso** — habría dejado
 * > crecer el voseo del cliente de 0 a 8 sin que la regla dijera nada, que es
 * > exactamente el defecto que R66 vino a cerrar.*
 * >
 * > **Y la trampa fina: el árbol de una pista es un objeto legítimo para
 * > medir CUALQUIER cosa menos un techo compartido.** Un baseline es una
 * > afirmación sobre lo que hay en la casa, no sobre lo que hay en mi mesa.
 *
 * `apps/prestador/src/i18n/es.ts` es **deuda declarada, sin dueño en esta
 * mesa** — nunca se barrió entero (S77 curó 8/8 del prestador, que era otro
 * lote). Verificado contra `origin/main`: **47**.
 */
const BASELINE_VOSEO = {
  /* ── VOZ DE LAS APPS ──────────────────────────────────────────────────── */
  'apps/cliente/src/i18n/es.ts': 2,      // ⚠️ ver ⑪: las destapó `sos`, no son nuevas
  'apps/prestador/src/i18n/es.ts': 47,   // deuda: nunca barrido entero

  /* ── `packages/api` — LOS MENSAJES DE ERROR DE LOS WRAPPERS ────────────
     **Entra por firma del founder (25-ago)**, y su razón es la más fuerte de
     la tabla: *A curó 160 voseos acá y nada lo sostenía* — que es exactamente
     el estado del que R66 vino a sacarnos. Y es donde viven **los mensajes que
     aparecen en el peor momento**: cuando algo falló.

     🔴 **LA FIRMA DECÍA «0 DURO CON UNA EXCEPCIÓN DE 1» Y LA MEDICIÓN DICE
     OTRA COSA — se aplica el espíritu, no la cifra.** Medido contra
     `origin/main` con la lista ampliada (⑩ y ⑪): **5 hits, no 1.** El censo que
     reportó 1 corrió con la lista anterior, que no tenía `trabajá`, `atendé`
     ni `sos`. *Poner 0 acá sería un techo POR DEBAJO de la realidad — y eso no
     protege: bloquea. Es la misma ley que esta tabla ya se cobró una vez, con
     el signo invertido.* */
  'packages/api/src/wrappers/equipo.ts': 1,           // ✅ EL MATCHER — ver abajo
  /* ✅ LAS TRES DEUDAS DE A, CURADAS EN ESTE MISMO COMMIT (25-ago, noche).
     Eran cuatro cadenas que mi barrida de 167 no podía ver: mi lista no tenía
     `trabajá`, `atendé` ni `sos` — las destapó la lista ampliada de B (⑩ ⑪).
     *No es que se me escaparan: es que el instrumento no las buscaba.*

     Verificado ANTES de tocarlas —la lección de esta misma jornada— que
     **ninguna es frase del motor**: censadas contra `pg_proc`, cero
     coincidencias. Los CÓDIGOS (`no_sos_del_equipo`, `no_sos_el_vendedor`)
     **no se tocaron**: son identificadores, no voz, y cambiarlos rompería el
     matching sin hablarle a nadie. */
  'packages/api/src/wrappers/certificados.ts': 0,     // ✅ «Trabajas… emite el certificado»
  'packages/api/src/wrappers/pizarra.ts': 0,          // ✅ «No eres parte…» · «…que no atiendes»
  'packages/api/src/wrappers/_despensa-comun.ts': 0,  // ✅ «No eres el vendedor de este pedido»
};

/**
 * 🔴 **EL ÚNICO 1 QUE NO ES DEUDA: `equipo.ts`.**
 *
 * `'No tenés permiso para aceptar esta invitación'` **no es voz: es el LITERAL
 * DEL MOTOR contra el que se matchea**, medido del cuerpo de
 * `aceptar_invitacion_pendiente_login`. A lo curó en su barrida, **el mapeo se
 * rompió** —el código caía a genérico— **y ningún typecheck lo vio, porque un
 * string que deja de coincidir compila perfecto.** Está revertido a propósito.
 *
 * *Un matcher y su fuente son un solo par: mover uno solo es cómo se rompen los
 * dos.* ⇒ **cuando el motor hable tuteo, los dos se mueven en el MISMO commit**
 * y este baseline baja a 0.
 *
 * **Por qué un baseline y no un mecanismo de exención:** es UN caso. *Una regla
 * nueva por un caso único no se paga — y un mecanismo de exención tampoco.* El
 * día que sean tres, se construye; hoy sería vigilar un caso que además es
 * fácil de ver.
 *
 * ⚠️ **LAS OTRAS TRES ENTRADAS DE `packages/api` SÍ SON DEUDA, con su literal
 * para que nadie las busque:**
 *   · `certificados.ts:28`   «Trabajás en más de un negocio: emití el certificado…»
 *   · `pizarra.ts:110`       «No sos parte del equipo de este negocio.»
 *   · `pizarra.ts:111`       «Esa cita es de un servicio que no atendés.»
 *   · `_despensa-comun.ts:175` «No sos el vendedor de este pedido.»
 * **Son de A** (`packages/api` es su territorio). Cuando las cure, esta tabla
 * queda en **una sola entrada: el matcher.**
 */
const shaDe = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const RAICES = ['apps/cliente/src', 'apps/prestador/src'];
const RAICES_UI = ['packages/ui/src/components', 'packages/ui/src/brand'];

function archivosTsx(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...archivosTsx(p));
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/**
 * ⚠️ EL MISMO ÁRBOL, PERO TAMBIÉN `.ts` — y nace de un caso REAL, no de una
 * previsión.
 *
 * Al extraer el flujo de reserva del paseo a `lib/reserva/paseo.ts` (D-730), el
 * guard de tres estados que **R34 existe para vigilar** se fue con él. El lint
 * siguió dando VERDE y su contador bajó de 5 a 4: *no porque el guard hubiera
 * desaparecido, sino porque dejó de verlo.* El corpus recorría solo `.tsx`, y
 * la lógica se había mudado a un archivo sin JSX.
 *
 * **Un lint que se apaga cuando el código cambia de extensión no protege el
 * código: protege un directorio.** Y lo más incómodo es que su salida no dice
 * «ya no miro»: dice un número más chico, que se lee como progreso.
 *
 * Se usa SOLO donde la regla vigila lógica y no píxeles (hoy R34), en vez de
 * ensanchar el corpus entero: ensancharlo encendería de una vez todas las demás
 * reglas sobre archivos que nunca miraron, y eso es decisión de mesa.
 */
function archivosCodigo(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...archivosCodigo(p));
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const MINIMOS_CORPUS = { apps: 100, cliente: 45, ui: 38 };

const leer = (fs) => fs.map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));
const apps = leer(RAICES.flatMap(archivosTsx));
const ui = leer(RAICES_UI.flatMap(archivosTsx));
/** El corpus de LÓGICA (ver `archivosCodigo`): incluye `.ts`, donde viven los
 *  flujos extraídos. Hoy lo consume R34. */
const appsCodigo = leer(RAICES.flatMap(archivosCodigo));
/** S96-B · el corpus de R35: la galería es el único lugar de `ui` que se
 *  compone como PANTALLA, y era el hueco de R2 (que solo mira `apps/`). */
const galeria = leer(archivosTsx('packages/ui/src/gallery'));

/** El ancla del corpus, ejecutada (su porqué y su alcance, arriba). Corre
 *  ANTES que cualquier regla: si el corpus se derrumbó, el lint entero se
 *  declara inválido en vez de imprimir doce ceros tranquilizadores. */
{
  const cliente = apps.filter((a) => /apps\/cliente\//.test(a.path)).length;
  const medido = { apps: apps.length, cliente, ui: ui.length };
  const rotos = Object.entries(MINIMOS_CORPUS).filter(([k, min]) => medido[k] < min);
  if (rotos.length > 0) {
    for (const [k, min] of rotos) {
      console.error(
        `CORPUS ✗ ${k}: esperaba al menos ${min} archivo(s) y encontró ${medido[k]}. Las reglas de AUSENCIA que leen este corpus (R1·R2·R3·R4·R5·R6·R7·R8·R10·R13·R20·R29) pasarían en VERDE sin verificar nada: su silencio dejaría de significar "no hay violaciones" y pasaría a significar "no miré" (L-192, tercera capa).`,
      );
    }
    console.error(`\nverify:diseno — corpus roto: el lint se declara inválido`);
    process.exit(1);
  }
}

/** EL ANCLA DEL CORPUS — LA TERCERA CAPA DE L-192, RESUELTA UNA VEZ
 *  (S85-B5, pedido de mesa: "los 12 guards sin ancla()").
 *
 *  EL HUECO MEDIDO: DOCE reglas de AUSENCIA (R1·R2·R3·R4·R5·R6·R7·R8·
 *  R10·R13·R20·R29) pasaban en VERDE con corpus 0 — probado dándoles `[]`
 *  y leyendo su salida: "0 artesanales", "0 crudos", "0 fugas". El
 *  silencio de una regla de ausencia significa "no hay violaciones" SOLO
 *  si hubo algo que mirar.
 *
 *  POR QUÉ UN ANCLA Y NO DOCE, que es la decisión de diseño: las doce
 *  comparten EL MISMO corpus y EL MISMO modo de falla. Doce `ancla()`
 *  copiadas serían doce sitios donde el mínimo puede quedar viejo por
 *  separado — la copia que L-175 prohíbe, un piso más arriba, y
 *  exactamente el argumento con el que esta casa retiró R26. El corpus se
 *  ancla UNA VEZ, en su origen, antes de que ninguna regla corra.
 *
 *  LOS MÍNIMOS, elegidos contra lo medido (apps 154 · cliente 72 · ui 57)
 *  con margen para que el trabajo normal —borrar pantallas, mover
 *  archivos— no fabrique rojos: se fija ~2/3. No son un objetivo ni una
 *  cuota: son el piso bajo el cual el verde deja de significar algo.
 *
 *  ⚠️ SU ALCANCE, DECLARADO PARA QUE NADIE LA LEA MÁS FUERTE DE LO QUE
 *  ES: ancla los corpus que las doce comparten, NO los sub-corpus que
 *  cada regla se filtra adentro. R13 mira solo `apps/cliente/` y por eso
 *  su casa está anclada aparte; pero una regla futura que filtre por una
 *  carpeta más chica vuelve a tener el hueco, y esa ancla es SUYA. Las
 *  reglas con corpus propio (R11 diccionarios · R17 exports · R18 Cuentas
 *  · R24 explorar/ · R25 la primitiva) ya traen la suya y no se tocan.
 *
 *  ☠️ CONDICIÓN DE MUERTE: ninguna propia — muere con el lint. Lo que sí
 *  cambia es el mínimo, y lo cambia quien MIDA, en el commit que mueva el
 *  corpus de verdad. Bajarlo para que pase un rojo es desarmar el guard. */
/** L-170 mecanizada: un censo NO lee comentarios como código — el
 *  primer disparo real del ratchet R2 fue un hex en PROSA (el
 *  comentario de C en bienvenida-dia1:110). Se despojan // y ／* *／
 *  antes de contar. */
/** 🔴 S104-B · ESTE REGEX CEGABA A UNA CLASE ENTERA, y lo encontró R63
 *  produciendo su propio rojo — no una revisión de código.
 *
 *  EL CASO: el regex de comentario de línea no distinguía un comentario
 *  de un doble-slash DENTRO de un string. Sobre la URL de un deep link
 *  (`'cliente:` + tres barras + `cuenta/exportar'`) se comía la
 *  URL desde el segundo slash y dejaba `'cliente:/`. El brazo de deep
 *  links de R63 **medía CERO y su silencio se leía como «no hay ninguno
 *  roto»** — L-192 exacto, un piso más abajo: no falló la regla, falló su
 *  preprocesado.
 *
 *  ⚠️ **NO ERA UN DEFECTO DE R63: es de esta función, que TODAS las reglas
 *  de esta familia comparten.** Cualquier regla futura que busque
 *  `scheme://`, una URL, o un `https://` en el código nacía ciega por la
 *  misma causa, y nunca lo habría sabido.
 *
 *  LA CURA: no se toca un `//` precedido por `:` (protocolo) ni por otro
 *  `/`, ni el que abre una tercera barra. **Sigue siendo un regex y no un
 *  parser, y eso es deliberado:** un parser de JS acá sería el remedio
 *  caro para un problema de conteo. Lo que se cierra es la clase medida,
 *  con su fixture — no toda forma imaginable de string con barras. */
const sinComentarios = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:/'"`])\/\/(?!\/)[^\n]*/g, '$1');
const lineaDe = (src, index) => src.slice(0, index).split('\n').length;

/** EL ANCLA — TERCERA CAPA DE L-192 (S82-B r36).
 *
 *  Las dos primeras capas preguntan si la regla PUEDE salir roja
 *  (fixture) y si CORRE contra la casa (guard de corridas). Falta la
 *  tercera, y es la que deja mudas a las reglas de AUSENCIA: una regla
 *  que dice "no encontré ninguna violación" da exactamente la misma
 *  salida verde cuando **no hay nada que mirar** — porque la carpeta se
 *  renombró, porque la clave que vigila cambió de nombre, porque el
 *  archivo se reestructuró. La regla sigue en su lugar, sigue corriendo,
 *  y ya no verifica nada.
 *
 *  El ancla lo cierra: la regla declara el MÍNIMO de corpus que necesita
 *  para que su silencio signifique algo. Sin ese mínimo, ROJO — el mismo
 *  criterio que ya aplicaban R12/R14/R15/R16/R19/R22 cada una por su
 *  cuenta ("sin fuente no hay verificación"); acá se vuelve una pieza con
 *  nombre para que la próxima regla no tenga que reinventarla.
 *
 *  CONDICIÓN DE MUERTE: ninguna — muere con el lint. Lo que sí puede
 *  morir es cada ancla suelta, el día que su regla deje de existir. */
function ancla(nombre, encontrado, minimo, queEs) {
  if (encontrado >= minimo) return [];
  return [
    `${nombre}: ANCLA ROTA — esperaba al menos ${minimo} ${queEs} y encontró ${encontrado}. Una regla de AUSENCIA sin corpus pasa en VERDE sin verificar nada: su silencio dejó de significar "no hay violaciones" y pasó a significar "no miré" (L-192, tercera capa).`,
  ];
}

// ── LAS REGLAS: funciones puras (archivos) → { fallos: string[], info } ──

/** R1 · 7bis sobre SelectorOpcion: naturaleza legal; entidad y
 *  naturaleza EXCLUYENTES (entidad ES relleno por espec S73). */
/** S85-B1 · EL LABEL DECÍA "implícita" Y EL BUCKET ERA "todo lo demás":
 *  un `naturaleza="seFija"` ESCRITO A MANO se contaba como heredado. El
 *  número era correcto y la palabra no — y en un censo de 59 casos eso
 *  borra justo la distinción que el censo existe para tener (qué se
 *  declaró vs qué se heredó del default). Se parte en dos conteos. */
function r1(archivos) {
  const fallos = [];
  let existe = 0, entidad = 0, seFijaDeclarada = 0, sinNaturaleza = 0;
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/<SelectorOpcion\b/g)) {
      const fin = src.indexOf('/>', m.index);
      const tag = src.slice(m.index, fin === -1 ? m.index + 800 : fin);
      const nat = tag.match(/naturaleza="(\w+)"/);
      const esEntidad = /\bentidad\b/.test(tag);
      const linea = lineaDe(src, m.index);
      if (nat && !['existe', 'seFija'].includes(nat[1]))
        fallos.push(`${path}:${linea} — naturaleza="${nat[1]}" no es un valor legal`);
      if (nat && esEntidad)
        fallos.push(`${path}:${linea} — entidad y naturaleza son excluyentes`);
      if (esEntidad) entidad++;
      else if (nat?.[1] === 'existe') existe++;
      else if (nat?.[1] === 'seFija') seFijaDeclarada++;
      else sinNaturaleza++;
    }
  }
  return {
    fallos,
    info: `existe=${existe} · entidad=${entidad} · seFija-declarada=${seFijaDeclarada} · sin-naturaleza=${sinNaturaleza}`,
  };
}

/** R2 · Ley 1 (cero hex crudos en apps) — RATCHET: baseline 4, medido POR
 *  ESTE LINT y SIN comentarios (la historia del número: grep -c dijo 7
 *  —contaba líneas—, el lint crudo dijo 8, y despojar prosa dijo 4:
 *  el contador lo mide la herramienta que lo exige, L-141+L-170). Solo baja. */
const BASELINE_HEX = 1;
function r2(archivos) {
  let hexes = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const n = (sinComentarios(src).match(/#[0-9A-Fa-f]{6}\b/g) ?? []).length;
    if (n > 0) { hexes += n; porArchivo.push(`${path}: ${n}`); }
  }
  const fallos = hexes > BASELINE_HEX
    ? [`Ley 1: ${hexes} hex crudos (baseline ${BASELINE_HEX}) — subió:\n    ${porArchivo.join('\n    ')}`]
    : [];
  return { fallos, info: `${hexes}/${BASELINE_HEX}${hexes < BASELINE_HEX ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R35 · EL COLOR APLICADO SALE DEL TEMA — LA LEY 1 EN `packages/ui`
 *  (S96-B, D-781; adjudicación de mesa sobre el hallazgo de B).
 *
 *  EL HUECO QUE CIERRA, y lo encontró una cura propia: al montar la
 *  muestra de `PuertaDeOficio` en la galería metí un hex crudo
 *  (`#00000010`) y **R2 no lo cazó, porque su corpus es solo `apps/`**.
 *  Lo curé antes de commitear, pero el agujero quedaba: **la Ley 1 no
 *  dice "cero hex crudos en apps", dice CERO HEX CRUDOS**, y la galería
 *  es el único lugar de `ui` que se compone como pantalla.
 *
 *  🔴 POR QUÉ NO ES "R2 CON EL CORPUS MÁS GRANDE", que era el pedido
 *  literal — y es el hallazgo de esta regla: **ensanchar R2 tal cual
 *  habría producido 29 rojos en la galería y ~27 eran FALSOS.** El regex
 *  de R2 cuenta `#XXXXXX` en cualquier posición, y la galería de TOKENS
 *  está llena de hex **dentro de strings de etiqueta** que documentan
 *  valores medidos (`"tealDark #0A7268 — claro 5.51"`). Eso no es un
 *  color aplicado: **es el trabajo de la galería**. `sinComentarios` no
 *  los quita porque no son comentarios.
 *
 *  ⇒ La regla no ensancha un corpus: **afina la PREGUNTA**. Mira hex en
 *  POSICIÓN DE VALOR DE ESTILO (`backgroundColor:`, `color:`, `fill:`…),
 *  que es lo único que la Ley 1 prohíbe. Un hex MENCIONADO documenta; un
 *  hex APLICADO se salta el tema.
 *
 *  LO QUE ENCONTRÓ AL MEDIRSE, antes de existir (por eso se mide antes
 *  de curar): **los 6 stops de la rampa del logo duplicados en
 *  `Isotipo.tsx`**, contra `DIRECCION_ARTE` §9bis.3 que declara
 *  `gradients.logo` como su FUENTE ÚNICA. Verificados byte a byte contra
 *  `palette` y deduplicados en el mismo commit — el render no cambió.
 *  *Una copia de la rampa de marca diverge en silencio: el día que
 *  alguien afine un stop, el isotipo se queda con el viejo.*
 *
 *  ⏪ BASELINE 0 — Y MURIÓ EL MISMO DÍA QUE NACIÓ. Nació en 1 con dueño
 *  declarado: `animated-icon.tsx` tenía `#208AEF` en un `splashOverlay`,
 *  residuo del template de Expo, **territorio de C** — así que se declaró
 *  y se pidió, no se curó desde acá (§6 del método). **C lo mató en su
 *  tanda de marca** (el overlay pasó a `palette.tealDark` + `<Isotipo
 *  variant="blanco">`) y con el merge `f3029182` el piso bajó en `main`.
 *
 *  **RE-MEDIDO SOBRE `main` ANTES DE BAJARLO, y no sobre el aviso:** C
 *  reportó "R35 bajó a 0" desde SU worktree cuando en `main` todavía daba
 *  1/1 — la clase ④ de S88 (*ningún contador se toma de un reporte previo;
 *  se lee del objeto en el turno en que se usa*), con el agravante de que
 *  acá el "objeto" tiene DOS árboles. **No se bajó hasta medir 0 en el
 *  árbol donde la regla corre**, porque un baseline es un TECHO: bajarlo
 *  antes de que baje el piso pone la regla en ROJO contra `main` y le
 *  frena el commit a todos, incluido quien hizo la cura.
 *
 *  *(Queda una mención de `#208AEF` en `main`: vive en el COMENTARIO que
 *  documenta qué había antes. R35 no la cuenta y hace bien — `sinComentarios`
 *  es L-170 mecanizada: un censo no lee prosa como código.)*
 *
 *  ☠️ CONDICIÓN DE MUERTE: ninguna propia — muere con el lint. */
const BASELINE_R35 = {};
const RE_R35 = /(backgroundColor|borderColor|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor|shadowColor|tintColor|color|fill|stroke|stopColor)\s*:\s*'#[0-9A-Fa-f]{3,8}'/g;
function r35(archivos) {
  const fallos = [];
  let total = 0;
  const sumaBaseline = Object.values(BASELINE_R35).reduce((a, b) => a + b, 0);
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    let enArchivo = 0;
    for (const m of limpio.matchAll(RE_R35)) {
      enArchivo++;
      total++;
      if (enArchivo > (BASELINE_R35[path] ?? 0))
        fallos.push(
          `${path}:${lineaDe(limpio, m.index)} — COLOR APLICADO A MANO (${m[0].trim()}). Ley 1: todo color sale de \`@epetplace/ui\` (tokens o slots del tema). Un hex acá no resuelve por tema: se queda igual en oscuro y en memorial, que es la mitad del sistema apagada en silencio.`,
        );
    }
  }
  // ANCLA — escrita contra el modo de falla de ESTA regla: si el corpus
  // de la galería deja de leerse (se renombra la carpeta, se mueve el
  // archivo), R35 informaría "0 colores a mano" en VERDE sobre el único
  // lugar de `ui` que se compone como pantalla — que es justo el lugar
  // por el que nació. No basta con "algún archivo de ui".
  const veGaleria = archivos.some((a) => a.path.includes('packages/ui/src/gallery/'));
  fallos.push(...ancla('R35', veGaleria ? 1 : 0, 1, 'archivo(s) de packages/ui/src/gallery (el corpus que R2 no miraba)'));
  return {
    fallos,
    info: `${total} color(es) aplicados a mano${sumaBaseline === 0 ? ' (DURA EN 0 desde S96-B: el residuo del template murió con la tanda de marca de C, el día que la regla nació)' : ` (baseline ${sumaBaseline})`}${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R3 · A6+§7 sobre Tarjeta — S82-B: GANA MODO DE FALLO (deja de ser
 *  informativa): `elevacion=` solo habla valores del contrato
 *  (plana|reposo|elevada; sm/md = alias DEPRECADOS — legales, contados
 *  aparte para que su número solo baje). El censo de adopción se
 *  conserva como info: las 'plana' explícitas son excepciones con dueño
 *  y su número solo se mueve con decisión — ese juicio sigue siendo de
 *  gate, no de lint. */
const ELEVACION_LEGAL = ['plana', 'reposo', 'elevada'];
const ELEVACION_DEPRECADA = ['sm', 'md'];
function r3(archivos) {
  const fallos = [];
  let plana = 0, explicita = 0, porDefault = 0, deprecada = 0;
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/<Tarjeta\b/g)) {
      const fin = src.indexOf('>', m.index);
      const tag = src.slice(m.index, fin === -1 ? m.index + 400 : fin);
      const ele = tag.match(/elevacion="(\w+)"/);
      if (!ele) { porDefault++; continue; }
      if (ele[1] === 'plana') plana++;
      else if (ELEVACION_DEPRECADA.includes(ele[1])) deprecada++;
      else if (ELEVACION_LEGAL.includes(ele[1])) explicita++;
      else fallos.push(`${path}:${lineaDe(src, m.index)} — elevacion="${ele[1]}" no es un valor del contrato`);
    }
  }
  return { fallos, info: `plana-declarada=${plana} · otra-explícita=${explicita} · deprecada-sm/md=${deprecada} · reposo-por-default=${porDefault}` };
}

/** R4 · Ley 20 (sombras artesanales PROHIBIDAS — el grep del gate,
 *  ahora mecánico): `shadowColor:` literal fuera de theme.* Y
 *  `boxShadow:` con string literal directo, en apps Y en packages/ui.
 *  DURA EN 0: apps y ui nacieron limpios (medido S81; re-medido S82 con
 *  la pata boxShadow — capFoto de AvatarMascota pasa: el valor es
 *  función de la fuente, material FIRMADO, no literal por pantalla). */
function r4(archivos) {
  const fallos = [];
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/shadowColor\s*:/g)) {
      const linea = lineaDe(src, m.index);
      const lineaTxt = src.split('\n')[linea - 1];
      if (!/theme\.|palette\.|tokens/.test(lineaTxt) || /['"]#/.test(lineaTxt)) {
        // literal de color o fuente desconocida = artesanal
        if (/['"]/.test(lineaTxt.split('shadowColor')[1] ?? '')) {
          fallos.push(`${path}:${linea} — sombra artesanal (Ley 20): ${lineaTxt.trim().slice(0, 60)}`);
        }
      }
    }
    for (const m of src.matchAll(/boxShadow\s*:\s*['"`]/g)) {
      fallos.push(`${path}:${lineaDe(src, m.index)} — boxShadow literal (Ley 20): la sombra sale de theme.elevacion, jamás de un string por pantalla`);
    }
  }
  return { fallos, info: `${fallos.length} artesanales` };
}

/** R5 · Ley 21 sobre Boton (S82-B — la capa que Boton ya EMBODIA por
 *  construcción: el CTA ancla al SLOT accent.cta desde S63 y "nadie
 *  re-resuelve por pantalla" ES la letra; target 44 por construcción
 *  desde S58). El único modo de ruptura posible desde apps es
 *  re-resolver el slot a mano — y eso es lo que se vigila, en dos vías:
 *  `cta="` fuera del _layout RAÍZ = DURA EN 0 (la letra: "el raíz del
 *  prestador pasa 'oficio'" — solo el raíz; medido: el único vivo es el
 *  raíz legal) · `accent.cta`/`ctaTexto` directo = RATCHET baseline 1
 *  (el hallazgo del estreno de esta regla: negocio/equipo.tsx:719
 *  colorCheck={theme.accent.ctaTexto} — COBRADO en S82-B ronda 2 por
 *  orden founder: el check sobre fill pasó al blanco del canon SÓLIDO,
 *  Ley 22). Baseline EN EL PISO: solo baja, y de 0 no se sube jamás. */
const BASELINE_ACCENT_CTA = 0;
function r5(archivos) {
  const fallos = [];
  let directos = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    const esLayoutRaiz = /src\/app\/_layout\.tsx$/.test(path);
    const n = (limpio.match(/accent\.cta(?:Texto)?\b/g) ?? []).length;
    if (n > 0) { directos += n; porArchivo.push(`${path}: ${n}`); }
    if (!esLayoutRaiz) {
      for (const m of limpio.matchAll(/\bcta="/g)) {
        fallos.push(`${path}:${lineaDe(limpio, m.index)} — cta= fuera del _layout raíz (Ley 21): solo el raíz declara el registro del CTA`);
      }
    }
  }
  if (directos > BASELINE_ACCENT_CTA)
    fallos.push(`Ley 21: ${directos} accent.cta re-resueltos en apps (baseline ${BASELINE_ACCENT_CTA}) — el CTA lo resuelve Boton por el slot:\n    ${porArchivo.join('\n    ')}`);
  return { fallos, info: `cta-fuera-de-raíz=${fallos.length - (directos > BASELINE_ACCENT_CTA ? 1 : 0)} · accent.cta=${directos}/${BASELINE_ACCENT_CTA}${directos < BASELINE_ACCENT_CTA ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R6 · La regla del teclado (§15b / D-498) sobre EvitaTeclado (S82-B):
 *  el portador es UNO y vive en ui — `KeyboardAvoidingView` crudo en
 *  apps = fallo. DURA EN 0 (medido: el barrido D-498 dejó apps limpias). */
/*  S85-B1 · DECÍA "N crudos" Y CONTABA ARCHIVOS: el `break` cortaba
 *  después del primero, así que una pantalla con tres portadores crudos
 *  reportaba "1 crudo" y curar uno la dejaba en verde aparente. Ahora
 *  cuenta OCURRENCIAS y las reporta todas — el número y la palabra
 *  vuelven a decir lo mismo, y el segundo caso de un archivo deja de
 *  esconderse detrás del primero. */
function r6(archivos) {
  const fallos = [];
  let archivosConCrudo = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    let enArchivo = 0;
    for (const m of limpio.matchAll(/\bKeyboardAvoidingView\b/g)) {
      enArchivo++;
      fallos.push(`${path}:${lineaDe(limpio, m.index)} — KeyboardAvoidingView crudo (D-498): la casa tiene UNA — EvitaTeclado`);
    }
    if (enArchivo > 0) archivosConCrudo++;
  }
  return { fallos, info: `${fallos.length} ocurrencia(s) en ${archivosConCrudo} archivo(s)` };
}

/** R7 · §5 LA ENTRADA sobre Entrada (S82-B): la entrada firmada tiene UN
 *  portador (Entrada, números PRIVADOS por condición de mesa) — el
 *  FadeIn* artesanal por pantalla es la re-implementación que el censo
 *  S81 señaló. RATCHET baseline 2 (el escalonado S52 del Hogar,
 *  pre-§5 — migra al tocarse, D-318). Solo baja. */
const BASELINE_FADEIN = 2;
function r7(archivos) {
  let n = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const c = (sinComentarios(src).match(/\bFadeIn(?:Down|Up|Left|Right)?\b/g) ?? []).length;
    if (c > 0) { n += c; porArchivo.push(`${path}: ${c}`); }
  }
  const fallos = n > BASELINE_FADEIN
    ? [`§5: ${n} FadeIn* artesanales (baseline ${BASELINE_FADEIN}) — la entrada tiene UN portador (Entrada):\n    ${porArchivo.join('\n    ')}`]
    : [];
  return { fallos, info: `${n}/${BASELINE_FADEIN}${n < BASELINE_FADEIN ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R8 · Ley 13 sobre EstadoVacio (S82-B — la capa que EstadoVacio
 *  embodia por construcción: SIN animación de entrada, "un vacío que
 *  anima llama la atención sobre sí mismo"). El modo de fallo es REAL y
 *  casi ocurrió: S81-B② documentó el veto L-c a envolver el EstadoVacio
 *  de adoptar en Entrada. Dos vías: <Entrada> conteniendo <EstadoVacio
 *  = DURA EN 0 (la vía del veto — el portador nuevo no absorbe vacíos)
 *  · <Animated.View entering=> conteniendo <EstadoVacio = RATCHET
 *  baseline 0 — EN EL PISO: los dos del estreno (hogar/index 913/1164)
 *  se COBRARON en S82-B ronda 2 por orden founder (la rama de error a
 *  View plano; la zona de la vida decide su envoltorio por estado —
 *  monta en vacío = aparece QUIETA). Solo baja — de 0 no se sube. */
const BASELINE_VACIO_ENTERING = 0;
/*  S85-B1 · EL RESUMEN ANULABA UN BRAZO CUANDO EL OTRO DISPARABA. El
 *  info derivaba `en-Entrada` de `fallos.length` con una condición que
 *  lo mandaba a 0 apenas el brazo del `entering` pasaba su baseline:
 *  medido, DOS violaciones reales de EstadoVacio-en-Entrada se
 *  reportaban como `en-Entrada=0`. Los fallos SÍ se listaban —el rojo
 *  nunca se perdió—, pero quien leyera el resumen buscaría el defecto
 *  en el brazo equivocado. Los dos brazos cuentan aparte, cada uno lo
 *  suyo. */
function r8(archivos) {
  const fallos = [];
  let enEntrada = 0, entering = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    for (const m of src.matchAll(/<Entrada\b/g)) {
      const cierre = src.indexOf('</Entrada>', m.index);
      const bloque = src.slice(m.index, cierre === -1 ? m.index + 2000 : cierre);
      if (/<EstadoVacio\b/.test(bloque)) {
        enEntrada++;
        fallos.push(`${path}:${lineaDe(src, m.index)} — EstadoVacio dentro de Entrada (Ley 13): el vacío JAMÁS se anima (veto L-c, S81)`);
      }
    }
    for (const m of src.matchAll(/<Animated\.View\b[^>]*entering=/g)) {
      const cierre = src.indexOf('</Animated.View>', m.index);
      const bloque = src.slice(m.index, cierre === -1 ? m.index + 2000 : cierre);
      if (/<EstadoVacio\b/.test(bloque)) { entering++; porArchivo.push(`${path}:${lineaDe(src, m.index)}`); }
    }
  }
  if (entering > BASELINE_VACIO_ENTERING)
    fallos.push(`Ley 13: ${entering} EstadoVacio bajo entering= (baseline ${BASELINE_VACIO_ENTERING}) — el vacío JAMÁS se anima:\n    ${porArchivo.join('\n    ')}`);
  return { fallos, info: `en-Entrada=${enEntrada} · bajo-entering=${entering}/${BASELINE_VACIO_ENTERING}${entering < BASELINE_VACIO_ENTERING ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R9 · Ley 17.5 sobre EstadoVacio — INFORMATIVA DECLARADA, y el porqué
 *  es de LETRA, no de pereza: "todo vacío termina en un camino" CHOCA
 *  con el precedente FIRMADO del próximamente sereno (S52; adoptar S73
 *  declara en su CHANEL "cero CTA decorativo — el vacío sereno no
 *  inventa acciones"). Un DURA acá fabricaría falsos rojos sobre
 *  composiciones firmadas — el arbitraje es del founder (⚖️ en el
 *  reporte S82-B). El censo alimenta esa mesa. */
function r9(archivos) {
  let conCamino = 0, sinCamino = 0;
  for (const { src } of archivos) {
    for (const m of src.matchAll(/<EstadoVacio\b/g)) {
      const fin = src.indexOf('/>', m.index);
      const tag = src.slice(m.index, fin === -1 ? m.index + 800 : fin);
      if (/\baccion=/.test(tag)) conCamino++;
      else sinCamino++;
    }
  }
  return { fallos: [], info: `con-camino=${conCamino} · sin-camino=${sinCamino} (⚖️ 17.5 vs próximamente-sereno: arbitraje founder)` };
}

/** R10 · Los overrides LOCALES de la lámina S82-C (marca de agua ·
 *  canto que pinta la curva · fila de recomendación · filtro de la
 *  vida) NO SE GENERALIZAN desde la pantalla — la promoción es de B
 *  después del gate (orden founder S82 ronda 2). El guard ata el
 *  MARCADOR `@override-s82c` a su única casa (hogar/index del cliente):
 *  cubre el vector real de propagación — el copy-paste, que viaja CON
 *  el comentario (L-170 al revés: acá el comentario ES la señal, por
 *  eso esta regla lee el fuente CRUDO, sin despojar). DURA EN 0 fuera
 *  de la casa. Reconciliación declarada: no cubre la reinvención sin
 *  marcador — esa la atrapa el gate de craft, no un grep. */
/** TRES casas declaradas: el Hogar (ronda 2), el PERFIL (ronda 3 — la
 *  imagen-acuerdo ordenó serif/círculo locales ahí) y canto-curva.tsx
 *  (la pieza extraída para que el perfil no la clone — regla 37; sigue
 *  siendo override local del CLIENTE, jamás packages/ui). NOTA VIVA:
 *  en su primer día esta regla cobró una fuga REAL — la propia
 *  extracción de CantoCurva salió sin declarar su casa y el lint la
 *  paró (exit 1). El guard no es decorativo. */
// S85-B7 · `filtro-pills` SALE DE LA LISTA DE CASAS: se promovió a
// `packages/ui` y su marcador `@override-s82c` se fue con él — ya no es
// un override local, es una pieza de la casa. Dejar su nombre acá sería
// declarar como casa de override algo que dejó de serlo, que es la misma
// clase de mentira que R13 tenía en su info.
const CASA_OVERRIDE_S82C = /apps\/cliente\/src\/(app\/\(tabs\)\/hogar\/(index|mascota\/\[mascotaId\])|components\/(canto-curva|reserva-piezas|detalle-cita))\.tsx$/;
function r10(archivos) {
  const fallos = [];
  for (const { path, src } of archivos) {
    if (CASA_OVERRIDE_S82C.test(path)) continue;
    for (const m of src.matchAll(/@override-s82c/g)) {
      fallos.push(`${path}:${lineaDe(src, m.index)} — @override-s82c fuera de su casa: el override local NO se generaliza (la promoción es de B, post-gate)`);
    }
  }
  return { fallos, info: `${fallos.length} fugas del override` };
}

/** R11 · MODELO_LOYALTY §3 sobre LA VOZ DEL MOMENTO (S82-C r3, del
 *  literal transcrito del perfil): la voz describe la ETAPA — si algún
 *  día dice "va bien", "nivel", "%", "racha" o "completaste", cruzó lo
 *  que §3 prohíbe. Mecanizable porque la voz es DICCIONARIO CERRADO
 *  (keys vozCardM*): se escanean las líneas de esas keys en los
 *  diccionarios del cliente contra el vocabulario de score. DURA EN 0. */
const RE_VOZCARD = /vozCardM\d\s*:/;
const RE_SCORE = /%|\bnivel\b|\bprogres\w*|\bpunt(?:os|aje)\b|\brachas?\b|\bcomplet(?:aste|ado|é)\b|\bva bien\b|\blevel\b|\bstreak\b|\bscore\b/i;
function r11(archivosDic) {
  const fallos = [];
  let vigiladas = 0;
  for (const { path, src } of archivosDic) {
    let enArchivo = 0;
    src.split('\n').forEach((lineaTxt, i) => {
      if (!RE_VOZCARD.test(lineaTxt)) return;
      enArchivo++;
      if (RE_SCORE.test(lineaTxt)) {
        fallos.push(`${path}:${i + 1} — la voz del momento habla de DESEMPEÑO (LOYALTY §3): ${lineaTxt.trim().slice(0, 70)}`);
      }
    });
    // ANCLA: esta regla vigila una FAMILIA DE CLAVES POR NOMBRE
    // (`vozCardM<n>`). Si esas claves se renombran en una reforma de
    // i18n, el regex deja de matchear y la regla informa "0 voces con
    // score" para siempre — verde perfecto, vigilando un fantasma.
    fallos.push(...ancla('R11', enArchivo, 1, `clave(s) vozCardM* en ${path}`));
    vigiladas += enArchivo;
  }
  return { fallos, info: `${fallos.length} fallo(s) · ${vigiladas} voces vigiladas` };
}
const DICCIONARIOS = ['apps/cliente/src/i18n/es.ts', 'apps/cliente/src/i18n/en.ts'];
const dics = DICCIONARIOS.map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));

/** R12 · CONTRASTE EN LOS DOS TEMAS (S82-B r4, orden founder): todo par
 *  texto/superficie (4.5) y todo canto sobre su fondo (3.0 no-textual)
 *  pasa en claro Y en oscuro. Los pares los enumera el VOLCADOR
 *  (`scripts/verify-diseno-pares.ts`, misma matemática que
 *  verify-contrast S43 — los dos gates jamás miden distinto); esta
 *  regla los juzga. NO reemplaza a verify:contrast (178 pares curados
 *  por componente): este es el barrido SISTEMÁTICO.
 *  El censo del estreno (29-jul) midió 56 pares y halló 6 bajo mínimo:
 *  1 EXENTA FIRMADA + 5 A BASELINE nominal (lista servida al founder en
 *  el reporte r4) — solo-baja: un par que sale del baseline no vuelve,
 *  y todo par NUEVO bajo mínimo es rojo. Si el volcador no corre o no
 *  parsea, la regla FALLA FUERTE (L-192: el silencio no verifica). */
const EXENTAS_R12 = new Set([
  // FIRMADA S73 (registro del entity chip): fill-vs-fondo dark 2.24–2.47
  // — "el blanco 8.25 carga el estado; el ojo del founder lo firmó
  // igual; sube a deuda si un usuario real lo reporta".
  'dark·canto·accent.controlLleno/bg.card',
]);
const BASELINE_R12 = new Set([
  // ═══ S83-B30 · REGRESIÓN VIVA, NO HERENCIA — y se rotula así a
  // propósito, porque un baseline que no distingue lo heredado de lo que
  // uno acaba de romper es donde se esconde el daño propio.
  //
  // LAS CUATRO LAS CAUSÓ EL TAPIZ AL 8% (S83-B25, `42ffaef`, FIRMADO por
  // el founder), y el barrido las cazó en su PRIMERA corrida — media hora
  // después del commit. Antes/después, mismo medidor:
  //     fill accent.cta/bg.base ... 3.37 → 2.79 → ✅ CURADO en B31 (10.50)
  //     capaText.comunidad/capaBg ... 5.22 → 4.35 → ✅ 4.90 al 5% (B32)
  //     capaText.comunidadAmplia .... 4.71 → 3.87 → ⚠️ 4.40 al 5%, falta 0.10
  //     status.dangerText/dangerBg .. 5.48 → 4.43 → ✅ 5.06 al 5% (B32)
  //
  // LA CAUSA, medida: `capaBg` y `statusBg` son rgba con ALPHA y se
  // componen sobre `bg.base`. Aclarar el fondo aclara el tinte, y el
  // texto de capa —que es claro— pierde contraste contra él. **TRES de
  // las cuatro son de TEXTO**, o sea AA de verdad y no elemento gráfico.
  //
  // POR QUÉ EN BASELINE Y NO EN ROJO: el rojo bloquearía el hook a las
  // tres pistas en pleno ciclo de campo. Entran acotadas y VISIBLES en
  // cada corrida, no exentas — `EXENTAS_R12` es para lo que la casa
  // decidió; esto es lo que hay que decidir.
  //
  // ⏪ S85-B6 — VUELVE, Y VUELVE CON MÁS INFORMACIÓN QUE ANTES.
  // S85-B4 la curó bajando `violetAlpha15` a .12 (par 4.40 → 4.54). El
  // founder la REVIRTIÓ en dispositivo, literal: «el tinte verde no se ve
  // o no se percibe, ni en claro ni en oscuro». Un ajuste imperceptible
  // no paga su costo, así que el par vuelve a 4.40 y vuelve acá.
  //
  // LO QUE LA VUELTA DEJA MEDIDO, y por eso el menú de este par ya no es
  // el que era: (a) el comentario original ofrecía "volver el tapiz al
  // 3%" — esa salida apuntaba a `tapizDark`, el tapiz del CLIENTE, y este
  // par cuelga de `tapizDarkOficio`: MOVÍA UNA PERILLA QUE NO LO
  // GOBIERNA. (b) La perilla del tinte (`violetAlpha`) SÍ lo gobierna y
  // alcanza, pero su efecto es INVISIBLE — probado en dispositivo, no
  // deducido. (c) Quedan las dos caras: `tapizDarkOficio` un paso más
  // oscuro (#0B1213 → par 4.54; 19 pares mejoran, ninguno pasa a
  // reprobar) que toca un valor atado a "un tinte por casa", y la tanda
  // de los textos de capa del oscuro, que es cara y con gate propio.
  //
  // ⚠️ SE QUEDA VISIBLE EN CADA CORRIDA A PROPÓSITO: un número bajo
  // mínimo que nadie percibe SIGUE SIENDO un número bajo mínimo. Que el
  // founder no vea el tinte es dato sobre la CURA, no sobre el defecto —
  // el texto de capa sobre su tinte mide 4.40 contra un piso AA de 4.5, y
  // quien lo lea con menos vista que él lo va a sufrir igual. Qué hacer
  // con eso es decisión suya; esconderlo no es una de las opciones.
  'darkOficio·texto·capaText.comunidadAmplia/capaBg.comunidadAmplia',
  // ═══ S83-B30 · HEREDADAS DEL CLIENTE, que el barrido nuevo hizo
  // visibles pero NO nacieron hoy:
  // · el ORO contra papel (1.55) es EXENCIÓN FIRMADA — E1 lo midió y el
  //   founder firmó igual, compensando con `ctaElevado`. Su lugar sería
  //   EXENTAS, pero se deja acá con su nota hasta que la mesa lo mueva:
  //   moverlo yo sería firmar una exención que no firmé.
  'light·fill·accent.cta/bg.base',
  'light·fill·accent.cta/bg.card',
  // · los tres del oscuro del cliente, ya conocidos por r19/r20 (abajo).
  'darkOficio·canto·accent.controlLleno/bg.card',
  // S82-B r19 — LOS DOS PARES DE SUPERFICIE DEL OSCURO, con el hallazgo
  // que los pone acá y no en una cura: subir bg.card ROMPE los textos que
  // van encima. Medido: a 1.26 caen SEIS pares AA firmados (capaText
  // comunidadAmplia y comunidad, dangerText sobre su tinte, dos avatares
  // de iniciales, el tonal de Ley 22) y a 1.11 todavía caen DOS. El techo
  // no lo pone el gusto: lo pone el texto de capa del oscuro. Subir la
  // superficie exige subir ANTES violetText/pinkDark y re-medir los 178
  // — es una tanda propia con su gate, no un token. Revertido a 1.05.
  //
  // S82-B r20 — EL OTRO LADO DEL PAR TAMBIÉN CERRADO, por una razón
  // DISTINTA: bajar `bg.base` con card quieto NO rompe nada (los seis
  // pares eran texto sobre SUPERFICIE; los que tocan el FONDO ganan —
  // text.primary 17.73→18.29 · secondary 8.49→8.76 · capaText
  // 13.23→13.65) pero **NO ALCANZA**: con card en #0D0D12 y el fondo en
  // NEGRO ABSOLUTO el par llega a **1.083**, y de #050508 a #000000 sube
  // apenas 0.033. EL PORQUÉ: el +0.05 de la fórmula WCAG DOMINA cuando
  // las dos luminancias son ~0 (card L=0.00417, base L=0.00158) — el
  // contraste SE APLANA en el extremo oscuro. No falta margen: NO HAY
  // margen por debajo, y el tema perdería su "bosque nocturno" a cambio
  // de 0.03. ⇒ LOS DOS LADOS MEDIDOS Y CERRADOS; la decisión es del
  // founder: (a) abrir la tanda de los textos de capa del oscuro, o
  // (b) que el oscuro separe por otro canal — borde NO (A6/Ley 20).
  // S82-B r29 — RE-DECLARADOS, NO RETIRADOS (tu punto 5). Con (c) SIN
  // TARJETA firmado, `card` deja de ser "la tarjeta del contenido" —
  // pero NO deja de existir: sigue siendo la superficie de LO QUE
  // FLOTA (Hojas, modales, la barra fija del CTA), y eso es el PISO que
  // no puede desaparecer. Así que el par sigue midiendo algo real; lo
  // que cambió es QUÉ mide. Quedan en baseline con el mismo número y
  // otro significado, y su cura sigue siendo la misma tanda cara.
  'dark·superficie·bg.card/bg.base',
  'dark·superficie·bg.elevated/bg.base',
  // VACÍO desde S82-B r5 (solo-baja EJECUTADO): los 5 del censo del
  // estreno CURARON por orden founder — capa.identidad/cuidado del tema
  // CLARO bajaron al primer escalón oscuro de su rampa (verdeVitalDark ·
  // tealDark) y dangerText ganó su paso (coralDarkTexto). La reversa
  // vive en themes/light.ts (una línea). De vacío no se sube jamás.
]);
/** Las que están en baseline por REGRESIÓN de S83-B25 (el tapiz al 8%),
 *  no por herencia: se cuentan aparte para que el info no las disfrace de
 *  "baseline-founder". Un número que mezcla lo decidido con lo que hay que
 *  decidir esconde justo lo que hay que mirar. */
/** LA REGRESIÓN DEL TAPIZ — QUEDA UNA, Y VOLVIÓ POR FIRMA.
 *  Nacieron CUATRO en S83-B30 (el tapiz al 8%, firmado, cazadas media
 *  hora después del commit). El founder bajó a 5% ("al 8% es muy pesado",
 *  en dispositivo) y eso curó DOS SOLO, sin tocar un token de texto — la
 *  contracara exacta de la causa: los tintes son alpha sobre `bg.base`,
 *  así que oscurecer el fondo oscurece el tinte y el texto claro recupera
 *  contraste. La tercera (el CTA) cayó en B31.
 *
 *  LA CUARTA resistió a las dos bajadas de tapiz porque cuelga de OTRO
 *  fondo: `tapizDarkOficio`, el del prestador. S85-B4 la curó por el
 *  TINTE (`violetAlpha15` → .12) y el founder REVIRTIÓ esa cura en
 *  dispositivo: «el tinte verde no se ve o no se percibe, ni en claro ni
 *  en oscuro». Así que vuelve a estar abierta, y con una información que
 *  antes no existía: **la perilla del tinte alcanza pero es invisible**,
 *  medido en pantalla y no deducido.
 *
 *  ⚠️ Se cuenta APARTE de `BASELINE_R12` a propósito: `EXENTAS` es lo que
 *  la casa decidió y `BASELINE` lo heredado; esto es LO QUE HAY QUE
 *  DECIDIR, y un número que mezcla las tres esconde justo lo que hay que
 *  mirar. */
const REGRESION_B25 = new Set([
  'darkOficio·texto·capaText.comunidadAmplia/capaBg.comunidadAmplia',
]);
function r12(pares) {
  const fallos = [];
  let exentas = 0, enBaseline = 0, bajaron = 0, regresion = 0;
  for (const p of pares) {
    const clave = `${p.tema}·${p.clase}·${p.nombre}`;
    if (p.ratio >= p.minimo) {
      if (BASELINE_R12.has(clave)) bajaron++;
      continue;
    }
    if (EXENTAS_R12.has(clave)) { exentas++; continue; }
    if (REGRESION_B25.has(clave)) { regresion++; continue; }
    if (BASELINE_R12.has(clave)) { enBaseline++; continue; }
    fallos.push(`R12: ${clave} = ${p.ratio.toFixed(2)} (mín ${p.minimo}) — par bajo mínimo FUERA de baseline/exentas`);
  }
  return {
    fallos,
    info:
      `pares=${pares.length} · exentas-firmadas=${exentas} · baseline=${enBaseline}` +
      (regresion > 0
        ? ` · ⚠️ ${regresion} REGRESIÓN ABIERTA del tapiz 8% (S83-B25) — espera decisión del founder, NO es baseline`
        : '') +
      (bajaron > 0 ? ` · ${bajaron} BAJARON: actualizar baseline` : ''),
  };
}
/**
 * ⭐ S90-B · EL RESOLVEDOR DEL RUNNER — la cura de un modo de falla que NO
 * es del lint sino de su ARRANQUE.
 *
 * EL CASO, medido por la pista D en esta misma sesión: `pnpm exec tsx` NO
 * sobrevive a un worktree recién creado —o con `node_modules` prestado—
 * porque `pnpm exec` resuelve el workspace antes de resolver el binario.
 * D quedó **sin R12 ni R15**, que son las dos reglas de CONTRASTE: las
 * únicas que miden accesibilidad.
 *
 * POR QUÉ ERA GRAVE Y NO MOLESTO: el guard hacía lo correcto —salía en
 * ROJO, jamás en verde (L-197)— pero un rojo que solo dice «no pude»
 * **es indistinguible de un rojo que dice «encontré un par malo»** para
 * quien lo lee apurado. Una pista que arranca su worktree se queda sin
 * la medición de contraste y no tiene forma barata de saber por qué.
 *
 * LA CURA es que el volcador SEPA CORRER, en cascada, con cada intento
 * declarado:
 *   ① el binario de `node_modules/.bin`, resuelto POR RUTA subiendo el
 *      árbol — no le pregunta nada a pnpm, así que el modo de falla de D
 *      no existe acá;
 *   ② `pnpm exec` — el camino histórico, que sigue siendo el bueno
 *      cuando el workspace está sano;
 *   ③ `npx --no-install` — la última red, sin bajar nada de la red.
 *
 * Y SI LAS TRES CAEN, el mensaje dice LAS TRES con su error. *Todo freno
 * declara CONTRA QUÉ MIDIÓ* — un «no pude» sin el qué-intenté manda a la
 * siguiente pista a re-descubrir lo mismo.
 */
const RAIZ_REPO = resolve(dirname(new URL(import.meta.url).pathname), '..');

/** Busca un binario de `node_modules/.bin` subiendo desde `desde`. */
function binDeNodeModules(nombre, desde) {
  let dir = desde;
  for (let i = 0; i < 8; i++) {
    const p = join(dir, 'node_modules', '.bin', nombre);
    if (existsSync(p)) return p;
    const padre = dirname(dir);
    if (padre === dir) break;
    dir = padre;
  }
  return null;
}

/** El volcador corre UNA vez por invocación; si cae, R12 y R15 fallan
 *  fuerte. Desde r6 emite { pares, tokens } (los tokens para R15). */
function volcadorReal() {
  const GUION = 'scripts/verify-diseno-pares.ts';
  const binLocal = binDeNodeModules('tsx', RAIZ_REPO);
  const intentos = [
    binLocal ? { como: '.bin/tsx (por ruta)', cmd: `"${binLocal}" ${GUION}` } : null,
    { como: 'pnpm exec', cmd: `pnpm exec tsx ${GUION}` },
    { como: 'npx --no-install', cmd: `npx --no-install tsx ${GUION}` },
  ].filter(Boolean);

  const fallidos = [];
  for (const intento of intentos) {
    try {
      const out = execSync(intento.cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: RAIZ_REPO,
      });
      const dump = JSON.parse(out);
      if (!Array.isArray(dump?.pares) || dump.pares.length === 0) throw new Error('volcador sin pares');
      if (!Array.isArray(dump?.tokens) || dump.tokens.length === 0) throw new Error('volcador sin tokens');
      return { ...dump, via: intento.como };
    } catch (e) {
      fallidos.push(`${intento.como}: ${String(e.message ?? e).slice(0, 70)}`);
    }
  }
  return { caido: fallidos.join(' · ') };
}

/** R15 · LA EXCLUSIÓN DE A5 (§9bis.3 FIRMADA, S82-B r6 — orden founder):
 *  ningún token del tema del CLIENTE resuelve a #0F5E56 ni a su familia.
 *  La letra define la familia por ejemplar y por porqué ("es barro, no
 *  está en la marca, y colisiona con el acento firmado del prestador");
 *  el lint necesita números — OPERACIONALIZACIÓN DECLARADA de B
 *  (ajustable en mesa, jamás ley nueva): familia = matiz a ±12° de
 *  #0F5E56 (H≈174°) · saturación ≥30% · luminosidad ≤35% (el carácter
 *  oscuro-apagado). Verificada contra los ejemplares: #0F5E56 ✓ dentro ·
 *  tealDark #0A7268 ✓ dentro (ES el acento del prestador — la colisión
 *  literal) · tealDarkNoche ✓ dentro · teal vivo #28E8DA fuera (L 53%,
 *  está en la marca) · verdeVitalDark fuera (H 133°).
 *  Alcance: valores OPACOS (hex/rgb); los tints con alpha se CUENTAN
 *  como info (un rgba .25 de familia compositado no es barro — su
 *  destino es de mesa, no de este lint).
 *  EL CENSO DEL ESTRENO (29-jul): 8 tokens del tema claro resuelven a
 *  familia HOY — 1 de r5 (capa.cuidado, con sus opciones a/b en el
 *  reporte r6) y 7 PRE-EXISTENTES a r5 que nadie censó contra A5 desde
 *  su firma (accent.primary · capaText.cuidado · status.infoText · los
 *  5 de servicios) — TODOS a PENDIENTES nominales, arbitraje founder;
 *  solo-baja: el que sale no vuelve, y todo token NUEVO en familia es
 *  rojo. R12 pasó verde mientras esto se rompía porque mide RATIOS, no
 *  identidades — por eso esta regla existe aparte. */
const H_FAMILIA = 174.2, TOL_H = 12, MIN_S = 0.30, MAX_L = 0.35;
const PENDIENTES_R15 = new Set([
  'light·capa.cuidado',              // r5 — opciones (a)/(b) en el reporte r6
  'light·capaText.cuidado',          // pre-r5 (registro AA vivo desde S53)
  'light·accent.primary',            // pre-r5
  'light·status.infoText',           // pre-r5
  'light·services.vet',              // pre-r5
  'light·services.grooming',         // pre-r5
  'light·services.walking',          // pre-r5
  'light·services.boarding',         // pre-r5
  'light·services.store',            // pre-r5
  // pre-r5 Y EL MÁS GRANDE del censo: la COLA del gradiente firma UI
  // claro (firmaUILight stop 3) ES tealDark — la familia adentro del
  // gradiente de MARCA del cliente (el Boton marca de bienvenida).
  'light·accent.gradient.colors[2]',
]);
function hslDe(valor) {
  let r, g, b;
  const hex = valor.match(/^#([0-9a-fA-F]{6})$/);
  const rgb = valor.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)$/);
  if (hex) { r = parseInt(hex[1].slice(0, 2), 16); g = parseInt(hex[1].slice(2, 4), 16); b = parseInt(hex[1].slice(4, 6), 16); }
  else if (rgb) {
    if (rgb[4] !== undefined && +rgb[4] < 1) return { alpha: true };
    r = +rgb[1]; g = +rgb[2]; b = +rgb[3];
  } else return null;
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return { h: 0, s: 0, l };
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = 60 * (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4);
  return { h, s, l };
}
const esFamilia = (c) => c && !c.alpha && Math.abs(c.h - H_FAMILIA) <= TOL_H && c.s >= MIN_S && c.l <= MAX_L;
function r15(tokens) {
  const fallos = [];
  let pendientes = 0, tintsAlpha = 0, bajaron = PENDIENTES_R15.size;
  for (const t of tokens) {
    const c = hslDe(t.valor);
    if (c?.alpha) {
      // tint con alpha: si su base es familia, se cuenta como info
      const base = hslDe(t.valor.replace(/,\s*[\d.]+\)$/, ')').replace('rgba', 'rgb'));
      if (esFamilia(base)) tintsAlpha++;
      continue;
    }
    if (!esFamilia(c)) continue;
    const clave = `${t.tema}·${t.ruta}`;
    if (PENDIENTES_R15.has(clave)) { pendientes++; continue; }
    fallos.push(`R15: ${clave} = ${t.valor} — familia de #0F5E56 en el tema del cliente (A5 §9bis.3 FIRMADA)`);
  }
  bajaron -= pendientes;
  return {
    fallos,
    info: `pendientes-arbitraje=${pendientes}/${PENDIENTES_R15.size} · tints-alpha-familia(info)=${tintsAlpha}${bajaron > 0 ? ` · ${bajaron} BAJARON: actualizar pendientes` : ''}`,
  };
}

/** R13 · CONTROL CONTORNEADO (S82-B r4, orden founder — A6 SIN CAJA
 *  firmada, lado cliente): borderWidth sobre un tocable ARTESANAL
 *  (Pressable/Touchable*) = rojo — se rellena o va sin caja.
 *  ALCANCE DECLARADO, con sus tres bordes:
 *  (a) apps/cliente SOLO — A6 rige lado cliente por su propia letra
 *      (§9bis: "la dosis del prestador no se toca"), y en el prestador
 *      la gramática está/espera S78 FIRMADA usa contorno para "lo que
 *      espera" (medido hoy igual: prestador 0 contorneados inline).
 *  (b) El contorno FIRMADO de packages/ui queda FUERA de este scan y su
 *      destino es de MESA, no de este lint: Boton secundario/compacto
 *      (22c letra viva; la ANCHA es D-483), SelectorOpcion seFija (7bis
 *      FIRMADA: "se contornea lo que SE FIJA") y Campo (cola ⚖️). El
 *      choque entre el eslogan de la orden ("nunca contorno") y esas
 *      letras firmadas queda DECLARADO en el reporte r4 — esta regla
 *      caza lo ARTESANAL en pantallas, que es donde A6 no tiene juez.
 *  (c) Solo estilos INLINE en el tag (un StyleSheet con nombre escapa
 *      al scan — limitación declarada; hoy: cero casos, medido).
 *  Censo del estreno: UN contorneado en todo el monorepo — el
 *  FiltroVida de C (hogar/index:306, lote esperando SU gate) → baseline
 *  NOMINAL por archivo, dueño C: se rellena o pierde la caja en el
 *  gate. Solo baja. */
// VACÍO desde S82-B r5 (solo-baja EJECUTADO por la cura de C en su r4:
// el FiltroVida perdió el contorno en el gate — "reposo SIN CAJA...
// NUNCA contorno", convergencia con esta regla). DURA EN 0 desde acá.
const BASELINE_R13 = {};
function finDeTagJsx(src, i) {
  let d = 0;
  for (let j = i; j < src.length && j < i + 4000; j++) {
    const c = src[j];
    if (c === '{') d++;
    else if (c === '}') d--;
    else if (c === '>' && d === 0) return j;
  }
  return Math.min(i + 4000, src.length);
}
function r13(archivos) {
  const fallos = [];
  let total = 0;
  const sumaBaseline = Object.values(BASELINE_R13).reduce((a, b) => a + b, 0);
  for (const { path, src } of archivos) {
    if (!/apps\/cliente\//.test(path) && path !== '(fixture)') continue;
    let enArchivo = 0;
    for (const m of src.matchAll(/<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback)\b/g)) {
      const tag = src.slice(m.index, finDeTagJsx(src, m.index));
      if (/borderWidth/.test(tag)) {
        enArchivo++;
        if (enArchivo > (BASELINE_R13[path] ?? 0))
          fallos.push(`${path}:${lineaDe(src, m.index)} — control CONTORNEADO (<${m[1]}> con borderWidth, A6): se rellena o va sin caja`);
      }
    }
    total += enArchivo;
  }
  // S85-B1 · EL INFO ANUNCIABA COMO PENDIENTE UN TRABAJO CERRADO. Con el
  // baseline ya vacío desde S82-B r5, seguía imprimiendo en cada corrida
  // "(baseline nominal: FiltroVida de C — se resuelve en su gate)": nombraba
  // trabajo abierto que estaba curado Y se lo atribuía a otra pista. Es la
  // clase de dato que no se descubre chocando —nadie verifica por qué algo
  // NO se hizo—, así que el info dice el estado real y el histórico queda
  // arriba, en la nota del baseline, que es donde se lee al decidir.
  const nota = sumaBaseline === 0 ? 'DURA EN 0 desde S82-B r5' : `baseline ${sumaBaseline}`;
  return { fallos, info: `${total} contorneados (${nota})${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}` };
}

/** R14 · LA TARJETA NO TAPA EL SALUDO (S82-C r4, defecto 2 del gate
 *  mecanizado): la tarjeta de recomendaciones solapa la banda SOLO
 *  dentro del respiro que el techo deja al pie — SOLAPE_RECO tiene que
 *  ser ESTRICTAMENTE MENOR que RESPIRO_BANDA en hogar/index. Las
 *  constantes se leen del fuente (spacing[K]); si desaparecen o dejan
 *  de ser spacing-token, la regla FALLA (el silencio no verifica,
 *  L-192). Tabla de spacing espejada del token (estable desde v3.1). */
const SPACING_R14 = { 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 14: 56, 16: 64 };
function r14(archivos) {
  const hogar = archivos.find((a) => /hogar\/index\.tsx$/.test(a.path));
  if (!hogar) return { fallos: ['R14: hogar/index.tsx no encontrado — sin fuente no hay verificación'], info: 'SIN FUENTE' };
  const respiro = hogar.src.match(/RESPIRO_BANDA = spacing\[(\d+)\]/);
  const solape = hogar.src.match(/SOLAPE_RECO = spacing\[(\d+)\]/);
  if (!respiro || !solape)
    return { fallos: ['R14: RESPIRO_BANDA/SOLAPE_RECO no encontrados en hogar/index — la relación no se puede verificar (L-192)'], info: 'CONSTANTES AUSENTES' };
  const r = SPACING_R14[Number(respiro[1])];
  const s = SPACING_R14[Number(solape[1])];
  if (r === undefined || s === undefined)
    return { fallos: [`R14: spacing[${respiro[1]}]/spacing[${solape[1]}] fuera de la tabla espejada — ensanchar SPACING_R14`], info: 'TOKEN DESCONOCIDO' };
  const fallos = s >= r
    ? [`hogar/index — SOLAPE_RECO (${s}) ≥ RESPIRO_BANDA (${r}): la tarjeta TAPA el saludo/nombres del techo (defecto 2 del gate r4)`]
    : [];
  return { fallos, info: `solape=${s} < respiro=${r}` };
}

/** R16 · EL GUARD DEL PAPEL TAPIZ (S82-B r9 — mecaniza la promesa de los
 *  puntos 4 y 5 de la orden: "el prestador NO recibe tinte" y "la
 *  separación se construye con el valor firmado"). El modo de fallo que
 *  cierra es EL SILENCIO: el día que alguien encienda `papelTapiz` con
 *  el valor firmado, el prestador se tiñe SOLO —comparte `lightTheme`—
 *  y nadie lo nota hasta un gate. Entonces: **si `papelTapiz !==
 *  light0` (tinte ENCENDIDO), el tema del prestador (`lightOficio`)
 *  TIENE que pisar `bg.base` a `light0`**. Hoy pasa en verde por el
 *  apagado (papelTapiz === light0) — y cuando el color llegue, el lint
 *  exige su separación en el MISMO acto. Patrón del guard de la vitrina
 *  (S78): el orden nombra el artefacto que abre.
 *
 *  ENSANCHADA S83-B3 — LA MITAD OSCURA (orden founder: "R16 ve la mitad
 *  oscura"). El defecto era de la propia regla y es el que ella existe
 *  para cerrar, un tema más allá: vigilaba `lightOficio` y **nada miraba
 *  `darkOficio`**, así que borrar la línea del tapiz oscuro dejaba al
 *  prestador heredando el tinte MAGENTA del cliente con el lint EN VERDE.
 *  Cobró dos veces el 31-jul: dos lecturas distintas salieron de consultar
 *  una regla que veía medio mundo.
 *
 *  LA SIMETRÍA NO ES LITERAL, y ahí está el cuidado: en CLARO el prestador
 *  se separa QUEDÁNDOSE en el papel neutro (`light0`); en OSCURO se separa
 *  TENIENDO EL SUYO (`tapizDarkOficio`, el verde de su oficio) — "un tinte
 *  por casa, misma gramática" (r29, enmienda del founder). Por eso la
 *  mitad oscura no exige el neutro: exige SU token, y un `darkOficio` que
 *  pisara `bg.base` a `tapizDark` (el del cliente) sale ROJO igual.
 *
 *  TERCER BRAZO, no pedido pero del mismo silencio: si los dos tapices
 *  apuntaran al MISMO hex, la separación sería de nombre y no de color —
 *  verde de lint, una sola casa en pantalla. La letra dice "un tinte por
 *  casa"; el brazo la hace exigible.
 *
 *  ☠️ CONDICIÓN DE MUERTE: esta regla existe porque los temas de oficio se
 *  arman por SPREAD (`...darkTheme`) y heredan en silencio lo que no pisan
 *  — un olvido no rompe nada, y ese es el modo de falla. **Muere el día
 *  que `bg.base` de los temas de oficio deje de venir por herencia y pase
 *  a ser obligación de TIPO** (que el tsc se ponga rojo si falta), porque
 *  ahí el compilador cubre lo que hoy cubre el lint. **La retira la sesión
 *  que haga ese cambio estructural, y con el mismo criterio que rige acá:
 *  produciendo primero el rojo del tsc y recién entonces borrando la
 *  regla** — jamás al revés. Si en cambio el founder revirtiera "un tinte
 *  por casa", la regla no muere: cambia de letra (cae el tercer brazo). */
function r16(fuentes) {
  const pal = fuentes.palette ?? '';
  const temas = fuentes.temas ?? '';
  const hex = (nombre) => pal.match(new RegExp(`\\b${nombre}:\\s*'(#[0-9A-Fa-f]{6})'`));
  const luz = hex('light0');
  const tapiz = hex('papelTapiz');
  const oscuro = hex('dark0');
  const tapizD = hex('tapizDark');
  const tapizDO = hex('tapizDarkOficio');
  const papelOf = hex('papelTapizOficio');
  if (!luz || !tapiz || !oscuro || !tapizD || !tapizDO || !papelOf)
    return {
      fallos: ['R16: no se pudo leer light0/papelTapiz/papelTapizOficio/dark0/tapizDark/tapizDarkOficio de palette.ts — sin los valores no hay verificación (L-192)'],
      info: 'SIN FUENTE',
    };
  const igual = (a, b) => a[1].toUpperCase() === b[1].toUpperCase();
  const fallos = [];

  // ── MITAD CLARA: el prestador tiene EL SUYO ──
  // S83-B33 — LA LETRA CAMBIÓ Y LA REGLA CON ELLA. Hasta hoy esta mitad
  // exigía que lightOficio se quedara en el papel NEUTRO (`light0`),
  // porque S82 firmó "el prestador NO recibe tinte, es fondo del
  // cliente". El founder ENMENDÓ esa letra en S83: un tinte por casa en
  // LOS DOS temas. Así que ahora la regla es SIMÉTRICA con la oscura —
  // el prestador se separa TENIENDO EL SUYO, no quedándose en el neutro.
  /* ⏪ ═══ LA MITAD CLARA CAMBIA DE LETRA — S100d·bis, y la cambia una FIRMA,
     no un hallazgo. ═══

     **Hasta hoy exigía dos cosas: que el prestador NO recibiera el tinte del
     cliente, y que su tinte fuera OTRO HEX** (*«la separación es de nombre y
     no de color»*). **El founder revocó los DOS papeles tapiz en claro** —el
     rosa del cliente y el teal del prestador— *«hoy tenemos muchas más cosas
     en la app»*, **así que en claro las dos casas comparten el papel neutro a
     propósito.**

     ⇒ **con la letra vieja, esta regla se pondría ROJA contra una decisión
     firmada** — que es exactamente el caso que R26 ya vivió en S83-B17.

     **La letra nueva, y NO es «se apagó la regla»:** en claro se exige que las
     dos casas estén en **el MISMO neutro**; el día que alguien vuelva a teñir
     una sola, la regla lo caza igual. *Pasa de vigilar que se separen a
     vigilar que no diverjan — el sujeto cambió, la vigilancia no.*

     ✅ **Y la mitad OSCURA no se toca:** ahí el tinte por casa SIGUE FIRMADO y
     sigue siendo necesario. **Medido:** un neutro en oscuro da **1,003 contra
     la carta** —indistinguible— y borraría las tarjetas de las dos apps.
     ***El tema oscuro no es el claro invertido: en claro el tinte estorbaba,
     en oscuro es lo único que separa la carta del fondo.*** */
  const papelOficio = hex('papelTapizOficio');
  const encendido = !igual(luz, tapiz);
  if (papelOficio && !igual(tapiz, papelOficio))
    fallos.push(`R16: papelTapiz (${tapiz[1]}) y papelTapizOficio (${papelOficio[1]}) DIVERGEN en claro — la firma de S100d·bis revocó los dos tapices y puso a las dos casas en el mismo papel neutro. Si se vuelve a teñir una, se tiñen las dos o se re-abre la letra.`);

  // ── MITAD OSCURA: el prestador se separa TENIENDO EL SUYO ──
  const encendidoOsc = !igual(oscuro, tapizD);
  const separadoOsc = /const darkOficio[\s\S]*?\bbg:\s*\{[^}]*\bbase:\s*palette\.tapizDarkOficio/.test(temas);
  if (encendidoOsc && !separadoOsc)
    fallos.push(`R16: tapizDark (${tapizD[1]}) está ENCENDIDO y darkOficio NO pisa bg.base a tapizDarkOficio — el prestador estaría recibiendo el tinte MAGENTA del cliente en oscuro (S82-B r29: un tinte por casa)`);
  if (encendidoOsc && separadoOsc && igual(tapizD, tapizDO))
    fallos.push(`R16: tapizDark y tapizDarkOficio son el MISMO hex (${tapizD[1]}) — la separación es de nombre y no de color: las dos casas se verían iguales (S82-B r29)`);

  const claro = `claro[papel COMPARTIDO ${tapiz[1]} en las dos casas${encendido ? '' : ' (=light0)'} — los dos tapices revocados S100d·bis]`;
  const osc = `oscuro[tapiz=${encendidoOsc ? 'ENCENDIDO ' + tapizD[1] : 'apagado (=dark0)'} · separación=${separadoOsc ? 'construida ' + tapizDO[1] : 'no construida'}]`;
  return { fallos, info: `${claro} · ${osc}` };
}
const FUENTES_R16 = {
  palette: readFileSync('packages/ui/src/tokens/palette.ts', 'utf8'),
  temas: readFileSync('packages/ui/src/themes/index.ts', 'utf8'),
};


/* ☠️ R26 SE RETIRÓ EN S83-B17, Y LA RETIRÓ SU PROPIO ROJO.
 *  Vigilaba que `accent.control` del oficio fuera tealDark en LAS DOS
 *  casas. Cuando B17 le dio sus dos registros —teal puro en oscuro, por
 *  la misma medición que movió `accent.active`— R26 se puso ROJA contra
 *  el código correcto: su premisa ("un solo valor para las dos casas")
 *  había dejado de ser cierta.
 *
 *  NO SE PARCHEÓ, SE RETIRÓ: R27 ya vigila `control` en las dos casas Y
 *  ADEMÁS su registro, así que mantener las dos era tener dos reglas para
 *  la misma física — la copia que L-175 prohíbe, un piso más arriba. Un
 *  guard que sobrevive a su propia razón es basura que nadie se anima a
 *  tocar (precedente: R19 en S82-C r38, R21 en r30).
 *
 *  Y LO QUE DEJA COMO EVIDENCIA: el guard atrapó el cambio de quien lo
 *  escribió, el mismo día. Eso es lo que un guard tiene que hacer. */

/** R27 · EL PINK NO ENTRA AL PRESTADOR POR LA PUERTA DEL ESTADO ACTIVO
 *  (S83-B13). Hermana exacta de R26 y por la misma física: los temas de
 *  oficio se arman por SPREAD, así que quitar el override de
 *  `accent.active` no rompe nada, el tsc no lo ve —el campo existe igual,
 *  heredado— y el prestador vuelve a enfocar en MAGENTA sin que nadie se
 *  entere. Guard por AUSENCIA de la línea, no por presencia de un hex.
 *
 *  Y VIGILA ALGO MÁS QUE R26: aquí los dos brazos esperan valores
 *  DISTINTOS —tealDark en claro, teal PURO en oscuro—, porque el focus es
 *  gráfica y ninguno solo pasa en los dos temas (medido: puro REPRUEBA en
 *  claro con 1.46; tealDark en oscuro pasa con margen 0.37 y no ilumina).
 *  Un guard que aceptara cualquiera de los dos en cualquier tema dejaría
 *  pasar justo el error que la medición encontró.
 *
 *  ☠️ CONDICIÓN DE MUERTE: la misma de R16 (R26 ya se retiró) — muere el día que los
 *  slots dejen de resolverse por herencia y pasen a obligación de TIPO
 *  (tsc rojo si falta). La retira la sesión que haga ese cambio,
 *  produciendo primero el rojo del tsc y recién después borrando la
 *  regla. Si el founder cambiara el verde, la regla no muere: cambia de
 *  valor esperado. */
function r27(fuentes) {
  const temas = fuentes.temas ?? '';
  const fallos = [];
  // S83-B17: `control` recibió el MISMO tratamiento que `active` (misma
  // medición: tealDark rinde 3.37 en oscuro, margen 0.37). La regla se
  // ENSANCHA a los dos slots en vez de nacer una R28 gemela — dos reglas
  // para la misma física es la copia que L-175 prohíbe, un piso arriba.
  // 🔴 S98-B — CUARTO SLOT: `controlBg`, el TINTE de la elección (D-813).
  // Entra por la MISMA física y por eso ensancha la regla en vez de nacer
  // una gemela (L-175): los temas de oficio se arman por spread, así que
  // un slot que no se pisa se HEREDA MAGENTA en silencio y ni el tsc ni
  // el ojo lo ven —el campo existe igual—.
  //
  // ⚠️ Y ÉSTE ERA EL CASO REAL, no el hipotético: `control` estaba pisado
  // desde S83 y el tinte NO, así que el prestador elegía con **borde teal
  // y relleno magenta**. Vivió invisible porque la pieza nació en el
  // CLIENTE, donde las dos familias coinciden. *Un guard que vigila el
  // borde y no su relleno vigila media señal.*
  //
  // Los valores esperados son los TINTES de cuidado que la casa ya tiene
  // medidos (no colores nuevos): `tealAlpha16` en claro · `tealAlpha15`
  // en oscuro — cada tema con su alfa, igual que sus hermanos tienen cada
  // uno su registro.
  // ⭐ S99-B · ENTRA EL QUINTO SLOT: `activoLleno` (el disco de la barra
  // de tabs). Entra por la MISMA puerta que sus cuatro hermanos y por la
  // misma razón: si la casa de oficio no lo pisa, el prestador hereda el
  // magenta del cliente — que es literalmente D-813 otra vez.
  // **Su registro se da vuelta y por eso el esperado no es el mismo hex
  // en los dos temas:** es un RELLENO que carga contenido, así que en
  // claro va el `tealDark` del muro y en oscuro el `teal` puro (§15b.2:
  // sobre superficie oscura manda el hex puro; el par del techo nocturno
  // se hundiría contra la barra oscura, 1.4).
  const ESPERADO = {
    lightOficio: { control: 'tealDark', controlBg: 'tealAlpha16', active: 'tealDark', marcaEleccion: 'tealDark', activoLleno: 'tealDark' },
    darkOficio: { control: 'teal', controlBg: 'tealAlpha15', active: 'teal', marcaEleccion: 'teal', activoLleno: 'teal' },
  };
  for (const [casa, slots] of Object.entries(ESPERADO)) {
    const bloque = new RegExp(`const ${casa}[\\s\\S]*?\\n\\}`).exec(temas)?.[0] ?? '';
    if (!bloque) {
      fallos.push(`R27: no se encontró ${casa} en themes/index.ts — sin la fuente no hay verificación (L-192)`);
      continue;
    }
    for (const [slot, token] of Object.entries(slots)) {
      const m = new RegExp(`\\baccent:\\s*\\{[^}]*\\b${slot}:\\s*palette\\.(\\w+)`).exec(bloque);
      if (!m)
        fallos.push(`R27: ${casa} NO pisa accent.${slot} — el prestador lo heredaría MAGENTA (§15b.1 + firma founder S83: el estado y la elección del prestador van en verde)`);
      else if (m[1] !== token)
        fallos.push(`R27: ${casa} pisa accent.${slot} a palette.${m[1]} y se esperaba palette.${token} — es GRÁFICA y necesita sus DOS registros (el puro reprueba en claro: 1.46 · tealDark en oscuro pasa por poco: 3.37)`);
    }
  }
  return { fallos, info: fallos.length === 0 ? 'estado, elección y PATA del oficio: tealDark en claro · teal puro en oscuro' : `${fallos.length} fallo(s)` };
}
const FUENTES_R27 = { temas: readFileSync('packages/ui/src/themes/index.ts', 'utf8') };
const FUENTES_R43 = { palette: readFileSync('packages/ui/src/tokens/palette.ts', 'utf8') };
/** R44 · los SEIS diccionarios de la casa (las dos apps + `ui`). El
 *  corpus `DICCIONARIOS` de arriba trae solo los del cliente y N12.4
 *  dice «en toda la casa», así que R44 arma el suyo — y su ancla exige
 *  los seis: si uno se cae del corpus, la regla dejaría de mirar esa
 *  casa en silencio. */
const CORPUS_R44 = [
  'apps/cliente/src/i18n/es.ts', 'apps/cliente/src/i18n/en.ts',
  'apps/prestador/src/i18n/es.ts', 'apps/prestador/src/i18n/en.ts',
  'packages/ui/src/i18n/es.ts', 'packages/ui/src/i18n/en.ts',
  ...archivosCodigo('packages/api/src'),
].map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));


/** R29 · `sinPie` NO VIAJA SOLO (S83-B1). La enmienda de la letra de
 *  `Campo` dice que la protección contra el layout shift **no se retira,
 *  sube un nivel**: el hijo deja de reservar el pie y lo monta el CONTROL
 *  COMPUESTO, para todos sus hijos. Si el compuesto no lo monta, la
 *  protección no subió: se perdió.
 *
 *  Y SE PIERDE EN SILENCIO, que es lo que la hace regla y no comentario:
 *  con `sinPie` el `Campo` sigue pintando su borde de error —eso no se
 *  delega— pero deja de renderizar el texto. El resultado es un borde
 *  rojo sin una palabra que lo explique: la pantalla parece funcionar, el
 *  tsc está verde, y el usuario no sabe qué corregir. Una verificación
 *  cuyo modo de falla es el silencio no es una verificación (L-192).
 *
 *  ALCANCE HONESTO, declarado para que nadie la lea como más fuerte de lo
 *  que es: verifica que las dos piezas VIVAN EN EL MISMO ARCHIVO, no que
 *  el pie reciba el MISMO `ayuda`/`error` que el campo. Es un piso, no una
 *  prueba — y cubre el modo de falla real, que es olvidarse del pie
 *  entero, no pasarle el mensaje equivocado.
 *
 *  ☠️ CONDICIÓN DE MUERTE: el día que ningún archivo de `apps/` use
 *  `sinPie` (el compuesto se retiró o `Campo` cambió de anatomía), la
 *  regla no tiene nada que vigilar y se retira con lápida. La retira quien
 *  mida cero usos, no quien la encuentre molesta. */
function r29(archivos) {
  const fallos = [];
  let compuestos = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    if (!/\bsinPie\b/.test(limpio)) continue;
    compuestos++;
    if (!/\bPieDeCampo\b/.test(limpio)) {
      fallos.push(
        `${path} usa \`sinPie\` y NO monta PieDeCampo — el borde de error queda SIN su mensaje: el control compuesto tiene que montar el pie de sus hijos (S83-B1, L-192)`,
      );
    }
  }
  return { fallos, info: `${compuestos} control(es) compuesto(s) con sinPie · ${fallos.length} sin su pie` };
}

/** R17 · LA GALERÍA NO ENVEJECE (S82-B r16, orden founder: "toda pieza
 *  exportada desde packages/ui tiene que aparecer en la galería. Una
 *  exportación nueva sin entrada = rojo"). El modo de fallo es el que YA
 *  ocurrió, y por eso existe: la galería se quedó atrás de S81 y S82 sin
 *  que nada lo dijera — lo vio el founder, no el sistema.
 *
 *  EXENTOS DECLARADOS — no es pereza: son piezas que NO SE PUEDEN MOSTRAR
 *  SIN CLONARLAS, y la regla dura de la orden manda declarar y no montar
 *  ("una galería que muestra un botón que no es EL botón hace firmar algo
 *  que no corre"):
 *   · `usePresionado` — HOOK de física: mostrarlo exige construir un
 *     tocable de ejemplo, o sea CLONAR el gesto. Se ve APLICADO en
 *     Boton/Tarjeta/Celda, que sí están.
 *   · `useTraduccionUi` · `recursosUi` — riel de idioma: no tienen forma.
 *   · `useAviso` · `AvisoProvider` — el Aviso se ve por su DISPARO (la
 *     galería lo dispara); el hook en sí no se dibuja.
 *   · `ThemeProvider` · `useTheme` — la galería ENTERA es su demostración.
 *   · `EvidenciaFotoCapturar` — abre la CÁMARA al tocarse: montarlo
 *     dispararía permisos del sistema dentro de una herramienta de
 *     verificación. Su hermano Thumbnail (presentacional) sí se monta.
 *  El resto es baseline NOMINAL solo-baja: la pieza que gana su entrada
 *  sale de la lista y no vuelve; toda exportación NUEVA es roja desde el
 *  primer día. */
const EXENTOS_R17 = new Set([
  'usePresionado', 'useTraduccionUi', 'recursosUi', 'useAviso', 'AvisoProvider',
  'ThemeProvider', 'useTheme', 'EvidenciaFotoCapturar',
  // NÚMEROS, no piezas: la anatomía firmada de la pata (S82 r37). Se
  // exportan para que el consumidor CALCULE el aire que la pata invade
  // en vez de estimarlo — mirarlos en una galería no diría nada.
  'PATA', 'MONTA',
  // S83-B1, misma clase: `ALTO_PIE_CAMPO` es el alto exacto que el pie
  // reserva (24.8) — un compuesto lo usa para CALCULAR, no para mirarlo.
  // Se declara aunque hoy el parseo no lo alcance (SCREAMING_CASE no pasa
  // el filtro de identificador): el día que el filtro se ensanche, la
  // declaración ya está y nadie tiene que re-decidir por qué está exento.
  'ALTO_PIE_CAMPO',
  // S91-B · EL TIPEO PREDICTIVO — misma clase que `usePresionado`, y por
  // el mismo criterio literal de esta lista: mostrarlo exige construirle
  // un campo y unos chips de ejemplo, o sea CLONAR la interacción de la
  // bitácora. Y las dos interacciones que lo consumen NO son la misma
  // (la bitácora marca de a muchos; el alta llena un campo con UNA), así
  // que la galería mostraría la de una casa como si fuera la pieza.
  // Su gate es `scripts/verify-sugerencias.ts` — con brazo de REGRESIÓN
  // contra la implementación vieja sobre el vocabulario VIVO.
  //
  // ⚠️ ESTAS CINCO NO SE DISPARAN HOY, y se dice para que nadie las lea
  // como cobertura: el parseo de abajo admite SOLO `PascalCase` y `useX`,
  // así que un nombre camelCase JAMÁS entra al corpus — no está exento,
  // está INVISIBLE. Se declaran igual por el mismo precedente y la misma
  // razón que `ALTO_PIE_CAMPO` (el día que el filtro se ensanche, la
  // decisión ya está tomada y nadie la re-discute). MEDIDO S91-B: hoy son
  // **30 los exports invisibles** de 105 —tokens, temas e infra de
  // captura/archivos, más estas cinco—, y `recursosUi` ya estaba en esta
  // lista siendo invisible SIN decirlo. Ensanchar el filtro encendería
  // 25 preexistentes de una vez: es decisión de mesa, no de esta tanda.
  'sugerir', 'coincidenciasPrimero', 'normalizarVoz', 'palabrasDeBusqueda',
  'puntajeDeCoincidencia',
]);
/** VACÍO desde S82-B r17: las NUEVE ganaron su entrada en la misma
 *  tanda que la regla las enumeró — importadas, jamás reimplementadas.
 *  De vacío no se sube: toda exportación nueva es roja el primer día. */
const SIN_ENTRADA_R17 = new Set([]);
function r17(fuentes) {
  // S83-B1 — LOS COMENTARIOS SE SACAN ANTES DE PARSEAR. El bloque se
  // parte por comas, así que un `//` DENTRO de las llaves se pega al
  // nombre que le sigue y ese nombre deja de parecer identificador:
  // escapaba del gate SIN decir nada, que es el modo de falla que este
  // lint existe para no tener (L-192). Es la misma trampa que L-170 ya
  // había cobrado en un censo de SQL: un censo por texto lee los
  // comentarios como código. Medido al curarlo: escapaba exactamente 1.
  const idx = (fuentes.index ?? '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const gal = fuentes.galeria ?? '';
  const nombres = new Set();
  for (const m of idx.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const parte of m[1].split(',')) {
      const t = parte.trim();
      if (!t || t.startsWith('type ')) continue;
      const n = t.split(/\s+as\s+/)[0].trim();
      if (/^[A-Z][A-Za-z]*$/.test(n) || /^use[A-Z]/.test(n)) nombres.add(n);
    }
  }
  const fallos = [];
  let presentes = 0, exentas = 0, pendientes = 0;
  for (const n of nombres) {
    if (EXENTOS_R17.has(n)) { exentas++; continue; }
    if (new RegExp('<' + n + '[\\s/>.]|\\b' + n + '\\(').test(gal)) { presentes++; continue; }
    if (SIN_ENTRADA_R17.has(n)) { pendientes++; continue; }
    fallos.push(`R17: ${n} se exporta desde packages/ui y NO aparece en la galería — una pieza que nadie puede mirar no se puede firmar`);
  }
  // ANCLA: R17 deriva su corpus del PARSEO de index.ts. Si ese archivo
  // cambia de forma de export (o la galería deja de importar), el parseo
  // devuelve cero nombres y la regla informa "0 pendientes" — verde sin
  // haber mirado una sola pieza. Las dos puntas se anclan: hay nombres
  // que vigilar Y hay al menos uno montado en la galería.
  fallos.push(...ancla('R17', nombres.size, 1, 'export(s) parseados de packages/ui/src/index.ts'));
  fallos.push(...ancla('R17', presentes, 1, 'pieza(s) encontradas en la galería'));
  return {
    fallos,
    info: `exportaciones=${nombres.size} · en-galería=${presentes} · exentas-declaradas=${exentas} · pendientes=${pendientes}/${SIN_ENTRADA_R17.size}`,
  };
}
const FUENTES_R17 = {
  index: readFileSync('packages/ui/src/index.ts', 'utf8'),
  galeria: readFileSync('packages/ui/src/gallery/TokenGallery.tsx', 'utf8'),
};

/** R18 · D-580 ENMENDADA (orden founder S82): LA ENTRADA A LA GALERÍA
 *  EN CUENTA **QUEDA VISIBLE** hasta el gate de producción, y su retiro
 *  exige FIRMA — ninguna sesión la paga por iniciativa propia.
 *
 *  LA POLARIDAD ES EL PUNTO (letra founder): el modo de falla de este
 *  guard es que la entrada **DESAPAREZCA**, jamás que aparezca. Un
 *  guard con la polaridad invertida (vigilar que NO esté) haría el
 *  trabajo de retirarla sin firma, que es exactamente lo que la orden
 *  prohíbe. Por eso vigila DOS cosas y las dos en positivo:
 *    ① la navegación a '/gallery' EXISTE en la Cuenta del cliente
 *    ② y NO está escondida tras `__DEV__` (el gate corre sobre el APK
 *      preview, donde `__DEV__` es false: esconderla ahí la mata justo
 *      donde se la necesita — L-161, la misma lección del marcador).
 *  ⏪ ACÁ DECÍA: *«el día que el founder firme el retiro, esta regla se
 *  BORRA en el mismo acto»*. **La firma llegó (mesa, S107) y NO la borró:
 *  LA ENMENDÓ.** Se marca en vez de reescribirse, porque la instrucción
 *  vieja mandaba borrar un guard que hoy sigue haciendo falta.
 *
 *  🔴 **LO FIRMADO: se retira la entrada del CLIENTE; la del PRESTADOR
 *  queda, y R18 pasa a vigilar SÓLO ésa.**
 *
 *  **Por qué enmendar y no borrar, que es lo que cambia el resultado:** la
 *  polaridad de arriba **sigue siendo el punto**. Si la regla se borrara,
 *  la entrada del prestador —la única que queda— pasaría a no tener guard,
 *  y su modo de falla es el de siempre: *desaparece y nadie se entera*.
 *  **Borrar el guard junto con una de sus dos casas habría dejado
 *  desprotegida a la que sobrevive** — exactamente el hueco que S84-B8
 *  cerró cuando R18 miraba sólo al cliente, ahora en espejo.
 *
 *  ⚠️ **Y EL ANCLA BAJA DE 2 A 1 EN EL MISMO ACTO.** No es cosmético: el
 *  ancla exige un mínimo de casas para que el silencio de la regla
 *  signifique algo, y con `2` sobre una sola casa **R18 saldría ROJA por
 *  ANCLA ROTA** — un rojo que no habla del defecto que vigila. *Bajar un
 *  ancla es aflojar un guard y por eso se declara: acá se baja porque el
 *  corpus se achicó POR FIRMA, no para que pase un rojo.* */
// S84-B8 ② — LAS DOS CASAS. Hasta hoy R18 miraba SOLO la del cliente y
// el propio código de la entrada del prestador declaraba el hueco: "R18
// mira SOLO la Cuenta del cliente… esta entrada queda SIN guard". Una
// entrada de gate que puede desaparecer sin que nadie se entere es el
// modo de falla de siempre — y con la galería especializada en láminas
// (enmienda de método 2-ago) importa MÁS, no menos: es el único camino
// del founder a lo que tiene que firmar.
/* ✏️ ENMIENDA S107 — FIRMA DE LA MESA (28-ago-2026). **R18 NO SE BORRA: SE
 *  ANGOSTA A UNA SOLA CASA.**
 *
 *  Lo firmado: **se retira la entrada del CLIENTE; la del PRESTADOR se
 *  conserva hasta el gate de producción.** *La galería salió de sala de
 *  revisión (firma S106) — pero salió como lugar donde el founder JUZGA, no
 *  como pieza: `R17` sigue exigiendo que toda pieza exportada esté montada
 *  ahí, y ése sigue siendo el único mecanismo que hace que el typecheck vea
 *  una prop sin llenar.*
 *
 *  🔴 POR QUÉ SE ANGOSTA EN VEZ DE BORRARSE, que es la parte que se pierde
 *  si no queda escrita: la polaridad de R18 es lo valioso — vigila que la
 *  entrada **EXISTA**, porque su modo de falla es que DESAPAREZCA sin firma.
 *  Borrar la regla entera para retirar UNA de las dos entradas dejaría a la
 *  otra —la que la firma manda conservar— **sin guard**, y su desaparición
 *  volvería a ser silenciosa. *Se retira lo que la firma retira, y se sigue
 *  vigilando lo que la firma conserva.*
 *
 *  El día que el founder firme el retiro del prestador, ahí sí la regla se
 *  borra entera, en el mismo commit de la firma. */
const CUENTAS_GALERIA = [
  // ☠️ 'apps/cliente/...' — RETIRADA POR FIRMA DE MESA (S107). La entrada del
  // cliente se saca de la app; el retiro del ARCHIVO es de C. Esta línea se
  // deja como lápida para que nadie la re-agregue creyendo que falta.
  'apps/prestador/src/app/(tabs)/cuenta/index.tsx',
];
/* S85-B1 · EL MENSAJE GRITABA UNA CAUSA QUE EL PREDICADO NO MEDÍA — la
 *  forma exacta del freno falso de S84. El brazo `__DEV__` preguntaba
 *  `/__DEV__/.test(archivo entero)` y respondía "la entrada a la galería
 *  NO se esconde ahí": medido con la entrada PRESENTE en las dos casas y
 *  un `__DEV__` ajeno (un console.log), salía ROJO acusando de esconder
 *  una entrada que estaba a la vista.
 *
 *  SE CURAN LAS DOS PUNTAS, y por qué las dos: bajar solo el mensaje
 *  dejaría el guard sin nombrar nunca el defecto real de D-580; subir
 *  solo el predicado cambiaría una red gruesa por un parser —y un
 *  parser que no matchea pasa en VERDE, que es el modo de falla que
 *  L-192 existe para matar. Entonces:
 *   ① BRAZO PRECISO: si el `__DEV__` ENVUELVE la entrada, el mensaje
 *     dice eso, que es el defecto que D-580 prohíbe.
 *   ② BRAZO GRUESO: si hay `__DEV__` y no se pudo probar que envuelve,
 *     sigue siendo ROJO —la red no se afloja— pero el mensaje DECLARA
 *     que no probó la relación, en vez de afirmarla.
 *  La detección de ① es TEXTUAL y por eso es la que puede fallar; su
 *  falla cae siempre en ②, nunca en verde. */
const RE_ENTRADA_GALERIA = /router\.push\(['"]\/gallery['"]\)/;
/** ¿ese `__DEV__` envuelve a la entrada? Heurística declarada: cubre las
 *  dos formas con las que se esconde algo en esta casa —`__DEV__ && …` en
 *  JSX y `if (__DEV__) { … }`— exigiendo que entre el guard y la entrada
 *  no se haya cerrado ninguna llave. No pretende ser un parser. */
function devEnvuelve(limpio, iDev, iEntrada) {
  if (iEntrada === -1 || iEntrada <= iDev) return false;
  const entre = limpio.slice(iDev + '__DEV__'.length, iEntrada);
  if (/\}/.test(entre)) return false;
  return /^\s*&&/.test(entre) || /^\s*\)\s*\{/.test(entre);
}
function r18(casas) {
  const fallos = [];
  for (const { ruta, src } of casas) {
    const limpio = sinComentarios(src ?? '');
    if (!RE_ENTRADA_GALERIA.test(limpio)) {
      fallos.push(
        `${ruta} — LA ENTRADA A /gallery DESAPARECIÓ. D-580 (enmienda founder S82): queda VISIBLE hasta el gate de producción; su retiro exige FIRMA EXPLÍCITA, y con la firma se borra esta regla en el mismo acto.`,
      );
    }
    const iEntrada = limpio.search(RE_ENTRADA_GALERIA);
    const devs = [...limpio.matchAll(/__DEV__/g)];
    const envuelto = devs.some((d) => devEnvuelve(limpio, d.index, iEntrada));
    if (envuelto) {
      fallos.push(
        `${ruta} — LA ENTRADA A /gallery ESTÁ DETRÁS DE __DEV__. El gate corre sobre el APK preview, donde __DEV__ es false: ahí la entrada muere justo donde se la necesita (L-161, la misma lección del marcador).`,
      );
    } else if (devs.length > 0) {
      fallos.push(
        `${ruta} — hay ${devs.length} uso(s) de __DEV__ en la Cuenta de la galería. Este guard NO probó que alcancen a la entrada (su análisis es textual): se declara ROJO por precaución, porque la Cuenta que lleva al gate se mantiene sin ramas que el APK preview no ejecuta. Si el uso es legítimo, la decisión es de mesa y se declara acá — no se afloja el guard en silencio.`,
      );
    }
  }
  // ANCLA: sin casas que mirar la regla informaría "0 fallos" sin haber
  // abierto un archivo — verde sin verificación (L-192).
  // ✏️ S107: baja de 2 a 1 porque la FIRMA retiró la casa del cliente. El
  // ancla no se afloja «para que pase»: se mueve al número que la firma dejó,
  // y sigue siendo el que impide que la regla mire cero archivos. *Y el que
  // cazó este cambio fue el ancla misma — dio rojo en cuanto la lista bajó a
  // uno, que es exactamente para lo que existe.*
  // (A y B escribieron esta misma enmienda en paralelo; se conserva una sola.)
  fallos.push(...ancla('R18', casas.length, 1, 'Cuenta(s) de galería vigiladas'));
  return { fallos, info: fallos.length === 0 ? `${casas.length} entradas vivas y sin __DEV__` : `${fallos.length} fallo(s)` };
}

/* ☠️ R23 SE RETIRÓ EN S82-B (`d1e0e36`) Y SE FUE SIN LÁPIDA — ésta se le
 *  pone en S85-B, tres sesiones después, porque un hueco de numeración sin
 *  declarar es una pregunta que cada lector nuevo tiene que volver a
 *  investigar. (Lo fue: el reporte de apertura de S85 la trajo como "ni
 *  lápida ni mención"; la causa estaba en el historial, no en el archivo.)
 *
 *  QUÉ VIGILABA: que la huella de MARCA —la rellena en hex de capa— no
 *  viviera adentro de la placa del glifo. Nació en `ed92c43` (S82-B r23)
 *  con su rojo producido contra el archivo real.
 *
 *  POR QUÉ SE FUE: la enmienda de C dejó su premisa vieja (la marca del
 *  elegido pasó a ser `accent.control`, no un hex de capa) y **R22 la
 *  cubría entera y mejor** — ancla a `MarcaElegido` POR NOMBRE, exige que
 *  exista, que se monte y que no caiga dentro de la placa: todo lo de R23
 *  más lo que R23 no veía (que la pieza desaparezca). Dos reglas para la
 *  misma física es la copia que L-175 prohíbe, un piso arriba.
 *
 *  LO QUE DEJA COMO REGISTRO: no quedó alcance huérfano, y el retiro fue
 *  la propia ley de la casa aplicada a quien la escribió — un guard que
 *  sobrevive a su razón es basura que nadie se anima a tocar.
 *  (R28 nunca existió: se declinó al nacer, en el header de R27.
 *  SIGUIENTE NÚMERO LIBRE: **R33** — R31 NO SE TOMA: es un número que un
 *  brief citó sin letra (protocolo A7, adjudicación de mesa S88); usarlo
 *  ahora volvería verdadera retroactivamente una cita que nunca midió
 *  nada. R32 nació en S88 (la esquina compartida).) */

/* ☠️ R19 SE RETIRÓ EN S82-C r38, Y SU PROPIA REGLA DICTÓ EL RETIRO.
 *  Vigilaba que el relleno pleno se computara contra el número de
 *  hermanos (L-b). Cuando la marca del chip elegido pasó a ser LA PATA
 *  —forma, no relleno— la última pieza que rellenaba dejó de rellenar, y
 *  la regla salió ROJA diciendo exactamente lo que había que hacer: "o
 *  la pieza dejó de rellenar (y sale de la lista, EN EL MISMO COMMIT) o
 *  el nombre cambió y la regla quedó vigilando un fantasma". Era el
 *  primer caso, y la rama estaba escrita para esto.
 *  SIN CONSUMIDOR UN GUARD NO PROTEGE: DECORA — y su verde pasa a
 *  significar "no hay nada que mirar", que es el modo de fallo que
 *  L-192 existe para matar. L-b SIGUE RIGIENDO donde haya relleno; lo
 *  que ya no hay es relleno en las piezas locales de C. El día que
 *  alguna vuelva a rellenar, la regla se reescribe con su lista nueva. */


/** R20 · LA FAMILIA ALERTA NO SE RELLENA (S82-B, orden founder — el
 *  guard que protege los 4.2 grados).
 *
 *  POR QUÉ EXISTE: el CTA de oro vive a 4.2° del ámbar de alerta
 *  (medido r18: hueco 41.0–45.2 entre el alerta y la ventana prohibida
 *  del amarillo de marca). A esa distancia **el matiz no separa nada** —
 *  lo único que mantiene distinguibles al CTA y a "necesita atención" es
 *  que juegan en registros distintos: **el CTA es FILL saturado; el
 *  alerta vive como TINTE con su texto AA**. Si algún día un badge ámbar
 *  se rellena, los dos colapsan y **ningún grado de matiz lo arregla**:
 *  la cura sería mover el CTA, que ya no tiene a dónde ir.
 *
 *  QUÉ VIGILA: `backgroundColor` resuelto a `status.warning` (el campo
 *  gráfico) o a `palette.ochre` (el puro) en apps Y en packages/ui.
 *  QUÉ NO TOCA, y es la mayor parte de su uso legítimo: `warningBg` (el
 *  tinte — su forma correcta), `warningText`, `warningBorder`, y
 *  `status.warning` como color de ÍCONO o barra (registro gráfico, Ley
 *  2: AA gobierna texto, no gráfica).
 *  DURA EN 0: medido hoy, cero fills de alerta en las dos apps y en ui. */
function r20(archivos) {
  const fallos = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    for (const m of limpio.matchAll(/backgroundColor:\s*(theme\.status\.warning\b(?!Bg|Text|Border)|palette\.ochre\b(?!Dark|Alpha|Border))/g)) {
      fallos.push(`${path}:${lineaDe(limpio, m.index)} — la familia ALERTA como FILL (${m[1]}): el ámbar vive como TINTE con su texto AA. Rellenarlo colapsa el CTA de oro con "necesita atención" — están a 4.2° y el matiz no los separa`);
    }
  }
  return { fallos, info: `${fallos.length} fills de alerta` };
}



/* ☠️ R22 SE RETIRÓ EN S85-B7, POR SU CONDICIÓN ② — la que estaba
 *  escrita al nacer y nombraba este día con todas las letras:
 *  «`FiltroPills` se promueve a `packages/ui` con el invariante metido
 *  en el CONTRATO del componente — la marca como slot que no se puede
 *  anidar. Ahí el guard es redundante y lo retira B en el commit de la
 *  promoción.» La promoción ocurrió; el retiro va en el mismo commit,
 *  como su propia letra ordenaba.
 *
 *  QUÉ VIGILABA: que `MarcaElegido` existiera, se montara, y que su
 *  render NO cayera dentro del bloque de la placa del glifo. El defecto
 *  merecía guard porque SE VE COMO LAYOUT y no como cambio de ley: mover
 *  la huella adentro de la placa no rompe el build ni cambia un color, y
 *  sin embargo devuelve el producto al caso que S80 midió — los glifos
 *  b′ ya CONTIENEN una huella (Ley 12), así que adentro la marca es una
 *  huella entre huellas y deja de señalar.
 *
 *  POR QUÉ EL RETIRO NO DEJA ALCANCE HUÉRFANO, que es lo único que
 *  importa al retirar: el invariante dejó de depender de que alguien lo
 *  respete y pasó a ser IMPOSIBLE DE ROMPER DESDE AFUERA. En la pieza
 *  promovida la marca no es un slot que el consumidor pueda anidar: es
 *  estructura interna, hermana del label, y el consumidor no la toca. Un
 *  guard que vigila lo que el tipo ya garantiza es decoración — el mismo
 *  criterio con el que esta casa retiró R19, R21, R23 y R26.
 *
 *  LO QUE SIGUE VIGILADO, para que nadie crea que la ley se fue con el
 *  guard: R25 sigue cazando la pata RE-DIBUJADA en cualquier archivo, y
 *  las tres condiciones de la marca viven escritas en la primitiva
 *  `MarcaEleccion`. La ley no se retira: se retira su vigilancia
 *  redundante. */

/** R24 · EL PIE DE RESERVA NO SE COPIA (S82-B r35 — la regla que la
 *  extracción necesitaba para servir de algo).
 *
 *  EL DEFECTO QUE MECANIZA, medido y no supuesto: el pie fijo de la
 *  reserva vivía como pieza y DOS de sus cuatro pantallas lo tenían
 *  copiado a mano — y la copia no había divergido en un matiz: **había
 *  perdido el precio entero.** Nadie lo hizo mal a propósito; se copió
 *  porque copiar era posible. La pieza subió a `packages/ui`, y esta
 *  regla es lo que hace que la próxima copia no llegue a existir.
 *
 *  QUÉ MIRA: un `paddingBottom: Math.max(insets.bottom …)` dentro de
 *  `explorar/` — la firma exacta de un pie fijo hecho a mano. El
 *  `Math.max` es lo que delata la copia: es la decisión que la pieza ya
 *  toma por vos (la ley chica de la cola de scroll, S70-B5), y
 *  recalcularla en la pantalla es cómo se divergió la primera vez.
 *
 *  SU ALCANCE, ACOTADO A PROPÓSITO (y esto es letra, no pereza): rige
 *  SOLO en `explorar/`, que es la familia que el founder nombró. Un pie
 *  fijo en un LOG o en el Hogar es otro trabajo —no lleva precio ni
 *  "desde"— y esta regla no opina sobre él. Ensanchar el alcance a
 *  "todo pie fijo" convertiría una ley medida en una superstición.
 *
 *  BASELINE con nombre y CONDICIÓN DE MUERTE: quedan DOS, las dos de
 *  adiestramiento, y NO las curo yo — C las tiene declaradas como su
 *  paso siguiente (D-586: el índice es compartido). Cuando adopten la
 *  pieza, el conteo baja y el lint PIDE bajar el baseline: un guard que
 *  sobrevive a su propia razón es basura que nadie se anima a tocar. */
// S85-B1 · SOLO-BAJA EJECUTADO, la mitad. `explorar/adiestramiento/index.tsx`
// ADOPTÓ la pieza y sale de la lista: medido hoy, 0 copias a mano y 2
// `PieReserva`. El lint venía pidiendo esta baja desde que C la curó
// ("1/2 — BAJÓ: actualizar baseline") y el pedido se estaba imprimiendo
// sin que nadie lo cobrara. Queda UNA, con dueño y con su condición de
// muerte intacta (D-586: el índice es compartido; la cura es de C).
const BASELINE_R24 = {
  'apps/cliente/src/app/(tabs)/explorar/adiestramiento/confirmar-programa.tsx': 1,
};
const OFICIOS_R24 = ['paseo', 'veterinaria', 'grooming', 'adiestramiento'];
function r24(archivos) {
  const fallos = [];
  let total = 0;
  let corpus = 0;
  const sumaBaseline = Object.values(BASELINE_R24).reduce((a, b) => a + b, 0);
  for (const { path, src } of archivos) {
    if (!/\/explorar\//.test(path)) continue;
    corpus++;
    let enArchivo = 0;
    for (const m of sinComentarios(src).matchAll(/paddingBottom:\s*Math\.max\(\s*insets\.bottom/g)) {
      enArchivo++;
      if (enArchivo > (BASELINE_R24[path] ?? 0))
        fallos.push(
          `${path}:${lineaDe(src, m.index)} — PIE DE RESERVA COPIADO A MANO. La pieza es <PieReserva> (@epetplace/ui): trae el precio con su "desde", el CTA y el piso de la safe area. La copia de esta familia ya perdió el precio entero una vez — por eso existe la pieza.`,
        );
    }
    total += enArchivo;
  }
  // ANCLA — y la escribo contra MI PROPIA regla, que nació con este
  // hueco: R24 filtra por la RUTA `explorar/`. Si esas pantallas se
  // mueven o el segmento se renombra, el filtro no matchea nada, el
  // conteo da 0 y el lint informa "0 pies a mano" — verde, y la próxima
  // copia entra sin que nadie se entere. No basta con "algún archivo":
  // los CUATRO oficios tienen que estar, porque la regla existe para
  // esa familia y para el quinto que venga.
  const vistos = OFICIOS_R24.filter((o) =>
    archivos.some((a) => a.path.includes(`/explorar/${o}/index.tsx`)),
  );
  fallos.push(...ancla('R24', vistos.length, OFICIOS_R24.length, `pantalla(s) de reserva (faltan: ${OFICIOS_R24.filter((o) => !vistos.includes(o)).join(', ') || 'ninguna'})`));
  return {
    fallos,
    info: `${total}/${sumaBaseline} pies a mano en ${corpus} archivos de explorar/ · oficios anclados=${vistos.length}/4 (baseline: confirmar-programa de adiestramiento, de C)${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R25 · LA PATA NO SE REINVENTA (S82-B r37 — la ley de la marca de
 *  elección, mecanizada el día que se firmó).
 *
 *  POR QUÉ EXISTE: la pata marca la elección en TRES controles
 *  (`FiltroPills`, `FiltroMascotas`, `SelectorSegmentado`). Dejó de ser
 *  una decisión por pieza y pasó a ser gramática de la casa — y una
 *  gramática copiada en tres archivos no es gramática: son tres
 *  coincidencias esperando divergir. Es la MISMA enfermedad del pie de
 *  reserva, cazada esta vez ANTES de que divergiera.
 *
 *  QUÉ MIRA, y por qué ESTE literal: `rotate: '-14deg'` es la huella
 *  dactilar de la anatomía firmada — nadie llega a −14° por casualidad;
 *  si aparece, alguien está re-dibujando la pata. Es un net ANGOSTO a
 *  propósito: el obvio ("una Huella dentro de algo absoluto") da SEIS
 *  archivos y cinco son legítimos (AvatarMascota usa la huella como cara,
 *  el Hogar también) — una regla que grita donde no hay delito se
 *  desactiva sola en la cabeza de quien la lee.
 *
 *  BASELINE con nombre y CONDICIÓN DE MUERTE: 1, el `MarcaElegido` de
 *  `filtro-pills` (de C, byte-equivalente a la primitiva). Cuando C la
 *  adopte, el conteo baja y el lint PIDE bajar el baseline. */
const CASA_PATA = 'packages/ui/src/brand/MarcaEleccion.tsx';
// ✅ VACÍO desde S85-B7 (solo-baja EJECUTADO): el `MarcaElegido` local
// murió con la promoción de `FiltroPills` a `packages/ui` — la pieza
// adoptó la primitiva canónica `MarcaEleccion` en vez de su clon
// byte-equivalente. El lint venía pidiendo esta baja en cuanto el conteo
// cayera. DE VACÍO NO SE SUBE: toda pata re-dibujada es roja el primer día.
const BASELINE_R25 = {};
function r25(archivos) {
  const fallos = [];
  let total = 0;
  let casa = 0;
  const sumaBaseline = Object.values(BASELINE_R25).reduce((a, b) => a + b, 0);
  for (const { path, src } of archivos) {
    const n = (sinComentarios(src).match(/rotate:\s*'-14deg'/g) ?? []).length;
    if (path.endsWith('MarcaEleccion.tsx')) { casa += n; continue; }
    total += n;
    if (n > (BASELINE_R25[path] ?? 0))
      fallos.push(
        `${path} — LA PATA RE-DIBUJADA. La marca de la elección es UNA pieza: <MarcaEleccion> de @epetplace/ui (PATA 24 · MONTA = PATA/3 · −14° · absoluta sobre el canto). Sus tres condiciones viven ahí: aparece SOLO en la elegida · JAMÁS adentro de la placa (R22) · apoyada sobre el canto, con el aire reservado por quien la porta.`,
      );
  }
  // ANCLA: si la primitiva pierde su −14° (renombre, refactor), esta
  // regla queda vigilando un fantasma y todo pasa en verde.
  fallos.push(...ancla('R25', casa, 1, `−14° en la propia primitiva (${CASA_PATA})`));
  return {
    fallos,
    info: `${total} patas re-dibujadas${sumaBaseline === 0 ? ' (DURA EN 0 desde S85-B7: el clon local murió con la promoción)' : ` (baseline ${sumaBaseline})`}${total < sumaBaseline ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R30 · EL GLIFO RE-DIBUJADO (S86-B — la mitad de D-645 que ninguna
 *  promoción tuvo, y D-546 mecanizada).
 *
 *  EL DEFECTO QUE VIGILA, con su costo medido: tres archivos de apps
 *  copiaban geometría del registry de `Icono` porque la pieza no exponía
 *  el color de la huella ni el eje de la barra. La skill lo declaraba
 *  desde S78 —*"todo glifo nuevo del prestador nace con este riesgo"*— y
 *  la cabecera del clon del prestador lo cobró TRES VECES en una sola
 *  sesión (S85). **El día que la pieza ganó las props, los clones
 *  murieron; lo que faltaba es que nadie pueda fundar el cuarto.**
 *
 *  ⚠️ POR QUÉ ESTA REGLA Y NO "UN SVG CON TRAZO 1.9 + UNA HUELLA": lo
 *  medí y da SEIS archivos, casi todos legítimos —el Hogar y el perfil
 *  usan la huella como CARA de mascota y el 1.9 en otro control del mismo
 *  archivo—. **Una regla que grita donde no hay delito se desactiva sola
 *  en la cabeza de quien la lee** (la lección literal de R25). El delito
 *  no es dibujar: es dibujar LO QUE EL REGISTRY YA TIENE. Por eso compara
 *  contra el registry vivo — si un glifo no existe ahí, esto calla.
 *
 *  ⚠️ SU LÍMITE, MEDIDO Y DECLARADO EN VEZ DE DESCUBIERTO DESPUÉS: el
 *  umbral de 18 chars existe para que paths triviales (chevrones, checks)
 *  no coincidan por casualidad, y tiene un costo real — **un glifo cuyos
 *  paths sean TODOS cortos es invisible para esta regla**. Caso vivo al
 *  escribirla: `compartir` (tres paths de 8, 17 y 15 chars) viajaba
 *  concatenado en un solo `d=` del perfil de mascota y R30 no lo veía. Se
 *  curó el SITIO (hoy monta `<Icono>`), no el umbral: bajarlo compra
 *  ruido, no cobertura. Quien encuentre el segundo caso, que cure el
 *  sitio igual — o que cambie el eje de comparación, no el número.
 *
 *  BASELINE: **{} — DURA EN 0**, y nace así porque el único hit real de
 *  su primer día se curó en el mismo commit (el lápiz del perfil, al que
 *  además le faltaba el bisel). De vacío no se sube: todo glifo
 *  re-dibujado es rojo el primer día. */
const CASA_REGISTRY = 'packages/ui/src/components/Icono.tsx';
const MIN_PATH_R30 = 18;
const BASELINE_R30 = {};
const pathsDe = (src) => [...sinComentarios(src).matchAll(/d="([^"]+)"/g)];
function r30(archivos) {
  const fallos = [];
  const esRegistry = (p) => p.replace(/\\/g, '/').endsWith('components/Icono.tsx');
  const registry = archivos.find((a) => esRegistry(a.path));
  // El SET del registry: paths largos, del CÓDIGO (no de las lápidas —
  // L-170: un censo lee los comentarios como código si se lo permitís).
  const delSet = new Set(
    registry ? pathsDe(registry.src).map((m) => m[1].replace(/\s+/g, ' ').trim()).filter((d) => d.length >= MIN_PATH_R30) : [],
  );
  let copias = 0;
  for (const { path, src } of archivos) {
    if (esRegistry(path) || !path.replace(/\\/g, '/').startsWith('apps/')) continue;
    let n = 0;
    for (const m of pathsDe(src)) {
      const d = m[1].replace(/\s+/g, ' ').trim();
      if (!delSet.has(d)) continue;
      n++;
      copias++;
      if (n > (BASELINE_R30[path] ?? 0))
        fallos.push(
          `${path}:${lineaDe(src, m.index)} — GLIFO RE-DIBUJADO: este path existe BYTE-IDÉNTICO en el registry de \`Icono\`. Montá <Icono nombre="…"> — la pieza acepta \`tinta\` (trazo), \`huella\` (color independiente, D-546) y \`activa\` (el eje de la barra: la huella de ESTRUCTURA recolorea, la de MARCA aparece — ley 6, resuelta ADENTRO). Un dibujo con dos fuentes diverge en silencio: nada falla cuando una se actualiza y la otra no.`,
        );
    }
  }
  // ANCLA: si el registry se renombra, se parte o cambia de forma, el SET
  // queda vacío y la regla pasaría en VERDE sin comparar contra nada —
  // su silencio significaría "no miré", no "no hay copias" (L-192).
  fallos.push(...ancla('R30', delSet.size, 30, `paths de ≥${MIN_PATH_R30} chars en el registry (${CASA_REGISTRY})`));
  return {
    fallos,
    info: `${copias} glifo(s) re-dibujado(s) · ${delSet.size} paths del registry vigilados${copias === 0 ? ' (DURA EN 0 desde S86-B: los tres clones murieron)' : ''}`,
  };
}

/** Fixture de R30 — sintético a propósito: 34 paths largos distintos
 *  para pasar el ancla, y UN archivo de apps que copia el primero. Si el
 *  ancla fuera lo que lo pone rojo, la prueba pasaría por el motivo
 *  equivocado y no probaría la regla que dice probar (precedente R24). */
const PATHS_R30 = Array.from(
  { length: 34 },
  (_, i) => `M4.4 ${5 + i}.2h15.2a1.5 1.5 0 0 1 1.5 1.5v9.8a1.5 1.5 0 0 1-1.5 1.5Z`,
);
const FIXTURE_R30 = [
  { path: CASA_REGISTRY, src: PATHS_R30.map((d) => `<Path d="${d}" />`).join('\n') },
  { path: 'apps/cliente/src/(fixture)/GlifoCopiado.tsx', src: `<Path d="${PATHS_R30[0]}" />` },
];

/** Corpus de relleno para los fixtures de las reglas que anclan contra
 *  `MINIMOS_CORPUS.apps` (las cuatro del Norte). Archivos vacíos: no
 *  aportan violaciones, solo altura de corpus — su único trabajo es que
 *  el ancla no se encienda y el rojo medido sea el del brazo real. */
const RELLENO_APPS = Array.from({ length: MINIMOS_CORPUS.apps }, (_, i) => ({
  path: `(fixture-relleno-${i})`,
  src: '',
}));

/* ── LOS PISOS DE LAS CUATRO DEL NORTE ──────────────────────────────────
   Viven acá, y no pegados a su función como los demás baselines, por una
   razón mecánica: sus FIXTURES los leen, y los fixtures se evalúan antes
   que el cuerpo de las reglas. Un `const` no se hoistea. El porqué de
   cada número está en el header de su regla, más abajo.

   LOS CUATRO SON EL NÚMERO MEDIDO DEL CORPUS VIVO al abrir la tanda, no
   una cuota: 21 espaciados crudos · 20 radios crudos (hoy 7: las 13 pildoras murieron con la firma del 14-ago) · 6 pantallas sobre
   el presupuesto de separadores · 6 sobre el de tamaños. Solo bajan.

   ⚠️ LOS DOS PRIMEROS SE MIDIERON DOS VECES Y DIERON DISTINTO, y el que
   vale es el segundo: un `grep` sobre `apps` + `packages` dijo **36** y
   **21**; este lint, que corre solo sobre `apps` y despoja comentarios
   (L-170), dice **21** y **20**. No hay contradicción — miden corpus
   distintos —, pero **el piso lo fija la herramienta que lo exige**, o
   el ratchet arrancaría con margen regalado. Es exactamente la historia
   de R2 (grep 7 · lint crudo 8 · despojando prosa 4), y por eso se
   escribe: la próxima regla se ahorra el paso. */
// ⏬ S98-C: 21 → 20. El trinquete lo APRIETA quien lo baja, si no se
// oxida: la reconstrucción del Negocio en baldosas se llevó un `gap: 2`
// inline de la anatomía vieja de los mundos. El propio lint lo pidió
// («BAJÓ: actualizar baseline»). Declarado a B, dueña del instrumento.
const BASELINE_R36 = 20;
const BASELINE_R37 = 3;
// S99-C · 6 → 5: la Hoja de alta que murió en `ventas/configuracion.tsx` se
// llevó sus separadores. **El trinquete se aprieta en el mismo commit que lo
// baja** — un baseline que queda flojo deja volver la regresión SIN que el
// lint diga nada, y en un solo-baja eso es peor que no tener la regla: el
// número más chico se lee como progreso mientras la puerta sigue abierta.
const BASELINE_R38 = 5;
const BASELINE_R39 = 6;
const PRESUPUESTO_SEPARADORES = 3;
/** R42 · la puerta de la foto — su doctrina vive con la regla, abajo.
 *
 *  ⏬ S99-B · PARTICIÓN POR DUEÑO Y CURABILIDAD (orden de mesa, aplicada
 *  HACIA ATRÁS).
 *
 *  **✅ VERIFICADO QUE APLICA, y se declara el lado afirmativo igual que
 *  el negativo** (conducta ratificada por mesa: *«una orden de mesa
 *  ejecutada sin verificar si aplica es una orden mal ejecutada, aunque
 *  el resultado se vea prolijo»* — y el declarar es la mitad exigible,
 *  **en cualquiera de los dos sentidos**). El criterio y su resultado:
 *
 *  > ¿Tiene esta regla un número PARADO que se pueda confundir entre
 *  > «nadie lo tocó» y «nadie PUEDE tocarlo»? **R42: SÍ** — su baseline
 *  > es una lista de diez archivos esperando, y ninguno decía de quién
 *  > era ni si se podía. *(Su hermana R43 dio **NO** y también está
 *  > declarado, en su propia cabecera.)*
 *
 *  El baseline decía *«2 de ui + 8 de apps»* y eso es
 *  origen, no estado: **un número parado no dice si nadie lo tocó o si
 *  nadie PUEDE tocarlo.**
 *
 *  🔴 Y AL APLICARLA APARECIÓ UNA TERCERA CLASE QUE LA ORDEN NO PREVIÓ,
 *  porque el objeto la tenía: **hay una entrada que NO ES DEUDA y jamás
 *  va a bajar** — `EvidenciaFoto` no es una puerta a mano esperando
 *  migrar: es **otra interacción** (cámara DIRECTA, la galería detrás de
 *  un mantenido). *Contarla como deuda miente en el otro sentido: promete
 *  un 0 que sería un error alcanzar.*
 *
 *  ⇒ Las tres clases, y el criterio para leer el número:
 *   · **CURABLE** — baja cuando su lote toque el archivo.
 *   · **BLOQUEADA** — no se cura escribiendo mejor; espera una firma.
 *   · **LEGÍTIMA** — cumple otra ley y **se queda**. El piso real de esta
 *     regla NO es 0: es 1. */
const CASA_PUERTA_FOTO = 'packages/ui/src/components/HojaCaptura.tsx';
/** clase → por qué está parada. La clave ES la ruta; el valor es la
 *  razón que el lector necesita para no pedirle a la persona equivocada
 *  que la cure. */
const BASELINE_R42_CLASES = {
  // ── LEGÍTIMA · NO baja nunca, y está bien ────────────────────────
  'packages/ui/src/components/EvidenciaFoto.tsx':
    'LEGÍTIMA (no es deuda) · no es un menú: la cámara es DIRECTA y la galería vive detrás de un mantenido. Otra interacción, otra pieza. El piso de R42 es 1, no 0.',
  // ── BLOQUEADA · no se cura escribiendo mejor ─────────────────────
  'packages/ui/src/components/SelectorAvatar.tsx':
    'BLOQUEADA · dueño B · su hoja tiene TRES Celda y la tercera («Por ahora no») es decisión FIRMADA en S45. Absorberla es un GATE DE FORMA del founder, no un refactor — y no viaja escondido adentro de otra tanda.',
  // ── CURABLES · bajan cuando su lote toque el archivo ─────────────
  'apps/cliente/src/app/carnet.tsx': 'CURABLE · dueño del lote del cliente',
  'apps/cliente/src/app/(tabs)/cuenta/perfil.tsx': 'CURABLE · dueño del lote del cliente',
  'apps/cliente/src/components/HojaFotoMascota.tsx':
    'CURABLE · dueño del lote del cliente. ⚠️ Su propia cabecera ya lo pedía desde S82: «cuando SelectorAvatar gane el encuadre de la casa, esta Hoja muere absorbida» — la deuda estaba declarada por su autor antes de que existiera la pieza.',
  /* ☠️ S99-C · L2 — SALE con la Hoja de alta que la contenía. Su puerta
     era `FotoDelRepartidor`, dos botones inline sin cerrojo; **murió con
     su Hoja** y su reemplazo es `HojaCaptura` en la ficha
     (`/ventas/repartidor/[id]`), que trae el cerrojo. Los dos imports
     quedaron muertos un rato y se retiraron acá — el mismo residuo que
     `cuenta/perfil.tsx` (R42 mira la PRESENCIA del identificador, no la
     llamada). */
  /* ☠️ S99-C · SALE, y NO por migración: era un FALSO POSITIVO del
     instrumento. R42 mira la PRESENCIA de los dos identificadores, y acá
     `capturarConCamara` estaba **importado y jamás llamado** — cero
     llamadas medidas. La pantalla nunca tuvo puerta de dos ramas: la del
     logo ofrece SOLO galería, y su «Tomar foto» ya había muerto por Ley
     23 con su razón escrita (la cámara entrega JPEG y el logo es PNG-only
     — esa puerta habría rebotado siempre). La cura fue retirar el import
     muerto. *El baseline decía «migra la de avatar» y esa captura de
     avatar no existe en este archivo: la nota describía algo que no
     estaba.* La de LOGO sigue sin migrar y sigue teniendo razón (D-740). */
  /* ☠️ S99-C · MIGRADA (15-ago). Su hoja tenía dos `Celda interactiva` y
     acá SÍ cambió la forma — con firma detrás, no por gusto: la anatomía
     canónica es `Boton` porque abrir la cámara es un COMANDO (Ley 22c), y
     una `Celda` promete que tocar te lleva. No es un gate de forma nuevo:
     es aplicar una ley ya firmada. Distinto de `SelectorAvatar`, que sigue
     BLOQUEADA porque su tercera fila es una decisión firmada en S45 —
     ahí hay una firma específica que proteger; acá no había ninguna. */
  /* ☠️ S99-C · MIGRADA (15-ago). Anatomía ya canónica ⇒ cura sin cambio
     de forma: ganó el cerrojo. Su otra `Hoja` (la de país emisor) no es
     una puerta de foto y queda intacta. */
  /* ☠️ S99-C · MIGRADA (15-ago). Su anatomía YA era la canónica —una
     `Hoja` con dos `Boton bloque`—, así que la migración no cambió la
     forma: le dio el CERROJO, que es lo que no se ve y lo que faltaba.
     Es el precedente de las tres que quedan del prestador: donde la
     anatomía ya coincide, migrar es cura y no gate de forma. */
};
const BASELINE_R42 = new Set(Object.keys(BASELINE_R42_CLASES));
/** El piso REAL: las que no son deuda. R42 no puede llegar a 0 y decirlo
 *  es la mitad del trabajo de la partición. */
const PISO_R42 = Object.values(BASELINE_R42_CLASES).filter((r) => r.startsWith('LEGÍTIMA')).length;

// ── L-192: LA AUTO-PRUEBA — cada regla con modo de fallo DEBE salir
//    roja contra su fixture sintético, en CADA corrida. ──
const FIXTURES = {
  /* R67 · 🔴 EL FIXTURE AMPUTA **EL SEXTO**, y la elección es el discriminador
     entero — no vale amputar cualquiera.

     **Por qué el sexto y no «sangrado»** (que era lo que amputaba antes): la
     letra enumera SEIS —*dificultad para respirar · sangrado · convulsiones ·
     golpe fuerte · dolor intenso · decaimiento repentino*— pero los dos últimos
     venían unidos por «o», así que **el extractor los fusionaba en uno**.
     ⇒ *la pieza nació con una tupla de cinco y la prosa de la letra decía
     cinco, las dos por el mismo motivo: **el instrumento fusionaba justo lo que
     venía a vigilar**.*

     **El sexto es el ÚNICO que el brazo ① no sabía nombrar**, así que es el
     único cuya amputación prueba que la cura funcionó. Amputar «sangrado»
     seguiría dando rojo **con el defecto vivo al lado** — un rojo por la razón
     equivocada es tan inútil como un verde por la razón equivocada.

     ✅ **Y da rojo con la letra VIEJA y con la NUEVA, medido:** con «o» falta la
     frase compuesta; con coma falta el signo nombrado. *Un fixture que depende
     del orden de merge de otra pista no es un fixture.*

     ⚠️ El `path` TIENE que ser el del diccionario `es` del cliente: con
     cualquier otro, el ancla ② corta antes y saldría NO CONCLUYENTE — que no
     es verde, pero tampoco probaría que la regla sabe contar.
     ⚠️ El `path` TIENE que ser el del diccionario `es` del cliente: con
     cualquier otro, el ancla ② corta antes y saldría NO CONCLUYENTE — que no
     es verde, pero tampoco probaría que la regla sabe contar hasta cinco.
     ⚠️ Y trae el bloque ENTERO a propósito: si faltara una clave, el rojo
     vendría por «falta la clave» y no por el signo amputado, que es la razón
     equivocada. */
  /* 🔴 EL FIXTURE ESTÁ EN LA FORMA PARTIDA **Y** LE FALTA EL SEXTO — las dos
     cosas a la vez, y ninguna es decorativa:

     · **En forma de LISTA** (`avisoTeleSigno1..5`), que es la que C depositó.
       ⇒ **prueba que el juez SABE LEERLA.** Si el lector volviera a buscar el
       párrafo entero en `avisoTeleNoReemplaza`, no encontraría ningún signo y
       el rojo saldría por «faltan los seis» — *un rojo por la razón equivocada
       es tan inútil como un verde por la razón equivocada.*
     · **Sin el SEXTO**, que es el único que el brazo ① no sabía nombrar cuando
       el extractor fusionaba «dolor intenso o decaimiento repentino».
       ⇒ **prueba que la cura de la cuenta funcionó.**

     **El rojo correcto nombra UNA sola cosa: «decaimiento repentino».** Si
     nombrara seis, el juez perdió la forma; si no nombrara ninguna, perdió la
     cuenta. *Un fixture que solo verifica que la regla «sale roja» no
     distingue esos tres mundos.*

     ⚠️ El `path` TIENE que ser el del diccionario `es` del cliente: con
     cualquier otro, el ancla ② corta antes y saldría NO CONCLUYENTE — que no
     es verde, pero tampoco probaría nada. */
  /* R68 · EL FIXTURE ES EL CASO REAL DE `TileVideoPropio`, no uno inventado:
     **el `runOnJS` está escrito y correcto, y lo que cruza el hilo es el
     ARGUMENTO.** Si la regla sólo preguntara «¿hay runOnJS?», este fixture
     saldría VERDE — y con él los tres crashes que la parieron.
     *Un fixture que la regla caza por la razón fácil no prueba que sirva.* */
  /* R69 · EL FIXTURE ES EL CASO REAL, reducido: la capa que encerró al founder.
     Un absoluto montado DESPUÉS de la superficie, sin declaración. Si la regla
     mirara todo el archivo en vez de lo que va después del montaje, los
     absolutos de la propia superficie la harían saltar siempre y sería ruido;
     si mirara sólo el montaje, este caso saldría verde. */
  R69: [{
    path: 'apps/prestador/src/app/videollamada/[citaId]Fixture.tsx',
    src: "<><SuperficieLlamada alto={a} />\n  <View style={{ position: 'absolute', bottom: 120 }}>{capa}</View>\n</>",
  }],
  R68: [{
    path: 'packages/ui/src/components/PiezaFixture.tsx',
    src: 'const g = Gesture.Pan().onEnd(() => {\n  runOnJS(pegar)(masCercana(x.value, y.value))\n})',
  }],
  R67: [{
    path: 'apps/cliente/src/i18n/es.ts',
    src:
      "const a = { avisoTeleTitulo: 'Antes de continuar', avisoTeleParaQue: 'x', " +
      "avisoTeleNoReemplaza: 'No reemplazan una atención presencial ni sirven para emergencias.', " +
      "avisoTeleSignosIntro: 'Si notas que tu mascota está en riesgo:', " +
      "avisoTeleSigno1: 'Dificultad para respirar', avisoTeleSigno2: 'Sangrado', " +
      "avisoTeleSigno3: 'Convulsiones', avisoTeleSigno4: 'Golpe fuerte', " +
      "avisoTeleSigno5: 'Dolor intenso', " +
      "avisoTeleSignosCierre: 'Llévala a una clínica ahora mismo.', " +
      "avisoTeleTransito: 'v' }",
  }],
  /* R66 · el fixture usa un path de diccionario para que el ANCLA no sea lo
     que lo ponga rojo (la regla exige ver al menos un `i18n` o se declara no
     concluyente), y un archivo SIN baseline — que es el modo de falla real:
     **voz nueva escrita en voseo en un archivo que nadie había medido**.
     ⚠️ La cadena elegida usa `cancelás`, uno de los SEIS huecos que el censo
     de segundo orden destapó: si alguien revierte esa ampliación de la lista,
     este fixture deja de poder salir rojo y el guard estructural lo dice. */
  R66: [{ path: 'apps/cliente/src/i18n/es.ts.fixture', src: "const a = { nota: 'Si cancelás, todo sigue como estaba.' }" },
        { path: 'apps/cliente/src/i18n/es.ts', src: '' }],
  /* R65 · el fixture ataca el brazo A (la cuenta del área de reserva), que es
     el que se viola con UN número. Baja `ALTO_LOGO` de 32 a 28: con el isotipo
     a 22 dp y X en 4,40, el resguardo pide 30,80 y ya no entra.
     ⚠️ El `path` TIENE que terminar en `logo-franquicia.tsx`: la regla busca la
     pieza por nombre y con cualquier otro path saldría NO CONCLUYENTE — que no
     es verde, pero tampoco probaría que la regla sabe decir que no.
     ⚠️ Y trae las CUATRO constantes: si falta una, la regla corta antes por
     «constantes ilegibles» y el rojo sería por la razón equivocada. */
  R65: [{
    path: 'apps/cliente/src/components/logo-franquicia.tsx',
    src: 'export const ANCHO_LOGO = 56;\nconst ALTO_LOGO = 28;\nconst CONTENIDO_ANCHO = 44;\nconst CONTENIDO_ALTO = 22;',
  }],
  /* R64 · dos fixtures, uno por brazo. El `path` no importa acá (R64 no
     filtra por ruta: mira cualquier archivo que declare `respaldo`).
     ⚠️ El del brazo A nombra un wrapper INVENTADO a propósito — es el modo
     de falla real: se teclea el nombre del wrapper que uno PIENSA
     construir, y sin el juez nadie nota que no existe. */
  R64: [{ path: '(fixture)', src: "respaldo: 'wrapperQueNoExisteR64'" }],
  /* R63 · el fixture apunta al brazo A, que es el que se puede violar con
     una línea de código. Los brazos B y C se probaron en rojo contra un
     árbol de rutas sintético al escribir la regla (ver su cabecera); acá
     alcanza con que la regla DEMUESTRE que sabe decir que no.
     ⚠️ El `path` arranca con `apps/cliente/` a propósito: sin eso la regla
     descarta el archivo por no pertenecer a ninguna app y el fixture
     saldría VERDE — que es justo el verde flojo que L-192 persigue. */
  R63: [{ path: 'apps/cliente/src/app/(tabs)/cuenta/fixture.tsx', src: "router.push('/cuenta/esta-ruta-no-existe-r63')" }],
  R1: [{ path: '(fixture)', src: '<SelectorOpcion naturaleza="foo" />\n<SelectorOpcion entidad naturaleza="existe" />' }],
  R2: [{ path: '(fixture)', src: Array(BASELINE_HEX + 1).fill("color: '#ABC123'").join('\n') }],
  /* R35 · SU FIXTURE LLEGA UNA SESIÓN TARDE, y el porqué es el hallazgo
     de S97+-B: **la regla corría sin estar en `REGLAS`**, así que los
     TRES guards estructurales —que iteran `REGLAS`— no podían verla.
     Nació en S96-B, se reportó "DURA EN 0" en S96 y otra vez en S97, y
     en las dos el número salía de una regla **de la que nadie había
     comprobado que pudiera salir roja**. El caso limpio de L-192: no
     falló el guard, falló que el objeto vigilado nunca entró al corral.

     EL FIXTURE TRAE LA GALERÍA A PROPÓSITO. R35 tiene ancla (exige ver
     al menos un archivo de `packages/ui/src/gallery/`), así que un
     fixture sin ese path saldría rojo **por el ancla y no por la
     regla** — verde-por-la-razón-equivocada dado vuelta: un ROJO por la
     razón equivocada, que está igual de roto. El brazo del ancla tiene
     su propio rojo abajo, en EXTRAS_BRAZOS. */
  R35: [{ path: 'packages/ui/src/gallery/(fixture).tsx', src: "style={{ backgroundColor: '#00000010' }}" }],
  /* LAS CUATRO DEL NORTE · sus fixtures traen CORPUS DE RELLENO, y no es
     un truco: las cuatro anclan contra `MINIMOS_CORPUS.apps`, así que un
     fixture de un solo archivo saldría rojo POR EL ANCLA y dejaría el
     brazo real sin probar — el mismo error que R35 tenía y que esta
     tanda vino a cerrar. El relleno hace pasar el ancla para que el rojo
     que se mide sea el de la regla. El ancla tiene su rojo aparte, en
     EXTRAS_BRAZOS. */
  /* R40 · el fixture enciende el brazo ① (contador). Trae los CUATRO
     diccionarios para que el ancla no se encienda y el rojo medido sea
     el de la regla — la misma disciplina que R35 y las del Norte. El
     brazo ② (paridad es↔en) tiene su rojo aparte en EXTRAS_BRAZOS:
     ningún fixture único puede encender los dos, porque el que agrega
     claves de más las agrega EN LOS DOS idiomas. */
  /* R41 · el fixture trae SEIS piezas para que el ANCLA no sea lo que lo
     pone rojo (mínimo 6): cinco sanas —una por cada forma de estar
     cubierta, incluido el FUNDIDO PURO que se exime por medición— y UNA
     con `withSpring` sin el hook. Lo que tiene que salir rojo es la
     pieza descubierta, y una prueba que pasa por el motivo equivocado no
     prueba la regla que dice probar. */
  /* R42 · el fixture trae LAS DIEZ del baseline (como stubs) + la pieza
     canónica + UNA puerta nueva a mano. Sin las diez, el brazo «BAJÓ:
     sacar del baseline» se encendería también y el rojo medido no sería
     el de la regla; sin la canónica, se encendería el ANCLA. Lo único
     que tiene que salir rojo es la puerta nueva. */
  /* R43 · el fixture es una `palette.ts` sintética con las TRES casas
     (para que el ANCLA no sea lo que lo pone rojo) y UNA por debajo del
     piso. Lo que tiene que salir rojo es la casa floja. */
  /* R50 · CUATRO wrappers, y los legítimos son el peso de la prueba
     (L-236): el que ORDENA antes de tomar el primero · el que
     desenvuelve un embed (`Array.isArray(x) ? x[0] : x`, que NO es
     elegir de varios y por eso NO debe salir rojo) · y los DOS del
     baseline más un TERCERO que lo sube. Lo único rojo tiene que ser el
     tercero.
     🔴 Y trae el caso que dio vuelta la regla: uno de los ofensores
     DECLARA su unicidad en un comentario. Tiene que salir rojo IGUAL —
     un comentario no es una garantía de la base. */
  /* R52 · el legítimo es el peso de la prueba (L-236): una pantalla de
     despensa que NO monta el control tiene que salir VERDE, y el motor
     que conserva `p_fecha_programada` NO debe pintarse rojo — se quitó la
     puerta, no el motor. Lo único rojo es el que vuelve a montarlo. */
  /* R53 · el fixture prueba que DISCRIMINA (corolario de L-236): un solo
     ofensor real y TRES que NO deben pintarse rojo — la pantalla que ya
     monta la pieza, la que usa `absolute` para otra cosa (un badge, lejos
     de cualquier `bottom: 0`), y una del baseline congelado. */
  /* R54 · discrimina: el fragmento y el View con box-none NO deben salir
     rojos; el View desnudo sí. */
  /* R57 · discrimina en LAS DOS DIRECCIONES, que es lo que hace que sirva:
     ① un checkout que NO monta la pieza única sale rojo (se fue de la pieza)
     ② una pantalla cualquiera que arma su PROPIA fila con `zonaFin` sale roja
        — *el modo de falla real no es borrar la pieza: es dejarla y escribir
        una versión propia al lado*
     ③ el DUEÑO del módulo usa `zonaFin` y **no** sale rojo: ahí es su casa.

     ⚠️ El fixture nombra los dos checkouts REALES a propósito: si mañana se
     renombra un archivo, esta regla se pone roja en su propia auto-prueba en
     vez de quedarse verde midiendo un corpus vacío. */
  R57: [
    { path: 'apps/cliente/src/app/(tabs)/despensa/checkout.tsx', src: '<SeccionMedioDePago medio={medio} />' },
    { path: 'apps/cliente/src/components/checkout-reserva.tsx', src: '<SeccionMedioDePago medio={medio} />\n<BotonPagar medio={medio} trabajando={x} onPagar={f} />' },
    { path: 'apps/cliente/src/app/(tabs)/otra/propia.tsx', src: '<FilaMedioDePago tarjeta={m} zonaFin="cambiar" onPress={f} />' },
    { path: 'apps/cliente/src/components/seccion-medio-de-pago.tsx', src: '<FilaMedioDePago tarjeta={m} zonaFin="camino" onPress={f} />' },
  ],
  /* R56 · discrimina: el `acento` NUEVO del cliente sale rojo; el del
     baseline no; y el del PRESTADOR tampoco — ahí el slot es teal. */
  R56: [
    { path: 'apps/cliente/src/app/(tabs)/hogar/nuevo.tsx', src: '<Boton variante="acento" etiqueta={t(\'x\')} onPress={f} />' },
    { path: 'apps/cliente/src/app/(tabs)/hogar/index.tsx', src: '<Boton variante="acento" etiqueta={t(\'x\')} onPress={f} />' },
    { path: 'apps/prestador/src/app/(tabs)/cuenta/perfil.tsx', src: '<Boton variante="acento" etiqueta={t(\'x\')} onPress={f} />' },
    { path: 'apps/cliente/src/app/(tabs)/hogar/ok.tsx', src: '<Boton variante="primario" etiqueta={t(\'x\')} onPress={f} />' },
  ],
  /* R55 · discrimina: el envoltorio que reserva el tope ARRIBA DE UN TECHO
     sale rojo; el que reserva SIN techo adentro (estado centrado, el caso
     real de checkout-reserva) NO; y el techo suelto tampoco. */
  R55: [
    { path: 'apps/cliente/src/app/(tabs)/explorar/malo.tsx', src: "<SafeAreaView edges={['top']} style={{ flex: 1 }}>\n<Encabezado variante=\"portada\" saludo={t('x')} />\n</SafeAreaView>" },
    { path: 'apps/cliente/src/app/(tabs)/explorar/malo-un-piso.tsx', src: "<SafeAreaView edges={['top']} style={{ flex: 1 }}>\n<View style={{ flex: 1 }}>\n<Encabezado variante=\"portada\" saludo={t('x')} />\n</View>\n</SafeAreaView>" },
    { path: 'apps/cliente/src/app/(tabs)/explorar/malo-padding.tsx', src: "<View style={{ flex: 1, paddingTop: insets.top }}>\n<Encabezado variante=\"navegacion\" titulo={t('x')} atras />\n</View>" },
    /* 🔴 EL CONTRA-CASO QUE VALE MÁS QUE LOS TRES ROJOS: mismo envoltorio,
       mismo `edges`, y SIN techo adentro — es el estado centrado que SÍ debe
       reservar. Si esto saliera rojo, la cura metería la pantalla debajo de
       la barra de estado, que es peor que el defecto que la regla persigue. */
    { path: 'apps/cliente/src/app/(tabs)/explorar/ok-estado.tsx', src: "<SafeAreaView edges={['top']} style={{ flex: 1 }}>\n<Encabezado variante=\"portada\" saludo={t('x')} />\n</SafeAreaView>\n<SafeAreaView edges={['top']} style={{ flex: 1 }}>\n<View style={{ flex: 1 }}>\n<EstadoVacio titulo={t('y')} />\n</View>\n</SafeAreaView>" },
    { path: 'apps/cliente/src/app/(tabs)/explorar/ok-curado.tsx', src: "<SafeAreaView edges={[]} style={{ flex: 1 }}>\n<Encabezado variante=\"portada\" saludo={t('x')} />\n</SafeAreaView>" },
  ],
  R54: [
    { path: 'apps/cliente/src/app/ok-fragmento.tsx', src: "<PantallaConPie pie={<><Boton /><Boton /></>}>{x}</PantallaConPie>" },
    { path: 'apps/cliente/src/app/ok-boxnone.tsx', src: '<PantallaConPie pie={<View pointerEvents="box-none" style={{ gap: 8 }}><Boton /></View>}>{x}</PantallaConPie>' },
    { path: 'apps/cliente/src/app/malo.tsx', src: "<PantallaConPie pie={<View style={{ gap: 8 }}><Boton /></View>}>{x}</PantallaConPie>" },
    { path: 'apps/prestador/src/app/otra-pieza.tsx', src: "<FichaPrestador pie={<View style={{ gap: 8 }}><Boton /></View>} />" },
  ],
  R53: [
    { path: 'apps/cliente/src/app/(tabs)/despensa/nueva.tsx', src: "<View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Boton /></View>" },
    { path: 'apps/cliente/src/app/(tabs)/despensa/ok.tsx', src: "<PantallaConPie pie={<Boton />}>{contenido}</PantallaConPie>" },
    { path: 'apps/cliente/src/app/(tabs)/despensa/badge.tsx', src: "<View style={{ position: 'absolute', top: 0, right: 0 }}><Insignia /></View>" },
    { path: 'apps/cliente/src/app/(tabs)/despensa/carrito.tsx', src: "<View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Boton /></View>" },
    /* El escape por DECLARACIÓN: con su razón NO sale rojo… */
    { path: 'apps/cliente/src/app/(tabs)/despensa/declarada.tsx', src: "/* R53-DECLARADO: la hoja tiene maxHeight y su scroll vive adentro, asi que la hoja ES el contenido y no hay nada que reservar. */\n<View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Boton /></View>" },
    /* …y la marca PELADA sí, porque un marcador sin razón es un bypass con
       otro nombre. Este par es el que prueba que el escape cuesta algo. */
    { path: 'apps/cliente/src/app/(tabs)/despensa/pelada.tsx', src: "/* R53-DECLARADO: */\n<View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Boton /></View>" },
    /* 🔴 LA CONDICIÓN DE MESA, hecha caso: UNA razón y DOS pies ⇒ el que
       sobra MUERDE. Es lo que impide que la declaración se vuelva una
       exención de archivo por la puerta de atrás. */
    { path: 'apps/cliente/src/app/(tabs)/despensa/dos-pies.tsx', src: "/* R53-DECLARADO: la hoja tiene maxHeight y su scroll vive adentro, no hay nada que reservar. */\n<View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Boton /></View>\n<View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Boton /></View>" },
  ],
  R52: [
    { path: 'apps/cliente/src/app/(tabs)/despensa/carrito.tsx', src: "<SelectorVentana opciones={v} elegida={e} onElegir={f} />" },
    { path: 'apps/cliente/src/app/(tabs)/despensa/motor.ts', src: "calcularPromesaDespensa({ fecha_programada: f })" },
    { path: 'apps/cliente/src/app/(tabs)/despensa/checkout.tsx', src: "<SelectorVentana onProgramarOtra={() => abrir()} etiquetaProgramarOtra={t('despensa.programarFecha')} />" },
    { path: 'apps/cliente/src/app/(tabs)/despensa/otra.tsx', src: "<CampoFecha label={t('despensa.programarFecha')} />" },
  ],
  R50: [
    { path: 'packages/api/src/wrappers/ordena.ts', src: "const publicadas = ofertas.filter(o => o.ok)\nq.order('precio')\nconst x = publicadas[0]" },
    { path: 'packages/api/src/wrappers/embed.ts', src: "const fila = Array.isArray(data) ? data[0] : data" },
    { path: 'packages/api/src/wrappers/uno.ts', src: "const publicadas = ofertas.filter(o => o.ok)\nconst a = publicadas[0]" },
    { path: 'packages/api/src/wrappers/dos.ts', src: "const galeria = fotos.filter(f => f.ok)\nconst b = galeria[0]" },
    { path: 'packages/api/src/wrappers/tres.ts', src: "/* El UNIQUE garantiza que hay una sola */\nconst elegidas = ofertas.filter(o => o.ok)\nconst c = elegidas[0]" },
  ],
  /* R51 · los 5 del baseline + UNO nuevo. Lo único rojo tiene que ser el
     archivo que no está en la lista; los 5 conocidos alcanzan además
     para que el ANCLA no sea lo que lo pinta. */
  R51: [
    { path: 'packages/ui/src/components/Hoja.tsx', src: 'motion.duration.legacy_normal' },
    { path: 'packages/ui/src/components/VisorFoto.tsx', src: 'motion.duration.legacy_normal' },
    { path: 'packages/ui/src/components/MapaRecorrido.tsx', src: 'motion.duration.legacy_normal' },
    { path: 'apps/cliente/src/app/(tabs)/hogar/index.tsx', src: 'motion.duration.legacy_normal' },
    { path: 'apps/cliente/src/app/paseo/[atencionId].tsx', src: 'motion.duration.legacy_normal' },
    { path: 'packages/ui/src/components/PiezaNueva.tsx', src: 'withTiming(x, { duration: motion.duration.legacy_normal })' },
  ],
  /* R49 · CUATRO campos, y los dos legítimos son el peso de la prueba
     (L-236): el que da un EJEMPLO de formato · el que EXPLICA dónde
     encontrar el dato —el caso «Código / El código impreso en tu
     factura», que es real y NO debe salir rojo— · y los dos ecos, uno
     por literal y otro por clave `t()` repetida. Los legítimos alcanzan
     además para que el ANCLA no sea lo que lo pinta. */
  R49: [
    { path: 'apps/cliente/src/app/bien-ejemplo.tsx', src: `<Campo label="Teléfono de contacto" placeholder="+593 99 123 4567" />` },
    { path: 'apps/cliente/src/app/bien-explica.tsx', src: `<Campo label={t('r.codigo')} placeholder={t('r.codigoPlaceholder')} />` },
    { path: 'apps/prestador/src/app/eco-literal.tsx', src: `<Campo label="Diagnóstico" placeholder="diagnóstico" />` },
    { path: 'apps/prestador/src/app/eco-clave.tsx', src: `<Campo label={t('v.medicamento')} placeholder={t('v.medicamento')} />` },
  ],
  /* R58 · la union ENTERA con sus miembros legítimos + el `accent` que
     N23 existe para impedir. Los legítimos son el peso de la prueba
     (L-236): sin ellos el ancla sería lo que pinta el rojo, y la regla
     estaría probando que sabe contar cero. */
  R58: [
    {
      path: 'packages/ui/src/components/Texto.tsx',
      src: "export type TextoColor = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'accent'",
    },
  ],
  /* R59 · el comentario JSX sin llaves (el caso real de D-882) + un
     comentario BIEN escrito (con llaves) y un `<Texto>` con contenido
     legítimo: los dos últimos son el peso de la prueba (L-236) — si la
     regla los contara, gritaría en cada archivo de la casa.
     ⚠️ El fixture vive en una CADENA y no en un comentario a propósito:
     escribir el ejemplo bien formado adentro de un bloque `/* … *``/`
     lo cierra en el medio. Me pasó al escribir esta misma regla. */
  R59: [
    {
      path: 'packages/ui/src/gallery/X.tsx',
      src:
        '<View>\n' +
        '  {' + '/* comentario BIEN escrito, con llaves */' + '}\n' +
        '  <Texto variante="apoyo">esto SI se muestra, y es legitimo</Texto>\n' +
        '  ' + '/* comentario SIN llaves — el defecto */' + '\n' +
        '</View>',
    },
  ],
  /* R62 · CUATRO montajes sobre su baseline de 3, y con las dos trampas
     REALES del árbol adentro: la CLAVE DE ARGUMENTO en la misma línea que
     un `<AvatarMascota>` (el `caraDeMascotaPorRuta({ especie: … })` de
     `disponibles.tsx`, que NO es un pase y mi propio grep contó mal antes
     de existir la regla) y la palabra en un comentario. Si midiera por
     línea o por palabra contaría 6 y el rojo saldría por la razón
     equivocada, que es tan caro como un verde. Trae su pieza para que el
     ancla no sea lo que lo pinta de rojo. */
  R62: [
    { path: 'packages/ui/src/components/AvatarMascota.tsx', src: 'especie?: AvatarMascotaEspecie' },
    {
      path: 'apps/cliente/src/app/a.tsx',
      src:
        '<AvatarMascota nombre={n} especie={e} />\n'.repeat(16) +
        '<AvatarMascota nombre={n} fotoUrl={caraDeMascotaPorRuta({ especie: p.especie, rutaImagen: r })} />\n' +
        '/* la lapida de especie={x} */',
    },
  ],
  /* R60 · el exterior con `alignSelf` puesto fuera de `bloque` — el
     defecto exacto. Trae el `bloque ? …` para que la regla tenga que
     distinguir la rama legítima y no gritar por la palabra suelta. */
  R60: [
    {
      path: 'packages/ui/src/components/Boton.tsx',
      src: "  return (\n    <View style={bloque ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }}>\n",
    },
  ],
  /* R48 · las 5 del baseline + UNA sexta. Y trae además una LÁPIDA de
     `Campo` —la palabra suelta en un comentario— que NO debe contarse:
     el fixture prueba que la regla mide `variante="…"` y no la palabra. */
  R48: [
    { path: 'apps/cliente/src/app/a.tsx', src: '<Boton variante="sinCaja" />\n'.repeat(3) },
    { path: 'apps/prestador/src/app/b.tsx', src: '<Boton variante="sinCaja" />\n'.repeat(2) },
    { path: 'packages/ui/src/components/Campo.tsx', src: '/* sinCaja MURIO, derogada por N11 */' },
    { path: 'apps/cliente/src/app/nueva.tsx', src: '<Boton variante="sinCaja" etiqueta="x" />' },
    /* S103-B · una pieza SANA de ui, para que el ancla del brazo nuevo no
       sea lo que pinta este fixture: el rojo tiene que seguir siendo el
       del contador de `apps/`, que es lo que este fixture vino a probar. */
    { path: 'packages/ui/src/components/PiezaSana.tsx', src: '<Boton variante="secundario" />' },
  ],
  /* R47 · el fixture trae las 39 del baseline repartidas + UNA
     cuadragésima. Lo único que tiene que salir rojo es la que sube el
     contador; y el ancla no puede ser lo que lo pinta porque hay usos
     de sobra. */
  R47: [
    { path: 'apps/prestador/src/app/a.tsx', src: '<Boton variante="compacto" />\n'.repeat(20) },
    { path: 'apps/cliente/src/app/b.tsx', src: '<Boton variante="compacto" />\n'.repeat(19) },
    { path: 'apps/prestador/src/app/nueva.tsx', src: '<Boton variante="compacto" etiqueta="Ver completo" />' },
    /* S103-B · igual que en R48: una pieza sana de ui satisface el ancla
       del brazo nuevo, así el único rojo sigue siendo el que sube el
       contador de `apps/`. Sin ella, este fixture pasaría a salir rojo
       por DOS razones y dejaría de discriminar cuál. */
    { path: 'packages/ui/src/components/PiezaSana.tsx', src: '<Boton variante="secundario" />' },
  ],
  /* R46 · TRES casos, y las dos legítimas son el peso de la prueba
     (L-236): la que COMPONE el selector · la que MUESTRA y lo declara ·
     y la que pide el WhatsApp sin selector y sin declarar, que es el
     único rojo. Los dos primeros alcanzan además para que el ANCLA no
     sea lo que lo pinta. */
  R46: [
    { path: 'apps/prestador/src/app/ventas/compone.tsx', src: 'repartidorWhatsapp\n<ControlTelefono label={x} />' },
    { path: 'apps/prestador/src/app/ventas/muestra.tsx', src: '/* El WhatsApp del repartidor acá no se captura: solo se muestra\n   para poder llamarlo. */\nrepartidorWhatsapp' },
    { path: 'apps/prestador/src/app/ventas/pela.tsx', src: 'repartidorWhatsapp\n<Campo label={x} />' },
  ],
  /* R45 · TRES casos, y los dos legítimos son el peso de la prueba
     (L-236): monta · declara · y la que hace ninguna de las dos, que es
     el único rojo. Trae además la frontera para que el ANCLA no sea lo
     que lo pinta. */
  R45: [
    { path: 'packages/api/src/wrappers/despensa-vendedor.ts', src: 'export async function listarPedidosDelVendedorEnRango(' },
    { path: 'packages/api/src/index.ts', src: '  listarPedidosDelVendedorEnRango,' },
    { path: 'apps/prestador/src/app/monta.tsx', src: 'listarPedidosDelVendedorEnRango(x)\nconst { delRango, sinFecha } = r.data' },
    { path: 'apps/prestador/src/app/declara.tsx', src: '/* Los `sinFecha` NO se montan acá: un vivo sin día no es pasado.\n   Los monta la ventana del presente. */\nlistarPedidosDelVendedorEnRango(x)' },
    { path: 'apps/prestador/src/app/muda.tsx', src: 'listarPedidosDelVendedorEnRango(x)' },
  ],
  /* R44 · el fixture trae los SEIS diccionarios (si no, el ancla es lo
     que lo pone rojo) con las 6 del baseline repartidas + UNA séptima.
     Lo que tiene que salir rojo es la voz nueva. */
  /* R44 · el fixture trae 40 archivos (el ancla) con las 9 del baseline
     repartidas + UNA décima. Lo rojo tiene que ser la voz nueva. Y trae
     además DOS legítimas —con oración previa que nombra la falla— para
     que el fixture pruebe que el net DISCRIMINA, no solo que dispara. */
  R44: [
    { path: 'apps/prestador/src/i18n/es.ts', src: Array(3).fill("      x: 'Revisa los datos de la nota.'").join('\n') },
    { path: 'apps/prestador/src/i18n/en.ts', src: Array(3).fill("      x: 'Check the details and try again.'").join('\n') },
    { path: 'packages/api/src/wrappers/a.ts', src: Array(3).fill("  datos_invalidos: 'Revisá los datos.',").join('\n') },
    { path: 'packages/api/src/wrappers/legitimas.ts', src: "  a: 'Una de las vacunas del carnet no es válida. Revisá los datos e intentá de nuevo.',\n  b: 'No pudimos guardar la foto. Revisa tu conexión y prueba de nuevo.',"  },
    { path: 'apps/cliente/src/i18n/es.ts', src: "      y: 'Algo salió mal.'" },
    ...Array.from({ length: 35 }, (_, i) => ({ path: `(relleno-${i}).ts`, src: '' })),
  ],
  R43: {
    palette: [
      "  papelTapiz: '#FAF2F5',",
      "  tapizDark: '#0D050D',",
      "  memorialDark0: '#0A0E0A',",
      "  campoBordeL: '#E3E0EF',", // 1.18 contra el tapiz — LA FLOJA
      "  campoBordeD: '#62627A',",
      "  campoBordeM: '#5A695A',",
    ].join('\n'),
  },
  R42: [
    { path: 'packages/ui/src/components/HojaCaptura.tsx', src: 'capturarConCamara(); capturarDeGaleria()' },
    ...[...BASELINE_R42].map((path) => ({ path, src: 'capturarConCamara(); capturarDeGaleria()' })),
    { path: 'apps/prestador/src/app/puerta-nueva.tsx', src: 'capturarConCamara(o); capturarDeGaleria(o)' },
  ],
  R41: [
    { path: 'packages/ui/src/components/Sana1.tsx', src: 'useReducedMotion(); withSpring(0)' },
    { path: 'packages/ui/src/components/Sana2.tsx', src: 'useReducedMotion(); withRepeat(x)' },
    { path: 'packages/ui/src/components/Sana3.tsx', src: 'useReducedMotion(); FadeInDown.duration(1)' },
    { path: 'packages/ui/src/components/Sana4.tsx', src: 'useReducedMotion(); withTiming(1); transform: [{ scale: 1 }]' },
    // el fundido puro: MUEVE nada — `withTiming` sobre opacity, cero
    // transform. NO debe exigir el hook (es el caso VisorFoto).
    { path: 'packages/ui/src/components/Fundido.tsx', src: 'withTiming(1); opacity: v.value' },
    { path: 'packages/ui/src/components/Descubierta.tsx', src: 'withSpring(0, { dampingRatio: 0.85 })' },
  ],
  R40: [
    { path: 'apps/cliente/src/i18n/es.ts', src: '    unoPENDIENTE:\n    dosPENDIENTE:' },
    { path: 'apps/cliente/src/i18n/en.ts', src: '    unoPENDIENTE:\n    dosPENDIENTE:' },
    { path: 'apps/prestador/src/i18n/es.ts', src: '' },
    { path: 'apps/prestador/src/i18n/en.ts', src: '' },
  ],
  R36: [...RELLENO_APPS, { path: '(fixture)', src: Array(BASELINE_R36 + 1).fill('paddingTop: 13').join('\n') }],
  R37: [...RELLENO_APPS, { path: '(fixture)', src: Array(BASELINE_R37 + 1).fill('borderRadius: 999').join('\n') }],
  R38: [
    ...RELLENO_APPS,
    ...Array.from({ length: BASELINE_R38 + 1 }, (_, i) => ({
      path: `(fixture-sep-${i})`,
      src: Array(PRESUPUESTO_SEPARADORES + 1).fill('<Separador />').join('\n'),
    })),
  ],
  R39: [
    ...RELLENO_APPS,
    ...Array.from({ length: BASELINE_R39 + 1 }, (_, i) => ({
      path: `(fixture-size-${i})`,
      src: 'size.xs\nsize.sm\nsize.base\nsize.md',
    })),
  ],
  R3: [{ path: '(fixture)', src: '<Tarjeta elevacion="flotante">' }],
  R4: [{ path: '(fixture)', src: "style={{ shadowColor: '#000000', shadowOpacity: 0.5 }}\nstyle={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}" }],
  R5: [{ path: '(fixture)', src: 'style={{ backgroundColor: theme.accent.cta }}\n<ThemeProvider cta="oficio">' }],
  R6: [{ path: '(fixture)', src: '<KeyboardAvoidingView behavior="padding">' }],
  R29: [{ path: '(fixture)', src: '<Campo label="Tel" sinPie />' }],
  /* R34: el bug del 9-ago, en tres líneas — la decisión por largo sin fase.
     Su hermano sano (`fase === 'listo' && x.length === 0`) NO debe salir rojo,
     y eso lo prueba el repo real: las cuatro pantallas de índice lo usan. */
  R34: [{ path: '(fixture)', src: "const elegibles = ofrecibles(mascotas, faseEspecies);\nif (elegibles.length === 0) { setSinElegibles(true); return; }" }],
  R7: [{ path: '(fixture)', src: Array(BASELINE_FADEIN + 1).fill('entering={FadeInDown}').join('\n') }],
  R8: [{ path: '(fixture)', src: '<Entrada><EstadoVacio titulo="x" /></Entrada>\n<Animated.View entering={FadeIn}><EstadoVacio titulo="y" /></Animated.View>' }],
  R10: [{ path: 'apps/cliente/src/app/otra-pantalla.tsx', src: '/** @override-s82c — copia ilegal */' }],
  R11: [{ path: '(fixture)/es.ts', src: "    vozCardM3: '{{nombre}} completó el 60% de su nivel — ¡sigue la racha!'," }],
  R12: [{ tema: 'light', clase: 'texto', nombre: '(fixture)', ratio: 2.0, minimo: 4.5 }],
  R13: [{ path: '(fixture)', src: '<Pressable style={{ borderWidth: 1.5, borderColor: theme.border.default }}>' }],
  R14: [{ path: 'x/hogar/index.tsx', src: 'const RESPIRO_BANDA = spacing[8];\nconst SOLAPE_RECO = spacing[14];' }],
  R15: [{ tema: 'light', ruta: '(fixture)', valor: '#0F5E56' }],
  // tinte ENCENDIDO y ningún override en lightOficio = el caso que la
  // regla existe para atrapar.
  R20: [{ path: '(fixture)', src: 'style={{ backgroundColor: theme.status.warning }}' }],
  R17: { index: "export { PiezaFantasma } from './components/PiezaFantasma'", galeria: '' },
  // S83-B7 · el ancla prueba SOLO el brazo de la entrada ausente. El de
  // __DEV__ va en EXTRAS_BRAZOS: ensanchar este string encendía los dos y
  // ninguno quedaba probado por separado — medido, no supuesto.
  R18: [{ ruta: '(fixture)', src: '<CeldaNavegacion titulo="Preferencias" onPress={() => router.push("/cuenta/preferencias")} />' }, { ruta: '(fixture2)', src: 'router.push("/gallery")' }],
  // el pleno que ignora a sus hermanos: exactamente mi defecto de r11
  // la marca anidada adentro de la placa: el defecto que se ve como layout
  // S83-B3 · el fixture trae la MITAD CLARA SANA a propósito, para que el
  // rojo solo pueda venir de la oscura — el precedente de R24, dos entradas
  // más abajo: una prueba que pasa por el motivo equivocado no prueba la
  // regla que dice probar. (El brazo claro y el de los hexes iguales tienen
  // su rojo en EXTRAS_R16: ningún fixture único puede encender los tres.)
  // S83-B6 · lightOficio SIN pisar control (darkOficio sano a propósito:
  // el rojo tiene que venir del brazo que se prueba, no del otro).
  // S83-B13 · lightOficio sin pisar active (darkOficio sano): el rojo
  // viene del brazo que se prueba y no del otro.
  R27: {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, control: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, active: palette.teal },\n}',
  },
  R16: {
    palette: "light0: '#FAF9F7',\npapelTapiz: '#FAF2F5',\npapelTapizOficio: '#F4F8F6',\ndark0: '#050508',\ntapizDark: '#0D050D',\ntapizDarkOficio: '#080D0E',",
    temas:
      'const lightOficio: Theme = { ...lightTheme,\n  bg: { ...lightTheme.bg, base: palette.light0 },\n}\n' +
      'const darkOficio: Theme = { ...darkTheme }',
  },
  // el pie a mano en una pantalla de explorar que NO está en el baseline
  // el fixture trae los CUATRO oficios para que el ancla NO sea lo que
  // lo pone rojo: lo que tiene que salir roja es la copia, y una prueba
  // que pasa por el motivo equivocado no prueba la regla que dice probar
  R25: [
    { path: 'packages/ui/src/brand/MarcaEleccion.tsx', src: "transform: [{ rotate: '-14deg' }]" },
    { path: 'apps/cliente/src/(fixture)/OtraPata.tsx', src: "transform: [{ rotate: '-14deg' }]" },
  ],
  R30: FIXTURE_R30,
  R32: [{
    path: '(fixture)/esquina.tsx',
    src: `
      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <Pressable hitSlop={10}><Icono nombre="campana" tinta={t} /></Pressable>
        <Pressable hitSlop={10}><Destello /></Pressable>
      </View>`,
  }],
  R33: [{
    path: '(fixture)/campana-sin-superficie.tsx',
    src: '<Badge n={3} forma="huella"><Icono nombre="campana" tinta={t} /></Badge>',
  }],
  R24: [
    ...OFICIOS_R24.map((o) => ({ path: `apps/cliente/src/app/(tabs)/explorar/${o}/index.tsx`, src: '' })),
    {
      path: 'apps/cliente/src/app/(tabs)/explorar/(fixture)/index.tsx',
      src: 'paddingBottom: Math.max(insets.bottom, spacing[4]),\nborderTopWidth: 1,',
    },
  ],
};

/** R32 · LA ESQUINA COMPARTIDA — los 20dp de la lámina (S88-B; lámina
 *  `LAMINA_ESQUINA_CAMPANA.md`, número CONGELADO por el founder: 20dp de
 *  separación mínima entre zonas táctiles, CON GUARD).
 *
 *  POR QUÉ ESTE NÚMERO ES EL ÚNICO DE SU LÁMINA CON GUARD, y ordena la
 *  forma de la regla: el truncado, el contraste y el tamaño SE VEN en
 *  una captura — la separación de zonas táctiles NO. Con hitSlop 10 a
 *  cada lado y separación 8dp hay 12dp de solape ambiguo que ninguna
 *  captura muestra: solo aparece cuando un dedo real cae en la banda
 *  compartida, abre lo que no era, **y la persona cree que se equivocó
 *  ella**. Es el defecto silencioso perfecto (familia L-192).
 *
 *  LA LLAVE LA ESCRIBIÓ LA PROPIA LÁMINA: la campana va INLINE, jamás
 *  absoluta — *"la separación se vuelve un gap que el guard puede
 *  leer"*. Esta regla es la otra mitad de ese trato: si la separación
 *  no es legible estáticamente, el guard no la da por buena — sale ROJO
 *  pidiendo que se declare (L-197: «no pude medir» jamás degrada a
 *  verde).
 *
 *  LA ARITMÉTICA, mecanizada y no copiada: el 20 de la lámina es
 *  10+10 — los hitSlop de los DOS vecinos. La regla no fija 20: exige
 *  gap ≥ 2 × el hitSlop MÁS GRANDE de la ventana (default 10 si no hay
 *  ninguno declarado) — si alguien sube un hitSlop a 14, el mínimo pasa
 *  a 28 solo, sin esperar que alguien recuerde la cuenta.
 *
 *  ALCANCE DECLARADO (en la salida, como los demás):
 *   · dispara sobre archivos de apps que MONTAN el glifo `campana` —
 *     hoy CERO (C y D construyen contra esto): el conteo se imprime
 *     para que el silencio diga «nadie montó», no «no miré»;
 *   · la VENTANA sigue siendo ±25 líneas para el gap y el ABSOLUTO (son
 *     geometría de la FILA, y la convención de extraer la fila ya rige),
 *     pero el brazo del hitSlop dejó de ser ciego al otro lado de la
 *     extracción (S89-B): los componentes referenciados en la ventana se
 *     RESUELVEN por el árbol de montaje (`lib-arbol-montaje.mjs` — mismo
 *     archivo o un salto de import, `@epetplace/ui` incluido) y sus
 *     hitSlop NUMÉRICOS entran al mínimo. Un `hitSlop={expr}` no es
 *     legible estáticamente y NO baja el mínimo — límite declarado;
 *   · la HUELLA-NOVEDAD del Badge NO es zona táctil (mismo Pressable,
 *     oculta de a11y) — el gap de la lámina mide HERMANOS y la enmienda
 *     pata-pisa (S89 orden 7: superpuesta, `right:0`) la metió entera al
 *     glifo: ya ni asoma tinta al gap. Cero brazos nuevos.
 *   · NO mide punta a punta del render (eso es el gate en dispositivo
 *     con el nombre largo y en inglés — la otra línea de la lámina).
 *
 *  ☠️ CONDICIÓN DE MUERTE: si la esquina gana su propia PIEZA en
 *  packages/ui (la banda del techo con el gap adentro, estilo FilaCita
 *  — cero API de geometría), esta regla se angosta a «las apps usan la
 *  pieza» o se retira con lápida. */
const VENTANA_R32 = 25;
const GAP_MINIMO_R32 = 20; // el número congelado de la lámina (10+10)
/** spacing keys cuyo valor alcanza N dp (los tokens legales para el gap). */
const SPACING_R32 = { 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128 };

/** El árbol de montaje para el brazo del hitSlop (S89-B) — se construye UNA
 *  vez y SOLO tras pasar su auto-prueba: un grafo que no prueba su regla
 *  no aporta mínimos (L-197). Si la auto-prueba falla, r32 lo dice en ROJO
 *  en vez de medir con menos. */
let _arbolR32 = null;
function arbolR32() {
  if (_arbolR32 === null) {
    const fallas = autoPruebaArbol();
    _arbolR32 = fallas.length > 0 ? { roto: fallas } : { arbol: construirArbol() };
  }
  return _arbolR32;
}

function r32(archivos) {
  const fallos = [];
  let montajes = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    if (!/nombre=["']campana["']/.test(limpio)) continue;
    const lineas = limpio.split('\n');
    lineas.forEach((linea, i) => {
      if (!/nombre=["']campana["']/.test(linea)) return;
      montajes++;
      const ventana = lineas.slice(Math.max(0, i - VENTANA_R32), i + VENTANA_R32).join('\n');

      // ① INLINE, jamás absoluta — la condición que vuelve legible al resto
      if (/position:\s*['"]absolute['"]/.test(ventana)) {
        fallos.push(
          `${path}:${i + 1} — la campana convive con \`position: 'absolute'\` en su ventana (±${VENTANA_R32}): la lámina la manda INLINE, jamás absoluta — el texto no sabe que un absoluto está ahí, y la separación deja de ser legible`,
        );
      }

      // ② el mínimo REAL: 2 × el hitSlop más grande de la ventana (default 10)
      // hitSlop en sus DOS ropas — `hitSlop: 10` (objeto de estilo/props) y
      // `hitSlop={10}` (attr JSX). El brazo nació mirando solo la primera y
      // el barrido por-brazo lo cazó MUDO: con la ropa JSX el mínimo se
      // quedaba en 20 y un hitSlop de 14 pasaba sin subirlo a 28.
      const slops = [...ventana.matchAll(/hitSlop[:=]\s*\{?\s*(\d+)/g)].map((m) => Number(m[1]));
      // ②bis (S89-B) — los hitSlop que viven DENTRO de vecinos EXTRAÍDOS
      // (p. ej. `IdentidadDelTecho`): la ventana no los veía; el árbol de
      // montaje los resuelve. Sobre paths de fixture el árbol no tiene
      // nodo y devuelve vacío — los fixtures no cambian de veredicto.
      const estadoArbol = arbolR32();
      let fuentesVecinos = [];
      if (estadoArbol.roto !== undefined) {
        fallos.push(
          `${path}:${i + 1} — el árbol de montaje NO pasó su auto-prueba y el mínimo del hitSlop quedaría medido DE MENOS: ${estadoArbol.roto[0]} (L-197: no se mide con un instrumento roto)`,
        );
      } else if (!estadoArbol.arbol.archivos.has(path) && existsSync(path)) {
        // EL ANCLA del brazo (L-192): un archivo REAL que el árbol no
        // conoce = las convenciones de path divergieron y ②bis estaría
        // devolviendo vacío para TODO — la ceguera vieja con ropa nueva.
        // (Los paths de fixture no existen en disco y quedan fuera.)
        fallos.push(
          `${path}:${i + 1} — el árbol de montaje NO conoce este archivo real: el brazo del hitSlop de vecinos está midiendo DE MENOS en silencio (¿divergieron las raíces o la forma de los paths?)`,
        );
      } else {
        const vecinos = hitSlopsVecinos(estadoArbol.arbol, path, ventana);
        slops.push(...vecinos.valores);
        fuentesVecinos = vecinos.fuentes;
      }
      const minimo = Math.max(GAP_MINIMO_R32, 2 * Math.max(10, ...(slops.length ? slops : [10])));

      // ③ la separación LEGIBLE: gap por token de spacing en la ventana
      const gaps = [...ventana.matchAll(/gap:\s*spacing\[(\d+(?:\.\d+)?)\]/g)].map((m) => SPACING_R32[m[1]] ?? 0);
      const mayor = gaps.length ? Math.max(...gaps) : null;
      if (mayor === null) {
        fallos.push(
          `${path}:${i + 1} — la campana está montada y su ventana (±${VENTANA_R32}) NO declara ningún \`gap: spacing[...]\`: la separación de zonas táctiles no es legible estáticamente, y este es el único número de su lámina que NO se ve en una captura (L-197: sin medir no hay verde — declarala como gap en la fila que la porta, spacing[5]+)`,
        );
      } else if (mayor < minimo) {
        fallos.push(
          `${path}:${i + 1} — el gap de la esquina es ${mayor}dp y el mínimo es ${minimo}dp (2 × hitSlop ${Math.max(10, ...(slops.length ? slops : [10]))}): dos zonas táctiles a menos de eso se pisan, el toque abre lo que no era y la persona cree que se equivocó ella (lámina de la esquina, número congelado)${fuentesVecinos.length > 0 ? ` · hitSlop resuelto por árbol: ${fuentesVecinos.join(' · ')}` : ''}`,
        );
      }
    });
  }
  return {
    fallos,
    info: `${montajes} montaje(s) de campana en apps (las esquinas vivas de C y D) · ventana ±${VENTANA_R32} (gap/absoluto) · mínimo 2×hitSlop con vecinos EXTRAÍDOS resueltos por árbol de montaje (S89-B, piso ${GAP_MINIMO_R32})`,
  };
}

/** R33 · LA SUPERFICIE DE LA HUELLA SE DECLARA (S89 — nacida del defecto
 *  REAL que el paquete del gate censó y la orden 2 mandó curar:
 *  `techo-oficio.tsx` montaba `forma="huella"` SIN `superficie`, y en el
 *  prestador claro `accent.active` ES el hex del muro (tealDark ≡
 *  tealDark, 1.00) — **la huella era invisible exactamente en su lugar
 *  firmado, y el olvido no rompía nada ni se veía** (familia L-192; en
 *  oscuro se salvaba de rebote, por eso ningún ojo lo vio).
 *
 *  LA REGLA: en APPS, todo montaje de `forma="huella"` DECLARA su
 *  `superficie` — `"muro"` sobre el techo saturado · `"clara"` A
 *  PROPÓSITO sobre papel. El default de la pieza queda para la galería y
 *  los usos internos de ui (fuera de este corpus a propósito): lo que
 *  esta regla mata es el DEFAULT SILENCIOSO en una pantalla, que es
 *  exactamente el olvido que no se ve.
 *
 *  LÍMITE DECLARADO: lee el span del tag hasta su primer `>` — un
 *  atributo con `=>` adentro lo truncaría (hoy: cero casos en los dos
 *  montajes vivos).
 *
 *  ☠️ CONDICIÓN DE MUERTE: si `Badge` vuelve `superficie` OBLIGATORIA en
 *  el tipo cuando `forma="huella"`, el tsc cubre esto y la regla se
 *  retira con lápida. */
function r33(archivos) {
  const fallos = [];
  let montajes = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    for (const m of limpio.matchAll(/<Badge\b[^>]*forma=["']huella["'][^>]*>/g)) {
      montajes++;
      if (!/\bsuperficie\s*=/.test(m[0])) {
        const linea = limpio.slice(0, m.index).split('\n').length;
        fallos.push(
          `${path}:${linea} — \`forma="huella"\` SIN \`superficie\` declarada: el default 'clara' pinta accent.active, que sobre el muro claro del prestador ES el hex del muro — la huella desaparece en su lugar firmado y nada lo dice (el defecto real que la orden 2 de S89 curó; declarála: "muro" sobre el techo saturado, "clara" a propósito sobre papel)`,
        );
      }
    }
  }
  return {
    fallos,
    info: `${montajes} montaje(s) de forma="huella" en apps — la superficie se DECLARA (el default silencioso mató una huella en S89)`,
  };
}

/**
 * R34 (S92-BIS) — UNA LISTA DE TRES ESTADOS NO SE DECIDE POR EL LARGO.
 *
 * ── QUÉ LA PARIÓ, con su fecha ──────────────────────────────────────────────
 * El 9-ago-2026 el founder no pudo reservar un paseo: el último paso le decía
 * *«tu hogar todavía no tiene un perro registrado»* **con dos perros vivos
 * adentro**. El motor estaba sano —el guard `mascota_no_elegible` devolvía
 * `true`— y los permisos intactos. Lo que fallaba era la PANTALLA:
 *
 *   `ofrecibles()` devuelve `[]` en TRES situaciones distintas —«todavía no
 *   llegó el catálogo», «no pudo llegar» y «llegó y no hay perros»— y
 *   `elegibles.length === 0` **las confunde a las tres**, así que a dos de
 *   ellas les contestaba una frase falsa.
 *
 * ── POR QUÉ ESTE LINT Y NO UNA LEY ESCRITA ──────────────────────────────────
 * **La advertencia YA ESTABA ESCRITA**, en el header de la lib que ese mismo
 * archivo importa: *«la pantalla distingue ese vacío del vacío real mirando la
 * fase, jamás el largo: "no tenés mascotas elegibles" y "todavía no sé" son dos
 * frases distintas y una de las dos sería mentira»*. Cuatro pantallas la
 * cumplieron y una no, y **nada lo detectó durante meses**. *Una ley sin
 * instrumento se olvida — y ésta ya se olvidó una vez.*
 *
 * ── ALCANCE, declarado ──────────────────────────────────────────────────────
 * Vigila la familia donde el defecto MORDIÓ: el resultado de `ofrecibles(...)`.
 * No intenta cazar toda lista vacía del repo —eso da falsos positivos y un lint
 * que grita de más se apaga—. La clase completa queda censada en la deuda.
 */
function r34(archivos) {
  const fallos = [];
  let decisiones = 0;
  for (const { path, src } of archivos) {
    const nombres = [...src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*ofrecibles\s*\(/g)].map((m) => m[1]);
    if (nombres.length === 0) continue;

    /**
     * ⚠️ SE RECORRE EL ARCHIVO ORIGINAL, LÍNEA POR LÍNEA, y no el texto sin
     * comentarios. La v1 decidía sobre `sinComentarios(src)` y NUMERABA sobre
     * ese mismo texto: como quitar comentarios CORRE las líneas, los seis
     * primeros hallazgos apuntaron a líneas que no eran (una señalaba un
     * `conFoto.length > 0` inocente). *Un lint que manda a mirar el lugar
     * equivocado gasta la confianza que necesita para que lo miren.*
     */
    const lineas = src.split('\n');
    let enBloque = false;
    for (let i = 0; i < lineas.length; i++) {
      const cruda = lineas[i];
      const t = cruda.trim();
      if (enBloque) {
        if (t.includes('*/')) enBloque = false;
        continue;
      }
      if (t.startsWith('/*')) {
        if (!t.includes('*/')) enBloque = true;
        continue;
      }
      if (t.startsWith('//') || t.startsWith('*')) continue;

      for (const nombre of nombres) {
        /**
         * SOLO «no hay ninguno»: `=== 0` y `< 1`. La v2 incluía `=== 1` y
         * marcó como fallo un `if (elegibles.length === 1) elegirSola()`, que
         * es **sano**: preguntar «¿hay exactamente una?» no afirma ausencia, y
         * si la fase no llegó la lista está vacía y ese `if` simplemente no
         * entra. *Un lint que marca lo correcto enseña a ignorarlo.*
         */
        const re = new RegExp(`(^|[^.\\w])${nombre}\\.length\\s*(===\\s*0|<\\s*1)\\b`);
        if (!re.test(cruda)) continue;
        decisiones++;
        // la fase tiene que estar en la MISMA sentencia…
        const enLinea = /\.fase\s*(===|!==)|'listo'|'cargando'|'error'/.test(cruda);
        // …o en un guard que corta ANTES, en las 12 líneas previas
        const previas = lineas.slice(Math.max(0, i - 12), i).join('\n');
        const enGuard = /\.fase\s*(===|!==)\s*'(cargando|error|listo)'/.test(previas);
        if (!enLinea && !enGuard) {
          fallos.push(
            `${path}:${i + 1} — decide sobre \`${nombre}\` por el LARGO y sin mirar la FASE: \`ofrecibles()\` devuelve [] mientras carga, si falla Y si de verdad no hay — las tres cosas no se le dicen igual a una persona (el 9-ago esto le dijo al founder que no tenía perros, con dos perros vivos)`,
          );
        }
      }
    }
  }
  /* ═══ BRAZO B (S92-BIS, 9-ago — EL P0 REABIERTO) ════════════════════════
   *
   * ⚠️ ESTE BRAZO EXISTE PORQUE EL BRAZO A NO ALCANZÓ, y la prueba es que
   * **el bug volvió con la cura puesta y publicada**. El brazo A vigila el
   * resultado de `ofrecibles()`; el defecto se mudó **un piso más arriba**, a
   * la lista que ALIMENTA a `ofrecibles`:
   *
   *   const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);   // ← []
   *   const estado = await getEstadoOnboardingDueno();
   *   if (!vigente || !estado.ok || !estado.data.familia_id) return;    // ← mudo
   *   const r = await obtenerMascotasDeFamilia(...);
   *   if (!vigente || !r.ok) return;                                    // ← mudo
   *   setMascotas(r.data);
   *
   * Si cualquiera de esos `return` dispara, la lista queda en `[]` **para
   * siempre y sin decir nada**. Y como el catálogo es público y rápido, la
   * fase llega a `listo` igual ⇒ el brazo A ve un guard de fase correcto y
   * pasa, mientras la pantalla afirma que el hogar no tiene perros.
   *
   * ── LA REGLA, dicha en una línea ─────────────────────────────────────────
   * **Una lista que se llena desde la red no puede arrancar en `[]`**: tiene
   * que modelar sus tres estados, como ya hace `paseo/index.tsx`
   * (`useState<T[] | 'cargando' | 'error'>('cargando')`).
   *
   * ── EL ALCANCE, ACOTADO A PROPÓSITO Y CON SU MEDICIÓN ────────────────────
   * La v1 de este brazo marcaba **toda** lista de red que arrancara en `[]`, y
   * al correrla dio **31 fallos en las dos apps**. Ese número es un dato y va
   * a deuda —la clase es ancha de verdad—, pero **no puede ser el lint**: la
   * mayoría no es el defecto (un autocomplete de direcciones que arranca vacío
   * es correcto), y *un lint que enciende 31 rojos de golpe se apaga, y un lint
   * apagado no protege nada*. Es la misma trampa que el header del brazo A ya
   * nombra.
   *
   * Así que vigila **la familia donde el vacío se convierte en una AFIRMACIÓN
   * sobre el hogar de alguien**: las listas que se llenan con
   * `obtenerMascotasDeFamilia`. Ahí el `[]` no es «no muestro nada» — es *«no
   * tenés un perro registrado»*, dicho a alguien que tiene dos.
   *
   * El escape es explícito y barato: que el fallo TENGA VOZ. Vale
   * `setX('error')` (las fases) o un registro de fallo que la pantalla pinte
   * —`sumarFallo(...)`, como ya hace `hogar/adiestramiento.tsx`—. La regla no
   * exige una forma: exige que el fallo se pueda decir. */
  let listasDeHogar = 0;
  for (const { path, src } of archivos) {
    /* ⚠️ SE ATA LA LISTA A SU FUENTE, y no alcanza con que el archivo mencione
       el lector. La v2 marcaba cualquier lista vacía de un archivo que
       nombrara `obtenerMascotasDeFamilia`, y encendió `ofertaPublica` y
       `vocabulario` —dos listas que no son de mascotas— en pantallas sanas.
       *Dos falsos positivos alcanzan para que nadie vuelva a leer el lint.*
       Ahora se captura la variable que RECIBE la respuesta y solo se acusa al
       setter que se llena con ella. */
    /* Y además PROXIMIDAD, porque atar por nombre tampoco alcanzó: `r` es un
       nombre universal, y `setOfertaPublica(r.data)` de un `.then((r) => …)`
       en la línea 96 se leía como si viniera del `await` de la 136 — otro
       scope, otra pantalla, rojo falso. Se exige que el `setX(<var>.data)`
       viva DENTRO de las 15 líneas siguientes al await, que es el alcance real
       de ese bloque. */
    const lineasArchivo = src.split('\n');
    const receptoras = [];
    for (let i = 0; i < lineasArchivo.length; i++) {
      const m = /(?:const|let)\s+(\w+)\s*=\s*await\s+obtenerMascotasDeFamilia\s*\(/.exec(lineasArchivo[i]);
      if (m !== null) receptoras.push({ nombre: m[1], cerca: lineasArchivo.slice(i, i + 15).join('\n') });
    }
    if (receptoras.length === 0) continue;
    // `const [X, setX] = useState<...[]>([])` — lista que nace vacía
    for (const m of src.matchAll(/const\s*\[\s*(\w+)\s*,\s*(set\w+)\s*\]\s*=\s*useState<[^>]*\[\]>\(\[\]\)/g)) {
      const [, nombre, setter] = m;
      // ¿se llena con la respuesta DE ESE lector? (`setX(r.data)` con r = await …)
      const seLlenaDelHogar = receptoras.some((r) =>
        new RegExp(`${setter}\\(\\s*(?:\\w+\\.ok\\s*\\?\\s*)?${r.nombre}\\.data\\b`).test(r.cerca),
      );
      if (!seLlenaDelHogar) continue;
      listasDeHogar++;
      /* ⚠️ `'error'` EN CUALQUIER PARTE DEL ARGUMENTO, y no pegado al paréntesis.
         La v3 exigía `setX('error'` literal y **no reconocía
         `setX(r.ok ? r.data : 'error')`** — que es el patrón canónico de la
         casa, el que usa `paseo/index.tsx` y el que se acaba de escribir en
         `disponibles.tsx`. *El guard habría marcado en rojo la pantalla que lo
         hace bien.* Lo destapó probar el brazo EN ROJO antes de confiar en él
         (L-216): con el fixture ya curado, la auto-prueba no gritó
         «decorativo» porque el fixture seguía fallando… por el motivo
         equivocado. */
      const tieneFases = new RegExp(`${setter}\\([^)]*'error'`).test(src);
      const tieneRegistroDeFallo = /sumarFallo\s*\(/.test(src);
      if (!tieneFases && !tieneRegistroDeFallo) {
        fallos.push(
          `${path} — \`${nombre}\` se llena con \`obtenerMascotasDeFamilia\` y arranca en \`[]\`, sin ningún \`${setter}('error')\` ni registro de fallo: si la lectura falla, la lista queda vacía EN SILENCIO y la pantalla lee ese vacío como «no tenés mascotas». Modelá las tres fases como \`paseo/index.tsx\`: \`useState<T[] | 'cargando' | 'error'>('cargando')\` (el 9-ago esto le dijo al founder que no tenía perros — DOS VECES, la segunda con la primera cura ya publicada)`,
        );
      }
    }
  }

  return {
    fallos,
    info: `${decisiones} decisión/es sobre el resultado de ofrecibles() + ${listasDeHogar} lista(s) del hogar que arrancan vacías — todas tienen que poder decir que fallaron`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   LAS CUATRO REGLAS DEL NORTE (S97+-B — mesa del 13-ago)

   POR QUÉ EXISTEN, y es la razón por la que se escriben ANTES de tocar
   una pantalla: el Norte tiene diez artículos y **cuatro son medibles
   por máquina** (el ritmo · el radio · el separador · la escala). Los
   otros seis son juicio. Mecanizar los cuatro es lo que permite que C y
   D construyan sin pedir gate por pieza: lo que un lint puede verificar
   va masivo y el founder NO lo mira (la regla de la mesa, S81).

   LOS CUATRO SON RATCHET, JAMÁS DUROS EN 0, y eso es una decisión con
   número: el corpus vivo tiene 36 espaciados crudos, 21 radios crudos,
   6 pantallas sobre el presupuesto de separadores y 6 sobre el de
   tamaños. Nacer en 0 pondría el hook en rojo para las tres pistas en
   pleno ciclo — y un guard que le frena el commit a todo el mundo se
   desarma el mismo día. Nacen en su número MEDIDO: lo viejo queda
   VISIBLE en cada corrida y **lo nuevo no puede entrar**.
   ═══════════════════════════════════════════════════════════════════ */

/** R36 · N2 · EL RITMO — el espaciado sale del TOKEN.
 *
 *  🔴 LO QUE ESTA REGLA **NO** MIDE, y es el hallazgo que la formó: el
 *  Norte dice *«todo espaciado múltiplo de 8 (4 solo para pares
 *  íntimos)»*, y **mecanizar eso literal pondría en rojo la escala
 *  firmada de la casa**: `spacing` tiene 4·6·10·12·20·28, todos legales
 *  y usadísimos desde v3.1. Un lint que exige múltiplos de 8 declara
 *  ilegal medio sistema de tokens.
 *
 *  ⇒ La regla mide lo que el Norte de verdad quiere y el token ya
 *  habilita: **que nadie re-decida el ritmo a mano.** Los números del
 *  Norte (32 entre secciones · 16 entre tarjetas · 16-20 de padding ·
 *  24 sobre el título) son EXACTAMENTE `spacing[8]`, `spacing[4]`,
 *  `spacing[4|5]` y `spacing[6]` — cumplir N2 y salir del token son la
 *  misma acción. El múltiplo de 8 gobierna la COMPOSICIÓN, que es
 *  juicio de gate; el crudo es lo mecanizable.
 *
 *  Se reporta APARTE el crudo que ni siquiera coincide con un valor de
 *  la escala: ése no es "el token escrito a mano", es un número
 *  inventado, y son dos defectos distintos. */
const VALORES_SPACING = new Set([0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128]);
const RE_ESPACIADO = /\b(padding|margin|gap|rowGap|columnGap)(?:Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)?\s*:\s*(\d+)\b/g;
function r36(archivos) {
  const fallos = [];
  let crudos = 0, fueraDeEscala = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    let enArchivo = 0;
    for (const m of limpio.matchAll(RE_ESPACIADO)) {
      const v = Number(m[2]);
      crudos++; enArchivo++;
      if (!VALORES_SPACING.has(v)) fueraDeEscala++;
    }
    if (enArchivo > 0) porArchivo.push(`${path}: ${enArchivo}`);
  }
  if (crudos > BASELINE_R36)
    fallos.push(
      `N2 (el ritmo): ${crudos} espaciado(s) con número crudo (baseline ${BASELINE_R36}) — el ritmo sale de \`spacing\`, jamás de un número por pantalla. Los valores del Norte YA son tokens: 32=spacing[8] · 24=spacing[6] · 16=spacing[4] · 20=spacing[5]:\n    ${porArchivo.join('\n    ')}`,
    );
  fallos.push(...ancla('R36', archivos.length, MINIMOS_CORPUS.apps, 'archivo(s) de apps'));
  return {
    fallos,
    info: `${crudos}/${BASELINE_R36} crudos · ${fueraDeEscala} fuera de la escala de \`spacing\`${crudos < BASELINE_R36 ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R37 · N4 · EL RADIO ÚNICO — una sola escala, la de `radius`.
 *
 *  LO QUE ENCONTRÓ AL MEDIRSE, antes de existir (por eso se mide antes
 *  de curar): **13 píldoras escritas `borderRadius: 999`** cuando el
 *  token de la casa es `radius.full` = **9999**. Las dos clampean igual
 *  y por eso nadie lo vio nunca — *el defecto no es visual, es que la
 *  píldora de la casa dejó de tener un solo dueño*. Y **8 valores que
 *  no existen en ninguna escala**: 2 · 5 · 22 · 36.
 *
 *  Los dos se cuentan APARTE a propósito. La píldora a mano es un token
 *  re-tecleado (cura mecánica, cero cambio visual); el 22 y el 36 son
 *  geometría inventada, y ésos SÍ cambian el dibujo al curarse ⇒ su
 *  cura es de gate, no de reemplazo. Un número que mezcla las dos
 *  esconde justo cuál se puede pagar barato. */
const VALORES_RADIUS = new Set([0, 4, 8, 10, 12, 16, 20, 24, 9999]);
const RE_RADIO = /\bborderRadius(?:TopLeft|TopRight|BottomLeft|BottomRight)?\s*:\s*(\d+)\b/g;
function r37(archivos) {
  const fallos = [];
  let crudos = 0, pildoraAMano = 0, inventados = 0;
  const porArchivo = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    let enArchivo = 0;
    for (const m of limpio.matchAll(RE_RADIO)) {
      const v = Number(m[1]);
      crudos++; enArchivo++;
      if (v >= 100) pildoraAMano++;
      else if (!VALORES_RADIUS.has(v)) inventados++;
    }
    if (enArchivo > 0) porArchivo.push(`${path}: ${enArchivo}`);
  }
  if (crudos > BASELINE_R37)
    fallos.push(
      `N4 (el radio único): ${crudos} borderRadius con número crudo (baseline ${BASELINE_R37}) — la casa tiene UNA escala de radios (\`radius\`): 4·8·10·12·16·20·24·full. La píldora es \`radius.full\` (9999), jamás un 999 tecleado:\n    ${porArchivo.join('\n    ')}`,
    );
  fallos.push(...ancla('R37', archivos.length, MINIMOS_CORPUS.apps, 'archivo(s) de apps'));
  return {
    fallos,
    // LOS 3 QUE QUEDAN ESTÁN IDENTIFICADOS UNO POR UNO — se nombran acá
    // para que nadie los vuelva a auditar desde cero cada vez que lea el
    // reporte: **1 es LETRA FIRMADA y 2 son decisión del founder.**
    //  · `hogar/index:1259` → 36 en un 112×112 con `borderCurve:
    //    continuous` = **el SQUIRCLE 32% firmado en S53** (36/112 =
    //    32,1%). NO es un desvío: es la ley aplicada, y por eso no se
    //    "cura". Vive acá porque el ratchet cuenta números crudos, no
    //    intenciones.
    //  · `mascotas:426` y `:480` → 2 en un 9×9. La escala salta de 0 a 4
    //    y en un cuadrado de 9px esa diferencia SE VE ⇒ decisión del
    //    founder, no reemplazo mecánico.
    info: `${crudos}/${BASELINE_R37} crudos · ${pildoraAMano} píldora(s) a mano (radius.full es 9999) · ${inventados} fuera de toda escala${crudos < BASELINE_R37 ? ' — BAJÓ: actualizar baseline' : ''} · los 3 del piso: 1 squircle FIRMADO (S53) + 2 esquinas de 9px a firma`,
  };
}

/** R38 · N3 · LA MUERTE DEL SEPARADOR — presupuesto de 3 por pantalla.
 *
 *  «Entre secciones separa el espacio + el título» (N3). La línea se
 *  reserva para listas densas de datos, y el Norte le pone número:
 *  **máximo 3 por pantalla**. Ese techo es lo mecanizable de N3 — que
 *  la línea sea "de lista densa" es juicio, y el juicio es de gate.
 *
 *  ⚠️ EL CORPUS EXCLUYE LA GALERÍA A PROPÓSITO: `TokenGallery` monta
 *  **16** separadores y está bien que lo haga — su trabajo es exhibir
 *  piezas en fila, no componer una pantalla de producto. Meterla al
 *  corpus daría un rojo permanente sobre el único archivo cuyo oficio
 *  es tener muchos de todo. (Es el mismo criterio con el que R35 mira
 *  la galería para el color y no para la composición.) */
function r38(archivos) {
  const fallos = [];
  const excedidas = [];
  for (const { path, src } of archivos) {
    const n = (sinComentarios(src).match(/<Separador\b/g) ?? []).length;
    if (n > PRESUPUESTO_SEPARADORES) excedidas.push(`${path}: ${n}`);
  }
  if (excedidas.length > BASELINE_R38)
    fallos.push(
      `N3 (la muerte del separador): ${excedidas.length} pantalla(s) sobre el presupuesto de ${PRESUPUESTO_SEPARADORES} (baseline ${BASELINE_R38}) — entre secciones separan el ESPACIO y el TÍTULO, no la línea:\n    ${excedidas.join('\n    ')}`,
    );
  fallos.push(...ancla('R38', archivos.length, MINIMOS_CORPUS.apps, 'archivo(s) de apps'));
  return {
    fallos,
    info: `${excedidas.length}/${BASELINE_R38} pantalla(s) sobre el presupuesto de ${PRESUPUESTO_SEPARADORES}${excedidas.length < BASELINE_R38 ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R39 · N1 · LA ESCALA — máximo tres tamaños tipográficos por pantalla.
 *
 *  QUÉ MIDE EXACTAMENTE, y la distinción es el corazón de la regla:
 *  cuenta los `typography.size.*` **distintos** que una pantalla escribe
 *  A MANO. Una pantalla que compone con `<Texto variante="…">` da CERO
 *  y no aparece nunca — y eso es correcto, no un hueco: `Texto` ES el
 *  portador de la jerarquía (S71), y su receta ya está firmada adentro.
 *  Lo que N1 combate no es tener cuatro tamaños: es que la jerarquía se
 *  **re-decida en cada pantalla**, que es literalmente el problema por
 *  el que `Texto` nació.
 *
 *  ⇒ Un archivo que sube en esta regla tiene una cura ya construida:
 *  montar `Texto`. Por eso el rojo es accionable y no una queja. */
const PRESUPUESTO_TAMANOS = 3;
const RE_SIZE = /\btypography\.size\.(\w+)\b|\btypography\.size\['([^']+)'\]|\bsize\.(xs|sm|base|md|lg|xl|hero|display)\b|\bsize\['(2xl|3xl|4xl)'\]/g;
function r39(archivos) {
  const fallos = [];
  const excedidas = [];
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    const usados = new Set();
    for (const m of limpio.matchAll(RE_SIZE)) usados.add(m[1] ?? m[2] ?? m[3] ?? m[4]);
    if (usados.size > PRESUPUESTO_TAMANOS) excedidas.push(`${path}: ${usados.size} (${[...usados].join(', ')})`);
  }
  if (excedidas.length > BASELINE_R39)
    fallos.push(
      `N1 (la escala): ${excedidas.length} pantalla(s) escriben más de ${PRESUPUESTO_TAMANOS} tamaños a mano (baseline ${BASELINE_R39}) — la jerarquía la porta \`Texto\`, no la pantalla:\n    ${excedidas.join('\n    ')}`,
    );
  fallos.push(...ancla('R39', archivos.length, MINIMOS_CORPUS.apps, 'archivo(s) de apps'));
  return {
    fallos,
    info: `${excedidas.length}/${BASELINE_R39} pantalla(s) sobre el presupuesto de ${PRESUPUESTO_TAMANOS} tamaños a mano${excedidas.length < BASELINE_R39 ? ' — BAJÓ: actualizar baseline' : ''}`,
  };
}

/** R40 · EL PLACEHOLDER NO SE EMBARCA EN SILENCIO (pedido de D, S97+).
 *
 *  EL CASO: `equipo.adminAvisoPENDIENTE` — el aviso §6 del toggle
 *  Administrador espera la SEGUNDA FIRMA del founder y su literal no lo
 *  escribe ninguna pista. D midió que **nada lo frenaba**: ni este lint
 *  ni ningún hook. Su frase, que es el porqué entero de la regla:
 *
 *    *«Un placeholder que puede embarcarse en silencio no está listo
 *     para recibir la firma: está listo para escaparse.»*
 *
 *  POR QUÉ VIVE ACÁ Y NO EN EL GUARD DE D, que era la pregunta abierta
 *  de su pedido: **`verify:diseno` ya vigila diccionarios de i18n** —R11
 *  mira `vozCardM*` contra el vocabulario de score de LOYALTY §3—, así
 *  que el corpus y el precedente ya existen. Meterla en otro instrumento
 *  sería un segundo lugar donde mirar lo mismo.
 *
 *  LOS DOS BRAZOS, y el segundo es el que D pidió con más razón:
 *   ① el CONTADOR solo-baja — si aparece otro placeholder sin
 *      declararlo, rojo.
 *   ② la PARIDAD es↔en por app — *«un idioma que recibe la firma y el
 *      otro no es la falla real»*. Ese es el modo de falla que un
 *      contador global no ve: dos archivos, uno curado y otro no, suman
 *      lo mismo que dos sin curar.
 *
 *  ☠️ MUERE SOLA: cuando llegue el literal firmado, la clave se renombra
 *  a `adminAviso`, el contador baja a 0 y esta regla se retira ENTERA
 *  (Ley 37). No es un guard permanente: es la correa de UN placeholder. */
const BASELINE_R40 = 1;
const RE_PENDIENTE = /^\s*([A-Za-z0-9_]*PENDIENTE)\s*:/gm;
function r40(dics) {
  const fallos = [];
  const porApp = new Map();
  for (const { path, src } of dics) {
    const app = path.includes('/cliente/') ? 'cliente' : 'prestador';
    const idioma = /\/en\.ts$/.test(path) ? 'en' : 'es';
    const claves = new Set([...sinComentarios(src).matchAll(RE_PENDIENTE)].map((m) => m[1]));
    if (!porApp.has(app)) porApp.set(app, {});
    porApp.get(app)[idioma] = claves;
  }
  const todas = new Set();
  for (const [app, { es, en }] of porApp) {
    // ② PARIDAD — el brazo que un contador global no puede ver.
    const soloEs = [...(es ?? [])].filter((k) => !(en ?? new Set()).has(k));
    const soloEn = [...(en ?? [])].filter((k) => !(es ?? new Set()).has(k));
    for (const k of soloEs)
      fallos.push(`R40: \`${k}\` está en ${app}/es.ts y NO en en.ts — un idioma recibió la firma y el otro no. El placeholder se retira de LOS DOS o de ninguno.`);
    for (const k of soloEn)
      fallos.push(`R40: \`${k}\` está en ${app}/en.ts y NO en es.ts — mismo caso, del otro lado.`);
    for (const k of [...(es ?? []), ...(en ?? [])]) todas.add(`${app}.${k}`);
  }
  // ① CONTADOR solo-baja (claves DISTINTAS, no ocurrencias: una clave en
  //    dos idiomas es UN placeholder, no dos).
  if (todas.size > BASELINE_R40)
    fallos.push(
      `R40: ${todas.size} placeholder(s) *PENDIENTE (baseline ${BASELINE_R40}) — un texto sin firma que puede embarcarse en silencio no está esperando la firma, se está escapando:\n    ${[...todas].join('\n    ')}`,
    );
  // ANCLA: sin los cuatro diccionarios la regla informaría "0
  // placeholders" en VERDE habiendo leído nada.
  fallos.push(...ancla('R40', dics.length, 4, 'diccionario(s) es/en de las dos apps'));
  return {
    fallos,
    info: `${todas.size}/${BASELINE_R40} placeholder(s) sin firma${todas.size < BASELINE_R40 ? ' — BAJÓ: la firma llegó, retirar la regla (Ley 37)' : ''} · paridad es↔en verificada en ${porApp.size} app(s)`,
  };
}
const DICS_R40 = [
  'apps/cliente/src/i18n/es.ts',
  'apps/cliente/src/i18n/en.ts',
  'apps/prestador/src/i18n/es.ts',
  'apps/prestador/src/i18n/en.ts',
].map((p) => ({ path: p, src: readFileSync(p, 'utf8') }));

/** R41 · LO QUE SE MUEVE DE VERDAD MIRA `useReducedMotion` (S98-B).
 *
 *  EL PORQUÉ, y no es una regla de accesibilidad genérica: quien activa
 *  «reducir movimiento» en su teléfono lo hace porque el movimiento le
 *  produce un síntoma —mareo, náusea—, no porque le guste menos. Y esta
 *  casa lo cumplía en **4 de 63 piezas**: el portador de la entrada de
 *  toda la app lo ignoraba hasta la sesión pasada, y **la única
 *  animación en LOOP de la casa** hasta ésta.
 *
 *  🔴 QUÉ CUENTA COMO «MOVERSE DE VERDAD», que es la parte fina — porque
 *  una regla que exigiera el hook a TODO lo animado sería ruido y se
 *  terminaría silenciando:
 *   · `withRepeat`/`withDecay`/`withSpring` → SIEMPRE. Loop, inercia y
 *     rebote son movimiento autónomo por definición.
 *   · las entradas con DESPLAZAMIENTO (`FadeInDown`, `SlideIn`, `ZoomIn`,
 *     `BounceIn`, `FlipIn`) → SIEMPRE.
 *   · `withTiming` → **solo si el archivo también toca `transform`**. Un
 *     `withTiming` sobre `opacity` es un FUNDIDO, y **un fundido puro ya
 *     es aquello a lo que la preferencia degrada**: exigirle el hook
 *     sería pedirle que se proteja de sí mismo.
 *
 *  ⚡ ESA ÚLTIMA CLÁUSULA NO ES TEÓRICA: es `VisorFoto`, medida —CERO
 *  `transform` en todo el archivo, solo `opacity`—. Su header declaraba
 *  «SOLO FADES» desde S45 y era cierto. *La regla mecaniza el criterio
 *  con el que se lo eximió, en vez de dejarlo como excepción recordada.*
 *
 *  ⚠️ LO QUE **NO** VIGILA, declarado: el gesto de PRESIÓN
 *  (`usePresionado`, las `transitionProperty` de RN-web). Eso es
 *  manipulación directa —el elemento responde al dedo mientras el dedo
 *  está ahí—, no animación autónoma, y entra en la exención de siempre.
 *
 *  ☠️ CONDICIÓN DE MUERTE: si algún día el hook se resuelve una sola vez
 *  arriba y baja por contexto (como `theme`), esta regla pierde objeto y
 *  la retira quien haga ese cambio. */
const MUEVE_SIEMPRE = /withRepeat|withDecay|withSpring|FadeInDown|FadeInUp|FadeInLeft|FadeInRight|SlideIn[A-Za-z]*|ZoomIn[A-Za-z]*|BounceIn[A-Za-z]*|FlipIn[A-Za-z]*/;
const BASELINE_R41 = 0;
function r41(archivos) {
  const fallos = [];
  let mueven = 0;
  for (const { path, src } of archivos) {
    const desplaza = /withTiming/.test(src) && /transform|translateX|translateY|scale:|rotate/.test(src);
    if (!MUEVE_SIEMPRE.test(src) && !desplaza) continue;
    mueven++;
    if (/useReducedMotion/.test(src)) continue;
    fallos.push(
      `R41: ${path} MUEVE y no mira \`useReducedMotion\` — quien pide menos movimiento lo pide por un síntoma, no por gusto. La receta de la casa está escrita y firmada: se comparte brazo con memorial (fade puro, MISMO tempo y mismo escalón — reducir movimiento es quitarle el VIAJE, no el momento). Y el hook se llama SUELTO y se combina después: \`memorial || useReducedMotion()\` es una llamada condicional a un hook.`,
    );
  }
  if (fallos.length > BASELINE_R41)
    fallos.push(`R41: ${fallos.length} pieza(s) sobre el baseline ${BASELINE_R41}.`);
  // ANCLA: si el corpus se rompe o los nombres de las APIs cambian, la
  // regla no encontraría NADA que mueva y su verde significaría «no miré»
  // en vez de «está todo cubierto» (L-192).
  fallos.push(...ancla('R41', mueven, 6, 'pieza(s) de `ui` que se mueven de verdad'));
  return {
    fallos,
    info:
      fallos.length === 0
        ? `${mueven} pieza(s) mueven · ${mueven} declaran el hook · los fundidos puros quedan exentos POR MEDICIÓN (VisorFoto: 0 transform)`
        : `${fallos.length} fallo(s)`,
  };
}

/** R42 · LA PUERTA DE LA FOTO NO SE RE-DIBUJA (S99-B — `HojaCaptura`
 *  mecanizada el día que nació, misma disciplina que R25 y R30).
 *
 *  EL DEFECTO QUE VIGILA, con su número medido y no estimado: el PICKER
 *  nunca se duplicó —`capturaFoto` es una sola implementación—, pero la
 *  PUERTA («Tomar foto / Elegir de la galería») estaba escrita a mano en
 *  **diez lugares**. Y lo que la vuelve defecto en vez de prolijidad:
 *
 *   ⚠️ **EL CERROJO CONTRA EL DOBLE TAP VIVÍA EN 2 DE LOS 10 — y los 2
 *      eran los que ya eran pieza.** Los ocho de `apps/` lanzan DOS
 *      pickers si el dedo llega dos veces antes del próximo render.
 *
 *  *Un sitio que copia una anatomía copia lo que se VE; el cerrojo no se
 *  ve.* Por eso la cura no es revisar ocho archivos: es que el noveno no
 *  pueda nacer.
 *
 *  QUÉ MIRA, y por qué ESTE net: importar **las dos** funciones de
 *  captura en el mismo archivo es la huella dactilar de estar armando el
 *  menú de dos opciones — nadie necesita cámara Y galería juntas para
 *  otra cosa. Pedir "un `<Hoja>` con dos `<Boton>`" daría los mismos
 *  archivos con más ruido y con falsos donde la hoja tiene otra forma.
 *
 *  BASELINE NOMINAL SOLO-BAJA, con las diez y su razón. Las dos de `ui`
 *  NO son deuda de la misma clase que las ocho de `apps`:
 *   · `SelectorAvatar` — su hoja tiene TRES `Celda` y la tercera («Por
 *     ahora no») es decisión FIRMADA en S45. Absorberla es un gate de
 *     forma, no un refactor, y no viaja escondido.
 *   · `EvidenciaFoto` — no es un menú: la cámara es DIRECTA y la galería
 *     vive detrás de un mantenido. Otra interacción, otra pieza.
 *  Las ocho de `apps` bajan una por una cuando su lote las toque; **de
 *  cada baja hay que bajar también este baseline.** DE ACÁ NO SE SUBE:
 *  una puerta nueva a mano es roja el primer día. */
/* `CASA_PUERTA_FOTO` y `BASELINE_R42` viven ARRIBA, con los demás
   baselines: `FIXTURES` es un literal que se evalúa al cargar el módulo
   y su fixture de R42 los consume — declararlos acá los dejaba en la
   zona muerta del `const` (medido: `ReferenceError` en la primera
   corrida). El baseline se lee junto a su regla igual, por el puntero. */
function r42(archivos) {
  const fallos = [];
  let puertas = 0;
  let casa = 0;
  let baselineVivo = 0;
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src);
    if (!/capturarConCamara/.test(limpio) || !/capturarDeGaleria/.test(limpio)) continue;
    if (path.endsWith('HojaCaptura.tsx')) { casa++; continue; }
    if (path.endsWith('capturaFoto.tsx')) continue; // la frontera las DEFINE
    puertas++;
    if (BASELINE_R42.has(path)) { baselineVivo++; continue; }
    fallos.push(
      `R42: ${path} — LA PUERTA DE LA FOTO RE-DIBUJADA. La hoja de «Tomar foto / Elegir de la galería» es UNA pieza: <HojaCaptura> de @epetplace/ui. Trae el CERROJO sincrónico contra el doble tap, que ocho de las diez copias a mano no tienen (dos toques = dos pickers). Las opciones de captura pasan derecho (recorteCuadrado/calidad/redimensionarA): la puerta no re-decide lo que cada dominio ya midió, y la voz del permiso denegado la dice la PANTALLA, no la pieza.`,
    );
  }
  if (baselineVivo < BASELINE_R42.size)
    fallos.push(
      `R42: el baseline declara ${BASELINE_R42.size} puerta(s) a mano y quedan ${baselineVivo} — BAJÓ: sacar de BASELINE_R42_CLASES la(s) que migraron (con su clase). Un baseline que sobra deja de ser una lista de deuda y pasa a ser un permiso.`,
    );
  // ANCLA: si la pieza pierde su llamada a las dos funciones (renombre,
  // refactor), esta regla vigila un fantasma y todo pasa en verde (L-192).
  fallos.push(...ancla('R42', casa, 1, `puerta canónica viva (${CASA_PUERTA_FOTO})`));
  return {
    fallos,
    info:
      `${puertas} puerta(s) a mano · baseline ${BASELINE_R42.size} = ` +
      `${Object.values(BASELINE_R42_CLASES).filter((r) => r.startsWith('CURABLE')).length} CURABLES · ` +
      `${Object.values(BASELINE_R42_CLASES).filter((r) => r.startsWith('BLOQUEADA')).length} BLOQUEADA (gate de forma) · ` +
      `${PISO_R42} LEGÍTIMA (no es deuda — el piso de esta regla es ${PISO_R42}, jamás 0). Solo-baja`,
  };
}

/** R43 · N11 · EL CONTORNO DEL CAMPO TIENE PISO, Y ES UN NÚMERO (S99-B).
 *
 *  N11 firmada: *«contorno visible **≥3:1** contra el fondo»*. Es la
 *  primera ley del Norte cuyo cumplimiento es **un número del tema**, así
 *  que se mecaniza sola — y hacía falta, porque **ninguno de los bordes
 *  que la casa ya tenía llegaba**: `border.default` **1.18** en claro y
 *  **1.28** en oscuro · `border.presente` **1.62** / **1.64**. *No es que
 *  estuvieran mal: separaban, y N11 pide contener.*
 *
 *  🔴 Y VIGILA ALGO QUE UN OJO NO VE: el día que alguien afine
 *  `campoBordeL` «un poquito más suave» porque le parece fuerte, el campo
 *  sigue **viéndose** — solo deja de cumplir. **Un piso que solo vive en
 *  una prosa se afloja sin que nada avise.**
 *
 *  QUÉ MIRA, y por qué contra `bg.base` y no contra el interior: la letra
 *  dice **«contra el fondo»**, y el fondo de la región de un formulario
 *  es la pantalla, no el relleno de la propia caja. Medir contra el
 *  interior daría números más altos y más cómodos — que es exactamente
 *  por qué no se mide así.
 *
 *  ⚠️ TIENE ANCLA: si los nombres de los tokens cambian y el regex deja
 *  de encontrarlos, la regla no mediría NADA y su verde significaría «no
 *  miré» (L-192). Exige encontrar los tres.
 *
 *  ── ⏬ S99-B · LA PARTICIÓN POR DUEÑO Y CURABILIDAD **NO APLICA ACÁ**,
 *  y se declara en vez de fabricarse ────────────────────────────────
 *  La orden de mesa la mandó hacia atrás sobre R42 **y R43**. En R42
 *  aplicó y encontró tres clases. **Acá no hay nada que partir, y decirlo
 *  es más honesto que inventar una tabla vacía:**
 *
 *  R42 y R44 llevan **un baseline: una lista de cosas PARADAS**, y ahí la
 *  mentira latente es real (*un número parado no dice si nadie lo tocó o
 *  si nadie PUEDE tocarlo*). **R43 no tiene baseline.** Sus tres números
 *  —3.34 · 3.40 · 3.34— **no son deuda parada: son la medición de que las
 *  tres casas CUMPLEN.** No hay entrada pendiente, no hay dueño ajeno, no
 *  hay nada bloqueado: si alguno bajara del piso, la regla se pone roja
 *  ese mismo día en vez de estacionarse en una lista.
 *
 *  ⇒ *Marcar como deuda un número que mide cumplimiento sería la misma
 *  clase de error que la orden viene a curar, al revés: una tabla de
 *  dueños sobre algo que nadie debe.* Precedente de la casa (S94-A):
 *  **cuatro de ocho choques del censo no eran letra obsoleta, y marcarlos
 *  habría sido peor que dejarlos.** */
const PISO_R43 = 3
/** Los pares (borde, fondo) de las tres casas. Los hex se LEEN de
 *  `palette.ts`; acá vive solo qué token va contra qué token. */
const PARES_R43 = [
  { casa: 'light', borde: 'campoBordeL', fondo: 'papelTapiz' },
  { casa: 'dark', borde: 'campoBordeD', fondo: 'tapizDark' },
  { casa: 'memorial', borde: 'campoBordeM', fondo: 'memorialDark0' },
]
function r43(fuentes) {
  const fallos = []
  /** Corpus PROPIO (patrón R27): `palette.ts` es `.ts` y el corpus de
   *  `ui` recorre solo `.tsx` — pedirlo por la lista lo dejaba fuera y
   *  la regla salía «sin corpus». Se pasa la fuente, como los temas. */
  const src = sinComentarios(fuentes.palette ?? '')
  const hexDe = (token) => {
    const m = src.match(new RegExp(`\\b${token}:\\s*'(#[0-9A-Fa-f]{6})'`))
    return m === null ? null : m[1]
  }
  const canal = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const lum = (h) => {
    const x = h.replace('#', '')
    return (
      0.2126 * canal(parseInt(x.slice(0, 2), 16)) +
      0.7152 * canal(parseInt(x.slice(2, 4), 16)) +
      0.0722 * canal(parseInt(x.slice(4, 6), 16))
    )
  }
  const ratio = (a, b) => {
    const [p, q] = [lum(a), lum(b)].sort((m, n) => n - m)
    return (p + 0.05) / (q + 0.05)
  }

  let medidos = 0
  const detalle = []
  for (const par of PARES_R43) {
    const borde = hexDe(par.borde)
    const fondo = hexDe(par.fondo)
    if (borde === null || fondo === null) {
      fallos.push(
        `R43: no se pudo leer ${borde === null ? par.borde : par.fondo} de palette.ts — token renombrado o movido. La regla dejaría de medir su casa en silencio, que es peor que un rojo.`,
      )
      continue
    }
    medidos++
    const v = ratio(borde, fondo)
    detalle.push(`${par.casa} ${v.toFixed(2)}`)
    if (v < PISO_R43)
      fallos.push(
        `R43: el contorno del campo en ${par.casa} da ${v.toFixed(2)}:1 contra el fondo — N11 pide ≥${PISO_R43}:1. La ley está firmada (DIRECCION_DISENO_S99 §N11) y su piso no se ablanda: si el borde se ve fuerte, la conversación es con la mesa, no con este número.`,
      )
  }
  // ANCLA: las tres casas o la regla no está mirando lo que dice mirar.
  fallos.push(...ancla('R43', medidos, 3, 'casa(s) con su par (contorno, fondo) medido'))
  return { fallos, info: `${detalle.join(' · ')} — piso ${PISO_R43}:1 (N11)` }
}

/** R44 · N12.4 · EL ERROR QUE NO DICE QUÉ ESTÁ MAL (S99-B).
 *
 *  N12.4 firmada: *«El error dice QUÉ está mal y CÓMO se arregla, con un
 *  ejemplo real. **"Campo inválido" está prohibido en toda la casa.**»*
 *
 *  QUÉ VIGILA: la voz que manda a *revisar* sin decir qué revisar. No es
 *  una regla de estilo — **es la diferencia entre un error que se puede
 *  arreglar y uno que solo se puede volver a intentar.**
 *
 *  🔴 Y NO ES HIPOTÉTICA: la casa ya la cobró antes de que existiera la
 *  ley. S75 registró que un rebote real iba a decir *«Revisá los datos»*
 *  hasta que su código entrara al diccionario de voces — o sea que este
 *  defecto ya se había visto de frente, y sin ley detrás no había con qué
 *  frenarlo.
 *
 *  BASELINE NOMINAL SOLO-BAJA, CON DUEÑO DECLARADO: **6, los seis en
 *  `apps/prestador` (3 `es` + 3 `en`), que NO es mi territorio.** Nacen
 *  declarados y pedidos, jamás curados por mí — el precedente es R35 en
 *  S96-B, que nació con baseline 1 y dueño y lo curó su dueño el mismo
 *  día. *La forma correcta de nacer de un ratchet: se declara y se pide,
 *  no se invade el territorio ajeno.* **DE ACÁ NO SE SUBE.**
 *
 *  ⚠️ EL NET ME COSTÓ TRES MEDICIONES, y queda escrito porque el número
 *  importaba: la primera dio **3** (`revisá?` no matchea «revisa» — la
 *  tilde opcional no cubre la vocal sin tilde), la segunda **4** («check
 *  the NOTE details» tiene una palabra en el medio), y la tercera, **6**.
 *  *Un baseline mal medido no protege de menos: protege de más, porque
 *  deja pasar como preexistente lo que nunca contó.* */
/** ⏪ ENSANCHADA EN LA MISMA SESIÓN, por el cruce de C — y las DOS
 *  mitades del cruce importan, con su literal:
 *  *«su regla encontró en mi territorio una deuda con dueño; mi medición
 *  encontró que su regla mira la mitad del problema.»*
 *
 *  🔴 **EL CORPUS ERA LA MITAD.** N12.4 dice *«en toda la casa»* y R44
 *  nació mirando SOLO los seis diccionarios. La misma voz vive también
 *  en `packages/api`, **hard-codeada en español en un paquete sin capa
 *  de idioma** (D-539) y mostrada directo por 34 archivos del prestador
 *  (`r.mensaje`) ⇒ **en inglés se ven en español.** *Una regla cuyo
 *  nombre promete «toda la casa» y cuyo corpus es la mitad está verde
 *  porque no mira, que es el modo de falla que L-192 persigue.*
 *
 *  ⚠️ Y AL ENSANCHAR, EL NET VIEJO SOBRE-CAPTURABA — el cruce se sirvió
 *  con **cinco** de `packages/api` y **son TRES**. Los otros dos
 *  (`vacunas.ts:198` · `_despensa-comun.ts:237`) **cumplen N12.4**:
 *  *«Una de las vacunas del carnet no es válida…»* y *«El recorrido
 *  llegó con datos inválidos»* **NOMBRAN LA FALLA**. Blanquearlos en un
 *  baseline los habría bendecido para siempre — el mismo daño que el
 *  subconteo, del otro lado.
 *
 *  ⇒ **EL DISCRIMINADOR, que es lo que esta regla aprendió:** el defecto
 *  no es contener «revisá» — es que **NADA diga qué falló ANTES**. Por
 *  eso el net ancla al arranque de la frase (`^[^.!?]*`): si hay una
 *  oración previa que nombra la falla, el mensaje cumple. Calibrado
 *  contra los **16 casos reales** de las dos casas, 16/16. */
/* S99-C (15-ago) · 9 → 3. Las SEIS de `apps/prestador` se reescribieron.
   La cura NO fue inventarles un QUÉ: `datos_invalidos` es el fallback de
   CUALQUIER CHECK, así que nombrar un campo habría sido verosímil y falso
   (L-139) — y mandar a mirar el lugar equivocado es peor que no decir.
   Lo que se escribió es lo que SÍ se sabe con verdad: que rechazó el
   SERVIDOR (no la red ni la sesión) y que **reenviar lo mismo va a fallar
   otra vez** — que es justo lo que «intenta de nuevo» prometía en falso.
   Las 3 de `packages/api` siguen bloqueadas (dueño A): su cura de raíz es
   D-827, códigos tipados por constraint. */
const BASELINE_R44 = 3
const VOZ_SIN_QUÉ =
  /^[^.!?]*(revis[aá] los datos|check the [a-z ]*details?|campo (inv[aá]lido|requerido)|invalid field|algo sali[oó] mal|something went wrong)/i
function r44(archivos) {
  const fallos = []
  let total = 0
  let dics = 0
  for (const { path, src } of archivos) {
    dics++
    for (const linea of src.split('\n')) {
      /* El net mira el VALOR de la cadena, no la línea entera: una línea
         puede traer clave, comentario y comilla, y anclar al arranque de
         la LÍNEA haría que cualquier prefijo desactive el `^`. */
      for (const m of linea.matchAll(/'([^']{6,})'/g)) {
        if (!VOZ_SIN_QUÉ.test(m[1])) continue
        total++
        if (total > BASELINE_R44)
          fallos.push(
            `R44: ${path} — VOZ DE ERROR QUE NO DICE QUÉ (N12.4): «${m[1]}». La ley pide QUÉ está mal y CÓMO se arregla, con un ejemplo real. «Revisá los datos» deja a la persona con lo único que ya sabía: que algo falló.`,
          )
      }
    }
  }
  if (total < BASELINE_R44)
    fallos.push(
      `R44: quedan ${total} voces genéricas y el baseline declara ${BASELINE_R44} — BAJÓ: actualizar el baseline. Un baseline que sobra deja de ser deuda y pasa a ser permiso.`,
    )
  // ANCLA: si el corpus de diccionarios se rompe, la regla no vería
  // ninguna voz y su verde diría «no miré» (L-192). Son SEIS archivos.
  fallos.push(...ancla('R44', dics, 40, 'archivo(s) del corpus (6 diccionarios + los wrappers de api)'))
  return {
    fallos,
    info: `${total} voz/voces genérica(s) · baseline ${BASELINE_R44} = las 3 de \`packages/api\` (dueño A, BLOQUEADAS: \`datos_invalidos\` es el fallback de CUALQUIER CHECK — la voz buena exige códigos tipados por constraint, no una frase mejor: D-827). Las 6 de \`apps/prestador\` se curaron en S99-C. Solo-baja`,
  }
}


/** R50 · ELEGIR UNO DE VARIOS SIN DECIR CUÁL (S100-B, encargo de mesa).
 *
 *  EL CASO QUE LA PARIÓ (H-001, medido por C): un wrapper afirmaba en un
 *  comentario que el índice `uq_oferta_publicada_por_variante` garantiza
 *  **una sola** oferta publicada por variante. **Ese índice NO EXISTE**;
 *  el real es por `(cuenta_comercial_id, variante_id)` — o sea **N
 *  vendedores por variante A PROPÓSITO**. Sobre esa premisa el código
 *  hacía `publicadas[0]` **sin `.order()`** ⇒ **la tarjeta puede decir
 *  $70.90 y la ficha $75.86 del mismo toque**, en 25 variantes.
 *
 *  🔴 **Y NO TIENE SÍNTOMA: cada pantalla se ve bien por separado.** Solo
 *  el par las delata. Ni `tsc` ni el resto de este lint lo ven.
 *
 *  ── 🔴 CÓMO SE MIDIÓ, PORQUE LA PRIMERA REGLA QUE ESCRIBÍ ERA PEOR QUE
 *  NINGUNA ──────────────────────────────────────────────────────────
 *  El encargo pedía *«`[0]` sobre colección sin `.order()` en wrappers»*.
 *  Medido en crudo: **21 casos**, y al clasificarlos apareció el
 *  problema — la mayoría son `Array.isArray(x) ? x[0] : x`, que **no es
 *  elegir uno de varios: es DESENVOLVER un embed** de PostgREST que
 *  puede venir como objeto o como array de uno. Ruido puro.
 *
 *  **Y lo grave:** al probar «acepto el caso si el código DECLARA su
 *  unicidad», **el defecto real PASABA EN VERDE** — porque su comentario
 *  declara una garantía… que es justamente la falsa. ***Una regla que
 *  acepta un comentario como prueba premia el mecanismo exacto que
 *  produjo el daño.***
 *
 *  ⇒ El discriminador correcto no es `[0]`: es **`[0]` sobre el
 *  resultado de un `.filter(...)`** — o sea *elegir uno de un
 *  subconjunto que por definición puede tener varios*. **Medido sobre 89
 *  archivos: SOLO 2 casos**, los dos en el mismo archivo, uno de ellos el
 *  defecto que C encontró. **Quirúrgica y sin ruido.**
 *
 *  ── LA SALIDA, y por qué NO es «poné un comentario» ────────────────
 *  Se sale con **`.order(` en el mismo archivo**: un orden explícito
 *  vuelve determinista cuál es el primero. *La cura correcta del caso de
 *  C no es documentar mejor: es ordenar, o traer el criterio del motor.*
 *
 *  ── ⚠️ EL LÍMITE DE ESTA REGLA, ESCRITO PARA QUE SU VERDE NO SE LEA
 *  DE MÁS (aporte de A, cuarta aparición del patrón) ─────────────────
 *  A encontró el mismo defecto una cuarta vez —`publicadas[0]` ·
 *  `items[0]` · `galeria[0]` · **y la placa del repartidor**: hay hasta
 *  2 vehículos por repartidor y `envios` no registra cuál se usó, así
 *  que mostrar «la placa» era elegir uno de N—. Lo resolvió por `orden`
 *  ASC, **que sí es criterio porque LO ESCRIBE EL VENDEDOR**.
 *
 *  🔴 **Y ahí está la ley que esta regla NO puede mecanizar entera: el
 *  problema no es la ausencia de `.order()` — es si EL CRITERIO EXISTE
 *  y QUIÉN LO ESCRIBIÓ.** Un `.sort()` por un campo cualquiera pasa este
 *  lint y puede no ser criterio de nada.
 *
 *  ⇒ **Esta regla caza la forma más barata del defecto —elegir sin
 *  NINGÚN orden— y no puede juzgar si el orden elegido significa algo.**
 *  *Su verde dice «acá alguien decidió un orden», jamás «el orden es el
 *  correcto».* La segunda mitad no se mecaniza honestamente: se declara
 *  y se enseña.
 *
 *  Baseline **2**, solo-baja, con dueño: **los dos son de `A`**
 *  (`packages/api`). Muere cuando llegue a 0. */
/** ⏪ Nació en **2** y **bajó a 0 el mismo día**, sin que nadie curara
 *  nada: los dos «ofensores» eran **uno ya curado que la regla no veía**
 *  (`.sort()` en vez de `.order()`) y **uno legítimo por N19**. *Un
 *  baseline que describe mal lo que cuenta es una deuda inventada — y
 *  peor: con solo-baja, inmortal.* */
const BASELINE_R50 = 0
function r50(archivos) {
  const fallos = []
  const ofensores = []

  for (const { path, src } of archivos) {
    if (!path.includes('packages/api/')) continue
    const limpio = sinComentarios(src)
    for (const m of limpio.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;]*?\.filter\s*\(/g)) {
      const nombre = m[1]
      const resto = limpio.slice(m.index + m[0].length)
      if (!new RegExp(`\\b${nombre}\\s*\\[0\\]`).test(resto)) continue
      /* 🔴 LA EXENCIÓN ES LOCAL, Y ESTA LÍNEA SE ESCRIBIÓ DOS VECES.
         La v1 preguntaba `¿el ARCHIVO tiene .order(?` y daba VERDE sobre
         los dos ofensores reales: `despensa-catalogo.ts` tiene CINCO
         `.order(` en otras consultas, así que la exención de archivo los
         cubría a todos. **La regla habría bendecido exactamente el
         defecto que vino a cazar.**
         Lo delató el BASELINE: la regla decía 0 y su baseline era 2, y
         dos números que deben coincidir salieron de dos cuentas
         distintas (L-281). *Un ratchet sin baseline no habría tenido con
         qué contradecirse.*
         ⇒ El orden tiene que estar en la consulta QUE ALIMENTA a este
         filter, no en cualquier parte del archivo. */
      /* 🔴 LA VENTANA COMPRENDE EL TRAMO ENTERO, y esta línea también se
         escribió dos veces. La v2 miraba **600 chars ANTES** del filter
         — y el orden vive DESPUÉS: *se filtra, se ordena, se toma el
         primero.* Con esa ventana, la cura de A (un `.sort()`
         encadenado al `.filter()`) **quedaba invisible y el sitio seguía
         contando como ofensor para siempre.**
         *Segunda vez en el día que esta regla mide en el lugar
         equivocado: primero el archivo entero, ahora media ventana. La
         forma correcta es la obvia — el orden puede estar en la consulta
         que alimenta (antes) o encadenado al filtro (después), así que
         la ventana es de punta a punta.* */
      const finUso = resto.search(new RegExp(`\\b${nombre}\\s*\\[0\\]`))
      const ventana = limpio.slice(
        Math.max(0, m.index - 600),
        m.index + m[0].length + (finUso >= 0 ? finUso : 0),
      )
      /* ⏪ **S100-B · ENMIENDA DE A, y tenía razón: LA REGLA MEDÍA LA
         PALABRA, NO LA PROPIEDAD.** Pedía `.order(` — de la base — y su
         cura de H-001 usa un **`.sort()` en el cliente por `created_at`
         con desempate por `id`**, que es *orden total y determinista sin
         depender de lo que devuelva la base*: **la propiedad que esta
         regla persigue, cumplida por un mecanismo que la regla no
         reconocía.** ⇒ habría seguido contándolo como ofensor para
         siempre, y con solo-baja **el contador no podía bajar nunca: la
         regla quedaba incapaz de registrar su propio éxito.**
         La propiedad es ORDEN TOTAL EXPLÍCITO; `order` y `sort` son dos
         formas de conseguirla. */
      if (/\.(order|sort)\s*\(/.test(ventana)) continue
      /* La exención por LETRA, nombrada y no por baseline (pedido de A):
         `fotosDeProducto` toma `galeria[0]` y **ahí el orden ES DATO** —
         un `jsonb` con el orden del autor— y **N19 le da significado
         explícito a la primera**: *«la primera foto es el producto solo,
         sin composición de marketing»*. No hay nada que ordenar: elegir
         la primera **es** el criterio.
         *Se exenta nombrando su ley, no escondiéndola en un número: un
         baseline dice «hay 2 y no sé por qué»; esto dice cuál y por qué.* */
      if (/function\s+fotosDeProducto|const\s+fotosDeProducto/.test(limpio.slice(Math.max(0, m.index - 1200), m.index))) continue
      ofensores.push(`${path.split('/').pop()} → ${nombre}[0]`)
    }
  }

  if (ofensores.length > BASELINE_R50)
    fallos.push(
      `R50: ${ofensores.length} caso(s) que eligen UNO de un subconjunto filtrado sin orden explícito (${ofensores.join(' · ')}, baseline ${BASELINE_R50} SOLO-BAJA). Un \`.filter()\` devuelve por definición VARIOS: tomar \`[0]\` sin \`.order()\` deja que el orden lo decida la base, y dos pantallas que leen lo mismo pueden mostrar cosas distintas SIN SÍNTOMA. La salida es \`.order()\` con el criterio real —o traerlo del motor—, JAMÁS un comentario que afirme unicidad: un comentario no es una garantía de la base hasta que alguien la mide.`,
    )
  fallos.push(...ancla('R50', archivos.filter((a) => a.path.includes('packages/api/')).length, 1, 'archivo(s) de wrappers en el corpus'))
  return {
    fallos,
    info: `${ofensores.length} elección/es sin orden · baseline ${BASELINE_R50} solo-baja (dueño A) · mide \`filter()\`+\`[0]\`, NO el \`[0]\` genérico (21 casos, ruido)`,
  }
}

/** R51 · UN TOKEN LEGADO NO ENTRA A UNA PIEZA NUEVA (S100-B, mesa).
 *
 *  LA LEY: ***un nombre que parece correcto es peor que uno que falta.***
 *  Un token legado con nombre plausible es **una trampa cebada para el
 *  próximo que escriba una pieza.**
 *
 *  EL CASO: `motion.duration.normal` vale **250** y es LEGADO — el
 *  vocabulario cerrado de N10 son **150 · 300 · 520**, y su token es
 *  `estandar`. **D casi lo usa creyendo que era el estándar**; lo frenó
 *  un comentario, no un gate.
 *
 *  ── EL NÚMERO QUE HACE ESTA REGLA NECESARIA ────────────────────────
 *  Medido: de los cuatro legados (`instant` · `normal` · `slow` ·
 *  `verySlow`), **tres están en CERO usos y `normal` tiene 15.**
 *  ***El único legado vivo es justamente el del nombre plausible.***
 *  *Los que se delatan solos por el nombre nadie los usa.*
 *
 *  ── POR QUÉ ACOTADA A LO NUEVO, y no un ratchet global ─────────────
 *  Los 15 usos viven en **5 archivos** y **migrarlos es cambio de
 *  MOVIMIENTO en piezas de alto tráfico** (`Hoja`, `VisorFoto`,
 *  `MapaRecorrido`): 250 → 300 se ve, y eso pide gate en dispositivo, no
 *  un lint. **La regla congela la lista y prohíbe el archivo 6.**
 *
 *  ⇒ **Lo que evita es exacto: que el próximo lo tome creyendo que es el
 *  estándar.** Los 15 vivos son deuda con dueño y con gate propio.
 *
 *  ⚠️ **Renombrar a `legacy_*` se EVALUÓ y NO se hace acá, con su
 *  razón:** `motion` **se exporta desde `index.ts`**, así que el rename
 *  cruza a `apps/` y toca dos pistas a la vez. **Es barato y es correcto
 *  —el nombre dejaría de competir con el vocabulario—, pero es enmienda
 *  de token con censo de consumidores: tanda propia, no de paso.** Se
 *  declara para que se decida, no para que se olvide. */
/** ⏪ Eran `instant`/`normal`/`slow`/`verySlow`. **S100-B los renombró a
 *  `legacy_*`** para que el nombre se delate solo, así que la regla
 *  vigila los nombres NUEVOS. *Si siguiera vigilando los viejos, tras el
 *  rename encontraría CERO y su ancla lo diría — que es exactamente lo
 *  que pasó, y por eso el ancla estaba puesta.* */
const LEGADOS_MOTION = ['legacy_instant', 'legacy_normal', 'legacy_slow', 'legacy_verySlow']
/** Los 5 archivos que YA los usan. Solo-baja: sacar uno de acá es una
 *  migración con gate, y ningún archivo NUEVO puede sumarse. */
const BASELINE_R51 = [
  'apps/cliente/src/app/(tabs)/hogar/index.tsx',
  'apps/cliente/src/app/paseo/[atencionId].tsx',
  'packages/ui/src/components/Hoja.tsx',
  'packages/ui/src/components/MapaRecorrido.tsx',
  'packages/ui/src/components/VisorFoto.tsx',
]
function r51(archivos) {
  const fallos = []
  const patron = new RegExp(`duration\\.(${LEGADOS_MOTION.join('|')})\\b`)
  const usan = []

  for (const { path, src } of archivos) {
    if (!patron.test(sinComentarios(src))) continue
    usan.push(path)
    const conocido = BASELINE_R51.some((b) => path.endsWith(b) || b.endsWith(path))
    if (!conocido)
      fallos.push(
        `R51: \`${path}\` usa un token LEGADO de \`motion.duration\` (${LEGADOS_MOTION.join('/')}). El vocabulario del movimiento es CERRADO y son otros: \`fast\` 150 · \`estandar\` 300 · \`grande\` 520 (N10). \`normal\` vale 250 y NO pertenece — su nombre compite con el vocabulario sin ser parte de él. Usá el token de N10 que corresponda al registro del gesto.`,
      )
  }
  /* 🔴 EL ANCLA MIDE EL SUJETO, NO LOS OFENSORES — y esta línea se
     corrige aplicando a mi propia regla el corolario que la mesa acaba
     de firmar (*toda regla nueva tiene que poder llegar a cero*).

     ⏪ Decía `ancla('R51', usan.length, 1, …)`: exigía **al menos UN
     archivo usando legados**. ⇒ **el día que alguien migrara los 15 usos
     a la banda de N10 —o sea, el día que la deuda se pagara entera— la
     regla habría salido ROJA por ANCLA ROTA.** *Castigaba su propio
     éxito*, que es exactamente el rojo falso permanente que A encontró
     en R50, en su otra forma.

     ⇒ Lo que la regla necesita para no estar ciega **no es que alguien
     la viole: es que sus tokens SIGAN EXISTIENDO.** Si los `legacy_*`
     desaparecen de `motion.ts`, esta regla se quedó sin sujeto — y eso
     no es un rojo, es su condición de MUERTE (con firma). El ancla lo
     dice en vez de fingir que vigila. */
  const fuenteMotion = readFileSync('packages/ui/src/tokens/motion.ts', 'utf8')
  const vivos = LEGADOS_MOTION.filter((t) => new RegExp(`\\b${t}\\s*:`).test(fuenteMotion))
  fallos.push(...ancla('R51', vivos.length, 1, 'token(s) legado(s) declarado(s) en motion.ts (0 = la regla perdió su sujeto y MUERE con firma, no es rojo)'))
  return {
    fallos,
    info: `${usan.length} archivo(s) con legados de \`duration\` · ${vivos.length}/${LEGADOS_MOTION.length} token(s) legado(s) vivo(s) · baseline ${BASELINE_R51.length} congelado · medido: 3 de los 4 legados tienen CERO usos y \`normal\` tiene 15 — el único vivo es el del nombre plausible`,
  }
}

/** R49 · N11′ · EL PLACEHOLDER NO REPITE LA ETIQUETA (S100-B).
 *
 *  LA LEY, firmada por el founder el 17-ago: *«EL PLACEHOLDER DEJA DE
 *  REPETIR LA ETIQUETA Y PASA A SER UN EJEMPLO DEL FORMATO: bajo
 *  "Teléfono de contacto" va "+593 99 123 4567", no "Teléfono". Repetir
 *  la etiqueta adentro es desperdiciar el único lugar donde se puede
 *  enseñar el formato sin hablar.»*
 *
 *  Con N11′ la etiqueta salió AFUERA y quedó siempre visible ⇒ el
 *  interior de la caja se liberó. **Un placeholder que repite el rótulo
 *  deja ese lugar vacío por partida doble: no enseña nada Y ocupa el
 *  espacio del ejemplo que sí serviría.**
 *
 *  ── 🔴 LO QUE ESTA REGLA CAZA, Y LO QUE NO — leerlo antes de confiar
 *  en su verde ─────────────────────────────────────────────────────────
 *  **CAZA solo la repetición INEQUÍVOCA**: el mismo literal, o la misma
 *  clave `t()` en los dos lugares. **NO caza «repite con otras
 *  palabras»**, y eso NO es un olvido: es el resultado de medirlo.
 *
 *  El censo de apertura (123 `<Campo>`, 56 con etiqueta y placeholder)
 *  dio **CERO idénticos** y **TRES donde el placeholder contiene a la
 *  etiqueta** — y de esos tres, **uno es legítimo**:
 *    · ✅ `label="Código"` · `placeholder="El código impreso en tu
 *      factura"` → **no repite: dice DÓNDE ENCONTRARLO.** Es exactamente
 *      lo que la ley pide.
 *    · ❌ `label="Diagnóstico"` · `placeholder="Diagnóstico principal"`
 *    · ❌ `label="Medicamento"` · `placeholder="Nombre del medicamento"`
 *
 *  ⇒ **una regla por «contiene» habría gritado 1 de cada 3 veces sin
 *  razón.** La diferencia entre los tres no es sintáctica —es si el texto
 *  AGREGA algo—, y eso un lint no lo puede ver. *Media regla honesta vale
 *  más que una entera que miente* (S99-B, R47): la mitad inequívoca queda
 *  mecanizada para siempre, y **los dos ofensores reales viajan como
 *  hallazgo con dueño (C), que es donde se pueden arreglar con criterio.**
 *
 *  Nace en **0** y es solo-baja por construcción: prohíbe hacia adelante
 *  sin pedirle a nadie que cure nada hoy. */
const BASELINE_R49 = 0
function r49(archivos) {
  const fallos = []
  let camposConAmbos = 0
  const ofensores = []

  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src)
    // El bloque de un <Campo …/>. El techo de 900 chars evita que un
    // bloque sin cerrar se coma la pantalla entera y fabrique pares que
    // no existen — mismo cuidado que R42 con sus puertas.
    for (const m of limpio.matchAll(/<Campo\b[\s\S]{0,900}?\/>/g)) {
      const b = m[0]
      const lab = b.match(/\blabel=(?:\{t\('([^']+)'\)\}|"([^"]+)")/)
      const ph = b.match(/\bplaceholder=(?:\{t\('([^']+)'\)\}|"([^"]+)")/)
      if (lab === null || ph === null) continue
      camposConAmbos++
      const claveL = lab[1] ?? null
      const claveP = ph[1] ?? null
      const litL = lab[2] ?? null
      const litP = ph[2] ?? null
      const mismaClave = claveL !== null && claveL === claveP
      const mismoLiteral =
        litL !== null && litP !== null && litL.trim().toLowerCase() === litP.trim().toLowerCase()
      if (mismaClave || mismoLiteral)
        ofensores.push(`${path} — ${mismaClave ? `t('${claveL}')` : `"${litL}"`}`)
    }
  }

  if (ofensores.length > BASELINE_R49)
    fallos.push(
      `R49: ${ofensores.length} campo(s) con el placeholder REPITIENDO su etiqueta (${ofensores.join(' · ')}). N11′: el placeholder es el ejemplo del FORMATO, no el eco del rótulo — bajo «Teléfono de contacto» va «+593 99 123 4567». Con la etiqueta afuera y siempre visible, repetirla adentro desperdicia el único lugar donde se enseña el formato sin hablar. Si de verdad no hay ejemplo que dar, el campo va SIN placeholder: el vacío es honesto, el eco no.`,
    )
  // ANCLA: sin campos con las dos props, esta regla no está mirando nada.
  fallos.push(...ancla('R49', camposConAmbos, 1, 'campo(s) con etiqueta Y placeholder'))
  return {
    fallos,
    info: `${ofensores.length} eco(s) literal(es) · ${camposConAmbos} campo(s) con etiqueta y placeholder · baseline ${BASELINE_R49} · ⚠️ NO mide «repite con otras palabras» (2 casos vivos, dueño C — ver cabecera)`,
  }
}

/** R62 · LA TABLA DE JUBILACIONES — una prop jubilada no se sigue montando
 *  (S103-B · nace del censo «el modo de falla decide la herramienta»).
 *
 *  🔴 **POR QUÉ ES UNA TABLA Y NO UNA REGLA POR CASO, con su medición:**
 *  el censo de S103-B intentó DETECTAR jubilaciones mirando el código y
 *  **falló en las dos direcciones, medido:** contando solo comparaciones,
 *  marcó **133 de 298 miembros (45% del corpus)** — *un instrumento que
 *  denuncia media casa mide su propia ceguera*; contando además las tablas
 *  de lookup, **perdió el ancla**, porque `compacto` **está COMPLETAMENTE
 *  IMPLEMENTADA** y jubilada **por política**.
 *  ⇒ ***un valor prohibido por política es indistinguible de uno vivo
 *  mirando el código: solo la prosa dice que está prohibido.*** Por eso
 *  `R47`/`R48`/`R58` son ratchets de NOMBRE y **no se derivan**, y por eso
 *  cada jubilación nueva **paga su propia fila acá**.
 *
 *  🔴 **Y POR QUÉ UNA REGLA Y NO UN COMENTARIO MEJOR:** el caso anterior
 *  de esta clase (`BarraTabs.destacada`, R61, retirada al llegar a 0)
 *  **se anunciaba NO-OP EN NEGRITA adentro del archivo que la aceptaba**,
 *  y sobrevivió tres semanas con 52 reglas y 4 typechecks en verde.
 *  *Un comentario no frena a un compilador.* **El destinatario del freno
 *  acá es el LLAMADOR, y al llamador no lo alcanza ninguna prosa que viva
 *  en la pieza.**
 *
 *  ⚠️ **`forma` es lo que separa una prop de su homónima de otra pieza —
 *  y las dos trampas son REALES, medidas en el árbol vivo:**
 *  · `objeto` — `prop: true` adentro de un item.
 *  · `jsx` — `prop={…}` en el tag de SU pieza. **`especie:` como clave de
 *    argumento (`caraDeMascotaPorRuta({ especie: … })`) vive en la MISMA
 *    LÍNEA que un `<AvatarMascota>` y NO es un pase**: medir por línea
 *    contaba un falso positivo del árbol real.
 *  *Medir por la palabra habría hecho que usar una prop VIVA de otra pieza
 *  aumente una deuda ajena.*
 *
 *  ⚠️ **LA CONDICIÓN DE USO DEL CENSO QUE PARIÓ ESTA REGLA (crédito de la
 *  pista C, que refutó un caso mío con ella):** *un grep por ACCESO A
 *  PROPIEDAD no ve el paso del OBJETO ENTERO.* El caso: se declararon
 *  muertos `alergia.composicion` y `.coincidencia` porque la pieza «solo
 *  lee `alergia.senal`» — **cierto como grep y falso como conclusión**: el
 *  objeto entero viaja a `temperaturaDeAlergia({ composicion, coincidencia })`
 *  en tres sitios, y esos dos campos deciden **si la señal se dibuja, el
 *  `accessibilityRole` y el color**. `alergia.composicion` no aparece
 *  nunca y gobierna cada render.
 *  ⇒ **antes de declarar muerto un campo hay que ver si el objeto que lo
 *  contiene se pasa completo a algún lado.** *No es reproche al método —
 *  censar por forma sintáctica es lo que lo hace escalar—: es su condición
 *  de uso.* **`AvatarMascota.especie` la pasa en su forma más fuerte:
 *  adentro de la pieza NO EXISTE ningún objeto que pasar** — la firma
 *  desestructura, `props` aparece 0 veces y hay 0 spreads.
 *
 *  ── LA FILA VIVA ───────────────────────────────────────────────────
 *  **`AvatarMascota.especie` — no murió: NUNCA NACIÓ.** La ficha de
 *  `D-288` dice *«la API de AvatarMascota ya recibe `especie`»* y es
 *  cierto que la RECIBE — **la pieza ni siquiera la desestructura**.
 *  Medido: la integración de D-288 **llegó por OTRA puerta** y ya está
 *  viva — `caraDeMascotaPorRuta({ especie, rutaImagen, fotoUri })`
 *  resuelve la escalera raza → genérico → huella en `@epetplace/api` y
 *  entra como **`fotoUrl`**. ⇒ **la prop es vestigio del plan superado, no
 *  semilla esperando**, y por eso se retira en vez de protegerse.
 *  *Su costo hoy no es teórico: `foto-mascota.tsx:195` computa
 *  `esEspecieUi(especie) ? especie : undefined` para nada.*
 *
 *  ⚠️ **EL LÍMITE DE SU VERDE, y no es prudencia — se cobró el mismo día**
 *  (medición de C, ley de D): **su verde dice «no se monta», JAMÁS «no se
 *  computa».** *Retirar un montaje sin barrer lo que lo alimentaba deja el
 *  CÓMPUTO VIVO y la RAZÓN MUERTA* — la versión chica de lo que esta misma
 *  regla vigila en grande. Al retirar los 15 de `apps/`, los tres casos
 *  **parecían el mismo y solo uno lo era:** en `PasoFoto` quedó un import
 *  huérfano (lo cazó el typecheck), en `PasoRaza` el cómputo **seguía
 *  vivo y legítimo** (alimenta el título), y en `foto-mascota` el estado
 *  quedó **escribiéndose sin lector** — 🔴 **y el typecheck lo dio por
 *  bueno, porque `setEspecie` es un uso válido de la variable.**
 *  ⇒ **el barrido de lo que alimentaba al montaje es MANUAL y va con la
 *  cura; ningún gate lo pide, ni éste.**
 *
 *  🔴 **LA SECUENCIA DE `FilaCita`, acordada con C (misma que la de
 *  `destacada`):** su campo lo consume `apps/prestador/historico.tsx`.
 *  **C saca el consumidor PRIMERO y esta pieza suelta la prop DESPUÉS** —
 *  al revés, el typecheck de `main` se rompe entre los dos merges. */
const JUBILADAS = [
  {
    id: 'AvatarMascota.especie',
    pieza: 'AvatarMascota',
    prop: 'especie',
    forma: 'jsx',
    baseApps: 15,
    baseUi: 1,
    murio: 'nunca nació: la integración de D-288 llegó por otra puerta y ya está viva',
    cura:
      'La cara por especie la resuelve el LLAMADOR con `caraDeMascotaPorRuta(...)` y llega como `fotoUrl`. Se borra el `especie={...}`; en `foto-mascota` desaparece además un `esEspecieUi(...)` computado para nada. Cuando los dos contadores lleguen a 0 se retiran EN EL MISMO COMMIT la prop, su doc y esta fila.',
  },
]
function r62(archivos) {
  const fallos = []
  const infos = []
  /* Blanquea comentarios CONSERVANDO offsets: `sinComentarios` los BORRA
     y la línea reportada quedaría más arriba del defecto. Un número que
     manda al lugar equivocado es peor que no dar número. */
  const enBlanco = (s) =>
    s
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
  for (const j of JUBILADAS) {
    const enApps = []
    const enUi = []
    let piezas = 0
    const suArchivo = new RegExp('/' + j.pieza + '\\.tsx$')
    for (const { path, src: crudo } of archivos) {
      // La pieza dueña queda afuera: su declaración NO es un montaje.
      if (suArchivo.test(path)) {
        piezas++
        continue
      }
      const src = enBlanco(crudo)
      const anotar = (idx) => {
        const donde = path + ':' + lineaDe(src, idx)
        if (path.startsWith('packages/ui/')) enUi.push(donde)
        else enApps.push(donde)
      }
      if (j.forma === 'objeto') {
        const re = new RegExp('\\b' + j.prop + ':\\s*(?:true|false)\\b', 'g')
        for (const m of src.matchAll(re)) anotar(m.index)
      } else {
        const dentroDelTag = new RegExp('\\b' + j.prop + '(?:=|\\s*/?>|\\s)')
        for (const { tag, index } of tagsDe(src, j.pieza))
          if (dentroDelTag.test(tag)) anotar(index)
      }
    }
    if (enApps.length > j.baseApps)
      fallos.push(
        'R62 · ' + j.id + ': montajes de la prop JUBILADA en apps/ subieron a ' + enApps.length +
          ' (baseline ' + j.baseApps + ', SOLO-BAJA) — ' + enApps.join(' · ') +
          '. ' + j.murio + '. La prop se acepta, typechequea y NO DIBUJA NADA: el llamador cree que pidió algo. ' + j.cura,
      )
    if (enUi.length > j.baseUi)
      fallos.push(
        'R62 · ' + j.id + ': montajes dentro de packages/ui subieron a ' + enUi.length +
          ' (DURA EN ' + j.baseUi + ') — ' + enUi.join(' · ') +
          '. En la galería es peor que en una pantalla: una lámina que monta una prop muerta le muestra al founder una función que no existe.',
      )
    fallos.push(...ancla('R62·' + j.id, piezas, 1, 'archivo(s) de la pieza en el corpus'))
    infos.push(j.id + ' apps ' + enApps.length + '/' + j.baseApps + ' · ui ' + enUi.length + '/' + j.baseUi)
  }
  return {
    fallos,
    info:
      JUBILADAS.length + ' jubilación/es en tabla — ' + infos.join(' · ') +
      ' · mide la FORMA (tag de su pieza u objeto), jamás la palabra: una clave de argumento en la misma línea NO cuenta',
  }
}

/** R60 · `Boton` NO OCUPA EL SLOT `alignSelf` DE SU EXTERIOR (S103-B · D de C).
 *
 *  LA LEY: un botón sin `bloque` **abraza su contenido sin decidir dónde
 *  se para** — eso lo decide el padre. Su exterior va SIN `alignSelf`
 *  (una FILA que hereda), y el `alignSelf` explícito queda **solo para
 *  `bloque`**, que es lo único que promete ancho completo.
 *
 *  🔴 **POR QUÉ NECESITA UN JUEZ, y no es paranoia:** el envoltorio
 *  **parece peso muerto** —un `View` sin estilo visible alrededor de un
 *  `Pressable`— y su razón es de flexbox, invisible al leer. *Es la clase
 *  exacta de línea que alguien borra por prolijidad*, y borrarla no rompe
 *  nada que se note: **vuelve a ganarle al `alignItems` del padre**, en
 *  silencio, en las 22 pantallas que hoy lo usan.
 *
 *  **Y el precedente que la justifica ya está pagado:** el defecto se curó
 *  por consumidor el 22-ago y **reapareció veinte líneas más abajo en el
 *  mismo archivo** con un bloque nacido después. *Una corrección aplicada
 *  a un caso no protege al hermano que nace al día siguiente.*
 *
 *  Mide el ELEMENTO EXTERIOR del `return` de la pieza: si su `style`
 *  nombra `alignSelf` fuera de la rama `bloque`, el slot volvió a estar
 *  ocupado. */
const BASELINE_R60 = 0
function r60(archivos) {
  const fallos = []
  let piezas = 0
  for (const { path, src } of archivos) {
    if (!/\/Boton\.tsx$/.test(path)) continue
    piezas++
    const limpio = sinComentarios(src)
    // El exterior: el primer elemento tras el `return (` del componente.
    const m = limpio.match(/return \(\s*\n\s*<View([\s\S]{0,400}?)>/)
    if (m === null) {
      fallos.push(
        'R60: el `return` de `Boton` ya no abre con un `<View>`. El envoltorio que devuelve la alineación al padre no está — sin él, `alignSelf` vuelve a ganarle al `alignItems` del contenedor y ningún padre puede centrar un botón. Ver su porqué en la pieza.',
      )
      continue
    }
    const atributos = m[1]
    const fueraDeBloque = atributos.replace(/bloque \?[^:]*:/g, '')
    if (/alignSelf/.test(fueraDeBloque))
      fallos.push(
        `R60: el exterior de \`Boton\` declara \`alignSelf\` fuera de la rama \`bloque\`. Ese slot es del PADRE: quien lo escribe le gana al \`alignItems\` del contenedor, y un botón deja de poder centrarse. \`bloque\` sí lo conserva —es lo único que promete ancho completo—; el resto hereda.`,
      )
  }
  fallos.push(...ancla('R60', piezas, 1, 'archivo(s) Boton.tsx en el corpus'))
  return { fallos, info: `${piezas} pieza(s) medida(s) · DURA EN ${BASELINE_R60}` }
}

/** R59 · UN COMENTARIO JSX SIN LLAVES ES TEXTO QUE SE RENDERIZA (S103-B · D-882).
 *
 *  🔴 EL DEFECTO, medido y no supuesto: en la galería vivían **SEIS**
 *  bloques de comentario escritos SIN las llaves adentro de un `<View>`.
 *  **En JSX eso no es un comentario: es un nodo de texto** — y en React
 *  Native tira «Text strings must be rendered within a Text», que se
 *  monta como overlay ROJO encima de la pantalla.
 *
 *  **Su costo real no fue estético: interrumpió un gate.** El founder iba
 *  a caminar esa galería, y *un gate interrumpido por un error no es un
 *  gate: es una pregunta sobre el error.*
 *
 *  ── 🔴 POR QUÉ HACE FALTA UN JUEZ, Y NO «MÁS CUIDADO» ──────────────
 *  **El typecheck da 0 con el defecto adentro** — los seis convivieron
 *  con cuatro typechecks verdes durante sesiones, y ningún lint de la
 *  casa los veía. *Es la clase que este canon nombra: produce salida
 *  creíble y no rompe ningún build; el único que lo dice es el aparato,
 *  tarde y encima de otra cosa.*
 *
 *  ── POR QUÉ AST Y NO REGEX, con su medición ────────────────────────
 *  Se intentó primero por líneas y **sobre-disparó feo: 25 bloques cuando
 *  los reales eran 6** — el resto eran JSDoc de nivel superior, y el
 *  primero era la cabecera del archivo. *Un regex no puede saber si un
 *  comentario está adentro de JSX; el árbol sí.* Cuesta **~265 ms sobre
 *  329 archivos**, medido, que es lo que hace que quepa en el hook.
 *
 *  ⚠️ **Y una ironía con lección adentro: esta misma cabecera se rompió
 *  DOS veces al escribirla**, porque citar el ejemplo bien formado en
 *  prosa cierra el bloque que lo contiene. *La secuencia de cierre no se
 *  escribe adentro de un comentario ni para dar un ejemplo* — por eso
 *  acá se describe con palabras y el ejemplo vive en el fixture, que es
 *  una cadena.
 *
 *  Mide **texto crudo** y **expresiones que producen string** como hijos
 *  directos de un elemento que NO es de texto. */
const BASELINE_R59 = 0
const PIEZAS_DE_TEXTO = new Set(['Text', 'Texto', 'PrecioText', 'CodigoAEscala'])
function r59(archivos) {
  const fallos = []
  const ofensores = []
  let elementos = 0
  for (const { path, src } of archivos) {
    const arbol = ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const linea = (n) => arbol.getLineAndCharacterOfPosition(n.getStart(arbol)).line + 1
    const caminar = (n) => {
      if (ts.isJsxElement(n)) {
        elementos++
        const tag = n.openingElement.tagName.getText(arbol)
        if (!PIEZAS_DE_TEXTO.has(tag) && !/^Texto\./.test(tag)) {
          for (const h of n.children) {
            if (ts.isJsxText(h) && h.text.trim() !== '')
              ofensores.push(`${path}:${linea(h)} <${tag}> «${h.text.trim().slice(0, 40)}…»`)
            if (ts.isJsxExpression(h) && h.expression !== undefined) {
              const e = h.expression
              if (
                ts.isStringLiteral(e) ||
                ts.isTemplateExpression(e) ||
                ts.isNoSubstitutionTemplateLiteral(e)
              )
                ofensores.push(`${path}:${linea(h)} <${tag}> ${e.getText(arbol).slice(0, 40)}`)
            }
          }
        }
      }
      n.forEachChild(caminar)
    }
    caminar(arbol)
  }
  if (ofensores.length > BASELINE_R59)
    fallos.push(
      `R59: ${ofensores.length} texto(s) crudo(s) fuera de una pieza de texto — ${ofensores.slice(0, 6).join(' · ')}${ofensores.length > 6 ? ` · …y ${ofensores.length - 6} más` : ''}. Si querías un COMENTARIO, en JSX va con llaves: \`{/* … */}\` — sin ellas es un nodo de texto y React Native lo tira como overlay rojo encima de la pantalla. Si querías MOSTRAR ese texto, va adentro de \`<Texto>\`.`,
    )
  // ANCLA: sin elementos JSX que recorrer, el cero diría «no miré».
  fallos.push(...ancla('R59', elementos, 100, 'elemento(s) JSX recorridos'))
  return { fallos, info: `${ofensores.length} texto(s) crudo(s) · ${elementos} elementos JSX recorridos · DURA EN ${BASELINE_R59}` }
}

/** R58 · `Texto` NO GANA UN COLOR DE ACENTO (S103-B · `N23`).
 *
 *  🔴 **POR QUÉ ESTO ES UN RATCHET DE NOMBRE Y NO SE DERIVA DEL CÓDIGO**
 *  (medido en S103-B, y cierra la pregunta de por qué cada jubilación paga
 *  su propia línea en vez de salir de un detector genérico):
 *  el censo intentó DETECTAR jubilaciones mirando el código y **falló en
 *  las dos direcciones** — contando solo comparaciones marcó **133 de 298
 *  miembros, el 45% del corpus** (*un instrumento que denuncia media casa
 *  mide su propia ceguera*); contando además las tablas de lookup
 *  **perdió el ancla**, porque `compacto` **está COMPLETAMENTE
 *  IMPLEMENTADA** y jubilada **por POLÍTICA**.
 *  ⇒ ***un valor prohibido por política es indistinguible de uno vivo
 *  mirando el código: solo la prosa dice que está prohibido.***
 *  **Cada jubilación nueva necesita su propia línea. No se derivan.**
 *
 *
 *  LA LEY, y es la única de la casa que pide IMPEDIR en vez de curar. Su
 *  propio censo lo dijo con todas las letras: *«la ley ya se cumple por
 *  construcción… no hay nada que curar, hay algo que IMPEDIR. El riesgo
 *  no es el código de hoy: es el `accent` que alguien le agregue mañana a
 *  `TextoColor` porque hace falta destacar un dato»*.
 *
 *  🔴 **Y HASTA HOY ESA LEY NO TENÍA MECANISMO** — vivía en un documento,
 *  que es donde vive lo que se cumple mientras alguien lo lea. *Una ley
 *  cuyo enunciado es «que nadie escriba esta línea» y que no puede ver la
 *  línea es una intención.*
 *
 *  ── QUÉ MIDE, Y POR QUÉ NO ES LA PALABRA ──────────────────────────
 *  Los MIEMBROS de la union `TextoColor`, no el archivo: `Texto.tsx`
 *  nombra `accent` legítimamente en prosa y en el header de esta misma
 *  clase de discusión. Cualquier miembro que **empiece con `accent`**
 *  —`accent`, `accentDark`, `accentControl`— es la línea que N23 nombra.
 *
 *  ── LO QUE ESTA REGLA NO PROHÍBE, y es la mitad que la vuelve justa ──
 *  **El color por ESTADO sigue siendo legal**, y N23 lo dice: sus tres
 *  familias son acción, **estado** y marca firmada. Lo que se prohíbe es
 *  la puerta GENÉRICA — un slot de color abierto en la pieza de texto,
 *  que el consumidor usa para «destacar un dato». La salida correcta
 *  existe y está construida: **una prop SEMÁNTICA en la pieza que tiene
 *  el estado** (`Celda.elegida`, §14), donde el tinte no está al alcance
 *  de quien la monta. *No se cierra el camino: se cierra el atajo.* */
const BASELINE_R58 = 0
function r58(archivos) {
  const fallos = []
  let miembros = 0
  const ofensores = []
  for (const { path, src } of archivos) {
    if (!/\/Texto\.tsx$/.test(path)) continue
    const m = sinComentarios(src).match(/export type TextoColor\s*=\s*([^\n]+)/)
    if (m === null) continue
    for (const bruto of m[1].split('|')) {
      const nombre = bruto.trim().replace(/^'|'$/g, '')
      if (nombre === '') continue
      miembros++
      if (/^accent/i.test(nombre)) ofensores.push(nombre)
    }
  }
  if (ofensores.length > BASELINE_R58)
    fallos.push(
      `R58: \`TextoColor\` ganó ${ofensores.length} miembro(s) de acento (${ofensores.join(' · ')}). N23: EL COLOR MARCA CLASE, JAMÁS IMPORTANCIA — lo importante dentro de un texto se marca con PESO o TAMAÑO, y el acento se reserva para lo ACCIONABLE y para lo que necesita ALARMA. Si lo que querés decir es un ESTADO ("ésta es la elegida"), no va acá: va como prop SEMÁNTICA en la pieza que tiene ese estado — el molde es \`Celda.elegida\` (§14), donde el consumidor declara el hecho y el tinte no está a su alcance.`,
    )
  // ANCLA: si `Texto` se renombra o su union se reescribe, este contador
  // daría 0 y su verde diría «no miré» en vez de «no hay» (L-192).
  fallos.push(...ancla('R58', miembros, 3, 'miembro(s) de la union TextoColor'))
  return { fallos, info: `${miembros} miembro(s) en TextoColor · ${ofensores.length} de acento · DURA EN ${BASELINE_R58}` }
}

/* ─────────────────────────────────────────────────────────────────────
   EL ENSANCHE DE R47 Y R48 A `packages/ui` (S103-B, tanda de mesa).

   🔴 EL DEFECTO QUE LO PIDIÓ, medido y no supuesto: **R47 y R48 cuentan
   un LITERAL, y su corpus es `apps/`.** Las dos cosas juntas dejan una
   puerta abierta del tamaño del design system: **una variante jubilada
   montada DENTRO de una pieza de `packages/ui` no emite literal en
   ninguna pantalla y no vive en el corpus** ⇒ revive repartida en N
   consumidores **sin mover el trinquete un punto**.

   El caso vivo que lo destapó: `BotonCopiar` nació con
   `variante = 'compacto'` de default. Cada consumidor que la montara sin
   pasar la prop habría puesto la variante muerta en su pantalla, y R47
   habría seguido diciendo 38. *Un trinquete vigilado por literal es
   ciego a lo que la pieza decide por vos.*

   ── SON DOS VÍAS, Y LA SEGUNDA ES LA PEOR ──────────────────────────
   ① **por DEFAULT** — la pieza propone y el consumidor puede corregir.
   ② **por LITERAL adentro de la pieza** — el consumidor **no tiene prop
      que pasar**: es un default sin puerta de salida. Se cuentan las dos
      porque, desde la pantalla que monta la pieza, **son la misma cosa**:
      montás un componente de la casa y te llevás una variante muerta sin
      haber escrito nunca su nombre.

   ── LOS TRES CUIDADOS QUE LA HACEN MEDIR LO QUE DICE ───────────────
   · **CONTADORES SEPARADOS, JAMÁS SUMADOS AL DE `apps/`.** Un literal en
     una pantalla es UN uso; un default en una pieza es una FUENTE de N
     usos, con N desconocido sin parsear a los consumidores. *Un agregado
     sobre objetos distintos no mide ninguno* (S99). Por eso el número de
     R47 sigue siendo el suyo y este ensanche no lo toca.
   · **SE MIDE EL TAG, NO LA PALABRA** — la misma disciplina que R48 ya
     tenía escrita. Medido en vivo: la galería monta
     `HeroMarca variante="compacto"` y `ChipEntidad` tiene
     `tamano = 'compacto'`; **contar la palabra habría gritado por dos
     piezas que no son `Boton`.** El default solo cuenta si su
     identificador **llega de verdad** a `<Boton variante={…}>`.
   · **LA GALERÍA QUEDA AFUERA, y no lo decide esta regla:** `RAICES_UI`
     es `components` + `brand`. La galería tiene 4 `Boton compacto` vivos
     y son de otra clase — *una pieza decide por todos sus consumidores;
     la galería no le llega a nadie más que a nosotros.* Se declara acá
     para que se sepa que el número existe y quedó fuera a propósito. */
const ES_PIEZA_UI = (p) => /packages\/ui\/src\/(components|brand)\//.test(p);

/** Los tags `<Boton …>` de un archivo. Cierra en el `>` de profundidad 0
 *  de llaves y fuera de comilla, así que un `titulo={a > b}` no lo parte
 *  al medio. `(?![A-Za-z0-9_])` es lo que evita que `<BotonCopiar` entre
 *  como si fuera `<Boton` — el prefijo compartido es una trampa real,
 *  porque la pieza del caso se llama justamente así. */
/** S103-B · el extractor deja de ser de `Boton` y pasa a ser de CUALQUIER
 *  pieza — Ley 11 aplicada al propio juez. `tagsDeBoton` sobrevive como
 *  envoltorio para que R47/R48 no se toquen: su medición se re-verifica
 *  igual (37 y 5, idénticas antes y después). */
const tagsDeBoton = (src) => tagsDe(src, 'Boton')
function tagsDe(src, nombre) {
  const out = [];
  for (const m of src.matchAll(new RegExp(`<${nombre}(?![A-Za-z0-9_])`, 'g'))) {
    let i = m.index + m[0].length, llaves = 0, comilla = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (comilla !== null) { if (c === comilla) comilla = null; continue; }
      if (c === '"' || c === "'" || c === '`') { comilla = c; continue; }
      if (c === '{') llaves++;
      else if (c === '}') llaves--;
      else if (c === '>' && llaves === 0) break;
    }
    out.push({ tag: src.slice(m.index, i + 1), index: m.index });
  }
  return out;
}

/** Las dos vías de una variante jubilada adentro de `packages/ui`.
 *  Devuelve además `montajes` — cuántas piezas montan `<Boton>` — que es
 *  el ANCLA: sin piezas que lo monten, este brazo no está mirando nada y
 *  su verde diría "no miré" en vez de "no hay" (L-192). */
function jubiladaEnPiezasUi(archivos, jubilada) {
  const porDefault = [], porLiteral = [];
  let montajes = 0;
  for (const { path, src: crudo } of archivos) {
    if (!ES_PIEZA_UI(path)) continue;
    const src = sinComentarios(crudo);
    const tags = tagsDeBoton(src);
    if (tags.length === 0) continue;
    montajes++;
    for (const { tag, index } of tags)
      if (tag.includes(`variante="${jubilada}"`))
        porLiteral.push(`${path}:${lineaDe(src, index)}`);
    // El default (o el const) que ALIMENTA a Boton. El identificador se
    // captura y se exige que llegue: `tamano = 'compacto'` de otra pieza
    // no reenvía a `Boton` y por eso no cuenta.
    for (const d of src.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=;{}]*?)?=\s*'([A-Za-z]+)'/g)) {
      if (d[2] !== jubilada) continue;
      const re = new RegExp(`variante=\\{\\s*${d[1]}\\s*\\}`);
      if (tags.some((t) => re.test(t.tag))) porDefault.push(`${path}:${lineaDe(src, d.index)}`);
    }
  }
  return { porDefault, porLiteral, montajes };
}

/** El brazo compartido: mismos dos conteos, distinta variante muerta.
 *  Vive una vez porque R47 y R48 se diferencian SOLO en el literal —
 *  Ley 11 aplicada al propio juez. */
function brazoUi(regla, archivos, jubilada, baseLiteral, reemplazo) {
  const { porDefault, porLiteral, montajes } = jubiladaEnPiezasUi(archivos, jubilada);
  const fallos = [];
  if (porDefault.length > 0)
    fallos.push(
      `${regla}: ${porDefault.length} pieza(s) de packages/ui montan \`Boton\` con \`${jubilada}\` POR DEFAULT (${porDefault.join(' · ')}). Un default NO emite el literal en ninguna pantalla ⇒ el contador de \`apps/\` sigue igual mientras la variante muerta se reparte por todos los consumidores. ${reemplazo} DURA EN 0: nació sin ofensores, así que prohíbe hacia adelante sin pedirle a nadie que cure nada hoy.`,
    );
  if (porLiteral.length > baseLiteral)
    fallos.push(
      `${regla}: \`Boton variante="${jubilada}"\` hardcodeado adentro de piezas de packages/ui subió a ${porLiteral.length} (baseline ${baseLiteral}, SOLO-BAJA) — ${porLiteral.join(' · ')}. Es peor que un default: el consumidor NO tiene prop que pasar para corregirlo. ${reemplazo}`,
    );
  fallos.push(...ancla(`${regla}·ui`, montajes, 1, 'pieza(s) de packages/ui que montan <Boton>'));
  return { fallos, porDefault, porLiteral, montajes };
}

/** R48 · EL ALIAS RENOMBRADO NO CRECE — `Boton sinCaja` → `apoyada`
 *
 *  🔴 **POR QUÉ ESTO ES UN RATCHET DE NOMBRE Y NO SE DERIVA DEL CÓDIGO**
 *  (medido en S103-B, y cierra la pregunta de por qué cada jubilación paga
 *  su propia línea en vez de salir de un detector genérico):
 *  el censo intentó DETECTAR jubilaciones mirando el código y **falló en
 *  las dos direcciones** — contando solo comparaciones marcó **133 de 298
 *  miembros, el 45% del corpus** (*un instrumento que denuncia media casa
 *  mide su propia ceguera*); contando además las tablas de lookup
 *  **perdió el ancla**, porque `compacto` **está COMPLETAMENTE
 *  IMPLEMENTADA** y jubilada **por POLÍTICA**.
 *  ⇒ ***un valor prohibido por política es indistinguible de uno vivo
 *  mirando el código: solo la prosa dice que está prohibido.***
 *  **Cada jubilación nueva necesita su propia línea. No se derivan.**
 *
 *  (S99-B, adjudicación de mesa).
 *
 *  LA LEY: el nombre mentía y **lo confesaba la propia pieza** (*«NO ES
 *  SIN CAJA: tiene `accent.sinCaja`… presencia de superficie»*).
 *  Renombrada a `apoyada`; el viejo queda como **alias aceptado y
 *  congelado**, y muere cuando este contador llegue a 0.
 *
 *  ── POR QUÉ ALIAS Y NO RENAME DURO ─────────────────────────────────
 *  5 usos vivos en `apps/` — territorio de C y de D. Un rename duro les
 *  rompe el typecheck a mitad de sesión para arreglar un NOMBRE, que es
 *  lo menos urgente que hay. **Mismo patrón que `compacto` (R47) y que
 *  `precio_plan` (S79): la casa jubila con lápida, no borra optimista.**
 *
 *  ⚠️ **Y ESTA REGLA CUENTA UNA SOLA COSA, A PROPÓSITO: `variante="…"`.**
 *  `sinCaja` vive en DOS piezas —`Boton` (renombrada) y `Campo` (otra
 *  semántica, **ya derogada por N11** y sobreviviendo solo en sus
 *  lápidas)—. Contar la palabra suelta metería las lápidas de `Campo` en
 *  el contador de `Boton` **y haría que documentar una muerte aumente
 *  una deuda ajena.** *Medir por la palabra habría sido la misma
 *  imprudencia que renombrar por grep.* */
const BASELINE_R48 = 5
/** El literal hardcodeado de `sinCaja` en piezas de `ui`: **medido en 0**
 *  al abrir la tanda. DURA EN 0 como el de default. */
const BASELINE_R48_UI = 0
function r48(archivos) {
  const fallos = []
  let usos = 0
  // ⚠️ EL FILTRO NO ES PROLIJIDAD: este contador es el de `apps/` y tiene
  // baseline propio. Si el corpus nuevo entrara acá, el número subiría
  // por un ensanche del instrumento y no por un uso nuevo — que es
  // exactamente lo que un trinquete no puede hacer.
  for (const { path, src } of archivos) {
    if (ES_PIEZA_UI(path)) continue
    usos += (sinComentarios(src).match(/variante="sinCaja"/g) ?? []).length
  }
  const ui = brazoUi(
    'R48',
    archivos,
    'sinCaja',
    BASELINE_R48_UI,
    'Cambiá el literal por `variante="apoyada"`: la pieza pinta EXACTAMENTE igual (el alias se resuelve en un solo lugar), así que es un cambio de nombre sin riesgo visual.',
  )
  fallos.push(...ui.fallos)
  if (usos > BASELINE_R48)
    fallos.push(
      `R48: \`Boton variante="sinCaja"\` subió a ${usos} (baseline ${BASELINE_R48}, SOLO-BAJA). Está RENOMBRADA a \`apoyada\` — el nombre viejo dice que no tiene caja y la variante tiene superficie propia (\`accent.apoyada\`). Cambiá el literal por \`variante="apoyada"\`: la pieza pinta EXACTAMENTE igual (el alias se resuelve en un solo lugar), así que es un cambio de nombre sin riesgo visual.`,
    )
  fallos.push(...ancla('R48', usos, 1, 'usos vivos del alias (0 = muere el alias, con firma)'))
  return {
    fallos,
    info: `${usos} uso(s) del alias \`sinCaja\` en apps · baseline ${BASELINE_R48} solo-baja · muere cuando llegue a 0 · ui: ${ui.porDefault.length} por default (DURA EN 0) · ${ui.porLiteral.length} hardcodeado(s) en piezas (baseline ${BASELINE_R48_UI}) sobre ${ui.montajes} pieza(s) que montan Boton`,
  }
}

/** R47 · LA VARIANTE JUBILADA NO CRECE — `Boton compacto` (S99-B).
 *
 *  🔴 **POR QUÉ ESTO ES UN RATCHET DE NOMBRE Y NO SE DERIVA DEL CÓDIGO**
 *  (medido en S103-B, y cierra la pregunta de por qué cada jubilación paga
 *  su propia línea en vez de salir de un detector genérico):
 *  el censo intentó DETECTAR jubilaciones mirando el código y **falló en
 *  las dos direcciones** — contando solo comparaciones marcó **133 de 298
 *  miembros, el 45% del corpus** (*un instrumento que denuncia media casa
 *  mide su propia ceguera*); contando además las tablas de lookup
 *  **perdió el ancla**, porque `compacto` **está COMPLETAMENTE
 *  IMPLEMENTADA** y jubilada **por POLÍTICA**.
 *  ⇒ ***un valor prohibido por política es indistinguible de uno vivo
 *  mirando el código: solo la prosa dice que está prohibido.***
 *  **Cada jubilación nueva necesita su propia línea. No se derivan.**
 *
 *
 *  LA LEY: **el contorno transparente como acción murió en la 19.7**, y
 *  `variante="compacto"` ES el contorno transparente. Jubilada por orden
 *  de mesa con su lápida en la pieza.
 *
 *  ── POR QUÉ RATCHET Y NO BORRADO ───────────────────────────────────
 *  39 sitios vivos en territorio de C y de D: sacarla del tipo les
 *  rompe el typecheck a mitad de sesión. **Se congela y baja sola** a
 *  medida que cada lote toca su pantalla. Precedente de la casa:
 *  `precio_plan` (S79) — lápida mecánica, jamás borrado optimista.
 *  **Muere de verdad cuando este contador llegue a 0.**
 *
 *  ── 🔴 ESTA ES *LA MITAD* DE R47, Y LA OTRA SIGUE SIN ESCRIBIRSE ────
 *  La receta pidió *«un sólido por superficie»*. **Esa mitad NO está
 *  acá**, y su razón sigue en pie: **el default de `Boton` es sólido**,
 *  así que los 48 botones sin `variante` no aparecen en ningún grep de
 *  `variante="primario"` — un contador ingenuo **bendeciría como
 *  preexistente lo que nunca contó** (el defecto que R44 pagó dos
 *  veces). Contarlos exige asociar atributos a través de JSX
 *  multilínea: parseo, no regex, y por eso es tanda propia.
 *
 *  *Lo que sí se puede medir hoy se mide hoy; lo que no, se dice que no
 *  se midió. Media regla honesta vale más que una entera que miente.* */
const BASELINE_R47 = 39
/** 🔴 EL NÚMERO QUE EL ENSANCHE DESTAPÓ: **DOS piezas vivas** de
 *  `packages/ui/src/components` hardcodean la variante jubilada —
 *  `AvisoAlergia` y `SelectorVentana`—, y **R47 contaba 0 por las dos**
 *  (corpus `apps/`). Cada pantalla que monta esas piezas se lleva el
 *  contorno transparente que la 19.7 mató, sin escribir su nombre.
 *
 *  Nace CONGELADO en 2 y solo-baja, no en 0: ponerlo en 0 dejaría el gate
 *  de la casa en rojo para todos hoy, por dos casos que son de C y de D y
 *  se curan al tocar su pantalla. **Mismo trato que la casa le dio a los
 *  39 y a los 5: se congela con lápida, no se borra optimista.**
 *
 *  *Y el detalle que lo vuelve caro: `SelectorVentana` lleva encima el
 *  comentario «Comando con consecuencias → viste de botón (Ley 22c)» —
 *  la misma ley que el mensaje de R47 cita para mandarla a `secundario`.
 *  La pieza invoca la ley que condena su elección.* */
const BASELINE_R47_UI = 2
function r47(archivos) {
  const fallos = []
  let usos = 0
  for (const { path, src } of archivos) {
    // ⚠️ El filtro conserva el corpus de este contador (ver R48): su
    // baseline es de `apps/` y un ensanche del instrumento no puede
    // moverlo. Lo de `packages/ui` lo cuenta el brazo de abajo, aparte.
    if (ES_PIEZA_UI(path)) continue
    // Sin comentarios: la lápida de la pieza y este propio header nombran
    // la variante, y contarlos haría que documentar la deuda la aumente.
    const n = (sinComentarios(src).match(/variante="compacto"/g) ?? []).length
    if (n > 0) usos += n
  }
  const ui = brazoUi(
    'R47',
    archivos,
    'compacto',
    BASELINE_R47_UI,
    'Reemplazo POR LO QUE LA ACCIÓN HACE: NAVEGA → label con chevron (`ghost` + `chevron`) · EJECUTA → label sin chevron (`ghost`) · y si tiene consecuencia de verdad no era terciaria: sube a `secundario` (Ley 22c).',
  )
  fallos.push(...ui.fallos)
  if (usos > BASELINE_R47)
    fallos.push(
      `R47: \`Boton variante="compacto"\` subió a ${usos} (baseline ${BASELINE_R47}, SOLO-BAJA). Está JUBILADA: el contorno transparente como acción murió en la 19.7 y esta variante ES el contorno transparente. Reemplazo POR LO QUE LA ACCIÓN HACE: NAVEGA → label con chevron (\`ghost\` + \`chevron\`) o \`CeldaNavegacion\` si es fila · EJECUTA → label sin chevron (\`ghost\`) · y si tiene consecuencia de verdad no era terciaria: sube a \`secundario\` (Ley 22c). ⚙️ El baseline BAJA solo: cada lote que toque una de sus pantallas la migra y el número queda abajo para siempre.`,
    )
  // ANCLA: si la variante se renombra, este contador daría 0 y su verde
  // diría «no miré» en vez de «ya no existe» (L-192 · L-226).
  fallos.push(...ancla('R47', usos, 1, 'usos vivos de la variante jubilada (0 = muere la regla, con firma)'))
  return {
    fallos,
    info: `${usos} uso(s) de la variante jubilada en apps · baseline ${BASELINE_R47} solo-baja · muere cuando llegue a 0 · ui: ${ui.porDefault.length} por default (DURA EN 0) · ${ui.porLiteral.length} hardcodeado(s) en piezas (baseline ${BASELINE_R47_UI}) sobre ${ui.montajes} pieza(s) que montan Boton`,
  }
}

/** R46 · EL SELECTOR DE INDICATIVO NO SE VA CON EL CAMPO QUE MUERE (S99-B).
 *
 *  LA LEY, dictada por mesa sobre un hallazgo de la Dirección de Diseño:
 *  *«al borrar el teléfono convencional, el selector de indicativo SE
 *  MUDA a WhatsApp, no se va con él.»*
 *
 *  🔴 POR QUÉ EXISTE, y por qué un comentario no alcanzaba: L2 manda
 *  *«muere el teléfono convencional; queda SOLO WhatsApp, obligatorio,
 *  con selector de indicativo de país»*. **Medido sobre la pantalla
 *  viva:** el teléfono usa `ControlTelefono` —el par selector+campo con
 *  UN pie, porque lo que se valida es el E.164 que forman JUNTOS— y el
 *  WhatsApp es un `Campo` desnudo. **O sea: el campo que MUERE es el
 *  único que hoy tiene el selector, y el que SOBREVIVE no lo tiene.**
 *
 *  ⚠️ **Y el modo de falla es que todo se ve bien:** un borrado prolijo
 *  deja exactamente la pantalla que la firma prohíbe —un WhatsApp
 *  obligatorio sin indicativo, componiendo un E.164 que la fuente rebota
 *  (`repartidores_telefono_check`)— y **el diff se lee como una resta**.
 *  Nadie revisa por qué algo NO se hizo. *Es la familia de S84: un dato
 *  viejo que dice «sí» se descubre al chocar; uno que dice «no se puede»
 *  no se descubre nunca.*
 *
 *  ── EL INVARIANTE, que vale ANTES y DESPUÉS del lote ───────────────
 *  **Toda superficie que le pide a un repartidor su WhatsApp compone al
 *  menos UN `ControlTelefono`.** Verdadero hoy (lo aporta el teléfono),
 *  verdadero cuando el teléfono muera (lo aporta el WhatsApp), y **falso
 *  exactamente en el estado que hay que impedir**. *Un guard que solo
 *  vale después del cambio no protege el cambio.*
 *
 *  ── LA EXENCIÓN ES LA DECLARACIÓN, jamás una lista de paths ─────────
 *  Mismo criterio que R45 (argumento de D): un path *«deja pasar en
 *  silencio a la segunda consumición que alguien agregue en ese mismo
 *  archivo»*. Una pantalla que **muestra o linkea** el WhatsApp del
 *  repartidor —en vez de capturarlo— lo dice en una línea y queda verde.
 *  ⚠️ Hueco residual declarado: si un archivo captura Y muestra, hereda
 *  la declaración. Estáticamente no lo distingo; lo digo en vez de
 *  fingir que el net lo cubre.
 *
 *  ── BASELINE 0, MEDIDO ─────────────────────────────────────────────
 *  Hoy **UN solo archivo** del árbol nombra repartidor y WhatsApp
 *  (`ventas/configuracion.tsx`) y trae 3 `ControlTelefono` ⇒ nace **dura
 *  en 0**, sin deuda. Su fixture carga las DOS legítimas (compone ·
 *  declara) además del rojo: *una regla nacida sin contra-caso no sabe
 *  discriminar; solo sabe disparar* (L-236). */
const BASELINE_R46 = 0
function r46(archivos) {
  const fallos = []
  let candidatos = 0
  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src)
    // Captura sospechada: la pantalla habla de un repartidor Y de su
    // WhatsApp. Se mide SIN comentarios para que esta misma regla, o un
    // JSDoc que la cite, no se cuenten como pantalla (L-170).
    if (!/epartidor/i.test(limpio) || !/whats\s*app/i.test(limpio)) continue
    candidatos++
    if (/ControlTelefono/.test(limpio)) continue
    // La salida honesta: declarar que acá no se captura (sobre el fuente
    // CRUDO — declarar ES prosa, igual que en R45).
    if (/no se captura|solo se muestra|solo lo muestra|no pide el whatsapp/i.test(src)) continue
    fallos.push(
      `R46: ${path} le pide a un repartidor su WhatsApp y NO compone \`ControlTelefono\`. L2 mata el teléfono convencional, y **ése es el único campo que hoy trae el selector de indicativo**: al borrarlo, el selector SE MUDA al WhatsApp — no se va con él. Sin selector, el E.164 sale sin \`+\` y la fuente lo rebota (\`repartidores_telefono_check\`), pero la pantalla se ve perfecta y el diff se lee como una resta. DOS SALIDAS: (a) componer el WhatsApp con \`ControlTelefono\` —el par selector+campo con UN pie, porque lo que se valida es el E.164 que forman JUNTOS— · (b) si esta pantalla MUESTRA el WhatsApp en vez de pedirlo, decirlo en una línea. ⚙️ CONDICIÓN MECÁNICA de (b): al lint le alcanza con la frase «no se captura» (o «solo se muestra») en un comentario.`,
    )
  }
  if (fallos.length > BASELINE_R46)
    fallos.push(`R46: ${fallos.length} superficie(s) sobre el baseline ${BASELINE_R46}.`)
  // ANCLA: si el vocabulario cambia (la ficha se muda de archivo y de
  // palabras), esta regla dejaría de encontrar pantallas y su verde
  // diría «no miré». Que se ponga roja y alguien la re-ancle es el
  // comportamiento correcto, no un defecto (L-226).
  fallos.push(...ancla('R46', candidatos, 1, 'pantalla(s) que piden el WhatsApp del repartidor'))
  return {
    fallos,
    info: `${candidatos} pantalla(s) piden el WhatsApp del repartidor · todas con selector de indicativo · baseline ${BASELINE_R46} (DURA EN 0 desde S99-B)`,
  }
}

/** R45 · D-828 · EL LECTOR DE RANGO NO SE CONSUME EN SILENCIO (S99-B).
 *
 *  LA LEY QUE MECANIZA, dictada por mesa y ya viva en el JSDoc del
 *  wrapper: *«toda superficie que migre a `listarPedidosDelVendedorEnRango`
 *  declara qué hace con `sinFecha` ANTES de mergear — montarlos
 *  PRESIDIENDO o nombrar quién los monta. **Nunca ninguna de las dos.**»*
 *
 *  🔴 POR QUÉ EXISTE, con su cicatriz: es **S72** repetida antes de
 *  ocurrir. La cita aprobada sin fecha (`por_coordinar`) no pasaba el
 *  `.gte('fecha', hoy)` de su lector ⇒ **el dueño aprobaba y su
 *  procedimiento no existía en NINGUNA superficie suya**. El motor estaba
 *  sano; la falla era **invisibilidad**, y su lección quedó escrita:
 *  *«la invisibilidad no tiene stack trace»*. La forma es la misma: cada
 *  superficie excluye por una razón localmente buena y **nadie es dueño
 *  de la suma**. Ninguna pantalla se ve mal — el pedido no está en
 *  ninguna.
 *
 *  ── 🔴 LA INVERSIÓN QUE ESTA REGLA NECESITA, Y ES DELIBERADA ────────
 *  **El consumo se mide SIN comentarios; la declaración se mide CON
 *  ellos.** Es al revés de la disciplina de la casa (L-170: *un censo
 *  lee los comentarios como código si se lo permitís*), y acá tiene que
 *  ser así por construcción:
 *   · si midiera el consumo con comentarios, **este mismo archivo y el
 *     JSDoc del wrapper saldrían rojos** por nombrar la función;
 *   · si midiera la declaración sin comentarios, **la salida legítima
 *     sería inexpresable** — declarar quién los monta ES prosa.
 *  *Una regla que mira el mismo texto de dos maneras tiene que decir por
 *  qué, o la próxima sesión la "arregla".*
 *
 *  ── EL NET, Y POR QUÉ NO ES UNA EXENCIÓN POR PATH ──────────────────
 *  La forma obvia era eximir al histórico por su ruta. **No se hizo, y
 *  el argumento es de D:** un path *«deja pasar en silencio a la segunda
 *  consumición que alguien agregue en ese mismo archivo»*, y choca con la
 *  ley de la casa —*una exención sin condición de muerte es un permiso
 *  permanente*—. **La declaración ES la exención**: vive en el archivo,
 *  se lee al abrirlo y no hay lista que se oxide.
 *  ⚠️ **Su hueco residual, declarado y no tapado:** si alguien agrega una
 *  SEGUNDA consumición con otro propósito al mismo archivo, hereda la
 *  declaración vieja. **Estáticamente no lo puedo distinguir** — lo digo
 *  en vez de fingir que el net lo cubre.
 *
 *  ── BASELINE 0, Y SE PUEDE PORQUE NO HAY CONSUMIDORES ──────────────
 *  Medido al nacer: **CERO superficies consumen el lector** (solo su
 *  definición y el re-export del índice, los dos exentos por ser la
 *  frontera). La regla nace **antes que su primer consumidor**, que es la
 *  única vez que un ratchet arranca sin deuda.
 *
 *  ⚠️ Y POR ESO SU FIXTURE CARGA EL PESO ENTERO (L-236, corolario):
 *  **no había una legítima real que eximir**, así que las dos legítimas
 *  del fixture son sintéticas y a propósito — una que MONTA y otra que
 *  DECLARA. *Una regla nacida sin contra-caso no sabe discriminar; solo
 *  sabe disparar.* */
const LECTOR_RANGO = 'listarPedidosDelVendedorEnRango'
/** La frontera que lo DEFINE y el índice que lo re-exporta no son
 *  superficies: no montan nada. */
const EXENTOS_R45 = [/wrappers\/despensa-vendedor\.ts$/, /packages\/api\/src\/index\.ts$/]
const BASELINE_R45 = 0
function r45(archivos) {
  const fallos = []
  let consumidores = 0
  let frontera = 0
  for (const { path, src } of archivos) {
    if (EXENTOS_R45.some((r) => r.test(path))) {
      if (sinComentarios(src).includes(LECTOR_RANGO)) frontera++
      continue
    }
    // el CONSUMO, sin comentarios (ver la inversión, arriba)
    if (!sinComentarios(src).includes(LECTOR_RANGO)) continue
    consumidores++
    // la DECLARACIÓN, sobre el fuente CRUDO: montarlos o nombrar a quién
    if (/sinFecha/.test(src)) continue
    fallos.push(
      `R45: ${path} consume ${LECTOR_RANGO} y NO dice una palabra de \`sinFecha\` (D-828). Los pedidos VIVOS sin día viajan en ese campo, y una superficie que los recibe y los ignora los vuelve invisibles sin que ninguna pantalla se vea mal — es S72 otra vez. DOS SALIDAS, nunca ninguna de las dos: (a) montarlos PRESIDIENDO la ventana · (b) declarar en el archivo QUIÉN los monta. ⚙️ LA CONDICIÓN MECÁNICA, para que no la adivines: al lint le alcanza con que el archivo MENCIONE \`sinFecha\` — un comentario sirve. Ej: «Los \`sinFecha\` no se montan acá: un vivo sin día no es pasado. Los monta ⟨la ventana del presente⟩.» La segunda frase no la puede juzgar un lint y es la que L-237 hace exigible: una omisión que no nombra a su dueño es un olvido que todavía no se nota.`,
    )
  }
  if (fallos.length > BASELINE_R45)
    fallos.push(`R45: ${fallos.length} superficie(s) sobre el baseline ${BASELINE_R45}.`)
  // ANCLA: si la frontera se renombra, la regla no encontraría consumo en
  // ningún lado y su verde diría «no miré» (L-192).
  fallos.push(...ancla('R45', frontera, 2, 'archivo(s) de frontera que nombran el lector'))
  return {
    fallos,
    info: `${consumidores} superficie(s) consumen el lector · ${consumidores === 0 ? 'la regla nació ANTES que su primer consumidor' : 'todas declaran qué hacen con `sinFecha`'} · baseline ${BASELINE_R45}`,
  }
}


/** R52 · «PROGRAMAR OTRA FECHA» NO VUELVE (S100 · G-16, firma del founder 17-ago-2026).
 *
 *  EL CASO QUE LA PARIÓ: el founder pidió quitar ese control **repetidamente**
 *  y **volvía a aparecer en cada ronda**. La causa no fue desobediencia:
 *  `LETRA_RECORRIDO_DESPENSA_S96` §6.2 decía **«Entra»**, y **la letra gana**
 *  porque es lo único que la pista siguiente lee.
 *
 *  🔴 LA LEY QUE MECANIZA: *una decisión que no queda escrita se vuelve a
 *  proponer.* La letra ya quedó derogada y tachada; esto es el diente, porque
 *  **una ley que vive en el lint no se degrada.**
 *
 *  QUÉ MIDE: que la superficie de la despensa no monte el control. NO mide el
 *  motor — `calcular_promesa_despensa` conserva `p_fecha_programada` a
 *  propósito: *se quitó la puerta, no el motor.*
 */
/* 🔴 R53 · UN PIE FIJO RESERVA SU PROPIO LUGAR (S100b-B).

   EL DEFECTO QUE LA OBLIGA, medido en el aparato: el pie fijo se pintaba
   ENCIMA del contenido en CINCO pantallas de la despensa, y en la ficha lo
   tapado era **la composición y los alérgenos** — con la ficha sin scroll,
   o sea inalcanzables.

   La causa no era el pie: era que el contenido **estimaba** su alto.
   Literal de la ficha antes de la cura:
       paddingBottom: insets.bottom + (conCta ? spacing[8] + 96 : spacing[8])
   El `96` es el alto del pie TECLEADO. Ese pie lleva dos botones apilados.

   ⚠️ **POR QUÉ NINGÚN INSTRUMENTO LO CAZÓ ANTES, y es lo que justifica que
   esta regla exista:** el nodo tapado **sigue en el árbol de accesibilidad**
   — medido, el lector anuncia la composición que el ojo no ve. *Un check
   que lea el árbol da VERDE sobre este defecto.* Hubo que mirar la pantalla.

   QUÉ CAZA: un contenedor `position:'absolute'` con `bottom: 0` en una
   pantalla de app que **no** monta `PantallaConPie`. Baseline SOLO-BAJA con
   los 11 medidos al nacer; cada migración lo baja.

   ⚠️ SU LÍMITE, ESCRITO: la regla ve **la forma** (un pie absoluto a mano),
   no si el `paddingBottom` alcanza. *Su verde dice «acá el pie lo pone la
   pieza», jamás «acá nada tapa a nada».* La segunda mitad no se mecaniza
   honestamente — se cura por construcción, que es de lo que trata la pieza. */

/* 🔴 R57 · LA SECCIÓN DE PAGO ES **UNA**, Y SE MIDE (S101-C, orden ⑤ del
   founder: *«se verifica contra el objeto que las dos pantallas rinden lo
   mismo — no se replica a ojo»*).

   ── EL DEFECTO QUE CIERRA, medido antes de existir ───────────────────
   La despensa y el checkout de los cuatro oficios tenían **la misma sección
   escrita dos veces**: mismo `useState` de medios, misma regla de
   preselección, misma `Hoja`, mismo botón. Y **ya habían empezado a
   separarse**: el botón de una era `bloque` en un pie fijo y el de la otra
   era chico y vivía suelto en el scroll.

   > *Dos copias no divergen el día que se escriben: divergen el día que
   > alguien afina una. Y la que NO se afina no da error — se queda vieja.*

   ── QUÉ MIDE, y por qué así ──────────────────────────────────────────
   ① las dos pantallas de checkout **montan `SeccionMedioDePago` y
      `BotonPagar`** (si una deja de montarlos, se fue de la pieza única);
   ② **nadie más que el módulo compartido monta `FilaMedioDePago` con
      `zonaFin`** ni abre su propia `Hoja` de medios — *el modo de falla real
      no es borrar la pieza: es dejarla y escribir una versión propia al
      lado.*

   ⚠️ **SU LÍMITE, declarado:** mide QUE MONTEN LA MISMA PIEZA, **jamás que
   se vean igual en pantalla**. Dos pantallas pueden montar el mismo
   componente y envolverlo distinto. *Su verde dice «hay una sola fuente»,
   no «se ven idénticas» — eso lo dice el ojo del founder en el gate.* */
const CHECKOUTS_DE_PAGO = [
  'apps/cliente/src/app/(tabs)/despensa/checkout.tsx',
  'apps/cliente/src/components/checkout-reserva.tsx',
]
const DUENO_SECCION_PAGO = 'apps/cliente/src/components/seccion-medio-de-pago.tsx'

function r57(archivos) {
  const fallos = []
  const porPath = new Map()
  for (const { path, src } of archivos) if (!porPath.has(path)) porPath.set(path, src)

  // ① los dos checkouts montan la pieza única
  for (const ruta of CHECKOUTS_DE_PAGO) {
    const src = porPath.get(ruta)
    if (src === undefined) { fallos.push(`${ruta}: no está en el corpus`); continue }
    const limpio = sinComentarios(src)
    if (!/<SeccionMedioDePago\b/.test(limpio)) fallos.push(`${ruta}: no monta SeccionMedioDePago`)
    if (!/<BotonPagar\b/.test(limpio)) fallos.push(`${ruta}: no monta BotonPagar`)
  }

  // ② nadie escribe una versión propia al lado
  for (const [path, src] of porPath) {
    if (path === DUENO_SECCION_PAGO) continue
    const limpio = sinComentarios(src)
    if (/<FilaMedioDePago[^>]*zonaFin=/.test(limpio)) {
      fallos.push(`${path}: arma su propia fila de medio (zonaFin fuera del dueño)`)
    }
  }

  return {
    fallos,
    info: `${CHECKOUTS_DE_PAGO.length} checkout(s) de pago · los ${CHECKOUTS_DE_PAGO.length} montan `
      + `SeccionMedioDePago + BotonPagar · 0 versión/es propia(s) fuera de `
      + `\`seccion-medio-de-pago\` · baseline 0 · mide QUE MONTEN LA MISMA PIEZA, `
      + `jamás que se vean igual (eso lo dice el ojo del founder)`,
  }
}

/* 🔴 R56 · EL ORO NO ES TINTA EN EL CLIENTE (S100d·bis, relevo de B · H-207).

   `Boton variante="acento"` es **letra `accent.cta` sin relleno**. En el
   cliente ese slot es el oro, y el oro como TINTA no llega en ninguna
   superficie clara:

       ocre sobre carta blanca ……… 1,70      piso: texto 4,5 · grande 3,0
       ocre sobre el fondo neutro … 1,57
       tinta sobre relleno ocre …… 9,96      ← `primario`, el otro lado del par

   **Y no es un criterio nuevo: `ctaOro` lo declara donde nace**, en
   `palette.ts` — *«sobre papel 1.62 NO rige»*. Esta variante hace eso.

   ── POR QUÉ MIRA LA APP Y NO LA VARIANTE SOLA ────────────────────────
   **En el prestador el MISMO slot resuelve a `tealDark` y da 5,37** ⇒ ahí la
   variante es legítima y sus 4 montajes se quedan. *Marcar la variante en
   abstracto habría gritado sobre cuatro casos correctos, que es como se
   enseña a ignorar un lint* (L-236).

   ⚠️ **SU LÍMITE, declarado:** mira el tema CLARO, que es el que la familia
   usa por defecto y el que el founder camina. En oscuro el oro cae sobre
   superficie oscura y el par cambia. *Su rojo dice «acá el oro va como
   tinta», jamás «esto es ilegible en todos los temas».*

   ── DURA EN 0 — Y NACIÓ SOLO-BAJA CON UN CASO ADENTRO ────────────────
   ⏪ **Nació con `hogar/index.tsx` en su baseline**, declarado como *deuda con
   dueño y no exención*: el ocre como acción es **F-OCRE**, y cambiarle el
   color a un acento recién firmado no era de esta pista.

   ✅ **El founder lo firmó el mismo día y el baseline murió con la firma:**
   *«el ocre NO se usa como tinta sobre fondo — se usa como RELLENO con letra
   tinta encima»*. El caso pasó a `primario` (**1,70 → 9,96**) y esta regla
   **DURA EN 0**. *Un baseline que se vacía por decisión, y no por
   costumbre.* */
const BASELINE_R56 = []

function r56(archivos) {
  const fallos = []
  const vistos = new Set()
  const ofensores = []
  for (const { path, src } of archivos) {
    if (vistos.has(path)) continue
    vistos.add(path)
    if (!path.startsWith('apps/cliente/')) continue
    const limpio = sinComentarios(src)
    for (const _ of limpio.matchAll(/variante=\{?["']acento["']\}?/g)) ofensores.push(path)
  }
  const nuevos = [...new Set(ofensores)].filter((p) => !BASELINE_R56.includes(p))
  if (nuevos.length > 0)
    fallos.push(
      `R56: ${nuevos.length} \`Boton variante="acento"\` nuevo(s) en el cliente (baseline ${BASELINE_R56.length}, SOLO-BAJA).\n   ${nuevos.join('\n   ')}\n   Esa variante es LETRA oro sin relleno: 1,70 sobre carta blanca y 1,57 sobre el fondo — el piso de texto es 4,5. Si querés el oro visible usá \`primario\` (relleno ocre + letra tinta = 9,96), que es el par que la casa ya usa en CarritoFlotante y en el stepper.`,
    )
  /* ANCLA POR SUJETO (L-291): la regla existe porque la receta de `acento`
     es texto sin relleno. Si dejara de serlo, vigila un defecto que ya no
     existe. */
  const fuente = readFileSync('packages/ui/src/components/Boton.tsx', 'utf8')
  const vivo = /acento:\s*\{ fondo: 'transparent', texto: theme\.accent\.cta \}/.test(fuente) ? 1 : 0
  fallos.push(...ancla('R56', vivo, 1, '`acento` sigue siendo letra sin relleno (0 = la receta cambió y esta regla perdió su sujeto)'))
  return {
    fallos,
    info: `${[...new Set(ofensores)].length} montaje(s) de \`acento\` en el cliente · DURA EN 0 (nació SOLO-BAJA con hogar/index adentro; el founder firmó la enmienda a F-OCRE el mismo día y el caso pasó a \`primario\`: 1,70 → 9,96) · el prestador queda fuera A PROPÓSITO: ahí el slot es teal y da 5,37`,
  }
}

/* 🔴 R55 · EL TOPE LO PAGA `Encabezado`, Y NADIE MÁS (S100d·bis, relevo de B).

   ── EL DEFECTO, MEDIDO EN APARATO SOBRE EL BUNDLE `01a01807` ──────────
   **Founder, recorriendo las cinco tabs:** *«Explorar está más abajo, Despensa
   más arriba, Tus pedidos igual que Despensa, y Tu cuenta vuelve a estar más
   abajo»*. **El primer texto de cada tab, medido:**

       Despensa · Tus pedidos …… 54,0 dp   ← la vara que firmó el founder
       Explorar · Tu cuenta …… 88,2 dp

   **88,2 − 54,0 = 34,2 = `insets.top`** (34,13 leído del `cutoutSpec` del
   aparato). **El inset se pagaba DOS VECES**, y las dos pantallas que lo
   pagaban eran exactamente las dos envueltas en `SafeAreaView edges={['top']}`.

   ── 🔴 POR QUÉ ESTO ES UNA REGLA Y NO UNA CURA DE DOS ARCHIVOS ────────
   **`Encabezado` YA traía la cura** —deriva su inset midiendo dónde quedó
   parado— **y estaba corriendo, y el defecto estaba en la pantalla igual.**
   Medido, con el discriminador que lo prueba:

       carnet.tsx      → padre con `paddingTop` en JS   → derivó 0   ✅ 34,1 dp
       explorar/index  → padre `SafeAreaView` (nativo)  → derivó 34  ❌ 88,2 dp

   *La medición pierde su carrera contra un padre que aplica su padding del
   lado nativo, y **falla hacia su valor de arranque —el conservador— sin
   decirlo**.* ⇒ **una cura cuyo modo de falla es el silencio no es una cura**
   (L-192), y por eso el sujeto de esta regla no es el techo: **son los
   consumidores.** Con ninguno reservando, la derivación queda siempre en el
   caso que sí funciona, y esta regla es lo que lo sostiene.

   ── QUÉ CAZA, Y QUÉ NO ────────────────────────────────────────────────
   Caza una reserva del tope (`edges={['top']}` o `paddingTop: insets.top`)
   **en la línea que abre el envoltorio de un `<Encabezado`**, saltando
   comentarios y envoltorios de layout.

   ⚠️ **ES POR OCURRENCIA, JAMÁS POR ARCHIVO — y la diferencia se midió.**
   `checkout-reserva.tsx` tiene **cinco** `SafeAreaView edges={['top']}` y
   **solo la quinta envuelve un techo**; las otras cuatro son estados
   centrados (procesando, éxito, rechazo, hold vencido) **que no montan
   `Encabezado` y por lo tanto SÍ deben reservar el tope**. *Una regla por
   archivo las habría marcado a las cinco y la cura habría metido cuatro
   pantallas debajo de la barra de estado* — el sobre-disparo que L-236 y el
   propio R54 ya cobraron una vez.

   ⚠️ **SU LÍMITE, dicho:** ve el envoltorio inmediato. Un componente propio
   que adentro reserve el tope **no lo ve**. *Su verde dice «ningún envoltorio
   de techo reserva el tope», jamás «todos los techos arrancan a la misma
   altura»* — eso lo dice el aparato.

   ── 🔴 EL HOGAR NO ES UN HUECO DE ESTA REGLA: ES UNA DECISIÓN ─────────
   **`hogar/index.tsx` NO monta `Encabezado`** — tiene **hero propio**
   (`HeroMarca techoVivo`), y su primer texto arranca en **114,1 dp** con el
   saludo en **136,9**, contra la vara de **54,0**.

   **FIRMA DEL FOUNDER, 18-ago-2026, verbatim:** *«el Hogar va a necesitar
   tratamiento especial, por ahora no lo toquemos»*. ⇒ **queda fuera de la
   vara A PROPÓSITO y con fecha**, no por olvido ni por límite del
   instrumento.

   ⛔ **NO se «alinea a Despensa» y esta regla no lo persigue.** *No es el
   mismo objeto pintado más abajo: es otro objeto* — alinearlo es una
   decisión de diseño, no una cura de inset. **Se escribe acá porque una
   decisión de NO construir que no queda escrita se vuelve a proponer**, y la
   próxima pista que lea la tabla de alturas va a ver 114,1 y querer
   arreglarlo. */
const BASELINE_R55 = 0

function r55(archivos) {
  const fallos = []
  const vistos = new Set()
  const ofensores = []
  const RESERVA = /edges=\{\[['"]top|paddingTop:\s*insets\.top/
  for (const { path, src } of archivos) {
    if (vistos.has(path)) continue
    vistos.add(path)
    if (!/<Encabezado\b/.test(src)) continue
    const lineas = src.split('\n')
    for (let i = 0; i < lineas.length; i++) {
      if (!RESERVA.test(lineas[i])) continue
      /* El primer elemento JSX de adentro. Se saltan comentarios y
         envoltorios de layout puro: el techo puede vivir un piso más
         adentro sin dejar de estar envuelto por esta reserva. */
      for (let j = i + 1; j < Math.min(i + 10, lineas.length); j++) {
        const s = lineas[j].trim()
        if (!s || /^(\{\/\*|\*|\/\/|<View|<ScrollView|<PantallaConPie)/.test(s)) continue
        if (s.startsWith('<Encabezado')) ofensores.push(`${path}:${i + 1}`)
        break
      }
    }
  }
  if (ofensores.length > BASELINE_R55)
    fallos.push(
      `R55: ${ofensores.length} envoltorio(s) de \`Encabezado\` reservando el tope (baseline ${BASELINE_R55}, DURA EN 0).\n   ${[...new Set(ofensores)].join('\n   ')}\n   El techo ya paga el inset de arriba: reservarlo también acá lo cobra DOS VECES y la pantalla arranca 34 dp más abajo que las demás (medido: 88,2 contra la vara de 54,0). Sacá la reserva de este envoltorio — \`edges={[]}\`, o quitá el \`paddingTop: insets.top\`.`,
    )
  /* ANCLA POR SUJETO (L-291): esta regla existe porque el TECHO paga el
     tope. Si dejara de pagarlo, prohibirle al consumidor que lo pague deja
     a todas las pantallas debajo de la barra de estado — la regla pasaría
     de proteger a causar el defecto. */
  const fuente = readFileSync('packages/ui/src/components/Encabezado.tsx', 'utf8')
  const vivo = /useSafeAreaInsets\(\)/.test(fuente) && /paddingTop: insetFaltante/.test(fuente) ? 1 : 0
  fallos.push(
    ...ancla('R55', vivo, 1, '`Encabezado` sigue pagando el inset de arriba (0 = dejó de pagarlo y esta regla pasó de proteger a causar el defecto)'),
  )
  return {
    fallos,
    info: `${ofensores.length} envoltorio(s) de techo reservando el tope · DURA EN 0 · POR OCURRENCIA y no por archivo (checkout-reserva tiene 5 SafeAreaView y solo 1 envuelve techo) · su verde dice «nadie lo reserva dos veces», jamás «todos arrancan igual»`,
  }
}

/* 🔴 R54 · EL PIE NO SE ENVUELVE EN UN VIEW QUE CAPTURE (S100b-B).

   LA TRAMPA: `PantallaConPie` lleva `pointerEvents="box-none"` para que el
   gesto de scroll pase entre los botones — **pero eso cubre UNA capa.** Un
   `View` intermedio del consumidor vuelve a capturar el toque en todo su
   rectángulo y **reabre la zona muerta de gesto**, que es el defecto rojo
   que la pieza vino a cerrar: con el pie capturando, el tercio inferior de
   la pantalla no scrollea — *y ahí es donde una familia apoya el pulgar.*

   ⚠️ SU LÍMITE: caza `pie={<View` sin `box-none` en la misma expresión.
   **No ve un componente propio que adentro tenga un View** — eso no se
   mecaniza honestamente y se enseña. *Su verde dice «no envolviste el pie
   en un View desnudo», jamás «el gesto pasa».* */
const BASELINE_R54 = 0

function r54(archivos) {
  const fallos = []
  const vistos = new Set()
  const ofensores = []
  for (const { path, src } of archivos) {
    if (vistos.has(path)) continue
    vistos.add(path)
    const limpio = sinComentarios(src)
    /* 🔴 ACOTADA A `PantallaConPie` — y la acoté porque SOBRE-DISPARÓ en su
       primera corrida. Cazó `como-te-ven.tsx`, que monta `FichaPrestador`
       —otra pieza que también expone una prop `pie`, y cuyo pie NO es un
       overlay fijo, así que `box-none` ahí no significa nada.
       *Una regla que grita sobre un caso legítimo enseña a ignorarla*
       (L-236). Lo delató que su baseline dijera 0 y ella dijera 1: dos
       números que no coincidían, y esta vez sí los crucé. */
    if (!/\bPantallaConPie\b/.test(limpio)) continue
    for (const m of limpio.matchAll(/pie=\{\s*<View([\s\S]{0,220}?)>/g)) {
      if (!/pointerEvents=\{?["']box-none["']\}?/.test(m[1])) ofensores.push(path)
    }
  }
  if (ofensores.length > BASELINE_R54)
    fallos.push(
      `R54: ${ofensores.length} pie(s) envuelto(s) en un \`View\` sin \`pointerEvents="box-none"\` (baseline ${BASELINE_R54}, DURA EN 0).\n   ${[...new Set(ofensores)].join('\n   ')}\n   Un View intermedio captura el toque en todo su rectángulo y reabre la ZONA MUERTA DE GESTO: el tercio inferior deja de scrollear. Pasá el pie como fragmento (\`pie={<><Boton/><Boton/></>}\`), o ponele \`pointerEvents="box-none"\` a ese View.`,
    )
  /* ANCLA POR SUJETO (L-291): lo que esta regla necesita no es que alguien
     la viole, sino que la pieza siga declarando su `box-none`. Si eso
     desaparece, la regla vigila una trampa que ya no existe — o peor,
     deja de vigilar la que sí. */
  const fuente = readFileSync('packages/ui/src/components/PantallaConPie.tsx', 'utf8')
  const vivo = /pointerEvents="box-none"/.test(fuente) ? 1 : 0
  fallos.push(...ancla('R54', vivo, 1, '`box-none` declarado en PantallaConPie (0 = la pieza dejó de dejar pasar el gesto y esta regla perdió su sujeto)'))
  return {
    fallos,
    info: `${ofensores.length} pie(s) envuelto(s) sin box-none · DURA EN 0 · acotada a PantallaConPie (sobre-disparaba contra la prop pie de FichaPrestador) · su verde dice «no hay View desnudo», jamás «el gesto pasa»`,
  }
}

const BASELINE_R53 = [
  'apps/cliente/src/app/(tabs)/despensa/carrito.tsx',
  'apps/cliente/src/app/(tabs)/despensa/checkout.tsx',
  'apps/cliente/src/app/(tabs)/despensa/index.tsx',
  'apps/cliente/src/app/(tabs)/despensa/producto/[productoId].tsx',
  'apps/cliente/src/app/(tabs)/hogar/index.tsx',
  'apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx',
  'apps/cliente/src/app/(tabs)/hogar/veterinaria.tsx',
  'apps/cliente/src/app/paseo/[atencionId].tsx',
  'apps/cliente/src/app/prestador/[prestadorId].tsx',
  'apps/prestador/src/app/(tabs)/cuenta/index.tsx',
  'apps/prestador/src/app/bienvenida-dia1.tsx',
]

function r53(archivos) {
  const fallos = []
  const vistos = new Set()
  const ofensores = []
  const declarados = []
  for (const { path, src } of archivos) {
    if (vistos.has(path)) continue
    vistos.add(path)
    const limpio = sinComentarios(src)
    // El pie a mano: absolute + bottom:0 cerca. Ventana corta para no
    // confundirlo con un absolute de otra cosa (un badge, un overlay).
    /* 🔴 SE CUENTAN LOS PIES, NO SE PREGUNTA SI HAY UNO. La condición de
       mesa es explícita: *si mañana alguien pone contenido de página bajo
       un pie fijo en esa ruta, la regla tiene que volver a morder*. Con un
       `test()` booleano y un escape por archivo, **el segundo pie entraría
       gratis** — que es exactamente la objeción que esta casa le hizo a la
       exención por ruta, repetida un piso más arriba. */
    const pies = [...limpio.matchAll(/position:\s*'absolute'[\s\S]{0,160}?bottom:\s*0\b/g)].length
    if (pies === 0) continue
    // Si monta la pieza, el pie ya reserva: no es ofensor.
    if (/\bPantallaConPie\b/.test(limpio)) continue
    /* 🔴 EL ESCAPE POR DECLARACIÓN — S100b-B, tras el primer caso legítimo
       que la regla cazó (la hoja sobre el mapa de «en camino», al
       ensamblar el bundle).

       **Por qué existe:** R53 caza LA FORMA —un pie absoluto a mano— y hay
       una anatomía distinta que tiene esa misma forma y **no puede tener
       el defecto**: una HOJA con `maxHeight` cuyo scroll vive ADENTRO.
       Ahí *la hoja ES el contenido*, así que **no hay dos cosas que
       reservar una para la otra** y el defecto es inexpresable. Montar
       `PantallaConPie` sería peor: el fondo no scrollea, así que la pieza
       no tendría nada que reservar.

       **Por qué DECLARACIÓN y no una lista de rutas** (que era el camino
       barato, y el mecanismo ya existía porque el baseline es por ruta):
       *una lista de paths deja pasar en silencio al SEGUNDO pie que
       alguien agregue en ese mismo archivo* — la objeción es la que esta
       casa ya escribió en R45/R46. **La declaración viaja con el pie, no
       con el archivo.**

       ⚙️ **Se busca en `src` CRUDO y no en `limpio`**: declarar ES prosa,
       igual que en R45. Si se buscara en el texto sin comentarios, la
       única forma de declarar sería con código.

       🔴 **Y EXIGE UNA RAZÓN ESCRITA, no una marca pelada:** el patrón
       pide ≥16 caracteres después de los dos puntos. *Un marcador vacío
       sería un `SALTAR_GATE` con otro nombre — y lo que hace honesto a un
       escape no es que exista: es que cueste una frase que alguien pueda
       leer y discutir.* Los declarados se CUENTAN y se informan, así que
       si empiezan a crecer se ve. */
    /* UNA DECLARACIÓN POR PIE. Si hay dos pies y una sola razón escrita,
       **el que sobra sigue siendo ofensor** — el escape cubre lo que
       alguien se tomó el trabajo de justificar, y nada más.

       ⚠️ SU LÍMITE, ESCRITO: el lint cuenta, **no puede saber CUÁL
       declaración corresponde a CUÁL pie**. *Su verde dice «hay tantas
       razones escritas como pies», jamás «cada razón es la correcta».*
       Esa mitad no se mecaniza honestamente y se lee en revisión. */
    const razones = [...src.matchAll(/R53-DECLARADO:\s*\S.{15,}/g)].length
    if (razones >= pies) {
      declarados.push(path)
      continue
    }
    ofensores.push(`${path}${razones > 0 ? `  (${pies} pie(s), ${razones} declarado(s))` : ''}`)
  }
  const nuevos = ofensores.filter((o) => !BASELINE_R53.some((b) => o.endsWith(b) || b.endsWith(o)))
  if (nuevos.length > 0)
    fallos.push(
      `R53: ${nuevos.length} pantalla(s) NUEVA(S) dibujan un pie fijo a mano (baseline ${BASELINE_R53.length} congelado por RUTA). Un pie que el consumidor posiciona es un pie cuyo alto el consumidor tiene que ESTIMAR — y estimarlo es el defecto que tapó la composición y los alérgenos en la ficha. Montá \`PantallaConPie\`: el pie se mide a sí mismo y esa misma medida reserva el scroll.\n   ${nuevos.join('\n   ')}`,
    )
  /* EL ANCLA MIDE EL SUJETO, JAMÁS A LOS INFRACTORES (L-291): lo que esta
     regla necesita para no estar ciega no es que alguien la viole —el día
     que las 11 migren, `ofensores` es 0 y eso es su ÉXITO— sino que la
     pieza a la que manda SIGA EXISTIENDO. Si `PantallaConPie` desaparece,
     la regla apunta a la nada y su silencio pasa a significar «no miré». */
  const indice = readFileSync('packages/ui/src/index.ts', 'utf8')
  const destino = /export \{\s*PantallaConPie\b/.test(indice) ? 1 : 0
  fallos.push(...ancla('R53', destino, 1, 'la pieza destino `PantallaConPie` exportada desde packages/ui (0 = la regla se quedó sin a dónde mandar)'))
  return {
    fallos,
    info: `${ofensores.length} con pie fijo a mano · ${declarados.length} declarado(s)${declarados.length > 0 ? ` (${declarados.map((d) => d.split('/').pop()).join(' · ')})` : ''} · baseline ${BASELINE_R53.length} congelado por ruta · su verde dice «el pie lo pone la pieza», jamás «nada tapa a nada»`,
  }
}

/* 🔴 EL BASELINE MURIÓ EN S100b-A, y la regla NO: son dos cosas distintas.
   El 1 no era una excepción de diseño — era la orden de mesa al registrar el
   gate («no curar nada, S101 lo toma con plan»). **Esa razón se agotó cuando
   el control salió**, así que la deuda se cierra en su número y la ley pasa a
   DURA EN 0. Lo que muere es la tolerancia, jamás el diente: R52 existe para
   que el control **no vuelva**, y ese trabajo empieza recién ahora. */
const BASELINE_R52 = 0

function r52(archivos) {
  const fallos = []
  const vistos = new Set()
  const ofensores = []
  for (const { path, src } of archivos) {
    if (!path.includes('/despensa/')) continue
    // Los dos corpus se solapan: sin dedup el mismo archivo cuenta dos veces
    // y el baseline mide el solape en vez del defecto.
    if (vistos.has(path)) continue
    vistos.add(path)
    const limpio = sinComentarios(src)
    if (/onProgramarOtra\s*=|despensa\.programarFecha|despensa\.programarPlaceholder/.test(limpio)) {
      ofensores.push(path.split('/').pop())
    }
  }
  // ☠️ DURA EN 0 desde S100b-A: el control salió del checkout y la tolerancia
  // se cerró con él (ver la nota del baseline). De acá en más cualquier
  // reaparición es un fallo, que es exactamente para lo que la regla se
  // escribió — el control ya volvió tres veces.
  if (ofensores.length > BASELINE_R52)
    fallos.push(
      `R52: «Programar otra fecha» está montado en ${ofensores.length} archivo(s) (${ofensores.join(' · ')}), baseline ${BASELINE_R52} SOLO-BAJA. DEROGADO por firma del founder (17-ago-2026, gate de S100) y tachado en \`LETRA_RECORRIDO_DESPENSA_S96\` §6.2. El control SALE del checkout; el CUPO por día futuro y el \`p_fecha_programada\` del motor SIGUEN VIGENTES — se quitó la puerta, no el motor.`,
    )
  fallos.push(...ancla('R52', archivos.filter((a) => a.path.includes('/despensa/')).length, 1, 'archivo(s) de despensa en el corpus'))
  return {
    fallos,
    info: `${ofensores.length} monta(n) el control derogado · DURA EN 0 desde S100b-A (la puerta salió; el \`p_fecha_programada\` del motor sigue vivo) · firma founder 17-ago-2026`,
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * R63 · UNA SUPERFICIE NO PROMETE UNA RUTA QUE NADIE SIRVE (S104-B).
 *
 * 🔴 LA MEDICIÓN QUE DIO VUELTA EL DISEÑO, y hay que leerla antes de
 *    tocar esta regla: **`typedRoutes: true` está encendido en las dos
 *    apps**, y `.expo/types/router.d.ts` declara `href` como un UNION DE
 *    LITERALES de cada ruta real. ⇒ `router.push('/no-existe')` **ya no
 *    compila**. El que frena es el COMPILADOR, no un lint (L-396: el modo
 *    de falla decide la herramienta).
 *
 *    ⚠️ **PERO ESE ARCHIVO ES GENERADO Y ESTÁ EN `.gitignore`.** No existe
 *    en un worktree recién creado ni en un clon limpio, y se regenera solo
 *    cuando alguien corre `expo start`. **Medido al escribir esta regla:
 *    el del prestador tenía SEIS DÍAS de atraso respecto de su árbol de
 *    rutas.** Sin ese archivo, `Href` degrada a `string` y toda ruta
 *    inventada compila en VERDE.
 *
 * ⇒ **ESTA REGLA NO RE-IMPLEMENTA LO QUE EL COMPILADOR HACE MEJOR.**
 *   Resuelve contra el ÁRBOL DE RUTAS REAL DEL FILESYSTEM —jamás contra el
 *   `.d.ts`, que es justo lo que puede estar viejo— y cubre lo que al
 *   compilador se le escapa:
 *
 *   · BRAZO A — literales de navegación sin archivo que los sirva. Red de
 *     seguridad para cuando el `.d.ts` falta o venció.
 *   · BRAZO B — **deep links `scheme://ruta`. `typedRoutes` NO los tipa:
 *     cobertura CERO hoy.** Y este brazo nació ciego: el `sinComentarios`
 *     de esta misma casa se comía el doble-slash de la URL y el brazo
 *     medía 0 con cara de verde. La cura vive arriba, en esa función.
 *   · BRAZO C — **el que más importa: ¿el compilador PUEDE ver?** Si el
 *     `.d.ts` falta o es más viejo que el árbol, el verde del typecheck
 *     sobre rutas no significa nada, y eso hay que decirlo en voz alta.
 *
 * FALSOS POSITIVOS CONOCIDOS Y CÓMO SE DESARMAN (los 10 de la primera
 * corrida fueron míos): los grupos `(tabs)` se normalizan **en los DOS
 * lados** —`router.push('/(tabs)')` es forma legal y el union generado la
 * incluye—; los segmentos dinámicos `[id]` se comparan por posición. Lo
 * que NO alcanza esta regla y se declara: rutas armadas por variable o
 * template — no son literales y salen del alcance a propósito.
 *
 * ☠️ CONDICIÓN DE MUERTE: ninguna mientras `.expo/types` siga siendo
 *   generado y gitignored. Si algún día se versiona, el brazo C sobra. */
const RUTAS_APPS = [
  { app: 'cliente', dir: 'apps/cliente', scheme: 'cliente' },
  { app: 'prestador', dir: 'apps/prestador', scheme: 'prestador' },
];

/** El árbol de rutas REAL: cada archivo de `src/app` es una ruta servida. */
function rutasServidas(dir) {
  const base = join(RAIZ_REPO, dir, 'src/app');
  const rutas = new Set();
  if (!existsSync(base)) return rutas;
  const caminar = (d) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) caminar(p);
      else if (/\.(tsx|ts)$/.test(p)) {
        const rel = p.slice(base.length + 1).replace(/\.(tsx|ts)$/, '');
        if (/(^|\/)_layout$/.test(rel)) continue;
        let r = ('/' + rel).replace(/\/\([^)]+\)/g, '').replace(/\/index$/, '');
        rutas.add(r === '' ? '/' : r);
      }
    }
  };
  caminar(base);
  return rutas;
}

/** ¿La ruta pedida la sirve algún archivo? Normaliza los DOS lados. */
function rutaServida(pedida, rutas) {
  const limpia =
    pedida.split('?')[0].split('#')[0].replace(/\/\([^)]+\)/g, '').replace(/\/$/, '') || '/';
  if (rutas.has(limpia)) return true;
  const partes = limpia.split('/');
  for (const r of rutas) {
    const rp = r.split('/');
    if (rp.length !== partes.length) continue;
    if (rp.every((seg, i) => seg === partes[i] || /^\[.+\]$/.test(seg))) return true;
  }
  return false;
}

function r63(archivos) {
  const fallos = [];
  let literales = 0;
  let deeplinks = 0;
  let apps = 0;
  /** Las apps donde el brazo C NO PUDO medir (Metro nunca corrió en este
   *  worktree). Se declara en la línea de info: un instrumento que no
   *  midió lo dice, jamás lo calla (L-197). */
  const sinMedir = [];

  for (const { app, dir, scheme } of RUTAS_APPS) {
    const rutas = rutasServidas(dir);
    if (rutas.size === 0) continue;
    apps++;

    /* ── BRAZO C · ¿el compilador puede ver? ────────────────────────────
     *
     * 🔴 **ESTE BRAZO DABA FALSO ROJO EN TODO WORKTREE DE PISTA, y lo
     * midió D en tres worktrees antes de que yo lo viera.** Exige
     * `apps/*​/.expo/types/router.d.ts`, que es **generado y gitignored**
     * (`apps/cliente/.gitignore:7 → .expo/`): existe SOLO donde alguien
     * corrió `expo start`. ⇒ una pista trabajando en su worktree tenía
     * R63 en rojo **hasta commiteando un markdown**, y D tuvo que
     * commitear con `SALTAR_GATE` declarado.
     *
     * ⚠️ **Y eso es peor que un rojo molesto: un gate que todos saltan
     * deja de ser un gate.** Se vuelve trámite, y el día que se ponga
     * rojo de verdad nadie va a leer el motivo. *La sustancia del brazo
     * es correcta —sin el `.d.ts`, `typedRoutes` degrada `Href` a
     * `string` y las rutas dejan de medirse EN SILENCIO— pero estaba
     * puesto donde no podía cumplirse.*
     *
     * ✅ **LA CURA: el brazo distingue «está mal» de «no puedo medir».**
     * `.expo/` es el discriminador, y **se midió que discrimina** antes
     * de confiar en él: existe en el worktree primario y en el de B
     * (donde corrió Metro) y **está AUSENTE en los de C y D**.
     *   · `.expo/` ausente ⇒ **Metro nunca corrió acá: NO SE MIDE y se
     *     DICE.** Cero fallo. No es un verde: es un «no concluyente»
     *     declarado en la línea de info, el mismo criterio con el que
     *     `verify-edge-deno` trata la falta de `deno`.
     *   · `.expo/` presente y el `.d.ts` ausente o incompleto ⇒ **Metro
     *     corrió y los tipos están mal: FALLA**, que es real.
     *
     * 🔴 **POR QUÉ CALLAR ACÁ NO REPITE EL DEFECTO QUE R63 VINO A CAZAR:**
     * porque **el BRAZO A no depende del `.d.ts`** — resuelve los
     * literales contra el árbol de rutas del filesystem. En un worktree
     * sin Metro, A sigue midiendo exactamente el defecto que el
     * compilador ciego dejaría pasar. *El brazo C no es la red: es el
     * aviso de que la red del compilador no está puesta.* Y la red de
     * esta casa sigue puesta.
     *
     * ⚠️ **LÍMITE DECLARADO:** si algún comando de Expo creara `.expo/`
     * sin generar los tipos, este brazo fallaría en un worktree que
     * nunca corrió Metro. No se vio en la medición de hoy; se anota en
     * vez de suponer que no puede pasar. */
    const dts = join(RAIZ_REPO, dir, '.expo/types/router.d.ts');
    if (!existsSync(join(RAIZ_REPO, dir, '.expo'))) {
      sinMedir.push(app);
    } else if (!existsSync(dts)) {
      fallos.push(
        `R63·C ${app}: \`.expo/\` existe pero NO su \`types/router.d.ts\`. Con \`typedRoutes: true\` y sin ese archivo, \`Href\` degrada a \`string\` y **toda ruta inventada compila en verde**: el typecheck no está midiendo rutas. Se regenera corriendo \`expo start\` en \`apps/${app}\`.`,
      );
    } else {
      /* ⚠️ SE COMPARA ESTRUCTURA, JAMÁS mtime — y la primera versión de este
         brazo SÍ usaba mtime. Salía roja con «0.1 días de atraso» apenas se
         editaba UNA pantalla, aunque no naciera ninguna ruta: **cualquier
         commit que tocara una pantalla dejaba el lint en rojo.** Un juez que
         grita en cada commit se aprende a ignorar, y ahí deja de ser juez.
         La pregunta correcta no es «¿quién es más nuevo?» sino **«¿está cada
         ruta real en el union que el compilador lee?»** — que es lo que de
         verdad decide si el typecheck puede ver. */
      const textoDts = readFileSync(dts, 'utf8');
      const ausentes = [...rutas].filter((r) => {
        if (r === '/') return false; // la raíz viaja en varias formas
        // El union declara las dinámicas con su `[param]` y también como
        // template; alcanza con que el literal del segmento aparezca.
        return !textoDts.includes(`\`${r}\``) && !textoDts.includes(`${r}\``);
      });
      if (ausentes.length > 0) {
        fallos.push(
          `R63·C ${app}: ${ausentes.length} ruta(s) del filesystem NO están en \`.expo/types/router.d.ts\` ⇒ el compilador no puede verlas y \`router.push\` hacia ellas pasa sin control: ${ausentes.slice(0, 5).join(' · ')}${ausentes.length > 5 ? ' …' : ''}. Se regenera corriendo \`expo start\` en \`apps/${app}\`.`,
        );
      }
    }

    // ── BRAZOS A y B · las promesas ────────────────────────────────────
    const reDeep = new RegExp(`['"\`]${scheme}://([^'"\`]*)['"\`]`, 'g');
    for (const { path, src } of archivos) {
      if (!path.startsWith(dir)) continue;
      const limpio = sinComentarios(src);
      for (const m of limpio.matchAll(/router\.(?:push|replace|navigate)\(\s*'(\/[^']*)'/g)) {
        literales++;
        if (!rutaServida(m[1], rutas))
          fallos.push(`R63·A ${path}:${lineaDe(limpio, m.index)} navega a '${m[1]}' y ningún archivo de \`src/app\` la sirve.`);
      }
      for (const m of limpio.matchAll(/pathname:\s*'(\/[^']*)'/g)) {
        literales++;
        if (!rutaServida(m[1], rutas))
          fallos.push(`R63·A ${path}:${lineaDe(limpio, m.index)} declara \`pathname: '${m[1]}'\` y ningún archivo de \`src/app\` la sirve.`);
      }
      for (const m of limpio.matchAll(reDeep)) {
        deeplinks++;
        const r = '/' + m[1].replace(/^\/+/, '');
        if (!rutaServida(r, rutas))
          fallos.push(`R63·B ${path}:${lineaDe(limpio, m.index)} promete el deep link '${scheme}://${m[1]}' y ningún archivo de \`src/app\` lo sirve. \`typedRoutes\` NO tipa deep links: acá no hay compilador que lo cace.`);
      }
    }
  }

  /* ANCLA — escrita contra el modo de falla de ESTA regla: sin árbol de
     rutas no hay contra qué resolver y los tres brazos callarían. */
  fallos.push(...ancla('R63', apps, 2, 'app(s) con árbol de rutas legible en src/app'));
  return {
    fallos,
    info:
      `${literales} literal(es) de navegación · ${deeplinks} deep link(s) · ${apps} app(s)` +
      (sinMedir.length > 0
        ? ` · ⚠️ brazo C NO MEDIDO en ${sinMedir.join('/')} (Metro nunca corrió en este worktree ⇒ su typecheck NO está midiendo rutas; el brazo A sí las mide y no depende del .d.ts)`
        : ` · brazo C medido en las ${apps}: cada ruta del filesystem está en el union que lee el compilador`),
  };
}

/* ═══════════════════════════════════════════════════════════════════
 * R64 · UNA PANTALLA DE CIERRE NO PROMETE UN EFECTO QUE NADIE EJECUTA
 *       (S104-B · P15 §4).
 *
 * 🔴 EL DEFECTO QUE CAZA, y es el de peor costo del producto: una
 * pantalla de cierre de cuenta que dice *«se borra tu historial»* cuando
 * nada lo borra. La persona se va tranquila y el dato sigue ahí. **No hay
 * excepción de stack trace ni de test: una promesa falsa acá no falla —
 * se cumple mal, en silencio, y del lado del usuario parece que funcionó.**
 *
 * ── POR QUÉ NO MIDE PROSA, que era el camino obvio ────────────────────
 * La forma fácil era buscar verbos («borra», «elimina», «destruye») en
 * las pantallas de cierre. **Se descartó con precedente propio:** esta
 * casa ya jubiló `verify-edge-simbolos` por medir media clase con regex,
 * y una lista de verbos falla igual — no ve las paráfrasis, se llena de
 * falsos positivos con los comentarios, y **no sabría distinguir una
 * promesa verdadera de una falsa aunque las encontrara todas.**
 *
 * ── LO QUE MIDE: ESTRUCTURA, y por eso la pieza se diseñó así ─────────
 * `ConsecuenciasDelCierre` obliga a que **cada consecuencia declare su
 * `respaldo`**: el nombre del wrapper de `@epetplace/api` que ejecuta ese
 * efecto, o el literal `'sin_motor'`. ⇒ R64 tiene dos brazos:
 *
 *   · **A — el respaldo nombra algo que EXISTE.** Todo `respaldo` que no
 *     sea `'sin_motor'` tiene que ser un símbolo **realmente exportado
 *     por `packages/api`**. Un nombre inventado es una promesa con
 *     coartada, y es el modo de falla más probable: se teclea el nombre
 *     del wrapper que uno *piensa* construir.
 *   · **B — trinquete solo-baja de `'sin_motor'`.** Prometer sin motor no
 *     se prohíbe (hoy el motor de cierre es CERO y prohibirlo dejaría la
 *     pantalla sin poder existir): **se cuenta, y solo puede bajar.** El
 *     día que el motor llegue, el número cae; nunca sube sin que alguien
 *     mueva el baseline a la vista.
 *
 * ⚠️ **LO QUE R64 NO PUEDE HACER, declarado en vez de insinuado:** no
 * verifica que el wrapper nombrado haga LO QUE EL TEXTO DICE. Eso exige
 * entender castellano y SQL a la vez. **Cierra la puerta de «prometí algo
 * que no existe»; no la de «prometí mal algo que existe».** Esa segunda
 * es del gate humano, y se dice para que nadie lea el verde de R64 como
 * «las promesas son ciertas».
 *
 * ☠️ CONDICIÓN DE MUERTE: ninguna. El brazo B muere solo cuando llegue a
 * 0, y ahí queda el A. */
const BASELINE_SIN_MOTOR = 0

/** Los símbolos que `packages/api` exporta de verdad — leídos de su
 *  `index.ts`, no de una lista tecleada acá (que sería el segundo lugar
 *  donde la verdad vive y el primero en envejecer). */
function simbolosDeApi() {
  const p = join(RAIZ_REPO, 'packages/api/src/index.ts')
  if (!existsSync(p)) return null
  const src = readFileSync(p, 'utf8')
  const nombres = new Set()
  for (const m of src.matchAll(/\b([a-zA-Z_$][\w$]*)\b/g)) nombres.add(m[1])
  return nombres
}

/** ¿Este archivo es la galería? **El corpus de R64 la INCLUYE, y los dos
 *  brazos la tratan distinto — a propósito:**
 *   · **Brazo A SÍ la mira.** Un `respaldo` que nombra un wrapper
 *     inexistente es un error aunque esté en un ejemplo — y peor: la
 *     galería es de donde se COPIA el patrón. Un nombre falso ahí se
 *     propaga al primer consumidor real.
 *   · **Brazo B NO la cuenta.** El trinquete mide *«cuántas promesas sin
 *     motor le mostramos a una persona»*, y un ejemplo de galería no se
 *     le muestra a nadie. Contarlo dejaría el baseline atado a datos de
 *     demo — y un retroceso REAL en producto podría esconderse borrando
 *     un ejemplo.
 *
 *  🔴 **Y esto nació de un verde flojo propio, en su primera corrida:** el
 *  corpus original no incluía la galería, R64 informó «0 respaldos» con
 *  cuatro declarados a diez líneas de distancia, **y salió VERDE**. No
 *  falló la regla: falló dónde estaba mirando. L-192 otra vez. */
const ES_GALERIA = /packages\/ui\/src\/gallery\//

function r64(archivos) {
  const fallos = []
  const api = simbolosDeApi()
  let respaldos = 0
  let sinMotor = 0
  let sinMotorDemo = 0
  let superficies = 0

  /* ANCLA del corpus de la API: si `index.ts` no se pudo leer, el brazo A
     no puede juzgar y su silencio significaría «no miré» (L-192). */
  if (api === null) {
    fallos.push(
      'R64: no se pudo leer `packages/api/src/index.ts` — el brazo A no tiene contra qué resolver y su verde no significaría nada.',
    )
    return { fallos, info: 'NO CONCLUYENTE — sin corpus de api' }
  }

  for (const { path, src } of archivos) {
    const limpio = sinComentarios(src)
    if (!limpio.includes('respaldo')) continue
    superficies++
    for (const m of limpio.matchAll(/respaldo:\s*'([^']+)'/g)) {
      respaldos++
      const r = m[1]
      if (r === 'sin_motor') {
        if (ES_GALERIA.test(path)) sinMotorDemo++
        else sinMotor++
        continue
      }
      if (!api.has(r)) {
        fallos.push(
          `R64·A ${path}:${lineaDe(limpio, m.index)} declara \`respaldo: '${r}'\` y **\`packages/api\` no exporta ese símbolo**. Una consecuencia de cierre respaldada por un wrapper que no existe es una promesa con coartada. Si el motor todavía no está, el valor honesto es \`'sin_motor'\` — que R64 cuenta y solo deja bajar.`,
        )
      }
    }
  }

  if (sinMotor > BASELINE_SIN_MOTOR) {
    fallos.push(
      `R64·B: ${sinMotor} consecuencia(s) de cierre declaradas \`'sin_motor'\` sobre un baseline de ${BASELINE_SIN_MOTOR}. Es trinquete SOLO-BAJA: prometer sin motor está permitido —hoy el motor de cierre es CERO— pero **no puede crecer sin que alguien suba este número a la vista**.`,
    )
  }

  return {
    fallos,
    info: `${respaldos} respaldo(s) en ${superficies} superficie(s) · ${sinMotor} sin motor en PRODUCTO (baseline ${BASELINE_SIN_MOTOR} solo-baja) · ${sinMotorDemo} en galería (NO cuentan al trinquete: ver ES_GALERIA) · ⚠️ NO verifica que el wrapper haga lo que el texto dice`,
  }
}

/**
 * ═══ R65 · EL ÁREA DE RESERVA DE UNA MARCA AJENA (S105-B) ══════════════════
 *
 * **Firmada por el founder, 25-ago-2026**, con su razón: *el modo de falla es
 * silencioso, y acá el que tiene que frenar es un compilador, no un lector.*
 *
 * ── QUÉ VIGILA ─────────────────────────────────────────────────────────────
 * Deuna fija un **área de reserva** para su logo (respuesta del proveedor,
 * grupo de soporte, 25-ago-2026):
 *
 *    «1X mínimo a cada lado, donde X = el grosor total del punto del signo de
 *     exclamación. Ningún elemento gráfico, fotográfico, tipográfico o de
 *     textura invade ese espacio.»
 *
 * En la caja del set (`logo-franquicia.tsx`, 56×32 con contenido 44×22) el
 * isotipo renderiza a 24,51×22,00 dp y X vale **4,40 dp**. La cuenta:
 *
 *    ancho  24,51 + 2×4,40 = 33,31  ≤ 56   ✅ sobran 22,69
 *    alto   22,00 + 2×4,40 = 30,80  ≤ 32   ✅ sobran  1,20
 *
 * **Entra, y el ALTO manda: la holgura es de 0,60 dp por lado.** Bajar
 * `ALTO_LOGO` a 31 o subir `CONTENIDO_ALTO` a 23 **viola el manual de una marca
 * registrada** — y no da error, no rompe un test y no se ve en un diff.
 *
 * ── POR QUÉ NO ES UN GUARD DE NÚMEROS MÁGICOS ──────────────────────────────
 * La regla **no compara constantes contra un baseline que yo escribí**: lee las
 * cuatro constantes del código, **mide el asset real** (aspecto y X, por
 * decodificación de alfa y componentes conexas) y **rehace la cuenta**. Si
 * cambian las constantes O cambia el dibujo, la cuenta se rehace sola.
 * *Vigilar «no toques el 32» protege un número; rehacer la cuenta protege la
 * regla del proveedor, que es lo que hay que cumplir.*
 *
 * ── EL BRAZO C, Y ES UNA ORDEN DEL FOUNDER ─────────────────────────────────
 * Deuna va a entregar el logo en SVG. La orden, literal: *«no reemplaces el PNG
 * por costumbre. X es una propiedad del glifo dibujado, no del archivo — si el
 * SVG trae otro viewBox, otro padding o el punto con otro grosor relativo, los
 * 4,40 dp dejan de valer»*. ⇒ **el hash del asset medido queda clavado acá.**
 * Cambiar el archivo pone la regla ROJA pidiendo re-medición. *Un swap que «solo
 * cambia el formato» es exactamente la clase de cambio que no da síntoma.*
 *
 * ── LO QUE NO MIDE, DECLARADO ──────────────────────────────────────────────
 * **① No verifica que nada más se dibuje dentro de la caja** (el tercer límite
 * del pedido a C). Contar hijos JSX sería frágil y su rojo no sería confiable —
 * *una regla que se puede violar sin que nadie lo note es mala; una que grita
 * cuando no debe es peor, porque enseña a ignorarla.* Vive como límite escrito
 * en `PEDIDO.md` §2 y en la procedencia del asset.
 *
 * **② 🔴 ES CIEGA A SUS NO-CONSUMIDORES, y eso es un LÍMITE, no un defecto.**
 * R65 vigila **la pieza**: la geometría y el resguardo dentro de la caja de
 * `LogoFranquicia`. **No puede ver una superficie que muestra el mismo medio
 * SIN pasar por la pieza vigilada.**
 *
 * *No es hipotético: pasó.* El resumen del medio elegido
 * (`seccion-medio-de-pago.tsx`) montaba una `Celda` sin `inicio`, con un
 * comentario que decía *«DeUna… no tiene marca»* — **cierto cuando se escribió,
 * falso desde que el asset se vendorizó**. R65 estuvo verde todo ese tiempo y
 * tenía razón: lo que mide, estaba bien.
 *
 * **Por qué ningún lint podía cazarlo** (matiz de la pista C, que mejora el
 * diagnóstico): *una superficie que no monta la pieza no es su no-consumidor
 * por error — lo es **por omisión**, y las omisiones no tienen lugar donde
 * aparecer.* **Un lint recorre lo que está escrito; una ausencia no está
 * escrita en ninguna parte.**
 *
 * ⇒ **Lo que cierra este hueco no es un mecanismo: es una práctica** — *cuando
 * una pieza gana una capacidad que antes no tenía, la entrega incluye censar
 * las superficies que declaran su ausencia.*
 * **Y se decidió NO construir la regla que lo vigilaría**, con su medición: el
 * censo de superficies con el hueco dio **UNO**. *Una regla nueva por un caso
 * único no se paga — la condición se puso antes de medir.*
 */
function r65(archivos) {
  const fallos = [];

  /* ① LAS CONSTANTES, DEL CORPUS — por acá entra el fixture. */
  const pieza = archivos.find((a) => /logo-franquicia\.tsx$/.test(a.path));
  if (!pieza) {
    return { fallos, info: 'NO CONCLUYENTE — `logo-franquicia.tsx` no está en el corpus' };
  }
  const limpio = sinComentarios(pieza.src);
  const num = (nombre) => {
    const m = limpio.match(new RegExp(`${nombre}\\s*=\\s*(\\d+(?:\\.\\d+)?)`));
    return m ? Number(m[1]) : null;
  };
  const cajaW = num('ANCHO_LOGO'), cajaH = num('ALTO_LOGO');
  const contW = num('CONTENIDO_ANCHO'), contH = num('CONTENIDO_ALTO');
  if ([cajaW, cajaH, contW, contH].some((v) => v === null)) {
    fallos.push(
      'R65: no pude leer las cuatro constantes de la caja en `logo-franquicia.tsx` (`ANCHO_LOGO`, `ALTO_LOGO`, `CONTENIDO_ANCHO`, `CONTENIDO_ALTO`). **Si alguien las renombró, esta regla dejó de medir** — y su silencio se leería como que el resguardo está bien.',
    );
    return { fallos, info: 'NO CONCLUYENTE — constantes ilegibles' };
  }

  /* ② EL ASSET, DEL DISCO — medido, no supuesto. Se busca primero en su
     destino final y después en el pedido, y se DECLARA cuál se leyó. */
  const candidatos = [
    'apps/cliente/assets/marcas/ic_deuna_isotipo.png',
    'docs/relevamientos/S105-B-MARCA-DEUNA-para-C/ic_deuna_isotipo.png',
  ];
  const ruta = candidatos.find((p) => existsSync(p));
  if (!ruta) {
    return { fallos, info: 'NO CONCLUYENTE — el asset del isotipo no está en el árbol' };
  }

  let img, punto, sha;
  try {
    img = decodificarPng(ruta);
    punto = puntoRedondoPng(img);
    sha = shaDe(ruta);
  } catch (e) {
    fallos.push(`R65: no se pudo decodificar \`${ruta}\` (${e.message}). **Sin medir el glifo no hay cuenta que valga**, y un verde acá significaría «no miré».`);
    return { fallos, info: 'NO CONCLUYENTE — asset ilegible' };
  }

  /* ③ BRAZO C · EL CANDADO DEL ASSET (orden del founder). */
  if (sha !== SHA_ISOTIPO_MEDIDO) {
    fallos.push(
      `R65·C \`${ruta}\` **cambió**: su sha256 empieza en \`${sha.slice(0, 12)}\` y el medido es \`${SHA_ISOTIPO_MEDIDO.slice(0, 12)}\`. **X es una propiedad del glifo dibujado, no del archivo** — otro viewBox, otro padding o un punto con otro grosor relativo y los 4,40 dp dejan de valer, con solo 0,60 dp de holgura en el alto para perdonar. **Volvé a medirlo con \`node scripts/medir-png.mjs\` (control cruzado contra el wordmark) y actualizá \`SHA_ISOTIPO_MEDIDO\` recién cuando la cuenta dé.** Si difiere de lo medido, vuelve a mesa antes de tocar nada.`,
    );
  }

  const cuerpoIso = cuerpoPng(img);
  if (!punto) {
    fallos.push(
      'R65: no encontré en el asset un punto redondo inequívoco (aspecto ~1, relleno de elipse ~1). **`X` no se adivina**: es la unidad del área de reserva de una marca ajena.',
    );
    return { fallos, info: `NO CONCLUYENTE — sin X medible en ${ruta}` };
  }

  /* ④ BRAZO A · LA CUENTA, rehecha con lo medido. */
  const escala = Math.min(contW / cuerpoIso.w, contH / cuerpoIso.h);
  const rw = cuerpoIso.w * escala, rh = cuerpoIso.h * escala;
  const X = punto.w * escala;
  const necW = rw + 2 * X, necH = rh + 2 * X;
  const d = (n) => n.toFixed(2).replace('.', ',');

  if (necW > cajaW || necH > cajaH) {
    fallos.push(
      `R65·A **el área de reserva de Deuna ya no entra en la caja**. Con la caja en ${cajaW}×${cajaH} y el contenido en ${contW}×${contH}, el isotipo renderiza a ${d(rw)}×${d(rh)} dp y X vale ${d(X)} dp ⇒ hacen falta **${d(necW)}×${d(necH)}**. ` +
      `Su manual exige 1X libre a cada lado y **ningún elemento puede invadirlo** (proveedor, 25-ago-2026). ` +
      `${necH > cajaH ? `El ALTO es el que rompe: sobran ${d(cajaH - rh)} dp por lado y X pide ${d(X)}. ` : ''}` +
      `**No es un umbral nuestro que se pueda ajustar: es la regla de una marca registrada.**`,
    );
  }

  /* ⑤ BRAZO B · EL MÍNIMO DE REPRODUCCIÓN (16 px para la versión símbolo,
     dato del proveedor, 25-ago-2026). Se mide el lado MENOR en dp, que es la
     lectura restrictiva — la misma prudencia con la que se descartó el
     wordmark, cuyos 44 dp de ancho no llegaban a sus 50. */
  const menor = Math.min(rw, rh);
  if (menor < MIN_SIMBOLO_DEUNA) {
    fallos.push(
      `R65·B el isotipo renderiza a ${d(menor)} dp de lado menor y Deuna fija **${MIN_SIMBOLO_DEUNA} px de mínimo para la versión símbolo**. Por debajo de su mínimo la marca deja de ser reproducible según su manual.`,
    );
  }

  return {
    fallos,
    info:
      `caja ${cajaW}×${cajaH} · contenido ${contW}×${contH} · isotipo ${d(rw)}×${d(rh)} dp · ` +
      `X ${d(X)} dp (punto de ${punto.w}px, aspecto ${punto.aspecto.toFixed(2)}, relleno ${punto.llenado.toFixed(3)}) · ` +
      `resguardo pide ${d(necW)}×${d(necH)}, holgura ${d((cajaH - rh) / 2 - X)} dp por lado en el alto · ` +
      `medido de ${ruta} · ⚠️ su verde NO dice «la marca está bien en todas partes»: ` +
      `no verifica que nada más se dibuje dentro de la caja, ` +
      `ni que toda superficie que muestre la marca pase por la pieza (ver cabecera)`,
  };
}

/**
 * ═══ R66 · LA VOZ NO VUELVE AL VOSEO (S105-B) ══════════════════════════════
 *
 * **Firmada por el founder, 25-ago-2026**, y con un caso, no con una previsión:
 * *«hoy apareció voseo en el cliente donde el censo post-barrida de S101-D había
 * dado 0. Las cadenas se escribieron después, y `verify:diseno` tiene 56 reglas
 * y ninguna mira la voz.»*
 *
 * **La casa firmó TUTEO NEUTRO en S51** (regla 27 extendida al móvil). Desde
 * entonces se barrió el voseo **cuatro veces** —S77 (D-533/D-534), S101-D,
 * S105-C— y **volvió las cuatro**. *Un barrido cura el pasado; solo un guard
 * cura el futuro.*
 *
 * ── DE DÓNDE SALE LA LÓGICA ────────────────────────────────────────────────
 * **De `scripts/lib-voz.mjs`, que es el instrumento de la pista C movido a
 * biblioteca sin cambiarle una regla** — con sus siete trampas resueltas, que
 * son su valor real. **NO se reimplementó acá**: una segunda copia del matcher
 * sería exactamente el defecto que la casa nombra como *«una copia que diverge
 * sin avisar, y su modo de falla es el PEOR: funciona»*.
 *
 * ── LOS BASELINES, MEDIDOS HOY Y CON SU DESTINO ESCRITO ────────────────────
 * **Por ARCHIVO y no global**, porque un contador global no ve lo que importa:
 * *dos archivos, uno curado y otro no, suman igual.*
 *
 * ── ⚠️ Y NINGUNO SALE DEL CENSO VIEJO, PORQUE EL CENSO VIEJO SUBCONTABA ────
 * Un censo de segundo orden (ver `lib-voz.mjs` ⑨) encontró **seis formas
 * voseantes que ninguna lista tenía** — `cancelás` · `atendés` · `decís` ·
 * `subís` · `trabajás` · `vendés`. Con ellas, el prestador **no tiene 41 sino
 * 47**, y `packages/ui` **no tenía 1 sino 2**. *Los números de abajo son los
 * de la lista completa.*
 */
function r66(archivos) {
  const fallos = [];

  /* Los diccionarios y las piezas de producto. **La galería queda AFUERA con su
     razón**: sus cadenas son de demostración, no voz que alguien reciba — mismo
     criterio que `ES_GALERIA` en R64. Su contador se informa aparte para que la
     exclusión no se lea como que ahí no hay nada. */
  let enGaleria = 0;
  let total = 0;
  const porArchivo = new Map();

  for (const { path, src } of archivos) {
    const n = hitsDeVoseo(src).length;
    if (n === 0) continue;
    if (ES_GALERIA.test(path)) { enGaleria += n; continue; }
    porArchivo.set(path, n);
    total += n;
  }

  /* ANCLA: si el corpus no trae ni un diccionario, la regla no puede juzgar y
     su cero significaría «no miré» (L-192). */
  const vioDiccionario = archivos.some((a) => /\/i18n\/(es|en)\.ts$/.test(a.path));
  if (!vioDiccionario) {
    fallos.push('R66: el corpus no incluye ningún diccionario `i18n` — el cero de esta regla no significaría «no hay voseo», sino «no miré».');
    return { fallos, info: 'NO CONCLUYENTE — sin diccionarios en el corpus' };
  }

  for (const [path, n] of porArchivo) {
    const tope = BASELINE_VOSEO[path];
    if (tope === undefined) {
      fallos.push(
        `R66 **${path}** tiene ${n} cadena(s) en voseo y **no tiene baseline**. La casa firmó TUTEO NEUTRO en S51: la voz de producto no vosea. *Si es voz nueva, se escribe en tuteo; si es un archivo que nadie había medido, su número entra acá A LA VISTA y solo puede bajar.*`,
      );
    } else if (n > tope) {
      fallos.push(
        `R66 **${path}**: ${n} cadena(s) en voseo sobre un baseline de ${tope}. **Es trinquete SOLO-BAJA** — el voseo que ya está se cura cuando se toca su pantalla, pero **no puede crecer**. *Es la cuarta vez que el voseo vuelve después de una barrida: lo que falla no es la barrida, es que nada mira entre una y otra.*`,
      );
    }
  }

  const enCero = [...Object.keys(BASELINE_VOSEO)].filter((p) => (porArchivo.get(p) ?? 0) === 0);

  return {
    fallos,
    info:
      `${total} cadena(s) en voseo en ${porArchivo.size} archivo(s) de producto` +
      (enGaleria ? ` · ${enGaleria} en galería (NO cuentan: son cadenas de demostración, ver ES_GALERIA)` : '') +
      (enCero.length ? ` · ${enCero.length} baseline(s) YA EN 0` : '') +
      ` · lógica de \`lib-voz.mjs\` (instrumento de C, 9 trampas)` +
      ` · ⚠️ su verde dice «no creció», jamás «la voz está bien»: no mira gramática, ni tono, ni el inglés`,
  };
}

/**
 * ═══ R67 · EL AVISO DE TELECONSULTA NO SE ACORTA (S106-B) ═══════════════════
 *
 * **La letra que lo pide, `LETRA_TELEMEDICINA` §3, y es su línea roja:**
 * *«Los signos concretos no son decoración. Decir "si creés que está en riesgo"
 * le pide al dueño un juicio clínico que no tiene; nombrar **seis** signos le
 * da un criterio. **No se resume, no se acorta, no se convierte en una línea
 * de letra chica.»***
 *
 * ⚠️ **Esta cita decía «cinco» hasta el 26-ago, y la letra ya decía seis.** El
 * archivo canónico trae la corrección tachada (`~~cinco~~ **seis**`), o sea que
 * el número estaba derogado **en la fuente** mientras este juez transcribía la
 * forma anterior. *La ley de la sesión —la letra derogada se saca de la sección
 * que un juez lee— vale también para la que el juez se copió adentro: acá la
 * copia sobrevivió a su original.* El brazo ① nunca contó mal (mide por ancla
 * estructural, no por esta prosa), pero **un lector que llegara a arreglar un
 * rojo habría empezado creyendo que son cinco.**
 *
 * *Una prohibición que solo vigila un ojo se rompe el día que nadie mira. Y su
 * modo de falla es el peor de todos: **un aviso con cuatro signos compila,
 * corre y se ve perfecto.***
 *
 * ── 🔴 CONTRA QUÉ MIDE: LA LETRA, NO UN BASELINE TRANSCRITO ────────────────
 * La vara se EXTRAE de `docs/LETRA_TELEMEDICINA.md` en cada corrida. **No hay
 * copia del texto acá, a propósito** — es el mismo argumento con el que `R66`
 * se negó a reimplementar el matcher de `lib-voz`: *una copia que diverge sin
 * avisar, y su modo de falla es el PEOR: funciona*. Un baseline transcrito
 * seguiría verde contra la versión vieja el día que la mesa enmiende §3.
 *
 * ── LOS DOS BRAZOS, y por qué son dos ──────────────────────────────────────
 * **① LOS SEIS SIGNOS — el brazo duro.** Los seis son sintagmas NOMINALES
 * («dificultad para respirar», «sangrado», «convulsiones», «golpe fuerte»,
 * «dolor intenso», «decaimiento repentino»): **ninguno lleva verbo conjugado,
 * así que son idénticos en voseo y en tuteo.**
 *
 * 🔴 **SON SEIS, Y DURANTE UN DÍA ESTA REGLA CONTÓ CINCO** (firma de mesa,
 * 26-ago). Los dos últimos venían unidos por **«o»** en la letra y el extractor
 * parte por COMA ⇒ **los fusionaba**. *El instrumento fusionaba exactamente lo
 * que venía a vigilar, y por eso el defecto sobrevivió a la prosa de la letra,
 * a la tupla de la pieza y al propio juez.*
 * **La cura NO fue de código: la mesa firmó cambiar la «o» por coma en §3** —
 * y la razón de fondo tampoco es técnica: *«hoy la familia que lee rápido lee
 * "dolor intenso o decaimiento repentino" como una sola cosa, **y son dos
 * motivos distintos para salir corriendo**»*. **La misma puntuación que arregla
 * el juez arregla lo que se lee.** Ese brazo es exigible HOY y es
 * inmune a la enmienda de conjugación pendiente.
 *
 * **② EL CUERPO — igualdad exacta.** Intro, advertencia, entrada a los signos
 * y cierre, carácter por carácter. **No es trinquete solo-baja**: un deslinde
 * no tiene versión intermedia aceptable.
 *
 * *Los dos juntos DISCRIMINAN la causa sin adivinar: si los cinco están y el
 * cuerpo diverge, es redacción o conjugación; si falta un signo, es amputación
 * — que es el defecto que esta regla existe para cazar.*
 *
 * ── ✅ EL CHOQUE QUE ESTA REGLA DECLARÓ AL NACER, Y CÓMO SE DISOLVIÓ ───────
 * Al nacer (25-ago) la letra estaba en **v1.0 con su §3 en VOSEO** («notás»,
 * «llevala») contra el TUTEO NEUTRO que la casa firmó en S51 ⇒ esta regla
 * declaró que el brazo ② saldría **ROJO en cuanto C depositara**, y que el
 * rojo sería VERDADERO. **No se ablandó el juez: se enmendó la letra.**
 * `LETRA_TELEMEDICINA` **v1.1** (CP1, firma founder) pasó §3 a tuteo *sin
 * tocar el contenido* — los cinco signos y las tres acciones intactos.
 *
 * *Queda registrado porque es el guard haciendo su trabajo en la dirección
 * correcta: la contradicción se resolvió en la FUENTE, que es donde vivía.*
 *
 * ── ⚠️ Y LA v1.1 TRAJO UN PÁRRAFO NUEVO, que ESTA REGLA NO VIO VENIR ──────
 * La línea de tránsito (*«La videollamada no se graba y se transmite a través
 * de la infraestructura de nuestro proveedor de video»*) entró **después** del
 * párrafo de los signos, y el extractor tomaba los signos del ÚLTIMO párrafo.
 * ⇒ devolvió `null`, la regla salió NO CONCLUYENTE contra su propio fixture y
 * **la auto-prueba la declaró DECORATIVA en la primera corrida.** Curado
 * buscando el párrafo **por contenido**. *El guard atrapó al juez: es
 * exactamente para lo que L-192 existe.*
 *
 * ── LAS ANCLAS: NUNCA VERDE POR NO HABER MIRADO (L-192 · L-425) ────────────
 * · sin la letra, o sin poder extraer §3 → **NO CONCLUYENTE**
 * · sin las claves de C → **NO CONCLUYENTE**, y el mensaje dice «C no llegó»,
 *   que es distinto de «el texto divergió». *Un rojo mal atribuido manda a
 *   arreglar lo que no está roto.*
 *
 * ── 🔴 LOS DOS LÍMITES, ESCRITOS ADENTRO DEL PROPIO JUEZ ───────────────────
 * **(a) NO MIDE TIPOGRAFÍA.** La letra prohíbe TRES cosas y esta regla alcanza
 * dos: *no se resume* ✓ · *no se acorta* ✓ · ***«no se convierte en una línea
 * de letra chica»*** ✗ — eso es RENDER. **Un aviso verbatim en `size.xs`
 * pasaría esta regla y violaría la letra.** Esa mitad la cubre la pieza
 * (`AvisoTeleconsulta` usa la prosa del sistema) y el ojo del founder.
 *
 * **(b) VIGILA SOLO EL ESPAÑOL.** La letra está firmada en español; el `en` es
 * una traducción que **nadie firmó**. C deposita un `en` porque el typecheck de
 * paridad del riel lo exige — **esta regla lo DICE, no lo bendice.** El día que
 * el founder firme la traducción, entra como segunda vara.
 */
const LETRA_TELE = 'docs/LETRA_TELEMEDICINA.md';

/** Extrae el aviso de §3: el blockquote, en párrafos, sin markdown. */
function avisoDeLaLetra(md) {
  const i = md.indexOf('## §3');
  if (i < 0) return null;
  const resto = md.slice(i);
  const j = resto.indexOf('\n## ', 3);
  const seccion = j < 0 ? resto : resto.slice(0, j);

  // Solo las líneas del blockquote; se les quita el «> » y se reunen los
  // párrafos (el markdown envuelve a 80 columnas y eso no es contenido).
  /* 🔴 SOLO EL **PRIMER** BLOQUE CITADO — el aviso, y nada de lo que venga
     después.
     **Lo destapó el discriminador contra la letra real, no una lectura:** §3
     tiene MÁS blockquotes además del aviso (la nota de la enmienda, que trae su
     propia lista de claves). Filtrando «toda línea que empiece con `>`» los dos
     bloques se fusionaban y el juez contaba **SIETE signos**, uno de ellos
     `avisoTeleSigno1..6` — *o sea, la regla habría vigilado como signo clínico
     un fragmento de documentación interna.*
     Un blockquote es CONTIGUO: la primera línea sin `>` lo cierra. Eso es
     estructura, no heurística. */
  const todas = seccion.split('\n');
  const desde = todas.findIndex((l) => l.trimStart().startsWith('>'));
  if (desde < 0) return null;
  const lineas = [];
  for (let k = desde; k < todas.length; k++) {
    if (!todas[k].trimStart().startsWith('>')) break;
    lineas.push(todas[k]);
  }
  if (lineas.length === 0) return null;

  /* 🔴 EL ANCLA ES ESTRUCTURAL: `^> - ` marca UN SIGNO.
     **Los ítems se sacan ANTES de armar párrafos**, porque si no el armador los
     pega entre sí (van sin línea en blanco) y seis signos vuelven a ser uno —
     que es literalmente el defecto del que esta regla viene saliendo.
     *Un ancla estructural no se la roba un comentario ni la borra un cambio de
     tipografía; los em-dashes sí se fueron, y con ellos se habría ido el juez.* */
  const itemsLetra = [];
  const parrafos = [];
  let actual = [];
  for (const l of lineas) {
    const t = l.trimStart().replace(/^>\s?/, '').trim();
    if (/^[-*·]\s+/.test(t)) { itemsLetra.push(t.replace(/^[-*·]\s+/, '').trim()); continue; }
    if (t === '') { if (actual.length) { parrafos.push(actual.join(' ')); actual = []; } continue; }
    actual.push(t);
  }
  if (actual.length) parrafos.push(actual.join(' '));

  // `**negrita**` es marcado, no texto.
  const limpio = parrafos.map((p) => p.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim());
  // La línea de las acciones («[ Ir a urgencias ] · …») es NOTACIÓN de mesa:
  // dice qué acciones existen, no es prosa que el usuario lea. Fuera.
  const prosa = limpio.filter((p) => !/^\[/.test(p));
  if (prosa.length < 3) return null;

  /* 🔴 EL PÁRRAFO DE LOS SIGNOS SE BUSCA POR CONTENIDO, NO POR POSICIÓN — y
     esta línea la escribió un rojo, no una previsión.
     La v1.0 tenía TRES párrafos y los signos vivían en el último, así que el
     extractor tomaba `prosa[prosa.length - 1]`. **La v1.1 agregó la línea de
     tránsito DESPUÉS** ⇒ el último dejó de ser el de los signos, el extractor
     devolvió `null` y `R67` salió NO CONCLUYENTE contra su propio fixture.
     **La auto-prueba lo cazó en la primera corrida y lo declaró DECORATIVA**
     (L-192) — en vez de que el juez se quedara ciego dando verde.
     *Un extractor que se ata a la POSICIÓN se rompe cuando la fuente crece; uno
     atado al CONTENIDO sobrevive a que la mesa agregue un párrafo.* */
  /* ✅ FORMA ② · LA LISTA (firma del founder, 26-ago). Si hay ítems, ésos SON
     los signos: cero heurística de puntuación.
     ⏪ La forma vieja (un párrafo con los signos entre em-dashes) se conserva
     como respaldo **y no por nostalgia**: mientras la letra en lista viva en
     una rama y no en `main`, las dos formas existen a la vez. *Un lector que
     solo entiende la forma nueva convierte el orden de merge en un rojo.* */
  const conSignos = prosa.find((p) => /—[^—]+—/.test(p));
  const signos =
    itemsLetra.length > 0
      ? itemsLetra
      : conSignos
        ? conSignos.match(/—([^—]+)—/)[1].split(',').map((s) => s.trim()).filter(Boolean)
        : null;
  if (signos == null) return null;

  /* ⚠️ LA LÍNEA DE TRÁNSITO (v1.1 ②) — nace marcada **PROVISIONAL** por la
     propia letra: rige hasta que el abogado conteste la pregunta 4 de §10
     (LOPDP), que puede exigir nombrar al proveedor, su país o la base de
     licitud. **Se vigila igual, y no es contradicción**: hoy es texto firmado,
     y el día que cambie esta regla lee la letra nueva sola — que es
     exactamente para lo que la vara se extrae en cada corrida en vez de
     copiarse a un baseline. */
  const transito = prosa.find((p) => p !== conSignos && /videollamada/i.test(p) && /graba|transmite|proveedor/i.test(p));

  /* 🔴 EL CUERPO FIRMADO, ENTERO — y contra esto se mide cada fragmento de C.
     **Por qué el texto completo y no párrafo contra párrafo:** la letra y el
     diccionario pueden PARTIR distinto el mismo contenido (la letra tiene la
     advertencia sola y el cierre aparte; C podría juntarlos), y **§3 prohíbe
     resumir y acortar — no prohíbe dónde se corta**. Lo que no se negocia es
     que cada palabra que se muestra sea de la letra.
     La línea de las acciones y la casilla (`☐`) quedan fuera: son NOTACIÓN de
     mesa, no prosa que el usuario lea corrido. */
  const cuerpo = [...prosa, ...itemsLetra].join(' ');

  return {
    titulo: prosa[0],
    intro: prosa[1],
    /** El cuerpo entero: la vara del brazo ②. */
    cuerpo,
    /** ⏪ Nombre viejo, conservado para no romper a quien lo lea. */
    advertenciaYSignos: cuerpo,
    signos,
    transito: transito ?? null,
    /** Cuántos signos declara la letra POR ESTRUCTURA — se informa para que el
     *  verde diga de dónde sacó la cuenta. */
    porItems: itemsLetra.length > 0,
  };
}

/**
 * 🔴 NORMALIZA LA PUNTUACIÓN DE BORDE Y LA CAPITALIZACIÓN — **jamás el
 * contenido**, y la frontera es lo único que hace que esto no sea un agujero.
 *
 * **Por qué hace falta:** partir un párrafo en fragmentos OBLIGA a capitalizar
 * el primero («Dificultad…» donde la letra dice «dificultad…») y a cerrar la
 * entrada con dos puntos donde el párrafo tenía un guión largo. **Eso es
 * composición de quien parte el texto, no una edición del contenido** — y §3
 * prohíbe *resumir, acortar y achicar*, no puntuar una lista.
 *
 * ⛔ **Lo que NO hace, para que nadie lo ensanche después:** no toca acentos,
 * no ignora palabras, no acepta sinónimos, no recorta por dentro. *Un
 * normalizador que empieza a perdonar contenido deja de ser un juez y pasa a
 * ser una excusa con forma de función.*
 */
const norma = (t) => t.toLowerCase().replace(/^[\s.,:;—–-]+|[\s.,:;—–-]+$/g, '').trim()

/** Lee UNA cadena del diccionario, tolerando el salto de línea de Prettier. */
function cadena(src, clave) {
  const m = src.match(new RegExp(`\\b${clave}\\s*:\\s*(['"\`])([\\s\\S]*?)\\1`));
  return m ? m[2].replace(/\s+/g, ' ').trim() : null;
}

/**
 * Lee el aviso del diccionario `es` del cliente **EN CUALQUIERA DE SUS DOS
 * FORMAS**, y esa tolerancia no es comodidad: es la corrección de un defecto
 * REAL de este juez.
 *
 * 🔴 **Lo que pasó, medido (26-ago):** esta regla buscaba `avisoTeleconsulta:
 * { … }` —el contrato que ella misma publicaba— y salía **NO CONCLUYENTE**
 * diciendo *«C todavía no depositó»*. **Pero C YA había depositado**, en claves
 * planas (`veterinaria.avisoTele*`), y **el aviso ya se le mostraba a una
 * familia real.** ⇒ *el juez estaba protegiendo SU CONTRATO en vez de LA
 * LETRA, y su «no concluyente» inducía una conclusión falsa: que no había nada
 * que vigilar.*
 *
 * **La lección, que vale más que el caso: un juez se ata al TEXTO QUE EL
 * USUARIO LEE, jamás a la forma en que un consumidor lo guardó.** La forma es
 * de quien la escribe; la letra es de la casa.
 *
 * Devuelve una forma NORMALIZADA — así el juicio no se ramifica.
 */
function avisoDelDiccionario(src) {
  // ── FORMA ① · anidada: el contrato de `packages/ui` (tupla de cinco).
  const i = src.indexOf('avisoTeleconsulta:');
  if (i >= 0) {
    const trozo = src.slice(i, i + 4000);
    const arr = trozo.match(/signos\s*:\s*\[([\s\S]*?)\]/);
    const signos = arr
      ? [...arr[1].matchAll(/(['"`])([\s\S]*?)\1/g)].map((m) => m[2].replace(/\s+/g, ' ').trim())
      : [];
    const partes = ['advertencia', 'signosIntro', 'signosCierre'].map((k) => cadena(trozo, k));
    return {
      forma: 'anidada (contrato de packages/ui)',
      titulo: cadena(trozo, 'titulo'),
      intro: cadena(trozo, 'intro'),
      /* El texto duro se junta: en esta forma vive partido, en la otra entero.
         Lo que la letra protege es el CONTENIDO, no cómo se guardó. */
      duro: [partes[0], partes[1], signos.join(', '), partes[2]].filter(Boolean).join(' '),
      transito: cadena(trozo, 'transito'),
      acciones: [],
      signos,
    };
  }

  // ── FORMAS ② y ③ · las claves `avisoTele*` del cliente.
  const titulo = cadena(src, 'avisoTeleTitulo');
  if (!titulo) return null;

  /* 🔴 FORMA ③ · LA LISTA PARTIDA (firma del founder, 26-ago: §3 pasa a lista).
     C no partió el texto: lo convirtió en **una clave por signo**
     (`avisoTeleSigno1..N`) con su intro y su cierre. **El juez tiene que leer
     ESA forma, porque es la que el usuario ve** — si siguiera buscando el
     párrafo entero en una sola clave, diría que faltan los seis justo cuando
     están mejor presentados que antes.

     *Se leen POR ÍNDICE y hasta que la serie se corta: así **el número de
     signos lo dice el diccionario y no una constante de este archivo** — que
     es exactamente la trampa que hizo que esta regla contara cinco durante un
     día.* */
  const partidos = [];
  for (let i = 1; ; i++) {
    const v = cadena(src, `avisoTeleSigno${i}`);
    if (v == null) break;
    partidos.push(v);
  }

  const comun = {
    titulo,
    intro: cadena(src, 'avisoTeleParaQue'),
    transito: cadena(src, 'avisoTeleTransito'),
    acciones: [
      cadena(src, 'avisoTeleIrUrgencias'),
      cadena(src, 'avisoTelePresencial'),
      cadena(src, 'avisoTeleContinuar'),
    ].filter(Boolean),
  };

  if (partidos.length > 0) {
    return {
      ...comun,
      forma: `LISTA partida — ${partidos.length} clave(s) \`avisoTeleSignoN\``,
      /* El «duro» se recompone para el brazo ②: advertencia + intro + los
         signos + cierre. **Lo que la letra protege es el CONTENIDO, y el
         contenido está entero** — cambió cómo se guarda, no qué se lee. */
      duro: [
        cadena(src, 'avisoTeleNoReemplaza'),
        cadena(src, 'avisoTeleSignosIntro'),
        partidos.join(', '),
        cadena(src, 'avisoTeleSignosCierre'),
      ]
        .filter(Boolean)
        .join(' '),
      signos: partidos,
      advertencia: cadena(src, 'avisoTeleNoReemplaza'),
      signosIntro: cadena(src, 'avisoTeleSignosIntro'),
      signosCierre: cadena(src, 'avisoTeleSignosCierre'),
    };
  }

  return {
    ...comun,
    forma: 'plana — un párrafo en `avisoTeleNoReemplaza`',
    duro: cadena(src, 'avisoTeleNoReemplaza'),
    signos: null,
  };
}

function r67(archivos) {
  const fallos = [];

  // ── ANCLA ①: LA VARA. Sin la letra no hay contra qué comparar.
  if (!existsSync(LETRA_TELE)) {
    return { fallos, info: `NO CONCLUYENTE — no encontré \`${LETRA_TELE}\`: sin la fuente firmada esta regla no puede juzgar nada` };
  }
  const firmado = avisoDeLaLetra(readFileSync(LETRA_TELE, 'utf8'));
  if (!firmado) {
    return { fallos, info: `NO CONCLUYENTE — \`${LETRA_TELE}\` existe pero no pude extraer el aviso de §3 (¿cambió su forma?). **Su silencio no dice «coincide»: dice «no pude leer la vara»**` };
  }

  // ── ANCLA ②: EL TEXTO RENDERIZADO. Sin las claves de C, no hay qué juzgar.
  const dic = archivos.find((a) => /apps\/cliente\/src\/i18n\/es\.ts$/.test(a.path));
  if (!dic) {
    return { fallos, info: 'NO CONCLUYENTE — el diccionario `es` del cliente no está en el corpus: el cero significaría «no miré»' };
  }
  const puesto = avisoDelDiccionario(dic.src);
  if (!puesto) {
    return {
      fallos,
      info:
        'NO CONCLUYENTE — **C todavía no depositó `avisoTeleconsulta`** en `apps/cliente/src/i18n/es.ts`. ' +
        'Esto NO es «el texto divergió»: es que el texto todavía no existe. ' +
        'El contrato que esta regla espera: `avisoTeleconsulta: { titulo · intro · advertencia · signosIntro · signos[5] · signosCierre · transito }`',
    };
  }

  // ── BRAZO ① · LOS CINCO SIGNOS, contados sobre TODO el texto que se muestra.
  //    Se busca en el blob y no en un arreglo: así el brazo vale igual si el
  //    párrafo vive entero (forma plana) o partido (tupla). **Lo que la letra
  //    protege es que el dueño los LEA, no cómo estén guardados.**
  const esperados = firmado.signos;
  const duro = puesto.duro ?? '';
  const faltantes = esperados.filter((s) => !duro.toLowerCase().includes(s.toLowerCase()));
  for (const s of faltantes) {
    fallos.push(
      `R67 **falta el signo «${s}»** en el aviso que se le muestra al dueño. ` +
      `*«Los signos concretos no son decoración… nombrar seis signos le da un criterio»* (§3) — ` +
      `y **cinco signos compilan igual que seis**.`,
    );
  }

  // ── BRAZO ② · EL CUERPO, carácter por carácter contra la letra.
  const par = (rotulo, esperadoEn, valor) => {
    if (valor == null) { fallos.push(`R67: falta \`${rotulo}\` en el diccionario del cliente.`); return; }
    if (!norma(esperadoEn).includes(norma(valor))) {
      fallos.push(
        `R67 **\`${rotulo}\` no coincide con el texto firmado de §3**.\n` +
        `      renderiza: «${valor}»\n` +
        `      la letra:  «${esperadoEn}»`,
      );
    }
  };
  par('el título', firmado.cuerpo, puesto.titulo);
  par('el párrafo de para-qué-sirve', firmado.cuerpo, puesto.intro);
  /* 🔴 CON LISTA, EL CUERPO SE COMPARA PIEZA POR PIEZA — jamás recompuesto.
     **Lo destapó el discriminador, no una lectura:** al medir el escenario de C
     apareció un SEGUNDO rojo que era RUIDO — el párrafo recompuesto («…riesgo:
     Dificultad, Sangrado…») nunca puede coincidir con el de la letra («…riesgo
     —dificultad, sangrado…»), porque las dos formas puntúan distinto POR
     DISEÑO. ⇒ el brazo ② habría dado **rojo permanente** el día que C
     mergeara, con el contenido entero.
     *Comparar una recomposición contra un original es medir mi propio armado.*
     Con lista se comparan las TRES piezas de prosa —advertencia · intro ·
     cierre— y los signos los cubre el brazo ①: **más estricto, no menos.** */
  if (puesto.signos != null) {
    par('la advertencia dura', firmado.cuerpo, puesto.advertencia);
    par('la entrada a los signos', firmado.cuerpo, puesto.signosIntro);
    par('el cierre tras los signos', firmado.cuerpo, puesto.signosCierre);
  } else {
    par('el párrafo de la advertencia y los signos', firmado.cuerpo, puesto.duro);
  }
  /* Tránsito y acciones: SOLO si la fuente los trae. Una regla no puede exigir
     lo que su letra no firma, ni sobre una forma que no se acordó. */
  if (firmado.transito) par('la línea de tránsito', firmado.cuerpo, puesto.transito);
  for (const a of puesto.acciones) {
    if (!/Ir a urgencias|Reservar cita presencial|Continuar con la videoconsulta/.test(a)) {
      fallos.push(`R67 **la acción «${a}» no es ninguna de las tres firmadas** en §3.`);
    }
  }

  return {
    fallos,
    info:
      `los ${esperados.length} signos firmados, verificados en el texto que se muestra` +
      ` · **forma leída: ${puesto.forma}**` +
      ` · la letra los declara ${firmado.porItems ? 'POR ÍTEMS (`> - `, ancla estructural)' : 'en un párrafo (forma vieja)'}` +
      (puesto.acciones.length ? ` · ${puesto.acciones.length} acción(es) verificadas` : '') +
      ` · vara EXTRAÍDA de \`${LETRA_TELE}\` en esta corrida (cero baseline transcrito)` +
      ` · ⚠️ **NO mide tipografía** (un verbatim en letra chica pasaría y violaría §3)` +
      ` · ⚠️ **NO mide la PARIDAD de las tres acciones** — que ninguna presida es firma del founder y se ve, no se grepea` +
      ` · ⚠️ **vigila SOLO el español**: el \`en\` no tiene fuente firmada`,
  };
}


/**
 * ═══ R68 · NADA DEL COMPONENTE SE LLAMA DENTRO DE UN WORKLET DE GESTO (S106-B)
 *
 * **Nace de TRES crashes reales, y los tres los encontró el founder USANDO la
 * app — ninguno, un gate:** `SliderPrecio` (S58) · `TileVideoPropio` (S106-t2)
 * · `ModalDosAlturas` (S106-t3).
 *
 * **Por qué ningún gate los veía, y está escrito desde S58:** typecheck, lint y
 * el resto de `verify:diseno` corren **en un mundo donde el defecto no existe**
 * — en web los gestos van por JS y jamás lo delatan. *El defecto sólo aparece
 * en el hilo de UI de un aparato, que es exactamente donde no hay CI.*
 *
 * ── QUÉ VIGILA ────────────────────────────────────────────────────────────
 * Dentro del cuerpo de un callback de gesto (`.onStart` · `.onUpdate` ·
 * `.onEnd` · `.onBegin` · `.onFinalize`), **ninguna llamada a una función del
 * componente**. Ese cuerpo corre en el hilo de UI: sólo puede leer *shared
 * values* y primitivas.
 *
 * ── 🔴 EL MATIZ QUE HOY COSTÓ CARO, y sin el cual esta regla sería inútil ──
 * **El `runOnJS` puede estar escrito y correcto, y lo que cruza el hilo es el
 * ARGUMENTO que se calcula para dárselo.** El caso vivo de `TileVideoPropio`:
 *
 * ```js
 * runOnJS(pegar)(masCercana(x.value, y.value))   // ← `masCercana` corre en UI
 * ```
 *
 * ⇒ **la regla quita `runOnJS(fn)` como ENVOLTORIO y sigue mirando adentro de
 * sus argumentos.** *Un guard que sólo preguntara «¿hay runOnJS?» habría dado
 * verde en los tres.*
 *
 * ── LA CURA PREFERIDA, decidida por A con su razón ─────────────────────────
 * **Valores por SHARED VALUE, no directivas `'worklet'`.** *Una directiva se
 * puede olvidar al editar y su ausencia no rompe el build: rompe la app en la
 * mano del usuario. **Un shared value no se olvida, porque el worklet no tiene
 * otra cosa que leer.*** (Es lo que A hizo en `ModalDosAlturas`: `altoDe(…)`
 * pasó a `tope.value` / `piso.value`.)
 *
 * ── LO QUE **NO** VIGILA, declarado ───────────────────────────────────────
 * · **No mira `useAnimatedStyle` ni otros worklets** — sólo gestos, que es donde
 *   los tres casos ocurrieron. *Ensanchar sin un caso medido es inventar
 *   cobertura.*
 * · **No prueba que la app no crashee**: prueba que ESTA forma no está. Su
 *   verde dice «ningún gesto llama al componente», jamás «los gestos andan».
 */
const GESTO_CB = /\.(onStart|onUpdate|onEnd|onBegin|onFinalize|onChange)\s*\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/g;

/** Lo que SÍ puede llamarse dentro del hilo de UI. */
const PERMITIDO_EN_WORKLET = new Set([
  'runOnJS', 'runOnUI', 'withTiming', 'withSpring', 'withDecay', 'withDelay',
  'withSequence', 'withRepeat', 'cancelAnimation', 'interpolate', 'interpolateColor',
  'clamp', 'Math', 'Number', 'String', 'Boolean', 'Array', 'Object', 'JSON',
  'parseFloat', 'parseInt', 'isNaN', 'console', 'Easing',
  /* `scheduleOnRN` es el `runOnJS` de Reanimated 4 — mismo trabajo, nombre
     nuevo. **Lo destapó la primera corrida contra el código real** (`Hoja`), no
     una lista escrita de memoria. */
  'scheduleOnRN',
  /* Palabras clave: `if (…)` NO es una llamada. *El regex no distingue una
     keyword de una función, y sin esta lista la regla grita en todo archivo con
     un condicional adentro de un gesto — que es casi todos.* */
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'do', 'else',
]);

/** Cuerpo balanceado desde la llave de apertura. */
function cuerpoDesde(src, iAbre) {
  let n = 0;
  for (let k = iAbre; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}') { n--; if (n === 0) return src.slice(iAbre + 1, k); }
  }
  return null;
}

/** Nombres de funciones que declaran `'worklet'` — pueden correr en el hilo de
 *  UI y por lo tanto llamarse desde un gesto.
 *
 *  ⚠️ **Se permiten, pero NO son la cura preferida** (nota de A): *una directiva
 *  se puede olvidar al editar y **su ausencia no rompe el build: rompe la app en
 *  la mano del usuario**. Un shared value no se olvida, porque el worklet no
 *  tiene otra cosa que leer.* **Esta regla las acepta donde ya existen y andan;
 *  no las recomienda para lo nuevo.** */
function worklets(archivos) {
  const set = new Set();
  for (const { src } of archivos) {
    for (const m of src.matchAll(/['"]worklet['"]\s*;/g)) {
      const antes = src.slice(Math.max(0, m.index - 400), m.index);
      const d = [...antes.matchAll(/(?:function\s+|const\s+)([A-Za-z_$][\w$]*)/g)].pop();
      if (d) set.add(d[1]);
    }
  }
  return set;
}

function r68(archivos) {
  const fallos = [];
  const esWorklet = worklets(archivos);
  let conGesto = 0;
  let cbMirados = 0;
  let exentos = 0;

  for (const { path, src } of archivos) {
    if (!/Gesture\./.test(src)) continue;
    conGesto++;
    GESTO_CB.lastIndex = 0;
    let m;
    while ((m = GESTO_CB.exec(src)) !== null) {
      const cuerpo = cuerpoDesde(src, src.indexOf('{', m.index + m[0].length - 1));
      if (cuerpo == null) continue;

      /* 🔴 `.runOnJS(true)` EXIME A TODA LA CADENA — y es la OTRA cura legítima,
         la que `SliderPrecio` usa desde S58: con esa bandera el callback entero
         corre en JS y llamar al componente **es legal**.
         *Lo destapó la primera corrida: sin esta exención la regla acusaba a la
         única pieza que YA estaba curada.*
         La ventana es la cadena del gesto — del `Gesture.` previo al siguiente —
         porque la bandera puede ir antes o después del callback. */
      const desde = src.lastIndexOf('Gesture.', m.index);
      const sig = src.indexOf('Gesture.', m.index);
      const hasta = sig > m.index ? sig : src.length;
      if (/\.runOnJS\s*\(\s*true\s*\)/.test(src.slice(desde < 0 ? 0 : desde, hasta))) {
        exentos++;
        continue;
      }
      cbMirados++;
      /* Se quita `runOnJS(fn)` SÓLO como envoltorio: sus ARGUMENTOS siguen
         mirándose, que es donde vivía el caso de `TileVideoPropio`. */
      const limpio = cuerpo
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\brunOnJS\s*\(\s*[A-Za-z_$][\w$]*\s*\)/g, 'runOnJS');

      /* 🔴 LOOKBEHIND, no un grupo que consuma el carácter previo.
         **Lo cazó la auto-prueba y era el defecto exacto que esta regla viene a
         vigilar:** con `(^|[^\w$.])` el match de `runOnJS(` **se comía el
         paréntesis de apertura**, y el siguiente intento arrancaba pegado a
         `masCercana(` sin carácter previo que ofrecer ⇒ **la regla no veía el
         argumento, que es justamente el caso que la parió.**
         *Un guard que falla en su propio caso testigo no es un guard: es una
         regla que da verde.* */
      for (const c of limpio.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
        const nombre = c[1];
        if (PERMITIDO_EN_WORKLET.has(nombre)) continue;
        /* Declarada `'worklet'` ⇒ corre en el hilo de UI y es legal llamarla. */
        if (esWorklet.has(nombre)) continue;
        fallos.push(
          `R68 **${path}** · \`.${m[1]}\` llama a **\`${nombre}(…)\`** dentro del worklet del gesto. ` +
          `**Ese cuerpo corre en el hilo de UI y sólo puede leer shared values.** ` +
          `*Cura preferida (A): pasar el valor por **shared value**, no por una directiva \`'worklet'\` — ` +
          `una directiva se puede olvidar al editar y su ausencia no rompe el build: rompe la app en la mano del usuario.*`,
        );
      }
    }
  }

  /* ANCLA: sin gestos en el corpus, el cero significaría «no miré». */
  if (conGesto === 0) {
    return { fallos, info: 'NO CONCLUYENTE — ningún archivo del corpus usa `Gesture.`' };
  }

  return {
    fallos,
    info:
      `${cbMirados} callback(s) de gesto mirados en ${conGesto} pieza(s) con \`Gesture.\`` +
      (exentos ? ` · ${exentos} exento(s) por \`.runOnJS(true)\` en su cadena (la cura de \`SliderPrecio\`)` : '') +
      ` · nace de TRES crashes que encontró el founder usando la app y ningún gate` +
      ` · quita \`runOnJS(fn)\` como ENVOLTORIO y **sigue mirando sus argumentos** (el caso de \`TileVideoPropio\`)` +
      ` · ⚠️ su verde dice «ningún gesto llama al componente», **jamás «los gestos andan»**`,
  };
}


/* ═══════════════════════════════════════════════════════════════════════════
 * ═══ R69 · NADA ABSOLUTO SE MONTA DESPUÉS DE `SuperficieLlamada` (S106-B t5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🔴 **SALE DE UN DAÑO REAL, no de una hipótesis.** Una capa de overlay se
 * montó como HERMANA de `SuperficieLlamada`, después de ella. En React Native
 * el orden de pintado entre hermanos lo decide el orden del JSX ⇒ **la capa
 * tapó los controles y el founder quedó ENCERRADO en una consulta real**: sin
 * poder volver al video y **sin poder colgar**, con un animal esperando.
 *
 * **La ley existía y estaba escrita:** `DIRECCION_ARTE` dice que colgar es la
 * excepción al ocultado, *porque en una consulta paga quien quiere terminar
 * tiene que poder terminar SIEMPRE*. **Vivía sólo en un documento.**
 *
 * > *Una promesa de diseño que el código no expresa es peor que no haberla
 * > escrito: **se confía en ella al leer**.* Y se confió dos veces — quien
 * > construyó encima, y quien revisó.
 *
 * ── LO QUE MIDE, Y ES UNA SOBRE-APROXIMACIÓN A PROPÓSITO ───────────────────
 * En un archivo que monta `<SuperficieLlamada`, cuenta los
 * `position: 'absolute'` que aparecen **después** de ese montaje. **No decide
 * si son hermanos ni si solapan la barra** — eso exige parsear JSX, y un
 * analizador de React no es un guard (mismo límite que la ② del encargo de A).
 *
 * ⇒ **caza LA FORMA y pide DECLARACIÓN**, como `R53`. *Sobre-aproximar y exigir
 * una frase es honesto; adivinar la geometría y callarse, no.*
 *
 * ── LA SALIDA LEGÍTIMA NO ES DECLARAR: ES `sobreLaBarra` ───────────────────
 * La pieza ganó el slot que faltaba. **Lo que entra ahí queda debajo de la
 * barra POR CONSTRUCCIÓN**, así que el consumidor correcto no tiene ningún
 * absoluto que declarar. *La declaración es para lo que de verdad debe cubrir
 * —el modal de dos alturas—, no para volver a montar afuera.*
 *
 * ⚠️ **SU LÍMITE, ESCRITO:** cuenta declaraciones, **no sabe cuál corresponde a
 * cuál absoluto** (mismo límite que R53). *Su verde dice «hay tantas razones
 * escritas como absolutos», jamás «cada razón es la correcta».* */
function r69(archivos) {
  const fallos = []
  const vistos = new Set()
  let ofensores = 0
  let declarados = 0
  for (const { path, src } of archivos) {
    if (vistos.has(path)) continue
    vistos.add(path)
    const limpio = sinComentarios(src)
    const monta = limpio.indexOf('<SuperficieLlamada')
    if (monta === -1) continue
    /* Se mira DESPUÉS del montaje. Los `absolute` que viven ANTES no pueden
       tapar a la barra por orden de pintado — el que pinta último gana. */
    const despues = limpio.slice(monta)
    const n = [...despues.matchAll(/position:\s*'absolute'/g)].length
    if (n === 0) continue
    ofensores += n
    /* La razón se busca en `src` CRUDO: declarar ES prosa (patrón R45/R53).
       ≥16 caracteres para que un marcador vacío no cuente — lo que hace
       honesto a un escape es que cueste una frase que alguien pueda discutir. */
    const razones = [...src.matchAll(/R69-DECLARADO:\s*\S.{15,}/g)].length
    declarados += Math.min(razones, n)
    if (razones >= n) continue
    fallos.push(
      `R69 **${path}** · ${n} montaje(s) absolutos después de \`<SuperficieLlamada\` y ${razones} declaración(es). ` +
      `La barra de controles —y **colgar**— puede quedar debajo. ` +
      `La salida NO es declarar: es pasarlo por \`sobreLaBarra\`, que lo deja debajo de la barra por construcción. ` +
      `Si de verdad tiene que cubrir, escribí \`R69-DECLARADO: <por qué>\`.`,
    )
  }
  return { fallos, info: `${ofensores} absoluto(s) después del montaje · ${declarados} declarado(s)` }
}

const REGLAS = { R69: r69, R68: r68, R67: r67, R66: r66, R65: r65, R64: r64, R63: r63, R62: r62, R60: r60, R59: r59, R58: r58, R57: r57, R56: r56, R55: r55, R54: r54, R53: r53, R52: r52, R51: r51, R50: r50, R49: r49, R48: r48, R47: r47, R46: r46, R45: r45, R44: r44, R43: r43, R1: r1, R2: r2, R3: r3, R4: r4, R5: r5, R6: r6, R7: r7, R8: r8, R9: r9, R10: r10, R11: r11, R12: r12, R13: r13, R14: r14, R15: r15, R16: r16, R17: r17, R18: r18, R20: r20, R24: r24, R25: r25, R27: r27, R29: r29, R30: r30, R32: r32, R33: r33, R34: r34, R35: r35, R36: r36, R37: r37, R38: r38, R39: r39, R40: r40, R41: r41, R42: r42 };
const INFORMATIVAS = new Set(['R9']); // sin modo de fallo, declarado (el porqué en su header)

// ── GUARD ESTRUCTURAL (S82-B): ninguna regla escapa en silencio ──
let estructuraRota = 0;
for (const nombre of Object.keys(REGLAS)) {
  const enFixtures = nombre in FIXTURES;
  const enInformativas = INFORMATIVAS.has(nombre);
  if (enFixtures === enInformativas) {
    console.error(`ESTRUCTURA ✗ ${nombre} ${enFixtures ? 'está en FIXTURES y en INFORMATIVAS a la vez' : 'no está NI en FIXTURES NI en INFORMATIVAS — escapó de la auto-prueba (L-192)'}`);
    estructuraRota++;
  }
}
for (const nombre of Object.keys(FIXTURES)) {
  if (!(nombre in REGLAS)) {
    console.error(`ESTRUCTURA ✗ ${nombre} tiene fixture pero no regla`);
    estructuraRota++;
  }
}
if (estructuraRota > 0) {
  console.error(`\nverify:diseno — estructura rota (${estructuraRota}): el lint se declara inválido`);
  process.exit(1);
}

let decorativas = 0;
for (const [nombre, fixture] of Object.entries(FIXTURES)) {
  const res = REGLAS[nombre](fixture);
  if (res.fallos.length === 0) {
    console.error(`AUTO-PRUEBA ✗ ${nombre} no salió roja contra su fixture — REGLA DECORATIVA (L-192)`);
    decorativas++;
  }
}
/** AUTO-PRUEBA EXTRA DE R16 (S83-B3) — el mecanismo genérico corre UN
 *  fixture por regla, y R16 tiene TRES brazos cuyas condiciones son
 *  MUTUAMENTE EXCLUYENTES (el de "no separado" y el de "separado con el
 *  mismo hex" no pueden ser ciertos a la vez): ningún fixture único puede
 *  encenderlos todos. El genérico cubre el brazo que la orden pidió —la
 *  mitad oscura sin separar—; estos dos cubren los otros, para que ningún
 *  brazo quede sin su rojo. Un brazo sin prueba es una regla decorativa
 *  adentro de una regla viva, que es L-192 escondida un piso más abajo. */
/* ⏪ **EL PRIMER FIXTURE SE REESCRIBIÓ EN S100d·bis, y el motivo es de método:**
   probaba el brazo *«lightOficio no pisa bg.base»*, que la firma del founder
   DEROGÓ al revocar los dos tapices en claro. **Seguía dando ROJO —así que la
   auto-prueba pasaba— pero por una razón distinta de la que decía su nombre.**
   *Un fixture que enrojece por otro motivo del que declara es un verde flojo
   con la polaridad dada vuelta: no avisa que su brazo murió.* ⇒ ahora prueba
   la letra nueva, que es la divergencia. */
const EXTRAS_R16 = [
  ['R16·brazo claro (las dos casas DIVERGEN en claro)', {
    palette: "light0: '#FAF9F7',\npapelTapiz: '#F6F6F6',\npapelTapizOficio: '#F0F8F6',\ndark0: '#050508',\ntapizDark: '#0D050D',\ntapizDarkOficio: '#080D0E',",
    temas:
      'const lightOficio: Theme = { ...lightTheme,\n  bg: { ...lightTheme.bg, base: palette.papelTapizOficio },\n}\n' +
      'const darkOficio: Theme = { ...darkTheme,\n  bg: { ...darkTheme.bg, base: palette.tapizDarkOficio },\n}',
  }],
  ['R16·brazo OSCURO (las dos casas con el mismo tapiz en oscuro)', {
    /* En claro las dos casas COINCIDEN (la letra nueva), así que el único
       rojo que puede encender este fixture es el de la mitad OSCURA — que es
       lo que viene a probar. */
    palette: "light0: '#FAF9F7',\npapelTapiz: '#F6F6F6',\npapelTapizOficio: '#F6F6F6',\ndark0: '#050508',\ntapizDark: '#0D050D',\ntapizDarkOficio: '#0D050D',",
    temas:
      'const lightOficio: Theme = { ...lightTheme,\n  bg: { ...lightTheme.bg, base: palette.papelTapizOficio },\n}\n' +
      'const darkOficio: Theme = { ...darkTheme,\n  bg: { ...darkTheme.bg, base: palette.tapizDarkOficio },\n}',
  }],
];
/** LOS BRAZOS QUE EL CENSO DESTAPÓ (S83-B7, vía incremental de B4).
 *  El censo por instrumentación midió 42 brazos y encontró 8 sin rojo
 *  propio: no porque nadie los escribiera, sino porque **un fixture solo
 *  puede recorrer UN camino** y estos son excluyentes con el camino que
 *  el ancla ya prueba. Cuatro de los ocho son GUARDS DE FUENTE —el "sin
 *  fuente no hay verificación" de L-192—, que por construcción no se
 *  encienden nunca cuando el fixture trae la fuente: la defensa contra el
 *  silencio vivía sin que nadie hubiera comprobado que suena.
 *
 *  El refactor genérico (fixtures por brazo como DEFAULT, con nombres
 *  declarados y cobertura exigida) queda CANDIDATO con su costo medido:
 *  21 funciones, ~42 sitios, más el runner. Esto es la vía incremental. */
const EXTRAS_BRAZOS = [
  /* S103-B · EL BRAZO `ui` DE R62, aislado. El fixture principal supera el
     baseline de `apps/` (15) y por eso saldría rojo igual con este brazo
     apagado: un brazo que nunca se ejecuta no está probado aunque la regla
     salga roja. Acá `apps/` queda en 1 —debajo de su piso— y los DOS
     montajes de `ui` son lo único que puede pintarlo. */
  ['R62·ui · el montaje dentro de packages/ui sube sobre su baseline', r62, [
    { path: 'packages/ui/src/components/AvatarMascota.tsx', src: 'especie?: X' },
    { path: 'apps/cliente/src/app/ancla.tsx', src: '<AvatarMascota nombre={n} especie={e} />' },
    { path: 'packages/ui/src/components/A.tsx', src: '<AvatarMascota nombre={n} especie={e} />' },
    { path: 'packages/ui/src/components/B.tsx', src: '<AvatarMascota nombre={n} especie={e} />' },
  ]],
  /* ── S103-B · LOS TRES BRAZOS NUEVOS DE R47 Y R48, uno por rojo ───────
     El fixture genérico de cada regla ya sale rojo por el contador de
     `apps/`, así que **no probaría nada de esto**: un brazo que nunca se
     ejecuta no está probado, aunque la regla salga roja. Cada fixture de
     acá enciende UN solo brazo — los otros dos quedan por debajo de su
     baseline a propósito, para que el rojo diga cuál. */
  /* ⚠️ CADA UNO LLEVA UN ARCHIVO DE `apps/` QUE NO ES DECORADO: sin él, el
     fixture sale rojo TAMBIÉN por el ancla del contador viejo (que no
     encontraría un solo uso), y entonces **el brazo nuevo podría dejar de
     andar sin que la auto-prueba se entere** — seguiría roja por la otra
     razón. *Se encontró midiendo estos mismos fixtures, no leyéndolos.* */
  ['R47·ui · el DEFAULT de una pieza que alimenta a Boton', r47, [
    { path: 'apps/cliente/src/app/ancla.tsx', src: '<Boton variante="compacto" />' },
    {
      path: 'packages/ui/src/components/BotonX.tsx',
      src: "export function BotonX({ variante = 'compacto' }) {\n  return <Boton variante={variante} etiqueta=\"x\" />\n}",
    },
  ]],
  ['R47·ui · el LITERAL hardcodeado sube sobre su baseline', r47, [
    { path: 'apps/cliente/src/app/ancla.tsx', src: '<Boton variante="compacto" />' },
    { path: 'packages/ui/src/components/A.tsx', src: '<Boton variante="compacto" />' },
    { path: 'packages/ui/src/components/B.tsx', src: '<Boton variante="compacto" />' },
    { path: 'packages/ui/src/components/C.tsx', src: '<Boton variante="compacto" />' },
  ]],
  /* El ancla: SOLO apps. Si algún día el brazo dejara de encontrar piezas
     —un rename de carpeta, un corpus que se mueve— su silencio diría "no
     miré" y no "no hay". */
  ['R47·ui · el ANCLA (ninguna pieza de ui monta Boton)', r47, [
    { path: 'apps/cliente/src/app/x.tsx', src: '<Boton variante="compacto" />' },
  ]],
  ['R48·ui · el DEFAULT de una pieza que alimenta a Boton', r48, [
    { path: 'apps/cliente/src/app/ancla.tsx', src: '<Boton variante="sinCaja" />' },
    {
      path: 'packages/ui/src/components/BotonY.tsx',
      src: "export function BotonY({ variante = 'sinCaja' }) {\n  return <Boton variante={variante} etiqueta=\"y\" />\n}",
    },
  ]],
  ['R48·ui · el LITERAL hardcodeado sube sobre su baseline (0)', r48, [
    { path: 'apps/cliente/src/app/ancla.tsx', src: '<Boton variante="sinCaja" />' },
    { path: 'packages/ui/src/components/D.tsx', src: '<Boton variante="sinCaja" />' },
  ]],
  ['R48·ui · el ANCLA (ninguna pieza de ui monta Boton)', r48, [
    { path: 'apps/cliente/src/app/y.tsx', src: '<Boton variante="sinCaja" />' },
  ]],
  /* ── R34 brazo B: la lista de red que arranca vacía (S92-BIS) ──────────
     Su rojo va APARTE del brazo A a propósito: el fixture de A no tiene
     `useState<T[]>([])` y el de B no tiene `ofrecibles()`, así que ninguno
     puede encender los dos y cada brazo queda probado por su cuenta. Es la
     misma disciplina que R18 y R16 ya aplican.
     El fixture es el CÓDIGO REAL que produjo el P0, recortado. */
  ['R34·lista de red que arranca en [] y no puede decir que falló', r34, [
    {
      path: '(fixture)',
      src:
        'const [mascotas, setMascotas] = useState<MascotaResumen[]>([]);\n' +
        'const r = await obtenerMascotasDeFamilia(familiaId);\n' +
        'if (!vigente || !r.ok) return;\n' +
        'setMascotas(r.data);',
    },
  ]],
  // ── R14: los tres guards, en el orden en que la función los alcanza ──
  ['R14·sin la fuente (hogar/index.tsx ausente)', r14, [{ path: 'x/OTRO.tsx', src: '' }]],
  ['R14·constantes ausentes en el hogar', r14, [{ path: 'x/hogar/index.tsx', src: 'const NADA = 1;' }]],
  ['R14·spacing fuera de la tabla espejada', r14, [
    { path: 'x/hogar/index.tsx', src: 'const RESPIRO_BANDA = spacing[99];\nconst SOLAPE_RECO = spacing[98];' },
  ]],
  // ── R16: el guard de fuente que nació decorativo EN B3, escrito por mí ──
  ['R16·sin los tokens del tapiz en palette', r16, { palette: '', temas: '' }],
  // ── R18: la entrada VIVE (no dispara su otro brazo) y hay __DEV__ ──
  // S85-B1 · los DOS brazos de __DEV__ tienen su rojo por separado, y el
  // orden importa: en el GRUESO el `__DEV__` va DESPUÉS de la entrada, así
  // que no puede envolverla ni encender el preciso. Un fixture que
  // encendiera los dos no probaría ninguno (el precedente de R16/R24).
  ['R18·__DEV__ ajeno, sin envolver (brazo grueso)', r18, [{ ruta: '(fixture)', src: 'router.push("/gallery")\nif (__DEV__) console.log("nada que ver")' }, { ruta: '(fixture2)', src: 'router.push("/gallery")' }]],
  ['R18·__DEV__ ENVUELVE la entrada — if (brazo preciso)', r18, [{ ruta: '(fixture)', src: 'if (__DEV__) { router.push("/gallery") }' }, { ruta: '(fixture2)', src: 'router.push("/gallery")' }]],
  ['R18·__DEV__ ENVUELVE la entrada — && en JSX (brazo preciso)', r18, [{ ruta: '(fixture)', src: '{__DEV__ && <Celda onPress={() => router.push("/gallery")} />}' }, { ruta: '(fixture2)', src: 'router.push("/gallery")' }]],
  // ── R30: el ANCLA, que es el guard de fuente de esta regla. Sin
  //    registry el SET queda vacío, ningún path matchea y la regla pasaría
  //    en VERDE habiendo comparado contra NADA. Su fixture principal trae
  //    el registry lleno a propósito, así que este brazo no se enciende
  //    ahí: sin esta línea, el guard nacería decorativo (el caso de R16).
  ['R30·sin el registry (el SET vacío no verifica nada)', r30, [{ path: 'apps/cliente/src/(fixture)/X.tsx', src: '<Path d="M4.4 5.2h15.2a1.5 1.5 0 0 1 1.5 1.5v9.8Z" />' }]],
  /* ── R35: EL ANCLA, que es su guard de fuente y el brazo que faltaba.
     Sin un archivo de `packages/ui/src/gallery/` en el corpus, R35
     informaría "0 colores a mano" en VERDE sobre el único lugar de `ui`
     que se compone como pantalla — que es el lugar POR EL QUE nació. Su
     fixture principal trae la galería a propósito, así que este brazo no
     se enciende ahí: sin esta línea el guard nacería decorativo. */
  ['R35·sin la galería en el corpus (el ancla)', r35, [{ path: 'packages/ui/src/components/X.tsx', src: '' }]],
  /* ── LAS CUATRO DEL NORTE: sus anclas. Los fixtures principales traen
     RELLENO_APPS justamente para que el ancla NO se encienda y se pruebe
     el brazo real; estos cuatro prueban el ancla misma, con corpus corto
     y sin violación. Sin ellos, cuatro guards de fuente vivirían sin que
     nadie hubiera comprobado que suenan (el caso de R16 en S83). */
  ['R36·ancla (corpus de apps derrumbado)', r36, [{ path: '(fixture)', src: '' }]],
  ['R37·ancla (corpus de apps derrumbado)', r37, [{ path: '(fixture)', src: '' }]],
  ['R38·ancla (corpus de apps derrumbado)', r38, [{ path: '(fixture)', src: '' }]],
  ['R39·ancla (corpus de apps derrumbado)', r39, [{ path: '(fixture)', src: '' }]],
  /* ── R40: LA PARIDAD (brazo ②) — el modo de falla que un contador
     global NO ve: un idioma recibe la firma y el otro no. Con UNA clave
     en `es` y ninguna en `en`, el contador da 1 (= baseline, verde) y
     solo la paridad puede ponerlo rojo. Por eso va aparte. */
  ['R40·paridad es↔en (un idioma curado y el otro no)', r40, [
    { path: 'apps/prestador/src/i18n/es.ts', src: '    adminAvisoPENDIENTE:' },
    { path: 'apps/prestador/src/i18n/en.ts', src: '' },
    { path: 'apps/cliente/src/i18n/es.ts', src: '' },
    { path: 'apps/cliente/src/i18n/en.ts', src: '' },
  ]],
  // ── R40: el ancla (guard de fuente) — sin los cuatro diccionarios
  //    informaría "0 placeholders" habiendo leído nada.
  ['R40·ancla (los diccionarios no se leyeron)', r40, [{ path: 'apps/cliente/src/i18n/es.ts', src: '' }]],
];
for (const [nombre, regla, fx] of EXTRAS_BRAZOS) {
  if (regla(fx).fallos.length === 0) {
    console.error(`AUTO-PRUEBA ✗ ${nombre} no salió roja — BRAZO DECORATIVO (L-192)`);
    decorativas++;
  }
}

/* ── S103-B · LA PRUEBA NEGATIVA DEL BRAZO DE `ui` ────────────────────
   Todo lo de arriba prueba que la regla SUENA. Esto prueba lo otro, que
   en un ratchet es igual de caro: **que no suena donde no debe.** Su
   cabecera afirma que mide el TAG y no la palabra, y una afirmación que
   un gate hace sobre sí mismo tiene que ser medible o es decoración.
   Los cuatro casos son REALES, medidos en el árbol vivo al abrir la
   tanda — no inventados para que pasen. */
{
  const NO_DEBEN_CONTAR = [
    ['otra pieza con la misma palabra (`HeroMarca variante="compacto"`, 7 vivos en la galería)',
     '<Boton variante="secundario" />\n<HeroMarca variante="compacto" />'],
    ['otra prop con la misma palabra y sin llegar a Boton (`ChipEntidad tamano = \'compacto\'`)',
     "export function Chip({ tamano = 'compacto' }) {\n  return <Boton variante=\"secundario\" etiqueta={tamano} />\n}"],
    ['el PREFIJO compartido (`<BotonCopiar variante="compacto">`) — la pieza del caso se llama así',
     '<Boton variante="secundario" />\n<BotonCopiar variante="compacto" />'],
    ['la palabra en un comentario (documentar una muerte no puede aumentarla)',
     '<Boton variante="secundario" />\n/* la lápida de variante="compacto" */'],
  ];
  for (const [queEs, src] of NO_DEBEN_CONTAR) {
    const r = jubiladaEnPiezasUi([{ path: 'packages/ui/src/components/N.tsx', src }], 'compacto');
    if (r.porLiteral.length > 0 || r.porDefault.length > 0) {
      console.error(
        `AUTO-PRUEBA ✗ R47·ui contó lo que NO debe: ${queEs}. Un ratchet que sobre-dispara se apaga a la semana, y con él se apagan los brazos que sí eran defectos.`,
      );
      decorativas++;
    }
    // Y que el ancla siga viva en el mismo caso: si `montajes` cayera a 0,
    // el cero de arriba diría "no miré" en vez de "no contó" (L-192).
    if (r.montajes !== 1) {
      console.error(`AUTO-PRUEBA ✗ R47·ui perdió el ancla midiendo el caso negativo: ${queEs}`);
      decorativas++;
    }
  }
}

const EXTRAS_R27 = [
  ['R27·brazo darkOficio (sin pisar active)', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, active: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, control: palette.tealDark },\n}',
  }],
  ['R27·el registro equivocado (puro en claro, que REPRUEBA)', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, active: palette.teal },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, active: palette.teal },\n}',
  }],
  ['R27·guard de fuente (themes ausente)', { temas: '' }],
  // 🔴 S98-B (D-813) · EL BRAZO DEL TINTE, CON TODO LO DEMÁS SANO — que es
  // la única forma de probar que el slot nuevo se vigila de verdad. Las
  // dos casas pisan `control`, `active` y `marcaEleccion` correctamente y
  // NINGUNA pisa `controlBg`: es EXACTAMENTE el estado que vivió en
  // producción hasta hoy, y con el que la regla vieja daba VERDE.
  // *Si este brazo no sale rojo, el cuarto slot es decorativo.*
  ['R27·brazo controlBg (todo lo demás sano — el estado que vivió en producción)', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, control: palette.tealDark, active: palette.tealDark, marcaEleccion: palette.tealDark, activoLleno: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, control: palette.teal, active: palette.teal, marcaEleccion: palette.teal, activoLleno: palette.teal },\n}',
  }],
  // Y su hermano: el slot PISADO pero con el registro del OTRO tema. Un
  // guard que solo mirara presencia dejaría pasar el tinte claro en el
  // tema oscuro, que es un alfa distinto por medición, no por gusto.
  ['R27·brazo controlBg con el alfa cruzado', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, control: palette.tealDark, controlBg: palette.tealAlpha15, active: palette.tealDark, marcaEleccion: palette.tealDark, activoLleno: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, control: palette.teal, controlBg: palette.tealAlpha16, active: palette.teal, marcaEleccion: palette.teal, activoLleno: palette.teal },\n}',
  }],
  /* ── S99-B · EL BRAZO DEL QUINTO SLOT, `activoLleno` ────────────────
     Mismo molde que los dos de D-813 y por la misma razón: **las dos
     casas sanas en TODO salvo el slot que se prueba**, para que el rojo
     no pueda venir de otro lado. *Un rojo que puede venir de cinco
     lugares no prueba ninguno de los cinco.* */
  ['R27·brazo activoLleno (lightOficio no lo pisa, todo lo demás sano)', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, control: palette.tealDark, controlBg: palette.tealAlpha16, active: palette.tealDark, marcaEleccion: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, control: palette.teal, controlBg: palette.tealAlpha15, active: palette.teal, marcaEleccion: palette.teal, activoLleno: palette.teal },\n}',
  }],
  // Y su hermano, el registro DADO VUELTA: el disco es RELLENO, así que
  // en oscuro va el puro. Un guard que solo mirara presencia dejaría
  // pasar el verde del muro nocturno, que contra la barra oscura se
  // hunde (1.4) — el marcador existiría y no se vería.
  ['R27·brazo activoLleno con el registro cruzado (darkOficio en tealDark)', {
    temas:
      'const lightOficio: Theme = {\n  accent: { ...lightTheme.accent, control: palette.tealDark, controlBg: palette.tealAlpha16, active: palette.tealDark, marcaEleccion: palette.tealDark, activoLleno: palette.tealDark },\n}\n' +
      'const darkOficio: Theme = {\n  accent: { ...darkTheme.accent, control: palette.teal, controlBg: palette.tealAlpha15, active: palette.teal, marcaEleccion: palette.teal, activoLleno: palette.tealDark },\n}',
  }],
];
for (const [nombre, fx] of EXTRAS_R27) {
  if (r27(fx).fallos.length === 0) {
    console.error(`AUTO-PRUEBA ✗ ${nombre} no salió roja — BRAZO DECORATIVO (L-192)`);
    decorativas++;
  }
}


for (const [nombre, fx] of EXTRAS_R16) {
  if (r16(fx).fallos.length === 0) {
    console.error(`AUTO-PRUEBA ✗ ${nombre} no salió roja — BRAZO DECORATIVO (L-192)`);
    decorativas++;
  }
}


if (decorativas > 0) {
  console.error(`\nverify:diseno — ${decorativas} regla(s) decorativa(s): el lint se declara inválido`);
  process.exit(1);
}

// ── LA CORRIDA REAL ──
let fallosTotal = 0;
const corridas = [
  ['R57 (la seccion de pago es UNA, medida)', r57(apps)],
  ['R1 (7bis/SelectorOpcion)', r1(apps)],
  ['R2 (Ley 1 hex crudos, apps)', r2(apps)],
  ['R3 (A6+§7/Tarjeta: contrato + censo)', r3(apps)],
  ['R4 (Ley 20 sombras artesanales, apps+ui)', r4([...apps, ...ui])],
  ['R5 (Ley 21/Boton: el CTA no se re-resuelve)', r5(apps)],
  ['R6 (D-498/EvitaTeclado: teclado crudo)', r6(apps)],
  ['R7 (§5/Entrada: FadeIn artesanal)', r7(apps)],
  ['R8 (Ley 13/EstadoVacio: el vacío no se anima)', r8(apps)],
  ['R9 (Ley 17.5/EstadoVacio — informativa)', r9(apps)],
  ['R10 (override-s82c atado a su casa)', r10(apps)],
  ['R11 (LOYALTY §3: la voz del momento sin score)', r11(dics)],
  ['R14 (el solape no tapa el saludo)', r14(apps)],
  ['R35 (Ley 1: el color aplicado sale del tema — ui+galería+apps)', r35([...apps, ...ui, ...galeria])],
];
// R12 y R15 corren sobre el volcador vivo; si cayó, FALLAN FUERTE.
const dump = volcadorReal();
if ('caido' in (dump ?? {})) {
  corridas.push(['R12 (contraste dos temas)', { fallos: [`el VOLCADOR no corrió (${dump.caido}) — sin pares no hay verificación (L-192)`], info: 'VOLCADOR CAÍDO' }]);
  corridas.push(['R15 (exclusión A5)', { fallos: [`el VOLCADOR no corrió (${dump.caido}) — sin tokens no hay verificación (L-192)`], info: 'VOLCADOR CAÍDO' }]);
} else {
  // S90-B: el volcador DICE POR DÓNDE corrió. No es adorno — es lo que
  // permite ver desde el reporte que la cascada hizo falta (o que no).
  const r12r = r12(dump.pares);
  corridas.push([
    'R12 (contraste dos temas: texto 4.5 · canto 3.0)',
    { ...r12r, info: `${r12r.info ?? ''} · volcador vía ${dump.via}` },
  ]);
  corridas.push(['R15 (A5 §9bis.3: la familia de #0F5E56 fuera del tema cliente)', r15(dump.tokens)]);
}
corridas.push(['R13 (A6: control contorneado, cliente)', r13(apps)]);
corridas.push(['R16 (papel tapiz: el prestador no recibe tinte)', r16(FUENTES_R16)]);
corridas.push(['R17 (la galería no envejece)', r17(FUENTES_R17)]);
corridas.push(['R20 (la familia alerta no se rellena)', r20([...apps, ...ui])]);
corridas.push(['R18 (D-580 enmendada S107: la entrada a la galería NO desaparece — sólo el PRESTADOR; la del cliente se retiró por firma)', r18(CUENTAS_GALERIA.map((ruta) => ({ ruta, src: readFileSync(ruta, 'utf8') })))]);
corridas.push(['R24 (el pie de reserva no se copia)', r24(apps)]);
corridas.push(['R25 (la pata no se reinventa)', r25([...apps, ...ui])]);
corridas.push(['R30 (el glifo no se re-dibuja: apps contra el registry)', r30([...apps, ...ui])]);
corridas.push(['R27 (el pink no enfoca en el prestador)', r27(FUENTES_R27)]);
corridas.push(['R29 (sinPie no viaja solo)', r29(apps)]);
corridas.push(['R32 (la esquina compartida: los 20dp de la lámina)', r32(apps)]);
corridas.push(['R33 (la superficie de la huella se declara)', r33(apps)]);
corridas.push(['R34 (una lista de tres estados no se decide por el largo)', r34(appsCodigo)]);
// ── LAS CUATRO DEL NORTE (mesa 13-ago) ──
corridas.push(['R36 (N2 el ritmo: el espaciado sale del token)', r36(apps)]);
corridas.push(['R37 (N4 el radio único: una sola escala)', r37(apps)]);
corridas.push(['R38 (N3 la muerte del separador: 3 por pantalla)', r38(apps)]);
corridas.push(['R39 (N1 la escala: 3 tamaños a mano por pantalla)', r39(apps)]);
corridas.push(['R40 (el placeholder sin firma no se embarca en silencio)', r40(DICS_R40)]);
corridas.push(['R41 (lo que se mueve de verdad mira useReducedMotion)', r41(ui)]);
corridas.push(['R42 (la puerta de la foto no se re-dibuja)', r42([...apps, ...ui])]);
corridas.push(['R43 (N11: el contorno del campo tiene piso)', r43(FUENTES_R43)]);
corridas.push(['R44 (N12.4: el error dice QUE esta mal)', r44(CORPUS_R44)]);
corridas.push(['R45 (D-828: el lector de rango no se consume en silencio)', r45([...apps, ...appsCodigo, ...leer(archivosCodigo('packages/api/src'))])]);
corridas.push(['R46 (el selector de indicativo no se va con el campo que muere)', r46(apps)]);
/* S103-B · el corpus se ENSANCHA y los contadores viejos NO se mueven:
   cada función filtra `packages/ui` fuera de su conteo de `apps/`. Se
   pasa junto y se separa adentro porque la auto-prueba genérica le da UN
   solo array a la regla — meter dos parámetros habría dejado el brazo
   nuevo sin fixture, que es una rama sin ejecutar. */
corridas.push(['R64 (una pantalla de cierre no promete un efecto que nadie ejecuta)', r64([...apps, ...appsCodigo, ...ui, ...galeria])]);
/* 🔴 R66 usa el corpus de LÓGICA, no `apps`/`ui`: **los diccionarios son `.ts`
   y aquellos solo recorren `.tsx`**. Lo cazó el ancla de la propia regla en su
   PRIMERA corrida —dijo «no miré» en vez de un cero tranquilizador—, que es
   exactamente el defecto que `archivosCodigo` existe para evitar desde S82.
   *Un lint que se apaga por una extensión no dice «ya no miro»: dice un número
   más chico, y eso se lee como progreso.* */
/* R67 · su corpus es SOLO el diccionario `es` del cliente — la vara la lee de
   la letra con `readFileSync`, no del corpus. `appsCodigo` lo contiene. */
corridas.push(['R67 (el aviso de teleconsulta no se acorta)', r67(appsCodigo)]);
/* R68 · corre sobre `ui` Y las apps: un gesto mal escrito rompe igual viva donde
   viva, y dos de los tres casos fueron piezas del sistema. */
/* Se le pasa TAMBIÉN el código `.ts`: los helpers `'worklet'` viven ahí
   (`foto-encuadre.ts`), y sin ellos la regla acusaría a quien los usa bien. */
corridas.push(['R69 (nada absoluto despues de SuperficieLlamada)', r69([...apps, ...appsCodigo])]);
corridas.push(['R68 (nada del componente dentro de un worklet de gesto)', r68([...ui, ...apps, ...appsCodigo, ...leer(archivosCodigo('packages/ui/src'))])]);
corridas.push(['R66 (la voz no vuelve al voseo)', r66([...appsCodigo, ...leer(archivosCodigo('packages/ui/src')), ...leer(archivosCodigo('packages/api/src')), ...galeria])]);
corridas.push(['R65 (el area de reserva de una marca ajena sigue entrando)', r65(apps)]);
corridas.push(['R63 (una superficie no promete una ruta que nadie sirve)', r63([...apps, ...appsCodigo])]);
corridas.push(['R62 (la prop jubilada no se sigue montando)', r62([...apps, ...ui, ...galeria])]);
corridas.push(['R60 (Boton no ocupa el alignSelf del padre)', r60(ui)]);
corridas.push(['R59 (un comentario JSX sin llaves es texto: D-882)', r59([...apps, ...ui, ...galeria])]);
corridas.push(['R58 (Texto no gana un color de acento: N23)', r58(ui)]);
corridas.push(['R47 (la variante jubilada no crece: Boton compacto)', r47([...apps, ...ui])]);
corridas.push(['R48 (el alias renombrado no crece: Boton sinCaja -> apoyada)', r48([...apps, ...ui])]);
corridas.push(['R49 (N11-prima: el placeholder no repite la etiqueta)', r49(apps)]);
corridas.push(['R50 (elegir uno de varios sin decir cual)', r50([...apps, ...appsCodigo, ...leer(archivosCodigo('packages/api/src'))])]);
corridas.push(['R51 (un token legado no entra a una pieza nueva)', r51([...apps, ...ui])]);
corridas.push(['R52 (G-16: «Programar otra fecha» no vuelve)', r52([...apps, ...appsCodigo])]);
corridas.push(['R53 (un pie fijo reserva su propio lugar)', r53([...apps, ...appsCodigo])]);
corridas.push(['R56 (el oro no es tinta en el cliente)', r56([...apps, ...appsCodigo])]);
corridas.push(['R55 (el tope lo paga Encabezado, y nadie mas)', r55([...apps, ...appsCodigo])]);
corridas.push(['R54 (el pie no se envuelve en un View que capture)', r54([...apps, ...appsCodigo])]);

/** SEGUNDO GUARD ESTRUCTURAL (S82-B r35) — el hueco que encontré
 *  construyendo R24: una regla puede estar en REGLAS, tener su fixture,
 *  PASAR la auto-prueba… y no correr NUNCA contra el código real, porque
 *  `corridas` se arma a mano. Salió roja contra su fixture y muda contra
 *  la casa: exactamente el modo de falla que L-192 prohíbe, un piso más
 *  arriba. El guard cierra el triángulo (regla · fixture · corrida). */
const enCorridas = new Set(corridas.map(([n]) => n.match(/^R\d+/)?.[0]));
for (const nombre of Object.keys(REGLAS)) {
  if (!enCorridas.has(nombre)) {
    console.error(`ESTRUCTURA ✗ ${nombre} tiene regla y fixture pero NO CORRE contra el código real (L-192)`);
    estructuraRota++;
  }
}

/** TERCER GUARD ESTRUCTURAL (S97+-B) — LA DIRECCIÓN QUE FALTABA, y la
 *  encontró un defecto REAL de esta misma casa, no una previsión.
 *
 *  EL CASO: **R35 corría en `corridas` sin estar en `REGLAS`.** Nació en
 *  S96-B así y sobrevivió dos sesiones. Los otros dos guards preguntan
 *  «¿toda regla REGISTRADA está probada?» y «¿toda regla REGISTRADA
 *  corre?» — los dos iteran `REGLAS`, así que **una regla que corre sin
 *  registrarse es invisible para los tres**: no tiene fixture, nadie
 *  comprobó jamás que pueda salir roja, y su número igual se imprime
 *  cada corrida con cara de medición. En S96 y en S97 se reportó «R35
 *  DURA EN 0» leyendo una regla de la que nadie había verificado que
 *  supiera decir que no.
 *
 *  ⇒ Es L-192 en su forma más incómoda: **el guard escrito para impedir
 *  que una regla escape en silencio tenía él mismo la puerta abierta**,
 *  porque vigilaba el registro en vez de vigilar lo que corre. El
 *  triángulo (regla · fixture · corrida) solo se cierra si se recorre en
 *  los dos sentidos.
 *
 *  ☠️ CONDICIÓN DE MUERTE: ninguna — muere con el lint. */
for (const [etiqueta] of corridas) {
  const nombre = etiqueta.match(/^R\d+/)?.[0];
  if (nombre === undefined) {
    console.error(`ESTRUCTURA ✗ una corrida no declara su regla en la etiqueta: "${etiqueta}"`);
    estructuraRota++;
    continue;
  }
  if (!(nombre in REGLAS)) {
    console.error(
      `ESTRUCTURA ✗ ${nombre} CORRE contra el código real pero NO está en REGLAS — escapó de la auto-prueba y de los otros dos guards, que iteran REGLAS (L-192). Su número se imprime cada corrida sin que nadie haya comprobado que la regla pueda salir roja.`,
    );
    estructuraRota++;
  }
}
if (estructuraRota > 0) {
  console.error(`\nverify:diseno — estructura rota (${estructuraRota}): el lint se declara inválido`);
  process.exit(1);
}

for (const [nombre, res] of corridas) {
  console.log(`${nombre} · ${res.info}`);
  for (const f of res.fallos) { console.error(`  ✗ ${f}`); fallosTotal++; }
}

if (fallosTotal > 0) {
  console.error(`\nverify:diseno — ${fallosTotal} fallo(s)`);
  process.exit(1);
}
console.log(`\nverify:diseno — VERDE (auto-prueba: ${Object.keys(FIXTURES).length} reglas encendieron; informativas declaradas: ${[...INFORMATIVAS].join(',')})`);
