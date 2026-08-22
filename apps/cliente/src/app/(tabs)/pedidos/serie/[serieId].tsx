/**
 * S103-C · **LA SERIE RECURRENTE, BAJO «TUS PEDIDOS»** — su casa.
 *
 * Vive acá y no bajo `/despensa` por la misma firma que trajo el detalle del
 * pedido a este stack (S100c): *«Pedidos es una CASA, no una pantalla colgada
 * de la tienda»* — **y porque es literalmente donde la app prometió que
 * estaría.** *«Lo manejas desde Tus pedidos»* era una promesa con dirección, y
 * ésta es la dirección.
 *
 * ═══ 🔴 ESTADO REAL DE ESTA PANTALLA — leelo antes de tocarla ══════════════
 *
 * **Está construida y todavía NO es alcanzable, y las dos mitades son
 * deliberadas:**
 *
 * · **El CORTE es real.** `alternarRecurrencia` existe y se llama de verdad —
 *   la mitad que el motor sí puede sostener funciona hoy.
 * · **La LECTURA no existe.** Medido el 22-ago: `packages/api` no exporta
 *   ningún lector de series, y `pedidos_recurrencias` no tiene consumidores
 *   fuera del alta. `cargarSerie` es el **enchufe pendiente con nombre** que
 *   `PLAN_MESA_104` §1 ordena dejar marcado.
 *
 * 🔴 **Y POR ESO NO SE AGREGÓ LA ENTRADA EN `pedidos/index`.** *Una fila que
 * lleva a una pantalla que no puede leer nada es un callejón con nombre
 * bonito* — exactamente el defecto que esta tanda vino a curar, servido de
 * nuevo un piso más adentro. **La entrada nace con el lector, en la misma
 * línea.** Hasta entonces la ruta es alcanzable a mano (y así se gatea).
 *
 * *Nota de honestidad: hoy la población de `pedidos_recurrencias` es CERO
 * (censo de A), así que no hay ninguna familia sin su pantalla — no se le está
 * escondiendo nada a nadie mientras esto dure.*
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Encabezado, Esqueleto, EsqueletoGrupo, EstadoVacio, spacing, useAviso, useTheme,
} from '@epetplace/ui';
import { alternarRecurrencia } from '@epetplace/api';

import { SerieRecurrenteVista } from '@/components/serie-recurrente';
import type { SerieRecurrente } from '@/lib/serie/contrato';
import { useTraduccion } from '@/i18n';

/**
 * 🔴 EL ENCHUFE PENDIENTE — pedido a la pista A.
 *
 * Devuelve `null` mientras el lector no exista. **No se improvisa una lectura
 * directa a la tabla**: `packages/api` es la puerta única de la casa y es
 * territorio de A. *Escribir un `supabase.from('pedidos_recurrencias')` acá
 * sería saltarse la puerta para llegar tres días antes, y esa deuda la paga
 * otro.*
 */
async function cargarSerie(_serieId: string): Promise<SerieRecurrente | null> {
  return null;
}

export default function SerieDePedidos() {
  const { serieId } = useLocalSearchParams<{ serieId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [serie, setSerie] = useState<SerieRecurrente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const s = await cargarSerie(serieId);
      if (!vivo) return;
      setSerie(s);
      setCargando(false);
    })();
    return () => { vivo = false; };
  }, [serieId]);

  const cancelar = useCallback(async () => {
    if (cancelando) return;
    setCancelando(true);
    const r = await alternarRecurrencia(serieId, false);
    setCancelando(false);
    if (!r.ok) {
      /* El fallo dice que es fallo — jamás se dibuja como éxito ni se
         disfraza de vacío (Ley 13). */
      mostrar({ texto: t('serie.errorCancelar'), variante: 'error' });
      return;
    }
    mostrar({ texto: t('serie.cancelada'), variante: 'exito' });
    router.back();
  }, [cancelando, serieId, mostrar, t, router]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('serie.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[6],
          gap: spacing[4],
        }}
      >
        {cargando ? (
          /* N16: `Esqueleto` en toda lectura — el spinner está muerto. */
          <EsqueletoGrupo>
            <Esqueleto forma="bloque" alto={96} />
            <Esqueleto forma="bloque" alto={128} />
          </EsqueletoGrupo>
        ) : serie === null ? (
          /* 🔴 El vacío **no se dibuja como «no tienes envíos automáticos»**:
             eso sería una afirmación sobre los datos, y lo que pasa es que
             todavía no sabemos leerlos. *Un «no tenés nada» falso es peor que
             un vacío: cierra la pregunta con la respuesta equivocada.* */
          <EstadoVacio
            registro="pantalla"
            titulo={t('serie.titulo')}
            descripcion={t('serie.medioDesconocido')}
          />
        ) : (
          <SerieRecurrenteVista
            serie={serie}
            onCancelar={() => void cancelar()}
            cancelando={cancelando}
          />
        )}
      </ScrollView>
    </View>
  );
}
