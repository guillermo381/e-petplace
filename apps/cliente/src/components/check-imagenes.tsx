/**
 * «¿NOS DEJAS COMPARTIR SUS FOTOS?» — el consentimiento de imagen (S107-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 VIVE EN LA CONFIRMACIÓN, DESPUÉS DE PAGAR — Y EL LUGAR ES EL ARGUMENTO.
 * ═══════════════════════════════════════════════════════════════════════════
 * Firma del founder: *«ya pagó, así que aceptar o no aceptar no cambia nada de
 * lo que contrató. Un consentimiento que se pide antes de cobrar se parece
 * demasiado a un requisito.»*
 *
 * ⏪ Nació como **la segunda casilla de la pantalla de términos** y de ahí
 * salió, porque esa pantalla debe pedir UNA sola. **No vuelve**: ahí sería
 * otra vez la segunda casilla de la que salió (`D-983`).
 *
 * ── LO QUE GOBIERNA, Y LO QUE NO ────────────────────────────────────────
 * 🔴 **Las fotos y clips del DURANTE son PRIVADAS y van al hilo de la
 * familia: eso NO necesita esta autorización y NO está bloqueado.** Lo que
 * ésta gobierna es **publicarlas FUERA**. *Quien lea «redes_autorizadas =
 * false» sin esta distinción va a creer que la media del durante está trabada,
 * y no lo está.*
 *
 * ── LA FORMA, punto por punto ───────────────────────────────────────────
 * · **Un solo check, APAGADO por defecto.** *Es el consentimiento más fácil de
 *   invalidar si viene marcado de fábrica: sin acto no hay prueba* (P23).
 * · **Rotulado opcional y sin bloquear nada** — la pantalla funciona igual si
 *   nadie lo toca.
 * · **Nombra a la mascota**, porque la imagen es suya.
 * · **Dice la vía de retiro, y por eso la promesa es cierta HOY.** No dice
 *   «puedes cambiarlo cuando quieras» a secas: dice **cómo**. *Una promesa de
 *   revocación sin camino es la clase de frase que un consentimiento no
 *   soporta.*
 *
 * ⚠️ Cuando el interruptor de Preferencias exista, la frase ofrece **LAS DOS
 * vías** — el correo **no se retira** porque aparezca una pantalla.
 *
 * ── 🔴 EL ESCRITOR ES UNA PUERTA PROPIA, Y NO ES PREFERENCIA DE NOMBRE ───
 * `fijarRedesAutorizadas` toca **sólo el booleano**. Medido por A: usar
 * `aceptar_documentos_guarderia` como interruptor **le aceptaba a la familia
 * un documento nuevo que no leyó** —aceptaciones 10 → 11 al prender el
 * switch—. *Cambiar una preferencia de imagen firmaba un contrato legal.*
 * **No era un riesgo futuro: era el comportamiento de hoy**, y sólo no se veía
 * porque la familia de prueba ya tenía todo aceptado.
 */

import { useState } from 'react';
import { View } from 'react-native';
import { Casilla, Texto, spacing } from '@epetplace/ui';
import { fijarRedesAutorizadas } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export function CheckImagenes({
  familiaId,
  mascotaNombre,
  /** Su valor de hoy, si ya se pudo leer. Sin él arranca apagado. */
  inicial = false,
}: {
  familiaId: string;
  mascotaNombre: string;
  inicial?: boolean;
}) {
  const { t } = useTraduccion();
  const [marcada, setMarcada] = useState(inicial);
  const [guardando, setGuardando] = useState(false);

  return (
    <View style={{ gap: spacing[2], paddingTop: spacing[5] }}>
      <Casilla
        marcada={marcada}
        /* 🔴 La frase entera al lector, no su primera mitad: es lo que se
           consiente, y en un consentimiento el enunciado completo es la
           prueba (P23). */
        etiquetaAccesible={`${t('imagenes.titulo')} ${t('imagenes.cuerpo', { nombre: mascotaNombre })}`}
        onCambio={(m) => {
          /* Optimista y con vuelta atrás: el consentimiento se siente
             inmediato, y si el server rebota **la casilla vuelve** — dejarla
             marcada sobre un guardado que falló mostraría un permiso que
             nadie tiene. */
          setMarcada(m);
          setGuardando(true);
          void fijarRedesAutorizadas({ familiaId, autorizadas: m }).then((r) => {
            setGuardando(false);
            if (!r.ok) setMarcada(!m);
          });
        }}
        registro="control"
      >
        <Texto variante="cuerpo">{t('imagenes.titulo')}</Texto>
      </Casilla>
      <Texto variante="apoyo">{t('imagenes.cuerpo', { nombre: mascotaNombre })}</Texto>
      {/* La vía de retiro, dicha en el mismo bloque que la autorización. */}
      <Texto variante="apoyo">{t('imagenes.revocar')}</Texto>
      {guardando ? <Texto variante="apoyo">{t('imagenes.guardando')}</Texto> : null}
    </View>
  );
}
