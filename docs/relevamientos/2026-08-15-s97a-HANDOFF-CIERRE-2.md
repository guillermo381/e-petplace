# S97-A · HANDOFF DE CIERRE ② (15-ago-2026)

**Para la sucesora de A: esto se lee ANTES que cualquier backlog.**
Todo en `origin/main`, árbol en 0, **318 migraciones = disco = local = remoto**.
El HANDOFF anterior (`2026-08-14-s97a-HANDOFF-CIERRE.md`) sigue vigente en lo
que no contradiga a éste.

---

## 1 · 🔴 LO PRIMERO: LA COLA DE C ESTÁ BLOQUEADA EN VOS

**C no puede avanzar con el alta del repartidor hasta que exista el motor.**
Su contrato completo: `docs/relevamientos/2026-08-14-s98c-pedido-a-A-corte-y-repartidor.md`

### ① Las columnas que faltan en `repartidores`

| columna | por qué |
|---|---|
| `tipo_documento` | vocabulario **ya cerrado** en `cat_tipos_documento_titular`: `CEDULA · PASAPORTE · RUC` |
| `documento_foto_path` | **PATH, no URL** (convención de la casa) |
| `foto_path` | ídem |
| `whatsapp` | precedente: `prestadores.whatsapp` es columna propia |

⚠️ **`whatsapp` cae dentro de D-823** — mirá el CHECK antes de elegir su
convención, o nacés con el noveno caso del problema.

### ② `repartidor_vehiculos` — ADJUDICADA: TABLA NUEVA

> **`repartidor_id · tipo · placa`**, vocabulario cerrado `moto|carro`,
> **techo de 2 EN LA FUENTE**. **`recursos_reparto` NO SE TOCA.**

**El argumento de C, verificado y adoptado:** `recursos_reparto` significa
**CAPACIDAD DEL NEGOCIO** y **está cableada** — `cupo_reparto_del_dia` la lee.
La spec pide *identidad de vehículo* (tipo + placa). *Montar identidad encima
de capacidad le cambia el significado a la tabla que da el cupo, y eso rompe
en silencio: el cupo del día empezaría a contar vehículos en vez de recursos.*

---

## 2 · ✅ D-822 CERRADA — la push llega a `e-PetPlace Negocios`

**Probado en el aparato:** `pkg=com.epetplace.prestador` ·
**«Documento aprobado»** · *«Aprobamos tu [DEMO S68] Título profesional…»*

**Los cinco productores vivos** (`20260815130000`), cuatro colgados del ACTO
en su transacción + el barrido (`20260815140000` saca de sombra los tres
firmados).

### 🔴 Las dos cosas que hay que NO olvidar de este arco

1. **`entregada` ≠ `se vio`.** El primer disparo salió `entregada` y el
   teléfono no mostró nada: **la app estaba en primer plano**, y un push a una
   app abierta lo maneja la app. Se confirmó que SÍ llegó porque
   `push_tokens.last_used_at` saltó al minuto del despacho.
   *Antes de diagnosticar un silencio, preguntá dónde estaba mirando la
   persona.*
2. **La voz se hornea al ENCOLAR.** `despachar-push` lee `datos.titulo` (su
   línea 205) y cae al genérico si falta; `registrar_intencion_notificacion`
   **no** llama a la voz. **La hornea cada productor**, con
   `jsonb_build_object(...) || _voz_notificacion(...)`.

---

## 3 · 🔴 D-824 — EL MAPA DE DOS EJES (no es una lista)

| eje | cuántos |
|---|---|
| **en sombra** (existen y no envían por diseño) | **13** |
| **sin productor** (tienen vocabulario y nadie los encola) | **15** |

> ***Los dos conjuntos SE CRUZAN: un tipo puede estar mudo por las dos razones
> a la vez, y curar una lo deja mudo igual.*** **Antes de tocar cualquiera se
> preguntan las DOS cosas.**

**Muere tipo por tipo con su firma, JAMÁS en bloque** — encenderlos todos sería
lo contrario de la firma que abrió D-822: *el canal nace útil, no ruidoso.*
Con destino ya declarado y fuera de discusión: `liquidacion_disponible`
(2ª ola) · `mensaje_nuevo` (cuando haya mensajería) · `cita_completada`
(**fuera a propósito**: quien atendió ya lo sabe).

---

## 4 · D-823 — LA CONVENCIÓN DE TELÉFONO, CON LETRA PREVIA PENDIENTE

