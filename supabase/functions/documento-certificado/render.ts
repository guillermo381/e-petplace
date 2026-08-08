// ============================================================================
// LA CARA DEL CERTIFICADO — composición pura (S90-D)
//
// Separada del `index.ts` A PROPÓSITO, y es la única desviación del molde de
// los dos papeles vivos: la composición se puede correr contra datos
// FICTICIOS sin token, sin DB y sin desplegar nada — que es lo que permite
// mirar el papel HOY, antes de que la migración esté aplicada.
// (`scripts/verify-certificado-render.mjs` la ejecuta y escupe el PDF.)
//
// La espec que obedece: `2026-08-06-s89b-ESPEC-cara-documentos.md`.
//  · superficie = PAPEL FÍSICO #FFFFFF, cero tinta de fondo
//  · todo el contenido en tinta #221E19; magentaDark en UN solo lugar: el
//    filete de cabecera
//  · los fondos JAMÁS portan información — toda separación es por hairline
//  · el color JAMÁS porta solo la información — el B/N es destino real
//  · dos fechas, nunca una
//  · el emisor preside la cabecera, completo
// ============================================================================

import { PDFDocument, StandardFonts, rgb } from './deps.ts';
// D-677 (S90-A orden 9 ③): la marca de agua vive en UN solo lugar — la
// plantilla compartida. Montarla acá es exactamente lo que el punto de
// montaje de abajo pedía; dibujarla a ojo sería el «cada uno la suya» que
// §6 del método evita. (El verify local la resuelve con el mismo hook.)
import { marcaDeAgua, AIRE_BAJO_FILETE } from '../_shared/papel.ts';

const TINTA = rgb(0.133, 0.118, 0.098); // #221E19 — 16.56:1 sobre blanco
const TINTA_SUAVE = rgb(0.435, 0.427, 0.416); // #6F6D6A — 5.16:1, AA
const MAGENTA = rgb(0.557, 0.122, 0.408); // #8E1F68 — el único acento
const HAIRLINE = rgb(0.82, 0.8, 0.77);
const PAPEL = rgb(1, 1, 1); // el papel es BLANCO: la impresora no pinta fondos

export type Alcance = 'viaje' | 'hospedaje' | 'guarderia' | 'constancia';

export interface DatosCertificado {
  alcance: Alcance;
  declaracion: string;
  fechaExamen: string; // YYYY-MM-DD
  emitidoEn: string; // ISO
  emisorNombre: string;
  emisorMatricula: string;
  emisorPais: string | null;
  negocioNombre: string;
  negocioDireccion: string | null;
  negocioTelefono: string | null;
  mascotaNombre: string;
  mascotaEspecie: string | null;
  mascotaRaza: string | null;
  mascotaSexo: string | null;
  mascotaNacimiento: string | null; // YYYY-MM-DD
  mascotaMicrochip: string | null;
  estadoVidaAlEmitir: 'activa' | 'perdida' | 'fallecida';
  /** El folio de ESTA emisión (orden 9, fase 1) — en MONO en el papel.
   *  NULL honesto para emisiones anteriores al folio. */
  folio?: string | null;
}

/** El alcance se IMPRIME: un certificado sin alcance promete todo. */
const VOZ_ALCANCE: Record<Alcance, string> = {
  viaje: 'constancia de examen clínico con fines de viaje',
  hospedaje: 'constancia de examen clínico con fines de hospedaje',
  guarderia: 'constancia de examen clínico con fines de guardería',
  constancia: 'constancia de atención clínica',
};

/**
 * EL LÍMITE, y va en la CABECERA — no en el pie.
 * Un papel que se deja confundir con el oficial le arruina un viaje a una
 * familia en un mostrador de frontera, y en un mostrador se lee lo de arriba.
 */
const LIMITE = [
  'Este documento NO es un certificado oficial de movilización.',
  'El certificado sanitario para el traslado interprovincial o internacional lo emite la',
  'autoridad sanitaria competente (en Ecuador, Agrocalidad). Este papel es una constancia',
  'de examen clínico emitida por el profesional que lo firma, bajo su responsabilidad.',
];

/**
 * El estado del paciente se dice en voz clínica neutra y SOLO si el documento
 * lo requiere. Cero celebración, cero adorno: la cara no cambia de estructura
 * ni gana tema memorial — el papel ya es sobrio por diseño, y un «modo
 * memorial» del documento sería teatro.
 * Una constancia de defunción es su propio documento y pide su propia letra:
 * NO se diseña acá.
 */
const VOZ_ESTADO: Record<string, string | null> = {
  activa: null,
  fallecida: 'Registro correspondiente a un paciente fallecido a la fecha de emisión.',
  perdida: 'Registro correspondiente a un paciente reportado como perdido a la fecha de emisión.',
};

function fecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

