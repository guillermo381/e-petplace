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

import type { ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Celda, LogoNegocio, Texto, radius, spacing, useTheme } from '@epetplace/ui';
import { resolverUrlLogoNegocio, type PerfilPublico } from '@epetplace/api';

import { useTraduccion } from '@/i18n';
import { urlGaleria } from '@/lib/url-galeria';

export function PreviewPrestador({
  prestadorId,
  ofertaId,
  nombre,
  oficio,
  precio,
  contexto,
  perfil,
  contextoReserva,
  pie,
  onAbrir,
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
  /** ⚡ D-730 · EL CONTEXTO DE LA VENTANA, para que la ficha RESERVE.
   *
   *  La ficha recibía `prestadorId` + `ofertaId` **y nada más**, o sea que no
   *  tenía fecha, hora ni mascota — y sin eso no podía crear un hold por
   *  ningún camino. Ése era el bloqueante que D-730 declaró que había que
   *  resolver antes que cualquier extracción. Se resuelve acá porque **estos
   *  valores ya viajan por la URL de la lista**: no hay que fabricarlos, hay
   *  que reenviarlos.
   *
   *  Es un mapa abierto a propósito: cada oficio manda LO SUYO (el paseo
   *  manda duración, el grooming modalidad, el adiestramiento comprable) y
   *  este preview no interpreta ninguno. *Un tipo cerrado acá obligaría a
   *  esta pieza compartida a conocer los cuatro oficios, que es exactamente
   *  la generalización que quita en vez de sumar.* */
  contextoReserva?: Record<string, string>;
  /**
   * ⭐ S107-C · **LO PROPIO DEL OFICIO, al pie de la tarjeta.**
   *
   * Nació para guardería, que necesita **el cupo del día y las dos ventanas de
   * recogida y devolución** — *lo que una familia mira para saber si le sirve,
   * y que ninguno de los otros cuatro oficios tiene.*
   *
   * 🔴 **ES UN SLOT, no props nuevas por oficio.** *Si esta pieza aprendiera
   * qué es una «ventana de recogida», el próximo oficio le agregaría lo suyo y
   * en tres oficios sería un formulario con cinco banderas.* La pantalla sabe
   * de su oficio; la tarjeta sabe de presentar a un prestador.
   *
   * Ausente = no se dibuja nada, y los cuatro consumidores de hoy **no se
   * mueven una línea**. Mismo nombre y mismo criterio que el `pie` de
   * `FichaPrestador`.
   */
  pie?: ReactNode;
  /**
   * Redirige el tap. **Sólo para el oficio cuyo «detalle que reserva» NO es el
   * perfil genérico** — hoy, guardería. *Ver la razón medida arriba.*
   */
  onAbrir?: () => void;
}) {
  const router = useRouter();
  const { t } = useTraduccion();
  const { theme } = useTheme();
  /* ⭐ S107-C · **EL DESTINO SE PUEDE REDIRIGIR, y hay una razón medida.**
     🔴 El perfil genérico monta barra de reserva de CUATRO oficios
     (`BarraPaseo` · `BarraGrooming` · `BarraVeterinaria` ·
     `BarraAdiestramiento`) **y ninguna de guardería** ⇒ una familia que llega
     ahí por guardería **ve el perfil y no tiene con qué pagar**.

     *Guardería tiene su propia pantalla de «mirar y reservar»
     (`explorar/guarderia/[prestadorId]`), que cumple exactamente el mismo ROL
     que el perfil cumple para los otros cuatro: se mira y se reserva.* **La
     regla de la casa —«un destino por superficie: la lista lleva a mirar, el
     detalle reserva»— se respeta; lo que cambia es CUÁL es ese detalle.**

     Ausente = el perfil de siempre, y **los cuatro consumidores no se mueven**. */
  const abrirPerfil = () =>
    onAbrir !== undefined ? onAbrir() : router.push({
      pathname: '/prestador/[prestadorId]',
      params: {
        prestadorId,
        ...(ofertaId !== undefined ? { ofertaId } : {}),
        ...(contextoReserva ?? {}),
      },
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

  /** LA ESCALERA DE LA PORTADA (firma founder, en orden):
   *    ① imagen de portada → ② poster del video → ③ logo ampliado →
   *    ④ genérica de la casa.
   *
   *  ①/② dan IMAGEN; ③/④ dan el bloque de marca de abajo. La tarjeta
   *  MANTIENE SU ALTO en los cuatro: nunca un hueco blanco, nunca una
   *  tarjeta a medias.
   *
   *  `portadas` viene como PATHS del bucket, no como URLs — pasar el path
   *  crudo a `<Image>` reservaba el alto y lo dejaba en blanco: ése era el
   *  defecto que el founder cazó, y por eso la resolución vive en una
   *  frontera única (`lib/url-galeria`) y no en cada pantalla.
   *
   *  ⚠️ ② TODAVÍA NO EXISTE: `poster_url` es de A (se genera AL SUBIR, no
   *  por render — extraer un fotograma en el cliente exige módulo nativo y
   *  la performance de la lista manda). El escalón está CABLEADO con su
   *  lectura defensiva: el día que A lo sirva, entra sin tocar esto. Hoy
   *  un negocio cuya única portada es video cae a ③, que es honesto. */
  const poster = (perfil as { poster_url?: string | null } | undefined)?.poster_url;
  const portada = urlGaleria(perfil?.portadas[0]) ?? urlGaleria(poster);

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
      {portada === null ? (
        /* ③/④ · EL BLOQUE DE MARCA — no es una foto fallida y no debe
           leerse como tal. Por eso el logo NO se estira a sangre: va
           CENTRADO a tamaño digno sobre la capa, que es el tratamiento
           que la casa usa para «esto es identidad, no contenido».
           `LogoNegocio` resuelve ④ SOLO: sin url cae a su monograma
           honesto — la genérica de la casa ya existe adentro de la pieza,
           así que no se inventa una imagen nueva (Ley 11). */
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('perfilPrestador.verPerfilDe', { nombre })}
          onPress={abrirPerfil}
          style={{
            height: 168,
            borderRadius: radius.md,
            marginHorizontal: spacing[5],
            marginBottom: spacing[2],
            backgroundColor: theme.bg.overlay,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LogoNegocio
            nombre={nombre}
            logoUrl={resolverUrlLogoNegocio(perfil?.foto_url ?? null)}
            tamano={88}
          />
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={t('perfilPrestador.verPerfilDe', { nombre })} onPress={abrirPerfil}>
          {/* `Image` de RN, igual que la pieza: la casa no tiene
              componente de imagen y no se inventa uno acá (Ley 11). */}
          <Image
            source={{ uri: portada }}
            style={{
              height: 168,
              borderRadius: radius.md,
              marginHorizontal: spacing[5],
              marginBottom: spacing[2],
            }}
            resizeMode="cover"
          />
        </Pressable>
      )}
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

      {/* EL PIE DEL OFICIO — fuera del tocable de arriba a propósito: *lo que
          informa no debe competir con lo que navega.* */}
      {pie === undefined ? null : (
        <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[3] }}>{pie}</View>
      )}
    </View>
  );
}
