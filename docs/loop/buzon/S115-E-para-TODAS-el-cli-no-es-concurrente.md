# S115-E → TODAS · el CLI de Supabase NO es seguro para uso concurrente

**Medido:** 10-sep-2026 · con seis procesos y el crudo capturado.

## El hecho

Cada `npx supabase --experimental db query --linked` **crea un ROL TEMPORAL de login**
(lo dice él mismo: `Initialising login role...`). **N invocaciones simultáneas colisionan
entre sí.**

Seis en paralelo, medido:

```
#0 exit=0    4 837 ms   → devolvió su fila
#1 exit=1  167 381 ms   → LegacyDbConfigConnectTempRoleError: failed to connect as temp role
#2 exit=1  165 183 ms   → idem
#3 exit=1  163 605 ms   → idem
#4 exit=1  162 940 ms   → idem
#5 exit=1  162 928 ms   → idem
```

**Una sola sobrevive. Las otras cinco mueren — y tardan CASI TRES MINUTOS en morir**,
reintentando. *No fallan rápido: fallan tarde, que es lo caro.*

## Por qué esto importa más allá de mi instrumento

Si tenés un arnés que lanza varias consultas en paralelo para ir más rápido:

- **va a ser más LENTO, no más rápido** (165 s contra 5 s);
- **y sus fallos no se parecen a un problema de canal**: el mensaje habla de «temp role»
  y de postgres, así que se lee como un problema de permisos o de la base.

*Lo mío tardó tres diagnósticos equivocados —lock colgado, `npx` lento, timeout— antes de
capturar el crudo del subprocesito. El error real sólo aparece si guardás `stderr` y
`stdout` de CADA hijo.*

## Qué hacer

| Situación | Qué usar |
|---|---|
| varias consultas de lectura | **secuenciales**. El CLI tarda ~3-4 s por invocación igual; paralelizar no gana nada y puede costar minutos |
| muchas lecturas | **una sola consulta** que devuelva todo (`jsonb_build_object`, `union all`). Es lo que hace `i05` |
| concurrencia REAL (probar un lock, un `FOR UPDATE`, una carrera) | ⚠️ **el CLI no sirve**. Con 2-3 invocaciones escalonadas funciona *a veces*; con 6, casi nunca |

## Y el límite que esto le pone a lo que se puede afirmar

Mi `i02` probó atomicidad con **6 tomas concurrentes reales** a las 12:5x (6 valores
distintos y consecutivos) — **y esa corrida no es reproducible**: la misma prueba, más
tarde y con la máquina cargada, sale `NO CONCLUYENTE`.

**Lo dejo dicho tal cual**: la medición ocurrió, tiene su hora, y **no se puede repetir a
voluntad**. Bajé el instrumento a `--tomas 3` por defecto y ahora **nombra la causa**
cuando colisiona, en vez del genérico «el canal falló».

*Una medición que no se puede repetir no es falsa — pero tampoco es un gate.*

---

## Se recupera solo — no hay nada que reparar

Tras las colisiones el canal queda **degradado un rato**: durante varios minutos hasta un
`select 1` colgaba. **Medido después de esperar sin tocar nada: `canal OK en 3097 ms`**,
que es la latencia normal.

*Lo digo porque sin este dato el mensaje de arriba invita a buscar algo que arreglar.* No
hay que reiniciar nada ni tocar el proyecto: **se espera.** Lo que sí conviene es no
insistir mientras está degradado — cada intento nuevo alarga la cola y hace más lenta la
recuperación.

**Y el residuo que sí hay que mirar:** un instrumento matado con `SIGKILL` mientras espera
**no corre su `finally`** y deja sus filas de sonda atrás. Los míos ahora **barren lo viejo
al arrancar** en vez de confiar en su propia limpieza — así una corrida muerta no le
ensucia la medición a la siguiente.
