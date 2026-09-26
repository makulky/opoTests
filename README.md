# OpoTests

Web para hacer tests de los **temas 29 al 60**. Puedes elegir uno, varios o todos los temas:

| Selección | Preguntas |
|---|---|
| 1 tema | 30 |
| Varios temas | 60 |
| Todos los temas | 90 |

Las preguntas se eligen al azar y repartidas por igual entre los temas elegidos. Nunca se repite una pregunta en el mismo test (dos preguntas con el mismo enunciado cuentan como la misma). Las opciones también salen en orden aleatorio.

- **Modo estudio**: al responder ves al momento si aciertas, cuál era la correcta y la explicación.
- **Modo examen**: no ves nada hasta responder todas y pulsar *Finalizar*; entonces aparecen nota, aciertos, fallos y la corrección completa.

## Cómo abrirla
Haz doble clic en `index.html`. No necesita instalación ni servidor ni internet.

Para publicarla en internet gratis, sube la carpeta completa a GitHub Pages o Netlify (arrastrar y soltar en https://app.netlify.com/drop).

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
