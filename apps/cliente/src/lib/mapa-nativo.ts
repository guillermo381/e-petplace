import Constants from 'expo-constants';

/**
 * EL GUARD DEL MAPA NATIVO — **la mitad que el cliente nunca recibió.**
 *
 * Gemelo de `apps/prestador/src/lib/mapa-nativo.ts` (S80-B19). Su ley, verbatim
 * del original:
 *
 * > *«Un secret faltante debe costar EL MAPA, jamás la app. La estructura
 * > (render condicional + voz honesta) no se retira nunca; lo único que cambia
 * > es este flag.»*
 *
 * 🔴 **POR QUÉ NACE HOY, S106-A t3 (26-ago-2026):** el founder abrió el detalle
 * de un prestador y **la app se cerró sola, tres de tres veces**. Es el mismo
 * crash de S80 —`IllegalStateException: API key not found` en
 * `com.rnmaps.maps.MapView.onCreate`, **hilo nativo, fuera de toda
 * ErrorBoundary**— y estuvo **latente en el cliente todo este tiempo**: el
 * guard se construyó sólo del lado del prestador.
 *
 * ⚠️ **RETRACTACIÓN (27-ago):** cuando esto se escribió, se afirmó que **el
 * prestador estaba sano** porque su `AndroidManifest.xml` tenía la key. **Eso
 * era falso y la medición estaba mal hecha:** el archivo leído era el del
 * **prebuild**, no el del APK. Medido con `verify-manifest-apk` sobre los
 * artefactos, **ninguno de los dos APK tiene la key** ⇒ el prestador tenía el
 * mismo crash latente en «Cómo te ven», y su flag pasó a `false`. Ver `D-944`.
 * *Leer el insumo de un artefacto y llamarlo el artefacto es la misma clase de
 * error que medir una rama en vez del objeto desplegado.*
 *
 * ── LA CAUSA, MEDIDA Y ESTRUCTURAL ─────────────────────────────────────────
 * El `AndroidManifest.xml` del prebuild de las APK de S106 t2 (26-ago 00:50)
 * **no tiene `com.google.android.geo.API_KEY`**. Y no fue un descuido: medido
 * contra EAS,
 *
 *     GOOGLE_MAPS_API_KEY = ***** (secret env variable that can only be
 *                                  accessed on EAS builder)
 *
 * ⇒ **una build LOCAL nunca puede tener esa key.** Es `D-574` con su mecanismo
 * por fin nombrado: *los secrets del build local no fallan, se omiten* — y
 * `app.config.ts` colabora con `?? ''`, que convierte «falta la key» en «la key
 * es vacía» sin una línea de error.
 *
 * ── POR QUÉ NO SE VIO ANTES, Y ES LA PARTE INTERESANTE ─────────────────────
 * `v_prestadores_publicos` **rebotaba entera** para toda familia (los
 * privilegios por columna de `lat`/`lon`), así que el perfil nunca llegaba y
 * **el mapa nunca se montaba**. Al curar la vitrina, `zona_lat` empezó a llegar
 * con valor y el mapa se montó por primera vez.
 *
 * > *No lo introdujo la cura: lo destapó.* **L-284 al pie** — un cambio que
 * > destapa un defecto latente se lleva la culpa del defecto.
 *
 * ── DISPARO DEL FLIP A `true` — las dos condiciones, ninguna de memoria ────
 *  1. Una build **en la nube** (jamás `--local`: la key es inaccesible ahí),
 *     **verificada POR MANIFEST** con `scripts/verify-manifest-apk.mjs` antes
 *     de entregarla.
 *  2. El APK sin key **fuera del dispositivo del founder** — el flip viaja por
 *     OTA y le llegaría también al APK roto, **re-abriendo el crash**.
 */
/* ── S107 · B2 (firma del founder, 27-ago-2026) ────────────────────────────
   ⏪ ACA HABIA UNA CONSTANTE EN `false`, y arriba la promesa de que «muere
   sola» cuando llegara una build con la key. **No murio sola: era un `const`.**
   El 27-ago se compilo un APK local CON la key —verificado por manifiesto,
   `✓ meta-data geo.API_KEY`— y esta linea lo habria hecho decir «sin mapas»
   sobre una app que si los tiene.

   🔴 Y de paso cae la premisa que sostenia el `false`, que decia:
   *«una build LOCAL nunca puede tener esa key»*. **Falso, y falsado con un
   APK**: la key es inaccesible para el builder de EAS en la nube, no para una
   build local, que corre en la maquina donde la key vive. Lo que la condicion
   ① queria de verdad no era «en la nube»: era **verificada por manifiesto**.

   AHORA SE DERIVA: `app.config.ts` calcula el veredicto en build-time desde la
   presencia real de `GOOGLE_MAPS_API_KEY` y lo expone como booleano en `extra`
   (nunca la key — medido: Expo la borra del config embebido, asi que leerla
   desde aca era imposible).

   🔑 Lo computa **la misma build que la hornea**: no hay dos fuentes que puedan
   divergir, y por eso esto no vuelve a caducar en silencio.

   ⚠️ FAIL-CLOSED: `!== true` — si `extra` no llega, si el campo falta, o si
   viene con cualquier otra cosa, el flag queda en `false` y **se pierde el
   mapa, jamas la app**. Es la ley original de este archivo, intacta. */
export const MAPA_NATIVO_DISPONIBLE =
  (Constants.expoConfig?.extra as { mapasHorneados?: boolean } | undefined)?.mapasHorneados === true;
