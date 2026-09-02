-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · 20260907740000 · LOS TRES TEXTOS v1.0 DEL ABOGADO — y el ACTA como
-- PLANTILLA. Adenda 5 y 6.
--
-- 🔴 POR QUÉ HAY UNA CARGA ANTERIOR QUE SE JUBILA, dicho sin maquillar:
-- unas horas antes cargué `terminos_refugio` y `condiciones_adopcion` de una
-- versión que el abogado corrigió después (le faltaban §4.4 REMETFU y §5.2.1,
-- la regla de los seis meses). **Medido con grep contra la base antes de
-- escribir esto: los dos daban `5.2.1 = false`.**
--
-- **NO SE SOBRESCRIBE UN TEXTO CARGADO — NUNCA.** Las filas viejas se marcan
-- `vigente=false` y las nuevas entran como versión 2. *Un texto legal que se
-- edita en su lugar deja a cualquier aceptación previa apuntando a algo que ya
-- no dice lo mismo, y nadie puede probar qué aceptó.* Esta migración además lo
-- vuelve IMPOSIBLE, no sólo prohibido: nace un trigger que rebota todo UPDATE
-- sobre `contenido`.
--
-- ⚠️ `version` ES UN CONTADOR INTERNO, NO LA ETIQUETA DEL DOCUMENTO. Los tres
-- textos se llaman «Versión 1.0» en su propio cuerpo; acá `terminos_refugio` y
-- `condiciones_adopcion` entran como **2** porque son la segunda fila de esa
-- clave. *Se declara porque es exactamente la clase de divergencia que alguien
-- lee mal dentro de seis meses.*
--
-- EL ACTA ENTRA COMO PLANTILLA (`es_plantilla=true`), con la notación que el
-- abogado declaró en su cabecera: `{{variable}}`, `{{variable|si vacío}}`,
-- `[[si …]]…[[/si]]`. **Su hash es el hash de la PLANTILLA.** El hash que se
-- firma es otro: el del texto ya sustituido, y ese lo produce la pieza de firma
-- —que NO existe todavía—. *Son dos hashes distintos a propósito y no se
-- pueden confundir: uno prueba qué plantilla regía, el otro qué se firmó.*
--
-- 76(g): **NO RIGE** — cero backfill. El UPDATE de `vigente` toca las dos filas
-- que esta misma sesión escribió hace una hora, y sus ids están acá.
--
-- REVERSA ESCRITA ANTES:
--   docs/relevamientos/S112-A-REVERSA-20260907740000-textos-v10-y-acta.sql
--   ⚠️ borrar el acta VUELVE A CERRAR la puerta del traspaso.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.adopcion_documentos
  ADD COLUMN IF NOT EXISTS es_plantilla boolean NOT NULL DEFAULT false;

/* ═══ EL TEXTO CARGADO ES INMUTABLE ════════════════════════════════════════
   La regla «nunca se sobrescribe un texto cargado» vivía en una instrucción.
   Una instrucción la cumple el que se acuerda; esto la cumple siempre. */
CREATE OR REPLACE FUNCTION public._trg_adopcion_documentos_texto_inmutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public','pg_temp' AS $trg$
BEGIN
  IF NEW.contenido IS DISTINCT FROM OLD.contenido THEN
    RAISE EXCEPTION 'texto_legal_inmutable: % v% — se carga una version nueva, no se edita',
      OLD.codigo, OLD.version USING ERRCODE='22023';
  END IF;
  RETURN NEW;
END $trg$;

DROP TRIGGER IF EXISTS adopcion_documentos_texto_inmutable ON public.adopcion_documentos;
CREATE TRIGGER adopcion_documentos_texto_inmutable
  BEFORE UPDATE ON public.adopcion_documentos
  FOR EACH ROW EXECUTE FUNCTION public._trg_adopcion_documentos_texto_inmutable();

-- La carga anterior se JUBILA (no se borra: es historia de qué regía y cuándo).
UPDATE public.adopcion_documentos SET vigente = false
 WHERE codigo IN ('terminos_refugio','condiciones_adopcion') AND version = 1;

