/**
 * e-PetPlace — Design Tokens v4 · MOVIMIENTO
 * Portado de v3.1 sin cambio de valores.
 * Curvas en dos formatos: array [x1,y1,x2,y2] para RN/Reanimated
 * (Easing.bezier(...easing.easeOut.bezier)) y string CSS para RN-web.
 */

export const motion = {
  duration: {
    /* ── ☠️ LOS CUATRO LEGADOS, RENOMBRADOS (S100-B) ─────────────────
       Se llamaban `instant` · `normal` · `slow` · `verySlow`, y el
       problema no era que existieran: era que **sus nombres competían
       con el vocabulario sin ser parte de él.**

       🔴 EL CASO QUE LO OBLIGÓ: `normal` vale **250** y el vocabulario
       cerrado de N10 es **150 · 300 · 520**. Una pista casi lo usa en
       una pieza nueva **creyendo que era el estándar** — la frenó un
       comentario, no un gate.

       ⚡ Y LA MEDICIÓN QUE LO VUELVE HECHO, no doctrina: de los cuatro,
       **`instant`, `slow` y `verySlow` tenían CERO usos** y `normal`
       tenía **15**. ***El único legado vivo era justamente el del
       nombre plausible.*** Los que se delatan solos por el nombre no
       los usa nadie — y por eso el nombre ERA el defecto.

       ⚠️ **NINGÚN VALOR CAMBIÓ: 250 sigue siendo 250.** Este rename no
       toca cómo se ve nada; solo hace que el nombre diga la verdad. La
       migración de los 15 usos a la banda de N10 es otra cosa —cambia
       el MOVIMIENTO y pide gate en dispositivo—, y sigue pendiente con
       su dueño.

       > *Un nombre que parece correcto es peor que uno que falta: el
       > que falta se busca, el que parece correcto se usa.* */
    legacy_instant:  80,
    fast:     150,
    legacy_normal:   250,
    legacy_slow:     400,
    legacy_verySlow: 600,

    /* ── N10 · EL VOCABULARIO CERRADO DEL MOVIMIENTO (Norte, mesa
       13-ago-2026) ──────────────────────────────────────────────────
       «Un bezier, tres duraciones: 150 micro · 300 estándar · 520
       grande. Qué se anima es lista cerrada. Nada más se mueve.»

       🔴 POR QUÉ SE AGREGAN EN VEZ DE MAPEARSE A LOS DE ARRIBA: de las
       tres del Norte, **solo 150 existía** (`fast`). El 300 vivía como
       número PRIVADO dentro de `Entrada` —con un comentario que lo
       llama «techo de Ley 6: INTOCABLE», o sea una ley escrita en una
       constante local— y el **520 no existía en ninguna parte**. Un
       vocabulario declarado CERRADO cuyos valores no son tokens no es
       un vocabulario: es una convención que cada pieza vuelve a
       teclear, y la primera que teclee 500 en vez de 520 no rompe
       ningún gate.

       Los cinco de arriba NO se tocan y NO se deprecan en esta tanda:
       `normal` (250) tiene consumidores vivos y re-apuntarlos a 300 es
       un cambio VISIBLE en toda la casa — enmienda con gate, no línea
       de token. Lo que nace acá es el vocabulario del Norte con su
       nombre, para que lo NUEVO tenga de dónde salir. */
    micro:    150,  // chips, crossfade de estado
    estandar: 300,  // entradas, Hojas — el techo de Ley 6
    grande:   520,  // la celebración (el destape). Único registro «grande».

    /** EL CUARTO VALOR, y se rotula así porque N10 dice «TRES
     *  duraciones»: el overshoot de la huella de tab pide **280**, que
     *  no es ninguna de las tres. Se deposita con su nombre en vez de
     *  quedar tecleado en la barra, pero **no se cuela al vocabulario
     *  cerrado**: vive rotulado como excepción de UNA candidata.
     *
     *  ☠️ MUERTE: con el gate de `DIRECCION_ARTE` §5.4, que lista el
     *  overshoot como CANDIDATA SIN FIRMA. Si el founder lo firma, el
     *  280 entra al vocabulario con su registro; si lo rechaza, este
     *  token se retira junto con la prop `overshootHuella` de
     *  `BarraTabs`. Un token de candidata no sobrevive a su gate. */
    overshootTab: 280,
  },

  easing: {
    // Entradas de UI — rápido al inicio, suave al final
    easeOut:   { bezier: [0, 0, 0.2, 1] as const,        css: 'cubic-bezier(0, 0, 0.2, 1)' },
    // Confirmaciones táctiles — rebote spring
    spring:    { bezier: [0.34, 1.56, 0.64, 1] as const, css: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    // Transiciones entre pantallas
    easeInOut: { bezier: [0.4, 0, 0.6, 1] as const,      css: 'cubic-bezier(0.4, 0, 0.6, 1)' },
    // Salidas
    easeIn:    { bezier: [0.4, 0, 1, 1] as const,        css: 'cubic-bezier(0.4, 0, 1, 1)' },
  },

  stagger: {
    fast:   60,
    normal: 80,
    slow:   120,
  },

  // Motion de MARCA (S53, DIRECCION_ARTE §5.2): la física de la
  // apertura del Coach, minada del prototipo. El scrim es EFECTIVO
  // (0.4 en pantalla; la Hoja lo traduce sobre palette.scrim).
  marca: {
    aperturaMs: 340,
    aperturaBezier: [0.32, 0.72, 0, 1] as const,
    scrimEfectivo: 0.4,
  },

  /* ══ LA FÍSICA DEL COACH (S113-B · lote 0) ═════════════════════════════
   * 🔴 **RESERVADO a `PresenciaCoach` y `CabeceraCoach`.** Igual que
   * `marca`, y por el mismo precedente: **el Coach ya tiene registro de
   * motion propio desde S53** — `marca` NACIÓ siendo su excepción (340 ms
   * cuando N10 dice 300). *Esto no funda una excepción: la continúa.*
   *
   * ── 🔴 EL CHOQUE CONTRA N10, MEDIDO NÚMERO POR NÚMERO ─────────────
   * N10 es un vocabulario **CERRADO**: un bezier `(.32,.72,0,1)` y tres
   * duraciones **150 · 300 · 520**. Estos valores los dictó el founder en
   * el encargo del lote, con su literal —*«así lo quiero ver en el
   * teléfono»*—, y **seis de los ocho caen fuera de la banda**:
   *
   * | acá | N10 más cercano | qué es |
   * |---|---|---|
   * | viaje **220** | 150 / 300 | el orbe hasta la almohadilla |
   * | fundido **250** | 300 | perla → violeta |
   * | cierre **160** | 150 | la huella se recoge |
   * | barrido **130** | 150 | el destello de IA |
   * | escalonado **40** | `stagger.fast` = 60 | los cuatro dedos |
   * | respiración **4000** | *ninguna* | ciclo continuo, no un gesto |
   * | latido **340** | 300 | = `marca.aperturaMs`, ya firmado |
   * | curva `(.2,.9,.3,1.15)` | bezier de la casa · `spring` (1.56) | — |
   *
   * **La curva es el choque de fondo, y no es de grado:** N10 reparte DOS
   * curvas —bezier para lo que entra, spring para lo que rebota al dedo—
   * y ésta es una tercera: **un bezier CON overshoot** (1.15). *No es la
   * de la casa, porque tiene rebote; no es `spring` (1.56), porque ese
   * rebota tres veces más fuerte y acá el gesto es un empuje leve, no un
   * pique.*
   *
   * ── LO QUE SE HIZO PARA QUE EL CHOQUE SEA REVERSIBLE Y NO PERMANENTE
   * **Los ocho valores viven ACÁ y ninguno se expone como prop.** Es la
   * mitad de N10 que sí se puede cumplir entera —*«el reparto es exigible
   * porque las dos curvas viven adentro de las piezas; si vivieran en las
   * pantallas, cerrado sería una intención»*—. ⇒ **el punto de reversión
   * es este bloque**: si el founder mira el teléfono y prefiere la banda
   * de N10, se cambian ocho números en un archivo y ninguna pantalla se
   * entera.
   *
   * ⚠️ **No es una enmienda a N10 y no se escribe como tal.** Una ley
   * firmada no la deroga una pista: *dos letras firmadas que se
   * contradicen son peores que una equivocada.* Esto es un registro
   * declarado con su choque a la vista, esperando el gate en el teléfono.
   * Si el founder firma lo que ve, N10 gana una enmienda con su fecha —y
   * la escribe quien la firma, no quien la construyó. */
  coach: {
    /** El ciclo de la respiración, ida y vuelta (§2.1). */
    respiracionMs: 4000,
    /** 1,00 → 1,06. **Un animal dormido, no un latido.** */
    respiracionEscala: 1.06,
    /** Cada cuánto cruza el barrido de luz. */
    barridoCadaMs: 8000,
    /** Lo que tarda en cruzar.
     *  ⏪ **Eran 130 ms, y en el emulador NO SE VEÍA.** El mecanismo estaba
     *  bien —congelado a mitad de recorrido la banda aparece— pero a 130 ms
     *  es imperceptible: **en 18 s de grabación a 20 fps, con dos barridos
     *  ocurriendo, ni un cuadro de 360 lo registró.**
     *  🔴 **El número nuevo no lo inventé: lo mide el boceto que el founder
     *  puso como referencia.** Ahí el barrido cruza entre el 82 % y el 92 %
     *  de un ciclo de 8 s ⇒ **~800 ms**. *El 130 venía del encargo del lote
     *  0, cuando todavía no había boceto contra el que medir.* */
    barridoMs: 800,
    /** La diagonal, en grados. */
    barridoAngulo: 115,
    /** El orbe hasta el centro inferior. */
    viajeMs: 220,
    /** El empuje leve: overshoot 1,15 — ver el choque arriba. */
    viajeBezier: [0.2, 0.9, 0.3, 1.15] as const,
    /** Perla dormida → violeta despierta. */
    fundidoMs: 250,
    /** Entre dedo y dedo. */
    escalonadoMs: 40,
    /** El cierre, **sin escalonado**: se abre en orden y se recoge de
     *  golpe. *Escalonar la salida hace esperar a quien ya decidió irse.* */
    cierreMs: 160,
    /** El latido de la cabecera: 1 → 1,18 → 1, **por frase que llega de
     *  verdad**. Coincide con `marca.aperturaMs` a propósito: es el mismo
     *  cuerpo moviéndose en dos lugares. */
    latidoMs: 340,
    latidoEscala: 1.18,
    /** El velo, en pantalla. `palette.coachVelo` ya lo trae; esto es para
     *  quien anime la opacidad sobre `palette.scrim` (el mecanismo de la
     *  Hoja) y necesite el cociente. */
    veloEfectivo: 0.42,
  },

  // React Native — useNativeDriver: true cuando sea posible (v3.1)
  rn: {
    springConfig: { tension: 180, friction: 12, useNativeDriver: true },
    fadeConfig:   { duration: 250, useNativeDriver: true },
  },
} as const
