/**
 * EL PERFIL PÚBLICO DEL NEGOCIO — la mitad cliente de la vitrina (S91-C).
 *
 * ── LA FIRMA QUE LA ORDENA ──────────────────────────────────────────────
 * «SE MUESTRA TAL CUAL LA VISTA PREVIA construida del lado del prestador.
 * Esa pieza es la FUENTE ÚNICA — no se re-diseña, no se re-decide qué va:
 * se espeja.»
 *
 * Por eso acá NO se dibuja una ficha: se MONTA `FichaPrestador` de
 * `packages/ui`, la misma que monta el espejo del prestador
 * (`cuenta/como-te-ven.tsx`). Su cabecera ya declaraba a esta pantalla como
 * su segundo consumidor —«la familia (cuando el directorio exista) y este
 * espejo»—: la mitad cliente estaba prevista desde S84 y nunca se conectó.
 * Una segunda ficha no sería «otra vista»: sería otra verdad que se
 * desincroniza sola.
 *
 * ── LAS DOS PROPS QUE NO VIAJAN, Y NO ES OLVIDO ─────────────────────────
 * `pie` y `onAgregarFotos` son DEL ESPEJO y se omiten a propósito:
 *  · `pie` dice «esto es un anticipo» — acá no es un anticipo, es la cosa.
 *  · `onAgregarFotos` gobierna el vacío de portada, y B lo firmó así: CON
 *    handler se invita a subir fotos; SIN handler la portada NO SE MONTA,
 *    porque invitar a la familia a subir fotos ajenas sería un final mudo.
 *    Omitirlo es lo que hace correcto el vacío de este lado.
 *
 * ── `oficio` VA MUDO, COMO EN EL ESPEJO (firma founder) ──────────────────
 * `prestadores.tipo` es el eje MUERTO D-487. El espejo lo manda `undefined`
 * y acá también: si lo pintáramos, esta ficha diría algo que la del
 * prestador calla, y dejarían de ser idénticas. El oficio vive en el
 * PREVIEW de la fila de reserva, que sí lo sabe (viene navegando desde él).
 *
 * ── LA FUENTE: `v_prestadores_publicos` Y NADA MÁS ──────────────────────
 * `obtenerPerfilesPublicos` (A, S91) lee la VISTA, jamás la tabla. Un id
 * que no está en la vista —negocio no activo— simplemente no viene: su
 * ausencia es la respuesta, y acá se dice como vacío honesto, no como error.
 *
 * Escalera (§4b): peldaño 0 = el negocio sin fotos ni historia muestra
 * identidad y oficios, que es lo que siempre tiene; la densidad llega con
 * la galería y el clip, no con una versión nueva.
 */

