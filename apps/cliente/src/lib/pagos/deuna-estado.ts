/**
 * S103-C · **LA COSTURA ÚNICA DE DEUNA** — el único lugar donde entra la
 * fuente real.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 🔴 ESTE ARCHIVO EXISTE PARA QUE EL LUNES SEA CONECTAR, NO CONSTRUIR. │
 * │                                                                      │
 * │ La pantalla (`components/espera-deuna.tsx`) **no sabe de dónde salen │
 * │ sus datos**: consume `EstadoDeUna` y nada más. Cuando D entregue su  │
 * │ puerta, **se cambia el cuerpo de `useEstadoDeUna` y CERO líneas de   │
 * │ la pantalla.**                                                       │
 * │                                                                      │
 * │ *Una costura declarada en un solo lugar es la diferencia entre       │
 * │ enchufar y reescribir.*                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── QUÉ VA A REEMPLAZAR A QUÉ, exactamente ───────────────────────────────
 *
 * `ENSAYO` muere entero. `useEstadoDeUna` conserva **su firma y su tipo de
 * retorno**, y su cuerpo pasa a:
 *   ① crear/leer el intento por la puerta de D (`pagos-deuna-solicitud`),
 *   ② mapear la respuesta del proveedor a `EstadoDeUna` con la tabla §6,
 *   ③ sondear —o suscribirse— hasta que el actuador diga `pagada`.
 *
 * **El mapeo de estados NO se decide acá**: sale de `LETRA_DEUNA` §6, que ya
 * lo fija fila por fila. *Lo que este archivo aporta es la FORMA; el
 * contenido es de la letra y del contrato de D.*
 *
 * ── ⚠️ LO QUE ESTE ARCHIVO **NO** HACE, y es deliberado ──────────────────
 *
 * **No inventa el contrato de D.** No hay tipos de request, ni nombres de
 * endpoint, ni forma de payload: solo **lo que la PANTALLA necesita saber**,
 * que es lo que la letra ya firmó. *`PLAN_MESA_104` §1: «C no inventa
 * contratos». Un tipo con la forma adivinada del proveedor sería justo eso.*
 *
 * **Y no persiste nada.** El ensayo vive en memoria: cero escrituras a la
 * base, cero llamadas a QA. *Compatible con la veda 76(g) de A.*
 */

import { useEffect, useMemo, useState } from 'react';

import {
  pedirCodigoDeunaCita,
  pedirCodigoDeunaCompra,
  type CodigoDeuna,
  type SujetoDeuna,
} from '@epetplace/api';

/**
 * 🔴 LAS CINCO FAMILIAS DE FALLO — `CONTRATO_WRAPPER_DEUNA` §4.
 *
 * **Cada una pide una voz distinta, y confundir dos manda a la persona al
 * lugar equivocado.** Las dos que el contrato marca como intocables:
 *
 * · **`compuerta` llega con LA CAUSA REAL y el proveedor NUNCA SE ENTERÓ** —
 *   es la letra madre de §7: *primero se verifica que se pueda entregar,
 *   después se pide la plata.* **Decir «no se pudo procesar el pago» acá
 *   sería mentir: el pago nunca se intentó.**
 * · **`red` NO ES UN RECHAZO.** Se reintenta. Y `sesion_no_verificable`
 *   **jamás dice «cerrá sesión»**: es un 503 de auth, la sesión
 *   probablemente esté bien.
 */
export type FamiliaDeuna =
  /** ① Defecto NUESTRO: no hizo nada mal y no puede arreglarlo. Disculpa +
   *  soporte, **jamás «reintentá»** — no va a cambiar. */
  | 'nuestro'
  /** ② La COMPUERTA: nuestro motor diciendo que no se puede entregar. */
  | 'compuerta'
  /** ③ El PROVEEDOR rechazó — viene con `motivo`. */
  | 'rechazo'
  /** ④ La RED: nadie falló. **REINTENTAR.** */
  | 'red'
  /** ⑤ AMBIGUO A PROPÓSITO: «no existe O es de otro». **No se afina** —
   *  distinguirlas convertiría la puerta en un oráculo de compras ajenas. */
  | 'ambiguo'
  /** El 401: no es defecto de nadie. Volver a entrar. */
  | 'sesion';

