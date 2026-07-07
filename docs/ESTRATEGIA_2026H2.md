# ESTRATEGIA_2026H2 — Acta de la parada estratégica (S42)

> **Versión:** v1.0
> **Última actualización:** 5 Jul 2026 — Sesión 42 (parada estratégica, conceptual pura).
> **Audiencia:** Claude (web y code, como arquitecto y ejecutor) en toda sesión futura. Founder al volver de cualquier pausa. Cualquier dev que se sume.
> **Relación:** este documento registra las decisiones de rumbo de S42 y **prevalece sobre cualquier pasaje de los demás docs maestros que lo contradiga**, hasta que las enmiendas de la Sección 12 se apliquen. Después de aplicadas, cada doc vuelve a ser autoridad en su dominio.

---

## Cómo usar este documento

- **Al arrancar cualquier sesión de construcción post-S42:** leerlo antes que el backlog. Define qué se construye, sobre qué stack, y qué está congelado con qué disparo.
- **Ante la tentación de agregar alcance:** contrastar con la Sección 8 (alcance F1 recortado). Si no está ahí y no tiene disparo cumplido, no se construye.
- **Ante una decisión de diseño de UI:** la Sección 7 es vinculante.
- **Cuando una señal temprana (Sección 4) dé mal:** eso no se ignora ni se racionaliza — se trae a sesión.

---

## 1. Por qué existe este documento

S42 fue una parada estratégica deliberada: el producto no tiene usuarios reales todavía, por lo que el costo de corregir rumbo era el más bajo que va a tener jamás. Se convocó con evidencia nueva: (a) reuniones con prestadores reales (groomers y paseadores; notas perdidas, reconstruidas de memoria — peso epistémico reducido y declarado), (b) un mes intensivo construyendo Kaxo con lecciones de producto y proceso, (c) research de mercado sobre las apps mejor calificadas del rubro, (d) relevamiento del estado real de la app cliente (e-petplace-v2).

La sesión corrió con una regla de honestidad explícita: nada se defiende por estar construido, nada se tira por atractivo de hoja en blanca. Cada decisión de abajo tiene su anclaje en evidencia, lección aplicable, o apuesta de visión declarada como tal.

---

## 2. La evidencia (resumen ejecutivo del Bloque 1)

**De los prestadores (memoria reconstruida, solo groomers y paseadores):**
- Paseo: la idea es correcta, pero debe ser *muy* simple. — CONFIRMA el diseño conceptual, advierte sobre el volumen.
- Grooming: el flujo actual "no se entiende hasta que se explica". — CONTRADICE "wow desde día 1" en la práctica.
- Ambos: mobile es el dispositivo primario; el desktop es casi inaccesible en su jornada. — CONTRADICE la superficie web desktop-first del portal.
- Fondo oscuro por defecto: rechazado; prefieren claro.
- Frase textual: "se ve como una aplicación de hace 10 años". — El front no entrega el alma que los docs diseñaron.

**Del mercado (apps top: MoeGo, Time To Pet, Scout, Gingr):**
- Lo que se premia: agenda como centro, recordatorios automáticos, booking online, pagos integrados, app móvil excelente, mínima fricción. En paseo: GPS + foto + reporte al dueño en un solo workflow.
- El "report card" por atención (estándar del rubro) valida el concepto de evento_atencion — con la diferencia de que e-PetPlace lo acumula longitudinalmente.
- **Corrección al posicionamiento:** el espacio NO está vacío. Petlove (Brasil) es una superapp pet operativa (productos + plan de salud + hospedaje + guardería + sitter + vet) que absorbió DogHero y está lanzando app de gestión para sus prestadores. Laika opera en Colombia/México/Chile. Lo que nadie tiene: el expediente longitudinal event-sourced multi-actor. Hay **ventana**, no espacio abierto; en Brasil se está cerrando.

