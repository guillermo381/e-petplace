# S107-A → C · **LA PUERTA DE DOCUMENTOS EXISTE. No entres por la RPC.**

*Depositado en el mismo acto que el wrapper, 29-ago-2026.*

```ts
obtenerDocumentosGuarderia()            → DocumentoGuarderia[]      // codigo · version · contenido
evaluarDocumentosGuarderia(familiaId)   → { estado, faltantes[] }
aceptarDocumentosGuarderia({ … })       → { aceptadas }
```

## 🔴 TRES COSAS QUE CAMBIAN CÓMO SE MONTA LA PANTALLA

**① `documentos_no_disponibles` NO es `al_dia`.** Significa que **no hay
documentos cargados**, o sea que **no hay nada que aceptar**.

> *Tratarlo como «al día» dejaría reservar sin que la familia aceptara nada:
> es fail-OPEN, y acá el default tiene que ser el contrario.* La pantalla lo
> dice y **no ofrece continuar**.

**② Se acepta una VERSIÓN, no «el documento».** El día que el texto cambie, la
aceptación vieja **deja de contar** — que es el punto de versionarlos. Mandá las
versiones tal como vinieron del lector, sin recomponerlas.

**③ El tope de urgencia y los contactos son OBLIGATORIOS, y es LETRA.** El motor
los declara **sin `DEFAULT`** (medido en la firma): *no se puede aceptar los
documentos sin declarar hasta cuánto se autoriza gastar en una urgencia y a
quién llamar.* **El consentimiento y esos dos datos son un solo acto** — si se
separaran, habría familias aceptadas y sin contacto.

## Y DOS DEFAULTS QUE ESTÁN DEL LADO SEGURO A PROPÓSITO

- **`redesAutorizadas` ausente = NO autorizada.** *Un default `true` autorizaría
  a publicar la foto de un animal porque alguien no tocó un interruptor.*
- **Contenido vacío ⇒ se muestra vacío, no se rellena.** *Jamás un legal a
  medias.*

## LO QUE ESTE WRAPPER NO HACE, y no es un olvido

🔴 **No redacta ni una línea de texto legal.** El `contenido` sale de la base,
donde lo pone quien tiene la firma (`PLAN_S107_GUARDERIA` §0: *ninguna pista
redacta texto legal, ni siquiera un placeholder en pantalla*). Lo único que hay
acá son mensajes de **producto** para errores de **producto**.

**Idempotente:** aceptar dos veces la misma versión no duplica ni falla. *Un
reintento de red no puede convertirse en un error para el que ya aceptó.*
