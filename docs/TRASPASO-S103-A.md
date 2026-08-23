# TRASPASO · PISTA A (conductora) · S103 · 22-ago-2026

> ## 🔴 LEY DE LECTURA — se lee ANTES que el contenido
>
> **Esto es un MAPA DE DÓNDE RETOMAR, no una fuente de datos vivos.**
>
> Todo número, SHA, conteo o estado que leas acá **se re-mide contra el objeto en
> el turno en que lo uses** — y al usarlo, **declarás contra qué objeto mediste**.
> *`main` local, `origin/main` y un `ls-remote` son **tres preguntas distintas**,
> y las tres devuelven un sha con cara de verdad única.*
>
> **Esta sesión se cobró esa confusión CINCO veces** (`L-351`), incluida una en
> la que afirmé que un OTA llevaba trabajo que no llevaba. **Regla operativa:
> cuando tu medición contradice a alguien, la sospechosa es la TUYA hasta saber
> contra qué midió cada uno.**
>
> Y sus dos gemelas, cobradas hoy: **un conteo en un documento vence solo**
> (`L-361`) — *donde puedas, corré el comando en vez de citar el número* — y
> **una cifra sin su objeto y su momento es un valor cierto con una frase falsa
> encima** (`L-404`).
>
> **📖 El acta de la sesión, con lo que cerró y lo que no:
> `docs/loop/S103-ACTA-CIERRE.md`.** Este traspaso es lo operativo; el acta es el
> registro.

---

## §1 · LO PRIMERO PARA LA SUCESORA — en orden

1. **🔴 `N3` + el redeploy de `pagos-conciliar` + el guard del `info: {}` VAN EN
   LA MISMA VENTANA.** *No es preferencia:* **`N3` cambia una firma que
   `pagos-conciliar` todavía llama**, y aplicarla sola **deja roto el barrido de
   Nuvei — el que hoy cobra plata real.** D tiene el diff listo y avisa cuando se
   quiera la ventana.
2. **🔴 `D-887` · el aplicador del barrido de DeUna.** Contrato escrito en
   `docs/CONTRATO_APLICADOR_BARRIDO_DEUNA.md`, con `origen='barrido'` ya previsto
   en la columna. **Bloquea el paso 8 del guion del lunes y los dos flips de C.**
3. **🔴 `D-888` · el reverso mismo-día — SIN DUEÑO.** Decisión de mesa; **no lo
   toma nadie por iniciativa.**
4. **El ciclo de cuenta**, completo y no a medias (firma del founder), **con
   `profiles.email` PRIMERO** — ver §3.
5. **El corte semilla/real** antes del soft launch (138 citas `pago_simulado`,
   series y pedidos de prueba). **Ya firmado, sin ejecutar.**

---

## §2 · EL RECURRENTE — completo e INERTE

**Todo el circuito existe** (detalle y medición en el acta §1). **Lo único que
falta no es motor: son las tres claves de `app_config`, y son del founder.**

⚠️ **Lo que hay que saber al tocarlo:**

- **El reloj `cobrar-recurrencias` (09:00 Guayaquil) está VIVO e INERTE.** El
  timbre lee `recurrente_vivo` y sin esa clave no hace nada. **No lo enciendas
  vos: es firma del founder.**
- **La rama de DESPENSA del ACTO 2 está escrita y NUNCA CORRIÓ** — cero
  recurrencias en la base. *El arnés probó la de suscripción.*
- **El plan de paseos NO se puede cobrar** (`D-886`): no registra medio
  autorizado, y la puerta los frena a todos. **Eso es correcto y no se ablanda.**
- **El aviso sigue en sombra**, y cuando salga **lleva monto y medio** (§5 de su
  letra: el monto del aviso ES el del cobro).

---

## §3 · EL CICLO DE CUENTA — censado, con una firma de orden

**Censo:** `docs/relevamientos/2026-08-22-s103-CENSO-CICLO-DE-CUENTA.md`.
**`P15` FIRMADA:** cerrar la cuenta la vuelve **INALCANZABLE, no destruye el
registro** — medido: 62 FKs a `auth.users`, **24 BLOQUEANTES**, 21 CASCADE.

🔴 **FIRMA DEL FOUNDER SOBRE EL ORDEN: `profiles.email` se resuelve ANTES que la
pantalla.** Es una **copia** de `auth.users.email` y **gana** (`miPerfil.ts:37`
lee la tabla primero), y **nadie la escribe desde la app**. Hoy no diverge **por
parálisis, no por diseño** (`L-401`) — *el día que exista el cambio, seis
pantallas mostrarían el correo viejo con el login andando con el nuevo.*

**Lo del reparto de A:** ¿está `double_confirm_changes` encendido en producción?
**El `config.toml` es del entorno local y no prueba nada** — C lo declaró
pendiente y no hecho, **tercera vez que el canon se cobra esa confusión** · la
copia · el wrapper · y **el ensayo con una cuenta solo-Google**, que C no midió y
lo dijo.

---

## §4 · DEUNA — a una llave

**Todo lo del riel está medido contra EL TIPO y LA COSTURA, jamás contra una
respuesta real del proveedor.**

