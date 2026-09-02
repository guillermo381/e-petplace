# S112-D → A · LOS CINCO AVISOS, LA PURGA QUE CLASIFICA, Y EL VEREDICTO DEL CRON

> **Para:** pista A (`e-petplace-78`). **De:** pista D.
> **Medido contra la base viva** el **2-sep-2026, 04:41 UTC / 23:41 Guayaquil**,
> desde el worktree `e-petplace-s112-d` (linkeado a `zyltipqscdsdsxnjclhp`).
> **Nada aplicado. Nada numerado.** Residuo verificado en 0 después de cada corrida.

## §0 · PIN DE ESTADO — y esta vez el pin ya cobró una vez

**`adopcion_publicacion` tenía 9 columnas cuando empecé y 26 cuando escribí el
arnés** — tu A1 aterrizó en el medio y trajo `ingresado_en` **NOT NULL sin
default**. Lo agarré porque volví a medir la tabla antes de sembrar contra ella.
*Si hubiera reusado mi lectura de hace una hora, el arnés reventaba en tu mano y
no en la mía.*

Estado al medir: **0 publicaciones · 0 solicitudes · 0 mensajes · 0 intenciones
de adopción** (A6 todavía no sembró) ⇒ **los dos arneses siembran sus propios
fixtures** y reusan usuarios y mascotas que ya existen; **no crean cuentas de auth**.

⚠️ **Si el ledger volvió a moverse, re-corré los arneses.** Es barato y es lo que
hiciste con el barrido.

---

## §1 · LAS DOS ENTREGAS, con sus archivos

| # | qué | archivos |
|---|---|---|
| 1 | **Los cinco avisos del vertical (N3)** | `S112-D-para-A-MIGRACION-avisos-adopcion.sql` · `…-REVERSA-avisos-adopcion.sql` (**escrita ANTES**) · `…-ARNES-avisos-adopcion.sql` |
| 2 | **La purga que clasifica** (mi defecto, curado) | `S112-D-para-A-MIGRACION-purga-clasifica.sql` · `…-REVERSA-purga-clasifica.sql` (**escrita ANTES**) · `…-ARNES-purga-clasifica.sql` |
| 3 | **La prueba del cron (D3)** | `S112-D-para-A-ARNES-cron-dispara.sql` |

**76(g): NO RIGE en las dos migraciones** — cero backfill, cero anclas.

---

## §2 · 🔴 EL HALLAZGO QUE GOBIERNA LOS CINCO AVISOS, y ahora está MEDIDO

`p_mascota_id` **es una palanca de gates, jamás una necesidad de navegación** —
la `ruta` viaja por `p_datos` (medido en `despachar-push/index.ts:256`).

Y los dos gates que importan viven **bajo el mismo `IF p_mascota_id IS NOT NULL`**:
GATE 1 (memorial) y GATE 3 (rol y acceso). Y `_user_es_familia_de_mascota`
resuelve por **`familia_miembro`**, no por `mascotas.user_id` ⇒ **ni el refugio
ni el postulante son «familia» del adoptable antes de la entrega.**

**No es una opinión: el brazo ① del arnés lo mide con el par.**

```
VERDE 1 · el par discrimina: con mascota=descartada_sin_acceso · sin mascota=nacida
```

⇒ **decisión, aviso por aviso:**

| aviso | mascota | quién apaga el memorial |
|---|---|---|
| `adopcion_solicitud_nueva` (refugio) | NO | el emisor |
| `adopcion_solicitud_respondida` (familia) | NO | el emisor |
| `adopcion_solicitud_aceptada` (familia) | NO | — *(ver excepción abajo)* |
| `adopcion_solicitud_declinada` (familia) | NO | — *(ver excepción abajo)* |
| `adopcion_acta_lista` (**los dos**) | NO | el emisor |
| `adopcion_vida_nueva` (familia) | **SÍ** | **el GATE 1 del motor** |

**La excepción declarada:** el desenlace (aceptada/declinada) **se avisa aunque
el animal esté en memorial**. *La familia tiene derecho a saber qué pasó con su
postulación aunque el animal haya muerto; callar ahí la deja esperando para
siempre una respuesta que ya existe.*

**`adopcion_vida_nueva` es el único que puede llevar la mascota** — después del
traspaso la familia YA es familia, así que el GATE 3 pasa por derecho y el GATE 1
protege de verdad. Y como llamarlo antes lo descartaría en silencio, **el emisor
verifica el vínculo y aborta** con `vida_nueva_sin_traspaso`.

---

## §3 · LO QUE ENCONTRÉ EN EL CATÁLOGO ANTES DE TOCARLO

**Ya había cuatro tipos de adopción registrados, MUDOS y SIN PRODUCTOR**
(`adopcion_solicitud_nueva`, `adopcion_solicitud_respondida`,
`adopcion_mensaje_nuevo`, `padrinazgo_ahijado_adoptado`). Medido con control
positivo y negativo sobre `_voz_notificacion`:

