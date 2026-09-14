/**
 * Icono — el set b′ de la casa (S53, DIRECCION_ARTE §1-§2).
 *
 * La regla madre: EN CADA ÍCONO, LA MASCOTA ESTÁ PRESENTE — objeto del
 * oficio en trazo 1.9 de tinta + UNA Huella rellena en el hex puro de
 * su capa, colocada donde la mascota está en el concepto. Nombre
 * TIPADO (cero strings mágicos); tema y memorial se resuelven ADENTRO
 * (§2.8: en memorial la huella pasa a text.secondary, el trazo se
 * conserva; el destello del coach NO destella — tinta, quieto).
 *
 * Decisión técnica (regla 74): registry de dibujantes por nombre —
 * cada ícono es una función que recibe {tinta, huella} ya resueltos
 * por tema/registro; agregar un ícono = una entrada en el registry +
 * su fila en la galería + gate founder (DIRECCION_ARTE §6).
 *
 * `registro` (§2.7, dosis prestador): 'capa' = hex PURO (gráfica,
 * default dueño) · 'aa' = color funcional AA de la capa · 'tinta' =
 * la vista ya porta su único acento.
 *
 * Ley §2.9: todo ícono se gatea a su tamaño de diseño Y a 21px.
 */

import Svg, { Circle, G, Path, Rect } from 'react-native-svg'

import { resolverHuella, type MontajeIcono } from './icono-huella'

import { useTheme } from '../ThemeProvider'
import { Huella } from '../brand/Huella'

export type IconoNombre =
  | 'paseo' | 'veterinaria' | 'grooming' | 'refugio' | 'despensa'
  /** G-14 (S100b-B) — LA CANASTA, distinta de `despensa`: aquélla es la
   *  SECCIÓN y ésta es lo que llevás adentro. Conviven en pantalla. */
  | 'carrito'
  /** G-08 (S100b-B) — el `−` del stepper con cantidad 1, **solo en el
   *  carrito**. Familia de CONTROL: sin huella, como `lapiz`.
   *
   *  🔴 **ENMENDADO S116-B — Y LA ENMIENDA CORRIGE UNA MEDICIÓN MÍA, no el
   *  glifo.** El §② del lote 0 declaró este caso como uno de los tres
   *  donde *«el dibujo dice otra cosa»*: leyó este comentario (*«el `−` del
   *  stepper»*), lo cruzó contra el dibujo (un TACHO) y concluyó que no
   *  coincidían. El encargo del lote 2 vino de esa conclusión.
   *  **Al abrir el consumidor, coinciden.** `StepperCantidad:592` monta
   *  este glifo con `signo={onBorrar !== undefined && v <= min ?
   *  'papelera' : 'menos'}` — o sea **sólo cuando bajar de 1 SACA EL ÍTEM
   *  DE LA LISTA**, y el propio Stepper lo dice dos veces: *«en la GRILLA
   *  no: ahí bajar de 1 devuelve la tarjeta a su `+`, el tile no
   *  desaparece, y una papelera prometería un borrado que no ocurre»*.
   *  ⇒ el tacho dice ELIMINAR y ahí se elimina de verdad. **El que decía
   *  de menos era esta línea**, que omitía el `onBorrar`. Se corrige acá y
   *  el dibujo NO se toca.
   *  *Leer el nombre y el comentario y no el consumidor produjo una
   *  conclusión verosímil y falsa — la clase exacta que esta casa persigue,
   *  cobrada por quien la estaba aplicando a los otros dos casos.*
   *  ⚠️ El `−` propiamente dicho vive desde S116-B en `quitar`. */
  | 'papelera'
  /** S100c-B, pedido de D — LA TAB DE PEDIDOS. Distinto de `despensa` (la
   *  sección) y de `carrito` (lo que llevás sin comprar): esto es lo que YA
   *  compraste y está en camino. Las tres conviven en la misma barra. */
  | 'pedido'
  // ☠️ 'coach' MURIÓ COMO NOMBRE (S84-B11) — RENAME a 'ia', firmado.
  //    El dibujo NO cambió una línea: son las mismas tres chispas de
  //    CHISPA. Lo que cambió es qué nombra. El código decía que este
  //    glifo ES la marca de la IA ("Sin huella: el destello ES la marca
  //    de la IA", S53) y a la vez se llamaba como UNA PANTALLA. Con el
  //    botón "mejorar con IA" el equívoco se volvía visible: montar
  //    `nombre="coach"` en una acción que no es el Coach.
  //    NO SE HIZO ALIAS Y ES LA DECISIÓN: dos nombres para un dibujo es
  //    no decidir cuál es el correcto, y deja al siguiente eligiendo.
  | 'ia'
  // ── LOTE 3 (S58, D-361 — gate founder POR ÍCONO pendiente) ──
  | 'hogar' | 'explorar' | 'cuenta' | 'hoy' | 'negocio'
  // S98 — el ⓘ de «qué significa este campo». NO es `ayuda` (el
  // salvavidas): ver su dibujante para el criterio y su gate pendiente.
  | 'info'
  // S97+ — el destino central del prestador: la puerta abierta (ver su
  // dibujante para el porqué del concepto y su recambio declarado).
  | 'atender'
  | 'carnet' | 'familia' | 'preferencias' | 'pagos' | 'ayuda' | 'ubicacion'
  | 'training' | 'hotel' | 'guarderia' | 'seguros' | 'telemedicina'
  | 'vacaciones' | 'equipo'
  // Prime (concepto 19): DOS candidatos — el founder elige a 21px; el perdedor muere
  | 'prime' | 'primeCorona'
  // ── LOTE S71-B2 (proceso enmendado DIRECCION_ARTE: la sesión autora,
  //    hoja de contacto de 3 variantes, firma founder POR ícono) ──
  | 'caso' | 'presupuesto'
  /* ── LOS CUATRO NODOS DEL SEGUIMIENTO (S99-B · §6b, GATE POR ÍCONO
   *    PENDIENTE) ──────────────────────────────────────────────────
   *  Son **GLIFOS DE CONTROL**: sin huella, por la Ley 9 en su alcance
   *  S98 (*«en un glifo de control no hay mascota, hay interfaz»*).
   *  Su nombre sigue a la NARRATIVA y no a la forma, porque la frontera
   *  de la escalera son las 7 narrativas: si mañana cambia el vocabulario
   *  del motor, se ve en el nombre del glifo. */
  | 'nodoConfirmado' | 'nodoPreparando' | 'nodoEnCamino' | 'nodoEntregado'
  /* ── S112-B · LA ESCALERA DE LA ADOPCIÓN Y SU BARRA (firma founder, 2-sep)
     Cinco de ETAPA —clasificación de mesa: *informan y no accionan*— y uno de
     CONTROL. **Los cinco de etapa van SIN HUELLA y se declara acá, no en el
     gate** (§6b paso 6): sobre, burbujas, check y pluma son objetos de
     trámite, y una huella sobre un sobre diría «sobre de mascota», que no
     significa nada.

     🔴 **Y falta uno de los seis a propósito: «casa con huella» NO se
     dibujó** — el censo de metáforas (§6b paso 2) encontró que **ya existe y
     es el mismo dibujo**: `hogar`, *«la casa que abriga — la huella vive
     adentro»*. No es un préstamo entre significados distintos —lo que la casa
     prohíbe— es EL MISMO significado: el animal adentro de una casa. Dibujar
     un segundo sería fabricar la deuda que la regla de economía de §6b nombra.
     Se declara para que el gate sepa que son CINCO y no seis, y por qué. */
  | 'sobre' | 'burbujas' | 'checkEnCirculo' | 'pluma' | 'enviar'
  /* ══ S114-B · EL CANDADO — la quinta etapa del caso de postventa ══════
     **GLIFO DE CONTROL: sin huella**, por la Ley 9 en su alcance S98 —
     *«en un glifo de control no hay mascota, hay interfaz»*. Lo que dice
     no es un momento de un animal: es que **esta conversación quedó en
     lectura** (`DIRECCION_POSTVENTA` §3.3, literal).

     🔴 **EL CENSO DE METÁFORAS (§6b paso 2) — por qué se dibuja uno nuevo,
     que es la pregunta cara.** La casa NO tiene ninguna palabra para
     «cerrado»: se recorrieron los 70 nombres del registry y los candidatos
     eran dos, los dos rechazados con su razón:

     · **`caso`** (la carpeta con huella) — dice *«el caso»*, no *«cerrado»*.
       Además es la carpeta CLÍNICA: prestarla a la postventa sería
       trasplantar un criterio correcto a otra pregunta (`D-976`), que es
       más peligroso que inventar porque **viene con la autoridad de haber
       funcionado en otro lado**.
     · **`nodoEntregado`** (el visto suelto) — es el candidato fuerte y cae
       por VECINDAD, no por significado: la etapa de al lado es
       `checkEnCirculo`, y **dos checks seguidos en una escalera de cinco no
       dejan distinguir «se decidió» de «se terminó»**. *Su propia entrada ya
       escribió el criterio que los separa; ponerlos juntos lo borra.*

     LA FORMA: cuerpo rectangular + arco cerrado. **El arco va CERRADO y
     apoyado sobre el cuerpo** — un arco abierto es *«se puede abrir»*, y acá
     el hecho es que el hilo ya no acepta escritura.
     Riesgo declarado, y es el primero que hay que mirar en el gate: a 21 px
     el ojo de la cerradura se llena. **Por eso no lo lleva**: el cuerpo va
     liso, y lo que hace leer «candado» es la proporción del arco contra el
     cuerpo, no el detalle interior.
     ⚠️ **GATE POR ÍCONO PENDIENTE** (§2.9: se juzga a su tamaño de diseño Y
     a 21 px, montado junto a cinco del registry). */
  | 'candado'
  // ── LOS DOS PRIMEROS GLIFOS DE CONTROL (S82-B r7, importados del
  //    archivo de referencia que el founder entregó: `ficha-mascota`).
  //    GATE POR ÍCONO A 21px PENDIENTE (§2.9) · su LETRA NO SE ESCRIBE
  //    acá: la categoría "glifo de control" es §6bis de DIRECCION_ARTE,
  //    PENDIENTE desde S78 — regla 80 (la ley va DESPUÉS del gate).
  | 'lapiz' | 'compartir'
  /* ── S107-B · CERTIFICACIONES y WEARABLES — DOS CANDIDATOS CADA UNO
   *    (molde `prime`/`primeCorona`: el founder elige a 21px y el perdedor
   *    muere con su lápida). GATE POR ÍCONO PENDIENTE (§2.9).
   *
   *  ══ CERTIFICACIÓN ═══════════════════════════════════════════════════
   *  **La orden del founder trae su propio veto: «el error fácil es dibujar
   *  una medalla o un diploma — eso acredita a la persona equivocada».**
   *  Y la casa YA tenía la salida escrita, en la entrada de `documento`:
   *
   *  > *«`carnet` es el de vacunas de la MASCOTA — **su huella sobre una
   *  > cédula diría que el documento es del animal**»*
   *
   *  ⇒ **La huella no es el adorno de este glifo: es lo que resuelve el
   *  veto.** Un papel con la huella RELLENA encima dice *«la acreditada es
   *  ella»*; una medalla dice *«alguien ganó algo»*. *No se inventó un
   *  criterio: se ejerció el que la casa ya había escrito para el caso
   *  inverso.*
   *
   *  CENSO DE OBJETOS OCUPADOS (antes de dibujar): `documento` es
   *  identificación **con retrato** · `carnet` es la **placa** de vacunas ·
   *  `copiar`/`descargar` son hojas de CONTROL, sin huella. **Ninguno
   *  acredita**, y prestarlos sería la sustitución genérica que la Ley 12
   *  prohíbe.
   *
   *  ══ WEARABLE ════════════════════════════════════════════════════════
   *  **El otro veto: «jamás un corazón médico — un corazón dice consulta, y
   *  esto mide todo el tiempo».**
   *
   *  🔴 Y EL CENSO MATÓ AL CANDIDATO OBVIO: la placa del collar. **`carnet`
   *  YA es una placa colgante y `paseo` YA es el lazo del collar** — a 21px
   *  serían el mismo dibujo. ⇒ el objeto es **el DISPOSITIVO**: cuerpo
   *  redondeado con dos tramos de correa, la silueta que nadie confunde.
   *
   *  **Y la huella va ADENTRO del cuerpo**, que es lo que dice «continuo»
   *  sin órgano y sin ondas: *el aparato está mostrando a la mascota, todo
   *  el tiempo.* **Las ondas se descartaron por precedente**, no por gusto:
   *  `contactoOndas` murió en su gate porque **§1 manda dibujar el OBJETO y
   *  «el alcance» es una idea** — y encima chocaba con `ayuda` a 21px. */
  /* ☠️ `certificacionesSello` y `wearablesActividad` MURIERON EN SU GATE
     (firma del founder, 30-ago-2026) — molde `prime`/`primeCorona`: **el
     perdedor de cada par muere con su lápida**, no se guarda «por si acaso».
     *Un candidato que sobrevive a su gate es un dibujo que el próximo va a
     encontrar sin saber que ya perdió.*

     **Los ganadores son los que quedan** — `certificaciones` (papel + huella
     como SELLO) y `wearables` (el dispositivo con la huella ADENTRO)—, y **no
     se dedujo cuáles: se midió.** El consumidor ya los monta por nombre en
     `explorar/index.tsx` (`icono: 'wearables' | 'certificaciones'`), así que
     *«los que están puestos»* tenía una única lectura contra el objeto.

     Lo que perdió cada uno, para que no se re-dibuje igual: **el sello
     troquelado** (anillo con la huella adentro — su riesgo declarado era Ley 9,
     poca aire a 21 px) y **la traza de actividad** (leía a ECG, o sea clínica,
     que es justo lo que el veto del founder sacaba). */
  | 'certificaciones'
  | 'wearables'
  /** S100d-B — EL FILTRO, pedido por la pista C con su literal del founder
   *  (punto 2 del gate: *«buscador en el MISMO escalón que Filtrar, con
   *  ícono clásico de filtro»*) y con el registry censado antes de pedir:
   *  **no había candidato**. Familia de CONTROL ⇒ **sin huella**, como
   *  `lapiz`. Gate por ícono a 21 px PENDIENTE (§2.9). */
  | 'filtro'
  // ── S89-B: DESCARGAR — nace por pedido autocontenido de D (lámina
  //    `LAMINA_DOCUMENTOS_DEL_HOGAR.md`): las filas de papeles tienen su
  //    `iconoCta` cableado y NO había glifo. **Prestarle `compartir` es
  //    la sustitución genérica que la Ley 12 prohíbe** — y además serían
  //    dos ACCIONES DISTINTAS con el mismo dibujo, que es el caso peor:
  //    compartir MANDA el papel afuera, descargar lo TRAE al teléfono.
  //    Gate por ícono a 21px PENDIENTE (§2.9), como sus vecinos.
  | 'descargar'
  // ── S103-B · COPIAR — LAS DOS HOJAS, y NO nace por falta de dibujo sino
  //    por falta de OBJETO LIBRE. El censo se hizo antes de dibujar y dio
  //    un candidato real: **`documentos` YA es dos hojas apiladas**. No se
  //    reusó, y las dos razones están medidas:
  //      · **Su objeto es otro, declarado en su propia entrada:** «DÓNDE
  //        VIVEN LOS PAPELES». Copiar no es un lugar, es un ACTO —
  //        prestarlo es la sustitución genérica que la Ley 12 prohíbe (el
  //        mismo descarte con el que `compartir` no pudo servir de
  //        `contacto`).
  //      · **Su familia es otra:** `documentos` lleva Huella porque nombra
  //        un mundo; los CONTROLES no la llevan —`lapiz`, `filtro`,
  //        `compartir`, `descargar`, los cuatro sin huella y dicho en sus
  //        entradas—. `copiar` es control: nace sin huella.
  //
  //    EL DIBUJO ES EL ESPEJO EXACTO DEL APILADO, y eso es deliberado: la
  //    orden pide la de atrás asomando ARRIBA-IZQUIERDA y `documentos` la
  //    asoma arriba-derecha, así que **se mirroreó su geometría en vez de
  //    inventar una nueva** — mismas hojas de 10.5, mismo desfase de 3.5 en
  //    los dos ejes, mismo tuck de 3.5 antes del borde de la hoja de
  //    adelante. *Un hermano se construye con la métrica del hermano, no
  //    con una proporción parecida.* Re-centrado en la grilla 24 (bbox
  //    5→19 en los dos ejes, el mismo footprint que `compartir`) porque sin
  //    huella no hay que reservarle la esquina.
  //
  //    ⚠️ EL RIESGO, DECLARADO Y NO DISIMULADO: es el pariente más cercano
  //    que tiene este registry — `documentos` y `copiar` son espejo. Los
  //    separan DOS cosas y conviene saber cuáles: **la huella** (uno la
  //    lleva, el otro no) y **que jamás comparten unidad de barrido** —
  //    `documentos` vive en una fila de navegación del perfil, `copiar` al
  //    lado de un código. La Ley 12 enmendada S71 mide la colisión DENTRO
  //    de la unidad, y acá no hay una común. **Si el founder los ve juntos
  //    a 21px y no los separa, el que se mueve es éste.**
  //    ⚠️ **GATE POR ÍCONO A 21px PENDIENTE (§2.9)**, con el límite de
  //    siempre: en este entorno no hay rasterizador de SVG.
  | 'copiar'
  /* ── S104-B · EL PAR VER/OCULTAR DE LA CLAVE ────────────────────────
   *  Nacen POR PEDIDO DEL FOUNDER (la referencia web pedía «ojo, no la
   *  palabra Ver»). **El censo se hizo antes de dibujar: de los 52 glifos
   *  del registry NINGUNO es un ojo, y ninguno es prestable** — el más
   *  cercano conceptualmente sería `info`, y prestarlo sería exactamente
   *  la sustitución genérica que la Ley 12 prohíbe.
   *
   *  **SON DOS Y NO UNO, y es decisión:** el control tiene dos estados y
   *  cada uno tiene que decir el suyo. Un solo dibujo obligaría a la
   *  pantalla a comunicar el estado por otro canal (color, opacidad), que
   *  es justo lo que el texto «Ver/Ocultar» hacía bien y no queremos
   *  perder al cambiar a glifo.
   *
   *  FAMILIA DE CONTROL ⇒ **sin huella**, tinta en los dos registros —
   *  como `lapiz`, `filtro`, `compartir`, `descargar` y `copiar`.
   *
   *  EL DIBUJO, y por qué éste: almendra simétrica + pupila. El tachado
   *  **suelta la pupila a propósito** — a 21 px almendra + círculo + barra
   *  son tres trazos peleando en 21 px de lado, y la barra ya dice
   *  «apagado» sola. *Un glifo de estado se lee por su diferencia, no por
   *  su detalle.* La barra va a 45° exacto, de 4.5 a 19.5, para que la
   *  diferencia entre los dos hermanos sea UNA línea y no una silueta
   *  nueva.
   *
   *  ⚠️ **GATE POR ÍCONO A 21px PENDIENTE (§2.9)** — como sus vecinos, y
   *  acá con más razón: el trazo lo elegí yo por orden explícita del
   *  founder («elegí vos; el founder corrige después»). **No hay hoja de
   *  contacto de 2-3 variantes**, que es lo que §6b pide — se declara el
   *  atajo en vez de disimularlo: la orden fue construir directo y gatear
   *  sobre lo publicado. */
  | 'ojo' | 'ojoTachado'
  // ── S82-B r10: LA VACUNA gana su glifo (orden founder). Hasta hoy la
  //    fila de vacunas del perfil pintaba `veterinaria` (medido:
  //    `mascota/[mascotaId].tsx:863`) — la sustitución genérica que la
  //    Ley 12 prohíbe, y el mismo caso por el que lápiz y compartir se
  //    frenaron en r7. Gate por ícono a 21px PENDIENTE.
  | 'vacuna'
  /* ── LOS TRES ATAJOS DEL COACH (S113-B · §6b, GATE POR ÍCONO PENDIENTE) ──
   *  Nacen porque C los estaba PRESTANDO: `datos` por peso, `receta` por
   *  antiparasitario y `ojo` por foto. **Un glifo prestado no es un glifo
   *  barato: es uno que dice otra cosa** — y `ojo` por «foto» era el más
   *  flojo de los tres, porque un ojo es MIRAR y una foto es GUARDAR.
   *  Los tres son **GLIFOS DE CONTROL** (paso 6 de §6b, firma S98): viven
   *  adentro de los dedos de la huella del Coach, que son botones, y por
   *  `N27` *un glifo montado dentro de un control no lleva huella*. */
  | 'peso'
  /** S113-B · 1.2.3 — «cómo es»: la estrella de `InvitacionBio`. */
  | 'personalidad' | 'antiparasitario' | 'foto'
  // S82-B r34: LA BITÁCORA gana su glifo — adiestramiento mostraba el de
  // VACUNA (sustitución genérica, Ley 12: el mismo caso de lápiz/compartir
  // en r7 y de la vacuna en r10). Gate por ícono a 21px PENDIENTE.
  | 'bitacora'
  // ── S90-B: LA RECETA — el catálogo de papeles pasó de 2 a 4 y el set
  //    ofrecía TRES dibujos viables; A dejó `receta → 'caso'` como
  //    PRÉSTAMO DECLARADO (compila y no miente) hasta que exista el
  //    propio. Éste es el propio. ✅ FIRMADO por la mesa el 7-ago-2026 y
  //    el préstamo RETIRADO en S91-B (`apps/cliente/src/lib/papeles.ts`).
  | 'receta'
  // ── S91-B · DOCUMENTOS, en DOS CANDIDATOS (molde prime/primeCorona: el
  //    founder elige a 21px y el perdedor muere con su lápida).
  //    NACE PORQUE NO HAY GLIFO LIBRE, y está medido: `documento` hace
  //    TRIPLE turno (historia_clinica · ficha_identidad · la entrada a
  //    Documentos del hogar) y `carnet` está tomado por las vacunas. Tres
  //    iguales en una sección abierta es la clase D-546.
  //    EL OBJETO NO ES «un papel»: es DÓNDE VIVEN LOS PAPELES, y el plural
  //    es lo que lo distingue de `documento` (que es UNA cédula con
  //    retrato). Gate por ícono a 21px PENDIENTE (§2.9).
  | 'documentos' | 'pasaporte' | 'papel' | 'lupa'
  // ── S91-B · `correo` — NACIÓ COMO CANDIDATO B DE «Documentos» Y PERDIÓ
  //    SU GATE, y NO muere: el founder lo pasó a RESERVA DECLARADA.
  //    Su riesgo era que a 21px se lee «correo» antes que «documentos» —
  //    el rasterizado lo confirmó— y la firma lo dio vuelta: **esa lectura
  //    deja de ser el riesgo y pasa a ser el DESTINO**, para el centro de
  //    avisos cuando crezca.
  //    ⚠️ POR ESO SE RENOMBRA, y no es cosmética: `documentosSobre` decía
  //    «documentos» y el dibujo dice «correo». Un nombre que contradice a
  //    su dibujo es la clase de dato que esta casa caza (misma disciplina
  //    con la que `mascotaId` pasó a `sujetoId`). **CERO consumidores hoy,
  //    a propósito: está en reserva, no en uso.**
  | 'correo'
  // ── S84-B4/B5: CONTACTO — FIRMADO (founder, S84-B5: el GLOBO).
  //    Nace porque la sección "Cómo te contactan" del perfil quedó SIN
  //    glifo mientras sus hermanas tienen el suyo — y las dos salidas
  //    baratas están cerradas por ley: prestar `compartir` es la
  //    sustitución genérica que la Ley 12 prohíbe, y quitarles el glifo
  //    a las hermanas cumple la simetría rompiendo la misma ley (los
  //    headers que significan cosas distintas tienen que separarse).
  //    EL CRITERIO DEL DIBUJO: la sección agrupa CUATRO canales
  //    (teléfono · WhatsApp · correo · sitio), así que el objeto no
  //    puede ser ninguno de los cuatro — un auricular nombra uno y deja
  //    tres afuera. El globo nombra el ACTO, no el canal.
  //
  //    ☠️ EL CANDIDATO B —`contactoOndas`, tres arcos saliendo de un
  //    punto— MURIÓ EN SU GATE, y se registra en vez de borrarse en
  //    silencio. Su porqué, que es la letra: **§1 manda dibujar el
  //    OBJETO del oficio, y el globo es un objeto mientras que "el
  //    alcance" es una idea.** Su riesgo medido lo acompañaba y quedó
  //    confirmado como acierto de haberlo declarado: a 21px compartía
  //    familia visual con `ayuda` (círculo con rayos). Nadie lo revive
  //    sin volver a pasar por §1.
  | 'contacto'
  // ── S84-B20: DOCUMENTO, en DOS CANDIDATOS (molde prime/primeCorona: el
  //    founder elige a 21px y el perdedor muere con su lápida).
  //    Nace porque la pantalla de documentos vive SIN ícono y los dos
  //    prestados fallan POR LEY: `carnet` es el de vacunas de la MASCOTA
  //    —su huella sobre una cédula diría que el documento es del animal—
  //    y `cuenta` lo usa la celda vecina (Ley 12 directa).
  //    EL OBJETO ES IDENTIFICACIÓN (cédula · RUC · NIT), no una carpeta
  //    ni un archivo genérico. GATE POR ÍCONO A 21px PENDIENTE (§2.9).
  //
  //    ⚠️ S91-B · SU DOBLE TURNO, MEDIDO — Y EL PRESTADO NO ES EL QUE SE
  //    CREÍA. Tras cablear el apilado, `documento` queda en DOS usos:
  //    `historia_clinica` y `ficha_identidad` (`apps/cliente/src/lib/
  //    papeles.ts`). La mesa preguntó si nace el glifo propio de
  //    `ficha_identidad` o su préstamo se declara permanente — y contra el
  //    objeto la pregunta está AL REVÉS:
  //      · **`ficha_identidad` NO es la prestataria: es la dueña.** El
  //        objeto declarado dos líneas arriba es «identificación, cédula
  //        CON RETRATO», y la ficha de identidad de una mascota es
  //        exactamente eso — lleva foto. El propio `papeles.ts` ya lo dice
  //        («el objeto EXACTO del registry»).
  //      · **La que presta es `historia_clinica`.** Una historia clínica
  //        NO es una cédula: no identifica, registra. Ahí el dibujo miente
  //        el objeto, que es lo que la Ley 12 persigue.
  //    ⇒ **El glifo que faltaría es el de la HISTORIA CLÍNICA**, y darle
  //    uno propio a `ficha_identidad` dejaría a la dueña con dibujo nuevo
  //    y a la prestataria con el que no le corresponde — el problema
  //    intacto y una pieza más en el registry.
  //
  //    ✅ RATIFICADO POR LA MESA (8-ago-2026), con su letra: «la
  //    prestataria es HISTORIA_CLINICA, no ficha_identidad — una historia
  //    clínica no identifica, REGISTRA; la ficha de identidad SÍ es
  //    identificación con retrato, es dueña legítima del dibujo». Y la
  //    decisión de NO dibujar quedó firmada como correcta: **dibujar para
  //    el objetivo equivocado es más caro que no dibujar** (§6b, la regla
  //    de economía: un glifo que nadie va a montar no se pide).
  //
  //    ☠️ DISPARO DEL GLIFO DE HISTORIA CLÍNICA — firmado, y con sus dos
  //    exclusiones explícitas para que nadie lo adelante por entusiasmo:
  //    **el próximo arco que toque LOS PAPELES o EL REGISTRY DE GLIFOS.**
  //    NO S91 (nada nuevo se abre) · NO S92 (loop de seguridad, sin
  //    features). Cuando llegue: DOS candidatos con hoja de contacto a
  //    21px, misma disciplina que «Documentos» —riesgo declarado por
  //    variante, rasterizados y MIRADOS antes de dejarlos— y el gate por
  //    ícono del founder decide.
  //    ☠️ MUERTE: el día que `historia_clinica` deje de pintar el dibujo
  //    de una cédula. Hasta entonces el préstamo VIVE y está declarado —
  //    que es distinto de estar escondido: `ficha_identidad` NO se toca.
  | 'documento'
  // ── S84-B21: FISCAL y BANCARIO — las otras dos secciones de "Datos
  //    comerciales". Nacen JUNTAS y con `documento` porque el founder
  //    decidió que llevan glifo las TRES o ninguna: ponérselo a una sola
  //    la jerarquiza sin que nadie lo haya decidido.
  //    CENSO PREVIO (la orden lo pidió y encontró algo): `liquidaciones`
  //    NO EXISTE · `cuenta` es una PERSONA · `presupuesto` es documento
  //    con esquina doblada · y **`pagos` es un BILLETE** — un rectángulo
  //    ancho, o sea el idioma que estos dos tenían que esquivar.
  //    GATE POR ÍCONO A 21px PENDIENTE (§2.9).
  | 'fiscal' | 'bancario'
  // S85-B23 — los tres del gate de la barra: `datos` NACE (gráfica) ·
  //   `negocio` y `cuenta` cambian de DIBUJO sin cambiar de nombre.
  | 'datos'
  // S85-B18 — LA VENTANA TEMPORAL: `semana` y `mes`. Solo DOS porque el
  //   censo encontró la otra mitad resuelta: `hoy` ya es el calendario y
  //   `todos` ya se dice con la Huella (hilera hermana del Hogar).
  //   GATE A 21px: se separan CONTANDO barras, y contar a 21px es lo que
  //   puede fallar.
  | 'semana' | 'mes'
  // S88 — LA CAMPANA (lámina firmada 5-ago). Glifo de OBJETO en trazo:
  // su huella NO vive adentro — vive en el Badge cuando hay avisos (la
  // ley del único relleno aplicada AL PAR: campana en trazo + huella
  // rellena en la esquina). NO es «glifo de control»: §6bis sigue
  // pendiente y esta entrada no la funda ni la toca.
  | 'campana'
  /* ══ S116-B · LOTE 2 · LA TANDA DE GLIFOS DEL MOCK — LOS DOCE DE CONTROL
   *  El §② del lote 0 cruzó los 52 del mock contra los 72 del registry y
   *  midió **15 que no existen** (el parte decía 17; el conteo del objeto
   *  dice 15 ❌ + 19 con otro nombre + 1 ambiguo — ver la corrección en el
   *  parte del lote 2). Éstos son los que caen del lado de CONTROL.
   *
   *  🔴 **LOS DOCE VAN SIN HUELLA Y NO ES UNA OMISIÓN: es `N27` + la Ley 9
   *  en su alcance S98** — *«en un glifo de control no hay mascota, hay
   *  interfaz»*. Ninguno nombra un mundo: los doce ejecutan un acto.
   *  ⚠️ **GATE POR ÍCONO A 21 px PENDIENTE (§2.9)** — en este entorno no
   *  hay rasterizador de SVG; la hoja de contacto va adjunta al parte y la
   *  mira el founder en una sola pasada.
   *
   *  ── EL CENSO DE METÁFORAS (§6b paso 2), corrido ANTES de dibujar ────
   *  Se abrieron los 72 dibujantes, no los 72 nombres. Lo que encontró y
   *  cambió una decisión cada vez:
   *   · **`veterinaria` es un ESTETOSCOPIO, no una cruz** ⇒ la cruz queda
   *     libre para `urgencias` (tanda 2), y `agregar` puede ser el `+` sin
   *     chocar contra ella.
   *   · **`ayuda` es círculo + 4 rayos RECTOS y `info` es círculo + ⓘ** ⇒
   *     `hora` entra como TERCER círculo del set. Riesgo declarado abajo.
   *   · **`foto` ya es la cámara** ⇒ `voltear` NO la vuelve a dibujar.
   *   · **`copiar` y `documentos` ya son dos hojas apiladas** ⇒ `galeria`
   *     NO puede ser dos rectángulos apilados. Es UNO, con contenido.
   *   · **`papelera` es un TACHO** y su uso declarado era el `−` del
   *     stepper: eso es lo que nace acá como `quitar`. El tacho se queda
   *     donde siempre debió estar — Eliminar (ver su entrada, redibujo 2).
   *   · **`candado` NO lleva ojo de cerradura a propósito** (se llena a
   *     21 px) y su significado declarado es *«esta conversación quedó en
   *     lectura»* ⇒ `contrasena` no puede ser otro candado: es la LLAVE. */
  | 'agregar' | 'quitar' | 'favorito' | 'calificacion' | 'hora'
  | 'microfono' | 'colgar' | 'galeria' | 'voltear' | 'salir' | 'mas'
  | 'contrasena'
  /* ══ S116-B · LOTE 2 · LOS SEIS DE CAPA DEL MOCK ═══════════════════
   *  La otra mitad de los 15 que el §② midió como inexistentes. Éstos SÍ
   *  nombran un mundo ⇒ **llevan huella**, y dónde la llevan es parte del
   *  dibujo: adentro cuando el objeto la puede contener (el matraz, el
   *  chip, el bol, el triángulo) y **externa en la esquina** cuando el
   *  objeto ya trae tres elementos y la huella adentro lo llenaría — el
   *  molde que `vacuna`, `carnet`, `papel` y `receta` ya usan.
   *  ⚠️ **GATE POR ÍCONO A 21 px PENDIENTE (§2.9)** en los seis. */
  | 'urgencias' | 'laboratorio' | 'alimento' | 'alergia' | 'microchip'
  /* 🔴 **`medicamento` NO ES UN DIBUJO NUEVO: es el dibujo que hoy se
   *  llama `receta`.** El §② lo midió: *«el dibujo es una CÁPSULA partida
   *  en diagonal — el ícono universal de medicamento. Se llama receta»*.
   *  El mock pide los DOS (#20 Medicamento y #22 Receta) y son dos cosas:
   *  una se toma, la otra se firma. ⇒ la cápsula se muda acá con su
   *  geometría intacta y `receta` se redibuja como lo que es. *No se
   *  inventó un segundo dibujo: se le puso su nombre al que había.* */
  | 'medicamento'
