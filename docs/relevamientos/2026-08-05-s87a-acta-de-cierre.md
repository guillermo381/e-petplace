# S87-A · ACTA DE CIERRE — EL MOTOR DE NOTIFICACIONES

> **S87-FOCO CERRADO POR PALABRA DEL FOUNDER (5 Ago 2026).**
> **El criterio de éxito, literal y cumplido:**
> ## **El motor existe, sabe callarse, y nunca habló.**
>
> Cero mensajes enviados · los cinco gates cortando con su rojo producido · el
> lector de sombra contestando las tres preguntas ante el ojo del founder.

---

## 1. EL ARCO, en una línea

**Se abrió a medir una letra de hace catorce sesiones y se descubrió que la
premisa madre era falsa.** No había que construir un motor de cero: había que
**ponerle puerta, ley y memoria a algo que ya estaba escribiendo sin que nadie
lo supiera.**

---

## 2. EL HALLAZGO QUE REORDENÓ TODO

`MODELO_NOTIFICACIONES` v0 y **D-475** decían: *"las tres capas en CERO"*.

**Medido:** **siete funciones DEFINER vivas** ya insertaban intenciones —
`_notificar_dueño_prestador` · `_trg_completar_pendiente_registro` ·
`cerrar_y_renovar_planes` · `cleanup_pendientes_vencidos` ·
`fijar_fecha_procedimiento` · `vencer_paquetes_salidas` ·
`vencer_programas_adiestramiento` — **sin consultar ninguno de los cinco gates
de §5**, y **cero código las leía**.

> ### EL SISTEMA ESTABA EN UN MODO SOMBRA — PERO ACCIDENTAL.
> **La diferencia entre eso y el §10.2 del propio doc no es técnica: es que
> nadie lo sabía.**
>
> **Y la consecuencia que ordenó la sesión entera:** *si se conectaba un
> transporte a lo que ya estaba escrito, salía sin un solo gate.* ⇒ **los gates
> y la cura del contrato pasaron de "trabajo del lote" a PRECONDICIÓN**
> (adjudicación del founder).

**La línea que salvó al doc fue suya:** §13 decía *"el schema: se releva lo vivo
antes — **verificar, no asumir**"*. **Cobró catorce sesiones después.**

---

## 3. LO CONSTRUIDO — el Lote 1, entero

| pieza | qué quedó |
|---|---|
| **① catálogo** | 7 categorías · **37 tipos** · `apagable_existencia` en la CATEGORÍA (la letra de salud hecha estructura) · `en_sombra` por default |
| **③ contrato** | PK `(user_id, categoría, canal)` · el default **dejó de ser constante y pasó a ser función del catálogo** · trigger que honra la letra firmada |
| **② puerta** | `registrar_intencion_notificacion` con **los cinco gates de §5** · dedup · estados · auditoría con `evento_id` |
| **⑤ lector** | `leer_sombra_notificaciones` — tres preguntas por fila, en voz humana, solo admin |
| **migración** | **11 avisos en 7 funciones**, uno a uno, con su par |
| **puerta trasera** | `notificaciones` de **solo lectura**, con trigger que rebota y su rojo producido |

**Medición final:** productores directos de `notificaciones` = **NINGUNA** ·
tipos fuera de sombra = **0** · residuo = **0** · 26 filas de legado intactas.

### LA LETRA FIRMADA QUE GOBIERNA LA PIEZA ③

> ## **«Elige por dónde le llegan, no si le llegan.»**

Vive en un **trigger**, no en la pantalla — *una autorización que decide el
cliente es decorativa* (D-654). Y su par discriminador prueba la letra **exacta**:
`categoria_no_apagable` al apagar la existencia · **ACEPTA** apagar el canal push.
*Sin el verde, el rojo solo probaba que el trigger era estricto; con los dos,
prueba que es estricto en lo correcto.*

---

## 4. LOS CUATRO HALLAZGOS QUE NINGÚN GATE HABRÍA CAZADO

**Los cuatro comparten una cosa: habrían corrido VERDE.**

