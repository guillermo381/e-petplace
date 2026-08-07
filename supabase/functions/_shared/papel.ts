// ============================================================================
// papel.ts — LA PLANTILLA DE RENDER DE LOS PAPELES (S90-A · órdenes 1-3)
//
// Nace con el tercer papel, por la misma razón que el catálogo: el molde
// vivía duplicado en documento-carnet y documento-historia-clinica, y la
// tercera copia era la cuarta esperando divergir. Acá vive LA CARA — la
// espec de B (2026-08-06-s89b-ESPEC-cara-documentos.md) entera, con la
// pasada de diseño D-681 aplicada de una vez a todos los papeles:
//
//   · superficie = PAPEL FÍSICO #FFFFFF, cero tinta de fondo
//   · todo el contenido es TINTA #221E19; metadata en tinta al 65%
//   · el acento magentaDark #8E1F68 en UN solo lugar: el filete de cabecera
//   · ctaOro y tealDark NO rigen (el documento habla por el EMISOR)
//   · fondos JAMÁS portan información — separación por BORDE hairline
//   · el color jamás porta solo: estados y procedencias EN PALABRA
//   · sans para contenido, MONO para dato exacto (dosis, matrícula, folio)
//   · cuerpos A4/20mm: título 16/600 · rótulo 9/600 versalitas tinta .65 ·
//     cuerpo 10.5/15 · tablas 9.5 · metadata y pie 8.5
//   · DOS FECHAS siempre: la del HECHO y la de EMISIÓN
//
// MARCA DE AGUA (D-677, firma founder 7-ago): el ISOTIPO GRANDE AL CENTRO,
// EN TINTA CON OPACIDAD — no en color (el matiz muere impreso: verdeVital,
// teal y oro caen al MISMO gris) — y JAMÁS porta información: es cariño,
// no dato. DECISIÓN DE MOTOR, medida y declarada: el asset PNG @2x hosteado
// del correo es el isotipo EN GRADIENTE a 128×88 px — en color contradice
// la firma y a ese tamaño pixela sobre un A4. El MISMO isotipo se dibuja
// acá del path oficial del Manual de Marca (Iso_Estandar0.svg, la fuente de
// packages/ui/src/brand/Isotipo.tsx), en tinta, opacidad 6%.
//
// Fuentes: Helvetica/Courier estándar — la espec lo sanciona («el fallback
// imprime digno»); embeber DM Sans queda declarado como decisión abierta.
// ============================================================================

import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import type { PDFFont, PDFPage } from 'npm:pdf-lib@1.17.1';

export const TINTA = rgb(0.133, 0.118, 0.098); // #221E19 — 16.56 sobre blanco
export const TINTA_65 = rgb(0.435, 0.427, 0.416); // #6F6D6A compuesto — 5.16
export const MAGENTA = rgb(0.557, 0.122, 0.408); // #8E1F68 — SOLO el filete
export const HAIRLINE = rgb(0.82, 0.8, 0.77); // rgba(34,30,25,.25) sobre blanco
export const PAPEL = rgb(0.98, 0.976, 0.969); // texto sobre la banda de tinta

export const A4: [number, number] = [595.28, 841.89];
export const MX = 56.7; // 20 mm
const BANDA_ALTO = 34;

