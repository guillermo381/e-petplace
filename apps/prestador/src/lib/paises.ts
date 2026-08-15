/**
 * LOS HELPERS DE PAÍS DEL PRESTADOR — **la lista ya no vive acá** (S85-C2,
 * mitad de C de D-633; pedido de A en
 * `docs/relevamientos/2026-08-03-s85a-PEDIDO-a-C-paises.md`).
 *
 * ☠️ **MURIÓ `PAISES` — los 23 literales.** Su reemplazo es
 * `obtenerPaisesDelMundo()` de `@epetplace/api`, que cablea
 * `get_paises_para_telefono()` sobre `cat_paises`. **La copia no era
 * inofensiva y hay número:** el `formato` de **Perú** divergía —
 * `cat_paises` acepta `^\+51\d{7,9}$` y esta copia exigía `^\+51\d{9}$`—,
 * o sea que **la app rebotaba números peruanos que la fuente aceptaba**.
 * *Ése es el costo real de una copia que nadie compara.*
 *
 * ⚠️ **LO QUE CAMBIA PARA QUIEN CONSUMA: la lista es ASÍNCRONA.** No es un
 * cambio de import — es un cambio de FORMA. Quien la necesite la carga y
 * la tiene en estado; los helpers de acá pasan a recibirla en vez de
 * cerrar sobre ella. *Un helper que se trae su propia copia para no
 * cambiar de firma es la misma deuda con otro nombre.*
 *
 * LO QUE SÍ SE QUEDA, y por qué cada uno:
 *  · `PAIS_DEFAULT` — es UN código ISO, no una lista: no hay nada que
 *    diverger. Sigue siendo el default del selector de TELÉFONO, jamás de
 *    documentos (ahí el país se DECLARA — P21).
 *  · `bandera` — es aritmética sobre el ISO, sin lista de por medio.
 *  · `nombreDePais` — necesita la lista, así que **la recibe**.
 */

import type { PaisDelMundo } from '@epetplace/api';

/** El default del selector de TELÉFONO — el país donde opera la mayoría.
 *  NO es un techo: cualquiera de los 23 se elige.
 *  ⚠️ **Documentos NO lo usa**, y es a propósito: ahí el país se DECLARA
 *  y arrancar preseleccionado sería declarar por el prestador (P21 · el
 *  mismo patrón del radio de la sede, que arranca sin declarar). */
export const PAIS_DEFAULT = 'EC';

/** La bandera sale del `codigo_iso2` — cada letra a su indicador
 *  regional (FIRMADA S83-C10; el Android del founder las dibuja).
 *  Sin lista de por medio: por eso sobrevivió a la mudanza. */
export const bandera = (iso: string): string =>
  String.fromCodePoint(...[...iso].map((c) => (c.codePointAt(0) ?? 0) + 127397));

/** El nombre humano del país, o su ISO si no está en la lista — un país
 *  guardado que no reconocemos se DICE por su código en vez de
 *  desaparecer (Ley 13: el dato existe, la voz lo admite).
 *
 *  **Recibe la lista** (antes cerraba sobre la copia): con el catálogo
 *  async, un helper que resuelve solo tendría que guardarse una copia — y
 *  esa copia es justamente lo que D-633 vino a matar. */
export const nombreDePais = (paises: PaisDelMundo[], iso: string): string =>
  paises.find((p) => p.codigo === iso)?.nombre ?? iso;

/** El país de un ISO dentro de la lista cargada, o `undefined`. Existe
 *  para que los consumidores no repitan el `.find` con otro criterio. */
export const paisDe = (paises: PaisDelMundo[], iso: string): PaisDelMundo | undefined =>
  paises.find((p) => p.codigo === iso);

