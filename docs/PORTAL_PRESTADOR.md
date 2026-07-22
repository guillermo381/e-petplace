# PORTAL_PRESTADOR — Visión narrativa del portal del prestador

> **Versión:** v1.2
> **Última actualización:** 5 Jul 2026 — Sesión 42. Nota de cambio de superficie (app móvil Expo primaria, web secundaria del mismo código; alma ratificada intacta). Asimetría de complejidad por familia en 5.2. Familia A congelada con disparo. Referencia: `ESTRATEGIA_2026H2.md`.
> **Audiencia:** Founder, Claude (sesiones futuras), devs y diseñadores que se sumen al proyecto.
> **Análogo a:** `MODELO_PRODUCTO.md` (que describe el producto completo de e-PetPlace) pero específico del portal del prestador.

> **NOTA S42 — Cambio de superficie:** este documento fue escrito asumiendo un portal web. Desde S42 la superficie primaria del prestador es una **app móvil (Expo/React Native)**, con vista web como target secundario del mismo codebase (React Native Web). Evidencia: los prestadores reales viven en el celular; el desktop es casi inaccesible en su jornada. **El alma descrita en este documento se ratifica intacta** — sobriedad, dignidad, sin rankings, momentos sensibles coreografiados — y ahora se le debe una piel que la entregue. Toda referencia a "portal" en este documento debe leerse como "app del prestador". Rumbo completo en `ESTRATEGIA_2026H2.md`.

---

## Cómo usar este documento

- **Antes de construir cualquier pantalla del portal del prestador**: leer este documento. El frame conceptual aquí definido es vinculante para cualquier propuesta de UI.
- **Cuando una decisión técnica afecta cómo el prestador vive el portal**: contrastar con este documento. Si una decisión técnica rompe la visión narrativa, paramos y discutimos.
- **Cuando se proponga una feature nueva del portal**: filtrarla contra el alma definida aquí. Si la feature no abona al alma, no pertenece.
- **Cuando el founder vuelva al proyecto después de tiempo y no recuerde cómo se sentía el portal**: este documento es para recuperar el frame.
- **Cuando un dev nuevo se sume**: este es el documento que lee después de `MODELO_PRODUCTO.md` y antes de tocar código del portal.

---

## Relación con otros documentos maestros

`PORTAL_PRESTADOR.md` no duplica lo que ya está en otros documentos. Los usa.

- **`MODELO_PRODUCTO.md`** define el producto completo de e-PetPlace — las 3 capas, las 5 dimensiones de identidad, los 7 momentos vitales, multi-especie, principios éticos. Este documento traduce esa base a UI específica del portal del prestador.
- **`BIO_EXPEDIENTE.md`** define la estructura técnica del expediente. Este documento describe cómo el prestador interactúa con esa estructura, no su shape interno.
- **`EPETPLACE.md`** define la visión y modelo de negocio del ecosistema. Este documento describe cómo el portal del prestador abona a esa visión.
- **`POLITICAS_EPETPLACE.md`** define políticas operativas. Este documento describe cómo esas políticas se materializan en UI del portal.
- **`CLAUDE.md`** es el estado operacional del repo. Este documento es la dirección de producto del portal.
- **`CONTRATO_TRABAJO.md`** define cómo trabajamos founder + Claude. Este documento se construye respetando ese contrato.

### Portales hermanos (decisión arquitectónica S20)

`PORTAL_PRESTADOR.md` es uno de cinco documentos de visión narrativa del ecosistema. Cada portal tiene su propio canal en e-PetPlace y eventualmente su propio documento maestro de visión. Hoy se redacta este primero por ser el más crítico para el flujo de Bio-Expediente. Los demás se redactan cuando tengan disparo operativo concreto:

- **`PORTAL_PRESTADOR.md`** (este documento) — prestadores de servicios: vets, paseadores, groomers, hoteles, entrenadores. **En redacción S20.** Disparo: construcción inmediata de UI Bio-Expediente.
- **`PORTAL_SELLER.md`** — prestadores de productos. Base técnica definida (MediaLab + VTEX, ver `EPETPLACE.md` sección "Tienda y productos"). Visión narrativa por redactar. Disparo: cuando MediaLab esté listo para acordar contratos operativos y UX del seller.
- **`PORTAL_REFUGIOS_CRIADEROS.md`** — prestadores de causa: refugios (foco F1) y criaderos certificados (foco F2+). Por redactar. **Scope F1 cerrado en S20:** básico, foco en apoyo a adopción y donación. Disparo: primer refugio piloto.
- **`PORTAL_ADMIN.md`** — backoffice operativo. Base técnica construida en repo paralelo `portal-admin`. Visión narrativa por redactar. Disparo: cuando se expanda funcionalidad de admin o se sume equipo de operaciones.
- **`APP_CLIENTE.md`** — la app del dueño de la mascota. Por redactar al final, cuando el ecosistema de portales esté establecido. Disparo: integración Kushki + v2 de la app cliente.

**Principio de disciplina:** los portales hermanos son ambición declarada, no compromiso de redacción inmediata. Cada uno se redacta cuando tiene disparo real, no por completitud documental. Esto respeta el tiempo del founder solo y mantiene la calidad de cada documento. Los cinco son canales del mismo ecosistema — comparten alma, no estructura idéntica.

---

## 1. El alma del portal

### 1.1 La pregunta raíz

¿Qué siente un prestador cuando abre el portal por primera vez?

Esa pregunta es la raíz de todo el documento. Si la respuesta es "siento que estoy usando un sistema", perdimos. Si la respuesta es "siento que llegué a un lugar que me eligió y me reconoce", ganamos. Todo lo demás del portal — pantallas, flujos, jerarquías de información — se subordina a esa respuesta.

El portal del prestador no es software para vets, paseadores, groomers u hoteles. Es **el canal donde un prestador apasionado se encuentra con el ecosistema de e-PetPlace y vive el cuidado de mascotas con coherencia**. La diferencia es de naturaleza, no de tono: no estamos haciendo un CRM bonito, estamos haciendo otra cosa que se parece a un portal pero opera más cerca de una membresía profesional.

### 1.2 Tres momentos del prestador en el ecosistema

El portal no se comporta igual en todas las etapas del proyecto. Distinguimos tres momentos. La transición entre uno y otro es gradual, no hay corte tajante, pero el espíritu del portal cambia.

**Momento Fundacional.** Los primeros prestadores en Ecuador. Aproximadamente los primeros 15 en F1. Son personas que entran sabiendo que están dando forma al ecosistema, no que están consumiendo un producto terminado. Conocen al founder, conocen el propósito, vinieron porque algo de la propuesta los enganchó antes de que existiera marca. El portal en este momento es íntimo, ceremonioso, fundacional. Cada prestador recibe presencia física tangible. La voz del founder es presente y nombrada.

**Momento Pionero.** Los siguientes prestadores, hasta que el ecosistema tenga masa crítica reconocible (estimado: hasta los primeros ~500 prestadores en Ecuador + arranque Colombia/México). Entran a un proyecto que ya tiene tracción visible pero todavía no es marca consolidada. Saben que llegan temprano. El portal mantiene curaduría y aspiracional, la voz del founder se transforma de "soy Guillermo" a algo más institucional pero con humanidad. La pieza física se evalúa caso por caso según capital y resultados — sin compromiso permanente.

**Momento Establecido.** A partir de F3, cuando el ecosistema tiene masa crítica, marca reconocida y la pertenencia a e-PetPlace ya es aspiracional por inercia de la marca. El día 1 mantiene curaduría y dignidad pero descansa en la fuerza acumulada del ecosistema. Los prestadores que llegan en este momento entran a un lugar del que se habla mucho y se sienten honrados al ser aceptados. La pieza física ya no es regla — la pertenencia misma al ecosistema es el premio.

**El espíritu común a los tres momentos:** ser prestador de e-PetPlace es aspiracional. No buscamos tener 100 clínicas en Quito. Buscamos las 15 o 20 que más amen su oficio. Esto es invariante a través de los tres momentos. Lo que cambia es cómo lo comunicamos y qué ceremonia lo acompaña.

### 1.3 Filosofía luxury aplicada

"Luxury" en e-PetPlace no significa lujo en el sentido superficial de productos caros para pocos. Significa una experiencia cuidada al detalle, al alcance de quienes son elegidos por su pasión, no por su tamaño. Es Patagonia más que Louis Vuitton: misión clara, calidad inegociable, filtro de quién accede, sentido de pertenencia. Es Tesla en su primer Roadster más que Mercedes-Benz: no es lujo establecido, es lujo de proyecto, de momento histórico, de "estás siendo parte del comienzo".

Luxury en este documento significa cuatro cosas operativas:

- **Curaduría visible.** Los prestadores saben que fueron elegidos y por qué. La selección no es trámite, es decisión.
- **Coreografía intencional.** Cada momento del día 1 está pensado. Nada es accidente o "lo que salió". El orden en que aparecen las cosas, las palabras que se usan, los silencios — todo coreografiado.
- **Materialidad cuando importa.** Hay momentos donde un objeto físico tangible refuerza el vínculo con el portal. No es regalo de marketing — es presencia ceremoniosa que dura años.
- **Sobriedad sin frialdad.** Tipografía limpia, sin íconos chillones, sin pop-ups celebratorios. El portal habla con respeto adulto, no con entusiasmo infantilizado.

Luxury no es una promesa permanente de costo operativo creciente. Las decisiones que requieren costos materiales (envío de placas, eventos presenciales, ediciones limitadas) se toman caso por caso según capital, resultados y momento del proyecto. La filosofía es permanente; los gestos materiales son decisión consciente.

### 1.4 Lo aspiracional como invariante

Ser prestador de e-PetPlace tiene que sentirse como un alago. No nos hacen un favor sumándose — se los hacemos nosotros al elegirlos.

Esto no es retórica. Tiene implicancias operativas concretas en cómo se construye el portal:

- El proceso de selección comunica selectividad antes de que el prestador abra el portal. Aplicación con preguntas reales. Tiempo de espera deliberado (no aprobación automática inmediata). Notificación de aceptación que es carta humana, no email automático del sistema.
- El día 1 del portal abre con curaduría visible — el prestador es uno de un grupo elegido, no un usuario más.
- El portal no muestra métricas que sugieran que e-PetPlace está rogando por prestadores. No hay "ya somos 10.000". Hay "sos parte de un grupo curado de N en tu ciudad".
- El tono del portal trata al prestador como profesional respetado, no como cliente al que hay que retener.
- Las decisiones de visibilidad pública (cómo se muestra el prestador al cliente final, qué de su perfil aparece) se calibran para que ser parte sea visible como insignia, no como simple presencia en directorio.

El día que un prestador piense "no me puedo ir de e-PetPlace porque salir es perder algo importante para mi negocio y mi reputación", ganamos.

---

## 2. Día 1 del prestador

Lo que sigue describe el día 1 en detalle. Por las razones de la sección 1.2, hay diferencias entre los tres momentos. Donde aplica, las distinguimos. La estructura general es la misma.

### 2.1 El antes del día 1 — el proceso de selección

El portal empieza antes del portal. Cuando un prestador aplica a e-PetPlace, el proceso comunica selectividad y propósito desde el primer contacto.

La aplicación incluye una pregunta de propósito explícita: *¿por qué te metiste en esto? ¿qué significa para vos cuidar mascotas?* La respuesta no es opcional ni decorativa — se guarda. Más adelante en el documento (sección 2.3) veremos cómo esa respuesta vuelve a aparecer dentro del portal.

El tiempo de respuesta a la aplicación es deliberado. No hay aprobación automática. Hay revisión humana (founder + equipo en Momento Fundacional, equipo curador en Momentos posteriores). El prestador percibe que hay alguien del otro lado evaluando, no un algoritmo.

La notificación de aceptación es carta, no email transaccional. Tono humano, firma identificable. En Momento Fundacional, firma personal del founder.

### 2.2 La llegada — antes de abrir el portal por primera vez (Momento Fundacional)

Antes de que el prestador del Momento Fundacional abra el portal por primera vez, recibe un envío físico en su dirección.

El contenido es sobrio:

- Una carta breve firmada por el founder. Hecha en papel de calidad. No es marketing. Es bienvenida.
- Una **placa de vidrio** con su nombre y la frase "Prestador Fundador — e-PetPlace Ecuador — 2026". Diseño limpio, tipografía clásica, no más de 10cm. Es objeto exhibible — el prestador puede ponerlo en su consultorio, en su recepción, donde quiera. La placa convierte al prestador en presencia visible del proyecto sin pedírselo explícitamente. Cada cliente que entra al espacio del prestador ve la placa.
- El dato del primer login del portal.

La materialidad existe porque luxury es **presencia física antes de pantalla**. Cuando el prestador abre el portal por primera vez, ya hubo encuentro. El portal no es la primera impresión — la confirma.

Esta práctica está acotada deliberadamente a los primeros aproximadamente 15 prestadores fundadores. No es promesa permanente del producto. Para los Momentos Pionero y Establecido, la decisión de elementos físicos se evalúa caso por caso según capital disponible, resultados, y momento del proyecto.

### 2.3 La bienvenida digital — al abrir el portal por primera vez

Una pantalla completa, no popup. Lectura corta (30-45 segundos máximo). Estructura:

- **Saludo por nombre.** El prestador se llama X, no "estimado usuario".
- **Reconocimiento de la elección.** *"Te elegimos para ser uno de los N prestadores que dan forma a e-PetPlace en Ecuador."* En Momento Fundacional, N es un número chico y conocido. En Momento Pionero, N es contexto de cohorte ("uno de los primeros N en tu ciudad"). En Momento Establecido, el reconocimiento se transforma en "uno de los prestadores que cumplen los estándares de e-PetPlace en tu ciudad".
- **Devolución del propósito.** Si el prestador respondió la pregunta de propósito en la aplicación, su respuesta vuelve aparecer aquí. *"Vos nos dijiste: '[su respuesta]'. Acá te ayudamos a vivirlo todos los días."* Esto cierra un círculo emocional. El prestador encuentra sus propias palabras en el lugar al que llega.
- **Firma.** En Momento Fundacional: nombre completo del founder + "founder, e-PetPlace". En Momentos posteriores: firma se transforma a "el equipo de e-PetPlace" pero mantiene tono humano.
- **Una sola acción visible.** "Entrar a mi espacio."

Tono general de la pantalla: sobrio, humano, sin entusiasmo forzado. Es carta de bienvenida, no banner promocional. Tipografía limpia. Espacios generosos. Cero íconos celebratorios.

Antes de la acción final aparece una línea sobria que comunica con honestidad la existencia del Día 90 como momento del modelo:

> *"Los primeros 90 días son tu encuentro con e-PetPlace. Al cumplir el trimestre completamos juntos el momento de graduación."*

No se enfatiza. No es amenaza. Es información transparente sobre cómo funciona la membresía. El prestador entra sabiendo que existe un Día 90 con peso, sin recibir esa información como sorpresa al llegar.

### 2.4 El home — "tu espacio"

Tras la bienvenida, el prestador entra al home del portal. Tres elementos visibles, en jerarquía narrativa:

**Primera presencia — tu identidad como prestador.**

Arriba, no como header anónimo sino como firma del prestador en el sistema: nombre comercial, tipo de servicio, ciudad, foto. Limpio, sobrio. El prestador se ve representado dignamente desde el primer segundo. No es navbar con avatar de 30 píxeles. Es presencia visible.

**Segunda presencia — conocé a Zeus (la mascota demo).**

Una mascota demo con bio-expediente armado completo. Etiquetada claramente como mascota de ejemplo (etiqueta visible: *"Mascota de ejemplo — explorá libremente"*). El prestador puede entrar a su perfil, ver su timeline, ver eventos pasados, ver sus 5 dimensiones de identidad, ver casos clínicos si los tiene, ver handshakes recibidos de otros prestadores. **Antes de tener clientes reales, el prestador entiende qué es el producto vivo viéndolo funcionar.**

Esta mascota demo cumple dos funciones simultáneas:

- Para el prestador: comprende el bio-expediente sin tutorial. Linear demo workspace aplicado a e-PetPlace. Ve el destino, no le explican el destino.
- Para el founder: data de prueba siempre disponible para visualizar features durante desarrollo, sin contaminar producción ni tener que crear-borrar data constantemente.

El diseño de Zeus y su data tiene que ser cuidado — su historia, su personalidad, sus eventos. No es data mock random; es ejemplo curado de cómo se ve una mascota bien documentada en e-PetPlace. Zeus es mascota real del founder, lo que aporta autenticidad: la mascota demo no es invento de marketing, es presencia real del proyecto. Zeus enseña por presencia.

**Tercera presencia — prepará tu espacio.**

Las tareas operativas que el prestador necesita completar para que el portal pueda recibir clientes reales. Presentadas no como checklist administrativo, sino como invitación a preparar la casa.

Las tareas son: configurar servicios que prestás, configurar horarios de atención, configurar equipo (en caso de que tengas), configurar precios, configurar condiciones operativas (políticas de cancelación, anticipo, etc).

Cada tarea se presenta con descripción humana del **por qué** importa para el prestador, no solo qué hay que hacer. Por ejemplo, *"Configurá tus servicios"* no es *"selecciona tipo de servicio en dropdown"*. Es *"Decinos qué hacés y cómo lo hacés. Lo que escribas acá es lo que tus clientes van a leer cuando te encuentren."*

El prestador puede avanzar en cualquier orden. No hay wizard que lo obligue a una secuencia. Cada tarea completada se refleja visualmente con sobriedad (un check sutil, no animación celebratoria).

### 2.5 Lo aspiracional integrado

Un módulo discreto, no banner ni card chillona. Texto sobrio, abajo o lateral:

> *"Sos parte de un grupo curado de N prestadores en Ecuador. e-PetPlace no busca llenar — busca elegir bien. Gracias por sumarte al comienzo."*

En Momentos Pionero y Establecido el texto se adapta pero mantiene la naturaleza: comunicar curaduría, pertenencia, propósito. Nunca métricas vanidosas, nunca número grande que rogue por más prestadores.

### 2.6 Lo que NO aparece el día 1 — revelación progresiva

El portal del día 1 esconde deliberadamente módulos que todavía no tienen razón de aparecer. Aplicación directa del principio de revelación progresiva (`MODELO_PRODUCTO.md` sección 6.4): cada módulo aparece cuando tiene algo digno que mostrar.

Lo que no aparece el día 1:

- **Liquidaciones e ingresos.** Ocultos hasta que haya primera cita cobrada. Liquidaciones vacías son deprimentes y comunican fracaso, no preparación. Cuando aparezca la primera, hay momento narrativo (sección 3 del documento — TBD).
- **Comunidad de prestadores.** Oculta en Momento Fundacional si todavía no hay masa crítica. Aparece cuando exista grupo real con interacción real.
- **DaaS / insights agregados.** Ocultos en F1-F2. Aparecen en F3-F4 con data real y consentimiento.
- **Casos clínicos heredados (handshakes recibidos).** Ocultos hasta que el prestador reciba el primero real. El primer handshake es momento narrativo dedicado.
- **Estadísticas del propio negocio.** Ocultas hasta que el prestador tenga N atenciones. Mostrar "atendiste 0 mascotas este mes" es señal de fracaso, no de información útil.
- **Reseñas y reputación.** Ocultas hasta primera reseña real.
- **Notificaciones push activas.** Silenciadas hasta primera cita real programada. No spamear a quien todavía no tiene clientes.

El principio que une todo: **portal vacío es portal en preparación, no portal fracasado**. Cada módulo aparece cuando tiene algo digno que mostrar. La navegación lateral sí muestra los módulos como secciones existentes — pero al entrar, cada una comunica con claridad por qué está silenciada y qué la va a despertar.

### 2.7 Hitos de trayectoria, no de tarea

A medida que el prestador opera, ciertos hitos disparan reconocimiento. Decisión cerrada: **honramos trayectorias, no jerarquizamos prestadores**. No hay rankings comparativos. No hay "mejor prestador del año". Hay reconocimiento de momentos genuinos en la trayectoria de cada prestador.

Los hitos no son de tarea (Duolingo) — son de trayectoria. La diferencia es estructural: un hito de trayectoria es algo que el prestador recibe, no algo que busca para desbloquear puntos.

Hitos definidos:

- **Primera cita registrada en e-PetPlace.** Reconocimiento digital sobrio.
- **Primera mascota con bio-expediente continuo** (3 visitas o más a este prestador). Reconocimiento digital. Comunica que el prestador está construyendo relación, no atendiendo transacciones aisladas.
- **Primer handshake recibido de otro prestador.** Reconocimiento digital + breve explicación del valor del handshake en el ecosistema. Momento educativo natural.
- **Un año en el ecosistema.** Reconocimiento más significativo. En Momento Fundacional, puede llevar pieza física simbólica (por evaluar). En Momentos posteriores, reconocimiento digital cuidado.
- **100 mascotas atendidas.** Reconocimiento digital. Marca volumen sin compararlo con otros.

Reconocimientos por dimensiones complementarias (no comparativos, no jerárquicos), evaluables en el futuro:

- *Prestador con más continuidad de cuidado* (mascotas que vuelven). No compite con volumen.
- *Prestador que más enriqueció bio-expedientes* (calidad de documentación). No compite con calificación.
- *Prestador con más handshakes activos en el ecosistema* (red real). No compite con tamaño.

Cada reconocimiento es eje propio. Ningún prestador es "el mejor" — cada uno es excelente en su dimensión natural. Esto es coherente con `MODELO_PRODUCTO.md` sección 8.4 ("reputación de familias es discreta, no humillante") aplicado por simetría a prestadores: **reputación de prestadores es honrada, no jerarquizada**.

### 2.8 Resumen del Día 1

El día 1 del prestador en e-PetPlace es coreografía intencional con cuatro propiedades:

- **Selectividad comunicada.** Antes de abrir el portal, el prestador sabe que fue elegido.
- **Presencia ceremoniosa.** En Momento Fundacional, materialidad física. En todos los momentos, bienvenida humana y firmada.
- **Identidad reconocida.** El portal le devuelve sus propias palabras, lo nombra, lo presenta dignamente.
- **Vacío con dignidad.** Lo que aún no tiene contenido no se muestra como fracaso; se muestra como preparación. La mascota demo permite entender el producto antes de tener clientes reales.

Si un prestador del Momento Fundacional cierra el portal el día 1 sintiendo *"me eligieron, este lugar entiende lo que hago, no veo la hora de tener mi primer cliente acá"*, el día 1 fue exitoso. Si cierra el portal pensando *"otro CRM más para configurar"*, fracasamos.

---

## 3. Día 30 del prestador

### 3.1 La pregunta raíz del Día 30

Día 1 fue ceremonia. Día 30 es el primer test de verdad. Hace un mes que el prestador opera. La placa está exhibida. Las tareas iniciales están configuradas. Atendió entre 3 y 10 mascotas (estimación realista para F1 soft launch). ¿El portal sigue siendo lugar al que llegar, o ya se siente como sistema?

Día 30 es donde un producto luxury de día 1 puede degradarse silenciosamente a CRM aburrido. Es el test más duro del documento. Muchos productos pasan el día 1 brillantemente y pierden a sus usuarios entre el día 7 y el día 30. El portal del prestador tiene que estar diseñado para sostener el alma a través del uso, no solo a través de la primera impresión.

El estado mental del prestador a Día 30 no es uniforme. Conviven tres realidades:

- **Entusiasmo sostenido** — vio resultados, le entró trabajo, está adoptando el portal con ganas.
- **Curiosidad expectante** — operó pero todavía no vio nada que lo deje boquiabierto. Espera que el wow del día 1 se confirme con uso real.
- **Riesgo de fricción** — encontró cosas que no le gustan, dudas operativas, falta de claridad.

El portal a Día 30 tiene que **sostener la primera, alimentar la segunda y disolver la tercera**. Y tiene que hacerlo sin caer en ceremonia repetida (sería falsa) ni en silencio absoluto (sería abandono).

### 3.2 El espíritu del Día 30 — continuidad sin ceremonia

El Día 1 abrió con coreografía. El Día 30 no puede repetir esa coreografía sin que se sienta artificial. Lo que reemplaza la ceremonia es **continuidad con presencia**.

La continuidad significa que el prestador, al abrir el portal el Día 30, no encuentra un sistema reseteado o un dashboard frío. Encuentra **su propio trabajo del mes representado con dignidad**. Las mascotas que atendió tienen vida documentada. El bio-expediente que construyó es obra suya visible. Las pequeñas configuraciones que ajustó están guardadas con respeto.

La presencia significa que el portal **no lo olvidó después del Día 1**. Hay señales — no celebratorias, no transaccionales — de que el equipo y el founder siguen presentes y construyendo junto con él.

Tres frases guía para el espíritu del Día 30:

> *"Tu trabajo del mes vive acá. Lo que documentaste es parte de un bio-expediente real."*
> *"Estamos calentando motores juntos. Esto es lo que pasó este mes en el ecosistema."*
> *"Si tenés algo para decirnos, estamos del otro lado. Esto se está construyendo con vos."*

### 3.3 Reconocimiento sobrio condicional

Entre el Día 25 y el Día 35, **si el prestador operó realmente** (logueó con frecuencia, atendió mascotas, exploró módulos, documentó bio-expedientes), aparece en el home una sección discreta — no popup, no badge — con tono sobrio:

> *"En tu primer mes en e-PetPlace atendiste a [N] mascotas. La identidad de [nombre], [nombre] y [nombre] empieza a vivir en su bio-expediente gracias a lo que documentaste. Eso es lo que estamos construyendo juntos."*

Características del reconocimiento:

- **Es nombrado y específico.** Los nombres de las mascotas atendidas aparecen literalmente. No es "atendiste a 5 mascotas" genérico. Es "atendiste a Max, Luna y Pepe". Cada mascota tiene nombre y eso importa.
- **Reconoce el trabajo, no el volumen.** No es "felicitaciones por tu producción". Es "tu documentación está dando vida a estos perfiles".
- **No tiene call-to-action.** No hay botón "ver más" ni "compartir tu logro". Es nota para leer, no para accionar.
- **Aparece una vez.** No se repite cada mes. El reconocimiento del Día 30 es único — es la marca del primer mes. Otros hitos tienen sus propias notas.

**Si el prestador no operó** (poco login, poca exploración, ninguna mascota atendida), **no aparece nota**. El portal no fuerza falsa celebración. La ausencia de nota es también señal — el prestador atento se da cuenta de que algo le falta y eso abre conversación natural (sección 3.7).

### 3.4 La mascota demo pierde centralidad

Zeus sigue presente en el portal, pero su lugar en la jerarquía cambia.

En Día 1, Zeus era módulo central del home porque el prestador no tenía mascotas propias todavía. En Día 30, las mascotas reales del prestador toman el lugar central. Zeus se mueve a una sección accesible — *"Explorar mascota de ejemplo"* — desde el menú lateral o un acceso secundario.

Zeus no se elimina nunca. Cumple dos funciones que justifican su permanencia:

- Para el prestador, es referencia siempre disponible para entender funcionalidades nuevas del portal a medida que aparezcan.
- Para el founder y el equipo, es data de prueba estable para visualizar features durante desarrollo sin contaminar producción.

La transición de Zeus del centro al margen no se anuncia. Pasa naturalmente — el home reorganiza su jerarquía a medida que el prestador acumula trabajo real.

### 3.5 Módulos que se despiertan entre Día 1 y Día 30

La revelación progresiva opera entre Día 1 y Día 30. Algunos módulos que estaban silenciados se activan a medida que tienen contenido digno que mostrar:

- **Bio-expediente de mascotas reales atendidas.** Es lo más importante que aparece. El prestador puede entrar al perfil de una mascota que vio dos o tres veces y ver continuidad real — eventos sucesivos, evolución de su estado, identidad personal que se enriquece. Esto es Capa 1 y Capa 2 de `MODELO_PRODUCTO.md` operando en vivo, no en demo.
- **Liquidaciones** (si hubo cobros reales). Aparece la primera liquidación con momento narrativo breve: *"Esta es tu primera liquidación en e-PetPlace. Acá vive el historial financiero de tu trabajo."* No es notificación celebratoria — es reconocimiento operativo.
- **Notificaciones operativas reales.** Confirmaciones de citas, recordatorios de próximas atenciones. Las notificaciones tienen contenido genuino ahora. La bandeja vacía del Día 1 cobra vida.
- **Estadísticas básicas del propio trabajo.** Mascotas únicas atendidas, atenciones del mes, bio-expedientes enriquecidos. **No comparativas, no jerárquicas.** Honra de trayectoria personal, no vanity metric.

### 3.6 Módulos que SIGUEN ocultos al Día 30 en Momento Fundacional

La paciencia de la revelación progresiva se mantiene. No despertamos módulos por cumplir tiempo — solo por tener contenido digno:

- **Comunidad de prestadores.** Oculta. F1 soft launch con base chica no justifica módulo de comunidad — sería plaza vacía. Aparece en F2 cuando haya masa real.
- **DaaS e insights agregados.** Ocultos. No hay data suficiente para análisis agregados con consentimiento.
- **Handshakes recibidos de otros prestadores.** Probablemente ocultos al Día 30 porque la base chica vuelve poco probable un primer handshake en el primer mes. Cuando aparezca el primero, será momento narrativo dedicado (ver sección 7.4.1).
- **Reseñas y reputación.** Probablemente cero al Día 30 — F1 con pocos clientes finales no genera reseñas significativas todavía.

### 3.7 Aspiracional integrado, transformado

El módulo del Día 1 *"Sos parte de un grupo curado de N prestadores en Ecuador. e-PetPlace no busca llenar — busca elegir bien"* evoluciona en Día 30. La curaduría sigue presente pero gana contexto temporal: el ecosistema empezó a moverse.

Texto aproximado para Momento Fundacional:

> *"Sos uno de los [N] prestadores fundadores de e-PetPlace Ecuador. Este mes el ecosistema sumó [X] atenciones registradas y [Y] mascotas con bio-expediente activo. Tu trabajo es parte de esto."*

Si los números son chicos — y en F1 con 15 prestadores van a serlo — **no los maquillamos**. La verdad del momento es comunicación correcta. Luxury no oculta su fase; la honra. Un prestador fundador entiende que estamos calentando motores juntos. Inflar números rompería la confianza más que protegerla.

### 3.8 Canal directo con el equipo — decisión cerrada S20

A partir del Día 1 y permanente durante todo el Momento Fundacional, el portal tiene un canal visible para que el prestador contacte al equipo o al founder directamente. No es formulario de soporte tradicional. No es sistema de tickets. Es **acceso humano real**:

> *"Hablá con nosotros. e-PetPlace se está construyendo con vos."*

El canal se sostiene operativamente con dos compromisos asumidos formalmente en S20:

- **Equipo dedicado para los tres canales del ecosistema** (sellers, refugios, prestadores). El founder contrató o va a contratar a una persona para atender estos canales en Momento Fundacional. Esto vuelve sostenible la promesa.
- **Comunicación quincenal del founder a los primeros 10 prestadores fundadores** mientras dure el Momento Fundacional, hasta que el ecosistema alcance tracción real interesante. Tono humano, no email transaccional. Contenido: qué se construyó, qué se aprendió, qué viene, qué pensamos del feedback recibido. Esto sostiene la sensación de proyecto humano vs corporación.

