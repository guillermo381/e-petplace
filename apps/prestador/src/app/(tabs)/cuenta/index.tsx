/**
 * CUENTA del prestador — el índice (S57-B, letra P17 firmada; header
 * CD S61-B12/D-370, pulgar founder sobre el mock B8 traducido a la
 * casa). Mapa: header del oficio con la identidad · Tu perfil ·
 * Preferencias · Sesión y cuenta (P17 §4 intacto).
 *
 * TESIS: "este es TU negocio en e-PetPlace — quién eres para las
 * familias y qué está en marcha, de un vistazo."
 * FIRMA: la identidad sobre el MURO del oficio — avatar squircle 32%
 * (A10) + el trío de datos REALES en la banda de vidrio (variante
 * prestador-nuevo: hitos de preparación; JAMÁS ceros — sin hitos, la
 * banda no existe).
 * CHANEL: el Encabezado portada MURIÓ (la navegación es 'cuenta' en
 * mono + el engranaje en vidrio → Preferencias); el badge fundador es
 * PILL DE VIDRIO con texto papel — la Insignia de papel no pasa AA
 * sobre el muro (regla S61: sobre el muro el acento funcional es
 * PAPEL). El programa del badge = D-398.
 */

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  CeldaNavegacion,
  Hoja,
  Icono,
  Separador,
  Tarjeta,
  palette,
  radius,
  spacing,
  typography,
  useTheme,
} from '@epetplace/ui';
import {
  cerrarSesion,
  obtenerFranjasHorario,
  obtenerMiPrestador,
  obtenerOfertasGroomingPropias,
  obtenerOfertasPaseoPropias,
} from '@epetplace/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CURVA_OFICIO,
  VIDRIO_OFICIO,
  VeloBarraEstadoOficio,
  useBarraEstadoClara,
  useMuroOficio,
} from '@/components/techo-oficio';
import { useTraduccion } from '@/i18n';

// squircle A10: radio proporcional 32% (la constante canónica vive en
// AvatarMascota para mascotas; el avatar del NEGOCIO compone acá)
const LADO_AVATAR = 84;
const RADIO_SQUIRCLE = Math.round(LADO_AVATAR * 0.32);

type Identidad = {
  nombre: string;
  ciudad: string | null;
  oficio: 'ambos' | 'paseo' | 'grooming' | null;
  hitos: string[];
};

function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
    >
      {texto}
    </Text>
  );
}