// El path oficial del isotipo (Manual de Marca · Iso_Estandar0.svg,
// viewBox 471.82×324 — la misma fuente que packages/ui/src/brand/Isotipo.tsx).
const ISO_VW = 471.82;
const ISO_VH = 324;
const ISOTIPO_PATH_D =
  'M213.06,302.96c-13.34,.28-26.62-.75-39.46-3.04-67.26-12-123.88-57.18-144.24-115.1-4.72-13.43-7.47-27.48-8.18-41.78-1.84-36.88,10.05-70.12,33.48-93.59,22.26-22.3,52.26-31.12,80.24-23.61,.12,.03,.23,.07,.35,.1-7.93,5.64-14.88,12.09-20.76,19.31-11.36,13.94-18.2,30.71-19.25,47.22-1.19,18.56,4.89,36.63,16.68,49.57,10.68,11.72,25.77,18.88,41.4,19.63,.89,.04,1.78,.06,2.67,.06,14.94,0,29.9-5.99,40.47-16.31,15.43-15.08,21.96-39.73,17.02-64.33h0c-4.19-20.88-15.65-39.78-32.33-54.01,9.17-2.74,19.04-4.7,29.53-5.8,1.15-.12,2.29-.22,3.42-.31,5.78-.45,10.1-5.5,9.65-11.28-.45-5.78-5.5-10.12-11.28-9.65-1.33,.1-2.67,.22-4,.36-17.94,1.88-34.42,5.98-49.09,12.2l-.12-.07-.16,.07c-6.02-2.96-12.3-5.32-18.74-7.05-35.33-9.49-72.92,1.37-100.55,29.06C12.14,62.33-1.92,101.21,.21,144.08c.81,16.32,3.96,32.36,9.35,47.7,22.83,64.95,85.77,115.51,160.36,128.82,12.69,2.26,25.75,3.41,38.89,3.41,1.56,0,3.12-.02,4.68-.05,5.8-.12,10.4-4.92,10.28-10.71s-4.96-10.38-10.71-10.28ZM158.39,36.29c18.08,11.62,30.53,29.19,34.5,48.93,3.55,17.7-.71,35.01-11.11,45.18-7.09,6.93-17.36,10.78-27.45,10.29-9.97-.48-20.02-5.26-26.88-12.79-7.86-8.63-12.06-21.37-11.25-34.09,.78-12.18,5.95-24.71,14.57-35.29,7.19-8.83,16.46-16.29,27.62-22.22Zm273.63-1.68C404.39,6.92,366.8-3.94,331.46,5.55c-6.44,1.73-12.72,4.1-18.74,7.05l-.16-.07-.12,.07c-14.67-6.21-31.15-10.31-49.07-12.19-1.35-.14-2.69-.26-4.02-.37-5.76-.47-10.83,3.87-11.28,9.65-.45,5.78,3.87,10.83,9.65,11.28,1.13,.09,2.27,.19,3.44,.31,10.48,1.1,20.34,3.06,29.51,5.8-16.68,14.22-28.14,33.13-32.33,54.01-4.93,24.6,1.59,49.25,17.03,64.33,10.56,10.32,25.52,16.31,40.46,16.31,.89,0,1.78-.02,2.66-.06,15.63-.75,30.72-7.91,41.4-19.63,11.79-12.94,17.87-31.01,16.68-49.57-1.05-16.52-7.89-33.29-19.24-47.22-5.88-7.23-12.83-13.68-20.76-19.32,.12-.03,.23-.07,.35-.1,27.98-7.51,57.98,1.31,80.24,23.61,23.43,23.47,35.32,56.71,33.48,93.59-.71,14.3-3.47,28.36-8.18,41.78-20.36,57.92-76.97,103.11-144.24,115.11-12.83,2.29-26.11,3.31-39.46,3.04-.07,0-.15,0-.22,0-5.7,0-10.38,4.56-10.49,10.28-.12,5.8,4.48,10.59,10.28,10.71,1.56,.03,3.12,.05,4.68,.05,13.14,0,26.21-1.14,38.89-3.41,74.59-13.31,137.53-63.87,160.36-128.82,5.39-15.33,8.53-31.38,9.35-47.7,2.14-42.88-11.93-81.75-39.59-109.48Zm-90.96,23.91c8.62,10.57,13.79,23.1,14.57,35.29,.81,12.72-3.39,25.46-11.25,34.09-6.86,7.53-16.91,12.31-26.88,12.79-10.09,.49-20.35-3.36-27.44-10.29-10.4-10.17-14.66-27.48-11.11-45.18,3.96-19.74,16.42-37.32,34.49-48.93,11.16,5.93,20.43,13.39,27.62,22.23Z';

