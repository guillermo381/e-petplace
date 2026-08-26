import fs from 'node:fs';
const CON_TILDE=['probá','tocá','elegí','escribí','andá','mirá','poné','hacé','agregá','volvé','ingresá','revisá','buscá','cargá','seleccioná','confirmá','guardá','contactá','abrí','activá','compartí','enviá','esperá','intentá','verificá','completá','aceptá','corregí','contá','pedí','sacá','cerrá','dejá','sumá','usá','pagá','entrás','vení'];
const ENCL=['contanos','escribila','escribilo','corregilo','corregila','ingresalo','ingresala','probalo','probala','tocalo','tocala','elegilo','elegila','agregalo','agregala','revisalo','revisala','guardalo','guardala','avisanos','contactanos','compartile','compartilo','compartila'];
const PRON=['tenés','podés','querés','sabés','debés','necesitás','hacés','ponés','compartís'];
const TODOS=[...CON_TILDE,...ENCL,...PRON];
/* 🔴 TRAMPA 6, cerrada acá: un comentario de BLOQUE multilínea no empieza con
   `*` en todas sus líneas y mi v1 lo leía como voz. Se rastrea el estado. */
for (const f of process.argv.slice(2)) {
  const src=fs.readFileSync(f,'utf8').split('\n');
  let enBloque=false; const hits=[];
  src.forEach((linea,i)=>{
    let l=linea;
    if(enBloque){ if(l.includes('*/')){ l=l.slice(l.indexOf('*/')+2); enBloque=false; } else return; }
    l=l.replace(/\/\*[\s\S]*?\*\//g,'');
    if(l.includes('/*')){ l=l.slice(0,l.indexOf('/*')); enBloque=true; }
    l=l.replace(/\/\/.*$/,'');
    for(const m of l.matchAll(/'([^'\\]{4,})'|"([^"\\]{4,})"/g)){
      const v=m[1]??m[2], b=v.toLowerCase();
      let t=TODOS.find(x=>b.includes(x));
      /* 🔴 TRAMPA 7 (mía): `vos` como SUBCADENA matchea «nuevos», «activos»,
         «archivos». Un pronombre corto necesita frontera de VERDAD, y `\b` no
         sirve después de una tilde (trampa 4) — así que se mira el vecino. */
      if(!t && /(^|[^a-záéíóúñ])vos([^a-záéíóúñ]|$)/i.test(b)) t='vos';
      if(t) hits.push({n:i+1,t,v});
    }
  });
  console.log(`${String(hits.length).padStart(4)}  ${f}`);
  if(process.env.MOSTRAR) hits.forEach(h=>console.log(`      L${h.n} [${h.t}] ${h.v.slice(0,72)}`));
}