/**
 * 🔴 **EL MAPA ES `Record<CodigoDeuna, …>` A PROPÓSITO, Y ES LA DEFENSA
 * ENTERA DE ESTE ARCHIVO.**
 *
 * **El caso que lo justifica ya ocurrió y está escrito en el tipo de A:** la
 * lista de códigos se armó contra un contrato a mano que declaraba **10 de
 * los 12** que la puerta emite, y `monto_invalido` **habría quedado sin voz**
 * — *un `switch` con `default` habría compilado diciendo que cubrió todo.*
 *
 * **Con `Record` exhaustivo, agregar un código al tipo de A ROMPE MI
 * TYPECHECK** hasta que alguien decida su familia. *No es prolijidad: es la
 * diferencia entre enterarse al compilar y enterarse por una persona mirando
 * una pantalla que no sabe qué decirle.*
 */
/**
 * 🔴 **Y EL TIPO ES MÁS ANCHO QUE `CodigoDeuna` — LO DESCUBRIÓ EL TYPECHECK,
 * NO YO.**
 *
 * `ResultadoWrapper` agrega **`error_desconocido`** y **`datos_inconsistentes`**
 * a los códigos del dominio. **Son dos que `CodigoDeuna` no lista y que el
 * wrapper sí puede devolver** ⇒ con `Record<CodigoDeuna, …>` a secas,
 * `FAMILIA_DE[codigo]` habría dado **`undefined` en runtime** y la pantalla
 * habría quedado sin voz **justo en el fallo que menos sabemos explicar**.
 *
 * *Es el mismo agujero que el mapa vino a cerrar, entrando por la otra
 * puerta: no por un código nuevo del dominio, sino por la envoltura común.*
 * **Los dos son DEFECTO NUESTRO** — `datos_inconsistentes` es el wrapper
 * diciendo que la respuesta no tenía la forma prometida, y `error_desconocido`
 * es literalmente «no sé»: *ofrecer «reintentá» sobre un fallo sin nombre es
 * prometer una cura que no se midió.*
 */
type CodigoDeFallo = CodigoDeuna | 'error_desconocido' | 'datos_inconsistentes';

const FAMILIA_DE: Record<CodigoDeFallo, FamiliaDeuna> = {
  error_desconocido: 'nuestro',
  datos_inconsistentes: 'nuestro',
  // ① nuestro — la persona no hizo nada mal
  datos_invalidos: 'nuestro',
  monto_no_se_recibe: 'nuestro',
  servidor_sin_configurar: 'nuestro',
  /** 409 · el desglose existe y su total no es > 0. Nuestro. */
  monto_invalido: 'nuestro',
  /** 405 · improbable desde acá (siempre POST), pero la puerta lo emite. */
  metodo_no_permitido: 'nuestro',
  // ② compuerta — nuestro motor, y el proveedor ni se enteró
  pago_en_proceso: 'compuerta',
  reserva_vencida: 'compuerta',
  vendedor_no_activo: 'compuerta',
  monto_divergente: 'compuerta',
  compra_sin_pedidos: 'compuerta',
  /* 🔴 ENMIENDA DE MESA AL CONTRATO (23-ago) — el contrato lo listaba en
     COMPUERTA y la mesa lo movió acá, con su razón: **el desglose congelado
     es artefacto NUESTRO.** Si está incompleto no hay nada que la persona
     pueda corregir, y mandarla a «volver e intentar» la hace repetir un
     camino que va a fallar igual. *Misma ley que el monto que diverge del
     desglose.* **Y a diferencia de la compuerta, esto no depende del
     sujeto.** */
  desglose_incompleto: 'nuestro',
  // ③ el proveedor rechazó
  no_se_pudo_completar: 'rechazo',
  // ④ la red — NO es rechazo
  sin_respuesta: 'red',
  sesion_no_verificable: 'red',
  // ⑤ ambiguo a propósito
  compra_no_existe: 'ambiguo',
  cita_no_existe: 'ambiguo',
  // el 401
  sin_sesion: 'sesion',
};