INSERT INTO public.adopcion_documentos (codigo, version, contenido, vigente_desde, vigente, es_plantilla)
VALUES ('terminos_refugio', 2, $texto$TÉRMINOS Y CONDICIONES — CUENTA DE REFUGIO O RESCATISTA

1. Identificación de la Compañía y objeto

1.1. La plataforma digital identificada con la marca comercial e-PetPlace es operada por SATORI INOV LATAM S.A.S., sociedad constituida en la República del Ecuador, RUC 1793240435001, con domicilio en la Av. de los Shyris y Av. República de El Salvador, esquina, Edificio IQON, oficina 2705, barrio La Carolina, Quito, Pichincha (en adelante, "e-PetPlace" o "la Compañía"). Canal de privacidad: privacidad@epetplace.com. Canal operativo: hola@epetplace.com.

1.2. Estos Términos regulan exclusivamente la Cuenta de Refugio o Rescatista, destinada a publicar animales en adopción y a recibir donaciones en especie a través del programa de padrinazgo. No regulan la prestación de servicios remunerados, que se rige por los Términos y Condiciones — Usuario Profesional, ni la relación con las familias, que se rige por los Términos y Condiciones — Pet Parent.

2. Definiciones

Refugio: la organización sin fines de lucro legalmente constituida, o la persona natural rescatista verificada, titular de la cuenta regulada por estos Términos. Animal Publicado: el animal que el Refugio ofrece en adopción a través de la Plataforma. Postulante: el Usuario Cliente que solicita adoptar un Animal Publicado. Acta de Adopción: el documento digital que suscriben el Refugio y la persona adoptante para formalizar cada entrega. Padrinazgo: el programa por el cual un Usuario Cliente adquiere productos del catálogo y los destina al Refugio.

3. Naturaleza de la cuenta

3.1. La Cuenta de Refugio es gratuita. El Refugio no paga comisión, cuota ni cargo alguno por su uso, y la Compañía no percibe valor alguno por las adopciones.

3.2. La cuenta no habilita a ofrecer servicios remunerados, a vender productos ni a aparecer en el catálogo de servicios de la Plataforma. Un Refugio que además preste servicios remunerados requiere una cuenta de Usuario Profesional separada, bajo sus propios términos.

3.3. La Compañía actúa como facilitadora del contacto y del registro documental. No asigna animales, no evalúa ni aprueba adoptantes, no puntúa postulaciones y no interviene en la decisión de adopción, que corresponde exclusivamente al Refugio.

4. Verificación y alta

4.1. El alta de la cuenta es manual y requiere aprobación previa de la Compañía. No existe autoregistro.

4.2. Requisitos: (a) para organizaciones: personalidad jurídica vigente conforme al Reglamento de Personas Jurídicas sin Fines de Lucro (Decreto Ejecutivo 193), RUC activo, e identificación de su representante legal; (b) para rescatistas independientes: identidad verificada, mayoría de edad y trayectoria comprobable en rescate o cuidado animal, acreditada por los medios que la Compañía solicite.

4.3. Alcance de la verificación. La Compañía verifica la identidad y, en su caso, la constitución legal del Refugio antes de habilitar la cuenta, y puede re-verificarlas periódicamente. Esta verificación no constituye garantía sobre los animales entregados, sobre el estado sanitario declarado ni sobre las decisiones de adopción, que corresponden exclusivamente al Refugio.

4.4. Los Refugios que operan en el Distrito Metropolitano de Quito deberán acreditar, cuando les sea exigible, su inscripción en el Registro Metropolitano de Fauna Urbana (REMETFU) como centro de adopción, y declaran que no aplican el sacrificio de animales sanos como método de control, práctica prohibida por la normativa metropolitana.

4.5. El Refugio se obliga a mantener actualizada su información y a comunicar sin demora la pérdida de vigencia de su personalidad jurídica o cualquier cambio de representante.

5. Publicación de animales — declaraciones del Refugio

5.1. Por cada Animal Publicado, el Refugio declara y garantiza:

a) que se encuentra legítimamente facultado para entregarlo en adopción — por haberlo rescatado en situación de abandono o por haberlo recibido mediante cesión voluntaria documentada de su anterior tenedor — y que no conoce reclamo de propiedad pendiente sobre él; b) que la información sanitaria y de comportamiento publicada — vacunas, esterilización, tratamientos, condiciones conocidas — es veraz y completa según su leal saber, y que no oculta condiciones de salud o comportamiento que conozca; c) que el animal permanece bajo su cuidado y responsabilidad exclusivos hasta la entrega formalizada mediante el Acta de Adopción.

