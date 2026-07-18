/**
 * TU CONSULTORIO — la portada/RESUMEN del mundo Veterinaria (S68-B, P4).
 * Espejo del estándar de portadas (paseo → grooming → adiestramiento).
 *
 * TESIS: "De un vistazo sabes qué ofreces, a qué precio, y qué falta
 * para abrir."
 * FIRMA: la verificación profesional como ESTADO arriba — dice la
 * verdad del camino a abrir sin bloquear nada de lo demás (bloquea
 * ABRIR, jamás construir).
 * CHANEL: sin espejo del dueño (el componente espejo del oficio no
 * existe — resto declarado) y sin fila de zonas.
 *
 * Fila por servicio ACTIVADO: glifo + nombre + resumen breve + lápiz
 * que ancla a ESA sección del taller (?item=). Urgencias y telemedicina
 * usan el glifo del OFICIO hasta que exista glifo propio (D-433 del
 * pedido S68 — stand-in declarado, sin mentir). Procedimientos como
 * grupo; verificación como estado arriba.
 */

import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  MENU_VETERINARIA,
  obtenerDocumentosVerificacion,
  obtenerMiPrestador,
  obtenerMundoVeterinariaPropio,
  type DocumentoVerificacion,
  type ItemMenuVeterinaria,
  type MundoVeterinariaPropio,
  type OfertaVeterinariaPropia,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Pantalla =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | {
      estado: 'listo';
      mundo: MundoVeterinariaPropio;
      documentos: DocumentoVerificacion[];
    };

// espejo de baseDeItem del taller (las urgencias se distinguen por
// modalidad; la especializada aún no persiste — CONECTAR-A)
function baseDeItem(item: ItemMenuVeterinaria, servicios: OfertaVeterinariaPropia[]): OfertaVeterinariaPropia | null {
  switch (item) {
    case 'cita_regular':
      return servicios.find((s) => s.tipoServicio === 'consulta_general') ?? null;
    case 'vacunacion':
      return servicios.find((s) => s.tipoServicio === 'vacunacion') ?? null;
    case 'telemedicina':
      return servicios.find((s) => s.tipoServicio === 'telemedicina') ?? null;
    case 'urgencia_local':
      return servicios.find((s) => s.tipoServicio === 'urgencia_local') ?? null;
    case 'urgencia_domicilio':
      return servicios.find((s) => s.tipoServicio === 'urgencia_domicilio') ?? null;
    case 'cita_especializada':
      return null;
  }
}

