# TRASPASO · PISTA A (conductora) · S103 · 22-ago-2026

> ## 🔴 LEY DE LECTURA — se lee ANTES que el contenido
>
> **Esto es un MAPA DE DÓNDE RETOMAR, no una fuente de datos vivos.**
>
> Todo número, SHA, conteo o estado que leas acá **se re-mide contra el objeto
> en el turno en que lo uses** — y al usarlo, **declarás contra qué objeto
> mediste**. *`main` local, `origin/main` y un `ls-remote` son **tres preguntas
> distintas**, y las tres devuelven un sha con cara de verdad única.*
>
> **Esta sesión se cobró esa confusión CINCO veces** (`L-351`), incluida una en
> la que afirmé que un OTA llevaba trabajo que no llevaba. **La regla operativa:
> cuando tu medición contradice a alguien, la sospechosa es la TUYA hasta saber
> contra qué midió cada uno.**
>
> Y su gemela, que también se cobró acá: **un conteo en un documento vence solo**
> (`L-361`). Donde puedas, **corré el comando en vez de citar el número.**

---

## §1 · EL RECURRENTE — APLICADO, Y CON UN CABLE FALTANTE

### Lo que quedó VIVO en la base (verificado tras aplicar)

| pieza | qué hace |
|---|---|
| **cuarto sujeto** | `pagos_intentos` admite `pedido · cita · recurrencia · suscripcion_servicio_id`, invariante «exactamente uno» de CUATRO |
| `recurrencia_desglose` · `suscripcion_desglose` | el monto **congelado por período**, uno por cobro |
| `recurrencias_vencidas_pendientes()` | **la base ELIGE y CONGELA** — no cobra |
| `planes_vencidos_pendientes()` | ídem para el plan de paseos |
| `verificar_compuertas_recurrencia(uuid,date)` | las compuertas del sujeto, **cuatro evaluadas + dos declaradas** |
| `renovar_plan_cobrado(uuid,date)` | **ACTO 2** — lo dispara la plata, exige intento `aprobado` |
| `obtener_serie_recurrente(uuid)` | **el lector de C**, en la forma exacta de su contrato |
| `ejecutar_recurrencias_vencidas()` | **el cron: un timbre**, `net.http_post` a la edge |

**Migraciones:** `20260822235000` (el motor + el arnés adentro) · `20260822236000`
(el corte del camino viejo). **Snapshot bajo veda: `2026-08-22 22:15:02 UTC` /
`17:15:02 Guayaquil` — intentos 44 · series 0 · suscripciones_plan 1 · tarjetas 7
· citas_de_plan 49. RESIDUO CERO en las cinco, verificado post-aplicación.**

### 🔴 EL CABLE QUE FALTA — y lo encontró `P-CIRCUITO` a los diez minutos de nacer

```
recurrencias_vencidas_pendientes → 0 llamadores
planes_vencidos_pendientes       → 0 llamadores
renovar_plan_cobrado             → 0 llamadores
app_config: recurrente_vivo · url_cobro_recurrente · secreto_despacho → NINGUNA existe
```

> **El motor entero está aplicado, con cuatro cinturones verdes y 17 asserts
> verdes, y NADA LO LLAMA.** *Los gates miden la pieza; ninguno puede notar que
> falta el cable.*

**Para enchufarlo hacen falta TRES cosas, y ninguna es código nuevo:**
① **la edge `pagos-cobro-recurrente`** (la hermana — territorio D/A, no escrita) ·
② **las tres claves de `app_config`** · ③ **el cron apuntando al selector**.

⚠️ **Y el ACTO 2 necesita su cable propio: el actuador debe llamar a
`renovar_plan_cobrado` cuando confirma un intento de suscripción.** *Hoy no lo
hace — es la misma clase de `L-393` esperando a que alguien la enchufe.*

### Lo que YA se neutralizó, y por qué no podía esperar

**`cerrar_y_renovar_planes` renovaba SIN COBRAR** —`v_pagado_en := now()`,
`pago_simulado: true`, citas confirmadas— **con su cron ACTIVO a las 08:00
diarias.** **Cortada la rama** (`20260822236000`), conservando **el aviso de 72 h,
la gracia y el crédito**.

> ⚠️ **CONSECUENCIA DECLARADA: hoy los planes NO se renuevan solos — VENCEN.**
> *Es peor servicio y es honesto; lo otro era regalar un mes de paseos.*
> **Se cura enchufando el motor nuevo, no revirtiendo esto.**

