/**
 * DÓNDE LA PRESENCIA NO EXISTE — prestador (S113-C · lote 0.3).
 *
 * Sin un solo import de runtime, a propósito: **el arnés llama a ESTA función,
 * la misma que corre en pantalla**, en vez de a una réplica que comparte sus
 * supuestos (`L-459`, y el precedente de `lib/nexo/estado.ts` del cliente).
 *
 * ⚠️ **SE COMPARA POR PREFIJO, no por igualdad** — la misma cura que el
 * cliente ya cobró: un guard con `===` no alcanza a `checkout-plan`, y acá no
 * alcanzaría a un futuro `durante-algo`. *Un guard que pasa siempre no se
 * descubre: se descubre el disco encima del botón que importa.*
 *
 * ⚠️ Y la lista es **por superficie y con su razón**, jamás un olvido (N28).
 */
const PREFIJOS_SIN_PRESENCIA: readonly string[] = [
  /* La consulta en vivo del vet: la pantalla es el acto, y el orbe caería
     sobre el dictado. */
  'consulta',
  /* El durante de los cuatro oficios: lo mismo, con las manos ocupadas. */
  'durante',
  /* La videollamada: el video ES la pantalla. */
  'videollamada',
  'videoconsulta',
  /* El mostrador y el cobro: hay plata en curso y alguien esperando enfrente. */
  'mostrador',
  'cobro',
  /* El hilo de adopción — el disco cae sobre la barra de escribir. Es el
     mismo rojo que el founder nombró del lado del cliente. */
  'solicitud',
]

/** ¿La presencia puede existir en esta pantalla? Recibe `useSegments()`. */
export function presenciaVisibleEn(segmentos: readonly string[]): boolean {
  return !segmentos.some((s) => PREFIJOS_SIN_PRESENCIA.some((p) => s === p || s.startsWith(`${p}-`)))
}
