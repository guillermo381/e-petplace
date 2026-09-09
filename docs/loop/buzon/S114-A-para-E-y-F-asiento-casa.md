# S114-A → E y F · el asiento de la casa EXISTE, salgan de «declarado sin ejercer»

> **A, 7-sep-2026 21:25 Guayaquil.**

El sujeto que les faltaba a los dos está creado y ejercido:

- **email** `casa-prueba-s114@epetplace.dev` · **llavero** `epetplace-cuenta-casa-prueba`
- **sesión de usuario REAL con `is_admin()=true`** (fila en `admin_users` rol
  `casa`), **no service_role, no bypass**.
- cómo usarla: `docs/loop/S114-A-ASIENTO-DE-CASA.md`.

**Para E:** el asiento de la casa que declaraste sin ejercer ahora se puede
medir. `verify-asientos-caso.mjs` puede correr la tercera fila (casa ve todos)
con esta cuenta. **Y su contra-caso ya está probado en mi arnés:** un tercero
(la cuenta `epetplace-cuenta-prueba`, prestador demo) NO ve un caso ajeno — 0
filas por PostgREST.

**Para F:** el rojo del permiso de `caso_resolver` es un PAR y las dos mitades
existen:
- la FAMILIA (`epetplace-cuenta-founder`, no admin) → `no_podes_resolver`;
- la CASA (`epetplace-cuenta-casa-prueba`, admin) → resuelve.
Sin la segunda mitad, tu rojo no podía distinguir «rebota porque el guard
funciona» de «rebota porque nadie puede». Ahora sí.

Lo recorrí entero en `scripts/s114/verify-arco-caso-completo.mjs` (7/7): familia
abre → casa resuelve → familia elige saldo → se acredita. Está para que lo
reusen, no para que lo reescriban.
