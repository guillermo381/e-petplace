#!/usr/bin/env node
// scripts/ia-conjuntos/construir-carnets-sinteticos.mjs — S113-E, lote 1.0
//
// ── QUÉ CONSTRUYE ───────────────────────────────────────────────────────────
// El conjunto de medición de la pieza `carnet` a partir del lote SINTÉTICO que
// entregó el founder (30 carnets con su ground truth). Copia las imágenes a la
// carpeta gitignored del conjunto y escribe `carnets-sinteticos.json` con la
// verdad ya traducida al CONTRATO DE LA EDGE, no al esquema del generador.
//
// ── LA PROCEDENCIA DE LA VERDAD, MEDIDA Y NO SUPUESTA ───────────────────────
// El encargo pedía anotar la verdad a mano «sin ningún modelo en el medio».
// Acá la verdad es MEJOR que eso y por una razón verificable: el `_meta` de
// cada registro trae `fuente_manuscrita: "patrick-hand-latin-400-normal.ttf"`,
// `calidad_jpeg: 96` y `resolucion: [1400, 933]` — **parámetros de RENDER**.
// Ningún modelo leyendo una foto devuelve el TTF con que se dibujó la letra:
// la verdad es ANTERIOR a toda lectura (dato → imagen), que es la única
// dirección en que un ground truth no puede estar contaminado por el
// instrumento que se va a medir.
//
// ⚠️ **PERO SON SINTÉTICOS, NO REALES.** El encargo pedía carnets reales; lo
// que hay en disco es un lote generado. Su propio LEEME lo dice: «no reemplazan
// una muestra real… ahí apareceran casos que ningun generador anticipa (papel
// roto, stickers pegados encima, anotaciones al margen)». **El veredicto vale
// lo que vale el conjunto y así se escribe en el cierre.**
//
// ── EL HALLAZGO QUE ORDENA TODO ESTE ARCHIVO ────────────────────────────────
// **Un truth sintético dice lo que se QUISO dibujar, no lo que quedó VISIBLE.**
// Medido leyendo las imágenes a mano: **34 de las 167 filas de verdad (20%) NO
// están dibujadas en su imagen.** Puntuar contra el truth crudo castigaría a
// todo modelo por no alucinar 34 vacunas que no existen en la foto — y el
// ranking saldría ordenado por cuál inventa mejor.
//
// LAS CUATRO REGLAS DE VISIBILIDAD, cada una con la imagen que la probó:
//
//   tabla     → TODAS.        carnet_22 (7 filas de verdad): las 7 dibujadas.
//   libreta   → TODAS.        carnet_11: 4 dibujadas + 6 ranuras VACÍAS ⇒ la
//                             grilla admite ≥10, y el máximo del lote es 6.
//   ficha     → LAS PRIMERAS 5. carnet_26 (7 de verdad): dibuja 5, y son las
//                             cinco primeras en orden de fecha. Es CAPACIDAD.
//   pasaporte → SÓLO LAS ANTIRRÁBICAS. La sección IV se rotula «VACUNACION
//                             ANTIRRABICA / Rabies vaccination» y no existe
//                             otra sección de vacunas. carnet_02: 3 de 7, y son
//                             las filas 2, 3 y 5 del truth (NO las primeras
//                             tres — por eso la regla es semántica y no de
//                             corte). carnet_17: 3 de 9. **Los 8 pasaportes
//                             tienen exactamente 3 antirrábicas teniendo 6, 7,
//                             8 o 9 filas**, que es la firma del generador.
//
// El campo `visibilidad_verificada_a_mano` dice, caso por caso, si esa imagen
// se abrió y se contó, o si hereda la regla de su plantilla. **Un caso que
// hereda no es un caso medido**, y por eso se marca en vez de fundirse con los
// demás.
//
// ── LOS CAMPOS: SE MIDE LA INTERSECCIÓN, NO LA LISTA DEL ENCARGO ────────────
// El encargo nombra siete campos (nombre, fecha, lote, laboratorio, vía, quién,
// próxima). **`laboratorio` y `vía` NO EXISTEN en el contrato de la edge**:
// `extract-vacuna` devuelve exactamente seis claves y ninguna es ésa (ver
// extract-vacuna/index.ts:133). Medirlos daría 0% para todo modelo sobre algo
// que la pieza no extrae por diseño — la misma clase de error que medir
// `fecha_vencimiento_producto`, que además NO está dibujado en ninguna
// plantilla. Se mide lo que la pieza puede producir.
//
// `nombre` acepta la denominación O el producto comercial, porque el prompt
// pide «nombre comercial o denominación» (ofrece los dos) y **cada plantilla
// dibuja uno distinto**: la libreta sólo la denominación («Antirrabica»), el
// pasaporte sólo el producto («Zoetis / Defensor 3»), la tabla y la ficha
// ambos. Puntuar contra uno solo mediría la plantilla, no al modelo. El arnés
// además reporta CUÁL de los dos devolvió, que es señal útil aparte.
//
// Uso:  node scripts/ia-conjuntos/construir-carnets-sinteticos.mjs [--origen=DIR]
//       node scripts/ia-conjuntos/construir-carnets-sinteticos.mjs --control

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const DIR_CONJUNTOS = process.env.IA_CONJUNTOS_DIR ?? '.ia-conjuntos';
const ORIGEN_POR_DEFECTO = join(process.env.HOME, 'Downloads', 'carnets_muestra');
const di = (s) => console.log(s);