5.2. La ficha de cada Animal Publicado indica, como mínimo: especie, sexo, edad estimada, estado de esterilización, estado vacunal, identificación por microchip y registro municipal cuando existan, y las condiciones de salud o comportamiento relevantes para la decisión de adoptar.

5.2.1. Los animales mayores de seis meses se publican y entregan esterilizados, conforme a la obligación que la normativa metropolitana impone a su tenedor. Los menores de seis meses pueden entregarse con el compromiso de esterilización asumido por la persona adoptante en el Acta de Adopción.

5.3. Está prohibido publicar animales con fines de venta, crianza o cualquier finalidad distinta de la adopción, así como publicar información falsa o fotografías que no correspondan al animal.

6. Postulaciones y decisión

6.1. El Refugio recibe las postulaciones dirigidas a sus Animales Publicados y decide libremente sobre cada una, conforme a sus propios criterios. La postulación no genera derecho a adoptar.

6.2. El Refugio se obliga a responder cada postulación —aceptándola, rechazándola o solicitando información adicional— dentro de un plazo razonable, que no excederá de diez (10) días, y a tratar a los Postulantes con respeto, absteniéndose de exigirles información impertinente a la evaluación.

6.3. Entre la postulación y la entrega, el animal permanece bajo la responsabilidad del Refugio.

7. Acta de Adopción obligatoria

7.1. Toda entrega de un Animal Publicado se formaliza mediante el Acta de Adopción digital de la Plataforma, suscrita por el Refugio y la persona adoptante con el mecanismo de firma electrónica de la aplicación. La entrega de un Animal Publicado por fuera del Acta constituye incumplimiento grave.

7.2. Con la suscripción del Acta, el expediente del animal se transfiere a la cuenta de la persona adoptante y el Refugio queda registrado como procedencia.

7.3. Las declaraciones de la §5.1 se reiteran en el Acta frente a la persona adoptante. El Refugio responde por su veracidad ante la persona adoptante y ante la Compañía.

7.4. El Refugio puede ejercer el seguimiento post-adopción y requerir la restitución del animal únicamente en los términos previstos en el Acta.

8. Bonos de adopción

8.1. Si el Refugio percibe un bono o contribución de adopción, este se acuerda y paga directamente entre el Refugio y la persona adoptante, fuera de la Plataforma, y debe ser informado a la persona postulante antes del primer encuentro con el animal, indicando su monto y destino.

8.2. Está prohibido utilizar la Plataforma, sus medios de pago o su mensajería para cobrar bonos, así como condicionar la adopción a pagos no informados previamente. La Compañía no interviene en los bonos, no los garantiza y no responde por ellos.

9. Datos de los Postulantes

9.1. El Refugio recibe los datos de cada Postulante con la única finalidad de evaluar la postulación sobre el animal solicitado. En este tratamiento, el Refugio se obliga a:

a) no conservar los datos fuera de la Plataforma, ni copiarlos, exportarlos o incorporarlos a registros propios; b) no utilizarlos para ninguna otra finalidad — incluida la difusión, la promoción de otros animales o campañas, o la incorporación a listas de contacto; c) no contactar al Postulante para asuntos ajenos a su postulación; d) guardar confidencialidad sobre la información recibida, incluida la composición del hogar del Postulante.

