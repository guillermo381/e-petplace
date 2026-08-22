// ═══════════════════════════════════════════════════════════════════════════
// S103-D · EL RELOJ DE HUÉRFANOS DE DEUNA — lógica pura, testeable
//
// 🔴 POR QUÉ EL CORTE ES NUESTRO Y NO DEL PROVEEDOR (medido, S103-D §2quater):
//    `payment/info` **NO devuelve `NOT_FOUND`**. Una transacción que no existe
//    vuelve con `HTTP 200`, `status: "PENDING"`, `amount: 0`, `date: ""` y la
//    frase *«Your payment is being synchronized. Please check back in a
//    moment.»*
//
//    ⇒ **Nadie nos va a avisar nunca que algo no existe.** Si esperáramos un
//    `NOT_FOUND`, el barrido reintentaría para siempre sobre intentos
//    fantasma. *El proveedor no falla: contesta algo verosímil, y una frase
//    tranquilizadora sobrevive a cualquier revisión de código.*
//
//    Por eso **los tres relojes son nuestros**:
//      · el HOLD del sujeto  → mientras viva, el intento es legítimo
//      · la VENTANA de 7 días → pasada, el proveedor ya no responde de nada
//      · el FANTASMA          → no tiene reloj: se reconoce por su forma
// ═══════════════════════════════════════════════════════════════════════════

export const VENTANA_DIAS = 7;

/** Lo que el barrido necesita saber del intento. Nada más — *un clasificador
 *  que recibe la fila entera invita a decidir con datos que no declaró.* */
export interface IntentoEnVuelo {
  creado_en: string;              // ISO
  /** Vencimiento del HOLD del sujeto (reserva de stock · hold de agenda).
   *  `null` = el sujeto no tiene hold que gobierne. */
  hold_expira_en: string | null;
}

export type Clase =
  | 'confirmado'        // APPROVED con monto: se cobra, gana sobre todo
  | 'reversado'         // REVERSED
  | 'reverso_fallido'   // REVERSED_FAILED — 🔴 jamás se resuelve solo
  | 'fantasma'          // el proveedor no sabe de esto (forma, no reloj)
  | 'vencido'           // > 7 días: ya no hay a quién preguntarle
  | 'hold_vencido'      // el hold murió: se rearma contra stock/agenda vigente
  | 'en_vuelo';         // legítimo, esperando

export interface Veredicto {
  clase: Clase;
  /** Vocabulario cerrado de `pagos_intentos.hallazgo`. `null` = no es hallazgo. */
  hallazgo: string | null;
  /** 🔴 Si es `true`, el barrido **no debe volver a preguntar**: o se resolvió
   *  o no tiene sentido seguir. Sin esto un fantasma se consulta para siempre. */
  terminal: boolean;
  /** Contra qué se decidió. Va al registro: *un veredicto sin su razón obliga
   *  a reconstruirla, y quien la reconstruye puede reconstruirla mal.* */
  razon: string;
}

/**
 * ¿Este cuerpo de `payment/info` es un fantasma?
 *
 * Las tres marcas juntas, medidas sobre la respuesta real: `PENDING` + monto
 * cero + fecha vacía.
 *
 * 🔴 **SE EXIGEN LAS TRES, no una.** Con sólo `PENDING` estaríamos llamando
 * fantasma a todo pago que el cliente aún no completó — que es el caso normal
 * y el más frecuente.
 *
 * ⚠️ **EL SUPUESTO QUE SOSTIENE ESTO, DECLARADO PORQUE NO ESTÁ MEDIDO:** que
 * una solicitud REAL recién creada devuelve su `amount` (el que mandamos al
 * crearla) y no `0`. Es razonable —la solicitud nace CON su monto— pero **no lo
 * pudimos verificar: crear una exige el `pointOfSale`, que no tenemos.**
 * *Si resultara falso, un pago legítimo consultado en su primer segundo se
 * clasificaría fantasma.* **Primera verificación del día 1 con POS.**
 */
