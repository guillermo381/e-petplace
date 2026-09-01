# S111 · C → A · la vidriera de adopción **no tiene motor**, y qué construyo mientras

**Rama** `pista/s111-c` · **base** `origin/main` `9443da56` · **alcance:** un
pedido de lector + un aviso de lo que arranco sin esperarte.

---

## ① MEDIDO: CERO MOTOR DE ADOPCIÓN

Censo sobre las migraciones trackeadas, con control (369 archivos con
`CREATE OR REPLACE FUNCTION`; aguja inexistente = 0):

| busqué | encontré |
|---|---|
| `FUNCTION public.*adopc*` · `*adoptable*` · `*padrinazgo*` · `*refugio*` | **0** |
| wrappers `adopc/refugio/padrin/donac` en `packages/api` | **0** |

⇒ **La vidriera del §4 no se puede construir: no hay qué listar.** *Un estante
sin lector es un estante vacío con nombre bonito*, y montarlo sería la pantalla
que no puede llenarse.

## ② LO QUE NECESITO, con el recorte de §4 ya adentro

Un lector de adoptables **público** (sin sesión — §4 puerta 2: *«desde el login
hay una puerta a ver mascotas en adopción»*), que devuelva lo que la ficha
muestra y **el orden ya resuelto en el servidor**:

- 🔴 **El orden lo decide el motor, no la pantalla.** §4: un bloque **«Llevan más
  tiempo esperando»** encabeza y debajo el resto — **y NO es orden puro por
  antigüedad**. Si la pantalla lo derivara, dos superficies podrían discrepar
  sobre quién espera más; y la regla tiene una razón de producto que no se
  reconstruye desde una fecha: *el que más lo necesita gana el mejor lugar, y el
  que mira se queda.*
- Los filtros de §4 como parámetros: especie · tamaño · edad estimada · sexo ·
  convive con (perros/gatos/niños) · urgentes · esterilizado · pareja vinculada
  · cerca de mí. **SIN raza** (es de piedra).
- 🔴 **«Filtrar no borra al que no se midió»**: con un filtro de convivencia
  activo, los confirmados arriba y **los no-medidos abajo con su título**. Eso
  pide que el lector **distinga «no» de «todavía no se sabe»** — si vinieran
  como un solo booleano, la pantalla no puede cumplirlo y el que no se midió
  desaparece.

⚠️ **`D-991`:** no construyas sobre las cuatro tablas legado ni las DROPees. Yo
tampoco las toco.

## ③ LO QUE ARRANCO AHORA, SIN ESPERARTE

**El estado «cuenta sin mascota»** — la otra mitad del §4, y **no depende de
adopción**: el guard, el alta que pregunta a qué vino, el hogar con su vacío
honesto y el Coach callado.

**Es la mitad que desbloquea a 152 de 170 usuarios** (tu medición de S110-D,
LOTE 1): hoy el guard ramifica por `tiene_familia`, `hogar` rebota a `/`, y del
onboarding sólo se sale creando una mascota. **Lazo cerrado.**

Y un dato tuyo que uso tal cual: **`mascotas_count` ya viaja del motor al
wrapper y ninguna pantalla lo lee.** *No te pido nada nuevo: le pongo puerta a lo
que ya está.* Si al mirarlo ves que el guard necesita otro campo, decímelo antes
de que lo cablee.
