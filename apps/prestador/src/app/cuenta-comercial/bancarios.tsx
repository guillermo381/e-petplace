/**
 * DATOS BANCARIOS — el formulario UNA vez (S54-B, esquema §7.12: las 7
 * claves, todo-o-nada — la RPC no guarda sets a medias; lo "parcial"
 * legal de §8.13 es la cuenta SIN bancarios, no bancarios por la mitad).
 * Catálogos VIVOS: cat_bancos (17 EC) en Hoja con scroll propio (L-132)
 * y cat_tipos_documento_titular con su máscara — el frontend valida
 * ANTES de mandar y el server re-valida (misma fuente).
 * La educación §4.1 del modelo acompaña: una cuenta, una transferencia.
 */

import { useEffect, useState } from 'react';
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
  SelectorOpcion,
  Separador,
  Tarjeta,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  actualizarDatosBancarios,
  obtenerBancosDePais,
  obtenerMiCuentaComercial,
  obtenerTiposDocumentoTitular,
  type BancoCatalogo,
  type TipoDocumentoTitular,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

const NUMERO_CUENTA_RE = /^[A-Za-z0-9 \-]+$/;
const DOCUMENTO_RE = /^[A-Za-z0-9]+$/;

interface BaseCargada {
  cuentaId: string;
  bancos: BancoCatalogo[];
  tiposDoc: TipoDocumentoTitular[];
}

