/**
 * ⭐ **GATE · EL MECANISMO DE «DOCUMENTOS» ESTÁ LISTO, Y SUENA CUANDO SE PUEDE
 * ENCHUFAR** (S113-C · 2.2.3).
 *
 * ── QUÉ PROBLEMA RESUELVE, Y NO ES EL OBVIO ────────────────────────────────
 * El obvio sería «verificar que el mecanismo exista». Ese no hace falta: si
 * falta, el typecheck lo dice.
 *
 * 🔴 **El modo de falla real es quedarse preparado para siempre.** Una pieza
 * apagada esperando a otra pista no tiene síntoma: compila, no rompe nada, y
 * *su silencio se lee como salud cada vez que alguien corre los gates.* El día
 * que el bloqueante desaparece **nadie se entera**, porque lo que cambió está
 * en el archivo de otro.
 *
 * Por eso este gate mira **las dos cosas**:
 *   ① que el mecanismo siga completo de este lado (ref · onLayout · función);
 *   ② que `FilaAcciones` **siga sin** aceptar el cuarto slot con glifo.
 *
 * **Cuando ② deje de ser cierto, este gate se pone ROJO** — y su rojo dice
 * exactamente qué hacer: enchufar `irADocumentos` y borrar este archivo.
 * *Un gate atado a un bloqueante ajeno es la única forma de que la puerta se
 * abra sola el día que la llave existe.*
 *
 * ── LO QUE NO MIDE, dicho por nombre ───────────────────────────────────────
 * ⚠️ No prueba que el scroll **aterrice** donde debe: eso es geometría en
 * pantalla y se mide con una captura, no con un regex. Su verde dice «el
 * mecanismo está entero y su puerta sigue cerrada», jamás «funciona».
 */
import { readFileSync } from 'node:fs';

const PERFIL = 'apps/cliente/src/app/(tabs)/hogar/mascota/[mascotaId].tsx';
const PIEZA = 'packages/ui/src/components/FilaAcciones.tsx';

const leer = (r) => {
  try {
    return readFileSync(r, 'utf8');
  } catch {
    return null;
  }
};

const perfil = leer(PERFIL);
const pieza = leer(PIEZA);

if (perfil === null || pieza === null) {
  console.log('⚠️  NO CONCLUYENTE — no pude leer uno de los dos archivos:');
  console.log(`   ${PERFIL}: ${perfil === null ? 'FALTA' : 'ok'}`);
  console.log(`   ${PIEZA}: ${pieza === null ? 'FALTA' : 'ok'}`);
  console.log('   (no es que el mecanismo esté mal: es que no pude mirar)');
  process.exit(2);
}

/* ① Las tres partes del mecanismo. Se miden por FORMA y no por comentario:
   un comentario que dice «acá está el ref» sobrevive al ref borrado. */
const partes = [
  ['la función de destino', /const irADocumentos = useCallback\(/.test(perfil)],
  ['el ref del ScrollView', /ref=\{scrollRef\}/.test(perfil) && /const scrollRef = useRef</.test(perfil)],
  ['la medición del bloque', /yDocumentosRef\.current = e\.nativeEvent\.layout\.y/.test(perfil)],
  ['despliega antes de scrollear', /setDocsAbiertos\(true\);[\s\S]{0,400}scrollTo/.test(perfil)],
];

const rotas = partes.filter(([, ok]) => !ok);
for (const [q, ok] of partes) console.log(`  ${ok ? '✓' : '✗'} ${q}`);

/* ② El bloqueante: ¿la pieza sigue con el slot `nexo` sin glifo? */
const slotNexo = /^\s+nexo\??:\s*AccionPerfil\s*$/m.test(pieza);
const aceptaDocumentos = /documentos\s*\??:/i.test(pieza);

console.log('');
console.log(`  bloqueante · FilaAcciones: slot \`nexo\` sin glifo = ${slotNexo ? 'SÍ (sigue cerrado)' : 'NO'}`);
console.log(`             · ¿ya acepta \`documentos\`? = ${aceptaDocumentos ? 'SÍ' : 'no'}`);

if (rotas.length > 0) {
  console.log('');
  console.log(`🔴 el mecanismo está incompleto: falta ${rotas.map(([q]) => q).join(' · ')}`);
  console.log('   Se preparó entero a propósito; si algo se retiró, se retira TODO o no se retira nada.');
  process.exit(1);
}

if (!slotNexo || aceptaDocumentos) {
  console.log('');
  console.log('🔴 **EL BLOQUEANTE SE FUE — ENCHUFÁ EL MECANISMO.**');
  console.log('   `FilaAcciones` ya acepta el cuarto slot, así que `irADocumentos`');
  console.log('   deja de ser una pieza apagada y pasa a ser motor sin puerta (`L-318`).');
  console.log('');
  console.log('   Cura: pasarle la acción a la pieza y **borrar este gate**, que');
  console.log('   existió sólo para que este día no pasara en silencio.');
  process.exit(1);
}

console.log('');
console.log('✓ VERDE · el mecanismo está entero y su puerta sigue cerrada.');
console.log('  ⚠️ Su verde NO dice «el scroll aterriza bien»: eso se mira en una captura.');
