/**
 * LOS DOS FILTROS DE «MIS CASOS» — un ADAPTADOR de `FiltroPills`, jamás una
 * hilera propia.
 *
 * 🔴 **B me lo dejó escrito como orden y con su caso medido:** en el HOY del
 * prestador alguien siguió **221 líneas** con su hilera propia *después* de
 * que `FiltroPills` existiera, **sin que nada fallara** — el filtro filtraba,
 * el typecheck pasaba, el gate de diseño pasaba. *Lo vio el founder comparando
 * su pantalla con la galería.* **Nada en el árbol relaciona una pieza nueva
 * con el código que debería reemplazarla**, así que si acá escribiera chips
 * propios nadie me lo diría.
 *
 * ⇒ Lo único que vive en este archivo es **el vocabulario**: qué ejes hay, su
 * voz y su capa. **El dibujo es de la pieza.** Mismo molde que
 * `apps/prestador/src/components/filtro-oficio.tsx`.
 */

import { View } from 'react-native';
import { FiltroPills, spacing, type OpcionFiltro } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

/** Qué mostrar: todo, lo que sigue esperando algo, o lo que ya terminó. */
export type FiltroEstadoCaso = 'todos' | 'abiertos' | 'cerrados';
/** La ventana temporal. Ver la nota de abajo: hoy es de VISTA, y por qué. */
export type FiltroFechaCaso = 'todos' | 'semana' | 'mes';

export function FiltrosDeCaso({
  estado,
  onEstado,
  fecha,
  onFecha,
}: {
  estado: FiltroEstadoCaso;
  onEstado: (v: FiltroEstadoCaso) => void;
  fecha: FiltroFechaCaso;
  onFecha: (v: FiltroFechaCaso) => void;
}) {
  const { t } = useTraduccion();

  /* CAPA: `cuidado` para lo que sigue vivo, sin capa para «todos» y para lo
     terminado. *Un caso cerrado no pide nada y no tiene por qué llamar.* */
  const porEstado: OpcionFiltro<FiltroEstadoCaso>[] = [
    { codigo: 'todos', etiqueta: t('postventa.filtroTodos'), icono: null, capa: null },
    { codigo: 'abiertos', etiqueta: t('postventa.filtroAbiertos'), icono: null, capa: 'cuidado' },
    { codigo: 'cerrados', etiqueta: t('postventa.filtroCerrados'), icono: null, capa: null },
  ];

  /* 🔴 **SIN GLIFO, y no es un olvido**: la ventana temporal no tiene set en
     el registry —lo mismo que el prestador declara en su hilera de fechas— y
     un glifo inventado para tres opciones es peor que ninguno (Ley 12). */
  const porFecha: OpcionFiltro<FiltroFechaCaso>[] = [
    { codigo: 'todos', etiqueta: t('postventa.fechaTodos'), icono: null, capa: null },
    { codigo: 'semana', etiqueta: t('postventa.fechaSemana'), icono: null, capa: null },
    { codigo: 'mes', etiqueta: t('postventa.fechaMes'), icono: null, capa: null },
  ];

  return (
    <View style={{ gap: spacing[1] }}>
      <FiltroPills opciones={porEstado} activo={estado} onCambio={onEstado} />
      <FiltroPills opciones={porFecha} activo={fecha} onCambio={onFecha} />
    </View>
  );
}
