/* LA OTRA MITAD DEL CENSO: el tema oscuro contra el claro, slot por slot.
   La pregunta no es «¿el cliente clava valores?» —son 7— sino «¿qué slots del
   oscuro quedaron sin calibrar cuando el claro se rehízo en v5?». */
const fs=require('fs');
const leer=(p)=>fs.readFileSync(p,'utf8');
const slots=(src)=>new Map([...src.matchAll(/(\w+):\s*palette\.(\w+)/g)].map(m=>[m[1],m[2]]));
const L=slots(leer('packages/ui/src/themes/light.ts'));
const D=slots(leer('packages/ui/src/themes/dark.ts'));
/* los tokens que NACIERON con el rediseño v5 (están en palette con ese nombre
   o son los que la letra nombra) */
const V5=/V5$|^lienzo$|^ciruela|^magentaAccion$|^magentaTinta$|^rosaTinte$|^terracotta|^ochre|^campoBorde|^verdeAlDia$|^superficie$/;
const soloEnLight=[], distintos=[], claroEsV5OscuroNo=[];
for(const [s,tl] of L){
  const td=D.get(s);
  if(td===undefined){ soloEnLight.push([s,tl]); continue; }
  if(td!==tl){ distintos.push([s,tl,td]); if(V5.test(tl) && !V5.test(td)) claroEsV5OscuroNo.push([s,tl,td]); }
}
const soloEnDark=[...D.keys()].filter(s=>!L.has(s));
console.log(`slots en light: ${L.size} · en dark: ${D.size}`);
console.log(`  sólo en light: ${soloEnLight.length}${soloEnLight.length?' → '+soloEnLight.map(([s,t])=>`${s}(${t})`).join(' · '):''}`);
console.log(`  sólo en dark : ${soloEnDark.length}${soloEnDark.length?' → '+soloEnDark.join(' · '):''}`);
console.log(`  con valor distinto: ${distintos.length}`);
console.log(`\n🔴 LA LISTA DE TRABAJO — el claro usa un token v5 y el oscuro NO (${claroEsV5OscuroNo.length}):`);
for(const [s,tl,td] of claroEsV5OscuroNo) console.log(`   ${s.padEnd(22)} claro palette.${tl.padEnd(18)} oscuro palette.${td}`);