9.2. Las postulaciones no concretadas se eliminan de la Plataforma conforme a los plazos de la Política de Privacidad. El incumplimiento de esta sección es causal de terminación inmediata, sin perjuicio de la responsabilidad del Refugio ante la autoridad de protección de datos.

10. Padrinazgo y donaciones en especie

10.1. A través del programa de Padrinazgo, los Usuarios Clientes adquieren productos del catálogo y los destinan al Refugio. La donación la realiza el Usuario Cliente; la Compañía actúa como vendedora de los productos y mandataria para su entrega. La Compañía aporta adicionalmente el porcentaje que tenga públicamente ofrecido sobre esas compras, con cargo propio.

10.2. El Refugio se obliga a: (a) suscribir el acta de entrega-recepción de cada entrega, con detalle de productos, cantidades y fecha; (b) destinar lo recibido a los fines propios de su actividad de protección animal; (c) mantener vigentes su constitución legal, su RUC y sus obligaciones formales, de las que dependen su exención tributaria y el tratamiento fiscal de las donaciones; y (d) proporcionar al padrino, a través de la Plataforma, las fotografías o constancias del animal apadrinado ofrecidas por el programa, sin incluir en ellas datos personales de terceros.

10.3. El Padrinazgo no otorga al padrino derecho alguno sobre el animal ni sobre el Refugio.

11. Bienestar animal y conducta

11.1. El Refugio se obliga a cumplir la normativa nacional y municipal de protección y bienestar animal aplicable a su actividad, incluidas las obligaciones de esterilización, identificación y registro que correspondan.

11.2. Constituyen causal de terminación inmediata, y en su caso de denuncia ante las autoridades: el maltrato o abandono de animales; la venta encubierta de animales bajo apariencia de adopción; la publicación de información falsa; la entrega de animales fuera del Acta; y el uso indebido de datos de Postulantes.

12. Contenidos

12.1. El Refugio conserva la titularidad de los contenidos que publica y concede a la Compañía una licencia no exclusiva, gratuita y revocable para exhibirlos en la Plataforma y en las comunicaciones que promocionen la adopción, mientras la cuenta esté activa.

12.2. El Refugio declara contar con los derechos sobre las imágenes que publica y se obliga a que estas no incluyan datos personales de terceros.

13. Responsabilidad

13.1. El Refugio es responsable del cuidado del animal hasta su entrega, de la veracidad de sus declaraciones y publicaciones, de sus decisiones de adopción y del cumplimiento de la normativa aplicable a su actividad.

13.2. La Compañía responde por la verificación descrita en la §4.3, por el funcionamiento de la Plataforma y por la conservación de las Actas y registros. No responde por el estado, comportamiento o destino de los animales, ni por las decisiones del Refugio ni de las personas adoptantes.

13.3. El Refugio mantendrá indemne a la Compañía frente a reclamos derivados de la falsedad de sus declaraciones, de la entrega de animales sobre los que no tenía legítima disponibilidad, o del incumplimiento de estos Términos. Ninguna disposición de estos Términos limita los derechos que la ley reconoce a los consumidores.

14. Datos personales del Refugio

Los datos del Refugio, de su representante y de los rescatistas se tratan conforme a la Política de Privacidad de e-PetPlace. El canal para el ejercicio de derechos es privacidad@epetplace.com.

15. Suspensión y terminación

15.1. El Refugio puede cerrar su cuenta en cualquier momento; las Actas suscritas y la trazabilidad de los animales entregados se conservan conforme a la Política de Privacidad.

15.2. La Compañía puede suspender o terminar la cuenta por las causales de la §11.2, por pérdida de los requisitos de la §4.2, o con aviso de quince (15) días sin expresión de causa. Los procesos de adopción en curso al momento de la terminación se concluyen o se cancelan informando a los Postulantes.

16. Disposiciones finales

16.1. La Compañía puede modificar estos Términos comunicándolo con quince (15) días de antelación. El uso posterior de la cuenta constituye aceptación.

