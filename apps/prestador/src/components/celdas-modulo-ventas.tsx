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

import { View } from "react-native";
import {
  CeldaNavegacion,
  Separador,
  Tarjeta,
  Texto,
  spacing,
} from "@epetplace/ui";

import { useTraduccion } from "@/i18n";

/** Las pantallas del módulo. Tipado cerrado: una ruta nueva no se
 *  cuela como string — se agrega acá y el consumidor la ve. */
export type RutaModuloVentas =
  | "/ventas/vitrina"
  | "/ventas/stock"
  | "/ventas/mostrador"
  | "/ventas/entregas"
  | "/ventas/configuracion";

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
    /* 🔴 DOS GRUPOS Y NO UNA LISTA DE CINCO — lo pidió N3 al quinto ítem, y
       al obedecerla la pantalla mejoró: con cinco celdas seguidas el menú
       no dice qué es qué. **La vitrina es LA CARA** (lo que la familia ve)
       y el resto es **el trabajo de adentro**; separarlos con aire y título
       es lo que la regla manda, y de paso vuelve el menú legible.
       *El trinquete no pedía menos líneas: pedía jerarquía.* */
    <View style={{ gap: spacing[5] }}>
      <Tarjeta relleno="ninguno">
        <CeldaNavegacion
          registro="tinta"
          titulo={t("ventas.hoy.vitrina")}
          detalle={t("ventas.hoy.vitrinaDetalle")}
          onPress={() => onIr("/ventas/vitrina")}
        />
      </Tarjeta>

      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">{t("ventas.hoy.grupoTrabajo")}</Texto>
        <Tarjeta relleno="ninguno">
          <CeldaNavegacion
            registro="tinta"
            titulo={t("ventas.hoy.stock")}
            onPress={() => onIr("/ventas/stock")}
          />
          <Separador />
          <CeldaNavegacion
            registro="tinta"
            titulo={t("ventas.hoy.mostrador")}
            onPress={() => onIr("/ventas/mostrador")}
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
          <Separador />
          <CeldaNavegacion
            registro="tinta"
            titulo={t("ventas.hoy.configuracion")}
            onPress={() => onIr("/ventas/configuracion")}
          />
        </Tarjeta>
      </View>
    </View>
  );
}