**De Kaxo (lecciones que traducen):** minimizar clics (se amplifica en móvil), agente embebido como facilitador, construir ambos lados casi en paralelo, Code con acceso a DB y creando las migraciones. **No traducen:** motor RFP/match competitivo, negociación bilateral, superficie de fases de proyecto — dinámicas B2B de ticket grande y baja frecuencia; pet services es lo inverso.

---

## 3. Veredictos de supuestos fundacionales (Bloque 2)

| # | Supuesto | Veredicto | Consecuencia |
|---|----------|-----------|--------------|
| S1 | La fragmentación de servicios es un problema real del pet parent | **VALIDADO** (a nivel problema) | Base firme del producto |
| S2a | El dueño valora *ver* la historia de su mascota | SIN EVIDENCIA — barato de validar | Test con timeline poblado (Zeus) ante 10-15 pet parents, antes del soft launch |
| S2b | El expediente retiene al dueño y el prestador lo alimenta | **APUESTA DE VISIÓN** (ver Sección 4) | Se valida en operación con señales tempranas |
| S3 | Prestador como punto de entrada, secuencial | CONTRADICHO en implementación; superado por "ambos lados en paralelo" | Rumbo (b) |
| S4 | MVP 3 servicios / vet como ancla | MIXTO: paseo validado, grooming a rediseñar, **Familia A sin una sola conversación** | Familia A congelada — disparo: 3-5 reuniones con vets |
| S5 | Cierre con calidad y evidencia | Principio se mantiene; implementación contradicha (costo UX excesivo) | Rediseño con criterio "cero explicación" |
| S6 | Ecuador-first | Sin evidencia, riesgo bajo | No se gasta energía; P7 protege |
| S7 | Superapp multi-portal / superficie web | Arquitectura multi-actor OK; superficie desktop CONTRADICHA | Rumbo (b2) |
| S8 | "El espacio está abierto" | CONTRADICHO (Petlove, Laika) | Reescritura de posicionamiento + urgencia real |

---

## 4. El problema re-enunciado y el marco de decisión

### El problema (tres frases, sin jerga)

1. Tener una mascota hoy significa coordinar al veterinario por WhatsApp, al paseador en efectivo, a la peluquería por Instagram y la comida por otro lado — y la historia del animal no la guarda nadie: vive repartida en la memoria de cada uno.
2. e-PetPlace es para el dueño que trata a su mascota como familia: un solo lugar donde encontrar gente confiable, agendar, pagar y ver cómo fue cada atención — y de paso, sin esfuerzo, la vida de su mascota queda registrada.
3. Ese dueño cambia de hábito por lo que le resuelve *hoy* (conveniencia y tranquilidad del primer uso), y se queda por lo que se acumula *después* (la historia completa, que no puede llevarse a ningún otro lado).

### La teoría de llegada (corrige a EPETPLACE.md)

**El expediente es el activo del negocio y el motor de retención, pero no es el gancho.** La experiencia diaria impecable es la condición de existencia; el expediente es lo que esa experiencia deja como sedimento. P1 se recalibra en consecuencia (ver Sección 12): la calidad de la experiencia deja de ser subordinada a la captura de data — es su prerequisito. P1 aplicado literalmente produjo el portal que el groomer no entendió; eso no se repite.

### Mercado vs apuestas de visión

- **Deciden el mercado y la evidencia:** superficie (móvil), complejidad tolerable, estética, orden de construcción. Ahí el mercado ya habló y se obedece.
- **Son apuestas de visión** (estilo iPhone/Nubank — el problema está validado, la solución se apuesta): el Bio-Expediente como imán de largo plazo, la superapp integrada. Lo que se les exige no es validación previa sino (a) **ejecución al nivel de la apuesta** — jamás lanzar algo que "no se entiende hasta que se explica" — y (b) **señales tempranas definidas de antemano**.

### Señales tempranas (v0 — se calibran números al armar el soft launch)

