/**
 * EL PREVIEW DEL PASO QUIÉN — la fila con cara (S91-C, letra firmada).
 *
 * ── ANATOMÍA AIRBNB (enmienda del founder, y ES MÁS LIMPIA) ─────────────
 * LA TARJETA ENTERA abre el perfil. NO hay botón de reservar acá: reservar
 * vive SOLO en el detalle, en barra fija. **Un destino por superficie: la
 * lista lleva a mirar, el detalle reserva.**
 *
 * Esto DESHACE la mitad-CTA de la anatomía anterior, y está bien que así
 * sea: aquella partía la fila en dos blancos para que mirar no tomara un
 * hold. La enmienda resuelve el mismo problema mejor —sacando el hold de
 * la lista— y de paso mata la ambigüedad de tener dos targets en una fila.
 *
 * ── (histórico, por qué existió la versión de dos blancos) ──────────────
 * La fila vieja era UNA `Celda` cuyo toque RESERVABA — tomaba un hold de
 * 15 minutos. Con preview enriquecido (foto, ★, «desde») la gente va a
 * tocar para MIRAR, no para reservar, así que el toque suelto pasó a ser
 * una trampa. La firma la resuelve partiendo la fila:
 *
 *   · **el bloque de identidad** (logo + nombre + confianza) → ABRE EL
 *     PERFIL. Mirar es gratis y nunca toma un hold.
 *   · **«Reservar ›»** → el hold de siempre, explícito.
 *
 * Es la misma enfermedad que D-357 curó en el segmentado —un control que
 * en un lugar hace una cosa y en otro hace otra— cazada esta vez ANTES de
 * publicarse.
 *
 * ── LA LÍNEA DE CONFIANZA ES HONESTA O NO ES ────────────────────────────
 * Con reseñas: `★ 4.8 · 12 reseñas`. **Con CERO reseñas NO se pintan
 * estrellas vacías** —serían un juicio que nadie emitió—: se dice el
 * oficio y las citas COMPLETADAS, que es un hecho verdadero del negocio
 * (`total_citas`). Un negocio nuevo sin citas tampoco miente: dice su
 * oficio y nada más. Es la escalera de §4b aplicada a una fila.
 *
 * ── DE DÓNDE SALE CADA COSA ─────────────────────────────────────────────
 * TODO el enriquecimiento viene de `v_prestadores_publicos` vía
 * `obtenerPerfilesPublicos` — **jamás de la tabla** (fuga que A cerró).
 * EXCEPTO el **oficio**, que lo pone la pantalla: ella ya sabe de cuál es
 * porque el usuario viene navegando desde él, y `prestadores.tipo` es el
 * eje MUERTO D-487 (firma founder). La FICHA lo sigue callando; el preview
 * lo dice. No es incoherencia: es que acá hay quien lo sabe y allá no.
 *
 * ── EL PERFIL PUEDE NO HABER LLEGADO, Y LA FILA NO ESPERA ───────────────
 * El enriquecimiento es carga SECUNDARIA: la fila se pinta con lo que el
 * lector de disponibilidad ya trajo (nombre, precio) y se completa cuando
 * llega. Hacer esperar la disponibilidad por una foto sería el defecto que
 * D-531 curó en el header de Cuenta — contenido secundario tomando de
 * rehén al principal.
 */

