#!/usr/bin/env node
/**
 * medir.mjs — captura y medición de superficies de tienda
 * e-PetPlace / BENCHMARK-TIENDA
 *
 * Mide geometría REAL del DOM renderizado. No estima. Si no puede medir algo,
 * lo reporta como null y lo dice.
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// ---------- argumentos ----------
const A = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    const v = (process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) ? process.argv[++i] : true;
    A[k] = v;
  }
}
if (!A.url || !A.nombre) {
  console.error(`
uso: node medir.mjs --nombre <referente> --superficie <vitrina|ficha|carrito|direccion|seguimiento> --url <url> [opciones]

opciones:
  --selector "<css>"   selector de la tarjeta, si la autodetección falla
  --headed             abre el navegador visible (necesario para --pausa)
  --pausa              espera ENTER antes de medir (para loguearte / poner dirección)
  --perfil <dir>       directorio de perfil persistente (la sesión sobrevive entre corridas)
  --dispositivo <n>    default "iPhone 13"
  --salida <dir>       default ./salida
  --scroll <n>         hace scroll de n píxeles antes de medir (default 0)
`);
  process.exit(1);
}

const DISPOSITIVO = A.dispositivo || 'iPhone 13';
const SALIDA = A.salida || './salida';
const SUP = A.superficie || 'vitrina';
fs.mkdirSync(path.join(SALIDA, 'capturas'), { recursive: true });
fs.mkdirSync(path.join(SALIDA, 'datos'), { recursive: true });

// ---------- función que corre DENTRO de la página ----------
function MEDIDOR(cfg) {
  const { selectorOverride, superficie } = cfg;
  const vw = window.innerWidth, vh = window.innerHeight;

  const RE_PRECIO = /(?:US\$|R\$|S\/|COP|MXN|ARS|USD|BRL|EUR|\$|€|£)\s?[\d.,]{1,12}|[\d.,]{1,12}\s?(?:€|\$|COP|MXN|ARS|USD|BRL)/i;
  const RE_AGREGAR = /(agregar|añadir|anadir|add to cart|add|comprar|adicionar|sumar|\+)/i;

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) < 0.05) return false;
    return true;
  };
  const bbox = (el) => {
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), area: +(r.width * r.height).toFixed(0) };
  };
  const fuente = (el) => {
    const s = getComputedStyle(el);
    return { px: parseFloat(s.fontSize) || null, peso: s.fontWeight, color: s.color, transform: s.textTransform };
  };
  // hojas de texto: elementos cuyo texto no viene de un hijo con texto
  const hojasTexto = (root) => {
    const out = [];
    root.querySelectorAll('*').forEach(el => {
      if (!visible(el)) return;
      const propio = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
      if (propio.length) out.push({ el, texto: propio });
    });
    return out;
  };

  // ---------- detección de tarjetas de producto ----------
  function detectarTarjetas() {
    if (selectorOverride) {
      const n = [...document.querySelectorAll(selectorOverride)].filter(visible);
      if (n.length) return { tarjetas: n, metodo: 'selector-manual', firma: selectorOverride };
    }
    const areaVP = vw * vh;
    const candidatos = [];
    const imgs = [...document.querySelectorAll('img, picture, [style*="background-image"]')].filter(visible)
      .filter(el => { const r = el.getBoundingClientRect(); return r.width >= 40 && r.height >= 40; });
    for (const img of imgs) {
      let el = img;
      for (let i = 0; i < 8 && el && el.parentElement; i++) {
        el = el.parentElement;
        const r = el.getBoundingClientRect();
        if (r.width * r.height > areaVP * 0.75) break;
        const t = (el.innerText || '').trim();
        if (RE_PRECIO.test(t) && t.length < 400) { candidatos.push(el); break; }
      }
    }
    // agrupar por ancho redondeado (las tarjetas de una grilla comparten ancho)
    const grupos = new Map();
    for (const el of candidatos) {
      const r = el.getBoundingClientRect();
      const k = `${el.tagName}|${Math.round(r.width / 4) * 4}`;
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(el);
    }
    let mejor = null, mejorK = null;
    for (const [k, v] of grupos) if (!mejor || v.length > mejor.length) { mejor = v; mejorK = k; }
    if (!mejor || mejor.length < 2) return { tarjetas: [], metodo: 'fallo', firma: null };
    // sacar anidados
    const limpio = mejor.filter(a => !mejor.some(b => b !== a && b.contains(a)));
    return { tarjetas: limpio, metodo: 'auto', firma: mejorK };
  }

  // ---------- medir una tarjeta ----------
  function medirTarjeta(card) {
    const bc = bbox(card);
    // imagen
    let imgEl = null, mejorArea = 0;
    card.querySelectorAll('img, picture, svg, [style*="background-image"]').forEach(el => {
      if (!visible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width * r.height > mejorArea) { mejorArea = r.width * r.height; imgEl = el; }
    });
    const hojas = hojasTexto(card);
    // precio: entre las hojas que matchean precio, la de mayor font-size
    const precios = hojas.filter(h => RE_PRECIO.test(h.texto));
    let precioEl = null;
    for (const p of precios) {
      const f = fuente(p.el).px || 0;
      if (!precioEl || f > (fuente(precioEl.el).px || 0)) precioEl = p;
    }
    // nombre: hoja más larga que no sea precio y no sea el control
    const noPrecio = hojas.filter(h => !RE_PRECIO.test(h.texto) && h.texto.length > 2 && !RE_AGREGAR.test(h.texto.trim()));
    let nombreEl = null;
    for (const n of noPrecio) if (!nombreEl || n.texto.length > nombreEl.texto.length) nombreEl = n;
    // control
    let ctrlEl = null;
    const clic = [...card.querySelectorAll('button, [role="button"], a[href], input[type="button"]')].filter(visible);
    for (const c of clic) {
      const et = ((c.getAttribute('aria-label') || '') + ' ' + (c.innerText || '') + ' ' + (c.getAttribute('title') || '')).trim();
      if (RE_AGREGAR.test(et) || (c.querySelector('svg') && (c.innerText || '').trim().length < 3)) { ctrlEl = c; break; }
    }
    const bi = imgEl ? bbox(imgEl) : null;
    const bn = nombreEl ? bbox(nombreEl.el) : null;
    const bp = precioEl ? bbox(precioEl.el) : null;
    const bk = ctrlEl ? bbox(ctrlEl) : null;
    const fn = nombreEl ? fuente(nombreEl.el) : null;
    const fp = precioEl ? fuente(precioEl.el) : null;
    return {
      tarjeta: bc,
      imagen: bi, nombre: bn, precio: bp, control: bk,
      texto: { nombre: nombreEl ? nombreEl.texto.slice(0, 90) : null, precio: precioEl ? precioEl.texto.slice(0, 40) : null,
               control: ctrlEl ? ((ctrlEl.getAttribute('aria-label') || ctrlEl.innerText || '').trim().slice(0, 40) || '(solo ícono)') : null },
      tipografia: { nombre: fn, precio: fp },
      proporciones: {
        imagen_sobre_tarjeta: bi && bc.area ? +(bi.area / bc.area).toFixed(3) : null,
        control_sobre_tarjeta: bk && bc.area ? +(bk.area / bc.area).toFixed(3) : null,
        precio_sobre_nombre_fontsize: (fp && fn && fn.px) ? +(fp.px / fn.px).toFixed(3) : null,
        control_sobre_imagen_area: (bk && bi && bi.area) ? +(bk.area / bi.area).toFixed(3) : null,
        alto_imagen_sobre_alto_tarjeta: (bi && bc.h) ? +(bi.h / bc.h).toFixed(3) : null
      },
      area_tactil_control: bk ? { w: bk.w, h: bk.h, cumple_48: bk.w >= 48 && bk.h >= 48, cumple_44: bk.w >= 44 && bk.h >= 44 } : null
    };
  }

  // ---------- densidad ----------
  function medirDensidad(tarjetas) {
    const enPrimeraPantalla = tarjetas.filter(t => { const r = t.getBoundingClientRect(); return r.top < vh && r.bottom > 0; });
    const completas = tarjetas.filter(t => { const r = t.getBoundingClientRect(); return r.top >= 0 && r.bottom <= vh; });
    const tops = tarjetas.map(t => t.getBoundingClientRect().top + window.scrollY);
    const primerTop = tops.length ? Math.min(...tops) : null;
    return {
      viewport: { w: vw, h: vh },
      productos_visibles_primera_pantalla: enPrimeraPantalla.length,
      productos_completos_primera_pantalla: completas.length,
      alto_cromo_antes_del_primer_producto_px: primerTop != null ? +primerTop.toFixed(1) : null,
      cromo_como_porcentaje_de_pantalla: primerTop != null ? +((primerTop / vh) * 100).toFixed(1) : null,
      total_tarjetas_en_dom: tarjetas.length
    };
  }

  // ---------- composición de primera pantalla (genérico) ----------
  function composicionPrimeraPantalla() {
    const bloques = [];
    const raiz = document.body;
    const recorrer = (el, prof) => {
      if (prof > 4) return;
      for (const h of el.children) {
        if (!visible(h)) continue;
        const r = h.getBoundingClientRect();
        if (r.top > vh || r.bottom < 0) continue;
        if (r.height < 12) continue;
        const cubre = r.width > vw * 0.6;
        if (cubre && r.height >= 24) {
          bloques.push({
            etiqueta: h.tagName.toLowerCase() + (h.getAttribute('role') ? `[role=${h.getAttribute('role')}]` : ''),
            clase: (h.className && typeof h.className === 'string') ? h.className.slice(0, 60) : '',
            y: +r.top.toFixed(1), alto: +r.height.toFixed(1),
            pct_de_pantalla: +((Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh * 100).toFixed(1),
            texto: (h.innerText || '').trim().slice(0, 70).replace(/\s+/g, ' ')
          });
        } else recorrer(h, prof + 1);
      }
    };
    recorrer(raiz, 0);
    return bloques.slice(0, 25);
  }

  // ---------- mapa vs banda (seguimiento) ----------
  function medirMapa() {
    const sel = 'canvas, .mapboxgl-canvas, .gm-style, [class*="map" i], [id*="map" i], iframe[src*="maps"]';
    let mejor = null, area = 0;
    document.querySelectorAll(sel).forEach(el => {
      if (!visible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width * r.height > area) { area = r.width * r.height; mejor = el; }
    });
    if (!mejor) return { mapa_detectado: false, nota: 'no se detectó elemento de mapa — puede estar oculto o ser nativo' };
    const r = bbox(mejor);
    const visibleAlto = Math.min(r.y + r.h, vh) - Math.max(r.y, 0);
    return {
      mapa_detectado: true,
      selector_usado: mejor.tagName.toLowerCase() + '.' + String(mejor.className || '').split(' ')[0],
      mapa: r,
      alto_mapa_visible_px: +visibleAlto.toFixed(1),
      pct_alto_pantalla_mapa: +((visibleAlto / vh) * 100).toFixed(1),
      pct_alto_pantalla_resto: +(((vh - visibleAlto) / vh) * 100).toFixed(1)
    };
  }

  // ---------- salida ----------
  const base = { url: location.href, titulo: document.title, viewport: { w: vw, h: vh }, scrollY: window.scrollY, superficie };
  if (superficie === 'vitrina') {
    const d = detectarTarjetas();
    if (!d.tarjetas.length) return { ...base, error: 'no se detectaron tarjetas de producto', sugerencia: 'pasá --selector "<css>" mirando el inspector' };
    const medidas = d.tarjetas.slice(0, 12).map(medirTarjeta);
    return { ...base, deteccion: { metodo: d.metodo, firma: d.firma }, densidad: medirDensidad(d.tarjetas), tarjetas: medidas };
  }
  if (superficie === 'seguimiento') return { ...base, mapa: medirMapa(), composicion: composicionPrimeraPantalla() };
  return { ...base, composicion: composicionPrimeraPantalla() };
}

// ---------- resumen agregado ----------
function resumir(r) {
  if (!r.tarjetas || !r.tarjetas.length) return null;
  const num = (arr) => arr.filter(v => typeof v === 'number' && isFinite(v));
  const med = (arr) => { const a = num(arr).sort((x, y) => x - y); return a.length ? +(a[Math.floor(a.length / 2)]).toFixed(3) : null; };
  const P = r.tarjetas.map(t => t.proporciones);
  return {
    n_tarjetas_medidas: r.tarjetas.length,
    mediana_imagen_sobre_tarjeta: med(P.map(p => p.imagen_sobre_tarjeta)),
    mediana_alto_imagen_sobre_alto_tarjeta: med(P.map(p => p.alto_imagen_sobre_alto_tarjeta)),
    mediana_control_sobre_tarjeta: med(P.map(p => p.control_sobre_tarjeta)),
    mediana_precio_sobre_nombre_fontsize: med(P.map(p => p.precio_sobre_nombre_fontsize)),
    mediana_control_sobre_imagen_area: med(P.map(p => p.control_sobre_imagen_area)),
    controles_que_cumplen_48dp: r.tarjetas.filter(t => t.area_tactil_control?.cumple_48).length,
    controles_medidos: r.tarjetas.filter(t => t.area_tactil_control).length
  };
}

// ---------- main ----------
const dev = devices[DISPOSITIVO] || devices['iPhone 13'];
let ctx, browser;
if (A.perfil) {
  ctx = await chromium.launchPersistentContext(A.perfil, { ...dev, headless: !A.headed, locale: 'es-EC', args: ['--no-sandbox'] });
} else {
  browser = await chromium.launch({ headless: !A.headed, args: ['--no-sandbox'] });
  ctx = await browser.newContext({ ...dev, locale: 'es-EC' });
}
const page = ctx.pages()[0] || await ctx.newPage();

console.log(`→ ${A.nombre} / ${SUP}  (${DISPOSITIVO} ${dev.viewport.width}×${dev.viewport.height})`);
try {
  await page.goto(A.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
} catch (e) { console.error('  ✗ no cargó:', e.message.split('\n')[0]); }
await page.waitForTimeout(4000);

if (A.pausa) {
  console.log('  ⏸  Acomodá la pantalla en el navegador (login, dirección, scroll).');
  console.log('     Cuando la superficie esté como la querés medir, apretá ENTER acá.');
  await new Promise(res => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question('', () => { rl.close(); res(); }); });
}
if (A.scroll) { await page.evaluate(y => window.scrollTo(0, y), Number(A.scroll)); await page.waitForTimeout(1200); }

const slug = `${A.nombre}-${SUP}`;
const png = path.join(SALIDA, 'capturas', `${slug}.png`);
await page.screenshot({ path: png });

let datos;
try { datos = await page.evaluate(MEDIDOR, { selectorOverride: A.selector || null, superficie: SUP }); }
catch (e) { datos = { error: 'falló la medición en página: ' + e.message }; }

datos.meta = { referente: A.nombre, superficie: SUP, dispositivo: DISPOSITIVO, captura: png, medido_en: new Date().toISOString() };
const res = resumir(datos);
if (res) datos.resumen = res;

fs.writeFileSync(path.join(SALIDA, 'datos', `${slug}.json`), JSON.stringify(datos, null, 2));

if (datos.error) console.log('  ✗', datos.error, datos.sugerencia ? `\n    ${datos.sugerencia}` : '');
else if (res) {
  console.log(`  ✓ ${res.n_tarjetas_medidas} tarjetas | foto ${(res.mediana_imagen_sobre_tarjeta * 100).toFixed(0)}% del área | control ${(res.mediana_control_sobre_tarjeta * 100).toFixed(0)}% | precio/nombre ${res.mediana_precio_sobre_nombre_fontsize}×`);
  console.log(`    ${datos.densidad.productos_visibles_primera_pantalla} productos en 1ª pantalla, cromo ${datos.densidad.alto_cromo_antes_del_primer_producto_px}px (${datos.densidad.cromo_como_porcentaje_de_pantalla}%)`);
} else if (datos.mapa) {
  console.log(datos.mapa.mapa_detectado ? `  ✓ mapa ${datos.mapa.pct_alto_pantalla_mapa}% / resto ${datos.mapa.pct_alto_pantalla_resto}%` : `  ~ ${datos.mapa.nota}`);
} else console.log(`  ✓ composición: ${datos.composicion?.length || 0} bloques`);
console.log(`    → ${png}`);

if (browser) await browser.close(); else await ctx.close();
