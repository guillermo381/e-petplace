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