Este canal y esta comunicación no son features del portal — son **prácticas del Momento Fundacional**. Son lo que distingue F1 luxury de F1 abandonado. Sin ellos, la decisión "no rogamos permanencia" se convierte en frialdad. Con ellos, esa decisión es coherente con el cuidado real del proyecto y de los prestadores fundadores.

### 3.9 Visibilidad del propio compromiso — decisión cerrada S20

El portal tiene una sección — accesible pero no protagónica — donde el prestador ve su propio compromiso visible. No es módulo de gamificación. No es ranking comparativo. Es **espejo personal para autoconciencia**:

- Frecuencia de login durante el mes.
- Módulos explorados.
- Mascotas atendidas con bio-expediente enriquecido.
- Documentación pendiente o incompleta.

El propósito no es vigilancia desde el equipo hacia el prestador. Es **herramienta del prestador para autoevaluar su trayectoria**. Un prestador serio mira esta sección y entiende dónde está parado. Le permite ajustar antes de que el equipo intervenga.

Esta visibilidad conecta directamente con la próxima decisión cerrada.

### 3.10 Membresía revocable por inactividad demostrable — decisión cerrada S20

Decisión de modelo cerrada formalmente en S20:

**Ser prestador de e-PetPlace es membresía con compromiso recíproco.** El proyecto compromete curaduría, vínculo humano, calidad del portal, defensa del modelo. El prestador compromete actividad real, documentación honesta, cuidado de las mascotas en su portal.

**Si un prestador demuestra inactividad sostenida** (poco o ningún login, ninguna mascota atendida con calidad, ninguna documentación enriquecida durante un período significativo), **la membresía puede ser revocada**.

Características de la revocación:

- **No es automática.** Requiere proceso humano: revisión por el equipo, carta de la dirección al prestador, conversación honesta, decisión final.
- **No es trampa silenciosa.** El compromiso recíproco se comunica al prestador al ingresar — forma parte del contrato de membresía. El prestador sabe desde el Día 1 que la pertenencia se sostiene con acción, no con palabras.
- **No es persecución.** Cuando un prestador serio decide salir, no lo perseguimos. La regla "no rogamos permanencia" aplica acá. Pero **aprendemos de su salida**: una conversación honesta de 30 minutos antes de cerrar la membresía puede revelar problema del producto, no del prestador. Esa conversación es valor, no súplica.

**Por qué esta decisión:**

e-PetPlace es proyecto luxury con curaduría real. Mantener prestadores inactivos rompe la promesa de curaduría hacia el resto del ecosistema y hacia los clientes finales que buscan prestadores comprometidos. La selectividad sin renovación es selectividad pasada. La selectividad con renovación es selectividad viva.

Esto es coherente con el principio "acciones más que palabras" declarado por el founder en S20. No queremos a quienes dicen amar las mascotas y apasionarse por ellas — queremos a quienes lo demuestran cada día.

**Lo que NO es esta decisión:**

- No es revocación por bajo volumen. Un prestador que atiende pocas mascotas pero las cuida con excelencia es prestador comprometido. La inactividad demostrable es ausencia de actividad, no volumen bajo.
- No es revocación por errores. Los errores se conversan y se corrigen. La revocación es para abandono real, no para problemas operativos.
- No es revocación por desacuerdo. Un prestador que da feedback duro al equipo está aportando — eso es lo opuesto a abandono.

### 3.11 No rogamos permanencia — decisión cerrada S20

Decisión de modelo cerrada formalmente en S20 que orienta toda la filosofía operativa del portal:

**e-PetPlace no ruega permanencia.** La calidad del producto y la curaduría del ecosistema justifican selectividad. Cuando un prestador serio decide irse, aprendemos de su salida sin perseguirlo. No hay campañas de retención, descuentos de despedida, ni mensajes de "te extrañamos". Eso es manipulación, no respeto.

**Tres matices honestos a esta decisión:**

1. **Confianza fundada conceptualmente ≠ confianza fundada empíricamente.** Hoy, en F1, son 0 prestadores reales. La confianza del founder en la calidad del producto viene del modelo articulado, no del tracking real. Cuando hayan 15 prestadores fundadores que renueven membresía y traigan otros prestadores serios, la confianza pasa de fundada-conceptualmente a fundada-empíricamente. Hasta entonces, mantener humildad: el producto todavía no se validó en uso masivo.

2. **No rogar es distinto de ser arrogante.** El tono importa. Selectividad puede comunicarse desde *"sabemos que somos buenos"* o desde *"elegimos con cuidado quién entra porque queremos hacer las cosas bien con quien comparte el propósito"*. Lo segundo es luxury. Lo primero es inseguridad disfrazada de exclusividad.

3. **No perseguir ≠ no aprender.** Cuando un prestador serio se va, una conversación honesta de 30 minutos puede revelar problema del producto. La regla "no rogamos" aplica a no perseguir gente que ya decidió que no le interesa. No aplica a indagar por qué alguien que parecía comprometido se fue. La diferencia importa.

### 3.12 Resumen del Día 30

El día 30 del prestador en e-PetPlace mantiene el alma del día 1 sin repetir su ceremonia. Cinco propiedades:

- **Continuidad con presencia.** El portal recuerda el mes que pasó y lo refleja con dignidad. El trabajo del prestador vive ahí, no se reseteó.
- **Reconocimiento sobrio condicional.** Si el prestador operó, hay nota nombrada y específica. Si no operó, hay silencio honesto. El portal no fuerza falsa celebración.
- **Revelación progresiva activa.** Módulos que aparecen porque tienen contenido. Otros que siguen ocultos porque no tendrían qué mostrar todavía.
- **Canal humano sostenido.** El equipo y el founder siguen presentes. Comunicación quincenal del founder a los primeros 10. Canal directo siempre disponible.
- **Compromiso recíproco visible.** El prestador ve su propia trayectoria. Sabe que la pertenencia se sostiene con acción. Membresía es vínculo activo, no derecho adquirido.

Si un prestador del Momento Fundacional cierra el portal el día 30 sintiendo *"estamos calentando motores juntos, mi trabajo está vivo acá, este lugar realmente le importan las mascotas"*, el día 30 fue exitoso. Si cierra el portal pensando *"esto no trae nada, lo abandonaron después del día 1"*, fracasamos.

El reto del Día 30 en F1 soft launch es luchar contra esa segunda sensación. No con ruido. Con presencia real, comunicación honesta, y curaduría sostenida.

---

## 4. Día 90 del prestador — Graduación

### 4.1 La pregunta raíz del Día 90

Día 1 fue ceremonia. Día 30 fue continuidad sin ceremonia. Día 90 es **transición real con peso**.

Tres meses de operación. Los primeros 15 fundadores ya cumplieron el primer trimestre. Por debajo de ellos empezaron a entrar los pioneros tempranos — prestadores que no reciben placa de vidrio porque la práctica fundacional terminó, pero que entran al mismo proceso de 90 días.

El prestador que llega al Día 90 trae preguntas distintas a las de Día 1 o Día 30. Vienen en orden de importancia:

- **"¿Esto se está poniendo serio?"** — vio crecimiento del ecosistema, llegan más mascotas reales, el portal tiene vida. Está empezando a creer.
- **"¿Sigo siendo especial?"** — nota que entraron otros. Necesita reafirmación de que su lugar como fundador sigue valiendo.
- **"¿Esto me sirve realmente para mi negocio?"** — cálculo frío del trimestre. ¿Le entró trabajo, le aportó ingresos, le sirvió o sigue siendo experimento?
- **"¿Quiero quedarme acá o me voy?"** — momento natural de decisión.

El portal a Día 90 tiene que responder a las cuatro, en ese orden, **sin sentirse como evaluación contractual**. La respuesta principal es un acto: **la graduación**.

### 4.2 La graduación — decisión cerrada S20

Los primeros 90 días de cada prestador son **período de encuentro con e-PetPlace**. Comunicado desde el Día 1 con honestidad (sección 2.3) sin enfatizar. Al cumplirse el trimestre, si el prestador cumple criterios mínimos, **se gradúa** como prestador certificado de e-PetPlace.

La graduación aplica a todos los prestadores del ecosistema — fundadores y pioneros por igual. No es práctica exclusiva del Momento Fundacional. Es **mecánica permanente del modelo**: cada prestador que ingresa al portal pasa por su propio Día 90.

**Criterios mínimos de graduación (decisión cerrada S20):**

- Completó la configuración inicial del portal (servicios, horarios, equipo si aplica, precios, condiciones operativas).
- Atendió al menos 3 mascotas reales durante los 90 días.
- Documentó bio-expedientes con calidad razonable — entendido como documentación real, no checkbox completado por trámite.
- No incurrió en inactividad demostrable (sección 3.10).

Estos criterios son **no agresivos por diseño**. Al prestador que entró con compromiso real le va a salir natural graduarse. El filtro no está pensado para excluir — está pensado para que la graduación sea **significativa**. Si todos los que se gradúan son los que de hecho operaron con seriedad, la insignia "Prestador certificado de e-PetPlace" tiene valor real.

**Si un prestador no cumple criterios al Día 90, no se gradúa.** Esto no es expulsión automática — abre conversación humana. Tres caminos posibles según el caso:

- **Extensión del período de encuentro.** Si hay razones genuinas (el prestador venía operando bien pero atravesó algo que lo frenó), se extiende el período por otro trimestre.
- **Conversación honesta de salida.** Si la inactividad o la baja calidad reflejan que el modelo no encaja con el prestador, se cierra con cuidado. Aprendemos de la salida (sección 3.11) sin perseguir.
- **Apoyo focalizado.** Si el prestador quiere graduarse pero no llegó por dificultades operativas concretas, el equipo dedicado (sección 3.8) interviene con apoyo real durante un período acotado.

### 4.3 El acto de graduación

Al cumplirse el Día 90, si el prestador califica, el portal coreografía un momento específico. **No es notificación común. Es ceremonia sobria** — paralela a la bienvenida del Día 1 pero con tono distinto.

Una pantalla aparece al ingresar (o en el primer login después del Día 90 efectivo). Estructura:

- **Saludo por nombre.**
- **Reconocimiento del trimestre.** *"Llegaste al trimestre. Atendiste a [N] mascotas. Documentaste [M] bio-expedientes. Construiste continuidad de cuidado con [X] familias. Eso es lo que estábamos esperando ver."*
- **Acto de graduación.** *"Sos prestador certificado de e-PetPlace."*
- **Lo que se desbloquea con la graduación** (sección 4.4).
- **Firma.** En Momento Fundacional: firma del founder. En Momento Pionero y Establecido: voz híbrida — firma del founder en momentos significativos como este, voz del equipo en comunicaciones operativas.
- **Acción única:** *"Conocer mi nuevo espacio."*

Tono: ceremonioso pero sobrio. No es "felicitaciones, ganaste un premio". Es **reconocimiento de logro genuino que merece presencia**.

### 4.4 Lo que se desbloquea con la graduación

La graduación no es solo símbolo. Tiene contenido operativo concreto que el portal libera ese día:

**Insignia visible permanente.** El prestador recibe el emblema "Certificado de e-PetPlace" en su perfil. La insignia es visible en todos los puntos donde el prestador aparece dentro del ecosistema: app cliente, perfil público (sección 4.5), comunicación con familias, handshakes con otros prestadores. La insignia es **honra portable**: el prestador la lleva consigo dentro del ecosistema.

Los fundadores graduados mantienen además su insignia previa "Fundador / 2026" (de Sección 2.2). La graduación se suma, no reemplaza.

**Página web pública dentro del ecosistema — decisión cerrada S20.** Cada prestador graduado recibe **una página web pública dentro del dominio de e-PetPlace**. URL pública (por ejemplo, `e-petplace.com/quito/[nombre-prestador]` o equivalente final). La página incluye:

- Perfil del prestador con foto, especialidad, ciudad, biografía corta.
- Insignia de certificación e-PetPlace visible.
- Insignia de "Fundador" cuando aplica.
- Servicios ofrecidos con descripción del prestador.
- Horarios y modalidades de atención.
- Reseñas reales cuando existan.
- Información de contacto y reserva.
- Cuando el prestador ofrezca servicios de Familia G (certificación), distintivo visible que comunica *"ofrece certificación oficial"* con el tipo de certificado disponible (ESA, animal de servicio, traslado internacional). Esto vuelve a la página un activo más fuerte para prestadores que tengan esa licencia.

Esta página es **activo real del prestador**. Es valor tangible que la graduación desbloquea — visibilidad pública, captación de clientes nuevos, dignidad de marca dentro del ecosistema, SEO local. No es feature menor del portal. Es **promesa explícita del Día 90** que refuerza la pertenencia: salir de e-PetPlace significa perder esta presencia pública construida.

Esta decisión genera deuda documental en `EPETPLACE.md` y `MODELO_PRODUCTO.md` para anclar el alcance técnico y de modelo en el resto de la documentación maestra.

**Dashboard con sofisticación narrativa.** El home del prestador graduado evoluciona hacia un dashboard más rico — no en cantidad de métricas, sino en **profundidad temporal de las existentes** (sección 4.5).

### 4.5 El dashboard del graduado — sofisticación narrativa

El dashboard del Día 90 no agrega vanity metrics. **Agrega vista temporal a las métricas que ya existían.** Lo que en Día 30 era "atendiste 5 mascotas este mes" se transforma en una vista que cuenta la historia del trimestre:

- **Evolución mensual visible.** Mascotas atendidas mes 1, mes 2, mes 3. Bio-expedientes enriquecidos por mes. Continuidad de cuidado (mascotas que volvieron).
- **Bio-expediente más enriquecido del trimestre.** El portal destaca, sobriamente, qué mascota tiene la documentación más rica gracias al trabajo del prestador. *"Pepe, beagle de 4 años. Su bio-expediente lleva 5 visitas tuyas, 12 eventos documentados y 3 dimensiones de identidad enriquecidas. Es el más completo de tu trimestre."* Reconocimiento personal específico, no abstracto.
- **Continuidad de relación.** Cuántas familias volvieron en el trimestre. Esto es métrica de luxury real — la familia que vuelve es voto de confianza al prestador. Mucho más significativo que volumen.
- **Trayectoria propia, no comparada.** Cero referencias a otros prestadores. Cero rankings. Cero leaderboards. La trayectoria es exclusivamente del propio prestador a través del tiempo.

El espíritu del dashboard sigue siendo el del documento entero: **honra de trayectoria, no jerarquización**. Lo que cambia entre Día 30 y Día 90 es la profundidad temporal disponible — tres meses dan perspectiva que un mes no daba.

### 4.6 Lo que NO ve el prestador al Día 90

Aplicación continuada del principio de revelación progresiva. Algunos módulos siguen ocultos al Día 90 con disparo posterior:

- **Otros prestadores del ecosistema visibles.** Decisión cerrada S20: **no se muestra al Día 90**. Se libera solo cuando e-PetPlace opere en al menos tres ciudades. Razones: (i) base chica en una sola ciudad vuelve la visibilidad limitada y forzada, (ii) introduce riesgo de comparación operativa que el modelo rechaza, (iii) la pertenencia al Día 90 ya se refuerza con graduación + página pública + insignia — no requiere ver al resto para sentirse parte. La visibilidad del ecosistema prestador-a-prestador es feature de momento más avanzado.
- **Comunidad de prestadores activa.** Mismo criterio que la sección 3.6. Se libera con masa real.
- **DaaS / insights agregados.** Siguen ocultos en F1-F2.
- **Métricas comparativas o rankings.** Ocultos siempre. No es revelación progresiva — es exclusión permanente del modelo.

### 4.7 La voz del founder en Día 90 — transición a voz híbrida

En Día 1 la bienvenida iba firmada por el founder personalmente. En Día 30 la comunicación quincenal era íntegramente del founder. **Día 90 es donde la voz del founder comienza a transformarse a modelo híbrido — decisión cerrada S20.**

A partir del Día 90, la voz del founder se reserva para momentos significativos:

- Acto de graduación de cada prestador (sección 4.3).
- Aniversarios y hitos grandes de trayectoria.
- Decisiones de modelo comunicadas al ecosistema.
- Cartas estratégicas trimestrales o cuando haya algo real que decir.

La comunicación operativa cotidiana pasa a **voz del equipo** dedicado del founder. Tono humano sostenido, pero ya no firma personal del founder en cada email.

Esta transición no se anuncia formalmente al prestador. Pasa naturalmente. La voz del founder no desaparece — se concentra en los momentos donde su presencia significa más. Es **escalabilidad sin pérdida de alma**: el founder no puede sostener firma personal con 50 prestadores como sostuvo con 15, y forzarlo terminaría diluyendo el peso de su firma. Concentrarla la preserva.

Para los fundadores específicamente, la comunicación quincenal del founder a los primeros 10 (sección 3.8) se mantiene mientras dure el Momento Fundacional. Esto es promesa específica del compromiso recíproco con los fundadores.

### 4.8 El check-in humano del Día 90 — decisión cerrada S20

El Día 90 incluye un momento operativo concreto que va más allá del portal: **una conversación real entre cada prestador y el equipo dedicado** (en Momento Fundacional, idealmente con el founder; en Momentos posteriores, con el equipo). 

Decisión cerrada: el check-in es **conversación natural, no renovación contractual**. La estructura es humana:

- *"¿Cómo te está yendo realmente?"*
- *"¿Qué del portal te aportó valor en estos tres meses?"*
- *"¿Qué cambiarías?"*
- *"¿Qué te frenó cuando algo no funcionó?"*

No es entrevista de evaluación. Es check-in genuino. El prestador percibe que **el equipo está interesado en su experiencia**, no en retenerlo por métrica.

Como subproducto natural, la conversación cierra de hecho la cuestión de continuidad. Si la conversación va bien, el prestador continúa naturalmente. Si la conversación revela problemas operativos, el equipo trabaja para resolverlos. Si la conversación revela que el modelo no encaja con el prestador, se cierra con honestidad — coherente con "no rogamos permanencia" (sección 3.11).

Esta práctica es **sostenible operativamente porque la base es chica** en Momento Fundacional. Con 15 fundadores, son 15 conversaciones de 30-45 minutos. Con 50 prestadores en Momento Pionero, son 50 conversaciones — empieza a doler. Eventualmente, con masa mayor, esta práctica se restructura: pasa a check-in escrito guiado, o a conversaciones espaciadas en el tiempo, o a feedback a través de canal directo (sección 3.8). El espíritu se preserva incluso si la mecánica cambia.

### 4.9 Protección activa del sentido fundador

Día 90 es la primera vez que un fundador puede sentir dilución de su pertenencia fundadora, porque ve que entran otros al ecosistema. **El portal protege activamente ese sentido — no asume que se sostiene solo.**

Mecanismos concretos:

- **Insignia "Fundador / 2026" permanente.** Visible en perfil del prestador dentro del portal, en perfil público (sección 4.5), en comunicación con familias y otros prestadores. Es marca distintiva que los pioneros que entran después **no pueden obtener**. Su pertenencia es fundadora; la de los pioneros es pionera. Ambas son honradas, ninguna se confunde.
- **Acceso permanente al canal del founder.** Los fundadores mantienen comunicación quincenal con el founder mientras dure el Momento Fundacional. Los pioneros tienen acceso al equipo dedicado, no al founder. Diferenciación real, no cosmética.
- **Comunicaciones específicas a fundadores cuando hay decisiones del proyecto.** Por ejemplo, cambios de modelo, expansión a nuevas ciudades, decisiones estratégicas. Los fundadores se enteran primero, con tono de consulta, no de comunicación. Su voz cuenta.
- **Eventos físicos cuando el capital lo permita.** Encuentros presenciales entre el founder y los fundadores. Esto se evalúa caso por caso según presupuesto y momento del proyecto. No promesa permanente.

El principio que une: **ser fundador de e-PetPlace tiene significado más allá del Día 1**. Eso se materializa en práctica concreta del portal y del proyecto, no solo en retórica.

### 4.10 Lo que un fundador siente al Día 90

Si el prestador del Momento Fundacional cierra el portal el Día 90 sintiendo:

> *"Esto se está poniendo serio. Me gradué con honestidad. Tengo mi página dentro del ecosistema. Mi insignia de Fundador sigue valiendo. El founder sigue presente para mí. Lo que estoy construyendo acá es real."*

El Día 90 fue exitoso.

Si el prestador cierra el Día 90 sintiendo:

> *"Esto se llenó de gente, ya no soy especial. No vi diferencia real con el Día 30. La graduación es trámite. No siento que mi voz importe."*

Fracasamos.

El reto del Día 90 no es agregar features. Es **demostrar con acto que el modelo es coherente con la promesa del Día 1**. La graduación, la página pública, la insignia, el check-in humano y la voz del founder concentrada en momentos significativos son ese acto. Sin ellos, el Día 90 es Día 30 con tres meses encima. Con ellos, es transición real del prestador a miembro pleno del ecosistema.

### 4.11 Resumen del Día 90

El día 90 del prestador en e-PetPlace es **transición con peso**. Cinco propiedades:

- **Graduación como acto sustantivo.** Criterios mínimos no agresivos. Ceremonia sobria. Honra de logro genuino.
- **Activos reales desbloqueados.** Insignia portable, página web pública dentro del ecosistema, dashboard con sofisticación narrativa.
- **Voz del founder concentrada.** No desaparece — se reserva para momentos significativos. Permite escalabilidad sin pérdida de alma.
- **Check-in humano real.** Conversación, no renovación. El equipo escucha. El prestador se siente cuidado.
- **Pertenencia fundadora protegida.** Para los fundadores, mecanismos concretos que distinguen su pertenencia de la pionera. No es retórica — es práctica del portal.

Si funciona, Día 90 es el momento donde el prestador deja de ser invitado y se vuelve miembro pleno del ecosistema. **Salir de e-PetPlace después del Día 90 empieza a tener costo real**: la insignia, la página web pública, la red, la continuidad. Eso es la promesa que hicimos al Día 1 vuelta concreta a los tres meses.

---

## 5. Diferenciación por familia de servicios

### 5.1 El cambio de marco — prestador definido por servicios, no por tipo

Hasta acá el documento habló del prestador en abstracto. Pero un vet clínico, un paseador y un hotel viven el portal de forma distinta. Necesitamos bajar a esas diferencias sin romper el alma común.

**Decisión de modelo cerrada S20:** el prestador en e-PetPlace **no se define por su "tipo", se define por los servicios que ofrece**. La diferenciación del portal opera a nivel de servicio, no a nivel de prestador.

Implicancia central: un mismo prestador puede ofrecer múltiples familias de servicios. Una clínica veterinaria típica ofrece consulta + vacunación + (a veces) guardería + (a veces) grooming. Un paseador puede ofrecer paseo + cuidado nocturno. Un adiestrador puede sumarse a una guardería como servicio complementario. El portal compone la experiencia según los servicios habilitados, no según una categoría fija del prestador.

Esto también significa que el prestador puede **sumar servicios después**. Un vet que decide agregar guardería al sexto mes ve su portal incorporar las piezas operativas correspondientes sin migrar de "tipo". El modelo es aditivo, no excluyente.

### 5.2 Las seis familias de servicios — cinco para F1, una diferida

Definimos seis familias de servicios que el portal soporta conceptualmente. Cinco se construyen en F1; la sexta (Familia G — certificación) queda diseñada en el modelo pero su construcción se difiere hasta que aparezca demanda real (sección 5.3 cierre). Las familias se definen por **JTBD del dueño** (job to be done), no por categoría profesional del prestador:

**Familia A — Servicios clínicos.** JTBD: *"mi mascota se enferma, necesita control, o tiene una urgencia."* Incluye consulta veterinaria, control programado, urgencias, exámenes clínicos, cirugía, recetas. Caracterizada por documentación densa y vínculo profundo con bio-expediente clínico.

**Familia B — Vacunación.** JTBD: *"mi mascota necesita vacunarse según calendario, o aplicación específica que toca ahora."* Separada de Familia A por tener catálogo de vacunas con composición precio-aplicación, y por permitir flow operativo distinto (a veces sin cita formal — "lo llevo en la tarde del día X"). Generalmente la ofrece un prestador clínico, pero modela aparte por su mecánica diferenciada.

**Familia C — Cuidado temporal.** JTBD: *"no puedo cuidar a mi mascota durante un tiempo determinado, necesito que alguien lo haga."* Tiene tres variantes operativas: guardería diurna, hospedaje nocturno (estadía de varios días), cuidado en el domicilio del dueño. El servicio puede o no incluir adiestramiento o grooming según el operador.

**Familia D — Paseo.** JTBD: *"mi mascota necesita ejercicio y socialización que yo no le puedo dar."* Caracterizada por alta frecuencia (puede ser diaria), corta duración (30-90 minutos), y modelos de cobro variados (paseo único, paquete de paseos, contrato mensual).

**Familia E — Estética y bienestar.** JTBD: *"mi mascota necesita higiene, corte o cuidado estético regular."* Incluye baño, corte, spa, tratamientos dermatológicos no clínicos. Caracterizada por frecuencia media (mensual a trimestral) y vínculo recurrente con familias estables.

**Familia F — Adiestramiento.** JTBD: *"quiero que mi mascota aprenda comandos, modificar un comportamiento o socializar mejor."* Puede ofrecerse standalone (adiestrador independiente) o integrado a otras familias (guardería con adiestramiento, paseador con elementos pedagógicos). Caracterizada por progresión pedagógica en el tiempo y documentación específica de avances.

**Familia G — Certificación y documentación oficial.** JTBD: *"necesito un documento oficial relacionado con mi mascota que tenga validez externa a e-PetPlace."* Agrupa tres variantes operativas: certificación de animal de soporte emocional (ESA), certificación de animal de servicio, y certificación para traslado internacional. **Naturaleza distinta a todas las anteriores**: el producto principal del servicio es un documento oficial con valor legal o administrativo, con la atención clínica como subproducto. Requiere marco regulatorio versionado por país (Ecuador, Colombia, México tienen normas distintas; traslado internacional depende del país destino).

(Seis familias por JTBD. Adiestramiento queda diferenciado a pesar de que en F1 será mayormente integrado a otras familias — el modelo lo soporta autónomo desde el inicio. Certificación queda como familia separada por su naturaleza distinta — produce documentos oficiales, no atención.)

**Asimetría de complejidad por familia (S42).** Las familias no toleran la misma profundidad de interfaz. Paseo: mínimo absoluto — el paseador quiere casi nada entre él y el paseo. Estética/grooming: algo más, pero con prueba de "cero explicación". Clínicos: mayor tolerancia esperada a profundidad — pero sin una sola conversación de evidencia todavía; la Familia A está congelada hasta 3-5 reuniones con vets (disparo en `ESTRATEGIA_2026H2.md` Sección 8). El frame común de las familias se mantiene; la profundidad tolerable se calibra por familia, no se hereda.

### 5.3 Familia A como anclaje técnico y narrativo

**Decisión cerrada S20:** la Familia A (servicios clínicos) es el anclaje técnico y narrativo del portal.

Tres razones:

- Es la familia con **documentación más densa** (HC, casos clínicos, exámenes, medicación, alergias, condiciones crónicas). Si el portal sirve bien al flujo clínico, las otras familias se construyen con frame ya probado y con menos exigencia documental.
- El **handshake clínico** entre vets es la pieza central del modelo defensivo del producto (`MODELO_PRODUCTO.md` sección 3.2.7). El bio-expediente compartido en clínica es el activo más difícil de replicar por competidores. Si la Familia A no funciona, el modelo se queda sin su pieza más fuerte.
- El **vínculo con la familia humana** es más profundo en clínica que en cualquier otra familia. El vet acompaña vida y enfermedad — eso es lo que justifica luxury en su forma más pura.

Esto define el orden de prioridad de construcción para F1:

1. **Familia A** (clínicos) — primero. Define el frame técnico para todo lo demás.
2. **Familia B** (vacunación) — segundo. Comparte prestador con Familia A pero requiere catálogo específico.
3. **Familia D** (paseo) — tercero. Simple operativamente, permite validar el portal con prestadores menos exigentes técnicamente.
4. **Familia E** (estética) — cuarto. Catálogo simple, documentación media.
5. **Familia C** (cuidado temporal) — quinto. La más compleja operativamente (cronograma de actividades, alimentación, medicación durante estadía). Conviene construirla con frame ya validado.
6. **Familia F** (adiestramiento) — sexto. En F1 será mayormente integrado a otras familias; standalone se desarrolla cuando aparezca demanda real.

Este orden no es promesa rígida — es prioridad informada por la importancia técnica y narrativa. Si emerge demanda concreta de un prestador serio de otra familia antes, se reordena con criterio.

**Familia G (certificación) queda diferida deliberadamente.** No entra en el orden de construcción de F1 por tres razones:

- F1 con 15 prestadores difícilmente tendrá demanda significativa de certificaciones desde los primeros meses.
- El motor de catálogo y el bio-expediente con vista diferenciada van a tomar tiempo de construir para las primeras cinco familias.
- Lanzar certificación sin tener bien resueltos los marcos regulatorios por país es **riesgo legal real**. Es construcción que merece tiempo y cuidado.

**Hito de disparo para Familia G:** cuando aparezca un prestador serio con licencia o capacidad real de emitir estos certificados, e-PetPlace prioriza su construcción. Mientras tanto, Familia G queda documentada conceptualmente en el modelo pero no se construye. El portal informa al prestador interesado que la familia está "en hoja de ruta" sin prometer fecha.

> **Nota S42:** este orden de construcción (A primero) queda
> suspendido. La Familia A está congelada sin evidencia (disparo:
> 3-5 reuniones con vets). El orden F1 vigente es paseo → grooming
> rediseñado, sobre la app móvil. Ver ESTRATEGIA_2026H2.md
> Secciones 7-8.

### 5.4 Dimensiones donde las familias se diferencian

Las familias difieren en seis dimensiones operativas. El portal compone cada experiencia según estas dimensiones. (Familia G aparece descrita conceptualmente porque el modelo la contempla, aunque su construcción se difiere.)

**Frecuencia de atención por mascota.**
- Clínicos: ocasional (revisión anual, urgencias, casos crónicos).
- Vacunación: programada según calendario (1-3 veces al año típicamente).
- Cuidado temporal: ocasional pero estadías largas, o recurrente si guardería diurna.
- Paseo: alta (diaria o varias por semana).
- Estética: media (mensual a trimestral).
- Adiestramiento: alta durante un período acotado (semanal por meses), después esporádica.
- Certificación: puntual — la mayoría de los certificados son emisión única, con renovación según marco regulatorio (anual para algunos, multianual para otros).

**Duración del servicio.**
- Clínicos: 30-60 min por consulta.
- Vacunación: 15-30 min.
- Cuidado temporal: horas a semanas.
- Paseo: 30-90 min.
- Estética: 1-3 horas.
- Adiestramiento: 30-60 min por sesión.
- Certificación: 30-60 min de evaluación clínica + trabajo administrativo del prestador para emitir documento.

**Profundidad de documentación necesaria.**
- Clínicos: muy alta. HC, casos, exámenes, recetas.
- Vacunación: media. Aplicación documentada con composición, fecha, próxima dosis.
- Cuidado temporal: alta. Alimentación, medicación, comportamiento, alergias, contactos de emergencia.
- Paseo: media. Comportamiento social con otros perros, ruta preferida, alergias ambientales, eventos del paseo.
- Estética: media. Tipo de pelaje, alergias dérmicas, comportamiento durante baño y secador.
- Adiestramiento: media-alta. Avances pedagógicos, comandos aprendidos, frecuencia de práctica, refuerzos efectivos.
- Certificación: alta. Documentación clínica que sustenta el certificado + el certificado mismo firmado y registrado + trazabilidad de cuándo fue emitido y por quién para validación posterior.

