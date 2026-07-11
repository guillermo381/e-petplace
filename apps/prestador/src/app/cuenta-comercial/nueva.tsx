/**
 * REGISTRAR CUENTA COMERCIAL — peldaño 0 → 1 (S54-B, §6.5 traducido a
 * móvil). EL ORDEN ES LEY: identificación fiscal + país AL INICIO →
 * detección de existencia (RPC verificar_identificacion_disponible —
 * responde SOLO sí/no + mensaje honesto, jamás datos ajenos) → recién
 * ahí los datos fiscales → crear. La cuenta NACE pendiente_validacion
 * con datos_bancarios {} (los bancarios son su propio flujo, §8.13).
 * El wizard JAMÁS activa (§7.11 — eso es del admin).
 *
 * Validación por catálogo VIVO: tipos fiscales y máscaras salen de
 * cat_paises (la misma fuente que valida el server) — cero hardcode
 * (regla 21). Dosis baja: CTA en tinta, un paso visible a la vez.
 */

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Boton,
  Campo,
  Celda,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  HojaScroll,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  crearCuentaComercialInicial,
  obtenerPaisesParaRegistro,
  verificarIdentificacionDisponible,
  type PaisRegistro,
  type TipoFiscal,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type ClaveTipoFiscal =
  | 'cuenta.tipoFiscalPersonaNatural'
  | 'cuenta.tipoFiscalPersonaNaturalObligada'
  | 'cuenta.tipoFiscalPersonaJuridica'
  | 'cuenta.tipoFiscalSinFinesLucro';

const CLAVE_TIPO_FISCAL: Record<TipoFiscal, ClaveTipoFiscal> = {
  persona_natural: 'cuenta.tipoFiscalPersonaNatural',
  persona_natural_obligada: 'cuenta.tipoFiscalPersonaNaturalObligada',
  persona_juridica: 'cuenta.tipoFiscalPersonaJuridica',
  entidad_sin_fines_lucro: 'cuenta.tipoFiscalSinFinesLucro',
};

