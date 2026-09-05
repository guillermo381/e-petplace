#!/usr/bin/env node
// scripts/ia-conjuntos/construir-carnets-reales.mjs — S113-E, adenda 1.0
//
// El conjunto de los 5 carnets REALES, traducido a la misma forma que el
// sintético para que las dos tablas se lean con la misma vara.
//
// ── 🔴 SU VERDAD ES MÁS DÉBIL QUE LA DEL SINTÉTICO, Y HAY QUE DECIRLO ──────
// El sintético tiene verdad de GENERADOR (dato → imagen). Éste tiene verdad de
// ACEPTACIÓN: son las filas de `evento_vacuna_aplicada` que el founder dejó
// entrar al expediente después de revisar lo que el extractor propuso. ⇒ **no
// dice «esto es lo que el carnet tiene»: dice «esto es lo que alguien aceptó»**.
//
// El caso más claro es el «1 → 12» (`carnet-1783564367515.jpg`): su verdad son
// 1 fila porque se guardó 1, no porque el carnet tenga una sola. Sirve
// perfectamente para medir INVENCIÓN —el modelo devolvió 12 y 11 no se
// aceptaron— y **no sirve para medir recall**, porque un carnet con más
// vacunas legítimas daría «invención» donde hubo acierto. El conjunto lo marca
// caso por caso y el resumen lo separa.
//
// Uso:  node scripts/ia-conjuntos/construir-carnets-reales.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { claveServicio, bajarObjeto, DIR_CONJUNTOS } from './lib-conjuntos.mjs';

const di = (s) => console.log(s);
const ORIGEN = process.argv.find((a) => a.startsWith('--desde='))?.slice(8)
  ?? '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s113-e/.ia-conjuntos/carnets.json';

/** El «1 → 12»: su verdad es de aceptación y NO sirve para recall. */
const SOLO_INVENCION = new Set(['carnet-1783564367515.jpg']);

async function main() {
  if (!existsSync(ORIGEN)) { di(`🔴 no encuentro el conjunto del lote 0 en ${ORIGEN}`); process.exit(2); }
  const viejo = JSON.parse(readFileSync(ORIGEN, 'utf8'));

  // Si falta la clave, `claveServicio()` PARA y dice el comando exacto. No cae
  // al `supabase projects api-keys` de antes — ver D-1013 en lib-conjuntos.
  const clave = claveServicio();

  const destino = join(DIR_CONJUNTOS, 'imagenes-carnets-reales');
  mkdirSync(destino, { recursive: true });

  const casos = [];
  let filas = 0;
  for (const c of viejo.casos) {
    const img = await bajarObjeto(c.bucket, c.path, clave);
    if (!img) { di(`🔴 ${c.caso}: no se pudo bajar de ${c.bucket}/${c.path}`); continue; }
    const ruta = join(destino, c.caso);
    writeFileSync(ruta, img);
    filas += c.verdad.length;
    casos.push({
      caso: c.caso,
      ruta,
      plantilla: 'real',
      condicion_captura: 'real',
      formato_fecha: null, relleno: null, pais: null,
      n_filas_truth: c.verdad.length,
      n_filas_visibles: c.verdad.length,
      regla_visibilidad: 'no aplica (verdad de aceptación, no de render)',
      visibilidad_verificada_a_mano: false,
      solo_para_invencion: SOLO_INVENCION.has(c.caso),
      verdad: c.verdad.map((v) => ({
        nombre_aceptado: [v.nombre_vacuna].filter(Boolean),
        fecha_aplicada: v.fecha_aplicada ?? null,
        fecha_proxima: v.fecha_proxima ?? null,
        lote: v.lote ?? null,
        veterinario_aceptado: [v.veterinario_nombre_externo].filter(Boolean),
        tipo_vacuna: v.tipo_vacuna ?? null,
        tipo_ambiguo: false,
      })),
    });
    di(`   ${c.caso}  ${c.verdad.length} filas${SOLO_INVENCION.has(c.caso) ? '  ← sólo invención' : ''}`);
  }

  const conjunto = {
    nombre: 'carnets-reales',
    pieza: 'carnet',
    generado_el: new Date().toISOString(),
    fuente: `conjunto del lote 0 (${ORIGEN}) + imágenes bajadas de Storage`,
    procedencia_verdad: 'ACEPTACIÓN — filas de evento_vacuna_aplicada que una persona dejó entrar al expediente. Más débil que la del sintético (generador): dice qué se aceptó, no qué tiene el carnet.',
    advertencia: 'El caso «1 → 12» mide INVENCIÓN y no recall: su verdad es 1 porque se guardó 1.',
    unidad: 'un caso = un carnet',
    campos_verdad: ['nombre', 'fecha_aplicada', 'fecha_proxima', 'lote', 'veterinario_nombre_externo', 'tipo_vacuna'],
    n_casos: casos.length,
    n_filas_truth: filas,
    n_filas_visibles: filas,
    n_filas_no_dibujadas: 0,
    n_tipos_ambiguos_excluidos: 0,
    casos,
  };
  const salida = join(DIR_CONJUNTOS, 'carnets-reales.json');
  writeFileSync(salida, JSON.stringify(conjunto, null, 2));
  di(`\nconjunto: ${salida}\n  ${casos.length} carnets reales · ${filas} filas de verdad (de aceptación)`);
}

main().catch((e) => { console.error('🔴', e.message); process.exit(1); });
