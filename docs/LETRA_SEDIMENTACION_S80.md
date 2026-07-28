# LETRA_SEDIMENTACION — el acuse de recibo del expediente

> **Versión: v0.1 — S80 (28 Jul 2026). PROPUESTA, espera firma del
> founder.** Escrita por orden de mesa S80-A4, SOBRE MEDICIÓN previa
> (§0) — jamás sobre premisa supuesta. **Por qué es letra propia y no
> sección de un doc de app: cruza las DOS apps** — el prestador la
> EMITE, el cliente la RECIBE; una letra que viviera en el doc de una
> app dejaría a la otra mitad sin dueño.
> **Contrastes obligatorios:** `DEFINICION_SOFTLAUNCH` §1 (su porqué) ·
> `PORTAL_PRESTADOR` §2.4 (su guarda) · `DIRECCION_ARTE` §9.6 (su ley
> de forma) · `MODELO_LOYALTY` (la moneda es invisible — el acuse no
> puntúa).

## §0 — LO MEDIDO (28-jul-2026, DB viva + fuente; la letra nace de acá)

Qué pasa HOY cuando un paseador cierra un paseo:

1. **Qué se escribe** — `cerrar_paseo_con_calidad` hace DOS updates
   (`evento_cita_servicio.estado` · `evento_atencion.estado`) y llama
   `crear_evento_economico` (el devengo, variante (b) S54). **NO
   escribe `notificaciones`** (medido: cero menciones en el body) y
   **NO crea el evento del expediente**.
2. **El sedimento nace ANTES: al INICIAR.** El único productor de
   `atencion_paseo_registrada` es `iniciar_atencion_paseo` (censo por
   prosrc — un solo resultado). El cierre lo completa; no lo crea.
3. **Qué ve el prestador al cerrar** — un toast `cita.parteEnviado`
   ("éxito") y `router.dismissTo('/')`: vuelve al HOY
   (`cierre.tsx:177-178`). **La voz habla del ENVÍO del parte; nada le
   dice que su trabajo quedó en la vida documentada de la mascota.**
4. **Qué ve el cliente** — el evento SÍ vive en la Línea de Vida con
   voz propia y capa: `atencion_paseo_registrada → lineaDeVida.vozPaseo
   · capa cuidado` (diccionario cerrado de `LineaDeVida.tsx:71`).
   Verificado también en datos: los dos Zeus llevan
   `atencion_paseo_registrada` legibles por su familia.

**El diagnóstico que la letra cura: el sedimento EXISTE y el ecosistema
lo recibe — lo que NO existe es el ACUSE.** El circuito del NORTE
("el expediente es el sedimento de todas las experiencias") corre
completo del lado del dato y queda MUDO del lado de quien lo produjo.

## §0bis — LA MEDICIÓN A9: la familia lo ve MIENTRAS OCURRE

La pregunta de mesa (¿la familia ve el sedimento en vivo?) medida en
las tres patas, 28-jul:

1. **Las lectoras del cliente que alcanzan el evento** — cuatro:
   `_timeline` (la Línea de Vida, `timeline.ts:82`) ·
   `obtenerSenalesHogar` (`hogar.ts` — deriva las `atenciones_en_curso`
   de `evento_atencion.estado='en_curso'` y lee el TIPO del evento raíz
   para el oficio de la celda viva) · `perfilMascota.ts:105` (el conteo
   de paseos) · `leerDetalleAtencion` (la pantalla del paseo). **RLS:
   una sola policy de lectura** — `eventos_mascota_select:
   user_acceso_clinico_a_mascota(mascota_id)` (la familia entra por su
   pata; D-464/S75 cerró la de terceros).
2. **La Línea de Vida lo muestra DESDE EL INICIO, no al cerrar.** El
   filtro literal del lector: `.eq('soft_delete', false)` ·
   `.neq('tipo', 'cita_servicio')` · orden `fecha_evento desc` — **cero
   filtro por estado de la atención**. El evento que
   `iniciar_atencion_paseo` crea es visible al toque (la duración se
   computa solo cuando `terminada_en` existe — hasta entonces, null
   honesto).
3. **Y hay VIVO de verdad**: la celda de atención en curso en el Hogar
   (N vivas, §7.5) → `paseo/[atencionId]` cara EN VIVO — mapa con tramo
   acumulado, Cronometro, novedades en voz de familia, fotos, **sondeo
   de 30 s con la pantalla en foco** (`SONDEO_MS = 30_000`; el GPS del
   paseador escribe ~60 s foreground, D-292).

**LA CONSECUENCIA, declarada (es la disyuntiva del founder, no de esta
letra):** el acuse honesto del cierre NO es "quedó registrado" — al
momento de cerrar, **la familia ya pudo estar VIENDO la salida en
vivo**. Hay dos productos posibles y son distintos: **(a) el acuse de
REGISTRO** ("quedó en la vida de {nombre}" — sereno, siempre verdad) y
**(b) el acuse de AUDIENCIA** ("la familia lo siguió en vivo" — más
fuerte, pero exige saber si ALGUIEN miró, dato que hoy NO se captura:
ninguna lectora registra vistas). **La v1 de esta letra solo puede
prometer (a) sin motor nuevo; (b) pide un dato de audiencia que no
existe y su propia decisión de producto** (¿queremos medir miradas? —
cruza con privacidad y con el espíritu anti-métrica de LOYALTY). **Y
sobre (b) rige la advertencia de `LETRA_TURNOS_S78` §1, citada literal:
e-PetPlace no mide fichadas ni productividad — *"si esta letra derivara
en reportes de cumplimiento o en ranking, está mal leída"*. Medir si la
familia miró es medir personas: (b) nace con esa frontera encima.**

