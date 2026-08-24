# e-PetPlace — Aviso de IA: formulaciones legales

**Borrador 2** · reemplaza íntegramente al borrador del 24 de agosto de 2026
**Estado:** para revisión legal · **Fecha:** 24 de agosto de 2026
**Base normativa:** Resolución SPDP-SPD-2026-0009-R (Arts. 4, 5.1, 5.2 y 6) y LOPDP (Arts. 9, 12, 16 y 20)
**Redactado sobre:** censo técnico verificado contra código, agosto 2026 — tres funciones asistivas, revisión humana obligatoria, sin decisiones exclusivamente automatizadas

**Identidad corregida.** El responsable del tratamiento es **SATORI INOV LATAM S.A.S.**, RUC 1793240435001, conforme al certificado del SRI de 14 de agosto de 2026. **e-PetPlace** es la marca comercial de la plataforma, no la entidad. El canal es **privacidad@epetplace.com**. El borrador anterior atribuía la responsabilidad a BePetz SAS (RUC 1793225791001), dato que provino de la documentación de referencia inicial y que queda descartado.

> **Bloquea la publicación:** el cierre documental de la transferencia internacional (Formulación 7). Los demás puntos abiertos figuran al final.

---

## Alcance verificado

Al contrastar el censo de IA con el inventario de privacidad aparecieron dos flujos adicionales hacia el proveedor —la lectura del documento de identidad del profesional y un "asistente de ayuda"—. **Verificado contra el código: ambos existen como componentes pero ningún flujo los invoca**, de modo que ningún dato de esa naturaleza ha llegado nunca al proveedor de IA. La declaración de alcance de la Formulación 1 se sostiene sobre las tres funciones que efectivamente operan.

⚠️ **Esto convierte a esas dos piezas en código latente, y el código latente tiene una regla:** el día que un flujo las invoque, el aviso deja de ser exacto **antes** de que ningún usuario lo note. Se aplica la misma secuencia del Anexo B — evaluación de impacto, versión nueva del aviso y notificación, y recién entonces el despliegue. Conviene además dejar constancia interna, con fecha, de la verificación que respalda esta afirmación: es la prueba de que el alcance declarado fue comprobado y no supuesto.

---

## Bloque de identificación del responsable

Este bloque encabeza la Política de Privacidad y define el término que usan todos los textos siguientes. **Nada debe atribuir obligaciones a "e-PetPlace" sin que antes quede establecido que la marca corresponde a la compañía.**

> **Responsable del tratamiento**
>
> **SATORI INOV LATAM S.A.S.**, sociedad por acciones simplificada constituida en la República del Ecuador el 14 de agosto de 2026, con Registro Único de Contribuyentes N.º 1793240435001, representada legalmente por el señor Luis Guillermo Suárez González, con domicilio en la Av. de los Shyris y Av. República de El Salvador, esquina, Edificio IQON, oficina 2705, barrio La Carolina, cantón Quito, provincia de Pichincha, República del Ecuador, titular y operadora de la plataforma digital identificada con la marca comercial **e-PetPlace** (en adelante, indistintamente, "e-PetPlace" o "la Compañía").
>
> **Canal para el ejercicio de derechos y consultas sobre privacidad:** privacidad@epetplace.com

**Nota de uso.** A partir de aquí los textos usan "e-PetPlace" como término definido, que es lo que se lee natural; la obligada sigue siendo la sociedad. Verificar que la dirección web que se publique sea la que efectivamente resuelve: la marca lleva guion (e-PetPlace) y el dominio de correo no (epetplace.com), lo cual es normal, pero el documento no debe inventar una URL.

---

## Cómo usar este documento

Las formulaciones 1 a 4 y la 7 van en la **Política de Privacidad**, como sección propia de IA, en ese orden. La 5 es **microcopy de producto**, no texto legal: va en las pantallas. La 6 va **en los dos lugares**: en la política y como descargo visible en la funcionalidad clínica.

---

## Formulación 1 — Declaración general de transparencia

**Qué exige la norma.** Art. 5.1 de la Resolución: informar "de manera clara, específica, determinada y transparente" sobre el tratamiento mediante IA, "incluidas las finalidades del tratamiento y su carácter automatizado". El estándar es *específico y determinado*: una mención genérica a "usamos inteligencia artificial para mejorar tu experiencia" no cumple.