**Dependencia del bio-expediente compartido.**
- Clínicos: altísima. El handshake clínico es central.
- Vacunación: alta. El calendario completo es del bio-expediente.
- Cuidado temporal: muy alta. Necesita conocer toda la mascota para cuidarla bien.
- Paseo: media. Saber que dos perros no se llevan bien previene peleas.
- Estética: media. Saber que un perro es ansioso con secador previene incidentes.
- Adiestramiento: media. Necesita conocer historia previa de entrenamiento.
- Certificación: alta. El certificado se sustenta en el bio-expediente clínico previo. Un certificado emitido sin base clínica respaldatoria es indefendible.

**Modelo de cobro y catálogo.**
- Clínicos: precio por consulta o procedimiento. Catálogo simple.
- Vacunación: **producto compuesto** (aplicación + vacuna específica de catálogo de precios). Modelo distinto.
- Cuidado temporal: precio por noche, por día, o paquete. Posibles adicionales (medicación, paseos extra).
- Paseo: por paseo individual, paquete, o contrato mensual. Modelo distinto.
- Estética: por tipo de servicio. Catálogo medio.
- Adiestramiento: por sesión individual o paquete pedagógico.
- Certificación: precio por tipo de certificado emitido. Catálogo definido por marco regulatorio (ESA, servicio, traslado internacional cada uno tiene precio propio porque cada uno tiene costo administrativo y de evaluación distinto).

**Tipo de relación con la familia humana.**
- Clínicos: profesional con vínculo profundo. Mucha confianza, momentos sensibles.
- Vacunación: profesional rápido. Vínculo funcional.
- Cuidado temporal: confianza altísima — la familia entrega la mascota.
- Paseo: cotidiano, casual, frecuente.
- Estética: profesional con vínculo medio. Recurrencia genera confianza.
- Adiestramiento: pedagógico, colaborativo con la familia.
- Certificación: transaccional con peso. La familia busca un trámite resuelto bien. El vínculo se construye por seriedad del proceso, no por frecuencia.

### 5.5 Motor de catálogo de servicios — decisión cerrada S20

Las diferencias de modelo de cobro entre familias implican que el portal necesita un **motor de catálogo de servicios flexible**, no una lista plana de "servicio = precio".

**Decisión cerrada S20:** el portal soporta cuatro tipos de oferta de servicio:

- **Servicio simple.** Un servicio con un precio. Ejemplo: consulta veterinaria USD 25. Aplica a clínicos, paseo individual, estética básica.
- **Servicio compuesto.** Un servicio que combina aplicación + producto de catálogo. Ejemplo: vacunación = aplicación (USD 5) + vacuna específica del catálogo (USD 15-40). El prestador define su catálogo de productos. Aplica a vacunación y a algunos tratamientos.
- **Servicio en paquete o contrato.** Un servicio que se cobra como conjunto de unidades en un período. Ejemplo: 20 paseos en el mes por USD 200. Estadía en hotel de 7 noches por USD 280. Paquete de 10 sesiones de adiestramiento. Aplica a paseo, cuidado temporal, adiestramiento.
- **Servicio con producto-documento.** Un servicio que produce un documento oficial con valor externo a e-PetPlace. Ejemplo: certificación ESA = evaluación clínica + emisión de certificado oficial firmado. El precio cubre evaluación + documento + trazabilidad de la emisión. Aplica a Familia G (certificación) cuando se construya.

Esta decisión genera **deuda documental para `BIO_EXPEDIENTE.md` y `MODELO_PRODUCTO.md`**: anclar el modelo técnico del catálogo en la documentación maestra correspondiente, incluyendo el shape de tablas que soportan los cuatro tipos de oferta.

El desarrollo técnico del motor de catálogo es trabajo aparte del portal — el portal **consume** el motor cuando esté disponible. En F1, se construye el motor con prioridad alineada al orden de construcción de familias: simple primero (sirve a Familia A clínicos), compuesto segundo (sirve a Familia B vacunación), paquete tercero (sirve a Familias C, D, F).

### 5.6 Bio-expediente compartido — invariante con vista diferenciada

Todos los prestadores aportan al bio-expediente de la mascota. Esto es invariante: la construcción de la historia de vida de Zeus, Pepe o cualquier mascota se hace **con la suma de todos los prestadores que la cuidan**, no con uno solo.

Pero cada familia de servicios **ve la parte del bio-expediente relevante para su servicio**. Esto es revelación progresiva por relevancia (paralelo a `MODELO_PRODUCTO.md` sección 6.4 que la aplica al cliente final):

- **Clínicos** ven HC completo, casos clínicos, medicación, exámenes, alergias, condiciones crónicas, historia de vacunación.
- **Vacunación** ve calendario completo de vacunas + alergias relevantes + condiciones que afectan aplicación.
- **Cuidado temporal** ve alimentación, medicación, comportamiento, alergias, condiciones especiales, contactos de emergencia.
- **Paseo** ve comportamiento social con otros perros, energía típica, alergias ambientales, eventos previos de paseos.
- **Estética** ve tipo de pelaje, alergias dérmicas, comportamiento durante baño y secador, sensibilidades cutáneas.
- **Adiestramiento** ve historia de entrenamiento, comandos aprendidos, refuerzos efectivos, dimensión personalidad de identidad.
- **Certificación** ve historia clínica completa + historia de vacunación + dimensión temperamento/comportamiento. Necesita base clínica sustantiva para emitir un certificado defendible.

**Ningún prestador ve dimensiones financieras de la familia.** Esto es invariante de privacidad. Tampoco ve hitos privados del humano (política P6 de `POLITICAS_EPETPLACE.md`). Y los datos aportados por menores siguen reglas específicas de P5.

**Aportes diferenciados al bio-expediente.** Cada familia agrega su tipo de evento:

- Clínicos agregan eventos de consulta, diagnósticos, recetas, resultados de exámenes.
- Vacunación agrega aplicaciones con composición.
- Cuidado temporal agrega eventos de estadía, observaciones de comportamiento durante el cuidado, incidentes si los hubo.
- Paseo agrega eventos de paseo con ruta, duración, observaciones del comportamiento.
- Estética agrega eventos de servicio aplicado, observaciones de pelaje y piel.
- Adiestramiento agrega eventos de sesión con progresos, comandos trabajados.
- Certificación agrega evento de emisión del certificado con tipo, fecha, vigencia, número de registro, prestador emisor, y vínculo al documento producido.

El bio-expediente acumula todo. Cada prestador ve lo suyo + lo que necesita de los demás. La familia humana ve todo lo suyo.

### 5.7 Wearable como feature futura — decisión cerrada S20

Vos identificaste algo importante: *"el wearable es más para la familia que para el prestador"*. Lo registro como decisión.

**El wearable es feature del cliente/familia, no del prestador.** Cuando esté activo, el dueño configura el dispositivo en su app. Los datos generados (ejercicio, frecuencia cardíaca, síntomas, alertas) entran al bio-expediente de la mascota.

El prestador es **consumidor relevante** de esa data cuando le sirve para su servicio:

- Vet ve datos de ejercicio y patrones cardíacos relevantes para diagnóstico.
- Paseador ve actividad del día anterior para calibrar paseo de hoy.
- Cuidado temporal mantiene patrones de ejercicio durante estadía.
- Estética y vacunación no consumen wearable directamente.

El portal del prestador **no tiene módulo de configuración de wearable** — solo módulo de visualización del aporte del wearable a la mascota cuando aplique.

Esta es feature de momento posterior a F1. Hoy queda registrada para que el modelo esté preparado conceptualmente. Implementación técnica entra cuando haya wearables activos en producción.

### 5.8 Mascota demo Zeus — vista parcial según servicios habilitados

Zeus es la mascota demo única del portal (sección 2.4). Pero cada prestador ve la parte de Zeus que corresponde a sus servicios habilitados, no su bio-expediente completo.

- Un vet ve a Zeus con su HC completa, casos clínicos, vacunas, exámenes.
- Un paseador ve a Zeus con su comportamiento social, rutas preferidas, eventos de paseos previos.
- Un groomer ve a Zeus con su tipo de pelaje, alergias dérmicas, historia de servicios estéticos.
- Un prestador con servicios múltiples (ej: vet + cuidado temporal) ve las dos vistas combinadas.

Zeus es el mismo. La vista es del servicio.

El diseño de Zeus tiene que cubrir las seis familias para que cualquier prestador encuentre su parte. Esto es trabajo de curaduría del founder: armar a Zeus como ejemplo rico en todas las dimensiones, no solo en clínico. Para Familia G específicamente, Zeus puede tener un certificado de ejemplo emitido (ESA o equivalente) que ilustre cómo se ve la trazabilidad de una certificación dentro del bio-expediente.

### 5.9 Home único con composición por servicios

**Decisión cerrada S20:** el portal tiene un home único base. Las diferencias entre prestadores se materializan en **cards configuradas según los servicios habilitados**, no en homes distintos.

Esto preserva el alma común del portal:

- La presencia ceremoniosa del Día 1 es la misma para todos.
- La mascota demo Zeus aparece para todos (con vista parcial según servicios).
- Las tareas iniciales de configuración son las mismas (servicios, horarios, equipo, precios, condiciones).
- Los hitos de trayectoria son los mismos.
- La graduación al Día 90 es la misma.
- El aspiracional integrado es el mismo.
- El módulo de canal directo con el equipo es el mismo.

Lo que cambia son las cards operativas que componen el día a día:

- Un prestador con Familia A habilitada ve cards de agenda clínica, próximas consultas, casos activos, recetas pendientes.
- Un prestador con Familia B habilitada ve cards de calendario de vacunación, próximas aplicaciones, catálogo de vacunas.
- Un prestador con Familia C habilitada ve cards de mascotas alojadas hoy, cronograma de actividades, próximas estadías agendadas.
- Un prestador con Familia D habilitada ve cards de paseos del día, contratos mensuales activos, próximas reservas.
- Un prestador con Familia E habilitada ve cards de citas de estética del día, galería de servicios realizados.
- Un prestador con Familia F habilitada ve cards de sesiones de adiestramiento, progreso por mascota, próximas sesiones.
- Un prestador con Familia G habilitada (cuando se construya) ve cards de certificados emitidos, certificados próximos a vencer, evaluaciones agendadas.

Un prestador con múltiples familias habilitadas ve sus cards agrupadas con jerarquía clara. El home puede tener pestañas o secciones que el prestador navega según su trabajo del momento.

**Cambios visuales sutiles, alma invariante.** Esto es la regla. No vamos a tener "portal del vet" vs "portal del paseador" como productos diferenciados. Vamos a tener el portal de e-PetPlace que se compone según lo que el prestador hace.

### 5.10 La familia humana como contratante y guardián de la mascota

Vos describiste algo importante: *"la familia humana es el contratante y pagador, pero también es quien está interesado por que su pet o miembro de su familia tenga una atención excepcional"*.

Esto define el doble vínculo del prestador con la familia humana:

- **Vínculo transaccional.** La familia contrata, paga, agenda. El portal facilita esta dimensión sin entorpecerla — cobros claros, calendario simple, comunicación operativa.
- **Vínculo de cuidado.** La familia confía la mascota — un miembro de su familia humana — al prestador. El portal sostiene este vínculo con presencia: mensajes que reconocen el cuidado, visibilidad del trabajo del prestador hacia la familia, espacio para comunicación humana cuando lo necesite.

El portal del prestador **no trata a la familia humana como cliente abstracto**. La trata como humano específico que confía algo precioso. La comunicación, el tono, las notificaciones — todo se calibra para esa doble naturaleza del vínculo.

Este principio aplica a las seis familias por igual. Un paseador que mensajea "Pepe disfrutó mucho el paseo hoy, conoció a un labrador en el parque" sostiene el vínculo de cuidado tanto como un vet que comunica un diagnóstico delicado con cuidado. Y un prestador de certificación que entrega un documento bien tramitado sostiene el vínculo a través de la seriedad del proceso.

### 5.11 Complejidad operativa reconocida

Vos identificaste: *"en esta parte es donde veo la mayor complejidad de construcción del portal prestadores"*.

Sí. La diferenciación por familias de servicios es la dimensión más compleja del portal porque combina:

- Seis familias con dimensiones operativas distintas.
- Motor de catálogo flexible que soporta cuatro tipos de oferta.
- Bio-expediente compartido con vista diferenciada por servicio.
- Composición de home según servicios habilitados.
- Aportes diferenciados al bio-expediente según familia.
- Preparación conceptual para wearables sin construirlos en F1.
- Familia G (certificación) diferida con disparo definido — diseñada conceptualmente pero no construida en F1 por riesgo legal y baja demanda esperada.

El orden de construcción de la sección 5.3 (Familia A primero, F después) es disciplina para no intentar todo a la vez. Un portal que sirve excelentemente a Familia A es valor real. Un portal que intenta servir a las seis familias mal es portal fracasado.

**El principio rector:** construimos por capas. Cada capa habilita la siguiente sin romper lo construido. El motor de catálogo se construye en paralelo, soportando lo que cada familia necesita en el orden en que se desarrollen.

---

## 6. Las secciones del portal

### 6.1 El cambio de marco — secciones, no pantallas

El portal del prestador no se organiza como lista plana de pantallas. Se organiza como **secciones macro con propósito claro**. Cada sección agrupa pantallas que el prestador visita con un mismo objetivo. Una sección puede contener N pantallas — lo que importa es por qué el prestador entra a esa sección.

Cuatro secciones macro definen el portal en F1:

- **Sección A — Mi cuenta.** Configuración del prestador y de sus servicios.
- **Sección B — Mascotas y agenda.** Vínculo con las mascotas que atiende, su agenda, su historial.
- **Sección C — Prestación del servicio.** El momento de atención. Antes / durante / después. Corazón operativo del portal.
- **Sección D — Administrativa.** Dashboard, liquidaciones, finanzas, certificaciones, notificaciones, disputas, calificaciones, canal con el equipo.

El orden de descripción que sigue es **por importancia**, no por orden de uso. La Sección C (prestación) es el corazón operativo y narrativo — donde se materializa el valor real. La describimos primero porque define el alma operativa del portal. La Sección B es la más frecuente del día a día (agenda + mascotas). Va segunda. La Sección A es fundacional (sin configuración no hay atención posible) pero el prestador no entra todos los días — va tercera. La Sección D es soporte transversal — va al final.

Dentro de cada sección, las pantallas también se describen por importancia, no por adyacencia visual.

### 6.2 Disposición a Reconstruir aplicada al bloque

**Decisión que atraviesa todo este bloque:** este documento describe **cómo deberían ser** las secciones del portal según el frame de PORTAL_PRESTADOR.md, **no cómo están hoy**. El portal construido hasta S19 necesita revisión casi total para alinear con la visión articulada en este documento.

En cada sub-sección marcamos explícitamente:

- **Construcción nueva (CN):** la pieza no existe hoy y debe construirse desde cero.
- **Reconstrucción (RC):** la pieza existe hoy pero no encaja con el frame del documento. Debe rehacerse, no parcharse.
- **Continuación (CT):** la pieza existe hoy y encaja con el frame. Sigue, eventualmente con ajustes menores.

El marcado es **diagnóstico inicial del founder al S20**. La verificación técnica detallada (qué está, qué falta, qué hay que tirar) es trabajo posterior por sesión de revisión técnica del repo.

El wizard de onboarding (pre-portal) también necesita revisión y queda marcado como **RC con disparo posterior** cuando se aborde formalmente la implementación de la sección 2 del documento.

### 6.3 Sección C — Prestación del servicio (el corazón operativo)

Esta es la sección más importante del portal. Es donde se materializa el valor real al prestador y a la mascota. Cada interacción registrada acá enriquece el bio-expediente y construye la historia de vida de la mascota.

La prestación se divide en tres momentos: **antes**, **durante**, **después**. Cada momento tiene propósito propio y requiere información distinta del bio-expediente.

A diferencia de otros productos del mercado, e-PetPlace **no trata el flujo de atención como un formulario al final del servicio**. Lo trata como la materialización del bio-expediente compartido en acción real, distribuida a lo largo del tiempo que dura la atención.

> **Diseño por familia y arquitectura de datos:** el principio rector general vive en esta sección (§6.3 a §6.3.4). El diseño concreto de cada familia de atención (grooming, paseo, hospedaje, adiestramiento, clínico, estética) y la arquitectura de datos del flujo viven en el documento anexo `docs/FLUJOS_ATENCION_POR_FAMILIA.md` (desde Sesión 26).

#### 6.3.0 Principio rector del flujo de atención

El flujo de atención en e-PetPlace existe para **darle continuidad al cuidado de una mascota a través de los prestadores que la atienden a lo largo de su vida**.

Cada atención es a la vez:

- Un servicio completo en sí mismo (el vet diagnostica, el groomer baña, el paseador pasea).
- Un capítulo de la historia continua de la mascota.
- Información útil para los próximos prestadores que la van a atender.

El portal del prestador es el lugar donde estos tres niveles se materializan simultáneamente, sin que se sientan como tres cosas distintas. El prestador no documenta para alimentar un sistema. Documenta porque al hacerlo, su propio trabajo se vuelve más fácil — y como subproducto, la mascota se vuelve mejor cuidada por el ecosistema entero.

**La inversión central:** otros productos piden al prestador documentar **para que la app sea útil**. e-PetPlace hace que documentar **sea útil al prestador en ese mismo acto**. Ese es el mecanismo por el cual los prestadores van a sentir "no podía vivir sin esto".

**Movimientos concretos derivados del principio:**

- **Movimiento 1 — La mascota llega ya conocida.** Cuando el prestador abre la atención, no recibe una ficha vacía. Recibe a un ser con historia. El prestador no tiene que preguntarle a la familia humana lo que ya está en el sistema.
- **Movimiento 2 — La atención se documenta mientras se hace, no después.** El "Durante" no es una pantalla vacía. Es donde el prestador captura, sin esfuerzo, lo que está observando o haciendo. Lo que llega al "Después" es ese material ya capturado, no una pantalla blanca para escribir un reporte desde cero.
- **Movimiento 3 — Lo que se documenta se vuelve activo, no archivo.** El registro de hoy es lo que el próximo prestador va a ver en el "Antes" de su atención. Documentar hoy se vuelve "ayudar al colega futuro o a mí mismo".

**Pesos asimétricos de los tres momentos:**

Los tres momentos no tienen peso equivalente:

- **Antes — peso conceptual alto.** Es donde la promesa de e-PetPlace se materializa. La mascota llega conocida.
- **Durante — peso ligero, alta utilidad.** Captura sin estorbar. Está listo cuando el prestador lo necesita y desaparece cuando no.
- **Después — peso variable según familia.** En clínico es alto (documentación seria). En paseo puede ser mínimo. En grooming es medio.

El error a evitar: tratar los tres momentos con la misma estructura visual y peso. La asimetría intencional es lo que va a hacer que se sienta diseñado.

**Cierre con calidad — principio operativo:**

Otros productos miden documentación por **cantidad** (¿llenó todos los campos?). e-PetPlace mide **calidad** (¿el registro va a serle útil al próximo prestador o a sí mismo en 6 meses?).

**Cierre con calidad** significa: campos importantes con contenido real; imagen cuando aplica y la situación lo permitía; observaciones notadas escritas, no asumidas; material útil para el próximo prestador.

**Cierre con pendiente** significa: algo falta por razones legítimas (resultado de examen, foto que no se pudo tomar, observación que el prestador quiere pensar). Queda como recordatorio para el prestador, no como reproche. La cita cierra operativamente; la documentación tiene un campo abierto que el sistema sabe que está pendiente.

**Lo que NO es:** ni gamificación con badges, ni scoring público, ni presión visible. El indicador es íntimo del prestador.

**Anti-patrones que el flujo de atención rechaza explícitamente:**

- **No formularios densos.** Si una pantalla tiene 12 campos, está mal.
- **No documentación retrospectiva forzada.** "No podés cerrar la cita hasta que llenes esto" empuja al prestador a poner basura para destrabar. Lo correcto: cierre con pendiente legítimo.
- **No popups celebratorios al cerrar.** Honra silenciosa, no fanfarria.
- **No compliance visible al prestador.** El sistema mide internamente, pero no le saca notificaciones tipo "completaste X% de tus citas con HC esta semana".
- **No interrupciones durante la atención.** Notificaciones de otras citas, mensajes de marketing, sugerencias automáticas — todo silenciado mientras hay cita en estado "en curso".
- **No campos opcionales que se sienten requeridos.**

**Cinco momentos de conversión emocional:**

La sensación "no podía vivir sin esto" va a venir de momentos específicos. Cada uno requiere diseño deliberado:

1. La primera vez que el prestador abre el Antes y ve a la mascota — va a sentir que está conociendo a un ser, no consultando una ficha.
2. La primera vez que captura algo en el Durante con un solo gesto — una foto que se etiqueta sola, una nota de voz que se transcribe.
3. La primera vez que abre el Después y todo lo del Durante ya está organizado esperándolo — edita, no escribe desde cero.
4. La primera vez que atiende a una mascota previamente atendida por otro prestador del ecosistema — y ve en su Antes algo útil que el colega anterior dejó.
5. La primera vez que un cliente vuelve y la mascota llega "como si lo conociera de antes" en el sistema.

Cada uno requiere diseño específico. No son consecuencia automática de tener una buena pantalla.

#### 6.3.1 Antes — preparación de la atención

El prestador, antes de que la mascota llegue (o antes de iniciar el servicio si es paseo, cuidado o atención remota), entra a la pantalla de preparación. **Aquí se materializa el bio-expediente compartido en acción real.**

La columna vertebral del Antes, común a todas las familias de servicio:

- **Identificación de la mascota.** Nombre, foto, especie/raza, edad, género, microchip si aplica.
- **Identidad personal** (las 5 dimensiones según `MODELO_PRODUCTO.md` sección 4): personalidad, gustos, miedos, manías y rituales, señales sutiles. Esto es lo que ningún CRM vertical muestra al prestador. Es la mascota como ser, no como ficha.
- **Vista parcial del bio-expediente según servicio habilitado** (sección 5.6). Si es vet, ve HC y casos. Si es paseador, ve comportamiento social y rutas previas. Si es groomer, ve tipo de pelaje y reacción a secadores. Si es cuidado temporal, ve alimentación y medicación. Etcétera.
- **Eventos previos relevantes** de otros prestadores del ecosistema, curados por familia destinataria. Si Pepe fue atendido hace una semana por un vet y hoy llega al paseador, el paseador puede ver "consulta veterinaria reciente" como contexto sin invadir privacidad clínica.
- **Alertas de salud activas relevantes a la familia del servicio.** Restricciones automáticas creadas a partir de eventos clínicos previos (post-quirúrgico, vacunación reciente, dermatológico activo, embarazo, etc.). Curadas por familia destinataria.
- **Notas operativas del servicio actual.** Motivo de la consulta/paseo/baño, qué pidió la familia, observaciones específicas para esta atención.
- **Identidad de la familia humana presente.** Quién contrató, quién va a entregar la mascota, quién va a retirarla (puede ser distinto en mascotas con co-dueños).

Lo que NO ve el prestador antes:

- Datos personales detallados de la familia (teléfono, email, dirección). Comunicación se hace por canal interno (sección 6.4.7).
- Dimensiones financieras de la familia (ingresos, métodos de pago detallados).
- Hitos privados del humano sobre la mascota (política P6 de `POLITICAS_EPETPLACE.md`).

El detalle de qué del bio-expediente se prioriza en el Antes de cada familia vive en `docs/FLUJOS_ATENCION_POR_FAMILIA.md`.

**Diagnóstico inicial:** **CN** completa. El concepto de "antes" como pantalla de preparación con vista curada del bio-expediente no existe hoy en producción.

#### 6.3.2 Durante — la atención en curso

Mientras el prestador atiende a la mascota, el portal tiene presencia mínima pero útil. **Esta es la pantalla donde menos se quiere distracción** — el prestador está con la mascota, no con el portal.

La columna vertebral del Durante, común a todas las familias:

- **Acceso rápido al bio-expediente relevante** (mismo del Antes, consultable durante la atención si surge duda).
- **Captura ligera contextual al oficio**: foto, nota escrita o dictada, incidencia tipificada, checks predefinidos (servicios aplicados, zonas trabajadas, etc.). Cada familia tiene su captura específica.
- **Botón de alerta a la familia humana cuando aplica.** Casos excepcionales: paseador detecta lesión durante paseo, vet detecta hallazgo grave y necesita autorización. Por canal interno.
- **Estado de la atención**: cronómetro corriendo (sutil), botón de pausar, botón de terminar.

Lo que el portal NO impone durante la atención:

- Formularios extensos que obligan al prestador a completar antes de salir. La documentación seria va en "después" (sección 6.3.3). Durante la atención, captura mínima esencial.
- Notificaciones de otros pacientes / citas. La atención actual tiene prioridad absoluta.
- Pop-ups, banners, sugerencias automatizadas.

**Diagnóstico inicial:** **CN** completa. El concepto de "durante" como pantalla mínima con captura ligera no existe hoy. Hay que construirlo.

#### 6.3.3 Después — registro y cierre

Terminada la atención, el prestador completa el registro. **Esta es la pantalla donde la documentación seria sucede**, sin presión de tiempo (la mascota ya se fue / el paseo terminó / el cuidado del día cerró).

El Después tiene dos accesos asimétricos: un cierre rápido post-atención (confirmar lo capturado y seguir) y una vista consolidada del día (revisar y cerrar con calidad en el momento de calma). El detalle de esta mecánica por familia vive en `docs/FLUJOS_ATENCION_POR_FAMILIA.md`.

La columna vertebral del Después, común a todas las familias:

- **Confirma o amplía las notas tomadas durante la atención.** Reconstrucción visual de lo capturado en el Durante: el prestador no escribe el reporte desde cero, edita lo que ya está.
- **Documenta el evento** según familia (consulta clínica con diagnóstico y receta, paseo con ruta y observaciones, baño con servicios aplicados, sesión de adiestramiento con avances, etc.).
- **Adjunta archivos cuando aplica** (resultado de examen, foto de antes/después en grooming, foto de lesión en paseo, certificado en Familia G).
- **Confirma el cobro** (precio final, productos consumidos, diferencias respecto a presupuesto inicial si las hubo).
- **Mensaje opcional a la familia humana** por canal interno (sección 6.4.7) confirmando que todo salió bien o lo que necesita seguimiento.
- **Cierre con calidad o pendiente.** Si la documentación está completa, el evento se cierra. Si falta algo (resultado de examen que llegará después, foto que no pudo tomar, observación que necesita pensar), queda como pendiente con recordatorio operativo.

**Reconocimiento al cierre con calidad.** Si el prestador completa el registro con documentación rica (no checkbox vacío), el portal lo refleja sutilmente en su trayectoria — esto se conecta con "visibilidad del propio compromiso" (sección 3.9). No es notificación celebratoria. Es honra silenciosa de que el bio-expediente se enriqueció.

**Diagnóstico inicial:** **RC** mayor. El "después" existe parcialmente hoy (`ModalCompletarCita` solo con notas, mencionado en CLAUDE.md). Hay que reconstruir para soportar documentación rica por familia, doble acceso (cierre rápido + consolidado del día), adjuntos, cierre con calidad o pendiente, y registro al bio-expediente con la estructura correcta.

#### 6.3.4 Lo que define la prestación

Tres principios atraviesan los tres momentos:

- **Facilidad real, no obligación.** El portal asiste, no impone. Lo mínimo se captura rápido; lo profundo tiene tiempo y espacio.
- **Valor real al prestador.** No es trabajo administrativo extra. Es construir la historia de la mascota mientras se la cuida, con frecuencia ahorrándole trabajo al prestador (no repetir preguntas a la familia, ver historial sin pedir, recetar con productos que sugieren dosis correcta para el peso, etc.).
- **Cada interacción enriquece el bio-expediente.** Esto es lo que ningún CRM vertical hace porque ningún CRM vertical tiene el bio-expediente como activo del ecosistema. Para e-PetPlace es invariante.

Flows transversales que atraviesan esta sección y se cuentan en el bloque de momentos narrativos:

- *Primera atención de un prestador a una mascota.*
- *Atención a una mascota con caso clínico activo de otro vet (handshake clínico recibido).*
- *Atención de urgencia.*
- *Cierre del último servicio antes de transferencia de mascota a otra familia.*

### 6.4 Sección B — Mascotas y agenda

Esta es la sección de uso más frecuente del día a día. El prestador entra acá apenas abre el portal en una jornada típica.

#### 6.4.1 Agenda — la pantalla más usada del día a día

**Decisión sobre profundidad:** Agenda merece tratamiento profundo porque es la pantalla con más uso por sesión, mayor frecuencia de retorno, y mayor exposición a fricción operativa. Si Agenda no funciona bien, el portal no funciona.

Qué ve el prestador en Agenda:

- **Vista del día por defecto.** Hoy con sus citas / paseos / estadías / sesiones según servicios habilitados. Orden temporal claro.
- **Vista de semana y mes accesibles** para planificación.
- **Estado de cada cita visible.** Programada, confirmada, en curso, completada, cancelada, no asistencia.
- **Identificación rápida de mascota + familia humana.** Nombre de mascota grande, nombre de familia secundario, servicio a prestar visible.
- **Indicadores de alerta cuando aplica.** Mascota con caso clínico activo, mascota con condición especial (alergia, medicación, ansiedad), primera vez con este prestador, etc.
- **Accesos directos a "antes" (preparación)** y al detalle de cita desde la propia agenda.

Configurabilidad de la agenda:

- **Horarios de atención** definidos en la cuenta (sección 6.5).
- **Bloqueos puntuales** (vacaciones, días no laborables, reuniones internas).
- **Configuración de duración por tipo de servicio** (la consulta dura 30 min, el grooming 90 min, etc.).

**Alertas configurables sobre citas — decisión cerrada S20.** El prestador puede encender o apagar alertas por tipo de evento de agenda. Por ejemplo, prefiero recordatorio de cita 30 minutos antes pero no notificación cuando un cliente confirma asistencia. La configuración de alertas vive dentro de la Sección B porque opera sobre la agenda, aunque el listado completo de notificaciones vive en Sección D.

**Diagnóstico inicial:** **RC** completo. La agenda existe hoy pero su tratamiento debe alinearse con el frame: vista parcial del bio-expediente accesible desde la propia agenda, indicadores de alerta visibles, accesos a "antes", configurabilidad rica de alertas. La reconstrucción es significativa.

#### 6.4.2 Próximas citas — vista anticipada

Variante operativa de la agenda con foco en lo que viene. Útil cuando el prestador quiere planificar:

- **Próximas 7 días.** Volumen de trabajo esperado.
- **Mascotas que vienen por primera vez vs recurrentes.** Distinción visible.
- **Citas que requieren preparación específica** (caso clínico complejo, mascota ansiosa que necesita ambiente preparado, etc.).

**Diagnóstico inicial:** **CN** o **RC** según lo que exista — probablemente RC. La vista anticipada con foco en preparación no es estándar de CRMs verticales y merece diseño propio.

#### 6.4.3 Historial de mascotas atendidas

El listado de las mascotas que el prestador ha atendido o atiende actualmente. **No es directorio público de mascotas del ecosistema** — son solo las del propio prestador.

Filtros y vistas:

