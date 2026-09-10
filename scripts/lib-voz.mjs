/**
 * ═══ LA VOZ DE LA CASA, HECHA MEDIBLE ═════════════════════════════════════
 *
 * 🔴 **LA LÓGICA NO ES MÍA: ES DE LA PISTA C**, de su `scripts/censo-voseo.mjs`
 * (S105-C, `da49d06c`). **Se movió acá sin cambiarle una regla** para que la
 * pueda consumir un juez, y con ella vienen **sus siete trampas ya resueltas**
 * — que son el valor real de este archivo, porque cada una costó un falso
 * positivo o un falso negativo:
 *
 *   1-5 · las de su barrida original (tildes, enclíticos, pronombres…)
 *   6 · **un comentario de BLOQUE multilínea** no empieza con `*` en todas sus
 *       líneas, y una v1 lo leía como voz ⇒ se rastrea el estado del bloque.
 *   7 · **`vos` como SUBCADENA** de «nuevos», «activos», «archivos». Un
 *       pronombre corto necesita frontera de verdad, y `\b` **no sirve después
 *       de una tilde** ⇒ se mira el vecino.
 *
 * ⇒ **No se reescribe. Si hay que afinarla, se afina acá y los dos
 *    consumidores la heredan** — el CLI de C y `R66`.
 *
 * ── ⑧ LA TRAMPA QUE AGREGA B, y salió de correr el instrumento sobre `ui` ──
 *
 * `packages/ui/src/components/leer-archivo.ts:47` decía *«uri **venía**
 * pre-codificado»* y el censo lo contaba como **`vení`**. **Es la trampa 7 otra
 * vez, con otro verbo**: la forma voseante estaba adentro de una palabra que no
 * es voz.
 *
 * **La cura es general, no un parche por palabra:** un imperativo voseante o un
 * pronombre **no puede estar seguido de una letra** — `venía` = `vení` + `a` ⇒
 * descarta; `pedía` = `pedí` + `a` ⇒ descarta; `Probá tu…` ⇒ cuenta.
 *
 * ── 🔴 …CON UNA EXCEPCIÓN, Y CASI ME CUESTA TRES VOSEOS REALES ─────────────
 *
 * **La `s` NO descarta**, porque `verbo + s` **es** la 2ª persona voseante:
 * `elegís` = `elegí` + `s`. **Es voz, y la primera versión de esta frontera la
 * callaba.**
 *
 * Lo encontró **comparar mi resultado con el del CLI de C línea por línea**, no
 * el fixture: yo daba 37 donde él daba 41, y de esas cuatro **tres eran voseo
 * de verdad** (*«Elegís por dónde te llegan»* ×3) y **una era su falso
 * positivo** (`activá` dentro de `activar`).
 *
 * **Y lo que lo vuelve la clase de defecto más cara: el número BAJABA.** De 41
 * a 37 sin que nadie tocara una cadena — *en un lint, un número más chico se
 * lee como progreso* (L-226). **Un guard de voz que calla voz es peor que no
 * tener guard: da permiso.**
 *
 * ⚠️ **Y deja al descubierto un hueco de la lista que NO es mío ni de la
 * frontera: `elegís` no está en `PRON`.** El CLI lo cazaba **por accidente**
 * —porque `elegí` es subcadena suya—, no por diseño. Lo mismo puede pasar con
 * cualquier otra forma en `-ás`/`-és`/`-ís` que falte. **La frontera con la
 * excepción de la `s` lo cubre por construcción** SOLO si el verbo base está
 * listado — y varios no lo estaban.
 *
 * ── ⑨ EL CENSO DE SEGUNDO ORDEN, Y LO QUE ENCONTRÓ ────────────────────────
 *
 * Para no adivinar qué faltaba, se barrieron los diccionarios buscando
 * **palabras terminadas en `-ás`/`-és`/`-ís` que el censo NO estuviera
 * cazando**: 15 candidatos, revisados uno por uno.
 *
 * **SEIS eran voseo real y no estaban en ninguna lista:**
 * `cancelás` · `atendés` · `decís` · `subís` · `trabajás` · `vendés`.
 *
 * **NUEVE eran falsos candidatos, y su razón importa para no "curarlos":**
 * `además` · `atrás` · `demás` · `después` · `través` (adverbios y
 * preposiciones) · y **`estás` · `podrás` · `tendrás` · `verás`**, que son
 * **idénticos en tuteo y voseo** — *el futuro y `estar` no se vosean, y quien
 * los "corrija" va a romper voz que está bien.*
 *
 * 🔴 **Consecuencia medida: el censo viejo subcontaba.** El prestador no tenía
 * 41 sino más, y `packages/ui` no tenía 1 sino 2 — *la segunda era `cancelás`,
 * en una cadena que escribí yo.* **Ningún baseline puede salir de un censo que
 * no había cerrado sus huecos.**
 *
 * *Los enclíticos quedan afuera de la frontera a propósito: son palabras
 * completas y ya vienen listados enteros (`probalo`, `contanos`).*
 */

