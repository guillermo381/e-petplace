/**
 * S101-C · «CÓMO QUIERES PAGAR» — **UNA PIEZA, LAS DOS PUERTAS**
 * (orden del founder ①②③④⑤).
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 🔴 EL PUNTO ⑤ NO ES «QUE SE PAREZCAN»: ES QUE SEAN LA MISMA.            │
 * │                                                                         │
 * │ La despensa y el checkout de reserva tenían **la misma sección escrita  │
 * │ dos veces** — mismo texto, misma hoja, misma preselección — y ya habían │
 * │ empezado a separarse: el botón de una era `bloque` en un pie fijo y el  │
 * │ de la otra era chico y vivía en el scroll.                              │
 * │                                                                         │
 * │ *Dos copias no divergen el día que se escriben: divergen el día que     │
 * │ alguien afina una. Y la que no se afina no da error — se queda vieja.*  │
 * │                                                                         │
 * │ ⇒ Acá vive **el estado, la sección, la hoja y el botón**. Las dos       │
 * │   pantallas montan esto y no tienen de dónde sacar una versión propia.  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * **Lo que la orden del founder puso adentro, punto por punto:**
 *
 * · **①** el botón de pagar es **UNO SOLO en la casa** — `bloque`, mismo
 *   tamaño y misma presencia en las dos puertas. Sale de `BotonPagar`, que es
 *   la única forma de dibujarlo.
 * · **②** la sección vive **dentro de una `Tarjeta`** (superficie de la casa,
 *   blanca en claro) — despensa y servicios por igual.
 * · **③** la fila de la elegida termina en **«Cambiar ›»**. ☠️ Murió
 *   «Elegido»: *era una etiqueta contando lo que la fila ya mostraba, y en su
 *   lugar no había ningún camino visible para cambiarla.*
 * · **④** cada medio de la hoja lleva **logo de franquicia a la izquierda** y
 *   **«›» a la derecha** — forma de camino. *DeUna va a ser una fila más.*
 *
 * 🔴 **NADA ACÁ NACE POR ABRIRSE.** Los medios se leen cuando la pantalla dice
 *    que llegó el momento (`activo`), y el alta corre **al TOCAR**. *La lección
 *    del andamio del alta —una pantalla que fabricaba estado por abrirse volvió
 *    inobservable un vencimiento— rige por construcción.*
 */

import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Boton, Celda, Chevron, Hoja, Tarjeta, Texto, spacing, useAviso,
} from '@epetplace/ui';
import {
  guardarMedioPagoPreferido, listarTarjetasGuardadas, obtenerPreferencias,
  type TarjetaGuardada,
} from '@epetplace/api';
import {
  DEUNA_ELEGIBLE, FilaDeUna, FilaMedioDePago, desempatarMedios,
} from '@/components/fila-medio-de-pago';
import { abrirAltaDeTarjeta } from '@/lib/pagos/alta-tarjeta';
import { useTraduccion } from '@/i18n';

/**
 * 🔴 QUÉ ELIGIÓ LA FAMILIA — unión discriminada, y **ahora sí corresponde**.
 *
 * ⏪ Hasta hoy esto era `string | null` (el id de una tarjeta) y **estaba
 * bien**: mientras DeUna no se pudiera elegir, una unión habría sido un modelo
 * de datos para un caso que no podía ocurrir. **Lo que cambió es la firma del
 * founder**: DeUna es el default, así que *«qué eligió»* ya tiene **dos
 * clases** y un id de tarjeta no puede expresar la segunda.
 *
 * *Es la misma razón por la que A hizo DOS columnas y no una FK: **DeUna no es
 * una tarjeta** — no tiene alta, no tiene token, no tiene fila.*
 */
export type MedioElegido =
  | { tipo: 'tarjeta'; id: string }
  | { tipo: 'deuna' };

