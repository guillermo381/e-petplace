// ═══════════════════════════════════════════════════════════════════════════
// S99-A · EL TIMELINE NO PUEDE PERDER EVENTOS AL PAGINAR
//
// QUÉ PRUEBA: que recorrer el timeline de a páginas devuelve EXACTAMENTE el
// mismo conjunto que traerlo entero. Ni uno menos (perdidos), ni uno de más
// (repetidos).
//
// 🔴 Y POR QUÉ TIENE DISCRIMINADOR, que es la mitad que importa: un verde
// acá no significaría nada si el código viejo también pasara. Por eso la
// segunda mitad **simula el cursor VIEJO** (solo `fecha_evento`, sin el
// desempate por `id`) sobre LOS MISMOS DATOS. Medido el 16-ago-2026 sobre
// dos mascotas reales: **el viejo alcanzaba 55 de 62 — PERDÍA 7.**
//
// USO:  IDS=<uuid>,<uuid> npx tsx scripts/verify-timeline-paginacion-s99.mjs
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { initApi, iniciarSesion, leerTimelineHogar } from '../packages/api/src/index.ts';
const env = Object.fromEntries(readFileSync('apps/cliente/.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]));
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) throw new Error('sin sesion');
const ids = process.env.IDS.split(',');
const todo = await leerTimelineHogar(ids, { limite: 500 });
if (!todo.ok) throw new Error('fallo todo: ' + todo.mensaje);
const setTodo = new Set(todo.data.items.map(i=>i.evento_id));

let cursor, paginado = [], vueltas = 0;
do {
  const p = await leerTimelineHogar(ids, { limite: 3, cursor });
  if (!p.ok) throw new Error('fallo pagina: ' + p.mensaje);
  paginado.push(...p.data.items.map(i=>i.evento_id));
  cursor = p.data.siguiente_cursor ?? undefined;
} while (cursor && ++vueltas < 200);

const setPag = new Set(paginado);
const perdidos = [...setTodo].filter(x=>!setPag.has(x));
const repetidos = paginado.length - setPag.size;
console.log('mascotas       :', ids.length);
console.log('eventos totales:', setTodo.size);
console.log('paginado de a 3:', setPag.size, `(${vueltas+1} paginas)`);
console.log('PERDIDOS       :', perdidos.length);
console.log('REPETIDOS      :', repetidos);

// ── DISCRIMINADOR: el algoritmo VIEJO sobre LOS MISMOS DATOS ──────────────
// Se simula pasando solo la parte de fecha del cursor, que es exactamente lo
// que el lector hacía antes (y que el fallback de compatibilidad honra).
let c2, viejo = [], v2 = 0;
do {
  const p = await leerTimelineHogar(ids, { limite: 3, cursor: c2 });
  if (!p.ok) throw new Error('fallo pagina vieja');
  viejo.push(...p.data.items.map(i=>i.evento_id));
  const sc = p.data.siguiente_cursor;
  c2 = sc ? sc.slice(0, sc.indexOf('|')) : undefined;   // ← el cursor VIEJO
} while (c2 && ++v2 < 200);
const setViejo = new Set(viejo);
console.log('── con el cursor VIEJO (solo fecha):');
console.log('   alcanzados  :', setViejo.size, 'de', setTodo.size);
console.log('   PERDIDOS    :', [...setTodo].filter(x=>!setViejo.has(x)).length);
