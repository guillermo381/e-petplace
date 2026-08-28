/**
 * aceptacion-prestador — la mitad de DOMINIO de la aceptación del prestador.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NACE DE `D-645` (S107-C): la FORMA se fue a `packages/ui`; lo que quedó acá
 * es lo que nunca fue forma.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ☠️ **`components/aceptacion-terminos.tsx` MURIÓ en el mismo acto** (Ley 37).
 * Su render lo hace ahora `AceptacionDeDocumentos` de `@epetplace/ui`, que es
 * la misma forma con la lista como DATO. *Una promoción no es una migración:
 * mientras la vieja siguiera viva, la casa tenía dos implementaciones de la
 * misma forma y nada señalaba cuál se mantiene.*
 *
 * **Lo que se conservó, y por qué no era la pieza:** el estado de la
 * aceptación, su gate, y la URL del T&C profesional —que `verificar-correo`
 * consume para anclar la evidencia del arbitraje (§38.10) y que nunca tuvo
 * nada que ver con dibujar casillas—. *Borrar el archivo entero habría
 * llevado puesta una función que no era del componente.*
 *
 * La VOZ vive acá y no en la pieza, por contrato de B: *el server manda
 * códigos; la voz es de la casa que la muestra.*
 */

import { Linking } from 'react-native';
import type { DocumentoAceptable } from '@epetplace/ui';
import { documentosVigentes } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** Las claves con las que la pieza reporta, y con las que el motor registra. */
export const CLAVE_TYC = 'terminos_professional';
export const CLAVE_PRIVACIDAD = 'privacidad';
export const CLAVE_ARBITRAJE = 'arbitraje';

export interface EstadoAceptacion {
  tyc: boolean;
  privacidad: boolean;
  arbitraje: boolean;
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

/** El estado, traducido a lo que la pieza entiende: las claves marcadas. */
export function marcadasDe(e: EstadoAceptacion): string[] {
  const m: string[] = [];
  if (e.tyc) m.push(CLAVE_TYC);
  if (e.privacidad) m.push(CLAVE_PRIVACIDAD);
  if (e.arbitraje) m.push(CLAVE_ARBITRAJE);
  return m;
}

/** El camino de vuelta: lo que la pieza reporta, aplicado al estado. */
export function aplicarCambio(clave: string, marcada: boolean): Partial<EstadoAceptacion> {
  if (clave === CLAVE_TYC) return { tyc: marcada };
  if (clave === CLAVE_PRIVACIDAD) return { privacidad: marcada };
  if (clave === CLAVE_ARBITRAJE) return { arbitraje: marcada };
  return {};
}

/**
 * Los documentos de la aceptación del prestador, en su voz.
 *
 * ⚠️ **`etiquetaEnlace` sólo viaja si la URL existe.** Un enlace que no lleva
 * a ningún lado es peor que su ausencia (Ley 23) — y la pieza ya lo trata así:
 * sin `onAbrir` no dibuja enlace. Hoy las dos URLs existen; el guard es la red.
 *
 * 🔴 **REGRESIÓN DECLARADA, y es de accesibilidad — no se ejerce hasta que B
 * cierre su prop.** `AceptacionDeDocumentos` arma el `accessibilityLabel` del
 * checkbox con `doc.texto` **solo**, así que el lector de pantalla anuncia
 * *«Acepto los»* donde la pieza vieja anunciaba *«Acepto los Términos y
 * Condiciones Pet Professional»*. **El enlace sí queda expuesto aparte, con su
 * propio rol y su etiqueta**, así que la información no se pierde — se parte
 * en dos elementos. *Igual es peor para el que sólo escucha, y en una casilla
 * de consentimiento legal eso importa.* **Pedido a B: `etiquetaAccesible?` en
 * `DocumentoAceptable`; las claves `*Accesible` del diccionario siguen vivas
 * esperándola y por eso no se borran.**
 */
export function useDocumentosAceptacion(): {
  documentos: DocumentoAceptable[];
  opcionales: DocumentoAceptable[];
  rotuloOpcionales: string;
  notaArbitraje: string;
} {
  const { t } = useTraduccion();

  const abrir = (url: string | null) =>
    url === null ? undefined : () => void Linking.openURL(url);

  const urlTyc = urlDocumento('terminos_professional');
  const urlPriv = urlDocumento('privacidad');

  return {
    documentos: [
      {
        clave: CLAVE_TYC,
        texto: t('aceptacion.tycAntes'),
        etiquetaEnlace: urlTyc === null ? undefined : t('aceptacion.tycEnlace'),
        onAbrir: abrir(urlTyc),
      },
      {
        clave: CLAVE_PRIVACIDAD,
        texto: t('aceptacion.privAntes'),
        etiquetaEnlace: urlPriv === null ? undefined : t('aceptacion.privEnlace'),
        onAbrir: abrir(urlPriv),
      },
    ],
    opcionales: [{ clave: CLAVE_ARBITRAJE, texto: t('aceptacion.arbitraje') }],
    rotuloOpcionales: t('aceptacion.opcionalRotulo'),
    /* La nota del arbitraje dice qué pasa si NO se marca, y eso es contenido
       legal, no adorno. La pieza no tiene ranura para una nota POR documento
       —su `rotuloOpcionales` rotula la SECCIÓN—, así que la pinta la pantalla
       justo debajo. Con un solo opcional el resultado es el de la pieza vieja;
       el día que haya dos, la nota necesita su ranura en la pieza. */
    notaArbitraje: t('aceptacion.arbitrajeNota'),
  };
}
