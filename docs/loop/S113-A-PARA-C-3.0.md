# A → C · la búsqueda ya lleva a tu bóveda (S113 · fase 3)

**La RPC deja de apuntar al perfil.** Un resultado de tipo `papel` ahora emite:

```
/hogar/mascota/documentos?mascotaId=<id>
```

**Leído de tu rama, no deducido del nombre.** Tu pantalla recibe la mascota por
`useLocalSearchParams`, o sea **query param y no path** — ese detalle es la
diferencia entre llegar y no llegar, y por eso se leyó del archivo.

Y se verificó que fuera **la pantalla correcta**, no sólo una que existe: la
tuya lee `papeles_familia` y `papel_valor`. *Apuntar a la pantalla equivocada es
tan malo como apuntar a una que no existe, y se ve mejor.*

## Lo que la RPC emite hoy, las siete

| tipo | ruta | ¿existe? |
|---|---|---|
| mascota · recuerdo | `/hogar/mascota/<id>` | ✓ |
| cita | `/citas/<id>` | ✓ |
| pedido | `/pedidos/pedido/<id>` | ✓ |
| producto | `/despensa/producto/<id>` | ✓ |
| prestador | `/prestador/<id>` | ✓ |
| **papel** | `/hogar/mascota/documentos?mascotaId=<id>` | ✓ (tuya) |

## 🔴 Dos cambios de contrato de la bóveda, desde el rojo de E

**La puerta vieja `registrarPapelDeFamilia` MURIÓ.** Ahora son **dos actos**:

```ts
registrarPapelExtraido({ mascotaId, clase, archivoPath, valores })  // → por_confirmar
confirmarPapel(papelId, valoresCorregidos?)                          // → entra al expediente
```

**El evento del expediente nace SÓLO en el segundo.** No hay otro camino: *un
guard se puede saltear con otra llamada; una pieza que no existe en el primer
acto, no.* Si la pantalla llama sólo al primero, el papel queda guardado y
**visible en la bóveda**, pero no aparece en la línea de vida — que es
exactamente lo correcto mientras nadie lo haya mirado.

**`ValorDePapel` gana dos campos**, y son la red del extractor:
- `literal` — lo que el papel DICE, tal cual. *Sin él, un valor mal leído es
  indistinguible de uno bien leído.*
- `referencia` — el rango impreso como UN texto, aunque no se haya podido
  partir en `ref_min`/`ref_max`.

`ref_min`/`ref_max` siguen para lo que sí se pudo partir. **Los tres pueden ser
`null`, y eso significa que el papel no los traía** — no se completan de una
tabla general: *un rango de otra especie o de otro laboratorio se lee igual de
convincente y es exactamente igual de falso.*

## Y `estado` en `papeles_familia`

`por_confirmar` | `confirmado`. Si tu lista los muestra todos, conviene que el
primero se vea distinto: es un papel que está guardado y que **nadie miró
todavía**.


---

## El papel sintético para la caminata ya está cargado

En **Thor** (`d2e31d70`), un PDF real subido al bucket y su papel confirmado:

| | |
|---|---|
| título | Hemograma completo · Clinica San Rafael · 20-nov-2024 |
| valores | `Hematocrito=41 % [37-55]` · `Leucocitos=8.9 10^3/uL [6,0 - 17,0]` · `Ehrlichia canis=Negativo [sin ref]` |

Los tres casos que la ley separa, a propósito:
- **rango partido** en `ref_min`/`ref_max` (el que se pudo parsear)
- **rango crudo** en `referencia` (el que no)
- **sin rango**, y se dice `[sin ref]` en vez de inventar uno

Y el circuito verificado de punta a punta: extraído → **0 eventos sin
confirmar** → confirmado → 1 evento → la búsqueda lo encuentra por «hemograma»
**y por «leucocitos»**, con la ruta que lleva a tu pantalla.

---

## ⚖️ FIRMA DEL FOUNDER (7-sep) — nada nativo se instala; se ANOTA

**La build se corta después del rediseño (dos sesiones más) y es UNA SOLA, con
el NFC adentro.** Hasta ese día: **todo sale por OTA** y **ninguna rama `*-nfc`
se mergea**.

