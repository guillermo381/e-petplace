package expo.modules.sondamanifest

import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * LA SONDA DEL MANIFEST (S81, D-579): lee la meta-data del
 * AndroidManifest del APK INSTALADO — la dimensión que ninguna API de
 * Expo instalada expone (medido S81-B2: expo-constants trae
 * android.config VACÍO; el crash de la key era nativo, previo a todo
 * callback JS). Con esta sonda, el guard del mapa deja de ser una
 * constante compilada que no puede ver el manifest (el defecto medido
 * de MAPA_NATIVO_DISPONIBLE) y pasa a preguntar la VERDAD del binario:
 * SondaManifest.leerMetaData("com.google.android.geo.API_KEY").
 */
class SondaManifestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SondaManifest")

    Function("leerMetaData") { clave: String ->
      val ctx = appContext.reactContext ?: return@Function null
      @Suppress("DEPRECATION")
      val info = ctx.packageManager.getApplicationInfo(
        ctx.packageName,
        PackageManager.GET_META_DATA,
      )
      info.metaData?.getString(clave)
    }
  }
}
