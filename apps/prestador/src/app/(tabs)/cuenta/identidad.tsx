/**
 * Cuenta · NOMBRE Y ACCESO (S83-C30 ②) — lo PERSONAL, separado del
 * negocio.
 *
 * POR QUÉ NACE: hasta hoy `cuenta/perfil` mezclaba dos cosas con dos
 * audiencias distintas — tu identidad (que no ve nadie) y la portada del
 * negocio (que ven las familias). El censo C16 lo midió: son columnas de
 * DOS TABLAS, `profiles` para vos y `prestadores` para el negocio, con
 * dos wrappers y dos escrituras. Una pantalla que guarda en dos tablas
 * con un solo botón no es una pantalla: son dos.
 *
 * TESIS: acá está quién sos vos ante la plataforma — no ante las
 * familias.
 * FIRMA: el email read-only que DICE SU PORQUÉ en voz humana, en vez de
 * un campo gris sin explicación.
 * CHANEL: sin foto (la del negocio es el LOGO y vive en su portada), sin
 * estado de visibilidad (es del negocio), sin sección de contacto.
 *
 * EL RÓTULO es provisional y está declarado en su celda: "Nombre y
 * acceso" se eligió en C18 contra el contenido real; el definitivo se
 * firma con el seccionado de Cuenta en S84.
 *
 * ⚠️ LO QUE NO HAY Y SE DICE: cambiar contraseña y cambiar correo NO
 * existen todavía (el arco de entrada es D-337/D-299 — medido en S81: el
 * wrapper de auth tiene 4 funciones y ninguna es recuperar/cambiar). La
 * pantalla NO los dibuja apagados: un control que no hace nada es una
 * promesa rota (Ley 23). Cuando el arco exista, entran acá.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import { actualizarMiPerfil, obtenerMiPerfil } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/* ⑤ S83-C33 — EL TELÉFONO SE FUE DE ACÁ (defecto del founder).
 *
 * Letra: *"ahí va nombre + correo de inicio de sesión. El teléfono es del
 * negocio y vive en contacto."* Y el error era DOBLE: además del campo,
 * el detalle de la celda que trae acá decía "Tu nombre, tu teléfono y tu
 * correo" — mientras la sección de contacto del Perfil dice "tu teléfono
 * personal vive en Cuenta". **Dos frases que no pueden ser ciertas a la
 * vez**: una pantalla que se contradice con su vecina enseña mal el
 * modelo. Se curan las dos (la celda, en `cuenta/perfil`).
 *
 * ⚠️ EL DATO NO SE PIERDE Y NO SE BORRA: `profiles.telefono` sigue vivo
 * en la DB y `actualizarMiPerfil` sigue aceptándolo — lo que se retira es
 * la SUPERFICIE. Quitar un campo de una pantalla no es motivo para
 * escribir null sobre un dato que el usuario cargó: esta pantalla deja de
 * mandar la columna, y el valor de quien ya lo tenía queda intacto.
 * ☠️ Su casa definitiva se decide con el seccionado de Cuenta (S84): si
 * el personal necesita teléfono propio, nace ahí con su letra — no vuelve
 * de contrabando.
 *
 * `normalizarTelefono` MURIÓ con su único consumidor (Ley 37). Su gemela
 * sigue viva en `cuenta/perfil`, que es donde el teléfono vive de verdad.
 */
export default function NombreYAcceso() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const { t } = useTraduccion();

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

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

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    // ⑤ SOLO el nombre: la pantalla dejó de mandar `telefono` y por eso no
    // puede pisarlo. El wrapper lo sigue aceptando — es campo opcional.
    const r = await actualizarMiPerfil({ nombre });
    setGuardando(false);
    if (!r.ok) {
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    mostrar({ texto: t('miCuenta.perfilGuardado'), variante: 'exito' });
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado variante="navegacion" titulo="Nombre y acceso" atras onAtras={() => router.back()} />

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
            titulo="No pudimos cargar tus datos"
            descripcion="Prueba de nuevo en un momento."
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
            <Texto variante="apoyo">Estos datos son tuyos. No los ven las familias.</Texto>

            <Campo label={t('miCuenta.nombreLabel')} value={nombre} onChangeText={setNombre} autoCapitalize="words" />
            {/* La firma: el read-only DICE SU PORQUÉ. Un campo gris sin
                explicación se lee como error del producto. */}
            <Campo
              label={t('miCuenta.emailLabel')}
              value={email ?? ''}
              onChangeText={() => undefined}
              ayuda={t('miCuenta.emailAyuda')}
              deshabilitado
            />

            <View style={{ paddingTop: spacing[4] }}>
              <Boton etiqueta={t('miCuenta.guardar')} bloque cargando={guardando} onPress={() => void guardar()} />
            </View>
          </ScrollView>
        </EvitaTeclado>
      )}
    </View>
  );
}
