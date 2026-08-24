# S104-A · TRASPASO

> **Un traspaso es un mapa de dónde retomar, NO una fuente de datos vivos.**
> Acá no hay contadores: hay punteros y comandos. **Todo número se re-mide al
> usarlo** (L-166) — la sesión que lea esto va a encontrar el mundo movido, y
> eso es normal, no un error del traspaso.
> **Pista A (conductora) · sesión S104 · cierra 24-ago-2026.**

---

## 1 · QUÉ QUEDÓ EN MAIN

Una línea por pieza. **Los SHA son punteros al commit, no al estado de hoy.**

| pieza | SHA | qué es |
|---|---|---|
| Depósito del plan y la orden + relevamiento de familia | `0d0c2e32` | `MODELO_PRODUCTO` §4 es la letra de familia; su §4.6 ya declaraba su propio drift desde S19 |
| Medición de la copia `profiles.email` | `bb215dfc` | divergencia, escritores, lectores, y el inventario de circuito por huella |
| Poda de worktrees | `5054aafa` | 13 podados con SHA de rama registrado antes y después |
| **La copia deja de mentir** | `de73d0d8` | backfill · espejo `on_auth_user_email_changed` · guard de columna · `miPerfil` lee auth primero |
| Guard de gobierno de empleados curado | `670b74af` | era DEFINER y no frenaba; **D-890** |
| Freno del enlace, hecho estructura | `32917747` | `urlInvitacion()` devuelve `null` mientras está apagado |
| `baja-correo` (edge) | `584f0c3a` | el endpoint que el sitio estático necesita, sin repartir la anon key |
| Los dos censos para el abogado | `4a1cd0c4` | y su corrección posterior en `3896f60c` |
| Freno del enlace **encendido** | `1b4f116d` | con 200 medido y control positivo/negativo |
| Huellas SHA-1 + estado de Google | `da0d2103` | y la precondición de `MODELO_LOGIN` §4 cumplida y medida |
| `iniciarSesionConGoogle()` | `8c87e9b9` | el navegador lo abre la app: `packages/api` sigue agnóstico de Expo |
| **Motor de invitación de familia** | dentro de `7154cc0b` | tabla + 3 RPCs + índices únicos que faltaban |
| Invitación a quien no tiene cuenta | `c77938be` | cola con envío único **por PK**, supresión, baja en un clic |
| D-893 acto ② | `6234a76c` | `confirmarAltaConCodigo()` — el consentimiento se cablea al `verifyOtp` |
| Retención de documentos, dos mecanismos | `50e14896` | + `documento_ultimos4` + el motor de los dos consentimientos del T&C |
| Registros para el expediente legal | `0e0acc77` | constancia del borrado, §6.2, cronograma, transferencia internacional |
| **`flowType: 'pkce'`** | `10c3e2fa` | sin esto el ingreso con Google **nunca podía cerrar** |

**El cron de `despachar-invitacion-correo`**: creado con el patrón del `vault`
(L-408) — el secreto **no viaja en el texto del cron**, verificado. **Cable
primero, llave después:** con `INVITACION_CORREO_VIVO` apagada cada tick
devuelve `invitacion_correo_apagado` y **la cadena se puede verificar entera sin
que salga un correo**.

**Documentos legales depositados** en `docs/legal/` (los tres del abogado + los
dos censos + huellas + registros del expediente).

**Publicado:** dos builds (cliente **1.0.5**, prestador **1.0.6**, se instalan)
y OTA de la tanda 2 sobre esos runtimes. **Los groups vigentes NO se copian
acá**: se leen con `eas-cli update:list` desde `apps/<app>/`, y del **objeto**
con `update:view --json` (nunca del texto del publish).

---

## 2 · QUÉ QUEDA ABIERTO

### 🔴 TANDA 3 COMPLETA — cerrar cuenta y exportar
**Nada de esto está construido.** Hay política firmada (P15) y pantalla que lo
promete; **no hay mecanismo, ni una sola cuenta cerrada contra la cual medirlo**.
Incluye **los DOS borrados que bloquean publicar los legales** —imagen del
carnet de vacunas y fotos/videos de atenciones— que **cuelgan del mismo evento**
(el cierre de cuenta) y por eso **son una sola pieza**.
⚠️ **Consecuencia declarada que va en la pantalla, no solo en el expediente:**
borrar el carnet al cierre **deja sin imagen las impresiones ya generadas**.
Quien cierra su cuenta tiene que enterarse **antes** de confirmar.
**Dueño:** producto. **Bloqueo:** ninguno técnico — es trabajo.

