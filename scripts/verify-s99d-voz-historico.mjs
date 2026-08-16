/**
 * verify-s99d-voz-historico.mjs — LA VOZ SIGUE A LO QUE LA PANTALLA MUESTRA.
 *
 * Hallazgo ② del gate del founder: la entrada al histórico prometía «las
 * atenciones y citas que ya pasaron» **y para el vendedor lista PEDIDOS**.
 *
 * 🔴 **LA CURA NO TOCA LA CLAVE COMPARTIDA, y ése es el punto del guard:**
 * esa frase **es verdad** para quien tiene citas. *Curar una pantalla
 * rompiendo la voz correcta de otra no es curar: es mover el defecto.* Por
 * eso se miden LAS DOS caras — la nueva Y la que no debe cambiar.
 *
 * ⚠️ Se navega por RUTA y no tocando la tab: medido en esta misma sesión, el
 * toque de la barra no se puede simular en RN-web (tres caminos probados,
 * baseline por stash idéntico). Acá no hace falta el gesto: lo que se mide es
 * el TEXTO, y la ruta lleva a la misma pantalla.
 *
 * Uso:  node scripts/verify-s99d-voz-historico.mjs [--puerto 8082]
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
const arg=(n,d)=>{const i=process.argv.indexOf(`--${n}`);return i>-1?process.argv[i+1]:d};
const BASE=`http://localhost:${arg('puerto','8082')}`;
const CLAVE=execFileSync('security',['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w']).toString().trim();

const PEDIDOS='Los pedidos que ya pasaron';
const CITAS='atenciones y citas';
const CASOS=[
  {cuenta:'duenodes', quien:'vendedor puro', espera:'pedidos'},
  {cuenta:'duenovet', quien:'prestador sin tienda', espera:'citas'},
  {cuenta:'duenotodo', quien:'el dual', espera:'citas'},
];

const browser=await chromium.launch({channel:'chrome',headless:true});
const fallos=[];
for (const c of CASOS){
  const ctx=await browser.newContext({locale:'es-EC',viewport:{width:420,height:900}});
  const p=await ctx.newPage();
  try{
    await p.goto(`${BASE}/login`,{waitUntil:'networkidle',timeout:180000});
    await p.getByPlaceholder('ej: ana@correo.com').fill(`guillo381+${c.cuenta}@gmail.com`);
    await p.locator('input[type="password"]').fill(CLAVE);
    await p.getByText('Entrar',{exact:true}).click();
    await p.waitForTimeout(13000);
    if (p.url().includes('/login')) { fallos.push(`${c.cuenta}: no se pudo entrar`); continue; }
    await p.goto(`${BASE}/cuenta`,{waitUntil:'networkidle',timeout:120000});
    await p.waitForTimeout(9000);
    const t=await p.evaluate(()=>{let o='';const a=n=>{if(n.nodeType===3){o+=' '+(n.textContent??'');return}if(!(n instanceof Element))return;if(n.getAttribute('aria-hidden')==='true')return;for(const h of n.childNodes)a(h)};a(document.body);return o});
    const dicePedidos=t.includes(PEDIDOS);
    const diceCitas=t.includes(CITAS);
    const ok = c.espera==='pedidos' ? (dicePedidos && !diceCitas) : (diceCitas && !dicePedidos);
    console.log(`${ok?'✅':'🔴'} ${c.cuenta.padEnd(10)} (${c.quien.padEnd(21)}) · pedidos=${dicePedidos?'sí':'no'} · citas=${diceCitas?'sí':'no'}`);
    if(!ok) fallos.push(`${c.cuenta}: esperaba la voz de ${c.espera} y dice pedidos=${dicePedidos} citas=${diceCitas}`);
  }catch(e){fallos.push(`${c.cuenta}: EXC ${String(e).split('\n')[0].slice(0,90)}`)}
  finally{await ctx.close()}
}
await browser.close();
if(fallos.length){console.error(`\n🔴 ROJO — ${fallos.length} fallo(s):`);for(const f of fallos)console.error('   · '+f);process.exit(1)}
console.log(`\n✅ VERDE — el vendedor lee «pedidos» y quien tiene citas conserva SU voz.\n`);
