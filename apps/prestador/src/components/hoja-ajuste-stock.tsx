/**
 * LA HOJA DEL AJUSTE DE STOCK — extraída de `/ventas/stock` cuando esa
 * pantalla murió (② de la cola, S99-C).
 *
 * ── POR QUÉ ES UNA PIEZA Y NO UNA PANTALLA ───────────────────────────────
 * **El ajuste no es un lugar: es un acto sobre un producto.** Vivía en una
 * lista propia que repetía la vitrina con otras columnas, y eso obligaba
 * al vendedor a elegir *dónde* mirar su producto antes de poder tocarlo.
 * Ahora vive **donde vive el producto** — mismo movimiento que la
 * capacidad, que dejó de ser sección de configuración para vivir en la
 * ficha del repartidor. *Una casa por cosa.*
 *
 * ── LO QUE NO CAMBIÓ, Y ES LO QUE HABÍA QUE NO PERDER ────────────────────
 * · **El motivo es campo de primera clase**: sin motivo el botón no se
 *   enciende. *El inventario es plata y todo movimiento deja su porqué.*
 * · **Se pregunta QUÉ PASÓ, no un número con signo** — nadie piensa en
 *   deltas negativos mientras cuenta bolsas. El signo lo pone la pieza.
 * · **El CTA vive en el pie, fuera del scroll**, con la línea de ayuda
 *   arriba: un botón apagado tiene que decir QUÉ FALTA a la vista
 *   (medido en aparato en S99-C — «Guardar el ajuste» quedaba abajo del
 *   pliegue y había que scrollear para ver la acción de la Hoja).
 * · **El código de SKU queda como dato de máquina**, no como título: es
 *   la referencia del vendedor, no el nombre de la cosa.
 */

import { useState } from 'react';
import { View } from 'react-native';
import {
  Boton,
  Campo,
  Hoja,
  HojaScroll,
  SelectorOpcion,
  Texto,
  spacing,
  useAviso,
} from '@epetplace/ui';
import { ajustarStockVendedor, type SkuDelVendedor } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface HojaAjusteStockProps {
  /** `null` = la Hoja no se monta. El dueño de la ficha decide cuándo. */
  sku: SkuDelVendedor | null;
  onCerrar: () => void;
  /** Se llama SOLO tras un guardado exitoso — quien la monta re-lee. */
  onGuardado: () => void;
}

export function HojaAjusteStock({ sku, onCerrar, onGuardado }: HojaAjusteStockProps) {
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [direccion, setDireccion] = useState<'entraron' | 'salieron' | null>(null);
  const [cantidadTexto, setCantidadTexto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cantidad = Number(cantidadTexto);
  const cantidadValida = Number.isInteger(cantidad) && cantidad > 0;
  const listoParaGuardar = direccion !== null && cantidadValida && motivo.trim().length > 0;

  function limpiar() {
    setDireccion(null);
    setCantidadTexto('');
    setMotivo('');
  }

  async function guardar() {
    if (guardando || sku === null || direccion === null || !listoParaGuardar) return;
    setGuardando(true);
    /* El motor recibe un DELTA sobre el ledger (`inventario_movimientos`;
       el saldo lo materializa un trigger): positivo entra, negativo sale,
       cero rebota. La pantalla pregunta en humano y traduce acá. */
    const delta = direccion === 'entraron' ? cantidad : -cantidad;
    const r = await ajustarStockVendedor(sku.sku_id, delta, motivo);
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('ventas.stock.exito'), variante: 'exito' });
    limpiar();
    onGuardado();
  }

  return (
    <Hoja
      visible={sku !== null}
      onCerrar={() => {
        if (guardando) return;
        limpiar();
        onCerrar();
      }}
      titulo={t('ventas.stock.ajusteTitulo')}
      altura="media"
      pie={
        <>
          <Texto variante="apoyo">{t('ventas.stock.motivoAyuda')}</Texto>
          <Boton
            variante="primario"
            bloque
            cargando={guardando}
            deshabilitado={!listoParaGuardar}
            etiqueta={t('ventas.stock.guardarCta')}
            onPress={() => void guardar()}
          />
        </>
      }
    >
      <HojaScroll>
        <View style={{ gap: spacing[4], paddingBottom: spacing[2] }}>
          {sku !== null && <Texto variante="dato">{sku.sku_vendedor}</Texto>}
          <SelectorOpcion
            acento="oficio"
            etiqueta={t('ventas.stock.direccion')}
            opciones={[
              { codigo: 'entraron', etiqueta: t('ventas.stock.entraron') },
              { codigo: 'salieron', etiqueta: t('ventas.stock.salieron') },
            ]}
            seleccionada={direccion ?? undefined}
            onSelect={(codigo) => setDireccion(codigo === 'entraron' ? 'entraron' : 'salieron')}
          />
          <Campo
            label={t('ventas.stock.cantidad')}
            value={cantidadTexto}
            onChangeText={setCantidadTexto}
            keyboardType="number-pad"
            deshabilitado={guardando}
          />
          <Campo
            label={t('ventas.stock.motivo')}
            value={motivo}
            onChangeText={setMotivo}
            deshabilitado={guardando}
          />
        </View>
      </HojaScroll>
    </Hoja>
  );
}
