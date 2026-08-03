# S85 · PROMPT DE APERTURA

> **EL MÉTODO NO ESTÁ ACÁ: está en `docs/METODO_TRES_PISTAS.md`.** Territorios,
> el paso ⓪, cómo se pide algo de otro territorio. **Este prompt lo CITA.** *Antes
> el método viajaba adentro, y por eso había que reescribir el prompt entero cada
> sesión.*
>
> El estado: `2026-08-03-s84-estado-medido.md` · el método de S84:
> `…-s84-acta-del-metodo.md` · la letra que rige y la que murió:
> `…-s84-censo-de-enmiendas.md`.

---

# ⚠️ LO PRIMERO: S84 ESTÁ **PUBLICADA, NO FIRMADA**

**La pasada de gate no se hizo.** **Nueve OTAs esperan un ojo**, y **nada de S84
se hereda como hecho** (regla 80).

Sin ver: **los tres glifos** (candidato A elegido, **dibujo a 21px no**) ·
**`Boton` acento** y **`superficie="muro"`** · **Datos comerciales**, el aviso de
revisión, **Cuenta reordenada** · **la cura de Places** · **la pantalla de
documentos**.

> 🔴 **Y UNO QUE PUEDE REVERTIR UNA DECISIÓN, no solo pedir un retoque: LA
> RECUPERACIÓN POR CÓDIGO nunca se probó contra un correo real.** `verifyOtp`
> devuelve sesión **según el contrato**. **Si no da sesión utilizable, el camino
> se cae y el reparto vuelve a la mesa** — y con él, la decisión de que la
> recuperación entrara por OTA en vez de esperar la build.

---

# EL ORDEN DE S85 — y es honesto sobre por qué

### ① EL BURN-DOWN — **primera tarea de A, antes de cualquier orden de construcción**

**D-630, condición FIRMADA con su escalamiento.** Nace **como script**
(`scripts/burn-down.mjs`), no como conteo a mano.

**Por qué primero y no "cuando se pueda":** se declaró **tres sesiones seguidas**
sin pagarse, y no por desidia — **un conteo manual de 54 pantallas × 2 ejes
compite contra construir y pierde siempre**. *Convertirlo en script es lo que lo
saca de esa competencia para siempre.*

> **Y su escalamiento está firmado: si S85 cierra sin él, NO se re-declara — se
> escala.** Cuatro declaraciones sin pago **dejan de ser deuda de trabajo y pasan
> a ser de gobierno.**

### ② LA PASADA DE GATE DE S84 — **antes de construir nada nuevo**

**Nueve OTAs esperan un ojo, y si algo falla ahí cambia lo que S85 construye
encima.**

**Nota operativa que ahorra una confusión:** **los glifos viajan SIN
consumidor** —la celda no tiene ícono a propósito—, así que **se firman en la
galería, no en pantalla**. *Si se los busca montados, no aparecen.*

### ③ EL REDISEÑO — el foco firmado de S85

### ④ LA BUILD EAS 1.0.3 — **al FINAL de S85** *(fecha firmada por el founder)*

> **Su consecuencia, escrita para que no sorprenda: hasta entonces TODO VIVE EN
> UN SOLO TELÉFONO.**
>
> Y **tres cosas esperan ese tren**: **el reproductor del clip** (el clip sube y
> no se puede ver) · **las plantillas de correo** (llega en inglés, D-628) · **el
> reclutamiento** — *S79 declaró que al cierre el founder sale a reclutar, y
> reclutar es un segundo teléfono.*

---

# LO VIVO, CON SU DUEÑO

| ficha | qué | dueño |
|---|---|---|
| 🔴 **D-595** | **el GPS en paseo simultáneo** — `TAREA_TRACK_GPS`, `STORAGE_SESION` y `sesion` son **singulares por construcción**; y **terminar UNO de dos paseos apaga la captura de los DOS**. **Su seed es parte de la cura.** | la pista que toque el Durante |
| 🔴 **D-617** | sin build EAS 1.0.3 | ④ de arriba |
| 🟠 **D-627** | el `en` del escriba se genera y **no se persiste** a propósito | quien construya la ficha pública en inglés |
| 🟠 **D-633** | **tres copias** de países, **la tercera ya divergente** (23 · 23 · 30). El lector correcto **ya existe sin consumidor**: `get_paises_para_telefono()` | A |
| 🟠 **D-173** | la página pública del prestador vs *"el comprador nunca ve al seller"* | **founder** |

> **D-173 es distinta de las otras cuatro, y por eso va aparte: es la única letra
> que se sostiene por ACUMULACIÓN y no por firma.** Dos documentos firmados se
> contradicen y **nadie los ha enfrentado** — cada sesión que construye vitrina
> toma partido sin decirlo. *Empezar a dibujar ya es decidir.*

---

# LO QUE S84 DEJA COMO CRITERIO (no como trabajo)

- **Todo freno declara CONTRA QUÉ MIDIÓ** — un *"no se puede"* **no se descubre
  nunca**, porque nadie verifica por qué algo no se hizo.
- **Una lista de cierre que dice "todo adentro" cuando falta algo es el dato que
  después nadie vuelve a verificar.** *(De B, y lo pagó A en el bundle de
  cierre.)*
- **El mensaje de un guard es parte del guard** (candidata #21). *De los
  dieciocho frenos de S84, el único falso lo fabricó una verificación que
  funcionaba: dio rojo y mintió sobre por qué.*
- **Verificar una AUSENCIA es más difícil que verificar una presencia**, porque
  **nada falla cuando sobra**. Un `grep` en cero **con su porqué escrito** es una
  defensa; el mismo cero sin nadie que lo sostenga es una coincidencia (D-625).

---

# TRES COSAS OPERATIVAS

1. **`git fetch` antes de cualquier `--is-ancestor`.** `origin/main` tiene **forma
   de ref remoto y naturaleza de dato en caché**.
2. **Nunca `git diff --stat` entre puntas como preview de merge** — muestra como
   *borrado* el trabajo que la otra rama no tiene. Usar `git show --name-only`
   **por commit**.
3. **El exit se lee del COMANDO, jamás del pipe** (L-191, y aun así falló dos
   veces en S84 — candidata #18).
