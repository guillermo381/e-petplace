# S111 · C → MESA · REPORTE FINAL DE LA PISTA C

**Rama:** `pista/s111-c` — **A mergea la rama entera** (su HEAD).
**Alcance:** `apps/cliente` + `docs/loop`. **Cero `packages/`, cero `supabase/`,
cero `apps/prestador`.**

---

## ✅ CONSTRUIDO — y dónde

| qué | dónde |
|---|---|
| **`D-990` cerrada** · la familia se entera de que no se pudo recoger | `(tabs)/hogar/guarderia.tsx` |
| **El hogar sin nadie deja de ser un callejón** · su vacío gana camino | `(tabs)/hogar/index.tsx` |
| 5 claves nuevas, espejo `es`/`en` completo | `i18n/{es,en}.ts` |

**Verificado:** typecheck cliente y prestador **en 0** · `verify:diseno` **VERDE
con 62 reglas** · `verify:sin-byte-nul` verde · **typecheck con control
negativo** (una clave inexistente rompe sobre mi archivo y vuelve a verde) ·
árbol limpio.

## 📝 ESCRITO — los recorridos, antes de construir

`docs/loop/S111-C-RECORRIDOS.md`: los **tres bloques** en voz de usuario, con
sus caminos tristes. *Cuando el motor llegue, la construcción no va a tener que
inventar el QUÉ.*

## 🅿️ ESTACIONADO — una sola, con voto y números

**¿«quiero adoptar» crea la familia vacía?** (a) sí · (b) no crea nada.
**Voto: (a)** — con **(b)**, 24 superficies de `apps/cliente` que cuelgan de
`familia_id` tendrían que aprender a tolerar `null`, y **ninguna lo tolera hoy**.
Detalle en `S111-C-para-A-ESTACIONAMIENTO.md`.

## 🔴 FRENADO — todo por lo mismo, y no es de esta pista

**La vidriera pública · el portal del publicador · el arco del cliente
(solicitud, conversación, acta, transferencia, padrinazgo, donación).**

**Motivo único, medido:** **cero motor de adopción** — 0 funciones
`adopc*`/`adoptable*`/`padrinazgo*`/`refugio*` sobre **369 migraciones** con
`CREATE FUNCTION`, y 0 wrappers en `packages/api`.

⚠️ **Y las piezas de las otras pistas YA ESTÁN esperando:** `Convivencia` de B
—los tres estados, con el tercero con voz propia— y `packages/mensajeria` de D.
*Las dos existen y ninguna tiene de qué hablar todavía.* **El motor es el único
eslabón que falta para que tres bloques arranquen a la vez.**

## ⏳ LO QUE ESPERA AL FOUNDER

1. **El recorrido en aparato — nada de guardería se ejerció.** La veda de
   publish se sostiene: entrega → merge → APK de nube → su recorrido con dos
   animales de dueños distintos y los dos lados → recién ahí publish.
2. **El día de guardería lo opera el TITULAR**, no el cuidador empleado
   (gate `user_gestiona_prestador`). Decisión de producto, no defecto — y la
   razón técnica de A la cierra: *dos gates distintos en un acto único
   autorizan la mitad de una transacción.*
3. **El estacionamiento de arriba**, si quiere decidirlo él en vez de la mesa.

## 🧭 LO QUE ESTA PISTA APRENDIÓ, y sirve fuera de ella

**Una ficha que declara un hueco se mide contra el objeto antes de tomarla,
aunque la haya escrito uno mismo.** `D-990` decía *«nadie lo construyó»* y media
pieza existía desde S107-C. Era verdadera desde mi perímetro de S110 —que
excluía el lado familia— y **falsa como descripción del producto**. *Un hueco
entre dos perímetros se ve mal desde los dos lados **incluso después de
elevarlo**: quien lo eleva describe su mitad, no el hueco.*

Y su gemela chica, cobrada dos veces el mismo día: **un censo por texto lee prosa
como si fuera código.** `mascotas_count` daba 1 consumidor y **ese 1 era un
comentario que había escrito yo media hora antes.**
