# S114 — CIERRE · LA POSTVENTA ENTERA, EL PAGO MIXTO, Y EL CANAL DE WHATSAPP CON RECEIPT REAL

> **Se lee ANTES que el bloque del canon en `CLAUDE.md`, que es su resumen.** Este
> acta existe para alguien que **no vivió el arco**: cuenta qué se construyó, qué
> deuda vieja salió de paso, y qué NO se hizo con su razón.
>
> **Pistas:** A (conducción + DB + `packages/api` + docs + merges/OTA) · B (`packages/ui`)
> · C (`apps/cliente` + `apps/prestador`) · D (puerta de IA de postventa: `postventa-intake`/`postventa-hoja` + `_shared/postventa/` + sus tres gates — NO escribió migraciones) · E (aparato,
> medición, camino real) · F (portal de operaciones — el admin).
>
> **`main` al cierre: `814a06c1`** — *«el receipt real de WhatsApp (wamid + webhook de
> estado)»*. **Sin OTA:** el tren final fue DB + edges + config + tipos + una reversa;
> cero archivos de app. La veda de producción móvil sigue entera.

---

## 🔴 LO QUE VA ARRIBA — LA LECCIÓN DE LA SESIÓN

**Casi todos los defectos graves de S114 los encontró CAMINAR, no leer.** Ninguno
rompía nada: los typechecks daban verde, `verify:diseno` daba verde, los gates de
edge daban verde, y **cada uno funcionaba mal en silencio** — devolvía un número
plausible, pintaba una pantalla creíble, o no pintaba nada donde nadie iba a
verificar por qué.

**Un gate verde puede significar menos de lo que dice su nombre, y esta sesión lo
probó de ONCE formas distintas.** No es una intuición: es un censo. Las once no las
vio ningún instrumento porque **todos los instrumentos detectan lo que FALLA, y
esto FUNCIONABA MAL** — que es la clase de defecto sin síntoma. La única forma de
encontrarlos fue usar la pantalla real con un dedo real:

1. **El «contanos» del Coach roto desde S113 — para TODAS las mascotas.** El motor
   respondía; la pantalla nunca llamaba. Un frente entero mudo, verde en todo gate.
2. **Nueve especies de once ausentes en el mostrador.** El selector ofrecía dos; el
   catálogo tenía once. Nada fallaba: ofrecía de menos.
3. **El productor de avisos de postventa, borrado en agosto** — la cola nacía vacía
   y su silencio se leía como salud.
4. **Las once protecciones de memorial, apagadas.** El motor apaga el ciclo en M6 por
   diseño (LOYALTY §7.1); once lectores lo habían dejado de honrar sin un error.
5. **El historial de citas, invisible para toda mascota sin citas activas.** El
   `.gte('fecha', hoy)` escondía el pasado; la mascota se veía sin historia.
6. **El hilo del prestador, dado vuelta** — paginaba hacia adelante mientras la lista
   leía hacia atrás; dormido hasta el primer hilo de 50 mensajes (C, ③).
7. **El `redirectTo` que mandaba al login de Vercel** en vez de al de la casa.
8. **El admin que no compilaba** — F lo encontró y lo reconstruyó.
9. **El cobro mixto que REBOTABA** con un CHECK: `confirmar_pago_compra` filtraba el
   intento por `('iniciado','aprobado')` pero el edge lo escribe `pendiente`.
10. **El pago mixto que se COLGABA** — el triple fiscal no reconciliaba: nuestro
    `taxable_amount` no bajaba con el saldo, y Nuvei rechaza `amount ≠ taxable+vat`.
11. **El reloj que soltaba una reserva de saldo con un cobro VIVO** (D-1052) — el
    barrido liberaba por tiempo, ciego a que había un intento en curso sobre esa plata.

**La forma de la lección:** el instrumento que MIDE la voz tenía el mismo ciego que
busca (C ①: `lib-voz.mjs` mide una lista enumerada de 132 verbos, no la clase; `marcá`
pasaba invisible) · el instrumento que vigila la voz de producto **no mira las
migraciones**, donde el motor escribe cadenas que la familia lee (C ②) · y **un verde
sobre un binario ajeno es peor que declarar el hueco** (C ⑤ / C8: el dev client del
prestador corría el APK 1.0.3, no el árbol — `L-138` en su forma exacta). *La medición
puede ser verdadera y la conclusión falsa si el instrumento no puede producir su rojo.*

---

## LO CONSTRUIDO

