# S102-B · FIRMA #2 — LOS `?? 14` DEL ADMIN MUEREN

> ## 🔴 ESTE ARCHIVO ES UN RELEVAMIENTO, **NO ES CÓDIGO COMMITEADO**
>
> **Orden de mesa (relevo 3, punto 7):** *«Patch del admin: SIN commitear hasta
> tanda propia con compilación + verificación runtime.»*
>
> **Estado real, para que la distinción no se pierda:**
>
> | qué | dónde | estado |
> |---|---|---|
> | **el CÓDIGO del patch** | `e-petplace-admin` | ❌ **no existe en ningún lado** — ese repo **no se tocó** (limpio, en `main`, sin cambios desde el 10-may) |
> | **este DOCUMENTO** | `docs/relevamientos/` de `pista/s102-b` | ✅ commiteado, como los demás relevamientos de S102 |
>
> *Se commitea el documento porque es una MEDICIÓN —los nueve literales, el
> camino de auth verificado, el argumento del `?? 10`— y una medición que vive
> solo en un chat no la puede releer nadie. **Lo que espera tanda propia con
> compilación y runtime es el patch aplicado, y no está aplicado.***

> **🔴 ESTADO: PATCH PREPARADO, NO APLICADO Y NO PUSHEADO.**
>
> **Y el árbol del admin NO se tocó — decisión declarada, con su razón:**
> `e-petplace-admin` está **limpio, en `main`, sin tocar desde el 10-may-2026**
> (`79eb141`), **no participa del sistema de worktrees por pista**, y la orden
> dijo *«sin aplicar/push»*. **Dejar ediciones sin commitear en un repo que
> nadie está mirando es la definición de trabajo que se pierde o que sorprende
> a alguien.** *El patch de abajo es copy-paste exacto: aplicarlo es mecánico.*

**Origen: firma founder #2, 21-ago-2026 (relevo 2, punto 7), verbatim:**

> *«los ?? 14 del admin MUEREN: los tableros leen fee_configs (10 % firmado con
> su base) y DECLARAN "proyección" en toda cifra de despensa mientras el ledger
> tenga 0 eventos de pedido. Nada se publica como contabilidad sin ledger
> detrás. Disparo D-759 vigente: antes de que alguien de afuera vea
> /inversores.»*

---

## ⓪ · LO QUE HUBO QUE MEDIR ANTES, PORQUE LA FIRMA NO ERA CONSTRUIBLE DE ENTRADA

**El admin autentica con la anon key sobre la MISMA base de producción**
(D-758). **Y `anon` lee CERO filas de `fee_configs`** — medido con
`SET LOCAL ROLE anon`. *Si el portal operara solo como anónimo, «los tableros
leen fee_configs» habría producido un tablero vacío o, peor, otro fallback.*

**Se midió el camino real y la firma SÍ es construible:**

| medición (como `admin_users` activo, `SET LOCAL request.jwt.claims`) | resultado |
|---|---|
| `is_admin()` | **true** |
| filas visibles de `fee_configs` | **7** |
| `resolver_comision_despensa('EC', now())->>'pct'` | **`10`** |

⇒ El portal **loguea un usuario real** (`supabase.auth.getSession()`,
`App.tsx:66`) y la policy `admin_all_fee_configs` le abre la tabla. **Y el RPC
`resolver_comision_despensa` está concedido a `authenticated`** (verificado
ejecutándolo, no leyendo el grant).

---

## ① · 🔴 LA DECISIÓN DE DISEÑO QUE HACE O DESHACE ESTE PATCH

> ### **La cura NO es `?? 10`. La cura es que NO HAYA FALLBACK.**

**`?? 10` sería exactamente el mismo defecto con mejor número:** una constante
que se activa cuando la fuente no responde, y que **se disfraza de valor por
defecto**. Es lo que D-759 nombró y es contra lo que la **regla 36** del
contrato está escrita — *«No fallbacks hardcodeados. Si el catálogo de DB falla,
error explícito al user, no fallback silencioso.»*

**⇒ Si la tasa no se puede resolver, el tablero DICE QUE NO LA TIENE y no
muestra la cifra derivada.** Un guion en vez de un número es información
correcta; un número inventado es desinformación con formato de dato.

**Y hay que decir por qué importa acá más que en otro lado:** estos tableros
alimentan `/inversores`. *Un número inflado un orden de magnitud en un pitch
deck no es un bug de tablero: es lo que se dijo en una reunión.*

---

## ② · PIEZA NUEVA — `src/lib/comision.ts`

**Una sola fuente para los cuatro archivos.** *Cuatro lecturas de la misma tasa
en cuatro pantallas es cómo nacieron los diez lugares de D-759.*