### 🔴 D-900 — el mandato que el sistema no expresa
La figura **está decidida** (§17: mandato de recaudación). **El sistema no la
expresa, y lo grave es que tampoco falla:** mandato y nombre propio producen los
mismos registros. **Disparo: antes de la primera liquidación real**, porque esa
liquidación *es* el primer acto de rendición del mandato.
**Ata con D-897②:** la liquidación no se puede probar sin probar el mandato.

### 🔴 D-897 — los cuatro frenos de producto de los T&C
Reembolso con **devolución real** · liquidación **probada punta a punta** ·
leyenda **«no es factura»** en el comprobante · y **re-verificar §14.4 cuando la
fee del procesador deje de ser cero**. **Los cuatro son de producto, no de
texto:** *no se resuelven redactando mejor.* Están como recuadro de «NO
PUBLICAR» en la cabecera de los propios T&C.

### 🔴 La letra del prestador que se va — ES LETRA, NO CÓDIGO
Tres obstáculos de naturaleza distinta, ya censados: **citas futuras pagadas por
terceros · empleados con acceso · eventos sin liquidar**. **No se construye sin
su letra**, y la letra la escribe la mesa. *Un negocio no se cierra con un botón.*

### 🟡 El biométrico como ENTRADA, no solo candado
Enmienda del founder ya aplicada por C y publicada. **Falta su gate en
dispositivo** (AppState + auto-prompt): *ni el typecheck ni el juez ven ciclo de
vida.* **La construye C.**
⚠️ **Nota latente de C, con su precisión final y NO como alarma:** durante el
login con Google **no muerde**, porque cuando el navegador manda la app a
segundo plano **todavía no hay sesión** ⇒ el candado no aparece. **El único
borde es una CARRERA justo después**: la sesión se crea casi al mismo tiempo que
vuelve el `active`, y el candado podría aparecer **una vez** tras el login con
Google, **solo con biométrico encendido**. Si se manifiesta, la cura es un signo
«en flujo OAuth» que el candado ignore, igual que `enPrompt`. **Borde no
confirmado: se vigila, no se construye.**

**Y el caso que B pide que el founder toque en el gate:** no solo «volver del
segundo plano» sino **abrir la app en frío con sesión guardada**, y sobre todo
**el sensor FALLANDO a propósito** (dedo mojado) — para ver que la salida está y
que al tocarla cae al login.

### Publicar los legales — ✅ UNO PUBLICADO, DOS FRENADOS *(actualizado 24-ago)*

**✅ La Política de Privacidad de las apps ESTÁ PUBLICADA** (S104-C): archivo
inmutable `/legales/privacidad-app/1-1`, `data-epp-version="1.1"`, medido con
control negativo. **El DPA quedó archivado** en `docs/legal/anexo-a/` y **su
evaluación contra las siete condiciones del Art. 21 la entregó el abogado** —
era la pieza que el equipo técnico declaró no poder producir, y no la produjo:
la produjo quien correspondía, sobre `REGISTROS-PARA-EL-EXPEDIENTE.md §5` como
insumo.

**🔴 Los dos que siguen frenados, con su causa exacta:**
- **T&C Pet Professional** — `L-415`: se remite a una **Disposición Transitoria
  Primera que el documento no contiene** (el término aparece **una sola vez**, y
  es la propia remisión). *Y esa pieza ausente es justo la que reemplaza al sello
  retirado: difiere los Títulos IV y V, que cubren las cuatro funciones que el
  recuadro nombraba.* **Dueño: abogado.**
- **La evaluación** — depositada **sin firmar**: cuatro huecos (fecha, próxima
  revisión, elaborado por, y los nombres de M-4 y M-11). **Dueño: founder.**