### La postventa entera — de la letra al motor a las tres superficies
- **El motor del caso** (`casos_postventa` + máquina de etapas: `abierto → con_prestador
  → con_casa → resuelto`, con `resuelto_entre_partes` para el arreglo directo). Puertas
  tipadas: `caso_abrir`, `_caso_mover`, `caso_resolver`. El actor se resuelve por rol
  (`is_admin` ⇒ casa · `es_mi_prestador` ⇒ prestador), y **el guard de etapa se verifica
  ANTES de tocar la plata** (hallazgo de F: la casa calculaba todo el reembolso y recién
  fallaba con un código que no decía «primero tomá el caso»).
- **Los tres asientos:** la familia abre y ve su hilo; el prestador resuelve entre partes
  o escala; la casa toma y resuelve. Bandeja con título del objeto (cita → voz de
  catálogo; pedido → folio).
- **El saldo e-PetPlace** (`LETRA_SALDO.md`): pasivo del ledger, DEL HOGAR (§7),
  acreditado sólo por el motor, consumido FIFO. **Un lector, cero escritores** desde la
  app (`obtenerMiSaldo` deriva de la suma de movimientos — no puede divergir de ellos,
  la lección del ledger de S95).
- **F1 — el cierre ausente:** el reloj (`expirar_objetos_sin_cierre`) cierra con calidad
  los servicios que el prestador dejó sin cerrar, **sólo dentro del corte firmado**
  (`app_config.f1_corte_cierre_ausente`); el backlog viejo es ruido y el reloj lo saltea.
  **El lector del prestador aprendió el mismo corte** (⑥): devolvía 62 servicios, sólo 6
  accionables; la pantalla decía «no se cobran y la familia recibió su devolución» — ninguna
  familia recibió nada. Ahora devuelve sólo lo que el reloj puede tocar, con el fuera-de-corte
  aparte para diagnóstico.
- **Las tres opciones del prestador ante un caso:** resolver entre partes · escalar a la
  casa · resolver con devolución (total/parcial/sin devolución).

### El ledger con sus cuatro productores
- **El devengo cubre los cuatro sujetos que faltaban:** vet-telemedicina, guardería,
  despensa, y la mensualidad que **devenga por día** (no al cobrar). Backfill de los
  devengos históricos. El **tablero de eventos** los lee para operaciones.

### El pago mixto — cada parte de su fuente, y vuelve a su fuente
- **`aplicar_saldo_a_compra`** (parcial + riel): el saldo cubre lo que alcanza, el riel
  cobra la diferencia; la atomicidad no se relaja (todo o nada sobre los N pedidos).
- **El triple fiscal** (`pagos-cobro`): para IVA 0, `taxable_amount = monto`; para gravada,
  **no se inventa el reparto** — si el saldo toca una compra gravada sin soporte, rebota
  `mixto_gravado_no_soportado` (D-1051); y una reconciliación final rebota
  `triple_fiscal_no_reconcilia` si `amount ≠ taxable + vat`.
- **El reembolso PER-SOURCE** (`caso_resolver`): la parte que salió del saldo vuelve al
  saldo (a prorrata `saldo_aplicado/total`); la del riel la cubre `aplicar_reembolso`
  (reversa el ledger; el reintegro a la tarjeta es declarado, §7.16). El parcial se
  reparte con el mismo factor. El ledger (comisión/payout) reversa proporcional al monto,
  **independiente de cómo se pagó**.

### La puerta de IA de postventa (D)
- **El modelo redacta, nunca decide.** `postventa-intake` (clasifica el reclamo de la
  familia) y `postventa-hoja` (arma la hoja del caso) sobre `_shared/postventa/`, con sus
  tres gates. **Ninguna salida de IA escribe estado, monto ni transición** — una regla
  determinística decide que algo exista; el modelo sólo pone palabras. D no escribió una
  sola migración en S114 (medido: `git diff --name-only e516a089..270191bc` → 0 en
  `supabase/migrations/`).

### El portal de operaciones (F)
- **El admin reconstruido** — no compilaba; F lo levantó, curó el `redirectTo` que mandaba
  al login de Vercel, y dejó los lectores del legado hablando.

### El canal de WhatsApp — encendido y VALIDADO con receipt real
- **Multicanal: una intención, N entregas** (`notificacion_entrega`, única por
  `intencion_id + canal`). **La preferencia MANDA, no el orden** (firma del founder): se
  entrega por TODOS los canales marcados, no por el primero que gana una carrera. **El
  techo cuenta la INTENCIÓN, no las entregas** — N intenciones lo dispararían N× más
  rápido; ésa fue la trampa que decidió la forma.