```ts
// src/lib/comision.ts — S102-B
//
// LA TASA DE COMISIÓN SE LEE DEL MOTOR, JAMÁS SE ESCRIBE ACÁ.
// Fuente: RPC `resolver_comision_despensa(country, fecha)`, que resuelve
// vigencia y devuelve TAMBIÉN la base sobre la que se calcula.
//
// 🔴 SIN FALLBACK A PROPÓSITO (regla 36 del contrato). Si no se puede
//    resolver, devuelve null y el llamador NO muestra la cifra derivada.
//    Un `?? 14` —o un `?? 10`— es el defecto que este archivo viene a matar.
import { supabase } from './supabase'

export type Comision = {
  pct: number
  /** 'total_con_impuesto' | 'subtotal' | … — la base la DICE el motor. */
  base: string | null
  feeConfigId: string
  vigenciaDesde: string
}

export async function resolverComision(
  country = 'EC',
  fecha: Date = new Date(),
): Promise<Comision | null> {
  const { data, error } = await supabase.rpc('resolver_comision_despensa', {
    p_country_code: country,
    p_fecha: fecha.toISOString(),
  })
  if (error || !data) return null
  const d = data as Record<string, unknown>
  const pct = Number(d.pct)
  if (!Number.isFinite(pct)) return null
  return {
    pct,
    base: (d.base as string) ?? null,
    feeConfigId: String(d.fee_config_id),
    vigenciaDesde: String(d.vigencia_desde),
  }
}

/**
 * ⚠️ EL SELLO DE PROYECCIÓN (firma founder #2).
 * Mientras el ledger no tenga eventos de `pedido`, toda cifra de revenue de
 * despensa es una MULTIPLICACIÓN, no una contabilidad. El tablero lo dice.
 * Medido el 21-ago-2026: `eventos_economicos` tiene 36 filas y las 36 son de
 * `cita`. Cero de `pedido`.
 */
export async function hayLedgerDeDespensa(): Promise<boolean> {
  const { count, error } = await supabase
    .from('eventos_economicos')
    .select('id', { count: 'exact', head: true })
    .eq('origen_tipo', 'pedido')
  if (error) return false
  return (count ?? 0) > 0
}
```

> **Por qué `hayLedgerDeDespensa()` consulta y no es una constante:** el sello
> de «proyección» **tiene que apagarse solo** el día que el ledger se cablee.
> *Un cartel que hay que acordarse de sacar es un cartel que se queda puesto.*

---

## ③ · LOS NUEVE SITIOS, UNO POR UNO

### `src/pages/Financiero.tsx`

**Línea 16 — MUERE:**
```diff
-const TAKE_RATE = 0.14
```

**Línea 254 — el revenue pasa a ser condicional:**
```diff
-  const revenueNeto = gmvTotal * TAKE_RATE
+  // La tasa viene del motor; si no se resolvió, NO se calcula (regla 36).
+  const revenueNeto = comision ? gmvTotal * (comision.pct / 100) : null
```

**Y el estado que lo alimenta**, junto a los demás `useState` del componente:
```ts
const [comision, setComision]   = useState<Comision | null>(null)
const [conLedger, setConLedger] = useState<boolean>(false)

useEffect(() => {
  resolverComision('EC').then(setComision)
  hayLedgerDeDespensa().then(setConLedger)
}, [])
```

**Donde se pinte `revenueNeto`:**
```tsx
{revenueNeto == null
  ? <span title="No se pudo resolver la comisión vigente">—</span>
  : <>{fmtUSD(revenueNeto)}{!conLedger && <em> · proyección</em>}</>}
```

> ⚠️ **`'EC'` está escrito acá a propósito y es una simplificación declarada:**
> `pedidos` **tiene `country_code`**, así que lo correcto es agrupar el GMV por
> país y resolver la tasa de cada uno. **Hoy da igual —el catálogo v1 es
> USD/Ecuador y la fila CO se cierra con la CURA 1— pero el día que CO abra,
> este `'EC'` mentiría.** Se deja nombrado en vez de resuelto porque agrupar
> por país cambia la forma del tablero y eso no está en la firma.

---

### `src/pages/Dashboard.tsx` — líneas 391-393

**Los tres, de una** (son la misma tarjeta):
```diff
-        <KpiCard icon="📈" label="Revenue del mes (14%)"
-          value={fmtUSD(gmvMes != null ? gmvMes * 0.14 : null)}
-          sub="14% take rate"
-        />
+        <KpiCard icon="📈"
+          label={comision ? `Revenue del mes (${comision.pct}%)` : 'Revenue del mes'}
+          value={comision && gmvMes != null
+                   ? fmtUSD(gmvMes * (comision.pct / 100))
+                   : null}
+          sub={comision
+                 ? `${comision.pct}% sobre ${comision.base ?? 'base no declarada'}`
+                   + (conLedger ? '' : ' · proyección')
+                 : 'comisión no disponible'}
+        />
```

> **La etiqueta deja de tener el número adentro.** *Un `%` hardcodeado en un
> `label` es tan constante como uno en una fórmula, y sobrevive a la cura de la
> fórmula sin que nadie lo note* — es literalmente lo que pasó con `:391` y
> `:393` de D-759.

