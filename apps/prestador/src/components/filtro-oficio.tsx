/**
 * FILTRO POR OFICIO del HOY — hoy es un ADAPTADOR de `FiltroPills`
 * (`packages/ui`, S85-B7), no una hilera propia.
 *
 * ═══ ⏪ S85-C40 · MURIÓ LA LÍNEA VIAJERA, Y ERA UNA FIRMA ════════════
 *
 * Hasta hoy este archivo dibujaba a mano **221 líneas**: texto plano con
 * glifo al lado y **una línea que viajaba** bajo el elegido, con su
 * `useSharedValue` y su física. **Estaba firmada por el founder**
 * (S80-B15) y su argumento era bueno: *el filtro tiene "todos" como
 * estado legal y sus opciones aparecen según la oferta — la posición es
 * lo que el ojo pide, y la huella sola no leía*.
 *
 * **Gana la firma más nueva** — los chips con pata que el founder aprobó
 * en la galería (⭐ GATE S85): **pastilla con fondo propio**, el elegido
 * **se hunde** (pierde elevación, baja a `bg.hundido`, se achica) y **la
 * pata lo PISA desde arriba** (`MarcaEleccion` con `accent.control`).
 * **Pero la anterior NO se borra en silencio:** dos letras firmadas que
 * se contradicen son peores que una equivocada, porque cualquiera cita
 * la que le conviene y queda "en regla". *Lo que la nueva resuelve y la
 * vieja no: la marca de elección es LA MISMA en toda la casa — la pata
 * pisa lo elegido en los filtros, en los selectores y acá.*
 *
 * 🔴 **Y ES EL MISMO MECANISMO QUE COBRÓ CON LOS GLIFOS DE LA BARRA, LA
 * CUARTA VEZ EN LA SESIÓN: la pieza promovida no llegó al consumidor.**
 * B construyó `FiltroPills` y esta pantalla siguió con su hilera local —
 * **sin que nada fallara**: el filtro filtraba, el typecheck pasaba, el
 * gate de diseño pasaba. *Lo vio el founder comparando su pantalla con
 * la galería.* Una promoción no es una migración, y **nada en el árbol
 * relaciona una pieza nueva con el código que debería reemplazar**.
 *
 * ⇒ **Lo que queda acá es lo único que ES de esta pantalla:** qué
 * oficios tienen oferta activa, su voz y su capa. **El dibujo es de la
 * pieza.**
 */

import { FiltroPills, type OpcionFiltro } from '@epetplace/ui';

import { useTraduccion } from '@/i18n';

export type FiltroOficioValor = 'todos' | 'paseo' | 'grooming' | 'adiestramiento' | 'vet';

export function FiltroOficio({
  activo,
  onCambio,
  oficios,
}: {
  activo: FiltroOficioValor;
  onCambio: (v: FiltroOficioValor) => void;
  /** S63-B: solo los oficios con oferta ACTIVA ganan segmento. S69-B: +vet. */
  oficios: { paseo: boolean; grooming: boolean; adiestramiento: boolean; vet: boolean };
}) {
  const { t } = useTraduccion();

  /* LAS CUATRO CON ETIQUETA (B14 ②, que sobrevive al cambio de pieza):
     "Todos" era texto y los oficios glifos sueltos — nada comparable.
     Todos hablan igual; "Todos" va SIN glifo porque no es un oficio, y
     ése es el único caso de `icono: null` acá.

     LA CAPA sale de la taxonomía firmada (Ley 10), no del color que el
     archivo viejo tenía a mano: paseo · estética · adiestramiento son
     CUIDADO; veterinaria es la que cambia de capa. *El local pintaba
     grooming con `status.warningText` —un color de ESTADO para una
     categoría—, y eso muere con el dibujo.* */
  const opciones: OpcionFiltro<FiltroOficioValor>[] = [
    { codigo: 'todos', etiqueta: t('agenda.filtroTodos'), icono: null, capa: null },
    ...(oficios.paseo
      ? [{ codigo: 'paseo' as const, etiqueta: t('agenda.filtroPaseos'), icono: 'paseo' as const, capa: 'cuidado' as const }]
      : []),
    ...(oficios.grooming
      ? [{ codigo: 'grooming' as const, etiqueta: t('agenda.filtroEstetica'), icono: 'grooming' as const, capa: 'cuidado' as const }]
      : []),
    ...(oficios.adiestramiento
      ? [{ codigo: 'adiestramiento' as const, etiqueta: t('agenda.filtroAdiestramiento'), icono: 'training' as const, capa: 'cuidado' as const }]
      : []),
    ...(oficios.vet
      ? [{ codigo: 'vet' as const, etiqueta: t('agenda.filtroVeterinaria'), icono: 'veterinaria' as const, capa: 'identidad' as const }]
      : []),
  ];

  return <FiltroPills opciones={opciones} activo={activo} onCambio={onCambio} />;
}
