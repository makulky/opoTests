/* OpoTests - supuestos prácticos corregidos por Claude (capacidad "sample" de claude.ai) */

const NUM_SUPUESTOS = 5;
const PUNTOS_POR_SUPUESTO = 12;
const NOTA_MAXIMA_SUPUESTO = NUM_SUPUESTOS * PUNTOS_POR_SUPUESTO; // 60
const NOTA_APROBADO_SUPUESTO = 30;
const PREGUNTAS_MATERIAL_POR_TEMA = 8;

// Perfil del puesto (transcrito de la ficha "supuestos guia.jpeg")
const PERFIL_PUESTO = `Puesto: Técnico/a de Servicios Generales (Grupo A2, escala de Administración General) de la Secretaría General de un Ayuntamiento andaluz. Superior jerárquico: Secretario General. Centro: Casa Consistorial.
Responsabilidades generales: asesorar y emitir informes jurídicos con carácter general; tramitación de procedimientos de responsabilidad patrimonial.
Tareas más significativas:
1. Instrucción y tramitación íntegra de expedientes de responsabilidad patrimonial del municipio (decretos de incoación, requerimientos, informes jurídicos, emplazamientos, testigos, propuestas de resolución, informes sobre cuantificación de daños, etc.).
2. Tramitar expedientes para el ejercicio de prerrogativas de los entes locales respecto a sus bienes (investigación, deslinde, recuperación de oficio, desahucio administrativo...).
3. Tramitación íntegra de expedientes de licencias y autorizaciones para cesiones temporales de bienes municipales.
4. Emisión de propuesta de resolución de expedientes de ocupación de vía pública y dependencias municipales.
5. Tramitar expedientes del Área o Concejalía de Educación.
6. Tramitar expedientes de Pleno y elaborar providencias, propuestas, certificados, oficios y notificaciones.
7. Elaborar, tramitar y redactar Ordenanzas administrativas y Reglamentos (borradores de texto, informes, propuestas, certificados, oficios y publicaciones).
8. Elaborar certificados de expedientes de carácter general (desarrollo local, cultura, biblioteca, etc.).
9. Elaborar documentos e informes que requiera Secretaría, seguimiento y gestión de expedientes y relaciones con otras administraciones (salud, empleo, convenios administrativos, etc.).
10. Emitir informes jurídicos sobre procedimientos de concesión de subvenciones y premios.
11. Emitir informes jurídicos sobre expedientes sancionadores (venta ambulante, contaminación acústica, tenencia de animales peligrosos, residuos y limpieza pública) y órdenes de ejecución de limpieza de solares y reclamaciones de consumo.
12. Cualquier otra tarea propia de su categoría que le sea encomendada.`;

// Títulos completos de los temas (para dar contexto a Claude)
const TITULOS_TEMAS = {
  29: "Los contratos del sector público",
  30: "Disposiciones generales sobre la contratación del sector público",
  31: "Las partes en los contratos del sector público",
  32: "Régimen de invalidez y Recurso Especial en Materia de Contratación",
  33: "Objeto, presupuesto base de licitación, valor estimado, precio del contrato y su revisión",
  34: "Adjudicación de los contratos de las Administraciones Públicas: Normas generales y procedimientos de adjudicación. El perfil de contratante",
  35: "Efectos de los contratos. Prerrogativas de la Administración Pública",
  36: "El contrato de obras",
  37: "El contrato de suministro",
  38: "El contrato de servicios",
  39: "La contratación administrativa en las Entidades Locales",
  40: "La expropiación forzosa: concepto y naturaleza. Sujetos, objeto y causa. El procedimiento expropiatorio. Reversión",
  41: "El derecho urbanístico. Legislación vigente. La disciplina territorial y urbanística en Andalucía",
  42: "La responsabilidad patrimonial de la Administración Pública",
  43: "La potestad sancionadora: concepto y significado. Principios del ejercicio de la potestad sancionadora. Especialidades del procedimiento en materia sancionadora. Medidas sancionadoras administrativas. Especial referencia a la potestad sancionadora local",
  44: "Las propiedades públicas. El dominio público",
  45: "El Patrimonio Privado de las Administraciones Públicas",
  46: "Conservación y defensa de los bienes locales. Prerrogativas de los entes locales. El Inventario de Bienes Locales",
  47: "La potestad reglamentaria de las Entidades Locales: Reglamentos y Ordenanzas. Procedimiento de elaboración. Los Bandos. Reglamento Orgánico",
  48: "El Municipio. El término municipal. Creación de municipios y alteraciones del término municipal",
  49: "La organización municipal. Órganos necesarios y complementarios. Grupos políticos y participación vecinal",
  50: "Las competencias municipales: sistema de determinación. Competencias propias, delegadas y distintas de las propias",
  51: "El sistema electoral local. Causas de inelegibilidad e incompatibilidad",
  52: "Impugnación de los actos y acuerdos locales y ejercicio de acciones. La sustitución y disolución de corporaciones locales",
  53: "Régimen de sesiones y acuerdos de los órganos de gobierno local",
  54: "El personal al servicio de las Entidades Locales",
  55: "El acceso a la función pública local: principios reguladores. Requisitos. Sistemas selectivos. La extinción de la condición de empleado público",
  56: "El régimen de provisión y movilidad de puestos de trabajos del personal funcionario de carrera",
  57: "Las situaciones administrativas del personal funcionario de carrera",
  58: "Derechos de los funcionarios públicos locales. Derechos económicos",
  59: "Actividad subvencional de las Administraciones Públicas: tipos de subvenciones",
  60: "La actividad financiera. El sistema Tributario Español: La Ley General Tributaria",
};