export default function NuevaCuentaComercial() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [paises, setPaises] = useState<PaisRegistro[] | 'cargando' | 'error'>('cargando');
  const [paisCodigo, setPaisCodigo] = useState<string | null>(null);
  const [tipoFiscal, setTipoFiscal] = useState<TipoFiscal | null>(null);
  const [identificacion, setIdentificacion] = useState('');
  const [errorIdentificacion, setErrorIdentificacion] = useState<string | null>(null);

  // paso 2 — se revela SOLO tras la detección §6.5
  const [identificacionVerificada, setIdentificacionVerificada] = useState(false);
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [errorRazon, setErrorRazon] = useState<string | null>(null);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

  const [hojaPais, setHojaPais] = useState(false);
  const [hojaTipo, setHojaTipo] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerPaisesParaRegistro();
      if (!vigente) return;
      if (!r.ok || r.data.length === 0) {
        setPaises('error');
        return;
      }
      setPaises(r.data);
      // un solo país activo (EC hoy): queda elegido, sin ceremonia
      if (r.data.length === 1) setPaisCodigo(r.data[0].codigoIso2);
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const pais = useMemo(
    () => (Array.isArray(paises) ? paises.find((p) => p.codigoIso2 === paisCodigo) ?? null : null),
    [paises, paisCodigo],
  );

  // al cambiar país/tipo/identificación, la verificación previa muere
  function invalidarVerificacion() {
    setIdentificacionVerificada(false);
    setErrorIdentificacion(null);
  }

  async function alContinuar() {
    if (trabajando || pais === null || tipoFiscal === null) return;
    const valor = identificacion.trim();
    const mascara = pais.mascaraPorTipo[tipoFiscal];
    if (valor.length === 0 || (mascara !== undefined && !new RegExp(mascara).test(valor))) {
      setErrorIdentificacion(valor.length === 0 ? t('cuenta.campoObligatorio') : t('cuenta.formatoInvalido'));
      return;
    }
    setTrabajando(true);
    setErrorIdentificacion(null);
    const r = await verificarIdentificacionDisponible(pais.codigoIso2, valor);
    setTrabajando(false);
    if (!r.ok) {
      setErrorIdentificacion(r.mensaje);
      return;
    }
    if (!r.data.disponible) {
      // el mensaje honesto del server: existe, sin filtrar de quién es
      setErrorIdentificacion(r.data.mensaje ?? t('cuenta.formatoInvalido'));
      return;
    }
    setIdentificacionVerificada(true);
  }

  async function alCrear() {
    if (trabajando || pais === null || tipoFiscal === null) return;
    const vRazon = razonSocial.trim();
    const vNombre = nombreComercial.trim();
    setErrorRazon(vRazon.length === 0 ? t('cuenta.campoObligatorio') : null);
    setErrorNombre(vNombre.length === 0 ? t('cuenta.campoObligatorio') : null);
    if (vRazon.length === 0 || vNombre.length === 0) return;

    setTrabajando(true);
    const r = await crearCuentaComercialInicial({
      countryCode: pais.codigoIso2,
      tipoFiscal,
      identificacionFiscal: identificacion.trim(),
      razonSocial: vRazon,
      nombreComercial: vNombre,
    });
    setTrabajando(false);
    if (!r.ok) {
      // rechazo de negocio: la voz del server es la fuente de verdad
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('cuenta.nuevaCreada'), variante: 'exito' });
    router.back(); // index refetchea en focus → peldaño 1
  }

  if (paises === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cuenta.nuevaTitulo')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="60%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={140} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (paises === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cuenta.nuevaTitulo')} atras onAtras={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.error')}
            accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => router.back()} />}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.nuevaTitulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: spacing[8], gap: spacing[5] }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            lineHeight: typography.size.base * typography.leading.normal,
            color: theme.text.secondary,
          }}
        >
          {t('cuenta.nuevaIdentificacionVoz')}
        </Text>

        <Tarjeta relleno="ninguno">
          <Celda
            interactiva
            accessibilityRole="button"
            onPress={() => setHojaPais(true)}
            titulo={t('cuenta.pais')}
            subtitulo={pais?.nombre ?? '—'}
          />
          <Separador />
          <Celda
            interactiva
            accessibilityRole="button"
            onPress={() => setHojaTipo(true)}
            titulo={t('cuenta.tipoFiscal')}
            subtitulo={tipoFiscal !== null ? t(CLAVE_TIPO_FISCAL[tipoFiscal]) : t('cuenta.tipoFiscalElegir')}
          />
        </Tarjeta>

        <Campo
          label={t('cuenta.identificacion')}
          value={identificacion}
          onChangeText={(v) => {
            setIdentificacion(v);
            invalidarVerificacion();
          }}
          keyboardType="number-pad"
          ayuda={t('cuenta.identificacionAyuda')}
          error={errorIdentificacion ?? undefined}
          deshabilitado={trabajando}
        />

        {!identificacionVerificada ? (
          <Boton
            variante="primario"
            etiqueta={t('cuenta.continuar')}
            bloque
            cargando={trabajando}
            deshabilitado={pais === null || tipoFiscal === null}
            onPress={() => void alContinuar()}
          />
        ) : (
          <>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                lineHeight: typography.size.base * typography.leading.normal,
                color: theme.text.secondary,
              }}
            >
              {t('cuenta.nuevaDatosVoz')}
            </Text>
            <Campo
              label={t('cuenta.razonSocial')}
              value={razonSocial}
              onChangeText={setRazonSocial}
              ayuda={t('cuenta.razonSocialAyuda')}
              error={errorRazon ?? undefined}
              deshabilitado={trabajando}
            />
            <Campo
              label={t('cuenta.nombreComercial')}
              value={nombreComercial}
              onChangeText={setNombreComercial}
              ayuda={t('cuenta.nombreComercialAyuda')}
              error={errorNombre ?? undefined}
              deshabilitado={trabajando}
            />
            <Boton
              variante="primario"
              etiqueta={t('cuenta.crear')}
              bloque
              cargando={trabajando}
              onPress={() => void alCrear()}
            />
          </>
        )}
      </ScrollView>

      {/* país — hoy uno (EC); la lista está lista para cuando se abran más */}
      <Hoja visible={hojaPais} onCerrar={() => setHojaPais(false)} titulo={t('cuenta.pais')}>
        <View>
          {(Array.isArray(paises) ? paises : []).map((p, i) => (
            <View key={p.codigoIso2}>
              {i > 0 ? <Separador /> : null}
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={p.nombre}
                onPress={() => {
                  setPaisCodigo(p.codigoIso2);
                  setTipoFiscal(null);
                  invalidarVerificacion();
                  setHojaPais(false);
                }}
              />
            </View>
          ))}
        </View>
      </Hoja>

      <Hoja visible={hojaTipo} onCerrar={() => setHojaTipo(false)} titulo={t('cuenta.tipoFiscalElegir')}>
        <HojaScroll>
          {(pais?.tiposFiscales ?? []).map((tipo, i) => (
            <View key={tipo}>
              {i > 0 ? <Separador /> : null}
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={t(CLAVE_TIPO_FISCAL[tipo])}
                onPress={() => {
                  setTipoFiscal(tipo);
                  invalidarVerificacion();
                  setHojaTipo(false);
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
