# S88-D · ESTADO DE CIERRE — la pista del cliente

> **Territorio:** `apps/cliente` + el canal OTA del cliente (letra D, nacida
> S87 — el reparto que el brief S87 §6 pedía resolver al abrir).
> **Rama:** `pista/s87-d` · worktree `../e-petplace-s87-D`.
> **Al cierre: TODOS mis commits mergeados en `origin/main`** (verificado por
> `merge-base --is-ancestor`, no por dicho) — el último de construcción es
> **`ddb0a25`** (la campana del cliente). Árbol limpio.

---

## 1 · LO CONSTRUIDO (commit por commit, cada hash con su asunto — regla 79)

| commit | qué |
|---|---|
| `9f7fe20` | `passwordAyuda` con `{{n}}` desde `MIN_LARGO_CONTRASENA` — el cliente dejó de prometer 6 (mergeado como `f30ec50`) |
| `81a5cd8` | **El guard local del registro** (Ley 23): clave corta ya no se ofrece al server; dos capas del apagado (`razonDeshabilitado` por causa + `onRazon`); par 5/5 con contra-caso de la regla vieja |
| `6ef7c0b` | **Cruce declarado en territorio A** (firmado por A): el lector del catálogo de notificaciones + los exports omitidos de `guardarPreferenciaCanal` |
| `2dd542b` | **LOTE 4 — Preferencias sobre la lámina firmada**: grilla 7×4 que LEE el catálogo · espejo de `preferencia_efectiva` (par 15/15 con no-divergencia contra el motor VIVO) · tres no apagables sin toggle + porqués firmados · WhatsApp con evidencia · promesa «Cuando las notificaciones lleguen…» JUBILADA (Ley 37) |
| `bbb779d` | **🔴 La cura del crash** (gate founder VERDE): `permiso-push` v2 — el JS de `expo-notifications` NO se evalúa si el APK no trae el nativo; sonda con `requireOptionalNativeModule` (D-579/L-187, L-190) |
| `66a26d6` | **Canales en voz de persona** (enmienda de lámina firmada): «En el teléfono» · «Por correo» · «En la app» · WhatsApp como marca |
| `7ae1c05` | Extensión del cruce: `tiposVivos` (superada por la adjudicación de A: ganó la versión de C — filtraba `activo=true`; la mía contaba inactivos. Corrección justa, con dato) |
| `53e1322` | **Los ejemplos por fila FIRMADOS** (propuestos contra catálogo vivo) + «Resúmenes» DERIVADA: cero tipos vivos = la fila no se dibuja, del catálogo y jamás de lista a mano |
| `7f8ceac` | El filtro del cliente pasa a `tieneTiposVivosParaMi` — declarar audiencia y filtrar por el booleano ciego dejaba el parámetro decorativo (defecto LATENTE: hoy 0 filas de diferencia, medido) |
| `ddb0a25` | **LA CAMPANA DEL CLIENTE** (las dos láminas firmadas): `/avisos` con voz-como-dato, no-leído por presencia, destino del CLIENTE (`lib/destino-aviso.ts`, par 13/13), sin-destino no tocable, vacío honesto literal · `FilaCampanaTecho` extraída (R32 verde), gap 20dp congelado, hueco del Coach que NO se mueve, `Badge huella/muro`, booleano jamás lista |

**Censos depositados en actas de la sesión** (sin archivo propio, viajaron por
mesa): preferencias vs `MODELO_NOTIFICACIONES` §6 (los 2 defectos dormidos +
costo de la columna de canales) · paridad del cliente post-curas (tabla de 9,
con las filas 1-2 que ordenaron el publish urgente) · anatomía de la campana
(la esquina ocupada por el Coach, el glifo inexistente, D-546) · §7 del brief
S87 medido NEGATIVO (el Hogar no cuenta el día dos veces; la exclusión de lo
vivo es incidental — observación con disparo declarado).

## 2 · LO QUE DEJÉ SIN HACER (explícito)

- **El PAR DEL DISCRIMINADOR del crash** — *confirmación pendiente, NO
  requisito* (adjudicación de mesa; la cura tiene gate founder en aparato
  real). El APK-sin-nativo nunca se produjo: ver §3.
- **La rama «autorización» del mapeo de destinos** — `AvisoDeCampana` no porta
  `solicitudId`; mapear por otro campo sería adivinar. Cuando el lector lo
  porte, la rama y su par se agregan (declarado en `lib/destino-aviso.ts`).
- **El ejemplo de «Resúmenes»** — sin key a propósito: se escribe cuando la
  categoría tenga su primer tipo vivo y la fila aparezca sola.
- **Gates founder en dispositivo pendientes**: la campana del cliente (mínimo
  legible de la huella · bordes con nombre largo y en inglés · los 4 estados
  con el fixture D-671 de `+8`) · los bordes de ancho de la grilla de
  Preferencias (L-143) · los ejemplos en pantalla real.
- **Voces candidatas al censo de voz (L-156)**: `notifEj*` · el consentimiento
  de WhatsApp (borrador a la firma, lámina §4) · el marco de `avisos.*`.
- **Recuperar contraseña del cliente** — sigue sin existir (censado, no
  ordenado): construcción nueva con lámina si el founder la dispara.

## 3 · NOTAS OPERATIVAS

**El build discriminador murió por `OutOfMemoryError: Metaspace`.** Gradle
release frío de RN + dos emuladores + Metro en la misma máquina: el daemon
agotó metaspace, sus hilos RMI murieron en loop y quedó zombi (~2 h sin un
byte nuevo en `intermediates/`). **La receta si alguien quiere el par:**
`org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g` en `gradle.properties`,
máquina sin emuladores/Metro al lado, y el estado fiel al campo se fabrica con
`expo.autolinking.exclude: ["expo-notifications"]` en el `package.json` del
cliente + el plugin fuera de `app.json` (TEMPORAL — restaurar antes de
commitear) → `expo prebuild` + `assembleRelease` (~30 min calientes). El par:
la pantalla de Preferencias MONTA en un APK sin el nativo.

- **La restauración quedó completa y verificada**: `app.json` con su plugin
  `expo-notifications` (grep=1), `package.json` sin `autolinking` (grep=0),
  árbol limpio.
- **Regla 87 ejercida al cierre**: emulador propio (`crashD`, :5556) apagado;
  el AVD queda en el SDK (fuera del repo) por si el par se corre algún día.
  `emulator-5554` es de C — **residuo declarado que NO toqué: Expo Go 57.0.3
  instalado por mí antes de fijar `ANDROID_SERIAL`** (el incidente fundante de
  la regla); su retiro es de C.
- **El worktree no hereda el link de Supabase** (`supabase/.temp/` sin
  trackear) — ya elevado a A como tercera pieza de la regla 85, junto a
  `node_modules` y `.env.local`.
- `eas update:view` **sin `--json` no imprime `gitCommitHash`** — ya elevado a
  A como candidata de letra del deber ③.
- Verificaciones vivas archivadas en `/tmp` de esta máquina (se pierden con
  el reinicio; lo que prueba algo está citado en los commits): `repro.log` /
  `repro2.log` / `ravisos.log` (montajes web producción con sesión demo) ·
  `pref-web.png` / `avisos-web.png`.