export function fechaLarga(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

/** LA OPACIDAD DE LA MARCA DE AGUA — ✅ GATE IMPRESO PASADO (firma founder,
 *  7-ago: «se ve bien en papel»). FIRMADA: no se toca. Vive SOLO acá. */
export const OPACIDAD_MARCA_AGUA = 0.06;

/** EL AIRE ENTRE EL FILETE Y EL TÍTULO — corrección ① del gate impreso
 *  (letra founder: «debe haber espacio libre entre la línea magenta y la
 *  letra, se ve feo pegado»). Vive SOLO acá, como la opacidad: el próximo
 *  ajuste es una línea, no cuatro papeles. El certificado ya traía su aire
 *  (el render de D midió el ascendente y colocó su filete con ~12pt libres)
 *  y su cara no se toca. */
export const AIRE_BAJO_FILETE = 10;

/** LA MARCA DE AGUA (D-677, firma founder 7-ago): el isotipo GRANDE AL
 *  CENTRO, EN TINTA con opacidad — jamás en color (el matiz muere impreso) y
 *  jamás portando información. Se dibuja ANTES del contenido de la página.
 *  Exportada para que el certificado (render de D) la monte en su punto de
 *  montaje sin redibujarla — «cada uno la suya» es lo que §6 evita. */
// deno-lint-ignore no-explicit-any
export function marcaDeAgua(page: any): void {
  const ancho = 380;
  const escala = ancho / ISO_VW;
  page.drawSvgPath(ISOTIPO_PATH_D, {
    x: (A4[0] - ancho) / 2,
    y: (A4[1] + ISO_VH * escala) / 2, // drawSvgPath: y es el tope del viewBox
    scale: escala,
    color: TINTA,
    opacity: OPACIDAD_MARCA_AGUA,
  });
}

export type Fuentes = { sans: PDFFont; sansBold: PDFFont; mono: PDFFont };

/**
 * El papel de la casa: banda de emisor en tinta + marca de agua en TODA
 * página (una hoja suelta sigue diciendo quién la emitió y de quién es),
 * filete magenta único en la cabecera, pie con las dos fechas.
 */
export class Papel {
  pdf!: PDFDocument;
  f!: Fuentes;
  page!: PDFPage;
  y = 0;

  static async crear(): Promise<Papel> {
    const p = new Papel();
    p.pdf = await PDFDocument.create();
    p.f = {
      sans: await p.pdf.embedFont(StandardFonts.Helvetica),
      sansBold: await p.pdf.embedFont(StandardFonts.HelveticaBold),
      mono: await p.pdf.embedFont(StandardFonts.Courier),
    };
    p.nuevaPagina();
    return p;
  }

  /** Banda de emisor + marca de agua. Corre en TODA página. */
  nuevaPagina(): void {
    this.page = this.pdf.addPage(A4);
    // La marca de agua va PRIMERO: el contenido siempre queda encima.
    marcaDeAgua(this.page);
    this.page.drawRectangle({ x: 0, y: A4[1] - BANDA_ALTO, width: A4[0], height: BANDA_ALTO, color: TINTA });
    this.page.drawText('e-PetPlace', {
      x: MX, y: A4[1] - 22, size: 12, font: this.f.sansBold, color: PAPEL,
    });
    this.page.drawText('DOCUMENTO EMITIDO', {
      x: A4[0] - MX - 112, y: A4[1] - 21, size: 8, font: this.f.sans, color: PAPEL,
    });
    this.y = A4[1] - BANDA_ALTO - 30;
  }

  /** Si no queda aire, pasa de página. */
  asegura(min: number): void {
    if (this.y < min) this.nuevaPagina();
  }

  texto(s: string, x: number, size: number, opts: { font?: PDFFont; color?: ReturnType<typeof rgb> } = {}): void {
    this.page.drawText(s, { x, y: this.y, size, font: opts.font ?? this.f.sans, color: opts.color ?? TINTA });
  }

  hairline(yy?: number): void {
    this.page.drawLine({
      start: { x: MX, y: yy ?? this.y },
      end: { x: A4[0] - MX, y: yy ?? this.y },
      thickness: 0.7,
      color: HAIRLINE,
    });
  }

  /** El filete magenta (único color) + título 16/600 + notas de alcance 8.5.
   *  `folio`: el de ESTA emisión (orden 9), a la derecha del título, en MONO
   *  — la voz de máquina de la casa para el dato exacto. NULL honesto: una
   *  emisión anterior al folio no inventa uno. */
  cabecera(titulo: string, notas: string[], folio?: string | null): void {
    // El filete sube AIRE_BAJO_FILETE por encima de las mayúsculas del
    // título (cap de 16pt ≈ 12) — gate impreso ①: pegado se ve feo.
    this.page.drawLine({
      start: { x: MX, y: this.y + 12 + AIRE_BAJO_FILETE },
      end: { x: A4[0] - MX, y: this.y + 12 + AIRE_BAJO_FILETE },
      thickness: 2,
      color: MAGENTA,
    });
    this.texto(titulo, MX, 16, { font: this.f.sansBold });
    if (folio) {
      const w = this.f.mono.widthOfTextAtSize(folio, 9.5);
      this.texto(folio, A4[0] - MX - w, 9.5, { font: this.f.mono });
    }
    this.y -= 14;
    for (const n of notas) {
      this.texto(n, MX, 8.5, { color: TINTA_65 });
      this.y -= 11.5;
    }
    this.y -= 8;
  }

  /** Identidad del paciente bajo la cabecera: nombre 14/600 + línea 9.5. */
  identidad(nombre: string, sub: string): void {
    this.texto(nombre, MX, 14, { font: this.f.sansBold });
    this.y -= 14;
    this.texto(sub, MX, 9.5, { color: TINTA_65 });
    this.y -= 18;
    this.hairline();
    this.y -= 22;
  }

  /** Rótulo de sección: 9/600 en mayúsculas, tinta .65 (la espec). */
  rotulo(s: string): void {
    this.asegura(90);
    this.texto(s.toUpperCase(), MX, 9, { font: this.f.sansBold, color: TINTA_65 });
    this.y -= 13;
  }

  /** Prosa con corte por ancho — el papel no trunca lo que se dictó. Cuerpo 10.5/15. */
  parrafo(etiqueta: string, valor: string | null, size = 10.5): void {
    if (!valor) return;
    this.asegura(100);
    if (etiqueta) this.rotulo(etiqueta);
    const interlinea = size === 10.5 ? 15 : size + 4;
    const ancho = A4[0] - MX * 2;
    const palabras = valor.replace(/\s+/g, ' ').trim().split(' ');
    let linea = '';
    for (const p of palabras) {
      const prueba = linea ? `${linea} ${p}` : p;
      if (this.f.sans.widthOfTextAtSize(prueba, size) > ancho) {
        this.asegura(80);
        this.texto(linea, MX, size);
        this.y -= interlinea;
        linea = p;
      } else linea = prueba;
    }
    if (linea) {
      this.asegura(80);
      this.texto(linea, MX, size);
      this.y -= interlinea;
    }
    this.y -= 5;
  }

  /** El pie con las DOS fechas (y lo que el papel declare). 8.5, sobre
   *  hairline — y CORTA POR ANCHO: con el folio adentro (orden 9) una sola
   *  línea desborda el margen, y un pie que se sale del papel es un dato
   *  que la impresora amputa. */
  pie(s: string): void {
    this.asegura(96);
    const size = 8.5;
    const ancho = A4[0] - MX * 2;
    const lineas: string[] = [];
    let linea = '';
    for (const p of s.split(' ')) {
      const prueba = linea ? `${linea} ${p}` : p;
      if (this.f.sans.widthOfTextAtSize(prueba, size) > ancho) {
        lineas.push(linea);
        linea = p;
      } else linea = prueba;
    }
    if (linea) lineas.push(linea);
    this.y = 64 + (lineas.length - 1) * 11;
    this.hairline(this.y + 14);
    for (const l of lineas) {
      this.texto(l, MX, size, { color: TINTA_65 });
      this.y -= 11;
    }
  }

  bytes(): Promise<Uint8Array> {
    return this.pdf.save();
  }
}