16.2. Las comunicaciones se practican al correo registrado y mediante notificación en la Plataforma.

16.3. Estos Términos se rigen por la legislación de la República del Ecuador. Toda controversia será conocida por los jueces competentes del Ecuador.

SATORI INOV LATAM S.A.S. — RUC 1793240435001 — Quito, Ecuador. Marca comercial e-PetPlace · privacidad@epetplace.com · Versión 1.0
$texto$, now(), true, false)
ON CONFLICT (codigo, version) DO NOTHING;

INSERT INTO public.adopcion_documentos (codigo, version, contenido, vigente_desde, vigente, es_plantilla)
VALUES ('condiciones_adopcion', 2, $texto$CONDICIONES PARTICULARES DEL SERVICIO DE ADOPCIÓN

1. e-PetPlace pone en contacto a refugios y rescatistas verificados con personas interesadas en adoptar, gratis y sin comisión. Verificamos la identidad y, en su caso, la constitución legal de los refugios; esa verificación no garantiza los animales publicados ni las decisiones de adopción. No evaluamos adoptantes, no asignamos animales y no intervenimos en la decisión, que es exclusiva del refugio.

2. La postulación no genera derecho a adoptar. El refugio decide libremente y le responde por la Plataforma. Su postulación se comparte únicamente con el refugio del animal solicitado y se elimina conforme a la Política de Privacidad si la adopción no se concreta.

3. Toda adopción se formaliza mediante el Acta de Adopción digital, que usted y el refugio firman en la aplicación. Con el Acta, el refugio le transfiere la tenencia y propiedad del animal —hasta ese momento, su cuidado es responsabilidad del refugio—, el Expediente pasa a su cuenta, y usted asume las obligaciones de tenencia responsable que el Acta detalla, incluidas, en Quito, la actualización del REMETFU y —únicamente si el animal es menor de seis meses— la esterilización antes de esa edad; los animales mayores de seis meses se entregan ya esterilizados. Lea el Acta antes de firmar: sus términos prevalecen en lo relativo a esa adopción.

4. Si un refugio percibe un bono de adopción, se acuerda y paga directamente entre usted y el refugio, fuera de la Plataforma, y debe serle informado antes del primer encuentro. No intervenimos en esos pagos.

SATORI INOV LATAM S.A.S. — RUC 1793240435001 — Quito, Ecuador. Marca comercial e-PetPlace · privacidad@epetplace.com · Versión 1.0
$texto$, now(), true, false)
ON CONFLICT (codigo, version) DO NOTHING;

