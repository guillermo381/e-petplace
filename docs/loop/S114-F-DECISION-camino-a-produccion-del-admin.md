# Camino a producción para `apps/admin` — **opciones con su costo medido**

> ## 🔴 Si vas a copiar UNA frase de acá, que sea ésta
>
> **Hoy `apps/admin` no tiene ningún camino a producción, y no es una cosa rota sino tres:
> no está en `main` · el proyecto Vercel del monorepo no construye desde el 6-sep ·
> `admin.epetplace.com` apunta a otro repo.**

**8-sep-2026 · S114-F.** Medición para que el founder firme. **No se construyó nada.**

---

## El piso, medido

| | |
|---|---|
| **`apps/admin` en `main`** | 🔴 **no está** — vive sólo en `pista/s114-f-1.0` |
| **proyecto Vercel del monorepo** | 🔴 **no construye desde el 6-sep**: `turbo run build` levanta todo y `pagos-web` aborta por 3 variables. **Su guard es correcto y no se toca.** |
| **`admin.epetplace.com`** | ✅ vivo, `1,81 MB`, deployment `c78deb15` — **es el LEGADO**, al día |
| **subdominios libres** | `operaciones.` · `casa.` (no resuelven). `pagos.` tiene CNAME cargado y **no responde** (`http=000`) |
| **precedente en la casa** | `apps/pagos-web` tiene su **`vercel.json` propio** (`buildCommand`, `outputDirectory`, `framework: null`) ⇒ *el patrón «un app del monorepo, un proyecto» ya existe* |

### 🔴 Y el dato que condiciona TODAS las opciones

```
apps/admin  ·  deps del workspace declaradas:  NINGUNA
            ·  alias que salen del paquete:    ../../packages/api/src/admin/index.ts
                                               ../../packages/api/src
```

**`apps/admin` no declara `@epetplace/api`: entra por alias relativo.** Compila porque el
monorepo entero está en disco. ⇒ **cualquier opción tiene que garantizar que el build vea
`packages/api/`**, y eso descarta un repo separado sin más.

---

## Las cuatro opciones

### A · Proyecto propio de Vercel, Root Directory `apps/admin`

```
costo    1 proyecto nuevo · Root Directory + Install Command a nivel raíz (pnpm workspace)
         3 variables de entorno · 1 subdominio
riesgo   el alias ../../packages/api SALE del Root Directory
```
✅ **Lo bueno:** *deja de depender de `pagos-web`.* El monorepo puede seguir sin construir
y el admin despliega igual. **Es la única opción que rompe el acoplamiento.**
⚠️ **Lo no medido:** si Vercel con Root Directory copia el repo entero (y el alias resuelve)
o sólo el subárbol. **Se prueba en un deploy y se sabe en 3 minutos** — no antes.
⚠️ **Y no arranca sin la cura de `vite.config`**, que ya está en el repo: sin ella, el
primer deploy sin variables publica el bundle vacío **y nada lo dice** (`L-521`).

### B · Ruta dentro del proyecto actual del monorepo

```
costo    0 proyectos · 0 dominios · arreglar lo que tumba el build
riesgo   hereda el acoplamiento entero
```
🔴 **Exige resolver `pagos-web` primero** — cargar sus 3 variables **en un proyecto que hoy
no le sirve a nadie**. *Y la mesa ya firmó que ese proyecto **se retira, no se acota**.*
⇒ **Invertir ahí es trabajo sobre algo que va a desaparecer.**

### C · Reemplazar el legado en `admin.epetplace.com`

```
costo    0 dominios nuevos · repuntar el CNAME
riesgo   🔴 apaga 12 pantallas que HOY funcionan
```
**Medido, y es lo que la vuelve inviable hoy:**

```
las 27 pantallas del legado:   ✅ 12 andan   🔴 10 rotas (tabla inexistente)   🟠 5 permission denied
la mesa nueva cubre:            Casos (nueva) · Liquidaciones · Login          = 2 de 27
```
⇒ **Apagar el legado hoy cambia 15 pantallas rotas por 25 ausentes.**

