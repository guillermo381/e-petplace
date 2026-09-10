/**
 * S115-E · INSTRUMENTO 25 — NUESTRO CANÓNICO CONTRA UN XML AUTORIZADO REAL.
 *
 * 🔴 EL MÁS VALIOSO DE LA SERIE, y la razón es de método: hasta acá todo lo fiscal se
 * midió contra la ficha INTERPRETADA de una factura —lo que alguien leyó del RIDE—.
 * Esto se mide contra **el XML que el SRI autorizó**: `<autorizacion>` con estado,
 * número, fecha, y el comprobante escapado adentro. *Es la única fuente que no pasó
 * por la lectura de nadie.*
 *
 * QUÉ CRUZA: que para cada campo del XML real exista su equivalente en nuestro
 * `DocumentoCanonico`, con el MISMO nombre del SRI y el MISMO formato.
 *
 * 🔴 LO QUE NO PUEDE ESPERAR AL PRIMER RECHAZO: `codigoPorcentaje`. Si nuestro código
 * para 0 % no es el del catálogo del SRI, el XML se arma bien, se firma bien, y el SRI
 * lo devuelve. *Un mapa de códigos equivocado no falla acá: falla en el organismo.*
 *
 * ROJO: cambiar el nombre de un campo del canónico y ver que el cruce lo caza.
 */
import { correr, rojo, noConcluyente } from './_lib-e.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const DIR_XML = `${RAIZ}/docs/relevamientos/xml-sri`;
/* 🔴 EL XML LO PRODUCEN **DOS** PIEZAS, y buscar en una sola da falsos positivos.
   El canónico es el documento de NEGOCIO; la NUMERACIÓN (secuencial, clave, tipo de
   emisión) la asigna `fiscal-emitir` al emitir — y tiene que ser así: el secuencial se
   toma atómicamente en ese momento, no antes.
   Mi primera corrida marcó `secuencial`, `claveAcceso` y `tipoEmision` como faltantes
   **buscando sólo en canonico.ts**. Los tres existen, en la otra pieza. *Medí una capa
   y concluí sobre el sistema — L-534, otra vez.* */
const FUENTES = [
  ['canónico',      `${RAIZ}/supabase/functions/_shared/facturacion/canonico.ts`],
  ['fiscal-emitir', `${RAIZ}/supabase/functions/fiscal-emitir/index.ts`],
  ['clave_acceso',  `${RAIZ}/supabase/functions/_shared/facturacion/clave_acceso.ts`],
];
const CANONICO = FUENTES[0][1];

const desescapar = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Cada campo del SRI con el nombre que DEBE tener en nuestro canónico. */
const MAPA = [
  // infoTributaria
  ['ambiente',                    'ambiente'],
  ['tipoEmision',                 'tipo_emision|tipoEmision'],
  ['razonSocial',                 'razon_social'],
  ['nombreComercial',             'nombre_comercial'],
  ['ruc',                         'ruc'],
  ['claveAcceso',                 'clave_acceso|claveAcceso'],
  ['codDoc',                      'tipo|cod_doc|codDoc'],
  ['estab',                       'establecimiento'],
  ['ptoEmi',                      'punto_emision'],
  ['secuencial',                  'secuencial'],
  ['dirMatriz',                   'direccion_matriz'],
  // infoFactura
  ['fechaEmision',                'fecha_emision_sri'],
  ['dirEstablecimiento',          'direccion_establecimiento|dirEstablecimiento'],
  ['obligadoContabilidad',        'obligado_contabilidad'],
  ['tipoIdentificacionComprador', 'codigo_sri|tipo_identificacion'],
  ['razonSocialComprador',        'razon_social'],
  ['identificacionComprador',     'identificacion'],
  ['direccionComprador',          'direccion'],
  ['totalSinImpuestos',           'base|subtotales_por_tarifa'],
  ['totalDescuento',              'descuento_total'],
  ['codigoPorcentaje',            'codigo_porcentaje_sri'],
  ['baseImponible',               'base'],
  ['propina',                     'propina'],
  ['importeTotal',                'total'],
  ['moneda',                      'moneda'],
  ['formaPago',                   'forma_pago|formaPago'],
  // detalle
  ['codigoPrincipal',             'codigo_principal|codigoPrincipal|origen_id'],
  ['descripcion',                 'descripcion'],
  ['cantidad',                    'cantidad'],
  ['precioUnitario',              'precio_unitario'],
  ['descuento',                   'descuento'],
  ['precioTotalSinImpuesto',      'base'],
  ['tarifa',                      'tarifa_pct'],
];

