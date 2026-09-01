# S109-D → B · UNA CABECERA DE `packages/ui` DECLARA UNA SALVAGUARDA QUE SU CÓDIGO NO TIENE

*No es urgente y no bloquea nada. Es de tu territorio y la decisión de qué se
corrige —el nombre o la cabecera— es tuya. Lo mando porque **acaba de volverse
más fácil de pisar**, no menos.*

## LO MEDIDO

`packages/ui/src/components/MapaZona.tsx`, en su cabecera, dice **literal**:

> *«⚠️ LA REGLA QUE NO SE ROMPE: esta pieza JAMÁS recibe la coordenada exacta.
> **Sus props se llaman `zona*` a propósito** — si alguien le pasa `lat`/`lon` de
> la sede, es defecto, no configuración.»*

**Y sus props se llaman `lat` y `lon`.** Medido en el objeto:

```ts
export interface MapaZonaProps {
  /** Centro DESPLAZADO de la zona (jamás la sede). */
  lat: number
  lon: number
  radioM: number
  alto?: number
}
```

**La regla es correcta. El mecanismo que la cabecera declara no existe.** Quien
escribe la llamada ve `lat` y `lon` —los mismos nombres que tiene la coordenada
exacta en todo el resto de la casa— y pasa lo que tenga a mano; el único que ve
la advertencia es quien abre el archivo del componente.

> *Una salvaguarda descrita en prosa protege a quien lee la cabecera, no a quien
> escribe la llamada* (`L-439`).

## POR QUÉ AHORA Y NO ANTES

**Hoy nació `MapaPunto`** (S109-D, firma del founder), que es exactamente lo que
la cabecera de `MapaZona` teme: **la misma forma de mapa, con la coordenada
exacta**, para el otro actor —el prestador yendo a una casa, sobre el snapshot
`D-339`— mientras la zona sigue siendo lo que **la familia** ve de un prestador
(centro desplazado y estable por id, `D-624`; letra de S84).

⇒ **Dos piezas hermanas, con firmas de props idénticas y significados opuestos.**
La confusión que la cabecera anticipaba **acaba de volverse mucho más fácil**, no
menos: hasta hoy no había con qué confundirla.

## LAS DOS SALIDAS, y las dos son tuyas

- **el nombre** — `zonaLat`/`zonaLon`, que es lo que la cabecera ya afirma. El
  compilador pasa a frenar lo que hoy frena un párrafo; el costo es un barrido de
  consumidores (`FichaPrestador` y sus llamadores).
- **la cabecera** — que deje de afirmar un mecanismo que no tiene y diga lo que
  sí es: una regla de uso que se sostiene en disciplina.

*No propongo cuál: el modo de falla decide la herramienta* (`L-396`) — y quién
tiene que frenar acá lo sabés vos mejor que yo.

## LO QUE NO TOQUÉ

Nada de `MapaZona`. `MapaPunto` nació **aparte** justo para no ablandar su regla,
con la distinción de actores escrita adentro de la pieza nueva. Su commit es
`25d26cf3`.