- **Prestador:** un groomer/paseador nuevo cierra su primera atención real sin ayuda ni entrenamiento. % de atenciones cerradas con su evento registrado.
- **Dueño — activación:** % de registros que cargan al menos una mascota en la primera sesión.
- **Dueño — retención:** retorno a 7 días; % de dueños que abren el timeline de su mascota al menos una vez por semana.
- **Expediente — sedimento:** eventos por mascota activa por mes (la métrica del activo).

Si estas señales dan mal, no se racionaliza: se trae a sesión estratégica.

---

## 5. Rumbo firmado

**(b) Reforma móvil-first sobre lo construido, con ambos lados casi en paralelo.** Backend intacto (es el activo). Cliente prestador renace como app móvil con salto visual real. App del dueño avanza casi en paralelo para que las conexiones se vean de verdad y el expediente sedimente desde el primer flujo real. Descartados con argumento: (a) ajustes cosméticos (ignora la evidencia móvil), (c) pivote dueño-primero (marketplace vacío; los prestadores rechazaron la superficie, no la propuesta), (d) reinicio (el inventario mostró que la lista de "no sirve" es corta).

**(b2) React Native con Expo.** Tres vías independientes lo exigen:
1. **Evidencia de prestadores:** viven en el celular.
2. **Estándar del mercado en paseo:** GPS + foto + reporte. GPS en background con pantalla apagada es territorio nativo; una PWA no lo hace de forma confiable.
3. **El wearable** (único producto marca e-PetPlace): Bluetooth Low Energy no funciona en iOS Safari — el emparejamiento y la telemetría exigen nativo. Nota técnica: BLE en Expo requiere development builds (no Expo Go).

**Vistas web:** no se construyen aparte ni se reusa el front viejo — **se obtienen** del mismo codebase vía React Native Web como target adicional de build. Prestador y dueño: nativo primario, web secundaria del mismo código. Admin: sigue en su repo (desktop web correcto para backoffice). Sellers: fuera de nuestro alcance de UI hasta disparo VTEX (Sección 8). Refugios: sin disparo; cuando llegue, probablemente web simple sobre el design system ya existente.

**Auditoría de coherencia arquitectónica (resumen):** modelo de datos event-sourced — correcto para el activo, sin rewrite escondido. Lógica en RPCs SECURITY DEFINER — el front es desechable por diseño (S42 lo demostró: se archivó el front y los RPCs quedaron intactos); cualquier cliente futuro habla con los mismos RPCs. Supabase — apuesta razonable; acoplamientos (auth/storage/realtime, lógica en SQL) anotados como deuda consciente con disparo por escala/equipo, mitigados por wrappers como puerta única y el sistema de pruebas. **El único punto donde hoy se podía elegir el camino rápido-incorrecto era la tecnología del cliente — y (b2) es la elección que evita el rewrite futuro.**

---

## 6. Monorepo y gobernanza

**Productos separados, código integrado.** Un repositorio `e-petplace` (pnpm workspaces + Turborepo):

```
e-petplace/
├── apps/
│   ├── prestador/        # Expo — iOS/Android/web
│   └── cliente/          # Expo — iOS/Android/web
├── packages/
│   ├── ui/               # design system: tokens, componentes, motion
│   ├── api/              # tipos generados de Supabase + wrappers discriminated-union
│   └── domain/           # helpers puros (periodo, validaciones, strings, países/servicios)
├── supabase/             # migraciones + RPCs + Edge Functions (las crea Code)
├── docs/                 # docs maestros del ecosistema (únicos)
└── .claude/skills/       # skills del proyecto (Sección 11)
```

Fuera del monorepo (por ahora): `portal-admin` (funciona; se absorbe cuando tenga disparo, sin big-bang), `e-petplace-sistema-pruebas` (vive contra la DB; se evalúa después), `e-petplace-prestadores` viejo (congelado como referencia de flujos, según Bloque 4).

