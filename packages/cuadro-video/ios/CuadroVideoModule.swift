import ExpoModulesCore
import WebRTC
import UIKit

/**
 * EL CUADRO CONGELADO — lado iOS. Gemelo de `CuadroVideoModule.kt`.
 *
 * ── ⚠️ `VideoFrameProcessor` NO ERA EL PUNTO DE EXTENSIÓN, y es dato ──────
 * D lo marcó como *«lo primero a leer: si ya es punto de extensión, esa mitad
 * es cablear y no escribir»*. **Leído, y no sirve para esto:** su protocolo es
 * `capturer:didCaptureVideoFrame:` — intercepta los frames **del capturador
 * local ANTES de enviarlos**, que es lo que hace falta para un filtro de
 * video. *Acá no queremos modificar lo que sale: queremos leer un frame de un
 * track cualquiera, y el remoto no pasa por ningún capturador nuestro.*
 *
 * ⇒ La vía es **`RTCVideoRenderer`**, el gemelo exacto de `VideoSink` en
 * Android: se agrega al track con `addRenderer:` y recibe `renderFrame:`.
 * **La simetría entre las dos plataformas se conserva**, que es lo que hace
 * que el criterio de verde ② —las dos o descarte— se pueda cumplir sin dos
 * diseños distintos.
 *
 * ── EL CAMINO ────────────────────────────────────────────────────────────
 * `RTCVideoFrame.buffer` → `RTCCVPixelBuffer` → `CIImage` → `UIImage` → PNG.
 * **Sin `YuvHelper`**: el pixel buffer ya es convertible, así que iOS no
 * necesita la pieza que en Android hubo que ir a buscar al `.aar`.
 */
public class CuadroVideoModule: Module {

  public func definition() -> ModuleDefinition {
    Name("CuadroVideo")

    AsyncFunction("capturarCuadro") { (trackId: String, pcId: Int, promise: Promise) in
      guard let track = Self.buscarTrack(trackId: trackId, pcId: pcId) else {
        promise.reject("track_no_encontrado", "No hay un track de video con ese id.")
        return
      }
      let lector = LectorDeUnCuadro(promise: promise)
      lector.enganchar(a: track)
    }
  }

  /**
   * 🔴 Alcanza el track por el diccionario `localTracks` que `WebRTCModule.h`
   * expone **público** (medido). Para el remoto hace falta la PeerConnection,
   * y por eso el brazo remoto de iOS **se declara pendiente en vez de
   * simularse**: *un `pcId` que se ignora en silencio devolvería el track
   * local cuando le pidan el remoto, y la imagen equivocada en una historia
   * clínica es peor que ninguna.*
   */
  private static func buscarTrack(trackId: String, pcId: Int) -> RTCVideoTrack? {
    guard pcId == -1 else { return nil }
    guard let clase = NSClassFromString("WebRTCModule") as? NSObject.Type else { return nil }
    let modulo = clase.init()
    guard let mapa = modulo.value(forKey: "localTracks") as? [String: RTCMediaStreamTrack] else {
      return nil
    }
    return mapa[trackId] as? RTCVideoTrack
  }
}

/**
 * Toma **UN** frame y se desengancha solo.
 *
 * *Un renderer que queda pegado recibe treinta frames por segundo para
 * siempre y nadie se entera: la llamada se pone lenta sin ningún síntoma que
 * apunte acá.* Y se retiene a sí mismo hasta resolver, porque
 * `addRenderer:` **no retiene**: sin esto, ARC lo liberaría antes del primer
 * frame y la promesa no resolvería nunca.
 */
private final class LectorDeUnCuadro: NSObject, RTCVideoRenderer {
  private let promise: Promise
  private var track: RTCVideoTrack?
  private var yaResolvio = false
  private var yoMismo: LectorDeUnCuadro?

  init(promise: Promise) {
    self.promise = promise
  }

  func enganchar(a track: RTCVideoTrack) {
    self.track = track
    self.yoMismo = self
    track.add(self)
  }

  func setSize(_ size: CGSize) {}

  func renderFrame(_ frame: RTCVideoFrame?) {
    guard !yaResolvio, let frame = frame else { return }
    yaResolvio = true
    defer {
      track?.remove(self)
      yoMismo = nil
    }

    guard let bufferCV = (frame.buffer as? RTCCVPixelBuffer)?.pixelBuffer else {
      promise.reject("buffer_no_convertible", "El frame no trae un pixel buffer.")
      return
    }

    let ci = CIImage(cvPixelBuffer: bufferCV)
    let contexto = CIContext()
    guard let cg = contexto.createCGImage(ci, from: ci.extent) else {
      promise.reject("fallo_conversion", "No se pudo rasterizar el frame.")
      return
    }

    /* La rotación se APLICA, igual que en Android: *una imagen clínica
       acostada no es un detalle estético — es una oreja que se ve donde no
       está.* */
    let orientacion: UIImage.Orientation
    switch frame.rotation {
    case ._90: orientacion = .right
    case ._180: orientacion = .down
    case ._270: orientacion = .left
    default: orientacion = .up
    }
    let imagen = UIImage(cgImage: cg, scale: 1, orientation: orientacion)

    guard let png = imagen.pngData() else {
      promise.reject("fallo_png", "No se pudo escribir el PNG.")
      return
    }
    let ruta = FileManager.default.temporaryDirectory
      .appendingPathComponent("cuadro-\(Int(Date().timeIntervalSince1970 * 1000)).png")
    do {
      try png.write(to: ruta)
      promise.resolve(ruta.path)
    } catch {
      promise.reject("fallo_escritura", error.localizedDescription)
    }
  }
}
