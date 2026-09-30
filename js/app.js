/* OpoTests - lógica de la aplicación */

const TEMA_INICIAL = 29;
const TEMA_FINAL = 60;
const LETRAS = "ABCDEFGH";

// Número de preguntas del test según la selección de temas
const PREGUNTAS_UN_TEMA = 30;
const PREGUNTAS_DOS_TEMAS = 60;
const PREGUNTAS_VARIOS_TEMAS = 80;
const PREGUNTAS_TODOS_TEMAS = 100;

// Simulacro: modo examen con todos los temas
const DURACION_SIMULACRO_MS = 120 * 60 * 1000;
const NOTA_MAXIMA = 40;
const NOTA_APROBADO = 18;

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
  simulacro: false,
  penalizacion: 0, // cada N fallos resta 1 acierto (0 = sin penalización)
  inicio: 0,       // Date.now() al empezar el simulacro
  fin: 0,
  temporizador: null,
  tiempoAgotado: false,
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
function guardarPenalizacion(n) {
  try { localStorage.setItem("opotests-penalizacion", String(n)); } catch (e) { /* sin almacenamiento */ }
}
function leerPenalizacion() {
  try { return localStorage.getItem("opotests-penalizacion"); } catch (e) { return null; }
}

function modoSeleccionado() {
  return document.querySelector('input[name="modo"]:checked').value;
}

function esSimulacro(modo, temas) {
  return modo === "examen" && esSeleccionTodos(temas);
}