/**
 * 🔴 **QUÉ RIELES TIENEN PUERTA VIVA — `Record` exhaustivo, y ésa es la
 * defensa entera.**
 *
 * Un medio se puede elegir sin que exista quien lo cobre: fue **el estado real
 * de DeUna durante tres sesiones**. Mientras el gate del botón preguntaba por
 * `idTarjeta`, ese caso se atajaba **de casualidad** —un id de tarjeta es nulo
 * cuando lo elegido no es una tarjeta— y **la casualidad se acabó justo al
 * encender el riel**: la misma línea que protegía pasó a apagar el botón sobre
 * un medio que sí puede pagar.
 *
 * **Con `Record<MedioElegido['tipo'], …>`, agregar un tercer riel al tipo
 * ROMPE EL TYPECHECK** hasta que alguien declare si tiene puerta. *No es
 * prolijidad: es la diferencia entre enterarse al compilar y enterarse por una
 * persona tocando un botón que rebota.* Es el mismo mecanismo que `FAMILIA_DE`
 * en `deuna-estado`, y por la misma razón.
 */
const PUERTA_VIVA: Record<MedioElegido['tipo'], boolean> = {
  /** `pagos-cobro` con la tarjeta tokenizada. */
  tarjeta: true,
  /** `pagos-deuna-solicitud` — viva desde el 25-ago-2026. */
  deuna: true,
};

/** Sin medio elegido no se paga; con uno cuyo riel no tenga puerta, tampoco. */
export function puedePagarCon(m: MedioElegido | null): boolean {
  return m !== null && PUERTA_VIVA[m.tipo];
}

export type MedioDePago = {
  medios: TarjetaGuardada[];
  elegido: MedioElegido | null;
  /**
   * El id de tarjeta, **solo si lo elegido es una tarjeta**. Es lo que la
   * puerta de cobro de hoy sabe recibir. *Con DeUna vale `null` y el botón de
   * pagar se apaga: su puerta es de D y todavía no existe.*
   */
  idTarjeta: string | null;
  eligiendo: boolean;
  /** 🔴 Por qué el default NO pudo ser DeUna. `null` = no hay nada que decir. */
  vozDefault: string | null;
  abrirEleccion: () => void;
  cerrarEleccion: () => void;
  elegir: (m: MedioElegido) => void;
  agregar: () => Promise<void>;
  releer: () => Promise<void>;
};

/**
 * El ESTADO de la elección — también compartido. *Si cada pantalla llevara su
 * propio `useState`, la regla de preselección (una sola tarjeta ⇒ elegida;
 * dos o más ⇒ la familia elige) viviría en dos lados y un día diferiría.*
 *
 * @param activo cuándo tiene sentido leer los medios. **Falso mientras no haya
 *        un total que pagar**: *antes de eso, «con qué pagás» no es una
 *        pregunta.*
 */
