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

export const CON_TILDE = ['probá','tocá','elegí','escribí','andá','mirá','poné','hacé','agregá','volvé','ingresá','revisá','buscá','cargá','seleccioná','confirmá','guardá','contactá','abrí','activá','compartí','enviá','esperá','intentá','verificá','completá','aceptá','corregí','contá','pedí','sacá','cerrá','dejá','sumá','usá','pagá','entrás','vení',
  /* ⑨ · los SEIS huecos que encontró el censo de segundo orden (B, S105) —
     ver la nota al pie. Van como IMPERATIVO porque la frontera de la `s` caza
     con ellos el presente voseante gratis: `cancelá` ⇒ `cancelás`. */
  'cancelá','atendé','decí','subí','trabajá','vendé',
  /* ⑫ · EL HUECO DEL AVISO CLÍNICO (S106, hallazgo de B, curado por A).
     `notá` ⇒ caza `notás` gratis por la frontera de la `s`; `llevá` ⇒
     `llevás`. **Los dos estaban ausentes y el §3 de LETRA_TELEMEDICINA los
     usaba literalmente** — ver la nota ⑫ al pie. */
  'notá','llevá'];
export const ENCL = ['contanos','escribila','escribilo','corregilo','corregila','ingresalo','ingresala','probalo','probala','tocalo','tocala','elegilo','elegila','agregalo','agregala','revisalo','revisala','guardalo','guardala','avisanos','contactanos','compartile','compartilo','compartila',
  /* ⑫ · `llevá` NO caza a `llevala`: la frontera derecha descarta con `l`.
     Los enclíticos se listan enteros, como los demás. */
  'llevalo','llevala','llevanos','llevame','llevate'];
export const PRON = ['tenés','podés','querés','sabés','debés','necesitás','hacés','ponés','compartís',
  /* ⑫ · `creés` va ENTERO y NO como `creé`: **`creé` es tuteo perfectamente
     válido** («creé una cuenta», pretérito de *crear*). Agregar la raíz
     habría fabricado falsos positivos — la misma trampa que `estás` y
     `podrás`, ya documentada arriba. */
  'creés'];
/** ⑪ · `sos` (voseo de «eres»). Va aparte porque, como `vos`, es CORTO y
 *  necesita frontera de vecino: «esos», «presos», «sospecha», «nosotros» lo
 *  contienen y no son voz. Control corrido: 0 falsos positivos en los siete
 *  casos probados. */
const SOS = /(^|[^a-záéíóúñ])sos([^a-záéíóúñ]|$)/i;

/** Los que exigen frontera derecha (trampa ⑧). Los enclíticos NO: son palabras enteras. */
const CON_FRONTERA = [...CON_TILDE, ...PRON];
/** Letra que, si sigue al término, lo descarta por no ser voz.
 *  🔴 **La `s` está EXCLUIDA a propósito**: `elegí` + `s` = `elegís`, que SÍ es
 *  voseo. Sin esta excepción el censo callaba tres cadenas reales del prestador
 *  y su número BAJABA de 41 a 37 — un lint que baja se lee como progreso. */
const LETRA_QUE_DESCARTA = /[a-rt-záéíóúñü]/i;

/**
 * Hits de voseo en un texto fuente. **Ignora comentarios** (línea y bloque).
 * @returns {{n:number, t:string, v:string}[]} línea, término y la cadena.
 */
export function hitsDeVoseo(src) {
  const lineas = src.split('\n');
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
    l = l.replace(/\/\/.*$/, '');

    for (const m of l.matchAll(/'([^'\\]{4,})'|"([^"\\]{4,})"/g)) {
      const v = m[1] ?? m[2];
      /* ⑩ — UN IDENTIFICADOR NO ES UNA FRASE. `no_sos_del_equipo` es un código
         de error tipado, no voz: cambiarlo rompe el matching y no le habla a
         nadie. Se descarta por FORMA (snake_case puro), que es inequívoco —
         ninguna voz de producto se escribe así. */
      if (/^[a-z0-9_]+$/.test(v)) continue;
      const b = v.toLowerCase();

      /* Enclíticos: palabra entera, sin frontera derecha (ya la traen). */
      let t = ENCL.find((x) => b.includes(x));

      /* trampa ⑧ — imperativo/pronombre seguido de letra NO es voz. */
      if (!t) {
        t = CON_FRONTERA.find((x) => {
          let desde = 0;
          for (;;) {
            const k = b.indexOf(x, desde);
            if (k === -1) return false;
            const sig = b[k + x.length];
            if (sig === undefined || !LETRA_QUE_DESCARTA.test(sig)) return true;
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

/** Igual, leyendo del disco. */
export const hitsDeArchivo = (ruta) => hitsDeVoseo(readFileSync(ruta, 'utf8'));

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
