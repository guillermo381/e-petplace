/**
 * TU GUARDERÍA — LA PORTADA del mundo (S107-C, tanda 9).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **AL ENTRAR SE VE LO QUE HAY, JAMÁS EL FORMULARIO.** Firma del founder
 * tras caminar el gate: *«como los otros servicios — una vez configurada, al
 * entrar se ven las opciones ANTES de editar»*.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **El patrón NO se inventó: es el de `grooming/index.tsx`, que a su vez
 * heredó el del paseo** — *«el estándar del paseo HEREDADO»*, dice su propia
 * cabecera. Sin configurar → un vacío con su camino. Configurada → **el
 * resumen con el estado de visibilidad que dice la VERDAD del motor** (7.13),
 * y recién debajo el botón de editar.
 *
 * *Entrar directo al formulario le dice al prestador que su trabajo anterior
 * no existe: cada visita empieza de cero aunque no lo haya perdido.*
 *
 * ── ⚠️ TENSIÓN CON §15b, ACEPTADA POR FIRMA PARA S107 ───────────────────
 * *«Tu día»* es de **HOY** (`DISEÑO_EXPERIENCIA` §15b: *HOY acciona / NEGOCIO
 * gestiona*), y vive acá. **El founder lo aceptó para S107 con ficha**: la
 * migración a HOY es su propia tanda, **después del acta**. *Queda escrito
 * para que nadie lo lea como un descuido.*
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaFranja,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerCupoGuarderia,
  obtenerFranjasGuarderia,
  obtenerMiPrestador,
  obtenerOfertaGuarderiaPropia,
  type FranjaGuarderia,
  type OfertaGuarderiaPropia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { useGateGestor } from '@/lib/gate-gestor';
import { GateAjeno } from '@/components/gate-ajeno';
import { GateRoto } from '@/components/gate-roto';

const aHoraCorta = (h: string) => h.slice(0, 5);

function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'roto' }
  | {
      fase: 'listo';
      /** null = todavía no configuró NADA. No es error: es el camino de alta.
       *  ✏️ S107-A (cruce declarado): el tipo local se reemplaza por el del
       *  wrapper. **`precio` ahora puede ser null** —el día dejó de ser
       *  obligatorio— y el shape trae `especies`. *Un tipo local que copia al
       *  del wrapper se separa de él el día que el wrapper cambia, y el
       *  compilador no puede avisar porque los dos son válidos.* */
      oferta: OfertaGuarderiaPropia | null;
      franjas: FranjaGuarderia[];
      capacidadHoy: number;
    };