**🔴 Y un freno que ninguno de los dos tenía, y bloquea texto ya publicado
hacia adelante:** **D-897 ⑤** — el **consentimiento de IA y de dictado por voz
no se recaba** (medido: cero filas, y no por falta de uso). La evaluación §9
funda la Transferencia B en él y la **Política §17.B.5, ya publicada, se lo
promete al titular en presente**. ⇒ *entra como cura, no reabre la publicación.*

**El Anexo A tiene su mapa:** `docs/legal/anexo-a/README.md` — las ocho
evidencias que el Art. 4 obliga a conservar tres años, contra lo que existe.
**Tres están; cinco no**, cada una con dueño.

### 🟡 Otras con dueño
**D-892** buzón/DMARC · **D-893 acto ③** (apagar `autoconfirm`, sus dos
precondiciones **ya cumplidas**) · **D-895** endurecimiento de las tres capas de
silencio (**no es defecto**) · **D-898** `extract-documento` desplegada sin
caller: **conectar o retirar, dejarla es el peor de los tres estados** ·
**D-901** los plazos de §18 sin mecanismo · **`INVITACION_CORREO_VIVO`** (llave
del founder) · **los dos consentimientos del T&C** (motor listo, pantallas de C).

### 🔴 Google: falta un dato que solo el founder puede mirar
`flowType` ya está curado. Si el síntoma **«termina en el navegador»** persiste,
la causa es otra y está en el **dashboard de producción**: que *Redirect URLs*
tenga `cliente://auth/callback` (o `cliente://**`) y qué dice el *Site URL*.
**El `config.toml` local NO prueba nada** — es del entorno de desarrollo, y el
canon ya se cobró esa confusión tres veces.

---

## 3 · LAS FIRMAS QUE RIGEN

- **Ley de paridad de cuenta**, con tres excepciones — y la ②: **el cierre del
  NEGOCIO no existe en la app POR DECISIÓN, no por falta**; es trámite asistido,
  **no es deuda ni «Pronto»**.
- **El invitado entra como familiar autorizado**, nunca co-dueño. Ascender es una
  **transición**, no un alta.
- **Cerrar cuenta vuelve la cuenta inalcanzable, no destruye el registro** — y
  eso, con su nombre técnico, es **seudonimización**.
- **30 días de arrepentimiento** antes de anonimizar.
- **Los correos de Auth salen bilingües en un cuerpo**; el idioma por usuario es
  deuda.
- **La verificación de correo se enciende DESPUÉS** de que el correo salga de
  nuestra casa y en español.
- **Sesiones v1 = cerrar sesión en todos los dispositivos.**
- **El correo a quien no tiene cuenta** admite cuatro condiciones: **envío único ·
  aviso de origen · baja en un clic sin cuenta · cero listas**.
- **Los 90 días del documento de identidad son TECHO, no plazo**: la regla es
  borrar **al completar la verificación**.
- **Dos T&C** (parent y professional) + **una privacidad común**; el documento
  **lo decide la PUERTA**, y `acceso_prestador` es puerta del prestador.
- **La figura del cobro es MANDATO DE RECAUDACIÓN** (§17).
- **El biométrico es puerta de entrada**, y **desbloquea una sesión que ya
  existe: nunca crea una nueva**.
- **`URL_APP_BASE` = `https://www.epetplace.com`**, directo.

---

## 4 · DÓNDE MEDIR CADA COSA (sin copiar números)

| qué | cómo |
|---|---|
| Migraciones local / remoto | `ls supabase/migrations/*.sql \| wc -l` · `supabase migration list --linked` |
| Numeración libre D/L/R | **grep contra `docs/DEUDAS_CANONICAS.md`**, jamás de un traspaso — un número reservado **no queda congelado** (L-412) |
| Estado de una OTA | `eas-cli update:list` desde `apps/<app>/`, y el ancla del **objeto** con `update:view --json` (mirar `isGitWorkingTreeDirty`) |
| Qué quedó horneado en un build | el `package.json` **del commit que ancló ese build**, no el de hoy |
| Runtime de cada app | `app.json` de cada app **por separado** — leerlos juntos los cruza |
| Gates | `npm run verify:diseno` · los 4 `tsc` · `verify-edge-deno` **sobre copia FUERA del repo** |
| Rutas nuevas | R63 las caza; se regeneran con `expo start` en la app, **y se mata Metro después** |
| Consumidores de una función | grep en `packages` y `apps` **+ `pg_proc`** — y después preguntar **si corrió alguna vez** |
| Páginas del sitio | `curl -sL` **con `-L`**: sin él, el apex devuelve 308 para todo |
| Secretos | `supabase secrets list` da **nombres y digests**, nunca valores |

