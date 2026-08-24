/**
 * Cuenta · Tu familia (S55-B3 → S104-C: INVITAR deja de decir "Pronto").
 *
 * - Renombrar (solo el adulto titular; la RLS es la puerta).
 * - Miembros en LECTURA (el nombre de un miembro ajeno no es legible por RLS
 *   de profiles — null honesto, hueco P1).
 * - INVITAR (motor de A, tanda 2): solo el titular. Correo + nombre opcional →
 *   `invitarAFamilia` devuelve el token; la pantalla arma el ENLACE y ofrece
 *   COPIARLO — la casa no manda el WhatsApp, quien invita lo comparte.
 *   · **`avisoPorCorreo=false` ⇒ la pantalla dice "compartí el enlace", jamás
 *     promete un correo que no va a salir** (el invitado sin cuenta no es
 *     alcanzable por el motor de avisos).
 *   · **Quien entra es FAMILIAR AUTORIZADO** (firma 5.1) — la voz lo dice. NO
 *     se ofrece configurar permisos: en v1 el permiso ES el escalón (la
 *     columna existe y nadie la lee — deuda declarada, medida por A).
 *
 * ⚠️ EL ENLACE apunta al SITIO (`/unirse?token=…`) con instrucciones — no a un
 * deep link ni a una descarga que no existe (firma founder). **La página del
 * sitio es dependencia declarada**: es funcional (no legal), y hasta que exista
 * el enlace lleva a un 404 con el nombre de la casa. Se reporta al founder.
 *
 * Escalera: no muestra datos del expediente (la familia humana no es el
 * expediente de la mascota).
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  Boton,
  Campo,
  Celda,
  CeldaNavegacion,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
  EvitaTeclado,
} from '@epetplace/ui';
import { invitarAFamilia, obtenerMiFamilia, renombrarFamilia, type MiFamilia } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type TraductorCuenta = ReturnType<typeof useTraduccion>['t'];

/** El enlace que se comparte. Apunta al SITIO con instrucciones (firma
 *  founder). `/unirse` es la ruta canónica propuesta — la página del sitio es
 *  una dependencia declarada (funcional, no legal). Reversible: es una
 *  constante. */
function urlInvitacion(token: string): string {
  return `https://epetplace.com/unirse?token=${encodeURIComponent(token)}`;
}

// rol del modelo → voz humana (Ley 3: el código jamás visible)
function vozRol(rol: string, t: TraductorCuenta): string {
  switch (rol) {
    case 'adulto_titular': return t('cuenta.rolAdultoTitular');
    case 'adulto_autorizado': return t('cuenta.rolAdultoAutorizado');
    case 'menor': return t('cuenta.rolMenor');
    case 'cuidador_externo': return t('cuenta.rolCuidadorExterno');
    default: return t('cuenta.familiaMiembroAjeno');
  }
}

/** El estado del flujo de invitar dentro de la Hoja. */
type Invitacion =
  | { fase: 'formulario' }
  | { fase: 'creando' }
  | { fase: 'listo'; enlace: string; email: string; avisoPorCorreo: boolean };

