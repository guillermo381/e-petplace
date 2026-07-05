# MODELO_PRODUCTO — El alma de e-PetPlace destilada

> **Versión:** v1.3
> **Última actualización:** 5 Jul 2026 — Sesión 42. v1.3: criterio operativo del wow ("cero explicación necesaria") agregado en Sección 6.1. Referencia: `ESTRATEGIA_2026H2.md`.
> **Audiencia:** Claude (web y code) en toda sesión futura. Cualquier dev que se sume al proyecto. Founder cuando vuelve a una sesión después de olvidar cosas. Eventualmente: posibles inversores y socios estratégicos.
> **Hermanado con:** `EPETPLACE.md`, `BIO_EXPEDIENTE.md`, `MODELO_FINANCIERO.md`, `CLAUDE.md`, `CONTRATO_TRABAJO.md`. Este documento es el modelo conceptual del **producto** — qué estamos construyendo y por qué.

---

## 0. Glosario rápido

Para que cualquier lector pueda leer el resto del documento sin tener que adivinar términos. Si querés profundidad de un término, está linkeado a la sección donde se desarrolla.

| Término | Definición de 1 línea | Detalle en |
|---|---|---|
| **Bio-expediente** | Timeline vivo de todos los eventos relevantes de la vida de una mascota, contribuida por múltiples actores. | `BIO_EXPEDIENTE.md` |
| **Capa 1 / Capa 2 / Capa 3** | Las tres dimensiones simultáneas del producto: identidad, cuidado, comunidad. | Sección 3 |
| **JTBD** | Jobs To Be Done. Tareas que la mascota o su familia necesitan resolver. e-PetPlace define 8 JTBDs base. | Sección 3.2 |
| **M0–M6** | Los siete momentos vitales de una mascota: pre-adopción, llegada, crecimiento, adulto sano, adulto con condiciones, senior, fin de vida. | Sección 3.2 |
| **Familia** | Unidad humana que comparte cuidado de una o más mascotas. Tiene miembros con distintos roles. | Sección 4 |
| **Co-dueño** | Adulto con titularidad plena sobre una mascota específica. Modelo simétrico: todos los co-dueños son iguales en operación. | Sección 4 |
| **Familiar autorizado** | Adulto o menor con permisos delegados sobre la mascota, sin titularidad plena. | Sección 4 |
| **Identidad personal** | Dimensión 2 de la identidad de la mascota: personalidad, gustos, miedos, manías. | Sección 3.1 |
| **Identidad narrativa** | Dimensión 5 de la identidad: hitos y vida documentada. Lo que diferencia "expediente médico" de "vida documentada". | Sección 3.1 |
| **Hito narrativo** | Evento significativo en la vida de la mascota. Puede ser público, privado familiar, o privado del humano que lo escribió. | Sección 3.1 |
| **Modo discoverable / solo amigos / privado total** | Tres niveles de visibilidad social de una mascota. | Sección 3.1.3 |
| **Adopción de caso clínico** | Concepto donde el vet no atiende una consulta sino que adopta un proceso de salud con apertura, evolución y cierre. | Sección 3.2 |
| **Vet tratante** | Vet que adopta un caso clínico específico. Una mascota puede tener varios vets tratantes simultáneos por casos distintos. | Sección 3.2 |
| **Motor de alertas** | Sistema de reglas declarativas que dispara acciones proactivas (notificaciones, recordatorios, alertas) sobre el bio-expediente. | Sección 3.2 |
| **Handshake** | Transferencia estructurada de información entre prestadores cuando corresponde (ej: vet receta medicación → paseador habitual se entera). | Sección 3.2 |
| **Visibilidad cruzada inteligente** | Cada actor ve lo relevante para su rol. Diseño de UI con criterio explícito por rol, no RLS técnico. | Sección 3.2 |
| **Memorial** | Modo del expediente cuando la mascota fallece. La identidad y la historia se preservan, no se borran. | Sección 3.3 |
| **Niveles A/B/C/D de soporte** | Escalonado de qué especies soporta e-PetPlace, de soporte completo (perro/gato) a no soportadas (ganado). | Sección 5 |
| **F0–F4+** | Fases del producto, de co-diseño multi-vertical hasta escala global. | Sección 7 |
| **Wow desde día 1** | Filosofía del producto: las features que sí están deben generar wow, no apuntar a estar "suficientemente bien". | Sección 6 |
| **Amor al oficio** | Filtro de onboarding del producto: vets, prestadores y dueños se eligen por su pasión real, no por tamaño de negocio. | Sección 6 |
| **Revelación progresiva** | La app se presenta simple al inicio. Las funcionalidades se revelan contextualmente según momento vital de la mascota y uso real. NO es gamificación de puntos. | Sección 6.4 |

---

## 1. Propósito y cómo usar este documento

### Por qué existe este documento

Hay seis documentos maestros de e-PetPlace y cada uno responde una pregunta distinta:

- **`EPETPLACE.md`** responde *¿qué negocio es e-PetPlace?* Habla de defensibilidad, modelo comercial, revenue streams, posicionamiento competitivo, fases de mercado.
- **`BIO_EXPEDIENTE.md`** responde *¿cómo está construido técnicamente el expediente de la mascota?* Habla de tablas, triggers, RLS, principios técnicos, eventos.
- **`MODELO_FINANCIERO.md`** responde *¿cómo se captura, registra y liquida el dinero en el ecosistema?* Habla del motor financiero del marketplace: eventos económicos, comisiones, liquidaciones, multi-moneda, gateway de pagos. Es el contrato técnico-conceptual del flujo financiero, compartido entre repos.
- **`MODELO_PRODUCTO.md`** (este documento) responde *¿qué producto estamos construyendo y por qué tiene alma?* Habla del modelo conceptual completo del producto: identidad de la mascota, cuidado a lo largo de la vida, comunidad y pertenencia, modelo humano de familia y co-dueños, multi-especie, fases de producto, principios éticos.
- **`CLAUDE.md`** responde *¿en qué estado real está el proyecto hoy?* Es el estado operacional del repo: sesiones completadas, decisiones tomadas, deuda técnica numerada (D-NNN), lecciones aprendidas (L-NNN), bugs, próximos pasos. Es el documento más vivo, se actualiza al cierre de cada sesión.
- **`CONTRATO_TRABAJO.md`** responde *¿cómo trabajan el founder y Claude juntos?* Es el contrato operativo: reglas de decisión, formato de comunicación, honestidad, ejecución, testing, memoria entre sesiones. No es sobre el producto — es sobre el proceso.

Los seis documentos son complementarios. Ninguno reemplaza a otro.

- Una decisión técnica sin entender **este documento** es decisión sin alma.
- Una decisión de producto sin entender **los otros cinco** es decisión sin pies.
- Una decisión operativa sin leer **`CLAUDE.md`** es decisión sin contexto del estado real.
- Una decisión cualquiera sin respetar **`CONTRATO_TRABAJO.md`** es decisión fuera del proceso acordado.

### Cómo usar este documento

- **Cuando Claude (web o code) arranca una sesión nueva sobre cualquier feature del producto**: leer este documento antes de proponer arquitectura, schema, UI o flujo. El frame conceptual aquí definido es vinculante para cualquier propuesta.

- **Cuando Claude o el founder piensa en sumar features**: contrastar contra las 3 capas del producto, los principios éticos no negociables, y las fases. Una feature que no abona a alguna de las capas merece preguntarse si pertenece al producto.

- **Cuando hay decisiones de modelo que tocan identidad, cuidado, comunidad, familia, especies o ética**: este documento es la fuente de verdad. Si una decisión contradice algo aquí escrito, paramos y discutimos si actualizamos el documento o si la decisión está mal.

- **Cuando el founder vuelve después de semanas sin tocar el proyecto y no recuerda dónde estaba la cabeza**: este documento es para vos. Leerlo entero (o las secciones que necesites) te debería devolver el frame completo del producto en menos de una hora.

- **Cuando un dev nuevo se suma al proyecto**: este es el segundo documento que lee (después de `EPETPLACE.md`). Antes de tocar código. Antes de mirar el schema. Antes de proponer features. Si no entiende qué se está construyendo aquí, no puede contribuir bien.

### Cómo evoluciona este documento

- **Las decisiones de modelo se cierran en discusión founder + Claude y se documentan acá.** No se cambian unilateralmente. Si una sesión futura encuentra que algo del modelo no funciona, se discute la actualización, no se ignora silenciosamente.

- **Las versiones se incrementan con cambios de modelo, no con cambios cosméticos.** Cambiar redacción menor = misma versión. Sumar una sub-capa, cambiar un principio, redefinir multi-especie = nueva versión menor. Cambiar el frame de las 3 capas = nueva versión mayor.

- **El historial de versiones al final del documento explica qué cambió y por qué.** No se borran versiones, se acumulan.

- **Lo no resuelto se nombra explícitamente.** Cuando hay decisiones diferidas para cuando lleguemos a implementar algo específico, se mencionan en cada sección con "esto se decidirá cuando..." o "deuda de modelo anotada". No se finge que todo está resuelto.

---

## 2. Tesis del producto

### Qué es e-PetPlace en una página

**e-PetPlace es la superapp universal del mundo mascota.**

No es software para veterinarios. No es marketplace de productos. No es directorio de servicios. No es red social de fotos lindas. Es **el lugar donde vive digitalmente la mascota a lo largo de toda su vida**, donde su identidad, su cuidado, sus prestadores y su comunidad se entretejen en una sola experiencia.

La diferencia clave con todo lo que existe hoy: **toda interacción de la mascota con cualquier actor del ecosistema enriquece un activo único, vivo, que es la vida documentada de esa mascota**. Una compra de alimento, una cita con el vet, un paseo, un grooming, un encuentro con otra mascota, un hito feliz, una despedida — cada interacción es un capítulo más de una historia que pertenece a la mascota y a su familia.

### El insight estructural que separa a e-PetPlace de todo lo demás

Hay productos veterinarios, marketplaces de productos para mascotas, apps de paseadores, directorios de hoteles, redes sociales de fotos de perros. Todos resuelven pedazos del problema. Ninguno integra.

El insight que hace posible e-PetPlace es:

> **El cuidado de una mascota no es una secuencia de transacciones aisladas con prestadores distintos. Es un proceso continuo, vivido por una mascota con identidad propia, contribuida por múltiples actores que en realidad están cuidando a la misma criatura aunque hoy no se hablen entre sí.**

Hoy en el mundo real, la familia de la mascota es el "router de información" entre todos los prestadores: le dice al paseador que está medicada, al groomer que tiene la piel sensible, al hotel qué comida darle, al vet nuevo qué le había recetado el anterior. Este router humano falla constantemente porque la familia olvida cosas, los miembros se comunican mal entre sí, o nadie se da cuenta de qué le sirve a quién.

e-PetPlace **elimina ese router humano falible y lo reemplaza por un sistema integrador** donde la información fluye con consentimiento de la familia entre los actores que cuidan a la mascota, donde cada actor ve lo que necesita ver para hacer bien su trabajo, y donde la mascota tiene una vida documentada que la acompaña aunque cambie de vet, de paseador, de ciudad, o de familia.

### Las 3 capas del producto

El producto se organiza en tres capas conceptuales que se construyen una sobre otra y se refuerzan mutuamente:

**Capa 1 — Identidad y vida de la mascota.**
Es la base ontológica. *¿Qué es una mascota en e-PetPlace?* Tiene cinco dimensiones de identidad (biológica, personal, relacional, temporal, narrativa) que se construyen progresivamente y que existen aunque ninguna otra capa esté activa. Sin esta capa, las otras dos son features sueltas sobre un sujeto vacío.

> *"En e-PetPlace tu mascota no tiene un expediente. Tiene una vida documentada."*

**Capa 2 — Cuidado integral a lo largo de la vida.**
Es el verbo principal del producto. *¿Qué se hace por la mascota a lo largo del tiempo, y por quién?* El cuidado es un proceso continuo dividido en siete momentos vitales (de pre-adopción hasta fin de vida), con ocho JTBDs que cruzan a actores múltiples, donde los vets adoptan casos clínicos en lugar de atender consultas, donde un motor de alertas inteligente persigue el bienestar de la mascota sin esperar que la familia recuerde todo, y donde los handshakes entre prestadores eliminan la fricción de información que existe hoy.

> *"e-PetPlace no es donde reservás una cita. Es donde tu mascota es cuidada."*

**Capa 3 — Comunidad y pertenencia.**
Es la dimensión multiplicadora. *¿Con quién, en qué comunidad?* La mascota tiene presencia social que emerge naturalmente de su identidad y su cuidado documentado. Tiene amigos mascotas, comunidades por afinidad, encuentros con propósito, memorial cuando muere, reputación que se gana con sustancia. Esta capa no se construye sola — emerge de las otras dos. Sin Capa 1 y Capa 2 activas, la capa social es Instagram con peor moderación. Con las dos primeras activas, es el lugar donde la vida de cada mascota tiene presencia social real.

> *"Tu mascota no está sola en e-PetPlace. Pertenece a una comunidad de mascotas reales, con vidas reales, cuidadas de verdad."*

### El modelo humano que sostiene todo

Atravesando las tres capas existe un modelo humano que reconoce cómo funciona realmente el cuidado de mascotas:

**La familia es la unidad humana de cuidado.** Una familia tiene una o varias mascotas. Cada mascota tiene co-dueños (adultos con titularidad plena) y puede tener familiares autorizados (adultos con permisos delegados, menores que son parte del vínculo afectivo aunque no puedan tomar decisiones legales). El modelo refleja la realidad: los chicos también cuidan a la mascota; la abuela que cuida cuando los papás viajan tiene un rol real; la pareja que adopta junta no tiene un dueño y un secundario.

**Los co-dueños son simétricos en operación pero individuales en lo emocional.** Todos los co-dueños pueden hacer lo mismo: programar citas, autorizar prestadores, gestionar la capa social. Pero cada uno tiene su propia capa narrativa privada — Juan puede escribir "Max me ayudó a superar mi depresión" sin que su pareja lo vea. Las acciones destructivas (dar de baja la mascota, remover un co-dueño) requieren doble confirmación. Esto refleja la verdad de la co-tenencia: somos iguales operativamente, pero cada uno tiene su vínculo único con la mascota.

**El historial es de la mascota, viaja con ella.** Cuando una familia se disuelve, cuando una mascota se transfiere a otra familia, cuando un humano deja de ser parte del vínculo — el expediente de la mascota la acompaña. Los humanos cambian; la vida documentada de la mascota sigue intacta. Los hitos privados de cada humano quedan con cada humano, no migran.

### Multi-especie desde el primer día

e-PetPlace **no es una app para perros**. Es una app para mascotas de compañía, donde la especie es **modulador transversal del producto**, no atributo cosmético. Un loro no "ladra"; un pez no "pasea". Cada especie tiene un perfil de comportamiento del producto que define qué momentos vitales aplican, qué JTBDs son principales o no aplican, qué actores son relevantes, qué vocabulario usa la app.

El soporte está escalonado en cuatro niveles:

- **Nivel A — Soporte completo de primera clase:** perro, gato. Todos los JTBDs, todos los actores principales, vocabulario propio, comunidad activa.
- **Nivel B — Soporte estructural completo, ecosistema parcial:** conejo, ave (loros, canarios y similares), reptil (tortuga, iguana, serpiente), hurón, cobaya. Modelo completo, ecosistema externo menor pero existente.
- **Nivel C — Soporte básico:** pez, anfibio, roedor pequeño, invertebrado de compañía. Registro + identidad + alimentación + vet exótico. Ecosistema externo muy limitado.
- **Nivel D — No soportadas:** ganado, animales silvestres. Fuera del scope del producto.
- **Adyacencia futura (Fase 5+):** equinos. Producto vertical separado bajo la marca, con motor compartido pero UX y go-to-market distintos. Decisión cerrada: no se diluye el producto core con equinos en Fases 1-4.

### La vara del producto: "wow desde el día 1"

Hay dos tipos de productos ganadores en categorías nuevas. Productos tipo A salen "suficientemente buenos" y mejoran con uso real (Uber, Airbnb arrancaron así, cuando la categoría no existía). Productos tipo B necesitan generar "wow" inmediato porque la categoría ya existe con incumbentes mediocres atrincherados (Notion, Linear, Figma arrancaron así).

**e-PetPlace es tipo B disfrazado de tipo A.** La categoría "software para vets" existe. La categoría "marketplace de productos para mascotas" existe. La categoría "directorio de servicios" existe. Lo que no existe es la superapp integradora con bio-expediente vivo. Pero el usuario no entiende "categoría nueva" — compara con lo que conoce. El vet va a comparar con su software actual. El dueño va a comparar con su app de la veterinaria + Instagram + MercadoLibre. Si el primer encuentro es "está bien", perdemos.

**El producto no busca tener todas las features desde el día 1. Busca que las features que sí están generen wow profundo.** Notion al lanzar no tenía 1000 integraciones, tenía una experiencia de bloques que se sentía como nada antes. Linear al lanzar no tenía todas las features de Jira, tenía velocidad y belleza que se sentían como nada antes. e-PetPlace al lanzar tendrá el expediente vivo de la mascota, el "antes/durante/después" del prestador impecable, la continuidad multi-actor visible, y el amor al oficio en cada detalle. **Eso solo, bien hecho, genera evangelistas.**

### El filtro y el tono: amor al oficio

El producto no es para todos los vets, ni para todos los paseadores, ni para todos los groomers, ni para todos los dueños. Es para **los que aman lo que hacen**.

El filtro de onboarding no es "¿cuántas sedes tenés?" ni "¿qué facturación tenés?". Es **"¿por qué te metiste en esto?"**. Suena cursi pero filtra perfecto: un vet apasionado, un paseador que ama caminar con perros, un dueño que trata a su mascota como hijo — todos comparten una vibra. e-PetPlace los reconoce y los junta.

Y el tono del producto refleja esa filosofía:
- Cálido y emocional sin sobreactuar.
- Adulto, nunca infantilizado.
- Honesto cuando algo falla ("Algo no salió bien. Reintentando...").
- Respetuoso de los momentos sensibles (memorial, fin de vida, condiciones graves).
- Lúdico en los momentos lúdicos, sin forzar humor en lo serio.

### Lo que estamos construyendo no es software, es una plataforma de vida

Si reducimos e-PetPlace a "el mejor software para vets de LatAm", perdimos. Si lo reducimos a "el Amazon de productos para mascotas", perdimos. Si lo reducimos a "el Tinder de los perros", perdimos.

**Lo que estamos construyendo es el lugar donde la vida de cada mascota tiene presencia digital con sustancia, donde el cuidado fluye sin fricción entre todos los que aman a esa mascota, y donde la comunidad de mascotas y dueños se encuentra alrededor del amor común por los animales.**

La meta no es competir con VetterPro, ni con IDEXX, ni con Rover, ni con MercadoLibre Mascotas. La meta es ser **el referente global del mundo mascota**. Latinoamérica primero porque es donde el founder está y donde la categoría está abierta. Después el mundo, porque la data + la red, replicada en escala, es defensible globalmente.

Es ambicioso. Si no apuntamos a la luna, no llegamos lejos.

---

## 2.5 Lo que e-PetPlace NO es

Saber qué es el producto importa. Saber qué **no** es importa tanto o más, porque define el filtro contra el feature creep, contra propuestas que parecen atractivas pero rompen la identidad del producto, contra atajos que llevan a competidores comerciales.

**e-PetPlace NO es un CRM veterinario.**
No competimos con VetterPro, IDEXX, ezyVet ni similares. Estos productos están diseñados para optimizar la operación de la clínica: facturación, agenda, inventario, recetas. e-PetPlace está diseñado para acompañar la vida de la mascota — el vet es contribuyente al ecosistema, no cliente del software. Si una feature mejora la operación interna de la clínica sin enriquecer el bio-expediente ni el cuidado de la mascota, **no es prioridad para nosotros**.

**e-PetPlace NO es Instagram de mascotas.**
La capa social (Capa 3) existe, pero **no es feed de fotos lindas como producto central**. Es la materialización pública y colectiva de una identidad real (Capa 1) que recibe cuidado documentado (Capa 2). Si quisieras solo subir fotos de tu mascota, Instagram lo hace mejor. e-PetPlace tiene capa social con sustancia: cada mascota tiene historia documentada, vínculos reales con prestadores, comunidad con razón de existir.

**e-PetPlace NO es una app de citas para humanos disfrazada de mascotas.**
Los "encuentros" entre mascotas (Capa 3) son con propósito (amistad, socialización, paseo en común), no con metáfora romántica. **No facilitamos matching para cría entre mascotas particulares** — decisión ética cerrada. La cría ética la canalizan criaderos certificados, no usuarios particulares.

**e-PetPlace NO es un marketplace genérico de productos para mascotas.**
La tienda existe (vía MediaLab + VTEX, detallada en `EPETPLACE.md`), pero no competimos en commodity con MercadoLibre ni Amazon. Vendemos productos integrados al bio-expediente: la compra de alimento se conecta con la nutrición de la mascota, el seller recomienda basado en data real, las compras enriquecen el expediente. **Si una transacción no agrega contexto al expediente, no abona al producto.**

**e-PetPlace NO es plataforma de cría.**
Decisión ética: no facilitamos reproducción entre mascotas particulares. Razones: sobrepoblación animal, refugios llenos, cría informal sin estándares, instrumentalización de la mascota. Los criaderos certificados son actores válidos del ecosistema con verificación estricta. La cría informal no tiene lugar en e-PetPlace.

**e-PetPlace NO es directorio pasivo.**
No somos "Páginas Amarillas de vets". El prestador no aparece y espera que lo llamen. **Gestionamos el flujo completo de la transacción**: booking, pago, historia clínica registrada, liquidación, soporte. El prestador usa e-PetPlace como su operador integrado, no como anuncio en directorio.

**e-PetPlace NO es software para "el dueño de mascotas estándar".**
El producto es para **los que aman a los animales**. Si alguien busca una app práctica para "gestionar a su perro" sin emoción ni vínculo, hay productos más livianos. Nuestro producto es más rico, más cálido, más exigente con el usuario porque asume amor real por la mascota. Eso filtra y eso conviene — los que se quedan son los que importan.

**e-PetPlace NO se mete con animales que no son mascotas de compañía.**
Ganado, animales silvestres, animales para consumo: fuera del scope. Equinos quedan como adyacencia futura (Fase 5+), no como parte del producto core. Cualquier propuesta de incluir animales fuera del marco de mascotas de compañía hay que evaluarla con el principio "amor a la mascota como hijo de la familia" — si no aplica, no pertenece.

**¿Por qué importa esta sección?**

Cuando alguien proponga una feature, una integración, un partnership, una expansión — vamos a tener la tentación de decir "interesante, lo hacemos". La lista de arriba es **el filtro de "no" rápido** para defender el producto de la dilución.

---

## 3. Las 3 capas del producto

### 3.0 Cómo leer esta sección

Antes de entrar al detalle, contexto importante para cualquier lector que llega a esta sección sin conocer el producto.

**Las 3 capas son dimensiones simultáneas, no fases secuenciales.** Una mascota recién registrada tiene actividad en las 3 capas desde el primer día: tiene identidad (Capa 1), recibe cuidado (Capa 2), eventualmente pertenece a una comunidad (Capa 3). Las capas conviven y se enriquecen mutuamente.

**El orden de presentación es lógico, no operativo.** Presento Capa 1 primero porque es la **base ontológica** — define qué es la mascota en e-PetPlace. Sin esa base, las otras dos capas se construyen sobre un sujeto vacío. Presento Capa 2 segundo porque es el **verbo principal** — qué se hace por la mascota. Presento Capa 3 al final porque es la **dimensión multiplicadora** — emerge naturalmente de las dos primeras y multiplica su valor.

**Cada capa tiene la misma estructura interna:**
- Tesis de la capa (qué resuelve, frase guía).
- Componentes detallados.
- Diferenciaciones por especie cuando aplican.
- Casos especiales o ediciones delicadas.
- Implicancias técnicas anotadas para sub-sesión futura.
- Cierre con frase guía.

**Cómo se entrelazan las capas (ejemplo concreto):**

Max es un beagle de 4 años. Su identidad (Capa 1) incluye que tiene alergia confirmada al polen y que le da miedo el secador. Eso lo sabemos porque a lo largo del tiempo el bio-expediente registró eventos (Capa 2): una consulta veterinaria diagnosticó la alergia, un grooming reportó miedo al secador. La Dra. Pérez adoptó el caso clínico de alergia (Capa 2). Cuando el paseador habitual recibe a Max, automáticamente sabe que está medicado por alergia (handshake de Capa 2) gracias a que esa información se compartió con consentimiento (decisión configurada en Capa 1). Si Max y Luna (otro beagle del barrio) son amigos (Capa 3), sus dueños pueden coordinar paseos juntos sabiendo que Luna también está vacunada y al día. Si la familia de Max se suma a la comunidad "Beagles de Quito" (Capa 3), recibe contenido específico sobre cuidado de la raza. Cada capa enriquece y depende de las otras.

