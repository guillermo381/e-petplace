/**
 * ═══════════════════════════════════════════════════════════════════════════
 * `with-barra-sin-velo` — QUE LA BARRA DE TRES BOTONES NO LE PONGA UN VELO
 * ENCIMA AL MAGENTA DE LA ONDA.
 *
 * ── QUÉ VELO, y de dónde sale ──────────────────────────────────────────────
 * En modo edge-to-edge la app dibuja DEBAJO de la barra de navegación. Android
 * no confía en que el fondo tenga contraste y **le pinta encima un velo
 * translúcido** («scrim»): `isNavigationBarContrastEnforced`. Sobre un fondo
 * claro no se nota; **sobre el magenta de la `OndaAcceso` sí**, porque el velo
 * lo apaga justo en la franja de abajo, que es donde vive el acceso.
 *
 * ── POR QUÉ ES UN PLUGIN PROPIO Y NO UNA CLAVE DE `app.json` ───────────────
 * Medido, no supuesto: React Native lee el atributo **del tema de la app**
 * (`ReactAndroid/.../view/WindowUtil.kt`):
 *
 *     val attributes = intArrayOf(android.R.attr.enforceNavigationBarContrast)
 *     ...
 *     isNavigationBarContrastEnforced = enforceNavigationBarContrast   // default true
 *
 * …y **ningún plugin instalado lo expone**: `expo-navigation-bar` no está en el
 * proyecto, y `androidNavigationBar` de `app.json` sólo maneja visibilidad,
 * estilo y color. El único lugar donde se puede decir es `styles.xml` ⇒ un
 * plugin local. **Cero dependencia nueva**: `expo/config-plugins` ya viene con
 * `expo`. *El mismo camino que usa `expo-dev-launcher` en su propio tema.*
 *
 * ⚠️ **`targetApi: 'q'`** — el atributo es de API 29+. Lo escribe
 * `assignStylesValue` como `tools:targetApi`, y el `styles.xml` que Expo genera
 * ya declara el namespace `tools`. Sin él no rompe nada en tiempo de ejecución
 * (un atributo desconocido se ignora), pero el lint de Android grita.
 *
 * ⚠️ **LO QUE ESTE PLUGIN NO HACE:** no pinta la barra ni la esconde. Sólo
 * quita el velo. *Si un día la franja de abajo deja de ser magenta, esto deja
 * de hacer falta — y no molesta.*
 * ═══════════════════════════════════════════════════════════════════════════
 */
const { withAndroidStyles, AndroidConfig } = require('expo/config-plugins')

const withBarraSinVelo = (config) =>
  withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:enforceNavigationBarContrast',
      value: 'false',
      targetApi: 'q',
    })
    return config
  })

module.exports = withBarraSinVelo