import { readFileSync } from 'node:fs';

/* 🔴 LAS TRES LISTAS VIVEN EN `scripts/lib-voseo.json`, NO ACÁ (firma founder,
   6-sep-2026). Había TRES copias de la misma lista —ésta, el cinturón de D en
   `supabase/functions` y el gate de voz de E— y las tres divergían: a ésta le
   faltaban 16 formas, entre ellas `bañalo`, `mostrame` y `avisame`, que E midió
   saliendo a una familia. *Tres copias de un vocabulario no son redundancia:
   son tres verdades distintas, y la que falla es siempre la que nadie miró.*

   La API NO cambia: `CON_TILDE`, `ENCL` y `PRON` siguen exportándose igual, así
   que ningún consumidor se entera. Lo vigila `verify:lista-voseo`. */
import { readFileSync as _leerVoseo } from 'node:fs'
/* 🔴 LA LISTA VIVE EN `supabase/functions/_shared/voz/voseo.json` — la de D — y
   NO en `scripts/`. Medido: `scripts/` y `supabase/` **sí pueden compartir un
   JSON** (mismo repo, ruta relativa; los dos lo leen con `readFileSync`), así
   que no hacía falta un tercer lugar. Y el formato de D es mejor que el que yo
   había hecho: son PARES voseo→tuteo, o sea que sirven para CURAR y no sólo
   para detectar.

   Las dos listas eran complementarias —72 formas sólo en la mía, 24 sólo en la
   suya— y ninguna de las dos estaba mal: *cada una había medido su propio
   territorio, y ese es exactamente el modo en que tres copias divergen sin que
   ninguna sea la equivocada.* Hoy viven en un solo archivo.

   ☠️ **ACÁ DECÍA «138 pares» Y SON 132** (medido S114-B). Nadie lo movió:
   la prosa se escribió una vez y la lista siguió su vida. **Es el sexto
   contador escrito que se cae en esta casa** —piezas, wrappers, migraciones,
   fichas— y la cura es siempre la misma: *el número se pide, no se escribe.*
   Está abajo, en `ALCANCE_VOZ`, derivado del objeto.

   ⚠️ Un `null` en la segunda columna significa DETECTA PERO NO CURA: la raíz
   puede diptongar (`mostrá`→`muestra`) y derivarlo a ciegas metería un tuteo
   inventado en una tabla que después alguien aplica sin leer. */
const _VOSEO = JSON.parse(_leerVoseo(
  new URL('../supabase/functions/_shared/voz/voseo.json', import.meta.url), 'utf8'))
const _FORMAS = _VOSEO.pares.map((p) => p[0])

/* La API no cambia: las tres siguen exportándose. Pero el reparto NO puede ser
   por tilde, y esto lo cobró el primer intento: `vos` y `sos` no llevan tilde,
   cayeron en ENCL —que se busca con `includes`, sin frontera— y R66 marcó
   **veinte falsos**: «avi·sos», «pa·sos», «ca·sos», «archi·vos», «en·víos».
   *Un reparto por ortografía agrupa cosas que la gramática separa.*

   Lo que de verdad define a un enclítico es que TERMINA EN PRONOMBRE (-lo, -la,
   -le, -me, -te, -nos, -se). Ésos sí pueden buscarse sin frontera derecha,
   porque ya la traen. Todo lo demás va a las listas con frontera. */
const _esEnclitico = (f) => /(lo|la|le|me|te|nos|se)$/.test(f) && f.length > 4
const _tieneTilde = (s) => /[áéíóú]/.test(s)
export const ENCL = _FORMAS.filter(_esEnclitico)
export const CON_TILDE = _FORMAS.filter((f) => !_esEnclitico(f) && !/[sn]$/.test(f))
export const PRON = _FORMAS.filter((f) => !_esEnclitico(f) && /[sn]$/.test(f))

/** ⑪ · `sos` (voseo de «eres»). Va aparte porque, como `vos`, es CORTO y
 *  necesita frontera de vecino: «esos», «presos», «sospecha», «nosotros» lo
 *  contienen y no son voz. Control corrido: 0 falsos positivos en los siete
 *  casos probados. */
const SOS = /(^|[^a-záéíóúñ])sos([^a-záéíóúñ]|$)/i;

/** Los que exigen frontera derecha (trampa ⑧). Los enclíticos NO: son palabras enteras. */
const CON_FRONTERA = [...CON_TILDE, ...PRON];

