// consolidar.mjs — junta todos los JSON en tablas markdown listas para pegar
import fs from 'fs'; import path from 'path';
const SALIDA = process.argv[2] || './salida';
const dir = path.join(SALIDA, 'datos');
if (!fs.existsSync(dir)) { console.error('no hay datos todavía'); process.exit(0); }
const arch = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

// misma precisión que usa el documento: coma decimal, un decimal en %, tres en ratios
const pct = v => v == null ? '—' : (v * 100).toFixed(1).replace('.', ',') + ' %';
const rat = v => v == null ? '—' : v.toFixed(3).replace('.', ',') + ' ×';
const px  = v => v == null ? '—' : v + ' px';

let vit = [], seg = [], comp = [];
for (const f of arch.sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const ref = d.meta?.referente || f;

  if (d.resumen) {                                  // ① vitrina
    const r = d.resumen, de = d.densidad;
    vit.push(`| ${ref} | ${r.n_tarjetas_medidas} | ${pct(r.mediana_imagen_sobre_tarjeta)} | ${pct(r.mediana_alto_imagen_sobre_alto_tarjeta)} | ${pct(r.mediana_control_sobre_tarjeta)} | ${rat(r.mediana_precio_sobre_nombre_fontsize)} | ${de.productos_visibles_primera_pantalla} / ${de.productos_completos_primera_pantalla} | ${px(de.alto_cromo_antes_del_primer_producto_px)} (${String(de.cromo_como_porcentaje_de_pantalla).replace('.', ',')} %) | ${r.controles_que_cumplen_48dp}/${r.controles_medidos} |`);
  }
  if (d.mapa) {                                     // ⑤ seguimiento
    seg.push(d.mapa.mapa_detectado
      ? `| ${ref} | ${String(d.mapa.pct_alto_pantalla_mapa).replace('.', ',')} % | ${String(d.mapa.pct_alto_pantalla_resto).replace('.', ',')} % | ${px(d.mapa.mapa.h)} | detectado |`
      : `| ${ref} | — | — | — | **no se detectó mapa** — ${d.mapa.nota} |`);
  }
  if (d.composicion && !d.resumen) {                // ②③④ composición
    const top = d.composicion.slice(0, 6)
      .map(b => `${b.etiqueta} ${b.alto}px (${String(b.pct_de_pantalla).replace('.', ',')}%)${b.texto ? ' · «' + b.texto.slice(0, 28) + '»' : ''}`)
      .join('<br>');
    comp.push(`| ${ref} | ${d.meta?.superficie || '?'} | ${d.viewport.w}×${d.viewport.h} | ${top || '—'} |`);
  }
}

let md = `# Proporciones medidas — salida del harness\n\n`;
md += `> Todo lo de abajo es \`[MEDIDO]\`: geometría del DOM renderizado con Playwright, sobre **web móvil**,\n`;
md += `> no sobre la app nativa. URL, dispositivo y timestamp de cada medición están en \`datos/*.json\`.\n\n`;

if (vit.length) md += `## ① Tarjeta en grid\n\n| Referente | n | Foto ÷ área tarjeta | Foto ÷ alto tarjeta | Control ÷ área | Precio ÷ nombre | Productos 1ª pantalla (visibles / completos) | Cromo previo | Control ≥48 dp |\n|---|---|---|---|---|---|---|---|---|\n${vit.join('\n')}\n\n`;

if (comp.length) md += `## ②③④ Composición de la primera pantalla\n\n_Los seis bloques superiores de cada pantalla. Para el detalle completo, mirá \`composicion\` en el JSON._\n\n| Referente | Superficie | Viewport | Bloques (alto y % de pantalla) |\n|---|---|---|---|\n${comp.join('\n')}\n\n`;

if (seg.length) md += `## ⑤ Mapa vs resto de la pantalla\n\n> **La segunda columna NO es «banda de estado»**: es todo lo que no es mapa (header, banda, hoja inferior).\n> Para aislar la banda, mirá el bloque correspondiente en \`composicion\` dentro del JSON.\n\n| Referente | Mapa | No-mapa | Alto mapa | Estado |\n|---|---|---|---|---|\n${seg.join('\n')}\n\n`;

if (!vit.length && !seg.length && !comp.length) md += `_Sin mediciones todavía._\n`;

fs.writeFileSync(path.join(SALIDA, 'tabla-proporciones.md'), md);
console.log(md);