---

## 5 · LAS ONCE FORMAS DEL MISMO DEFECTO, Y SU LEY

**Un instrumento contestó, pero no la pregunta que se creía hecha.** Las once
dieron **el color esperado**:

1. Un guard `DEFINER` cuyo `current_user` es el owner ⇒ **no frenaba, y el apply
   salió VERDE**.
2. Una RPC que **no podía correr** (`gen_random_bytes` fuera del `search_path`) y
   un cinturón que dijo **VERDE** porque preguntó si existía.
3. Tres `curl` que rebotaban con el guard **de la plataforma**, no con el propio.
4. **L-414** — un número **correcto** contra el **predicado equivocado**, que casi
   hace shipear un corte `fail-closed` sobre gente real.
5. **L-414 al revés, 24 h después** — un literal que era **un `COALESCE`**, no el
   dato. *El alias engaña de un lado y el coalesce del otro: los dos convierten
   «cómo lo mostré» en «qué había».*
6. Un **`308` uniforme para todo** —incluido `/`— que sin `-L` se lee como «nada
   roto».
7. Un trigger que escribía `null` en una columna **NOT NULL**: habría reventado
   en la primera aprobación real, **con su cinturón en verde**.
8. **D-895** — se midió bien y se razonó bien, pero la **premisa del medio**
   («permiso concedido = app abierta») **nadie la pidió verificar**.
9. **El wrapper de Google contra un cliente en `implicit`** *(curado en
   `10c3e2fa`; si alguien vuelve a medirlo contra un commit anterior lo va a ver
   sin aplicar — pasó dos veces el mismo día, y es L-166: la medición era
   correcta y caducó entre medirla y leerla)* — la mitad que emite
   y la mitad que lee **suponían flujos distintos**. No falló al escribirse, no
   falló al compilar, **y el tipo no puede expresar «estas dos piezas hablan el
   mismo protocolo»**.
10. **L-415 — el T&C que se remite a una cláusula que no contiene.** El barrido
    de marcas salió **impecable**: cero recuadros, cero sellos, cero corchetes,
    cero notas internas. *Contestó «¿quedan marcas de borrador?», que no es
    «¿el documento está completo?».* **Un corchete grita; una remisión sin
    destino se lee como rigor.**
11. **La versión legal, y la encontró C mirando lo que yo no crucé.** `VERSION_LEGAL.privacidad`
    decía `1.1` y el documento del abogado decía `1.0`. **Los dos valores eran
    defendibles por separado**; nadie había comparado **pantalla contra
    constante**. *Yo apliqué bien la regla a dos de tres campos y en el tercero
    razoné sobre un documento distinto del que se iba a mostrar* — el del sitio,
    no el de las apps. **Ningún typecheck ve esto: los dos lados compilan.**

> ## **No alcanza con mirar el color: hay que preguntar quién lo produjo.**

**Y el corolario que la sesión pagó once veces:** *un gate mide lo que se le
pidió medir; la vara dice qué había que pedir.* **Ninguna de las once la
encontró un gate corriendo** — las encontró **producir el rojo**, **volver a la
vara**, o **que otra pista mirara lo mismo con otra pregunta**.

**Las dos últimas afinan el reparto, y conviene que quede escrito:** la **10** la
encontré yo, *pero solo porque fui a buscar el destino de lo que el documento
nombraba* — el barrido no me iba a llevar ahí. La **11** **no podía encontrarla
yo**: el defecto vivía en el cruce entre mi constante y el papel del abogado, y
**yo escribí una de las dos mitades**. *El que construyó recuerda haber decidido
cada cosa, y ese recuerdo se lee igual que una medición* (`L-398`). ⇒ **la
proporción de la jornada — cuatro de once halladas por otra pista — es el
argumento medido a favor de trabajar en pistas paralelas, y de que ninguna
audite lo que ella misma escribió.**
