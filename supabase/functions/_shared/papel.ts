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
// no dato. DECISIÓN DE MOTOR, medida y declarada: un PNG no sirve acá — a
// 380 pt sobre A4 el @3x del correo daría 68 dpi. Se dibuja de un PATH.
//
// 🔴 S116 · D-1107 — EL ISOTIPO ES EL v5. Lo viejo, tachado y no borrado:
// ~~el path del Manual de Marca (Iso_Estandar0.svg, viewBox 471,82×324, la
// misma fuente que packages/ui/src/brand/Isotipo.tsx)~~ ⇒ **el path v5 de
// packages/ui/src/brand/isotipo-v5-path.ts**. *Y lo que la medición de B
// dejó dicho al entregarlo importa más que el cambio: los dos paths viejos
// eran IDÉNTICOS BYTE A BYTE — el papel no había copiado mal, había copiado
// bien de una fuente que ya estaba vencida.* ⇒ por eso la copia de acá
// **tiene gate**: `pnpm verify:isotipo-path` compara este `d` contra el de
// `packages/ui`, que es la fuente única. *Una copia sin gate vuelve a
// divergir; la única pregunta es cuándo.*
//
// Fuentes: Helvetica/Courier estándar — la espec lo sanciona («el fallback
// imprime digno»); embeber DM Sans queda declarado como decisión abierta.
// ============================================================================

import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { QUIET, matrizQr } from './qr.ts';
import type { PDFFont, PDFPage } from 'npm:pdf-lib@1.17.1';

export const TINTA = rgb(0.133, 0.118, 0.098); // #221E19 — 16.56 sobre blanco
export const TINTA_65 = rgb(0.435, 0.427, 0.416); // #6F6D6A compuesto — 5.16
export const MAGENTA = rgb(0.557, 0.122, 0.408); // #8E1F68 — SOLO el filete
export const HAIRLINE = rgb(0.82, 0.8, 0.77); // rgba(34,30,25,.25) sobre blanco
export const PAPEL = rgb(0.98, 0.976, 0.969); // texto sobre la banda de tinta

export const A4: [number, number] = [595.28, 841.89];
export const MX = 56.7; // 20 mm
const BANDA_ALTO = 34;

/* EL ISOTIPO v5 COMO PATH — fuente única: packages/ui/src/brand/isotipo-v5-path.ts
   (S116-B, `D-1107`). Es UNA silueta de UN color, que es exactamente lo que
   `drawSvgPath` sabe dibujar: toma un `d` y un relleno — no resuelve clips, no
   compone capas, no tiene z-order. *El SVG del ilustrador trae 268 paths y 229
   clipPaths y NO le sirve: aplanado a un solo `d` salen rectángulos.*

   ⚠️ EL LIENZO DEL ARCHIVO ES CUADRADO (1254×1254) Y EL DIBUJO OCUPA UNA BANDA
   ADENTRO. Por eso el encuadre usa la CAJA MEDIDA del contenido y no el
   viewBox: con el cuadrado la marca queda flotando con un aire arriba y abajo
   que nadie puede explicar después. *Un viewBox no dice dónde está el dibujo:
   dice cuál es el papel.*

   ⚠️ Y el aspecto CAMBIÓ: 627×372 = 1,685 contra el 471,82×324 = 1,456 del
   viejo. Quien reemplace números sueltos acá sin mirar la página va a dejar la
   marca estirada — y a 6 % de opacidad eso no se ve hasta que se imprime. */
