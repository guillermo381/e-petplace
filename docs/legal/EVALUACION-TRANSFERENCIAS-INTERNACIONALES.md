# EVALUACIÓN DE TRANSFERENCIAS INTERNACIONALES DE DATOS PERSONALES

**Documento de cumplimiento — Art. 4 de la Resolución SPDP-SPD-2026-0004-R**
**Conservación obligatoria: tres (3) años**

---

| | |
|---|---|
| **Responsable del tratamiento** | SATORI INOV LATAM S.A.S. |
| **RUC** | 1793240435001 |
| **Representante legal** | Luis Guillermo Suárez González |
| **Domicilio** | Av. de los Shyris y Av. República de El Salvador, esquina, Edificio IQON, oficina 2705, La Carolina, Quito, Pichincha |
| **Plataforma** | e-PetPlace (marca comercial) |
| **Canal de privacidad** | privacidad@epetplace.com |
| **Fecha de la evaluación** | 24 de agosto de 2026 |
| **Próxima revisión** | 24 de agosto de 2027, y antes si ocurre cualquiera de los hechos de la §13 |
| **Elaborado por** | Oscar Mauricio Sánchez, abogado independiente |
| **Aprobado por** | Luis Guillermo Suárez González, representante legal |

---

## 1. Objeto y alcance

Esta evaluación analiza la licitud de las transferencias internacionales de datos personales que realiza SATORI INOV LATAM S.A.S. en la operación de la plataforma e-PetPlace, contrasta los instrumentos que las amparan contra el **artículo 21 de la Resolución SPDP-SPD-2026-0004-R**, identifica las brechas subsistentes, adopta medidas compensatorias y deja constancia de la decisión del responsable.

Se evalúan **dos transferencias de naturaleza jurídica distinta**:

| | **Transferencia A** | **Transferencia B** |
|---|---|---|
| Destinatario | Anthropic PBC (Estados Unidos) | Google LLC / Apple Inc. (Estados Unidos) |
| Papel del destinatario | **Encargado** del tratamiento | **Responsable independiente** |
| Datos | Texto de notas clínicas, imágenes de carnets de vacunación, datos de perfil de negocio | Audio de la voz del médico veterinario durante el dictado |
| Instrumento | Data Processing Addendum con cláusulas contractuales tipo | **Ninguno** — no existe relación contractual |
| Base de legitimación | Garantías adecuadas + consentimiento del titular | **Consentimiento del titular** (única disponible) |

## 2. Marco normativo aplicado

- **LOPDP**, en particular sus disposiciones sobre bases de legitimación, derechos del titular y transferencias internacionales.
- **Resolución SPDP-SPD-2026-0004-R**, Norma General para las transferencias o comunicaciones nacionales e internacionales de datos personales: **Art. 4** (conservación de documentación por tres años), **Art. 21** (condiciones mínimas de las garantías adecuadas), **Art. 22** (reconocimiento de las cláusulas modelo-tipo de la Red Iberoamericana de Protección de Datos), **Art. 25** (deber de incorporar las disposiciones faltantes) y **Art. 27** (reconocimiento de modelos de otros foros internacionales compatibles con la normativa nacional).
- **Resolución SPDP-SPD-2026-0009-R**, sobre protección de datos en el uso de sistemas de inteligencia artificial.

---

# PARTE I — TRANSFERENCIA A: ANTHROPIC PBC

## 3. Descripción de la transferencia

**Instrumento evaluado:** *Anthropic Data Processing Addendum*, vigente desde el 24 de febrero de 2025, incorporado por referencia a los Términos Comerciales de Servicio y aceptado por el responsable en la fecha que consta en el Anexo A.

**Reparto de papeles:** la sección B.1 del DPA establece que el cliente es el *controller* y Anthropic el *processor*. Corresponde: SATORI INOV LATAM S.A.S. es responsable y Anthropic PBC es encargado.

**Finalidad:** operar tres funcionalidades asistivas — estructuración de la nota clínica dictada, lectura del carnet de vacunación y redacción de la presentación del negocio del profesional.

**Datos transferidos:** texto de la nota clínica ya transcrita; imagen del carnet de vacunación, que puede contener datos del veterinario emisor; datos de perfil del negocio.

**Datos expresamente excluidos:** la imagen del documento de identidad del profesional **no se transfiere**. El componente que lo permitiría existe en el código pero ningún flujo lo invoca; se deja constancia de que su conexión futura obligaría a rehacer esta evaluación con carácter previo.

## 4. Análisis contra las siete condiciones del Art. 21

