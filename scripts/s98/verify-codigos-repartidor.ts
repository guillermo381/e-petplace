import { normalizarCodigoDespensa, MENSAJES_DESPENSA } from '../../packages/api/src/wrappers/_despensa-comun';
const casos = [
  'documento_en_uso: otro repartidor de esta casa ya tiene ese documento',
  'whatsapp_invalido', 'telefono_invalido', 'tipo_documento_invalido',
  'documento_no_coincide_con_tipo', 'tipo_vehiculo_invalido', 'placa_requerida',
  'vehiculo_tope_alcanzado', 'vehiculo_no_existe',
];
let malos = 0;
for (const c of casos) {
  const cod = normalizarCodigoDespensa(c);
  const ok = cod !== 'error_desconocido';
  if (!ok) malos++;
  console.log((ok ? 'OK ' : 'MAL'), c.slice(0, 40).padEnd(42), '->', cod, '|', MENSAJES_DESPENSA[cod]);
}
// Contra-caso: algo que NO es un codigo tiene que caer al generico. Sin este
// brazo, un normalizador que devolviera siempre el primer codigo daria 9/9.
const basura = normalizarCodigoDespensa('esto no es un codigo de nada');
console.log(basura === 'error_desconocido' ? 'OK  contra-caso: la basura cae al generico' : 'MAL contra-caso: la basura devolvio ' + basura);
if (malos > 0 || basura !== 'error_desconocido') { console.log('ROJO'); process.exit(1); }
console.log('VERDE: los 9 disparan y la basura no');
