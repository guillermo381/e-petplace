#!/usr/bin/env node
// scripts/ia-conjuntos/control-puntaje-carnet.mjs — S113-E, lote 1.0
//
// LOS CONTROLES DEL PUNTAJE. Corren **sin llamar al modelo**: alimentan al
// puntuador con respuestas fabricadas y exigen el número exacto. Un arnés de
// medición que sólo se puede verificar gastando plata en una corrida viva no se
// vuelve a verificar nunca.
//
//   node scripts/ia-conjuntos/control-puntaje-carnet.mjs

import { puntuarCaso, emparejar, norm, aFecha, percentil } from './puntuar-carnet.mjs';

let fallos = 0;
const ok = (b, etiqueta, detalle = '') => {
  console.log(`${b ? '✅' : '🔴'} ${etiqueta}${detalle ? '  ' + detalle : ''}`);
  if (!b) fallos += 1;
};

// ── 0 · las primitivas, porque un normalizador roto da verdes silenciosos ────
ok(norm('Antirrábica') === 'antirrabica', 'NORM      quita acentos', `("Antirrábica" → "${norm('Antirrábica')}")`);
ok(norm('  DEFENSOR-3 ') === 'defensor 3', 'NORM      puntuación y espacios', `("  DEFENSOR-3 " → "${norm('  DEFENSOR-3 ')}")`);
ok(aFecha('2024-6-18') === '2024-06-18', 'FECHA     compara por VALOR, no por cadena');
ok(aFecha('18/06/2024') === null, 'FECHA     lo que no es ISO da null (no adivina)');
ok(percentil([1, 2, 3, 4, 100], 0.5) === 3, 'PERCENTIL p50 de [1,2,3,4,100] = 3');
ok(percentil([1, 2, 3, 4, 100], 0.95) === 81, 'PERCENTIL p95 interpola', `(=${percentil([1, 2, 3, 4, 100], 0.95)})`);

// ── el caso de referencia: 3 vacunas visibles, verdad completa ───────────────
const caso = {
  caso: 'sintetico-de-control',
  verdad: [
    { nombre_aceptado: ['Sextuple (DHPPi + L2 + Corona)', 'Nobivac DHPPi'], fecha_aplicada: '2024-06-18', fecha_proxima: '2025-06-18', lote: 'V1638H', veterinario_aceptado: ['Dr. Marco Andrade Pazmino', 'Centro Veterinario ANIMAL CARE'], tipo_vacuna: 'múltiple', tipo_ambiguo: false },
    { nombre_aceptado: ['Coronavirus canino', 'Duramune CV'], fecha_aplicada: '2025-06-26', fecha_proxima: '2026-06-26', lote: 'L5720G', veterinario_aceptado: ['Dr. Marco Andrade Pazmino'], tipo_vacuna: null, tipo_ambiguo: false },
    { nombre_aceptado: ['Antirrabica', 'Defensor 3'], fecha_aplicada: '2026-06-28', fecha_proxima: '2027-06-28', lote: 'R6655C', veterinario_aceptado: ['Dr. Marco Andrade Pazmino'], tipo_vacuna: 'antirrábica', tipo_ambiguo: false },
  ],
};
const perfecta = [
  { nombre: 'Nobivac DHPPi', fecha_aplicada: '2024-06-18', fecha_proxima: '2025-06-18', lote: 'V1638H', veterinario_nombre_externo: 'Dr. Marco Andrade Pazmino', tipo_vacuna: 'múltiple' },
  { nombre: 'Duramune CV', fecha_aplicada: '2025-06-26', fecha_proxima: '2026-06-26', lote: 'L5720G', veterinario_nombre_externo: 'Dr. Marco Andrade Pazmino', tipo_vacuna: null },
  { nombre: 'Antirrábica', fecha_aplicada: '2026-06-28', fecha_proxima: '2027-06-28', lote: 'R6655C', veterinario_nombre_externo: 'Dr. Marco Andrade Pazmino', tipo_vacuna: 'antirrábica' },
];

const exactitud = (r, c) => (r.campos[c].evaluados ? r.campos[c].aciertos / r.campos[c].evaluados : null);

// ── 1 · CONTROL NEGATIVO: la respuesta correcta puntúa 100 en todo ───────────
const rPerfecta = puntuarCaso(caso, perfecta);
const todo100 = ['nombre', 'fecha_aplicada', 'fecha_proxima', 'lote', 'veterinario_nombre_externo', 'tipo_vacuna']
  .every((c) => exactitud(rPerfecta, c) === 1);