| N.º | Condición del Art. 21 | Verdicto | Fundamento en el instrumento |
|---|---|---|---|
| 1 | **Vinculatoriedad jurídica** | ✅ **Satisfecha** | B.1 establece la relación responsable–encargado; I.1 dispone que las cláusulas contractuales tipo *"se tendrán por suscritas por las partes"*. El DPA se incorpora al contrato principal y lo prevalece en caso de conflicto. |
| 2 | **Principios de protección** | ✅ **Satisfecha** | B.2: tratamiento limitado a prestar el servicio y a las instrucciones documentadas del responsable. B.3: prohibición de vender o compartir los datos, de usarlos fuera de la relación y de combinarlos con datos de otros. E.1 y Schedule 2: medidas de seguridad detalladas. |
| 3 | **Supervisión y cumplimiento** | ✅ **Satisfecha** | F.1: auditoría anual por terceros independientes y disponibilidad del informe SOC 2. F.2: derecho de auditoría propia del responsable. G.1: notificación de brecha **dentro de 48 horas**, más exigente que el estándar de 72. B.6: asistencia en evaluaciones de impacto y consultas a autoridades de control. |
| 4 | **Derechos de los titulares** | ✅ **Satisfecha** | D.1: traslado al responsable de toda solicitud de derechos recibida. D.2: asistencia razonable y oportuna para atenderlas. Coherente con el reparto de papeles: quien responde al titular es el responsable ecuatoriano. |
| 5 | **Restricciones a transferencias ulteriores** | ⚠️ **Satisfecha, con carga operativa** | C.1 a C.3: autorización general, lista pública de subencargados, obligaciones contractuales equivalentes impuestas a cada uno, responsabilidad de Anthropic por sus actos, y ventana de **15 días** para objetar la incorporación de nuevos. **El silencio equivale a consentimiento**, de modo que la condición se incumple en los hechos si el responsable no vigila los avisos. Ver medida compensatoria M-4. |
| 6 | **Aceptación de la jurisdicción ecuatoriana** | 🔴 **NO satisfecha** | Schedule 3, A.1.c: ley aplicable, la de Irlanda. A.1.d: foro y jurisdicción, Irlanda. Schedule 1, Parte C: autoridad de control competente, la de un Estado miembro de la Unión Europea o, en su defecto, la de Irlanda. El DPA contiene addenda para el Reino Unido y para Suiza; **no contiene ninguno para Ecuador ni para Iberoamérica**. |
| 7 | **Mecanismos de reparación integral** | 🔴 **NO satisfecha** | Las vías de reparación previstas son las de las cláusulas europeas y se dirigen a autoridades y tribunales de la Unión Europea. Schedule 3, A.1.b excluye además la redacción opcional de la Cláusula 11. La *reparación integral* es un estándar del ordenamiento ecuatoriano que el instrumento no recoge ni podría recoger, por su ámbito de diseño. |

## 5. Calificación del instrumento

Las cláusulas contractuales tipo que incorpora el DPA son las **europeas**, aprobadas por la Decisión de Ejecución (UE) 2021/914. El **Art. 22** de la norma ecuatoriana reconoce como propias las cláusulas modelo-tipo de la **Red Iberoamericana de Protección de Datos**, que no son estas. Las europeas ingresan, por tanto, por la vía del **Art. 27** —modelos de otros foros internacionales especializados, admisibles *"siempre que resulten compatibles con la normativa nacional"*—, y esa compatibilidad es precisamente lo que falla en las condiciones 6 y 7.

Activa entonces el **Art. 25**: cuando las cláusulas no cumplen los requisitos de validez, **deben incorporarse las disposiciones necesarias** para alcanzar el estándar ecuatoriano. La carga recae en el responsable.

**Un elemento que juega a favor y que se hace constar:** la definición A.1 del DPA define *"Applicable Data Protection Laws"* como **todas** las leyes de privacidad o protección de datos aplicables, y B.1 obliga a cada parte a cumplir sus obligaciones bajo ellas. La LOPDP queda capturada por esa definición, de modo que **las obligaciones sustantivas del cuerpo del DPA —secciones B a H— vinculan a Anthropic también bajo derecho ecuatoriano**. Lo que no alcanza al Ecuador es el Schedule 3, que es específico de la Unión Europea, el Reino Unido y Suiza. La brecha es de **foro y reparación**, no de sustancia protectora.

## 6. Medidas compensatorias adoptadas

El responsable no puede modificar unilateralmente un instrumento de adhesión. Puede, en cambio, **incorporar las disposiciones faltantes en el único lugar que gobierna: su propia relación con el titular.** Las dos condiciones abiertas protegen la posición del titular —que no quede obligado a perseguir a un tercero en un foro extranjero—, y ese interés queda cubierto con los compromisos siguientes.

**M-1 — Sumisión a la jurisdicción ecuatoriana, asumida por el responsable.** SATORI INOV LATAM S.A.S. declara en su Política de Privacidad, con carácter vinculante frente al titular, que **se somete a la jurisdicción ecuatoriana y a la competencia de la Superintendencia de Protección de Datos Personales** respecto de toda reclamación relacionada con esta transferencia, y que **no opondrá al titular ley ni foro extranjeros**.

