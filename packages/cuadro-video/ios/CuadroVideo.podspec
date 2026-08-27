Pod::Spec.new do |s|
  s.name           = 'CuadroVideo'
  s.version        = '0.1.0'
  s.summary        = 'Captura un cuadro del video de una llamada y lo deja como PNG.'
  s.author         = 'e-PetPlace'
  s.homepage       = 'https://epetplace.com'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  # El pod de WebRTC lo trae el fork; acá sólo se usa.
  s.dependency 'LiveKitWebRTC'
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
