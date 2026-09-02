/**
 * LA VITRINA DEL REFUGIO, DEL LADO DE LA FAMILIA (S112-C · A6).
 *
 * Voz del founder: *«en la ficha de Luna toco el nombre del refugio y entro a
 * su vitrina»*.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **SE ENTRA POR CUENTA COMERCIAL, Y ESO NO ES UN DETALLE DE RUTEO.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El adoptable trae `publicadorId`, que es **`cc.id`** —la cuenta comercial—,
 * no el id del prestador. Durante un rato el lector público sólo sabía filtrar
 * por id de prestador: se podía *confirmar a qué cuenta pertenece un prestador
 * que ya encontraste*, y no encontrarlo. A entregó
 * `obtenerPerfilesPublicosPorCuenta` para cerrarlo.
 *
 * ⚠️ **Y la alternativa barata se descartó con su razón:** cada adoptable ya
 * trae `publicadorNombre` y `publicadorFoto`, así que la vitrina «se podía»
 * armar con eso. **No.** Eso es *deducir la identidad de una casa a partir de
 * uno de sus animales*, y se rompe exactamente cuando el refugio **no tiene
 * ninguno publicado** — que es cuando su vitrina más importa.
 *
 * ── LOS DOS VACÍOS SON DISTINTOS, Y SE DICEN DISTINTO ────────────────────
 * · **sin perfil** (el lector devuelve `[]`) → el refugio existe pero **no
 *   armó su página**. Lo dice `vozSinPagina`, que es de la pieza y **es
 *   obligatoria** justo para esto: sin ella la vitrina renderiza una pantalla
 *   en blanco con un nombre, indistinguible de un fallo de red (Ley 13).
 * · **sin animales publicados** → tiene página y todavía no publicó. Es otra
 *   frase, porque *nombrar mal un vacío manda a esperar lo que no va a venir.*
 *
 * ── ⚠️ LO QUE ESTA PANTALLA NO MUESTRA, POR SEGURIDAD Y NO POR RECORTE ───
 * **Ni teléfono, ni correo, ni dirección, ni coordenadas.** No es que se
 * filtren acá: **`v_prestadores_publicos` no los expone** y `VitrinaRefugio`
 * **no tiene props de zona** — B lo declaró como decisión, con su razón: *a la
 * puerta de un refugio la gente deja animales.* La lista blanca vive en el
 * servidor y en la pieza; esta pantalla no la re-implementa ni la puede
 * aflojar.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * 🔴 **PENDIENTE, y se declara en vez de fingirse:** `FichaAdoptable.publicador`
 * es `{nombre, fotoUrl, verificacion}` — **no tiene `onPress`**. Pedido a B con
 * el literal del founder. Hasta que llegue, esta pantalla existe y **no se
 * alcanza desde el producto** (`L-161`); no se le inventa una segunda entrada
 * en otro lado, porque *dos caminos a lo mismo le enseñan a la familia que son
 * dos cosas.*
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Boton,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  Hoja,
  MarcaDeAgua,
  TarjetaAdoptable,
  Texto,
  VitrinaRefugio,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerAdoptables,
  obtenerPerfilesPublicosPorCuenta,
  resolverUrlGenericaEspecie,
  resolverUrlLogoNegocio,
  resolverUrlsFotos,
  type Adoptable,
  type PerfilPublico,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | {
      fase: 'listo';
      /** `null` = existe pero no armó su página. **No es un fallo.** */
      perfil: PerfilPublico | null;
      /** El nombre sale de sus animales cuando no hay perfil: es lo único que
       *  se puede decir con verdad de un refugio sin página. */
      nombre: string | null;
      animales: Adoptable[];
      caras: Map<string, string>;
    };