1. **`sistema` era un cajón de sastre.** Tres funciones lo usaban para "tu plan
   se renueva", "tu paquete vence", "tu programa vence" — y `sistema` mapeaba a
   `seguridad_cuenta`, **el único sobreviviente del memorial**. *Una familia en
   duelo habría recibido «tu paquete de salidas vence pronto».* **El defecto
   vivía en el DATO, no en el código: la categoría le mentía al gate.** Se
   encontró **leyendo los siete INSERT antes de tocar el primero**.
2. **El censo contó contenedores y reportó contenido.** Son **11 avisos en 6
   funciones**, no 6 — `cerrar_y_renovar_planes` sola tiene cuatro. *Un censo
   así subcuenta SIEMPRE, y en silencio: el número se ve razonable.*
3. **`CASE i.motivo WHEN NULL` nunca matchea.** El lector dejaba **sin respuesta
   justo a las filas que PASABAN** — una de las tres preguntas que existe para
   contestar, en blanco. **Lo destapó su propio fixture.**
4. **`user_tiene_acceso_a_mascota` toma UN argumento** y resuelve contra
   `auth.uid()` — el **caller**, que en la puerta es una DEFINER del motor y
   **no el destinatario**. *Habría evaluado a la persona equivocada.*

---

## 5. LOS DOS FRENOS QUE SALVARON TRABAJO AJENO

**① El 🔴 de C sobre el HOY de recepción NO era del producto: era de mi fixture.**
`empleado_tiene_rol` hace JOIN con `empleado_roles`, y mi seed por SQL nunca la
tocó. Par: `42501 sin_acceso` → `OK`. **Retirado formalmente con su causa.**

> *Un rojo que entra al canon por error acusa al producto de un defecto que no
> tiene, y sobrevive a quien lo escribió.* **Si se numeraba, hoy había una ficha
> 🔴 contra una función sana.**

**② El primer caso de «sin acceso» usó a Thor** — a quien la recepción alcanza
**legítimamente** por Aurora (3 accesos vivos). **El gate hizo bien; el caso
estaba mal.**

> **Un rojo que no aparece no siempre acusa al guard.** *Si lo daba por defecto y
> "arreglaba" el gate, rompía un camino correcto para hacer pasar un test malo.*

**Y una tercera, chica y del mismo aire:** un `assert` frenó un `replace` sobre
`'sistema'` porque había **dos** ocurrencias — una en el **comentario** que
describía D-103 y otra en el **argumento**. *Un reemplazo ciego habría dejado el
código bien y el comentario mintiendo al revés.*

---

## 6. LO QUE SE PAGÓ Y LO QUE NACIÓ

**✅ D-103 PAGADA — 75 sesiones después.** `prestador_en_revision` con su
categoría. **La nota que importa es por qué pudo pagarse:** cuando se escribió,
agregar un tipo era *ampliar un CHECK*; con el catálogo pasó a ser *una fila*.
**No se abarató por prioridad: se abarató porque cambió la estructura debajo.**
Y estaba **citada en el comentario del código, en el lugar exacto donde dolía**.

**Nacieron tres fichas:**

- **D-655** 🟠 la última milla de los assets — **cerrada en su incidente**
  (era DNS del emulador; el CDN sin cargo) **y abierta en su clase**: *el paso ⓪
  mide qué se SIRVE, nadie mide qué BAJA.* Que la causa fuera ambiental **no le
  devuelve al método una verificación que nunca tuvo.**
- **D-656** 🟠 un toque accidental al wizard de cuenta comercial **quema a la
  persona para siempre** (B.2 es de una sola vez). **No hay escalación** — el
  servidor está bien acotado; el defecto es la irreversibilidad. Cura firmada.
- **D-657** 🔴 **el plan se sigue cobrando después del memorial** — y el motor de
  avisos de S87 estaba por volver ese cobro **silencioso**.
  > **El gate del memorial —que es correcto— es lo que APAGA LA ÚNICA SEÑAL.**
  > *Antes de S87 el cobro era silencioso por omisión; después, por diseño.*
  > **Curar bien una cosa empeoró otra, y solo se ve mirando los dos motores.**