**Texto:**

> **Uso de sistemas de inteligencia artificial**
>
> Algunas funcionalidades de e-PetPlace operan mediante sistemas de inteligencia artificial, es decir, mediante el tratamiento automatizado de datos personales. A continuación le informamos, de manera específica y determinada, cuáles son esas funcionalidades, qué datos utiliza cada una, con qué finalidad y de qué manera interviene una persona antes de que el resultado produzca cualquier efecto.
>
> Las tres funcionalidades descritas a continuación son **asistivas**: proponen un resultado que una persona revisa, corrige o descarta. Ninguna de ellas adopta decisiones por sí misma. Fuera de estas tres funcionalidades, e-PetPlace no trata sus datos personales mediante sistemas de inteligencia artificial.

**Nota de uso.** La última frase es una declaración de alcance cerrado: es lo que le da valor al aviso y, por lo mismo, la que más expone si deja de ser exacta. Hoy es verificable. Obliga a versionar el documento **antes** de que entre en producción cualquier función nueva —la anunciada del asistente de cuidado, o cualquiera de las dos piezas latentes—, conforme al Anexo B.

---

## Formulación 2 — Declaración por función

**Qué exige la norma.** El mismo Art. 5.1, en su exigencia de que la información sea *determinada*. Cada tratamiento necesita finalidad, datos de entrada y salvaguarda identificables por separado.

**Texto:**

> **1. Estructuración de la nota clínica (aplicación para profesionales)**
> Cuando un médico veterinario dicta por voz el desarrollo de una consulta, el sistema distribuye el contenido dictado en los campos de la ficha clínica. **Datos tratados:** únicamente el contenido que el profesional dicta durante esa consulta, referido a la mascota y a la atención prestada. **Finalidad:** reducir el tiempo de registro clínico. **Intervención humana:** el profesional revisa, edita y confirma la ficha antes de guardarla; el sistema está diseñado para no incorporar contenido que no haya sido dictado, de modo que un campo no dictado permanece vacío. Ninguna ficha se almacena sin la confirmación del profesional.
>
> **2. Lectura del carnet de vacunas (aplicación para clientes)**
> Cuando usted fotografía el carnet de vacunación de su mascota, el sistema lee la imagen y propone las vacunas registradas con su denominación y fecha. **Datos tratados:** la fotografía que usted carga y la información contenida en ella. La imagen del carnet puede contener datos de terceros —en particular el nombre, la firma o el número de registro del profesional que emitió el documento—, que e-PetPlace trata únicamente como parte integrante del documento cargado, sin extraerlos, indexarlos ni utilizarlos con otra finalidad. **Finalidad:** incorporar el historial de vacunación a la ficha de su mascota. **Intervención humana:** usted revisa cada vacuna propuesta de forma individual y la confirma, edita o descarta; no se almacena ningún registro que usted no haya confirmado. **Conservación:** la fotografía original del carnet se conserva junto con la ficha de la mascota y se reproduce en las impresiones que usted genere desde la Plataforma.
>
> **3. Redacción de la presentación del negocio (perfil profesional)**
> El sistema propone un texto de presentación del negocio a partir de la información que el propio Usuario Profesional ha cargado en su perfil. **Datos tratados:** los datos del negocio que el profesional ya registró en la Plataforma. **Finalidad:** facilitar la redacción del perfil público. **Intervención humana:** el profesional revisa y edita el texto antes de publicarlo; ningún texto se publica sin su aprobación.

**Nota de uso.** El párrafo de terceros en la función 2 es imprescindible: el carnet lleva datos del veterinario emisor, que no es usuario de e-PetPlace y a quien no se le puede pedir consentimiento. La base es el interés legítimo del Art. 9 de la LOPDP, y se sostiene precisamente por la minimización que declara el texto — tratar la imagen como documento y no extraer los datos del emisor. Si en algún momento el producto empieza a indexar o mostrar al veterinario emisor, esa base cae y hay que rehacer el análisis.

---

## Formulación 3 — Fórmula del Art. 4 de la Resolución