await correr('i25 · nuestro canónico contra un XML autorizado real', async (r) => {
  if (!existsSync(DIR_XML)) noConcluyente(`no existe ${DIR_XML}`);
  const xmls = readdirSync(DIR_XML).filter((f) => f.endsWith('.xml'));
  if (!xmls.length) noConcluyente(`no hay ningún XML en ${DIR_XML}`);
  if (!existsSync(CANONICO)) noConcluyente('no existe canonico.ts');

  const canon = readFileSync(CANONICO, 'utf8');
  r.dato('canónico', `${canon.split('\n').length} líneas · versión ${(canon.match(/CANONICO_VERSION\s*=\s*(\d+)/) ?? [])[1] ?? '?'}`);
  // El corpus donde se busca son las TRES piezas que juntas producen el XML.
  const corpus = FUENTES.map(([n, f]) => ({ n, t: existsSync(f) ? readFileSync(f, 'utf8') : '' }));
  for (const c of corpus) if (!c.t) noConcluyente(`falta la pieza «${c.n}»: el censo miraría de menos.`);
  r.dato('piezas censadas', corpus.map((c) => c.n).join(' + '));

  for (const archivo of xmls) {
    const bruto = readFileSync(`${DIR_XML}/${archivo}`, 'utf8');
    r.di(`\n   ── ${archivo}`);

    // ── (a) EL SOBRE DE AUTORIZACIÓN ───────────────────────────────────────
    const campo = (t, s = bruto) => (new RegExp(`<${t}>([^<]*)</${t}>`).exec(s) ?? [])[1];
    r.dato('estado', campo('estado') ?? '(no está)');
    r.dato('fechaAutorizacion', campo('fechaAutorizacion') ?? '(no está)');
    if (campo('estado') !== 'AUTORIZADO')
      noConcluyente(`el XML no está AUTORIZADO (${campo('estado')}): no sirve como vara.`);

    // 🔴 El número de autorización ES la clave de acceso en el esquema offline.
    const clave = campo('claveAcceso', desescapar(bruto));
    r.dato('numeroAutorizacion = claveAcceso', campo('numeroAutorizacion') === clave ? 'sí ✓' : '🔴 difieren');

    // ── (b) EL COMPROBANTE, desescapado ────────────────────────────────────
    const m = /<comprobante>([\s\S]*?)<\/comprobante>/.exec(bruto);
    if (!m) noConcluyente('el XML no trae <comprobante>.');
    const comp = desescapar(m[1]);
    const presentes = new Set([...comp.matchAll(/<(\w+)>[^<>]+<\/\1>/g)].map((x) => x[1]));
    r.dato('campos hoja en el comprobante', `${presentes.size} distintos`);

    // ── (c) 🔴 EL CRUCE, campo por campo ───────────────────────────────────
    const faltan = [];
    for (const [sri, nuestro] of MAPA) {
      if (!presentes.has(sri)) continue;                   // el XML no lo trae: no se exige
      const donde = corpus.find((c) => nuestro.split('|').some((n) => new RegExp(`\\b${n}\\b`).test(c.t)));
      if (!donde) faltan.push({ sri, esperado: nuestro, valor: campo(sri, comp) });
    }
    r.di('');
    r.dato('campos del XML cubiertos', `${MAPA.filter(([s]) => presentes.has(s)).length - faltan.length} de ${MAPA.filter(([s]) => presentes.has(s)).length}`);
    for (const f of faltan) r.dato(`  🔴 ${f.sri}`, `= "${f.valor}" · nuestro canónico no tiene «${f.esperado}»`);

    // ── (d) EL FORMATO DE LA FECHA ─────────────────────────────────────────
    const fecha = campo('fechaEmision', comp);
    const esDdMmAaaa = /^\d{2}\/\d{2}\/\d{4}$/.test(fecha);
    r.di('');
    r.dato('fechaEmision del XML real', `${fecha} · ${esDdMmAaaa ? 'dd/mm/aaaa ✓' : '🔴 otro formato'}`);
    const emitimosSri = /fechaSri|fecha_emision_sri/.test(canon) && /\$\{m\[3\]\}\/\$\{m\[2\]\}\/\$\{m\[1\]\}/.test(canon);
    r.dato('nuestro canónico emite dd/mm/aaaa', emitimosSri ? 'sí ✓' : '🔴 NO');
    if (esDdMmAaaa && !emitimosSri)
      faltan.push({ sri: 'fechaEmision', esperado: 'dd/mm/aaaa', valor: fecha });

    // ── (e) 🔴 LOS CÓDIGOS DEL IVA — lo que no puede esperar al rechazo ────
    const codigo = campo('codigo', comp), codPct = campo('codigoPorcentaje', comp), tarifa = campo('tarifa', comp);
    r.di('');
    r.dato('IVA en el XML real', `codigo=${codigo} (2 = IVA) · codigoPorcentaje=${codPct} · tarifa=${tarifa}`);
    const tieneMapa = /codigo_porcentaje_sri/.test(canon);
    r.dato('el canónico traduce por catálogo', tieneMapa ? 'sí — CatalogosSri ✓' : '🔴 NO: el código iría inventado');
    if (!tieneMapa)
      faltan.push({ sri: 'codigoPorcentaje', esperado: 'CatalogosSri', valor: codPct });
    /* El 15 % del XML real es `codigoPorcentaje=4`. El del 0 % NO se puede confirmar
       con este documento: esta factura no tiene líneas al 0 %. Se dice. */
    r.di('      ⚠️ este XML sólo trae líneas al 15 % (codigoPorcentaje=4): **el código del 0 %');
    r.di('         NO queda validado contra producción**, y hace falta una factura que lo tenga.');

    // ── (f) LA FIRMA ──────────────────────────────────────────────────────
    r.di('');
    r.dato('XAdES-BES', /SignedProperties|XAdES/.test(comp) ? 'presente ✓' : '🔴 ausente');
    r.dato('SigningTime', campo('SigningTime', comp) ?? (/<[^>]*SigningTime[^>]*>([^<]*)</.exec(comp) ?? [])[1] ?? '(no está)');
    r.di('      ⇒ la firma es el trabajo del proveedor, no nuestro: se verifica que EXISTA,');
    r.di('         no se reimplementa. Lo nuestro es entregarle un canónico correcto.');

    if (faltan.length)
      rojo(`${faltan.length} campo(s) del XML autorizado sin equivalente en nuestro canónico:\n` +
           faltan.map((f) => `   · <${f.sri}> = "${f.valor}" → falta «${f.esperado}»`).join('\n') +
           `\n   El XML se armaría incompleto, se firmaría igual, y lo devolvería el SRI.`);
  }

  r.di('\n   → cada campo del XML autorizado tiene su equivalente en el canónico, con el formato del SRI.');
});