**LA TERCERA OPCIÓN (mesa A10) — (c) el acuse MUESTRA el evento, no lo
describe.** Cero motor, cero métrica: al cerrar, el prestador VE el
nodo tal como quedó en la Línea de Vida — §9.6 en su forma más literal
(el destino acusa recibo MOSTRANDO el destino). **Medición A10 de lo
que un prestador puede leer de la mascota que acaba de atender** (body
entero de `user_acceso_clinico_a_mascota` + prueba en datos):

- El brazo prestador tiene DOS niveles: **el TITULAR pasa liso**
  (cuenta comercial con acceso vigente en `mascota_acceso_prestador`;
  caducidad PEREZOSA de 6 meses parametrizable
  (`acceso_prestador_caducidad_meses`), re-validada contra cita real
  para el método `cita_automatica`) — verificado en datos: el titular
  demo lee 14/16 eventos de los dos Zeus. **El EMPLEADO activo pasa
  SOLO con `empleado_tiene_capacidad_clinica`** — chip médico, titular
  o admin (el flip S76). **Consecuencia declarada: el empleado
  paseador — exactamente quien más cierra paseos en un negocio con
  equipo — NO puede leer el evento por la pata mascota.**
- La salida honesta de (c) para ese caso, declarada sin resolver: el
  acuse del empleado se compone desde SUS lectoras (la atención es
  suya — parte, fotos, track propios), no desde la Línea de Vida
  ajena; o la mesa decide que el acuse-espejo pleno es de titulares
  en v1.

**LAS TRES OPCIONES — (a) registro · (b) audiencia (con su frontera) ·
(c) mostrar — VAN A LA FIRMA DEL FOUNDER.** La voz de §2 y la
superficie de §5 quedan condicionadas a esa firma.

## §1 — La ley

**Todo cierre de atención produce un ACUSE DE RECIBO al prestador: el
ecosistema le dice que su trabajo quedó en la vida documentada de la
mascota.** El porqué es el test de `DEFINICION_SOFTLAUNCH` §1: la
experiencia impecable de CADA actor es condición de existencia y el
expediente es el sedimento de todas — un actor que alimenta el
expediente sin enterarse de que lo alimentó no vive esa ley, la padece.

## §2 — La voz del acuse

El acuse dice el HECHO, con el nombre de la mascota. Voz candidata
(string con gate propio, L-142 — no viaja como firmada):

> *"Quedó en la vida de {nombre}."*

Tres rasgos exigibles: nombra el HECHO (sedimentó), nombra al SUJETO
(la mascota, no la transacción — EL NORTE), y TERMINA AHÍ — sin camino,
sin pedido, sin premio. (Espejo de la letra del founder S74 sobre la
observación: se CUENTA, no se celebra ni se trata.)

## §3 — La guarda (PORTAL §2.4)

**Acuse SOBRIO, jamás celebración.** Cero confetti, cero badge, cero
puntos — la moneda de `MODELO_LOYALTY` es invisible y este acuse no es
su superficie. Si el acuse se siente premio, está mal construido: es un
RECIBO, la clase de papel que uno guarda sin aplaudir.

## §4 — La forma (DIRECCION_ARTE §9.6)

La sedimentación es §9.6 aplicada al expediente: **el destino acusa
recibo**. El trabajo del prestador no puede "desaparecer en la nada"
(un toast que habla de otra cosa y una vuelta al HOY); el acuse es la
mitad-destino de esa ley.

## §5 — Lo que la letra NO pide (alcance v1, sobre §0)

- **CERO motor nuevo**: el sedimento ya existe (§0.2) y el cliente ya
  lo recibe (§0.4). La v1 es VOZ + composición en la superficie de
  cierre del prestador — dónde exactamente (¿el toast se reescribe? ¿la
  pantalla de cierre gana un estado post-envío?) es decisión de DISEÑO
  con su M1 propio, no de esta letra.
- **La procedencia acompaña**: cuando el tercer nivel rige
  (`declarado_por_prestador`, S69), el acuse y el sedimento dicen la
  misma verdad — el acuse jamás promete una autoría que el evento no
  registra.
- **El timing se declara, no se maquilla**: el evento nace al INICIAR
  (§0.2) — el acuse del cierre dice "quedó", no "acaba de crearse".
  Verdad de motor conocida, no deuda.

## Decisiones abiertas (para la mesa, no resueltas acá)

1. La superficie del acuse (toast enriquecido vs estado de la pantalla
   de cierre) — M1 + gate.
2. Los otros oficios: grooming/adiestramiento/vet cierran por sus
   propias puertas — el censo de sus cierres (¿mismo hueco?) antes de
   generalizar (L-144: relevar antes de curar).
3. Si el acuse del prestador algún día muestra QUÉ quedó (el parte, la
   foto), cruza con la modulación por actor (`BIO_EXPEDIENTE` A3) — v2,
   jamás v1.

## Historial

- **v0.1 (S80, 28 Jul 2026):** semilla por orden de mesa A4, con la
  medición §0 como fundación. PROPUESTA sin firma.
