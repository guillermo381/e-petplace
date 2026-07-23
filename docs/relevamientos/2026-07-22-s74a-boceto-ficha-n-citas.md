# S74-A · BOCETO M1 — LA FICHA DE MASCOTA CON N CITAS ACTIVAS
# ❌ **SUPERADO — LA SUPERFICIE ERA OTRA (decisión de mesa S74, confirmada)**

> **El boceto vigente es `2026-07-22-s74a-boceto-ponte-al-dia-n-citas.md`.**
> Este queda como REGISTRO DE MÉTODO: es el precio de bocetear sobre una
> superficie asumida en vez de esperar el literal — y por eso el propio
> boceto abría declarando la suposición (§0), que es lo que permitió
> corregirlo barato.

> **La mesa corrigió (S74): el founder dictó la mejora caminando el ítem 4 —
> la franja "Ver su cita ›" de PONTE AL DÍA con las por-coordinar reales.**
> **El argumento que lo cierra: en la ficha la regla sería un NO-OP** (ya
> muestra UNA sola cita: el colapso por servicio no cambiaría nada). **Este
> boceto NO se construye; se rehace sobre Ponte al día cuando el founder
> confirme.** Lo que SÍ sobrevive de acá: el tope + `PieRevelar`, la regla de
> que **lo colapsado no se cuenta en el «+N»** (L-139) y el contrato sin
> pedido de motor. **Lo que cambia de raíz: el borde de las `por_coordinar`
> pasa de nota al pie a CENTRO del problema** — en Ponte al día son las
> protagonistas, no tienen tiempo, y hay que decidir cómo conviven con las
> ordenadas por tiempo.

