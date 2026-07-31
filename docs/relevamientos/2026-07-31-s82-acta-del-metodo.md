# S82 · ACTA DEL MÉTODO
### 29–31 jul 2026 · Rediseño del cliente con tres pistas Code · CERRADA por el founder

> Qué es este documento: lo que produjo el resultado y lo que costó, escrito para
> que la **sesión del prestador** arranque con esto y no lo re-descubra. No es un
> diario — es el método destilado con su evidencia. El censo de enmiendas de ley
> va en documento aparte (las enmiendas mismas ya viven en la skill y en
> DIRECCION_ARTE §9bis, depositadas por A en 93efce3 y 5f5d9ff).

---

## 0 · EL RESULTADO

Los cuatro oficios del cliente (paseo · grooming · veterinaria · adiestramiento)
aplican el patrón firmado de punta a punta: log con sus ejes → reserva con la
gramática canónica → quién puede. Fila de log estándar, despliegue estándar
(prestador + costo, con el nulo honesto), corte de agenda único, pie de reserva
único, la pata como marca de selección en sus tres casas, el halo direccional en
oscuro, el oro #FCBC1D en los CTAs del cliente, papel tapiz en las dos casas.

Último OTA: group f55d65c9, ancla 27431b9. Gate final del founder: "Done".

---

## 1 · LO QUE PRODUJO EL RESULTADO — en orden de peso

### 1.1 La lámina existe antes de construir, y vive en el repo
La única pantalla que el founder llamó "perfecta" en el día 1 fue la única que
tuvo lámina previa. Las pantallas construidas desde prosa itemizada salieron como
listas de items.
- Las láminas viven en `docs/laminas/`, **nunca en el chat**. Cuatro bloqueos en
  la sesión por acuerdos que vivían en la conversación (capturas de Zeus, el png
  de los filtros, el zip de Claude Design, el swatch de oro). Las cuatro veces la
  pista trabajó con lo que sí estaba en el repo y declaró el hueco — correcto,
  pero es el mismo costo cada vez.
- **Regla de arranque: el acuerdo entra al repo antes de que alguien lo necesite.**

### 1.2 La lámina es criterio, jamás fuente (§10)
Tres portes literales desde CSS de lámina: el arquitecto tomó #EEECE8 como token
de la casa (no lo era — light0 es el papel real), C portó `text-transform:
uppercase` y resucitó el eyebrow que S52 mató, y los 17 hexes de la paleta v7
que C **sí frenó** — el único porte que se cotejó.
- Cuando la lámina llega como imagen nadie se tienta; cuando llega como código,
  portar es el camino de menor resistencia.
- Cero box-shadow/inset/transición CSS. Los hexes del CSS no son fuente:
  **palette.ts gana siempre**. La tipografía de la lámina tampoco es fuente.

### 1.3 Las varas nombran jerarquía, no tono
Varas de tono ("más cálido", "más humano") producen cambios de copy. Varas de
jerarquía ("¿qué preside?") mueven forma.

### 1.4 El bloque de auditoría (docs/bloque-auditoria-mejora-propia.md)
Pagó desde su estreno. Las pistas auditan contra las fuentes ANTES de tocar,
tienen licencia para decidir composición solas, y reportan **HALLAZGOS, jamás
veredictos** ("encontré 6, curé 4, dejé 2 declarados" — nunca "quedó bien").
- Corolario anti-degradación: si la auditoría no encuentra nada, se dice
  explícitamente. Una auditoría que nunca halla defectos es la falla de L-192.
- Evidencia: las pistas corrigieron al arquitecto ~10 veces con la fuente en la
  mano, y las ~10 veces tenían razón. **La medición de la pista gana a la
  premisa de la orden.**

### 1.5 Un OTA conjunto, una pasada de teléfono
El día 1 tuvo seis pasadas para seis OTAs — ese fue el cuello, no la
construcción. Después: veda → un OTA con las tres pistas declaradas → una
pasada. El ojo del founder es el recurso más caro; se gasta en lotes.