export function useMedioDePago(activo: boolean): MedioDePago {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const [medios, setMedios] = useState<TarjetaGuardada[]>([]);
  const [elegido, setElegido] = useState<MedioElegido | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [vozDefault, setVozDefault] = useState<string | null>(null);

  const releer = useCallback(async () => {
    /* Las dos lecturas van en paralelo: **la preferencia no depende de las
       tarjetas y las tarjetas no dependen de la preferencia.** Encadenarlas
       pagaría dos peajes de red por un dato que no se necesitan entre sí
       (L-223: el costo está en el viaje, no en la consulta). */
    const [rTarjetas, rPref] = await Promise.all([
      listarTarjetasGuardadas(),
      obtenerPreferencias(),
    ]);
    if (!rTarjetas.ok) return;
    setMedios(rTarjetas.data);

    /* 🔴 UNA PREFERENCIA QUE NO SE PUDO LEER **NO ES «nunca eligió»**. Si la
       lectura falla, no se aplica ningún default: *pisar la elección de la
       familia por un error de red es exactamente el «reset por compra» que la
       firma prohíbe, con otra causa.* */
    const pref = rPref.ok ? rPref.data.medioPago : undefined;

    setElegido((prev) => {
      if (prev !== null) return prev;                    // ya eligió en esta pantalla
      if (pref === undefined) return null;               // no sabemos: no inventamos

      /* ── ① LA ELECCIÓN PREVIA GANA SOBRE EL DEFAULT ──────────────────────
         Firma del founder: *«por defecto a menos que el usuario lo cambie»*.
         **El default es para quien no eligió nunca, no un reset por compra.** */
      if (pref.medio === 'deuna') {
        if (DEUNA_ELEGIBLE) return { tipo: 'deuna' };
        /* Eligió DeUna y hoy no se puede: **se dice, no se cambia en
           silencio** (borde 1 de la firma). Y NO se cae a una tarjeta
           cualquiera — eso sería `medios[0]`, el andamio que la Fase 5 mató. */
        setVozDefault(t('pago.deunaNoDisponibleAhora'));
        return null;
      }
      if (pref.medio === 'tarjeta' && pref.tarjetaId !== null) {
        /* La tarjeta preferida **puede haber sido borrada**: el trigger de A
           limpia la preferencia, pero esta pantalla pudo leerla antes. Se
           verifica contra la lista viva. */
        const vive = rTarjetas.data.some((m) => m.id === pref.tarjetaId);
        if (vive) return { tipo: 'tarjeta', id: pref.tarjetaId };
      }

      /* ── ② NUNCA ELIGIÓ (`null`) ⇒ RIGE EL DEFAULT ───────────────────────── */
      if (DEUNA_ELEGIBLE) return { tipo: 'deuna' };

      /* Borde 1 vigente: DeUna todavía no se puede elegir ⇒ **el default cae a
         tarjeta y la pantalla lo DICE**. La regla vieja sigue rigiendo debajo:
         con UNA sola tarjeta se preselecciona (preguntar sería fricción sin
         decisión); **con dos o más NO se elige por la familia**. */
      setVozDefault(t('pago.deunaNoDisponibleAhora'));
      return rTarjetas.data.length === 1
        ? { tipo: 'tarjeta', id: rTarjetas.data[0].id }
        : null;
    });
  }, [t]);

  useEffect(() => {
    if (activo) void releer();
  }, [activo, releer]);

  /* 🔴 AGREGAR SIN PERDER LO QUE ESTÁ EN CURSO: el alta abre su WebView y al
     volver se releen los medios. *La compra ya vive en el motor y el horario ya
     está apartado — salir a guardar una tarjeta no puede costar ninguno de los
     dos.* */
  const agregar = useCallback(async () => {
    setEligiendo(false);
    const r = await abrirAltaDeTarjeta();
    if (!r.ok) mostrar({ texto: t('cuenta.altaNoAbrio'), variante: 'error' });
    await releer();
  }, [mostrar, t, releer]);

  /**
   * Elegir **también RECUERDA** — es la mitad que hace cierta la firma: sin
   * persistir, «salvo que el cliente haya elegido antes» no tendría de dónde
   * saberlo en la próxima compra.
   *
   * 🔴 **La pantalla no espera al guardado ni lo dibuja.** La elección es
   * local e inmediata; recordarla es un efecto. *Bloquear la compra porque una
   * preferencia no se guardó sería castigar a la familia por un lujo nuestro.*
   * Si falla, el cobro sigue con lo elegido y la próxima vez vuelve a preguntar.
   */
  const elegir = useCallback((m: MedioElegido) => {
    setElegido(m);
    setEligiendo(false);
    setVozDefault(null);   // eligió: ya no hay default que explicar
    void guardarMedioPagoPreferido(
      m.tipo === 'deuna' ? { medio: 'deuna' } : { medio: 'tarjeta', tarjetaId: m.id },
    );
  }, []);

  return {
    medios,
    elegido,
    idTarjeta: elegido?.tipo === 'tarjeta' ? elegido.id : null,
    eligiendo,
    vozDefault,
    abrirEleccion: () => setEligiendo(true),
    cerrarEleccion: () => setEligiendo(false),
    elegir,
    agregar,
    releer,
  };
}

