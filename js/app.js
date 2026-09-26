/* OpoTests - lógica de la aplicación */

const TEMA_INICIAL = 29;
const TEMA_FINAL = 60;
const LETRAS = "ABCDEFGH";

// Número de preguntas del test según la selección de temas
const PREGUNTAS_UN_TEMA = 30;
const PREGUNTAS_VARIOS_TEMAS = 60;
const PREGUNTAS_TODOS_TEMAS = 90;

// Bancos de preguntas registrados por los archivos de /preguntas
const TEMAS = {};

/**
 * Registra el banco de preguntas de un tema. Lo llaman los archivos preguntas/temaNN.js.
 * Cada pregunta: { pregunta: "…", opciones: ["…", "…"], correcta: <índice desde 0>, explicacion: "…" (opcional) }
 */
function registrarTema(numero, titulo, preguntas) {
  const validas = [];
  (preguntas || []).forEach((p, i) => {
    const ok = p && typeof p.pregunta === "string" && Array.isArray(p.opciones) &&
      p.opciones.length >= 2 && Number.isInteger(p.correcta) &&
      p.correcta >= 0 && p.correcta < p.opciones.length;
    if (ok) validas.push(p);
    else console.warn(`Tema ${numero}: la pregunta ${i + 1} tiene un formato incorrecto y se ignora.`, p);
  });
  TEMAS[numero] = { numero, titulo: titulo || `Tema ${numero}`, preguntas: validas };
}

// Estado del test en curso
const estado = {
  temasSeleccionados: new Set(),
  temasTest: [],   // temas con los que se generó el test actual (para "Repetir test")
  modo: "estudio",
  preguntas: [],   // [{ pregunta, opciones, correcta, explicacion, tema }] ya barajadas
  respuestas: [],  // índice elegido por pregunta o null
  actual: 0,
  finalizado: false,
};

const $ = (id) => document.getElementById(id);

function barajar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function plural(n, palabra) {
  return `${n} ${palabra}${n === 1 ? "" : "s"}`;
}

function mostrarPantalla(id) {
  ["pantalla-inicio", "pantalla-test", "pantalla-resultados"].forEach((p) => {
    $(p).hidden = p !== id;
  });
  window.scrollTo(0, 0);
}

function guardarModo(modo) {
  try { localStorage.setItem("opotests-modo", modo); } catch (e) { /* sin almacenamiento */ }
}
function leerModo() {
  try { return localStorage.getItem("opotests-modo"); } catch (e) { return null; }
}

/* ---------- Selección de temas ---------- */

// Temas del rango que tienen al menos una pregunta
function temasDisponibles() {
  const lista = [];
  for (let n = TEMA_INICIAL; n <= TEMA_FINAL; n++) {
    if (TEMAS[n] && TEMAS[n].preguntas.length > 0) lista.push(n);
  }
  return lista;
}

function esSeleccionTodos(temas) {
  const disponibles = temasDisponibles();
  return disponibles.length > 1 && disponibles.every((n) => temas.includes(n));
}

function preguntasObjetivo(temas) {
  if (temas.length <= 1) return PREGUNTAS_UN_TEMA;
  return esSeleccionTodos(temas) ? PREGUNTAS_TODOS_TEMAS : PREGUNTAS_VARIOS_TEMAS;
}

// Dos preguntas con el mismo enunciado se consideran la misma (aunque estén en temas distintos)
function claveDePregunta(p) {
  return p.pregunta.trim().toLowerCase().replace(/\s+/g, " ");
}

function contarPreguntasUnicas(temas) {
  const claves = new Set();
  temas.forEach((n) => TEMAS[n].preguntas.forEach((p) => claves.add(claveDePregunta(p))));
  return claves.size;
}

function descripcionTemas(temas) {
  if (temas.length === 1) return TEMAS[temas[0]].titulo;
  if (esSeleccionTodos(temas)) return "Todos los temas";
  return `Temas ${temas.join(", ")}`;
}

function temasOrdenados() {
  return [...estado.temasSeleccionados].sort((a, b) => a - b);
}