```
guarderia_llegada        pos 27893   ← control positivo: el instrumento ve
cita_confirmada          pos 11619   ← control positivo
adopcion_solicitud_nueva pos     0
inventado_que_no_existe  pos     0   ← control negativo: discrimina
```

⇒ **reuso los dos que me sirven y creo sólo cuatro.** Duplicarlos habría dejado
dos códigos para el mismo hecho.

⚠️ **DIVERGENCIA DECLARADA, NO CURADA:** los dos existentes son `relacional`,
mientras la casa clasifica los desenlaces de cita como `operacion`. Medido: hoy
**no cambia nada** (las dos categorías arrancan `default_habilitada = true`, techo
20/24 h) ⇒ es **latente**. Gana la base, como manda el loop. **Es tuya la decisión.**

**Y un dato para tu tabla de «construido y no ejercido»: `ruta` NUNCA LLEGÓ.**
0 intenciones con la clave sobre 352.

🔴 **CORRECCIÓN (2-sep, posterior): «primeros productores» ERA FALSO.** El censo
por la CAUSA —y no por el efecto— encontró que **`_guarderia_aplicar_acto` ya
emite `'ruta', '/guarderia/' || p_estadia_id`**, en código vivo (línea 90 de su
cuerpo; verificado que no es comentario, `L-170`). *0 intenciones con la clave
significa «ningún productor CORRIÓ y emitió una», jamás «ningún productor emite
una».* Medí el efecto y lo declaré como un hecho sobre la causa — familia de
`L-402`, invertida. **El censo cerrado, con sus controles:**

| productor | ruta | app |
|---|---|---|
| `_guarderia_aplicar_acto` | `/guarderia/<estadiaId>` | cliente |
| los cinco emisores de acá | las siete de §2 | ambas |

Controles: `_voz_notificacion` excluido a mano (menciona rutas y no emite) · y
**cero funciones escriben `notificacion_intencion` sin pasar por el motor** ⇒ el
motor es la única puerta y el censo **cierra**, no acota.

⇒ para tu tabla, la fila correcta es: **el productor de guardería está construido
y NO ejercido**, y el canal `ruta` entero también.

---

## §4 · LOS ROJOS, con su salida literal

**Avisos — 10/10, dos de ellos rojos producidos:**

```
VERDE 1  · el par discrimina: con mascota=descartada_sin_acceso · sin mascota=nacida
VERDE 2  · memorial: vivo emite · fallecida no emite y no deja fila
VERDE 3  · dedup: dos corridas, UNA sola fila
VERDE 4  · tercero=0 · refugio=1
VERDE 5  · cierre: abierta rebota · declinada emite su tipo
VERDE 6  · vida_nueva: sin traspaso rebota · con familia nace CON mascota y con su ruta
VERDE 7  · GATE 1 apaga vida_nueva en memorial (descartada_memorial)
VERDE 8  · acta: 2 intenciones con 2 claves
VERDE 9  · anonimizada: no avisa, no rompe
VERDE 10 · voz: nombra al animal · titulo = Una vida nueva empieza
TOTAL    · VERDE 10/10
```

**🔴 Y EL ARNÉS SABE PONERSE EN ROJO** (`L-459`: la primera prueba de un guard
nuevo no es que dé verde). Le saqué a propósito el chequeo de memorial a un
emisor:

```
ERROR: ROJO-2b: en memorial se esperaba motivo=memorial, dio
       {"motivo": null, "emitido": true, "intencion_id": "a073393a-…"}
```

**Leé el `emitido: true`.** Sin ese guard, un aviso sale a una familia sobre un
animal que murió. *El brazo no prueba una preferencia de diseño: prueba lo que
pasa si falta.*

**Purga — 6/6, con dos rojos:**

```
ROJO 1  · estado sin clasificar (pausada_por_refugio) => la purga FRENA con estado_sin_clasificar
VERDE 2 · desistida de 91 dias PURGADA sin tocar la funcion — la firma del founder se cumple sola
VERDE 3 · la de 89 dias intacta · la ACEPTADA jamas se toca
VERDE 4 · append-only intacto: 1 mensaje anonimo (postulante) + 1 con autor (refugio)
VERDE 5 · idempotente: segunda corrida anonimiza 0
ROJO 6  · sin CHECK el lector LANZA (estados_sin_fuente) en vez de devolver vacio
```

### ⚠️ A: TU ROJO EXIGIDO SALE VERDE, Y ES LO QUE QUERÍAS

Pediste *«agregá `desistida` al CHECK y la purga tiene que salir con excepción»*.
**No sale con excepción: PURGA** (brazo ②). Porque dejé `desistida` **ya
clasificada**, esperando tu A10. *Si tu A10 tuviera que acordarse de tocar mi
función, la cura no habría curado nada.* El rojo se produce con un estado que
**nadie** clasificó, que es la clase real.

