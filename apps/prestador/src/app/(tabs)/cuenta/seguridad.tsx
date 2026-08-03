/**
 * Cuenta · SEGURIDAD — lo tuyo ante la plataforma (S85-C2, firma del
 * founder sobre el censo de Cuenta).
 *
 * ☠️ **ABSORBE A `cuenta/identidad.tsx`, QUE MUERE (Ley 37).** Eran dos
 * pantallas para una sola idea, y el censo lo midió con su literal:
 *  · la celda del índice decía **"Tus datos"** y la pantalla a la que
 *    llevaba ponía de encabezado **"Seguridad"** — se tocaba una cosa y se
 *    aterrizaba en otra (17.3, una acción un nombre todo el flujo);
 *  · adentro había una celda **"Contraseña"** que empujaba ACÁ, y el
 *    índice tenía OTRA celda "Contraseña" que empujaba al mismo lugar:
 *    **dos puertas para una cosa**, que es exactamente lo que C34 creyó
 *    haber cerrado y no cerró.
 * **Ahora hay UNA pantalla y UNA puerta.** Y con la fusión mueren las
 * FILAS DESNUDAS #2 del censo (la celda suelta de identidad) sin que haya
 * que vestirla: se fue el motivo, no el vestido.
 *
 * ⚠️ **LO QUE NO SE PERDIÓ, y el acta de C avisó que era el riesgo real:**
 * `identidad.tsx` **no estaba vacía** — tenía el NOMBRE DE LA PERSONA
 * (`profiles.nombre`), editable y escribiendo en DB, más el correo de
 * ingreso. Su acta lo dejó escrito: *"'¿queda vacía?' es la pregunta
 * equivocada; la pregunta es '¿quién más la alcanza?'"*. **Los dos campos
 * viajaron enteros a esta pantalla**, no se puentearon.
 *
 * TESIS: acá está quién sos vos ante la plataforma — no ante las familias.
 * FIRMA: el email read-only que DICE SU PORQUÉ en voz humana, en vez de un
 * campo gris sin explicación.
 * CHANEL: murieron el Encabezado duplicado de la pantalla absorbida, su
 * celda-puente y la celda "Contraseña" del índice — tres controles que
 * llevaban al mismo sitio donde ya estabas.
 *
 * ⚠️ **NADA DE ACÁ LO VE UNA FAMILIA.** El nombre del NEGOCIO y su logo
 * viven en Tu perfil, que es la vitrina; esto es la persona.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  MarcaDeAgua,
  Separador,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  actualizarMiPerfil,
  cambiarContrasena,
  obtenerMiPerfil,
  segundosDeEspera,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export default function Seguridad() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  // ── lo heredado de `identidad`: la persona ──
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // ── la clave ──
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  /** ⭐ S85-C2 — EL TERCER CAMPO, firma del founder. */
  const [confirmacion, setConfirmacion] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [listo, setListo] = useState(false);
  /** El rebote se muestra EN LA PANTALLA y no solo en un toast: los de
   *  seguridad hay que poder releerlos, y un toast se va. */
  const [rebote, setRebote] = useState<{ texto: string; salida: 'recuperar' | null } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerMiPerfil();
        if (!vigente) return;
        if (!r.ok) {
          // Ley 13: el fallo dice que es fallo — jamás se disfraza de vacío.
          setEstado('error');
          return;
        }
        setNombre(r.data.nombre ?? '');
        setEmail(r.data.email);
        setEstado('listo');
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  async function guardarNombre() {
    if (guardando) return;
    setGuardando(true);
    /* SOLO el nombre: el teléfono se fue de esta pantalla en S83-C33 (es
       del negocio y vive en contacto) y por eso no puede pisarlo. El
       wrapper lo sigue aceptando — es campo opcional. */
    const r = await actualizarMiPerfil({ nombre });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('miCuenta.perfilGuardado'), variante: 'exito' });
  }

  async function cambiarClave() {
    if (cambiando) return;
    setRebote(null);
    setListo(false);

    /* ⭐ LA CONFIRMACIÓN SE COMPARA ANTES DE SALIR A LA RED, y ése es todo
       su punto: una contraseña se escribe A CIEGAS (los tres campos son
       `secure`), así que un dedo torcido produce una clave que nadie
       conoce — ni el prestador, que creyó escribir otra cosa, ni nosotros.
       **Es el único error de esta pantalla que el servidor NO puede
       cazar**: para él las dos son válidas. Por eso se valida acá y por
       eso el rebote no gasta un viaje (Ley 23: la puerta no ofrece lo que
       va a rechazar). */
    if (nueva !== confirmacion) {
      setRebote({ texto: t('seguridad.noCoinciden'), salida: null });
      return;
    }

    setCambiando(true);
    const r = await cambiarContrasena({ actual, nueva });
    setCambiando(false);
    if (!r.ok) {
      if (r.codigo === 'sin_contrasena') {
        // la única que termina en una SALIDA, no en una pared
        setRebote({ texto: t('seguridad.soloGoogle'), salida: 'recuperar' });
        return;
      }
      if (r.codigo === 'demasiados_intentos') {
        /* EL RATE LIMIT DICE CUÁNTO FALTA CUANDO SE SABE, y cuando no,
           calla el número en vez de inventarlo. Y la voz deja claro que
           ESPERAR ES LA ACCIÓN — si se leyera como falla nuestra, el
           prestador seguiría reintentando y gastaría el cupo que le
           queda. */
        const s = segundosDeEspera(r.mensaje);
        setRebote({
          texto: s === null ? t('seguridad.esperaSinNumero') : t('seguridad.esperaConNumero', { s }),
          salida: null,
        });
        return;
      }
      setRebote({ texto: r.mensaje, salida: null });
      return;
    }
    /* NO SE NAVEGA, y la causa está medida en el wrapper (S84-C24):
       `cambiarContrasena` RE-AUTENTICA con `signInWithPassword`, y eso
       RENUEVA la sesión. Es la misma persona, así que no hay pérdida real
       — pero la renovación dispara el guard de sesión del raíz, y con un
       `router.back()` encima el resultado era que la pantalla se iba y
       aterrizabas en el login. Se leía como "cambié la clave y me echó",
       que es lo peor que puede pasar justo después de tocar la seguridad
       de tu cuenta: parece que algo salió mal cuando salió bien. */
    setActual('');
    setNueva('');
    setConfirmacion('');
    setRebote(null);
    setListo(true);
    mostrar({ variante: 'exito', texto: t('seguridad.listo') });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('seguridad.tituloPantalla')}
        atras
        onAtras={() => router.back()}
      />

      {estado === 'cargando' && (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
              <Esqueleto forma="bloque" ancho="100%" alto={64} />
            </View>
          </EsqueletoGrupo>
        </View>
      )}

      {estado === 'error' && (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('seguridad.errorTitulo')}
            descripcion={t('seguridad.errorCuerpo')}
            accion={
              <Boton
                variante="secundario"
                etiqueta={t('cuenta.reintentar')}
                onPress={() => setEstado('cargando')}
              />
            }
          />
        </View>
      )}

      {estado === 'listo' && (
        <EvitaTeclado>
          <ScrollView
            contentContainerStyle={{
              padding: spacing[5],
              paddingBottom: insets.bottom + spacing[8],
              gap: spacing[2],
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── QUIÉN SOS ── */}
            <Texto variante="apoyo">{t('seguridad.nadieLoVe')}</Texto>

            <Campo
              label={t('miCuenta.nombreLabel')}
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />
            {/* La firma: el read-only DICE SU PORQUÉ. Un campo gris sin
                explicación se lee como error del producto. */}
            <Campo
              label={t('miCuenta.emailLabel')}
              value={email ?? ''}
              onChangeText={() => undefined}
              ayuda={t('miCuenta.emailAyuda')}
              deshabilitado
            />
            <View style={{ paddingTop: spacing[2] }}>
              <Boton
                etiqueta={t('miCuenta.guardar')}
                bloque
                cargando={guardando}
                onPress={() => void guardarNombre()}
              />
            </View>

            <View style={{ paddingVertical: spacing[5] }}>
              <Separador />
            </View>

            {/* ── TU CONTRASEÑA ──
                Vive ACÁ y no en pantalla aparte porque es la misma
                pregunta ("quién sos ante la plataforma") con otra
                respuesta. Su gemela —recuperar— vive en el LOGIN, y esa
                separación no es de composición: es de estado. **Quien
                puede entrar cambia; quien no puede, recupera.** */}
            <Texto variante="seccion">{t('seguridad.titulo')}</Texto>
            {/* PIDE LA ACTUAL, y no es fricción de formulario: el wrapper
                RE-AUTENTICA con ella antes de escribir. Un teléfono
                desbloqueado y abierto no debería alcanzar para cambiarle
                la clave a alguien. */}
            <Texto variante="apoyo">{t('seguridad.ayuda')}</Texto>

            <Campo
              label={t('seguridad.actual')}
              value={actual}
              onChangeText={setActual}
              secure
              autoCapitalize="none"
            />
            <Campo
              label={t('seguridad.nueva')}
              value={nueva}
              onChangeText={setNueva}
              secure
              autoCapitalize="none"
              ayuda={t('seguridad.largoMinimo')}
            />
            <Campo
              label={t('seguridad.confirmar')}
              value={confirmacion}
              onChangeText={setConfirmacion}
              secure
              autoCapitalize="none"
            />

            {listo && (
              <Texto variante="apoyo" color="success">
                {t('seguridad.listo')}
              </Texto>
            )}

            {rebote !== null && (
              <View style={{ gap: spacing[2], paddingTop: spacing[1] }}>
                <Texto variante="apoyo" color="danger">
                  {rebote.texto}
                </Texto>
                {/* ⚠️ LAS OCHO CUENTAS SOLO-GOOGLE son el caso que más
                    cuidado pide: a alguien que NO TIENE contraseña decirle
                    "la actual no coincide" es mandarlo a probar variantes
                    de algo que no existe. Se le dice que entra con Google
                    y se le ofrece el camino que SÍ le sirve — canjear un
                    código deja una clave establecida donde no había
                    ninguna. El rebote termina en una salida, no en una
                    pared. */}
                {rebote.salida === 'recuperar' && (
                  <View style={{ alignSelf: 'flex-start' }}>
                    <Boton
                      variante="secundario"
                      etiqueta={t('seguridad.irARecuperar')}
                      onPress={() => router.push('/recuperar')}
                    />
                  </View>
                )}
              </View>
            )}

            <View style={{ paddingTop: spacing[4] }}>
              <Boton
                etiqueta={t('seguridad.cambiar')}
                bloque
                cargando={cambiando}
                onPress={() => void cambiarClave()}
              />
            </View>
          </ScrollView>
        </EvitaTeclado>
      )}
    </View>
  );
}
