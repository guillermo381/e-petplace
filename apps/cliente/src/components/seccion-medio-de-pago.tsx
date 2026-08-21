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
import { listarTarjetasGuardadas, type TarjetaGuardada } from '@epetplace/api';
import { FilaMedioDePago } from '@/components/fila-medio-de-pago';
import { LogoFranquicia } from '@/components/logo-franquicia';
import { abrirAltaDeTarjeta } from '@/lib/pagos/alta-tarjeta';
import { useTraduccion } from '@/i18n';

export type MedioDePago = {
  medios: TarjetaGuardada[];
  elegido: string | null;
  eligiendo: boolean;
  abrirEleccion: () => void;
  cerrarEleccion: () => void;
  elegir: (id: string) => void;
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
  const [elegido, setElegido] = useState<string | null>(null);
  const [eligiendo, setEligiendo] = useState(false);

  const releer = useCallback(async () => {
    const r = await listarTarjetasGuardadas();
    if (!r.ok) return;
    setMedios(r.data);
    /* 🔴 Preselección **solo cuando hay UNA**: con una sola tarjeta preguntar
       es fricción sin decisión. Con dos o más **no se elige por la familia** —
       ése era el andamio que la Fase 5 vino a matar. */
    setElegido((prev) => prev ?? (r.data.length === 1 ? r.data[0].id : null));
  }, []);

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

  return {
    medios, elegido, eligiendo,
    abrirEleccion: () => setEligiendo(true),
    cerrarEleccion: () => setEligiendo(false),
    elegir: (id: string) => { setElegido(id); setEligiendo(false); },
    agregar, releer,
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
          ) : elegido !== null ? (
            /* ③ HAY UNA ELEGIDA: se muestra, **«Cambiar» significa cambiar**, y
               `BotonPagar` está habilitado — *se paga directo, sin entrar a
               ningún lado.* (Corrección del founder, 21-ago.) */
            <FilaMedioDePago
              tarjeta={medios.find((m) => m.id === elegido)!}
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
              titulo={t('pago.elegiMedioTitulo')}
              subtitulo={t('pago.elegiMedio')}
              interactiva
              accessibilityRole="button"
              onPress={medio.abrirEleccion}
              inicio={<LogoFranquicia marca={null} />}
              fin={<Chevron direccion="derecha" />}
            />
          )}
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
          {medios.map((m) => (
            <FilaMedioDePago
              key={m.id}
              tarjeta={m}
              zonaFin="camino"
              onPress={() => medio.elegir(m.id)}
            />
          ))}
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
      deshabilitado={deshabilitadoPorLaPantalla || medio.elegido === null}
      onPress={onPagar}
    />
  );
}
