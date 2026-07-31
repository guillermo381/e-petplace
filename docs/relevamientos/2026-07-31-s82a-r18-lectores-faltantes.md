# S82-A r18 — Los dos huecos de lector, rellenados

**Fecha:** 31-jul-2026 · **Pista:** A · **Territorio:** `packages/api` + DB
**Origen:** dos mediciones de C, sin rellenar.

---

## 1 · Adiestramiento no tenía lector público de oferta

### El hueco, confirmado por medición
El único lector era `obtenerOfertaAdiestramientoPropia(prestadorId)` —
**keyed por el prestador, que es justo el dato que el dueño NO conoce en
ese paso**. La gramática canónica (`DISEÑO_EXPERIENCIA` §11) manda
MASCOTA → QUÉ → DÍA → HORA → **QUIÉN** → PAGAR: el prestador aparece
*después*. Un lector que lo exige no sirve para la pantalla de entrada.

**Y la pantalla ya lo había declarado**, en su propio comentario:

> *"el precio de esta pantalla NO EXISTE todavía… `PieReserva` acepta null
> y NO dibuja nada, así que el pie sale con su CTA y SIN INVENTAR MONTO.
> Un 'desde $0' sería exactamente el verosímil-falso que L-139 prohíbe."*

Es un hueco **declarado con honestidad**, no uno olvidado. Lo que faltaba
era el dato, no la disciplina.

### 🔎 HALLAZGO: los dos moldes NO coinciden entre sí

El pedido nombraba dos moldes. Leídos, **difieren en algo que importa**:

| molde | cómo lee | ¿aplica el gate 7.13? |
|---|---|---|
| `obtenerOfertaPaseo` | RPC `SECURITY DEFINER` | **SÍ** — `cuentas_comerciales.estado='activa'` |
| `obtenerOfertaGroomingPublica` | lectura por RLS | **NO**, y lo declara en su comentario |

La RLS de `cuentas_comerciales` es **solo-owner**, así que el criterio
*solo puede* vivir server-side: por eso el que lee por RLS no puede
replicarlo aunque quiera. **Se siguió el molde del paseo** —el que no
tiene el caveat—, que además es lo que el pedido indicaba ("RPC que
agregue el mínimo por comprable").

El caveat del grooming queda **vivo y sin tocar** (territorio ajeno):
anotado como **D-588**, no curado de prepo.

### Lo construido
`obtener_oferta_adiestramiento_publica()` — DEFINER, STABLE,
`auth.uid()` obligatorio, gate 7.13 espejo literal del paseo, L-140 con
verificación de `proacl` **adentro de la migración** (si `anon` conserva
EXECUTE, la migración aborta). Wrapper `obtenerOfertaAdiestramientoPublica`
con guards contra el retorno real.

**Los dos comprables** (vocabulario ya vivo, `COMPRABLES_ADIESTRAMIENTO`):
`sesion` (mín. de `prestador_servicios.precio`) y `programa` (mín. de
`prestador_programas.precio_programa`).

**Un comprable sin precio real NO EMITE FILA.** Ni `null`, ni `0`. La
lista puede volver corta o vacía, y eso es la verdad — la misma regla que
la pantalla ya se había puesto sola.

### Medido, con JWT real
| comprable | desde | varia |
|---|---|---|
| `sesion` | **$25.00** | `false` |
| `programa` | **$90.00** | `true` ($90 y $160) |

`varia=false` en sesión no es un detalle: con N=1 el precio es **exacto**
y la superficie puede decirlo **sin "desde"** (la escalera del precio
honesto, §11). El campo existe para que la voz no mienta en ninguna de
las dos direcciones.

### El gate, con su rojo producido (L-192)
Un gate que nunca se ve fallar es decorativo. In-txn, se suspendió la
cuenta comercial del único adiestrador vivo:

| | filas |
|---|---|
| cuenta activa | **2** |
| cuenta suspendida | **0** ✅ |

**Residuo 0 verificado después** (`estado='activa'`, `suspendido_en IS
NULL`) — no asumido. *(De paso, `chk_estado_consistente` rebotó el primer
intento: suspender exige `suspendido_en`. L-109 otra vez: el CHECK se trae
antes de escribir.)*

---

## 2 · `CitaPaseoDueno` era el único tipo sin `prestador_nombre`

Traía `prestador_id` — un uuid — y la superficie no tiene cómo volverlo
voz sin **un viaje por fila**.

**El patrón de la casa ya existía y se copió, no se reinventó**
(*copiar-al-vecino*): los tres hermanos del hogar
—`AdiestramientoDelHogar`, `ConsultaDelHogar`, el de grooming— resuelven
con **UNA lectura por lote** (`.in(ids)` + `Map`), después del filtrado,
con `null` honesto cuando el prestador no es legible.

**Medido con JWT real:** 19 citas · 1 prestador distinto · **19/19
resueltos** ("Paseos Andres") — **19 viajes evitados, 1 consulta**.

**El `null` no es teórico:** la RLS de `prestadores` publica solo los
ACTIVOS, así que una cita vieja de un prestador dado de baja produce
exactamente `null`. La superficie ya sabe leerlo.

**Y un fallo leyendo el nombre NO tumba el hub:** las citas son el dato,
el nombre es el adorno. Se pintan con `null` en vez de negarle al dueño
sus propios paseos por no poder rotular uno.

### Verificado, no asumido
`prestador_nombre: string | null` vive hoy en **cinco** superficies —
los cuatro tipos del hogar (adiestramiento · grooming · veterinaria ·
paseo) más `citasMascota`. **El estándar se cumple en cuatro de cuatro.**

---

## Lo que declaro y NO hice

**El pie de la pantalla no se cableó.** `explorar/adiestramiento/index.tsx`
está **fuera del territorio declarado** de esta ronda (`packages/api` +
DB) y su último trabajo lleva numeración de otra pista (`r39-4`). El riel
está listo y el consumo es de dos líneas:

```ts
const oferta = await obtenerOfertaAdiestramientoPublica();
// del comprable elegido: total = desde_precio · totalDesde = varia
```

**`PieReserva` ya acepta las dos props** (`total`, `totalDesde`) — no hace
falta tocar el componente. Queda para quien tenga ese archivo.

---

## Archivos

- `supabase/migrations/20260731130000_s82_oferta_adiestramiento_publica.sql`
  (aditiva pura · **76(g) NO RIGE**: DDL sin backfill) + su reversa,
  escrita ANTES: `docs/relevamientos/2026-07-31-s82a-REVERSA-oferta-adiestramiento.sql`
- `packages/api/src/wrappers/adiestramiento-reserva.ts` — el lector público
- `packages/api/src/wrappers/citaSuelta.ts` — `prestador_nombre` por lote
- `packages/api/src/index.ts` — exports
- `packages/api/src/database.types.ts` — `gen:types`, diff **aditivo puro**
  (8 líneas, solo la función nueva)
- typechecks api · cliente · prestador: verdes, **exit real leído del
  comando** (L-191)
