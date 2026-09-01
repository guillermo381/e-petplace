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

> ### ⚠️ CORRECCIÓN DE MI PROPIA ALARMA (medido después, 31-ago)
>
> Llamé **«desincronizada»** a `EXPO_PUBLIC_PAGOS_ALTA_URL` y **no lo está**.
> Medido con los valores a la vista:
>
> | worktree | valor | fecha |
> |---|---|---|
> | `e-petplace` · `s107-a` | `https://epetplace-pagos-stg.vercel.app` | 19-ago · 28-ago |
> | `s101-d` | `http://127.0.0.1:8899/index.html` | 21-ago |
>
> **No son dos versiones de la misma credencial: son producción y un BANCO
> LOCAL**, puesto a propósito por la pista de pagos de S101 para probar la
> página del alta sin desplegar.
>
> ✅ **Y lo que decide el riesgo real:** el **secret de EAS** —el que llevan los
> binarios de nube, o sea lo que usa la familia— tiene
> `https://epetplace-pagos-stg.vercel.app`, y **responde HTTP 200**. *El arco de
> pagos está sano; lo que hay es un worktree de una pista cerrada con su banco
> adentro.*
>
> **Mi hash no distinguía «vieja» de «deliberadamente distinta», y por eso
> sonó más fuerte de lo que el hecho merecía.**

## ①bis · 🔴 Y ESO LE ENCONTRÓ UN DEFECTO A ESTA PROPUESTA, ANTES DE CONSTRUIRLA

**El guard que propuse habría marcado ese worktree en ROJO** — sobre un valor
**correcto y puesto a propósito**. Es exactamente el modo de falla que este mismo
documento dice evitar: *un guard que grita donde no aplica enseña a ignorarlo.*

⇒ **Condición de diseño que sale de acá, y que pido firmar con lo demás:** el
mecanismo tiene que admitir **valores locales declarados** — una marca en el
propio `.env.local` (`# banco: <razón>`) o una lista de variables exentas por
worktree. **Sin eso, el guard nace enseñando a ignorarse.**

*El censo por hash sirvió igual, y esto es lo que de verdad probó: **detectó una
diferencia real y no supo interpretarla**. Un instrumento que compara valores
sin saber qué significan encuentra desacuerdos, no defectos.*

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
3. ☠️ ~~Lo urgente de `EXPO_PUBLIC_PAGOS_ALTA_URL`~~ — **CERRADO al medirlo**:
   no hay nada que firmar. El secret de EAS tiene la de Vercel, responde 200, y
   los binarios de nube llevan la correcta. Lo otro es el banco local de una
   pista cerrada. **Queda como higiene, no como riesgo.**
4. 🔴 **La condición de ①bis:** que el mecanismo admita valores locales
   declarados. *Sin eso nace enseñando a ignorarse.*