/* ── EL CUARTO REGISTRO: `'glifo'` (S116-B, firma de la mesa) ──────────
 * *«El color de glifo de fila, de campo, de acceso y de paso numerado
 * pasa de magenta a ciruela… El magenta queda solo en lo accionable.»*
 *
 * 🔴 **Entra como REGISTRO y no como un color que pasa cada pantalla, y
 * la razón es la que la casa ya paga en otros lados:** el registro es el
 * único lugar donde esta casa decide de qué color sale un glifo. Si el
 * par viajara como `tinta={theme.accent.glifo}` habría que escribirlo en
 * cada consumidor — y el día que la mesa lo mueva otra vez, la lista de
 * quién lo escribió no existe en ninguna parte.
 *
 * ⚠️ **Y lo que MIDE esta entrada, que es lo que la justifica:** hoy
 * ningún glifo de la casa es magenta — los de la costura salen `'tinta'`
 * y los de fila heredan `text.primary`. *El comentario de
 * `FilaAccionesCostura` decía «glifo magenta» y su galería los montaba en
 * tinta: es la cuarta vez en esta sesión que un comentario afirma lo que
 * el código no hace.* Así que el cambio real no es «magenta → ciruela»:
 * es que el glifo **deja de heredar la tinta del texto y pasa a tener
 * color propio**, que es lo que permite que un día cambie sin arrastrar
 * a todo lo que está escrito en tinta. */
export type IconoRegistro = 'capa' | 'aa' | 'tinta' | 'glifo'

/* ══════════════════════════════════════════════════════════════════════
 *  S116-B · LOS NOMBRES DEL MOCK QUE LA CASA YA DIBUJA
 *
 *  El §② del lote 0 cruzó los 52 nombres del mock contra los 72 del
 *  registry y midió **21 que existen con OTRO nombre**. De esos 21:
 *   · **3 son `Chevron`** (Volver · Avanzar · Flecha) — NO entran acá: es
 *     otra pieza (`components/chevron.tsx`), geometría compartida con su
 *     propia tabla de direcciones, no una entrada del registry.
 *   · **1 es `Huella`** (Mascota) — tampoco: es la primitiva de `brand/`
 *     que todos los demás montan ADENTRO. Un alias que devuelva la huella
 *     sola sería un dibujo nuevo disfrazado de alias.
 *   · **3 ganaron glifo propio en esta misma tanda** (`quitar`,
 *     `contrasena`, `medicamento`) porque su dibujo decía otra cosa.
 *   · **14 quedan acá.**
 *
 *  🔴 **ESTO CHOCA CONTRA LETRA ESCRITA EN ESTE ARCHIVO Y SE DECLARA EN
 *  VEZ DE SALTEARLO.** La lápida del rename `coach` → `ia` (S84-B11) dice:
 *  *«NO SE HIZO ALIAS Y ES LA DECISIÓN: dos nombres para un dibujo es no
 *  decidir cuál es el correcto, y deja al siguiente eligiendo»*.
 *
 *  **Por qué esto no es ese caso, y la diferencia es medible, no de
 *  gusto:** en `coach`/`ia` los dos nombres nombraban CONCEPTOS DISTINTOS
 *  — uno una pantalla, otro la marca de la IA — y quedarse con los dos era
 *  efectivamente no decidir. Acá los pares nombran **la misma cosa por su
 *  forma y por su función**: `lupa` es el objeto, «Buscar» es el acto que
 *  ese objeto hace; `campana` y «Notificación»; `foto` y «Cámara».
 *  *Ningún par de éstos puede llevar a alguien a montar el glifo
 *  equivocado, que es el daño que aquella lápida evitaba.*
 *
 *  Y la forma es la que sostiene la diferencia: **`ALIAS` NO es un
 *  dibujante.** El registry sigue teniendo UNA entrada por dibujo — el
 *  canónico —, y esto es una tabla de traducción que se resuelve antes de
 *  dibujar. No hay dos funciones que puedan divergir; hay un nombre que
 *  apunta a otro. *Lo que la lápida prohíbe es duplicar el dibujo; esto no
 *  lo duplica.*
 *
 *  ⚠️ **El canónico sigue siendo el canónico**: piezas nuevas montan el
 *  nombre de la casa. Los alias existen para que C pueda consumir los 52
 *  nombres del mock sin traducir a mano en cada pantalla — y para que
 *  cuando traduzca mal, el compilador lo frene.
 * ══════════════════════════════════════════════════════════════════════ */
const ALIAS = {
  /** #4 — el objeto es la lupa; «buscar» es lo que hace. */
  buscar: 'lupa',
  /** #8 — el mock pluraliza; la casa ya distinguió `pedido` de `despensa`
   *  y de `carrito` en su propia entrada (S100c-B). */
  pedidos: 'pedido',
  /** #11 — la campana. Su huella vive en el Badge, no adentro (S88). */
  notificacion: 'campana',
  /** #14 — de los dos que el §② encontró (`checkEnCirculo` · `nodoEntregado`)
   *  el alias apunta al primero: el segundo es una ETAPA de la escalera de
   *  seguimiento y prestarlo mezclaría «se confirmó» con «se entregó» —
   *  exactamente la vecindad que la entrada de `candado` midió y evitó. */
  confirmar: 'checkEnCirculo',
  /** #23 — el papel con la huella como SELLO. NO apunta a `checkEnCirculo`:
   *  un check dice «hecho» y verificado dice «alguien lo acreditó», que es
   *  literalmente el criterio con el que `certificaciones` ganó su gate. */
  verificado: 'certificaciones',
  /** #10 — ☠️ y acá el alias es el NOMBRE QUE MURIÓ AL REVÉS: `ia` se llamó
   *  `coach` y el rename fue para sacarle el nombre de una pantalla. El
   *  mock lo llama «Asistente», que es el acto y no la pantalla ⇒ no
   *  reintroduce el equívoco que aquel rename cerró. */
  asistente: 'ia',
  /** #28 */
  estetica: 'grooming',
  /** #32 — de los dos que el §② encontró (`bitacora` · `pluma`) apunta a la
   *  libreta: `pluma` es una ETAPA de la escalera de adopción (firmar), no
   *  el objeto donde se anota. */
  nota: 'bitacora',
  /** #33 — `hoy` ES el calendario (marco + anillas + travesaño + huella).
   *  El nombre de la casa dice el recorte temporal; el del mock dice el
   *  objeto. Conviven `semana` y `mes`, que se separan contando barras. */
  agenda: 'hoy',
  /** #37 — el tacho. Y éste es el uso PARA EL QUE el dibujo siempre fue
   *  correcto: ver la enmienda de `papelera` arriba. */
  eliminar: 'papelera',
  /** #38 — de los dos que el §② encontró (`pagos` · `bancario`) apunta al
   *  billete: `bancario` es el frontón del banco, o sea la institución, no
   *  el medio. */
  medioDePago: 'pagos',
  /** #41 — de los dos que el §② encontró (`burbujas` · `contacto`) apunta a
   *  las DOS burbujas encaradas: `contacto` es UNA burbuja con huella y su
   *  objeto declarado es el ACTO de contactar por cualquiera de los cuatro
   *  canales, no la conversación. */
  chat: 'burbujas',
  /** #44 — el mismo dibujo que #9 Cuenta; el mock los nombra distinto
   *  según dónde los monta. */
  perfil: 'cuenta',
  /** #46 — la cámara. Control, sin huella. */
  camara: 'foto',
} as const satisfies Record<string, IconoNombre>

/** Los nombres del mock que resuelven a un dibujo de la casa. */
export type IconoAlias = keyof typeof ALIAS

/** Lo que una pantalla puede montar: el nombre de la casa **o** el del
 *  mock. Piezas nuevas usan el canónico; el alias existe para que el
 *  consumo del mock no se traduzca a mano en cada pantalla. */
export type NombreDeIcono = IconoNombre | IconoAlias

const esAlias = (n: NombreDeIcono): n is IconoAlias => n in ALIAS

/** Resuelve un nombre del mock a su canónico. Idempotente sobre los
 *  canónicos, que es lo que permite llamarlo sin preguntar. */
export const canonico = (n: NombreDeIcono): IconoNombre =>
  esAlias(n) ? ALIAS[n] : n

/* 🔴 **1.8 DESDE S116-B lote 2b — firma de la mesa: «un solo trazo de 1,8
 * para todo el set».** Venía en 1.9 desde S53 (`DIRECCION_ARTE` §1).
 * **Se aplica a TODO el registry, las dos casas**, y eso es deliberado: un
 * trazo por casa haría que el mismo glifo tenga dos pesos según dónde se
 * monte, que es lo contrario de lo que la orden pide. *0,1 px no cambia
 * ninguna lectura a 21 px; lo que cambia es que deja de haber dos números
 * para el grosor de la casa.* */
const TRAZO = 1.8

type Pincel = { tinta: string; huella: string }

/* ═══ S86-B · LOS DOS EJES QUE FALTABAN — D-546 y D-645 ══════════════
 *
 * EL HUECO, declarado desde S78 en la propia skill: *"`iconos-tabs.tsx`
 * + `iconos-oficio.tsx` copian geometría del registry porque el contrato
 * no expone trazo y huella por separado (D-546) — hasta que esa prop
 * exista, todo glifo nuevo del prestador nace con este riesgo."* Tres
 * archivos vivían de copiar este dibujo, y su costo se midió: **los tres
 * glifos de la barra del CLIENTE divergieron los tres** (la casa, la
 * brújula y la chapita) mientras el registry evolucionaba sin ellos.
 *
 * ⚠️ Y ES EL DATO QUE ORDENA LA CURA: los siete del prestador estaban
 * BYTE-IDÉNTICOS. No porque el clon funcione — porque C los volvió a
 * copiar A MANO en S85, y su propia cabecera lo dice ("la tercera vez que
 * el clon cobra en una sola sesión"). **Un clon no falla por existir:
 * falla por envejecer, y solo no envejece mientras alguien lo esté
 * mirando.** El cliente no tuvo quien lo mirara.
 *
 * ── EJE 1 · EL COLOR DE LA HUELLA, INDEPENDIENTE DEL TRAZO ──────────
 * `tinta` ya existía (override del trazo). Lo que no existía era su
 * gemelo: los tres registros resuelven la huella ADENTRO y ninguno
 * produce "trazo en tinta + huella en el teal del oficio", que es la
 * composición firmada en el gate S78 y la razón literal por la que
 * `iconos-oficio` nació local. Nace `huella`, simétrica de `tinta`.
 *
 * ── EJE 2 · EL ESTADO DE LA HUELLA, DECLARADO POR EL REGISTRY ───────
 * La ley 6 de DIRECCION_ARTE (v1.5, firmada): ***la huella que es
 * ESTRUCTURA se RECOLOREA; la que es MARCA APARECE. Nunca las dos.***
 *
 * **DÓNDE SE CONTESTA ESA PREGUNTA ES LA DECISIÓN DE DISEÑO DE ESTA
 * ENMIENDA, y se declara porque diverge de cómo se pidió.** La orden
 * pedía TRES ESTADOS EN LA PROP (`'presente' | 'aparece' | 'recolorea'`),
 * con el argumento correcto de que un boolean aplana la distinción. El
 * argumento se respeta entero; lo que cambia es quién lo responde:
 *
 *   · Con el modo EN LA PROP, la pantalla elige — y puede elegir mal.
 *     `modoHuella="aparece"` sobre `negocio` (que ES una huella y nada
 *     más) **borra el glifo entero en reposo**: compila, no rompe nada,
 *     y la tab queda vacía. Es el modo de falla que esta casa nombró
 *     como el más caro (L-192: falla que produce una salida creíble).
 *   · Con el modo EN EL REGISTRY, la pregunta se contesta UNA VEZ, al
 *     lado del dibujo — que es literalmente lo que la ley 6 manda
 *     ("se contesta ANTES de dibujar") — y **ninguna pantalla puede
 *     romperla**. Precedente exacto de la casa: `FilaCita` con su canto
 *     de capa ("CERO API de color/posición/alfa: ninguna pantalla puede
 *     romper la ley").
 *
 * **LOS TRES ESTADOS SIGUEN SIENDO TRES y siguen siendo distinguibles
 * por tipo** — no se aplanó nada: `activa` sin definir = PRESENTE (todo
 * el producto fuera de una barra) · `activa` definida + huella de MARCA
 * = APARECE · `activa` definida + huella de ESTRUCTURA = RECOLOREA. El
 * boolean que la orden vetaba era el que decidía el COMPORTAMIENTO; éste
 * solo transporta el ESTADO, y el comportamiento lo dicta el registry.
 *
 * ⇒ Es un desvío de la letra de la orden, a favor de su argumento. Lo
 *   adjudica la mesa: revertir a `modoHuella` es mecánico (una prop, un
 *   switch) y esta nota dice contra qué se cambió. */

/** Glifos cuya huella ES EL DIBUJO — si no se pinta, no queda glifo.
 *  Se recolorean al activarse (ley 6); jamás desaparecen en reposo.
 *  Medido uno por uno contra su dibujante, no supuesto:
 *   · `negocio` — la pata sola, sin objeto que la sostenga (S85-B28: su
 *     regresión fue exactamente ésta, la huella tratada como marca).
 *   · `datos`   — la huella es LA BARRA MÁS ALTA de la gráfica; sin ella
 *     la gráfica pierde su barra y el dibujo dice otra cosa (S85-B23).
 *   · `ia`      — las tres chispas se pintan con el color de huella y no
 *     hay trazo debajo: es el único glifo del set sin objeto (§5.1).
 *  `familia` NO entra y es el borde que prueba la regla: tiene DOS
 *  huellas, pero la grande va en TINTA (hace de objeto) y solo la chica
 *  porta la capa — el glifo sobrevive sin ella, así que su huella es
 *  marca. */
const HUELLA_ES_ESTRUCTURA: ReadonlySet<IconoNombre> = new Set([
  'negocio',
  'datos',
  'ia',
])

const trazo = (color: string) => ({
  stroke: color,
  strokeWidth: TRAZO,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
})

// Chispa cóncava de 4 puntas — path canónico minado del SVG de Kaxo
// (entrega/exportables/kaxo-destello.svg, S53) y RE-TOKENIZADO:
// jamás el mostaza; acá vive en magenta puro vía theme (§5.1).
const CHISPA =
  'M12 .5c.6 5.4 5.6 10.4 11.5 11.5C17.6 13.1 12.6 18.1 12 23.5 11.4 18.1 6.4 13.1.5 12 6.4 10.9 11.4 5.9 12 .5Z'