export default function VitrinaDeRefugio() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const params = useLocalSearchParams<{ cuentaId?: string }>();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [explicandoAyuda, setExplicandoAyuda] = useState(false);

  const cargar = useCallback(async () => {
    const id = params.cuentaId;
    if (typeof id !== 'string' || id.length === 0) return setEstado({ fase: 'error' });
    /* En paralelo: el perfil y los animales no dependen uno del otro, y
       encadenarlos paga dos peajes de red por nada (`L-223`). */
    const [p, a] = await Promise.all([
      obtenerPerfilesPublicosPorCuenta([id]),
      obtenerAdoptables({ filtros: { publicadorId: id } }),
    ]);
    if (!p.ok && !a.ok) return setEstado({ fase: 'error' });
    const perfil = p.ok && p.data.length > 0 ? p.data[0] : null;
    const animales = a.ok ? [...a.data.destacados, ...a.data.resto] : [];
    const rutas = animales.map((x) => x.fotoUrl).filter((x): x is string => typeof x === 'string');
    const caras = rutas.length > 0 ? await resolverUrlsFotos(rutas) : new Map<string, string>();
    setEstado({
      fase: 'listo',
      perfil,
      /* Sin perfil, el nombre lo dicen sus propios animales. **Es la única
         excepción al principio de arriba y está acotada a un dato que la
         vidriera ya publica en cada fila** — no se arma la vitrina con eso: se
         evita un encabezado en blanco. Si tampoco hay animales, `null`, y la
         pieza lo dice con su propia voz. */
      nombre: perfil?.nombre_comercial ?? animales[0]?.publicadorNombre ?? null,
      animales,
      caras,
    });
  }, [params.cuentaId]);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        await cargar();
        if (!vigente) return;
      })();
      return () => {
        vigente = false;
      };
    }, [cargar]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('vitrinaRefugio.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/adoptar'))}
      />

      {estado.fase === 'cargando' ? (
        <View style={{ padding: spacing[5] }}>
          <EsqueletoGrupo>
            <Esqueleto alto={180} />
            <Esqueleto alto={90} />
          </EsqueletoGrupo>
        </View>
      ) : estado.fase === 'error' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('vitrinaRefugio.errorTitulo')}
            descripcion={t('vitrinaRefugio.errorDetalle')}
            accion={<Boton etiqueta={t('vitrinaRefugio.reintentar')} onPress={() => void cargar()} />}
          />
        </View>
      ) : (
        <VitrinaRefugio
          nombre={estado.nombre}
          logoUrl={resolverUrlLogoNegocio(estado.perfil?.foto_url ?? null)}
          portadas={estado.perfil?.portadas ?? undefined}
          historia={estado.perfil?.descripcion ?? null}
          ciudad={
            /* Ciudad y zona son dos campos y la pieza toma uno. Si falta uno no
               se dibuja un separador huérfano. */
            [estado.perfil?.ciudad, estado.perfil?.sector]
              .filter((x) => typeof x === 'string' && x.length > 0)
              .join(' · ') || null
          }
          vozSinPagina={t('vitrinaRefugio.sinPagina')}
          descripcionSinPagina={
            /* Sólo se promete ver sus animales **si los hay**: prometerlo con
               la lista vacía sería mandar a mirar algo que no está. */
            estado.animales.length > 0 ? t('vitrinaRefugio.sinPaginaPeroAnimales') : undefined
          }
          comoAyudar={{
            texto: t('vitrinaRefugio.comoAyudar'),
            onExplicar: () => setExplicandoAyuda(true),
            etiquetaExplicacion: t('vitrinaRefugio.comoAyudarEtiqueta'),
          }}
          pie={
            <View style={{ gap: spacing[4], paddingTop: spacing[4] }}>
              <Texto variante="seccion">{t('vitrinaRefugio.susAnimales')}</Texto>
              {estado.animales.length === 0 ? (
                /* Otro vacío, otra frase: **tiene página y todavía no publicó**
                   no es lo mismo que **no armó su página**. */
                <EstadoVacio
                  registro="seccion"
                  titulo={t('vitrinaRefugio.sinAnimalesTitulo')}
                  descripcion={t('vitrinaRefugio.sinAnimalesDetalle')}
                />
              ) : (
                estado.animales.map((a) => (
                  <TarjetaAdoptable
                    key={a.publicacionId}
                    nombre={a.nombre}
                    especie={t(`adoptar.especieVoz_${a.especie}` as 'adoptar.especieVoz_perro')}
                    raza={a.raza}
                    fotoUrl={a.fotoUrl === null ? null : (estado.caras.get(a.fotoUrl) ?? null)}
                    fotoDeEspecie={resolverUrlGenericaEspecie(a.especie)}
                    voces={{ edadNoInformada: t('vitrinaRefugio.edadNoInformada') }}
                    onPress={() =>
                      router.push({
                        pathname: '/adoptar/[publicacionId]',
                        params: { publicacionId: a.publicacionId },
                      })
                    }
                  />
                ))
              )}
            </View>
          }
        />
      )}

      <Hoja
        visible={explicandoAyuda}
        onCerrar={() => setExplicandoAyuda(false)}
        titulo={t('vitrinaRefugio.comoAyudar')}
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{t('vitrinaRefugio.comoAyudarPronto')}</Texto>
        </View>
      </Hoja>
    </View>
  );
}