function formatearTiempo(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function formatearNumero(n) {
  return n.toFixed(2).replace(".", ",");
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
  if (esSeleccionTodos(temas)) return PREGUNTAS_TODOS_TEMAS;
  return temas.length === 2 ? PREGUNTAS_DOS_TEMAS : PREGUNTAS_VARIOS_TEMAS;
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
  $("config-simulacro").hidden = !esSimulacro(modoSeleccionado(), temas);

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

  estado.modo = modoSeleccionado();
  guardarModo(estado.modo);

  const objetivo = preguntasObjetivo(temas);
  const preguntas = sortearPreguntas(temas, objetivo);
  if (preguntas.length === 0) return;
  detenerCronometro();
  estado.temasTest = temas;
  estado.preguntas = preguntas;
  estado.respuestas = preguntas.map(() => null);
  estado.actual = 0;
  estado.finalizado = false;
  estado.simulacro = esSimulacro(estado.modo, temas);
  estado.tiempoAgotado = false;
  if (estado.simulacro) {
    estado.penalizacion = Number($("sel-penalizacion").value);
    guardarPenalizacion(estado.penalizacion);
    iniciarCronometro();
  }
  $("cronometro").hidden = !estado.simulacro;

  const total = preguntas.length;
  const modoTexto = estado.simulacro ? "Simulacro de examen" : estado.modo === "estudio" ? "Modo estudio" : "Modo examen";
  $("test-titulo").textContent = `${descripcionTemas(temas)} · ${modoTexto}`;
  $("marcador").hidden = estado.modo !== "estudio";
  const aviso = $("aviso-test");
  aviso.hidden = total >= objetivo;
  aviso.textContent = `Solo hay ${plural(total, "pregunta")} en ${temas.length === 1 ? "este tema" : "los temas elegidos"}.`;

  pintarMapa();
  pintarPregunta();
  mostrarPantalla("pantalla-test");
}

/* ---------- Cronómetro del simulacro ---------- */

function iniciarCronometro() {
  estado.inicio = Date.now();
  estado.fin = 0;
  actualizarCronometro();
  estado.temporizador = setInterval(actualizarCronometro, 1000);
}

function detenerCronometro() {
  if (estado.temporizador !== null) clearInterval(estado.temporizador);
  estado.temporizador = null;
  if (estado.simulacro && !estado.fin) estado.fin = Date.now();
}

function actualizarCronometro() {
  const transcurrido = Math.min(Date.now() - estado.inicio, DURACION_SIMULACRO_MS);
  const crono = $("cronometro");
  crono.textContent = `⏱ ${formatearTiempo(transcurrido)} / ${formatearTiempo(DURACION_SIMULACRO_MS)}`;
  crono.classList.toggle("final", DURACION_SIMULACRO_MS - transcurrido <= 10 * 60 * 1000);
  if (transcurrido >= DURACION_SIMULACRO_MS) finalizarTest(true);
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

function finalizarTest(porTiempo = false) {
  if (estado.finalizado) return;
  if (!porTiempo) {
    if (contarRespondidas() < estado.preguntas.length) return;
    if (estado.modo === "examen" && !confirm("¿Seguro que quieres finalizar el examen?")) return;
  }
  estado.finalizado = true;
  estado.tiempoAgotado = porTiempo;
  detenerCronometro();
  if (porTiempo) alert("Se han agotado los 120 minutos. El examen se ha entregado automáticamente; las preguntas sin responder cuentan en blanco.");
  pintarResultados();
  mostrarPantalla("pantalla-resultados");
}

function salirTest() {
  if (contarRespondidas() > 0 && !confirm("Si sales perderás el progreso de este test. ¿Salir?")) return;
  volverInicio();
}

function volverInicio() {
  detenerCronometro();
  pintarTemas();
  mostrarPantalla("pantalla-inicio");
}

/* ---------- Resultados ---------- */

function pintarResultados() {
  const total = estado.preguntas.length;
  const aciertos = contarAciertos();
  const enBlanco = total - contarRespondidas();
  const fallos = total - aciertos - enBlanco;

  $("res-titulo").textContent = `Resultados · ${descripcionTemas(estado.temasTest)}` +
    (estado.simulacro ? " · Simulacro" : "");

  const veredicto = $("res-veredicto");
  const detalle = $("res-detalle");
  if (estado.simulacro) {
    const descuento = estado.penalizacion ? fallos / estado.penalizacion : 0;
    const netos = Math.max(0, aciertos - descuento);
    const puntos = (netos / total) * NOTA_MAXIMA;
    const aprobado = puntos >= NOTA_APROBADO;
    $("res-nota").textContent = `${formatearNumero(puntos)} / ${NOTA_MAXIMA}`;
    veredicto.textContent = aprobado
      ? `APROBADO (mínimo ${NOTA_APROBADO} puntos)`
      : `SUSPENSO (mínimo ${NOTA_APROBADO} puntos)`;
    veredicto.className = `veredicto ${aprobado ? "ok" : "ko"}`;
    veredicto.hidden = false;
    detalle.textContent = [
      `Tiempo: ${formatearTiempo(estado.fin - estado.inicio)}${estado.tiempoAgotado ? " (tiempo agotado)" : ""}`,
      `En blanco: ${enBlanco}`,
      estado.penalizacion
        ? `Penalización: cada ${estado.penalizacion} fallos resta 1 acierto (−${formatearNumero(descuento)})`
        : "Sin penalización",
      `Aciertos netos: ${formatearNumero(netos)}`,
    ].join(" · ");
    detalle.hidden = false;
  } else {
    $("res-nota").textContent = formatearNumero((aciertos / total) * 10);
    veredicto.hidden = true;
    detalle.hidden = true;
  }
  $("res-aciertos").textContent = aciertos;
  $("res-fallos").textContent = fallos;
  $("res-porcentaje").textContent = `${Math.round((aciertos / total) * 100)}%`;

  const lista = $("correccion");
  lista.innerHTML = "";
  estado.preguntas.forEach((p, i) => {
    const r = estado.respuestas[i];
    const acierto = r === p.correcta;
    const li = document.createElement("li");
    if (r === null) li.classList.add("blanco");
    else if (!acierto) li.classList.add("fallo");

    const enun = document.createElement("p");
    enun.className = "enunciado";
    enun.textContent = estado.temasTest.length > 1 ? `[${TEMAS[p.tema].titulo}] ${p.pregunta}` : p.pregunta;
    li.appendChild(enun);

    const tuya = document.createElement("p");
    if (r === null) {
      tuya.className = "tu-respuesta blanco";
      tuya.textContent = "— Sin responder";
    } else {
      tuya.className = `tu-respuesta ${acierto ? "ok" : "ko"}`;
      tuya.textContent = `${acierto ? "✔" : "✘"} Tu respuesta: ${LETRAS[r]}) ${p.opciones[r]}`;
    }
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
  const penalizacionGuardada = leerPenalizacion();
  if (penalizacionGuardada !== null && $("sel-penalizacion").querySelector(`option[value="${penalizacionGuardada}"]`)) {
    $("sel-penalizacion").value = penalizacionGuardada;
  }
  document.querySelectorAll('input[name="modo"]').forEach((radio) =>
    radio.addEventListener("change", actualizarResumenSeleccion));

  $("btn-comenzar").addEventListener("click", () => comenzarTest(temasOrdenados()));
  $("btn-todos").addEventListener("click", alternarTodos);
  $("btn-anterior").addEventListener("click", () => irA(estado.actual - 1));
  $("btn-siguiente").addEventListener("click", () => irA(estado.actual + 1));
  $("btn-finalizar").addEventListener("click", () => finalizarTest());
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