export function familiaDeFallo(codigo: CodigoDeFallo): FamiliaDeuna {
  return FAMILIA_DE[codigo];
}

/**
 * Los estados que la PANTALLA distingue, derivados de la tabla §6 de
 * `LETRA_DEUNA`. **Es una unión discriminada a propósito**: cada fase trae
 * exactamente los datos que su dibujo necesita y ninguno más — *una fase que
 * puede leer un campo que no le corresponde es una fase que un día lo dibuja.*
 */
export type EstadoDeUna =
  /** `PENDING` con código vivo · y `PENDING` con código vencido y hold vivo:
   *  **son la misma fase**, y la pantalla las separa mirando el reloj. *Que el
   *  código venció es una consecuencia del tiempo, no un estado del servidor
   *  — pedirle al servidor que lo diga sería preguntar dos veces lo mismo.* */
  | {
      fase: 'esperando';
      /** Los 6 dígitos (`numericCode`). */
      codigo: string;
      /** 🔴 INSTANTE ISO del vencimiento del código — **del servidor**. */
      venceEn: string;
      /**
       * INSTANTE ISO del hold del sujeto (stock o agenda).
       *
       * 🔴 **`null` = NO LO SABEMOS, y es el caso real hoy.** El contrato §3
       * es explícito: **el hold lo dice el SUJETO, no el wrapper de DeUna** —
       * éste solo devuelve el reloj del código. *Rellenarlo con `expiraEn`
       * mezclaría los dos relojes, que es exactamente lo que el contrato
       * prohíbe: la pantalla ofrecería «generá otro código» cuando lo que
       * venció fue la reserva, y el código nuevo tampoco serviría.*
       *
       * **Con `null` la pantalla no puede afirmar nada sobre el hold** — que
       * es la verdad — en vez de afirmar algo falso con cara de dato.
       */
      holdVenceEn: string | null;
    }
  /** `APPROVED` / webhook `SUCCESS` **verificado por consulta activa**. */
  | { fase: 'aprobada' }
  /** 🔴 `NOT_FOUND` dentro de ventana · `REVERSED_FAILED`.
   *  §6: *hallazgo con nombre — jamás voz de éxito ni silencio*, y
   *  `REVERSED_FAILED` **jamás se resuelve solo**. */
  | { fase: 'hallazgo'; nombre: string }
  /** 🔴 No se pudo pedir el código. **La familia viaja con el fallo**, porque
   *  es lo que decide la voz — y `codigo` va al lado **sin traducirse**, para
   *  que soporte y el tablero cuenten lo mismo que dice el motor.
   *
   *  ⚠️ **`cargando` es una fase y no un booleano suelto** por lo mismo que
   *  el resto de la unión: *un `cargando` al lado del estado deja expresable
   *  «cargando y aprobada a la vez».* */
  | { fase: 'fallo'; familia: FamiliaDeuna; codigo: CodigoDeFallo; motivo?: string }
  | { fase: 'cargando' };

/* ════════════════════════════════════════════════════════════════════════
   ☠️ ANDAMIO DE ENSAYO — muere entero cuando llegue el `pointOfSale`.

   **Por qué existe:** el riel está bloqueado por un dato del comercio que no
   expone ningún endpoint (D midió 16 sondeos → 404 en los 16), así que **no
   se puede crear ni una transacción**. Sin esto, la pantalla del código no se
   podría mirar hasta que ese dato llegue — y mirarla es justamente lo que
   permite corregirla antes.

   **Su condición de muerte, escrita para que no sobreviva:** el día que
   `useEstadoDeUna` llame a la puerta de D, `ENSAYO` y todo este bloque se
   borran. *Un andamio sin condición de muerte escrita es una pieza de
   producción que nadie se anima a tocar.*
   ════════════════════════════════════════════════════════════════════════ */

