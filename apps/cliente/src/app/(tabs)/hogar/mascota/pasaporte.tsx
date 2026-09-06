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
import { Platform, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AccionesPasaporte,
  ConfiguracionPasaporte,
  Encabezado,
  EsperaDeMarca,
  EstadoVacio,
  TarjetaPasaporte,
  Texto,
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

const BASE = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const urlPublica = (token: string) => `${BASE}/functions/v1/pasaporte?t=${token}`;
const urlQrPng = (token: string) => `${BASE}/functions/v1/pasaporte/${token}.png`;

export default function Pasaporte() {
  const { t } = useTraduccion();
  const router = useRouter();
  const aviso = useAviso();
  const { mascotaId } = useLocalSearchParams<{ mascotaId: string }>();

  const [perfil, setPerfil] = useState<PerfilMascota | 'cargando' | 'error'>('cargando');
  const [token, setToken] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | undefined>(undefined);
  const [perdida, setPerdida] = useState(false);
  const [vis, setVis] = useState<VisibilidadPasaporte>({ contacto: true, salud: true, chip: true });
  const [trabajando, setTrabajando] = useState(false);

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
      const enMemoria = p.data.mascota.estado_vida !== null && p.data.mascota.estado_vida !== 'activa' && p.data.mascota.estado_vida !== 'perdida';
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
  const enMemoria = m.estado_vida !== null && m.estado_vida !== 'activa' && m.estado_vida !== 'perdida';

  /* 🔴 **En memorial la pantalla NO SE DIBUJA**, y lo dice con la voz serena de
     la casa en vez de un error: la familia llegó acá por un camino que ya no
     debería existir, y culparla de eso sería del producto, no de ella. */
  if (enMemoria) {
    return (
      <View style={{ flex: 1 }}>
        <Encabezado variante="navegacion" titulo={t('pasaporte.titulo')} />
        <EstadoVacio titulo={t('pasaporte.enMemoria', { nombre: m.nombre })} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Encabezado variante="navegacion" titulo={t('pasaporte.titulo')} />
      <View style={{ padding: spacing[5], gap: spacing[5] }}>
        {token === null ? (
          <EsperaDeMarca />
        ) : (
          <>
            <TarjetaPasaporte
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

            <AccionesPasaporte
              vozCompartir={t('pasaporte.compartir')}
              onCompartir={() => void Share.share({ message: urlPublica(token) })}
              vozDescargarQr={t('pasaporte.descargarQr')}
              /* ⚠️ **La descarga abre la imagen del servidor**, no la guarda en
                 la galería: guardar exige un permiso nativo que esta app no
                 tiene, y el brief dice que **si no existe, se pide a la mesa
                 antes de agregar nada nativo**. Anotado; esto entrega el
                 archivo igual, por el navegador. */
              onDescargarQr={() => void Share.share({ message: urlQrPng(token) })}
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
                onCompartir={() => void Share.share({ message: urlPublica(token) })}
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
    </View>
  );
}
