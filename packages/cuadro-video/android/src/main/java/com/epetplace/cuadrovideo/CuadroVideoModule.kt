package com.epetplace.cuadrovideo

import android.graphics.Bitmap
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import com.facebook.react.bridge.ReactApplicationContext
import com.oney.WebRTCModule.WebRTCModule
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.webrtc.VideoFrame
import org.webrtc.VideoSink
import org.webrtc.VideoTrack
import org.webrtc.YuvHelper
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

/**
 * EL CUADRO CONGELADO — captura UN frame del video y lo deja como PNG.
 *
 * ── POR QUÉ NATIVO ────────────────────────────────────────────────────────
 * El frame decodificado **ya llega** en cada llamada: el fork lo recibe con
 * `addSink`/`onFrame` y lo usa sólo para contar si el video vive
 * (`VideoTrackAdapter.java:82`). **No falta el acceso: falta la conversión** —
 * y la conversión vive del lado nativo, así que nada de esto viaja por OTA.
 *
 * ── EL CAMINO, y cada paso está medido contra el artefacto real ───────────
 * `VideoFrame` → `toI420()` → `YuvHelper.I420ToNV12` → `YuvImage` → JPEG →
 * `Bitmap` → PNG. **`YuvHelper` y `JavaI420Buffer` NO están referenciadas por
 * el fork, pero SÍ están en `io.github.webrtc-sdk:android:144.7559.05`**, que
 * es su dependencia `api` — verificado descomprimiendo el `.aar` antes de
 * escribir una línea. *El fork no las usa; el classpath sí las tiene.*
 *
 * ── 🔴 UN SOLO FRAME, Y EL SINK SE RETIRA ─────────────────────────────────
 * El sink se agrega, toma **el primer frame que llegue** y **se quita solo**.
 * *Un sink que queda pegado al track recibe treinta frames por segundo para
 * siempre y nadie se entera: la llamada se pondría lenta sin ningún síntoma
 * que apunte acá.*
 *
 * `AtomicBoolean` porque `onFrame` corre en el hilo del decodificador y la
 * promesa se resuelve una sola vez: **dos frames casi simultáneos no pueden
 * resolverla dos veces.**
 *
 * ── ⚠️ LO QUE ESTE MÓDULO NO DECIDE ──────────────────────────────────────
 * No sube, no adjunta, no pregunta permisos: **devuelve una ruta**. La
 * subida y el registro clínico son de la app, y `adjuntarCuadroTeleconsulta`
 * ya existe. *Un módulo nativo que además decide qué hacer con lo que
 * produce es imposible de probar solo.*
 */
class CuadroVideoModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("CuadroVideo")

    /**
     * @param trackId el id del track de video.
     * @param pcId    `-1` para el track LOCAL (el de la propia cámara), o el
     *                id de la PeerConnection para el REMOTO. **La misma
     *                llamada sirve para los dos** — lo dice
     *                `WebRTCModule.getTrack(int, String)`, que es público.
     *                *Por eso la prueba barata contra el local no es un
     *                atajo: ejercita el mismo camino que el remoto va a
     *                usar.*
     */
    AsyncFunction("capturarCuadro") { trackId: String, pcId: Int, promise: Promise ->
      /* 🔴 EL CAST NO ES UN ATAJO — `appContext.reactContext` está declarado
         como `Context?` (Android), **no** como `ReactApplicationContext**, y
         su propio doc dice qué es: *«Provides access to the react application
         context»*. El tipo declarado es el supertipo por desacople; el objeto
         en runtime es el de React.
         ⏪ **ACÁ ESTUVO EL DEFECTO QUE COSTÓ UNA BUILD:** llamé
         `getNativeModule` sobre el `Context` pelado. *Y los dos errores del
         compilador eran UNO: sin resolver el primero, `webrtc` quedaba de tipo
         inválido y `getTrack` tampoco resolvía — dos mensajes, una causa.* */
      val reactContext = appContext.reactContext as? ReactApplicationContext
      if (reactContext == null) {
        promise.reject("sin_contexto", "No hay contexto de React.", null)
        return@AsyncFunction
      }

      val webrtc = reactContext.getNativeModule(WebRTCModule::class.java)
      if (webrtc == null) {
        promise.reject("sin_webrtc", "El módulo de WebRTC no está cargado.", null)
        return@AsyncFunction
      }

      val track = webrtc.getTrack(pcId, trackId)
      if (track !is VideoTrack) {
        /* 🔴 Se distingue «no existe» de «existe y no es video». *Un error
           único haría que un trackId de audio y un trackId inventado se vean
           igual, y son cosas distintas de arreglar.* */
        promise.reject(
          if (track == null) "track_no_encontrado" else "track_no_es_video",
          "No hay un track de video con ese id.",
          null,
        )
        return@AsyncFunction
      }

      val yaResolvio = AtomicBoolean(false)
      var sink: VideoSink? = null

      sink = VideoSink { frame ->
        /* Sólo el PRIMER frame. Los siguientes caen acá hasta que el
           `removeSink` se aplique — y salen sin hacer nada. */
        if (!yaResolvio.compareAndSet(false, true)) return@VideoSink
        try {
          val archivo = escribirPng(frame, reactContext.cacheDir)
          promise.resolve(archivo.absolutePath)
        } catch (e: Throwable) {
          /* El error REAL viaja: *«no se pudo» sin la causa obliga a
             adivinar exactamente donde el POC de 2020 dejó de tener
             mantenedor.* */
          promise.reject("fallo_conversion", e.message ?: e.toString(), e)
        } finally {
          sink?.let { track.removeSink(it) }
        }
      }

      track.addSink(sink)

      /* ⚠️ Sin frames no hay promesa resuelta, y una promesa que nunca
         resuelve es una pantalla colgada. *La cámara apagada, el track
         mudo y el aparato que no decodifica se ven todos igual desde acá.*
         El techo lo pone la app; acá se declara para que quien lo lea sepa
         que este módulo NO tiene reloj propio. */
    }
  }

  /**
   * `VideoFrame` → PNG.
   *
   * Pasa por JPEG a propósito: `YuvImage.compressToJpeg` es la única vía del
   * SDK que acepta NV21 directo. *Convertir a mano I420→ARGB píxel por píxel
   * en Kotlin es el camino del POC de 2020 y es donde ese código se volvió
   * difícil de sostener.* **La pérdida del JPEG intermedio es de compresión,
   * no de contenido: la imagen sigue siendo la del video**, que es lo único
   * que el criterio de verde exige.
   */
  private fun escribirPng(frame: VideoFrame, dir: File): File {
    val i420 = frame.buffer.toI420() ?: throw IllegalStateException("buffer_sin_i420")
    try {
      val ancho = i420.width
      val alto = i420.height

      /* NV12 y no NV21: `YuvHelper` expone I420ToNV12, y `YuvImage` lee NV21.
         La diferencia son los planos U/V intercambiados, así que se pasan
         cruzados a propósito — *es el truco que evita una conversión más.* */
      val nv = ByteBuffer.allocateDirect(ancho * alto * 3 / 2)
      YuvHelper.I420ToNV12(
        i420.dataY, i420.strideY,
        i420.dataV, i420.strideV,
        i420.dataU, i420.strideU,
        nv, ancho, alto,
      )
      val bytes = ByteArray(nv.capacity())
      nv.rewind()
      nv.get(bytes)

      val salidaJpeg = ByteArrayOutputStream()
      YuvImage(bytes, ImageFormat.NV21, ancho, alto, null)
        .compressToJpeg(Rect(0, 0, ancho, alto), 92, salidaJpeg)

      val mapa = android.graphics.BitmapFactory.decodeByteArray(
        salidaJpeg.toByteArray(), 0, salidaJpeg.size(),
      ) ?: throw IllegalStateException("jpeg_no_decodifica")

      /* 🔴 La rotación del frame se APLICA. *Sin esto, un teléfono en vertical
         produce una imagen acostada — y una imagen clínica acostada no es un
         detalle estético: es una oreja que se ve donde no está.* */
      val rotado = if (frame.rotation != 0) {
        val m = android.graphics.Matrix()
        m.postRotate(frame.rotation.toFloat())
        Bitmap.createBitmap(mapa, 0, 0, mapa.width, mapa.height, m, true)
      } else {
        mapa
      }

      val archivo = File(dir, "cuadro-${System.currentTimeMillis()}.png")
      FileOutputStream(archivo).use { out ->
        rotado.compress(Bitmap.CompressFormat.PNG, 100, out)
      }
      return archivo
    } finally {
      i420.release()
    }
  }
}
