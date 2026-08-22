/**
 * S103-C · RECORRIDO DE LAS CINCO FAMILIAS DE DEUNA — el instrumento.
 *
 * 🔴 **MIDE LA MISMA FUNCIÓN QUE MONTA LA PANTALLA.** `vozDeFallo` vive en la
 * costura (`lib/pagos/deuna-estado`) justamente para esto: *un instrumento que
 * reimplementa la fórmula mide su propio eco.*
 *
 * **Y lee los textos del DICCIONARIO REAL**, no de una copia: así «la clave
 * existe» y «la clave dice lo que creemos» se verifican juntas.
 *
 *   npx tsx scripts/s103/recorrido-deuna-familias.mts
 */
import { CODIGOS_DE_FALLO, familiaDeFallo, vozDeFallo } from '../../apps/cliente/src/lib/pagos/deuna-estado';
import { clienteEs as es } from '../../apps/cliente/src/i18n/es';
import { clienteEn as en } from '../../apps/cliente/src/i18n/en';

type Dic = Record<string, Record<string, unknown>>;

/** `pago.deunaRedTitulo` → el texto, o `null` si la clave NO existe. */
function texto(dic: Dic, clave: string): string | null {
  const [ns, k] = clave.split('.');
  const v = dic[ns]?.[k];
  return typeof v === 'string' ? v : null;
}

/**
 * 🔴 **LA FAMILIA ESPERADA DE CADA CÓDIGO, ANCLADA AL CONTRATO §4 POR NOMBRE.**
 *
 * ⏪ **Esto NACIÓ de un rojo del propio instrumento, y es la parte que hay que
 * conservar:** la primera versión verificaba *«todos los de familia `red`
 * ofrecen reintentar»*. **Probado en rojo moviendo `sin_respuesta` de `red` a
 * `rechazo` —el error exacto que el test existe para cazar— dio VERDE**, porque
 * al sacarlo de `red` el test dejaba de mirarlo.
 *
 * *Un test que deriva su universo del valor que está auditando no audita nada:
 * se mueve con el defecto.* **Acá el universo lo fija el CONTRATO**, así que
 * reclasificar un código rompe el recorrido en vez de esconderse.
 */
const FAMILIA_DEL_CONTRATO: Record<string, string> = {
  // ① defecto nuestro
  datos_invalidos: 'nuestro',
  monto_no_se_recibe: 'nuestro',
  servidor_sin_configurar: 'nuestro',
  monto_invalido: 'nuestro',
  metodo_no_permitido: 'nuestro',
  // los dos de la envoltura común (`ResultadoWrapper`), fuera del contrato
  // de DeUna pero alcanzables desde el mismo wrapper
  error_desconocido: 'nuestro',
  datos_inconsistentes: 'nuestro',
  // ② la compuerta
  pago_en_proceso: 'compuerta',
  reserva_vencida: 'compuerta',
  vendedor_no_activo: 'compuerta',
  monto_divergente: 'compuerta',
  compra_sin_pedidos: 'compuerta',
  /* ⏪ ENMIENDA DE MESA (23-ago): el contrato escrito lo pone en COMPUERTA;
     la mesa lo movió a `nuestro` porque el desglose congelado es artefacto
     nuestro y la persona no tiene nada que corregir. **Se anota acá para que
     la divergencia con el documento sea visible en vez de silenciosa** —
     quien lea `CONTRATO_WRAPPER_DEUNA` §4 va a encontrar la clasificación
     vieja hasta que A la deposite. */
  desglose_incompleto: 'nuestro',
  // ③ el proveedor rechazó
  no_se_pudo_completar: 'rechazo',
  // ④ la red — NO es rechazo
  sin_respuesta: 'red',
  sesion_no_verificable: 'red',
  // ⑤ ambiguo a propósito
  compra_no_existe: 'ambiguo',
  cita_no_existe: 'ambiguo',
  // el 401
  sin_sesion: 'sesion',
};

const ACCION_ESPERADA: Record<string, string> = {
  compuerta: 'volver',
  red: 'reintentar',
  ambiguo: 'volver',
  sesion: 'volver',
  rechazo: 'soporte',
  nuestro: 'soporte',
};

let fallos = 0;
const marca = (ok: boolean) => (ok ? '  ' : '❌');

console.log(`\nCÓDIGOS MEDIDOS: ${CODIGOS_DE_FALLO.length}\n`);
console.log('código                    familia     acción       voz (es)');
console.log('─'.repeat(110));

for (const codigo of [...CODIGOS_DE_FALLO].sort()) {
  const familia = familiaDeFallo(codigo);
  const voz = vozDeFallo(codigo);
  const cuerpoEs = texto(es as unknown as Dic, voz.cuerpo);
  const cuerpoEn = texto(en as unknown as Dic, voz.cuerpo);
  const tituloEs = texto(es as unknown as Dic, voz.titulo);

  // ① ninguna clave puede faltar — en NINGUNO de los dos idiomas
  const claves = cuerpoEs !== null && cuerpoEn !== null && tituloEs !== null;
  // ② ningún código cae al genérico salvo los que SON genéricos por familia
  const generico = voz.cuerpo === 'pago.deunaNuestroCuerpo';
  const genericoLegitimo = familia === 'nuestro';
  // ③ la acción es la que su familia manda
  const accionOk = voz.accion === ACCION_ESPERADA[familia];
  // ④ 🔴 y la familia es la QUE EL CONTRATO DICE — no la que el mapa cree
  const familiaOk = familia === FAMILIA_DEL_CONTRATO[codigo];

  const ok = claves && accionOk && familiaOk && (!generico || genericoLegitimo);
  if (!ok) fallos++;

  console.log(
    `${marca(ok)}${codigo.padEnd(24)}${(familiaOk ? familia : `${familia}‼️esperada:${FAMILIA_DEL_CONTRATO[codigo]}`).padEnd(12)}${voz.accion.padEnd(13)}${(cuerpoEs ?? '‼️ CLAVE INEXISTENTE').slice(0, 58)}`,
  );
}