function pintarTemas() {
  const cont = $("lista-temas");
  cont.innerHTML = "";
  for (let n = TEMA_INICIAL; n <= TEMA_FINAL; n++) {
    const tema = TEMAS[n] || { numero: n, titulo: `Tema ${n}`, preguntas: [] };
    const total = tema.preguntas.length;
    const seleccionado = estado.temasSeleccionados.has(n);
    const btn = document.createElement("button");
    btn.className = "tema" + (seleccionado ? " seleccionado" : "");
    btn.disabled = total === 0;
    btn.title = tema.titulo;
    btn.setAttribute("aria-pressed", String(seleccionado));
    btn.innerHTML = `<strong></strong><small></small>`;
    btn.querySelector("strong").textContent = `Tema ${n}`;
    btn.querySelector("small").textContent = plural(total, "pregunta");
    btn.addEventListener("click", () => alternarTema(n));
    cont.appendChild(btn);
  }
  actualizarResumenSeleccion();
}

function alternarTema(n) {
  if (estado.temasSeleccionados.has(n)) estado.temasSeleccionados.delete(n);
  else estado.temasSeleccionados.add(n);
  pintarTemas();
}

function alternarTodos() {
  if (esSeleccionTodos(temasOrdenados())) estado.temasSeleccionados.clear();
  else estado.temasSeleccionados = new Set(temasDisponibles());
  pintarTemas();
}

function actualizarResumenSeleccion() {
  const temas = temasOrdenados();
  const todos = esSeleccionTodos(temas);
  $("btn-todos").textContent = todos ? "Quitar todos" : "Seleccionar todos";
  $("btn-todos").disabled = temasDisponibles().length === 0;

  const resumen = $("resumen-seleccion");
  const aviso = $("aviso-inicio");
  const btn = $("btn-comenzar");

  if (temas.length === 0) {
    resumen.textContent = "Ningún tema seleccionado.";
    aviso.hidden = true;
    btn.disabled = true;
    btn.textContent = "Comenzar test";
    return;
  }

  const objetivo = preguntasObjetivo(temas);
  const unicas = contarPreguntasUnicas(temas);
  const total = Math.min(objetivo, unicas);
  const seleccion = todos ? "Todos los temas seleccionados" : `${plural(temas.length, "tema")} seleccionado${temas.length === 1 ? "" : "s"}`;
  resumen.textContent = `${seleccion} · test de ${objetivo} preguntas`;

  if (unicas < objetivo) {
    aviso.textContent = `Entre los temas elegidos solo hay ${plural(unicas, "pregunta")}; el test tendrá ${total} en lugar de ${objetivo}.`;
    aviso.hidden = false;
  } else {
    aviso.hidden = true;
  }
  btn.disabled = false;
  btn.textContent = `Comenzar test (${total} preguntas)`;
}

/* ---------- Test ---------- */

/**
 * Sortea las preguntas del test sin repetir ninguna.
 * Reparte de forma equilibrada: toma una pregunta de cada tema por turnos (en orden aleatorio)
 * hasta llegar a la cantidad pedida o agotar los bancos.
 */
function sortearPreguntas(temas, cantidad) {
  const usadas = new Set();
  const colas = barajar(temas).map((n) => ({ tema: n, cola: barajar(TEMAS[n].preguntas) }));
  const elegidas = [];

  while (elegidas.length < cantidad && colas.some((c) => c.cola.length > 0)) {
    for (const c of colas) {
      if (elegidas.length >= cantidad) break;
      while (c.cola.length > 0) {
        const p = c.cola.pop();
        const clave = claveDePregunta(p);
        if (usadas.has(clave)) continue;
        usadas.add(clave);
        elegidas.push({ p, tema: c.tema });
        break;
      }
    }
  }

  // Mezcla el orden final y baraja las opciones (recalculando la correcta)
  return barajar(elegidas).map(({ p, tema }) => {
    const orden = barajar(p.opciones.map((_, i) => i));
    return {
      pregunta: p.pregunta,
      opciones: orden.map((i) => p.opciones[i]),
      correcta: orden.indexOf(p.correcta),
      explicacion: p.explicacion || "",
      tema,
    };
  });
}