// ── El registry del set b′ ───────────────────────────────────────────
const DIBUJANTES: Record<IconoNombre, (p: Pincel) => React.JSX.Element> = {
  // La correa cae hasta la huella — la mascota tirando (capa cuidado).
  paseo: ({ tinta, huella }) => (
    <>
      <Circle cx={17} cy={5.4} r={2.5} {...trazo(tinta)} />
      <Path d="M16.7 7.8c1.1 3.4-2.7 4.6-5.8 5.4" {...trazo(tinta)} />
      <Huella color={huella} x={1.6} y={12.2} escala={0.47} />
    </>
  ),

  // El estetoscopio ESCUCHA a la huella (salud → verde vital).
  veterinaria: ({ tinta, huella }) => (
    <>
      <Path d="M7.2 3v3.5a4.8 4.8 0 0 0 9.6 0V3" {...trazo(tinta)} />
      <Path d="M12 11.3v2.1c0 2.8-1 4.8-3.1 4.8" {...trazo(tinta)} />
      <Circle cx={6.6} cy={18.2} r={2.3} {...trazo(tinta)} />
      <Huella color={huella} x={12.6} y={12.4} escala={0.46} />
    </>
  ),

  // Las tijeras trabajan; la huella espera al costado (cuidado → ocre).
  grooming: ({ tinta, huella }) => (
    <>
      <Path d="M11.8 4.6 6.4 14.2" {...trazo(tinta)} />
      <Path d="M6.8 4.6l5.4 9.6" {...trazo(tinta)} />
      <Circle cx={5.2} cy={16.6} r={2.4} {...trazo(tinta)} />
      <Circle cx={13.4} cy={16.6} r={2.4} {...trazo(tinta)} />
      <Huella color={huella} x={13.8} y={9.2} escala={0.42} />
    </>
  ),

  // La huella vive dentro del corazón (afecto → magenta).
  refugio: ({ tinta, huella }) => (
    <>
      <Path
        d="M12 20.6C7 16.6 3.4 13 3.4 9.1c0-2.9 2.3-5 4.9-5 1.5 0 2.9.7 3.7 1.9.8-1.2 2.2-1.9 3.7-1.9 2.6 0 4.9 2.1 4.9 5 0 3.9-3.6 7.5-8.6 11.5Z"
        {...trazo(tinta)}
      />
      <Huella color={huella} x={7} y={6.6} escala={0.42} />
    </>
  ),

  // La bolsa lleva su huella — lo de adentro es para ellos (consumo → ocre).
  despensa: ({ tinta, huella }) => (
    <>
      <Path
        d="M5.8 8.2h12.4v11.4a1.9 1.9 0 0 1-1.9 1.9H7.7a1.9 1.9 0 0 1-1.9-1.9V8.2Z"
        {...trazo(tinta)}
      />
      <Path d="M9 8.2V6.3a3 3 0 0 1 6 0v1.9" {...trazo(tinta)} />
      <Huella color={huella} x={7.2} y={10} escala={0.4} />
    </>
  ),

  // El destello — trío de chispas de Kaxo, re-tokenizado a magenta
  // (§5.1). Sin huella: el destello ES la marca de la IA, y por eso este
  // glifo NO obedece la ley de §1 (objeto en trazo + huella): las chispas
  // van RELLENAS y sin huella. Es excepción FIRMADA en S53, no descuido —
  // y es la razón por la que en S84-B10 NO nació un segundo glifo de
  // destellos: habrían sido dos marcas de IA con dos anatomías.
  ia: ({ huella }) => (
    <>
      <G transform="translate(2.16 6.84) scale(0.57)">
        <Path d={CHISPA} fill={huella} />
      </G>
      <G transform="translate(13.8 2.16) scale(0.3)">
        <Path d={CHISPA} fill={huella} />
      </G>
      <G transform="translate(16.5 14.4) scale(0.204)">
        <Path d={CHISPA} fill={huella} />
      </G>
    </>
  ),

  // ══ LOTE 3 (S58, D-361) — cada firma del founder poda o suma ══
  // La casa que abriga — la huella vive adentro (tab Hogar, comunidad).
  hogar: ({ tinta, huella }) => (
    <>
      <Path d="M4.2 11.3 12 4.6l7.8 6.7V19a1.4 1.4 0 0 1-1.4 1.4H5.6A1.4 1.4 0 0 1 4.2 19Z" {...trazo(tinta)} />
      <Huella color={huella} x={8} y={10.6} escala={0.42} />
    </>
  ),
  // La brújula señala; la huella es el sur que importa (tab Explorar).
  explorar: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={12} r={8.4} {...trazo(tinta)} />
      <Path d="M15.2 8.8 13 13l-4.2 2.2L11 11Z" {...trazo(tinta)} />
      <Huella color={huella} x={9.2} y={12.6} escala={0.3} />
    </>
  ),
  /* S85-B23 · DATOS — «un símbolo con una gráfica» (founder, gate de
     019fcabf: «hoy es paw y no dice lo que la pantalla es»).
     CENSO: el idioma GRÁFICA estaba LIBRE — cero glifos de barras o
     curva en el registry (`pagos` es un billete, `presupuesto` un
     documento, `BarrasSemana` es componente y no glifo).
     LA HUELLA ES LA BARRA MÁS ALTA, y no un adorno al costado: la
     pantalla responde «a quiénes cuido», así que lo que la gráfica mide
     ES la mascota. Cumple la regla madre sin agregarle un objeto más. */
  datos: ({ tinta, huella }) => (
    <>
      <Path d="M4.4 20.2h15.2" {...trazo(tinta)} />
      <Path d="M7.6 20.2v-5.4M12 20.2v-8.6" {...trazo(tinta)} />
      <Huella color={huella} x={14.4} y={5.2} escala={0.42} />
    </>
  ),

  /* ⏪ S85-B23 · LA CHAPITA DE COLLAR MURIÓ, ENTRA LA PERSONA. Literal
     del founder: «algo que realmente parezca cuenta» — el actual no se
     entiende, y midiendo se ve por qué: eran DOS CÍRCULOS APILADOS
     (cabeza + chapa), que a 21px no leen "collar" ni leen "persona": no
     leen nada. Y de paso eran BYTE-IDÉNTICOS a `prime`, o sea que el
     registry tenía dos nombres para un dibujo.

     ⚠️⚠️ ESTO ENMIENDA UNA FIRMA SUYA, Y SE DECLARA EN VEZ DE COLARSE:
     §2.4 (S53) dice, del propio founder, «humanos = manos u objetos», y
     el comentario que estaba acá decía literalmente «la figura humana
     del boceto S57 quedó PROHIBIDA §2.4». Hoy pide una persona. **Gana
     la firma más nueva** —es su producto y su ojo— pero la anterior NO
     se borra en silencio: dos letras firmadas que se contradicen son
     peores que una equivocada, porque cualquiera cita la que le conviene
     y queda "en regla". Que la mesa enmiende §2.4 o acote su alcance
     (p. ej. "humanos como ILUSTRACIÓN, no como glifo de identidad").
     Hasta entonces, esta nota es el puente entre las dos.

     LA FORMA: cabeza + HOMBROS (arco), que es el avatar universal — no
     dos círculos. Y la huella va al costado, chica: la cuenta es de una
     PERSONA, pero la persona está acá por su mascota. */
  cuenta: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={8.2} r={3.4} {...trazo(tinta)} />
      <Path d="M5.2 20.4a6.8 6.8 0 0 1 13.6 0" {...trazo(tinta)} />
      <Huella color={huella} x={16.4} y={3.2} escala={0.3} />
    </>
  ),
  // El sol del oficio — el día de trabajo con la mascota adentro.
  // ⏪ S85-B12 · EL SOL MURIÓ, ENTRA LA AGENDA — cura firmada por el
  //    founder EN DISPOSITIVO: «`preferencias` y `hoy` se confunden en la
  //    barra de tabs… el hoy lo podés dejar con un icono de agenda».
  //
  //    EL DEFECTO, medido antes de que él lo reportara y confirmado por
  //    él después: los dos eran EL MISMO IDIOMA — círculo r≈4.5 con rayos
  //    radiales (`preferencias` 8 rayos = engranaje · `hoy` 8 rayos =
  //    sol). A 21px la única diferencia era la cuenta de rayos, y viven
  //    UNO AL LADO DEL OTRO en la barra de tabs del prestador: la unidad
  //    de barrido donde la Ley 12 exige que el ojo separe. Es el caso más
  //    caro de esa ley porque el usuario los ve juntos todos los días.
  //
  //    NO NACE UN NOMBRE NUEVO, y es la decisión: `hoy` sigue siendo
  //    `hoy`. Lo que cambió es su DIBUJO, no lo que nombra — un alias o
  //    un `hoyAgenda` habría dejado dos nombres para una sola cosa, que
  //    es no decidir cuál es el correcto (el argumento que mató al alias
  //    de `coach`→`ia`). Cero consumidores tocados.
  //
  //    EL CENSO, porque un calendario es un RECTÁNGULO y ese idioma está
  //    ocupado CINCO VECES (`presupuesto` · `bitacora` · `caso` · `pagos`
  //    · `documento`): lo que lo saca del idioma son LAS DOS ANILLAS de
  //    arriba. Es el mismo movimiento que salvó a `documento` (el
  //    retrato) y a `bancario` (las columnas) — no se busca otro objeto,
  //    se busca el rasgo que lo saca del idioma. Sin anillas sería la
  //    sexta hoja rectangular; con anillas no se parece a ninguna.
  //
  //    Y LA HUELLA ENTRA COMO EL DÍA MARCADO, que es lo que hace que el
  //    glifo cumpla la regla madre sin decorarse: en una agenda el día
  //    marcado es EL que importa, y acá el que importa es la mascota.
  /* LA PUERTA ABIERTA — el destino central del prestador (S97+, pedido
     de C, adjudicación de mesa 13-ago). Nombra **atender a quien llegó
     por la puerta, sin turno**: el mostrador.

     POR QUÉ LA PUERTA Y NO LA CAMPANA DE MOSTRADOR, que era el objeto
     obvio: `campana` ya existe (avisos, S88) y **no se disputa** — un
     glifo con dos significados es informar sin informar. Y la mesa
     inclinó por la puerta con un argumento mejor que la legibilidad:
     **el concepto ya vive en la letra de la casa** («la puerta cambia
     permisos» · «quien está en la puerta» · «en la puerta · Thor ·
     Llegó»). El glifo no inventa vocabulario: materializa el que ya se
     habla.

     DÓNDE ESTÁ LA MASCOTA (regla madre §1): **entrando por el vano**. La
     hoja abierta deja el hueco a la derecha y la huella lo ocupa — no
     está al costado como adorno, está en el lugar por el que se entra.

     ⚠️ SU GATE ES A 21px Y NO ESTÁ DADO (Ley 9: a ese tamaño la huella
     sobrevive o es ruido). El riesgo declarado de esta forma: la
     diagonal de la hoja y la jamba izquierda pueden fundirse en una sola
     mancha vertical. Si el founder lo ve así, el recambio ya está
     elegido y es de forma, no de concepto: **el vano SIN hoja** (solo el
     marco y la huella entrando), que pierde el gesto de «abierta» pero
     gana aire. La puerta se conserva en los dos casos. */
  atender: ({ tinta, huella }) => (
    <>
      {/* el marco: jambas + dintel, abierto abajo */}
      <Path d="M5 21V5a1.6 1.6 0 0 1 1.6-1.6h10.8A1.6 1.6 0 0 1 19 5v16" {...trazo(tinta)} />
      {/* el umbral — el piso que hace leer «puerta» y no «ventana» */}
      <Path d="M3.2 21h17.6" {...trazo(tinta)} />
      {/* la hoja abierta hacia adentro: la diagonal ES el «abierta» */}
      <Path d="M5 21V7.8l6.4-2.1v15.3" {...trazo(tinta)} />
      {/* la mascota entrando por el vano que la hoja dejó libre */}
      <Huella color={huella} x={13.2} y={13.4} escala={0.42} />
    </>
  ),
  hoy: ({ tinta, huella }) => (
    <>
      <Path d="M6 6.4h12a1.6 1.6 0 0 1 1.6 1.6v11.4a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V8A1.6 1.6 0 0 1 6 6.4Z" {...trazo(tinta)} />
      <Path d="M4.4 10.8h15.2" {...trazo(tinta)} />
      <Path d="M8.6 3.4v4M15.4 3.4v4" {...trazo(tinta)} />
      <Huella color={huella} x={8.4} y={12.4} escala={0.36} />
    </>
  ),
  // El maletín del oficio lleva su huella (tab Negocio).
  /* ⏪ S85-B23 · EL MALETÍN MURIÓ, ENTRA LA PATA. Literal del founder:
     «**el negocio son mascotas**». Un maletín es el objeto de una oficina
     y este negocio no lo es.
     ⚠️ EL FRENO QUE CORRÍ ANTES DE DIBUJAR, porque en aislado esto era
     FATAL: la tab «Datos» ES `mascotas` y su glifo ERA la pata — dos
     tabs vecinas con el mismo dibujo es la Ley 12 en su peor forma. Se
     disuelve porque la misma orden MUEVE la pata: Datos gana la gráfica
     y la suelta. En aislado hubiera sido colisión; junto es una mudanza.
     ⚠️ Y LA SEGUNDA MITAD, para quien monte el wrapper de la tab: la
     barra marca el tab activo CON UNA HUELLA. Un glifo que YA es huella
     no puede recibir otra encima —sería huella entre huellas, R22— así
     que **la pata se RECOLOREA al activarse** en vez de acumular. La
     receta ya existe y es la de `IconoMascotas`. */
  negocio: ({ huella }) => (
    <>
      {/* 🔴 S85-B28 · LA HUELLA COMO SUJETO, y acá está la regresión que
          esto cura: al sacar el maletín dejé la huella en su posición de
          MARCA (x 8.7, escala 0.4) — que era su lugar ADENTRO del objeto,
          chica y al costado. Sola, en una caja de 24, se lee como nada: el
          founder reportó que «Tu espacio perdió el glifo». Y lo peor es
          que la receta correcta la escribí YO en el commit que lo rompió
          («la receta ya existe: es la de IconoMascotas») y no la apliqué
          al glifo del registry — solo la documenté para el wrapper. Una
          receta escrita y no aplicada es exactamente lo mismo que no
          tenerla. Ahora la huella es el ÍCONO: centrada y grande, los
          mismos números que `IconoMascotas`. */}
      <Huella color={huella} x={2} y={2} escala={0.84} />
    </>
  ),
  // La jeringa protege; la huella verde es la vida cuidada (carnet).
  /* A · CERTIFICACIONES — la hoja con la esquina doblada, y **la huella como
     SELLO**. Sin renglones.
     ⏪ **LOS RENGLONES SE FUERON, y los mató un censo de C que yo no había
     hecho:** su pedido avisaba *«si el papel que acredita ya tiene una forma
     acá, el tercero no la reinventa»*, y el registry lo dice más fuerte en la
     entrada de `fiscal`: **«el idioma "rectángulo con renglones" ya está
     ocupado CINCO veces en este registry»**. *Mi primer dibujo era el sexto.*

     ⇒ El diferenciador no puede ser el relleno del papel — tiene que ser
     estructural, como el **dentado** de `fiscal` o el **retrato** de
     `documento`. Acá es **el sello**, y el sello es la huella.
     🔴 **Y la cura arregló DOS cosas de una:** los renglones eran también mi
     propio riesgo declarado a 21px (*«pueden empastarse con el borde»*).
     *Sacarlos despeja la colisión y el tamaño chico al mismo tiempo.* */
  certificaciones: ({ tinta, huella }) => (
    <>
      <Path d="M5.4 2.8h9.4l4 4v14.4H5.4Z" {...trazo(tinta)} />
      <Path d="M14.6 2.9v4.1h4" {...trazo(tinta)} />
      <Huella color={huella} x={11.4} y={13.4} escala={0.46} />
    </>
  ),
  /* A · WEARABLE — el dispositivo: cuerpo redondeado + dos tramos de correa,
     y **la huella ADENTRO**. El aparato muestra a la mascota: eso dice
     «monitorea, y monitorea a ELLA» sin corazón y sin ondas.
     RIESGO DECLARADO: la silueta se parece a un reloj, y un reloj puede
     leerse como «hora». Lo desambigua la huella adentro — que es
     exactamente lo que un reloj no tiene. */
  wearables: ({ tinta, huella }) => (
    <>
      <Path d="M9 2.6h6l-.5 3.4M9 21.4h6l-.5-3.4M9.5 6h5" {...trazo(tinta)} />
      <Path d="M6.4 8.6a2 2 0 0 1 2-2h7.2a2 2 0 0 1 2 2v6.8a2 2 0 0 1-2 2H8.4a2 2 0 0 1-2-2Z" {...trazo(tinta)} />
      <Huella color={huella} x={9.6} y={9.4} escala={0.38} />
    </>
  ),
  carnet: ({ tinta, huella }) => (
    <>
      <Path d="M18.2 2.8l3 3M16.4 7.6l1.7-1.7" {...trazo(tinta)} />
      <Path d="M14 5.2l4.8 4.8-7.4 7.4H6.6v-4.8Z" {...trazo(tinta)} />
      <Huella color={huella} x={3.4} y={14.6} escala={0.36} />
    </>
  ),
  // Dos huellas, una chica — la familia camina junta. La grande es de
  // TINTA (hace de objeto); la chica porta la capa (UNA huella de capa).
  familia: ({ tinta, huella }) => (
    <>
      <Huella color={tinta} x={3.6} y={4.6} escala={0.58} />
      <Huella color={huella} x={14.2} y={12.6} escala={0.38} />
    </>
  ),
  // El engranaje con la huella en el centro — se ajusta para ellos.
  preferencias: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={12} r={4.4} {...trazo(tinta)} />
      <Path d="M12 3.4v2.4M12 18.2v2.4M3.4 12h2.4M18.2 12h2.4M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7" {...trazo(tinta)} />
      <Huella color={huella} x={9.4} y={9.6} escala={0.3} />
    </>
  ),
  // El billete con huella ocre — la plata del cuidado (pagos y
  // liquidaciones comparten dibujo).
  /* PAPELERA — G-08 (S100b-B). El `−` del stepper se vuelve papelera
     CUANDO LA CANTIDAD ES 1 **y solo en el carrito** (`[SPEC]` eBay: *«the
     delete action is only to be used when the numeric stepper is pair or
     associated with an item tile such as item list in cart»*). En la
     grilla el menos en 1 vuelve a «Agregar»: ahí el tile no desaparece.

     🔴 **SIN HUELLA, Y NO ES UN OLVIDO DE LA LEY 12: es la familia de
     CONTROL.** Medido en el registry antes de dibujarla — `lapiz`,
     `compartir` y `descargar` **no llevan huella ninguna**. ⇒ existe una
     familia exenta y la papelera pertenece a ella.
     *Y en este glifo la exención además salva el significado: una huella
     adentro de un tacho de basura diría algo que esta casa jamás querría
     decir.* La ley pedía la mascota presente en los glifos que nombran su
     mundo; un control de borrado no nombra su mundo. */
  papelera: ({ tinta }) => (
    <>
      {/* la tapa y su asa */}
      <Path d="M4.2 6.6h15.6M9.4 6.6V5.2a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.4" {...trazo(tinta)} />
      {/* el cuerpo */}
      <Path d="M6.2 6.6l.9 11.6a1.6 1.6 0 0 0 1.6 1.5h6.6a1.6 1.6 0 0 0 1.6-1.5l.9-11.6" {...trazo(tinta)} />
      {/* las dos estrías: dicen «tacho» a 21px, que es donde se gatea */}
      <Path d="M10.4 10.2v5.6M13.6 10.2v5.6" {...trazo(tinta)} />
    </>
  ),
  /* 🔴 CARRITO — G-14 (S100b-B). *«El carrito no tiene ícono en la barra:
     es un botón de texto donde la industria usa una canasta con su
     contador.»*

     POR QUÉ ES GLIFO NUEVO Y NO `despensa`, que era la salida barata:
     **`despensa` es LA SECCIÓN y el carrito es LO QUE LLEVÁS ADENTRO de
     ella.** Pueden —y van a— convivir en la misma pantalla: la tab dice
     dónde estás, el carrito dice cuánto llevás. *Con un alias, el mismo
     dibujo diría «acá se compra» y «esto es tuyo» al mismo tiempo, y en
     la barra de tabs quedarían dos bolsas idénticas con significados
     distintos* — el mismo argumento con el que `info` no fue alias de
     `ayuda` (S98).

     LA HUELLA VA ADENTRO DE LA CANASTA, y acá el lugar es el significado:
     **lo que se lleva en la canasta es para la mascota.** Ley 12 pedía la
     huella presente; este glifo es de los pocos donde además *dice algo*
     al estar donde está.

     ⚠️ **SIN GATE DE ÍCONO — §2.9 exige verlo a su tamaño de diseño Y a
     21 px, y ese gate es del founder.** Se declara pendiente en vez de
     darse por bueno. */
  /* ⏪ ENMENDADO S100c-B — N25 ①. LA CANASTA PASA A SER UN CARRITO.
     Firma del founder: *«no es un carrito, es una bolsa y se ve muy fea.
     Hay que poner un carrito, que es lo que siempre han utilizado todas
     las compañías.»*

     🔴 **LA CAUSA HAY QUE DEJARLA ESCRITA, PORQUE ES LA LECCIÓN Y NO EL
     ERROR:** el argumento de S100b para que este glifo NO fuera alias de
     `despensa` **sigue en pie y no se toca** (*la tab dice dónde estás, el
     carrito dice cuánto llevás*). Lo que falló no fue la distinción: **fue
     que la forma se eligió desde la palabra «canasta»** —que estaba en el
     texto del gate— **en vez de medirse contra el objeto.** Una canasta con
     asa de arco y cuerpo que se angosta **tiene exactamente la silueta de
     una bolsa**, y a 21 px la silueta es todo lo que queda.

     > *Es la ley de la barra de S99 en ropa nueva: **la referencia se MIDE,
     > no se describe.*** Allá cuatro traducciones en prosa mandaron a
     > construir un bulto que la referencia no tenía; acá una palabra mandó
     > a dibujar una bolsa.

     **EL DISCRIMINADOR SON LAS RUEDAS, y por eso es el correcto:** es el
     único rasgo que una bolsa y una canasta **no pueden tener**. Y
     sobrevive al gate de 21 px porque son **dos discos**, no un detalle de
     trazo (Ley 9: a 21 px la huella sobrevive o es ruido — lo mismo vale
     para cualquier rasgo).

     **La barra de empuje entra por la izquierda** —el otro rasgo que la
     industria repite (Laika, Amazon, Mercado Libre, Rappi)— y ancla la
     lectura: sin ella, un trapecio con ruedas puede leerse como changuito
     de supermercado o como zapato.

     **LA HUELLA SE QUEDA ADENTRO DE LA CESTA**, y su razón no cambió: *lo
     que se lleva es para la mascota.* Es de los pocos glifos donde el lugar
     de la huella además DICE algo.

     ⚠️ **SIN GATE DE ÍCONO — §2.9 exige verlo a su tamaño de diseño Y a
     21 px, y ese gate es del founder.** Y se declara algo más: **en este
     entorno no hay rasterizador de SVG** (ni `cairosvg`, ni `rsvg-convert`,
     ni Inkscape), así que **no se pudo verificar la legibilidad a 21 px sin
     pasar por RN-web o por un publish.** Se dice en vez de darse por bueno. */
  /* ⏪ ═══ ENMENDADO S100d-B — LA HUELLA SALE DE LA CESTA (punto 8 del gate).
     Firma del founder, verbatim: *«quedó arriba, muy pequeño y **con una
     huella ocre encima**. Hay que hacerlo mucho mejor.»*

     **Lo que sobrevive entero:** el carrito con ruedas y su barra de empuje
     (la enmienda de S100c) y la distinción `carrito` ≠ `despensa` (S100b).
     **Lo único que se va es la huella.**

     🔴 **Y LA RAZÓN NO ES «LO PIDIÓ EL FOUNDER» — es que este glifo cambió
     de familia y nadie lo había registrado.** Su propio tipo, veinte líneas
     más arriba, ya describía a `papelera` como *«familia de CONTROL: sin
     huella, como `lapiz`»*. **`carrito` es exactamente eso:** su único
     consumidor medido contra `origin/main` (`despensa/index.tsx:747`) es un
     `Pressable`, y a partir de hoy el otro es el carrito flotante. *No nombra
     una sección ni un servicio: es el botón que abre lo que llevás.*

     ⇒ **LA REGLA, y ya estaba viva sin escribirse: un glifo montado DENTRO
     de un control no lleva huella.** Ley 12 pide la mascota presente en los
     glifos que NOMBRAN algo; los verbos de la casa —`lapiz`, `papelera`,
     `compartir`, `descargar`— nunca la llevaron. *Lo que cambia hoy no es la
     ley: es que este glifo se había clasificado mal.*

     **Y la mitad medible, que es la que sobrevive a que alguien cambie de
     opinión:** la huella iba a `escala 0.38` DENTRO de la cesta —un interior
     de ~9 unidades de la grilla 24—, o sea **~7,9 px en el gate de 21 px**.
     **Ley 9 es literal: a 21 px la huella SOBREVIVE O ES RUIDO.** Acá era
     ruido, y encima ruido teñido: `carrito` hereda el ocre de `despensa`, así
     que sobre el disco ocre del flotante la huella habría desaparecido contra
     su propio fondo.

     ⚠️ **SIN GATE DE ÍCONO — §2.9 sigue exigiendo el ojo del founder a 21 px,
     y en este entorno NO hay rasterizador de SVG** (ni `cairosvg`, ni
     `rsvg-convert`, ni Inkscape). *Se declara en vez de darse por bueno.* */
  carrito: ({ tinta }) => (
    <>
      {/* la barra de empuje: entra por la izquierda y baja a la cesta */}
      <Path d="M2.4 4.2h2.3l1.2 4.4" {...trazo(tinta)} />
      {/* la cesta — trapecio abierto arriba, apoyado sobre el eje */}
      <Path
        d="M5.9 8.6h15.7l-1.6 6.6a1.7 1.7 0 0 1-1.6 1.3H9.1a1.7 1.7 0 0 1-1.7-1.3Z"
        {...trazo(tinta)}
      />
      {/* LAS RUEDAS — el rasgo que ninguna bolsa ni canasta puede tener */}
      <Circle cx={10.2} cy={20} r={1.5} {...trazo(tinta)} />
      <Circle cx={17.6} cy={20} r={1.5} {...trazo(tinta)} />
    </>
  ),
  /* 🔴 PEDIDO — S100c-B, pedido de la pista D con su defecto medido.

     **El caso:** la barra de cinco tabs entró en este bundle y **Pedidos
     quedó usando el glifo `despensa` PRESTADO** ⇒ **dos tabs vecinas con el
     MISMO dibujo.** *Dos tabs que se dibujan igual le piden al dueño que lea
     la etiqueta para saber dónde está, y la etiqueta mide 11 px.*

     **D no lo inventó y frenó bien:** un glifo se firma por gate (§2.9) y
     elegir la forma desde la palabra es la lección que S99 pagó con ocho
     gates. **Lo pidió con el caso, que es como se pide una pieza.**

     ── POR QUÉ UNA CAJA, Y NO OTRA COSA ────────────────────────────────
     La familia ya tiene los otros dos momentos de la compra y hay que
     distinguirse de ELLOS, no de una idea:
       · `despensa` = **la bolsa** — la SECCIÓN, donde se compra.
       · `carrito`  = **el carro con ruedas** — lo que llevás y todavía no
                      compraste.
       · `pedido`   = **la caja cerrada** — lo que YA compraste y viene en
                      camino.

     **El discriminador es LA TAPA**: una costura horizontal cruzando el
     cuerpo, que ni la bolsa ni el carro tienen. *Y sobrevive a 21 px porque
     es una LÍNEA RECTA de lado a lado — el rasgo más barato de leer que
     existe, al revés de un detalle de trazo* (Ley 9).

     **La huella va DENTRO de la caja**, y acá el lugar dice algo igual que
     en `carrito`: **lo que viene en la caja es para la mascota.**

     ⚠️ **SIN GATE DE ÍCONO — §2.9 pide verlo a 21 px y ese gate es del
     founder.** Y se declara el mismo límite que el `carrito` con ruedas:
     **en este entorno no hay rasterizador de SVG**, así que su legibilidad
     a 21 px **no se verificó**. Se dice en vez de darse por bueno. */
  pedido: ({ tinta, huella }) => (
    <>
      {/* el cuerpo de la caja */}
      <Path
        d="M4.2 8.6h15.6v9.3a1.6 1.6 0 0 1-1.6 1.5H5.8a1.6 1.6 0 0 1-1.6-1.5Z"
        {...trazo(tinta)}
      />
      {/* LA TAPA — el discriminador: una costura recta de lado a lado que
          ni la bolsa ni el carro tienen */}
      <Path d="M3.2 5.4h17.6v3.2H3.2Z" {...trazo(tinta)} />
      <Huella color={huella} x={9.9} y={11.6} escala={0.38} />
    </>
  ),
  pagos: ({ tinta, huella }) => (
    <>
      <Path d="M3.4 7.4h17.2a0 0 0 0 1 0 0v9.2a0 0 0 0 1 0 0H3.4a0 0 0 0 1 0 0V7.4a0 0 0 0 1 0 0Z" {...trazo(tinta)} />
      <Path d="M6.4 10.2v3.6M17.6 10.2v3.6" {...trazo(tinta)} />
      <Huella color={huella} x={8.9} y={9.2} escala={0.38} />
    </>
  ),
  // El salvavidas — ayuda que flota, con la huella a salvo adentro.
  /* ⓘ INFO — QUÉ SIGNIFICA ESTE CAMPO (S98, pedido de C con dos
     consumidores medidos).

     🔴 POR QUÉ ES UN GLIFO NUEVO Y NO UN ALIAS DE `ayuda`, que era la
     salida barata: `ayuda` es **el salvavidas** —círculo + cuatro rayos,
     con su huella al centro— y su propio comentario lo dice. **Un
     salvavidas dice CONTACTÁ SOPORTE; un ⓘ dice QUÉ SIGNIFICA ESTE
     CAMPO.** Son dos trabajos y **pueden convivir en una pantalla**: la
     ayuda del producto vive en Cuenta, la explicación de un campo vive
     pegada al campo. Resolverlo con un alias significaría que el día que
     estén juntas, el mismo dibujo pide auxilio y define una palabra —
     *un glifo con dos significados es informar sin informar* (el mismo
     criterio con el que la campana no se disputó para `atender`).

     LA PUERTA YA ESTABA ESCRITA Y SE DISPARÓ: el ⓘ vivía local en
     `hogar/mascota/[mascotaId]` con su propia condición —«candidato al
     registry por su puerta **si se repite**»— y C lo necesitó para la
     hora de corte en `ventas/configuracion`. **Copió la geometría MEDIDA
     en vez de dibujar una segunda**, así que no hay dos formas que
     reconciliar: el trazo de acá es el del precedente.

     ⚠️ SIN HUELLA, y el argumento es GEOMÉTRICO, no estético: en `ayuda`
     la huella va en `x 9.3 · y 9.5` —**el centro exacto**— y en el ⓘ ese
     centro lo ocupan la barra y el punto. Ponerla ahí es colisión
     literal, y a 18-21 px eso es ruido, no presencia (Ley 9).
     **Hay precedente firmado de glifo sin huella:** `ia` (excepción S53),
     por una razón de la misma familia — su marca ES el dibujo.

     ✅ **GATE DADO — FIRMA DEL FOUNDER (S98): EL ⓘ VA SIN HUELLA**, y con
     él cierra la categoría **«glifo de control»** que S79 dejó nombrada
     y sin gate. La regla que firmó, verbatim:

       ***«en un glifo de control no hay mascota, hay interfaz; la huella
       se reserva para donde significa.»***

     ⚡ ESO ASCIENDE EL ARGUMENTO DE ACÁ Y LO REEMPLAZA. Lo de abajo era
     geométrico —«en el ⓘ el centro lo ocupan la barra y el punto»— y
     servía para ESTE dibujo; la firma da la razón GENERAL, que vale para
     el próximo glifo de control aunque su centro esté libre. *Un
     argumento que solo explica el caso que tenés adelante no evita el
     caso siguiente.* La geometría queda escrita porque sigue siendo
     cierta y porque explica por qué éste fue el primero en pedirlo.

     ⚠️ DÓNDE QUEDA LA FRONTERA, que es lo que hay que no perder: la
     huella marca lo que TIENE MASCOTA ADENTRO —oficios, entidades,
     lugares del expediente—. Un control es andamiaje: informa, abre,
     configura. **`ia` deja de ser una excepción suelta de S53 y pasa a
     ser el primer habitante de esta categoría**, junto con este ⓘ.

     📮 LA LETRA ES DE A: `DIRECCION_ARTE` §6b / Ley 9 tienen que recibir
     la regla firmada. Acá vive el CÓDIGO y su porqué; la ley canónica no
     es territorio de esta pista. */
  info: ({ tinta }) => (
    <>
      <Circle cx={12} cy={12} r={8.6} {...trazo(tinta)} />
      <Path d="M12 11v5M12 7.7v.3" {...trazo(tinta)} />
    </>
  ),

  /* ══ LOS CUATRO NODOS DEL SEGUIMIENTO (S99-B) ══════════════════════
   *
   * 🔴 **VAN EN MASA Y NO EN TRAZO, y no es un gusto: es el tamaño.**
   * El nodo mide 20 y sostiene un glifo de **12** ⇒ el `viewBox` de 24
   * se escala a la mitad y **`TRAZO` 1.9 llega como 0.95 efectivo**.
   * A esa fineza un contorno no dibuja: susurra. *Es el mismo argumento
   * de §6ter con otra causa — allá el trazo moría por el FONDO, acá
   * muere por el TAMAÑO— y por eso la conclusión coincide: sobrevive la
   * silueta rellena.*
   *
   * **Precedente en la casa, no invención:** `ia` ya es masa pura (tres
   * chispas rellenas, sin un solo trazo). No nace una física nueva; se
   * usa la que ya existía.
   *
   * ── LA REGLA DE DIBUJO QUE LOS ORDENA ─────────────────────────────
   * **A 12 px no sobrevive el detalle interior: sobrevive la
   * ORIENTACIÓN.** Por eso los cuatro se separan por eje antes que por
   * contenido — **vertical · cuadrado · horizontal · diagonal**— que es
   * lo primero que el ojo resuelve cuando la figura es chica:
   *
   *   confirmado  la bolsa    ▮ vertical
   *   preparando  la caja     ■ cuadrada
   *   en camino   la flecha   ▶ horizontal
   *   entregado   el visto    ✓ diagonal
   *
   * ⚠️ **EL VISTO SE RESERVA PARA `entregado`, y es decisión.** Era el
   * candidato obvio para «confirmado» —el riesgo que la receta ya había
   * declarado— y se le niega: **`entregado` es el único de los cuatro
   * que COMPLETA algo**, y un visto en el primer nodo diría que el
   * camino terminó cuando recién empieza.
   *
   * ⚠️ **Y `en_camino` NO PUEDE SER UNA MOTO** (§6ter): la moto es marca
   * de MAPA, otra clase, y repetirla acá haría que el mismo objeto
   * significara dos cosas en la misma pantalla — el mapa la usa para
   * decir DÓNDE, y acá diría EN QUÉ ETAPA.
   *
   * **GATE POR ÍCONO PENDIENTE (§2.9), y se juzgan DONDE VIVEN:** la
   * galería los monta **adentro de una `EscaleraEstados` real, a 12 px**,
   * jamás sueltos en grande. *Es lo que la moto costó dos veces en esta
   * misma sesión.* Y por L-255: si el founder firma una silueta, lo que
   * cambia después es el TRATAMIENTO, jamás la silueta. */

  // LA BOLSA — el pedido existe. Cuerpo en masa; el asa es el ÚNICO
  // trazo del set y va más gruesa que `TRAZO` a propósito: a 12 px con
  // 1.9 el asa desaparecía y la bolsa se leía como un balde.
  nodoConfirmado: ({ tinta }) => (
    <>
      <Path
        d="M6.2 8.6h11.6a1.6 1.6 0 0 1 1.59 1.75l-.86 9.2A2.1 2.1 0 0 1 16.44 21.4H7.56a2.1 2.1 0 0 1-2.09-1.85l-.86-9.2A1.6 1.6 0 0 1 6.2 8.6Z"
        fill={tinta}
      />
      <Path
        d="M8.9 8.6V7.2a3.1 3.1 0 0 1 6.2 0v1.4"
        stroke={tinta}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  // LA CAJA ABIERTA — se está armando. La V de las solapas es lo que la
  // separa de la bolsa a 12 px: sin ellas las dos siluetas convergen.
  nodoPreparando: ({ tinta }) => (
    <>
      <Path
        d="M5.1 11.2h13.8v7.9a2.1 2.1 0 0 1-2.1 2.1H7.2a2.1 2.1 0 0 1-2.1-2.1Z"
        fill={tinta}
      />
      <Path d="M5.1 11.2 9.5 5.9 12 11.2Z" fill={tinta} />
      <Path d="M18.9 11.2 14.5 5.9 12 11.2Z" fill={tinta} />
    </>
  ),

  // LA FLECHA — el movimiento. Cola rectangular ancha para que a 12 px
  // la punta no se coma el cuerpo y quede leyéndose como un triángulo.
  nodoEnCamino: ({ tinta }) => (
    <Path
      d="M13.1 5.2 20.4 12l-7.3 6.8v-4.2H3.6V9.4h9.5Z"
      fill={tinta}
    />
  ),

  // EL VISTO — lo único que se completa. Polígono grueso: un check de
  // trazo a 12 px es exactamente el caso que esta nota vino a evitar.
  nodoEntregado: ({ tinta }) => (
    <Path
      d="M9.7 18.6 3.9 12.8l2.5-2.5 3.3 3.3 7.9-7.9 2.5 2.5Z"
      fill={tinta}
    />
  ),

  /* ══ S112-B · LOS CINCO DE LA ADOPCIÓN (§6b, firma founder 2-sep) ══════
     §6b PASO 1 · LOS NÚMEROS, y el desvío declarado:
     grilla 24 · trazo 1.9 round · densidad 2-4 trazos — **la anatomía
     canónica del registry, NO la de sus vecinos `nodo*`.**

     ⚠️ **Ése es el desvío y se declara, no se disimula.** Los `nodo*` son
     SILUETA RELLENA con su razón escrita: *«un check de trazo a 12 px es
     exactamente el caso que esta nota vino a evitar»*. **Ese 12 ya no
     existe:** medido en `EscaleraEstados`, `NODO = 32` y `GLIFO_EN_NODO =
     24` — G-15 lo creció— y **los dos registros usan las mismas
     constantes**. A 24 el trazo dibuja, así que estos vuelven a la anatomía
     de la casa en vez de heredar una decisión tomada para un tamaño que ya
     no rige.

     📌 Y queda anotado lo que NO es mío: los `nodo*` siguen con la anatomía
     del 12 en un nodo de 24. Es de despensa y se declara, no se toca.

     §6b PASO 6 · SON GLIFOS DE ESTADO —clasificación de mesa: *informan y no
     accionan*— y por eso **van SIN HUELLA**. Se declara acá y no se descubre
     en el gate. */

  /* EL SOBRE — «enviada». Rectángulo + la V de la solapa, que es lo único
     que lo separa de una tarjeta a 21px: sin ella son dos rectángulos.
     Riesgo declarado: a tamaño chico puede leerse como «mensaje»; lo separa
     que su vecino de la derecha SON las burbujas, y en vecindad la V manda. */
  sobre: ({ tinta }) => (
    <>
      <Path d="M3.6 6.6h16.8v10.8H3.6Z" {...trazo(tinta)} />
      <Path d="M3.6 6.6 12 13.2l8.4-6.6" {...trazo(tinta)} />
    </>
  ),

  /* LAS BURBUJAS — «en conversación». **DOS y no una, y es la decisión:**
     una burbuja sola dice «un mensaje»; dos superpuestas dicen que hay ida y
     vuelta, que es lo que esta etapa significa. La de atrás asoma por arriba
     a la izquierda — el solape es lo que las vuelve conversación en vez de
     dos globos sueltos.
     Riesgo declarado: a 21px el solape puede empastar; se compensa con la
     de atrás más chica y desplazada, no con más trazo. */
  burbujas: ({ tinta }) => (
    <>
      <Path d="M3.4 5.2h11.2v7.2H8.2L5.2 15V12.4H3.4Z" {...trazo(tinta)} />
      <Path d="M9.4 10.4h11.2v7.2h-1.8v2.6l-3-2.6H9.4Z" {...trazo(tinta)} />
    </>
  ),

  /* EL CHECK EN CÍRCULO — «aceptada». El círculo es lo que lo separa del
     visto suelto de `nodoEntregado`: acá **alguien decidió**, y el círculo es
     esa decisión conteniendo el hecho.
     Riesgo declarado: se puede confundir con un «listo» genérico. Lo separa
     su posición —tercera de cinco— y que las dos que siguen son de trámite. */
  checkEnCirculo: ({ tinta }) => (
    <>
      <Circle cx={12} cy={12} r={8.4} {...trazo(tinta)} />
      <Path d="M8.1 12.2 10.9 15l5-5" {...trazo(tinta)} />
    </>
  ),

  /* LA PLUMA — «acta firmada». 🔴 **NO reusa `lapiz`, y su propio vecino ya
     escribió el criterio:** *«el `carnet` usa un lápiz COMO OBJETO con su
     huella: son distintos por ROL, y por eso este no lo reusa»*. Acá pasa lo
     mismo un piso más allá — `lapiz` es EDITAR (control) y esto es FIRMAR
     (un hecho que no se deshace).
     La diferencia se dibuja: cuerpo curvo con la barba de la pluma, y la
     línea de firma debajo. Sin la línea sería un lápiz raro.
     Riesgo declarado, y es el más alto de los cinco: a 21px una pluma y un
     lápiz convergen. La línea de abajo es lo que los separa, y es la primera
     que hay que mirar en el gate. */
  pluma: ({ tinta }) => (
    <>
      <Path d="M18.6 4.2c-6.2.9-9.6 4.4-10.8 8.2l-1.4 3.6 3.6-1.4c3.8-1.2 7.3-4.6 8.6-10.4Z" {...trazo(tinta)} />
      <Path d="M12.6 9.6 6.4 15.8" {...trazo(tinta)} />
      <Path d="M4.2 19.8h15.6" {...trazo(tinta)} />
    </>
  ),

  /* ══ EL ENVIAR — GLIFO DE CONTROL (§6b paso 6, clasificación de mesa) ══
     **Sin huella, y por la Ley 9 en su alcance:** *en un glifo de control no
     hay mascota, hay interfaz.*

     LA FORMA: el avión de papel y **no** una flecha. La flecha ya está
     ocupada como movimiento (`nodoEnCamino`) y como dirección (`Chevron`);
     el avión dice **mandar**, que es otra cosa.
     Riesgo declarado: el avión es un cliché de mensajería, y ése es
     justamente su valor acá — la barra de escribir no es el lugar para
     enseñar un símbolo nuevo. La quilla interior es lo que evita que a 21px
     se lea como un triángulo. */
  enviar: ({ tinta }) => (
    <>
      <Path d="M20.4 3.6 2.8 10.4l6.6 2.6 2.6 6.6Z" {...trazo(tinta)} />
      <Path d="M20.4 3.6 9.4 13" {...trazo(tinta)} />
    </>
  ),

  /* EL CANDADO — «cerrado». Ver su entrada en la unión para el censo de
     metáforas que lo justifica y el riesgo declarado del gate.
     Sin huella: es control, no un momento de una mascota (Ley 9 · S98). */
  candado: ({ tinta }) => (
    <>
      {/* el arco, CERRADO y apoyado: no se puede abrir */}
      <Path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" {...trazo(tinta)} />
      {/* el cuerpo, liso — el ojo de la cerradura se llena a 21px */}
      <Rect x={4.6} y={10.4} width={14.8} height={9.4} rx={2.2} {...trazo(tinta)} />
    </>
  ),
  /* ⏪ **REDIBUJADO S116-B lote 2b — firma de la mesa: «signo de pregunta
   * en círculo».** Era un SALVAVIDAS (círculo + cuatro rayos rectos +
   * huella), y el dibujo dependía de la huella para no leerse como un
   * control náutico. **Con la letra §1.1 sacando la huella del set, el
   * salvavidas se quedaba sin lo que lo explicaba** — cuatro rayos
   * alrededor de un círculo vacío no dicen «ayuda»: dicen «apuntar».
   * *No es que el dibujo viejo fuera malo: es que su sentido colgaba de
   * una pieza que la letra retiró.*
   * ⚠️ **EL RIESGO SE MUEVE, no desaparece:** el «?» a 21 px es un arco de
   * 2,6 de radio más un punto, y lo que puede fallar es que el arco se
   * cierre en un círculo. Por eso la cola baja RECTA y el punto va suelto
   * — dos trazos que el ojo separa aunque el arco se empaste.
   * ☠️ Muere el descarte histórico de `contactoOndas` por vecindad con
   * este glifo: ya no comparten familia visual. */
  ayuda: ({ tinta }) => (
    <>
      <Circle cx={12} cy={12} r={8.4} {...trazo(tinta)} />
      <Path d="M9.5 9.4a2.6 2.6 0 1 1 3.4 2.5c-.6.2-.9.7-.9 1.3v.5" {...trazo(tinta)} />
      <Path d="M12 16.6v.3" {...trazo(tinta)} />
    </>
  ),
  /* LA GOTA — el pin de la casa. ⏪ Decía *«la huella vive en la gota»*.
     **S100d-B: LA HUELLA SALE** (punto 17 del gate, pedido por la pista A con
     su superficie exacta: la fila de dirección de la ficha de entrega).

     🔴 **LA RAZÓN ES MEDIBLE Y SOBREVIVE A QUE ALGUIEN CAMBIE DE OPINIÓN:**
     la gota es una forma **cerrada y angosta** — su interior útil son ~9
     unidades de la grilla 24 ⇒ **~7,5 px en el gate de 21** (§2.9). **Ley 9
     es literal: a 21 px la huella SOBREVIVE O ES RUIDO.** Acá era ruido.
     *«Lo pidió el founder» no habría sobrevivido a que cambiara de opinión;
     esto sí.*

     ⚡ **Y EL PEOR CASO VIVO NO ES EL GATE DE 21 — es más chico.** La pista
     D midió su consumidor nuevo: el último nodo de la escalera de estados
     dibuja este glifo a **12 px** (`TAMANO_EN_NODO`, dentro de un nodo de
     20). **A 12, el interior queda en ~4,3 px: ahí la huella no es ruido,
     es un borrón.** *El número llegó de afuera y hace más fuerte el
     argumento, no más débil — por eso entra acá y no en una bitácora.*

     ⚠️ **EL ALCANCE, CENSADO CONTRA `origin/main` Y NO CONTRA MI ÁRBOL**
     (L-305 / la enmienda de §D: un grep en el worktree propio mide la rama,
     no el producto): **8 consumidores** — `despensa/checkout.tsx:719` y
     `:1147` (los dos de A, y los dos lo quieren) + **seis del prestador**
     (`como-te-ven:283` · `cuenta/perfil:1339` · `grooming/index:308` ·
     `grooming/taller:789` · `paseo/index:289` · `seccion-sede:218`).
     **Los seis del prestador cambian de aspecto sin que nadie de esa app lo
     haya pedido, y se declara acá en vez de descubrirse en su próximo gate.**

     ── F-PIN · DÓNDE VA ESTA GOTA Y DÓNDE NO (firma del founder, 18-ago) ──
     *«El pin es una GOTA tipo Uber, no un punto»*, pedido tres veces.
     **El reparto, y lo decide `DIRECCION_ARTE` §6ter, no el gusto:**
       · una ubicación **se MUESTRA como dato** (celda, label, escalera,
         seguir el pedido) ⇒ **esta gota**.
       · el momento de **AJUSTAR** el punto (`PinMovible`) ⇒ **gota**, que
         ahí es una capa de INTERFAZ dibujada sobre el mapa.
       · el **mundo** del mapa (el destino, la moto) ⇒ **OBJETO**
         (`ObjetoDestino`, `ObjetoMoto`): *el mapa no es interfaz, es MUNDO.*
     *Meter la gota adentro del lienzo pondría dos idiomas peleando en la
     misma superficie.* */
  ubicacion: ({ tinta }) => (
    <Path d="M12 21s-7-5.3-7-11a7 7 0 1 1 14 0c0 5.7-7 11-7 11Z" {...trazo(tinta)} />
  ),
  // El silbato del adiestrador — MATA la estrella (violaba el set).
  training: ({ tinta, huella }) => (
    <>
      <Circle cx={9} cy={14.2} r={4.6} {...trazo(tinta)} />
      <Path d="M9.6 9.6h9.2a1.2 1.2 0 0 1 1.2 1.2v2l-5.6 1.6" {...trazo(tinta)} />
      <Huella color={huella} x={6.5} y={11.6} escala={0.32} />
    </>
  ),
  // La cama del hospedaje — la mascota apoyada arriba.
  hotel: ({ tinta, huella }) => (
    <>
      <Path d="M3.6 6.4v12.2M3.6 13.6h16.8v5M3.6 16.4h16.8" {...trazo(tinta)} />
      <Huella color={huella} x={12.8} y={5.8} escala={0.4} />
    </>
  ),
  // La casita de guardería — la huella espera en el techo.
  /* ⏪ **LA LUNA ENTRA EN S116-B, y no es decoración: es lo único que lo
   * separa de `hogar`.** Firma de la mesa (*«guardería = casa con luna»*),
   * y la medición le dio una razón que la orden no nombraba:
   *
   * 🔴 **CON LA HUELLA APAGADA, `guarderia` y `hogar` eran EL MISMO
   * DIBUJO.** Los dos son una casa; lo único que los distinguía era que
   * uno llevaba la huella adentro — y la letra §1.1 la sacó del set
   * entero. *El glifo no se volvió ambiguo por un descuido: lo volvió
   * ambiguo una decisión correcta tomada en otro lado, y nadie lo iba a
   * ver hasta montarlos juntos.* Rasterizados lado a lado a 21 px,
   * indistinguibles.
   *
   * ⚠️ **Y conviven en pantalla aunque no compartan fila:** `hogar` vive
   * en la barra de tabs, que se ve SIEMPRE. La Ley 12 enmendada S71 mide
   * la colisión dentro de la unidad de barrido, y la barra es la unidad
   * de todas.
   *
   * LA LUNA VA EN EL CIELO, no adentro de la casa: creciente en la esquina
   * superior derecha, fuera del techo. *Adentro diría «de noche en esta
   * casa»; al lado dice «esta casa es de noche», que es lo que una
   * guardería es.* */
  guarderia: ({ tinta, huella }) => (
    <>
      <Path d="M3.4 19.6v-7.4L10.4 6l7 6.2v7.4Z" {...trazo(tinta)} />
      <Path d="M8.2 19.6v-3.6a2.2 2.2 0 0 1 4.4 0v3.6" {...trazo(tinta)} />
      <Path d="M20.6 3.6a3 3 0 1 0 0 5.6 3.4 3.4 0 0 1 0-5.6Z" {...trazo(tinta)} />
      <Huella color={huella} x={8.2} y={7.6} escala={0.28} />
    </>
  ),
  // ☠️☠️ EL EMBLEMA DE COHORTE MURIÓ COMO GLIFO (gate founder, 3-ago).
  //    Su veredicto, literal: «**no me gusta ninguno, puede que tengamos
  //    que no usar glifo para esto, ya que es especial**».
  //
  //    LO QUE MATÓ NO FUE EL DIBUJO, FUE EL IDIOMA — y por eso la lápida
  //    va acá y no en un changelog: CINCO señales apuntaron al mismo
  //    lado antes de que alguien lo dijera. Tres candidatos murieron en
  //    el censo sin llegar a existir (la medalla, por el círculo ya
  //    ocupado tres veces · el laurel, por colisionar con `equipo` · el
  //    podio, por LOYALTY §3) y los DOS que sobrevivieron al censo
  //    rebotaron en dispositivo. Cuando un idioma mata cinco intentos
  //    seguidos, el que está mal es el idioma.
  //
  //    EL DIAGNÓSTICO, que es lo reutilizable: **un glifo de línea a
  //    21px no puede portar PERTENENCIA.** Un glifo dice de qué ES algo
  //    —es la etiqueta de un dominio— y la cohorte dice QUIÉN ES
  //    alguien. Son dos trabajos y no comparten pieza, igual que el
  //    glow y la atmósfera no comparten nombre.
  //
  //    A DÓNDE SE FUE: a `Insignia`, familia `distincion` (S85-B16) —
  //    pastilla con su fondo y la palabra entera, sobre la referencia
  //    que el propio founder dio: la pastilla «Al día» del cliente. El
  //    dibujo de los dos candidatos vive en `03ee595` si alguna vez hace
  //    falta un glifo de esta familia; su riesgo medido también.


  // ── LA FAMILIA DE LA VENTANA TEMPORAL · semana · mes (S85-B18) ──────
  //
  // EL PEDIDO venía desde S82-C: la hilera «todos · semana · mes» de los
  // hubs es la única del producto SIN glifo, y su propio código declaraba
  // el hueco («EL SET NO EXISTE… si un set necesita el MISMO glifo
  // repetido por fila, lo que falta es un set POR TIPO»). Nace ahora
  // porque con la promoción de `FiltroPills` el pedido dejó de cruzar
  // frontera: registry y pieza viven en la misma casa.
  //
  // EL CENSO ENCONTRÓ QUE LA CASA YA HABÍA RESUELTO LA MITAD, y por eso
  // nacen DOS y no cuatro (L-175: se lee el registry y se ENSANCHA):
  //  · `hoy` YA ES el calendario con el día marcado — la agenda de S85-B12.
  //    La familia ya tenía su primer miembro y él define el idioma.
  //  · `todos` YA SE RESUELVE con la Huella: la hilera hermana del Hogar
  //    (`hogar/index:1662`) monta `icono: 'huella'` para su chip «todo».
  //    No es una ventana temporal: es la AUSENCIA de ventana, y la casa
  //    ya eligió cómo se dice. Copiar esa decisión habría sido inventarla
  //    de nuevo.
  //
  // EL EJE DE LA FAMILIA, que es lo que la Ley 12 pide: los tres comparten
  // el CUERPO (calendario con sus dos anillas) y varía LO MARCADO ADENTRO
  // — el día · la semana · el mes. El glifo marca lo que VARÍA dentro de
  // la unidad de barrido, y acá lo que varía es el TRAMO. Compartir el
  // cuerpo no es colisión: es lo que los hace leerse como familia.
  //
  // ⚠️ EL RIESGO, declarado y es EL del gate a 21px: `semana` (una barra)
  // y `mes` (tres) se separan CONTANDO, y contar a 21px es exactamente lo
  // que puede fallar. Si a ese tamaño no se distinguen, la salida no es
  // engordar las barras: es que `mes` cambie de marca (una grilla de
  // puntos en vez de filas). Se monta la fila de 21px con `hoy` al lado
  // para que la comparación sea entre los TRES, no de a uno.
  // ⚠️ SEGUNDO RIESGO: sin las anillas, tres barras horizontales dentro de
  // un rectángulo son el idioma de `presupuesto`/`bitacora` — ocupado.
  // Las anillas son lo único que los mantiene calendario, igual que en
  // `hoy`. Nadie las saca "para simplificar".
  semana: ({ tinta, huella }) => (
    <>
      <Path d="M6 6.4h12a1.6 1.6 0 0 1 1.6 1.6v11.4a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V8A1.6 1.6 0 0 1 6 6.4Z" {...trazo(tinta)} />
      <Path d="M4.4 10.8h15.2" {...trazo(tinta)} />
      <Path d="M8.6 3.4v4M15.4 3.4v4" {...trazo(tinta)} />
      <Path d="M7.4 14.6h9.2" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={16.4} escala={0.28} />
    </>
  ),

  // ── LA CAMPANA (S88, lámina firmada) ──────────────────────────────
  // Geometría: la campana S43 del Encabezado — probada a 21px en su
  // gate original — re-portada al trazo 1.9 del registry (la referencia
  // venía en 1.75; acá manda TRAZO). Domo + badajo, remates redondeados.
  // EL `huella` QUEDA SIN USAR A PROPÓSITO y no es un olvido: el par
  // campana+novedad reparte la ley del único relleno — el objeto va en
  // TRAZO y la huella RELLENA aparece en el Badge SOLO cuando hay
  // avisos sin leer (regla de existencia). Una huella fija adentro
  // diría «siempre hay novedad», que es mentir con geometría.
  campana: ({ tinta }) => (
    <>
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...trazo(tinta)} />
      <Path d="M13.7 20.6a2 2 0 0 1-3.4 0" {...trazo(tinta)} />
    </>
  ),

  mes: ({ tinta, huella }) => (
    <>
      <Path d="M6 6.4h12a1.6 1.6 0 0 1 1.6 1.6v11.4a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V8A1.6 1.6 0 0 1 6 6.4Z" {...trazo(tinta)} />
      <Path d="M4.4 10.8h15.2" {...trazo(tinta)} />
      <Path d="M8.6 3.4v4M15.4 3.4v4" {...trazo(tinta)} />
      <Path d="M7.4 13.2h9.2M7.4 15.8h9.2M7.4 18.4h9.2" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={16.4} escala={0.28} />
    </>
  ),

  // El escudo — la vida protegida (verde vital, como insurance).
  //
  // ⚖️ COLISIÓN DECLARADA Y ACEPTADA (firma de mesa, S85): ESTE MISMO
  // DIBUJO tiene DOS usos en DOS apps — el SERVICIO DE SEGUROS en el
  // cliente y la SEGURIDAD DE LA CUENTA en el prestador. Se declara acá,
  // en el registry, porque es el único lugar donde alguien que vaya a
  // dibujar el próximo glifo lo va a leer.
  //
  // POR QUÉ NO ROMPE LA LEY 12, que es lo que hay que poder contestar: la
  // Ley 12 pide que el glifo separe cosas que significan distinto DENTRO
  // DE UNA MISMA UNIDAD DE BARRIDO — una fila, un menú, una hilera. Estos
  // dos usos NO comparten pantalla ni app: nadie ve nunca los dos juntos,
  // así que no hay nada que el ojo tenga que separar. La colisión es de
  // NOMBRE en el registry, no de lectura en el producto.
  //
  // ⚠️ LO QUE ESTO NO AUTORIZA, y por eso se escribe: no habilita reusar
  // un glifo por parecido temático dentro de una misma app. Si algún día
  // el cliente monta "Seguridad de la cuenta" —o el prestador vende
  // seguros—, los dos usos caen en la misma casa, y ahí SÍ hace falta un
  // segundo dibujo: el escudo se queda con el que llegó primero y el otro
  // pasa por §6b (hoja de contacto, 2-3 variantes, gate POR ÍCONO a 21px).
  // Ese día esta nota es la que dice cuál es cuál.
  /* ⏪ **REDIBUJADO S116-B lote 2b — firma de la mesa: «escudo con check».**
   * Era un escudo con la huella adentro, y sin ella quedaba **un escudo
   * vacío** — que no dice «asegurado»: dice «escudo». *Mismo caso que
   * `ayuda`: el dibujo colgaba de la pieza que la letra retira.*
   * ⚠️ **CHOQUE DECLARADO Y MEDIDO CONTRA DOS VECINOS que ya llevan un
   * check:** `checkEnCirculo` (check dentro de un CÍRCULO) y
   * `nodoEntregado` (check SUELTO). Los tres se separan por el contenedor,
   * que es el rasgo que sobrevive a 21 px — escudo · círculo · nada. Van
   * los tres juntos en la hoja, y si no se separan, el que se mueve es
   * éste: los otros dos son etapas de escaleras vivas. */
  seguros: ({ tinta }) => (
    <>
      <Path d="M12 3.4 19.2 6v5.6c0 4.6-3 8.2-7.2 9.8-4.2-1.6-7.2-5.2-7.2-9.8V6Z" {...trazo(tinta)} />
      <Path d="M8.8 11.8 11.2 14.2 15.4 10" {...trazo(tinta)} />
    </>
  ),
  // La pantalla que atiende — salud a distancia, la huella presente.
  telemedicina: ({ tinta, huella }) => (
    <>
      <Path d="M8 3.6h8a1.4 1.4 0 0 1 1.4 1.4v14A1.4 1.4 0 0 1 16 20.4H8A1.4 1.4 0 0 1 6.6 19V5A1.4 1.4 0 0 1 8 3.6Z" {...trazo(tinta)} />
      <Path d="M12 6.8v3.4M10.3 8.5h3.4" {...trazo(tinta)} />
      <Huella color={huella} x={9.5} y={12.8} escala={0.32} />
    </>
  ),
  // El calendario con la pausa serena — vacaciones jamás dicen error.
  vacaciones: ({ tinta, huella }) => (
    <>
      <Path d="M4.6 6.6h14.8v12.8H4.6ZM4.6 10.4h14.8M8.4 4.4v3M15.6 4.4v3" {...trazo(tinta)} />
      <Path d="M7.6 17.2l3.2-4" {...trazo(tinta)} />
      <Huella color={huella} x={12.6} y={12.2} escala={0.32} />
    </>
  ),
  // PRIME candidato A: la chapita con huella en MAGENTA PURO — la
  // membresía es de la marca (única huella magenta fuera de tabs,
  // declarada al gate).
  prime: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={5.6} r={1.9} {...trazo(tinta)} />
      <Circle cx={12} cy={13.6} r={6.6} {...trazo(tinta)} />
      <Huella color={huella} x={8.9} y={10.6} escala={0.38} />
    </>
  ),
  // PRIME candidato B: la corona en trazo con la huella adentro.
  primeCorona: ({ tinta, huella }) => (
    <>
      <Path d="M4.6 17.6h14.8M4.6 17.6 3.8 8.4l4.7 3.2L12 5.8l3.5 5.8 4.7-3.2-.8 9.2" {...trazo(tinta)} />
      <Huella color={huella} x={9.2} y={10.8} escala={0.3} />
    </>
  ),
  // Dos correas que se cruzan — el equipo del oficio.
  equipo: ({ tinta, huella }) => (
    <>
      <Path d="M6.2 4.4c3.6 1.5 4.2 5.4 1.2 8.8M17.8 4.4c-3.6 1.5-4.2 5.4-1.2 8.8" {...trazo(tinta)} />
      <Huella color={huella} x={8.8} y={14.4} escala={0.4} />
    </>
  ),

  // ══ LOTE S71-B2 — firma founder sobre hoja de contacto (variante A
  //    en ambos; el criterio nuevo del gate: a 21px la huella SOBREVIVE
  //    o es ruido) ══
  // La carpeta del caso — la unidad que AGRUPA consultas de una misma
  // condición (S70); la huella es EL PACIENTE, vive adentro.
  caso: ({ tinta, huella }) => (
    <>
      <Path
        d="M3.6 18.3V6.2a1.5 1.5 0 0 1 1.5-1.5h3.7l1.9 2.2h7.7a1.5 1.5 0 0 1 1.5 1.5v9.9a1.5 1.5 0 0 1-1.5 1.5H5.1a1.5 1.5 0 0 1-1.5-1.5Z"
        {...trazo(tinta)}
      />
      <Huella color={huella} x={8.9} y={10.2} escala={0.38} />
    </>
  ),
  // El documento con desglose — cotización, JAMÁS cobro (cero $, cero
  // billete: la colisión con pagos quedó vetada en la hoja). Dos ítems
  // desiguales: el desglose ES el presupuesto. La huella dice para
  // quién se cotiza.
  presupuesto: ({ tinta, huella }) => (
    <>
      <Path
        d="M6.2 3.6h7.6l4.6 4.6V19a1.5 1.5 0 0 1-1.5 1.5H6.2A1.5 1.5 0 0 1 4.7 19V5.1a1.5 1.5 0 0 1 1.5-1.5Z"
        {...trazo(tinta)}
      />
      <Path d="M13.8 3.6v4.6h4.6" {...trazo(tinta)} />
      <Path d="M8 12.2h5M8 15.2h3.4" {...trazo(tinta)} />
      <Huella color={huella} x={12.4} y={13.6} escala={0.32} />
    </>
  ),

  // LA JERINGA (S82-B r10) — objeto del acto, con su huella: la vacuna
  // ES del expediente de una mascota (capa IDENTIDAD, familia de
  // carnet/vet: protección de vida). Trazo 1.9 como todo el set.
  // Anatomía pensada PARA 21px (la lección del set: a ese tamaño
  // sobrevive lo simple): cuerpo vertical + aletas + vástago con su
  // tope + aguja; CERO graduaciones (a 21 son ruido — Chanel aplicada
  // antes del gate, no después). Desplazada a la derecha del centro
  // para que la huella respire abajo-izquierda, como en `carnet`.
  vacuna: ({ tinta, huella }) => (
    <>
      <Path d="M10.6 8.6h4.8v8.6h-4.8z" {...trazo(tinta)} />
      <Path d="M9 8.6h8" {...trazo(tinta)} />
      <Path d="M13 8.6V4.8" {...trazo(tinta)} />
      <Path d="M10.8 4.8h4.4" {...trazo(tinta)} />
      <Path d="M13 17.2v3.4" {...trazo(tinta)} />
      <Huella color={huella} x={2.4} y={14.8} escala={0.32} />
    </>
  ),

  /* ── PERSONALIDAD · LA ESTRELLA DE CINCO PUNTAS (S113-B, 1.2.3) ─────────
   *  Dictado del founder: *«una estrella de cinco puntas sencilla, trazo de
   *  la casa — lo que lo hace único»*. Nace porque **el registry no tenía
   *  ninguno para «cómo es»** y la entrada de personalidad quedó sin glifo,
   *  con su hueco reservado, en `InvitacionBio`. *Prestar un vecino era lo
   *  único que no se podía hacer.*
   *
   *  🔴 **EL ÚNICO NÚMERO QUE SE ELIGIÓ ES `r/R = 0.5`, Y LO DECIDIÓ LOS
   *  21 px, NO EL GUSTO.** La estrella «clásica» tiene `r/R = 0.382` y una
   *  punta de **36°**: con el trazo de la casa (1,9 → **1,66 px a 21**), en
   *  sus primeros 2 px esa punta mide **1,30 px de ancho**, o sea MENOS que
   *  el trazo que la dibuja ⇒ *la punta se la come su propia línea y quedan
   *  cinco bultos.* Con `0.5` la punta abre a **52,5°** y a esos mismos 2 px
   *  mide **1,97 px**: tiene cuerpo propio. Su gate lo mide y no lo adjetiva.
   *
   *  El tamaño salió de la vara: **un solo subpath cerrado, 46,5 de trazo
   *  contra los 46,4 de `vacuna`** (+0,2 %). No se buscó «que se vea
   *  parecido»: se resolvió `R` para caer en la banda.
   *
   *  ⚠️ **Sin huella**, como los otros glifos de control (N27 · §6b paso 6):
   *  acá no hay mascota, hay interfaz.
   *
   *  ⚠️ **Colisión declarada:** una estrella es la metáfora universal de
   *  «favorito» y de «calificación». Acá NO es ninguna de las dos y la casa
   *  no tiene todavía ninguna de las dos, así que el nombre queda libre —
   *  *pero el día que exista un favorito, esto se revisa antes que aquello,
   *  porque llegó primero y va a parecer que califica.* */
  /* 🔴 **REDIBUJADO (S116-B) — LA ESTRELLA SE FUE A `calificacion`, POR LA
   * ORDEN QUE ESTA MISMA ENTRADA DEJÓ ESCRITA.** Su versión vieja decía:
   * *«el día que exista un favorito, esto se revisa antes que aquello,
   * porque llegó primero y va a parecer que califica»*. El mock pide
   * Favorito (#15) y Calificación (#16), y el founder firmó (letra §1.9):
   * **la estrella es Calificación; Personalidad recibe glifo nuevo.**
   * *La colisión no se descubrió: estaba declarada hace tres sesiones con
   * su regla de desempate adentro, y lo único que hizo esta tanda fue
   * cobrarla.* La geometría medida (`r/R = 0.5`, resuelta por los 21 px y
   * no por el gusto) viajó INTACTA a `calificacion`; acá no se perdió.
   *
   * EL OBJETO NUEVO: LA PELOTA. Lo que el producto pregunta con este glifo
   * es *«cómo es»* (`InvitacionBio`), y §1 manda dibujar un OBJETO, no una
   * idea — *«el carácter» no tiene forma*. Los candidatos y por qué
   * cayeron, que es el trabajo:
   *  · **el corazón** — lo toma `favorito` en esta misma tanda.
   *  · **el hueso** — dice PERRO, y la personalidad es de todas las
   *    especies. Es exactamente el error que el veto de `wearables`
   *    esquivó («jamás un corazón médico»): un objeto que nombra a un
   *    subconjunto de los sujetos.
   *  · **una carita** — la casa no dibuja caras humanas ni animales fuera
   *    de la marca, y una carita es un ESTADO DE ÁNIMO, no un carácter.
   *  ⇒ la pelota es el objeto del JUEGO, que es donde el carácter de un
   *  animal se ve, y sirve para las once especies del catálogo por igual.
   *
   * ⚠️ **RIESGO DECLARADO Y ES EL MÁS ALTO DE LA TANDA: `ayuda`** — círculo
   * + 4 rayos. Los separa que **los rayos de `ayuda` salen FUERA del
   * círculo y las costuras de la pelota viven ADENTRO**, y que éstas son
   * CURVAS. A 21 px es lo primero que hay que mirar; si no se separan, el
   * que se mueve es éste (`ayuda` tiene consumidores desde S53). */
  /* ⏪ **REDIBUJADO DOS VECES EN DOS LOTES, y la segunda la ordenó el ojo
   * del founder sobre la hoja: «hoy se lee como globo».** Tenía razón y la
   * causa es geométrica: llevaba **dos** costuras, una vertical y una
   * horizontal, **las dos pasando por el centro** — que es exactamente el
   * dibujo de un meridiano y un paralelo. *Un globo terráqueo es una
   * esfera con DOS ejes simétricos; una pelota tiene UNA banda.*
   * ⏪ **Y LA PRIMERA CURA TAMBIÉN FALLÓ EN SU HOJA, que es el dato:** una
   * sola costura curva y descentrada **se leía como un círculo TACHADO** —
   * o sea «no disponible», que es peor que un globo porque significa algo.
   * *Quitarle un eje al globo no lo convirtió en pelota: lo convirtió en
   * una prohibición.*
   * ⇒ quedan **dos arcos opuestos que nacen y mueren en el borde**, sin
   * pasar por el centro: la costura de una pelota. **Ningún trazo cruza el
   * medio**, que es exactamente lo que distingue una costura de un
   * meridiano y de un tachado.
   * ⚠️ Su vecino sigue siendo `ayuda`, que también es un círculo — y en
   * este mismo lote `ayuda` pasó a llevar un «?» adentro, así que la
   * distancia entre los dos **creció sin que ninguno se moviera por el
   * otro**. Se declara igual: los dos van juntos en la hoja. */
  personalidad: ({ tinta }) => (
    <>
      <Circle cx={12} cy={12} r={8.4} {...trazo(tinta)} />
      <Path d="M6.1 5.9a9.4 9.4 0 0 1 0 12.2" {...trazo(tinta)} />
      <Path d="M17.9 5.9a9.4 9.4 0 0 0 0 12.2" {...trazo(tinta)} />
    </>
  ),

  /* ── PESO · LA BALANZA DE DOS PLATOS (S113-B, 2ª forma) ─────────────────
   *  ⏪ **La primera forma era una balanza de PLATAFORMA de frente —dial,
   *  columna, plataforma y dos patas— y el founder la vio en el teléfono:
   *  *«no se entiende»*.** El riesgo estaba declarado en su propio
   *  comentario (*«a 21 px un disco sobre una columna puede leerse como
   *  termómetro o lámpara de pie»*) y se cobró. **Lo que falló no fue el
   *  dibujo: fue la metáfora.** Una balanza de plataforma moderna es un
   *  rectángulo con números — sin números no queda nada que la distinga; la
   *  de dos platos **es reconocible por su SILUETA**, que es lo único que
   *  sobrevive a 21 px. *Se declara porque la lección no es «quedó feo»: es
   *  que el gate a 21 px mide la silueta, y una silueta que necesita su
   *  esfera para leerse ya perdió.*
   *
   *  Anatomía: fiel · mástil · base · dos platos que bajan su propia cuerda.
   *  **Medido: 46,1 de trazo y 5 trazos, contra los 46,4 y 5 de `vacuna`.**
   *  Sin `<Circle>`: los platos son ARCOS, así que este glifo no tiene
   *  interior redondo que medir — y su gate lo dice en vez de callarlo. */
  peso: ({ tinta }) => (
    <>
      {/* fiel · mástil · base */}
      <Path d="M6 8h12" {...trazo(tinta)} />
      <Path d="M12 8v9" {...trazo(tinta)} />
      <Path d="M8.6 17h6.8" {...trazo(tinta)} />
      {/* Cada plato baja su cuerda y abre el arco en UN SOLO trazo — dos
          trazos por plato daban 7 y la casa vive en 5. */}
      <Path d="M6 8v1.6a2.4 2.4 0 0 0 4.8 0" {...trazo(tinta)} />
      <Path d="M18 8v1.6a2.4 2.4 0 0 0-4.8 0" {...trazo(tinta)} />
    </>
  ),

  /* ── ANTIPARASITARIO · EL ESCUDO CON LA GOTA (S113-B) ───────────────────
   *  Dictado del founder: *«un escudo con una gota adentro, no una
   *  receta»*. El préstamo de `receta` decía «lo que el vet te indica»;
   *  esto dice **lo que protege**, que es otra cosa.
   *  **Medido: 47,1 de trazo** contra 46,4 de `vacuna`.
   *
   *  🔴 **DOS METÁFORAS OCUPADAS, medidas antes de dibujar (paso 2 de §6b),
   *  y las dos chocan. Van al gate declaradas, no disimuladas:**
   *
   *  ① **`seguros` YA ES UN ESCUDO** —y con algo adentro: su huella a
   *     escala 0,4—. *Este glifo es el mismo objeto cambiando lo de
   *     adentro, que a 21 px es justo lo que menos se ve.* Lo que los
   *     separa está medido: el escudo de `seguros` pesa 52,3 y ocupa de
   *     y=3,4 a y=21; éste pesa 47,1 y vive de y=6,4 a y=18,3 — **es
   *     visiblemente más chico y más alto en el lienzo**. *Alcanza o no
   *     alcanza: eso lo dice el ojo del founder en el gate, no yo.*
   *     **Si no alcanza, la salida NO es retocar el escudo:** es cambiar
   *     el objeto por la PIPETA spot-on, que es el antiparasitario real y
   *     no colisiona con nada. Queda dicho para que el gate tenga la
   *     segunda opción sin volver a estudiarla.
   *  ② **LA GOTA ESTÁ TOMADA: es el pin de la casa** (`ubicacion`, F-PIN,
   *     firmado). La distinción es de ORIENTACIÓN y se puede medir: *el pin
   *     apunta hacia ABAJO —su punta señala el suelo— y una gota de líquido
   *     apunta hacia ARRIBA, porque cae.* Ésta apunta arriba. Y va DENTRO
   *     de un escudo, que ningún pin de la casa hace. */
  antiparasitario: ({ tinta }) => (
    <>
      <Path d="M12 6.4 16.7 8.2v3.6c0 3-1.9 5.4-4.7 6.5-2.8-1.1-4.7-3.5-4.7-6.5V8.2Z" {...trazo(tinta)} />
      <Path d="M12 10.2c1.1 1.3 1.6 2 1.6 2.6a1.6 1.6 0 0 1-3.2 0c0-.6.5-1.3 1.6-2.6Z" {...trazo(tinta)} />
    </>
  ),

  /* ── FOTO · LA CÁMARA SENCILLA (S113-B) ─────────────────────────────────
   *  Dictado del founder: *«una cámara sencilla con su lente redondo, no un
   *  ojo»*, y su razón es la buena: **un ojo es MIRAR, una foto es
   *  GUARDAR.** El préstamo invitaba a ver algo que ya existe; el atajo
   *  sirve para dejar algo nuevo en el expediente.
   *
   *  **Medido: 51,6 de trazo** contra 46,4 de `vacuna` — **+11 %, y el
   *  desvío se declara en vez de disimularse** (paso 1 de §6b). La causa
   *  es de anatomía y no de descuido: `vacuna` son líneas abiertas y esto
   *  es una **forma cerrada**, que paga su contorno entero. En esa familia
   *  la casa vive más arriba: `seguros` 52,3 · `telemedicina` 59,6 ·
   *  `pedido` 93,0. *Bajarlo a 46 exigía un lente de r=1,9, y a 21 px eso
   *  deja **1,66 px de interior**: la Ley 9 lo llama borrón. Entre respetar
   *  el número y que el lente se lea, manda que se lea.*
   *
   *  ⚠️ **EL PUNTO NO ES DECORACIÓN.** Sin él, un rectángulo con un círculo
   *  centrado se lee como **pantalla con botón**. El punto cuesta CERO de
   *  trazo —es un path de largo nulo con la punta redonda de la casa— y es
   *  lo único que lo vuelve cámara. *El visor de verdad costaba 5 unidades
   *  y decía lo mismo.* */
  foto: ({ tinta }) => (
    <>
      <Path
        d="M7.7 10.8h8.6a1.25 1.25 0 0 1 1.25 1.25v5.4a1.25 1.25 0 0 1-1.25 1.25H7.7a1.25 1.25 0 0 1-1.25-1.25v-5.4A1.25 1.25 0 0 1 7.7 10.8Z"
        {...trazo(tinta)}
      />
      <Circle cx={12} cy={14.75} r={2.5} {...trazo(tinta)} />
      <Path d="M9.1 12.4h0" {...trazo(tinta)} />
    </>
  ),

  // LA BITÁCORA (S82-B r34) — el cuaderno del progreso, con su huella:
  // la bitácora ES de una mascota (capa IDENTIDAD, familia carnet/caso).
  // Anatomía PARA 21px: cuerpo + lomo + DOS renglones (tres ya son ruido
  // a ese tamaño — Chanel antes del gate, como en la jeringa).
  bitacora: ({ tinta, huella }) => (
    <>
      <Path d="M9 4h9a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H9z" {...trazo(tinta)} />
      <Path d="M11.4 4v16" {...trazo(tinta)} />
      <Path d="M13.6 9h3.2M13.6 12.4h3.2" {...trazo(tinta)} />
      <Huella color={huella} x={2} y={13.4} escala={0.3} />
    </>
  ),

  // ── LA RECETA — LA CÁPSULA (S90-B) ─────────────────────────────────
  // EL CENSO PRIMERO (§6b paso 2), porque es lo que decide el dibujo: el
  // idioma «rectángulo» está ocupado SIETE veces en este registry —
  // `presupuesto` (hoja con doblez) · `bitacora` (cuaderno con lomo) ·
  // `caso` (carpeta con pestaña) · `pagos` (billete) · `documento`
  // (retrato) · `fiscal` (dentado) · `hoy` (calendario con anillas). Una
  // OCTAVA hoja rectangular no se distingue de ninguna a 21px, que es
  // exactamente lo que la Ley 9 afilada mata.
  //
  // POR QUÉ LA CÁPSULA Y NO EL PAPEL, dicho con su conflicto a la vista:
  // el JSDoc del catálogo de papeles (`apps/cliente/src/lib/papeles.ts`)
  // pide «el glifo del OBJETO (el papel), jamás el del acto» — y esta
  // decisión NO lo cumple al pie. Se toma igual por tres razones medidas:
  //   ① El propio catálogo ya tiene una entrada que tampoco lo cumple:
  //      `carnet_vacunas → 'carnet'`, y `carnet` NO es un papel — es la
  //      PLACA (etiqueta con su anilla). La regla describe a `documento`,
  //      no al catálogo entero.
  //   ② El objeto exacto de una receta es la hoja del recetario, y esa
  //      puerta está cerrada por saturación (arriba). Entre un octavo
  //      rectángulo ilegible y un objeto legible, la Ley 9 decide.
  //   ③ Lo que la receta ORDENA es la medicación, y ahí el objeto es
  //      exacto y único en el set: nada más es una cápsula. `vacuna` es
  //      la jeringa —otra silueta, otro eje— así que no hay colisión.
  // ⚠️ EL RIESGO, declarado y no disimulado (§6b paso 3): puede leerse
  // «medicación» antes que «receta». Vive mitigado por su vecindad (una
  // LISTA de papeles rotulados por voz), pero es el riesgo real y es lo
  // que el gate del founder tenía que mirar.
  //
  // ✅ FIRMADO (mesa, 7-ago-2026): «el glifo receta firmado — la cápsula
  // construida en S90-B rige; el préstamo receta→'caso' se retira». El
  // riesgo de arriba se conserva ESCRITO a propósito: la firma dice que
  // se acepta, no que no existía. Si algún día la lista de papeles deja
  // de rotularse por voz, la mitigación se cae y esto vuelve a la mesa.
  //
  // ANATOMÍA PARA 21px: DOS trazos (densidad 2 — el piso del rango 2-4,
  // igual que la jeringa después de su Chanel). Cápsula a 45° + la línea
  // de unión de las dos mitades, que es lo que la hace cápsula y no un
  // rombo. Cero graduaciones, cero píldoras satélite: a 21px son ruido.
  // Grilla 24 · trazo 1.9 · aire 3.4 arriba (el más ajustado, medido).
  // La huella baja-izquierda con el mismo gesto que `vacuna`/`bitacora`.
  // ── S91-B · CANDIDATO A — EL APILADO. **El plural ES el dibujo**: dos
  // hojas desplazadas. Es lo único que separa «los documentos» de «un
  // documento» sin inventar un objeto que no existe.
  // ⚠️ SU PRIMERA VERSIÓN FALLÓ SU PROPIO GATE, y queda escrito porque la
  // medición es el aporte: con DOS rectángulos COMPLETOS desplazados 3, a
  // 21px se leía **un cuadrado dentro de otro** —concéntrico—, no un
  // apilado. Era el riesgo que se había declarado y resultó real.
  // LA CURA: la hoja de atrás deja de ser un rectángulo y pasa a ser lo
  // ÚNICO que se vería de ella — su esquina superior derecha (una L). Con
  // eso el ojo lee dos planos en vez de dos marcos. Rasterizado a 21px y
  // mirado antes de dejarlo, no supuesto.
  // Densidad 2 + huella; grilla 24 · trazo 1.9 · aire 3.5 arriba.
  /**
   * 🔴 **PASAPORTE Y QR (S113-B · 2.2.4) — y su forma la decidió la
   * ARITMÉTICA, no el gusto.**
   *
   * ── §6b.2 · METÁFORAS OCUPADAS ──────────────────────────────────────
   * El **rectángulo-página está lleno**: `documentos` (dos apilados) ·
   * `certificaciones` y `presupuesto` (hoja con esquina doblada) ·
   * `documento`. Y `carnet` **es un lápiz**, que al lado de «Pasaporte y QR»
   * lee *editar*. **La marca QR no la usa nadie** — es el único activo libre.
   *
   * ── §6b.3 · LAS DOS VARIANTES, Y POR QUÉ GANÓ ÉSTA ──────────────────
   * · **«tarjeta con QR adentro»** — ✗ **descartada por número, dos veces**:
   *   la tarjeta sola ya pesa **64 (+38 %)** contra la vara de `vacuna`
   *   (46,4 · banda 39,4–53,4); achicada a 15×10,5 pesa 51 y **no queda
   *   presupuesto para el QR**, cuyas esquinas caerían a ~2,2 y su interior a
   *   **0,26 px** — se cierran enteras (Ley 9).
   * · **«QR de TRES esquinas»** — ☠️ **INCONSTRUIBLE**, y esto es lo que hay
   *   que no volver a intentar: la masa exige `s ≤ 4,45` y la Ley 9 exige
   *   `s ≥ 4,76`. **El intervalo es vacío.** *No es que los números estén mal
   *   calibrados: es que la forma no admite las dos leyes a la vez* (`L-283`,
   *   la anatomía incapaz). Se descubrió con una cuenta ANTES de dibujar, no
   *   con tres calibraciones fallidas.
   * · **✅ «dos esquinas + módulos», con la HUELLA en el tercer vértice.**
   *
   * ── 🔴 Y LA HUELLA NO ES ADORNO: ES EL TERCER CUADRADO ──────────────
   * Un QR tiene tres esquinas y acá **la de abajo a la izquierda es la pata**.
   * *La forma dice quién es el dueño del código sin escribirlo.* Va a escala
   * 0.30 —la misma de `documentos`— y no a la del cuadrado que reemplaza:
   * a 0.22 quedaría en **4,55 px** a 21, por debajo de todo lo que la casa
   * usa, y la Ley 9 dice que a 21 px la huella sobrevive **o es ruido**.
   *
   * ── §6b.1 · LOS NÚMEROS ─────────────────────────────────────────────
   * Grilla 24 · trazo 1.9 round · esquinas **s = 5.0** ⇒ interior **2,71 px**
   * a 21 (piso 2,5) · dos módulos **rellenos** de 1.5 —*rellenos y no
   * trazados a propósito: un cuadrado trazado de 1.5 tiene interior negativo,
   * o sea que es un borrón*— · masa **52,0 (+12 %)**, dentro de la banda ·
   * **4 trazos** (§6b: 2–4).
   *
   * ── §6b.6 · NO ES GLIFO DE CONTROL ──────────────────────────────────
   * **Lleva huella, y es obligatorio que la lleve.** No es interfaz: es un
   * documento **de la mascota**, familia de `carnet`, `documentos` y
   * `certificaciones`, que la llevan las tres. Y medido en su vecindad real:
   * **los cuatro glifos de `FilaAcciones` tienen huella** — *uno sin ella se
   * leería como de otra clase*, que es exactamente el defecto que la casa ya
   * pagó en `HojaContanos`.
   *
   * ── ✅ GATE POR ÍCONO **CERRADO** — firma del founder (7-sep-2026) ──────
   * *«Va la V1 (dos esquinas + la pata en el tercer vértice)»*, y la firma
   * llegó **con su límite escrito, no a pesar de él**:
   *
   * 🔴 **NO LEE «QR» DE FORMA INEQUÍVOCA A 21 PX, Y NO PUEDE.** Las esquinas
   * de un QR real son cuadrados **anidados**, y un anidado no entra en el
   * trazo de la casa a ese tamaño — es la misma pared que volvió
   * **inconstruible** el de tres esquinas. **Lo que lo hace legible es su
   * CONTEXTO: la etiqueta «Pasaporte y QR» al lado.**
   *
   * ⚠️ **Y eso es una condición de uso, no una nota de color.** *Este glifo
   * NO se puede usar solo* —sin etiqueta, en una barra o en un botón mudo—
   * porque ahí lo único que quedaría es «dos cuadrados y una pata». Si alguna
   * vez hace falta uno que se sostenga solo, **es un glifo nuevo con su
   * propio gate**, no un ajuste de éste.
   *
   * ☠️ El andamio del gate murió con la firma (Ley 37): la candidata V2
   * «maciza» y su hoja de contacto salieron de la galería. **El estudio con
   * sus números queda en `docs/loop/capturas-s113-b-2.2.4/`** — *el papel se
   * conserva; el andamio no.*
   */
  pasaporte: ({ tinta, huella }) => (
    <>
      {/* Las dos esquinas de arriba: s = 5.2, interior 2,89 px a 21.
          Centros en (6.2, 6.2) y (17.8, 6.2). */}
      <Path d="M3.6 3.6h5.2v5.2h-5.2Z" {...trazo(tinta)} />
      <Path d="M15.2 3.6h5.2v5.2h-5.2Z" {...trazo(tinta)} />
      {/* 🔴 LA TERCERA ESQUINA ES LA PATA, y para que se LEA así tiene que
          caer donde caería el cuadrado: centro en (6.2, 17.0), o sea en la
          misma columna que la de arriba. *Un QR tiene TRES esquinas y ninguna
          más — la cuarta vacía es parte de la forma.* */}
      <Huella color={huella} x={2.6} y={13.4} escala={0.3} />
    </>
  ),

  /**
   * 🔴 **PAPEL — la hoja que la familia TRAE (S113-B · fase 3 · B6).**
   *
   * ── §6b.2 · METÁFORAS OCUPADAS, y el censo cambió el dibujo ──────────
   * · **`documento` NO es una hoja: es una CREDENCIAL apaisada** con su
   *   círculo de retrato y sus dos líneas. *Reusarlo diría «carnet», que es
   *   otra cosa.* (Y su cabecera lo dice: la huella va chica y al costado
   *   porque el documento **no es del animal**.)
   * · **La hoja con ESQUINA DOBLADA está tomada dos veces**: `certificaciones`
   *   y `presupuesto`. ⇒ acá la hoja va **sin doblez**, y lo que la nombra son
   *   sus renglones.
   * · `documentos` son dos rectángulos apilados: la SECCIÓN, no una hoja.
   *
   * ── §6b · ECONOMÍA: UNO, NO TRES ────────────────────────────────────
   * El encargo nombraba `papel`, `examen` y `receta`. **`receta` ya existe y
   * está firmado** (S90-B), y **examen e informe comparten éste a propósito**:
   * *el rótulo del grupo ya dice «Exámenes» o «Informes» — tres dibujos para
   * una distinción que la palabra de al lado ya hace es un glifo que nadie
   * necesita* (§6b: un glifo que nadie va a montar no se pide).
   *
   * ── §6b.1 · LOS NÚMEROS ─────────────────────────────────────────────
   * Hoja **9 × 12,5** (perímetro 43) + **dos renglones de 5** ⇒ masa **53,0
   * (+14 %)**, dentro de la banda 39,4–53,4 · **3 trazos** · interior de la
   * hoja **6,2 px** a 21, holgado sobre el piso de 2,5.
   * ⚠️ **Está cerca del techo de la banda y se declara**: una hoja es cara en
   * trazo, y bajarla más la volvía un rectángulo sin renglones — o sea,
   * `documentos` otra vez.
   *
   * ── §6b.6 · NO ES GLIFO DE CONTROL ──────────────────────────────────
   * Lleva huella: es un papel **de la mascota**, familia de `carnet` y
   * `certificaciones`.
   *
   * ── ✅ GATE POR ÍCONO **CERRADO** — firma del founder (7-sep-2026) ──────
   * **Y el riesgo declarado se resolvió con su vecindad REAL, no con una
   * opinión:** en la bóveda, a 21 px y en la MISMA pantalla, `papel`
   * (Exámenes) contra `documentos` (Papeles de e-PetPlace) — una hoja vertical
   * con renglones contra dos rectángulos apilados. **Se distinguen.**
   * *La vara no fue una fila de contacto: fue la pantalla donde viven juntos.*
   *
   * 🔴 **Y LO QUE EVITA QUE SE LEA «LISTA» ES EL MARCO**, que es justo lo que
   * el riesgo señalaba: *sin el rectángulo, los renglones quedan sueltos — y
   * renglones sueltos SON una lista.* El marco no es decoración: es lo que
   * hace que esto sea una hoja.
   *
   * ⚠️ **Y la tentación de sacarlo es real y está medida:** la masa quedó en
   * **53,0 (+14 %)**, casi contra el techo de la banda, y el marco es la mitad
   * de ese número. *El día que alguien necesite bajar la masa, lo primero que
   * va a mirar es el rectángulo* — por eso su gate lo mide y sale rojo.
   */
  /**
   * 🔴 **LUPA — la entrada de búsqueda (S113-B · fase 3).**
   *
   * Nace porque **no existía**, y C lo midió: la entrada usaba `explorar`, que
   * **es una BRÚJULA**. *Un glifo que significa otra cosa es peor que ninguno:
   * el que no está deja a la persona leyendo la etiqueta; el que miente la
   * manda al lugar equivocado con confianza.*
   *
   * ── §6b.2 · METÁFORAS OCUPADAS, y el censo cambió la GEOMETRÍA ───────
   * **`info`, `checkEnCirculo` y `explorar` son los TRES un círculo de
   * `r ≈ 8.4–8.6` centrado en `(12,12)`.** Ésa es la colisión real, y no es de
   * concepto: es de forma. Un cuarto círculo del mismo tamaño y en el mismo
   * centro **entra a esa familia** y a 21 px se pierde adentro.
   *
   * ── §6b.3 · LAS DOS VARIANTES, Y LA SEGUNDA CAYÓ POR NÚMERO ─────────
   * · **V2 «del tamaño de la familia»** (`r = 8.4`, para ser coherente con sus
   *   tres vecinos) — ✗ **no entra en banda con mango**: 57,8 (**+25 %**) con
   *   un mango corto, 59,8 (+29 %) con el diagonal. *La coherencia con la
   *   familia circular es imposible en cuanto le agregás el mango* — y el mango
   *   es lo único que la distingue de sus tres vecinos. **El número dice lo
   *   mismo que el ojo: no puede ser una más de esa familia.**
   * · **✅ V1 «lente chica y descentrada»**: `r = 6.0` —**29 % más chica**— y
   *   centrada en `(9.8, 9.8)` en vez de `(12,12)`. *Se sale de la familia por
   *   tamaño Y por posición, no sólo por el mango.*
   *
   * ── §6b.1 · LOS NÚMEROS ─────────────────────────────────────────────
   * Masa **44,8 (−4 %)** contra la vara de `vacuna` (46,4 · banda 39,4–53,4) ·
   * **2 trazos** (§6b pide 2–4) · interior de la lente **8,8 px** a 21, muy
   * holgado sobre el piso de 2,5.
   *
   * ── §6b.6 · ES GLIFO DE CONTROL ⇒ SIN HUELLA ────────────────────────
   * **Declarado en el pedido, no descubierto en el gate.** *Buscar es un acto
   * de la interfaz, no de la mascota* — y una huella adentro de una lente se
   * leería como un animal atrapado en un aumento. (Ley 9, alcance S98: *«en un
   * glifo de control no hay mascota, hay interfaz»*.)
   *
   * ⚠️ **GATE POR ÍCONO PENDIENTE** (§6b.5). Su riesgo declarado: **a 21 px,
   * junto a `info` y `checkEnCirculo`, sigue siendo un círculo** — lo que lo
   * salva es el mango, igual que al `papel` lo salva su marco. Por eso los tres
   * van juntos en la hoja de contacto.
   */
  lupa: ({ tinta }) => (
    <>
      <Circle cx={9.8} cy={9.8} r={6} {...trazo(tinta)} />
      <Path d="M14.04 14.04 19.04 19.04" {...trazo(tinta)} />
    </>
  ),

  papel: ({ tinta, huella }) => (
    <>
      <Path d="M7.2 2.6h11.2v15.4H7.2Z" {...trazo(tinta)} />
      <Path d="M9.7 7.6h6.2M9.7 11.3h6.2" {...trazo(tinta)} />
      <Huella color={huella} x={2.2} y={13.6} escala={0.32} />
    </>
  ),

  /* ⏪ **REDIBUJADO S116-B lote 2b — firma de la mesa: «documentos y copiar
   * se diferencian por esquina doblada vs. dos hojas».**
   * 🔴 **LA ORDEN CORRIGE UN DEFECTO QUE SU PROPIA ENTRADA HABÍA PREDICHO
   * Y ACEPTADO.** `copiar` nació en S103-B **mirroreando la geometría de
   * este glifo a propósito** —«un hermano se construye con la métrica del
   * hermano»— y declaró el riesgo con su condición de muerte escrita:
   * *«los separan DOS cosas: la huella (uno la lleva, el otro no) y que
   * jamás comparten unidad de barrido … si el founder los ve juntos a
   * 21 px y no los separa, el que se mueve es éste»*.
   * **La letra §1.1 le sacó la primera de las dos cosas**, y la hoja de
   * contacto de este lote los puso juntos por primera vez: exactamente las
   * dos condiciones que aquella entrada nombró. *El riesgo no apareció: se
   * cobró como estaba escrito, tres sesiones después.*
   * ⇒ este glifo se queda con **el DOBLEZ**, que es lo que dice «papeles
   * archivados», y `copiar` con el apilado plano.
   * ⚠️ **VECINO NUEVO QUE ESTO DESPIERTA, declarado: `presupuesto`**, que
   * ya es *«documento con esquina doblada»*. **Los separa el conteo**
   * —aquél es UNA hoja con líneas de texto adentro; éste son DOS y va
   * vacío— y eso es más frágil que un doblez. Van juntos en la hoja. */
  documentos: ({ tinta }) => (
    <>
      <Path d="M9.4 3.6h6.2l3.4 3.4v8.4H9.4Z" {...trazo(tinta)} />
      <Path d="M15.6 3.6v3.4h3.4" {...trazo(tinta)} />
      <Path d="M14.6 15.4v4.8H4.8V8.4h2.6" {...trazo(tinta)} />
    </>
  ),
  // ── S91-B · EL SOBRE — hoy `correo`, EN RESERVA DECLARADA (sin
  // consumidores). Silueta LIBRE en todo el registry (rectángulo + V) y
  // la más legible del par: la V es un gesto grande, no un detalle.
  // ⚠️ LO QUE ERA SU RIESGO ES HOY SU RAZÓN DE SER. En el gate se declaró
  // que a 21px «se lee nítido y se lee CORREO» —confirmado rasterizando,
  // no supuesto— y eso lo descalificaba para Documentos. La firma del
  // founder lo dio vuelta: se retira SIN cablear y queda para el centro de
  // avisos. **El dibujo no cambió ni un punto; cambió qué nombra.**
  correo: ({ tinta, huella }) => (
    <>
      <Path d="M6.5 5.5H21V16H6.5Z" {...trazo(tinta)} />
      <Path d="M6.5 5.5 13.75 11.5 21 5.5" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={14.8} escala={0.3} />
    </>
  ),
  /* 🔴 **REDIBUJADO (S116-B) — y no es un cambio de gusto: el nombre y el
   * dibujo decían cosas distintas.** Hasta hoy `receta` dibujaba una
   * CÁPSULA, o sea un medicamento. El §② del lote 0 lo midió abriendo el
   * dibujante y no el nombre — *«el dibujo es una cápsula partida en
   * diagonal … se llama receta»* — y el mock pide los dos ítems por
   * separado (#20 Medicamento · #22 Receta). **Una receta no es lo que se
   * toma: es el papel que lo indica**, y la propia entrada vieja de esta
   * capa ya lo había escrito para explicar su color (*«la receta no vende,
   * indica»*). La cápsula se mudó entera a `medicamento`.
   *
   * EL DIBUJO: hoja + una línea de encabezado + LA CÁPSULA ADENTRO. La
   * cápsula chica es lo que lo separa de todo lo demás — es el único papel
   * del set con un objeto adentro.
   * ⚠️ **VECINO DECLARADO, el más cercano que tiene: `papel`** (hoja
   * vertical + dos líneas + huella externa en la misma esquina). Los
   * separa la cápsula y nada más.
   * ⏪ **SU HOJA DE CONTACTO LO COBRÓ DOS VECES (S116-B), y la segunda
   * cambió el dibujo de raíz.**
   *  · **Primera:** llevaba además una línea de encabezado y a 21 px la
   *    cápsula se cerraba y se leía como una segunda línea. Murió la línea
   *    y creció la cápsula.
   *  · **Segunda, montado AL LADO DE `papel` como §6b manda:** seguían
   *    siendo **el mismo rectángulo vertical con la misma huella magenta
   *    en la misma esquina**. 🔴 *El riesgo que este párrafo declaraba no
   *    era hipotético: se materializó, y sólo se vio montándolos juntos —
   *    por separado los dos se leían bien.*
   * ⇒ **LA CURA NO FUE AGRANDAR LA CÁPSULA OTRA VEZ: fue SACARLA DE LA
   * HOJA.** La cápsula ahora cruza el borde derecho y asoma. Así la
   * SILUETA deja de ser un rectángulo — y una silueta es lo único que
   * sobrevive a 21 px. *Dos glifos que se distinguen por su interior se
   * confunden al achicarse; dos que se distinguen por su contorno, no.*
   *
   * ⚠️ **CONSUMIDORES: NO se tocan y es correcto.** `apps/cliente/src/lib/
   * papeles.ts` monta `receta` para el papel de receta — que es
   * exactamente lo que ahora dibuja. *El redibujo no rompe a nadie: le da
   * la razón al consumidor que ya estaba bien.* */
  /* ⏪ **REDIBUJADO S116-B lote 2b — firma de la mesa: «Rx como el mock».**
   * Este glifo ya venía de un redibujo: en el lote 2 dejó de ser una
   * CÁPSULA (que se mudó a `medicamento`) y pasó a ser una hoja con la
   * cápsula asomando. **La hoja con cápsula resolvía el choque contra
   * `papel` por SILUETA, y el Rx lo resuelve mejor**: no hay ningún otro
   * papel del set con letras adentro.
   * EL DIBUJO: hoja con esquinas + la **R** con la pata cruzada en
   * diagonal — el símbolo de prescripción, que es lo que el mock monta.
   * ⚠️ **EL RIESGO QUE ESTE PÁRRAFO DECLARÓ SE COBRÓ EN LA MISMA HOJA, y
   * no fue la panza: fue la PATA.** El símbolo se dibujó con la diagonal
   * saliendo de la pata derecha de la R, y a 21 px **la diagonal y la pata
   * se leían como un solo trazo ⇒ quedaba una «R» a secas**, sin el rasgo
   * que la vuelve prescripción. ⇒ **la R se angosta y la diagonal se cruza
   * con una segunda barra corta**, que es lo que el ℞ real tiene: una
   * tachadura, no un apéndice. *Dos trazos que se cruzan sobreviven a la
   * escala; uno que continúa a otro, no.*
   * ⚠️ **LO QUE SIGUE EN RIESGO, declarado: la panza.** Mide ~2,1 px de
   * aire a 21 px. Si se cierra queda una mancha con una tachadura — y la
   * salida sigue siendo la hoja con la cápsula asomando del lote 2, que
   * está escrita arriba para no re-descubrirla. */
  receta: ({ tinta }) => (
    <>
      <Path d="M7 3.4h10.4a1.6 1.6 0 0 1 1.6 1.6v14a1.6 1.6 0 0 1-1.6 1.6H7a1.6 1.6 0 0 1-1.6-1.6V5a1.6 1.6 0 0 1 1.6-1.6Z" {...trazo(tinta)} />
      <Path d="M8.6 16.8V8.2h2.2a2.1 2.1 0 0 1 0 4.2H8.6" {...trazo(tinta)} />
      <Path d="M10.6 12.4 15.4 17.2" {...trazo(tinta)} />
      <Path d="M11.4 15.4 14.6 12.2" {...trazo(tinta)} />
    </>
  ),

  // ── FISCAL — LA FACTURA CON BORDE DENTADO (S84-B21) ────────────────
  // El objeto fiscal de la región no es "un papel": es LA FACTURA — el
  // RUC y el NIT existen para emitirla. Y el BORDE DENTADO es todo el
  // trabajo, igual que el retrato en `documento`: el idioma "rectángulo
  // con renglones" ya está ocupado CINCO veces en este registry
  // (`presupuesto`, `bitacora`, `caso`, `pagos` —que es un billete— y
  // el propio `documento`). Sin el dentado sería la sexta y a 21px no se
  // distinguiría de ninguna. Es el mismo descarte que hice en B4 con la
  // tarjeta de contacto y en B20 con la cédula lisa.
  fiscal: ({ tinta, huella }) => (
    <>
      <Path
        d="M6.2 3.4h11.6v15.9l-1.9-1.4-1.9 1.4-1.9-1.4-1.9 1.4-1.9-1.4-1.9 1.4V3.4Z"
        {...trazo(tinta)}
      />
      <Path d="M9.2 7.6h5.6M9.2 11.2h5.6" {...trazo(tinta)} />
      <Huella color={huella} x={3.1} y={13.4} escala={0.26} />
    </>
  ),

  // ── BANCARIO — EL EDIFICIO CON COLUMNAS (S84-B21) ──────────────────
  // La otra salida obvia era una TARJETA, y se cae por lo mismo que todo
  // lo demás: una tarjeta es un rectángulo ancho y **`pagos` ya ES un
  // rectángulo ancho con marcas** — a 21px serían el mismo dibujo, y
  // encima vecinos temáticos, que es la peor colisión posible (Ley 12
  // existe para que el ojo SEPARE cosas que significan distinto).
  // El edificio con frontón y columnas no tiene un solo pariente en el
  // registry: cero rectángulos horizontales, cero círculos grandes.
  bancario: ({ tinta, huella }) => (
    <>
      <Path d="M3.6 9.2 12 4.4l8.4 4.8" {...trazo(tinta)} />
      <Path d="M5.8 9.2v7.4M10 9.2v7.4M14 9.2v7.4M18.2 9.2v7.4" {...trazo(tinta)} />
      <Path d="M3.6 19.6h16.8" {...trazo(tinta)} />
      <Huella color={huella} x={9.4} y={11.2} escala={0.24} />
    </>
  ),

  // ── DOCUMENTO · CANDIDATO A — LA CÉDULA CON RETRATO (S84-B20) ──────
  // Rectángulo con un RETRATO (el círculo chico) y dos renglones. El
  // retrato es todo el trabajo: es lo que separa una IDENTIFICACIÓN de un
  // documento cualquiera, y es lo que la distingue del idioma
  // "rectángulo con renglones" que este registry YA tiene ocupado TRES
  // VECES (`presupuesto` con su esquina doblada, `bitacora` con su lomo
  // y, de cerca, `caso`). Sin el retrato sería la cuarta y a 21px no se
  // distinguiría de ninguna — el mismo descarte que mató a la tarjeta de
  // contacto en B4.
  //
  // ⚠️ LA HUELLA NO ES EL RETRATO, Y ES DELIBERADO: ponerla ahí diría
  // exactamente lo que la orden señala como defecto de `carnet` — que el
  // documento es del animal. Va CHICA Y AL COSTADO, como en `bitacora`:
  // presencia del set, no sujeto del documento.
  documento: ({ tinta, huella }) => (
    <>
      <Path
        d="M4.4 5.6h15.2a1.5 1.5 0 0 1 1.5 1.5v9.8a1.5 1.5 0 0 1-1.5 1.5H4.4a1.5 1.5 0 0 1-1.5-1.5V7.1a1.5 1.5 0 0 1 1.5-1.5Z"
        {...trazo(tinta)}
      />
      <Circle cx={8.6} cy={10.6} r={2.1} {...trazo(tinta)} />
      <Path d="M13.4 9.9h4.4M13.4 13.1h4.4" {...trazo(tinta)} />
      <Huella color={huella} x={4.6} y={12.6} escala={0.26} />
    </>
  ),

  // ☠️ DOCUMENTO · CANDIDATO B — EL SELLO (S84-B20) MURIÓ EN SU GATE
  //    (S85, 3-ago). Era un sello sobre una hoja: nombraba la VALIDACIÓN
  //    en vez de la identidad, con el argumento de que estos documentos
  //    EXISTEN PARA SER VERIFICADOS (el veredicto de admin de §14.2).
  //    Ganó A —la cédula con RETRATO—, que es lo que separa una
  //    identificación de un papel cualquiera.
  //
  //    LA FIRMA QUE LO RETIRA, y por qué recién ahora: el gate de 21px
  //    corrió en la mesa del 3-ago y el founder dijo, literal, «los
  //    glifos: no les vi ningún problema». Hasta ese día el sello estaba
  //    vivo A PROPÓSITO —C lo dejó sin consumidor para que el founder
  //    pudiera comparar los dos candidatos CON EL DEDO en esa fila—, así
  //    que retirarlo antes habría sido romper el instrumento del gate,
  //    no limpiar una opción muerta. Corrido el gate, el instrumento
  //    sobra y el perdedor no sobrevive: un candidato perdedor vivo es
  //    una opción que alguien va a creer disponible.
  //
  //    SU RIESGO, que queda registrado porque sigue siendo vara para el
  //    próximo glifo: a 21px un sello circular con muescas compite con
  //    el círculo de `ayuda` y el de `preferencias` — el mismo riesgo
  //    que hundió al candidato B de `contacto`. Si algún día hace falta
  //    un glifo de VALIDACIÓN, su dibujo vive en `36fd242` y este
  //    párrafo dice contra qué tiene que defenderse.

  // ── CONTACTO · CANDIDATO A — EL GLOBO (S84-B4) ─────────────────────
  // Nombra EL ACTO de contactar, no el canal: en un globo caben una
  // llamada, un WhatsApp, un correo y un mensaje del sitio, y ninguno
  // de los cuatro queda afuera. La huella va ADENTRO — quien escribe
  // es la familia, y escribe por su mascota (regla madre §1).
  // POR QUÉ NO ES UNA TARJETA DE DATOS, que era el candidato obvio: el
  // idioma "rectángulo con líneas cortas adentro" YA ESTÁ OCUPADO TRES
  // VECES en este mismo registry (`presupuesto`, `bitacora` y, de
  // cerca, `caso`). A 21px una cuarta sería indistinguible, y un glifo
  // que se confunde con otro derrota exactamente a la Ley 12 que este
  // glifo existe para cumplir.
  contacto: ({ tinta, huella }) => (
    <>
      <Path
        d="M6.5 4.5h11A2.5 2.5 0 0 1 20 7v6a2.5 2.5 0 0 1-2.5 2.5h-6l-3.6 3v-3H6.5A2.5 2.5 0 0 1 4 13V7a2.5 2.5 0 0 1 2.5-2.5Z"
        {...trazo(tinta)}
      />
      <Huella color={huella} x={7.7} y={5.7} escala={0.36} />
    </>
  ),

  // ☠️ CONTACTO · CANDIDATO B (EL ALCANCE) MURIÓ EN SU GATE (S84-B5).
  // Tres arcos saliendo de un punto, con la huella de origen. La razón
  // de la firma es de LEY y por eso queda escrita: §1 manda dibujar el
  // OBJETO del oficio — el globo es un objeto, "el alcance" es una
  // idea. Su código se va (Ley 37: lo que muere, muere con su
  // maquinaria) y su porqué se queda, para que nadie lo re-proponga
  // creyendo que nunca se miró.

  // ── GLIFOS DE CONTROL (S82-B r7) ───────────────────────────────────
  // SIN HUELLA, y el criterio VIAJÓ CON LA REFERENCIA (no lo inventa
  // esta sesión — literal del archivo del founder): *"Trazo 1.9, sin
  // huella: no son objetos del oficio, son controles."* Un lápiz no
  // tiene capa y una huella adentro de un lápiz no diría nada (Chanel).
  // CHOQUE DECLARADO, no resuelto en silencio: Ley 12 pide "objeto del
  // oficio + UNA huella rellena" — su letra habla de los glifos de
  // OFICIO; la categoría de control es §6bis de DIRECCION_ARTE,
  // PENDIENTE DESDE S78 (el glifo del micrófono la pidió primero). Estos
  // dos NO la fundan: esperan el gate por ícono y recién ahí se escribe
  // (regla 80). El `huella` del pincel queda sin usar a propósito.
  // Convergencia medida: el `stroke-width: 1.9` de la referencia es
  // EXACTAMENTE el TRAZO de este registry — cero traducción.
  //
  // El lápiz: cuerpo diagonal + la punta que toca la base. Se conserva
  // la geometría de la referencia y se le suma el CORTE de la punta
  // (la línea corta del bisel) — sin él, a 21px la punta se lee como un
  // triángulo mudo. El `carnet` (S58) usa un lápiz COMO OBJETO con su
  // huella: son distintos por rol, y por eso este no lo reusa.
  lapiz: ({ tinta }) => (
    <>
      <Path d="M15.5 4.5 19.5 8.5 8 20H4v-4z" {...trazo(tinta)} />
      <Path d="M13.6 6.4 17.6 10.4" {...trazo(tinta)} />
    </>
  ),
  /* EL FILTRO — EL EMBUDO, y la elección entre las dos formas «clásicas» no
     es de gusto: **dicen cosas distintas.**
       · **el embudo** = entra mucho, sale poco ⇒ *FILTRAR*.
       · **las tres barras con perillas** = mover valores ⇒ *AJUSTAR* (es el
         `tune` de Material, y en esta casa ese trabajo ya lo hacen
         `SliderPrecio` y `StepperCantidad`).
     El founder pidió *«el clásico de filtro»* y el clásico de FILTRAR es el
     embudo. *Montar el de ajustar diría «cambiá valores» donde la pantalla
     dice «mostrame menos».*

     **Sobrevive a 21 px por construcción:** es **una sola silueta cerrada y
     grande** —sin detalle interno que se empaste— y su rasgo (el ancho que
     se angosta hacia abajo) es geometría, no trazo fino. Ley 9.

     Sin huella: familia de CONTROL, como `lapiz` (ver el tipo).
     ⚠️ **GATE POR ÍCONO PENDIENTE (§2.9)** — y con el mismo límite declarado
     que sus vecinos de esta vuelta: **en este entorno no hay rasterizador de
     SVG**, así que no se pudo mirar chico sin publicar. */
  filtro: ({ tinta }) => (
    <Path d="M4.2 5.4h15.6l-6.1 7.2v5.1l-3.4 1.9v-7z" {...trazo(tinta)} />
  ),
  // Compartir: la flecha que SALE de la bandeja (convención de
  // plataforma iOS/Android — el trazo de la referencia, literal). La
  // bandeja abierta arriba dice "sale de acá", jamás un nodo-y-aristas
  // (ese grafo es de red social, no de un expediente que se comparte).
  compartir: ({ tinta }) => (
    <>
      <Path d="M12 15V4" {...trazo(tinta)} />
      <Path d="M8 7.6 12 3.6l4 4" {...trazo(tinta)} />
      <Path d="M5 14v5.5h14V14" {...trazo(tinta)} />
    </>
  ),
  // Descargar: EL HERMANO EXACTO DE `compartir`, con la flecha invertida
  // — la que CAE a la bandeja en vez de salir de ella. La paridad es
  // literal y deliberada: **la bandeja es el MISMO path, byte por byte**
  // (`M5 14v5.5h14V14`), y solo el asta y la punta se dan vuelta. Dos
  // acciones que son la ida y la vuelta del mismo objeto tienen que
  // leerse como pareja; si la bandeja divergiera, el par se rompería sin
  // que nada fallara (19.9: lo que se copia diverge — acá se copia A
  // PROPÓSITO y queda dicho, para que el día que una cambie, cambien las
  // dos).
  //
  // La métrica, contra su vecino: `compartir` lleva el asta de y15 a y4
  // con la punta en 3.6; acá el asta va de 3.6 a 13.4 con la punta en
  // 13.4 — **la punta se detiene ANTES del borde de la bandeja (y14)**,
  // no la penetra: la flecha *cae hacia* el papel guardado. Los brazos
  // conservan las 4 unidades del vecino, así que a 21px la punta pesa lo
  // mismo en los dos.
  //
  // Sin huella, como todo control (§6bis sigue pendiente): `huella`
  // queda sin usar a propósito.
  // Copiar: el espejo de `documentos` sin su huella (ver el tipo). La hoja
  // de adelante es un rectángulo cerrado; la de atrás asoma arriba-izquierda
  // y se dibuja SOLO con sus dos aristas visibles —el borde superior y el
  // izquierdo—, igual que el apilado dibuja las suyas: una hoja tapada no
  // muestra el contorno que queda detrás, y trazarlo entero la volvería un
  // marco flotante en vez de una hoja atrás.
  //
  // Las esquinas redondeadas salen del `strokeLinejoin: 'round'` de
  // `trazo()`, como en TODO el set — no de un `rx`. Es lo que lo vuelve
  // hermano y no injerto: mismo peso (1.9), mismos remates, misma grilla.
  /* ⏪ **RE-ENCUADRADO S116-B lote 2b (mismo par que `documentos`).** El
   * apilado se conserva —es el dibujo correcto para «copiar»— y lo que
   * cambia es que **ahora es el único del par que lo tiene**: su hermano
   * se llevó el doblez. *No se le agregó nada para distinguirlo; se le
   * quitó al otro lo que compartían.* Las dos hojas crecieron para ocupar
   * la grilla completa, que es lo que la orden de tamaño óptico único
   * pide y lo que el aire de la huella retirada permitió. */
  copiar: ({ tinta }) => (
    <>
      <Path d="M8.6 3.8h10.6v10.6H8.6Z" {...trazo(tinta)} />
      <Path d="M15.4 14.4v5.8H4.8V9.6h3.8" {...trazo(tinta)} />
    </>
  ),
  descargar: ({ tinta }) => (
    <>
      <Path d="M12 3.6v9.8" {...trazo(tinta)} />
      <Path d="M8 9.4 12 13.4l4-4" {...trazo(tinta)} />
      <Path d="M5 14v5.5h14V14" {...trazo(tinta)} />
    </>
  ),
  /* S104-B · la almendra + la pupila. Simétrica en los dos ejes: el ojo
   * es la única figura del set que no tiene "arriba" propio, así que
   * cualquier asimetría se lee como error de dibujo y no como estilo. */
  ojo: ({ tinta }) => (
    <>
      <Path d="M2.8 12C2.8 12 6.9 6.2 12 6.2S21.2 12 21.2 12 17.1 17.8 12 17.8 2.8 12 2.8 12Z" {...trazo(tinta)} />
      <Path d="M14.7 12a2.7 2.7 0 1 1-5.4 0 2.7 2.7 0 0 1 5.4 0Z" {...trazo(tinta)} />
    </>
  ),
  /* La MISMA almendra, byte a byte, + la barra. **La pupila se suelta a
   * propósito** (ver la entrada del tipo): a 21 px tres trazos compiten y
   * la barra ya dice apagado sola. Copiar la almendra y no re-dibujarla es
   * lo que garantiza que los dos hermanos sean la misma silueta. */
  ojoTachado: ({ tinta }) => (
    <>
      <Path d="M2.8 12C2.8 12 6.9 6.2 12 6.2S21.2 12 21.2 12 17.1 17.8 12 17.8 2.8 12 2.8 12Z" {...trazo(tinta)} />
      <Path d="M4.5 4.5 19.5 19.5" {...trazo(tinta)} />
    </>
  ),

  /* ══════════════════════════════════════════════════════════════════
   *  S116-B · LOS DOCE GLIFOS DE CONTROL DEL MOCK
   *  Familia de CONTROL ⇒ **sin huella** (`N27`). Trazo 1.9, remates
   *  redondeados, `fill: none`, grilla 24. Gate a 21 px PENDIENTE.
   * ══════════════════════════════════════════════════════════════════ */

  /** #12 del mock. El `+` desnudo. **Es el único glifo del set que no
   *  dibuja un objeto y está bien**: los controles de la casa ya viven así
   *  (`compartir` y `descargar` son flechas, no objetos). La Ley §1 manda
   *  dibujar el objeto DEL OFICIO; acá no hay oficio. */
  agregar: ({ tinta }) => (
    <>
      <Path d="M12 3.7v16.6M3.7 12h16.6" {...trazo(tinta)} />
    </>
  ),
  /** #13 del mock. El `−`. **Nace porque `papelera` lo estaba haciendo y
   *  su dibujo dice otra cosa** — su propia entrada declaraba el uso (*«el
   *  `−` del stepper con cantidad 1»*) sobre un TACHO. Uso y dibujo no
   *  coincidían, y ésa es exactamente la clase que la Ley 12 persigue.
   *  ⚠️ **Mide exactamente lo mismo que la barra de `agregar`** (13.6 de
   *  largo, mismo centro): son un par y tienen que leerse como par. */
  quitar: ({ tinta }) => (
    <>
      <Path d="M3.7 12h16.6" {...trazo(tinta)} />
    </>
  ),
  /** #15 del mock. El corazón. **Censo: cero vecinos** — `seguros` es un
   *  escudo (hombros rectos, punta abajo) y el corazón tiene dos lóbulos
   *  arriba; a 21 px se separan por el tope, que es el rasgo que ninguno
   *  de los dos puede copiar.
   *  ⚠️ SIN HUELLA aunque lo que se marque sea una mascota: **lo que el
   *  glifo dice es el ACTO de marcar**, no de quién es lo marcado. Mismo
   *  criterio con el que `lapiz` no lleva huella editando un expediente. */
  favorito: ({ tinta }) => (
    <>
      <Path
        d="M12 20.1 4.9 13a4.45 4.45 0 0 1 6.3-6.3l.8.8.8-.8A4.45 4.45 0 0 1 19.1 13Z"
        {...trazo(tinta)}
      />
    </>
  ),
  /* #16 del mock. 🔴 **ES LA ESTRELLA DE `personalidad`, MUDADA BYTE A
   * BYTE** — no se re-dibujó, y es deliberado: su geometría fue MEDIDA y
   * la medición sigue siendo válida. `r/R = 0.5` lo decidieron los 21 px,
   * no el gusto (la estrella clásica abre 36° y a 2 px de la punta mide
   * 1,30 px, **menos que el trazo de 1,66 que la dibuja** ⇒ cinco bultos;
   * con 0.5 abre 52,5° y mide 1,97). Re-dibujarla habría tirado eso.
   *
   * **LA COLISIÓN SE CIERRA ACÁ, Y SU PROPIA ENTRADA VIEJA ESCRIBIÓ CÓMO:**
   * *«una estrella es la metáfora universal de "favorito" y de
   * "calificación" … el día que exista un favorito, esto se revisa antes
   * que aquello, porque llegó primero y va a parecer que califica»*.
   * Ese día llegó: el mock pide los dos. Firma del founder (letra §1.9):
   * **la estrella es Calificación; Personalidad recibe glifo nuevo.**
   * *La estrella no se repartió por votación: la entrada la reservó por
   * escrito hace tres sesiones y hoy se cobra.* */
  calificacion: ({ tinta }) => (
    <>
      <Path
        d="M12.00 3.70L14.61 8.98L20.44 9.83L16.22 13.94L17.21 19.74L12.00 17.00L6.79 19.74L7.78 13.94L3.56 9.83L9.39 8.98Z"
        {...trazo(tinta)}
      />
    </>
  ),
  /** #34 del mock. El reloj. 🔴 **NACE CONTRA UNA EVITACIÓN ESCRITA, y por
   *  eso se declara:** la entrada de `wearables` dice *«la silueta se
   *  parece a un reloj, y un reloj puede leerse como "hora". Lo desambigua
   *  la huella adentro»*. Ese criterio **sigue vivo y ahora corre en las
   *  dos direcciones**: `wearables` lleva huella y correas; `hora` no lleva
   *  ninguna de las dos. *La desambiguación que se inventó para uno es la
   *  que hoy deja nacer al otro.*
   *  ⚠️ **RIESGO MEDIDO Y DECLARADO — es el TERCER círculo del set.**
   *  `ayuda` (círculo + 4 rayos rectos FUERA), `info` (círculo + ⓘ) y éste
   *  (círculo + dos agujas en L ADENTRO). Los tres a 21 px es lo primero
   *  que hay que mirar en el gate. Lo que los separa es dónde está el
   *  detalle: afuera · vertical · en ángulo. */
  hora: ({ tinta }) => (
    <>
      <Circle cx={12} cy={12} r={8.4} {...trazo(tinta)} />
      <Path d="M12 7.2V12l3.3 2" {...trazo(tinta)} />
    </>
  ),
  /** #45 del mock. **Su disparo tiene tres sesiones de historia:** el
   *  dictado clínico existe desde S70 y el botón se llama *«Dictar la
   *  consulta»* desde S78 — el glifo nunca existió y el registry no tenía
   *  ninguna mención. Cápsula + arco + pie.
   *  ⚠️ Vecino declarado: `receta` (hoy `medicamento`) también es una
   *  cápsula. **Los separa el eje** — la del medicamento va en DIAGONAL y
   *  partida por su línea; ésta va VERTICAL, entera, y apoyada en un pie. */
  microfono: ({ tinta }) => (
    <>
      <Path d="M12 3.4a2.8 2.8 0 0 1 2.8 2.8v5.4a2.8 2.8 0 0 1-5.6 0V6.2A2.8 2.8 0 0 1 12 3.4Z" {...trazo(tinta)} />
      <Path d="M6.8 11.2a5.2 5.2 0 0 0 10.4 0" {...trazo(tinta)} />
      <Path d="M12 16.4v4.2M9.4 20.6h5.2" {...trazo(tinta)} />
    </>
  ),
  /* #47 del mock. **El auricular ROTADO 135°** — el universal de colgar.
   * 🔴 **Y la rotación es el dibujo, no un efecto:** el registry no tiene
   * ningún teléfono, así que el glifo tuvo que traer los dos (el auricular
   * y su giro). *Un auricular derecho diría «llamar»; lo que dice «colgar»
   * es exactamente el ángulo.*
   * Se monta con `<G rotation>` y no con un path pre-rotado a propósito:
   * el path es el auricular canónico y queda legible para quien lo lea —
   * un path rotado a mano es geometría que nadie puede volver a tocar. */
  colgar: ({ tinta }) => (
    <G rotation={135} origin="12, 12">
      <Path
        d="M15.6 13.7l-1.7 1.7a11.2 11.2 0 0 1-5.5-5.5l1.7-1.7-2.2-3.5-2.5 1C4.7 11 12.6 18.9 18.3 18.2l1-2.5Z"
        {...trazo(tinta)}
      />
    </G>
  ),
  /** #48 del mock. La imagen. 🔴 **EL CENSO LE CAMBIÓ LA FORMA:** el dibujo
   *  obvio son dos rectángulos apilados, y **`copiar` y `documentos` YA son
   *  dos hojas apiladas** — a 21 px habrían sido el mismo glifo con otro
   *  nombre. ⇒ es UNO, y lo que lo distingue de una hoja es que **tiene
   *  contenido**: horizonte quebrado + sol. *Una hoja está vacía; una foto
   *  no puede estarlo.* */
  galeria: ({ tinta }) => (
    <>
      <Path d="M4.6 5.4h14.8a1.4 1.4 0 0 1 1.4 1.4v10.4a1.4 1.4 0 0 1-1.4 1.4H4.6a1.4 1.4 0 0 1-1.4-1.4V6.8a1.4 1.4 0 0 1 1.4-1.4Z" {...trazo(tinta)} />
      <Path d="M3.2 15.6l4.6-4.4 3.4 3.2 2.8-2.6 6.8 6.4" {...trazo(tinta)} />
      <Circle cx={8.4} cy={9} r={1.4} {...trazo(tinta)} />
    </>
  ),
  /** #49 del mock. Los dos arcos en ciclo. 🔴 **NO DIBUJA LA CÁMARA, y es
   *  decisión:** `foto` ya es la cámara, y el control vive DENTRO de la
   *  cámara abierta — el contexto ya dijo de qué se voltea. *Repetir el
   *  cuerpo de la cámara adentro de la cámara es la clase que la Ley 12
   *  enmendada S71 nombra: el glifo marca lo que VARÍA dentro de su unidad
   *  de barrido, y acá lo que varía es el giro.* */
  voltear: ({ tinta }) => (
    <>
      <Path d="M4.6 12a7.4 7.4 0 0 1 12.5-5.3" {...trazo(tinta)} />
      <Path d="M19.4 12a7.4 7.4 0 0 1-12.5 5.3" {...trazo(tinta)} />
      <Path d="M17.3 3.6v3.4h-3.4M6.7 20.4v-3.4h3.4" {...trazo(tinta)} />
    </>
  ),
  /** #51 del mock. La puerta con la flecha saliendo. **Censo: cero
   *  vecinos** — la casa tiene `hogar` (casa con techo a dos aguas) y
   *  `guarderia` (casa con arco), las dos con huella; esto es un marco
   *  abierto por un lado, sin techo. Lo que dice «salir» no es la puerta:
   *  es la flecha CRUZÁNDOLA hacia afuera. */
  salir: ({ tinta }) => (
    <>
      <Path d="M13.8 4.4H6.4a1.8 1.8 0 0 0-1.8 1.8v11.6a1.8 1.8 0 0 0 1.8 1.8h7.4" {...trazo(tinta)} />
      <Path d="M11.2 12h9.2" {...trazo(tinta)} />
      <Path d="M17.2 8.8 20.4 12l-3.2 3.2" {...trazo(tinta)} />
    </>
  ),
  /** #52 del mock. Los tres puntos. **Horizontal y no vertical, con su
   *  razón:** el mock lo monta al final de una FILA (la acción de más de un
   *  ítem de lista), y un punto suspensivo vertical pide una columna. Los
   *  tres puntos se dibujan con el propio trazo redondeado —`M x y v.3`—,
   *  que es el molde que `info` y `foto` ya usan para su punto: **el punto
   *  del set mide el trazo del set**, jamás un radio inventado. */
  mas: ({ tinta }) => (
    <>
      <Path d="M4.9 12v.3M12 12v.3M19.1 12v.3" {...trazo(tinta)} />
    </>
  ),
  /** #43 del mock. LA LLAVE. 🔴 **No es un candado, y el censo es la razón
   *  entera:** `candado` existe, su significado declarado es *«esta
   *  conversación quedó en lectura»* (postventa), y su entrada dice que
   *  **no lleva ojo de cerradura a propósito porque a 21 px se llena**.
   *  ⇒ un segundo candado con ojo sería el mismo dibujo peleando consigo
   *  mismo, y quitarle el significado al primero rompería una escalera
   *  viva. *La llave abre; el candado cierra. Son dos objetos, no dos
   *  versiones de uno.*
   *  Anillo a la izquierda, vástago horizontal, dos dientes hacia abajo —
   *  la silueta que no comparte con nadie del set. */
  contrasena: ({ tinta }) => (
    <>
      <Circle cx={7.4} cy={12} r={3.8} {...trazo(tinta)} />
      <Path d="M11.2 12h9.2" {...trazo(tinta)} />
      <Path d="M17.6 12v3.2M14.6 12v2.4" {...trazo(tinta)} />
    </>
  ),

  /* ══════════════════════════════════════════════════════════════════
   *  S116-B · LOS SEIS DE CAPA DEL MOCK
   * ══════════════════════════════════════════════════════════════════ */

  /** #18 del mock. EL MALETÍN CON CRUZ. 🔴 **La cruz está libre y eso lo
   *  encontró el censo, no el recuerdo:** `veterinaria` es un
   *  ESTETOSCOPIO (arco + campana + huella), no una cruz. Ningún glifo del
   *  set dibuja una.
   *  ⚠️ **DOS RIESGOS DECLARADOS, los dos a mirar en el gate:**
   *   · contra `agregar` — una cruz y un `+` son el mismo trazo. Los separa
   *     que ésta vive ADENTRO de un objeto; la del `+` está sola. Si a
   *     21 px el maletín se cierra y solo se lee la cruz, el que se mueve
   *     es éste.
   *   · contra `despensa` — la bolsa también es cuerpo + asa. Los separa la
   *     proporción (el maletín es ANCHO, la bolsa ALTA) y el asa (recta
   *     contra curva).
   *  La huella va EXTERNA abajo-izquierda (molde `receta`/`papel`): con
   *  cuerpo + asa + cruz adentro no queda aire, y la Ley 9 manda que a
   *  21 px la huella sobreviva o sea ruido. */
  /* ⏪ **ENMENDADO EN SU PROPIA HOJA DE CONTACTO (S116-B).** Nació con la
   * huella externa abajo-izquierda (molde `receta`/`papel`) y a 21 px **se
   * pegaba al maletín y se leía como suciedad**. La Ley 9 en su forma
   * afilada S71 dice exactamente esto: *«a 21 px la huella SOBREVIVE O ES
   * RUIDO»*. ⇒ **este glifo va SIN HUELLA, y es una medición y no una
   * excepción de conveniencia** — con cuerpo + asa + cruz ya hay tres
   * elementos y el cuarto no cabe. El maletín pasa a ocupar la grilla
   * entera, que es lo que el aire liberado permitió.
   * *Se probó la versión con huella antes de descartarla; la hoja de
   * contacto de esta tanda es su evidencia.* */
  urgencias: ({ tinta }) => (
    <>
      <Path d="M4.4 8.6h15.2a1.6 1.6 0 0 1 1.6 1.6v7.6a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6v-7.6a1.6 1.6 0 0 1 1.6-1.6Z" {...trazo(tinta)} />
      <Path d="M8.8 8.6V6.8a1.4 1.4 0 0 1 1.4-1.4h3.6a1.4 1.4 0 0 1 1.4 1.4v1.8" {...trazo(tinta)} />
      <Path d="M12 11.4v5M9.5 13.9h5" {...trazo(tinta)} />
    </>
  ),
  /** #21 del mock. EL MATRAZ. 🔴 **El tubo de ensayo estaba vetado por el
   *  censo:** `vacuna` es un rectángulo vertical con aguja, y un tubo es
   *  un rectángulo vertical redondeado abajo — a 21 px, el mismo glifo. El
   *  Erlenmeyer tiene una silueta que nadie del set comparte: hombros que
   *  se abren.
   *  **La huella va ADENTRO, flotando en el líquido**, y eso es lo que
   *  dice de quién es la muestra. Sin ella el matraz es química genérica. */
  laboratorio: ({ tinta, huella }) => (
    <>
      <Path d="M10.2 3.4h3.6" {...trazo(tinta)} />
      <Path d="M11 3.4v5.4L6.3 17.4a1.6 1.6 0 0 0 1.4 2.4h8.6a1.6 1.6 0 0 0 1.4-2.4L13 8.8V3.4" {...trazo(tinta)} />
      <Path d="M8.4 13.6h7.2" {...trazo(tinta)} />
      <Huella color={huella} x={10.4} y={15} escala={0.3} />
    </>
  ),
  /** #27 del mock. EL BOL. **`despensa` es la SECCIÓN (una bolsa) y esto
   *  es lo que se come** — la misma distinción que la casa ya hizo entre
   *  `despensa` y `carrito`, escrita en su entrada.
   *  **La huella va ARRIBA, cayendo al bol**: el comedero solo es un
   *  recipiente; lo que lo vuelve alimento DE ELLA es de quién es el bol.
   *  Sin vecinos: es la única forma cóncava del set. */
  /* ⏪ **REDIBUJADO S116-B lote 2b — firma de la mesa: «el cuenco solo».**
   * Nació con la huella cayendo desde arriba —*el comedero solo es un
   * recipiente; lo que lo vuelve alimento DE ELLA es de quién es el bol*—
   * y con la letra §1.1 la huella se va. **El cuenco creció para ocupar
   * el aire que dejó**, que es lo que lo mantiene en el mismo peso óptico
   * que sus vecinos en vez de quedar chico y flotando arriba.
   * Sigue sin vecinos: es la única forma cóncava del set. */
  alimento: ({ tinta }) => (
    <>
      <Path d="M3.4 10.6h17.2a8.6 8.6 0 0 1-17.2 0Z" {...trazo(tinta)} />
      <Path d="M7.4 19.2h9.2" {...trazo(tinta)} />
    </>
  ),
  /** #29 del mock. EL TRIÁNGULO CON LA HUELLA ADENTRO. 🔴 **El dibujo sale
   *  de la letra, no del diccionario:** `LETRA_RECORRIDO_DESPENSA_S96`
   *  firmó que *«la alergia ADVIERTE, no esconde»* — exclusión dura en la
   *  recomendación, **advertencia dura en la búsqueda**. El objeto de una
   *  advertencia es el triángulo, y la huella adentro dice de QUIÉN es.
   *  *Un triángulo vacío advierte de algo; con la huella advierte de ella.*
   *  ⚠️ **COLISIÓN DECLARADA, molde de la estrella:** el triángulo es
   *  también la metáfora universal de «advertencia» genérica, y la casa no
   *  tiene ninguna. El nombre queda tomado por alergia — **pero el día que
   *  exista una advertencia general, esto se revisa antes que aquélla,
   *  porque llegó primero.** *La estrella de `personalidad` dejó escrito
   *  ese criterio tres sesiones antes de que hiciera falta; acá se aplica
   *  al nacer en vez de esperar el choque.* */
  /* ⏪ **REDIBUJADO S116-B lote 2b — firma de la mesa: «triángulo con
   * signo».** Nació con la huella adentro y el argumento era bueno —*un
   * triángulo vacío advierte de algo; con la huella advierte de ella*—
   * pero **la letra §1.1 no admite esa excepción**. Sin huella, el
   * triángulo solo no advierte: es una forma. ⇒ entra el signo de
   * exclamación, que es lo que la vuelve una señal.
   * **La colisión declarada al nacer SIGUE VIVA y ahora es más fuerte:**
   * este dibujo es el universal de «advertencia», y la casa no tiene
   * ninguna. El nombre sigue tomado por alergia — *el día que exista una
   * advertencia general, esto se revisa antes que aquélla, porque llegó
   * primero.* */
  alergia: ({ tinta }) => (
    <>
      <Path d="M12 3.8 21.2 19.8H2.8Z" {...trazo(tinta)} />
      <Path d="M12 10.2v4.2" {...trazo(tinta)} />
      <Path d="M12 17v.3" {...trazo(tinta)} />
    </>
  ),
  /** #30 del mock. EL CIRCUITO CON PATAS. **La cápsula estaba ocupada**
   *  (es el medicamento) y un chip de identificación dibujado como cápsula
   *  habría sido el mismo dibujo que lo que se toma — la peor vecindad
   *  posible en un expediente clínico.
   *  **La huella va ADENTRO del cuerpo**: el chip no es un componente
   *  electrónico, es la identidad de ella grabada. Mismo criterio con el
   *  que `wearables` la lleva adentro del dispositivo.
   *  ⚠️ A 21 px las ocho patas son lo que puede empastarse: van a 2.6 de
   *  largo y separadas 3.2, que es el máximo que la grilla admite sin
   *  achicar el cuerpo por debajo de la huella. */
  /* ⏪ **ENMENDADO EN SU PROPIA HOJA DE CONTACTO (S116-B).** Nació con
   * OCHO patas (dos por lado) + la huella adentro, y a 21 px **era una
   * mancha**: doce trazos en 21 px de lado. Lo que se sacó y por qué:
   *  · **las patas de arriba y abajo** — un circuito integrado se reconoce
   *    por las patas LATERALES; las verticales no agregan lectura y son
   *    las que chocan contra el cuerpo. Quedan cuatro, de a dos por lado.
   *  · **nada más**: la huella SE QUEDA y es lo que no se negocia. Sin
   *    ella esto es un componente electrónico; con ella es la identidad de
   *    ella grabada, que es el objeto (mismo criterio que `wearables`).
   * ⇒ **la cura fue quitarle patas al chip, no quitarle la mascota.** */
  /* ⏪ **REDIBUJADO S116-B lote 2b — firma de la mesa: «cuadrado con cuatro
   * patas por lado, vacío».** Nació en el lote 2 con ocho patas y la
   * huella adentro; su propia hoja lo cazó como mancha y le quitó las
   * patas verticales **conservando la huella**, con el argumento de que
   * sin ella era un componente electrónico y no la identidad de ella.
   * **La letra §1.1 le da la razón al argumento contrario:** si el set no
   * lleva huella, un chip de identificación es un chip, y lo que dice de
   * quién es lo dice la pantalla que lo monta.
   * ⇒ vuelven las cuatro patas por lado (dos arriba, dos abajo, dos por
   * costado) y el cuerpo queda **vacío**, que es lo que la orden pide.
   * **El aire que dejó la huella es lo que hace que ahora entren**: doce
   * trazos sin relleno adentro respiran donde trece con relleno no lo
   * hacían. *No es que la medición del lote 2 estuviera mal — es que su
   * premisa (la huella se queda) dejó de valer.* */
  microchip: ({ tinta }) => (
    <>
      <Path d="M7.6 7.6h8.8v8.8H7.6Z" {...trazo(tinta)} />
      <Path d="M9.8 7.6V4.4M14.2 7.6V4.4M9.8 19.6v-3.2M14.2 19.6v-3.2" {...trazo(tinta)} />
      <Path d="M7.6 9.8H4.4M7.6 14.2H4.4M19.6 9.8h-3.2M19.6 14.2h-3.2" {...trazo(tinta)} />
    </>
  ),
  /* #20 del mock. 🔴 **ES LA CÁPSULA DE `receta`, MUDADA BYTE A BYTE** —
   * mismo path, misma línea de partición, misma huella en la misma
   * esquina. No se re-dibujó a propósito: **su geometría ya pasó por el
   * criterio de la casa** y re-trazarla sería fabricar una diferencia que
   * nadie pidió. Lo único que cambia es el nombre, que es lo que estaba
   * mal (§② del lote 0: *«nombre y dibujo apuntan a dos ítems distintos
   * del mock»*). */
  medicamento: ({ tinta, huella }) => (
    <>
      <Path
        d="M6.94 10.13A3.83 3.83 0 0 0 12.33 15.52L21.06 6.79A3.83 3.83 0 0 0 15.67 1.40Z"
        {...trazo(tinta)}
      />
      <Path d="M10.51 6.19 15.93 11.61" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={14.8} escala={0.3} />
    </>
  ),
}

