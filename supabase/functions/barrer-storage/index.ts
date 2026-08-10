// ============================================================================
// barrer-storage — EL BRAZO CON CREDENCIAL DE D-731
//
// Postgres encola la intención de borrar un objeto; no puede ejecutarla. Un
// `DELETE` sobre `storage.objects` lo rebota `storage.protect_delete`
// (`42501: Direct deletion from storage tables is not allowed`), y aun sin ese
// trigger, borrar la fila dejaría el blob vivo — el huérfano al revés. El
// borrado real exige la Storage API, o sea una credencial que la DB no debe
// tener. Esta function es esa credencial, y nada más.
//
// Mismo camino que los tres despachadores curados el 9-ago: pg_cron toca el
// timbre por `pg_net` con `x-despacho-secret`, el guard de `_shared/despacho.ts`
// decide, y la function solo EJECUTA lo que la cola ya declaró.
//
// ── LA REGLA QUE GOBIERNA EL CUERPO: NADA SE PIERDE EN SILENCIO ─────────────
// «Si el borrado del objeto falla, NO se pierde: reintenta y queda visible. Un
// borrado que falla en silencio es el mismo defecto con otra cara» (founder).
// Por eso:
//   · se marca `borrado` **solo lo que la API confirma**, jamás por ausencia
//     de error — *un array vacío no es una confirmación*;
//   · lo no confirmado se re-verifica contra el bucket antes de llamarlo
//     fallo, para distinguir **«no se pudo borrar»** de **«ya no estaba»**
//     (los dos terminan sin objeto, pero solo uno es un problema);
//   · un fallo real incrementa `intentos` y guarda su causa literal;
//   · al llegar al techo la fila pasa a `fallido` y **deja de reintentar,
//     pero no desaparece** — vive en `v_storage_borrado_atascado`.
//
// ── LO QUE ESTA FUNCTION NO DECIDE ─────────────────────────────────────────
// Qué se borra. Eso lo decidió quien encoló. Acá no hay política de retención,
// ni filtros por bucket, ni excepciones: si está en la cola, se ejecuta. *Una
// segunda opinión en el brazo ejecutor haría que la cola mienta sobre lo que
// va a pasar.*
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { guardDespacho } from '../_shared/despacho.ts';

/** Tras 5 intentos la fila para y queda visible. Un path que no se puede
 *  borrar no mejora reintentando para siempre — y el ruido de un reintento
 *  eterno esconde al que sí importa. */
const TECHO_INTENTOS = 5;
/** Techo por tick: la cola es rara y chica; procesarla de a poco evita que un
 *  pico ocupe el minuto entero. */
const POR_TICK = 50;

type Fila = {
  id: string;
  bucket: string;
  objeto: string;
  intentos: number;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'solo_post' }, { status: 405 });
  }

  const rechazo = guardDespacho(req);
  if (rechazo) return rechazo;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: pendientes, error: errorSel } = await supabase
    .from('storage_borrado_pendiente')
    .select('id, bucket, objeto, intentos')
    .eq('estado', 'pendiente')
    .lt('intentos', TECHO_INTENTOS)
    .order('encolado_en', { ascending: true })
    .limit(POR_TICK);

  if (errorSel) {
    return Response.json({ error: 'lectura_fallo', causa: errorSel.message }, { status: 500 });
  }
  if (!pendientes || pendientes.length === 0) {
    return Response.json({ ok: true, procesadas: 0, borrados: 0, atascados: 0 });
  }

  // Un round-trip por bucket, no uno por objeto.
  const porBucket = new Map<string, Fila[]>();
  for (const f of pendientes as Fila[]) {
    porBucket.set(f.bucket, [...(porBucket.get(f.bucket) ?? []), f]);
  }

  const ahora = new Date().toISOString();
  let borrados = 0;
  let atascados = 0;

  for (const [bucket, filas] of porBucket) {
    const { data: quitados, error: errorDel } = await supabase
      .storage.from(bucket)
      .remove(filas.map((f) => f.objeto));

    // Falla dura de la API: ninguna de estas filas se resolvió. Se cuentan
    // todas como intento y se reintentan en el tick siguiente.
    if (errorDel) {
      for (const f of filas) {
        await marcarIntento(supabase, f, `api_remove: ${errorDel.message}`, ahora);
        atascados++;
      }
      continue;
    }

    const confirmados = new Set((quitados ?? []).map((o: { name: string }) => o.name));

    for (const f of filas) {
      if (confirmados.has(f.objeto)) {
        await supabase
          .from('storage_borrado_pendiente')
          .update({ estado: 'borrado', resuelto_en: ahora, ultimo_intento_en: ahora })
          .eq('id', f.id);
        borrados++;
        continue;
      }

      // No confirmado. **Antes de llamarlo fallo se pregunta si el objeto está.**
      // Sin esta rama, un path que nunca existió —una fila sembrada, un
      // registro con typo— reintentaría cinco veces y terminaría marcado como
      // problema cuando en realidad ya no hay nada que borrar.
      const barra = f.objeto.lastIndexOf('/');
      const carpeta = barra === -1 ? '' : f.objeto.slice(0, barra);
      const archivo = f.objeto.slice(barra + 1);
      const { data: listado, error: errorList } = await supabase
        .storage.from(bucket)
        .list(carpeta, { search: archivo, limit: 100 });

      // 🔴 SIN ESTA RAMA, LA CURA TENÍA EL DEFECTO QUE VINO A CURAR.
      // Un `list` que falla devuelve `data` vacío igual que una carpeta vacía.
      // Leer ese vacío como «ya no estaba» hace que un bucket inexistente —o
      // una credencial revocada, o un corte de red— se reporte como borrado
      // exitoso. *Un vacío que no se pudo consultar no es una respuesta: es la
      // ausencia de una.* Lo cazó el ensayo de fallo, no la revisión.
      if (errorList) {
        await marcarIntento(supabase, f, `api_list: ${errorList.message}`, ahora);
        atascados++;
        continue;
      }

      const sigueAhi = (listado ?? []).some((o: { name: string }) => o.name === archivo);

      if (!sigueAhi) {
        await supabase
          .from('storage_borrado_pendiente')
          .update({
            estado: 'borrado',
            resuelto_en: ahora,
            ultimo_intento_en: ahora,
            ultimo_error: 'el objeto ya no estaba en el bucket',
          })
          .eq('id', f.id);
        borrados++;
      } else {
        await marcarIntento(supabase, f, 'la API no lo quitó y el objeto sigue en el bucket', ahora);
        atascados++;
      }
    }
  }

  return Response.json({ ok: true, procesadas: pendientes.length, borrados, atascados });
});

/** Un intento fallido: cuenta, causa literal, y al techo pasa a `fallido`
 *  **sin borrarse** — la fila es la única memoria de que ese objeto debía
 *  irse. */
async function marcarIntento(
  supabase: ReturnType<typeof createClient>,
  fila: Fila,
  causa: string,
  ahora: string,
) {
  const intentos = fila.intentos + 1;
  await supabase
    .from('storage_borrado_pendiente')
    .update({
      intentos,
      ultimo_error: causa,
      ultimo_intento_en: ahora,
      estado: intentos >= TECHO_INTENTOS ? 'fallido' : 'pendiente',
    })
    .eq('id', fila.id);
}
