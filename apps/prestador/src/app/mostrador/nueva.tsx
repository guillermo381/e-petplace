// ─────────────────────────────────────────────────────────────────────
// M3 — EL ALTA MÍNIMA FANTASMA del mostrador (/mostrador/
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
  MarcaDeAgua,
  SelectorEspecie,
  SelectorSegmentado,
  spacing,
  typography,
  Texto,
  useAviso,
  useTheme,
  type AvatarMascotaEspecie,
  type SelectorEspecieOpcion,
} from '@epetplace/ui';
import {
  caraDeMascota,
  buscarClienteAltaAsistida,
  buscarClientePorTelefono,
  crearAltaAsistidaMostrador,
  obtenerEspeciesActivas,
  obtenerMiPrestador,
} from '@epetplace/api';

import { Text } from 'react-native';
import { EvitaTeclado } from '@/components/evita-teclado';
import { verificarSesion } from '@/lib/api';
import { vozErrorVet } from '@/lib/voz-error-vet';
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
      /* ⭐ S98-C · D-806 — **ACÁ ESTABA EL BLANCO ORIGINAL DE LA FICHA.**
         Estas opciones nacían con `codigo` y `nombre` y nada más, así que
         el selector caía a su fallback y **las seis especies se dibujaban
         con la MISMA huella** — el defecto que A confirmó con el ojo
         caminando el alta en dispositivo.

         Y la cura no eran seis glifos nuevos: **las seis fotos ya existían**
         en el bucket `especies-razas` desde S90-C, a dos carpetas de
         distancia. El propio `SelectorEspecieOpcion.fotoUrl` lo predijo en
         su comentario de S91 (*«ausente = la huella de siempre, así que la
         ficha no cambia para quien no la pase»*): el mostrador era, justo,
         quien no la pasaba.

         `razaSlug: null` — acá se elige una ESPECIE, no una raza; no hay
         slug que pasar y no se inventa ninguno. */
      const validas: SelectorEspecieOpcion[] = [];
      for (const e of esp.data)
        if (esEspecieUi(e.codigo))
          validas.push({
            codigo: e.codigo,
            nombre: e.nombre,
            fotoUrl: caraDeMascota({ especie: e.codigo, razaSlug: null }) ?? undefined,
          });
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
        pathname: '/mostrador/autorizar',
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
      mostrar({ variante: 'error', texto: vozErrorVet(t, 'alta', r) });
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
      <MarcaDeAgua />
      <Encabezado variante="navegacion" titulo={t('mostrador.nuevaTitulo')} atras onAtras={() => router.back()} />
      <EvitaTeclado>
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
          <Texto variante="cuerpo" color="danger">{errorCatalogo}</Texto>
        )}

        <Campo
          label={t('mostrador.clienteLabel')}
          placeholder={t('mostrador.clientePlaceholder')}
          value={nombreCliente}
          onChangeText={setNombreCliente}
          autoCapitalize="words"
        />
        <View style={{ gap: spacing[2] }}>
          {/* S83-C25 ③ — ELECCIÓN, y es el caso que más se parece a una
              vista sin serlo. Cambia el Campo de abajo, sí — pero abajo
              NO hay dos vistas del mismo dato: hay DOS FORMAS DE DATO y
              solo una viaja. Lo dice el encabezado de esta pantalla desde
              que nació: "toggle real … envía email XOR teléfono". El
              cambio de campo es la CONSECUENCIA de la elección, no su
              propósito — y ése es el criterio, no el síntoma. */}
          <SelectorSegmentado
            proposito="eleccion"
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
      </EvitaTeclado>
    </View>
  );
}
