# PEDIDO AL FOUNDER · ALTA DE LIVEKIT CLOUD

> **De:** pista D · S106 · 25-ago-2026
> **Disparo:** CP1 firmado por la mesa — **LiveKit Cloud, condicionado a
> prueba de cable.**
> **Autocontenido:** todo lo que hace falta está acá. No hay que abrir otro
> documento.
>
> 🔴 **Las keys NO vuelven al chat, NI a un reporte, NI al repo.** Las cargás
> vos desde tu terminal con el comando de §3. *Precedente medido: `D-712` —
> los artefactos de una auditoría son un vector nuevo; un secreto pegado en
> un reporte queda en el repo para siempre.*

---

## §1 · QUÉ HAY QUE CREAR

1. Entrar a **https://livekit.io** (redirige a `livekit.com`) y crear cuenta.
2. Elegir el plan **Build** — **$0/mes, sin tarjeta**. *(Medido de
   `livekit.com/pricing` el 25-ago-2026.)*
3. Crear un **proyecto**. Sugerencia de nombre: `epetplace-stg`.
   *Uno por ambiente, igual que hicimos con pagos.*
4. En el proyecto → **Settings → Keys** → generar un **API Key**.

**Salen tres valores:**

| valor | dónde se ve | forma |
|---|---|---|
| `LIVEKIT_URL` | portada del proyecto | `wss://<algo>.livekit.cloud` |
| `LIVEKIT_API_KEY` | Settings → Keys | texto corto, tipo `API...` |
| `LIVEKIT_API_SECRET` | Settings → Keys — **se muestra UNA sola vez** | texto largo |

⚠️ **El secret se muestra una sola vez.** Si se cierra la ventana sin
copiarlo, se genera otra key y listo — no es un problema grave, pero evita
la segunda vuelta.

---

## §2 · LA CELDA QUE QUEDÓ SIN MEDIR — y sólo se ve desde adentro

En mi tabla del turno ⓪ hay una fila que **no pude cerrar desde afuera**, y
la mesa pidió que se complete **del objeto**. Ya que vas a estar adentro de
la cuenta:

> **En el panel, entrá a la sección de plan / billing y anotá dos números
> del plan pago (`Ship`):**
> 1. **cuántos «WebRTC minutes» vienen incluidos**, y
> 2. **cuánto cuesta el minuto excedente.**

**Lo que la página pública decía el 25-ago-2026**, para que se pueda
contrastar y no para que se dé por bueno:

| plan | base | WebRTC min incluidos | excedente |
|---|---|---|---|
| Build | $0 | 5.000 | — |
| **Ship** | **$50/mes** | **150.000** | **$0,0005/min** |
| Scale | $500/mes | 1.500.000 | $0,0004/min |

🔴 **Por qué importa y no es un detalle contable:** el free tier de LiveKit
es **el más chico del set** — 5.000 min ≈ **125 teleconsultas/mes**
(20 min × 2 participantes). Daily, Agora y 100ms dan **10.000** (≈250).
**Si el soft launch pasa de ~125 consultas al mes, LiveKit empieza a costar
$50 fijos** mientras los otros seguirían en cero. *Es exactamente el número
que la mesa necesita para saber cuándo deja de ser gratis.*

**Si el panel muestra números distintos a esa tabla, ganan los del panel** —
y hay que avisarlo, porque la recomendación se fundó en los públicos.

---

## §3 · CÓMO CARGÁS LAS KEYS — desde TU terminal

Pegá esto en tu terminal reemplazando los tres valores. **Un solo comando.**

```bash
npx supabase secrets set \
  LIVEKIT_URL='wss://TU-PROYECTO.livekit.cloud' \
  LIVEKIT_API_KEY='TU_API_KEY' \
  LIVEKIT_API_SECRET='TU_API_SECRET' \
  --project-ref zyltipqscdsdsxnjclhp
```

*(`zyltipqscdsdsxnjclhp` es el proyecto Supabase de siempre.)*

**Alternativa sin terminal:** panel de Supabase → **Edge Functions → Secrets**
→ agregar los tres a mano.

### Cómo verificar que quedaron — sin que se vea el valor

```bash
npx supabase secrets list --project-ref zyltipqscdsdsxnjclhp | grep LIVEKIT
```

Eso imprime **los nombres y un hash**, nunca el valor. Tienen que aparecer
los tres. *Si aparecen menos de tres, algo se cortó — mejor saberlo ahora que
cuando la edge devuelva `servidor_sin_configurar`.*

---

## §4 · QUÉ PASA DESPUÉS, PARA QUE SEPAS QUÉ ESPERAR

| | quién | qué |
|---|---|---|
| ahora | **vos** | crear cuenta + cargar los tres secretos |
| después | **C** | la prueba de cable, con la spec que ya le dejé |
| después | **A** | la RPC del veredicto, con el pedido que ya le dejé |
| después | **D** | la edge `video-token` — **ya escrita**, esperando ambas |

🔴 **La prueba de cable es la que manda.** El CP1 está firmado
**condicionado**: si dos teléfonos no se ven y se oyen en la red real de
Quito, **la escalera de caída la decide la mesa** — no la pista.

---

## §5 · LO QUE ESTE PEDIDO **NO** TE PIDE

- ❌ **Ninguna tarjeta de crédito.** El plan Build no la pide.
- ❌ **No pongas los valores en el chat**, ni me los mandes, ni los guardes en
  un archivo del repo.
- ❌ **No hace falta configurar webhooks todavía.** LiveKit sí los publica
  (los medí: `participant_joined`, `participant_left`, `room_finished`,
  `participant_connection_aborted`, entre otros) y **hay uno que le sirve a
  la letra** — pero eso es decisión de mesa y va en mi reporte, no acá.
- ❌ **No toques nada de pagos.** Este alta es de video y sólo de video.
