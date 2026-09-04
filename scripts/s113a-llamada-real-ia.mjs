import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const RAIZ = process.cwd();
const env = Object.fromEntries(readFileSync(`${RAIZ}/apps/cliente/.env.local`,'utf8')
  .split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]));
const URL = env.EXPO_PUBLIC_SUPABASE_URL, ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = readFileSync(`${RAIZ}/supabase/dev/.env.local`,'utf8').match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim();

// La clave se lee del keychain AL MOMENTO. Jamás en el script, jamás en el repo.
const CLAVE = execFileSync('/usr/bin/security',
  ['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'],
  { encoding:'utf8' }).trim();

const cli = createClient(URL, ANON, { auth:{persistSession:false} });
const admin = createClient(URL, SERVICE, { auth:{persistSession:false} });
const { data: ses, error: eL } = await cli.auth.signInWithPassword({ email:'guillo381+8@gmail.com', password:CLAVE });
if (!ses?.session) { console.error('🔴 sin sesión:', eL?.message); process.exit(2); }
const TOKEN = ses.session.access_token;
console.log('sesión OK · uid', ses.session.user.id.slice(0,8));

// carnet real, bajado con service_role (el bucket es privado)
const CARNET = '4e2c24a3-d6ec-444c-9427-e8607ee86c68/carnet-1785354131272.jpg';
const { data: blob, error: eB } = await admin.storage.from('mascotas').download(CARNET);
if (eB) { console.error('🔴 no pude bajar el carnet:', eB.message); process.exit(2); }
const b64 = Buffer.from(await blob.arrayBuffer()).toString('base64');
console.log('carnet real bajado ·', (b64.length/1024).toFixed(0), 'kB en base64');

const casos = [
  ['extract-vacuna',           { imageBase64: b64, mediaType: 'image/jpeg' }],
  ['extract-documento',        { imagenBase64: b64, mediaType: 'image/jpeg' }],
  ['estructurar-nota-clinica', { texto: 'Paciente canino macho de tres anios, mestizo, nueve coma cuatro kilos. Viene por vomitos de veinticuatro horas de evolucion, cuatro episodios, contenido alimentario sin sangre. La familia refiere que ayer comio restos de comida de la mesa. Sigue tomando agua pero come menos. No hay diarrea. Sin antecedentes quirurgicos. Vacunas al dia segun carnet. Desparasitado hace dos meses. Al examen fisico: alerta, responsivo, mucosas rosadas humedas, tiempo de llenado capilar menor a dos segundos. Temperatura treinta y ocho coma ocho grados. Frecuencia cardiaca ciento veinte por minuto, ritmo regular, sin soplos. Frecuencia respiratoria treinta por minuto. Auscultacion pulmonar limpia bilateral. Abdomen blando, depresible, ligeramente doloroso a la palpacion profunda en epigastrio, sin masas ni efusion. Ganglios linfaticos normales. Piel y pelaje sin lesiones. Condicion corporal cinco sobre nueve. Impresion diagnostica: gastroenteritis aguda de probable origen alimentario. Diagnostico diferencial: cuerpo extranio gastrointestinal, pancreatitis, gastritis. Plan diagnostico: si no mejora en cuarenta y ocho horas, hemograma completo, perfil bioquimico y radiografia abdominal. Tratamiento: maropitant un miligramo por kilo subcutaneo cada veinticuatro horas por tres dias. Omeprazol uno coma cinco miligramos por kilo via oral cada veinticuatro horas por siete dias. Probiotico un sobre al dia por diez dias. Dieta blanda gastrointestinal en tomas pequenias y frecuentes por cinco dias. Indicaciones a la familia: agua a libre demanda, no dar restos de comida, volver antes si aparece sangre en el vomito, decaimiento marcado o si deja de tomar agua. Control en cuarenta y ocho horas.', especie: 'perro', motivo: 'vomitos' }],
  ['escribir-presencia',       { hechos: [{ etiqueta: 'verificado', texto: 'Veterinaria en Quito' }, { etiqueta: 'declarado', texto: 'Atiende perros y gatos' }], respuestas: ['Somos una veterinaria de barrio en Quito, atendemos perros y gatos desde hace ocho anios.'], intento: 1 }],
];

console.log('\n=== LLAMADAS REALES AL PROVEEDOR (por la edge desplegada) ===');
const filas = [];
const SOLO = process.env.SOLO;
for (const [slug, cuerpo] of casos) {
  if (SOLO && slug !== SOLO) continue;
  const t0 = Date.now();
  let status = 0, txt = '';
  try {
    const r = await fetch(`${URL}/functions/v1/${slug}`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', apikey: ANON, Authorization:`Bearer ${TOKEN}` },
      body: JSON.stringify(cuerpo),
    });
    status = r.status; txt = (await r.text()).slice(0, 220);
  } catch (e) { txt = 'EXCEPCION ' + String(e).slice(0,120); }
  const ms = Date.now() - t0;
  filas.push({ slug, status, ms });
  console.log(`  ${slug.padEnd(28)} HTTP ${status}  ${String(ms).padStart(6)} ms  ${txt.replace(/\s+/g,' ').slice(0,120)}`);
}
console.log('\n=== LATENCIAS DE PARED (ida y vuelta completa, incluye red) ===');
for (const f of filas) console.log(`  ${f.slug.padEnd(28)} ${f.ms} ms`);

// ── LAS FILAS QUE DEJÓ ia_uso — el verde de IA del lote ────────────────────
const { data: filasU, error: eU } = await admin.from('ia_uso')
  .select('pieza,modelo,edge,resultado,tokens_entrada,tokens_salida,tokens_cache_lectura,tokens_cache_escritura,latencia_ms,costo_estimado_usd,created_at')
  .order('created_at', { ascending: false }).limit(8);
if (eU) { console.log('\n🔴 ia_uso:', eU.message.slice(0,100)); }
else {
  console.log(`\n=== FILAS DE ia_uso (${filasU.length}) ===`);
  for (const f of filasU) console.log('  ' + JSON.stringify(f));
}
