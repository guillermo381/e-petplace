/**
 * S107-C · **LOS CAMINOS TRISTES, contra Aurora y SIN ESCRIBIR.**
 *
 * ═══ 🔴 QUÉ MIDE Y QUÉ NO ════════════════════════════════════════════════
 * **SÍ:** lo que el motor contesta en cada camino triste, y con qué CÓDIGO —
 * que es lo que decide qué voz pinta la pantalla.
 *
 * **NO, y son dos de los cinco:**
 * · **pago rechazado a mitad** — exige RESERVAR, o sea escribir en Aurora.
 * · **acta con salvedad** — exige un acta levantada y confirmarla.
 * *No se simulan: un camino triste inventado prueba la simulación, no el
 * producto.* **Van al gate del founder, o a una corrida con subtransacción.**
 *
 * 🔴 **CERO ESCRITURAS.** Sólo lectores.
 */
import { execFileSync } from 'node:child_process';
import { claveAnon } from './sonda-tocar.mjs';
import { createClient } from '@supabase/supabase-js';

const REF = 'zyltipqscdsdsxnjclhp';
const CLAVE = execFileSync('security', ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'], {encoding:'utf8'}).trim();
/* 🔒 Por el CLAIM, no por el orden — ver `claveAnon` en `sonda-tocar.mjs`.
   El regex que había acá acertaba porque `anon` sale primera HOY. */
const ANON = claveAnon(REF);
const sb = createClient(`https://${REF}.supabase.co`, ANON);
const { error } = await sb.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password: CLAVE });
if (error) { console.error('🔴 sin sesión'); process.exit(1); }

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const enDias = (n) => { const d = new Date(); d.setDate(d.getDate()+n); return d; };
/** El próximo día hábil REAL — no «mañana», que puede caer domingo. *La primera
 *  corrida cayó en domingo y midió otra cosa creyendo que medía la semana.* */
const proxHabil = () => { const d = new Date(); do { d.setDate(d.getDate()+1); } while (d.getDay() === 0 || d.getDay() === 6); return d; };
/** El próximo sábado — **el caso que decide** el `min`/`max` por día de semana. */
const proxSabado = () => { const d = new Date(); do { d.setDate(d.getDate()+1); } while (d.getDay() !== 6); return d; };

const { data: mascotas } = await sb.from('mascotas').select('id,nombre,especie');
const perro = mascotas?.find(m => m.especie === 'perro');
const otra  = mascotas?.find(m => m.especie !== 'perro' && m.especie !== 'gato');
/* 🔴 EL GATO ES OTRO CASO Y NO EL MISMO: especie ELEGIBLE sin oferta
   (`especie_sin_oferta`) contra especie que el oficio no admite
   (`mascota_no_elegible`). *La firma del founder —«estamos trabajando en
   eso»— es del primero; decírsela a un pez sería prometer algo que nadie
   está construyendo.* */
const gato = mascotas?.find(m => m.especie === 'gato');

const resumen = async (etiqueta, fecha, mascotaId, modalidad='dia') => {
  const { data, error } = await sb.rpc('obtener_resumen_guarderias', {
    p_modalidad: modalidad, p_fecha: fecha, p_mascota_id: mascotaId,
  });
  console.log(`\n── ${etiqueta}`);
  console.log(`   fecha=${fecha}`);
  if (error) { console.log(`   🔴 REBOTE: ${error.message}`); return; }
  /* ⚠️ **`precioDesde`, en camelCase — el RPC no devuelve snake_case.** La
     primera versión leía `precio_desde` y **imprimía `null` sobre un precio que
     existía**: un hallazgo falso con forma de dato. *Tercera vez en esta pista
     que el instrumento iba a mentir; la cura fue imprimir el JSON crudo.* */
  console.log(`   cuantos=${data.cuantos} · precioDesde=${data.precioDesde ?? 'null'} · causa=${data.causa ?? 'null'}`);
};

console.log(`mascotas: perro=${perro?.nombre ?? '—'} · otra especie=${otra ? `${otra.nombre} (${otra.especie})` : '— (la familia no tiene)'}`);

await resumen('① DÍA PASADO — debe REBOTAR fecha_no_ofertable, no dar causa', iso(enDias(-2)), perro.id);
await resumen('② HOY — la víspera: tampoco se reserva', iso(new Date()), perro.id);
await resumen('③ PRÓXIMO DÍA HÁBIL — el camino feliz, de control', iso(proxHabil()), perro.id);
await resumen('③bis DOMINGO — ¿dice «no opera» o dice «sin cupo»?', iso((()=>{const d=new Date();do{d.setDate(d.getDate()+1);}while(d.getDay()!==0);return d;})()), perro.id);
if (otra) await resumen('④a ESPECIE NO ELEGIBLE (pez)', iso(proxHabil()), otra.id);
if (gato) await resumen('④b GATO — elegible, ¿hay oferta?', iso(proxHabil()), gato.id);
else console.log('\n── ④b GATO: no hay gato en la familia — el caso de `especie_sin_oferta` queda SIN PROBAR');

/* ⑤ LAS VENTANAS POR DÍA DE SEMANA — el caso del sábado. */
const lista = async (etiqueta, fecha) => {
  const { data, error } = await sb.rpc('obtener_guarderias_disponibles', {
    p_fecha: fecha, p_mascota_id: perro.id, p_modalidad: 'dia',
  });
  console.log(`\n── ${etiqueta} (${fecha}, dow=${new Date(fecha+'T12:00:00').getDay()})`);
  if (error) { console.log(`   🔴 ${error.message}`); return; }
  if (!data?.length) { console.log('   (ningún lugar — no opera ese día o sin cupo)'); return; }
  for (const g of data) {
    console.log(`   ${g.prestador_nombre}: recoge ${g.recoge_desde ?? 'null'}–${g.recoge_hasta ?? 'null'} · devuelve ${g.devuelve_desde ?? 'null'}–${g.devuelve_hasta ?? 'null'}`);
  }
};
const finde = proxSabado();
await lista('⑤a UN DÍA HÁBIL', iso(proxHabil()));
await lista('⑤b EL PRÓXIMO SÁBADO — el caso que decide', iso(finde));

await sb.auth.signOut();
console.log('\n⚠️ Pago rechazado y acta con salvedad NO se midieron: exigen ESCRIBIR en Aurora.');
