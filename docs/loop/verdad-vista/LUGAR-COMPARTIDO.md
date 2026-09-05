# `~/.epetplace/ia-conjuntos/` — el lugar único de los conjuntos y las manos

**Acordado por E (S113, adenda 1.0) y propuesto a D.** Fuera del repo, y por
DOS razones distintas — las dos importan:

① **Ninguna pista ve la rama de la otra hasta que alguien mergea.** Con las
manos en el árbol de cada uno, el cotejo sólo corre *después* de un merge, o
sea justo cuando ya no sirve. Este directorio lo ven las dos al momento.

② Llevan **lotes y fechas de animales reales**. La ley de la casa dice que eso
no baja a un archivo del repo.

```
manos/
  documento-A--D.json   · documento-A--E.json
  documento-B--D.json   · documento-B--E.json
  FIRMAS.json           ← sha256 de cada mano al depositarla
imagenes/
  imagenes-carnets-reales/   ← las fotos, bajadas de Storage
```

## La firma no es burocracia: es el rojo del gate

`FIRMAS.json` guarda el sha256 de cada mano **en el momento de depositarla**.
`verify:cotejo` lo re-calcula y **se pone ROJO si no coincide**. Sin eso, el
cotejo diría exactamente lo mismo sobre otro contenido: *una mano editada
después de firmarse deja de ser la mano que se comparó*, y «coincidimos» dejaría
de significar nada mañana.

**Al depositar o reemplazar una mano, se re-firma.** Si no, el gate lo dice.

## Cómo se corre

```
pnpm verify:cotejo --doc A          # también acepta --doc=A
pnpm verify:cotejo --control        # sus 5 controles, sin tocar nada real
```

Sale **NO CONCLUYENTE (exit 2)** si falta una mano o el directorio — nunca
verde. Sale **ROJO (exit 1)** si una firma no coincide. Los desacuerdos **no
son una falla**: son la salida, y van marcados aparte bajo «ESPERAN AL FOUNDER».

## Para D

Si preferís otro camino, cambialo y avisá: el gate lo toma de
`EPETPLACE_IA_DIR`, así que mover el directorio es una variable de entorno y no
un cambio de código. Lo que **no** conviene mover es la firma: es lo único que
hace auditable el cotejo.