**Gobernanza de agentes y documentos:** `CLAUDE.md` raíz con estado del ecosistema + un `CLAUDE.md` por app/paquete con estado local (Claude Code carga el más cercano). Docs maestros únicos en `docs/`. Claude es el arquitecto de e-PetPlace (regla 3 ampliada): decisiones técnicas con análisis claro las toma y comunica con justificación breve; producto decide el founder.

**Proceso (enmienda al contrato, Sección 12):** Claude Code tiene acceso a la base de datos para relevamientos y pruebas, y **crea las migraciones** (tiene el schema completo a la vista — no imagina nombres de campos). El founder conserva el gate de aprobación y la revisión visual.

---

## 7. Principios de diseño del front nuevo (vinculantes)

1. **Cero explicación necesaria.** Si un flujo requiere que alguien lo explique, el flujo está mal. Prueba de aceptación: un prestador nuevo completa su tarea sin entrenamiento.
2. **Móvil primero, en serio.** Se diseña en pantalla de teléfono; el target web hereda, no al revés.
3. **Fondo claro por defecto.** Modo oscuro puede existir como opción, jamás como default.
4. **Nivel de mercado o más.** La vara visual es MoeGo/Scout: componentes con movimiento y curvas, percepción de velocidad, detalle. "Suficientemente bien" no existe (coherente con "wow desde día 1", ahora sí ejecutado).
5. **Todo slot de atención reconstruible desde URL/estado de navegación.** Patrón demostrado en paseo (S38); asciende de tarea (ex D-279) a principio. Un refresh o deep-link jamás rompe el Durante.
6. **Asimetría de complejidad por familia.** Paseo: mínimo absoluto. Grooming: algo más. Clínico (cuando exista): lo que el vet tolere — que es más, pero se valida primero.
7. **Un solo design system** (`packages/ui`), tokens compartidos, identidad e-PetPlace. Ningún agente inventa componentes fuera de él.
8. **La sobriedad luxury de PORTAL_PRESTADOR se conserva como alma** (sin rankings, dignidad, momentos sensibles) — ahora con una piel que la entregue.

---

## 8. Alcance F1 recortado y congelamientos (con disparos)

**F1 construye:** app prestador (paseo ultra-simple + grooming rediseñado, dos familias hechas al nivel de la apuesta) + app dueño (onboarding, mascotas/Bio-Expediente básico con escaneo de vacunas, agendar/pagar, timeline) + lo transversal que ya existe (motor financiero, evento_atencion, confirmaciones).

**Congelado con disparo explícito:**

| Pieza | Estado | Disparo |
|---|---|---|
| Familia A (clínicos) | Congelada — ni un bloque más | 3-5 reuniones con vets, notas escritas el mismo día |
| Wearable | Fuera de F1 (schema ya existe) | Post-soft-launch, con tracción de app dueño |
| Tienda / integración VTEX | Congelada; **ahora responsabilidad propia** (MediaLab descartado por costo 3x sin valor suficiente) | Primer seller real con intención de vender + tienda priorizada en roadmap. D-126 cambia de dueño |
| Portal refugios/criaderos | Sin cambio | Primer refugio piloto |
| Portal admin en monorepo | Sin cambio | Expansión de admin o equipo de operaciones |
| Comunicación 100% mediada (no WhatsApp) | Se construye en F1, riesgo declarado | Métrica de adopción a definir al armar el soft launch |

---

## 9. Destino de deudas y saldos de Capa 1

