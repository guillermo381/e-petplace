/**
 * system-exacto — S113-E, lote 2.0.
 *
 * Imprime el `system` EXACTO de una edge, llamando a su propio constructor en vez
 * de aproximarlo con expresiones regulares.
 *
 * ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 * Mi primera versión sacaba el prompt con un regex y **borró en silencio** una
 * cláusula que vivía dentro de un `${cond ? … : …}`; reporté «9/9 limpios» sobre un
 * prompt al que le faltaba una ley. Después le puse un PARA, y el PARA es honesto
 * pero deja de medir. *Aproximar un prompt es medir otro prompt.*
 *
 * ⚠️ **CORRE SOBRE UNA COPIA FUERA DEL REPO.** `deno` dentro del monorepo no sólo
 * lee: **escribe** una clave `workspaces` en `package.json` (canon de la casa).
 *
 * ⚠️ Se neutraliza `Deno.serve` ANTES de importar: el módulo lo llama arriba de
 * todo y sin esto el import se queda escuchando para siempre.
 *
 *   deno run -A scripts/nexo/system-exacto.ts <ruta/index.ts> [--telemedicina]
 */
const [ruta, ...flags] = Deno.args;
if (!ruta) { console.error('falta la ruta del index.ts'); Deno.exit(2); }

// @ts-ignore — a propósito: el módulo levanta un servidor al importarse.
Deno.serve = (() => ({ finished: Promise.resolve() })) as unknown as typeof Deno.serve;

const mod = await import(`file://${await Deno.realPath(ruta)}`);
const construir = mod.sistemaDe ?? mod.systemDe ?? mod.sistema;
if (typeof construir !== 'function') {
  console.error('la edge no exporta un constructor de system (sistemaDe). PARA — no lo invento.');
  Deno.exit(2);
}

/* Contexto de mentira, del MISMO tamaño que uno real: el tamaño decide el costo y
   la forma decide qué ramas se prueban. `telemedicina_disponible` se pasa por flag
   para poder atacar las DOS ramas y declararlo. */
const contexto = {
  nombre: 'Thor', especie: 'perro', raza: 'Labrador Retriever', sexo: 'macho',
  edad_texto: '7 años', etapa: 'adulto', peso_kg: 32.4, peso_fecha: '2026-09-01',
  alergias: ['pollo'], medicacion_actual: [], condiciones_cronicas: [],
  proxima_cita: { fecha: '2026-09-12', servicio: 'grooming', prestador: 'Estética Canela' },
  plan_vacunal: 'antirrábica al día, próxima 2026-11-20',
  ultimos_eventos: ['paseo 2026-08-28', 'consulta 2026-08-20'],
  ficha_raza: 'propenso a displasia de cadera y a subir de peso',
  memoria: ['le da miedo la aspiradora'],
  telemedicina_disponible: flags.includes('--telemedicina'),
};
console.log(construir(contexto));
