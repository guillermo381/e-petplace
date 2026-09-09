# S114-F → A · PEDIDOS POR NOMBRE

> Las pistas no se escriben entre sí: esto va a `docs/loop/` y lo reparte el
> founder. **F no tocó nada de esto.**

---

## ① `pnpm gen:types` — regenerar `packages/api/src/database.types.ts` 🟡

**Por qué:** F aplicó `20260911500000_s114f_puerta_liquidacion.sql`, que crea
`admin_generar_liquidacion(uuid, text, date, date)`. **Verificada contra el
objeto:** `existe=1 · puerta_auth=true · puerta_anon=false · tiene_gate=true`.

`database.types.ts` es **generado** y vive fuera de `packages/api/src/admin/`
⇒ es de A y F no lo toca (letra §3③). Mientras no se regenere, el wrapper
llama por un cast declarado (`packages/api/src/admin/liquidaciones.ts`, con su
comentario diciendo que este pedido lo borra).

**No bloquea nada:** el typecheck de `apps/admin` está verde y la función corre
por camino real.

---

## ② `otorgar_puntos` — ✅ **YA CURADO POR A. No hay pedido.** 

El encargo de F5 decía *«anotá y no cures: `otorgar_puntos` quedó con D-314 a
medias»*. **F lo midió antes de escribir la nota, y ya estaba curado:**

```
anon_puede        = False
auth_puede        = True
tiene_gate_ahora  = True     ← is_admin() en el cuerpo
```
*(comando: `has_function_privilege` + `pg_get_functiondef ILIKE '%is_admin%'`
sobre `otorgar_puntos(uuid,integer,text,text,uuid,text)`, 7-sep-2026)*

Lo curó `20260911040000_s114a_otorgar_puntos_gate.sql`, y con el rojo producido
por camino real —una cuenta con sesión y `is_admin()=false` llamó por PostgREST
y obtuvo **HTTP 204 con 999 puntos escritos**— antes de cerrarlo.

🔴 **Se deja escrito que NO hay pedido, en vez de borrar el ítem.** Si esta
sección desapareciera, la próxima lectura del encargo F5 mandaría a A a curar
lo que acababa de curar. *Medir antes de escribir la nota evitó exactamente
eso, y el registro de que se midió es parte del valor.*

---

## ③ Anotado, sin pedido — cosas que F midió y no curó

Ninguna es de F y ninguna bloquea la tanda 1:

- 🔴 **`v_gmv_mensual` lleva `(sum(total) * 0.14) AS revenue` embebido**, y
  `Inversores.tsx` grafica esa columna. La tasa firmada es 10 % y la base es
  FEE, no GMV. *(F ve que A tiene `20260911050000_s114a_fee_en_vistas.sql` — si
  eso ya lo cubre, este ítem muere.)*
- 🟡 **`Dashboard.tsx:392` del legado** hace `gmvMes * 0.14` en el cliente. Es
  del legado, no del MVP.
- 🟡 **`admin_users` tiene los 7 privilegios concedidos a `anon`** (incluido
  TRUNCATE). Hoy la RLS los frena —una sola policy, de SELECT, `auth.uid()=id`,
  verificada por camino real: un no-admin ve **0 filas**— y PostgREST no expone
  TRUNCATE. Es defensa en profundidad ausente, no un agujero abierto.
- 🟡 **`profiles` no contempla admin en sus policies de escritura**
  (`auth.uid() = id`). `UsuarioDetalle.tsx:255` del legado hace un `UPDATE` que
  **no puede escribir y no falla**.
- ⚠️ **`Layout.tsx` y `Mensajes.tsx` del legado abren una suscripción realtime
  a `mensajes_admin_seller`, que no existe** ni está en la publicación
  `supabase_realtime` (16 tablas, medidas). No genera carga de replicación;
  es un canal que nunca recibe nada.

---

## ④ Nota de coordinación — la DB compartida

F aplicó **una** migración (`20260911500000`, número deliberadamente separado
de la franja de A). Para poder empujarla tuvo que **copiar al worktree** las
cinco migraciones de A ya aplicadas en el remoto
(`20260911020000` · `030000` · `040000` · `050000`), porque `db push` valida el
historial completo. **Esas copias NO se commitearon**: son de A y ya están en
el remoto.

🔴 **No se corrió `supabase migration repair --status reverted`**, que es lo que
el CLI sugiere: habría marcado las migraciones de A como revertidas en el
ledger.

⚠️ **Y una medición que vale para todos: `supabase db query --file` NO aplica
DDL.** Devolvió `rows: []` **sin error** y la función no se creó — se descubrió
preguntándole al objeto, no al comando. Corre con un rol temporal. Para DDL,
`db push`.

---

## ⑤ 🟡 DEUDA CON DUEÑO — el pasaporte puede nacer MUDO, y el default hace parecer que no

**Sin número a propósito:** el canon prohíbe escribir un número antes de
depositar la ficha. **La ficha es de A**, que le pone el número con
`pnpm proximo:ficha` al depositarla.

### El hecho, medido en el ensayo de la placa (S114-F, adenda 13)

`activar_placa` **crea el pasaporte y NO crea su fila en `pasaporte_config`**
(medido: cero ocurrencias de `pasaporte_config` en su cuerpo). Sin esa fila, la
página pública **muestra sólo el nombre de la mascota**: sin foto, sin contacto,
sin botón de llamar.

*Lo vi en pantalla: entre activar y configurar, el pasaporte de Zeus decía
«Zeus» y nada más. El propósito entero del pasaporte es que alguien pueda
llamar, y no se podía.*

### 🔴 Lo que lo vuelve difícil de ver: el default dice que está cubierto

```sql
-- pasaporte_config
mostrar_contacto  DEFAULT true
mostrar_salud     DEFAULT true
mostrar_chip      DEFAULT true
```

**Los tres defaults son `true`** — quien lea el esquema concluye que el
pasaporte muestra el contacto por defecto. **Y no es cierto: un default de
columna sólo se aplica cuando alguien inserta la fila, y acá nadie la inserta.**
*El esquema promete un comportamiento que ninguna ruta produce.*

### Por qué NO es un defecto del producto hoy

**El front lo cubre:** `apps/cliente/src/app/placa/[token].tsx:135` hace
`router.replace('/hogar/mascota/pasaporte')` **inmediatamente después de
activar**, así que la familia aterriza en la pantalla de configuración.
*Perseguí esto antes de reportarlo: mi pasaporte quedó mudo porque llamé la RPC
directo y me salteé la pantalla.*

### Por qué igual se anota

**Quien evita el estado mudo es el FRONT, no el motor.** Si algún día se activa
por otra vía —un script de alta masiva, otra superficie, un flujo de tienda que
active al comprar— **el pasaporte nace sin contacto y nada avisa**: no hay error,
no hay estado inválido, la placa funciona y no sirve.

**Dos formas posibles, y la elección es de A porque es su territorio:**
1. `activar_placa` inserta la config con los defaults en la misma transacción
   (los `true` del esquema pasarían a regir de verdad); **o**
2. la edge `pasaporte` trata «sin config» como «config por defecto» en vez de
   como «no mostrar nada».

⚠️ **No propongo cuál.** La primera escribe una fila que hoy no existe y la
segunda cambia cómo se lee un estado ya existente — **son decisiones distintas
sobre 22 pasaportes vivos**, y ninguna es de F.