### 1.6 Guards con rojo producido — y con su muerte escrita
Todo guard nace produciendo su rojo real (no solo el fixture) y con su condición
de muerte escrita: qué hecho lo vuelve innecesario y quién lo retira.
- Los guards cazaron a sus propios autores ~10 veces (R10 cuatro veces a C; R21
  a B en la tercera predicha; R17 a B; el estructural a B y a C en las dos
  direcciones; el hook a B en su estreno).
- **El ciclo completo ocurrió entero una vez**: R19 salió roja con el mensaje
  que su propia autora escribió para ese caso, y se retiró en el mismo commit
  con lápida y condición de resurrección. R21 y R23 también murieron por sus
  propias condiciones. Un guard que sobrevive a su razón protege un mundo que
  ya no existe.
- Las tres capas de L-192 para reglas de lint: ¿puede salir roja? (fixture) ·
  ¿corre? (enganche mecanizado en `corridas` — todo lo que se arma a mano se
  olvida) · ¿tenía corpus que mirar? (`ancla()` — una regla de ausencia da el
  mismo verde sin violaciones y con el corpus desaparecido).

### 1.7 La regla 83 con alcance: el arquetipo multiplica DENTRO de su familia
El oro se firmó en un swatch y multiplicó a 43 botones sin fricción. Sin-tarjeta
se firmó sobre chips y se extendió a contenedores de contenido: el founder lo
rechazó y hubo que revertir (y el tinte 8% que viajaba atado volvió a 3%).
- **Se extiende dentro de la familia sin preguntar; se cruza de familia
  declarándolo.** Si al ejecutar hay que decidir qué cuenta como "lo mismo",
  esa decisión vuelve a la mesa antes de aplicarse — no después de 25 archivos.
- Corolario del arquitecto: cuando el founder firma en galería, la orden que
  multiplica **nombra sobre qué piezas se firmó**.
- El switch/andamio de un gate se queda hasta que la decisión sobreviva una
  pasada más (el techo claro se firmó de noche y se revirtió a la mañana; su
  SwitchGate ya se había retirado).

### 1.8 Los tres eslabones del cierre (regla de C, nacida del incidente r34)
`git commit -- <rutas>` (pathspec, SIEMPRE) → `cat-file` sobre HEAD **por
contenido, no por presencia** → "cerrado" recién cuando está en un **group
publicado** (verificado con `eas update:list`).
- "Commiteado", "publicado" y "en el teléfono" son tres estados distintos. El
  founder gateó DOS veces un OTA anterior a la cura.
- Cuarto eslabón (hallazgo final de C): verificar que **lo que consumís sigue
  siendo lo último** — con tres pistas, el contrato de una pieza puede cambiar
  entre tu commit y tu publish (el segmentado quedó en modo 'vista' porque B lo
  cerró después de que C lo consumiera).
- Un `git show` contra un ref móvil no prueba nada; `cat-file` + `merge-base`
  sí. La forma pathspec no ve archivos sin trackear (`git add -N` primero) y el
  `-m/-F` va ANTES del `--`.

### 1.9 El gate en dispositivo es la única firma — y el dato de prueba decide qué se ve
- L-153: la vara no la declara quien construye. Verificar la intención (el "ok"
  de un script, el exit de un pipe) no es verificar el resultado (el contenido
  en HEAD, la foto pintada). C reportó una cura "cerrada" que nunca aterrizó en
  el archivo — y lo declaró con nombres: *"verifiqué la intención y no el
  resultado."*
- **Candidata 13, probada dos veces**: un defecto vive invisible porque el dato
  de prueba no lo alcanza. El CTA muerto de una-mascota vivió de S57 a S82
  porque la familia del founder tiene dos. Sembrar la de cuatro hizo visibles
  dos caminos en una corrida y destapó cinco defectos en su estreno.
- Seeds por extremo: baratos mientras no siembren nada fechado. El fixture
  MIXTO vale más que el completo (una foto de cuatro): el dato de prueba tiene
  que poder ROMPER la cura, no confirmarla. La carta de ajuste en vez del color
  plano: el fixture verifica al verificador.