const VALORACIONES = {
  bien: { texto: "Bien", clase: "ok" },
  mejorable: { texto: "Mejorable", clase: "medio" },
  incompleta: { texto: "Incompleta", clase: "medio" },
  mal: { texto: "Incorrecta", clase: "ko" },
  en_blanco: { texto: "En blanco", clase: "blanco" },
};

const sup = {
  sample: null,         // función de claude.use("sample"), o null si no está disponible
  disponible: false,
  supuestos: [],        // [{ tema, titulo, enunciado, pregunta, puntosClave: [] }]
  respuestas: [],
  correccion: null,     // { preguntas: [...], comentarioGeneral }
  controlador: null,    // AbortController de la llamada en curso
  reintentar: null,     // acción que repite la última llamada fallida
};

/* ---------- Disponibilidad ---------- */

async function prepararSupuestos() {
  if (!window.claude || typeof window.claude.use !== "function") {
    marcarNoDisponible();
    return;
  }
  try {
    sup.sample = await window.claude.use("sample");
  } catch (e) {
    sup.sample = null;
  }
  if (sup.sample) {
    sup.disponible = true;
    $("sup-no-disponible").hidden = true;
    $("btn-generar").disabled = false;
  } else {
    marcarNoDisponible();
  }
}

function marcarNoDisponible(texto) {
  sup.disponible = false;
  const aviso = $("sup-no-disponible");
  aviso.textContent = texto || "Los supuestos prácticos solo funcionan abriendo OpoTests desde su enlace de claude.ai, porque es Claude quien prepara y corrige las preguntas. Los tests funcionan en cualquier sitio.";
  aviso.hidden = false;
  $("btn-generar").disabled = true;
}

/* ---------- Estado de carga y errores ---------- */

function mostrarCargando(id, texto) {
  const caja = $(id);
  caja.querySelector(".cargando-texto").textContent = texto;
  caja.hidden = false;
}

function ocultarCargando(id) {
  $(id).hidden = true;
}

function mensajeError(e) {
  switch (e && e.code) {
    case "not_granted":
      return "No has dado permiso para que esta página use Claude. Vuelve a abrir la página y acepta el permiso para usar los supuestos prácticos.";
    case "sampling_disabled":
    case "capability_disabled":
    case "not_declared":
    case "capability_removed":
      return "Claude no está disponible para tu cuenta en esta página.";
    case "rate_limited":
      return "Has alcanzado el límite de uso de Claude por ahora. Inténtalo de nuevo más tarde.";
    case "session_expired":
      return "Tu sesión de claude.ai ha caducado. Vuelve a iniciar sesión y reintenta.";
    case "invalid_json":
    case "empty_completion":
      return "La respuesta de Claude no tenía el formato esperado. Pulsa Reintentar.";
    case "refused":
      return "Claude no ha podido completar esta petición. Pulsa Reintentar.";
    default:
      return "No se ha podido conectar con Claude. Comprueba tu conexión y pulsa Reintentar.";
  }
}