- **SB-3b** — se parte: la RPC `registrar_servicio_en_cierre` (diseño cerrado, DM-S41.1) **se construye** — es órgano, sirve a cualquier front. El selector UI sobre el front viejo **se congela**: se implementa directo en el cierre nuevo móvil.
- **D-279** — la tarea (retrofit del Durante grooming en front viejo) **se archiva**: no se retrofitea un front archivado. El patrón asciende a principio de diseño (Sección 7.5).
- **D-281** (arco 4 capas hacia "activar desde app mobile") — **se reescribe absorbido por el rumbo**: mobile ya no es la capa final, es la superficie desde la capa 1. S39 lo olió antes de tener la evidencia.
- **D-268 pata B6** (integración Citas/Tu día) — se resuelve en el diseño del app nuevo, no sobre el front viejo.
- **D-126** (webhook VTEX, idempotencia, refunds bidireccionales) — cambia de dueño (nosotros), congelada con disparo (Sección 8). Contratar dev puntual para esa integración sigue siendo opción válida el día del disparo.

---

## 10. Herencia de e-petplace-v2 (relevamiento S42)

Stack real: Ionic React + Vite + Capacitor (no RN). Veredicto de Code, firmado: **~15-20% del código sobrevive; ~80% del conocimiento.**

**Hereda:** las 2 Edge Functions (`extract-vacuna` — escaneo IA del carnet de vacunas, wow genuino que puebla el expediente sin fricción — y `chat-ayuda`), la lógica pura (score de salud, validaciones, `paises.ts`, `servicios.ts`), y el CLAUDE.md de v2 como spec funcional de flujos (guest checkout, onboarding, citas con expiración pg_cron).

**No hereda:** las 20 pantallas Ionic (nada de Ionic/react-router v5 existe en Expo), las 32 llamadas Supabase directas sin tipos ni manejo de errores (no cumplen el estándar de wrappers), los tipos a mano duplicados.

**Pendientes de verificación (regla 19, antes de heredar nada):**
1. ¿El SUPABASE_URL de v2 apunta al mismo proyecto que e-petplace-prestadores? ¿Las tablas `mascotas`/`vacunas` de v2 existen en la DB principal o son un schema paralelo? Si son paralelas, hay reconciliación de modelo obligatoria contra el Bio-Expediente.
2. **Contradicción de modelo detectada (procedimiento 10.3):** v2 tiene tienda propia (Store/Cart/Checkout, tabla `pedidos`) vs decisión VTEX de EPETPLACE.md. A resolver cuando la tienda tenga disparo: o el prototipo se archiva y se espera VTEX, o se revisa la decisión VTEX. Anotada, no urgente.

> **Resultado de la verificación (post-cierre, mismo día):** v2
> apunta al MISMO proyecto Supabase. Sus tablas paralelas
> conviven con el modelo Bio-Expediente y sus queries fallan en
> runtime post-refactor. Consecuencias: apps/cliente nace contra
> el modelo Bio-Expediente real (nunca contra tablas v2);
> extract-vacuna se hereda con reescritura de destino; limpieza
> formalizada como D-283.

---

## 11. Skills del proceso

**Se instalan en el monorepo (`.claude/skills/` / plugins):**
- **expo/skills** (plugin oficial Expo) + **Expo MCP** — convenciones de Router, estilos, data, builds, EAS/stores. Primera autoridad del stack.
- **Software Mansion skills** — animaciones y gestos nativos (Reanimated, Skia, 120fps). El código del motion en nativo sale de acá.
- **emil-design-eng** (Emil Kowalski) — criterio y auditoría de motion/polish (duraciones <300ms, curvas custom, qué jamás animar). Sus recetas son web (CSS/Framer Motion): en nativo aplica como filosofía y revisión; en targets RN-web aplica directo.
- **Impeccable** — anti-slop y vara visual. Mismo matiz web; se usa con criterio, no como autoridad final en nativo.
- **Callstack agent-skills** (performance) — opcional, se suma ante problemas de performance.

**Se crean (skill-creator), en este orden:**
1. `epetplace-db` — las reglas duras del contrato como skill autocargable: SECURITY DEFINER con SET LOCAL en mismo RUN, verificación por body de función (`pg_get_functiondef`), relevamiento de FKs antes de borrar, discriminated unions en wrappers, L-NNN técnicas vigentes. Se crea temprano — sirve desde la primera migración del monorepo.
2. `epetplace-design-system` — cuando `packages/ui` exista: obliga a todo agente a usar tokens y componentes propios en vez de inventar. Se crea al cierre de la sesión de design system.

