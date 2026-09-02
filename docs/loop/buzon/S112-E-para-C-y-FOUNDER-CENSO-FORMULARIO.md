# BUZÓN · S112-E → C y FOUNDER · ② EL FORMULARIO DE POSTULACIÓN, LITERAL

> **CONTRA QUÉ Y CUÁNDO.** Contra el **OBJETO** (DB linkeada) y contra `main`
> = **`978666bd`**, el **1-sep-2026, 21:35 -05**. La rama de C
> (`pista/s112-c`) **no está en `main`**: lo de abajo describe lo que hay en
> el canon, no lo que C tiene en vuelo.
>
> **El abogado espera una respuesta literal. Es ésta, en una línea: hoy el
> formulario de postulación NO EXISTE — no hay plantilla, no hay campos, y no
> se pide ningún dato de ningún menor.**

---

## ① ¿EXISTE PLANTILLA? — NO, y se midió de tres formas

1. **En la base:** `information_schema.tables` con patrón
   `%plantilla% · %formulario% · %pregunta% · %template%` sobre las 299 tablas
   → **0 filas**.
2. **En el motor:** la puerta de postular es
   `crear_solicitud_adopcion(p_publicacion_id uuid, p_mensaje_inicial text DEFAULT NULL)`.
   **Dos parámetros, y el segundo es texto libre opcional.** No hay estructura
   de preguntas, ni catálogo, ni jsonb de respuestas.
3. **En la pantalla:** `apps/cliente/src/app/adoptar.tsx:156` llama
   `crearSolicitudAdopcion({ publicacionId: a.publicacionId })` — **sin
   mensaje**. El botón es *«Quiero conocer a {{nombre}}»* y postular es **un
   solo toque**. El bloque `adoptar` del diccionario (`i18n/es.ts:1556`) tiene
   **14 claves y ninguna es una pregunta, una condición ni un consentimiento**.

⇒ **Campos del formulario hoy: cero.**

---

## ② ¿QUÉ DATOS VIAJAN, ENTONCES?

Lo que la fila de `adopcion_solicitud` guarda, columna por columna:
`id · publicacion_id · solicitante_user_id · estado · creada_en · cerrada_en ·
aviso_silencio_emitido_en · country_code`. **Ninguna respuesta, ningún dato
declarado por la persona.**

**Y lo que el refugio VE de quien postula**, leído del contrato de
`obtener_solicitudes_de_mis_publicaciones`:

```
solicitante_user_id · solicitante_nombre · mensajes(jsonb)
```

**Eso es todo.** No viaja email, ni teléfono, ni ciudad, ni edad, ni
composición del hogar, ni si tiene patio, ni si tiene otras mascotas.
*El refugio hoy decide con un nombre y una conversación.*

---

## ③ ¿PIDE NOMBRES O EDADES DE MENORES? — NO. Medido, no supuesto

- **Cero campos**, así que cero campos de menores. (①)
- La casa **modela** menores en un solo lugar: `familia_miembro.rol`, cuyo
  CHECK admite `adulto_titular · adulto_autorizado · menor · cuidador_externo`.
  Medido: **19 filas vivas, las 19 `adulto_titular`. Cero `menor`.** Y esa fila
  guarda un `user_id` — **no guarda nombre, ni edad, ni fecha de nacimiento**.
- El otro toque de menores en todo el esquema es
  `evento_bitacora_familia.aportado_por_menor` — **un booleano** que dice que
  la nota la escribió un chico, sin decir quién ni de qué edad.
- El filtro de vidriera *«convive bien con … niños»* que `LETRA_ADOPCION` §4
  pide es un dato **del animal**, no del hogar del postulante, y hoy **no está
  construido**: `obtener_adoptables` acepta **un solo filtro, `p_especie`**.

⇒ **Respuesta al abogado: la plataforma no recoge ningún dato personal de
menores en el flujo de adopción, ni por formulario ni por perfil.** Lo único
que existe es un rol de familia sin datos y una marca booleana de autoría.

---

## ④ LO QUE ESTO CRUZA CON LA LETRA QUE SE CARGÓ HOY — y hay que decirlo

`condiciones_adopcion` **v1** (cargada 21:16, hoy `vigente=false`) decía:
*«Usted puede postular … **completando el formulario de la aplicación**»*.
**Esa frase describía un formulario que no existe.** La **v2** (21:26,
`vigente=true`) **ya no la tiene** — dice sólo *«La postulación no genera
derecho a adoptar»*. ✅ **El choque se curó solo, dentro de la hora, y lo
registro para que nadie lo re-descubra leyendo la v1.**

**Los dos que la v2 SÍ sigue afirmando y hoy no tienen motor** (los nombro,
no propongo cura):

| lo que la letra vigente promete | lo medido |
|---|---|
| §2 *«se elimina conforme a la Política de Privacidad si la adopción no se concreta»* | **cero funciones borran `adopcion_solicitud`** (censadas las 7 que la nombran: crear, responder, cerrar, contar, y los tres lectores) y **cero de los 28 crones vivos toca adopción**. La promesa de borrado **no tiene escritor** |
| §3 *«los animales mayores de seis meses se entregan ya esterilizados»* | **no hay dato de esterilización**: `cat_tipos_evento` tiene el código `esterilizacion` activo, **sin tabla tipada**, y `eventos_mascota` tiene **0 filas** de ese tipo. Nada en la app puede afirmar ni desmentir esa frase |

---

## ⑤ UNA DE FORMA, chica y barata de arreglar ahora que son cinco filas

**Los cinco documentos cargados terminan diciendo «Versión 1.0» en su texto,
incluidas las dos filas que son `version = 2`.** Medido sobre los últimos 60
caracteres de cada `contenido`. Es el mismo hecho viviendo en dos lugares —
la fila y la firma del pie — y **ya divergen el día uno**. Nombro la puerta:
el pie del texto de `terminos_refugio v2` y `condiciones_adopcion v2`.

---

## ⑥ ADDENDUM · EL ÚNICO FORMULARIO QUE ESTA CASA TUVO ALGUNA VEZ (legado, 0 filas)

**Se agrega porque «no existe plantilla» es cierto y podría leerse como «nadie
pensó nunca los campos».** La tabla legada `solicitudes_adopcion` —del portal
viejo, **0 filas**, y que `S111` declaró expresamente que **no se reusa**
(`D-991`)— conserva el formulario que sí existió, columna por columna:

```
nombre_solicitante · email · telefono · tiene_mascotas(bool) ·
espacio_exterior(bool) · motivo(text) · refugio_id
score_compatibilidad(numeric) · score_breakdown(jsonb) · score_calculado_en
entrevista_requerida(bool) · entrevista_fecha · entrevista_notas · entrevista_resultado
estado · motivo_rechazo · aprobado_por · aprobado_en
```

⚠️ **Se cita como ANTECEDENTE, no como candidato.** Dos de sus columnas
—`score_compatibilidad` y `score_breakdown`— **son exactamente lo que
`LETRA_ADOPCION` §10.2 prohíbe** (*la plataforma jamás asigna, aprueba ni
puntúa adoptantes*), y las cuatro de `entrevista_*` ponen a la plataforma
adentro de una decisión que la letra deja **exclusivamente al refugio**.
*El formulario viejo no es el punto de partida: es el catálogo de lo que la
letra nueva decidió no volver a hacer.* **Ninguna de sus 22 columnas pide dato
de un menor** — dato que también vale para el abogado.
