# DISEÑO_EXPERIENCIA — La arquitectura de la experiencia del dueño

> **Versión: v1.1 — S50 (10 Jul 2026), Etapa A0 de RUTA_F1 v2.2.**
> Escrito por el arquitecto/director de diseño, decisiones de producto
> cerradas por el founder en sesión. **Contrastes obligatorios:**
> `MODELO_PRODUCTO.md` (EL NORTE — en especial §6.4 revelación
> progresiva y §8 éticos), `DEFINICION_SOFTLAUNCH.md` (el destino),
> `MODELO_LOYALTY.md` (gemelo de esta sesión). La capa visual la manda
> la skill `epetplace-design-system` (tokens v4, 25 componentes) — este
> doc define QUÉ se ve y POR QUÉ; los ladrillos ya existen.
>
> **Qué es este doc:** las decisiones de arquitectura de experiencia
> que moldean TODA la UI del ecosistema móvil de acá al soft launch:
> **Parte I — el dueño; Parte II — el prestador.** La ley del
> ecosistema exige que las dos experiencias se diseñen mirándose —
> un solo documento las obliga a rimar. Para el prestador,
> `PORTAL_PRESTADOR.md` sigue siendo el alma profunda (canon
> intacto); esta Parte II es su arquitectura móvil. Un Home que
> liste servicios está mal leído (mandato EL NORTE). Toda pantalla
> nueva de A1+ se contrasta contra este documento.

---

# PARTE I — El dueño

## 1. La tesis del Home

**El Home es el estado del hogar, no una grilla de servicios.**

La pregunta que ordena todo: *¿qué ve el dueño al abrir la app un
martes cualquiera en que no necesita nada?* Si la respuesta es una
grilla de verticales, construimos un marketplace con expediente
pegado. La respuesta correcta: **el estado de su hogar** — sus
mascotas y cómo están. Los servicios aparecen EN CONTEXTO, como
respuesta a estados reales, nunca como catálogo que grita.

Esto es la ley del ecosistema y §6.4 hechos navegación: el camino de
menor esfuerzo del dueño ES alimentar y consultar el expediente.

### El benchmark que valida la tesis: Nubank

Elegido por el founder (S50). Nubank ES una superapp que jamás se
siente superapp — banco, crédito, inversiones, seguros, shopping
conviven y el Home muestra UNA cosa: el estado de tu plata. Los cinco
principios destilados y su traducción:

1. **El Home es el estado, no el catálogo.** Nubank abre con tu saldo
   → nosotros abrimos con el hogar: las mascotas y su estado de
   cuidado.
2. **Lo que pide atención te encuentra.** La factura por vencer es la
   primera card → la dosis vencida, la cita de hoy, el paseo en curso
   suben solos. Gemelo: sin nada urgente, **silencio digno** — cero
   relleno, cero banners.
3. **Los productos aparecen cuando tu vida los pide.** El crédito se
   ofrece cuando tu historial lo habilita, con narrativa → nuestra
   revelación progresiva (§6.4) es la misma mecánica; Nubank es la
   prueba de que escala a 100M de usuarios.
4. **Una voz humana, adulta, honesta.** Ya legislada en la casa (DM
   Sans 300, L-139, null honesto). Nubank confirma que la voz ES el
   diferenciador percibido.
5. **Una acción núcleo a un gesto** (más Yape que Nu). La nuestra no
   es fija: es contextual al momento vital (M1 = registrar vacuna,
   M3 = agendar paseo). La Ley 4 de dosis ya obliga a UNA acción
   principal por vista; el Home la elige según el estado del hogar.

**Anti-benchmarks:** Rappi (grilla infinita de verticales — la
superapp abrumadora que §6.4 prohíbe) y las apps de mascota tipo
11pets (formularios y pestañas — CRM del dueño, trabajo, la negación
de la ley del ecosistema). **Vara del lado prestador:** MoeGo
(fluidez de agenda); el literal concreto de la vara queda pendiente
de que el founder lo aporte — se incorpora por enmienda.