**Eso es lo que hace al producto defensible.** Replicar una capa es relativamente fácil. Replicar las tres entrelazadas requiere años de captura y un modelo conceptual que muy pocos competidores tienen articulado.

---

### 3.1 Capa 1 — Identidad y vida de la mascota

#### Mini-índice de esta capa

| # | Punto | Qué resuelve |
|---|---|---|
| 3.1.0 | Tesis de la capa | Por qué la identidad es la base, qué pasa si está mal definida |
| 3.1.1 | Las 5 dimensiones de identidad | Biológica, personal, relacional, temporal, narrativa |
| 3.1.2 | Construcción progresiva | Cómo se enriquece la identidad sin formulario gigante |
| 3.1.3 | Visibilidad híbrida por dimensión | Qué es público, privado, configurable |
| 3.1.4 | Mascotas en situaciones especiales | Adopciones, fallecidas, perdidas, transferidas, identidad incierta |
| 3.1.5 | Implicancias técnicas anotadas | Notas para sub-sesión técnica futura |
| 3.1.6 | Señales prácticas para Claude y devs | Cuándo aplicar este modelo a decisiones reales |
| 3.1.7 | Anexo: Casos de ejemplo | Max (beagle) y Luna (loro gris). Identidad completa en concreto |
| 3.1.8 | Cierre de Capa 1 | Frase guía y cómo conecta con "wow desde día 1" |


#### 3.1.0 Tesis de la capa

Una mascota en e-PetPlace no es un registro en una tabla con `nombre`, `especie`, `raza`. Es una entidad con **cinco dimensiones de identidad** que se construyen progresivamente a lo largo de su vida, controladas por su familia humana, alimentadas por sus prestadores, visibles según reglas que la familia define.

> *"En e-PetPlace tu mascota no tiene un expediente. Tiene una vida documentada."*

La capa existe **aunque ninguna otra capa esté activa**. Una familia que solo usa e-PetPlace para registrar a su mascota sin contratar servicios ni participar en la comunidad debería seguir teniendo una experiencia valiosa: tener a su mascota presente digitalmente, con su historia, su personalidad, su gente. Esto es importante porque define el piso mínimo del valor del producto y porque garantiza que la mascota tiene presencia digital antes de que el ecosistema externo la toque.

#### 3.1.1 Las cinco dimensiones de identidad

##### Dimensión 1 — Identidad biológica

**Qué es:** los datos objetivos y verificables de la mascota como organismo biológico.

**Qué incluye:**
- Especie (perro, gato, conejo, ave, etc).
- Raza o tipo (si aplica; muchas mascotas mestizas o de especies donde no hay razas formales).
- Sexo.
- Fecha de nacimiento (exacta o estimada).
- Microchip si tiene.
- Características físicas: color, marcas distintivas, peso, talla.
- Estado reproductivo (entero, esterilizado, castrado).
- Origen documentado (criadero, refugio, calle, regalo, nacido en familia).

**Cómo se construye:**
- Al alta de la mascota (mínimo: nombre, especie, foto principal).
- Progresivamente: peso se va registrando, características físicas se enriquecen con fotos, microchip se agrega cuando se implanta.
- Por eventos del bio-expediente: cada control con vet registra peso; una intervención de esterilización actualiza estado reproductivo automáticamente.

**Por especie:**
- **Perro:** raza específica o mestizo (categoría legítima, no inferior). Talla relevante (toy, mini, mediano, grande, gigante).
- **Gato:** raza si aplica (siamés, persa, británico, mestizo doméstico de pelo corto/largo).
- **Conejo:** raza (holandés, mini lop, angora, etc) o "mestizo".
- **Ave:** especie específica más relevante que "raza" (cacatúa, agapornis, periquito, canario, loro gris). El concepto raza no aplica igual.
- **Reptil:** especie específica crítica (tortuga de tierra vs acuática, iguana verde vs negra). Tamaño esperado adulto es dato clave porque define manejo.
- **Pez:** especie específica, agua dulce o salada, comunitario o agresivo. El concepto "mascota individual" es más difuso (un acuario es comunidad).
- **Hurón:** raza no aplica, pero color y patrón sí. Estado vacunal específico (rabia, moquillo del hurón).
- **Cobaya/conejo/hámster/otros pequeños:** raza simple, edad estimada porque rara vez se conoce fecha exacta.

**Visibilidad default:** pública para usuarios autenticados de la app (no Google). Es la cara visible de la mascota.

##### Dimensión 2 — Identidad personal

**Qué es:** la personalidad, los gustos, los miedos, las manías. **Cómo la familia presenta a su mascota al mundo y a los prestadores.**

Esta dimensión **hoy no existe en ningún software del mercado** y es una de las diferenciaciones más importantes del producto. No es un campo `descripcion` libre — es estructura con propósito.

**Qué incluye:**
- **Personalidad:** rasgos generales ("tímido con desconocidos", "sociable con perros", "tranquilo en casa", "energético en exteriores", "territorial con otros gatos", "vocal").
- **Gustos:** comidas favoritas, juguetes preferidos, lugares amados, actividades que disfruta.
- **Miedos:** ruidos fuertes, tormentas, secadores, ciertos objetos, otros animales específicos.
- **Manías y rituales:** "siempre duerme con el peluche azul", "no come si hay otro animal cerca", "saluda subiendo a la falda".
- **Señales sutiles:** cómo expresa dolor, ansiedad, hambre, deseo de salir. Conocer estas señales hace la diferencia entre un buen cuidador y uno mediocre.

**Por qué es central:**
- Al **vet**: saber que "se pone agresivo si lo toca cualquier persona en la pata trasera izquierda" cambia la consulta antes de empezar.
- Al **groomer**: saber que "le da miedo el secador, hay que usar el ventilador" evita trauma.
- Al **paseador**: saber que "tira de la correa cuando ve ciclistas pero no cuando ve otros perros" cambia cómo lo cuida.
- Al **hotel**: saber que "no come si no escucha la voz de su dueño grabada" puede ser la diferencia entre estadía exitosa y emergencia.

**Por especie (esto es crítico — la identidad personal varía radicalmente):**
- **Perro:** alta variabilidad individual. Personalidad muy expresada.
- **Gato:** personalidad sutil pero existente. Más importante: dónde se esconde, qué tolera, qué no.
- **Conejo:** personalidad real (sí, los conejos tienen personalidad). Quién es "el del grupo", cómo reacciona al alzarlo.
- **Loros:** **enorme personalidad individual**. Algunos amigables con extraños, otros monogámicos con un solo humano. Qué dice (vocabulario), a quién muerde, qué le gusta.
- **Reptiles:** menos "personalidad" en sentido tradicional, pero sí preferencias y patrones (zona de termorregulación favorita, comportamiento en muda, agresividad estacional).
- **Peces:** mínimo a nivel individual, salvo especies cognitivamente complejas (bettas, ciertos cíclidos).

**Cómo se construye:**
- Onboarding mínimo no la requiere.
- Construcción progresiva en momentos oportunos. Después de la primera consulta veterinaria: "¿algo que debamos saber sobre la personalidad de Max?". Después de contratar el primer paseador: "¿qué le gusta y qué no le gusta en sus paseos?".
- Inferencia implícita por eventos: si el groomer reporta "ansioso con el secador" en tres visitas, el sistema sugiere agregar a la identidad personal "miedo al secador".

**Visibilidad default:** privada por default, con opt-in granular. **Pero con default razonable**: cuando un prestador acepta atender a la mascota, recibe automáticamente la información personal relevante para su rol (paseador recibe miedos relevantes para paseos, groomer recibe miedos relevantes para grooming, vet recibe todo). El dueño puede sobreescribir.

##### Dimensión 3 — Identidad relacional

**Qué es:** con quién vive la mascota y a quién conoce.

**Qué incluye:**

**Familia humana:**
- Co-dueños (titularidad plena, ver sección 4).
- Familiares autorizados adultos (abuela, hermanos, parejas no convivientes).
- Familiares autorizados menores (hijos, nietos — parte del vínculo afectivo).
- Cuidadores externos (vecinos de confianza, sitter habitual).

**Mascotas hermanas:**
- Otras mascotas de la misma familia (perro + gato + loro). Sus relaciones internas importan: ¿se llevan bien? ¿hay tensiones? ¿hay vínculos especiales?

**Prestadores habituales:**
- Vet de cabecera (puede no existir si la mascota no tiene controles regulares).
- Grooming habitual.
- Paseador habitual.
- Hotel donde se queda cuando la familia viaja.
- Entrenador si tiene.
- Estos surgen por **inferencia de uso** (después de 3 servicios con el mismo prestador, se sugiere como habitual) o por declaración explícita.

**Comunidad cercana:**
- Otras mascotas amigas (Capa 3).
- Grupos a los que pertenece (raza, barrio, condición).

**Por qué importa:**
- El hotel necesita saber que "Max vive con Luna (gata) y nunca estuvo separado de ella — considerar opción de hospedaje conjunto".
- El vet necesita saber que "la mascota anterior de esta familia murió de la misma condición — sensibilidad emocional importante en la consulta".
- Un paseador nuevo necesita saber "su paseador habitual es Carlos, se va de vacaciones 2 semanas".

**Por especie:**
- **Perro:** alta densidad relacional. Familia, prestadores múltiples, comunidad de paseo.
- **Gato:** familia, vet, posiblemente sitter. Pocos prestadores externos.
- **Conejo:** familia, vet exótico, posible compañero conejo.
- **Loro:** familia (a menudo monogámico con un humano específico), vet exótico, comunidad de dueños de loros muy fuerte.
- **Reptil/pez:** familia, vet exótico ocasional, comunidad de dueños expertos online.

**Visibilidad:** mixta. Familia humana puede ser pública o anónima según preferencia. Prestadores habituales son privados por default pero útiles para handshakes (Capa 2). Mascotas hermanas son visibles a los prestadores que las atienden.

##### Dimensión 4 — Identidad temporal

**Qué es:** **dónde está la mascota en su línea de vida.** No es solo edad — es **etapa**.

**Qué incluye:**
- Edad actual.
- Etapa vital actual: M0 (pre-adopción), M1 (llegada/cachorro), M2 (crecimiento/adolescente), M3 (adulto sano), M4 (adulto con condiciones), M5 (senior), M6 (fin de vida).
- Transiciones documentadas: cuándo pasó de M1 a M2, cuándo entró a M5, etc.
- Eventos hito de vida: fecha estimada de inicio de senior, fecha de diagnóstico de condición crónica, fecha de esterilización.

**Por qué la etapa importa más que la edad:**
- Un perro pequeño de 8 años está empezando senior; un perro grande de 8 años ya es senior pleno.
- Un gato de 12 años sano está en M5 pleno sin condiciones.
- Un perro de 5 años con diabetes diagnosticada está en M4 sin ser senior.
- Un loro de 25 años puede estar en M3 (adulto sano) porque su expectativa de vida es 50-60.

**Cómo se infiere:**
- Función `calcular_etapa_vida(fecha_nacimiento, especie)` ya implementada en DB (pendiente validación veterinaria — D-111 en backlog).
- Transición a M4 automática cuando se diagnostica condición crónica.
- Transición a M5 sugerida por edad/especie/raza, confirmada por el vet.
- Transición a M6 marcada por el vet de cabecera o por la familia cuando hay decisión de fin de vida.

**Por qué activa comportamientos del producto:**

La etapa **modifica qué hace la app**. Una mascota en M1 (cachorro) recibe un dashboard centrado en plan de vacunación, primer vet, primer paseador (cuando esté vacunada), socialización temprana. Una mascota en M5 (senior) recibe un dashboard centrado en controles, medicación activa, calidad de vida, frecuencia de chequeos aumentada.

**La misma app, distintas experiencias guiadas por la etapa vital.**

**Por especie (la temporalidad varía radicalmente):**

| Especie | Cachorro/cría | Adulto pleno | Senior | Expectativa promedio |
|---|---|---|---|---|
| Perro pequeño | 0-1 año | 2-9 años | 10+ años | 13-16 años |
| Perro mediano | 0-1.5 años | 2-7 años | 8+ años | 11-13 años |
| Perro grande | 0-2 años | 3-6 años | 7+ años | 8-10 años |
| Gato | 0-1 año | 2-9 años | 10+ años | 14-18 años |
| Conejo | 0-1 año | 2-5 años | 6+ años | 8-12 años |
| Loro pequeño (agapornis, periquito) | 0-1 año | 2-10 años | 11+ años | 12-15 años |
| Loro grande (gris africano, guacamayo) | 0-3 años | 4-30 años | 31+ años | 40-60 años |
| Tortuga de tierra | 0-5 años | 6-50 años | 51+ años | 60-100+ años |
| Hurón | 0-6 meses | 7m-4 años | 5+ años | 6-10 años |

Esta tabla ilustra por qué especie como modulador transversal es crítico. Un guacamayo de 25 años está en plena edad adulta; un hurón de 5 años ya es senior. **El producto no puede aplicar las mismas reglas a todos.**

**Visibilidad:** pública (etapa actual) para usuarios autenticados. Detalles internos privados.

##### Dimensión 5 — Identidad narrativa

**Qué es:** **la vida documentada de la mascota.** No los eventos clínicos sueltos — la **historia contada**.

**Esta es la dimensión que diferencia "expediente médico bonito" de "vida documentada".**

**Qué incluye:**

**Hitos de vida:**
- Llegada a la familia (con fecha y foto si hay).
- Primer día en casa.
- Primer cumpleaños celebrado.
- Primer paseo en lugar especial.
- Primer encuentro con la familia extendida.
- Primer baño, primer corte, primera vacuna.
- Primer amigo perro/gato/loro.
- Primera vez en la playa, en la nieve, en la montaña.
- Hitos de aprendizaje (aprendió a sentarse, dejó de hacer pis en la casa, aprendió palabra nueva si es loro).
- Hitos de salud (recuperación de cirugía, alta de tratamiento).
- Hitos especiales y específicos de la familia.

**Hitos retroactivos:**
- Mascotas que llegan adultas a e-PetPlace (adopción de mascota de 5 años, mascota cuyo dueño se registra años después) pueden cargar hitos del pasado con fechas estimadas.
- **Especial: mascotas con origen=adopcion/rescate** tienen un hito de primera clase: **"Una vida nueva empieza"**. La app honra explícitamente la historia de rescate. Esto no es decoración — es reconocimiento de que la vida documentada empieza desde donde la familia conoce a la mascota.

**Quién puede agregar hitos:**
- Co-dueños siempre.
- Familiares autorizados adultos según permisos.
- Familiares autorizados menores (especialmente importante): "el hijo escribió que Max y él aprendieron a andar en bici juntos". Los hitos contribuidos por menores tienen valor narrativo único y el producto los honra.

**Hitos públicos vs privados:**

Cada hito tiene visibilidad configurable:
- **Público** (compartido en Capa 3, visible para amigos de la mascota): cumpleaños, primer mar, conocer al mejor amigo.
- **Privado familiar** (visible para todos los miembros de la familia): hitos íntimos que no son para mostrar pero son para recordar.
- **Privado del humano que lo escribió** (visible solo para ese miembro): hitos profundamente personales. "Max me consoló cuando perdí a mi mamá".

**Los hitos privados del humano son de ese humano, no de la mascota.** Si esa persona deja la familia, su hito privado lo acompaña a su perfil personal — no migra con la mascota. Esto preserva la voz íntima de cada humano que cuidó a la mascota.

**Por especie:**
- **Perro:** alta densidad narrativa. Muchas oportunidades de hitos visibles (paseos, encuentros, cumpleaños).
- **Gato:** menos hitos visibles externos, más hitos íntimos del hogar ("aprendió a abrir la puerta", "se hizo amigo del nuevo bebé").
- **Conejo:** hitos del hogar y de la comunidad bunny (primer encuentro con otro conejo, primer paseo asistido).
- **Loro:** **hitos lingüísticos únicos** ("aprendió a decir su nombre", "imitó la voz del dueño"). Los dueños de loros documentan obsesivamente — el producto debe honrar esto.
- **Tortuga:** hitos en escala de décadas. "Cumplió 30 años con la familia". Esto es excepcional y emocionalmente potente.
- **Pez/invertebrados:** menos hitos individuales, más hitos del acuario/terrario como sistema.

**Visibilidad default:** privada por default. El dueño elige qué publicar.

#### 3.1.2 Construcción progresiva de la identidad

La identidad de la mascota **no se completa en el onboarding**. Se construye a lo largo del tiempo, en momentos oportunos, sin forzar al dueño a llenar formularios largos.

**Estrategia de construcción en tres modos:**

**Modo 1 — Alta mínima al registrar.**
Lo absolutamente necesario para que la mascota exista en el sistema:
- Nombre.
- Especie.
- Foto principal (opcional pero altamente sugerida).
- Sexo y fecha de nacimiento aproximada.

Esto debería tomar **menos de 2 minutos**. Sin fricción. El resto se construye después.

**Modo 2 — Construcción progresiva en momentos oportunos.**
La app **invita** a enriquecer la identidad en momentos donde tiene sentido contextual:

- Después de la primera consulta veterinaria: *"Ahora que conociste al vet de Max, ¿hay algo de su personalidad que sea importante que quede registrado?"*
- Después del primer grooming: *"¿Cómo se portó Max en el grooming? ¿Algo a recordar para la próxima?"*
- Cuando la familia carga 5 fotos: *"Max está creciendo. ¿Querés agregar un hito a su vida?"*
- En el cumpleaños de la mascota (calculado por fecha de nacimiento): *"Hoy Max cumple X años. ¿Querés escribir cómo lo celebraste?"*
- Cuando un prestador termina un servicio y reporta algo significativo: *"El paseador notó que Max es sociable con perros pequeños. ¿Sumamos esto a su personalidad?"*

**El producto invita, nunca obliga.** El dueño puede cerrar la invitación y la app no insiste por días. Si la cierra repetidas veces, deja de sugerir esa categoría.

**Modo 3 — Inferencia implícita.**
El sistema deriva información sin pedirla:
- "Notamos que llevás a Max al groomer de Pati hace 6 meses, ¿lo agregamos como groomer habitual?" → identidad relacional enriquecida.
- "Después de la cirugía de esterilización, ¿cómo está Max?" → permite hito narrativo sin estructura forzada.
- Reportes de prestadores que coinciden ("ansioso con secador" en 3 visitas) → sugerencia de actualización de identidad personal.

#### 3.1.3 Visibilidad híbrida por dimensión

Decisión ratificada (modelo híbrido): cada dimensión tiene su propia regla de visibilidad default, con override por los co-dueños siempre disponible.

**Default visible para usuarios autenticados de la app (no Google ni externos):**
- Identidad biológica básica (nombre, especie, raza, foto, sexo, edad aproximada).
- Identidad temporal (etapa actual).

**Default privado, con opt-in granular para compartir:**
- Identidad personal (personalidad, gustos, miedos, manías).
- Identidad relacional detallada (familia humana, mascotas hermanas).
- Identidad narrativa (hitos, historia, fotos).

**Compartido con prestadores específicos cuando se autoriza el acceso:**
- Identidad personal relevante para el rol (paseador recibe miedos relevantes, groomer recibe sensibilidades, vet recibe todo).
- Identidad relacional operativa (prestadores habituales para handshakes).

**Siempre privado (no compartible aunque los co-dueños quisieran):**
- Datos financieros (compras, costos).
- Ubicación precisa (dirección).
- Identificadores como microchip (visible al vet, no público).

**Configuración por mascota:**
- **Modo discoverable:** otros usuarios pueden encontrarla en búsquedas y comunidades.
- **Modo solo amigos:** solo aparece para mascotas amigas (relación bidireccional aceptada).
- **Modo privado total:** solo los co-dueños la ven en la app, no aparece socialmente.

**Default por especie:**
- Perros: modo discoverable.
- Gatos: modo solo amigos (cultural: dueños de gatos son más privados).
- Exóticos (loros, conejos, hurones, reptiles): modo discoverable (dueños suelen ser comunidad orgullosa).

#### 3.1.4 Mascotas en situaciones especiales

##### Mascotas con origen=adopcion/rescate

La app honra explícitamente la historia previa. **"Una vida nueva empieza"** es un hito narrativo de primera clase, no un campo de formulario más. La fecha de adopción es marcada como hito celebratorio anual ("hoy hace 3 años que Max vino a casa").

La identidad pre-adopción es respetada como **no conocida**, no como "datos faltantes":
- Edad: "estimada ~3 años al momento de la adopción".
- Origen: "rescatado de la calle" / "adoptado de Refugio X" / "transferido de familia anterior".
- Historia previa: "vivió en la calle antes de la adopción" — un dato emocional, no un déficit.

##### Mascotas fallecidas

**La identidad NO se borra.** El expediente se preserva como **memorial** (detalle en Capa 3, sección 3.3.E).

Cambios al cruzar a estado fallecida:
- Etapa vital se actualiza a "fallecida" con fecha.
- Notificaciones cotidianas se silencian (no más recordatorios de vacuna, no más sugerencias de servicios).
- Hitos narrativos se preservan completos.
- Hitos privados de cada humano se preservan en sus respectivos perfiles.
- El perfil pasa a "modo memorial" — la familia decide visibilidad (privada / amigos cercanos / pública).

**El producto respeta el duelo.** No hay "Max cumple años hoy" como notificación activa — si la familia lo quiere, hay opción de "recordar a Max en su aniversario" con tono respetuoso.

##### Mascotas perdidas

Estado distinto de "fallecida". Estado activo:
- Alerta comunitaria visible para usuarios cercanos geográficamente.
- Notificaciones a prestadores en el área.
- Integración con refugios locales si la mascota aparece.
- Hitos especiales: "primer día buscando a Max", "Max regresó a casa".

Si la búsqueda termina sin recuperación después de tiempo prolongado, la familia decide cuándo (o si) cambiar a estado fallecida.

##### Mascotas transferidas a otra familia

**El historial completo viaja con la mascota** (decisión ratificada). La nueva familia recibe el expediente completo. Antiguos co-dueños mantienen sus hitos privados en sus propios perfiles. No hay "historial compartido entre familias" — la pertenencia presente es única.

Casos típicos:
- Adopción tardía (mascota cuyo dueño no puede seguir cuidándola).
- Cambio generacional (mascota que pasa de hijo adulto a padres).
- Mudanza internacional donde la mascota no puede viajar y queda con familiares.

En todos los casos: handshake explícito entre familias, doble confirmación, transferencia auditada, expediente intacto.

##### Mascotas con identidad incierta

A veces la familia adopta una mascota cuya especie/raza exacta no conoce ("es un mestizo, no sabemos qué tiene"). El producto **no exige certeza**:
- "Mestizo" es categoría legítima, no inferior.
- "Especie probable: perro" con opciones de actualización si después se confirma.
- Estimaciones de edad, peso, raza con marcador "estimado" hasta confirmación profesional.

##### Estados de vida de la mascota (decisión técnica cerrada en S16)

`mascotas.estado_vida` tiene 3 valores, no 4:

- **`activa`** — default. Mascota viva, en familia, con notificaciones activas.
- **`perdida`** — extravío reportado. Activa alerta comunitaria (con ciclo de vida propio independiente del estado).
- **`fallecida`** — fin de vida. Silencia notificaciones cotidianas, expediente queda en memorial.

El estado `transferida` **no existe** como valor de `estado_vida`. Una transferencia entre familias se modela como cambio de `mascotas.familia_id` + evento auditado `transferencia_familia` en `eventos_mascota`. La mascota anterior queda invisible para la familia anterior (vía RLS al cambiar `familia_id`), no requiere estado intermedio.

Los vínculos `mascota_codueño` anteriores se cierran (`hasta=now()`, `motivo_cierre='transferencia'`) pero se preservan como historial. Esto materializa el "ex co-dueño histórico" sin tabla adicional.

#### 3.1.5 Implicancias técnicas anotadas (no decididas acá)

Estas son notas para la sub-sesión técnica cuando lleguemos a implementar Capa 1 plenamente. Se anotan para que no se pierdan.

