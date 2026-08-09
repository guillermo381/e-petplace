/**
 * 🔴 P0 · «NO TENÉS PERROS» AL CERRAR UNA RESERVA DE PASEO — DIAGNÓSTICO.
 *
 * Síntoma medido por el founder en dispositivo, cuenta real: los pasos previos
 * muestran las mascotas, y **el último paso rechaza**. Paseo es el único
 * servicio dogs-only, y es el único roto.
 *
 * El guard es `_mascota_elegible_servicio(mascota, tipo)`, **SECURITY INVOKER**,
 * llamado desde `crear_bloqueo_agenda` (DEFINER). Su cuerpo:
 *
 *   COALESCE((SELECT m.estado_vida='activa'
 *                AND (ts.especies_elegibles IS NULL OR ts.especies_elegibles ? m.especie)
 *               FROM mascotas m LEFT JOIN tipos_servicio ts ON ts.codigo = p_tipo_servicio
 *              WHERE m.id = p_mascota_id), false)
 *
 * **Hay TRES formas distintas de que devuelva `false`, y cada una acusa a un
 * culpable diferente:** que no vea la fila de `mascotas` · que `estado_vida` no
 * sea 'activa' · que `especies_elegibles` no contenga la especie. El síntoma
 * («los pasos previos muestran las mascotas») ya hace improbable la primera,
 * pero improbable no es medido.
 *
 * Esto NO cura: mide, y separa las cuatro hipótesis de la mesa (L-214: una
 * hipótesis que cruza territorio viaja con su medición).
 */
import { sql, guardarSeg2, linea } from './lib-seg2.mjs';

// ── ① EL CATÁLOGO: qué especies acepta cada servicio ───────────────────────
const tipos = await sql(
  `SELECT codigo, especies_elegibles::text AS especies, reservable, es_medico
   FROM tipos_servicio ORDER BY codigo`,
  'p0-tipos',
);
linea('\n══ ① `tipos_servicio.especies_elegibles` ══\n');
for (const t of tipos) {
  const marca = t.especies && t.especies !== 'null' ? '🔒' : '  ';
  linea(`  ${marca} ${t.codigo.padEnd(26)} ${String(t.especies).slice(0, 60)}`);
}

// ── ② LAS MASCOTAS DEL FOUNDER ─────────────────────────────────────────────
const mascotas = await sql(
  `SELECT m.id, m.nombre, m.especie, m.estado_vida, m.sujeto,
          f.created_by_sistema AS marca_familia
   FROM mascotas m
   LEFT JOIN familia f ON f.id = m.familia_id
   WHERE m.nombre IN ('Thor','Zeus')
   ORDER BY m.nombre`,
  'p0-mascotas',
);
linea('\n══ ② LAS MASCOTAS DEL FOUNDER ══\n');
for (const m of mascotas) {
  linea(`  ${m.nombre.padEnd(6)} especie=«${m.especie}»  estado_vida=«${m.estado_vida}»  sujeto=«${m.sujeto ?? '(null)'}»`);
  linea(`         marca de familia: ${m.marca_familia ?? '(sin marca — creada por un usuario) ✅'}`);
}

// ── ③ EL GUARD, EVALUADO DE VERDAD ─────────────────────────────────────────
linea('\n══ ③ EL GUARD, evaluado sobre esas mascotas ══\n');
const ids = mascotas.map((m) => `'${m.id}'`).join(',');
if (ids) {
  const ev = await sql(
    `SELECT m.nombre, t.codigo AS servicio,
            public._mascota_elegible_servicio(m.id, t.codigo) AS elegible
     FROM mascotas m CROSS JOIN tipos_servicio t
     WHERE m.id IN (${ids}) AND t.codigo IN ('paseo','veterinaria','grooming','adiestramiento')
     ORDER BY m.nombre, t.codigo`,
    'p0-eval',
  );
  for (const e of ev) {
    linea(`  ${e.elegible ? '✅' : '🔴'} ${e.nombre.padEnd(6)} × ${e.servicio.padEnd(16)} → ${e.elegible}`);
  }

  // ── ④ LA PIEZA EXACTA: el operador `?` sobre el jsonb ────────────────────
  linea('\n══ ④ LA COMPARACIÓN, DESARMADA ══\n');
  const desarme = await sql(
    `SELECT m.nombre, m.especie,
            ts.especies_elegibles::text AS elegibles,
            (ts.especies_elegibles IS NULL) AS elegibles_null,
            (ts.especies_elegibles ? m.especie) AS contiene_especie,
            (m.estado_vida = 'activa') AS vida_ok,
            jsonb_typeof(ts.especies_elegibles) AS tipo_json
     FROM mascotas m LEFT JOIN tipos_servicio ts ON ts.codigo = 'paseo'
     WHERE m.id IN (${ids}) ORDER BY m.nombre`,
    'p0-desarme',
  );
  for (const d of desarme) {
    linea(`  ${d.nombre}:`);
    linea(`     especie en la mascota ....... «${d.especie}»`);
    linea(`     especies_elegibles (paseo) .. ${d.elegibles}  (tipo json: ${d.tipo_json})`);
    linea(`     ¿es NULL? ................... ${d.elegibles_null}`);
    linea(`     ¿contiene la especie? ....... ${d.contiene_especie}   ← si es false o null, acá muere`);
    linea(`     ¿estado_vida = activa? ...... ${d.vida_ok}`);
  }
}

// ── ⑤ HIPÓTESIS (d): ¿el marcado de sondas tocó a alguien real? ────────────
linea('\n══ ⑤ HIPÓTESIS (d) — ¿el marcado de S92 tocó algo real? ══\n');
const marcadas = await sql(
  `SELECT count(*)::int AS n FROM mascotas m
   JOIN familia f ON f.id = m.familia_id
   WHERE f.created_by_sistema = 'sonda_s91d_purgada'
     AND m.nombre IN ('Thor','Zeus')`,
  'p0-marcadas',
);
linea(`  mascotas Thor/Zeus dentro de familias marcadas como prueba: ${marcadas[0].n} ${marcadas[0].n === 0 ? '✅ ninguna' : '🔴'}`);

const especiesRaras = await sql(
  `SELECT especie, count(*)::int AS n FROM mascotas GROUP BY 1 ORDER BY 2 DESC`,
  'p0-especies',
);
linea('\n  censo de especies en `mascotas`:');
for (const e of especiesRaras) linea(`     ${String(e.n).padStart(3)} × «${e.especie}»`);

guardarSeg2('p0-diagnostico.json', { tipos, mascotas });
linea('');