### 🔴 LO QUE EL ARNÉS **NO** PRUEBA — se lee antes de festejar

**NO SE MOVIÓ UN CENTAVO.** La función que habla con el proveedor **no está
desplegada**; el arnés escribió el estado que ella escribiría.

**No probado:** que el proveedor acepte o rechace de verdad · **el aviso al
cliente** (sigue en sombra) · **y la CAUSA FINA de un rechazo** — 🔴 *espera la
tabla de `status_detail` de Erick. **Cajón construido, etiqueta NO adivinada.***

### El arnés falsó CINCO supuestos míos, y dos eran fatales

*Ninguno lo había falsado releer.* ① dos columnas mal nombradas · ②
**`estado_vida` vale `'activa'`, no `'vivo'`** — mi fusible habría frenado **todos
los planes** · ③ **el orden congelar/verificar estaba invertido** — la compuerta
miraba un desglose inexistente ⇒ **nunca habría cobrado** · ④ el vocabulario de
`pagador_origen` no admitía `'recurrencia'` · ⑤ **mi propio cinturón midiendo su
lápida** (`L-170`).

---

## §2 · DEUNA — una sola llave

**Todo lo del riel está medido contra EL TIPO y LA COSTURA, jamás contra una
respuesta real del proveedor. 51 verdes no es circuito probado.**

| | |
|---|---|
| actuador multiproveedor | ✅ **vivo**, lee `info` (la verdad verificada), fail-closed sin ella |
| wrapper `pagos-deuna` | ✅ en `main`, 3 funciones + 3 tipos, contrato en `docs/CONTRATO_WRAPPER_DEUNA.md` |
| pantalla de C | ✅ construida, cinco familias de fallo caminadas |
| **`pagos-deuna-solicitud`** | 🔴 **ESCRITA Y NO DESPLEGADA** |
| **bloqueante ÚNICO** | 🔴 **el `pointOfSale`** |

**Pendiente con ventana propia: `N3` + el redeploy de `pagos-conciliar` EN LA
MISMA** — N3 cambia una firma que `pagos-conciliar` todavía llama. **Y ahí entra
la línea del `info: {}`** que D dejó redactada en su bitácora.

⚠️ **El typo del proveedor es REAL: `idTransacionReference`** — *Transacion*, no
*Transaction*. **Quien lo «corrija» rompe todas las consultas.**

---

## §3 · EL CICLO DE CUENTA — censado, con P15 firmada

**Censo:** `docs/relevamientos/2026-08-22-s103-CENSO-CICLO-DE-CUENTA.md`.

> **El ciclo no está roto: está AUSENTE, y lo dice.** *Ninguna divergencia de
> promesa al usuario — «va a estar acá» y «Pronto» no prometen y fallan.*

| | cliente | prestador |
|---|---|---|
| cambiar clave | ❌ *(C montó la pantalla — gate pendiente)* | ✅ |
| cambiar correo | ❌ | ❌ |
| cerrar cuenta | 🟡 voz honesta | 🟡 voz honesta |
| invitar a la familia | 🟡 «Pronto» | — |

**`P15` FIRMADA** (`POLITICAS_EPETPLACE` §P15): **cerrar la cuenta la vuelve
INALCANZABLE, no destruye el registro.** Su argumento medido: **62 FKs a
`auth.users`, 24 BLOQUEANTES** —`pagos_intentos`, `pedidos`, `compras`,
**`consentimientos`**— **y 21 CASCADE**. *Un `DELETE` rebota; forzarlo a CASCADE
se llevaría los consentimientos.*

⚠️ **`7.8` sostiene la mitad MECÁNICA de P15 y NO la legal** — su literal dice
sólo *«no se borra… usar estados»* y **jamás menciona anonimizar**. **Enmendarla
es firma del founder.**

**La máquina de invitación EXISTE, construida para el otro actor**
(`empleado_invitaciones` + 6 RPCs). *El molde sirve; el ALCANCE es letra.*

---

## §4 · LA PRÁCTICA NUEVA · `P-CIRCUITO`

**Al cierre de TODO frente, antes de darlo por cerrado: inventario de punta a
punta que declara PIEZA POR PIEZA si está ALCANZABLE DESDE AFUERA.** *No «si
existe». No «si pasa sus tests».*

