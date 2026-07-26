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

import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Boton,
  CeldaNavegacion,
  EsqueletoGrupo,
  Hoja,
  Icono,
  LogoNegocio,
  Separador,
  Tarjeta,
  Texto,
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
  resolverUrlLogoNegocio,
} from '@epetplace/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CURVA_OFICIO,
  EsqueletoOficio,
  VIDRIO_OFICIO,
  VeloBarraEstadoOficio,
  useBarraEstadoClara,
  useMuroOficio,
} from '@/components/techo-oficio';
import { useTraduccion } from '@/i18n';

// El lado del slot de identidad del header CD (S61-B12, firmado).
// S76-B1.2: `RADIO_SQUIRCLE` MURIÓ con el monograma inline (Ley 37) —
// el slot lo llena `LogoNegocio`, que trae su propia forma: caja
// `radius.suave`, la forma canónica del logo de negocio en la casa.
// DELTA VISIBLE DECLARADO AL GATE: el contenedor pasa de squircle 32%
// (27) a suave (10). Se elige la COHERENCIA DEL COMPONENTE — el mismo
// logo se ve idéntico en las tres superficies (portada, equipo,
// invitación); un squircle acá le daría dos formas al mismo objeto en
// la misma app. El squircle 32% sigue siendo de las CARAS (Ley 21b,
// AvatarMascota), y un logo no es una cara. Reversión barata si el
// founder prefiere la forma vieja: una prop de radio en el componente.
const LADO_AVATAR = 84;

/**
 * S77-B (D-531) — EL PORTÓN, PARTIDO EN DOS.
 *
 * Antes había UN estado y UN `setIdentidad`: el nombre y el logo colgaban
 * del MISMO gate que la banda de hitos. Medido en S77-B: el header
 * esperaba CINCO viajes de red en serie cuando solo necesitaba DOS
 * (`obtenerMiPrestador` = getUser + select). Los otros tres son de los
 * hitos — contenido SECUNDARIO del muro que estaba tomando de rehén a la
 * identidad. (Lo que el canon sospechaba, `resolverUrlLogoNegocio`, quedó
 * descartado con medición: es síncrona y sin red.)
 *
 * El estado FINAL es idéntico al de antes; cambia CUÁNDO pinta cada parte.
 */
type Identidad = {
  nombre: string;
  ciudad: string | null;
  /** S76-B1.2 (D-505): el PATH del logo — la portada lo pinta si existe.
   *  La lectura ya viene en `obtenerMiPrestador`; lo que faltaba era
   *  que esta pantalla lo mirara. */
  logoPath: string | null;
};

/** Lo que sale de las TRES lecturas de oferta y agenda. Llega DESPUÉS y
 *  su ausencia ya no borra el header: la voz del oficio se suma al
 *  subtítulo cuando llega, y la banda de hitos conserva su regla de
 *  existencia (sin hitos NO existe — jamás ceros, S61-B12). */
