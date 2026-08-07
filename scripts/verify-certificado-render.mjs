// ============================================================================
// VERIFY — LA CARA DEL CERTIFICADO, COMPUESTA DE VERDAD (S90-D)
//
// Corre la MISMA `render.ts` que sirve la Edge Function (no una copia: el
// archivo real, importado) contra datos FICTICIOS, y escribe los PDFs. Sirve
// para dos cosas distintas:
//
//   ① MIRAR EL PAPEL sin depender de que la migración esté aplicada ni de que
//     la función esté desplegada. El gate del founder es sobre papel impreso;
//     esto es lo que le da algo para imprimir hoy.
//   ② FRENAR EN ROJO si la composición se rompe. Un PDF de 0 bytes, una
//     excepción de fuente, un carácter fuera de WinAnsi: acá se ve.
//
// ── POR QUÉ HAY UN HOOK DE MÓDULOS Y NO UNA COPIA DEL RENDER ────────────────
// `render.ts` importa pdf-lib con el especificador de Deno (`npm:pdf-lib@…`),
// que Node no resuelve. La alternativa obvia —transliterar el render a un
// script aparte— sería exactamente lo que §6 del método prohíbe: dos
// implementaciones del mismo dato que se separan un día y nadie se entera.
// El hook mapea `npm:X@v` → `X` y así se mide EL ARCHIVO QUE SE SIRVE.
//
// Uso:
//   node --experimental-strip-types \
//     --import ./scripts/verify-certificado-render.mjs \
//     ./scripts/verify-certificado-render.mjs
//   (o simplemente: node scripts/verify-certificado-render.mjs)
//
// Requiere pdf-lib resolvible. Si no está en el repo (no es dependencia del
// monorepo — vive solo en el runtime de la Edge Function), se le pasa la ruta:
//   PDFLIB_DIR=/ruta/a/node_modules node scripts/verify-certificado-render.mjs
// ============================================================================

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const SALIDA = resolve(RAIZ, 'scripts/capturas');

// ── El hook: `npm:pdf-lib@1.17.1` → el pdf-lib que haya ────────────────────
const BASE_PDFLIB =
  process.env.PDFLIB_DIR ??
  (existsSync(resolve(RAIZ, 'node_modules/pdf-lib')) ? resolve(RAIZ, 'node_modules') : null);

if (!process.env.__CERT_HOOKED) {
  if (!BASE_PDFLIB) {
    console.error(
      'EN ROJO · no se encontró pdf-lib.\n' +
        '  pdf-lib no es dependencia del monorepo: vive en el runtime de la Edge Function.\n' +
        '  Para correr este verify, instalalo fuera del repo y pasá la ruta:\n' +
        '    mkdir -p /tmp/pdfdeps && cd /tmp/pdfdeps && npm i pdf-lib@1.17.1\n' +
        '    PDFLIB_DIR=/tmp/pdfdeps/node_modules node scripts/verify-certificado-render.mjs',
    );
    process.exit(1);
  }
  const codigoHook = `
    import { createRequire } from 'node:module';
    import { pathToFileURL } from 'node:url';
    const require = createRequire(${JSON.stringify(`${BASE_PDFLIB}/ancla.js`)});
    export async function resolve(specifier, context, next) {
      if (specifier.startsWith('npm:')) {
        const sinPrefijo = specifier.slice(4);
        const arroba = sinPrefijo.lastIndexOf('@');
        const nombre = arroba > 0 ? sinPrefijo.slice(0, arroba) : sinPrefijo;
        // Se resuelve como lo haría Node: el entry real del paquete, jamás su
        // carpeta (un import de directorio no es ESM válido).
        return { url: pathToFileURL(require.resolve(nombre)).href, shortCircuit: true };
      }
      return next(specifier, context);
    }
  `;
  register(`data:text/javascript,${encodeURIComponent(codigoHook)}`, import.meta.url);
  process.env.__CERT_HOOKED = '1';
}

