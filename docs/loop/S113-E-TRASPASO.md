# S113 · pista E — TRASPASO

**Rama `pista/s113-e-2.0` · último SHA `738e4322` · árbol limpio · local == origin.**
Todo lo de abajo está en el repo; **nada vive sólo en la conversación.**

---

## Quién soy y qué mido

Pista **E**: medición, seguridad, costo de inferencia y rendimiento.
**No aplico migraciones y no despliego** — eso lo hace A con lo que yo entrego.
Worktree: `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s113-e20`.

**Las leyes con las que trabajo** (del prompt de origen, siguen rigiendo):
- *un instrumento que no puede producir su ROJO no está midiendo: control positivo y negativo, siempre, el positivo primero*
- *un arnés que crea lo que mide no prueba que esté aplicado*
- *un censo estático entrega candidatos, no veredictos*
- *declarás contra qué y cuándo medís*
- **ningún dato personal sale de la base hacia un archivo del repo**

## Credenciales — SIEMPRE del llavero, al momento, jamás impresas

| servicio | para qué |
|---|---|
| `anthropic-medicion` | correr matrices y medir prompts. **Ningún despliegue la usa.** |
| `epetplace-service-role` | bajar conjuntos privados. **Ninguna escritura.** |
| `epetplace-cuenta-founder` | la sesión con la que corro los gates (el correo sale del campo `acct`) |
| `epetplace-cuenta-prueba` | la segunda cuenta, para el cruce de privacidad |

🔴 **`npx supabase projects api-keys` NO se corre** (`D-1013`): imprime la `service_role` en claro.
La `anon` es pública y se lee de `scripts/seg2/d713-cron.mjs`.

## Mis once gates, y su estado al cerrar

| gate | control | real | qué mide |
|---|---|---|---|
| `verify:tdz` | ✅ | **0** | orden de ejecución, no léxico · 634 archivos |
| `verify:pasaporte-campos` | ✅ | **0** | campos sin sesión, contra **línea base declarada SIN FIRMA** |
| `verify:busqueda-propia` | ✅ | **0** | privacidad con 2 cuentas · trabajo ≈21 ms · 10 términos hostiles |
| `verify:nexo-antispam` | ✅ | **0** | ①-⑤ incluida la anticipación (una viva por mascota / 7 días) |
| `verify:nexo-anticipa` | ✅ | **0** | los seis, sobre 18 avisos reales |
| `verify:nexo-alimenta` | ✅ | **🔴 1** | **la puerta NOMBRA la confirmación y no la EXIGE** |
| `verify:voz-nexo` | ✅ | 🟡 | voseo/escalada/rendirse sobre salidas reales · `--veces=N` |
| `verify:coach-ley` | ✅ | 2 | la edge no está en `main` (**sí desplegada** — lo dice) |
| `verify:nexo-rojos` | ✅ | 2 | ídem · los 11 ataques corren con `atacar-edge.mjs` |

*(El gate del delta de `ia_uso` lo escribió D y vive en su rama — **no lo nombro con su prefijo
acá**: el canon no puede nombrar un gate que nadie puede correr desde este árbol, y el hook me
frenó por eso al escribir este traspaso. Es mi propia **E-10** cobrándomela a mí.)*

⚠️ **`nexo-anticipa` y `nexo-alimenta` disparan su gate si alguien los importa** — los otros
tienen el guard `ESTE`. Intenté automatizarlo con índices de texto, rompí dos archivos y los
restauré: **la limitación está declarada, no escondida.**

## LA COLA VIVA, en orden

1. **🔴 `dejá` llegó a la familia estando en el JSON de 132 con su reemplazo.** *Para el voseo,
   una forma LISTADA que aparece es un rojo del CINTURÓN, no del modelo.* **Hipótesis fuerte:
   el cinturón no está actuando en lo desplegado.** Cierra con una llamada.
2. **Cuando A despliegue `39aef6ae`**: correr `verify:voz-nexo --veces=3` con **`general` a la
   vista** y sumarlo al gate (hoy no viene en la respuesta).
3. **E1/E3 del 2.2**: `obtenerTableroMascota` **no existe**. Cuando exista: `< 300 ms` **midiendo
   el trabajo, no el viaje** (el peaje de red desde esta máquina tiene p95 ~600 ms).
4. **Papeles reales para `extract-papel`**: **pedidos al founder, sin respuesta todavía.**
   *El sintético mide la ley, no la variedad.* Van a la carpeta gitignored, nunca al repo.
5. **La clasificación del «contanos»**: los 40+10+20 están en `scripts/nexo/contanos.json`.
   **No se pudo medir: el clasificador de D no existía.** Corre en minutos el día que exista.

## Lo que espera FIRMA (en `S113-NOCHE-PENDIENTES.md`)

**E-1** la lista de campos del pasaporte (11, con mi lectura de cada uno · voto: `chip` sale o
nace apagado) · **E-2** la foto del pasaporte, **62 kB contra un techo de 60** · **E-3** el
`coalesce(...,true)` fail-open, hoy inalcanzable · **E-8** 🔴 **la raíz no abre por deep link**
(3/4 medido; *abrir desde un QR ES una segunda navegación durante el arranque*) · **E-9** los dos
pesos de Thor · **E-10** la nota de `main` que pide un slot que ya existe.
☠️ **E-6 RETIRADA** (canon viejo) · 🟢 **E-4 y E-7 cerradas.**

## Los números que valen

- **Costo Nexo**: turno frío **USD 0,007289** (~USD 7,29 / 1.000 aperturas) · con puerta la
  conversación de 5 turnos sale **21,3 % más barata**.
- **Voz**: edge vieja **17/20 con voseo**; nueva, **0 reproducibles sobre 60 turnos**.
- **Ataques**: **11/11 verdes** contra la edge desplegada, con `ia_uso` delta 0 en dato y 1 en
  narrativa.

## Las tres leyes que dejó esta sesión, y las tres son sobre instrumentos

1. **Un gate atado a un nombre no falla: cae a su piso y sigue dando un número con otro
   significado.** (`escalar_a_vet` → `semaforo`.) La defensa es **que el instrumento avise cuando
   lo que mide no es lo que cree medir** — mi línea `matcher: …` y el `[mide]` de D.
2. **Una corrida no es una medición cuando el sujeto es un modelo.** Tres vueltas iguales dieron
   2·0 voseo y 0·2 escaladas. **Se reporta la tendencia, no el conteo.**
3. **Un juez que busca una palabra mide la presencia, no el acto.** Se cobró cinco veces: el
   delator negado, el canario citado para rechazar, el `confirm` dentro de un enum, la mención
   del vet, el nombre compartido entre familias.