/* ⑬ — **LAS PALABRAS CORTAS EXIGEN LAS DOS FRONTERAS, y esto lo cobró ampliar
   la lista.** `vos` y `sos` entraron con la lista unificada y R66 marcó VEINTE
   falsos en un solo archivo: «avi·sos», «pa·sos», «ca·sos», «archi·vos»,
   «en·víos», «nue·vos». La trampa ⑧ mira lo que SIGUE al término; acá el ruido
   entra por lo que lo PRECEDE.
   *Una forma de tres letras no es una palabra rara: es una sílaba común, y
   buscarla sin frontera izquierda encuentra el idioma entero.* */
/**
 * ═══ EL ALCANCE, PUBLICADO — S114-B (`L-500`) ══════════════════════════════
 *
 * 🔴 **Lo pidió C midiendo, y su control negativo estaba limpio:** `marcá` **no
 * está en la lista**, así que *«Marcá el caso como resuelto»* pasa invisible y
 * `R66` informa «no creció». **B verificó y encontró un segundo hueco del mismo
 * día: `firmá` tampoco está** — y *firmar* es vocabulario de postventa y de
 * adopción (el acta, la firma). *Dos huecos en la misma tarde no son dos
 * olvidos: son la forma del instrumento.*
 *
 * ── EL MECANISMO NO SE TOCA, Y C TIENE RAZÓN ───────────────────────────────
 * En español la clase `-á` es **ambigua** —`acá`, `allá`, `quizá`, `ojalá`,
 * `está`, `Panamá`— así que un detector por terminación encontraría el idioma
 * entero. *Por eso alguien eligió una lista, y esa elección sigue siendo la
 * correcta.* **Lo que faltaba no era otro mecanismo: era que la salida dijera
 * QUÉ NO VE.**
 *
 * ── LA CIFRA ÚTIL ES LA DEL ALCANCE, NO LA DEL RESULTADO (`L-500`) ─────────
 * *Un gate publica cifras, no adjetivos: «verde» no puede delatar ceguera, un
 * contador sí.* El número que importa acá **no es cuántos hits encontró** —ése
 * baja cuando la voz mejora **y también cuando el instrumento se ciega**— sino
 * **cuántas formas puede ver**. Si alguien enriquece la lista, este número
 * sube y el verde de ayer deja de ser comparable con el de hoy, que es
 * exactamente lo que uno quiere saber.
 *
 * ── ⚠️ EL INCENTIVO PERVERSO — hoy es `L-502`, con su censo ───────────────
 * `R66` es un **trinquete solo-baja**. ⇒ **agregar una forma a esta lista
 * puede poner el gate en ROJO** sobre voseo que ya estaba y que nadie
 * introdujo hoy. *Un instrumento que castiga a quien lo mejora se queda como
 * está para siempre* — y ésa es, medida, la razón por la que la lista lleva
 * meses sin crecer. **Quien sume formas sube los baselines afectados en el
 * mismo commit, y eso no es hacer trampa: es que el trinquete mide voz nueva,
 * no cobertura nueva.**
 */
export const ALCANCE_VOZ = {
  /** Se MIDE del objeto. Jamás se escribe: ver la lápida del 138 arriba. */
  formas: _FORMAS.length,
  enclíticos: ENCL.length,
  conFrontera: CON_FRONTERA.length,
  /** Huecos MEDIDOS, con su razón. **No es la lista de todo lo que falta: es
   *  la prueba de que la lista es una lista.**
   *
   *  ⏪ Acá decían `marcá` y `firmá` — **entraron a la lista el 8-sep-2026** y
   *  el campo se actualizó en el mismo acto: *un ejemplo que ya se curó deja
   *  de enseñar y empieza a mentir.*
   *
   *  🔴 Los dos de ahora **no están afuera por olvido, y ésa es la lección**:
   *  `pasá` y `hablá` son voseo real, están medidos, y agregarlos pondría en
   *  ROJO **cinco migraciones que no se pueden curar en su lugar** (`R80` es
   *  lápida). ⇒ entran el día que alguien pague ese costo por la puerta de
   *  `L-502`: subir la lápida en el mismo commit, con su razón. */
  huecosMedidos: ['pasá', 'hablá'],
};

/**
 * ═══ CÓMO SE AMPLÍA ESTA LISTA SIN QUE EL TRINQUETE TE CASTIGUE — `L-502` ══
 *
 * **Medido, no supuesto:** sumar `marcá` + `firmá` hoy **no pone rojo a nadie**;
 * una tanda realista de **17 formas** halladas censando el corpus pone en rojo
 * **9 archivos** —entre ellos tres `«No operás este negocio.»` de
 * `packages/api`—, *voz vieja que nadie escribió hoy.*
 *
 * ⇒ **el costo del buen acto lo paga el que lo hace, así que nadie lo hace** —
 * y la omisión no se ve como una decisión: un instrumento congelado se lee
 * igual que uno completo.
 *
 * **La cura es una línea y por eso es exigible:** quien amplía **sube en el
 * mismo commit los baselines que la ampliación destape y declara el número
 * viejo al lado del nuevo**. *Un trinquete mide voz NUEVA, no cobertura nueva.*
 * ⚠️ Y la deuda destapada **es real y hay que verla**: la ley no dice «no
 * amplíes», dice que **el rojo no caiga sobre el que amplió**.
 */