- **El estado `entregada` se renombró a `aceptada_transporte`** (firma del founder): el
  nombre prometía más de lo medido — significaba «FCM/Meta aceptó», no «el aparato
  recibió» (L-530).
- **El receipt real de WhatsApp:** `despachar-whatsapp` guarda el `wamid`
  (`messages[0].id`); el webhook `whatsapp-estado` (X-Hub-Signature-256, HMAC-SHA256)
  recibe los recibos de Meta y avanza el estado monotónicamente: `delivered →
  entregada_aparato · read → leida · failed → fallida`. **Es la única mitad de D-1055 que
  se puede cerrar:** WhatsApp da recibo, FCM push no.
- **Validado en vivo:** el founder recibió los dos WhatsApps de prueba (voz de catálogo +
  monto, marcados como siembra); Meta respondió 2xx con wamid. **Era demora, no corte**
  (L-530); el mensaje llegó sin logo y mostrando el número — eso es el perfil del negocio
  en la consola de Meta, no del motor. El push #4 llegó tras encontrar el permiso
  BLOQUEADO en Android (dos causas juntas — fantasma + permiso — mismo síntoma FCM 200/nada).

---

## LA DEUDA VIEJA QUE SALIÓ DE PASO — curada en la misma sesión

Las ocho de la lección corona (§arriba) que eran deuda VIEJA, no defectos de S114, y se
curaron al caminarlas: el «contanos» roto desde S113 · nueve especies de once en el
mostrador · el productor de avisos borrado en agosto · las once protecciones de memorial
apagadas · el historial de citas invisible sin activas · el hilo del prestador dado
vuelta · el `redirectTo` al login de Vercel · el admin que no compilaba.

*Ninguna la encontró un gate. Todas funcionaban mal en silencio.*

---

## LO NO HECHO — con su razón

- **Placas del legado (NFC).** `D-1046`: la rama `*-nfc` da de alta un módulo nativo; no
  se mergea antes de la build (no viaja por OTA). Espera el próximo tren nativo.
- **El vacío honesto de «Mis casos».** La pantalla existe; su estado vacío digno queda
  pendiente de gate — sin casos reales todavía, no hay qué mostrar y no se inventa.
- **C8 — el cierre ausente caminado en el prestador.** No se pudo: el dev client corría el
  bundle embebido del APK 1.0.3, no el árbol (`L-138`). *Ver la línea ahí no probaría nada,
  y no verla tampoco.* Se declara el hueco en vez de firmar un verde sobre un binario ajeno.
- **El check del saldo en modo mixto contra el CHECK, caminado.** El rebote y la cura están
  medidos por sonda-ROLLBACK; el E2E con JWT real del founder cerró el caso colgado, pero el
  camino mixto completo desde la app no se re-caminó punta a punta.
- **La devolución REAL caminada.** El reembolso per-source está construido y su prorrata
  verificada por cinturón; falta un caso de postventa real resuelto con devolución sobre una
  compra mixta, con el founder mirando el saldo volver.

---

## LAS FICHAS ABIERTAS — en un solo lugar

- **`D-1051`** 🟡 — `mixto_gravado_no_soportado`: si el saldo toca una compra gravada sin
  soporte, rebota. Disparo: la primera compra gravada pagada con saldo.
- **`D-1053`** 🟡 — el techo de 24h de la reserva de saldo, acoplado al escalado (D-1054):
  una reserva no puede colgar eternamente si el barrido no alcanza.
- **`D-1054`** 🟡 — el escalado del intento vencido tiene que llegar al founder, no a un
  log; pide un destinatario `casa` que el CHECK de audiencia (cliente/prestador/ambas) no
  tiene.
- **`D-1055`** 🟡 — no se distingue un token de push VIVO de uno FANTASMA. **CERRADA para
  WhatsApp** (wamid + webhook); **ABIERTA para push** (FCM v1 no da receipt al emisor).
- **`D-1057`** 🟡 — el permiso de notificaciones se pide en silencio; falta el indicador
  visible. Cablearlo es de C (construido, pendiente de tren).
- **`D-1058`** ⚪ — el canal de notificación de Android sin ejercer (usa el default). Sin
  causa medida; queda con su disparo.

