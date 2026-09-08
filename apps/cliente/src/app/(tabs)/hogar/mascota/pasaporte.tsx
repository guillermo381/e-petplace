/**
 * ⭐ **EL PASAPORTE** (S113-C · 1.3 · C1–C5).
 *
 * La chapita del collar y su página. **Su lector no es la familia**: es alguien
 * en la calle, con una mano ocupada, con un animal que no conoce. *Todo lo que
 * esta pantalla configure mal se lee allá.*
 *
 * ── LO QUE SE MIDIÓ ANTES ──────────────────────────────────────────────────
 * · La URL pública y el QR salen de la edge de A, **medidos en su fuente**:
 *   `…/functions/v1/pasaporte?t=<token>` · `…/pasaporte/<token>.png`.
 *   ⇒ **el QR es una imagen del servidor**, no se genera acá: la pieza de B lo
 *   dice explícito —*ninguna pieza de la casa genera el código, y una
 *   dependencia nueva no viaja por OTA*—.
 * · `sePintaPasaporte({ enMemoria })` de B: **en memorial no existe**. No se
 *   atenúa ni se deshabilita — *un pasaporte es para encontrar a alguien que se
 *   perdió, y ofrecérselo a una familia que ya despidió a su mascota es no
 *   haber leído la pantalla.*
 *
 * 🔴 **PRIMERA VEZ: se emite al abrir.** No hay botón «crear pasaporte»: *una
 * pantalla que existe para dar una URL y arranca pidiendo permiso para
 * dársela no está protegiendo nada.* Emitir es idempotente del lado del motor.
 */
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, Share, View } from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AccionesPasaporte,
  ConfiguracionPasaporte,
  Encabezado,
  EsperaDeMarca,
  EstadoVacio,
  TarjetaPasaporte,
  Texto,
  useTheme,
  sobreVideo,
  spacing,
  useAviso,
  type VisibilidadPasaporte,
} from '@epetplace/ui';
import {
  configurarPasaporte,
  emitirPasaporte,
  marcarPerdida,
  obtenerPerfilMascota,
  resolverUrlFoto,
  revocarPasaporte,
  type PerfilMascota,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { esMemorial as mascotaEnMemorial } from '@/lib/memorial';

const BASE = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
/** 🔴 **LA PÁGINA VIVE EN EL SITIO, no en la edge.** La edge quedó con
 *  `?formato=json` y el QR. Medido por GET: `text/html`, `noindex`, y el
 *  navegador la renderiza — el `text/plain` que reporté se fue con la mudanza. */
const urlPublica = (token: string) => `https://www.epetplace.com/p/${token}`;
const urlQrPng = (token: string) => `${BASE}/functions/v1/pasaporte/${token}.png`;

export default function Pasaporte() {
  const { t } = useTraduccion();
  const { theme } = useTheme();
  const router = useRouter();
  const aviso = useAviso();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  const [token, setToken] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | undefined>(undefined);
  const [perdida, setPerdida] = useState(false);
  const [vis, setVis] = useState<VisibilidadPasaporte>({ contacto: true, salud: true, chip: true });
  const [trabajando, setTrabajando] = useState(false);
  /** La vista previa de lo que ve un extraño, y el QR a pantalla completa. */
  const [viendo, setViendo] = useState(false);
  const [qrGrande, setQrGrande] = useState(false);

  /* Perfil + emisión, en el mismo efecto: la tarjeta necesita las dos cosas y
     mostrar media tarjeta mientras llega la otra es peor que esperar. */
  useEffect(() => {
    if (mascotaId === undefined) return;
    let vivo = true;
    void (async () => {
      const p = await obtenerPerfilMascota(mascotaId);
      if (!vivo) return;
      if (!p.ok) {
        setPerfil('error');
        return;
      }
      setPerfil(p.data);
      setPerdida(p.data.mascota.estado_vida === 'perdida');
      if (p.data.mascota.foto_url !== null) {
        const f = await resolverUrlFoto(p.data.mascota.foto_url);
        if (vivo && f !== null) setFoto(f);
      }
      /* 🔴 **En memorial NO se emite.** El motor lo rebota
         (`mascota_en_memorial`), pero pedirlo igual sería mandar a la familia
         un error que nosotros provocamos. */
      /* ⑤ **LA QUINTA DERIVACIÓN DE MEMORIAL, curada.** Acá decía
         `!== null && !== 'activa' && !== 'perdida'` — escrita a mano, con la
         regla de `perdida` embebida por casualidad. B censó CUATRO copias de
         esta lógica; ésta era la quinta y su censo quedó corto (avisado).
         *Una regla escrita cinco veces es cinco lugares donde puede cambiar
         una sola.* */
      const enMemoria = mascotaEnMemorial(p.data.mascota.estado_vida);
      if (enMemoria) return;
      const e = await emitirPasaporte(mascotaId);
      if (!vivo) return;
      if (e.ok) setToken(e.data.token);
      else aviso.mostrar({ variante: 'error', texto: e.mensaje });
    })();
    return () => {
      vivo = false;
    };
  }, [mascotaId, aviso]);

  /**
   * ⏳ **ESTE CONTROL SE RETIRA — firma del founder, 8-sep.** *Marcar que tu
   * perro se perdió no es una perilla de configuración: es un hecho de la vida
   * del animal.* La puerta buena YA VIVE en el perfil, en su zona «Su vida»
   * (`hogar/mascota/[mascotaId].tsx`), con la hoja de ayuda y su «Apareció».
   *
   * 🔴 **No lo puedo retirar desde acá**: las cuatro props de perdida de
   * `AccionesPasaporte` son OBLIGATORIAS (`perdida`, `vozPerdida`,
   * `vozConfirmarPerdida`, `onCambiarPerdida`) — medido. **El retiro es de B**
   * y está pedido; el día que salgan, esto y sus llaves mueren (Ley 37).
   *
   * En Pasaporte queda lo que sí es suyo: **la visibilidad del contacto**, que
   * es la promesa que la hoja del perfil hace y que acá se cumple.
   */
  const cambiarPerdida = useCallback(
    (v: boolean) => {
      if (mascotaId === undefined || trabajando) return;
      setTrabajando(true);
      void marcarPerdida(mascotaId, v).then((r) => {
        setTrabajando(false);
        if (!r.ok) {
          aviso.mostrar({ variante: 'error', texto: r.mensaje });
          return;
        }
        setPerdida(v);
        /* `yaEstaba` distingue «lo marcaste vos» de «ya estaba así». Sin eso,
           tocar dos veces se ve igual que no haber tocado. */
        if (r.data.yaEstaba) aviso.mostrar({ variante: 'neutro', texto: t('pasaporte.yaEstaba') });
      });
    },
    [mascotaId, trabajando, aviso, t],
  );

  const guardarVisibilidad = useCallback(
    (v: VisibilidadPasaporte) => {
      setVis(v);
      if (mascotaId === undefined) return;
      /* Se guarda al toque, sin botón de «guardar»: *un interruptor que hay que
         confirmar aparte se apaga en la pantalla y sigue encendido en la
         página, que es el único lugar donde importa.* */
      void configurarPasaporte(mascotaId, {
        mostrarContacto: v.contacto,
        mostrarSalud: v.salud,
        mostrarChip: v.chip,
        contactoNombre: null,
        contactoTelefono: null,
        contactoMensaje: null,
      }).then((r) => {
        if (!r.ok) aviso.mostrar({ variante: 'error', texto: r.mensaje });
      });
    },
    [mascotaId, aviso],
  );

  if (perfil === 'cargando') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <EsperaDeMarca />
      </View>
    );
  }
  if (perfil === 'error') {
    return <EstadoVacio titulo={t('pasaporte.noSePudo')} descripcion={t('pasaporte.noSePudoDetalle')} />;
  }

  const m = perfil.mascota;
  const enMemoria = mascotaEnMemorial(m.estado_vida);

  /* 🔴 **En memorial la pantalla NO SE DIBUJA**, y lo dice con la voz serena de
     la casa en vez de un error: la familia llegó acá por un camino que ya no
     debería existir, y culparla de eso sería del producto, no de ella. */
  if (enMemoria) {
    return (
      <View style={{ flex: 1 }}>
        {/* 🔴 **SIN ATRÁS, LA PANTALLA NO TENÍA SALIDA** (ojo del founder). Los
            DOS encabezados de esta ruta lo habían perdido —el de memorial y el
            normal—; el tercero, el del QR a pantalla completa, sí lo tenía.
            *Un callejón no se ve como defecto: se ve como que la app se
            colgó.* */}
      <Encabezado
        variante="navegacion"
        titulo={t('pasaporte.titulo')}
        atras
        onAtras={() => router.back()}
      />
        <EstadoVacio titulo={t('pasaporte.enMemoria', { nombre: m.nombre })} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 🔴 **SIN ATRÁS, LA PANTALLA NO TENÍA SALIDA** (ojo del founder). Los
            DOS encabezados de esta ruta lo habían perdido —el de memorial y el
            normal—; el tercero, el del QR a pantalla completa, sí lo tenía.
            *Un callejón no se ve como defecto: se ve como que la app se
            colgó.* */}
      <Encabezado
        variante="navegacion"
        titulo={t('pasaporte.titulo')}
        atras
        onAtras={() => router.back()}
      />
      <View style={{ padding: spacing[5], gap: spacing[5] }}>
        {token === null ? (
          <EsperaDeMarca />
        ) : (
          <>
            {/* 🔴 **EL QR SE TOCA Y SE AGRANDA.** Es lo que hace que OTRO
                teléfono lo lea: un código chico, en una pantalla a medio
                brillo, no escanea. *La acción no es decorativa — es la única
                forma de que la chapita funcione antes de existir en metal.* */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('pasaporte.ampliarQr')}
              onPress={() => setQrGrande(true)}
            >
            {/* 🔴 `enMemoria` pasa a ser OBLIGATORIA en la pieza (S114-B, orden
                del founder): su default `false` era el guard apagado por
                omisión, escrito en el tipo. **Acá la variable ya existía** —se
                calcula arriba con la regla que la firma del 7-sep ratificó,
                `&& !== 'perdida'`— así que la cura es pasarla.
                ⚠️ **Cruce de territorio declarado y MÍNIMO:** el cambio de API
                es de `packages/ui` (B) y esto es su única consecuencia en la
                app; una prop, cero lógica nueva. *Se toca acá porque dejar el
                árbol sin compilar para que otro escriba una palabra es peor que
                escribirla.* */}
            <TarjetaPasaporte
              enMemoria={enMemoria}
              nombre={m.nombre}
              fotoUrl={foto}
              especieYRaza={[m.especie, m.raza].filter((x) => x !== null && x !== '').join(' · ')}
              sexoYEdad={m.sexo ?? ''}
              chip={vis.chip && m.microchip !== null ? m.microchip : undefined}
              etiquetaChip={t('perfil.microchip')}
              /* Del SERVIDOR: la pieza no genera códigos y esta pantalla
                 tampoco. Llega dibujado. */
              qr={{ tipo: 'url', url: urlQrPng(token) }}
              vozQr={t('pasaporte.vozQr', { nombre: m.nombre })}
              estado={perdida ? { estado: 'perdida', desde: t('pasaporte.desdeHoy') } : { estado: 'activo' }}
              vozPerdida={t('pasaporte.perdidaEnTarjeta')}
            />
            </Pressable>

            <AccionesPasaporte
              /* ⭐ **«VER EL PASAPORTE», no «compartir enlace».** Compartir el
                 enlace y compartir el QR eran **la misma cosa dos veces** —el
                 QR *es* el enlace—, y ninguna de las dos dejaba a la familia
                 ver lo que un extraño va a leer. *Configurar qué se muestra sin
                 poder mirarlo es firmar a ciegas.* Abre la página real, la
                 misma que sale del QR, dentro de la app. */
              vozCompartir={t('pasaporte.verPasaporte')}
              onCompartir={() => setViendo(true)}
              vozDescargarQr={t('pasaporte.compartirQr')}
              /* ⭐ **«COMPARTIR EL QR», no «descargar»** (firma del founder).
                 Se manda **la imagen del servidor** al share del sistema, que
                 es lo que ya ofrece WhatsApp, Gmail y guardar en Archivos **sin
                 pedir un solo permiso**.

                 ⚠️ **Y lo que este share NO hace, medido:** `Share` de RN sólo
                 lleva texto y `url`; **`url` la respeta iOS y Android la
                 ignora**. Para poner el ARCHIVO en la hoja del sistema —y que
                 aparezca «Fotos»— hace falta `expo-sharing`, que **no está
                 instalado** (medido) y **es nativo: no viaja por OTA**.
                 ⇒ Hoy se comparte el enlace a la imagen, que abre y se guarda
                 desde el navegador. *El archivo entra con la build, junto al
                 permiso de galería y NFC* — anotado en `S113-NFC-BUILD.md`.

                 🔴 **«Guardar en galería» no se dibuja**, y es la misma razón:
                 sin el permiso nativo el botón existiría para fallar. *Un
                 control que promete guardar y no puede es peor que su
                 ausencia.* */
              onDescargarQr={() =>
                void Share.share({ message: urlQrPng(token), url: urlQrPng(token) })
              }
              perdida={perdida}
              vozPerdida={perdida ? t('pasaporte.yaAparecio') : t('pasaporte.sePerdio')}
              vozConfirmarPerdida={perdida ? t('pasaporte.confirmarAparecio') : t('pasaporte.confirmarPerdida')}
              onCambiarPerdida={cambiarPerdida}
            />

            <ConfiguracionPasaporte
              visibilidad={vis}
              onCambiar={guardarVisibilidad}
              /* 🔴 La pieza pide **la CONSECUENCIA, no la descripción del
                 campo** —*«quien encuentre a Thor va a ver tu teléfono»*— y
                 tiene razón: un interruptor de privacidad que explica qué es el
                 campo no ayuda a decidir; el que dice qué va a pasar, sí. Por
                 eso el texto nombra a la mascota. */
              opciones={{
                contacto: { etiqueta: t('pasaporte.optContacto'), consecuencia: t('pasaporte.optContactoDetalle', { nombre: m.nombre }) },
                salud: { etiqueta: t('pasaporte.optSalud'), consecuencia: t('pasaporte.optSaludDetalle', { nombre: m.nombre }) },
                chip: { etiqueta: t('pasaporte.optChip'), consecuencia: t('pasaporte.optChipDetalle', { nombre: m.nombre }) },
              }}
            />

            {/* C5 · revocar. **Va al final y con su consecuencia dicha**: la
                placa impresa deja de funcionar, y eso no se descubre después. */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">{t('pasaporte.revocarAviso')}</Texto>
              <AccionesPasaporte
                vozCompartir={t('pasaporte.verComoLoVen')}
                onCompartir={() => setViendo(true)}
                vozDescargarQr={t('pasaporte.emitirNuevo')}
                onDescargarQr={() => {
                  if (mascotaId === undefined || trabajando) return;
                  setTrabajando(true);
                  void revocarPasaporte(mascotaId).then(async (r) => {
                    if (!r.ok) {
                      setTrabajando(false);
                      aviso.mostrar({ variante: 'error', texto: r.mensaje });
                      return;
                    }
                    const e = await emitirPasaporte(mascotaId);
                    setTrabajando(false);
                    if (e.ok) {
                      setToken(e.data.token);
                      aviso.mostrar({ variante: 'exito', texto: t('pasaporte.emitido') });
                    } else aviso.mostrar({ variante: 'error', texto: e.mensaje });
                  });
                }}
                perdida={perdida}
                vozPerdida={perdida ? t('pasaporte.yaAparecio') : t('pasaporte.sePerdio')}
                vozConfirmarPerdida={perdida ? t('pasaporte.confirmarAparecio') : t('pasaporte.confirmarPerdida')}
                onCambiarPerdida={cambiarPerdida}
              />
            </View>
          </>
        )}
      </View>

      {/* ⭐ **LA VISTA PREVIA: lo que ve un extraño, sin salir de la app.**
          Es la MISMA página que sale del QR —no una maqueta— porque *una vista
          previa que no es la cosa real deja de servir justo cuando cambia algo:
          se sigue viendo linda y ya no dice la verdad.* */}
      {viendo && token !== null ? (
        <Modal visible animationType="slide" onRequestClose={() => setViendo(false)}>
          <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
            {/* 🔴 **CIERRA CON EL CHEVRON DE LA CASA, no con la palabra.** El
                founder lo vio en aparato: «Cerrar» como texto **se corta**.
                `atras` dibuja el chevron que esta app ya usa en todas sus
                pantallas — *un control que la persona reconoce de memoria no
                necesita que le expliquen qué hace, y no hay texto que recortar.* */}
            <Encabezado
              variante="navegacion"
              titulo={t('pasaporte.verPasaporte')}
              atras
              onAtras={() => setViendo(false)}
            />
            <WebView source={{ uri: urlPublica(token) }} style={{ flex: 1 }} />
          </View>
        </Modal>
      ) : null}

      {/* ⭐ **EL QR A PANTALLA COMPLETA.** Sobre blanco puro y con el mayor lado
          posible: un lector necesita contraste y tamaño, no un rectángulo
          bonito. ⚠️ **El brillo NO se sube**, y no por olvido: `expo-brightness`
          **no está instalado en ninguna app** (medido) y es nativo — no viaja
          por OTA. Entra con la build; queda en `S113-NFC-BUILD.md`. */}
      {qrGrande && token !== null ? (
        <Modal visible animationType="fade" onRequestClose={() => setQrGrande(false)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('pasaporte.cerrar')}
            onPress={() => setQrGrande(false)}
            /* 🔴 **El blanco sale del token, no de un hex.** R35 lo cazó y
               tiene razón: un `#FFFFFF` a mano no resuelve por tema. Se usa
               `sobreVideo.contenido` —el papel PLENO de la casa— porque acá el
               fondo **tiene que ser blanco en los tres temas**: un lector de QR
               necesita contraste, y en oscuro un fondo que se adapta lo
               apagaría. *Es el mismo token que la casa ya usa para contenido
               que no puede ceder ante el tema.* */
            style={{ flex: 1, backgroundColor: sobreVideo.contenido, alignItems: 'center', justifyContent: 'center', padding: spacing[5], gap: spacing[4] }}
          >
            <Image
              source={{ uri: urlQrPng(token) }}
              contentFit="contain"
              style={{ width: '100%', aspectRatio: 1, maxWidth: 420 }}
            />
            <Texto variante="apoyo">{t('pasaporte.qrGrandeAyuda')}</Texto>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}