**Tres estados y ninguno es «verde»:** ALCANZABLE (con su llamador nombrado) ·
ESCRITA Y NO ALCANZABLE · **NO MEDIDO** *(se escribe; omitirlo lo vuelve
indistinguible de alcanzable)*.

**Sus cuatro casos, cuatro territorios, el mismo día** (`L-393`): el barrido con
24 tests verdes y **ningún `index.ts`** · **`destacada: true` aceptada y NO-OP**
tres semanas con 52 reglas verdes · **`promesaPorVendedor` con cero
consumidores** · y **seis códigos con contrato, tipo y voz, jamás ejercidos**.

> **A las cuatro las encontró RECORRER EL CIRCUITO. A ninguna, un gate.**

---

## §5 · RAMAS Y OTA

**Pendiente de merge (medir su ancla contra el objeto, jamás contra un mensaje):**
`pista/s103-b-jueces` (monorepo) y `pista/s103-b` (sitio) — B pidió los dos.
**Y el OTA queda de A, con autorización del founder: todo lo visual de S103-B
espera ahí.**

**La práctica del publish, adoptada tras el error de esta sesión:** *la lista de
lo que lleva un OTA se MIDE por ancestría contra el ancla, pista por pista, y va
en el mensaje con su resultado* — **no «lleva lo de C», sino `49a831d3 → SÍ`**,
con control negativo.

---

## §6 · TRAMPAS DEL ENTORNO — no se deducen leyendo el repo

**🔴 LA MÍA, cuatro veces en un día:** una cadena que empieza con
`cd <worktree>` **arrastra TODO el comando al worktree**. Ahí `main` no está
checkouteado, el `git merge` corre **contra la propia rama** y devuelve
**«Already up to date»** — *lo mismo que diría un merge correcto sin nada que
traer*. **Las cuatro se recuperaron midiendo el SHA después, y eso es
RECUPERACIÓN, no defensa.** ⇒ **usá `node scripts/merge-a-main.mjs <rama>
"<msg>"`**, que verifica el sitio ANTES de correr (mide la FORMA de `.git`:
directorio vs archivo) y exige que `main` se haya movido.

**`eas-cli` SIEMPRE desde `apps/<app>/`, aunque sólo estés MIRANDO** — corrido
desde la raíz **scaffoldea un `app.json` stub**, y un árbol sucio saca el ancla
con asterisco. **Pasó otra vez hoy.**

**El `db query` devuelve SOLO la última sentencia** ⇒ una consulta, con
`jsonb_build_object`.

**`RAISE NOTICE` no llega al reporte del cliente SQL** — si querés que el gate
muestre lo recorrido, **escribí a una tabla temporal y hacé `SELECT`**.

**`pg_get_functiondef` devuelve LOS COMENTARIOS** ⇒ un cinturón que busca un
literal **se dispara contra su propia lápida** (`L-170`). Strip antes de medir.

**Metro puede NO rebundlear** — *«la pantalla se ve bien, sólo que es la vieja»*.
**Contá los `Bundled` del log**, y arrancá con `--clear` si dudás.

**Sin `.expo/types/router.d.ts` la validación de rutas se APAGA y el typecheck
da VERDE** (`L-391`). **Verificá que el archivo exista antes de creerle.**

**El aparato se duerme y queda BLOQUEADO** — `KEYCODE_WAKEUP` lo despierta pero
**no lo desbloquea**, y los toques a ciegas caen en la pantalla de bloqueo.
*Terminé en el marcador de emergencia; verificado `mCallState=0`.* **Leé la
captura antes de tocar.**

**Protocolo del aparato entre pistas:** cada una su puerto, **`--remove tcp:<mío>`
y JAMÁS `--remove-all`**, y **se avisa al soltar Y AL RETOMAR**.

---

## §7 · LO PRIMERO PARA LA SUCESORA

1. **🔴 Enchufar el recurrente** — la edge hermana, las tres claves, el cron, y
   **el actuador llamando a `renovar_plan_cobrado`**. *Sin eso el motor entero es
   `L-393`.*
2. **El inventario de circuito** completo del frente, con sus tres estados.
3. **El merge de las dos ramas de B y el OTA**, con la ancestría medida.
4. **El ciclo de cuenta**, completo y no a medias (firma del founder).
5. **Y el corte semilla/real** antes del soft launch — 138 citas `pago_simulado`,
   series y pedidos de prueba. **Ya firmado, sin ejecutar.**
