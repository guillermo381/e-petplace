/**
 * sonda-manifest — el borde JS de la sonda (S81, D-579).
 * PREPARADO-APAGADO (patrón D-456): el módulo nativo viaja en el TREN
 * de notificaciones; hasta esa build, `requireOptionalNativeModule`
 * devuelve null y esta función responde null HONESTO — los APK viejos
 * jamás crashean (L-187: lo nativo se monta detrás de un guard).
 *
 * CERO consumidores hoy A PROPÓSITO: el flip del guard del mapa a
 * sonda-viva es decisión de mesa POST-tren (D-579), con su gate.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';

const nativo = requireOptionalNativeModule<{
  leerMetaData(clave: string): string | null;
}>('SondaManifest');

/** null = módulo ausente (APK pre-tren) O meta-data inexistente. */
export function leerMetaDataManifest(clave: string): string | null {
  return nativo?.leerMetaData(clave) ?? null;
}

/** El caso que motivó la sonda: ¿el APK instalado lleva la key del
 *  mapa? null = no se puede saber (pre-tren) — distinto de false. */
export function manifestTieneKeyDeMapa(): boolean | null {
  if (nativo === null) return null;
  return leerMetaDataManifest('com.google.android.geo.API_KEY') !== null;
}