## 2. Anatomía del Home

De arriba hacia abajo, en la voz de la casa:

- **Zona 1 — El hogar.** Saludo + las mascotas (`AvatarMascota`) con
  UNA línea de estado cada una, en voz humana. Multi-mascota nativo:
  el hogar, no una lista. Tap en la mascota → su Perfil (§4).
- **Zona 2 — Hoy.** Lo que pide atención: la cita en curso
  (`CitaEnVivo`, el único elemento vivo — Ley 7), la próxima cita, la
  alerta de cuidado accionable. **Sin nada urgente, la zona NO
  existe.** Prohibido el relleno.
- **Zona 3 — En contexto.** UNA revelación u oferta por visita,
  anclada a estado real (§5). El anti-spam del §6.4 hecho layout.
- **Zona 4 — La vida.** La `LineaDeVida` del hogar (el sedimento que
  hace que volver siempre muestre algo verdadero) + las acciones de
  aporte (cargar carnet, registrar hito).

### La semántica del estado (las tres voces)

Cada mascota tiene una y solo una línea de estado, honesta:

1. **Al día** — "Thor está al día." Verde vital, sin ruido.
2. **Pide atención** — "A Zeus le vence la desparasitación en 12
   días." Con LA acción a un tap.
3. **Aún conociéndolo** — "Aún estamos conociendo a Thor — cargá su
   carnet y te cuidamos mejor." **Esta voz es L-139 hecha Home:** con
   expediente ralo la app JAMÁS dice "todo bien" (verosímil-falso).
   Invita a completar, y esa invitación es el puente natural al
   loyalty (`MODELO_LOYALTY.md` §2).

El cálculo del estado nace del expediente real (carnet, eventos,
casos). Regla de precedencia: pide-atención > aún-conociéndolo > al
día. El "al día" se GANA con datos, nunca se asume.

## 3. El mapa de navegación

**Decisión founder S50: tres tabs** (opción (b), cerrada en sesión).
La agenda NO es tab: las citas son estado del hogar, no sección
administrativa (lectura transaccional que EL NORTE rechaza).

```
BarraTabs
├── HOGAR (raíz, la tesis — §2)
│   └── tap en mascota → Perfil de mascota (§4)
├── EXPLORAR (descubrimiento deliberado — §6)
│   ├── Servicios activos por country_config (paseo · grooming · vet…)
│   ├── Refugios: adopción y donaciones (M0/causas, §8.9 — día 1)
│   └── "Próximamente honesto" (hotel, guardería, seguros, Prime)
└── CUENTA (el ciclo B1: perfil, idioma es/en, notificaciones,
    eliminación de cuenta)
```

### El ciclo del cuarto slot (decisión founder S50: "el trono")

El cuarto slot de la `BarraTabs` tiene un ciclo de vida deliberado:

1. **Hoy → A6:** tres tabs. El slot no existe vacío — revelación
   progresiva a nivel navegación.
2. **A6 (nace la tienda):** la **DESPENSA** (§7) aparece como cuarta
   tab. En F1-F2 la visibilidad hace el trabajo que el contexto aún
   no puede (expedientes jóvenes = pocas señales de recompra
   inteligente) y el negocio necesita el GMV girando.
3. **F3 (nace la Comunidad):** la Despensa **entrega el trono** a la
   cuarta tab definitiva — Comunidad (Capa 3) — y no pierde nada:
   para entonces la recompra vive en la Zona 3 del Home y en el
   módulo de nutrición del perfil, y el browse deliberado pasa a
   bloque de primera clase en Explorar.

> *"La Despensa le guarda el trono a la Comunidad — y cuando se lo
> entrega, la app ya sabe comprar por vos."*

