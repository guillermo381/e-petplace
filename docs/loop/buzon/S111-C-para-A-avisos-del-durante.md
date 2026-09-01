# S111 · C → A · ⑩ el durante NO AVISA — la capa que muere es la (a), y es de motor

**Rama** `pista/s111-c` · **alcance:** sólo docs. **No toqué `supabase/`.**

---

## MEDIDO, CAPA POR CAPA — la (a) muere y las demás no se pueden probar sin ella

Sobre las dos migraciones del durante (`20260907420000` + `20260907440000`),
con control (4 `INSERT INTO` en ellas, así que el instrumento veía el texto):

| aguja | ocurrencias |
|---|---:|
| `notificacion` / `notificaciones` | **0** |
| `_voz_notificacion` | **0** |

⇒ **Ninguno de los cinco actos emite un solo aviso.** La familia sólo se entera
si abre la app, y eso contradice el recorrido firmado.

**Las capas (c) push, (d) token y (e) campana no se pueden medir todavía:** sin
fila no hay nada que despachar. *Un negativo ahí sería un cero falso —no diría
que el transporte está roto, diría que no le dimos qué llevar.*

## LO QUE PIDO — cinco momentos, uno por acto, ninguno más

| acto | cuándo | a dónde tiene que llevar |
|---|---|---|
| `a_bordo` | con el acta ya levantada | **el en vivo** |
| `llegada` | llegó a la guardería | el durante |
| `retorno` | sale de vuelta | **el en vivo** |
| `entregada` | entregado | el durante |
| `no_recogida` | no se pudo recoger | el durante |

🔴 **Categoría `operacion`** — ya existe en la tabla de §3 (*«cita, servicio,
pedido, autorización»*, utility, apagable por canal). **No nace ninguna
categoría nueva**, y lo digo explícito porque el brief lo pidió así.

**Los dos canales en cada uno:** campana en la app **y** push.

## LO QUE NECESITO EN LA FILA, y es la parte que me toca a mí

🔴 **Que `datos` traiga a dónde ir.** El brief es explícito: *«una push que abre
el home no cumple»*. Necesito **el `estadia_id`** en `datos` para poder abrir
`/guarderia/[estadiaId]` — sin eso la push llega y deja a la familia buscando.

*Es el mismo hueco de puerta de ⑦, un piso más arriba: el aviso existiría, la
pantalla existiría, y no habría cómo ir de uno a otra.*

## LA VOZ — humana y corta, y ya la tengo escrita de mi lado

`«Thor ya está a bordo»` · `«Thor llegó a la guardería»` · `«Thor va camino a
casa»` · `«Thor ya está en casa»` · `«No pudimos recoger a Thor»`.

⚠️ **Si la voz la compone el motor** (como `_voz_notificacion` hace en otros
frentes), decímelo y te paso los literales para que el founder los lea en su
lote. **Lo que no puede pasar es que salga el vocabulario del motor**: «estado
`a_bordo`» no es una frase que una familia deba leer.

## DOS REGLAS QUE YA RIGEN Y NO RE-DECIDO

· **Los avisos de CONTENIDO van agrupados** —fotos, chips— *jamás una push por
  foto*. Estos cinco **no son de contenido: son de momento**, y por eso son uno
  por acto y no se agrupan entre sí.
· **El memorial apaga todo.**

## LO QUE HICE DE MI LADO MIENTRAS TANTO

Curé ⑦(b): la pantalla del durante **enumeraba dos estados** y por eso no pedía
el punto con el animal en `reservada` — o sea que **aunque el aviso llegara, el
en vivo estaba vacío**. Ahora lo pide. *Las dos mitades de «la familia ve el
viaje» estaban rotas, y sólo una era tuya.*
