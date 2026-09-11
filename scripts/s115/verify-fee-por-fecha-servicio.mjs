#!/usr/bin/env node
/**
 * S115-A · EL FEE SE RESUELVE POR LA FECHA DEL SERVICIO — y las dos puertas coinciden.
 *
 * Firma del founder (10-sep-2026, opción 2): *«la comisión de la fecha en que el precio
 * rige»*. Para una cita, esa fecha es **la del SERVICIO**, no la de hoy ni la del pago.
 *
 * 🔴 DOS AFIRMACIONES, Y LA SEGUNDA ES LA QUE IMPORTA:
 *   ① congelado y confirmación resuelven **la misma fila** de `fee_configs`;
 *   ② y esa fila es la de **la fecha del servicio**, no la de hoy.
 *
 *   *Sin ② el gate se puede pasar con las dos puertas coincidiendo en el número
 *   equivocado — que es exactamente el estado en que estaba la casa cuando se escribió
 *   este instrumento: las dos decían 10 % sobre una cita de octubre que debe pagar 18 %.*
 *   **Un gate que sólo verifica que dos lados coincidan bendice el error compartido.**
 *
 * TRES CÓDIGOS (L-533): 0 sano · 1 rojo del producto · 2 no concluyente.
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';

const NO_CONCLUYENTE = 2, ROJO = 1, SANO = 0;
const salir = (c, msg) => { console.log(msg); process.exit(c); };

function claveDelLlavero(nombre) {
  try {
    return execSync(`security find-generic-password -s ${nombre} -w`, { stdio: ['ignore','pipe','ignore'] })
      .toString().trim();
  } catch { return null; }
}

const url = process.env.SUPABASE_URL ?? 'https://zyltipqscdsdsxnjclhp.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? claveDelLlavero('epetplace-service-role');
if (!key) {
  salir(NO_CONCLUYENTE,
    'NO CONCLUYENTE · sin credencial de servicio.\n' +
    '  Poné SUPABASE_SERVICE_ROLE_KEY o guardala en el llavero (epetplace-service-role).\n' +
    '  No se cae a la anon key: mediría otra cosa y daría verde por no ver nada.');
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await db.rpc('verificar_fee_por_fecha_servicio');
if (error) salir(NO_CONCLUYENTE, `NO CONCLUYENTE · la sonda no corrió: ${error.message}`);
if (!data || !Array.isArray(data) || data.length === 0) {
  salir(NO_CONCLUYENTE,
    'NO CONCLUYENTE · la sonda no devolvió casos.\n' +
    '  Sin un caso que discrimine (una cita con fecha en otra vigencia) esto no mide nada.');
}

let rojos = 0, medidos = 0, noMedibles = 0;
for (const c of data) {
  /* 🔴 TRES ESTADOS EN LA SALIDA, NO DOS. Un caso sin desglose NO se verificó — y
     llamarlo «OK» sería que el gate confirme lo que quiere ver. Se marca distinto. */
  const esNoMedible = c.motivo?.startsWith('SIN DESGLOSE');
  if (esNoMedible) noMedibles++; else if (c.ok) medidos++;
  const marca = esNoMedible ? '·   ' : (c.ok ? 'OK  ' : '🔴  ');
  console.log(`${marca}${c.caso}`);
  console.log(`      congelado=${c.pct_congelado ?? '—'}  confirmacion=${c.pct_confirmacion ?? '—'}  esperado(fecha servicio)=${c.pct_esperado ?? '—'}`);
  if (c.motivo) console.log(`      ⇒ ${c.motivo}`);
  if (!c.ok && !esNoMedible) rojos++;
}

if (rojos > 0) {
  salir(ROJO,
    `\n🔴 ROJO · ${rojos} caso(s) MEDIDOS no cuadran: el fee congelado no es el de la\n` +
    '   fecha del servicio.');
}
if (medidos === 0) {
  /* 🔴 CERO MEDIDOS NO ES SANO: es que no hubo con qué medir. *Un gate que no encontró
     ningún caso y dice «verde» es el silencio disfrazado de salud.* */
  salir(NO_CONCLUYENTE,
    `\nNO CONCLUYENTE · ${data.length} caso(s), TODOS sin desglose congelado: no hubo nada\n` +
    '   que verificar. Hace falta una cita con fecha en otra vigencia y desglose congelado\n' +
    '   (estado `pendiente_pago`) para que este gate diga algo.');
}
salir(SANO,
  `\nSANO · ${medidos} caso(s) MEDIDOS: el fee congelado es el de la fecha del servicio.` +
  (noMedibles ? `\n       (${noMedibles} sin desglose — no medibles, no verdes.)` : ''));
