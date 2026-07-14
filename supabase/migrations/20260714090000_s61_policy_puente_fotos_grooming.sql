-- S61-A2 — POLICY PUENTE para las fotos de grooming (hallazgo de raíz
-- del assert T8): el uploader del prestador (subir-evidencia-grooming,
-- territorio B) sube HOY al bucket del paseo ('cita-archivos') aunque
-- registra la fila en evento_grooming_archivos — el objeto REAL de la
-- foto de entrega del E2E juez vive en cita-archivos (relevado
-- literal). La policy de acceso-por-mascota de ese bucket solo mira
-- evento_archivo_adjunto → el dueño no podía firmar la foto grooming
-- en NINGÚN bucket. Nace la gemela que mira evento_grooming_archivos.
-- La policy de 'grooming-archivos' (20260714060000) QUEDA — cubre el
-- destino correcto cuando la B mueva su uploader (pedido declarado en
-- el reporte de la tanda); el wrapper del dueño firma con fallback de
-- bucket mientras tanto. Nace policy, no función → L-140 no aplica.

create policy cita_archivos_select_acceso_mascota_grooming
  on storage.objects for select to authenticated
  using (
    bucket_id = 'cita-archivos'
    and exists (
      select 1
      from public.evento_grooming_archivos a
      where a.storage_path = objects.name
        and public.user_tiene_acceso_a_mascota(a.mascota_id)
    )
  );
