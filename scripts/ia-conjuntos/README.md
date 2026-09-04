# Conjuntos de prueba de IA · S113-E

Cuatro piezas para poder **decidir modelos con número** en vez de con
impresión: dos conjuntos, un arnés y una fixture.

## 🔒 Lo primero: los conjuntos NO se commitean

Salen a `.ia-conjuntos/` (en `.gitignore`). Llevan rutas de fotos de carnets
reales y `veterinario_nombre_externo`, que es **el nombre de una persona**. Al
repo entra el **generador**; el conjunto se produce en cada máquina.

Las imágenes tampoco se copian: el conjunto guarda `bucket` + `path`, y el
arnés las baja de Storage con `service_role` en cada corrida. La clave se
resuelve **en ejecución** desde el CLI autenticado por keychain y no se imprime
nunca.

> ⚠️ `supabase projects api-keys` **imprime las claves en claro por stdout**.
> No se corre a mano en una sesión cuyo transcript se guarda.

## Qué mide cada uno

| | mide | unidad | tamaño real |
|---|---|---|---|
| `carnets` | la pieza que lee un carnet de vacunación por foto | **un carnet = una llamada** | **5 carnets · 32 filas de verdad** |
| `razas` | la pieza que dice la raza desde una foto | una mascota | **5 candidatos · 3 aptos** |

**La verdad no es fabricada:** son filas que un humano revisó en la app. En
carnets, **23 de las 32 se editaron después de crearse** — o sea que la
revisión existió y no fue un «aceptar todo».

### Dos cosas que estos conjuntos NO pueden medir, y hay que leerlas antes

- **`fecha_proxima` tiene 1 valor en 32 filas.** Cuatro de los cinco carnets
  tienen cero. El arnés lo reporta `SIN MUESTRA`, nunca 100 % ni 0 %.
- **Razas: 3 casos aptos, los tres perro, cero gato.** Alcanza para probar que
  la pieza corre; **no alcanza para elegir un modelo** — un acierto de más
  mueve el resultado 33 puntos. Los otros dos candidatos están marcados con su
  razón: uno es un avatar de siembra de 2,9 kB, el otro es «Mestizo», que no es
  identificable visualmente.

## Cómo se corren

```bash
# construir los conjuntos (--verificar-legibles abre las imágenes de verdad)
node scripts/ia-conjuntos/construir-carnets.mjs --verificar-legibles
node scripts/ia-conjuntos/construir-razas.mjs   --verificar-legibles

# el arnés: primero su control, que NO gasta una sola llamada al modelo
node scripts/ia-conjuntos/medir-pieza.mjs --control

# la corrida real  ⚠️ GASTA PLATA: una llamada por caso
npx tsx scripts/ia-conjuntos/medir-pieza.mjs --pieza carnet

# la fixture de memorial (idempotente: sin --crear sólo informa)
node scripts/ia-conjuntos/fixture-memorial.mjs
```

## Cómo compara el arnés

Un campo acierta si, **normalizado**, los textos son iguales: minúsculas,
acentos fuera, espacios colapsados, puntuación fuera. `Rabia (antirrábica)` ≡
`rabia antirrabica`.

Las **fechas se comparan por VALOR**: `2024-03-05` ≡ `05/03/2024` ≡
`5 de marzo de 2024`. *Compararlas como cadenas mide el formato del modelo, no
si acertó el día.*

Las vacunas se **emparejan por contenido** (nombre + fecha), no por posición:
el modelo devuelve una lista y su orden no está garantizado.

## El costo hoy es ESTIMADO, y por qué

`ia_uso` todavía no existe (su migración va en este mismo lote) y
`extract-vacuna` **no devuelve `usage`** — su respuesta es `{ vacunas }` y nada
más. Mientras siga así, el costo se calcula con la tabla de precios
(`supabase/functions/_shared/ia/precios.ts`) y sale rotulado `ESTIMADO`, con su
método a la vista. En cuanto `ia_uso` exista y la librería de D escriba ahí, el
arnés lee el costo real y el rótulo pasa a `MEDIDO`.

> 🔴 **No compares modelos por $/MTok.** Sonnet 5 usa el tokenizador nuevo
> (~30 % más tokens para el mismo texto) y Haiku 4.5 el viejo. Para el mismo
> carnet, el cociente de precios subestima el ahorro. **Se compara costo por
> ítem medido**, que es lo que el arnés reporta.