import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Esqueleto,
  EsqueletoGrupo,
  EstadoVacio,
  FichaPrestador,
  spacing,
  useTheme,
} from '@epetplace/ui';
import {
  obtenerPerfilesPublicos,
  resolverUrlLogoNegocio,
  type PerfilPublico,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { vozDeOficios } from '@/lib/voz-oficio';
import { urlGaleria } from '@/lib/url-galeria';
import { FlechaVolver } from '@/components/flecha-volver';
import { BarraAdiestramiento } from '@/components/reserva/barra-adiestramiento';
import { BarraGrooming } from '@/components/reserva/barra-grooming';
import { BarraVeterinaria } from '@/components/reserva/barra-veterinaria';
import { BarraPaseo } from '@/components/reserva/barra-paseo';

export default function PerfilPublicoPrestador() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    prestadorId: string;
    ofertaId?: string;
    /** ⚡ D-730 · el contexto de la ventana, reenviado por la lista. */
    oficio?: string;
    fecha?: string;
    hora?: string;
    mascotaId?: string;
    mascotaNombre?: string;
    comprable?: string;
    duracion?: string;
    plan?: string;
    tipoServicio?: string;
    modalidad?: string;
  }>();
  const { prestadorId, ofertaId } = params;
  const texto = (v: string | string[] | undefined): string => (typeof v === 'string' ? v : '');
  /** S91-C · LA BARRA FIJA (firma founder, anatomía Airbnb). Solo se monta
   *  si esta pantalla se abrió DESDE una oferta: entrando por Explorar no
   *  hay nada que reservar y una barra que promete sin poder cumplir es la
   *  Ley 23 al revés. */
  const puedeReservar = typeof ofertaId === 'string' && ofertaId.length > 0;

  const [estado, setEstado] = useState<'cargando' | 'listo' | 'vacio' | 'error'>('cargando');
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await obtenerPerfilesPublicos([prestadorId]);
        if (!vigente) return;
        // Ley 13: el fallo dice fallo. Y la AUSENCIA no es fallo —
        // un negocio que salió de la vitrina no es un error de red.
        if (!r.ok) return setEstado('error');
        const uno = r.data[0];
        if (uno === undefined) return setEstado('vacio');
        setPerfil(uno);
        setEstado('listo');
      })();
      return () => {
        vigente = false;
      };
    }, [prestadorId]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {estado === 'cargando' ? (
        <View style={{ padding: spacing[5], paddingTop: insets.top + spacing[5] }}>
          <EsqueletoGrupo>
            <View style={{ gap: spacing[4] }}>
              <Esqueleto forma="bloque" ancho="100%" alto={180} />
              <Esqueleto forma="bloque" ancho="60%" alto={24} />
              <Esqueleto forma="bloque" ancho="100%" alto={72} />
            </View>
          </EsqueletoGrupo>
        </View>
      ) : estado === 'error' ? (
        <View style={{ padding: spacing[5], paddingTop: insets.top + spacing[5] }}>
          <EstadoVacio
            registro="pantalla"
            titulo={t('perfilPrestador.errorTitulo')}
            descripcion={t('perfilPrestador.errorDetalle')}
          />
        </View>
      ) : estado === 'vacio' || perfil === null ? (
        <View style={{ padding: spacing[5], paddingTop: insets.top + spacing[5] }}>
          <EstadoVacio
            registro="pantalla"
            titulo={t('perfilPrestador.vacioTitulo')}
            descripcion={t('perfilPrestador.vacioDetalle')}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            // el alto de la barra + su aire: sin esto la barra TAPA el
            // último bloque, que es el defecto clásico de una barra fija.
            paddingBottom: insets.bottom + (puedeReservar ? 96 : spacing[6]),
          }}
        >
          <FichaPrestador
            aSangre
            vozNombre="bloque"
            sobrePortada={<FlechaVolver onPress={() => router.back()} etiqueta={t('perfilPrestador.volver')} />}
            nombre={perfil.nombre_comercial}
            cohorte={perfil.cohorte}
            cohorteAnio={perfil.cohorte_anio}
            logoUrl={resolverUrlLogoNegocio(perfil.foto_url)}
            portadas={perfil.portadas.map(urlGaleria).filter((u): u is string => u !== null)}
            clipUri={urlGaleria(perfil.clip_url)}
            zonaLat={perfil.zona_lat}
            zonaLon={perfil.zona_lon}
            zonaRadioM={perfil.zona_radio_m}
            ciudad={perfil.ciudad}
            historia={perfil.descripcion}
            servicios={vozDeOficios(perfil.servicios, t)}
          />
        </ScrollView>
      )}

      {/* LA BARRA FIJA — abajo de la PANTALLA, no al final del scroll
          (letra del founder).

          ⚡ D-730 · ACÁ SE RESERVA. Hasta hoy este botón dejaba un pedido en
          `senal-reserva` y volvía a la lista, que reservaba por él: se veía
          como un parpadeo y costaba, medido, 3 a 5 viajes de red por reserva,
          de los cuales ninguno sobrevivía a la navegación al checkout.

          Lo que hizo posible cambiarlo NO fue clonar el flujo —eso era la
          segunda verdad que `senal-reserva` rechazó con razón— sino EXTRAERLO:
          vive en `lib/reserva/<oficio>` y esta barra es su segundo consumidor.
          La lista es el primero, y las dos ejecutan el mismo código.

          La barra es de UN oficio por vez: cada hijo llama a su propio hook,
          así que el despacho es por componente y no por condicional adentro de
          un hook — llamar hooks condicionalmente sería ilegal y, peor, sería
          invisible hasta que rompa. */}
      {estado === 'listo' && puedeReservar && ofertaId !== undefined ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: spacing[5],
            paddingTop: spacing[3],
            paddingBottom: insets.bottom + spacing[3],
            backgroundColor: theme.bg.base,
            borderTopWidth: 1,
            borderTopColor: theme.bg.border,
          }}
        >
          {texto(params.oficio) === 'adiestramiento' ? (
            <BarraAdiestramiento
              ofertaId={ofertaId}
              fecha={texto(params.fecha)}
              hora={texto(params.hora)}
              mascotaId={texto(params.mascotaId)}
              mascotaNombre={texto(params.mascotaNombre)}
              comprable={texto(params.comprable) === 'programa' ? 'programa' : 'sesion'}
            />
          ) : texto(params.oficio) === 'grooming' ? (
            <BarraGrooming
              ofertaId={ofertaId}
              fecha={texto(params.fecha)}
              hora={texto(params.hora)}
              mascotaId={texto(params.mascotaId)}
              tipoServicio={texto(params.tipoServicio)}
              modalidad={texto(params.modalidad) === 'domicilio' ? 'domicilio' : 'local'}
            />
          ) : texto(params.oficio) === 'veterinaria' ? (
            <BarraVeterinaria
              prestadorId={prestadorId}
              ofertaId={ofertaId}
              fecha={texto(params.fecha)}
              hora={texto(params.hora)}
              mascotaId={texto(params.mascotaId)}
              tipoServicio={texto(params.tipoServicio)}
            />
          ) : texto(params.oficio) === 'paseo' ? (
            <BarraPaseo
              ofertaId={ofertaId}
              fecha={texto(params.fecha)}
              hora={texto(params.hora)}
              duracion={Number(texto(params.duracion))}
              modoPlan={texto(params.plan) === '1'}
              mascotaIdParam={texto(params.mascotaId).length > 0 ? texto(params.mascotaId) : null}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