import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Celda, LogoNegocio, Texto, radius, spacing } from '@epetplace/ui';
import { resolverUrlLogoNegocio, type PerfilPublico } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function PreviewPrestador({
  prestadorId,
  ofertaId,
  nombre,
  oficio,
  precio,
  contexto,
  perfil,
}: {
  prestadorId: string;
  /** LA OFERTA CONCRETA que esta fila representa. Viaja al detalle para
   *  que su barra fija sepa QUÉ se reserva — sin ella el detalle no
   *  monta barra, porque no hay nada que reservar (Ley 23). */
  ofertaId?: string;
  /** Del lector de disponibilidad — está SIEMPRE, aunque el perfil tarde. */
  nombre: string;
  /** Lo pone la pantalla (ver cabecera): ella sabe de qué oficio viene. */
  oficio: string;
  /** El precio EXACTO de esta oferta, del lector de disponibilidad. El
   *  «desde» del perfil no lo reemplaza: acá ya se sabe cuál es. */
  precio: string;
  /** LO QUE LA PANTALLA YA SABÍA DECIR y este preview NO pisa: grooming,
   *  vet y adiestramiento componen un subtítulo propio —«va al hogar»,
   *  «en su clínica», la dirección— que es MÁS específico que el sector de
   *  la vista. Se antepone el oficio y se conserva lo suyo; sin contexto,
   *  cae al sector aproximado. Un preview compartido que borrara la línea
   *  de tres pantallas sería una generalización que quita, no que suma. */
  contexto?: string | null;
  /** Enriquecimiento de la vista pública. `undefined` = todavía no llegó. */
  perfil?: PerfilPublico;
}) {
  const router = useRouter();
  const { t } = useTraduccion();
  const abrirPerfil = () =>
    router.push({
      pathname: '/prestador/[prestadorId]',
      params: { prestadorId, ...(ofertaId !== undefined ? { ofertaId } : {}) },
    });

  const resenas = perfil?.total_resenas ?? 0;
  const nota = perfil?.calificacion_promedio ?? null;
  const citas = perfil?.total_citas ?? 0;

  // La línea de confianza, en su escalera: reseñas > citas > solo oficio.
  const confianza =
    resenas > 0 && nota !== null
      ? t('perfilPrestador.confianzaResenas', { nota: nota.toFixed(1), n: resenas })
      : citas > 0
        ? t('perfilPrestador.confianzaCitas', { n: citas })
        : null;

  const lugar = contexto ?? perfil?.sector ?? perfil?.ciudad ?? null;

  // LA COHORTE = «antigüedad», confirmada por el founder: CUÁNDO ENTRÓ A LA
  // PLATAFORMA. Los años de oficio NO existen en ninguna columna y no se
  // inventan — quedan como deuda de vitrina (pedido al prestador).
  // Los DOS tienen que venir: un «fundador» sin año diría menos que el dato.
  const cohorte =
    perfil?.cohorte != null && perfil.cohorte_anio != null
      ? t(perfil.cohorte === 'fundador' ? 'perfilPrestador.cohorteFundador' : 'perfilPrestador.cohortePionero', {
          anio: String(perfil.cohorte_anio),
        })
      : null;

  return (
    <View style={{ paddingVertical: spacing[2] }}>
      {/* LA PORTADA PRESIDE — `portadas[0]` ES la portada por contrato de
          `listarFotosGaleria` (viene ordenada), así que no se pregunta
          aparte. Sin portada NO se monta una caja vacía: la tarjeta cae a
          su fila de identidad, que es lo que el negocio siempre tiene. */}
      {perfil !== undefined && perfil.portadas.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('perfilPrestador.verPerfilDe', { nombre })} onPress={abrirPerfil}>
          {/* `Image` de RN, igual que la pieza: la casa no tiene
              componente de imagen y no se inventa uno acá (Ley 11). */}
          <Image
            source={{ uri: perfil.portadas[0] }}
            style={{
              height: 168,
              borderRadius: radius.md,
              marginHorizontal: spacing[5],
              marginBottom: spacing[2],
            }}
            resizeMode="cover"
          />
        </Pressable>
      ) : null}
      {/* ① MIRAR — nunca toma un hold.
          `Celda interactiva` YA es el tocable y trae su propia física de
          presión: envolverla en un `Pressable` habría anidado dos
          tocables — la clase D-311 (button anidado en RN-web). Un solo
          blanco, un solo destino. */}
      <Celda
        titulo={nombre}
        subtitulo={[oficio, lugar].filter(Boolean).join(' · ')}
        inicio={
          <LogoNegocio
            nombre={nombre}
            logoUrl={resolverUrlLogoNegocio(perfil?.foto_url ?? null)}
            tamano={44}
          />
        }
        interactiva
        accessibilityRole="button"
        onPress={abrirPerfil}
      />

      {/* LA LÍNEA DE META: confianza · cohorte · precio. Cada pieza se monta
          solo si existe — con `.filter(Boolean)` el separador nunca queda
          huérfano, que es el defecto clásico de una línea compuesta. */}
      <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
        <Texto variante="dato" color="secondary">
          {[confianza, cohorte, precio].filter(Boolean).join(' · ')}
        </Texto>
      </View>

    </View>
  );
}
