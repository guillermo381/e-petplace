/**
 * EL PREVIEW DEL PASO QUIÉN — la fila con cara (S91-C, letra firmada).
 *
 * ── LA ANATOMÍA, Y POR QUÉ SON DOS BLANCOS Y NO UNO (firma founder, (a)) ─
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

import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boton, Celda, LogoNegocio, Texto, spacing } from '@epetplace/ui';
import { resolverUrlLogoNegocio, type PerfilPublico } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function PreviewPrestador({
  prestadorId,
  nombre,
  oficio,
  precio,
  contexto,
  perfil,
  onReservar,
  etiquetaReservar,
}: {
  prestadorId: string;
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
  onReservar: () => void;
  etiquetaReservar: string;
}) {
  const router = useRouter();
  const { t } = useTraduccion();
  const abrirPerfil = () =>
    router.push({ pathname: '/prestador/[prestadorId]', params: { prestadorId } });

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

  return (
    <View style={{ paddingVertical: spacing[2] }}>
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

      {/* La confianza, en voz de dato — jamás estrellas vacías. */}
      {confianza !== null ? (
        <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
          <Texto variante="dato" color="secondary">
            {confianza}
          </Texto>
        </View>
      ) : null}

      {/* ② RESERVAR — explícito, con su consecuencia dicha en el precio. */}
      <View style={{ paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
        <Boton
          variante="primario"
          bloque
          etiqueta={`${etiquetaReservar} · ${precio}`}
          onPress={onReservar}
        />
      </View>
    </View>
  );
}
