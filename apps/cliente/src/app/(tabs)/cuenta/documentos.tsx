/**
 * Cuenta · DOCUMENTOS DEL HOGAR (S89-D orden 7 ②, firma del founder).
 *
 * **Todos los papeles de la familia en un solo lugar** — el perfil de
 * cada mascota sigue teniendo los suyos (sección desplegable), y acá
 * viven TODOS: cuando la familia tiene tres mascotas, buscar la historia
 * clínica de una obligaba a entrar a su perfil. Ésta es la casa de los
 * papeles.
 *
 * DOS LEYES QUE LA GOBIERNAN, las dos medidas antes de construir:
 *
 * ① **La lista se DERIVA del catálogo de papeles, jamás a mano**
 *    (`lib/papeles.ts`): la grilla es mascotas × papeles, y el día que
 *    nazca `receta` aparece sola para todas. *El catálogo de MOTOR no
 *    existe todavía —el vocabulario vive en un CHECK— y por eso la
 *    derivación es por TIPO y EXHAUSTIVA: sumar un tipo rompe el
 *    typecheck. El pedido del catálogo a A está en la lámina.*
 * ② **El filtro por mascota usa el patrón VIVO de selección**:
 *    `FiltroMascotas` de `packages/ui` — chips con avatar y la PATA
 *    pisando lo elegido (`MarcaEleccion`, S82 r37). Cero componente
 *    nuevo: la pieza ya existía y ya la usa el log del Hogar.
 *
 * Escalera (§4b): peldaño 0 = sin mascotas, vacío honesto; peldaño 1 =
 * la grilla tal cual; la densidad llega con papeles nuevos, no con
 * versión.
 */

import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FiltroMascotas,
  Separador,
  Tarjeta,
  Texto,
  spacing,
  typography,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  resolverUrlFoto,
  listarPapelesDeMascota,
  type ConsultaConReceta,
  type TipoDocumentoExpediente,
} from '@epetplace/api';
import { Linking } from 'react-native';

import { useTraduccion } from '@/i18n';
import { PAPELES_DE_MASCOTA, componerPapeles } from '@/lib/papeles';
import { abrirReceta, resolverDescarga, type Descarga } from '@/lib/descarga-papel';
import { FilaDocumento } from '@/components/fila-documento';
import { HojaReceta } from '@/components/hoja-receta';

interface MascotaConFoto {
  id: string;
  nombre: string;
  fotoUrl?: string;
}

/** El rótulo de bloque — mismo patrón que el índice de Cuenta
 *  (copiar-al-vecino: la casa ya tenía su forma, no se reinventa). */
function TituloBloque({ texto }: { texto: string }) {
  const { theme } = useTheme();
  return (
    <Text
      style={{
        fontFamily: typography.family.mono.regular,
        fontSize: typography.size.xs,
        color: theme.text.secondary,
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[2],
      }}
    >
      {texto}
    </Text>
  );
}

