// ─────────────────────────────────────────────────────────────────────
// S57-B B3 — PRUEBA CRUZADA DE CANCELACIÓN (guion de DISEÑO, sin código)
//
// ESTADO: DISEÑO ESCRITO EN LA ESPERA DEL CONTRATO DE LA A (bloque A3).
// Este archivo NO se ejecuta todavía: se llena recién con el contrato
// literal de cancelación en mano (estados que escribe la RPC + firmas +
// ventanas). Precedente S56 es ley: contrato ANTES del cemento.
//
// PATRÓN: calcado de verify-vacaciones-s56.mjs (baseline → acto →
// re-lectura cruzada → restauración exacta → 0 residuos), con la
// diferencia de que acá el acto lo ejecuta el DUEÑO (sesión demo
// cliente) y la verdad se lee de AMBOS lados.
//
// DOS SESIONES en el mismo run:
//   · dueño  = credenciales demo de apps/cliente/.env.local
//   · paseador = credenciales demo de apps/prestador/.env.local
//   (initApi es un cliente único → cerrarSesion() + iniciarSesion() entre
//   tramos, como hace el harness; jamás dos clientes simultáneos.)
//
// ── (a) CANCELADA POR EL DUEÑO: la franja se re-oferta SOLA ──────────
// T1  [dueño] baseline de inicios del CLIENTE para el prestador demo el
//     día D (obtener_inicios_paseo_disponibles / obtenerSlotsDisponibles):
//     el inicio H de la cita confirmada NO se oferta (la ventana está
//     ocupada por la cita firme). Guardar el set completo de inicios.
// T2  [dueño] cancelar la cita por la RPC del contrato A3 (dentro de la
//     ventana legal). Éxito tipado.
// T3  [dueño] re-leer inicios: H REAPARECE y el set = baseline ∪ {ventana
//     de la cita} — la franja liberada vuelve a ofertarse sin tocar nada
//     más (espejo del T5/T7b de vacaciones: restauración EXACTA, no
//     "algo cambió").
// T4  [paseador] obtenerCitasPaseoDelDia del día D: la cancelada NO está
//     (estado 'cancelada' queda fuera del filtro positivo — verdad firme
//     sin enmienda de wrapper; verificar que TAMPOCO viaja en el rango
//     de la semana B1).
//
// ── (b) REAGENDADA: se mueve sin residuo ─────────────────────────────
// T5  [dueño] baseline de inicios en día D (viejo) y día D' (nuevo).
// T6  [dueño] reagendar por la RPC del contrato (D,H) → (D',H').
// T7  [dueño] inicios de D: la ventana vieja LIBRE (reaparece). Inicios
//     de D': la ventana nueva OCUPADA (desaparece de la oferta).
// T8  [paseador] agenda del rango: la cita vive SOLO en D' con hora H'
//     — cero residuo en D (mismo id, un solo registro).
//
// ── (c) NO_SHOW QUE DEVENGA: el paseador cobra lo comprometido ───────
// T9  [paseador] baseline de Cobros/Liquidaciones (wrappers
//     eventosEconomicos/liquidaciones): N eventos.
// T10 cierre no_show por la puerta del contrato A3 (cierre_no_show,
//     Decisión T/7.15) sobre una cita pagada de paquete/plan según lo
//     que el contrato habilite.
// T11 [paseador] re-leer Cobros: N+1 — el evento existe, con el monto =
//     precio unitario efectivo de ORIGEN (FIFO si es paquete) y
//     metadata de pago simulado declarada. El no_show ES un cierre: sin
//     tercera vía, sin evento al cancelar en ventana (T2/T6 NO deben
//     haber creado eventos — assert explícito de cero eventos nuevos
//     tras (a) y (b)).
//
// ── LIMPIEZA ──────────────────────────────────────────────────────────
// Todo dato DEMO creado se revierte por id y se verifica 0 residuos
// (patrón S56). OJO: si el contrato de la A trae RPCs que ESCRIBEN
// estados no reversibles por wrapper (p.ej. el evento económico de T11),
// el run se hace sobre una cita DEMO fabricada para morir y la limpieza
// la declara el reporte (jamás DELETE del ledger — regla 7.8: el ledger
// no se borra; el assert usa una cita sacrificable y lo dice).
// ─────────────────────────────────────────────────────────────────────

console.log('S57-B B3: guion de diseño — pendiente del contrato literal de la Sesión A (bloque A3).');
process.exit(1);
