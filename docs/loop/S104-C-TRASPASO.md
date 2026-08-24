# S104-C — TRASPASO

Dos repos, los dos al día. **Monorepo:** `pista/s104-c` **mergeada por A a `main`** — todo mi trabajo es ancestro de `origin/main`. **Sitio `epetplace-web`:** en `main`, Vercel despliega solo. **Nada sin commitear.**

Mapa de dónde retomar, no fuente de datos vivos: las cifras (migraciones, reglas, versiones libres) se re-miden del objeto; acá solo SHA y hechos estructurales.

## 1. QUÉ QUEDÓ EN MAIN (SHA · pieza)

**Sitio (`epetplace-web` main):**
- `4d17af0` — Política de Privacidad de las apps PUBLICADA con versionado inmutable: `/legales/privacidad-app` (viva) + `/legales/privacidad-app/1-1` (archivo, la URL de evidencia).
- `f694f55` — T&C Pet Professional PUBLICADO **top-level**: `/terminos-profesional` (viva, `index.astro` dentro del dir) + `/terminos-profesional/1-0` (archivo inmutable) + `/en`. Enlazado desde `/legales`.

**Monorepo (main):**
- (previo, ya en main) el arco de entrada: ritual, invitar familia + `/invitacion`, código `/verificar-correo`, biométrico puerta-de-entrada + umbral 5 min, «Pegar» en `CampoCodigo`, «Entrar con Google» (cliente + PKCE de A), D-899 aviso de dictado, §31.6 consentimiento de dictado, borrado del marcador `terminos-inline-v1`.
- `aa3bc717`·`acb5f95c` — TANDA 3, la salida en las DOS apps: `/cuenta/cerrar` (doble paso, P15 cl.4 alineado a §19.3/§19.4/§19.5) + `/cuenta/exportar` (cl.5). Prestador: dos caminos (cerrar cuenta = motor de A · cerrar negocio = trámite asistido, no desde la app) + aviso único-con-acceso. ☠️ mueren las Hojas de «voz honesta».
- `f573415a` — el `—` de la verificación de documentos del prestador recibe su voz §5.2 (imagen destruida al concluir; los TRES estados de A, restringido a `aprobado` porque el trigger anula la imagen también al rechazar).
- `51f94136` — nace `Casilla` (checkbox, `packages/ui`, cruce autorizado por A): §4.3/§38.10 exigen «casilla», un switch no cumple. **NO reemplaza a `Interruptor`** (JSDoc). Gate del founder en `/gallery` pendiente.
- `39d46bef` — aceptación EXPLÍCITA del prestador: `AceptacionTerminos` (dos checks obligatorios con enlace + arbitraje opcional) en `registro` e `invitacion`; el «no» del arbitraje se registra con fecha.

**De A (motor, para contexto):** el cierre de cuenta (soft-delete 30 días + seudonimización), `solicitarCierreCuenta`/`exportarMisDatos`, `documentoUltimos4`, el contexto `registro_profesional` OBLIGATORIO, `URL_LEGAL.terminos_professional`, y **el vigilante de URLs de evidencia (`534c8962`)**.

## 2. QUÉ QUEDA ABIERTO (bloqueo · dueño)

- **Gate del founder de `Casilla`** (en `/gallery`) + **gates en dispositivo** de TANDA 3, las pantallas de aceptación y la de verificación — **dueño: founder** (parte del OTA grande, nada más de código).
- **§17.A consentimiento del proveedor de IA — 🔴 `D-902`, FIRMADO: NO se construye ahora.** Va JUNTO con el alta manual del carnet (sin vía manual el consentimiento no sería libre, LOPDP). Ficha ABIERTA con disparo: antes de que haya usuarios reales que puedan reclamarla, O el día que se construya el gate de IA. **Dueño: founder/abogado**; registro canónico en `DEUDAS_CANONICAS` (A).
- **El «avise» PROACTIVO del vigilante** — hoy REGISTRA las caídas en `v_urls_legales_caidas` (visible, no silencioso), pero no hay push (correo/notificación): el canal de la casa está en sombra. **Dueño: A** (el canal) / **founder** (decide si la vista alcanza o quiere el empujón).
- **La evaluación de transferencias internacionales** — no existe como documento. **Dueño: abogado.**
- **Publicar el T&C ≠ abrir el alta de prestadores** — el alta sigue frenada por `D-897`. **Dueño: founder/abogado.**

## 3. LAS FIRMAS QUE RIGEN