**9 columnas prohíben el `+` · 4 lo exigen.** Es **la regla 28 sobreviviendo a
su propia derogación** (murió en S84 por incompleta; las nueve nunca se
migraron).

🔴 **NO se cura de paso, y la razón es de letra:** **P21 prohíbe DERIVAR el
país.** Un backfill que «complete» los nueve a E.164 estaría **inventando el
país de cada número** — exactamente el defecto que la letra vino a impedir.
⇒ **Primero se firma cuál convención rige y de dónde sale el país; después se
migra.** `seller_perfil` y `direcciones_guardadas` son el frente.

---

## 5 · ESTADO OPERATIVO

- **OTA prestador vigente: `536fd59c`** · ancla `b10dd4ef` · runtime 1.0.5.
  ⚠️ **Hay trabajo posterior sin publicar** (los merges de C, el motor de esta
  ventana). *El motor no necesita OTA; las pantallas de C sí.*
- 🔴 **EL CLIENTE NO SE PUBLICÓ** — sigue en `3743c536`/1.0.3, y las piezas
  compartidas que cambiaron para el prestador (`Entrada`, `Baldosa`) **le
  entrarían sin gate**. Decisión declarada, no olvido.
- **☠️ D-786 MUERTA** — el botón de buscar actualizaciones consulta, descarga
  y aplica (verificado en los cuatro eslabones). **La caminata del founder ya
  no está bloqueada.**
- **APARATO `R5CY201ZDVL`** · **sesión `demovet` / Clínica Aurora** (restaurada
  tras pasar por `duenodes`) · `animator_duration_scale = 1.0`.
- **`+vet2` tiene FRENO DE CREDENCIAL**: existe, es el paseo-only, **no está en
  la matriz de clave compartida** y no se adivina ni se resetea (§6ter).
- **`packages/api` y `packages/domain` sin `node_modules`** (symlinks
  autorreferentes retirados). `pnpm install` pide purgar y **no se hizo: es
  piso compartido**. `tsc` corre por el binario raíz. Recuperación:
  `CI=true pnpm install`.
- **Aurora VENDE**: rol `seller_productos` + 1 SKU mapeado + 1 oferta
  publicada, todo por las puertas reales.

---

## 6 · LAS LECCIONES DE ESTA VENTANA

1. **`CONTRATO` regla 87 — el `SALTAR_GATE` declara UN rojo con NOMBRE.**
   Nacida de un incidente propio: declaré el rojo conocido de `router.d.ts` y
   **pasé al lado de `verify:diseno ROJO` que el mismo aviso traía.**
   *Escribir un motivo cierto se siente como haber mirado.* **Es la diferencia
   entre una excepción documentada y una costumbre de saltar.**
2. **Un censo se hace por la RELACIÓN que define el hecho.** Tres métodos, tres
   respuestas: por nombre del constraint (3) · por texto de su definición (6) ·
   **por columna vía `conkey` (9+4)**. Los tres primeros filtraban por un
   **proxy** de la cosa. *Un CHECK sobre `whatsapp` no dice «telefono» en
   ninguna parte; pero la columna siempre está en `conkey`.*
3. **`entregada` ≠ `se vio`** (arriba).
4. 🔴 **El instrumento fue más rápido que leer TRES veces, y las tres estuvo
   mal:** el `head -8` sobre un censo de 13 líneas · los dos clasificadores
   que confundieron `!~` con `~` · los tres filtros del censo.
   ***Automatizar la lectura de un literal corto puede costar más que leerlo.***
5. **Medir antes de construir achicó el trabajo cuatro veces** — el handshake
   ya existía · la puerta atómica del renombre ya existía · el resolvedor de
   razas ya existía · la convención de día de semana ya existía.
   **Y una vez lo AGRANDÓ, que también cuenta:** el censo de D-822 encontró
   una segunda capa (los 16 en sombra) que ninguna de las tres preguntas
   buscaba.

---

## 7 · TRAMPAS DEL APARATO (además de las del HANDOFF ①)

- **`KEYCODE_BACK` en bucle SALE de la app** en la raíz — se vuelve por deep
  link, nunca con más BACK.
- **`dumpsys notification` SIN `--pkg` vuelca la bandeja personal del
  founder.** Regla dura en `METODO` §6bis-A: **el alcance se acota ANTES de
  correr, jamás después.** *Un filtro aplicado a la salida llega tarde: para
  filtrar hay que haber leído.*
- **El `uiautomator dump` va ATRASADO** respecto de la pantalla: cuando
  contradiga a una captura, **gana la captura**.
