-- ═══════════════════════════════════════════════════════════════════════════
-- S113-A — `gato-comun`: la PRIMERA ficha por especie que se publica. Van doce.
--
-- ── POR QUÉ ESTA FICHA ES DISTINTA DE LAS ONCE ANTERIORES ───────────────────
-- El primer Batch la devolvió VACÍA, y con razón: se le preguntó por «Gato
-- Común» **como raza**, y eso no es una raza. El archivo por especie le hizo la
-- otra pregunta —qué es un GATO— y ahí sí tuvo respuesta. *No se arregló una
-- ficha mala: se cambió la pregunta.*
--
-- ⚠️ `origen` y `predisposiciones` quedan VACÍOS A PROPÓSITO, y el founder lo
-- aprobó sabiéndolo: una especie no tiene origen ni predisposiciones raciales.
-- «De dónde viene el gato» sería historia de la domesticación —no algo que le
-- sirva a esta familia— y listar predisposiciones «del gato» sería listar todo
-- lo que le puede pasar a un gato. **El prompt por especie hizo lo correcto al
-- callarse ahí**, y la pantalla no dibuja secciones vacías: es su regla.
--
-- ⚠️ Y la VOZ cambia de sujeto: las de raza dicen «suele ser…» sobre una raza;
-- ésta dice «el gato es…» sobre la especie. **Es correcto** —cambió el sujeto de
-- la frase porque cambió el sujeto de la pregunta— y desde hoy conviven las dos
-- voces en la misma pantalla según la mascota tenga raza o no.
--
-- 🔴 La alcanzan CATORCE mascotas, más que cualquiera de las once de raza.
--
-- 76(g) — VEDA: NO RIGE. UPDATE sobre una fila de contenido propio.
-- ═══════════════════════════════════════════════════════════════════════════
begin;
update public.razas_contenido
   set activo = true,
       revisado_por = '75d0798a-ea90-4a97-a2f2-74f3234d892a'::uuid,
       revisado_en = now()
 where especie = 'gato' and raza_codigo = 'gato-comun' and conocida;
commit;