ok(todo100 && rPerfecta.n_inventadas === 0 && rPerfecta.n_no_devueltas === 0,
  'NEGATIVO  la respuesta correcta da 100% y CERO invención',
  `(emparejadas ${rPerfecta.n_emparejadas}/3 · inventadas ${rPerfecta.n_inventadas})`);

// ── 2 · POSITIVO A: verdad cambiada ⇒ la exactitud BAJA ──────────────────────
// Es el rojo que pide el encargo: si al mover la verdad el número no se mueve,
// el arnés no está comparando contra la verdad, está comparando contra sí mismo.
const casoMentido = JSON.parse(JSON.stringify(caso));
casoMentido.verdad[0].fecha_aplicada = '2024-01-01';   // era 2024-06-18
casoMentido.verdad[1].lote = 'XXXXXX';                 // era L5720G
const rMentida = puntuarCaso(casoMentido, perfecta);
const bajoFecha = exactitud(rMentida, 'fecha_aplicada') < 1;
const bajoLote = exactitud(rMentida, 'lote') < 1;
ok(bajoFecha && bajoLote,
  'POSITIVO  verdad cambiada ⇒ la exactitud BAJA',
  `(fecha ${(exactitud(rPerfecta, 'fecha_aplicada') * 100).toFixed(0)}%→${(exactitud(rMentida, 'fecha_aplicada') * 100).toFixed(0)}% · lote ${(exactitud(rPerfecta, 'lote') * 100).toFixed(0)}%→${(exactitud(rMentida, 'lote') * 100).toFixed(0)}%)`);

// ── 3 · POSITIVO B: el caso «1 → 12» da invención 11/12 ──────────────────────
// El encargo lo nombra por su número. Es el carnet real de la línea base del
// lote 0 (`carnet-1783564367515.jpg`: esperada 1, devueltas 12). Acá se
// reproduce la FORMA del caso, que es lo que el instrumento tiene que detectar.
const casoUna = { caso: '1-a-12', verdad: [caso.verdad[2]] };
const doce = [
  perfecta[2],
  ...Array.from({ length: 11 }, (_, i) => ({
    nombre: `Vacuna inventada ${i + 1}`, fecha_aplicada: '2025-01-0' + ((i % 9) + 1),
    fecha_proxima: null, lote: `FAKE${i}`, veterinario_nombre_externo: null, tipo_vacuna: null,
  })),
];
const rDoce = puntuarCaso(casoUna, doce);
const invencion = rDoce.n_inventadas / rDoce.n_devueltas;
ok(rDoce.n_inventadas === 11 && rDoce.n_devueltas === 12,
  'POSITIVO  el caso «1 → 12» da invención 11/12',
  `(= ${(invencion * 100).toFixed(1)}% · emparejadas ${rDoce.n_emparejadas})`);

// ── 4 · CLASE: el orden no es error ──────────────────────────────────────────
const rRevuelta = puntuarCaso(caso, [perfecta[2], perfecta[0], perfecta[1]]);
ok(rRevuelta.n_emparejadas === 3 && rRevuelta.n_inventadas === 0,
  'CLASE     empareja por CONTENIDO: otro orden no es error');

// ── 5 · CLASE: una fila que falta NO es invención ────────────────────────────
const rFalta = puntuarCaso(caso, [perfecta[0]]);
ok(rFalta.n_no_devueltas === 2 && rFalta.n_inventadas === 0,
  'CLASE     una fila faltante cuenta como NO DEVUELTA, jamás como invención');

// ── 6 · CLASE: sólo la fecha no alcanza para emparejar ───────────────────────
// Si bastara, una vacuna inventada que cayera en la fecha correcta se contaría
// como acierto y la invención quedaría escondida.
const rSoloFecha = puntuarCaso(caso, [{ nombre: 'Cosa que no existe', fecha_aplicada: '2024-06-18', lote: null, fecha_proxima: null, veterinario_nombre_externo: null, tipo_vacuna: null }]);
ok(rSoloFecha.n_inventadas === 1,
  'CLASE     coincidir sólo en la fecha NO empareja (esconde invención)');