/** COMPONE el E.164 que se guarda: el prefijo del país elegido + lo tipeado.
 *
 *  🔴 POR QUÉ VIVE ACÁ Y NO EN UNA PANTALLA (S98-C): esta regla ya existía
 *  **privada** dentro de `(tabs)/cuenta/perfil.tsx`, y el día que una segunda
 *  pantalla necesitó guardar un teléfono el costo se hizo visible — el alta de
 *  repartidor mandaba lo tipeado CRUDO y `repartidores_telefono_check`
 *  (`^\+[1-9][0-9]{6,14}$`) lo rebotaba. **Medido con rojo reproducido:**
 *  `0988888888` → RECHAZADO · `+593988888888` → ENTRA (in-txn, ROLLBACK,
 *  residuo 0). *Es el mismo defecto que S70-B3 curó en el mostrador, en otra
 *  tabla: el `+` no es cosmético, es lo que la fuente exige.*
 *
 *  ⚠️ DEUDA DECLARADA, no escondida: `perfil.tsx` **conserva su copia privada**
 *  —ese archivo no es territorio de esta pista— así que hoy la regla vive en
 *  dos lugares. El cuerpo se extrajo **verbatim**, así que no divergen hoy;
 *  divergirían el día que alguien toque una sola. **Disparo de la migración:
 *  el próximo arco que toque `perfil.tsx`** — importa de acá y borra la suya.
 *
 *  Vacío devuelve vacío: el teléfono es OPCIONAL y un prefijo suelto no es un
 *  teléfono (guardar «+593» sería inventar un número que nadie dio).
 *
 *  ═══════════════════════════════════════════════════════════════════════
 *  🔴 LA FRONTERA DE ESTE HELPER — SU SALIDA NO SIRVE PARA TODA TABLA
 *  ═══════════════════════════════════════════════════════════════════════
 *  Esto devuelve E.164 **CON el `+`**, y **la casa NO tiene una sola
 *  convención de teléfono: la tiene POR TABLA, y se contradicen.** Medido
 *  contra `pg_constraint` (hallazgo de D en S98, verificado acá y **más ancho
 *  de lo reportado — son SEIS las que lo prohíben, no tres**):
 *
 *    EXIGEN el `+`  (`~ '^\+[1-9][0-9]{6,14}$'`)
 *      · prestadores          · repartidores
 *
 *    PROHÍBEN el `+`  (`!~ '^\+'`)
 *      · seller_perfil        · direcciones_guardadas
 *      · cliente_pendiente_registro · criaderos
 *      · refugios             · solicitudes_adopcion
 *
 *  ⇒ **Escribir esta salida en cualquiera de las seis REBOTA**, con el mismo
 *  texto de CHECK crudo que la cura del repartidor vino a sacar. *No es un
 *  descuido de quien las escribió: son la convención VIEJA sobreviviendo a su
 *  derogación* — la regla 28 se derogó en S84 (`CONTRATO` v1.26) con la firma
 *  *«el teléfono se guarda E.164 ENTERO, con su `+`»*, y estas seis nunca se
 *  migraron.
 *
 *  **Hoy no hay defecto vivo y por eso esto es una advertencia y no una ficha
 *  de deuda mía:** los dos consumidores existentes —`repartidores` acá y
 *  `prestadores` en el perfil— escriben justo a las dos que EXIGEN el `+`.
 *  El riesgo es del PRÓXIMO: al promover esto a helper compartido, su salida
 *  quedó a un import de distancia de seis tablas que la rechazan.
 *  **Antes de usarlo, mirá el CHECK de la tabla destino.** */
export const componerE164 = (paises: PaisDelMundo[], valor: string, iso: string): string => {
  const crudo = valor.trim().replace(/[\s-]/g, '');
  if (crudo.length === 0) return '';
  if (crudo.startsWith('+')) return crudo; // ya vino entero: no se toca
  /* D-633: `prefijo` es NULLABLE en el catálogo. Un país sin prefijo declarado
     no puede componer un E.164 ⇒ se devuelve lo crudo en vez de concatenar
     `null` (que produciría la cadena "null593…"). */
  const pais = paisDe(paises, iso);
  return pais?.prefijo == null ? crudo : `${pais.prefijo}${crudo}`;
};
