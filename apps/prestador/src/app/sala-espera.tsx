/**
 * S79-B (T3-B3): LA SALA DE ESPERA — donde aterriza el prestador con
 * estado 'pendiente': autenticado, FUERA del portal (decisión founder).
 *
 * CONDICIÓN DE ALCANCE (mesa, en piedra): es EL PERFIL DE LA SEDE EN
 * OTRO MARCO — mismos campos, misma pieza (`SeccionSede`), distinto
 * encabezado. No es página institucional: es un marco. La voz del
 * encabezado REUSA la del landing aprobado (bienvenida.titular /
 * bienvenida.subtitulo — cero string de composición nueva ahí).
 *
 * DOS bloques propios, nada más:
 *  · QUÉ FALTA DE TU PARTE, con camino: dirección · radio (la sección
 *    de abajo ES el camino — la fila lo dice) · cuenta comercial ·
 *    título si sos vet (navegables).
 *  · QUÉ PASA DESPUÉS: revisión humana y te avisamos — sin prometer
 *    plazos que no controlamos.
 *
 * LA REGLA DURA vive en el guard raíz: el pendiente NO entra al portal
 * (la carta §2.3 espera al primer ingreso REAL — fase 4, no fase 1).
 * Checks patrón D-521: señal positiva verificada; fallo de lectura →
 * sin check, jamás un falso estado.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Insignia,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  cerrarSesion,
  obtenerDocumentosVerificacion,
  obtenerMiCuentaComercial,
  obtenerMiPrestador,
  type MiPrestador,
} from '@epetplace/api';

import { leerSede, type SedeLeida } from '@/lib/sede';
import { SeccionSede } from '@/components/seccion-sede';
import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | {
      estado: 'listo';
      prestador: MiPrestador;
      sede: SedeLeida;
      /** null = no verificado (lectura caída) — sin check. */
      cuentaOk: boolean | null;
      /** null = no aplica (no-vet) o no verificado. */
      tituloOk: boolean | null;
      esVet: boolean;
    };

export default function SalaEspera() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [saliendo, setSaliendo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const p = await obtenerMiPrestador();
        if (!vigente) return;
        if (!p.ok) {
          // sin prestador legible no hay sala: el guard raíz re-decide
          router.replace('/(tabs)');
          return;
        }
        const esVet = p.data.tipo === 'clinica_veterinaria';
        const [cuentaR, docsR] = await Promise.all([
          obtenerMiCuentaComercial(),
          esVet ? obtenerDocumentosVerificacion(p.data.id) : Promise.resolve(null),
        ]);
        if (!vigente) return;
        const cuentaOk = cuentaR.ok ? cuentaR.data !== null : null;
        const tituloOk = !esVet
          ? null
          : docsR !== null && docsR.ok
            ? docsR.data.some(
                (d) => d.tipo === 'titulo_profesional' && (d.estado === 'pendiente' || d.estado === 'aprobado'),
              )
            : null;
        setPantalla({
          estado: 'listo',
          prestador: p.data,
          sede: leerSede(p.data),
          cuentaOk,
          tituloOk,
          esVet,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [router]),
  );

  if (pantalla.estado === 'cargando') {
    return <View style={{ flex: 1, backgroundColor: theme.bg.base }} />;
  }

  const { sede, cuentaOk, tituloOk, esVet } = pantalla;

  const check = (ok: boolean | null) =>
    ok === true ? <Insignia capa="vida" soloPunto etiqueta={t('preparaEspacio.checkHecho')} /> : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing[8],
          paddingBottom: insets.bottom + spacing[8],
          paddingHorizontal: spacing[5],
          gap: spacing[6],
        }}
      >
        {/* el marco: la voz del landing, reusada tal cual (aprobada) */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="titulo">{t('bienvenida.titular')}</Texto>
          <Texto variante="apoyo">{t('bienvenida.subtitulo')}</Texto>
          <Texto variante="cuerpo">{t('salaEspera.marco')}</Texto>
        </View>

        {/* ── QUÉ FALTA DE TU PARTE ── */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('salaEspera.faltaTitulo')}</Texto>
          <Tarjeta elevacion="reposo" relleno="ninguno">
            <Celda
              titulo={t('salaEspera.faltaDireccion')}
              subtitulo={t('salaEspera.faltaAcaAbajo')}
              fin={check(sede.direccion !== null && sede.direccion.length > 0)}
            />
            <Separador />
            <Celda
              titulo={t('salaEspera.faltaRadio')}
              subtitulo={t('salaEspera.faltaAcaAbajo')}
              fin={check(sede.radioKm !== null)}
            />
            <Separador />
            <CeldaNavegacion
              icono="negocio"
              registro="aa"
              titulo={t('salaEspera.faltaCuenta')}
              detalle={cuentaOk === true ? t('preparaEspacio.checkHecho') : t('salaEspera.faltaCuentaDetalle')}
              onPress={() => router.push('/cuenta-comercial')}
            />
            {esVet && (
              <>
                <Separador />
                <CeldaNavegacion
                  icono="veterinaria"
                  registro="aa"
                  titulo={t('salaEspera.faltaTitulo1')}
                  detalle={tituloOk === true ? t('preparaEspacio.checkHecho') : t('salaEspera.faltaTituloDetalle')}
                  onPress={() => router.push('/veterinaria/verificacion')}
                />
              </>
            )}
          </Tarjeta>
        </View>

        {/* ── mismos campos, misma pieza: la sede ── */}
        <SeccionSede sede={sede} />

        {/* ── QUÉ PASA DESPUÉS ── */}
        <View style={{ gap: spacing[2] }}>
          <Texto variante="seccion">{t('salaEspera.despuesTitulo')}</Texto>
          <Texto variante="cuerpo">{t('salaEspera.despuesCuerpo')}</Texto>
        </View>

        <Boton
          variante="secundario"
          etiqueta={t('sesion.cerrarSesion')}
          bloque
          cargando={saliendo}
          onPress={() => {
            if (saliendo) return;
            setSaliendo(true);
            void cerrarSesion().then(() => {
              setSaliendo(false);
              router.replace('/login');
            });
          }}
        />
      </ScrollView>
    </View>
  );
}
