/**
 * La foto de la mascota · EDITAR (S82-A — la otra mitad del mandato:
 * onboarding + editar). Lámina-acuerdo 2026-07-29.
 *
 * Entra desde el perfil (tap en el avatar). Tres estados:
 *   · con foto → el editor de ENCUADRE sobre la foto vigente (encuadre
 *     inicial = el declarado en DB; las dims se leen con Image.getSize
 *     sobre la URL firmada — el path del bucket no las guarda).
 *   · foto nueva elegida → editor sobre la local (encuadre default).
 *   · sin foto → la invitación (huella digna) + elegir.
 * Guardar = subirAvatar (si hay foto nueva) + declararFotoMascota
 * (encuadre siempre; el path solo si cambió) → Aviso y back.
 */

import { useEffect, useState } from 'react';
import { Image as ImagenRN, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AvatarMascota,
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  Texto,
  spacing,
  useAviso,
  useTheme,
  type FotoCapturada,
} from '@epetplace/ui';
import { declararFotoMascota, obtenerPerfilMascota, obtenerSesion, resolverUrlFoto } from '@epetplace/api';

import { EncuadreFoto } from '@/components/EncuadreFoto';
import { HojaFotoMascota } from '@/components/HojaFotoMascota';
import { ENCUADRE_DEFAULT, clampEncuadre, type DimFoto, type Encuadre } from '@/components/foto-encuadre';
import { subirAvatar } from '@/lib/subir-avatar';
import { esEspecieUi } from '@/lib/params';
import { useTraduccion } from '@/i18n';

type FotoVigente =
  | { t: 'cargando' }
  | { t: 'sin_foto' }
  | { t: 'lista'; url: string; dim: DimFoto; inicial: Encuadre }
  | { t: 'error'; mensaje: string };

