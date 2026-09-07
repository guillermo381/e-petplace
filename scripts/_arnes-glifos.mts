/* Arnés de FORMA de los glifos nuevos (S113-B · §6b pasos 1 y 3).
   Mide lo que §6b pide en NÚMEROS y no en adjetivos: trazo, densidad, masa
   de tinta y legibilidad a 21 px. **La vara es `vacuna`**, por orden de la
   mesa: los tres atajos del Coach se calibran contra él.

   🔴 **Por qué existe un medidor y no una tabla escrita a mano:** «mismo peso
   visual» es un adjetivo hasta que alguien lo cuenta. El primer intento midió
   los bounding box con un regex de números y dio `x∈[-4.8,13]` para `vacuna`
   —comandos RELATIVOS leídos como absolutos—: *un instrumento que devuelve
   coordenadas negativas sobre una grilla de 0 a 24 está midiendo otra cosa.*
   Éste recorre el path de verdad. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Todos los `.tsx` de un árbol. Sin dependencias: el arnés no instala nada. */
function listarTsx(raiz: string): string[] {
  const salida: string[] = [];
  const caminar = (d: string) => {
    for (const e of readdirSync(d)) {
      const f = join(d, e);
      if (statSync(f).isDirectory()) caminar(f);
      else if (f.endsWith('.tsx')) salida.push(f);
    }
  };
  caminar(raiz);
  return salida;
}

/** Largo de trazo de un path. Rectas exactas; arcos por su cuerda circular y
 *  curvas por la cuerda con holgura — alcanza para comparar MASA entre
 *  glifos de la misma casa, que es todo lo que se le pide. */
