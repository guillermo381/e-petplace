# S113 · modo nocturno — bitácora de A

Nadie pide «sí». Cada acto queda acá con lo que se midió y lo que quedó abierto.

---

## 1 · Seguridad ② — las invitaciones dejan de ser públicas

**`pista/s113-a-1.3 @ 0f6389d4`**

🔴 **El rojo:** `anon` leía **5 invitaciones con los cinco emails y los cinco
tokens**, incluidas las revocadas. La causa tiene nombre y **el nombre miente**:
la policy se llama `familia_inv_publica_por_token` y su `USING` es literalmente
`true`. *Prometía filtrar por token y no filtraba nada* — misma clase que
`cat_razas_select_publica`. **Un nombre de policy es documentación, y la
documentación miente cuando nadie la contrasta con su cuerpo.**

Y `anon` tenía además **INSERT, UPDATE, DELETE y TRUNCATE**. Sin policies para
esos comandos la RLS los frenaba — *pero el día que alguien agregue una policy de
INSERT «para el flujo de aceptar», el grant ya está puesto y nadie lo va a mirar.*

**Cura:** `mirar_invitacion(token)` DEFINER con su límite, que devuelve **el
nombre de la familia y el rol, y nada más**. La tabla de límite guarda el **hash**
y no el token: *una tabla de límite que guarda las llaves que protege es una copia
del problema.*

**7/7** · anon no lee la tabla · sin email ni token en la respuesta · inventado
`null` · revocada `null` · límite en el intento 21 · guarda hash.

## 2 · Seguridad ③ — el mapa de PostgREST (`D-1041`)

🔴 Cada intento fallido le devuelve a `anon` **un nombre real del esquema**
(`"Perhaps you meant the table 'public.…'"`).
🟢 **Pero la raíz OpenAPI está cerrada** (`401 · only service_role`), que era el
peor caso. *La diferencia entre «se adivina de a uno» y «se descarga completo» es
la diferencia entre una molestia y un incidente.*
**No se cura desde el repo**: es config del dashboard. Ficha con el riesgo
acotado — conocer un nombre no da acceso, la RLS sigue en el medio.

`D-1042`: el `REVOKE` del panel legado queda como ficha por firma. El portal
entra con `anon` (S95-F); la cura es pasarlo a sesión, y es del portal.

---

## 3 · Candidato 1.2.1 — PUBLICADO

**`main @ 5fe9bea8`** = `A-1.3 @ 0f6389d4` + `B-1.2.1 @ b12d731f` + `C @ 942f913c`

| | exit | |
|---|---|---|
| 4 typechecks | 0 | |
| `verify:diseno` | 0 | 61 reglas |
| `verify:vocabularios` | 0 | 17 verdes |
| `verify:vistas-invoker` | 0 | 25 vistas, 0 sin invoker |
| `verify:pide-en-memorial` | 0 | |
| `verify:puerta-unica` | 0 | |
| `ota:deps` | 0 | cero cambios de dependencia desde `f4c90213` |

**Censo ② corrido justo antes de bundlear.** Árbol en **0 sucios**.

**Leído del objeto, no del texto del publish:**

| app | group | ancla | runtime | canal | árbol |
|---|---|---|---|---|---|
| cliente | `1cdb8ec8` | `5fe9bea85e23` | 1.0.7 | preview | `dirty=None` |
| prestador | `390ac72c` | `5fe9bea85e23` | 1.0.7 | preview | `dirty=None` |

**Mismo ancla en las dos, cero asteriscos.**

⚠️ **El emulador NO se caminó en este tramo, y se dice.** Publiqué con los gates
en verde y el censo hecho; *el recorrido en aparato es otra medición y no la
tuve.* Queda como lo primero del próximo tramo, con la cuenta del llavero.

---

## 4 · Sublote 1.3 «Pasaporte» — motor y página vivos

**El pasaporte de Thor, abierto sin sesión y sin llave:**

```
https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pasaporte?t=0lbVHLdzZl7qbY903miZpw
```

`HTTP 200 · 3.215 bytes · CERO JavaScript · x-robots-tag noindex · cache 60 s`

