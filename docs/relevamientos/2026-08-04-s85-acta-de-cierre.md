# S85 · ACTA DE CIERRE — el rediseño del prestador, medido

> **Complemento de `2026-08-04-s85-acta-del-metodo.md`**, que guarda el método.
> **Esto guarda el RESULTADO y las leyes con sus casos.**
>
> **Cierra con TRES gates del founder corridos en dispositivo**, el último
> **firmado entero y sin rebotes**.

---

## 1 · EL BURN-DOWN FINAL (D-630, su tercera corrida del día)

```
COMPOSICIÓN 10/57 (18%)  ·  MECÁNICA 7/57 con deuda  ·  DERIVA +0/-1
```

**Línea base S83-A15: 7/54 (13%) ⇒ +3 pantallas, +5 puntos.**

| familia | migradas / vivas | |
|---|---|---|
| **F7 PUERTA / MOMENTO** | **3 / 4** | **75%** |
| F5 CAPTURA | 3 / 11 | 27% |
| F4 LISTA CON EJES | 2 / 9 | 22% |
| F3 CICLO DE LA ATENCIÓN | 2 / 13 | 15% |
| **F1 EL TALLER** · F2 PORTADA · F6 MENÚ · F8 VACÍO · F9 FICHA · F10 CUENTA | **0** | **0%** |

### ⚠️ La letra chica, que va CON el número y no después

**① EL 18% SUBESTIMA S85.** *La lista BASE mide piezas de S82/S83* —`Entrada`,
`TarjetaEstado`, `FilaCita`, `SelectorSegmentado`, `PieReserva`, `MarcaEleccion`,
`CantoMarca`— **y S85 construyó con piezas que esa lista no nombra**:
`TresNumeros`, `SelectorDia`, `FiltroPills`, `FichaPrestador`, el emblema.
**Re-basar es decisión de la mesa**, y cuando la tome, **la línea base se
re-declara con su fecha** — no se corrige hacia atrás.

**② `F1 EL TALLER` EN 0% Y ES LA FAMILIA MÁS GRANDE SIN TOCAR** — *y coincide
exacto con la observación del founder del gate («al taller le faltan paredes y
sobran transparencias»)*. **El número y el ojo dijeron lo mismo por caminos
distintos**, que es lo más cerca que este instrumento estuvo de validarse.

**③ El eje MECÁNICO no se movió (7/57), y es honesto:** *S85 construyó, no
barrió.*

**④ DERIVA −1:** murió `(tabs)/cuenta/identidad` — **la pantalla cuya muerte
produjo D-637**.

---

## 2 · LAS SEIS LEYES, **CON SU CASO** — porque el caso es el valor

> **Esta sesión probó SEIS veces que un enunciado sin su caso se cita mal.** *Por
> eso ninguna de las seis se guarda como frase: se guarda con el hecho que la
> parió.*

| | la ley | **el caso que la parió** |
|---|---|---|
| **L-194** | un número de plataforma copiado en un wrapper es **letra muerta que REBOTA BIEN** | **cuatro `> 4` hardcodeados** en la puerta única del cupo. *El techo de plataforma subió a 10 y los cuatro seguían rebotando en 4 — **con el mensaje correcto**.* Su enmienda: **un guard tiene DOS cuerpos** — el predicado y el texto; curé el predicado y dejé vivo *«entre 1 y 4»* |
| **L-195** | verificar que una columna **existe** no es verificar que esté **poblada** | afirmé *«el quién ya está en la fila»* leyendo `information_schema`. Al contar: **`cuenta_comercial_id` poblada en 3 de 177**, **`procedencia` NULL en 134**. *Verdadera sobre el esquema, falsa sobre el dato* |
| **L-196** | un módulo *"preparado-apagado"* que **nunca pasó por un compilador** no está preparado: está escrito | el tren del push |
| **L-197** | un fallo degrada a **AUSENCIA**, nunca a un **VALOR** que el consumidor use como cierto | **`techoMaximoDe()`**: embed sobre una relación **sin FK** ⇒ fallaba SIEMPRE, y su `catch` devolvía `return 1`. **Escribí ese `1` a propósito, con su comentario razonado.** El taller del founder dijo **«Hasta 1 en simultáneo»** una sesión entera. *La URL que no aparece SE NOTA; el techo que dice 1 SE OBEDECE* |
| **L-198** | un texto que explica un porqué **vence con el porqué** | **tres direcciones, las tres cobradas hoy** — ver abajo |
| **L-199** | **el rojo se produce ANTES** o la cura queda sin evidencia para siempre | **D-639**: par medido por el camino real — **antes 85 filas / 84 CON contenido; después 85 filas / 0 contenidos / 85 autores** |

