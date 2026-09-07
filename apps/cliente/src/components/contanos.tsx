/**
 * ⭐ **EL «CONTANOS» — UNA HOJA, CUATRO ACCESOS** (S113-C · 2.1 · C1).
 *
 * B partió `InvitacionBio` en `BotonContanos` + `HojaContanos` **por esto
 * exactamente**: la Hoja se abre desde el pie de la ficha de raza, la pastilla
 * del perfil, un chip en la Hoja de Nexo y las celdas vacías de HOY. *Una pieza
 * que trae su propio botón obliga a cada acceso a montar el botón entero o a
 * clonar la Hoja.*
 *
 * Este archivo es **el estado compartido de esa Hoja**: quién la abrió da
 * igual, lo que hace adentro es lo mismo.
 *
 * ── EL CAMINO DE LA CAJA LIBRE ─────────────────────────────────────────────
 *   texto → `clasificarHecho` (D) → **propuesta con su sí y su no** →
 *   el sí → `guardarHechoClasificado` (A) → «Anotado en la vida de Thor»
 *
 * 🔴 **Nexo NUNCA guarda solo.** La Hoja no clasifica —entrega el texto— y la
 * propuesta trae sus dos salidas: *si la única forma de sacar la pregunta de la
 * pantalla fuera darle la razón, dejaría de ser una pregunta.*
 */
import { useCallback, useState } from 'react';
import { HojaContanos, useAviso, type EntradaContanos, type PropuestaContanos } from '@epetplace/ui';
import {
  clasificarHecho,
  guardarHechoClasificado,
  type ClaseDeHecho,
  type PropuestaMemoria,
} from '@epetplace/api';

import { useTraduccion } from '@/i18n';

export type ClaseContanosLocal = ClaseDeHecho;

/** Lo que la pantalla necesita para montar la Hoja desde cualquiera de los
 *  cuatro accesos. **Un solo `abrir()`**: el acceso no decide nada más. */
export function useContanos(mascotaId: string, nombre: string, alGuardar: () => void) {
  const { t } = useTraduccion();
  const aviso = useAviso();
  const [visible, setVisible] = useState(false);
  const [propuesta, setPropuesta] = useState<PropuestaMemoria | null>(null);
  const [pensando, setPensando] = useState(false);

  const guardar = useCallback(
    (clase: ClaseDeHecho, texto: string) => {
      void guardarHechoClasificado({ mascotaId, clase, texto })
        .then((r) => {
          if (!r.ok) {
            aviso.mostrar({ variante: 'error', texto: r.mensaje });
            return;
          }
          /* Dice DÓNDE quedó: es la respuesta a «¿y esto adónde fue?». */
          aviso.mostrar({ variante: 'exito', texto: t('bio.anotado', { nombre }) });
          setPropuesta(null);
          setVisible(false);
          alGuardar();
        })
        .catch(() => {
          aviso.mostrar({ variante: 'error', texto: t('bio.noSePudo') });
        });
    },
    [mascotaId, nombre, aviso, t, alGuardar],
  );

  /** La caja libre. **El texto va a Nexo y vuelve con una clase propuesta** —
   *  la pantalla no adivina la clase, y si Nexo no la sabe, lo dice. */
  const enviarLibre = useCallback(
    (texto: string) => {
      if (texto.trim() === '' || pensando) return;
      setPensando(true);
      void clasificarHecho({ mascotaId, texto: texto.trim() })
        .then((r) => {
          setPensando(false);
          if (!r.ok) {
            aviso.mostrar({ variante: 'error', texto: r.mensaje });
            return;
          }
          const p = r.data.propuestas[0];
          if (p === undefined) {
            /* 🔴 **Sin propuesta NO se guarda nada, y se dice.** Guardarlo en
               un cajón por defecto sería inventar la clase — y la clase decide
               si eso termina en la franja de seguridad o en un recuerdo. */
            aviso.mostrar({ variante: 'neutro', texto: t('contanos.noSupeClasificar') });
            return;
          }
          setPropuesta(p);
        })
        .catch(() => {
          setPensando(false);
          aviso.mostrar({ variante: 'error', texto: t('bio.noSePudo') });
        });
    },
    [mascotaId, pensando, aviso, t],
  );

  const propuestaUi: PropuestaContanos | undefined =
    propuesta === null
      ? undefined
      : {
          voz: t('contanos.propuesta', { hecho: propuesta.hecho, donde: vozClase(propuesta.clase, t) }),
          vozSi: t('contanos.si'),
          vozNo: t('contanos.no'),
          onGuardar: () => guardar(propuesta.clase, propuesta.hecho),
          onDescartar: () => setPropuesta(null),
        };

  return {
    visible,
    abrir: () => setVisible(true),
    cerrar: () => {
      setPropuesta(null);
      setVisible(false);
    },
    propuestaUi,
    enviarLibre,
    guardar,
  };
}

function vozClase(c: ClaseDeHecho, t: ReturnType<typeof useTraduccion>['t']): string {
  switch (c) {
    case 'comportamiento':
      return t('contanos.dondeComportamiento');
    case 'rasgo':
      return t('contanos.dondeRasgo');
    case 'medico':
      return t('contanos.dondeMedico');
    case 'recuerdo':
      return t('contanos.dondeRecuerdo');
  }
}

/** Las cuatro entradas, iguales desde cualquier acceso. */
export function entradasContanos(
  t: ReturnType<typeof useTraduccion>['t'],
  abrirClase: (c: ClaseDeHecho) => void,
): readonly EntradaContanos[] {
  return [
    { clase: 'comportamiento', titulo: t('bio.enComportamiento'), detalle: t('bio.enComportamientoDet'), onPress: () => abrirClase('comportamiento') },
    /* ⏪ **ACÁ VIVÍA UN MAPEO `personalidad` ⇄ `rasgo`** — la pieza y el motor
       usaban dos palabras para lo mismo y yo lo traducía en esta línea. **B
       alineó el vocabulario** en `a3e6bc4c`: ahora los dos dicen `rasgo`.
       *Curarlo en la fuente vale más que mi mapeo: el mapeo había que
       acordarse de mirarlo cada vez que alguien tocara cualquiera de los dos
       lados.* */
    { clase: 'rasgo', titulo: t('bio.enPersonalidad'), detalle: t('bio.enPersonalidadDet'), onPress: () => abrirClase('rasgo') },
    { clase: 'medico', titulo: t('bio.enMedico'), detalle: t('bio.enMedicoDet'), onPress: () => abrirClase('medico') },
    { clase: 'recuerdo', titulo: t('bio.enRecuerdo'), detalle: t('bio.enRecuerdoDet'), onPress: () => abrirClase('recuerdo') },
  ];
}

export { HojaContanos };