const ISO_CAJA = { x: 339, y: 393, ancho: 627, alto: 372 };
const ISOTIPO_PATH_D =
  'M 384.941406 645.476562 C 402.046875 653.03125 426.664062 660.0625 446.941406 660.0625 L 468.824219 660.0625 C 499.714844 660.0625 540.070312 635.195312 526.328125 599.835938 C 512.589844 564.46875 466.855469 570.96875 449.675781 598.078125 C 448.9375 599.242188 448.519531 600.519531 447.851562 601.722656 C 446.6875 601.523438 446.558594 599.160156 447.851562 598.988281 C 450.535156 567.457031 487.175781 546.382812 517.347656 552.300781 C 547.519531 558.214844 570.613281 588.386719 566.382812 620.863281 C 566.035156 623.5 565.351562 625.09375 564.558594 627.246094 C 556.957031 661.566406 517.449219 681.027344 485.234375 681.027344 C 480.3125 681.5 474.632812 681.691406 469.734375 681.027344 C 468.550781 681.027344 467.265625 681.171875 466.089844 681.027344 C 470.363281 684.570312 471.550781 694.117188 476.191406 698.273438 C 480.832031 702.429688 482.664062 709.164062 487.285156 713.613281 C 491.910156 718.070312 495.191406 723.757812 500.050781 728.199219 C 504.902344 732.636719 508.394531 737.066406 513.726562 740.960938 C 519.070312 744.84375 523.777344 748.953125 529.703125 752.335938 C 535.628906 755.71875 541.28125 757.949219 547.949219 760.53125 C 554.601562 763.117188 563.320312 765.070312 570.941406 764.886719 C 578.566406 764.703125 587.628906 764.640625 594.027344 761.53125 C 600.429688 758.425781 607.46875 757.292969 612.65625 752.808594 C 617.851562 748.324219 622.136719 745.296875 626.558594 740.277344 C 642.023438 713.121094 650.085938 682.53125 652.089844 650.945312 C 656.585938 684.964844 664.1875 720.113281 683.089844 749.390625 C 707.855469 772.160156 752.867188 767.523438 779.054688 748.707031 C 805.25 729.902344 823.320312 707.085938 839.003906 680.113281 C 802.121094 685.265625 762.933594 674.246094 743.90625 641.191406 C 724.867188 608.148438 742.199219 567.003906 777.066406 554.386719 C 811.941406 541.78125 853.976562 563.046875 859.0625 600.8125 C 848.175781 579.207031 821.917969 570.027344 799.597656 578.734375 C 777.269531 587.4375 766.691406 616.515625 782.402344 636.433594 C 798.109375 656.351562 821.851562 660.871094 846.296875 660.972656 C 870.742188 661.074219 896.800781 652.46875 918.328125 645.476562 C 945.1875 624.273438 964.828125 587.96875 964.828125 554.324219 L 964.828125 541.5625 C 964.828125 452.769531 868.863281 393.894531 788.855469 393.894531 L 770.621094 393.894531 C 767.328125 393.894531 763.863281 393.582031 760.589844 393.894531 C 741.808594 395.652344 720.648438 400.949219 702.859375 404.539062 C 685.058594 408.128906 669.488281 422.40625 651.242188 420.261719 C 633.007812 418.113281 619.257812 405.789062 600.730469 402.398438 C 582.203125 399.007812 561.613281 393.894531 541.765625 393.894531 L 519.882812 393.894531 C 457.089844 393.894531 399.128906 423.089844 362.375 475.246094 C 325.628906 527.414062 335.429688 603.179688 384.941406 645.476562 Z M 771.53125 417.59375 C 773.585938 417.253906 776.191406 416.679688 778.828125 416.679688 C 794.964844 416.679688 815.351562 418.839844 829.949219 422.085938 C 844.558594 425.324219 859.0625 431.949219 870.988281 438.484375 C 882.914062 445.011719 893.910156 455.457031 902.601562 463.398438 C 911.289062 471.335938 930.109375 490.714844 913.769531 496.894531 C 911.289062 497.835938 909.820312 497.816406 907.386719 496.894531 C 895.453125 492.382812 891.101562 476.960938 879.351562 470.234375 C 867.597656 463.507812 858.351562 454.042969 844.402344 449.570312 C 830.460938 445.085938 815.453125 439.195312 799.597656 438.757812 C 783.742188 438.328125 762.222656 438.421875 746.914062 441.292969 C 731.597656 444.164062 717.675781 448.628906 703.132812 453.125 C 688.578125 457.617188 675.859375 465.3125 660.296875 465.902344 C 656.121094 466.496094 651.6875 466.707031 647.53125 465.902344 C 635.558594 464.957031 625.203125 460.371094 614.085938 456.496094 C 602.980469 452.621094 592.359375 449.203125 580.769531 446.050781 C 569.183594 442.90625 556.820312 440.972656 544.492188 439.476562 C 532.171875 437.984375 514.714844 438.375 502.558594 439.46875 C 490.40625 440.5625 477.714844 444.117188 466.980469 447.65625 C 456.242188 451.183594 447.359375 456.679688 438.507812 462.03125 C 429.664062 467.390625 420.746094 474.382812 413.890625 481.171875 C 407.042969 487.964844 397.90625 503.953125 388.359375 494.390625 C 378.8125 484.816406 393.445312 475.191406 399.300781 467.5 C 405.152344 459.816406 414.765625 453.277344 422.960938 447.398438 C 431.148438 441.511719 440.046875 434.9375 450.316406 430.984375 C 460.570312 427.035156 471.429688 423.078125 483.109375 420.9375 C 494.800781 418.804688 509.925781 416.507812 522.617188 416.679688 C 535.308594 416.855469 550.617188 418.140625 562.746094 420.316406 C 574.863281 422.503906 585.988281 424.792969 597.402344 428.511719 C 608.828125 432.222656 618.847656 434.949219 629.914062 439.761719 C 640.976562 444.574219 654.988281 446.398438 666.878906 443.316406 C 678.777344 440.234375 687.414062 436.425781 698.792969 432.378906 C 710.179688 428.332031 721.285156 425.714844 733.257812 423.078125 C 745.238281 420.453125 758.933594 418.277344 771.53125 417.59375 Z';

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
  const escala = ancho / ISO_CAJA.ancho;
  const alto = ISO_CAJA.alto * escala;
  /* El `d` trae sus coordenadas en el lienzo cuadrado, así que centrar exige
     descontar dónde arranca el dibujo adentro de ese lienzo — si no, se centra
     el PAPEL del archivo y el dibujo queda corrido. */
  page.drawSvgPath(ISOTIPO_PATH_D, {
    x: (A4[0] - ancho) / 2 - ISO_CAJA.x * escala,
    y: (A4[1] + alto) / 2 + ISO_CAJA.y * escala, // drawSvgPath: y es el tope
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

  /**
   * EL QR DEL PASAPORTE — S113-A · 1.3 · A5.
   *
   * 🔴 **VECTORIAL, no una imagen.** Un PNG de QR embebido se imprime borroso
   * si la impresora escala, y `pdf-lib` tendría que parsearlo; dibujado con
   * rectángulos sale NÍTIDO a cualquier tamaño y no depende de ningún
   * decodificador. *Un QR mal impreso no se lee a medias: no se lee.*
   *
   * ⚠️ **NO verifica el documento y por eso su leyenda no lo insinúa.** El
   * folio sigue sin mecanismo público de verificación; este QR lleva a la
   * página de la mascota. *Poner un QR al lado de un folio sin decir qué hace
   * cada uno invita a leer el QR como un sello de autenticidad — y no lo es.*
   *
   * Va abajo a la derecha, sobre el pie: no interrumpe la lectura y queda a
   * mano si el papel se dobla. Se llama ANTES de `pie()`.
   */
  qr(texto: string, leyenda: string[], lado = 92): void {
    // Alto del bloque + el pie que viene después. Si no entra, página nueva.
    this.asegura(lado + 120);

    const m = matrizQr(texto);
    const n = m.length;
    const total = n + QUIET * 2;
    const mod = lado / total;          // lado de un módulo, en puntos
    const x0 = A4[0] - MX - lado;
    const y0 = 128;                    // apoyado sobre la zona del pie

    // Fondo blanco explícito bajo la zona tranquila: la marca de agua del
    // isotipo cruza la página, y un QR sobre una trama gris pierde contraste.
    this.page.drawRectangle({
      x: x0, y: y0, width: lado, height: lado, color: rgb(1, 1, 1),
    });

    /* Por RUNS horizontales: un QR de 45×45 tiene ~1.000 módulos oscuros, y
       un rectángulo por módulo engorda el PDF sin cambiar el dibujo. Agrupar
       los contiguos deja ~250. *El resultado es idéntico; el archivo, un
       cuarto.* */
    for (let f = 0; f < n; f++) {
      let c = 0;
      while (c < n) {
        if (!m[f][c]) { c++; continue; }
        let fin = c;
        while (fin + 1 < n && m[f][fin + 1]) fin++;
        this.page.drawRectangle({
          x: x0 + (c + QUIET) * mod,
          // el PDF cuenta el eje Y desde abajo; la matriz, desde arriba
          y: y0 + lado - (f + QUIET + 1) * mod,
          width: (fin - c + 1) * mod,
          height: mod,
          color: TINTA,
        });
        c = fin + 1;
      }
    }

    // La leyenda, a la izquierda del código. La primera línea en tinta plena
    // (es la instrucción); las de abajo en tinta al 65 % (son la aclaración).
    let yy = y0 + lado - 10;
    let primera = true;
    for (const l of leyenda) {
      this.y = yy;
      this.texto(l, MX, 9.5, { color: primera ? TINTA : TINTA_65 });
      primera = false;
      yy -= 13;
    }
    this.y = y0 - 6;
  }

  bytes(): Promise<Uint8Array> {
    return this.pdf.save();
  }
}
