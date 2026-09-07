# Las predisposiciones que pueden disparar — para revisar

**582 reglas cargadas sobre 192 razas, todas `en_revision`. Cero disparan hoy**,
y eso es lo honesto: la regla de anticipación exige `estado = 'revisada'`.

Cada una puede terminar en una frase sobre la salud de un animal concreto, y
las escribió un modelo leyendo una ficha. *Que 556 tengan confianza «alta» dice
cuán seguro estaba el modelo, no cuán cierto es.*

---

## Las únicas que pueden disparar en las próximas semanas

⚠️ **Son SEIS razas, no doce.** El brief decía doce; medido contra el objeto
—mascotas **reales** (sin la marca de fixture) y **activas**— son seis, con
**22 filas**. El resto se revisa por demanda, como las fichas.

### American Bully
| código | conf. | evidencia |
|---|---|---|
| cadera | alta | Displasia de cadera y codo |
| corazon | alta | Problemas cardíacos |
| ojos | alta | Cuestiones oculares como el entropión |
| piel | alta | Alergias y afecciones de piel |
| respiracion | alta | Problemas respiratorios asociados a la conformación braquicéfala en algunos ejemplares |

### Beagle
| código | conf. | evidencia |
|---|---|---|
| cadera | alta | Displasia de cadera, algo que puede evaluarse con el veterinario |
| ojos | alta | Problemas oculares como el glaucoma, conviene chequearlos en controles periódicos |
| peso | alta | Tendencia al sobrepeso, algo para conversar con el veterinario respecto a la alimentación |

### Bulldog inglés
| código | conf. | evidencia |
|---|---|---|
| cadera | alta | Displasia de cadera, conviene chequearla con el veterinario |
| ojos | alta | Problemas oculares como el prolapso de la glándula del tercer párpado |
| piel | alta | Problemas de piel en los pliegues de la cara y el cuerpo |
| respiracion | alta | Dificultades respiratorias asociadas a su hocico corto |

### Chinchilla (Chinchilla lanigera)
| código | conf. | evidencia |
|---|---|---|
| dientes | alta | Problemas dentales por crecimiento continuo de los dientes |
| piel | alta | Afecciones de piel o pelaje relacionadas con la humedad |
| respiracion | alta | Sensibilidad respiratoria ante ambientes húmedos o mal ventilados |

### Labrador retriever
| código | conf. | evidencia |
|---|---|---|
| cadera | alta | Displasia de cadera y de codo, sobre todo si hace mucho ejercicio |
| ojos | alta | Ciertas condiciones oculares hereditarias |
| peso | alta | Tendencia al sobrepeso |

### Persa
| código | conf. | evidencia |
|---|---|---|
| dientes | alta | Problemas dentales por la estructura del cráneo |
| ojos | alta | Afecciones oculares por la forma de la cara |
| respiracion | alta | Problemas respiratorios asociados a la conformación achatada del hocico |
| rinon | alta | Enfermedad renal poliquística |

---

## Para encender las que apruebes

```sql
update public.raza_predisposicion
   set estado = 'revisada'
 where (raza_codigo, predisposicion_codigo) in (('bulldog-ingles','cadera'), …);
```

Al día siguiente el cron de las 7:30 genera el aviso; también se puede correr
`select public.generar_avisos_coach();` para verlo en el momento.

## Una nota del cargado

**582 de 583**: el JSON traía `shar-pei · piel` **dos veces**, con dos
evidencias distintas —la ficha menciona la piel en dos frases—. La clave deja
una: *una raza tiene o no tiene el sistema, no dos veces*. Se perdió la segunda
evidencia, y se dice.