/** Reglas de visibilidad por plantilla. **Cada una con la imagen que la probó.** */
export const REGLAS_VISIBILIDAD = {
  tabla:     { regla: 'todas',              probada_en: 'carnet_22_ec_tabla_foto_media.jpg (7 de 7 dibujadas)' },
  libreta:   { regla: 'todas',              probada_en: 'carnet_11_ec_libreta_foto_dificil.jpg (4 dibujadas + 6 ranuras vacías ⇒ capacidad ≥10)' },
  ficha:     { regla: 'primeras_5',         probada_en: 'carnet_26_co_ficha_foto_media.jpg (5 de 7, las cinco primeras)' },
  pasaporte: { regla: 'solo_antirrabicas',  probada_en: 'carnet_02 (3 de 7: filas 2,3,5) y carnet_17 (3 de 9)' },
};

/** Las imágenes que YO abrí y conté. Lo demás hereda la regla de su plantilla. */
const VERIFICADAS_A_MANO = new Set([
  'carnet_09_ec_tabla_escaneo.jpg',
  'carnet_11_ec_libreta_foto_dificil.jpg',
  'carnet_02_co_pasaporte_escaneo.jpg',
  'carnet_17_ec_pasaporte_foto_buena.jpg',
  'carnet_26_co_ficha_foto_media.jpg',
  'carnet_22_ec_tabla_foto_media.jpg',
]);

const esAntirrabica = (v) => /antirrab/i.test(v.vacuna ?? '');

/** Qué filas del truth están DIBUJADAS en la imagen, por la regla de su plantilla. */
export function filasVisibles(registro) {
  const plantilla = registro._meta.plantilla;
  const vs = registro.vacunas;
  switch (REGLAS_VISIBILIDAD[plantilla]?.regla) {
    case 'todas':             return vs;
    case 'primeras_5':        return vs.slice(0, 5);
    case 'solo_antirrabicas': return vs.filter(esAntirrabica);
    default: throw new Error(`plantilla desconocida: ${plantilla}. El constructor PARA.`);
  }
}