export function esFantasma(cuerpo: unknown): boolean {
  const c = (cuerpo ?? {}) as Record<string, unknown>;
  return String(c.status ?? '').toUpperCase() === 'PENDING'
    && Number(c.amount ?? 0) === 0
    && String(c.date ?? '') === '';
}

/**
 * Clasifica un intento en vuelo. **El orden de las preguntas ES la decisión.**
 */
export function clasificar(
  intento: IntentoEnVuelo,
  cuerpoInfo: unknown,
  ahora: Date = new Date(),
): Veredicto {
  const c = (cuerpoInfo ?? {}) as Record<string, unknown>;
  const estado = String(c.status ?? '').toUpperCase();
  const monto = Number(c.amount ?? 0);

  // ① CONFIRMADO gana sobre todo lo demás, incluida la ventana.
  //    *Un cobro real que llegó tarde sigue siendo un cobro real: cerrarlo como
  //     vencido porque pasaron 7 días sería perder plata que entró.*
  if (estado === 'APPROVED' && monto > 0) {
    return { clase: 'confirmado', hallazgo: 'confirmado_tardio', terminal: true,
             razon: 'APPROVED con monto' };
  }

  // ② Los reversos, antes que cualquier reloj: son desenlaces, no esperas.
  if (estado === 'REVERSED') {
    return { clase: 'reversado', hallazgo: null, terminal: true,
             razon: 'el proveedor reverso la transaccion' };
  }
  if (estado === 'REVERSED_FAILED') {
    /* 🔴 Plata del cliente en el limbo. **Jamás se archiva solo** — LETRA_DEUNA
       §8. Es terminal para el BARRIDO (no hay nada más que preguntar) pero
       abierto para SOPORTE, y por eso lleva hallazgo. */
    return { clase: 'reverso_fallido', hallazgo: 'reverso_fallido', terminal: true,
             razon: 'el reverso no se pudo acreditar: caso de soporte' };
  }

  // ③ EL FANTASMA, ANTES DE LOS RELOJES — orden de la mesa, 22-ago.
  //    *No espera los 7 días porque no hay nada que esperar: el proveedor ya
  //     dijo, con su propia respuesta, que no sabe de esto.* Esperar sería
  //     consultar 7 días una transacción que no existe.
  if (esFantasma(c)) {
    return { clase: 'fantasma', hallazgo: 'huerfano_deuna_vencido', terminal: true,
             razon: 'PENDING con amount 0 y date vacia: el proveedor no lo tiene' };
  }

  // ④ LA VENTANA DE 7 DÍAS. Pasada, el proveedor deja de responder de esta
  //    transacción — y como NOT_FOUND no se emite, **nada nos avisaría solo**.
  const creado = Date.parse(intento.creado_en);
  const dias = (ahora.getTime() - creado) / 86_400_000;
  if (Number.isFinite(creado) && dias >= VENTANA_DIAS) {
    return { clase: 'vencido', hallazgo: 'huerfano_deuna_vencido', terminal: true,
             razon: `pasaron ${dias.toFixed(1)} dias: fuera de la ventana de ${VENTANA_DIAS}` };
  }

  // ⑤ EL HOLD. Mientras viva, el intento es legítimo y se sigue esperando.
  //    Muerto, la sesión de pago murió con él: se rearma contra stock/agenda
  //    vigente (compuerta 1 del motor).
  if (intento.hold_expira_en) {
    const hold = Date.parse(intento.hold_expira_en);
    if (Number.isFinite(hold) && hold <= ahora.getTime()) {
      return { clase: 'hold_vencido', hallazgo: null, terminal: true,
               razon: 'el hold del sujeto vencio: la sesion de pago murio con el' };
    }
  }

  // ⑥ Legítimo y esperando. **El único no-terminal**: se vuelve a preguntar.
  return { clase: 'en_vuelo', hallazgo: null, terminal: false,
           razon: `estado ${estado || 'sin estado'}: sigue en vuelo` };
}