### L-198 se llevó el día: **TRES direcciones, y las tres corrigen a alguien distinto**

| | dirección | caso |
|---|---|---|
| **①** | **hacia adelante** — el texto vence con el porqué | la receta correcta escrita **en el mismo commit que la rompió** *(B: al wrapper y no al glifo)* |
| **②** | **hacia atrás, al leer** — el literal se traduce a la causa que uno ya tenía | **«fundador», pedido TRES VECES y no ejecutado**: la mesa lo leyó como cambio de **pieza** y era de **palabra**. *No era una palabra mal elegida: era un **ACTO DE HABLA** — «Prestador fundador» no describe, **otorga**.* **Cura: cambiar de eje, de mérito a tiempo** |
| **③** | **en tránsito** — el reporte **envejece mientras viaja** | el gate corrió sobre un OTA **anterior a tres commits**: los reportes eran ciertos al tomarlos y falsos al llegar. **+ segundo caso el mismo día, cobrado a la MESA**: el cierre de B reenviado con el hash de C — *no hace falta que pase tiempo: **alcanza con resumir dos reportes en uno*** |

### ➕ Y la que cierra la serie: **D-645 — UNA PROMOCIÓN NO ES UNA MIGRACIÓN**

**Hallazgo de C, con la otra mitad de B.** *Cuando una pieza sube a
`packages/ui`, el acto tiene dos mitades —la pieza nueva existe · los
consumidores viejos mueren— y **el árbol registra la primera y no sabe nada de
la segunda**.*

> **Los CUATRO cobros del día los cazó el founder comparando su pantalla con la
> galería. NI UNO un guard** — *y no es que fallaran: **no existe ninguno que
> pueda ver esto**, porque no hay nada roto que ver.*

**La propagación (B), verificada con el literal:** `iconos-oficio.tsx:4` cita el
mismo precedente **y con la misma frase** que `iconos-tabs.tsx:4`. **El primer
clon se vuelve la AUTORIZACIÓN del segundo** — *la misma forma que dos letras
firmadas que se contradicen, solo que lo que se hereda es una copia en vez de
una ley.*

**Y el corolario que desarma la defensa fácil:** *tres copias correctas **no**
prueban que el sistema funcione — prueban que **quien copia es cuidadoso**.*

---

## 3 · EL EJE COMÚN DE LAS SIETE, y es lo único que hay que recordar

> ### **NINGUNA ROMPE NADA.**
> *Un número viejo que rebota bien · una columna vacía que el typecheck acepta ·
> un módulo que compila el día que nadie lo compila · un catch que devuelve un
> valor legal · un comentario vigente que describe algo inexistente · una cura
> sin su antes · un clon que compila perfecto porque nunca dependió del original.*
>
> **LAS SIETE PRODUCEN SALIDAS CREÍBLES** — es la familia que S84 nombró con sus
> candidatas #15-#21, **y S85 la pagó siete veces más.**

---

## 4 · LO CONSTRUIDO — el resultado, no el camino

- **EL EJE DEL CUPO, CUATRO DEFECTOS DISTINTOS** bajo un solo síntoma
  (*«el slot desaparece»*): `cupo_techo` en 4 · `max_citas_por_slot = 1` · los
  cuatro `> 4` · el embed sin FK con su `return 1`. **Ninguno visible desde el
  anterior.**
- **D-595 y el cupo se tapaban mutuamente:** *el bug de capacidad hacía imposible
  reservar dos paseos a la vez ⇒ el del GPS no podía manifestarse.* **Ninguno se
  podía cerrar sin el otro** ⇒ *ante toda condición de muerte que lleva sesiones
  sin cumplirse, la pregunta no es «¿quién la paga?» sino **«¿se puede
  cumplir?»***
