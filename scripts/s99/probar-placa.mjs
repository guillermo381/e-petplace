import { validarPlaca, normalizarPlaca, tecladoDeDocumento } from '../../apps/prestador/src/lib/placa-vehiculo.ts';
const casos = [
  ['AB123C','moto',null],            ['ab-123 c','moto',null],
  ['ABC1234','carro',null],          ['ABC123','carro',null],
  ['AB123C','carro','formato_carro'],['ABC1234','moto','formato_moto'],
  ['','moto','vacia'],               ['   ','moto','vacia'],
  ['AB12C','moto','formato_moto'],   ['ABCD1234','carro','formato_carro'],
  ['ABC12345','carro','formato_carro'],
];
let ok=0, mal=0;
for (const [p,t,esp] of casos) {
  const r = validarPlaca(p,t);
  const pasa = r===esp;
  pasa?ok++:mal++;
  if(!pasa) console.log(`  ✗ "${p}" (${t}) → ${r} · esperado ${esp}`);
}
console.log(`placas: ${ok} ok · ${mal} mal`);
console.log('normaliza "ab-123 c" =', normalizarPlaca('ab-123 c'));
console.log('teclado CEDULA=',tecladoDeDocumento('CEDULA'),'PASAPORTE=',tecladoDeDocumento('PASAPORTE'),'null=',tecladoDeDocumento(null));
