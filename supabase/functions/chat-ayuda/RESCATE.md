# `chat-ayuda` — FUENTE RESCATADA, NO MANTENIDA (S92-BIS · D-717)

> **⚠️ EL `index.ts` DE AL LADO ES UNA COPIA FIEL DE LO QUE ESTÁ DESPLEGADO, y
> por eso NO tiene el guard de sesión que las otras cuatro functions
> facturables recibieron hoy.** Se bajó con `supabase functions download` y **no
> se tocó ni una línea**: modificarlo habría arruinado el único valor que tiene,
> que es ser el registro de lo que de verdad corre.

## Por qué existe este archivo

`chat-ayuda` estaba **desplegada y sin fuente en el repo** — se descubrió al
censar el perímetro. Una function sin fuente **no se puede auditar, ni curar, ni
revertir: solo se puede apagar a ciegas**. Y esta sesión ya documentó siete
actas perdidas por no rescatar a tiempo (L-217), así que el rescate va primero y
la decisión después.

## ⛔ NO LA DESPLIEGUES SIN LEER ESTO

**Un `supabase functions deploy` sin nombrar functions despliega TODAS.** Si eso
pasa hoy, `chat-ayuda` se re-despliega **sin guard de sesión** — y es la única de
las cinco facturables que respondía **200 con la anon key del bundle**, o sea
haciendo correr Claude Haiku a cuenta de la casa.

**Deployá siempre nombrando la function.**

## Lo medido (9-ago-2026)

| pregunta | respuesta |
|---|---|
| **¿gasta plata?** | **SÍ** — `api.anthropic.com`, modelo `claude-haiku-4-5-20251001`, con `ANTHROPIC_API_KEY` |
| **¿la llama alguien?** | **SÍ, uno**: `e-petplace-v2/src/components/HelpButton.tsx:71` — el botón de ayuda de la web legacy |
| **¿cuántas invocaciones tuvo?** | **NO MEDIBLE desde el CLI** — no existe `supabase functions logs` en esta versión; vive en el dashboard |
| **¿de qué habla?** | de **la app v2**: carrito, checkout, guest checkout, «índice de salud» con puntajes. **Describe un producto que ya no es éste** |

## El detalle que decide

Su `KNOWLEDGE` embebido le explica al usuario cómo funciona **un producto que
cambió**: habla de carrito y de un índice de salud con puntaje numérico, y ese
puntaje **contradice `MODELO_LOYALTY` §3**, que prohíbe mostrar score. *No es
solo una function sin uso: es una function que, si alguien la usa, contesta con
el producto equivocado.*

## 🪦 ESTADO: BORRADA DEL PROYECTO — 9-ago-2026, por decisión del founder

**Ya no está desplegada.** Se borró por dos razones, y la primera es la urgente:
**era la única function facturable que un desconocido podía hacer correr con la
llave que viaja en el bundle** (gasto contra la cuenta de la casa), y la segunda
es que **contesta con el producto de hace dos versiones**, en una voz que el
canon vigente prohíbe.

**El botón de ayuda de `e-petplace-v2` queda roto A PROPÓSITO** — costo medido,
aceptado y firmado por el founder.

**Este archivo y el `index.ts` de al lado SE CONSERVAN**: son lo que hace que la
decisión sea reversible.

### Cómo revivirla (si alguna vez hiciera falta)

```bash
# desde la raíz del monorepo, con el proyecto linkeado (zyltipqscdsdsxnjclhp)
npx supabase functions deploy chat-ayuda --use-api
```

`--use-api` despliega **sin Docker** (es como se desplegaron las seis functions
de esta sesión). **Nombrar `chat-ayuda` no es opcional**: sin el nombre se
despliegan TODAS, que es la trampa de la sección de arriba.

Antes de revivirla hay que verificar dos cosas, o vuelve el agujero entero:

1. **El secreto `ANTHROPIC_API_KEY` tiene que existir** en el proyecto
   (`npx supabase secrets list`) — sin él la function despliega y falla en
   caliente.
2. **Ponerle el guard de sesión primero**: `exigirSesion` de
   `supabase/functions/_shared/sesion.ts`, igual que sus cuatro hermanas
   (D-714). *Revivirla tal cual es re-abrir la puerta que se cerró.*

> **⚠️ Y lo que dice el canon: NO SE REVIVE ÉSTA.** Si algún día se quiere un
> asistente de ayuda, **se construye nuevo contra el producto vigente y con
> guard de sesión desde el primer commit** — ficha **D-722**. Este archivo existe
> para poder auditar lo que corrió, no para volver a encenderlo.
