# S111-B → A · REPORTE FINAL de la pista B (`packages/ui`)

**Rama:** `pista/s111-b` · **HEAD:** `2c180d929860abd59f17c2695800c4ac88d2e93a`
**Base:** `4e04b2d5`

**ALCANCE (L-463) — 4 componentes nuevos + 2 hunks aditivos + este buzón:**
`packages/ui/src/components/{Convivencia,SenalesAdoptable,SelectorDestinoDonacion,EstadoSolicitudAdopcion}.tsx` ·
`packages/ui/src/index.ts` · `packages/ui/src/gallery/TokenGallery.tsx` ·
`docs/loop/buzon/S111-B-*.md`.
**Cero DDL · cero migraciones · cero `apps/` · cero `supabase/` · cero publish/OTA.**

---

## ① CONSTRUIDO — cuatro piezas, las cuatro publicadas y mirables

| pieza | la ley que carga adentro | rojo producido |
|---|---|---|
| **`Convivencia`** | §3 · tres estados; el tercero lleva su **voz OBLIGATORIA** | `TS2322` al estado mudo y al inventado; los 3 legales compilan |
| **`SenalesAdoptable`** | §3 · **no acepta coordenadas**; `tiempo_en_rescate` jamás es alarma | `TS2353` al `lat`/`lon`, `TS2322` a la señal inventada; las 4 legales compilan |
| **`SelectorDestinoDonacion`** | §7 · **`abierta` es una elección, no un hueco**; `null ≠ abierta` | `TS2322` al destino sin id **y al `{tipo:'donacion'}` de la despensa**; los 3 legales compilan |
| **`EstadoSolicitudAdopcion`** | §5 · **`declinada` es DESVÍO y es NEUTRO**; el mapeo vive adentro | `TS2322` al estado inventado; los 4 legales compilan |

**Gates, los tres, después de cada pieza:** `typecheck` **0** · `verify:contrast`
**391 pares / 0 fallos** (cero pares nuevos: sólo tokens existentes) ·
`verify:diseno` **VERDE, 62 reglas** — el mismo número que el baseline que medí
**antes** de tocar, así que el verde no es «no vi», es «no cambió».

**Reuso, no invención:** `Insignia`, `ChipEntidad` y `EscaleraEstados` sirvieron
tal cual. Cero chip nuevo, cero escalera nueva, cero token nuevo, cero hex.
`capa.comunidad` resuelve `pink` en claro/oscuro y `rose` en memorial **sin una
sola rama** — la ley 10 hecha token.

---

## ② LO QUE NO SE CONSTRUYÓ, con su razón — y ninguna es «no llegué»

**a) La salud del adoptable → ESTACIONADA** (ficha aparte:
`S111-B-para-A-estacionamiento-salud-del-adoptable.md`). §3 pide *«honestidad de
semáforo»* y no define audiencia. **Fail-closed:** no construí la pieza, y
`SemaforoSanitario` **no se toca ni se reusa** — su tipo ya lo impide.

**b) El hilo de MENSAJES de §5 → FRENADO, no pendiente.** No existe mensajería
entre cuentas (medición de la pista E: 0 wrappers de 110, 0 rutas de 174;
`PORTAL_PRESTADOR` §6.4.7 la excluye por diseño) y **su activador está
estacionado esperando firma**. Construir su piel sería construir encima del
freno. **Sí construí la mitad que no depende del canal** — los estados —, y la
banda `en_conversacion` **queda declarada como inalcanzable en el encabezado de
la pieza**: *una banda que nunca se pinta no se distingue de una que todavía no
le tocó.*

**c) 🔴 La «pieza de recurrentes» del padrinazgo → NO SE CONSTRUYE, Y NO ES
DEUDA: §6 lo prohíbe.** Literal: *«Su puerta de cancelación es la de la casa:
Pagos recurrentes y suscripciones, en Cuenta. El padrinazgo **no construye la
suya**.»* **Y esa puerta EXISTE, medido:**
`apps/cliente/src/app/(tabs)/cuenta/recurrentes.tsx`. ⇒ el trabajo es que el
padrinazgo ENTRE ahí, y eso es de `apps/*` (C), no mío. **Una pieza nueva de
recurrentes en `packages/ui` habría sido una violación de la letra con forma de
entrega.**

**d) Composición de pantalla → de C, no mía.** El bloque «Llevan más tiempo
esperando» con su porqué, el orden que no borra al no-medido, los filtros sin
raza, el botón apadrinar junto a las fotos, la canasta del refugio y el Home del
publicador con su contador **son composición**, y mi territorio son las piezas.
Las que necesitan ya existen: `FiltroPills`, `TarjetaProducto`, `Badge`.
`Badge` sirve al contador de §9 **y su regla calza sola**: no dibuja nada con
`n ≤ 0`, que es *el contador que tiene que poder llegar a cero*.

---

## ③ LO QUE ESPERA FIRMA O AUTORIZACIÓN

1. **⚠️ Las cuatro piezas están ENTREGADAS, NO MONTADAS.** Viven en la galería;
   **ninguna pantalla las monta.** Su **gate en dispositivo (Ley 9) es del
   founder y está PENDIENTE** — la web no cierra gates de componentes.
2. **La salud del adoptable** — decisión de producto, en el estacionamiento con
   opciones, mi voto y su costo.
3. **Una ficha para numerar** (regla 89, va en `S111-B-para-A.md`): *el semáforo
   de guardería no puede servir a adopción, y el bloqueo es del TIPO*. Es el caso
   limpio de `D-976` — trasplantar un criterio correcto a otra pregunta.

**Qué mirar primero en el gate, si el tiempo alcanza para una sola cosa:** la
segunda tarjeta de `Convivencia` en la galería — el rescate de seis días, todo
desconocido. **Si ese caso se lee como una ficha rota o vacía, la pieza falla su
única ley**, y es el caso que la letra dice que cuesta un hogar.
