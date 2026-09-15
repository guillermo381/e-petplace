/* CENSO · valores del cliente FIJOS al claro en vez de leer el tema.
   No mide "usa palette": mide usos de palette en POSICIÓN DE COLOR APLICADO
   cuyo valor es propio del tema claro. Un `palette.magenta` en una marca es
   correcto; un `palette.light0` como fondo es el claro clavado. */
const fs=require('fs'), path=require('path');
const RAIZ='apps/cliente/src';
/* Los tokens que SON del claro: si aparecen aplicados, la pantalla decidió
   por el tema. Salen de leer light.ts/dark.ts y quedarse con los que
   DIFIEREN entre los dos temas. */
const light=fs.readFileSync('packages/ui/src/themes/light.ts','utf8');
const dark=fs.readFileSync('packages/ui/src/themes/dark.ts','utf8');
const slotsQueCambian=new Set();
for(const m of light.matchAll(/(\w+):\s*palette\.(\w+)/g)){
  const enDark=[...dark.matchAll(new RegExp(`${m[1]}:\\s*palette\\.(\\w+)`,'g'))][0];
  if(enDark && enDark[1]!==m[2]) slotsQueCambian.add(m[2]);
}
const archivos=[];
(function anda(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){
  const p=path.join(d,e.name);
  if(e.isDirectory()) anda(p); else if(/\.tsx?$/.test(e.name)) archivos.push(p);
}})(RAIZ);

const APLICADO=/palette\.(\w+)/g;
const hallazgos=[];
for(const f of archivos){
  const src=fs.readFileSync(f,'utf8');
  const sinCom=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:/'"`])\/\/(?!\/)[^\n]*/g,'$1');
  const lineas=sinCom.split('\n');
  lineas.forEach((l,i)=>{
    for(const m of l.matchAll(APLICADO)){
      if(slotsQueCambian.has(m[1])) hallazgos.push({f,linea:i+1,token:m[1],txt:l.trim().slice(0,86)});
    }
  });
}
const porToken={};
for(const h of hallazgos) porToken[h.token]=(porToken[h.token]??0)+1;
console.log(`CENSO · ${hallazgos.length} valores fijos al claro en ${new Set(hallazgos.map(h=>h.f)).size} archivos del cliente`);
console.log(`(tokens que DIFIEREN entre light y dark: ${[...slotsQueCambian].join(' · ')})\n`);
console.log('por token:', Object.entries(porToken).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}=${v}`).join(' · '));
console.log('\n── archivo:línea ──');
for(const h of hallazgos) console.log(`  ${h.f}:${h.linea}  palette.${h.token}  ${h.txt}`);
