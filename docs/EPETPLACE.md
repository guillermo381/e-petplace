# EPETPLACE — Visión y modelo de negocio

> **Versión:** v1.4
> **Última actualización:** 5 Jul 2026 — Sesión 42. Posicionamiento competitivo corregido (Petlove/Laika; "ventana"), P1 recalibrado, Tienda con integración VTEX propia (sale MediaLab). Documento de referencia: `ESTRATEGIA_2026H2.md`.
> **Audiencia:** Claude (web y code) en toda sesión futura. Cualquier dev que se sume al proyecto. Posibles inversores y socios estratégicos.
> **Análogo a:** `MODELO_FINANCIERO.md` (motor financiero) y `BIO_EXPEDIENTE.md` (modelo de datos central).

---

## Cómo usar este documento

- **Antes de cualquier decisión estratégica**: revisar visión y principios.
- **Antes de proponer features**: contrastar con la visión y los ejes JTBD.
- **Antes de incorporar nuevos verticales**: validar que abonan a defensibilidad por captura de data + efecto red.
- **Cuando el modelo evoluciona**: actualizar el documento explícitamente, no dejar la realidad y el documento desincronizados.

---

## Visión

**e-PetPlace es la superapp universal del mundo mascota.**

No es software para veterinarios. No es software para paseadores. No es un marketplace tipo Mercado Libre con productos. Es la **plataforma única donde se cruzan dueños, mascotas, prestadores de servicios, sellers de productos, criaderos, refugios, y datos de comportamiento (wearables)** — todos contribuyendo a un activo central: el **Bio-Expediente unificado de la mascota**.

La diferencia clave: **toda transacción en el ecosistema genera un evento que se integra al Bio-Expediente.** Una compra de alimento, una cita de grooming, una vacuna, un paseo, una emergencia atendida — cada interacción enriquece el expediente vivo de la mascota.

El modelo es **marketplace en esencia, superapp en práctica.** Marketplace porque conecta oferta (prestadores, sellers, criaderos) con demanda (dueños). Superapp porque la experiencia integrada (timeline única, prestadores habituales recordados, IA que asiste sobre data histórica) hace que el dueño no quiera salir.

---

## Defensibilidad

### Por captura de data

El Bio-Expediente es **propiedad del dueño**, **gestionado por e-PetPlace**, **alimentado por todos los actores del ecosistema**. Cada evento es una pieza de data difícil de replicar:

- Una vacuna aplicada con timestamp, lote, vet, dosis.
- Una observación de comportamiento por contexto (grooming, paseo, hotel).
- Una medición de peso con método (clínico, casa, estimación).
- Un wearable que registra patrones de actividad y telemetría 24/7.

Esa data tiene 3 niveles de monetización (definidos en BIO_EXPEDIENTE.md):
- **N1 (permitido):** insights al dueño sobre su mascota.
- **N2 (permitido):** insights agregados anonimizados a la industria (DaaS).
- **N3 (prohibido):** venta de data identificable a terceros.

**Defensibilidad = nadie más tiene este expediente.** Replicarlo desde cero requiere años de captura.

### Por efecto red

Cada vertical agregado multiplica el valor de los anteriores:

- Más vets → más expedientes ricos → más razón para que el dueño use la app.
- Más dueños activos → más demanda para prestadores → más razón para que se sumen.
- Más sellers de productos → más conveniencia integrada → más retención del dueño.
- Más wearables → más data continua → más diferenciación frente a competidores que solo capturan en eventos puntuales.

El efecto red es **multi-lado**: hay 5+ tipos de actores contribuyendo, no 2 como un marketplace tradicional.

### Por integración con prestadores reales

A diferencia de apps "directorio de vets", e-PetPlace gestiona el **flujo completo de la transacción**: booking, pago (Kushki), historia clínica registrada en DB, liquidación al prestador, soporte al cliente. El prestador no usa otro software paralelo — usa e-PetPlace como su CRM y operador financiero.

Esto crea costo de cambio alto para el prestador (su data está en e-PetPlace) y diferenciación frente a competidores que solo conectan sin operar la transacción.

---

## Modelo de negocio

### Revenue streams

Definidos en detalle en `MODELO_FINANCIERO.md`. Resumen:

