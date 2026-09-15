/**
 * PAQUETE — ELEGIR PASEADOR Y COMPRAR (S57, enmienda v1.4 §6bis.2bis:
 * COMPRAR NO ES RESERVAR — esta pantalla no sabe de fechas ni horas).
 * Entra desde el chip del CUÁNDO (con la duración elegida) y desde el
 * hub "Mis paseos" (renovación: llega filtrada al ancla del paquete).
 *
 * CAPA DE CRAFT (Leyes 14-16, declaradas):
 *  · TESIS: "Comprás salidas por adelantado con un paseador real —
 *    sin agendar nada todavía."
 *  · FIRMA: la invitación post-compra ("¿Reservás tu primera salida?")
 *    — comportamiento con consecuencia visible: la compra no te suelta
 *    en un vacío, te ofrece el paso natural sin obligarte.
 *  · CHANEL: la pantalla NO repite la ventana del CUÁNDO (no hay
 *    fecha/hora que mostrar — se quitó la Celda de contexto que el
 *    QUIÉN sí lleva) ni muestra el precio suelto en la lista: un dato
 *    por fila, el que importa acá (precio por salida en paquete).
 *
 * ESCALERA (§4b): peldaño 0 = nadie ofrece paquetes para esa duración
 * (voz honesta con camino, §6ter); peldaño 1 = ofertas reales; peldaño
 * 2 = datos del expediente: NINGUNO (compra pura, explícito).
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Celda,
  Cabecera,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Icono,
  Separador,
  Tarjeta,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerPaseadoresConPaquete,
  type PaseadorConPaquete,
} from '@epetplace/api';
import { PaqueteHoja } from '@/components/paquete-hoja';
import { useTraduccion } from '@/i18n';

export default function PaqueteComprar() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ duracion?: string; servicio?: string }>();
  const duracion = typeof params.duracion === 'string' ? Number(params.duracion) : undefined;
  const servicioId = typeof params.servicio === 'string' ? params.servicio : undefined;

  const [lista, setLista] = useState<PaseadorConPaquete[] | 'cargando' | 'error'>('cargando');
  const [elegido, setElegido] = useState<PaseadorConPaquete | null>(null);
  /* ☠️ **`comprado` MURIÓ CON SU HOJA — ver la lápida más abajo.** Su estado
     era el disparo de una pantalla que ya no podía abrirse, y las dos
     condiciones que lo leían (`comprado === null`) eran **siempre verdaderas**:
     *un guard que no puede dar falso no es un guard, es ruido con forma de
     cuidado.* */

  const cargar = useCallback(() => {
    setLista('cargando');
    void obtenerPaseadoresConPaquete({
      duracion_minutos: duracion,
      prestador_servicio_id: servicioId,
    }).then((r) => setLista(r.ok ? r.data : 'error'));
  }, [duracion, servicioId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Cabecera variante="empujada" titulo={t('paquete.pantallaTitulo')} onVolver={() => router.back()}  etiquetaVolver={t('comun.volver')} />
      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + spacing[8], gap: spacing[3] }}>
        {lista === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        ) : lista === 'error' ? (
          <EstadoVacio
            titulo={t('explorar.paseadoresError')}
            accion={<Boton variante="secundario" etiqueta={t('hogar.reintentar')} onPress={cargar} />}
          />
        ) : lista.length === 0 ? (
          // Peldaño 0 (§6ter): jamás final mudo — vuelta al CUÁNDO.
          <EstadoVacio
            icono={<Icono nombre="paseo" tamano={48} />}
            titulo={t('paquete.nadieOfrece')}
            descripcion={t('paquete.nadieOfreceDetalle')}
            accion={<Boton variante="primario" etiqueta={t('explorar.probarOtroHorario')} onPress={() => router.back()} />}
          />
        ) : (
          <Tarjeta relleno="ninguno">
            {lista.map((p, i) => (
              <View key={p.prestador_servicio_id}>
                {i > 0 ? <Separador /> : null}
                <Celda
                  titulo={p.prestador_nombre}
                  subtitulo={p.servicio_nombre}
                  metadataMono={`$${p.precio_paquete.toFixed(2)} · ${p.duracion_minutos} min`}
                  interactiva
                  accessibilityRole="button"
                  onPress={() => setElegido(p)}
                />
              </View>
            ))}
          </Tarjeta>
        )}
      </ScrollView>

      {/* La compra — anclada al paseador ELEGIDO, sin mascota ni fecha */}
      <Hoja
        visible={elegido !== null}
        titulo={t('paquete.hojaTitulo')}
        onCerrar={() => setElegido(null)}
        conCerrar
      >
        {elegido !== null ? (
          <PaqueteHoja
            paseador={elegido}
            /* ⭐ S109-C · La Hoja cierra y el pago vive en su propia pantalla.
               ☠️ Con esto muere la segunda Hoja de abajo —la invitación a la
               primera salida—: su disparo era `comprado`, que ya no existe.
               *Su contenido no se perdió: vive en el éxito del checkout, que es
               el único lugar donde ahora se sabe que la compra terminó.* */
            onIrAPagar={(preset) => {
              const p = elegido;
              setElegido(null);
              router.push({
                pathname: '/explorar/paseo/checkout-paquete',
                params: {
                  prestadorId: p.prestador_id,
                  prestadorServicioId: p.prestador_servicio_id,
                  prestadorNombre: p.prestador_nombre,
                  preset: String(preset),
                  precioPaquete: String(p.precio_paquete),
                  duracion: String(p.duracion_minutos),
                },
              });
            }}
          />
        ) : null}
      </Hoja>

      {/* ☠️ **S116-C lote 13 · LA SEGUNDA HOJA MURIÓ, Y LA MATÓ EL CENSO.**

          Acá vivía la invitación a la primera reserva. **Nunca se abría.**
          Medido: `setComprado` se llama **cuatro veces y las cuatro con `null`**
          ⇒ `comprado` no puede dejar de ser `null`, así que `visible` es
          siempre `false`. *No es código que dejó de usarse: es código que ya
          no puede ejecutarse.*

          🔴 **Y su propia muerte estaba escrita en el archivo que la reemplazó:**
          `checkout-paquete.tsx` dice que la invitación *«es la misma que estaba
          en la segunda Hoja de `paquete.tsx`, mudada al único lugar donde ahora
          se sabe que la compra terminó — dejarla allá la habría dejado esperando
          un evento que ya no ocurre»*. **Se mudó y no se borró.** El texto
          predijo exactamente lo que quedó, y sobrevivió igual.

          ⚠️ **Apareció censando superficies de confirmación**, no leyendo este
          archivo: era la única de la lista que **no se podía convertir**, y
          preguntarse por qué fue lo que la encontró. *La invitación viva es la
          de `checkout-paquete`, que en este mismo lote pasó a `Confirmacion`.* */}
    </SafeAreaView>
  );
}
