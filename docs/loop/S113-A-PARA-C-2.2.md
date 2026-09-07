# A → C · el tablero está servido (S113 · 2.2)

**Rama `pista/s113-a-2.2`.** Todo por `@epetplace/api` — cero `rpc()` directo.

## Lo que C necesita, con su nombre

| wrapper | qué devuelve |
|---|---|
| `obtenerTableroMascota(id)` | los seis bloques en **una** ida |
| `obtenerCitasDeMascota(id)` | `futuras` · `pasadas` (50) · `pasadas_total` |
| `obtenerHoyMascota(id)` | **una** cosa, ya elegida por el servidor |
| `obtenerCatalogoRasgos(especie?)` | los 24 rasgos, etiquetas en tuteo |
| `registrarRasgos({mascotaId, codigos, texto})` | la puerta del «contanos» |

## Tres cosas que cambian cómo se dibuja

**① Memorial no tiene tablero.** `{memorial: true, estado_vida, tablero: null}`.
No es el tablero con campos apagados: *apagar seis campos deja seis lugares
donde el próximo que agregue un séptimo se olvida.* Y viaja el **estado real**,
no un booleano: se le habla distinto a quien perdió a su animal que a quien lo
está buscando.

**② Todo bloque puede ser `null`, y eso no es un cero.** `peso: null` es «nunca
lo pesaron»; `peso.actual: 0` sería una medición. **Sin dato no se dibuja el
gráfico.**

**③ `hoy` trae UNA cosa o `null` con su razón** (`no_activa` · `sin_novedades`).
La prioridad —aviso > cita 48 h > vacuna 7 d > antiparasitario vencido > tip—
vive en el servidor: *si la superficie recibiera las cinco y eligiera, cada
superficie elegiría distinto.*

## Detalles que la pantalla no tiene que calcular

- `vacunas.proxima.derivada` → si es `true`, decí **«estimada»**: una fecha que
  calculamos nosotros no es una que alguien escribió en un carnet.
- `peso.serie[].fuente` → `'prestador'` o `'familia'`, para pintar distinto lo
  clínico y lo de casa. Thor tiene los dos.
- `antiparasitario.plagas[]` → estado por **tipo** (interna/externa). No hay
  catálogo de plagas —medido, cero tablas— y no se inventó uno.
- `citas.pasadas` viene con **techo de 50**; el número real está en
  `pasadas_total`. *Una lista truncada que no declara su techo se lee como el
  total.*

## Rojos que ya pasan (familia `ce057f90`, por ID)

| | tablero | hoy |
|---|---|---|
| **Sombra** (fallecida) | `null` | `no_activa` |
| **Thor** | serie de 4 pesos, prestador **y** familia | aviso · 5 futuras · 104 pasadas |
| **Zeus** | | aviso · 7 futuras · 41 pasadas |

Y sin sesión rebota `auth_required`; con familia ajena, `sin_acceso`.

## El «contanos»

`registrarRasgos` rebota **nombrando** el código que no existe
(`rasgo_desconocido: xxx`), no «datos inválidos». Sin códigos **ni** texto
rebota `sin_contenido`: *una fila vacía en el expediente parece que alguien
contó algo.*

La procedencia de familia la marca `prestador_id IS NULL` — el contexto que se
guarda es `'casa'`, que es lo que el CHECK acepta.

⚠️ **Ojo con el boceto**: `docs/loop/S113-BOCETO-PERFIL.html` tiene un `80%`
dibujado en el anillo. **No se dibuja** — LOYALTY §3 prohíbe scores. Está
comentado en el archivo con su razón. El porcentaje va como voz.
