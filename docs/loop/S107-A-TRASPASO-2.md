# S107-A · TRASPASO 2 — la conducción al 29-ago-2026, tarde

> **Reemplaza a `S107-A-TRASPASO.md`**, que es la foto de la mañana y quedó
> enmendada. **Éste es el estado vivo.** Todo lo de acá está medido contra el
> objeto; lo que es decisión lleva su firma.
>
> **`main` = `389ea935`** · **507 migraciones local = remoto, cero desemparejadas**
> · árbol limpio · 4 typechecks en 0 · `verify:diseno` VERDE con **61 reglas**.

---

# 🔴 QUÉ HACER APENAS ARRANQUES — tres cosas, en este orden

**1 · PREGUNTALE AL FOUNDER EL ESTADO.** Este documento envejece igual que el
anterior. *Un acta dice lo que pasó; sólo el founder dice lo que sigue.*

**2 · NO HAY NADA BLOQUEANTE.** El motor de guardería está completo. Lo único
que espera es **la firma del founder sobre las tres claves de `app_config`** que
encienden el cobro recurrente — **y van últimas, por decisión suya.**

**3 · EL GATE DE D CORRE HOY**, con el binario que el founder ya tiene. No
espera ninguna build. *(Ver §③ — el supuesto que se cayó.)*

---

## ① EL ESTADO DE CADA PISTA — medido contra su WORKTREE, no contra el remoto

| pista | worktree | árbol | fuera de `main` |
|---|---|---|---|
| **B** | `e7fee131` | limpio | **nada** |
| **C** | `cdc73b85` | 🔴 **3 archivos sucios** | **2 commits** — *está trabajando; no se mergeó a propósito* |
| **D** | `82bd98e5` | limpio | **nada** (mergeada al cerrar) |

⚠️ **A C no se le mergeó porque su árbol está sucio.** *Un commit limpio no
significa «listo para entrar»; un árbol sucio significa que está a mitad de algo.*
Sus dos commits (`67127260` + su merge) son el sello CUMPLIDO en nueve pedidos —
**se mergean apenas su worktree quede limpio.**

🔑 **Y la lección de la mañana sigue rigiendo: el estado de una pista se mide
contra su WORKTREE.** `git log origin/main..origin/pista/X` da «cero fuera» sobre
trabajo que vive sin pushear.

---

## ② LO QUE SE CONSTRUYÓ EN ESTA TANDA — todo en `main`

### El recorrido de la familia
- **El filtro por modalidad** (`obtenerGuarderiasDisponibles({modalidad})`) con el
  precio de esa modalidad **ya resuelto por el server**, y **la cura del guard
  que escondía a los lugares de sólo-paquete o sólo-mensual**.
- **El resumen del filtro** (`obtenerResumenGuarderias`) — cuántos · desde cuánto
  · **la causa discriminada por cascada medida**, con `no_opera_ese_dia` como
  causa propia.
- **Las dos ventanas viajan en la lista** (N+1 cerrado) y salen de **la franja que
  rige para ESA fecha**.
- **El lector de estadías** (log · durante · acta) + **la quinta rama del rail**
  del Hogar.
- **El lector del acta** y **el lector de bonos** (`«te quedan X días»`).
- **El wrapper de documentos** (las tres RPC tenían la base y no la puerta).

### El paquete
- **`bonos` ensanchado** a `('paseo','guarderia_dia')` **con el censo de los siete
  lectores hecho antes**, cada uno decidido con nombre.
- **`comprarPaqueteGuarderia`** y **`reservarDiaDePaqueteGuarderia({bonoId, fecha,
  mascotaId?})`** — **sin `prestadorId`: el lugar lo pone el bono.**

### La mensualidad — **completa e INERTE**
- **La raíz de autorización** con **las cuatro columnas `NOT NULL`**
  (`tarjeta_id · autorizada_por · autorizada_en · monto_esperado`) ⇒ **`D-886` es
  inexpresable acá.**
- **El cupo comprometido** = los **días hábiles** del período (firma L-V), el
  **cobro** sobre el mandato y la **cancelación** que corre hasta el fin del
  período pagado.
