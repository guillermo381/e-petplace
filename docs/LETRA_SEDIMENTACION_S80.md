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
