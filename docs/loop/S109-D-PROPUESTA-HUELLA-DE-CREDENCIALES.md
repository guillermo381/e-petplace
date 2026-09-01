# PROPUESTA · que un worktree con una credencial vieja **se note al usarlo**

> S109-D · 31-ago-2026. **Medido y NO construido — espera firma.**
> Nace del pedido del founder tras `L-454`: *«proponé un mecanismo, no una
> lista»*.

---

## ① LA MEDICIÓN — y encontró un caso VIVO, no un riesgo

**42 directorios · 36 worktrees registrados · 7 archivos `.env.local`.**

Y esos siete archivos **no guardan una credencial: guardan SEIS**, comparadas
por hash (sin exponer ningún valor):

| variable | copias | valores distintos | |
|---|:--:|:--:|---|
| `EXPO_PUBLIC_SUPABASE_URL` | 7 | 1 | ✓ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 7 | 1 | ✓ |
| `EXPO_PUBLIC_DEMO_EMAIL` | 7 | 1 | ✓ |
| `EXPO_PUBLIC_DEMO_PASSWORD` | 7 | 1 | ✓ |
| `GOOGLE_MAPS_API_KEY` | 3 | 1 | ✓ |
| **`EXPO_PUBLIC_PAGOS_ALTA_URL`** | **3** | **2** | 🔴 **DESINCRONIZADA** |

> ### 🔴 `EXPO_PUBLIC_PAGOS_ALTA_URL` ya tiene DOS valores distintos hoy.
> `e-petplace-s101-d` apunta a un lugar; el worktree principal y `s107-a`, a
> otro. **Nadie lo sabía, y es la URL del alta de pagos.**

⇒ **La propuesta no previene un problema futuro: destapa uno que ya existe.**
*Y el modo en que se destapó vale por sí solo — apareció censando la key de
mapas, que estaba sincronizada. La que estaba rota era la que nadie estaba
mirando.*

---

## ② LA FORMA QUE LE VEO — huella declarada en el repo, guard que compara

**El repo declara la huella de cada credencial vigente; el guard compara la del
worktree contra ella y habla si difieren.**

```
supabase/…/credenciales.huellas.json     ← commiteado
{
  "GOOGLE_MAPS_API_KEY":       "sha256:9f2a1c4d",
  "EXPO_PUBLIC_PAGOS_ALTA_URL":"sha256:f8e1e975",
  …
}
```

- **Huella = `sha256(valor)` truncado.** No expone nada: de ocho hex no se
  vuelve a una key, y sirve para lo único que hace falta — **decir si dos son la
  misma**.
- El guard **mira SU propio `.env.local`** y compara. No espía otros worktrees:
  *el founder pidió que se note **al usarlo**, y eso se resuelve en el worktree
  que se está usando.*

**Qué dice cuando falla, y es la mitad que importa:**

```
🔴 EXPO_PUBLIC_PAGOS_ALTA_URL de este worktree NO es la vigente
   (declarada f8e1e975 · acá e98d0069)
   → una credencial rotada no avisa: pedí la vigente antes de buildear.
```

---

## ③ 🔑 LO QUE ESTO CURA DE `L-454`, Y ES SU MEJOR ARGUMENTO

`L-454` dice que **una rotación no deja rastro en el repo** — no hay commit, no
hay diff, ningún gate la ve.

**Con la huella declarada, rotar OBLIGA a un commit.** ⇒ *la rotación deja de ser
un acto invisible en una consola web y pasa a ser un cambio versionado, con
fecha y autor.* **Eso no es un efecto lateral: es el punto.** El guard es la
consecuencia; **el rastro es el valor.**

---

## ④ DÓNDE CORRE, Y DÓNDE NO

- ✅ **En el paso ⓪ del método** y **antes de buildear** — que es donde una
  credencial vieja hace daño.
- ❌ **NO en el pre-commit.** La mayoría de los worktrees **no tiene** `.env.local`
  (7 de 36), y un guard que grita en 29 lugares donde no aplica **enseña a
  ignorarlo** — el precedente de la casa sobre avisos que no frenan.
- **Sin `.env.local` → no dice nada.** Su ausencia no es un defecto.

---

## ⑤ LO QUE NO RESUELVE, dicho antes de que alguien lo suponga

- **No sabe cuál es la vigente**: sabe si la tuya coincide con **la declarada**.
  Si alguien rota y **no actualiza la huella**, el guard queda mintiendo al revés
  — *el mecanismo traslada la disciplina de «acordate de actualizar seis
  archivos» a «acordate de actualizar uno», que es mucho mejor pero no es cero.*
- **No toca los secrets de EAS.** Esos viven en el builder y no son legibles;
  su sincronía se verifica lanzando, o con `env:list` mirando que sea `secret`.
- **No borra nada.** Los `.env.local` de worktrees viejos siguen ahí; el guard
  sólo hace que el próximo que los use **se entere**.

---

## ⑥ LO QUE PIDO FIRMAR

1. **Si va** — y si va con huella declarada (②) o con la variante barata: sólo
   comparar copias entre sí y avisar que difieren, **sin fuente de verdad**.
2. **Dónde vive el archivo de huellas** — es territorio de A.
3. 🔴 **Y lo urgente, que no espera al mecanismo: `EXPO_PUBLIC_PAGOS_ALTA_URL`
   está desincronizada HOY.** Alguien tiene que decidir cuál de los dos valores
   es el bueno. *No lo toco: es del arco de pagos.*