**Qué exige la norma.** Art. 4, segundo inciso: "Cuando se trataren datos personales directamente en sistemas de inteligencia artificial, se garantizará, **en todo momento**, el derecho a no ser objeto de una decisión basada única o parcialmente en valoraciones automatizadas, así como el derecho a la información y el derecho de oposición". La norma pide *garantizar* tres derechos, no describirlos. La redacción debe usar el verbo de la norma.

**Texto:**

> **Derechos garantizados en el uso de estos sistemas**
>
> e-PetPlace garantiza en todo momento, respecto de todo tratamiento realizado mediante sistemas de inteligencia artificial:
>
> **a) El derecho a no ser objeto de una decisión basada única o parcialmente en valoraciones automatizadas**, en los términos del artículo 20 de la Ley Orgánica de Protección de Datos Personales y conforme se detalla en el apartado siguiente.
>
> **b) El derecho a la información**, entendido como su facultad de conocer qué funcionalidades tratan sus datos de forma automatizada, con qué finalidad, sobre qué datos operan y qué intervención humana existe. Puede solicitar información adicional sobre cualquiera de estos tratamientos escribiendo a privacidad@epetplace.com.
>
> **c) El derecho de oposición**, que usted puede ejercer en cualquier momento y sin expresión de causa respecto de los tratamientos que se fundamentan en el interés legítimo de e-PetPlace. Ejercida la oposición, dejaremos de tratar sus datos mediante la funcionalidad correspondiente, sin que ello afecte su acceso al resto de la Plataforma: las funcionalidades descritas son asistivas y su uso es opcional, de modo que puede registrar la información de forma manual.

**Nota de uso.** El literal c) es el que más protege a la Compañía en la práctica: al declarar que las funciones son opcionales y que existe una vía manual equivalente, la oposición se vuelve operativamente trivial de atender. Verificar que las tres funciones efectivamente tengan alternativa manual en producto — si alguna no la tiene, hay que construirla o cambiar el texto.

---

## Formulación 4 — El derecho del Art. 20 de la LOPDP

**Qué exige la norma.** Art. 20: "El titular tiene derecho a no ser sometido a una decisión basada **única o parcialmente** en valoraciones que sean producto de procesos automatizados (…) que produzcan efectos jurídicos en él o que atenten contra sus derechos y libertades fundamentales".

**Por qué la redacción importa.** El artículo ecuatoriano dice "única **o parcialmente**". Es deliberadamente más amplio que su equivalente en el régimen europeo, que se limita a las decisiones basadas *únicamente* en tratamiento automatizado. Consecuencia práctica: **el hecho de que un humano revise no basta, por sí solo, para quedar fuera del artículo**, porque un sistema asistivo influye parcialmente en la decisión que ese humano toma. Por eso el texto no debe reclamar una exención —"como hay revisión humana, el Art. 20 no aplica"— sino garantizar el derecho y describir la salvaguarda. Reclamar la exención es la redacción frágil; garantizar el derecho es la redacción que aguanta.

**Texto:**

> **Decisiones automatizadas**
>
> Las funcionalidades descritas producen propuestas, no decisiones. En los tres casos, el resultado generado por el sistema carece por sí solo de todo efecto: no se almacena, no se publica y no produce consecuencia alguna mientras una persona —el profesional o usted, según la funcionalidad— no lo revise y lo confirme. La decisión sobre el contenido definitivo corresponde en todos los casos a esa persona, que puede modificarlo o descartarlo íntegramente.
>
> e-PetPlace no adopta decisiones sobre usted basadas única o parcialmente en valoraciones automatizadas que produzcan efectos jurídicos en su persona o que afecten sus derechos y libertades fundamentales. En particular, ninguna de estas funcionalidades interviene en la aceptación o el rechazo de un registro, en la suspensión o restricción de una cuenta, en la aprobación o denegación de un pago, ni en la habilitación de un Usuario Profesional en la Plataforma.
>
> Sin perjuicio de lo anterior, si usted considera que una decisión adoptada por e-PetPlace respecto de su cuenta o de sus servicios ha estado influida por un tratamiento automatizado, tiene derecho a solicitar información sobre ella, a expresar su punto de vista, a obtener la intervención humana en su revisión y a impugnarla, escribiendo a privacidad@epetplace.com. Atenderemos su solicitud en el plazo de quince (15) días.