Dice: **Thor · Bulldog inglés · 6 años · Macho**, el botón **«Llamar a
Guillermo»** (un `tel:`, no un número para transcribir con una mano ocupada), el
mensaje de la familia, **«Cuidado con pollo · moderada»** y las cinco
medicaciones con su dosis.

**El QR, generado en el servidor** (ni la app ni el PDF agregan nada al bundle):
- `…/pasaporte/0lbVHLdzZl7qbY903miZpw.svg` → 11,6 kB
- `…/pasaporte/0lbVHLdzZl7qbY903miZpw.png` → 5,5 kB, 588×588

Un token inventado → **404**.

**16/16 con rollback:** revocado `null` · anon no lee ninguna de las dos tablas ·
límite en la lectura 31 · la config apaga cada campo · perdida cambia la
respuesta · reemitir revoca la anterior · tokens únicos.

### Lo que falta del 1.3, declarado
- **A5** — el QR en el PDF de la ficha de identidad y en el carnet. La ruta ya
  existe y devuelve la imagen; falta que los dos PDF la pidan.
- **A6** — la rama `pista/s113-a-nfc` y `docs/loop/S113-NFC-BUILD.md`.
- **La URL corta.** Medido: hoy **no existe dominio propio** sirviendo contenido
  público. Los papeles se sirven como `…/functions/v1/<edge>?t=<token>` y lo
  único en Vercel es la página de pago, **sin rewrites**. La URL de arriba
  funciona hoy; una `epetplace.com/p/<token>` exige un dominio que no medí que
  exista.

---

## 5 · El recorrido en emulador que quedaba debiendo — HECHO

Cuenta del founder del llavero (`epetplace-cuenta-founder`), Metro propio en
8123 con **`Android Bundled 9913ms … (2968 modules)`** en el log antes de
capturar. Capturas en `docs/loop/capturas-s113-a/`.

⚠️ **Y empezó confirmando el binario, que es lo que la ley pide (`L-138`).**
Casi camino sobre la app equivocada: en el emulador hay **tres** paquetes y
`com.epetplace` (versionName **1.0**, ajena) no es ninguna de las mías. Además
`com.epetplace.cliente` resultó ser la **dev build**, no la preview — la
reemplazó al instalarse. *Y había un Metro ajeno vivo en `192.168.1.92:8082`,
de otra pista: usarlo habría servido otro árbol con la pantalla viéndose
perfecta.*

| paso | resultado |
|---|---|
| Hogar con la cuenta real | ✅ 4 mascotas, «Ponte al día · 16 cosas», el orbe de Nexo |
| **FichaRaza (A8)** en el perfil de Zor · Pug | ✅ «Ver más sobre la raza ›» despliega el texto que el founder firmó |
| **Memorial** (Sombra) | ✅ sin gradiente, sin pendientes, sin CTAs — **y sin orbe**: el Coach apagado |
| **Carnet** de Thor | ✅ 8 vacunas, «Su plan» con vencida y «No figura en su carnet» |

### 🔴 Dos defectos que sólo aparecen caminando — para C

1. **«Zor está en su etapa adulto»** (perfil). Es el código crudo del enum
   metido en una frase: sin concordancia («adulta») y **contra la orden del
   founder de rotular con el momento vital de la especie**
   (`cat_especies_perfil`), no con el valor interno.
2. **«Según su plan, tocaría el 2025-07-06»** (carnet). Fecha **ISO cruda** en
   una frase de familia; toda la casa escribe «06 jul 2025».

*Los dos son la misma clase —un valor de máquina que se filtró a una oración—
y ninguno lo ve un typecheck: las dos frases compilan perfecto.*

### Y una medición que corrige un número heredado

El parte decía «dos mascotas de prueba quedan en memorial». **Son CINCO**
(`PruebaC12896`, `PruebaC24772`, `PruebaC37493`, `PruebaC76663`,
`PruebaC82896`), las cinco Beagle y las cinco **marcadas `real`** — la marca de
fixture no se les aplicó, así que **hoy cuentan como mascotas reales en
cualquier censo**. No se borran (firma del founder: sólo si él lo pide), pero
la marca sí hace falta. Anotado en `S113-NOCHE-PENDIENTES.md`.