- Extremos sin sembrar: memorial (nadie vio ese tema con datos), hogar sin
  mascotas, cuenta sin oferta. Pendiente del founder: cuántos seeds antes de
  que el costo se dé vuelta.

### 1.10 Lo que se copia, diverge — la cura es la pieza, no la disciplina
Cuatro extracciones, todas por el mismo síntoma:
- El **pie de reserva** (paseo bien; grooming y adiestramiento habían perdido
  el precio entero).
- El **corte de agenda** (paseo era el único que miraba estado Y tiempo; una
  cita confirmada de la semana pasada nunca salía de "próximos" en los otros).
- El **contenido del despliegue** (cuatro logs, cuatro respuestas).
- La **pata** a primitiva (MarcaEleccion): *"la única forma de garantizar la
  misma anatomía no es copiarla bien: es que no se pueda copiar."*
Regla derivada: la prop de identidad **obligatoria sin default** (capa= en
CabezalOficio) — el tsc obliga a cada clon a declararla; la primera consumidora
real (vet, "salud") probó que sin ella el clon salía teal.

---

## 2 · LO QUE COSTÓ — para no repetirlo

### 2.1 El índice compartido (D-586) — worktree por pista es LA PRIMERA DECISIÓN
Tres arrastres de commits, dos atribuciones perdidas (trabajo de A bajo commits
de B), casi un OTA con ancla que no contenía el código que bundleaba (lo salvó
C con cat-file), dos bloqueos de index.lock, un checkout fallado en silencio.
- --only protege lo ajeno pero no lo propio: `git add` acota lo que agregás,
  `git commit` se lleva el índice entero, y esa ventana con tres pistas se
  llena. Limpiar antes es una carrera (B la perdió dos veces).
- Mitigaciones vivas: pathspec obligatorio · el hook declara carpetas y aborta
  ante carpeta ajena · el discriminador GIT_INDEX_FILE (la forma pathspec usa
  índice temporal — el hook puede exigirla).
- **La cura de la clase entera: worktree por pista (regla 82). Se decide al
  ARRANCAR la sesión del prestador, con el árbol limpio.**