- **Mascotas activas** (atendidas al menos una vez en los últimos N meses, configurable).
- **Mascotas inactivas** (no atendidas hace tiempo, pueden volver).
- **Mascotas con caso clínico activo** (importante para vets — son las que requieren seguimiento).
- **Mascotas por familia humana** (cuando la familia tiene varios miembros mascota).

Cada entrada del historial es **acceso directo al detalle de la mascota** (sección 6.4.4).

**Diagnóstico inicial:** **RC** o **CN** según lo construido. La vista de historial con filtros ricos por estado debe alinearse con el modelo del bio-expediente.

#### 6.4.4 Detalle de mascota — la pantalla icónica del portal

**Decisión sobre profundidad:** Detalle de mascota es la pantalla más significativa narrativamente. Es donde se materializa el bio-expediente vivo. Es donde el alma del producto se hace evidente al prestador.

Cuando un prestador entra al detalle de una mascota que atiende, **ve a la mascota como ser completo, no como ficha clínica**.

Estructura del detalle de mascota:

- **Cabecera con presencia.** Foto grande, nombre, especie/raza, edad, género, microchip si aplica. Tono digno, no formulario.
- **Identidad personal con las 5 dimensiones** (personalidad, gustos, miedos, manías y rituales, señales sutiles). Esta es la sección que ningún competidor tiene. Cada dimensión con texto rico aportado por la familia y por otros prestadores del ecosistema. Cada aporte trazable a quién y cuándo lo aportó.
- **Timeline narrativo de eventos** según vista parcial del servicio del prestador. Cronológicamente ordenado, con tipos de evento codificados visualmente (consulta clínica, paseo, vacunación, grooming, estadía, sesión de adiestramiento, certificado emitido, hito narrativo público).
- **Casos clínicos abiertos cuando aplica** (visibles a vets). Con su estado, su vet tratante (puede ser otro), próximo evento esperado.
- **Familia humana de la mascota.** Co-dueños y familiares autorizados (sección 6.4.5).
- **Datos de manejo según servicios habilitados.** Alimentación, medicación, alergias, comportamientos especiales, contactos de emergencia. Vista filtrada por relevancia para el prestador.

Acciones desde el detalle de mascota:

- **Agendar próxima cita.**
- **Iniciar mensaje a la familia humana** por canal interno (decisión 6.4.7).
- **Ver el bio-expediente completo** dentro del alcance del prestador.
- **Marcar observación rápida** que se incorpora al timeline (sin necesidad de cita formal).

**Diagnóstico inicial:** **RC** mayor + **CN** importante. Existe pantalla de detalle hoy, pero el concepto de "identidad personal con 5 dimensiones" recién se implementó técnicamente en S19 (Fase F) sin UI todavía (D-110 diferido). El bio-expediente vivo como pantalla icónica es construcción significativa.

#### 6.4.5 Familia humana de una mascota

Vista de los humanos vinculados a la mascota:

- **Co-dueños** con su rol (decisión de doble confirmación P1 cuando aplica).
- **Familiares autorizados** con sus permisos (familiar adulto / menor según P5).
- **Datos de contacto del prestador hacia la familia** mediados por la plataforma (sección 6.4.7).

El prestador no ve datos personales detallados (teléfono, email, dirección). Ve nombre, foto, rol, y vínculo a canal interno.

**Diagnóstico inicial:** **CN** mayoritario. El portal hoy maneja "cliente" como entidad simple; la familia humana con co-dueños y autorizados es modelo nuevo de S17-S18 sin UI completa todavía.

#### 6.4.6 Configuración de alertas de agenda

Sub-pantalla accesible desde la agenda (mencionada en 6.4.1). Permite encender/apagar alertas por tipo de evento:

- Recordatorio antes de cita (configurar tiempo: 15 min, 30 min, 1 hora antes).
- Confirmación de asistencia del cliente.
- Cancelación de cita.
- Cliente solicita reprogramar.
- Mascota con condición especial llega en próxima X tiempo.
- Cita marcada como urgencia (vet).
- Estadía termina hoy (cuidado temporal).
- Sesión de adiestramiento programada para hoy.

Cada alerta tiene **toggle de prender/apagar** independiente.

**Diagnóstico inicial:** **CN**. El portal hoy no tiene control granular de alertas — todas son fijas. Esta es construcción nueva alineada con el principio de respeto a la atención del prestador.

#### 6.4.7 Canal de comunicación con la familia humana — decisión cerrada S20

**Decisión cerrada S20:** toda comunicación entre prestador y familia humana se hace **a través de la plataforma**, no por canales personales (WhatsApp, email directo, teléfono). El prestador no ve teléfono ni email de la familia. La familia tampoco ve datos personales del prestador. El canal se activa solo cuando hay servicio activo entre ellos.

Razones del modelo:

- **Privacidad real para ambas partes.** No hay fugas de datos personales en ninguna dirección.
- **Trazabilidad para disputas.** Toda comunicación queda auditable si aparece un conflicto.
- **Captura al bio-expediente cuando aplica.** Conversaciones operativas relevantes (instrucciones de medicación, autorizaciones, observaciones) pueden incorporarse al bio-expediente con consentimiento.
- **Defensibilidad del modelo.** El prestador no puede llevarse al cliente fuera del ecosistema fácilmente. El cliente no puede saltarse el modelo de cobro contactando al prestador en privado.

Características operativas del canal:

- **Activación con servicio.** Solo se activa cuando hay cita / servicio / contrato activo entre prestador y familia. Sin servicio activo, no hay canal.
- **Cierre con servicio.** Cuando el servicio termina, el canal permanece accesible por un período razonable (X días configurable) para preguntas post-atención. Después se archiva pero queda accesible al historial.
- **Mensajes con marcado al bio-expediente.** El prestador puede marcar un mensaje como "instrucción operativa" y se incorpora al bio-expediente con consentimiento previo de la familia.
- **No emojis chillones, no stickers, no GIFs.** Tono profesional sobrio coherente con el espíritu luxury del portal.
- **Notificaciones push controlables** desde Sección D.

Esta decisión choca con la realidad operativa donde WhatsApp es estándar. **Riesgo declarado:** la fricción de adopción es real. Los prestadores y familias que están acostumbrados a WhatsApp pueden resistir el cambio. El portal debe hacer el canal interno **mejor que WhatsApp** para esta función específica (más rápido para tareas del cuidado, integrado con el bio-expediente, sin spam, sin distracciones), no solo equivalente.

**Implementación técnica:** **CN** completa. El canal de mensajería in-app entre prestador y familia es feature nueva no trivial. Queda como **deuda explícita** para sesión técnica posterior, con prioridad alta porque la decisión arquitectónica depende de tenerlo. Mientras no exista, los prestadores F1 pueden tener excepción documentada para usar WhatsApp con conocimiento del founder — pero solo como transición, no como modelo.

Flows transversales que atraviesan esta sección y se cuentan en el bloque de momentos narrativos:

- *Primera mascota agregada a la agenda del prestador.*
- *Reagendamiento por parte de la familia.*
- *Cancelación de último momento.*
- *Detección de mascota con condición especial en la agenda del día.*

### 6.5 Sección A — Mi cuenta

Configuración del prestador y de sus servicios. **Sección fundacional pero no de uso diario.** El prestador entra acá durante onboarding (con frecuencia alta los primeros días), después la frecuencia baja a esporádica (modificar un horario, cambiar un precio, sumar un servicio, actualizar documentos).

#### 6.5.1 Mi perfil

Datos del prestador como persona/negocio:

- **Identificación.** Nombre comercial, razón social si aplica, RUC/RFC/equivalente según país, tipo de prestador (persona natural / persona jurídica).
- **Datos de contacto del negocio** (los visibles al cliente, no datos personales del prestador): ubicación, ciudad, horarios generales, foto del local si aplica.
- **Foto y biografía corta.** Lo que aparece en la página web pública del prestador graduado (sección 4.5).
- **Insignias.** Fundador / 2026 si aplica. Certificado e-PetPlace si está graduado (sección 4.4).

**Diagnóstico inicial:** **RC**. El portal hoy maneja perfil básico; necesita alinearse con el modelo de página pública y de insignias del Día 90.

#### 6.5.2 Documentos

Cédula / pasaporte / equivalente del prestador. RUC / equivalente del negocio. Diplomas y licencias profesionales (para vets, registro de médico veterinario habilitante). Permisos sanitarios y de operación del local. Certificados de capacitación cuando aplica.

**Vencimiento y renovación visibles.** Documentos con fecha de expiración tienen alerta cuando se acerca el vencimiento. Documentos sin renovar pueden afectar visibilidad pública del prestador (decisión a refinar).

Esta sub-sección es **defensiva ante auditorías**. Si vienen autoridades a pedir documentación, el prestador la tiene a mano en el portal.

**Diagnóstico inicial:** **CN** o **RC** según lo construido. Documentos como entidad estructurada con vencimientos y renovaciones es modelo significativo.

#### 6.5.3 Servicios

Aquí se materializa el motor de catálogo de la sección 5.5. El prestador configura los servicios que ofrece — su catálogo.

Para cada servicio:

- **Familia del servicio** (sección 5.2): clínicos / vacunación / cuidado temporal / paseo / estética / adiestramiento / certificación (cuando se construya).
- **Tipo de oferta** (sección 5.5): simple / compuesto / paquete o contrato / con producto-documento.
- **Descripción del servicio** en palabras del prestador. Esto es lo que el cliente va a leer cuando lo encuentre — no es categoría genérica, es la voz del prestador sobre cómo hace ese servicio.
- **Precio o estructura de precios.** Simple si es servicio simple. Composición si es compuesto. Definición del paquete si es paquete. Etcétera.
- **Duración estimada** (impacta agenda).
- **Tipo de mascota que atiende.** Especie + raza + tamaño + edad si aplica. Permite al cliente saber si su mascota califica para este servicio.
- **Configuraciones específicas del servicio.** Anticipo requerido, política de cancelación, condiciones operativas particulares.

**Diagnóstico inicial:** **RC** mayor. La configuración de servicios existe parcialmente hoy pero no como motor de catálogo flexible. La reconstrucción es significativa y depende del desarrollo del motor (sección 5.5).

#### 6.5.4 Horarios

Configuración de horarios generales del prestador. Por día de la semana. Con bloques (mañana / tarde) si aplica. Excepciones (festivos locales, vacaciones programadas).

Los horarios se cruzan con los servicios para determinar disponibilidad real (un servicio que dura 90 min no puede agendarse en una franja de 60 min).

**Diagnóstico inicial:** **RC** o **CT** según implementación actual.

#### 6.5.5 Equipo (cuando aplica)

Para prestadores con equipo (clínica con varios vets, hotel con varios cuidadores, grupo de paseadores):

- **Miembros del equipo** con su rol y servicios que ofrece cada uno.
- **Agenda por miembro** del equipo cuando aplica (cliente reserva con un profesional específico, no con la clínica genérica).
- **Permisos diferenciados.** Quién puede ver qué, quién puede hacer qué.
- **Onboarding de nuevos miembros** del equipo.

**Diagnóstico inicial:** **RC** o **CN** según lo construido. La gestión de equipo dentro de un prestador es modelo que ya está en arquitectura (`MODELO_PRODUCTO.md`) pero UI puede no estar al nivel.

### 6.6 Sección D — Administrativa

Sección de soporte transversal. Información para tomar decisiones del negocio y para responder ante terceros.

#### 6.6.1 Dashboard

Vista resumida del estado del negocio del prestador. **Sofisticación narrativa, no visual** (sección 4.5 — decisión que aplica también acá).

Qué muestra:

- **Trayectoria propia en el tiempo.** Mascotas atendidas en el mes, evolución respecto a meses anteriores, continuidad de relación (mascotas que vuelven).
- **Citas próximas.** Resumen rápido sin entrar a agenda detallada.
- **Bio-expedientes enriquecidos en el período.** Honra de calidad de documentación.
- **Estado financiero resumido.** Ingresos del período, ingresos pendientes de liquidación, comparación contra período anterior.

Qué no muestra:

- Comparaciones con otros prestadores.
- Rankings.
- Métricas vanidosas sin contexto.

**Diagnóstico inicial:** **CN** o **RC** según lo construido. El dashboard con sofisticación narrativa probablemente requiere reconstrucción.

#### 6.6.2 Liquidaciones y finanzas

- **Liquidaciones procesadas** con detalle de qué servicios incluye cada una.
- **Liquidaciones pendientes** (lo que está cobrado pero todavía no liquidado).
- **Historial de liquidaciones** para contabilidad del prestador.
- **Configuración de método de cobro** del prestador hacia e-PetPlace (cómo recibe la plata).
- **Facturación** que el prestador necesita generar (cuando aplica según país).

**Diagnóstico inicial:** **CN** o **RC**. El módulo de liquidaciones del Día 1 se despierta con la primera cita cobrada (sección 2.6). Necesita estar listo cuando aparezca la primera.

#### 6.6.3 Certificaciones y documentación de auditoría

- **Certificaciones emitidas por el prestador** cuando ofrece Familia G (diferida).
- **Certificados de capacitación del propio prestador** (cursos, talleres, especializaciones).
- **Documentación generada por e-PetPlace** que el prestador puede necesitar mostrar a autoridades (constancia de operación en la plataforma, historial de servicios trazados, etc.).

**Diagnóstico inicial:** **CN** parcial. Esta sub-sección puede ser ligera al inicio y crecer con la operación.

#### 6.6.4 Notificaciones

Centro de notificaciones operativas del portal. Distinto de las alertas de agenda (sección 6.4.6) — acá viven todas las notificaciones del sistema.

- **Notificaciones del ecosistema:** primer handshake recibido, transferencia de caso, mascota agregada a tu agenda, cancelación, reseña recibida.
- **Notificaciones del equipo de e-PetPlace:** comunicaciones del founder (Momento Fundacional), updates del producto, eventos.
- **Notificaciones de hitos personales:** primer mes cumplido, graduación al Día 90, aniversarios.
- **Notificaciones de documentación:** documento próximo a vencer, certificado por renovar.

Configurabilidad granular: el prestador puede silenciar tipos de notificaciones, configurar cómo recibirlas (in-app / push / email).

**Diagnóstico inicial:** **CN** o **RC**. Centro de notificaciones unificado con control granular es modelo nuevo en muchos casos.

#### 6.6.5 Calificaciones recibidas

Reseñas de clientes que atendió. Solo aparece después de la primera reseña real (revelación progresiva, sección 2.6 y 3.6). En F1 con base chica probablemente esto está oculto los primeros meses.

**Diagnóstico inicial:** **CN**. Sistema de reseñas debe alinearse con el principio "reputación honrada, no jerarquizada" (sección 2.7).

#### 6.6.6 Disputas

Cuando hay conflicto entre prestador y familia (cobro discutido, queja por servicio, problema de comportamiento). Centro de gestión de disputas:

- **Disputa activa** con su estado.
- **Historial de comunicaciones** del canal interno entre las partes (sección 6.4.7) — utilidad de la trazabilidad.
- **Intervención del equipo de e-PetPlace** cuando hace falta.

**Diagnóstico inicial:** **CN**. Sistema de disputas es construcción nueva, no debería entrar en F1 inicial pero debe estar conceptualmente claro para cuando aparezca la primera.

#### 6.6.7 Canal con el equipo de e-PetPlace ("Contactanos")

Materialización de la decisión 3.8 (canal directo con el equipo durante Momento Fundacional).

- **Conversación directa** con el equipo dedicado del founder.
- **Botón visible siempre.** El prestador puede iniciar la conversación cuando quiera.
- **Tono humano.** No es ticket de soporte. Es conversación real.

**Diagnóstico inicial:** **CN**. Decisión cerrada S20 que requiere construcción del canal.

Flows transversales que atraviesan esta sección y se cuentan en el bloque de momentos narrativos:

- *Primera liquidación procesada.*
- *Primera disputa activa.*
- *Primera reseña recibida.*

### 6.7 Resumen del bloque

El portal del prestador se organiza en cuatro secciones macro con propósito claro:

- **Sección C — Prestación del servicio** (corazón operativo). Antes / durante / después. Cada interacción enriquece el bio-expediente. Pieza más crítica del portal y donde el valor real al prestador se materializa.
- **Sección B — Mascotas y agenda** (uso más frecuente). Agenda como pantalla más usada del día a día. Detalle de mascota como pantalla icónica del portal. Canal de comunicación con la familia mediado por la plataforma.
- **Sección A — Mi cuenta** (fundacional, no diario). Configuración del prestador y de sus servicios. Motor de catálogo flexible materializado.
- **Sección D — Administrativa** (soporte transversal). Dashboard, liquidaciones, certificaciones, notificaciones, calificaciones, disputas, canal con el equipo.

**Diagnóstico inicial del estado actual:** la mayoría de las piezas son **RC (reconstrucción)** o **CN (construcción nueva)**. Hay pocas **CT (continuación directa)**. Esto es coherente con la confesión del founder en S19 ("no visualizo cómo va a quedar la UI para todo el modelo de parte de los prestadores que genere esa sensación de wow") y con Disposición a Reconstruir.

La revisión técnica detallada del portal actual contra este frame es trabajo posterior — sesión dedicada de auditoría del repo `e-petplace-prestadores` contra `PORTAL_PRESTADOR.md`. Esa sesión va a producir un plan de reconstrucción ordenado por prioridad.

---

## 7. Momentos narrativos del prestador

### 7.1 El cambio de naturaleza del bloque

Las secciones 1 a 6 cubrieron alma, momentos temporales, familias de servicios, y secciones del portal. Eran bloques estructurales — qué es el portal, cómo se organiza, qué decisiones de modelo se materializan dónde.

Esta sección es bloque **emocional**. Acá contamos cómo se siente el prestador en momentos específicos de su trayectoria operando el portal. Son **trayectorias con peso emocional**, no pantallas.

Esto es lo que distingue a `PORTAL_PRESTADOR.md` de un documento de specs:

- Specs dicen: *"cuando se transfiere un caso clínico, los campos X, Y, Z se actualizan"*.
- `PORTAL_PRESTADOR.md` dice: *"cuando un vet recibe su primer caso clínico transferido de otro vet, siente que entró al ecosistema profesional real — esa sensación es lo que el portal debe coreografiar"*.

Sin esta sección, el portal sería técnicamente correcto pero emocionalmente plano. Con esta sección, el portal tiene momentos coreografiados como Día 1 y Día 90.

### 7.2 Principio que atraviesa la sección — decisión cerrada S20

**Decisión cerrada S20:** cada momento sensible del prestador (queja, conflicto, evento triste, pérdida) es **oportunidad de demostrar que la mascota le importa al ecosistema**, no carga administrativa que cerrar rápido.

Esto invierte el approach de los CRMs tradicionales, donde una queja se resuelve para "cerrar el ticket". En e-PetPlace, una queja se atiende para demostrar que el modelo cumple su promesa. Una pérdida se acompaña porque la vida de esa mascota tuvo valor real para el ecosistema. Una transferencia se cierra con dignidad porque hubo vínculo de cuidado.

El portal coreografía estos momentos con un principio simple: **sobriedad con presencia**. Ni frío sistémico, ni performativo sentimental. Presencia honesta que reconoce el peso del momento.

### 7.3 Momentos de descubrimiento — primeras veces operativas

#### 7.3.1 Primera atención registrada

El prestador acaba de completar el "después" (sección 6.3.3) de su primera atención real en e-PetPlace. El portal lo reconoce con sobriedad — no banner, no celebración, no badge.

Una nota aparece en el detalle del evento recién cerrado:

> *"Esta es tu primera atención registrada en e-PetPlace. Acá empieza el bio-expediente que vas a construir con [nombre de mascota] y su familia."*

Nombrado y específico. La frase reconoce dos cosas: que es primera vez (transición importante), y que esto es construcción de bio-expediente (lo que distingue al portal de un CRM vertical).

El módulo de liquidaciones se despierta por primera vez (revelación progresiva, sección 2.6). En el home aparece una card nueva discretamente: *"Tu primera liquidación está en proceso"*. Sin entusiasmo forzado, solo aparición.

Este es uno de los flows transversales que mencionamos en la sección 6: **flow de cita completa, de reserva a liquidación**. La primera vez que el prestador lo recorre entero, el portal acompaña con presencia mínima pero significativa.

**Diagnóstico inicial:** **CN**. La coreografía de "primera atención" no existe hoy.

#### 7.3.2 Primera mascota recurrente

La primera mascota que vuelve a agendar contigo. **Primer voto real de confianza del cliente.**

El portal lo nota silenciosamente. Cuando el prestador entra al detalle de la mascota que viene por segunda vez (o tercera, según familia), aparece una marca sobria:

> *"[Nombre] vuelve con vos. Es su segunda visita."*

Sin notificación push. Sin badge. Solo presencia en el detalle. El prestador atento se da cuenta. Construye consciencia de continuidad de cuidado — que es la métrica luxury real (sección 4.5).

Este momento es **el opuesto a las métricas de volumen**. No celebra "atendiste mucho". Celebra "alguien volvió". Esa es la diferencia.

**Diagnóstico inicial:** **CN**. Concepto no implementado.

#### 7.3.3 Primera reseña recibida

Momento emocional cargado. Primera vez que el prestador ve cómo lo califica un cliente. **Puede ser positivo o negativo. El portal trata ambos casos con presencia.**

**Si la reseña es positiva:**

El portal libera el módulo de calificaciones del prestador (revelación progresiva, sección 6.6.5) y muestra la reseña con presencia. No usa exclamaciones celebratorias.

> *"[Nombre de familia] dejó tu primera reseña."*

El prestador lee. Si quiere responder a la reseña, puede hacerlo desde el portal (canal interno, sección 6.4.7). Si no, queda como está.

**Si la reseña es negativa:**

Acá el principio 7.2 se materializa. La reseña negativa **no es ticket que cerrar** — es oportunidad de demostrar que e-PetPlace toma en serio cada vínculo entre prestador y familia.

El portal notifica al prestador con sobriedad:

> *"Recibiste una reseña que necesita atención. [Nombre de familia] dejó una crítica sobre [servicio]. Podés responder o pedir intervención del equipo."*

Tres caminos:
- El prestador responde directamente con honestidad.
- El prestador pide intervención del equipo de e-PetPlace (sección 6.6.6 — disputas).
- Si la crítica es de fondo (no errores operativos sino que el modelo no encajó), conversación honesta de cierre.

En ningún caso se silencia la reseña ni se la oculta. La transparencia es luxury.

**Diagnóstico inicial:** **CN**. Sistema de reseñas alineado con el principio "reputación honrada, no jerarquizada" (sección 2.7) más manejo dual de reseña positiva/negativa.

#### 7.3.4 Primera liquidación cobrada

El prestador recibe su primera liquidación efectivamente cobrada. **Momento donde se conecta lo emocional con lo operativo del negocio.**

El portal lo refleja con sobriedad y datos claros:

> *"Recibiste tu primera liquidación de e-PetPlace. [Monto]. Detalle: [servicios incluidos]. Próximos pasos para facturación si aplica en tu país."*

El prestador puede descargar comprobante, ver desglose, y entender el flujo. No hay celebración. Hay claridad operativa con presencia.

Si el prestador recibe una propina o bonus de la familia (común en Ecuador para groomers y paseadores), se refleja en la liquidación con marcado explícito: *"Incluye propina voluntaria de [familia]"*. Esto es honra del gesto de la familia hacia el prestador.

**Diagnóstico inicial:** **CN** o **RC** según lo construido. Probablemente reconstrucción.

### 7.4 Momentos de pertenencia al ecosistema

#### 7.4.1 Primer handshake recibido

Otro prestador del ecosistema trabajó con una mascota que ahora vos atendés, y vos podés ver su aporte. **Es la primera vez que sentís que e-PetPlace es ecosistema, no solo herramienta.**

Cuando un vet del ecosistema deriva una mascota a otro vet (segundo opinión, mudanza, continuidad de cuidado), o cuando un cuidado temporal recibe una mascota cuyo vet del ecosistema dejó observaciones recientes — eso es handshake.

El portal lo presenta con peso. Cuando el prestador entra al detalle de la mascota, aparece sección destacada:

> *"[Nombre de prestador] del ecosistema te dejó contexto sobre [nombre de mascota]. Última intervención: [fecha y resumen]. Acá tenés el contexto que vas a necesitar."*

El prestador ve el aporte del colega del ecosistema. Bio-expediente compartido en acción real. Esto es la pieza defensiva del modelo materializada (sección 5.3 — Familia A como anclaje).

Después de leer, el prestador puede:
- **Agradecer al colega** por canal interno entre prestadores del ecosistema (feature nueva por construir — CN).
- **Continuar el caso** si está abierto, con conocimiento del contexto.
- **Sumar su propio aporte** al bio-expediente para el siguiente prestador que reciba la mascota.

**Esta es la prueba de fuego del modelo.** Si el primer handshake recibido se siente útil de verdad — no formal, no burocrático, sino *"sin esto hubiera empezado de cero"* — el modelo defensivo del producto se valida en uso real.

**Diagnóstico inicial:** **CN** mayor. Concepto técnico parcialmente implementado (handshake clínico en arquitectura) pero UI y momento narrativo no existen.

#### 7.4.2 Primer caso clínico transferido

Para vets específicamente. Momento donde el handshake clínico se materializa en su forma más completa.

**Variante A — vos enviás el caso a otro vet.** La familia decidió cambiar de vet tratante (mudanza, segunda opinión que se vuelve principal, insatisfacción honesta). Política P9 de `POLITICAS_EPETPLACE.md`.

El portal te acompaña al cierre con dignidad. Aparece un flow guiado:

- Confirmación de la familia que pidió el cambio.
- Espacio para escribir contexto al vet destino (no es ficha clínica fría — es carta profesional con lo importante para continuar el caso bien).
- Aceptación o rechazo del vet destino.
- Si acepta, cierre del caso de tu lado con marcado de "transferido a [colega] el [fecha]".

El portal reconoce el momento sin dramatizar:

> *"Cerraste tu primer caso clínico transferido a otro vet del ecosistema. La continuidad de cuidado para [nombre de mascota] queda en manos del colega. Tu aporte queda en su bio-expediente."*

**Variante B — vos recibís el caso de otro vet.** El portal te presenta el caso entrante con el contexto del colega + el bio-expediente completo. Llegás al caso con información real, no empezás de cero.

> *"[Nombre de colega] te transfiere el caso de [nombre de mascota]. Acá está el contexto que dejó: [resumen]. El caso ya está activo desde tu lado."*

Ambas variantes refuerzan el ecosistema. Cierre con dignidad de un lado, comienzo con contexto del otro. Sin caso de continuidad de cuidado interrumpida.

**Diagnóstico inicial:** **CN** mayor. Concepto técnico en arquitectura, sin UI ni flow narrativo todavía.

#### 7.4.3 Primer aniversario en el ecosistema

Un año cumplido como prestador de e-PetPlace. **Hito significativo que merece presencia, no celebración chillona.**

El portal reconoce con sobriedad. En el home del día del aniversario:

> *"Un año en e-PetPlace. Atendiste a [N] mascotas. Construiste continuidad con [M] familias. Documentaste [K] bio-expedientes. Gracias por haber estado este año."*

Para fundadores específicamente (Momento Fundacional), el aniversario puede llevar un gesto físico simbólico según capital disponible y momento del proyecto (sección 1.2 — pieza física se evalúa caso por caso después de los primeros 15). Esto se evalúa cuando se acerque el primer aniversario real de los primeros fundadores.

Para pioneros y establecidos, el aniversario es digital con presencia, sin pieza física.

**El aniversario es momento donde la voz del founder reaparece** (sección 4.7 — voz híbrida). Aunque la comunicación cotidiana ya pasó a voz del equipo, los aniversarios mantienen firma personal del founder cuando es Momento Fundacional. Es uno de los momentos donde la firma personal sigue valiendo.

**Diagnóstico inicial:** **CN**. Concepto no implementado.

### 7.5 Momentos sensibles

#### 7.5.1 Mascota perdida reportada en tu zona

Una mascota fue reportada perdida por su familia. El portal puede avisar a prestadores cercanos para amplificar la búsqueda (Capa 3 de `MODELO_PRODUCTO.md`, sistema futuro, política P10).

Si la mascota perdida es una que vos atendiste, el portal te lo comunica con presencia, no como alerta genérica:

> *"[Nombre de mascota], a quien atendiste el [fecha], fue reportada como perdida por su familia. Si la ves o tenés información, podés colaborar desde acá."*

Si la mascota perdida es de otro prestador pero está en tu zona y aplica para amplificación comunitaria:

> *"Una mascota fue reportada perdida cerca de tu zona. Si querés ayudar a la búsqueda, podés activar visibilidad de la alerta para tus clientes y red."*

Tono sobrio, acción concreta. **Cada mascota perdida es oportunidad de demostrar que el ecosistema funciona como red real** — no solo como CRM. El principio 7.2 se materializa: no es burocracia, es presencia que importa.

**Diagnóstico inicial:** **CN**. Sistema de alertas comunitarias es feature mayor diferida a F2+ (sección 6.6.4 nota implícita). En F1 puede haber notificación básica al prestador que atendió a la mascota, sin amplificación comunitaria todavía.

#### 7.5.2 Mascota fallecida y altar virtual — decisión cerrada S20

**Momento de máxima sensibilidad. Requiere el cuidado más fino del portal.**

La familia marca a la mascota como fallecida en su app (política P10 — solo la familia cambia este estado). El portal notifica al prestador o prestadores que la atendieron, con tono calibrado por frecuencia de atención:

**Si fue prestador frecuente** (vínculo profundo, recurrencia, mascota con varias visitas):

> *"[Nombre de mascota] falleció. La familia compartió la noticia con el ecosistema. Vos lo cuidaste durante [tiempo] — gracias por haber sido parte de su vida."*

**Si fue prestador esporádico** (una o dos atenciones):

> *"[Nombre de mascota], a quien atendiste el [fecha], falleció. La familia compartió la noticia con el ecosistema."*

En ambos casos, **el caso clínico abierto se cierra automáticamente** y deja de ser visible al público en general. La información permanece en el bio-expediente histórico pero ya no aparece en directorio activo. Política operativa coherente con el respeto al duelo (8.5 de `MODELO_PRODUCTO.md`).

**Altar virtual — decisión cerrada S20:**

Si la familia decide abrir un altar virtual para honrar a la mascota fallecida, e-PetPlace lo provee como feature opcional. **Referencia cultural: día de los muertos en México** — espacio digno donde la mascota es recordada con mensajes de acompañamiento.

Características del altar:

- **Opcional y bajo control de la familia.** Solo se abre si la familia lo pide. El portal no lo crea automáticamente. La familia mantiene control total: quién puede entrar, qué contenido se publica, cuándo se cierra.
- **Invitación a prestadores con consentimiento.** Si la familia decide invitar al altar a prestadores que cuidaron a la mascota, el portal les notifica. Los prestadores pueden dejar mensaje sobrio en honor a la mascota. **El acceso es por invitación de la familia, no de oficio.**
- **Moderación cuidada.** Aplican reglas de P5 (datos de menores). Contenido se modera para preservar dignidad del espacio.
- **Permanente o efímero, decisión de la familia.** El altar puede quedar abierto indefinidamente o cerrarse después de un período de duelo. La familia decide.

Esto es feature culturalmente significativa que refuerza el alma del producto: **e-PetPlace es ecosistema que recuerda, no plataforma que rota mascotas**. Para muchas familias, perder una mascota es perder un miembro real de la familia. El altar virtual es reconocimiento digno de ese vínculo.