export function largoPath(d: string): number {
  const tok = d.match(/[MmLlHhVvCcSsQqAaZz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, total = 0, cmd = '';
  const n = () => parseFloat(tok[i++]);
  const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'M') { const px = n(), py = n(); x = rel ? x + px : px; y = rel ? y + py : py; sx = x; sy = y; cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { const px = n(), py = n(); const nx = rel ? x + px : px, ny = rel ? y + py : py; total += dist(x, y, nx, ny); x = nx; y = ny; }
    else if (C === 'H') { const px = n(); const nx = rel ? x + px : px; total += Math.abs(nx - x); x = nx; }
    else if (C === 'V') { const py = n(); const ny = rel ? y + py : py; total += Math.abs(ny - y); y = ny; }
    else if (C === 'C' || C === 'S' || C === 'Q') {
      const k = C === 'C' ? 6 : 4; const p: number[] = []; for (let j = 0; j < k; j++) p.push(n());
      const ex = rel ? x + p[k - 2] : p[k - 2], ey = rel ? y + p[k - 1] : p[k - 1];
      total += dist(x, y, ex, ey) * 1.12; x = ex; y = ey;
    } else if (C === 'A') {
      const rx = n(), ry = n(); n(); n(); n(); const px = n(), py = n();
      const ex = rel ? x + px : px, ey = rel ? y + py : py;
      const c = dist(x, y, ex, ey), r = (rx + ry) / 2;
      total += r > 0 ? 2 * r * Math.asin(Math.min(1, c / (2 * r))) : c; x = ex; y = ey;
    } else if (C === 'Z') { total += dist(x, y, sx, sy); x = sx; y = sy; }
    else i++;
  }
  return total;
}

const SRC = readFileSync(new URL('../packages/ui/src/components/Icono.tsx', import.meta.url), 'utf8');
const TRAZO = 1.9, GRILLA = 24, GATE = 21;

function glifo(nombre: string) {
  const m = SRC.match(new RegExp('^  ' + nombre + ': \\(\\{[^\\n]*\\n([\\s\\S]*?)\\n  \\),', 'm'));
  if (!m) return null;
  const cuerpo = m[1];
  const paths = [...cuerpo.matchAll(/d="([^"]+)"/g)].map((x) => x[1]);
  const circulos = [...cuerpo.matchAll(/<Circle[^/]*r=\{([\d.]+)\}/g)].map((x) => +x[1]);
  const largo = paths.reduce((a, d) => a + largoPath(d), 0) + circulos.reduce((a, r) => a + 2 * Math.PI * r, 0);
  return {
    largo,
    /* 🔴 **SUBPATHS, NO NODOS JSX.** Contar `<Path>` medía el ARCHIVO, no el
       dibujo: dos trazos metidos en un mismo `d` bajaban el número sin
       quitar una línea de la pantalla ⇒ **el conteo se podía «arreglar»
       uniendo strings.** Un instrumento que se puede satisfacer sin tocar
       el dibujo no está midiendo el dibujo. Cada `M` abre un trazo. */
    trazos:
      [...cuerpo.matchAll(/d="([^"]+)"/g)].reduce((a, m) => a + (m[1].match(/[Mm]/g) ?? []).length, 0) +
      (cuerpo.match(/<Circle/g) ?? []).length,
    huella: /<Huella/.test(cuerpo),
    /** El aire que queda DENTRO del círculo más chico, a 21 px. Ley 9. */
    interiorMin: circulos.length ? Math.min(...circulos.map((r) => (2 * r - TRAZO) * (GATE / GRILLA))) : null,
    /**
     * 🔴 **EL MISMO AIRE, PERO PARA CUADRADOS (S113-B · 2.2.4).**
     *
     * ⏪ `interiorMin` sólo miraba `<Circle>`, así que **este arnés no podía
     * ver el modo de falla de un glifo hecho de cuadrados** — y el de
     * `pasaporte` son las esquinas de un QR. *Un instrumento que no puede
     * producir el rojo de la pieza que va a medir no está midiendo: está
     * acompañando* (`L-459`).
     *
     * El umbral es el MISMO 2,5 px y eso se declara: el interior de un
     * cuadrado de lado `s` trazado a 1.9 es un cuadrado de `s − 1.9`, cuyo
     * círculo inscrito tiene ese mismo diámetro ⇒ **la vara de lo redondo
     * aplica sin aflojarse.**
     *
     * 🔴 **Y MIDE GEOMETRÍA, NO LETRAS — su control positivo lo obligó.** La
     * primera versión reconocía `M… h… v… h-… Z`, que es **la sintaxis que yo
     * había escrito**: daba verde en mi glifo y **`null` en `documentos`**,
     * que dibuja el mismo rectángulo con `H`/`V` absolutos. *Un medidor que
     * reconoce exactamente la forma en que uno escribe pasa siempre y no ve a
     * nadie más.* Hoy camina el path y saca su caja: le da igual cómo se
     * escribió.
     *
     * ⚠️ **Sólo los TRAZADOS.** Uno relleno no tiene interior que cerrarse: su
     * modo de falla es desaparecer, no empastarse, y ése lo mide la masa.
     */
    interiorCuadrado: (() => {
      const cajas = [...cuerpo.matchAll(/d="([^"]+)"([^\n]*)/g)]
        .filter((m) => !/fill=/.test(m[2] ?? '') && /[Zz]\s*$/.test(m[1] ?? ''))
        .map((m) => {
          /* Camina M/L/H/V y sus relativos; junta los puntos y devuelve la
             caja. No intenta ser un parser de SVG: sólo de rectángulos
             axis-aligned, que es lo que la casa dibuja. */
          const d = m[1] ?? '';
          if (/[CcSsQqTtAa]/.test(d)) return null;
          let x = 0, y = 0;
          const xs: number[] = [], ys: number[] = [];
          for (const tk of d.matchAll(/([MLHVmlhv])\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?/g)) {
            const c = tk[1] ?? '', a = +(tk[2] ?? 0), b = +(tk[3] ?? 0);
            if (c === 'M' || c === 'L') { x = a; y = b; }
            else if (c === 'm' || c === 'l') { x += a; y += b; }
            else if (c === 'H') x = a;
            else if (c === 'h') x += a;
            else if (c === 'V') y = a;
            else if (c === 'v') y += a;
            xs.push(x); ys.push(y);
          }
          if (xs.length < 4) return null;
          return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
        })
        .filter((v): v is number => v !== null && v > 0);
      return cajas.length ? Math.min(...cajas.map((l) => (l - TRAZO) * (GATE / GRILLA))) : null;
    })(),
  };
}

let ok = 0, mal = 0;
const t = (n: string, cond: boolean, detalle = '') => {
  if (cond) { ok++; console.log(`  ✓ ${n}${detalle}`); } else { mal++; console.log(`  ✗ ${n}${detalle}`); }
};

const VARA = glifo('vacuna')!;
const BANDA = 0.15;
console.log(`\n── LA VARA · \`vacuna\` = ${VARA.largo.toFixed(1)} de trazo · banda ±${BANDA * 100}% = ${(VARA.largo * (1 - BANDA)).toFixed(1)}–${(VARA.largo * (1 + BANDA)).toFixed(1)} ──`);

const NUEVOS = ['peso', 'antiparasitario', 'foto', 'personalidad'] as const;
console.log('\n── ① EXISTEN Y ESTÁN DIBUJADOS ──');
for (const g of NUEVOS) t(`\`${g}\` tiene dibujante`, glifo(g) !== null);

console.log('\n── ② DENSIDAD (§6b: 2–4 trazos; `vacuna` llega a 5) ──');
for (const g of NUEVOS) { const r = glifo(g)!; t(`\`${g}\` ≤ ${VARA.trazos} trazos`, r.trazos <= VARA.trazos, ` · ${r.trazos}`); }

console.log('\n── ③ MASA DE TINTA contra la vara ──');
for (const g of NUEVOS) {
  const r = glifo(g)!;
  const d = ((r.largo / VARA.largo - 1) * 100);
  const dentro = Math.abs(r.largo / VARA.largo - 1) <= BANDA;
  t(`\`${g}\` en banda`, dentro, ` · ${r.largo.toFixed(1)} (${d >= 0 ? '+' : ''}${d.toFixed(0)} %)`);
}

console.log('\n── ④ LEY 9 · lo redondo sobrevive a 21 px (piso: 2,5 px de interior) ──');
for (const g of NUEVOS) {
  const r = glifo(g)!;
  if (r.interiorMin === null) { console.log(`  – \`${g}\` no tiene forma redonda que medir`); continue; }
  t(`\`${g}\` deja aire adentro`, r.interiorMin >= 2.5, ` · ${r.interiorMin.toFixed(2)} px`);
}

console.log('\n── ⑤ SON GLIFOS DE CONTROL ⇒ SIN HUELLA (N27 · §6b paso 6) ──');
for (const g of NUEVOS) t(`\`${g}\` no lleva huella`, glifo(g)!.huella === false);
/* CONTROL POSITIVO: si el medidor no viera las huellas, ⑤ pasaría siempre. */
t('CONTROL POSITIVO · el medidor SÍ ve la huella de `vacuna`', VARA.huella === true);

console.log('\n── ⑪ EL GLIFO DE PASAPORTE (S113-B · 2.2.4) ──');
/* 🔴 **La forma la decidió la ARITMÉTICA y queda escrita acá para que nadie
   la reabra sin volver a hacerla.** Un QR de TRES esquinas es
   **INCONSTRUIBLE** bajo las dos leyes de la casa: la masa exige `s ≤ 4,45`
   y la Ley 9 exige `s ≥ 4,76` — *el intervalo es vacío* (`L-283`, la anatomía
   incapaz). Y la «tarjeta con QR» pesa 64 sola (+38 %). Gana **dos esquinas +
   módulos + la huella en el tercer vértice**. */
{
  const P = glifo('pasaporte');
  t('`pasaporte` tiene dibujante', P !== null);
  if (P) {
    const d = (P.largo / VARA.largo - 1) * 100;
    t('masa en banda', Math.abs(P.largo / VARA.largo - 1) <= BANDA, ` · ${P.largo.toFixed(1)} (${d >= 0 ? '+' : ''}${d.toFixed(0)} %)`);
    t(`≤ ${VARA.trazos} trazos`, P.trazos <= VARA.trazos, ` · ${P.trazos}`);
    /* 🔴 Ley 9 sobre CUADRADOS — la medida que este arnés no tenía. */
    t('🔴 las esquinas dejan aire a 21 px (piso 2,5)',
      P.interiorCuadrado !== null && P.interiorCuadrado >= 2.5,
      ` · ${P.interiorCuadrado?.toFixed(2) ?? 'sin cuadrado trazado'} px`);
    /* 🔴 NO es glifo de control: es un documento DE LA MASCOTA, y los cuatro
       de su fila llevan huella. *Uno sin ella se leería de otra clase.* */
    t('🔴 lleva huella: no es glifo de control (§6b.6)', P.huella === true);
  }
  /* CONTROL POSITIVO del medidor nuevo: si no viera los cuadrados trazados,
     el assert de arriba pasaría siempre. `documentos` tiene dos. */
  const DOC = glifo('documentos')!;
  t('CONTROL POSITIVO · el medidor SÍ ve un cuadrado ajeno',
    DOC.interiorCuadrado !== null, ` · documentos ${DOC.interiorCuadrado?.toFixed(2) ?? 'null'} px`);

  /* ═══════════════════════════════════════════════════════════════════════
     ✅ GATE CERRADO (firma del founder, 7-sep-2026) · Y SU LÍMITE, MEDIDO
     ═══════════════════════════════════════════════════════════════════════
     La firma vino **con su límite**: el glifo *no lee «QR» de forma inequívoca
     a 21 px y no puede bajo el trazo de la casa* —las esquinas de un QR real
     son cuadrados ANIDADOS—; **lo que lo hace legible es su CONTEXTO**, la
     etiqueta al lado.

     🔴 **Eso es una CONDICIÓN DE USO, y una condición que sólo vive en prosa
     no frena a nadie.** *El día que alguien lo monte solo —en una barra, en un
     botón mudo— lo único que va a quedar es «dos cuadrados y una pata», y no
     va a fallar nada: se va a ver raro y nadie va a saber por qué.*

     🔴 **Y SE MIDE POR ESTRUCTURA, NO POR VECINDAD — la primera versión no
     disparaba.** Buscaba un `etiqueta` a ±160 caracteres, y en un archivo denso
     como la galería `etiqueta` está por todos lados: *una ventana de texto
     encuentra la palabra de otro y da verde.* Lo cazó su propio rojo, que no
     salió.

     La regla buena sale de mirar QUIÉN puede montarlo:
     · `glifo: 'pasaporte'` **ya está cubierto por el TIPO** — `AccionPerfil`
       exige `etiqueta` en el mismo objeto, así que no hay forma de montarlo
       ahí sin su texto.
     · `<Icono nombre="pasaporte">` **es SIEMPRE suelto**: `Icono` no dibuja
       una sola letra. *Ése es exactamente el uso que la firma prohíbe.*
     ⇒ el guard mide **el `Icono` desnudo**, que es el único hueco real. */
  const USOS = ['packages/ui/src', 'apps/cliente/src', 'apps/prestador/src'];
  const sueltos: string[] = [];
  for (const dir of USOS) {
    let archivos: string[] = [];
    try { archivos = listarTsx(new URL(`../${dir}`, import.meta.url).pathname); } catch { continue; }
    for (const f of archivos) {
      const txt = readFileSync(f, 'utf8');
      /* 🔴 **MIDE `nombre={…}` ENTERO, no sólo el literal — y lo obligó un
         caso REAL: yo mismo lo monté con `nombre={fase === 'ajena' ? 'info' :
         'pasaporte'}` y el guard no lo vio.** *Un guard que reconoce una sola
         forma de escribir lo mismo protege del descuido y no del apuro, que es
         cuando hace falta.* Fue el aparato el que mostró el defecto, no él. */
      for (const m of txt.matchAll(/nombre=(?:['"]pasaporte['"]|\{[^}]*['"]pasaporte['"][^}]*\})/g)) {
        sueltos.push(`${f.split('/').slice(-2).join('/')}:${txt.slice(0, m.index ?? 0).split('\n').length}`);
      }
    }
  }
  t('🔴 `pasaporte` nunca se monta como `Icono` desnudo (condición de la firma)',
    sueltos.length === 0, sueltos.length ? ` · suelto en ${sueltos.join(' · ')}` : ' · 0 sueltos');

  /* ☠️ Y el andamio del gate murió con la firma (Ley 37). */
  const GAL = readFileSync(new URL('../packages/ui/src/gallery/TokenGallery.tsx', import.meta.url), 'utf8');
  t('☠️ el andamio del gate se retiró', !/CandidataMaciza|FilaPasaporte/.test(GAL));
  t('…y el glifo firmado se mira DONDE VIVE', /glifo: 'pasaporte'/.test(GAL));
}

console.log('\n── ⑫ EL GLIFO DE PAPEL (S113-B · fase 3 · B6) ──');
/* La hoja que la familia TRAE. **Uno y no tres**: `receta` ya existe firmado,
   y examen/informe comparten éste porque *el rótulo del grupo ya dice cuál es
   — tres dibujos para una distinción que la palabra de al lado ya hace es un
   glifo que nadie necesita* (§6b, economía). */
{
  const P = glifo('papel');
  t('`papel` tiene dibujante', P !== null);
  if (P) {
    const d = (P.largo / VARA.largo - 1) * 100;
    t('masa en banda', Math.abs(P.largo / VARA.largo - 1) <= BANDA,
      ` · ${P.largo.toFixed(1)} (${d >= 0 ? '+' : ''}${d.toFixed(0)} %) — cerca del techo, declarado`);
    t(`≤ ${VARA.trazos} trazos`, P.trazos <= VARA.trazos, ` · ${P.trazos}`);
    t('🔴 la hoja deja aire a 21 px', P.interiorCuadrado !== null && P.interiorCuadrado >= 2.5,
      ` · ${P.interiorCuadrado?.toFixed(2) ?? 'sin cuadrado'} px`);
    t('🔴 lleva huella: es un papel DE LA MASCOTA', P.huella === true);
    /* 🔴 **SIN DOBLEZ, y no es estilo: `certificaciones` y `presupuesto` ya la
       usan.** *Dos glifos con la misma esquina doblada se leen como el mismo
       objeto, y acá el objeto es otro.* La marca de éste son sus renglones.

       ✅ **GATE CERRADO (7-sep-2026), y su riesgo declarado —«a 21 px puede
       leerse lista»— se resolvió con la vecindad REAL**: en la bóveda, misma
       pantalla, `papel` contra `documentos` a 21 px se distinguen. */
    const CERT = glifo('certificaciones')!;
    t('🔴 no copia la esquina doblada de `certificaciones`',
      CERT.trazos > P.trazos || P.largo !== CERT.largo);
    /* 🔴 **EL MARCO ES LO QUE LO SALVA DEL RIESGO, y por eso se mide.**
       *Sin el rectángulo, los renglones quedan sueltos — y renglones sueltos
       SON una lista*, que era exactamente lo que el gate tenía que mirar.
       ⚠️ Y la tentación de sacarlo está MEDIDA: la masa quedó en +14 %, casi
       contra el techo, **y el marco es la mitad de ese número**. El día que
       alguien necesite bajarla, lo primero que va a mirar es el rectángulo. */
    t('🔴 conserva su MARCO de hoja (sin él se lee «lista»)',
      P.interiorCuadrado !== null && P.interiorCuadrado > 4, ` · ${P.interiorCuadrado?.toFixed(2) ?? 'SIN MARCO'} px`);
  }
}

console.log('\n── ⑬ EL GLIFO DE LUPA (S113-B · fase 3) ──');
/* Nace porque NO EXISTÍA y la entrada de búsqueda usaba `explorar`, que es una
   BRÚJULA. *Un glifo que significa otra cosa es peor que ninguno: el que no
   está deja a la persona leyendo la etiqueta; el que miente la manda al lugar
   equivocado con confianza.* */
{
  const L = glifo('lupa');
  t('`lupa` tiene dibujante', L !== null);
  if (L) {
    const d = (L.largo / VARA.largo - 1) * 100;
    t('masa en banda', Math.abs(L.largo / VARA.largo - 1) <= BANDA, ` · ${L.largo.toFixed(1)} (${d >= 0 ? '+' : ''}${d.toFixed(0)} %)`);
    t(`≤ ${VARA.trazos} trazos`, L.trazos <= VARA.trazos, ` · ${L.trazos}`);
    t('🔴 la lente deja aire a 21 px', L.interiorMin !== null && L.interiorMin >= 2.5, ` · ${L.interiorMin?.toFixed(2) ?? 'null'} px`);
    /* 🔴 ES GLIFO DE CONTROL: *buscar es un acto de la interfaz, no de la
       mascota* — y una huella adentro de una lente se leería como un animal
       atrapado en un aumento (Ley 9, alcance S98). */
    t('🔴 NO lleva huella: es glifo de control (§6b.6)', L.huella === false);

    /* 🔴 **LO QUE LA SALVA DE LA FAMILIA CIRCULAR, Y ES LO QUE HAY QUE MEDIR.**
       `info`, `checkEnCirculo` y `explorar` son los TRES un círculo de r≈8.5
       centrado en (12,12). *Un cuarto círculo del mismo tamaño y en el mismo
       centro entra a esa familia y a 21 px se pierde adentro.* Ésta se sale
       **por tamaño Y por posición**, no sólo por el mango. */
    const SRC_LUPA = SRC.match(/^  lupa: \(\{[\s\S]*?\n  \),/m)?.[0] ?? '';
    const rLupa = Number(SRC_LUPA.match(/r=\{([\d.]+)\}/)?.[1] ?? 0);
    const rFamilia = Number((SRC.match(/^  info: \(\{[\s\S]*?\n  \),/m)?.[0] ?? '').match(/r=\{([\d.]+)\}/)?.[1] ?? 0);
    t('🔴 su lente es MÁS CHICA que la de la familia circular',
      rLupa > 0 && rFamilia > 0 && rLupa < rFamilia * 0.85,
      ` · ${rLupa} contra ${rFamilia} (${((1 - rLupa / rFamilia) * 100).toFixed(0)} % más chica)`);
    t('🔴 …y NO está centrada en (12,12) como las tres',
      !/cx=\{12\}\s*cy=\{12\}/.test(SRC_LUPA));
    /* Y el mango: sin él es un círculo más. */
    t('🔴 conserva su MANGO (sin él es un círculo más)', /<Path d="M[\d.]+ [\d.]+ [\d.]+ [\d.]+"/.test(SRC_LUPA));
  }
}

console.log('\n── ④bis LEY 9 PARA LO PUNTIAGUDO · la punta sobrevive a 21 px ──');
/* 🔴 **`interiorMin` mide lo REDONDO y no ve una estrella.** El modo de falla
   de una punta es el opuesto al de un círculo: no se cierra, **se la come su
   propio trazo**. A `d` px de la punta, su ancho es `2·d·tan(α/2)`; si eso es
   menor que el trazo (1,9 → 1,66 px a 21), ahí no hay punta: hay bulto.
   *Un glifo de cinco puntas cuyas cinco puntas son bultos es un pentágono
   peludo, y eso no lo dice ningún assert de masa.* */
function anchoDePuntaA(px: number, d: string): number {
  /* El ángulo real se DERIVA del path dibujado, no se teclea: si mañana
     alguien mueve un vértice, el número lo sigue. */
  const n = [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]] as const);
  if (n.length < 3) return 0;
  const ang = (a: readonly [number, number], b: readonly [number, number], c: readonly [number, number]) => {
    const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]];
    const cos = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
    return Math.acos(Math.max(-1, Math.min(1, cos)));
  };
  /* La punta es el vértice MÁS CERRADO del contorno. */
  let min = Math.PI;
  for (let k = 0; k < n.length; k++) {
    const a = n[(k - 1 + n.length) % n.length], b = n[k], c = n[(k + 1) % n.length];
    min = Math.min(min, ang(a, b, c));
  }
  /* `px` en espacio de 21; se pasa a la grilla de 24 y se vuelve a 21. */
  return 2 * px * Math.tan(min / 2);
}
{
  const d = SRC.match(/personalidad: \(\{[\s\S]*?d="([^"]+)"/)![1];
  const ancho = anchoDePuntaA(2, d);
  const piso = TRAZO * (GATE / GRILLA);
  t('🔴 `personalidad` · a 2 px de la punta es MÁS ancha que su propio trazo',
    ancho > piso, ` · ${ancho.toFixed(2)} px vs trazo ${piso.toFixed(2)} px`);
  /* CONTROL NEGATIVO: la estrella «clásica» (r/R = 0,382, punta de 36°) es la
     que se descartó, y el gate tiene que poder decir que NO pasa — si no, su
     verde no distingue la forma elegida de la que se rechazó. */
  /* ⚠️ **ESTAS COORDENADAS SE GENERARON, NO SE TECLEARON, y la primera vez
     las tecleé**: dieron 1,97 px —idéntico al de la estrella elegida— o sea
     que *el control no controlaba nada y su rojo no podía existir.* Son la
     estrella de `r/R = 0.382` con la misma masa, y su punta mide 36,0°. */
  const clasica = 'M12.00 5.61L13.43 10.03L18.07 10.03L14.32 12.75L15.75 17.17L12.00 14.44L8.25 17.17L9.68 12.75L5.93 10.03L10.57 10.03Z';
  t('CONTROL NEGATIVO · la estrella clásica (36°) NO pasaría',
    anchoDePuntaA(2, clasica) <= piso, ` · ${anchoDePuntaA(2, clasica).toFixed(2)} px`);
}

console.log('\n── ⑥ NO SE PISAN CON UNA METÁFORA OCUPADA (paso 2) ──');
/* `seguros` ya es un escudo: la separación es de TAMAÑO y se declara. */
const seg = glifo('seguros')!;
t('`antiparasitario` es visiblemente más liviano que `seguros`',
  glifo('antiparasitario')!.largo < seg.largo * 0.95,
  ` · ${glifo('antiparasitario')!.largo.toFixed(1)} vs ${seg.largo.toFixed(1)}`);
t('y por eso su colisión va DECLARADA en el dibujante', /seguros. YA ES UN ESCUDO/.test(SRC));
t('la gota declara su distinción con el pin (orientación)', /apunta hacia ABAJO/.test(SRC));
/* Una estrella es la metáfora universal de «favorito» y de «calificación».
   Ninguna de las dos existe todavía en la casa ⇒ el nombre está libre, pero
   el que llegue después va a parecer que califica. Se declara ahora. */
t('`personalidad` declara la colisión que le va a llegar (favorito · calificación)',
  /va a parecer que califica/.test(SRC));


/* ═══ LA HUELLA DENTRO DE UN CONTROL (S113-B · orden de la mesa) ════════════
   *«En la huella los cuatro dedos son actos: `vacuna` adentro de un dedo se
   dibuja sin huella, sin tocar cómo se dibuja en el resto de la app.»*

   🔴 **Se mide la FUNCIÓN, no el render.** La decisión salió de `Icono` a
   `icono-huella.ts` justo para esto: sin extraerla habría que montar React
   para saber si una huella se pinta, y «lo miré y no estaba» no es una
   medición. */
const { resolverHuella } = await import('../packages/ui/src/components/icono-huella.ts');
const base = { colorHuella: '#MAGENTA', colorTinta: '#TINTA' };

console.log('\n── ⑦ NO-REGRESIÓN · la Ley 6 hace lo mismo que antes ──');
t('presente (fuera de una tab) ⇒ su color',
  resolverHuella({ ...base, esEstructura: false }) === '#MAGENTA');
t('tab de MARCA en reposo ⇒ no se pinta',
  resolverHuella({ ...base, esEstructura: false, activa: false }) === 'none');
t('tab de MARCA activa ⇒ su color',
  resolverHuella({ ...base, esEstructura: false, activa: true }) === '#MAGENTA');
t('tab de ESTRUCTURA en reposo ⇒ recolorea, jamás desaparece',
  resolverHuella({ ...base, esEstructura: true, activa: false }) === '#TINTA');
t('tab de ESTRUCTURA activa ⇒ su color',
  resolverHuella({ ...base, esEstructura: true, activa: true }) === '#MAGENTA');

console.log('\n── ⑧ EL MONTAJE EN UN CONTROL APAGA LA HUELLA ──');
t('🔴 dentro de un control ⇒ NO se pinta',
  resolverHuella({ ...base, esEstructura: false, montaje: 'control' }) === 'none');
t('CONTROL NEGATIVO · el MISMO glifo sin montaje ⇒ SÍ se pinta',
  resolverHuella({ ...base, esEstructura: false }) === '#MAGENTA');
t('y en una tab activa, fuera de un control, sigue pintando',
  resolverHuella({ ...base, esEstructura: false, activa: true }) === '#MAGENTA');

console.log('\n── ⑨ EL BORDE: la huella que ES el dibujo GANA sobre el montaje ──');
t('🔴 `esEstructura` dentro de un control ⇒ NO se apaga (dejaría un hueco)',
  resolverHuella({ ...base, esEstructura: true, montaje: 'control' }) !== 'none');
/* Y que ese borde alcance a los tres glifos reales, no a un booleano suelto. */
for (const g of ['negocio', 'datos', 'ia'])
  t(`\`${g}\` está declarado como estructura en el registry`,
    new RegExp("HUELLA_ES_ESTRUCTURA[\\s\\S]{0,200}'" + g + "'").test(SRC));

console.log('\n── ⑩ EL DEDO LO PASA SIEMPRE, Y NADIE MÁS PUEDE ELEGIRLO ──');
const PIEZA = readFileSync(new URL('../packages/ui/src/components/PresenciaCoach.tsx', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ');
t('el dedo monta su glifo con `montaje="control"`', /montaje="control"/.test(PIEZA));
t('🔴 y NO lo expone como prop de la pieza', /montaje\??:/.test(PIEZA) === false);

console.log(`\n${mal === 0 ? '✓' : '✗'} ${ok} verdes · ${mal} rojos`);
process.exit(mal === 0 ? 0 : 1);
