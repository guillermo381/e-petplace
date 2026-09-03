# S112 · HOJA DE DECISIÓN DEL FOUNDER

> **Todo lo que espera tu firma o tu autorización.** Una línea por ítem, en
> lenguaje de negocio, con su evidencia y el voto de mesa.
> Compilada el **3-sep-2026** con las cuatro pistas de código cerradas.

---

## 🔴 PRIMERO — QUÉ SALE A PRODUCCIÓN ANTES DEL 30-SEP, Y EN QUÉ ORDEN

| # | qué | evidencia | voto de mesa |
|---|---|---|---|
| **1** | **La veda de producción sigue ENTERA.** Todo lo de S112 —guardería, adopción, la burbuja— vive en `preview`, runtime 1.0.7. **Nada corre en el binario de producción hasta tu «autorizo».** | siete OTAs publicados, cero de ellos a un canal de producción | Es tu palabra, no una fecha calendario |
| **2** | **El orden que la mesa propone: GUARDERÍA primero, ADOPCIÓN segundo.** Guardería tiene su motor de cobro real desde S108-S111 (DeUna certificado, Nuvei certificado, los seis comprables cobrando de verdad); adopción **todavía no tiene motor de plata** — el 5 % y el padrinazgo esperan al contador (ítem 4). *Cobrar de verdad es una barra más alta que traspasar un animal.* | `LETRA_ADOPCION` §1/§6 sin motor de cobro; guardería con `SujetoDeuna` completo desde S108-S111 | Propuesto, no votado — es tu decisión |
| **3** | **Tu recorrido en aparato del lote 5, hecho y aprobado (3-sep).** El hilo de adopción abre en las dos apps. **Falta tu recorrido de los lotes 3 y 4** — nada de eso se verificó en un teléfono todavía (S112-C §19, §11: "cero aparato en todo S112-C"). | pie de Cuenta `01a0600a`/equivalente en cada lote; `S112-CIERRE.md` §⑦ | Antes de cualquier «autorizo» de producción |

---

## LO QUE ES TUYO Y NO ES DE NADIE MÁS

| # | qué | evidencia | voto |
|---|---|---|---|
| **4** | **El T&C Pet Parent v1.0 (S113).** Falta redactar y depositar el texto; el motor de aceptación (`tengoAceptadoDocumento`, el patrón de S112 con versión-viaja-con-el-cuerpo) ya está probado en el vertical de adopción y se reusa tal cual. **Cada cliente lo acepta al entrar, la versión nueva exige aceptación de nuevo** — mismo patrón que `condiciones_adopcion`/`terminos_refugio`. | `LETRA_ADOPCION` §14/§5-bis como precedente de forma | Redactar es tuyo (o del abogado); el motor está resuelto |
| **5** | **El corchete del canal de soporte** — sigue sin decidir a qué canal llega un reclamo o una pregunta que no es una solicitud de adopción ni un mensaje del hilo. | declarado, sin dueño de motor todavía | Necesita tu decisión de canal antes de construir nada |
| **6** | **El 5 % a la fundación, con o sin IVA — sigue esperando al contador.** Pregunta 11 del bloque de preguntas al contador. Nada se modela hasta tener la figura fiscal, por el mismo criterio que ya rigió en S94 con la despensa: *modelar antes de saber la figura fiscal es fabricar un motor que después hay que desarmar.* | `LETRA_ADOPCION` §1 firma ② y ③ | Preguntar antes de construir |
| **7** | **Padrinazgo y donación (§6/§7 de `LETRA_ADOPCION`) — fuera hasta la respuesta del contador.** La letra está firmada (ítems ⑨⑩⑪ ✅ 3-sep), pero **no hay motor de cobro** — el 5 % del ítem 6 es precondición de cualquier construcción. | `LETRA_ADOPCION` §14 | Igual que el ítem 6: no se construye a ciegas |

---

## 🔴 LO QUE APARECIÓ EN S112 Y NO PUEDE ESPERAR AL LANZAMIENTO