1. **Marketplace fee de productos** — comisión por venta de productos (alimentos, accesorios, medicación de venta libre, productos para mascotas en general).
2. **Service fee de prestadores** — comisión sobre cada cita atendida (vet, grooming, paseo, hotel, emergencias, certificaciones).
3. **Suscripciones Prime para dueños** — features premium (bio-expediente extendido, IA Pet Expert, alertas preventivas, descuentos, envío gratis).
4. **Suscripciones de servicio** — bonos prepagados (paquetes de paseos, certificados internacionales, planes anuales de vacunación).
5. **DaaS (Data-as-a-Service) agregado anonimizado** — insights de industria a fabricantes de alimentos, farmacéuticas, aseguradoras. Requiere consentimiento N≥50 mascotas por insight y opt-in del dueño.
6. **Estadias** — comisión sobre hoteles/guarderías de larga duración.
7. **Donaciones a refugios** — fee mínimo sobre flujo (motor financiero ya soporta este origen).
8. **Bonos** — venta de bonos prepagados con margen.

Multi-moneda y multi-país soportado desde el motor financiero. Kushki como gateway en LatAm.

### Costo de adquisición vs costo de captura de data

El dueño cuesta poco adquirir (la app es gratis, hay features genuinos sin Prime). Lo crítico es **retención por captura de data**: el dueño que llega y no carga ni una mascota se pierde; el dueño que carga una mascota y ve un timeline vivo retorna.

Por eso, **el Bio-Expediente no es solo data — es el producto retención**.

---

## Tienda y productos (integración VTEX propia)

La tienda de productos (alimento, accesorios, medicación de venta libre) usa **VTEX como infraestructura de fulfillment** (stock, pricing, checkout, logística). La integración con VTEX es **responsabilidad propia de e-PetPlace** desde S42: MediaLab fue descartado como constructor del portal-sellers por costo (3x) sin valor suficiente. La decisión VTEX-como-infraestructura se mantiene intacta; cambió el constructor del pegamento y de la UI del seller, no el plano.

### Arquitectura

- **Sellers** son cuentas comerciales en `cuentas_comerciales` (`tipo_actor='seller_productos'` en `cuenta_roles`).
- **Productos** vivirán en catálogo centralizado de e-PetPlace (tabla `productos` pendiente — ver PE7 BIO_EXPEDIENTE.md).
- **VTEX** opera el fulfillment: stock, pricing, checkout, logística. e-PetPlace conoce el pedido pero no lo procesa.
- **Eventos de compra** fluyen a `eventos_mascota` (`tipo='producto_asignacion'`) vía webhook con `creado_por_sistema='vtex_integration'`. El `cuenta_comercial_id` del evento es el seller registrado, no VTEX (sistema externo).

### Decisiones pendientes (D-126)

- Diseño exacto del webhook VTEX → e-PetPlace.
- Política de re-tries y idempotencia ante webhook duplicado.
- Manejo de refunds y cancellations bidireccionales (evento inverso en motor financiero).
- RLS de INSERT en eventos de producto: policy para `service_role` o función SECURITY DEFINER específica que valida payload VTEX.

**Estado S42:** D-126 cambia de dueño (e-PetPlace, ya no MediaLab) y queda **congelada con criterio de disparo**: primer seller real con intención de vender + tienda priorizada en roadmap. Contratar un dev puntual para esta integración es opción válida el día del disparo — lo descartado fue el precio y el modelo de MediaLab, no la ayuda externa. Nota adicional: e-petplace-v2 contiene una tienda propia prototipo (Store/Cart/Checkout, tabla `pedidos`) que contradice esta sección; la contradicción está anotada en `ESTRATEGIA_2026H2.md` Sección 10 y se resuelve cuando la tienda tenga disparo.

### Por qué importa para el Bio-Expediente

Cada compra de alimento, suplemento, medicación o accesorio asignada a una mascota es un evento que enriquece el Bio-Expediente. Valida el principio P1 ("toda transacción genera un evento") y permite que el dueño (y eventualmente la IA) razone sobre patrones nutricionales, frecuencia de recompra, gasto promedio por mascota.

VTEX queda como **proveedor de infraestructura** (fulfillment), no como actor del modelo conceptual. e-PetPlace mantiene control sobre el evento, el seller controla el catálogo de su producto, y el portal de gestión del seller es responsabilidad propia de e-PetPlace desde S42 (ver "Estado S42" en D-126).

---

## Posicionamiento

**Pelea por referente global del mundo mascota.**

Categoría: superapp de servicios para mascotas. Análogo (a nivel arquitectónico, no de UI) a Mercado Libre + WhatsApp + Strava en un solo dominio: el cuidado de mascotas.

Competidores parciales:
- Apps tipo "directorio de vets" — débil, no integran transacción.
- Apps tipo "marketplace de productos para mascotas" — débil, no capturan data de vida de la mascota.
- Software vertical para vets (estilo VetCove, IDEXX VetConnect) — débil para dueño, no es superapp.
- Apps de wearables aisladas — capturan data pero no integran ecosistema de servicios.

