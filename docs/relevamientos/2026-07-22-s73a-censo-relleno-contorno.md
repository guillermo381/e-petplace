# S73-A · CENSO — los 32 consumidores de SelectorOpcion por la ley 19.8 (relleno/contorno)

> **Estado: CENSO CLASIFICADO — EL FOUNDER FIRMA LA CLASIFICACIÓN, no la
> deduce.** Método: cada consumidor citado con QUÉ elige y de QUÉ MODELO
> vienen sus opciones (la prueba: *"¿existiría si yo no estuviera
> eligiendo?"* · árbitro: fila de catálogo con nombre+precio = existe =
> RELLENO; parámetro = se fija = CONTORNO). Los casos que la mesa no
> puede resolver de memoria van marcados ⚖️ para el founder.

## EL CASO QUE LA MESA PIDIÓ — la duración del paseo, con literal

`explorar/paseo/index.tsx` (selector `cuandoDuracion`): las opciones
vienen de **`bloques`** — cada bloque trae **`desde` (precio) y `varia`**
y la pantalla pinta *"desde $X"* al elegirlo. Son las OFERTAS REALES
agregadas server-side (S55-B2/7.13: "bloques realmente ofertados de
verdad" — filas de `prestador_servicios` por bloque del menú canónico,
con precio propio). **Por el árbitro: fila de catálogo con precio →
EXISTE → candidata a RELLENO.** No es "45 minutos" el dato — es "la
salida de 60 con su precio". ⚖️ El founder firma (es el caso bisagra).

## CLIENTE (15 consumidores)

| # | Superficie | Qué elige | Fuente de las opciones | Veredicto candidato |
|---|---|---|---|---|
| 1 | `explorar/paseo` | mascota | entidades vivas (frontera elegibilidad) | **RELLENO** (ya construido: entity chip) |
| | | duración | bloques OFERTADOS con precio (`desde`/`varia`) | ⚖️ **RELLENO** (el caso bisagra, arriba) |
| | | día · hora | coordenadas del calendario/grilla | **CONTORNO** (firmado de facto: "fecha, horarios me gustan como están") |
| 2 | `explorar/grooming` | mascota · servicio (Baño/Baño y corte = `_grooming_ofertas_cobrables`, precio por talla) · día · hora | catálogo comprable vs coordenadas | **RELLENO · RELLENO · CONTORNO · CONTORNO** (el ejemplo literal del founder) |
| 3 | `explorar/adiestramiento` | mascota · comprable (sesión/programa con precio) · día · hora | ídem | **R · R · C · C** |
| 4 | `explorar/veterinaria` | mascota · tipo de atención (filas `tipos_servicio` con "desde" real) · día · hora | ídem | **R · R (⚖️ recién firmada en columnas-contorno — si pasa a relleno, re-gate) · C · C** |
| 5 | `hogar/index` | filtro mascotas (multiple) · filtro tipos | entidades / familias de evento | ⚖️ **FILTRO no es elección de compra** — la mesa lee: los filtros quedan CONTORNO (elegir-varios diluye la presencia); el founder arbitra |
| 6 | `hogar/adiestramiento` | chips del vocabulario de bitácora (multiple, catálogo `cat_objetivos`) | filas de catálogo SIN precio | ⚖️ existe-pero-no-se-compra; lectura: contorno (es filtro/registro) |
| 7 | `hogar/paseos` | día/hora del Mover (P14) | coordenadas | **CONTORNO** |
| 8 | `hogar/agregar/fecha` + `onboarding/fecha` (CampoFecha) | mes/año/día | coordenadas | **CONTORNO** |
| 9 | `cuenta/preferencias` | idioma | configuración | **CONTORNO** |
| 10 | `components/checkout-reserva` | opciones de pago/camino | decisión de flujo | **CONTORNO** |
| 11 | `components/talla-pelaje-hoja` | talla S/M/L | parámetro del perfil (P19) | **CONTORNO** |
| 12 | `components/coach` | respuestas de las 3 preguntas | plantillas | **CONTORNO** |
| 13 | `components/plan-hoja` | 7 días (multiple) + frecuencia | coordenadas | **CONTORNO** |
| 14 | `components/paquete-hoja` | presets 5/10/15 salidas | ofertas EN LETRA con precio (D-343) | ⚖️ filas de oferta con precio → lectura: RELLENO |
| 15 | `onboarding/mascota` (SelectorEspecie hermano) | especie | catálogo de especies | ⚖️ (es SelectorEspecie, no SelectorOpcion — D-496 lo cruza) |

## PRESTADOR (16 consumidores)

| # | Superficie | Qué elige | Veredicto candidato |
|---|---|---|---|
| 16-19 | los 4 talleres (`paseo/grooming/adiestramiento/veterinaria/taller`) | qué bloques/servicios OFRECER (menú canónico de plataforma) | ⚖️ el prestador CONFIGURA su oferta: las opciones son catálogo de plataforma pero el acto es fijar SU config — lectura de mesa: CONTORNO (config), el founder arbitra |
| 20 | `vacaciones` | fechas | **CONTORNO** |
| 21 | `cuenta/preferencias` | idioma | **CONTORNO** |
| 22-24 | `grooming/cita/[citaId]` (index/durante/cierre) | registrables de la silla (catálogo de registrables) | ⚖️ filas de catálogo sin precio — lectura: contorno (registro del acto) |
| 25 | `adiestramiento/cita/durante` | objetivos trabajados (catálogo currículum) | ⚖️ ídem 22-24 |
| 26 | `veterinaria/mostrador/atencion` | servicio del catálogo PROPIO (con precio) · medio de cobro | **RELLENO (⚖️)** · **CONTORNO** |
| 27 | `veterinaria/consulta/[citaId]` | caso nuevo/activo/ninguno | decisión de flujo | 
| 28 | `veterinaria/coordinar/[citaId]` | fecha/hora | **CONTORNO** |
| 29 | `cita/[citaId]/durante` | motivos GPS (catálogo) | ⚖️ contorno (registro) |
| 30 | `cuenta-comercial/bancarios` | tipo de cuenta | **CONTORNO** |
| 31 | `components/seccion-horarios` | días/franjas | **CONTORNO** |
| 32 | `gallery/TokenGallery` | especímenes | N/A (herramienta) |

## El resumen para la firma

- **RELLENO claro (la ley aplica):** mascota (hecho) · comprables de los
  4 oficios del cliente (grooming firmado por letra del founder;
  vet ⚖️ por re-gate de columnas; paseo-duración ⚖️ el bisagra;
  paquete-presets ⚖️).
- **CONTORNO claro:** fechas, horas, días, idioma, talla, medios de
  cobro, decisiones de flujo — "lo que se fija".
- **⚖️ Para el founder:** los FILTROS multiple (¿la ley aplica a
  filtrar?) · los catálogos SIN precio (vocabulario, registrables,
  motivos: existen pero no se compran) · los TALLERES del prestador
  (configurar la oferta ≠ reservar) · la duración del paseo (el bisagra
  con literal arriba).
- **Confirmación práctica verificada:** ningún caso RELLENO del censo
  supera 6 opciones — la ley no pide paredes de relleno.