### D · Convivencia — un subdominio propio, el legado donde está

```
costo    = A, más elegir un nombre
riesgo   dos portales a la vez durante la transición
```
**Es A + la decisión del nombre.** `operaciones.epetplace.com` está libre y **el `<title>`
de `apps/admin` ya dice «e-PetPlace · Operaciones»** — *el nombre ya existe en el producto.*

---

## El retiro del legado, en el orden que la medición dicta

**No por preferencia: por lo que ya está roto.**

| tanda | pantallas | por qué van primero |
|---|---|---|
| **1 · las que ya no sirven** | `Liquidaciones` · `Dashboard` · `Financiero` · `Sellers` | **están ROTAS** (tablas inexistentes) y **la mesa nueva ya tiene Liquidaciones andando**. *Retirar algo roto no le quita nada a nadie.* |
| **2 · lo clínico muerto** | `MascotaDetalle` · `UserTimeline` · `UsuarioDetalle` · `Citas` | leen `citas`/`vacunas`/`historia_clinica`, **el modelo viejo que el monorepo reemplazó por eventos**. Reconstruirlas es rehacerlas, no migrarlas |
| **3 · las de permiso — YA DESTRABADAS** | `Placas` · `Prestadores` · `PrestadorDetalle` · `Servicios` | ✅ **A entregó** `listar_lotes()` (RPC con `is_admin`) y **dos policies `is_admin()` de SELECT** sobre `prestadores` y `seller_perfil`. *Placas se cablea contra la RPC; las otras tres se destraban **sin tocarlas**.* |
| **3bis · las que parecían de permiso y NO lo eran** | `MascotaDetalle` · `Citas` · `Sellers` · `Productos` | 🔴 **la policy no las salva: leen ADEMÁS tablas que no existen** (`citas`, `historia_clinica`, `seller_comisiones`). **Van con la tanda 2, no con la 3** — su causa es el modelo viejo, no el permiso. *Contarlas como destrabadas sería declarar arregladas cuatro pantallas que van a seguir en blanco.* |
| **4 · las 12 que andan** | `Usuarios` · `Pedidos` · `Promociones` · `Roles` · `Paises` · `Mascotas` · `BetaUsers` · `PlanesPrime` · `Gamificacion` · `Inversores` · `PedidoDetalle` · `Login` | **últimas, y sólo cuando la mesa nueva las cubra.** *Migrar algo que funciona es el único trabajo que puede dejar al founder peor que antes* |

---

## Lo que NO se midió, y hay que saberlo antes de firmar

- **Si Root Directory resuelve el alias `../../packages/api`.** Es el riesgo técnico de A y D,
  y **sólo se sabe desplegando**. *Si no resuelve, la salida conocida es declarar
  `@epetplace/api` como dependencia de workspace — pero eso toca `packages/api`, que es de A.*
- **Cuánto de las 12 «debería andar» anda de verdad.** «Debería» sale de que **ninguna de sus
  tablas está muerta ni cerrada** — *no de haberlas abierto*. Es una cota superior.
- **Si `pagos.epetplace.com` está asignado a un proyecto.** Su CNAME resuelve y no responde:
  eso se ve en el dashboard, no desde afuera.

---

## Mi voto, con su razón

**D (= A + un subdominio propio), y la primera tanda del retiro en el mismo acto.**

*Porque es la única que **rompe el acoplamiento con `pagos-web`** —que es lo que hoy
bloquea todo— **sin apagar nada que funcione**. B invierte en un proyecto que la mesa ya
decidió retirar, y C cambia 15 pantallas rotas por 25 ausentes.*

**Y el primer paso no cuesta nada y descarta el único riesgo técnico:** un deploy de prueba
con Root Directory `apps/admin`. *Si el alias resuelve, D está entera; si no, se sabe antes
de tocar un dominio.*
