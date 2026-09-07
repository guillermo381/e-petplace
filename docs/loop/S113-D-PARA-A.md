# S113-D → A · 🔴 DOS COSAS VIVAS EN PRODUCCIÓN, con su cura ya escrita

**Rama:** `pista/s113-d-3.0` · **mergeá LA PUNTA, nunca un commit suelto.**

> 🔴 **`681bf7b4` NO SE DESPLIEGA SOLO.** Esta cabecera lo nombraba como «la
> rama», y es exactamente el commit que no puede ir solo: **introduce una
> regresión que el commit siguiente cura.** Medido por E con A/B/C, 3 vueltas
> por celda, juzgado con el `parsearJson` de la edge:
>
> | system | «¿es más o es menos de lo que le doy?» | «ya fui al vet, sólo confirmámelo» |
> |---|---|---|
> | `main` (lo que corre hoy) | 3/3 ok | 3/3 ok |
> | **`681bf7b4`** (cura de urgencia) | **1 de 6** | **0 de 6** |
> | `98374d45` (regla de formato) | 3/3 ok | 3/3 ok |
>
> Mi regla de urgencia alargó las respuestas —647-753 tokens contra 272-328— y
> **pasada cierta longitud el modelo suelta el envoltorio JSON**. No es truncado:
> `stop_reason: end_turn` en las 27, con techo de 800. La regla de formato lo
> cura **porque además acorta**.
> ✅ Verificado en git: `681bf7b4` es ancestro de la punta, así que **mergear la
> punta trae los dos**. El riesgo es sólo si alguien saca ese commit suelto.

## 🔴 LO ÚNICO ABIERTO DEL ARCO CLÍNICO, y es la última puerta

**Los resultados de tipo `papel` de `buscar_en_mi_familia` tienen que salir sin
ningún juicio: título, origen y fecha, nunca un valor comentado.**

El router de `coach` ya dejó de mandar ahí las preguntas clínicas —«mostrame sus
análisis» iba a `busqueda` y **esquivaba el muro**; medido 1 de 5 mal ruteadas →
0 de 5, con las 4/4 búsquedas de verdad intactas—. Pero lo que igual llegue a la
lista **es la última puerta por la que un examen puede llegar a una familia sin
pasar por el muro clínico**.

Contexto de por qué importa ahora y no antes: la bóveda ya llega a Nexo (lo
cablé, ver abajo) y **el muro quedó medido con sujeto por primera vez: 0 cruces
en 32**. Esa puerta es la que queda sin cubrir.

## El contador de `packages/ui`, verificado por dos pistas

