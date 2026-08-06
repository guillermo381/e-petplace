# LÁMINA — EL PEDIDO DE PERMISO DE NOTIFICACIONES (cliente)

> **✅ FIRMADA POR EL FOUNDER — 6 de agosto de 2026, tal como se
> propuso (S89-D orden 6).** Depositada por S89-D (orden 5 ③) ANTES
> de toda pantalla — la ley de la casa. **En la COLA DE CONSTRUCCIÓN
> DEL TREN NATIVO:** la pantalla se construye CON el tren de push
> (token/transporte de A — §7), jamás antes; su gate propio en
> dispositivo cuando se construya. Las voces de §3 quedan FIRMADAS
> con la lámina.
>
> **La letra firmada del founder que esta lámina desarrolla:** *se
> invita al primer arranque tras instalar o actualizar · siempre con
> consentimiento · un «ahora no» se respeta sin insistir.*
>
> **Y las dos leyes que la gobiernan:** «push» jamás de cara al
> cliente (LEY S89 — vocabulario del motor, patrón Ley 3) · cero dark
> patterns (la casa ya lo prohíbe por escrito).

---

## 0 · Qué resuelve

El sistema operativo pregunta por el permiso de notificaciones **UNA
sola vez en la vida de la instalación**. Si esa única pregunta llega
fría — sin contexto, en el peor momento — un «no» del sistema es casi
irreversible desde la app (solo queda mandar a los ajustes del
teléfono). **La invitación propia protege ese único tiro.**

## 1 · EL PATRÓN — pantalla de la casa ANTES del diálogo del sistema

```
   [invitación de la casa]  ──「Sí, avisarme」──▶  [diálogo del SO]  ──▶ concedido
          │                                            │
      「Ahora no」                                  denegado (SO)
          │                                            │
   se respeta — el diálogo               Preferencias lo dice con su voz
   del SO NUNCA se abrió:                firmada (notifPermisoNegado) y
   el único tiro sigue intacto           el camino son los ajustes del SO
```

El diálogo del sistema **solo se abre después de un sí explícito** en
la pantalla propia. Un «ahora no» deja el tiro del SO sin gastar —
ése es el valor del patrón, y por eso la invitación existe.

## 2 · CUÁNDO APARECE (propuesta)

**Primer arranque tras instalar o actualizar** (la letra firmada) —
con estas precedencias y guardas:

1. **Después de sesión y con el Hogar montado.** Jamás sobre el
   onboarding, jamás tapando el primer momento con la mascota. Un
   solo intento por arranque.
2. **Guardas que la APAGAN (la invitación no se dibuja):**
   - La **sonda nativa** dice que el módulo no está (D-579/L-187 —
     el patrón de `permiso-push` v2, gate founder verde S88: el JS
     de `expo-notifications` NO se evalúa sin el nativo). *Hasta la
     build 1.0.3, la invitación simplemente NO EXISTE — nunca
     aparece rota.*
   - El permiso del SO **ya está concedido** (nada que pedir).
   - El permiso está **denegado a nivel SO** (el tiro ya se gastó):
     invitar sería mandar a un muro — el camino honesto vive en
     Preferencias con la voz firmada.
   - Hay un **«ahora no» vigente** (§5) o una **decisión explícita
     en Preferencias** (§5 — terminal: solo la persona la cambia).

## 3 · QUÉ DICE (voces CANDIDATAS — se firman con esta lámina; tuteo, sin jerga)

- **Título:** «Avisos en tu teléfono» / "Updates on your phone"
- **Cuerpo:** «Cuando pase algo importante — una cita confirmada, una
  vacuna por vencer — te avisamos en el teléfono, aunque la app esté
  cerrada. Lo cambias cuando quieras desde Preferencias.» / "When
  something important happens — a confirmed appointment, a vaccine
  coming due — we let you know on your phone, even when the app is
  closed. You can change this anytime in Preferences."
- **Botones:** «Sí, avisarme» / "Yes, let me know" · «Ahora no» /
  "Not now"

*Los ejemplos del cuerpo son deliberados: los dos tipos que el
founder ya conoce (la cita confirmada que pidió sin que nadie se la
ofreciera — D-673 — y la vacuna por vencer). El cuerpo promete lo que
el catálogo tiene, no más.*

**Anti-dark-patterns, exigible en el gate:** «Ahora no» SIEMPRE
visible, con la anatomía del secundario de la casa (nunca escondido,
nunca una ✕ chiquita, nunca pre-marcado nada); el sí no grita; la
invitación no bloquea nada — detrás de ella la app está entera.

## 4 · QUÉ PASA AL ACEPTAR

1. «Sí, avisarme» → se abre el diálogo del SO (el único tiro).
2. **El SO concede** → el canal «En el teléfono» queda disponible en
   Preferencias, rigiendo por categoría como ya está firmado en
   `LAMINA_PREFERENCIAS_NOTIFICACIONES`. *(El registro del token y su
   viaje al motor son pieza de A — el tren de push. Esta lámina no
   los dibuja; los nombra para que nadie los dé por hechos.)*
3. **El SO deniega** → la casa NO insiste: Preferencias muestra el
   estado con `notifPermisoNegado` (voz ya firmada, sin jerga) y el
   camino son los ajustes del sistema.

## 5 · QUÉ PASA AL «AHORA NO» — se respeta sin insistir

- La invitación **no vuelve a aparecer**: marca local persistida por
  usuario (`ahora_no` + versión nativa en la que ocurrió).
- **El camino VIVO queda en Preferencias**: encender «En el teléfono»
  dispara esta misma secuencia (pantalla propia → SO) — la puerta la
  abre la persona cuando quiere.
- Una decisión tomada EN Preferencias (encender o apagar el canal) es
  **terminal para la invitación**: la casa nunca re-invita a quien ya
  decidió con la puerta grande.

## 6 · RE-INVITACIÓN EN UPDATES — la regla SIN nagging (propuesta)

- Re-invitar **SOLO** cuando cambia la **versión NATIVA instalada**
  (build nueva — jamás por OTA: un OTA puede llegar cada día y eso
  sería nagging con otro nombre), **Y** el permiso sigue sin
  conceder, **Y** no hubo decisión explícita en Preferencias.
- **Techo: UNA re-invitación por versión nativa.**
- **Dos «ahora no» acumulados = silencio definitivo**: la casa no
  vuelve a invitar nunca; queda solo el camino manual de
  Preferencias. *(Dos noes son una respuesta, no un obstáculo.)*
- Cero badges, cero contadores, cero recordatorios entre arranques.

## 7 · LO QUE ESTA LÁMINA **NO** ES

- **No es construcción**: pantalla, marca local y secuencia se
  construyen tras la firma, con su gate en dispositivo.
- **No es el tren de push**: token, registro, transporte y el paso ④
  de la ley de secuencia son del motor (A). Sin ese tren, esta
  pantalla es una promesa — por eso su construcción se secuencia con
  él, no antes.
- **No toca el mapa de destinos** (ya servido, S89-D orden 3) ni la
  campana.

**Origen: S89-D orden 5 ③ · letra firmada del founder citada arriba ·
6-ago-2026.**