**Diagnóstico inicial:** **CN diferida**. El altar virtual no se construye preventivamente. Disparo: primer fallecimiento real en el ecosistema F1. Construcción se prioriza con cuidado de moderación y diseño dignificado cuando llegue el momento.

#### 7.5.3 Disputa abierta

Un cliente abre disputa contra el prestador (cobro discutido, queja por servicio, problema operativo). El portal lo comunica con humanidad.

> *"[Nombre de familia] abrió una disputa sobre [servicio]. Motivo: [resumen]. Podés responder directamente o pedir intervención del equipo de e-PetPlace."*

**No es ticket frío.** Es comunicación honesta de que hay tensión que resolver. El principio 7.2 se aplica: la disputa es oportunidad de demostrar que el modelo cumple, no carga administrativa.

Caminos disponibles para el prestador:

- **Responder directamente** a la familia por canal interno (sección 6.4.7). Si la comunicación resuelve el conflicto, el portal lo registra como disputa resuelta entre partes.
- **Pedir intervención del equipo** de e-PetPlace. Persona dedicada del equipo (sección 3.8) media entre las partes. El historial del canal interno + el bio-expediente del servicio aportan trazabilidad real.
- **Aceptar la queja y compensar** si el prestador reconoce error. El portal facilita reembolsos o créditos cuando aplica.

Trazabilidad invariante: toda la conversación queda registrada (canal interno mediado por plataforma, sección 6.4.7). Esto vuelve la resolución defendible, justa, basada en hechos.

**Resolución de la disputa cierra el evento operativamente pero queda en el historial** del prestador como aprendizaje. No es marca permanente negativa — es información trazable para curaduría del ecosistema. Si un prestador acumula disputas serias, el equipo evalúa (relacionado con sección 3.10 — membresía revocable, aunque por causa distinta de inactividad).

**Diagnóstico inicial:** **CN**. Sistema de disputas completo es construcción nueva. Probablemente no entra en F1 inicial pero debe estar conceptualmente claro y operativo cuando aparezca la primera disputa real.

#### 7.5.4 Salida del prestador del ecosistema

Cierre del círculo con la decisión 3.11 ("no rogamos permanencia"). Cuando un prestador decide irse del ecosistema, o cuando no se gradúa al Día 90, el portal se despide con dignidad.

**Decisión cerrada S20:** la salida tiene dos momentos coreografiados:

**Momento 1 — Conversación de cierre.** Antes de procesar la baja real, conversación con el equipo dedicado (Momento Fundacional) o con persona del equipo (Momentos posteriores). Esto se conecta con la sección 4.8 — check-in humano. Pregunta abierta y honesta:

> *"¿Qué cambiarías de e-PetPlace? ¿Qué nos llevamos como aprendizaje?"*

Si la conversación revela problemas operativos resolvibles, el prestador puede reconsiderar. Si revela que el modelo no encaja, se cierra con respeto. **Aprendemos de la salida** (sección 3.11) — la conversación es valor para mejorar el modelo, no súplica para retener.

**Momento 2 — Carta de despedida.** Reconocimiento del tiempo compartido. En Momento Fundacional, firma del founder. En momentos posteriores, voz del equipo con tono humano:

> *"[Nombre], gracias por haber sido parte de e-PetPlace. Tu trabajo con [N] mascotas y [M] familias es parte de la historia del ecosistema. La puerta queda abierta — si en algún momento querés volver, lo conversamos."*

Sin dramatismo. Sin súplica. Reconocimiento sobrio de que la pertenencia tuvo valor.

**Qué pasa con los datos del prestador después de la baja:**

- **Bio-expediente histórico de las mascotas que atendió queda intacto.** El trabajo del prestador es parte del bio-expediente de cada mascota — eso no se borra. Lo que el prestador aportó al ecosistema queda en el ecosistema (con respeto a privacidad).
- **Página pública del prestador** (sección 4.5) se baja. Los certificados emitidos quedan trazables pero el prestador no aparece como activo.
- **Casos clínicos abiertos a su cargo:** se reasignan o se transfieren con conversación (política P8). Las mascotas no quedan sin atención.
- **Liquidaciones pendientes** se procesan con normalidad. El prestador recibe lo cobrado por su trabajo.

**Esta coreografía aplica también a no graduación al Día 90.** Si el prestador no cumplió criterios mínimos (sección 4.2) y no hay extensión, el cierre tiene los mismos dos momentos: conversación honesta + carta. La dignidad no se pierde porque el modelo no encajó.

**Diagnóstico inicial:** **CN**. Flow de salida con dignidad es construcción nueva. Especialmente sensible porque la calidad de cómo se cierra una pertenencia define la reputación del modelo (los prestadores que se fueron mal hablan distinto que los que se fueron bien).

### 7.6 Flows transversales integrados

#### 7.6.1 Flow de alta asistida (política P13)

El prestador atiende a una mascota walkin cuyo dueño no está registrado en e-PetPlace. Política P13 de `POLITICAS_EPETPLACE.md` cerrada en S19, ya implementada técnicamente.

**Decisión cerrada S20:** el flow de alta asistida es **momento narrativo donde el prestador se vuelve embajador del ecosistema**. No es trámite — es invitación facilitada.

Cuando el prestador detecta que la familia no está en e-PetPlace, el portal le ofrece flow guiado:

> *"[Nombre de familia] no está todavía en e-PetPlace. Podés crear su entrada como alta asistida. El sistema le va a enviar invitación para que complete su registro. Mientras tanto, podés operar con la mascota normalmente."*

El prestador completa datos mínimos (nombre, contacto). El sistema:

- Crea alta asistida pendiente + familia placeholder + mascota.
- Envía invitación al cliente para completar registro (email, link, QR).
- Si el cliente completa en 30 días, las mascotas se transfieren a su familia real automáticamente.
- Si no completa en 30 días, el pendiente y la familia placeholder se eliminan vía cleanup automático.

El prestador no necesita pedir consentimiento ni manejar datos personales sensibles — la plataforma maneja el flow de consentimiento.

**Momento narrativo del prestador:**

Cuando un alta asistida se completa (el cliente acepta entrar a e-PetPlace), el portal le devuelve presencia al prestador:

> *"[Nombre de familia] aceptó la invitación que le facilitaste. Ahora son parte de e-PetPlace. Su mascota está en tu agenda con expediente completo."*

Esto refuerza al prestador como **canal del ecosistema, no operador aislado**. Cada alta asistida exitosa amplía la base del ecosistema y conecta al prestador con su rol más allá del servicio puntual.

Si el cliente no completa el registro y el pendiente vence:

> *"El alta asistida de [nombre de mascota] venció sin que la familia aceptara la invitación. Si vuelven, podés reintentar."*

Sin reproche al prestador. El consentimiento del cliente es invariable (política P13). El portal lo respeta.

**Diagnóstico inicial:** Implementación técnica **CT** (cerrada en S19). UI del momento narrativo + presencia al cierre del alta exitosa: **CN o RC** parcial.

#### 7.6.2 Flow de transferencia de mascota entre familias (política P2)

La mascota se va con su nueva familia. El prestador que la atendió tiene un momento de despedida con peso emocional, especialmente si fue prestador recurrente.

Política P2 de `POLITICAS_EPETPLACE.md` define el handshake bilateral. Desde la perspectiva del prestador:

**Si fue su vet recurrente / paseador habitual / cuidado temporal frecuente:** el portal le comunica el cambio con presencia, no como notificación administrativa.

> *"[Nombre de mascota] se transfirió a otra familia. Cuidaste de [él/ella] durante [tiempo]. El bio-expediente que construiste viaja con [él/ella] al ecosistema de su nueva familia. Tu aporte sigue presente."*

Si el prestador tenía caso clínico abierto, **handshake bilateral con el nuevo vet de la familia destino** (cuando aplique). El portal facilita la conversación profesional entre vets.

**Si fue prestador esporádico** (una o dos visitas):

> *"[Nombre de mascota], a quien atendiste el [fecha], cambió de familia."*

Sin peso emocional excesivo, solo información clara.

El bio-expediente completo viaja con la mascota (política P2). Los hitos privados de cada humano de la familia origen **no migran** — quedan con el humano (política P6).

**Caso especial: adopción de refugio.** Cuando el refugio (Portal Refugios, ver portales hermanos en relación con otros documentos) transfiere una mascota adoptada a una familia, el handshake aplica igual. El portal del prestador clínico recibe la mascota con su bio-expediente del período en refugio.

**Diagnóstico inicial:** **CN** del flow narrativo en UI. Concepto técnico parcialmente en arquitectura.

### 7.7 Resumen del bloque

Esta sección define los momentos coreografiados del prestador más allá del Día 1, Día 30 y Día 90.

**Principio que atraviesa la sección:** cada momento sensible es oportunidad de demostrar que la mascota le importa al ecosistema. Sobriedad con presencia, ni frialdad sistémica ni performatividad sentimental.

**Momentos de descubrimiento:** primera atención, primera mascota recurrente, primera reseña (positiva o negativa), primera liquidación. Reconocimiento sobrio que construye consciencia del modelo.

**Momentos de pertenencia al ecosistema:** primer handshake recibido, primer caso clínico transferido, primer aniversario. Materialización del modelo defensivo (red de prestadores compartiendo bio-expediente) y reconocimiento de trayectoria.

**Momentos sensibles:** mascota perdida, mascota fallecida con altar virtual opcional, disputa, salida del prestador. Cuidado máximo. Cada uno es oportunidad de cumplir la promesa luxury en su forma más profunda.

**Flows transversales integrados:** alta asistida (P13), transferencia de mascota (P2). Trayectorias completas con dimensión emocional.

**Diagnóstico inicial del bloque:** mayoría **CN** (construcción nueva). Algunos conceptos están técnicamente parcialmente implementados pero la coreografía narrativa del momento no existe en ninguno. Este bloque define qué construir más allá de la mecánica técnica.

Si el portal logra estos momentos con calidad, los prestadores no van a poder volver a un CRM vertical después de e-PetPlace. **Eso es la defensibilidad real del modelo** — no la tecnología, sino la experiencia que vuelve insustituible al portal.

---

## 8. Contexto de mascota — cómo el prestador ve a la mascota

### 8.1 La pregunta raíz

Cuando el prestador entra al detalle de Zeus (o de cualquier mascota), ¿qué información encuentra y cómo la encuentra?

Esta sección define qué se materializa en la pantalla icónica del portal (sección 6.4.4 — Detalle de mascota). Hasta acá la describimos como "pantalla con bio-expediente vivo". Acá entramos al detalle de cómo se compone ese bio-expediente para el prestador específico.

El alma del bloque es simple: **el portal del prestador describe a la mascota como ser completo, no como ficha clínica o ficha de servicio**. Esto es lo que ningún CRM vertical hace. Y es donde la promesa luxury se materializa en información concreta que el prestador consume cada día.

### 8.2 Lo invocado, no redefinido

Este bloque **no redefine** conceptos que viven en otros documentos. Los invoca y aplica al portal del prestador:

- **5 dimensiones de identidad personal** (personalidad, gustos, miedos, manías y rituales, señales sutiles): definidas en `MODELO_PRODUCTO.md` sección 4. Técnicamente implementadas en Fase F (S18) sin UI todavía.
- **7 momentos vitales** (referencia a `MODELO_PRODUCTO.md`): nacimiento, cachorrería, adolescencia, adultez, adultez plena, vejez temprana, vejez avanzada (con sus variantes y duelo como parte del ciclo).
- **3 capas del producto**: identidad, cuidado, comunidad. `MODELO_PRODUCTO.md` sección 3.2.
- **Multi-especie**: el modelo aguanta especies distintas (`MODELO_PRODUCTO.md` sección 8 y políticas de `POLITICAS_EPETPLACE.md`).
- **Política P5 — datos de menores** y **política P6 — hitos privados del humano**: aplicables al contexto.
- **Vista parcial del bio-expediente por servicio del prestador**: ya cerrada en sección 5.6 y 6.4.4.

Lo que sí redactamos acá: cómo se **compone, jerarquiza, presenta y enriquece** esa información en el portal del prestador.

### 8.3 Presencia primero, información operativa segunda — decisión cerrada S20

**Decisión cerrada S20:** lo primero que el prestador ve al entrar al detalle de una mascota es **presencia, no alertas**. La identidad de la mascota como individuo único aparece antes que la información clínica o operativa.

Esto no significa que las alertas estén escondidas — están inmediatamente accesibles. Significa que la jerarquía visual y narrativa pone presencia primero.

**Por qué importa:**

Si lo primero que el vet ve al entrar al detalle de Zeus es *"ALERGIA AL POLEN"* en banner rojo, el portal está priorizando precaución defensiva sobre vínculo de cuidado. El portal trata a la mascota como riesgo a evitar. Eso es lo que hacen los CRMs verticales — y es exactamente el alma que no queremos.

Si lo primero que ve es *"Zeus, beagle, 4 años"* con foto y los datos que lo hacen ese individuo único, y al lado tiene un acceso rápido a alertas relevantes, el portal honra a la mascota como ser y al prestador como profesional capaz de leer la información que necesita. Eso es luxury operativo.

**Composición de la cabecera de detalle:**

- Foto grande de la mascota.
- Nombre prominente.
- Especie, raza, edad, género, microchip si aplica.
- **Tag de momento vital** (sección 8.4): "adultez plena", "vejez temprana", etc.
- **Tag de servicios activos** del prestador con la mascota cuando aplica (caso clínico abierto, contrato mensual de paseo, estadía vigente).
- **Acceso a alertas operativas** visible pero no intrusivo: ícono o botón discreto que despliega alergias, condiciones, medicación actual, observaciones críticas. El prestador profesional lo consulta antes de la atención.

El acceso a alertas no es de pop-up automático. Es elemento accesible, visible, esperando ser consultado. Confía en el profesionalismo del prestador.

### 8.4 Momento vital en cabecera + transiciones en timeline — decisión cerrada S20

Los 7 momentos vitales de `MODELO_PRODUCTO.md` se materializan en el portal del prestador de dos formas combinadas:

**(a) Tag de momento vital en cabecera del detalle.** Comunica contexto inmediato. *"Zeus está en adultez plena"*. El prestador adapta su atención sin necesidad de cálculos mentales sobre edad.

**(b) Transiciones de momento vital marcadas en timeline.** Cuando una mascota pasa de un momento a otro (cachorrería → adolescencia, adultez plena → vejez temprana), el portal lo registra como hito en el timeline narrativo. Esto da perspectiva longitudinal: el prestador ve dónde estuvo la mascota y dónde está ahora.

Las consecuencias operativas del momento vital (alimentación recomendada, frecuencia de control, sensibilidades típicas) **ya están integradas en las dimensiones y datos de manejo** — no requieren sección propia. El tag de momento vital es contexto narrativo; los datos derivados viven donde tienen que vivir.

### 8.5 Las 5 dimensiones de identidad personal — composición por relevancia operativa

Las 5 dimensiones (personalidad, gustos, miedos, manías y rituales, señales sutiles) están técnicamente implementadas pero sin UI. Cómo se presentan en el portal es decisión central de este bloque.

**Decisión cerrada S20:** las dimensiones se ordenan en el detalle de mascota **según relevancia operativa al servicio del prestador**, con bloque general "Identidad personal" siempre accesible para ver todo.

**Composición por servicio:**

Para un prestador con servicios clínicos (Familia A), las dimensiones se ordenan típicamente:
1. Miedos (saber qué le da miedo a Zeus permite ajustar manejo en consulta).
2. Manías y rituales (saber que tiene rituales calmantes específicos reduce estrés).
3. Señales sutiles (saber cómo Zeus comunica dolor permite detectar problemas tempranos).
4. Personalidad (contexto general).
5. Gustos (menos crítico para clínico aunque útil para vínculo).

Para un prestador de paseo (Familia D):
1. Personalidad (saber si Zeus es sociable, ansioso, energético orienta el paseo).
2. Gustos (rutas preferidas, perros con los que se lleva bien).
3. Miedos (qué evitar en el paseo).
4. Señales sutiles (cómo Zeus avisa cuando algo está mal).
5. Manías y rituales (saludos, comportamientos repetitivos).

Para cuidado temporal (Familia C):
1. Manías y rituales (críticos en estadía larga — Zeus tiene ritual de dormir).
2. Miedos (qué evitar en la estadía).
3. Personalidad (cómo se comporta en ambiente nuevo).
4. Gustos (comida, juguetes, espacios).
5. Señales sutiles (cómo Zeus comunica malestar lejos de casa).

Para estética (Familia E):
1. Miedos (al secador, al agua, a manipulación de patas, etc.).
2. Manías y rituales (cómo se calma).
3. Señales sutiles (cómo Zeus comunica incomodidad durante baño).
4. Personalidad (paciente, ansioso, mordedor en stress).
5. Gustos (toallas, productos preferidos si los hay).

Para adiestramiento (Familia F):
1. Personalidad (la dimensión central para entrenamiento).
2. Gustos (refuerzos efectivos: comida, juego, caricia).
3. Miedos (qué no usar como herramienta).
4. Manías y rituales (comportamientos a moldear o respetar).
5. Señales sutiles (cómo Zeus avisa que entendió o no entendió).

Para vacunación (Familia B):
1. Miedos (manejo durante aplicación).
2. Manías (rituales calmantes).
3. Personalidad (compacto — la atención es corta).
4. Señales sutiles (reacciones adversas tempranas).
5. Gustos (menos relevante, pero útil para vínculo rápido).

**Bloque general "Identidad personal" siempre accesible.** Las dimensiones ordenadas por relevancia operativa son **vista por defecto**. El prestador puede expandir a ver las 5 dimensiones completas en cualquier momento. Nada está oculto — solo jerarquizado.

**Diagnóstico inicial:** **CN** completo. UI de dimensiones de identidad personal no existe (D-110 diferida en S19, solo wrappers TS construidos).

### 8.6 Vista parcial del bio-expediente con indicación honesta — decisión cerrada S20

Ya cerramos en sección 5.6 qué ve cada familia. Acá la decisión es **cómo se le comunica al prestador que está viendo una vista parcial**.

**Decisión cerrada S20:** la vista parcial se comunica **con sobriedad honesta**, no silenciosamente. El prestador ve secciones de "información no visible para tu servicio" colapsadas y discretas, sabe que hay más, pero no accede.

**Por qué no silenciosamente:** porque comunicar honestidad es coherente con luxury. El prestador inteligente aprecia saber que e-PetPlace tiene política real de privacidad. Ocultar la existencia de información parecería ocultamiento, no curaduría.

**Cómo se presenta sin abusar:**

- Sección colapsada con título descriptivo: *"Información clínica detallada — visible solo a vets tratantes"*, *"Eventos de cuidado temporal — visible solo a hoteles activos"*.
- No se ve el contenido. Solo el título de la sección que existe.
- Sin explicaciones largas. Sin "¿por qué no puedo verlo?". El prestador profesional entiende.
- **Cuidado importante:** no abusar. Si abusamos de mostrar secciones ocultas, parece restricción. Si lo presentamos con elegancia, es respeto a la información de la mascota y de la familia.

El principio que une: el prestador sabe que el bio-expediente es rico, sabe que ve la parte relevante a su servicio, sabe que otros prestadores ven otras partes — y todo eso es bueno.

**Diagnóstico inicial:** **CN**. Concepto de vista parcial con indicación honesta no existe.

### 8.7 Aportes de otros prestadores con identificación calibrada — decisión cerrada S20

El bio-expediente es colaborativo (sección 5.6). Cuando un prestador entra al detalle, ve aportes de otros prestadores del ecosistema.

**Decisión cerrada S20:** la identificación de aportes se calibra por contexto:

- **Aporte genérico por defecto.** *"Aporte de un vet del ecosistema el [fecha]"*. *"Observación de paseador el [fecha]"*. El prestador ve el contenido del aporte pero no la identidad del colega. La privacidad opera entre prestadores que no se conocen.
- **Identidad explícita en handshakes.** Cuando un prestador deriva activamente a otro (handshake clínico, transferencia de caso, alta asistida con destino conocido), **sí se identifica al colega por nombre**. El handshake implica conocimiento mutuo y trazabilidad profesional.

**Por qué este modelo:**

- **Protege identidad de prestadores que no quieren ser conocidos** por todos los demás del ecosistema. Un vet puede preferir que su aporte sirva sin que cualquier paseador del ecosistema sepa quién es.
- **Permite reconocimiento profesional en handshakes** donde el vínculo profesional importa. El vet receptor sabe quién le derivó el caso; eso es defensa profesional.
- **Mantiene la red real sin perder privacidad operativa.**

**Acción para el prestador que quiere reconocer un aporte ajeno:**

Si un prestador valora especialmente un aporte que recibió, puede agradecer al colega por canal interno entre prestadores del ecosistema (feature mencionada en sección 7.4.1 — CN por construir). El portal facilita que el agradecimiento llegue al colega aunque la identidad no se haya expuesto.

**Diagnóstico inicial:** **CN**. Sistema de identificación calibrada de aportes + canal interno entre prestadores es construcción nueva.

### 8.8 Comportamiento de la mascota con el prestador — distinción público vs privado

Una mascota puede comportarse distinto con distintos prestadores. Zeus puede ser tranquilo con su vet de toda la vida y ansioso con un vet nuevo. ¿Esa información va al bio-expediente compartido o queda con el prestador específico?

**Decisión cerrada S20** con dos niveles:

**Observaciones operativas del servicio van al bio-expediente compartido.** Estado en consulta, reacción a procedimiento, comportamiento durante baño, energía en el paseo, ansiedad en estadía. Esto es información útil para todo el ecosistema — el próximo prestador la usa para mejorar el cuidado.

**Observaciones subjetivas del prestador sobre su relación con la mascota pueden quedar como notas privadas del prestador.** Equivalente a la política P6 (hitos privados del humano) aplicada al prestador. Son notas personales — la perspectiva específica de ese profesional con esa mascota — que no son del bio-expediente público.

Esto distingue dos cosas distintas:
- **"Zeus tuvo elevada FC al examen, requirió pausas durante consulta"** → bio-expediente compartido. Operativo.
- **"Siento que Zeus no se siente cómodo conmigo, tal vez por mi tono de voz"** → nota privada del prestador. Subjetiva, valor solo para ese profesional.

El prestador decide a qué nivel registra cada observación. El portal facilita ambos campos sin obligar.

**Diagnóstico inicial:** **CN**. Distinción de niveles de observación es modelo nuevo. Notas privadas del prestador no existen como entidad.

### 8.9 Patrones de comportamiento difícil con un prestador específico — decisión cerrada S20 (tercera vía)

**Caso especialmente delicado:** cuando una mascota muestra comportamiento difícil recurrente con un prestador específico mientras se comporta bien con otros prestadores del ecosistema. Por ejemplo: Zeus está tranquilo con su paseador pero ansioso y agresivo con su vet en cada consulta.

Tres caminos posibles que se evaluaron en S20 y se descartaron:

- **Camino 1 (descartado):** el portal recomienda directamente a la familia que cambie de prestador después de N episodios. Riesgo: falsos positivos (puede haber dolor agudo no diagnosticado, asociación con experiencias previas no atribuibles al vet), el portal acusando a un prestador a sus clientes, conversión del portal en oráculo algorítmico.
- **Camino 2 (descartado):** el portal no hace nada. Riesgo: la mascota sigue sufriendo estrés recurrente; el modelo no honra su prioridad declarada (la mascota).
- **Camino 3 (decisión cerrada S20):** **tercera vía — comunicar patrón con transparencia, decidir con humanos**.

**Cómo opera la tercera vía:**

**Paso 1 — Aviso al propio prestador.** Si el portal detecta patrón recurrente de comportamiento difícil con un prestador específico, **lo primero que hace es avisarle al prestador**, no a la familia. El prestador ve en su propio portal:

> *"Notamos que [nombre de mascota] muestra patrón de comportamiento [específico] en sus visitas con vos. Acá tenés los eventos detectados. Puede haber margen de ajuste en el manejo."*

El prestador profesional usa esa información para mejorar: cambiar de sala, ajustar horario, llevar al perro al consultorio en momento menos saturado, sugerir sedación previa, derivar a un colega más afín, conversar con la familia. Información operativa, no acusación.

**Paso 2 — Alerta al equipo de e-PetPlace si el patrón continúa.** Si pasados más eventos (umbral más alto que dos — por definir según experiencia operativa) el patrón persiste, el portal alerta al **equipo de e-PetPlace**, no a la familia. El equipo dedicado (sección 3.8) puede:

- Hablar con el prestador honestamente.
- Hablar con la familia para entender mejor el contexto.
- Si corresponde, mediar una conversación entre vet y familia.
- Si todo eso falla y el patrón persiste con riesgo claro para la mascota, **acompañar a la familia a evaluar opciones** — incluyendo, eventualmente, cambio de prestador.

**Paso 3 — El portal nunca le dice a la familia "cambiá de prestador" de oficio.** La conversación es humana. El portal aporta información, los humanos toman decisiones.

**Lo que esta tercera vía preserva:**

- **La mascota.** El cuidado mejora porque el prestador recibe información para ajustar antes de que el patrón se vuelva crónico.
- **El prestador.** Tiene derecho a saber y a corregir antes de que el ecosistema dude de él. Si era un mal momento, lo resuelve. Si efectivamente no es buen match con esa mascota, lo deriva con dignidad.
- **La curaduría del ecosistema.** No socavamos a un prestador que pasó nuestro filtro a sus espaldas.
- **Dignidad operativa.** Resolvemos con humanos, no con algoritmos. Eso es luxury en su forma más profunda.

**Implicancia futura:** este principio podría extenderse en momento posterior a **membresía revocable por patrones que demuestren que el modelo no encaja con un prestador específico**, complementando la decisión 3.10 (revocación por inactividad). Pero esa decisión es para otro momento — hoy solo dejamos el principio claro.

**Diagnóstico inicial:** **CN** completo. Detección de patrones de comportamiento + flow de comunicación calibrada + escalado al equipo es construcción significativa que requiere data acumulada para operar.

### 8.10 Invitación silenciosa al enriquecimiento — decisión cerrada S20

El portal puede invitar al prestador a aportar a las dimensiones cuando detecta vacíos. **Esto es invitación, no obligación.**

**Cómo se presenta:**

Después de la atención (sección 6.3.3), si el portal detecta dimensiones de identidad personal sin datos para esa mascota, aparece sugerencia sobria:

> *"[Nombre de mascota] tiene 4 años y no hay información sobre [dimensión específica] documentada. Si lo notaste durante la atención, podés sumarlo. Es opcional."*

Características de la invitación:

- **No bloquea el cierre de la atención.** El prestador apresurado puede ignorarla sin penalización.
- **Específica, no genérica.** Identifica qué dimensión está vacía y por qué importa para esta mascota.
- **Aparece una vez por dimensión por mascota.** No insiste. Si el prestador ignora, no vuelve a aparecer en cada cita futura.
- **Reconoce el aporte con sobriedad.** Si el prestador aporta, el portal reconoce silenciosamente — se conecta con visibilidad del propio compromiso (sección 3.9).
- **No es gamificación.** No suma puntos. No genera badge. Es invitación a enriquecer la historia de la mascota porque eso le sirve a ella y al ecosistema.

**Por qué este modelo funciona:**

El prestador comprometido ve la invitación como herramienta — "ah, sí, noté algo, lo sumo". El prestador no comprometido la ignora — y eso es información operativa también (se conecta con sección 3.9 y eventualmente con 3.10).

**Diagnóstico inicial:** **CN**. Sistema de invitación silenciosa al enriquecimiento es construcción nueva, alineada con principio de respeto y aspiracional del portal.

### 8.11 Datos de manejo según servicios habilitados

Sub-sección operativa que complementa la presencia y las dimensiones. **Datos prácticos** que el prestador necesita para hacer su trabajo:

**Para clínicos:** alergias confirmadas, medicación actual, condiciones crónicas, exámenes recientes, peso y signos vitales históricos.

**Para vacunación:** calendario completo, próxima dosis, alergias relevantes a aplicaciones previas.

**Para cuidado temporal:** alimentación (marca, porción, frecuencia), medicación con horarios, alergias, comportamientos especiales, contactos de emergencia de la familia.

**Para paseo:** comportamiento social, ruta preferida, perros con los que se lleva bien o mal, alergias ambientales, eventos previos de paseos.

**Para estética:** tipo de pelaje, alergias dérmicas, comportamiento durante baño/secador/manipulación, sensibilidades cutáneas, productos preferidos.

**Para adiestramiento:** historia de entrenamiento previo, comandos aprendidos, refuerzos efectivos, áreas a trabajar.

Estos datos viven en el bio-expediente compartido (sección 5.6) con vista filtrada por servicio. Aparecen en el detalle de mascota como sub-secciones agrupadas, accesibles desde la cabecera y desde la pantalla "antes" (sección 6.3.1).

### 8.12 Familia humana visible desde el contexto de mascota

Sub-sección que conecta esta pantalla con la siguiente (Sección 9 — Familia humana). Desde el detalle de la mascota, el prestador ve quién es la familia humana de Zeus: co-dueños, familiares autorizados.

La profundización de cómo el prestador ve y trata a la familia humana se cubre en Sección 9 dedicada. Acá solo notamos que **la familia humana es elemento del contexto de la mascota** — no entidad separada. La mascota es lo que ata al prestador con la familia.

### 8.13 Resumen del bloque

El contexto de mascota es donde se materializa el alma del producto en la información que el prestador consume cada día.

**Cinco principios estructurales:**

- **Presencia antes que alertas.** La identidad de la mascota como individuo único aparece antes que cualquier información clínica o operativa.
- **Composición por relevancia operativa.** Las 5 dimensiones de identidad personal se ordenan según el servicio del prestador. Todo accesible, pero jerarquizado por utilidad.
- **Transparencia honesta de la vista parcial.** Lo que no se ve, se anuncia. Es respeto, no restricción.
- **Identificación calibrada de aportes de otros prestadores.** Genérico por defecto, identidad explícita en handshakes.
- **Tercera vía para patrones difíciles.** Comunicar patrón con transparencia al prestador primero, escalar al equipo si persiste, dejar la decisión final a humanos. Nunca el portal sentencia.

**Dos principios narrativos:**

- **Enriquecimiento por invitación silenciosa, no por obligación.** El prestador comprometido enriquece; el apresurado pasa sin penalización.
- **Distinción público vs privado en observaciones del prestador.** Lo operativo va al bio-expediente; lo subjetivo puede quedar como nota privada.

**Diagnóstico inicial del bloque:** mayoría **CN**. La pantalla de detalle de mascota existe hoy pero como ficha simple. Su transformación a bio-expediente vivo con todas las dimensiones, vistas parciales calibradas, aportes identificados, y patrones detectados es reconstrucción profunda. Es trabajo grande pero es la pantalla icónica del portal — vale el esfuerzo.

---

## 9. La familia humana desde el portal del prestador

### 9.1 La pregunta raíz

Sección 8 cubrió cómo el prestador ve a la mascota. Esta sección cubre cómo ve a la familia humana de esa mascota. Es la sección espejo.

Cuando el prestador atiende a Zeus, ¿cómo entiende a quién pertenece, quién decide sobre él, quién paga, quién va a retirarlo, quién puede recibir información? El portal tiene que darle al prestador esa claridad sin invadir privacidad y sin convertirlo en investigador.

