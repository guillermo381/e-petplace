/**
 * MI VITRINA — CÓMO SE PRESENTA EL REFUGIO (S112-C · A6).
 *
 * Voz del founder, literal: *«En Cuenta, el refugio tiene "Mi vitrina" igual
 * que un prestador: foto de portada, logo, nombre, ciudad y zona, nuestra
 * historia en texto, y la lista de nuestros animales publicados.»*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ES ESPEJO Y EDITOR EN LA MISMA PANTALLA, Y NO ES COMODIDAD.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La hermana del prestador (`como-te-ven`) es **sólo espejo**, y ahí está
 * bien: su vitrina la llenan otras pantallas del portal. **El refugio no tiene
 * esas pantallas** — su fila de `prestadores` la crea esta misma acción. Un
 * espejo sin editor le mostraría un cascarón y ningún camino para llenarlo,
 * que es el final mudo de Ley 17.5.
 *
 * *Y el orden importa: primero se ve, después se edita.* Un formulario suelto
 * le pide al refugio que imagine el resultado; el espejo se lo muestra y el
 * botón lo cambia.
 *
 * ── LO QUE SE MANDA ES LO QUE SE TOCÓ (contrato de A) ────────────────────
 * `poblar_vitrina_refugio` hace `COALESCE`: **lo que no se manda no se
 * borra**. Por eso el guardado compara contra lo cargado y envía sólo los
 * campos cambiados. *Un editor que manda el formulario entero vacía la
 * historia cada vez que alguien corrige la ciudad* — y ese defecto no tiene
 * síntoma hasta que alguien vuelve a mirar su página.
 *
 * ── LOS DOS «NO» SON DISTINTOS, Y SE DICEN DISTINTO ──────────────────────
 * · **`no_sos_refugio`** — se destraba pidiendo la verificación.
 * · **`ya_tenes_prestador`** — **hoy no lo destraba nadie**: `uq_prestadores_
 *   user_id` es 1 humano = 1 prestador, así que una clínica que además rescata
 *   no puede tener fila de refugio. **El código trae el oficio en `detalle`**,
 *   así que la frase nombra el oficio real en vez de un genérico.
 *
 * *Dos «no» que se resuelven distinto y se dicen igual son un solo «no» mal
 * escrito* — es la razón por la que se pidieron con códigos separados.
 *
 * ── ⚠️ LO QUE ESTA PANTALLA **NO** EDITA, Y NO ES OLVIDO ─────────────────
 * **La portada y el logo.** El founder los nombró, y hoy:
 * · la portada vive en `prestador_fotos` **con su propia puerta**;
 * · `poblarVitrinaRefugio` toma `logoUrl` — **una URL, no una subida**: sin el
 *   camino de storage, un campo de texto pidiendo una URL le trasladaría al
 *   refugio un problema que es nuestro.
 *
 * ⇒ **Se declara en la pantalla** (`sinFotosAun`) en vez de omitirse: *un
 * editor que no menciona la portada se lee como que la vitrina no tiene una.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * Cuenta → «Mi vitrina», **sólo si la cuenta es refugio** (`obtenerMiCuenta
 * Refugio`). Un veterinario no la ve: su vitrina es «Así te ven».
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Boton,
  Campo,
  Encabezado,
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  EvitaTeclado,
  Hoja,
  MarcaDeAgua,
  TarjetaAdoptable,
  Texto,
  VitrinaRefugio,
  spacing,
  useAviso,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerMiPrestador,
  obtenerMisAdoptables,
  poblarVitrinaRefugio,
  resolverUrlGenericaEspecie,
  resolverUrlLogoNegocio,
  resolverUrlsFotos,
  type MiAdoptable,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Lo cargado, para poder comparar y mandar SÓLO lo que cambió. */
interface Cargado {
  nombre: string | null;
  historia: string | null;
  ciudad: string | null;
  zona: string | null;
  logoUrl: string | null;
}

type Estado =
  | { fase: 'cargando' }
  | { fase: 'error' }
  /** Todavía no hay fila de prestador: la primera edición la crea. */
  | { fase: 'sinPagina' }
  | { fase: 'listo'; v: Cargado; animales: MiAdoptable[]; caras: Map<string, string> };

