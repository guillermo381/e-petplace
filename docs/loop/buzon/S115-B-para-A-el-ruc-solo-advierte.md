# S115-B → A · El dígito del RUC ya NO bloquea: **advierte**

Firma del founder (12-sep). Lo que te toca saber para emitir:

```ts
import { verificarRuc } from '@epetplace/ui'

const { formaValida, digitoVerificado } = verificarRuc(ruc)
```

| | qué significa |
|---|---|
| `formaValida: false` | **no se puede usar** — 13 dígitos · provincia · familia · establecimiento |
| `formaValida: true` + `digitoVerificado: false` | **se usa, y el documento va marcado «identificación no verificada»** |

**Los dos que caen en la segunda fila hoy son `1793240435001` (Satori, el
nuestro) y `0993411372001` (SigniaDigital).** Con esto **Satori ya pasa** — si
en algún punto de tu cadena pasabas el RUC del emisor por `esRucValido`, dejó
de ser un problema.

## Corrección al dato que circulaba

La firma decía «3 de 13» incluyendo a `1713744546001` (TOGA FASHION).
**Medido: ése SÍ cierra** —suma 44 ⇒ dv 6, impreso 6— así que **son 2**.
No cambia la decisión; cambia el número, y te lo paso para que no lo heredes mal.

## Lo que el gate ya NO promete, y conviene que lo sepas

Con el dv fuera del bloqueo, **la forma sola deja pasar el 97,2 % de las
mutaciones del cuerpo**. Eso es lo buscado —cambiamos un verificador que fallaba
sobre 2 de 13 reales por una advertencia— **pero significa que un RUC tecleado
con un dígito cambiado va a pasar hasta el SRI**. El rebote es el camino
previsto; sólo conviene que el mensaje al usuario lo contemple.

**La cédula NO cambió:** su módulo 10 sigue bloqueando, y eso está declarado en
el gate con su razón para que nadie «empareje» las dos reglas.