/** ② La sección, dentro de su tarjeta. Va en el scroll de la pantalla. */
export function SeccionMedioDePago({ medio }: { medio: MedioDePago }) {
  const { t } = useTraduccion();
  const { medios, elegido } = medio;

  return (
    <>
      <Tarjeta>
        <View style={{ gap: spacing[3] }}>
          <Texto variante="seccion">{t('pago.comoPagas')}</Texto>

          {medios.length === 0 ? (
            <>
              <Texto variante="apoyo">{t('pago.sinMedios')}</Texto>
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.medioAgregar')}
                onPress={() => void medio.agregar()}
              />
            </>
          ) : elegido?.tipo === 'deuna' ? (
            /* La elegida es DeUna: **no hay tarjeta que dibujar** — no tiene
               marca, ni últimos 4, ni alias. Su fila es la suya. */
            <Celda
              titulo={t('pago.deunaFila')}
              interactiva
              accessibilityRole="button"
              onPress={medio.abrirEleccion}
              fin={<Texto variante="dato">{t('pago.medioCambiar')}</Texto>}
            />
          ) : elegido !== null ? (
            /* ③ HAY UNA ELEGIDA: se muestra, **«Cambiar» significa cambiar**, y
               `BotonPagar` está habilitado — *se paga directo, sin entrar a
               ningún lado.* (Corrección del founder, 21-ago.) */
            <FilaMedioDePago
              tarjeta={medios.find((m) => m.id === elegido.id)!}
              zonaFin="cambiar"
              onPress={medio.abrirEleccion}
            />
          ) : (
            /* 🔴 NO HAY ELEGIDA — Y ACÁ NO SE DIBUJA NINGUNA TARJETA.
             *
             * ⏪ **El defecto que esto cura, reportado por el founder en el
             * aparato:** la fila caía a `medios[0]` y mostraba una tarjeta con
             * su alias y sus cuatro dígitos, rematada con «Cambiar ›» — y
             * `Pagar` estaba apagado. *La pantalla afirmaba que había una
             * elegida y el botón decía que no; «Cambiar» prometía cambiar algo
             * que no existía.*
             *
             * 🔴 Y LA CURA OBVIA ERA LA TRAMPA: preseleccionar `medios[0]`
             *    parece lo natural, pero el lector ordena por `creada_en DESC`
             *    ⇒ `medios[0]` **es la más reciente**, que es LITERALMENTE la
             *    regla de andamio que la Fase 5 mató, con el mismo valor.
             *    *Habría vuelto por la puerta de una cura de coherencia.*
             *
             * ⇒ Se cura la MENTIRA, no el paso: la fila deja de fingir y pasa a
             *   invitar. La primera vez se elige una vez; a partir de ahí
             *   «Cambiar» significa cambiar. */
            <Celda
              /* 🔴 UNA SOLA VEZ, y no dos. ⏪ Llevaba título **y** subtítulo
                 diciendo lo mismo —«Elige cómo quieres pagar» arriba en
                 negrita y «Elige con cuál quieres pagar» abajo—: *la misma
                 frase dicha dos veces con distinto peso no enfatiza, hace
                 dudar de si son dos cosas.* (Founder, 21-ago.) */
              titulo={t('pago.elegiMedioTitulo')}
              interactiva
              accessibilityRole="button"
              onPress={medio.abrirEleccion}
              /* 🔴 SIN recuadro de franquicia: **la invitación no es una
                 tarjeta y no se viste de una.** *Un recuadro de marca vacío al
                 lado de «Elige cómo quieres pagar» insinúa que ya hay un medio
                 puesto — el mismo defecto que esta rama vino a curar, un paso
                 más chico.* */
              fin={<Chevron direccion="derecha" />}
            />
          )}

          {/* 🔴 EL DEFAULT NUNCA CAMBIA EN SILENCIO (borde de la firma):
              cuando DeUna no pudo ser el default, la pantalla DICE por qué.
              *Un default que se corre sin avisar convierte una decisión de la
              casa en una sorpresa de la familia.* */}
          {medio.vozDefault !== null ? (
            <Texto variante="apoyo">{medio.vozDefault}</Texto>
          ) : null}
        </View>
      </Tarjeta>

      {/* ④ La hoja: logo a la izquierda, «›» a la derecha. Tocar elige y
          cierra — como venía funcionando. */}
      <Hoja
        visible={medio.eligiendo}
        onCerrar={medio.cerrarEleccion}
        titulo={t('pago.comoPagas')}
      >
        <View style={{ gap: spacing[2] }}>
          {/* 🔴 REGLA 1 DE LA FIRMA (founder, 22-ago): **DeUna es SIEMPRE la
              primera fila, sin condición.**

              ⏪ Nació debajo de las tarjetas con el argumento de que «es un
              medio, no una acción» — cierto, y **insuficiente**: el founder
              firmó el ORDEN, no solo la pertenencia. *La regla vieja decía
              dónde NO va (al lado de «agregar»); ésta dice dónde VA.*

              **Sin condición** quiere decir que **no se mueve cuando no es
              elegible.** Una opción que cambia de lugar según su estado obliga
              a buscarla, y el founder la puso primera para que no haya que
              hacerlo. *Su estado lo dice su propia fila, no su posición.*

              Y por esto la sección se llama «cómo quieres pagar» y no «tus
              tarjetas» (`LETRA_PUERTA_DE_PAGO_S101B` §8bis⑤). */}
          {/* ✅ ENCENDIDA (25-ago). Sin `onPress` la fila vuelve sola a su
              estado de «muy pronto» — el interruptor es uno solo y está en
              `DEUNA_ELEGIBLE`, no repartido en dos lados. */}
          <FilaDeUna
            onPress={DEUNA_ELEGIBLE ? () => medio.elegir({ tipo: 'deuna' }) : undefined}
          />
          {/* El desempate se calcula UNA vez para toda la lista: la fila no
              puede saber que tiene una gemela. */}
          {(() => {
            const desempates = desempatarMedios(medios);
            return medios.map((m) => (
              <FilaMedioDePago
                key={m.id}
                tarjeta={m}
                zonaFin="camino"
                desempate={desempates.get(m.id) ?? null}
                onPress={() => medio.elegir({ tipo: 'tarjeta', id: m.id })}
              />
            ));
          })()}
          <Boton
            variante="secundario"
            etiqueta={t('cuenta.medioAgregar')}
            bloque
            onPress={() => void medio.agregar()}
          />
        </View>
      </Hoja>
    </>
  );
}

