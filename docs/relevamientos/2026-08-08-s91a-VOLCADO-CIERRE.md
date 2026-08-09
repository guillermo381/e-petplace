# S91 · PISTA A — VOLCADO DE CIERRE (8-ago-2026)

> **Criterio: el A que despierte no tiene mi memoria — tiene este archivo, el
> acta y el repo.** El volcado PRE-COMPACTACIÓN
> (`2026-08-08-s91a-VOLCADO-precompactacion.md`) sigue vigente para lo de la
> mañana; **este es el estado FINAL**. Donde los dos difieran, manda este.

---

## ① MI ROL Y LO QUE APRENDÍ DE ÉL

**A conduce:** `main` · la **DB** · `packages/api` · `packages/domain` ·
**`docs/`** (escritora única) · **los merges, el push y el PUBLISH**.

**§2 de `METODO_TRES_PISTAS`, enmendado hoy: quien publica es quien mergea.**
Los choques de S91 pasaron porque publicar y dominar el árbol eran personas
distintas.

**EL PUBLISH VA POR `scripts/publicar-ota.mjs`, JAMÁS `eas update` a mano.**
Veda (hijo) → publish → **re-verificación que GRITA**. `--mensaje` no lleva el
ancla: la pone el script.

**Lo que el guard NO puede hacer, medido:** cerrar la ventana contra una pista
que **escribe** mientras Metro lee. **C trabaja en el directorio primario sobre
`main`** (`git worktree list`: hay worktree de B y de D, **no de C**). Los
cuatro publishes limpios del cierre salieron así **porque las cuatro pistas
estaban en cero**, no por el guard.

---

## ② LOS DOS PUBLISHES FINALES — leídos del OBJETO

```
CLIENTE    group 53d18a98-9aae-4ef4-a20b-5fce9a14527f   runtime 1.0.3
           android 019fe42a-d483-73ce-ba16-5d911b38586e
           ios     019fe42a-d483-7896-85b6-6dc3d507e493
PRESTADOR  group 364f353b-6967-4dfb-84d3-a952e82e2b93   runtime 1.0.4
           android 019fe42b-6d93-7c40-8917-480032861c94
           ios     019fe42b-6d93-70d9-8e28-c3e6e1f75025
ANCLA COMÚN  c4c92933745d6dc816354170633666fba17ee3cf   (los dos LIMPIOS)
```

**Los dos GATEADOS EN VERDE por el founder. S91 cerrada.**

**El ancla se lee del objeto** (`update:view --json` → `gitCommitHash`), jamás
del texto del mensaje: medido, un publish declaró «ancla f4c9a134» y su hash
real fue `5012db53`.

**Los cuatro asteriscos del día viven en el acta (§④) con su reloj** — y ahí es
donde hay que buscarlos, porque **el registro publicado no guarda el estado del
árbol**.

---

## ③ LA DB — lo aplicado y REGISTRADO

**234 migraciones local = remoto.** El contador **se mide, no se escribe**:
`ls supabase/migrations/*.sql | wc -l` / `npx supabase migration list --linked`.

**Las 25 de S91-A**, en orden — todas con **reversa escrita ANTES** en
`docs/relevamientos/2026-08-0*-s91a-REVERSA-*.sql`, veda 76(g) declarada,
cinturones in-txn y fixtures con ROLLBACK:

```
20260807170000 cat_razas (D-379)        173000 pez/acuario        180000 hito
       183000 raza en las 2 RPCs        190000 grants L-140       200000 razas apagadas
       210000 razas firmadas            220000 p_origen           230000 reptil apagado
20260808000000 hito catálogo            010000 hito emisión       020000 vocabulario universal
       030000 aplicab. conductas        040000 reservador         050000 3 motores del perfil
       060000 gato/acuario              070000 aplicab. objetivos 080000 CIERRE DE LA FUGA
       090000 tipos                     100000 vista ensanchada   110000 censo acuario
       120000 desempate (seq)           130000 REGRANT cuenta_comercial_id
       140000 cierra oráculo debug      150000 sedes de mis citas
```

**⚠️ DOS de ellas nacieron aplicadas y SIN REGISTRAR** (`db query` ejecuta pero
no escribe el historial). **Lo cazó la medición del contador, no un aviso** —
reparadas con `migration repair --status applied`. *Si el contador no se mide,
un `db push` futuro las re-aplica.*

---

## ④ WHATSAPP — CONGELADO, con su retome escrito

