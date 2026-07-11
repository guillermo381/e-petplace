// Asserts imperativos S54-B — wrappers cuentaComercial + eventosEconomicos
// contra DB viva con la sesión demo (regla 47 / L-114: build verde ≠ contrato).
// SEGURO PARA ESTADO COMPARTIDO (la Sesión A opera la MISMA cuenta demo):
// el ciclo de escritura (bancarios + borrado) corre SOLO si la cuenta está en
// pendiente_validacion; con la cuenta activa se omite y se dice. La primera
// corrida (10-Jul ~04:34 UTC) SÍ ejercitó la escritura completa: T6 rechazo
// por banco inválido, T7 ok + relectura enmascarada — evidencia en el reporte.
import { readFileSync } from 'node:fs';
import {
  initApi,
  getClient,
  iniciarSesion,
  obtenerMiCuentaComercial,
  obtenerPaisesParaRegistro,
  obtenerBancosDePais,
  obtenerTiposDocumentoTitular,
  verificarIdentificacionDisponible,
  crearCuentaComercialInicial,
  actualizarDatosBancarios,
  obtenerResumenPendienteLiquidar,
} from '../packages/api/src/index.ts';

const env = Object.fromEntries(
  readFileSync('apps/prestador/.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
initApi(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

let fallos = 0;
function check(cond, nombre, detalle = '') {
  console.log(`${cond ? '✓' : '✗ FALLO'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!cond) fallos += 1;
}

const login = await iniciarSesion({ email: env.EXPO_PUBLIC_DEMO_EMAIL, password: env.EXPO_PUBLIC_DEMO_PASSWORD });
if (!login.ok) {
  console.log('✗ no se pudo firmar la sesión demo:', login.mensaje);
  process.exit(1);
}

// T1 — lectura propia: la cuenta demo existe y el resumen es coherente
const c1 = await obtenerMiCuentaComercial();
check(c1.ok && c1.data !== null, 'T1 obtenerMiCuentaComercial devuelve la cuenta demo');
const cuenta = c1.ok ? c1.data : null;
const estadosValidos = ['pendiente_validacion', 'activa', 'suspendida', 'cerrada'];
check(estadosValidos.includes(cuenta?.estado ?? ''), 'T1b estado del enum', cuenta?.estado);
if (cuenta?.datosBancarios) {
  check(/^•••• .{1,4}$/.test(cuenta.datosBancarios.numeroCuentaMascarado), 'T1c número SIEMPRE enmascarado', cuenta.datosBancarios.numeroCuentaMascarado);
} else {
  console.log('· T1c sin datos bancarios aún (resumen null — peldaño de completar)');
}

// T2 — catálogo de países activos con máscaras
const p = await obtenerPaisesParaRegistro();
const ec = p.ok ? p.data.find((x) => x.codigoIso2 === 'EC') : undefined;
check(p.ok && ec !== undefined, 'T2 países activos incluye EC');
check(ec?.tiposFiscales.length === 4, 'T2b EC con 4 tipos fiscales', String(ec?.tiposFiscales.length));
check(typeof ec?.mascaraPorTipo.persona_natural === 'string', 'T2c máscara persona_natural presente');

// T3 — bancos EC (17 relevados) y tipos de documento (3 con máscara)
const b = await obtenerBancosDePais('EC');
check(b.ok && b.data.length === 17, 'T3 17 bancos EC activos', b.ok ? String(b.data.length) : b.mensaje);
check(b.ok && b.data.some((x) => x.codigo === 'PICHINCHA'), 'T3b PICHINCHA en el catálogo');
const td = await obtenerTiposDocumentoTitular('EC');
check(td.ok && td.data.length === 3, 'T3c 3 tipos de documento EC', td.ok ? String(td.data.length) : td.mensaje);
const cedula = td.ok ? td.data.find((x) => x.codigo === 'CEDULA') : undefined;
check(cedula?.mascaraValidacion === '^\\d{10}$', 'T3d máscara de CEDULA literal', cedula?.mascaraValidacion ?? '');

// T4 — detección §6.5: la identificación de la cuenta demo NO está disponible
const d1 = await verificarIdentificacionDisponible('EC', cuenta?.identificacionFiscal ?? '');
check(d1.ok && d1.data.disponible === false, 'T4 identificación existente → no disponible');
check(d1.ok && typeof d1.data.mensaje === 'string', 'T4b mensaje honesto presente');
const d2 = await verificarIdentificacionDisponible('EC', '9999999999');
check(d2.ok && d2.data.disponible === true, 'T4c identificación inexistente → disponible');

// T5 — rechazo tipado sin escritura: el demo YA tiene cuenta (UNIQUE owner)
const r1 = await crearCuentaComercialInicial({
  countryCode: 'EC',
  tipoFiscal: 'persona_natural',
  identificacionFiscal: '9999999999',
  razonSocial: 'Prueba S54',
  nombreComercial: 'Prueba S54',
});
check(!r1.ok && r1.codigo === 'rechazado_por_servidor', 'T5 crear con cuenta existente → rechazado_por_servidor', r1.ok ? '' : r1.mensaje);

// T6-T8 — ciclo de escritura: SOLO en pendiente_validacion (estado compartido
// con la Sesión A: con la cuenta activa no se pisa nada)
if (cuenta?.estado === 'pendiente_validacion') {
  const r2 = await actualizarDatosBancarios({
    cuentaComercialId: cuenta.id,
    bancoCodigo: 'NO_EXISTE',
    bancoNombre: 'Banco Falso',
    tipoCuenta: 'ahorros',
    numeroCuenta: '2201234567',
    titularNombre: 'Andrés Demo',
    titularTipoDocumento: 'CEDULA',
    titularDocumento: '1712345678',
  });
  check(!r2.ok && r2.codigo === 'rechazado_por_servidor', 'T6 banco fuera de catálogo → rechazo', r2.ok ? '' : r2.mensaje);

  const r3 = await actualizarDatosBancarios({
    cuentaComercialId: cuenta.id,
    bancoCodigo: 'PICHINCHA',
    bancoNombre: 'Banco Pichincha',
    tipoCuenta: 'ahorros',
    numeroCuenta: '2201234567',
    titularNombre: 'Andrés Demo',
    titularTipoDocumento: 'CEDULA',
    titularDocumento: '1712345678',
  });
  check(r3.ok, 'T7 datos bancarios válidos → ok', r3.ok ? '' : r3.mensaje);
  const c2 = await obtenerMiCuentaComercial();
  const resumen = c2.ok ? c2.data?.datosBancarios : null;
  check(resumen?.numeroCuentaMascarado === '•••• 4567', 'T7b relectura enmascarada', resumen?.numeroCuentaMascarado ?? '');

  const { data: borrado, error: errBorrado } = await getClient().rpc('actualizar_datos_bancarios', {
    p_cuenta_comercial_id: cuenta.id,
  });
  const filaBorrado = Array.isArray(borrado) ? borrado[0] : undefined;
  check(!errBorrado && filaBorrado?.success === true, 'T8 borrado de bancarios (limpieza)', filaBorrado?.mensaje ?? '');
  const c3 = await obtenerMiCuentaComercial();
  check(c3.ok && c3.data?.datosBancarios === null, 'T8b 0 residuos: datosBancarios vuelve a null');
} else {
  console.log(`· T6-T8 omitidos: cuenta '${cuenta?.estado}' — el ciclo de escritura solo corre en pendiente_validacion (evidencia de la corrida del 10-Jul en el reporte)`);
}

// T9 — ledger propio honesto (cantidad y moneda coherentes)
const l1 = await obtenerResumenPendienteLiquidar();
check(l1.ok, 'T9 resumen pendiente_liquidar responde', l1.ok ? JSON.stringify(l1.data) : l1.mensaje);
if (l1.ok) {
  check(
    l1.data.cantidad === 0 ? l1.data.moneda === null : typeof l1.data.moneda === 'string',
    'T9b moneda coherente con cantidad',
  );
}

console.log(fallos === 0 ? '\nTODOS LOS ASSERTS PASARON' : `\n${fallos} ASSERT(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