**Nota de uso.** El segundo párrafo enumera los cuatro supuestos donde sí habría efecto jurídico —registro, cuenta, pago, habilitación profesional— y afirma que la IA no participa en ninguno. Es una declaración fuerte y hoy es cierta según la verificación contra código. Queda como restricción de diseño: **si alguna vez un modelo interviene en cualquiera de esos cuatro flujos, este párrafo se vuelve falso y hay que reescribirlo antes del despliegue**, no después.

---

## Formulación 5 — Etiquetado del contenido generado

**Qué exige la norma.** No hay en Ecuador una regla de etiquetado de contenido sintético con nombre propio; la exigencia se deriva del Art. 5.1 de la Resolución —transparencia sobre el carácter automatizado— y del deber de información veraz al consumidor de la LODC. El etiquetado en pantalla es, además, la evidencia práctica de que la revisión humana existe.

| Momento | Funcionalidad | Etiqueta |
|---|---|---|
| Antes de confirmar | Nota clínica | *"Borrador organizado con asistencia de IA a partir de su dictado. Revise y confirme antes de guardar. Los campos que no fueron dictados quedan vacíos."* |
| Antes de confirmar | Carnet de vacunas | *"Estas vacunas fueron leídas automáticamente de la fotografía. Revise cada una antes de guardarla."* — y por ítem: *"Leído de la imagen · verificar"* |
| Antes de publicar | Presentación del negocio | *"Texto sugerido con asistencia de IA a partir de los datos de su negocio. Edítelo antes de publicarlo."* |
| Después de confirmar | Nota clínica y vacunas | *"Registro asistido por IA · confirmado por [nombre] el [fecha]"* |

**Nota de uso — la fila más importante es la última.** La marca que queda *después* de confirmar cumple dos funciones: le dice al que lee la ficha más adelante cómo se originó ese dato, y le da a la Compañía la evidencia de que hubo revisión humana. Esa evidencia debe existir en el registro, no solo en la pantalla: guardar quién confirmó, cuándo, y si editó el contenido propuesto. Sin ese rastro, la afirmación de "revisión humana obligatoria" que sostiene todo este aviso no es demostrable ante la SPDP. Es el punto donde el texto legal depende de una decisión de ingeniería.

---

## Formulación 6 — Alcance y descargo

**Qué exige la norma.** LODC, deber de información veraz y suficiente; y la necesidad de que el aviso no genere en el usuario una expectativa de fiabilidad que el sistema no ofrece.

**Texto:**

> **Alcance de los resultados generados**
>
> Los resultados producidos por estas funcionalidades tienen carácter **auxiliar** y dependen de la calidad de la información de entrada: de la claridad del dictado, de la legibilidad de la fotografía o de la exactitud de los datos cargados. Pueden contener errores u omisiones, y por esa razón todos requieren revisión antes de ser guardados o publicados.
>
> La estructuración de la nota clínica es una herramienta de registro: **no constituye diagnóstico, prescripción ni criterio clínico**, no sustituye el juicio profesional del médico veterinario y no genera contenido clínico que no haya sido dictado por él. La lectura del carnet de vacunas es una herramienta de transcripción: **no valida la autenticidad del carnet ni la vigencia de las vacunas**, y no sustituye el control veterinario correspondiente.
>
> El contenido confirmado por el Usuario es responsabilidad de quien lo confirma. El Usuario Profesional es el único responsable del contenido clínico que valida y publica en la ficha de sus pacientes, así como del texto de presentación de su negocio.

**Nota de uso.** El último párrafo es la asignación de responsabilidad y debe estar espejado en los T&C Pet Professional, en la sección de obligaciones. Si vive solo en la política de privacidad, no cumple la función contractual.

---

## Formulación 7 — Transferencia internacional

**Por qué es obligatoria.** Las funciones de IA corren sobre Claude, de Anthropic PBC, alojado fuera del Ecuador. Cada una es una **transferencia internacional de datos personales** sujeta a la Resolución SPDP-SPD-2026-0004-R. En el caso del carnet, lo transferido incluye la imagen completa con los datos del veterinario emisor.