/** Los guiones de ensayo. **El código es un literal de prueba evidente.** */
export const ENSAYO = {
  /** El camino normal: código vivo, 3 min por delante, hold largo. */
  esperando: () => ({
    fase: 'esperando' as const,
    codigo: '123456',
    venceEn: new Date(Date.now() + 3 * 60_000).toISOString(),
    holdVenceEn: new Date(Date.now() + 12 * 60_000).toISOString(),
  }),
  /** Código a punto de vencer — para VER la regeneración sin esperar 3 min. */
  porVencer: () => ({
    fase: 'esperando' as const,
    codigo: '654321',
    venceEn: new Date(Date.now() + 10_000).toISOString(),
    holdVenceEn: new Date(Date.now() + 12 * 60_000).toISOString(),
  }),
  /** Hold a punto de morir: manda sobre el código (§5, compuerta 1). */
  holdPorVencer: () => ({
    fase: 'esperando' as const,
    codigo: '111222',
    venceEn: new Date(Date.now() + 3 * 60_000).toISOString(),
    holdVenceEn: new Date(Date.now() + 8_000).toISOString(),
  }),
  aprobada: () => ({ fase: 'aprobada' as const }),
  /* 🔴 UNA POR FAMILIA — para poder CAMINARLAS, no solo medirlas.
     El código de cada una es real (sale del contrato), así que lo que se
     dibuja es la voz que la persona vería de verdad. */
  falloCompuerta: () => ({
    fase: 'fallo' as const,
    familia: familiaDeFallo('reserva_vencida'),
    codigo: 'reserva_vencida' as const,
  }),
  falloRed: () => ({
    fase: 'fallo' as const,
    familia: familiaDeFallo('sin_respuesta'),
    codigo: 'sin_respuesta' as const,
  }),
  falloNuestro: () => ({
    fase: 'fallo' as const,
    familia: familiaDeFallo('servidor_sin_configurar'),
    codigo: 'servidor_sin_configurar' as const,
  }),
  falloAmbiguo: () => ({
    fase: 'fallo' as const,
    familia: familiaDeFallo('compra_no_existe'),
    codigo: 'compra_no_existe' as const,
  }),
  falloRechazo: () => ({
    fase: 'fallo' as const,
    familia: familiaDeFallo('no_se_pudo_completar'),
    codigo: 'no_se_pudo_completar' as const,
  }),
  falloSesion: () => ({
    fase: 'fallo' as const,
    familia: familiaDeFallo('sin_sesion'),
    codigo: 'sin_sesion' as const,
  }),
  /* 🔴 EL CASO DEL HOLD DESCONOCIDO — el que la mesa quiere ver: con
     `holdVenceEn: null` **no se pinta NADA como vencido**. */
  holdDesconocido: () => ({
    fase: 'esperando' as const,
    codigo: '778899',
    venceEn: new Date(Date.now() + 3 * 60_000).toISOString(),
    holdVenceEn: null,
  }),
  /** El nombre viaja del servidor; acá se ensaya el de la letra §3.5. */
  hallazgo: () => ({ fase: 'hallazgo' as const, nombre: 'huerfano_deuna_vencido' }),
} satisfies Record<string, () => EstadoDeUna>;

export type GuionDeEnsayo = keyof typeof ENSAYO;

/**
 * 🔴 **LA COSTURA.** Hoy resuelve contra `ENSAYO`; mañana contra la puerta de D.
 *
 * @param guion **solo del andamio** — desaparece con él. La firma real va a
 *        recibir el sujeto (`{tipo:'compra'|'cita', id}`), como `cobrar()`.
 */