export default function FotoMascota() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();
  const params = useLocalSearchParams<{ mascotaId: string; nombre?: string }>();
  const mascotaId = params.mascotaId ?? '';
  const [nombre, setNombre] = useState(params.nombre ?? '');
  const [especie, setEspecie] = useState<string | undefined>(undefined);

  const [vigente, setVigente] = useState<FotoVigente>({ t: 'cargando' });
  const [fotoNueva, setFotoNueva] = useState<FotoCapturada | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  // r3 paso 2: mientras el gesto vive, el scroll padre NO compite.
  const [gestoActivo, setGestoActivo] = useState(false);
  // El encuadre vigente del editor (ref-como-estado: el editor reporta al
  // soltar cada gesto; guardar lee lo último).
  const [encuadre, setEncuadre] = useState<Encuadre>(ENCUADRE_DEFAULT);

  useEffect(() => {
    let vive = true;
    void (async () => {
      const r = await obtenerPerfilMascota(mascotaId);
      if (!vive) return;
      if (!r.ok) {
        setVigente({ t: 'error', mensaje: r.mensaje });
        return;
      }
      setNombre(r.data.mascota.nombre);
      if (esEspecieUi(r.data.mascota.especie)) setEspecie(r.data.mascota.especie);
      const declarado: Encuadre = {
        cx: r.data.mascota.foto_cx,
        cy: r.data.mascota.foto_cy,
        z: r.data.mascota.foto_z,
      };
      setEncuadre(declarado);
      if (r.data.mascota.foto_url === null) {
        setVigente({ t: 'sin_foto' });
        return;
      }
      const url = await resolverUrlFoto(r.data.mascota.foto_url);
      if (!vive) return;
      if (url === null) {
        setVigente({ t: 'error', mensaje: t('fotoEncuadre.errorCargar') });
        return;
      }
      // El path del bucket no guarda dimensiones: se leen de la imagen.
      ImagenRN.getSize(
        url,
        (w, h) => {
          if (!vive) return;
          setVigente({ t: 'lista', url, dim: { iw: w, ih: h }, inicial: declarado });
        },
        () => {
          if (!vive) return;
          setVigente({ t: 'error', mensaje: t('fotoEncuadre.errorCargar') });
        },
      );
    })();
    return () => {
      vive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascotaId]);

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    setErrorGuardar(null);

    let fotoPath: string | undefined;
    if (fotoNueva !== null) {
      const sesion = await obtenerSesion();
      if (!sesion.ok || sesion.data === null) {
        setGuardando(false);
        setErrorGuardar(t('carnet.sesionInactiva'));
        return;
      }
      const subida = await subirAvatar({ uri: fotoNueva.uri, userId: sesion.data.user_id });
      if (!subida.ok) {
        setGuardando(false);
        setErrorGuardar(t('alta.errorFoto'));
        return;
      }
      fotoPath = subida.path;
    }

    const dim: DimFoto | null =
      fotoNueva !== null
        ? { iw: fotoNueva.width, ih: fotoNueva.height }
        : vigente.t === 'lista'
          ? vigente.dim
          : null;
    // El clamp del mandato también en la puerta de salida: lo guardado
    // jamás deja el recorte fuera de la foto.
    const e = dim !== null ? clampEncuadre(dim, encuadre) : encuadre;

    const r = await declararFotoMascota(mascotaId, { cx: e.cx, cy: e.cy, z: e.z }, fotoPath);
    setGuardando(false);
    if (!r.ok) {
      setErrorGuardar(r.mensaje);
      return;
    }
    mostrar({ texto: t('fotoEncuadre.exito', { nombre }), variante: 'exito' });
    router.back();
  }

  const editorUri = fotoNueva !== null ? fotoNueva.uri : vigente.t === 'lista' ? vigente.url : null;
  const editorDim: DimFoto | null =
    fotoNueva !== null ? { iw: fotoNueva.width, ih: fotoNueva.height } : vigente.t === 'lista' ? vigente.dim : null;
  const editorInicial: Encuadre =
    fotoNueva !== null ? ENCUADRE_DEFAULT : vigente.t === 'lista' ? vigente.inicial : ENCUADRE_DEFAULT;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('fotoEncuadre.tituloEditar', { nombre })}
        atras
        onAtras={() => router.back()}
      />
      <ScrollView
        scrollEnabled={!gestoActivo}
        contentContainerStyle={{ padding: spacing[5], paddingTop: spacing[5], paddingBottom: insets.bottom + spacing[8], gap: spacing[5] }}
      >
        {vigente.t === 'cargando' && fotoNueva === null ? (
          <EsqueletoGrupo etiqueta={t('hogar.cargando')}>
            <View style={{ alignItems: 'center', gap: spacing[4] }}>
              <Esqueleto forma="bloque" alto={248} ancho={248} />
              <Esqueleto forma="linea" ancho="60%" />
            </View>
          </EsqueletoGrupo>
        ) : null}

        {vigente.t === 'error' && fotoNueva === null ? (
          <View style={{ alignItems: 'center', gap: spacing[4], paddingTop: spacing[6] }}>
            <Texto variante="cuerpo" centrado>
              {vigente.mensaje}
            </Texto>
            <Boton variante="secundario" bloque etiqueta={t('fotoEncuadre.elegirFoto')} onPress={() => setHojaAbierta(true)} />
          </View>
        ) : null}

        {vigente.t === 'sin_foto' && fotoNueva === null ? (
          <View style={{ alignItems: 'center', gap: spacing[4], paddingTop: spacing[6] }}>
            <AvatarMascota nombre={nombre} especie={esEspecieUi(especie) ? especie : undefined} tamano="lg" />
            <Texto variante="apoyo" centrado>
              {t('fotoEncuadre.elegirDetalle')}
            </Texto>
            <Boton variante="secundario" bloque etiqueta={t('fotoEncuadre.elegirFoto')} onPress={() => setHojaAbierta(true)} />
          </View>
        ) : null}

        {editorUri !== null && editorDim !== null ? (
          <>
            <EncuadreFoto
              key={editorUri}
              uri={editorUri}
              dim={editorDim}
              inicial={editorInicial}
              nombre={nombre}
              onCambio={setEncuadre}
              onInteraccion={setGestoActivo}
            />
            <Boton variante="ghost" bloque etiqueta={t('fotoEncuadre.cargarOtra')} onPress={() => setHojaAbierta(true)} />
          </>
        ) : null}

        {permisoDenegado ? (
          <Texto variante="apoyo" color="danger" centrado>
            {t('fotoEncuadre.permisoCamara')}
          </Texto>
        ) : null}
        {errorGuardar !== null ? (
          <Texto variante="apoyo" color="danger" centrado>
            {errorGuardar}
          </Texto>
        ) : null}

        {editorUri !== null ? (
          <Boton etiqueta={t('fotoEncuadre.listo')} bloque cargando={guardando} onPress={() => void guardar()} />
        ) : null}
      </ScrollView>

      <HojaFotoMascota
        visible={hojaAbierta}
        titulo={t('fotoEncuadre.hojaTitulo')}
        onCerrar={() => setHojaAbierta(false)}
        onFoto={(f) => {
          setPermisoDenegado(false);
          setEncuadre(ENCUADRE_DEFAULT);
          setFotoNueva(f);
        }}
        onPermisoDenegado={() => setPermisoDenegado(true)}
      />
    </View>
  );
}