- **Biométrico = PUERTA DE ENTRADA:** la huella desbloquea una sesión que YA existe; arranque en frío pide siempre; volver del 2º plano pide solo tras 5 min; salida «Entrar con otra cuenta» = cerrar sesión.
- **Versión y URL del consentimiento viven JUNTOS en `packages/api`** (`URL_LEGAL` al lado de `VERSION_LEGAL`); la pantalla NO aporta la URL — la resuelve `documentosVigentes` (L-166). Guarda el ARCHIVO inmutable, jamás la viva.
- **El cierre es SEUDONIMIZACIÓN, no borrado** (Política §19.5): la pantalla dice «qué se va / qué queda», jamás «borrar todo». Pierde acceso HOY, anonimización al día 30 (§19.2); el mensaje completo va en la pantalla de CONFIRMAR — la única sin segunda oportunidad.
- **El documento se deriva de la PUERTA, no de la persona:** `registro`→parent (cliente), `registro_profesional`→professional (prestador auto-alta), `acceso_prestador`→professional (invitación). El contexto es OBLIGATORIO.
- **`Casilla` ≠ `Interruptor`:** una aceptación se conserva como prueba (§4.3); un ajuste se desanda. Unificarlas rompe §4.3.
- **Aceptación del prestador:** dos checks obligatorios (T&C profesional + privacidad, cada uno con enlace al archivo inmutable) + arbitraje OPCIONAL (§38.10) con el «no» fechado; documentos disponibles ANTES de aceptar (§4.2); la Transitoria alcanzable desde el enlace del T&C (§4.5).
- **Google:** client ID nunca en la app; PKCE; solo en el cliente (1ª excepción de la ley de paridad).
- **Dictado por voz:** consentimiento previo, específico y separado la 1ª vez, revocable desde config.

## 4. DÓNDE MEDIR

- **Legales publicados:** HTTP contra `www.epetplace.com` **con control negativo** (una versión inventada tiene que dar 404 — un 200 sin un 404 al lado prueba que el server contesta, no que el deploy salió). ⚠️ El prefijo `/legales/` NO es sospechoso por sí mismo (`/legales/privacidad-app` vive ahí y da 200); si una ruta VIVA de legal da 404, es anomalía de Vercel específica de esa ruta — se cura moviendo a top-level con la viva como `index.astro` DENTRO del dir (sin el conflicto page/directorio).
- **URL de evidencia del consentimiento:** `URL_LEGAL` en `packages/api/src/wrappers/auth.ts`. Los `null` son la verdad hasta que su página dé 200 (no un olvido).
- **Consentimientos registrados:** tabla `consentimientos` (una fila por documento; `metadata->>'url'` = la URL de evidencia, `metadata->>'contexto'` = la puerta). Estado de un acto: `consultarConsentimiento(acto)`.
- **El vigilante de URLs:** `verificar_urls_legales()` (dispara vía `pg_net`) + `recolectar_urls_legales()` (juzga en el tick siguiente, porque `pg_net` responde DESPUÉS del commit) + vista `v_urls_legales_caidas`. **Probar el camino real:** insertar una fila de `consentimientos` con una URL rota, correr las dos funciones con ~15 s de separación, leer el log `url_legal_chequeo` de esa corrida, y LIMPIAR (fila de consentimiento + filas de log del test) verificando residuo 0 en las tres (consent · log · vista).
- **Router types (R63·C):** `apps/<app>/.expo/types/router.d.ts` (gitignored, per-worktree; se regenera con `expo start`). Reportar R63 verde SIEMPRE con «en mi worktree».
- **Migraciones:** `ls supabase/migrations/*.sql` vs `npx supabase migration list --linked`.

## 5. LO QUE APRENDÍ (con su caso)

- **El reporte lleva el LITERAL, no «calza el contrato».** A cambió el nombre de un campo (`enviado_a` ↔ `enviada_a`) entre dos mensajes; lo cacé porque escribí los call sites explícitos. Un rojo TAPADO por otro (el error de campo tapado por el `TS2305` del import ausente) se destapa recién en el merge y se le atribuye al último que tocó, no al que lo causó.
- **Un contrato entre pistas se cierra UNA vez; si cambia, se anuncia COMO cambio** — no se reescribe entero confiando en que el otro note la diferencia (misma raíz que el punto anterior).
- **El documento se deriva de la PUERTA, no de la persona.** El prestador auto-registrado quedaba con el T&C del cliente porque `registrarse` no distinguía; hacer el contexto OBLIGATORIO hizo que el compilador marcara los cuatro callers — un opcional con default habría fallado hacia el lado malo en silencio.
- **La anomalía de ruta de Vercel no era el prefijo.** `/legales/privacidad-app` (idéntico) daba 200; el 404 del T&C sobrevivió a un rebuild limpio (origen, no caché). Curó moverlo a top-level con la viva como `index.astro` dentro del dir. Lección: medir con control negativo distingue «el server contesta» de «el deploy salió».
- **El control negativo prueba el INSTRUMENTO, no solo el dato.** En el vigilante, sin él un servidor con catch-all (todo 200) pasaría en falso; y probó el fail-closed solo (dijo `no_concluyente`, jamás «todas vivas», cuando no pudo medir). *Un instrumento que no puede medir y lo declara sirve; el que en ese caso dice verde hace daño.*
- **La pieza más confiable es la que no agrega piezas.** El vigilante salió sin edge function ni secreto nuevo (`pg_net` + `pg_cron` ya viven en la casa) — cero superficie desplegada nueva.
- **Un cambio de URL en `URL_LEGAL` es gratis SÓLO si ninguna fila de `consentimientos` la tiene guardada.** El del T&C salió gratis por timing (cero filas). El día que una URL ya sea evidencia, moverla es dejar evidencia apuntando a un 404 — se decide, no se reescribe. Por eso el vigilante mide las URLs REALES de la base, no una lista a mano.