export default function DocumentosDelHogar() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const { mostrar } = useAviso();

  const [mascotas, setMascotas] = useState<MascotaConFoto[] | 'cargando' | 'error'>('cargando');


  // S90 (firma founder): la lista deriva del CATALOGO VIVO; el estado

  // arranca con el respaldo de compilacion (misma foto al dia del build).

  const [papeles, setPapeles] = useState(PAPELES_DE_MASCOTA);
  const [elegida, setElegida] = useState<string | null>(null);
  /** La descarga en vuelo, por mascota+papel: dos filas distintas pueden
   *  pedirse sin que la segunda apague el spinner de la primera. */
  const [bajando, setBajando] = useState<string | null>(null);
  /** S91-C: la consulta de la que sale la receta. Lleva `mascotaId`
   *  porque acá conviven TODAS las mascotas de la familia. */
  const [eligiendo, setEligiendo] = useState<{
    mascotaId: string;
    consultas: ConsultaConReceta[];
  } | null>(null);

  useEffect(() => {

    let vivo = true;

    void listarPapelesDeMascota().then((r) => {

      if (vivo && r.ok) setPapeles(componerPapeles(r.data));

    });

    return () => { vivo = false; };

  }, []);


  useEffect(() => {
    let vigente = true;
    void (async () => {
      const estado = await getEstadoOnboardingDueno();
      if (!vigente) return;
      if (!estado.ok || !estado.data.tiene_familia || estado.data.familia_id === null) {
        setMascotas('error');
        return;
      }
      const r = await obtenerMascotasDeFamilia(estado.data.familia_id);
      if (!vigente) return;
      if (!r.ok) {
        setMascotas('error');
        return;
      }
      setMascotas(r.data.map((m) => ({ id: m.id, nombre: m.nombre })));
      // Las caras, después y sin bloquear la lista (patrón del Hogar).
      void Promise.all(
        r.data.map(async (m) => ({
          id: m.id,
          url:
            m.foto_url === null || m.foto_url === undefined
              ? undefined
              : ((await resolverUrlFoto(m.foto_url)) ?? undefined),
        })),
      ).then((fotos) => {
        if (!vigente) return;
        const porId = new Map(fotos.map((f) => [f.id, f.url]));
        setMascotas((prev) =>
          Array.isArray(prev) ? prev.map((m) => ({ ...m, fotoUrl: porId.get(m.id) })) : prev,
        );
      });
    })();
    return () => {
      vigente = false;
    };
  }, []);

  /** Ejecuta lo que la resolución decidió. Ley 13: el fallo DICE que es
   *  fallo — y la AUSENCIA dice que es ausencia, en voz neutra: pintar de
   *  rojo «todavía no hay recetas» sería mentir sobre qué pasó. */
  async function ejecutar(d: Descarga) {
    if (d.modo === 'abrir') await Linking.openURL(d.url);
    else if (d.modo === 'falla') mostrar({ texto: d.mensaje, variante: 'error' });
    else if (d.modo === 'sinActos')
      mostrar({ texto: t('documentos.recetaSinConsultas'), variante: 'neutro' });
  }

  async function bajar(mascotaId: string, tipo: TipoDocumentoExpediente) {
    setBajando(`${mascotaId}:${tipo}`);
    const d = await resolverDescarga(mascotaId, tipo);
    setBajando(null);
    // El único modo que esta pantalla retiene: la elección necesita saber
    // DE QUÉ MASCOTA es (acá conviven varias — ésa es la casa de todas).
    if (d.modo === 'elegir') {
      setEligiendo({ mascotaId, consultas: d.consultas });
      return;
    }
    await ejecutar(d);
  }

  async function elegirConsulta(citaId: string) {
    const ctx = eligiendo;
    if (ctx === null) return;
    setEligiendo(null);
    setBajando(`${ctx.mascotaId}:receta`);
    const d = await abrirReceta(ctx.mascotaId, citaId);
    setBajando(null);
    await ejecutar(d);
  }

  const lista = Array.isArray(mascotas) ? mascotas : [];
  const visibles = elegida === null ? lista : lista.filter((m) => m.id === elegida);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <Encabezado
        variante="navegacion"
        titulo={t('documentos.titulo')}
        atras
        onAtras={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing[6],
          gap: spacing[5],
        }}
      >
        {mascotas === 'cargando' ? (
          <View style={{ padding: spacing[5] }}>
            <EsqueletoGrupo>
              <View style={{ gap: spacing[3] }}>
                <Esqueleto alto={56} />
                <Esqueleto alto={56} />
              </View>
            </EsqueletoGrupo>
          </View>
        ) : mascotas === 'error' ? (
          <View style={{ padding: spacing[5] }}>
            <EstadoVacio
              registro="pantalla"
              titulo={t('documentos.errorTitulo')}
              descripcion={t('documentos.errorDetalle')}
            />
          </View>
        ) : lista.length === 0 ? (
          <View style={{ padding: spacing[5] }}>
            <EstadoVacio
              registro="pantalla"
              titulo={t('documentos.vacioTitulo')}
              descripcion={t('documentos.vacioDetalle')}
            />
          </View>
        ) : (
          <>
            <View style={{ paddingTop: spacing[4], paddingHorizontal: spacing[5] }}>
              <Texto variante="apoyo" color="secondary">
                {t('documentos.ley')}
              </Texto>
            </View>

            {/* El filtro con PATA — solo si hay a quién filtrar (con una
                mascota, una hilera de un chip es ruido). */}
            {lista.length > 1 ? (
              <FiltroMascotas mascotas={lista} elegida={elegida} onElegir={setElegida} />
            ) : null}

            {visibles.map((m) => (
              <View key={m.id}>
                <TituloBloque texto={m.nombre} />
                <View style={{ paddingHorizontal: spacing[5] }}>
                  <Tarjeta relleno="ninguno" elevacion="reposo">
                    {papeles.map((papel, i) => (
                      <View key={papel.tipo}>
                        {i > 0 ? <Separador /> : null}
                        <FilaDocumento
                          icono={papel.icono}
                          nombre={t(`documentos.nombre${papel.claveVoz}`)}
                          apoyo={t('documentos.descargar')}
                          cargando={bajando === `${m.id}:${papel.tipo}`}
                          onPress={() => {
                            void bajar(m.id, papel.tipo);
                          }}
                        />
                      </View>
                    ))}
                  </Tarjeta>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <HojaReceta
        consultas={eligiendo?.consultas ?? null}
        onElegir={(citaId) => void elegirConsulta(citaId)}
        onCerrar={() => setEligiendo(null)}
      />
    </View>
  );
}
