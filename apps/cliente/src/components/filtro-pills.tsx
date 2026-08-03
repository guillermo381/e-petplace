/**
 * ⏫ PROMOVIDO A `packages/ui` EN S85-B7 — este archivo es un RE-EXPORT.
 *
 * Los chips de filtro con pata subieron a la casa por LA REGLA DE LAS
 * PIEZAS: apareció el segundo consumidor (la portada del prestador).
 * Hasta hoy eran un override LOCAL del cliente declarado como tal, con
 * su marcador y R10 vigilándolo para que nadie los generalizara desde
 * una pantalla; su promoción estaba escrita como trabajo de B post-gate,
 * y esto es esa promoción. (El marcador NO se nombra literal acá: R10 lee
 * el fuente CRUDO a propósito —el marcador ES la señal, y viaja con el
 * copy-paste— así que escribirlo en prosa lo dispararía. Lo cacé con el
 * lint, no releyendo.)
 *
 * POR QUÉ QUEDA EL ARCHIVO Y NO SE BORRA: las pantallas del cliente
 * (`hogar/tu-vida`, `perfil/su-historia`) importan de acá. Un re-export
 * las deja intactas —cero cambios en pantallas, que era la condición del
 * pedido— y el día que alguien las toque por otra razón, migran el import
 * y este archivo muere. Mismo patrón con el que `reserva-piezas` re-exporta
 * `PieReserva` desde S82.
 *
 * El código, las leyes y los porqués viven ahora en
 * `packages/ui/src/components/FiltroPills.tsx`, que es donde se leen al
 * construir. Acá no queda lógica: si algo hay que cambiar, se cambia allá.
 */
export {
  FiltroPills,
  FiltroMascotas,
  type OpcionFiltro,
  type FiltroPillsProps,
  type FiltroMascotasProps,
} from '@epetplace/ui';
