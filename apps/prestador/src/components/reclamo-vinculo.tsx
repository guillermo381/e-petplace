/**
 * EL RECLAMO DEL VÍNCULO — la puerta que le faltaba al motor (S99-C · L2).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ NACE, medido en el aparato durante el Gate 2 y no deducido:
 *
 * El vendedor dio de alta a un repartidor con su correo. El repartidor
 * creó su cuenta **con ese mismo correo**. Y la app le dijo:
 *
 *   *«Avísale a quien administra el negocio que te invite con ese correo
 *    — la invitación te aparece acá para aceptarla.»*
 *
 * **Ya estaba invitado.** Medido contra la base en ese momento:
 * `cuenta_existe: 1` · `sin_atar: true`. ⇒ **el vínculo no se ató y la
 * persona quedó en un callejón cortés, con un solo botón: cerrar sesión.**
 *
 * *La pregunta del gate era «¿lo logra sin que nadie le explique nada?».
 * La respuesta medida fue NO — y no por una voz mal escrita: porque nadie
 * llamaba a la puerta que ya existía.*
 *
 * ⚠️ Y LA CAUSA ES DE CLASE, no de este caso: `aceptarVinculoRepartidor` y
 * `misVinculosRepartidorPendientes` viven en el motor desde S99-A con
 * **CERO consumidores** — es *motor sin puerta*, el patrón que esta casa
 * ya tiene nombrado. El JSDoc del wrapper incluso decía quién la debía:
 * *«el lector de la pantalla de aceptación del primer ingreso (C)»*.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ── QUÉ HACE, y qué NO ────────────────────────────────────────────────
 * Pregunta si hay vínculos a nombre del correo de la sesión. Si los hay,
 * los DICE con el nombre del negocio y ofrece aceptarlos de un toque.
 *
 * **No decide dónde vive**: es una pieza y el cascarón la monta (el
 * `_layout` de los tabs es territorio de D). Sin pendientes **no se
 * dibuja** — devuelve `null` — así que montarla no cambia nada para
 * quien no tiene vínculo.
 *
 * ── LO QUE NO INVENTA ─────────────────────────────────────────────────
 * · Si el lector FALLA, **no dice «no hay nada»**: no se dibuja y el
 *   fallo queda en el log. *Un «nadie te registró» falso manda a la
 *   persona a pedirle al vendedor algo que el vendedor ya hizo.*
 * · Si acepta y el motor devuelve `aceptados: 0`, **lo dice distinto**
 *   que si aceptó: «ya estabas vinculado» ≠ «te acabás de vincular».
 *   El propio wrapper lo pide: *«la pantalla decide la voz»*.
 */

import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Boton, Tarjeta, Texto, spacing } from '@epetplace/ui';
import {
  aceptarVinculoRepartidor,
  misVinculosRepartidorPendientes,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface ReclamoVinculoProps {
  /** Se llama tras aceptar: el cascarón re-resuelve la sesión y la
   *  persona entra a lo suyo sin tener que reiniciar la app. */
  alAceptar: () => void;
}

interface Pendiente {
  repartidor_id: string;
  negocio: string;
  nombre_registrado: string;
}

export function ReclamoVinculo({ alAceptar }: ReclamoVinculoProps) {
  const { t } = useTraduccion();
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [aceptando, setAceptando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void (async () => {
        const r = await misVinculosRepartidorPendientes();
        if (!vigente) return;
        /* Un fallo NO se degrada a lista vacía: eso pintaría «nadie te
           registró» sobre una lectura que no pudo leer (L-139/Ley 13). */
        if (!r.ok) {
          console.error('[reclamo-vinculo] no se pudo leer:', r.mensaje);
          return;
        }
        setPendientes(r.data);
      })();
      return () => {
        vigente = false;
      };
    }, []),
  );

  if (pendientes.length === 0) return null;

  const primero = pendientes[0];
  if (primero === undefined) return null;

  return (
    <Tarjeta relleno="normal" elevacion="reposo">
      <View style={{ gap: spacing[3] }}>
        <Texto variante="seccion">
          {t('reclamoVinculo.titulo', { negocio: primero.negocio })}
        </Texto>
        <Texto variante="apoyo">
          {pendientes.length > 1
            ? t('reclamoVinculo.detalleVarios', { n: pendientes.length })
            : t('reclamoVinculo.detalle', { nombre: primero.nombre_registrado })}
        </Texto>
        <Boton
          variante="primario"
          bloque
          cargando={aceptando}
          etiqueta={t('reclamoVinculo.aceptar')}
          onPress={() => {
            if (aceptando) return;
            setAceptando(true);
            void aceptarVinculoRepartidor().then((r) => {
              setAceptando(false);
              if (!r.ok) {
                console.error('[reclamo-vinculo] no se pudo aceptar:', r.mensaje);
                return;
              }
              /* `aceptados: 0` NO es error (contrato del wrapper): es
                 «ya estabas vinculado». En los dos casos hay que
                 re-resolver la sesión, que es lo que el cascarón hace. */
              alAceptar();
            });
          }}
        />
      </View>
    </Tarjeta>
  );
}
