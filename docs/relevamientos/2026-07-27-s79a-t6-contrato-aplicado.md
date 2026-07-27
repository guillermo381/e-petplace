# S79-A · T4.6 EJECUTADA — EL CONTRATO APLICADO + EL INVARIANTE (acta, 27 Jul 2026)

Liberada por el GATE EN DISPOSITIVO del founder (el alta completa contra
Paseos Shyris `8026077e…`: sala de espera · Places · radio escrito por él ·
activación · la carta con su firma · el HOY en preparación · la carta no
vuelve). 76(f2) rigió · CERO push · proyecto `zyltipqscdsdsxnjclhp` ·
76(g) declarada en las TRES migraciones (NO RIGE en todas — DDL sin
backfill, sin anclas) · reversas escritas ANTES de aplicar, las tres.

## LOS CINCO PASOS DEL CONTRATO, EN ORDEN

1. **Pre-check de bodies vivos** (lo manda el preámbulo): el
   `COALESCE(…,5)` seguía en `crear_prestador_inicial` ✓ ·
   `obtener_paseadores_disponibles` seguía con 3 parámetros ✓ · las
   columnas nuevas no existían ✓.
2. **CONTRATO APLICADO** (migración `20260727200000` — generada POR COPIA
   del archivo firmado desde su primer `begin;`, no re-tipeada): las
   columnas (`proposito` · `direccion_envio` · `primer_ingreso_en`) ·
   la caída del DEFAULT 5 y del COALESCE · el AND geográfico del paseo ·
   `registrar_primer_ingreso` (v1.1 + condición `estado='activo'` de la
   firma) · **los privilegios por COLUMNA** (primer uso en la casa).
3. **`gen:types` en sync** (dos pasadas: post-contrato y post-hermanas).
4. **Fixture §9.5: 12/12 con ROLLBACK y residuo 0** (6 prestadores, 6
   cuentas, cero filas de fixture, cero propósitos vivos):
   F1 el DEFAULT del radio murió · F2 sin-negocio recibe respuesta
   normal, jamás excepción · F3 invitar persiste propósito+envío y el
   radio nace NULL · F4 el titular PENDIENTE no estampa la ceremonia ·
   F5 EL INVARIANTE (abajo) · F6 la ceremonia estampa UNA vez y trae el
   propósito · F7 el CHECK sigue estructural (malformado rebota) · F8 la
   suspendida no se reactiva (`cuenta_no_activable`) · F9 `proposito` y
   `direccion_envio` dan `permission denied` a authenticated y el resto
   de columnas lee · **F10 EL DISCRIMINADOR DE LA FIRMA: sin geo del
   cliente = 1 resultado (Andres) · con geo = 0 — el paseador sin
   coordenadas DESAPARECE de la oferta**.
5. **LAS TRES HERMANAS EN LA MISMA TANDA** (migración `20260727210000`,
   L-141 cumplida: los tres bodies leídos ENTEROS antes y archivados
   verbatim en la reversa): grooming · adiestramiento · veterinaria
   ganan el MISMO AND (SIN COALESCE, transición §2.3 idéntica), con
   DROP explícito por cambio de firma (L-119) y ACL re-establecida
   (L-140, verificado sobrecargas=1 ×4 y anon=0 ×4). **Cero ventana en
   que paseo filtre y los otros tres no.** + `invitar_prestador` ganó
   `p_proposito`/`p_direccion_envio` (LETRA_ALTA §5 ✅).

## EL HALLAZGO DEL GATE — el invariante, con la colisión DECLARADA

**Medido primero (lo manda el mandato): NO existe ninguna RPC de
activación de `cuentas_comerciales`** — el legado lo hacía a mano; el
voto (a) no pisa ningún camino vivo.

**Y la medición destapó una colisión que se DECLARÓ antes de ejecutar:**
`chk_datos_bancarios_validos` exigía las 7 claves bancarias para cuenta
`activa` — ejecutar el voto (a) tal cual REBOTARÍA (Shyris tiene `{}`).
El CHECK nació con la premisa del wizard legado (bancarios ANTES de la
activación admin); esa premisa murió con DOS decisiones firmadas del
founder (el voto (a) + LETRA_ALTA §4 "bancarios al primer cobro").
**Resolución fiel a ambas** (migración `20260727190000`): el CHECK pasa
a **VACÍO-O-COMPLETO** — `{}` legal (todavía no los dio), malformado
SIGUE rebotando (F7: la validación estructural de Decisión M queda
entera). La exigencia de completitud se muda al arco de pagos
(liquidación real). Enmiendas depositadas: `MODELO_FINANCIERO` Decisión
M (nota S79) + `LETRA_ALTA_S79` §4bis (con la letra del founder:
**si algún día hay registro self-service, la validación fiscal vuelve a
ser gate propio**).

