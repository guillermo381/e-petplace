/**
 * ⭐ **LA BÚSQUEDA — UNA CAJA, TODA LA FAMILIA** (S113-C · fase 3 · C3).
 *
 * El estado compartido, para que **el Hogar y la Hoja de Nexo** busquen lo
 * mismo. *Dos cajas con dos implementaciones se desincronizan en la primera que
 * alguien toque* (Ley 3: la lógica vive una vez).
 *
 * ── EL ORDEN, Y POR QUÉ ES ESE ────────────────────────────────────────────
 *   texto en Postgres (instantáneo, gratis) → si no alcanza, Nexo
 *
 * 🔴 **La IA no entra a buscar: entra a ENTENDER.** «Cuándo le toca la pipeta»
 * es una pregunta, no una búsqueda — y mandarla al índice de texto devuelve
 * cero con toda razón. *Gastar una llamada a un modelo en «alimento» sería
 * pagar por lo que un índice resuelve en milisegundos.*
 *
 * ── 🔴 NUNCA INVENTA UN RESULTADO ─────────────────────────────────────────
 * Sin resultados **lo dice** y ofrece preguntarle a Nexo. *Una búsqueda que
 * rellena con lo más parecido le enseña a la familia a desconfiar de todas las
 * demás.*
 */
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { gruposConAlgo, type GrupoResultados, type TipoResultado } from '@epetplace/ui';
import { buscarEnMiFamilia } from '@epetplace/api';

import { useTraduccion } from '@/i18n';

/** El orden de los cajones en pantalla. **Es una decisión, no el orden en que
 *  el motor los devuelve**: primero la mascota (lo que la familia busca nueve
 *  de cada diez veces) y al final los prestadores, que son de afuera. */
const ORDEN: readonly TipoResultado[] = [
  'mascotas',
  'citas',
  'papeles',
  'recuerdos',
  'pedidos',
  'despensa',
  'prestadores',
];

/**
 * 🔴 **DOS VOCABULARIOS PARA LO MISMO, y el compilador los cazó.** El motor
 * dice `mascota · cita · pedido · papel · producto · prestador` (singular); la
 * pieza dice `mascotas · citas · pedidos · papeles · recuerdos · despensa ·
 * prestadores` (plural). *Ninguno está mal: son de dos autores distintos, y por
 * eso el mapa vive acá, explícito, y no como un cast.*
 *
 * ⚠️ **Y de paso apareció un desfasaje del lado del motor, medido:** la RPC
 * **devuelve `papel`** —lo verifiqué en `20260910220000_s113a_ruta_documentos`—
 * y `TipoResultado` de `coach.ts` **no lo lista**. El wrapper compila porque
 * el tipo es una promesa, no una validación. *Pasa a A por el parte.*
 *
 * `null` = un tipo que la pieza no dibuja. **No se descarta en silencio**: el
 * consumidor lo cuenta y lo dice, porque *un resultado que desaparece por un
 * vocabulario desalineado se lee como «no hay».*
 */
const A_GRUPO: Record<string, TipoResultado | null> = {
  mascota: 'mascotas',
  cita: 'citas',
  pedido: 'pedidos',
  papel: 'papeles',
  recuerdo: 'recuerdos',
  producto: 'despensa',
  prestador: 'prestadores',
};

export function useBusqueda() {
  const { t } = useTraduccion();
  const router = useRouter();
  const [termino, setTermino] = useState('');
  const [grupos, setGrupos] = useState<readonly GrupoResultados[]>([]);
  const [buscando, setBuscando] = useState(false);
  /** El término de la última búsqueda **lanzada**, para descartar respuestas
   *  viejas: *sin esto, una consulta lenta pisa el resultado de la que el
   *  usuario escribió después.* */
  const ultimo = useRef('');

  const buscar = useCallback(
    (q: string) => {
      setTermino(q);
      const limpio = q.trim();
      ultimo.current = limpio;
      if (limpio.length < 2) {
        /* Con una letra no se busca: *el índice devolvería medio expediente y
           la familia tendría que leerlo para descartar.* */
        setGrupos([]);
        return;
      }
      setBuscando(true);
      void buscarEnMiFamilia(limpio).then((r) => {
        /* Llegó tarde: su término ya no es el que se está buscando. */
        if (ultimo.current !== limpio) return;
        setBuscando(false);
        if (!r.ok) {
          /* 🔴 Un fallo deja los grupos VACÍOS y la pantalla dice «no
             encontramos» con su camino a Nexo. *No se inventa un resultado, y
             tampoco se finge que la búsqueda no ocurrió.* */
          setGrupos([]);
          return;
        }
        const porTipo = new Map<TipoResultado, GrupoResultados['resultados'][number][]>();
        let sinGrupo = 0;
        for (const x of r.data.resultados) {
          const grupo = A_GRUPO[x.tipo] ?? null;
          if (grupo === null) {
            /* Un tipo nuevo del motor que la pieza todavía no dibuja. **Se
               cuenta**: sin esto, el resultado desaparece y la búsqueda parece
               no haberlo encontrado. */
            sinGrupo += 1;
            continue;
          }
          const lista = porTipo.get(grupo) ?? [];
          lista.push({
            id: x.id,
            tipo: grupo,
            titulo: x.titulo,
            subtitulo: x.subtitulo ?? undefined,
            fecha: x.fecha ?? undefined,
            /* 🔴 **La ruta la manda el MOTOR**, no la arma la pantalla: A la
               resuelve por tipo y ya curó la de los papeles. *Componerla acá
               sería una segunda verdad sobre dónde vive cada cosa.* */
            onPress: () => router.push(x.ruta as '/hogar'),
          });
          porTipo.set(grupo, lista);
        }
        if (sinGrupo > 0) {
          console.warn(`[busqueda] ${sinGrupo} resultado(s) de un tipo que la pieza no dibuja`);
        }
        setGrupos(
          gruposConAlgo(
            ORDEN.map((tipo) => ({
              tipo,
              rotulo: t(`busqueda.grupo_${tipo}` as 'busqueda.grupo_mascotas'),
              resultados: porTipo.get(tipo) ?? [],
            })),
          ),
        );
      });
    },
    [router, t],
  );

  const limpiar = useCallback(() => {
    setTermino('');
    setGrupos([]);
    ultimo.current = '';
  }, []);

  return { termino, grupos, buscando, buscar, limpiar };
}