function comenzarTest(temas) {
  if (temas.length === 0) return;

  estado.modo = document.querySelector('input[name="modo"]:checked').value;
  guardarModo(estado.modo);

  const objetivo = preguntasObjetivo(temas);
  const preguntas = sortearPreguntas(temas, objetivo);
  if (preguntas.length === 0) return;
  estado.temasTest = temas;
  estado.preguntas = preguntas;
  estado.respuestas = preguntas.map(() => null);
  estado.actual = 0;
  estado.finalizado = false;

  const total = preguntas.length;
  $("test-titulo").textContent = `${descripcionTemas(temas)} · ${estado.modo === "estudio" ? "Modo estudio" : "Modo examen"}`;
  $("marcador").hidden = estado.modo !== "estudio";
  const aviso = $("aviso-test");
  aviso.hidden = total >= objetivo;
  aviso.textContent = `Solo hay ${plural(total, "pregunta")} en ${temas.length === 1 ? "este tema" : "los temas elegidos"}.`;

  pintarMapa();
  pintarPregunta();
  mostrarPantalla("pantalla-test");
}

function contarAciertos() {
  return estado.respuestas.reduce(
    (acc, r, i) => acc + (r !== null && r === estado.preguntas[i].correcta ? 1 : 0), 0);
}

function contarRespondidas() {
  return estado.respuestas.filter((r) => r !== null).length;
}

function pintarPregunta() {
  const i = estado.actual;
  const p = estado.preguntas[i];
  const total = estado.preguntas.length;
  const respuesta = estado.respuestas[i];
  const esEstudio = estado.modo === "estudio";
  const bloqueada = esEstudio && respuesta !== null;

  $("test-progreso").textContent = `Pregunta ${i + 1} de ${total} · ${contarRespondidas()} respondidas` +
    (estado.temasTest.length > 1 ? ` · ${TEMAS[p.tema].titulo}` : "");
  $("barra-relleno").style.width = `${(contarRespondidas() / total) * 100}%`;
  $("pregunta-texto").textContent = `${i + 1}. ${p.pregunta}`;

  const cont = $("opciones");
  cont.innerHTML = "";
  p.opciones.forEach((texto, j) => {
    const btn = document.createElement("button");
    btn.className = "opcion";
    btn.innerHTML = `<span class="letra"></span><span class="texto"></span>`;
    btn.querySelector(".letra").textContent = `${LETRAS[j]})`;
    btn.querySelector(".texto").textContent = texto;

    if (bloqueada) {
      btn.disabled = true;
      if (j === p.correcta) btn.classList.add("correcta");
      else if (j === respuesta) btn.classList.add("incorrecta");
    } else if (j === respuesta) {
      btn.classList.add("elegida");
    }
    btn.addEventListener("click", () => responder(j));
    cont.appendChild(btn);
  });

  // Explicación solo en modo estudio tras responder
  const exp = $("explicacion");
  if (bloqueada) {
    const acierto = respuesta === p.correcta;
    exp.className = `explicacion ${acierto ? "ok" : "ko"}`;
    exp.innerHTML = "<strong></strong><span></span>";
    exp.querySelector("strong").textContent = acierto
      ? "¡Correcto! "
      : `Incorrecto. La respuesta correcta es la ${LETRAS[p.correcta]}. `;
    exp.querySelector("span").textContent = p.explicacion;
    exp.hidden = false;
  } else {
    exp.hidden = true;
  }

  if (esEstudio) $("marcador").textContent = `✔ ${contarAciertos()} · ✘ ${contarRespondidas() - contarAciertos()}`;

  $("btn-anterior").disabled = i === 0;
  $("btn-siguiente").disabled = i === total - 1;

  const pendientes = total - contarRespondidas();
  $("btn-finalizar").disabled = pendientes > 0;
  $("info-finalizar").textContent = pendientes > 0
    ? `Te quedan ${pendientes} pregunta${pendientes === 1 ? "" : "s"} por responder.`
    : "Has respondido todas las preguntas.";

  actualizarMapa();
}

function responder(j) {
  const i = estado.actual;
  if (estado.modo === "estudio" && estado.respuestas[i] !== null) return;
  estado.respuestas[i] = j;
  pintarPregunta();
}

function irA(i) {
  if (i < 0 || i >= estado.preguntas.length) return;
  estado.actual = i;
  pintarPregunta();
}

function pintarMapa() {
  const cont = $("mapa");
  cont.innerHTML = "";
  estado.preguntas.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.addEventListener("click", () => irA(i));
    cont.appendChild(btn);
  });
}