---

## 7. LAS LETRAS FIRMADAS EN LA SESIÓN

- **«Elige por dónde le llegan, no si le llegan.»** (§6, con su mitad mecánica).
- **`saldo_pagado` FIRMADA** — de propuesta de S80 a categoría con **6
  habitantes**.
- **Ante la duda entre categoría semánticamente limpia y categoría protectora,
  PROTEGE** — *un aviso no silenciable se puede relajar después; un cobro
  sorpresa no se deshace.*
- **El mismo hecho a dos audiencias son DOS tipos**, no uno con destinatario
  variable — *uno variable obliga a preferencias, techo y sombra a preguntar
  «¿cuál?» en cada consulta.*
- **La cláusula de S80 NO rige en memorial** — *fue escrita para quien **eligió**
  no usar; una familia en duelo no eligió nada.* **Enmendada en sus DOS casas**
  (`POLITICAS` P16 + `MODELO_FINANCIERO` §2), no solo en la ficha:
  **dos letras contradiciéndose es peor que una equivocada** (precedente del
  magenta, S83).
- **Ley de censo:** *un censo declara si cuenta CONTENEDORES o CONTENIDO.*
- **Ley de seed:** *una cuenta sembrada por SQL no está creada hasta que el
  camino real la concede* — **tokens (identidad) y `empleado_roles` (membresía)
  son dos capas del mismo hueco.**
- **Ley de privilegios (S87):** *en un catálogo, el REVOKE nombra a
  `authenticated` TAMBIÉN* — **`anon` no es el único que hereda de más.**

---

## 8. DEPÓSITOS

- `MODELO_NOTIFICACIONES` **v0 → v1** (§0bis lo medido · §3 el mapeo · §5 cómo se
  escriben los gates contra lo vivo · §6 los tres choques + la letra de salud ·
  §13bis las candidatas).
- **Dos láminas FIRMADAS:** `LAMINA_PREFERENCIAS_NOTIFICACIONES.md` ·
  `LAMINA_BARRA_DE_TRES.md` (C arranca contra ésta).
- **Diseños:** el del Lote 1 · el de la pieza ④ con su gobierno del fusible.
- **Fixtures versionados:** la sesión de sombra · los pares de migración · el de
  la puerta.
- **Dos candidatas del gate:** el **Homenaje** (excepción invitada al silencio) y
  la **reserva sobre `comercial`**, fechada y con la respuesta de mesa al lado.
- **Tres credenciales** de prueba, verificadas **por login real**.

---

## 9. OPERATIVO

**13 commits** (`16c11fb` → `246fdf8`), todos pusheados; `main` limpio ·
**14 migraciones** aplicadas y registradas, **76(g) declarada en cada una**
(RIGE solo en la del contrato: 4 filas migradas, legacy 5 intacta) · **reversas
escritas ANTES** en todas, y **la del contrato declarada NO LIMPIA** (*revertir
REINSTALA los dos defectos*) · **`gen:types` en sync** · **typechecks
`api`/`cliente`/`prestador` VERDES** · un **re-publish** del prestador
(group `8afe85b3`, ancla `9e83b6d`, `verify-ota` verde).

**Contadores re-medidos contra el objeto (L-141):** migraciones en el repo =
**157** (el canon dice 138) · deuda más alta = **D-657**.

---

## 10. LO QUE NO SE HIZO, sin maquillaje

- **El transporte no existe** — y es correcto: era el Lote 2.
- **④ kill switch + techo duro:** **diseñado y firmado, NO construido.**
- **D-657:** ficha con dirección firmada, **cura sin construir**.
- **El binario 1.0.3 no puede recibir push** — anterior a su propia preparación.
- **D-475 sigue con su texto original en la ficha.** El censo la corrigió en
  `MODELO_NOTIFICACIONES` §0bis, pero su ficha propia todavía dice *"las tres
  capas en cero"*. **Es el defecto que D-103 nombró: un dato viejo diciendo
  «no».** ⇒ **primer acto de la mesa que abra el Lote 2** (brief S88).