export function useEstadoDeUna(entrada: SujetoDeuna | { ensayo: GuionDeEnsayo }): {
  estado: EstadoDeUna;
  /** Pide un código nuevo (§5) — **el reloj del CÓDIGO, jamás el del hold**. */
  regenerar: () => void;
} {
  const [semilla, setSemilla] = useState(0);
  const [real, setReal] = useState<EstadoDeUna>({ fase: 'cargando' });
  const esEnsayo = 'ensayo' in entrada;

  /* El estado de ensayo se re-deriva al regenerar. `useMemo` y no `useState`
     porque **el instante de vencimiento se calcula UNA vez por código** —
     recalcularlo en cada render movería el reloj hacia adelante para siempre y
     la cuenta regresiva nunca bajaría. */
  const deEnsayo = useMemo<EstadoDeUna | null>(
    () => (esEnsayo ? ENSAYO[(entrada as { ensayo: GuionDeEnsayo }).ensayo]() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [esEnsayo, esEnsayo ? (entrada as { ensayo: GuionDeEnsayo }).ensayo : null, semilla],
  );

  const sujetoTipo = esEnsayo ? null : (entrada as SujetoDeuna).tipo;
  const sujetoId = esEnsayo ? null : (entrada as SujetoDeuna).id;

  useEffect(() => {
    if (sujetoTipo === null || sujetoId === null) return;
    let vigente = true;
    setReal({ fase: 'cargando' });
    void (sujetoTipo === 'compra'
      ? pedirCodigoDeunaCompra(sujetoId)
      : pedirCodigoDeunaCita(sujetoId)
    ).then((r) => {
      if (!vigente) return;
      if (r.ok) {
        setReal({
          fase: 'esperando',
          codigo: r.data.codigo,
          /* 🔴 EL RELOJ DEL CÓDIGO, y **solo** ése. `holdVenceEn` NO sale de
             acá: el contrato §3 dice que **el hold lo dice el sujeto, no este
             wrapper**. *Rellenarlo con `expiraEn` haría que la pantalla
             ofreciera «generá otro código» cuando lo que venció fue la
             reserva — y el código nuevo tampoco serviría.* */
          venceEn: r.data.expiraEn,
          holdVenceEn: null,
        });
        return;
      }
      setReal({
        fase: 'fallo',
        familia: familiaDeFallo(r.codigo),
        /* El código viaja SIN traducir — §4: *para que un tablero cuente lo
           mismo que el motor dice.* */
        codigo: r.codigo,
        motivo: 'motivo' in r && typeof r.motivo === 'string' ? r.motivo : undefined,
      });
    });
    return () => {
      vigente = false;
    };
  }, [sujetoTipo, sujetoId, semilla]);

  return {
    estado: deEnsayo ?? real,
    regenerar: () => setSemilla((s) => s + 1),
  };
}

/**
 * El sondeo que la fase `aprobada` va a necesitar. **Hoy no existe y se
 * declara**: en el ensayo el estado no cambia solo.
 *
 * *Se deja nombrado para que quien conecte la fuente real sepa que le falta —
 * `LETRA_DEUNA` §3.4 dice que la confirmación llega por webhook **y/o**
 * consulta activa, «la que llegue primero», y que **la pantalla pasa sola a
 * pagada, jamás declara**.* La casa ya tiene la pieza que hace esto para
 * tarjeta: `useEsperaDeConfirmacion`.
 */
export function pendienteDeConectar_sondeo(): void {
  /* intencionalmente vacío — ver el comentario de arriba */
}

/* ════════════════════════════════════════════════════════════════════════
   🔴 LA VOZ DEL FALLO — **vive ACÁ y no en el componente, a propósito.**

   Elegir qué se le dice a la persona según la familia **es lógica, no
   dibujo**: tiene un árbol de decisión con seis ramas y tres acciones
   distintas, y es exactamente lo que la mesa quiere poder VERIFICAR.

   **Y la razón fuerte es de instrumento:** con el árbol adentro del `.tsx`,
   cualquier script que lo midiera tendría que **reimplementar la fórmula** —
   y entonces mediría su propio eco, no la pieza. *La casa ya se cobró eso
   con la barra: el instrumento bueno extrae del archivo real.* Con la voz
   acá, **el recorrido mide la MISMA función que la pantalla monta.**
   ════════════════════════════════════════════════════════════════════════ */

const CAUSA_DE_COMPUERTA = {
  pago_en_proceso: 'pago.deunaCausaPagoEnProceso',
  reserva_vencida: 'pago.deunaCausaReservaVencida',
  vendedor_no_activo: 'pago.deunaCausaVendedorNoActivo',
  monto_divergente: 'pago.deunaCausaMontoDivergente',
  compra_sin_pedidos: 'pago.deunaCausaCompraSinPedidos',
  /* ☠️ `desglose_incompleto` SALIÓ de acá con la enmienda de mesa: ya no es
     compuerta, así que no tiene causa que decir — habla la voz de defecto
     nuestro. */
} as const;

/** Qué se le ofrece a la persona. **`reintentar` SOLO para la red** — las
 *  otras familias no se curan repitiendo. */
export type AccionDeFallo = 'reintentar' | 'volver' | 'soporte';

/** 🔴 **Las claves van como LITERALES, no como `string`.** El riel las valida
 *  al compilar (una clave inexistente rompe el typecheck) y `string` apagaría
 *  esa validación justo en el archivo que las elige. *Tipar esto como `string`
 *  habría dejado pasar un error de tipeo hasta la pantalla.* */
export type VozDeFallo = {
  titulo:
    | 'pago.deunaCompuertaTitulo'
    | 'pago.deunaRedTitulo'
    | 'pago.deunaFalloTitulo';
  cuerpo:
    | (typeof CAUSA_DE_COMPUERTA)[keyof typeof CAUSA_DE_COMPUERTA]
    | 'pago.deunaRedCuerpo'
    | 'pago.deunaAmbiguoCuerpo'
    | 'pago.deunaSesionCuerpo'
    | 'pago.deunaRechazoCuerpo'
    | 'pago.deunaNuestroCuerpo';
  accion: AccionDeFallo;
};

/** Las causas de compuerta, una por código. **Mapa explícito y no clave
 *  interpolada:** las claves del diccionario son tipadas exigibles, y una
 *  construida en runtime no la valida nadie — *su modo de falla es la persona
 *  leyendo `pago.deunaCausa_reserva_vencida` en pantalla.* */


/**
 * De un código a su voz. **Total sobre `CodigoDeFallo`**: no hay rama que
 * devuelva `undefined`, y por eso ningún código puede quedarse mudo.
 *
 * 🔴 Las tres reglas que el contrato marca como intocables, aplicadas acá:
 * · **compuerta NO dice «falló el pago»** — el proveedor nunca se enteró.
 * · **red ofrece REINTENTAR y jamás soporte** — no es un rechazo.
 * · **`sesion_no_verificable` cae en `red`**, así que **nunca dice «cerrá
 *   sesión»**: es un 503 de auth y la sesión probablemente esté bien.
 */
export function vozDeFallo(codigo: CodigoDeFallo): VozDeFallo {
  const familia = familiaDeFallo(codigo);
  if (familia === 'compuerta') {
    return {
      titulo: 'pago.deunaCompuertaTitulo',
      cuerpo:
        codigo in CAUSA_DE_COMPUERTA
          ? CAUSA_DE_COMPUERTA[codigo as keyof typeof CAUSA_DE_COMPUERTA]
          : /* Inalcanzable mientras `FAMILIA_DE` sea la única fuente de
               familias; queda por si alguien mueve un código a `compuerta`
               sin darle causa — **cae en voz honesta, jamás en silencio.** */
            'pago.deunaNuestroCuerpo',
      accion: 'volver',
    };
  }
  if (familia === 'red') {
    return { titulo: 'pago.deunaRedTitulo', cuerpo: 'pago.deunaRedCuerpo', accion: 'reintentar' };
  }
  if (familia === 'ambiguo') {
    return { titulo: 'pago.deunaFalloTitulo', cuerpo: 'pago.deunaAmbiguoCuerpo', accion: 'volver' };
  }
  if (familia === 'sesion') {
    return { titulo: 'pago.deunaFalloTitulo', cuerpo: 'pago.deunaSesionCuerpo', accion: 'volver' };
  }
  if (familia === 'rechazo') {
    return { titulo: 'pago.deunaFalloTitulo', cuerpo: 'pago.deunaRechazoCuerpo', accion: 'soporte' };
  }
  return { titulo: 'pago.deunaFalloTitulo', cuerpo: 'pago.deunaNuestroCuerpo', accion: 'soporte' };
}

/** Los 17 códigos que el wrapper puede devolver — **lista derivada del mapa,
 *  jamás tecleada aparte.** *Dos listas del mismo conjunto divergen el día
 *  que alguien agrega a una sola.* Su consumidor es el recorrido. */
export const CODIGOS_DE_FALLO = Object.keys(FAMILIA_DE) as CodigoDeFallo[];
