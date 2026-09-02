-- ═══════════════════════════════════════════════════════════════════════════
-- S112-A · 20260907720000 · LOS DOS TEXTOS LEGALES DE ADOPCIÓN, VERSIONADOS.
-- Punto 9-bis. Textos entregados por el founder el 1-sep-2026, SIN corchetes
-- (guard corrido antes de escribir esto: 0 ocurrencias de '[' en los dos).
--
-- 🔴 NO SE INVENTÓ NI SE EDITÓ UNA COMA. El texto entra íntegro, tal cual se
-- pegó. Lo único que esta migración agrega es la maquinaria: el hash y la
-- vigencia.
--
-- EL HASH ES **GENERADO**, NO GUARDADO (`L-439`): un sha256 escrito a mano es
-- un valor que puede quedar mal, y un hash mal es peor que no tener hash
-- —dice que el texto es otro, o peor, dice que es el mismo cuando cambió—.
-- Como columna GENERATED ALWAYS, «hash que no corresponde al texto» pasa a ser
-- INEXPRESABLE.
--
-- 76(g): **NO RIGE** — la tabla está VACÍA (0 filas medidas antes de correr),
-- así que no hay backfill posible ni anclas que mover.
--
-- REVERSA ESCRITA ANTES:
--   docs/relevamientos/S112-A-REVERSA-20260907720000-textos-legales-adopcion.sql
--   ⚠️ deja de ser segura en cuanto exista la primera aceptación registrada.
--
-- ⚠️ LO QUE ESTA MIGRACIÓN **NO** HACE, declarado:
--   · NO carga `acta_adopcion` — ese texto no llegó. La puerta del traspaso
--     sigue fail-closed **y con voz** (`acta_no_disponible: <codigo> v<version>`),
--     y el cinturón de abajo lo VERIFICA en vez de suponerlo.
--   · NO crea el registro de aceptaciones. Es la pieza inmediata siguiente.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.adopcion_documentos
  ADD COLUMN IF NOT EXISTS sha256 text
    GENERATED ALWAYS AS (encode(sha256(convert_to(contenido, 'UTF8')), 'hex')) STORED,
  ADD COLUMN IF NOT EXISTS vigente boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.adopcion_documentos.sha256 IS
  'S112-A · derivado del texto, jamás escrito. Un hash que no corresponde al contenido es inexpresable por construcción (L-439).';

INSERT INTO public.adopcion_documentos (codigo, version, contenido, vigente_desde, vigente)
VALUES ('terminos_refugio', 1, $texto$TÉRMINOS Y CONDICIONES — CUENTA DE REFUGIO O RESCATISTA

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

4.4. El Refugio se obliga a mantener actualizada su información y a comunicar sin demora la pérdida de vigencia de su personalidad jurídica o cualquier cambio de representante.

5. Publicación de animales — declaraciones del Refugio

5.1. Por cada Animal Publicado, el Refugio declara y garantiza:

a) que se encuentra legítimamente facultado para entregarlo en adopción — por haberlo rescatado en situación de abandono o por haberlo recibido mediante cesión voluntaria documentada de su anterior tenedor — y que no conoce reclamo de propiedad pendiente sobre él; b) que la información sanitaria y de comportamiento publicada — vacunas, esterilización, tratamientos, condiciones conocidas — es veraz y completa según su leal saber, y que no oculta condiciones de salud o comportamiento que conozca; c) que el animal permanece bajo su cuidado y responsabilidad exclusivos hasta la entrega formalizada mediante el Acta de Adopción.

5.2. La ficha de cada Animal Publicado indica, como mínimo: especie, sexo, edad estimada, estado de esterilización, estado vacunal, identificación por microchip y registro municipal cuando existan, y las condiciones de salud o comportamiento relevantes para la decisión de adoptar.

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
$texto$, now(), true)
ON CONFLICT DO NOTHING;

