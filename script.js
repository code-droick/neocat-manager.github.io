// Utilidades
const hermanos = [];
const grupos = [];
const preparaciones = [];
const celebraciones = [];

function mostrarFormularioHermano() {
  document.getElementById("form-hermano").classList.toggle("hidden");
}

function mostrarFormularioGrupo() {
  document.getElementById("form-grupo").classList.toggle("hidden");
  actualizarMiembrosDisponibles();
}

function mostrarFormularioPreparacion() {
  document.getElementById("form-preparacion").classList.toggle("hidden");
  actualizarGruposDisponibles();
}

function mostrarFormularioCelebracion() {
  document.getElementById("form-celebracion").classList.toggle("hidden");
  actualizarPreparacionesDisponibles();
}

// Agregar hermano
document.getElementById("form-hermano").addEventListener("submit", function(e) {
  e.preventDefault();
  const inputs = e.target.querySelectorAll("input, select");
  const nuevoHermano = {
    nombre: inputs[0].value,
    apellido: inputs[1].value,
    sexo: inputs[2].value,
    nacimiento: inputs[3].value,
    rol: inputs[4].value
  };

  // Validación de roles
  const rolCount = hermanos.filter(h => h.rol === nuevoHermano.rol).length;
  if ((nuevoHermano.rol === "responsable" && rolCount >= 2) ||
      (nuevoHermano.rol === "co-responsable" && rolCount >= 5)) {
    alert("Se ha alcanzado el límite de este rol.");
    return;
  }

  hermanos.push(nuevoHermano);
  actualizarListaHermanos();
  e.target.reset();
});

// Mostrar hermanos
function actualizarListaHermanos() {
  const contenedor = document.getElementById("lista-hermanos");
  contenedor.innerHTML = "";
  hermanos.forEach((h, i) => {
    const div = document.createElement("div");
    div.textContent = `${h.nombre} ${h.apellido} (${h.rol})`;
    contenedor.appendChild(div);
  });
}

// Mostrar miembros disponibles para grupos
function actualizarMiembrosDisponibles() {
  const contenedor = document.getElementById("miembros-disponibles");
  contenedor.innerHTML = "";
  hermanos.forEach((h, i) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${i}"> ${h.nombre} ${h.apellido}`;
    contenedor.appendChild(label);
  });
}

// Crear grupo
document.getElementById("form-grupo").addEventListener("submit", function(e) {
  e.preventDefault();
  const nombre = e.target.querySelector("input").value;
  const tipo = e.target.querySelector("select").value;
  const seleccionados = Array.from(e.target.querySelectorAll("input[type='checkbox']:checked")).map(cb => hermanos[cb.value]);

  // Validación de duplicados
  for (const h of seleccionados) {
    if (grupos.some(g => g.miembros.includes(h))) {
      alert(`${h.nombre} ya está en otro grupo.`);
      return;
    }
  }

  grupos.push({ nombre, tipo, miembros: seleccionados });
  actualizarListaGrupos();
  e.target.reset();
});

// Mostrar grupos
function actualizarListaGrupos() {
  const contenedor = document.getElementById("lista-grupos");
  contenedor.innerHTML = "";
  grupos.forEach(g => {
    const div = document.createElement("div");
    div.textContent = `${g.nombre} (${g.tipo}) - Miembros: ${g.miembros.map(m => m.nombre).join(", ")}`;
    contenedor.appendChild(div);
  });
}

// Actualizar grupos para preparaciones
function actualizarGruposDisponibles() {
  const select = document.getElementById("select-grupo");
  select.innerHTML = `<option value="">Seleccionar grupo</option>`;
  grupos.forEach((g, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = g.nombre;
    select.appendChild(option);
  });
}

// Actualizar preparaciones para celebraciones
function actualizarPreparacionesDisponibles() {
  const select = document.getElementById("select-preparacion");
  select.innerHTML = `<option value="">Seleccionar preparación</option>`;
  preparaciones.forEach((p, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${p.tipo} - ${p.fecha}`;
    select.appendChild(option);
  });
}
function generarCalendario() {
  const contenedor = document.getElementById("calendario-mes");
  contenedor.innerHTML = "<h3>Eventos del Mes</h3>";

  const eventos = [...preparaciones, ...celebraciones];
  const hoy = new Date();
  const mes = hoy.getMonth();
  const año = hoy.getFullYear();

  const eventosMes = eventos.filter(ev => {
    const fecha = new Date(ev.fecha);
    return fecha.getMonth() === mes && fecha.getFullYear() === año;
  });

  const cumpleaños = hermanos.filter(h => {
    const fecha = new Date(h.nacimiento);
    return fecha.getMonth() === mes;
  });

  eventosMes.forEach(ev => {
    const div = document.createElement("div");
    div.className = "evento";
    div.textContent = `${ev.tipo} - ${ev.fecha}`;
    contenedor.appendChild(div);
  });

  cumpleaños.forEach(h => {
    const div = document.createElement("div");
    div.className = "evento";
    div.textContent = `🎂 Cumpleaños de ${h.nombre} ${h.apellido} - ${new Date(h.nacimiento).toLocaleDateString()}`;
    contenedor.appendChild(div);
  });
}
function generarEstadisticas() {
  const tipo = document.getElementById("tipo-estadistica").value;
  const contenedor = document.getElementById("estadisticas-resultados");
  contenedor.innerHTML = "";

  if (tipo === "asistencia-celebraciones") {
    const total = celebraciones.length;
    const asistencias = celebraciones.reduce((acc, c) => acc + c.asistentes.length, 0);
    const promedio = total ? (asistencias / total).toFixed(2) : 0;
    contenedor.textContent = `Promedio de asistencia por celebración: ${promedio}`;
  }

  if (tipo === "asistencia-eucaristias") {
    const eucaristias = celebraciones.filter(c => c.tipo === "eucaristia");
    const total = eucaristias.length;
    const asistencias = eucaristias.reduce((acc, c) => acc + c.asistentes.length, 0);
    const promedio = total ? (asistencias / total).toFixed(2) : 0;
    contenedor.textContent = `Promedio de asistencia por eucaristía: ${promedio}`;
  }

  if (tipo === "miembro") {
    const select = document.createElement("select");
    hermanos.forEach((h, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${h.nombre} ${h.apellido}`;
      select.appendChild(option);
    });
    select.onchange = () => {
      const hermano = hermanos[select.value];
      const asistencias = celebraciones.filter(c => c.asistentes.includes(hermano));
      contenedor.innerHTML = `Asistencias de ${hermano.nombre}: ${asistencias.length}`;
    };
    contenedor.appendChild(select);
  }
}
document.getElementById("tipo-estadistica").addEventListener("change", generarEstadisticas);