**Por qué Comunidad no es categoría de Explorar:** la Capa 3 no es
una vertical que se explora — EMERGE de las mascotas (los amigos de
Zeus, la comunidad de la raza de Thor, el memorial). Estanterizarla
la degrada a directorio. Su semilla del día 1 (refugios, adopción,
donaciones) SÍ es browseable y vive en Explorar; el trono se le
guarda para cuando exista de verdad.

Técnicamente: la `BarraTabs` soporta el ciclo por configuración,
cero refactor.

## 4. El Perfil de mascota — pila de módulos, no monolito

**Decisión estructural (S50, disparada por el mandato wearable del
founder):** el perfil nace como pila de módulos apilables bajo un
header de identidad (AvatarMascota + la voz + momento vital):

1. **VITALES (Bienestar y actividad, M-WEAR)** — el ESTADO primero
   (enmienda v1.3, founder S53: el perfil rima con el Home — el
   estado antes que el log): hoy, lo que el ecosistema deposita
   (paseos con track, distancia — vivo desde S44) + los índices
   educativos en despliegue progresivo.
2. **Salud** — carnet de vacunas, casos, condiciones.
3. **Línea de Vida** — su timeline (componente existente). **El día
   que la mascota tenga wearable, este módulo se expande al dashboard
   estilo Garmin** (actividad, descanso, tendencias) **vía revelación
   progresiva** — conectar el dispositivo ES el disparador contextual
   perfecto: *"El collar de Zeus está conectado. Ahora podemos
   contarte cómo durmió."* Cero refactor ese día: inserción en una
   pila que ya existe. (Nota: el catálogo seed de logros ya intuía un
   logro de wearable — la intención venía de antes.)
4. **Identidad 5D** — las cinco dimensiones, construcción progresiva.

A1 construye el perfil con este hueco hecho.

## 4b. LA LEY DE LA ESCALERA (enmienda v1.4 — firmada founder S53)

Todo componente o módulo que muestre datos del expediente declara sus
TRES peldaños:

- **Peldaño 0 — invitación:** sin datos, el módulo EDUCA y termina en
  una acción de aporte al expediente. Jamás ceros, jamás simula.
- **Peldaño 1 — primeros datos:** honestidad de densidad — lo poco se
  muestra como poco (prohibido estirar poco dato para que parezca
  mucho).
- **Peldaño 2 — expediente rico:** la densidad y la profundidad llegan
  por DATOS, no por versión nueva: el peldaño 2 se diseña desde el
  día 1 para que subir sea una prop, no un refactor.

Canon de referencia: los índices de Vitales (peldaño 0 — guijarro +
"se construye con su expediente" + Hoja educativa), la tira 1/7 de
Zeus (peldaño 1 — una barra llena, seis en base, la verdad tal cual),
y el hueco M-WEAR (peldaño 2 dibujado esperando su dato).

## 5. El modelo de descubrimiento — §6.4 aplicado

La app se revela progresivamente; la superapp jamás se presenta
entera. Reglas operativas de esta experiencia:

- **UNA revelación por visita, máximo** (Zona 3). Disparada por
  cambio real (momento vital, hito, uso), jamás por puntos.
- **Se ofrece, no se impone.** Ignorada 2 veces → no se re-ofrece;
  queda disponible en Explorar cuando el dueño la busque.
- **Con narrativa, jamás seca.** "Zeus completó su plan de vacunas —
  ¿conocés paseadores de tu zona?" Nunca "Has desbloqueado paseos".