El alma del bloque: **la familia humana es elemento del contexto de la mascota, no entidad separada que el prestador estudia**. La mascota es lo que ata al prestador con la familia.

### 9.2 Lo invocado, no redefinido

Conceptos que viven en otros documentos y se aplican acá:

- **Familia humana como entidad** definida en `MODELO_PRODUCTO.md` y `BIO_EXPEDIENTE.md`. Tablas `familia`, `familia_miembro`, `mascota_codueño`, `mascota_familiar_autorizado` ya en producción.
- **Política P1** — doble confirmación destructiva (todos los co-dueños deben acordar acciones críticas).
- **Política P2** — transferencia de mascota entre familias con handshake bilateral.
- **Política P3** — mascotas walk-in y familia virtual del prestador.
- **Política P5** — datos de menores con permisos diferenciados.
- **Política P6** — hitos privados del humano (no visibles al prestador).
- **Política P13** — alta asistida (S19).
- **Comunicación mediada por plataforma** — sección 6.4.7.

### 9.3 Presentación de la familia humana — decisión cerrada S20

**Decisión cerrada S20:** la familia humana se presenta al prestador como **lista clara con énfasis en información operativa**, no como visualización elaborada.

Estructura por defecto:

- Lista plana de personas vinculadas a la mascota específica.
- Cada persona con su rol e información operativa.
- Indicador visible de contacto principal de hoy (quien va a entregar o retirar en la atención actual).
- Acceso al canal interno mediado por plataforma (sección 6.4.7).

Cuando la familia es simple (un dueño o pareja con un menor autorizado), la lista plana basta y comunica con claridad. Cuando hay complejidad real (co-dueños no convivientes, familiares autorizados múltiples), las relaciones se explicitan textualmente en la lista — no requieren visualización gráfica especial.

Esto es coherente con la sobriedad luxury: información clara, sin adornos visuales que no agregan valor operativo.

**Diagnóstico inicial:** **CN**. El portal hoy maneja "cliente" como entidad simple. La familia humana con co-dueños y autorizados visible al prestador es modelo nuevo.

### 9.4 No hay fotos de familia humana — decisión cerrada S20

**Decisión cerrada S20:** **e-PetPlace no muestra fotos de la familia humana en ningún lugar de la plataforma**. La única foto que existe en el sistema es la de la mascota.

Razones del modelo:

- **Refuerza la jerarquía del producto.** Lo que vemos es la mascota, no los humanos. El centro narrativo es claro.
- **Protección de menores invariante.** Camila (14 años, autorizada en el ejemplo) nunca aparece visualmente en la plataforma. Esto protege a menores sin requerir reglas especiales.
- **Coherente con sobriedad luxury.** Las fotos personales generan ruido visual. La identificación por nombre es suficiente y profesional.
- **Reduce riesgo de identificación cruzada.** Sin fotos, un prestador no puede reconocer visualmente a una familia humana fuera del contexto de la plataforma — eso protege la privacidad de las dos partes.
- **Simplifica el modelo operativo.** No hay que moderar fotos, no hay que manejar consentimientos visuales, no hay que pensar políticas de qué foto es aceptable.

Aplicación universal: vale para co-dueños, familiares autorizados (adultos y menores), contactos de emergencia. Vale para Portal Prestador, Portal Sellers, Portal Refugios, Portal Admin, App Cliente — los cinco documentos hermanos lo heredan.

Esta decisión va a `EPETPLACE.md` y a `MODELO_PRODUCTO.md` como principio general del producto, no solo del portal del prestador. **Deuda documental** explícita.

### 9.5 Qué información de cada persona ve el prestador

Para cada miembro de la familia vinculado a la mascota específica que el prestador atiende:

**Información visible:**

- **Nombre.**
- **Rol** (co-dueño / familiar autorizado adulto / familiar autorizado menor).
- **Vínculo declarado con la mascota** cuando la familia lo declaró ("su humana", "su papá", "su hermana mayor"). Es texto libre que la familia puede o no llenar.
- **Indicador de contacto principal de hoy** (quien va a entregar o retirar la mascota en esta visita específica).
- **Acceso al canal interno** mediado por plataforma (sección 6.4.7).
- **Permisos específicos cuando aplica** ("autorizada para entregar y retirar" vs "autorizada solo para retirar" vs "autorizada solo para entregar").

**Información NO visible al prestador:**

- **Teléfono, email, dirección personal.** Comunicación es solo por canal interno.
- **Cédula, documento de identidad, datos biométricos.**
- **Otros miembros de la familia humana que no están vinculados a esta mascota específica.** Sofía puede tener tres mascotas; el paseador de Zeus solo ve la familia humana vinculada a Zeus, no a las otras dos mascotas ni a sus co-dueños.
- **Información financiera personal** (ingresos, medios de pago detallados, deudas).
- **Hitos privados del humano sobre la mascota** (política P6).
- **Fotos de cualquier miembro de la familia** (decisión 9.4).

El principio: el prestador ve **lo necesario para operar bien, no más**. La privacidad opera por defecto. Lo que se muestra está justificado por utilidad operativa.

### 9.6 Comunicación operativa de la familia al prestador antes de la atención — decisión cerrada S20

La familia humana puede mandar instrucciones operativas al prestador a través del canal interno (sección 6.4.7) antes de la atención. Ejemplos:

- *"Zeus ayer comió algo que le cayó mal, está más tranquilo de lo normal. Si lo ves raro, contame."* (al vet antes de consulta de control).
- *"Zeus tiene ansiedad de separación, podés llevarlo de juguete en el paseo."* (al paseador antes del primer paseo).
- *"Soy mamá de Camila. Ella va a llevar a Zeus mañana, por favor confirmame cuando lo retire."* (al groomer antes del servicio).

Estos mensajes son parte del contexto de la atención y aparecen en la pantalla "antes" (sección 6.3.1).

**Decisión cerrada S20:** los mensajes operativos son **efímeros por defecto, con opción de "incorporar al bio-expediente"** cuando contienen información relevante para futuras atenciones.

Aplicación:

- *"Zeus tiene ansiedad de separación"* → relevante para identidad/comportamiento. El prestador puede marcar como aporte al bio-expediente (dimensión personalidad o miedos). Con consentimiento de la familia que aplica al canal interno (sección 6.4.7).
- *"Soy mamá de Camila, confirmame cuando retire"* → transaccional, efímero. Queda como mensaje del canal interno sin incorporación al bio-expediente.

El prestador decide cuándo marcar. El portal facilita ambas opciones sin obligar.

**Diagnóstico inicial:** **CN**. El flujo de incorporación selectiva de mensajes a bio-expediente es modelo nuevo.

### 9.7 Política P1 materializada — el prestador es informado, no ejecutor

La política P1 (doble confirmación destructiva) cubre acciones críticas que requieren consenso de todos los co-dueños de la mascota: dar de baja, remover co-dueño, transferir mascota, cambiar privacidad crítica.

**Decisión cerrada S20:** **el prestador no tiene rol decisorio en P1**. Las decisiones P1 son internas de la familia humana. **Cualquier cambio real sobre la mascota de un cliente registrado se hace desde la app del cliente, no desde el portal del prestador.** El portal del prestador solo refleja el estado actual. **Excepción:** la política P13 (alta asistida) permite al prestador crear mascota + familia placeholder durante atención presencial de un cliente no registrado todavía, hasta que el cliente complete su registro (ver secciones 7.6.1 y 9.9).

Cómo opera esto:

- Si un co-dueño le pide al prestador que dé de baja a la mascota del sistema, el portal del prestador NO ofrece esa acción. La acción se hace desde la app del cliente, donde P1 se activa correctamente con los demás co-dueños.
- Si un co-dueño le pide al vet que cambie configuración de privacidad de la mascota, el portal del prestador NO ofrece esa acción. La gestiona la familia desde su app.
- Si un co-dueño le pide al prestador que registre que la mascota cambió de familia, el portal del prestador NO ejecuta. Se hace desde la app por P2 con handshake bilateral.

**El prestador agrega información a la mascota vía bio-expediente (eventos clínicos, observaciones, certificados, etc.), pero no modifica el estado estructural de la mascota ni su familia.** Esta es decisión fundamental: el prestador construye historia, no decide pertenencia ni estado.

Para evitar confusión cuando un co-dueño le pide al prestador algo que no le corresponde, el portal puede mostrar mensaje claro:

> *"Esta acción se hace desde la app de [familia]. Pediles que la inicien desde su app y el sistema te va a notificar cuando se complete."*

Sin frustrar al prestador, sin frustrar a la familia. El prestador entiende los límites de su rol y deriva con claridad.

**Diagnóstico inicial:** **CN**. La separación clara entre acciones del prestador y acciones de la familia desde apps respectivas es modelo nuevo que reemplaza prácticas donde todo se hace desde un solo lado.

### 9.8 Política P2 materializada — el prestador no ve la transferencia en proceso

La política P2 cubre la transferencia de mascota entre familias con handshake bilateral entre Familia A (origen) y Familia B (destino).

**Decisión cerrada S20:** durante el período de propuesta de transferencia (entre que Familia A propuso y Familia B aceptó o rechazó), **el prestador no ve nada del cambio**. La mascota sigue apareciendo con su familia actual en el portal del prestador.

Razones:

- La transferencia en proceso es asunto íntimo de las familias. El prestador no necesita saber hasta que se confirme.
- Si la transferencia se rechaza, el prestador nunca se enteró — evita exposición innecesaria de cambios que no se concretaron.
- El prestador sigue operando con normalidad mientras la transferencia se procesa entre las familias.

**Una vez confirmada la transferencia:**

- El portal notifica al prestador con el momento narrativo correspondiente (sección 7.6.2 — despedida calibrada según frecuencia de atención).
- El bio-expediente sigue accesible al prestador para continuidad de cuidado. La familia destino puede continuar con el mismo prestador a corto plazo si confía en él.
- Si la familia destino decide cambiar de prestador, eso es decisión nueva — separada de la transferencia y manejada con su propio handshake profesional.

**Caso especial — adopción de refugio.** El refugio actúa como Familia A virtual hasta que el adoptante (Familia B) acepta. El handshake clínico se activa al nuevo vet de la familia adoptante. Esto cruza Portal Prestador con Portal Refugios — y se cubre con detalle en el documento PORTAL_REFUGIOS_CRIADEROS.md cuando se redacte.

**Diagnóstico inicial:** **CN**. Concepto técnico parcialmente en arquitectura, flow narrativo en UI no existe.

### 9.9 Política P3 materializada — familia virtual del prestador

La política P3 cubre cuando un prestador atiende a una mascota cuyo dueño no está registrado en e-PetPlace. El sistema auto-crea una familia virtual con `tipo='virtual_prestador'` y `cuenta_comercial_id` del prestador.

**Decisión cerrada S20:** la familia virtual se presenta al prestador con honestidad operativa.

Cómo se ve:

- El prestador ve la mascota en su agenda y en historial normalmente — opera con ella sin trabas.
- En el detalle de mascota, en la sub-sección de familia humana, aparece: *"Pendiente de registro — alta asistida en proceso. La invitación al cliente se envió el [fecha]."*
- El prestador no puede ver "datos de familia humana" porque no hay familia humana registrada todavía.
- El prestador no puede iniciar canal interno porque no hay con quién comunicarse digitalmente.
- Si la mascota tiene contacto telefónico tomado en la atención presencial, ese contacto aparece **solo para el prestador que la registró** como nota privada (no es de bio-expediente compartido) — necesario para continuidad operativa en F1.

**Cuando el cliente real completa el registro:**

- La familia virtual se transfiere a la familia real automáticamente (trigger ya implementado en S19).
- El prestador ve el cambio: la sección de familia humana se llena con los datos del cliente real.
- Se activa el canal interno mediado por plataforma.
- El momento narrativo 7.6.1 (alta asistida completada) reconoce al prestador como embajador del ecosistema.

**Cuando el cliente no completa en 30 días:**

- El pendiente y la familia placeholder se eliminan vía cleanup automático.
- El prestador recibe notificación de que el alta asistida venció.
- Si el cliente regresa después, el prestador puede reintentar el alta asistida en una nueva atención.
- La mascota como entidad **queda con el prestador como familia virtual hasta que se resuelva** (política P3 cierre).

**Diagnóstico inicial:** Implementación técnica **CT** (cerrada en S19). UI de presentación de familia virtual al prestador + notificaciones de transferencia: **CN**.

### 9.10 Información operativa relevante sin invasión de privacidad

Tensión inherente: el prestador necesita información para hacer su trabajo bien, pero el portal no debe invadir privacidad innecesariamente.

**Principio que cierra esta tensión — decisión cerrada S20:** el portal aporta información operativa concreta que el prestador necesita para hacer su trabajo bien, **no profundiza en datos personales que no agregan valor operativo**.

Aplicación a casos concretos:

**¿Quién puede entregar y retirar a la mascota?**

El prestador ve permisos explícitos:
- *"Sofía García (co-dueña): puede entregar y retirar."*
- *"Martín Pérez (co-dueño): puede entregar y retirar."*
- *"Camila García (familiar autorizado, menor): autorizada para entregar y retirar."*

Lo que el prestador NO necesita y NO ve: grado escolar de Camila, dirección de la familia, motivo por el cual una persona no puede una cosa que otra sí puede.

**¿Quién es el contacto de emergencia si pasa algo grave?**

El prestador ve:
- *"Contacto de emergencia primario: Sofía García. Acceso por canal interno con alta prioridad."*
- *"Contacto de emergencia secundario: Martín Pérez."*

Lo que el prestador NO necesita y NO ve: teléfonos personales (la plataforma maneja la notificación de emergencia automáticamente al canal con alta prioridad), datos médicos personales de Sofía o Martín, dirección personal.

**¿Quién autoriza un procedimiento adicional en emergencia (vet)?**

El vet ve:
- *"Co-dueños activos. Cualquiera puede autorizar procedimientos de urgencia. Acciones que requieren P1 (no urgencia) requieren consenso de todos."*
- Si la familia configuró un "co-dueño primario" para autorizaciones de urgencia, ese se destaca.

El vet recibe respuesta del co-dueño autorizado a través del canal interno con alta prioridad. La autorización queda registrada para trazabilidad legal.

El principio que une todo: **información concreta y operativa, no biográfica**. Esto es respeto a la familia humana y a la dignidad del modelo.

**Diagnóstico inicial:** **CN** mayor. Permisos granulares de quien-puede-qué, contactos de emergencia con priorización, autorizaciones de urgencia con trazabilidad — son piezas nuevas significativas.

### 9.11 Resumen del bloque

La familia humana desde el portal del prestador se trata con tres principios estructurales:

- **La mascota es el centro narrativo, la familia es contexto operativo.** El prestador ve a la familia humana porque la necesita para operar bien, no como entidad separada que estudia.
- **Sin fotos de familia humana, en ningún lugar de la plataforma.** Solo la mascota tiene presencia visual. Esto refuerza la jerarquía del producto, protege menores por defecto, y simplifica el modelo operativo.
- **Información operativa concreta, no biográfica.** El prestador ve lo necesario para hacer su trabajo bien. La privacidad opera por defecto.

Dos principios operativos clave:

- **El prestador es informado, no ejecutor.** Las decisiones estructurales sobre la mascota (P1, P2) las toma la familia desde su app. El prestador construye historia vía bio-expediente; no decide pertenencia ni estado.
- **Mensajes operativos efímeros por defecto, incorporables al bio-expediente con criterio.** Lo que es identidad/comportamiento de la mascota se incorpora; lo transaccional queda en canal interno y no contamina el expediente.

**Decisiones del bloque que generan deuda documental:**

- *"No fotos de familia humana en la plataforma"* va a `EPETPLACE.md` y `MODELO_PRODUCTO.md` como principio general del producto, no solo del portal del prestador.
- *"Cualquier cambio real sobre la mascota se hace desde la app del cliente"* va a `MODELO_PRODUCTO.md` como principio que aplica a los cinco portales del ecosistema.

**Diagnóstico inicial del bloque:** mayoría **CN**. La gestión de familia humana en el portal del prestador con co-dueños, familiares autorizados, permisos diferenciados, política P1/P2/P3 materializada y comunicación operativa selectiva es construcción nueva. El modelo técnico de tablas está implementado (S17-S18); el frame de UI y la coreografía operativa no existen.

---

## 10. Niños y familiares autorizados

### 10.1 La pregunta raíz

Cuando una madre autoriza a su hija de 14 años a llevar a Zeus al groomer, ¿qué pasa? ¿Qué ve el groomer? ¿Qué documenta? ¿Cómo protegemos a Camila sin obstaculizar el servicio ni convertirlo en checkpoint legal?

Sección 9 trató a la familia humana en general. Esta sección hace foco en dos sub-poblaciones que requieren tratamiento especial: **menores de edad** y **familiares autorizados** (que pueden o no ser menores).

El alma del bloque: la presencia de menores en la operación del portal es realidad cotidiana en LatAm. El portal la trata con respeto, claridad y protección — sin paternalismo, sin obstaculizar el cuidado de la mascota.

### 10.2 Lo invocado, no redefinido

Conceptos que viven en otros documentos y se aplican acá:

- **Política P5** de `POLITICAS_EPETPLACE.md` — datos de menores. Permisos diferenciados por edad, restricciones de uso de datos (no DaaS, no segmentación publicitaria), moderación de hitos públicos contribuidos por menores, constraint `chk_menor_publico_modera`.
- **Tabla `mascota_familiar_autorizado`** con sus permisos. Ya en producción.
- **Decisión 9.4** — no fotos de familia humana en ningún lado, lo que incluye protección visual automática de menores.
- **Decisión 9.10** — información operativa concreta, no biográfica.

### 10.3 Distinción operativa entre adulto y menor autorizado

**Decisión cerrada S20** que estructura el bloque:

**Familiar autorizado adulto:** un primo, una pareja no co-dueña, un cuidador adulto que la familia designó. Puede:
- Entregar y retirar mascota.
- Recibir comunicaciones del prestador por canal interno (sección 6.4.7).
- Ser contacto secundario de emergencia.
- Autorizar decisiones rutinarias sobre el servicio acordado.

**Familiar autorizado menor (14 a 17 años):** un hijo, hija, hermano menor. Permisos diferenciados. Puede:
- Entregar y retirar mascota cuando la familia lo autoriza explícitamente.
- Recibir información operativa concreta del momento (cómo se comportó, hora de retiro, observaciones del día).

El menor NO puede:
- Recibir comunicaciones del prestador sobre temas que vayan más allá del momento operativo concreto. Las comunicaciones serias siempre van con co-dueño adulto.
- Autorizar cambios mayores al servicio agendado (servicio distinto, modificación de precio, procedimientos adicionales).
- Ser único contacto en emergencias o decisiones clínicas.

**Menor de 14 años:** **no puede ser familiar autorizado para entregar y retirar mascota**, pero puede tener presencia en la app del cliente.

### 10.4 Edad mínima para solicitar servicios — decisión cerrada S20

**Decisión cerrada S20:** la edad mínima para solicitar servicios desde la app del cliente es **14 años**. Aplica a:

- Reservar citas y servicios.
- Confirmar acordados.
- Iniciar transferencias o cambios.
- Comunicarse formalmente con prestadores por canal interno operativo.

**Menores de 14 años en la app del cliente:**

Pueden estar presentes con permisos diferenciados:
- Ver perfil de la mascota y su bio-expediente (vista calibrada para edad).
- Subir experiencias y hitos sobre la mascota (con moderación de co-dueño antes de publicarse si son hitos públicos, según P5 actual).
- Ver el timeline narrativo familiar de la mascota.
- Acceder al espacio familiar de la mascota.

**No pueden:**
- Solicitar servicios de ningún tipo.
- Iniciar contacto operativo con prestadores.
- Ser autorizados para entregar o retirar a la mascota en visitas a prestadores.

Esta decisión genera **deuda documental para `POLITICAS_EPETPLACE.md`**: enriquecer P5 con el umbral de 14 años como edad mínima operativa para servicios.

### 10.5 Qué ve y cómo opera el prestador cuando llega un menor autorizado

Caso concreto que ilustra el modelo: Camila (14 años, autorizada por su madre Sofía) llega al groomer con Zeus.

**En la pantalla "antes" (sección 6.3.1):**

El groomer ve:
- *"Hoy entrega: Camila García (familiar autorizado menor). Autorizada para entregar y retirar."*
- Instrucciones operativas si la madre las dejó por canal interno antes de la cita.

El groomer NO ve:
- Foto de Camila (decisión 9.4).
- Datos personales de Camila más allá de nombre, rol y permisos operativos.
- Información biográfica innecesaria.

**Durante la entrega:**

- El groomer recibe a Camila con normalidad. Es Camila, autorizada, listo.
- **No le pide documento.** No la registra como entidad separada. Camila ya está en el sistema con sus permisos.
- Si Camila trae instrucciones de la madre ("Sofía me dijo que esta vez le hagamos corte corto"), el groomer puede aceptar **si la instrucción es consistente con el servicio agendado y no implica cambio mayor**. Para cualquier cambio mayor (servicio distinto, modificación de precio, autorización de procedimiento adicional), el groomer confirma con co-dueño adulto por canal interno antes de proceder.
- El groomer no le hace preguntas a Camila más allá de lo operativo del día. No es entrevista, es entrega.

**Durante el servicio:**

- El groomer trabaja con normalidad.
- Si surge un hallazgo (lesión en la piel, comportamiento inusual), el groomer documenta y **contacta a co-dueño adulto por canal interno con prioridad** — no a Camila.
- Camila puede esperar en el establecimiento si la familia lo coordinó así, o retirarse y volver.

**En la pantalla "después" (sección 6.3.3):**

- El groomer documenta el servicio normalmente en el bio-expediente.
- Mensaje opcional a la familia se manda al co-dueño adulto (Sofía), no a Camila.
- Si Camila vuelve a retirar, el portal lo refleja: *"Retiro: Camila García."*

**Diagnóstico inicial:** **CN**. Indicadores de tipo de autorizado, restricciones operativas según rol, comunicación calibrada con adulto vs menor son construcción nueva en UI.

### 10.6 Aportes de menores procesados con cuidado — decisión cerrada S20

Si Camila quiere contarle al groomer información sobre Zeus durante la entrega ("Zeus le tiene miedo a la aspiradora ahora"), ¿cómo se trata?

**Decisión cerrada S20:** el prestador puede recibir el aporte verbalmente y registrarlo en el bio-expediente **como observación propia del prestador, no como aporte de Camila**. Camila no figura en el sistema como aportadora.

Cómo opera:
- El prestador documenta: *"Observación durante entrega: Zeus presenta miedo a aspiradora según información familiar."*
- En el registro, queda como observación del prestador. Camila no aparece atribuida.
- Si la observación se considera importante, el prestador puede sugerir a la madre vía canal interno: *"Camila me comentó hoy que Zeus le tiene miedo a la aspiradora. ¿Querés sumarlo al perfil de Zeus desde tu app?"* — devolviendo la decisión a la adulta.

Esto preserva:
- **Protección del menor.** Camila no se vuelve fuente de información formal del bio-expediente, lo que protege su exposición.
- **Información útil para el cuidado.** La observación llega al bio-expediente, ya sea vía prestador (como observación propia) o vía co-dueño adulto (como aporte familiar).
- **Decisión de la familia humana sobre datos del menor.** La madre decide si el aporte de su hija se formaliza en el sistema o no.

### 10.7 Servicios rutinarios vs no rutinarios — decisión cerrada S20

**Decisión cerrada S20** sobre qué puede gestionar un menor autorizado:

**Servicios rutinarios — menor autorizado puede entregar/retirar sin obstáculo:**
- Baño y corte estándar.
- Paseo regular agendado.
- Control de rutina sin hallazgos.
- Sesión de adiestramiento programada.
- Recogida de mascota tras estadía corta planificada.

**Servicios no rutinarios — requieren autorización de co-dueño adulto:**
- **Vacunación con producto compuesto:** el menor puede entregar y retirar, pero la confirmación de aplicación de vacuna específica (decisión clínica) requiere autorización de co-dueño adulto por canal interno antes de proceder.
- **Procedimientos clínicos no rutinarios:** cirugía menor, exámenes con anestesia, procedimientos invasivos. Requieren autorización de co-dueño adulto siempre, independientemente de quién entrega.
- **Certificación oficial** (Familia G cuando se construya): requiere presencia y firma de co-dueño adulto. El menor no puede ser único contacto en certificados con valor legal.
- **Cambios significativos al servicio agendado:** servicio distinto al pedido, cambio de precio importante, ampliación de alcance.

El principio: **el menor autorizado opera lo que ya está acordado y es rutinario. Cualquier decisión nueva, mayor o de impacto significativo va con adulto.**

### 10.8 Urgencias con menor presente — decisión cerrada S20

Caso difícil: Camila trae a Zeus para baño y el groomer detecta una lesión cutánea preocupante que necesita derivación a vet urgente.

**Decisión cerrada S20:**

- El groomer **no actúa por su cuenta más allá del servicio acordado**.
- Contacta a la madre por canal interno con alta prioridad.
- Informa a Camila con tranquilidad y sin alarmar: *"Camila, voy a hablar con tu mamá un momento. Zeus está bien, solo necesito consultarle algo."*
- La madre decide qué hacer (autorizar derivación, venir ella misma, indicar postponer).
- Si la madre no responde en tiempo razonable, el groomer escala al equipo de e-PetPlace (sección 3.8) para mediación o asistencia.

**Botón de urgencia en la app del cliente — decisión cerrada S20:**

Para casos verdaderamente urgentes (situación que requiere decisión inmediata por salud de la mascota), la app del cliente tiene un **botón de urgencia** que activa contacto rápido entre prestador y co-dueño adulto. El portal del prestador puede iniciar este flow desde su lado cuando detecta urgencia.

Este botón es **decisión arquitectónica de UX que cruza app del cliente y portal del prestador**. Genera deuda documental:

- Para `APP_CLIENTE.md` (cuando se redacte): describir el botón de urgencia desde la perspectiva del cliente, su activación, su tono, sus tiempos de respuesta esperados.
- Para `PORTAL_PRESTADOR.md`: completar este punto en sesión técnica futura con el flow operativo desde el lado del prestador (cómo se inicia, qué notificaciones genera, qué timeouts tiene, qué pasa si nadie responde).

Nota explícita para próxima sesión de diseño: **manejar bien este botón en app y portal**. Es crítico para casos reales donde la salud de la mascota depende de comunicación rápida.

### 10.9 Detección de descuido o maltrato — decisión cerrada S20

Caso sensible: Camila le comenta al paseador algo que sugiere que la mascota no está siendo cuidada adecuadamente en la casa. O el prestador detecta señales físicas de descuido (peso anormal, lesiones recurrentes sin explicación, comportamiento de miedo extremo).

**Decisión cerrada S20** — modelo "documenta y escala, no investigues":

**Lo que el prestador hace:**

- **Documenta observaciones físicas en el bio-expediente.** Lesiones, peso, estado general, comportamiento observado. Esto es trabajo profesional, no acusación.
- **Si detecta patrón preocupante recurrente, comunica al equipo de e-PetPlace** (sección 3.8). El equipo media con la familia humana adulta.
- **No interroga al menor.** Si Camila comentó algo, el prestador no la presiona ni le pide detalles. La protección del menor incluye no convertirlo en fuente de información formal.
- **No actúa por su cuenta más allá de documentar y escalar.** No habla con vecinos, no llama a autoridades, no confronta a la familia. Esos son canales legales fuera del portal.

**Lo que el equipo de e-PetPlace hace:**

- Recibe la alerta del prestador.
- Evalúa la información con el contexto del bio-expediente histórico.
- Decide cómo proceder: conversación con la familia, derivación a profesional especializado, escalado a autoridades si corresponde.
- **El equipo es el que tiene rol formal en estos casos**, no el prestador.

**Lo que el portal hace:**

- Provee un canal claro para escalar (parte del canal con el equipo, sección 6.6.7).
- Documenta la observación con trazabilidad — fecha, prestador, observación, contexto.
- No genera alarmas automáticas en función de algoritmos. La decisión es humana siempre.

**El principio:** el prestador profesional tiene rol de documentar lo que ve. El equipo de e-PetPlace tiene rol de evaluar y actuar. El menor nunca tiene rol de denunciar — sería ponerlo en posición vulnerable. La protección de la mascota se ejecuta sin exponer al menor.

**Diagnóstico inicial:** **CN**. Flow de detección, documentación y escalado al equipo es construcción nueva. Requiere protocolo claro del equipo para responder estos casos antes de operativizar.

### 10.10 Resumen del bloque

La presencia de menores en la operación del portal se trata con cinco principios:

- **14 años como umbral operativo.** Menores de 14 ven la mascota en la app pero no solicitan servicios. De 14 a 17 son familiares autorizados con permisos diferenciados.
- **Servicios rutinarios para menores autorizados; decisiones mayores para adultos.** El menor opera lo agendado y rutinario. Lo que es decisional, clínico no rutinario o legal va con adulto.
- **No fotos de menores en ningún lado.** Decisión 9.4 aplicada con énfasis especial.
- **Menores no son fuente formal de información del bio-expediente.** Los aportes que un menor da al prestador se procesan vía observación del prestador o se devuelven a la familia adulta. La decisión de formalizar el aporte queda con co-dueño adulto.
- **Detección de descuido se escala al equipo, no se investiga.** El prestador documenta y escala. El equipo evalúa y actúa. El menor nunca tiene rol de denunciar.

**Decisiones del bloque que generan deuda documental:**

- *"Edad mínima 14 años para solicitar servicios"* va a `POLITICAS_EPETPLACE.md` como enriquecimiento de P5.
- *"Botón de urgencia"* requiere desarrollo coordinado entre `APP_CLIENTE.md` y `PORTAL_PRESTADOR.md` en sesión técnica futura.
- *"Modelo de detección y escalado al equipo"* requiere protocolo operativo del equipo antes de operativizar.

**Diagnóstico inicial del bloque:** **CN**. La gestión de menores y familiares autorizados con permisos diferenciados, restricciones operativas calibradas, manejo de aportes con protección del menor, y flow de detección de descuido no existe en el portal hoy. Modelo técnico de tablas está implementado; la coreografía operativa y la UI son trabajo nuevo.

---

## 11. Conexión con el ecosistema (Capa 3)

### 11.1 La pregunta raíz

Hasta acá el documento describió al prestador operando dentro de su universo de mascotas: las que atiende, las familias humanas de esas mascotas, los momentos narrativos de su trabajo. Esta sección sale del universo individual y describe cómo el portal del prestador conecta con el ecosistema más amplio — Capa 3 de `MODELO_PRODUCTO.md`.

La pregunta raíz: ¿qué del ecosistema más allá de las mascotas del propio prestador es visible en su portal, y por qué?

### 11.2 Declaración honesta — Capa 3 es mayoritariamente futuro

**Esta sección describe el frame conceptual, no promesas inmediatas.**

En F1 con 15 prestadores fundadores en Quito, no hay ecosistema comunitario significativo todavía. La sección debe evitar dos riesgos opuestos: describir features que no van a existir en años (promesas vacías) y dejar el frame anémico (sin claridad de dirección).

El enfoque elegido: **describir el frame conceptual de Capa 3** desde la perspectiva del portal del prestador, explicitar qué se hace en F1 (poco), qué se libera por fase, y qué principios invariantes guían toda la evolución. La descripción de cada elemento futuro es **muy superficial** — solo para no olvidar la dirección. El detalle se redacta cuando cada elemento tenga disparo real.

