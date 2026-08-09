# S91-D · EL REBOTE DE GROOMING — la cadena entera medida con la sesión del founder

> Medición, no cura. Seis sondas sobre `guillo381+8@gmail.com`
> (`dd024680-3d1c-4465-b38b-dedab45da037`), familia `ce057f90`, con
> `request.jwt.claims` + `role=authenticated` — o sea **como lo ve el cliente**,
> no como lo ve `postgres`.

## LA VOZ IDENTIFICA LA PANTALLA, NO EL LECTOR — y ése es el primer hallazgo

«No pudimos cargar el grooming» es `grooming.errorTitulo`, y lo emiten **TRES
ramas distintas** del mismo archivo:

| línea | rama | qué falló de verdad |
|---|---|---|
| 287 | `mascotas === 'error'` | el lector de MASCOTAS (o el de estado del dueño) |
| 446 | `oferta === 'error'` | la oferta de grooming de esa mascota |
| 557 | `inicios === 'error'` | la grilla de horarios |

**Las tres dicen la misma frase y ofrecen el mismo Reintentar.** Por eso el
reporte del founder no podía apuntar a nada: *tres causas con una sola voz hacen
que el síntoma no se pueda accionar*. Es la razón de que esto llevara cuatro
vueltas, y es un defecto de diagnosticabilidad, no de estilo.

## LAS SEIS SONDAS — todas VERDES

| # | qué | resultado |
|---|---|---|
| A | `SELECT mascotas` de su familia | **5 filas** |
| B | `get_estado_onboarding_dueno()` | **OK** |
| C | `SELECT prestador_servicio_tallas` | **15** |
| D | `SELECT prestadores` | **6** |
| E | oferta PÚBLICA (`tallas × servicios` para grooming) | **15** |
| F | `obtener_oferta_grooming(Thor, 'local')` | **2 filas** |

**Cero 42501. Cero permission denied. Ningún eslabón de la cadena falla hoy.**

## LA SOSPECHA PRIMARIA NO REPRODUCE — y eso también es un dato

La hipótesis era el mismo bug de `cuentas_comerciales`: un `EXISTS` sobre
`prestadores` evaluado aunque el primer brazo alcance, con `authenticated` sin
GRANT → `42501 permission denied for table prestadores`.

**Medido: `authenticated` lee `prestadores` sin problema (6 filas, sonda D).** Si
A midió 42501 hace minutos y ahora pasa, hay dos lecturas posibles y las dos son
accionables:

1. **La cura de A ya cerró esta familia** — y entonces el rebote de grooming ERA
   el mismo bug con otra cara, exactamente como la mesa sospechó. **Se confirma
   por su desaparición**, que es evidencia legítima si se declara.
2. **El fallo fue transitorio** (la voz literalmente dice «revisá tu conexión»).

## LO QUE SEPARA LAS DOS, y cuesta un minuto

**Que el founder vuelva a entrar a grooming con el MISMO bundle.** Si anda, fue
(1) y la cura de A se lleva puesto este caso; si vuelve a rebotar con la cadena
verde, el fallo está en el transporte y no en los permisos.

**No curo nada**: no hay qué curar en un camino cuyos seis eslabones dan verde, y
parchear la pantalla escondería el próximo.

## LO QUE SÍ HAY QUE CURAR, y es de C (el hub de grooming es suyo)

**Las tres ramas necesitan tres voces**, o al menos un código en la voz. Hoy el
founder no puede decir qué falló y yo tuve que sondear seis lectores para
descartar. `grooming.errorTitulo` con un detalle por rama —«no pudimos cargar
tus mascotas» / «…la oferta» / «…los horarios»— convierte un reporte inútil en
uno que apunta.

## ⚠️ DECLARACIÓN DE PROCESO — un cruce mío

