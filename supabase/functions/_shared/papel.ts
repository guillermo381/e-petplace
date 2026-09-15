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
import { MARCA_AGUA_LOGO_B64 } from './marca-agua-logo.ts';
import type { PDFFont, PDFPage } from 'npm:pdf-lib@1.17.1';

export const TINTA = rgb(0.133, 0.118, 0.098); // #221E19 — 16.56 sobre blanco
export const TINTA_65 = rgb(0.435, 0.427, 0.416); // #6F6D6A compuesto — 5.16
export const MAGENTA = rgb(0.557, 0.122, 0.408); // #8E1F68 — SOLO el filete
export const HAIRLINE = rgb(0.82, 0.8, 0.77); // rgba(34,30,25,.25) sobre blanco
export const PAPEL = rgb(0.98, 0.976, 0.969); // texto sobre la banda de tinta

export const A4: [number, number] = [595.28, 841.89];
export const MX = 56.7; // 20 mm
const BANDA_ALTO = 34;

/* ══════════════════════════════════════════════════════════════════════
   ☠️ **ACÁ VIVÍA EL ISOTIPO COMO PATH, Y MURIÓ EN EL RECORRIDO 5 (`D-1122`).**

   Vivieron dos: ~~el del Manual de Marca~~ (S90 → S116) y ~~el `isotipo-v5`~~
   (S116, que duró unas horas). **El founder rechazó el segundo en pantalla y
   después en papel**, y la razón es la misma las dos veces: *el isotipo solo
   no es la marca — la marca es la nariz CON «e-PetPlace» y su bajada.*

   🔴 **Y por qué no se reemplazó un path por otro, que es lo que se intentó
   primero:** el logo del ilustrador **no es un path**. Medido: **1.310
   `<path>`, 1.090 `<clipPath>`, 197 con `transform`, 133 colores de relleno y
   408.486 caracteres de `d`**. `drawSvgPath` toma UN `d` con UN relleno ⇒
   aplanado a un solo path **salen dos rectángulos**: *el dibujo vive en los
   clips, no en los paths.*

   ⇒ **la marca de agua pasa a ser una IMAGEN.** Lo que lo hace posible sin
   perder calidad: el SVG es un TRAZADO VECTORIAL —aunque nació de un bitmap,
   sus paths son matemáticos— así que **rasterizarlo da una imagen nítida, no
   una ampliación**. *El techo de 113 dpi que tenía el `@3x` no era del logo:
   era del PNG que alguien exportó a 600 px.*

   Su historia completa, con los números de las dos opciones: `D-1122`.
   ══════════════════════════════════════════════════════════════════════ */

/** EL ASSET DE LA MARCA DE AGUA — el logo completo, en GRIS.
 *
 *  **1.706 × 1.233 px ⇒ 323 dpi** al ancho de la marca (380 pt), por encima
 *  del piso de impresión de 300. **176.448 bytes.**
 *
 *  ⚠️ **GRIS y no color, y no es gusto: es la letra de esta misma cabecera** —
 *  *el matiz muere impreso*. A color al 6 % el logo deja un rosa pálido; en
 *  gris queda neutro y se lee igual: nariz, wordmark y bajada.
 *
 *  ⚠️ **Y 1.706 px no es «más grande por las dudas»: es que ACHICARLO ENGORDA.**
 *  Medido: bajarlo a los 1.583 px que piden los 300 dpi exactos lo lleva a
 *  **210.564 bytes** —el remuestreo mete ruido que comprime peor—. *El original
 *  es a la vez más nítido y más liviano que su versión recortada.* */
/* El asset viaja en base64 y NO como archivo: el binario en `_shared/` NO
   llega a la función desplegada — medido, da 500. El porqué, el peso y las dos
   opciones descartadas viven en la cabecera de `marca-agua-logo.ts`. */
const MARCA_AGUA_BYTES = Uint8Array.from(
  atob(MARCA_AGUA_LOGO_B64),
  (c) => c.charCodeAt(0),
);


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
/** Embebe el logo UNA VEZ por documento. **Se separa del dibujo porque
 *  embeber es asíncrono y dibujar no**: los dos consumidores llaman a
 *  `marcaDeAgua` desde funciones síncronas (`nuevaPagina` acá, `banda` en el
 *  certificado), y volverlas asíncronas rippleaba por todo el render.
 *
 *  ⚠️ **Una imagen de pdf-lib pertenece a SU documento** — por eso esto no se
 *  puede cachear entre documentos, y por eso se embebe una vez por papel y no
 *  una vez por página. */
// deno-lint-ignore no-explicit-any
export async function embebeMarcaDeAgua(pdf: any): Promise<any> {
  return await pdf.embedPng(MARCA_AGUA_BYTES);
}

/** LA MARCA DE AGUA: el logo completo al centro, en gris, al 6 %.
 *  Se dibuja ANTES del contenido de la página. */
// deno-lint-ignore no-explicit-any
export function marcaDeAgua(page: any, marca: any): void {
  const ancho = 380;
  const alto = ancho * marca.height / marca.width;
  page.drawImage(marca, {
    x: (A4[0] - ancho) / 2,
    y: (A4[1] - alto) / 2,
    width: ancho,
    height: alto,
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

  /** El logo embebido, UNA vez por documento (ver `embebeMarcaDeAgua`). */
  // deno-lint-ignore no-explicit-any
  marca!: any;

  static async crear(): Promise<Papel> {
    const p = new Papel();
    p.pdf = await PDFDocument.create();
    /* Va ANTES de la primera página: `nuevaPagina()` ya la dibuja. */
    p.marca = await embebeMarcaDeAgua(p.pdf);
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
    marcaDeAgua(this.page, this.marca);
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
