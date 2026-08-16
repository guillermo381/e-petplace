/**
 * CELDAS DEL MÓDULO DE VENTAS — el grupo de accesos, en un solo lugar.
 *
 * POR QUÉ NACE (S99-C, 15-ago): el mismo grupo vivía DOS VECES —en la raíz
 * `/ventas` y en el HOY del vendedor puro— y esa duplicación no es de
 * estilo: **es la que hace que agregar una pantalla al módulo se olvide en
 * una de las dos**. Es la hermana de `ventana-pedidos`, por el mismo
 * motivo y con la misma forma.
 *
 * CONTRATO — sin fetch adentro (patrón de `ventana-pedidos`): quien la
 * monta trae el dato. `tieneEntregas` es del llamador porque su lector
 * (`misEntregasAsignadas`) viaja en la ola de carga de cada pantalla, y
 * meterlo acá agregaría un viaje por montaje.
 *
 * LA CELDA DE REPARTO SE OFRECE SOLO SI HAY ENVÍO (Ley 23: la puerta no
 * ofrece lo que va a rechazar). Su ausencia por duda es ausencia: el
 * llamador resuelve `ok && length > 0`, jamás «no pude leer» = «sí hay».
 *
 * ── ☠️ S99-C · DE CINCO CELDAS A DOS, POR FIRMA DEL FOUNDER (16-ago) ─────
 * · **«Tu vitrina» + «Configuración» → «TU TIENDA»**, una sola pantalla con
 *   dos secciones. *La razón es suya y queda escrita para que no se
 *   re-discuta: la vitrina es donde el vendedor trabaja TODOS LOS DÍAS,
 *   configuración es donde entra de vez en cuando — y **NEGOCIO y
 *   Configuración empezarían a decir lo mismo**.*
 * · **«Venta de mostrador» SALE**: ya vive en ATENDER como capacidad, y su
 *   perilla («Atiendo en mi local») vive dentro de Tu tienda. *Una función
 *   con dos puertas envejece por la que nadie mira.*
 * · **☠️ `/ventas/stock` murió antes** (② de S99-C): era una segunda lista
 *   de los mismos productos; el ajuste vive en la ficha y el número, en la
 *   fila de Administrar.
 *
 * ⇒ **queda una lista de dos**, y el agrupamiento con título que N3 había
 * pedido al quinto ítem **se retira porque su causa desapareció**: con dos
 * celdas un encabezado de grupo es un rótulo para nadie. *Una jerarquía
 * que sobrevive a las cosas que ordenaba es ruido con buena intención.*
 */

import { View } from "react-native";
import { CeldaNavegacion, Separador, Tarjeta, spacing } from "@epetplace/ui";

import { useTraduccion } from "@/i18n";

/** Las pantallas del módulo. Tipado cerrado: una ruta nueva no se
 *  cuela como string — se agrega acá y el consumidor la ve. */
export type RutaModuloVentas = "/ventas/tienda" | "/ventas/entregas";

export interface CeldasModuloVentasProps {
  /** La persona además reparte y tiene envío asignado hoy (§9.1). */
  tieneEntregas: boolean;
  onIr: (ruta: RutaModuloVentas) => void;
}

export function CeldasModuloVentas({
  tieneEntregas,
  onIr,
}: CeldasModuloVentasProps) {
  const { t } = useTraduccion();

  return (
    <View style={{ gap: spacing[5] }}>
      <Tarjeta relleno="ninguno">
        <CeldaNavegacion
          registro="tinta"
          titulo={t("ventas.tienda.titulo")}
          detalle={t("ventas.hoy.vitrinaDetalle")}
          onPress={() => onIr("/ventas/tienda")}
        />
        {tieneEntregas && (
          <>
            <Separador />
            <CeldaNavegacion
              registro="tinta"
              titulo={t("ventas.hoy.entregas")}
              detalle={t("ventas.hoy.entregasDetalle")}
              onPress={() => onIr("/ventas/entregas")}
            />
          </>
        )}
      </Tarjeta>
    </View>
  );
}