const { componerCertificado } = await import(
  pathToFileURL(resolve(RAIZ, 'supabase/functions/documento-certificado/render.ts')).href
);

// ── Datos FICTICIOS, y se dicen ────────────────────────────────────────────
// Nada de la DB. Mismo criterio que las demos de B: un espécimen que pudiera
// circular como real sería exactamente el problema de falsificación que el
// papel todavía no puede atacar (v1 sin folio).
const BASE = {
  declaracion:
    'Examiné a Luna en la fecha indicada. Al examen físico general no se observan signos ' +
    'compatibles con enfermedad infectocontagiosa. Mucosas rosadas, temperatura dentro de ' +
    'rango, auscultación cardiopulmonar sin hallazgos. A la fecha de este examen la considero ' +
    'apta para el traslado descrito.\n' +
    'Recomiendo repetir el control si el viaje se pospone más de treinta días.',
  fechaExamen: '2026-08-05',
  emitidoEn: '2026-08-07T15:20:00Z',
  emisorNombre: 'María Salas',
  emisorMatricula: 'MV-2014-08871',
  emisorPais: 'Ecuador',
  negocioNombre: 'Clínica Veterinaria Andina',
  negocioDireccion: 'Av. de los Shyris 1420, Quito',
  negocioTelefono: '+593 2 245 8890',
  mascotaNombre: 'Luna',
  mascotaEspecie: 'perro',
  mascotaRaza: 'Border collie',
  mascotaSexo: 'hembra',
  mascotaNacimiento: '2021-03-14',
  mascotaMicrochip: '956000012345678',
  estadoVidaAlEmitir: 'activa',
};

const CASOS = [
  { archivo: 's90-d-certificado-viaje.pdf', datos: { ...BASE, alcance: 'viaje' } },
  {
    archivo: 's90-d-certificado-constancia-memorial.pdf',
    // El caso que la orden manda no esconder: un certificado PUEDE emitirse
    // para una mascota fallecida (seguro, cierre de tratamiento). La cara NO
    // cambia — el estado se dice en voz clínica neutra y nada más.
    datos: {
      ...BASE,
      alcance: 'constancia',
      estadoVidaAlEmitir: 'fallecida',
      declaracion:
        'Luna fue atendida en esta clínica hasta la fecha indicada. Se deja constancia de la ' +
        'atención brindada y del tratamiento instaurado, a solicitud de la familia.',
    },
  },
  {
    // El borde barato que igual se mide: emisor sin teléfono ni país, paciente
    // sin microchip ni raza. Ninguna fila se pinta con «—»: no existe.
    archivo: 's90-d-certificado-datos-minimos.pdf',
    datos: {
      ...BASE,
      alcance: 'hospedaje',
      emisorPais: null,
      negocioTelefono: null,
      mascotaRaza: null,
      mascotaMicrochip: null,
      declaracion: 'Sin hallazgos al examen general. Apta para hospedaje.',
    },
  },
];

mkdirSync(SALIDA, { recursive: true });
let fallas = 0;
for (const c of CASOS) {
  try {
    const bytes = await componerCertificado(c.datos);
    if (!bytes || bytes.length < 1000) {
      console.error(`EN ROJO · ${c.archivo}: ${bytes?.length ?? 0} bytes`);
      fallas++;
      continue;
    }
    const destino = resolve(SALIDA, c.archivo);
    writeFileSync(destino, bytes);
    console.log(`  ok  ${c.archivo}  ${bytes.length} bytes  ${destino}`);
  } catch (e) {
    console.error(`EN ROJO · ${c.archivo}: ${e.message}`);
    fallas++;
  }
}

if (fallas > 0) {
  console.error(`\nEN ROJO — ${fallas}/${CASOS.length} papeles no se compusieron.`);
  process.exit(1);
}
console.log(`\nVERDE — ${CASOS.length}/${CASOS.length} papeles compuestos.`);