export function Icono({
  nombre: nombreEntrante,
  tamano = 24,
  registro = 'capa',
  tinta,
  huella,
  activa,
  montaje,
}: {
  /** Canónico de la casa **o** nombre del mock (ver `ALIAS`). Se resuelve
   *  al canónico antes de tocar el registry, así que todo lo de abajo —
   *  capa, huella, estructura — decide una sola vez y sobre un solo
   *  nombre: **un alias no puede tener una capa distinta de su dibujo.** */
  nombre: NombreDeIcono
  /** Tamaño de render; el diseño vive en la grilla 24 (gate también a 21 — §2.9). */
  tamano?: number
  /** 'capa' hex puro (dueño) · 'aa' funcional (prestador) · 'tinta' (vista con su acento ya puesto). */
  registro?: IconoRegistro
  /** Override del color de trazo (default: text.primary del tema). */
  tinta?: string
  /** Override del color de la HUELLA, independiente de `tinta` (S86-B,
   *  D-546). Es lo que permite "trazo en tinta + huella en el teal del
   *  oficio" — la composición firmada en el gate S78 que ningún
   *  `registro` podía producir, y por la que nació `iconos-oficio`.
   *  Sin él, la huella la sigue resolviendo el registro por su capa. */
  huella?: string
  /** ESTADO de la barra de tabs (S86-B). Sin definir = el glifo vive
   *  PRESENTE, como en todo el resto del producto. Definido, la ley 6
   *  decide qué hace la huella **según el registry, no según quien
   *  monta**: la de MARCA aparece al activarse, la de ESTRUCTURA
   *  recolorea. Ver `HUELLA_ES_ESTRUCTURA` arriba. */
  activa?: boolean
  /** DÓNDE está montado (S113-B). `'control'` = adentro de un botón ⇒ **sin
   *  huella**, por `N27`. Es una afirmación sobre el CONTEXTO, no una
   *  preferencia: ver `icono-huella.ts`, donde vive la regla y su borde.
   *
   *  ⚠️ **No cambia el color ni el dibujo** — sólo apaga la huella. *Un
   *  glifo montado en un botón sigue siendo de su capa; lo que pierde es la
   *  marca de mascota, que es lo que `N27` nombra.* */
  montaje?: MontajeIcono
}) {
  const nombre = canonico(nombreEntrante)
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'
  /* El `tinta` explícito GANA sobre el registro a propósito: quien lo
     pasa ya resolvió el color por su cuenta (la barra de tabs lo hace).
     `'glifo'` sólo contesta cuando nadie dijo nada. */
  const colorTinta =
    tinta ?? (registro === 'glifo' ? theme.accent.glifo : theme.text.primary)

  // capa del concepto (§2.2): paseo=cuidado(teal) · vet=identidad
  // (verde vital) · refugio/coach=comunidad(magenta) · grooming/
  // despensa=ocre (cuidado/consumo — status.warning es el ocre puro).
  const esCapa = 'capa' in theme
  const cuidado = { pura: esCapa ? theme.capa.cuidado : colorTinta, aa: 'capaText' in theme ? theme.capaText.cuidado : colorTinta }
  const identidad = { pura: esCapa ? theme.capa.identidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.identidad : colorTinta }
  const comunidad = { pura: esCapa ? theme.capa.comunidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.comunidad : colorTinta }
  const comunidadAmplia = { pura: esCapa ? theme.capa.comunidadAmplia : colorTinta, aa: 'capaText' in theme ? theme.capaText.comunidadAmplia : colorTinta }
  const ocre = { pura: theme.status.warning, aa: theme.status.warningText }
  const porConcepto: Record<IconoNombre, { pura: string; aa: string }> = {
    paseo: { pura: esCapa ? theme.capa.cuidado : colorTinta, aa: 'capaText' in theme ? theme.capaText.cuidado : colorTinta },
    veterinaria: { pura: esCapa ? theme.capa.identidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.identidad : colorTinta },
    grooming: { pura: theme.status.warning, aa: theme.status.warningText },
    refugio: { pura: esCapa ? theme.capa.comunidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.comunidad : colorTinta },
    despensa: { pura: theme.status.warning, aa: theme.status.warningText },
    /* El carrito HEREDA el color de `despensa` y no elige el suyo: es la
       misma capa (CONSUMO) y son la misma familia — la sección y lo que
       llevás adentro de ella. *Darle color propio los separaría en la
       pantalla justo donde tienen que leerse juntos.* */
    carrito: { pura: theme.status.warning, aa: theme.status.warningText },
    /* `pedido` HEREDA el ocre de la despensa por el mismo motivo que
       `carrito`: es la misma familia (comprar), en otro momento. Un color
       propio diría que es otro mundo. */
    pedido: { pura: theme.status.warning, aa: theme.status.warningText },
    /* Control puro: se viste de TINTA, no de capa — no nombra un mundo,
       ejecuta una acción. Mismo criterio que `lapiz`. */
    papelera: { pura: colorTinta, aa: colorTinta },
    // ✅ OCRE — FIRMADO (founder, S84-B17), y con esta firma se cierra la
    // pregunta que el glifo arrastraba desde que nació: **QUÉ ES el
    // destello**. No es marca (habría quedado en magenta por §5.1) ni
    // control funcional (habría ido al verde del oficio): **se viste del
    // COMERCIO**. Es una tercera respuesta, y es del founder.
    //
    // LO QUE COSTÓ CADA DESCARTE, registrado porque medirlo fue el trabajo
    // y borrarlo dejaría la firma sin su porqué:
    //  · ORO #FCBC1D — CAÍDO POR MEDICIÓN, no por gusto: **1.59 sobre el
    //    papel verde del prestador**, contra un mínimo de 3 (el glifo es
    //    gráfica, no texto). En oscuro pasaba holgado (10.79). La causa es
    //    de origen: el oro nació como RELLENO de CTA contra el papel del
    //    cliente, con label en tinta encima; acá se le pedía ser TINTA
    //    sobre papel, el trabajo inverso. Un color que sirve en un solo
    //    tema es media opción.
    //  · MAGENTA de capa (5.28 / 5.13) — contestaba "el destello es
    //    MARCA", que es lo que §5.1 implica y lo que §15b.1 permitiría.
    //  · TEAL del oficio (5.42 / 11.93) — contestaba "es CONTROL
    //    FUNCIONAL". Las dos pasaban de sobra: no se cayeron por número.
    //
    // ⚠️ Y EL ROCE QUE LA FIRMA ACEPTA, dicho para que no se descubra
    // después: el ocre es la capa del CONSUMO — la misma que descarté
    // para `contacto` con "un canal de contacto no vende nada". Un
    // destello de IA tampoco vende. La firma dice que igual se viste así.
    ia: ocre,
    // ── LOTE 3 (S58, D-361): capas por concepto — el founder poda/ajusta en gate ──
    hogar: comunidad, familia: comunidad, equipo: comunidad,
    explorar: comunidadAmplia,
    cuenta: identidad, carnet: identidad, pasaporte: identidad, papel: identidad, lupa: cuidado, seguros: identidad, telemedicina: identidad,
    hoy: cuidado, preferencias: cuidado, ayuda: cuidado, ubicacion: cuidado,
    // INFO comparte capa con `ayuda` PROVISIONALMENTE: los dos explican.
    // ⚠️ Si el gate de S79 firma la categoría «glifo de control», este
    // es su primer habitante y su capa la define esa firma, no esta línea.
    info: cuidado,
    /* Los cuatro nodos siguen a `info`: son CONTROL, y el control de
     * esta casa vive en `cuidado`. **En la escalera este mapa casi no
     * se usa** —el slot `icono` recibe el color del nodo y se pasa por
     * `tinta`—, pero se declara igual: un glifo sin entrada acá no
     * compila, y dejarlo resuelto evita que el próximo que lo monte
     * fuera de la escalera herede un color por descarte. */
    nodoConfirmado: cuidado, nodoPreparando: cuidado, nodoEnCamino: cuidado, nodoEntregado: cuidado,
    /* S112-B · LOS CINCO DE LA ADOPCIÓN. **`comunidad` y no `cuidado`**, y no
       es simetría con sus vecinos de despensa: la adopción es el eje de la
       COMUNIDAD —a quién pertenece— y `refugio` ya vive en esa capa. Un
       trámite de adopción pintado con la capa del cuidado diría que es un
       servicio, y no lo es.
       `enviar` va aparte: es CONTROL, y un control no tiene capa — su color
       lo pone quien lo monta (acá, el estado del campo). Se le da `comunidad`
       porque el mapa exige un valor para cada nombre; **su registro real es
       `aa`/`tinta`, jamás `capa`.** */
    sobre: comunidad, burbujas: comunidad, checkEnCirculo: comunidad,
    pluma: comunidad, enviar: comunidad,
    /* S114-B · `candado` va a CUIDADO, con la misma lógica que `info` y los
       cuatro nodos: **es CONTROL, y el control de esta casa vive en
       `cuidado`.** En la escalera este mapa casi no se usa —el slot recibe
       el color del nodo por `tinta`—, pero un glifo sin entrada acá no
       compila, y dejarlo resuelto evita que el próximo que lo monte fuera
       de la escalera herede un color por descarte. */
    candado: cuidado,
    // ATENDER va a CUIDADO y la elección es de taxonomía (Ley 10: se
    // reparte por lo que la cosa ES, no por dónde aparece). Atender a
    // quien llegó por la puerta es EL TRABAJO DEL DÍA — la misma capa
    // que `hoy`, la jornada. NO va a `ocre` aunque una de sus dos
    // puertas sea la venta de mostrador: ocre es la capa del CONSUMO, y
    // pintar ahí la tab principal de la recepción de una clínica diría
    // que su oficio es vender. La venta es UNA de sus puertas, no su
    // naturaleza.
    atender: cuidado,
    training: cuidado, hotel: cuidado, guarderia: cuidado, vacaciones: cuidado,
    negocio: ocre, pagos: ocre,
    // S84-B4 — CONTACTO va a COMUNIDAD, y la elección es de taxonomía,
    // no de gusto: Ley 10 reparte por lo que la cosa ES, y contactar es
    // el vínculo entre la familia y el negocio (misma capa que `familia`
    // y `equipo`, que son los otros dos vínculos entre personas). NO va
    // a `ocre` con `negocio` aunque comparta pantalla con él: ocre es la
    // capa del CONSUMO —el negocio como comercio—, y un canal de
    // contacto no vende nada. Los dos candidatos comparten capa: lo que
    // el founder elige a 21px es el DIBUJO, no el color.
    contacto: comunidad,
    // DOCUMENTO va a IDENTIDAD y la elección es de taxonomía (Ley 10):
    // una cédula, un RUC o un NIT son QUIÉN ES el negocio ante el Estado
    // — el mismo eje que `cuenta` y `carnet`, que son las otras dos
    // identidades del producto. No va a `ocre`/CONSUMO aunque el trámite
    // sea comercial: el documento no vende, acredita.
    documento: identidad,
    /* CERTIFICACIÓN → `identidad`, y se ancla en el vecino en vez de
       elegirse: `documento` (identificación) YA es identidad, y una
       certificación es de esa familia — un papel que dice QUIÉN ES y para
       qué está habilitada. *No es `cuidado` como `training`: el curso es el
       servicio; el certificado es la condición que queda.* */
    certificaciones: identidad,
    /* WEARABLE → `identidad`, y **no se eligió: la casa ya lo tenía
       declarado**. `themes/light.ts` dice `services.wearable:
       palette.verdeVitalDark  // Capa 1 · monitoreo de vida`. Se lee de ahí
       (L-166) en vez de razonarlo de nuevo y arriesgar contradecirlo. */
    wearables: identidad,
    // Las tres secciones de "Datos comerciales" comparten CAPA a
    // propósito: son la identidad del negocio ante el Estado y ante el
    // banco, y tres hermanas de la misma pantalla que divergieran de
    // color dirían que son de dominios distintos. Que no diverjan es la
    // decisión, no el default.
    fiscal: identidad, bancario: identidad,
    // `datos` responde "a quiénes cuido" — es la mascota contada, capa
    // identidad como `cuenta` y `carnet`.
    datos: identidad,
    // S85-B18 — la ventana temporal comparte capa con `hoy`, que es su
    // hermana mayor: son el MISMO eje (cuándo), no dominios distintos.
    semana: cuidado, mes: cuidado,
    prime: comunidad, primeCorona: comunidad,
    // LOTE S71-B2 (firma founder): caso = historia clínica (familia de
    // carnet/vet) · presupuesto = plata del cuidado (familia pagos/negocio)
    caso: identidad, presupuesto: ocre,
    // S82-B r10: la vacuna es PROTECCIÓN DE VIDA — capa identidad, la
    // misma que carnet/vet/seguros (§ Ley 10: la taxonomía manda).
    vacuna: identidad,
    /* `peso` y `antiparasitario` son de la capa IDENTIDAD, como `vacuna`:
       NOMBRAN un hecho del cuerpo de esta mascota. **Que no lleven huella
       no los saca de su capa** — el precedente es `carrito`, que hereda el
       ocre de su familia y tampoco la lleva. */
    peso: identidad,
    antiparasitario: identidad,
    /* ⚠️ **ESTA ENTRADA NO SE DIBUJA HOY, Y SE DECLARA PARA QUE NADIE LA
       DEFIENDA CREYENDO QUE SÍ.** `porConcepto` resuelve **el color de la
       HUELLA**, no el del trazo — y `personalidad` es glifo de CONTROL, o sea
       **sin huella** (lo asierta ⑤ de su gate). ⇒ montado con `registro="capa"`
       sale en tinta, igual que con `registro="tinta"`. **Medido en el
       emulador, no supuesto:** las dos filas dieron el mismo `(29,26,46)`.
       *Lo mismo vale para `peso`, `antiparasitario` y `foto`: sus entradas
       existen porque el `Record` es exhaustivo, no porque alguien las lea.*

       El valor igual es `comunidad` y no `identidad`, por si algún día lleva
       huella: *la mascota como individuo no es un dato clínico — al lado tiene
       «Temas médicos», y dos entradas del mismo color en la misma Hoja dicen
       que son lo mismo.* Pero eso es una decisión para el futuro, no algo que
       se vea hoy. */
    personalidad: comunidad,
    /* `foto` sí es un VERBO —capturar— y por eso se viste de TINTA, no de
       capa. Mismo criterio que `papelera` y `lapiz`: *un control no
       pertenece a un mundo, ejecuta una acción.* */
    foto: { pura: colorTinta, aa: colorTinta },
    // La bitácora es del expediente de la mascota — capa identidad.
    bitacora: identidad,
    // S90-B: la receta es del expediente clínico — misma capa que
    // `caso`, `vacuna` y `carnet`. No va a `ocre`/CONSUMO aunque nombre
    // un medicamento: la receta no vende, indica.
    receta: identidad,
    // S91-B: los papeles del hogar son del EXPEDIENTE — misma capa que sus
    // hermanos (`documento`, `carnet`, `receta`), no una categoría nueva.
    documentos: identidad,
    // `correo` es un canal, no expediente — pero su capa se decide con su
    // primer consumidor REAL, no ahora: hoy hereda `identidad` para no
    // fabricar una decisión de taxonomía que nadie pidió (Ley 10).
    correo: identidad,
    // GLIFOS DE CONTROL (S82-B r7): TINTA en los dos registros — un
    // control no pertenece a una capa (no hay oficio del que tomar
    // color) y su huella no se dibuja. El `registro="capa"` de un
    // control resuelve a tinta a propósito: pedirle capa no lo tiñe.
    lapiz: { pura: colorTinta, aa: colorTinta },
    compartir: { pura: colorTinta, aa: colorTinta },
    // S100d-B — el filtro entra a la familia de los controles (mismo
    // criterio: un control no pertenece a una capa).
    filtro: { pura: colorTinta, aa: colorTinta },
    // S89-B: descargar entra a la familia de sus vecinos — mismo criterio
    // (un control no pertenece a una capa) y misma resolución.
    descargar: { pura: colorTinta, aa: colorTinta },
    /* Control: tinta en los dos registros, como sus cuatro hermanos. */
    copiar: { pura: colorTinta, aa: colorTinta },
    /* S104-B · el par ver/ocultar: control puro. Tinta en los dos
     * registros, sin huella — su `registro="capa"` resuelve a tinta a
     * propósito, igual que `lapiz` y `filtro`. */
    ojo: { pura: colorTinta, aa: colorTinta },
    ojoTachado: { pura: colorTinta, aa: colorTinta },
    // S88 — la campana: OBJETO sin capa (un aviso no pertenece a un
    // oficio) ⇒ tinta en los dos registros, como los controles — sin
    // fundar §6bis: el criterio acá es «sin capa de la que tomar color».
    campana: { pura: colorTinta, aa: colorTinta },
    /* S116-B · LOS DOCE DE CONTROL DEL MOCK: tinta en los dos registros,
     * como sus nueve hermanos de arriba. Su `registro="capa"` resuelve a
     * tinta A PROPÓSITO — pedirle capa a un control no lo tiñe, porque no
     * hay oficio del que tomar color. */
    agregar: { pura: colorTinta, aa: colorTinta },
    quitar: { pura: colorTinta, aa: colorTinta },
    favorito: { pura: colorTinta, aa: colorTinta },
    calificacion: { pura: colorTinta, aa: colorTinta },
    hora: { pura: colorTinta, aa: colorTinta },
    microfono: { pura: colorTinta, aa: colorTinta },
    colgar: { pura: colorTinta, aa: colorTinta },
    galeria: { pura: colorTinta, aa: colorTinta },
    voltear: { pura: colorTinta, aa: colorTinta },
    salir: { pura: colorTinta, aa: colorTinta },
    mas: { pura: colorTinta, aa: colorTinta },
    contrasena: { pura: colorTinta, aa: colorTinta },
    /* S116-B · LOS SEIS DE CAPA DEL MOCK. Cinco son SALUD (identidad, la
     * capa de `veterinaria`/`vacuna`/`receta`) y uno es CONSUMO (el ocre
     * de la despensa) — `alimento` hereda de su sección por el mismo
     * motivo que `carrito`: es la misma familia en otro momento, y darle
     * color propio los separaría justo donde tienen que leerse juntos. */
    urgencias: identidad,
    laboratorio: identidad,
    alergia: identidad,
    microchip: identidad,
    medicamento: identidad,
    alimento: { pura: theme.status.warning, aa: theme.status.warningText },
  }

  // §2.8 memorial: la huella a tinta secundaria, el trazo se conserva.
  // El override explícito GANA sobre memorial a propósito: quien lo pasa
  // (la barra de tabs) ya degradó el color por tema antes de entregarlo.
  const colorHuella =
    huella ??
    (esMemorial
      ? theme.text.secondary
      : registro === 'tinta'
        ? colorTinta
        : registro === 'aa'
          ? porConcepto[nombre].aa
          : registro === 'glifo'
            ? colorTinta
            : porConcepto[nombre].pura)

  /* LEY 6 aplicada — y el registry es quien la contesta (ver arriba).
   * 🔴 **La decisión se MUDÓ a `icono-huella.ts` sin cambiar una coma** (S113-B):
   * vivía acá como una escalera de ternarios y no tenía gate. Ahí está su
   * regla, su borde (la huella que ES el dibujo) y su porqué. */
  const huellaFinal = resolverHuella({
    montaje,
    activa,
    esEstructura: HUELLA_ES_ESTRUCTURA.has(nombre),
    casaV5: theme.accent.formaV5,
    colorHuella,
    colorTinta,
  })

  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      {DIBUJANTES[nombre]({ tinta: colorTinta, huella: huellaFinal })}
    </Svg>
  )
}