export default function FamiliaCuenta() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [familia, setFamilia] = useState<MiFamilia | 'cargando' | 'error'>('cargando');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  // ── el flujo de invitar ──
  const [invitarAbierta, setInvitarAbierta] = useState(false);
  const [inv, setInv] = useState<Invitacion>({ fase: 'formulario' });
  const [emailInv, setEmailInv] = useState('');
  const [nombreInv, setNombreInv] = useState('');
  const [reboteInv, setReboteInv] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await obtenerMiFamilia();
      if (!vigente) return;
      if (!r.ok) {
        setFamilia('error');
        return;
      }
      setFamilia(r.data);
      setNombre(r.data.nombre ?? '');
    })();
    return () => {
      vigente = false;
    };
  }, [intento]);

  const esTitular = typeof familia === 'object' && familia.mi_rol === 'adulto_titular';

  async function guardar() {
    if (guardando || typeof familia !== 'object') return;
    setGuardando(true);
    const r = await renombrarFamilia(familia.familia_id, nombre);
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('cuenta.familiaGuardado'), variante: 'exito' });
    router.back();
  }

  function abrirInvitar() {
    setInv({ fase: 'formulario' });
    setEmailInv('');
    setNombreInv('');
    setReboteInv(null);
    setInvitarAbierta(true);
  }

  async function crearInvitacion() {
    if (inv.fase === 'creando' || typeof familia !== 'object') return;
    setReboteInv(null);
    setInv({ fase: 'creando' });
    const r = await invitarAFamilia({
      familiaId: familia.familia_id,
      email: emailInv.trim(),
      nombre: nombreInv.trim() === '' ? undefined : nombreInv.trim(),
    });
    if (!r.ok) {
      // la voz la trae el wrapper (VOZ tipada por código); se muestra tal cual.
      setReboteInv(r.mensaje);
      setInv({ fase: 'formulario' });
      return;
    }
    setInv({
      fase: 'listo',
      enlace: urlInvitacion(r.data.token),
      email: emailInv.trim(),
      // El `?? false` es la lectura honesta: si el wrapper no lo dice, se
      // asume que NO salió correo — el error seguro es prometer de menos.
      avisoPorCorreo: r.data.avisoPorCorreo ?? false,
    });
  }

  async function copiarEnlace(enlace: string) {
    await Clipboard.setStringAsync(enlace);
    mostrar({ texto: t('cuenta.familiaEnlaceCopiado'), variante: 'exito' });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo={t('cuenta.familia')} atras onAtras={() => router.back()} />

      {familia === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[3] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={56} />
              <Esqueleto forma="bloque" ancho="100%" alto={96} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : familia === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('cuenta.errorCargar')}
            accion={<Boton variante="secundario" etiqueta={t('cuenta.reintentar')} onPress={() => { setFamilia('cargando'); setIntento((n) => n + 1); }} />}
          />
        </View>
      ) : (
        <EvitaTeclado>
        <ScrollView
          contentContainerStyle={{ padding: spacing[5], paddingBottom: insets.bottom + spacing[6], gap: spacing[4] }}
          keyboardShouldPersistTaps="handled"
        >
          <Campo
            label={t('cuenta.familiaNombreLabel')}
            placeholder={t('cuenta.familiaNombrePlaceholder')}
            value={nombre}
            onChangeText={setNombre}
            deshabilitado={!esTitular}
            ayuda={esTitular ? undefined : t('cuenta.familiaSoloTitular')}
            autoCapitalize="words"
          />
          {esTitular ? (
            <Boton etiqueta={t('cuenta.guardar')} bloque cargando={guardando} deshabilitado={nombre.trim().length === 0} onPress={() => void guardar()} />
          ) : null}

          <View style={{ gap: spacing[3], marginTop: spacing[2] }}>
            <Text
              accessibilityRole="header"
              style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: theme.text.primary }}
            >
              {t('cuenta.familiaMiembros')}
            </Text>
            <Tarjeta relleno="ninguno">
              {familia.miembros.map((m, i) => (
                <View key={m.familia_miembro_id}>
                  {i > 0 ? <Separador /> : null}
                  <Celda
                    titulo={`${m.nombre ?? t('cuenta.familiaMiembroAjeno')}${m.es_yo ? ` ${t('cuenta.familiaTu')}` : ''}`}
                    subtitulo={vozRol(m.rol, t)}
                  />
                </View>
              ))}
              {/* INVITAR — solo el titular (Ley 23: no se ofrece lo que el
                  server va a rebotar con solo_titular_invita). El invitado
                  entra como familiar autorizado; el motor lo fija. */}
              {esTitular ? (
                <>
                  <Separador />
                  <CeldaNavegacion
                    icono="familia"
                    titulo={t('cuenta.familiaInvitar')}
                    detalle={t('cuenta.familiaInvitarAyuda')}
                    onPress={abrirInvitar}
                  />
                </>
              ) : null}
            </Tarjeta>
          </View>
        </ScrollView>
        </EvitaTeclado>
      )}

      {/* LA HOJA DE INVITAR — dos fases: el formulario y el enlace listo. */}
      <Hoja visible={invitarAbierta} onCerrar={() => setInvitarAbierta(false)} titulo={t('cuenta.familiaInvitar')} conCerrar>
        <EvitaTeclado>
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            {inv.fase === 'listo' ? (
              <>
                {/* La voz depende de avisoPorCorreo: nunca promete un correo
                    que no sale. */}
                <Texto variante="cuerpo">
                  {inv.avisoPorCorreo
                    ? t('cuenta.familiaInvitarCorreoYEnlace', { email: inv.email })
                    : t('cuenta.familiaInvitarSoloEnlace', { email: inv.email })}
                </Texto>
                <Texto variante="dato" seleccionable>
                  {inv.enlace}
                </Texto>
                <Boton etiqueta={t('cuenta.familiaCopiarEnlace')} bloque onPress={() => void copiarEnlace(inv.enlace)} />
                <Boton variante="ghost" etiqueta={t('cuenta.familiaInvitarOtra')} bloque onPress={abrirInvitar} />
                <Boton variante="ghost" etiqueta={t('cuenta.familiaInvitarListo')} bloque onPress={() => setInvitarAbierta(false)} />
              </>
            ) : (
              <>
                <Texto variante="apoyo">{t('cuenta.familiaInvitarComoFamiliar')}</Texto>
                <Campo
                  label={t('cuenta.familiaInvitarEmailLabel')}
                  value={emailInv}
                  onChangeText={setEmailInv}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <Campo
                  label={t('cuenta.familiaInvitarNombreLabel')}
                  value={nombreInv}
                  onChangeText={setNombreInv}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                />
                {reboteInv !== null && (
                  <Texto variante="apoyo" color="danger">{reboteInv}</Texto>
                )}
                <Boton
                  etiqueta={t('cuenta.familiaInvitarCrear')}
                  bloque
                  cargando={inv.fase === 'creando'}
                  deshabilitado={emailInv.trim().length === 0}
                  onPress={() => void crearInvitacion()}
                />
              </>
            )}
          </View>
        </EvitaTeclado>
      </Hoja>
    </View>
  );
}
