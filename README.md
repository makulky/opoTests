# OpoTests

Web para preparar los **temas 29 al 60**. Al entrar eliges entre **Tests** y **Supuestos prácticos**.

## Tests

Puedes elegir uno, varios o todos los temas:

| Selección | Preguntas |
|---|---|
| 1 tema | 30 |
| 2 temas | 60 |
| 3 o más temas | 80 |
| Todos los temas | 100 |

Las preguntas se eligen al azar y repartidas por igual entre los temas elegidos. Nunca se repite una pregunta en el mismo test (dos preguntas con el mismo enunciado cuentan como la misma). Las opciones también salen en orden aleatorio.

- **Modo estudio**: al responder ves al momento si aciertas, cuál era la correcta y la explicación.
- **Modo examen**: no ves nada hasta responder todas y pulsar *Finalizar*; entonces aparecen nota, aciertos, fallos y la corrección completa.
- **Simulacro** (modo examen + todos los temas): cronómetro de 120 minutos (al llegar a 120:00 el examen se entrega solo; las no respondidas cuentan en blanco), penalización elegible (sin penalización o cada 2, 3 o 4 fallos resta un acierto) y nota de 0 a 40 puntos. Se aprueba con 18 puntos.

## Supuestos prácticos
Claude prepara 5 supuestos prácticos de temas distintos elegidos al azar entre todo el temario, basados en las preguntas tipo test y planteados como casos reales del puesto de Técnico de Servicios Generales (Secretaría General del Ayuntamiento, ver `supuestos guia.jpeg`). Escribes tus respuestas y, al entregar, Claude las corrige:

- Cada supuesto vale 12 puntos: nota total sobre **60**. Se aprueba con **30**.
- Para cada supuesto: puntuación, valoración (bien, mejorable, incompleta, incorrecta, en blanco), comentario, qué podrías haber desarrollado más y los puntos clave de una respuesta completa.

Esta parte **solo funciona abriendo la web desde su enlace de claude.ai** (publicada como Artifact), porque usa la cuenta de Claude de quien la abre: gasta de su límite de uso del plan (por ejemplo Pro), sin coste extra ni API key. Abriendo `index.html` en local los tests funcionan igual y los supuestos muestran un aviso.

## Cómo abrirla
Haz doble clic en `index.html`. No necesita instalación ni servidor ni internet.

Para publicarla en internet gratis con **Vercel**: importa el repositorio de GitHub en https://vercel.com/new, deja *Framework Preset* en **Other**, sin comando de build ni directorio de salida, y despliega. Cada `git push` vuelve a publicarla. La configuración está en `vercel.json` y `.vercelignore` (no se sube la imagen de la ficha del puesto).

En Vercel funcionan los tests; los supuestos prácticos muestran un enlace a la versión de claude.ai, que es donde funcionan.

## Cómo añadir preguntas
Edita el archivo del tema en `preguntas/` (por ejemplo `preguntas/tema35.js`) con cualquier editor de texto:

```js
registrarTema(35, "Tema 35", [
  {
    pregunta: "¿Enunciado de la pregunta?",
    opciones: ["Respuesta A", "Respuesta B", "Respuesta C", "Respuesta D"],
    correcta: 2,                 // 0 = A, 1 = B, 2 = C, 3 = D
    explicacion: "Opcional.",
  },
  // ... más preguntas, separadas por comas
]);
```

- Borra las preguntas marcadas como `[EJEMPLO]`.
- Puedes cambiar `"Tema 35"` por el título real del tema.
- Si no hay preguntas suficientes para el test, se usan todas las que haya y aparece un aviso.
- Si una pregunta está mal escrita, se ignora y se avisa en la consola del navegador (F12). Si todo el archivo tiene un error de sintaxis (una coma o comilla que falta), ese tema aparecerá con 0 preguntas.
- Atajos en el test: teclas 1–4 o A–D para responder, flechas ← → para moverte.