console.log('\n── LAS CINCO PROHIBICIONES DEL CONTRATO, MEDIDAS ──\n');

const prohibiciones: Array<[string, boolean, string]> = [];

// ① la compuerta JAMÁS dice que el pago falló — el proveedor nunca se enteró
const vocesCompuerta = CODIGOS_DE_FALLO.filter((c) => FAMILIA_DEL_CONTRATO[c] === 'compuerta').map((c) => {
  const v = vozDeFallo(c);
  return `${texto(es as unknown as Dic, v.titulo) ?? ''} ${texto(es as unknown as Dic, v.cuerpo) ?? ''}`.toLowerCase();
});
const mienteElPago = vocesCompuerta.filter((v) =>
  /pago (falló|fallo)|no se pudo (procesar|cobrar) el pago|rechaz/.test(v),
);
prohibiciones.push([
  'la voz de COMPUERTA no dice que el pago falló',
  mienteElPago.length === 0,
  `${vocesCompuerta.length} voces de compuerta · ${mienteElPago.length} afirman fallo de pago`,
]);

// ② la red ofrece reintentar y JAMÁS soporte
const red = CODIGOS_DE_FALLO.filter((c) => FAMILIA_DEL_CONTRATO[c] === 'red');
prohibiciones.push([
  'RED ofrece reintentar y nunca soporte',
  red.every((c) => vozDeFallo(c).accion === 'reintentar'),
  `${red.length} códigos de red: ${red.join(', ')}`,
]);

// ③ sesion_no_verificable NO dice «cerrá sesión»
const vSesion = vozDeFallo('sesion_no_verificable');
const textoSesion = `${texto(es as unknown as Dic, vSesion.cuerpo) ?? ''}`.toLowerCase();
prohibiciones.push([
  'sesion_no_verificable no manda a cerrar sesión',
  !/cerr(á|a)r? sesi(ó|o)n|volv(é|e)r? a entrar|sign in/.test(textoSesion),
  `familia=${familiaDeFallo('sesion_no_verificable')} · «${texto(es as unknown as Dic, vSesion.cuerpo)}»`,
]);

// ④ los dos ambiguos dan EXACTAMENTE la misma voz — no se afinan
const vCompra = vozDeFallo('compra_no_existe');
const vCita = vozDeFallo('cita_no_existe');
prohibiciones.push([
  'los dos AMBIGUOS dan la misma respuesta',
  vCompra.cuerpo === vCita.cuerpo && vCompra.titulo === vCita.titulo,
  `compra=«${vCompra.cuerpo}» · cita=«${vCita.cuerpo}»`,
]);

// ⑤ «nuestro» nunca ofrece reintentar — no va a cambiar
const nuestro = CODIGOS_DE_FALLO.filter((c) => FAMILIA_DEL_CONTRATO[c] === 'nuestro');
prohibiciones.push([
  'DEFECTO NUESTRO nunca ofrece reintentar',
  nuestro.every((c) => vozDeFallo(c).accion !== 'reintentar'),
  `${nuestro.length} códigos nuestros`,
]);

// 🔴 ⑥ LA VOZ AMBIGUA NO NOMBRA EL SUJETO (dictamen de mesa, 23-ago).
// El mismo código lo emiten los DOS sujetos, así que cualquier sustantivo
// que la voz elija va a ser falso para la mitad de los casos. *Es el
// defecto del comprobante que decía «compra» para un paseo, entrando por
// la voz de error.*
const vozAmbigua = [
  texto(es as unknown as Dic, vCompra.titulo) ?? '',
  texto(es as unknown as Dic, vCompra.cuerpo) ?? '',
  texto(en as unknown as Dic, vCompra.cuerpo) ?? '',
].join(' ').toLowerCase();
const sujetosNombrados = ['compra', 'cita', 'pedido', 'orden', 'order', 'appointment', 'booking']
  .filter((w) => new RegExp(`\\b${w}s?\\b`).test(vozAmbigua));
prohibiciones.push([
  'la voz AMBIGUA no nombra el sujeto',
  sujetosNombrados.length === 0,
  sujetosNombrados.length === 0
    ? `«${texto(es as unknown as Dic, vCompra.cuerpo)}»`
    : `nombra: ${sujetosNombrados.join(', ')}`,
]);

// ⑦ los dos conjuntos coinciden: ni falta ni sobra un código
const soloEnMapa = CODIGOS_DE_FALLO.filter((c) => !(c in FAMILIA_DEL_CONTRATO));
const soloEnContrato = Object.keys(FAMILIA_DEL_CONTRATO).filter((c) => !CODIGOS_DE_FALLO.includes(c as never));
prohibiciones.push([
  'el mapa y el contrato cubren los mismos códigos',
  soloEnMapa.length === 0 && soloEnContrato.length === 0,
  `solo en mapa: [${soloEnMapa.join(', ')}] · solo en contrato: [${soloEnContrato.join(', ')}]`,
]);

for (const [q, ok, detalle] of prohibiciones) {
  if (!ok) fallos++;
  console.log(`${ok ? '✅' : '❌'} ${q.padEnd(48)} ${detalle}`);
}

console.log(
  fallos === 0
    ? '\n✅ RECORRIDO VERDE — ningún código cae al genérico y las cinco prohibiciones se cumplen.\n'
    : `\n❌ ${fallos} fallo(s).\n`,
);
process.exit(fallos === 0 ? 0 : 1);