INSERT INTO public.adopcion_documentos (codigo, version, contenido, vigente_desde, vigente, es_plantilla)
VALUES ('acta_adopcion', 1, $texto$ACTA DE ADOPCIÓN

N.º {{folio}} · {{ciudad}}, {{fecha_hora}}

COMPARECEN:

EL REFUGIO: {{refugio_denominacion}}, [[si refugio es organización]]con personalidad jurídica según acuerdo N.º {{refugio_acuerdo}}[[/si]][[si refugio es rescatista independiente]]rescatista independiente verificado[[/si]], representada en este acto por {{refugio_representante_nombre}}, con cédula de ciudadanía N.º {{refugio_representante_cedula}}, verificada en la plataforma e-PetPlace ("el Refugio").

LA PERSONA ADOPTANTE: {{adoptante_nombre}}, con cédula de ciudadanía N.º {{adoptante_cedula}}, mayor de edad, con domicilio declarado en {{adoptante_ciudad}} ("la Persona Adoptante").

PRIMERA — Antecedente y papel de la plataforma. Las partes se conocieron a través de la plataforma e-PetPlace, operada por SATORI INOV LATAM S.A.S., que facilitó la publicación del animal, la postulación y el registro de este acto, de forma gratuita y sin intervenir en la decisión de adopción, la cual corresponde exclusivamente al Refugio. e-PetPlace no es parte de esta acta, no transfiere ni recibe al animal, y no percibe valor alguno por este proceso.

SEGUNDA — El animal. {{animal_nombre}} · especie {{animal_especie}} · sexo {{animal_sexo}} · edad estimada {{animal_edad_estimada}} · señas particulares {{animal_senas}} · microchip N.º {{animal_microchip|no posee}} · registro REMETFU {{animal_remetfu|pendiente}}.

TERCERA — Estado del animal y expediente. El Refugio declara que la información sanitaria y de comportamiento del animal registrada en su expediente digital —vacunas, esterilización, desparasitaciones, tratamientos, condiciones conocidas e historia disponible— es veraz y completa según su leal saber, y que no ha ocultado condiciones de salud o comportamiento que conozca. Con la firma de esta acta, el expediente del animal se transfiere a la cuenta de la Persona Adoptante, quedando el Refugio registrado como procedencia.

CUARTA — Declaración de legítima disponibilidad. El Refugio declara que el animal fue [[si origen es rescate]]rescatado en situación de abandono[[/si]][[si origen es cesión]]entregado voluntariamente por su anterior tenedor mediante cesión de fecha {{origen_cesion_fecha}}[[/si]], que no conoce reclamo de propiedad pendiente sobre él y que se encuentra legitimado para entregarlo en adopción.

QUINTA — Entrega y transferencia. En este acto el Refugio entrega materialmente el animal a la Persona Adoptante y le transfiere la tenencia y la propiedad, a título gratuito. Hasta el momento de esta entrega, el cuidado y la responsabilidad sobre el animal han correspondido exclusivamente al Refugio; desde esta entrega corresponden exclusivamente a la Persona Adoptante.

SEXTA — Obligaciones de la Persona Adoptante. La Persona Adoptante asume las obligaciones de la tenencia responsable conforme a la normativa nacional y municipal aplicable, y en particular se obliga a: a) proveer al animal alimentación, alojamiento, atención veterinaria y vacunación adecuados; b) no abandonarlo — el abandono de animales de compañía constituye contravención penal (Art. 250.3 del COIP); [[si ciudad es Quito]]c) inscribir o actualizar el registro del animal en el REMETFU dentro de los quince (15) días siguientes, con la identificación por microchip que exige la Ordenanza Metropolitana 052-2023;[[/si]] [[si animal es menor de seis meses y no está esterilizado]]d) esterilizarlo antes de que cumpla seis meses de edad, conforme al artículo 6.7 de la normativa metropolitana;[[/si]] e) comunicar al Refugio, por medio de la plataforma, cualquier circunstancia grave relativa al animal durante los seis (6) meses siguientes, y permitir un seguimiento razonable —contacto o visita acordada— durante ese período; f) en caso de no poder continuar con la tenencia, ofrecer la restitución al Refugio antes que cualquier otra medida, y no transferir el animal a terceros sin conocimiento del Refugio dentro del período de seguimiento.

SÉPTIMA — Gratuidad. Esta adopción es gratuita. Ningún valor ha sido pagado ni cobrado a través de la plataforma. [[si el refugio declaró bono de adopción]]El bono de adopción percibido por el Refugio fue acordado y entregado directamente entre las partes, fuera de la plataforma, y no forma parte de esta acta.[[/si]]

OCTAVA — Restitución. Si dentro del período de seguimiento el Refugio constata incumplimiento grave de las obligaciones de la cláusula sexta que ponga en riesgo al animal, podrá requerir su restitución, sin perjuicio de las denuncias que correspondan ante las autoridades competentes.

NOVENA — Datos personales. Los datos de las partes contenidos en esta acta se tratan conforme a la Política de Privacidad de e-PetPlace, con la finalidad de documentar la adopción y la trazabilidad del animal.

DÉCIMA — Firma electrónica. Las partes acuerdan expresamente que la suscripción de esta acta mediante el mecanismo de firma electrónica de la aplicación —con identidad verificada, re-autenticación al momento de firmar y registro de fecha, hora y versión del texto— constituye firma electrónica válida en los términos de los artículos 13 y 14 de la Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos, con el mismo valor que la firma manuscrita.

