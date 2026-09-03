/**
 * S79-B (cura de gate): PANTALLA CAÍDA — la frontera del crash de render.
 *
 * EL HALLAZGO: el app no tenía NINGUNA ErrorBoundary — un crash de render
 * en producción era pantalla BLANCA muda: peor que fabricar estado (Ley
 * 13/D-541), no fabrica nada y tampoco dice nada. El reporte del founder
 * ("la oferta queda en blanco al tocar reintentar") es esa clase: la
 * lectura reintentada llega, la rama `listo` revienta al dibujar, y no
 * había frontera que lo atrape. La CAUSA del dato la mide A — esto es el
 * CAMINO DE FALLO: reintentar termina SIEMPRE en una superficie que
 * habla, gane o pierda.
 *
 * Mecánica: export `ErrorBoundary` de expo-router por RUTA — se renderiza
 * DENTRO de los providers del layout (tema e i18n vivos). `retry`
 * re-monta la ruta (el camino de reintento completo, no un setState).
 * Forense L-138: el error queda LITERAL en el log antes de dibujar.
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import * as Updates from 'expo-updates';
import { Boton, EstadoVacio, Texto, ThemeProvider, radius, spacing, useTheme } from '@epetplace/ui';

import { prestadorEs } from '@/i18n/es';
import { useTraduccion } from '@/i18n';

/**
 * S79-B (voto de mesa, APP-WIDE): la frontera del RAÍZ. El root _layout
 * monta los providers (tema + i18n) DENTRO de su propio render — si el
 * árbol revienta, la frontera del raíz se dibuja SIN ellos (`useTheme`
 * TIRA sin provider; el init de i18n es de montaje del ProveedorI18n).
 * Por eso esta variante es AUTOSUFICIENTE: se envuelve en su propio
 * ThemeProvider (light default) y lee el diccionario `es` DIRECTO — los
 * strings viven en el riel, el idioma queda fijo en es para la
 * superficie de último recurso (declarado; las rutas con boundary
 * propio conservan la versión i18n completa de abajo).
 */
export function PantallaCaidaRaiz({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(`[caida] render roto (raíz): ${error.message}`, error);
  }, [error]);
  return (
    <ThemeProvider>
      <CuerpoCaida
        error={error}
        titulo={prestadorEs.caida.titulo}
        detalle={prestadorEs.caida.detalle}
        etiquetaReintentar={prestadorEs.caida.reintentar}
        onReintentar={() => void retry()}
        voces={{
          verDetalle: prestadorEs.caida.verDetalle,
          ocultarDetalle: prestadorEs.caida.ocultarDetalle,
          copiar: prestadorEs.caida.copiar,
          copiado: prestadorEs.caida.copiado,
          sinCopiar: prestadorEs.caida.sinCopiar,
        }}
      />
    </ThemeProvider>
  );
}

/* ═══ C-A (S112-C) · EL FORENSE EN LA PANTALLA — sólo fuera de producción ═══
 *
 * 🔴 **LA RAZÓN, y es de A (`D-1008`): hoy un crash NO DEJA RASTRO EN NINGÚN
 * LADO.** A lo censó por cuatro vías, todas en cero — sin Sentry/Bugsnag/
 * Crashlytics, sin tabla de errores (`audit_log` con 0 filas), sin
 * `captureException` en ningún wrapper, sin edge de telemetría. Lo ÚNICO que
 * pasa es el `console.error` de acá abajo, **que va al logcat del aparato y
 * muere ahí**: si el teléfono no está enchufado a una consola en ese
 * instante, *el error no existió para nadie*.
 *
 * ⇒ Hasta hoy, la única evidencia posible de un crash era que el founder
 * sacara una foto — **y la foto salía muda**, porque la pantalla decía
 * «Esta pantalla no se pudo mostrar» y nada más. *Una superficie que atrapa
 * el error y no lo muestra convierte un dato exacto en una anécdota.*
 *
 * ── POR QUÉ NO EN PRODUCCIÓN ────────────────────────────────────────────────
 * Un stack le habla a quien construye, no a la familia: al dueño no le suma
 * nada y puede nombrar rutas, ids y tablas. Fuera de producción el que mira
 * es el founder o la mesa. El corte es `Updates.channel !== 'production'`,
 * o sea **dev y preview muestran, producción no** — y no se invierte a
 * `=== 'preview'` a propósito: en dev el canal es `null`, y un guard que
 * exige el nombre exacto dejaría muda justamente la superficie donde más se
 * la mira.
 *
 * ── COLAPSADO, Y NO ES DECORACIÓN ───────────────────────────────────────────
 * Abierto por default, el stack TAPA el «Reintentar» — que es lo que el
 * founder necesita para seguir usando la app. *El detalle técnico es la
 * segunda pregunta, nunca la primera.*
 *
 * ── ⚠️ EL LÍMITE DE «COPIAR», DECLARADO ─────────────────────────────────────
 * `expo-clipboard` es NATIVO ⇒ **no viaja por OTA** (L-134). Estaba declarado
 * en el cliente y NO en el prestador — y aun así resolvía, **por hoisting de
 * la raíz**: compila en dev y el APK del prestador no tiene el módulo. *Es la
 * trampa exacta que la casa ya tiene fichada: un peer hoisteado se ve igual
 * que una dependencia declarada hasta que corre en el aparato.* Se declara en
 * `apps/prestador/package.json` para que el hoisting deje de ser accidental,
 * **y aun así el botón del prestador no copia hasta la próxima build nativa.**
 *
 * Por eso la copia se pide con `require` PEREZOSO adentro de try/catch y el
 * fallo **se dice**, jamás se traga: *esta pantalla es la última línea de
 * defensa — si ella misma revienta, no queda nada*. Y por eso el texto es
 * `seleccionable`: **seleccionar y capturar funciona en cualquier binario,
 * hoy**, así que el founder nunca queda bloqueado por el botón.
 */
