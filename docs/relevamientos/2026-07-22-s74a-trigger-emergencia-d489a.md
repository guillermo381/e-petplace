# S74-A · T1 — Precondición de D-489a: el mecanismo de `tiene_emergencia_activa`

> Relevamiento literal contra DB viva (regla 40: body con
> `pg_get_functiondef`, jamás por nombre). Solo lectura. D-122 decía "el
> trigger E2 nunca se confirmó sobre eventos_mascota" — acá el veredicto
> con el literal.

## 1 · Qué es

`mascota_perfil_vigente` = **TABLA real** (no view), RLS activa con UNA
sola policy (`perfil_vigente_select`, SELECT) — cero policies de
INSERT/UPDATE. La columna: `tiene_emergencia_activa boolean NOT NULL
default false`, `is_generated: NEVER` — alguien tiene que escribirla.

## 2 · El trigger EXISTE (D-122 corregida en letra)

```
CREATE TRIGGER trg_emergencia_actualizar_flag
AFTER INSERT OR DELETE OR UPDATE ON evento_emergencia_solicitada
FOR EACH ROW EXECUTE FUNCTION _trg_emergencia_actualizar_flag()   -- activo ('O')
```

Dispara sobre **`evento_emergencia_solicitada`** (la tipada del Eje 3 con
su `trg_emergencia_crear_evento` BEFORE INSERT que crea el padre), **no
sobre `eventos_mascota`** como decía la letra de la deuda. El body
RECALCULA con EXISTS en cada disparo (no setea por rama): activos =
`estado IN ('solicitada','en_busqueda','asignada')` — partición
correcta y completa contra el CHECK vivo de 6 estados. **Mecánicamente
cubre apertura Y cierre.**

## 3 · Donde se cae el mecanismo (los tres hallazgos)

1. **El cierre no tiene camino legal.** `evento_emergencia_solicitada`
   tiene policies de INSERT (dueño — y por el modelo LEGACY
   `mascotas.user_id`, no la familia), SELECT y DELETE admin. **NO existe
   policy de UPDATE y CERO RPCs** en todo `public` conocen el subsistema
   (censo por `prosrc`: la única función que lo toca es el propio
   trigger). La transición a `resuelta`/`cancelada` solo puede ejecutarla
   service_role/superuser.
2. **El único camino de apertura del cliente no puede escribir el flag.**
   `_trg_emergencia_actualizar_flag` es **SECURITY INVOKER** y
   `mascota_perfil_vigente` es RLS solo-SELECT: un INSERT del dueño como
   authenticated corre el trigger con su rol — sin fila de perfil, el
   INSERT del perfil **viola RLS y aborta la apertura entera**; con fila,
   el UPDATE final **matchea 0 filas en silencio** y el flag queda
   `false` con la emergencia viva. (Peso/medicación funcionan porque
   viajan dentro de RPCs DEFINER; la emergencia no tiene esa puerta.)
3. **Dos tablas paralelas del portal legado que el flag ignora:**
   `solicitudes_emergencia` (estado propio, policies ALL del dueño) y
   `emergencia_eventos`. Un flujo que escriba ahí jamás mueve el flag.

## 4 · Dato vivo

0 filas en las TRES tablas de emergencia · 0 mascotas con flag true ·
cruce en ambas direcciones: 0 desvíos (consistencia trivial, por vacío).
En el monorepo: **6 lectores y CERO escritores**; ninguna migración del
monorepo toca el trigger — herencia pre-S43.

## 5 · Veredicto para la mesa (la precondición de D-489a)

**El dato NO es fiable para la superficie de recepción — es fiable solo
por vacuidad.** Hoy no puede pintar un dato incorrecto (todo es false y
no existen emergencias), pero como SEÑAL promete algo que ningún camino
puede encender: jamás disparó en producción, el subsistema no tiene
motor, y el único camino de apertura abortaría o dejaría el flag en
false en silencio. **Por la regla del mandato ("si el dato no es fiable,
la superficie NO lo muestra"): la vista destilada de recepción v1 NO
incluye `tiene_emergencia_activa`** hasta que el subsistema gane su
puerta DEFINER (abrir/cerrar con policy y RPC) — recién ahí el flag dice
la verdad por diseño y no por vacío. D-489 debería enmendar su letra con
esta precondición.
