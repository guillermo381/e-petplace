// ═══════════════════════════════════════════════════════════════════════════
// EL RIDE — la Representación Impresa del Documento Electrónico
//
// 🔴 POR QUÉ ES PIEZA PROPIA Y NO DEL PROVEEDOR: el simulador emite XML y no
//    PDF, y **lo vamos a necesitar igual con cualquier proveedor** — la puerta
//    manual y la contingencia del vet lo piden, y ninguna de las dos puede
//    depender de que un tercero nos devuelva un archivo. *Un papel que sólo
//    existe si el proveedor lo manda no está disponible el día que el proveedor
//    no contesta, que es exactamente el día en que hace falta.*
//
// Se dibuja con `Papel` —el molde de los cinco papeles de la casa (S90-A)— así
// que hereda su cara sin re-decidirla: marca de agua del isotipo al 6 %, filete
// magenta, tinta #221E19, mono para el dato exacto. *La sexta copia de un molde
// es la que lo hace divergir.*
// ═══════════════════════════════════════════════════════════════════════════

import { Papel, TINTA, TINTA_65, HAIRLINE, A4, MX } from '../papel.ts';
import type { DocumentoCanonico } from './canonico.ts';

/** La marca que el ambiente de pruebas OBLIGA a llevar. */
export const MARCA_PRUEBAS_RIDE = 'AMBIENTE DE PRUEBAS · SIN VALIDEZ TRIBUTARIA';

const dosDec = (n: number) => n.toFixed(2);

/** Las columnas del detalle, en puntos desde el margen izquierdo. */
const COL = { desc: 0, cant: 250, pu: 300, dto: 360, base: 420, iva: 480 };

