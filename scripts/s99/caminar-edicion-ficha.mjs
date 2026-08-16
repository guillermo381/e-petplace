import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
const PASS = execFileSync('security',['find-generic-password','-a','siembra','-s','epetplace-siembra-s97','-w'],{encoding:'utf8'}).trim();
const B='http://localhost:8097';
const b = await chromium.launch({channel:'chrome',headless:true});
const c = await b.newContext({locale:'es-EC',viewport:{width:420,height:1500}});
const p = await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`${B}/login`,{waitUntil:'networkidle',timeout:240000});
await p.getByPlaceholder('ej: ana@correo.com').fill('guillo381+duenotodo@gmail.com');
await p.locator('input[type="password"]').fill(PASS);
await p.getByText('Entrar',{exact:true}).click(); await p.waitForTimeout(7000);
await p.goto(`${B}/ventas/repartidor/3c9a5713-42fd-4a06-b4ba-259a35deb307`,{waitUntil:'networkidle',timeout:120000});
await p.waitForTimeout(3500);
await p.screenshot({path:'scripts/capturas/s99-c-l2/02-ficha-edicion.png'});
const cuerpo = await p.locator('body').innerText();
console.log('— la EDICIÓN (D-791: una pieza, dos entradas) —');
for (const [f,d] of [
  ['Ficha del repartidor','título de edición, NO el de alta'],
  ['Repartidor duenotodo S97','el nombre REAL cargado del motor'],
  ['Así lo ve la familia','la cabecera-espejo, igual que en el alta'],
  ['Sin nombre todavía','← NO debe estar: hay nombre'],
]) console.log(`  ${cuerpo.includes(f)?'✓':'·'} ${d}`);
console.log('errores:',errs.length); errs.slice(0,2).forEach(e=>console.log('  ✗',e.slice(0,140)));
await b.close();