export default function MundoGuarderia() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { gate, reintentarGate } = useGateGestor();

  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);

  /* `useFocusEffect` y no `useEffect`: se vuelve del taller y **el resumen
     tiene que reflejar lo recién guardado**. Es el patrón de los otros
     mundos, y su razón es exactamente ésta. */
  useFocusEffect(
    useCallback(() => {
      if (gate !== 'permitido') return;
      let vigente = true;
      setEstado({ fase: 'cargando' });
      void (async () => {
        const p = await obtenerMiPrestador();
        if (!vigente) return;
        if (!p.ok || p.data === null) {
          setEstado({ fase: 'roto' });
          return;
        }
        const [oferta, franjas, cupo] = await Promise.all([
          obtenerOfertaGuarderiaPropia(p.data.id),
          obtenerFranjasGuarderia(p.data.id),
          obtenerCupoGuarderia(p.data.id, hoyLocal(), hoyLocal()),
        ]);
        if (!vigente) return;
        /* Un fallo NO se disfraza de «todavía no configuraste» (Ley 13): eso
           mandaría al prestador a re-configurar algo que ya está guardado. */
        if (!oferta.ok || !franjas.ok || !cupo.ok) {
          setEstado({ fase: 'roto' });
          return;
        }
        setEstado({
          fase: 'listo',
          oferta: oferta.data,
          franjas: franjas.data,
          capacidadHoy: cupo.data[0]?.capacidad ?? 0,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [gate, intento]),
  );

  const alTaller = useCallback(() => router.push('/guarderia/taller'), [router]);

  if (gate === 'verificando' || estado.fase === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('mundoGuarderia.titulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={96} />
            <Esqueleto alto={56} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }
  if (gate === 'denegado') return <GateAjeno />;
  if (gate === 'roto') return <GateRoto onReintentar={reintentarGate} />;
  if (estado.fase === 'roto') return <GateRoto onReintentar={() => setIntento((n) => n + 1)} />;

  const recogida = estado.franjas.find((f) => f.tipo === 'recogida');
  const devolucion = estado.franjas.find((f) => f.tipo === 'devolucion');
  const sinConfigurar = estado.oferta === null && recogida === undefined && estado.capacidadHoy === 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('mundoGuarderia.titulo')} atras onAtras={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[5], paddingBottom: insets.bottom + spacing[8] }}>
        {sinConfigurar ? (
          /* El vacío con su camino — patrón de los otros mundos. */
          <EstadoVacio
            registro="seccion"
            titulo={t('mundoGuarderia.sinConfigurarTitulo')}
            descripcion={t('mundoGuarderia.sinConfigurarDetalle')}
            accion={<Boton etiqueta={t('mundoGuarderia.configurar')} onPress={alTaller} />}
          />
        ) : (
          <>
            {/* EL RESUMEN — lo que el prestador ya tiene, antes de cualquier
                formulario. El estado de visibilidad dice la VERDAD del motor. */}
            <Tarjeta relleno="normal" elevacion="reposo">
              <View style={{ gap: spacing[2] }}>
                <Texto variante="seccion">
                  {estado.oferta?.activo === true
                    ? t('mundoGuarderia.visibleTitulo')
                    : t('mundoGuarderia.noVisibleTitulo')}
                </Texto>
                {estado.oferta !== null ? (
                  <>
                    {/* ✏️ S107-A (cruce declarado): el precio del día puede no
                        existir — el día dejó de ser obligatorio. **Sin él la
                        línea NO se pinta**: escribir «$0.00» diría GRATIS, que
                        es lo contrario de «no ofrece esta modalidad». */}
                    {estado.oferta.precio !== null ? (
                      <Texto variante="cuerpo">
                        {t('mundoGuarderia.resumenPrecio', { precio: estado.oferta.precio.toFixed(2) })}
                      </Texto>
                    ) : null}
                    <Texto variante="apoyo">
                      {t('mundoGuarderia.resumenJornada', {
                        horas: (estado.oferta.jornadaMinutos / 60).toFixed(1),
                      })}
                    </Texto>
                  </>
                ) : (
                  /* Configuró algo pero no publicó: se dice QUÉ falta, no
                     «no visible» a secas. */
                  <Texto variante="apoyo">{t('mundoGuarderia.faltaPublicar')}</Texto>
                )}
                <Texto variante="apoyo">
                  {t('mundoGuarderia.resumenCupo', { n: estado.capacidadHoy })}
                </Texto>
              </View>
            </Tarjeta>

            {recogida !== undefined ? (
              <FichaFranja
                recogida={{ rotulo: t('tallerGuarderia.recogida'), desde: aHoraCorta(recogida.desde), hasta: aHoraCorta(recogida.hasta) }}
                devolucion={
                  devolucion === undefined
                    ? undefined
                    : { rotulo: t('tallerGuarderia.devolucion'), desde: aHoraCorta(devolucion.desde), hasta: aHoraCorta(devolucion.hasta) }
                }
                conSuperficie
              />
            ) : null}

            <Boton variante="primario" etiqueta={t('mundoGuarderia.editar')} bloque onPress={alTaller} />
          </>
        )}

        {/* «Tu día» vive acá por firma del founder — ver la cabecera. */}
        <Tarjeta relleno="ninguno">
          <CeldaNavegacion
            icono="guarderia"
            titulo={t('mundoGuarderia.tuDia')}
            detalle={t('mundoGuarderia.tuDiaDetalle')}
            onPress={() => router.push('/guarderia/dia')}
          />
        </Tarjeta>
      </ScrollView>
    </View>
  );
}
