// ─────────────────────────────────────────────────────────────────────
// M3 — EL ALTA MÍNIMA FANTASMA del mostrador (/veterinaria/mostrador/
// nueva, S69-B). Espejo del alta de mascota del cliente (hogar/agregar),
// del lado clínica. Dosis baja (§15b).
//
// TESIS: en tres datos la mascota entra al sistema, y su familia real la
// va a encontrar esperándola cuando se registre.
// FIRMA: la voz del después (el reclamo declarado) — comportamiento, la
// promesa de que el expediente espera.
//
// TOGGLE REAL (A2 — el CLASH de S69-B, RESUELTO): la letra pedía "3 campos
// + toggle teléfono/email, los dos caminos". El chasis original
// `crear_alta_asistida_pendiente` exigía email y no tenía path
// teléfono-only; A2 lo enmendó a contacto-flexible (email O teléfono — el
// server normaliza el teléfono y el reclamo dispara por cualquiera de los
// dos; contacto_requerido si faltan ambos). Esta pantalla YA porta el
// toggle real: SelectorSegmentado email/teléfono → envía email XOR teléfono.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  SelectorEspecie,
  SelectorSegmentado,
  spacing,
  typography,
  useAviso,
  useTheme,
  type AvatarMascotaEspecie,
  type SelectorEspecieOpcion,
} from '@epetplace/ui';
import {
  buscarClienteAltaAsistida,
  buscarClientePorTelefono,
  crearAltaAsistidaMostrador,
  obtenerEspeciesActivas,
  obtenerMiPrestador,
} from '@epetplace/api';

import { Text } from 'react-native';
import { verificarSesion } from '@/lib/api';
import { useTraduccion } from '@/i18n';

const CODIGOS_ESPECIE_UI: readonly AvatarMascotaEspecie[] = [
  'perro', 'gato', 'conejo', 'ave', 'roedor', 'cobaya', 'pez', 'huron', 'reptil',
];
function esEspecieUi(codigo: string): codigo is AvatarMascotaEspecie {
  return (CODIGOS_ESPECIE_UI as readonly string[]).includes(codigo);
}