| # | qué | evidencia | voto |
|---|---|---|---|
| **8** | 🔴 **`D-1007` — el motor mide "hoy" con la zona horaria de Ecuador fija, no la del prestador.** La APP ya pide el día correcto (C lo curó en su lote 4: `hoyEnZona()` obligatoria, sin default); **el MOTOR no** — 58 funciones repiten la constante `America/Guayaquil`. **Muerde con el primer prestador fuera de Ecuador**: le mostraría "hoy" con el reloj de Quito. | `D-1007`, `S112-CIERRE.md` §⑤ | Curar antes del primer prestador no-EC, no antes |
| **9** | 🔴 **`D-1008` — un crash de la app no deja rastro en ningún lado.** Cero Sentry, cero tabla, cero `captureException`. **Un crash no deja evidencia si el teléfono del founder no está enchufado con el cable en ese momento** — que es exactamente cómo se cazó el crash del hilo esta sesión (E lo capturó por USB en el momento exacto). Sin eso, un crash en producción es invisible para siempre. | `D-1008` | Decisión de plataforma: ¿se instrumenta telemetría de errores antes de producción, o se acepta el riesgo? |
| **10** | 🔴 **El protocolo del animal no retirado (guardería) sigue frenado por riesgo penal**, destrabado por el abogado en el memo 10 §3. **Toca la COMPRA**: sin protocolo, el flujo de compra de guardería no puede declarar qué pasa si nadie retira al animal. Objetivo propio, no de S112. | memo 10 §3 del abogado, referenciado en el bloque canónico | Espera respuesta del abogado, no de ninguna pista |
| **11** | **El ítem de calendario del reloj de 5 días.** El mecanismo del silencio corre para 27 de 28 jobs de la casa; el 48 (adopción) nunca disparó porque **su primera emisión real exige una solicitud NUEVA que nadie conteste durante CINCO DÍAS completos** — las tres solicitudes vivas hoy no pueden dispararlo nunca (nacieron antes de que el reloj existiera, o ya se cerraron). *Un no-evento no se prueba ejecutando: se prueba esperando.* | `D-991`, `S112-D.md` §0bis, medido con `cron.job_run_details` | Ninguna acción — se resuelve solo, con el tiempo |
| **12** | **Cancelar la suscripción de Pepe** (el ave con plan de guardería) desde la app. El guard nuevo ya impide que el reloj le cree estadías nuevas — la suscripción vieja sigue `activa` pero inerte. | `D-1001`, verificado con el guard de especie en `cobrar_periodo_mensualidad_guarderia` | Acción tuya, no de código |

---

## LOS GATES NUEVOS DE S112 — nacieron con su rojo probado, quedan en el hook

| gate | qué mide | probado |
|---|---|---|
| `verify:hoisting-nativo` | un módulo nativo usado sin declarar (compila, corre en dev, el APK no lo tiene) | rojo sembrado con `expo-camera` no declarado, exit 1 con el nombre del paquete |
| `verify:ref-antes-de-uso` | un `useRef` leído antes de declararse (la causa exacta del crash del hilo) | corrido contra `main` con el crash ya curado, 62 archivos |
| `verify:rutas-de-aviso` | una push que se emite y ninguna pantalla la acepta | sembrada `/guarderia/` rota en las dos listas de destino, rojo con la ruta nombrada |
| `verify:vio-todo` (B) | el predicado "vi todo el documento" antes de aceptar | auto-prueba corregida (`L-459`: compartía el supuesto con lo que medía) |
| `verify:fila-memoizada` (B) | que el hilo no se redibuje entero por cada tecla | rojo sembrado rompiendo el comparador |
| `verify:abanico` (B) | las clases de la burbuja se apagan por clase, no todas juntas | 10/10, con el discriminador de reconectar el socket |
| `verify:mis-hilos-realtime` / `verify:d485-familia-lee` (A) | el socket sin filtro sólo entrega a quien participa; la familia lee lo que ya podía editar | ambos escriben y borran una sonda real; no van al hook — corren a mano o en el cierre |

**Los cinco primeros están cableados en `.githooks/pre-commit` y curados del
defecto de `set -e`** (ver `L-490` y el §⑧ del cierre): un gate en exit 2 ya
no mata el shell antes de decir "no concluyente".

---

## LO QUE LA MESA TE PIDE MIRAR EN EL APARATO

| qué | por qué |
|---|---|
| **El ochre del `falta` en la ficha del adoptable** (brazo `lector="observador"`) | Razonado como correcto —el ochre dice "tarea", no "error"— pero el ítem 11 firmado dice que el adoptante lo ve como INFORMACIÓN. B: *"dónde cae ese límite no lo decide un argumento: lo decide mirar."* Hay datos vivos para juzgarlo (Tito urgente con 908 días, Nube con los tres ejes en `no_se_sabe`) |
| **El encuadre de las ilustraciones de especie** (`fotoDeEspecie`, migrado en A4) | Que la prop sea la correcta no prueba que se vea bien — sólo el ojo lo cierra |
| **La hoja de filtros con nueve grupos**, en una pantalla real | Si entra, si se scrollea, si el grupo de ciudad vacío se nota o se lee como error |
| **El desborde de A3 corregido** (la escalera de estados del refugio) | Produjo el rojo del árbol de layout, no de píxeles — un desborde es una medida que sólo existe cuando algo se pinta |
| **La burbuja del refugio en el prestador**, cuando publiques | Construida y mergeada, cero aparato — primer objetivo de S113 |

---

## Y LO QUE **NO** ESPERA TU FIRMA, para que no lo busques

El texto legal en pantalla más allá de lo ya firmado (las puertas se abren
solas cuando el texto se cargue) · las llaves de `app_config` de guardería
(`guarderia_recurrente_vivo` sigue en `false`, ninguna se encendió) · el
cierre del negocio en la app (es trámite asistido por decisión, no por
falta) · `verify:diseno` R18/R17 (jubiladas y re-redactadas por sus propias
condiciones de retiro, sin pedirte nada).
