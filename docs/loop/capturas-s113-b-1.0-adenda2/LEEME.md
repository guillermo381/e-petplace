# Capturas · S113-B lote 1.0 adenda 2 (emulador Android, Pixel 10 Pro XL)

**01** · la barra en los dos temas a la vez, arriba claro y abajo oscuro.
**El disco asoma por encima del cuerpo** en los dos, con el valle recortado a
su alrededor. Es el control de Android del cambio ①: el corrimiento pasó de
`translateY` suelta a `transform`, y **la plataforma que ya funcionaba sigue
funcionando** — que es lo único que un cambio de forma tiene que probar.

El control de web no es una captura: es `pnpm verify:barra-web`, que **lee la
BAJADA real del `<path>` en el DOM** y no la presencia del atributo.