`activar_prestador` v2: activa la cuenta `pendiente_validacion` en la
MISMA transacción (F5: prestador activo + cuenta activa + `activado_en`,
con bancarios `{}`); `suspendida`/`cerrada` REBOTAN (`cuenta_no_activable`
— reactivar es §7.7, jamás efecto colateral); ya-activa = no-op honesto.

**⚠️ LA FILA VIVA DE SHYRIS: pendiente de UN comando del founder.** El
gate lo corrió con activar v1, así que su cuenta sigue
`pendiente_validacion` (invisible en oferta). La cura es re-correr el
veredicto con la v2 (re-estampa `aprobado_*`, activa la cuenta):

```sql
BEGIN;
SET LOCAL request.jwt.claims = '{"sub":"75d0798a-ea90-4a97-a2f2-74f3234d892a","role":"authenticated"}';
SET LOCAL ROLE authenticated;
SELECT activar_prestador('8026077e-XXXX-…el-uuid-completo…', 'activo');
COMMIT;
-- esperado: {"ok":true, "estado":"activo", "cuenta_estado":"activa"}
```

## EL PUENTE ASYNCSTORAGE — retiro CONFIRMADO como pedido a B, con su llave entregada

Medido: el puente vive en territorio B (`apps/prestador/src/lib/bienvenida.ts`
+ `bienvenida-dia1.tsx`), DECLARADO como puente en su propio boceto M1.
**La llave para matarlo quedó en `main`: el wrapper `registrarPrimerIngreso()`**
(`@epetplace/api`, typecheck verde en los tres paquetes) — devuelve
`{esPrimerIngreso, primerIngresoEn, proposito}`: B reemplaza el
AsyncStorage por UNA llamada en la raíz del portal, y de paso gana el
propósito para la bienvenida (*"Vos nos dijiste: …"*) sin lector extra.
El retiro es commit de B (su territorio); registrado acá.

## OPERATIVO

- **3 migraciones aplicadas** (`190000` invariante · `200000` contrato ·
  `210000` hermanas+invitar) — reversas en
  `docs/relevamientos/2026-07-27-s79a-REVERSA-{invariante-cuenta,letra-perfil,hermanas-geo}.sql`
  (la del invariante con su nota: restaurar el CHECK viejo exige decidir
  qué hacer con cuentas activadas-sin-bancarios).
- **Docs:** LETRA_PERFIL → estado CONTRATO APLICADO (§7 sigue propuesta,
  única excepción viva) · LETRA_ALTA → §4bis nuevo + §5 cumplido ·
  FINANCIERO → nota de enmienda en Decisión M.
- **Typechecks:** api · prestador · cliente VERDES. `gen:types` en sync.
- La regla de privilegios por columna del canon (skill `epetplace-db`,
  T4.5) queda VIGENTE desde hoy — ya no es "cuando el contrato aplique".

## LO QUE QUEDA (sin maquillaje)

1. **Shyris**: el comando de arriba, mano del founder.
2. **El QUIÉN de las apps todavía no PASA coordenadas** — las lectoras
   aceptan `p_lat/p_lon` y ningún caller los envía (los wrappers de
   reserva siguen con su firma vieja, legal por DEFAULT NULL). El filtro
   se enciende cuando el flujo de reserva pase la ubicación del hogar —
   tanda propia (cliente, con `obtenerDireccionHogar` que ya devuelve
   lat/lon). Declarado, no accidental: construir-sí-encender-cuando-
   el-caller-llegue.
3. **§7 vencimientos**: propuesta con gate propio (única excepción de la
   firma).
4. **T5.2/T5.3 (la invitación de verdad)**: siguen esperando el OK de la
   mesa sobre el tamaño reportado en T5.1.
5. **Pedidos a B vivos**: D-559 (sector) · D-560 (lista blanca de la
   sala) · el retiro del puente AsyncStorage con el wrapper nuevo.