// ── 7 · CLASE: la verdad null no infla la exactitud ──────────────────────────
const rNull = puntuarCaso(
  { caso: 'x', verdad: [{ ...caso.verdad[0], fecha_proxima: null }] },
  [{ ...perfecta[0], fecha_proxima: null }],
);
ok(rNull.campos.fecha_proxima.evaluados === 0 && rNull.campos.fecha_proxima.sin_verdad === 1,
  'CLASE     un campo sin verdad no cuenta como acierto ni como fallo');

console.log();
if (fallos) { console.log(`🔴 ${fallos} control(es) en rojo. El puntaje NO se usa.`); process.exit(1); }
console.log('✅ el puntaje mide: baja con la verdad cambiada, y nombra la invención por su número.');

// ═══ S113-E, adenda 1.0 — controles de las DOS formas de respuesta ═════════
import { normalizarRespuesta, repartoEvidencia } from './puntuar-carnet.mjs';

console.log('\n── las dos formas de respuesta (v1 / v2 de D) ──');
let f2 = 0;
const ok2 = (b, et, d = '') => { console.log(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) f2 += 1; };

// El renombre: sin él, `veterinario` mediría 0% en v2 por una clave, no por el modelo.
const nv2 = normalizarRespuesta('v2', { vacunas: [{ nombre: 'Defensor 3', veterinario: 'Dr. X', evidencia: 'sticker_con_fecha', confianza: 'alta' }], plan_impreso: [{ nombre: 'Sextuple' }] });
ok2(nv2.vacunas[0].veterinario_nombre_externo === 'Dr. X',
  'v2        `veterinario` se mapea a `veterinario_nombre_externo`');
ok2(nv2.plan_impreso.length === 1, 'v2        el plan impreso llega aparte, no mezclado con las vacunas');

const nv1 = normalizarRespuesta('v1', { vacunas: [{ nombre: 'X', veterinario_nombre_externo: 'Dr. Y' }] });
ok2(nv1.plan_impreso.length === 0 && nv1.vacunas[0].veterinario_nombre_externo === 'Dr. Y',
  'v1        no inventa plan impreso donde el contrato no lo tiene');

// 🔴 EL CASO «1 → 12», LEÍDO EN LAS DOS FORMAS. Es el número que decide si v2
// mejoró de verdad o sólo cambió de destino los mismos 11 renglones.
const verdadUna = [{ nombre_aceptado: ['Antirrabica', 'Defensor 3'], fecha_aplicada: '2026-06-28', fecha_proxima: null, lote: 'R6655C', veterinario_aceptado: [], tipo_vacuna: 'antirrábica', tipo_ambiguo: false }];
const once = Array.from({ length: 11 }, (_, i) => ({ nombre: `Plan ${i + 1}` }));
const enV1 = normalizarRespuesta('v1', { vacunas: [{ nombre: 'Defensor 3', fecha_aplicada: '2026-06-28', lote: 'R6655C', fecha_proxima: null, veterinario_nombre_externo: null, tipo_vacuna: 'antirrábica' }, ...once] });
const enV2 = normalizarRespuesta('v2', { vacunas: [{ nombre: 'Defensor 3', fecha_aplicada: '2026-06-28', lote: 'R6655C', fecha_proxima: null, veterinario: null, tipo_vacuna: 'antirrábica', evidencia: 'sticker_con_fecha', confianza: 'alta' }], plan_impreso: once });
const p1 = puntuarCaso({ caso: '1-a-12-v1', verdad: verdadUna }, enV1.vacunas);
const p2 = puntuarCaso({ caso: '1-a-12-v2', verdad: verdadUna }, enV2.vacunas);
ok2(p1.n_inventadas === 11 && p1.n_devueltas === 12,
  'v1        «1 → 12» ⇒ invención 11/12', `(${(p1.n_inventadas / p1.n_devueltas * 100).toFixed(1)}%)`);
ok2(p2.n_inventadas === 0 && p2.n_devueltas === 1 && enV2.plan_impreso.length === 11,
  'v2        el mismo carnet ⇒ 1 vacuna + 11 en plan impreso, invención 0',
  `(vacunas ${p2.n_devueltas} · plan ${enV2.plan_impreso.length} · inv ${p2.n_inventadas})`);

ok2(JSON.stringify(repartoEvidencia(enV2.vacunas)) === '{"sticker_con_fecha":1}',
  'v2        la evidencia declarada se cuenta (señal de sticker↔fecha)');

console.log('');
if (f2) { console.log(`🔴 ${f2} control(es) de forma en rojo.`); process.exit(1); }
console.log('✅ las dos formas se leen, y el plan impreso NO se cuenta como invención.');