**Nadie tiene el Bio-Expediente longitudinal multi-actor — pero el espacio ya no está vacío.** Petlove (Brasil) opera una superapp pet integrada (productos + plan de salud + hospedaje + guardería + pet sitter + atención veterinaria), absorbió a DogHero (que ya sumaba más de un millón de mascotas registradas y cinco familias de servicios) y en 2026 está migrando la gestión de sus prestadores a una app propia. Laika opera productos + servicios en Colombia, México y Chile. Lo que ninguno tiene es el expediente longitudinal event-sourced alimentado por todos los actores — ese sigue siendo el diferencial. La lectura correcta es: **hay ventana, no espacio abierto**; en Brasil se está cerrando, en los países hispanos sigue más abierta. La agilidad no es opcional. *(Corregido en S42 con research de mercado; la versión anterior afirmaba "espacio abierto" sin evidencia.)*

### Prioridad estratégica del founder (declarada S15)

**e-PetPlace se construye como negocio grande y exitoso, con prioridad al negocio, y simultáneamente como obra profunda y significativa.**

Esto significa, operativamente:

- **Decisiones de negocio (revenue, expansión, partnerships) tienen peso prioritario** cuando hay que elegir entre alternativas que no rompan el alma del producto.
- **Decisiones que rompan los principios éticos no negociables (ver `MODELO_PRODUCTO.md` Sección 8) no se toman, aunque tengan retorno financiero claro.** El alma no se negocia.
- **Cuando hay tensión real entre "lo más rentable rápido" y "lo más coherente con la visión", se opta por lo coherente con la visión.** Pero se busca rentabilidad agresivamente dentro de ese marco.

Esta posición es deliberada y reconoce dos verdades simultáneas:
1. Sin negocio sano, el producto no sobrevive y no impacta.
2. Sin alma coherente, el negocio se vuelve commodity y los competidores con más capital lo barren.

**El runway financiero hoy no tiene límite conocido** (founder + esposa via Satori). Se decide invertir con criterio: cada gasto debe tener sentido para el plan estratégico, no por urgencia ni por presión externa.

Origen: declaración explícita del founder en cierre extendido de Sesión 15.

---

### Disposición a Reconstruir (declarada S19)

Cuando una pieza del producto (código, modelo, documento, decisión) deja de reflejar la visión actual de e-PetPlace, la respuesta correcta no es parchar ni postergar — es reconstruirla.

Esto NO significa reescribir por capricho. Significa que cuando algo no encaja con el modelo o la visión vigente, **lo cerrable hoy se cierra hoy**. No queda como deuda silenciosa que erosiona la coherencia del producto.

**Casos típicos donde aplica:**

- Código que funciona pero refleja un modelo conceptual viejo. Ej: `walkin.ts` mezclando "walk-in real" con "alta asistida" — eliminado y reemplazado por flow específico.
- Documentación que ya no describe la realidad. Ej: documento de S5 referenciando modelo pre-S13 — re-escrito o anotado como histórico.
- Decisiones técnicas que asumían un mundo distinto. Ej: Edge Function `crear_cliente_walkin` con `country_code` hardcoded — descontinuada con la consolidación de RPCs.

**Cómo se distingue de "reescribir por capricho":**

La Disposición a Reconstruir NO es:
- Refactorizar por estética sin cambio de modelo subyacente.
- Reescribir código maduro funcional porque "se podría hacer mejor".
- Cambiar nomenclatura sin razón conceptual.

La Disposición a Reconstruir SÍ es:
- Identificar piezas cuyo modelo subyacente ya no es el modelo del producto.
- Removerlas o reemplazarlas con piezas alineadas con la visión actual.
- Documentar el cambio para que la próxima sesión no resucite el modelo viejo.

**Implicancia operacional:**

Aplicar Disposición a Reconstruir requiere coraje y honestidad. Coraje para reconocer que algo construido antes ya no sirve. Honestidad para no inventar razones para mantenerlo.

La regla operativa es: **si la pieza no encaja con la visión, reconstrucción inmediata es preferible a deuda silenciosa**.

---

## Trayectoria

### Hoy (Mayo 2026)

- Motor financiero implementado en DB (compartido con repo paralelo).
- Wizard de alta de prestador en producción (portal-prestadores).
- Bio-Expediente: modelo de datos completo en DB (S13 Bloque 4 + 5). Pendiente RLS final, wrappers TS, UI.
- Sin prestadores reales todavía.
- Soft launch Ecuador.

### Hitos próximos (en orden)