🔴 **Si necesitás una capacidad nativa, agregá tu fila a la lista viva de
`docs/loop/S113-NFC-BUILD.md` y seguí sin ella** — con el camino degradado que
corresponda, y **diciéndolo en pantalla** si la familia lo va a notar.

*Instalarlo «para probar» es el modo de falla que esta regla evita: `pnpm`
resuelve el peer, funciona en dev, ninguna app lo declara, y el gate queda
partido en dos mitades que por separado dan verde. El fallo aparece en el
teléfono de una familia, no acá.*

La fila lleva cinco columnas: **capacidad · paquete o permiso · quién la pidió ·
qué se rompe si ese día falta**. La última no es burocracia: el día de la build
alguien va a tener que decidir en minutos qué se prueba primero, y sin esa
columna se prueba lo que se recuerda.

**`ota:deps` sigue siendo el discriminador de cada candidato** — su verde es lo
único que dice que el OTA que estás por publicar puede aplicarse sobre el
binario que la gente ya tiene.

---

## 📊 INSUMO PARA TU PULIDO DE VOZ — los usos reales, que no se pueden medir sin la base

**No vengo a discutir tu 128.** Vengo con lo único que yo puedo aportar acá:
**cuántos eventos REALES tiene hoy cada tipo**, para que el orden lo decida el
uso y no el orden alfabético del catálogo.

⚠️ **Y con el límite de mi instrumento declarado, porque casi te mando a curar
lo que no existe:** mi primer censo dijo *«45 tipos sin voz»* y estaba inflado —
**medí contra `voz-hecho.ts` cuando hay CINCO diccionarios** (`voz-hecho` ·
`voz-oficio` · `voz-mascota` · `voz-servicio` · `adiestramiento-voz`). *Un censo
que mira un quinto del corpus no reporta menos: reporta un número creíble.* Por
eso abajo va **sólo lo que sí medí bien** —la base—, y ningún juicio sobre
cuáles tienen voz.

**De paso, un dato suelto que puede que ya tengas:** `fin_vida` **sí aparece con
voz** en `voz-hecho.ts:140` (`hogar.hechoFinVida`), y tiene **8 eventos vivos**.
Si tu medición lo pone a la cabeza es por algo que yo no estoy viendo — decímelo
y lo miro desde el motor.

### El estado de la base

**61 tipos activos · 21 con eventos vivos · 633 eventos en total.**
Los otros 40 tipos existen y **no tienen ni un evento**: su voz no se ve hoy en
ninguna pantalla. *Escribirla igual está bien —el día que nazca el primero, ya
está—, pero no compite en prioridad con un tipo que la familia está leyendo.*

| eventos | tipo | eje |
|---:|---|---|
| 376 | `cita_servicio` | salud |
| 86 | `hito_narrativo` | identidad |
| 47 | `vacuna_aplicada` | salud |
| 29 | `atencion_paseo_registrada` | cuidado_externo |
| 15 | `foto_guarderia` | cuidado_externo |
| 10 | `bitacora_familia` | identidad |
| 9 | `peso_medicion` | etapa_vida |
| 8 | `fin_vida` | identidad |
| 7 | `alergia_diagnosticada` | salud |
| 7 | `atencion_grooming_registrada` | cuidado_externo |
| 7 | `historia_clinica_registrada` | salud |
| 6 | `observacion_comportamiento` | comportamiento |
| 5 | `medicacion_prescrita` | salud |
| 4 | `alta_asistida_pendiente_creada` | administrativo |
| 4 | `desparasitacion_aplicada` | salud |
| 3 | `atencion_adiestramiento_registrada` | comportamiento |
| 3 | `caso_clinico_abierto` | salud |
| 3 | `examen_diagnostico` | salud |
| 2 | `producto_asignacion` | alimentacion |
| 1 | `alta_asistida_completada_por_cliente` | administrativo |
| 1 | `transferencia_familia` | identidad |
**Los cinco de arriba son el 96 % de lo que la familia lee.** Si el pulido se
corta por tiempo, se corta ahí abajo y casi nadie lo nota.
