// La única línea que nombra el runtime. `render.ts` importa de acá para que
// la composición del papel se pueda correr fuera de Deno (el verify local la
// resuelve contra el pdf-lib de npm con un hook de módulos) — misma versión,
// mismo código, un solo lugar donde cambiarla.
export { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