1. Cerrar Bio-Expediente end-to-end (RLS + wrappers + UI).
2. Primer prestador real registrado (criterio de disparo para staging separado, PITR, primer cobro real con Kushki).
3. Primer dueño con expediente real cargado.
4. Primera transacción completa (cita + pago + HC + liquidación).
5. Wearable integration (ya hay schema, falta motor de alertas e integración con fabricantes).
6. IA Pet Expert (Fase 4 de monetización — requiere N mínimo de mascotas activas).
7. Expansión Colombia, México.
8. DaaS launch (requiere N mínimo de mascotas con consentimiento + auditoría de uso).

### Visión largo plazo

**Convertirse en referente global de servicios y bio-expediente unificado de mascotas.** No "el mejor en LatAm" — el referente global. La data + la red, replicada en escala, es defensible globalmente.

---

## Principios de producto

Estos guían qué se hace y qué no:

### P1 — El bio-expediente es el activo; la experiencia impecable es su condición de existencia

El expediente es el activo del negocio y el motor de retención de largo plazo — pero **no es el gancho**. Nadie llega por el expediente: llegan por la conveniencia y la confianza del uso diario, y el expediente se llena como sedimento de esa experiencia. Por lo tanto: la calidad de la experiencia diaria NO está subordinada a la captura de data — es su prerequisito. Una feature que captura data pero degrada la experiencia (fricción, complejidad que requiere explicación) es una feature mal diseñada, no una prioridad alta. Entre dos features de experiencia equivalente, gana la que enriquece el expediente.

*Recalibrado en S42: la versión anterior ("toda feature que no enriquece el expediente es de baja prioridad, por buena que sea como UX aislada") aplicada literalmente produjo un portal con back excelente y front que los prestadores no entendían. La teoría de llegada completa vive en `ESTRATEGIA_2026H2.md` Sección 4.*

### P2 — El dueño es dueño del expediente

Sin excepciones. e-PetPlace lo gestiona, pero el dueño puede exportar, transferir, eliminar (con costos de eliminación claros).

### P3 — Los prestadores son contribuyentes, no clientes del software

El prestador usa e-PetPlace porque captura clientes y le simplifica operación, pero su valor real es lo que aporta al expediente.

### P4 — Sin sponsoreo en recomendaciones clínicas

Nunca un fabricante paga para que se recomiende su medicación o alimento por encima de otro. Las recomendaciones clínicas y nutricionales son neutrales basadas en data de la mascota y consenso veterinario.

### P5 — Transparencia del "por qué"

Cuando la app recomienda algo (un prestador, un producto, un servicio), el dueño puede ver por qué (ranking, historial, calificaciones, distancia). Sin black box.

### P6 — Opt-out visible en DaaS

El uso de data agregada anonimizada requiere consentimiento explícito y opt-out fácil en cualquier momento. No es default opt-in oculto.

### P7 — Multi-país desde el día 1

No diseñar features que asuman Ecuador. País es atributo, no constante. Catálogos multi-país, monedas múltiples, ortografías regionales.

---

## Relación con otros documentos

- **`BIO_EXPEDIENTE.md`** — define el modelo conceptual y técnico del expediente. Este documento (`EPETPLACE.md`) define **por qué** importa.
- **`MODELO_FINANCIERO.md`** — define cómo se captura y liquida revenue. Este documento define **qué** revenue streams hay.
- **`CLAUDE.md`** — estado operacional. Este documento define **dirección** estratégica.
- **`CONTRATO_TRABAJO.md`** — cómo trabajamos founder + Claude. Independiente de visión.

---

## Historial de versiones

- **v1.0 (11 May 2026 — S13)**: Primera versión. Articula visión, defensibilidad, modelo de negocio, posicionamiento, trayectoria, principios.
- **v1.1 (12 May 2026 — S14)**: Agregada sección "Tienda y productos" describiendo arquitectura paralela con MediaLab + VTEX. Cierra D-127.
- **v1.2 (13 May 2026 — S15)**: Agregada nota estratégica del founder sobre prioridad negocio + obra significativa + runway.
- **v1.3 (15 May 2026 — S19)**: Subsección "Disposición a Reconstruir" agregada al final de Posicionamiento. Política operativa para gestionar piezas (código, modelos, documentos) cuyo modelo subyacente ya no refleja la visión actual. Encabezado del archivo resincronizado con historial (v1.1 → v1.3 directo, tras detectar drift).
- **v1.4 (5 Jul 2026 — S42):** Posicionamiento competitivo corregido con research de mercado (Petlove/DogHero, Laika; "ventana", no "espacio abierto"). P1 recalibrado: experiencia impecable como condición de existencia, expediente como sedimento y activo. Sección Tienda: sale MediaLab como constructor, integración VTEX responsabilidad propia, D-126 con nuevo dueño y disparo. Documento de referencia: `ESTRATEGIA_2026H2.md`.