- ⏸️ **CERO CRONES, verificado.** Las tres claves de `app_config` son del founder.

### El tramo y las franjas
- **`guarderia_tramos`** — el productor del `tramoId` que faltaba, **y de paso la
  fuga de `obtener_punto_vivo`**, que devolvía la ubicación de un vehículo a
  cualquiera con el id.
- **`reemplazarFranjasGuarderia`** — cambiar de patrón en **un acto atómico**.

---

## ③ ☠️ EL SUPUESTO QUE SE CAYÓ — y es lo más importante de esta tanda

**Durante media sesión la build de nube fue «lo que cierra las tres cadenas de
permiso». NO LO ERA.**

**Medido por USB sobre el APK INSTALADO** (`com.epetplace.prestador`, `1.0.7`):
`geo.API_KEY` ✅ · `google_app_id` ✅ · los seis permisos ✅ · **la sonda
`SondaManifest` viaja** (`classes5.dex`) ✅.

🔴 **Y las tres cadenas NO están, y NO PUEDEN ESTAR:** viven bajo
`expo-image-picker` y `expo-location`, y esos plugins **las escriben en el
`Info.plist` de iOS**. En Android **el texto del prompt lo escribe el sistema
operativo**. *Medido con `aapt2 dump strings`: ninguna de las tres está en el APK.*

> ### No falta la build: **falta un iPhone.** La prueba ① del guion se
> re-etiquetó como **prueba de iOS** (enmienda en `S107-D.md §⑤duodecies`).

**La build sirve para DISTRIBUIR A FAMILIAS, y nada más de lo que el guion pedía.**

🔑 **El founder dudó del supuesto y la medición le dio la razón.** *Un supuesto
que se repite sin medirse se vuelve más creíble con cada repetición, y ésta
llevaba tres.*

---

## ④ LA COLA — nada bloqueante

1. **Mergear C** apenas su worktree quede limpio (2 commits).
2. **Las tres claves de `app_config`** que encienden el recurrente — **del
   founder, van últimas.** *Un cable que se tiende bajo presión se tiende mal.*
3. **Encender el gate sanitario** (`D-968`) antes de la salida real.
4. **La build de nube** cuando resetee la cuota — **sólo para distribuir**.
5. **Portar la sonda al cliente** — `D-967`, mitad abierta. 🔴 **No se porta y se
   consume en el mismo acto:** en un binario sin el módulo la sonda da `null` ⇒
   fail-closed ⇒ **el mapa del cliente se apagaría donde hoy funciona.**

---

## ⑤ TRAMPAS QUE NO SE VEN EN EL CÓDIGO

1. 🔴 **`prestador_servicios.precio` es NULLABLE pero conserva `DEFAULT 0`** —
   quien inserte omitiendo la columna obtiene `0`, **que no es «sin precio»: es
   GRATIS**. Guardería siempre pasa `NULL` explícito.
2. **El AVISO de vencimiento de paquetes sigue sólo para paseo** — su voz dice
   *«te quedan N salidas»*, palabra del paseo. *No avisar es un hueco; avisar con
   la palabra de otro oficio es una mentira.* **El VENCIMIENTO sí se ensanchó.**
3. **La lista de vacunas es deuda aceptada:** hoy corre sólo con antirrábica.
4. **`D-964`** — cada prestador debe declarar sus especies antes de producción.
5. **El flag `services_enabled.guarderia` está en `true` sólo en EC.** CO no se
   tocó (su `is_active` es `false`).
6. **La galería tiene una COPIA transcrita a mano** de la baldosa del cliente
   (`TokenGallery`, sección `D-973`) — con su marca gemela en la pantalla origen.
   **`D-973` cerró sin cambio, pero esas dos marcas siguen rigiendo.**

---

## ⑥ LO QUE ESTA TANDA APRENDIÓ

- **`L-437`** — *un censo por regex mide la forma que mira, no el motor.* Mi censo
  de códigos dio 0 con dos vivos: los levantaba `RAISE EXCEPTION USING MESSAGE =
  CASE`, que el patrón no veía. **La cura fue leer la función.**
