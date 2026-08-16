# LA TRANSICIÓN DIRECCIONAL — la pieza, y la trampa del sustrato

**Estatuto:** Toque 1 · **construida**. Destraba a D, que la esperaba con
su causa servida.

**La letra NO cambia** — sigue siendo la receta anterior: *mismo número,
signo invertido; la dirección se deriva del GESTO, no de la pila.* Lo
único que cambió es **sobre qué se monta**, y eso obligó a una decisión
que la receta no podía anticipar.

---

## §1 · LO QUE YA ESTABA, Y LO QUE FALTABA

`cruce.ts` estaba **completo del lado que escribe**: `PuertaHermana`
llama a `registrarCruce(direccion)` en su `onPress`, antes de entregar el
control. Lo que no existía era **quien lo consume**.

⇒ nace **`EntradaDeCruce`**, exportada y en galería (R17
`exportaciones=92 · pendientes=0`).

```tsx
import { useIsFocused } from '@react-navigation/native'
import { EntradaDeCruce } from '@epetplace/ui'

<EntradaDeCruce activo={useIsFocused()}>
  …el contenido de la ventana…
</EntradaDeCruce>
```

**Una línea en cada ventana hermana, y nada más.** No recibe la
dirección: la lee. *Si la recibiera, volveríamos a que cada pantalla
tenga que saber algo que depende del sustrato — que es la pérdida que ya
se pagó dos veces.*

---

## §2 · 🔴 LA TRAMPA DEL SUSTRATO, Y POR QUÉ LA PIEZA PIDE `activo`

**El reflejo era animar AL MONTAR. No sirve, y la razón es la misma que
ya costó dos pérdidas:** D curó el encierro de `/pedidos` moviéndola
adentro del navegador de tabs, y **un navegador de tabs CONSERVA sus
pantallas montadas**.

> ⇒ **la segunda vez que alguien cruza no hay montaje, y una animación de
> montaje no dispararía nunca más.** Andaría la primera vez —lo
> suficiente para dar por buena la tanda— y moriría en silencio. *Es la
> misma clase de defecto que la ley del cruce vino a matar: apoyarse en
> un detalle del mecanismo de navegación.*

**La salida: un montaje es un detalle del mecanismo; VOLVERSE VISIBLE es
un hecho de la pantalla.** La pieza anima en el flanco `false → true` de
`activo`.

### ⚠️ Y `activo` NO viola la ley del gesto — se parece, y no lo es

La ley prohíbe que **la ventana que llega deduzca LA DIRECCIÓN**: eso
depende del sustrato, y por eso lo escribe la puerta, que es lo único que
el dedo toca.

*«¿Soy yo la que se está viendo?»* **no es una deducción sobre el
sustrato**: es un hecho que solo el app puede contestar, se contesta con
una línea, y **se contesta igual con tabs, con stack o con lo que venga
después**. La pieza sigue sin saber de qué lado viene; solo sabe cuándo
le toca preguntar.

---

## §3 · LOS NÚMEROS, Y LO QUE SE DESCARTÓ

| | valor | de dónde sale |
|---|---|---|
| duración | **300** | `motion.duration.estandar` — techo de Ley 6. *Cruzar no es una ceremonia* |
| viaje | **32** | `spacing[8]`, escalón de la casa |
| curva | `easeOut` | la misma de `Entrada` |

**El 32 tiene su porqué en la proporción:** `Entrada` viaja **15** para un
BLOQUE; la pantalla viaja el doble. *Esa proporción es la jerarquía dicha
en píxeles — la pantalla se mueve más que sus partes.*

⏪ **Se descartó el barrido de ancho completo**, que era el reflejo: una
pantalla entrando desde el borde **deja a la vista el fondo que vacía**,
y acá no hay una ventana saliente que lo tape porque el navegador ya la
cambió. *Un barrido a medias se lee como un salto; un desplazamiento
corto con su fundido se lee como dirección.*

**Memorial y reduce-motion** comparten brazo con la doctrina que `Entrada`
ya firmó: **se le quita el VIAJE, no el tiempo** — queda el fundido, se
va el desplazamiento. (R41 verde: 10 piezas mueven, 10 declaran el hook.)

---

## §4 · LO QUE ESTA PIEZA DECLARA QUE **NO** HACE

1. **No anima la mitad que SE VA.** El navegador la reemplaza y su
   desmontaje no es nuestro. *Se declara en vez de fingir simetría: lo
   que se perdió fue saber DE QUÉ LADO viene lo nuevo, y eso lo dice
   entera la mitad que entra.*
2. **No anima si no hubo cruce.** `tomarCruce()` devuelve `null` en un
   deep link, en el back del sistema o en un cambio de tab a dedo — y
   entonces no se mueve nada. *Inventarle una dirección sería contarle al
   ojo algo que no pasó.*
3. **No es `Entrada` con otro eje**, y no por prolijidad: `Entrada`
   envuelve CADA bloque, así que meterle la dirección haría que **N
   bloques se desplacen de costado en escalón** — N movimientos donde el
   gesto fue UNO. *La pantalla cruzó entera; sus partes no cruzaron cada
   una por su lado.*

## §5 · LO QUE NO PUEDO FIRMAR YO

**El ojo**, con dos preguntas concretas:

> *Cruzando ida y vuelta: ¿se siente que la ventana viene del lado del
> botón que tocaste?* — y la que importa más — *¿32 alcanza para leerlo
> como dirección, o se siente un temblor?* **Si se siente corto, la
> palanca es UN número (`DESDE_X`), y sube por escalones de `spacing`.**