**M-2 — Reparación integral, asumida por el responsable.** SATORI INOV LATAM S.A.S. asume frente al titular la obligación de **reparación integral** por los daños derivados de esta transferencia, **sin que el titular deba dirigir su reclamación contra el proveedor ni ante autoridad o tribunal extranjero**.

**M-3 — Consentimiento como base complementaria.** Las tres funcionalidades son **opcionales y cuentan con vía manual equivalente**, de modo que el consentimiento es libre en el sentido que exige la ley. Se recaba de forma específica e informada al activar cada funcionalidad y es revocable en cualquier momento.

**M-4 — Vigilancia de subencargados.** Se asigna a **Luis Guillermo Suárez González, representante legal**, la revisión de los avisos de incorporación de subencargados y de la lista publicada por el proveedor, con periodicidad **mensual** y constancia escrita de cada revisión, a fin de que la ventana de objeción de 15 días no se agote por silencio.

**M-5 — Minimización del perímetro.** La imagen del documento de identidad del profesional **no se transfiere** al proveedor. Cualquier ampliación del conjunto de datos transferidos exige rehacer esta evaluación **con carácter previo** al despliegue.

**M-6 — Requerimiento formal al proveedor.** Invocando las cláusulas **I.4** —obligación de facilitar la información necesaria para una evaluación de impacto de la transferencia— y **B.6** —asistencia en evaluaciones y consultas a autoridades—, el responsable ha requerido al proveedor: (i) si dispone de un addendum para Ecuador o para jurisdicciones iberoamericanas; (ii) si acepta las cláusulas modelo-tipo de la RIPD reconocidas por el Art. 22; (iii) confirmación del plazo de conservación de registros operativos aplicable al plan contratado. La solicitud y su respuesta —incluida la ausencia de respuesta— se archivan en el Anexo A.

## 7. Conclusión sobre la Transferencia A

El instrumento satisface **cinco de las siete condiciones** del Art. 21, y la sexta —restricciones a transferencias ulteriores— queda satisfecha mediante la medida M-4. Las condiciones de **jurisdicción ecuatoriana** y **reparación integral** no son satisfechas por el instrumento y **no pueden serlo**, dado su ámbito de diseño.

El responsable concluye que la transferencia es **lícita y sostenible** sobre la base de: la sustancia protectora del DPA, que vincula al proveedor también bajo la LOPDP; las medidas compensatorias M-1 a M-6, que incorporan las disposiciones faltantes conforme al Art. 25 en el ámbito que el responsable gobierna; y el consentimiento informado del titular como base complementaria.

**Se deja expresa constancia de que esta es una posición razonada y no una brecha cerrada.** El instrumento del proveedor sigue designando foro irlandés. La autoridad de control podría sostener un criterio más estricto y exigir un instrumento que acepte expresamente la jurisdicción ecuatoriana. El responsable asume esa posición de forma consciente, documentada y con medidas compensatorias verificables, y se compromete a revisarla si el proveedor pone a disposición un addendum aplicable o si la SPDP se pronuncia.

---

# PARTE II — TRANSFERENCIA B: MOTOR DE VOZ DEL DISPOSITIVO

## 8. Descripción y análisis

**Qué ocurre.** La función de dictado de la nota clínica utiliza el servicio de reconocimiento de voz del propio dispositivo del profesional —Google en Android, Apple en iOS—. Según el dispositivo y su configuración, ese servicio puede transmitir el audio a servidores del fabricante ubicados fuera del Ecuador. **El responsable no recibe, no procesa y no conserva la grabación en ningún momento: recibe únicamente el texto ya transcrito.**

**Qué se transfiere.** La voz del médico veterinario y el contenido dictado, que puede incluir el nombre del paciente, el del establecimiento y la descripción clínica de la atención.

**Naturaleza del dato.** La voz constituye dato personal del profesional. **No constituye dato biométrico** en sentido técnico mientras se emplee para transcribir y no para identificar, que es el caso. Si el flujo se destinara alguna vez a identificación, ingresaría en la categoría de datos sensibles y esta evaluación quedaría sin efecto.

**Titular.** Es el **médico veterinario**, no la familia usuaria.

**Papel del destinatario.** El fabricante del sistema operativo **no es encargado del responsable**: no fue contratado por él, no recibe sus instrucciones y trata el audio bajo sus propios términos y su relación directa con el usuario del dispositivo. Es un **responsable independiente**.

**Instrumento: ninguno.** No existe relación contractual entre SATORI INOV LATAM S.A.S. y el fabricante respecto de este flujo. Por consiguiente **el Art. 21 no resulta aplicable**: no hay garantías adecuadas que evaluar, porque no hay instrumento que las contenga ni contraparte a quien exigírselas.

