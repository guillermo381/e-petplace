# SERVIDO AL FOUNDER · la rotación de la key de Maps, curada en TODOS sus lugares

> S109-D · 31-ago-2026. **La key nueva no pasa por acá: los comandos los corrés
> vos.** Lo que este documento aporta es **dónde** hay que ponerla — medido, no
> recordado.

---

## ⓪ 🔴 PRIMERO, LO QUE PASÓ Y HAY QUE SABER ANTES DE SEGUIR

**Las dos builds de nube ya salieron, con la key muerta horneada adentro.** Se
lanzaron con la confirmación de que las restricciones estaban cargadas —antes de
que apareciera la rotación— y **terminaron antes de que pudiera cancelarlas**:

```
cliente    911ebe22…  FINISHED
prestador  23d127af…  FINISHED   (01:21)
```

⚠️ **NO INSTALARLAS.** Su mapa no va a dibujar, y si se prueban se leería como
que la cura falló. *Un binario con una credencial muerta no falla al construirse:
falla en la mano de quien lo usa.* Quedan como evidencia de la rotación y nada
más; las buenas son las que se lancen **después** del paso ①.

---

## ① EL SECRET DE EAS — en las DOS apps *(lo corrés vos)*

Es `secret` en el environment **`development`**, que es el que usan **los dos
perfiles** (`development` y `preview`). **El `.env` local no lo alcanza: el
secret se cargó una vez y no se actualiza solo.**

```bash
cd ~/proyectos/ePetPlace/e-petplace/apps/cliente
npx eas-cli env:update development --variable-name GOOGLE_MAPS_API_KEY \
  --value 'LA_KEY_NUEVA' --visibility secret

cd ../prestador
npx eas-cli env:update development --variable-name GOOGLE_MAPS_API_KEY \
  --value 'LA_KEY_NUEVA' --visibility secret
```

*(Si `env:update` pide algo más, el equivalente seguro es `env:delete` y después
`env:create` con `--visibility secret` — **el tipo importa**: si queda
`plaintext`, la key se vuelve legible en la UI de EAS.)*

**Verificación, que no expone el valor:**

```bash
npx eas-cli env:list development | grep GOOGLE_MAPS_API_KEY
# tiene que decir: ***** (This is a secret env variable…)
```

---

## ② LOS `.env.local` — **TRES lugares, no uno**

Medido: la key vive en `apps/prestador/.env.local` de **tres worktrees**, y
`.env.local` **no está en git**, así que cada copia es independiente y **ninguna
se entera de que las otras cambiaron**.

| worktree | archivo |
|---|---|
| `e-petplace/` (principal) | `apps/prestador/.env.local` |
| `e-petplace-s106-a-t2/` | `apps/prestador/.env.local` |
| `e-petplace-s99-d/` | `apps/prestador/.env.local` |

⚠️ **`apps/cliente/.env.local` NO tiene la key en ninguno** — dato que vale por
sí solo: **una build local de cliente nunca hornearía key de mapas.** Si alguna
vez tu binario local de cliente tuvo mapas, no salió de ahí.

*Los worktrees viejos son los más peligrosos: nadie los mira, y el día que
alguien buildee desde uno se lleva la key muerta sin que nada avise.*

---

## ③ DÓNDE **NO** ESTÁ — censado para no perseguir fantasmas

- **Ninguna edge function** la usa (`supabase/functions` → 0).
- **`e-petplace-admin`** → sin rastro.
- **`e-petplace-B` y `e-petplace-C`** → mencionan **el NOMBRE** de la variable en
  `CLAUDE.md` y relevamientos, **no un valor**. Verificado buscando el prefijo
  `AIzaSy`: **cero**. *No hay ninguna key en texto plano en documentación.*
- **`e-petplace-prestadores/google-services.json`** → es **Firebase**, otro
  servicio y otra credencial. **La rotación de Maps no lo toca.**

---

## ④ Y RECIÉN DESPUÉS, LAS BUILDS

Con ① hecho, lanzo las dos desde `main` en 1.0.7 y **verifico el manifiesto de
cada APK antes de que las instales**. La firma ya está cargada (cliente
`3331ac30…` · prestador `498da5e3…`), así que **esta vez las dos condiciones
—key viva y firma autorizada— van a estar juntas por primera vez.**