function esErrorPermanente(e) {
  return ["not_granted", "sampling_disabled", "capability_disabled", "not_declared", "capability_removed"]
    .includes(e && e.code);
}

function mostrarError(idAviso, e, reintentar) {
  if (esErrorPermanente(e)) {
    marcarNoDisponible(mensajeError(e));
    if (idAviso !== "sup-error-inicio") mostrarPantalla("pantalla-supuesto-inicio");
    return;
  }
  const caja = $(idAviso);
  caja.querySelector(".error-texto").textContent = mensajeError(e);
  caja.hidden = false;
  sup.reintentar = reintentar;
}

/* ---------- Generación ---------- */

function limpiarTexto(t) {
  return String(t || "").replace(/\[cite:[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
}

function materialDeTema(n) {
  const tema = TEMAS[n];
  const lineas = barajar(tema.preguntas).slice(0, PREGUNTAS_MATERIAL_POR_TEMA).map((p) => {
    const exp = limpiarTexto(p.explicacion);
    return `- ${limpiarTexto(p.pregunta)} → ${limpiarTexto(p.opciones[p.correcta])}${exp ? ` (${exp})` : ""}`;
  });
  return `TEMA ${n}: ${TITULOS_TEMAS[n] || tema.titulo}\n${lineas.join("\n")}`;
}

function promptGeneracion(temas) {
  return `Eres un tribunal de oposiciones que prepara la parte de SUPUESTOS PRÁCTICOS de un examen para el siguiente puesto:

${PERFIL_PUESTO}

Prepara exactamente ${NUM_SUPUESTOS} supuestos prácticos, uno por cada tema de la lista de abajo y en ese mismo orden. Cada supuesto:
- Plantea una situación realista y concreta que este técnico tendría que resolver en su puesto en el Ayuntamiento (un expediente, una reclamación, una consulta del Secretario, un acuerdo de Pleno…), con datos concretos (fechas, importes, personas o entidades ficticias, órganos que intervienen).
- Termina con una pregunta de desarrollo (o dos apartados como máximo) que obligue a aplicar la normativa del tema: procedimiento, plazos, órgano competente, requisitos, fundamentos jurídicos, documentos a elaborar.
- Se apoya en el contenido del material de preguntas tipo test del tema que te doy, sin salirse de lo que cubre ese tema.
- Se puede responder por escrito en unos 15-20 minutos.
Para cada supuesto indica también entre 4 y 7 "puntosClave": los elementos que debe contener una respuesta completa (normas y artículos, plazos, órganos, pasos). Se usarán después para corregir.

Material por tema (preguntas tipo test del temario con su respuesta correcta):

${temas.map(materialDeTema).join("\n\n")}

Escribe todo en español. Responde solo con un objeto JSON con esta forma:
{"supuestos":[{"tema":29,"titulo":"Título breve del supuesto","enunciado":"Descripción de la situación…","pregunta":"¿Qué…?","puntosClave":["…","…"]}]}`;
}

function validarSupuestos(datos, temas) {
  const lista = datos && Array.isArray(datos.supuestos) ? datos.supuestos : null;
  if (!lista || lista.length < NUM_SUPUESTOS) return null;
  const limpios = lista.slice(0, NUM_SUPUESTOS).map((s, i) => ({
    tema: temas.includes(Number(s && s.tema)) ? Number(s.tema) : temas[i],
    titulo: String((s && s.titulo) || `Supuesto ${i + 1}`),
    enunciado: String((s && s.enunciado) || ""),
    pregunta: String((s && s.pregunta) || ""),
    puntosClave: Array.isArray(s && s.puntosClave) ? s.puntosClave.map(String) : [],
  }));
  return limpios.every((s) => s.enunciado && s.pregunta) ? limpios : null;
}

async function generarSupuestos() {
  if (!sup.disponible) return;
  $("sup-error-inicio").hidden = true;
  $("btn-generar").disabled = true;
  mostrarCargando("sup-cargando-inicio", "Claude está preparando tus 5 supuestos prácticos… (suele tardar entre 30 segundos y 2 minutos)");

  const disponibles = temasDisponibles();
  const temas = barajar(disponibles).slice(0, Math.min(NUM_SUPUESTOS, disponibles.length)).sort((a, b) => a - b);
  sup.controlador = new AbortController();
  try {
    const datos = await sup.sample.json(promptGeneracion(temas), {
      modelTier: "default",
      cache: false,
      signal: sup.controlador.signal,
    });
    const supuestos = validarSupuestos(datos, temas);
    if (!supuestos) throw { code: "invalid_json" };
    sup.supuestos = supuestos;
    sup.respuestas = supuestos.map(() => "");
    sup.correccion = null;
    pintarSupuestos();
    mostrarPantalla("pantalla-supuesto");
  } catch (e) {
    if (!e || e.code !== "cancelled") mostrarError("sup-error-inicio", e, generarSupuestos);
  } finally {
    sup.controlador = null;
    ocultarCargando("sup-cargando-inicio");
    $("btn-generar").disabled = !sup.disponible;
  }
}

/* ---------- Responder ---------- */

function pintarSupuestos() {
  const cont = $("lista-supuestos");
  cont.innerHTML = "";
  sup.supuestos.forEach((s, i) => {
    const art = document.createElement("article");
    art.className = "tarjeta supuesto";

    const cab = document.createElement("p");
    cab.className = "supuesto-cabecera";
    cab.textContent = `Supuesto ${i + 1} · ${TEMAS[s.tema] ? TEMAS[s.tema].titulo : `Tema ${s.tema}`} · ${PUNTOS_POR_SUPUESTO} puntos`;
    art.appendChild(cab);

    const titulo = document.createElement("h3");
    titulo.textContent = s.titulo;
    art.appendChild(titulo);

    const enun = document.createElement("p");
    enun.className = "supuesto-enunciado";
    enun.textContent = s.enunciado;
    art.appendChild(enun);

    const preg = document.createElement("p");
    preg.className = "supuesto-pregunta";
    preg.textContent = s.pregunta;
    art.appendChild(preg);

    const label = document.createElement("label");
    label.className = "sr-only";
    label.htmlFor = `respuesta-${i}`;
    label.textContent = `Tu respuesta al supuesto ${i + 1}`;
    art.appendChild(label);

    const area = document.createElement("textarea");
    area.id = `respuesta-${i}`;
    area.className = "respuesta";
    area.rows = 9;
    area.placeholder = "Escribe aquí tu respuesta desarrollada…";
    area.value = sup.respuestas[i];
    area.addEventListener("input", () => {
      sup.respuestas[i] = area.value;
      actualizarProgresoSupuestos();
    });
    art.appendChild(area);

    cont.appendChild(art);
  });
  $("sup-error-test").hidden = true;
  actualizarProgresoSupuestos();
}

function actualizarProgresoSupuestos() {
  const hechas = sup.respuestas.filter((r) => r.trim()).length;
  $("sup-progreso").textContent = `${hechas} de ${sup.supuestos.length} respondidos · ${NOTA_MAXIMA_SUPUESTO} puntos en total`;
}

/* ---------- Corrección ---------- */

function promptCorreccion() {
  const bloques = sup.supuestos.map((s, i) => {
    const r = sup.respuestas[i].trim();
    return `=== SUPUESTO ${i + 1} (Tema ${s.tema}) ===
Enunciado: ${s.enunciado}
Pregunta: ${s.pregunta}
Puntos clave de una respuesta completa:
${s.puntosClave.map((p) => `- ${p}`).join("\n") || "- (no indicados)"}
RESPUESTA DEL OPOSITOR:
${r || "(en blanco)"}`;
  });

  return `Eres miembro del tribunal de una oposición al siguiente puesto y corriges la parte de supuestos prácticos:

${PERFIL_PUESTO}

Corrige las ${NUM_SUPUESTOS} respuestas del opositor. Cada supuesto vale ${PUNTOS_POR_SUPUESTO} puntos (total ${NOTA_MAXIMA_SUPUESTO}; se aprueba con ${NOTA_APROBADO_SUPUESTO}).
Criterios:
- Puntúa de 0 a ${PUNTOS_POR_SUPUESTO} en pasos de 0,5, con la exigencia de un tribunal real pero de forma justa.
- Valora la corrección jurídica, que aplique la normativa al caso concreto (no solo teoría), la cita de normas y plazos, el órgano competente, el procedimiento, la estructura y el grado de desarrollo.
- Usa los puntos clave como guía, pero acepta otros planteamientos correctos.
- Una respuesta en blanco vale 0 y su valoración es "en_blanco". Un error jurídico grave debe restar claramente.
- "valoracion" es una de: "bien" (correcta y bien desarrollada), "mejorable" (correcta en lo esencial pero se podía desarrollar más), "incompleta" (le faltan partes importantes), "mal" (errónea o no responde a lo que se pregunta), "en_blanco".
- "comentario": 2-4 frases dirigidas al opositor (de tú) sobre qué está bien y qué es erróneo.
- "faltaDesarrollar": qué debería haber añadido o desarrollado más para la máxima nota (cadena vacía si nada).

${bloques.join("\n\n")}

Escribe en español. Responde solo con un objeto JSON con esta forma, con un elemento por supuesto y en el mismo orden:
{"preguntas":[{"puntos":9.5,"valoracion":"mejorable","comentario":"…","faltaDesarrollar":"…"}],"comentarioGeneral":"…"}`;
}

function normalizarCorreccion(datos) {
  const lista = datos && Array.isArray(datos.preguntas) ? datos.preguntas : null;
  if (!lista || lista.length < sup.supuestos.length) return null;
  const preguntas = sup.supuestos.map((_, i) => {
    const c = lista[i] || {};
    const enBlanco = !sup.respuestas[i].trim();
    let puntos = Number(String(c.puntos).replace(",", "."));
    if (!Number.isFinite(puntos) || enBlanco) puntos = 0;
    puntos = Math.min(PUNTOS_POR_SUPUESTO, Math.max(0, Math.round(puntos * 2) / 2));
    let valoracion = enBlanco ? "en_blanco" : String(c.valoracion || "");
    if (!VALORACIONES[valoracion]) valoracion = puntos >= 9 ? "bien" : puntos >= 6 ? "mejorable" : "mal";
    return {
      puntos,
      valoracion,
      comentario: String(c.comentario || ""),
      faltaDesarrollar: String(c.faltaDesarrollar || ""),
    };
  });
  return { preguntas, comentarioGeneral: String((datos && datos.comentarioGeneral) || "") };
}

async function entregarSupuestos() {
  const vacias = sup.respuestas.filter((r) => !r.trim()).length;
  if (vacias === sup.supuestos.length) {
    await avisar("No has escrito ninguna respuesta todavía.");
    return;
  }
  if (vacias > 0 && !(await confirmar(`Tienes ${vacias} supuesto${vacias === 1 ? "" : "s"} sin responder, que puntuará${vacias === 1 ? "" : "n"} 0. ¿Entregar de todas formas?`))) return;
  corregirSupuestos();
}

async function corregirSupuestos() {
  $("sup-error-test").hidden = true;
  $("btn-entregar").disabled = true;
  document.querySelectorAll("#lista-supuestos textarea").forEach((t) => { t.readOnly = true; });
  mostrarCargando("sup-cargando-test", "Claude está corrigiendo tus respuestas… (suele tardar entre 30 segundos y 2 minutos)");

  sup.controlador = new AbortController();
  try {
    const datos = await sup.sample.json(promptCorreccion(), {
      modelTier: "complex",
      signal: sup.controlador.signal,
    });
    const correccion = normalizarCorreccion(datos);
    if (!correccion) throw { code: "invalid_json" };
    sup.correccion = correccion;
    pintarResultadosSupuestos();
    mostrarPantalla("pantalla-supuesto-resultados");
  } catch (e) {
    if (!e || e.code !== "cancelled") mostrarError("sup-error-test", e, corregirSupuestos);
  } finally {
    sup.controlador = null;
    ocultarCargando("sup-cargando-test");
    $("btn-entregar").disabled = false;
    document.querySelectorAll("#lista-supuestos textarea").forEach((t) => { t.readOnly = false; });
  }
}

function pintarResultadosSupuestos() {
  const { preguntas, comentarioGeneral } = sup.correccion;
  const total = preguntas.reduce((acc, p) => acc + p.puntos, 0);
  const aprobado = total >= NOTA_APROBADO_SUPUESTO;

  $("sup-res-nota").textContent = `${formatearNumero(total)} / ${NOTA_MAXIMA_SUPUESTO}`;
  const veredicto = $("sup-res-veredicto");
  veredicto.textContent = `${aprobado ? "APROBADO" : "SUSPENSO"} (mínimo ${NOTA_APROBADO_SUPUESTO} puntos)`;
  veredicto.className = `veredicto ${aprobado ? "ok" : "ko"}`;
  $("sup-res-general").textContent = comentarioGeneral;
  $("sup-res-general").hidden = !comentarioGeneral;

  const lista = $("sup-correccion");
  lista.innerHTML = "";
  sup.supuestos.forEach((s, i) => {
    const c = preguntas[i];
    const v = VALORACIONES[c.valoracion];
    const li = document.createElement("li");
    li.className = `sup-item ${v.clase}`;

    const cab = document.createElement("div");
    cab.className = "sup-item-cabecera";
    const tit = document.createElement("p");
    tit.className = "enunciado";
    tit.textContent = `${s.titulo} · ${TEMAS[s.tema] ? TEMAS[s.tema].titulo : `Tema ${s.tema}`}`;
    const nota = document.createElement("span");
    nota.className = `etiqueta ${v.clase}`;
    nota.textContent = `${formatearNumero(c.puntos)} / ${PUNTOS_POR_SUPUESTO} · ${v.texto}`;
    cab.append(tit, nota);
    li.appendChild(cab);

    const anadir = (clase, etiqueta, texto) => {
      if (!texto) return;
      const p = document.createElement("p");
      p.className = clase;
      const b = document.createElement("strong");
      b.textContent = `${etiqueta} `;
      p.append(b, document.createTextNode(texto));
      li.appendChild(p);
    };
    anadir("nota-exp", "Supuesto:", `${s.enunciado} ${s.pregunta}`);
    anadir("sup-tu-respuesta", "Tu respuesta:", sup.respuestas[i].trim() || "— Sin responder");
    anadir("", "Corrección:", c.comentario);
    anadir("", "Podrías haber desarrollado más:", c.faltaDesarrollar);

    if (s.puntosClave.length) {
      const b = document.createElement("p");
      b.innerHTML = "<strong>Puntos clave de una respuesta completa:</strong>";
      li.appendChild(b);
      const ul = document.createElement("ul");
      ul.className = "puntos-clave";
      s.puntosClave.forEach((pc) => {
        const it = document.createElement("li");
        it.textContent = pc;
        ul.appendChild(it);
      });
      li.appendChild(ul);
    }
    lista.appendChild(li);
  });
}

/* ---------- Navegación ---------- */

function cancelarLlamada() {
  if (sup.controlador) sup.controlador.abort();
}

async function salirSupuestos() {
  if (sup.controlador) return;
  if (sup.respuestas.some((r) => r.trim()) && !(await confirmar("Si sales perderás tus respuestas. ¿Salir?"))) return;
  mostrarPantalla("pantalla-supuesto-inicio");
}

function iniciarSupuestos() {
  $("btn-generar").addEventListener("click", generarSupuestos);
  $("btn-cancelar-generar").addEventListener("click", cancelarLlamada);
  $("btn-cancelar-corregir").addEventListener("click", cancelarLlamada);
  $("btn-entregar").addEventListener("click", entregarSupuestos);
  $("btn-salir-supuesto").addEventListener("click", salirSupuestos);
  $("btn-nuevo-supuesto").addEventListener("click", () => {
    mostrarPantalla("pantalla-supuesto-inicio");
    generarSupuestos();
  });
  $("btn-sup-volver-inicio").addEventListener("click", () => mostrarPantalla("pantalla-eleccion"));
  document.querySelectorAll(".btn-reintentar").forEach((b) =>
    b.addEventListener("click", () => {
      b.closest(".aviso").hidden = true;
      if (sup.reintentar) sup.reintentar();
    }));
  prepararSupuestos();
}