{{firma_refugio}} · {{firma_adoptante}}
Registrada en e-PetPlace el {{registro_fecha_hora}} · hash del documento: {{hash_documento}}
$texto$, now(), true, true)
ON CONFLICT (codigo, version) DO NOTHING;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE v int; v_err text;
BEGIN
  /* ① la version vieja quedo jubilada y la nueva vigente */
  SELECT count(*) INTO v FROM adopcion_documentos WHERE version=1 AND vigente
     AND codigo IN ('terminos_refugio','condiciones_adopcion');
  IF v <> 0 THEN RAISE EXCEPTION 'CINTURON: quedaron % filas viejas vigentes', v; END IF;

  /* ② y las nuevas TRAEN las clausulas que la vieja no tenia — el discriminador:
     sin esto, «cargue la nueva» seria una afirmacion sobre un texto que nadie miro. */
  IF NOT EXISTS (SELECT 1 FROM adopcion_documentos
                  WHERE codigo='terminos_refugio' AND version=2 AND vigente
                    AND contenido LIKE '%5.2.1%' AND contenido LIKE '%REMETFU%') THEN
    RAISE EXCEPTION 'CINTURON: el terminos_refugio nuevo NO trae 5.2.1 y REMETFU -> es la vieja otra vez';
  END IF;
  IF EXISTS (SELECT 1 FROM adopcion_documentos
              WHERE codigo='terminos_refugio' AND version=1 AND contenido LIKE '%5.2.1%') THEN
    RAISE EXCEPTION 'CINTURON: la vieja tambien trae 5.2.1 -> el discriminador no discrimina';
  END IF;

  /* ③ el acta esta, y esta como PLANTILLA */
  IF NOT EXISTS (SELECT 1 FROM adopcion_documentos
                  WHERE codigo='acta_adopcion' AND version=1 AND es_plantilla) THEN
    RAISE EXCEPTION 'CINTURON: el acta no entro como plantilla';
  END IF;

  /* ④ CORCHETES: un texto CERRADO no puede tener ninguno; la PLANTILLA solo
     puede tener los de su notacion. Un corchete suelto en un texto cerrado es
     una variable sin sustituir presentada como clausula firmada. */
  IF EXISTS (SELECT 1 FROM adopcion_documentos
              WHERE NOT es_plantilla AND (contenido LIKE '%[%' OR contenido LIKE '%{{%')) THEN
    RAISE EXCEPTION 'CINTURON: un texto cerrado tiene notacion de plantilla';
  END IF;
  IF EXISTS (SELECT 1 FROM adopcion_documentos WHERE es_plantilla
              AND regexp_replace(contenido, '\[\[/?[^]]*\]\]', '', 'g') LIKE '%[%') THEN
    RAISE EXCEPTION 'CINTURON: la plantilla tiene un corchete fuera de su notacion';
  END IF;

  /* ⑤ el hash se deriva del texto, no se escribe */
  IF EXISTS (SELECT 1 FROM adopcion_documentos
              WHERE sha256 IS DISTINCT FROM encode(sha256(convert_to(contenido,'UTF8')),'hex')) THEN
    RAISE EXCEPTION 'CINTURON: hay un sha256 que no corresponde a su texto';
  END IF;

  /* ⑥ EL TEXTO ES INMUTABLE — y se prueba INTENTANDO, no leyendo el trigger. */
  BEGIN
    UPDATE adopcion_documentos SET contenido = contenido || ' x'
     WHERE codigo='acta_adopcion' AND version=1;
    RAISE EXCEPTION 'CINTURON: se pudo EDITAR un texto legal cargado';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT LIKE '%texto_legal_inmutable%' THEN
      RAISE EXCEPTION 'CINTURON: el UPDATE fallo por otra cosa (%)', v_err;
    END IF;
  END;

  RAISE NOTICE 'CINTURON VERDE: vieja jubilada, nueva con 5.2.1 y REMETFU, acta plantilla, hashes derivados, texto inmutable';
END $cinturon$;
