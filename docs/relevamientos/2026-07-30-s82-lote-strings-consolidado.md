# LOTE DE STRINGS CONSOLIDADO — S82 (una sola aprobación)

> **Orden founder (S82-A r4, ítem 7):** los lotes pendientes eran CINCO
> aprobaciones separadas — acá se consolidan en UNA pasada. Todo lo de
> abajo vive YA en los diccionarios (`apps/cliente/src/i18n/es.ts` +
> `en.ts`, paridad exigida por `Espejo`); el gate es de LECTURA: aprobar,
> corregir o vetar por familia. Registro: tuteo neutro (regla 27).
> Lo que se apruebe pierde su marca de "pendiente" en los diccionarios;
> lo corregido entra como cura anotada.

---

## §1 · LOTE S81 — la banda del mapa (la cara MAPA del paseo)

| key (`paseo.*`) | es | en |
|---|---|---|
| bandaVerMas | Ver más del paseo | See more of the walk |
| bandaPlegar | Plegar el detalle | Collapse the detail |
| verFoto | Ver foto {{i}} de {{total}} | See photo {{i}} of {{total}} |
| deFuente | De {{fuente}}: | From {{fuente}}: |
| fotosDelPaseo | Fotos del paseo | Walk photos |

## §2 · LOTE S82-A r1 — ALTA · CARNET · BIENVENIDA (las varas del rediseño)

**ALTA** ("presentar, no formulario") — en `onboarding.*` Y su gemelo `agregarMascota.*`:

| key | es | en |
|---|---|---|
| nombreLabel *(cambió)* | ¿Cómo se llama? | What's their name? |
| presentar *(nueva — CTA vivo)* | Presentar a {{nombre}} | Introduce {{nombre}} |
| guardando *(cambió)* | Preparando el lugar de {{nombre}} | Getting {{nombre}}'s place ready |

**CARNET** ("identidad, no registro") — el par CTA/éxito alineado al verbo del flujo:

| key (`carnet.*`) | es | en |
|---|---|---|
| guardarUna | Sumar 1 vacuna a su historia | Add 1 vaccine to their story |
| guardarN | Sumar {{n}} vacunas a su historia | Add {{n}} vaccines to their story |
| exitoUna | Sumamos 1 vacuna a la historia de {{nombre}} | We added 1 vaccine to {{nombre}}'s story |
| exitoN | Sumamos {{n}} vacunas a la historia de {{nombre}} | We added {{n}} vaccines to {{nombre}}'s story |

**BIENVENIDA** — muerte (Chanel, vara "el sujeto sin explicación"): `bienvenida.ecosistema`
("el ecosistema del mundo mascota") salió de ambos diccionarios. No hay voz nueva que aprobar; se lista para que la remoción tenga firma.

## §3 · LOTE S82-A r2 — fotoEncuadre (el encuadre de la foto, lámina 2026-07-29)

| key (`fotoEncuadre.*`) | es | en |
|---|---|---|
| tituloEditar | La foto de {{nombre}} | {{nombre}}'s photo |
| elegirFoto | Elegir una foto | Choose a photo |
| elegirDetalle | Elige una donde se le vea bien la cara. Puedes acomodarla después. | Pick one where their face shows well. You can adjust it after. |
| hojaTitulo | Su foto | Their photo |
| camara | Sacar una foto | Take a photo |
| galeria | Elegir de la galería | Choose from the gallery |
| permisoCamara | Necesitamos permiso para usar la cámara. Puedes habilitarlo en los ajustes del teléfono, o elegir una foto de la galería. | We need permission to use the camera. … |
| cargarOtra | Cargar otra foto | Load another photo |
| arrastra | Arrastra la foto para acomodarla. | Drag the photo to adjust it. |
| acerca | Acerca con dos dedos para poder acomodar el encuadre. | Pinch to zoom in so you can adjust the framing. |
| visorA11y | El encuadre de la foto de {{nombre}}. Pellizca para acercar y arrastra para acomodar. | The framing of {{nombre}}'s photo. Pinch to zoom and drag to adjust. |
| asiSeVe | Así lo vas a ver | How you'll see them |
| asiSeVeDetalle | El perfil respeta tu centro y abre el plano. Todo lo chico usa el encuadre exacto. | The profile keeps your center and opens the frame. Everything small uses the exact framing. |
| enPerfil | En su perfil | On their profile |
| enHogar | En tu hogar y al elegir mascota | At home and when choosing a pet |
| enSalaVet | En la sala del veterinario | In the vet's waiting room |
| alReservar | Al reservar, sin elegir | When booking, unselected |
| alReservarElegido | Al reservar, elegido | When booking, selected |
| filaTitulo | Paseo de {{nombre}} | {{nombre}}'s walk |
| filaDetalle | sábado · 10:30 | saturday · 10:30 |
| leyendaFila | En sus citas, y en el mapa mientras alguien lo pasea | On their bookings, and on the map while someone walks them |
| listo | Listo | Done |
| exito | La foto de {{nombre}} quedó lista. | {{nombre}}'s photo is set. |
| editarFotoA11y | Cambiar la foto de {{nombre}} | Change {{nombre}}'s photo |
| errorCargar | No pudimos cargar la foto. Revisa tu conexión y prueba de nuevo. | We couldn't load the photo. Check your connection and try again. |

## §4 · LOTE S82-A r3 — el gesto vivo

| key (`fotoEncuadre.*`) | es | en |
|---|---|---|
| gestoMuerto | El ajuste no está respondiendo en este teléfono. Puedes guardar así — la foto queda centrada. | Adjusting isn't responding on this phone. You can save as is — the photo stays centered. |

## §5 · LOTE S82-A r4 — la frontera del crash (`caida.*`)