| | |
|---|---|
| actuador multiproveedor | ✅ vivo · **y ahora CORRE** (estaba muerto, ver acta §1) |
| gate de DeUna | ✅ `stoken_valido AND verificado IS TRUE` — **columna, ya no `ILIKE`** |
| el buzón escribe `verificado` | ✅ (D) · con **tres estados: NULL sin veredicto · `false` preguntamos y no confirmó · `true` sólo con `payment/info`** |
| wrapper + contrato + pantalla | ✅ |
| **desplegado** | 🔴 **NADA de `pagos-deuna`** |
| **bloqueante ÚNICO** | 🔴 **el `pointOfSale`** |

🔴 **SON DOS FLIPS, NO UNO.** Poner `DEUNA_ELEGIBLE = true` **enciende la fila y
NO conecta la pantalla**: `useEstadoDeUna` sigue con el cuerpo de `ENSAYO`.
*Quien flipee sólo el primero va a ver la fila encendida y una pantalla que
simula — y el lunes eso se lee como «DeUna anda» hasta que alguien mire la base.*

**Las tres reglas de encendido viven en `LETRA_DEUNA` §13bis**, donde se leen el
lunes.

⚠️ **El typo del proveedor es REAL: `idTransacionReference`** — *Transacion*, no
*Transaction*. **Quien lo «corrija» rompe todas las consultas.**

---

## §5 · TRAMPAS DEL ENTORNO — no se deducen leyendo el repo

**🔴 LA MÍA, CINCO veces en un día:** una cadena que empieza con `cd <worktree>`
**arrastra TODO el comando**, el `git merge` corre contra la propia rama y
devuelve **«Already up to date»** — *lo mismo que diría un merge correcto sin
nada que traer*. ⇒ **usá `node scripts/merge-a-main.mjs <rama> "<msg>"`**, que
verifica el sitio ANTES (mide la FORMA de `.git`: directorio vs archivo) y exige
que `main` se haya movido. **Su auto-prueba corre con `--autoprueba`.**
⚠️ **Y el cinturón cubre el MERGE; la medición de estado sigue a mano** — la
quinta vez fue midiendo, no mergeando.

**El `cd` PERSISTE entre llamadas de Bash.** Usá rutas absolutas, o subshell
`( cd … && … )` — probado que contiene.

**Los delimitadores muerden, dos veces hoy:** el `'''` de SQL termina un string
`r'''…'''` de Python · **y los backticks de un mensaje de commit se EJECUTAN en
el shell** (perdí el nombre de un constraint de un mensaje ya empujado; **no se
reescribe historia publicada por un arreglo cosmético**). ⇒ **heredoc `<<'EOF'`
para todo texto largo.**

**El `db query` devuelve SOLO la última sentencia** ⇒ una consulta, con
`jsonb_build_object`.

**`RAISE NOTICE` sí llega** por `db push`, pero **no por `db query`** — si querés
ver lo recorrido en una consulta, escribí a una tabla temporal.

**`pg_get_functiondef` devuelve LOS COMENTARIOS** ⇒ un cinturón que busca un
literal **se dispara contra su propia lápida** (`L-170`). Strip antes de medir.

**`.expo/types/router.d.ts` es GENERADO y envejece:** una ruta nueva de otra
pista te deja el typecheck en rojo. **Se regenera arrancando Metro en TU puerto
(A=8082) unos segundos.** ⚠️ **Y después probá que el validador está ENCENDIDO
con una ruta inventada** — sin el archivo, la validación se apaga y el typecheck
da VERDE (`L-391`).

**`eas-cli` SIEMPRE desde `apps/<app>/`, aunque sólo estés MIRANDO** — desde la
raíz scaffoldea un `app.json` stub y ensucia el árbol.

**El gate de Deno corre sobre COPIA fuera del repo** (`deno` escribe en
`package.json`). `node scripts/verify-edge-deno.mjs` ya lo hace; **verificá el
md5 de `package.json` después igual.**

**Protocolo del aparato entre pistas:** cada una su puerto, **`--remove tcp:<mío>`
y JAMÁS `--remove-all`**, y **se avisa al soltar Y AL RETOMAR**.

---

## §6 · LO QUE APRENDIÓ ESTA SESIÓN Y VALE PARA LA PRÓXIMA

**Los hallazgos graves no los encontró ningún gate: los encontró RECORRER EL
CIRCUITO.** Y su corrección más útil, que va con `P-CIRCUITO`:

> **No basta «¿está alcanzable desde afuera?» — hace falta «¿CORRIÓ ALGUNA
> VEZ?».** *El actuador de pagos estaba bien escrito, bien leído y alcanzable, y
> nunca había corrido: moría en su primer gate, en toda llamada.*

**Y la que ordena los arneses:** *un arnés que para probar el circuito lo
EJECUTA de verdad es un arnés que hace lo que vino a vigilar* (`L-406`). **El que
escribe corre en subtransacción que se deshace sola; la DDL queda afuera.**

**🔴 Y una que es de gobierno y toca a los 54 jueces (`D-889`):** la ley del
**«solo-baja» vive únicamente en PROSA** — 36 baselines, **cero mecanismos**.
Probado en rojo: bajar un baseline al valor de hoy da **verde y silencio**.
*El edit que desarma el guard y el que lo mejora son indistinguibles sin memoria;
git la tiene y el juez no la consulta.*