**Estado del instrumento.** El DPA de Anthropic existe, se incorpora por referencia a los Términos Comerciales de Servicio y lleva Cláusulas Contractuales Tipo adentro. Reparto de papeles confirmado en su sección B.1: **SATORI INOV LATAM S.A.S. es el responsable y Anthropic PBC el encargado**. La evaluación completa del instrumento contra la norma ecuatoriana está en el documento *Evaluación de transferencia internacional — Anthropic PBC*, que además es la documentación que el Art. 4 obliga a conservar tres años.

**Resumen de esa evaluación.** El DPA cubre cinco de las siete condiciones mínimas del Art. 21 de la Resolución SPDP-SPD-2026-0004-R. **No cubre dos**, y no por descuido sino por alcance: sus Cláusulas Contractuales Tipo son las europeas, con derecho y foro de Irlanda (Schedule 3, A.1.c y A.1.d), y el DPA trae addenda para el Reino Unido y Suiza pero **ninguno para Ecuador**. Quedan sin satisfacer la **aceptación de la jurisdicción ecuatoriana** y los **mecanismos de reparación integral**. El Art. 25 prevé este supuesto y pone en el responsable la carga de incorporar lo que falte.

**Consecuencia para este aviso.** El texto puede afirmar que existe un acuerdo de tratamiento con cláusulas contractuales tipo —es cierto—, pero **no debe afirmar que la transferencia está plenamente amparada** mientras las dos condiciones sigan abiertas. Por eso el texto de abajo describe el instrumento sin declararlo suficiente, y por eso conviene sumar el consentimiento del titular como base complementaria: las tres funciones son opcionales y tienen vía manual, así que ese consentimiento es libre en el sentido que exige la ley.

⚠️ **El plazo de 7 días no figura en el DPA.** Lo que el DPA establece es otra cosa: *"Storage Limitation: The duration is the term of the Agreement"* (Schedule 1, B.7) y borrado dentro de los 30 días de terminado el acuerdo, con excepciones (H.1.b). La cifra de 7 días proviene de la documentación comercial de la API y está condicionada al uso estándar. **Antes de publicarla hay que ubicar la fuente exacta, verificar que corresponde al plan contratado y archivar copia.** Hasta entonces, el texto de abajo la deja entre corchetes.

**Texto:**

> **Transferencia internacional asociada a estas funcionalidades**
>
> Para operar las funcionalidades descritas, e-PetPlace utiliza servicios de inteligencia artificial provistos por **Anthropic PBC**, con infraestructura ubicada fuera del territorio ecuatoriano. En esta relación, SATORI INOV LATAM S.A.S. actúa como responsable del tratamiento y Anthropic PBC como encargado, conforme al acuerdo de tratamiento de datos suscrito entre ambas, que incorpora cláusulas contractuales tipo y obliga al proveedor a tratar los datos únicamente conforme a nuestras instrucciones documentadas, a no venderlos, compartirlos ni combinarlos con datos de terceros, a notificar cualquier brecha de seguridad dentro de las 48 horas y a mantener medidas técnicas y organizativas auditadas anualmente por terceros independientes.
>
> Los datos se transfieren únicamente para la finalidad descrita en cada funcionalidad. **La información enviada al proveedor no se utiliza para entrenar sus modelos**[ y sus registros operativos se eliminan en un plazo de siete (7) días].
>
> Usted puede utilizar estas funcionalidades o registrar la información de forma manual. Si prefiere que sus datos no sean tratados mediante estos sistemas, puede no activarlas o retirar su consentimiento en cualquier momento escribiendo a privacidad@epetplace.com.

**Nota de uso.** Los compromisos del segundo párrafo son los que más tranquilizan a un titular y los que más caro se pagan si dejan de ser ciertos: dependen del plan contratado y de la configuración de la cuenta. Si se activa una modalidad con retención extendida o con uso distinto de los datos, la frase deja de ser verdadera y hay que versionar el aviso el mismo día. El corchete solo se abre cuando la fuente del plazo esté verificada y archivada.

**Y una consecuencia del alcance verificado:** como el documento de identidad **no** se envía al proveedor, la exposición de esta transferencia se limita a notas clínicas dictadas, imágenes de carnets y datos de negocio. Es un perímetro sensiblemente más estrecho, y conviene mantenerlo así: si alguna vez se conecta el componente latente de lectura del documento de identidad, la evaluación de la transferencia hay que rehacerla antes, no después.

---

## Anexo A — Lo que no usa IA

