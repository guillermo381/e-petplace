# S84 · PROMPT DE APERTURA — de arquitecto a arquitecto

> Esto no es un estado: es lo que yo sé después de conducir S83 y que no vas a
> encontrar leyendo el repo. El estado está en
> `2026-08-01-s83-estado-medido.md`; el método, en `…-s83-acta-del-metodo.md`;
> la letra que rige y la que murió, en `…-s83-censo-de-enmiendas.md`. **Leelos —
> pero leé esto primero.**

---

## EL FOCO — palabra del founder

**S84 deja LISTO TODO EL PERFIL: vitrina, seguridad, y todo el eje de Cuenta.**
Ése es el objetivo y **no se dispersa**.

**Y S84 tiene que dejar preparado a S85, que entra al PULIDO FINO DEL DISEÑO.**
Eso cambia cómo conviene trabajar: lo que dejes a medias en estructura, S85 lo
va a encontrar cuando ya no sea momento de discutir estructura.

---

## LO QUE ARRANCA LA SESIÓN, en este orden

### 1. El resultado del experimento de dos archivos
**El founder lo está mirando ahora** (va en el OTA `19f8b87c`, ancla `70ffaeb`).

- **Si sale limpio:** se barren las **71** restantes → **el glow aparece** y **el
  agua vuelve a UNA sola monta** (hoy se monta 65 veces curando el síntoma de que
  el plano de abajo no se ve).
- **Si se ensucia:** **se revierte con dos líneas.**

**No arranques otra cosa antes de esto**: decide un barrido de 71 pantallas.

### 2. La estructura del perfil — firmada por el founder sobre el modelo de Kaxo/Fluvi
- **LA VITRINA** = "Tu perfil", con **espejo *"Así te ven"***, **portada** y
  **galería**.
- **CUENTA con secciones que NOMBRAN EL OBJETO:** Seguridad · Apariencia ·
  Notificaciones · Sesión · Eliminar cuenta. **"Nombre y acceso" MUERE.**
- **Los datos legales/fiscales que ya existen** se acomodan, no se reinventan.

### 3. 🔴 LA PRIMERA DECISIÓN NO ES DE DISEÑO: **D-173**
`PORTAL_PRESTADOR` §4.4 (**decisión cerrada S20**) le da al prestador **página
pública con dominio propio**, activo del **Día 90**. El TDR de Portal Sellers
declara como principio fundacional que **"el comprador nunca ve ni interactúa con
el seller directamente"**.

**Son incompatibles como están escritos.** Es **firma del founder**, y **puede
resolverse distinto para prestador y para seller** — pero eso también hay que
decidirlo. **Empezar a dibujar la vitrina ES tomar partido**: que sea a
propósito.

### 4. EL ORDEN QUE C MIDIÓ Y NO SE PUEDE INVERTIR
> **La ficha pública se diseña PRIMERO. El espejo *"Así te ven"* es su SEGUNDO
> consumidor.**

**Al revés estarías inventando cómo te ven en vez de mostrarlo.** Y hay un dato
duro que lo respalda: **"la ficha del prestador" NO EXISTE como componente** — el
cliente pinta con `Celda` genérica. **No hay pieza que reusar: hay una que
crear.**

---

## LO QUE **NO** SE RE-DISCUTE (heredado y firmado)

Los **ocho slots** · **un tinte por casa en los dos temas** · **el glow
dark-only en las dos** · **la pata en teal** · **el agua entera** · **el tercer
verbo (CUENTA)** · **el método** (UI real sin cablear → gate → cableado; lotes,
no instrucciones sueltas) · **la regla de las piezas**.

*Detalle y literal: el censo de enmiendas.* **Lo único abierto de esa lista: el
agua entera choca con la LEY 4** (una silueta entera identifica) — **vuelve a la
mesa, no está resuelto.**

---

## LOS PENDIENTES CON DUEÑO

| | |
|---|---|
| **EncuadreFoto** | componente + **142 líneas** + copy al namespace `ui` + **4 consumidores** *(tamaño reportado por la mesa; A no lo verificó)* |
| **El rótulo "Nombre y acceso"** | resuelto por el founder: **va el modelo Kaxo** |
| **El copy del Perfil** | fuera del riel i18n |
| **El slug** | **no existe columna**, y `ciudad+nombre` no sirve: no es único **y el nombre es editable** — un rename rompe la URL **y el SEO que la propia letra promete** |
| **Las insignias** | certificación · Fundador · Familia G, **sin modelo de dato** |
| **El ⑥ de C33** | si el founder no llegó a probarlo |
| **`text.tertiary`** | **D-605/D-606**, con tamaño medido: 4 grupos, prioridad ① ya pagada |

---

## LO QUE YO LE DIRÍA AL ARQUITECTO DE S84 — en primera persona

**Cerrá el circuito hasta la pantalla antes de pedir una firma.** El founder
**firmó el glow tres veces** y nunca había llegado a una pantalla. **Un gate que
no aterriza no es un gate: es una consulta** — y repetirla desgasta la confianza
en el instrumento. Me pasó, y con razón.

**Mandá lotes.** La instrucción de a una fue inercia de S82 y **en este contexto
está mal**: sin usuarios y sin lógica tocada, **el costo de equivocarse es un
OTA**. Se construye todo, se publica una vez, el founder mira una vez. **El
recurso escaso no es el commit: es su atención.**

**El craft no viene con la estructura.** Mandé a cablear el Perfil con el orden
firmado y sin ordenar el craft de sus campos: **seis defectos**. Firmá el orden
**y ordená los detalles de cada campo por separado**, o vas a entregar una
pantalla correcta y vacía.

**Confiá en la medición de la pista sobre tu premisa.** Me frenaron muchas veces
y **cada vez que hubo choque entre lo que yo afirmaba y lo que la pista medía,
tenía razón la medición** — los 31 commits, el 54/50, las dos promociones, el
`656b17e` que "no estaba". *(No tengo el conteo exacto medido: lo que sí está
registrado es que ninguna vez ganó la premisa.)*

**Y el founder tiene otros dos productos —Kaxo y Fluvi— donde ya resolvió cosas
mejor.** El modelo de la vitrina salió de ahí. **Preguntale por referencias antes
de diseñar de cero.**

---

## TRES COSAS OPERATIVAS QUE TE AHORRAN UNA VUELTA

1. **`git fetch` antes de cualquier `--is-ancestor`.** `origin/main` **tiene la
   forma de un ref remoto y la naturaleza de un dato en caché**. Frenó un publish
   en S83 — y la cura que yo había escrito **tenía el mismo agujero que la
   enfermedad**.
2. **Nunca uses `git diff --stat` entre puntas como preview de un merge.** Usa el
   **vocabulario del daño** (`−44` en un archivo que acabás de escribir) y
   **frenó dos merges legítimos**. Lo correcto: `git show --name-only` **por
   commit**.
3. **La veda funciona si alguien la conduce.** En S83 la abrió la pista A sin
   esperar a la mesa, pidió confirmación **fresca** y **verificó el group antes
   de declarar cerrado**. **Los ocho OTAs salieron con ancla limpia.** Si nadie
   tiene ese deber asignado, vuelve a fallar — **D-609 sigue abierta y es del
   lado de la mesa**.

---

## EL RECORDATORIO INCÓMODO

**El eje COMPOSICIÓN de la regla 81 sigue sin tabla, por segunda sesión
seguida.** El mapa de familias **no lo reemplaza** — mide anatomía. **Si S84
cierra sin él, es la tercera.**