export const VOZ_COMO_AMPLIAR =
  'si ampliás la lista, subí los baselines que destape EN EL MISMO COMMIT y' +
  ' declará el número viejo: el trinquete mide voz NUEVA, no cobertura nueva (`L-502`)';

/**
 * ═══ LOS TRES CIEGOS DE ESTE INSTRUMENTO — y por qué van los TRES ══════════
 *
 * **Firma del founder (S114-B):** *«es la tercera vez que este instrumento
 * tenía un alcance menor que su verde — vale que quede escrito con las tres
 * formas, no sólo la última.»*
 *
 * Cada uno se descubrió **después** de haber curado el anterior, y las tres
 * veces el que quedaba **se parecía tanto al curado que se daba por cubierto**.
 * Escribir sólo el último deja creer que la clase está cerrada.
 *
 * | eje | qué no veía | cuándo |
 * |---|---|---|
 * | **① LISTA** | el imperativo de un verbo que nadie agregó | S114, lo halló C |
 * | **② FORMA** | el texto NO entrecomillado (suelto en JSX) | S114, lo halló F |
 * | **③ POSICIÓN** | dentro del JSX, el nodo en su PROPIA línea (sólo veía el inline) | S114, lo halló A verificando |
 *
 * 🔴 **Los tres tienen la misma firma y por eso conviene verlos juntos: el
 * instrumento daba VERDE sobre un sujeto que no podía alcanzar.** *Un verde no
 * distingue «no hay» de «no llegué», y ninguno de los tres dio jamás un falso
 * rojo — que es lo que los hizo durar.*
 *
 * ⚠️ **Y lo que la tabla dice sin decirlo: tres ejes encontrados en un día no
 * son tres bugs, son un mapa incompleto.** Nada garantiza que no haya un
 * cuarto; lo único que se puede hacer es que el que aparezca **se vea**, y para
 * eso la salida publica los tres.
 */
export const VOZ_TRES_CIEGOS =
  '⚠️ alcance MENOR que su verde, 3 veces: ① la LISTA (un verbo que nadie agregó)' +
  ' · ② la FORMA (texto no entrecomillado) — curado ⑯' +
  ' · ③ la POSICIÓN (nodo JSX en su propia línea) — curado ⑰';

/** La línea que todo consumidor pega en su salida. **Una sola redacción para
 *  los dos** —el CLI de C y `R66`— porque *dos textos que dicen el alcance se
 *  desincronizan igual que dos contadores.* */