function actualizarMapa() {
  const botones = $("mapa").children;
  estado.preguntas.forEach((p, i) => {
    const btn = botones[i];
    const r = estado.respuestas[i];
    btn.className = "";
    if (r !== null) {
      if (estado.modo === "estudio") btn.classList.add(r === p.correcta ? "correcta" : "incorrecta");
      else btn.classList.add("respondida");
    }
    if (i === estado.actual) btn.classList.add("actual");
  });
}

function finalizarTest() {
  if (contarRespondidas() < estado.preguntas.length) return;
  if (estado.modo === "examen" && !confirm("¿Seguro que quieres finalizar el examen?")) return;
  estado.finalizado = true;
  pintarResultados();
  mostrarPantalla("pantalla-resultados");
}

function salirTest() {
  if (contarRespondidas() > 0 && !confirm("Si sales perderás el progreso de este test. ¿Salir?")) return;
  volverInicio();
}

function volverInicio() {
  pintarTemas();
  mostrarPantalla("pantalla-inicio");
}

/* ---------- Resultados ---------- */

function pintarResultados() {
  const total = estado.preguntas.length;
  const aciertos = contarAciertos();
  const fallos = total - aciertos;

  $("res-titulo").textContent = `Resultados · ${descripcionTemas(estado.temasTest)}`;
  $("res-nota").textContent = ((aciertos / total) * 10).toFixed(2).replace(".", ",");
  $("res-aciertos").textContent = aciertos;
  $("res-fallos").textContent = fallos;
  $("res-porcentaje").textContent = `${Math.round((aciertos / total) * 100)}%`;

  const lista = $("correccion");
  lista.innerHTML = "";
  estado.preguntas.forEach((p, i) => {
    const r = estado.respuestas[i];
    const acierto = r === p.correcta;
    const li = document.createElement("li");
    if (!acierto) li.classList.add("fallo");

    const enun = document.createElement("p");
    enun.className = "enunciado";
    enun.textContent = estado.temasTest.length > 1 ? `[${TEMAS[p.tema].titulo}] ${p.pregunta}` : p.pregunta;
    li.appendChild(enun);

    const tuya = document.createElement("p");
    tuya.className = `tu-respuesta ${acierto ? "ok" : "ko"}`;
    tuya.textContent = `${acierto ? "✔" : "✘"} Tu respuesta: ${LETRAS[r]}) ${p.opciones[r]}`;
    li.appendChild(tuya);

    if (!acierto) {
      const buena = document.createElement("p");
      buena.textContent = `Respuesta correcta: ${LETRAS[p.correcta]}) ${p.opciones[p.correcta]}`;
      li.appendChild(buena);
    }
    if (p.explicacion) {
      const exp = document.createElement("p");
      exp.className = "nota-exp";
      exp.textContent = p.explicacion;
      li.appendChild(exp);
    }
    lista.appendChild(li);
  });
}

/* ---------- Arranque ---------- */

function iniciarApp() {
  const modoGuardado = leerModo();
  if (modoGuardado) {
    const radio = document.querySelector(`input[name="modo"][value="${modoGuardado}"]`);
    if (radio) radio.checked = true;
  }

  $("btn-comenzar").addEventListener("click", () => comenzarTest(temasOrdenados()));
  $("btn-todos").addEventListener("click", alternarTodos);
  $("btn-anterior").addEventListener("click", () => irA(estado.actual - 1));
  $("btn-siguiente").addEventListener("click", () => irA(estado.actual + 1));
  $("btn-finalizar").addEventListener("click", finalizarTest);
  $("btn-salir").addEventListener("click", salirTest);
  $("btn-repetir").addEventListener("click", () => comenzarTest(estado.temasTest));
  $("btn-volver").addEventListener("click", volverInicio);

  // Atajos de teclado en el test: flechas para navegar, 1-8 o A-H para responder
  document.addEventListener("keydown", (e) => {
    if ($("pantalla-test").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "ArrowLeft") irA(estado.actual - 1);
    else if (e.key === "ArrowRight") irA(estado.actual + 1);
    else {
      const opciones = estado.preguntas[estado.actual].opciones.length;
      let j = -1;
      if (/^[1-8]$/.test(e.key)) j = Number(e.key) - 1;
      else if (/^[a-h]$/i.test(e.key)) j = LETRAS.indexOf(e.key.toUpperCase());
      if (j >= 0 && j < opciones) responder(j);
    }
  });

  pintarTemas();
}
