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
export const MAPA_NATIVO_DISPONIBLE = false;
