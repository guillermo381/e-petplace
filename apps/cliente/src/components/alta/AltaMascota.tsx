/**
 * S91-D · EL ALTA — el despachador. LA PIEZA ÚNICA, LAS DOS ENTRADAS.
 *
 * Los archivos de ruta (`/onboarding/[paso]` y `/hogar/agregar/[paso]`) no
 * hacen NADA más que montar esto con su `modo`. Toda la lógica, la voz y la
 * composición viven acá una sola vez.
 *
 * ── POR QUÉ SIGUEN SIENDO DOS ÁRBOLES DE RUTA ───────────────────────────────
 * Porque la diferencia que queda es REAL y es de navegación, no de contenido:
 * el onboarding vive FUERA de los tabs (todavía no hay hogar donde volver) y
 * el alta adicional vive DENTRO del stack del Hogar (tabs visibles, back
 * natural). Fusionarlos obligaría a una de las dos a mentir sobre dónde está.
 * Lo que se mató es el CALCO —ocho archivos con la misma pantalla escrita dos
 * veces—, no la distinción legítima.
 *
 * ── EL BORRADOR SE ACUMULA EN LOS PARAMS ────────────────────────────────────
 * Cada paso recibe lo acumulado y devuelve SU parcial; el merge ocurre acá y
 * solo acá. Ningún paso conoce a los demás — por eso agregar el paso 2 no
 * tocó ni una línea de los otros tres.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';

import { PasoCierre } from './PasoCierre';
import { PasoEspecie } from './PasoEspecie';
import { PasoFoto } from './PasoFoto';
import { PasoHistoria } from './PasoHistoria';
import { PasoRaza } from './PasoRaza';
import {
  aParams,
  esPaso,
  leerBorrador,
  nuevoTokenIntento,
  MODO,
  siguiente,
  type BorradorAlta,
  type ModoAlta,
  type Paso,
} from './tipos';

export function AltaMascota({ modo, pasoFijo }: { modo: ModoAlta; pasoFijo?: Paso }) {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();

  const crudo = pasoFijo ?? params.paso;
  // Un `paso` que no existe cae al primero en vez de romper: la ruta es
  // pública y un link viejo o tipeado no puede dejar una pantalla en blanco.
  const paso: Paso = esPaso(crudo) ? crudo : 'especie';
  const borrador = leerBorrador(params);

  const rutaPaso = MODO[modo].rutaPaso;

  const avanzar = (parcial: BorradorAlta) => {
    const proximo = siguiente(paso);
    if (proximo === null) return;
    // EL TOKEN DEL INTENTO nace en el primer avance y de ahí viaja solo (ver
    // `tokenIntento` en tipos.ts). Acá y no en el cierre: en el cierre ya sería
    // tarde —cada re-montaje generaría uno nuevo y no habría nada que
    // reconocer—, y acá el `...borrador` de los pasos siguientes lo conserva.
    const conToken: BorradorAlta = {
      ...borrador,
      ...parcial,
      tokenIntento: borrador.tokenIntento ?? nuevoTokenIntento(),
    };
    router.push({
      pathname: rutaPaso,
      params: { ...aParams(conToken), paso: proximo },
    });
  };

  const atras = () => {
    if (router.canGoBack()) router.back();
    else router.replace(MODO[modo].salida);
  };

  switch (paso) {
    case 'especie':
      return (
        <PasoEspecie
          modo={modo}
          borrador={borrador}
          onAvanzar={avanzar}
          onAtras={atras}
          onReintentar={() =>
            router.replace({
              pathname: rutaPaso,
              params: { ...aParams(borrador), paso: 'especie' },
            })
          }
        />
      );
    case 'raza':
      return <PasoRaza borrador={borrador} onAvanzar={avanzar} onAtras={atras} />;
    case 'historia':
      return <PasoHistoria borrador={borrador} onAvanzar={avanzar} onAtras={atras} />;
    case 'foto':
      return <PasoFoto borrador={borrador} onAvanzar={avanzar} onAtras={atras} />;
    case 'cierre':
      // El cierre no tiene «atrás»: el acto ya ocurrió o está ocurriendo.
      return <PasoCierre modo={modo} borrador={borrador} />;
  }
}
