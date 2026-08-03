/**
 * CUENTA COMERCIAL — el estado del módulo (S54-B, wizard B2.3 sobre
 * MODELO_FINANCIERO §6.5). LA ESCALERA declarada (§4b):
 *   peldaño 0 — sin cuenta: invitación que EDUCA por qué existe ("para
 *     cobrar por la app") y termina en la acción de registro. Hoy solo
 *     alcanzable post-auth-real (todo prestador vivo tiene cuenta por
 *     FK NOT NULL) — el lugar queda hecho.
 *   peldaño 1 — pendiente_validacion: el estado honesto ("en revisión —
 *     el equipo la activa", §7.11: el wizard JAMÁS activa) + la
 *     invitación a completar datos bancarios si faltan (§8.13).
 *   peldaño 2 — activa: la ficha serena; el número de cuenta SIEMPRE
 *     enmascarado (el wrapper no entrega el completo).
 * Dosis baja (test 7): un acento, CTA en tinta, sin gradiente.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Insignia,
  MarcaDeAgua,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerMiCuentaComercial,
  type EstadoCuentaComercial,
  type MiCuentaComercial,
} from '@epetplace/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTraduccion } from '@/i18n';
import { SeccionDesplegable } from '@/components/perfil-piezas';
import { SeccionDocumentos } from '@/components/seccion-documentos';
import { obtenerMiPrestador } from '@epetplace/api';

// S52-P4b sistémico: títulos humanizados — sentence case, sin eyebrow.

export default function CuentaComercial() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [cuenta, setCuenta] = useState<MiCuentaComercial | null | 'cargando' | 'error'>('cargando');
  /** ② S84-C34 — el acordeón de una-a-la-vez, el mismo de "Tu espacio":
   *  abrir una cierra la otra porque es UN valor, no tres banderas. */
  const [abierta, setAbierta] = useState<'fiscal' | 'banco' | 'documentos' | null>(null);
  const alternar = (s: 'fiscal' | 'banco' | 'documentos') =>
    setAbierta((a) => (a === s ? null : s));
  /** El id del prestador, que esta pantalla no leía: lo pide la sección
   *  de documentos. null mientras carga — la sección lo DICE en vez de
   *  montarse contra un id vacío. */
  const [prestadorId, setPrestadorId] = useState<string | null>(null);

  const cargar = useCallback(() => {
    let vigente = true;
    void (async () => {
      const [r, p] = await Promise.all([obtenerMiCuentaComercial(), obtenerMiPrestador()]);
      if (!vigente) return;
      setCuenta(r.ok ? r.data : 'error');
      /* un fallo acá NO tumba la pantalla: las otras dos secciones no
         dependen del prestador, y la de documentos lo dice. */
      setPrestadorId(p.ok && p.data !== null ? p.data.id : null);
    })();
    return () => {
      vigente = false;
    };
  }, []);

  // refetch al volver de bancarios/nueva — el estado no puede quedar viejo
  useFocusEffect(cargar);

  if (cuenta === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo={t('cuenta.titulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="35%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={120} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={100} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (cuenta === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo={t('cuenta.titulo')} atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.error')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.reintentar')}
                onPress={() => {
                  setCuenta('cargando');
                  cargar();
                }}
              />
            }
          />
        </View>
      </View>
    );
  }

  // ── peldaño 0: invitación que educa ──────────────────────────────────
  if (cuenta === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
        <Encabezado variante="navegacion" titulo={t('cuenta.titulo')} atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.invitacionTitulo')}
            descripcion={t('cuenta.invitacionCuerpo')}
            accion={
              <Boton
                variante="primario"
                etiqueta={t('cuenta.invitacionCta')}
                onPress={() => router.push('/cuenta-comercial/nueva')}
              />
            }
          />
        </View>
      </View>
    );
  }

  // ── peldaños 1-2: el estado honesto ──────────────────────────────────
  const insigniaPorEstado: Record<
    EstadoCuentaComercial,
    { estado: 'alDia' | 'atencion' | 'proximo' | 'info'; etiqueta: string; voz: string }
  > = {
    pendiente_validacion: { estado: 'proximo', etiqueta: t('cuenta.estadoEnRevision'), voz: t('cuenta.estadoEnRevisionVoz') },
    activa: { estado: 'alDia', etiqueta: t('cuenta.estadoActiva'), voz: t('cuenta.estadoActivaVoz') },
    suspendida: { estado: 'atencion', etiqueta: t('cuenta.estadoSuspendida'), voz: t('cuenta.estadoSuspendidaVoz') },
    cerrada: { estado: 'info', etiqueta: t('cuenta.estadoCerrada'), voz: t('cuenta.estadoCerradaVoz') },
  };
  const estadoUi = insigniaPorEstado[cuenta.estado];
  const bancarios = cuenta.datosBancarios;
  const puedeEditarBancarios = cuenta.estado === 'pendiente_validacion' || cuenta.estado === 'activa';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('cuenta.titulo')} atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[8], gap: spacing[4] }}>
        {/* el estado preside */}
        <View style={{ gap: spacing[3] }}>
          <View style={{ flexDirection: 'row' }}>
            <Insignia estado={estadoUi.estado} etiqueta={estadoUi.etiqueta} />
          </View>
          <Texto variante="cuerpo" color="secondary">{estadoUi.voz}</Texto>
        </View>

        {/* ⑥ S84-C34 — EL AVISO DE REVISIÓN, VISIBLE SIN DESPLEGAR.
            Es lo que resuelve el muro declarado/verificado de
            `MODELO_PRESENCIA` §4 **con palabras en vez de con jerarquía
            visual**: por eso las tres secciones pueden verse iguales
            entre sí. Si la pantalla dice quién revisa qué, nadie confunde
            lo que declaró con lo que verificamos.

            DICE TRES COSAS Y NINGUNA MÁS: que hay revisión · que la hace
            una persona · y qué habilita.

            ⚠️ LA TERCERA LÍNEA NO ES RELLENO — es §5 de la letra de
            verificación, firmada por el founder el mismo día: **sin
            verificación el prestador OPERA IGUAL**. Lo que la revisión
            habilita es el SELLO, no la operación. Y se AFIRMA ("sigues
            trabajando con normalidad") en vez de negar un freno que
            nombrarlo instalaría.

            ☠️ LÁPIDA: "uno por uno" declara un estado NUESTRO —que la
            revisión es humana y no automática—. Se reescribe el día que
            deje de serlo; hasta entonces es la verdad y por eso se dice. */}
        <Texto variante="apoyo">{t('cuenta.avisoRevision')}</Texto>

        {/* ② LAS TRES HERMANAS, al modo de "Tu espacio": mismo
            componente, mismo peso, y el acordeón de una-a-la-vez que la
            casa ya usa. Se ven IGUALES a propósito — lo que las
            distingue no es la jerarquía visual sino el aviso de arriba. */}
        <SeccionDesplegable
          icono="fiscal"
          titulo={t('cuenta.datosFiscales')}
          resumen={cuenta.identificacionFiscal}
          abierta={abierta === 'fiscal'}
          onAlternar={() => alternar('fiscal')}
        >
          <Celda titulo={t('cuenta.razonSocial')} subtitulo={cuenta.razonSocial} />
          <Separador />
          <Celda titulo={t('cuenta.nombreComercial')} subtitulo={cuenta.nombreComercial} />
          <Separador />
          <Celda titulo={t('cuenta.identificacion')} metadataMono={cuenta.identificacionFiscal} />
        </SeccionDesplegable>

        {/* datos bancarios — §8.13: parcial es legal, la invitación lo dice */}
        <SeccionDesplegable
          icono="bancario"
          titulo={t('cuenta.datosBancarios')}
          resumen={bancarios === null ? t('cuenta.bancariosSinDeclarar') : bancarios.bancoNombre}
          abierta={abierta === 'banco'}
          onAlternar={() => alternar('banco')}
        >
          {bancarios === null ? (
            <View style={{ gap: spacing[3] }}>
              <Texto variante="cuerpo" color="secondary">{t('cuenta.bancariosFaltan')}</Texto>
              <Texto variante="apoyo" color="tertiary">{t('cuenta.bancariosEducacion')}</Texto>
              {puedeEditarBancarios ? (
                <Boton
                  variante="primario"
                  etiqueta={t('cuenta.bancariosCta')}
                  bloque
                  onPress={() => router.push('/cuenta-comercial/bancarios')}
                />
              ) : null}
            </View>
          ) : (
            <View style={{ gap: spacing[3] }}>
              <Celda
                titulo={bancarios.bancoNombre}
                subtitulo={bancarios.tipoCuenta === 'corriente' ? t('cuenta.tipoCorriente') : t('cuenta.tipoAhorros')}
                metadataMono={bancarios.numeroCuentaMascarado}
              />
              <Separador />
              <Celda titulo={t('cuenta.titular')} subtitulo={bancarios.titularNombre} />
              {puedeEditarBancarios ? (
                <Boton
                  variante="acento"
                  etiqueta={t('cuenta.bancariosActualizar')}
                  onPress={() => router.push('/cuenta-comercial/bancarios')}
                />
              ) : null}
            </View>
          )}
        </SeccionDesplegable>

        {/* ③ LA TERCERA — el eje ① de la verificación, que en C33 era
            pantalla suelta. Sin `prestadorId` no se monta y lo DICE: es
            el único dato que esta pantalla no tenía y hay que leer. */}
        <SeccionDesplegable
          icono="documento"
          titulo={t('cuenta.documentos')}
          resumen={prestadorId === null ? t('cuenta.documentosCargando') : t('cuenta.documentosResumen')}
          abierta={abierta === 'documentos'}
          onAlternar={() => alternar('documentos')}
        >
          {prestadorId === null ? (
            <Texto variante="apoyo">{t('cuenta.documentosCargando')}</Texto>
          ) : (
            <SeccionDocumentos prestadorId={prestadorId} tipoFiscal={cuenta.tipoFiscal} />
          )}
        </SeccionDesplegable>
      </ScrollView>
    </View>
  );
}