export const VOZ_LO_QUE_NO_VE =
  `lista de ${ALCANCE_VOZ.formas} forma(s)` +
  ` · ⚠️ NO VE el imperativo voseante de un verbo que nadie agregó` +
  ` (medidos: ${ALCANCE_VOZ.huecosMedidos.map((f) => `\`${f}\``).join(' · ')})` +
  ` · tampoco ve gramática, tono ni el inglés`;

const CORTAS = new Set(CON_FRONTERA.filter((f) => f.length <= 3));
const _dosFronteras = (linea, x) =>
  new RegExp(`(^|[^a-záéíóúñü])${x}([^a-záéíóúñü]|$)`, 'i').test(linea);
/** Letra que, si sigue al término, lo descarta por no ser voz.
 *  🔴 **La `s` está EXCLUIDA a propósito**: `elegí` + `s` = `elegís`, que SÍ es
 *  voseo. Sin esta excepción el censo callaba tres cadenas reales del prestador
 *  y su número BAJABA de 41 a 37 — un lint que baja se lee como progreso. */
const LETRA_QUE_DESCARTA = /[a-rt-záéíóúñü]/i;

/**
 * Hits de voseo en un texto fuente. **Ignora comentarios** (línea y bloque).
 * @returns {{n:number, t:string, v:string}[]} línea, término y la cadena.
 */
/**
 * ⑮ · LA FRONTERA IZQUIERDA — S114-B.
 *
 * Los enclíticos se buscaban con `includes` **sin frontera de ningún lado**:
 * el comentario decía *«palabra entera, sin frontera derecha (ya la traen)»* y
 * era cierto a medias — **traen la derecha y no la izquierda**. ⇒ `airedale`
 * contenía «dale» y `Airedale Terrier` daba voseo **cinco veces** en el
 * catálogo de razas.
 *
 * 🔴 **Es de la clase de `L-501`, mecanismo ③ — «frontera que no coincide con
 * el borde del token»**, en su signo de *captura de MÁS*. **El ordinal no se
 * escribe acá a propósito: vive en la tabla de `L-501`.** *Un ordinal inline se
 * numera contra el recuerdo del anterior, y a la tercera nadie sabe qué contó
 * la primera — pasó, y el árbol llegó a tener dos «cuartas».*
 * Acá con una vuelta extra — el
 * comentario **explicaba por qué no hacía falta la frontera** y la explicación
 * era verdadera de un solo lado. *Una razón escrita que cubre la mitad del caso
 * es más difícil de dudar que ninguna razón.*
 *
 * ⚠️ **Un imperativo voseante ARRANCA su palabra**: no existe el caso legítimo
 * en que una letra lo precede. **Medido antes de aplicarlo: sobre el corpus
 * entero de `apps` + `ui` + `api` el delta es CERO** —116 antes, 116 después,
 * y la lista de hits es idéntica—, así que no calla un solo voseo real.
 */
/**
 * ═══ LOS COMENTARIOS DE SQL — S114-B ═══════════════════════════════════════
 *
 * `hitsDeVoseo` limpia comentarios de **JavaScript** (`//` y `/* … *\/`). Sobre
 * una migración eso deja **la prosa de los `--` adentro del corpus**, y la
 * prosa de esta casa cita voz constantemente: `-- → "No pudimos registrar.
 * Probá de nuevo."` daba rojo por una frase que **nadie recibe** —está en un
 * comentario explicando un defecto ya curado—.
 *
 * *No es cambiar el mecanismo: es aplicar la limpieza que ya existía al
 * comentario del lenguaje correcto.* Medido: **69 → 66 hits, y dos archivos
 * enteros que sólo eran comentario.**
 *
 * ⚠️ **Blanquea sin mover renglones y respetando las cadenas** — un `--`
 * adentro de un literal no abre comentario, y `''` es el escape de comilla en
 * SQL. *Cortar por `indexOf('--')` habría partido cualquier texto con un guion
 * doble adentro.*
 */
function _sinComentariosSql(src) {
  const fuera = [];
  for (const linea of src.split('\n')) {
    let dentro = null;
    let corte = -1;
    for (let i = 0; i < linea.length; i++) {
      const c = linea[i];
      if (dentro) {
        if (c === dentro) {
          if (linea[i + 1] === dentro) i++;
          else dentro = null;
        }
        continue;
      }
      if (c === "'" || c === '"') { dentro = c; continue; }
      if (c === '-' && linea[i + 1] === '-') { corte = i; break; }
    }
    fuera.push(corte === -1 ? linea : linea.slice(0, corte));
  }
  return fuera.join('\n');
}

/**
 * ═══ ⑯ · EL TEXTO SUELTO EN JSX — S114-B (lo midió F) ══════════════════════
 *
 * 🔴 **El matcher sólo veía texto ENTRECOMILLADO**, y F lo probó con el
 * discriminador que lo vuelve incontestable: **el mismo texto da 1 en un
 * literal y 0 en JSX.** En un solo archivo encontró «Volvé» y **no vio
 * «Decidís» ni «Elegí»**.
 *
 * ── 🔴 Y LA RAZÓN POR LA QUE NUNCA SE NOTÓ ES LA QUE IMPORTA ──────────────
 * **En las apps móviles todo el texto va por i18n**, así que la voz de producto
 * vive en un diccionario: **es una cadena entrecomillada por construcción**. El
 * ciego no tenía dónde manifestarse. **`apps/admin` es React web SIN i18n** y su
 * texto visible vive suelto entre etiquetas ⇒ **una app entera fuera del
 * alcance, con el gate en verde.**
 *
 * *Un instrumento puede estar ciego durante meses sin dar un solo falso verde,
 * si el sujeto que no ve todavía no existe. El día que existe, el verde de
 * ayer y el de hoy se leen igual.*
 *
 * ── LO QUE COSTÓ, MEDIDO ANTES DE APLICARLO (`L-502`) ─────────────────────
 * Sobre el corpus vivo: **`apps/cliente` 0 · `apps/prestador` 0 · `packages/ui`
 * 9 y los NUEVE en `TokenGallery`**, que `R66` ya excluye con su razón.
 * **Delta rojo: CERO.** *La ampliación no enrojece nada que exista hoy —
 * porque el texto móvil ya estaba entrecomillado.*
 *
 * ── ⚠️ SOBRE UN CANDIDATO DE JSX NO CORREN LAS EXCLUSIONES DE CÓDIGO ──────
 * ⑩ (snake_case), ⑪ (rutas de import) y ⑫ (claves de i18n) existen para
 * descartar **cadenas que son código**. Un nodo de texto JSX **no es código por
 * construcción**, y aplicárselas descartaría una palabra suelta legítima:
 * `<span>contanos</span>` es todo minúsculas y ⑩ lo tomaría por identificador.
 */