export default function MiVitrina() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const aviso = useAviso();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [historia, setHistoria] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [zona, setZona] = useState('');
  const [explicandoAyuda, setExplicandoAyuda] = useState(false);

  const cargar = useCallback(async () => {
    /* En paralelo: la identidad y sus animales no dependen una de la otra, y
       encadenarlas paga dos peajes de red por nada (`L-223`). */
    const [p, a] = await Promise.all([obtenerMiPrestador(), obtenerMisAdoptables()]);
    if (!p.ok) {
      /* 🔴 `sin_prestador` **no es un fallo acá**: es el estado normal de un
         refugio que todavía no armó su página, y esta pantalla existe para
         llenarlo. Confundirlos le diría «no pudimos cargar» a alguien que no
         tiene nada que cargar todavía (`L-178`). */
      return setEstado({ fase: p.codigo === 'sin_prestador' ? 'sinPagina' : 'error' });
    }
    const animales = a.ok ? a.data : [];
    const rutas = animales.map((x) => x.fotoUrl).filter((x): x is string => typeof x === 'string');
    const caras = rutas.length > 0 ? await resolverUrlsFotos(rutas) : new Map<string, string>();
    setEstado({
      fase: 'listo',
      v: {
        nombre: p.data.nombre_comercial,
        historia: p.data.descripcion,
        ciudad: p.data.ciudad,
        zona: p.data.sector,
        logoUrl: resolverUrlLogoNegocio(p.data.foto_url ?? null),
      },
      animales,
      caras,
    });
  }, []);

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

  function abrirEditor() {
    const v = estado.fase === 'listo' ? estado.v : null;
    setHistoria(v?.historia ?? '');
    setCiudad(v?.ciudad ?? '');
    setZona(v?.zona ?? '');
    setEditando(true);
  }

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    const antes = estado.fase === 'listo' ? estado.v : null;
    /* **Sólo lo que cambió.** El motor hace `COALESCE`, así que un campo
       ausente conserva su valor y uno vacío lo pisa: mandar el formulario
       entero borraría lo que no se tocó. Se compara contra lo cargado y no
       contra `''`, porque *«lo dejé igual» y «lo borré» son dos actos
       distintos y el motor no los puede distinguir solo.* */
    const campos: { historia?: string; ciudad?: string; zona?: string } = {};
    if (historia !== (antes?.historia ?? '')) campos.historia = historia.trim();
    if (ciudad !== (antes?.ciudad ?? '')) campos.ciudad = ciudad.trim();
    if (zona !== (antes?.zona ?? '')) campos.zona = zona.trim();
    if (Object.keys(campos).length === 0) {
      setGuardando(false);
      setEditando(false);
      return;
    }
    const r = await poblarVitrinaRefugio(campos);
    setGuardando(false);
    if (!r.ok) {
      /* Se ramifica por `codigo`, jamás por el mensaje (regla 35). Los dos
         «no» se resuelven distinto y por eso se dicen distinto. */
      if (r.codigo === 'no_sos_refugio') {
        return aviso.mostrar({ variante: 'error', texto: t('miVitrina.noSosRefugio') });
      }
      if (r.codigo === 'ya_tenes_prestador') {
        /* ⭐ **El oficio viaja en `detalle`**, y por eso la frase lo nombra.
           Sin él diría «con otro oficio» — cierto, y sin nada que hacer con
           esa información. */
        return aviso.mostrar({
          variante: 'error',
          texto:
            typeof r.detalle === 'string' && r.detalle.length > 0
              ? t('miVitrina.yaTenesPrestadorConOficio', { oficio: r.detalle })
              : t('miVitrina.yaTenesPrestador'),
        });
      }
      return aviso.mostrar({ variante: 'error', texto: r.mensaje });
    }
    setEditando(false);
    aviso.mostrar({ variante: 'exito', texto: t('miVitrina.guardado') });
    await cargar();
  }

  const VOZ_ESPECIE: Record<string, string> = {
    perro: t('miVitrina.especiePerro'),
    gato: t('miVitrina.especieGato'),
  };

  const publicados = estado.fase === 'listo' ? estado.animales.filter((a) => a.estado === 'publicada') : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <MarcaDeAgua />
      <Encabezado
        variante="navegacion"
        titulo={t('miVitrina.titulo')}
        atras
        onAtras={() => (router.canGoBack() ? router.back() : router.replace('/cuenta'))}
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
            titulo={t('miVitrina.errorTitulo')}
            descripcion={t('miVitrina.errorDetalle')}
            accion={<Boton etiqueta={t('miVitrina.reintentar')} onPress={() => void cargar()} />}
          />
        </View>
      ) : estado.fase === 'sinPagina' ? (
        /* 🔴 **No es un vacío: es una invitación con camino.** La fila de
           `prestadores` la crea la primera edición, así que el CTA de acá
           **es** el acto que la existe. Sin él sería un final mudo. */
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing[5] }}>
          <EstadoVacio
            titulo={t('miVitrina.sinPaginaTitulo')}
            descripcion={t('miVitrina.sinPaginaDetalle')}
            accion={<Boton etiqueta={t('miVitrina.armarla')} onPress={abrirEditor} />}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
          <VitrinaRefugio
            nombre={estado.v.nombre}
            logoUrl={estado.v.logoUrl}
            historia={estado.v.historia}
            ciudad={
              /* Ciudad y zona son **dos campos** y la pieza toma uno: se unen
                 acá con el separador de la casa. Si falta uno no se dibuja un
                 separador huérfano. */
              [estado.v.ciudad, estado.v.zona].filter((x) => x !== null && x !== '').join(' · ') ||
              null
            }
            vozSinPagina={t('miVitrina.vozSinPagina')}
            descripcionSinPagina={t('miVitrina.descripcionSinPagina')}
            /* N22 · **la «i» la abre la pantalla, no la pieza.** `BotonExplicar`
               sólo dispara; el texto vive en una `Hoja` de acá — *una pieza que
               se guarda su propia explicación obliga a que todas la digan
               igual, y ésta es del refugio.* */
            comoAyudar={{
              texto: t('miVitrina.comoAyudar'),
              onExplicar: () => setExplicandoAyuda(true),
              etiquetaExplicacion: t('miVitrina.comoAyudarEtiqueta'),
            }}
            pie={
              <View style={{ gap: spacing[4], paddingTop: spacing[4] }}>
                <Texto variante="seccion">{t('miVitrina.tusAnimales')}</Texto>
                {publicados.length === 0 ? (
                  /* Publicados en CERO no es lo mismo que «no tenés animales»:
                     puede tener varios en rescate sin publicar. La voz lo dice
                     así — *un vacío que nombra mal su causa manda a arreglar
                     lo que no está roto.* */
                  <EstadoVacio
                    registro="seccion"
                    titulo={t('miVitrina.sinPublicadosTitulo')}
                    descripcion={t('miVitrina.sinPublicadosDetalle')}
                  />
                ) : (
                  publicados.map((a) => (
                    <TarjetaAdoptable
                      key={a.publicacionId}
                      nombre={a.nombre}
                      /* Singular y en voz de la casa: la tarjeta presenta a UN
                         animal, no a una categoría. La especie que el catálogo
                         no tenga se dice tal cual en vez de quedar vacía —
                         *un hueco donde va la especie se lee como un defecto,
                         y sólo es un código que todavía no tiene palabra.* */
                      especie={VOZ_ESPECIE[a.especie] ?? a.especie}
                      fotoUrl={a.fotoUrl === null ? null : (estado.caras.get(a.fotoUrl) ?? null)}
                      fotoDeEspecie={resolverUrlGenericaEspecie(a.especie)}
                      voces={{ edadNoInformada: t('miVitrina.edadNoInformada') }}
                      onPress={() =>
                        router.push({
                          pathname: '/adoptables/[publicacionId]',
                          params: { publicacionId: a.publicacionId },
                        })
                      }
                    />
                  ))
                )}
                {/* ⚠️ La portada y el logo NO se editan acá, y la pantalla lo
                    DICE. Callarlo se leería como que la vitrina no tiene
                    portada; decirlo deja claro que falta el camino, no la
                    pieza. */}
                <Texto variante="apoyo" color="tertiary">
                  {t('miVitrina.sinFotosAun')}
                </Texto>
                <Boton variante="secundario" bloque etiqueta={t('miVitrina.editar')} onPress={abrirEditor} />
              </View>
            }
          />
        </ScrollView>
      )}

      <Hoja
        visible={explicandoAyuda}
        onCerrar={() => setExplicandoAyuda(false)}
        titulo={t('miVitrina.comoAyudar')}
      >
        <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
          <Texto variante="cuerpo">{t('miVitrina.comoAyudarPronto')}</Texto>
        </View>
      </Hoja>

      <Hoja visible={editando} onCerrar={() => setEditando(false)} titulo={t('miVitrina.editarTitulo')}>
        <EvitaTeclado>
          <View style={{ gap: spacing[3], paddingBottom: spacing[2] }}>
            <Campo
              label={t('miVitrina.campoHistoria')}
              value={historia}
              onChangeText={setHistoria}
              multilinea={4}
            />
            <Campo label={t('miVitrina.campoCiudad')} value={ciudad} onChangeText={setCiudad} />
            <Campo label={t('miVitrina.campoZona')} value={zona} onChangeText={setZona} />
            <Boton
              variante="primario"
              bloque
              etiqueta={t('miVitrina.guardar')}
              cargando={guardando}
              onPress={() => void guardar()}
            />
          </View>
        </EvitaTeclado>
      </Hoja>
    </View>
  );
}