---

## 12. Enmiendas a aplicar en otros documentos

| Documento | Qué cambia |
|---|---|
| `EPETPLACE.md` | Posicionamiento competitivo honesto (Petlove/Laika; "ventana", no "espacio abierto"). P1 recalibrado: *la experiencia diaria impecable es condición de existencia; el expediente es su sedimento y el activo del negocio*. Sección "Tienda y productos": sale MediaLab como constructor; VTEX queda como infraestructura, integración propia con disparo. |
| `MODELO_PRODUCTO.md` | Nota en 6 (wow desde día 1): el criterio operativo es "cero explicación necesaria" con su prueba de aceptación. Referencia a este documento. |
| `PORTAL_PRESTADOR.md` | Superficie: app móvil (Expo), web como target secundario del mismo código. Jerarquía de complejidad por familia (Sección 7.6). El alma (sobriedad, no-rankings, momentos sensibles) se ratifica intacta. |
| `CONTRATO_TRABAJO.md` | Enmienda S42: Code crea las migraciones y tiene acceso a DB para relevamientos y pruebas (reemplaza la pata operativa de reglas 16-17; founder conserva gate de aprobación y revisión visual). Rol de arquitecto de Claude formalizado (amplía regla 3). |
| `CLAUDE.md` (nuevo, raíz monorepo) | Nace con el estado del ecosistema; los CLAUDE.md por app nacen con cada app. El CLAUDE.md del repo viejo se congela con nota de cierre apuntando acá. |
| `BACKLOG_PORTAL_PRESTADORES.md` | Se congela con nota: el plan de construcción post-S42 vive en el backlog del monorepo. |

---

## 13. Primeros pasos (semana del 6 Jul 2026)

1. **Higiene:** confirmar revocado el token de Supabase pegado en chat durante S41. Antes que todo.
2. **Verificación DB de v2** (pregunta de Sección 10 a Code). Bloquea decisiones de herencia.
3. **Scaffold del monorepo:** pnpm + Turborepo + los dos apps Expo vacíos + `packages/api` con tipos generados de la DB real + skills instaladas (Sección 11) + `epetplace-db` skill creada. Prompt para Code desde Claude web.
4. **S43 — Design system móvil** (`packages/ui`): tokens (fondo claro, identidad e-PetPlace), componentes base con el salto visual (movimiento, curvas, nivel MoeGo). Al cierre: skill `epetplace-design-system`. **Criterio de disparo para tocar cualquier pantalla: el design system existe.**
5. **S44+ — Primer flujo end-to-end sobre el design system:** paseo (el confirmado, el más simple, el que exige GPS nativo). **✓ PARCIAL — S44 (7 Jul 2026): paseo E2E del PRESTADOR cerrado y verificado en dispositivo (dos paseos completos con GPS real).** Restan: GPS background (D-292/B5), grooming rediseñado, y la app dueño (onboarding + mascotas).
6. **Enmiendas documentales de la Sección 12** — pueden ir en paralelo con 3-4, pero antes de S44.
7. **Validación S2a cuando haya timeline navegable:** mostrar el expediente poblado (Zeus) a 10-15 pet parents. Antes del soft launch.

---

## Historial de versiones

- **v1.0 (5 Jul 2026 — S42):** Primera versión. Acta completa de la parada estratégica: evidencia, veredictos de supuestos, problema re-enunciado, marco mercado/apuestas de visión con señales tempranas, rumbo (b)+(b2) Expo, monorepo y gobernanza, principios de diseño, alcance F1 recortado con disparos, destino de deudas (SB-3b, D-279, D-281, D-126), herencia de v2, plan de skills, enmiendas pendientes y primeros pasos.
