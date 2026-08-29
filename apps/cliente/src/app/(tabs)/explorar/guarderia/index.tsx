/**
 * GUARDERÍA · **ETAPA 1 — LA MODALIDAD** (S107-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA FIRMA DEL FOUNDER (contrato `s107-contrato-filtro-por-modalidad` ⓪):
 *   **LA MODALIDAD ES UN FILTRO, y va PRIMERO.**
 *   `modalidad → día → ver quién puede → elegir lugar → pagar`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LA FORMA SALE DEL CENSO, NO DE UNA IDEA ──────────────────────────────
 * **`SelectorSegmentado` con `proposito="eleccion"` — la misma pieza, con las
 * mismas props, que Baño / Baño y corte** (`explorar/grooming/index.tsx:459`).
 * *La pregunta era la misma —«¿cuál de estos servicios?»— y la respuesta ya
 * estaba escrita.* Y encaja de verdad: la pieza **exige 2 o 3 segmentos**
 * (Ley 19.3) y las modalidades son exactamente tres.
 *
 * ── 🔴 POR QUÉ ACÁ NO HAY PRECIO DEBAJO, y es decisión medida ────────────
 * Grooming pinta un texto con el «desde» bajo el riel. **Acá no puede haber
 * ninguno, y no es un olvido:** el precio de guardería vive **por lugar**, los
 * lugares no se conocen hasta que hay un día, y **no existe lector público de
 * oferta de guardería** (el de grooming, `obtenerOfertaGroomingPublica`, no
 * tiene hermano). ⇒ cualquier número acá **sería inventado**.
 *
 * > La regla de la casa: **jamás un número que no sea el que se va a cobrar.**
 * > Cuando no hay uno honesto, no va ninguno — y el de cada lugar vive en su
 * > fila de la etapa 2, que es donde sí es cierto.
 *
 * ── LA MASCOTA NO SE RE-PREGUNTA ─────────────────────────────────────────
 * Viaja por parámetro desde el hub y se muestra **como `detalle` del cabezal**,
 * el patrón literal de grooming. *La presencia del sujeto es letra firmada
 * desde S61; lo que sobraba era el CONTROL.*
 *
 * ── ⚠️ HOY ESTA PANTALLA NO SE VE, Y ESTÁ BIEN ───────────────────────────
 * `MODALIDADES_ABIERTAS` tiene **una sola** (ver `lib/guarderia-modalidad.ts`
 * para el porqué medido). **N=1 colapsa**: con una modalidad no hay elección
 * que ofrecer, así que **se redirige sin dibujar nada** — *«con un turno nadie
 * ve la palabra»* (S78). El día que A publique el filtro y las dos RPC de
 * cobro, **esta pantalla aparece sola**: es una línea en la compuerta.
 */

import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectorSegmentado, Texto, spacing, useTheme } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';
import { CabezalOficio, PieReserva } from '@/components/reserva-piezas';
import {
  MODALIDADES_ABIERTAS,
  type ModalidadGuarderia,
} from '@/lib/guarderia-modalidad';

export default function ModalidadGuarderiaPantalla() {
  const { theme } = useTheme();
  const { t } = useTraduccion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mascotaId?: string; mascotaNombre?: string }>();

  const [modalidad, setModalidad] = useState<ModalidadGuarderia>(MODALIDADES_ABIERTAS[0]);

  /* 🔴 N=1 COLAPSA — y con `Redirect`, no con un efecto: un `router.replace`
     en un efecto dibuja la pantalla un cuadro antes de irse, y ese parpadeo es
     justo lo que la regla evita. */
  if (MODALIDADES_ABIERTAS.length < 2) {
    return (
      <Redirect
        href={{
          pathname: '/explorar/guarderia/disponibles',
          params: { ...params, modalidad: MODALIDADES_ABIERTAS[0] },
        }}
      />
    );
  }

  const nombreMascota =
    typeof params.mascotaNombre === 'string' && params.mascotaNombre.length > 0
      ? params.mascotaNombre
      : null;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg.base }}>
      <CabezalOficio
        oficio="guarderia"
        capa="cuidado"
        titulo={t('hubGuarderia.titulo')}
        detalle={nombreMascota ?? t('hubGuarderia.cabezalDetalle')}
        onAtras={() => router.back()}
        insetTop={insets.top}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          gap: spacing[4],
          paddingBottom: insets.bottom + spacing[8],
        }}
      >
        <SelectorSegmentado
          proposito="eleccion"
          etiqueta={t('modalidadGuarderia.etiqueta')}
          segmentos={MODALIDADES_ABIERTAS.map((m) => ({
            codigo: m,
            etiqueta: t(
              m === 'dia'
                ? 'modalidadGuarderia.dia'
                : m === 'paquete'
                  ? 'modalidadGuarderia.paquete'
                  : 'modalidadGuarderia.mensual',
            ),
          }))}
          activo={modalidad}
          onCambio={(c) => setModalidad(c as ModalidadGuarderia)}
        />

        {/* Qué ES cada modalidad, en una línea. **No es precio**: es lo que la
            familia necesita para elegir sin abrir tres caminos a ciegas. */}
        <Texto variante="apoyo">
          {t(
            modalidad === 'dia'
              ? 'modalidadGuarderia.diaQue'
              : modalidad === 'paquete'
                ? 'modalidadGuarderia.paqueteQue'
                : 'modalidadGuarderia.mensualQue',
          )}
        </Texto>

        {/* 🔴 LA MENSUAL DICE QUE ES RECURRENTE ANTES DE SEGUIR, no recién al
            pagar. `LETRA_COBRO_RECURRENTE` §2: *«la pantalla dice la verdad
            completa»* — y la primera parte de esa verdad es que **esto se
            repite**. El monto y el medio se dicen en el checkout, donde ya
            existen; acá se dice la naturaleza. */}
        {modalidad === 'mensual' ? (
          <View style={{ gap: spacing[2] }}>
            <Texto variante="apoyo">{t('modalidadGuarderia.mensualAviso')}</Texto>
            <Texto variante="apoyo">{t('modalidadGuarderia.mensualCorte')}</Texto>
          </View>
        ) : null}
      </ScrollView>

      <PieReserva
        /* Sin total: acá no hay número honesto todavía (ver cabecera). */
        total={null}
        etiqueta={t('modalidadGuarderia.continuar')}
        habilitado
        insetBottom={insets.bottom}
        onPress={() =>
          router.push({
            pathname: '/explorar/guarderia/disponibles',
            params: { ...params, modalidad },
          })
        }
      />
    </SafeAreaView>
  );
}