- **Schema de identidad personal:** tabla nueva, probablemente `evento_rasgo_identidad_personal` con tipos (personalidad, gusto, miedo, mania, ritual) y campos específicos por tipo. Decisión: jsonb único o múltiples tablas tipadas.
- **Schema de hitos narrativos:** `evento_hito_narrativo` con tipos (llegada, primer_*, cumpleaños, aprendizaje, salud, especial). Permite fecha retroactiva.
- **Schema de hitos privados:** `evento_hito_narrativo_privado` con FK al miembro de la familia que escribió. Separado del público para preservar privacidad.
- **Estado de la mascota:** flag `mascota.estado_vida` ∈ {activa, perdida, fallecida, transferida}. Estado transferida se cierra con transferencia explícita.
- **Modo discoverable:** `mascota_perfil_publico_config` con configuración por dimensión.
- **Tabla `cat_etapas_vida`:** los 7 momentos vitales (M0-M6) como catálogo con descripciones y umbrales por especie.
- **`calcular_etapa_vida` ya existe** (D-111 pendiente validación veterinaria).

Las decisiones específicas de schema se toman cuando llegue el momento de implementar. Lo que importa de esta sección es **qué necesita representar el schema**, no cómo lo representa exactamente.

#### 3.1.6 Señales prácticas para Claude y devs

Esta sub-sección convierte el modelo de Capa 1 en **herramienta operativa**. Cuando enfrentes una de estas situaciones, este es el principio que aplica.

> **Cuando un dev te pida diseñar el form de alta de mascota:** este documento dice "alta mínima en menos de 2 minutos, resto construcción progresiva" (3.1.2). **No diseñes wizard de 8 pasos.** Pedí nombre, especie, foto, sexo y fecha aproximada. Todo lo demás se enriquece después.

> **Cuando alguien proponga un campo "descripción libre" para la mascota:** este documento dice que identidad personal tiene estructura (personalidad, gustos, miedos, manías, rituales — 3.1.1 Dimensión 2). **No es campo libre — es estructura con propósito.** El estructurado permite que el groomer reciba miedos relevantes y el paseador reciba miedos relevantes para su rol, automáticamente.

> **Cuando enfrentes una decisión de visibilidad por default de un dato de mascota:** Capa 1 tiene visibilidad híbrida (3.1.3). Identidad biológica básica = pública para usuarios autenticados. Identidad personal = privada con opt-in granular. Datos clínicos/financieros = siempre privados. **Si dudás, default privado.**

> **Cuando se proponga una feature que asume "todos los dueños son perros":** parar. El modelo es multi-especie con 4 niveles (sección 5). **Cualquier feature de Capa 1 debe contemplar perros, gatos, conejos, aves, reptiles, peces.** El producto NO es para perros.

> **Cuando una mascota muera y haya que diseñar el flujo:** la identidad NO se borra (3.1.4). Pasa a memorial preservado. Notificaciones se silencian. Los hitos privados del humano quedan en el perfil del humano. **No es feature trivial — es momento delicado emocionalmente y se diseña con sub-sesión específica.**

> **Cuando alguien proponga "Cómprales productos a tu mascota" como feature antes de que la mascota tenga identidad rica:** invertí el orden. **Primero identidad, después transacciones.** La transacción enriquece al expediente, pero solo si el expediente tiene contexto donde colgarla. Una compra de alimento sobre mascota con nombre, especie y nada más es transacción anónima. Una compra de alimento sobre mascota con peso registrado, edad, alergias, plan nutricional sugerido por vet = transacción inteligente.

> **Cuando alguien propone permitir "perfil 100% público de mascota visible en Google":** rechazar. Datos básicos visibles para usuarios autenticados ≠ públicos en internet. Hay diferencia importante: cualquier persona en e-PetPlace puede buscar mascotas; Google y bots no. Esto es protección razonable contra scraping y dudosos.

> **Cuando una mascota llega "sin papeles" y el dev quiera bloquear el alta hasta saber raza/edad/etc:** este documento dice que mestizo es categoría legítima, edad estimada es válida, especie probable es válida (3.1.4). **No bloqueés alta por incertidumbre.** El producto la registra y la enriquece progresivamente.

#### 3.1.7 Anexo: Casos de ejemplo

Para que cualquier lector vea cómo se materializa todo lo anterior en concreto.

##### Caso 1 — Max, beagle de 4 años

**Cómo llegó al producto:**
La familia Pérez (Juan, María, hijo Tomás de 10 años) registró a Max en e-PetPlace cuando era cachorro de 2 meses, hace 4 años. Alta mínima inicial: nombre, especie, raza, sexo, foto, fecha estimada de nacimiento.

**Identidad biológica:**
- Especie: perro. Raza: beagle. Sexo: macho. Castrado a los 8 meses. Peso actual: 12.8 kg.
- Microchip: 982000123456789, registrado por la primera vet.
- Marcas distintivas: mancha blanca en pecho con forma de corazón, oreja derecha más caída que la izquierda.

**Identidad personal:**
- Personalidad: sociable con perros chicos, indiferente con perros grandes. Energético en exteriores, tranquilo en casa.
- Gustos: comida favorita pollo hervido, juguete favorito una cuerda azul, ama nadar.
- Miedos: tormentas eléctricas (se mete debajo de la cama), aspiradora.
- Manías: siempre duerme a los pies de Tomás, no come si hay otro perro cerca.
- Rituales: pide salir a la misma hora cada mañana, se pone alerta cuando suena la llave de la puerta.

**Identidad relacional:**
- Familia humana: Juan (co-dueño), María (co-dueña), Tomás (familiar autorizado menor).
- Mascotas hermanas: Luna, gata mestiza de 3 años. Se llevan bien, Luna lo ignora.
- Prestadores habituales: Dra. Pérez (vet de cabecera), Carlos (paseador), Pati's Grooming (groomer cada 2 meses).
- Comunidad: parte de "Beagles de Quito" en e-PetPlace, 47 miembros.

**Identidad temporal:**
- Edad: 4 años 3 meses.
- Etapa vital: M3 (adulto sano).
- Transiciones documentadas: M1 a M2 a los 6 meses, M2 a M3 a los 18 meses.

**Identidad narrativa:**
- Hitos públicos: "Llegada a casa" (con foto), "Primer cumpleaños", "Primera vez en la playa" (foto en Salinas), "Mejor amigo: Luna".
- Hitos privados familiares: "Aprendió a sentarse en 2 días", "Acompañó a Tomás en su primer día sin papá en casa".
- Hitos privados individuales: Juan escribió "Max me sacó a caminar cuando estaba deprimido". Tomás escribió "Max y yo aprendimos a andar en bici juntos".
- Hito retroactivo: "Una vida nueva empieza" no aplica porque Max llegó cachorro de criadero, no de adopción.