**Pre-lanzamiento, del founder (no son de código):**
- El **perfil del negocio en WhatsApp** — logo y nombre en la consola de Meta (el mensaje
  llega sin logo y mostrando el número hasta que se cargue).
- Los **dos secrets** — `META_APP_SECRET` (firma del webhook) y `META_WEBHOOK_VERIFY_TOKEN`.
- La **config del webhook de estado** en la consola de Meta (callback URL → `whatsapp-estado`,
  suscripción a `messages`/`message_status`).

---

## OPERATIVO

- **`main` = `45029367`** (tren final `814a06c1` + el cierre documental + el P0 del reloj, ver CODA). El tren de contenido: `candidato/s114-2 @ bfd20774` mergeado con verde
  completo sin `SALTAR_GATE`, censo doble.
- **60 migraciones `_s114a_`** · **782 migraciones locales** (local = remoto al cierre).
- **Edges desplegadas:** `pagos-cobro` (triple fiscal) · `despachar-push` ·
  `despachar-whatsapp` (guarda wamid) · `despachar-correo` (las tres leen de
  `notificacion_entrega`) · **`whatsapp-estado`** (webhook nuevo, `--no-verify-jwt`).
- **`transporte_vivo = true`** (flip firmado por el founder — el canal está encendido).
- **Sin OTA:** delta = 1 migración + 2 edges + `config.toml` + tipos + 1 reversa; cero apps.
- **Gates verdes al mergear:** `@epetplace/api` · `packages/ui` · `apps/cliente` ·
  `apps/prestador` · `verify:diseno` · `verify:edge-deno`.

## CODA — EL CIERRE MISMO CAMINÓ Y ENCONTRÓ UNA DOCE

Fiel a la lección corona, **la propia rueda de cierre encontró un defecto vivo**: E midió
que el cron `expirar-objetos-sin-cierre` fallaba **cada hora desde las 05:00 del 10-sep**
— `no_ejecutado` estaba en el CHECK de `evento_cita_servicio` (curado) pero **no en el de
`guarderia_estadias`**, su tabla hermana. La rama de estadías escribía un valor que su
propio CHECK prohíbe ⇒ la excepción **abortaba la función entera, incluidos los avisos de
citas**. Sin síntoma: vivía en `cron.job_run_details`, que nadie lee, mientras la pantalla
del prestador se veía normal. **Y lo encontró el primer rojo real de un gate que nació
mudo** (`verify:cierre-ausente`), destrabado por el paso del tiempo. Curado
(`20260912160000`, cinturón sonda-ROLLBACK VERDE): tras la cura el reloj corre `ok:true`,
marca las 4 estadías dentro de corte y **salen 8 avisos que el abort venía suprimiendo**.
Medido antes de curar: el reloj toca sólo esas dos tablas con `no_ejecutado`, no hay
tercera. `main` **`45029367`**.

*La lección se cumplió sobre sí misma: doce, no once.*

## ESTADO DEL CANON

- **Lecciones S114 depositadas, una c/u:** `L-528` (dibujar no es exigir — una pantalla más
  estricta que su motor también es un defecto, corrección de F) · `L-529` (`git merge` en la
  rama equivocada da un dos-puntos limpio con resultado sucio; se mide `<destino>..<merge>`
  antes de empujar — mi error del merge de F, declarado) · `L-530` (un 2xx con wamid del
  transporte es «lo tomó», jamás «llegó»; la demora puede ser larga).
- **Fichas S114 depositadas, una c/u:** `D-1050`…`D-1058`.
- **Higiene de otras ramas (S113, no S114):** se deduplicó `L-517` (dos copias idénticas) y
  se **consolidó `D-1047`** (dos fichas distintas con el mismo número — la misma deuda filada
  por D y E en paralelo, ambas con `pnpm proximo:ficha`; la colisión que `D-1003` cura pero
  que se pidió simultáneo en dos ramas). **Cero colisiones de número en todo el canon** tras
  el cierre. **Dos correcciones medidas de peers, aplicadas:** el territorio de D en S114 fue
  la **puerta de IA de postventa** (no `packages/mensajeria`, y sin migraciones — `git diff`
  0); y `D-1050` se **re-verificó contra `main`** ante un reporte de F: un voseo real sembrado
  en `apps/admin/.../Casos.tsx` **hace fallar `verify:diseno` con exit 1** (R66 lo caza, APPS
  VISTAS incluye admin), y la cura de B (`127922e7`) es ancestro del tren — la ficha queda
  RESUELTA, el VERDE que F midió no es reproducible en `main` actual.