export default function PortadaVeterinaria() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();

  const [pantalla, setPantalla] = useState<Pantalla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        const [rMundo, rDocs] = await Promise.all([
          obtenerMundoVeterinariaPropio(prestador.data.id),
          obtenerDocumentosVerificacion(prestador.data.id),
        ]);
        if (!vigente) return;
        if (!rMundo.ok) {
          setPantalla({ estado: 'error' });
          return;
        }
        setPantalla({
          estado: 'listo',
          mundo: rMundo.data,
          // los documentos degradan a vacío (la portada no se cae por la
          // verificación — bloquea abrir, jamás leer)
          documentos: rDocs.ok ? rDocs.data : [],
        });
      })();
      return () => {
        vigente = false;
      };
    }, [intento]),
  );

  const vozItem = (i: ItemMenuVeterinaria): string =>
    ({
      cita_regular: t('tallerVeterinaria.itemCitaRegular'),
      vacunacion: t('tallerVeterinaria.itemVacunacion'),
      cita_especializada: t('tallerVeterinaria.itemEspecializada'),
      urgencia_local: t('tallerVeterinaria.itemUrgenciaLocal'),
      urgencia_domicilio: t('tallerVeterinaria.itemUrgenciaDomicilio'),
      telemedicina: t('tallerVeterinaria.itemTelemedicina'),
    })[i];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('veterinaria.titulo')} atras onAtras={() => router.back()} />

      {pantalla.estado === 'cargando' && (
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="55%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={80} />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={200} />
          </EsqueletoGrupo>
        </View>
      )}

      {pantalla.estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('ofertaPaseo.error')}
            descripcion={t('ofertaPaseo.errorDetalle')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('ofertaPaseo.reintentar')}
                onPress={() => {
                  setPantalla({ estado: 'cargando' });
                  setIntento((n) => n + 1);
                }}
              />
            }
          />
        </View>
      )}

      {pantalla.estado === 'listo' && (() => {
        const { mundo, documentos } = pantalla;
        const nadaGuardado = mundo.servicios.length === 0 && mundo.procedimientos.length === 0;

        // la verificación: el documento MÁS RECIENTE por tipo manda
        const docDe = (tipo: DocumentoVerificacion['tipo']) => documentos.find((d) => d.tipo === tipo) ?? null;
        const titulo = docDe('titulo_profesional');
        const registro = docDe('registro_senescyt');
        const verificado = titulo?.estado === 'aprobado' && registro?.estado === 'aprobado';
        const enRevision = titulo?.estado === 'pendiente' || registro?.estado === 'pendiente';
        const vozVerificacion = verificado
          ? t('veterinaria.verificadoVoz')
          : enRevision
            ? t('verificacionVet.enRevision')
            : t('veterinaria.verificacionInvita');

        if (nadaGuardado) {
          // peldaño 0 — la invitación que educa; la verificación queda
          // alcanzable también desde acá (no bloquea construir)
          return (
            <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5], gap: spacing[5] }}>
              <EstadoVacio
                titulo={t('veterinaria.vacioTitulo')}
                descripcion={t('veterinaria.vacioCuerpo')}
                accion={
                  <Boton
                    variante="primario"
                    etiqueta={t('veterinaria.vacioCta')}
                    onPress={() => router.push({ pathname: '/veterinaria/taller', params: { modo: 'wizard' } })}
                  />
                }
              />
              <Tarjeta relleno="ninguno">
                <CeldaNavegacion
                  icono="veterinaria"
                  registro="aa"
                  titulo={t('verificacionVet.titulo')}
                  detalle={vozVerificacion}
                  onPress={() => router.push('/veterinaria/verificacion')}
                />
              </Tarjeta>
            </View>
          );
        }

        const activos = MENU_VETERINARIA.flatMap((i) => {
          const base = baseDeItem(i, mundo.servicios);
          return base !== null && base.activo ? [{ item: i, base }] : [];
        });

        return (
          <ScrollView
            contentContainerStyle={{
              padding: spacing[4],
              paddingBottom: spacing[10] + insets.bottom,
              gap: spacing[6],
            }}
          >
            {/* LA VERIFICACIÓN — el estado arriba (la firma): dice el
                camino a abrir; todo lo demás sigue editable */}
            <Tarjeta>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginTop: 5,
                    backgroundColor: verificado ? theme.status.success : theme.status.warning,
                  }}
                />
                <View style={{ flex: 1, gap: spacing[1] }}>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.medium,
                      fontSize: typography.size.base,
                      color: theme.text.primary,
                    }}
                  >
                    {verificado ? t('veterinaria.verificadoTitulo') : t('verificacionVet.titulo')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      lineHeight: typography.size.sm * typography.leading.normal,
                      color: theme.text.secondary,
                    }}
                  >
                    {vozVerificacion}
                  </Text>
                  {!verificado && (
                    <View style={{ alignSelf: 'flex-start', marginTop: spacing[2] }}>
                      <Boton
                        variante="compacto"
                        etiqueta={t('veterinaria.verificacionCta')}
                        onPress={() => router.push('/veterinaria/verificacion')}
                      />
                    </View>
                  )}
                </View>
              </View>
            </Tarjeta>

            {/* la entrada al taller: CTA primario (patrón de portadas) */}
            <Boton
              variante="primario"
              etiqueta={t('veterinaria.editarOferta')}
              bloque
              onPress={() => router.push('/veterinaria/taller')}
            />

            {/* fila por servicio ACTIVADO — el lápiz ancla a ESA tarjeta
                del taller (?item=). Glifo del OFICIO como stand-in para
                urgencias/telemedicina hasta D-433 (declarado). */}
            <View style={{ gap: spacing[3] }}>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.md,
                  color: theme.text.primary,
                }}
              >
                {t('veterinaria.serviciosTitulo')}
              </Text>
              {activos.length === 0 ? (
                <Tarjeta>
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      lineHeight: typography.size.sm * typography.leading.normal,
                      color: theme.text.secondary,
                    }}
                  >
                    {t('veterinaria.sinServicios')}
                  </Text>
                </Tarjeta>
              ) : (
                <Tarjeta relleno="ninguno">
                  {activos.map(({ item, base }, idx) => (
                    <View key={item}>
                      {idx > 0 && <Separador />}
                      <CeldaNavegacion
                        icono="veterinaria"
                        registro="aa"
                        titulo={vozItem(item)}
                        detalle={t('veterinaria.resumenServicio', {
                          precio: `$${base.precio.toFixed(2)}`,
                          min: base.duracionMinutos ?? 0,
                        })}
                        onPress={() =>
                          router.push({ pathname: '/veterinaria/taller', params: { seccion: 'servicios', item } })
                        }
                      />
                    </View>
                  ))}
                </Tarjeta>
              )}
            </View>

            {/* procedimientos — el grupo */}
            <View style={{ gap: spacing[3] }}>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.md,
                  color: theme.text.primary,
                }}
              >
                {t('procedimientosVet.titulo')}
              </Text>
              <Tarjeta relleno="ninguno">
                {mundo.procedimientos.map((p) => (
                  <View key={p.id}>
                    <Celda titulo={p.nombre} metadataMono={`$${p.precio.toFixed(2)}`} />
                    <Separador />
                  </View>
                ))}
                <CeldaNavegacion
                  icono="veterinaria"
                  registro="aa"
                  titulo={t('veterinaria.procedimientosAdministrar')}
                  detalle={
                    mundo.procedimientos.length === 0
                      ? t('veterinaria.procedimientosVacio')
                      : t('procedimientosVet.intro')
                  }
                  onPress={() => router.push('/veterinaria/procedimientos')}
                />
              </Tarjeta>
            </View>

            {/* horarios — la fila al taller (sección compartida) */}
            <Tarjeta relleno="ninguno">
              <CeldaNavegacion
                icono="hoy"
                registro="aa"
                titulo={t('taller.horariosTitulo')}
                detalle={t('veterinaria.horariosDetalle')}
                onPress={() => router.push({ pathname: '/veterinaria/taller', params: { seccion: 'horarios' } })}
              />
            </Tarjeta>
          </ScrollView>
        );
      })()}
    </View>
  );
}