export async function rideDesdeCanonico(args: {
  canonico: DocumentoCanonico;
  claveAcceso: string;
  numero: string;                 // 001-001-000000042
  estado: string;                 // autorizada | emitiendo | pendiente_manual …
  autorizadoEn?: string | null;
}): Promise<Uint8Array> {
  const c = args.canonico;
  const p = await Papel.crear();
  const anchoUtil = A4[0] - MX * 2;

  /* ── LA CABECERA ────────────────────────────────────────────────────────
     El folio de la casa es el NÚMERO del comprobante: es lo que la familia
     lee por teléfono y lo que el contador busca. */
  const titulo = c.tipo === 'factura' ? 'FACTURA' : 'NOTA DE CRÉDITO';
  const notas = [
    `${c.emisor.razon_social} · RUC ${c.emisor.ruc}`,
    `Matriz: ${c.emisor.direccion_matriz}`,
    `Establecimiento: ${c.emisor.direccion_establecimiento}`,
    c.emisor.obligado_contabilidad ? 'Obligado a llevar contabilidad: SÍ'
                                   : 'Obligado a llevar contabilidad: NO',
    c.emisor.leyenda_regimen ?? '',
  ].filter(Boolean);
  p.cabecera(titulo, notas, args.numero);

  /* 🔴 LA MARCA DEL AMBIENTE. Va ARRIBA y en palabra, no en color: un RIDE de
     pruebas que se imprime en blanco y negro y sólo se distinguía por un matiz
     es indistinguible de uno real. */
  if (c.emisor.ambiente === 1) {
    p.texto(MARCA_PRUEBAS_RIDE, MX, 10, { font: p.f.sansBold });
    p.y -= 16;
  }

  p.identidad(
    c.receptor.razon_social,
    `${c.receptor.tipo_identificacion.replace('_', ' ')} ${c.receptor.identificacion}`
      + (c.receptor.direccion ? ` · ${c.receptor.direccion}` : ''),
  );

  p.rotulo('Datos del comprobante');
  p.parrafo('', `Fecha de emisión: ${c.fecha_emision_sri}`
              + `   ·   Ambiente: ${c.emisor.ambiente === 1 ? 'pruebas' : 'producción'}`
              + `   ·   Esquema ${c.emisor.version_esquema}`, 9.5);
  p.parrafo('', `Clave de acceso: ${args.claveAcceso}`, 9.5);
  p.parrafo('', `Estado: ${args.estado}`
              + (args.autorizadoEn ? `   ·   Autorizado: ${args.autorizadoEn}` : ''), 9.5);

  /* ── EL DETALLE ─────────────────────────────────────────────────────────
     `Papel` no trae tabla: el detalle de un comprobante es la única de las
     seis caras que la necesita, y una tabla mal generalizada desde un solo
     caso es peor que una local. Vive acá hasta que un segundo papel la pida. */
  p.rotulo('Detalle');
  const enc = (s: string, x: number) => p.texto(s, MX + x, 8.5, { color: TINTA_65 });
  enc('DESCRIPCIÓN', COL.desc); enc('CANT', COL.cant); enc('P.UNIT', COL.pu);
  enc('DTO', COL.dto); enc('BASE', COL.base); enc('IVA', COL.iva);
  p.y -= 12;
  p.hairline();
  p.y -= 12;

  for (const it of c.items) {
    p.asegura(120);
    /* La descripción se recorta al ancho de SU columna — sin esto pisa la
       cantidad y el papel sale con dos números encimados. */
    let d = it.descripcion;
    const maxDesc = COL.cant - 8;
    while (d.length > 3 && p.f.sans.widthOfTextAtSize(d, 9.5) > maxDesc) {
      d = d.slice(0, -2);
    }
    if (d !== it.descripcion) d = `${d.slice(0, -1)}…`;
    p.texto(d, MX + COL.desc, 9.5);
    const num = (s: string, x: number) => p.texto(s, MX + x, 9.5, { font: p.f.mono });
    num(String(it.cantidad), COL.cant);
    num(dosDec(it.precio_unitario), COL.pu);
    num(dosDec(it.descuento), COL.dto);
    num(dosDec(it.base), COL.base);
    num(dosDec(it.valor_iva), COL.iva);
    p.y -= 14;
  }

  p.y -= 6;
  p.hairline();
  p.y -= 16;

  /* ── LOS TOTALES ────────────────────────────────────────────────────────
     Una línea POR TARIFA, con su porcentaje escrito. *Un «subtotal» sin decir
     de qué tarifa obliga al lector a inferirlo, y con tres tarifas vivas
     (15 %, 5 % y 0 %) la inferencia se equivoca.* */
  const fila = (etiqueta: string, valor: string, negrita = false) => {
    p.asegura(80);
    const w = p.f.mono.widthOfTextAtSize(valor, 9.5);
    p.texto(etiqueta, MX + COL.dto, 9.5,
            negrita ? { font: p.f.sansBold } : { color: TINTA_65 });
    p.texto(valor, A4[0] - MX - w, 9.5, { font: p.f.mono });
    p.y -= 14;
  };
  for (const g of c.subtotales_por_tarifa) {
    fila(`Subtotal ${g.tarifa_pct} %`, dosDec(g.base));
  }
  for (const g of c.subtotales_por_tarifa.filter((x) => x.valor_iva !== 0)) {
    fila(`IVA ${g.tarifa_pct} %`, dosDec(g.valor_iva));
  }
  if (c.descuento_total) fila('Descuento', dosDec(c.descuento_total));
  /* 🔴 LA PROPINA VA AUNQUE SEA CERO, y el papel dice por qué en su pie:
     nuestra tarifa de servicio es una LÍNEA DE VENTA con IVA, no una propina. */
  fila('Propina', dosDec(c.propina));
  fila('VALOR TOTAL', dosDec(c.total), true);

  p.y -= 10;
  p.rotulo('Forma de pago');
  p.parrafo('', `Código SRI ${c.forma_pago_sri} · ${dosDec(c.total)}`, 9.5);

  if (c.informacion_adicional.servicioPrestadoPor) {
    p.rotulo('Información adicional');
    p.parrafo('', `Servicio prestado por: ${c.informacion_adicional.servicioPrestadoPor}`, 9.5);
  }
  if (c.referencias.clave_acceso_original) {
    p.parrafo('', `Modifica al comprobante con clave ${c.referencias.clave_acceso_original}`, 9.5);
  }

  /* El QR lleva la CLAVE, que es lo que se consulta en el portal del SRI. */
  p.qr(args.claveAcceso, ['Clave de acceso', 'Consultable en el portal del SRI']);

  p.pie(
    `Documento generado por e-PetPlace el ${c.fecha_emision_sri}. `
    + `La propina figura en cero porque e-PetPlace no cobra propina: la tarifa de `
    + `servicio es una línea de venta con su IVA, incluida en el detalle. `
    + (c.emisor.ambiente === 1 ? `${MARCA_PRUEBAS_RIDE}.` : ''),
  );

  return await p.bytes();
}