// ── tipo_vacuna: DERIVADO POR REGLA, con lo ambiguo marcado y no votado ──────
//
// El vocabulario cerrado del prompt (extract-vacuna/index.ts:141) es:
//   antirrábica · múltiple · tos de las perreras · leptospirosis · giardia ·
//   triple felina · leucemia felina
// El conjunto usa 13 denominaciones. Once mapean sin discusión; una es
// correctamente `null` (no está en el vocabulario) y **una es genuinamente
// ambigua**: «Cuadruple felina (+ Clamidia)» no existe en la lista — podría
// leerse como «múltiple» por la regla de polivalentes del propio prompt, o
// como «triple felina» por ser un combo felino. **No se elige por mí: se marca
// AMBIGUO y se excluye del puntaje**, porque puntuar a un modelo contra mi
// moneda al aire no mide al modelo.
const TIPO_POR_DENOMINACION = {
  'Antirrabica': 'antirrábica',
  'Puppy DP (Parvovirus + Moquillo)': 'múltiple',
  'Giardia': 'giardia',
  'Triple felina refuerzo': 'triple felina',
  'Cuadruple felina (+ Clamidia)': 'AMBIGUO',
  'Octuple (DHPPi + L4 + Corona)': 'múltiple',
  'Bordetella (Tos de las perreras)': 'tos de las perreras',
  'Sextuple (DHPPi + L2 + Corona)': 'múltiple',
  'Leucemia felina (FeLV)': 'leucemia felina',
  'Triple felina (Panleucopenia, Rinotraqueitis, Calicivirus)': 'triple felina',
  'Leptospirosis refuerzo': 'leptospirosis',
  'Coronavirus canino': null,          // no está en el vocabulario ⇒ null ES la respuesta correcta
  'Quintuple (DHPPi + L)': 'múltiple',
};