**Visibilidad configurada:**
- Modo discoverable activado (perro, default).
- Identidad biológica: pública.
- Identidad personal: compartida automáticamente con prestadores habituales (Dra. Pérez ve todo, Carlos ve miedos relevantes para paseo, Pati's Grooming ve sensibilidades de piel).
- Hitos narrativos: 60% públicos, 30% privados familiares, 10% privados individuales.

##### Caso 2 — Luna, loro gris africano de 12 años

**Cómo llegó al producto:**
La familia Vargas (Sofía, soltera) adoptó a Luna hace 4 años cuando tenía 8 años. Su dueña anterior tuvo que dejarla por mudanza internacional. Sofía registró a Luna en e-PetPlace al año de tenerla, hace 3 años.

**Identidad biológica:**
- Especie: ave. Tipo: loro gris africano (Psittacus erithacus). Sexo: hembra. Peso: 410 g.
- Sin microchip (no es estándar en aves).
- Características: anillo de pata identificador del criadero original "AFR2014".

**Identidad personal:**
- Personalidad: vocal, monogámica con Sofía, agresiva con extraños masculinos.
- Gustos: pistachos, le encanta cuando Sofía canta, ama mirar por la ventana.
- Miedos: sombreros (¿trauma anterior?), aspiradora, ruidos fuertes.
- Manías: imita el sonido del microondas, dice "hola" cuando alguien entra al departamento.
- Vocabulario: ~30 palabras españolas, "hola", "Sofía", "qué quieres", "bonita".
- Rituales: come exactamente a las 8 AM y 6 PM, sale de la jaula 4 horas al día.

**Identidad relacional:**
- Familia humana: Sofía (co-dueña única, soltera).
- Mascotas hermanas: ninguna.
- Prestadores habituales: Dr. Mendoza (vet exótico, controles cada 6 meses).
- Comunidad: parte de "Loros Grises de LatAm" en e-PetPlace, 23 miembros muy activos.

**Identidad temporal:**
- Edad: 12 años (confirmada por anillo del criadero).
- Etapa vital: M3 (adulto pleno). Para loro gris, M3 es 4-30 años — Luna está en plenitud.
- Expectativa: 40-60 años. Sofía sabe que Luna probablemente la sobreviva si no toma decisiones de tutela.

**Identidad narrativa:**
- Hitos públicos: "Aprendió 5 palabras nuevas en marzo 2024", "Primer chequeo con Dr. Mendoza".
- Hitos privados familiares: "Día que Luna llegó a casa", "Primera vez que dijo 'Sofía'".
- Hitos privados individuales (Sofía): "Luna fue mi compañía durante el COVID", "Luna me hizo reír cuando perdí a mi padre".
- Hito retroactivo importante: **"Una vida nueva empieza"** marcado con fecha de adopción. Sofía documentó la transición de su dueña anterior con cariño.

**Visibilidad configurada:**
- Modo discoverable activado (default para exóticos, dueños suelen ser comunidad orgullosa).
- Identidad biológica: pública.
- Identidad personal: privada con opt-in. Sofía decidió compartir vocabulario y manías con la comunidad "Loros Grises de LatAm" porque la comunidad valora estos detalles.
- Hitos: 40% públicos en comunidad nicho, 60% privados.

**Tutela post-mortem (relevante para esta especie):**
- Sofía configuró en su perfil que si ella muere, Luna pasa a su hermana Cecilia (también dueña de un loro). e-PetPlace no resuelve tutela legal pero registra la intención y notifica a Cecilia para que entienda el compromiso.
- Esta configuración es excepcional pero aplica fuertemente a especies de larga vida (loros grandes, tortugas).

##### Lo que estos casos enseñan al lector

1. **El modelo de 5 dimensiones funciona para especies muy distintas.** Beagle y loro tienen ambas identidad rica articulada.
2. **Hito "Una vida nueva empieza"** se activa en Luna (adoptada) y no en Max (cachorro de criadero).
3. **Multi-actor es real**: Max tiene 3 prestadores habituales, Luna tiene 1 (vet exótico). El modelo se ajusta.
4. **Identidad personal cambia el cuidado**: Pati's Grooming sabe automáticamente que Max ama nadar pero no dice nada sobre Luna; Dr. Mendoza sabe que Luna es agresiva con varones para preparar la consulta.
5. **Hitos privados del humano son íntimos**: Juan, Tomás y Sofía tienen sus voces propias que la mascota acompaña pero no posee.
6. **Etapa vital varía por especie**: Max a 4 años está en plenitud (M3); un loro de 4 años apenas sería adulto temprano.

#### 3.1.8 Cierre de Capa 1

> *"En e-PetPlace tu mascota no tiene un expediente. Tiene una vida documentada."*

**Cómo Capa 1 contribuye al "wow desde día 1":**

Cuando un dueño nuevo registra a su mascota y abre la app por primera vez después de 2 semanas de uso, debería ver **mucho más que un perfil con foto y datos básicos**. Debería ver:

- Su mascota con personalidad propia visible.
- Hitos ya registrados o sugeridos para registrar.
- Avatar, etapa vital, peso, datos enriquecidos sin haber llenado formularios.
- Quién la conoce: el vet con quien tuvo primera consulta, el paseador habitual sugerido por inferencia.
- Su lugar en una comunidad: "Beagles de Quito" o "Loros Grises de LatAm".

**Eso es el wow.** Otros productos te muestran un registro plano. e-PetPlace te muestra a **tu mascota viva digitalmente**. Esa diferencia entre "registro de mascota" y "vida documentada de mascota" es lo que hace al producto inolvidable desde el primer encuentro.

Sin Capa 1 bien construida, Capa 2 es un sistema de cuidado sobre un sujeto vacío, y Capa 3 es feed de fotos sin sustancia. **Con Capa 1 bien construida, la mascota existe digitalmente con peso real, y el resto se construye sobre algo que vale la pena cuidar y compartir.**

---

### 3.2 Capa 2 — Cuidado integral a lo largo de la vida

#### Mini-índice de esta capa

| # | Punto | Qué resuelve |
|---|---|---|
| 3.2.0 | Tesis de la capa | Por qué el cuidado es un proceso continuo, no transacciones aisladas |
| 3.2.1 | Los 7 momentos vitales (M0-M6) | Cómo cambia el producto según etapa de la mascota |
| 3.2.2 | Los 8 JTBDs base | Las tareas que la mascota y su familia necesitan resolver |
| 3.2.3 | Matriz JTBD × Momento × Especie × Actor | Quién hace qué, cuándo, para qué mascota |
| 3.2.4 | Adopción de caso clínico | El vet no atiende consultas, adopta casos |
| 3.2.5 | Motor de alertas y seguimientos | El sistema persigue el bienestar, no espera que la familia recuerde |
| 3.2.6 | Visibilidad cruzada inteligente | Cada actor ve lo relevante para su rol |
| 3.2.7 | Handshakes entre actores | Eliminación del router humano falible |
| 3.2.8 | Mascotas en situaciones especiales | Condiciones crónicas, mascotas viajeras, multi-vet, segunda opinión |
| 3.2.9 | Implicancias técnicas anotadas | Notas para sub-sesión técnica futura |
| 3.2.10 | Señales prácticas para Claude y devs | Cuándo aplicar este modelo a decisiones reales |
| 3.2.11 | Anexo: Caso de ejemplo extendido | El cuidado de Max a lo largo de un año real |
| 3.2.12 | Cierre de Capa 2 | Frase guía y cómo conecta con "wow desde día 1" |

#### 3.2.0 Tesis de la capa

El cuidado de una mascota no es una secuencia de transacciones independientes con prestadores distintos. Es **un proceso continuo, dividido en momentos vitales, donde cada momento activa necesidades distintas que cruzan a múltiples actores que en realidad están cuidando a la misma criatura aunque hoy no se hablen entre sí**.

> *"e-PetPlace no es donde reservás una cita. Es donde tu mascota es cuidada."*

Software tradicional modela "transacciones independientes": cita → cobro → fin. e-PetPlace modela "procesos vitales continuos": la cita es un capítulo de un proceso más grande (vacunación anual, control de alergia, transición a senior) que se extiende en el tiempo y cruza actores.

Esto **cambia el modelo mental del producto y del schema**:
- Una cita no es punto, es nodo de un proceso.
- Un vet no atiende, adopta un caso.
- Un paseador no pasea, contribuye al cuidado.
- Una compra de alimento no es venta, es evento nutricional.
- El sistema no espera instrucciones, persigue activamente el bienestar.

#### 3.2.1 Los 7 momentos vitales (M0-M6)

Una mascota pasa por 7 momentos vitales, cada uno con necesidades, actores y comportamientos distintos del producto. El producto **sabe en qué momento está cada mascota y activa cosas en consecuencia** — esto NO es feature, es **disposición permanente del sistema**.

##### M0 — Pre-adopción

**Quién está en M0:** humanos que están considerando o buscando mascota. La mascota como individual aún no existe en e-PetPlace, pero el usuario ya entra al ecosistema.

**Necesidades activas:**
- Información honesta sobre responsabilidad de tener mascota.
- Conocer especies y razas adecuadas para su contexto (departamento vs casa, niños vs no, presencia diaria vs viajes frecuentes).
- Encontrar refugios cercanos con mascotas disponibles.
- Encontrar criaderos certificados si busca raza específica.
- Educación previa para llegada (preparación de hogar, primeros días).

**Actores que se activan:**
- Refugios (prioridad alta — el producto educa hacia adopción consciente).
- Criaderos certificados (verificación estricta).
- Vets para consultas pre-adopción (rara pero existe).
- Comunidad de e-PetPlace (otros dueños comparten experiencia por raza/especie).

**Por qué importa:** captura al humano antes que la competencia. Cuando la mascota llega, el ecosistema ya está conectado.

##### M1 — Llegada (cachorro recién traído o adopción adulta)

**Quién está en M1:** mascotas que acaban de llegar a la familia. Puede ser cachorro de 2 meses o adulto adoptado de 5 años — lo que define M1 no es la edad sino **la novedad del vínculo familia-mascota**.

**Necesidades activas:**
- Chequeo veterinario inicial.
- Plan de vacunación armado con vet.
- Desparasitación.
- Microchip si no tiene.
- Identidad biológica completa registrada.
- Identidad personal en construcción (la familia está conociéndola).
- Si cachorro: socialización temprana (crítica para perros y gatos).
- Si adopción adulta: adaptación al hogar, posibles consultas conductuales.
- Onboarding rico al producto (la familia carga fotos, escribe los primeros hitos).

**Actores que se activan:**
- Vet (intensivo en primeros 3-6 meses de M1).
- Seller (alimento de cachorro, accesorios iniciales, productos básicos).
- Grooming (primer corte si aplica especie/raza, acostumbramiento).
- Paseador (solo cuando vacunación completa, para perros).
- Entrenador (socialización en cachorros, conducta en adopciones).

**Duración típica:** 3-6 meses, variable por especie y origen.

**Comportamiento del producto en M1:**
- Dashboard centrado en "plan de vacunación + identidad básica + buscar vet de cabecera".
- Sugerencias proactivas: "es momento de la segunda dosis de vacuna polivalente", "considerá agregar foto de la primera consulta como hito".
- Conexión con comunidad de cachorros/adopciones recientes.
- Onboarding rico de la identidad personal.

##### M2 — Crecimiento (cachorro/adolescente)

**Quién está en M2:** mascotas que completaron su llegada y están creciendo hacia adultez. Periodo de máximo cambio físico y conductual.

**Necesidades activas:**
- Completar plan de vacunación.
- Decisión sobre esterilización/castración (con vet).
- Transición alimentaria de cachorro a adulto.
- Controles de peso/talla regulares.
- Educación básica (perros principalmente).
- Primeros paseos sociales (perros).
- Primeras estadías de prueba en hotel (mascota se acostumbra antes de estadía larga).

**Actores que se activan:**
- Vet (controles regulares, cirugía esterilización).
- Entrenador (educación básica).
- Paseador (paseos progresivos en intensidad).
- Seller (transición alimentaria, productos de crecimiento).
- Hotel (primera estadía corta).
- Grooming (primer corte completo si aplica).

**Duración típica:** 6 meses a 2 años, variable por especie y raza.

**Comportamiento del producto en M2:**
- Dashboard centrado en "crecimiento + educación + primeros servicios habituales".
- Sugerencias contextuales: "Max ya tiene 6 meses, considerá esterilización con Dra. Pérez", "hora de transición a alimento adulto".
- Conexión con comunidad de cachorros de la misma edad ("Cachorros nacidos en marzo 2026").

##### M3 — Adulto sano (vida estable)

**Quién está en M3:** mascotas en plenitud, sin condiciones crónicas, con cuidado de mantenimiento.

**Por qué este es el momento más importante para retención del producto:**

M3 es **el momento más largo de la vida de la mascota — años y años**. Una mascota en M3 vive el producto sin urgencias, con rutinas. La calidad del producto en M3 define si la familia se queda o se va.

**Necesidades activas:**
- Controles veterinarios anuales.
- Vacunación de mantenimiento.
- Peso estable.
- Paseos regulares (perros).
- Grooming periódico.
- Alimentación adecuada.
- Estadías cuando la familia viaja.
- Vida social de la mascota (Capa 3 activa).

**Actores que se activan (rutina, no urgencia):**
- Vet (controles anuales, vacunación de refresco).
- Paseador habitual.
- Groomer habitual.
- Hotel habitual.
- Seller (alimento mensual).

**Duración típica:** años. Para perros pequeños/gatos: 2-9 años. Para loro grande: 4-30 años.

**Comportamiento del producto en M3:**
- Dashboard sereno, con rutinas claras.
- "Hoy es día de control anual" como recordatorio cómodo.
- Énfasis en hitos narrativos (la mascota tiene vida cotidiana rica para documentar).
- Comunidad activa (la familia tiene tiempo para participar en Capa 3).
- Sugerencias de optimización: "Max va al groomer cada 2 meses, considerá plan trimestral con descuento".

##### M4 — Adulto con condiciones (manejo crónico)

**Quién está en M4:** mascotas con condición crónica diagnosticada (diabetes, artrosis, alergia, cardiopatía, insuficiencia renal, hipotiroidismo, etc).

**Transición a M4:** automática cuando se registra evento `condicion_cronica_diagnosticada` en el bio-expediente. Puede ocurrir en cualquier edad — un perro de 4 años con diabetes está en M4 sin ser senior.

**Necesidades activas:**
- Monitoreo continuo de la condición específica.
- Medicación regular.
- Ajustes de actividad según condición.
- Alimentación especializada (frecuentemente prescrita).
- Comunicación cruzada entre actores ("el paseador necesita saber que está medicado", "el groomer necesita saber que tiene la piel sensible por dermatitis").
- Controles más frecuentes que en M3.
- Apoyo emocional a la familia (recibir diagnóstico es difícil).

**Acá vive el "vet tratante / adopción de caso" (detalle en 3.2.4).**

**Actores que se activan:**
- Vet tratante del caso (más allá del vet de cabecera).
- Vet de cabecera para temas no relacionados con la condición.
- Paseador habitual (informado del manejo).
- Groomer habitual (informado de sensibilidades).
- Seller (alimentación especializada).
- Hotel (informado de medicación si hay estadía).
- Comunidad por condición (otros dueños con misma condición — alto valor).

**Comportamiento del producto en M4:**
- Dashboard prominente con la condición activa.
- Recordatorios estrictos de medicación.
- Motor de alertas vigilante (cambios de peso, alertas de prestadores, ausencia de seguimiento).
- Conexión con comunidad de condición específica.
- Sugerencias de educación sobre la condición.

##### M5 — Senior (vejez y calidad de vida)

**Quién está en M5:** mascotas en edad avanzada para su especie/raza.

**Transición a M5:** sugerida por edad/especie/raza (función `calcular_etapa_vida`), confirmada por el vet. No es automática porque tiene componente emocional (la familia puede no estar lista para llamar "senior" a su mascota).

**Necesidades activas:**
- Controles más frecuentes (cada 6 meses idealmente).
- Vacunación ajustada (algunas se espacian, otras se mantienen).
- Ajuste de actividad (menos intensidad, mismo cariño).
- Alimentación senior.
- Manejo de dolor articular si aplica.
- Monitoreo de cambios cognitivos (demencia canina/felina es real).
- Calidad de vida sobre cantidad.
- Documentación más intencional de la identidad narrativa (la familia siente que el tiempo cuenta).

**Actores que se activan:**
- Vet (controles más frecuentes, evaluación geriátrica).
- Paseador habitual (paseos más cortos y suaves).
- Groomer habitual (más gentil, sesiones más cortas).
- Hotel habitual (cuidado especial).
- Seller (alimento senior, suplementos articulares).

**Comportamiento del producto en M5:**
- Dashboard con énfasis en calidad de vida, no en performance.
- Sugerencias de chequeos geriátricos.
- Apoyo emocional sutil: "Max es senior. Estos años son especiales".
- Motor de alertas aumenta vigilancia (cambios sutiles importan más).
- Sugerencias para documentar más hitos narrativos en este momento.

**Duración:** años en muchas especies, menos en otras (perros grandes, hurones).

##### M6 — Fin de vida (despedida y duelo)

**Quién está en M6:** mascotas en fase terminal o con decisión cercana sobre fin de vida.

**Transición a M6:** marcada por el vet de cabecera o por la familia cuando hay decisión de fin de vida. Es decisión sensible — el producto no la fuerza, la acompaña.

**Necesidades únicas:**
- Orientación clínica honesta sobre pronóstico.
- Decisiones de eutanasia humanizada cuando corresponde.
- Cremación o entierro.
- **Acompañamiento al duelo de la familia** (esto es responsabilidad del producto, no solo del vet).
- Preservación del memorial (Capa 3).
- Eventualmente, apoyo para una nueva mascota cuando la familia esté lista (con respeto, nunca como push).

**Actores que se activan:**
- Vet de cabecera (acompañamiento de decisión).
- Servicio de fin de vida (eutanasia, cremación, entierro).
- Comunidad (otros que han pasado por esto pueden acompañar emocionalmente).

**Comportamiento del producto en M6:**
- Dashboard se transforma a tono respetuoso.
- Notificaciones cotidianas se silencian preventivamente.
- Sugerencias suaves de documentación de últimos hitos.
- Información de servicios de fin de vida disponibles.
- Apoyo emocional: links a comunidad de duelo, posibilidad de pedir acompañamiento.

**Este es un momento donde el producto puede generar lealtad de por vida si lo hace bien, o destruirla si lo hace mal.** Detalle de diseño se trata en sub-sesión específica de memorial (Capa 3, sección 3.3.E).

##### Por especie — variaciones críticas en momentos vitales

Tabla de duración aproximada por especie. Los valores son guías, no absolutos:

| Especie | M1 (llegada) | M2 (crecim.) | M3 (adulto sano) | M5 (senior) |
|---|---|---|---|---|
| Perro pequeño | 0-6m | 6m-1.5a | 2-9a | 10+a |
| Perro mediano | 0-6m | 6m-2a | 3-7a | 8+a |
| Perro grande | 0-6m | 6m-2a | 3-6a | 7+a |
| Gato | 0-6m | 6m-1a | 2-9a | 10+a |
| Conejo | 0-3m | 3m-1a | 2-5a | 6+a |
| Loro pequeño (agapornis) | 0-6m | 6m-1a | 2-10a | 11+a |
| Loro grande (gris africano) | 0-1a | 1-3a | 4-30a | 31+a |
| Tortuga de tierra | 0-2a | 2-5a | 6-50a | 51+a |
| Hurón | 0-3m | 3m-1a | 1-4a | 5+a |

**Implicancias del modelo multi-especie:**
- Una tortuga puede estar en M3 durante 45 años. El producto debe diseñarse para acompañarla en una vida más larga que la del dueño.
- Un hurón pasa rápido por todos los momentos. Su M3 dura menos de 4 años.
- Un loro grande sobrevive a su dueño con alta probabilidad — el producto debe contemplar tutela post-mortem para especies de larga vida.

#### 3.2.2 Los 8 JTBDs base

Los JTBDs (Jobs To Be Done) son las **tareas que la mascota y su familia necesitan resolver a lo largo de la vida**. e-PetPlace define 8 JTBDs base que cruzan momentos vitales y actores.

**JTBD-1 — Salud preventiva.** Vacunación, desparasitación, chequeos anuales, exámenes preventivos. Activo en todos los momentos, intensivo en M1-M2 y M4-M5.

**JTBD-2 — Salud curativa y casos clínicos.** Diagnóstico, tratamiento, seguimiento de condición. Activo en M4 fuertemente, en otros momentos por evento puntual. **Acá vive "adopción de caso clínico".**

**JTBD-3 — Higiene y estética.** Grooming, baño, corte, cuidado dermatológico, cuidado dental. Activo en todos los momentos.

**JTBD-4 — Actividad y socialización.** Paseos, ejercicio, juego, socialización. Activo desde M2, ajustado en M5. Materialización varía radicalmente por especie (perro = paseo, gato = juego interno, loro = enriquecimiento, conejo = tiempo fuera de jaula).

**JTBD-5 — Alimentación y nutrición.** Alimento balanceado, suplementos, dietas especializadas. Activo en todos los momentos, especialmente sensible en M1 (cachorro), M4 (condiciones) y M5 (senior).

**JTBD-6 — Alojamiento temporal.** Hotel, guardería, cuidado domiciliario cuando la familia viaja. Activo desde M2.

**JTBD-7 — Educación y comportamiento.** Adiestramiento, modificación conductual, socialización profesional. Activo en M1-M3 principalmente. Aplica fuertemente a perros, parcialmente a aves (loros), poco al resto.

**JTBD-8 — Identidad, documentación, viaje.** Microchip, certificados sanitarios, pasaporte sanitario, traslados internacionales. Activo en momentos específicos (alta, traslados, viajes).

#### 3.2.3 Matriz JTBD × Momento × Especie × Actor

La matriz define **quién es el actor principal de cada JTBD según momento vital y especie**. Es **el corazón operativo del producto**: si esta matriz está clara, el producto se construye solo.

##### Matriz base — Perro/Gato (Nivel A de soporte)

Cada celda indica actor principal + intensidad (●●● intensivo, ●● regular, ● ocasional, — no aplica).

| JTBD | M0 | M1 | M2 | M3 | M4 | M5 | M6 |
|---|---|---|---|---|---|---|---|
| 1. Preventiva | criadero/refugio ● | vet ●●● | vet ●● | vet ● | vet ●● | vet ●● | — |
| 2. Curativa | — | vet ● | vet ● | vet ● | vet tratante ●●● | vet ●● | vet ● |
| 3. Higiene | — | grooming ● | grooming ● | grooming ●● | grooming ●● | grooming ●● | — |
| 4. Actividad | — | — | paseador ● | paseador ●●● | paseador ●● | paseador ● | — |
| 5. Alimentación | — | seller ●●● | seller ●● | seller ●● | seller ●●● | seller ●● | — |
| 6. Alojamiento | — | — | hotel ● | hotel ●● | hotel ● | hotel ● | — |
| 7. Educación | — | entrenador ●● | entrenador ●●● | entrenador ● | — | — | — |
| 8. Identidad/viaje | refugio ● | vet ●● | — | — vet certificador ● | — | — | fin_vida ●●● |

##### Variaciones por especie de Nivel B

**Conejo:** elimina paseador en JTBD-4 (no aplica), reduce hotel en JTBD-6 (oferta limitada en LatAm). Agrega "corte de uñas" en JTBD-3 con vet exótico como actor (no grooming convencional). Sin entrenador en JTBD-7.

**Loro:** elimina paseador. Mantiene entrenador en JTBD-7 (entrenamiento de comportamiento para loros grandes es real). JTBD-3 con vet exótico (corte de uñas y pico). JTBD-4 cambia de paseo a "enriquecimiento ambiental" (sin actor externo típicamente, pero la familia documenta hitos). JTBD-6 raramente con hotel — más común "cuidador domiciliario" o "amigo cuidador".

**Reptil:** sin grooming, sin paseador, sin entrenador, sin hotel típicamente. JTBD-1 con vet exótico ocasional. JTBD-5 muy especializado (sellers expertos en alimentos vivos o congelados). JTBD-4 = enriquecimiento del terrario, sin actor externo.

**Hurón:** mantiene mayoría de JTBDs pero compactados temporalmente (vive ~7 años). JTBD-7 limitado.

**Pez/invertebrado:** JTBD-1 ocasional con vet exótico (raros). JTBD-5 dominante (sellers de alimento, productos de acuario). JTBD-3 = mantenimiento del acuario (servicio especializado). Resto no aplica.

##### Implicancias para diseño

La matriz le dice al producto **qué actores activar para cada mascota según su momento y especie**. Si Max es perro mediano en M3, el dashboard sugiere paseador habitual, vet anual, grooming cada 2 meses, hotel cuando la familia viaje. Si Luna es loro grande en M3, el dashboard NO sugiere paseador — sugiere vet exótico semestral, enriquecimiento, comunidad de loros.

**Esta matriz NO se hardcodea en código.** Se modela como datos (catálogo `cat_jtbd_actor_por_momento_especie`) que se consultan dinámicamente. Esto permite ajustar la matriz sin redeploy cuando descubramos refinamientos.

#### 3.2.4 Adopción de caso clínico

**El concepto que diferencia al producto de cualquier software veterinario del mercado.**

##### El concepto

Un caso clínico es un **proceso de salud con apertura, evolución y cierre** que va más allá de una consulta individual.

**Ejemplo:** "alergia confirmada al polen en Max" es un caso clínico que abrió la Dra. Pérez en marzo, sigue activo, requiere seguimiento periódico, ajustes de medicación, y solo se "cierra" si la alergia se controla completamente o si la familia decide cambiar de vet tratante.

Otro ejemplo: "fractura de tibia post-accidente en Luna (gata)" es un caso clínico con apertura clara (día del accidente), evolución (cirugía, rehabilitación, controles), y cierre cuando hay alta médica completa.

##### Qué pasa cuando un vet abre un caso

**1. Adopción del caso.** El vet queda registrado como "vet tratante del caso X" en `mascota_perfil_vigente.casos_clinicos_activos`. **No es vet de la mascota** — es vet del **caso**.

Una mascota puede tener **simultáneamente varios vets tratantes** por casos distintos:
- Dra. Pérez tratando alergia.
- Dr. López tratando lesión articular.
- Dra. Martínez como vet de cabecera para controles anuales (rol distinto: vet de cabecera, no tratante de caso específico).

**2. Suscripción a eventos relevantes.** El vet del caso recibe automáticamente alertas cuando ocurren eventos relacionados, **incluso si ocurren con otros actores**.

Ejemplos concretos:
- Max está tratando alergia con Dra. Pérez. El groomer reporta dermatitis activa después de un baño. → Dra. Pérez se entera.
- Max está medicado por alergia. El paseador reporta que vomitó esta mañana. → Dra. Pérez se entera (posible reacción adversa).
- Max tiene control de alergia pendiente para el próximo mes. La familia compra producto antiparasitario. → Dra. Pérez se entera (posible interacción con medicación de alergia).

**3. Responsabilidad temporal definida.** El caso tiene un horizonte ("revisar en 30 días", "control en 3 meses"). Si pasa el horizonte sin evento de seguimiento, el sistema alerta a la vet tratante: "Max no ha tenido control de alergia hace 35 días, ¿programar seguimiento?".

**El sistema persigue el caso, no espera que el vet lo recuerde.**

**4. Cierre o transferencia explícita.** El caso se cierra cuando:
- La condición se resuelve (alergia controlada, fractura sanada).
- La familia decide cambiar de vet tratante.
- La mascota cambia de momento vital significativo (transición a M6 puede cerrar casos abiertos).

Transferencia de caso: cuando un vet pasa el caso a otro (segunda opinión, especialización, mudanza de familia), hay handshake clínico explícito. El vet anterior recibe notificación, el nuevo recibe el contexto completo, la familia confirma la transferencia.

##### Por qué esto es diferenciador

**Ningún software veterinario del mercado tiene este concepto.** Todos tratan a la mascota como sujeto y a las consultas como eventos planos. Lo más cercano es "historia clínica" — un registro pasivo. El **caso clínico como proceso activo con vet adoptante** es la traducción técnica de "el vet adoptó un caso".

> *"El vet no atendió una consulta — adoptó un caso."*

**Esto es producto que cambia la práctica del vet, no software que la digitaliza.**

##### Para el vet apasionado, ¿por qué le sirve?

- **Memoria perfecta sobre sus casos.** Nunca olvida que Max tiene control pendiente.
- **Visión completa del caso.** Ve lo que pasó con Max entre consulta y consulta (paseador, groomer, otros eventos).
- **Reputación por adoptar casos bien.** En el largo plazo, vets que adoptan casos y los siguen ganan reconocimiento (Capa 3).
- **Diferenciación profesional.** "Soy vet en e-PetPlace, adopto casos, no atiendo consultas sueltas" es identidad profesional valiosa.

#### 3.2.5 Motor de alertas y seguimientos

**Infraestructura nueva, no en backlog actual, central para que el producto se sienta "vivo".**

##### El concepto

El motor de alertas es un **sistema de reglas declarativas que escucha eventos del bio-expediente y dispara acciones proactivas**: notificaciones, recordatorios, sugerencias, alertas a casos clínicos.

Si construyéramos cada alerta como código ad-hoc, no escala. Si construimos un **motor de reglas declarativas sobre eventos + perfil vigente + momentos vitales**, agregar alertas nuevas es agregar una fila a un catálogo de reglas.

##### Los 3 tipos de alertas

**Tipo 1 — Alertas de ausencia (algo que debería pasar y no pasó).**

Patrón: "esperábamos X dentro de Y tiempo, no ocurrió, alertar".

Ejemplos:
- "Max no ha tenido control hace 35 días desde diagnóstico de alergia." → al vet tratante del caso.
- "Vacuna antirrábica vencida hace 20 días." → a la familia + al vet habitual.
- "Max no ha tenido grooming hace 5 meses (frecuencia habitual: cada 2)." → a la familia.
- "Mascota en M5 (senior) sin control en 6 meses." → a la familia + al vet habitual.
- "Receta de medicación de alergia se acaba en 5 días, no hay refill solicitado." → a la familia.

**Tipo 2 — Alertas de presencia (algo pasó que requiere atención cruzada).**

Patrón: "ocurrió evento X, según contexto Y, alertar a Z".

Ejemplos:
- "El paseador reportó cojera en Max." → al vet tratante de cualquier caso articular abierto + al vet de cabecera.
- "El groomer reportó dermatitis activa." → al vet tratante de caso alergia + al vet de cabecera.
- "Peso bajó 8% en último mes." → al vet de cabecera + al vet tratante de cualquier caso metabólico.
- "Wearable detectó patrón de actividad anómalo." → al vet de cabecera (Fase 3, requiere wearable integrado).
- "Familia reportó vómito en nota dueño." → al vet tratante de caso digestivo si existe.

**Tipo 3 — Alertas de oportunidad (momento contextual para algo).**

Patrón: "estamos en momento X, sería buen momento para Y".

Ejemplos:
- "Max cumple 7 años — momento de transición a senior. Sugerimos chequeo geriátrico." → a la familia.
- "Plan de vacunación de cachorro completo. Hora de primera socialización con paseador." → a la familia.
- "Max está en M5 y no tiene seguro de salud. Disponible plan de aseguradora X." → a la familia (con opt-out de marketing claro).
- "Hace 2 años que Max está con Dra. Pérez. Considerá calificar su atención." → a la familia.

##### Configuración por actor

**Cada actor configura qué alertas quiere recibir y cómo (email / push / in-app).** Defaults sensatos por rol:

- Vet de cabecera: todas las alertas Tipo 2 sobre sus mascotas habituales.
- Vet tratante de caso: todas las alertas Tipo 1 y 2 sobre su caso.
- Familia: alertas Tipo 1 y 3 sobre sus mascotas.
- Paseador habitual: alertas operativas (cambios en medicación que afectan paseo).

##### Anti-spam y respeto del usuario

**El motor no abusa de notificaciones.** Reglas operativas:

- Frecuencia máxima configurable por regla (no notificar la misma cosa 5 veces por día).
- Si una alerta se descarta repetidamente, se sugiere silenciarla.
- Priorización por urgencia: crítica → notificación inmediata. Importante → email diario digest. Informativa → in-app, sin notificación push.
- Modo "do not disturb" durante M6 (fin de vida) y duelo posterior.

#### 3.2.6 Visibilidad cruzada inteligente

Decisión cerrada: **el RLS técnico decide quién puede leer técnicamente. El producto decide qué presentar visualmente según rol.**

##### El principio

Cada actor ve **lo que es relevante para su rol y útil para la mascota**, no más, no menos. **No es por RLS técnico — es por diseño de UI con criterio explícito por rol.**

El RLS soft launch base (S14, D14.3) dice "todos los actores con acceso ven todo lo que la policy permite". El frontend filtra qué pinta según rol. Esta capa establece **cómo filtra el frontend**.

##### Matriz de visibilidad por actor (versión soft launch)

**Paseador ve:**
- Identidad biológica básica (nombre, foto, raza, edad, peso).
- Identidad personal relevante para paseo: temperamento general, miedos relevantes (ruidos, otros perros, ciclistas), manías relevantes para correa.
- Alergias relevantes (alimentarias si lleva snacks).
- Medicación activa con instrucciones operativas ("medicado por X, no exigir hasta día Y", "evitar correr si hay malestar").
- Contactos de emergencia.
- Vet tratante de cualquier caso articular (para reportar cojera directamente).

**Paseador NO ve:**
- HC clínica detallada.
- Diagnósticos previos completos.
- Historial completo.
- Datos financieros.
- Hitos privados.

**Grooming ve:**
- Identidad biológica básica.
- Temperamento en grooming (de Capa 1).
- Alergias dermatológicas y de productos.
- Condiciones de piel/pelo.
- Miedos relevantes (secador, ruidos, agua).
- Preferencias estéticas de la familia.

**Grooming NO ve:** HC clínica general no relacionada con piel/pelo, diagnósticos no dermatológicos.

**Hotel ve:**
- Identidad biológica básica.
- Temperamento general.
- Alergias completas.
- Medicación activa + dosis + horarios.
- Plan nutricional.
- Vet de emergencia.
- Contactos de la familia.
- Prestadores habituales (por si necesita derivar).
- Hitos relevantes (mascota separada por primera vez de la familia, hito emocional).

**Hotel NO ve:** HC diagnóstica.

**Vet de cabecera ve:**
- TODO lo clínico.
- Temperamento en consulta.
- Actividad reciente de otros prestadores (contexto: "el paseador reportó esto", "el groomer notó aquello").
- Identidad personal completa.

**Vet tratante de caso ve:**
- Todo lo del vet de cabecera, PLUS:
- Eventos asociados al caso clínico que adoptó, aunque ocurran con otros actores.
- Alertas automáticas suscritas al caso.

**Entrenador ve:**
- Temperamento general.
- Historial de comportamiento.
- Miedos completos.
- Medicación activa si afecta entrenamiento.
- Edad, raza, peso.

**Entrenador NO ve:** HC.

**Seller productos ve:**
- Especie, raza, edad, peso.
- Alergias alimentarias.
- Plan nutricional actual.
- Recomendaciones del vet sobre alimentación.
- Historial de compras (suyo).

**Seller NO ve:** HC, historial completo de otros sellers, ubicación precisa.

**Familia ve TODO** (limitado solo por hitos privados de otros miembros de la familia).

##### Override por la familia

La familia puede sobrescribir defaults:
- "No quiero que mi paseador vea la medicación de Max." → opt-out granular.
- "Quiero que el hotel donde se hospedará Max vea sus hitos relevantes para entender su historia." → opt-in granular.

#### 3.2.7 Handshakes entre actores

**Esto es lo que materializa "el cuidado continuo, no transacciones aisladas".**

##### El concepto

Cuando un actor termina su interacción con la mascota, **el sistema facilita el handshake al siguiente actor que corresponde**.

Hoy en el mundo real, la familia es el "router de información" entre prestadores. Falla constantemente. e-PetPlace lo reemplaza por handshakes estructurados con consentimiento de la familia.

##### Ejemplos de handshakes

**Handshake 1: Vet → Paseador habitual.**
Vet cierra consulta con receta de medicación para Max. El sistema automáticamente notifica al paseador habitual: "Max está medicado con X por 14 días, ajustar paseos según indicación. Ver detalle." El paseador acepta el handshake → queda registrado en bio-expediente como evento de "información transferida".

**Handshake 2: Vet → Groomer habitual.**
Vet diagnostica alergia dermatológica. El sistema notifica al groomer habitual: "Max tiene alergia confirmada al polen, considerar shampoo hipoalergénico. Ver detalle." El groomer ajusta su preparación para próxima cita.

**Handshake 3: Hotel → Vet de cabecera + Familia.**
Hotel termina estadía con observación de comportamiento ansioso ("Max no comió las primeras 24h, se calmó después"). El sistema notifica al vet de cabecera (por si es patrón) y a la familia (para que considere acompañamiento conductual).

**Handshake 4: Sistema → Múltiples actores en transición de momento vital.**
Mascota transiciona de M3 a M4 por diagnóstico crónico. El sistema notifica a TODOS los prestadores habituales informando del cambio + ajustes recomendados:
- Vet de cabecera ve: "M3 → M4 por alergia. Ajustar plan de controles."
- Paseador habitual ve: "Max ahora está en manejo crónico. Ver instrucciones nuevas."
- Groomer habitual ve: "Considerar sensibilidad dermatológica nueva."
- Seller habitual ve: "Plan nutricional posiblemente cambiado, ver con vet."

**Handshake 5: Handshake clínico en cambio de vet.**
Familia decide cambiar de vet de cabecera. El sistema facilita transferencia: HC completa, medicación activa, casos clínicos abiertos, alergias, todo va al nuevo vet con un evento de "transferencia de cuidado" registrado. El vet anterior queda notificado con respeto.

##### Consentimiento default + opt-out granular

Decisión cerrada: **handshakes son automáticos con consentimiento default, con opt-out granular**.

- La familia en onboarding marca "compartir info clínica relevante con mis prestadores habituales" como sí/no (default sí, porque sin esto el producto pierde su valor central).
- Después puede revocar caso por caso ("no quiero que mi nuevo paseador reciba info clínica todavía, prefiero conocerlo primero").

##### Por qué esto es uno de los componentes más diferenciadores

**Nadie en el mercado tiene esto.** Software veterinario aislado, marketplace de productos aislado, app de paseadores aislada — ninguno comunica entre sí. e-PetPlace integra. La familia siente que los actores **están coordinados sin que ella sea el router**.

#### 3.2.8 Mascotas en situaciones especiales

##### Mascotas con condiciones crónicas múltiples

Mascotas en M4 pueden tener varias condiciones simultáneas (perro senior con artrosis + cataratas + insuficiencia renal leve). Cada condición puede tener su propio vet tratante o compartir uno. El producto modela esto sin colapsar — la mascota tiene varios casos clínicos activos paralelos.

##### Mascotas viajeras

Familias que viajan con la mascota internacional o interprovincialmente. JTBD-8 (Identidad/viaje) se activa intensivamente. Certificados sanitarios, vacunación específica por destino, microchip homologado. El producto coordina con vet certificador y autoridades sanitarias según corresponda.

##### Mascotas con segunda opinión

Familia pide segunda opinión de otro vet sobre un caso. Se modela como **caso clínico secundario** suscrito al primario. El vet de segunda opinión recibe contexto completo del caso, da su input, puede o no convertirse en vet tratante. El primer vet sigue siendo vet tratante hasta que la familia decida transferencia explícita.

##### Mascotas en hogares con varios vets familiares

A veces la familia tiene un médico vet entre sus miembros. Esto crea matiz: ese miembro puede ser **vet tratante de su propia mascota**. El sistema lo permite pero registra el matiz para que otros prestadores entiendan la dinámica.

##### Mascotas con cuidado dividido entre familias separadas

Pareja separada con co-tenencia compartida de la mascota (Max una semana con Juan, otra semana con María). Ambos siguen siendo co-dueños. Los handshakes ocurren con ambos. El vet tratante puede ser elegido por consenso o por uno con notificación al otro. **Conflictos se resuelven con doble confirmación cuando son destructivos.**

##### Mascotas con cuidado profesionalmente delegado

Algunas familias contratan **cuidador habitual** (sitter contratado regularmente). Este cuidador es **familiar autorizado adulto** con permisos amplios, no co-dueño. Recibe handshakes operativos. Su rol queda claro en la matriz de visibilidad.

#### 3.2.9 Implicancias técnicas anotadas

Notas para sub-sesiones técnicas futuras:

- **Schema `caso_clinico`:** tabla nueva con `mascota_id`, `condicion`, `vet_tratante_prestador_id`, `fecha_apertura`, `fecha_cierre`, `estado` (activo / resuelto / transferido), `horizonte_proximo_evento`. Relación N:1 — caso → mascota.
- **FK opcional `caso_clinico_id`** desde `evento_historia_clinica_registrada`, `evento_medicacion_prescrita`, `evento_examen_diagnostico` para filtrar "ver toda la historia del caso X".
- **Schema `cat_reglas_alerta`:** catálogo declarativo con `condicion_jsonb`, `target_actor`, `prioridad`, `frecuencia_maxima`.
- **Worker o trigger evaluador** que corre las reglas activas contra cambios en `eventos_mascota` y `mascota_perfil_vigente`. Decisión técnica pendiente: trigger síncrono vs job asíncrono.
- **Tabla `alertas_emitidas`:** historial con estado (pendiente / vista / accionada / descartada / silenciada).
- **Schema `prestador_atencion_log` ya existe** (D-107 cerrada S14) — base del concepto "el log sobrevive".
- **`cat_jtbd_actor_por_momento_especie`:** catálogo nuevo que define la matriz JTBD × Momento × Especie → Actor + Intensidad. Crítico para que el producto se comporte distinto por momento/especie sin redeploy.
- **Helper `user_tiene_acceso_a_mascota` ya existe** (S14, D-108). Visibilidad cruzada inteligente NO requiere nuevo RLS — requiere lógica de presentación en wrappers TS / componentes UI.
- **Tabla `handshake_log`:** registra handshakes ejecutados, qué se compartió, quién consintió, cuándo se aceptó.
- **Refactor de `mascota_perfil_vigente.casos_clinicos_activos`:** jsonb con array de casos activos. Mantenido por triggers.

#### 3.2.10 Señales prácticas para Claude y devs

> **Cuando un dev te pida diseñar la pantalla "completar consulta veterinaria":** este documento dice que el vet no atiende consultas, adopta casos. **El form NO es lineal "diagnóstico → tratamiento → fin"**. Es "¿esto es nuevo caso o continuación de caso existente?" como primera pregunta. Si es nuevo caso, el vet lo adopta con horizonte explícito. Si es continuación, se asocia al caso vigente.

> **Cuando alguien proponga "alertas hardcoded en código":** parar. Las alertas son **reglas declarativas en catálogo** (`cat_reglas_alerta`). El motor evalúa. Agregar alerta = agregar fila al catálogo, no deploy de código.

> **Cuando enfrentes "el paseador necesita saber X pero no Y":** este documento tiene matriz de visibilidad cruzada inteligente (3.2.6). **No es decisión arbitraria de UI, está definida.** Si la matriz no cubre el caso, se discute como decisión de modelo, no se improvisa.

> **Cuando un dev quiera "notificar a todos los actores siempre que algo pasa":** este documento dice que los handshakes son **estructurados con criterio**, no flood. Cada handshake tiene reglas: ocurre evento X → notificar a actores Y según rol. Si no hay regla, no hay notificación.

> **Cuando un dev quiera "borrar caso clínico cerrado":** este documento dice que los casos NO se borran. Se cierran. El log inmutable sobrevive (P-OP-3 del bio-expediente). Si alguien necesita "limpiar" la vista, es problema de UI, no de schema.

> **Cuando alguien proponga "el vet tratante es siempre el último vet que atendió":** parar. El vet tratante se **adopta explícitamente** al abrir caso. No es derivado de "última consulta". Una mascota puede tener varios vets que la atendieron en orden distinto del caso que tratan.

> **Cuando enfrentes M6 (fin de vida) y diseño de notificaciones:** todas las notificaciones cotidianas se silencian. No hay "Max cumple años hoy" como push activo. El producto respeta el duelo. Diseño detallado va a sub-sesión específica de memorial.

> **Cuando un dev pregunte "¿cómo sé en qué momento vital está esta mascota?":** función `calcular_etapa_vida(fecha_nacimiento, especie)` ya existe en DB. Pero las transiciones M3 → M4 son por evento (diagnóstico crónico), no por edad. M5 es sugerida por edad pero confirmada por vet. M6 se marca por el vet o la familia. **No es cálculo simple, es estado del bio-expediente.**

> **Cuando alguien proponga "matriz JTBD hardcoded en código":** la matriz es **datos en catálogo** (`cat_jtbd_actor_por_momento_especie`). Esto permite ajustar sin redeploy y permite que e-PetPlace en Ecuador tenga matriz ligeramente distinta que e-PetPlace en México si descubrimos diferencias culturales.

> **Cuando un usuario reporta "el sistema me alertó por algo irrelevante":** dos posibilidades: (a) la regla de alerta está mal calibrada → ajustar prioridad/frecuencia, (b) el usuario no quiere ese tipo de alerta → ofrecer silenciar específico. NO eliminar la regla del sistema porque un usuario la silencia.

#### 3.2.11 Anexo: Caso de ejemplo extendido — Max a lo largo de un año

Para que el lector vea cómo se materializa Capa 2 en concreto, con todos los componentes activos.

##### Setup inicial

Max, beagle de 4 años, en M3 (adulto sano) al iniciar el año. Familia Pérez con vet de cabecera Dra. Pérez, paseador habitual Carlos, groomer habitual Pati's Grooming, seller habitual Petshop Norte.

##### Mes 1 — Marzo

**Evento 1:** Control anual con Dra. Pérez. Sin novedad. Vacunación al día. Peso 12.8 kg estable. La Dra. Pérez NO adopta caso porque no hay condición. Es JTBD-1 (preventiva), evento puntual.

**Evento 2:** Compra de alimento mensual con Petshop Norte. Evento JTBD-5. Enriquece bio-expediente sin alerta.

**Evento 3:** Grooming con Pati. Pati registra "Max sociable hoy, sin novedades". Evento JTBD-3.

**Comportamiento del producto:** dashboard sereno. Sin alertas. Hitos sugeridos: "Max completó control anual" (público si la familia quiere). Hitos narrativos invitados: "¿algún hito de marzo?".

##### Mes 3 — Mayo

**Evento crítico:** Max llega a casa después de paseo con Carlos. Carlos reporta en su nota post-paseo: "Max se rascó mucho hoy, parece molesto." Evento JTBD-4 con observación.

**Sistema reacciona:** Alerta Tipo 2 (presencia) → a la familia: "Carlos reportó rascado intenso, considerar consulta veterinaria si persiste".

**Mes 3 — Mayo, 3 días después.** La familia lleva a Max a Dra. Pérez por rascado. Dra. Pérez examina, hace tests, diagnostica **alergia al polen confirmada**. Apertura de caso clínico.

**Evento de adopción de caso:** Dra. Pérez adopta caso "Alergia al polen en Max". Horizonte: control en 30 días. Receta antihistamínico por 14 días.

**Sistema reacciona:** Transición Max de M3 → M4 (adulto con condición crónica). Handshakes automáticos:
- Carlos (paseador): notificado "Max ahora tiene alergia confirmada al polen + medicado antihistamínico por 14 días. Evitar paseos largos en zonas de pasto seco si es posible."
- Pati (grooming): notificada "Max tiene alergia confirmada. Considerar shampoo hipoalergénico próxima visita."
- Petshop Norte: notificado del cambio de momento vital (sin info clínica detallada).
- Comunidad sugerida: "Mascotas con alergias estacionales" se sugiere a la familia.

**Comportamiento del producto:** dashboard ahora muestra prominentemente el caso de alergia, medicación activa con horario, próximo control sugerido.

##### Mes 4 — Junio

**Evento 1:** Día 14 de medicación. Sistema alerta a la familia (Tipo 1, ausencia): "Receta de antihistamínico se termina hoy. Consultar con Dra. Pérez si seguir o ajustar."

**Evento 2:** Próximo paseo con Carlos. Carlos pregunta en la app antes de salir: "¿cómo viene Max?". La familia responde "mejor, no se rascó esta semana". Esto registra evento operativo.

**Evento 3:** Día 30 desde apertura del caso, no hay control. Sistema alerta a Dra. Pérez (Tipo 1, ausencia): "Max no ha tenido control de alergia hace 30 días. ¿Programar seguimiento?".

**Acción:** Dra. Pérez contacta a la familia, programa control. Familia agenda.

##### Mes 5 — Julio

**Control de seguimiento.** Dra. Pérez evalúa, ajusta medicación. Caso sigue activo, nuevo horizonte 60 días. Evento de seguimiento registrado.

**Evento secundario:** Familia viaja por una semana. Max va a Hotel Patitas Felices (primera vez). Handshake automático al hotel: "Max tiene alergia confirmada al polen, medicado con X, dar dosis a las 8am y 8pm, alimento Royal Canin Hypoallergenic, contactos de la familia, vet de emergencia Dra. Pérez."

**Hotel reporta cada día.** "Max comió bien", "Max durmió tranquilo", "Max sociable con otros perros pequeños". Eventos al bio-expediente.

##### Mes 8 — Octubre

**Evento crítico nuevo:** Carlos reporta en paseo: "Max cojea levemente desde ayer". Evento Tipo 2.

**Sistema reacciona:** Alerta a Dra. Pérez (vet de cabecera, no hay vet tratante de caso articular abierto) + a la familia.

**Consulta nueva:** Dra. Pérez evalúa. Sospecha leve lesión articular (no relacionada con alergia). Dado que es preventivo, indica reposo + observación 1 semana. NO abre caso clínico (es evento puntual, no proceso). Si en 1 semana sigue cojeando, **entonces sí adoptaría caso**.

**Una semana después:** Max recuperado. Sistema cierra el "asunto" sin caso clínico formal. Evento queda en bio-expediente.

##### Mes 12 — Febrero del año siguiente

**Cumpleaños de Max.** Sistema sugiere a la familia "Max cumple 5 años, ¿registrar como hito?". Familia lo hace, sube foto.

**Control anual.** Dra. Pérez evalúa el año completo, ve el caso de alergia bien controlado, lo mantiene activo con horizonte anual. Vacunación al día.

**Reporte de año:** sistema genera (Capa 3, opcional) "Año de Max 2026" con highlights: 14 paseos con Carlos, 6 groomings con Pati, 1 caso clínico (alergia controlada), 3 hitos narrativos públicos, comunidad "Beagles de Quito" en la que participa.

##### Lo que este caso enseña

1. **El cuidado es continuo**: el caso de alergia se abre en mayo, sigue activo todo el año.
2. **Adopción de caso es real**: Dra. Pérez no atiende consultas sueltas, sostiene el caso de alergia.
3. **Motor de alertas funciona**: ausencia de control en día 30 → alerta automática.
4. **Handshakes integran el ecosistema**: paseador, groomer, hotel reciben info clínica relevante sin que la familia tenga que repetir.
5. **Transiciones de momento vital**: M3 → M4 ocurre por evento (diagnóstico crónico), no por edad.
6. **El producto persigue el bienestar**: nadie tiene que recordar todo, el sistema lo hace.
7. **JTBDs cruzan actores**: en un año, 5 JTBDs activos (preventiva, curativa, higiene, actividad, alimentación) con 4 actores (vet, paseador, groomer, hotel) + seller.
8. **El año termina con sustancia**: reporte anual muestra vida documentada rica, no solo transacciones.

#### 3.2.12 Cierre de Capa 2

> *"e-PetPlace no es donde reservás una cita. Es donde tu mascota es cuidada."*

**Cómo Capa 2 contribuye al "wow desde día 1":**

Cuando un vet apasionado abre e-PetPlace por primera vez, debería sentir:

- **Memoria perfecta sobre sus pacientes.** Nunca olvida un caso, el sistema persigue por él.
- **Visibilidad de lo que pasa entre consultas.** Sabe qué reportó el paseador, qué notó el groomer, cómo está el peso, qué medicación está tomando — sin tener que preguntar.
- **Adopción de casos como práctica profesional valiosa.** Su rol no es "atender citas", es "acompañar la salud a lo largo del tiempo".
- **Integración con otros prestadores sin fricción.** Los handshakes ocurren automáticamente. No tiene que coordinar manualmente con paseadores/groomers/hoteles.
- **Identidad personal del paciente disponible.** Sabe que Max le da miedo el tubo del estetoscopio porque la app lo registró desde la consulta pasada.

Cuando una familia abre e-PetPlace por primera vez después de un mes de uso, debería sentir:

- **Que no tiene que ser el router de información.** El sistema coordina por ella.
- **Que el sistema sabe qué le falta a su mascota.** Vacuna vencida, control pendiente, transición de momento vital — el sistema avisa.
- **Que el cuidado es continuo, no transaccional.** No es "fui al vet hoy", es "el caso de alergia de Max está siendo seguido".
- **Que los prestadores trabajan coordinados.** Carlos sabe que Max está medicado, Pati sabe que tiene piel sensible, sin tener que decírselos cada vez.

**Eso es el wow de Capa 2.** Cuidado integrado, no transacciones sueltas. Sistema vivo, no formulario pasivo.

Con Capa 1 (identidad) y Capa 2 (cuidado) bien construidas, la mascota tiene **presencia digital con peso real y cuidado que la acompaña a lo largo de toda su vida**. Sobre esa base, Capa 3 (comunidad) emerge naturalmente.

---

### 3.3 Capa 3 — Comunidad y pertenencia

#### Mini-índice de esta capa

| # | Punto | Qué resuelve |
|---|---|---|
| 3.3.0 | Tesis de la capa | Por qué la capa social emerge de las otras dos, no se construye sola |
| 3.3.1 | Sub-capa A — Presencia pública de la mascota | Cómo cada mascota tiene presencia digital opcional |
| 3.3.2 | Sub-capa B — Red de mascotas (no de dueños) | Diferencia entre modo íntimo de mascotas y modo operativo de dueños |
| 3.3.3 | Sub-capa C — Comunidades por afinidad | Por raza, condición, etapa, ciudad, intereses, causa |
| 3.3.4 | Sub-capa D — Encuentros y compatibilidad social | Encuentros con propósito, no swipe. Por qué NO cría entre particulares |
| 3.3.5 | Sub-capa E — Memorial y honra de mascotas fallecidas | Cómo la app respeta el duelo y preserva la vida documentada |
| 3.3.6 | Sub-capa F — Reputación y trust en el ecosistema | Bidireccional, no humillante, con sustancia |
| 3.3.7 | Sub-capa G — Causas y bien común | Refugios, donaciones, denuncia de maltrato, comunidad solidaria |
| 3.3.8 | Activación por fases | Qué se enciende en F1, F2, F3 |
| 3.3.9 | Diferenciaciones por especie | Cómo la capa social se materializa distinto por especie |
| 3.3.10 | Implicancias técnicas anotadas | Notas para sub-sesión técnica futura |
| 3.3.11 | Señales prácticas para Claude y devs | Cuándo aplicar este modelo a decisiones reales |
| 3.3.12 | Anexo: Casos de ejemplo | Cómo se ve la capa social para Max y Luna |
| 3.3.13 | Cierre de Capa 3 | Frase guía y cómo conecta con "wow desde día 1" |

#### 3.3.0 Tesis de la capa

La mascota no vive sola. Vive en una red de otros animales, humanos, prestadores, comunidades. La capa social de e-PetPlace **no es feed de fotos** — es la **materialización pública y colectiva de identidades reales (Capa 1) que reciben cuidado documentado (Capa 2)**.

> *"Tu mascota no está sola en e-PetPlace. Pertenece a una comunidad de mascotas reales, con vidas reales, cuidadas de verdad."*

##### El cementerio de redes sociales de mascotas

Hay una razón importante para entender por qué fracasaron Dogster, Catster, Pawbook y otros intentos de "red social de mascotas": **arrancaron como red social aislada sin razón estructural de existencia**. El feed era reemplazable por Instagram. La comunidad era reemplazable por Facebook groups. No tenían sustancia debajo. Murieron por **falta de razón de existir más allá de fotos lindas**.

##### Por qué Capa 3 de e-PetPlace funciona donde otros fallaron

**No competimos con Instagram ni Facebook en su terreno.** La capa social acá **no se construye sola — emerge de las otras dos capas**:

- Mascota tiene identidad rica (Capa 1) → la presencia social tiene sustancia.
- Mascota tiene historia documentada de cuidado (Capa 2) → la comunidad tiene contenido útil.
- Sobre esa base, presencia social, encuentros, comunidades, memorial, reputación → tienen razón de existir.

Sin Capa 1 y Capa 2 activas, la capa social es Instagram con peor moderación. Con las dos primeras activas, es **el lugar donde la vida de cada mascota tiene presencia social real**.

#### 3.3.1 Sub-capa A — Presencia pública de la mascota

Cada mascota tiene un **perfil público opcional** que se construye desde Capa 1, controlado por los co-dueños vía configuración híbrida por dimensión (ratificada en 3.1.3).

##### Qué es visible por default

**Público para usuarios autenticados de la app (no Google ni externos):**
- Nombre, foto principal, especie, raza, sexo, edad aproximada.
- Frase corta opcional ("Max, el beagle que ama la playa").
- Familia humana visible o anonimizada (decidido por co-dueños).

**Privado por default, con opt-in granular para compartir:**
- Personalidad, gustos, miedos, manías.
- Identidad relacional detallada.
- Identidad temporal precisa.
- Identidad narrativa (hitos, fotos, historia).
- Cualquier dato clínico.

**Siempre privado sin opción de compartir:**
- Datos financieros (compras, costos).
- Ubicación precisa (dirección).
- Microchip (visible al vet, no público).

##### Configuración por mascota — los 3 modos

**Modo discoverable:** otros usuarios pueden encontrarla en búsquedas y comunidades.

**Modo solo amigos:** solo aparece para mascotas amigas (relación bidireccional aceptada).

**Modo privado total:** solo los co-dueños la ven en la app, no aparece socialmente.

##### Default por especie (con razón cultural)

- **Perros:** modo discoverable. Cultura social de paseos y parques los hace naturalmente visibles.
- **Gatos:** modo solo amigos. Cultura más privada — dueños de gatos suelen ser más reservados.
- **Exóticos (loros, conejos, hurones, reptiles):** modo discoverable. Sus dueños suelen ser comunidad orgullosa, valoran visibilidad.

##### Familia humana en el perfil público

Los co-dueños eligen colectivamente cómo aparecen:
- Nombre real.
- Apodo.
- Anonimato ("familia humana de Max").

**Si los co-dueños difieren, prevalece la opción más privada.** Esto es consecuencia del modelo simétrico con doble confirmación destructiva — la privacidad mayor gana en caso de desacuerdo.

##### Perfil público en mascota fallecida

El perfil se preserva como **memorial** (detalle en 3.3.5). No se borra automáticamente. La familia decide visibilidad post-mortem.

#### 3.3.2 Sub-capa B — Red de mascotas (no de dueños)

**Decisión ratificada:** red de mascotas pura para feed/encuentros + red de dueños mixta para grupos/comunidades temáticas.

##### Modo "red de mascotas pura" — feed e interacciones íntimas

El acto social lo "ejecuta" la mascota. La familia media en backend pero **narrativamente desaparece**.

**Componentes:**

**Amistades entre mascotas.** Max y Luna son amigos. Cuando se conocieron en un encuentro real o cuando los co-dueños conectaron en la app. Una mascota tiene "amigos" no "seguidores" — relación bidireccional con consentimiento mutuo.

**Hitos visibles en feed.** Cuando un hito narrativo se publica como público:
- "Max cumplió 5 años."
- "Max conoció el mar."
- "Max está saliendo del veterinario después de su vacuna anual."
- Los amigos de Max lo ven en su feed.

**Saludos y reacciones.** Actos pequeños entre mascotas:
- "Luna le mandó saludo a Max."
- "Pati reaccionó al cumpleaños de Max."
- Lenguaje narrativo de mascotas.

**Backend honesto:** todo acto loggea `actuado_por_user_id` (cuál co-dueño hizo el acto). Internamente sabemos. Visualmente, la familia desaparece.

##### Modo "red de dueños mixta" — conversaciones operativas

Acá los co-dueños son explícitos por identidad. Útil para:
- Comunidades temáticas ("Comunidad Diabéticos Felinos Ecuador": Juan pregunta sobre dosis de insulina, María responde con su experiencia).
- Foros de raza ("Beagles de Quito": los dueños se identifican porque van a quedar para encontrarse en parque).
- Grupos de causa ("Refugio Amigos de los Animales": voluntarios comparten información sobre mascotas en adopción).

##### La diferenciación crítica

**Lo emocional/íntimo es de la mascota. Lo informativo/operativo es del dueño.** Esto no es solo estilo — es modelo mental coherente:

- "Max le mandó saludo a Luna" → modo mascota. Acto emocional. La familia desaparece narrativamente.
- "Juan pregunta cómo manejar la diabetes felina" → modo dueño. Conversación operativa. Las personas se identifican.

##### Tono y voz — cómo evitar que se sienta cursi o forzado

Lenguaje calibrado al Polo cálido/emocional con dosis controladas. **NO usamos:**
- "Max está super contento de conocer a Luna 🥺💖" (sobreactuado).
- Emojis excesivos.
- Tono infantilizado.

**SÍ usamos:**
- "Max y Luna ahora son amigos."
- "Luna saludó a Max en su cumpleaños."
- "Max conoció el mar." (con foto).
- Lenguaje cálido pero adulto, como contar la vida de un hijo sin sobreactuar.

#### 3.3.3 Sub-capa C — Comunidades por afinidad

Comunidades funcionales con razón estructural de existir, **no grupos genéricos**.

##### Tipos de comunidad

**Por raza.** "Beagles de Ecuador", "Gatos siameses de Quito", "Hurones de LatAm". Conversación sobre cuidados específicos, encuentros, recomendaciones de prestadores especializados.

**Por condición de salud.** "Diabéticos felinos", "Mascotas con artrosis", "Cachorros con displasia". **Acá el contenido tiene altísimo valor** porque los co-dueños comparten manejo real. **Acá la capa social se vuelve médicamente útil.** Los vets pueden participar como expertos invitados.

**Por etapa de vida.** "Cachorros nacidos en marzo 2026", "Senior felinos de Quito". Cohortes que crecen juntos en el tiempo.

**Por ciudad o barrio.** "Mascotas de La Floresta", "Mascotas del Parque Carolina". Útil para encuentros físicos, recomendaciones locales, alertas comunitarias (perro perdido, etc).

**Por intereses de la familia.** "Mascotas viajeras", "Mascotas que hacen senderismo", "Mascotas de oficina". Comunidades aspiracionales.

**Por causa.** "Adopción consciente", "Voluntarios de refugios", "Contra el maltrato animal". Activismo.

**Por especie general.** "Aves de compañía Ecuador", "Reptiles LatAm". Comunidades de soporte para especies con menos información disponible.

##### Gobernanza de comunidades

- **Comunidades oficiales** creadas por e-PetPlace (las de condiciones de salud, especialmente, con curaduría de contenido).
- **Comunidades creadas por usuarios** con moderación distribuida.
- **Comunidades verificadas** (refugios, asociaciones de razas) con badge oficial.
- Reglas claras + reporte + moderación.

##### Por qué importa la profundidad sobre la amplitud

**Las comunidades por afinidad hacen que la capa social tenga sustancia desde poca masa crítica.** Una comunidad de 30 dueños de Hurones LatAm es más viva y útil que un feed genérico con 3000 mascotas. **El producto prioriza profundidad de comunidad sobre amplitud de feed.**

#### 3.3.4 Sub-capa D — Encuentros y compatibilidad social

Decisión cerrada: **encuentros con propósito, no swipe romántico**.

##### Propósitos posibles del encuentro

**1. Amistad y paseo en común.** Dos perros que viven en el mismo barrio que podrían pasear juntos. Sus familias coordinan.

**2. Socialización para cachorros.** Cachorros que necesitan socializar — encontrar otros cachorros vacunados y compatibles para juegos supervisados. **Alto valor en M2 (crecimiento).**

**3. Compañía para mascota sola.** Familia que quiere segunda mascota busca match con refugio que tiene candidatos compatibles.

**4. Eventos comunitarios.** Quedadas de raza en parque, picnic de mascotas, eventos benéficos.

##### Modelo de matching — NO es Tinder

**No es swipe izquierda/derecha.** Es **compatibilidad propuesta + consentimiento de los co-dueños de ambas mascotas**.

**Cómo funciona:**
1. El sistema propone matches basándose en: especie, raza, edad, temperamento (Capa 1.2), ubicación, vacunación al día (Capa 2), intereses de las familias, disponibilidad horaria.
2. Co-dueños de ambas mascotas ven la propuesta.
3. Si ambos lados muestran interés, se conecta y las familias coordinan el encuentro.
4. Después del encuentro, las familias marcan si fue positivo.
5. Si fue positivo y se repite, las mascotas se vuelven "amigas" en la red.

##### Decisión ética cerrada: NO matching para cría entre particulares

**e-PetPlace NO facilita encuentros para cría entre mascotas particulares.** Razones:

1. **Promueve sobrepoblación animal** cuando refugios están llenos de mascotas que necesitan hogar.
2. **Promueve cría informal sin estándares** (genética, salud, bienestar de la madre).
3. **Es contrario al espíritu del producto** (amor a la mascota, no instrumentalización).

**La cría ética se canaliza por otra vía:** criaderos certificados como actores del ecosistema (ya están modelados). Los criaderos certificados pueden conectar con personas buscando adoptar cachorro de raza específica. Pero entre mascotas particulares, **no hay matching para cría**.

Esto es **principio ético explícito**, no opción configurable, no excepción posible.

##### Cómo evitamos el "feel" de app de citas humanas

- Foco en **propósito** (paseo, socialización, juego), no en "match romántico".
- Lenguaje: "Max podría conocer a Luna en el parque" no "Max le hizo match a Luna".
- Énfasis en encuentros físicos reales, no en interacciones digitales prolongadas.
- Después del primer encuentro físico, la relación pasa a ser "amistad" en red, no "match" pendiente.

#### 3.3.5 Sub-capa E — Memorial y honra de mascotas fallecidas

Componente delicado. Se articula a alto nivel acá, con sub-sesión específica de diseño cuando lleguemos a implementación.

##### Principios fundacionales del memorial

**1. La identidad NO se borra cuando la mascota muere.**
El expediente se preserva. La capa narrativa se preserva. La capa social se transforma — el perfil pasa a "memorial" en lugar de "activo".

**2. Los co-dueños deciden visibilidad del memorial.**
Privado (solo co-dueños lo ven), entre amigos cercanos de la mascota, o público comunitario.

**3. El memorial es activo, no pasivo.**
Otros pueden dejar mensajes, recordatorios, fotos compartidas. Los amigos de Max (otras mascotas y sus familias) pueden honrar su memoria.

**4. El duelo es respetado por el producto.**
El producto **no envía notificaciones cotidianas a la mascota fallecida** ("¿Cuándo es el próximo control de Max?"). Las alertas se silencian. El feed no muestra "Max cumple años hoy" como activo — lo muestra como "Max hubiera cumplido X años hoy" con tono respetuoso o se silencia según preferencia de la familia.

**5. Los hitos narrativos privados de cada co-dueño se preservan separadamente.**
Si Juan y María eran co-dueños de Max y Max muere, las notas privadas de cada uno se mantienen privadas. El memorial público es compartido.

**6. Preparación para una nueva mascota es ofrecimiento, no presión.**
Después de tiempo (variable, configurable), el producto puede ofrecer suavemente ayuda para una próxima adopción — siempre con respeto, nunca como push comercial.

**7. El co-dueño que ya no está activo (separación, muerte del humano) se preserva en la historia del memorial.**
Si Juan murió antes que Max, cuando Max muere, el memorial honra a ambos.

##### Diferenciaciones importantes

- **Mascota fallecida con varios co-dueños:** el memorial es de todos los co-dueños activos al momento de la muerte. Cada uno conserva su capa narrativa privada propia.

- **Mascota perdida (no fallecida, desaparecida):** estado distinto. Hay alerta comunitaria activa. El memorial NO se activa hasta que se confirme fallecimiento o pase un período prolongado sin recuperar.

- **Mascota dada en adopción a otro hogar:** transferencia de titularidad, no memorial. El expediente sigue activo con nueva familia (con handshake clínico al nuevo vet).

##### Vocabulario y tono

**Honestidad cálida, no eufemismos.** La mascota "murió" o "falleció", no "se durmió para siempre" ni "cruzó el puente del arcoíris" (a menos que la familia lo elija así en su propia narrativa).

**Pero respetamos la voz de cada cultura y familia.** El "puente del arcoíris" es metáfora consoladora real para muchos. El producto no impone — ofrece tono honesto por default y permite que la familia personalice su memorial.

##### Anotado para sub-sesión específica de diseño

- Diseño visual del memorial (luto sin oscuridad excesiva, dignidad).
- Tiempos de "amortiguamiento de notificaciones" después de marcar muerte.
- Onboarding para nueva mascota después de duelo (si la familia lo pide).
- Memorial colectivo: "muro de mascotas que nos dejaron en mayo 2026".
- Servicios funerarios + cremación + entierro como actores (ya están modelados como tipo `fin_de_vida`).
- Integración con M6 de Capa 2 (fin de vida): handshake clínico cuando el vet acompaña la decisión.

#### 3.3.6 Sub-capa F — Reputación y trust en el ecosistema

Reputación bidireccional con sustancia. **No estrellas vacías.**

##### Reputación de prestadores — cuatro componentes

**1. Calificación de servicio (existente — D-026 en backlog).**
Estrellas + comentarios después de cada cita. Estándar de la industria.

**2. Badges automáticos por comportamiento.**
Datos duros del bio-expediente. **No se compran, se ganan.**
- "Vet con 200 vacunas aplicadas en último año."
- "Grooming con 95% rebookings."
- "Paseador con 0 incidentes reportados en 6 meses."
- "Hotel con tasa de rebooking del 80%."

**3. Badges de comunidad.**
Curados por comunidades activas, no por algoritmo.
- "Vet recomendado por Comunidad Diabéticos Felinos."
- "Paseador favorito de Beagles de Quito."
- "Groomer de confianza para gatos persas."

**4. Especialización certificada.**
Validado por e-PetPlace contra documentación cargada en wizard.
- "Veterinario exótico certificado."
- "Grooming especializado en pelo largo."
- "Hotel con experiencia en mascotas con condiciones crónicas."

##### Reputación de dueños — discreta, no jerárquica

**Crítico: discreta, no humilla a nadie.** No es "rating de dueños" público. Es reconocimiento.

**Lo que SÍ hacemos:**
- "Familia con plan de vacunación al día por 3 años": badge para la familia, visible en su perfil si lo activa.
- "Familia adoptante" si la mascota vino de refugio.
- "Cuidador activo" si tiene varias mascotas y todas con expediente al día.

**Lo que NO hacemos:**
- Rating numérico de dueños visible públicamente.
- "Dueños mal calificados" que tengan dificultad para acceder a prestadores.
- Cualquier mecanismo que pueda usarse para discriminar.

##### Sistema interno de protección de mascotas

**Componente delicado éticamente.** No es público. No es rating.

**Qué es:** detección interna de patrones preocupantes que activa intervención de soporte, no sanción:
- Vacunación crónicamente vencida.
- Ausentismo a citas críticas (cirugías programadas, controles de condición crónica).
- Alertas de prestadores múltiples sobre comportamiento de la familia con la mascota (un caso = anecdótico; tres prestadores reportando preocupación = patrón).

**Cómo se trata:** intervención de soporte humano de e-PetPlace, **no sanción automática**. Una persona del equipo contacta a la familia con preocupación genuina, no con amenaza. **Esto se diseña con cuidado ético máximo** y se trata más como sistema de protección de la mascota que como rating de la familia.

##### Reputación entre mascotas

Pequeño componente lúdico. Las mascotas pueden tener "estrellas" en encuentros si las otras familias las marcan como amigables, sociables, tranquilas. Útil para el matching de encuentros futuros. **Sin penalidad por estrellas bajas** — son señales para mejor matching, no juicios.

#### 3.3.7 Sub-capa G — Causas y bien común

Esta sub-capa le da **peso ético al producto** y lo diferencia de "app comercial de mascotas".

##### Refugios visibles desde día 1

Refugios son actores del ecosistema (en `EPETPLACE.md` A1). En la capa social, los refugios tienen presencia destacada:

- Perfil de refugio con mascotas disponibles para adopción.
- Cada mascota disponible tiene perfil rico (igual que mascotas con familia) — bio-expediente del refugio + identidad personal + necesidades específicas + historia ("rescatada de la calle hace 2 meses, cariñosa con niños, ansiedad por separación leve").
- Match potencial: persona que busca adoptar marca preferencias → sistema sugiere mascotas compatibles en refugios cercanos.
- Adopción a través de e-PetPlace incluye handshake clínico: el expediente del refugio se transfiere a la nueva familia con todo el historial.

##### Donaciones

El motor financiero ya soporta donaciones a refugios (`MODELO_FINANCIERO.md`, mencionado en revenue streams). En capa social:

- Familias pueden donar directamente a refugios visibles en la app.
- Campañas específicas ("Max necesita cirugía, contribuyamos").
- Transparencia total: cada donación es trazable a uso específico.
- Reconocimiento opcional al donante.

##### Adopción consciente y combate contra cría irresponsable

Esto se conecta con la decisión ética de 3.3.4 (no matching para cría entre particulares):

- El producto **educa explícitamente** sobre adopción.
- Cada vez que un usuario nuevo se registra para "buscar mascota", el flujo **prioriza refugios antes que criaderos**.
- Criaderos certificados están en plataforma pero con verificación estricta (documentos, condiciones, salud genética).
- **Criaderos no certificados no aparecen.**

##### Denuncia de maltrato animal

Funcionalidad delicada pero importante:

- Usuarios pueden reportar situaciones de maltrato observadas (vecino, calle, online).
- El reporte va a entidades locales relevantes (ONG, autoridades) según disponibilidad por país.
- **e-PetPlace no es autoridad** — es facilitador del reporte.
- Anonimato del reportante protegido.

##### Comunidad ayuda comunidad

Funcionalidades de solidaridad:

- **"Mascota perdida en tu zona":** alertas a usuarios cercanos cuando una familia reporta pérdida.
- **"Banco de medicación":** familias pueden donar medicación sobrante (no abierta) a refugios o familias con menos recursos.
- **"Padrinos de mascotas en refugios":** usuarios que apoyan económicamente a una mascota específica en refugio hasta que sea adoptada.

##### Educación y bienestar animal

Contenido curado en la plataforma:

- Artículos validados por vets sobre cuidado responsable.
- Videos de etólogos sobre comportamiento.
- Guías por especie, raza, condición.
- **Posicionamiento de e-PetPlace como fuente confiable de información sobre bienestar animal**, no solo plataforma de servicios.

#### 3.3.8 Activación por fases

Capa 3 **no se activa toda junta**. Necesita masa crítica para no fallar (feed vacío, "tinder" sin matches, grupos sin gente).

##### F1 (soft launch)

**Activo:**
- Sub-capa A: Identidad pública mínima.
- Sub-capa F: Reputación de prestadores básica (calificaciones existentes).
- Sub-capa G: Causas básico (refugios visibles).

**El producto muestra que la capa social existe pero no la fuerza.** Sirve aunque no haya comunidad activa todavía.

##### F2 (cadenas + tracción consolidada)

**Se activa:**
- Sub-capa B: Red de mascotas básica (amistades, saludos, hitos públicos).
- Sub-capa C: Comunidades por afinidad completas.
- Sub-capa E: Memorial.
- Sub-capa F: Reputación expandida con badges automáticos y de comunidad.

##### F3 (comunidad activa con masa crítica)

**Se activa:**
- Sub-capa D: Encuentros y compatibilidad social.
- Sub-capa B: Red de mascotas completa.
- Sub-capa G: Componentes avanzados (banco de medicación, padrinos).
- Eventos comunitarios físicos.

##### F4+ (madurez y escala)

Capas avanzadas pendientes de evaluar cuando lleguemos. Posibles:
- Creator economy (con cuidado de no contradecir "amor al oficio").
- E-commerce social (compras grupales, recomendaciones pagadas — Fase 4 según `EPETPLACE.md`).

#### 3.3.9 Diferenciaciones por especie

La capa social se materializa **radicalmente distinto por especie**.

**Perros.**
- Activan red de mascotas naturalmente — son sociales, se conocen en parques.
- Encuentros físicos son frecuentes y valiosos.
- Comunidades por raza muy activas.
- Modo discoverable por default.

**Gatos.**
- Red más privada — amistades suelen ser "vecinos felinos" del mismo edificio/barrio, o gatos hermanos.
- Encuentros físicos entre gatos no conocidos son raros (territorialidad).
- Pero los **dueños de gatos forman comunidades activas online** (modo más "red de dueños mixta").
- Modo solo amigos por default.

**Conejos, hurones.**
- Comunidades nicho pero apasionadas. Muy unidas.
- Encuentros físicos existen (encuentros de bunny lovers, ferret socials).
- Información valiosa cruzada entre dueños (estos animales son menos conocidos, comunidad es fuente principal de conocimiento).
- Modo discoverable por default.

**Aves (loros, canarios, agapornis).**
- Las **comunidades de dueños son muy activas**, las aves "se conocen" indirectamente vía sus dueños.
- Modo más "red de dueños" que "red de mascotas pura".
- Documentación obsesiva (vocabulario de loros, fotos de plumaje).
- Modo discoverable, comunidades muy especializadas por especie de ave.

**Reptiles, peces.**
- Comunidades de dueños expertos.
- Modo casi 100% "red de dueños" porque las mascotas no interactúan socialmente entre sí.
- Información técnica muy valiosa (parámetros del agua, temperatura del terrario, dietas específicas).
- Encuentros entre mascotas no aplican.

**El producto NO fuerza el modelo "red de mascotas pura" donde no aplica.** Se adapta automáticamente por especie.

#### 3.3.10 Implicancias técnicas anotadas

Notas para sub-sesión técnica futura:

- **Schema de identidad pública por dimensión:** `mascota_perfil_publico_config` con configuración granular por dimensión + modo (discoverable / solo amigos / privado total).
- **Schema de amistades entre mascotas:** `mascota_amistad` (m1, m2, fecha, estado activo / bloqueada). Relación bidireccional con consentimiento mutuo.
- **Schema de actos sociales:** `mascota_acto_social` (mascota_actuante, tipo, mascota_target, datos, actuado_por_user_id). El backend sabe quién actuó pero el frontend muestra "Max le mandó saludo".
- **Schema de comunidades:** `comunidad`, `comunidad_miembro`, `comunidad_post`, `comunidad_moderador`. Soporte para tipos (raza, condicion, etapa, ciudad, intereses, causa, especie).
- **Schema de memorial:**
  - Flag `mascota.estado_vida` ∈ {activa, perdida, fallecida, transferida}.
  - `evento_fin_vida` ya está modelado.
  - Tabla `mascota_memorial_config` (visibilidad, configuración de aniversarios).
- **Schema de reputación:**
  - `prestador_badge` (qué badges tiene cada prestador, cuáles automáticos cuáles curados).
  - Reutiliza `prestador_atencion_log` para cálculo automático de badges.
- **Schema de causas:**
  - Refugios ya tienen perfil como prestadores.
  - Falta `mascota_en_adopcion` para mascotas del refugio disponibles.
  - `donacion` ya está en motor financiero.
- **Schema de encuentros:**
  - `encuentro_propuesta` con compatibilidad calculada.
  - `encuentro_realizado` con feedback bidireccional.

#### 3.3.11 Señales prácticas para Claude y devs

> **Cuando alguien proponga "feed estilo Instagram de mascotas":** parar. El feed acá no es Instagram. Es **acto social de mascotas con sustancia** que emerge de identidad real + cuidado documentado. Sin esas dos bases, no hay feed.

> **Cuando un dev pregunte "¿cómo modelo la amistad entre mascotas?":** es relación bidireccional con consentimiento mutuo de ambos co-dueños. Backend sabe `user_id` que ejecutó el acto, frontend muestra "Max y Luna ahora son amigos" sin nombrar humanos.

> **Cuando alguien proponga "permitir cría entre mascotas particulares":** rechazar. Decisión ética cerrada (3.3.4). La cría se canaliza solo por criaderos certificados. **No es opción configurable. No es excepción posible.** Si alguien la propone, este documento es la respuesta.

> **Cuando enfrentes diseño de memorial:** sub-sesión específica obligatoria. No improvisar. Diseñar memorial mal destruye lealtad emocional enorme.

> **Cuando un dev quiera "calcular reputación de dueños públicamente":** parar. La reputación de dueños es **discreta y reconocedora, no jerárquica ni humillante**. No hay rating numérico público. No hay penalidades.

> **Cuando alguien proponga "patrocinio pagado en recomendaciones de prestadores":** parar. **Las recomendaciones clínicas y de servicios son neutrales, basadas en data real**. Principios éticos del producto (sección 8) prohíben sponsoreo en recomendaciones. Si un prestador quiere visibilidad, se gana con badges (3.3.6).

> **Cuando un usuario reporte maltrato animal:** el flujo va a entidades locales relevantes, e-PetPlace facilita el reporte pero NO es autoridad. Anonimato del reportante protegido. Diseñar este flujo con sensibilidad.

> **Cuando alguien proponga "modo discoverable por default para todas las especies":** no. Default por especie tiene razón cultural (3.3.1). Gatos por defecto solo amigos. Si cambia el default, se discute con criterio.

> **Cuando alguien proponga "todos los hitos públicos por default":** no. Hitos son privados por default, la familia elige qué publicar. Capa narrativa privada es del humano que la escribió.

> **Cuando se diseñe matching de encuentros:** NO es Tinder. Es **compatibilidad propuesta + consentimiento de ambas familias + propósito explícito** (paseo, socialización, juego). Vocabulario y UX deben alejarse activamente del modelo de citas humanas.

#### 3.3.12 Anexo: Casos de ejemplo

##### Caso 1 — Capa social de Max (beagle, M3, en F3 madura)

**Presencia pública (3.3.1):**
- Modo: discoverable.
- Identidad biológica visible: nombre, foto, raza, edad.
- Identidad personal visible (opt-in): "sociable con perros chicos, ama nadar".
- Familia humana: visible como "Familia Pérez".

**Red de mascotas (3.3.2):**
- Amigos confirmados: Luna (gata hermana, automática), Pati (beagle del barrio), Toby (golden retriever amigo del parque), Negro (mestizo amigo del paseador).
- Hitos públicos recientes: "Max conoció el mar" (40 reacciones), "Max cumplió 5 años" (28 reacciones de amigos).
- Saludos: "Pati saludó a Max en su cumpleaños".

**Comunidades (3.3.3):**
- "Beagles de Quito" (47 miembros).
- "Mascotas de La Floresta" (132 miembros).
- "Mascotas con alergias estacionales" (89 miembros, se sumó cuando se diagnosticó alergia).

**Encuentros (3.3.4):**
- Activo desde F3. Recibe sugerencias: "Otros beagles de tu edad en Quito disponibles para paseo". La familia coordina con familia de Pati para paseo conjunto cada 2 semanas.

**Memorial (3.3.5):** No aplica, Max está vivo en M3.

**Reputación de su ecosistema (3.3.6):**
- Dra. Pérez (vet de Max) tiene badges: "Vet con 1200 vacunas aplicadas", "Vet recomendado por Comunidad Diabéticos Felinos", "5 años en plataforma".
- Carlos (paseador) tiene badges: "Paseador con 0 incidentes en 6 meses", "Favorito de Beagles de Quito".
- Familia Pérez tiene badges: "Familia con plan de vacunación al día por 3 años".

**Causas (3.3.7):** La familia Pérez donó al refugio donde adoptaron a Luna (gata hermana). Esto está visible en su perfil familiar opcionalmente.

##### Caso 2 — Capa social de Luna (loro gris, M3, en F3 madura)

**Presencia pública (3.3.1):**
- Modo: discoverable.
- Identidad biológica visible: especie, sexo, edad.
- Identidad personal visible (opt-in): vocabulario de 30 palabras, manías sociales con la comunidad de loros.
- Familia humana: anónima ("familia de Luna").

**Red de mascotas (3.3.2):**
- **Casi sin amistades entre mascotas** (los loros no se conocen físicamente típicamente).
- Sin saludos entre mascotas.
- Hitos públicos en comunidad nicho: "Luna aprendió 'qué quieres'" (12 reacciones de comunidad de loros).

**Comunidades (3.3.3) — acá vive su vida social:**
- "Loros Grises de LatAm" (23 miembros muy activos).
- "Aves de compañía Ecuador" (45 miembros).
- Sofía (dueña) participa activamente en discusiones sobre vocabulario, dieta, comportamiento.

**Encuentros (3.3.4):** No aplica para Luna. Lo que sí tiene son **encuentros de dueños** ocasionales (quedadas de "Loros Grises de LatAm" en Quito, eventos físicos).

**Memorial (3.3.5):** No aplica.

**Reputación de su ecosistema (3.3.6):**
- Dr. Mendoza (vet exótico) tiene badges: "Veterinario exótico certificado", "Especializado en aves".
- Sofía tiene badges: "Familia adoptante" (Luna fue adoptada hace 4 años).

**Causas (3.3.7):** Sofía es activa en "Adopción consciente" — su historia de adoptar a Luna es referencia en la comunidad.

##### Lo que estos casos enseñan

1. **La capa social se materializa radicalmente distinto por especie.** Max tiene amigos perros, hitos visuales, encuentros físicos. Luna tiene comunidad activa de dueños, hitos lingüísticos, sin encuentros entre aves.
2. **Las comunidades por afinidad son el componente más versátil.** Funcionan para todas las especies. Para Luna, son su vida social principal.
3. **La reputación se construye con sustancia.** Los badges de Dra. Pérez y Dr. Mendoza salen del bio-expediente, no son comprados.
4. **El producto adapta automáticamente.** Sofía no tiene que configurar "soy dueña de loro, mostrame contenido distinto" — el sistema lo entiende por especie.
5. **Causas dan peso ético.** Familias adoptantes son reconocidas. Refugios visibles. Donaciones trazables.

#### 3.3.13 Cierre de Capa 3

> *"Tu mascota no está sola en e-PetPlace. Pertenece a una comunidad de mascotas reales, con vidas reales, cuidadas de verdad."*

**Cómo Capa 3 contribuye al "wow desde día 1":**

Cuando una familia abre e-PetPlace después de meses de uso, debería sentir:

- **Que su mascota pertenece a un lugar.** No es solo "una de muchas mascotas registradas". Pertenece a comunidades específicas que la entienden.
- **Que el cuidado tiene reconocimiento.** El vet apasionado tiene badges ganados. El paseador querido tiene reconocimiento de la comunidad. La familia es vista como cuidadora responsable.
- **Que el ecosistema tiene alma ética.** No es app comercial neutra — defiende causas, prioriza refugios, combate maltrato, honra mascotas que se van.
- **Que la mascota tiene amigos.** O comunidad. O ambos. No está aislada digitalmente.

Cuando una mascota muere, la familia debería sentir:

- **Que su vida documentada no se pierde.** El memorial preserva todo.
- **Que su comunidad acompaña.** Otros que la conocieron pueden honrarla.
- **Que el producto respeta el duelo.** Sin notificaciones intrusivas. Sin push comercial. Solo dignidad.

**Eso es el wow de Capa 3.** Comunidad con sustancia, no feed de fotos. Reputación ganada, no comprada. Memorial respetuoso, no borrado abrupto. Causas activas, no decoración.

---

## 4. Modelo humano transversal

### Mini-índice de esta sección

| # | Punto |
|---|---|
| 4.1 | Familia como unidad humana de cuidado |
| 4.2 | Co-dueños (titularidad plena, modelo simétrico) |
| 4.3 | Familiares autorizados (adultos y menores) |
| 4.4 | Transferencias de pertenencia |
| 4.5 | Hitos privados como propiedad del humano |
| 4.6 | Implicancias técnicas anotadas |
| 4.7 | Señales prácticas para Claude y devs |

### 4.1 Familia como unidad humana de cuidado

La **familia** es la unidad humana que comparte cuidado de una o más mascotas. Es un nivel **por encima** de co-dueños individuales.

- Una familia tiene **una o varias mascotas** simultáneamente.
- Una familia tiene **uno o varios miembros humanos** con roles distintos.
- La familia **no es necesariamente una familia biológica/legal** — es la unidad de convivencia y cuidado.

**Ejemplos:**
- Familia Pérez: Juan, María, Tomás (hijo de 10 años) + mascotas Max (perro) y Luna (gata).
- Familia Vargas: Sofía (soltera) + mascota Luna (loro gris).
- Familia González: Carlos (separado), su madre Elena, y el cuidador habitual Pedro + mascota Toby (perro).

**Por qué la familia importa modelar:**
1. **Vista consolidada.** "Mis mascotas" muestra todas las de la familia, no obliga a entrar mascota por mascota.
2. **Compras conjuntas.** Pedido mensual de alimento de toda la familia en un solo carrito.
3. **Gestión financiera familiar.** "Gastamos $X este mes en cuidado de mascotas" sumando todas.
4. **Capa social familiar.** "La familia de los Pérez" tiene perfil colectivo opcional.
5. **Onboarding más natural.** "Sos parte de la familia de María. Estas son las mascotas que cuidás con ella."
6. **Memorial familiar.** Cuando una mascota muere, toda la familia lo vive (incluido el hijo menor).
7. **Niños y mascotas.** Los menores no pueden ser co-dueños legales pero son **parte fundamental de la relación**.

### 4.2 Co-dueños (titularidad plena, modelo simétrico)

**Co-dueños** son los adultos con **titularidad plena sobre una mascota específica**.

**Modelo cerrado: (c) simétrico con privacidad individual + doble confirmación destructiva.**

#### Lo que pueden hacer los co-dueños (igual entre todos)

- Programar citas.
- Autorizar prestadores.
- Gestionar capa social.
- Editar identidad de la mascota.
- Configurar visibilidad de dimensiones.
- Postear hitos públicos y familiares.
- Recibir todas las notificaciones operativas.

#### Lo que tiene cada co-dueño individualmente

- **Capa narrativa privada propia.** Juan puede escribir hitos privados sobre Max que María no ve.
- **Configuraciones personales** (preferencias de notificación, idioma).
- **Identidad pública individual** (cómo cada co-dueño aparece socialmente).

#### Acciones destructivas con doble confirmación

Estas requieren consentimiento de **todos los co-dueños** activos:

- Dar de baja la mascota.
- Remover un co-dueño.
- Transferir la mascota a otra familia.
- Cambiar configuración crítica de privacidad (ej: hacer pública identidad personal completa).

**Si no hay consenso, el statu quo se preserva.** No hay arbitraje automático — la mascota sigue como está hasta que las personas resuelvan entre ellas.

#### Conflictos de configuración operativa

Para acciones no-destructivas: **última escritura gana, con notificación al otro co-dueño** explicando qué pasó.

Ejemplo: Juan autorizó al paseador a tener acceso al expediente. María revoca el acceso 5 minutos después. → La última escritura (de María) gana. Juan recibe notificación: "María revocó el acceso del paseador". Si hay desacuerdo, se resuelve entre humanos.

#### Co-dueños no convivientes

Una pareja separada puede seguir siendo co-dueños de la misma mascota aunque ya no convivan. El modelo (c) lo soporta naturalmente:
- Ambos siguen con titularidad plena.
- Ambos reciben notificaciones.
- Las acciones destructivas siguen requiriendo doble confirmación.

Esto refleja **realidades comunes**: parejas separadas que comparten cuidado de la mascota.

### 4.3 Familiares autorizados (adultos y menores)

Personas con vínculo afectivo con la mascota que **no tienen titularidad plena pero participan**.

#### Familiar autorizado adulto

Adulto que pertenece a la familia con permisos delegados configurables.

**Ejemplos:**
- La abuela que cuida cuando los co-dueños viajan.
- Un hermano o pareja no conviviente.
- Un cuidador habitual contratado (sitter regular).

**Permisos configurables:**
- Lectura completa o filtrada del expediente.
- Autorizar prestadores en emergencia.
- Programar citas (sí/no).
- Recibir notificaciones (qué tipos).
- Postear hitos (públicos / privados familiares).

**Lo que NO puede hacer un familiar autorizado adulto:**
- Acciones destructivas (las hacen los co-dueños con doble confirmación).
- Cambiar visibilidad estructural de la mascota.
- Transferir a otra familia.

#### Familiar autorizado menor (niños y adolescentes)

Menores de 18 años que son **parte del vínculo afectivo con la mascota** aunque no puedan tomar decisiones legales.

**Por qué importa modelarlos:**
- Muchas mascotas en el mundo real son adoptadas con/por niños.
- El vínculo emocional niño-mascota es profundo.
- Los hitos contribuidos por menores tienen valor narrativo único.

**Permisos típicos (configurables por co-dueños):**
- Ver al perfil de la mascota.
- Escribir hitos narrativos (familiares o privados del menor).
- Subir fotos.
- Marcar reacciones en capa social (apropiada a edad).
- Recibir notificaciones afectivas ("Max cumple años mañana") pero NO administrativas (vacunas vencidas, cuenta financiera).

**Lo que NO puede hacer un familiar autorizado menor:**
- Autorizar prestadores.
- Hacer transacciones financieras.
- Cambiar configuración de privacidad.
- Postear públicamente sin moderación de co-dueño (configurable).

**El producto los honra como parte de la familia de la mascota sin darles poderes que no les corresponden.**

#### Cuidador externo

Sub-categoría de familiar autorizado adulto que **no convive con la familia**:
- Sitter contratado regularmente.
- Paseador habitual (en algunos casos extremos donde el rol es muy cercano).
- Vecino de confianza.

Permisos más limitados por default (lectura básica, autorización en emergencia), pero configurables.

### 4.4 Transferencias de pertenencia

**Decisión cerrada y crítica: el historial es de la mascota, viaja con ella.**

Cuando una mascota cambia de familia, **el bio-expediente completo la acompaña**. No hay "historial compartido entre familias" ni "historial dividido por dueño".

#### Casos típicos de transferencia

**1. Cambio de familia por venta/cesión.**
- Familia A cede la mascota a Familia B (adopción tardía).
- Handshake explícito entre familias.
- Doble confirmación: todos los co-dueños de Familia A consienten, Familia B acepta.
- Transferencia auditada.

**2. Adopción de mascota de refugio.**
- Refugio cede la mascota a Familia.
- Expediente del refugio se transfiere completo (vacunación, controles, observaciones de comportamiento).
- Handshake clínico al nuevo vet de la familia.

**3. Mascota que pasa entre generaciones de la misma familia.**
- Hijo que se va a estudiar fuera, la mascota queda con padres.
- Si pasa formalmente: transferencia explícita.
- Si es temporal: el hijo sigue siendo co-dueño, los padres se vuelven familiares autorizados.

**4. Familia que se disuelve (separación, divorcio, etc).**
- La mascota va a una de las nuevas familias (decisión humana, fuera del producto).
- Los humanos no convivientes pueden seguir vinculados en tres modos:
  - **Mantener como co-dueño:** modelo simétrico funciona perfecto.
  - **Pasar a familiar autorizado:** permisos delegados configurables.
  - **Retiro total:** sale completamente del vínculo.
- La decisión la toman los co-dueños activos (con doble confirmación si remueven a alguien).

#### Qué pasa con los hitos privados del humano

Recordatorio crítico: **los hitos narrativos privados son del humano, no de la mascota.**

Cuando un humano deja de ser parte del vínculo con la mascota (cualquier modo), **sus hitos privados se preservan en su perfil personal**, no migran con la mascota.

Ejemplo: Juan escribió hitos privados sobre Max ("Max me consoló cuando perdí a mi mamá"). Juan se separa de María, Max se queda con María. Los hitos clínicos, sociales, públicos de Max viajan con Max al nuevo hogar (mismo hogar pero ahora sin Juan). Los hitos privados de Juan siguen siendo de Juan — viven en su perfil de usuario, no en el expediente público de Max.

**Esto preserva dos cosas a la vez:**
- El expediente de la mascota viaja completo con ella.
- La voz privada de cada humano que la cuidó queda preservada para esa persona.

### 4.5 Hitos privados como propiedad del humano

Concepto que merece énfasis propio porque puede no ser obvio.

**Una mascota tiene tres tipos de hitos:**

1. **Hitos públicos.** Visibles en capa social (3.3). Decisión colectiva de los co-dueños.
2. **Hitos privados familiares.** Visibles para todos los miembros de la familia. Hitos íntimos del hogar.
3. **Hitos privados del humano.** Visibles solo para el humano que los escribió. **Son de ese humano, no de la mascota.**

**Implicaciones del tipo 3:**
- Si el humano deja la familia, sus hitos privados van con él.
- Si la mascota cambia de familia, los hitos privados de los humanos antiguos no migran.
- Los hitos privados pueden ser sensibles emocionalmente — el producto los protege con cuidado especial.

**Esto refleja la verdad emocional de la co-tenencia:** somos iguales operativamente, pero cada uno tiene su vínculo único e íntimo con la mascota. Esa intimidad merece respeto.

### 4.6 Implicancias técnicas anotadas

Cerradas en S16 (DDL conceptual listo, ejecución pendiente Sub-bloque 5):

- Tabla `familia` con campos `tipo` (`estandar | virtual_prestador`) y `cuenta_comercial_id` (FK nullable, NOT NULL solo si tipo virtual).
- Tabla `familia_miembro` con `rol` (`adulto_titular | adulto_autorizado | menor | cuidador_externo`) + `permisos_jsonb` + `fecha_nacimiento` (requerida para menores).
- Tabla `mascota_codueño` con `desde/hasta` nullable para preservar vínculo histórico en misma tabla. Trigger valida que el miembro sea `adulto_titular` activo de la familia de la mascota.
- Tabla `mascota_familiar_autorizado` con `permisos_jsonb` override y `autorizado_por_codueño_id` para auditoría.
- `mascotas.familia_id` FK NOT NULL (después de migración). `mascotas.user_id` deprecada, no eliminada.
- `mascotas.estado_vida` enum 3 valores + `estado_vida_desde` timestamp.
- Helper `user_tiene_acceso_a_mascota` reescrito (firma idéntica) — consulta `mascota_codueño` + `mascota_familiar_autorizado` + acceso prestador.
- Helper nuevo `user_puede_ver_dimension(mascota_id, dimension)` para visibilidad fina por dimensión.
- Tabla `accion_destructiva_pendiente` con `codueños_pendientes_snapshot` y `payload_jsonb` por tipo de acción. 6 tipos iniciales (`dar_baja`, `remover_codueño`, `transferir`, `cambiar_privacidad_critica`, `remover_familiar_autorizado`, `cambiar_modo_publico`).
- Tabla `mascota_visibilidad_config` 1:1 con mascotas (modo global + override por dimensión).
- `evento_hito_narrativo` para hitos de la mascota (público + privado familiar) con FK a `familia_miembro`.
- `hito_narrativo_privado_humano` como tabla separada del Bio-Expediente (Decisión D16.9). No tiene FK a `eventos_mascota`.
- Mascotas walk-in viven en `familia` con `tipo='virtual_prestador'` hasta reclamación por cliente (política P3 en `POLITICAS_EPETPLACE.md`).

**Drift documental detectado en S19 (no cerrado):**
- `familia_miembro.permisos_jsonb` está documentado arriba pero NO existe en la tabla en DB. La migración Fase B (S17) no materializó esa columna. Los permisos efectivos hoy son solo por `rol` (sin override granular).
- `mascota_familiar_autorizado.permisos_jsonb` también está documentado arriba. **No auditado en S19** — verificar si afecta también esa tabla.
- Decisión pendiente para sesión futura: o (a) agregar columnas en migración cuando se necesite permisos granulares (probable F2-F3), o (b) eliminar las referencias del modelo conceptual y operar solo con `rol`.
- Origen: detectado en S19 al intentar INSERT con `permisos_jsonb` en trigger nuevo (alta asistida); el INSERT fue corregido para no incluir la columna.

### 4.7 Señales prácticas para Claude y devs

> **Cuando un dev pregunte "¿quién es el dueño de Max?":** la pregunta correcta es "¿qué familia tiene a Max?" y "¿quiénes son los co-dueños?". **No hay un dueño único.** Hay co-dueños simétricos.

> **Cuando alguien proponga "dar privilegios de admin al primer co-dueño que se registró":** parar. Modelo simétrico sin jerarquía. **No hay co-dueño primario.** Todas las acciones destructivas requieren doble confirmación.

> **Cuando un dev quiera "borrar todos los hitos privados cuando una mascota cambie de familia":** parar. Los hitos privados son del humano, no de la mascota. Se preservan en el perfil del humano.

> **Cuando alguien proponga "que el menor de edad pueda autorizar prestadores":** rechazar. Permisos limitados a edad. Los menores son parte del vínculo afectivo pero no toman decisiones legales/financieras.

> **Cuando un dev pregunte "¿qué pasa si los co-dueños no se ponen de acuerdo?":** statu quo se preserva. No hay arbitraje automático. Los humanos resuelven entre ellos. La mascota sigue como está.

---

## 5. Multi-especie

### Mini-índice

| # | Punto |
|---|---|
| 5.1 | El principio: especie como modulador transversal |
| 5.2 | Los cuatro niveles de soporte (A/B/C/D) |
| 5.3 | Equinos como adyacencia futura (Fase 5+) |
| 5.4 | Perfil de comportamiento del producto por especie |
| 5.5 | Vocabulario y tono por especie |
| 5.6 | Implicancias técnicas anotadas |
| 5.7 | Señales prácticas para Claude y devs |

### 5.1 El principio: especie como modulador transversal

**e-PetPlace NO es una app para perros.** Es una app para mascotas de compañía, donde la **especie es modulador transversal del producto**, no atributo cosmético.

Cada especie tiene un **perfil de comportamiento del producto** que define:
- Qué momentos vitales aplican y con qué duración aproximada.
- Qué JTBDs son principales, secundarios o no aplican.
- Qué tipos de prestadores son relevantes.
- Qué tipos de evento del bio-expediente son frecuentes vs raros vs imposibles.
- Qué reglas del motor de alertas se activan.
- Qué hitos narrativos son típicos.
- Qué vocabulario usa la app (un loro no "ladra", un pez no "pasea").
- Qué modo de presencia pública es default.

**El producto se comporta distinto por especie sin que tengamos que rehacer modelo cada vez.**

### 5.2 Los cuatro niveles de soporte

#### Nivel A — Soporte completo de primera clase

**Especies:** Perro, gato.

**Características del soporte:**
- Todos los JTBDs aplicables.
- Todos los actores principales (vet, paseador, hotel, grooming, seller, entrenador para perros).
- Vocabulario propio rico.
- Contenidos específicos curados.
- Motor de alertas tuneado.
- Comunidad activa.
- "Wow desde día 1" pleno.

#### Nivel B — Soporte estructural completo, ecosistema parcial

**Especies:** Conejo, ave (loros, canarios, agapornis, periquitos, similares), reptil (tortuga, iguana, serpiente, gecko, similares), hurón, cobaya.

**Características del soporte:**
- Modelo de identidad completo (las 5 dimensiones).
- Momentos vitales adaptados (escalas temporales propias).
- JTBDs principales (preventiva, alimentación, identidad) activos.
- Vocabulario específico.
- Actores externos limitados (vet exótico es el actor principal).
- Comunidad menor pero existe y suele ser apasionada.
- Sin paseadores típicamente. Sin grooming convencional. Sin entrenadores (excepto loros parcialmente).

#### Nivel C — Soporte básico

**Especies:** Pez, anfibio, roedor pequeño (hámster, ratón, jerbo), invertebrado de compañía (caracol, insecto palo, tarántula).

**Características del soporte:**
- Modelo de identidad presente pero más simple.
- Eventos limitados a básicos (alta, alimentación, observaciones, fin de vida).
- Sin actores específicos típicamente (vet exótico ocasional para roedores).
- Comunidad limitada (pero existe online).
- La familia puede registrar y cuidar lo básico, aunque el ecosistema externo es muy limitado.

#### Nivel D — No soportadas

**Especies:** Ganado (vacas, ovejas, cabras, cerdos como compañía), animales silvestres, animales para consumo.

**Características:**
- Fuera del scope del producto.
- Si alguien intenta registrar uno, el sistema lo deriva (con respeto) a otras plataformas o lo deja como caso especial sin features asociadas.

### 5.3 Equinos como adyacencia futura (Fase 5+)

**Decisión cerrada:** equinos quedan **fuera de los niveles A/B/C/D del producto core**. Son **producto adyacente** futuro.

**Razones (resumen del análisis hecho en sesión):**
- Mercado equino latinoamericano es ~5-6% del mercado mascotas LatAm.
- Es ecosistema completamente distinto (deportivo + rural, no de compañía urbana).
- Vets equinos son especialistas separados.
- El caballo no vive en casa.
- Tickets muy altos (10-30x consulta canina).
- Cadena de cuidado es distinta (caballerizo en vez de paseador, entrenador deportivo en vez de adiestrador conductual).
- Mezclar "tu perrhijo Max" con "tu yegua Catalina" en la misma app rompe coherencia emocional.

**Cómo se trata equinos en el modelo:**
1. **El motor técnico subyacente** (bio-expediente, eventos, perfil vigente, motor de alertas, handshakes) **YA es compatible con equinos** porque está diseñado horizontalmente.
2. **La tabla `cat_especies` tiene una fila `equino` con `activa=false`** que documenta la decisión.
3. **En Fase 5+ se evalúa lanzar e-PetPlace Equine** como producto vertical bajo la marca, con motor compartido pero UX, actores, narrativa y go-to-market separados.

**El principio rector:** el modelo aguanta equinos sin que tengamos que diseñar para equinos. **Foco en mascotas de compañía ahora. Equinos quedan en el horizonte como opcionalidad arquitectónica, no como ruido de scope.**

### 5.4 Perfil de comportamiento del producto por especie

Cada especie tiene un perfil declarativo que modula el producto. Ejemplos resumidos:

**Perro mediano:**
- Momentos vitales: M0-M6 todos aplican. Duración M3: 3-7 años.
- JTBDs principales: 1, 2, 3, 4, 5, 6, 7.
- Actores principales: vet, paseador, grooming, hotel, seller, entrenador.
- Presencia pública default: discoverable.
- Vocabulario: "paseo", "ladrido", "correa", "razas", "olfato".

**Gato:**
- Momentos vitales: M0-M6 todos aplican. Duración M3: 2-9 años.
- JTBDs principales: 1, 2, 3, 5. JTBD-4 indoor sin actor externo típicamente.
- Actores principales: vet, grooming (parcial), seller. Hotel raro. Paseador casi nulo.
- Presencia pública default: solo amigos.
- Vocabulario: "ronroneo", "maullido", "caja de arena", "trepar", "territorio".

**Loro gris africano:**
- Momentos vitales: M0-M6. Duración M3: 4-30 años. **Tutela post-mortem relevante.**
- JTBDs principales: 1, 5. JTBD-2 con vet exótico. JTBD-7 entrenamiento opcional.
- Actores principales: vet exótico, seller especializado.
- Presencia pública default: discoverable.
- Vocabulario: "vocalización", "vocabulario aprendido", "muda de plumas", "enriquecimiento".

**Conejo:**
- Momentos vitales: M0-M6. Duración M3: 2-5 años.
- JTBDs principales: 1, 3, 5. JTBD-3 = corte de uñas, no grooming convencional.
- Actores principales: vet exótico, seller.
- Presencia pública default: discoverable.
- Vocabulario: "tiempo fuera de jaula", "binkies", "vinculación", "compañero conejo".

**Tortuga de tierra:**
- Momentos vitales: M0-M6. Duración M3: 6-50 años. **Producto que acompaña vidas más largas que la de muchos dueños.**
- JTBDs principales: 1 (raro), 5, 8.
- Actores principales: vet exótico (excepcional), seller especializado.
- Presencia pública default: discoverable.
- Vocabulario: "hibernación", "exposición solar", "humedad", "caparazón".

### 5.5 Vocabulario y tono por especie

El producto adapta su vocabulario automáticamente por especie. Cuando una familia registra a un loro, NO ve botones que digan "programar paseo". Cuando registra a un pez, NO ve sugerencias de grooming.

**Microcopy ejemplos:**

Perro: "Hora del paseo de Max."
Gato: "Es momento de jugar con Luna."
Loro: "Hora del enriquecimiento de Luna."
Conejo: "Tiempo fuera de jaula para Tito."
Reptil: "Verificá los parámetros del terrario de Yoshi."
Pez: "Día de cambio parcial de agua del acuario."

Esto **no es decorativo** — refleja respeto por la especie y por la familia que la conoce.

### 5.6 Implicancias técnicas anotadas

Cerradas en S16 (DDL conceptual listo, ejecución pendiente):

- `cat_especies` extendida con `nivel_soporte` (A/B/C/D/inactivo) + `acepta_nuevos_registros` boolean + `motivo_estado` text. Naming: `activo` (existente) se mantiene, NO se renombra a `activa`.
- Equino agregado al catálogo con `acepta_nuevos_registros=false` + `nivel_soporte='inactivo'`, documentando Decisión D15.5.
- Hurón y cobaya agregados al catálogo como Nivel B (faltaban según Sección 5 del modelo).
- Tabla `cat_especies_perfil` con `momentos_vitales_jsonb` (umbrales M1-M5 por especie + override por raza/tamaño), `modo_publico_default`, `jtbds_aplicables` (text[]), `tipos_evento_aplicables` (text[]), `tipos_prestador_aplicables` (text[]), `visibilidad_default_jsonb`. Pre-carga para perro y gato con valores razonables. Conejo/ave/reptil/hurón/cobaya con defaults vacíos hasta validación veterinaria (D-111).
- Tabla `cat_especies_vocabulario` separada con índice por `(especie_codigo, idioma_codigo, clave)` para microcopy específico cruzado con idioma. Soporta i18n desde día 1 (D-139).
- Función `calcular_momento_vital(mascota_id)` reemplaza a `calcular_etapa_vida(fecha, especie)`. Retorna M1-M5 considerando condiciones crónicas (M4 vs M3) y consulta `cat_especies_perfil`. M6 derivado de `estado_vida='fallecida'`. Marcada `STABLE` (corrige bug `IMMUTABLE + now()` de la función anterior).
- Función vieja `calcular_etapa_vida` queda deprecada — no eliminada. Frontend migra gradualmente.

### 5.7 Señales prácticas para Claude y devs

> **Cuando alguien proponga UI que asume perro:** parar. **El producto NO es para perros.** Cualquier feature debe pensarse para perro, gato, conejo, ave, reptil, hurón mínimamente.

> **Cuando alguien proponga agregar equinos al producto core:** rechazar. Decisión cerrada: equinos son adyacencia Fase 5+. Si la tentación es fuerte, releer 5.3.

> **Cuando un dev pregunte "¿qué vocabulario usar para esta nueva feature?":** consultar `cat_especies_perfil` para vocabulario por especie. Si el feature aplica a múltiples especies, debe tener variaciones.

> **Cuando un dev encuentre código hardcoded "perros y gatos":** flag. El modelo es multi-especie. Refactorizar para consultar perfil dinámicamente.

---

## 6. Posicionamiento del producto

### 6.1 "Wow desde día 1", no "está bien"

El detalle conceptual está en Sección 2 (Tesis). Acá la consecuencia operativa:

**Toda feature que se desarrolla pasa por el filtro: ¿genera wow o está suficientemente bien?** Si está suficientemente bien, no se libera. Se rediseña o se descarta.

**No buscamos lanzar muchas features. Buscamos lanzar features que generen wow.**

Esto es **lento** comparado con productos que apuntan a "estar bien rápido". Es **la decisión correcta** porque la categoría tiene incumbentes mediocres atrincherados, y solo wow rompe la inercia.

#### El criterio operativo del wow (S42): cero explicación necesaria

"Wow desde día 1" tiene una prueba de aceptación concreta desde S42: **un usuario nuevo (prestador o dueño) completa su tarea principal sin entrenamiento ni explicación de nadie.** Si un flujo requiere que el founder lo explique en persona, el flujo está mal — no importa cuánta data capture ni cuán correcto sea su modelo subyacente. Origen: reuniones con prestadores reales previas a S42 (un groomer no entendió el flujo de atención hasta que se le explicó — eso es la negación operativa del wow). Los principios de diseño vinculantes del front viven en `ESTRATEGIA_2026H2.md` Sección 7.

### 6.2 Amor al oficio como filtro y como tono

El producto es para **los que aman lo que hacen y a quienes cuidan**.

**Como filtro:** los onboarding de vets, prestadores y familias filtran por pasión. La pregunta clave: "¿por qué te metiste en esto?" / "¿qué significa tu mascota para vos?".

**Como tono:** el producto siente, no transacciona. El microcopy cuida. Las imágenes respetan. Los flujos sensibles (memorial, condiciones, fin de vida) se diseñan con humanidad.

### 6.3 Frases guía consolidadas

Las frases guía son anclas mentales. Se usan en marketing, en onboarding, en el tono general del producto.

- **Capa 1:** *"En e-PetPlace tu mascota no tiene un expediente. Tiene una vida documentada."*
- **Capa 2:** *"e-PetPlace no es donde reservás una cita. Es donde tu mascota es cuidada."*
- **Capa 3:** *"Tu mascota no está sola en e-PetPlace. Pertenece a una comunidad de mascotas reales, con vidas reales, cuidadas de verdad."*
- **Frase de producto:** *"El vet no atendió una consulta — adoptó un caso."*
- **Frase de visión:** *"Es ambicioso. Si no apuntamos a la luna, no llegamos lejos."*

### 6.4 Revelación progresiva de funcionalidades

Decisión de modelo (S15): la app **NO se presenta como superapp completa desde el primer día**. Las funcionalidades se revelan progresivamente a la familia según el momento vital de la mascota y el uso real que va haciendo.

##### El principio

Una superapp con todas las funcionalidades visibles desde el día 1 abruma. Una app simple que crece con el uso, encanta.

**El usuario llega a una app aparentemente simple** (registrar mascota, ver expediente básico, buscar vet). **A medida que la usa, la app le revela funcionalidades adicionales que se vuelven relevantes para su contexto.** Cada revelación es un pequeño wow.

> **No es gamificación de puntos. Es revelación progresiva contextual.**

##### Cómo se diferencia de gamificación tradicional

Gamificación tradicional (que NO hacemos):
- "Subiste de nivel 3, ahora podés usar grooming."
- "Ganaste 500 puntos por registrar a tu mascota."
- "Desbloqueá el módulo de comunidad completando 5 tareas."

Esto es artificial y puede sentirse infantilizado. **No es coherente con el alma del producto.**

Revelación progresiva contextual (lo que SÍ hacemos):
- La mascota cumple 3 meses con la app → "Notamos que llevás a Max al groomer hace unos meses. ¿Te interesa el módulo de seguimiento de grooming?"
- La mascota entra en M2 (crecimiento, completa vacunación) → "Max ya completó su plan de vacunación. ¿Querés conocer paseadores en tu zona?"
- La mascota llega a M4 (condición crónica) → "Max tiene una condición ahora. Te presentamos el módulo de manejo crónico y la comunidad de familias con la misma condición."
- La familia registró 3 mascotas → "Ahora que sos una familia multi-mascota, podemos ofrecerte la vista familiar consolidada."
- La mascota llega a M5 (senior) → "Max está entrando a su etapa senior. Estos años son especiales. Te ofrecemos herramientas específicas para acompañarlo."

##### Principios de la revelación progresiva

**1. La revelación es contextual, no por puntos.**
Lo que dispara la revelación es **un cambio real en la mascota o en el uso** (entrada a momento vital, contratación de prestador habitual, cumplimiento de hito, registro de condición). Nunca es "completaste tarea X, desbloqueaste Y".

**2. La revelación se ofrece, no se impone.**
"Te ofrecemos…" / "¿Querés conocer…?". La familia puede aceptar y empezar a usar la funcionalidad nueva, o ignorarla. **Si la ignora, la app no insiste. La funcionalidad queda disponible cuando ella la busque.**

**3. La revelación tiene narrativa, no es notificación seca.**
"Max ya completó su plan de vacunación" tiene contexto + emoción. "Has cumplido el requisito para desbloquear paseos" es transacción seca. La narrativa es lo que diferencia.

**4. La revelación honra al momento vital.**
Una mascota que entra en M5 recibe revelación con tono respetuoso ("estos años son especiales"). Una mascota en M6 (fin de vida) NO recibe revelaciones de features comerciales. La app respeta los momentos.

**5. La revelación no oculta features básicas.**
Las funcionalidades core (registrar mascota, ver expediente, buscar prestadores) están disponibles desde el día 1 sin necesidad de "desbloqueo". Lo que se revela son **módulos avanzados o contextuales** que ganan relevancia con el uso.

**6. La revelación se calibra por especie.**
A una familia con loro no se le ofrece módulo de paseadores. A una familia con tortuga no se le ofrece módulo de grooming convencional. La revelación respeta multi-especie (Sección 5).

##### Beneficios de este enfoque

**Para la familia:**
- Onboarding inicial simple, no abrumador.
- Cada revelación es pequeño wow ("la app entendió que estoy en este momento").
- App siente que crece con ellos, no que les exige aprenderla toda de golpe.

**Para el producto:**
- Engagement sostenido (cada momento vital trae descubrimientos).
- Retention mejorada (familia regresa porque hay algo nuevo relevante).
- Adopción gradual de superapp sin fricción.
- Diferenciación clara: la app **se siente personal**, no enciclopédica.

**Para el negocio:**
- Cross-sell natural (la revelación es momento orgánico para presentar servicios premium o nuevos prestadores).
- Reducción de overload cognitivo que hace que usuarios abandonen.
- Métrica de uso por capa (qué funcionalidades realmente usan los usuarios).

##### Ejemplos concretos de revelaciones

**M1 → M2 transición:**
"Max completó su plan de vacunación. Ahora puede salir a pasear con tranquilidad. Conocé paseadores de tu zona que otras familias recomiendan."

**Primera estadía en hotel:**
"Esta es la primera vez que Max se queda en un hotel. Te mostramos cómo coordinar todo para que sea una experiencia tranquila para los dos."

**Registro de segunda mascota:**
"Bienvenida Luna a la familia. Ahora podés ver a Max y Luna en una vista familiar consolidada. Conocé las herramientas para hogares multi-mascota."

**Diagnóstico de condición crónica (M3 → M4):**
"Max tiene una condición ahora. Es un momento importante. Activamos para vos: módulo de seguimiento de medicación, comunidad de familias con la misma condición, herramientas de coordinación con tu vet."

**Entrada a M5 (senior):**
"Max está entrando a la etapa senior. Estos años son especiales y merecen acompañamiento cuidadoso. Te ofrecemos: chequeos geriátricos, comunidad de familias de seniors, herramientas para documentar más momentos."

**Tres prestadores habituales identificados:**
"Ya tenés tu equipo de cuidado de Max: Dra. Pérez, Carlos, Pati. Podemos coordinar handshakes entre ellos automáticamente. Te mostramos cómo funciona."

##### Implicancias técnicas anotadas

- **Catálogo `cat_revelaciones`:** declarativo, con `disparador` (cambio de momento vital / prestador habitual identificado / hito registrado / etc.), `feature_revelada`, `mensaje_narrativo` (por idioma), `prioridad`, `condiciones_adicionales`.
- **Worker o motor de evaluación de revelaciones**: similar al motor de alertas pero con propósito distinto. Probablemente comparte infraestructura.
- **Tabla `revelaciones_emitidas`**: historial por familia/mascota, con estado (ofrecida / aceptada / ignorada / descartada).
- **Feature flags por familia**: las funcionalidades reveladas se activan a nivel de familia. La app consulta estado al renderizar UI.
- **Calibración multi-especie**: las revelaciones se filtran por `cat_especies_perfil` (Sección 5).

##### Señales prácticas para Claude y devs

> **Cuando un dev quiera mostrar TODAS las funcionalidades desde el día 1:** parar. **El producto se revela progresivamente.** UI base es simple. Lo avanzado se ofrece contextualmente.

> **Cuando alguien proponga "sistema de puntos / niveles / badges para que la familia juegue":** rechazar. Eso es gamificación tradicional, no encaja con el alma del producto. La revelación es por contexto real, no por puntos.

> **Cuando enfrentes diseño de onboarding inicial:** mostrar solo lo esencial. Registro de mascota, vista de expediente, búsqueda básica de vet. Resto se revela con uso.

> **Cuando una revelación se ofrezca:** narrativa cálida, no transacción seca. "Te ofrecemos…" / "Ahora que Max…" / "Es momento de…". Nunca "Has desbloqueado…".

> **Cuando una familia ignore una revelación 2 veces:** no insistir. La funcionalidad queda accesible si la busca, pero no se sigue ofreciendo automáticamente.

> **Cuando una mascota entre en M6 (fin de vida):** silenciar todas las revelaciones de features comerciales. Solo revelaciones de acompañamiento al duelo (con tono respetuoso) o relacionadas a servicios de fin de vida.

> **Cuando se calibre por especie:** consultar `cat_especies_perfil` antes de revelar. No ofrecer paseador a familia de loro, no ofrecer grooming a familia de pez.

---

## 7. Fases del producto

### 7.1 F0 — Co-diseño multi-vertical (en curso)

**Cuándo:** mientras se construye el producto base.

**Quién:** 3-5 representantes por vertical en co-diseño. ~15-20 actores totales:
- Vets independientes apasionados.
- Paseadores independientes apasionados.
- Grooming dueñas de su local.
- Hoteles/guarderías chicas.
- Sellers de productos premium.

**Qué hacen:** ven prototipos, dan feedback, cuestionan, sugieren. **No son clientes — son product council.** A cambio: primer año gratis + co-credit como fundadores + ser parte del relato.

### 7.2 F1 — Soft launch multi-vertical Ecuador

**Cuándo:** post completitud de Capa 1 + Capa 2 base.

**Quién:** independientes apasionados de 5 verticales (vet, paseador, hotel, grooming, seller productos).

**Filtro de onboarding:** **amor al oficio**, no tamaño de negocio.

**Capas activas:**
- Capa 1 completa.
- Capa 2 con motor de alertas básico + adopción de caso clínico.
- Capa 3 con identidad pública mínima + reputación básica + causas básico (refugios visibles).

**Meta:** generar evangelistas, no maximizar usuarios.

### 7.3 F2 — Cadenas + expansión geográfica

**Cuándo:** cuando F1 tiene tracción consolidada + producto tiene alma definida.

**Qué pasa:**
- Se abren cadenas grandes (clínicas, grooming, hoteles, retailers).
- **El producto ya tiene identidad — las cadenas se incorporan en términos del producto, no al revés.**
- Expansión a Colombia, México, posiblemente otros.
- Capa 3 escala (comunidades por afinidad completas, memorial, red de mascotas básica).

### 7.4 F3 — Comunidad activa con masa crítica + verticales secundarios

**Cuándo:** cuando hay masa crítica de usuarios + comunidades vivas.

**Qué pasa:**
- Capa 3 plena (encuentros, eventos físicos, red de mascotas completa).
- Verticales secundarios: entrenamiento, transporte de mascotas, fotografía profesional, servicios fúnebres, criaderos certificados, refugios formalmente integrados.
- **Wearables** con partners de hardware.

### 7.5 F4+ — IA, DaaS, escala global

**Cuándo:** cuando hay N mínimo de mascotas activas + data acumulada + tracción regional.

**Qué pasa:**
- IA Pet Expert (Fase 4 según `EPETPLACE.md`).
- DaaS agregado anonimizado a fabricantes, farmacéuticas, aseguradoras (con consentimiento explícito + opt-out + auditoría).
- Expansión global (España, USA, etc).
- Posible producto adyacente: **e-PetPlace Equine** como vertical separado.

---

## 8. Principios éticos no negociables

Estos principios **no son configurables, no son excepción posible, no se negocian por revenue**. Se aplican a todo el producto, en todas las fases, sin excepciones.

### 8.1 La mascota es dueña de su vida documentada

La mascota es el sujeto del producto. Su vida documentada le pertenece. La familia es custodia de esa vida. e-PetPlace es facilitador y guardián del modelo, no propietario de la data identificable.

### 8.2 No cría entre mascotas particulares

Ya articulado. Punto cerrado. La cría se canaliza solo por criaderos certificados.

### 8.3 No sponsoreo en recomendaciones clínicas o de servicios

Ningún prestador, fabricante o seller puede pagar para aparecer recomendado por encima de otros en sugerencias clínicas o de servicios. Las recomendaciones son **neutrales, basadas en data real y consenso profesional**.

### 8.4 Reputación de familias es discreta, no humillante

Ya articulado en 3.3.6. Sin ratings públicos. Sin discriminación posible. Sistema interno de protección de mascotas es para intervención de soporte, no sanción.

### 8.5 Memorial respeta el duelo

Sin notificaciones intrusivas. Sin push comercial post-mortem. La vida documentada se preserva con dignidad.

### 8.6 Hitos privados son del humano, inviolables

Nadie excepto el humano que escribió el hito privado puede leerlo. Ni co-dueño, ni admin de e-PetPlace, ni en caso de muerte del humano (a menos que él configuró acceso póstumo).

### 8.7 Multi-especie respeta a cada especie en su naturaleza

Sin tono unificado que asume mascota = perro. Sin features que reducen la dignidad de especies menos comunes. Cada especie es soportada según su naturaleza.

### 8.8 Datos sensibles requieren consentimiento explícito y opt-out fácil

DaaS (data agregada anonimizada) requiere consentimiento explícito de la familia, con opt-out fácil en cualquier momento. Sin defaults opt-in ocultos.

### 8.9 Refugios sobre criaderos en discovery

Cuando una persona busca adoptar mascota, el flujo **prioriza refugios** antes que criaderos certificados. Educación explícita sobre adopción consciente.

### 8.10 Denuncia de maltrato es facilitada, anonimato protegido

Reporte va a entidades locales relevantes con protección de identidad del reportante.

### 8.11 Niños son honrados, no instrumentalizados

Menores participan en el vínculo con la mascota con dignidad y permisos apropiados. No se usan datos de menores con fines comerciales.

### 8.12 Comunicación con familias en duelo es humana

Cuando una mascota muere, los flujos con la familia son humanos, no automatizados sin alma. Customer service capacitado para acompañar.

---

## 9. Implicancias técnicas — estado al cierre de S16

Esta sección consolida las implicancias técnicas. Tras S16, varias quedan cerradas (DDL conceptual listo, ejecución pendiente Sub-bloque 5). El resto sigue como agenda futura.

### 9.1 De Capa 1 (Identidad) — CERRADAS

- Schema de identidad personal estructurada → `evento_identidad_personal` con 5 tipos (`personalidad/gusto/miedo/mania_ritual/señal_sutil`), FK a `familia_miembro`.
- Schema de hitos narrativos público/privado familiar → `evento_hito_narrativo`.
- Schema de hito privado del humano → `hito_narrativo_privado_humano` separada, NO dentro de `eventos_mascota`.
- Estado `mascotas.estado_vida` con transiciones → 3 valores + trigger desde `eventos_mascota`.
- Configuración `mascota_perfil_publico_config` → tabla `mascota_visibilidad_config` 1:1 con mascotas.

### 9.2 De Capa 2 (Cuidado) — PARCIALMENTE CERRADAS

Cerradas:
- Schema `caso_clinico` con vet tratante dual (`cuenta_comercial` + `empleado`) + tabla `caso_clinico_consultor` (segunda opinión).
- FK opcional desde 6 tablas tipadas clínicas a `caso_clinico`.

Pendientes (diferidas a F2 / D-137 motor de alertas):
- Schema `cat_reglas_alerta` declarativo.
- Worker o trigger evaluador del motor de alertas.
- Tabla `alertas_emitidas` con historial.
- Schema `cat_jtbd_actor_por_momento_especie`.
- Schema `handshake_log`.

### 9.3 De Capa 3 (Comunidad) — DIFERIDAS por fase

- Schema de amistades entre mascotas → F2/F3.
- Schema de actos sociales con autor en backend → F2/F3.
- Schema de comunidades, miembros, posts, moderación → F3.
- Schema de memorial → sub-sesión específica de diseño cuando aparezca primer caso real.
- Schema de reputación con badges → F2+.
- Schema de causas (`mascota_en_adopcion`, padrinos, banco de medicación) → F2+.
- Schema de encuentros propuestos y realizados → F2/F3.

### 9.4 De Modelo Humano — CERRADAS

- Schema `familia` como entidad + tipos.
- Schema `familia_miembro` con roles + permisos jsonb.
- Refactor `mascotas.user_id` → tabla `mascota_codueño` con `desde/hasta` nullable (preserva vínculo histórico).
- Schema `mascota_familiar_autorizado` con override de permisos por mascota.
- Schema de transferencia entre familias modelado como cambio de `familia_id` + evento `transferencia_familia` (no tabla aparte).
- Tabla `accion_destructiva_pendiente` con snapshot de co-dueños al momento de propuesta.
- Helper `user_tiene_acceso_a_mascota` reescrito + helper nuevo `user_puede_ver_dimension`.

### 9.5 De Multi-especie — CERRADAS

- `cat_especies` con flags `nivel_soporte` + `acepta_nuevos_registros`.
- `cat_especies_perfil` jsonb con perfil por especie.
- `cat_especies_vocabulario` separada con cruce a idioma.
- Componentes UI consultan perfil dinámicamente.
- Función `calcular_momento_vital` reemplaza `calcular_etapa_vida`.

### 9.6 De Revelación progresiva — DIFERIDAS (F2+)

- Catálogo `cat_revelaciones` declarativo.
- Motor evaluador (probablemente comparte infraestructura con motor de alertas D-137).
- Tabla `revelaciones_emitidas` con historial por familia/mascota.
- Feature flags por familia para activación de módulos revelados.
- Calibración por especie consultando `cat_especies_perfil`.

### 9.7 Deudas técnicas relacionadas

Referenciar `CLAUDE.md` backlog canónico:
- D-110 (Bloque 8 UI del Bio-Expediente) — desbloqueada tras S16, próxima sesión.
- D-117 (Mapeo prestadores_habituales pendiente).
- D-128 (Drift catálogo cat_tipos_evento) — solución en plan, ejecución Sub-bloque 5 Fase H.
- D-130 (Próxima cita como evento nuevo).
- D-111 (Validación veterinaria de umbrales etapa_vida — ahora `momentos_vitales_jsonb` en `cat_especies_perfil`).
- D-137 (motor de alertas declarativo) — desbloquea filtrado fino de visibilidad por rol de prestador.
- D-142 a D-155 (nuevas en S16 — ver `CLAUDE.md`).

**Orden de ejecución del refactor de S16:** definido en plan Sub-bloque 4 (11 fases A-K). Las 9 primeras aditivas. Fase K (reescritura de 88 policies RLS) requiere sesión dedicada con runtime test entre cada policy.

---

## 10. Cómo este documento se relaciona con los otros

### 10.1 Ecosistema de documentos maestros

| Documento | Pregunta que responde | Cuándo leerlo |
|---|---|---|
| `EPETPLACE.md` | ¿Qué negocio es e-PetPlace? | Antes de discutir defensibilidad, revenue, posicionamiento competitivo |
| `MODELO_PRODUCTO.md` (este) | ¿Qué producto estamos construyendo y por qué tiene alma? | Antes de proponer cualquier feature, schema o UI |
| `BIO_EXPEDIENTE.md` | ¿Cómo está construido técnicamente el expediente? | Antes de tocar schema del bio-expediente |
| `MODELO_FINANCIERO.md` | ¿Cómo fluye el dinero en el ecosistema? | Antes de tocar pagos, comisiones, liquidaciones |
| `CLAUDE.md` | ¿En qué estado real está el proyecto hoy? | Al arrancar cualquier sesión |
| `CONTRATO_TRABAJO.md` | ¿Cómo trabajamos el founder y Claude? | Al arrancar cualquier sesión |

### 10.2 Flujos típicos de lectura

**Dev nuevo se suma al proyecto:**
1. `EPETPLACE.md` (visión general del negocio).
2. `MODELO_PRODUCTO.md` (este — qué producto).
3. `CONTRATO_TRABAJO.md` (cómo trabajamos).
4. `BIO_EXPEDIENTE.md` + `MODELO_FINANCIERO.md` (técnico).
5. `CLAUDE.md` (estado actual).

**Founder vuelve después de tiempo:**
1. `CLAUDE.md` última sesión (qué quedó pendiente).
2. `MODELO_PRODUCTO.md` (recordar visión completa).
3. Otros según necesidad.

**Claude arranca sesión sobre feature nueva:**
1. `CONTRATO_TRABAJO.md` (reglas operativas).
2. `MODELO_PRODUCTO.md` (frame conceptual de la feature).
3. `BIO_EXPEDIENTE.md` (si la feature toca bio-expediente).
4. `MODELO_FINANCIERO.md` (si la feature toca dinero).
5. `CLAUDE.md` última sesión (estado actual).
6. `EPETPLACE.md` (si la feature toca posicionamiento).

### 10.3 Cuando los documentos se contradicen

Si un documento contradice a otro, **es problema serio**. Procedimiento:

1. Identificar la contradicción explícitamente.
2. Discutir founder + Claude qué versión es correcta.
3. Actualizar el documento equivocado.
4. Anotar la corrección en historial de versiones de ambos documentos.

**Jerarquía implícita de autoridad:**
- `MODELO_PRODUCTO.md` define qué se construye.
- `EPETPLACE.md` define por qué (negocio).
- `BIO_EXPEDIENTE.md` y `MODELO_FINANCIERO.md` definen cómo técnicamente.
- `CLAUDE.md` registra el estado.
- `CONTRATO_TRABAJO.md` define el proceso de trabajo.

Si `BIO_EXPEDIENTE.md` dice algo que contradice a `MODELO_PRODUCTO.md`, **prevalece este documento** (lo conceptual sobre lo técnico). Se ajusta el técnico al conceptual, no al revés.

---

## Próximas secciones (en redacción)

Documento completo en su primera versión integral. Próximas evoluciones pueden incluir:
- Sub-sesión específica de diseño de memorial (Capa 3.3.5).
- Sub-sesión específica de motor de alertas (Capa 3.2.5).
- Sub-sesión específica de visibilidad cruzada inteligente (Capa 3.2.6).
- Refinamiento de matriz JTBD × Momento × Especie cuando llegue feedback de co-diseño F0.
- Validación veterinaria de umbrales de etapa de vida (D-111).

---



---



## Historial de versiones

- **v0.1 (13 May 2026 — S15):** Primer sub-bloque. Secciones 1-2 (Propósito + Tesis). Establece el frame conceptual completo del producto en formato de "una página leída" para que cualquier lector entienda en menos de 30 minutos qué es e-PetPlace y por qué. Las secciones detalladas (3 capas, modelo humano, multi-especie, fases, principios) se desarrollan en sub-bloques siguientes.
- **v0.1.1 (13 May 2026 — S15):** Agregada referencia a `MODELO_FINANCIERO.md` en sección 1 como cuarto documento maestro del proyecto. Sin cambios de modelo.
- **v0.2 (13 May 2026 — S15):** Sub-bloque B.1 — Sección 3.1 (Capa 1: Identidad y vida de la mascota). Articula las 5 dimensiones de identidad (biológica, personal, relacional, temporal, narrativa) con ejemplos multi-especie en cada una. Construcción progresiva en 3 modos. Visibilidad híbrida por dimensión. Casos especiales (adopciones, fallecidas, perdidas, transferidas, identidad incierta). Implicancias técnicas anotadas para sub-sesión futura.
- **v0.3 (13 May 2026 — S15):** Enriquecimiento tras segunda lectura crítica desde perspectiva de lector frío. Agregadas 9 mejoras: (1) Glosario rápido como Sección 0 con 22 términos; (2) Sección 1 ampliada referenciando `CLAUDE.md` y `CONTRATO_TRABAJO.md` además de los otros documentos; (3) Sección 2.5 "Lo que e-PetPlace NO es" con 8 contraposiciones; (4) Sección 3.0 puente narrativo con ejemplo de cómo se entrelazan las capas (caso Max); (5) Mini-índice al inicio de Capa 1; (6) Sección 3.1.6 nueva con señales prácticas para Claude/devs; (7) Sección 3.1.7 anexo con dos casos completos (Max beagle y Luna loro gris); (8) Sección 3.1.8 cierre conecta Capa 1 con "wow desde día 1"; (9) Estandarización de terminología familia/co-dueños/dueño en todo el documento.
- **v0.4 (13 May 2026 — S15):** Sub-bloque B.2 — Sección 3.2 (Capa 2: Cuidado integral a lo largo de la vida). Articula los 7 momentos vitales (M0-M6) con duraciones por especie, los 8 JTBDs base, matriz JTBD × Momento × Especie × Actor (perro/gato base + variaciones para Nivel B), adopción de caso clínico como concepto diferenciador, motor de alertas con 3 tipos (ausencia / presencia / oportunidad), visibilidad cruzada inteligente por rol (matriz completa), handshakes entre actores con 5 ejemplos, mascotas en situaciones especiales (condiciones múltiples, viajeras, segunda opinión, etc), implicancias técnicas anotadas, 10 señales prácticas para Claude/devs, anexo extenso con caso de Max a lo largo de un año real (12 meses de cuidado documentado), cierre conectando con "wow desde día 1". Aplica todas las técnicas de v0.3.
- **v0.5 (13 May 2026 — S15):** Sub-bloque B.3 — Sección 3.3 (Capa 3: Comunidad y pertenencia). Articula las 7 sub-capas: presencia pública, red de mascotas (íntima) vs red de dueños (operativa), comunidades por afinidad, encuentros con propósito (con decisión ética cerrada de NO cría entre particulares), memorial respetuoso, reputación bidireccional no humillante, causas y bien común. Activación por fases. Diferenciaciones por especie. 10 señales prácticas. Casos de ejemplo (capa social de Max vs Luna). Cierre con wow.
- **v1.0 (13 May 2026 — S15):** Sub-bloque B.4 — Primera versión integral completa. Secciones agregadas: 4 (Modelo humano transversal: familia, co-dueños simétricos, familiares autorizados, transferencias, hitos privados del humano), 5 (Multi-especie: 4 niveles A/B/C/D + equinos como adyacencia futura), 6 (Posicionamiento: wow desde día 1 + amor al oficio + frases guía consolidadas), 7 (Fases F0-F4+ del producto), 8 (12 principios éticos no negociables), 9 (Implicancias técnicas consolidadas como agenda de sub-sesiones futuras), 10 (Relación con otros documentos maestros, flujos de lectura, jerarquía cuando hay contradicción). Documento listo como herramienta de trabajo para Claude futuro, devs nuevos, founder, y eventualmente inversores/socios. Cada sección con mini-índice cuando aplica, señales prácticas, multi-especie integrado, ejemplos concretos.
- **v1.1 (13 May 2026 — S15):** Agregada Sección 6.4 — "Revelación progresiva de funcionalidades". Decisión de modelo: la app NO se presenta como superapp completa desde el día 1. Las funcionalidades se revelan progresivamente según momento vital de la mascota y uso real. NO es gamificación de puntos — es revelación contextual con narrativa cálida. 6 principios, ejemplos concretos, implicancias técnicas anotadas (catálogo `cat_revelaciones`, motor evaluador, tabla `revelaciones_emitidas`), señales prácticas para Claude/devs. Concepto agregado al glosario. Sección 9 actualizada con punto 9.6 nuevo.
- **v1.2 (13 May 2026 — S16):** Cierre de refactor de modelo de datos. 24 decisiones cerradas en Sub-bloques 1 (mapeo conceptual) + 2 (relevamiento literal de DB) + 3 (DDL conceptual) + 4 (plan de migración). Modificaciones: Sección 3.1.4 con nueva sub-sección "Estados de vida de la mascota" (3 valores activa | perdida | fallecida, transferencia como cambio de familia_id). Sección 4.6 con implicancias técnicas cerradas (núcleo familia + co-dueños + visibilidad + acciones destructivas). Sección 5.6 con implicancias multi-especie cerradas (cat_especies_perfil + cat_especies_vocabulario + calcular_momento_vital). Sección 9 consolidada distinguiendo CERRADAS vs DIFERIDAS por fase. Documento nuevo POLITICAS_EPETPLACE.md creado en paralelo con 12 políticas operativas derivadas. Enmienda S16 a CONTRATO_TRABAJO.md (regla 67 refinada + regla 70 nueva). Ejecución SQL del refactor pendiente Sub-bloque 5 (S17+).
- **v1.3 (5 Jul 2026 — S42):** Agregado criterio operativo del wow ("cero explicación necesaria" con prueba de aceptación) en Sección 6, derivado de evidencia de prestadores reales. Referencia cruzada a `ESTRATEGIA_2026H2.md`.
