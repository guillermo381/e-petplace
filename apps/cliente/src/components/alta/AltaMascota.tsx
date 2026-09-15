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
import { PasoDatosBasicos } from './PasoDatosBasicos';
import { PasoCarnet } from './PasoCarnet';
import { PasoFoto } from './PasoFoto';
import { PasoRazaFicha } from './PasoRazaFicha';
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
  const paso: Paso = esPaso(crudo) ? crudo : 'datos';
  const borrador = leerBorrador(params);

  const rutaPaso = MODO[modo].rutaPaso;

  const avanzar = (parcial: BorradorAlta) => irAlSiguiente(parcial, false);

  /* ⭐ **S116-C lote 10 · SALTAR = AVANZAR CON `replace`.** Lo pide la
     pantalla de raza, que se salta sola cuando no tiene nada que contar: con
     `push` quedaría en la pila y el «atrás» del formulario caería en una
     pantalla que se vuelve a saltar — *un gesto que no te devuelve a donde
     estabas se lee como roto, no como rápido.*

     Comparte TODO con `avanzar` salvo el verbo de navegación, así que sale del
     mismo cuerpo: *dos funciones que sólo difieren en `push`/`replace` divergen
     el día que alguien toque una.* */
  const irAlSiguiente = (parcial: BorradorAlta, reemplazando: boolean) => {
    const proximo = siguiente(paso);
    if (proximo === null) return;
    const conToken: BorradorAlta = {
      ...borrador,
      ...parcial,
      tokenIntento: borrador.tokenIntento ?? nuevoTokenIntento(),
    };
    const destino = { pathname: rutaPaso, params: { ...aParams(conToken), paso: proximo } } as const;
    if (reemplazando) router.replace(destino);
    else router.push(destino);
  };

  const atras = () => {
    if (router.canGoBack()) router.back();
    else router.replace(MODO[modo].salida);
  };

  /* ☠️ **EL ALTA PASA DE CINCO PASOS A TRES + EL CIERRE** (S116-C lote 3).
     `PasoEspecie`, `PasoRaza` y `PasoHistoria` murieron; su reparto está en
     la cabecera de `PASOS`, en `tipos.ts`. */
  switch (paso) {
    case 'datos':
      return <PasoDatosBasicos modo={modo} borrador={borrador} onAvanzar={avanzar} onAtras={atras} />;
    case 'foto':
      return <PasoFoto borrador={borrador} onAvanzar={avanzar} onAtras={atras} />;
    case 'raza':
      return (
        <PasoRazaFicha
          borrador={borrador}
          onAvanzar={avanzar}
          onSaltar={(parcial) => irAlSiguiente(parcial, true)}
          onAtras={atras}
        />
      );
    case 'carnet':
      return <PasoCarnet borrador={borrador} onAvanzar={avanzar} onAtras={atras} />;
    case 'cierre':
      // El cierre no tiene «atrás»: el acto ya ocurrió o está ocurriendo.
      return <PasoCierre modo={modo} borrador={borrador} />;
  }
}