- **`D-976`** — *trasplantar un criterio correcto a una pregunta que no es la suya
  es cómo un número bien calculado termina diciendo algo falso.* **Y es más
  peligroso que inventarlo: viene con la autoridad de haber funcionado en otro
  lado.**
- **`D-974`** — *dos enums que comparten una palabra no comparten su sentido.*
  Pasó dos veces el mismo día (la conformidad, y `PaqueteGuarderia`).
- **Una migración se aplicó VACÍA** y `db push` dijo `Finished`. *El ledger no es
  prueba; la prueba es preguntarle al objeto* — el cinturón de la v2 le pregunta
  al `prosrc`.
- **Un arnés que no imprime no midió nada.** Los arneses de esta tanda devuelven
  sus números, no sólo dejan de fallar.
- **Una razón correcta no exime de medir el destino:** *«una estadía no dura
  minutos»* es cierto, y la columna es `NOT NULL`.
- 🔑 **«Commiteado», «mergeado» y «en el teléfono» son tres estados distintos** —
  regla de reporte adoptada esta tanda. **Toda cura que se reporte dice en cuál
  está.**
- 🔑 **Cuando termino un motor que alguien pidió, le aviso EN EL MISMO ACTO.**
  *Un motor terminado del que su consumidor no se entera está tan bloqueado como
  uno que no existe.*

---

## ⑦ 🔑 EL BINARIO DEL FOUNDER YA ESTÁ MEDIDO — no vuelvas a declararlo

**`verify-ota` va a dar ROJO en su chequeo ②** («ningún binario registrado en EAS
tiene este runtime») porque **el founder tiene binarios cortados fuera de EAS**.
Ese rojo es **del instrumento, no del update**.

⚠️ **Y hasta el 29-ago ese escape se saltaba POR DECLARACIÓN.** Ya no: **se
midió por USB**. La nota que va en `--binario-local` es ésta, y dice *medición*,
no *declaración*:

```
--binario-local "1.0.7 — MEDIDO POR USB el 29-ago sobre el APK instalado
  (com.epetplace.prestador): geo.API_KEY, google_app_id, los seis permisos
  y la sonda SondaManifest presentes. Ya no es declaración: es medición."
```

🔑 **Y el método quedó como instrumento, no como recuerdo:**

```
node scripts/medir-apk-instalado.mjs prestador
node scripts/medir-apk-instalado.mjs cliente
```

> **Nació porque el procedimiento vivía sólo en la cabeza de quien lo corrió — y
> por eso un supuesto falso sobrevivió tres repeticiones sin que nadie lo
> comprobara.** *Un método que no está escrito no se vuelve a correr.*

Imprime la línea del `--binario-local` lista para copiar, **avisa que las cadenas
de permiso no se hornean en Android** (para que nadie lo lea como defecto), y
**sale NO CONCLUYENTE —jamás verde— si no hay aparato**: *un instrumento que no
pudo medir no dice «está bien», dice que no midió.*

---

## ⑦bis 🔴 LA COMPUERTA ESTABA EN DOS PUERTAS DE CUATRO — hallazgo de C, curado

`20260831020000_s107a_gate_en_las_cuatro_puertas.sql` · reversa escrita antes ·
cinturón **6/6**, residuo 0, ACL verificado en las cuatro.

**Lo que C encontró:** `comprar_paquete_guarderia` **no llamaba al gate**.
Reservar sí; comprar no ⇒ *le cobrábamos el paquete entero a una familia que no
aceptó las condiciones, y la frenábamos después, con la plata ya tomada.*

**Lo que agrandó el censo: son DOS puertas, no una.**
`contratar_mensualidad_guarderia` tampoco lo tenía — y es peor, porque no toma
un pago suelto sino un **mandato recurrente**: hoy no cobra, y el día que las
tres claves de `app_config` enciendan el reloj, cobra sola todos los meses.

**Daño medido: CERO** — `bonos(guarderia_dia)=0`, `guarderia_suscripciones=0`,
`guarderia_aceptaciones=0`. Nadie compró todavía.