**Qué decidió el responsable, y por qué responde.** El responsable decidió **construir una funcionalidad que envía la voz de un profesional a ese servicio**. Responde por esa decisión —su licitud, su transparencia y su base de legitimación— y **no** por el tratamiento posterior del fabricante, que no puede determinar, instruir, auditar ni limitar.

## 9. Base de legitimación y medidas

**Base: consentimiento previo, específico e informado del médico veterinario**, única base disponible en ausencia de instrumento. Es válido porque es **libre**: la nota clínica puede redactarse manualmente y negar el dictado no restringe ninguna otra funcionalidad.

**M-7 — Consentimiento con acto expreso.** Diálogo de primer uso que informa que el audio **puede salir del dispositivo**, identifica al fabricante, enumera qué contiene el audio y ofrece la alternativa manual, con dos opciones de acción. La decisión se registra con su fecha.

**M-8 — Advertencia contemporánea.** Indicador visible **mientras** se dicta, para que el profesional lo sepa en el momento en que habla y no solo al aceptar un documento.

**M-9 — Prohibición de garantizar lo ajeno.** Los textos publicados informan y advierten; **no afirman** que el audio se procese de forma segura, que no se conserve o que no se use para otros fines, por no estar el responsable en condiciones de saberlo ni de comprometerlo. Se declara expresamente que el responsable no puede controlar ese tratamiento y se remite al profesional a la configuración de su dispositivo y a la política del fabricante.

**M-10 — Minimización a cargo del profesional.** Los Términos Pet Professional obligan al profesional a no incorporar al dictado datos personales de terceros que excedan lo necesario para el registro clínico.

## 10. Conclusión sobre la Transferencia B

La transferencia es **lícita** sobre la base del consentimiento informado del titular, adoptadas las medidas M-7 a M-10. Se hace constar que **no está amparada por garantías adecuadas** en el sentido del Art. 21, por inexistencia de instrumento, y que esa circunstancia se comunica al titular con claridad antes de recabar su consentimiento.

---

# PARTE III — CONSTANCIA Y ARCHIVO

## 11. Evidencia que se conserva (Anexo A)

Conforme al **Art. 4**, se conserva por **tres (3) años** contados desde la última transferencia amparada por esta evaluación:

1. Copia íntegra del *Anthropic Data Processing Addendum* evaluado, con constancia de la **fecha de aceptación** por el responsable.
2. Captura fechada de la **lista de subencargados** del proveedor al momento de esta evaluación.
3. **Requerimiento formal al proveedor** (M-6) y su respuesta, o constancia de la ausencia de respuesta.
4. Constancia de la **verificación del alcance de las funcionalidades de IA** contra el código, con fecha y responsable.
5. Registros de las **revisiones mensuales de subencargados** (M-4).
6. **Textos publicados** de la Política de Privacidad y del Aviso de IA, con número de versión y fecha de vigencia, y sus versiones anteriores.
7. **Registro de consentimientos** recabados para las funcionalidades de IA y para el dictado por voz.
8. Esta evaluación, firmada y fechada.

## 12. Incorporación al Registro de Actividades de Tratamiento

Ambas transferencias se incorporan al **RAT**, conforme a la LOPDP y a la Resolución SPDP-SPD-2026-0009-R, identificando finalidad, categorías de datos y de titulares, destinatario, base de legitimación, garantías aplicadas y plazo de conservación.

## 13. Revisión

Esta evaluación se revisa **anualmente**, y en todo caso **antes** de que ocurra cualquiera de los siguientes hechos:

- ampliación del conjunto de datos transferidos, incluida la conexión del componente de lectura del documento de identidad;
- incorporación de una nueva funcionalidad que trate datos personales mediante inteligencia artificial;
- cambio del plan o de la configuración contratada con el proveedor que altere la conservación o el uso de los datos;
- objeción o incorporación relevante de subencargados;
- publicación por la SPDP del listado de países con nivel adecuado de protección, o de un pronunciamiento sobre cláusulas de otros foros;
- puesta a disposición por el proveedor de un addendum aplicable al Ecuador o a jurisdicciones iberoamericanas.

## 14. Decisión y firma

El representante legal de SATORI INOV LATAM S.A.S., conocida esta evaluación, **aprueba** la realización de las transferencias descritas en las condiciones y con las medidas compensatorias aquí establecidas, y dispone su archivo junto con la evidencia del Anexo A por el plazo de tres años.

<br>

|  |  |
|---|---|
| **Firma** | ______________________________ |
| **Nombre** | Luis Guillermo Suárez González |
| **Cargo** | Representante legal |
| **Lugar y fecha** | Quito, 24 de agosto de 2026 |

<br>

*Documento sujeto a revisión por asesoría legal ecuatoriana con carácter previo a su suscripción.*