### 11.3 Lo invocado, no redefinido

- **Las 3 capas** de `MODELO_PRODUCTO.md`: identidad (Capa 1), cuidado (Capa 2), comunidad (Capa 3). Esta sección es sobre Capa 3.
- **Decisión 4.6** — visibilidad de otros prestadores del ecosistema no se libera al Día 90 (ver sección 4.6 para decisión completa).
- **Política P10** — mascota perdida y alerta comunitaria con ciclo de vida propio.
- **Política P11** — recomendaciones clínicas no son sponsoreadas.
- **Capa 3 en su totalidad** está definida como momento posterior a F1 (sistema futuro según `POLITICAS_EPETPLACE.md` y `MODELO_PRODUCTO.md`).

### 11.4 Matriz de liberación por fase

La conexión del portal del prestador con Capa 3 se libera por etapas:

| Elemento | F1 | F2 | F3+ |
|---|---|---|---|
| Vibrato del ecosistema (números agregados sin identificar prestadores) | Sí, discreto | Sí, más rico | Sí |
| Comunicaciones del founder a comunidad de prestadores | Sí (canal interno con fundadores) | Sí (escalado al equipo) | Sí (institucional) |
| Alertas comunitarias de mascotas perdidas | No (sistema futuro) | Sí, básico | Sí, completo |
| Red de prestadores visible | No (decisión 4.6: disparo 3 ciudades) | Sí, ciudad propia | Sí, multi-ciudad |
| Eventos del ecosistema | No estructurado (encuentros íntimos del Momento Fundacional) | Sí, primeros eventos | Sí, sistematizados |
| Comunidad de prestadores (chat o foro) | No | Posible piloto | Sí, sistematizada |
| DaaS / insights agregados | No | No | Sí (con consentimiento) |

Esta matriz orienta planificación. Cada elemento tiene su propio hito de disparo y no se construye antes de que sea pertinente.

### 11.5 Lo que sí existe en F1 — el frame mínimo

#### 11.5.1 Vibrato del ecosistema (presente desde Día 1)

Decisión cerrada y materializada en secciones 2.5 y 3.7. El prestador ve, desde el Día 1, números agregados del ecosistema sin identificar prestadores específicos. En F1 los números son chicos y se muestran sobrios, sin maquillar.

Ejemplos:

- *"Sos uno de los 15 prestadores fundadores de e-PetPlace Ecuador."*
- *"Este mes el ecosistema sumó 47 atenciones registradas y 12 mascotas con bio-expediente activo."*

El vibrato cumple dos funciones: comunicar pertenencia (el prestador no opera solo) y honrar la fase del proyecto (los números son verdad). Esto sostiene la sensación de "estamos calentando motores juntos" del Día 30.

#### 11.5.2 Comunicaciones del founder a la comunidad de prestadores

Decisión cerrada en sección 3.8. Durante el Momento Fundacional, comunicación quincenal del founder a los primeros 10 prestadores fundadores. Tono humano, no email transaccional. Contenido: qué se construyó, qué se aprendió, qué viene, qué pensamos del feedback recibido.

Esta es la única manifestación operativa real de Capa 3 en F1. **Es comunicación uno-a-pocos**, no comunidad sistematizada. Cada fundador recibe la comunicación de manera personal, no como newsletter masivo.

En Momento Pionero la voz se transforma a voz híbrida (decisión 4.7) y el alcance crece. En Momento Establecido la comunicación se institucionaliza pero mantiene tono humano.

### 11.6 Lo que se libera con el disparo de 3 ciudades — el principio invariante

Cuando e-PetPlace opere en al menos tres ciudades, se libera la visibilidad de otros prestadores del ecosistema (decisión 4.6). El principio que guía esa liberación es decisión cerrada S20 y vale anclarlo formalmente acá:

**Decisión cerrada S20:** la red de prestadores se materializa como **mapa de pertenencia, no como directorio comparativo**.

El prestador ve quiénes son sus colegas del ecosistema sin que aparezcan rankings, métricas comparativas, ni "mejor prestador". Es como el mapa de un coworking: ves quién está en tu espacio, podés iniciar conversación, pero no hay competencia visible.

Específicamente cuando este elemento se libere:

- Otros prestadores aparecen con nombre, tipo de servicio, ciudad.
- No aparecen calificaciones promedio comparables entre prestadores.
- No hay leaderboard de ningún tipo.
- No hay sugerencia algorítmica de "mira cuántas mascotas atendió este otro prestador".
- Hay acceso al canal interno entre prestadores del ecosistema (feature mencionada en sección 7.4.1 y 8.7 — CN por construir cuando llegue el disparo).
- El distintivo "Fundador" (sección 4.9) sigue visible para los que lo tienen — distinción honrada que no implica jerarquía operativa.

Este principio protege el alma del producto durante el crecimiento. Es lo que distingue a e-PetPlace de un Yelp interno y de un LinkedIn de prestadores.

### 11.7 Frame futuro de los otros elementos — descripción muy superficial

**Alertas comunitarias de mascotas perdidas (F2+).**

Política P10 ya cerrada. Cuando se libere, el prestador recibe alerta solo si la mascota perdida pasó por su zona geográfica — no notificación masiva (sería ruido). Si la mascota es una que el prestador atendió, alerta de mayor relevancia (momento narrativo 7.5.1). Si la mascota es ajena, alerta informativa con acción opcional de amplificar visibilidad. El prestador puede activar/desactivar recepción desde Sección D notificaciones.

**Eventos del ecosistema (F2+).**

Jornadas de adopción con refugios, capacitaciones técnicas, encuentros entre prestadores, presentaciones del founder. Cuando empiecen a existir formalmente, aparecen en una sección del portal con información clara y opción de inscripción. En Momento Fundacional los eventos son íntimos (15 fundadores + founder en encuentro presencial). En Momentos posteriores crecen en escala manteniendo curaduría. **Si no hay evento real, no hay sección activa** — evita parecer ad spam.

**Comunidad de prestadores como chat o foro (F2+ posible piloto).**

Decisión de modelo abierta. Una comunidad de prestadores puede materializarse como chat estructurado por especialidad, foro de discusión, o canal asincrónico. La forma se decide cuando haya masa real (no es F1). Riesgo a evitar: que se convierta en grupo de WhatsApp interno donde se discuten cosas sin moderación. Si se libera, requiere principios claros y posiblemente moderación del equipo.

**DaaS e insights agregados (F3+).**

Capa 3 superior. Cuando exista, el prestador puede acceder a insights agregados del ecosistema (tendencias de salud por especie, patrones epidemiológicos zonales, etc.). El prestador puede optar por contribuir data anonimizada al pool agregado con consentimiento — no es obligatorio. **Política P11 invariante:** no hay sponsored content en recomendaciones clínicas. Sin compromiso de identidad de prestadores específicos en outputs agregados.

### 11.8 Principios invariantes que guían toda la evolución de Capa 3

Independientemente de cuándo se libere cada elemento, cuatro principios invariantes guían la construcción de Capa 3 desde la perspectiva del portal del prestador:

- **Curaduría sostenida.** Capa 3 en e-PetPlace no es "abierto a todos". El ecosistema sigue siendo curado en F2, F3 y F4 igual que en F1. Crecer no significa diluir.
- **Mapa de pertenencia, no directorio comparativo.** Donde sea que se materialice la red de prestadores, no hay rankings ni comparaciones. Los prestadores son colegas, no competidores rankeados.
- **Curva de revelación gradual.** Los elementos no se liberan todos a la vez. Cada uno aparece cuando tiene contenido digno y disparo real. La revelación progresiva (sección 2.6, 3.6, 4.6) sigue siendo válida.
- **Honestidad sobre la fase.** Si el ecosistema en F1 es chico, se muestra chico con dignidad. Si crece, crece sin maquillaje. La verdad del momento es comunicación correcta. Luxury no infla números — los honra.

### 11.9 Resumen del bloque

La conexión del portal del prestador con Capa 3 (ecosistema comunitario) es **mayoritariamente futura**. En F1 vive solo en dos elementos: el vibrato del ecosistema y las comunicaciones del founder a la comunidad de fundadores.

El resto se libera por fases:

- F2 trae alertas comunitarias, primeros eventos estructurados, red de prestadores cuando se llegue al disparo de 3 ciudades, posiblemente piloto de comunidad.
- F3+ trae DaaS e insights agregados con consentimiento, eventos sistematizados, comunidad madura.

**Principio invariante central:** la red de prestadores, cuando se materialice, sigue el principio cerrado en sección 11.6 (mapa de pertenencia). Es protección activa del alma durante el crecimiento.

**Diagnóstico inicial del bloque:** mayoritariamente **CN diferida**. Lo que existe en F1 (vibrato + comunicación del founder a fundadores) ya está cubierto en secciones 2.5, 3.7 y 3.8 — esta sección lo agrega como frame de Capa 3, no como decisiones nuevas. El resto se construye con disparo definido en la matriz 11.4. Cada elemento futuro tendrá su propia sesión de profundización cuando llegue su momento.

---

## 12. Diferenciación por fases F1 → F4

### 12.1 La pregunta raíz

Si un prestador abre el portal en F1 (Quito, 15 fundadores, soft launch) vs F2 (Ecuador + Colombia + México, 500-3000 prestadores) vs F3 (multi-ciudad por país, 10K+ prestadores) vs F4 (consolidación regional plena), ¿qué es distinto?

Esta sección consolida la vista temporal del portal a lo largo de las fases del proyecto. Es **bloque integrador**: toma lo que está disperso por las secciones anteriores y arma la película completa de la evolución.

### 12.2 Naturaleza consolidativa del bloque

A diferencia de las secciones anteriores que abren decisiones nuevas, este bloque es principalmente **consolidativo**. Mucho del trabajo está ya hecho:

- Sección 1.2 definió los tres momentos del prestador (Fundacional, Pionero, Establecido) que se alinean con las fases del proyecto.
- Sección 11.4 dio matriz de liberación por fase para Capa 3.
- Múltiples secciones marcaron a lo largo del documento qué es F1 vs F2+ vs F3+.

Lo que esta sección aporta de nuevo: **vista consolidada con principios estructurales sobre la evolución**, no decisiones nuevas grandes. Si en el proceso aparece una decisión que vale cerrar, se cierra — pero el espíritu del bloque es servicio al lector que quiere entender la trayectoria del producto.

### 12.3 Definición de las fases — frame de planificación

Las cuatro fases del proyecto, con su rol y umbrales aproximados:

**F1 — Soft launch + arranque Ecuador.** 0 a ~500 prestadores. Quito + posibles otras ciudades del país. Validación del modelo. El portal se construye con foco en familias A, B, D, E, C, F (en ese orden, decisión 5.3). Coincide con el Momento Fundacional del prestador (primeros ~15 con placa de vidrio + comunicación quincenal del founder).

**F2 — Expansión nacional + apertura LatAm.** ~500 a ~3000 prestadores. Ecuador maduro + arranque Colombia + México. El disparo de 3 ciudades se cumple durante esta fase (decisión 4.6) y se libera la visibilidad de otros prestadores como mapa de pertenencia (decisión 11.6). Coincide con el Momento Pionero. La voz del founder se transforma a híbrida (decisión 4.7).

**F3 — Consolidación multi-país.** ~3000 a ~10000 prestadores. Tres países operativos. DaaS empieza con consentimiento (matriz 11.4). Comunidad de prestadores sistematizada. Coincide con el inicio del Momento Establecido.

**F4 — Madurez regional.** 10000+ prestadores. Expansión a más países LatAm. Producto consolidado. Posible apertura de productos verticales (e-PetPlace Equine — política P12). Momento Establecido pleno con marca consolidada.

**Sobre los umbrales:** son orientativos, no rígidos. La transición entre fases se evalúa por **cumplimiento de criterios cualitativos** (estabilidad operativa, marco regulatorio claro, masa de prestadores curados), no por cruzar un número de prestadores. Una fase puede extenderse más de lo previsto sin que esto sea fracaso — al contrario, forzar la transición antes de tiempo rompe la curaduría.

### 12.4 Qué cambia radicalmente entre fases (cambios estructurales)

Algunos elementos del portal cambian su naturaleza al pasar de fase, no solo crecen en escala. Los listamos con referencia a las secciones donde se decidió originalmente:

**Voz del founder.** Personal en F1 (firma directa de Guillermo) → híbrida en F2 (firma personal en momentos significativos, voz del equipo en cotidiano) → institucional en F3+ (tono humano sostenido pero alejado del founder individual). Decisión cerrada en sección 4.7.

**Pieza física en el día 1.** Placa de vidrio para los primeros ~15 fundadores en F1 → evaluación caso por caso según capital y resultados en F2 → opcional sin promesa permanente en F3+. Decisión cerrada en sección 1.2.

**Check-in humano del Día 90.** Conversación personal o presencial con founder o equipo en F1 → conversación con equipo dedicado en F2 → eventualmente formato escrito guiado con seguimiento humano en F3+. Decisión cerrada en sección 4.8.

**Comunidad de prestadores.** No existe en F1 → posible piloto en F2 → sistematizada en F3+ con principios claros (matriz 11.4). El portal libra el espacio según masa real.

**DaaS e insights agregados.** No existe en F1-F2 → aparece en F3+ con consentimiento (matriz 11.4). Cambio estructural: el portal pasa de operar solo en Capa 1 + Capa 2 a tener un componente activo de Capa 3 agregada.

**Página pública del prestador (sección 4.5).** Existe desde Día 90 en F1 con perfil básico → en F2 trae integración SEO local más fuerte y multi-ciudad → en F3+ multi-idioma y multi-país cuando aplica. La estructura del activo permanece; la profundidad operativa crece.

**Visibilidad de otros prestadores del ecosistema.** No visible en F1 → liberada en F2 → red expandida con criterios curados en F3+. Decisión cerrada en sección 11.6.

### 12.5 Qué se mantiene invariante (alma del producto)

Algunos elementos del portal **no cambian con las fases**. Son el alma del producto, no su capa de presentación. Cambian de escala pero no de naturaleza.

**Modelo conceptual del bio-expediente.** Las 5 dimensiones de identidad personal, los 7 momentos vitales, las familias de servicios, la vista parcial por servicio del prestador. Esto es invariante de F1 a F4. Crece en cobertura (más mascotas, más prestadores, más eventos) pero no cambia en estructura.

**Principio luxury.** Las cuatro propiedades operativas de luxury (curaduría visible, coreografía intencional, materialidad cuando importa, sobriedad sin frialdad — sección 1.3) son invariantes. Lo que cambia son las manifestaciones concretas de cada propiedad, no la propiedad misma.

**Aspiracional como invariante.** Ser prestador de e-PetPlace es alago, no favor, en F1 igual que en F4 (decisión 1.4). La fuente del aspiracional cambia (en F1 viene del propósito del proyecto, en F4 viene de la fuerza acumulada de la marca) pero el principio no se diluye.

**Curaduría sostenida.** El ecosistema sigue siendo curado en F4 igual que en F1. Crecer no significa diluir. Esto es lo que distingue a e-PetPlace de plataformas que abren grifo y rotan masa.

**Política P5 sobre menores.** Edad mínima 14 años para solicitar servicios, protección de aportes de menores, manejo calibrado de menores autorizados. Invariante por principio ético.

**No rogamos permanencia.** Decisión 3.11 con sus tres matices integrados. Invariante a lo largo de todas las fases.

**No fotos de familia humana en la plataforma.** Decisión 9.4. Invariante. Aplica también a Portal Sellers, Portal Refugios, Portal Admin, App Cliente.

**Comunicación prestador-familia mediada por plataforma.** Decisión 6.4.7. Invariante. La fricción de adopción es real en F1; el principio se sostiene a través de las fases hasta que se vuelve estándar percibido.

**Reputación honrada, no jerarquizada.** No rankings, no "mejor prestador", no leaderboards. Decisión 2.7. Invariante.

**Mapa de pertenencia, no directorio comparativo.** Decisión 11.6. Invariante para cuando se libere la red de prestadores.

**Membresía revocable por inactividad demostrable.** Decisión 3.10. Invariante con proceso humano siempre — nunca automatizado.

**Graduación al Día 90 con criterios mínimos no agresivos.** Decisión 4.2. Aplica a fundadores y a todos los prestadores que entren en cualquier fase.

**Insignia "Fundador" permanente.** Quienes la ganaron en F1 la conservan en F2, F3, F4. Es trazabilidad de honor, no privilegio funcional. Sección 4.9.

### 12.6 Multi-país y soporte de expansión — anclaje de principio

**Decisión cerrada S20** sobre la dimensión multi-país del portal:

**El portal del prestador debe soportar las cinco familias de servicios activas (más Familia G cuando se construya) en cada país donde e-PetPlace opera.** Y debe soportar las características adicionales que la expansión multi-país requiere.

Sin entrar al detalle técnico (sesión propia cuando aplique), las características incluyen:

- **Multi-idioma** según país. F1 es ES-EC. F2 trae variantes regionales del español (ES-CO, ES-MX). Fases posteriores pueden requerir otros idiomas según expansión.
- **Multi-moneda.** F1 USD (Ecuador). F2 COP + MXN. Implicancia para módulo de liquidaciones y motor de catálogo.
- **Multi-regulación.** Cada país tiene marco regulatorio propio para servicios veterinarios, certificaciones (Familia G en cada país), datos personales (equivalentes locales de GDPR), facturación. F2+ implica versionado de políticas por país.
- **Soporte horario adaptado.** F1 con founder + 1 persona puede atender 9-18 hora local. F3+ con masa requiere soporte extendido coordinado entre países.

**Estas características no se cierran como decisiones técnicas detalladas en este bloque** — son demasiado grandes y merecen sesiones propias cuando llegue su disparo. Lo que sí se cierra es el principio: el portal está diseñado conceptualmente para soportar la expansión, y cada fase agrega su capa de complejidad sin romper lo construido.

**Deuda documental:** las decisiones técnicas concretas sobre multi-idioma, multi-moneda y multi-regulación viven en `EPETPLACE.md` (modelo de expansión) y eventualmente en documentos específicos por país. Este bloque solo anota que el portal del prestador las soporta cuando llegan.

### 12.7 Cómo se ve el portal en cada fase — vista consolidada

Para el lector que quiere entender en una imagen cómo se siente el portal en cada fase, esta vista consolidada toma las decisiones dispersas y las integra:

**F1 — Soft launch + arranque Ecuador.**

El prestador abre el portal y entra a un espacio íntimo. La placa de vidrio que llegó por correo descansa en su consultorio. La bienvenida lleva firma personal de Guillermo. Zeus es la mascota demo. Las cards del home se componen según los servicios habilitados (foco en Familia A, B, D, E para los primeros prestadores). El vibrato del ecosistema muestra "sos uno de los 15 fundadores". La comunicación quincenal del founder llega con tono humano. El canal directo con el equipo está visible y accesible. No hay red de prestadores visible. No hay alertas comunitarias todavía. Día 90 trae la graduación, la insignia, la página pública. Sensación general: estamos calentando motores juntos. Selecto y aspiracional.

**F2 — Expansión nacional + apertura LatAm.**

El prestador entra al portal y nota que el ecosistema creció. La voz del founder pasa a híbrida (Guillermo firma momentos significativos; el día a día va con voz del equipo). La red de prestadores se libera como mapa de pertenencia cuando se cumple disparo de 3 ciudades. Las alertas comunitarias de mascotas perdidas aparecen en su zona. Empiezan primeros eventos del ecosistema. La pieza física para nuevos fundadores se evalúa caso por caso. El motor multi-país opera transparentemente para prestadores en Ecuador, Colombia, México. Sensación general: el ecosistema se hizo real. La curaduría sigue.

**F3 — Consolidación multi-país.**

El prestador entra al portal y opera en un ecosistema maduro. La voz del founder es institucional con calor humano. La comunidad de prestadores está sistematizada con principios claros. DaaS e insights agregados con consentimiento permiten que un vet ve patrones epidemiológicos de su zona. Los eventos del ecosistema son sistematizados. La página pública del prestador opera con SEO local optimizado. La insignia "Fundador 2026" sigue visible y diferenciada para quienes la ganaron. Sensación general: e-PetPlace es ecosistema reconocido. Ser parte sigue siendo aspiracional por la fuerza acumulada de la marca.

**F4 — Madurez regional.**

El prestador entra al portal y la mecánica del ecosistema es percibida como natural — "así se hace cuidado profesional de mascotas en LatAm". La marca tiene fuerza propia. Productos verticales pueden empezar a aparecer (e-PetPlace Equine si política P12 evoluciona). La masa permite escala pero la curaduría sigue protegiendo el alma. Los fundadores con su placa de vidrio en su consultorio son referencia histórica del proyecto. Sensación general: producto consolidado regional. El día 1 del prestador F1 hoy es leyenda fundacional.

### 12.8 Principios estructurales de la evolución

Cuatro principios atraviesan toda la evolución de F1 a F4 y orientan decisiones futuras:

**Evolución por capas, no por reemplazo.** Cada fase agrega capa de funcionalidad sin romper lo construido. Un prestador que se graduó en F1 sigue siendo prestador graduado en F4. Su trabajo y su trayectoria son acumulativos.

**Curva de revelación gradual disciplinada.** Los elementos se liberan cuando tienen contenido digno y disparo real, no por cumplir cronograma. La revelación progresiva (secciones 2.6, 3.6, 4.6, 11.4) se aplica a toda la evolución del producto.

**Alma invariante, manifestaciones adaptativas.** Los principios del alma del producto (luxury, curaduría, aspiracional, transparencia, sobriedad) son invariantes. Las manifestaciones concretas se adaptan al momento. La pieza física es manifestación de luxury en F1; en F4 luxury se manifiesta en otra forma sin perder el principio.

**Cada fase tiene su propia sesión de profundización.** Este documento es frame general. F2, F3 y F4 merecen sus propias sesiones de discusión cuando se acerquen sus hitos de transición. Forzar el detalle de F3 hoy desde F1 es ejercicio especulativo de bajo valor. Los principios anclados en este documento dan orientación; el detalle viene cuando llega su momento.

### 12.9 Resumen del bloque

La evolución del portal de F1 a F4 se entiende mejor distinguiendo lo que cambia radicalmente, lo que solo crece, y lo invariante.

**Cambios radicales por fase:** voz del founder, pieza física, check-in del Día 90, comunidad de prestadores, DaaS, página pública en complejidad, visibilidad de otros prestadores.

**Solo crecen sin cambiar estructura:** modelo conceptual del bio-expediente, cobertura geográfica, número de servicios y prestadores activos.

**Invariantes (alma del producto):** principio luxury, aspiracional, curaduría sostenida, política P5 sobre menores, "no rogamos permanencia", "no fotos de familia humana", comunicación mediada por plataforma, reputación honrada no jerarquizada, mapa de pertenencia no directorio comparativo, membresía revocable por proceso humano, graduación con criterios mínimos no agresivos, insignia Fundador permanente.

**Multi-país como principio:** el portal soporta la expansión sin que cada fase requiera reconstrucción. Multi-idioma, multi-moneda, multi-regulación, soporte horario adaptado — se desarrollan en sesiones propias por país y por fase, no en este documento.

**Cuatro principios estructurales de la evolución:** evolución por capas no por reemplazo, curva de revelación gradual disciplinada, alma invariante con manifestaciones adaptativas, cada fase con su propia sesión de profundización.

**Diagnóstico inicial del bloque:** **consolidativo**. No genera implementación técnica directa. Sirve como mapa para que próximas sesiones de planificación de fases tengan el frame anclado. Sus principios son referencia obligatoria cuando se discutan transiciones reales entre fases.

---

## 13. Cierre del documento

### 13.1 Qué es este documento y qué no es

`PORTAL_PRESTADOR.md` es **el documento de visión narrativa del portal del prestador de e-PetPlace**. Es el frame conceptual que guía construcción, diseño, decisiones de producto, y conversaciones futuras sobre el portal.

**Lo que es:**

- Documento de alma del portal. Define cómo se siente, qué transmite, qué principios lo guían.
- Frame vinculante para construcción de UI. Cualquier propuesta de pantalla, flow o interacción se contrasta con este documento antes de implementarse.
- Mapa temporal del portal. Cómo evoluciona en momentos (Día 1, Día 30, Día 90, aniversario) y en fases (F1→F4).
- Repositorio de decisiones de modelo cerradas en S20. El apéndice final lista las decisiones formalmente; las secciones las desarrollan.
- Documento maestro hermano de `MODELO_PRODUCTO.md`, `BIO_EXPEDIENTE.md`, `EPETPLACE.md` y `POLITICAS_EPETPLACE.md`. Comparte el mismo registro y la misma autoridad sobre su dominio.

**Lo que no es:**

- No es documento de wireframes ni de pixeles. Las decisiones visuales detalladas viven en trabajo de diseño posterior. Este documento da los principios; el diseño materializa.
- No es documento técnico de implementación. Los diagnósticos CN/RC/CT señalan qué pieza necesita qué tipo de trabajo, pero el plan técnico detallado vive en sesiones dedicadas de auditoría del repo y planificación.
- No es documento de los otros portales. Portal Sellers, Portal Refugios, Portal Admin y App Cliente tienen sus propios documentos hermanos por redactar cuando tengan disparo operativo real (Portales Hermanos en la sección de inicio).
- No es documento cerrado para siempre. La visión del portal puede evolucionar. Cuando aparezca contradicción entre lo escrito acá y lo aprendido en operación real, se reabre el documento en sesión propia. La Disposición a Reconstruir aplica también al frame.

### 13.2 Los principios invariantes que atraviesan todo el documento

Si todo lo demás se olvida, estos principios sostienen el portal del prestador a través de las secciones, los momentos, las fases:

**Luxury operativo.** Curaduría visible, coreografía intencional, materialidad cuando importa, sobriedad sin frialdad. No es lujo superficial — es experiencia cuidada al detalle al alcance de los elegidos por su pasión por las mascotas.

**Aspiracional como invariante.** Ser prestador de e-PetPlace es alago, no favor. Esto sostiene la selectividad, la curaduría sostenida, la membresía revocable, y la negativa a rogar permanencia. En F1 viene del propósito; en F4 viene de la fuerza acumulada de la marca. Nunca se diluye.

**La mascota es el centro narrativo.** No hay fotos de familia humana en la plataforma. El portal trata a la mascota como ser completo, no como ficha clínica. Las 5 dimensiones de identidad personal, los 7 momentos vitales, el bio-expediente vivo son materialización concreta del centro narrativo.

**El prestador construye historia, no decide estado.** Cualquier cambio real sobre la mascota se hace desde la app del cliente. El prestador aporta al bio-expediente compartido. No es ejecutor de decisiones estructurales; es contribuidor de la historia de vida.

**Curaduría sostenida sin diluir con el crecimiento.** Crecer no significa abrir el grifo. F4 mantiene la curaduría de F1. Esto es lo que distingue a e-PetPlace de plataformas que rotan masa.

**Reputación honrada, no jerarquizada.** Sin rankings, sin "mejor prestador", sin leaderboards. Los reconocimientos son por trayectoria personal o por dimensión complementaria — nunca por comparación.

**Mapa de pertenencia, no directorio comparativo.** Cuando se libere la visibilidad de otros prestadores, será como mapa de coworking — colegas en el espacio, sin competencia visible.

**Comunicación mediada por plataforma.** Toda comunicación prestador-familia pasa por canal interno. Privacidad real, trazabilidad para disputas, captura selectiva al bio-expediente, defensibilidad del modelo.

**Revelación progresiva paciente.** Los módulos aparecen cuando tienen contenido digno. El portal vacío es portal en preparación, no portal fracasado. Aplica a Día 1, a fases del proyecto, a Capa 3.

**Sobriedad con presencia ante momentos sensibles.** Cada queja, conflicto, pérdida es oportunidad de demostrar que la mascota le importa al ecosistema. Ni frialdad sistémica ni performatividad sentimental.

**Protección de menores invariante.** Edad mínima 14 años para solicitar servicios. Menores autorizados con permisos diferenciados. Aportes de menores procesados como observación del prestador. Detección de descuido escalada al equipo, nunca con el menor como denunciante.

**Decisiones humanas en momentos críticos.** El portal aporta información. Los humanos toman decisiones. El equipo de e-PetPlace media en patrones detectados, conflictos serios, salidas del ecosistema. El portal no sentencia.

**No rogamos permanencia, pero aprendemos de las salidas.** Cuando un prestador serio decide irse, conversación honesta de cierre con carta de despedida digna. La pertenencia tuvo valor. La curva sigue abierta para volver.

**Honestidad sobre la fase del proyecto.** Si el ecosistema es chico, se muestra chico con dignidad. Luxury no infla números — los honra. La verdad del momento es comunicación correcta.

### 13.3 Cómo se usa este documento en la práctica

Para construir cualquier pantalla del portal del prestador:

1. Leer este documento completo si no fue leído antes. La primera lectura toma tiempo; cada lectura posterior es más rápida.
2. Identificar qué secciones aplican a la pantalla a construir (Sección 6 da el mapa por secciones macro del portal; Sección 8 da el detalle de mascota; etc.).
3. Verificar si la pantalla está en `MODELO_PRODUCTO.md` o `BIO_EXPEDIENTE.md` para el modelo conceptual y técnico subyacente.
4. Diseñar/implementar consultando este frame cuando aparezcan dudas de tono, jerarquía, contenido o decisión de modelo.
5. Si la pantalla contradice algo del frame, parar y discutir. La Disposición a Reconstruir aplica también al documento: la realidad puede pedir actualizar el frame, pero esa actualización es decisión consciente, no parche silencioso.

Para conversaciones de producto o decisiones de modelo:

1. Antes de proponer feature nueva o cambio significativo, verificar que el documento no haya cerrado ya la decisión. El apéndice de decisiones es la referencia rápida.
2. Si la feature propuesta contradice un principio invariante (sección 13.2), discutir el principio mismo antes de la feature. No se mueven principios sin conversación profunda.
3. Si la feature está en zona no cubierta por el documento, se cubre acá antes de implementarse — el frame se mantiene completo.

Para sesiones futuras con Claude:

1. Este documento es lectura previa obligatoria cuando se trabajen secciones del portal del prestador.
2. Cuando se redacten documentos hermanos (Portal Sellers, Portal Refugios, Portal Admin, App Cliente), este documento sirve como modelo de estructura y tono.
3. Las decisiones de S20 listadas en el apéndice tienen autoridad. No se reabren sin justificación explícita en sesión propia.

### 13.4 Lo que viene después

Este documento es punto de partida para varios trabajos:

**Inmediato (S21+):**

- **Auditoría técnica del repo `e-petplace-prestadores` contra este frame.** Sesión dedicada para identificar qué pieza es CN, RC, CT y armar plan de reconstrucción ordenado por prioridad.
- **D-110 UI** (Bloque 8 del Bio-Expediente) puede arrancarse con el frame definido. La pantalla icónica de detalle de mascota (sección 6.4.4, sección 8) es el primer candidato para construcción con visión clara.

**Mediato:**

