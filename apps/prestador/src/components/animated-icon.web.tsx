/**
 * En web no hay splash nativo que espejar: el overlay no se monta
 * (era así desde el template y sigue siendo lo correcto). El
 * `AnimatedIcon` del template y su CSS module murieron con la tanda
 * de marca S96-C (Ley 37: cero consumidores).
 */
export function AnimatedSplashOverlay() {
  return null;
}
