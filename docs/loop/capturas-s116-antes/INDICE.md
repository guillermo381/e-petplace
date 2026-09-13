# ÍNDICE DE LAS CAPTURAS · S116-E · línea base «antes»

> **SHA `ca564994` (`main` == `origin/main`) · 13-sep-2026 · `emulator-5560` (AVD `s113_E`, android-37.1 arm64).**
> **Bundle:** dev build 1.0.7 servido por Metro en el puerto 8091 desde el worktree `e-petplace-s116-e`.
> El pie de Cuenta dice **`metro · dev`** y el marcador `L-160` del log dice `[update] id=ninguno (embedded/dev) · embedded=false`.
> **Medido:** entre `5d83a413` (ancla del último OTA) y este SHA hay **cero** archivos de `apps/` o `packages/` ⇒ **este es el código publicado**.
>
> **118 capturas.** Las que dicen `OSCURO-` son la misma pantalla con el sistema en tema oscuro.
> ⚠️ Toda captura se tomó **sólo navegando**: no se tocó ningún botón salvo el login inicial.
>
> ---
>
> 🔴 **LAS 118 CAPTURAS NO ESTÁN EN `main` — ESTE ÍNDICE SÍ. DÓNDE VIVEN, con su comando:**
> **rama `pista/s116-e-00` · SHA `24d7e692`.** Pesan **29,9 MB**, medido del objeto:
> `git ls-tree -r -l 24d7e692 -- docs/loop/capturas-s116-antes/ | grep '\.png$' | awk '{n++; s+=$4} END {print n, s/1048576}'`
> → `118 · 29.9`. Por eso se quedan en la rama: el índice es lo que se lee, las capturas se van a buscar.
>
> **Para ver una:** `git show 24d7e692:docs/loop/capturas-s116-antes/hogar.png > /tmp/hogar.png`
> **Para traerlas todas a un directorio fuera del repo:**
> `git archive 24d7e692 docs/loop/capturas-s116-antes | tar -x -C /tmp/`
>
> ⚠️ **`pista/s116-e-00` se conserva A PROPÓSITO y NO es trabajo sin mergear.** Sus dos `.md`
> viven en `main` desde el lote 0 de A, byte-idénticos (verificado por `git hash-object` contra
> `git rev-parse 24d7e692:<ruta>`); lo único que quedó atrás son las PNG, por peso.
> *Se declara acá porque el censo de `L-217` (`git branch -a --no-merged main`) la va a marcar
> como rama sin mergear, y sin esta línea alguien la va a leer como trabajo perdido y la va a
> mergear entera — con sus 29,9 MB.*