- Redacción de documentos hermanos cuando tengan disparo operativo: Portal Sellers, Portal Refugios y Criaderos, Portal Admin, App Cliente.
- Resolución de deudas documentales generadas por este documento. Principales:
  - `EPETPLACE.md` y `MODELO_PRODUCTO.md`: anclar "no fotos de familia humana" como principio general del producto.
  - `MODELO_PRODUCTO.md`: anclar "cualquier cambio real sobre la mascota se hace desde la app del cliente" como principio que aplica a los cinco portales.
  - `BIO_EXPEDIENTE.md` y `MODELO_PRODUCTO.md`: shape técnico del motor de catálogo de servicios con sus cuatro tipos de oferta.
  - `EPETPLACE.md`: alcance técnico y de modelo de la página web pública del prestador.
  - `POLITICAS_EPETPLACE.md`: enriquecer P5 con umbral operativo de 14 años para solicitar servicios.
  - `APP_CLIENTE.md` (por redactar): coordinar flow del botón de urgencia.

**Continuo:**

- Aplicar L-068 (segunda lectura como lector frío) cada vez que se reabra el documento.
- Mantener el apéndice de decisiones actualizado cuando aparezcan decisiones nuevas en sesiones futuras.
- Auditoría trimestral de coherencia con los otros documentos maestros (L-092 — encabezados se desincronizan; aplicar disciplina activa).

### 13.5 Sello de cierre

`PORTAL_PRESTADOR.md` versión v1.0 cierra como primer borrador completo en Sesión 20.

El documento articuló alma, momentos temporales, familias de servicios, secciones del portal, momentos narrativos, contexto de mascota, familia humana, niños y familiares autorizados, conexión con ecosistema, diferenciación por fases, y cierre. Cerró 69 decisiones de modelo formales en su apéndice final. Generó múltiples deudas documentales explícitas para los documentos hermanos. Marcó el estado del portal construido hasta S19 como mayoritariamente requerido de reconstrucción (CN o RC), con disposición ordenada.

Esta primera versión no es punto final. Es punto de partida con suficiente frame para que la construcción del portal arranque con dirección clara. La reapertura del documento es esperada cuando la operación real revele algo que el frame no contempló — la Disposición a Reconstruir aplica también acá.

El portal del prestador es **el canal donde el prestador apasionado se encuentra con el ecosistema de e-PetPlace y vive el cuidado de mascotas con coherencia**. Cuando un prestador del Momento Fundacional cierra el portal por primera vez sintiendo que llegó a un lugar que lo eligió y lo reconoce, el documento cumplió su propósito. Cuando ese mismo prestador, tres meses después, se gradúa con la insignia y la página pública, el portal cumplió la promesa que hizo el Día 1.

Ese es el éxito del documento. Cumplirlo es trabajo de los meses y años que vienen.

---

## 14. El equipo del negocio — LETRA_EQUIPO (v1, S73)

> **Depositada en la transposición S73→S74 (22 Jul 2026), con la palabra del
> founder.** La letra de mesa se escribió ANTES de que el motor se construyera;
> este depósito la ACTUALIZA contra lo construido — los tres §§ superados por
> los hechos (§3, §4, §5) llevan su delta marcado y conservan la espec original
> como nota histórica. **La numeración interna §0–§8 es la que citan D-486
> (§2/§7), D-494 (§4) y `MODELO_NOTIFICACIONES.md`** — resuelve acá. Registro
> de proceso: el freno 76b rigió una CUARTA vez antes de este depósito (la
> letra llegó anunciada como "adjunta" sin el literal; se pidió y llegó pegada).

### Letra original (S73, sobre el literal del relevamiento de B)

> **Estado: LETRA DE MESA sobre el relevamiento `500ee8d`
> (`docs/relevamientos/2026-07-21-s73b-relevamiento-equipo.md`). SUPERSEDE el
> esqueleto** (`ESQUELETO_EQUIPO_PORTAL_PRESTADOR_S73.md`) — que queda como
> historia con su freno. Destino: sección nueva de PORTAL_PRESTADOR *(este
> depósito lo cumple)*. **Las decisiones de PRODUCTO ya están firmadas por el
> founder** (unidad = negocio · tres roles · acumulables por unión). **Las de
> ARQUITECTURA las toma esta letra (regla 74) con su porqué.** La MIGRACIÓN la
> propone Code y espera OK del founder (regla 73) — esta letra es su espec, no
> su SQL. *(Nota del depósito: la migración ya corrió con OK founder —
> `20260721210000` motor + `20260721230000` gate; ver §5 y el estado post-S73.)*

### §0. Freno registrado (L-158, de la mesa)

El esqueleto §5 citaba `cuenta_roles` como chasis de roles de persona. El
literal: **es `tipo_actor` por CUENTA, sin `user_id`** — nombre-trampa, query
de B rebotó 42703. Esta letra corrige la referencia. Segundo hallazgo del
literal: `prestadores.tipo` sigue poblado (clinica_veterinaria 2 · paseador 3)
— **el eje que A3 mató vive en datos**; se registra como deuda con disparo
(cuando se toque el catálogo de prestadores), cero borrado ahora. *(Hoy
D-487.)*

### §1. Lo que el literal confirma del esqueleto (no se re-decide)

- El vínculo persona×negocio EXISTE: `prestador_empleados` (10 filas,
  UNIQUE(prestador_id, user_id), rol CHECK 'dueño'|'empleado'). Los 5
  titulares S67 viven ahí.
- La PROCEDENCIA ya preserva la salida: 48 funciones cargan `empleado_id`,
  13 triggers lo estampan — *el acceso muere, los actos quedan* es verdad de
  motor HOY. La letra no construye esto: lo declara.
- La CREDENCIAL tiene depósito: `prestador_documentos` (titulo_profesional,
  registro_senescyt) + el ciclo admin §14.2. No se duplica.
- El ACTO tiene tabla: `prestador_empleado_servicios` (0 filas).
- La ENTRADA tiene motor: `empleado_invitaciones` + 3 RPCs + policy.
- **D-464 es literal:** `eventos_mascota_select` y `medicacion_select` gatean
  solo por `user_tiene_acceso_a_mascota` — cero lectura de rol. *(Curado en
  S73 — ver §5.)*

### §2. DECISIÓN DE ARQUITECTURA — dónde viven los roles

**El rol vive en tabla hija `empleado_roles` (empleado_id FK al vínculo, rol,
asignado_por, asignado_en), UNIQUE(empleado_id, rol).** El porqué, contra la
alternativa (columna array en el vínculo):

1. La UNIQUE del vínculo se CONSERVA intacta — el vínculo es la persona en el
   negocio; el rol es un atributo acumulable de ese vínculo.
2. Asignar/quitar un rol es INSERT/DELETE con autor y fecha — auditable de
   nacimiento (quién asignó, cuándo), que un array no da gratis.
3. Las policies RLS lo leen con EXISTS sobre la hija — patrón que la casa ya
   usa 28 veces.
4. Extensible sin ALTER: un rol futuro es un valor nuevo, no un cambio de
   shape.

**Los tres roles: `dueño` · `profesional` · `recepcion`.** La UNIÓN se
resuelve en el helper (§4). La columna `rol` vieja del vínculo queda
CONGELADA como legacy tras el backfill (deuda de DROP con disparo —
precedente D-471: el portal legado comparte la DB; no se dropea a ciegas).
*(Hoy D-486; el motor la construyó tal cual — migración `20260721210000`.)*

### §3. Backfill — ACTUALIZADO: lo que de hecho pasó

**El punto de adjudicación quedó SUPERADO por los hechos — cero adjudicación
ocurrió.** La directiva founder de purga pre-corte 1-jul (D-492) resolvió el
caso antes de que existiera: los no-titulares eran legacy pre-corte, y **las 3
filas activas se DESACTIVARON con OK founder** (commit `14e49fa`, UPDATE con
verificación en la misma txn). Estado final literal: *las 3 filas
activo=false · 5 dueños intactos · CERO empleados activos con rol legacy
'empleado' · residuo fixture T7 = 0*. Reversible (`activo=true`); la purga
definitiva es D-492. Los 5 titulares (rol='dueño') sí se backfillearon
mecánicos a la hija (`20260721210000`). **El gate D-464 aterrizó sin ningún
empleado activo sin rol — el requisito de la espec se cumplió por
desactivación, no por adjudicación.**

*Espec original (nota histórica):* «Los 5 titulares (rol='dueño') → fila
`dueño` en la hija. Mecánico. **Los 5 no-titulares (rol='empleado') NO se
adivinan**: profesional vs recepción es exactamente la distinción que no
existía. Code reporta las 5 filas LITERALES (quiénes son, de qué negocio, si
son demo/seed) y el founder adjudica ANTES de que el gate D-464 se aplique —
un empleado sin rol tras el gate pierde lectura clínica, y eso tiene que ser
decisión, no accidente de migración.»

### §4. El helper único de autorización

Nace UNA función (patrón puerta única): `empleado_tiene_rol(prestador_id,
roles[])` — SECURITY con las curas de la casa (search_path fijado, REVOKE
anon/PUBLIC, L-140). **Toda policy y todo RPC que gatee por rol la llama;
nadie re-implementa el EXISTS.** La unión firmada por el founder ES esta
función: N filas de rol = N permisos sumados, jamás "rol activo".

**Enmienda v3 (mesa, incorporada al motor):** las TRES policies de la propia
hija `empleado_roles` — **SELECT, INSERT y DELETE, no solo la escritura** —
gobiernan por el helper (`empleado_tiene_rol(…, ARRAY['dueño'])`): un
co-dueño ve y administra los roles de su negocio POR la misma puerta única,
sin EXISTS artesanal ni en la lectura. Construido tal cual en
`20260721210000` (policies `empleado_roles_select` /
`empleado_roles_insert_duenio` / `empleado_roles_delete_duenio`). *(D-494
registra la excepción viva: los 2 helpers de caso re-implementan el chequeo
por join porque reciben el usuario por parámetro — cura declarada: sobrecarga
con `user_id` y delegación.)*

### §5. La cura D-464 — ACTUALIZADO: APLICADA (ya no es espec)

**El gate está APLICADO de motor** (migración
`20260721230000_s73b_gate_d464_lectura_clinica.sql`, commit `5082360`, OK
founder, exacto a lo revisado). Lo construido:

- **Nace `user_acceso_clinico_a_mascota(uuid)`** — acceso a la mascota **Y**
  `empleado_tiene_rol(negocio, ['dueño','profesional'])` para el lado
  prestador. Su **pata FAMILIA es BYTE-IDÉNTICA al helper viejo** (construida
  por cita literal de `pg_get_functiondef`; la verificación imperativa PRUEBA
  la identidad módulo whitespace quitada la única línea del gate). La lectura
  del lado familia NO se tocó — su arco es S74 (D-485, RLS-familia).
- **14 policies SELECT clínicas** migraron al helper nuevo (11 directas + 3
  con `OR is_admin()`), **`eventos_mascota` ENTERA** — razón de mesa: A3 §4
  nunca prometió el timeline a recepción — y **`mascota_perfil_vigente`
  gateada con VENTANA DECLARADA S73→S74** (D-489 nombra
  `tiene_emergencia_activa` para la vista destilada).
- L-140 con sonda sobre el helper (proacl sin anon/PUBLIC, verificado en la
  propia migración).
- La secuencia obligatoria de la espec se honró con la forma §3: mecanismo +
  backfill titulares (`20260721210000`) → desactivación legacy (`14e49fa`) →
  el gate (`20260721230000`). **El gate jamás aterrizó con un empleado activo
  sin rol.**

**Lo que recepción SÍ ve (destilado A3 §4 — identidad + etapa + alerta de
seguridad) es SUPERFICIE + lectores de S74** (D-489, con veto founder). En
S73 el motor solo CERRÓ la fuga; no construyó la vista destilada. Cerrar sin
construir es correcto: mejor una recepcionista que pide ayuda al vet que una
que lee la HC de todos.

### §6. D-463 — el otorgamiento carga el acto (v1 mínimo)

`prestador_empleado_servicios` se puebla cuando el dueño ACOTA a un
profesional a ciertos servicios. **Default declarado v1: sin filas = todos
los actos NO clínicos del negocio.** Los actos CLÍNICOS exigen además
credencial validada (§14.2) — el muro cuelga de credencial+acto, jamás del
tipo de negocio (firma founder: la clínica multi-servicio es el caso común).
La validación fina del acto clínico por credencial es motor de S74 si esta
ventana satura; la letra queda.

### §7. Deudas que nacen de este literal (numeradas tras las de A)

- DROP de la columna `rol` legacy del vínculo — disparo: portal legado
  jubilado o auditoría D-471. *(= D-486.)*
- `prestadores.tipo` poblado con el eje muerto — disparo: primer toque al
  catálogo de prestadores. *(= D-487.)*
- La consulta no reconstruible desde URL sola (hallazgo 1 de B, tensión con
  ESTRATEGIA 7.5) — disparo: la pasada de deep-links. *(= D-488; adelantada
  en la misma S73, commit `780a3e0`.)*
- La vista destilada de recepción (superficie S74, ya en el arco).
  *(= D-489.)*

### §8. Qué ejecuta B en S73 (con OK founder para la migración)

1. Migración: tabla hija + helper + backfill titulares (76(g): declarar si
   computa anclas; esta es aditiva + backfill acotado — declarar igual).
   Verificación imperativa regla 40 + sondas L-140. *(EJECUTADO —
   `20260721210000`, commit `7ce6b91`.)*
2. Reporte de las 5 filas no-titulares → adjudicación founder. *(SUPERADO —
   ver §3: directiva 1-jul, desactivación `14e49fa`.)*
3. El gate D-464 SOLO tras la adjudicación. *(EJECUTADO tras la
   desactivación — `20260721230000`, commit `5082360`.)*
4. La superficie (ventana de equipo en NEGOCIO) sigue siendo S74 salvo que
   la sesión sobre — el orden de caída del brief rige. *(La sesión NO sobró:
   superficie a S74.)*

### Estado POST-S73 (al depositar, 22 Jul 2026)

**El motor está COMPLETO:** `empleado_roles` con sus tres policies por la
puerta única · `empleado_tiene_rol` (L-140 verde) · backfill de los 5
titulares · legacy desactivado (cero empleados activos sin rol) · el gate
D-464 cerrado de motor (14 policies + `user_acceso_clinico_a_mascota` con
pata familia byte-idéntica). **Lo que falta es SUPERFICIE, y es S74:** la
ventana de equipo en NEGOCIO (invitar, asignar roles, acotar actos — sobre
los 3 RPCs de invitación vivos), la vista destilada de recepción (D-489, veto
founder pendiente) y la FIRMA del prestador (`MODELO_PRESENCIA` §2 pieza 1,
misma superficie NEGOCIO). Deudas vivas del frente: D-463 (acto clínico
fino) · D-486 · D-487 · D-490 (gate de ESCRITURA clínica sin rol) · D-492
(purga) · D-494/D-495 (helpers de caso y proacl de
`user_tiene_acceso_a_mascota`).

---

## Decisiones de modelo cerradas en Sesión 20

Este documento incorpora decisiones de modelo cerradas formalmente durante Sesión 20. Las listamos acá como referencia rápida — el detalle vive en las secciones del documento donde se materializan.

- **Cinco documentos de visión narrativa del ecosistema.** Portal Prestador (este documento), Portal Seller, Portal Refugios y Criaderos, Portal Admin, App Cliente. Cada uno se redacta cuando tenga disparo operativo real, no por completitud documental. Sección: *Portales hermanos*.
- **Tres momentos del prestador en el ecosistema.** Momento Fundacional, Momento Pionero, Momento Establecido. Prácticas distintas según el momento, alma común. Sección 1.2.
- **Filosofía luxury con cuatro propiedades operativas.** Curaduría visible, coreografía intencional, materialidad cuando importa, sobriedad sin frialdad. Sección 1.3.
- **Aspiracional como invariante.** Ser prestador de e-PetPlace es alago, no favor. Sección 1.4.
- **Pieza física para los primeros ~15 fundadores.** Placa de vidrio con nombre y "Prestador Fundador / e-PetPlace Ecuador / 2026". No promesa permanente — práctica fundacional acotada. Sección 2.2.
- **Pregunta de propósito en la aplicación que vuelve al portal.** La respuesta del prestador en el wizard reaparece en la bienvenida del Día 1. Implementación técnica pendiente en wizard. Secciones 2.1 y 2.3.
- **Mascota demo (Zeus) con doble propósito.** Educación del prestador + data de prueba estable para founder/equipo. Zeus es mascota real del founder, lo que aporta autenticidad al ejemplo. Sección 2.4.
- **Reputación de prestadores honrada, no jerarquizada.** No rankings, no "mejor prestador del año", no leaderboards. Honra de trayectoria personal. Sección 2.7.
- **Membresía revocable por inactividad demostrable.** Proceso humano, comunicado al ingresar, no automático. Sección 3.10.
- **No rogamos permanencia.** Aprendemos de las salidas sin perseguir. Tres matices integrados. Sección 3.11.
- **Canal directo con el equipo durante Momento Fundacional.** Sostenido operativamente con persona dedicada para los tres canales (sellers, refugios, prestadores). Sección 3.8.
- **Comunicación quincenal del founder a los primeros 10 prestadores fundadores.** Mientras dure el Momento Fundacional. Sección 3.8.
- **Visibilidad del propio compromiso.** Espejo personal del prestador, no vigilancia. Sección 3.9.
- **Graduación de 90 días para todos los prestadores.** Práctica permanente del modelo. Criterios mínimos no agresivos. Sección 4.2.
- **Comunicación transparente del Día 90 desde Día 1.** Línea sobria en bienvenida que comunica la existencia del momento de graduación sin amenazar. Sección 2.3.
- **Activos desbloqueados con graduación.** Insignia certificación, página web pública dentro de e-PetPlace, dashboard con sofisticación narrativa. Sección 4.4. *Deuda documental para `EPETPLACE.md` y `MODELO_PRODUCTO.md`: anclar el alcance técnico y de modelo de la página web pública del prestador.*
- **Dashboard con sofisticación narrativa, no visual.** Profundidad temporal sobre métricas existentes, no nuevas vanity metrics. Sección 4.5.
- **Visibilidad de otros prestadores del ecosistema.** No se libera al Día 90. Sección 4.6 (con su criterio de disparo) y sección 11.6 (con su principio invariante "mapa de pertenencia").
- **Voz del founder híbrida desde Día 90.** Firma personal en momentos significativos, voz del equipo en operación cotidiana. Sección 4.7.
- **Check-in humano del Día 90.** Conversación natural, no renovación contractual. Sección 4.8.
- **Protección activa del sentido fundador.** Mecanismos concretos que distinguen pertenencia fundadora de pionera. Sección 4.9.
- **Prestador definido por servicios, no por tipo.** Modelo aditivo. Un prestador puede ofrecer múltiples familias y sumar después. Sección 5.1.
- **Cinco familias de servicios para F1 + una diferida.** Clínicos, vacunación, cuidado temporal, paseo, estética y bienestar, adiestramiento construidas para F1. Certificación (Familia G — ESA, animal de servicio, traslado internacional) diseñada conceptualmente pero diferida hasta que aparezca demanda real y prestador con licencia. Definidas por JTBD del dueño, no por categoría del prestador. Sección 5.2.
- **Familia A (clínicos) como anclaje técnico y narrativo.** Define el frame para todo lo demás. Orden de construcción F1: A → B → D → E → C → F. Familia G diferida con hito de disparo definido. Sección 5.3.
- **Motor de catálogo flexible.** Cuatro tipos de oferta: servicio simple, servicio compuesto, servicio en paquete o contrato, servicio con producto-documento (para Familia G cuando se construya). *Deuda documental para `BIO_EXPEDIENTE.md` y `MODELO_PRODUCTO.md`: anclar shape técnico del motor de catálogo.* Sección 5.5.
- **Bio-expediente compartido con vista diferenciada por servicio.** Todos aportan, cada familia ve la parte relevante para su servicio. Sección 5.6.
- **Wearable como feature futura del cliente, prestador como consumidor de su data.** Implementación técnica fuera de F1. Sección 5.7.
- **Mascota demo Zeus con vista parcial según servicios habilitados.** Zeus es la misma para todos; la vista corresponde al servicio. Sección 5.8.
- **Home único con composición por servicios.** Alma común invariante, cards configuradas según servicios habilitados. Sección 5.9.
- **Cuatro secciones macro del portal por propósito.** Mi cuenta (A), Mascotas y agenda (B), Prestación del servicio (C), Administrativa (D). El portal no es lista plana de pantallas. Sección 6.1.
- **Disposición a Reconstruir aplicada al bloque de secciones.** El documento describe cómo deberían ser las secciones, no cómo están hoy. La mayoría de piezas son RC (reconstrucción) o CN (construcción nueva). Auditoría detallada del repo contra el frame es sesión posterior dedicada. Sección 6.2.
- **Sección C (prestación) dividida en antes / durante / después.** Cada momento con propósito propio. Captura mínima durante atención, documentación rica después. Sección 6.3.
- **Agenda como pantalla más usada del día a día.** Tratamiento profundo. Vista parcial del bio-expediente accesible desde agenda. Indicadores de alerta visibles. Configurabilidad rica de alertas. Sección 6.4.1.
- **Detalle de mascota como pantalla icónica del portal.** Materialización del bio-expediente vivo: identidad personal con 5 dimensiones, timeline narrativo, casos clínicos, familia humana, datos de manejo. Sección 6.4.4.
- **Comunicación prestador-familia mediada por la plataforma.** No WhatsApp, no canales personales. Privacidad real, trazabilidad para disputas, captura al bio-expediente cuando aplica, defensibilidad del modelo. Activación con servicio, cierre con servicio. *Implementación técnica significativa pendiente. Riesgo de adopción declarado.* Sección 6.4.7.
- **Alertas de agenda configurables granularmente.** Toggle prender/apagar por tipo de evento. Respeto a la atención del prestador. Sección 6.4.6.
- **Motor de catálogo materializado en Sección A — Servicios.** El prestador configura familia, tipo de oferta, descripción, precio, duración, tipo de mascota, condiciones operativas. Sección 6.5.3.
- **Dashboard administrativo con sofisticación narrativa, no comparativa.** Sin rankings, sin comparaciones con otros prestadores. Trayectoria propia en el tiempo. Sección 6.6.1.
- **Momentos sensibles como oportunidad de demostrar cuidado.** Cada queja, conflicto o pérdida es oportunidad de cumplir la promesa luxury, no carga administrativa. Sobriedad con presencia. Sección 7.2.
- **Altar virtual para mascotas fallecidas.** Feature culturalmente significativa (referencia: día de los muertos). Opcional, bajo control total de la familia. Invitación a prestadores con consentimiento explícito. *Construcción diferida con disparo: primer fallecimiento real en F1.* Sección 7.5.2.
- **Cierre de caso clínico al fallecimiento.** Al notificarse fallecimiento, caso clínico abierto se cierra automáticamente y deja de ser visible al público general. Información permanece en bio-expediente histórico. Sección 7.5.2.
- **Notificación calibrada por frecuencia de atención** en eventos sensibles (fallecimiento, transferencia, perdida). Prestador frecuente recibe mensaje personalizado; prestador esporádico recibe nota más genérica. Sección 7.5.2 y 7.6.2.
- **Salida del prestador con dignidad — dos momentos coreografiados.** Conversación de cierre + carta de despedida con firma calibrada al momento. Aprendemos de la salida. Bio-expediente del prestador queda intacto en el ecosistema. Sección 7.5.4.
- **Alta asistida como momento de embajadoría.** El prestador se vuelve canal del ecosistema. Reconocimiento al cierre del alta exitosa. Sección 7.6.1.
- **Presencia antes que alertas en detalle de mascota.** La identidad de la mascota como individuo único aparece antes que información clínica u operativa. Acceso a alertas inmediatamente accesible pero no intrusivo. Sección 8.3.
- **Tag de momento vital en cabecera + transiciones en timeline.** Las consecuencias operativas del momento vital ya están integradas en dimensiones y datos de manejo. Sección 8.4.
- **5 dimensiones de identidad personal ordenadas por relevancia operativa al servicio.** Bloque general "Identidad personal" siempre accesible. Composición vista por defecto adaptada a cada familia de servicio. Sección 8.5.
- **Vista parcial del bio-expediente con indicación honesta.** El prestador ve secciones de "información no visible para tu servicio" colapsadas y discretas. Transparencia, no restricción. Sección 8.6.
- **Identificación calibrada de aportes de otros prestadores.** Genérico por defecto, identidad explícita en handshakes. Canal interno entre prestadores del ecosistema para agradecer aportes. Sección 8.7.
- **Distinción público vs privado en observaciones del prestador.** Observaciones operativas del servicio van al bio-expediente compartido. Observaciones subjetivas del prestador pueden quedar como notas privadas (paralelo a P6 aplicado al prestador). Sección 8.8.
- **Tercera vía para patrones de comportamiento difícil con prestador específico.** El portal comunica patrón al prestador primero, escala al equipo si persiste, nunca le dice a la familia "cambiá de prestador" de oficio. La conversación es humana, el portal aporta información. Sección 8.9.
- **Invitación silenciosa al enriquecimiento del bio-expediente.** El prestador puede aportar a dimensiones vacías. No bloquea cierre de atención. No gamificación. Aparece una vez por dimensión por mascota. Sección 8.10.
- **Familia humana presentada como lista clara con énfasis operativo.** No visualización elaborada. Sobriedad luxury aplicada. Sección 9.3.
- **No hay fotos de familia humana en ningún lugar de la plataforma.** Solo la mascota tiene presencia visual. Refuerza jerarquía del producto, protege menores por defecto, simplifica modelo operativo. *Deuda documental para `EPETPLACE.md` y `MODELO_PRODUCTO.md`: anclar como principio general del producto.* Sección 9.4.
- **Mensajes operativos de la familia al prestador, efímeros por defecto.** Opción de incorporación al bio-expediente cuando contienen información relevante para futuras atenciones (identidad/comportamiento). Lo transaccional queda en canal interno. Sección 9.6.
- **Prestador informado, no ejecutor.** Cualquier cambio real sobre la mascota (P1, P2) se hace desde la app del cliente. El prestador construye historia vía bio-expediente; no decide pertenencia ni estado. *Deuda documental para `MODELO_PRODUCTO.md`: anclar como principio que aplica a los cinco portales del ecosistema.* Sección 9.7.
- **Transferencia de mascota en proceso (P2) no es visible al prestador.** Durante la propuesta hasta la confirmación, la mascota sigue apareciendo con su familia actual. Una vez confirmada, momento narrativo 7.6.2 se activa. Sección 9.8.
- **Familia virtual del prestador (P3) presentada con honestidad operativa.** Indicación visible de "pendiente de registro — alta asistida en proceso". Transferencia automática a familia real cuando el cliente completa registro. Sección 9.9.
- **Información operativa concreta, no biográfica.** Permisos explícitos de quién puede entregar/retirar, contactos de emergencia con priorización, autorizaciones de urgencia con trazabilidad. Sin datos personales innecesarios. Sección 9.10.
- **Distinción operativa adulto vs menor autorizado.** Familiar autorizado adulto opera plenamente. Menor autorizado (14-17 años) opera servicios rutinarios. Menor de 14 años no puede ser autorizado. Sección 10.3.
- **Edad mínima 14 años para solicitar servicios.** Menores de 14 ven la mascota en la app y pueden subir experiencias pero no solicitan servicios. *Deuda documental para `POLITICAS_EPETPLACE.md`: enriquecer P5 con umbral operativo.* Sección 10.4.
- **Servicios rutinarios para menores autorizados; decisiones mayores para adultos.** Baño, paseo, control sin hallazgos: menor OK. Vacunación con producto compuesto, procedimientos clínicos, certificaciones, cambios significativos: requieren adulto. Sección 10.7.
- **Botón de urgencia para casos críticos.** Activación rápida de contacto entre prestador y co-dueño adulto. *Deuda documental coordinada para `APP_CLIENTE.md` y `PORTAL_PRESTADOR.md`: completar flow técnico en sesión futura.* Sección 10.8.
- **Aportes de menores procesados como observación del prestador.** El menor no figura como aportador formal. La decisión de formalizar el aporte queda con co-dueño adulto. Sección 10.6.
- **Detección de descuido: prestador documenta y escala al equipo, no investiga.** El menor nunca tiene rol de denunciar. El equipo de e-PetPlace evalúa y actúa con humanos, no algoritmos. Sección 10.9.
- **Red de prestadores como mapa de pertenencia, no directorio comparativo.** Cuando se libere (disparo: 3 ciudades), los prestadores se ven sin rankings, sin métricas comparativas, sin "mejor prestador". Como mapa de coworking. Protege el alma durante el crecimiento. Sección 11.6.
- **Capa 3 con curva de revelación por fase.** F1 solo trae vibrato del ecosistema + comunicación del founder. F2+ libera alertas comunitarias, eventos, red de prestadores. F3+ libera DaaS, comunidad madura. Sección 11.4.
- **Portal soporta las cinco familias activas + Familia G cuando se construya, en cada país donde e-PetPlace opera.** Multi-idioma, multi-moneda, multi-regulación, soporte horario adaptado: decisiones técnicas concretas viven en `EPETPLACE.md` y documentos por país. Este documento solo ancla el principio de soporte. Sección 12.6.
- **Cuatro principios estructurales de la evolución F1→F4.** Evolución por capas no por reemplazo, curva de revelación gradual disciplinada, alma invariante con manifestaciones adaptativas, cada fase con su propia sesión de profundización. Sección 12.8.

---

## Historial de versiones

- **v1.0 (Sesión 20 — Mayo 2026):** Primer borrador completo. Visión narrativa del portal del prestador: alma, días 1/30/90, diferenciación por familia de servicios, secciones del portal, momentos narrativos, contexto de mascota, familia humana, niños y familiares autorizados, conexión con el ecosistema, fases F1→F4. *(Entrada reconstruida en S42 desde el header y el cierre del documento; el doc no tenía historial de versiones hasta v1.2.)*
- **v1.1 (18 May 2026 — S21):** Segunda lectura como lector frío (L-068) cumplida. Fixes mecánicos aplicados: A1 referencia obsoleta, A2 eliminación de referencias a kickoff, B1 consolidación de decisión "3 ciudades", B2 consolidación de "mapa de pertenencia", C1 matiz P13 en sección 9.7, E1 corrección de cifra de decisiones (50 → 69). Hallazgos decisionales pendientes (A3, D1-D7, C2, C3, E2) para ser anotados como deuda en CLAUDE.md en próximos pasos. *(Entrada reconstruida en S42 desde el header v1.1.)*
- **v1.2 (5 Jul 2026 — S42):** Nota de cambio de superficie (app móvil Expo primaria, web secundaria del mismo código; alma ratificada intacta). Asimetría de complejidad por familia agregada en 5.2. Familia A congelada con disparo. Referencia: `ESTRATEGIA_2026H2.md`.
- **v1.3 (22 Jul 2026 — transposición S73→S74):** Nace la sección 14 — LETRA_EQUIPO v1 (letra de mesa S73 sobre el relevamiento `500ee8d`), depositada ACTUALIZADA contra el motor construido: §3 backfill superado por la directiva 1-jul (desactivación `14e49fa`, cero adjudicación), §4 con la enmienda v3 (las tres policies de la hija por la puerta única), §5 de espec a estado (gate D-464 aplicado — `20260721230000`, 14 policies + `user_acceso_clinico_a_mascota`), y el estado post-S73 (motor completo; la superficie es S74). Resuelve las citas D-486 (§2/§7), D-494 (§4) y `MODELO_NOTIFICACIONES.md`.