> **BOCETO. CERO código hasta la vara de B + el gate.** Letra: el corolario
> `DISEÑO_EXPERIENCIA` §10ter.1 (dictado founder S74, "la próxima EN EL
> TIEMPO"). Fuentes leídas: `hogar/index.tsx:772-818` (la ficha) ·
> `hogar.ts:186-215` (el criterio actual) · `citasMascota.ts` (el orden del
> lector) · `FichaMascotaHogar` (packages/ui).
> **PREGUNTA ABIERTA AL FOUNDER, no resuelta acá:** el relevamiento halló
> **tres** superficies con N citas y el dictado dice "la franja" — **este
> boceto asume la FICHA DE MASCOTA** (la única que hoy muestra UNA sola).
> Si el founder apuntaba a otra, el boceto se rehace: es composición, y
> hacerlo sobre la superficie equivocada es trabajo perdido.

## 0 · Tesis y estado actual

**TESIS:** *la ficha dice todo lo que a esta mascota le está por pasar — no
solo lo primero.*

**HOY:** la ficha muestra **UNA** — `proximaCitaMono` = la primera
`confirmada` o hold vigente sobre un `.order('fecha' asc).limit(10)`
(`hogar.ts:207`), o sea **ya es "la próxima en el tiempo"**: la letra del
founder **no contradice el criterio, lo EXTIENDE de 1 a N**.

## 1 · Las 7 preguntas §1c (abreviadas — el detalle donde cambia algo)

1. **Trabajo:** listar N estados pasivos dentro de una tarjeta ⇒ **líneas de
   dato**, jamás celdas tapeables (la ficha ENTERA ya navega al perfil: dos
   destinos en una tarjeta es el error que 19.7 corrige).
2. **¿Existe?** Sí: `FichaMascotaHogar` ya porta `proximaCitaMono`. **Cero
   componente nuevo** — la enmienda es de PROP (de una línea a una lista).
3. **La casa:** el vecino directo es Ponte al día (N filas con tope 3 +
   `PieRevelar`) y el hub `/citas/[mascotaId]` (hero + acordeón). La ficha es
   más chica que ambos ⇒ **su tope es menor** (ver §2).
4. **Tesis servida:** cada línea responde "qué le viene". Lo que no: fuera.
5. **Capa/dosis:** dueño, dosis alta; **cero acento nuevo** — las líneas son
   metadata mono (Ley 3), el acento sigue siendo el de la ficha.
6. **Temas/es-en/estados:** §3.
7. **Chanel:** se quita **el nombre del negocio** en la línea (vive en el hub,
   y repetirlo por línea llena la ficha de texto que no decide nada).

## 2 · La composición (de arriba a abajo, dentro de la ficha)

```
[avatar]  Nombre
          la voz del estado (sin sujeto — ficha.*)
          ── las citas activas ──
          14 ago · 10:30   Paseo
          16 ago · 09:00   Baño y corte
          (+2 más)                     ← PieRevelar SOLO si N > 2
```

- **TOPE 2 + `PieRevelar`** (la ficha es una tarjeta de resumen, no una
  lista): el tercer renglón ya compite con la voz del estado. *Alternativa a
  gatear: tope 3 igualando Ponte al día — se decide sobre píxeles.*
- **Orden:** por fecha ascendente = **la próxima primero** (el criterio que la
  letra firma).
- **AGRUPACIÓN POR SERVICIO (la mitad nueva de la letra):** si dos o más citas
  comparten `tipo_servicio`, **solo sobrevive la próxima de ese servicio**; las
  demás **no se cuentan en el «+N»** (si el «+N» las contara, el número
  prometería filas que la superficie decidió no mostrar — verosímil-falso,
  L-139). *Consecuencia declarada: un plan L-V de 22 paseos aporta UNA línea,
  que es exactamente lo que la letra busca.*
- **El nombre de cada cita** lo gobierna **§10ter** (voz del comprable; y con
  `procedimiento`, la descripción del presupuesto — con su «+N» de ítems, que
  es OTRO «+N»: ver la advertencia de composición del corolario).

## 3 · Estados declarados

- **0 citas activas:** la sección **no se monta** (regla de existencia — la
  ficha vuelve a su forma de hoy; la firma es la desaparición).
- **1 cita:** una línea, **sin `PieRevelar`** (nada apagado).
- **`por_coordinar` (sin fecha):** **borde declarado, decisión de mesa
  pendiente** — no entra en "la próxima en el tiempo" porque no tiene tiempo.
  Propuesta del boceto: **NO va en esta lista** (ya vive en Ponte al día, que
  es su casa y la muestra con acción); si el founder la quiere acá, va
  PRIMERO con su voz propia ("falta coordinar"), jamás mezclada por fecha.
- **Cargando / error:** los de la ficha (no cambian) — el error **jamás** se
  pinta como "sin citas" (Ley 13).
- **Memorial:** la mascota memorial no tiene citas activas por motor
  (`mascotasElegibles`) ⇒ el estado 0 la cubre sola.

## 4 · Contrato de datos M4

**Se renderiza por línea:** `fecha` (mono, `fechaCortaMono`) · `hora` (mono,
si existe) · la **voz del servicio** (§10ter).
**Se DESCARTA a propósito:** el negocio (Chanel §1.7) · el precio (jamás en
una superficie de resumen) · `estado` (la ficha muestra lo que VIENE; el
matiz hold/firme vive en el hub) · `atencion_id` (el "en vivo" es de
`CitaEnVivo`, otra zona).
**Pedido de motor: NINGUNO.** `obtenerEstadoHogar` ya trae `limit(10)` por
hogar y `tipo_servicio` viaja en el shape — **la agrupación y el tope son de
pantalla**. *(Y el arranque no gana requests: D-497 intacta.)*

## 5 · Pasada M5

19.6 `PieRevelar` con el número ✓ · Ley 3 fechas en mono, voz del servicio del
diccionario ✓ · Ley 13 error≠vacío ✓ · regla de existencia ✓ · §10ter.1
(orden y agrupación) ✓ · cero acento nuevo (Ley 5) ✓ · sin campos de texto ⇒
L-162 no aplica ✓.

**Lo que este boceto NO decide (va al gate):** el tope 2-vs-3 · el destino de
las `por_coordinar` · y **si la superficie es esta** (§0).
