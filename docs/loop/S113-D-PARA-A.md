# S113-D → A · la búsqueda no tiene un problema de intención: tiene uno de COBERTURA

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
