/**
 * Diccionario español del prestador — namespace `prestador` (S51-B1a).
 * Registro: tuteo neutro (regla 27, decisión founder S51).
 *
 * Las pantallas existentes migran su voz acá AL TOCARSE (D-315);
 * toda pantalla NUEVA nace con sus textos acá — cero strings crudos
 * (regla 26 bilingüe). Voz emocional: lote S51 aprobado por founder.
 */

export const prestadorEs = {
  tabs: {
    hoy: 'Hoy',
    // S85-C25 — LA TAB SE LLAMA **DATOS** (firma de la mesa): la pantalla
    // creció hasta su eje —"a quiénes cuido"— y el founder lo pidió con
    // esas palabras. ⚠️ LA KEY SIGUE SIENDO `mascotas` A PROPÓSITO:
    // renombrarla toca la ruta y el _layout sin aportarle NADA al que la
    // usa. Si algún día parece un resto, no lo es — es esta decisión.
    mascotas: 'Datos',
    negocio: 'Negocio',
    // ⭐ S98-C — LA QUINTA TAB (`LA_CASA_DEL_PRESTADOR` §1.2, nombre
    // FIRMADO por el founder el 13-ago). Su key es `atender` y su ruta
    // también: acá el nombre visible y el archivo coinciden, a diferencia
    // de `mascotas`/«Datos» — no hay historia que respetar.
    atender: 'Atender',
    // la tab Cuenta (letra P17, S57-B) · LOTE S57, GATE PENDIENTE
    cuenta: 'Cuenta',
  },
  // ⭐ S98-C · LA PORTADA DE `ATENDER` (Lote 2) · GATE PENDIENTE
  atender: {
    titulo: 'Atender',
    // Los dos rótulos son los NOMBRES FIRMADOS de las naturalezas (§1.2):
    // posesivos, que es como habla el resto de la app del prestador.
    tusServicios: 'Tus servicios',
    tuTienda: 'Tu tienda',
    // ⭐ S98-C · LA BANDA DEL DÍA. Los rótulos dicen QUÉ ES cada número:
    // «agendado» y no «cobrado», porque el lector es del valor agendado y
    // rotularlo distinto sería un verosímil-falso de plata.
    bandaCitas: 'Citas de hoy',
    /* ⭐ S98-C · LOS DOS RÓTULOS QUE EL FOUNDER PIDIÓ (dictado ② del gate),
       vivos recién ahora porque recién ahora hay lector honesto (D-808).
       **«Prestados» ≠ «Citas»** y la distinción es el punto: `citas`
       cuenta lo AGENDADO del día y `prestadas` lo COMPLETADO. Medido en un
       día real: 6 contra 1. *Llamar «prestados» a lo agendado miente en la
       dirección optimista, que es la peor.* */
    /* ⭐ S98-C · EL SUBTÍTULO DE LA BALDOSA, **CON APELLIDO** (segunda firma
       del founder): *«no tienes paseos programados, o tienes una cita de
       grooming, o de vet — para que siendo verdad las dos, sea más
       claro»*. Cada baldosa nombra SU oficio, y con eso la banda (que
       cuenta el negocio entero) y la baldosa (que cuenta su oficio) dejan
       de leerse como contradicción **sin tocar ningún número** — §4ter
       intacto, la claridad por el nombre. Ficha de A: D-814.

       🔴 NINGUNO USA LA FORMA LITERAL DE LA FIRMA, Y ESTÁ MEDIDO — no
       estimado, y **medido DOS VECES porque la primera me quedó corta**.

       `Baldosa` pinta su detalle en UNA línea. El ancho útil se leyó del
       nodo vivo con la fuente computada (`DMSans 400 14px`):

           viewport 420 → **151 px**
           viewport 360 → **121 px**   ← el teléfono angosto de la casa

       ⚠️ **Y la relación NO es lineal**: los paddings de página, celda y
       pieza son FIJOS, así que al angostar se comen una fracción cada vez
       mayor. Mi primera pasada extrapoló «≈148 px en 412» y con esa regla
       habría aprobado TRES voces que truncan. *Un presupuesto de ancho se
       mide en el caso duro, no se proyecta desde el cómodo.*

       Contra los 121 px reales:

           «Sin paseos hoy» .................. 097,2  ✓   ← literal del founder
           «Sin baños hoy» ................... 090,3  ✓
           «Sin sesiones hoy» ................ 107,2  ✓
           «Sin consultas hoy» ............... 113,2  ✓
           «Sin citas de vet hoy» ............ 126,4  ✗ trunca
           «Sin citas de grooming hoy» ....... 167,2  ✗ trunca
           «Sin citas de adiestramiento hoy» . 204,3  ✗ trunca

       ⇒ Los cuatro van con **el sustantivo propio del oficio**, que es la
       otra forma que el founder usó en la misma frase (*«no tienes
       PASEOS»*) y la única que entra en los cuatro. *Truncar la frase
       firmada la habría dejado en «Sin citas de adiestramien…», que no
       informa y encima se ve rota.*

       ⚠️ Lo que el sustantivo cuesta, declarado: «baños» no anuncia el
       corte y «consultas» no anuncia vacunación ni urgencia — los dos
       conteos son EXACTOS (todo grooming incluye baño; el conteo es de
       citas, no de consultas), pero el nombre nombra el acto típico. Se
       acepta porque el TÍTULO de la baldosa dice el oficio cuatro píxeles
       arriba: **el apellido lo carga el par, no la línea sola.** */
    datoPaseoCero: 'Sin paseos hoy',
    datoPaseoUno: '1 paseo hoy',
    datoPaseoN: '{{n}} paseos hoy',
    datoGroomingCero: 'Sin baños hoy',
    datoGroomingUno: '1 baño hoy',
    datoGroomingN: '{{n}} baños hoy',
    datoVeterinariaCero: 'Sin consultas hoy',
    datoVeterinariaUno: '1 consulta hoy',
    datoVeterinariaN: '{{n}} consultas hoy',
    datoAdiestramientoCero: 'Sin sesiones hoy',
    datoAdiestramientoUno: '1 sesión hoy',
    datoAdiestramientoN: '{{n}} sesiones hoy',
    bandaPrestados: 'Prestados hoy',
    bandaAgendado: 'Agendado hoy',
    bandaCobrado: 'Cobrado hoy',
    bandaParcial: 'El total es parcial: {{n}} de hoy todavía no tienen precio.',
    bandaNoSePudo: 'No pudimos leer los números de hoy.',
    oficioVeterinaria: 'Veterinaria',
    oficioGrooming: 'Estética',
    oficioPaseo: 'Paseo',
    oficioAdiestramiento: 'Adiestramiento',
    ventaTitulo: 'Venta de productos',
    // N9 — el vacío habla: qué pasa y qué hacer.
    vacioTitulo: 'Todavía no hay por dónde entrar',
    vacioDetalle:
      'Ningún servicio tuyo está marcado como «atiendo en mi local» y tu tienda no está activa. Prende la atención en local desde tu oferta y esta pantalla se abre sola.',
    falloTitulo: 'No pudimos cargar tus puertas',
    reintentar: 'Probar de nuevo',
  },
  // LA BIENVENIDA del prestador (S61-B8, letra founder) · LOTE S61, GATE PENDIENTE
  bienvenida: {
    paraPrestadores: 'para prestadores',
    // S61-B13: 'El oficio' → 'El arte' (letra founder)
    // ⭐ S87-C (firma founder, L-148): «que merece» → «que mereces». La
    // tercera persona dejaba al lector afuera de su propia bienvenida —
    // el producto tutea, y el titular ahora le habla A LA PERSONA.
    titular: 'El arte de cuidar, con las herramientas que mereces.',
    subtitulo: 'Bienvenido al grupo curado de prestadores fundadores.',
    ingresar: 'Ingresar',
    solicitarAcceso: '¿Eres prestador nuevo? Solicitar acceso',
    selloIdentidad: 'Identidad verificada',
    selloPagos: 'Pagos protegidos',
    solicitarTitulo: 'Solicitar acceso',
    solicitarCuerpoTitulo: 'Un grupo que empieza curado.',
    solicitarCuerpo:
      'Los prestadores fundadores entran por invitación del equipo de e-PetPlace. Cuando abramos solicitudes, este va a ser el lugar.',
    // S61-B13: el canal de contacto (dato founder, D-399) · LOTE S61
    escribenosWhatsApp: 'Escríbenos por WhatsApp',
    // S61-B14: literal founder refinado
    whatsappMensaje:
      'Hola, estoy interesado en prestar mis servicios de cuidado de mascotas a través de e-PetPlace. Vengo desde la app de prestadores.',
    whatsappFallback: 'WhatsApp no se pudo abrir. Escríbenos al {{numero}}.',
  },
  sesion: {
    // El estado honesto del raíz (S51; auth real desde S54/D-290):
    // sin sesión aterriza en LA BIENVENIDA (S61-B8) — sinSesion queda
    // para la rama de error; el detalle y el CTA viejos murieron (Ley 37).
    sinSesion: 'No hay una sesión activa',
    // con sesión pero SIN negocio de prestador (D-290): jamás crash.
    // S80-B1 (cura de callejón): la voz genérica gana EL CAMINO — el
    // "escríbenos" sin destino murió · LOTE S80, GATE PENDIENTE
    sinRol: 'Tu cuenta no tiene un negocio asociado',
    // S80-B4bis (hallazgo founder: la voz llegaba CORTADA por el clamp y
    // se perdía el email): el EMAIL va ADELANTE — la cola es lo que un
    // techo se come; el dato accionable no vive en la cola.
    sinRolDetalle:
      'Entraste como {{email}}. Si trabajas en un negocio que usa e-PetPlace, pídele a quien lo administra que te invite con ese correo — la invitación te aparece acá.',
    // S80-B1 (D-509 ①) — LA TERCERA VOZ: recién registrado en esta
    // sesión de JS. Encadena con registro.* (Ley 17.3) · LOTE S80
    registradoTitulo: 'Tu cuenta está lista',
    registradoDetalle:
      'Tu correo es {{email}}. Avísale a quien administra el negocio que te invite con ese correo — la invitación te aparece acá para aceptarla.',
    // ⭐ S89-C — ACÁ DECÍA, desde S75: «el EMPLEADO ACTIVO esperando la
    // puerta … muere cuando la puerta abra». La puerta abrió en S75 mismo
    // (R1) y D-660/§4ter volvieron DISEÑO la llegada del no-titular — este
    // era el último de los ocho sitios de P1 (censo de regresión) sin curar.
    // La rama NO se retira (mesa S75: cambió de caso, no murió): hoy cubre
    // al EMPLEADO ACTIVO de un negocio NO-'activo', y espera el lector que
    // pueda leer ese nombre (hoy degrada a sinRol — ver _layout). La voz
    // dejó de prometer «te avisamos»: dice el caso real — lo que falta no
    // es la app, es que el NEGOCIO esté activo.
    empleadoTitulo: 'Ya eres parte de {{negocio}}',
    empleadoDetalle:
      'El negocio todavía no está activo en e-PetPlace. Cuando lo esté, entras directamente por acá.',
    reintentar: 'Probar de nuevo',
    cerrarSesion: 'Cerrar sesión',
    confirmacionCierre: '¿Cierras tu sesión? Tu trabajo queda guardado.',
    cancelar: 'Cancelar',
    titulo: 'Sesión',
    // S96-C (cura (b) del gate, letra founder: «un fallo que no dice nada
    // es peor que un fallo que habla»): la rama de ERROR decía
    // `sinSesion` — mentira para un rebote del servidor con la sesión
    // viva (D-538/L-178: el fallo vestido de otra causa). El título nuevo
    // no afirma nada sobre la sesión; el detalle específico sigue abajo.
    falloTitulo: 'No pudimos entrar a tu cuenta',
  },
  // Login del prestador (S54-B, D-290) — email+contraseña por los
  // wrappers de auth existentes. S80-B1: el registro dejó de ser otro
  // ciclo — la entrada a /registro vive acá.
  login: {
    titulo: 'Iniciar sesión',
    email: 'Email',
    emailPlaceholder: 'ej: ana@correo.com',
    password: 'Contraseña',
    olvide: 'Olvidé mi contraseña',

    entrar: 'Entrar',
    // LOTE S80, GATE PENDIENTE
    crearCuenta: '¿Primera vez? Crear tu cuenta',
  },
  // REGISTRO del prestador (S80-B1, D-509 ① — port del cliente S45).
  // La cuenta nace VACÍA: el negocio te suma invitándote (curaduría
  // intacta). TUTEO NEUTRO · LOTE S80, GATE PENDIENTE
  registro: {
    titulo: 'Crear cuenta',
    contexto: 'Con tu cuenta, el negocio donde trabajas puede sumarte a su equipo.',
    nombreLabel: 'Tu nombre',
    emailLabel: 'Email',
    passwordLabel: 'Contraseña',
    // ⭐ S88-C: decía «Al menos 6» mientras recuperar decía 8 — dos
    // pantallas re-declarando la misma regla. Ahora las dos interpolan
    // MIN_LARGO_CONTRASENA (regla única, D-659).
    passwordAyuda: 'Al menos {{n}} caracteres',
    crearMiCuenta: 'Crear mi cuenta',
    correoConfirmacion: 'Te mandamos un correo para confirmar tu cuenta.',
  },
  // S75-B1: EL HANDSHAKE — el invitado inactivo llega acá desde el raíz
  // (la sonda lo intercepta antes del "sin negocio"). Voz L-139: dice la
  // verdad verificable, jamás promete un acceso que la puerta niega.
  // ⭐ S89-C — ACÁ DECÍA «el estado ACEPTADO reusa sesion.empleadoTitulo/
  // Detalle»: ese estado murió (Ley 37, ver invitacion.tsx) — al aceptar,
  // el guard re-resuelve y la persona entra. Nadie reusa esas keys.
  invitacion: {
    titulo: '{{negocio}} te sumó a su equipo',
    tituloSinNombre: 'Te sumaron a un equipo', // enmienda (b): nombre null
    // S75-B17: era 'Te invitaron como {{nombre}}' — el "como" se leía como
    // ROL (el founder: "Luos no es un rol"). {{nombre}} es el nombre que el
    // titular tipeó al invitar (dato de la fila, no interpolación rota); la
    // invitación v1 NO lleva rol (E4). Reescrito para que sea claramente un
    // NOMBRE, no un cargo.
    invitadoComo: 'Tu nombre en el equipo: {{nombre}}',
    entrar: 'Entrar al equipo',
    // rebotes del aceptador (clase ok:false), voz humana por código (Ley 3)
    errorYaActivado: 'Esta invitación ya no está disponible.',
    errorNoEsTuya: 'Esta invitación no es para tu cuenta.',
    errorGenerico: 'No pudimos confirmar tu ingreso. Prueba de nuevo.',
    errorCarga: 'No pudimos cargar tu invitación.',
    reintentar: 'Probar de nuevo',
  },
  /* ⭐ S97-D · LA LÍNEA DEL DÍA. Namespace propio y no `agenda` a
     propósito: `agenda` es el vocabulario de las CITAS, y un despacho no
     es una cita — meterlo ahí haría que la próxima persona que lea el
     diccionario crea que la despensa vive adentro del motor de servicios,
     que es justo lo que el cinturón §3.4 prohíbe. La frontera se cuida
     también en el idioma. · LOTE S97-D, GATE PENDIENTE */
  linea: {
    // El sujeto de un despacho es el PEDIDO — el vendedor no ve mascota
    // ni expediente por ninguna vía (MODELO_DESPENSA §7.4).
    despachoTitulo: 'Pedido {{orden}}',
  },
  agenda: {
    // S60-C2.2: la jornada ya no es solo paseos (grooming vivo) — la
    // voz genérica de la jornada, propuesta al gate · LOTE S60
    // S71-B1 — EL TECHO DE LA JORNADA. `saludo` ('Tu jornada de hoy')
    // MURIÓ con el literal genérico del hallazgo 2 (Ley 37). Voz: TUTEO
    // NEUTRO — 'terminas', jamás 'terminás' (el voseo es el desvío).
    saludoNombre: 'Hola, {{nombre}}',
    saludoSinNombre: 'Hola',
    datoQuedan: 'Te quedan {{n}} · terminas {{hora}}',
    datoQueda1: 'Te queda 1 · terminas {{hora}}',
    datoQuedanSinHora: 'Te quedan {{n}}',
    datoQueda1SinHora: 'Te queda 1',
    datoCompleta: 'Jornada completa.',
    datoPorCoordinar: 'Día atendido · {{n}} por coordinar',
    // ⭐ S86-C (gate) · el día sin citas DICE que no hubo — antes se
    // callaba y el header saltaba (L-201, escala chica).
    datoSinCitas: 'Sin citas registradas',
    datoLibreConSemana: 'Hoy libre · {{n}} esta semana',
    /* ⭐ S86-C · UN DÍA PASADO HABLA EN PASADO (cruce 2, firma de mesa).
       Con la rueda llegando a hoy-3, las voces de arriba prometían futuro
       sobre un día vencido: *"Te quedan 2 · terminas 16:30"* de un martes
       que ya pasó. **Lo pendiente de un día vencido no es agenda: es plata
       sin devengar** (el devengo nace al cerrar con calidad), y cada una
       es puerta a su cita — las filas de abajo ya navegan a ella.
       Un día pasado SIN citas no dice nada: la línea se omite (jamás
       "Hoy libre" sobre un día que no es hoy). */
    datoPasadoPendiente1: 'Quedó 1 sin cerrar',
    datoPasadoPendientes: 'Quedaron {{n}} sin cerrar',
    datoPasadoCerrado1: 'Día cerrado · 1 atención',
    datoPasadoCerradoN: 'Día cerrado · {{n}} atenciones',
    // El pie de revelar (candidato a diccionario 19.6): el número EN la
    // etiqueta — jamás un 'Ver más' mudo. Compartida por las dos secciones.
    yaAtendidasTitulo: 'Ya atendidas',
    yaAtendidasResumen: '{{n}} del día',
    verLasN: 'Ver las {{n}}',
    vacio: 'Hoy no tienes citas',
    vacioDetalle: 'Cuando una familia agende contigo, va a aparecer acá.',
    reintentar: 'Reintentar',
    // S59-B3 voz única del estado (MODELO_PASEO §7, misma palabra en toda
    // superficie — el pill de ui ya la porta) · LOTE S59, GATE PENDIENTE
    enCurso: 'En vivo',
    // Zona 1 — lo siguiente preside
    ahora: 'Ahora',
    /* ⭐ S86-C · LA PERTENENCIA DEL VIVO (firma ②). Parado en otro día, lo
       que corre AHORA sigue a la vista — pero el rótulo dice de qué día es.
       El argumento de S85-C7 (*"ahora" no existe en el jueves*) sigue
       siendo cierto: se honra con RÓTULO, no escondiendo lo vivo. */
    ahoraHoy: 'Ahora · hoy',
    /* ☠️ S86-C · MURIÓ `loSiguiente` — el bloque que la usaba desapareció:
       la próxima cita es ahora la PRIMERA DE LA LÍNEA DE TIEMPO y no
       necesita rótulo propio. Censo corrido: cero consumidores (Ley 37). */
    primeraVez: 'Primera vez',
    conocerMascota: 'Conocer a {{nombre}}',
    // estados de cita (voz de oficio, funcional)
    estadoPorCerrar: 'Por cerrar',
    estadoCerrado: 'Cerrado',
    estadoConfirmada: 'Confirmada',
    estadoCompletada: 'Completada',
    estadoNoShow: 'No show',
    // fallback cuando la cita llega sin mascota asociada (D-315p)
    mascotaFallback: 'Mascota',
    // marca "parte del plan" (D-338, S56-B T7) · LOTE S56, GATE PENDIENTE
    parteDelPlan: 'Parte del plan',
    // S70-B1: el origen releído — el walk-in del mostrador lo dice en la
    // fila (reposo, jamás acento); la reserva in-app no marca · LOTE S70, GATE PENDIENTE
    origenMostrador: 'Mostrador',
    // S70-B2-v2: jornada V2 (Por coordinar · Ya atendidas · vacío v2b) · LOTE S70, GATE PENDIENTE
    // S79-B (T2-B4) · §2.5 el módulo aspiracional sobrio — texto, no banner.
    // N=15 vive acá y se edita al crecer la cohorte · LOTE S79, GATE PENDIENTE
    aspiracional:
      // ☠️ S85-C37 · EL «15» SALE TAMBIÉN DE ACÁ. La firma que lo sacó de la
      // carta del Día 1 no era de esa pantalla: era del NÚMERO. Un string de app
      // no sostiene una promesa de escasez — caduca en el prestador 16 y nada
      // avisa. Que sobreviviera acá después de curar la carta es la prueba de
      // que curar UN sitio no cura una regla: el censo se hace por FRASE.
      'Eres parte de un grupo curado de prestadores en Ecuador. e-PetPlace no busca llenar — busca elegir bien. Gracias por sumarte al comienzo.',
    porCoordinarTitulo: 'Por coordinar',
    porCoordinarCta: 'Fijar fecha',
    porCoordinarLibre: 'Procedimiento',
    // S72-B pieza 3: la voz del procedimiento coordinado en la agenda —
    // «Ecografía» / «Ecografía +1» / «Procedimiento» (sin descripción).
    procGenerico: 'Procedimiento',
    procMasN: '{{base}} +{{n}}',
    yaAtendidas: 'Ya atendidas ({{n}})',
    acordeonOcultar: 'Ocultar',
    // la semana (D-317, S57-B1) · LOTE S57, GATE PENDIENTE
    tuDia: 'Tu día',
    diaCerrado: 'Cerrado',
    // S61-B5: el filtro por oficio (solo con ≥2 oficios activos) · LOTE S61, GATE PENDIENTE
    filtroEtiqueta: 'Ver por servicio',
    filtroTodos: 'Todos',
    filtroPaseos: 'Paseos',
    filtroEstetica: 'Estética',
    filtroAdiestramiento: 'Adiestramiento',
    // S69-B: el cuarto oficio en el filtro del HOY · LOTE S69, GATE PENDIENTE
    filtroVeterinaria: 'Veterinaria',
    filtroVacio: 'Hoy no tienes citas de este servicio.',
    // LOTE S62 (D-385): la salida grupal — una fila, N mascotas
    salidaNombresDos: '{{a}} y {{b}}',
    salidaNombresVarios: '{{a}}, {{b}} y {{n}} más',
    salidaDe: 'salida de {{n}}',
    diaBloqueado: 'De vacaciones',
  },
  // La tab Cuenta del prestador (letra P17, S57-B) · LOTE S57, GATE PENDIENTE.
  /* ⑥ S84-C3 — LA VITRINA DEL NEGOCIO. Namespace NUEVO, y nace con las
     cadenas que ESTE lote tocó — ni una más: migrar el resto del copy
     de la pantalla en el mismo commit volvería ilegible el diff entre
     "lo que cambió de significado" y "lo que solo cambió de casa".
     ⚠️ DEUDA DECLARADA Y ACOTADA: el resto del literal de
     `cuenta/perfil` (los labels de portada, los rótulos de sección y
     los textos de las dos Hojas) SIGUE fuera del riel. Entra completo
     en su propio lote, con su gate es/en. */
  techo: {
    // ⭐ S85-C23 · LOS TRES NÚMEROS DE LA PORTADA (PORTAL_PRESTADOR §2.4bis).
    // La UNIDAD habla el idioma del oficio; el esqueleto no cambia nunca.
    /* ☠️ S85-C36 · `cohorteFundador` / `cohortePionero` MURIERON. Eran MI
       traducción del código de cohorte, escrita cuando esta casa componía la
       etiqueta. B se llevó la composición a la pieza (`Insignia` con su propio
       i18n) y estas quedaron SIN UN SOLO CONSUMIDOR — verificado por grep.
       Ley 37. *Una key huérfana no rompe nada: solo espera a que alguien la
       lea y crea que rige.* */
    // ⭐ RÓTULOS SUELTOS (S85-C34): el contrato de B separa VALOR de RÓTULO, así
    // que la unidad deja de ser una frase. El número puede pesar y la unidad
    // acompañar, que es lo que un techo necesita para leerse de un vistazo.
    cargaEnRuta: 'en ruta',
    cargaCita1: 'cita',
    cargaCitas: 'citas',
    cargaTurno1: 'turno',
    cargaTurnos: 'turnos',
    cargaConsulta1: 'consulta',
    cargaConsultas: 'consultas',
    cargaSesion1: 'sesión',
    cargaSesiones: 'sesiones',
    // PLATA = el valor AGENDADO del día (jamás lo devengado ni lo cobrado).
    plataDelDia: 'del día',
    /* ⭐ S86-C · LA PLATA SIGUE AL DÍA EN VISTA (cruce 1, firma de mesa).
       Antes CARGA y VIDAS eran del día elegido y PLATA era de hoy, fijo:
       parado en el jueves, el techo mezclaba dos días en un solo bloque.
       Un número plausible y falso — ningún typecheck lo ve. Ahora sigue al
       día, **y el rótulo dice cuál** (sin eso, el número correcto seguiría
       leyéndose como el de hoy). */
    plataDelDiaOtro: 'del {{dia}}',
    /* El cuarto estado de la columna: entre que el dedo cambia de día y el
       servidor contesta. NO se conserva el valor anterior con el rótulo
       nuevo — sería exactamente la mentira que este cruce vino a curar. */
    plataCargando: 'Calculando',
    plataCargandoDetalle: 'Calculando los ingresos del día',
    // El total dice lo que sabe Y declara lo que le falta: un número redondo
    // que oculta citas no se puede desconfiar.
    plataParcial: '{{n}} sin precio',
    // El hueco habla del PERMISO, no del dato. Ni vacío (se lee como cero) ni
    // "sin datos" (suena a sistema roto): no falta información, sobra audiencia.
    // VISIBLE corta + COMPLETA en accessibilityLabel: en un tercio de ancho
    // la frase entera estiraría la columna a tres renglones y el techo se
    // leería roto. La posición del hueco ya aporta "los ingresos".
    // ⏪ S88-C: decía «Solo el titular» y MENTÍA EN EL PORQUÉ desde el
    // ensanche (admin y recepción la ven) — familia S84: un rebote que
    // dice la verdad del resultado y miente en la razón. La verdad: la
    // plata la ve quien está en el MOSTRADOR.
    plataSoloTitular: 'Del mostrador',
    plataSoloTitularDetalle: 'Los ingresos los ve quien está en el mostrador',
    plataNoSePudo: 'Ingresos no disponibles',
    /* ⏪ S86-C: decía "de hoy". Con la plata siguiendo al día en vista, ese
       "hoy" pasó a ser falso en nueve de cada diez días de la rueda. */
    plataNoSePudoDetalle: 'No pudimos leer los ingresos del día',
    /* ⭐ S87-C (LÁMINA BARRA DE TRES §1) — LA COLUMNA DEL NO-GESTOR.
       Donde el titular ve la plata, quien no la administra ve SU TRABAJO.
       El rótulo dice «a tu cargo» y NO «citas» a secas: la columna de la
       izquierda ya cuenta las del NEGOCIO, y dos números con el mismo
       rótulo se leerían como un error de la app. UNA sola forma para 1 y
       para N — no es un sustantivo que pluralice. · LOTE S87, GATE PENDIENTE */
    suDia: 'a tu cargo',
    suDiaNoSePudo: 'Tu día no disponible',
    suDiaNoSePudoDetalle: 'No pudimos confirmar cuáles citas son tuyas',
    vidasTutor1: 'tutor',
    vidasTutores: 'tutores',
    vidasPaciente1: 'paciente',
    vidasPacientes: 'pacientes',
    vidasMascota1: 'mascota',
    vidasMascotas: 'mascotas',
    vidasAlumno1: 'alumno',
    vidasAlumnos: 'alumnos',
  },
  expediente: {
    // ⭐ S85-C28 · EL EXPEDIENTE MODULADO (BIO_EXPEDIENTE A3.5bis).
    titulo: 'Su expediente',
    // Ley 3: el código del evento jamás se muestra. Cerrado + genérico digno.
    aportePaseo: 'Paseo',
    aporteGrooming: 'Estética',
    aporteAdiestramiento: 'Sesión de adiestramiento',
    aporteVacuna: 'Vacuna',
    aporteConsulta: 'Consulta',
    aporteMomento: 'Momento de cuidado',
    // ⭐ LA VOZ DEL NIVEL ③ (firmada por la mesa). Enuncia dónde VIVE el
    // detalle, no lo que el lector no puede: ése es el dato que habilita
    // el handshake. Nunca "sin detalle" ni "no tienes acceso".
    detalleLoTiene: 'El detalle lo tiene {{prestador}}.',
    // Autor desconocido (negocio borrado): "no sé quién" ≠ "no aplica".
    detalleLoTieneOtro: 'El detalle lo tiene otro prestador.',
    vacio: 'Todavía no hay aportes en su expediente.',
    error: 'No pudimos leer el expediente',
  },
  quienCuida: {
    // ⭐ S85-C29 · «QUIÉN CUIDA A ESTA VIDA» (A3.5quater). El eje del
    // producto es la MASCOTA, no el hogar: la pregunta es por ESTA vida.
    titulo: 'Quién cuida a {{nombre}}',
    // Ley 3: el rol del motor jamás se muestra. Cerrado + genérico digno.
    rolTitular: 'Titular',
    rolMiembro: 'De la familia',
    // TRES hechos, TRES voces (L-197): sin familia ≠ familia sin vigentes
    // ≠ no pudimos leer. Colapsarlos haría que un fallo de red se lea como
    // "esta mascota no tiene a nadie", que es lo más caro que puede decir
    // esta pantalla.
    sinFamilia: 'Todavía no tiene una familia registrada.',
    sinMiembros: 'Su familia no tiene miembros activos.',
    error: 'No pudimos leer quién cuida a esta mascota',
  },
  atencion: {
    // ⭐ S85-C30 · «NECESITA TU ATENCIÓN» — el espejo de "Ponte al día" del
    // cliente, en la portada del prestador (S72-P1b). OPERACIÓN, no métricas:
    // lo que espera una respuesta SUYA.
    titulo: 'Necesita tu atención',
    coordinar1: '1 cita sin fecha',
    coordinarN: '{{n}} citas sin fecha',
    coordinarPie: 'Aprobadas, esperando que coordines el día.',
    presupuesto1: '1 presupuesto sin respuesta',
    presupuestoN: '{{n}} presupuestos sin respuesta',
    presupuestoPie: 'Enviados y todavía sin aprobar ni rechazar.',
    handshake1: '1 autorización esperando',
    handshakeN: '{{n}} autorizaciones esperando',
    handshakePie: 'La familia todavía no respondió.',
    // ⚠️ Una atención sin cerrar es PLATA SIN DEVENGAR: el devengo nace al
    // cerrar con calidad. Por eso esta fila existe y no es un recordatorio.
    abierta1: '1 atención sin cerrar',
    abiertaN: '{{n}} atenciones sin cerrar',
    abiertaPie: 'El cobro se registra al cerrarlas.',
  },
  emblema: {
    // ⭐ S85-C32 · EL MODAL DEL EMBLEMA (PORTAL_PRESTADOR §2.3, firma founder).
    // NO es una glosa de la insignia ("la cohorte fundadora es…"): es LA
    // BIENVENIDA DEVUELTA. El prestador toca su emblema y vuelve a leer POR
    // QUÉ fue elegido, con la firma de quien lo eligió.
    titulo: 'Tu lugar en e-PetPlace',
    // SIN N (firma del founder): un número horneado en una app envejece sin
    // avisar. "Uno de los prestadores que dan forma" dice lo mismo y no caduca.
    // ⚠️ `dia1.eleccion` SÍ lleva el 15 — divergencia declarada a la mesa.
    cuerpoFundador: 'Te elegimos para ser uno de los prestadores que dan forma a e-PetPlace en Ecuador.',
    cuerpoPionero: 'Eres uno de los primeros prestadores de e-PetPlace en tu ciudad.',
    // LA FIRMA VA CON NOMBRE PROPIO, jamás "el equipo": un reconocimiento
    // firmado por una institución deja de ser una elección. Reusa las keys
    // de `dia1` — la firma del founder vive UNA vez en la app.
    cerrar: 'Cerrar',
  },
  perfilNegocio: {
    // el resumen de contacto: NOMBRA lo cargado, en orden fijo
    // ── S84-C5: el resto del literal de la vitrina ──
    errorTitulo: 'No pudimos cargar tu perfil',
    errorDetalle: 'Prueba de nuevo en un momento.',
    portadaAyuda: 'Lo primero que lee una familia. Dos o tres líneas alcanzan.',
    descripcionLabel: 'Descripción',
    descripcionEjemplo: 'Paseos tranquilos por el norte de Quito, grupos chicos y reporte con fotos.',
    /* ⚠️ ATADA A D-173 (S84-C7, adjudicación del founder). La frase vieja
       —'los ven las familias'— prometía PRESENTE sobre un futuro: hoy
       NINGUNA de las cuatro columnas de contacto está en
       v_prestadores_publicos (D-601), así que ninguna familia las ve.
       La nueva habla de lo que el dato ES y de para qué se carga, sin
       prometer un efecto que todavía no ocurre.
       ☠️ CUANDO EL FOUNDER FIRME D-173 —y la vitrina publique estos
       cuatro campos— esta cadena y correoOk vuelven a ser CANDIDATAS de
       reescritura: ahí sí se va a poder decir que las familias las ven.
       La nota va atada a D-173 y no suelta, para que la reescritura
       tenga disparo y no dependa de que alguien se acuerde. */
    contactoAyuda: 'Son los datos con los que te van a contactar. Cárgalos ahora para que estén listos.',
    correoLabel: 'Correo de contacto',
    correoEjemplo: 'hola@paseosandres.ec',
    // ⚠️ ATADA A D-173 — ver contactoAyuda. 'Guardado.' dice lo único
    // que hoy es cierto: que el dato quedó.
    correoOk: 'Guardado.',
    correoMal: 'Un correo lleva un @ y un punto después: hola@tunegocio.ec',
    sitioLabel: 'Sitio web',
    sitioEjemplo: 'paseosandres.ec',
    sitioSeGuarda: 'Se guarda {{url}}',
    sitioMal: 'Escribe el dominio, como tunegocio.ec o www.tunegocio.ec',
    telSeGuarda: 'se guarda {{e164}}',
    telSinFormato: 'Se guarda {{e164}}. No verificamos el largo: {{pais}} no declara su formato.',
    telLargoMal: 'Un número de {{pais}} lleva {{cuantos}} después de {{pre}}. Van {{van}}.',
    telDigitos: '{{min}} dígitos',
    telDigitosRango: '{{min}} o {{max}} dígitos',
    telDigitosSinDato: 'los dígitos que le corresponden',
    campoTelefono: 'el teléfono',
    campoWhatsapp: 'el WhatsApp',
    campoCorreo: 'el correo',
    campoSitio: 'el sitio web',
    unionY: ' y ',
    revisaAntesDeGuardar: 'Revisa {{campos}} antes de guardar.',
    paisHojaTitulo: 'País del número',
    paisHojaAyuda: 'El indicativo es un dato aparte del número. Puedes elegir cualquiera: operar en un país y tener la línea de otro es normal.',
    paisSinFormato: 'no verificamos el largo',
    paisElegido: 'elegido',
    logoHojaTitulo: 'El logo de tu negocio',
    logoHojaAyuda: 'Tiene que ser un PNG: es el formato que guarda el fondo transparente, para que tu marca no salga dentro de un rectángulo.',
    logoNoPng: 'El logo tiene que ser un PNG. Es el formato que guarda el fondo transparente, para que tu marca no salga dentro de un rectángulo.',
    logoSubiendo: 'Estamos subiendo tu logo…',
    espejoRotulo: 'Así te ven tus clientes',

    // ── S84-C8bis · la vitrina en su lugar ──
    espejoPie: 'Así se va a ver tu ficha en la app.',
    sinDireccion: 'Sin dirección',
    sinDireccionDetalle: 'Cárgala para que te encuentren en el mapa.',

    // ── S84-C12 · las fotos de la vitrina ──
    // ── S84-C15 · el escriba (MODELO_PRESENCIA §5) ──
    iaEscribir: 'Ayúdame a escribirla',
    iaMejorar: 'Ayúdame a mejorarla',
    iaHojaTitulo: 'Tu historia',
    iaIntroEscribir: 'Contame dos cosas y armo un primer borrador con lo que ya sé de tu negocio. Vos decidís si lo usás.',
    iaIntroMejorar: 'Contame dos cosas y mejoro lo que ya escribiste. No se cambia nada hasta que vos digas.',
    iaPorQue: '¿Por qué haces esto?',
    iaQueSepan: '¿Qué quieres que sepan de tu lugar?',
    iaExperiencia: 'Cuéntanos sobre tu experiencia',

    iaComponer: 'Escribir el borrador',
    iaLoTuyo: 'lo que escribiste',
    iaPropuesta: 'la propuesta',
    iaUsar: 'Usar esta versión',
    iaOtra: 'Probar otra',
    iaDescartar: 'Descartar',

    nombreEditar: 'Cambiar el nombre de tu negocio',
    nombreHojaTitulo: 'El nombre de tu negocio',
    /** Dice DÓNDE se ve: el mismo nombre viaja a la vitrina y al
     *  documento fiscal, y eso es lo que vuelve entendible el cambio. */
    nombreAyuda: 'Es el que ven las familias y el que figura en tus datos comerciales. Se cambia en los dos a la vez.',
    nombreLabel: 'Nombre de tu negocio',
    nombreGuardado: 'Listo — cambiamos el nombre de tu negocio.',
    espacioTitulo: 'Tu espacio',
    fotoAdelante: 'Mover adelante',
    fotoAtras: 'Mover atrás',
    borradorTitulo: 'Tenés cambios sin guardar',
    borradorVoz: 'El espejo muestra lo que ya está guardado. Si querés verlos ahí, guardalos primero.',
    borradorGuardarYVer: 'Guardar y ver',
    borradorVerIgual: 'Ver lo guardado',

    fotosTitulo: 'Fotos de tu espacio',
    fotosAyuda: 'La primera es tu portada. Tocá una foto para cambiarla de lugar o borrarla.',
    fotoAgregar: 'Agregar',
    fotoSubiendo: 'Subiendo…',
    fotoMuyGrande: 'La foto supera el máximo de 10 MB.',
    fotoPortadaMarca: 'portada',
    fotoPortadaA11y: 'Foto de portada',
    fotoA11y: 'Foto {{n}}',
    fotoHojaTitulo: 'Esta foto',
    fotoHacerPortada: 'Hacer portada',
    fotoBorrar: 'Borrar',

    clipTitulo: 'Tu clip',
    /* ⚠️ ESTA CADENA NO DECLARA ESTADO, Y ES A PROPÓSITO (S84-C17).
       La anterior decía 'todavía no está disponible: llega con la próxima
       versión' — nació VERDADERA (no existían ni la columna ni el lib) y
       se volvió falsa sin que nadie la tocara, en cuanto A entregó
       `subirClipVitrina`. Además desalentaba: le decía al prestador que
       no se moleste.
       Ahora dice QUÉ ES y PARA QUÉ SIRVE — dos cosas que no envejecen.
       LA PRUEBA de que está bien escrita: sirve IGUAL antes y después de
       que exista el botón. Cuando B entregue la captura de video, se
       agrega el control y **esta línea no se toca**. */
    clipAgregar: 'Agregar clip',
    clipCambiar: 'Cambiar clip',
    clipQuitar: 'Quitar',
    clipGuardado: 'Listo — tu clip quedó guardado.',
    clipNoVideo: 'El archivo no es un video.',
    clipMuyGrande: 'El clip supera el máximo de 10 MB.',
    clipGrandeSinMedir: 'El clip pesa más de 10 MB. No pudimos saberlo antes de subirlo — probá con uno más corto.',

    clipVacio: 'Un video corto de tu espacio: lo que una foto no alcanza a mostrar.',
    volver: 'Volver',
    verComoTeVen: 'Ver cómo te ven',
    verComoTeVenNota: 'Así te va a ver una familia que te encuentra. Todavía estamos armando el directorio.',

    portadaTitulo: 'Tu portada',
    contactoTitulo: 'Cómo te contactan',
    dondeTitulo: 'Dónde atiendes',
    contactoTelefono: 'Teléfono',
    contactoWhatsapp: 'WhatsApp',
    contactoCorreo: 'Correo',
    contactoSitio: 'Sitio',
    contactoNinguno: 'Sin datos de contacto',
    // el vacío: habla de lo que el dato ES, no de un efecto que hoy no
    // ocurre — `v_prestadores_publicos` todavía no expone ninguno (D-601)
    contactoVacio: 'Todavía no cargaste ninguna forma de contacto.',
    portadaCon: 'Con descripción',
    portadaSin: 'Sin descripción',
    telefonoLabel: 'Teléfono del negocio',
    // sin prefijo: el indicativo ya está a la izquierda
    telefonoEjemplo: '99 123 4567',
    whatsappLabel: 'WhatsApp',
    whatsappEjemplo: '99 900 0333',
    zonaSinDireccion: 'Sin tu dirección no aparece el mapa de tu zona en la ficha. Cárgala acá abajo.',

    sedeGuardaAparte: 'Esta sección se guarda sola: cada cambio queda al confirmarlo acá abajo.',
    cuentaComercialTitulo: 'Tu cuenta comercial',
    cuentaComercialDetalle: 'Los datos con los que cobras por la app.',

    datosComercialesTitulo: 'Datos comerciales',
    datosComercialesDetalle: 'Tus datos fiscales, tu cuenta de cobro y tu identificación.',
    seguridadTitulo: 'Seguridad',
    seguridadDetalle: 'Tu nombre, tu correo de ingreso y tu contraseña. No los ven las familias.',
  },

  // Voces calcadas de la Cuenta v1 del cliente (aprobadas S55/S56);
  // eliminarVoz con la verdad P17 §4 del lado del negocio.
  // ── S84-C23 · seguridad y recuperación ──
  /* ⚠️ S85-C2 — ESTE BLOQUE ESTABA EN VOSEO Y EL RESTO DE LA APP EN TUTEO.
     Medido al tocarlo: 8 cadenas voseantes ("sos", "decís", "Elegí",
     "Probá", "Subí", "subís", "dijiste"→ok, "trabajás") contra `seguridad`
     y `cuenta`, que son tuteo. **Regla 27 está FIRMADA** (tuteo neutro en
     todo el portal) y L-148 la ratifica, así que esto no es preferencia:
     era incumplimiento. Se unifica ACÁ porque la sección se reestructura
     entera — dejar media sección en cada acento sería peor que las dos.
     ☠️ Va al lote de strings de S85 para el gate del founder. */
  documentos: {
    titulo: 'Tu identificación',
    porQue:
      'Con tu documento verificado, las familias ven que eres quien dices ser. Lo revisa una persona de e-PetPlace y no lo ve nadie más.',
    generico: 'Tu identificación fiscal',
    paisLabel: '¿Qué país lo emitió?',
    paisSinDeclarar: 'Todavía no lo dijiste.',
    paisNoDeclarado: 'País sin declarar',
    paisHojaTitulo: 'País que emitió el documento',
    faltaPais: 'Elige el país que lo emitió para poder subirlo.',
    subir: 'Subir el documento',
    subirDeNuevo: 'Subir otro',
    capturaHojaTitulo: '¿Cómo lo subes?',
    camara: 'Tomar una foto',
    galeria: 'Elegir de la galería',
    subido: 'Listo — lo recibimos y lo vamos a revisar.',
    enRevision: 'Lo estamos revisando. Te avisamos apenas tengamos respuesta.',
    aprobado: 'Verificado.',
    rechazado: 'No pudimos validarlo. Prueba con una foto más clara del documento completo.',
    vencido: 'Venció. Sube uno vigente.',
    insigniaVerificado: 'Verificado',
    insigniaEnRevision: 'En revisión',
    permisoCamara: 'Necesitamos permiso para usar la cámara.',
    errorRed: 'Revisa tu conexión y prueba de nuevo.',
    errorSubida: 'No pudimos subir el documento. Prueba de nuevo.',
    errorTitulo: 'No pudimos cargar tus documentos',
    errorCuerpo: 'Puede ser la conexión. Prueba de nuevo.',
    sinCuentaTitulo: 'Primero, tu cuenta de cobro',
    sinCuentaCuerpo:
      'Ahí nos dices bajo qué figura trabajas, y con eso sabemos qué documento pedirte.',
    sinCuentaAccion: 'Crear mi cuenta de cobro',
    /* ── S85-C2 · LAS TRES CAPAS (firma del founder) ──
       Los rótulos dicen QUÉ ES CADA CAPA y, sobre todo, QUÉ HACE CADA UNA
       CON TU TIEMPO: la base habilita, la legal se recolecta, la opcional
       suma. Un prestador que no distingue eso sube todo o no sube nada. */
    capaBase: 'Tu identificación',
    capaLegales: 'Permisos y títulos de tu oficio',
    /* ⚠️ EL COPY NO PROMETE ENCENDIDO, y es firma: la activación de un
       servicio médico la hace el equipo desde el portal admin. Decir
       "sube esto y se activa" sería prometer un acto que esta app no
       ejecuta — y el prestador quedaría esperando algo que nadie disparó. */
    capaLegalesAyuda:
      'Adjúntalos para que el equipo los revise. Nosotros te avisamos cuando queden verificados.',
    capaOpcionales: 'Certificaciones y acreditaciones',
    capaOpcionalesAyuda:
      'Cursos, especializaciones y todo lo que quieras mostrar. No hacen falta para trabajar: suman a tu perfil.',
    tipoTituloProfesional: 'Título profesional',
    tipoRegistroSenescyt: 'Registro SENESCYT',
    tipoPermisoFuncionamiento: 'Permiso de funcionamiento',
    tipoCertificacion: 'Certificación o acreditación',
    /** El vacío de una capa que NO bloquea: invita sin urgencia (17.5). */
    capaSinDocumentos: 'Todavía no subiste ninguno.',
    /** El eje ② solo aplica a veterinaria (LETRA_VERIFICACION §1). */
    capaLegalesSoloVet: 'Los pedimos cuando ofreces servicios veterinarios.',
  },
  seguridad: {
    /** El título de la PANTALLA. Distinto de `titulo`, que rotula la
     *  SECCIÓN de la clave adentro — el contenedor y su contenido dejan de
     *  compartir nombre (la misma regla que mató "Tu cuenta" como celda). */
    tituloPantalla: 'Seguridad',
    errorTitulo: 'No pudimos cargar tus datos',
    errorCuerpo: 'Prueba de nuevo en un momento.',
    titulo: 'Contraseña',
    ayuda: 'La clave con la que entras a la app.',
    actual: 'Tu contraseña actual',
    nueva: 'La nueva contraseña',
    // ⚠️ ESTE 8 ESTABA ESCRITO A MANO mientras su GEMELA de `recuperar` ya se
    // interpolaba — y el comentario de allá dice, textual, «el hardcodeo parió
    // el 6 vs 8». *Se curó el hermano y no el gemelo* (D-721). Ahora las dos
    // leen la misma fuente: MIN_LARGO_CONTRASENA.
    largoMinimo: 'Al menos {{n}} caracteres.',
    confirmar: 'Repite la nueva contraseña',
    /** El ÚNICO error de esta pantalla que el servidor no puede cazar:
     *  para él las dos son válidas. Por eso la voz no culpa a nadie —
     *  describe el hecho y deja claro qué corregir (17.4). */
    noCoinciden: 'Las dos contraseñas no coinciden. Escríbelas de nuevo.',
    cambiar: 'Cambiar contraseña',
    listo: 'Listo — tu contraseña quedó cambiada.',
    // la voz de las ocho cuentas solo-Google: NO dice "no coincide"
    soloGoogle:
      'Entras a e-PetPlace con Google, así que todavía no tienes una contraseña propia. Puedes crear una desde recuperar: te enviamos un código a tu correo.',
    irARecuperar: 'Crear una contraseña',
    esperaConNumero: 'Probaste varias veces seguidas. Espera {{s}} segundos y vuelve a intentar.',
    esperaSinNumero: 'Probaste varias veces seguidas. Espera un momento y vuelve a intentar.',
  },
  recuperar: {
    titulo: 'Recuperar tu contraseña',
    // ⭐ S88-C (D-659): «6 dígitos» → 8. El 6 era una promesa inventada —
    // el código real medido en dispositivo trae OCHO (par S87, captura con
    // el rótulo y el código juntos). Literal y no interpolado: el largo es
    // config del proveedor (otp_length) y A no exporta constante; si algún
    // día la exporta, estas tres frases pasan a {{n}}.
    ayudaPedir: 'Escribe el correo con el que entras y te enviamos un código de {{n}} dígitos.',
    email: 'Tu correo',
    pedir: 'Enviar el código',
    // la MISMA frase exista o no la cuenta
    siTieneCuenta: 'Si {{email}} tiene una cuenta, ya le enviamos un código de {{n}} dígitos.',
    // D-628 — se retira cuando S86 ponga plantilla y remitente propios
    avisoCorreo: 'El correo puede llegar en inglés y desde una dirección que no es la nuestra. Si no lo ves, revisa spam.',
    codigo: 'El código de {{n}} dígitos',
    // S88-C (D-659): el paso 2 abre diciendo que el código YA quedó atrás —
    // sin esta frase, un rebote de clave se lee como "algo del código".
    codigoVerificado: 'Código verificado. Ahora elige tu nueva contraseña.',
    verificar: 'Verificar el código',
    nueva: 'La nueva contraseña',
    // la regla se interpola desde MIN_LARGO_CONTRASENA (regla única) —
    // el hardcodeo parió el «6 vs 8» entre registro y recuperar.
    largoMinimo: 'Al menos {{n}} caracteres.',
    cambiar: 'Cambiar contraseña y entrar',
    otroCodigo: 'Enviar otro código',
    listo: 'Listo — ya puedes entrar.',
    esperaConNumero: 'Pediste varios códigos seguidos. Espera {{s}} segundos y vuelve a intentar.',
    esperaSinNumero: 'Pediste varios códigos seguidos. Espera un momento y vuelve a intentar.',
  },

  /** S85-C12 — las piezas de DATOS que no esperan motor. */
  datos: {
    equipoTitulo: 'Tu equipo',
    equipoNoCargo: 'No pudimos cargar tu equipo. Prueba de nuevo.',
    plataTitulo: 'Tu plata',
    plataNoCargo: 'No pudimos cargar tus cobros. Prueba de nuevo.',
    plataHito: 'Cuando cobres por la app, lo que te toca aparece acá.',
    plataUno: 'Tienes 1 servicio cobrado esperando liquidación.',
    plataVarios: 'Tienes {{n}} servicios cobrados esperando liquidación.',
    verLiquidaciones: 'Ver tus liquidaciones',
  },
  miCuenta: {
    titulo: 'Tu cuenta',
    perfil: 'Tu perfil',
    /** S85-C2: la puerta NUEVA de la raíz — lo que solo ve el equipo. */
    negocio: 'Tu negocio',
    preferencias: 'Preferencias',
    // S61-B12: el header CD de la portada (D-370) · LOTE S61, GATE PENDIENTE
    // S79-B (T2-B3): `oficioAmbos` MURIÓ (Ley 37) — la voz de oficio es la
    // lista unida de lib/voz-oficio, y entran los dos oficios MUDOS
    // (la cohorte que se recluta es de vets) · LOTE S79, GATE PENDIENTE
    oficioPaseos: 'Paseos',
    oficioEstetica: 'Estética',
    oficioAdiestramiento: 'Adiestramiento',
    oficioVeterinaria: 'Veterinaria',
    /* ☠️ S85-C39 · `fundador: 'Prestador fundador'` MURIÓ en sus dos
       consumidores. Repetía el acto de habla que el founder acaba de
       rechazar: OTORGABA UN RECONOCIMIENTO en vez de decir un hecho.
       El eje de tiempo dice lo mismo sin condecorar a nadie — y el año
       SALE DEL DATO (`cohorte_anio`), jamás horneado: un 2026 escrito a
       mano sería el «15» otra vez, con otra ropa. */
    desde: 'Desde {{anio}}',
    hitoOferta: 'oferta activa',
    hitoAgenda: 'agenda {{n}} días',
    hitoDomicilio: 'a domicilio',
    errorCargar: 'No pudimos cargar esto. Prueba de nuevo.',
    // S77-B — D-536: la voz del fallo del HEADER de Cuenta · LOTE S77,
    // GATE PENDIENTE. No reusa `errorCargar` a propósito: ese dice "esto"
    // y vive como título de EstadoVacio a pantalla completa (perfil.tsx),
    // donde "esto" TIENE antecedente; en el muro no hay antecedente
    // ninguno. Dice que no se pudo CARGAR (no que no exista), nombra el
    // objeto del lado del usuario ("tu negocio", jamás "prestador" ni
    // "identidad" — Ley 17.2), y NO diagnostica la conexión: «revisá tu
    // conexión» queda RESERVADO a errores de red (S47) y acá la causa
    // puede ser otra. La acción va aparte y reusa `agenda.reintentar`,
    // que ya está aprobado — cero copy nuevo para el botón.
    identidadNoCargo: 'No pudimos cargar tu negocio.',
    guardar: 'Guardar cambios',
    nombreLabel: 'Tu nombre',
    telefonoLabel: 'Teléfono',
    telefonoAyuda: 'Con código de país, solo números. ej: 593991234567',
    emailLabel: 'Email',
    emailAyuda: 'El email no se cambia desde acá todavía.',
    perfilGuardado: 'Listo — tu perfil quedó al día.',
    notificaciones: 'Notificaciones',
    /* ☠️ S88-C · `notifPronto` MURIÓ con la pantalla real (lámina de
       preferencias §7): una superficie que promete un futuro deja de ser
       honesta el día que ese futuro llega y ella sigue diciendo lo mismo. */
    /* S88-C · LA PANTALLA DE PREFERENCIAS (lámina firmada 5-ago).
       Los nombres de fila y las tres voces del porqué son LITERALES
       FIRMADOS (lámina §1/§3). Los canales son los CUATRO firmados por el
       founder en la orden de mesa S88 — «push» no es vocabulario de nadie.
       Las líneas de ejemplo (notifEj*) son PROPUESTAS medidas contra el
       catálogo vivo: la mesa las firma antes de que viajen. */
    notifLey: 'Elegís por dónde te llegan, no si te llegan.',
    notifFilaOperacion: 'Tus citas y servicios',
    notifFilaSaludSeguridad: 'Cuidado y salud',
    notifFilaSeguridadCuenta: 'La seguridad de tu cuenta',
    notifFilaSaldoPagado: 'Lo que ya pagaste',
    notifFilaRelacional: 'Mensajes y respuestas',
    notifFilaResumen: 'Resúmenes',
    notifFilaComercial: 'Novedades y ofertas',
    notifPorqueSaludSeguridad: 'Estos avisos siempre llegan. Elegís por dónde, no si te llegan.',
    notifPorqueSeguridadCuenta: 'Los avisos de tu cuenta siempre llegan. Elegís por dónde.',
    notifPorqueSaldoPagado: 'Si algo que ya pagaste está por vencer, te avisamos siempre.',
    /* ✅ Ejemplos POR FILA — FIRMADOS por el founder (6-ago-2026), sin
       «Ej.:» (la forma ya se lee como ejemplo). `saldo_pagado` NO tiene
       línea: la mesa firmó que esa fila NO se muestra al prestador (sus
       seis tipos son del que PAGA) — el ocultamiento espera la audiencia
       DERIVABLE del catálogo (freno declarado: hoy no existe columna). */
    notifEjOperacion: 'Una cita solicitada, tu liquidación disponible, un documento aprobado.',
    notifEjSaludSeguridad: 'Alertas de salud de las mascotas que atendés.',
    notifEjSeguridadCuenta: 'Si alguien entra a tu cuenta o cambia tu contraseña.',
    notifEjRelacional: 'Mensajes nuevos de las familias que atendés.',
    notifEjComercial: 'Promociones, descuentos y novedades de e-PetPlace.',
    notifPorDonde: 'Por dónde te llegan',
    canalEnApp: 'En la app',
    canalTelefono: 'En el teléfono',
    canalCorreo: 'Por correo',
    canalWhatsapp: 'WhatsApp',
    notifPermisoNegado: 'El permiso de notificaciones del sistema está apagado — los avisos «En el teléfono» no van a llegar hasta que lo enciendas en los ajustes del teléfono.',
    /* ⭐ S90-B · D-680 — LA INVITACIÓN DE LA CASA (lámina FIRMADA
       `LAMINA_PERMISO_NOTIFICACIONES` §3). Los cuatro textos viajan
       VERBATIM del cliente por orden de mesa: las voces se firmaron con la
       lámina y NO vuelven a firmarse por cambiar de casa.
       ⚠️ HALLAZGO A LA MESA, no enmienda: la lámina se titula «(cliente)» y
       su §3 declara los ejemplos del cuerpo como deliberados para ESA
       audiencia — «una vacuna por vencer» es del mundo del dueño, no del
       prestador. No se reescribe acá (la voz es del founder); queda
       nombrado en el reporte para que la mesa decida. */
    notifInvitacionTitulo: 'Avisos en tu teléfono',
    notifInvitacionCuerpo: 'Cuando pase algo importante — una cita confirmada, una vacuna por vencer — te avisamos en el teléfono, aunque la app esté cerrada. Lo cambias cuando quieras desde Preferencias.',
    notifInvitacionSi: 'Sí, avisarme',
    notifInvitacionNo: 'Ahora no',
    /* El momento del opt-in de WhatsApp (lámina §4). El TEXTO es el literal
       FIRMADO por el founder (5-ago) y ES la evidencia que se guarda —
       si cambia el texto, cambia la evidencia futura; la vieja se conserva. */
    waConsentTitulo: 'Avisos por WhatsApp',
    waConsentTexto: 'Quiero recibir avisos de e-PetPlace por WhatsApp en este número. Puedo desactivarlo cuando quiera desde Preferencias.',
    waConsentAceptar: 'Quiero recibirlos',
    waConsentCancelar: 'Ahora no',
    eliminarCuenta: 'Eliminar cuenta',
    /* ⭐ S86-C · «El movimiento» baja de NEGOCIO con su voz VERBATIM: es
       plata de la cuenta comercial, no configuración del oficio. */
    movimiento: 'El movimiento',
    movimientoDetalle: 'Los presupuestos que armaste y en qué quedaron.',
    /* ⭐ S86-C · D-649. La voz del estado final es la que carga el trabajo:
       decir «lista» sin decir CUÁNDO la ve deja al prestador esperando un
       cambio que no va a llegar hasta que cierre y abra.
       ⚠️ `updNoSePudo` jamás dice «estás al día» — es lo contrario de lo
       que sabemos (L-197). */
    buscarUpdate: 'Buscar actualizaciones',
    updBuscando: 'Buscando…',
    updAlDia: 'Ya tienes la última versión.',
    updDescargando: 'Descargando la actualización…',
    updDescargado: 'Lista. Se aplica la próxima vez que abras la app.',
    updNoSePudo: 'No pudimos consultar si hay una versión nueva.',
    eliminarVoz:
      'Va a estar acá, con todas las de la ley. Antes tenemos que resolver bien qué pasa con tus citas ya pagadas, tus planes vivos y tu saldo por liquidar — un negocio con compromisos no se borra a la ligera.',
    entendido: 'Entendido',
    enConstruccion: 'Este paso se monta sobre lo que ya existe: en cuanto entre su composición, va a aparecer acá.',
    // S60-B2 — la sección de la ENTIDAD en Tu perfil (P17 v1.1, visto
    // del arquitecto) · LOTE S60, GATE PENDIENTE. Reuso declarado:
    // ofertaPaseo.visibleTitulo/noVisibleTitulo (la voz 7.13 de las
    // portadas, misma key).
    negocioTitulo: 'Tu negocio',
    nombreComercialLabel: 'Nombre público',
    nombreComercialAyuda: 'Tu nombre público cambia junto con tu perfil público — llega pronto.',
    tipoLabel: 'Oficio',
    tipoPaseador: 'Paseador',
    tipoClinica: 'Clínica veterinaria',
    tipoGrooming: 'Grooming',
    // S79-B (T3-B2): sedeLabel/sedeAyuda/sinCargar MURIERON (Ley 37) —
    // la sede read-only ("se cambia con el equipo") dejó de ser verdad:
    // la captura viva es el bloque `sede` de esta misma app.
    descripcionLabel: 'Descripción',
    descripcionAyuda: 'Lo que las familias leen de tu negocio.',
    contactoTitulo: 'Contacto del negocio',
    whatsappLabel: 'WhatsApp',
    emailContactoLabel: 'Email de contacto',
    sitioWebLabel: 'Sitio web',
    negocioGuardado: 'Listo — tu negocio quedó al día.',
    // S76-B1 — D-505: el logo del negocio (la firma gana productor) ·
    // LOTE S76, GATE PENDIENTE
    logoLabel: 'El logo de tu negocio',
    logoAyudaSin: 'Sin logo, tu negocio se muestra con sus iniciales.',
    logoAyudaCon: 'Aparece donde tu negocio firma.',
    logoAgregar: 'Agregar tu logo',
    logoCambiar: 'Cambiar el logo',
    logoQuitar: 'Quitar el logo',
    logoTomarFoto: 'Tomar una foto',
    logoGaleria: 'Elegir de la galería',
    logoGuardado: 'Listo — tu logo quedó guardado.',
    logoQuitado: 'Tu negocio vuelve a mostrarse con sus iniciales.',
    logoErrorRed: 'No pudimos subir el logo. Revisa tu conexión.',
    logoErrorGrande: 'El logo supera 5MB. Elige una versión más liviana.',
    logoErrorSubida: 'No pudimos guardar el logo. Prueba de nuevo.',
    logoPermisoCamara: 'Necesitamos permiso para usar la cámara.',
  },
  // El flujo de atención E2E (S44, migrado en D-315 pata prestador).
  // VOZ EMOCIONAL APROBADA por founder (lote S55, es y en) — hunk de
  // comentario editado por la Sesión A por orden explícita del founder.
  // MOTIVOS_GPS siguen es-only en DB (D-324, deuda aparte).
  cita: {
    // detalle / preparar
    tituloPaseoDe: 'Paseo de {{nombre}}',
    tituloPaseo: 'Paseo',
    noDisponible: 'Esta cita ya no está disponible',
    noDisponibleDetalle: 'Puede haberse movido o cancelado. Vuelve a la agenda para ver tus paseos de hoy.',
    noDisponibleDetalleCorto: 'Vuelve a la agenda para ver tus paseos de hoy.',
    volverAgenda: 'Volver a la agenda',
    estadoPorConfirmar: 'Por confirmar',
    hoy: 'hoy',
    iniciarPaseo: 'Iniciar paseo',
    // S60-C2.1 ampliada: el porqué del CTA ausente en cita futura
    empiezaElDia: 'El paseo se empieza el día de la cita.',
    // A dónde ir — D-339 (S56-B TAREA 3) · LOTE S56, GATE PENDIENTE
    direccionTitulo: 'A dónde ir',
    // marca "parte del plan" (D-338, S56-B T7) · LOTE S56, GATE PENDIENTE
    parteDelPlan: 'Parte del plan de {{nombre}}',
    direccionAbrirMapa: 'Abrir en el mapa',
    direccionSinDato: 'Esta cita no tiene una dirección registrada.',
    direccionMapaError: 'No pudimos abrir el mapa.',
    // durante
    // S59-B3 voz única "En vivo" (§7): el título conserva el sustantivo,
    // la palabra del estado migra · LOTE S59, GATE PENDIENTE
    enCursoTitulo: 'Paseo en vivo',
    gpsIniciando: 'GPS iniciando',
    gpsActivo: 'GPS activo',
    gpsDetenido: 'GPS detenido',
    gpsSinPermiso: 'Sin permiso de ubicación',
    gpsNoDisponible: 'GPS no disponible',
    gpsError: 'GPS con error',
    // LOTE S62 (curas del track): los estados honestos nuevos
    gpsSinPermisoAjustes: 'Permiso de ubicación bloqueado',
    gpsAproximado: 'Ubicación aproximada',
    gpsSinSenal: 'GPS sin señal',
    unPunto: '1 punto',
    puntos: '{{n}} puntos',
    sinGpsExplicacion:
      'Necesitamos tu ubicación para registrar el recorrido que ve la familia. El paseo puede seguir igual — sin ruta, al terminar te pedimos contar qué pasó.',
    sinGpsAjustesExplicacion:
      'La app no tiene permiso de ubicación y el sistema ya no vuelve a preguntar. Actívalo en los ajustes del teléfono para registrar el recorrido.',
    gpsAproximadoExplicacion:
      'Tu teléfono está compartiendo la ubicación aproximada. El recorrido se registra, pero impreciso — para la ruta real, permite la ubicación precisa.',
    gpsSinSenalExplicacion:
      'El GPS todavía no entrega tu posición. Si estás bajo techo, suele llegar al salir al aire libre.',
    abrirAjustes: 'Abrir ajustes',
    pedirPrecision: 'Permitir precisa',
    trackPendienteRed:
      'Los últimos puntos del recorrido no se guardaron. Revisa tu conexión y toca Terminar de nuevo.',
    // LETRA FIRMADA founder S62 (voz honesta D-292: el motor es foreground)
    // S63-B: queda SOLO para el modo fallback 'pantalla' — con el permiso
    // "siempre" concedido la reemplaza trackEnBolsillo (D-292 vivo).
    trackPantallaEncendida: 'El recorrido se registra solo con la pantalla encendida.',
    trackEnBolsillo: 'El recorrido se registra aunque guardes el teléfono.',
    // D-292 (S63-B): la voz honesta ANTES del prompt nativo del "siempre" +
    // la notificación del servicio (Android la exige; es la voz del sistema).
    fondoHojaTitulo: 'El recorrido, con el teléfono guardado',
    fondoHojaExplicacion:
      'Si permites la ubicación "siempre", el recorrido se registra aunque guardes el teléfono en el bolsillo o la pantalla se apague. Se usa solo mientras dura un paseo y consume algo más de batería mientras caminas.',
    fondoHojaComo: 'En la pantalla del sistema, elige la opción "Permitir todo el tiempo".',
    fondoHojaPermitir: 'Permitir ubicación siempre',
    fondoHojaAhoraNo: 'Ahora no',
    fondoNotificacionTitulo: 'Paseo en curso',
    fondoNotificacionCuerpo: 'e-PetPlace registra el recorrido mientras dura el paseo.',
    probarDeNuevo: 'Probar de nuevo',
    parteDelPerro: 'Parte del perro',
    evidencia: 'Evidencia',
    fotosSufijo: '{{n}} fotos',
    parteRegistrado: 'Parte registrado',
    fotoNoSubio: 'La foto no se subió. Tócala para reintentar.',
    // S61-B10: la CAUSA en detalle (los errores dirigen, Ley 17.4;
    // 'revisa tu conexión' RESERVADO a red) · LOTE S61, GATE PENDIENTE
    fotoNoSubioRed: 'Revisa tu conexión e inténtalo de nuevo.',
    fotoNoSubioLectura: 'No se pudo leer la foto del dispositivo.',
    agregarNotaIncidencia: 'Agregar nota o incidencia',
    terminarPaseo: 'Terminar paseo',
    notaOIncidencia: 'Nota o incidencia',
    nota: 'Nota',
    incidencia: 'Incidencia',
    // LOTE S62 (migración clase-4 §15b.2): labels de grupo de la Hoja;
    // los chips de severidad pasan a voz corta (el label ya dice qué son)
    queRegistras: 'Qué registras',
    incidenciaTipo: 'Tipo de incidencia',
    severidad: 'Severidad',
    elegirIncidencia: 'Elige qué pasó del catálogo.',
    severidadMedia: 'Media',
    severidadAlta: 'Alta',
    quePaso: 'Qué pasó',
    notaPlaceholder: 'Algo que quieras dejar anotado.',
    incidenciaPlaceholder: 'Cuenta qué pasó con calma.',
    registrarIncidencia: 'Registrar incidencia',
    guardarNota: 'Guardar nota',
    incidenciaRegistrada: 'Incidencia registrada',
    notaRegistrada: 'Nota registrada',
    terminarTitulo: 'Terminar el paseo',
    terminarExplicacion:
      'El recorrido y el tiempo quedan registrados. Después vas a poder completar el parte y mandarle un mensaje a la familia.',
    seguirPaseando: 'Seguir paseando',
    sinRutaMotivo: 'No registramos ruta GPS en este paseo. Cuéntale a la familia qué pasó:',
    // cierre
    cierreTitulo: 'Parte del paseo',
    resumenConteos: '{{puntos}} puntos gps · {{fotos}} fotos · {{notas}} notas',
    sinRutaGps: 'Sin ruta GPS: {{motivo}}',
    // S80-B19 🔴 (guard del mapa nativo — la voz honesta del puente;
    // el GPS graba igual, solo el dibujo espera build) · LOTE S80
    // S81-B1-2 (GATE PENDIENTE — lote S81): la primera mitad dice la
    // VERDAD (esta instalación salió sin la clave del mapa — no es una
    // función que falte); la segunda mitad se CONSERVA INTACTA (honesta,
    // salvó el paseo — mandato de la tanda).
    mapaApagadoVivo: 'Esta instalación de la app salió sin la clave del mapa — se corrige con una versión nueva. El recorrido se sigue grabando igual.',
    mapaApagadoCerrado: 'Esta instalación de la app salió sin la clave del mapa — se corrige con una versión nueva. El recorrido quedó grabado.',
    // LOTE S62 (curas del track): el hueco del mapa deja de callar
    sinRutaNoRegistrada: 'El recorrido no se registró en este paseo.',
    sinRutaSoloPartida: 'Solo se registró el punto de partida — el recorrido no alcanzó a dibujarse.',
    faltaNovedad: 'Registra al menos una novedad del paseo para enviar el parte.',
    registrarNovedad: 'Registrar novedad',
    mensajeFamilia: 'Mensaje a la familia',
    mensajeFamiliaAyuda: 'Opcional — va con el parte.',
    enviarParte: 'Enviar parte y cerrar',
    parteEnviado: 'Parte enviado',
    parteEnviadoMono: 'parte enviado',
  },
  mascotas: {
    // ver la nota de `tabs.mascotas`: el nombre visible es DATOS, la key no.
    titulo: 'Datos',
    // §2.6: vacío = en preparación, jamás fracasado (voz aprobada S51):
    vacio: 'Las vidas que cuides van a vivir acá',
    vacioDetalle: 'Con tu primera atención cerrada, la mascota entra a tu historial con su expediente.',
    unaAtencion: '1 atención',
    atenciones: '{{n}} atenciones',
    error: 'No pudimos cargar las mascotas',
    errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
    /* ⭐ S86-C · «Tu equipo» baja de NEGOCIO a DATOS. El resumen cuenta
       ACTIVAS —"¿con cuánta gente cuento?"— y jamás inventa avisos: la
       lámina muestra «1 aviso» y ese lector NO existe todavía, así que el
       resumen dice lo que sabe y nada más. */
    equipoTitulo: 'Tu equipo',
    equipoResumen1: '1 persona',
    equipoResumen: '{{n}} personas',
    equipoInactiva: 'Ya no atiende',
    equipoGestionar: 'Gestionar el equipo',
    /* ⭐ S86-C · EL DASHBOARD (lámina firmada). Voz TUTEO NEUTRO.
       ⚠️ Ningún rótulo compara con otros prestadores ni puntúa (§2.7):
       la trayectoria dice HECHOS. Y todo número de plata declara lo que
       le falta — el asterisco de S85. */
    tuSemana: 'Tu semana',
    kpiAtenciones: 'atenciones',
    kpiAtencionesA11y: '{{n}} atenciones esta semana. Ver las vidas que cuidas.',
    // El delta compara la MISMA porción de la semana anterior.
    kpiDelta: '{{signo}}{{n}} vs. la anterior',
    kpiVidasNuevas: 'vidas nuevas',
    kpiDeltaIgual: 'igual que la anterior',
    kpiSinFamilias: 'sin familias nuevas',
    mixA11y: 'Reparto de atenciones del mes por servicio.',
    kpiFamilia1: '1 familia',
    kpiFamilias: '{{n}} familias',
    kpiSemana: 'esta semana',
    kpiMes: '{{monto}} el mes',
    kpiPlataParcial: '{{n}} sin precio',
    kpiPlataA11y: 'Ingresos de la semana. Ver el detalle.',
    // El hueco habla del PERMISO, no del dato: no falta información,
    // sobra audiencia.
    // ⏪ S89-C — decía «Solo el titular ve los ingresos» y DESCRIBÍA DE
    // MENOS desde 6f0738f: el motor del gemelo (obtener_datos_negocio)
    // deja ver a titular, gestión Y mostrador — par 4/4; el único que lee
    // este hueco es el profesional. Misma cura y MISMA VOZ que su hermano
    // del HOY (S88-C, `hoy.plataSoloTitularDetalle`): la voz no se
    // re-inventa. La key conserva su nombre como el hermano, con esta
    // marca (renombrarla sola divergiría las dos casas del mismo gate).
    kpiPlataSoloTitular: 'Los ingresos los ve quien está en el mostrador',
    diaPorDia: 'Día por día',
    graficaA11y: 'Atenciones por día de la semana, por servicio. {{n}} en total.',
    mixDelMes: 'El mix del mes',
    mixFila: '{{servicio}} · {{pct}}%',
    // Ley 3: el código de motor jamás se pinta. Genérico digno.
    servicioSinVoz: 'Otro servicio',
    vidasTitulo: 'Las vidas que cuidas',
    vidasResumen1: '1 vida',
    vidasResumen: '{{n}} vidas',
    plataTitulo: 'La plata',
    plataResumen: '{{monto}} este mes',
    plataResumenParcial: '{{monto}} este mes · {{n}} sin precio',
    plataDetalle: 'Ver el detalle',
    trayectoriaTitulo: 'Tu trayectoria',
    trayectoriaResumen: 'Desde {{desde}} · {{n}} atenciones',
    trayectoriaAtenciones: '{{n}} atenciones cerradas',
    trayectoriaFamilia1: '1 familia servida',
    trayectoriaFamilias: '{{n}} familias servidas',
    /* ⭐ S86-C · las dos franjas que bajaron de NEGOCIO con su voz
       VERBATIM — una mudanza no es una oportunidad de reescribir voz.
       Siguen «en preparación» porque siguen sin lector, y ése es el dato
       honesto: el detalle NOMBRA qué las despierta. */
    despiertaSeccion: 'Se despierta con el uso',
    resenas: 'Reseñas',
    resenasDetalle: 'Se despierta con tu primera reseña real.',
    casosHeredados: 'Casos que te confíen',
    casosHeredadosDetalle: 'Se despierta con el primer caso que un colega te derive.',
  },
  /* ⭐ S86-C · LA PIZARRA — las citas de tu especialidad sin tratante.
     ⚠️ La voz sale de ACÁ y no del wrapper: `packages/api` no tiene capa
     de idioma (D-539) y habla VOSEO; la voz de producto es TUTEO NEUTRO
     (regla 27 · L-148). Se mapea el CÓDIGO, jamás se pinta `r.mensaje`. */
  pizarra: {
    titulo: 'La pizarra',
    subtitulo: 'De tu especialidad · sin tratante',
    tomar: 'Tomar',
    esTuya: 'Tuya',
    // La fila NO desaparece: lo dice. Decisión firmada de la lámina.
    laTomaron: 'La tomó alguien del equipo',
    tuya: '{{nombre}} es tuya. Ya está en tu jornada.',
    yaTomada: 'Alguien del equipo la tomó primero.',
    yaNoEsta: 'Esa cita ya no está.',
    noEsTuEspecialidad: 'Esa cita es de un servicio que no atiendes.',
    noSosDelEquipo: 'No eres parte del equipo de este negocio.',
    noSePudo: 'No pudimos tomar la cita. Prueba de nuevo.',
    // §2.6 — la vacía no es un fracaso: es buena noticia.
    vacia: 'Nada por tomar — todo tiene tratante.',
    errorTitulo: 'No pudimos leer la pizarra',
    errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
    // ⭐ S88-C (LÁMINA_HOME_POR_ROL) · EL VERBO DE RECEPCIÓN — quien
    // rutea no toma. La Hoja elige a quién; el filtro por chip lo aplica
    // el MOTOR (persona_sin_oficio) · LOTE S88, GATE PENDIENTE
    asignar: 'Asignar',
    asignarQuien: '¿Quién la atiende?',
    asignarConfirmar: 'Asignar la cita',
    asignadaFila: 'Asignada',
    asignada: 'Lista — la cita es de {{nombre}}.',
    asignarSinRol: 'No puedes asignar citas en este negocio.',
    asignarSinOficio: 'Esa persona no atiende este servicio. Elige a alguien del oficio.',
    asignarSinPersonas: 'No pudimos cargar a las personas del negocio. Cierra y prueba de nuevo.',
    // ⏪ S88-C: el lector pasó a ser POR CITA (espeja el chip del oficio) —
    // el vacío ya no dice «sin equipo»: dice la verdad nueva.
    asignarNadie: 'Nadie del equipo atiende este servicio todavía.',
    sinJornada: 'sin horario',
    // Ley 3: el código de motor jamás se pinta.
    servicioSinVoz: 'Atención',
    hoy: 'Hoy',
    manana: 'Mañana',
    // la entrada desde el HOY — solo con algo por tomar
    entrada: 'La pizarra',
    entradaVacia: 'Nada por tomar',
    entradaUna: '1 cita por tomar',
    entradaN: '{{n}} citas por tomar',
  },
  detalleMascota: {
    // señales de cuidado (solo lo REAL del expediente)
    condicionCronica: 'Condición crónica',
    alergias: 'Alergias',
    emergenciaActiva: 'Emergencia activa',
    sinSenales: 'Sin señales de cuidado registradas en su expediente.',
    // S74-B recepción v1: la ETAPA DESTILADA en voz (bautizo founder S51)
    etapaM1: 'Primeros meses',
    etapaM2: 'Creciendo',
    etapaM3: 'Adulto',
    etapaM4: 'Con cuidado especial',
    etapaM5: 'Años dorados',
    etapaError: 'No pudimos leer su etapa. Vuelve a entrar en un momento.',
    carnet: 'Carnet',
    unaVacuna: '1 vacuna registrada',
    vacunas: '{{n}} vacunas registradas',
    // S71: el historial con 0 atenciones habla (Ley 13) — rima con 'Primera vez'
    historialVacio: 'Va a ser tu primera atención con {{nombre}}.',
    carnetVacio: 'Sin vacunas registradas todavía.',
    historial: 'Tu historial con {{nombre}}',
    atencionCerrada: 'Paseo cerrado',
    // S59-B3 voz única "En vivo" (§7) · LOTE S59, GATE PENDIENTE
    atencionEnCurso: 'Paseo en vivo',
    // la familia humana NO es visible por RLS (relevado S51) — cuando
    // el canal interno exista (B5), su lugar nace acá.
    identidad: 'Identidad',
    raza: 'Raza',
    sexo: 'Sexo',
    sexoMacho: 'Macho',
    sexoHembra: 'Hembra',
    nacimiento: 'Nacimiento',
    peso: 'Peso',
    microchip: 'Microchip',
    error: 'No pudimos cargar el expediente',
  },
  negocio: {
    titulo: 'Tu negocio',
    // S77-B — D-541: la voz del bloque que NO SE PUDO LEER · LOTE S77,
    // GATE PENDIENTE. Va en el DETALLE de la fila/tarjeta, así que "esto"
    // sí tiene antecedente: es esa fila. (Por eso acá sí, y en el muro de
    // D-536 no — allá no había a qué apuntar.)
    // Dice que no se pudo CARGAR, jamás que no haya nada configurado —
    // que es toda la deuda. "ahora" marca que es pasajero SIN diagnosticar
    // la causa: «revisá tu conexión» queda RESERVADO a errores de red (S47)
    // y acá puede ser otra. NO promete acción porque no hay ninguna que
    // ofrecer todavía (Ley 17.4): el reintento por causa depende de D-538.
    bloqueNoCargo: 'No pudimos cargar esto ahora.',
    /* ⭐ S98-C · LAS CUATRO VOCES DE LA BALDOSA — cortas POR MEDICIÓN, no
       por estilo: `Baldosa` pinta su detalle con `numberOfLines={1}` sobre
       ~155 px útiles ≈ **22 caracteres** en `apoyo`. Las voces de las
       filas viejas (30-37 car.) truncaban. *Un «4 servicios activo…» no
       informa y encima se ve roto.*
       ⚠️ La del fallo es HERMANA de `bloqueNoCargo`, no la misma: aquélla
       tiene 29 caracteres y no entra. Dice lo mismo con menos, y sigue
       diciendo que no se pudo LEER — jamás que no haya nada configurado,
       que es toda la deuda de D-541. */
    baldosaSinConfigurar: 'Sin configurar',
    baldosaUno: '1 servicio',
    baldosaN: '{{n}} servicios',
    baldosaNoCargo: 'No se pudo leer',
    /* ⭐ S98-C · «Tu tienda» — LAS DOS VISTAS (firma del founder, 14-ago).
       Los nombres tienen que DIFERENCIARLAS: una es el inventario del
       local (suyo, no sale a ningún lado) y la otra es la vitrina que ve
       el cliente. *Si los dos se llamaran «productos», la pantalla no
       diría cuál es cuál — y ésa era justo la firma.* */
    tiendaVitrina: 'Vender por e-PetPlace',
    /* ⏪ Estos dos detalles nacieron ESCRITOS A OJO y la captura los cazó:
       «La vitrina del cliente» (130,2) y «Llega en la próxima versión»
       (174,4) truncan contra los 121 px del teléfono angosto. La versión
       larga de la segunda vive en la Hoja, que es donde hay lugar. */
    tiendaVitrinaDetalle: 'La vitrina',
    tiendaLocal: 'Inventario de tu local',
    tiendaLocalDetalle: 'Muy pronto',
    tiendaV2Titulo: 'Todavía no, pero viene',
    tiendaV2Voz:
      'El inventario de tu local —lo que tenés en tus estantes, sin salir a la vitrina— llega en la próxima versión. Por ahora podés vender por e-PetPlace.',
    tiendaV2Cerrar: 'Entendido',
    enPreparacion: 'En preparación',
    /* ☠️ S98-C · MURIERON OCHO KEYS DE ESTE BLOQUE (Ley 37), con censo en
       TODO el repo antes de tocarlas: `oferta` (el rótulo «Tu oferta», que
       la firma de las dos naturalezas reemplaza) y las SIETE voces de
       detalle de los cuatro mundos —`mundo*Vacio`, `mundo*Detalle`,
       `mundoVeterinariaDetalleUno`—, escritas para una FILA ANCHA y que
       en la baldosa no entran en un renglón.
       *Una key huérfana no rompe nada: solo espera a que alguien la lea y
       crea que rige.* Los NOMBRES de los mundos SIGUEN VIVOS abajo — son
       el título de cada baldosa. */
    // S58-B B1a (§15b.5): NEGOCIO COMO MUNDOS · LOTE S58, GATE PENDIENTE
    paseo: 'Paseo',
    mundoGrooming: 'Grooming',
    // S63-B: el mundo Adiestramiento
    mundoAdiestramiento: 'Adiestramiento',
    // S68-B: el mundo Veterinaria · LOTE S68 · APROBADO founder 18-jul
    mundoVeterinaria: 'Veterinaria',
    // S56-B TAREA 2 (D-341) · LOTE S56, GATE PENDIENTE
    vacaciones: 'Vacaciones',
    vacacionesDetalle: 'Marca los días en que no paseas.',
    /* ☠️ S86-C · MURIERON `equipo` y `equipoDetalle` de este namespace: su
       celda se mudó a DATOS y el censo dio CERO consumidores. Una key
       huérfana no rompe nada — solo espera a que alguien la lea y crea que
       rige (Ley 37). La voz nueva vive en `mascotas.equipo*`, que es donde
       está su pantalla. */
    // S79-B (T2-B5) · los tres mudos ganan sección + voz + disparo (§2.6):
    // el detalle NOMBRA qué despierta a cada uno · LOTE S79, GATE PENDIENTE
    /* ☠️ S86-C · MURIERON acá `resenas`, `resenasDetalle`, `casosHeredados`
       y `casosHeredadosDetalle`: sus celdas se mudaron a DATOS y el censo
       dio CERO consumidores (Ley 37). La voz viajó VERBATIM a `mascotas.*`.
       `despiertaSeccion` SOBREVIVE: estadísticas sigue siendo su habitante
       hasta que el dashboard la reemplace, y ahí se va con ella. */
    /* ☠️ S86-C · MURIERON las voces de ESTADÍSTICAS (celda, sección y
       pantalla): el dashboard de DATOS las reemplazó con datos reales y
       la promesa cumplió su trabajo (Ley 37). Censo corrido: CERO
       consumidores de las cinco. */
    cobros: 'Cobros',
    cuentaComercial: 'Cuenta comercial',
    liquidaciones: 'Liquidaciones',
    // honesto en términos de hitos — JAMÁS "$0" (§2.6):
    liquidacionesDetalle: 'Se despierta cuando empieces a cobrar por la app.',
    // S70-B2-v2: entrada a "El movimiento" (presupuestos del negocio, D-440)
    // S54-B: la verdad del dinero cuando el ledger tiene eventos propios
    liquidacionesPendientes: 'Tienes {{cantidad}} servicios cobrados esperando liquidación.',
    liquidacionesPendientesUno: 'Tienes 1 servicio cobrado esperando liquidación.',
    cuentaComercialDetalle: 'La necesitas antes de cobrar — llega con el ciclo de pagos.',
    idioma: 'Idioma',
    idiomaEs: 'Español',
    idiomaEn: 'English',
    idiomaError: 'No pudimos guardar el idioma. Prueba de nuevo.',
  },
  // Cuenta comercial — S54-B (wizard B2.3, MODELO_FINANCIERO §6.5)
  cuenta: {
    /* ② S84-C34 — FIRMA DEL FOUNDER: "Datos comerciales". El rótulo
       viejo nombraba UNA de las tres cosas que hay adentro (la cuenta) y
       ahora hay tres hermanas — fiscales, bancarios y documentos. */
    titulo: 'Datos comerciales',
    /** S85-C2 (firma del founder): la cuenta bancaria dice PARA QUÉ es.
     *  Sin esta línea, un campo de banco en una pantalla de verificación
     *  se lee como un dato más que pedimos — y no lo es: es por dónde
     *  cobra. */
    bancariosNota: 'En esta cuenta te depositaremos el valor de tus servicios.',
    avisoRevision:
      'Revisamos estos datos uno por uno. Los mira alguien de nuestro equipo y, cuando quedan verificados, tu perfil muestra el sello que las familias ven. Mientras tanto sigues trabajando con normalidad.',
    bancariosSinDeclarar: 'Sin declarar',
    documentos: 'Documentos',
    documentosResumen: 'Tu identificación',
    documentosCargando: 'Cargando…',
    error: 'No pudimos cargar tu cuenta comercial.',
    reintentar: 'Reintentar',
    // peldaño 0 — invitación que educa (solo alcanzable sin cuenta creada)
    invitacionTitulo: 'Para cobrar por la app',
    invitacionCuerpo:
      'La cuenta comercial es tu identidad fiscal en e-PetPlace: con ella el equipo valida quién cobra y te transfiere lo tuyo. Se registra una sola vez.',
    invitacionCta: 'Registrar mi cuenta',
    // peldaños 1-2 — el estado honesto
    estadoEnRevision: 'En revisión',
    estadoEnRevisionVoz:
      'Tu cuenta está en revisión. El equipo la activa — te avisamos cuando esté lista para cobrar.',
    estadoActiva: 'Activa',
    estadoActivaVoz: 'Tu cuenta está activa: puedes cobrar por la app.',
    estadoSuspendida: 'Suspendida',
    estadoSuspendidaVoz: 'Tu cuenta está suspendida. Escríbenos para revisarlo.',
    estadoCerrada: 'Cerrada',
    estadoCerradaVoz: 'Esta cuenta está cerrada y no permite operaciones nuevas.',
    // datos fiscales
    datosFiscales: 'Datos fiscales',
    razonSocial: 'Razón social',
    nombreComercial: 'Nombre comercial',
    identificacion: 'Identificación fiscal',
    pais: 'País',
    // datos bancarios
    datosBancarios: 'Datos bancarios',
    bancariosEducacion:
      'Esta es la cuenta donde vas a recibir tus liquidaciones. Si ofreces servicios, vendes productos o tienes un refugio, todo se consolida acá: recibes una sola transferencia.',
    bancariosFaltan:
      'Aún no cargas tus datos bancarios. Sin ellos el equipo no puede activar tu cuenta ni pagarte.',
    bancariosCta: 'Cargar datos bancarios',
    bancariosActualizar: 'Actualizar datos bancarios',
    banco: 'Banco',
    bancoElegir: 'Elige tu banco',
    titular: 'Titular',
    tipoCuenta: 'Tipo de cuenta',
    tipoCorriente: 'Corriente',
    tipoAhorros: 'Ahorros',
    numeroCuenta: 'Número de cuenta',
    numeroCuentaAyuda: 'Puedes copiarlo con o sin guiones.',
    titularNombre: 'Titular de la cuenta',
    titularNombreAyuda: 'Tal como figura en el banco.',
    titularTipoDocumento: 'Documento del titular',
    titularDocumento: 'Número de documento',
    campoObligatorio: 'Este dato es obligatorio.',
    formatoInvalido: 'El formato no es válido.',
    numeroCuentaInvalido: 'Entre 4 y 34 caracteres — números, espacios o guiones.',
    guardar: 'Guardar',
    bancariosGuardados: 'Datos bancarios guardados.',
    // registro (peldaño 0 → 1)
    nuevaTitulo: 'Registrar cuenta',
    nuevaIdentificacionVoz:
      'Empecemos por tu identificación fiscal — con ella verificamos que la cuenta sea tuya.',
    tipoFiscal: 'Tipo de contribuyente',
    tipoFiscalElegir: 'Elige tu tipo de contribuyente',
    tipoFiscalPersonaNatural: 'Persona natural',
    tipoFiscalPersonaNaturalObligada: 'Persona natural obligada a llevar contabilidad',
    tipoFiscalPersonaJuridica: 'Persona jurídica',
    tipoFiscalSinFinesLucro: 'Entidad sin fines de lucro',
    identificacionAyuda: 'Solo números, sin puntos ni guiones.',
    continuar: 'Continuar',
    nuevaDatosVoz: 'Ahora, los datos con los que factura tu negocio.',
    razonSocialAyuda: 'El nombre legal, como consta en tu RUC o cédula.',
    nombreComercialAyuda: 'El nombre con el que te conocen tus clientes.',
    crear: 'Crear cuenta',
    nuevaCreada: 'Tu cuenta quedó registrada y en revisión.',
  },
  // Vista de Liquidaciones v1 — S55-B (B1, RUTA 3.1.D). Verdad firme:
  // estados honestos, cero promesas de fecha que el motor no da.
  cobros: {
    titulo: 'Liquidaciones',
    error: 'No pudimos cargar tus cobros.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    // peldaño 0 — invitación que educa (JAMÁS $0)
    vacioTitulo: 'Acá vas a ver lo que cobras',
    // ≤3 líneas a 420px: EstadoVacio (registro pantalla) trunca en la 3ª
    vacioCuerpo:
      'Cada servicio pagado por la app queda registrado acá. Tus cobros se agrupan en liquidaciones: una transferencia con el total.',
    vacioSinCuentaActiva:
      'El primer paso es tu cuenta comercial: con ella el equipo valida quién cobra.',
    vacioCta: 'Mi cuenta comercial',
    // peldaño 1 — el desglose esperando liquidación
    esperandoTitulo: 'Esperando liquidación',
    esperandoUno: '1 servicio cobrado',
    esperandoVarios: '{{cantidad}} servicios cobrados',
    esperandoEducacion:
      'Tus cobros se agrupan en liquidaciones: recibes una sola transferencia con el total.',
    pagoSimulado: 'Pago simulado',
    servicioPaseo: 'Paseo',
    // S72-B: la cola de cobro nombra el oficio — el vet reconoce su trabajo.
    servicioGrooming: 'Grooming',
    servicioAdiestramiento: 'Adiestramiento',
    servicioVeterinaria: 'Veterinaria',
    servicioGenerico: 'Servicio',
    // peldaño 2 — las liquidaciones emitidas (la voz de cada estado real)
    liquidacionesTitulo: 'Tus liquidaciones',
    estadoEnPreparacion: 'En preparación',
    estadoAprobada: 'Aprobada',
    estadoPagada: 'Pagada',
    estadoEnRevision: 'En revisión',
    estadoAnulada: 'Anulada',
  },
  // Configuración del servicio de paseo — S55-B (B2, modelo cerrado del
  // founder: menú canónico de bloques + precio por bloque)
  // LOTE S56 — GATE PENDIENTE del founder: servicios.* + horarios.* completos
  // (nacieron post-lectura S55; la aprobación S55 NO los cubre) + las keys
  // de comisión visible (S56-B TAREA 4).
  // Voces del oficio que EL TALLER hereda (S58-B B1b: /servicios murió
  // absorbida; sus keys muertas murieron con ella — Ley 37; los TEXTOS
  // que siguen acá son los de los lotes S56/S57, sin cambios).
  servicios: {
    // la voz honesta con la cuenta comercial no activa (jamás activar desde acá)
    cuentaNoActiva:
      'Puedes configurar ahora. Tus paseos se ofrecen a los clientes cuando el equipo active tu cuenta comercial.',
    // los bloques del menú canónico (voz funcional; nombre_custom la pisa)
    bloque30: 'Salida corta · 30 min',
    bloque60: 'Paseo · 1 hora',
    bloque120: 'Paseo largo · 2 horas',
    bloque180: 'Paseo de 3 horas',
    bloque240: 'Paseo de 4 horas',
    bloque300: 'Paseo de 5 horas',
    pausada: 'Pausado',
    precio: 'Precio',
    precioAyuda: 'En dólares. Rige para reservas nuevas.',
    // nombre/descripcion MURIERON de la UI (v3, L-144: el motor los sirve
    // por COALESCE; su edición muda al perfil del prestador — deuda)
    precioInvalido: 'El precio tiene que ser mayor a cero.',
    // comisión visible donde se pone precio (S56-B TAREA 4, financiero v2.6
    // regla 7.15 — el % viene del dato, jamás hardcodeado)
    // v3.2: plan y paquete son INTERRUPTOR+slider — las voces de campos
    // de texto murieron (Ley 37); las ayudas de vigencia sobreviven
    precioPlanAyuda: 'Rige desde la próxima renovación. Los períodos en curso no cambian.',
    paqueteExplica: 'Tus clientes compran 5, 10 o 15 salidas de este bloque por adelantado. Tú pones un solo precio por salida.',
    precioPaqueteAyuda: 'Rige para los paquetes que se compren desde ahora. Los ya comprados no cambian.',
  },
  // EL ARTE DEL PASEO — el taller (S58-B B1b, adenda founder) · LOTE S58, GATE PENDIENTE
  taller: {
    titulo: 'El arte del paseo',
    error: 'No pudimos cargar tu oferta.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    duracionesTitulo: 'Duraciones y precios',
    // S59-B1 cura de copy (texto EXACTO del founder) · LOTE S59, GATE PENDIENTE
    duracionesIntro: 'Elige las duraciones que ofreces y ponles precio por salida.',
    // etiquetas cortas del menú canónico (la voz larga sigue en servicios.bloque*)
    d30: '30 min',
    d60: '1 hora',
    d120: '2 horas',
    d180: '3 horas',
    d240: '4 horas',
    d300: '5 horas',
    seOfreceAlGuardar: 'Se ofrece cuando guardes.',
    ofrecer: 'Ofrecer esta duración',
    sinDuraciones: 'Aún no ofreces ninguna duración.',
    agregarDuracion: 'Ofrecer otra duración',
    // v3.2: plan y paquete por interruptor (el contrato POR SALIDA intacto)
    planInterruptor: 'Ofrecer plan mensual',
    // corrección founder S58: el plan se dice EN MENSUAL; el contrato
    // sigue por salida (7.14) — la equivalencia se declara abajo
    planRotulo: 'Lo que tu cliente paga al mes',
    // T4-B2: `planEquivale` MURIÓ (Ley 37 — cero derivación por salida);
    // la voz nueva dice el MODELO · LOTE S79, GATE PENDIENTE
    planModeloVoz: 'La familia paga el mes completo. Las salidas que no use no se descuentan.',
    paqueteInterruptor: 'Ofrecer paquete de salidas',
    paqueteRotulo: 'Precio de cada salida al comprar paquete',
    // el wizard (v3): progreso sereno
    paso: 'Paso {{n}} de 3',
    continuar: 'Continuar',
    horariosTitulo: 'Días y horarios',
    horariosExplica: 'Marca los días y agrega la franja: aplica a todos los marcados.',
    dias: 'Días',
    // regla 32: la key ES el índice de DB (0=Domingo)
    diaCorto0: 'D',
    diaCorto1: 'L',
    diaCorto2: 'M',
    diaCorto3: 'X',
    diaCorto4: 'J',
    diaCorto5: 'V',
    diaCorto6: 'S',
    todaLaSemana: 'Toda la semana',
    diasAplica: 'Se aplica a: {{dias}}',
    // ('agregá' del mandato viajó a tuteo neutro, regla 27 — desvío
    // declarado, precedente S57): el vacío tiene CAMINO
    sinFranjas: 'Sin franjas todavía: agrega una.',
    franjaNueva: 'Se agrega cuando guardes.',
    agregarFranjaListo: 'Agregar franja',
    // zonas de cobertura (contrato D-331 v1: declara, no filtra;
    // Ley 22: chips tonales multi-selección del catálogo)
    zonasTitulo: 'Zonas de cobertura',
    zonasExplica: 'Las ciudades donde trabajas. Ayudan a las familias a encontrarte.',
    otraCiudad: 'Otra ciudad',
    ciudadFaltante: 'Si tu ciudad no está, escríbenos: el catálogo lo carga el equipo.',
    listo: 'Listo',
    // S59-B6 cura 3(a): la sección de horarios DECLARA la agenda única
    // (la verdad del motor) · LOTE S59, GATE PENDIENTE
    guardar: 'Guardar tu oferta',
    guardado: 'Tu oferta quedó guardada.',
  },
  // EL ARTE DEL GROOMING — el taller del mundo (S59-B5, MODELO_GROOMING v1.0) · LOTE S59, GATE PENDIENTE
  tallerGrooming: {
    titulo: 'El arte del grooming',
    paso: 'Paso {{n}} de 2',
    serviciosTitulo: 'Servicios y precios',
    serviciosIntro: 'Enciende los servicios que ofreces y ponles precio por talla.',
    especies: '¿A quién atiendes?',
    especiePerro: 'Perros',
    especieGato: 'Gatos',
    especiesMinima: 'Elige al menos una especie.',
    servicioBano: 'Baño',
    servicioBanoCorte: 'Baño y corte',
    ofrecerServicio: 'Ofrecer este servicio',
    talla: 'Talla',
    tallaS: 'Pequeña',
    tallaM: 'Mediana',
    tallaL: 'Grande',
    // la voz corta del espejo (S/M/L de DB se DICE P·M·G en español)
    tallaCortaS: 'P',
    tallaCortaM: 'M',
    tallaCortaL: 'G',
    duracion: 'Duración',
    duracionAyuda: 'Cuánto ocupa tu agenda esa combinación.',
    minutos: '{{n}} min',
    extraInterruptor: 'Cobrar extra por pelaje largo',
    extraRotulo: 'El extra que se suma al precio',
    extraAyuda: 'Se suma una vez por cita. El precio base no cambia.',
    // S61-B2 — DOMICILIO: la config del Dónde (letra founder S61) · LOTE S61, GATE PENDIENTE
    atiendesLocal: 'Atiendes en tu local',
    atiendesDomicilio: 'Atiendes a domicilio',
    dondeMinimo: 'Enciende al menos una: tu local o a domicilio.',
    dondeZonasDetalle: 'Compartidas con todos tus servicios.',
    recargoInterruptor: 'Cobrar recargo por domicilio',
    recargoRotulo: 'El recargo que se suma al precio',
    recargoAyuda: 'Se suma una vez por cita a domicilio. La base y la duración no cambian; el traslado no se cobra aparte.',
    // S59-B6 cura 2 (gate founder): la voz del cupo ES del oficio —
    // 'Paseos simultáneos' era voz prestada · LOTE S59, GATE PENDIENTE
    cupo: 'Mascotas a la vez',
    cupoAyuda: 'Cuántas mascotas puedes atender a la vez en esta franja.',
    cupoUno: '1 mascota a la vez',
    cupoVarios: '{{cantidad}} mascotas a la vez',
  },
  // TU OFERTA DE GROOMING — el resumen, la portada del mundo (S59-B5) · LOTE S59, GATE PENDIENTE
  ofertaGrooming: {
    titulo: 'Tu oferta de grooming',
    vacioTitulo: 'Tu servicio de grooming',
    vacioCuerpo: 'En dos pasos eliges servicios, precios por talla y horarios. Tus clientes solo ven lo que tú actives.',
    vacioCta: 'Configurar tu oficio',
    visibleTitulo: 'Visible para las familias',
    visibleVoz: 'Las familias te encuentran y pueden reservar.',
    noVisibleTitulo: 'Todavía no visible',
    noVisibleCuenta: 'Falta que el equipo active tu cuenta comercial.',
    noVisibleServicios: 'Activa al menos un servicio en el taller.',
    noVisibleHorarios: 'Agrega tus días y horarios en el taller.',
    editarOferta: 'Editar tu oferta',
    servicios: 'Servicios y precios',
    serviciosDetalle: '{{lista}} · desde {{precio}}',
    serviciosPausados: 'Todos pausados',
    sufijoExtra: 'con extra por pelaje largo',
    // S59-B6 cura 4: la fila 'A quién atiendes' MURIÓ fusionada (v3.2,
    // mismo destino que Plan y paquete) — su verdad vive en el subtítulo
    // VIVO de Servicios y precios · LOTE S59, GATE PENDIENTE
    sufijoEspeciesAmbas: 'perros y gatos',
    sufijoEspeciesPerro: 'solo perros',
    sufijoEspeciesGato: 'solo gatos',
    // el DÓNDE v1 es fila informativa (gate del mapa, enmienda 1):
    // local declarado + la puerta honesta de SU servicio
    // S61-B2: la fila informativa ASCENDIÓ a fila-lápiz (domicilio vivo);
    // murió 'llega pronto' (Ley 37) · dondeDomicilioVivo al LOTE S61
    dondeFila: 'Dónde atiendes',
    dondeLocal: 'En tu local',
    dondeDomicilioVivo: 'A domicilio',
    // el espejo dice los 6 precios + extra + duraciones
    espejoServicio: '{{nombre}} · {{tallas}}',
    espejoDuraciones: '{{lista}} min según talla',
    espejoExtra: 'Pelaje largo: +{{monto}}',
    // S61-B6: el dueño YA reserva domicilio (D-392) · LOTE S61, GATE PENDIENTE
    espejoDomicilio: 'A domicilio: +{{monto}}',
  },
  // LA ATENCIÓN DE GROOMING — Antes/Durante/Después (S60-B1, §8 del
  // modelo) · LOTE S60, GATE PENDIENTE. Reusos declarados: cita.nota/
  // incidencia/mensajeFamilia/enviarParte (voz genérica de atención,
  // Ley 17.3) + agenda.conocerMascota + tallerGrooming.talla*.
  citaGrooming: {
    // el Antes — la ficha de 30 segundos
    tituloDe: 'Grooming de {{nombre}}',
    titulo: 'Grooming',
    empezar: 'Empezar grooming',
    talla: 'Talla',
    tallaSinDeclarar: 'Sin declarar',
    pelaje: 'Pelaje',
    pelajeNormal: 'Normal',
    pelajeLargo: 'Largo',
    // señales: REUSO detalleMascota.* (misma voz en toda la casa, Ley 17.3)
    // S61-B7: el momento vital como señal DEL OFICIO · LOTE S61, GATE PENDIENTE
    momentoCachorro: 'Cachorro',
    momentoGatito: 'Gatito',
    momentoSenior: 'Senior',
    // S60-C2.1: la cita de otro día se prepara, no se empieza — el
    // porqué del CTA ausente (apagado jamás es mudo)
    empiezaElDia: 'La sesión se empieza el día de la cita.',
    // discrepancia de talla (§2, patrón P19)
    tallaCorregir: 'La talla no coincide',
    tallaCorregirTitulo: 'La talla real',
    tallaCorregirExplicacion:
      'Si la talla declarada no es la real, regístralo: el perfil queda corregido para las próximas reservas. Esta cita no cambia de precio.',
    tallaCorregirCta: 'Corregir el perfil',
    tallaCorregida: 'Perfil corregido para las próximas.',
    // el Durante
    enCursoTitulo: 'Grooming en vivo',
    alRecibir: 'Al recibir',
    alEntregar: 'Al entregar',
    estadoPelajeElegir: 'Registrar estado del pelaje',
    fotoRecibir: 'Foto al recibir',
    fotoEntregar: 'Foto de entrega',
    fotoEntregarAyuda: 'Se toma con la mascota presente — la necesitas para terminar.',
    serviciosAplicados: 'Servicios aplicados',
    fotosSesion: 'Fotos de la sesión',
    quitar: 'Quitar',
    terminar: 'Terminar sesión',
    terminarTitulo: 'Terminar la sesión',
    terminarExplicacion:
      'El tiempo queda registrado. Después completas el cierre y el mensaje a la familia.',
    // guard de UI: el motor no permite registrar servicios después de
    // terminar — sin esto, el cierre queda en un callejón (§8)
    terminarFaltaServicio: 'Marca al menos un servicio aplicado antes de terminar — el cierre lo necesita.',
    seguirTrabajando: 'Seguir trabajando',
    // el Después — cierre con piso de calidad
    cierreTitulo: 'Cierre del grooming',
    tiempoTrabajo: 'Tiempo de trabajo',
    minutosSufijo: '{{n}} min',
    recibiste: 'Recibiste',
    entregaste: 'Entregaste',
    notasTitulo: 'Notas',
    incidenciasTitulo: 'Incidencias',
    fotosSufijo: '{{n}} fotos',
    cerradoMono: 'parte enviado',
    verTuDia: 'Ver tu día',
    // S61-B3.0 — las piezas S60-A3 cableadas · LOTE S61, GATE PENDIENTE
    // reparación de servicios en el cierre (pieza 2)
    servicioAgregar: 'Agregar servicio',
    // la fecha sugerida §8 (pieza 1): fecha, jamás cita
    proximaSesion: 'Próxima sesión',
    proximaSesionAyuda: 'Una fecha sugerida para la familia — no toca tu agenda.',
    proximaSesionSugerir: 'Sugerir fecha',
    proximaSesionEnSemanas: 'En {{n}} semanas',
    proximaSesionQuitar: 'Sin sugerencia',
    // la vista del día (RPC del oficio)
    diaTitulo: 'Tu día de grooming',
    diaSesiones: 'Sesiones',
    diaCerradas: 'Cerradas con parte',
    diaPorCerrar: 'Por cerrar',
    diaTiempo: 'Tiempo de trabajo',
    diaVacio: 'Todavía no terminaste sesiones hoy.',
    // errores con camino (la voz fina del motor vive en el wrapper)
    noDisponible: 'Esta cita ya no está disponible',
    noDisponibleDetalle: 'Puede haberse movido o cancelado. Vuelve a tu día para ver tus citas.',
    volverHoy: 'Volver a tu día',
  },
  // TU OFERTA DE PASEO — el resumen, la portada del mundo (S58-B B1b) · LOTE S58, GATE PENDIENTE
  ofertaPaseo: {
    titulo: 'Tu oferta de paseo',
    error: 'No pudimos cargar tu oferta.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    // peldaño 0 — la invitación que educa: el taller es el camino
    vacioTitulo: 'Tu servicio de paseo',
    vacioCuerpo: 'En tres pasos eliges duraciones, precios, horarios y zonas. Tus clientes solo ven lo que tú actives.',
    vacioCta: 'Configurar tu oficio',
    // el estado — la verdad del motor (7.13), con camino cuando falta algo
    visibleTitulo: 'Visible para las familias',
    visibleVoz: 'Las familias te encuentran y pueden reservar.',
    noVisibleTitulo: 'Todavía no visible',
    noVisibleCuenta: 'Falta que el equipo active tu cuenta comercial.',
    noVisibleDuraciones: 'Activa al menos una duración en el taller.',
    noVisibleHorarios: 'Agrega tus días y horarios en el taller.',
    // una fila por sección
    duraciones: 'Duraciones y precios',
    duracionesDetalle: '{{n}} duraciones · desde {{precio}}',
    duracionesDetalleUna: '1 duración · desde {{precio}}',
    duracionesPausadas: 'Todas pausadas',
    // el espejo usa las voces largas; el subtítulo vivo de Duraciones,
    // los sufijos (v3.2 — la fila Plan y paquete MURIÓ)
    conPlanYPaquete: 'Con plan mensual y paquete de salidas',
    conPlan: 'Con plan mensual',
    conPaquete: 'Con paquete de salidas',
    sufijoConPlanYPaquete: 'con plan y paquete',
    sufijoConPlan: 'con plan',
    sufijoConPaquete: 'con paquete',
    horarios: 'Días y horarios',
    diaUno: '1 día',
    dias: '{{n}} días',
    franjaUna: '1 franja',
    franjas: '{{n}} franjas',
    sinHorarios: 'Sin horarios',
    zonasSin: 'Sin ciudades declaradas',
    vacacionesSin: 'Sin días bloqueados',
    vacacionesCon: 'Tienes días bloqueados',
    editarOferta: 'Editar tu oferta',
    // solo __DEV__ — jamás viaja a preview/producción
    devWizard: 'Recorrer el wizard (dev)',
    // el espejo — la misma composición en taller (borrador) y resumen (DB)
    espejoTitulo: 'Así lo ve el dueño',
    espejoNada: 'Todavía no apareces en las búsquedas.',
    espejoDuraciones: 'Paseos de {{lista}} · desde {{precio}}',
    espejoDias: 'Recibes reservas: {{lista}}.',
    espejoSinDias: 'Sin días de paseo: aún no apareces en las búsquedas.',
    espejoY: 'y',
  },
  // Vacaciones / bloqueos — S56-B TAREA 2 (D-341) · LOTE S56, GATE PENDIENTE
  vacaciones: {
    titulo: 'Vacaciones',
    error: 'No pudimos cargar tus días libres.',
    errorDetalle: 'Prueba de nuevo en un momento.',
    reintentar: 'Reintentar',
    // peldaño 0 — invitación que educa
    vacioTitulo: 'Tus días libres',
    vacioCuerpo:
      'Cuando te tomes unos días, márcalos acá. Mientras dure un bloqueo no apareces en las búsquedas ni recibes reservas nuevas — tus citas ya confirmadas siguen en pie.',
    vacioCta: 'Marcar mis primeros días',
    // la promesa — la cumple el motor (D-341, seis puertas)
    promesa:
      'Mientras dure un bloqueo no apareces en las búsquedas ni recibes reservas nuevas. Tus citas ya confirmadas siguen en pie.',
    sinMotivo: 'Días bloqueados',
    vigente: 'En curso — no apareces en las búsquedas.',
    quitar: 'Quitar',
    agregar: 'Marcar más días',
    // formulario
    nuevoTitulo: 'Marcar días libres',
    desde: 'Desde',
    duracion: 'Cuánto tiempo',
    unDia: '1 día',
    dias: '{{n}} días',
    unaSemana: '1 semana',
    dosSemanas: '2 semanas',
    tresSemanas: '3 semanas',
    unMes: '1 mes',
    hastaInclusive: 'Hasta el {{fecha}}, inclusive.',
    motivo: 'Motivo (opcional)',
    motivoAyuda: 'Para acordarte de qué era.',
    crear: 'Bloquear estos días',
    creado: 'Listo. Esos días no recibes reservas.',
    quitado: 'Bloqueo quitado.',
  },
  // Voces de las franjas que EL TALLER hereda (S58-B B1b: /horarios murió
  // absorbida; keys muertas fuera — Ley 37; textos de los lotes S56 intactos).
  // ── S78-B · LA AGENDA DE RECEPCIÓN (la Puerta) · LOTE S78, GATE
  //    PENDIENTE. CERO CLÍNICO (D-489). "cita" de cara a la familia. ──
  recepcion: {
    titulo: 'Tu día en la puerta',
    puerta: 'En la puerta',
    registrarAtencion: 'Registrar atención',
    vistaEtiqueta: 'Qué día ver',
    vistaHoy: 'Hoy',
    vistaAdelante: 'Adelante',
    adelanteEtiqueta: 'Días próximos — solo lectura',
    delNegocio: 'Del negocio · por asignar',
    personaFallback: 'Sin nombre',
    citasDelDia: '{{n}} hoy',
    porLlegar: 'Por llegar',
    adentro: 'Adentro',
    adentroCon: 'Adentro con {{nombre}}',
    atendida: 'Atendida',
    noVino: 'No vino',
    // ⭐ S88-C · LA BANDA «EN LA PUERTA» del HOY consolidado (firma
    // founder: las tres huérfanas del censo vuelven) · LOTE S88, GATE PENDIENTE
    marcarLlegada: 'Marcar llegada ({{n}} por llegar)',
    nadiePorLlegar: 'Nadie más por llegar hoy.',
    puertaError: 'No pudimos leer la puerta. Se reintenta solo.',
    solicitudPendiente: 'Autorización pedida a la familia de {{mascota}}',
    solicitudReloj: 'quedan {{min}} min',
    solicitudExpirada: 'La familia de {{mascota}} no respondió a tiempo',
    solicitudExpiradaCuerpo: 'La visita sigue como registro del mostrador.',
    sinCitas: 'No hay citas agendadas.',
    sinCitasCamino: 'Si alguien llega, regístralo y queda en el expediente.',
    errorDia: 'No pudimos cargar el día. Prueba de nuevo.',
  },
  horarios: {
    // ── S78-B TURNOS · vocabulario cerrado: turno (plantilla del
    //    negocio) · jornada (lo que la persona tiene) · cita (familia —
    //    JAMÁS "turno" de cara a ella). LOTE S78, GATE PENDIENTE ──
    jornadas: 'Jornadas',
    jornadasHint: 'Cada persona tiene su propio horario.',
    jornadaTitular: 'Titular',
    jornadaSin: 'Sin jornada',
    jornadaPausadaCard: 'Jornada pausada',
    jornadaUsaTurno: 'Usa el turno del negocio',
    jornadaPropia: 'Jornada propia',
    guardaAntes: 'Guarda o descarta los cambios antes de cambiar de persona.',
    personaError: 'No pudimos cargar esa jornada. Prueba de nuevo.',
    nadieTitulo: 'Todavía nadie tiene jornada',
    nadieCuerpo: 'Sin horarios no aparecen cuando una familia busca una cita. Carga la primera y vas a poder reusarla como turno.',
    turnoTitulo: 'El turno del negocio es {{rango}}',
    turnoCuerpoPropia: '{{nombre}} trabaja en otro horario. Si quieres, puedes copiarle el turno del negocio.',
    turnoCuerpoSin: 'Puedes darle el turno del negocio para que arranque con el mismo horario.',
    turnoCta: 'Usar el turno del negocio',
    turnoCitasConservadas: 'Tiene citas fuera del nuevo horario. Se conservan como están; el turno rige para las nuevas.',
    // LOTE S62 (D-386): la elección de organización de la agenda
    modoEtiqueta: 'Cómo organizas tu agenda',
    modoUniversal: 'Una agenda para todo',
    modoPorServicio: 'Por servicio',
    modoExplicaUniversal: 'Tus franjas valen para todos tus servicios.',
    modoExplicaPorServicio: 'Cada servicio tiene sus propias franjas.',
    modoCambiarTitulo: 'Cambiar la organización',
    // S68-B8 (firma founder sobre el hallazgo del gate): la IDA es
    // CONVERSIÓN con voz (nada se borra); la VUELTA es destructiva y lo
    // dice entero. modoCambiarConFranjas murió (Ley 37) · LOTE S68 · APROBADO founder 18-jul
    convertirTitulo: 'Convertir tu agenda',
    convertirVoz:
      'Tus franjas generales pasarán a vivir en cada servicio — no se borra nada. Desde ahí ajustas cada servicio por separado.',
    convertirCta: 'Convertir',
    convertido: 'Listo: tus franjas ahora viven en cada servicio.',
    volverVoz:
      'Volver al horario general borrará las franjas específicas de cada servicio. Tendrás que declarar tu horario de nuevo.',
    modoBorradorAviso: 'Tienes cambios sin guardar en este taller — guárdalos antes o se perderán.',
    ofertasAplicaUniversal:
      'Con algunos servicios desmarcados, la franja pasa a ser específica — tu agenda se convierte a "por servicio".',
    modoCambiarConfirmar: 'Eliminar franjas y cambiar',
    modoCambiado: 'Tu agenda cambió de organización.',
    ofertasAplica: 'Para qué servicios',
    ofertasNinguna: 'Marca al menos un servicio para la franja.',
    agregarFranja: 'Agregar franja',
    // regla 32: 0=Domingo … 6=Sábado (la key ES el índice de DB)
    dia0: 'Domingo',
    dia1: 'Lunes',
    dia2: 'Martes',
    dia3: 'Miércoles',
    dia4: 'Jueves',
    dia5: 'Viernes',
    dia6: 'Sábado',
    // la fila de franja: el cupo es la voz humana, la hora es de máquina
    cupoUno: '1 paseo a la vez',
    cupoVarios: '{{cantidad}} paseos a la vez',
    pausada: 'Pausada',
    nuevaTitulo: 'Nueva franja',
    desde: 'Desde',
    hasta: 'Hasta',
    horaElegir: 'Elige la hora',
    cupo: 'Paseos simultáneos',
    cupoExclusivo: 'Este servicio se atiende de a uno.',
    cupoTecho: 'Hasta {{n}} en simultáneo — es el máximo de tu negocio, no de esta franja.',
    cupoAyuda: 'Cuántos paseos puedes atender a la vez en esta franja.',
    pausar: 'Pausar',
    reactivar: 'Reactivar',
    quitar: 'Quitar franja',
    quitarConfirmacion: 'Tus clientes ya no van a poder reservar en esta franja.',
    quitarConfirmar: 'Sí, quitar',
    cancelar: 'Cancelar',
    solape: 'Esa franja se cruza con una que ya tienes ese día.',
  },
  // S63-B: clips de la sesión de adiestramiento (MODELO_ADIESTRAMIENTO
  // §5/§12.3 — techo 15-30s ×3; cola local hasta el bucket de la A).
  clips: {
    titulo: 'Clips de la sesión',
    explica:
      'Graba momentos cortos del progreso — un "sentado" logrado se ve mejor en movimiento. Cada clip va de {{min}} a {{max}} segundos, hasta {{techo}} por sesión.',
    grabarClip: 'Grabar clip',
    empezarAGrabar: 'Empezar a grabar',
    detener: 'Detener',
    cancelar: 'Cancelar',
    revisarTitulo: 'Revisar clip',
    usarClip: 'Usar clip',
    descartar: 'Descartar',
    descartarYRepetir: 'Descartar y repetir',
    repetir: 'Grabar de nuevo',
    quitarClip: 'Quitar clip',
    quedoCorto: 'Quedó corto: los clips van de 15 a 30 segundos. Graba uno nuevo con calma.',
    clipN: 'Clip {{n}}',
    techoAlcanzado: 'Ya registraste los {{techo}} clips de esta sesión.',
    // Tanda corta S63-B (cola conectada): la voz habla SOLO por los
    // clips sin registrar — el stub murió.
    envioPendiente: 'Los clips sin enviar quedan solo en este teléfono — no llegan al parte de la familia.',
    enviando: 'Enviando…',
    enElParte: 'En el parte de la familia',
    noSeEnvio: 'No se envió. Tócalo para reintentar.',
    enEsteTelefono: 'En este teléfono',
    reintentarEnvio: 'Reintentar envío',
    sinPermiso: 'Necesitamos la cámara y el micrófono para grabar el clip — las órdenes que da tu voz son parte del progreso.',
    abrirAjustes: 'Abrir ajustes',
    probarDeNuevo: 'Probar de nuevo',
  },
  // S63-B (Bloque 3 parcial): la ficha del Antes de adiestramiento (§5).
  adiestramiento: {
    titulo: 'Ficha de la sesión',
    tituloDe: 'Ficha de {{nombre}}',
    momentoCachorro: 'Cachorro',
    momentoSenior: 'Años dorados',
    senalesTitulo: 'Cómo se comporta en sus paseos',
    senalesVacio: 'Sus paseos no registran señales de comportamiento todavía.',
    senalesOrigen: 'Lo registraron los paseadores durante paseos reales.',
    programasTitulo: 'Programas contigo',
    programasVacio: 'Todavía no hizo programas contigo.',
    programaSesiones: '{{n}} sesiones',
    bitacoraTitulo: 'La bitácora de la familia',
    bitacoraVacia: 'La familia todavía no escribió en la bitácora. Lo que practiquen entre sesiones aparece acá.',
  },
  // S63-B (Bloque 3 experiencia): la atención de adiestramiento.
  citaAdiestramiento: {
    titulo: 'Sesión de adiestramiento',
    tituloDe: 'Sesión con {{nombre}}',
    enCursoTitulo: 'Sesión en curso',
    cierreTitulo: 'El parte de la sesión',
    sesionKN: 'Sesión {{k}} de {{n}}',
    empezar: 'Empezar la sesión',
    empiezaElDia: 'La sesión se empieza el día de la cita.',
    verFicha: 'Ficha de {{nombre}}',
    verFichaDetalle: 'Señales, condiciones y programas',
    noDisponible: 'Esta sesión no está disponible.',
    noDisponibleDetalle: 'Puede haberse movido o cancelado. Revisa tu jornada.',
    volverHoy: 'Volver a Hoy',
    objetivosTitulo: 'Objetivos de la sesión',
    objetivosSugeridos: 'Sugeridos del nivel',
    objetivosTodos: 'Todo el vocabulario',
    trabajado: 'Trabajado',
    alcanzado: 'Alcanzado',
    registroTitulo: 'Nota y clips',
    notasN: '{{n}} notas',
    unaNota: '1 nota',
    clipsN: '{{n}} clips',
    unClip: '1 clip',
    agregarNota: 'Agregar nota conductual',
    notaTitulo: 'Nota conductual',
    notaPlaceholder: '¿Cómo respondió? ¿Qué le cuesta todavía?',
    guardarNota: 'Guardar nota',
    notaGuardada: 'Nota guardada',
    clipsCelda: 'Clips de la sesión',
    clipsDetalle: 'El progreso se ve mejor en movimiento',
    clipsDetalleN: '{{n}} de 3',
    terminar: 'Terminar sesión',
    terminarTitulo: '¿Terminar la sesión?',
    terminarExplicacion: 'Después de terminar armas el parte para la familia.',
    seguir: 'Seguir en la sesión',
    seguirRegistrando: 'Seguir registrando',
    pisoTitulo: 'Antes de terminar, al parte le falta:',
    pisoFaltaObjetivo: 'Al menos un objetivo trabajado.',
    pisoFaltaNotaClip: 'Al menos una nota conductual o un clip.',
    pisoClipsLocales: 'Hay clips sin enviar — un clip enviado o una nota conductual completan el parte.',
    resumenTitulo: 'Lo que registraste',
    yaCerrada: 'Esta sesión ya está cerrada. El parte quedó con la familia.',
    mensajeFamilia: 'Mensaje a la familia',
    mensajePlaceholder: 'Cómo estuvo hoy, qué te sorprendió…',
    instrucciones: 'Instrucciones para la familia',
    instruccionesPlaceholder: 'Qué practicar entre sesiones, cómo y cuánto.',
    instruccionesExplica: 'Toca un objetivo para sumar una práctica sugerida — el texto queda tuyo, edítalo libre.',
    plantillaPractica: 'Practiquen "{{objetivo}}" en sesiones cortas de 5 minutos, dos veces al día.',
    cerrarCta: 'Enviar parte y cerrar',
    cerrado: 'Sesión cerrada. El parte quedó con la familia.',
  },
  // S63-B: el taller del adiestrador (especies bloqueante + programas).
  // LA PORTADA DEL MUNDO ADIESTRAMIENTO — /adiestramiento (S65-B2 P1,
  // hallazgo founder: el oficio entraba directo al taller). Espejo del
  // patrón paseo/grooming; reusos declarados (Ley 17.3):
  // ofertaPaseo.error/errorDetalle/reintentar/vacacionesCon/vacacionesSin
  // + negocio.vacaciones · LOTE S65, GATE PENDIENTE
  ofertaAdiestramiento: {
    titulo: 'Tu oferta de adiestramiento',
    // peldaño 0 — la invitación que educa: qué se vende (§1 del modelo)
    vacioTitulo: 'Tu servicio de adiestramiento',
    vacioCuerpo:
      'Vendes dos cosas: la sesión suelta y tus programas de varias sesiones con precio propio. Tus clientes solo ven lo que tú actives.',
    vacioCta: 'Configurar tu oficio',
    visibleTitulo: 'Visible para las familias',
    visibleVoz: 'Las familias te encuentran y pueden reservar.',
    noVisibleTitulo: 'Todavía no visible',
    noVisibleCuenta: 'Falta que el equipo active tu cuenta comercial.',
    noVisibleOferta: 'Activa tu sesión suelta en el taller.',
    noVisibleEspecies: 'Declara con quién trabajas en el taller.',
    noVisibleHorarios: 'Aún no tienes días y horarios de atención declarados.',
    editarOferta: 'Editar tu oferta',
    sesionFila: 'La sesión suelta',
    sesionPausada: 'Pausada',
    programasFila: 'Tus programas',
    programasUno: '1 programa activo',
    programasN: '{{n}} programas activos',
    programasSin: 'Todavía sin programas',
  },
  tallerAdiestramiento: {
    titulo: 'Adiestramiento',
    especiesTitulo: 'Con quién trabajas',
    especiesExplica:
      'Declara las especies con las que trabajas. Sin esta declaración, tu oferta no aparece en las búsquedas de las familias.',
    especiesTecho: 'Hoy la plataforma abre el adiestramiento solo para perros.',
    especiePerro: 'Perros',
    especiesFalta: 'Falta declarar con quién trabajas — la oferta no se publica sin esto.',
    ofertaTitulo: 'La sesión suelta',
    ofrecer: 'Ofrecer adiestramiento',
    precioSesion: 'Precio de la sesión',
    duracionSesion: 'Duración de la sesión',
    guardar: 'Guardar oferta',
    guardado: 'Oferta guardada',
    programasTitulo: 'Tus programas',
    programasExplica: 'Un programa es una serie de sesiones con contenido progresivo y precio propio.',
    programasEsperanOferta: 'Guarda tu oferta para poder agregar programas.',
    // S65-B2 P2: las tarjetas fijas de la escalera troncal (§1/§4/§12.4)
    // + Personalizado = la puerta a las especialidades (supuesto
    // declarado al founder) · LOTE S65, GATE PENDIENTE. Murieron
    // agregarPrograma/programaTituloNuevo/nivel (regla 37).
    programaTituloEditar: 'Editar programa',
    nivelBasico: 'Básico',
    nivelMedio: 'Medio',
    nivelExperto: 'Experto',
    nivelEspecialidad: 'Especialidad',
    rangoSugerido: 'Sugerido para este nivel: {{min}} a {{max}} sesiones.',
    nombrePrograma: 'Nombre del programa',
    nombrePlaceholder: 'Obediencia desde cero',
    sesiones: 'Sesiones',
    sesionesN: '{{n}} sesiones',
    precioPrograma: 'Precio del programa',
    vigencia: 'Vigencia',
    vigenciaSemanas: '{{n}} semanas',
    vigenciaExplica: 'La familia tiene este plazo desde la compra para completar las sesiones.',
    programaActivo: 'Programa visible',
    programaOculto: 'Oculto',
    guardarPrograma: 'Guardar programa',
    programaGuardado: 'Programa guardado',
    // los nombres con que nacen los programas de las tarjetas fijas
    // (lo que ve la familia en el QUIÉN)
    nombreBasico: 'Programa básico',
    nombreMedio: 'Programa medio',
    nombreExperto: 'Programa experto',
    descripcionPrograma: 'Qué incluye',
    descripcionPlaceholder: 'Sentado, quieto, venir al llamado…',
    condiciones: 'Vigencia de {{semanas}} semanas · sesiones de {{min}} min',
    personalizadoTitulo: 'Personalizado',
    personalizadoExplica:
      'Un programa a tu medida — una especialidad: ansiedad, correa, trucos. Tú pones el nombre y el contenido.',
    personalizadoCrear: 'Crear programa personalizado',
    personalizadoNuevo: 'Programa personalizado',
    // S68-B (D-426): la sección de horarios entra al taller · LOTE S68 · APROBADO founder 18-jul
    horariosOferta: 'Sesión de adiestramiento',
    guardarHorarios: 'Guardar horarios',
  },
  // ══ S68-B: EL MUNDO VETERINARIA · LOTE S68 · APROBADO founder 18-jul ══
  tallerVeterinaria: {
    titulo: 'Tu consultorio',
    paso: 'Paso {{n}} de 2',
    serviciosTitulo: 'Servicios y precios',
    serviciosIntro: 'Prende lo que ofreces. Cada servicio queda con su duración, su precio y su horario.',
    ofrecerServicio: 'Ofrecer',
    // el menú del oficio (orden firmado S68)
    itemCitaRegular: 'Cita regular',
    itemVacunacion: 'Vacunación',
    itemEspecializada: 'Cita especializada',
    itemUrgenciaLocal: 'Urgencia en local',
    itemUrgenciaDomicilio: 'Urgencia a domicilio',
    itemTelemedicina: 'Telemedicina',
    // la voz honesta OBLIGATORIA de la telemedicina (letra del pedido
    // S68, VERBATIM)
    telemedicinaHonesta: 'Configúrala ahora — las familias la verán cuando la videollamada esté lista.',
    duracion: 'Duración',
    duracionAyuda: 'Cuánto ocupa en tu agenda.',
    minutos: '{{n}} min',
    horario: 'Horario',
    horarioGeneral: 'Usa tu horario general',
    horarioPropiaUna: '1 franja propia',
    horarioPropio: '{{n}} franjas propias',
    especialidades: 'Especialidades',
    especialidadOtra: 'Otra',
    otraTitulo: 'Otra especialidad',
    otraPlaceholder: 'Etología clínica',
    otraAgregar: 'Agregar',
    pendienteCatalogo: 'Deja lista tu configuración — se activa cuando el catálogo del oficio quede listo.',
    // S68-B7: con ?item= las demás tarjetas nacen plegadas — este es su
    // camino de un toque
    desplegar: 'Ajustar',
    // S68-B9 (firma founder del choque 2): menú curado + Otra duración
    otraDuracion: 'Otra duración',
    otraDuracionAyuda: 'En pasos de 5 minutos — de 10 a 240.',
    otraDuracionUsar: 'Usar esta duración',
  },
  veterinaria: {
    titulo: 'Veterinaria',
    vacioTitulo: 'Abre tu consultorio',
    vacioCuerpo: 'Prende tus servicios, ponles precio y horario. Las familias reservan cuando el oficio abra.',
    vacioCta: 'Configurar tu consultorio',
    editarOferta: 'Editar tu consultorio',
    serviciosTitulo: 'Tus servicios',
    sinServicios: 'Todavía no prendes ningún servicio. Entra al taller para armar tu oferta.',
    resumenServicio: '{{precio}} · {{min}} min',
    procedimientosAdministrar: 'Administrar procedimientos',
    procedimientosVacio: 'Suma lo que cotizas por presupuesto.',
    horariosDetalle: 'Franjas y organización de tu agenda.',
    verificadoTitulo: 'Perfil verificado',
    verificadoVoz: 'Tu título y tu registro están aprobados.',
    verificacionInvita: 'Sube tu título y tu registro para abrir el consultorio.',
    verificacionCta: 'Ir a verificación',
  },
  procedimientosVet: {
    titulo: 'Tus procedimientos',
    intro: 'Se cotizan por presupuesto — no se reservan.',
    agregar: 'Agregar procedimiento',
    nuevoTitulo: 'Nuevo procedimiento',
    editarTitulo: 'Editar procedimiento',
    nombre: 'Nombre',
    nombrePlaceholder: 'Limpieza dental',
    precioReferencia: 'Precio de referencia',
    precioAyuda: 'Orientativo para la familia — el presupuesto real lo das tú.',
    visible: 'Visible',
    oculto: 'Oculto',
    guardar: 'Guardar',
    quitar: 'Quitar procedimiento',
    quitarConfirma: 'Quitar definitivamente',
    guardado: 'Procedimiento guardado.',
    quitado: 'Procedimiento quitado.',
    vacioTitulo: 'Aún no tienes procedimientos',
    vacioCuerpo: 'Cirugías menores, limpiezas, tratamientos: lo que cotizas caso a caso.',
  },
  verificacionVet: {
    titulo: 'Verificación profesional',
    intro:
      'Sube tu título y tu registro. Mientras se revisan puedes seguir configurando todo — la verificación se necesita para abrir, no para construir.',
    tituloProfesional: 'Título profesional',
    registroSenescyt: 'Registro SENESCYT',
    sinDocumento: 'Aún no lo subes.',
    enRevision: 'En revisión',
    aprobado: 'Aprobado',
    rechazado: 'Necesitamos otra foto de este documento.',
    vencido: 'Venció — súbelo de nuevo.',
    revisar: 'Revisar',
    subir: 'Subir foto',
    subirDeNuevo: 'Subir de nuevo',
    tomarFoto: 'Tomar foto',
    elegirGaleria: 'Elegir de la galería',
    subido: 'Documento enviado. Queda en revisión.',
    permisoCamara: 'Necesitamos la cámara para la foto del documento. Puedes habilitarla desde los ajustes del teléfono, o elegirla de la galería.',
    errorRed: 'No se pudo subir — revisa tu conexión.',
    errorSubida: 'No se pudo subir el documento. Prueba de nuevo.',
  },
  // El detalle de UNA cita de veterinaria — destino del tap de la jornada
  // (S69-B, M0). Read-only: el Durante clínico llega con V4 · LOTE S69,
  // GATE PENDIENTE.
  citaVet: {
    titulo: 'Atención veterinaria',
    noExiste: 'Esta cita ya no está disponible.',
    cuando: 'Cuándo',
    // S74-B recepción v1: el contacto es de la VISITA (decisión de mesa)
    visitaTitulo: 'La visita',
    visitaReservo: 'Reservó',
    visitaTelefono: 'Teléfono',
    visitaSinContacto: 'Se registró en el mostrador — sin contacto de reserva.',
    visitaSinTelefono: 'No dejó un teléfono al reservar.',
    visitaError: 'No pudimos cargar el contacto de la visita.',
    servicio: 'Servicio',
  },
  // El MOSTRADOR — walk-in del vet (S69-B, M1/M2/M3) · LOTE S69, GATE PENDIENTE
  mostrador: {
    registrarAtencion: 'Registrar atención',
    buscarTitulo: 'Registrar atención',
    buscarLabel: 'Buscar',
    buscarPlaceholder: 'Nombre de la mascota o email del cliente',
    origenClinica: 'Cliente de la clínica',
    origenPendiente: 'Registro pendiente',
    origenRegistrado: 'Ya en e-PetPlace',
    // S70-B2-v2: la cuenta registrada entra al handshake al tocar · LOTE S70
    // S73-B: voseo→tuteo al tocarse (clase D-481).
    registradoTocar: 'Ya en e-PetPlace — toca para elegir la mascota',
    pendienteTitulo: 'Ya tiene un registro pendiente',
    clienteSinNombre: 'Cliente',
    sinResultadosTitulo: 'Nadie con ese dato todavía',
    sinResultadosDetalle: 'Registra la mascota nueva para empezar su expediente.',
    registrarNueva: 'Registrar mascota nueva',
    nuevaTitulo: 'Registrar mascota nueva',
    mascotaLabel: 'Nombre de la mascota',
    mascotaPlaceholder: 'ej: Firulais',
    especieLabel: '¿Qué especie es?',
    cargandoEspecies: 'Cargando especies',
    clienteLabel: 'Nombre del cliente',
    clientePlaceholder: 'ej: María Pérez',
    emailLabel: 'Email del cliente',
    emailPlaceholder: 'ej: maria@correo.com',
    telefonoLabel: 'Teléfono',
    telefonoPlaceholder: 'ej: 0999123456',
    contactoEtiqueta: 'Contacto del cliente',
    contactoEmail: 'Email',
    contactoTelefono: 'Teléfono',
    contactoAyuda: 'Con esto la familia reclama el expediente cuando se registre.',
    registrar: 'Registrar',
    exitoEmail: 'Cuando {{contacto}} se registre en e-PetPlace, el expediente de {{mascota}} lo va a estar esperando.',
    exitoTelefono: 'Cuando alguien se registre con el {{contacto}}, el expediente de {{mascota}} lo va a estar esperando.',
  },
  // M4/M5 — la atención del mostrador + cobro-dato (S69-B, A1bis) · LOTE S69, GATE PENDIENTE
  // D-472 (S73-B, tajada 1): la voz del camino triste del path vet sale
  // del riel (tuteo L-148 + en). El mapa código→key vive en
  // lib/voz-error-vet.ts; el mensaje del wrapper queda de fallback.
  // "datos_inconsistentes" gana voz humana por acción (la del wrapper
  // era system-speak — Ley 17.2). PENDIENTE DE GATE founder (lote S73).
  erroresVet: {
    busqueda: {
      emailInvalido: 'Escribe un email válido para buscar.',
      telefonoInvalido: 'Escribe un teléfono válido para buscar.',
      accesoDenegado: 'No tienes permiso para buscar clientes.',
      datosInconsistentes: 'No pudimos completar la búsqueda. Intenta de nuevo.',
      errorBusqueda: 'No pudimos buscar. Intenta de nuevo.',
    },
    alta: {
      accesoDenegado: 'No tienes permiso para registrar en este negocio.',
      contactoRequerido: 'Pon un email o un teléfono del cliente.',
      nombreClienteRequerido: 'Pon el nombre del cliente.',
      nombreMascotaRequerido: 'Pon el nombre de la mascota.',
      especieInvalida: 'Elige una especie válida.',
      countryInvalido: 'El país no es válido.',
      clienteYaRegistrado: 'Ese cliente ya está en e-PetPlace — búscalo por su contacto para sumarle la mascota.',
      pendienteYaExiste: 'Ya hay un registro pendiente con ese contacto.',
      datosInconsistentes: 'No pudimos registrar. Intenta de nuevo.',
    },
    atencion: {
      accesoDenegado: 'No tienes acceso a este negocio o esta mascota.',
      prestadorSinCuenta: 'Tu negocio todavía no está habilitado para registrar atenciones.',
      sinAccesoMascota: 'No tienes acceso a esta mascota.',
      tipoNoMedico: 'Ese servicio no es de veterinaria.',
      servicioNoActivo: 'Ese servicio no está activo en tu consultorio.',
      precioInvalido: 'El precio no es válido.',
      countryInvalido: 'El país no es válido.',
      datosInconsistentes: 'No pudimos registrar la atención. Intenta de nuevo.',
    },
    cobro: {
      accesoDenegado: 'No tienes permiso para registrar el cobro.',
      citaNoExiste: 'Esa atención ya no existe.',
      noOperaCuenta: 'No operas este negocio.',
      montoInvalido: 'El monto no es válido.',
      medioInvalido: 'Elige un medio de cobro válido.',
      cobroYaRegistrado: 'Esta atención ya tiene un cobro registrado.',
      datosInconsistentes: 'No pudimos registrar el cobro. Intenta de nuevo.',
    },
    vacuna: {
      accesoDenegado: 'No tienes permiso para registrar en este negocio.',
      citaNoExiste: 'Esa atención ya no existe.',
      sinAccesoMascota: 'No tienes acceso a esta mascota.',
      vacunaXor: 'Elige una vacuna del catálogo o escribe una — no ambas.',
      vacunaCodigoInvalido: 'Esa vacuna no está en el catálogo.',
      datosInconsistentes: 'No pudimos registrar la vacuna. Intenta de nuevo.',
    },
    solicitud: {
      accesoDenegado: 'Tu sesión no está activa. Inicia sesión de nuevo.',
      noOperaCuenta: 'No operas este negocio.',
      cuentaNoActiva: 'El negocio todavía no está activo.',
      mascotaRequerida: 'Elige una mascota.',
      mascotaNoExiste: 'Esa mascota ya no existe.',
      destinoRequerido: 'Falta el cliente destinatario.',
      payloadAltaInvalido: 'Faltan datos de la mascota (nombre y especie).',
      solicitudDuplicada: 'Ya hay una solicitud pendiente para esta mascota.',
      datosInvalidos: 'Revisa los datos e intenta de nuevo.',
    },
    // Tajada 2: el Durante clínico, el presupuesto y el taller.
    estructurar: {
      entradaInvalida: 'No pudimos leer el dictado. Revisa el texto e intenta de nuevo.',
      configuracionFaltante: 'El asistente de notas no está disponible en este momento.',
      errorModelo: 'No pudimos estructurar la nota ahora. Intenta de nuevo en un rato.',
      estructuracionFallida: 'No pudimos estructurar el dictado. Revísalo e intenta de nuevo.',
      datosInconsistentes: 'No pudimos estructurar la nota. Intenta de nuevo.',
    },
    sedimento: {
      accesoDenegado: 'Tu sesión no está activa. Inicia sesión de nuevo.',
      noOperaCuenta: 'No operas este negocio.',
      sinAccesoMascota: 'No tienes acceso a esta mascota.',
      citaRequerida: 'Falta la cita de la consulta.',
      hcYaExiste: 'Esta consulta ya tiene una historia clínica registrada.',
      notaSinMotivo: 'La nota necesita un motivo de consulta.',
      notaSinDiagnostico: 'La nota necesita un diagnóstico.',
      cuentaSinPrestador: 'El negocio no tiene un profesional configurado.',
      posologiaIncompleta: 'Una medicación no tiene dosis o frecuencia. Complétala antes de guardar.',
      // (la voz de PANTALLA del mismo muro vive en consulta.medIncompletaAviso)
      medicamentoSinNombre: 'Una medicación no tiene nombre.',
      condicionSinNombre: 'Una condición crónica no tiene nombre.',
      alergiaSinAlergeno: 'Una alergia no tiene alérgeno.',
      alergiaSinSeveridad: 'Una alergia no tiene severidad.',
      condicionRequerida: 'El caso necesita una condición.',
      noEsTratante: 'No eres la clínica tratante de este caso.',
      datosInvalidos: 'Revisa los datos de la nota.',
    },
    presupuesto: {
      accesoDenegado: 'No tienes permiso para esta acción.',
      noOperaCuenta: 'No operas este negocio.',
      sinAccesoMascota: 'No tienes acceso a esta mascota.',
      countryInvalido: 'El país no es válido.',
      presupuestoNoExiste: 'Ese presupuesto ya no existe.',
      presupuestoNoEsBorrador: 'El presupuesto ya no es un borrador — no se puede editar.',
      venceEnRequerido: 'Pon hasta cuándo vale el presupuesto.',
      venceEnPasada: 'La fecha de vencimiento tiene que ser futura.',
      presupuestoSinItems: 'Agrega al menos un ítem antes de enviar.',
      noEsFamilia: 'Solo la familia puede aprobar desde la app.',
      presupuestoNoEnviado: 'El presupuesto todavía no fue enviado.',
      presupuestoVencido: 'El presupuesto venció.',
      presupuestoNoEditable: 'El presupuesto ya no se puede modificar.',
      citaNoEncontrada: 'Esa cita ya no existe.',
      citaNoEsDePresupuesto: 'Esta cita no salió de un presupuesto.',
      citaYaFijada: 'Esta cita ya tiene fecha coordinada.',
      presupuestoNoAprobado: 'El presupuesto de esta cita todavía no está aprobado.',
      empleadoNoEsDeCuenta: 'Esa persona no pertenece a este negocio.',
      slotInvalido: 'Elige fecha, hora y profesional.',
      slotEnPasado: 'La fecha coordinada tiene que ser futura.',
      slotOcupado: 'Ese horario ya está ocupado para esa persona.',
      datosInvalidos: 'Revisa los datos del presupuesto.',
    },
    citaVet: {
      citaNoEncontrada: 'La cita no existe o ya no es accesible.',
      datosInconsistentes: 'No pudimos cargar la cita. Intenta de nuevo.',
    },
    oferta: {
      sinDatos: 'No pudimos leer tu oferta de veterinaria.',
      noEncontrada: 'Ese servicio ya no existe.',
      verificacionProfesionalPendiente:
        'Tu verificación profesional todavía no está aprobada — el servicio queda guardado y podrás publicarlo al aprobarse.',
      especialidadInvalida: 'Una especialidad lleva su fila del catálogo o un nombre propio — nunca ambos ni ninguno.',
      duracionInvalida: 'La duración tiene que ir de 10 a 240 minutos, en pasos de 5.',
      datosInconsistentes: 'No pudimos guardar tu oferta. Intenta de nuevo.',
    },
  },
  atencionMostrador: {
    titulo: 'Registrar atención',
    servicioLabel: '¿Qué servicio?',
    // S73-B (M2 de A, boceto atencion): voseo→tuteo al tocarse + los
    // estados que faltaban (error con reintento, CTA al taller — 17.5).
    sinServicios: 'Prende un servicio en tu consultorio para registrar atenciones.',
    sinServiciosCta: 'Activar servicios',
    errorCarga: 'No pudimos cargar tu consultorio.',
    // «revisá tu conexión» queda RESERVADO a errores de red (S47) — acá
    // la causa puede ser otra; la voz dirige sin diagnosticar de más.
    errorCargaDetalle: 'Vuelve a intentarlo en un momento.',
    /* ⭐ S86-C ② · el tratante en el mostrador. «A la pizarra» tiene el
       MISMO peso que una persona: no es un «ninguno» ni un escape —
       dejar la cita sin tratante es una elección de quien recibe. */
    tratanteLabel: '¿Quién la atiende?',
    aLaPizarra: 'A la pizarra',
    sinPersonas: 'No pudimos cargar a tu equipo. La atención va a quedar sin tratante, en la pizarra.',
    /* ⭐ S86-C ① · LOS DOS VERBOS. Honestos al motor: uno REGISTRA un
       hecho, el otro RESERVA capacidad. La RPC se elige por el verbo, así
       que la cita futura no tiene por dónde viajar por el registro. */
    /* ⭐ S86-C · el oficio activo que TODAVÍA no se puede registrar acá.
       Se dice como limitación nuestra, no como «no tenés servicios». */
    oficioSinMenu: 'Por ahora el mostrador solo registra atenciones de veterinaria. Tus otros servicios llegan pronto.',
    oficioSinMenuDetalle: 'Podés dar de alta la mascota igual: queda asociada al correo de la familia y su atención se registra en cuanto abramos este oficio.',
    verboLabel: '¿Qué vas a hacer?',
    verboAhora: 'Atender ahora',
    verboAgendar: 'Agendar',
    verboAhoraDetalle: 'Registra la atención de quien está acá.',
    verboAgendarDetalle: 'Reserva un turno futuro, con cupo y grilla.',
    diaLabel: '¿Qué día?',
    horaLabel: '¿A qué hora?',
    buscandoHoras: 'Buscando horas libres…',
    sinHoras: 'Ese día no tiene horas libres para este servicio.',
    /* ⚠️ D-653 — NO es «no hay horarios»: es que no se pudo mirar. El
       acceso a la mascota puede caducar entre encontrarla y agendarla, y
       una grilla vacía mandaría a probar otro día para siempre. */
    horasNoSePudo: 'No pudimos ver las horas libres. Volvé a buscar a la mascota y probá de nuevo.',
    agendada: 'Cita agendada.',
    agendadaPizarra: 'Cita agendada, en la pizarra hasta que alguien la tome.',
    /* ⚠️ Las DOS verdades del motor, dichas distinto: mover la hora no
       arregla un problema de gente. */
    slotOcupado: 'Esa hora ya no está disponible. Prueba otra.',
    sinQuienLaTome: 'La hora está libre, pero no queda nadie que pueda tomarla. Asigna a alguien o prueba otra hora.',
    noSePudoAgendar: 'No pudimos agendar la cita. Prueba de nuevo.',
    precioLabel: 'Precio',
    registrarAtencion: 'Registrar atención',
    cobroTitulo: 'Cobro',
    montoLabel: 'Monto cobrado',
    medioLabel: 'Medio',
    medioEfectivo: 'Efectivo',
    medioTarjeta: 'Tarjeta',
    medioTransferencia: 'Transferencia',
    registrarCobro: 'Registrar cobro',
    sinCobro: 'Listo, sin cobro ahora',
    exito: 'Atención registrada — quedó en la agenda de hoy y en el expediente de {{mascota}}.',
    // D-434: el registrable de vacuna
    vacunaLabel: '¿Qué vacuna?',
    // S76-B3 — D-524: el flujo de dos personas, dicho en una frase ·
    // LOTE S76, GATE PENDIENTE
    vacunaPendienteFirma: 'Registras la visita y el cobro. La vacuna la firma quien atiende.',
    vacunaOtra: 'Otra',
    vacunaLibreLabel: 'Nombre de la vacuna',
    vacunaLibrePlaceholder: 'ej: Bordetella',
    vacunaExito: 'Vacuna registrada en el expediente de {{mascota}}.',
  },
  // EL PRESUPUESTO CLÍNICO — armado del vet (S69-B, B3) · LOTE S69, GATE PENDIENTE
  presupuesto: {
    titulo: 'Nuevo presupuesto',
    crear: 'Crear presupuesto',
    // S70-B1: detalle de la celda de primera clase (§15b, Ley 19.1) · LOTE S70, GATE PENDIENTE
    crearDetalle: 'Arma los procedimientos y su precio',
    procedimientosTitulo: 'Procedimientos',
    libreTitulo: 'Otra línea',
    libreNombre: 'Concepto',
    libreNombrePlaceholder: 'ej: Radiografía de tórax',
    librePrecio: 'Precio',
    agregarLinea: 'Agregar al presupuesto',
    quitar: 'Quitar',
    total: 'Total',
    vacioAyuda: 'Suma procedimientos o una línea para armar el presupuesto.',
    enviarFamilia: 'Enviar a la familia',
    aprobarPresencial: 'Registrar aprobación presencial',
    enviadoFamilia: 'Presupuesto enviado a la familia.',
    aprobadoPresencial: 'El procedimiento quedó aprobado con precio congelado — coordina el día con la familia.',
    // Relectura en el detalle de cita (cura de gate)
    listaTitulo: 'Presupuestos de {{nombre}}',
    estadoBorrador: 'Borrador',
    estadoEnviado: 'Enviado',
    estadoAprobado: 'Aprobado',
    estadoRechazado: 'Rechazado',
    estadoVencido: 'Vencido',
  },
  // S70-B2-v2: la pantalla "El movimiento" (listado de presupuestos del negocio)
  movimiento: {
    titulo: 'El movimiento',
    vacio: 'Todavía no armaste presupuestos.',
    vacioDetalle: 'Cuando armes un presupuesto desde una atención, va a aparecer acá.',
    sinItems: 'Presupuesto',
    error: 'No pudimos cargar el movimiento.',
    errorDetalle: 'Prueba de nuevo en un momento.',
  },
  // S70-B2-v2: la pantalla "Fijar fecha" (coordinar el procedimiento, D-439)
  coordinar: {
    titulo: 'Fijar fecha',
    contexto: 'Precio congelado',
    diaLabel: '¿Qué día?',
    horaLabel: '¿A qué hora?',
    // S71 (la puerta no ofrece lo que va a rechazar): hoy sin horas restantes
    hoySinHoras: 'Para hoy ya no quedan horarios — elige otro día.',
    personaLabel: '¿Quién atiende?',
    confirmar: 'Confirmar fecha',
    exito: 'Listo. Coordinaste la cita de {{mascota}}.',
    error: 'No pudimos cargar los datos.',
    errorDetalle: 'Prueba de nuevo en un momento.',
  },
  // S70-B2-v2: el HANDSHAKE — autorización de la familia en el mostrador
  autorizar: {
    titulo: 'Autorización de la familia',
    grillaTitulo: '¿A quién de la familia de {{nombre}} vas a atender?',
    mascotaNueva: 'Mascota nueva',
    pedir: 'Pedir autorización',
    volver: 'Volver',
    altaTitulo: 'Suma una mascota nueva a esta familia',
    nombreLabel: 'Nombre de la mascota',
    nombrePlaceholder: 'Ej: Luna',
    especieLabel: '¿Qué mascota es?',
    esperando: 'Esperando a la familia de {{nombre}}',
    esperandoDetalle: 'Le llegó el pedido a su teléfono. En cuanto autorice, seguimos.',
    rechazada: '{{nombre}} no autorizó la atención.',
    expirada: 'El pedido de autorización venció. Pídelo de nuevo.',
    error: 'No pudimos abrir la autorización',
    errorDetalle: 'Vuelve al mostrador y busca al cliente de nuevo.',
  },
  // S70-B2-v2: EL DURANTE — la consulta clínica (antes → dictado → confirmación → después)
  consulta: {
    titulo: 'Consulta',
    iniciarCta: 'Iniciar consulta',
    // S75-B16 (censo): voseo → tuteo (L-148), misma pantalla que errorDetalle.
    iniciarDetalle: 'Dicta la nota y guarda la historia clínica',
    mascotaFallback: 'la mascota',
    // S76-B2 — D-525: la red del gate de ausencia (deep-link/pila vieja).
    // La voz dice PERMISO, jamás "revisá los datos" · LOTE S76, GATE PENDIENTE
    soloClinicoTitulo: 'La consulta es de quien atiende',
    soloClinicoDetalle: 'Solo un profesional del negocio puede abrir y firmar la consulta clínica.',
    errorTitulo: 'No pudimos abrir la consulta',
    // S75-B16 (L-148 tuteo + sin promesa falsa de reintento: si no hay
    // acceso, reintentar no lo arregla — Ley 17.4).
    errorDetalle: 'Puede que no tengas acceso a esta mascota.',
    sinRegistros: 'sin registros',
    requerido: 'Obligatorio',
    perfilTitulo: 'Perfil de {{mascota}}',
    perfilEspecie: 'Especie',
    perfilPeso: 'Peso clínico',
    perfilCronica: 'Condición crónica',
    cronicaSi: 'Tiene registro',
    cronicaNo: 'Sin registros',
    perfilEmergencia: 'Emergencia',
    emergenciaActiva: 'Activa',
    casosTitulo: 'Casos activos',
    casosVacio: 'No hay casos abiertos para esta mascota.',
    casoTratante: 'Eres la clínica tratante',
    casoOtra: 'Otra clínica',
    presupuestosTitulo: 'Presupuestos',
    presupuestosVacio: 'Todavía no armaste presupuestos para esta mascota.',
    estadoPresupuesto: {
      borrador: 'Borrador',
      enviado: 'Enviado',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
      vencido: 'Vencido',
    },
    // D-545 (S78-B): el botón NOMBRA lo que abre — el founder atendió
    // una cita entera ESCRIBIENDO porque 'Empezar la consulta' no le
    // dijo que podía hablar.
    iniciar: 'Dictar la consulta',
    dictadoTitulo: 'Dicta la consulta de {{mascota}}',
    // D-456 (S72-B): la decisión founder — "el mic es el del teclado del SO" —
    // vivía SOLO en un comentario de código. La ayuda prometía hablar y nunca
    // decía cómo. Ahora lo dice. Tuteo por L-148 + censo del diccionario.
    // S78-B (D-456): el mic PROPIO vive — el hint del teclado del SO
    // murió con él (una puerta, no dos voces; Ley 37).
    dictadoAyuda: 'Habla o escribe libremente. Después revisas todo campo por campo antes de guardar.',
    micHint: 'Toca el micrófono para dictar.',
    micCta: 'Dictar con el micrófono',
    micParar: 'Parar el dictado',
    micEscuchando: '● Escuchando — toca de nuevo para parar',
    micPermisoDenegado: 'Sin permiso de micrófono. Actívalo en los ajustes del teléfono; escribir sigue funcionando.',
    micCorte: 'La escucha se cortó. Lo dictado quedó en la nota.',
    dictadoLabel: 'Nota de la consulta',
    dictadoPlaceholder: 'Motivo, hallazgos, diagnóstico, plan, medicación…',
    estructurar: 'Estructurar la nota',
    estructurando: 'Estamos ordenando tu dictado. Puede tardar un momento.',
    confirmacionAyuda: 'Revisa y corrige antes de guardar. Lo que la IA no leyó queda vacío — complétalo tú.',
    motivoLabel: 'Motivo de consulta',
    motivoPlaceholder: '¿Por qué vino?',
    diagnosticoLabel: 'Diagnóstico',
    diagnosticoPlaceholder: 'Diagnóstico principal',
    anamnesisLabel: 'Anamnesis',
    anamnesisPlaceholder: 'Antecedentes y evolución',
    examenLabel: 'Examen físico',
    examenPlaceholder: 'Hallazgos del examen',
    planLabel: 'Plan terapéutico',
    planPlaceholder: 'Indicaciones y tratamiento',
    vitalesTitulo: 'Signos vitales',
    vitalPeso: 'Peso (kg)',
    vitalTemp: 'Temperatura (°C)',
    vitalFc: 'Frecuencia cardíaca',
    vitalFr: 'Frecuencia respiratoria',
    vitalCc: 'Condición corporal',
    formulaTitulo: 'Medicación',
    formulaVacio: 'Sin medicación en esta consulta.',
    medNombre: 'Medicamento',
    medNombrePlaceholder: 'Nombre del medicamento',
    medDosis: 'Dosis',
    medDosisPlaceholder: 'Ej. 1 comprimido',
    medFrecuencia: 'Frecuencia',
    medFrecuenciaPlaceholder: 'Ej. cada 12 h',
    medDuracion: 'Duración (días)',
    medDuracionPlaceholder: 'Ej. 7',
    medVia: 'Vía',
    medViaPlaceholder: 'Ej. oral',
    medIndicaciones: 'Indicaciones',
    medIndicacionesPlaceholder: 'Cómo darlo',
    medQuitar: 'Quitar medicación',
    medAgregar: 'Agregar medicación',
    examenesTitulo: 'Exámenes pedidos',
    examenesVacio: 'Sin exámenes pedidos.',
    examenItemLabel: 'Examen {{n}}',
    examenItemPlaceholder: 'Ej. hemograma',
    examenQuitar: 'Quitar',
    examenAgregar: 'Agregar examen',
    casoTitulo: 'Caso clínico',
    casoModoLabel: '¿Esta consulta pertenece a un caso?',
    casoNinguno: 'Ninguno',
    casoActivo: 'Existente',
    casoNuevo: 'Nuevo',
    casoCondicionLabel: 'Condición del caso',
    casoCondicionPlaceholder: 'Ej. enfermedad renal',
    casoElegirLabel: 'Elige el caso',
    confirmar: 'Guardar la consulta',
    // S73-B cura de mesa (hallazgo T-B trampa L-139): el botón apagado dice su porqué.
    medIncompletaAviso: 'Completa la dosis y la frecuencia para confirmar.',
    // S73-B 🔴 cura de gate: cada guard del Confirmar con su campo NOMBRADO.
    faltaMotivo: 'Falta el motivo de consulta.',
    faltaDiagnostico: 'Falta el diagnóstico.',
    faltaCasoCondicion: 'Falta la condición del caso.',
    faltaCasoEleccion: 'Elige el caso activo.',
    listo: 'Guardamos la consulta de {{mascota}}.',
    proximoTitulo: 'Próxima consulta sugerida',
    proximoDetalle: '{{control}}',
    cerrar: 'Listo',
  },
  equipo: {
    titulo: 'Tu negocio',
    seccion: 'Tu equipo',
    errorCarga: 'No pudimos cargar tu equipo. Prueba de nuevo.',
    errorEscritura: 'No se guardó el cambio. Prueba de nuevo.',
    errorInvitar: 'No pudimos crear la invitación. Prueba de nuevo.',
    rolDueno: 'Dueño',
    // ── S78-B · LA HOJA DEL MIEMBRO RECOMPUESTA + EL ARRASTRE ──
    // MUEREN (Ley 37) `rolProfesional` · `rolRecepcion` · `sinRolAccion` ·
    // `rolesAyuda`: los dos Interruptor de rol salieron de la Hoja
    // (`profesional` es DERIVADO de ≥1 chip; `recepcion` es MEMBRESÍA, no
    // identidad) y el subtítulo de la lista dejó de ser role-driven.
    // VOCABULARIO CERRADO (S78): cita (familia) · turno (plantilla del
    // negocio) · jornada (persona). De cara a la familia se dice CITA.
    invitacionPendiente: 'Invitación pendiente',
    subtituloRecepcion: 'Recibe y cobra, sin acceso clínico',
    jornadaSinTitulo: 'Todavía no tiene jornada',
    jornadaSinCuerpo: 'Sin horarios cargados no aparece cuando una familia busca una cita.',
    jornadaPausadaTitulo: 'Su jornada está pausada',
    jornadaCargarCta: 'Cargar su jornada',
    jornadaVerCta: 'Ver su jornada',
    /* ⭐ S90-B · D-676 — LA MATRÍCULA DE LA PERSONA.
       La voz dice el HECHO y la FECHA, sin regaño y sin urgencia
       artificial: el que ya existía tiene gracia hasta el corte.
       ⚠️ NO se nombra ningún contador de días — el lector del motor
       (`vets_sin_matricula`) cuenta contra el 1-sep y el gate corta el
       15-ago; la fecha es lo único que las dos mitades comparten. */
    matriculaTitulo: 'Falta su matrícula',
    matriculaCuerpo:
      'Para que {{nombre}} pueda recibir citas necesitamos su matrícula profesional. Desde el 15 de agosto, quien atiende sin matrícula cargada no se ofrece a las familias.',
    matriculaEtiqueta: 'Matrícula profesional',
    matriculaPaisEtiqueta: 'País que la emitió',
    matriculaPaisAyuda: 'Dos letras — EC, CO, PE.',
    matriculaGuardar: 'Guardar matrícula',
    matriculaEditar: 'Editar',
    matriculaCancelar: 'Cancelar',
    matriculaGuardada: 'Matrícula guardada.',
    jornadaPausadaCuerpo:
      'Tiene horarios cargados, pero ninguno activo. Mientras estén pausados no aparece cuando una familia busca una cita.',
    atiendeSeccion: 'Qué atiende',
    atiendeHint: 'Los servicios que puede tomar en tu negocio.',
    atiendeSinChips:
      'Todavía no tiene servicios. Puede recibir y cobrar, pero no toma citas ni ve la historia clínica.',
    ofertaApagada: 'Ya no lo ofreces en tu negocio. Puedes quitárselo.',
    clinicoTitulo: 'Deja de ver la historia clínica',
    clinicoCuerpo:
      'Si le quitas {{oficio}}, {{nombre}} deja de ver la historia clínica de las mascotas de tu negocio.',
    clinicoConfirmar: 'Quitar {{oficio}}',
    clinicoPerdida: '{{nombre}} ya no ve la historia clínica.',
    estadoNoConfirmado: 'Se quitó, pero no pudimos confirmar cómo quedó. Vuelve a abrir para verlo.',
    desvincularAviso:
      'Al darla de baja pierde el acceso al negocio. Lo que hizo queda en el expediente. Si tiene citas agendadas pasan a ser citas del negocio, y eso no se deshace.',
    bajaDespegadas: '{{n}} citas futuras pasaron a ser del negocio.',
    /* ⭐ S97-D · EL CUARTO BLOQUE — ADMINISTRADOR · LOTE S97-D, GATE PENDIENTE
       Voz: TUTEO (L-148). El verbo del botón es «dar el rol» y NO
       «hacerla administradora» — nota de oficio FIRMADA en S74: el género
       no se resuelve desde un nombre. */
    adminTitulo: 'Gestión del negocio',
    adminToggle: 'Administrador',
    adminAyuda: 'Puede configurar el negocio igual que tú. Lo único que no puede es nombrar a otros administradores.',
    /* 🔴 PLACEHOLDER DECLARADO — SU LITERAL ESTÁ FIRMADO Y NO VIAJÓ.
       El texto real vive en `LETRA_ROLES_EQUIPO_S74` §6 y esta pista NO lo
       recibió (L-142: lo que no llegó como texto no se reconstruye de
       memoria). Se eligió a propósito un placeholder que SE VE que lo es,
       en vez de uno verosímil: un aviso plausible pero inventado sobre
       entregar el gobierno del negocio no lo caza nadie en un gate (L-139).
       Al reemplazarlo, renombrar la key a `adminAviso` y borrar esta nota. */
    adminAvisoPENDIENTE:
      '[FALTA EL TEXTO FIRMADO — LETRA_ROLES_EQUIPO_S74 §6] Vas a darle a {{nombre}} el control del negocio.',
    adminDarCta: 'Dar el rol',
    adminQuitarAviso: '{{nombre}} deja de poder configurar el negocio. Sigue en tu equipo y conserva sus oficios.',
    adminQuitarCta: 'Quitar el rol',
    adminCancelar: 'Ahora no',
    adminError: 'No pudimos cambiar el rol. Prueba de nuevo.',
    equipoDeUno: 'Tu equipo es tuyo por ahora. Invita cuando lo necesites.',
    invitarCta: 'Invitar a tu equipo',
    invitarTitulo: 'Invitar a tu equipo',
    invitarNombre: 'Nombre',
    invitarEmail: 'Correo',
    // S80-B1 (cura): la voz sub-prometía — la entrada al próximo ingreso
    // SÍ ocurre desde S75 (/invitacion); lo que NO existe es el aviso.
    // LOTE S80, GATE PENDIENTE
    invitarAyuda:
      'La invitación queda registrada a ese correo. No le llega un aviso todavía: cuando esa persona entre a la app con ese correo, la invitación le aparece para aceptarla.',
    // S76-B4 — el selector de dos (LETRA_RECEPCION §1): chips al invitar ·
    // LOTE S76, GATE PENDIENTE
    invitarPrestadorToggle: 'Prestador',
    invitarOficiosLabel: '¿Qué va a atender?',
    invitarPisoAyuda: 'Sin servicios activados, entra como recepción: recibe y cobra, sin acceso clínico.',
    invitarChipsError: 'La persona quedó invitada, pero sus servicios no se pudieron guardar.',
    invitarEnviar: 'Invitar',
    // CURA D-508: los 4 rebotes suaves del motor, en voz humana (Ley 3)
    rebYaEnEquipo: 'Esa persona ya es parte de tu equipo.',
    // S80-B1 (cura): gana el camino — /registro existe; nombra el label
    // verbatim de la entrada (Ley 17.3) · LOTE S80, GATE PENDIENTE
    rebSinCuenta:
      'Ese correo todavía no tiene cuenta en e-PetPlace. Pídele que la cree desde esta app, en "Crear tu cuenta", y vuelve a invitarlo.',
    rebOtroPrestador: 'Ese correo pertenece a otro negocio prestador.',
    rebNoDueno: 'Solo quien es dueño del negocio puede invitar.',
    // S78-B · LA VITRINA (gate mecánico cerrado hoy — la sección no se
    // dibuja hasta el lector de A; las claves nacen con su superficie)
    vitrinaSeccion: 'Tu vitrina',
    // S79-B (T3-B1.2, corrección del gate): "Mostrar a tu equipo" se leía
    // como configuración interna; lo que enciende es que las FAMILIAS
    // elijan persona, con la obligación de aviso adjunta (LETRA_VITRINA
    // §3) · LOTE S79, GATE PENDIENTE
    vitrinaToggle: 'Dejar que las familias elijan con quién',
    vitrinaEncendida: 'Las familias ven a tu equipo y eligen con quién agendar. Si esa persona no puede, se les avisa antes de mover la cita.',
    vitrinaApagada: 'Las familias reservan con tu negocio y tú decides quién atiende. Nada cambia para ellas.',
    vitrinaRebote: 'Todavía no se puede encender: falta el aviso a la familia cuando una cita cambia de persona.',
    desvincularCta: 'Desvincular del negocio',
    desvincularConfirma: '{{nombre}} pierde el acceso al negocio. Lo que hizo queda en el expediente.',
    // ⏪ S88-C: decía «quien es dueño» — caducó con D-660 (el admin
    // también gestiona, gateado 5-ago-2026). «Quien gestiona» cubre a
    // los dos sin re-enumerar roles que el motor decide.
    soloDueno: 'El equipo lo administra quien gestiona el negocio.',
  },
  // S79-B (T2-B1) · "PREPARA TU ESPACIO" — §2.4 tercera presencia: cada
  // tarea con su POR QUÉ en voz humana · LOTE S79, GATE PENDIENTE
  preparaEspacio: {
    titulo: 'Prepara tu espacio',
    subtitulo: 'Cuando esté listo, las familias te encuentran.',
    serviciosTitulo: 'Tus servicios',
    serviciosPorQue: 'Di qué haces y cómo — es lo que tus clientes leen cuando te encuentran.',
    horariosTitulo: 'Tus horarios',
    horariosPorQue: 'Tu agenda solo ofrece las horas que tú digas.',
    preciosTitulo: 'Tus precios',
    preciosPorQue: 'Cada servicio dice cuánto vale antes de reservarse.',
    equipoTitulo: 'Tu equipo',
    equipoPorQue: 'Si trabajas con más gente, acá entran. Si trabajas solo, este paso no es tuyo.',
    // a11y del check sutil (Insignia soloPunto)
    checkHecho: 'Lista',
  },
  // S79-B (T2-B2) · LA BIENVENIDA DIGITAL DEL DÍA 1 (§2.3) — carta, no
  // banner. `firmaNombre`: LITERAL DEL FOUNDER (27-jul-2026): el pie de la
  // carta es "Guillermo Suárez / founder, e-PetPlace" — el pendiente de
  // T2 quedó pagado.
  //
  // ☠️ S85-C35 · «N=15 vive acá · LOTE S79, GATE PENDIENTE» MURIÓ, y las
  // DOS mitades de esa nota se resolvieron el mismo día:
  //   · EL N SALIÓ (firma del founder). La carta decía "uno de los 15
  //     prestadores" y el modal del emblema —misma frase, otra pantalla—
  //     decía "uno de los prestadores": la MISMA promesa con dos verdades,
  //     y la de la carta caducaba en el prestador 16 SIN QUE NADA AVISARA.
  //     El "número chico y conocido" que §2.3 pide para el Momento
  //     Fundacional se conserva, pero EN EL CANAL DONDE ES VERDAD Y TIENE
  //     FECHA: la comunicación personal del founder con los primeros.
  //     *Un string de app no puede sostener una promesa de escasez.*
  //   · EL GATE SE RESOLVIÓ SIN LLEGAR A CORRER, y eso se registra en vez
  //     de borrarse: esperó SEIS sesiones, y esta pantalla es de las más
  //     difíciles de gatear que tiene la app —`registrar_primer_ingreso`
  //     es idempotente y estampa en DB, así que la carta se ve UNA VEZ por
  //     titular y después es inalcanzable, en cualquier dispositivo—.
  //     El founder decidió sobre el LITERAL, sin haberlo visto en pantalla.
  //     *No es un atajo: es que su alcance es de un solo uso POR DISEÑO*
  //     (L-161 en su forma más incómoda), y esperar el gate habría dejado
  //     el N vivo indefinidamente.
  dia1: {
    saludoNombre: 'Hola, {{nombre}}.',
    saludoSinNombre: 'Hola.',
    eleccion: 'Te elegimos para ser uno de los prestadores que dan forma a e-PetPlace en Ecuador.',
    // S81-C: el SEGUNDO nombre de la carta — GATE PENDIENTE lote S81
    casaConNegocio: 'Y {{negocio}} entra contigo: fue tu decisión traer tu casa al ecosistema.',
    casaSinNegocio: 'Y tu casa entra contigo: fue tu decisión traerla al ecosistema.',
    propositoIntro: 'Tú nos dijiste:',
    propositoCierre: 'Acá te ayudamos a vivirlo todos los días.',
    firmaNombre: 'Guillermo Suárez',
    firmaRol: 'founder, e-PetPlace',
    dia90:
      'Los primeros 90 días son tu encuentro con e-PetPlace. Al cumplir el trimestre completamos juntos el momento de graduación.',
    entrar: 'Entrar a mi espacio',
  },
  // S79-B (T3-B2) · LA SEDE — "Dónde atiendes" (perfil + sala de espera).
  // Las dos leyes del contrato lugares.ts §2.2 tienen su voz acá:
  // "Ubicada en el mapa" SOLO cuando es verdad; editada a mano LO DICE.
  // Radio: firma founder T3-B1.1 — arranca sin declarar, 15 es sugerencia
  // en la etiqueta, jamás preselección · LOTE S79, GATE PENDIENTE
  sede: {
    titulo: 'Dónde atiendes',
    direccionLabel: 'Dirección',
    direccionPlaceholder: 'ej: Av. de los Shyris 1234',
    ciudadLabel: 'Ciudad',
    // T4-B4 (D-559): el barrio/zona — cero motor extra (whitelist T4.1)
    sectorLabel: 'Sector',
    sectorAyuda: 'El barrio o la zona — ayuda a las familias a ubicarte.',
    ubicadaEnMapa: 'Ubicada en el mapa.',
    escritaAMano: 'Escrita a mano — sin punto en el mapa.',
    guardarDireccion: 'Guardar dirección',
    guardada: 'Tu dirección quedó guardada.',
    radioTitulo: 'Hasta dónde llegas',
    radioFalta: 'Sin un radio declarado, las familias no saben si les llegas. Buscan por cercanía.',
    radioDeclarado: 'Las familias hasta {{km}} km te encuentran.',
    radioKm: '{{km}} km',
    radioSugerido: '{{km}} km · sugerido',
    radioGuardado: 'Radio guardado: {{km}} km.',
  },
  // S79-B (cura de gate) · LA PANTALLA CAÍDA — la voz de la frontera de
  // crash (Ley 17.4: dice qué pasó y qué hacer; "revisá tu conexión"
  // sigue RESERVADO a red — esto NO es red) · LOTE S79, GATE PENDIENTE
  caida: {
    titulo: 'Esta pantalla no se pudo mostrar',
    detalle: 'Es un problema nuestro, no de tu configuración — tus datos están a salvo. Prueba de nuevo.',
    reintentar: 'Reintentar',
  },
  // S79-B (cura del blanco) · el gate de rol con datos CONTRADICTORIOS —
  // jamás expulsión muda (Ley 13/D-541) · LOTE S79, GATE PENDIENTE
  gateRoto: {
    titulo: 'No pudimos confirmar tu lugar en el negocio',
    detalle: 'Los datos del negocio se contradicen y preferimos no adivinar. Es un problema nuestro — prueba de nuevo.',
    reintentar: 'Reintentar',
    volver: 'Volver',
  },
  // S87-C (LÁMINA BARRA DE TRES §3) · LA PUERTA QUE HABLA — el no-gestor que
  // llega a una ruta de gestión por deep link. El TÍTULO es el literal
  // FIRMADO por el founder en la lámina; no se adorna ni se le agrega
  // detalle: la frase ya dice de quién es la sección, y una explicación
  // extra convertiría una respuesta en una disculpa. SIN reintento (ver
  // components/gate-ajeno.tsx) · LOTE S87, GATE PENDIENTE
  /* S88-C · LA CAMPANA (lámina firmada 5-ago). La VOZ de cada aviso viaja
     como DATO (la escribió quien registró la intención — la pantalla no
     traduce tipos); estas keys son solo el marco. El vacío es el literal
     de la lámina §4. */
  avisos: {
    titulo: 'Avisos',
    vacio: 'No tenés avisos',
    errorCargar: 'No pudimos cargar tus avisos.',
    /** Fallback DIGNO para una intención que nació sin voz (null honesto
     *  del lector) — se declara genérico, no se inventa un texto. */
    sinVozTitulo: 'Aviso',
    noLeido: 'Sin leer',
    momentoRecien: 'Recién',
    momentoMin: 'Hace {{n}} min',
    momentoHoras: 'Hace {{n}} h',
    momentoAyer: 'Ayer',
  },
  gateAjeno: {
    /* ⏪ S88-C (5-ago): decía «de quien administra el negocio» — y el gate es
       de TITULARIDAD (`esTitular`), no de gestión: el admin ADMINISTRA y
       rebota igual. Post-D-664 gestionar y ser titular son dos verdades con
       nombre propio; el mensaje de un guard es parte del guard, y este
       describía el predicado equivocado. Orden de mesa, 5-ago-2026. */
    titulo: 'Esta sección es del titular del negocio.',
    volver: 'Volver',
  },
  // S79-B (T3-B3) · LA SALA DE ESPERA — el marco del pendiente (la voz
  // del encabezado se REUSA de `bienvenida`, aprobada) · LOTE S79, GATE PENDIENTE
  salaEspera: {
    marco: 'Tu espacio está en revisión. Mientras tanto, puedes dejar todo listo de tu parte.',
    faltaTitulo: 'Qué falta de tu parte',
    faltaAcaAbajo: 'Complétala acá abajo.',
    faltaDireccion: 'Tu dirección',
    faltaRadio: 'Hasta dónde llegas',
    faltaCuenta: 'Tu cuenta comercial',
    faltaCuentaDetalle: 'Con ella el equipo valida quién cobra.',
    faltaTitulo1: 'Tu título profesional',
    faltaTituloDetalle: 'El equipo lo revisa para abrir tu consultorio.',
    despuesTitulo: 'Qué pasa después',
    despuesCuerpo:
      'Hay una revisión humana del otro lado — alguien del equipo mira tu espacio. Cuando esté lista, te avisamos. No prometemos un plazo que no controlamos.',
  },
  // S79-B (T2-B5) · las pantallas de lo que se despierta con el uso —
  // patrón /liquidaciones peldaño 0 · LOTE S79, GATE PENDIENTE
  despierta: {
    casosNav: 'Casos que te confíen',
    casosTitulo: 'Los casos que otros prestadores te confíen',
    casosCuerpo:
      'Cuando un colega te derive el caso clínico de una mascota, su historia llega acá con el consentimiento de la familia.',
    resenasNav: 'Reseñas',
    resenasTitulo: 'Lo que las familias digan de ti',
    resenasCuerpo: 'Cuando una familia deje su primera reseña, va a vivir acá.',
  },
  // ── S90-D · EL CERTIFICADO DE SALUD ─────────────────────────── LOTE S90,
  // GATE PENDIENTE. La voz habla de LO QUE EL PROFESIONAL HACE («declarás»,
  // «tus palabras»), jamás de lo que el sistema concluye: el motor no infiere
  // aptitud, y la voz no puede sugerir que sí.
  certificado: {
    titulo: 'Certificado de salud',
    // El límite va PRIMERO, antes de que escriba nada: quien firma tiene que
    // saber qué está firmando.
    limiteTitulo: 'Qué es y qué no es este papel',
    limiteDetalle:
      'Es una constancia de examen clínico que emites tú, bajo tu responsabilidad profesional. NO es el certificado oficial de movilización: ese lo emite la autoridad sanitaria (en Ecuador, Agrocalidad). El papel lo dice impreso.',
    faltaMatriculaTitulo: 'Te falta tu matrícula profesional',
    faltaMatriculaDetalle:
      'Un certificado lo firma una persona con matrícula, no un negocio. Cárgala en tu ficha del equipo y vuelve: sin ella, el papel no diría quién firma.',
    faltaMatriculaCorto: 'Falta tu matrícula profesional.',
    alcanceLabel: '¿Para qué lo emites?',
    alcance_viaje: 'Viaje',
    alcance_hospedaje: 'Hospedaje',
    alcance_guarderia: 'Guardería',
    alcance_constancia: 'Constancia de atención',
    memorialDetalle:
      'Para {{nombre}} solo se emite una constancia de atención: viaje, hospedaje y guardería certifican algo que va a pasar.',
    declaracionLabel: 'Tu declaración',
    // El placeholder guía la FORMA, jamás el veredicto — un ejemplo con
    // «apta» adentro sería ponerle las palabras en la boca por la ventana.
    declaracionPlaceholder: 'Qué examinaste y qué concluyes, con tus palabras.',
    declaracionAyuda: 'Esto se imprime tal cual, con tu nombre y tu matrícula debajo.',
    faltaAlcance: 'Falta decir para qué lo emites.',
    faltaDeclaracion: 'Falta tu declaración.',
    emitir: 'Emitir y abrir el certificado',
    emitidosTitulo: 'Certificados de {{nombre}}',
    emitidoPor: '{{nombre}} · matrícula {{matricula}}',
    abrir: 'Abrir',
    sinPermisoTitulo: 'Emitir un certificado es un acto clínico',
    sinPermisoDetalle: 'Lo emite quien atiende. Tu rol en este negocio no incluye la parte clínica.',
    // La entrada desde la cita y desde el cierre de la consulta.
    entradaTitulo: 'Emitir un certificado de salud',
    entradaDetalle: 'Constancia de examen clínico, con tu firma.',
  },
  // S91-B — LA RELECTURA DE LA RECETA. El vet EMITE bien (la medicación
  // nace de `sedimentar_nota_clinica`), pero no podía volver a imprimir lo
  // que recetó: cero superficie en toda la app. Esta voz es del acto de
  // RE-ABRIR, no de emitir — por eso no hay ni un verbo de creación acá.
  receta: {
    ver: 'Ver la receta',
    unMedicamento: '1 medicamento recetado',
    variosMedicamentos: '{{n}} medicamentos recetados',
    // Ley 13: un fallo de lectura JAMÁS se disfraza de "no hay receta".
    fallo: 'No pudimos comprobar si esta consulta tiene receta.',
    reintentar: 'Reintentar',
  },
  // S91-B (firma founder 8-ago-2026) · EL HISTÓRICO NAVEGABLE. Nace de un
  // hallazgo de gate: no había CERO caminos a una cita de más de 3 días
  // atrás (el HOY lee hoy-3..hoy+6 y el historial del expediente no es
  // tapeable). Voz de ARCHIVO, no de agenda: acá no se acciona, se vuelve.
  historico: {
    especie_perro: 'Perros',
    especie_gato: 'Gatos',
    especie_ave: 'Aves',
    especie_pez: 'Peces',
    especie_roedor: 'Roedores',
    especie_reptil: 'Reptiles',
    especie_conejo: 'Conejos',
    buscarLabel: 'Buscar una mascota',
    buscarPlaceholder: 'Empieza a escribir su nombre',
    buscarAyuda: 'Con dos letras alcanza.',
    buscarSinCoincidencia: 'Ninguna mascota de este período empieza con «{{texto}}».',
    rangoMes: 'Este mes',
    rango30: '30 días',
    rango90: '90 días',
    rangoAMedida: 'A medida',
    desdeLabel: 'Desde',
    hastaLabel: 'Hasta',
    aplicar: 'Aplicar el rango',
    oficio_veterinaria: 'Veterinaria',
    oficio_grooming: 'Estética',
    oficio_paseo: 'Paseo',
    oficio_adiestramiento: 'Adiestramiento',
    estado: '{{n}} en el período · {{desde}} a {{hasta}}',
    limpiar: 'Quitar los filtros',
    sinCoincidenciasTitulo: 'Nada con esos filtros',
    sinCoincidenciasDetalle: 'En este período no hay nada que cumpla todo a la vez. Suelta un filtro o mira un rango más amplio.',
    titulo: 'Tu histórico',
    entrada: 'Tu histórico',
    entradaDetalle: 'Las atenciones y citas que ya pasaron',
    verMas: 'Ver {{n}} días más',
    vacioTitulo: 'Nada por acá todavía',
    vacioDetalle: 'No hay atenciones desde el {{fecha}}. Puedes seguir mirando hacia atrás.',
    errorTitulo: 'No pudimos traer tu histórico',
    errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
    reintentar: 'Reintentar',
  },
  // ── VENTA DE PRODUCTOS — el módulo de la despensa (S96-C) ─────────────────
  // Dos naturalezas, dos nombres (LETRA_RECORRIDO §1): esto es «Venta de
  // productos», jamás una familia dentro de Servicios. Voz del que TRABAJA:
  // acá el escalón se llama por su nombre («Empacado»), no con la narrativa
  // de la familia — el mismo hecho, dos audiencias (método §6).
  ventas: {
    entradaTitulo: 'Venta de productos',
    entradaDetalle: 'Pedidos, stock y reparto',
    // S96-C (hallazgo ① del gate del founder): el empleado NO-titular que
    // además es VENDEDOR llegaba al muro de titularidad y el muro de un
    // negocio AJENO le tapaba SU despensa. Las dos voces conviven: la
    // gestión del negocio sigue siendo del titular, y lo suyo es suyo.
    negocioAjeno: {
      titulo: 'La gestión de este negocio es de su titular',
      detalle: 'Tu venta de productos sí es tuya: entras por acá.',
    },
    comunes: {
      reintentar: 'Reintentar',
      errorTitulo: 'No pudimos cargar esto',
      errorDetalle: 'Revisa tu conexión y prueba de nuevo.',
      sinCuentaTitulo: 'Tu negocio todavía no vende productos',
      sinCuentaDetalle:
        'La venta de productos se activa con tu cuenta comercial. Cuando tu negocio la tenga, este es el lugar.',
    },
    escalones: {
      preparado: 'Preparado',
      empacado: 'Empacado',
      facturado: 'Facturado',
      despachado: 'Despachado',
      entregado: 'Entregado',
      retirado: 'Entregado en tienda',
    },
    desvios: {
      noLlego: 'No se pudo entregar',
      noLlegoDetalle: 'El pedido volvió. Se reagenda con la familia.',
      cancelado: 'Cancelado',
    },
    hoy: {
      titulo: 'Pedidos',
      cupo: '{{consumido}} de {{capacidad}} entregas hoy',
      cupoCero: 'Sin reparto confirmado para hoy',
      configuracion: 'Configuración',
      stock: 'Stock',
      mostrador: 'Venta de mostrador',
      entregas: 'Mis entregas de hoy',
      entregasDetalle: 'Lo que llevas tú',
      vacioTitulo: 'Todavía no hay pedidos',
      vacioDetalle:
        'Cuando entre uno va a aparecer acá, ordenado por lo que falta hacer.',
      unProducto: '1 producto',
      productos: '{{n}} productos',
      pedidoSinNombre: 'Pedido {{numero}}',
      retiro: 'Retiro en tienda',
      verPedido: 'Ver el pedido {{numero}}',
      terminadosTitulo: 'Terminados',
    },
    ventana: {
      hoyDesdeHasta: 'Hoy, {{desde}}–{{hasta}}',
      fechaDesdeHasta: '{{fecha}}, {{desde}}–{{hasta}}',
      sinVentana: 'Sin ventana prometida',
    },
    pedido: {
      titulo: 'Pedido',
      errorTitulo: 'No encontramos este pedido',
      llamar: 'Llamar',
      abrirMapa: 'Abrir el mapa',
      referencia: 'Referencia',
      productosTitulo: 'Productos',
      lote: 'Lote {{lote}}',
      entregaTitulo: 'Entrega',
      desgloseSubtotal: 'Subtotal',
      desgloseImpuesto: 'Impuesto',
      desgloseEnvio: 'Envío',
      desgloseDescuento: 'Descuento',
      desgloseTotal: 'Total',
      // acciones por escalón — cada paso pide ADELANTE lo que necesita (§3)
      prepararCta: 'Empezar a preparar',
      empacarTitulo: 'Para empacar, registra el lote',
      empacarDetalle:
        'Si un fabricante retira un lote, esta columna es la diferencia entre poder avisar a las familias y no poder.',
      loteDe: 'Lote de {{producto}}',
      pesoReal: 'Peso real (kg) — opcional',
      empacarCta: 'Marcar empacado',
      facturaTitulo: 'Para despachar, registra tu factura',
      facturaTituloRetiro: 'Para entregar, registra tu factura',
      facturaDetalle:
        'La factura se registra, no se emite. Un pedido empacado sin factura no puede salir.',
      facturaNumero: 'Número de factura',
      facturaClave: 'Clave de acceso — opcional',
      facturaCta: 'Registrar factura',
      quienLoLleva: 'Quién lo lleva',
      despacharCta: 'Despachar',
      reintentarCta: 'Volver a despachar',
      reintentoDetalle:
        'Se reusa el mismo envío y el mismo código que la familia ya tiene.',
      sinRepartidores: 'No tienes repartidores activos.',
      irConfiguracion: 'Registrar un repartidor',
      enReparto: 'En manos del repartidor.',
      retiroTitulo: 'Entregar en el mostrador',
      retiroDetalle: 'La persona muestra el código de su pedido en su app.',
      retiroCodigo: 'Código del pedido',
      retiroCta: 'Entregar',
      exitoPreparado: 'Pedido en preparación.',
      exitoEmpacado: 'Empacado registrado.',
      exitoFactura: 'Factura registrada.',
      exitoDespachado: 'Despachado.',
      exitoEntregado: 'Entregado.',
    },
    stock: {
      titulo: 'Stock',
      vacioTitulo: 'Sin productos con stock',
      vacioDetalle:
        'Cuando tu catálogo tenga productos publicados, el inventario se maneja acá.',
      disponibles: '{{n}} disponibles',
      reservadas: '{{n}} reservadas',
      ajustarCta: 'Ajustar',
      ajusteTitulo: 'Ajustar stock',
      direccion: 'Qué pasó',
      entraron: 'Entraron',
      salieron: 'Salieron',
      cantidad: 'Cantidad',
      motivo: 'Motivo',
      motivoAyuda: 'Sin motivo no se guarda. El inventario es plata.',
      guardarCta: 'Guardar el ajuste',
      exito: 'Stock ajustado.',
    },
    entregas: {
      titulo: 'Mis entregas de hoy',
      vacioTitulo: 'Sin entregas asignadas',
      vacioDetalle: 'Cuando te asignen un envío, va a aparecer acá.',
      intento: 'Intento {{n}}',
      abrir: 'Abrir la entrega',
      // detalle — tres acciones y nada más (§9.1)
      voyCta: 'Voy hacia acá',
      voyDetalle: 'Le avisa a la familia que es la próxima parada.',
      enCamino: 'La familia ya sabe que vas.',
      entregarCta: 'Entregado',
      fallidaCta: 'No había nadie',
      // entregar — el cierre con evidencia
      entregarTitulo: 'Cerrar la entrega',
      codigoLabel: 'Código que dice la familia',
      codigoAyuda: 'Lo leen desde su app, en la puerta.',
      fotoLabel: 'Foto de la entrega',
      fotoAyuda: 'La ven el vendedor y e-PetPlace. Se borra a los 90 días.',
      confirmarEntregaCta: 'Confirmar entrega',
      exitoEntregada: 'Entrega cerrada.',
      // fallida — llamar → esperar → la instrucción decide (§9.3)
      fallidaTitulo: 'Nadie en la puerta',
      fallidaPaso1: 'Primero llama. Casi siempre alcanza.',
      fallidaPaso2: 'Espera un momento con el reloj a la vista.',
      fallidaPaso3:
        'Si hay una instrucción de entrega, la instrucción decide. Si no, el pedido vuelve.',
      esperando: 'Esperando {{segundos}} s…',
      esperarCta: 'Esperar un momento',
      motivoLabel: 'Qué pasó',
      motivoAyudaFallida: 'Queda registrado con el envío.',
      confirmarFallidaCta: 'Marcar como no entregada',
      exitoFallida: 'Quedó registrado. El pedido vuelve.',
      // S96-C · el GPS del reparto (elevación firmada — §9.5: heredado del
      // paseo). La notificación es la voz honesta del servicio de fondo:
      // decir «Paseo en curso» en una entrega sería mentir en la barra.
      fondoNotifTitulo: 'Entrega en curso',
      fondoNotifCuerpo: 'e-PetPlace registra el recorrido mientras dura la entrega.',
      gpsSinPermiso: 'Sin permiso de ubicación: el recorrido no se está registrando.',
      gpsAjustes: 'El permiso de ubicación está bloqueado. Actívalo en los Ajustes del teléfono.',
      gpsReintentar: 'Probar de nuevo',
    },
    mostrador: {
      titulo: 'Venta de mostrador',
      detalle:
        'Registra la venta contra nadie: el sistema descuenta tu stock y te da un código para la factura. La persona reclama la compra desde su app.',
      vacioTitulo: 'Sin productos publicados',
      vacioDetalle: 'La venta de mostrador usa tu catálogo publicado.',
      agregarProducto: 'Agregar producto',
      quitar: 'Quitar',
      cantidad: 'Cantidad',
      registrarCta: 'Registrar la venta',
      sinPrecio: 'Sin oferta publicada',
      codigoTitulo: 'Código para la factura',
      codigoDetalle:
        'Escríbelo en tu factura. Con ese código la persona ata la compra a su mascota.',
      codigoExpira: 'Vence el {{fecha}}',
      total: 'Total {{monto}}',
      nuevaVentaCta: 'Registrar otra venta',
      exito: 'Venta registrada.',
    },
    config: {
      titulo: 'Configuración',
      detalle:
        'Completa tu negocio a tu ritmo. e-PetPlace lo revisa y lo hace visible ante los clientes.',
      // ⑥ el estado (§8.6bis) — «en revisión» → «activa»; la voz del modal
      // es §2.1 del recorrido: tú propones, e-PetPlace publica.
      estado: {
        enRevision: 'En revisión',
        activa: 'Activa',
        suspendida: 'Suspendida',
        cerrada: 'Cerrada',
        modalTitulo: 'El estado de tu despensa',
        modalEnRevision:
          'Tú propones, e-PetPlace publica. Completa tu configuración a tu ritmo: cuando el equipo la revise, tu negocio pasa a estar visible ante las familias. No te pedimos nada más por ahora.',
        modalActiva:
          'Tu despensa está visible ante las familias. Lo que propongas de aquí en adelante —productos, precios— sigue pasando por revisión antes de publicarse.',
        modalSuspendida:
          'Tu cuenta comercial está suspendida y tu despensa no está visible. El equipo de e-PetPlace tiene el detalle.',
        modalCerrada: 'Esta cuenta comercial está cerrada.',
      },
      // LA LEY DEL CAMBIO (guard 4, orden de mesa 13-ago): con compromisos
      // vivos, al guardar se DICE qué queda comprometido — ni rechazo ni
      // silencio. Singular/plural aparte (patrón del techo del HOY).
      cambio: {
        cortePedido1:
          'El pedido ya prometido conserva su ventana. Este corte rige para lo que entre desde ahora.',
        cortePedidos:
          'Los {{n}} pedidos ya prometidos conservan su ventana. Este corte rige para lo que entre desde ahora.',
        recursoEntrega1:
          'La entrega ya prometida para hoy se mantiene. La capacidad nueva rige para lo que se prometa desde ahora.',
        recursoEntregas:
          'Las {{n}} entregas ya prometidas para hoy se mantienen. La capacidad nueva rige para lo que se prometa desde ahora.',
      },
      facturacionTitulo: 'Datos de facturación',
      facturacionDetalle: 'Tu cuenta comercial — tú eres el vendedor de registro',
      repartidoresTitulo: 'Repartidores',
      repartidorNuevoCta: 'Registrar repartidor',
      repartidorNombre: 'Nombre',
      repartidorDocumento: 'Documento',
      repartidorTelefono: 'Teléfono — opcional',
      repartidorGuardarCta: 'Guardar',
      repartidorInactivo: 'Inactivo',
      repartidorActivar: 'Activo',
      repartidorExito: 'Repartidor guardado.',
      repartidorYaExistia: 'Ese documento ya estaba registrado.',
      sinRepartidores: 'Sin repartidores todavía',
      recursosTitulo: 'Capacidad de reparto',
      recursosDetalle:
        'La capacidad es del recurso: si la moto lleva 20, el día son 20. Se suma otro recurso, no se rompe el cupo.',
      recursoNuevoCta: 'Agregar recurso',
      // D-791: reabrir lo registrado en el mismo formulario (upsert medido)
      recursoEditarTitulo: 'Corregir el recurso',
      recursoNombreFijo: 'El nombre identifica este recurso. Para otro, agrega uno nuevo.',
      recursoNombre: 'Nombre (ej. Moto)',
      recursoCapacidad: 'Entregas por día',
      recursoGuardarCta: 'Guardar',
      recursoExito: 'Recurso guardado.',
      sinRecursos: 'Sin recursos de reparto todavía',
      capacidadPorDia: '{{n}} por día',
      turnosTitulo: 'Cortes horarios',
      turnosDetalle:
        'El corte decide la promesa: lo que entra antes del corte se entrega en su ventana.',
      turnoNuevoCta: 'Agregar corte',
      turnoEditarTitulo: 'Corregir el corte',
      turnoCodigoFijo: 'El nombre identifica este corte. Para otro, agrega uno nuevo.',
      turnoCodigo: 'Nombre del turno (ej. manana)',
      turnoCorte: 'Hora de corte (HH:MM)',
      turnoDesde: 'Entrega desde (HH:MM)',
      turnoHasta: 'Entrega hasta (HH:MM)',
      turnoDiaSiguiente: 'Se entrega al día siguiente',
      turnoGuardarCta: 'Guardar',
      turnoExito: 'Corte guardado.',
      facturacionVistaTitulo: 'Tu facturación',
      facturacionVistaDetalle: 'Las ventas entregadas, con su desglose adentro',
      liquidacionNota:
        'Cuánto te toca y cuándo te llega se define con el motor de pagos. Acá no se promete lo que todavía no existe.',
      facturacionVacio: 'Todavía no hay ventas entregadas.',
    },
    facturacion: {
      titulo: 'Tu facturación',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // EL WIZARD DE ALTA (S97-C) · LOTE S97, GATE PENDIENTE
  //
  // LA LEY DEL CONTADOR (S91, rige por §8.6bis): narrativa MÁS UN PASO,
  // jamás checklist, y el número tiene que poder llegar a CERO. Lo que
  // depende de e-PetPlace NO entra al contador — por eso `esperaNuestra`
  // es una voz APARTE: él llega a cero, después esperamos nosotros.
  // ═══════════════════════════════════════════════════════════════════════
  alta: {
    encabezado: 'Tu negocio',
    contadorUno: 'Te falta 1 paso.',
    contadorVarios: 'Te faltan {{n}} pasos.',
    contadorCero: 'Ya está todo lo tuyo.',
    esperaNuestra: 'Ahora nos toca a nosotros: estamos revisando lo que subiste.',
    saltar: 'Saltar por ahora',
    continuar: 'Continuar',
    terminar: 'Abrir mi casa',
    volver: 'Atrás',
    // ⭐ S98-C · D-799 — TRES CAUSAS, TRES VOCES. Acá había UNA sola
    // («puede ser la conexión») para tres cosas distintas, y el wrapper
    // SIEMPRE las distinguió: *la pantalla colapsaba lo que el motor ya
    // sabía separar.* Decirle «revisá tu conexión» a alguien cuya sesión
    // caducó lo manda a mirar el WiFi por un problema de identidad.
    // ① la conexión (o el servidor) — la única donde reintentar sirve
    errorTitulo: 'No pudimos cargar esto',
    errorVoz: 'Puede ser la conexión. Probá de nuevo.',
    reintentar: 'Reintentar',
    // ② la sesión: no es un fallo, es que ya no hay quién pregunte
    sinSesionTitulo: 'Tu sesión se cerró',
    sinSesionVoz: 'Entrá de nuevo con tu correo y seguimos donde estabas.',
    sinSesionAccion: 'Entrar',
    // ③ sin negocio: ESTADO LEGÍTIMO, jamás un error — el wizard abre la
    // casa de un negocio que ya existe, y acá todavía no existe.
    sinNegocioTitulo: 'Todavía no tenés un negocio',
    sinNegocioVoz: 'Creá el tuyo y volvemos acá para abrirle la casa.',
    sinNegocioAccion: 'Crear mi negocio',
    entendido: 'Entendido',
    enConstruccion: 'Este paso se monta sobre lo que ya existe: en cuanto entre su composición, va a aparecer acá.',
    // Los nombres de oficio del paso ②. Van acá y no en otro bloque para
    // que la key sea LITERAL en el consumidor (jamás armada por
    // concatenación: el diccionario tipado rompe con una key inexistente
    // y un template lo apagaría con un cast).
    oficioVeterinaria: 'Veterinaria',
    oficioGrooming: 'Estética',
    oficioPaseo: 'Paseo',
    oficioAdiestramiento: 'Adiestramiento',

    paso1: {
      titulo: 'Tu negocio',
      bajada: 'El nombre con el que las familias te van a encontrar.',
      nombre: 'Nombre del negocio',
      logoTitulo: 'Tu logo',
      logoAgregar: 'Agregar logo',
      logoCambiar: 'Cambiar',
      logoQuitar: 'Quitar',
      logoVacio: 'Sin logo usamos tus iniciales.',
      // ☠️ S98-C: `guardar` y `guardado` MURIERON con el botón (firma del
      // 14-ago: un paso, un botón). El «guardado» tampoco vuelve como
      // toast: la confirmación de que se guardó es que el wizard AVANZA
      // — decirlo dos veces es ruido, no cortesía.
      // ⭐ LAS TRES VOCES DEL RECHAZO, en el campo y jamás en un toast.
      // Cada una dice QUÉ campo y POR QUÉ, no «revisá los datos».
      errorVacio: 'Escribí el nombre de tu negocio.',
      errorCorto: 'Con una sola letra no alcanza — escribí el nombre completo.',
      errorSinLetras: 'Un nombre lleva letras: agregá al menos una.',
    },

    paso2: {
      titulo: 'Qué ofreces',
      bajada: 'Prende lo que ya haces hoy. El detalle fino lo configuras después.',
      servicios: 'Tus servicios',
      serviciosVacioTitulo: 'Todavía no cargaste servicios',
      serviciosVacioVoz: 'Cuando cargues tu oferta vas a poder decir dónde atiendes cada servicio.',
      serviciosVacioCta: 'Ir a mi oferta',
      enMiLocal: 'Atiendo en mi local',
      aDomicilio: 'Voy a domicilio',
      // 🔴 LA LEY DE LA PUERTA APLICADA AL REVÉS (firmada S97): lo
      // imposible NI SE OFRECE. El motor tiene
      // `chk_ps_alguna_modalidad` — un servicio sin ninguna modalidad no
      // existe. El último encendido queda apagado y DICE POR QUÉ.
      ultimaModalidad: 'Un servicio necesita al menos un lugar donde lo atiendes.',
      tienda: 'Tu tienda',
      tiendaVoz: 'Vender alimento, antiparasitarios y suplementos a las familias que ya te eligen.',
      tiendaCta: 'Quiero vender productos',
      tiendaPropuesta: 'Nos pediste vender productos. Lo estamos revisando.',
      /* ⭐ S98-C · DOS VOCES, PORQUE SON DOS CASAS. La vieja era UNA y su
         puerta llevaba SIEMPRE a la config del vendedor: un veterinario
         leía «precios, horarios y cobertura» —que describe su taller con
         precisión— y aterrizaba en turnos de reparto. */
      configuracionTitulo: 'El detalle de tu oferta',
      configuracionDetalle: 'Precios, horarios y cobertura',
      configuracionTiendaTitulo: 'El detalle de tu tienda',
      configuracionTiendaDetalle: 'Turnos, reparto y facturación',
    },

    paso3: {
      titulo: 'Tus documentos',
      bajada: 'Los necesitamos para verificar que tu negocio es real. Los revisamos nosotros.',
      subir: 'Subir',
      reemplazar: 'Reemplazar',
      subido: 'Subido',
      enRevision: 'En revisión',
      aprobado: 'Aprobado',
      rechazado: 'Hay que subirlo de nuevo',
      vacioTitulo: 'Todavía no subiste documentos',
      vacioVoz: 'Sube el primero y nosotros nos encargamos del resto.',
      tipoCedula: 'Cédula',
      tipoRuc: 'RUC',
      tipoPermiso: 'Permiso de funcionamiento',
      elegirArchivo: 'Elegir archivo',
      subiendo: 'Subiendo…',
      subidoExito: 'Documento subido. Lo revisamos nosotros.',
      reintentar: 'Reintentar',
      errorLectura: 'No pudimos leer ese archivo. Probá con otro.',
      errorRed: 'Revisá tu conexión.',
      permisoDenegado: 'Necesitamos permiso para abrir la cámara o tus fotos.',
      heredadosTitulo: 'Ya los tenemos',
      heredadosVoz: 'Estos los entregaste con tu perfil profesional. No hace falta subirlos de nuevo.',
    },

    paso4: {
      titulo: 'Tu equipo',
      bajada: 'Quién trabaja contigo. Hoy puedes sumar a quien reparte.',
      deTuEquipo: 'De tu equipo',
      deTuEquipoVoz: 'Ya trabaja contigo: heredamos quién es. Solo falta su documento.',
      nuevo: 'Alguien nuevo',
      nuevoVoz: 'Todavía no está en tu equipo.',
      repartidor: 'Repartidor',
      vacioTitulo: 'Todavía trabajas solo',
      vacioVoz: 'Cuando sumes a alguien va a aparecer acá.',
      sumarCta: 'Sumar a alguien',
      nombre: 'Nombre',
      documento: 'Documento',
      telefono: 'Teléfono',
      guardar: 'Sumar al equipo',
      guardado: 'Listo, ya es parte de tu equipo.',
      equipoVacio: 'Todavía no hay nadie más en tu equipo.',
      sinCuenta: 'Alguien de tu equipo todavía no aceptó la invitación — vas a poder elegirlo cuando entre.',
      faltaDocumento: 'Nos falta su documento para que pueda repartir.',
      recepcionNoAplica:
        'El rol de recepción aparece cuando tengas algún servicio que atiendas en tu local.',
      // ⭐ S98-C · LAS VOCES DEL RECHAZO, en el campo y jamás en un toast.
      errorNombreVacio: 'Escribí el nombre de la persona.',
      errorNombreCorto: 'Con una sola letra no alcanza — escribí su nombre.',
      errorNombreSinLetras: 'Un nombre lleva letras: agregá al menos una.',
      errorDocumentoVacio: 'Falta el documento de la persona.',
      errorDocumentoCorto: 'Ese documento quedó a medias — revisá los dígitos.',
    },

    // Las líneas del salteo — nombran EL BENEFICIO y EL LUGAR, jamás
    // regañan (la idea, no el literal: el founder firmó el sentido).
    salteo: {
      paso2:
        'La configuración de tus servicios es lo que nos deja traerte los clientes que tu negocio necesita — la encuentras cuando quieras en Cuenta › Tu negocio.',
      paso3:
        'Sin tus documentos no podemos verificarte, y sin verificar no apareces frente a las familias — los subes cuando quieras desde Cuenta › Tu negocio.',
      paso4:
        'Sumar a tu equipo es lo que te deja repartir el trabajo del día — lo tienes en Cuenta › Tu equipo.',
    },

    estado: {
      enRevision: 'En revisión',
      activa: 'Activa',
      modalTitulo: '¿Qué significa «en revisión»?',
      modalVoz:
        'Miramos cada negocio antes de mostrarlo a las familias. Es lo que hace que estar acá signifique algo. Te avisamos apenas termine.',
    },
  },
} as const;