/**
 * ① EL BOTÓN DE PAGAR — **el único de la casa**.
 *
 * 🔴 Sale de acá y no de cada pantalla **para que no se pueda dibujar
 *    distinto**. Antes eran dos: uno `bloque` en un pie fijo y otro chico en
 *    medio del scroll. *No hay una razón de producto por la que pagar un paseo
 *    tenga menos presencia que pagar comida.*
 *
 * 🔴 Y el gate de habilitación **vive acá**: sin medio elegido no se puede
 *    tocar, en las dos puertas. *Dejarlo en cada pantalla es cómo una de las
 *    dos termina llamando al cobro sin tarjeta y descubriéndolo por el error
 *    del servidor.*
 */
export function BotonPagar({
  medio, trabajando, deshabilitadoPorLaPantalla = false, onPagar,
}: {
  medio: MedioDePago;
  trabajando: boolean;
  /** El gate propio del oficio (paseo: la dirección del hogar, D-339). */
  deshabilitadoPorLaPantalla?: boolean;
  onPagar: () => void;
}) {
  const { t } = useTraduccion();
  return (
    <Boton
      etiqueta={t('pago.pagar')}
      bloque
      cargando={trabajando}
      /* 🔴 EL GATE PREGUNTA «¿HAY MEDIO ELEGIDO **Y SU PUERTA EXISTE**?» —
         que es literalmente lo que la versión anterior dejó escrito que había
         que hacer *«cuando D entregue la puerta de DeUna»*. Entregó.
         ⏪ Miraba `idTarjeta === null`, y era correcto mientras la única puerta
         viva fuera la de tarjeta: con DeUna elegido el botón habría quedado
         **habilitado sin poder cobrar**. *Un botón que se deja tocar y rebota
         es peor que uno apagado — la persona no sabe si pagó.*
         Hoy `idTarjeta` **subestimaría al revés**: apagaría el botón con DeUna
         elegido, que sí puede pagar. */
      deshabilitado={deshabilitadoPorLaPantalla || !puedePagarCon(medio.elegido)}
      onPress={onPagar}
    />
  );
}