const RE_TEXTO_JSX = />([^<>{}]*[a-záéíóúñü][^<>{}]*)</gi

/**
 * ⚠️ EL TECHO DEL NODO, DECLARADO (`L-501`). Un nodo de texto que abarque más
 * de esto **no se mira**: a esa altura ya no es una frase, es el regex
 * caminando entre dos etiquetas lejanas. *Se sube a la vista, jamás se busca un
 * delimitador mejor.*
 */
const TECHO_NODO_JSX = 6

/** Blanquea comentarios JS **sin mover renglones** — los números de línea son
 *  parte del resultado, así que no se pueden perder. */
function _blanquearComentariosJs(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
}

/**
 * 🔴 ⑰ · LOS NODOS DE TEXTO **MULTILÍNEA** — S114-B (lo halló A verificando).
 *
 * La primera versión de ⑯ extraía el JSX **línea por línea**, así que sólo veía
 * el texto INLINE —`<div>Hola</div>`, con sus dos etiquetas en el mismo
 * renglón—. **Un nodo de texto en su propia línea era invisible:**
 *
 * ```
 *   41  <p style={…}>
 *   42      Primero lo que te pidieron a vos.     ← nunca entró al matcher
 *   43  </p>
 * ```
 *
 * **Es EXACTAMENTE la clase que ⑯ acababa de cerrar, un piso más abajo:** antes
 * era *entrecomillado vs JSX*; ahora *JSX inline vs JSX en su propia línea*.
 * *Cerrar un ciego no cierra su familia — y el que queda se parece tanto al
 * curado que uno lo da por cubierto.*
 *
 * ⇒ el barrido pasa a ser **sobre el archivo entero**, con la línea calculada
 * del índice. El regex no puede cruzar `<`, `>`, `{` ni `}`, así que sigue sin
 * poder salirse de su nodo; lo que gana es poder cruzar un salto de renglón.
 *
 * @returns {Map<number, string[]>} línea → textos que empiezan ahí
 */