Espejo VERBATIM de las voces S79-B del prestador (allá ya aprobadas); se
listan por disciplina de lote, no porque haya redacción nueva:
*titulo* "Esta pantalla no se pudo mostrar" · *detalle* "Es un problema
nuestro, no de tu configuración — tus datos están a salvo. Prueba de
nuevo." · *reintentar* "Reintentar".

## §6 · LOTES S82-C — la posición consolidada + el perfil

**Hogar · RECOMENDACIONES** (`hogar.*`): recoUnaCosa "1 cosa" · recoCosas
"{{n}} cosas" · recoVacunaDetalle "Agendar el refuerzo" · recoCitaSemana
"Tienes 1 cita esta semana" · recoCitasSemana "Tienes {{n}} citas esta
semana" · recoHoy "{{n}} hoy" · recoManana "{{n}} mañana" · recoLuego
"{{n}} más adelante".

**Hogar · TU VIDA** (`hogar.*`): vidaTitulo "Tu vida" *(antes "La vida
del hogar")* · filtroTodo "Todo" · filtroSalud "Salud" ·
filtroSinMomentos "Nada por acá con ese filtro." *(singular)* · las voces
del hecho: hechoPaseo "Salió a pasear" · hechoGrooming "Sesión de
estética" · hechoAdiestramiento "Sesión de adiestramiento" · hechoVacuna
"Recibió la vacuna {{nombre}}" · hechoVacunaSinNombre "Recibió una
vacuna" · hechoConsulta "Visita al veterinario" · hechoMomento "Un
momento de cuidado" · vidaCargarMas "Cargar más".

**Perfil** (`perfil.*`): vida "Su historia" · editar "Editar" · compartir
"Compartir" · compartirMensaje "Conoce a {{nombre}} en e-PetPlace" ·
pastillaAlDia "Al día" · pastillaAtencion "Necesita atención" ·
pastillaConociendo "Conociéndolo" · vozProcedencia "Según su raza y edad"
· **la grilla "Cómo está hoy"**: hoyTitulo "Cómo está hoy" ·
hoyDesparasitacion "Desparasitación" · hoyAlergias "Alergias" ·
hoySinRegistro "Sin registro" · hoyAlDia "Al día" · hoyFaltaUna "Falta
una" · hoyRefuerzoVencido "refuerzo vencido" · hoyHasta "hasta {{fecha}}"
· hoyEnCarnet "{{n}} en el carnet" · hoyUltima "última {{fecha}}" ·
hoySinRegistroLinea "Sin registro todavía: {{lista}}" · vacunasResumenUna/
vacunasResumen · filtroSemana/filtroMes · hechosPaseos/hechosVacunas ·
reservarServicio "Reservar un servicio" · carnetVacio "Su carnet todavía
está vacío" + carnetVacioDetalle + cargarCarnet · vitales* (Vitales,
recorridos, de paseo, metas, comparativa) · bienestarVacio · **las voces
del MOMENTO** (gate EXIGIBLE — LOYALTY §3, jamás desempeño): vozCardM1..M4
("{{nombre}} está en sus primeros meses. Es el momento de las primeras
vacunas y los primeros hábitos." · "…está creciendo. Es el momento de
socializar y aprender." · "…está en plena adultez joven. Es el momento de
asentar hábitos." · "…está en una etapa de cuidado especial. Es el
momento de seguir de cerca sus controles.")

**Hoja de vacuna** (`vacunaHoja.*`, lazo 1 de C): notaDelVet "La nota del
veterinario" · notaDelVetDetalle "El registro original, tal como lo
escribió" · notaClinica/notaMotivo/notaAnamnesis/notaExamen/notaPlan/
notaIndicaciones · sinFormula "No le recetaron nada esta vez."

**Muertes de C (Ley 37, se listan para que tengan firma):**
verYDecidir · verlo · verLaCita · citaAgendadaTitulo ·
citaAgendadaSinServicio · filtroQuien · filtroQue · filtroVacunas ·
motivoLabel · proximoControlFecha · verCompleto (grep en cero).

**ADENDA §6 · S82-C r10** (entra a ESTE lote por orden founder — no se
abre un sexto): **`perfil.hoySinFechaRefuerzo`** "Sin fecha de refuerzo"
/ "No booster date" — nace de un defecto REAL del gate: la celda decía
"Sin registro" mientras la pantalla mostraba "8 vacunas en su carnet"
dos secciones abajo. La celda mide si sabemos el ESTADO, y con vacunas
cargadas SIN `fecha_proxima` lo que falta es la fecha, no los datos. Los
tres casos quedan distinguidos: sin ningún registro (va a la línea de
ausencia) · con registros y sin fecha (esta voz, canto neutro) · con
fecha (al día / falta una). **+ el eje temporal de Vitales:**
`ventanaHoy` "Hoy" · `ventanaSemana` "Última semana" · `ventanaMes`
"Último mes" · `vitalesSinSalidas` "No salió a pasear en este tramo." /
"No walks in this period."
**Muerte de r10 (Ley 37):** `hoyDeCuantos` — la fracción "1 de 4" murió
sin consumidores (el founder preguntó cuáles eran los otros tres: el
rótulo no nombraba lo que contaba, y la línea de ausencia ya los nombra).

---

**Nota de la grilla y los motores (r4):** las celdas de "Cómo está hoy"
que decían "Sin registro" por ausencia de motor YA tienen motor
(desparasitación · alergias con "ninguna conocida" · serie de peso ·
conteo de consultas en el contrato). Cuando C consuma los lectores
nuevos, nacerán 1-2 voces más (p. ej. "Ninguna conocida") — entran como
adenda a ESTE lote, no como sexto lote.
