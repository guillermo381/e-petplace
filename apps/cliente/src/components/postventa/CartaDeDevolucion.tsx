/**
 * S114-C · LA ELECCIÓN DE LA PLATA — §4 de `DIRECCION_POSTVENTA`.
 *
 * TESIS (Ley 14): *me muestran dos caminos parejos y elijo yo.*
 *
 * FIRMA (Ley 15): **las dos tarjetas del mismo tamaño y ninguna
 * preseleccionada.** La pieza de B lo hace inexpresable —una sola receta,
 * `stretch`, cero rama por destino, `elegido` sin default—, así que acá no hay
 * forma de romperlo aunque uno quiera.
 *
 * ── 🔴 EL SALDO REBOTA HOY, Y LA TARJETA NO SE ESCONDE ──────────────────
 * `elegirDestinoDevolucion('saldo')` devuelve `saldo_todavia_no_existe`: el
 * motor del saldo es A4 y todavía no está. **A prefirió que rebote hablando
 * antes que aceptar una elección y no hacer nada** —*una elección guardada sin
 * efecto es peor que un rebote*— y tiene razón.
 *
 * ⇒ **la tarjeta va con su razón, no oculta.** §4 pide las dos parejas, y
 * esconder una convierte «todavía no está» en «no existe»: la familia elegiría
 * banco creyendo que es la única opción, que es exactamente el default oscuro
 * que la letra prohíbe. *El rebote se muestra como lo que es —un estado del
 * motor— y no como un error de la familia.*
 *
 * **Cuando A4 aterrice no cambia una línea de acá:** el motor deja de rebotar
 * y el mismo código lo aplica.
 *
 * ── EL MONTO SE DICE ANTES DE ELEGIR (§4) ───────────────────────────────
 * En una línea sobre las tarjetas, y **con su porqué cuando es parcial**. La
 * pieza lo recibe redactado: componerlo adentro obligaría a la pieza a saber
 * de comisiones.
 *
 * ── LO QUE NO SE PROMETE ────────────────────────────────────────────────
 * Si el camino es manual, la voz lo dice **sin fecha** (§4). `manual` viene
 * del SERVIDOR —depende de la ventana del riel y la pantalla no puede
 * saberlo—; si lo dedujéramos acá, prometeríamos una fecha que el motor no
 * cumple.
 */

import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Esqueleto,
  TarjetaDestinoPlata,
  Texto,
  spacing,
  type DestinoPlata,
} from '@epetplace/ui';
import { elegirDestinoDevolucion, leerOpcionesDeDevolucion } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Opciones = {
  monto: number;
  parcial: boolean;
  banco: { disponible: boolean; manual: boolean };
  saldo: { disponible: boolean; nota?: string };
};

export function CartaDeDevolucion({
  casoId,
  onElegido,
}: {
  casoId: string;
  onElegido: () => void;
}) {
  const { t } = useTraduccion();
  const [opciones, setOpciones] = useState<Opciones | null | 'error'>(null);
  /* 🔴 SIN DEFAULT: el arranque es `null`. La pieza lo exige y la letra
     también — cero preselección. */
  const [elegido, setElegido] = useState<DestinoPlata | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [rebote, setRebote] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await leerOpcionesDeDevolucion(casoId);
      if (!vigente) return;
      setOpciones(r.ok ? r.data : 'error');
    })();
    return () => {
      vigente = false;
    };
  }, [casoId]);

  const confirmar = useCallback(async () => {
    if (elegido === null) return;
    setEnviando(true);
    setRebote(null);
    const r = await elegirDestinoDevolucion(casoId, elegido);
    setEnviando(false);

    if (r.ok) {
      /* §4: «después, la carta del hilo se convierte en el hecho». El hecho lo
         escribe el motor; acá sólo se recarga para que aparezca. */
      onElegido();
      return;
    }
    /* 🔴 El rebote del saldo **dice que es del motor**, no de la familia. */
    setRebote(
      r.codigo === 'saldo_todavia_no_existe'
        ? t('postventa.saldoTodaviaNo')
        : r.codigo === 'ya_elegido'
          ? t('postventa.yaElegiste')
          : t('postventa.devolucionNoSePudo'),
    );
  }, [casoId, elegido, onElegido, t]);

  if (opciones === null) return <Esqueleto alto={140} />;
  if (opciones === 'error') return <Texto variante="apoyo">{t('postventa.devolucionNoSePudo')}</Texto>;

  const monto = opciones.monto.toFixed(2);

  return (
    <View style={{ gap: spacing[3] }}>
      {/* §4 · EL MONTO ANTES DE ELEGIR, con su porqué si es parcial. */}
      <Texto variante="cuerpo">
        {opciones.parcial
          ? t('postventa.montoParcial', { monto })
          : t('postventa.montoTotal', { monto })}
      </Texto>

      <TarjetaDestinoPlata
        banco={{
          titulo: t('postventa.bancoTitulo'),
          voz: t('postventa.bancoVoz'),
          /* Manual ⇒ **jamás una fecha**. Lo decide el servidor. */
          tiempo: opciones.banco.manual ? t('postventa.bancoTiempoManual') : t('postventa.bancoTiempo'),
        }}
        saldo={{
          titulo: t('postventa.saldoTitulo'),
          voz: t('postventa.saldoVoz'),
          /* Su tiempo dice la verdad de HOY: todavía no está disponible. La
             rapidez del saldo se informa, jamás se usa para esconder el banco. */
          tiempo: opciones.saldo.disponible ? t('postventa.saldoTiempo') : t('postventa.saldoTodaviaNoCorto'),
        }}
        elegido={elegido}
        onElegir={(d) => {
          setElegido(d);
          setRebote(null);
        }}
        vozMonto={
          opciones.parcial
            ? t('postventa.montoParcial', { monto })
            : t('postventa.montoTotal', { monto })
        }
        acento="control"
      />

      {rebote !== null && (
        <Texto variante="apoyo" color="danger">
          {rebote}
        </Texto>
      )}

      {/* §4: «elegir es un acto, y se confirma una vez». */}
      {elegido !== null && (
        <Boton
          etiqueta={t('postventa.confirmarDevolucion')}
          bloque
          cargando={enviando}
          onPress={() => void confirmar()}
        />
      )}
    </View>
  );
}
