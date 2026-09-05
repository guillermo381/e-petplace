// scripts/ia-conjuntos/puntuar-carnet.mjs — S113-E, lote 1.0
//
// EL PUNTAJE, COMO FUNCIÓN PURA. Vive aparte del arnés a propósito: así sus
// controles corren **sin llamar al modelo**, o sea sin gastar y sin depender de
// que un carnet concreto siga estando en Storage. Un instrumento cuyo rojo sólo
// se puede producir con una corrida viva es un instrumento que nadie vuelve a
// verificar.

/** Texto comparable: sin acentos, sin puntuación, sin dobles espacios, en minúscula. */
export function norm(s) {
  if (s == null) return null;
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Fecha comparable POR VALOR, no por cadena: '2024-6-18' == '2024-06-18'. */
export function aFecha(s) {
  if (s == null) return null;
  const m = String(s).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/** ¿El nombre devuelto es alguno de los aceptados? (denominación O producto.) */
function nombreCoincide(devuelto, aceptados) {
  const d = norm(devuelto);
  if (!d) return false;
  return aceptados.some((a) => {
    const n = norm(a);
    if (!n) return false;
    // Coincidencia por contención en cualquier dirección: el carnet puede
    // rotular «Antirrabica» y el modelo devolver «Antirrábica (Defensor 3)».
    return d === n || d.includes(n) || n.includes(d);
  });
}

/**
 * Empareja filas devueltas con filas de verdad POR CONTENIDO, jamás por
 * posición: un modelo que devuelve las mismas vacunas en otro orden no está
 * equivocado, y emparejar por índice lo contaría como si lo estuviera.
 *
 * Una fila devuelta se considera LA MISMA vacuna que una de verdad si coincide
 * el LOTE (identificador fuerte) o el NOMBRE. Lo que no engancha con ninguna es
 * INVENCIÓN: una vacuna que el carnet no tiene aplicada.
 */
export function emparejar(verdad, devueltas) {
  const libres = new Set(verdad.map((_, i) => i));
  const pares = [];
  const inventadas = [];

  for (const d of devueltas) {
    let mejor = -1, mejorPuntaje = 0;
    for (const i of libres) {
      const v = verdad[i];
      let p = 0;
      if (v.lote && norm(d.lote) && norm(d.lote) === norm(v.lote)) p += 3;
      if (nombreCoincide(d.nombre, v.nombre_aceptado)) p += 2;
      if (v.fecha_aplicada && aFecha(d.fecha_aplicada) === aFecha(v.fecha_aplicada)) p += 1;
      if (p > mejorPuntaje) { mejorPuntaje = p; mejor = i; }
    }
    // Umbral: hace falta lote O nombre. Sólo la fecha no identifica una vacuna
    // —dos vacunas del mismo día existen— y aceptarla emparejaría cualquier
    // cosa que cayera en la fecha correcta, escondiendo invención.
    if (mejor >= 0 && mejorPuntaje >= 2) { libres.delete(mejor); pares.push([verdad[mejor], d]); }
    else inventadas.push(d);
  }
  return { pares, inventadas, noDevueltas: [...libres].map((i) => verdad[i]) };
}

export const CAMPOS = ['nombre', 'fecha_aplicada', 'fecha_proxima', 'lote', 'veterinario_nombre_externo', 'tipo_vacuna'];

/**
 * Puntúa UN caso. Devuelve, por campo, aciertos/evaluados — y `sin_verdad`
 * aparte: un campo cuya verdad es null no se cuenta como acierto ni como
 * fallo, porque «el modelo también dijo null» y «el modelo no lo encontró» son
 * indistinguibles ahí, y sumarlos infla la exactitud con casos vacíos.
 */
export function puntuarCaso(caso, devueltas) {
  const { pares, inventadas, noDevueltas } = emparejar(caso.verdad, devueltas);
  const campos = {};
  for (const c of CAMPOS) campos[c] = { aciertos: 0, evaluados: 0, sin_verdad: 0, excluidos: 0 };

  for (const [v, d] of pares) {
    for (const c of CAMPOS) {
      if (c === 'nombre') {
        campos[c].evaluados += 1;
        if (nombreCoincide(d.nombre, v.nombre_aceptado)) campos[c].aciertos += 1;
        continue;
      }
      if (c === 'veterinario_nombre_externo') {
        if (!v.veterinario_aceptado?.length) { campos[c].sin_verdad += 1; continue; }
        campos[c].evaluados += 1;
        if (nombreCoincide(d.veterinario_nombre_externo, v.veterinario_aceptado)) campos[c].aciertos += 1;
        continue;
      }
      if (c === 'tipo_vacuna') {
        // La ambigua se excluye: puntuar contra una moneda al aire no mide al modelo.
        if (v.tipo_ambiguo) { campos[c].excluidos += 1; continue; }
        campos[c].evaluados += 1;   // aquí null SÍ es una respuesta correcta posible
        if (norm(d.tipo_vacuna) === norm(v.tipo_vacuna)) campos[c].aciertos += 1;
        continue;
      }
      const esFecha = c.startsWith('fecha');
      const vv = esFecha ? aFecha(v[c]) : norm(v[c]);
      if (vv == null) { campos[c].sin_verdad += 1; continue; }
      campos[c].evaluados += 1;
      const dd = esFecha ? aFecha(d[c]) : norm(d[c]);
      if (dd === vv) campos[c].aciertos += 1;
    }
  }

  /* ── FABRICACIÓN DE FECHA — la mide la firma ④ del founder ───────────────
   * Una fila cuya verdad tiene precisión PARCIAL (día y mes, sin año, «el año
   * lo completa la familia») tiene UNA respuesta correcta del modelo: `null`.
   * No puede saber el año, y el prompt le prohíbe deducirlo de la fila vecina.
   * Antes esto era invisible: `fecha_aplicada` en null se contaba como «sin
   * verdad» y no se puntuaba, así que **inventar el año no costaba nada**.
   * Ahora se cuenta aparte: no es un error de lectura, es una fecha fabricada. */
  let fechasFabricadas = 0;
  for (const [v, d] of pares) {
    if ((v.precision === 'parcial' || v.fecha_parcial) && aFecha(d.fecha_aplicada)) fechasFabricadas += 1;
  }

  return {
    campos,
    n_fechas_fabricadas: fechasFabricadas,
    n_filas_precision_parcial: caso.verdad.filter((v) => v.precision === 'parcial' || v.fecha_parcial).length,
    n_visibles: caso.verdad.length,
    n_devueltas: devueltas.length,
    n_emparejadas: pares.length,
    n_inventadas: inventadas.length,
    n_no_devueltas: noDevueltas.length,
    inventadas: inventadas.map((d) => ({ nombre: d.nombre ?? null, lote: d.lote ?? null, fecha: d.fecha_aplicada ?? null })),
  };
}

/** p-ésimo percentil por interpolación lineal, sobre una lista ya ordenable. */
export function percentil(xs, p) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? s[lo] : Math.round(s[lo] + (s[hi] - s[lo]) * (i - lo));
}

// ═══ S113-E, adenda 1.0 — LAS DOS FORMAS DE RESPUESTA ══════════════════════
//
// El prompt v1 devuelve `{vacunas:[{nombre, fecha_aplicada, fecha_proxima,
// veterinario_nombre_externo, tipo_vacuna, lote}]}`. El v2 de D devuelve otra
// cosa: renombra `veterinario`, suma `laboratorio`/`via`/`vencimiento_biologico`
// /`confianza`/`evidencia`, y —lo que importa— **saca del array de vacunas los
// renglones del PLAN IMPRESO** y los manda a `plan_impreso`.
//
// 🔴 **Eso cambia qué significa «invención» y hay que decirlo antes de comparar.**
// En v1, un renglón del plan impreso devuelto como vacuna ES invención: el
// carnet no registra esa aplicación. En v2 ese mismo renglón, puesto en
// `plan_impreso`, es la respuesta CORRECTA. *Comparar los dos con la misma
// cuenta le regalaría a v2 una mejora que en parte es sólo un cambio de
// destino* — por eso el resumen reporta las dos columnas por separado y el
// caso «1 → 12» se lee como «1 vacuna + 11 en plan impreso», no como «0%».

/** Lleva la respuesta de cualquiera de los dos prompts a la forma del puntaje. */
export function normalizarRespuesta(version, json) {
  if (version === 'v1') {
    return { vacunas: json?.vacunas ?? [], plan_impreso: [], crudo: json };
  }
  if (version === 'v2') {
    const vs = (json?.vacunas ?? []).map((v) => ({
      ...v,
      // El único renombre real entre los dos contratos. Sin esto, el campo del
      // veterinario mediría 0% en v2 por un nombre de clave, no por el modelo.
      veterinario_nombre_externo: v.veterinario ?? v.veterinario_nombre_externo ?? null,
    }));
    return { vacunas: vs, plan_impreso: json?.plan_impreso ?? [], crudo: json };
  }
  throw new Error(`versión de prompt desconocida: ${version}`);
}

/** Reparto de la evidencia declarada por v2 — la señal de sticker↔fecha. */
export function repartoEvidencia(vacunas) {
  const r = {};
  for (const v of vacunas) { const k = v.evidencia ?? 'sin_declarar'; r[k] = (r[k] ?? 0) + 1; }
  return r;
}

/** Reparto de la confianza declarada por v2. */
export function repartoConfianza(vacunas) {
  const r = {};
  for (const v of vacunas) { const k = v.confianza ?? 'sin_declarar'; r[k] = (r[k] ?? 0) + 1; }
  return r;
}
