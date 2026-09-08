# S114-A · EL ASIENTO DE PRUEBA DE LA CASA — cómo se usa

> **A, 7-sep-2026 (adenda 13).** El sujeto que le faltaba a tres pistas: A no
> podía recorrer `caso_resolver` por PostgREST, F no podía probar el rojo del
> permiso, E declaró el asiento de la casa sin ejercer. Ahora existe.

## Qué es

| | |
|---|---|
| email | `casa-prueba-s114@epetplace.dev` |
| user_id | `a0d19727-f61c-4629-b39c-1b337730b84f` |
| rol | fila en `admin_users` con `rol='casa'`, `activo=true` ⇒ **`is_admin()` da true** |
| clave | **en el llavero**: `epetplace-cuenta-casa-prueba` (email en `acct`, clave en el secreto) |

**Es una sesión de USUARIO real, con password — no `service_role`, no bypass.**
`is_admin()` la reconoce porque tiene su fila en `admin_users`, igual que
cualquier persona de la casa. Verificado: abre sesión por
`/auth/v1/token?grant_type=password` y `rpc('is_admin')` devuelve `true`.

## Cómo se usa en un arnés

```js
import { execSync } from 'node:child_process';
const kc=(s,email=false)=> email
  ? execSync(`security find-generic-password -s ${s} | grep '"acct"' | sed 's/.*="//;s/"$//'`,{encoding:'utf8'}).trim()
  : execSync(`security find-generic-password -s ${s} -w`,{encoding:'utf8'}).trim();

// email y clave se leen del llavero AL MOMENTO, jamás se imprimen (D-1035)
const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method:'POST', headers:{apikey:anon,'Content-Type':'application/json'},
  body: JSON.stringify({ email: kc('epetplace-cuenta-casa-prueba', true),
                         password: kc('epetplace-cuenta-casa-prueba') })});
const casa = await r.json();   // casa.access_token → Bearer con is_admin=true
```

**La cuenta de prueba también es una credencial** (`D-1035`): se lee del llavero
al momento, no se imprime ni enmascarada, y no se escribe inline en ningún
arnés.

## El arco que desbloquea, ya recorrido

`scripts/s114/verify-arco-caso-completo.mjs` — **7/7 por PostgREST real**:
familia abre → la casa resuelve (con esta cuenta, `is_admin`, no bypass) →
familia elige saldo → se acredita 4 → un tercero no ve el caso.

## Para las tres pistas

- **A** — ya recorrió `caso_resolver` por camino real (era lo que le faltaba a A4).
- **E** — puede sacar el asiento de la casa de «declarado sin ejercer».
- **F** — puede probar el rojo del permiso del gate de resolver con la familia
  (que NO es admin: `caso_resolver` le devuelve `no_podes_resolver`) contra esta
  cuenta (que SÍ resuelve).

## ⚠️ Es de PRUEBA. No va a producción.

`rol='casa'` en `admin_users` la hace admin de verdad sobre la base de
staging/pruebas. **Antes del soft launch se desactiva** (`activo=false`), igual
que las sondas de S92. Queda declarado acá para que no sobreviva por olvido.