type Negocio = {
  oficio: 'ambos' | 'paseo' | 'grooming' | null;
  hitos: string[];
};


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
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  // D-531: si la identidad NO se puede leer, el esqueleto tiene que
  // PARARSE. Un esqueleto eterno es peor que el hueco de antes — sería
  // el error disfrazado de "cargando" (Ley 13, la cara inversa de "el
  // error jamás se disfraza de vacío"). Sin superficie de error nueva:
  // con fallo el header colapsa a título+engranaje, EXACTAMENTE lo que
  // esta pantalla hacía hasta hoy cuando la lectura fallaba.
  const [falloIdentidad, setFalloIdentidad] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const prestador = await obtenerMiPrestador();
        if (!vigente) return;
        if (!prestador.ok) {
          setFalloIdentidad(true);
          return;
        }
        // ── EL HEADER PINTA ACÁ: los 2 viajes que de verdad necesita ──
        setFalloIdentidad(false);
        setIdentidad({
          nombre: prestador.data.nombre_comercial,
          ciudad: prestador.data.ciudad,
          logoPath: prestador.data.foto_url,
        });

        // ── y recién ahora lo secundario, con su propio estado ──
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
        setNegocio({
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
    negocio?.oficio === 'ambos'
      ? t('miCuenta.oficioAmbos')
      : negocio?.oficio === 'paseo'
        ? t('miCuenta.oficioPaseos')
        : negocio?.oficio === 'grooming'
          ? t('miCuenta.oficioEstetica')
          : null;

  // D-531 (higiene, DECLARADA como tal): la derivación de la URL pública
  // es síncrona y sin red — está MEDIDO que no es el cuello (microsegundos).
  // Se memoiza porque corría en cada render sin necesidad, no porque cure
  // la deuda.
  const logoUrl = useMemo(
    () => resolverUrlLogoNegocio(identidad?.logoPath ?? null),
    [identidad?.logoPath],
  );

  // S58 (D-361 levantado): cada entrada con su ícono b′ del registry —
  // el perfil comparte la chapita 'cuenta' (decisión del lote ea7e8e4)
  const lugares = [
    { etiqueta: t('miCuenta.perfil'), ruta: '/cuenta/perfil' as const, icono: 'cuenta' as const },
    { etiqueta: t('miCuenta.preferencias'), ruta: '/cuenta/preferencias' as const, icono: 'preferencias' as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}>
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

          {/* D-531 · LEY 13: mientras la identidad viaja, el muro reserva
              SU GEOMETRÍA FINAL con formas de vidrio. El lado del logo (84)
              gobierna el alto de la fila en los dos estados, así que el
              reemplazo no corre nada — la portada se lee CARGANDO, no ROTA
              (que es como se leía: el muro pintaba solo título+engranaje y
              después crecía de golpe). Inerte por ley: sin shimmer, sin
              pulso, sin fade. NO es la espera de marca — esa la reserva
              DIRECCION_ARTE §5.3 para procesos >2s, y esto es carga de
              contenido. Con `falloIdentidad` no se dibuja: un esqueleto
              eterno sería el error disfrazado de cargando. */}
          {identidad === null && !falloIdentidad && (
            <EsqueletoGrupo>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                <EsqueletoOficio ancho={LADO_AVATAR} alto={LADO_AVATAR} radio={radius.suave} />
                <View style={{ flex: 1, gap: spacing[1.5] }}>
                  {/* el nombre · el subtítulo · la pill del badge */}
                  <EsqueletoOficio ancho="70%" alto={typography.size.xl} />
                  <EsqueletoOficio ancho="45%" alto={typography.size.sm} />
                  <EsqueletoOficio
                    ancho={104}
                    alto={typography.size.xs + spacing[3]}
                    radio={radius.full}
                  />
                </View>
              </View>
            </EsqueletoGrupo>
          )}

          {identidad !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
              {/* S76-B1.2 (D-505, gate del founder): LA PORTADA MOSTRABA
                  UN MONOGRAMA QUE NUNCA PODÍA SER EL LOGO. Este slot era
                  un View inline con la inicial (S61-B12, tres sesiones
                  antes de que LogoNegocio existiera): por eso el founder
                  subió su logo CUATRO VECES y la pantalla le dijo que no
                  había pasado nada. No era refresco — era una superficie
                  que jamás leyó `foto_url`. El slot NO cambia (mismo lado
                  84, mismo squircle, mismo vidrio): cambia su CONTENIDO
                  cuando el dato existe, como todo avatar de la casa. El
                  logo se CONTIENE (decisión de mesa S76: una cara llena
                  un círculo, una marca se destruye si se recorta). */}
              <LogoNegocio
                nombre={identidad.nombre}
                logoUrl={logoUrl}
                tamano={LADO_AVATAR}
                superficie="muro"
              />
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

          {/* D-531: la banda NO lleva esqueleto, a propósito. Su regla de
              existencia es "sin hitos NO existe" (S61-B12, jamás ceros):
              un esqueleto acá prometería una banda que en muchos negocios
              no va a llegar nunca — y al no llegar tendría que desaparecer,
              que es el corrimiento que se quería evitar, con una promesa
              rota de yapa. Llega cuando llega. */}
          {negocio !== null && negocio.hitos.length > 0 && (
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
                {negocio.hitos.join(' · ')}
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
            <Texto variante="seccion">{t('sesion.titulo')}</Texto>
            <Boton variante="secundario" etiqueta={t('sesion.cerrarSesion')} bloque onPress={() => setSalirAbierta(true)} />
            <Boton variante="ghost" etiqueta={t('miCuenta.eliminarCuenta')} bloque onPress={() => setEliminarAbierta(true)} />
          </View>

          {/* ── S74-B · EL MARCADOR RENDERIZADO (L-160/L-161): el
              [update] era SOLO console.log — logcat-only, inalcanzable
              para el founder sin cable (hallazgo del gate S74). La
              identidad del build gana pantalla: Cuenta → pie. Voz de
              máquina (Ley 3: metadata en mono); id corto = los primeros
              8 del updateId (único por publicación); embebido/dev se
              dice honesto. Camino literal: tab Cuenta → el pie. ── */}
          <Texto variante="dato">
            {Updates.updateId !== null
              ? `update ${Updates.updateId.slice(0, 8)} · ${Updates.channel ?? 'sin canal'}`
              : 'bundle embebido / dev'}
          </Texto>
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