> **Funcionalidades que no utilizan inteligencia artificial**
>
> El asistente de cuidado opera mediante plantillas aplicadas sobre los datos que usted ha registrado, sin generación de contenido. Las alertas de cuidado y las funcionalidades que se habilitan de forma progresiva operan mediante reglas predefinidas. Ninguna de ellas realiza tratamiento mediante sistemas de inteligencia artificial.

---

## Anexo B — Control de versiones del aviso

La cuarta funcionalidad —el asistente de cuidado— empieza a usar IA en los próximos días. La secuencia correcta, y el orden importa:

1. **Antes del despliegue:** levantar la evaluación de impacto de esa función (Arts. 5.2 y 6 de la Resolución la exigen *previa* al tratamiento) e incorporarla al Registro de Actividades de Tratamiento.
2. **Antes del despliegue:** publicar la versión siguiente del aviso, moviendo el asistente de cuidado del Anexo A a la Formulación 2, con sus cuatro elementos —quién, qué datos, finalidad, intervención humana.
3. **Antes del despliegue:** notificar el cambio a los usuarios, por correo o notificación en la plataforma. Una nueva finalidad de tratamiento es un cambio significativo.
4. **Recién entonces:** habilitar la función para usuarios.

Mantener al pie del aviso: `Versión X.Y — vigente desde [fecha]`, y conservar las versiones anteriores. Ante un reclamo, hay que poder demostrar qué decía el aviso el día en que se trató el dato.

---

## Puntos abiertos antes de publicar

**Bloquea:**

1. **Cerrar documentalmente la transferencia internacional** (Formulación 7): verificar el DPA contra las siete condiciones del Art. 21, documentar la evaluación y archivar la versión aceptada con su fecha.

**Derivados del RUC, a resolver:**

2. **Continuidad del responsable.** La compañía se constituyó el 14 de agosto de 2026 e inició actividades ese mismo día. Los documentos de referencia estaban fechados en abril de 2026 y mayo de 2025 —anteriores a la existencia de la sociedad— y atribuidos a otra entidad. Si la plataforma **aún no ha operado con usuarios reales**, el asunto se cierra publicando documentos nuevos a nombre de SATORI INOV LATAM S.A.S. Si **ya hubo tratamiento de datos de usuarios antes del 14 de agosto** bajo otra entidad, hay una sucesión de responsable que exige base de legitimación propia, documentación de la comunicación de datos entre ambas entidades y notificación a los titulares. Es la pregunta que hay que responder primero.
3. **Actividad económica registrada.** El RUC declara una sola: J631200, operación de sitios web que funcionan como portales de internet. No cubre el cobro por cuenta de terceros (el pago facilitado), ni la licencia de herramientas SaaS, ni la emisión de facturas a nombre del profesional. Antes de facturar comisiones o cuotas conviene ampliar las actividades en el RUC para que el comprobante corresponda a una actividad registrada.
4. **Régimen RIMPE – Emprendedor y declaración semestral de IVA.** Condiciona los plazos y la mecánica de facturación que se comprometan en los T&C Pet Professional. Además el RUC indica **agente de retención: NO**, dato central para el diseño del mandato de recaudación y de la facturación por cuenta del profesional. Verificar con el contador antes de que yo redacte esas cláusulas.
5. **Medios de contacto del RUC:** figuran como "no registra". Si privacidad@epetplace.com va a ser el canal oficial publicado, conviene registrarlo también en el SRI.

**Del censo técnico, pendientes:**

6. **El audio del dictado.** No consta si la grabación se conserva, por cuánto tiempo, ni si la transcripción de voz a texto la realiza el mismo proveedor u otro distinto. Si interviene un segundo proveedor, hay una segunda transferencia internacional no declarada.
7. **Rastro de la confirmación humana** (Formulación 5): verificar que se registre quién confirmó, cuándo y si editó.
8. **Vía manual alternativa** para las tres funciones (Formulación 3, literal c).
9. **Retención de la imagen del carnet.** Se conserva de forma indefinida junto a la ficha y se reproduce en las impresiones. Hay que fijar un plazo o vincularlo expresamente a la vida de la ficha de la mascota, y definir qué ocurre con la imagen cuando el usuario elimina su cuenta — arrastra datos del veterinario emisor.