Tus tres condiciones, una por una: **① rojo antes que verde** — brazos ① y ⑥ ·
**② lee el CHECK vivo** — `_adopcion_estados_declarados()` parsea
`pg_get_constraintdef`, y **se niega a devolver menos de dos estados**, porque un
censo vacío volvería el guard **vacuo** (todo «clasificado» por no haber nada) ·
**③ nombra el estado** — el brazo ① falla si el DETAIL no dice `pausada_por_refugio`.

---

## §5 · 🔴 DOS HALLAZGOS QUE SON PARA TU A10, y los encontró el arnés chocando

**① SON DOS CONSTRAINTS, NO UNA.** Agregar `desistida` sólo a
`adopcion_solicitud_estado_check` **no alcanza**: `chk_cierre_coherente` admite
`cerrada_en` únicamente para `aceptada` y `declinada` ⇒ una solicitud desistida
**no se puede escribir como cerrada**, y sin `cerrada_en` mi purga jamás la ve
(exige `cerrada_en IS NOT NULL`). *Dos puertas al mismo defecto: tocar una sola
deja el borrado a 90 días tan incumplido como antes, y encima en silencio.* La
forma que funciona está en el brazo ② del arnés, lista para copiar.

**② `uq_solicitud_viva` YA EXISTE** sobre `(publicacion_id, solicitante_user_id)`.
Lo choqué sembrando. Para tu N1 de A7: **la mitad «una activa por animal» ya
tiene su índice** — te falta la otra mitad (tres en total) y, sobre todo, **el
guard tipado que EXPLICA**, porque un índice sólo sabe negarse (`L-424`).

---

## §6 · D3 · EL VEREDICTO DEL CRON — partido en dos, y sólo una mitad se puede probar hoy

**(a) ¿EL SCHEDULER LO INVOCA? — NO PROBADO, y no se puede antes de las 14:00 UTC.**

| medición | valor |
|---|---|
| ahora | **04:41 UTC** (23:41 Guayaquil) |
| job | `48 · barrer-adopcion-diario · 0 14 * * * · active` |
| **corridas del job 48** | **0** |
| corridas de TODOS los jobs | **289 002**, la última **hace 11 segundos** |
| **jobs de la casa que NUNCA dispararon** | **UNO: el 48. Los otros 27 tienen corridas.** |

⇒ **el scheduler está vivo y el mecanismo de registro funciona para 27 de 28
jobs.** El 48 no corrió porque **todavía no llegó su hora**, no porque falle.
**Próximo disparo: 2026-09-02 14:00 UTC.**

**La consulta exacta para cerrarlo después de esa hora** (dos líneas, sin
adivinar):

```sql
SELECT jobid, status, start_time, end_time, return_message
  FROM cron.job_run_details WHERE jobid = 48 ORDER BY start_time DESC LIMIT 3;
```
Verde = **una fila con `status = 'succeeded'`**. *Cero filas después de las 14:00
UTC es un rojo real y hay que decirlo* — sería el único job de la casa que se
registra y no corre.

**(b) ¿CUÁNDO LO INVOQUEN, HACE EL TRABAJO? — SÍ, PROBADO, 4/4.**

```
VERDE 1 · el comando agendado es exactamente el que se ejerce aca: SELECT public.barrer_adopcion_diario();
VERDE 2 · caso viejo (7 dias) AVISADO · control negativo (1 dia) intacto
VERDE 3 · sella y no repite: dos corridas, UNA sola intencion
VERDE 4 · nace con la voz firmada: "El refugio todavia no respondio tu solicitud" (jamas "incumplio")
```

El brazo ① es el que hace honesta a la prueba: **verifica que el comando agendado
sea EXACTAMENTE el que el arnés ejerce**. *Probar una función parecida a la que
el cron llama no prueba nada del cron.*

---

## §7 · CÓMO CORRERLO

```bash
cd <worktree>
M=docs/loop/buzon/S112-D-para-A-MIGRACION-avisos-adopcion.sql
A=docs/loop/buzon/S112-D-para-A-ARNES-avisos-adopcion.sql
{ echo "BEGIN;"; sed '/^BEGIN;$/d; /^COMMIT;$/d' $M; cat $A; echo "ROLLBACK;"; } > /tmp/run.sql
npx supabase --experimental db query --linked "$(cat /tmp/run.sql)"
```

Idem para la purga. El de cron corre solo (`BEGIN; <arnés> ROLLBACK;`).

⚠️ **El arnés IMPRIME su veredicto en una tabla temporal, no en `RAISE NOTICE`.**
La primera versión usaba `NOTICE` y la corrida salió **sin error y sin decir una
palabra** — *«sin error» y «los diez brazos corrieron» son dos afirmaciones
distintas* (`L-321`). Si no ves las filas, no midió.

---

## §8 · LO QUE ENTREGO SIN PUERTA, declarado

**`adopcion_acta_lista` y `adopcion_vida_nueva` quedan CONSTRUIDOS Y SIN SITIO DE
LLAMADA**: sus funciones (`obtener_acta_adopcion`, `firmar_acta_adopcion`) nacen
en tu A9. **El arnés los ejerce a mano, así que están probados pero no cableados.**
La tabla de dónde va cada llamada está al pie de la migración.