export default function DatosBancarios() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();

  const [base, setBase] = useState<BaseCargada | 'cargando' | 'error'>('cargando');

  const [banco, setBanco] = useState<BancoCatalogo | null>(null);
  const [tipoCuenta, setTipoCuenta] = useState<'corriente' | 'ahorros' | null>(null);
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [titularNombre, setTitularNombre] = useState('');
  const [tipoDoc, setTipoDoc] = useState<string | null>(null);
  const [documento, setDocumento] = useState('');

  const [errores, setErrores] = useState<Partial<Record<'banco' | 'numero' | 'titular' | 'documento', string>>>({});
  const [hojaBanco, setHojaBanco] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const cuenta = await obtenerMiCuentaComercial();
      if (!vigente) return;
      if (!cuenta.ok || cuenta.data === null) {
        setBase('error');
        return;
      }
      const [bancos, tiposDoc] = await Promise.all([
        obtenerBancosDePais(cuenta.data.countryCode),
        obtenerTiposDocumentoTitular(cuenta.data.countryCode),
      ]);
      if (!vigente) return;
      if (!bancos.ok || !tiposDoc.ok || bancos.data.length === 0 || tiposDoc.data.length === 0) {
        // catálogo caído ≠ vacío silencioso (regla 36)
        setBase('error');
        return;
      }
      setBase({ cuentaId: cuenta.data.id, bancos: bancos.data, tiposDoc: tiposDoc.data });
    })();
    return () => {
      vigente = false;
    };
  }, []);

  async function alGuardar() {
    if (guardando || typeof base === 'string') return;

    const vNumero = numeroCuenta.trim();
    const vNumeroNorm = vNumero.replace(/[ \-]/g, '');
    const vTitular = titularNombre.trim();
    const vDocumento = documento.trim();
    const tipoDocElegido = base.tiposDoc.find((x) => x.codigo === tipoDoc) ?? null;

    const nuevos: typeof errores = {};
    if (banco === null) nuevos.banco = t('cuenta.campoObligatorio');
    if (
      vNumero.length === 0 ||
      !NUMERO_CUENTA_RE.test(vNumero) ||
      vNumeroNorm.length < 4 ||
      vNumeroNorm.length > 34
    ) {
      nuevos.numero = vNumero.length === 0 ? t('cuenta.campoObligatorio') : t('cuenta.numeroCuentaInvalido');
    }
    if (vTitular.length < 2) nuevos.titular = t('cuenta.campoObligatorio');
    if (
      tipoDocElegido === null ||
      vDocumento.length === 0 ||
      !DOCUMENTO_RE.test(vDocumento) ||
      (tipoDocElegido.mascaraValidacion !== null && !new RegExp(tipoDocElegido.mascaraValidacion).test(vDocumento))
    ) {
      nuevos.documento = vDocumento.length === 0 ? t('cuenta.campoObligatorio') : t('cuenta.formatoInvalido');
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || banco === null || tipoCuenta === null || tipoDocElegido === null) {
      if (tipoCuenta === null || tipoDoc === null) {
        mostrar({ texto: t('cuenta.campoObligatorio'), variante: 'error' });
      }
      return;
    }

    setGuardando(true);
    const r = await actualizarDatosBancarios({
      cuentaComercialId: base.cuentaId,
      bancoCodigo: banco.codigo,
      bancoNombre: banco.nombre,
      tipoCuenta,
      numeroCuenta: vNumeroNorm,
      titularNombre: vTitular,
      titularTipoDocumento: tipoDocElegido.codigo,
      titularDocumento: vDocumento,
    });
    setGuardando(false);
    if (!r.ok) {
      // rechazo de negocio: la voz del server es la fuente de verdad
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('cuenta.bancariosGuardados'), variante: 'exito' });
    router.back();
  }

  if (base === 'cargando') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cuenta.datosBancarios')} atras onAtras={() => router.back()} />
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto forma="linea" ancho="70%" />
            <View style={{ height: spacing[3] }} />
            <Esqueleto forma="bloque" ancho="100%" alto={200} />
          </EsqueletoGrupo>
        </View>
      </View>
    );
  }

  if (base === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
        <Encabezado variante="navegacion" titulo={t('cuenta.datosBancarios')} atras onAtras={() => router.back()} />
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
      <Encabezado variante="navegacion" titulo={t('cuenta.datosBancarios')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: spacing[8], gap: spacing[5] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* la educación del modelo (§4.1): una cuenta, una transferencia */}
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.sm,
            lineHeight: typography.size.sm * typography.leading.normal,
            color: theme.text.tertiary,
          }}
        >
          {t('cuenta.bancariosEducacion')}
        </Text>

        <Tarjeta relleno="ninguno">
          <Celda
            interactiva
            accessibilityRole="button"
            onPress={() => setHojaBanco(true)}
            titulo={t('cuenta.banco')}
            subtitulo={banco?.nombre ?? t('cuenta.bancoElegir')}
          />
        </Tarjeta>
        {errores.banco !== undefined ? (
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              color: theme.status.dangerText,
              marginTop: -spacing[4],
            }}
          >
            {errores.banco}
          </Text>
        ) : null}

        <SelectorOpcion
          etiqueta={t('cuenta.tipoCuenta')}
          opciones={[
            { codigo: 'corriente', etiqueta: t('cuenta.tipoCorriente') },
            { codigo: 'ahorros', etiqueta: t('cuenta.tipoAhorros') },
          ]}
          seleccionada={tipoCuenta ?? undefined}
          onSelect={(codigo) => {
            if (codigo === 'corriente' || codigo === 'ahorros') setTipoCuenta(codigo);
          }}
        />

        <Campo
          label={t('cuenta.numeroCuenta')}
          value={numeroCuenta}
          onChangeText={setNumeroCuenta}
          keyboardType="number-pad"
          ayuda={t('cuenta.numeroCuentaAyuda')}
          error={errores.numero}
          deshabilitado={guardando}
        />

        <Campo
          label={t('cuenta.titularNombre')}
          value={titularNombre}
          onChangeText={setTitularNombre}
          ayuda={t('cuenta.titularNombreAyuda')}
          error={errores.titular}
          deshabilitado={guardando}
        />

        <SelectorOpcion
          etiqueta={t('cuenta.titularTipoDocumento')}
          opciones={base.tiposDoc.map((x) => ({ codigo: x.codigo, etiqueta: x.nombre }))}
          seleccionada={tipoDoc ?? undefined}
          onSelect={setTipoDoc}
        />

        <Campo
          label={t('cuenta.titularDocumento')}
          value={documento}
          onChangeText={setDocumento}
          autoCapitalize="characters"
          error={errores.documento}
          deshabilitado={guardando}
        />

        <Boton
          variante="primario"
          etiqueta={t('cuenta.guardar')}
          bloque
          cargando={guardando}
          onPress={() => void alGuardar()}
        />
      </ScrollView>

      {/* 17 bancos EC: scroll propio dentro de la Hoja (HojaScroll, L-132) */}
      <Hoja visible={hojaBanco} onCerrar={() => setHojaBanco(false)} titulo={t('cuenta.bancoElegir')} altura="media">
        <HojaScroll>
          {base.bancos.map((b, i) => (
            <View key={b.codigo}>
              {i > 0 ? <Separador /> : null}
              <Celda
                interactiva
                accessibilityRole="button"
                titulo={b.nombre}
                onPress={() => {
                  setBanco(b);
                  setHojaBanco(false);
                }}
              />
            </View>
          ))}
        </HojaScroll>
      </Hoja>
    </View>
  );
}
