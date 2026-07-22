# S74-B · COSECHA DEL PRESTADOR (para el gate del founder en dispositivo)

Formato QUÉ / DÓNDE (ruta literal) / CÓMO SE RECONOCE. App del PRESTADOR.

**PASO 0 — el binario (L-160, obligatorio antes de evaluar nada):** en el
logcat, la línea `[update] id=…` tiene que corresponder al group
**`bc12ed81-17f5-4f8a-94c6-689a91b0f257`** y NO decir `embedded=true`.
OJO: el group `4c4b2b19…` es el ANTERIOR — es el único sin la cura del
teclado; si el teléfono corre ese, todo el punto 1 va a salir "roto" sin
estarlo. Doble reinicio de la APK (la 1ª descarga, la 2ª aplica).

---

## 1. El dictado con teclado real (la consulta)

**DÓNDE:** tab HOY → una cita de veterinaria → en el detalle, la celda
**"Iniciar consulta"** → la fase de dictado.

| QUÉ | CÓMO SE RECONOCE |
|---|---|
| La puerta del dictado se abre sola | Al entrar, el teclado del sistema SUBE SOLO con el campo de la nota enfocado — no hay que tocar nada para empezar a dictar. |
| El hint del mic vive junto al campo | Bajo el campo de la nota: *"Para dictar, toca el micrófono de tu teclado."* — junto al campo, no en la cabecera. |
| 🔴 El campo NO queda bajo el teclado (la cura de tu hallazgo) | Con el teclado ARRIBA y el campo enfocado, el campo y lo que escribís/dictás se VEN — jamás escribir a ciegas. **Este punto se verifica CON el teclado desplegado (L-162)**; vale también tipear hasta el final del texto largo. |
| El Confirmar apagado dice QUÉ falta | Dictá algo incompleto (p. ej. sin diagnóstico) y estructurá: junto al botón **"Guardar la consulta"** apagado aparece una línea POR CADA falta — *"Falta el motivo de consulta." · "Falta el diagnóstico." · "Completa la dosis y la frecuencia para confirmar." · "Falta la condición del caso." · "Elige el caso activo."* Nunca un botón gris mudo adivinando. |
| La consulta se reconstruye sola (D-488) | Salí de la consulta (atrás) y volvé a entrar desde la cita, las veces que quieras: la pantalla vuelve a armarse con la mascota correcta desde la cita — sin error de "uuid" ni pantalla rota. |

Al estructurar, el teclado se guarda solo (la espera no pelea con él).

## 2. El mostrador — Ley 23 y la cara

**DÓNDE:** tab HOY → botón teal **"Registrar atención"**.

| QUÉ | CÓMO SE RECONOCE |
|---|---|
| Reconocido = SIN botón de alta (Ley 23) | Buscá un cliente que YA vive en e-PetPlace (p. ej. tu cuenta `guillo381+8`, por email o teléfono): aparece la fila *"Ya en e-PetPlace — toca para elegir la mascota"* y el botón **"Registrar mascota nueva" NO se dibuja** — el alta para esa familia va por el handshake ("Mascota nueva" adentro de autorizar). |
| Desconocido = el alta vuelve | Borrá y buscá un contacto inexistente: el botón **"Registrar mascota nueva"** reaparece abajo. |
| El vet VE a quién atiende (la cara) | Cliente de la clínica → tocá una mascota (p. ej. Thor): la pantalla de atención muestra su **FOTO real** (o la huella digna si no tiene) + el **nombre** arriba — en la fase de atención Y en la de cobro. |
| El teclado tampoco tapa acá | La búsqueda y el alta van envueltas: con teclado arriba, el campo activo se ve (L-162). |

## 3. La atención — los tres estados de la carga

**DÓNDE:** la misma pantalla de atención del punto 2 (mostrador → mascota).

| QUÉ | CÓMO SE RECONOCE |
|---|---|
| CARGANDO | Al entrar, un instante de esqueleto ESTÁTICO (formas grises, sin shimmer) — jamás pantalla con botón gris que parece colgada. |
| ERROR con reintento | Activá modo avión ANTES de entrar: voz de error que dirige (sin "revisá tu conexión" — esa queda para red… y acá justamente ES red, la voz lo dice) + botón **"Reintentar"**. Sacá el modo avión, tocá Reintentar: carga. |
| VACÍO con camino | Solo existe si el negocio no tiene NINGÚN servicio vet prendido: Thor con su cara + *"Prende un servicio en tu consultorio para registrar atenciones."* + botón **"Activar servicios"** que lleva al taller. **En tu cuenta no se reproduce sin apagar tus servicios** — está verificado por captura (`scripts/capturas/s73-b-atencion-vacio-cta-taller.png`); si querés verlo vivo: taller → apagar los servicios vet → mostrador → volver a prenderlos. Opcional. |

---

**Nota honesta de límites:** las capturas de referencia S73-B son web — el
render web no tiene teclado blando, por eso los puntos de teclado (1 y 2)
solo se firman en tu dispositivo (L-162, límite declarado del harness).
Nada de esta cosecha exige publicar: el OTA ya está arriba (group
`bc12ed81…`, ancla `4b501e5`).
