/**
 * @override-s82c — EL CONTENIDO DEL DESPLIEGUE DE UNA FILA DE LOG, UNA
 * SOLA VEZ.
 *
 * POR QUÉ EXISTE (gate del founder, S82 r41): el founder eligió el
 * despliegue de ESTÉTICA como estándar —**PRESTADOR Y COSTO**— y los
 * cuatro logs tienen que decir lo mismo. Hoy cada uno arma el suyo:
 * grooming muestra prestador + total + "ver completo", adiestramiento
 * solo "ver completo", veterinaria nada, paseo total + duración.
 *
 * Es LA MISMA CLASE que el corte de agenda de r39: cuatro copias de una
 * regla, y ya divergieron una vez. Por eso se extrae ANTES de curarlas
 * de a una — curar cuatro copias deja cuatro copias.
 *
 * ⚠️ LO QUE NO INVENTA (L-139): si el costo no existe, NO se dibuja un
 * número. La fila dice lo que SABE. En veterinaria el precio puede no
 * existir hasta que haya presupuesto, y ahí la voz honesta del oficio
 * —"el precio de cada consulta lo pone su veterinaria"— dice más que un
 * "$ 0,00" que sería mentira con formato de dato.
 *
 * 🔴 LO QUE UN LECTOR NO TRAE, DECLARADO Y NO RELLENADO: **`CitaPaseoDueno`
 * NO tiene `prestador_nombre`** — es el único de los cuatro que no lo
 * trae (medido: grooming, adiestramiento y vet sí). Tiene `prestador_id`,
 * que es un uuid y no una voz. Así que el log de paseo pasa `prestador`
 * en null y esta pieza simplemente no dibuja esa fila: el estándar se
 * cumple en tres de cuatro y el cuarto ESPERA SU DATO, con su pedido
 * declarado. Resolverlo desde la pantalla —un viaje más para traducir un
 * uuid a nombre por fila— sería pagar en red lo que se arregla con un
 * campo en el lector.
 */

import { View } from 'react-native';
import { Boton, FilaDato, Separador, Texto, spacing } from '@epetplace/ui';

export function DetalleCita({
  prestador,
  costo,
  etiquetaPrestador,
  etiquetaCosto,
  vozSinCosto,
  accion,
}: {
  /** El nombre del negocio. null = el lector no lo trae (se declara arriba). */
  prestador: string | null;
  /** El monto real. null = todavía NO EXISTE — jamás se dibuja un 0. */
  costo: number | null;
  etiquetaPrestador: string;
  etiquetaCosto: string;
  /** Qué decir cuando el costo no existe. Sin voz, no se dice nada:
   *  el silencio es mejor que un número inventado. */
  vozSinCosto?: string;
  /** El camino al detalle completo, si la cita lo tiene. */
  accion?: { etiqueta: string; onPress: () => void };
}) {
  return (
    <View style={{ paddingHorizontal: spacing[3], paddingBottom: spacing[3], gap: spacing[2] }}>
      <Separador />
      {prestador !== null ? (
        <FilaDato disposicion="horizontal" etiqueta={etiquetaPrestador} valor={prestador} />
      ) : null}
      {costo !== null ? (
        <FilaDato disposicion="horizontal" etiqueta={etiquetaCosto} valor={`$ ${costo.toFixed(2)}`} mono />
      ) : vozSinCosto !== undefined ? (
        <Texto variante="apoyo">{vozSinCosto}</Texto>
      ) : null}
      {accion !== undefined ? (
        <Boton variante="compacto" tamaño="sm" etiqueta={accion.etiqueta} onPress={accion.onPress} />
      ) : null}
    </View>
  );
}
