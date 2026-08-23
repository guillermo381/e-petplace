#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// verify-dns-correo — LOS CINCO REGISTROS QUE HACEN QUE EL CORREO SALGA Y ENTRE
//
// POR QUÉ EXISTE (S104-D, 23-ago-2026): activar el correo del dominio en el
// panel de Hostinger **borró `resend._domainkey`**, el registro que firma
// nuestro correo saliente. No lo cazó ningún gate: lo cazó que el founder
// pidiera verificar antes de cargar otra cosa. El daño fue cero por suerte
// —el valor estaba capturado en una medición de tres horas antes—, y la
// conclusión de la mesa fue: **vale una re-medición programada, no confianza.**
//
// ⚠️ EL MODO DE FALLA QUE ESTE INSTRUMENTO EXISTE PARA CAZAR ES EL SILENCIO.
// Un DKIM borrado NO tira ningún error: el correo se sigue enviando, se sigue
// aceptando, y solo se degrada del otro lado —en la reputación y en el reenvío,
// que es donde nadie mira—. *Un registro que desaparece no avisa: deja de
// avisar.* Por eso esto no es un lint de prolijidad: es la única cosa que se
// entera.
//
// USO
//   node scripts/verify-dns-correo.mjs              → mide y falla si algo cambió
//   node scripts/verify-dns-correo.mjs --autoprueba → prueba que SABE fallar
//
// SALIDAS
//   0 → los cinco están y son los esperados
//   1 → falta alguno o cambió  (ROJO)
//   2 → no se pudo medir (sin `dig`) — NO CONCLUYENTE, jamás verde
//
// El 2 es deliberado y copia el criterio de `verify-edge-deno` y del brazo C de
// R63: **«no puedo medir» no es «está bien»**. Un instrumento que da verde
// cuando no midió es peor que no tenerlo, porque además tranquiliza.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';

const DOMINIO = 'epetplace.com';

// Los dos NS autoritativos del dominio + dos resolvers públicos de control.
// Se pregunta a los AUTORITATIVOS porque son el objeto; los públicos se miran
// para distinguir «se borró» de «todavía no propagó».
const AUTORITATIVOS = ['ns1.dns-parking.com', 'ns2.dns-parking.com'];
const PUBLICOS = ['8.8.8.8', '1.1.1.1'];

const DKIM_RESEND =
  'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8ISIFguIdpxW0J8CbPxP5Yiv7H18qpkV4' +
  'DC/02GfNzRmqTOKMMTgkV6EtnfHEM8VwgKveX0EKMCo0IysQhNnnzodxOvZ1n84xHrVoR1rQb1' +
  'lELmR1epCHPv+HUjKjBE8CDpq0fYE732qpmvEUU1DvU/+7r/h3CyCb0zP3O/TVmwIDAQAB';

/** `igual` = byte a byte. `contiene` = el registro puede crecer sin romperse. */
const ESPERADOS = [
  {
    id: 'DKIM · la firma de lo que SALE',
    nombre: `resend._domainkey.${DOMINIO}`,
    tipo: 'TXT',
    modo: 'igual',
    valor: DKIM_RESEND,
    porque: 'sin esto el correo sale sin firma verificable, y un reenvío pierde sus dos patas',
  },
  {
    id: 'SPF del return-path',
    nombre: `send.${DOMINIO}`,
    tipo: 'TXT',
    modo: 'contiene',
    valor: 'include:amazonses.com',
    porque: 'es la pata SPF que hoy sostiene el DMARC por alineación relajada',
  },
  {
    id: 'MX del return-path (rebotes)',
    nombre: `send.${DOMINIO}`,
    tipo: 'MX',
    modo: 'contiene',
    valor: 'feedback-smtp',
    porque: 'sin esto no nos enteramos de los rebotes',
  },
  {
    id: 'MX del apex (lo que ENTRA)',
    nombre: DOMINIO,
    tipo: 'MX',
    modo: 'contiene',
    valor: 'hostinger.com',
    porque: 'sin esto hola@ y privacidad@ dejan de recibir y nadie se entera',
  },
  {
    id: 'DMARC',
    nombre: `_dmarc.${DOMINIO}`,
    tipo: 'TXT',
    modo: 'contiene',
    valor: 'v=DMARC1',
    porque: 'es la política del dominio; si lleva rua, además es el único monitoreo',
  },
];

