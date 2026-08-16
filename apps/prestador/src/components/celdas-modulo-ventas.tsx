/**
 * CELDAS DEL MÓDULO DE VENTAS — el grupo de accesos, en un solo lugar.
 *
 * POR QUÉ NACE (S99-C, 15-ago): el mismo grupo vivía DOS VECES —en la raíz
 * `/ventas` y en el HOY del vendedor puro— y esa duplicación no es de
 * estilo: **es la que hace que agregar una pantalla al módulo se olvide en
 * una de las dos**. Es la hermana de `ventana-pedidos`, por el mismo
 * motivo y con la misma forma.
 *
 * Y tiene un segundo efecto medido: N3 pone techo de 3 separadores por
 * PANTALLA, y el HOY del prestador es la pantalla más cargada de la app.
 * Con el grupo inline se pasaba del techo — no por descuido de
 * composición, sino porque una lista densa de accesos es exactamente el
 * caso que N3 exceptúa, montada dentro de una pantalla que ya tenía lo
 * suyo. **Al extraerla, cada archivo vuelve a responder por lo que
 * compone él.** *La regla no se esquivó: se le dio la razón.*
 *
 * CONTRATO — sin fetch adentro (patrón de `ventana-pedidos`): quien la
 * monta trae el dato. `tieneEntregas` es del llamador porque su lector
 * (`misEntregasAsignadas`) viaja en la ola de carga de cada pantalla, y
 * meterlo acá agregaría un viaje por montaje.
 *
 * LA CELDA DE REPARTO SE OFRECE SOLO SI HAY ENVÍO (Ley 23: la puerta no
 * ofrece lo que va a rechazar). Su ausencia por duda es ausencia: el
 * llamador resuelve `ok && length > 0`, jamás «no pude leer» = «sí hay».
 */

import { CeldaNavegacion, Separador, Tarjeta } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** Las cuatro pantallas del módulo. Tipado cerrado: una ruta nueva no se
 *  cuela como string — se agrega acá y el consumidor la ve. */
export type RutaModuloVentas =
  | '/ventas/stock'
  | '/ventas/mostrador'
  | '/ventas/entregas'
  | '/ventas/configuracion';

export interface CeldasModuloVentasProps {
  /** La persona además reparte y tiene envío asignado hoy (§9.1). */
  tieneEntregas: boolean;
  onIr: (ruta: RutaModuloVentas) => void;
}

export function CeldasModuloVentas({ tieneEntregas, onIr }: CeldasModuloVentasProps) {
  const { t } = useTraduccion();

  return (
    <Tarjeta relleno="ninguno">
      <CeldaNavegacion
        registro="tinta"
        titulo={t('ventas.hoy.stock')}
        onPress={() => onIr('/ventas/stock')}
      />
      <Separador />
      <CeldaNavegacion
        registro="tinta"
        titulo={t('ventas.hoy.mostrador')}
        onPress={() => onIr('/ventas/mostrador')}
      />
      {tieneEntregas && (
        <>
          <Separador />
          <CeldaNavegacion
            registro="tinta"
            titulo={t('ventas.hoy.entregas')}
            detalle={t('ventas.hoy.entregasDetalle')}
            onPress={() => onIr('/ventas/entregas')}
          />
        </>
      )}
      <Separador />
      <CeldaNavegacion
        registro="tinta"
        titulo={t('ventas.hoy.configuracion')}
        onPress={() => onIr('/ventas/configuracion')}
      />
    </Tarjeta>
  );
}
