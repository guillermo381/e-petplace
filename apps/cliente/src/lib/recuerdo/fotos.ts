/**
 * LAS FOTOS DE LOS RECUERDOS DEL TIMELINE (S113-A, lote 0.1).
 *
 * `ItemTimeline.foto_path` trae el **PATH** del bucket `mascotas`, que es
 * PRIVADO desde S47-B0.2: para pintarlo hay que firmarlo. Este hook hace esa
 * resolución **por lote y una sola vez por tanda**, con `resolverUrlsFotos`
 * —que ya cachea con TTL y firma en bloque—, en vez de una firma por fila.
 *
 * Vive acá y no dentro de cada pantalla porque tiene **dos consumidores** —el
 * Hogar y el perfil de mascota— y *un helper copiado en dos lugares es cómo
 * dos listas de la misma casa empiezan a divergir* (regla 37).
 *
 * ⚠️ **Un fallo de firma deja la fila SIN foto, jamás rota**: el mapa no trae
 * esa clave y la fila se dibuja con su texto. *No se muestra un roto ni un
 * placeholder que insinúe que la foto se perdió — el objeto sigue en el
 * bucket; lo que falló es la firma de este momento.*
 */
import { useEffect, useState } from 'react';
import { resolverUrlsFotos } from '@epetplace/api';

/** path → URL firmada. Vacío mientras resuelve, y vacío si falla. */
export function useFotosDeRecuerdos(
  items: ReadonlyArray<{ foto_path: string | null }>,
): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  /* La clave del efecto son los PATHS, no el array: la lista del timeline se
     re-crea en cada render y dispararía una resolución por render. */
  const clave = items
    .map((i) => i.foto_path)
    .filter((p): p is string => p !== null)
    .sort()
    .join('|');

  useEffect(() => {
    let vive = true;
    const paths = clave.length > 0 ? clave.split('|') : [];
    if (paths.length === 0) {
      setUrls(new Map());
      return;
    }
    void resolverUrlsFotos(paths).then((m) => {
      if (vive) setUrls(m);
    });
    return () => {
      vive = false;
    };
  }, [clave]);

  return urls;
}