function consultar(servidor, tipo, nombre) {
  const salida = execFileSync('dig', [`@${servidor}`, tipo, nombre, '+short', '+time=5', '+tries=2'], {
    encoding: 'utf8',
    timeout: 20000,
  });
  return salida
    .split('\n')
    .map((l) => l.trim().replace(/"/g, '').replace(/\s+/g, ' '))
    .filter(Boolean)
    .join(' ');
}

function hayDig() {
  try {
    execFileSync('dig', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function evaluar(esperado, obtenido) {
  const limpio = obtenido.replace(/\s/g, '');
  if (!limpio) return 'AUSENTE';
  if (esperado.modo === 'igual') {
    return limpio === esperado.valor.replace(/\s/g, '') ? 'OK' : 'DISTINTO';
  }
  return obtenido.includes(esperado.valor) ? 'OK' : 'DISTINTO';
}

function medir(lista, etiquetaDominio) {
  let rojos = 0;
  for (const e of lista) {
    const porServidor = [];
    for (const srv of [...AUTORITATIVOS, ...PUBLICOS]) {
      let veredicto;
      try {
        veredicto = evaluar(e, consultar(srv, e.tipo, e.nombre));
      } catch {
        veredicto = 'SIN_RESPUESTA';
      }
      porServidor.push({ srv, veredicto });
    }
    const autoritativos = porServidor.filter((p) => AUTORITATIVOS.includes(p.srv));
    const malAutoritativo = autoritativos.some((p) => p.veredicto !== 'OK');
    const publicosOk = porServidor.filter((p) => !AUTORITATIVOS.includes(p.srv) && p.veredicto === 'OK').length;

    if (!malAutoritativo) {
      console.log(`  ✓ ${e.id}`);
    } else {
      rojos++;
      const estado = autoritativos[0].veredicto;
      console.log(`  ✗ ${e.id} — ${estado} en el autoritativo`);
      console.log(`      ${e.nombre} (${e.tipo})`);
      console.log(`      por qué importa: ${e.porque}`);
      // Distinguir «se borró» de «todavía no propagó» es la diferencia entre
      // correr a arreglarlo y esperar diez minutos. ⚠️ La pista de propagación
      // SOLO tiene sentido cuando el registro FALTA: si está y no coincide, no
      // hay nada que propagar, y decir «no está» ahí mandaría a diagnosticar lo
      // que no es. El mensaje de un guard es parte del guard.
      if (estado === 'AUSENTE') {
        if (publicosOk > 0) {
          console.log(`      ⓘ los resolvers públicos TODAVÍA lo tienen (${publicosOk}/2) ⇒ borrado reciente, mirá el panel`);
        } else {
          console.log(`      ⓘ los públicos tampoco lo tienen ⇒ NO es propagación pendiente: no está`);
        }
      } else if (estado === 'DISTINTO') {
        console.log(`      ⓘ el registro EXISTE pero no es el esperado ⇒ alguien lo reescribió, no lo borró`);
      }
    }
  }
  return rojos;
}

// ── AUTO-PRUEBA ─────────────────────────────────────────────────────────────
// Un instrumento que nunca se vio fallar no se puede creer cuando da verde.
//
// ⚠️ Y EL CONTROL TIENE QUE PROBAR LO QUE DICE QUE PRUEBA. La primera versión
// de esto medía los mismos registros sobre `example.com` y daba 5/5 rojo — pero
// por la razón equivocada: `ns1.dns-parking.com` **no es autoritativo para
// example.com**, así que lo que detectaba era «este servidor no contesta por ese
// dominio», no «el registro no está». Daba el color bueno por el motivo malo,
// que es la clase de verde flojo que este archivo existe para no tener.
//
// Se prueban los DOS caminos por los que el instrumento puede gritar, cada uno
// contra NUESTRO dominio y NUESTROS autoritativos:
//   (a) AUSENTE  — un nombre que de verdad no existe bajo nuestro dominio
//   (b) DISTINTO — el registro real, con el valor esperado corrompido
if (process.argv.includes('--autoprueba')) {
  console.log('── AUTO-PRUEBA · los dos caminos de rojo, contra nuestro propio dominio\n');

  console.log('(a) AUSENTE — un nombre que no existe, preguntado a nuestros autoritativos:');
  const ausentes = [
    {
      id: 'control · selector inexistente',
      nombre: `noexiste-s104d._domainkey.${DOMINIO}`,
      tipo: 'TXT',
      modo: 'igual',
      valor: DKIM_RESEND,
      porque: 'control: este nombre no existe y tiene que salir AUSENTE',
    },
  ];
  const rojosA = medir(ausentes, DOMINIO);

  console.log('\n(b) DISTINTO — el DKIM REAL, con el valor esperado corrompido:');
  const corruptos = [
    {
      ...ESPERADOS[0],
      id: 'control · DKIM real contra valor corrompido',
      valor: DKIM_RESEND.replace('MIGf', 'XXXX'),
      porque: 'control: el registro está, pero no es el esperado ⇒ tiene que salir DISTINTO',
    },
  ];
  const rojosB = medir(corruptos, DOMINIO);

  console.log('');
  if (rojosA === 1 && rojosB === 1) {
    console.log('✓ AUTO-PRUEBA VERDE — grita por AUSENTE y grita por DISTINTO.');
    console.log('  Los dos caminos probados contra el dominio real. Su verde se puede creer.');
    process.exit(0);
  }
  console.log(`✗ AUTO-PRUEBA ROJA — ausente=${rojosA}/1 distinto=${rojosB}/1. NO confiar en su verde.`);
  process.exit(1);
}

// ── MEDICIÓN REAL ───────────────────────────────────────────────────────────
if (!hayDig()) {
  console.log('⚠️  NO CONCLUYENTE — no hay `dig` en esta máquina, no se midió nada.');
  console.log('   Esto NO es verde: es la ausencia de medición, declarada.');
  process.exit(2);
}

console.log(`── verify-dns-correo · ${DOMINIO} · autoritativos ${AUTORITATIVOS.join(' + ')}`);
const rojos = medir(ESPERADOS, DOMINIO);
console.log('');

if (rojos === 0) {
  console.log(`✓ VERDE — los ${ESPERADOS.length} registros del correo están y son los esperados.`);
  process.exit(0);
}

console.log(`✗ ROJO — ${rojos} de ${ESPERADOS.length} registros fallan.`);
console.log('');
console.log('  ⚠️ PRECEDENTE MEDIDO (S104-D, 23-ago-2026): tocar la sección de correo');
console.log('     en el panel de Hostinger BORRÓ `resend._domainkey`. Si desapareció');
console.log('     otra vez, la causa NO es el valor — es que algo lo está reescribiendo.');
console.log('     El valor bueno está en este mismo archivo, en DKIM_RESEND.');
process.exit(1);