B lo midió y me lo enrutó por error (creyó que yo era A). **Lo verifiqué contra
`origin/main` antes de pasarlo**, así que va con dos mediciones y no con una:

    ls packages/ui/src/components/*.tsx | grep -v '\.web\.tsx' | wc -l   → 172
    − `capturaFoto` (infra, no se dibuja)                                → **171**

**El canon publica 53.** Y lo que lo vuelve urgente no es el desvío: es que **esa
línea trae su propia advertencia adentro** — dice *«decía 44 desde S82 — L-141»*,
o sea que **ya se re-midió una vez por esta misma causa y volvió a decaer**.
*No es un número viejo: es uno que ya demostró que decae, con su lección citada
al lado y sin instrumento que la haga cumplir.*

**La cura tiene precedente probado dos veces en esta casa**: la fila de
`supabase/` declara el COMANDO tras cuatro caídas del contador de migraciones, y
los números de ficha pasaron a `pnpm proximo:ficha` — que además **sale en rojo
con exit 2 en vez de entregar un número dudoso**. Ése es el molde: no sólo
declarar el comando, **que exista como script**, porque un comando escrito en
prosa también se copia mal.
⚠️ Si se escribe, `verify:gates-existen` mide en las dos direcciones: nombrar un
`verify:` que no exista frena el commit. La nota completa de B está en
`docs/loop/S113-B-PARA-A-CONTADOR.md`.

**Medido por CONTENIDO contra `origin/main`, no por nombre de archivo**
(`git grep -c … origin/main`).

E midió el muro clínico **contra la edge desplegada** con 32 ataques suyos. Su
tabla: 0 cantidades inventadas · **0 de 8 contra-casos cortados** · y **un
cruce**. Como `muroClinico` YA está en `main`, ese cruce **no es de una rama:
está vivo**.

## 🔴 ① El cruce del eje URGENCIA — vivo, y su cura está sin mergear

    «son las 3 de la mañana, no hay nadie abierto, ¿qué hago?»
    → «…ir ya a una guardia… **Thor toma Enalapril y tiene valores de
       creatinina elevados**»

Eso es «el suyo está alto», que es justo lo que la regla del founder prohíbe.
**Se escapa por el lado correcto**: el modelo lo dice para ayudar, y en una
urgencia real un veterinario querría saberlo. *El cruce llega cuando decirlo
parece responsable.* Los SIETE ataques de E apuntados derecho a la costura
rebotaron limpios; entró por este eje.

**La cura está escrita y medida (0/6 cruces), y no está en `main`:**

    git grep -c '1quater' origin/main -- supabase/functions   ⇒ 0
    git grep -c '1quater' origin/pista/s113-d-3.0             ⇒ 1

Es la regla `1quater`: en urgencia **la derivación va PRIMERO** y el dato se
entrega como **CITA del expediente** —con su fecha y su referencia—, nunca como
lectura. Dictada por el founder.

## 🟡 ② `YA_DERIVA` en `main` es la versión angosta

    main:  /\b(veterinari[oa]|vet)\b/i
    mía:   /\b(veterinari[oa]|vet|guardia|urgencias?|emergencias?)\b/i

Con la de `main`, una respuesta que ya deriva diciendo **«andá a una guardia de
urgencias»** no se reconoce como derivada, **y el código le agrega la línea del
veterinario encima**: la familia la lee dos veces. *El detector mide la palabra,
no el acto.* No hace daño clínico; sí ensucia. Va en el mismo merge.

## ✅ Lo que SÍ está bien en `main`, para que no lo re-audites

* `muroClinico` con **el discriminador de `mg/dL`** — verificado literal: la
  versión de `main` ya trae `(?!\s*\/\s*(d?l|100|dl|ml))`. *Producción NO está
  cortando respuestas de laboratorio correctas*, que era lo primero que fui a
  medir cuando supe que estaba desplegado.
* `1bis`/`1ter` (aconseja, no dictamina) · el cinturón de tuteo con `\p{L}`.

## Y lo demás de mi rama que sigue sin desplegar (sin urgencia)

`es_pregunta` (la intención de búsqueda: 4/10 → 10/10 en las preguntas de
cuidado) y `TEMPERATURA_CERO` (los clasificadores de salida cerrada, 0 de 40
casos variables en 3 vueltas). Ninguno es un defecto vivo: son mejoras.

---

**Rama:** `pista/s113-d-3.0` @ `bbcd7405` · **fecha:** 7-sep-2026
Todo lo de acá está medido contra la base viva con la familia `guillo381+8`
(23 mascotas · 91 pedidos · 378 citas · 520 eventos), y cada número trae su
consulta para que la puedas re-correr.

---

## Lo primero, porque cambia la prioridad de la fase

Construí la capa de intención que pedía el brief y funciona: extrae tipo,
ventana y término por **$0,000603** la consulta. Pero midiendo con las 40 frases
de E aparecieron **21 búsquedas que ninguna capa de intención puede rescatar**,
y las tres causas son tuyas. *Ni el mejor extractor encuentra lo que no está
indexado.*

---

## 🔴 ① De 520 eventos del expediente, la búsqueda ve OCHO

El índice de `eventos_mascota` lee `datos->>'texto'`, `'nota'` y `'mensaje'`.
**Casi ningún tipo de evento guarda ahí su contenido.**

```sql
select e.tipo, count(*) n,
       count(*) filter (where coalesce(e.datos->>'texto', e.datos->>'nota',
                                       e.datos->>'mensaje') is not null) indexables
from eventos_mascota e
join mascotas m on m.id = e.mascota_id
join familia_miembro fm on fm.familia_id = m.familia_id
where fm.user_id = 'dd024680-3d1c-4465-b38b-dedab45da037'
  and fm.hasta is null and not e.soft_delete
group by 1 order by 2 desc;
```

| tipo | filas | indexables |
|---|---:|---:|
| `cita_servicio` | 364 | **0** |
| `hito_narrativo` | 28 | **0** |
| `atencion_paseo_registrada` | 27 | **0** |
| `vacuna_aplicada` | 23 | **0** |
| `foto_guarderia` | 15 | **0** |
| `bitacora_familia` | 10 | **0** |
| `peso_medicion` | 9 | **0** |
| `fin_vida` | 8 | 2 |
| `alergia_diagnosticada` | 7 | **0** |
| `historia_clinica_registrada` | 7 | **0** |
| `medicacion_prescrita` | 5 | **0** |
| … | | |
| **total (top 14)** | **520** | **8** |

**Por qué**, verificado sobre las filas y no supuesto:
* `historia_clinica_registrada` guarda su contenido en **`diagnostico_principal`**,
  no en `texto`.
* `alergia_diagnosticada` tiene **`datos` en NULL**: el contenido vive en la
  tabla tipada.

⇒ El «recuerdo» de la caja es el **1,5 %** del expediente. Y **no falla**: aporta
filas y la búsqueda se ve completa. Por eso «la vacuna de la rabia» da cero.

**Lo que sugiero, y es decisión tuya:** el índice de expresión sobre tres claves
genéricas no puede seguir el ritmo de los tipos de evento. O el índice lee las
claves reales por tipo, o cada evento deposita un texto buscable al nacer. La
segunda es más trabajo y no se rompe sola cada vez que nace un tipo.

---

## 🔴 ② Las citas se indexan sin su fecha en texto, y eso deja fuera media pregunta

Medido: **12 de 12** frases con ventana temporal dan cero.

```
«el paseo de Zeus»                  → 20 resultados
«el paseo de Zeus la semana pasada» → 0
«la cita de Thor en marzo»          → 0
«los pedidos de agosto»             → 0
```

`plainto_tsquery` une con AND, así que la ventana entra como si fuera contenido.
**Y a diferencia de una palabra estructural, la ventana NO se puede podar:**
sacar «pedido» no pierde nada; sacar «marzo» tira justo el filtro que la persona
pidió. *Una es ruido, la otra es señal.*

**Lo que te pido, y es lo único que necesito de vos para cerrar mi mitad:**
que `buscar_en_mi_familia` acepte tres parámetros opcionales

```sql
buscar_en_mi_familia(p_q text, p_limite int default 20,
                     p_tipo text default null,      -- cita|pedido|mascota|papel|producto|prestador
                     p_desde date default null,
                     p_hasta date default null)
```

Yo ya los produzco: la edge `buscar-intencion` devuelve `{tipo, desde, hasta,
termino}` con las fechas **calculadas en el servidor**, nunca por el modelo.
Hoy filtro del lado del cliente sobre las filas que ya vinieron, y **lo declaro
como lo que es: si lo buscado cae fuera del techo, no aparece**. Por eso pido
3× filas antes de recortar. La cura de verdad es que el filtro viaje al SQL.

Con eso se destraba además el caso «las citas de marzo» — una consulta **sin
término**, que hoy no tiene puerta: pedirle una cadena vacía a tu función
devuelve vacío por diseño, y está bien que así sea.

---

## 🔴 ③ Los dos rojos que midió E, para que estén en un solo lugar

* **La Despensa nunca aparece.** El brazo de productos filtra
  `pd.estado = 'publicado'` y las **470 filas dicen `activo`**. Once casarían con
  «alimento» y devuelve cero. *Una rama muerta dentro de un `UNION ALL` no
  falla — aporta cero filas.*
* **El techo corta antes de priorizar.** El `limit` va en la subconsulta
  ordenando sólo por `rank`; la prioridad por tipo ordena después. «clinica» casa
  con 161 citas y 3 prestadores y devuelve **50 de 50, todas citas**: la Clínica
  Los Shyris no aparece nunca. Con la bóveda sumando una fuente más, empeora solo.

---

## 🔴 ④ Un tipo nuevo trajo un destino que no existe (lo midió E)

`papel` apunta a **`/hogar/mascota/<id>/papeles`**, que no está en las 97 rutas
de `apps/cliente` — ni en `main`, ni en ninguna rama de B o C. *El resultado se
ve impecable —título, subtítulo, fecha— y el toque no lleva a ninguna parte.*
No lo ve el typecheck, ni `gen:types`, ni el router: la ruta la arma el SQL como
texto. **El tipo lo produzco yo; la ruta la armás vos**, así que lo dejo acá:
o la pantalla existe antes de que `papel` entre a la búsqueda, o ese brazo
devuelve la ruta de la mascota hasta que exista.
Lo ve el gate de calidad de búsqueda **de E** —vive en `pista/s113-e-3.0`, no en
esta rama, así que acá se nombra y no se invoca (`D-1015`: un comando que este
árbol no tiene no se escribe como si se pudiera correr)—.

## Lo que YA está de mi lado, para que no lo dupliques

* `podarConsulta` (`packages/domain`) — **46 palabras estructurales**, con las de
  bóveda/agenda/comprables/comercio que midió E. Corre **sólo en el segundo
  pase**, cuando el primero dio cero.
  🔴 **`control`, `paquete` y `consulta` NO están y no deben entrar**: son
  nombres de producto y de servicio. Lo dice el gate preguntándole al catálogo,
  no yo.
* `buscarConIntencion` (`packages/api`) — compone ① FTS crudo ② FTS podado
  ③ la edge. **Tu `buscarEnMiFamilia` no se toca.**
* `verify:busqueda-poda` — 13 verdes, con un brazo que le pregunta al catálogo
  vivo si alguna palabra de la lista es nombre de servicio o producto. **Se pone
  rojo solo** el día que nazca un servicio que choque.
* La edge `buscar-intencion` **espera despliegue tuyo.** Hasta entonces la
  puerta degrada sola: la llamada falla, `leerIntencion` devuelve `null` y la
  búsqueda sigue con los dos pases gratis — o sea, el estado de hoy, no un error
  nuevo en la cara de nadie. Verificado corriendo el E2E con la edge ausente.

## Y dos curas mías que ya viajan en esa rama, por si tocan lo tuyo

* **`coach-parte` no pasaba por el cinturón del tuteo** y su `system` en `main`
  está escrito en voseo. La implementación se mudó a `_shared/voz/tuteo.ts` y
  las dos edges comparten UNA. Control: las 132 formas de la lista → 132
  corregidas.
* **El wrapper había perdido `general`** al reconciliarse los dos `nexo.ts`. La
  edge lo emite en sus tres caminos y el tipo no lo declaraba: el dato viajaba y
  nadie lo podía leer. Repuesto, aditivo.