- **Honra el momento vital.** M5 con respeto ("estos años son
  especiales"); **M6 y memorial silencian toda revelación comercial**.
- **Calibrada por especie** (`cat_especies_perfil`).
- **Caso vivo de la casa:** Thor (bulldog inglés, 6a8m) se acerca a
  la zona senior de su raza — la transición M3→M5 se acompaña con
  respeto, no con alarma. El prototipo lo muestra.

## 6. La IA — la voz de la app, con un cuerpo invocable

**Decisión de fondo (S50): la IA no es un lugar de la app — es la voz
de la app.** El anti-patrón prohibido: el botón "AI ✨" calcomanía con
un chatbot genérico al lado del producto.

- **Capa ambiente (siempre activa, no se "abre"):** el estado del
  hogar, las alertas, las revelaciones — todo eso YA es la
  inteligencia hablando. El dueño la conoce antes de conversar
  (convicción A5: el producto-que-sabe demuestra antes de chatear).
- **El cuerpo conversacional (el Coach):** vive como **Hoja
  invocable, siempre anclada a una mascota** — jamás chat genérico
  flotante. Entradas: (1) punto persistente discreto en el
  `Encabezado` del Hogar; (2) contextuales — desde el perfil
  ("Preguntá sobre Thor"), desde una alerta, desde un evento del
  timeline. La conversación abre sabiendo de quién hablás, con TODO
  su expediente como contexto.
- **Activación por mérito (revelación, no calcomanía):** se presenta
  la primera vez demostrando que YA sabe algo verdadero — p.ej. al
  cerrar la carga del carnet: *"Ya conozco las vacunas de Thor.
  Preguntame lo que quieras sobre su cuidado."*
- **Uso v1 (soft launch):** responde sobre SUS mascotas (edad, raza,
  condiciones, historial real), guía calibrada por especie/momento
  vital, y explica lo que la app señala ("¿por qué me alertaste
  esto?"). Las acciones ("agendame el chequeo") llegan cuando A2/A3
  existan para ejecutarlas.
- **Límites duros:** el Coach **JAMÁS diagnostica** — señala y deriva
  al vet (JTBD-1/2 son del vet; el Coach es puente, no reemplazo).
  Sus recomendaciones caen bajo §8.3: jamás sponsoreadas, auditables.
- **Nombre:** decisión de producto abierta no-bloqueante (semilla
  "Pet Expert" en docs). El prototipo lo muestra sin bautizo
  definitivo.

## 7. La Despensa — el comercio que sabe a quién alimenta

**Decisión founder S50** (corrigiendo una mala lectura del §2.5 en
sesión): la tienda NUESTRA no es commodity — qué come, cuánto, cada
cuánto, desparasitantes, juguetes ES Bio-Expediente (JTBD-5, activo
en todos los momentos). El filtro del §2.5 aplica al commerce que NO
conecta; el nuestro conecta por diseño.

- **El nombre dice la tesis:** Tienda dice mall; **Despensa dice
  hogar** — *lo que el hogar necesita tener*. (Working name; el
  bautizo definitivo lo gatea el founder en el prototipo.)
- **Anatomía:** abre con las necesidades por mascota ("La bolsa de
  Zeus se acaba en ~6 días — repetir pedido" · "El desparasitante de
  Thor toca en 3 semanas"), reposición a un toque, y debajo el
  catálogo browseable. VTEX pone el inventario; **el expediente pone
  la inteligencia**. Ese loop es el foso que un marketplace genérico
  no puede cruzar.
- **Por qué merece vista propia:** la reposición es el ritual más
  frecuente del hogar (comida mensual, desparasitante trimestral) —
  más frecuente que cualquier servicio. Enterrar el ritual más
  frecuente a dos taps es diseño contra el uso real.
- **Distribución contextual además de la tab:** Zona 3 del Home,
  módulo de nutrición del perfil, post-servicio ("A Thor le
  recomendaron este shampoo" — siempre bajo §8.3/P11).
- **Ciclo de vida:** §3 (el trono). Compra = evento nutricional,
  siempre.

## 8. Explorar y Cuenta

- **Explorar es el descubrimiento DELIBERADO** — para cuando el dueño
  BUSCA ("quiero un groomer YA"): servicios activos por
  `country_config`, refugios/adopción/donaciones desde el día 1
  (§8.9 — las donaciones como el financiero manda: passthrough, la
  plataforma no gana), y el "Próximamente honesto" (hotel, guardería,
  seguros, Prime apagado). Todo lo revelable vive acá también, para
  quien lo busca antes de que se le revele.
- **Cuenta es el ciclo B1 completo:** edición de perfil, cambio de
  contraseña, idioma es/en, preferencias de notificaciones,
  **eliminación de cuenta** (requisito de tiendas). Sin glamour, con
  dignidad.

## 9. La capa de loyalty

Diseñada en el gemelo de esta sesión: **`MODELO_LOYALTY.md`** —
progreso visible, ganancia visible, moneda invisible. El Home la
expresa en la tercera voz del estado ("aún conociéndolo") y en la
Zona 3 (UN próximo hito visible con su beneficio). Los límites §8
viven allá y mandan acá.

## 10. Los tests de toda pantalla nueva (A1+)

1. **Ley del ecosistema:** ¿le hace la vida más fácil al dueño
   mientras alimenta el expediente sin sentirse trabajo?
2. **Wow cero-explicación:** ¿un dueño nuevo completa la tarea sin
   que nadie le explique?
3. **Ley 3:** ¿el vocabulario del modelo (M1..M7, IDs, códigos) es
   invisible al dueño?
4. **§6.4:** ¿la pantalla muestra solo lo que este momento pide?
5. **L-139:** ¿todo dato mostrado es verdadero o null honesto —
   jamás verosímil-falso?
6. **Rieles B1:** cero strings crudos (es/en) desde que el riel
   exista.

## 11. Backlog de construcción de A1 (derivado de este diseño)

Orden fino a trazar al abrir A1; alcance derivado:

1. **Home v1** — Zonas 1/2/4 (la 3 nace con el motor de revelaciones
   mínimo o queda oculta hasta tenerlo — null honesto estructural),
   cálculo de estado de las tres voces sobre expediente real.
2. **Perfil de mascota modular** — header + Línea de Vida + Salud
   (carnet vivo de S47-48) + Identidad 5D progresiva; M-WEAR con su
   estado actual (paseos).
3. **Multi-mascota real** — el hogar completo (Thor Y Zeus), alta de
   mascota adicional sobre el onboarding S45.
4. **Explorar v1** — servicios por `country_config` + refugios/M0 +
   próximamente honesto.
5. **BarraTabs a 3 tabs** con la configuración del ciclo del trono.
6. Todo bajo los rieles B1 (i18n desde que exista) y la trenza
   A0⇄B4 anotada (el motor de revelaciones/loyalty comparte
   infraestructura con el motor de alertas — hoy NO existe en DB,
   es construcción nueva).

# PARTE II — El prestador

## 12. La asimetría que ordena todo

El símil no es un espejo. El dueño abre la app para **saber** ("¿cómo
está mi hogar?"); el prestador la abre para **trabajar** ("¿qué toca
ahora?"). Verbos distintos, tesis distintas:

- **Dueño:** el Home es el estado del hogar. Benchmark: Nubank.
- **Prestador:** el Home es **la jornada**. Benchmark: MoeGo — la
  herramienta en la que un profesional vive su día sin que se le
  interponga.

**La simetría profunda que hace que ambas apps sean el mismo
producto:** las dos abren con ESTADO, no con catálogo; las dos
aplican revelación progresiva (para el prestador ya legislada en
`PORTAL_PRESTADOR.md` §2.6: *"portal vacío es portal en preparación,
no portal fracasado"*); y las dos depositan el expediente como
SEDIMENTO de una experiencia excelente — jamás como formulario. El
design system codifica la diferencia de temperamento: dueño = dosis
alta; prestador = dosis baja, UN acento, sobriedad sin frialdad (la
filosofía luxury de §1.3 del portal hecha tokens).

Invariantes que esta Parte II hereda del alma (`PORTAL_PRESTADOR.md`)
sin re-decidir: lo aspiracional (§1.4), la coreografía del Día 1 y la
mascota demo (§2 — Zeus, que además es real), los hitos de
trayectoria — jamás de tarea, jamás ranking (§2.7), el home único
compuesto por familias de servicio habilitadas (§5.9, decisión
cerrada S20), y el doble vínculo con la familia humana (§5.10).

## 13. La tesis del Home prestador: HOY, y lo siguiente preside

De arriba hacia abajo:

- **Zona 1 — Ahora / Lo siguiente.** La atención en curso
  (`CitaEnVivo`) o la próxima, presidiendo con su "Antes" a un tap
  (quién es la mascota, sus alertas: caso activo, alergia, ansiedad,
  primera vez). El paseador de 4 paseos diarios no navega: abre y
  arranca.
- **Zona 2 — El día.** La agenda de hoy compacta: mascota grande,
  familia secundaria, estado, indicadores de condición. Toggle a
  semana para planificar (la vista anticipada de §6.4.2 del portal:
  primera-vez vs recurrente, lo que requiere preparación).
- **Zona 3 — Novedades que piden algo.** Cancelaciones y
  reagendamientos del dueño (B5), mensajes de familia. Sin novedades,
  la zona NO existe — el mismo silencio digno de la Parte I.
- **Zona 4 — Tu trabajo, con dignidad.** Solo lo que tiene algo digno
  que mostrar, cuando lo tiene: "lo que vas a cobrar" con desglose
  (vista de liquidaciones, B2.4 — el que trabaja ve lo que va a
  cobrar) e hitos de trayectoria cuando ocurren.

### La agenda solo contiene verdad firme

Decisión de diseño derivada de la regla del cobro (founder S49): el
bloqueo temporal del dueño es INVISIBLE para el prestador; la cita
aparece cuando el pago la confirma. Cero ruido tentativo, cero citas
fantasma que se evaporan. La agenda es un espacio de confianza
absoluta — extensión estructural de L-139: la agenda jamás muestra
verosímil-no-firme.

## 14. La navegación del prestador

**Decisión founder S50: tres tabs (opción (b)).**

```
BarraTabs
├── HOY (raíz, la jornada — §13, toggle día/semana)
├── MASCOTAS (las vidas que cuidás)
│   ├── Historial de mascotas atendidas
│   ├── Detalle de mascota — "la pantalla icónica" (§6.4.4 del
│   │   portal): vista prestador del expediente, diferenciada por
│   │   familia de servicio
│   └── La familia humana de cada mascota
└── NEGOCIO (la administración)
    ├── Servicios, precios, horarios, equipo
    ├── Cuenta comercial (wizard B2.3 — precondición de cobrar)
    ├── Liquidaciones (revelada con la primera plata)
    └── Perfil y cuenta (ciclo B1)
```

**Por qué (b):** simetría filosófica exacta con el dueño (estado ·
relaciones · administración) y anti-CRM estructural — la tab Mascotas
dice "tu trabajo son vidas que cuidás, no slots de agenda". El
multi-rol cae natural: el empleado ve SU jornada; el dueño de cuenta
ve la operación completa y Negocio entero. La composición por
familias (§5.9) se preserva: las cards de HOY se componen según lo
habilitado — paseo hoy, grooming al portarse del portal congelado,
clínica cuando las reuniones F0 la descongelen.

## 15. Los tests de toda pantalla nueva del prestador

Los 6 tests de §10 aplican íntegros, más dos propios:

7. **Dosis baja:** UN acento de capa, CTA en tinta, cero gradiente UI
   (Ley 4).
8. **Verdad firme:** ¿todo lo que la pantalla muestra como cita/plata
   está confirmado? Lo tentativo no existe para el prestador.

## 16. Backlog derivado del lado prestador (para cuando la ruta lo
llame)

No es mandato de A1 (que es del dueño) — es el derivado que B1/B2 y
el portado de grooming consumen:

1. **HOY v1** sobre la Agenda existente de S44 (re-jerarquizada a las
   4 zonas; la atención E2E de paseo ya vive).
2. **Tab Mascotas v1** — historial + detalle icónico vista prestador.
3. **NEGOCIO v1** — wizard de cuenta comercial (B2.3) + vista de
   liquidaciones (B2.4) + auth real (D-290, riel B1).
4. **BarraTabs prestador a 3 tabs** (hoy shell Stack+(tabs)).
5. Composición por familia al portar grooming (segunda familia viva).

## Decisiones firmadas en S50

- Home = estado del hogar; servicios en contexto (founder, sesión).
- Navegación (b): 3 tabs Hogar·Explorar·Cuenta; agenda no es tab.
- Ciclo del trono: Despensa 4ª tab en A6 → cede a Comunidad en F3.
- Tienda = "Despensa" (working name, bautizo gateado), necesidades
  por mascota primero, catálogo después.
- IA = voz de la app + Coach anclado a mascota, activación por
  mérito, jamás diagnostica, jamás sponsoreada.
- Perfil modular con M-WEAR reservado (mandato wearable del founder).
- Loyalty (a′) — ver `MODELO_LOYALTY.md`.
- Prestador: Home = la jornada (HOY, 4 zonas); navegación (b)
  Hoy·Mascotas·Negocio; la agenda solo contiene verdad firme
  (bloqueo temporal invisible al prestador).
- Dos prototipos separados (cliente y prestador), dos links: S2a con
  Kary usa el del cliente; las reuniones F0 usan el del prestador.

## Abiertas (no bloquean)

- Nombre definitivo del Coach y de la Despensa (gate founder sobre
  prototipo).
- Vara MoeGo literal (el founder la aporta; se enmienda §1).
- Diseño fino del dashboard M-WEAR (sub-sesión cuando el hardware
  tenga fecha).

## Historial

- **v1.4 (S53, 10 Jul 2026):** LA LEY DE LA ESCALERA (§4b) — firmada
  founder: tres peldaños declarados por todo módulo de expediente
  (0 invitación que educa · 1 honestidad de densidad · 2 riqueza por
  datos, no por versión). El protocolo Ley 11 de la skill exige la
  escalera en toda espec nueva.
- **v1.3 (S53, 10 Jul 2026):** enmienda del ORDEN de la pila del
  perfil (§4): header → Vitales → Salud → Línea de Vida → Identidad —
  el estado antes que el log; el perfil rima con el Home. El módulo
  Bienestar queda elevado a dashboard Vitales (S53-B2c/2c.1).
- **v1.2 (S51, 10 Jul 2026):** enmienda menor de VOZ — el registro
  canónico del español del producto es **TUTEO NEUTRO** (decisión
  founder S51, que extiende la regla 27 del contrato a ambas apps
  móviles); los ejemplos de este documento escritos en voseo
  ("cargá su carnet…") son ILUSTRATIVOS y se transponen a tuteo al
  implementarse por el riel i18n. Implementación de referencia: los
  diccionarios de S51 (`apps/*/src/i18n/`).
- **v1.1 (S50, 10 Jul 2026):** Parte II — el prestador. Asimetría
  dueño/prestador, tesis HOY con 4 zonas, principio "la agenda solo
  contiene verdad firme", navegación (b) Hoy·Mascotas·Negocio, tests
  7-8, backlog derivado del lado prestador. Decisión: dos prototipos
  separados. `PORTAL_PRESTADOR.md` queda como alma profunda intacta.
- **v1.0 (S50, 10 Jul 2026):** redacción inicial. Tesis del Home,
  navegación de 3 tabs con ciclo del trono, perfil modular,
  descubrimiento §6.4, IA como voz, Despensa, tests de pantalla,
  backlog A1 derivado.