`MODELO_NOTIFICACIONES` §0quater, bloque 🧊. **Cuatro esperas, todas externas o
del founder.** `transporte_vivo=false`, cola en 0.

**El bloqueo tiene nombre: la credencial cargada NO es un token de Meta**
(forma medida sin exponer el valor: largo 23, sin `EAA`, sin comillas, sin
salto ⇒ no está truncada, **es otra cosa**). Meta contesta 401 «Cannot parse
access token».

**El retome es UNA llamada:**
```
curl -s -X POST "$URL/functions/v1/despachar-whatsapp?verificar=1" -H "Authorization: Bearer $ANON_KEY"
```

---

## ⑤ ÓRDENES VIVAS EN MI MANO — no ejecutadas

**IDEMPOTENCIA DEL ALTA** — el contrato ya está servido por D en
`docs/relevamientos/2026-08-08-s91d-PEDIDO-A-token-de-intento.md`:
`p_token_intento text DEFAULT NULL`, **sin token = comportamiento de hoy**,
`ya_existia` tratado como **ÉXITO**.

**Lo medido, para que el próximo A no lo re-mida:**
- `crear_familia_con_primera_mascota` **ya está protegida**; el hueco está en
  **`agregar_mascota_a_familia`**.
- **Los duplicados del founder fueron re-sumisión humana a 1-2 min** ⇒ una
  ventana de segundos no alcanza.
- **Los 19 de D crearon 19 FAMILIAS distintas** ⇒ una clave natural
  `(familia_id, nombre, especie)` **no habría cazado ninguno**.
- ⇒ **el token de intento es la forma correcta**, y la mitad de D ya está
  cableada e inerte (hoy no lo manda).
- **El hito NO se emite en el camino idempotente.**

---

## ⑥ LAS TRAMPAS DE LA SESIÓN — todas cobradas en carne propia

1. **`storage rm` devuelve `{"deleted":[]}` SIN error.** Verificar por
   CONTENIDO. Para subir: `x-upsert: true` (`cp` rebota 409).
2. **`CREATE OR REPLACE VIEW` solo APENDEA columnas** (42P16 si insertás en el
   medio).
3. **El `.select()` de supabase-js va en UNA cadena literal** — concatenado con
   `+` la fila cae a `GenericStringError`.
4. **El pipe trunca DATOS (L-200) y exit codes (L-191).** `cmd > log; echo $?`.
5. **`git status` limpio 60 s antes no garantiza bundling limpio** — el
   asterisco vive solo en el momento.
6. **Tres supuestos de TIPO cazados chocando:** `especies_elegibles` es
   **jsonb** · `p_raza` es **requerido** · `lat`/`lon` son **double precision**.
   Y **plpgsql valida el `RETURN QUERY` al EJECUTAR**, no al crear.
7. **Un comentario propio rompe un grep propio** (L-170, cinco veces hoy).
8. **`eas-cli` SIEMPRE desde `apps/<app>/`**, aunque solo estés MIRANDO.
9. **Los backticks de un `git commit -m` son sustitución de comandos en zsh** —
   se comieron tres identificadores con status 0. **Usar `git commit -F`.**
10. **`now()` es constante dentro de una transacción** (L-122a): no sirve para
    ORDENAR filas append-only. El desempate se hace con `seq` IDENTITY.
11. **`has_table_privilege` NO contesta «¿puedo correr esta consulta?»** en una
    tabla con grants por columna. Y **`SELECT count(*)` es el peor test posible
    ahí: no toca ninguna columna, así que pasa siempre.** (L-212.)
12. **`REVOKE SELECT (col)` no avisa a nadie** — ni typecheck, ni gate, ni
    guard. Solo un 42501 lejano, horas después. (L-215.)

---

## ⑦ ESTADO DEL REPO

```
main == origin == c4c92933745d6dc816354170633666fba17ee3cf   (antes de este commit de cierre)
migraciones = 234 local = remoto      ·      árbol limpio
B: 0 pendientes   ·   D: 0 pendientes   ·   C trabaja sobre main (sin worktree)
```

**Deudas nacidas hoy: D-692 → D-701.** **Lecciones: L-211 → L-215.**
**Acta: `docs/actas/2026-08-08-s91-ACTA-CIERRE.md`.**
**Brief: `docs/relevamientos/2026-08-08-brief-s92.md`.**

**RESIDUO CON DECISIÓN PENDIENTE: 64 cuentas `s91d-*@epetplace.dev`.** No se
tocan sin palabra del founder.