const LINEAS_DE_STACK = 12;

function textoForense(error: Error): string {
  const stack = (error.stack ?? '').split('\n').slice(0, LINEAS_DE_STACK).join('\n');
  return stack === '' ? error.message : `${error.message}\n\n${stack}`;
}

function DetalleForense({
  error,
  verDetalle,
  ocultarDetalle,
  copiar,
  copiado,
  sinCopiar,
}: {
  error: Error;
  verDetalle: string;
  ocultarDetalle: string;
  copiar: string;
  copiado: string;
  sinCopiar: string;
}) {
  const { theme } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [copia, setCopia] = useState<'reposo' | 'ok' | 'falla'>('reposo');
  const texto = textoForense(error);

  return (
    <View style={{ marginTop: spacing[5], gap: spacing[3] }}>
      <Boton
        variante="secundario"
        etiqueta={abierto ? ocultarDetalle : verDetalle}
        onPress={() => setAbierto((v) => !v)}
      />
      {abierto && (
        <View
          style={{
            backgroundColor: theme.bg.hundido,
            borderRadius: radius.md,
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          {/* `seleccionable`: la vía que funciona en TODO binario, sin
              módulo nativo. El botón es la comodidad; esto es el piso. */}
          <Texto variante="dato" seleccionable>
            {texto}
          </Texto>
          <Boton
            variante="secundario"
            etiqueta={copia === 'ok' ? copiado : copia === 'falla' ? sinCopiar : copiar}
            onPress={() => {
              try {
                /* Perezoso y adentro del try: en un binario sin el módulo
                   nativo esto TIRA, y lo que no puede pasar es que la
                   pantalla del crash se caiga por su propio botón. */
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const cb = require('expo-clipboard') as { setStringAsync: (s: string) => Promise<boolean> };
                void cb.setStringAsync(texto).then(
                  () => setCopia('ok'),
                  () => setCopia('falla'),
                );
              } catch {
                setCopia('falla');
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

function CuerpoCaida({
  error,
  titulo,
  detalle,
  etiquetaReintentar,
  onReintentar,
  voces,
}: {
  error: Error;
  titulo: string;
  detalle: string;
  etiquetaReintentar: string;
  onReintentar: () => void;
  voces: { verDetalle: string; ocultarDetalle: string; copiar: string; copiado: string; sinCopiar: string };
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, justifyContent: 'center', padding: spacing[5] }}>
      <EstadoVacio
        titulo={titulo}
        descripcion={detalle}
        accion={<Boton variante="secundario" etiqueta={etiquetaReintentar} onPress={onReintentar} />}
      />
      {/* C-A · el forense, SÓLO fuera de producción (ver el bloque de arriba). */}
      {Updates.channel !== 'production' && <DetalleForense error={error} {...voces} />}
    </View>
  );
}

export function PantallaCaida({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTraduccion();

  useEffect(() => {
    // el forense: QUÉ reventó, literal, en logcat/Metro — la pantalla le
    // habla al prestador; el log le habla a la mesa.
    console.error(`[caida] render roto: ${error.message}`, error);
  }, [error]);

  return (
    <CuerpoCaida
      error={error}
      titulo={t('caida.titulo')}
      detalle={t('caida.detalle')}
      etiquetaReintentar={t('caida.reintentar')}
      onReintentar={() => void retry()}
      voces={{
        verDetalle: t('caida.verDetalle'),
        ocultarDetalle: t('caida.ocultarDetalle'),
        copiar: t('caida.copiar'),
        copiado: t('caida.copiado'),
        sinCopiar: t('caida.sinCopiar'),
      }}
    />
  );
}