function main() {
  const argOrigen = process.argv.find((a) => a.startsWith('--origen='));
  const origen = argOrigen ? argOrigen.slice('--origen='.length) : ORIGEN_POR_DEFECTO;

  if (!existsSync(origen)) {
    di(`🔴 no existe el origen: ${origen}`);
    di('   Pasá --origen=DIR con la carpeta del founder. El constructor PARA.');
    process.exit(2);
  }

  const dirImg = join(origen, 'imagenes');
  const completo = JSON.parse(readFileSync(join(origen, 'ground_truth_completo.json'), 'utf8'));
  const registros = Array.isArray(completo) ? completo : Object.values(completo);

  const destinoImg = join(DIR_CONJUNTOS, 'imagenes-carnets');
  mkdirSync(destinoImg, { recursive: true });

  const casos = [];
  let filasVerdad = 0, filasDibujadas = 0, ambiguas = 0;
  const noAbren = [];

  for (const r of registros) {
    const archivo = r._meta.archivo;
    const src = join(dirImg, archivo);
    if (!existsSync(src)) { noAbren.push(`${archivo} (no está en imagenes/)`); continue; }

    copyFileSync(src, join(destinoImg, archivo));

    const visibles = filasVisibles(r);
    filasVerdad += r.vacunas.length;
    filasDibujadas += visibles.length;

    const verdad = visibles.map((v) => {
      const tipo = TIPO_POR_DENOMINACION[v.vacuna];
      if (tipo === undefined) throw new Error(`denominación sin regla de tipo: "${v.vacuna}". El constructor PARA.`);
      if (tipo === 'AMBIGUO') ambiguas += 1;
      return {
        // `nombre` acepta CUALQUIERA de los dos — ver cabecera.
        nombre_aceptado: [v.vacuna, v.producto_comercial].filter(Boolean),
        fecha_aplicada: v.fecha_aplicacion ?? null,
        fecha_proxima: v.proxima_dosis ?? null,
        lote: v.lote ?? null,
        // El prompt pide «veterinario o clínica de la cabecera»: los dos valen.
        veterinario_aceptado: [r.clinica?.veterinario, r.clinica?.nombre].filter(Boolean),
        tipo_vacuna: tipo === 'AMBIGUO' ? null : tipo,
        tipo_ambiguo: tipo === 'AMBIGUO',
      };
    });

    casos.push({
      caso: archivo,
      ruta: join(destinoImg, archivo),
      plantilla: r._meta.plantilla,
      condicion_captura: r._meta.condicion_captura,
      formato_fecha: r._meta.formato_fecha,
      relleno: r._meta.relleno,
      pais: r._meta.pais_plantilla,
      n_filas_truth: r.vacunas.length,
      n_filas_visibles: visibles.length,
      regla_visibilidad: REGLAS_VISIBILIDAD[r._meta.plantilla].regla,
      visibilidad_verificada_a_mano: VERIFICADAS_A_MANO.has(archivo),
      verdad,
    });
  }

  const conjunto = {
    nombre: 'carnets-sinteticos',
    pieza: 'carnet',
    generado_el: new Date().toISOString(),
    fuente: `lote sintético del founder · ${origen}`,
    procedencia_verdad: 'GENERADOR (dato → imagen). Probado por _meta.fuente_manuscrita/calidad_jpeg/resolucion, que son parámetros de render y no de lectura.',
    advertencia: 'SINTÉTICO, no real. Su propio LEEME declara que no reemplaza una muestra real (papel roto, stickers encima, anotaciones al margen).',
    unidad: 'un caso = un carnet',
    campos_verdad: ['nombre', 'fecha_aplicada', 'fecha_proxima', 'lote', 'veterinario_nombre_externo', 'tipo_vacuna'],
    campos_del_encargo_no_medibles: {
      laboratorio: 'la edge no lo devuelve (contrato de 6 claves, index.ts:133)',
      via: 'la edge no lo devuelve, y ninguna plantilla lo dibuja',
      fecha_vencimiento_producto: 'está en el truth y NO se dibuja en ninguna plantilla',
    },
    reglas_visibilidad: REGLAS_VISIBILIDAD,
    n_casos: casos.length,
    n_filas_truth: filasVerdad,
    n_filas_visibles: filasDibujadas,
    n_filas_no_dibujadas: filasVerdad - filasDibujadas,
    n_tipos_ambiguos_excluidos: ambiguas,
    casos,
  };

  mkdirSync(DIR_CONJUNTOS, { recursive: true });
  const salida = join(DIR_CONJUNTOS, 'carnets-sinteticos.json');
  writeFileSync(salida, JSON.stringify(conjunto, null, 2));

  di(`conjunto: ${salida}`);
  di(`  ${casos.length} carnets · ${filasVerdad} filas de verdad · ${filasDibujadas} DIBUJADAS · ${filasVerdad - filasDibujadas} no dibujadas (${((filasVerdad - filasDibujadas) / filasVerdad * 100).toFixed(0)}%)`);
  di(`  ${ambiguas} filas con tipo_vacuna AMBIGUO, excluidas del puntaje de ese campo`);
  di(`  imágenes copiadas a ${destinoImg} (carpeta gitignored — nunca al repo)`);
  di(`  verificadas a mano: ${casos.filter((c) => c.visibilidad_verificada_a_mano).length} de ${casos.length}; el resto HEREDA la regla de su plantilla`);
  if (noAbren.length) { di(`  🔴 no abren: ${noAbren.join(', ')}`); }

  // Cinturón: la regla del pasaporte predijo 3 en los ocho. Si un pasaporte no
  // da 3, la regla no es la que creo y el conjunto NO se puede usar como está.
  const pasaportesMal = casos.filter((c) => c.plantilla === 'pasaporte' && c.n_filas_visibles !== 3);
  if (pasaportesMal.length) {
    di(`🔴 CINTURÓN: ${pasaportesMal.length} pasaporte(s) no dan 3 filas visibles: ${pasaportesMal.map((c) => `${c.caso}=${c.n_filas_visibles}`).join(', ')}`);
    di('   La regla medida no se sostiene sobre todo el lote. El constructor PARA.');
    process.exit(2);
  }
  di('✅ cinturón: los 8 pasaportes dan exactamente 3 filas visibles.');
}

main();