---

### `src/pages/Sellers.tsx` — líneas 410, 414, 419, 820

**🔴 Acá el defecto es mayor que un fallback: la pantalla consulta y ESCRIBE
una tabla que ya no existe.** Medido: `to_regclass('public.seller_comisiones')`
→ **NULL**; la borró `20260811120000_s95_m1_limpieza_comercio.sql:129`.

```
:169-172   SELECT / UPDATE / INSERT sobre seller_comisiones
:410       .from('seller_comisiones').select('*')
:460       UPDATE sobre seller_comisiones
```

⇒ **`data` vuelve vacío siempre ⇒ `?? 14` no es un fallback: es el valor.** Y
la mitad de escritura **no puede guardar nada**.

**Cambio mínimo de esta firma** (líneas 414 y 419):
```diff
-    setGlobalRate(String(global?.take_rate_pct ?? 14))
+    // Fuente única: el motor. Sin fallback (regla 36).
+    setGlobalRate(comision ? String(comision.pct) : '')
...
-      initRates[p.code] = String(com?.take_rate_pct ?? 14)
+      initRates[p.code] = comision ? String(comision.pct) : ''
```

**Línea 820** — el texto al usuario:
```diff
-  💡 Prioridad: <strong>producto &gt; categoría &gt; país &gt; global (14% default)</strong>
+  💡 La comisión vigente la resuelve <strong>fee_configs</strong> por país y fecha.
+     {comision
+       ? <> Hoy: <strong>{comision.pct}% sobre {comision.base ?? 'base no declarada'}</strong>.</>
+       : <> <strong>No se pudo resolver la comisión vigente.</strong></>}
```

> **⚠️ LO QUE ESTE PATCH **NO** ARREGLA ACÁ, y es más grande que la firma:**
> la pantalla de comisiones del admin **está construida sobre una tabla
> muerta**. Cambiar los dos `?? 14` la vuelve honesta en la LECTURA y **la deja
> igual de rota en la ESCRITURA**. *Un admin que entre a bajar la tasa sigue
> operando un formulario que no puede guardar.* **Repuntarla a `fee_configs`
> —que tiene otra forma: vigencias, no overrides por seller— es un rediseño de
> pantalla, no un patch, y merece su propia firma.**
> *(Y hay una pregunta de producto adentro: `fee_configs` soporta override por
> `cuenta_comercial_id`, así que el concepto «override por seller» sobrevive —
> lo que no sobrevive es su tabla ni su forma.)*

---

### `src/pages/Liquidaciones.tsx` — línea 197

**Mismo caso: lee `seller_comisiones`.**
```diff
-    const { data } = await supabase
-      .from('seller_comisiones')
-      .select('take_rate_pct')
-      .eq('seller_id', s.id)
-      .eq('tipo', 'global')
-      .maybeSingle()
-    setTakeRate(String(data?.take_rate_pct ?? 14))
+    const c = await resolverComision('EC')
+    setTakeRate(c ? String(c.pct) : '')
```

Y donde se use `takeRate` para calcular el preview, **si está vacío no se
calcula**: se muestra `—` con el motivo.

---

## ④ · EL SELLO DE «PROYECCIÓN», EN UNA LÍNEA

**Toda cifra de revenue de despensa lleva el sufijo mientras
`hayLedgerDeDespensa()` sea falso.** No es decoración:

> **Hoy el «revenue» de despensa es `GMV × tasa` — una multiplicación sobre 65
> pedidos que nunca produjeron un evento económico.** El ledger tiene **36
> eventos y los 36 son de `cita`**. *Llamar contabilidad a eso es el error de
> magnitud que D-759 describe, y el sello es lo que impide que alguien lo lea
> como plata cobrada.*

**Y el sello se apaga solo** el día que el cableo exista — que **sigue
BLOQUEADO** hasta que `crear_evento_economico` honre la `base`.

---

## ⑤ · LO QUE ESTE PATCH **NO** HACE — declarado

1. **No agrupa por país.** El `'EC'` está nombrado arriba con su fecha de
   vencimiento.
2. **No rediseña la pantalla de comisiones** de `Sellers.tsx` (escritura contra
   tabla muerta) — se declara y se sirve, no se resuelve.
3. **No toca `v_gmv_mensual` ni `v_metricas_tiempo_real`**, que llevan el
   `0.14` **embebido en el SQL de la vista**. *Son DB: territorio de A, y son
   las dos que `D-861` también toca porque además son legibles por `anon`.*
   **⇒ Curar solo el front deja el `0.14` vivo en la fuente**, y cualquier
   consumidor futuro de esas vistas lo hereda. **Las dos curas van juntas o el
   número sobrevive.**
4. **No se corrió el build del admin.** No hay `node_modules` en este worktree
   y el repo no se tocó: **el patch no está compilado ni verificado en
   runtime.** *Se dice porque «build limpio ≠ funciona» y acá ni siquiera hay
   build.*
