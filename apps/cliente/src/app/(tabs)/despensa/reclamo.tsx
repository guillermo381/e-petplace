/**
 * EL RECLAMO DEL CÓDIGO — la compra del local entra al expediente
 * (S96-D · D-B5 · `LETRA_RECORRIDO_DESPENSA_S96` §4).
 *
 * TESIS (Ley 14): *la factura es la invitación — el código la convierte
 * en historia.*
 *
 * FIRMA (Ley 15): LA MASCOTA LA ELIGE EL DUEÑO, JAMÁS EL VENDEDOR. El vet
 * registró la venta CONTRA NADIE y su factura lleva un código; acá el
 * dueño lo mete, elige a quién, y recién entonces nace el evento. La
 * pantalla del vendedor para buscar personas NO EXISTE — no hay nada que
 * limitar (§7.4 de MODELO_DESPENSA, sin excepción).
 *
 * CHANEL (Ley 16): cero explicación del mecanismo interno (ventas, ids,
 * expiraciones) — el dueño ve tres cosas: el código, sus mascotas, y qué
 * pasó. Los rebotes hablan con la voz tipada del motor (`codigo_invalido`
 * · `compra_ya_reclamada` · `codigo_expirado` — 90 días).
 *
 * ESCALERA (§4b): peldaño 0 = solo el código (sin mascotas elegibles la
 * pantalla lo dice y ofrece registrar) · peldaño 1 = código + mascota →
 * el evento nace · peldaño 2 = multi-mascota eligiendo con la cara.
 *
 * TESTS (§10): voz de familia · error dice qué pasó · cero códigos de
 * motor a la vista.
 */

import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Campo,
  Encabezado,
  EstadoVacio,
  SelectorOpcion,
  Texto,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  mascotasElegibles,
  obtenerMascotasDeFamilia,
  reclamarCompraMostrador,
  resolverUrlFoto,
  type MascotaResumen,
} from '@epetplace/api';
import { useTraduccion } from '@/i18n';
import { caraDeMascotaPorRuta } from '@/lib/cara-mascota';

type Fase<T> = T | 'cargando' | 'error';

export default function DespensaReclamo() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const { mostrar } = useAviso();
  const insets = useSafeAreaInsets();

  const [mascotas, setMascotas] = useState<Fase<MascotaResumen[]>>('cargando');
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [codigo, setCodigo] = useState('');
  const [mascotaId, setMascotaId] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [reclamada, setReclamada] = useState<string | null>(null); // nombre de la mascota

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const estado = await getEstadoOnboardingDueno();
        if (!vigente) return;
        if (!estado.ok || !estado.data.familia_id) {
          setMascotas('error');
          return;
        }
        const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
        if (!vigente) return;
        setMascotas(r.ok ? r.data : 'error');
        if (!r.ok) return;
        const conFoto = r.data.filter(
          (m): m is MascotaResumen & { foto_url: string } => m.foto_url !== null,
        );
        if (conFoto.length === 0) return;
        const urls = await Promise.all(conFoto.map((m) => resolverUrlFoto(m.foto_url)));
        if (!vigente) return;
        const mapa: Record<string, string> = {};
        conFoto.forEach((m, i) => {
          const u = urls[i];
          if (u !== null) mapa[m.id] = u;
        });
        setFotos(mapa);
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  const elegibles = useMemo(
    () => mascotasElegibles(Array.isArray(mascotas) ? mascotas : [], null),
    [mascotas],
  );

  // Con UNA sola elegible se elige sola (Ley 23) — y la cara lo dice.
  const elegida = mascotaId ?? (elegibles.length === 1 ? elegibles[0].id : null);

  const falta: string | null =
    codigo.trim().length === 0
      ? t('despensa.reclamoFaltaCodigo')
      : elegida === null
        ? t('despensa.reclamoFaltaMascota')
        : null;

  async function reclamar() {
    if (trabajando || falta !== null || elegida === null) return;
    setTrabajando(true);
    const r = await reclamarCompraMostrador(codigo, elegida);
    setTrabajando(false);
    if (!r.ok) {
      // Los rebotes del motor tienen voz propia y honesta: código
      // inválido / ya reclamada / vencido a los 90 días.
      mostrar({ texto: r.mensaje, variante: 'error' });
      return;
    }
    setReclamada(elegibles.find((m) => m.id === elegida)?.nombre ?? '');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('despensa.reclamoTitulo')}
        atras
        onAtras={() => router.back()}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
          gap: spacing[5],
        }}
      >
        {reclamada !== null ? (
          /* El cierre emocional: la compra ya es parte de su historia. */
          <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
            <Texto variante="titulo">{t('despensa.reclamoListoTitulo')}</Texto>
            <Texto variante="cuerpo">
              {t('despensa.reclamoListoDetalle', { nombre: reclamada })}
            </Texto>
            <Boton
              etiqueta={t('despensa.reclamoVolver')}
              bloque
              onPress={() => router.back()}
            />
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <Texto variante="cuerpo">{t('despensa.reclamoIntro')}</Texto>
              <Campo
                label={t('despensa.reclamoCodigoLabel')}
                value={codigo}
                onChangeText={setCodigo}
                placeholder={t('despensa.reclamoCodigoPlaceholder')}
                autoCapitalize="characters"
              />
            </View>

            {mascotas === 'cargando' ? null : mascotas === 'error' ? (
              <View style={{ paddingHorizontal: spacing[5] }}>
                <Texto variante="apoyo" color="warning">
                  {t('despensa.errorMascotasTitulo')}
                </Texto>
              </View>
            ) : elegibles.length === 0 ? (
              /* Peldaño 0 honesto: sin mascota no hay expediente que
                 reciba la compra — el camino es registrarla. */
              <EstadoVacio
                registro="seccion"
                titulo={t('despensa.reclamoSinMascotasTitulo')}
                descripcion={t('despensa.reclamoSinMascotasDetalle')}
                accion={
                  <Boton
                    variante="secundario"
                    etiqueta={t('despensa.registrarla')}
                    onPress={() => router.push('/hogar/agregar')}
                  />
                }
              />
            ) : (
              <View style={{ paddingHorizontal: spacing[5] }}>
                <SelectorOpcion
                  etiqueta={t('despensa.paraQuien')}
                  entidad
                  disposicion="columnas"
                  acento="control"
                  opciones={elegibles.map((m) => ({
                    codigo: m.id,
                    etiqueta: m.nombre,
                    avatar: {
                      nombre: m.nombre,
                      fotoUrl: caraDeMascotaPorRuta({
                        especie: m.especie,
                        rutaImagen: m.raza_ruta_imagen,
                        fotoUri: fotos[m.id],
                      }),
                    },
                  }))}
                  seleccionada={elegida ?? undefined}
                  onSelect={setMascotaId}
                />
              </View>
            )}

            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              {falta !== null ? <Texto variante="apoyo">{falta}</Texto> : null}
              <Boton
                etiqueta={t('despensa.reclamoCta')}
                bloque
                cargando={trabajando}
                deshabilitado={falta !== null}
                onPress={() => void reclamar()}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