function _nodosJsx(src) {
  const limpio = _blanquearComentariosJs(src)
  const por = new Map()
  for (const m of limpio.matchAll(RE_TEXTO_JSX)) {
    const bruto = m[1]
    const t = bruto.trim()
    /* Nada de sintaxis adentro: si tiene `=`, `;`, paréntesis, backtick o `$`,
       no es un nodo de texto — es una comparación o una expresión partida. */
    if (t.length < 4 || /[=;`$\\()]/.test(t)) continue
    /* El techo, declarado arriba. */
    if ((bruto.match(/\n/g) ?? []).length + 1 > TECHO_NODO_JSX) continue
    const desde = m.index + 1
    const n = (limpio.slice(0, desde).match(/\n/g) ?? []).length + 1
    /* La línea que se reporta es la del PRIMER carácter del texto, no la del
       `>`: en un nodo multilínea el `>` está en el renglón de la etiqueta y lo
       que uno va a ir a leer es la frase. */
    const antesDelTexto = bruto.length - bruto.replace(/^\s+/, '').length
    const nTexto = n + (bruto.slice(0, antesDelTexto).match(/\n/g) ?? []).length
    por.set(nTexto, [...(por.get(nTexto) ?? []), t])
  }
  return por
}

/**
 * Las cadenas candidatas de UNA línea: las entrecomilladas de esa línea, más
 * los nodos de JSX que **empiezan** ahí (ya extraídos del archivo entero).
 * @returns {{v:string, deJsx:boolean}[]}
 */
function _candidatas(linea, jsxDeLaLinea) {
  const out = []
  for (const m of linea.matchAll(/'([^'\\]{4,})'|"([^"\\]{4,})"/g)) {
    out.push({ v: m[1] ?? m[2], deJsx: false })
  }
  for (const v of jsxDeLaLinea) out.push({ v, deJsx: true })
  return out
}

function _arrancaPalabra(b, x) {
  let desde = 0;
  for (;;) {
    const k = b.indexOf(x, desde);
    if (k === -1) return false;
    if (k === 0 || !LETRA_QUE_DESCARTA.test(b[k - 1])) return true;
    desde = k + 1;
  }
}

export function hitsDeVoseo(src, { lenguaje = 'js', jsx = false } = {}) {
  const lineas = (lenguaje === 'sql' ? _sinComentariosSql(src) : src).split('\n');
  /* ⑰ · los nodos de JSX se extraen del archivo ENTERO (multilínea) y se
     reparten por la línea donde empieza su texto. Ver `_nodosJsx`. */
  const nodos = jsx ? _nodosJsx(src) : new Map();
  let enBloque = false;
  const hits = [];

  lineas.forEach((linea, i) => {
    let l = linea;
    /* trampa ⑥ — el estado del bloque se arrastra entre líneas. */
    if (enBloque) {
      if (l.includes('*/')) { l = l.slice(l.indexOf('*/') + 2); enBloque = false; }
      else return;
    }
    l = l.replace(/\/\*[\s\S]*?\*\//g, '');
    if (l.includes('/*')) { l = l.slice(0, l.indexOf('/*')); enBloque = true; }
    /* ⚠️ En SQL `//` no es comentario y una URL adentro de una cadena se
       comería media línea. Ver `_sinComentariosSql`. */
    if (lenguaje !== 'sql') l = l.replace(/\/\/.*$/, '');

    for (const { v, deJsx } of _candidatas(l, nodos.get(i + 1) ?? [])) {
      /* ⑩ — UN IDENTIFICADOR NO ES UNA FRASE. `no_sos_del_equipo` es un código
         de error tipado, no voz: cambiarlo rompe el matching y no le habla a
         nadie. Se descarta por FORMA (snake_case puro), que es inequívoco —
         ninguna voz de producto se escribe así. */
      /* ⑭ · **Y UN `LIKE` TIPADO SIGUE SIENDO UN IDENTIFICADOR** (S114-B).
         `'no_sos_el_vendedor%'` daba voseo por «sos» **doce veces** en el
         motor: el `%` de un `LIKE` rompía la forma snake_case y ⑩ dejaba de
         reconocerlo. *Un carácter de sintaxis de SQL derrotaba la exclusión
         entera* — y son códigos de error tipados, exactamente lo que ⑩ existe
         para no contar.
         ⚠️ El `%` va **opcional y sólo al final**: `'mascota_sin_acceso: no
         podés atar esa compra'` tiene un espacio, así que NO cae acá y sigue
         contando — *un código con una frase pegada ES voz.* */
      if (!deJsx && /^[a-z0-9_]+%?$/.test(v)) continue;

      /* ⑪ — **UNA RUTA DE IMPORT NO ES VOZ, y esto lo cobró B.** Su
         `'./components/HojaContanos'` daba rojo por «contanos»: un
         especificador de módulo **no lo ve ningún usuario**, y renombrar un
         archivo para que un guard de voz calle es cambiar el código para
         contentar al instrumento.
         Se descarta por FORMA, como el ⑩: empieza con `./`, `../`, `@` o es un
         paquete desnudo con `/`. *No se descarta «la línea del import» sino la
         CADENA que parece ruta* — así una voz en voseo escrita en la misma
         línea sigue cayendo.

         🔴 **`@[\w-]+/` dejaba afuera el alias de la casa.** Exigía al menos
         una letra entre `@` y `/`, así que atrapaba `@epetplace/ui` y **no**
         `@/components/contanos` — que es como importa media app del cliente.
         Lo cobró mi propio perfil el día que sumé «contanos» a la lista: *la
         exclusión existía, la escribí yo, y no cubría el caso más frecuente
         del repo.* `*` en vez de `+`, y el control lo fija. */
      if (!deJsx && /^(\.{1,2}\/|@[\w-]*\/|[\w-]+\/)/.test(v) && !/\s/.test(v)) continue;

      /* ⑫ — **UNA CLAVE DE i18n NO ES VOZ**, y esto lo destapó ampliar la lista
         a 114 formas: `'checkoutGuarderia.esperaMensual'` daba rojo por
         «esperame» —«espera» + «Me»— porque los enclíticos se buscan sin
         frontera derecha. *La clave la lee `t()`, no una familia; el texto que
         una familia lee es el VALOR del diccionario, y ése se mide igual.*
         Misma forma que ⑩ y ⑪: se descarta la CADENA que parece identificador
         —sin espacios, con punto o camelCase—, jamás la línea. */
      if (!deJsx && !/\s/.test(v) && (/^[a-z][A-Za-z0-9]*(\.[a-zA-Z0-9_]+)+$/.test(v)
          || /^[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/.test(v))) continue;

      const b = v.toLowerCase();

      /* Enclíticos: palabra entera, sin frontera derecha (ya la traen). */
      let t = ENCL.find((x) => _arrancaPalabra(b, x));

      /* trampa ⑧ — imperativo/pronombre seguido de letra NO es voz. */
      if (!t) {
        t = CON_FRONTERA.find((x) => {
          /* ⑬ */ if (CORTAS.has(x)) return _dosFronteras(v, x);
          let desde = 0;
          for (;;) {
            const k = b.indexOf(x, desde);
            if (k === -1) return false;
            const sig = b[k + x.length];
            /* ⑮ — y la IZQUIERDA, que faltaba: `airedale` contenía «dale». */
            const izq = k === 0 || !LETRA_QUE_DESCARTA.test(b[k - 1]);
            if (izq && (sig === undefined || !LETRA_QUE_DESCARTA.test(sig))) return true;
            desde = k + 1;
          }
        });
      }

      /* trampa ⑦ — `vos` necesita vecino, no `\b` (inservible tras tilde). */
      if (!t && /(^|[^a-záéíóúñ])vos([^a-záéíóúñ]|$)/i.test(b)) t = 'vos';
      /* ⑪ — `sos`, misma física que `vos`. */
      if (!t && SOS.test(b)) t = 'sos';

      if (t) hits.push({ n: i + 1, t, v });
    }
  });

  return hits;
}

/** Igual, leyendo del disco. **El lenguaje sale de la extensión** — un
 *  consumidor que pase una migración no tiene que acordarse de decirlo. */
export const hitsDeArchivo = (ruta) =>
  hitsDeVoseo(readFileSync(ruta, 'utf8'), {
    lenguaje: /\.sql$/i.test(String(ruta)) ? 'sql' : 'js',
    /* ⑯ · el texto suelto de JSX sólo existe en `.tsx`. */
    jsx: /\.tsx$/i.test(String(ruta)),
  });

/* ═══════════════════════════════════════════════════════════════════════
 * ⑫ · EL HUECO DEL AVISO CLÍNICO — S106 (lo halló B, lo curó A)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * **`notás` y `llevala` no estaban en ninguna lista.** Las dos son voseo
 * real y las dos aparecen literalmente en el texto del aviso previo de
 * `LETRA_TELEMEDICINA` §3 — o sea que el hueco caía justo sobre la pantalla
 * que más importa que hable bien: la que se muestra antes de decidir si una
 * mascota necesita ir a una clínica ahora mismo.
 *
 * 🔴 **El cruce que lo volvía urgente:** el juez del aviso (R67, de B)
 * compara el texto renderizado contra el FIRMADO. Si alguien depositaba el
 * §3 en voseo para que R67 diera verde, **R66 lo dejaba pasar** — dos guards
 * de la casa contradiciéndose sin que ninguno se pusiera rojo.
 *
 * **Es `L-425` cobrando en otro instrumento:** *un baseline en 0 no dice «no
 * hay»: dice «no vi, con la lista de hoy».* Acá ni siquiera hacía falta que
 * el baseline fuera 0 — el término simplemente no existía en la lista, así
 * que ninguna cantidad de barridas lo habría encontrado.
 *
 * ─── Lo agregado, y por qué cada uno ───────────────────────────────────
 *   · `notá` (CON_TILDE) ⇒ caza `notás` gratis por la frontera de la `s`.
 *   · `llevá` (CON_TILDE) ⇒ `llevás`.
 *   · `llevalo/llevala/llevanos/llevame/llevate` (ENCL) — **`llevá` NO los
 *     caza**: la frontera derecha descarta con `l`.
 *   · `creés` (PRON) va **ENTERO**, y ahí está la trampa que casi se paga:
 *     agregar la raíz `creé` habría marcado **«creé una cuenta»**, que es
 *     tuteo perfectamente válido (pretérito de *crear*). Misma familia que
 *     `estás` y `podrás`, ya documentada arriba.
 *
 * ─── Verificado en las dos direcciones, no leído ───────────────────────
 *   Aislamiento: HIT en `notás` · `llevala` · `creés`; **cero hits** en
 *   `notas` · `llévala` · `creé`.
 *   Punta a punta: con las dos formas inyectadas en el diccionario del
 *   cliente el gate salió **ROJO, exit 1** (4 sobre baseline 2); restaurado,
 *   **VERDE, exit 0**, y el conteo real siguió en **50** — la cura no
 *   fabricó un solo falso positivo sobre las cadenas que ya existían.
 *
 * ⚠️ **Y un error propio que vale más que la cura, porque casi entra al
 * acta como medición:** el primer intento de reproducir el hueco inyectó
 * contra un ancla equivocada (`export const es = {`, cuando el archivo
 * declara `export const clienteEs = {`). **La inyección nunca ocurrió, el
 * gate salió verde, y ese verde estuvo a punto de reportarse como
 * "agujero confirmado".** *Un instrumento que responde sobre un archivo que
 * no tocaste no está midiendo tu hipótesis: está midiendo el reposo.* La
 * única razón por la que no entró al reporte es que el `grep` de control
 * salió vacío y no se dio por bueno.
 * ═══════════════════════════════════════════════════════════════════════ */
