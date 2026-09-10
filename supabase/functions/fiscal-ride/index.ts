// ═══════════════════════════════════════════════════════════════════════════
// fiscal-ride · genera el RIDE de un documento y lo deja en el bucket privado
//
// 🔴 EL RIDE ES NUESTRO Y NO DEL PROVEEDOR. El simulador emite XML y no PDF, y
//    la puerta manual y la contingencia del vet lo necesitan igual con
//    cualquier proveedor. *Un papel que sólo existe si el proveedor lo manda no
//    está disponible el día que el proveedor no contesta.*
//
// Es IDEMPOTENTE por diseño: re-generar el mismo documento pisa el mismo objeto
// —el canónico está congelado, así que el PDF sale idéntico— y `pdf_url` no
// cambia. Regenerar no crea un segundo papel.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { rideDesdeCanonico } from '../_shared/facturacion/ride.ts';
import type { DocumentoCanonico } from '../_shared/facturacion/canonico.ts';

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

Deno.serve(async (req) => {
  const secreto = Deno.env.get('DESPACHO_SECRET') ?? '';
  if (!secreto || req.headers.get('x-despacho-secret') !== secreto) {
    return json({ ok: false, codigo: 'no_autorizado' }, 401);
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let documentoId: string | null = null;
  try { documentoId = (await req.json())?.documento_id ?? null; } catch { /* cuerpo vacío */ }

  /* Sin id, procesa los que están autorizados y todavía no tienen papel — así
     el reloj puede llamarlo sin saber cuáles son. */
  const q = db.from('documentos_fiscales')
    .select('*')
    .eq('sentido', 'emitido')
    .not('canonico', 'is', null)
    .is('pdf_url', null)
    .limit(20);
  const { data: docs } = documentoId
    ? await db.from('documentos_fiscales').select('*').eq('id', documentoId).limit(1)
    : await q;

  const hechos: unknown[] = [];
  for (const d of docs ?? []) {
    try {
      if (!d.canonico) { hechos.push({ id: d.id, resultado: 'sin_canonico' }); continue; }
      const numero = [d.establecimiento, d.punto_emision, d.secuencial].every(Boolean)
        ? `${d.establecimiento}-${d.punto_emision}-${d.secuencial}`
        : (d.clave_acceso ?? d.id);

      const pdf = await rideDesdeCanonico({
        canonico: d.canonico as unknown as DocumentoCanonico,
        claveAcceso: d.clave_acceso ?? '',
        numero,
        estado: d.estado,
        autorizadoEn: d.autorizado_en,
      });

      /* La ruta lleva el AÑO y el id: un bucket plano con miles de papeles no
         se puede recorrer, y el id evita que dos documentos del mismo número
         —que no deberían existir, pero— se pisen sin decirlo. */
      const ruta = `${d.fecha_emision.slice(0, 4)}/${numero}-${d.id}.pdf`;
      const { error: eUp } = await db.storage.from('fiscal')
        .upload(ruta, pdf, { contentType: 'application/pdf', upsert: true });
      if (eUp) throw new Error(`storage: ${eUp.message}`);

      const { error: eDb } = await db.from('documentos_fiscales')
        .update({ pdf_url: ruta }).eq('id', d.id);
      /* 🔴 Su error SE LEE: si el papel se subió y la fila no lo apunta, el
         documento queda sin RIDE para todo el mundo y el objeto existe igual —
         un huérfano en el bucket que nadie va a ir a buscar. */
      if (eDb) throw new Error(`apuntar_pdf_url: ${eDb.message}`);

      hechos.push({ id: d.id, ruta, bytes: pdf.length });
    } catch (e) {
      await db.from('documentos_fiscales').update({
        motivo_rechazo: `ride: ${String(e).slice(0, 180)}`,
      }).eq('id', d.id);
      hechos.push({ id: d.id, error: String(e).slice(0, 140) });
    }
  }

  return json({ ok: true, procesados: hechos.length, hechos });
});
