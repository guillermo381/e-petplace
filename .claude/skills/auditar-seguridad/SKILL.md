---
name: auditar-seguridad
description: >-
  Censa la superficie de seguridad del proyecto y reporta hallazgos. SOLO
  LECTURA — jamás escribe, jamás cura.
allowed-tools: Read, Grep, Glob, Bash(psql:*), Bash(npx supabase:*)
---

# AUDITORÍA DE SEGURIDAD — e-PetPlace

## LA REGLA QUE GOBIERNA TODO
**Esta skill NO ESCRIBE NADA.** Ni migraciones, ni código, ni docs.
Produce un CENSO y se detiene. Curar es de `/curar-hallazgo`, un hallazgo
por vez, con gate del founder.

Si encontrás algo crítico, el impulso correcto NO es arreglarlo: es
NOMBRARLO PRIMERO en el censo. Esta casa ya aprendió que una cura sin
medición previa fabrica deuda.

## QUÉ CENSAR

### ① RLS — la puerta de cada tabla
- Tablas SIN rls habilitada (`pg_class.relrowsecurity = false`).
- Policies con `USING (true)` o abiertas a `authenticated` sin gate.
- Tablas con INSERT abierto y CERO productores (el hueco esperando).
- Policies `ALL` donde debería haber solo SELECT.
- Grants de COLUMNA: quién puede escribir qué columna directo.

Antecedente vivo: `evento_temperamento_observacion` tiene INSERT abierto a
authenticated y cero productores. `puntos_usuario` tuvo policy ALL propia.

### ② SECURITY DEFINER — la familia D-314
Por cada función DEFINER:
- ¿tiene `SET search_path`?
- ¿tiene REVOKE EXECUTE a `anon` y a PUBLIC?
- ¿tiene gate de autorización en el body?
Una DEFINER sin las tres bypasea la RLS de sus tablas.

### ③ TRIGGERS DE GOBIERNO vs COLUMNAS SENSIBLES
Qué columnas protege cada trigger, y cuáles quedan afuera.
🔴 CASO VIVO Y ABIERTO: el trigger cubre `activo`/`rol`/`prestador_id` pero
NO `matricula_profesional` — y una persona puede escribirse su propia
matrícula (policy `empleados_self_actualiza`, medido por fixture). Esa
matrícula SE IMPRIME en receta y certificado como credencial.

### ④ SECRETOS Y TOKENS
- Claves, JWT o service keys en el repo (grep sobre el árbol versionado).
- JWT en URLs (la casa lo prohíbe: el token de documento es quemable, el
  JWT jamás viaja en una URL).
- Secrets del proyecto: cuáles existen, cuáles quedaron sin uso.

### ⑤ LOS BORDES QUE ESTA CASA YA SE PISÓ
- Cuentas internas apareciendo en pools de match o vitrinas.
- Datos de menores acumulando donde no deben (`aportado_por_menor`).
- Mascotas en memorial alcanzables por RPC directa.
- Gates que existen en la UI pero NO en el motor (la UI no es la puerta).

## CÓMO SE REPORTA
Por hallazgo: QUÉ está abierto · CÓMO se midió (query o ruta literal) ·
QUÉ permite hacer en concreto · SEVERIDAD.

Severidad, sin inflar: 🔴 explotable hoy con la anon key · 🟠 explotable
por un usuario autenticado cualquiera · 🟡 requiere condiciones · ⚪ higiene.

**Prohibido el hallazgo teórico.** Si no podés mostrar la query o la ruta
que lo prueba, no es hallazgo: es sospecha, y se marca como tal.

## AL CERRAR
Ordená los hallazgos por severidad y DETENETE. No propongas el fix en el
mismo turno: el founder prioriza, y `/curar-hallazgo` ejecuta de a uno.