| archivo | ruta | con qué datos | peso |
|---|---|---|--:|
| `OSCURO-adoptar.png` | `/adoptar` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 776 kB |
| `OSCURO-avisos.png` | `/avisos` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 318 kB |
| `OSCURO-carnet.png` | `/carnet` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 163 kB |
| `OSCURO-cuenta-facturas.png` | `/cuenta/facturas` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 210 kB |
| `OSCURO-cuenta.png` | `/cuenta` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 212 kB |
| `OSCURO-despensa.png` | `/despensa` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 369 kB |
| `OSCURO-explorar.png` | `/explorar` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 232 kB |
| `OSCURO-hogar-mascota-SOMBRA-memorial.png` | `/hogar/mascota/93553b79-8b8b-4f66-821c-124244f1a2b9` | **tema OSCURO del sistema** · **Sombra · perro FALLECIDA** · `93553b79…` · produce el estado memorial | 350 kB |
| `OSCURO-hogar-mascota-THOR.png` | `/hogar/mascota/d2e31d70-54fc-4d47-b425-1617239257eb` | **tema OSCURO del sistema** · Thor · perro vivo · `d2e31d70…` | 877 kB |
| `OSCURO-hogar.png` | `/hogar` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 901 kB |
| `OSCURO-nexo.png` | `/nexo` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 182 kB |
| `OSCURO-pedidos.png` | `/pedidos` | **tema OSCURO del sistema** · familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 291 kB |
| `adiestramiento-cita.png` | `/adiestramiento/2f81a127-6b64-4ec3-9a1f-a16647d8c7f0` | cita de adiestramiento confirmada · `2f81a127…` | 82 kB |
| `adoptar-acta.png` | `/adoptar/acta/8b747efd-5f23-454a-990d-0d28ad9b59cd` | misma solicitud · `8b747efd…` | 104 kB |
| `adoptar-postular.png` | `/adoptar/postular/89ee9249-c5f4-459a-84f4-3e2f1d9d8fb3` | misma publicación · `89ee9249…` | 222 kB |
| `adoptar-publicacion.png` | `/adoptar/89ee9249-c5f4-459a-84f4-3e2f1d9d8fb3` | publicación `publicada` · `89ee9249…` | 757 kB |
| `adoptar-refugio.png` | `/adoptar/refugio/e9fb7acd-fd24-4992-a7fa-ab140025ddc6` | cuenta comercial «Clínica Los Shyris» · `e9fb7acd…` (⚠️ no es un refugio) | 115 kB |
| `adoptar-refugios.png` | `/adoptar/refugios` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 90 kB |
| `adoptar-solicitud.png` | `/adoptar/solicitud/8b747efd-5f23-454a-990d-0d28ad9b59cd` | solicitud `no_concretada_fallecimiento` · `8b747efd…` | 116 kB |
| `adoptar-solicitudes.png` | `/adoptar/solicitudes` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 255 kB |
| `adoptar.png` | `/adoptar` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 775 kB |
| `antiparasitario.png` | `/antiparasitario` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 227 kB |
| `auth-callback.png` | `/auth/callback` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 932 kB |
| `autorizacion-solicitud.png` | `/autorizacion/8b747efd-5f23-454a-990d-0d28ad9b59cd` | id de solicitud de adopción (⚠️ no es del dominio de autorizaciones) | 54 kB |
| `avisos.png` | `/avisos` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 319 kB |
| `baja.png` | `/baja` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 79 kB |
| `bienvenida.png` | `/bienvenida` | **sin sesión** — tomada antes de entrar | 201 kB |
| `buscar.png` | `/buscar` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 118 kB |
| `carnet.png` | `/carnet` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 164 kB |
| `citas-THOR.png` | `/citas/d2e31d70-54fc-4d47-b425-1617239257eb` | Thor · `d2e31d70…` | 206 kB |
| `cuenta-ayuda.png` | `/cuenta/ayuda` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 233 kB |
| `cuenta-cerrar.png` | `/cuenta/cerrar` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 405 kB |
| `cuenta-datos-facturacion.png` | `/cuenta/datos-facturacion` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 234 kB |
| `cuenta-direccion.png` | `/cuenta/direccion` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 197 kB |
| `cuenta-documentos.png` | `/cuenta/documentos` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 285 kB |
| `cuenta-exportar.png` | `/cuenta/exportar` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 170 kB |
| `cuenta-facturas.png` | `/cuenta/facturas` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 225 kB |
| `cuenta-familia.png` | `/cuenta/familia` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 178 kB |
| `cuenta-medios.png` | `/cuenta/medios` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 163 kB |
| `cuenta-pagos.png` | `/cuenta/pagos` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 341 kB |
| `cuenta-perfil.png` | `/cuenta/perfil` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 189 kB |
| `cuenta-preferencias.png` | `/cuenta/preferencias` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 335 kB |
| `cuenta-recurrentes.png` | `/cuenta/recurrentes` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 378 kB |
| `cuenta-seguridad.png` | `/cuenta/seguridad` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 209 kB |
| `cuenta.png` | `/cuenta` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 209 kB |
| `despensa-carrito.png` | `/despensa/carrito` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 109 kB |
| `despensa-checkout.png` | `/despensa/checkout` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 108 kB |
| `despensa-producto.png` | `/despensa/producto/6dc6fd3c-aeab-4682-9809-d490bd8cb426` | producto «KILN KAT» · `6dc6fd3c…` | 399 kB |
| `despensa-reclamo.png` | `/despensa/reclamo` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 482 kB |
| `despensa.png` | `/despensa` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 375 kB |
| `explorar-adiestramiento-checkout.png` | `/explorar/adiestramiento/checkout` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 199 kB |
| `explorar-adiestramiento-confirmar-programa.png` | `/explorar/adiestramiento/confirmar-programa` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 289 kB |
| `explorar-adiestramiento-disponibles.png` | `/explorar/adiestramiento/disponibles` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 151 kB |
| `explorar-adiestramiento.png` | `/explorar/adiestramiento` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 199 kB |
| `explorar-grooming-checkout.png` | `/explorar/grooming/checkout` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 195 kB |
| `explorar-grooming-disponibles.png` | `/explorar/grooming/disponibles` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 155 kB |
| `explorar-grooming.png` | `/explorar/grooming` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 226 kB |
| `explorar-guarderia-checkout.png` | `/explorar/guarderia/checkout` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 149 kB |
| `explorar-guarderia-disponibles.png` | `/explorar/guarderia/disponibles` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 134 kB |
| `explorar-guarderia-prestador.png` | `/explorar/guarderia/8026077e-f96f-4127-9597-8f4b2646a1b2` | mismo prestador · `8026077e…` | 437 kB |
| `explorar-guarderia.png` | `/explorar/guarderia` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 151 kB |
| `explorar-paseo-checkout-paquete.png` | `/explorar/paseo/checkout-paquete` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 238 kB |
| `explorar-paseo-checkout-plan.png` | `/explorar/paseo/checkout-plan` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 268 kB |
| `explorar-paseo-checkout.png` | `/explorar/paseo/checkout` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 208 kB |
| `explorar-paseo-disponibles.png` | `/explorar/paseo/disponibles` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 175 kB |
| `explorar-paseo-paquete.png` | `/explorar/paseo/paquete` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 118 kB |
| `explorar-paseo.png` | `/explorar/paseo` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 276 kB |
| `explorar-veterinaria-checkout.png` | `/explorar/veterinaria/checkout` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 188 kB |
| `explorar-veterinaria-disponibles.png` | `/explorar/veterinaria/disponibles` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 141 kB |
| `explorar-veterinaria.png` | `/explorar/veterinaria` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 176 kB |
| `explorar.png` | `/explorar` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 237 kB |
| `gallery.png` | `/gallery` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 140 kB |
| `guarderia-documentos.png` | `/guarderia/documentos` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 140 kB |
| `guarderia-estadia.png` | `/guarderia/5fd245ec-f554-4840-9dcc-3e1ed78f338d` | estadía en `retorno_en_curso` · `5fd245ec…` | 185 kB |
| `hogar-adiestramiento.png` | `/hogar/adiestramiento` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 1363 kB |
| `hogar-agregar-paso1.png` | `/hogar/agregar/1` | paso `1` del alta | 418 kB |
| `hogar-agregar.png` | `/hogar/agregar` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 129 kB |
| `hogar-bitacora.png` | `/hogar/bitacora` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 141 kB |
| `hogar-foto-mascota.png` | `/hogar/foto-mascota` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 111 kB |
| `hogar-grooming.png` | `/hogar/grooming` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 287 kB |
| `hogar-guarderia.png` | `/hogar/guarderia` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 333 kB |
| `hogar-mascota-SOMBRA-memorial.png` | `/hogar/mascota/93553b79-8b8b-4f66-821c-124244f1a2b9` | **Sombra · perro FALLECIDA** · `93553b79…` · produce el estado memorial | 351 kB |
| `hogar-mascota-THOR.png` | `/hogar/mascota/d2e31d70-54fc-4d47-b425-1617239257eb` | Thor · perro vivo · `d2e31d70…` | 877 kB |
| `hogar-mascota-despedida.png` | `/hogar/mascota/despedida` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 132 kB |
| `hogar-mascota-documentos.png` | `/hogar/mascota/documentos` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 141 kB |
| `hogar-mascota-pasaporte.png` | `/hogar/mascota/pasaporte` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 86 kB |
| `hogar-paseos.png` | `/hogar/paseos` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 325 kB |
| `hogar-vacunas-THOR.png` | `/hogar/vacunas/d2e31d70-54fc-4d47-b425-1617239257eb` | Thor · `d2e31d70…` | 247 kB |
| `hogar-veterinaria.png` | `/hogar/veterinaria` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 226 kB |
| `hogar.png` | `/hogar` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 17 kB |
| `invitacion.png` | `/invitacion` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 70 kB |
| `lamina-fusion.png` | `/lamina-fusion` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 501 kB |
| `legales-codigo.png` | `/legales/autorizacion_transporte` | código `autorizacion_transporte` | 117 kB |
| `login.png` | `/login` | **sin sesión** — tomada antes de entrar | 155 kB |
| `nexo.png` | `/nexo` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 199 kB |
| `onboarding-paso1.png` | `/onboarding/1` | paso `1` del onboarding | 377 kB |
| `onboarding.png` | `/onboarding` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 105 kB |
| `pagos-alta-tarjeta.png` | `/pagos/alta-tarjeta` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 125 kB |
| `pagos-deuna-ensayo.png` | `/pagos/deuna-ensayo` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 174 kB |
| `pagos-mensualidad.png` | `/pagos/mensualidad` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 69 kB |
| `parte-evento.png` | `/parte/de300000-0000-4000-8000-00000000e001` | evento `cita_servicio` · `de300000…e001` | 83 kB |
| `paseo-atencion.png` | `/paseo/90b9a249-6f19-40ae-854b-4dd0bd1cc0a8` | atención cerrada con calidad · `90b9a249…` | 144 kB |
| `pedidos-en-camino.png` | `/pedidos/en-camino/0fbf9732-d230-4238-b401-4dfca7950cf7` | mismo pedido · `0fbf9732…` | 143 kB |
| `pedidos-pedido.png` | `/pedidos/pedido/0fbf9732-d230-4238-b401-4dfca7950cf7` | pedido en `pago_capturado` · `0fbf9732…` | 271 kB |
| `pedidos.png` | `/pedidos` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 296 kB |
| `placa-activada.png` | `/placa/WkZ89jFdMtk9cWQT6fmPDw` | placa CON mascota · `WkZ89jFd…` | 52 kB |
| `placa-sin-activar.png` | `/placa/j6ljvzzx0ExQRa2hO20N7A` | placa SIN mascota · `j6ljvzzx…` | 98 kB |
| `postventa-caso.png` | `/postventa/caso/82ff1424-75f9-495f-b303-394f9394bb55` | caso `con_casa` · `82ff1424…` | 152 kB |
| `postventa-mis-casos.png` | `/postventa/mis-casos` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 283 kB |
| `postventa-motivo.png` | `/postventa/motivo` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 75 kB |
| `prestador-ficha.png` | `/prestador/8026077e-f96f-4127-9597-8f4b2646a1b2` | prestador activo · `8026077e…` | 343 kB |
| `raiz.png` | `/` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 932 kB |
| `recuerdo.png` | `/recuerdo` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 105 kB |
| `recuperar.png` | `/recuperar` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 118 kB |
| `registro.png` | `/registro` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 153 kB |
| `verificar-correo.png` | `/verificar-correo` | familia de prueba `guillo381+8` (Thor · Zeus · 21 más) | 153 kB |
| `videoconsulta-cita.png` | `/videoconsulta/2f81a127-6b64-4ec3-9a1f-a16647d8c7f0` | misma cita · `2f81a127…` | 185 kB |
| `videollamada-cita.png` | `/videollamada/2f81a127-6b64-4ec3-9a1f-a16647d8c7f0` | misma cita · `2f81a127…` | 186 kB |