const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function AltaMostrador() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();
  const { q = '' } = useLocalSearchParams<{ q?: string }>();

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [opciones, setOpciones] = useState<SelectorEspecieOpcion[] | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState<string | undefined>(undefined);

  // Pre-llenado desde M2: '@' → email · dígitos → teléfono · resto → mascota.
  const qTrim = q.trim();
  const qEsEmail = RE_EMAIL.test(qTrim);
  const qEsTel = !qEsEmail && /^[+\d][\d\s()+-]{4,}$/.test(qTrim);
  const [nombreMascota, setNombreMascota] = useState(qEsEmail || qEsTel ? '' : q);
  const [especie, setEspecie] = useState<AvatarMascotaEspecie | undefined>(undefined);
  const [nombreCliente, setNombreCliente] = useState('');
  // Toggle real (A2): email O teléfono.
  const [contacto, setContacto] = useState<'email' | 'telefono'>(qEsTel ? 'telefono' : 'email');
  const [email, setEmail] = useState(qEsEmail ? qTrim : '');
  const [telefono, setTelefono] = useState(qEsTel ? qTrim : '');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const [pr, esp] = await Promise.all([obtenerMiPrestador(), obtenerEspeciesActivas()]);
      if (!vigente) return;
      if (pr.ok) setPrestadorId(pr.data.id);
      if (!esp.ok) {
        setErrorCatalogo(esp.mensaje);
        return;
      }
      const validas: SelectorEspecieOpcion[] = [];
      for (const e of esp.data) if (esEspecieUi(e.codigo)) validas.push({ codigo: e.codigo, nombre: e.nombre });
      setOpciones(validas);
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const emailValido = RE_EMAIL.test(email.trim());
  const telValido = telefono.trim().length >= 5;
  const contactoValido = contacto === 'email' ? emailValido : telValido;
  const puedeGuardar =
    prestadorId !== null &&
    nombreMascota.trim().length > 0 &&
    especie !== undefined &&
    nombreCliente.trim().length > 0 &&
    contactoValido &&
    !enviando;

  async function guardar() {
    if (!puedeGuardar || prestadorId === null || especie === undefined) return;
    const sesion = await verificarSesion();
    if (!sesion.ok) {
      mostrar({ variante: 'error', texto: sesion.mensaje });
      return;
    }
    setEnviando(true);
    const porEmail = contacto === 'email';
    // B3bis: si el contacto YA pertenece a una cuenta registrada, NO se fabrica
    // fantasma — se redirige al HANDSHAKE (elegir mascota o "Mascota nueva" con
    // autorización de la familia real). El guard vive también en el RPC.
    const contactoTxt = (porEmail ? email : telefono).trim();
    const busqueda = porEmail
      ? await buscarClienteAltaAsistida(contactoTxt)
      : await buscarClientePorTelefono(contactoTxt);
    if (busqueda.ok && busqueda.data.existe === 'registrado') {
      setEnviando(false);
      router.replace({
        pathname: '/veterinaria/mostrador/autorizar',
        params: {
          userId: busqueda.data.user_id,
          nombre: busqueda.data.nombre ?? '',
          contacto: contactoTxt,
          tipo: porEmail ? 'email' : 'telefono',
        },
      });
      return;
    }
    const r = await crearAltaAsistidaMostrador({
      prestadorId,
      nombreMascota,
      especie,
      nombreCliente,
      email: porEmail ? email : null,
      telefono: porEmail ? null : telefono,
    });
    setEnviando(false);
    if (!r.ok) {
      mostrar({ variante: 'error', texto: r.mensaje });
      return;
    }
    // La voz del después — el reclamo se adapta al canal.
    const dato = (porEmail ? email : telefono).trim();
    const mascota = nombreMascota.trim();
    mostrar({
      variante: 'exito',
      texto: porEmail
        ? t('mostrador.exitoEmail', { contacto: dato, mascota })
        : t('mostrador.exitoTelefono', { contacto: dato, mascota }),
    });
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('mostrador.nuevaTitulo')} atras onAtras={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
        keyboardShouldPersistTaps="handled"
      >
        <Campo
          label={t('mostrador.mascotaLabel')}
          placeholder={t('mostrador.mascotaPlaceholder')}
          value={nombreMascota}
          onChangeText={setNombreMascota}
          autoCapitalize="words"
        />

        {opciones === null && errorCatalogo === undefined ? (
          <EsqueletoGrupo etiqueta={t('mostrador.cargandoEspecies')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
              {Array.from({ length: 6 }, (_, i) => (
                <View key={i} style={{ flexBasis: '30%', flexGrow: 1 }}>
                  <Esqueleto forma="bloque" alto={120} />
                </View>
              ))}
            </View>
          </EsqueletoGrupo>
        ) : opciones !== null ? (
          <SelectorEspecie
            opciones={opciones}
            seleccionada={especie}
            onSelect={setEspecie}
            etiqueta={t('mostrador.especieLabel')}
          />
        ) : (
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.status.dangerText }}>
            {errorCatalogo}
          </Text>
        )}

        <Campo
          label={t('mostrador.clienteLabel')}
          placeholder={t('mostrador.clientePlaceholder')}
          value={nombreCliente}
          onChangeText={setNombreCliente}
          autoCapitalize="words"
        />
        <View style={{ gap: spacing[2] }}>
          <SelectorSegmentado
            etiqueta={t('mostrador.contactoEtiqueta')}
            segmentos={[
              { codigo: 'email', etiqueta: t('mostrador.contactoEmail') },
              { codigo: 'telefono', etiqueta: t('mostrador.contactoTelefono') },
            ]}
            activo={contacto}
            onCambio={(c) => setContacto(c === 'telefono' ? 'telefono' : 'email')}
          />
          {contacto === 'email' ? (
            <Campo
              label={t('mostrador.emailLabel')}
              placeholder={t('mostrador.emailPlaceholder')}
              ayuda={t('mostrador.contactoAyuda')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          ) : (
            <Campo
              label={t('mostrador.telefonoLabel')}
              placeholder={t('mostrador.telefonoPlaceholder')}
              ayuda={t('mostrador.contactoAyuda')}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />
          )}
        </View>

        <Boton
          variante="primario"
          bloque
          etiqueta={t('mostrador.registrar')}
          cargando={enviando}
          deshabilitado={!puedeGuardar}
          onPress={() => void guardar()}
        />
      </ScrollView>
    </View>
  );
}