**Un tercero, que no es de plata pero deja a la familia sin camino:** el gate
devolvía el motivo en el vocabulario del ESTADO (`faltan`) y **cada puerta lo
traducía por su cuenta**. La del día suelto traducía bien; la del paquete lo
pasaba crudo ⇒ emitía `faltan`, un código que **ningún wrapper conoce**. La
traducción se mudó a la FUENTE. *Dos puertas que traducen no pueden mantenerse
iguales; una fuente que traduce, sí.*

⚠️ **Y una decisión de forma, porque C pidió «el mismo `_guarderia_puede_reservar`»:**
en la compra se llama a `evaluar_documentos_guarderia` —**la mitad de
FAMILIA**— y no al gate entero, que además exige mascota. El paquete es **del
hogar** y nace sin mascota: forzar una sería evaluar lo sanitario de un animal
arbitrario, y **le impediría a una familia con dos perros comprar por el que sí
está al día**. Lo sanitario se queda donde el sujeto existe: en la puerta del
día.

**Casi reporto un cuarto defecto y era falso:** mi grep de diagnóstico filtró
por palabras y **se comió la línea que contestaba la pregunta** —
`reservar_dia_guarderia` **sí** manejaba `requisitos_sanitarios`. Lo cazó leer
el cuerpo entero. *Es `L-437` otra vez, del lado de quien la escribió.*

---

## ⑦ter 🔴 D-977 · LOS SEIS DOCUMENTOS NO EXISTEN — y es lo único que bloquea comprar

**`guarderia_documentos` = 0 filas.** El perímetro está entero: tabla, `CHECK`
de seis códigos, lector, evaluador, compuerta, las dos pantallas, y el aceptador
con **todos** los campos que el criterio del abogado exige — tope de urgencia
con su moneda, cadena de contactos, contacto alternativo, y el
**`p_redes_autorizadas`** separado de §5 capa 4.

> **No falta motor ni pantalla. Falta el TEXTO — y el texto es legal.**

🔴 **Ninguna pista lo redacta**, ni como placeholder. Y **no hay borrador**:
`CRITERIO_LEGAL_GUARDERIA.md` lo dice de sí mismo — *«la redacción es de la
mesa; este documento dice el fondo, no la letra»*.

**La cadena, en orden — y los tres primeros eslabones no son de A:**

1. **`D-918` / `D-919`** — la mesa reescribe §3 y §6 de `LETRA_GUARDERIA.md`.
   **Hoy la letra está FRENADA ENTERA**, y no por estar mal escrita: §3 es nula
   de pleno derecho y §6 tiene riesgo penal.
2. **Dos firmas del founder adentro de esa reescritura:** los **plazos exactos**
   del no retiro (el criterio propone 15/60 y dice literal que los firma él) y
   la **decisión de garantías** —póliza colectiva vs. seguro por prestador—,
   que cambia lo que dice `contrato_custodia`.
3. **La redacción de los seis**, cada uno con su `version`.
4. **Recién ahí A los siembra:** un `INSERT` de seis filas. *Lo caro no es
   cargarlos: es tenerlos.*

⚠️ **La versión no es decorativa:** las aceptaciones se guardan por
`(codigo, version)` ⇒ publicar una v2 **vuelve a pedirle la aceptación a toda
familia que aceptó la v1**. Es lo que se quiere — y por eso el texto se carga
firmado y no antes.

---

## ⑧ DÓNDE ESTÁ TODO

**Contratos:** `docs/contratos/s107-contrato-{filtro-por-modalidad · resumen-del-filtro · paquete-contra-saldo · cupo-franja-estadia · paquetes-guarderia · media-durante · documentos-y-actas}.md`
**Avisos a C (los del final llevan el estado en el teléfono):** `docs/loop/S107-A-AVISO-A-C-*.md`
**Reversas y arneses:** `docs/relevamientos/S107-A-{REVERSA,ARNES}-*.sql` — **una reversa por migración, escritas ANTES.**
**El guion del gate:** `docs/loop/S107-D.md §⑤duodecies`, con las dos enmiendas al tope.
**Políticas:** `P24` (cancelación de guardería) en `POLITICAS_EPETPLACE` v1.12.