INSERT INTO public.adopcion_documentos (codigo, version, contenido, vigente_desde, vigente)
VALUES ('condiciones_adopcion', 1, $texto$CONDICIONES PARTICULARES DEL SERVICIO DE ADOPCIÓN

1. Qué es y qué no es. e-PetPlace pone en contacto a refugios y rescatistas verificados con personas interesadas en adoptar, de forma gratuita y sin comisión alguna. La Compañía verifica la identidad y, en su caso, la constitución legal de los refugios antes de habilitarlos; esa verificación no constituye garantía sobre los animales publicados ni sobre las decisiones de adopción. La Compañía no evalúa ni aprueba adoptantes, no asigna animales y no interviene en la decisión de adopción, que corresponde exclusivamente al refugio.

2. Postulación. Usted puede postular para adoptar un animal publicado completando el formulario de la aplicación. La postulación no genera derecho a adoptar: el refugio decide libremente sobre cada solicitud, conforme a sus propios criterios, y le responderá a través de la Plataforma. La información de su postulación se comparte únicamente con el refugio del animal solicitado, con la única finalidad de evaluar su solicitud, conforme a la Política de Privacidad; si la adopción no se concreta, su postulación se elimina en el plazo allí previsto.

3. Entrega y Acta de Adopción. Toda adopción se formaliza mediante el Acta de Adopción digital, que usted y el refugio suscriben en la aplicación con firma electrónica. Con el Acta: (a) el refugio le transfiere la tenencia y la propiedad del animal, y hasta ese momento el cuidado del animal es responsabilidad exclusiva del refugio; (b) el expediente del animal —vacunas, esterilización, tratamientos e historia disponible— se transfiere a su cuenta, quedando el refugio registrado como procedencia; y (c) usted asume las obligaciones de tenencia responsable detalladas en el Acta, incluidas las de la sección 4. Lea el Acta antes de firmarla: sus términos prevalecen sobre estas condiciones en lo relativo a esa adopción.

4. Obligaciones municipales y legales. Desde la entrega, usted es responsable del cuidado del animal conforme a la normativa nacional y municipal aplicable. En el Distrito Metropolitano de Quito, ello incluye registrar o actualizar el cambio de tenedor en el REMETFU, con identificación por microchip, dentro del plazo señalado en el Acta, y completar la esterilización del animal si estuviera pendiente, dentro del plazo allí comprometido. El abandono de animales de compañía constituye contravención penal.

5. Bonos de adopción. La Plataforma no cobra por las adopciones. Si un refugio percibe un bono o contribución, este se acuerda y paga directamente entre usted y el refugio, fuera de la Plataforma, y debe serle informado antes del primer encuentro con el animal. La Compañía no interviene en esos pagos ni responde por ellos.

6. Seguimiento y restitución. El Acta puede prever un período de seguimiento post-adopción y la restitución del animal al refugio en caso de incumplimiento grave que lo ponga en riesgo, en los términos que el Acta establezca.

SATORI INOV LATAM S.A.S. — RUC 1793240435001 — Quito, Ecuador. Marca comercial e-PetPlace · privacidad@epetplace.com · Versión 1.0
$texto$, now(), true)
ON CONFLICT DO NOTHING;

-- ═══ CINTURÓN ═════════════════════════════════════════════════════════════
DO $cinturon$
DECLARE v_n int; v_err text;
BEGIN
  SELECT count(*) INTO v_n FROM adopcion_documentos
   WHERE codigo IN ('terminos_refugio','condiciones_adopcion') AND version=1 AND vigente;
  IF v_n <> 2 THEN RAISE EXCEPTION 'CINTURON: se esperaban 2 documentos vigentes, hay %', v_n; END IF;

  /* ① El hash NO se guardo: se deriva. Se comprueba contra el texto, no contra
     un valor escrito — si alguien edita el texto, el hash cambia solo. */
  IF EXISTS (SELECT 1 FROM adopcion_documentos
              WHERE sha256 IS DISTINCT FROM encode(sha256(convert_to(contenido,'UTF8')),'hex')) THEN
    RAISE EXCEPTION 'CINTURON: hay un sha256 que no corresponde a su texto';
  END IF;

  /* ② NINGUN texto legal puede entrar con un corchete: seria una variable sin
     sustituir presentada como clausula firmada. */
  IF EXISTS (SELECT 1 FROM adopcion_documentos WHERE contenido LIKE '%[%' OR contenido LIKE '%]%') THEN
    RAISE EXCEPTION 'CINTURON: un documento tiene corchetes -> variable sin sustituir';
  END IF;

  /* ③ EL CONTROL NEGATIVO, y es el que importa: cargar ESTOS dos NO puede
     haber abierto la puerta del traspaso. El acta no llego, y la puerta tiene
     que seguir rebotando CON VOZ. */
  IF EXISTS (SELECT 1 FROM adopcion_documentos WHERE codigo='acta_adopcion') THEN
    RAISE EXCEPTION 'CINTURON: aparecio un acta_adopcion que nadie cargo';
  END IF;
  RAISE NOTICE 'CINTURON VERDE: 2 documentos vigentes, hash derivado, cero corchetes, acta NO cargada';
END $cinturon$;
