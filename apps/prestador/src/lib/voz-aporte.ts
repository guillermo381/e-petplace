/**
 * LA VOZ DE UN APORTE DEL EXPEDIENTE (S85-C28) — `BIO_EXPEDIENTE` A3.5bis.
 *
 * Espejo del `voz-hecho` del cliente y por la misma razón (Ley 3): **el
 * código del evento jamás sale de acá**, y un tipo desconocido degrada
 * digno en vez de imprimir `atencion_paseo_registrada` en la ficha.
 *
 * ⚠️ **CATÁLOGO CERRADO (regla 36):** los cinco tipos salen del precedente
 * vivo del cliente, no de memoria. Un tipo nuevo cae al genérico **hasta
 * que alguien decida su voz** — jamás se infiere del código.
 *
 * ── POR QUÉ NO SE IMPORTA EL DEL CLIENTE ─────────────────────────────
 * `apps/cliente/src/lib/voz-hecho.ts` **es de otra app**, con otro
 * diccionario y otro registro de voz: el dueño lee *"Recibió la vacuna"*
 * y el prestador lee el hecho profesional. **Compartir el archivo
 * compartiría el idioma**, que es justo lo que no queremos. Lo que se
 * comparte es la FORMA (switch cerrado + genérico digno), y esa se copia
 * a propósito.
 */

/** Firma angosta (patrón `voz-oficio`): solo las keys que usa. */
type TAporte = (
  clave:
    | 'expediente.aportePaseo'
    | 'expediente.aporteGrooming'
    | 'expediente.aporteAdiestramiento'
    | 'expediente.aporteVacuna'
    | 'expediente.aporteConsulta'
    | 'expediente.aporteMomento',
) => string;

export function vozAporte(tipo: string, t: TAporte): string {
  switch (tipo) {
    case 'atencion_paseo_registrada':
      return t('expediente.aportePaseo');
    case 'atencion_grooming_registrada':
      return t('expediente.aporteGrooming');
    case 'atencion_adiestramiento_registrada':
      return t('expediente.aporteAdiestramiento');
    case 'vacuna_aplicada':
      return t('expediente.aporteVacuna');
    case 'historia_clinica_registrada':
      return t('expediente.aporteConsulta');
    default:
      return t('expediente.aporteMomento');
  }
}

/**
 * ⭐ LA LÍNEA DEL NIVEL ③ — la voz que la mesa firmó, con sus dos bordes.
 *
 * > **«El detalle lo tiene {{prestador}}.»**
 *
 * **Enuncia un HECHO sobre dónde vive el detalle, no una negación sobre
 * quien mira** — y ése es literalmente el dato que habilita el handshake
 * que A3.5bis promete. *Toda formulación que describa la restricción
 * («Sin detalle», «No disponible», «No tenés acceso») convierte el nivel
 * ③ en el muro mudo que la ley existe para evitar.*
 *
 * Es hermana del hueco de PLATA en el techo: **ahí no falta información,
 * sobra audiencia; acá el detalle no falta, TIENE DUEÑO.**
 *
 * ── LOS DOS BORDES, adjudicados por la mesa sobre la medición de A ───
 *
 * **① `nivel: 'familia'` NO LLEVA LA FRASE.** Ahí `autor: null` significa
 * **"no aplica"** —lo declaró el dueño, no un prestador— y esas filas
 * llegan **con su contenido entero**. Aplicarles el template imprimiría
 * *«El detalle lo tiene null»* sobre algo que se está viendo completo.
 * Por eso esta función **solo se llama para `'existencia'`**, y el
 * llamador lo hace explícito.
 *
 * **② `'existencia'` con `autor: null`** —hoy 0 de 86, pero posible con
 * un negocio borrado— dice **«El detalle lo tiene otro prestador.»**
 * Nunca un espacio en blanco, nunca el id.
 *
 * > **"No sé quién" NO es lo mismo que "no aplica", y ninguno de los dos
 * > es un valor válido.** Tres representaciones distintas para tres
 * > hechos distintos: es L-197 en su tercera aplicación del día.
 */
type TDetalle = (
  clave: 'expediente.detalleLoTiene' | 'expediente.detalleLoTieneOtro',
  vars?: { prestador: string },
) => string;

export function vozDetalleAjeno(autor: string | null, t: TDetalle): string {
  return autor !== null && autor !== ''
    ? t('expediente.detalleLoTiene', { prestador: autor })
    : t('expediente.detalleLoTieneOtro');
}