export async function componerCertificado(d: DatosCertificado): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const A4: [number, number] = [595.28, 841.89];
  const MX = 56; // ≈20 mm
  const BANDA = 34;
  const ANCHO = A4[0] - MX * 2;

  let page = pdf.addPage(A4);
  let y = 0;

  const banda = () => {
    // La banda de emisor en TINTA, en toda página: sobrevive al B/N por
    // construcción (es luminancia, no matiz).
    page.drawRectangle({ x: 0, y: A4[1] - BANDA, width: A4[0], height: BANDA, color: TINTA });
    page.drawText('e-PetPlace', { x: MX, y: A4[1] - 22, size: 12, font: sansBold, color: PAPEL });
    page.drawText('DOCUMENTO EMITIDO', {
      x: A4[0] - MX - 118,
      y: A4[1] - 21,
      size: 8,
      font: sans,
      color: PAPEL,
    });
    // ── LA MARCA DE AGUA (D-677, montada S90-A orden 9 ③) ─────────────────
    // Una sola llamada, después de la banda y antes de todo contenido, para
    // que quede DEBAJO del texto. El dibujo y su opacidad viven en
    // `_shared/papel.ts` — un solo lugar para ajustarla tras el gate impreso.
    marcaDeAgua(page);
  };
  const nuevaPagina = () => {
    page = pdf.addPage(A4);
    banda();
    y = A4[1] - BANDA - 30;
  };
  const texto = (
    s: string,
    x: number,
    size: number,
    o: { font?: typeof sans; color?: typeof TINTA } = {},
  ) => page.drawText(s, { x, y, size, font: o.font ?? sans, color: o.color ?? TINTA });
  const hairline = (yy: number, x0 = MX, x1 = A4[0] - MX) =>
    page.drawLine({ start: { x: x0, y: yy }, end: { x: x1, y: yy }, thickness: 0.7, color: HAIRLINE });
  const rotulo = (s: string) => {
    if (y < 90) nuevaPagina();
    texto(s, MX, 8, { color: TINTA_SUAVE });
    y -= 12;
  };
  /** Prosa con corte por ancho — el papel no trunca lo que el profesional declaró. */
  const parrafo = (valor: string, size = 10.5, font = sans, x = MX, ancho = ANCHO) => {
    for (const cruda of valor.replace(/\r/g, '').split('\n')) {
      const palabras = cruda.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
      if (palabras.length === 0) {
        y -= size * 0.6;
        continue;
      }
      let linea = '';
      for (const p of palabras) {
        const prueba = linea ? `${linea} ${p}` : p;
        if (font.widthOfTextAtSize(prueba, size) > ancho) {
          if (y < 80) nuevaPagina();
          texto(linea, x, size, { font });
          y -= size + 4;
          linea = p;
        } else linea = prueba;
      }
      if (linea) {
        if (y < 80) nuevaPagina();
        texto(linea, x, size, { font });
        y -= size + 4;
      }
    }
  };
  /** Fila etiqueta/valor. El valor exacto (matrícula, microchip) va en MONO. */
  const dato = (etiqueta: string, valor: string | null, opts: { mono?: boolean } = {}) => {
    if (!valor) return; // null honesto: la fila NO existe, jamás un «—» decorativo
    if (y < 80) nuevaPagina();
    texto(etiqueta, MX, 8, { color: TINTA_SUAVE });
    texto(valor, MX + 132, 10, { font: opts.mono ? mono : sans });
    y -= 15;
  };

  banda();
  y = A4[1] - BANDA - 42;

  // ── EL FILETE: el ÚNICO magenta del papel ───────────────────────────────
  // Va ARRIBA del título con aire: a +16 la línea corta las mayúsculas de un
  // título de 22pt (medido — el ascendente de Helvetica a 22 llega a ~16).
  //
  // S91: el 28 era un NÚMERO MÁGICO desacoplado de la letra firmada. Se
  // descompone en sus dos partes SIN mover un píxel: 18 es la altura de
  // mayúscula del título de 22pt (este papel lo tiene más grande que los
  // otros cuatro, por eso su base es 18 y no 12), y el aire viene de la
  // CONSTANTE FIRMADA compartida. 18 + 10 = 28: el resultado impreso que el
  // founder aprobó no cambia, pero el día que la letra del aire se enmiende,
  // este filete se entera. *Un valor que coincide con la ley por casualidad
  // deja de coincidir en la primera enmienda.*
  page.drawLine({
    start: { x: MX, y: y + 18 + AIRE_BAJO_FILETE },
    end: { x: A4[0] - MX, y: y + 18 + AIRE_BAJO_FILETE },
    thickness: 2,
    color: MAGENTA,
  });
  texto('Certificado de salud', MX, 22, { font: sansBold });
  if (d.folio) {
    const wf = mono.widthOfTextAtSize(d.folio, 9.5);
    texto(d.folio, A4[0] - MX - wf, 9.5, { font: mono });
  }
  y -= 20;
  texto(`Alcance: ${VOZ_ALCANCE[d.alcance]}.`, MX, 10, { color: TINTA_SUAVE });
  y -= 22;

  // ── EL LÍMITE — caja por BORDE, jamás por fill ──────────────────────────
  const altoLimite = LIMITE.length * 11 + 14;
  page.drawRectangle({
    x: MX,
    y: y - altoLimite + 12,
    width: ANCHO,
    height: altoLimite,
    borderColor: HAIRLINE,
    borderWidth: 0.7,
  });
  y -= 4;
  texto(LIMITE[0], MX + 10, 9, { font: sansBold });
  y -= 11;
  for (const l of LIMITE.slice(1)) {
    texto(l, MX + 10, 8.5, { color: TINTA_SUAVE });
    y -= 11;
  }
  y -= 20;

  // ── EL EMISOR PRESIDE — negocio Y profesional ───────────────────────────
  rotulo('EMITIDO POR');
  texto(d.emisorNombre, MX, 13, { font: sansBold });
  y -= 15;
  texto(
    `Matrícula ${d.emisorMatricula}${d.emisorPais ? ` · ${d.emisorPais}` : ''}`,
    MX,
    10,
    { font: mono },
  );
  y -= 16;
  texto(d.negocioNombre, MX, 10.5);
  y -= 13;
  const señas = [d.negocioDireccion, d.negocioTelefono].filter(Boolean).join(' · ');
  if (señas) {
    texto(señas, MX, 9, { color: TINTA_SUAVE });
    y -= 13;
  }
  y -= 6;
  hairline(y);
  y -= 20;

  // ── EL PACIENTE ─────────────────────────────────────────────────────────
  rotulo('PACIENTE');
  texto(d.mascotaNombre, MX, 15, { font: sansBold });
  y -= 18;
  dato('Especie', d.mascotaEspecie);
  dato('Raza', d.mascotaRaza);
  dato('Sexo', d.mascotaSexo);
  dato('Nacimiento', d.mascotaNacimiento ? fecha(d.mascotaNacimiento) : null);
  dato('Microchip', d.mascotaMicrochip, { mono: true });
  y -= 6;
  hairline(y);
  y -= 20;

  // ── LAS DOS FECHAS, NUNCA UNA ───────────────────────────────────────────
  rotulo('FECHAS');
  dato('Examen clínico', fecha(d.fechaExamen), { mono: true });
  dato('Emisión del documento', fecha(d.emitidoEn), { mono: true });
  y -= 6;
  hairline(y);
  y -= 20;

  // ── LA DECLARACIÓN — el corazón del papel ───────────────────────────────
  // Son las PALABRAS DEL PROFESIONAL. El motor no las deriva, no las
  // completa y no las resume: se imprimen enteras.
  rotulo('DECLARACIÓN DEL PROFESIONAL');
  parrafo(d.declaracion, 10.5);
  y -= 8;

  const vozEstado = VOZ_ESTADO[d.estadoVidaAlEmitir];
  if (vozEstado) {
    // Voz clínica neutra, en la misma tinta que todo lo demás — el estado
    // no se pinta de otro color: el color jamás porta solo la información.
    texto(vozEstado, MX, 9, { color: TINTA_SUAVE });
    y -= 16;
  }

  y -= 4;
  hairline(y);
  y -= 20;

  // ── LA FIRMA, tal como v1 la define ─────────────────────────────────────
  // «Firmar» en v1 = nombre + matrícula impresos con la procedencia
  // declarada. Sin firma criptográfica y SIN imagen de firma: una firma
  // escaneada dentro de un PDF descargable es peor que ninguna — se recorta.
  if (y < 120) nuevaPagina();
  texto(
    `Declarado por ${d.emisorNombre}, matrícula ${d.emisorMatricula}, en ${d.negocioNombre}.`,
    MX,
    9.5,
  );
  y -= 14;
  texto(
    'La responsabilidad profesional del contenido es de quien lo declara. e-PetPlace transcribe y emite.',
    MX,
    8.5,
    { color: TINTA_SUAVE },
  );

  // ── EL PIE — el folio identifica la emisión; la verificación pública aún no existe ──
  y = 62;
  hairline(y + 16);
  texto(
    `El folio${d.folio ? ` ${d.folio}` : ''} identifica esta emisión. Todavía no existe un mecanismo público para comprobar su`,
    MX,
    8,
    { color: TINTA_SUAVE },
  );
  y -= 10;
  texto(
    'autenticidad: quien necesite confirmarlo, que contacte al profesional o al negocio emisor.',
    MX,
    8,
    { color: TINTA_SUAVE },
  );
  y -= 12;
  texto(
    `e-PetPlace (hola@epetplace.com) · emisión ${fecha(d.emitidoEn)} · examen ${fecha(d.fechaExamen)}`,
    MX,
    8,
    { color: TINTA_SUAVE },
  );

  return await pdf.save();
}
