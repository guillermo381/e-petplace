/**
 * AceptacionTerminos — el bloque de aceptación EXPLÍCITA del prestador
 * (S104-C, firma founder (a)). Dos puertas lo consumen: registro (auto-alta)
 * e invitación de empleado.
 *
 * LA LETRA QUE LO EXIGE: la aceptación implícita ya no se sostiene — §4.2/§4.3
 * del T&C exigen aceptación EXPRESA, el motor de A registra por documento con
 * versión y URL (P23), y sin casillas no hay qué registrar.
 *
 * ── LA FORMA (firma founder) ──────────────────────────────────────────────
 *  · DOS `Casilla` OBLIGATORIAS: T&C Pet Professional + Política de Privacidad,
 *    cada una con ENLACE a su documento publicado (el ARCHIVO inmutable de
 *    `URL_LEGAL` — la versión exacta que se acepta, no la página viva). Los
 *    documentos quedan disponibles ANTES del acto de aceptación (§4.2 literal).
 *  · Debajo, VISUALMENTE SEPARADA (Separador) y marcada OPCIONAL, la `Casilla`
 *    del ARBITRAJE §38.10, con su texto: si no la marca, el contrato igual rige
 *    y las controversias van a los jueces del Ecuador.
 *
 * El enlace es un `<Text onPress>` inline: abre el documento SIN marcar la
 * casilla (es el responder más interno). §4.5 se cumple porque el enlace del
 * T&C abre el archivo, que CONTIENE la Disposición Transitoria Primera — el
 * profesional declara haberla leído y la pantalla la hace alcanzable.
 *
 * Este bloque NO registra ni valida: reporta el estado de las tres casillas y
 * la pantalla decide (gatea el botón con las dos obligatorias; registra el
 * arbitraje —true o false, con su fecha— por el motor de A).
 */

import { Linking, Text, View } from 'react-native';
import { Casilla, Separador, Texto, spacing, typography, useTheme } from '@epetplace/ui';
import { documentosVigentes } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export interface EstadoAceptacion {
  tyc: boolean;
  privacidad: boolean;
  arbitraje: boolean;
}

/* La URL de cada documento sale de `documentosVigentes` —la API sancionada que
   resuelve `URL_LEGAL` adentro—, jamás de URL_LEGAL directo: la pantalla no
   inventa ni aporta URLs (L-166). El contexto `acceso_prestador` devuelve el
   par profesional (T&C + privacidad), que es el que aplica al prestador. */
function urlDocumento(doc: 'terminos_professional' | 'privacidad'): string | null {
  return documentosVigentes('acceso_prestador').find((d) => d.documento === doc)?.url ?? null;
}

/** La URL del T&C profesional, para anclar la evidencia del arbitraje (§38.10
 *  vive en ese documento). La consumen las pantallas en `decidirConsentimiento`. */
export function urlTycProfesional(): string | null {
  return urlDocumento('terminos_professional');
}

export const ACEPTACION_INICIAL: EstadoAceptacion = {
  tyc: false,
  privacidad: false,
  // el arbitraje arranca SIN marcar: es opt-in, y el «no» es un valor legítimo
  arbitraje: false,
};

/** Las dos obligatorias marcadas — el gate del botón de la pantalla. */
export function aceptacionCompleta(e: EstadoAceptacion): boolean {
  return e.tyc && e.privacidad;
}

export function AceptacionTerminos({
  estado,
  onCambio,
}: {
  estado: EstadoAceptacion;
  onCambio: (parche: Partial<EstadoAceptacion>) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTraduccion();

  const estiloCuerpo = {
    fontFamily: typography.family.sans.regular,
    fontSize: typography.size.sm,
    lineHeight: Math.round(typography.size.sm * typography.leading.normal),
    color: theme.text.secondary,
  } as const;

  // El enlace inline al documento. Si su URL es null (no publicado) NO se
  // dibuja: un enlace que no lleva a ningún lado es peor que su ausencia
  // (Ley 23). Hoy las dos URLs existen; el guard es la red.
  const enlace = (url: string | null, etiqueta: string) =>
    url === null ? (
      <Text style={{ color: theme.text.primary }}>{etiqueta}</Text>
    ) : (
      <Text
        onPress={() => void Linking.openURL(url)}
        style={{ color: theme.accent.primary, textDecorationLine: 'underline' }}
      >
        {etiqueta}
      </Text>
    );

  return (
    <View style={{ gap: spacing[4] }}>
      {/* Las DOS obligatorias — cada una con enlace a su documento publicado */}
      <Casilla
        marcada={estado.tyc}
        onCambio={(v) => onCambio({ tyc: v })}
        etiquetaAccesible={t('aceptacion.tycAccesible')}
        registro="oficio"
      >
        <Text style={estiloCuerpo}>
          {t('aceptacion.tycAntes')} {enlace(urlDocumento('terminos_professional'), t('aceptacion.tycEnlace'))}
        </Text>
      </Casilla>

      <Casilla
        marcada={estado.privacidad}
        onCambio={(v) => onCambio({ privacidad: v })}
        etiquetaAccesible={t('aceptacion.privAccesible')}
        registro="oficio"
      >
        <Text style={estiloCuerpo}>
          {t('aceptacion.privAntes')} {enlace(urlDocumento('privacidad'), t('aceptacion.privEnlace'))}
        </Text>
      </Casilla>

      <Separador />

      {/* El ARBITRAJE — opcional, separado; su nota dice qué pasa si NO se marca */}
      <View style={{ gap: spacing[2] }}>
        <Casilla
          marcada={estado.arbitraje}
          onCambio={(v) => onCambio({ arbitraje: v })}
          etiquetaAccesible={t('aceptacion.arbitrajeAccesible')}
          registro="oficio"
        >
          <Text style={estiloCuerpo}>{t('aceptacion.arbitraje')}</Text>
        </Casilla>
        <Texto variante="apoyo">{t('aceptacion.arbitrajeNota')}</Texto>
      </View>
    </View>
  );
}