### 2.2 El hook de pre-commit (D-584) — el aviso que no frena, no frena
Nació de dos commits de B con el lint rojo leído en pantalla ("dos de dos es un
patrón"). Rojo = el commit no ocurre (~2s: corre solo lo staged). Escape con
rastro (SALTAR_GATE queda en el mensaje); `--no-verify` es la puerta muda que
solo CI cierra — escrito dentro del hook. Efecto lateral pendiente: el WIP roto
de una pista frena el commit de otra (la cura real es worktree).

### 2.3 Los errores del arquitecto — el acta los cuenta
- Cuatro cruces de territorio mal ruteados; las cuatro veces la pista los atajó
  citando la letra. Causa: repartir de memoria — **el inventario C3 nunca llegó
  y no hubo burn-down en toda la sesión.**
- Dos portes de lámina como fuente (#EEECE8; "los 178 se midieron contra ese
  hex" — falso).
- El ensanche de sin-tarjeta (§1.7).
- Hipótesis falsadas por medición de pista: el tapiz como causa del sinCaja
  invisible (era bg.overlay, token de hover) · "el molde de foto sembrada
  existe" (no existía) · el reparto 8-5-5 con vet fuera de la enumeración.

### 2.4 Fallas con nombre, para reconocerlas rápido
- **"Curado en el código, roto en la pantalla"** — y su forma peor: reportado
  cerrado sin estar en el código.
- **El literal que miente**: "completada" hardcodeado en las dos listas —
  compila, no rompe nada, afirma algo falso. La clase más cara.
- **El resto invisible**: no sobrevive por difícil, sobrevive porque vive en el
  camino que nadie recorre (los chips viejos en los CUATRO salvavidas).
- **El comentario que afirma un estado que no existe** ("Va PRIMERA" sobre una
  sección en la posición 36): convence al lector de que no hay nada que
  revisar. Peor que ninguno. Y el comentario que sobrevive a su causa
  desinforma — se retira con ella.
- **El token por nombre y no por rol** (bg.overlay como fill; text.onGradient
  como label) — y su inversa, **el token correcto con nombre viejo**
  (capa.identidad ES "salud"): uno falla al usarlo, el otro al BUSCARLO — quien
  busca capa.salud crea un duplicado. Cura-patrón: la pantalla habla la ley,
  UNA pieza traduce al token que existe.
- **El contador de prosa que decae** (tres desatrasos en la sesión): cuando
  prosa y guard discrepan, gana el guard. El contador lo mide la herramienta
  que lo exige (grep dijo 11/7, el lint 10/4 — dos veces).
- **El verde por accidente**: el test que buscaba español contra pantalla en
  inglés; el fixture 'bano' sin oferta que pasaba sobre conjunto vacío. Un
  aserto que no puede fallar por la razón que dice es decorativo.
- **El doble papel como extremo no probado**: el lector "MIS planes" sin
  declarar rol mostró como propio lo que llegaba por la puerta del prestador —
  un groomer dueño de su perro es el usuario normal. La RLS defiende, el filtro
  DECLARA. Y el filtro del wrapper espeja el literal de la policy, no la
  analogía con el caso anterior (bonos: la cura del plan era la cura
  equivocada — el paquete es del hogar).

---

## 3 · PRINCIPIOS DE DISEÑO REUTILIZABLES (el prestador los hereda)

- **Mismo significado, valor por contexto** — resolvió cuatro choques sin
  enmendar ley: tealDark/teal vivo por tema · el tapiz por casa (magenta
  cliente / verde oficio, 3%) · A4 invertida (luz blanca sobre techo oscuro,
  tinta sobre claro) · el CTA un color en los dos temas cuando el par lo
  permite (el oro, 9.96 idéntico — esa igualdad es lo que lo hace posible).
- **El canal correcto cuando el color no alcanza**: un secundario tonal no
  llega a 3:1 sin volverse primario → superficie apoyada (sinCaja). En oscuro
  la luminancia está agotada por los dos lados (subir card rompe 6 pares AA;
  bajar base no compra — el +0.05 de WCAG domina en L≈0) → el contorno
  direccional: el halo (1.51 vs 1.037). Una caja necesita cuatro lados; el halo
  no rodea — A6 intacta.
- **La pata es la gramática de selección de la casa** (FiltroPills,
  FiltroMascotas, SelectorSegmentado): magenta, SOLO en la elegida (una marca
  en todos los hermanos no señala a ninguno — S80 explicado, no contradicho),
  JAMÁS adentro de la placa (R22), apoyada sobre el canto con el chip cediendo
  (bg.hundido). Al marcar por forma, L-b dejó de aplicar: no hay relleno que
  dosificar.
- **Los ejes sin categoría se marcan por forma/tinta, no por color de capa**
  (estado y tiempo no tienen categoría; solo el eje de SERVICIO lleva color,
  Ley 10 — y vet es SALUD vía capa.identidad, el token más viejo que la
  taxonomía).
- **Elección excluyente ≠ toggle**: dos interruptores que se excluyen prometen
  independencia — el control miente antes de que lo toquen. Interruptor solo
  para el agregado real (local default / domicilio se prende; el plan
  frecuente). El rol de accesibilidad acompaña: tab→radio cuando se elige
  producto.
- **El chevron dice qué encuentra el usuario después de tocar**: información
  despliega (⌄/⌃), acción con formulario abre Hoja y lleva (›). En vet
  conviven las dos flechas en la misma lista — la señal de que el criterio
  discrimina de verdad.
- **La ausencia tiene TIPOS** (5: sin registro · ninguna conocida · aún no
  corresponde · cerrado vs no configurado · firme sin fecha — con daño cobrado
  en S71: una fecha null no pasa ningún filtro de fecha). El nulo honesto dice
  lo que sabe y POR QUÉ no hay número; $0,00 es mentira con formato de dato.
  La ausencia como OMISIÓN gana al null (una fila que no existe no se puede
  leer mal).
- **Apagar de menos, jamás de más** (días cerrados). "Cerrado" para un conjunto
  = todos cierran; la intersección vive UNA vez en el motor.
- **La gramática canónica manda** (S61, en piedra): MASCOTA → QUÉ → DÍA → HORA
  → QUIÉN. Decidió el lector de días cerrados por servicio y el del precio de
  adiestramiento (el dueño no conoce prestador en ese paso).
- **El CTA vivo**: apagado dice QUÉ falta (S63-B), sigue tocable
  (razonDeshabilitado en la primitiva), la etiqueta nombra ("Agendar el paseo
  de Thor"), y el mensaje señala la hilera.

---

## 4 · ESTADO AL CIERRE Y PENDIENTES CON DUEÑO

**Publicado**: group f55d65c9 · ancla 27431b9 · runtime 1.0.2 · preview.

**Esperan gate del founder (galería ①)**: las seis decisiones abiertas · los
cuatro glifos a 21px (¿sobrevive el bisel del lápiz?).

**Deudas vivas con disparo**:
- D-585 caso clínico (motor completo sin puerta; dispara con la primera
  pantalla vet del prestador). D-586 índice (muere con worktree).
- Moneda: guard 29·44 solo-baja; el barrido espera ensanchar los lectores de
  catálogo (28 sitios sin país — curarlos hoy sería inventar la moneda). Los
  pies de vet/grooming con toFixed a mano (deuda declarada de C). El prestador
  (44) es de su sesión.
- La rama sin-precio del pie de adiestramiento: soportada por diseño, no
  observada con datos.
- warm (3 slots huérfanos del manual de marca, D-583): primer lugar al abrir la
  voz del producto; si al 1-oct siguen en cero, mueren.
- El lote consolidado de strings (una aprobación, no seis) · bitacoraTab como
  título quedó flaco.
- Censados sin curar: los 🟠/🟡 del censo de lectores de A · [demo s44] en
  titulo_fuente (cura de dato) · los cortes de mono "[d…".

**Ley propuesta SIN firma (regla 80)**: la ley de la pata · la muerte del guard
· las 13 candidatas del censo. Ninguna rige hasta su gate.

**Microanimaciones/transiciones**: tercera sesión (transversal), salvo el
elemento compartido del avatar — tanda corta al final de la sesión del
prestador. La galería va a necesitar comparar movimiento (dos versiones
disparables — el "verla otra vez" de Entrada como molde): sin eso se firma
animación de memoria.

---

## 5 · ARRANQUE DE LA SESIÓN DEL PRESTADOR — checklist

1. **Worktree por pista** — la primera decisión, con el árbol limpio.
2. **El inventario en la mano ANTES de repartir** (S82 no lo tuvo: sin
   burn-down y cuatro cruces).
3. Las láminas del prestador en `docs/laminas/` desde el minuto uno.
4. El bloque de auditoría rige desde la primera directiva.
5. **Su lote de S81 nunca fue gateado** — va primero al teléfono.
6. Los tres eslabones del cierre + el cuarto (lo que consumís sigue vigente).
7. El tinte verde quedó al 3%. El HOY del prestador tiene 4 tarjetas donde 2
   son candidatas a la excepción de sin-tarjeta — se juzgan de a una, jamás con
   regex.
8. Los guards son de las dos apps: moneda (44) · alcanzabilidad · las 21+
   reglas con sus tres capas · el hook de pre-commit.
9. El chip elegido en MEMORIAL sigue sin mirar (el único tema donde el slot no
   aporta paso).
10. Pasarela sin resolver (Stripe pide LLC): 1-oct es piloto asistido si no se
    destraba. El tren FCM armado sin disparo. El arco de login pendiente
    (recuperar contraseña no existe; eliminar cuenta no funcional).
