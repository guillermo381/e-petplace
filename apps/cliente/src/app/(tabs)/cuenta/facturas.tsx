/**
 * Cuenta · TUS FACTURAS (S115-C · ④ del mandato; MODELO_ECONOMICO v1.1).
 *
 * **TESIS (Ley 14):** *la familia puede quedarse con el papel de lo que
 * compró, sin pedírselo a nadie.*
 *
 * **FIRMA (Ley 15):** la `TarjetaFactura` de B con su guijarro — la lista no
 * es un registro contable, es una pila de papeles que te pertenecen. No suma
 * acento: el guijarro es ilustración (§4 de `DIRECCION_ARTE`).
 *
 * **CHANEL (Ley 16):** se quitó el total por fila. `DocumentoFiscalMio` lo
 * trae y la tentación era pintarlo — pero el número ya vive DENTRO del PDF, y
 * arriba de él en el historial de Pagos. *Dos veces el mismo dato es Chanel
 * directa*, y acá la fila responde «¿puedo bajarla?», no «¿cuánto fue?».
 *
 * ───────────────────────────────────────────────────────────────────────
 * 🔴 **DOS ESTADOS DE `A` QUE LA PIEZA DE `B` NO EXPRESA — y por qué no se
 * disfrazan.** `estadoVisible` tiene CINCO valores; `TarjetaFactura` acepta
 * cuatro y son otros. `preparando`, `lista` y `con_problema` mapean; y quedan:
 *
 *   · `faltan_tus_datos` — **es ACCIONABLE**: el documento espera la cédula o
 *     el RUC de la familia. Mapearlo a `preparando` diría «esperá tranquilo»
 *     sobre algo que está esperando A LA PERSONA, y nadie iría nunca a darlo.
 *   · `anulada` — un hecho terminal que ninguno de los cuatro nombra.
 *
 * Los dos se dicen **en voz propia sobre una `Celda`**, que es la fila de
 * lista canónica. *No es una segunda anatomía por gusto: es la diferencia
 * entre decir la verdad y elegir el estado que menos se note.* El ensanche de
 * la pieza está pedido a B en el buzón; cuando llegue, esta rama muere y las
 * cinco viven en `TarjetaFactura` (Ley 37).
 *
 * ⚠️ **Medido antes de construir: `documentos_fiscales` tiene CERO filas.** Lo
 * único que esta pantalla puede mostrar hoy es su vacío digno — el peldaño 0 de
 * su escalera. Las tres ramas con datos están escritas y **no verificadas
 * contra dato real**; se declara en vez de darlas por buenas.
 *
 * **Escalera (§4b):** peldaño 0 = el vacío que dice dónde van a vivir · 1 = las
 * filas con su descarga · 2 = la densidad llega con facturas reales, no con
 * versión.
 */
import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Tarjeta,
  TarjetaFactura,
  useAviso,
  useTheme,
  spacing,
  type EstadoFactura,
} from '@epetplace/ui';
import {
  fiscalMisDocumentos,
  fiscalUrlFirmada,
  type DocumentoFiscalMio,
  type EstadoVisibleFiscal,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** El mapeo, EXHAUSTIVO por tipo: si A agrega un estado, el tsc lo exige acá.
 *  `null` = la pieza de B no lo expresa todavía (ver la cabecera). */
const ESTADO_TARJETA: Record<EstadoVisibleFiscal, EstadoFactura | null> = {
  preparando: 'preparando',
  lista: 'lista',
  con_problema: 'corrigiendo',
  faltan_tus_datos: null,
  anulada: null,
};

type Carga = 'cargando' | 'error' | DocumentoFiscalMio[];

export default function FacturasScreen() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const [docs, setDocs] = useState<Carga>('cargando');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const r = await fiscalMisDocumentos();
      if (!vigente) return;
      setDocs(r.ok ? r.data : 'error');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  /* La URL se pide AL TOCAR, jamás al pintar la lista: vence a los 300 s, así
     que una firmada al montar ya estaría muerta cuando alguien la usa. */
  const descargar = useCallback(
    async (id: string, formato: 'ride' | 'xml') => {
      const r = await fiscalUrlFirmada(id, formato);
      if (!r.ok) {
        mostrar({ variante: 'error', texto: t('facturas.errorDescarga') });
        return;
      }
      await Linking.openURL(r.data);
    },
    [mostrar, t],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('facturas.titulo')} atras onAtras={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: insets.bottom + spacing[6],
          gap: spacing[4],
        }}
      >
        {docs === 'cargando' ? (
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
            </View>
          </EsqueletoGrupo>
        ) : docs === 'error' ? (
          <EstadoVacio
            titulo={t('facturas.errorTitulo')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('facturas.reintentar')}
                onPress={() => {
                  setDocs('cargando');
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        ) : docs.length === 0 ? (
          <EstadoVacio titulo={t('facturas.vacioTitulo')} descripcion={t('facturas.vacio')} />
        ) : (
          <>
            {docs.map((d) => {
              /* La nota de crédito manda sobre el estado: es OTRO papel, no un
                 estado de la factura (la pieza cambia su guijarro por eso). */
              const estado = d.tipo === 'nota_credito' ? 'notaCredito' : ESTADO_TARJETA[d.estadoVisible];

              if (estado === null) {
                return (
                  <Tarjeta key={d.id} relleno="ninguno">
                    <Celda
                      titulo={t(
                        d.estadoVisible === 'faltan_tus_datos' ? 'facturas.faltanTusDatos' : 'facturas.anulada',
                      )}
                      metadataMono={d.numero ?? undefined}
                    />
                  </Tarjeta>
                );
              }

              return (
                <TarjetaFactura
                  key={d.id}
                  estado={estado}
                  numero={d.numero ?? undefined}
                  monto={d.tipo === 'nota_credito' ? d.total : undefined}
                  /* Las acciones existen SOLO si el archivo existe: la pieza
                     oculta el botón cuando el handler falta, así que un XML
                     ausente no ofrece un botón que iba a fallar (Ley 23). */
                  onDescargarPdf={d.tieneRide ? () => descargar(d.id, 'ride') : undefined}
                  onDescargarXml={d.tieneXml ? () => descargar(d.id, 'xml') : undefined}
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