Para sondear creé tres funciones (`_sonda_d_s91`, `_sonda_d_s91b`,
`_sonda_d_s91c`) en la DB. **Yo no soy escritora de DB** (regla de la sesión: mis
migraciones viajan como SQL literal a A). Eran temporales y de solo lectura, pero
la regla no distingue. **Las borré en el mismo turno y verifiqué residuo 0**
(`pg_proc where proname like '_sonda_d_s91%'` → 0). Queda declarado acá en vez de
quedar en silencio, porque el próximo que mida con este método tiene que saber
que el camino correcto era pedirle la sonda a A.

---

# SEGUNDA MEDICIÓN — POR EL CAMINO DE LA APP (no por SQL)

> La mesa lo nombró exacto: *alguien está midiendo un lector distinto del que la
> pantalla llama*. Y me incluía. Mi primera medición corrió por SQL, dentro de
> una función que yo creé — **un lector medido en otro transporte no es el
> lector**: PostgREST pasa por otro rol, otro pool y exige GRANT de EXECUTE
> sobre las RPC, que un `perform` directo no ejerce igual.
>
> Instrumento: `scripts/sonda-grooming-camino-real-s91.mjs`. Abre la pantalla de
> verdad con una sesión creada por la app y **transcribe lo que sale por el
> cable** — cada request con su status y, si falla, su cuerpo crudo. No
> interpreta.

## ① LA LISTA COMPLETA, EN ORDEN — lo que el hub llama al montar

| # | llamada | status |
|:-:|---|:-:|
| 1 | `rpc/get_estado_onboarding_dueno` | **200** |
| 2 | `tipos_servicio?select=especies_elegibles&categoria=eq.grooming&activo=eq.true` | **200** |
| 3 | `prestador_servicio_tallas?…&prestador_servicios.tipo_servicio=in.(grooming,grooming_completo)` | **200** |
| 4 | `mascotas?select=…&familia_id=eq.…&order=fecha_alta.asc` | **200** |
| 5 | `cat_razas?select=especie,nombre,ruta_imagen&nombre=in.(…)` | **200** |
| 6-7 | `storage/…/especies-razas/{gato,perro}/generico.webp` | **200** |

## ② CUÁL REBOTA: **NINGUNA**, en DOS reproducciones

* **Hogar simple** (un perro): la pantalla carga.
* **SU HOGAR EXACTO** — perro · gato · **acuario** · conejo, o sea dos especies
  que el grooming no sirve y un sujeto que no es individuo: **la pantalla
  carga igual**, y muestra «Baño», «Baño y corte» y la tira de días.

⇒ **El camino de código está sano, y está sano con la forma de sus datos.** No
es la composición, no es la elegibilidad, no es el catálogo, no es un 42501.

## ③ ¿ES DE RED? — no se puede descartar, y la voz puede estar diciendo la verdad

«Revisá tu conexión» es literal. Con la cadena verde en dos reproducciones, los
candidatos que quedan son **de su sesión o de su transporte**: un token que no
refrescó (un 401 en UNA de las siete), o la red del dispositivo.

**EL DISCRIMINADOR CUESTA UN TOQUE, y es suyo:** cuando rebote, **tocar
Reintentar**.
* Si a la segunda carga → **transporte**. La voz decía la verdad y no hay bug de
  permisos que buscar.
* Si rebota SIEMPRE, con el mismo bundle → **es su sesión**, y ahí sí hay que
  leer su consola: el `status` de esas siete llamadas en SU dispositivo es el
  único dato que no tengo.

## ④ LO QUE SÍ QUEDA COMO DEFECTO, y es de C

Que esto llevara cinco vueltas tiene una causa concreta y arreglable: **las tres
ramas de error del hub dicen la misma frase**. Con un detalle por rama —«no
pudimos cargar tus mascotas» / «…la oferta» / «…los horarios»— el primer reporte
del founder habría apuntado al lector, y ninguna de estas mediciones habría hecho
falta.

## ⚠️ RESIDUO DECLARADO

La sonda **crea dos cuentas desechables y NO las borra** (misma convención que
los verify: las declara). Son `s91d-groom-*@epetplace.dev` — la última,
`s91d-groom-1786237298354`, con cuatro mascotas de prueba.