export default function Cuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const muro = useMuroOficio();
  useBarraEstadoClara();

  const [salirAbierta, setSalirAbierta] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [eliminarAbierta, setEliminarAbierta] = useState(false);
  // la identidad del header CD (S61-B12): datos REALES o nada
  const [identidad, setIdentidad] = useState<Identidad | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente || !prestador.ok) return;
        const [rPaseo, rGrooming, rFranjas] = await Promise.all([
          obtenerOfertasPaseoPropias(prestador.data.id),
          obtenerOfertasGroomingPropias(prestador.data.id),
          obtenerFranjasHorario(prestador.data.id),
        ]);
        if (!vigente) return;
        const paseoActivo = rPaseo.ok && rPaseo.data.some((o) => o.activo);
        const groomingActivo = rGrooming.ok && rGrooming.data.some((o) => o.activo);
        const diasActivos = rFranjas.ok
          ? new Set(rFranjas.data.filter((f) => f.activo).map((f) => f.diaSemana)).size
          : 0;
        const domicilio = rGrooming.ok && rGrooming.data.some((o) => o.activo && o.atiendeDomicilio);
        // el trío: SOLO datos reales — sin nada, la banda no existe
        const hitos: string[] = [];
        if (paseoActivo || groomingActivo) hitos.push(t('miCuenta.hitoOferta'));
        if (diasActivos > 0) hitos.push(t('miCuenta.hitoAgenda', { n: diasActivos }));
        if (domicilio) hitos.push(t('miCuenta.hitoDomicilio'));
        setIdentidad({
          nombre: prestador.data.nombre_comercial,
          ciudad: prestador.data.ciudad,
          oficio:
            paseoActivo && groomingActivo ? 'ambos' : paseoActivo ? 'paseo' : groomingActivo ? 'grooming' : null,
          hitos,
        });
      })();
      return () => {
        vigente = false;
      };
    }, [t]),
  );

  const vozOficio =
    identidad?.oficio === 'ambos'
      ? t('miCuenta.oficioAmbos')
      : identidad?.oficio === 'paseo'
        ? t('miCuenta.oficioPaseos')
        : identidad?.oficio === 'grooming'
          ? t('miCuenta.oficioEstetica')
          : null;

  // S58 (D-361 levantado): cada entrada con su ícono b′ del registry —
  // el perfil comparte la chapita 'cuenta' (decisión del lote ea7e8e4)
  const lugares = [
    { etiqueta: t('miCuenta.perfil'), ruta: '/cuenta/perfil' as const, icono: 'cuenta' as const },
    { etiqueta: t('miCuenta.preferencias'), ruta: '/cuenta/preferencias' as const, icono: 'preferencias' as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
        {/* EL HEADER CD (S61-B12, D-370): la identidad sobre el MURO —
            navegación mono + engranaje en vidrio · dos columnas con el
            squircle A10 · el trío real en banda de vidrio oscuro
            (papel 7.37 ✓; el vidrio claro caía a 4.15). */}
        <View
          style={{
            backgroundColor: muro,
            paddingTop: insets.top + spacing[3],
            paddingBottom: spacing[5],
            paddingHorizontal: spacing[5],
            borderBottomLeftRadius: CURVA_OFICIO.izquierda,
            borderBottomRightRadius: CURVA_OFICIO.derecha,
            overflow: 'hidden',
            gap: spacing[4],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.sm,
                letterSpacing: typography.tracking.mono,
                color: palette.light0,
              }}
            >
              {t('miCuenta.titulo').toLowerCase()}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('miCuenta.preferencias')}
              onPress={() => router.push('/cuenta/preferencias')}
              // D-401 (S62): el engranaje responde al dedo — receta de la
              // casa (scale 0.97 de Boton: es un botón circular, no una
              // superficie); el vidrio no cambia de color al tocarse.
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: radius.full,
                backgroundColor: VIDRIO_OFICIO,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Icono nombre="preferencias" registro="tinta" tinta={palette.light0} tamano={21} />
            </Pressable>
          </View>

          {identidad !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
              <View
                style={{
                  width: LADO_AVATAR,
                  height: LADO_AVATAR,
                  borderRadius: RADIO_SQUIRCLE,
                  borderCurve: 'continuous',
                  backgroundColor: VIDRIO_OFICIO,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: typography.family.sans.light, fontSize: 34, color: palette.light0 }}>
                  {identidad.nombre.replace(/\[.*?\]\s*/, '').charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1, gap: spacing[1.5] }}>
                <Text
                  accessibilityRole="header"
                  style={{ fontFamily: typography.family.sans.light, fontSize: typography.size.xl, color: palette.light0 }}
                >
                  {identidad.nombre}
                </Text>
                {(vozOficio !== null || identidad.ciudad !== null) && (
                  <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: palette.light0 }}>
                    {[vozOficio, identidad.ciudad].filter((x): x is string => x !== null).join(' · ')}
                  </Text>
                )}
                {/* el badge fundador: PILL de vidrio con papel (informa
                    = píldora, Ley 21; el programa es D-398) */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: VIDRIO_OFICIO,
                    borderRadius: radius.full,
                    paddingVertical: spacing[1],
                    paddingHorizontal: spacing[3],
                  }}
                >
                  <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.xs, color: palette.light0 }}>
                    {t('miCuenta.fundador')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {identidad !== null && identidad.hitos.length > 0 && (
            <View
              style={{
                backgroundColor: VIDRIO_OFICIO,
                borderRadius: radius.suave,
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[3],
              }}
            >
              <Text
                style={{
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.sm,
                  letterSpacing: typography.tracking.mono,
                  color: palette.light0,
                }}
              >
                {identidad.hitos.join(' · ')}
              </Text>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing[4], gap: spacing[6], marginTop: spacing[2] }}>
          {/* B3 (S58): papel+sombra — los tokens de elevación cruzaron
              (D-358); las celdas con ícono b′ esperan el lote D-361 y el
              COPIAR NIVEL fino, su PNG patrón. */}
          <Tarjeta relleno="ninguno" elevacion="reposo">
            {lugares.map((lugar, i) => (
              <View key={lugar.ruta}>
                {i > 0 ? <Separador /> : null}
                <CeldaNavegacion
                  icono={lugar.icono}
                  registro="aa"
                  titulo={lugar.etiqueta}
                  onPress={() => router.push(lugar.ruta)}
                />
              </View>
            ))}
          </Tarjeta>

          {/* ── Sesión y cuenta (la sesión se MUDÓ desde Negocio) ── */}
          <View style={{ gap: spacing[3] }}>
            <TituloBloque texto={t('sesion.titulo')} />
            <Boton variante="secundario" etiqueta={t('sesion.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            <Boton variante="ghost" etiqueta={t('miCuenta.eliminarCuenta')} bloque onPress={() => setEliminarAbierta(true)} />
          </View>
        </View>
      </ScrollView>

      <Hoja visible={salirAbierta} onCerrar={() => setSalirAbierta(false)} titulo={t('sesion.titulo')}>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: theme.text.secondary }}>
            {t('sesion.confirmacionCierre')}
          </Text>
          <Boton
            variante="destructivo"
            etiqueta={t('sesion.cerrarSesion')}
            bloque
            cargando={cerrando}
            onPress={() => {
              if (cerrando) return;
              setCerrando(true);
              void (async () => {
                await cerrarSesion();
                setCerrando(false);
                setSalirAbierta(false);
                // D-290: la salida aterriza en el login; el replace
                // desmonta las tabs y el guard raíz re-decide fresco.
                router.replace('/login');
              })();
            }}
          />
          <Boton variante="ghost" etiqueta={t('sesion.cancelar')} bloque onPress={() => setSalirAbierta(false)} />
        </View>
      </Hoja>

      {/* Eliminar cuenta — P17 §4: la entrada existe y dice su verdad;
          las reglas (citas pagadas, planes vivos, saldo por liquidar)
          se escriben como enmienda de letra ANTES de construir. */}
      <Hoja visible={eliminarAbierta} onCerrar={() => setEliminarAbierta(false)} titulo={t('miCuenta.eliminarCuenta')} conCerrar>
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * 1.4, color: theme.text.secondary }}>
            {t('miCuenta.eliminarVoz')}
          </Text>
          <Boton variante="secundario" etiqueta={t('miCuenta.entendido')} bloque onPress={() => setEliminarAbierta(false)} />
        </View>
      </Hoja>
      {/* el velo del muro — la barra de estado jamás queda blanca */}
      <VeloBarraEstadoOficio />
    </View>
  );
}
