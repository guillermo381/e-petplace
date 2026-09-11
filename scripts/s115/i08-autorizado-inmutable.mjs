/**
 * S115-E · INSTRUMENTO 8 — UN AUTORIZADO NO SE TOCA.
 *
 * QUÉ MIDE: que un documento `autorizada` sea inmutable. Una factura autorizada
 * es un hecho ante el SRI: corregirla es emitir una nota de crédito, jamás un
 * UPDATE. Un UPDATE silencioso deja el libro diciendo una cosa y el SRI otra.
 *
 * CÓMO: dentro de una transacción abortada, siembra un documento `autorizada` e
 * intenta mover `total`. Debe rebotar con `documento_autorizado_es_inmutable`.
 *
 * ROJO PROBADO: el mismo UPDATE sobre un documento en `borrador` SÍ pasa — eso
 * demuestra que lo que frena es el ESTADO y no una prohibición general de
 * escritura (que rebotaría igual y no probaría nada).
 *
 * Y mide las TRES excepciones que el trigger declara legales: xml_url, pdf_url y
 * el paso a `anulada`. Un guard que además prohíbe lo permitido es otro defecto.
 */
import { correr, q, uno, rojo, noConcluyente } from './_lib-e.mjs';

const SONDA = '000000777';   // secuencial de sonda: localiza la fila sin CTE

const sembrar = (estado) =>
  `insert into documentos_fiscales (total, sentido, rol, tipo, estado, emitida_por_tercero,
      establecimiento, punto_emision, secuencial)
   values (10.00,'emitido','venta_cliente','factura','${estado}',false,'001','002','${SONDA}')`;

/** Corre un UPDATE en txn abortada y devuelve null si pasó, o el mensaje si rebotó.
 *  El documento se localiza por su `secuencial` de sonda — `CREATE TEMP TABLE AS
 *  INSERT` no existe en Postgres (hace falta una CTE), y usar una llave fija es
 *  más simple que una CTE por cada intento. */
function intentar(estado, set) {
  try {
    q(`begin;
       ${sembrar(estado)};
       update documentos_fiscales set ${set} where secuencial = '${SONDA}';
       rollback;`);
    return null;
  } catch (e) { return String(e?.message ?? e); }
}

await correr('i08 · un autorizado no se toca', async (r) => {
  if (uno(`select to_regclass('public.documentos_fiscales') is null as no`).no)
    noConcluyente('documentos_fiscales no existe todavía.');
  const trg = q(`select tgname from pg_trigger where tgrelid='public.documentos_fiscales'::regclass
                 and tgname='trg_documentos_fiscales_inmutable'`);
  r.dato('trigger', trg.length ? 'presente' : '🔴 AUSENTE');

  // ── (a) ROJO PROBADO: el mismo UPDATE sobre un BORRADOR sí pasa ────────────
  const enBorrador = intentar('borrador', "total = 99.00");
  r.dato('rojo ejercido (mismo UPDATE en borrador)', enBorrador === null
    ? 'pasó → lo que frena es el ESTADO, no una prohibición general'
    : `🔴 rebotó: ${enBorrador.slice(0, 120)}`);
  if (enBorrador !== null)
    noConcluyente('el UPDATE rebota incluso en borrador: el instrumento no puede atribuirle el rebote a la inmutabilidad.');

  // ── (b) LA MEDICIÓN: sobre AUTORIZADA debe rebotar ─────────────────────────
  const enAutorizada = intentar('autorizada', "total = 99.00");
  if (enAutorizada === null)
    rojo('se pudo cambiar el TOTAL de un documento autorizado. El libro puede decir algo distinto de lo que el SRI autorizó.');
  const porGuard = /documento_autorizado_es_inmutable|42501/i.test(enAutorizada);
  r.dato('UPDATE total sobre autorizada', porGuard ? 'rebota (documento_autorizado_es_inmutable)' : enAutorizada.slice(0, 150));
  if (!porGuard) noConcluyente(`rebotó por otra causa — rebotar no es una medición:\n   ${enAutorizada.slice(0, 250)}`);

  // ── (c) El cambio de ESTADO a algo que no sea anulada también rebota ───────
  const aOtroEstado = intentar('autorizada', "estado = 'borrador'");
  r.dato('autorizada → borrador', aOtroEstado === null ? '🔴 PASÓ' : 'rebota');
  if (aOtroEstado === null) rojo('un documento autorizado pudo volver a borrador.');

  // ── (d) LO PERMITIDO SIGUE PERMITIDO — un guard que prohíbe de más es un defecto
  const permitidos = [
    ['xml_url', "xml_url = 'https://x/y.xml'"],
    ['pdf_url', "pdf_url = 'https://x/y.pdf'"],
    ['estado → anulada', "estado = 'anulada'"],
  ];
  for (const [nombre, set] of permitidos) {
    const e = intentar('autorizada', set);
    r.dato(`permitido · ${nombre}`, e === null ? 'pasa' : `🔴 BLOQUEADO: ${e.slice(0, 100)}`);
    if (e !== null) rojo(`el guard bloquea "${nombre}", que su propia letra declara legal. Un guard que prohíbe de más también es un defecto.`);
  }

  // ── (e) Residuo ───────────────────────────────────────────────────────────
  const resto = uno(`select count(*)::int as n from documentos_fiscales where secuencial='${SONDA}'`).n;
  r.dato('residuo del instrumento', `${resto} documento(s)`);
  if (resto !== 0) rojo(`el instrumento dejó ${resto} fila(s).`);

  r.di('\n   → lo autorizado es inmutable, y lo que su letra permite sigue pasando.');
});