- **LA PORTADA DEL PRESTADOR:** los tres números · el emblema de cohorte con su
  modal · `$ del día` con su gate **en el SERVIDOR** (*una autorización que
  decide el cliente es decorativa*) · «Necesita tu atención» con sus cuatro
  fuentes.
- **DATOS** (ex-Mascotas) · la Cuenta en cuatro puertas · la recuperación por
  código.
- **D-639 — CURA DE PRIVACIDAD:** el expediente **se concedía entero o nada**.
- **EL NOMBRE DEJA DE SEMBRARSE DEL CORREO** (firma (d+e)): `full_name → name →
  nombre`, y **sin dato, `NULL`**. *Un vacío se nota; un slug se obedece.*

**Operativo:** **10 migraciones** aplicadas y registradas, **las 10 con reversa
escrita ANTES** (dos con aviso propio: *revertir REABRE un endurecimiento* ·
*revertir REPONE un defecto que no se ve*) · **~66 commits de A** · **cuatro
OTAs**, **los cuatro con ancla limpia** · **☠️ D-617, D-595, D-630, D-633, D-639,
D-173 muertas.**

---

## 5 · LOS FRENOS — **TRECE, y ninguno falso**

**Los que cambiaron una decisión:** el backfill de teléfonos · endurecer E.164
rompe `apps/cliente` · *«la franja de paseo»* no existe (56/56 universales) · la
FK habría rebotado (3 huérfanas) · el gate en el wrapper sería decorativo ⇒ **RPC
DEFINER** · §2.4bis vs `S72-P1a` ⇒ **firma, no adjudicación** · el lector de
handshakes **ya existía** · **las dos tabs del plan de consolidación NO EXISTEN**
(la barra ya son cuatro) · **`db push` quería arrastrar una migración de S82**
(⇒ D-644) · **el hash que la mesa atribuyó a B era de C**.

> **⚠️ CINCO DE LOS TRECE FRENARON UNA ORDEN QUE AFIRMABA UN HUECO INEXISTENTE.**
> *No es un reproche: es el dato que justifica que el freno sea obligatorio en
> las dos direcciones.*

**Y la mesa midió viejo CINCO veces** ⇒ **regla #22 firmada el mismo día**, con
su segunda mitad: *quien reenvía reenvía SU ANCLA Y SU HORA, o la re-mide y la
firma como propia.*

---

## 6 · LAS CUATRO VEDAS — **las cuatro re-pedidas, cero anclas sucias**

**Y la cura estructural quedó FIRMADA: `regla 85`, worktree por pista.**

*Las tres veces que el árbol se movió entre la declaración y el bundle son la
misma causa: tres pistas en UN árbol y UN índice.* **La tercera fue A** — que
tenía la disciplina escrita y la había exigido a las otras dos ese día.

> **Una regla que su propio autor incumple con el instrumento en la mano no falla
> por falta de rigor: falla porque el entorno la hace fácil de romper.**

**+ §3.4 ganó su TEST DE EXENCIÓN MEDIBLE** (registrado y aceptado, **no
ablanda: da juez**): diff **VACÍO** sobre `apps` y `packages` · medición
**publicada**, no afirmada · **declarada en el mismo mensaje del hash**. *Ante la
duda o sin las tres, se re-pide.*

---

## 7 · LO QUE NO SE HIZO, sin maquillaje

- **El eje MECÁNICO no se movió.** Las 5 `Campo sin EvitaTeclado` siguen.
- **`F1 EL TALLER` sigue en 0%** — y el founder ya dijo qué le falta.
- **`A3.5bis-b` (la puerta del permiso) es LETRA SIN MOTOR** — su canal es
  `MODELO_NOTIFICACIONES`, que no existe.
- **`caso_clinico_id` no llega a `eventos_mascota`** ⇒ *«por caso»* **no es
  expresable todavía**.
- **`apps/cliente` no se corrió** contra el `packages/api` de S85 (D-641) — **y
  ahora tiene un segundo motivo: dos superficies suyas pintan un nombre que
  ahora puede ser `NULL`, y NO TIENEN DUEÑO.**
- **L-197 y L-198 tenían su cuerpo archivado bajo el bullet equivocado** —
  curado hoy. *La ley sobre textos que no se leen estaba donde no se la leía.*

---

*Depositada por A, S85. Lo firmado rige; lo medido se cita con su ancla.*
